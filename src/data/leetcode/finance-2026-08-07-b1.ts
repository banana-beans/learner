import type { LeetCodeProblem } from "./index";

export const financeProblems20260807B1: LeetCodeProblem[] = [
  {
    id: "fin-20260807-b1-sliding-window-sharpe",
    title: "Rolling Maximum Sharpe Ratio Window",
    difficulty: "medium",
    topics: ["Sliding Window", "Deque", "Statistics"],
    problem:
      "Given an array of daily returns returns[], a window size k, and a risk-free rate rf (daily), find the starting index of the contiguous window of length k that maximises the annualised Sharpe ratio: Sharpe = (mean(returns_window) - rf) / std(returns_window) * sqrt(252). Return -1 if no window has positive std.",
    examples: [
      {
        input: "returns=[0.01, 0.02, -0.01, 0.03, 0.015, 0.01], k=3, rf=0.0",
        output: "2",
        explanation: "Window starting at index 2 is [-0.01, 0.03, 0.015]: mean=0.01167, std=0.01664, Sharpe≈0.70*sqrt(252)≈11.1 — highest among all length-3 windows.",
      },
      {
        input: "returns=[0.001]*5, k=3, rf=0.0",
        output: "-1",
        explanation: "All windows have std=0 (constant returns), so Sharpe is undefined.",
      },
    ],
    constraints: [
      "1 <= k <= len(returns) <= 10^4",
      "-0.5 <= returns[i] <= 0.5",
      "0 <= rf <= 0.001",
    ],
    approach:
      "Slide a window of size k, maintaining running sum and sum-of-squares to compute mean and std in O(1) per step using the formula var = E[X^2] - E[X]^2. Compute Sharpe for each window and track the maximum. Total O(n) time, O(1) extra space.",
    code: `import math
from typing import List

def max_sharpe_window(returns: List[float], k: int, rf: float = 0.0) -> int:
    n = len(returns)
    if n < k:
        return -1

    # Initialise sums for first window
    s1 = sum(returns[:k])
    s2 = sum(r**2 for r in returns[:k])

    def sharpe(s1, s2, k):
        mean = s1 / k
        var  = s2 / k - mean**2
        if var <= 1e-12:
            return float("-inf")  # undefined / zero-std window
        std = math.sqrt(var)
        return (mean - rf) / std * math.sqrt(252)

    best_sharpe = sharpe(s1, s2, k)
    best_idx = 0

    for i in range(1, n - k + 1):
        # Slide: remove returns[i-1], add returns[i+k-1]
        s1 = s1 - returns[i-1] + returns[i+k-1]
        s2 = s2 - returns[i-1]**2 + returns[i+k-1]**2
        sh = sharpe(s1, s2, k)
        if sh > best_sharpe:
            best_sharpe = sh
            best_idx = i

    return best_idx if best_sharpe > float("-inf") else -1

# Tests
assert max_sharpe_window([0.001]*5, 3, 0.0) == -1
print("Best Sharpe window start:", max_sharpe_window([0.01,0.02,-0.01,0.03,0.015,0.01], 3, 0.0))`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260807-b1-fx-bellman-ford",
    title: "FX Arbitrage via Bellman-Ford Negative Cycle",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Negative Cycle Detection"],
    problem:
      "You are given n currencies and a list of exchange rates as triples (from, to, rate). Detect whether a profitable arbitrage cycle exists — i.e., starting with 1 unit you can return to the same currency with more than 1 unit. Return the cycle as a list of currency indices, or [] if none exists. Hint: take logarithms to convert multiplication to addition.",
    examples: [
      {
        input: "rates=[(0,1,1.3),(1,2,0.9),(2,0,0.9)], n=3",
        output: "[]",
        explanation: "1.3 * 0.9 * 0.9 = 1.053 — but after fees typically < 1; here product > 1 so arbitrage exists. Output: [0, 1, 2]",
      },
      {
        input: "rates=[(0,1,0.8),(1,0,1.1)], n=2",
        output: "[]",
        explanation: "0.8 * 1.1 = 0.88 < 1, no arbitrage.",
      },
    ],
    constraints: [
      "2 <= n <= 100 currencies",
      "1 <= len(rates) <= 500",
      "0.01 <= rate <= 100",
    ],
    approach:
      "Transform: weight = -log(rate). Bellman-Ford on the transformed graph finds shortest paths. A negative cycle in this graph corresponds to product > 1 (arbitrage). Track predecessors to reconstruct the cycle.",
    code: `import math
from typing import List, Tuple, Optional

def find_fx_arbitrage(n: int, rates: List[Tuple[int, int, float]]) -> List[int]:
    INF = float("inf")
    dist = [INF] * n
    pred = [-1] * n
    dist[0] = 0  # start from currency 0

    edges = [(u, v, -math.log(r)) for u, v, r in rates]

    # Bellman-Ford: n-1 relaxations
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                pred[v] = u

    # n-th relaxation: if any update, negative cycle exists
    cycle_node = -1
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            cycle_node = v  # part of or reachable from negative cycle
            break

    if cycle_node == -1:
        return []  # no arbitrage

    # Walk back pred to find a node definitly IN the cycle (n steps back)
    visited = cycle_node
    for _ in range(n):
        visited = pred[visited]

    # Extract cycle
    cycle = []
    node = visited
    while True:
        cycle.append(node)
        if node == visited and len(cycle) > 1:
            break
        node = pred[node]
    cycle.reverse()
    return cycle

# Tests
result = find_fx_arbitrage(3, [(0,1,1.3),(1,2,0.9),(2,0,0.9)])
print("Arbitrage cycle:", result)
print("No arb:", find_fx_arbitrage(2, [(0,1,0.8),(1,0,1.1)]))`,
    language: "python",
    complexity: { time: "O(V * E)", space: "O(V)" },
  },
  {
    id: "fin-20260807-b1-rate-limiter-token-bucket",
    title: "Token Bucket Rate Limiter for Order Submission",
    difficulty: "medium",
    topics: ["Design", "Sliding Window", "Token Bucket"],
    problem:
      "Design a token bucket rate limiter for an order management system. The bucket holds at most capacity tokens and refills at rate tokens_per_second. Each order submission consumes 1 token. Implement submit(timestamp_ms) -> bool. If the bucket has >= 1 token at the time of submission, consume it and return True; otherwise return False.",
    examples: [
      {
        input: "capacity=5, rate=2.0; calls: submit(0), submit(0), submit(0), submit(500), submit(1000)",
        output: "[True, True, True, False, True]",
        explanation: "At t=0: 5 tokens, three submissions consume 3 → 2 remaining. At t=500ms: +1 refilled → 3, but 4th call at t=0 already returned False. At t=1000ms: +2 refilled → 4, consume 1 → True.",
      },
      {
        input: "capacity=1, rate=1.0; calls: submit(0), submit(100), submit(1000)",
        output: "[True, False, True]",
        explanation: "1 token at start; t=100ms refills 0.1 tokens (not enough); t=1000ms refills 1 full token.",
      },
    ],
    constraints: [
      "0 < capacity <= 10000",
      "0 < tokens_per_second <= 10000",
      "Timestamps in milliseconds, non-decreasing",
      "Up to 10^5 calls",
    ],
    approach:
      "Track tokens (float) and last_refill_ts. On each call, compute elapsed time since last refill, add tokens (capped at capacity), then check if >= 1. O(1) per call.",
    code: `class TokenBucketRateLimiter:
    def __init__(self, capacity: float, tokens_per_second: float):
        self.capacity   = capacity
        self.rate       = tokens_per_second / 1000.0  # convert to tokens/ms
        self.tokens     = float(capacity)
        self.last_ts_ms = 0

    def submit(self, timestamp_ms: int) -> bool:
        # Refill tokens based on elapsed time
        elapsed = timestamp_ms - self.last_ts_ms
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_ts_ms = timestamp_ms

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False

# Tests
rl = TokenBucketRateLimiter(capacity=5, tokens_per_second=2.0)
timestamps = [0, 0, 0, 500, 1000]
results = [rl.submit(t) for t in timestamps]
print(results)  # [True, True, True, True, True] — note: 500ms = +1 token

rl2 = TokenBucketRateLimiter(capacity=1, tokens_per_second=1.0)
print([rl2.submit(t) for t in [0, 100, 1000]])  # [True, False, True]`,
    language: "python",
    complexity: { time: "O(1) per call", space: "O(1)" },
  },
  {
    id: "fin-20260807-b1-matrix-power-markov",
    title: "Multi-Step Price Transition via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["Matrix Exponentiation", "Dynamic Programming", "Probability"],
    problem:
      "A market regime model has n states (e.g., bull, bear, neutral). You are given an n×n transition matrix M where M[i][j] is the probability of moving from state i to state j in one step. Given initial state distribution pi_0 and integer k, compute the probability distribution pi_k after k steps. Use fast matrix exponentiation (O(n^3 log k)) instead of naive O(n^3 k).",
    examples: [
      {
        input: "M=[[0.7,0.3],[0.4,0.6]], pi_0=[1,0], k=10",
        output: "[0.571, 0.429]",
        explanation: "After 10 steps from state 0, the chain approaches steady state [4/7, 3/7] ≈ [0.571, 0.429].",
      },
      {
        input: "M=[[1,0],[0,1]], pi_0=[0.5,0.5], k=1000000",
        output: "[0.5, 0.5]",
        explanation: "Identity matrix: state never changes regardless of k.",
      },
    ],
    constraints: [
      "2 <= n <= 20 states",
      "1 <= k <= 10^18",
      "M is a valid stochastic matrix (rows sum to 1)",
    ],
    approach:
      "Implement matrix multiplication and fast exponentiation by squaring. pi_k = pi_0 @ M^k. Each matrix multiply is O(n^3), log2(k) squarings → O(n^3 log k) total.",
    code: `import numpy as np
from typing import List

def mat_mul(A, B):
    """Matrix multiplication — explicit for clarity (numpy is fine in practice)."""
    n = len(A)
    C = [[0.0]*n for _ in range(n)]
    for i in range(n):
        for k in range(n):
            if A[i][k] == 0: continue
            for j in range(n):
                C[i][j] += A[i][k] * B[k][j]
    return C

def mat_pow(M, k):
    """Fast matrix exponentiation: M^k in O(n^3 log k)."""
    n = len(M)
    # Identity matrix
    result = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    base = [row[:] for row in M]
    while k > 0:
        if k & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        k >>= 1
    return result

def markov_k_step(M: List[List[float]], pi_0: List[float], k: int) -> List[float]:
    Mk = mat_pow(M, k)
    n = len(pi_0)
    pi_k = [sum(pi_0[i] * Mk[i][j] for i in range(n)) for j in range(n)]
    return pi_k

M  = [[0.7, 0.3], [0.4, 0.6]]
pi = markov_k_step(M, [1.0, 0.0], 10)
print([round(p, 3) for p in pi])   # [0.571, 0.429]

M2 = [[1.0, 0.0], [0.0, 1.0]]
pi2 = markov_k_step(M2, [0.5, 0.5], 1_000_000)
print([round(p, 3) for p in pi2])  # [0.5, 0.5]`,
    language: "python",
    complexity: { time: "O(n^3 log k)", space: "O(n^2)" },
  },
  {
    id: "fin-20260807-b1-position-tracker",
    title: "Design: Real-Time Position Tracker with P&L",
    difficulty: "medium",
    topics: ["Design", "Hash Map", "Greedy"],
    problem:
      "Design a PositionTracker that supports: (1) fill(symbol, qty, price) — adds a fill (qty>0 buy, qty<0 sell); (2) mark_to_market(symbol, mkt_price) — sets the current price; (3) pnl(symbol) -> float — returns realised + unrealised P&L; (4) net_position(symbol) -> int — returns net qty. All operations should be O(1).",
    examples: [
      {
        input: "fill('AAPL', 100, 180); fill('AAPL', -50, 185); mark_to_market('AAPL', 190); pnl('AAPL')",
        output: "750.0",
        explanation: "Realised: sold 50 @ 185, bought @ 180 → 50*(185-180)=250. Unrealised: 50 remaining @ 190 vs 180 cost → 500. Total=750.",
      },
      {
        input: "fill('MSFT', 10, 400); pnl('MSFT') with no mark = 0.0 (cost basis = current)",
        output: "0.0",
        explanation: "Without a mark, unrealised = 0 (assume last fill price = market).",
      },
    ],
    constraints: [
      "Up to 10^6 fills",
      "Prices are positive floats",
      "qty can be positive or negative",
      "No short positions (net qty >= 0 always after fills in this problem)",
    ],
    approach:
      "Maintain per-symbol: avg_cost (FIFO or VWAP), net_qty, realised_pnl, mark_price. On each fill, update avg cost and realised P&L using the VWAP cost-basis method. P&L = realised + (mark - avg_cost) * net_qty.",
    code: `class PositionTracker:
    def __init__(self):
        # symbol -> {net_qty, avg_cost, realised_pnl, mark_price}
        self._pos = {}

    def _get(self, sym):
        return self._pos.setdefault(sym, {
            "net_qty": 0, "avg_cost": 0.0,
            "realised_pnl": 0.0, "mark_price": None
        })

    def fill(self, symbol: str, qty: int, price: float):
        p = self._get(symbol)
        if qty > 0:  # buy
            total_cost = p["avg_cost"] * p["net_qty"] + price * qty
            p["net_qty"] += qty
            p["avg_cost"] = total_cost / p["net_qty"] if p["net_qty"] else 0.0
        else:        # sell
            sell_qty = abs(qty)
            p["realised_pnl"] += sell_qty * (price - p["avg_cost"])
            p["net_qty"] -= sell_qty
            if p["net_qty"] == 0:
                p["avg_cost"] = 0.0

    def mark_to_market(self, symbol: str, mkt_price: float):
        self._get(symbol)["mark_price"] = mkt_price

    def pnl(self, symbol: str) -> float:
        p = self._get(symbol)
        mark = p["mark_price"] if p["mark_price"] is not None else p["avg_cost"]
        unrealised = p["net_qty"] * (mark - p["avg_cost"])
        return p["realised_pnl"] + unrealised

    def net_position(self, symbol: str) -> int:
        return self._get(symbol)["net_qty"]

# Tests
pt = PositionTracker()
pt.fill("AAPL", 100, 180)
pt.fill("AAPL", -50, 185)
pt.mark_to_market("AAPL", 190)
print(pt.pnl("AAPL"))        # 750.0
print(pt.net_position("AAPL"))  # 50`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(symbols)" },
  },
  {
    id: "fin-20260807-b1-monotonic-stack-span",
    title: "Price Span and Drawdown via Monotonic Stack",
    difficulty: "medium",
    topics: ["Monotonic Stack", "Sliding Window"],
    problem:
      "Given a series of daily closing prices, compute for each day i: (1) the price span — the maximum number of consecutive days ending at day i where all previous prices were <= prices[i]; (2) the maximum drawdown to that point — the largest peak-to-trough decline seen so far. Return both arrays.",
    examples: [
      {
        input: "prices=[100, 80, 60, 70, 60, 75, 85]",
        output: "span=[1,1,1,2,1,4,6], max_drawdown=[0,20,40,40,40,40,40]",
        explanation: "Span[5]=4 because prices[2..5]=[60,70,60,75] all ≤75. Max drawdown on day 6: peak was 100, trough was 60, so 40.",
      },
      {
        input: "prices=[10, 20, 30]",
        output: "span=[1,2,3], max_drawdown=[0,0,0]",
        explanation: "Monotonically increasing: span grows by 1 each day; no drawdown.",
      },
    ],
    constraints: [
      "1 <= len(prices) <= 10^5",
      "0 < prices[i] <= 10^6",
    ],
    approach:
      "Monotonic (decreasing) stack for span: pop elements <= current price, span = i - stack[-1]. Running peak and trough for drawdown. Both O(n) time and O(n) space.",
    code: `from typing import List, Tuple

def price_span_and_drawdown(prices: List[float]) -> Tuple[List[int], List[float]]:
    n = len(prices)
    span = [0] * n
    max_dd = [0.0] * n

    stack = []   # indices, monotonically decreasing prices
    peak = prices[0]
    trough = prices[0]
    max_drawdown_so_far = 0.0

    for i, p in enumerate(prices):
        # --- Span via monotonic stack ---
        while stack and prices[stack[-1]] <= p:
            stack.pop()
        span[i] = i - stack[-1] if stack else i + 1
        stack.append(i)

        # --- Drawdown tracking ---
        if p > peak:
            peak = p
            trough = p  # reset trough after new high
        else:
            trough = min(trough, p)
        dd = peak - trough
        max_drawdown_so_far = max(max_drawdown_so_far, dd)
        max_dd[i] = max_drawdown_so_far

    return span, max_dd

# Tests
span, dd = price_span_and_drawdown([100, 80, 60, 70, 60, 75, 85])
print("Span:", span)          # [1,1,1,2,1,4,6]
print("Max drawdown:", dd)    # [0,20,40,40,40,40,40]

span2, dd2 = price_span_and_drawdown([10, 20, 30])
print("Span:", span2)         # [1,2,3]
print("Max drawdown:", dd2)   # [0,0,0]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260807-b1-dp-portfolio-knapsack",
    title: "Portfolio Sizing as 0/1 Knapsack with Risk Budget",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Knapsack", "Portfolio Optimization"],
    problem:
      "You have n investment opportunities, each with an expected_return[i] and risk_units[i] (integer). Your total risk budget is W. Select a subset of investments to maximise total expected return without exceeding the risk budget. Each investment can be taken at most once (0/1 knapsack). Return the maximum return and the list of selected investment indices.",
    examples: [
      {
        input: "returns=[0.12, 0.08, 0.15, 0.10], risks=[3, 2, 4, 1], W=5",
        output: "max_return=0.23, selected=[0, 3]",
        explanation: "Invest 0 (risk=3, ret=0.12) + invest 3 (risk=1, ret=0.10) = total risk=4<=5, return=0.22. Or invest 1+3: risk=3, ret=0.18. Or invest 2+3: risk=5, ret=0.25. Best: [2,3] with 0.25.",
      },
      {
        input: "returns=[0.05]*4, risks=[1]*4, W=2",
        output: "max_return=0.10, selected=[0,1] (or any 2)",
        explanation: "All investments are identical; pick any 2 within budget W=2.",
      },
    ],
    constraints: [
      "1 <= n <= 50",
      "1 <= risk_units[i] <= 100",
      "1 <= W <= 500",
      "0 < expected_return[i] <= 1.0",
    ],
    approach:
      "Standard 0/1 knapsack DP. dp[w] = max return with risk budget w. Backtrack through the DP table to recover selected indices. O(n*W) time and space.",
    code: `from typing import List, Tuple

def portfolio_knapsack(returns: List[float], risks: List[int], W: int
                        ) -> Tuple[float, List[int]]:
    n = len(returns)
    # dp[w] = max return achievable with risk budget exactly <= w
    SCALE = 10000  # scale returns to int for exact DP
    ret_int = [round(r * SCALE) for r in returns]

    dp = [0] * (W + 1)
    choice = [[False] * (W + 1) for _ in range(n)]

    for i in range(n):
        r_i = risks[i]
        ret_i = ret_int[i]
        for w in range(W, r_i - 1, -1):  # iterate backwards to avoid reuse
            if dp[w - r_i] + ret_i > dp[w]:
                dp[w] = dp[w - r_i] + ret_i
                choice[i][w] = True

    # Recover selection
    selected = []
    w = W
    for i in range(n - 1, -1, -1):
        if choice[i][w]:
            selected.append(i)
            w -= risks[i]
    selected.reverse()

    return dp[W] / SCALE, selected

# Tests
ret, sel = portfolio_knapsack([0.12,0.08,0.15,0.10], [3,2,4,1], W=5)
print(f"Max return: {ret:.2f}, selected: {sel}")  # 0.25, [2, 3]

ret2, sel2 = portfolio_knapsack([0.05]*4, [1]*4, W=2)
print(f"Max return: {ret2:.2f}, selected: {sel2}")  # 0.10`,
    language: "python",
    complexity: { time: "O(n * W)", space: "O(n * W)" },
  },
  {
    id: "fin-20260807-b1-heap-top-k-positions",
    title: "Streaming Top-K Largest Positions by Absolute P&L",
    difficulty: "medium",
    topics: ["Heap", "Design", "Streaming"],
    problem:
      "A trading desk streams P&L updates: update(position_id, delta_pnl). After each update, return the k position IDs with the largest absolute P&L. If a position is updated multiple times, its running total determines its rank. Position IDs are non-negative integers.",
    examples: [
      {
        input: "k=2; updates=[(1,100),(2,200),(3,-300),(1,-150),(4,250)]",
        output: "After each update, top-2 IDs by |pnl|: [1],[1,2],[2,3],[1,3],[3,4]",
        explanation: "After update 4: pnls={1:-50,2:200,3:-300,4:250}. Top-2 by |pnl|: 3(300) and 4(250).",
      },
    ],
    constraints: [
      "1 <= k <= 10^4",
      "1 <= position_id <= 10^6",
      "Up to 10^6 updates",
      "delta_pnl is a float",
    ],
    approach:
      "Maintain a dict of running P&L per position. For each top-k query, use a min-heap of size k over (|pnl|, id). On update, push to the heap only if |pnl| > heap min. Queries are O(k log k); updates are O(log k).",
    code: `import heapq
from typing import List, Tuple, Dict

class StreamingTopK:
    def __init__(self, k: int):
        self.k    = k
        self.pnl: Dict[int, float] = {}
        # Min-heap of (abs_pnl, pos_id) — size <= k
        self.heap: List[Tuple[float, int]] = []
        self.in_heap = set()

    def update(self, pos_id: int, delta: float) -> List[int]:
        self.pnl[pos_id] = self.pnl.get(pos_id, 0.0) + delta
        abs_pnl = abs(self.pnl[pos_id])

        # Lazy insertion: push if not in heap OR if it beats the current minimum
        if pos_id not in self.in_heap:
            if len(self.heap) < self.k:
                heapq.heappush(self.heap, (abs_pnl, pos_id))
                self.in_heap.add(pos_id)
            elif abs_pnl > self.heap[0][0]:
                # Evict the smallest
                _, evicted = heapq.heapreplace(self.heap, (abs_pnl, pos_id))
                self.in_heap.discard(evicted)
                self.in_heap.add(pos_id)

        # Rebuild top-k from scratch for exact answer (alternative: accept approx)
        top = sorted(self.pnl.items(), key=lambda x: -abs(x[1]))[:self.k]
        return [pid for pid, _ in top]

# Tests
tk = StreamingTopK(k=2)
for pid, delta in [(1,100),(2,200),(3,-300),(1,-150),(4,250)]:
    print(f"update({pid},{delta}) -> {tk.update(pid, delta)}")`,
    language: "python",
    complexity: { time: "O(n log k) amortised", space: "O(n)" },
  },
  {
    id: "fin-20260807-b1-bit-log2-fast",
    title: "Fast Integer log2 for Price Level Bucketing via Bit Manipulation",
    difficulty: "easy",
    topics: ["Bit Manipulation", "Math"],
    problem:
      "In an order book, prices are bucketed into power-of-2 sized bins. Given a positive integer price (in ticks), compute floor(log2(price)) using only bit operations (no floating-point math, no log function). Also implement the next power of 2 >= price.",
    examples: [
      {
        input: "price=100",
        output: "floor_log2=6, next_pow2=128",
        explanation: "2^6=64 <= 100 < 128=2^7. floor_log2(100)=6. Next power of 2 is 128.",
      },
      {
        input: "price=64",
        output: "floor_log2=6, next_pow2=64",
        explanation: "64 is already a power of 2.",
      },
    ],
    constraints: [
      "1 <= price <= 2^30",
    ],
    approach:
      "floor_log2: use int.bit_length() - 1 (equivalent to 31 - count_leading_zeros on 32-bit). next_pow2: if already pow2 return it, else round up via bit trick (n-1) | ... | (n>>k) + 1.",
    code: `def floor_log2(n: int) -> int:
    """Returns floor(log2(n)) via bit_length — no FP needed."""
    if n <= 0:
        raise ValueError("n must be positive")
    return n.bit_length() - 1

def is_pow2(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0

def next_pow2(n: int) -> int:
    """Smallest power of 2 >= n."""
    if n <= 1:
        return 1
    if is_pow2(n):
        return n
    # Round up: set all bits below MSB, then add 1
    n -= 1
    n |= n >> 1
    n |= n >> 2
    n |= n >> 4
    n |= n >> 8
    n |= n >> 16
    return n + 1

def price_bucket(price: int, min_tick: int = 1) -> int:
    """Map price to its power-of-2 bucket index for order book partitioning."""
    return floor_log2(price // min_tick)

# Tests
assert floor_log2(100) == 6
assert floor_log2(64)  == 6
assert floor_log2(1)   == 0
assert next_pow2(100)  == 128
assert next_pow2(64)   == 64
assert next_pow2(65)   == 128
print(f"floor_log2(100)={floor_log2(100)}, next_pow2(100)={next_pow2(100)}")
print("All tests passed")`,
    language: "python",
    complexity: { time: "O(1)", space: "O(1)" },
  },
  {
    id: "fin-20260807-b1-prob-markov-steady",
    title: "Markov Chain Steady-State Distribution via Power Iteration",
    difficulty: "medium",
    topics: ["Probability", "Linear Algebra", "Markov Chains"],
    problem:
      "Given an n×n stochastic Markov transition matrix M (rows sum to 1), compute the stationary (steady-state) distribution pi such that pi @ M = pi. Use power iteration: repeatedly multiply pi by M until convergence. Return the stationary distribution rounded to 4 decimal places.",
    examples: [
      {
        input: "M=[[0.7,0.3],[0.4,0.6]]",
        output: "[0.5714, 0.4286]",
        explanation: "Steady state satisfies: 0.7*pi_0 + 0.4*pi_1 = pi_0, 0.3*pi_0 + 0.6*pi_1 = pi_1. Solution: pi = [4/7, 3/7].",
      },
      {
        input: "M=[[0.9,0.05,0.05],[0.1,0.8,0.1],[0.05,0.05,0.9]]",
        output: "[0.25, 0.2, 0.55] (approx — exact depends on M)",
        explanation: "Ergodic chain with unique stationary distribution found by iteration.",
      },
    ],
    constraints: [
      "2 <= n <= 50",
      "M is a valid stochastic matrix",
      "M is ergodic (irreducible + aperiodic): unique stationary distribution exists",
      "Tolerance: converge when max |pi_new - pi_old| < 1e-8",
    ],
    approach:
      "Start with uniform pi_0 = [1/n, ..., 1/n]. Repeatedly compute pi = pi @ M. Converges geometrically at rate |lambda_2|, the second-largest eigenvalue modulus. Also solvable via eigenvector (numpy.linalg.eig on M.T).",
    code: `import numpy as np
from typing import List

def steady_state_power_iteration(M: List[List[float]], tol: float = 1e-8,
                                  max_iter: int = 10000) -> List[float]:
    M = np.array(M, dtype=float)
    n = M.shape[0]
    pi = np.ones(n) / n  # uniform start

    for _ in range(max_iter):
        pi_new = pi @ M   # row-vector times matrix
        if np.max(np.abs(pi_new - pi)) < tol:
            return pi_new.tolist()
        pi = pi_new

    return pi.tolist()

def steady_state_eigenvector(M: List[List[float]]) -> List[float]:
    """Exact method via left eigenvector of eigenvalue 1."""
    M = np.array(M, dtype=float)
    vals, vecs = np.linalg.eig(M.T)
    # Find eigenvalue closest to 1
    idx = np.argmin(np.abs(vals - 1.0))
    pi = np.real(vecs[:, idx])
    pi /= pi.sum()
    return pi.tolist()

# Tests
M1 = [[0.7, 0.3], [0.4, 0.6]]
pi1 = steady_state_power_iteration(M1)
print([round(p, 4) for p in pi1])  # [0.5714, 0.4286]

M2 = [[0.9,0.05,0.05],[0.1,0.8,0.1],[0.05,0.05,0.9]]
pi2 = steady_state_eigenvector(M2)
print([round(p, 4) for p in pi2])`,
    language: "python",
    complexity: { time: "O(n^2 * iters)", space: "O(n^2)" },
  },
];
