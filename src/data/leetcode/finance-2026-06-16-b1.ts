import { LeetCodeProblem } from "./index";

export const financeProblems20260616B1: LeetCodeProblem[] = [
  {
    id: "fin-20260616-b1-streaming-median",
    title: "Streaming Trade Price Median",
    difficulty: "medium",
    topics: ["Heap", "Data Stream", "Market Data"],
    problem:
      "A trade feed sends price ticks one at a time. After each tick, return the median of all prices seen so far. Design a data structure that supports addPrice(price) in O(log n) and getMedian() in O(1).",
    examples: [
      {
        input: "addPrice(10), addPrice(3), getMedian(), addPrice(7), getMedian()",
        output: "6.5, 7.0",
        explanation:
          "After [10,3]: median = (3+10)/2 = 6.5. After [3,7,10]: median = 7.",
      },
    ],
    constraints: [
      "1 <= price <= 10^7",
      "At most 5 * 10^4 calls total",
      "getMedian is always called after at least one addPrice",
    ],
    approach:
      "Maintain two heaps: max-heap for the lower half (lo) and min-heap for the upper half (hi). After each insert rebalance so |lo| - |hi| <= 1. Median is the top of the larger heap or the average of both tops.",
    code: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []  # max-heap (inverted)
        self.hi = []  # min-heap

    def addPrice(self, price: int) -> None:
        heapq.heappush(self.lo, -price)
        # Ensure lo's max <= hi's min
        if self.hi and -self.lo[0] > self.hi[0]:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        # Rebalance sizes
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def getMedian(self) -> float:
        if len(self.lo) == len(self.hi):
            return (-self.lo[0] + self.hi[0]) / 2.0
        return float(-self.lo[0])

mf = MedianFinder()
for p in [10, 3, 7, 15, 6]:
    mf.addPrice(p)
    print(f"Added {p:3d}, median = {mf.getMedian()}")`,
    language: "python",
    complexity: { time: "O(log n) per insert, O(1) median", space: "O(n)" },
    leetcodeNumber: 295,
  },
  {
    id: "fin-20260616-b1-stock-cooldown",
    title: "Best Time to Buy and Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["Dynamic Programming", "State Machine", "Trading Rules"],
    problem:
      "Given daily stock prices, find the maximum profit with unlimited transactions, but after selling you must wait one day (cooldown) before buying again. You may not hold multiple positions simultaneously.",
    examples: [
      {
        input: "prices = [1,2,3,0,2]",
        output: "3",
        explanation:
          "Buy day 0, sell day 1 (profit=1), cooldown day 2, buy day 3, sell day 4 (profit=2). Total=3.",
      },
      {
        input: "prices = [1]",
        output: "0",
      },
    ],
    constraints: ["1 <= prices.length <= 5000", "0 <= prices[i] <= 1000"],
    approach:
      "Three states: held (own stock), sold (just sold, in cooldown), rest (no stock, not in cooldown). Transition: held = max(held, rest - price); sold = held + price; rest = max(rest, sold). Answer is max(sold, rest).",
    code: `def maxProfit(prices: list[int]) -> int:
    held = float('-inf')  # profit while holding stock
    sold = 0              # profit on cooldown day
    rest = 0              # profit while resting (no stock)

    for price in prices:
        prev_held = held
        prev_sold = sold
        prev_rest = rest

        held = max(prev_held, prev_rest - price)
        sold = prev_held + price
        rest = max(prev_rest, prev_sold)

    return max(sold, rest)

# Test cases
cases = [
    ([1, 2, 3, 0, 2], 3),
    ([1], 0),
    ([2, 1, 4], 3),
    ([6, 1, 3, 2, 4, 7], 6),
]
for prices, expected in cases:
    result = maxProfit(prices)
    status = "OK" if result == expected else "FAIL"
    print(f"{status} prices={prices} -> {result} (expected {expected})")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260616-b1-compound-matrix",
    title: "Matrix Compound Interest (Sparse Growth Table)",
    difficulty: "hard",
    topics: ["Matrix Exponentiation", "Math", "Finance"],
    problem:
      "Given an n×n transition matrix T where T[i][j] is the monthly growth rate from asset class i to asset class j, compute the value after exactly k months starting from a portfolio vector v. Return the result modulo 10^9+7.",
    examples: [
      {
        input: "T=[[1,0.1],[0.05,1.1]], v=[100,200], k=12",
        output: "[406, 847] (approximately)",
        explanation:
          "Multiply the portfolio vector by T^12. Each matrix multiply applies one month of compound growth and cross-allocation.",
      },
    ],
    constraints: [
      "1 <= n <= 50",
      "1 <= k <= 10^9",
      "T[i][j] >= 0",
      "Result modulo 10^9+7 (for integer variant)",
    ],
    approach:
      "Matrix exponentiation by squaring: T^k in O(n^3 log k) by repeatedly squaring T. For the float version, use numpy matmul. For the integer mod version, implement matrix multiply with modulo.",
    code: `import numpy as np

def mat_mul(A: list[list[float]], B: list[list[float]]) -> list[list[float]]:
    n = len(A)
    C = [[0.0]*n for _ in range(n)]
    for i in range(n):
        for k in range(n):
            if A[i][k] == 0:
                continue
            for j in range(n):
                C[i][j] += A[i][k] * B[k][j]
    return C

def mat_pow(M: list[list[float]], k: int) -> list[list[float]]:
    """Matrix exponentiation by squaring."""
    n = len(M)
    result = [[1.0 if i == j else 0.0 for j in range(n)]
              for i in range(n)]
    base = [row[:] for row in M]
    while k > 0:
        if k & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        k >>= 1
    return result

def compound_growth(T: list[list[float]],
                    v: list[float], k: int) -> list[float]:
    Tk = mat_pow(T, k)
    n = len(v)
    return [sum(Tk[i][j] * v[j] for j in range(n)) for i in range(n)]

# Demo
T = [[1.01, 0.005],
     [0.002, 1.008]]
v = [10000.0, 5000.0]
k = 120  # 10 years monthly

result = compound_growth(T, v, k)
print(f"Initial portfolio: {v}")
print(f"After {k} months:  {[round(x, 2) for x in result]}")

# Verify with numpy
T_np = np.array(T)
Tk_np = np.linalg.matrix_power(T_np, k)
result_np = Tk_np @ np.array(v)
print(f"NumPy check:       {np.round(result_np, 2).tolist()}")`,
    language: "python",
    complexity: { time: "O(n^3 log k)", space: "O(n^2)" },
  },
  {
    id: "fin-20260616-b1-max-profit-fee",
    title: "Best Time to Buy and Sell Stock with Transaction Fee",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Greedy", "Trading Strategy"],
    problem:
      "Given daily stock prices and a transaction fee per trade, find the maximum profit with unlimited transactions. Each buy+sell pair incurs one fee. You may not hold multiple positions.",
    examples: [
      {
        input: "prices = [1,3,2,8,4,9], fee = 2",
        output: "8",
        explanation:
          "Buy at 1, sell at 8 (profit 5). Buy at 4, sell at 9 (profit 3). Total=8.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5 * 10^4",
      "1 <= prices[i] <= 10^4",
      "0 <= fee <= 10^4",
    ],
    approach:
      "Two states: cash (not holding) and hold (holding). cash = max(cash, hold + price - fee); hold = max(hold, cash - price). No cooldown. O(n) time O(1) space.",
    code: `def maxProfit(prices: list[int], fee: int) -> int:
    cash = 0               # max profit when not holding
    hold = -prices[0]      # max profit when holding (bought day 0)

    for price in prices[1:]:
        cash = max(cash, hold + price - fee)
        hold = max(hold, cash - price)

    return cash

def max_profit_greedy(prices: list[int], fee: int) -> int:
    """
    Greedy: track hypothetical buy price. Sell when gain > fee.
    Equivalent to DP approach but shows intuition.
    """
    min_price = prices[0]
    profit = 0
    for price in prices[1:]:
        if price < min_price:
            min_price = price
        elif price - min_price > fee:
            profit += price - min_price - fee
            # Don't reset min_price completely:
            # act as if we bought at (price - fee) to allow
            # extending a run without paying fee twice
            min_price = price - fee
    return profit

cases = [
    ([1, 3, 2, 8, 4, 9], 2, 8),
    ([1, 3, 7, 5, 10, 3], 3, 6),
    ([1], 1, 0),
]
for prices, fee, expected in cases:
    r1 = maxProfit(prices, fee)
    r2 = max_profit_greedy(prices, fee)
    print(f"DP={r1}, Greedy={r2}, Expected={expected}",
          "OK" if r1 == expected == r2 else "FAIL")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 714,
  },
  {
    id: "fin-20260616-b1-mst-exchange",
    title: "Minimum Spanning Tree for FX Conversion Graph",
    difficulty: "medium",
    topics: ["Graph", "Minimum Spanning Tree", "Kruskal", "Union Find"],
    problem:
      "You have n currencies and m exchange rates as (src, dst, rate) triples. Find the minimum cost spanning tree of the exchange graph where edge cost = -log(rate) (so maximizing product = minimizing sum of -log). Return the edges of the MST.",
    examples: [
      {
        input:
          "currencies=['USD','EUR','GBP'], rates=[('USD','EUR',1.1),('USD','GBP',1.3),('EUR','GBP',1.15)]",
        output: "[('USD','EUR',1.1), ('EUR','GBP',1.15)]",
        explanation:
          "MST connects all currencies with minimum total negative log-rate. USD->EUR->GBP uses 2 edges with best combined rate.",
      },
    ],
    approach:
      "Kruskal's algorithm on edge weights -log(rate). Sort edges ascending by -log(rate) (descending by rate), then add edges with Union-Find if they don't form a cycle. MST minimizes total conversion cost.",
    code: `import math
from typing import NamedTuple

class Edge(NamedTuple):
    src: str
    dst: str
    rate: float
    cost: float

class UnionFind:
    def __init__(self, nodes):
        self.parent = {n: n for n in nodes}
        self.rank   = {n: 0 for n in nodes}

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, x, y) -> bool:
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return False
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
        return True

def fx_mst(currencies: list[str],
           rates: list[tuple]) -> list[Edge]:
    edges = [
        Edge(src, dst, rate, -math.log(rate))
        for src, dst, rate in rates
    ]
    edges.sort(key=lambda e: e.cost)

    uf = UnionFind(currencies)
    mst = []
    for edge in edges:
        if uf.union(edge.src, edge.dst):
            mst.append(edge)
        if len(mst) == len(currencies) - 1:
            break
    return mst

currencies = ["USD", "EUR", "GBP", "JPY", "CHF"]
rates = [
    ("USD", "EUR", 0.92), ("USD", "GBP", 0.79),
    ("USD", "JPY", 149.5), ("USD", "CHF", 0.88),
    ("EUR", "GBP", 0.86), ("EUR", "JPY", 162.5),
    ("EUR", "CHF", 0.96), ("GBP", "JPY", 188.5),
    ("GBP", "CHF", 1.11), ("JPY", "CHF", 0.0059),
]
mst = fx_mst(currencies, rates)
total_cost = sum(e.cost for e in mst)
print("MST edges:")
for e in mst:
    print(f"  {e.src} -> {e.dst}: {e.rate:.4f} (cost={e.cost:.4f})")
print(f"Total MST cost: {total_cost:.4f}")`,
    language: "python",
    complexity: { time: "O(E log E)", space: "O(V + E)" },
  },
  {
    id: "fin-20260616-b1-position-ledger",
    title: "Real-Time Position Ledger with Average Cost",
    difficulty: "medium",
    topics: ["Design", "Hash Map", "Stack", "Trading Systems"],
    problem:
      "Design a position ledger that processes trade events (buy/sell, symbol, qty, price). Support: trade(symbol, qty, price) where qty > 0 is buy, < 0 is sell. getPosition(symbol) returns (net_qty, avg_cost). getUnrealizedPnL(symbol, market_price) returns the open P&L.",
    examples: [
      {
        input:
          "trade('AAPL', 100, 150), trade('AAPL', 50, 160), getPosition('AAPL')",
        output: "(150, 153.33)",
        explanation:
          "Average cost = (100*150 + 50*160) / 150 = 23000/150 = 153.33",
      },
      {
        input: "trade('AAPL', -50, 170), getUnrealizedPnL('AAPL', 175)",
        output: "3250.0",
        explanation:
          "After selling 50 at 170, position = 100 shares at avg 153.33. PnL = 100*(175-153.33).",
      },
    ],
    approach:
      "Track (total_qty, total_cost_basis) per symbol. On buy: add to both. On sell (reducing position): realized PnL = qty_sold * (sell_price - avg_cost); reduce total_qty and total_cost_basis proportionally. On flip (sell more than held), handle as close-then-open.",
    code: `class PositionLedger:
    def __init__(self):
        # symbol -> (net_qty, total_cost_basis)
        self._positions: dict[str, tuple[float, float]] = {}
        self._realized: dict[str, float] = {}

    def trade(self, symbol: str, qty: float, price: float) -> float:
        """
        qty > 0: buy, qty < 0: sell.
        Returns realized P&L from this trade (0 if no close).
        """
        net_qty, cost_basis = self._positions.get(symbol, (0.0, 0.0))
        realized = 0.0

        if net_qty == 0:
            # Opening new position
            net_qty = qty
            cost_basis = qty * price
        elif (net_qty > 0 and qty < 0) or (net_qty < 0 and qty > 0):
            # Reducing or flipping
            close_qty = min(abs(qty), abs(net_qty))
            avg_cost = cost_basis / net_qty if net_qty != 0 else 0.0
            sign = 1 if net_qty > 0 else -1
            realized = sign * close_qty * (price - avg_cost)

            remaining_open = abs(net_qty) - close_qty
            if remaining_open > 0:
                # Partial close
                net_qty = sign * remaining_open
                cost_basis = avg_cost * net_qty
            else:
                # Full close or flip
                leftover = abs(qty) - close_qty
                if leftover > 0:
                    # Flip: open reverse position with leftover
                    net_qty = -sign * leftover
                    cost_basis = net_qty * price
                else:
                    net_qty = 0.0
                    cost_basis = 0.0
        else:
            # Adding to existing position (same direction)
            net_qty += qty
            cost_basis += qty * price

        self._positions[symbol] = (net_qty, cost_basis)
        self._realized[symbol] = self._realized.get(symbol, 0.0) + realized
        return realized

    def getPosition(self, symbol: str) -> tuple[float, float]:
        net_qty, cost_basis = self._positions.get(symbol, (0.0, 0.0))
        avg_cost = cost_basis / net_qty if net_qty != 0 else 0.0
        return net_qty, avg_cost

    def getUnrealizedPnL(self, symbol: str, market_price: float) -> float:
        net_qty, avg_cost = self.getPosition(symbol)
        return net_qty * (market_price - avg_cost)

    def getRealizedPnL(self, symbol: str) -> float:
        return self._realized.get(symbol, 0.0)

ledger = PositionLedger()
ledger.trade("AAPL", 100, 150)
ledger.trade("AAPL", 50, 160)
qty, avg = ledger.getPosition("AAPL")
print(f"Position: {qty} shares @ \${avg:.2f}")

r = ledger.trade("AAPL", -50, 170)
print(f"Realized from sell 50@170: \${r:.2f}")
print(f"Unrealized @ 175: \${ledger.getUnrealizedPnL('AAPL', 175):.2f}")`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(symbols)" },
  },
  {
    id: "fin-20260616-b1-liquidity-gap",
    title: "Liquidity Gap in Limit Order Book",
    difficulty: "medium",
    topics: ["Sorted Container", "Binary Search", "Order Book"],
    problem:
      "Given a limit order book as a list of (price, quantity) bid levels sorted descending and ask levels sorted ascending, find the largest price gap between consecutive levels across both sides of the book within a given price range [lo, hi]. Return the gap size.",
    examples: [
      {
        input:
          "bids=[(100,50),(98,100),(95,200)], asks=[(101,75),(104,150),(107,80)], lo=94, hi=108",
        output: "3",
        explanation:
          "Sorted unique prices: [95,98,100,101,104,107]. Gaps: 3,2,1,3,3. Max gap=3.",
      },
    ],
    approach:
      "Collect all price levels from both sides, sort them, filter to [lo, hi], then scan for maximum consecutive difference. O(n log n) for sort; O(n) for scan.",
    code: `import bisect

def max_liquidity_gap(bids: list[tuple[int, int]],
                      asks: list[tuple[int, int]],
                      lo: int, hi: int) -> int:
    """Find the largest price gap between consecutive price levels."""
    prices = sorted(
        {p for p, _ in bids + asks if lo <= p <= hi}
    )
    if len(prices) < 2:
        return 0
    return max(prices[i+1] - prices[i] for i in range(len(prices)-1))

def gap_location(bids, asks, lo, hi):
    """Return (gap_size, gap_lo, gap_hi) for the worst gap."""
    prices = sorted({p for p, _ in bids + asks if lo <= p <= hi})
    if len(prices) < 2:
        return 0, 0, 0
    best = (0, 0, 0)
    for i in range(len(prices) - 1):
        g = prices[i+1] - prices[i]
        if g > best[0]:
            best = (g, prices[i], prices[i+1])
    return best

bids = [(100, 50), (98, 100), (95, 200), (91, 500)]
asks = [(101, 75), (104, 150), (107, 80), (112, 200)]

gap = max_liquidity_gap(bids, asks, lo=90, hi=115)
print(f"Max liquidity gap: {gap}")

size, g_lo, g_hi = gap_location(bids, asks, lo=90, hi=115)
print(f"Worst gap: {size} ticks between {g_lo} and {g_hi}")

# Simulate adding a new level in the gap
mid_level = (g_lo + g_hi) // 2
bids.append((mid_level, 30))
new_gap = max_liquidity_gap(bids, asks, lo=90, hi=115)
print(f"After adding level at {mid_level}, max gap: {new_gap}")`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260616-b1-job-scheduling",
    title: "Weighted Job Scheduling (Trade Settlement Windows)",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Binary Search", "Interval Scheduling"],
    problem:
      "You have n trade settlement jobs, each with start time, end time, and profit (settlement value). Find the maximum total profit from non-overlapping jobs. Jobs cannot overlap (a job must fully complete before the next starts).",
    examples: [
      {
        input:
          "jobs = [(1,3,50), (2,5,20), (4,6,70), (6,8,60), (5,9,90)]",
        output: "180",
        explanation:
          "Select job (1,3,50) + (4,6,70) + (6,8,60) = 180. Job (5,9,90) can't combine as well.",
      },
    ],
    constraints: [
      "1 <= n <= 5 * 10^4",
      "1 <= start < end <= 10^9",
      "1 <= profit <= 10^4",
    ],
    approach:
      "Sort by end time. dp[i] = max profit using first i jobs. For each job i, binary search for last job j that ends <= start[i]. dp[i] = max(dp[i-1], dp[j] + profit[i]).",
    code: `import bisect

def jobScheduling(start: list[int], end: list[int],
                  profit: list[int]) -> int:
    jobs = sorted(zip(start, end, profit), key=lambda x: x[1])
    ends = [0]   # sentinel
    dp   = [0]   # dp[i] = max profit from first i jobs

    for s, e, p in jobs:
        # Find last job that ends <= s (no overlap)
        idx = bisect.bisect_right(ends, s) - 1
        new_profit = dp[idx] + p
        if new_profit > dp[-1]:
            dp.append(new_profit)
            ends.append(e)
        else:
            dp.append(dp[-1])
            ends.append(e)

    return dp[-1]

def job_scheduling_with_selection(
    start, end, profit
) -> tuple[int, list[int]]:
    """Also return which jobs to take."""
    jobs = sorted(enumerate(zip(start, end, profit)),
                  key=lambda x: x[1][1])
    ends = [0]
    dp   = [0]
    choice = [-1]

    for orig_idx, (s, e, p) in jobs:
        idx = bisect.bisect_right(ends, s) - 1
        new_profit = dp[idx] + p
        if new_profit > dp[-1]:
            dp.append(new_profit)
            ends.append(e)
            choice.append(orig_idx)
        else:
            dp.append(dp[-1])
            ends.append(e)
            choice.append(choice[-1])

    return dp[-1], choice

starts  = [1, 2, 4, 6, 5]
ends    = [3, 5, 6, 8, 9]
profits = [50, 20, 70, 60, 90]

result = jobScheduling(starts, ends, profits)
print(f"Max profit: {result}")

result2, _ = job_scheduling_with_selection(starts, ends, profits)
print(f"Verified:   {result2}")`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 1235,
  },
  {
    id: "fin-20260616-b1-circular-arbitrage",
    title: "Circular Arbitrage Detection",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Negative Cycle", "FX"],
    problem:
      "Given n currencies and exchange rates as an n×n matrix where rates[i][j] is the rate from currency i to j (0 if no direct exchange), detect if a circular arbitrage opportunity exists (i.e., starting with 1 unit you can return with > 1 unit after a sequence of trades).",
    examples: [
      {
        input: "rates = [[1,0.5,0.9],[2,1,1.8],[1.12,0.56,1]]",
        output: "True",
        explanation:
          "USD->EUR->GBP->USD: 1 * 2 * 1.8 * 0.9 = 3.24 > 1. Profit opportunity exists.",
      },
    ],
    approach:
      "Transform to log space: log(product) = sum of logs. Arbitrage means a positive cycle in sum of logs, equivalent to negative cycle in sum of -log(rate). Run Bellman-Ford on -log(rates) and check for negative cycles.",
    code: `import math

def has_arbitrage(rates: list[list[float]]) -> bool:
    """
    Detect circular arbitrage via Bellman-Ford negative cycle detection.
    Edge weight = -log(rate[i][j]).
    A negative cycle in weight space = positive return cycle in rate space.
    """
    n = len(rates)
    # Build edge list in log space
    edges = []
    for i in range(n):
        for j in range(n):
            if i != j and rates[i][j] > 0:
                edges.append((i, j, -math.log(rates[i][j])))

    # Bellman-Ford from virtual source (or from every node via super-source)
    dist = [0.0] * n  # start with 0 (log of 1.0) at each node

    # n-1 relaxation rounds
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # Check for negative cycles (one more round)
    for u, v, w in edges:
        if dist[u] + w < dist[v] - 1e-10:
            return True
    return False

def find_arbitrage_cycle(rates, currencies):
    """Return one arbitrage cycle if it exists."""
    n = len(rates)
    edges = []
    for i in range(n):
        for j in range(n):
            if i != j and rates[i][j] > 0:
                edges.append((i, j, -math.log(rates[i][j])))

    dist = [0.0] * n
    pred = [-1] * n

    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                pred[v] = u

    # Find vertex in negative cycle
    for u, v, w in edges:
        if dist[u] + w < dist[v] - 1e-10:
            # Trace back n steps to find cycle
            cycle_start = v
            for _ in range(n):
                cycle_start = pred[cycle_start]

            path = []
            node = cycle_start
            while True:
                path.append(node)
                node = pred[node]
                if node == cycle_start and len(path) > 1:
                    break
            path.append(cycle_start)
            path.reverse()
            return [currencies[i] for i in path]
    return None

currencies = ["USD", "EUR", "GBP"]
rates = [
    [1.0,  0.5,  0.9],
    [2.0,  1.0,  1.8],
    [1.12, 0.56, 1.0],
]
print(f"Arbitrage exists: {has_arbitrage(rates)}")
cycle = find_arbitrage_cycle(rates, currencies)
if cycle:
    print(f"Cycle: {' -> '.join(cycle)}")
    # Compute actual return
    gain = 1.0
    for i in range(len(cycle)-1):
        a = currencies.index(cycle[i])
        b = currencies.index(cycle[i+1])
        gain *= rates[a][b]
    print(f"Return on 1 unit: {gain:.4f}")`,
    language: "python",
    complexity: { time: "O(V·E)", space: "O(V + E)" },
  },
  {
    id: "fin-20260616-b1-random-walk-dp",
    title: "Expected Profit from Random Walk with Absorbing Barriers",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Math", "Probability", "Random Walk"],
    problem:
      "A stock price starts at position 0 and at each step moves +1 with probability p or -1 with probability (1-p). The position is absorbed at +N (profit = N) or -M (loss = M). Compute the expected profit using dynamic programming.",
    examples: [
      {
        input: "p=0.55, N=5, M=5",
        output: "1.26",
        explanation:
          "With p=0.55 slightly in your favor, expected profit is positive but reduced by ruin risk.",
      },
    ],
    approach:
      "Let E[k] = expected profit starting from position k. Boundary: E[N]=N, E[-M]=-M. For interior: E[k] = p*E[k+1] + (1-p)*E[k-1]. This linear recurrence has closed form for p != 0.5.",
    code: `def expected_rw_profit(p: float, N: int, M: int) -> dict:
    """
    Solve for expected profit from random walk with absorbing barriers.
    Starting position 0, absorbing at +N (win N) or -M (lose M).
    """
    q = 1 - p
    total = N + M  # number of interior states
    # States: -M, -M+1, ..., -1, 0, 1, ..., N
    # Index: 0=absorb at -M, total=absorb at N
    # Interior: 1..total-1

    if abs(p - 0.5) < 1e-12:
        # Symmetric case: linear interpolation
        ruin_prob = M / (N + M)
        win_prob  = N / (N + M)
        expected  = win_prob * N - ruin_prob * M
        return {"expected_profit": expected,
                "ruin_probability": ruin_prob}

    # Closed form for p != 0.5: P(ruin) from position k above -M
    # P(reach N before -M | start at k) = (1 - (q/p)^(k+M)) / (1 - (q/p)^(N+M))
    ratio = q / p
    denom = 1 - ratio**(N + M)

    def win_prob_from(k: int) -> float:
        """Prob of reaching N starting from k (k in [-M, N])."""
        return (1 - ratio**(k + M)) / denom

    def expected_from(k: int) -> float:
        wp = win_prob_from(k)
        rp = 1 - wp
        return wp * N - rp * M

    # DP verification
    E = [0.0] * (total + 1)
    E[0]     = -M   # absorbing at -M
    E[total] = N    # absorbing at +N
    for _ in range(10000):  # iterate to convergence
        for i in range(1, total):
            E[i] = p * E[i+1] + q * E[i-1]

    starting_state = M  # position 0 is index M from the -M boundary
    return {
        "expected_profit_dp":      E[starting_state],
        "expected_profit_analytic": expected_from(0),
        "win_probability":          win_prob_from(0),
        "ruin_probability":         1 - win_prob_from(0),
        "E_values":                 {i - M: E[i]
                                     for i in range(total + 1)},
    }

for p_val in [0.45, 0.50, 0.55, 0.60]:
    res = expected_rw_profit(p=p_val, N=10, M=10)
    print(f"p={p_val:.2f}: E[profit]={res['expected_profit_dp']:+.4f} "
          f"P(ruin)={res['ruin_probability']:.4f}")`,
    language: "python",
    complexity: { time: "O(N+M) analytic, O((N+M)^2) DP", space: "O(N+M)" },
  },
];
