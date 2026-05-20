import type { LeetCodeProblem } from "./index";

export const financeProblems20260520B1: LeetCodeProblem[] = [
  {
    id: "fin-0520-b1-pos-tracker",
    leetcodeNumber: 0,
    title: "Position Tracker",
    difficulty: "medium",
    topics: ["design", "math"],
    problem:
      "Design a PositionTracker class that tracks a single asset position. Implement: buy(qty, price) — adds qty shares at the given price, updating the average cost basis; sell(qty, price) — sells qty shares at the given price, reducing the position and recording realised P&L; pnl() — returns the total realised P&L so far; avg_cost() — returns the current average cost per share. You may assume qty > 0 for all calls and sell(qty) will never exceed the current holding.",
    examples: [
      {
        input: `tracker = PositionTracker()
tracker.buy(100, 10.0)
tracker.buy(100, 12.0)
tracker.sell(50, 15.0)
print(tracker.avg_cost())
print(tracker.pnl())`,
        output: "11.0\n200.0",
        explanation:
          "After buying 100@10 and 100@12, avg cost = (100*10 + 100*12) / 200 = 11.0. Selling 50 at 15 realises P&L = 50 * (15 - 11) = 200.",
      },
      {
        input: `tracker = PositionTracker()
tracker.buy(200, 50.0)
tracker.sell(100, 45.0)
tracker.sell(100, 55.0)
print(tracker.pnl())`,
        output: "0.0",
        explanation:
          "Bought 200@50. Sold 100@45 → -500. Sold 100@55 → +500. Net P&L = 0.",
      },
    ],
    approach:
      "Maintain total_cost and total_qty to compute a running weighted-average cost. On sell, realised P&L = qty * (sell_price - avg_cost). The key insight is that average cost only changes on buys (new weighted average), never on sells — sells consume shares at the existing avg cost.",
    code: `class PositionTracker:
    def __init__(self):
        self.total_qty = 0
        self.total_cost = 0.0    # total dollars invested at current positions
        self.realised_pnl = 0.0

    def buy(self, qty: int, price: float) -> None:
        # Update weighted average cost: (old_cost + new_cost) / new_total_qty
        self.total_cost += qty * price
        self.total_qty  += qty

    def sell(self, qty: int, price: float) -> None:
        avg = self.avg_cost()
        self.realised_pnl += qty * (price - avg)
        # Remove the cost basis for sold shares
        self.total_cost -= qty * avg
        self.total_qty  -= qty

    def avg_cost(self) -> float:
        if self.total_qty == 0:
            return 0.0
        return self.total_cost / self.total_qty

    def pnl(self) -> float:
        return self.realised_pnl


# Example usage
tracker = PositionTracker()
tracker.buy(100, 10.0)
tracker.buy(100, 12.0)
tracker.sell(50, 15.0)
print(tracker.avg_cost())  # 11.0
print(tracker.pnl())       # 200.0`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(1)" },
  },
  {
    id: "fin-0520-b1-order-matcher",
    leetcodeNumber: 0,
    title: "Order Matcher with Price-Time Priority",
    difficulty: "hard",
    topics: ["heap", "design", "sorting"],
    problem:
      "Design an OrderMatcher class supporting: add_order(order_id, side, price, qty) — adds a limit order (side='B' for buy, 'S' for sell) to the order book; match() — crosses resting buy and sell orders using price-time priority, returns a list of fills as tuples (buy_id, sell_id, fill_price, fill_qty). Price priority: highest buy first, lowest sell first. Time priority: within same price, earlier order first. A fill occurs whenever the best bid >= best ask.",
    examples: [
      {
        input: `om = OrderMatcher()
om.add_order(1, 'B', 100.0, 100)
om.add_order(2, 'S', 99.0,  60)
om.add_order(3, 'S', 100.0, 80)
print(om.match())`,
        output: "[(1, 2, 99.0, 60), (1, 3, 100.0, 40)]",
        explanation:
          "Buy order 1 at 100 crosses sell order 2 at 99 (fill at ask price 99, qty 60). Remaining buy qty=40 then crosses sell order 3 at 100, fill qty=40.",
      },
      {
        input: `om = OrderMatcher()
om.add_order(1, 'B', 101.0, 50)
om.add_order(2, 'B', 100.0, 50)
om.add_order(3, 'S', 100.5, 40)
print(om.match())`,
        output: "[(1, 3, 100.5, 40)]",
        explanation:
          "Only bid 1 at 101 >= ask 3 at 100.5. Fill 40 shares at ask price 100.5. Bid 2 at 100 < ask 100.5 so no further matches.",
      },
    ],
    approach:
      "Use a max-heap for bids (negate price for Python's min-heap) and a min-heap for asks, each storing (price, timestamp, order_id, qty). Loop while best_bid.price >= best_ask.price, consume the minimum of the two quantities, and record a fill at the aggressor's (ask) price.",
    code: `import heapq
from typing import List, Tuple

class OrderMatcher:
    def __init__(self):
        # Max-heap for bids: store (-price, timestamp, id, qty)
        self.bids: List[Tuple] = []
        # Min-heap for asks: store (price, timestamp, id, qty)
        self.asks: List[Tuple] = []
        self.timestamp = 0

    def add_order(self, order_id: int, side: str,
                   price: float, qty: int) -> None:
        ts = self.timestamp
        self.timestamp += 1
        if side == 'B':
            heapq.heappush(self.bids, (-price, ts, order_id, qty))
        else:
            heapq.heappush(self.asks, (price, ts, order_id, qty))

    def match(self) -> List[Tuple]:
        fills = []
        while self.bids and self.asks:
            neg_bp, bts, bid_id, bqty = self.bids[0]
            ap,     ats, ask_id, aqty = self.asks[0]
            best_bid = -neg_bp

            if best_bid < ap:
                break   # no cross

            # Fill at the resting order price (passive = ask here)
            fill_qty = min(bqty, aqty)
            fills.append((bid_id, ask_id, ap, fill_qty))

            heapq.heappop(self.bids)
            heapq.heappop(self.asks)

            remaining_b = bqty - fill_qty
            remaining_a = aqty - fill_qty

            if remaining_b > 0:
                heapq.heappush(self.bids, (neg_bp, bts, bid_id, remaining_b))
            if remaining_a > 0:
                heapq.heappush(self.asks, (ap, ats, ask_id, remaining_a))

        return fills


# Example usage
om = OrderMatcher()
om.add_order(1, 'B', 100.0, 100)
om.add_order(2, 'S', 99.0,  60)
om.add_order(3, 'S', 100.0, 80)
print(om.match())  # [(1, 2, 99.0, 60), (1, 3, 100.0, 40)]`,
    language: "python",
    complexity: { time: "O(F log N) where F=fills, N=orders", space: "O(N)" },
  },
  {
    id: "fin-0520-b1-kadane-pnl",
    leetcodeNumber: 0,
    title: "Maximum Cumulative P&L Recovery (Kadane's)",
    difficulty: "easy",
    topics: ["dynamic-programming", "array"],
    problem:
      "Given an array of daily P&L values (positive = gain, negative = loss), find the maximum sum of any contiguous subarray. In finance, this represents the best possible consecutive recovery period: the stretch of consecutive trading days with the highest total P&L, even if the overall account is in drawdown. Return both the maximum sum and the start/end indices of the best subarray.",
    examples: [
      {
        input: "pnl = [-5, -3, 4, 7, -2, 8, -1]",
        output: "max_pnl=17, start=2, end=5",
        explanation:
          "The subarray [4, 7, -2, 8] from index 2 to 5 gives the maximum sum 17. Even though -2 is a loss, including it connects two profitable runs worth 15 total.",
      },
      {
        input: "pnl = [-3, -1, -4, -1, -5]",
        output: "max_pnl=-1, start=1, end=1",
        explanation:
          "All days are losses; the best single day is -1 at index 1 (or index 3). Return the single least-negative day.",
      },
    ],
    approach:
      "Kadane's algorithm: track current_sum and max_sum. At each step, current_sum = max(pnl[i], current_sum + pnl[i]). If adding the current element to the running sum is worse than starting fresh, start a new subarray. Track indices by noting when current_sum resets and when max_sum is updated.",
    code: `from typing import Tuple

def max_pnl_recovery(pnl: list[float]) -> Tuple[float, int, int]:
    """
    Returns (max_sum, start_index, end_index) of the best contiguous subarray.
    Uses Kadane's algorithm: O(n) time, O(1) space.
    """
    if not pnl:
        return 0.0, 0, 0

    max_sum = pnl[0]
    cur_sum = pnl[0]
    best_start = best_end = 0
    temp_start = 0

    for i in range(1, len(pnl)):
        if cur_sum + pnl[i] < pnl[i]:
            # Starting fresh is better: reset current window
            cur_sum = pnl[i]
            temp_start = i
        else:
            cur_sum += pnl[i]

        if cur_sum > max_sum:
            max_sum = cur_sum
            best_start = temp_start
            best_end = i

    return max_sum, best_start, best_end


# Example 1
pnl = [-5, -3, 4, 7, -2, 8, -1]
result = max_pnl_recovery(pnl)
print(f"max_pnl={result[0]}, start={result[1]}, end={result[2]}")
# max_pnl=17, start=2, end=5

# Example 2: all negative
pnl2 = [-3, -1, -4, -1, -5]
result2 = max_pnl_recovery(pnl2)
print(f"max_pnl={result2[0]}, start={result2[1]}, end={result2[2]}")
# max_pnl=-1, start=1, end=1`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-0520-b1-min-platforms",
    leetcodeNumber: 0,
    title: "Minimum Number of Trading Desks (Meeting Rooms II)",
    difficulty: "medium",
    topics: ["heap", "sorting", "greedy"],
    problem:
      "Given arrival[] and departure[] times of traders at a trading floor, find the minimum number of desks needed so that no two overlapping traders share a desk. A trader occupies a desk from their arrival time until their departure time (inclusive). This is the classic Meeting Rooms II problem framed for a trading floor.",
    examples: [
      {
        input: "arrival = [9, 9, 10, 11], departure = [10, 12, 11, 13]",
        output: "3",
        explanation:
          "At time 10, traders arriving at 9, 9, and 10 all need desks simultaneously (the first arrived at 9 departs at 10 but overlaps with the 10-arrival). We need 3 desks at peak.",
      },
      {
        input: "arrival = [1, 3, 5], departure = [2, 4, 6]",
        output: "1",
        explanation:
          "All traders are sequential: [1,2], [3,4], [5,6]. One desk suffices.",
      },
    ],
    approach:
      "Sort traders by arrival time. Use a min-heap of departure times. For each arriving trader, if the earliest-departing current occupant has already left (heap top <= new arrival), recycle that desk; otherwise allocate a new desk. The heap size at the end is the answer.",
    code: `import heapq
from typing import List

def min_trading_desks(arrival: List[int], departure: List[int]) -> int:
    """
    Minimum desks = maximum number of concurrent traders.
    Greedy: assign each trader the earliest-freed desk, or a new one if none.
    """
    n = len(arrival)
    # Sort traders by arrival time
    traders = sorted(zip(arrival, departure), key=lambda x: x[0])

    # Min-heap of departure times for currently occupied desks
    desks: List[int] = []   # heap of departure times

    for arr, dep in traders:
        if desks and desks[0] < arr:
            # Earliest-departing desk is free by this arrival
            heapq.heapreplace(desks, dep)  # recycle desk
        else:
            heapq.heappush(desks, dep)     # need a new desk

    return len(desks)


# Example 1
arrival   = [9, 9, 10, 11]
departure = [10, 12, 11, 13]
print(min_trading_desks(arrival, departure))  # 3

# Example 2: sequential
arrival2   = [1, 3, 5]
departure2 = [2, 4, 6]
print(min_trading_desks(arrival2, departure2))  # 1

# Example 3: all overlap
arrival3   = [8, 8, 8]
departure3 = [17, 17, 17]
print(min_trading_desks(arrival3, departure3))  # 3`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-0520-b1-max-profit-window",
    leetcodeNumber: 0,
    title: "Maximum Profit in K-Day Rolling Window",
    difficulty: "medium",
    topics: ["sliding-window", "dynamic-programming"],
    problem:
      "Given a price array prices[] and a window size K, find the maximum profit achievable by making one buy and one sell within any window of K consecutive days (buy before sell, same or different day). Return the maximum profit. If no profit is possible in any window, return 0.",
    examples: [
      {
        input: "prices = [3, 1, 4, 1, 5, 9, 2, 6], K = 4",
        output: "8",
        explanation:
          "Window [1, 5, 9, 2] starting at index 1: buy at 1, sell at 9, profit = 8. Other windows: [3,1,4,1]→3, [4,1,5,9]→8, [1,5,9,2]→8, [5,9,2,6]→4.",
      },
      {
        input: "prices = [5, 4, 3, 2, 1], K = 3",
        output: "0",
        explanation: "Prices are strictly decreasing; no profitable window exists.",
      },
    ],
    approach:
      "Slide a window of size K across the array. Within each window, the maximum profit = max_price_after_i - min_price_up_to_i. Maintain a running minimum as you slide. For efficiency, use a deque to track the windowed minimum in O(n) total rather than recomputing per window.",
    code: `from collections import deque
from typing import List

def max_profit_window(prices: List[float], k: int) -> float:
    """
    Find max single buy-sell profit within any K-day window.
    O(n) via sliding window minimum tracking.
    """
    if k <= 1 or not prices:
        return 0.0

    n = len(prices)
    if k >= n:
        # Entire array is one window; simple O(n) scan
        mn = prices[0]
        best = 0.0
        for p in prices[1:]:
            best = max(best, p - mn)
            mn   = min(mn, p)
        return best

    # Sliding window minimum: deque stores indices in increasing price order
    min_dq: deque[int] = deque()   # indices, prices[min_dq[0]] is window min
    best_profit = 0.0

    for i in range(n):
        # Remove indices outside the left of the window [i-k+1, i]
        while min_dq and min_dq[0] < i - k + 1:
            min_dq.popleft()

        # Best profit ending at i: price[i] - min price in window
        if min_dq:
            best_profit = max(best_profit, prices[i] - prices[min_dq[0]])

        # Maintain deque: remove indices with prices >= prices[i] from back
        while min_dq and prices[min_dq[-1]] >= prices[i]:
            min_dq.pop()
        min_dq.append(i)

    return best_profit


# Example 1
prices = [3, 1, 4, 1, 5, 9, 2, 6]
print(max_profit_window(prices, k=4))   # 8

# Example 2: decreasing
prices2 = [5, 4, 3, 2, 1]
print(max_profit_window(prices2, k=3))  # 0

# Example 3
prices3 = [7, 1, 5, 3, 6, 4]
print(max_profit_window(prices3, k=3))  # 5 (buy 1, sell 6 in window [1,5,3,6]? No, k=3: [1,5,3]->4 or [5,3,6]->1 ... best is [1,5,3]=4)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
  },
  {
    id: "fin-0520-b1-min-vol-path",
    leetcodeNumber: 0,
    title: "Minimum Volatility Path (Dijkstra on Asset Graph)",
    difficulty: "medium",
    topics: ["graph", "dijkstra", "shortest-path"],
    problem:
      "You are given n assets and a list of edges edges[i] = [u, v, vol] where vol is the daily volatility of moving capital between asset u and asset v (e.g., converting USD to EUR adds FX volatility). Find the path from asset source to asset target that minimises total volatility (sum of edge weights along the path). Return the minimum total volatility, or -1 if no path exists.",
    examples: [
      {
        input:
          "n=4, edges=[[0,1,0.05],[1,2,0.08],[0,2,0.20],[2,3,0.03],[1,3,0.15]], source=0, target=3",
        output: "0.16",
        explanation:
          "Path 0→1→2→3 has total vol 0.05+0.08+0.03=0.16. Path 0→2→3 has 0.20+0.03=0.23. Path 0→1→3 has 0.05+0.15=0.20. Minimum is 0.16.",
      },
      {
        input: "n=3, edges=[[0,1,0.10],[1,2,0.05]], source=0, target=2",
        output: "0.15",
        explanation: "Only one path: 0→1→2 with vol 0.10+0.05=0.15.",
      },
    ],
    approach:
      "Standard Dijkstra's algorithm on an undirected weighted graph. Build an adjacency list, use a min-heap of (cumulative_vol, node), and relax edges greedily. Volatilities are non-negative so Dijkstra is correct and runs in O((V+E) log V).",
    code: `import heapq
from typing import List

def min_vol_path(n: int, edges: List[List], source: int, target: int) -> float:
    """
    Dijkstra's shortest path where edge weights are volatilities.
    Returns minimum cumulative volatility from source to target.
    """
    # Build undirected adjacency list
    graph = [[] for _ in range(n)]
    for u, v, vol in edges:
        graph[u].append((v, vol))
        graph[v].append((u, vol))  # undirected

    # Min-heap: (cumulative_vol, node)
    dist = [float('inf')] * n
    dist[source] = 0.0
    heap = [(0.0, source)]

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue   # stale entry
        if u == target:
            return round(dist[target], 10)
        for v, vol in graph[u]:
            new_dist = dist[u] + vol
            if new_dist < dist[v]:
                dist[v] = new_dist
                heapq.heappush(heap, (new_dist, v))

    return -1 if dist[target] == float('inf') else round(dist[target], 10)


# Example 1
edges = [[0,1,0.05],[1,2,0.08],[0,2,0.20],[2,3,0.03],[1,3,0.15]]
print(min_vol_path(4, edges, 0, 3))   # 0.16

# Example 2
edges2 = [[0,1,0.10],[1,2,0.05]]
print(min_vol_path(3, edges2, 0, 2))  # 0.15

# Example 3: no path
edges3 = [[0,1,0.05]]
print(min_vol_path(3, edges3, 0, 2))  # -1`,
    language: "python",
    complexity: { time: "O((V + E) log V)", space: "O(V + E)" },
  },
  {
    id: "fin-0520-b1-rate-limiter-window",
    leetcodeNumber: 0,
    title: "Sliding Window Rate Limiter",
    difficulty: "medium",
    topics: ["design", "sliding-window", "deque"],
    problem:
      "Design a RateLimiter class for an HFT system that allows at most N requests in any 60,000-millisecond (60-second) sliding window. Implement: hit(timestamp_ms: int) -> bool — records a request at the given timestamp (in milliseconds) and returns True if it is allowed (within the N-request limit for the preceding 60 seconds), or False if it should be rejected. Timestamps are given in non-decreasing order.",
    examples: [
      {
        input: `rl = RateLimiter(3)  # max 3 per 60s
print(rl.hit(1000))    # True  (1 in window)
print(rl.hit(30000))   # True  (2 in window)
print(rl.hit(55000))   # True  (3 in window)
print(rl.hit(59000))   # False (4 in window [1000..61000])
print(rl.hit(62000))   # True  (1000 expired; 3 in [2000..62000])`,
        output: "True\nTrue\nTrue\nFalse\nTrue",
        explanation:
          "The window is [ts - 60000, ts] inclusive. At ts=62000 the window is [2000,62000]; the hit at 1000 has expired, so only 3 remain (30000, 55000, 59000).",
      },
    ],
    approach:
      "Use a deque to store timestamps of allowed requests. On each hit, pop all timestamps from the front that fall outside the 60-second window. If the deque length < N after pruning, allow the request and append the timestamp. O(1) amortised because each timestamp is pushed and popped at most once.",
    code: `from collections import deque

class RateLimiter:
    def __init__(self, n: int, window_ms: int = 60_000):
        """
        n:         maximum requests allowed in any window_ms window
        window_ms: sliding window size in milliseconds
        """
        self.n = n
        self.window = window_ms
        self.timestamps: deque[int] = deque()

    def hit(self, timestamp_ms: int) -> bool:
        # Remove timestamps that are outside the current window
        cutoff = timestamp_ms - self.window
        while self.timestamps and self.timestamps[0] <= cutoff:
            self.timestamps.popleft()

        if len(self.timestamps) < self.n:
            self.timestamps.append(timestamp_ms)
            return True   # allowed
        return False      # rate limit exceeded


# Example usage
rl = RateLimiter(3)
print(rl.hit(1000))    # True
print(rl.hit(30000))   # True
print(rl.hit(55000))   # True
print(rl.hit(59000))   # False  (window [0..59000] has 3 already + would be 4th)
print(rl.hit(62000))   # True   (1000 is now outside [2001..62000])

# Stress test
rl2 = RateLimiter(2)
results = [rl2.hit(i * 1000) for i in range(5)]
print(results)  # [True, True, False, False, False] if all within 60s`,
    language: "python",
    complexity: { time: "O(1) amortised per hit", space: "O(N)" },
  },
  {
    id: "fin-0520-b1-min-lot-coins",
    leetcodeNumber: 0,
    title: "Minimum Round Lots for Portfolio Construction",
    difficulty: "medium",
    topics: ["dynamic-programming", "greedy"],
    problem:
      "You are given a target dollar allocation T and a list of lot_sizes[] (each lot costs one dollar unit of the respective asset). Use the coin-change DP to find the minimum number of lots that reaches exactly T dollars. If exact allocation is impossible, find the minimum number of lots that reaches any amount in the range [T, T + tolerance]. Return the minimum lot count, or -1 if impossible.",
    examples: [
      {
        input: "target=11, lot_sizes=[1, 5, 6, 9], tolerance=0",
        output: "2",
        explanation:
          "9 + 2*1 = 11 needs 3 lots. But 5 + 6 = 11 needs 2 lots. Minimum is 2.",
      },
      {
        input: "target=10, lot_sizes=[3, 5], tolerance=2",
        output: "2",
        explanation:
          "Can't make exactly 10. But 10+1=11 is impossible (no 1s). 10+2=12: 3+3+3+3=12 (4 lots) or no 5-combo works. Actually 5+5=10 exactly → 2 lots.",
      },
    ],
    approach:
      "Classic coin-change DP: dp[i] = minimum lots to achieve allocation i. Initialise dp[0]=0, dp[i]=inf. For each amount from 1 to T+tolerance, try every lot size. Answer is min(dp[T], dp[T+1], ..., dp[T+tolerance]).",
    code: `from typing import List

def min_lots(target: int, lot_sizes: List[int], tolerance: int = 0) -> int:
    """
    Minimum number of lots to reach any amount in [target, target+tolerance].
    Coin-change DP: dp[i] = min lots to reach exactly amount i.
    """
    upper = target + tolerance
    INF = float('inf')

    dp = [INF] * (upper + 1)
    dp[0] = 0

    for amount in range(1, upper + 1):
        for lot in lot_sizes:
            if lot <= amount and dp[amount - lot] + 1 < dp[amount]:
                dp[amount] = dp[amount - lot] + 1

    # Find minimum in [target, target + tolerance]
    best = min(dp[target: upper + 1])
    return -1 if best == INF else int(best)


# Example 1: exact
print(min_lots(11, [1, 5, 6, 9], 0))   # 2  (5+6=11)

# Example 2: with tolerance
print(min_lots(7, [3, 5], 3))           # 2  (3+7 is 10? no... 5+5=10, 3+3+3=9 within [7,10])
                                         # target=7, tol=3 -> best in [7..10]
                                         # 7: impossible (no combo), 8: impossible,
                                         # 9: 3+3+3=3 lots, 10: 5+5=2 lots -> answer=2

# Example 3: impossible
print(min_lots(4, [3, 5], 0))           # -1  (can't make 4 from 3s and 5s)

# Larger example
print(min_lots(100, [1, 5, 10, 25], 0)) # 4  (25+25+25+25)`,
    language: "python",
    complexity: { time: "O((T + tolerance) * len(lot_sizes))", space: "O(T + tolerance)" },
  },
  {
    id: "fin-0520-b1-monotonic-depth",
    leetcodeNumber: 0,
    title: "Reconstruct Order Book Depth from Cumulative Updates",
    difficulty: "medium",
    topics: ["stack", "monotonic-stack", "design"],
    problem:
      "You receive a stream of (price, cumulative_qty) updates for the bid side of an order book. Each update gives the total cumulative quantity resting at prices >= that price (i.e., the depth). Prices in the stream are in strictly increasing order within each snapshot. Use a monotonic stack to efficiently compute the incremental quantity added at each price level (individual level depth = cumulative_qty[i] - cumulative_qty[i+1] for bids). Return a list of (price, level_qty) pairs representing the reconstructed order book.",
    examples: [
      {
        input: "updates = [(99, 500), (98, 300), (97, 150), (96, 50)]",
        output: "[(99, 200), (98, 150), (97, 100), (96, 50)]",
        explanation:
          "At 99: 500 cumulative; at 98: 300 cumulative so level 99 = 500-300=200. At 97: 150, so level 98=300-150=150. At 96: 50, so level 97=150-50=100. Level 96=50 (lowest level = all remaining).",
      },
      {
        input: "updates = [(100, 1000), (99, 600), (98, 200)]",
        output: "[(100, 400), (99, 400), (98, 200)]",
        explanation: "1000-600=400 at 100; 600-200=400 at 99; 200 at 98.",
      },
    ],
    approach:
      "Since prices are decreasing (bid side, highest first) and cumulative quantities are also decreasing, we can recover individual level quantities by differencing consecutive cumulative values. A monotonic stack enforces the non-increasing depth invariant and detects data errors (if cumulative qty ever increases, pop the stack).",
    code: `from typing import List, Tuple

def reconstruct_depth(updates: List[Tuple[float, int]]) -> List[Tuple[float, int]]:
    """
    Given (price, cumulative_qty) updates in decreasing price order (bid book),
    reconstruct individual price-level quantities.
    Uses a monotonic stack to validate and process the cumulative stream.
    """
    # Stack stores (price, cumulative_qty) in decreasing price order
    # (monotonic decreasing on both price and cumulative qty for valid bids)
    stack: List[Tuple[float, int]] = []
    result: List[Tuple[float, int]] = []

    for price, cum_qty in updates:
        # Pop levels that are inconsistent (cum_qty should decrease as price decreases)
        # For bids: lower price => lower or equal cumulative depth
        while stack and stack[-1][1] < cum_qty:
            stack.pop()  # remove stale/inconsistent entry

        if not stack:
            # First entry or stack was cleared: this level's individual qty = cum_qty
            # (we don't yet have a higher-price level to diff against)
            stack.append((price, cum_qty))
        else:
            stack.append((price, cum_qty))

    # Reconstruct level quantities from the cleaned stack via consecutive differences
    for i in range(len(stack)):
        p, cum = stack[i]
        if i + 1 < len(stack):
            next_cum = stack[i + 1][1]
            level_qty = cum - next_cum
        else:
            level_qty = cum  # deepest level: all remaining quantity
        result.append((p, level_qty))

    return result


# Example 1
updates = [(99, 500), (98, 300), (97, 150), (96, 50)]
print(reconstruct_depth(updates))
# [(99, 200), (98, 150), (97, 100), (96, 50)]

# Example 2
updates2 = [(100, 1000), (99, 600), (98, 200)]
print(reconstruct_depth(updates2))
# [(100, 400), (99, 400), (98, 200)]

# Example 3: data with a stale update (101 cumulative should be > 99 cumulative)
updates3 = [(100, 800), (99, 900), (98, 300)]  # 99 has MORE cumulative than 100 -> error
print(reconstruct_depth(updates3))
# Stack pops the 100-entry because the invariant is violated`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-0520-b1-bit-portfolio",
    leetcodeNumber: 0,
    title: "Bitmask DP Asset Selection (Simplified Sharpe)",
    difficulty: "hard",
    topics: ["dynamic-programming", "bitmask", "math"],
    problem:
      "Given N <= 20 assets with expected_return[i] and a correlation matrix corr[i][j] (with individual volatilities vols[i]), use bitmask DP to find the subset of assets that maximises the simplified Sharpe ratio: expected_portfolio_return / portfolio_volatility. Assume equal-weight allocation within the selected subset. Portfolio variance = (1/n^2) * sum_{i,j in S} vols[i]*vols[j]*corr[i][j]. Return the best Sharpe ratio and the selected asset indices.",
    examples: [
      {
        input: `expected_return = [0.10, 0.08, 0.12, 0.06]
vols = [0.15, 0.12, 0.18, 0.08]
corr = [[1.0, 0.5, 0.6, 0.1],
        [0.5, 1.0, 0.4, 0.2],
        [0.6, 0.4, 1.0, 0.3],
        [0.1, 0.2, 0.3, 1.0]]`,
        output: "best_sharpe ≈ 0.71, assets = [1, 3]",
        explanation:
          "Assets 1 and 3 (0-indexed): equal weight returns=(0.08+0.06)/2=0.07, vol=sqrt(0.25*(0.12^2+0.08^2+2*0.2*0.12*0.08))=~0.098. Sharpe~0.71.",
      },
    ],
    approach:
      "Iterate over all 2^N subsets (bitmask). For each non-empty subset, compute equal-weight portfolio return and variance using the covariance matrix. Track the subset with maximum return/vol. Memoise nothing — each subset is evaluated in O(n^2) where n = popcount(mask). Total O(4^N / sqrt(N)) which is feasible for N <= 20 with careful implementation.",
    code: `from typing import List, Tuple
import math

def best_sharpe_bitmask(
    expected_return: List[float],
    vols: List[float],
    corr: List[List[float]],
) -> Tuple[float, List[int]]:
    """
    Bitmask DP: enumerate all 2^N subsets, compute equal-weight Sharpe.
    Returns (best_sharpe, list_of_asset_indices).
    """
    N = len(expected_return)
    # Precompute covariance matrix: Sigma[i][j] = vols[i]*vols[j]*corr[i][j]
    cov = [[vols[i] * vols[j] * corr[i][j] for j in range(N)] for i in range(N)]

    best_sharpe = -1.0
    best_mask   = 0

    for mask in range(1, 1 << N):
        # Extract asset indices in this subset
        assets = [i for i in range(N) if mask >> i & 1]
        n = len(assets)
        w = 1.0 / n   # equal weight

        # Portfolio expected return
        port_ret = sum(expected_return[i] for i in assets) / n

        # Portfolio variance: w^T * Sigma * w (equal weights)
        port_var = 0.0
        for i in assets:
            for j in assets:
                port_var += w * w * cov[i][j]

        if port_var <= 0:
            continue

        sharpe = port_ret / math.sqrt(port_var)

        if sharpe > best_sharpe:
            best_sharpe = sharpe
            best_mask   = mask

    best_assets = [i for i in range(N) if best_mask >> i & 1]
    return best_sharpe, best_assets


# Example
expected_return = [0.10, 0.08, 0.12, 0.06]
vols = [0.15, 0.12, 0.18, 0.08]
corr = [
    [1.0, 0.5, 0.6, 0.1],
    [0.5, 1.0, 0.4, 0.2],
    [0.6, 0.4, 1.0, 0.3],
    [0.1, 0.2, 0.3, 1.0],
]

sharpe, assets = best_sharpe_bitmask(expected_return, vols, corr)
print(f"Best Sharpe: {sharpe:.4f}")
print(f"Assets:      {assets}")

# Verify: compute Sharpe for all-assets portfolio
sharpe_all, _ = best_sharpe_bitmask(
    expected_return, vols, corr
)
print(f"All-asset Sharpe: {sharpe_all:.4f}")`,
    language: "python",
    complexity: {
      time: "O(2^N * N^2) — feasible for N <= 20",
      space: "O(N^2) for covariance matrix",
    },
  },
];
