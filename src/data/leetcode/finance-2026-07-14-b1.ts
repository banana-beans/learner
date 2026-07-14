import type { LeetCodeProblem } from "./index";

export const financeProblems20260714B1: LeetCodeProblem[] = [
  {
    id: "fin-20260714-b1-fx-arbitrage-bellman",
    title: "FX Arbitrage Detection (Bellman-Ford Negative Cycle)",
    difficulty: "hard",
    topics: ["graph", "bellman-ford", "shortest-path"],
    problem:
      "Given N currencies and a list of exchange rates rates[i][j] (the amount of currency j you get for 1 unit of currency i), determine whether a triangular or multi-currency arbitrage opportunity exists. An opportunity exists if there is a cycle of currencies whose product of exchange rates > 1.",
    examples: [
      {
        input: "rates = [[1,0.92,0.73],[1.09,1,0.80],[1.37,1.25,1]]  (USD,EUR,GBP)",
        output: "True",
        explanation:
          "USD→EUR→GBP→USD: 0.92 × 0.80 × 1.37 = 1.008 > 1 — free profit.",
      },
    ],
    constraints: ["2 <= n <= 20", "0 < rates[i][j] <= 1000"],
    approach:
      "Take -log of each rate: edge weight = -log(rate). A negative-weight cycle exists iff a product > 1 exists. Run Bellman-Ford N rounds; if any relaxation occurs on the Nth round, a negative cycle (arbitrage) is present.",
    code: `import math

def has_fx_arbitrage(rates: list[list[float]]) -> bool:
    n = len(rates)
    # Build edge list: -log(rate) for each directed pair
    edges = []
    for i in range(n):
        for j in range(n):
            if i != j and rates[i][j] > 0:
                edges.append((i, j, -math.log(rates[i][j])))

    # Bellman-Ford: initialise all distances to 0 (super-source)
    dist = [0.0] * n

    # Relax N-1 times
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # Nth pass: if any edge can still be relaxed, negative cycle exists
    for u, v, w in edges:
        if dist[u] + w < dist[v] - 1e-9:
            return True

    return False

# Example
rates = [
    [1.0,  0.92, 0.73],   # USD → EUR, GBP
    [1.09, 1.0,  0.80],   # EUR → USD, GBP
    [1.37, 1.25, 1.0 ],   # GBP → USD, EUR
]
print(has_fx_arbitrage(rates))   # True: 0.92*0.80*1.37 ≈ 1.008`,
    language: "python",
    complexity: { time: "O(V²E) = O(n^3)", space: "O(n^2)" },
  },
  {
    id: "fin-20260714-b1-sliding-max-spread",
    title: "Maximum Spread in a Sliding Window",
    difficulty: "medium",
    topics: ["monotonic-deque", "sliding-window"],
    problem:
      "Given two arrays bid[] and ask[] of length N representing a tick stream, compute the maximum spread (ask - bid) over every window of size K. Return an array of N-K+1 values. Each window may have a different best bid and best ask.",
    examples: [
      {
        input: "bid=[9,10,11,10,9], ask=[10,11,12,11,10], K=3",
        output: "[3, 3, 3]",
        explanation:
          "Window [0,2]: max ask=12, min bid=9, spread=3. Shift right similarly.",
      },
    ],
    constraints: ["1 <= K <= N <= 10^5", "0 < bid[i] < ask[i] <= 10^6"],
    approach:
      "Use a monotonic deque for the sliding max-ask and a separate deque for sliding min-bid. Sliding max with deque: maintain decreasing order, pop from front when out of window, pop from back when smaller than incoming value. Spread = max_ask - min_bid.",
    code: `from collections import deque

def max_spread_window(bid: list[int], ask: list[int], k: int) -> list[int]:
    n = len(bid)
    result = []

    # Deque for sliding maximum of ask (stores indices)
    dq_ask = deque()   # decreasing values
    # Deque for sliding minimum of bid (stores indices)
    dq_bid = deque()   # increasing values

    for i in range(n):
        # Maintain max-ask deque
        while dq_ask and ask[dq_ask[-1]] <= ask[i]:
            dq_ask.pop()
        dq_ask.append(i)
        if dq_ask[0] <= i - k:
            dq_ask.popleft()

        # Maintain min-bid deque
        while dq_bid and bid[dq_bid[-1]] >= bid[i]:
            dq_bid.pop()
        dq_bid.append(i)
        if dq_bid[0] <= i - k:
            dq_bid.popleft()

        if i >= k - 1:
            result.append(ask[dq_ask[0]] - bid[dq_bid[0]])

    return result

bid = [9, 10, 11, 10, 9]
ask = [10, 11, 12, 11, 10]
print(max_spread_window(bid, ask, 3))   # [3, 3, 3]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260714-b1-stock-cooldown",
    title: "Best Time to Buy-Sell with Mandatory Cooldown",
    difficulty: "medium",
    topics: ["dynamic-programming"],
    problem:
      "You own a single stock and can buy/sell on any day, but after selling you must wait one day (cooldown) before buying again. You may hold at most one share at a time. Given daily prices, find the maximum profit.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation:
          "Buy day 0, sell day 1 (profit=1), cooldown day 2, buy day 3, sell day 4 (profit=2).",
      },
    ],
    constraints: ["1 <= n <= 5000", "0 <= prices[i] <= 1000"],
    approach:
      "Define three states per day: hold (own stock), sold (just sold today → must rest tomorrow), rest (no stock, not in cooldown). Transitions: hold[i] = max(hold[i-1], rest[i-1] - price[i]); sold[i] = hold[i-1] + price[i]; rest[i] = max(rest[i-1], sold[i-1]). Answer = max(sold[-1], rest[-1]).",
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    if not prices:
        return 0

    hold = -prices[0]   # bought on day 0
    sold = 0            # just sold: start impossible
    rest = 0            # resting (no stock, no cooldown)

    for price in prices[1:]:
        hold, sold, rest = (
            max(hold, rest - price),    # either held or just bought (from rest)
            hold + price,               # sell today
            max(rest, sold),            # rest after cooldown or stay resting
        )

    return max(sold, rest)

print(max_profit_cooldown([1, 2, 3, 0, 2]))  # 3
print(max_profit_cooldown([1]))              # 0
print(max_profit_cooldown([1, 2]))           # 1`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260714-b1-minimum-settlement-rooms",
    title: "Minimum Clearing Desks for Settlement Windows",
    difficulty: "medium",
    topics: ["heap", "interval-scheduling", "greedy"],
    problem:
      "A clearing house has N trades that must be actively monitored during their settlement windows [start_i, end_i] (in minutes since market open). Find the minimum number of simultaneous clearing desks required so every trade is covered at all times.",
    examples: [
      {
        input: "intervals = [[0,30],[5,10],[15,20]]",
        output: "2",
        explanation:
          "At t=5, trades 0 and 1 are both open. Trade 2 starts after trade 1 ends.",
      },
    ],
    constraints: ["1 <= n <= 10^4", "0 <= start_i < end_i <= 10^6"],
    approach:
      "Sort by start time. Use a min-heap of end times. For each trade, if the earliest-ending trade finishes before this one starts, reuse that desk (pop from heap). Either way, push the current end time. The heap size at any point equals the desks in use; the answer is the maximum heap size.",
    code: `import heapq

def min_clearing_desks(intervals: list[list[int]]) -> int:
    if not intervals:
        return 0

    intervals.sort(key=lambda x: x[0])
    heap = []   # min-heap of end times

    for start, end in intervals:
        if heap and heap[0] <= start:
            heapq.heapreplace(heap, end)   # reuse desk
        else:
            heapq.heappush(heap, end)      # open new desk

    return len(heap)

print(min_clearing_desks([[0,30],[5,10],[15,20]]))   # 2
print(min_clearing_desks([[7,10],[2,4],[0,5]]))      # 1 (serial)`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 253,
  },
  {
    id: "fin-20260714-b1-fractional-knapsack",
    title: "Fractional Capital Allocation (Fractional Knapsack)",
    difficulty: "easy",
    topics: ["greedy", "sorting"],
    problem:
      "You have a capital budget B. There are N investment opportunities, each with cost[i] and return[i]. Unlike the 0/1 knapsack, you may invest a fractional amount in each opportunity (receiving proportional return). Maximize total expected return.",
    examples: [
      {
        input: "B=50, costs=[10,20,30], returns=[60,100,120]",
        output: "240.0",
        explanation:
          "Return-per-unit: [6,5,4]. Take all of opp0 (60), all of opp1 (100), 20/30 of opp2 (80). Total=240.",
      },
    ],
    constraints: ["1 <= N <= 10^4", "0 < costs[i], returns[i] <= 10^6"],
    approach:
      "Sort opportunities by return/cost ratio descending. Greedily take as much of each opportunity as the remaining budget allows. O(n log n) due to sort; greedy is optimal by exchange argument.",
    code: `def fractional_knapsack(budget: float,
                           costs: list[float],
                           returns: list[float]) -> float:
    # Sort by return-per-cost ratio (descending)
    items = sorted(zip(returns, costs), key=lambda x: x[0]/x[1], reverse=True)

    total = 0.0
    remaining = budget
    for ret, cost in items:
        if remaining <= 0:
            break
        take = min(cost, remaining)       # take full or fractional unit
        total += ret * (take / cost)
        remaining -= take

    return total

# Example
B = 50.0
costs   = [10.0, 20.0, 30.0]
returns = [60.0, 100.0, 120.0]
print(fractional_knapsack(B, costs, returns))   # 240.0

# Kelly sizing as fractional knapsack:
# Given expected returns and 'cost' (1 unit each), kelly = return/cost ratio`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260714-b1-interval-merge-positions",
    title: "Merge Overlapping Position Intervals",
    difficulty: "easy",
    topics: ["sorting", "intervals"],
    problem:
      "A risk system tracks N position intervals [open_i, close_i] in time (a long position held from minute open_i to close_i). Merge all overlapping or adjacent intervals and return the resulting set of position periods — needed to compute total exposure time without double-counting.",
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "[1,3] and [2,6] overlap — merged to [1,6].",
      },
    ],
    constraints: ["1 <= n <= 10^4"],
    approach:
      "Sort by start time. Iterate: if the current interval starts before or at the end of the last merged interval, extend the merged end; otherwise start a new merged interval. O(n log n).",
    code: `def merge_position_intervals(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []

    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0][:]]

    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])

    return merged

print(merge_position_intervals([[1,3],[2,6],[8,10],[15,18]]))
# [[1, 6], [8, 10], [15, 18]]

# Application: total exposure minutes (no double-count)
merged = merge_position_intervals([[1,3],[2,6],[8,10],[15,18]])
exposure = sum(e - s for s, e in merged)
print("Total exposure minutes:", exposure)  # 5 + 2 + 3 = 10`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 56,
  },
  {
    id: "fin-20260714-b1-market-depth-skyline",
    title: "Order Book Depth Skyline",
    difficulty: "hard",
    topics: ["heap", "sweep-line", "design"],
    problem:
      "Given a list of price-level rectangles (left=price_start, right=price_end, height=volume), representing a market depth snapshot, return the skyline of total visible order volume at each price — the silhouette outline you'd see in a depth-of-market chart. Each price-start, price-end pair is an [L, R, H] triple.",
    examples: [
      {
        input: "buildings = [[2,9,10],[3,7,15],[5,12,12],[15,20,10],[19,24,8]]",
        output: "[[2,10],[3,15],[7,12],[9,12],[12,0],[15,10],[20,8],[24,0]]",
        explanation:
          "The skyline critical points where height changes.",
      },
    ],
    constraints: ["1 <= n <= 10^4", "0 <= L < R <= 2^31-1", "1 <= H <= 2^31-1"],
    approach:
      "Sweep line over critical x-coordinates (all L and R values). Use a max-heap of active heights. At each x: add new buildings starting here, remove buildings ending here (lazy deletion from heap). The current max is the skyline height; emit a key point whenever it changes.",
    code: `import heapq

def get_skyline(buildings: list[list[int]]) -> list[list[int]]:
    # Create events: (x, -H) for start (negative for max-heap), (x, 0) for end
    events = []
    for L, R, H in buildings:
        events.append((L, -H, R))   # start: include R for lazy deletion
        events.append((R,  0, 0))   # end

    events.sort(key=lambda e: (e[0], e[1]))
    result = []
    # Heap: (-height, end_x); start with ground level
    heap = [(0, float('inf'))]
    prev_max = 0

    for x, neg_h, end in events:
        if neg_h != 0:
            heapq.heappush(heap, (neg_h, end))   # new building (neg_h < 0)

        # Lazy deletion: pop buildings that have ended
        while heap[0][1] <= x:
            heapq.heappop(heap)

        cur_max = -heap[0][0]
        if cur_max != prev_max:
            result.append([x, cur_max])
            prev_max = cur_max

    return result

buildings = [[2,9,10],[3,7,15],[5,12,12],[15,20,10],[19,24,8]]
print(get_skyline(buildings))`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 218,
  },
  {
    id: "fin-20260714-b1-two-sum-hedge-pair",
    title: "Find Offsetting Hedge Pair (Two Sum Variant)",
    difficulty: "easy",
    topics: ["hash-map", "two-pointers"],
    problem:
      "You hold N open positions with P&L values (positive = profit, negative = loss). Find any two positions whose P&L values sum to exactly zero (a perfect offsetting pair). Return their indices, or [] if none exists.",
    examples: [
      {
        input: "pnl = [3, -1, -3, 5, -2]",
        output: "[0, 2]",
        explanation: "pnl[0] + pnl[2] = 3 + (-3) = 0.",
      },
    ],
    constraints: ["-10^6 <= pnl[i] <= 10^6", "1 <= n <= 10^5"],
    approach:
      "Use a hash map from value to index. For each element, check if its negation exists in the map. O(n) time, O(n) space. This is the classic two-sum problem with target=0, generalizable to finding any pair summing to a target (e.g., a partial hedge minimizing residual).",
    code: `def find_hedge_pair(pnl: list[int]) -> list[int]:
    seen = {}   # value -> index
    for i, v in enumerate(pnl):
        complement = -v
        if complement in seen:
            return [seen[complement], i]
        seen[v] = i
    return []

print(find_hedge_pair([3, -1, -3, 5, -2]))    # [0, 2]
print(find_hedge_pair([1, 2, 3, 4]))           # []

# Extension: find pair summing to target T (minimize residual)
def closest_hedge(pnl: list[int], target: int) -> tuple:
    """Return (i,j) whose pnl[i]+pnl[j] is closest to target."""
    arr = sorted(range(len(pnl)), key=lambda k: pnl[k])
    lo, hi = 0, len(arr) - 1
    best, best_pair = float('inf'), (-1, -1)
    while lo < hi:
        s = pnl[arr[lo]] + pnl[arr[hi]]
        if abs(s - target) < abs(best - target):
            best, best_pair = s, (arr[lo], arr[hi])
        if s < target: lo += 1
        elif s > target: hi -= 1
        else: break
    return best_pair

print(closest_hedge([3, -1, -3, 5, -2], 1))  # pair summing closest to 1`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 1,
  },
  {
    id: "fin-20260714-b1-position-tracker-design",
    title: "Real-Time Position Tracker (Design)",
    difficulty: "medium",
    topics: ["hash-map", "design", "sorting"],
    problem:
      "Design a PositionTracker that processes a stream of trade events and answers queries. Each trade is (symbol, side, qty, price) where side is 'B' (buy) or 'S' (sell). Support: (1) update(symbol, side, qty, price) — update the position; (2) get_pnl(symbol, current_price) — unrealized P&L; (3) top_k_pnl(k, prices) — symbols with the k largest unrealized P&Ls.",
    examples: [
      {
        input: "update('AAPL','B',100,150); update('AAPL','S',50,155); get_pnl('AAPL',160)",
        output: "750.0",
        explanation:
          "Net position: 50 long. Avg cost = (100*150 - 50*155) / 50 = 145. PnL = 50*(160-145) = 750.",
      },
    ],
    constraints: [
      "Up to 10^5 calls total",
      "0 < qty <= 10^6",
      "0 < price <= 10^6",
    ],
    approach:
      "Track per-symbol (net_qty, cost_basis) using weighted-average cost. On buy: cost_basis = (old_qty*old_avg + qty*price) / new_qty. On sell (reduce only): cost_basis unchanged. Unrealized PnL = net_qty * (current_price - avg_cost). top_k uses a heap.",
    code: `import heapq
from collections import defaultdict

class PositionTracker:
    def __init__(self):
        # {symbol: [net_qty, avg_cost]}
        self.positions: dict[str, list[float]] = defaultdict(lambda: [0.0, 0.0])

    def update(self, symbol: str, side: str, qty: float, price: float) -> None:
        net_qty, avg_cost = self.positions[symbol]
        if side == 'B':
            new_qty = net_qty + qty
            avg_cost = (net_qty * avg_cost + qty * price) / new_qty
            self.positions[symbol] = [new_qty, avg_cost]
        elif side == 'S':
            new_qty = net_qty - qty
            # avg_cost unchanged on pure reduction (FIFO would differ)
            self.positions[symbol] = [new_qty, avg_cost]

    def get_pnl(self, symbol: str, current_price: float) -> float:
        net_qty, avg_cost = self.positions[symbol]
        return net_qty * (current_price - avg_cost)

    def top_k_pnl(self, k: int, prices: dict[str, float]) -> list[tuple]:
        """Return k symbols with highest unrealized P&L."""
        heap = []   # min-heap of size k
        for sym, (net_qty, avg_cost) in self.positions.items():
            if sym not in prices:
                continue
            pnl = net_qty * (prices[sym] - avg_cost)
            if len(heap) < k:
                heapq.heappush(heap, (pnl, sym))
            elif pnl > heap[0][0]:
                heapq.heapreplace(heap, (pnl, sym))
        return sorted(heap, reverse=True)

tracker = PositionTracker()
tracker.update('AAPL', 'B', 100, 150)
tracker.update('AAPL', 'S', 50,  155)
print(tracker.get_pnl('AAPL', 160))    # 750.0
tracker.update('GOOG', 'B', 10, 2800)
print(tracker.top_k_pnl(2, {'AAPL': 160, 'GOOG': 2900}))`,
    language: "python",
    complexity: {
      time: "O(1) per update/get_pnl, O(n log k) for top_k",
      space: "O(n)",
    },
  },
  {
    id: "fin-20260714-b1-probability-markov-chain",
    title: "Gambler's Ruin: Absorbing Markov Chain Probability",
    difficulty: "hard",
    topics: ["dynamic-programming", "probability", "math"],
    problem:
      "A trader starts with $k out of $N in capital. Each trade, they win $1 with probability p and lose $1 with probability (1-p). The game ends when they reach $0 (ruin) or $N (target). Find the exact probability of reaching $N before ruin.",
    examples: [
      {
        input: "k=3, N=5, p=0.6",
        output: "0.7102",
        explanation:
          "With edge p=0.6, starting at 3/5 of the way, the ruin probability formula gives P(reach N) ≈ 0.7102.",
      },
    ],
    constraints: ["1 <= k < N <= 50", "0 < p < 1"],
    approach:
      "Closed-form gambler's ruin: if p ≠ 0.5, P(k) = (1 - (q/p)^k) / (1 - (q/p)^N) where q=1-p. If p=0.5, P(k) = k/N. This can also be solved via DP: P[0]=0, P[N]=1, P[i] = p*P[i+1] + (1-p)*P[i-1], which has this closed-form solution.",
    code: `def gamblers_ruin(k: int, N: int, p: float) -> float:
    """
    Probability of reaching N before 0, starting at k.
    Absorbing states: 0 (ruin) and N (success).
    """
    q = 1.0 - p
    if abs(p - 0.5) < 1e-12:
        # Fair game: linear solution
        return k / N

    r = q / p
    # P(k) = (1 - r^k) / (1 - r^N)
    return (1.0 - r**k) / (1.0 - r**N)

def gamblers_ruin_dp(k: int, N: int, p: float) -> float:
    """DP verification (solve linear system iteratively)."""
    q = 1.0 - p
    P = [0.0] * (N + 1)
    P[N] = 1.0
    # Value iteration until convergence
    for _ in range(10_000):
        P_new = P[:]
        for i in range(1, N):
            P_new[i] = p * P[i + 1] + q * P[i - 1]
        if max(abs(P_new[i] - P[i]) for i in range(1, N)) < 1e-12:
            P = P_new
            break
        P = P_new
    return P[k]

k, N, p = 3, 5, 0.6
print(f"Closed-form: {gamblers_ruin(k, N, p):.6f}")
print(f"DP:          {gamblers_ruin_dp(k, N, p):.6f}")

# Risk of ruin for Kelly sizing: gambler's ruin models binary bet
# with p = win prob, q = 1-p, bankroll = k, target = infinity
# P(ruin | infinite target) = (q/p)^k if p > 0.5 else 1`,
    language: "python",
    complexity: { time: "O(N) closed-form, O(N*iter) DP", space: "O(N)" },
  },
];
