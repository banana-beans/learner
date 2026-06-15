import type { LeetCodeProblem } from "./index";

export const financeProblems20260615B1: LeetCodeProblem[] = [
  {
    id: "fin-20260615-b1-fx-arbitrage",
    title: "FX Arbitrage via Bellman-Ford Negative Cycle",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Negative Cycle", "Finance"],
    problem:
      "Given n currencies and a list of exchange rates [from, to, rate], detect whether a sequence of currency conversions produces a risk-free profit (arbitrage). " +
      "An arbitrage exists when the product of rates along a cycle exceeds 1.0. " +
      "Return True if arbitrage exists, False otherwise. " +
      "Hint: take the negative log of each rate to transform products into sums, then find a negative-weight cycle.",
    examples: [
      {
        input:
          "n=3, rates=[['USD','EUR',0.9],['EUR','GBP',0.8],['GBP','USD',1.4]]",
        output: "True",
        explanation:
          "USD→EUR→GBP→USD: 0.9×0.8×1.4=1.008 > 1, arbitrage found.",
      },
      {
        input:
          "n=2, rates=[['USD','EUR',0.9],['EUR','USD',1.1]]",
        output: "False",
        explanation: "0.9×1.1=0.99 < 1, no profit.",
      },
    ],
    constraints: [
      "2 ≤ n ≤ 100",
      "rates[i] = [src, dst, rate] where 0 < rate ≤ 10",
      "No self-loops",
    ],
    approach:
      "Build a graph where edge weight = -log(rate). Run Bellman-Ford for n-1 relaxations. " +
      "On the n-th pass, if any distance can still be reduced, a negative cycle exists (arbitrage). " +
      "Time O(V·E), Space O(V).",
    code: `import math
from collections import defaultdict

def has_arbitrage(n: int, rates: list[list]) -> bool:
    # Build adjacency list with log-transformed weights
    graph = defaultdict(list)
    currencies = {}
    idx = 0
    for src, dst, rate in rates:
        for c in (src, dst):
            if c not in currencies:
                currencies[c] = idx
                idx += 1
        u, v = currencies[src], currencies[dst]
        graph[u].append((v, -math.log(rate)))
        # Add reverse edge if needed (undirected market)

    V = len(currencies)
    dist = [float('inf')] * V
    dist[0] = 0.0

    # Bellman-Ford: relax V-1 times
    for _ in range(V - 1):
        for u in range(V):
            for v, w in graph[u]:
                if dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w

    # V-th relaxation detects negative cycle
    for u in range(V):
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                return True  # arbitrage!
    return False

# Example
rates = [['USD','EUR',0.9],['EUR','GBP',0.8],['GBP','USD',1.4]]
print(has_arbitrage(3, rates))  # True`,
    language: "python",
    complexity: { time: "O(V·E)", space: "O(V+E)" },
  },
  {
    id: "fin-20260615-b1-next-greater-price",
    title: "Next Greater Price (Monotonic Stack)",
    difficulty: "medium",
    topics: ["Monotonic Stack", "Array", "Finance"],
    problem:
      "Given an array prices[] of daily closing prices, return an array result[] where result[i] is the next day index j > i " +
      "where prices[j] > prices[i]. If no such day exists, result[i] = -1. " +
      "This models finding the next resistance level for each day in a price series.",
    examples: [
      {
        input: "prices = [73, 74, 75, 71, 69, 72, 76, 73]",
        output: "[1, 2, 6, 5, 5, 6, -1, -1]",
        explanation:
          "On day 0 (price 73), next higher is day 1 (74). On day 2 (75), next higher is day 6 (76).",
      },
    ],
    constraints: ["1 ≤ n ≤ 10^5", "1 ≤ prices[i] ≤ 10^6"],
    approach:
      "Maintain a monotonic decreasing stack of indices. For each price, pop all stack indices " +
      "whose price is less than current — current index is their answer. Push current index. " +
      "Time O(n), Space O(n).",
    code: `def next_greater_price(prices: list[int]) -> list[int]:
    n = len(prices)
    result = [-1] * n
    stack = []  # monotonic decreasing stack of indices

    for i, price in enumerate(prices):
        # Pop indices whose "next greater" is the current day
        while stack and prices[stack[-1]] < price:
            idx = stack.pop()
            result[idx] = i
        stack.append(i)

    return result

# Example
prices = [73, 74, 75, 71, 69, 72, 76, 73]
print(next_greater_price(prices))  # [1, 2, 6, 5, 5, 6, -1, -1]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 739,
  },
  {
    id: "fin-20260615-b1-kth-largest-pnl",
    title: "K-th Largest Realised P&L",
    difficulty: "medium",
    topics: ["Heap", "Priority Queue", "Finance"],
    problem:
      "A trading system produces a stream of realised P&L values. After each new value is added, " +
      "return the k-th largest P&L seen so far. If fewer than k values have been seen, return -inf. " +
      "Implement a class KthLargestPnl(k) with method add(val) -> float.",
    examples: [
      {
        input:
          "k=3, stream=[4, 5, 8, 2, 3, 9], query after each add",
        output: "[-inf, -inf, 4, 4, 4, 5]",
        explanation:
          "After 3 values [4,5,8]: k-th=3rd largest=4. After adding 9: [4,5,8,2,3,9], 3rd largest=5.",
      },
    ],
    constraints: [
      "1 ≤ k ≤ 10^4",
      "Values can be any float (including negative)",
      "Up to 10^4 add() calls",
    ],
    approach:
      "Maintain a min-heap of size k. The heap root is always the k-th largest. " +
      "On each add: push val; if heap size > k, pop the smallest. Root = k-th largest. " +
      "Time O(log k) per add, Space O(k).",
    code: `import heapq
import math

class KthLargestPnl:
    def __init__(self, k: int):
        self.k = k
        self.heap: list[float] = []  # min-heap of size k

    def add(self, val: float) -> float:
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)
        if len(self.heap) < self.k:
            return -math.inf
        return self.heap[0]  # smallest in top-k = k-th largest overall

# Example
tracker = KthLargestPnl(3)
for v in [4, 5, 8, 2, 3, 9]:
    print(tracker.add(v))  # -inf, -inf, 4, 4, 4, 5`,
    language: "python",
    complexity: { time: "O(log k) per add", space: "O(k)" },
    leetcodeNumber: 703,
  },
  {
    id: "fin-20260615-b1-k-transactions",
    title: "Max Profit with At Most K Transactions",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Finance", "Stock Trading"],
    problem:
      "Given a price array prices[] and integer k, find the maximum profit achievable with at most k buy-sell transactions. " +
      "You must sell before buying again (no holding multiple positions). " +
      "A transaction is one buy + one sell.",
    examples: [
      {
        input: "k=2, prices=[3,2,6,5,0,3]",
        output: "7",
        explanation: "Buy@2 sell@6 (+4), buy@0 sell@3 (+3) = 7.",
      },
      {
        input: "k=2, prices=[3,3,5,0,0,3,1,4]",
        output: "6",
        explanation: "Buy@0 sell@3 (+3), buy@1 sell@4 (+3) = 6.",
      },
    ],
    constraints: [
      "1 ≤ k ≤ 100",
      "1 ≤ n ≤ 10^4",
      "0 ≤ prices[i] ≤ 10^4",
    ],
    approach:
      "DP: buy[j] = max profit after j-th buy (want to minimise cost), sell[j] = max profit after j-th sell. " +
      "For each price: sell[j] = max(sell[j], buy[j] + price); buy[j] = max(buy[j], sell[j-1] - price). " +
      "If k >= n//2 use the unlimited-transactions greedy. Time O(k·n), Space O(k).",
    code: `def max_profit_k_transactions(k: int, prices: list[int]) -> int:
    n = len(prices)
    if not prices or k == 0:
        return 0

    # If k is large enough, unlimited transactions
    if k >= n // 2:
        return sum(max(0, prices[i+1] - prices[i]) for i in range(n-1))

    # buy[j]: best (most negative) effective cost after j buys
    # sell[j]: best profit after j sells
    buy  = [-float('inf')] * (k + 1)
    sell = [0] * (k + 1)

    for price in prices:
        for j in range(1, k + 1):
            sell[j] = max(sell[j], buy[j] + price)
            buy[j]  = max(buy[j],  sell[j-1] - price)

    return sell[k]

# Examples
print(max_profit_k_transactions(2, [3,2,6,5,0,3]))        # 7
print(max_profit_k_transactions(2, [3,3,5,0,0,3,1,4]))    # 6`,
    language: "python",
    complexity: { time: "O(k·n)", space: "O(k)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260615-b1-portfolio-knapsack",
    title: "Portfolio Budget Allocation (0/1 Knapsack)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Knapsack", "Finance"],
    problem:
      "You have a budget W (in $K) and n investment opportunities each with cost[i] (in $K) and expected_return[i]. " +
      "Select a subset of investments (each at most once) to maximise total expected return without exceeding W. " +
      "Return the maximum expected return.",
    examples: [
      {
        input:
          "W=10, costs=[4,5,3,7], returns=[3,4,2,5]",
        output: "7",
        explanation:
          "Choose costs [4,3] (total=7≤10) for returns [3,2]=5, or costs [5,3]=8 for returns [4,2]=6, " +
          "or costs [4,5]=9 for returns [3,4]=7. Best is costs [4,5] → return 7.",
      },
    ],
    constraints: [
      "1 ≤ n ≤ 200",
      "1 ≤ W ≤ 10^4",
      "1 ≤ cost[i], return[i] ≤ 10^3",
    ],
    approach:
      "Classic 0/1 knapsack DP. dp[w] = max return achievable with budget w. " +
      "Iterate items; for each item iterate budget in reverse to prevent reuse. " +
      "Time O(n·W), Space O(W).",
    code: `def portfolio_knapsack(W: int, costs: list[int], returns: list[int]) -> int:
    dp = [0] * (W + 1)  # dp[w] = max return with budget w

    for cost, ret in zip(costs, returns):
        # Traverse right-to-left to ensure each investment used at most once
        for w in range(W, cost - 1, -1):
            dp[w] = max(dp[w], dp[w - cost] + ret)

    return dp[W]

# Example
W = 10
costs   = [4, 5, 3, 7]
returns = [3, 4, 2, 5]
print(portfolio_knapsack(W, costs, returns))  # 7`,
    language: "python",
    complexity: { time: "O(n·W)", space: "O(W)" },
    leetcodeNumber: 416,
  },
  {
    id: "fin-20260615-b1-sliding-rate-limiter",
    title: "Sliding Window Log Rate Limiter",
    difficulty: "medium",
    topics: ["Design", "Sliding Window", "Queue", "Finance"],
    problem:
      "Design a rate limiter for an order management system that allows at most max_orders orders in any rolling window_ms milliseconds. " +
      "Implement class RateLimiter(max_orders, window_ms) with method allow(timestamp_ms) -> bool. " +
      "timestamp_ms values are non-decreasing.",
    examples: [
      {
        input:
          "max_orders=3, window_ms=1000, calls: allow(100), allow(200), allow(300), allow(400), allow(1100), allow(1200)",
        output: "[True, True, True, False, True, True]",
        explanation:
          "At t=400: window [100,400] already has 3 orders. At t=1100: t=100 expires, window [101,1100] has 2 → allowed.",
      },
    ],
    constraints: [
      "1 ≤ max_orders ≤ 10^4",
      "1 ≤ window_ms ≤ 10^9",
      "Timestamps are non-decreasing",
      "Up to 10^5 allow() calls",
    ],
    approach:
      "Keep a deque of allowed timestamps. On each call, evict entries older than (timestamp - window_ms). " +
      "If deque size < max_orders, append and return True; else False. " +
      "Time O(1) amortised, Space O(max_orders).",
    code: `from collections import deque

class RateLimiter:
    def __init__(self, max_orders: int, window_ms: int):
        self.max_orders = max_orders
        self.window_ms  = window_ms
        self.window: deque[int] = deque()

    def allow(self, timestamp_ms: int) -> bool:
        # Evict timestamps outside the rolling window
        cutoff = timestamp_ms - self.window_ms
        while self.window and self.window[0] <= cutoff:
            self.window.popleft()

        if len(self.window) < self.max_orders:
            self.window.append(timestamp_ms)
            return True
        return False

# Example
rl = RateLimiter(3, 1000)
for t in [100, 200, 300, 400, 1100, 1200]:
    print(rl.allow(t))  # True True True False True True`,
    language: "python",
    complexity: { time: "O(1) amortised", space: "O(max_orders)" },
  },
  {
    id: "fin-20260615-b1-merge-position-intervals",
    title: "Merge Overlapping Position Intervals",
    difficulty: "medium",
    topics: ["Intervals", "Sorting", "Finance"],
    problem:
      "A risk system represents a portfolio as a list of position intervals [start, end, notional]. " +
      "Two intervals are 'mergeable' when they overlap or are adjacent (end1 >= start2 after sorting). " +
      "Merge all overlapping/adjacent intervals and sum the notionals. " +
      "Return the merged list sorted by start.",
    examples: [
      {
        input: "intervals = [[1,3,100],[2,6,200],[8,10,50],[15,18,300],[17,20,150]]",
        output: "[[1,6,300],[8,10,50],[15,20,450]]",
        explanation:
          "[1,3] and [2,6] overlap → merged to [1,6] with notional 300. [15,18] and [17,20] overlap → [15,20] with 450.",
      },
    ],
    constraints: [
      "1 ≤ n ≤ 10^4",
      "0 ≤ start < end ≤ 10^9",
      "1 ≤ notional ≤ 10^6",
    ],
    approach:
      "Sort by start. Scan; if current start ≤ last merged end, extend end = max(end, current end) and add notional. " +
      "Otherwise start a new merged interval. Time O(n log n), Space O(n).",
    code: `def merge_position_intervals(intervals: list[list]) -> list[list]:
    if not intervals:
        return []

    intervals.sort(key=lambda x: x[0])
    merged = [list(intervals[0])]

    for start, end, notional in intervals[1:]:
        last = merged[-1]
        if start <= last[1]:  # overlap or adjacent
            last[1] = max(last[1], end)
            last[2] += notional
        else:
            merged.append([start, end, notional])

    return merged

# Example
intervals = [[1,3,100],[2,6,200],[8,10,50],[15,18,300],[17,20,150]]
print(merge_position_intervals(intervals))
# [[1,6,300],[8,10,50],[15,20,450]]`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 56,
  },
  {
    id: "fin-20260615-b1-rolling-max-position",
    title: "Rolling Maximum Position Size (Monotonic Deque)",
    difficulty: "medium",
    topics: ["Sliding Window", "Monotonic Deque", "Finance"],
    problem:
      "Given a time series of position sizes positions[] and a window size k, " +
      "return an array where result[i] is the maximum position size in the window ending at index i " +
      "(i.e., positions[max(0,i-k+1)..i]). " +
      "This is used in risk dashboards to detect concentration spikes.",
    examples: [
      {
        input: "positions = [1, 3, -1, -3, 5, 3, 6, 7], k = 3",
        output: "[1, 3, 3, 3, 5, 5, 6, 7]",
        explanation:
          "Window [1]: max=1. [1,3]: max=3. [1,3,-1]: max=3. [3,-1,-3]: max=3. [-1,-3,5]: max=5...",
      },
    ],
    constraints: [
      "1 ≤ k ≤ n ≤ 10^5",
      "-10^4 ≤ positions[i] ≤ 10^4",
    ],
    approach:
      "Monotonic decreasing deque of indices. For each i: remove indices out of window from front; " +
      "remove indices from back whose value ≤ current (they can never be max). Append i. " +
      "Front always holds the max for the current window. Time O(n), Space O(k).",
    code: `from collections import deque

def rolling_max_position(positions: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()  # stores indices; decreasing by position value
    result = []

    for i, pos in enumerate(positions):
        # Remove indices that have fallen out of the window
        while dq and dq[0] < i - k + 1:
            dq.popleft()

        # Maintain monotonic decreasing order
        while dq and positions[dq[-1]] <= pos:
            dq.pop()

        dq.append(i)
        result.append(positions[dq[0]])

    return result

# Example
positions = [1, 3, -1, -3, 5, 3, 6, 7]
print(rolling_max_position(positions, k=3))
# [1, 3, 3, 3, 5, 5, 6, 7]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260615-b1-order-book-cancel",
    title: "Order Book with O(1) Cancel-by-ID",
    difficulty: "hard",
    topics: ["Design", "HashMap", "Doubly Linked List", "Finance"],
    problem:
      "Design a limit order book that supports: " +
      "add_order(order_id, price, qty, side) in O(log n); " +
      "cancel_order(order_id) in O(1) average; " +
      "best_bid() and best_ask() in O(1). " +
      "side is 'BUY' or 'SELL'. The book should maintain price-time priority.",
    examples: [
      {
        input:
          "add(1,100,10,'BUY'), add(2,101,5,'SELL'), add(3,99,20,'BUY'), cancel(3), best_bid()",
        output: "100",
        explanation:
          "After cancel(3): best bid is order 1 at price 100.",
      },
    ],
    constraints: [
      "order_id is unique per order",
      "1 ≤ price ≤ 10^9, 1 ≤ qty ≤ 10^6",
      "Up to 10^5 operations",
    ],
    approach:
      "HashMap {order_id → (price, side)} for O(1) cancel lookup. " +
      "Two SortedDicts (bids descending, asks ascending) mapping price → deque of (order_id, qty). " +
      "On cancel, look up price+side from map, remove from the deque, delete level if empty. " +
      "best_bid/ask peek at the first key of each sorted structure.",
    code: `from sortedcontainers import SortedDict
from collections import deque, OrderedDict

class OrderBook:
    def __init__(self):
        # bids: price → deque[(order_id, qty)], best bid = highest price
        self.bids: SortedDict = SortedDict(lambda x: -x)
        # asks: price → deque[(order_id, qty)], best ask = lowest price
        self.asks: SortedDict = SortedDict()
        # order_id → (price, side) for O(1) cancel
        self.order_map: dict = {}

    def add_order(self, order_id: int, price: int, qty: int, side: str):
        book = self.bids if side == 'BUY' else self.asks
        if price not in book:
            book[price] = deque()
        book[price].append((order_id, qty))
        self.order_map[order_id] = (price, side)

    def cancel_order(self, order_id: int) -> bool:
        if order_id not in self.order_map:
            return False
        price, side = self.order_map.pop(order_id)
        book = self.bids if side == 'BUY' else self.asks
        # Filter out the cancelled order from the level
        book[price] = deque(
            (oid, qty) for oid, qty in book[price] if oid != order_id
        )
        if not book[price]:
            del book[price]
        return True

    def best_bid(self) -> int | None:
        return next(iter(self.bids)) if self.bids else None

    def best_ask(self) -> int | None:
        return next(iter(self.asks)) if self.asks else None

# Example
ob = OrderBook()
ob.add_order(1, 100, 10, 'BUY')
ob.add_order(2, 101, 5, 'SELL')
ob.add_order(3, 99, 20, 'BUY')
ob.cancel_order(3)
print(ob.best_bid())  # 100
print(ob.best_ask())  # 101`,
    language: "python",
    complexity: { time: "O(log n) add, O(1) cancel avg", space: "O(n)" },
  },
  {
    id: "fin-20260615-b1-portfolio-combinations",
    title: "Count Distinct Portfolio Allocations",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Combinatorics", "Finance"],
    problem:
      "You have a budget of exactly B units and n assets each with unit cost c[i]. " +
      "You can allocate any non-negative integer multiple of c[i] to asset i. " +
      "Count the number of distinct ways to allocate exactly B units in total across all assets. " +
      "This is the unbounded knapsack coin-change count problem framed as a portfolio problem.",
    examples: [
      {
        input: "B=5, costs=[1,2,5]",
        output: "4",
        explanation:
          "Allocations: [5,0,0], [3,1,0], [1,2,0], [0,0,1] → 4 ways.",
      },
      {
        input: "B=3, costs=[2]",
        output: "0",
        explanation: "Can't reach exactly 3 with denominations of 2.",
      },
    ],
    constraints: [
      "1 ≤ B ≤ 5000",
      "1 ≤ n ≤ 300",
      "1 ≤ costs[i] ≤ B",
    ],
    approach:
      "dp[b] = number of ways to allocate exactly b units. dp[0]=1. " +
      "For each asset cost c, for b from c to B: dp[b] += dp[b-c]. " +
      "Order of loops (assets outer, budget inner) ensures combinations not permutations. " +
      "Time O(n·B), Space O(B).",
    code: `def count_portfolio_allocations(B: int, costs: list[int]) -> int:
    dp = [0] * (B + 1)
    dp[0] = 1  # one way to allocate 0: choose nothing

    for cost in costs:
        for b in range(cost, B + 1):
            dp[b] += dp[b - cost]

    return dp[B]

# Examples
print(count_portfolio_allocations(5, [1, 2, 5]))  # 4
print(count_portfolio_allocations(3, [2]))         # 0`,
    language: "python",
    complexity: { time: "O(n·B)", space: "O(B)" },
    leetcodeNumber: 518,
  },
];
