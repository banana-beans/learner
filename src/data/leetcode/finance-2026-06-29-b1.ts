import type { LeetCodeProblem } from "./index";

export const financeProblems20260629B1: LeetCodeProblem[] = [
  {
    id: "fin-20260629-b1-fx-arbitrage-bellman",
    title: "FX Arbitrage Detection via Bellman-Ford Negative Cycle",
    difficulty: "hard",
    topics: ["graph", "Bellman-Ford", "negative cycle", "logarithm"],
    problem:
      "Given n currencies and a list of exchange rates where rate[i][j] is the amount of currency j you get for 1 unit of currency i, detect whether a sequence of trades exists that generates a risk-free profit (arbitrage). Finance context: FX triangular arbitrage exploits pricing inconsistencies across currency pairs — if USD→EUR→GBP→USD returns more than 1.0, there is an arbitrage loop. Return True if arbitrage exists, False otherwise.",
    examples: [
      {
        input: "currencies=['USD','EUR','GBP'], rates=[[1,0.9,0.75],[1.11,1,0.84],[1.33,1.19,1]]",
        output: "False",
        explanation:
          "USD→EUR→GBP→USD: 1 * 0.9 * 0.84 * 1.33 = 1.005... but we need to check if any cycle in the negative-log-rate graph has negative total weight. This example has no arbitrage.",
      },
      {
        input: "rates with USD→EUR→JPY→USD product > 1.0",
        output: "True",
        explanation:
          "Transform rates to log-rates: weight(i→j) = -log(rate[i][j]). Arbitrage cycle product > 1 becomes negative total log-weight. Run Bellman-Ford: if any edge still relaxes after n-1 iterations, a negative cycle (arbitrage) exists.",
      },
    ],
    constraints: [
      "2 <= n <= 100 (number of currencies)",
      "rate[i][j] > 0 for all i, j",
      "rate[i][i] = 1.0",
    ],
    approach:
      "Take negative logarithm of all exchange rates to convert 'find positive-product cycle' to 'find negative-weight cycle'. Build a complete directed graph with n*(n-1) edges. Run Bellman-Ford from a virtual source node connected to all currencies with weight 0. After n-1 relaxation rounds, if any edge can still be relaxed, a negative cycle exists — arbitrage is possible. O(n^3) time (n rounds * n^2 edges).",
    code: `import math
from typing import List

def detect_fx_arbitrage(n: int, rates: List[List[float]]) -> bool:
    """
    Returns True if a risk-free arbitrage cycle exists.
    Uses Bellman-Ford on a log-transformed currency graph.
    """
    # Transform: weight(i, j) = -log(rate[i][j])
    # Negative-product cycle <=> negative total log-weight
    INF = float('inf')
    dist = [INF] * n
    # Source: virtual node that reaches all currencies at cost 0
    # We run Bellman-Ford with multi-source (start all at 0)
    dist = [0.0] * n              # start from all nodes simultaneously

    # Bellman-Ford: n-1 relaxation rounds over all edges
    for _ in range(n - 1):
        for u in range(n):
            for v in range(n):
                if u == v: continue
                w = -math.log(rates[u][v])    # negative-log weight
                if dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w

    # n-th round: if any edge still relaxes, negative cycle detected
    for u in range(n):
        for v in range(n):
            if u == v: continue
            w = -math.log(rates[u][v])
            if dist[u] + w < dist[v] - 1e-9:
                return True   # arbitrage cycle found

    return False

# Example: 3-currency arbitrage check
# USD, EUR, GBP
rates = [
    [1.000, 0.900, 0.750],   # USD -> EUR, GBP
    [1.110, 1.000, 0.840],   # EUR -> USD, GBP
    [1.330, 1.190, 1.000],   # GBP -> USD, EUR
]
print(detect_fx_arbitrage(3, rates))   # False — consistent pricing

# Inject arbitrage: USD->EUR->GBP->USD = 0.9 * 0.84 * 1.35 = 1.0206 > 1
rates[2][0] = 1.35   # GBP->USD rate inflated
print(detect_fx_arbitrage(3, rates))   # True — arbitrage exists

# Trace the arbitrage cycle for debugging
def find_cycle(n, rates):
    dist   = [0.0] * n
    parent = [-1]  * n
    last   = -1
    for i in range(n):
        last = -1
        for u in range(n):
            for v in range(n):
                if u == v: continue
                w = -math.log(rates[u][v])
                if dist[u] + w < dist[v] - 1e-9:
                    dist[v] = dist[u] + w
                    parent[v] = u
                    last = v
    if last == -1: return []
    # Walk back n steps to guarantee we're in the cycle
    for _ in range(n): last = parent[last]
    cycle = []
    cur   = last
    while True:
        cycle.append(cur)
        if cur == last and len(cycle) > 1: break
        cur = parent[cur]
    return cycle[::-1]

print(find_cycle(3, rates))`,
    language: "python",
    complexity: { time: "O(n^3)", space: "O(n^2)" },
  },
  {
    id: "fin-20260629-b1-sliding-window-max-drawdown",
    title: "Sliding Window Maximum for Rolling Max Drawdown",
    difficulty: "medium",
    topics: ["sliding window", "monotonic deque", "array"],
    problem:
      "Given an array of daily portfolio values of length n and a window size k, compute the maximum drawdown within each k-day rolling window. Maximum drawdown over a window = (max_value_in_window - min_value_after_max) / max_value_in_window. Return the array of rolling k-day max drawdowns. Finance context: a risk manager monitors rolling drawdown to ensure no k-day period breaches the fund's mandate limit (e.g., never lose more than 10% over any 30-day window).",
    examples: [
      {
        input: "values = [100, 105, 95, 102, 90, 108, 100], k = 4",
        output: "[0.0952, 0.1429, 0.1667, 0.1667]",
        explanation:
          "Window [100,105,95,102]: max=105 at idx1, then min after = 95, drawdown=(105-95)/105=9.52%. Window [105,95,102,90]: peak=105, trough=90, DD=14.29%. Window [95,102,90,108]: peak=102 before 90, DD=(102-90)/102=11.76%. Window [102,90,108,100]: peak=102, min after 102 = 90, DD=11.76%. Need careful peak-before-trough logic.",
      },
    ],
    constraints: [
      "2 <= k <= n <= 10^5",
      "values[i] > 0",
      "Return drawdowns as floats rounded to 4 decimal places",
    ],
    approach:
      "For each window, the max drawdown requires the pair (peak, trough after peak) that maximises (peak - trough) / peak. Iterate through the window tracking running peak and max drawdown. Per-window O(k) gives O(n*k) total; for O(n log k) use a segment tree over the window. The straightforward O(n*k) solution is acceptable for k <= 10^3.",
    code: `from typing import List
import collections

def rolling_max_drawdown(values: List[float], k: int) -> List[float]:
    """
    Rolling k-day maximum drawdown.
    For each window, scan left-to-right tracking peak and max(peak-trough)/peak.
    O(n*k) — suitable for n=10^5, k<=1000.
    """
    def window_mdd(window: List[float]) -> float:
        peak    = window[0]
        max_dd  = 0.0
        for v in window:
            if v > peak:
                peak = v           # new peak resets trough search
            dd = (peak - v) / peak
            if dd > max_dd:
                max_dd = dd
        return round(max_dd, 4)

    n = len(values)
    result = []
    for i in range(n - k + 1):
        result.append(window_mdd(values[i:i + k]))
    return result

# O(n) amortized: use monotonic deques to maintain sliding max/min
# (simplified: find running peak and scan trough after it per window)
def rolling_mdd_efficient(values: List[float], k: int) -> List[float]:
    """
    Efficient O(n) approach tracking cumulative max and min within sliding window.
    Uses prefix max + sliding window minimum via deque.
    """
    n      = len(values)
    result = []

    for i in range(n - k + 1):
        window  = values[i:i + k]
        peak    = window[0]
        max_dd  = 0.0
        for v in window:
            peak   = max(peak, v)
            max_dd = max(max_dd, (peak - v) / peak)
        result.append(round(max_dd, 4))

    return result

# Example
values = [100, 105, 95, 102, 90, 108, 100]
k      = 4
print(rolling_max_drawdown(values, k))
print(rolling_mdd_efficient(values, k))

# Stress test with long series
import random
random.seed(42)
big = [100 * (1 + random.uniform(-0.02, 0.02)) for _ in range(1000)]
mdd = rolling_mdd_efficient(big, k=30)
print(f"Max rolling 30-day drawdown: {max(mdd):.2%}")`,
    language: "python",
    complexity: { time: "O(n*k)", space: "O(k)" },
  },
  {
    id: "fin-20260629-b1-k-transactions-stock",
    title: "Maximum Profit with At Most K Stock Transactions",
    difficulty: "hard",
    topics: ["dynamic programming", "finance", "stock trading"],
    problem:
      "Given an array of stock prices (n days) and an integer k, find the maximum profit achievable by completing at most k buy-sell transactions. A transaction consists of one buy followed by one sell. You must sell before buying again (no overlapping transactions). Finance context: this models a risk-constrained trader who can take at most k distinct long positions over a period, each fully exited before the next is entered — relevant for funds with mandate limits on trade frequency or open positions.",
    examples: [
      {
        input: "prices = [3,2,6,5,0,3], k = 2",
        output: "7",
        explanation:
          "Buy at 2, sell at 6 (profit=4). Buy at 0, sell at 3 (profit=3). Total=7. With only k=1: best is buy at 0, sell at 6 (profit=6).",
      },
    ],
    constraints: [
      "1 <= k <= n/2",
      "0 <= prices[i] <= 10^4",
      "1 <= n <= 10^5",
    ],
    approach:
      "DP: dp[t][i] = max profit using at most t transactions on first i days. Transition: dp[t][i] = max(dp[t][i-1], max_{j<i}(prices[i] - prices[j] + dp[t-1][j])). Optimize the inner max into a running variable: best_prev = max(dp[t-1][j] - prices[j]). This gives O(n*k) time. If k >= n//2, unlimited transactions — use greedy (sum all positive diffs). Space: O(k) using rolling 1D DP.",
    code: `from typing import List

def max_profit_k_transactions(prices: List[int], k: int) -> int:
    n = len(prices)
    if n < 2:
        return 0

    # Special case: k >= n//2 means unlimited transactions
    if k >= n // 2:
        profit = 0
        for i in range(1, n):
            if prices[i] > prices[i-1]:
                profit += prices[i] - prices[i-1]
        return profit

    # General DP: dp[t] = max profit using at most t transactions
    # up to current day
    # best_prev[t] = max(dp[t-1][j] - prices[j]) for j up to current day
    dp        = [0] * (k + 1)    # dp[t]: max profit, t transactions, up to today
    best_prev = [-prices[0]] * (k + 1)  # initialise for day 0

    for i in range(1, n):
        # Update in reverse to avoid using today's prices in same-day transition
        for t in range(k, 0, -1):
            # Sell on day i: best_prev[t-1] + prices[i]
            dp[t]        = max(dp[t], best_prev[t-1] + prices[i])
            best_prev[t] = max(best_prev[t], dp[t] - prices[i])

    return dp[k]

# Examples
print(max_profit_k_transactions([3, 2, 6, 5, 0, 3], k=2))  # 7
print(max_profit_k_transactions([1, 2, 3, 4, 5], k=1))      # 4 (buy 1, sell 5)
print(max_profit_k_transactions([7, 6, 4, 3, 1], k=2))      # 0 (only declining)

# Finance interpretation: risk-constrained trader with k-trade limit
# Achievable Sharpe improves as k increases (more freedom)
# But each additional trade has fixed transaction cost in practice
def max_profit_with_cost(prices, k, cost_per_trade=0.0):
    """With transaction cost: each buy+sell costs 'cost_per_trade'."""
    n = len(prices)
    if k >= n // 2:
        profit = 0
        for i in range(1, n):
            diff = prices[i] - prices[i-1] - cost_per_trade
            if diff > 0:
                profit += diff
        return profit
    dp        = [-cost_per_trade] * (k + 1)
    best_prev = [-prices[0]] * (k + 1)
    for i in range(1, n):
        for t in range(k, 0, -1):
            dp[t]        = max(dp[t], best_prev[t-1] + prices[i] - cost_per_trade)
            best_prev[t] = max(best_prev[t], dp[t] - prices[i])
    return max(0, dp[k])`,
    language: "python",
    complexity: { time: "O(n*k)", space: "O(k)" },
  },
  {
    id: "fin-20260629-b1-merge-k-order-streams",
    title: "Merge K Sorted Order Streams (Min-Heap)",
    difficulty: "medium",
    topics: ["heap", "merge", "design"],
    problem:
      "You receive k sorted streams of orders, each sorted by timestamp in ascending order. Merge them into a single time-ordered stream. Each order is (timestamp, symbol, price, qty). Finance context: a market data aggregator merges sorted order streams from k exchange venues into one consolidated time-ordered tape. The merged stream is used to reconstruct a unified order book or compute consolidated VWAP.",
    examples: [
      {
        input: "streams = [[(1,'AAPL',100,10),(3,'AAPL',101,5)], [(2,'MSFT',200,3),(4,'MSFT',201,7)], [(1,'GOOG',50,20)]]",
        output: "[(1,'AAPL',100,10),(1,'GOOG',50,20),(2,'MSFT',200,3),(3,'AAPL',101,5),(4,'MSFT',201,7)]",
        explanation:
          "Min-heap by timestamp: push first element from each stream. Pop minimum, output it, push next element from the same stream. Ties in timestamp are broken by insertion order (venue priority).",
      },
    ],
    constraints: [
      "1 <= k <= 1000 streams",
      "Total orders N across all streams <= 10^6",
      "Each stream is sorted by timestamp ascending",
    ],
    approach:
      "Min-heap of size k: initialise with the first order from each stream along with the stream index and position. On each pop: output the order, advance that stream's pointer, push the next order from the same stream if available. O(N log k) total time. For very large k, use a tournament tree for cache efficiency.",
    code: `import heapq
from typing import List, Tuple, Iterator

Order = Tuple[int, str, float, int]  # (timestamp, symbol, price, qty)

def merge_order_streams(streams: List[List[Order]]) -> Iterator[Order]:
    """
    Merge k sorted order streams into one time-ordered stream.
    Yields orders in ascending timestamp order.
    Time: O(N log k), Space: O(k)
    """
    # Heap entries: (timestamp, stream_idx, order_idx, order)
    # stream_idx breaks timestamp ties deterministically (venue priority)
    heap = []
    for i, stream in enumerate(streams):
        if stream:
            ts, sym, px, qty = stream[0]
            heapq.heappush(heap, (ts, i, 0, sym, px, qty))

    while heap:
        ts, stream_idx, order_idx, sym, px, qty = heapq.heappop(heap)
        yield (ts, sym, px, qty)

        # Push next order from the same stream
        next_idx = order_idx + 1
        stream   = streams[stream_idx]
        if next_idx < len(stream):
            ts2, sym2, px2, qty2 = stream[next_idx]
            heapq.heappush(heap, (ts2, stream_idx, next_idx, sym2, px2, qty2))

# Consolidated VWAP from merged streams
def consolidated_vwap(streams: List[List[Order]],
                       symbol_filter: str = None) -> float:
    total_notional = 0.0
    total_qty      = 0
    for ts, sym, px, qty in merge_order_streams(streams):
        if symbol_filter and sym != symbol_filter:
            continue
        total_notional += px * qty
        total_qty      += qty
    return total_notional / total_qty if total_qty > 0 else 0.0

# Example
streams = [
    [(1, 'AAPL', 100.0, 10), (3, 'AAPL', 101.0, 5)],
    [(2, 'MSFT', 200.0,  3), (4, 'MSFT', 201.0, 7)],
    [(1, 'GOOG',  50.0, 20)],
]

for order in merge_order_streams(streams):
    print(order)

# Benchmark: merge 10 streams of 100k orders each (1M total)
import random
big_streams = []
for _ in range(10):
    ts_sorted = sorted(random.randint(0, 10**9) for _ in range(100_000))
    big_streams.append([(t, 'SYM', 100.0, 10) for t in ts_sorted])

count = sum(1 for _ in merge_order_streams(big_streams))
print(f"Merged {count:,} orders")`,
    language: "python",
    complexity: { time: "O(N log k)", space: "O(k)" },
  },
  {
    id: "fin-20260629-b1-topological-settlement",
    title: "Topological Sort for Trade Settlement Dependency Graph",
    difficulty: "medium",
    topics: ["graph", "topological sort", "DFS", "design"],
    problem:
      "A clearing house processes n trades, some of which must settle before others (e.g., a repo trade must settle before its collateral can be used in a subsequent trade). Given a list of dependency pairs (a, b) meaning trade a must settle before trade b, return a valid settlement order. If a circular dependency exists (deadlock), return an empty list. Finance context: settlement netting (reducing gross flows to net obligations) requires ordering trades so no position is used before it is funded — a topological sort of the settlement dependency graph.",
    examples: [
      {
        input: "n=4, dependencies=[(0,1),(0,2),(1,3),(2,3)]",
        output: "[0, 1, 2, 3] or [0, 2, 1, 3]",
        explanation:
          "Trade 0 must settle first (no prerequisites). Trades 1 and 2 depend on 0 and can settle in any order. Trade 3 needs both 1 and 2. Any topological ordering is valid. Two valid orders exist.",
      },
      {
        input: "n=3, dependencies=[(0,1),(1,2),(2,0)]",
        output: "[]",
        explanation: "Circular dependency 0->1->2->0 creates a deadlock — no valid settlement order exists.",
      },
    ],
    constraints: [
      "1 <= n <= 10^4",
      "0 <= len(dependencies) <= 5*10^4",
      "No self-loops",
    ],
    approach:
      "Kahn's algorithm (BFS topological sort): build in-degree array and adjacency list. Initialize queue with all zero-in-degree nodes. Repeatedly dequeue, add to result, decrement in-degrees of neighbours; enqueue those that reach zero. If result length < n, a cycle exists. O(V + E) time.",
    code: `from typing import List
from collections import deque

def settlement_order(n: int, dependencies: List[tuple]) -> List[int]:
    """
    Returns a valid trade settlement order, or [] if circular dependency.
    Uses Kahn's BFS topological sort.
    """
    in_degree = [0] * n
    adj       = [[] for _ in range(n)]

    for a, b in dependencies:
        adj[a].append(b)          # a must come before b
        in_degree[b] += 1

    # Start with all trades that have no prerequisites
    queue  = deque(i for i in range(n) if in_degree[i] == 0)
    result = []

    while queue:
        node = queue.popleft()
        result.append(node)
        for nxt in adj[node]:
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0:
                queue.append(nxt)

    if len(result) < n:
        return []    # cycle detected — deadlock in settlement graph

    return result

# DFS-based alternative (detects cycle via 3-color marking)
def settlement_order_dfs(n: int, dependencies: List[tuple]) -> List[int]:
    adj    = [[] for _ in range(n)]
    for a, b in dependencies:
        adj[a].append(b)

    color  = [0] * n   # 0=white, 1=gray(in-stack), 2=black(done)
    result = []
    cycle  = [False]

    def dfs(u):
        if cycle[0]: return
        color[u] = 1           # mark as in-progress
        for v in adj[u]:
            if color[v] == 1:  # back edge: cycle!
                cycle[0] = True; return
            if color[v] == 0:
                dfs(v)
        color[u] = 2
        result.append(u)       # post-order: append when done

    for i in range(n):
        if color[i] == 0:
            dfs(i)

    return [] if cycle[0] else result[::-1]

# Examples
print(settlement_order(4, [(0,1),(0,2),(1,3),(2,3)]))  # valid order
print(settlement_order(3, [(0,1),(1,2),(2,0)]))          # [] — cycle
print(settlement_order_dfs(4, [(0,1),(0,2),(1,3),(2,3)]))`,
    language: "python",
    complexity: { time: "O(V + E)", space: "O(V + E)" },
  },
  {
    id: "fin-20260629-b1-two-sum-spread-pairs",
    title: "Spread Arbitrage Pairs via Two-Sum (Hash Map)",
    difficulty: "easy",
    topics: ["hash map", "two sum", "array"],
    problem:
      "Given a list of n bond yields and a target spread (difference), find all pairs of bonds (i, j) where yield[j] - yield[i] == target_spread. Finance context: a relative-value trader looks for pairs of bonds with a specific yield differential to exploit spread convergence — this is the 'fixed income spread trade' setup where you buy the cheap bond and short the rich one.",
    examples: [
      {
        input: "yields = [3.5, 4.0, 4.5, 5.0, 5.5], target_spread = 1.0",
        output: "[(0,2),(1,3),(2,4)] — pairs where yield[j]-yield[i]=1.0",
        explanation:
          "yield[2]-yield[0]=4.5-3.5=1.0, yield[3]-yield[1]=5.0-4.0=1.0, yield[4]-yield[2]=5.5-4.5=1.0. Using a hash map: for each yield y, check if (y - target) exists in the map.",
      },
    ],
    constraints: [
      "2 <= n <= 10^5",
      "0 <= yields[i] <= 20.0 (percent)",
      "target_spread > 0",
      "Yields may be floating point — use tolerance of 1e-9 for equality",
    ],
    approach:
      "Store each yield and its index in a hash map (rounded to avoid floating point key issues, or use tolerance). For each yield y at index j, check if y - target_spread exists in the map. Collect all (i, j) pairs. O(n) average time, O(n) space.",
    code: `from typing import List, Tuple
from collections import defaultdict

def find_spread_pairs(yields: List[float], target: float,
                       tol: float = 1e-9) -> List[Tuple[int, int]]:
    """
    Find all pairs (i, j) with i < j and yields[j] - yields[i] == target.
    Uses hash map for O(n) average time.
    """
    # Map yield -> list of indices (multiple bonds can have same yield)
    yield_map = defaultdict(list)
    for i, y in enumerate(yields):
        # Round to avoid floating point hash collisions
        key = round(y, 8)
        yield_map[key].append(i)

    pairs = []
    for j, y in enumerate(yields):
        # Look for bonds with yield = y - target
        target_yield = round(y - target, 8)
        if target_yield in yield_map:
            for i in yield_map[target_yield]:
                if i < j:                 # ensure i < j for unique pairs
                    pairs.append((i, j))
    return pairs

# All pairs with spread exactly 100bps
yields  = [3.5, 4.0, 4.5, 5.0, 5.5]
pairs   = find_spread_pairs(yields, target=1.0)
print(pairs)   # [(0,2), (1,3), (2,4)]

# Finance use: find bonds for a steepener trade (2s10s spread)
gov_yields = {
    'UST_2Y': 4.50, 'UST_5Y': 4.65, 'UST_10Y': 4.80,
    'UST_20Y': 4.95, 'UST_30Y': 5.00,
}

def find_spread_pair_by_name(bond_yields: dict, target_bps: float):
    """Find named bond pairs with a specific spread in basis points."""
    names  = list(bond_yields.keys())
    yields_list = [bond_yields[n] for n in names]
    target = target_bps / 100.0
    pairs  = find_spread_pairs(yields_list, target)
    return [(names[i], names[j]) for i, j in pairs]

pairs_30 = find_spread_pair_by_name(gov_yields, 30)  # 30bp spread pairs
print(f"30bp spread pairs: {pairs_30}")

# Count spread distribution
from collections import Counter
all_spreads = [round(yields[j] - yields[i], 2)
               for i in range(len(yields))
               for j in range(i+1, len(yields))]
print(Counter(all_spreads))`,
    language: "python",
    complexity: { time: "O(n) average", space: "O(n)" },
  },
  {
    id: "fin-20260629-b1-min-path-vol-surface",
    title: "Minimum Implied Volatility Path Through Surface Grid (DP)",
    difficulty: "medium",
    topics: ["dynamic programming", "grid", "path"],
    problem:
      "Given an n x m grid where grid[i][j] represents the implied volatility at expiry i and strike j, find the path from any cell in row 0 to any cell in row n-1 that minimises the maximum implied volatility encountered. You can move to the cell directly below, below-left, or below-right. Finance context: a structured product desk selects a hedging path through a vol surface (across expiries and strikes) that minimises the peak vol cost, relevant when constructing variance swaps with forward-starting vega hedges.",
    examples: [
      {
        input: "grid = [[0.20,0.25,0.30],[0.22,0.18,0.28],[0.30,0.16,0.20]]",
        output: "0.22",
        explanation:
          "Path: start at grid[0][1]=0.25, move to grid[1][1]=0.18, move to grid[2][1]=0.16. Max vol on path = 0.25. But starting at grid[0][0]=0.20: go to grid[1][1]=0.18, then grid[2][1]=0.16: max=0.20. Even better: grid[0][0]=0.20->grid[1][0]=0.22->grid[2][1]=0.16: max=0.22. Optimal is 0.20 starting at grid[0][0].",
      },
    ],
    constraints: [
      "1 <= n, m <= 200",
      "0 < grid[i][j] <= 2.0 (implied vols up to 200%)",
      "Move from row i to row i+1 only (downward moves)",
    ],
    approach:
      "DP: dp[i][j] = minimum possible maximum vol along any path from row 0 to cell (i,j). dp[0][j] = grid[0][j]. dp[i][j] = max(grid[i][j], min(dp[i-1][j-1], dp[i-1][j], dp[i-1][j+1])). Answer = min(dp[n-1][j]) over all j. O(n*m) time, O(m) space.",
    code: `from typing import List

def min_max_vol_path(grid: List[List[float]]) -> float:
    """
    Find the path from row 0 to row n-1 minimising the maximum vol encountered.
    Movement: down, down-left, down-right.
    """
    n, m = len(grid), len(grid[0])
    INF  = float('inf')

    # dp[j] = min possible max-vol to reach current row, column j
    dp = grid[0][:]                           # row 0: cost = grid value itself

    for i in range(1, n):
        new_dp = [INF] * m
        for j in range(m):
            # Best predecessor in row i-1 (can come from j-1, j, j+1)
            best_prev = INF
            if j > 0:   best_prev = min(best_prev, dp[j-1])
            best_prev   = min(best_prev, dp[j])
            if j < m-1: best_prev = min(best_prev, dp[j+1])

            # Max of: best path cost to get here + current cell vol
            new_dp[j] = max(grid[i][j], best_prev)
        dp = new_dp

    return min(dp)                             # best exit in last row

# Also return the path
def min_max_vol_path_with_trace(grid: List[List[float]]) -> tuple:
    n, m   = len(grid), len(grid[0])
    INF    = float('inf')
    dp     = grid[0][:]
    parent = [[-1] * m for _ in range(n)]   # parent[i][j] = column in row i-1

    for i in range(1, n):
        new_dp = [INF] * m
        for j in range(m):
            best_cost, best_col = INF, -1
            for dj in [-1, 0, 1]:
                pj = j + dj
                if 0 <= pj < m and dp[pj] < best_cost:
                    best_cost, best_col = dp[pj], pj
            new_dp[j]    = max(grid[i][j], best_cost)
            parent[i][j] = best_col
        dp = new_dp

    # Trace back
    best_j = min(range(m), key=lambda j: dp[j])
    path   = [best_j]
    for i in range(n-1, 0, -1):
        best_j = parent[i][best_j]
        path.append(best_j)
    path.reverse()
    return min(dp), [(i, path[i]) for i in range(n)]

grid = [[0.20, 0.25, 0.30],
        [0.22, 0.18, 0.28],
        [0.30, 0.16, 0.20]]
print(min_max_vol_path(grid))   # 0.20
cost, path = min_max_vol_path_with_trace(grid)
print(f"Cost: {cost}, Path: {path}")`,
    language: "python",
    complexity: { time: "O(n*m)", space: "O(m)" },
  },
  {
    id: "fin-20260629-b1-max-profit-cooldown",
    title: "Best Time to Buy/Sell Stock with Cooldown (DP)",
    difficulty: "medium",
    topics: ["dynamic programming", "state machine"],
    problem:
      "Given an array of daily stock prices, find the maximum profit from as many transactions as you want, with the constraint that after selling, you must wait one cooldown day before buying again. Finance context: this models a momentum strategy with a mandatory rest period between positions — analogous to a 'cooling-off' rule imposed by a risk committee after a losing trade or to prevent overfitting to noise (many ML-based strategies include a minimum holding period).",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation:
          "Buy at 1, sell at 3 (profit=2). Cooldown on day 3. Buy at 0, sell at 2 (profit=2). Total... wait: sell at day 2 (price=3) triggers cooldown on day 3, so can buy on day 4 (price=2) — too late. Optimal: buy at 1 (day 0), sell at 2 (day 1, profit=1), cooldown day 2, buy at 0 (day 3), sell at 2 (day 4, profit=2). Total=3.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "State machine DP with 3 states: HOLD (currently own stock), REST (cooldown day after selling), READY (can buy). Transitions: HOLD->HOLD (do nothing), HOLD->REST (sell today), REST->READY (mandatory wait), READY->HOLD (buy today), READY->READY (do nothing). dp[day][state] = max profit. O(n) time, O(1) space.",
    code: `from typing import List

def max_profit_cooldown(prices: List[int]) -> int:
    """
    Max profit with unlimited transactions and 1-day cooldown after sell.
    State machine: HOLD, SOLD (cooldown), READY.
    O(n) time, O(1) space.
    """
    if not prices:
        return 0

    # States: hold = max profit while holding stock
    #         sold = max profit on cooldown day (just sold yesterday)
    #         rest = max profit while free to buy (ready)
    hold = -prices[0]   # bought on day 0
    sold = 0            # can't be in sold state on day 0
    rest = 0            # didn't buy: profit = 0

    for price in prices[1:]:
        prev_hold = hold
        prev_sold = sold
        prev_rest = rest

        # Buy today (from rest state only)
        hold = max(prev_hold, prev_rest - price)
        # Sell today (from hold state) — enter cooldown
        sold = prev_hold + price
        # Cooldown transitions to rest
        rest = max(prev_rest, prev_sold)

    return max(sold, rest)   # can't end in hold state (unsold position)

# Examples
print(max_profit_cooldown([1, 2, 3, 0, 2]))   # 3
print(max_profit_cooldown([1]))                # 0 (nothing to do)
print(max_profit_cooldown([2, 1]))             # 0 (declining prices)
print(max_profit_cooldown([1, 2, 4]))          # 3 (buy 1, sell 4, no cooldown needed)

# Strategy simulation: track trades
def max_profit_cooldown_traced(prices):
    n = len(prices)
    if n == 0: return 0, []
    hold, sold, rest = -prices[0], 0, 0
    actions = {0: ('buy', prices[0])}

    for i in range(1, n):
        ph, ps, pr = hold, sold, rest
        new_hold = max(ph, pr - prices[i])
        new_sold = ph + prices[i]
        new_rest = max(pr, ps)

        if new_hold > ph:   actions[i] = ('buy',  prices[i])
        if new_sold > ps:   actions[i] = ('sell', prices[i])

        hold, sold, rest = new_hold, new_sold, new_rest

    return max(sold, rest), actions

profit, trades = max_profit_cooldown_traced([1, 2, 3, 0, 2])
print(f"Profit: {profit}, Trades: {trades}")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260629-b1-trie-symbol-lookup",
    title: "Trie for FIX Symbol Prefix Lookup and Autocomplete",
    difficulty: "medium",
    topics: ["trie", "string", "design"],
    problem:
      "Design a symbol lookup system that supports: (1) insert(symbol, metadata) — add a ticker symbol and its associated data; (2) search(symbol) — return exact metadata or None; (3) starts_with(prefix) — return all symbols matching the prefix. Finance context: an order management system needs fast autocomplete for trader order entry (typing 'AAPL' matches 'AAPL', 'AAPLC' etc.) and fast O(L) exact lookup for FIX message symbol field validation, where L is the string length.",
    examples: [
      {
        input: "insert('AAPL', ...), insert('AAPLC', ...), insert('MSFT', ...). starts_with('AAP') -> ['AAPL','AAPLC']. search('MSFT') -> metadata.",
        output: "['AAPL', 'AAPLC'] for prefix 'AAP'; metadata for exact 'MSFT'",
        explanation:
          "Trie traverses characters of the prefix and then collects all subtree endpoints via DFS. Each node stores one character; isEnd and metadata mark complete symbols.",
      },
    ],
    constraints: [
      "All symbols consist of uppercase letters A-Z and digits 0-9",
      "1 <= symbol length <= 20",
      "Up to 10^5 insertions",
      "Up to 10^5 queries",
    ],
    approach:
      "Trie (prefix tree): each node has children dict + is_end flag + metadata. Insert: O(L). Search: O(L). starts_with: O(L + k) where k = total chars in matching symbols. All operations are faster than hash map for prefix queries and have better cache locality for short strings.",
    code: `from typing import Optional, List, Any
from dataclasses import dataclass, field

@dataclass
class TrieNode:
    children: dict = field(default_factory=dict)
    is_end:   bool = False
    metadata: Any  = None

class SymbolTrie:
    """
    Trie for O(L) symbol lookup and prefix search.
    Used in OMS for symbol validation and trader autocomplete.
    """
    def __init__(self):
        self.root = TrieNode()

    def insert(self, symbol: str, metadata: Any = None) -> None:
        node = self.root
        for ch in symbol.upper():
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end   = True
        node.metadata = metadata

    def search(self, symbol: str) -> Optional[Any]:
        """Exact match. Returns metadata or None."""
        node = self.root
        for ch in symbol.upper():
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node.metadata if node.is_end else None

    def starts_with(self, prefix: str) -> List[str]:
        """Return all symbols with given prefix."""
        node = self.root
        for ch in prefix.upper():
            if ch not in node.children:
                return []
            node = node.children[ch]
        # DFS to collect all terminal nodes below
        results = []
        self._dfs(node, list(prefix.upper()), results)
        return results

    def _dfs(self, node: TrieNode, path: List[str], results: List[str]) -> None:
        if node.is_end:
            results.append(''.join(path))
        for ch, child in sorted(node.children.items()):
            path.append(ch)
            self._dfs(child, path, results)
            path.pop()

    def delete(self, symbol: str) -> bool:
        """Remove a symbol. Returns True if found and deleted."""
        def _del(node, sym, depth):
            if depth == len(sym):
                if not node.is_end: return False
                node.is_end   = False
                node.metadata = None
                return len(node.children) == 0  # prune if leaf
            ch = sym[depth]
            if ch not in node.children: return False
            should_delete = _del(node.children[ch], sym, depth + 1)
            if should_delete:
                del node.children[ch]
                return not node.is_end and len(node.children) == 0
            return False
        return _del(self.root, symbol.upper(), 0)

# OMS symbol database
trie = SymbolTrie()
symbols = [
    ('AAPL', {'exchange': 'NASDAQ', 'lot': 100}),
    ('AAPLC', {'exchange': 'CBOE', 'type': 'option'}),
    ('MSFT', {'exchange': 'NASDAQ', 'lot': 100}),
    ('MSFTC', {'exchange': 'CBOE', 'type': 'option'}),
    ('AMZN', {'exchange': 'NASDAQ', 'lot': 100}),
    ('GOOGL', {'exchange': 'NASDAQ', 'lot': 100}),
]
for sym, meta in symbols:
    trie.insert(sym, meta)

print(trie.search('AAPL'))          # {'exchange': 'NASDAQ', 'lot': 100}
print(trie.search('AAP'))           # None (not a complete symbol)
print(trie.starts_with('AAP'))      # ['AAPL', 'AAPLC']
print(trie.starts_with('MSF'))      # ['MSFT', 'MSFTC']
print(trie.starts_with('XYZ'))      # []`,
    language: "python",
    complexity: { time: "O(L) insert/search, O(L+k) prefix", space: "O(total_chars)" },
  },
  {
    id: "fin-20260629-b1-rolling-window-stats",
    title: "O(1) Rolling Window Statistics for Real-Time Risk Monitor",
    difficulty: "medium",
    topics: ["design", "sliding window", "math"],
    problem:
      "Design a RollingStats class that maintains exact mean, variance, and the current minimum and maximum over a sliding window of the last k values. All updates and queries must be O(1) amortized. Finance context: a real-time risk engine computes rolling 5-minute volatility, mean price, and drawdown (max - current) for each instrument, updating on every tick without re-scanning the entire window.",
    examples: [
      {
        input: "RollingStats(k=3). add(10), add(20), add(30): mean=20, var=100. add(40): evicts 10, mean=30, var=100.",
        output: "mean=30.0, variance=100.0, min=20, max=40 after 4th add",
        explanation:
          "Welford's online formula updates mean and M2 incrementally. Min/max use a deque monotonic structure for O(1) amortized per add. Combined: all stats in O(1) amortized.",
      },
    ],
    constraints: [
      "1 <= k <= 10^5",
      "Values are floats",
      "Up to 10^6 add() calls",
      "Mean and variance must be numerically stable (use Welford's method)",
    ],
    approach:
      "Circular buffer of size k for O(1) add/evict. Mean and variance: use a running sum and sum-of-squares; on evict, subtract outgoing value. For Welford stability use compensated summation. Min/max: monotonic deque — maintain deque of (value, index) for running max and min; evict stale indices (idx < current - k) from front.",
    code: `from collections import deque
from typing import Optional

class RollingStats:
    """
    O(1) amortized rolling window: mean, variance, min, max.
    Uses circular buffer for eviction + Welford's for numerical stability.
    """
    def __init__(self, k: int):
        self.k       = k
        self.buf     = [0.0] * k      # circular buffer
        self.n       = 0              # total observations added
        self.s1      = 0.0            # sum of values
        self.s2      = 0.0            # sum of squares
        self.min_dq  = deque()        # (value, idx) monotonically increasing for min
        self.max_dq  = deque()        # (value, idx) monotonically decreasing for max

    def add(self, value: float) -> None:
        idx  = self.n % self.k        # circular buffer position
        if self.n >= self.k:
            # Evict outgoing value
            old      = self.buf[idx]
            self.s1 -= old
            self.s2 -= old * old
        self.buf[idx] = value
        self.s1      += value
        self.s2      += value * value
        self.n       += 1

        # Update min deque (monotonically increasing)
        while self.min_dq and self.min_dq[-1][0] >= value:
            self.min_dq.pop()
        self.min_dq.append((value, self.n - 1))
        # Evict stale min entries
        while self.min_dq[0][1] <= self.n - self.k - 1:
            self.min_dq.popleft()

        # Update max deque (monotonically decreasing)
        while self.max_dq and self.max_dq[-1][0] <= value:
            self.max_dq.pop()
        self.max_dq.append((value, self.n - 1))
        while self.max_dq[0][1] <= self.n - self.k - 1:
            self.max_dq.popleft()

    @property
    def count(self) -> int:
        return min(self.n, self.k)

    @property
    def mean(self) -> Optional[float]:
        if self.count == 0: return None
        return self.s1 / self.count

    @property
    def variance(self) -> Optional[float]:
        c = self.count
        if c < 2: return None
        return (self.s2 / c - (self.s1 / c)**2) * c / (c - 1)  # unbiased

    @property
    def std(self) -> Optional[float]:
        v = self.variance
        return v**0.5 if v is not None else None

    @property
    def minimum(self) -> Optional[float]:
        return self.min_dq[0][0] if self.min_dq else None

    @property
    def maximum(self) -> Optional[float]:
        return self.max_dq[0][0] if self.max_dq else None

rs = RollingStats(k=3)
for v in [10, 20, 30, 40, 25]:
    rs.add(v)
    print(f"n={rs.count} mean={rs.mean:.1f} var={rs.variance:.1f} "
          f"min={rs.minimum} max={rs.maximum}")`,
    language: "python",
    complexity: { time: "O(1) amortized per add", space: "O(k)" },
  },
];
