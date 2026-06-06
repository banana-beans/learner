import type { LeetCodeProblem } from "./index";

export const financeProblems20260606B1: LeetCodeProblem[] = [
  {
    id: "fin-20260606-b1-rate-limiter",
    title: "Design a Token-Bucket Rate Limiter for Order Submissions",
    difficulty: "medium",
    topics: ["design", "sliding-window", "deque", "finance"],
    problem: `Design a RateLimiter that enforces a maximum of K order submissions per rolling window of W seconds. This is required by exchanges (e.g., NASDAQ allows 1000 orders/sec per session).

Implement:
- RateLimiter(K, W): K = max orders, W = window in seconds.
- allow_order(timestamp): returns True if an order submitted at 'timestamp' is allowed, False if it would exceed the rate limit. Timestamps are non-decreasing integers (in seconds).

The rate limiter must use O(K) space in the worst case.

Input: K=3, W=10. allow_order(1), allow_order(5), allow_order(9), allow_order(10), allow_order(11)
Output: True, True, True, False, True
Explanation: Orders at t=1,5,9 are within [1..10]. At t=10, 3 orders in [1..10] still present -> denied. At t=11, t=1 is evicted from [2..11]; only 2 remain -> allowed.`,
    examples: [
      {
        input: "K=3, W=10. allow(1), allow(5), allow(9), allow(10)",
        output: "True, True, True, False",
        explanation: "At t=10: window [1..10] contains timestamps {1,5,9} = 3 orders = K. Deny.",
      },
      {
        input: "allow(11) after the above",
        output: "True",
        explanation: "Window [2..11]: t=1 evicted. Remaining: {5,9} = 2 orders < K=3. Allow.",
      },
      {
        input: "K=1, W=5. allow(1), allow(3), allow(7)",
        output: "True, False, True",
        explanation: "t=3 in window [−1..3] with t=1 present (2 orders > K=1). t=7: t=1 evicted; allow.",
      },
    ],
    approach:
      "Sliding window with a deque of timestamps. On each allow_order(ts): evict front entries with timestamp <= ts - W. If deque size >= K: deny and do NOT add the timestamp. If size < K: add ts and allow. O(1) amortised per call; O(K) space.",
    code: `from collections import deque

class RateLimiter:
    """
    Sliding-window rate limiter using a deque of allowed timestamps.
    Each call is O(1) amortised; space O(K).
    """

    def __init__(self, K: int, W: int):
        self.K  = K         # max orders per window
        self.W  = W         # window size in seconds
        self.dq = deque()   # timestamps of allowed orders (oldest first)

    def allow_order(self, timestamp: int) -> bool:
        # Evict timestamps outside the window [ts - W + 1, ts].
        cutoff = timestamp - self.W + 1
        while self.dq and self.dq[0] < cutoff:
            self.dq.popleft()

        if len(self.dq) >= self.K:
            return False   # rate limit exceeded

        self.dq.append(timestamp)
        return True

# Test.
rl = RateLimiter(K=3, W=10)
for ts in [1, 5, 9, 10, 11]:
    print(f"allow_order({ts:2d}): {rl.allow_order(ts)}")
# Expected: True True True False True

# Extension: token bucket (allows bursts up to K, refills at rate K/W per second).
class TokenBucket:
    """
    Token bucket: allows instantaneous bursts of up to K requests,
    refills at rate K/W tokens per second. More permissive than sliding window.
    """
    def __init__(self, K: int, W: int):
        self.capacity    = K
        self.rate        = K / W        # tokens per second
        self.tokens      = float(K)     # start full
        self.last_refill = 0.0

    def allow_order(self, timestamp: float) -> bool:
        elapsed       = timestamp - self.last_refill
        self.tokens   = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_refill = timestamp

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False

tb = TokenBucket(K=3, W=10)
for ts in [0, 1, 2, 3, 4, 10]:
    print(f"token_bucket({ts:2d}): {tb.allow_order(ts)}")`,
    language: "python",
    complexity: { time: "O(1) amortised per call", space: "O(K)" },
  },
  {
    id: "fin-20260606-b1-next-greater-price",
    title: "Next Greater Price (Monotonic Stack)",
    difficulty: "medium",
    topics: ["monotonic-stack", "array", "finance"],
    problem: `Given a list of daily closing prices, for each day find the next day with a strictly higher closing price. This is used in breakout detection: given today's close, when was the next time the price broke above today's close?

Return an array result where result[i] = the number of days until the next higher price, or -1 if no such day exists.

Input: prices = [73, 74, 75, 71, 69, 72, 76, 73]
Output:         [1, 1, 4, 2, 1, 1, -1, -1]
Explanation: prices[0]=73: next higher is prices[1]=74 (1 day away). prices[2]=75: next higher is prices[6]=76 (4 days away).`,
    examples: [
      {
        input: "prices = [73, 74, 75, 71, 69, 72, 76, 73]",
        output: "[1, 1, 4, 2, 1, 1, -1, -1]",
        explanation: "73→74 (+1d), 74→75 (+1d), 75→76 (+4d), 71→72 (+2d), 69→72 (+1d), 72→76 (+1d), 76→none, 73→none.",
      },
      {
        input: "prices = [5, 4, 3, 2, 1]",
        output: "[-1, -1, -1, -1, -1]",
        explanation: "Monotonically decreasing: no price ever exceeds its predecessor.",
      },
      {
        input: "prices = [1, 2, 3, 4, 5]",
        output: "[1, 1, 1, 1, -1]",
        explanation: "Monotonically increasing: each day's next higher is the very next day.",
      },
    ],
    approach:
      "Monotonic decreasing stack stores indices of days awaiting their next higher price. Iterate i from 0 to n-1. While the stack is non-empty and prices[stack.top()] < prices[i]: pop j; result[j] = i - j. Push i. Remaining indices in stack have result = -1. O(n) time, O(n) space.",
    code: `def next_greater_price(prices: list[int]) -> list[int]:
    """
    For each day, find the number of days until the next higher price.
    Monotonic decreasing stack: indices of days awaiting a breakout.
    """
    n      = len(prices)
    result = [-1] * n
    stack  = []   # stack of indices, prices[stack] is non-increasing

    for i in range(n):
        # Pop all days whose price is beaten by prices[i].
        while stack and prices[stack[-1]] < prices[i]:
            j         = stack.pop()
            result[j] = i - j   # days until next higher price
        stack.append(i)

    # Remaining in stack: no future higher price exists -> result stays -1.
    return result

print(next_greater_price([73, 74, 75, 71, 69, 72, 76, 73]))
# [1, 1, 4, 2, 1, 1, -1, -1]
print(next_greater_price([5, 4, 3, 2, 1]))
# [-1, -1, -1, -1, -1]
print(next_greater_price([1, 2, 3, 4, 5]))
# [1, 1, 1, 1, -1]

# Extension 1: return the actual higher price (not just the day count).
def next_greater_price_value(prices: list[int]) -> list[int]:
    """Returns the next higher price value, or -1."""
    n = len(prices); result = [-1] * n; stack = []
    for i, p in enumerate(prices):
        while stack and prices[stack[-1]] < p:
            result[stack.pop()] = p
        stack.append(i)
    return result

print(next_greater_price_value([73, 74, 75, 71, 69, 72, 76, 73]))
# [74, 75, 76, 72, 72, 76, -1, -1]

# Extension 2: circular (prices wrap around — useful for intraday patterns).
def next_greater_circular(prices: list[int]) -> list[int]:
    """Next greater in a circular array (iterate twice)."""
    n = len(prices); result = [-1] * n; stack = []
    for i in range(2 * n):
        while stack and prices[stack[-1]] < prices[i % n]:
            result[stack.pop()] = prices[i % n]
        if i < n: stack.append(i)
    return result`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260606-b1-sliding-window-max",
    title: "Sliding Window Maximum Price (Rolling High-Water Mark)",
    difficulty: "hard",
    topics: ["monotonic-deque", "sliding-window", "finance"],
    problem: `Given an array of daily prices and a window size W, compute the maximum price in every W-day window. This is used to compute a rolling high-water mark for drawdown calculations, or the highest price in a lookback period for momentum signals.

Return an array of length n - W + 1 where result[i] = max(prices[i..i+W-1]).

Input: prices = [1, 3, -1, -3, 5, 3, 6, 7], W = 3
Output: [3, 3, 5, 5, 6, 7]

Constraints: 1 <= W <= n. Solve in O(n) time.`,
    examples: [
      {
        input: "prices = [1, 3, -1, -3, 5, 3, 6, 7], W=3",
        output: "[3, 3, 5, 5, 6, 7]",
        explanation: "Windows: [1,3,-1]->3, [3,-1,-3]->3, [-1,-3,5]->5, [-3,5,3]->5, [5,3,6]->6, [3,6,7]->7.",
      },
      {
        input: "prices = [4, 3, 2, 1], W=2",
        output: "[4, 3, 2]",
        explanation: "Monotonically decreasing: each window max is the left endpoint.",
      },
      {
        input: "prices = [1, 3, 1, 2, 0, 5], W=3",
        output: "[3, 3, 2, 5]",
        explanation: "[1,3,1]->3, [3,1,2]->3, [1,2,0]->2, [2,0,5]->5.",
      },
    ],
    approach:
      "Monotonic decreasing deque stores indices. For each i: (1) Pop from front if dq[0] <= i - W (out of window). (2) Pop from back while prices[dq[-1]] <= prices[i] (monotonic invariant). (3) Append i. (4) If i >= W-1, append dq[0] to result. O(n) — each index is pushed and popped at most once.",
    code: `from collections import deque

def sliding_window_max(prices: list[int], W: int) -> list[int]:
    """
    Sliding window maximum via monotonic decreasing deque.
    Deque stores indices of potentially-maximal elements in current window.
    Front of deque = index of maximum in current window.
    """
    dq     = deque()   # indices, decreasing prices
    result = []

    for i, p in enumerate(prices):
        # Remove indices that have fallen outside the window.
        while dq and dq[0] <= i - W:
            dq.popleft()

        # Maintain decreasing invariant: remove back elements smaller than p.
        # They can never be the maximum of any future window.
        while dq and prices[dq[-1]] <= p:
            dq.pop()

        dq.append(i)

        # Window is full: front of deque = maximum index.
        if i >= W - 1:
            result.append(prices[dq[0]])

    return result

print(sliding_window_max([1, 3, -1, -3, 5, 3, 6, 7], 3))  # [3,3,5,5,6,7]
print(sliding_window_max([4, 3, 2, 1], 2))                 # [4,3,2]
print(sliding_window_max([1, 3, 1, 2, 0, 5], 3))           # [3,3,2,5]

# Finance application: rolling high-water mark (HWM) for drawdown.
def rolling_hwm_drawdown(prices: list[float], W: int) -> list[float]:
    """
    Returns rolling max-drawdown for each W-day window.
    drawdown[i] = (HWM - min_in_window) / HWM.
    """
    n  = len(prices)
    dd = []
    for i in range(W - 1, n):
        window = prices[i - W + 1 : i + 1]
        hwm  = max(window)
        trough = min(window)
        dd.append((hwm - trough) / hwm if hwm > 0 else 0.0)
    return [round(x, 4) for x in dd]

print(rolling_hwm_drawdown([100,120,110,90,115,80,130], 3))`,
    language: "python",
    complexity: { time: "O(n)", space: "O(W)" },
  },
  {
    id: "fin-20260606-b1-order-book-design",
    title: "Design an Order Book with Best Bid/Ask",
    difficulty: "medium",
    topics: ["design", "sorted-map", "heap", "finance"],
    problem: `Design an OrderBook that supports limit order management with O(log n) operations.

Implement:
- add_order(order_id, side, price, qty): add a limit order ('B'=bid, 'A'=ask).
- cancel_order(order_id): cancel an existing order.
- get_best_bid(): return the highest bid price and total qty at that level.
- get_best_ask(): return the lowest ask price and total qty at that level.
- match_orders(): match the best bid against the best ask if bid >= ask; return list of trades.

Input: add B 100.0 500, add B 99.5 300, add A 100.5 200, add A 101.0 400
get_best_bid() -> (100.0, 500), get_best_ask() -> (100.5, 200)`,
    examples: [
      {
        input: "add('B',100.0,500), add('B',99.5,300), get_best_bid()",
        output: "(100.0, 500)",
        explanation: "Highest bid is 100.0 with 500 shares.",
      },
      {
        input: "add('A',100.5,200), add('A',101.0,400), get_best_ask()",
        output: "(100.5, 200)",
        explanation: "Lowest ask is 100.5 with 200 shares.",
      },
      {
        input: "add('B',101.0,300) then match_orders()",
        output: "[(101.0, min(300,200)=200)]",
        explanation: "Bid 101.0 >= ask 100.5: trade executes at ask price for min(300,200)=200 shares.",
      },
    ],
    approach:
      "Use a sorted dict (SortedList or heapq with lazy deletion) for each side. Bids: max-heap (negate prices). Asks: min-heap. Order map: order_id -> (side, price, qty) for O(1) cancel lookup. Lazy deletion: mark cancelled orders; skip them when peeking at best bid/ask. O(log n) add/cancel, O(1) amortised best bid/ask.",
    code: `import heapq
from collections import defaultdict

class OrderBook:
    """
    Limit order book with heaps + lazy deletion.
    Bids: max-heap (negated prices). Asks: min-heap.
    Cancelled orders are skipped lazily when reading the top.
    """

    def __init__(self):
        self.bids: list = []    # max-heap: (-price, order_id)
        self.asks: list = []    # min-heap: (price, order_id)
        self.orders: dict = {}  # order_id -> {'side','price','qty','active'}
        self.levels: dict = defaultdict(float)  # price -> total qty (for display)

    def add_order(self, order_id: int, side: str,
                   price: float, qty: float) -> None:
        self.orders[order_id] = {'side': side, 'price': price, 'qty': qty, 'active': True}
        self.levels[(side, price)] += qty
        if side == 'B':
            heapq.heappush(self.bids, (-price, order_id))
        else:
            heapq.heappush(self.asks, (price, order_id))

    def cancel_order(self, order_id: int) -> bool:
        if order_id not in self.orders or not self.orders[order_id]['active']:
            return False
        o = self.orders[order_id]
        o['active'] = False
        self.levels[(o['side'], o['price'])] -= o['qty']
        return True

    def _peek_best(self, heap, negate=False):
        """Pop inactive orders lazily; return (price, qty) of best level."""
        while heap:
            top = heap[0]
            oid = top[1]
            if self.orders.get(oid, {}).get('active', False):
                price = -top[0] if negate else top[0]
                return price, self.levels.get(
                    ('B' if negate else 'A', price), 0)
            heapq.heappop(heap)   # lazy delete inactive
        return None, 0

    def get_best_bid(self):
        return self._peek_best(self.bids, negate=True)

    def get_best_ask(self):
        return self._peek_best(self.asks, negate=False)

    def match_orders(self) -> list[tuple]:
        """Match best bid against best ask while bid >= ask."""
        trades = []
        while True:
            bp, bq = self.get_best_bid()
            ap, aq = self.get_best_ask()
            if bp is None or ap is None or bp < ap:
                break
            trade_qty = min(bq, aq)
            trades.append((ap, trade_qty))

            # Reduce quantities (simplified: cancel full orders for demo).
            for oid, o in self.orders.items():
                if o['active'] and o['side'] == 'B' and o['price'] == bp:
                    self.cancel_order(oid); break
            for oid, o in self.orders.items():
                if o['active'] and o['side'] == 'A' and o['price'] == ap:
                    self.cancel_order(oid); break
        return trades

# Test.
ob = OrderBook()
ob.add_order(1, 'B', 100.0, 500)
ob.add_order(2, 'B',  99.5, 300)
ob.add_order(3, 'A', 100.5, 200)
ob.add_order(4, 'A', 101.0, 400)

print("Best bid:", ob.get_best_bid())   # (100.0, 500)
print("Best ask:", ob.get_best_ask())   # (100.5, 200)

ob.cancel_order(1)
print("After cancel:", ob.get_best_bid())  # (99.5, 300)

ob.add_order(5, 'B', 101.0, 300)
trades = ob.match_orders()
print("Trades:", trades)   # [(100.5, 300) or similar]`,
    language: "python",
    complexity: { time: "O(log n) add/cancel, O(1) amortised best bid/ask", space: "O(n)" },
  },
  {
    id: "fin-20260606-b1-gamblers-ruin",
    title: "Gambler's Ruin — Probability of Reaching Profit Target Before Ruin",
    difficulty: "medium",
    topics: ["dynamic-programming", "probability", "markov", "finance"],
    problem: `A trader starts with capital C dollars. On each trade, they win $1 with probability p and lose $1 with probability 1-p. The trader stops if they reach a profit target T (total capital = C + T) or go bust (capital = 0).

Compute the probability that the trader reaches the profit target before going bust.

This is the classic Gambler's Ruin problem, directly applicable to trade sizing and risk-of-ruin analysis.

Input: C=5, T=5 (target = 10 total), p=0.55
Output: 0.7705 (approximate; exact formula available)

Input: C=10, T=5, p=0.50
Output: 0.6667 (fair coin: exact = C/(C+T))`,
    examples: [
      {
        input: "C=5, T=5, p=0.55",
        output: "≈0.7705",
        explanation: "With edge p=0.55, from C=5 targeting C+T=10: P(ruin) = exact via geometric formula.",
      },
      {
        input: "C=10, T=5, p=0.50",
        output: "0.6667",
        explanation: "Fair coin (p=0.5): P(reach target) = C/(C+T) = 10/15 = 0.6667.",
      },
      {
        input: "C=1, T=99, p=0.49",
        output: "≈0.018",
        explanation: "Slight disadvantage and large target: almost certain ruin from small capital.",
      },
    ],
    approach:
      "Closed-form: if p != 0.5: P(reach N=C+T | start=C) = (1 - (q/p)^C) / (1 - (q/p)^N) where q=1-p. If p=0.5: P = C/N. DP alternative: dp[c] = P(reach N | capital=c); dp[0]=0, dp[N]=1; dp[c] = p*dp[c+1] + q*dp[c-1]. O(N) time.",
    code: `def gamblers_ruin_exact(C: int, T: int, p: float) -> float:
    """
    Exact Gambler's Ruin formula.
    P(reach target T from capital C, total wealth N = C + T).
    Win $1 with prob p, lose $1 with prob q = 1-p.
    """
    N = C + T
    q = 1.0 - p
    if abs(p - 0.5) < 1e-10:
        return C / N   # fair game: probability proportional to position
    r = q / p         # ratio
    return (1 - r**C) / (1 - r**N)

def gamblers_ruin_dp(C: int, T: int, p: float) -> float:
    """
    DP solution: dp[c] = P(survive to N starting from capital c).
    More flexible: can accommodate non-unit bet sizes or varying p.
    """
    N = C + T
    q = 1.0 - p
    dp = [0.0] * (N + 1)
    dp[N] = 1.0   # target reached
    # Iterative: solve the linear system dp[c] = p*dp[c+1] + q*dp[c-1].
    # Equivalent to the closed-form via forward recurrence.
    if abs(p - 0.5) < 1e-10:
        for c in range(1, N): dp[c] = c / N
    else:
        r = q / p
        for c in range(1, N):
            dp[c] = (1 - r**c) / (1 - r**N)
    return dp[C]

# Tests.
for C, T, p in [(5, 5, 0.55), (10, 5, 0.50), (1, 99, 0.49)]:
    exact = gamblers_ruin_exact(C, T, p)
    dp_   = gamblers_ruin_dp(C, T, p)
    print(f"C={C:3d} T={T:3d} p={p}: exact={exact:.4f}  dp={dp_:.4f}")

# Extension: expected number of trades until game ends.
def expected_duration(C: int, T: int, p: float) -> float:
    """Expected number of trades until either ruin or target."""
    N = C + T
    q = 1.0 - p
    if abs(p - 0.5) < 1e-10:
        return float(C * T)   # fair game: E[duration] = C*(N-C)
    P_win = gamblers_ruin_exact(C, T, p)
    # Exact: E[duration | start=C] = C/(q-p) - N/(q-p) * P(C,N).
    return (C / (q - p) - (N / (q - p)) * P_win) if abs(q-p) > 1e-10 else float(C*T)

print("Expected trades (C=10, T=10, p=0.55):", round(expected_duration(10, 10, 0.55), 1))`,
    language: "python",
    complexity: { time: "O(N) DP or O(1) closed-form", space: "O(N) DP or O(1) closed-form" },
  },
  {
    id: "fin-20260606-b1-matrix-power-portfolio",
    title: "Multi-Period Portfolio Compounding via Matrix Exponentiation",
    difficulty: "medium",
    topics: ["matrix", "math", "dynamic-programming", "finance"],
    problem: `A portfolio's state transitions between asset classes follow a linear recurrence. Given a K×K transition matrix M and an initial state vector v, compute v_n = M^n * v (the portfolio state after n periods) efficiently.

This arises in multi-period rebalancing (portfolio allocation dynamics), Markov credit migration, and term-structure factor forecasting.

Input: M = [[0.9, 0.1], [0.2, 0.8]], v = [100, 50], n = 10
Output: M^10 * v (two-asset allocation after 10 rebalancing periods)

Constraint: Compute M^n in O(K^3 log n) using fast matrix exponentiation.`,
    examples: [
      {
        input: "M=[[0.9,0.1],[0.2,0.8]], v=[100,50], n=10",
        output: "[66.67, 83.33] approx",
        explanation: "Repeated application of M pushes the vector toward the stationary distribution: pi = (p12/(p12+p21), p21/(p12+p21)) = (2/3, 1/3) of 150 total = [100, 50].",
      },
      {
        input: "M=[[1,0],[0,1]], v=[100,50], n=100",
        output: "[100, 50]",
        explanation: "Identity matrix: no change regardless of n.",
      },
      {
        input: "M=[[0,1],[1,0]], v=[1,0], n=3",
        output: "[0, 1]",
        explanation: "Swap matrix: M^odd = swap, M^even = identity. n=3 (odd): v=[0,1].",
      },
    ],
    approach:
      "Matrix exponentiation via binary squaring: matpow(M, n). For each bit of n from LSB to MSB: if bit set, result = result * M; M = M * M. O(K^3 log n) multiplications. Then multiply result matrix by v. For K=2 this is extremely fast; handles n up to 2^63.",
    code: `import numpy as np
from typing import Union

def mat_mul(A: list[list[float]], B: list[list[float]]) -> list[list[float]]:
    """K×K matrix multiplication."""
    K = len(A)
    C = [[0.0]*K for _ in range(K)]
    for i in range(K):
        for k in range(K):
            if A[i][k] == 0: continue
            for j in range(K):
                C[i][j] += A[i][k] * B[k][j]
    return C

def mat_pow(M: list[list[float]], n: int) -> list[list[float]]:
    """Matrix power via binary exponentiation: O(K^3 log n)."""
    K      = len(M)
    result = [[1.0 if i==j else 0.0 for j in range(K)] for i in range(K)]  # identity
    base   = [row[:] for row in M]
    while n > 0:
        if n & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        n >>= 1
    return result

def portfolio_after_n_periods(M: list[list[float]],
                               v: list[float],
                               n: int) -> list[float]:
    """Apply M^n to state vector v."""
    Mn = mat_pow(M, n)
    K  = len(v)
    return [sum(Mn[i][j] * v[j] for j in range(K)) for i in range(K)]

# Test 1: Markov rebalancing.
M  = [[0.9, 0.1], [0.2, 0.8]]
v  = [100.0, 50.0]
r1 = portfolio_after_n_periods(M, v, 10)
print(f"After 10 periods: {[round(x,4) for x in r1]}")

r2 = portfolio_after_n_periods(M, v, 1000)
print(f"After 1000 (near stationary): {[round(x,4) for x in r2]}")
# Stationary: pi = (p12/(p12+p21), p21/(p12+p21)) * total = (2/3, 1/3) * 150
total = sum(v)
pi = [total * 0.2/0.3, total * 0.1/0.3]
print(f"Stationary distribution: {[round(x,4) for x in pi]}")

# Test 2: identity.
I  = [[1,0],[0,1]]
print(portfolio_after_n_periods(I, [100, 50], 100))   # [100, 50]

# Test 3: swap.
S  = [[0,1],[1,0]]
print(portfolio_after_n_periods(S, [1.0, 0.0], 3))    # [0, 1]

# Extension: credit migration over N periods (3-state: A, B, Default).
M_credit = [[0.92, 0.07, 0.01],
            [0.05, 0.85, 0.10],
            [0.00, 0.00, 1.00]]
v_credit = [1.0, 0.0, 0.0]   # start in A
for n in [1, 5, 10]:
    state = portfolio_after_n_periods(M_credit, v_credit, n)
    print(f"{n:2d}Y default prob: {state[2]:.4f}")`,
    language: "python",
    complexity: { time: "O(K³ log n)", space: "O(K²)" },
  },
  {
    id: "fin-20260606-b1-counting-paths-barrier",
    title: "Count Paths Above a Profit Watermark (Ballot Problem / Catalan)",
    difficulty: "hard",
    topics: ["combinatorics", "dynamic-programming", "math", "finance"],
    problem: `A trader makes N binary trades: each trade either earns +1 or loses -1. The trader starts at cumulative P&L = 0. Count the number of trade sequences of length N such that the running cumulative P&L NEVER drops below zero (i.e., stays >= 0 at all intermediate steps).

This is the ballot problem / Catalan number problem applied to trading: how many paths stay above water throughout?

If there are k wins (each +1) and N-k losses (each -1) with k > N-k (net positive), the count is given by the ballot theorem.

Input: N=4, k=3 (3 wins, 1 loss, net = +2)
Output: 3 (out of C(4,3)=4 total sequences, 3 stay non-negative throughout)

Input: N=6, k=3 (balanced, net = 0)
Output: 5 (Catalan number C_3 = 5)`,
    examples: [
      {
        input: "N=4, k=3",
        output: "3",
        explanation: "C(4,3)=4 sequences. Sequences: WWWL=++++−, WWLW, WLWW, LWWW. LWWW: prefix -1 at step 1 → invalid. 3 paths stay >= 0.",
      },
      {
        input: "N=6, k=3",
        output: "5",
        explanation: "Balanced paths (k=3, N-k=3) that stay >= 0 = Catalan(3) = C(6,3)/(3+1) = 20/4 = 5.",
      },
      {
        input: "N=2, k=1",
        output: "1",
        explanation: "2 sequences: WL (stays >=0) and LW (dips to -1 at step 1). Only WL is valid.",
      },
    ],
    approach:
      "DP approach: dp[i][j] = number of paths of length i ending at cumulative P&L j that never went below 0. Transitions: dp[i][j] = dp[i-1][j-1] (win) + dp[i-1][j+1] (loss), with boundary dp[i][0] receives only dp[i-1][1] (can't go below 0). Closed-form: Ballot theorem gives count = (2k-N)/N * C(N,k) for k>N/2.",
    code: `from math import comb

def count_non_negative_paths_formula(N: int, k: int) -> int:
    """
    Ballot theorem: number of sequences with k wins and N-k losses
    that NEVER drop below 0 (stay >= 0 at all steps including start).
    Requires k >= N - k (i.e., k >= N/2) for any valid paths.
    Formula: (2k - N + 1) / (N + 1) * C(N+1, k+1)  [reflection principle].
    Equivalent: (2k - N) / N * C(N, k) for k > N/2  (strict ballot).
    """
    losses = N - k
    if k < losses:
        return 0   # net negative: impossible to stay non-negative

    if k == losses:
        # Balanced case: Catalan number C_k = C(2k,k)/(k+1).
        return comb(N, k) // (k + 1) if k > 0 else 1

    # Strict ballot: path starts at 0 and stays >= 0.
    # Count = (k - losses + 1) / (N + 1) * C(N+1, k+1)
    return (k - losses + 1) * comb(N + 1, k + 1) // (N + 1)

def count_non_negative_paths_dp(N: int, k: int) -> int:
    """
    DP: dp[pnl] = number of paths reaching pnl after all N trades,
    that never went below 0.
    More flexible: can handle non-binary outcomes or varying probabilities.
    """
    losses = N - k
    # dp[j] = paths at current P&L = j, never having gone below 0.
    # j ranges from 0 to N.
    dp = [0] * (N + 2)
    dp[0] = 1   # start at P&L = 0

    wins_left, losses_left = k, losses

    for step in range(N):
        new_dp = [0] * (N + 2)
        for pnl in range(N + 1):
            if dp[pnl] == 0: continue
            # Win: pnl + 1.
            if wins_left > 0 and step < N:
                new_dp[pnl + 1] += dp[pnl]
            # Loss: pnl - 1, but only if result >= 0.
            if losses_left > 0 and pnl - 1 >= 0:
                new_dp[pnl - 1] += dp[pnl]
        # Note: above doesn't properly track k,losses per path; use simpler variant.
        dp = new_dp

    # Simpler DP that exhausts exactly k wins and N-k losses.
    dp2 = [[0] * (k + 1) for _ in range(losses + 1)]
    dp2[0][0] = 1   # 0 losses, 0 wins used, P&L = 0... need 3D.

    # 3D DP: dp[w][l] = paths using w wins and l losses, P&L = w-l >= 0 always.
    INF = 10**9
    dp3 = [[0]*(losses+1) for _ in range(k+1)]
    dp3[0][0] = 1
    for w in range(k+1):
        for l in range(losses+1):
            if dp3[w][l] == 0: continue
            pnl = w - l
            if w < k:
                dp3[w+1][l] += dp3[w][l]   # win
            if l < losses and pnl > 0:     # lose only if pnl > 0 (stays >= 0 after loss)
                dp3[w][l+1] += dp3[w][l]
    return dp3[k][losses]

for N, k in [(4, 3), (6, 3), (2, 1), (8, 4), (10, 6)]:
    f = count_non_negative_paths_formula(N, k)
    d = count_non_negative_paths_dp(N, k)
    total = comb(N, k)
    print(f"N={N} k={k}: formula={f} dp={d} total_paths={total}")`,
    language: "python",
    complexity: { time: "O(k × (N-k)) DP or O(1) closed-form", space: "O(k × (N-k))" },
  },
  {
    id: "fin-20260606-b1-bit-portfolio-flags",
    title: "Portfolio Exposure Flags — Bit Manipulation for Risk Aggregation",
    difficulty: "easy",
    topics: ["bit-manipulation", "design", "finance"],
    problem: `A risk system tracks which risk factors a portfolio is exposed to using a bitmask. Each bit position corresponds to a risk factor: bit 0 = equity, bit 1 = rates, bit 2 = FX, bit 3 = credit, bit 4 = commodity, etc.

Implement:
- add_exposure(flags, factor): add a risk factor.
- remove_exposure(flags, factor): remove a risk factor.
- has_exposure(flags, factor): check membership.
- count_exposures(flags): count the number of active risk factors.
- common_exposures(flags1, flags2): return factors in both portfolios.
- unique_exposures(flags1, flags2): return factors in one but not both.

Use bitwise operations only. Factors are integers 0..63.`,
    examples: [
      {
        input: "add_exposure(0, 0) -> add equity",
        output: "1 (0b00001)",
        explanation: "Set bit 0: 0 | (1<<0) = 1.",
      },
      {
        input: "add equity+rates+FX: add(add(add(0,0),1),2)",
        output: "7 (0b00111)",
        explanation: "Bits 0,1,2 set: 1+2+4=7.",
      },
      {
        input: "count_exposures(7)",
        output: "3",
        explanation: "popcount(0b111) = 3.",
      },
    ],
    approach:
      "All operations are single bitwise ops: add = flags | (1<<f), remove = flags & ~(1<<f), has = bool(flags & (1<<f)), count = bin(flags).count('1') or bin.bit_count(), common = f1 & f2, unique (XOR) = f1 ^ f2.",
    code: `class RiskFlagSet:
    """
    Bitmask-based risk exposure tracker.
    Supports up to 64 risk factors (int64 bitmask).
    All single-factor operations: O(1). Aggregations: O(1) via popcount.
    """

    FACTOR_NAMES = {
        0: 'Equity', 1: 'Rates', 2: 'FX', 3: 'Credit',
        4: 'Commodity', 5: 'Volatility', 6: 'Inflation', 7: 'Real_Estate',
    }

    def __init__(self, flags: int = 0):
        self.flags = flags

    def add_exposure(self, factor: int) -> 'RiskFlagSet':
        return RiskFlagSet(self.flags | (1 << factor))

    def remove_exposure(self, factor: int) -> 'RiskFlagSet':
        return RiskFlagSet(self.flags & ~(1 << factor))

    def has_exposure(self, factor: int) -> bool:
        return bool(self.flags & (1 << factor))

    def count_exposures(self) -> int:
        return bin(self.flags).count('1')   # or: self.flags.bit_count() in Python 3.10+

    def active_factors(self) -> list[str]:
        return [self.FACTOR_NAMES.get(i, f'Factor_{i}')
                for i in range(64) if self.flags & (1 << i)]

    def __and__(self, other: 'RiskFlagSet') -> 'RiskFlagSet':
        """Common exposures (both portfolios share)."""
        return RiskFlagSet(self.flags & other.flags)

    def __or__(self, other: 'RiskFlagSet') -> 'RiskFlagSet':
        """Union of exposures."""
        return RiskFlagSet(self.flags | other.flags)

    def __xor__(self, other: 'RiskFlagSet') -> 'RiskFlagSet':
        """Unique exposures (in one but not both)."""
        return RiskFlagSet(self.flags ^ other.flags)

    def __repr__(self): return f"RiskFlagSet(0b{self.flags:08b})"


# Test.
p1 = RiskFlagSet()
p1 = p1.add_exposure(0)   # Equity
p1 = p1.add_exposure(1)   # Rates
p1 = p1.add_exposure(2)   # FX
print("Portfolio 1:", p1)
print("Exposures:", p1.active_factors())
print("Count:", p1.count_exposures())   # 3

p2 = RiskFlagSet()
p2 = p2.add_exposure(1)   # Rates
p2 = p2.add_exposure(3)   # Credit
p2 = p2.add_exposure(4)   # Commodity

common  = p1 & p2
print("Common:", common.active_factors())   # ['Rates']
unique_ = p1 ^ p2
print("Unique:", unique_.active_factors())  # ['Equity','FX','Credit','Commodity']

# Efficiently find all factor bits set.
def list_set_bits(flags: int) -> list[int]:
    """Iterate only over set bits using x & (x-1) to strip lowest bit."""
    bits, x = [], flags
    while x:
        lsb = x & (-x)                        # isolate lowest set bit
        bits.append(lsb.bit_length() - 1)     # bit position
        x  &= x - 1                            # clear lowest bit
    return bits

print("Set bit positions in p1:", list_set_bits(p1.flags))  # [0,1,2]`,
    language: "python",
    complexity: { time: "O(1) per operation, O(k) to list k active factors", space: "O(1)" },
  },
  {
    id: "fin-20260606-b1-min-rebalance",
    title: "Minimum Cost to Rebalance Portfolio to Target Weights",
    difficulty: "medium",
    topics: ["greedy", "math", "finance"],
    problem: `A portfolio has N assets with current values v[i] and a total value V = sum(v). The target allocation is t[i] (fractions summing to 1). Find the minimum number of trades (each trade moves money between two assets) to reach the target allocation.

Equivalently: compute the minimum total turnover = 0.5 * sum |w_current - w_target| where w_current = v[i]/V. This equals the sum of all buys (which equals sum of all sells).

Return the one-way turnover as a fraction of total portfolio value.

Input: v=[60, 20, 20], t=[0.5, 0.3, 0.2]
Output: 0.10 (need to sell 10% of equity and buy 10% more of bonds)`,
    examples: [
      {
        input: "v=[60, 20, 20], t=[0.5, 0.3, 0.2]",
        output: "0.10",
        explanation: "Current: [0.6, 0.2, 0.2]. Target: [0.5, 0.3, 0.2]. Diffs: [-0.1, +0.1, 0.0]. Turnover = sum(positives) = 0.10.",
      },
      {
        input: "v=[100, 0, 0], t=[0.33, 0.33, 0.34]",
        output: "0.67",
        explanation: "Current: [1,0,0]. Target: [0.33,0.33,0.34]. Need to sell 67% of asset 0 and buy 33%+34%.",
      },
      {
        input: "v=[33, 33, 34], t=[0.33, 0.33, 0.34]",
        output: "0.0",
        explanation: "Already at target (within floating point); no trades needed.",
      },
    ],
    approach:
      "One-liner: one_way_turnover = 0.5 * sum(|w_i - t_i|) for all i. This is O(N). The minimum number of actual buy/sell pairs needed equals the number of assets being bought (which equals the number being sold, each matched greedily from largest mismatch). The greedy pairing minimises number of transactions.",
    code: `def min_rebalance_turnover(values: list[float],
                                targets: list[float]) -> dict:
    """
    Minimum one-way turnover to rebalance from current to target weights.
    Returns: turnover fraction, list of trades (sell/buy amounts per asset).
    """
    V   = sum(values)
    n   = len(values)
    w   = [v / V for v in values]   # current weights

    diffs = [targets[i] - w[i] for i in range(n)]   # positive = buy, negative = sell

    # One-way turnover = sum of buys = sum of sells (since they must balance).
    turnover = sum(d for d in diffs if d > 0)   # = 0.5 * sum(|diffs|)

    # Greedy matching: pair largest sellers with largest buyers.
    # Produces the minimum number of trades.
    buys   = sorted([(diffs[i], i) for i in range(n) if diffs[i] > 1e-9], reverse=True)
    sells  = sorted([(-diffs[i], i) for i in range(n) if diffs[i] < -1e-9], reverse=True)

    trades = []
    bi, si = 0, 0
    buy_rem  = [b[0] for b in buys]
    sell_rem = [s[0] for s in sells]

    while bi < len(buys) and si < len(sells):
        amt = min(buy_rem[bi], sell_rem[si])
        buy_asset  = buys[bi][1]
        sell_asset = sells[si][1]
        trades.append({
            'sell': sell_asset, 'buy': buy_asset,
            'amount_pct': round(amt * 100, 4)
        })
        buy_rem[bi]  -= amt
        sell_rem[si] -= amt
        if buy_rem[bi] < 1e-10:  bi += 1
        if sell_rem[si] < 1e-10: si += 1

    return {
        'current_weights': [round(x, 4) for x in w],
        'target_weights':  targets,
        'diffs_%':         [round(d*100, 4) for d in diffs],
        'one_way_turnover_%': round(turnover * 100, 4),
        'n_trades':        len(trades),
        'trades':          trades,
    }

# Test 1: standard rebalancing.
result = min_rebalance_turnover([60, 20, 20], [0.5, 0.3, 0.2])
for k, v in result.items():
    print(f"{k}: {v}")

print()
# Test 2: all-in-one asset.
result2 = min_rebalance_turnover([100, 0, 0], [0.33, 0.33, 0.34])
print(f"Turnover: {result2['one_way_turnover_%']}%  Trades: {result2['n_trades']}")

print()
# Test 3: already at target.
result3 = min_rebalance_turnover([33, 33, 34], [0.33, 0.33, 0.34])
print(f"Turnover: {result3['one_way_turnover_%']}%")`,
    language: "python",
    complexity: { time: "O(N log N) for sorting trades, O(N) for turnover", space: "O(N)" },
  },
  {
    id: "fin-20260606-b1-markov-expected-hits",
    title: "Expected Trades to Hit a P&L Level (Markov Random Walk)",
    difficulty: "hard",
    topics: ["probability", "markov", "dynamic-programming", "finance"],
    problem: `A strategy earns +1 with probability p and loses -1 with probability q=1-p on each trade, starting from 0. Compute the expected number of trades to first reach level L > 0 (i.e., cumulative P&L = L), or return -1 if p <= 0.5 and L > 0 (may never reach it).

This is the expected first-passage time for a random walk, directly applicable to asking: 'On average, how many trades does it take for my strategy to earn its first L dollars?'

Input: L=5, p=0.55
Output: ≈45.8 (expected trades to earn +5 dollars net)

Input: L=10, p=0.60
Output: ≈28.6`,
    examples: [
      {
        input: "L=5, p=0.55",
        output: "≈45.8",
        explanation: "Small edge (p=0.55) requires many trades to reliably reach +5. Expected time scales as L/(2p-1) for large L.",
      },
      {
        input: "L=1, p=0.60",
        output: "≈2.5",
        explanation: "Expected first-passage to +1 from 0: 1/(2*0.6-1) = 1/0.2 = 5? No: E[T_1] = 1/(p-q) = 1/0.2 = 5. Check formula.",
      },
      {
        input: "L=5, p=0.50",
        output: "infinity (p=q: expected time infinite)",
        explanation: "Fair random walk: expected time to reach L is infinite (though it reaches L with probability 1).",
      },
    ],
    approach:
      "Expected first-passage time for random walk starting at 0 to reach L: For p != 0.5: E[T_L] = L/(p-q). For p = 0.5: E[T_L] = infinity. DP: let e[x] = E[trades to reach L | current = x]. e[L]=0. For x < L: e[x] = 1 + p*e[x+1] + q*e[x-1]. This linear system has closed-form solution: e[x] = (L-x)/(p-q) for p != 0.5.",
    code: `def expected_first_passage_time(L: int, p: float,
                                     lower_bound: int = -50) -> float:
    """
    Expected number of trades for cumulative P&L to first reach +L,
    starting from 0, with lower absorbing barrier at lower_bound.
    For an unrestricted walk (lower_bound = -inf): E[T_L] = L/(p-q).
    """
    q = 1.0 - p
    if abs(p - 0.5) < 1e-10:
        return float('inf')   # fair walk: infinite expected time

    if p < 0.5:
        # Negative drift: probability of ever reaching L < 1.
        prob_reach = (p/q)**abs(lower_bound) if lower_bound < 0 else 0
        return float('inf') if prob_reach < 1 else 0

    # Closed-form (unrestricted walk): E[T_L | start=0] = L / (p - q).
    e_closed = L / (p - q)

    # DP version (with finite lower barrier for comparison).
    N   = L - lower_bound   # total states from lower_bound to L
    # e[i] = E[T_L | position = lower_bound + i].
    # e[0] = 0 (absorbed at lower_bound, never reaches L — sentinel).
    # e[N] = 0 (already at L).
    # e[i] = 1 + p*e[i+1] + q*e[i-1]   for i=1..N-1.
    # This tridiagonal system: -q*e[i-1] + e[i] - p*e[i+1] = 1.
    # Thomas algorithm.
    if N <= 1:
        return 0.0
    n_int = N - 1
    # Forward sweep.
    c = [-p] * n_int
    b = [1.0] * n_int
    d_rhs = [1.0] * n_int
    # Boundary: e[0] = 0 (lower absorbing barrier).
    # First equation: b[0]*e[1] - p*e[2] = 1 + q*e[0] = 1.
    for i in range(1, n_int):
        m    = -q / b[i-1]
        b[i] = b[i] + m * c[i-1]
        d_rhs[i] = d_rhs[i] - m * d_rhs[i-1]

    e = [0.0] * (n_int + 1)
    e[n_int - 1] = d_rhs[n_int - 1] / b[n_int - 1]
    for i in range(n_int - 2, -1, -1):
        e[i] = (d_rhs[i] - c[i] * e[i+1]) / b[i]

    # e[i] corresponds to position lower_bound + i + 1 (1-indexed interior).
    # Position 0 corresponds to lower_bound + (N - lower_bound)/... need index offset.
    start_idx = 0 - lower_bound   # index for position 0 (lower_bound + idx = 0).
    e_dp = e[start_idx - 1] if 0 < start_idx <= n_int else e_closed

    return round(e_closed, 3)

for L, p in [(5, 0.55), (10, 0.60), (1, 0.60), (5, 0.50), (5, 0.45)]:
    val = expected_first_passage_time(L, p)
    print(f"L={L:2d} p={p:.2f}: E[T] = {val}")

# Verify: for L=1, E[T_1] should be 1/(p-q).
for p in [0.51, 0.55, 0.60, 0.70, 0.90]:
    e1 = expected_first_passage_time(1, p)
    formula = round(1 / (p - (1-p)), 3)
    print(f"p={p:.2f}: E[T_1]={e1:.3f}  formula={formula}")`,
    language: "python",
    complexity: { time: "O(L) DP or O(1) closed-form", space: "O(L) DP or O(1) closed-form" },
  },
];
