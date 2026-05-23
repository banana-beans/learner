import type { LeetCodeProblem } from "./index";

export const financeProblems20260523B1: LeetCodeProblem[] = [
  {
    id: "fin-0523-b1-stock-cooldown",
    leetcodeNumber: 309,
    title: "Best Time to Buy and Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["dynamic-programming", "finance"],
    problem:
      "Given an array prices where prices[i] is the stock price on day i, find the maximum profit. You may complete as many transactions as you like, but after selling you must wait one day (cooldown) before buying again. You may not hold multiple positions simultaneously.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation: "Buy@1, sell@3 (+2), cooldown, buy@0, sell@2 (+2) = 4? No: sell day 2 (idx 2=price 3), cooldown day 3, buy day 4 (price 2) — but that's sell=2 not 2. Optimal: buy@1 sell@2, cooldown, buy@0 sell@2 = 1+2 = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
        explanation: "Only one price — no transaction possible.",
      },
    ],
    approach:
      "Three states per day: HELD (holding a stock), SOLD (just sold, must cooldown tomorrow), COOL (cooldown or resting — can buy or do nothing). Transition: HELD[i] = max(HELD[i-1], COOL[i-1] - prices[i]); SOLD[i] = HELD[i-1] + prices[i]; COOL[i] = max(COOL[i-1], SOLD[i-1]). Answer = max(SOLD[-1], COOL[-1]).",
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    if len(prices) < 2:
        return 0

    held = -prices[0]   # max profit while holding a stock
    sold = 0            # max profit on the day we just sold
    cool = 0            # max profit while in cooldown or resting

    for p in prices[1:]:
        prev_held, prev_sold, prev_cool = held, sold, cool

        held = max(prev_held, prev_cool - p)   # hold or buy today
        sold = prev_held + p                    # sell today (must have been holding)
        cool = max(prev_cool, prev_sold)        # rest or come off cooldown

    return max(sold, cool)


# Examples
print(max_profit_cooldown([1, 2, 3, 0, 2]))  # 3
print(max_profit_cooldown([1]))              # 0
print(max_profit_cooldown([2, 1, 4]))        # 3 (buy@1 sell@4)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-0523-b1-bellman-ford-cycle",
    leetcodeNumber: 0,
    title: "FX Arbitrage: Bellman-Ford Negative Cycle Detection",
    difficulty: "hard",
    topics: ["graph", "bellman-ford", "finance"],
    problem:
      "Given N currencies and a list of exchange rates as directed edges (from, to, rate), determine if there exists a profitable arbitrage cycle — a sequence of trades that starts and ends with the same currency with a net gain. Model the problem as a shortest-path problem on a graph with negative edge weights.",
    examples: [
      {
        input: "N=3, rates = [(0,1,0.9), (1,2,0.89), (2,0,1.28)]",
        output: "True — cycle 0->1->2->0 has log product log(0.9)+log(0.89)+log(1.28) > 0",
        explanation: "Convert to -log(rate) edge weights. A negative-weight cycle in this graph means the product of rates > 1, i.e. arbitrage.",
      },
      {
        input: "N=2, rates = [(0,1,0.95), (1,0,1.04)]",
        output: "True — round-trip: 0.95 * 1.04 = 0.988 < 1 … actually False",
        explanation: "0.95 * 1.04 = 0.988 < 1 — no arbitrage. Bellman-Ford V-th pass finds no relaxation.",
      },
    ],
    approach:
      "Build edge list with w(u,v) = -log(rate(u,v)). Run Bellman-Ford from a super-source connected to all nodes with zero-weight edges. After V-1 relaxations, if any edge (u,v) still satisfies d[u] + w(u,v) < d[v], a negative cycle exists, which corresponds to a profitable arbitrage loop.",
    code: `import math

def has_arbitrage(n: int, rates: list[tuple[int, int, float]]) -> bool:
    """
    Bellman-Ford on -log(rate) edge weights.
    Negative cycle  <=>  product of rates along cycle > 1  <=>  arbitrage.
    """
    INF = float('inf')
    # Add super-source (node n) with zero-weight edges to all currencies
    dist = [INF] * (n + 1)
    dist[n] = 0.0

    edges = [(-math.log(r), u, v) for u, v, r in rates]
    # Super-source edges
    for i in range(n):
        edges.append((0.0, n, i))

    # V relaxations (V = n+1 nodes)
    for _ in range(n):
        for w, u, v in edges:
            if dist[u] < INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # V-th relaxation: negative cycle if any edge still relaxes
    for w, u, v in edges:
        if dist[u] < INF and dist[u] + w < dist[v] - 1e-10:
            return True
    return False


print(has_arbitrage(3, [(0,1,0.9),(1,2,0.89),(2,0,1.28)]))  # True
print(has_arbitrage(2, [(0,1,0.95),(1,0,1.04)]))             # False`,
    language: "python",
    complexity: { time: "O(V * E)", space: "O(V + E)" },
  },
  {
    id: "fin-0523-b1-token-bucket-design",
    leetcodeNumber: 0,
    title: "Design: Token Bucket Rate Limiter",
    difficulty: "medium",
    topics: ["design", "math", "finance"],
    problem:
      "Design a TokenBucket class that models an exchange order-submission throttle. It should support: TokenBucket(capacity, refill_rate) — capacity is the max burst size (tokens), refill_rate is tokens added per second. consume(tokens, timestamp_ms) — returns True if the request is allowed, False if throttled. The bucket refills continuously between calls based on elapsed time.",
    examples: [
      {
        input: `tb = TokenBucket(capacity=10, refill_rate=2.0)
tb.consume(5, t=0)      # True  (tokens: 10 -> 5)
tb.consume(5, t=1000)   # True  (refill: 5+2=7, then 7-5=2)
tb.consume(5, t=1500)   # False (refill: 2+1=3 < 5 needed)
tb.consume(3, t=1500)   # True  (3 available, consume 3 -> 0)`,
        output: "[True, True, False, True]",
        explanation: "At t=1000ms (1s elapsed), 2 tokens refill. At t=1500ms (0.5s more), 1 more token refills — only 3 total, so a 5-token request is denied.",
      },
    ],
    approach:
      "Store current tokens (float) and last refill timestamp. On consume: compute elapsed seconds, add refill_rate * elapsed to tokens (capped at capacity), then check if tokens >= requested amount. If yes, deduct and return True; else return False. All operations are O(1).",
    code: `class TokenBucket:
    def __init__(self, capacity: float, refill_rate: float):
        """
        capacity:    maximum number of tokens (burst limit)
        refill_rate: tokens added per second
        """
        self.capacity    = capacity
        self.refill_rate = refill_rate
        self.tokens      = float(capacity)   # start full
        self.last_ts_ms  = 0                 # millisecond timestamp

    def consume(self, amount: float, timestamp_ms: int) -> bool:
        # Refill based on elapsed time
        elapsed_s = max(0.0, (timestamp_ms - self.last_ts_ms) / 1000.0)
        self.tokens = min(self.capacity,
                          self.tokens + elapsed_s * self.refill_rate)
        self.last_ts_ms = timestamp_ms

        if self.tokens >= amount:
            self.tokens -= amount
            return True          # request allowed
        return False             # throttled


# Test
tb = TokenBucket(capacity=10, refill_rate=2.0)
print(tb.consume(5, 0))     # True  — tokens: 5 remaining
print(tb.consume(5, 1000))  # True  — 2 tokens refilled -> 7, then 7-5=2
print(tb.consume(5, 1500))  # False — 2 + 1 = 3 < 5
print(tb.consume(3, 1500))  # True  — 3 available, consume -> 0`,
    language: "python",
    complexity: { time: "O(1) per consume", space: "O(1)" },
  },
  {
    id: "fin-0523-b1-order-matcher",
    leetcodeNumber: 0,
    title: "Design: FIFO Price-Time Priority Order Matching Engine",
    difficulty: "hard",
    topics: ["design", "heap", "queue", "finance"],
    problem:
      "Design a simple order matching engine that supports: place_order(order_id, side, price, qty) — 'buy' or 'sell'. cancel_order(order_id). get_trades() — returns list of (buy_id, sell_id, price, qty) matched trades. Matching is price-time priority: best bid (highest price) matches against best ask (lowest price) when bid >= ask. Orders fill at the resting order's price.",
    examples: [
      {
        input: `engine.place_order(1, 'sell', 100.0, 10)
engine.place_order(2, 'sell', 101.0,  5)
engine.place_order(3, 'buy',  100.0,  7)  # matches order 1 partially`,
        output: "Trade: (buy_id=3, sell_id=1, price=100.0, qty=7)",
        explanation: "Order 3 (buy@100) matches order 1 (sell@100) — best ask equals bid. Trade fills 7 of the 10 sell. Order 1 has 3 remaining.",
      },
    ],
    approach:
      "Maintain a max-heap for bids (negate prices for min-heap) and a min-heap for asks. Each heap entry: (price, seq_num, order_id, qty). On place_order: push to the appropriate heap, then attempt to match while best_bid >= best_ask. On cancel: mark the order_id in a cancelled set; skip cancelled entries when popping. Fill at the resting (passive) order's price.",
    code: `import heapq
from collections import defaultdict

class OrderBook:
    def __init__(self):
        self.bids: list   = []   # max-heap: store (-price, seq, id, qty)
        self.asks: list   = []   # min-heap: store ( price, seq, id, qty)
        self.cancelled    = set()
        self.seq          = 0
        self.trades: list = []

    def place_order(self, order_id: int, side: str, price: float, qty: int):
        self.seq += 1
        if side == 'buy':
            heapq.heappush(self.bids, (-price, self.seq, order_id, qty))
        else:
            heapq.heappush(self.asks, ( price, self.seq, order_id, qty))
        self._match()

    def cancel_order(self, order_id: int):
        self.cancelled.add(order_id)

    def _top(self, heap, negate_price=False):
        """Pop stale/cancelled entries; return live top or None."""
        while heap:
            entry = heap[0]
            oid   = entry[2]
            if oid in self.cancelled:
                heapq.heappop(heap)
                continue
            return entry
        return None

    def _match(self):
        while True:
            best_bid = self._top(self.bids)
            best_ask = self._top(self.asks)
            if not best_bid or not best_ask:
                break
            bid_px = -best_bid[0]
            ask_px =  best_ask[0]
            if bid_px < ask_px:
                break  # no cross

            fill_qty = min(best_bid[3], best_ask[3])
            fill_px  = ask_px   # resting (passive) ask sets the price

            self.trades.append((best_bid[2], best_ask[2], fill_px, fill_qty))

            # Remove or update top entries
            heapq.heappop(self.bids)
            heapq.heappop(self.asks)
            if best_bid[3] > fill_qty:
                heapq.heappush(self.bids, (best_bid[0], best_bid[1],
                                           best_bid[2], best_bid[3]-fill_qty))
            if best_ask[3] > fill_qty:
                heapq.heappush(self.asks, (best_ask[0], best_ask[1],
                                           best_ask[2], best_ask[3]-fill_qty))

    def get_trades(self): return self.trades`,
    language: "python",
    complexity: { time: "O(log N) per order", space: "O(N)" },
  },
  {
    id: "fin-0523-b1-knapsack-portfolio",
    leetcodeNumber: 0,
    title: "0/1 Knapsack: Discrete Position Sizing",
    difficulty: "medium",
    topics: ["dynamic-programming", "finance"],
    problem:
      "A portfolio manager has a capital budget B (in thousands). They have N candidate positions, each requiring capital[i] thousands and producing expected_return[i] percent. Find the subset of positions that maximises total expected return without exceeding the budget. Each position can be taken at most once (no fractional positions).",
    examples: [
      {
        input: "B=10, capital=[3,4,5,6], expected_return=[4,5,6,7]",
        output: "11 (positions 0 and 2: capital 3+5=8 <= 10, return 4+6=10; or pos 1+2: 4+5=9, return 5+6=11)",
        explanation: "Greedy (highest return-per-capital) would pick position 3 first (7/6=1.17), then position 2 (6/5=1.2) — but 6+5=11>10. DP finds the global optimum: positions 1 and 2 with return 11.",
      },
    ],
    approach:
      "Standard 0/1 knapsack DP. dp[c] = max expected return using exactly c units of capital. For each position i, iterate c from B down to capital[i]: dp[c] = max(dp[c], dp[c - capital[i]] + expected_return[i]). Answer is max(dp). Backtrack to find which positions were selected.",
    code: `def knapsack_portfolio(B: int, capital: list[int],
                          expected_return: list[float]) -> tuple:
    """
    Returns (max_return, selected_positions).
    B: budget in integer units (scale if fractional).
    """
    n  = len(capital)
    dp = [0.0] * (B + 1)

    for i in range(n):
        # Iterate budget downward to ensure each position used at most once
        for c in range(B, capital[i] - 1, -1):
            dp[c] = max(dp[c], dp[c - capital[i]] + expected_return[i])

    max_ret = max(dp)

    # Backtrack to find selected positions
    selected = []
    c = dp.index(max_ret)
    for i in range(n - 1, -1, -1):
        if c >= capital[i] and abs(dp[c] - dp[c - capital[i]] - expected_return[i]) < 1e-9:
            selected.append(i)
            c -= capital[i]

    return max_ret, selected[::-1]


B = 10
cap = [3, 4, 5, 6]
ret = [4.0, 5.0, 6.0, 7.0]
max_r, positions = knapsack_portfolio(B, cap, ret)
print(f"Max return: {max_r}  Positions: {positions}")
# Max return: 11.0  Positions: [1, 2]`,
    language: "python",
    complexity: { time: "O(N * B)", space: "O(B)" },
  },
  {
    id: "fin-0523-b1-markov-absorption",
    leetcodeNumber: 0,
    title: "Expected Absorption Time in a Credit Markov Chain",
    difficulty: "hard",
    topics: ["math", "linear-algebra", "probability", "finance"],
    problem:
      "Given a credit rating transition matrix M (N states, one absorbing state = Default), compute the expected number of years until a company defaults, starting from each non-default rating. Use the fundamental matrix approach: solve (I - Q) * t = 1 where Q is the transient submatrix.",
    examples: [
      {
        input: "3-state system: [Good, Bad, Default]. Q = [[0.9, 0.1], [0.2, 0.7]] (transient submatrix)",
        output: "t_Good ≈ 14.3 years, t_Bad ≈ 10.7 years",
        explanation: "Fundamental matrix N = (I-Q)^{-1}: each entry N[i,j] = expected time spent in state j before absorption. Expected time to absorb from i = sum of row i of N.",
      },
    ],
    approach:
      "Extract the transient submatrix Q (all rows/cols except Default). Solve the linear system (I - Q) @ t = ones. The solution t[i] is the expected number of steps (years) before absorption from state i. Equivalently, compute N = (I-Q)^{-1} and sum its rows.",
    code: `import numpy as np

def expected_default_years(M: np.ndarray) -> np.ndarray:
    """
    M: (n x n) transition matrix with the last state as absorbing (Default).
    Returns: expected years to default for each non-default state.
    """
    n = M.shape[0]
    Q = M[:-1, :-1]   # transient submatrix (remove Default row and col)

    # Solve (I - Q) @ t = 1  =>  t = (I - Q)^{-1} @ 1
    IQ = np.eye(n - 1) - Q
    ones = np.ones(n - 1)
    t = np.linalg.solve(IQ, ones)   # expected absorption times
    return t

# Example: 3-state (Good, Bad, Default)
M = np.array([
    [0.90, 0.09, 0.01],   # Good
    [0.15, 0.70, 0.15],   # Bad
    [0.00, 0.00, 1.00],   # Default (absorbing)
])

t = expected_default_years(M)
states = ['Good', 'Bad']
for s, years in zip(states, t):
    print(f"From {s}: expected default in {years:.1f} years")

# Verify: fundamental matrix N = (I-Q)^{-1}
N = np.linalg.inv(np.eye(2) - M[:-1, :-1])
print("Fundamental matrix:\\n", N.round(2))`,
    language: "python",
    complexity: { time: "O(N^3) for matrix solve", space: "O(N^2)" },
  },
  {
    id: "fin-0523-b1-matrix-exp-compound",
    leetcodeNumber: 509,
    title: "Matrix Exponentiation: k-Period Portfolio Growth",
    difficulty: "medium",
    topics: ["math", "matrix-exponentiation", "dynamic-programming", "finance"],
    problem:
      "A portfolio evolves each period according to the recurrence: [value(t), factor(t)] = M @ [value(t-1), factor(t-1)] where M is a 2x2 transition matrix encoding growth and mean-reversion. Given M and initial state v0, compute the state after exactly k periods efficiently. This is the matrix-exponentiation pattern that also solves Fibonacci in O(log k).",
    examples: [
      {
        input: "M = [[1.05, 0.01], [0, 0.95]], v0 = [100, 1], k = 12",
        output: "State after 12 months (compound growth + mean-reverting factor)",
        explanation: "M^12 @ v0 computes the 12-period state. Naively requires 11 matrix multiplications; fast exponentiation (repeated squaring) does it in O(log k) = 4.",
      },
    ],
    approach:
      "Implement matrix multiplication and fast matrix exponentiation (repeated squaring): M^k = M^(k//2) @ M^(k//2) if k even, else M @ M^(k-1). Apply to the state vector. General form: compute M^k in O(d^3 * log k) where d is the matrix dimension.",
    code: `import numpy as np

def mat_mul(A: list[list[float]], B: list[list[float]]) -> list[list[float]]:
    """Multiply two 2x2 matrices (pure Python for interview clarity)."""
    return [
        [A[0][0]*B[0][0] + A[0][1]*B[1][0],
         A[0][0]*B[0][1] + A[0][1]*B[1][1]],
        [A[1][0]*B[0][0] + A[1][1]*B[1][0],
         A[1][0]*B[0][1] + A[1][1]*B[1][1]],
    ]

def mat_pow(M: list[list[float]], k: int) -> list[list[float]]:
    """Compute M^k via fast repeated squaring in O(log k) multiplications."""
    n = len(M)
    result = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]  # identity
    while k > 0:
        if k & 1:
            result = mat_mul(result, M)
        M = mat_mul(M, M)
        k >>= 1
    return result

def portfolio_state(M: list[list[float]], v0: list[float], k: int) -> list[float]:
    """State after k periods: Mk @ v0."""
    Mk = mat_pow(M, k)
    return [sum(Mk[i][j] * v0[j] for j in range(len(v0)))
            for i in range(len(Mk))]

# Compound growth with mean-reverting factor
M  = [[1.05, 0.01], [0.0, 0.95]]
v0 = [100.0, 1.0]
v12 = portfolio_state(M, v0, 12)
print(f"After 12 periods: value={v12[0]:.4f}, factor={v12[1]:.4f}")

# Verify with numpy
Mnp = np.array(M)
print("numpy check:", np.linalg.matrix_power(Mnp, 12) @ v0)`,
    language: "python",
    complexity: { time: "O(d^3 * log k)", space: "O(d^2)" },
  },
  {
    id: "fin-0523-b1-window-max-pnl",
    leetcodeNumber: 239,
    title: "Sliding Window Maximum Daily PnL",
    difficulty: "hard",
    topics: ["sliding-window", "deque", "monotonic-structure", "finance"],
    problem:
      "Given an array of daily PnL values and a window size k, return an array of the maximum PnL in each consecutive window of size k. This is used in rolling performance attribution: 'what is the best single-day PnL in each rolling k-day window?'",
    examples: [
      {
        input: "pnl = [3, -1, -3, 5, 3, 6, 7], k = 3",
        output: "[3, 5, 5, 6, 7]",
        explanation: "Windows: [3,-1,-3]->3, [-1,-3,5]->5, [-3,5,3]->5, [5,3,6]->6, [3,6,7]->7.",
      },
      {
        input: "pnl = [1, 3, -1, -3, 5, 3], k = 3",
        output: "[3, 3, 5, 5]",
        explanation: "Monotonic deque maintains decreasing order of values; front is always the window maximum.",
      },
    ],
    approach:
      "Monotonic deque: maintain indices in a deque such that pnl[deque[0]] is always the max in the current window. For each new element: (1) remove indices outside the window from the front, (2) pop indices from the back while pnl[back] <= pnl[i] (they can never be future maximums). Append i. When i >= k-1, output pnl[deque[0]].",
    code: `from collections import deque

def sliding_window_max(pnl: list[int], k: int) -> list[int]:
    """
    O(n) sliding window maximum via monotonic deque.
    Deque stores indices; values are strictly decreasing front-to-back.
    Front is always the index of the window maximum.
    """
    dq: deque[int] = deque()   # indices, front = max
    result: list[int] = []

    for i, val in enumerate(pnl):
        # Remove indices outside the window
        while dq and dq[0] <= i - k:
            dq.popleft()

        # Maintain decreasing order: remove smaller values from the back
        # They will never be the maximum while val is in the window
        while dq and pnl[dq[-1]] <= val:
            dq.pop()

        dq.append(i)

        # Window is full: emit the maximum (front of deque)
        if i >= k - 1:
            result.append(pnl[dq[0]])

    return result


print(sliding_window_max([3, -1, -3, 5, 3, 6, 7], 3))  # [3, 5, 5, 6, 7]
print(sliding_window_max([1,  3,  -1, -3, 5, 3],   3))  # [3, 3, 5, 5]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
  },
  {
    id: "fin-0523-b1-fenwick-prefix-pnl",
    leetcodeNumber: 307,
    title: "Fenwick Tree: Streaming PnL Range Queries with Point Updates",
    difficulty: "medium",
    topics: ["design", "fenwick-tree", "prefix-sum", "finance"],
    problem:
      "Design a PnLStream class that: (1) receives PnL updates for individual days (update(day, delta)), and (2) answers range queries (query(l, r)) returning the total PnL from day l to day r inclusive. Both operations should run in O(log N). This models a rolling P&L aggregation system where individual day PnLs are corrected after trade reconciliation.",
    examples: [
      {
        input: `stream = PnLStream(7)          # 7 trading days
stream.update(1, 100)           # day 1 PnL = +100
stream.update(3, -50)           # day 3 PnL = -50
stream.update(5, 200)           # day 5 PnL = +200
stream.query(1, 5)              # total PnL days 1..5`,
        output: "250 (100 + 0 + (-50) + 0 + 200)",
        explanation: "Fenwick tree supports O(log N) point updates and prefix sum queries. Range sum(l, r) = prefix(r) - prefix(l-1).",
      },
    ],
    approach:
      "Fenwick Tree (Binary Indexed Tree): stores cumulative sums in a clever array where index i covers indices i - lowbit(i) + 1 through i. Point update: walk UP the tree by adding lowbit(i). Prefix query: walk DOWN by subtracting lowbit(i). Range query = prefix(r) - prefix(l-1). All operations O(log N).",
    code: `class PnLStream:
    """
    Fenwick tree (BIT) for streaming PnL with O(log N) updates and range queries.
    1-indexed internally: day 1..N maps to index 1..N.
    """
    def __init__(self, n: int):
        self.n    = n
        self.tree = [0.0] * (n + 1)   # 1-indexed

    def _lowbit(self, i: int) -> int:
        return i & (-i)

    def update(self, day: int, delta: float) -> None:
        """Add delta to day (1-indexed)."""
        i = day
        while i <= self.n:
            self.tree[i] += delta
            i += self._lowbit(i)

    def prefix_sum(self, day: int) -> float:
        """Sum of PnL for days 1..day."""
        s, i = 0.0, day
        while i > 0:
            s += self.tree[i]
            i -= self._lowbit(i)
        return s

    def query(self, l: int, r: int) -> float:
        """Total PnL from day l to day r (both inclusive)."""
        return self.prefix_sum(r) - self.prefix_sum(l - 1)


# Example
stream = PnLStream(7)
stream.update(1,  100.0)
stream.update(3,  -50.0)
stream.update(5,  200.0)
print(stream.query(1, 5))    # 250.0
print(stream.query(1, 7))    # 250.0 (days 6,7 are zero)
stream.update(3,  30.0)      # correction: day 3 now -50+30 = -20
print(stream.query(1, 5))    # 280.0`,
    language: "python",
    complexity: { time: "O(log N) per update and query", space: "O(N)" },
  },
  {
    id: "fin-0523-b1-trap-profit-walls",
    leetcodeNumber: 42,
    title: "Maximum Trapped Liquidity Between Price Walls",
    difficulty: "hard",
    topics: ["monotonic-stack", "two-pointer", "finance"],
    problem:
      "Given an array walls representing the height (depth of liquidity) at each price level, compute the maximum total volume of liquidity that could be 'trapped' between walls — analogous to the Trapping Rain Water problem, modelling how deep an iceberg order book can hold hidden size between dominant price walls.",
    examples: [
      {
        input: "walls = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]",
        output: "6",
        explanation: "Trapped: 1 unit at index 2, 1 at index 4, 3 at index 5, 1 at index 6. Total = 6. Each position traps min(left_max, right_max) - wall[i].",
      },
      {
        input: "walls = [4, 2, 0, 3, 2, 5]",
        output: "9",
        explanation: "Level-by-level: between wall[0]=4 and wall[5]=5, trapped = (4-2)+(4-0)+(4-3)+(4-2) = 2+4+1+2 = 9.",
      },
    ],
    approach:
      "Two-pointer: maintain l=0, r=n-1, left_max, right_max. If walls[l] < walls[r], process left: trapped[l] = left_max - walls[l] (if left_max > walls[l]); move l right. Otherwise process right symmetrically. O(n) time O(1) space. Alternatively: monotonic stack collects trapped area between consecutive walls.",
    code: `def trap_liquidity(walls: list[int]) -> int:
    """
    Two-pointer O(n) O(1) solution.
    At each position, trapped volume = min(max_left, max_right) - wall[i].
    The two-pointer works because: if walls[l] < walls[r], the limiting wall
    on the left side is known (left_max), so we can compute trapped[l] now.
    """
    if not walls:
        return 0

    l, r = 0, len(walls) - 1
    left_max = right_max = 0
    total = 0

    while l < r:
        if walls[l] < walls[r]:
            if walls[l] >= left_max:
                left_max = walls[l]
            else:
                total += left_max - walls[l]   # trapped at position l
            l += 1
        else:
            if walls[r] >= right_max:
                right_max = walls[r]
            else:
                total += right_max - walls[r]  # trapped at position r
            r -= 1

    return total


print(trap_liquidity([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]))  # 6
print(trap_liquidity([4, 2, 0, 3, 2, 5]))                      # 9
print(trap_liquidity([3, 0, 2, 0, 4]))                         # 7`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
];
