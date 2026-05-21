import type { LeetCodeProblem } from "./index";

export const financeProblems20260521B1: LeetCodeProblem[] = [
  {
    id: "fin-0521-b1-stock-span",
    leetcodeNumber: 901,
    title: "Online Stock Span",
    difficulty: "medium",
    topics: ["monotonic-stack", "design"],
    problem:
      "Design a StockSpanner class that collects daily price quotes for a stock and returns the span of the current day's price for each day. The span of the stock's price today is the maximum number of consecutive days (starting from today and going backward) for which the stock price was less than or equal to today's price.",
    examples: [
      {
        input: `spanner = StockSpanner()
spanner.next(100)  # → 1
spanner.next(80)   # → 1
spanner.next(60)   # → 1
spanner.next(70)   # → 2
spanner.next(60)   # → 1
spanner.next(75)   # → 4
spanner.next(85)   # → 6`,
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation:
          "When 85 arrives, we look back: 75 ≤ 85 (span 4 more days via 75's span), 60 ≤ 85, etc. The monotonic stack accumulates spans.",
      },
    ],
    approach:
      "Use a monotonic stack of (price, span) pairs. When a new price arrives, pop all entries with price ≤ current price, accumulating their spans. Push the current price with the accumulated span. The span for the current day = 1 + sum of popped spans. Amortised O(1) per call because each element is pushed and popped at most once.",
    code: `class StockSpanner:
    def __init__(self):
        # Stack of (price, span) — prices are strictly decreasing
        self.stack: list[tuple[int, int]] = []

    def next(self, price: int) -> int:
        span = 1
        # Consume all stack entries with price <= current price
        while self.stack and self.stack[-1][0] <= price:
            _, s = self.stack.pop()
            span += s          # absorb the span of the consumed entry
        self.stack.append((price, span))
        return span


# Example
spanner = StockSpanner()
for p in [100, 80, 60, 70, 60, 75, 85]:
    print(spanner.next(p), end=" ")
print()  # 1 1 1 2 1 4 6`,
    language: "python",
    complexity: { time: "O(1) amortised per call", space: "O(n)" },
  },
  {
    id: "fin-0521-b1-sliding-window-profit",
    leetcodeNumber: 0,
    title: "Best Profit in a Fixed Trade Window",
    difficulty: "medium",
    topics: ["sliding-window", "deque"],
    problem:
      "Given an array prices of length n and an integer k, find the maximum profit of buying at some day i and selling at some day j where j - i <= k (the trade must be completed within k consecutive days). You can only hold one position at a time. Return the maximum profit; return 0 if no profitable trade exists.",
    examples: [
      {
        input: "prices = [2, 9, 3, 1, 8, 4], k = 3",
        output: "7",
        explanation:
          "Buy at day 3 (price=1), sell at day 4 (price=8) within 3-day window. Profit = 7.",
      },
      {
        input: "prices = [10, 8, 6, 4], k = 2",
        output: "0",
        explanation: "Prices are strictly decreasing; no profitable trade exists.",
      },
    ],
    approach:
      "Use a sliding window minimum with a monotonic deque. Maintain a deque of indices where prices are increasing (so deque front is always the minimum in the current window). For each sell day j, the best buy is min(prices[i]) for i in [j-k, j-1]. Process: (1) remove indices outside [j-k, j-1] from front; (2) update max profit as prices[j] - prices[deque.front()]; (3) pop indices from back while prices[back] >= prices[j], then push j. O(n) time.",
    code: `from collections import deque

def max_profit_window(prices: list[int], k: int) -> int:
    if not prices or k == 0:
        return 0

    n      = len(prices)
    dq     = deque()   # monotonic increasing deque of indices (min at front)
    best   = 0

    for j in range(n):
        # Remove indices outside the window [j-k, j-1] (they are buy candidates)
        while dq and dq[0] < j - k:
            dq.popleft()

        # Current profit if we sell at j, buy at the cheapest in window
        if dq:
            best = max(best, prices[j] - prices[dq[0]])

        # Maintain monotonic increasing deque (prices[dq[i]] is non-decreasing)
        while dq and prices[dq[-1]] >= prices[j]:
            dq.pop()
        dq.append(j)

    return best


print(max_profit_window([2, 9, 3, 1, 8, 4], 3))  # 7
print(max_profit_window([10, 8, 6, 4], 2))         # 0
print(max_profit_window([1, 2], 1))                 # 1`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
  },
  {
    id: "fin-0521-b1-dp-portfolio-knapsack",
    leetcodeNumber: 0,
    title: "Binary Portfolio Allocation (0/1 Knapsack)",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack"],
    problem:
      "You have a capital budget C (integer) and n investment opportunities. Each opportunity i has an integer cost c[i] and expected return r[i]. You can invest in each opportunity at most once (binary decision). Find the maximum total expected return subject to the total cost not exceeding C.",
    examples: [
      {
        input: "C = 10, costs = [3, 5, 4, 6], returns = [4, 6, 5, 8]",
        output: "13",
        explanation:
          "Invest in opportunities 0 (cost=3, return=4) and 3 (cost=6, return=8). Total cost=9 ≤ 10. Total return=12. Or 1+2: cost=9, return=11. Best is 0+3=12... wait: try 1+3: cost=11 > 10. Try 0+1: cost=8, return=10. Try 0+2: cost=7, return=9. Try 2+3: cost=10, return=13 ← optimal.",
      },
      {
        input: "C = 5, costs = [1, 2, 3], returns = [1, 3, 4]",
        output: "7",
        explanation: "Invest in opportunities 1 and 2: cost=5, return=7.",
      },
    ],
    approach:
      "Classic 0/1 knapsack DP. dp[w] = max return using exactly budget w. Iterate items; for each item update dp right-to-left to prevent using the same item twice. O(n * C) time and O(C) space.",
    code: `def max_portfolio_return(C: int, costs: list[int], returns: list[int]) -> int:
    n  = len(costs)
    dp = [0] * (C + 1)       # dp[w] = max return with budget w

    for i in range(n):
        c, r = costs[i], returns[i]
        # Iterate backwards to prevent reusing item i
        for w in range(C, c - 1, -1):
            dp[w] = max(dp[w], dp[w - c] + r)

    return dp[C]


print(max_portfolio_return(10, [3, 5, 4, 6], [4, 6, 5, 8]))  # 13
print(max_portfolio_return(5,  [1, 2, 3],    [1, 3, 4]))      # 7

# Reconstruct which investments were selected
def selected_investments(C: int, costs: list[int], returns: list[int]):
    n  = len(costs)
    dp = [[0] * (C + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        c, r = costs[i - 1], returns[i - 1]
        for w in range(C + 1):
            dp[i][w] = dp[i - 1][w]
            if w >= c:
                dp[i][w] = max(dp[i][w], dp[i - 1][w - c] + r)

    # Backtrack
    chosen, w = [], C
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            chosen.append(i - 1)
            w -= costs[i - 1]
    return dp[n][C], chosen[::-1]

val, idx = selected_investments(10, [3, 5, 4, 6], [4, 6, 5, 8])
print(f"Value: {val}, selected: {idx}")  # Value: 13, selected: [2, 3]`,
    language: "python",
    complexity: { time: "O(n × C)", space: "O(C)" },
  },
  {
    id: "fin-0521-b1-rate-limiter-heap",
    leetcodeNumber: 0,
    title: "Order Rate Limiter with Sliding Window",
    difficulty: "medium",
    topics: ["heap", "design", "sliding-window"],
    problem:
      "Design an OrderRateLimiter that enforces a maximum of k orders in any rolling window of duration T seconds. Implement: allow(timestamp) → True if the order at this timestamp is permitted, False if it would breach the rate limit. Timestamps arrive in non-decreasing order.",
    examples: [
      {
        input: `limiter = OrderRateLimiter(k=3, T=10)
limiter.allow(1)   # True  (1 order)
limiter.allow(5)   # True  (2 orders)
limiter.allow(9)   # True  (3 orders)
limiter.allow(10)  # False (all 3 in [1,10] window)
limiter.allow(12)  # True  (only [5,9,10] in [3,12]; t=1 expired)`,
        output: "[True, True, True, False, True]",
        explanation:
          "At t=10: window [1, 10] contains timestamps {1, 5, 9} — 3 orders, adding a 4th would make 4. At t=12: window [3, 12] contains {5, 9, 10} — only 3 orders, so allowed.",
      },
    ],
    approach:
      "Use a min-heap (or deque) to track the timestamps of the last k allowed orders. When a new order arrives at time t: (1) evict all entries with timestamp <= t - T from the heap; (2) if heap size < k, allow the order and push t; (3) otherwise deny. With a heap, eviction is O(log k) per order. With a deque (timestamps arrive sorted), eviction is O(1) amortised.",
    code: `from collections import deque

class OrderRateLimiter:
    def __init__(self, k: int, T: int):
        self.k    = k
        self.T    = T
        self.dq   = deque()    # timestamps of allowed orders (oldest first)

    def allow(self, timestamp: int) -> bool:
        # Evict timestamps that have fallen outside the rolling window
        while self.dq and self.dq[0] <= timestamp - self.T:
            self.dq.popleft()

        if len(self.dq) < self.k:
            self.dq.append(timestamp)
            return True
        return False


# Example
limiter = OrderRateLimiter(k=3, T=10)
for ts in [1, 5, 9, 10, 12]:
    print(f"t={ts}: {limiter.allow(ts)}")`,
    language: "python",
    complexity: { time: "O(1) amortised per call", space: "O(k)" },
  },
  {
    id: "fin-0521-b1-markov-steady-state",
    leetcodeNumber: 0,
    title: "Markov Chain Steady-State Distribution",
    difficulty: "medium",
    topics: ["math", "linear-algebra", "probability"],
    problem:
      "Given a Markov chain transition matrix P (n × n, where P[i][j] is the probability of transitioning from state i to state j), compute the steady-state distribution π such that π @ P = π and sum(π) = 1. In a quant context, P might model regime transitions (bull/bear/sideways market states).",
    examples: [
      {
        input: "P = [[0.9, 0.1], [0.2, 0.8]]",
        output: "[0.667, 0.333]",
        explanation:
          "π[0] = 0.2/(0.1+0.2) = 2/3, π[1] = 0.1/(0.1+0.2) = 1/3. Verify: 0.667*0.9 + 0.333*0.2 ≈ 0.667 = π[0].",
      },
      {
        input: "P = [[0.5, 0.3, 0.2], [0.1, 0.6, 0.3], [0.2, 0.2, 0.6]]",
        output: "[0.217, 0.413, 0.370]",
        explanation:
          "Solve (P^T - I)π = 0 subject to sum(π) = 1.",
      },
    ],
    approach:
      "Solve the linear system (P^T - I)π = 0, sum(π) = 1. Replace the last equation of (P^T - I) with the normalisation constraint. Alternatively, iterate π ← π @ P until convergence (power iteration). Power iteration converges geometrically if P is ergodic.",
    code: `import numpy as np

def steady_state(P: list[list[float]]) -> np.ndarray:
    """Solve pi @ P = pi, sum(pi) = 1 via linear system."""
    A = np.array(P, dtype=float)
    n = len(A)

    # Build (P^T - I) and replace last row with normalisation constraint
    M = (A.T - np.eye(n))    # shape (n, n)
    M[-1, :] = 1.0            # replace last row: pi_1 + ... + pi_n = 1

    b = np.zeros(n)
    b[-1] = 1.0               # RHS for normalisation

    pi = np.linalg.solve(M, b)
    return pi

def steady_state_power(P: list[list[float]], tol: float = 1e-10) -> np.ndarray:
    """Power iteration: pi <- pi @ P until convergence."""
    A  = np.array(P, dtype=float)
    n  = len(A)
    pi = np.ones(n) / n  # uniform start
    for _ in range(10_000):
        new_pi = pi @ A
        if np.max(np.abs(new_pi - pi)) < tol:
            return new_pi
        pi = new_pi
    return pi

P1 = [[0.9, 0.1], [0.2, 0.8]]
print("Linear solve:", steady_state(P1).round(4))    # [0.6667, 0.3333]
print("Power iter:  ", steady_state_power(P1).round(4))

P2 = [[0.5, 0.3, 0.2], [0.1, 0.6, 0.3], [0.2, 0.2, 0.6]]
pi2 = steady_state(P2)
print("3-state steady state:", pi2.round(4))
print("Verify pi @ P = pi:", np.allclose(pi2 @ np.array(P2), pi2))`,
    language: "python",
    complexity: { time: "O(n^3) for solve, O(n^2 * iter) for power", space: "O(n^2)" },
  },
  {
    id: "fin-0521-b1-matrix-exp-compounding",
    leetcodeNumber: 0,
    title: "Compound Growth via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["math", "matrix-exponentiation", "dynamic-programming"],
    problem:
      "A portfolio follows a linear recurrence: value(n) = a * value(n-1) + b * value(n-2), where a and b are constants. Given initial values v0, v1 and n, compute value(n) modulo 10^9+7. In a quant context, this models a two-lag AR process or a structured product with path-dependent compounding.",
    examples: [
      {
        input: "a = 1, b = 1, v0 = 0, v1 = 1, n = 10",
        output: "55",
        explanation: "This is the Fibonacci sequence; F(10) = 55.",
      },
      {
        input: "a = 3, b = -2, v0 = 1, v1 = 2, n = 5",
        output: "22",
        explanation: "v2=4, v3=8, v4=16, v5=32 → 32 mod (10^9+7) = 32. Wait: v2=3*2 + (-2)*1=4, v3=3*4+(-2)*2=8, v4=3*8+(-2)*4=16, v5=3*16+(-2)*8=32.",
      },
    ],
    approach:
      "Express the recurrence as matrix multiplication: [v(n), v(n-1)] = M^(n-1) * [v1, v0] where M = [[a, b], [1, 0]]. Use fast matrix exponentiation (repeated squaring) to compute M^(n-1) in O(log n) multiplications, each O(1) for a 2×2 matrix.",
    code: `MOD = 10 ** 9 + 7

def mat_mul(A: list[list[int]], B: list[list[int]]) -> list[list[int]]:
    """Multiply two 2x2 matrices modulo MOD."""
    return [
        [(A[0][0] * B[0][0] + A[0][1] * B[1][0]) % MOD,
         (A[0][0] * B[0][1] + A[0][1] * B[1][1]) % MOD],
        [(A[1][0] * B[0][0] + A[1][1] * B[1][0]) % MOD,
         (A[1][0] * B[0][1] + A[1][1] * B[1][1]) % MOD],
    ]

def mat_pow(M: list[list[int]], p: int) -> list[list[int]]:
    """Fast matrix exponentiation: M^p in O(log p) multiplications."""
    result = [[1, 0], [0, 1]]  # identity matrix
    while p > 0:
        if p & 1:
            result = mat_mul(result, M)
        M  = mat_mul(M, M)
        p >>= 1
    return result

def recurrence_value(a: int, b: int, v0: int, v1: int, n: int) -> int:
    """Compute v(n) = a*v(n-1) + b*v(n-2) mod MOD using matrix exponentiation."""
    if n == 0:
        return v0 % MOD
    if n == 1:
        return v1 % MOD

    # Transition matrix: [v(n), v(n-1)] = M * [v(n-1), v(n-2)]
    M    = [[a % MOD, b % MOD], [1, 0]]
    Mn   = mat_pow(M, n - 1)
    # [v(n), v(n-1)] = Mn * [v1, v0]
    return (Mn[0][0] * v1 + Mn[0][1] * v0) % MOD


print(recurrence_value(1, 1, 0, 1, 10))  # 55 (Fibonacci)
print(recurrence_value(3, -2, 1, 2, 5))  # 32`,
    language: "python",
    complexity: { time: "O(log n)", space: "O(1)" },
  },
  {
    id: "fin-0521-b1-vwap-design",
    leetcodeNumber: 0,
    title: "Online VWAP Calculator",
    difficulty: "easy",
    topics: ["design", "math"],
    problem:
      "Design a VWAP (Volume-Weighted Average Price) calculator. Implement: add_trade(price, volume) — record a new trade execution; vwap() — return the running VWAP (sum of price*volume / sum of volume) up to the current time. Handle the edge case where no trades have been recorded (return 0.0).",
    examples: [
      {
        input: `calc = VWAPCalculator()
calc.add_trade(100.0, 500)
calc.add_trade(101.0, 1000)
calc.add_trade(99.0, 500)
print(calc.vwap())`,
        output: "100.5",
        explanation:
          "VWAP = (100*500 + 101*1000 + 99*500) / (500+1000+500) = (50000+101000+49500)/2000 = 200500/2000 = 100.25. Wait: 100*500=50000, 101*1000=101000, 99*500=49500. Sum=200500. Volume=2000. VWAP=200500/2000=100.25.",
      },
    ],
    approach:
      "Maintain two running totals: total_dollar_volume (sum of price*volume) and total_volume (sum of volume). VWAP = total_dollar_volume / total_volume. Both updates are O(1) and the computation is O(1). No need to store individual trades.",
    code: `class VWAPCalculator:
    def __init__(self):
        self.total_dollar_volume = 0.0   # sum of price * volume
        self.total_volume        = 0.0   # sum of volumes

    def add_trade(self, price: float, volume: float) -> None:
        self.total_dollar_volume += price * volume
        self.total_volume        += volume

    def vwap(self) -> float:
        if self.total_volume == 0:
            return 0.0
        return self.total_dollar_volume / self.total_volume


# Example
calc = VWAPCalculator()
calc.add_trade(100.0, 500)
calc.add_trade(101.0, 1000)
calc.add_trade(99.0, 500)
print(f"VWAP: {calc.vwap():.4f}")  # 100.25

# Intraday VWAP reset pattern (reset at session start)
class IntradayVWAP(VWAPCalculator):
    def reset(self):
        """Call at start of each trading session."""
        self.total_dollar_volume = 0.0
        self.total_volume        = 0.0`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(1)" },
  },
  {
    id: "fin-0521-b1-max-drawdown-dp",
    leetcodeNumber: 0,
    title: "Maximum Drawdown with Recovery Period",
    difficulty: "medium",
    topics: ["dynamic-programming", "array"],
    problem:
      "Given an array equity[] representing the daily equity of a strategy, find the maximum drawdown and the recovery period. The drawdown from peak to trough is max(0, peak - trough) where peak is any prior value. The recovery period is the number of days from the trough back to when equity first exceeds the prior peak. Return (max_drawdown, peak_day, trough_day, recovery_days). If equity never recovers, recovery_days = -1.",
    examples: [
      {
        input: "equity = [100, 110, 95, 105, 115, 90, 80, 100, 120]",
        output: "max_drawdown=35, peak_day=4, trough_day=6, recovery_days=2",
        explanation:
          "Peak at day 4 (equity=115). Trough at day 6 (equity=80). Drawdown = 35. Recovery: equity first exceeds 115 at day 8 (equity=120). Days from trough to recovery: 8 - 6 = 2.",
      },
    ],
    approach:
      "Two-pass: Pass 1 — track running peak and compute drawdown at each day, recording the worst (peak_day, trough_day). Pass 2 — starting from trough_day, scan forward for the first day where equity > equity[peak_day]. O(n) time.",
    code: `def max_drawdown_with_recovery(equity: list[float]):
    n = len(equity)
    if n == 0:
        return 0.0, -1, -1, -1

    # Pass 1: find peak and trough of maximum drawdown
    peak_val   = equity[0]
    peak_day   = 0
    best_dd    = 0.0
    best_peak  = 0
    best_trough = 0
    trough_val = equity[0]

    curr_peak_day = 0
    for i in range(1, n):
        if equity[i] > peak_val:
            peak_val      = equity[i]
            curr_peak_day = i

        dd = peak_val - equity[i]
        if dd > best_dd:
            best_dd      = dd
            best_peak    = curr_peak_day
            best_trough  = i
            trough_val   = equity[i]

    if best_dd == 0:
        return 0.0, 0, 0, 0

    # Pass 2: find recovery from trough
    peak_level = equity[best_peak]
    recovery_days = -1
    for j in range(best_trough + 1, n):
        if equity[j] >= peak_level:
            recovery_days = j - best_trough
            break

    return best_dd, best_peak, best_trough, recovery_days


eq = [100, 110, 95, 105, 115, 90, 80, 100, 120]
dd, pk, tr, rec = max_drawdown_with_recovery(eq)
print(f"Max drawdown: {dd}")
print(f"Peak day: {pk} (equity={eq[pk]})")
print(f"Trough day: {tr} (equity={eq[tr]})")
print(f"Recovery days: {rec}")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-0521-b1-bit-risk-flags",
    leetcodeNumber: 0,
    title: "Bit Manipulation for Risk Flag Aggregation",
    difficulty: "easy",
    topics: ["bit-manipulation", "design"],
    problem:
      "You have 32 risk checks numbered 0 to 31. Each position in a portfolio is associated with a bitmask of which risk checks it triggers. Implement: (1) add_position(mask) — add a position's risk flags to the aggregate; (2) check_clean(risk_id) — return True if risk check risk_id is not triggered by any position; (3) count_triggered() — return the number of distinct risk checks that are triggered across all positions.",
    examples: [
      {
        input: `agg = RiskAggregator()
agg.add_position(0b0101)   # triggers checks 0 and 2
agg.add_position(0b0110)   # triggers checks 1 and 2
print(agg.count_triggered())  # 3 (checks 0, 1, 2)
print(agg.check_clean(3))     # True (check 3 not triggered)
print(agg.check_clean(2))     # False (check 2 is triggered)`,
        output: "3, True, False",
        explanation:
          "Aggregate = 0101 | 0110 = 0111. 3 bits set. Bit 3 is 0 (clean). Bit 2 is 1 (triggered).",
      },
    ],
    approach:
      "Maintain an integer aggregate_mask. add_position: aggregate |= mask (OR accumulates). check_clean: return (aggregate >> risk_id) & 1 == 0. count_triggered: bin(aggregate).count('1') or use bit_count() in Python 3.10+. All operations O(1).",
    code: `class RiskAggregator:
    def __init__(self):
        self.aggregate: int = 0   # bitwise OR of all position masks

    def add_position(self, mask: int) -> None:
        """Set all risk flags that this position triggers."""
        self.aggregate |= mask

    def remove_position(self, mask: int) -> None:
        """Remove a position's flags (only safe if you track individual masks)."""
        # In practice, rebuild from scratch; this is a simplification.
        self.aggregate &= ~mask

    def check_clean(self, risk_id: int) -> bool:
        """Return True if risk check risk_id is NOT triggered."""
        return (self.aggregate >> risk_id) & 1 == 0

    def count_triggered(self) -> int:
        """Count distinct risk checks triggered across all positions."""
        return bin(self.aggregate).count('1')  # or self.aggregate.bit_count() in 3.10+

    def triggered_ids(self) -> list[int]:
        """Return list of all triggered risk check IDs."""
        mask = self.aggregate
        ids  = []
        while mask:
            lsb = mask & (-mask)          # isolate lowest set bit
            ids.append(lsb.bit_length() - 1)
            mask &= mask - 1              # clear lowest set bit
        return ids


agg = RiskAggregator()
agg.add_position(0b0101)
agg.add_position(0b0110)
print(f"Triggered count: {agg.count_triggered()}")   # 3
print(f"Check 3 clean:   {agg.check_clean(3)}")      # True
print(f"Check 2 clean:   {agg.check_clean(2)}")      # False
print(f"Triggered IDs:   {agg.triggered_ids()}")     # [0, 1, 2]`,
    language: "python",
    complexity: { time: "O(1) per operation, O(k) for triggered_ids", space: "O(1)" },
  },
  {
    id: "fin-0521-b1-hegding-graph",
    leetcodeNumber: 0,
    title: "Minimum Hedge Cost via Shortest Path (Dijkstra)",
    difficulty: "hard",
    topics: ["graphs", "dijkstra", "shortest-path"],
    problem:
      "A risk manager needs to hedge a portfolio's exposure to currency X using a sequence of FX swaps. There are n currencies (0 to n-1) and m available FX swaps, each defined by (from_currency, to_currency, spread_bps). The total hedging cost is the sum of spread_bps along the conversion path. Find the minimum total spread cost to convert currency 0 to currency n-1, or return -1 if no path exists.",
    examples: [
      {
        input: "n=4, swaps=[(0,1,5),(0,2,10),(1,3,2),(2,3,3),(1,2,1)]",
        output: "7",
        explanation:
          "Path 0→1→2→3: cost 5+1+3=9. Path 0→1→3: cost 5+2=7 ← optimal.",
      },
      {
        input: "n=3, swaps=[(0,1,10),(1,0,5)]",
        output: "-1",
        explanation: "No path from 0 to 2.",
      },
    ],
    approach:
      "Model currencies as nodes and swaps as directed weighted edges (spread_bps). Run Dijkstra from currency 0. The minimum cost to reach currency n-1 is the answer. O((n + m) log n) with a min-heap.",
    code: `import heapq

def min_hedge_cost(n: int, swaps: list[tuple[int, int, int]]) -> int:
    # Build adjacency list
    graph: list[list[tuple[int, int]]] = [[] for _ in range(n)]
    for u, v, w in swaps:
        graph[u].append((v, w))   # directed: u -> v at cost w

    # Dijkstra from node 0
    dist = [float('inf')] * n
    dist[0] = 0
    heap = [(0, 0)]   # (cost, node)

    while heap:
        cost, u = heapq.heappop(heap)
        if cost > dist[u]:
            continue   # stale entry
        for v, w in graph[u]:
            new_cost = cost + w
            if new_cost < dist[v]:
                dist[v] = new_cost
                heapq.heappush(heap, (new_cost, v))

    return dist[n - 1] if dist[n - 1] != float('inf') else -1


print(min_hedge_cost(4, [(0,1,5),(0,2,10),(1,3,2),(2,3,3),(1,2,1)]))  # 7
print(min_hedge_cost(3, [(0,1,10),(1,0,5)]))                            # -1`,
    language: "python",
    complexity: { time: "O((n + m) log n)", space: "O(n + m)" },
  },
];
