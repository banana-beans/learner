import { LeetCodeProblem } from "./index";

export const financeProblems20260618B1: LeetCodeProblem[] = [
  {
    id: "fin-20260618-b1-fx-arbitrage-bf",
    title: "FX Arbitrage Detection via Bellman-Ford",
    difficulty: "hard",
    topics: ["graph", "bellman-ford", "fx", "negative-cycle"],
    problem: `You are given N currency codes and a list of exchange rates as triples (src, dst, rate). A profitable arbitrage exists when there is a cycle of trades whose product of rates exceeds 1.

Using Bellman-Ford on log-transformed weights, determine if an arbitrage cycle exists and return the cycle of currency indices (or an empty list if none).

- \`detect_arbitrage(n, rates)\` → \`list[int]\` cycle (empty = no arbitrage)

Edge weight: \`w(i,j) = -log(rate(i,j))\`. A negative cycle in the weight graph = profitable arbitrage.`,
    examples: [
      {
        input: "n=3, rates=[(0,1,1.3),(1,2,0.9),(2,0,0.9)]",
        output: "[] (no arbitrage: 1.3*0.9*0.9 = 1.053... wait that IS > 1)",
        explanation: "1.3 * 0.9 * 0.9 = 1.053 > 1 so cycle [0,1,2,0] is arbitrage. Returns [0,1,2,0].",
      },
      {
        input: "n=3, rates=[(0,1,1.0),(1,2,1.0),(2,0,0.99)]",
        output: "[] — product 0.99 < 1, no arbitrage",
      },
    ],
    constraints: [
      "2 <= n <= 30",
      "1 <= len(rates) <= n*(n-1)",
      "rate > 0",
    ],
    approach: "Transform edge weights to -log(rate). Run Bellman-Ford from a virtual source (0-weight edges to all nodes). After V-1 relaxations, a V-th relaxation reveals a negative cycle. Walk predecessors to reconstruct the cycle.",
    code: `import math

def detect_arbitrage(n: int, rates: list[tuple[int,int,float]]) -> list[int]:
    # Build edge list with log-transformed weights
    edges = [(u, v, -math.log(r)) for u, v, r in rates if r > 0]

    # Virtual source node s = n, zero-weight edges to all nodes
    for u in range(n):
        edges.append((n, u, 0.0))

    N = n + 1
    dist = [0.0] * N
    pred = [-1] * N

    # Relax V-1 times
    for _ in range(N - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v] - 1e-12:
                dist[v] = dist[u] + w
                pred[v] = u

    # V-th relaxation: detect negative cycle
    cycle_node = -1
    for u, v, w in edges:
        if dist[u] + w < dist[v] - 1e-12:
            cycle_node = v
            break

    if cycle_node == -1:
        return []

    # Walk N steps to land inside the cycle
    for _ in range(N):
        cycle_node = pred[cycle_node]

    # Extract cycle
    visited = set()
    path = []
    cur = cycle_node
    while cur not in visited:
        visited.add(cur)
        path.append(cur)
        cur = pred[cur]
    path.append(cur)
    path.reverse()
    # Trim to just the cycle
    start = path.index(cur)
    return path[start:]

# Test
print(detect_arbitrage(3, [(0,1,1.3),(1,2,0.9),(2,0,0.9)]))  # arbitrage
print(detect_arbitrage(3, [(0,1,1.0),(1,2,1.0),(2,0,0.99)])) # []`,
    language: "python",
    complexity: { time: "O(V * E)", space: "O(V + E)" },
    leetcodeNumber: undefined,
  },
  {
    id: "fin-20260618-b1-candle-aggregator",
    title: "OHLCV Candle Aggregator (Streaming, Fixed Interval)",
    difficulty: "medium",
    topics: ["design", "sliding-window", "market-data"],
    problem: `Design a streaming candle (bar) aggregator. Trades arrive as (timestamp_ms, price, volume). The aggregator groups trades into fixed-width intervals of \`bar_ms\` milliseconds and emits a completed OHLCV bar (open, high, low, close, volume) whenever the current bar closes.

Implement \`CandleAggregator\`:
- \`__init__(self, bar_ms: int)\`
- \`add(self, ts_ms: int, price: float, volume: int) -> Optional[dict]\` — returns completed bar dict or None.

A bar \`[t_start, t_start + bar_ms)\` closes when a trade arrives with \`ts_ms >= t_start + bar_ms\`.`,
    examples: [
      {
        input: "bar_ms=1000; trades=(0,100,10),(500,102,5),(999,101,8),(1000,103,3)",
        output: "None,None,None,{open:100,high:102,low:100,close:101,volume:23,t_start:0}",
        explanation: "The trade at t=1000 closes bar [0,1000) and starts a new bar.",
      },
    ],
    constraints: [
      "Timestamps are non-decreasing",
      "1 <= bar_ms <= 3_600_000",
      "price > 0, volume >= 1",
    ],
    approach: "Track current bar state: t_start, open, high, low, close, volume. On each trade compute bar_id = ts_ms // bar_ms. If bar_id > current, flush the current bar and initialise a new one with the arriving trade. Otherwise update OHLCV.",
    code: `from typing import Optional

class CandleAggregator:
    def __init__(self, bar_ms: int):
        self.bar_ms = bar_ms
        self._reset()

    def _reset(self):
        self.t_start: Optional[int] = None
        self.open = self.high = self.low = self.close = 0.0
        self.volume = 0

    def add(self, ts_ms: int, price: float, volume: int) -> Optional[dict]:
        completed = None
        if self.t_start is None:
            self.t_start = (ts_ms // self.bar_ms) * self.bar_ms
            self.open = self.high = self.low = self.close = price
            self.volume = volume
            return None

        bar_end = self.t_start + self.bar_ms
        if ts_ms >= bar_end:
            # Flush current bar
            completed = {
                "t_start": self.t_start,
                "open":    self.open,
                "high":    self.high,
                "low":     self.low,
                "close":   self.close,
                "volume":  self.volume,
            }
            # Initialise next bar
            self.t_start = (ts_ms // self.bar_ms) * self.bar_ms
            self.open = self.high = self.low = self.close = price
            self.volume = volume
        else:
            self.high   = max(self.high, price)
            self.low    = min(self.low, price)
            self.close  = price
            self.volume += volume
        return completed

agg = CandleAggregator(1000)
for ts, px, vol in [(0,100,10),(500,102,5),(999,101,8),(1000,103,3)]:
    bar = agg.add(ts, px, vol)
    if bar:
        print(f"Bar closed: {bar}")`,
    language: "python",
    complexity: { time: "O(1) per trade", space: "O(1)" },
    leetcodeNumber: undefined,
  },
  {
    id: "fin-20260618-b1-topological-coupon",
    title: "Bond Coupon Schedule Topological Sort",
    difficulty: "medium",
    topics: ["topological-sort", "graph", "fixed-income"],
    problem: `A structured note has N cash flow events. Each event has a list of prerequisite events that must settle before it can be processed (e.g. a coupon payment depends on a fixing event; a final redemption depends on all coupons). Given the dependency graph, return a valid processing order (topological sort), or indicate that a circular dependency (deadlock) exists.

Input: \`n\` events (0-indexed), \`deps\`: list of (prerequisite, dependent) pairs.
Output: list of event indices in a valid processing order, or [] if cycle detected.`,
    examples: [
      {
        input: "n=4, deps=[(0,2),(1,2),(2,3)]",
        output: "[0,1,2,3] or [1,0,2,3]",
        explanation: "Events 0 and 1 have no prerequisites, then 2, then 3.",
      },
      {
        input: "n=3, deps=[(0,1),(1,2),(2,0)]",
        output: "[] — circular dependency",
      },
    ],
    constraints: [
      "1 <= n <= 10^4",
      "0 <= len(deps) <= 5 * 10^4",
    ],
    approach: "Kahn's algorithm: build in-degree array and adjacency list. Enqueue all zero-in-degree nodes. Process queue: for each node, decrement neighbours' in-degrees; enqueue when in-degree hits 0. If processed count < n, a cycle exists.",
    code: `from collections import deque

def coupon_schedule(n: int, deps: list[tuple[int,int]]) -> list[int]:
    in_deg = [0] * n
    adj: list[list[int]] = [[] for _ in range(n)]

    for pre, dep in deps:
        adj[pre].append(dep)
        in_deg[dep] += 1

    queue = deque(i for i in range(n) if in_deg[i] == 0)
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for nei in adj[node]:
            in_deg[nei] -= 1
            if in_deg[nei] == 0:
                queue.append(nei)

    return order if len(order) == n else []

print(coupon_schedule(4, [(0,2),(1,2),(2,3)]))  # [0,1,2,3] or similar
print(coupon_schedule(3, [(0,1),(1,2),(2,0)]))  # []`,
    language: "python",
    complexity: { time: "O(V + E)", space: "O(V + E)" },
    leetcodeNumber: 207,
  },
  {
    id: "fin-20260618-b1-welford-streaming",
    title: "Welford Streaming Variance for Live P&L Attribution",
    difficulty: "easy",
    topics: ["streaming", "statistics", "numerics"],
    problem: `A real-time risk system needs to track the running mean and variance of P&L returns as new values stream in, without storing history. Implement Welford's online algorithm.

Implement \`WelfordStats\`:
- \`add(self, x: float)\` — incorporate new observation
- \`mean(self)\` → float
- \`variance(self)\` → float (population or sample, flag via \`ddof\`)
- \`std(self)\` → float

Also implement \`merge(a: WelfordStats, b: WelfordStats) -> WelfordStats\` to combine two partial aggregates (parallel workers).`,
    examples: [
      {
        input: "add(2.0), add(4.0), add(4.0), add(4.0), add(5.0), add(5.0), add(7.0), add(9.0)",
        output: "mean=5.0, variance=4.0 (population), std=2.0",
      },
    ],
    constraints: [
      "Values may be positive or negative (P&L)",
      "Up to 10^8 observations (must be numerically stable)",
    ],
    approach: "Welford's algorithm updates mean and M2 (sum of squared deviations) with O(1) memory. On each new value x: delta = x - mean; mean += delta/n; delta2 = x - mean; M2 += delta * delta2. variance = M2 / (n - ddof). Parallel merge uses Chan's parallel formula.",
    code: `import math

class WelfordStats:
    def __init__(self, ddof: int = 1):
        self.n = 0
        self._mean = 0.0
        self._M2 = 0.0
        self.ddof = ddof

    def add(self, x: float):
        self.n += 1
        delta = x - self._mean
        self._mean += delta / self.n
        delta2 = x - self._mean
        self._M2 += delta * delta2

    def mean(self) -> float:
        return self._mean

    def variance(self) -> float:
        if self.n <= self.ddof:
            return float('nan')
        return self._M2 / (self.n - self.ddof)

    def std(self) -> float:
        return math.sqrt(self.variance())

def merge(a: WelfordStats, b: WelfordStats) -> WelfordStats:
    combined = WelfordStats(ddof=a.ddof)
    combined.n = a.n + b.n
    delta = b._mean - a._mean
    combined._mean = (a.n * a._mean + b.n * b._mean) / combined.n
    combined._M2 = a._M2 + b._M2 + delta**2 * a.n * b.n / combined.n
    return combined

# Test
w = WelfordStats(ddof=0)  # population variance
for x in [2, 4, 4, 4, 5, 5, 7, 9]:
    w.add(x)
print(f"mean={w.mean()}, variance={w.variance()}, std={w.std()}")
# mean=5.0, variance=4.0, std=2.0`,
    language: "python",
    complexity: { time: "O(1) per observation", space: "O(1)" },
    leetcodeNumber: undefined,
  },
  {
    id: "fin-20260618-b1-union-find-netting",
    title: "Union-Find Trade Netting — Minimum Settlement Groups",
    difficulty: "medium",
    topics: ["union-find", "graph", "settlement", "netting"],
    problem: `A clearinghouse has N counterparties. Bilateral netting agreements mean that two counterparties connected by a direct contract can net their exposures. Given a list of bilateral agreements, group counterparties into netting sets using Union-Find. For each netting set, report the number of members and the total absolute exposure.

Input: \`n\` counterparties, \`agreements\`: list of (i, j) pairs, \`exposure[i]\` = signed notional for each counterparty.
Output: list of (group_size, total_abs_exposure) for each netting set, sorted descending by total_abs_exposure.`,
    examples: [
      {
        input: "n=5, agreements=[(0,1),(1,2),(3,4)], exposure=[100,-80,30,-50,20]",
        output: "[(3, 210.0), (2, 70.0)] — group {0,1,2}: |100|+|80|+|30|=210; group {3,4}: |50|+|20|=70",
      },
    ],
    constraints: [
      "1 <= n <= 10^5",
      "0 <= len(agreements) <= 5*10^5",
    ],
    approach: "Standard Union-Find with path compression and union by rank. After processing all agreements, iterate over all nodes and group them by root. For each group sum absolute exposures.",
    code: `def netting_sets(n: int, agreements: list[tuple[int,int]],
                  exposure: list[float]) -> list[tuple[int,float]]:
    parent = list(range(n))
    rank = [0] * n

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path compression (halving)
            x = parent[x]
        return x

    def union(a: int, b: int):
        ra, rb = find(a), find(b)
        if ra == rb:
            return
        if rank[ra] < rank[rb]:
            ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]:
            rank[ra] += 1

    for i, j in agreements:
        union(i, j)

    from collections import defaultdict
    groups: dict[int, list[int]] = defaultdict(list)
    for i in range(n):
        groups[find(i)].append(i)

    result = []
    for members in groups.values():
        total = sum(abs(exposure[m]) for m in members)
        result.append((len(members), total))

    result.sort(key=lambda x: -x[1])
    return result

exposure = [100.0, -80.0, 30.0, -50.0, 20.0]
print(netting_sets(5, [(0,1),(1,2),(3,4)], exposure))
# [(3, 210.0), (2, 70.0)]`,
    language: "python",
    complexity: { time: "O(n * α(n)) ≈ O(n)", space: "O(n)" },
    leetcodeNumber: 684,
  },
  {
    id: "fin-20260618-b1-twap-execution-dp",
    title: "Optimal TWAP Execution DP — Minimise Market Impact",
    difficulty: "hard",
    topics: ["dynamic-programming", "execution", "market-impact"],
    problem: `You need to sell Q shares over T time slots. In each slot t you can sell between 0 and min(q_t, remaining) shares, where q_t is the slot's capacity. Market impact cost is \`impact(x) = eta * x^2\` per slot (quadratic Almgren-Chriss model, simplified). Minimise total impact cost.

Input: \`total_qty\`, \`T\` slots, \`capacity[t]\` per slot (max shares per slot), \`eta\` impact coefficient.
Output: (min_cost, execution_plan[T]) — shares to trade each slot.`,
    examples: [
      {
        input: "total_qty=100, T=3, capacity=[60,60,60], eta=0.01",
        output: "min_cost=3.33, plan=[34,33,33] approximately (equal split minimises quadratic sum)",
      },
    ],
    constraints: [
      "1 <= T <= 50",
      "1 <= total_qty <= 10^4",
      "capacity[t] >= 1",
      "eta > 0",
    ],
    approach: "DP: dp[t][remaining] = min total impact cost from slot t onwards with 'remaining' shares left. At each slot sell x in [0, min(capacity[t], remaining)]; cost = eta*x^2 + dp[t+1][remaining-x]. Reconstruct plan by tracking argmin. O(T * Q^2) — feasible for Q <= 500.",
    code: `def twap_dp(total_qty: int, capacity: list[int], eta: float):
    T = len(capacity)
    Q = total_qty
    INF = float('inf')

    # dp[t][q] = min cost from slot t with q shares remaining
    dp = [[INF] * (Q + 1) for _ in range(T + 1)]
    choice = [[0] * (Q + 1) for _ in range(T)]
    dp[T][0] = 0.0  # sold everything: 0 cost

    for t in range(T - 1, -1, -1):
        for q in range(Q + 1):
            cap = min(capacity[t], q)
            best_cost = INF
            best_x = 0
            for x in range(cap + 1):
                future = dp[t + 1][q - x]
                if future < INF:
                    cost = eta * x * x + future
                    if cost < best_cost:
                        best_cost = cost
                        best_x = x
            dp[t][q] = best_cost
            choice[t][q] = best_x

    # Reconstruct plan
    plan = []
    remaining = Q
    for t in range(T):
        x = choice[t][remaining]
        plan.append(x)
        remaining -= x

    print(f"Min cost: {dp[0][Q]:.4f}")
    print(f"Execution plan: {plan}")
    return dp[0][Q], plan

twap_dp(100, [60, 60, 60], eta=0.01)`,
    language: "python",
    complexity: { time: "O(T * Q^2)", space: "O(T * Q)" },
    leetcodeNumber: undefined,
  },
  {
    id: "fin-20260618-b1-greeks-bisection",
    title: "Implied Volatility via Bisection (Black-Scholes)",
    difficulty: "medium",
    topics: ["binary-search", "bisection", "options", "black-scholes"],
    problem: `Given a market call price \`C_mkt\`, find the implied volatility \`sigma\` such that \`BS_call(S, K, r, T, sigma) = C_mkt\` using bisection search.

The Black-Scholes call price is strictly increasing in sigma (positive vega), so bisection converges. Return the implied vol to 6 decimal places, or raise if the market price is outside the no-arbitrage bounds.

Implement \`implied_vol(C_mkt, S, K, r, T, tol=1e-6) -> float\`.`,
    examples: [
      {
        input: "C_mkt=10.45, S=100, K=100, r=0.05, T=1.0",
        output: "~0.2000 (20% vol)",
      },
      {
        input: "C_mkt=0.001, S=100, K=200, r=0.05, T=0.1",
        output: "~0.0001 (deep OTM; very small vol)",
      },
    ],
    constraints: [
      "S, K, T > 0",
      "C_mkt must be in (intrinsic_value, S) — no-arb bounds",
      "tol >= 1e-8",
    ],
    approach: "Compute BS call with standard N(d1), N(d2). Set search bounds [1e-9, 10.0]. Bisect: evaluate BS at midpoint; if BS(mid) > target shrink right bound, else shrink left. Converge in ~50 iterations for tol=1e-6.",
    code: `import math
from typing import Optional

def _ncdf(x: float) -> float:
    return 0.5 * math.erfc(-x / math.sqrt(2))

def bs_call(S: float, K: float, r: float, T: float, sigma: float) -> float:
    sqT = math.sqrt(T)
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * sqT)
    d2 = d1 - sigma * sqT
    return S * _ncdf(d1) - K * math.exp(-r * T) * _ncdf(d2)

def implied_vol(C_mkt: float, S: float, K: float, r: float, T: float,
                tol: float = 1e-6) -> float:
    intrinsic = max(S - K * math.exp(-r * T), 0.0)
    if C_mkt <= intrinsic:
        raise ValueError(f"Price {C_mkt} below intrinsic {intrinsic:.4f}")
    if C_mkt >= S:
        raise ValueError("Price exceeds spot — no-arb violated")

    lo, hi = 1e-9, 10.0
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        val = bs_call(S, K, r, T, mid)
        if abs(val - C_mkt) < tol:
            return mid
        if val < C_mkt:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)

# ATM 20% vol
S, K, r, T = 100.0, 100.0, 0.05, 1.0
C = bs_call(S, K, r, T, 0.20)
print(f"BS call at 20%: {C:.4f}")
iv = implied_vol(C, S, K, r, T)
print(f"Implied vol: {iv:.6f}")  # ~0.200000`,
    language: "python",
    complexity: { time: "O(log((hi-lo)/tol))", space: "O(1)" },
    leetcodeNumber: undefined,
  },
  {
    id: "fin-20260618-b1-position-netting-prefix",
    title: "Intraday Position Netting via Prefix Sums",
    difficulty: "easy",
    topics: ["prefix-sum", "array", "position-management"],
    problem: `A trading desk receives a stream of signed fills: positive = buy, negative = sell. Given an array of fills, answer Q queries of the form (l, r): what is the net position after processing fills[l..r] inclusive? Also find the time index where the position first exceeds a given limit (earliest breach).

Input: \`fills: list[int]\`, queries: \`list[tuple[int,int]]\`, limit: \`int\`.
Output: list of net positions for each query; index of first breach (or -1).`,
    examples: [
      {
        input: "fills=[10,-5,8,-3,7], queries=[(0,2),(1,3),(0,4)], limit=15",
        output: "queries=[13,0,17]; first breach at index 4 (cumsum=[10,5,13,10,17], first >15 at idx 4)",
      },
    ],
    constraints: [
      "1 <= len(fills) <= 10^6",
      "1 <= Q <= 10^5",
      "Fills may be any signed integer",
    ],
    approach: "Build prefix sum array prefix[i] = sum(fills[0..i-1]). Range query (l,r) = prefix[r+1] - prefix[l]. First breach: scan prefix array for first index where abs(prefix[i]) > limit — O(n) with early exit.",
    code: `def position_netting(fills: list[int], queries: list[tuple[int,int]], limit: int):
    n = len(fills)
    prefix = [0] * (n + 1)
    for i, f in enumerate(fills):
        prefix[i + 1] = prefix[i] + f

    # Range queries: O(1) each
    results = [prefix[r + 1] - prefix[l] for l, r in queries]

    # First breach
    breach_idx = -1
    for i in range(1, n + 1):
        if abs(prefix[i]) > limit:
            breach_idx = i - 1  # 0-indexed fill index
            break

    print(f"Query results: {results}")
    print(f"First breach at fill index: {breach_idx}")
    return results, breach_idx

fills = [10, -5, 8, -3, 7]
queries = [(0, 2), (1, 3), (0, 4)]
position_netting(fills, queries, limit=15)`,
    language: "python",
    complexity: { time: "O(n + Q)", space: "O(n)" },
    leetcodeNumber: 303,
  },
  {
    id: "fin-20260618-b1-vol-surface-interpolation",
    title: "Volatility Surface Bilinear Interpolation",
    difficulty: "medium",
    topics: ["binary-search", "interpolation", "options", "vol-surface"],
    problem: `A volatility surface is given as a grid of implied vols at discrete (strike, expiry) points. Given a query (K_q, T_q), return the interpolated implied vol using bilinear interpolation between the four surrounding grid points.

Input:
- \`strikes: list[float]\` — sorted, length M
- \`expiries: list[float]\` — sorted, length N
- \`vols: list[list[float]]\` — shape M × N, vols[i][j] = vol at strike[i], expiry[j]
- \`K_q, T_q\` — query strike and expiry (must be within grid)

Output: interpolated implied vol (float)`,
    examples: [
      {
        input: "strikes=[90,100,110], expiries=[0.25,0.5,1.0], vols=3x3 grid; query K=95, T=0.375",
        output: "~0.215 (bilinear blend of surrounding four vols)",
      },
    ],
    constraints: [
      "2 <= M, N <= 500",
      "K_q in [strikes[0], strikes[-1]]",
      "T_q in [expiries[0], expiries[-1]]",
    ],
    approach: "Binary search for the bracketing indices i (strikes) and j (expiries). Compute fractional distances tx = (K_q - strikes[i]) / (strikes[i+1] - strikes[i]) and ty similarly. Bilinear formula: (1-tx)*(1-ty)*v00 + tx*(1-ty)*v10 + (1-tx)*ty*v01 + tx*ty*v11.",
    code: `import bisect

def vol_surface_interp(strikes: list[float], expiries: list[float],
                        vols: list[list[float]], K_q: float, T_q: float) -> float:
    # Find bracketing indices
    ik = bisect.bisect_right(strikes, K_q) - 1
    ik = max(0, min(ik, len(strikes) - 2))
    it = bisect.bisect_right(expiries, T_q) - 1
    it = max(0, min(it, len(expiries) - 2))

    # Fractional weights
    dK = strikes[ik + 1] - strikes[ik]
    dT = expiries[it + 1] - expiries[it]
    tx = (K_q - strikes[ik]) / dK if dK > 0 else 0.0
    ty = (T_q - expiries[it]) / dT if dT > 0 else 0.0

    # Four corners: v[strike_idx][expiry_idx]
    v00 = vols[ik    ][it    ]
    v10 = vols[ik + 1][it    ]
    v01 = vols[ik    ][it + 1]
    v11 = vols[ik + 1][it + 1]

    interp = ((1 - tx) * (1 - ty) * v00
            + tx       * (1 - ty) * v10
            + (1 - tx) * ty       * v01
            + tx       * ty       * v11)
    return interp

# Example 3x3 surface
strikes  = [90.0, 100.0, 110.0]
expiries = [0.25,   0.5,   1.0]
vols = [
    [0.25, 0.23, 0.22],  # strike=90
    [0.20, 0.19, 0.18],  # strike=100
    [0.22, 0.21, 0.20],  # strike=110
]
iv = vol_surface_interp(strikes, expiries, vols, K_q=95.0, T_q=0.375)
print(f"Interpolated vol: {iv:.4f}")`,
    language: "python",
    complexity: { time: "O(log M + log N)", space: "O(1)" },
    leetcodeNumber: undefined,
  },
  {
    id: "fin-20260618-b1-options-pnl-histogram",
    title: "Options Portfolio P&L Histogram (Counting Sort)",
    difficulty: "easy",
    topics: ["counting-sort", "histogram", "options", "risk"],
    problem: `A risk system has a portfolio of N option positions. For each of S scenarios, P&L is an integer in [-max_loss, max_gain]. You need to:
1. Build a frequency histogram of P&L outcomes.
2. Compute VaR at confidence level alpha (e.g. 0.99): the loss not exceeded in alpha fraction of scenarios.
3. Find the mode (most frequent P&L bucket).

Input: \`pnl: list[int]\` (S scenario P&Ls), \`alpha: float\`.
Output: (var_99: float, mode_pnl: int, histogram: dict).`,
    examples: [
      {
        input: "pnl=[-100,-50,-50,0,0,0,50,100,100,200], alpha=0.9",
        output: "VaR(90%)=-50 (10th percentile loss), mode=0, histogram={-100:1,-50:2,...}",
      },
    ],
    constraints: [
      "1 <= S <= 10^6",
      "pnl[i] in [-10^6, 10^6]",
      "0 < alpha < 1",
    ],
    approach: "Use a dict-based histogram (or offset array if range is small). For VaR: sort P&L and find the (1-alpha) quantile. For mode: max by frequency. Counting sort is O(S + range) vs O(S log S) for comparison sort.",
    code: `from collections import Counter

def pnl_analysis(pnl: list[int], alpha: float = 0.99):
    S = len(pnl)
    hist = Counter(pnl)

    # VaR: sort P&Ls, find (1-alpha) percentile (worst losses are most negative)
    sorted_pnl = sorted(pnl)
    var_idx = int((1 - alpha) * S)  # e.g. alpha=0.99 -> bottom 1%
    var_idx = max(0, min(var_idx, S - 1))
    var_value = sorted_pnl[var_idx]

    # Mode
    mode_pnl = hist.most_common(1)[0][0]

    # Expected shortfall (CVaR): mean of losses beyond VaR
    tail = [x for x in sorted_pnl[:var_idx + 1] if x <= var_value]
    cvar = sum(tail) / len(tail) if tail else var_value

    print(f"Scenarios: {S}")
    print(f"VaR({alpha*100:.0f}%): {var_value}")
    print(f"CVaR({alpha*100:.0f}%): {cvar:.2f}")
    print(f"Mode P&L: {mode_pnl}")
    print(f"Min/Max: {sorted_pnl[0]} / {sorted_pnl[-1]}")
    return var_value, mode_pnl, dict(hist)

pnl = [-100, -50, -50, 0, 0, 0, 50, 100, 100, 200]
pnl_analysis(pnl, alpha=0.9)`,
    language: "python",
    complexity: { time: "O(S log S) for sort; O(S) histogram", space: "O(S)" },
    leetcodeNumber: undefined,
  },
];
