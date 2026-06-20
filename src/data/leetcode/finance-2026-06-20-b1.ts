import type { LeetCodeProblem } from "./index";

export const financeProblems20260620B1: LeetCodeProblem[] = [
  {
    id: "fin-20260620-b1-rebalance-min-trades",
    title: "Minimum Trades to Rebalance Portfolio",
    difficulty: "medium",
    topics: ["heap", "greedy", "sorting"],
    problem: `You manage a portfolio of N assets. The current weights are given as \`current[i]\` (floats summing to 1.0) and the target weights are \`target[i]\`. Each trade sells/buys one asset to adjust its weight. To minimise the number of trades, you should:
- Pair the largest over-weight asset with the largest under-weight asset and execute one trade to partially or fully correct both.

Given \`current\` and \`target\` arrays (both of length N, summing to 1.0), return the minimum number of trades needed to rebalance within tolerance \`eps = 1e-6\`.

Each trade eliminates at least one imbalance (the smaller of over/under).`,
    examples: [
      {
        input: "current=[0.5, 0.3, 0.2], target=[0.33, 0.33, 0.34]",
        output: "2",
        explanation: "Asset 0 is over by 0.17, asset 2 is under by 0.14, asset 1 is under by 0.03. Trade 1: sell 0 buy 2 (eliminates asset 2 under). Trade 2: sell 0 buy 1 (eliminates both). 2 trades total.",
      },
      {
        input: "current=[0.25, 0.25, 0.25, 0.25], target=[0.25, 0.25, 0.25, 0.25]",
        output: "0",
        explanation: "Already balanced.",
      },
    ],
    constraints: ["2 <= N <= 10^4", "0 <= current[i], target[i] <= 1", "sum(current) = sum(target) = 1.0"],
    approach: "Compute deltas = target - current. Use a max-heap on over-weights and a max-heap on under-weights. At each step, match the largest over with largest under: one of them reaches zero (that asset is done), the other continues. Count trades until all deltas < eps.",
    code: `import heapq

def min_rebalance_trades(current: list[float], target: list[float],
                          eps: float = 1e-6) -> int:
    deltas = [t - c for t, c in zip(target, current)]

    # Max-heaps via negation
    over  = [-d for d in deltas if d < -eps]   # over-weight (d < 0 → over)
    under = [ d for d in deltas if d >  eps]   # under-weight (d > 0 → under)
    heapq.heapify(over)
    heapq.heapify(under)

    trades = 0
    while over and under:
        o = -heapq.heappop(over)    # largest over-weight (positive amount to sell)
        u =  heapq.heappop(under)   # largest under-weight (positive amount to buy)
        trades += 1
        diff = o - u
        if diff > eps:              # over still has residual → push back
            heapq.heappush(over, -diff)
        elif diff < -eps:           # under still has residual → push back
            heapq.heappush(under, -diff)
    return trades`,
    language: "python",
    complexity: { time: "O(N log N)", space: "O(N)" },
  },
  {
    id: "fin-20260620-b1-candle-max-rect",
    title: "Largest Price Range in Candlestick Chart (Monotonic Stack)",
    difficulty: "hard",
    topics: ["monotonic-stack", "array"],
    problem: `Given an array \`highs\` of length N (intraday high prices for N candles), find the largest rectangular area under the high-price bars where the rectangle must fit within contiguous candles and cannot exceed any candle's high.

This is equivalent to: given N bars of heights \`highs[i]\`, find the rectangle of maximum area such that it fits within a contiguous subarray and its height is at most the minimum height in that subarray.

Return the maximum area (height × width in units of price × bars).`,
    examples: [
      {
        input: "highs = [2, 1, 5, 6, 2, 3]",
        output: "10",
        explanation: "Bars of height 5 and 6 at indices 2–3 give area = 5 × 2 = 10.",
      },
      {
        input: "highs = [2, 4]",
        output: "4",
        explanation: "Single bar of height 4 gives area 4. The pair at min height 2 gives 2×2=4 as well.",
      },
    ],
    constraints: ["1 <= N <= 10^5", "0 <= highs[i] <= 10^6"],
    approach: "Monotonic stack: maintain indices of bars in increasing height order. When a shorter bar is encountered, pop bars from the stack and compute the rectangle width as the distance to the new stack top. This gives O(N) time.",
    code: `def largest_candle_rect(highs: list[int]) -> int:
    stack: list[int] = []   # indices, monotonically increasing heights
    max_area = 0
    n = len(highs)

    for i in range(n + 1):
        h = highs[i] if i < n else 0   # sentinel 0 flushes all remaining bars
        while stack and highs[stack[-1]] > h:
            height = highs[stack.pop()]
            # Width: from current i to the new stack top (exclusive)
            width = i if not stack else i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)

    return max_area`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
  {
    id: "fin-20260620-b1-streaming-median-spread",
    title: "Streaming Median of Bid-Ask Spread",
    difficulty: "hard",
    topics: ["heap", "two-heaps", "design"],
    problem: `Design a class \`SpreadMedian\` that:
1. Initialises empty.
2. \`add(spread: float)\` — inserts a new bid-ask spread observation.
3. \`median() -> float\` — returns the current median spread in O(1).

All operations must run in O(log n) for \`add\` and O(1) for \`median\`.`,
    examples: [
      {
        input: "add(0.01), add(0.02), add(0.015) → median() = 0.015",
        output: "0.015",
        explanation: "Sorted: [0.01, 0.015, 0.02]. Median is middle element.",
      },
      {
        input: "add(0.01), add(0.03) → median() = 0.02",
        output: "0.02",
        explanation: "Two elements: median = average = (0.01 + 0.03) / 2.",
      },
    ],
    constraints: ["All spread values are positive floats.", "At most 10^5 calls total."],
    approach: "Maintain two heaps: a max-heap for the lower half and a min-heap for the upper half. Keep sizes balanced (differ by at most 1). Median is the top of the larger heap, or average of both tops if equal.",
    code: `import heapq

class SpreadMedian:
    def __init__(self):
        self._lo: list[float] = []   # max-heap (negated)
        self._hi: list[float] = []   # min-heap

    def add(self, spread: float) -> None:
        # Push to appropriate heap
        if not self._lo or spread <= -self._lo[0]:
            heapq.heappush(self._lo, -spread)
        else:
            heapq.heappush(self._hi, spread)
        # Rebalance: sizes must differ by at most 1
        if len(self._lo) > len(self._hi) + 1:
            heapq.heappush(self._hi, -heapq.heappop(self._lo))
        elif len(self._hi) > len(self._lo):
            heapq.heappush(self._lo, -heapq.heappop(self._hi))

    def median(self) -> float:
        if len(self._lo) > len(self._hi):
            return -self._lo[0]
        return (-self._lo[0] + self._hi[0]) / 2.0`,
    language: "python",
    complexity: { time: "O(log n) add, O(1) median", space: "O(n)" },
  },
  {
    id: "fin-20260620-b1-max-profit-2-tx",
    title: "Maximum Profit with At Most 2 Stock Transactions",
    difficulty: "hard",
    topics: ["dynamic-programming", "stock"],
    problem: `Given an array \`prices\` of length N (daily closing prices), find the maximum total profit achievable with **at most 2 non-overlapping** buy-sell transactions. You must sell before buying again.

Return the maximum profit (0 if no profit is possible).`,
    examples: [
      {
        input: "prices = [3, 3, 5, 0, 0, 3, 1, 4]",
        output: "6",
        explanation: "Buy at 0 (day 3), sell at 3 (day 5) = profit 3. Buy at 1 (day 6), sell at 4 (day 7) = profit 3. Total = 6.",
      },
      {
        input: "prices = [1, 2, 3, 4, 5]",
        output: "4",
        explanation: "One transaction: buy at 1, sell at 5. Two transactions gives same max.",
      },
    ],
    constraints: ["1 <= N <= 10^5", "0 <= prices[i] <= 10^4"],
    approach: "State machine DP with 4 states: buy1, sell1, buy2, sell2. Transition: for each price, update states in reverse order to avoid using the same day twice. All transitions are O(1); total is O(N).",
    code: `def max_profit_2_tx(prices: list[int]) -> int:
    buy1  = float('-inf')   # max profit after 1st buy
    sell1 = 0               # max profit after 1st sell
    buy2  = float('-inf')   # max profit after 2nd buy
    sell2 = 0               # max profit after 2nd sell

    for p in prices:
        buy1  = max(buy1,  -p)          # buy at price p (spend p)
        sell1 = max(sell1,  buy1 + p)   # sell 1st holding
        buy2  = max(buy2,   sell1 - p)  # buy 2nd using 1st profit
        sell2 = max(sell2,  buy2 + p)   # sell 2nd holding

    return sell2`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260620-b1-portfolio-dag-sensitivity",
    title: "Portfolio Sensitivity DAG (Topological DP)",
    difficulty: "medium",
    topics: ["graph", "topological-sort", "dynamic-programming"],
    problem: `A structured product has N underlying risk factors. Each factor node has an associated sensitivity (e.g., DV01 or delta). Some factors depend on others: factor j depends on factor i means j's total sensitivity includes i's propagated contribution.

Given a DAG of N nodes and E directed edges where edge (i → j) has weight w (the fraction of i's sensitivity that flows into j), and each node has a base sensitivity \`base[i]\`, compute the total sensitivity of each node (base + propagated from ancestors).

Return an array \`total[i]\` for each node.`,
    examples: [
      {
        input: "N=4, base=[1,0,0,0], edges=[(0,1,0.5),(0,2,0.3),(1,3,1.0),(2,3,1.0)]",
        output: "[1.0, 0.5, 0.3, 0.8]",
        explanation: "Node 0 base=1. Node 1 gets 0.5 from 0. Node 2 gets 0.3 from 0. Node 3 gets 0.5 (from 1) + 0.3 (from 2) = 0.8.",
      },
    ],
    constraints: ["2 <= N <= 10^4", "0 <= E <= 10^5", "Graph is a DAG."],
    approach: "Topological sort (Kahn's BFS). Process nodes in topological order: total[node] = base[node] + sum over parents of (w * total[parent]).",
    code: `from collections import deque

def portfolio_dag_sensitivity(n: int, base: list[float],
                               edges: list[tuple[int,int,float]]) -> list[float]:
    adj  = [[] for _ in range(n)]     # adj[u] = [(v, weight), ...]
    indeg = [0] * n
    for u, v, w in edges:
        adj[u].append((v, w))
        indeg[v] += 1

    # Kahn's BFS topological sort
    queue = deque(i for i in range(n) if indeg[i] == 0)
    total = list(base)                 # start with base sensitivities

    while queue:
        u = queue.popleft()
        for v, w in adj[u]:
            total[v] += w * total[u]  # propagate sensitivity downstream
            indeg[v] -= 1
            if indeg[v] == 0:
                queue.append(v)

    return total`,
    language: "python",
    complexity: { time: "O(N + E)", space: "O(N + E)" },
  },
  {
    id: "fin-20260620-b1-position-tracker-design",
    title: "Real-Time Position Tracker with PnL",
    difficulty: "medium",
    topics: ["design", "hash-map", "running-sum"],
    problem: `Design a class \`PositionTracker\` for real-time trade processing:
1. \`trade(symbol: str, qty: int, price: float)\`: Update position. qty > 0 is a buy, qty < 0 is a sell.
2. \`mark_to_market(symbol: str, mkt_price: float) -> float\`: Return unrealised PnL for that symbol.
3. \`realised_pnl(symbol: str) -> float\`: Return total realised PnL (from closed portions) for that symbol.
4. \`net_position(symbol: str) -> int\`: Return net quantity held.

Use FIFO (first-in, first-out) cost basis for realised PnL.`,
    examples: [
      {
        input: "trade('AAPL', 100, 150.0), trade('AAPL', -50, 160.0) → realised_pnl('AAPL') = 500.0",
        output: "500.0",
        explanation: "Bought 100 @ 150, sold 50 @ 160. Realised = 50 * (160 - 150) = 500.",
      },
    ],
    constraints: ["At most 10^5 calls.", "Each symbol's net position is in [-10^6, 10^6]."],
    approach: "Per symbol: maintain a deque of (qty, cost) lots for FIFO. On a sell, consume lots from the front, recording realised PnL. Track total realised PnL separately. For MTM, compute unrealised from remaining lots.",
    code: `from collections import defaultdict, deque

class PositionTracker:
    def __init__(self):
        self._lots    = defaultdict(deque)    # symbol → deque of (qty, cost)
        self._realised = defaultdict(float)

    def trade(self, symbol: str, qty: int, price: float) -> None:
        if qty > 0:
            self._lots[symbol].append([qty, price])
        else:
            remaining = -qty   # shares to sell
            while remaining > 0 and self._lots[symbol]:
                lot_qty, lot_price = self._lots[symbol][0]
                matched = min(lot_qty, remaining)
                self._realised[symbol] += matched * (price - lot_price)
                remaining -= matched
                if matched == lot_qty:
                    self._lots[symbol].popleft()
                else:
                    self._lots[symbol][0][0] -= matched

    def mark_to_market(self, symbol: str, mkt_price: float) -> float:
        unrealised = 0.0
        for qty, cost in self._lots[symbol]:
            unrealised += qty * (mkt_price - cost)
        return unrealised

    def realised_pnl(self, symbol: str) -> float:
        return self._realised[symbol]

    def net_position(self, symbol: str) -> int:
        return sum(qty for qty, _ in self._lots[symbol])`,
    language: "python",
    complexity: { time: "O(L) trade where L=lots consumed, O(P) mtm where P=open lots", space: "O(N)" },
  },
  {
    id: "fin-20260620-b1-matrix-exp-compound-returns",
    title: "Compound Return via Matrix Exponentiation",
    difficulty: "medium",
    topics: ["matrix-exponentiation", "math"],
    problem: `A multi-asset portfolio has a transition matrix M where M[i][j] is the expected return multiplier from state i to state j per period. Given the initial allocation vector \`v\` (wealth in each state), compute the expected allocation after exactly \`k\` periods by raising M to the k-th power.

Return the result vector \`v @ M^k\` (row-vector times matrix power). Assume M is n×n with n ≤ 10 and k ≤ 10^18.

Use matrix exponentiation (fast power) in O(n³ log k) time.`,
    examples: [
      {
        input: "M=[[1.05, 0],[0, 1.03]], v=[1000, 500], k=2",
        output: "[1102.5, 530.45]",
        explanation: "After 2 periods: 1000*1.05^2 = 1102.5, 500*1.03^2 = 530.45.",
      },
    ],
    constraints: ["1 <= n <= 10", "1 <= k <= 10^18"],
    approach: "Matrix fast power: represent M^k via repeated squaring. Each squaring step multiplies two n×n matrices in O(n³). Total steps = O(log k). Multiply v @ M^k at the end.",
    code: `import numpy as np

def mat_mul(A: list[list[float]], B: list[list[float]]) -> list[list[float]]:
    n = len(A)
    C = [[0.0]*n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                C[i][j] += A[i][k] * B[k][j]
    return C

def mat_pow(M: list[list[float]], k: int) -> list[list[float]]:
    n = len(M)
    result = [[1.0 if i==j else 0.0 for j in range(n)] for i in range(n)]  # identity
    base = [row[:] for row in M]
    while k > 0:
        if k & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        k >>= 1
    return result

def compound_return(M: list[list[float]], v: list[float], k: int) -> list[float]:
    Mk = mat_pow(M, k)
    n = len(v)
    return [sum(v[i] * Mk[i][j] for i in range(n)) for j in range(n)]`,
    language: "python",
    complexity: { time: "O(n³ log k)", space: "O(n²)" },
  },
  {
    id: "fin-20260620-b1-corr-min-span-tree",
    title: "Minimum Spanning Correlation Tree for Portfolio Clustering",
    difficulty: "medium",
    topics: ["graph", "minimum-spanning-tree", "union-find"],
    problem: `Given a correlation matrix for N assets, build a minimum spanning tree (MST) on the distance graph where edge weight between assets i and j is d(i,j) = sqrt(2*(1 - corr[i][j])). The MST forms the backbone of a hierarchical portfolio clustering.

Return the edges in the MST as a list of (i, j, distance) tuples, sorted by distance ascending.`,
    examples: [
      {
        input: "corr = [[1.0, 0.9, 0.2],[0.9, 1.0, 0.3],[0.2, 0.3, 1.0]]",
        output: "[(0,1,0.447), (1,2,1.183)]",
        explanation: "d(0,1)=sqrt(0.2)≈0.447 (high corr → short distance). d(1,2)=sqrt(1.4)≈1.183. MST connects all 3 with minimum total distance.",
      },
    ],
    constraints: ["2 <= N <= 500", "corr is symmetric with 1s on diagonal and values in [-1, 1]."],
    approach: "Kruskal's algorithm: enumerate all N*(N-1)/2 edges, sort by weight, use union-find to add non-cycle edges. O(N² log N) time.",
    code: `import math

def portfolio_mst(corr: list[list[float]]) -> list[tuple[int, int, float]]:
    n = len(corr)
    # Build all edges
    edges = []
    for i in range(n):
        for j in range(i+1, n):
            d = math.sqrt(max(2.0 * (1.0 - corr[i][j]), 0.0))
            edges.append((d, i, j))
    edges.sort()

    # Union-Find
    parent = list(range(n))
    rank   = [0] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]   # path compression
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra == rb: return False
        if rank[ra] < rank[rb]: ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]: rank[ra] += 1
        return True

    mst = []
    for d, i, j in edges:
        if union(i, j):
            mst.append((i, j, round(d, 6)))
        if len(mst) == n - 1:
            break
    return mst`,
    language: "python",
    complexity: { time: "O(N² log N)", space: "O(N²)" },
  },
  {
    id: "fin-20260620-b1-sliding-sharpe",
    title: "Maximum Rolling Sharpe Ratio Window",
    difficulty: "medium",
    topics: ["sliding-window", "math", "statistics"],
    problem: `Given an array of daily returns \`returns\` and a window size K, find the contiguous window of K days that maximises the Sharpe ratio (mean / std of returns within the window, assuming rf = 0).

Return (start_index, end_index, sharpe_ratio). If all windows have zero standard deviation, return (-1, -1, 0.0).`,
    examples: [
      {
        input: "returns=[0.01, 0.02, 0.03, -0.01, 0.05, 0.04], k=3",
        output: "(3, 5, sharpe≈5.66)",
        explanation: "Window [-0.01, 0.05, 0.04]: mean=0.0267, std=0.0306... actually window [0.03,-0.01,0.05] vs [-0.01,0.05,0.04]. Best Sharpe from 3-day windows.",
      },
    ],
    constraints: ["3 <= K <= N <= 10^4", "N >= K"],
    approach: "Use a sliding window maintaining running sum and sum-of-squares for O(1) mean/variance updates per step. Compute Sharpe for each window and track the maximum.",
    code: `def max_sharpe_window(returns: list[float], k: int) -> tuple[int, int, float]:
    n = len(returns)
    best_sharpe = float('-inf')
    best_start  = -1

    # Initialise window [0..k-1]
    s  = sum(returns[:k])
    s2 = sum(r*r for r in returns[:k])

    def window_sharpe(s, s2, k):
        mu  = s / k
        var = s2 / k - mu * mu
        if var <= 1e-14:
            return float('-inf')
        return mu / (var ** 0.5)

    sh = window_sharpe(s, s2, k)
    if sh > best_sharpe:
        best_sharpe, best_start = sh, 0

    for i in range(1, n - k + 1):
        # Slide: remove returns[i-1], add returns[i+k-1]
        s  += returns[i + k - 1] - returns[i - 1]
        s2 += returns[i + k - 1]**2 - returns[i - 1]**2
        sh  = window_sharpe(s, s2, k)
        if sh > best_sharpe:
            best_sharpe, best_start = sh, i

    if best_start == -1:
        return (-1, -1, 0.0)
    return (best_start, best_start + k - 1, best_sharpe)`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260620-b1-options-parity-check",
    title: "Detect Put-Call Parity Violations in Options Chain",
    difficulty: "easy",
    topics: ["math", "hash-map", "finance"],
    problem: `You receive a list of option quotes. Each quote is a tuple \`(strike, expiry, call_price, put_price, forward, discount_factor)\`. For each quote, check whether put-call parity holds within tolerance:

\`call - put = (forward - strike) * discount_factor\`

Return a list of indices where parity is violated by more than \`tol = 0.01\`.`,
    examples: [
      {
        input: "quotes=[(100, 1.0, 10.5, 5.4, 105.0, 0.95)], tol=0.01",
        output: "[]",
        explanation: "LHS = 10.5 - 5.4 = 5.1. RHS = (105 - 100) * 0.95 = 4.75. |5.1 - 4.75| = 0.35 > 0.01 → violated → [0].",
      },
      {
        input: "quotes=[(100, 1.0, 4.75, 0.0, 105.0, 0.95)], tol=0.01",
        output: "[0]",
        explanation: "LHS = 4.75 - 0.0 = 4.75. RHS = 4.75. Parity holds.",
      },
    ],
    constraints: ["1 <= len(quotes) <= 10^4", "All prices are non-negative floats."],
    approach: "For each quote compute LHS = call - put and RHS = (F - K) * df. If |LHS - RHS| > tol, record the index. O(N) scan.",
    code: `def find_parity_violations(
        quotes: list[tuple[float,float,float,float,float,float]],
        tol: float = 0.01
) -> list[int]:
    violations = []
    for idx, (K, T, call, put, F, df) in enumerate(quotes):
        lhs = call - put
        rhs = (F - K) * df
        if abs(lhs - rhs) > tol:
            violations.append(idx)
    return violations`,
    language: "python",
    complexity: { time: "O(N)", space: "O(V) where V=number of violations" },
  },
];
