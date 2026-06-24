import type { LeetCodeProblem } from "./index";

export const financeProblems20260624B1: LeetCodeProblem[] = [
  {
    id: "fin-20260624-b1-matrix-expo-markov",
    title: "Markov Chain Steady State via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["matrix-exponentiation", "markov-chain", "linear-algebra"],
    problem: `A market has \`n\` regimes (e.g., bull, bear, sideways). You are given an \`n x n\` transition matrix \`P\` where \`P[i][j]\` is the probability of moving from regime \`i\` to regime \`j\`.

Given a starting probability vector \`v0\` and an integer \`k\`, compute the probability distribution after exactly \`k\` transitions using matrix exponentiation in O(n³ log k).

Also return the steady-state vector (left eigenvector of eigenvalue 1) computed by repeated squaring until convergence.

**Example context:** A quant needs to know: if the market is in the bull regime today, what is the probability of each regime after 1000 trading days?`,
    examples: [
      {
        input: "P = [[0.7, 0.2, 0.1], [0.3, 0.5, 0.2], [0.2, 0.3, 0.5]], v0 = [1, 0, 0], k = 3",
        output: "v_k ≈ [0.503, 0.308, 0.189]",
        explanation: "Multiply v0 by P^3. Each row of P^k gives the k-step distribution from that starting state.",
      },
      {
        input: "P = [[0.9, 0.1], [0.2, 0.8]], v0 = [1, 0], k = 1000",
        output: "v_k ≈ [0.667, 0.333] (steady state)",
        explanation: "Steady state: solve π P = π with sum(π) = 1. Here π = [2/3, 1/3].",
      },
    ],
    constraints: [
      "2 <= n <= 20",
      "1 <= k <= 10^18",
      "Each row of P sums to 1.0",
      "P[i][j] >= 0",
    ],
    approach: `Matrix exponentiation in O(n³ log k): represent P as a numpy array and implement fast matrix power via repeated squaring. The k-step distribution is v0 @ matrix_power(P, k). Steady state: apply matrix_power with large k (e.g., 10^9) or solve (P.T - I) x = 0 with the constraint sum(x)=1 via lstsq.`,
    code: `import numpy as np
from numpy.linalg import lstsq

def mat_mul(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    return A @ B

def mat_pow(M: np.ndarray, k: int) -> np.ndarray:
    """Fast matrix power via binary exponentiation: O(n^3 log k)."""
    n = M.shape[0]
    result = np.eye(n)          # identity
    base = M.copy()
    while k > 0:
        if k & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        k >>= 1
    return result

def markov_after_k(P: list[list[float]], v0: list[float], k: int) -> np.ndarray:
    Pm = np.array(P, dtype=float)
    v  = np.array(v0, dtype=float)
    Pk = mat_pow(Pm, k)
    return v @ Pk          # row-vector times matrix

def steady_state(P: list[list[float]]) -> np.ndarray:
    """Solve pi @ P = pi, sum(pi) = 1 via least squares."""
    Pm = np.array(P, dtype=float)
    n  = Pm.shape[0]
    # (P^T - I) pi = 0 with normalisation row
    A = np.vstack([(Pm.T - np.eye(n)), np.ones((1, n))])
    b = np.zeros(n + 1)
    b[-1] = 1.0
    pi, _, _, _ = lstsq(A, b, rcond=None)
    return np.clip(pi, 0, None) / pi.sum()

# ---- demo ----
P  = [[0.7, 0.2, 0.1],
      [0.3, 0.5, 0.2],
      [0.2, 0.3, 0.5]]
v0 = [1.0, 0.0, 0.0]

print("After k=3:", markov_after_k(P, v0, 3).round(4))
print("Steady state:", steady_state(P).round(4))`,
    language: "python",
    complexity: { time: "O(n³ log k)", space: "O(n²)" },
  },
  {
    id: "fin-20260624-b1-resistance-stack",
    title: "Resistance Level Breakout Count (Monotonic Stack)",
    difficulty: "medium",
    topics: ["monotonic-stack", "technical-analysis"],
    problem: `Given a list of daily closing prices \`prices\`, a **resistance level** for day \`i\` is the nearest previous price strictly greater than \`prices[i]\`.

For each day, return the **distance** (in days) back to the nearest resistance level, or \`0\` if no higher price exists in the history.

This is the classic "stock span" / "next greater element backward" pattern used in technical analysis to gauge how many consecutive days the price was below a prior peak.`,
    examples: [
      {
        input: "prices = [100, 80, 60, 70, 60, 75, 85]",
        output: "[0, 1, 2, 1, 4, 1, 6]",
        explanation: "Day 2 (price 60): nearest higher is day 1 (80), distance 1. Day 3 (price 70): nearest higher is day 1 (80), distance 2. Day 5 (price 75): nearest higher is day 1 (80), distance 4.",
      },
      {
        input: "prices = [30, 40, 50]",
        output: "[0, 0, 0]",
        explanation: "Each price is higher than all previous — no resistance above.",
      },
    ],
    constraints: [
      "1 <= len(prices) <= 10^5",
      "0 < prices[i] <= 10^6",
    ],
    approach: `Monotonic stack storing (price, span). For each price pop all stack entries with price <= current (adding their spans to the current span). The current span is the distance to the nearest higher price. O(N) amortised since each element is pushed/popped once.`,
    code: `def resistance_spans(prices: list[int]) -> list[int]:
    """
    For each day, return how many consecutive days back (including today)
    the price was <= current price — i.e., 'distance to resistance'.
    Classic stock-span monotonic-stack pattern.
    """
    spans: list[int] = []
    # stack of (price, span_so_far)
    stack: list[tuple[int, int]] = []

    for price in prices:
        span = 1
        # Pop all entries with price <= current (they are under resistance)
        while stack and stack[-1][0] <= price:
            span += stack.pop()[1]
        stack.append((price, span))
        spans.append(span)

    return spans

# Breakout detection: day i breaks out if span == i+1 (all-time high)
def breakout_days(prices: list[int]) -> list[int]:
    spans = resistance_spans(prices)
    return [i for i, s in enumerate(spans) if s == i + 1]

# ---- demo ----
prices = [100, 80, 60, 70, 60, 75, 85]
print("Spans:", resistance_spans(prices))
print("Breakout days (ATH):", breakout_days(prices))`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
  {
    id: "fin-20260624-b1-stock-cooldown",
    title: "Maximum Profit with Mandatory Cooldown (LC 309)",
    difficulty: "medium",
    topics: ["dynamic-programming", "state-machine"],
    problem: `You are given an array \`prices\` where \`prices[i]\` is the stock price on day \`i\`. You may buy and sell (one share at a time), but after selling you must skip exactly **one** cooldown day before buying again.

Find the maximum profit. You may not hold more than one share at a time.

**Quant framing:** This models a strategy where after closing a long position, the trader must wait one session before re-entering (e.g., settlement T+1 constraint).`,
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation: "Buy day 0, sell day 1 (profit 1), cooldown day 2, buy day 3, sell day 4 (profit 2). Total = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
        explanation: "Only one price — no transaction possible.",
      },
    ],
    constraints: [
      "1 <= len(prices) <= 5000",
      "0 <= prices[i] <= 1000",
    ],
    approach: `Three states per day: HOLD (own stock), SOLD (just sold, must cooldown), REST (available to buy). Transitions: HOLD[i] = max(HOLD[i-1], REST[i-1] - prices[i]); SOLD[i] = HOLD[i-1] + prices[i]; REST[i] = max(REST[i-1], SOLD[i-1]). Answer = max(SOLD[-1], REST[-1]). O(N) time, O(1) space.`,
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    """
    State-machine DP with three states:
      hold : currently holding a share
      sold : just sold today (cooldown tomorrow)
      rest : not holding, not in cooldown (free to buy)
    """
    if not prices:
        return 0

    hold = -prices[0]   # bought on day 0
    sold = 0            # impossible on day 0 but initialise to 0
    rest = 0            # didn't buy

    for price in prices[1:]:
        prev_hold, prev_sold, prev_rest = hold, sold, rest

        hold = max(prev_hold, prev_rest - price)   # keep holding or buy from rest
        sold = prev_hold + price                    # sell today
        rest = max(prev_rest, prev_sold)            # wait out cooldown or stay resting

    return max(sold, rest)

# ---- demo ----
print(max_profit_cooldown([1, 2, 3, 0, 2]))   # 3
print(max_profit_cooldown([1]))                # 0
print(max_profit_cooldown([6, 1, 3, 2, 4, 7]))# 6: buy@1,sell@3,rest,buy@2,sell@7`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260624-b1-k-transactions",
    title: "Maximum Profit with at Most K Transactions (LC 188)",
    difficulty: "hard",
    topics: ["dynamic-programming", "trading-strategy"],
    problem: `Given an integer \`k\` and an array \`prices\`, find the maximum profit from at most \`k\` buy-sell transactions (buy before sell, one share at a time, no overlapping).

**Quant framing:** A portfolio manager is constrained by compliance to at most \`k\` round-trips per month. Maximise P&L.`,
    examples: [
      {
        input: "k = 2, prices = [3, 2, 6, 5, 0, 3]",
        output: "7",
        explanation: "Buy@2, sell@6 (profit 4), buy@0, sell@3 (profit 3). Total = 7.",
      },
      {
        input: "k = 1, prices = [1, 2, 3, 4, 5]",
        output: "4",
        explanation: "Best single transaction: buy@1, sell@5.",
      },
    ],
    constraints: [
      "0 <= k <= 1000",
      "0 <= len(prices) <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach: `If k >= N/2, unlimited transactions (greedy sum of positive diffs). Otherwise DP: dp[t][d] = max profit using at most t transactions up to day d. Transition: dp[t][d] = max(dp[t][d-1], prices[d] + max_{j<d}(dp[t-1][j] - prices[j])). Cache the running max of (dp[t-1][j] - prices[j]) to get O(kN) total.`,
    code: `def max_profit_k_transactions(k: int, prices: list[int]) -> int:
    n = len(prices)
    if n < 2 or k == 0:
        return 0

    # If k is large enough, unlimited transactions
    if k >= n // 2:
        return sum(max(prices[i] - prices[i - 1], 0) for i in range(1, n))

    # dp[t] = max profit using at most t transactions on day d
    # Rolling over days; for each t track best_buy = max(dp[t-1][j] - prices[j])
    INF = float("-inf")
    # prev[t] = dp[t-1][d] (previous transaction count row)
    prev = [0] * (k + 1)
    curr = [0] * (k + 1)

    for d in range(n):
        # best_buy[t] = max over j<=d of (prev[t] - prices[j])
        # We update left to right within the day loop
        best_buy = [INF] * (k + 1)
        for t in range(1, k + 1):
            # best_buy from previous day's prev values, updated inline
            if d == 0:
                best_buy[t] = prev[t - 1] - prices[0]
            else:
                best_buy[t] = max(best_buy[t], prev[t - 1] - prices[d])

        for t in range(1, k + 1):
            no_sell  = curr[t - 1] if d > 0 else 0   # carry forward
            sell_now = (best_buy[t] + prices[d]) if best_buy[t] != INF else 0
            curr[t]  = max(prev[t], sell_now)

        prev = curr[:]

    return prev[k]

# Cleaner O(kN) implementation with explicit best_buy tracking
def max_profit_k_clean(k: int, prices: list[int]) -> int:
    n = len(prices)
    if n < 2 or k == 0:
        return 0
    if k >= n // 2:
        return sum(max(prices[i] - prices[i-1], 0) for i in range(1, n))

    # buy[t] = best (profit_after_t-1_txns - buy_price) seen so far
    buy  = [-prices[0]] * (k + 1)
    sell = [0]           * (k + 1)

    for price in prices[1:]:
        for t in range(k, 0, -1):          # iterate t high→low to avoid reuse
            sell[t] = max(sell[t], buy[t] + price)
            buy[t]  = max(buy[t], sell[t - 1] - price)

    return sell[k]

# ---- demo ----
print(max_profit_k_clean(2, [3, 2, 6, 5, 0, 3]))  # 7
print(max_profit_k_clean(1, [1, 2, 3, 4, 5]))      # 4`,
    language: "python",
    complexity: { time: "O(kN)", space: "O(k)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260624-b1-kth-largest-pnl",
    title: "K-th Largest Trade P&L (Heap / Quickselect)",
    difficulty: "medium",
    topics: ["heap", "quickselect", "order-statistics"],
    problem: `A trading desk executed \`n\` trades. Each trade has a P&L value (positive = profit, negative = loss). Given an integer \`k\`, find the **k-th largest** P&L without fully sorting the list.

**Follow-up:** Stream \`n\` trades online and maintain the k-th largest at all times using a min-heap of size \`k\`. Return the current k-th largest after each new trade.`,
    examples: [
      {
        input: "pnls = [3000, -500, 12000, 800, -2000, 4500], k = 2",
        output: "4500",
        explanation: "Sorted descending: [12000, 4500, 3000, 800, -500, -2000]. 2nd largest = 4500.",
      },
      {
        input: "Stream: k=3, trades come in as [4, 5, 8, 2]",
        output: "[-inf, -inf, 4, 4]",
        explanation: "Need 3 trades before a valid answer. After 3rd trade (8): heap = [4,5,8], min = 4.",
      },
    ],
    constraints: [
      "1 <= k <= len(pnls) <= 10^5",
      "-10^8 <= pnls[i] <= 10^8",
    ],
    approach: `Offline k-th largest: heapq.nlargest(k, pnls)[-1] in O(N log k), or use nth_element quickselect in O(N) average. Streaming: maintain a min-heap of size k. For each new trade: push; if heap size > k, pop the min. Heap[0] is the k-th largest. O(N log k) overall.`,
    code: `import heapq
import random

# ---- Offline: O(N log k) ----
def kth_largest_offline(pnls: list[float], k: int) -> float:
    return heapq.nlargest(k, pnls)[-1]

# ---- Quickselect: O(N) average ----
def kth_largest_quickselect(pnls: list[float], k: int) -> float:
    arr = pnls[:]
    target = len(arr) - k      # k-th largest = (n-k)-th smallest

    def select(lo: int, hi: int) -> float:
        if lo == hi:
            return arr[lo]
        pivot_idx = random.randint(lo, hi)
        arr[pivot_idx], arr[hi] = arr[hi], arr[pivot_idx]
        pivot = arr[hi]
        store = lo
        for i in range(lo, hi):
            if arr[i] <= pivot:
                arr[i], arr[store] = arr[store], arr[i]
                store += 1
        arr[store], arr[hi] = arr[hi], arr[store]
        if store == target:
            return arr[store]
        elif store < target:
            return select(store + 1, hi)
        else:
            return select(lo, store - 1)

    return select(0, len(arr) - 1)

# ---- Streaming: min-heap of size k ----
class KthLargestStream:
    def __init__(self, k: int) -> None:
        self.k = k
        self.heap: list[float] = []    # min-heap, size <= k

    def add(self, pnl: float) -> float:
        heapq.heappush(self.heap, pnl)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)   # drop smallest
        if len(self.heap) == self.k:
            return self.heap[0]        # min of top-k = k-th largest
        return float("-inf")           # not enough data yet

# ---- demo ----
pnls = [3000, -500, 12000, 800, -2000, 4500]
print("Offline:", kth_largest_offline(pnls, 2))       # 4500
print("Quickselect:", kth_largest_quickselect(pnls, 2))

stream = KthLargestStream(k=3)
for v in [4, 5, 8, 2]:
    print(f"add({v}) -> {stream.add(v)}")`,
    language: "python",
    complexity: { time: "O(N log k) heap / O(N) quickselect", space: "O(k)" },
  },
  {
    id: "fin-20260624-b1-floyd-warshall-arb",
    title: "FX Arbitrage Detection via Floyd-Warshall (All-Pairs)",
    difficulty: "hard",
    topics: ["floyd-warshall", "graph", "arbitrage"],
    problem: `You have \`n\` currencies and an \`n x n\` exchange rate matrix \`rates\` where \`rates[i][j]\` is how many units of currency \`j\` you get for 1 unit of currency \`i\`.

Determine if a **risk-free arbitrage cycle** exists: a sequence of trades starting and ending at the same currency that yields more than 1.0 of that currency.

If an arbitrage path exists, return one such cycle. Otherwise return an empty list.

**Note:** Unlike Bellman-Ford which finds the shortest path from a single source, Floyd-Warshall gives all-pairs shortest paths in O(n³) and immediately reveals negative-weight cycles (after log-transforming the rates).`,
    examples: [
      {
        input: "rates = [[1, 0.5, 2], [3, 1, 4], [0.4, 0.25, 1]]",
        output: "Arbitrage exists: [0, 1, 0]",
        explanation: "USD→EUR at 0.5, EUR→USD at 3. Convert 1 USD → 0.5 EUR → 1.5 USD. 50% risk-free gain.",
      },
      {
        input: "rates = [[1, 2], [0.5, 1]]",
        output: "No arbitrage",
        explanation: "USD→EUR→USD returns exactly 1.0.",
      },
    ],
    constraints: [
      "2 <= n <= 20",
      "rates[i][i] == 1.0",
      "rates[i][j] > 0",
    ],
    approach: `Log-transform: w[i][j] = -log(rates[i][j]). Arbitrage ↔ negative-weight cycle in this graph. Run Floyd-Warshall: dist[i][j] = min path from i to j. If any dist[i][i] < 0 after relaxation, a negative cycle (arbitrage) is reachable from i. Reconstruct the path via the predecessor matrix.`,
    code: `import math

def fx_arbitrage_floyd_warshall(
    rates: list[list[float]],
) -> list[int]:
    n = len(rates)
    INF = math.inf

    # Log-transform: negative weight = arbitrage opportunity
    dist = [[-math.log(rates[i][j]) for j in range(n)] for i in range(n)]
    pred = [[j if rates[i][j] > 0 else -1 for j in range(n)] for i in range(n)]

    # Floyd-Warshall relaxation
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
                    pred[i][j] = pred[i][k]

    # Detect negative cycle: dist[i][i] < 0
    arb_source = -1
    for i in range(n):
        if dist[i][i] < -1e-9:
            arb_source = i
            break

    if arb_source == -1:
        return []

    # Reconstruct cycle starting and ending at arb_source
    cycle: list[int] = [arb_source]
    visited = set()
    cur = arb_source
    while True:
        nxt = pred[cur][arb_source]
        if nxt in visited or nxt == arb_source:
            cycle.append(arb_source)
            break
        cycle.append(nxt)
        visited.add(nxt)
        cur = nxt

    return cycle

# ---- demo ----
rates = [[1.0, 0.5, 2.0],
         [3.0, 1.0, 4.0],
         [0.4, 0.25, 1.0]]
print("Arbitrage cycle:", fx_arbitrage_floyd_warshall(rates))

# No-arb example
no_arb = [[1.0, 2.0], [0.5, 1.0]]
print("No-arb:", fx_arbitrage_floyd_warshall(no_arb))`,
    language: "python",
    complexity: { time: "O(n³)", space: "O(n²)" },
  },
  {
    id: "fin-20260624-b1-max-drawdown",
    title: "Maximum Drawdown and Drawdown Duration",
    difficulty: "medium",
    topics: ["prefix-max", "array", "risk-metrics"],
    problem: `The **maximum drawdown** of a price series is the largest peak-to-trough decline:

  MDD = max over all t2 > t1 of (prices[t1] - prices[t2]) / prices[t1]

Given a list of portfolio NAV values \`nav\`, return:
1. The maximum drawdown as a fraction (0 to 1).
2. The peak index \`t1\` and trough index \`t2\` that achieve it.
3. The **drawdown duration**: number of days from peak to the next recovery above the peak (or end of series if no recovery).

This is a core risk metric in every fund's monthly tear sheet.`,
    examples: [
      {
        input: "nav = [100, 110, 105, 95, 80, 90, 115]",
        output: "MDD=0.2727, peak=1, trough=4, duration=5",
        explanation: "Peak 110 on day 1, trough 80 on day 4. MDD=(110-80)/110≈0.2727. Recovery at day 6 (115>110), duration = 6-1 = 5.",
      },
      {
        input: "nav = [100, 90, 80, 70]",
        output: "MDD=0.30, peak=0, trough=3, duration=4 (no recovery)",
        explanation: "Series never recovers; duration counted to end of series.",
      },
    ],
    constraints: [
      "1 <= len(nav) <= 10^6",
      "nav[i] > 0",
    ],
    approach: `Single pass O(N): track running peak and its index. For each day compute drawdown vs running peak; update MDD if larger. After finding peak/trough, scan forward for next recovery to compute duration.`,
    code: `def max_drawdown(nav: list[float]) -> dict:
    if not nav:
        return {"mdd": 0.0, "peak_idx": 0, "trough_idx": 0, "duration": 0}

    peak_val  = nav[0]
    peak_idx  = 0
    mdd       = 0.0
    best_peak = 0
    best_trough = 0
    cur_peak_idx = 0

    for i in range(1, len(nav)):
        if nav[i] > peak_val:
            peak_val    = nav[i]
            peak_idx    = i
            cur_peak_idx = i
        else:
            dd = (peak_val - nav[i]) / peak_val
            if dd > mdd:
                mdd         = dd
                best_peak   = cur_peak_idx
                best_trough = i

    # Compute drawdown duration: days from best_peak to next recovery
    recovery_val = nav[best_peak]
    duration     = len(nav) - best_peak    # default: no recovery
    for i in range(best_trough + 1, len(nav)):
        if nav[i] >= recovery_val:
            duration = i - best_peak
            break

    return {
        "mdd":       round(mdd, 6),
        "peak_idx":  best_peak,
        "trough_idx": best_trough,
        "duration":  duration,
    }

# ---- demo ----
nav = [100, 110, 105, 95, 80, 90, 115]
result = max_drawdown(nav)
print(f"MDD={result['mdd']:.4f}, peak={result['peak_idx']}, "
      f"trough={result['trough_idx']}, duration={result['duration']}")

nav2 = [100, 90, 80, 70]
print(max_drawdown(nav2))`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260624-b1-portfolio-count-combinations",
    title: "Count Distinct Portfolio Returns (Combinatorics + DP)",
    difficulty: "medium",
    topics: ["dynamic-programming", "combinatorics", "portfolio-theory"],
    problem: `You have \`n\` assets, each with an integer expected return \`r[i]\` (in basis points). You can include each asset **at most once** in a portfolio.

Count the number of distinct subset return totals achievable when choosing **exactly \`k\`** assets.

**Quant framing:** A fund must hold exactly \`k\` positions; the PM wants to know how many distinct P&L outcomes are possible before simulation.`,
    examples: [
      {
        input: "returns = [1, 2, 3, 4], k = 2",
        output: "5",
        explanation: "Pairs: {1,2}=3, {1,3}=4, {1,4}=5, {2,3}=5, {2,4}=6, {3,4}=7. Distinct sums: {3,4,5,6,7} = 5.",
      },
      {
        input: "returns = [1, 1, 1], k = 2",
        output: "1",
        explanation: "All pairs sum to 2 — only 1 distinct outcome.",
      },
    ],
    constraints: [
      "1 <= k <= n <= 40",
      "0 <= returns[i] <= 1000",
    ],
    approach: `DP with sets: dp[j] = set of achievable sums using exactly j assets chosen so far. Process each asset and update dp right-to-left (0/1 knapsack style with set union). Final answer is len(dp[k]). Time O(n * k * S) where S is the number of distinct sums (bounded by n * max_r).`,
    code: `def count_distinct_returns(returns: list[int], k: int) -> int:
    n = len(returns)
    # dp[j] = set of distinct sums using exactly j assets
    dp: list[set[int]] = [set() for _ in range(k + 1)]
    dp[0].add(0)

    for r in returns:
        # Iterate j high to low to avoid reusing same asset
        for j in range(min(k, n), 0, -1):
            # Add r to each sum in dp[j-1] and merge into dp[j]
            dp[j] |= {s + r for s in dp[j - 1]}

    return len(dp[k])

# Bonus: enumerate all distinct (sum, count) pairs with their multiplicity
def portfolio_return_distribution(
    returns: list[int], k: int
) -> dict[int, int]:
    """Returns dict[sum -> count of subsets achieving that sum]."""
    from collections import defaultdict

    # dp[j] = Counter of sums with exactly j assets
    from collections import Counter
    dp: list[Counter] = [Counter() for _ in range(k + 1)]
    dp[0][0] = 1

    for r in returns:
        for j in range(min(k, len(returns)), 0, -1):
            for s, cnt in list(dp[j - 1].items()):
                dp[j][s + r] += cnt

    return dict(dp[k])

# ---- demo ----
print("Distinct sums:", count_distinct_returns([1, 2, 3, 4], 2))  # 5
print("Distinct sums:", count_distinct_returns([1, 1, 1], 2))     # 1

dist = portfolio_return_distribution([1, 2, 3, 4], 2)
print("Distribution:", sorted(dist.items()))`,
    language: "python",
    complexity: { time: "O(n · k · S)", space: "O(k · S)" },
  },
  {
    id: "fin-20260624-b1-fixed-window-rate-limiter",
    title: "Fixed-Window Rate Limiter for Order Flow",
    difficulty: "medium",
    topics: ["design", "sliding-window", "rate-limiting"],
    problem: `Design a **fixed-window rate limiter** for an order management system. The limiter allows at most \`max_orders\` orders per \`window_seconds\`-second window (windows are aligned to multiples of \`window_seconds\` from epoch 0, not rolling).

Implement:
- \`allow(timestamp: int) -> bool\`: returns True if the order at this timestamp is allowed, False if rate-limited.

**Follow-up:** Implement a **sliding-window log** variant that is more accurate but uses more memory.`,
    examples: [
      {
        input: "max_orders=3, window=10. Calls: allow(1), allow(5), allow(9), allow(10), allow(11)",
        output: "True, True, True, True, True",
        explanation: "Window [0,9]: 3 orders (all allowed). Window [10,19]: new window resets counter — 2 more orders allowed.",
      },
      {
        input: "max_orders=2, window=10. Calls: allow(1), allow(2), allow(3)",
        output: "True, True, False",
        explanation: "Window [0,9] already has 2 orders; 3rd is rejected.",
      },
    ],
    constraints: [
      "1 <= max_orders <= 10^6",
      "1 <= window_seconds <= 3600",
      "Timestamps are non-decreasing integers (seconds since epoch)",
    ],
    approach: `Fixed-window: store (current_window_start, count). On each allow(ts), compute window_id = ts // window_seconds. If window_id differs from stored, reset count. Then check count < max_orders. Sliding-window log: keep a deque of timestamps; pop all older than ts - window_seconds; allow if len(deque) < max_orders.`,
    code: `from collections import deque

class FixedWindowRateLimiter:
    """Aligned fixed windows. O(1) per call, O(1) space."""

    def __init__(self, max_orders: int, window_seconds: int) -> None:
        self.max_orders     = max_orders
        self.window_seconds = window_seconds
        self._window_id     = -1
        self._count         = 0

    def allow(self, timestamp: int) -> bool:
        wid = timestamp // self.window_seconds
        if wid != self._window_id:
            self._window_id = wid
            self._count     = 0
        if self._count < self.max_orders:
            self._count += 1
            return True
        return False


class SlidingWindowLogRateLimiter:
    """Rolling window using a timestamp deque. O(max_orders) space."""

    def __init__(self, max_orders: int, window_seconds: int) -> None:
        self.max_orders     = max_orders
        self.window_seconds = window_seconds
        self._log: deque[int] = deque()   # timestamps of allowed orders

    def allow(self, timestamp: int) -> bool:
        cutoff = timestamp - self.window_seconds
        # Evict timestamps outside the rolling window
        while self._log and self._log[0] <= cutoff:
            self._log.popleft()
        if len(self._log) < self.max_orders:
            self._log.append(timestamp)
            return True
        return False


# ---- demo ----
fw = FixedWindowRateLimiter(max_orders=3, window_seconds=10)
for ts in [1, 5, 9, 10, 11, 15]:
    print(f"ts={ts} -> {fw.allow(ts)}")

print()
sw = SlidingWindowLogRateLimiter(max_orders=2, window_seconds=10)
for ts in [1, 2, 3, 11, 12]:
    print(f"ts={ts} -> {sw.allow(ts)}")`,
    language: "python",
    complexity: { time: "O(1) fixed / O(N) sliding amortised", space: "O(1) fixed / O(W) sliding" },
  },
  {
    id: "fin-20260624-b1-fifo-pnl",
    title: "FIFO Realized P&L Matching",
    difficulty: "medium",
    topics: ["queue", "stack", "trade-accounting"],
    problem: `Implement a FIFO position tracker that matches trades and computes **realized P&L** under the FIFO (First-In, First-Out) accounting rule used by most brokers and tax authorities.

Each trade is a tuple \`(qty, price)\` where positive qty = buy, negative qty = sell.

Return the total realized P&L after all trades, and a log of each matched lot showing (buy_qty, buy_price, sell_price, realized).

Example: buy 10 @ 100, buy 5 @ 110, sell 8 @ 120.
FIFO: match 8 shares against the first lot (bought @ 100). Realized = 8 * (120 - 100) = 160.`,
    examples: [
      {
        input: "trades = [(10, 100), (5, 110), (-8, 120)]",
        output: "realized_pnl=160, matched=[(8, 100, 120, 160)]",
        explanation: "8 shares matched from first lot (cost 100), sold at 120. Remaining long: 2 @ 100 + 5 @ 110.",
      },
      {
        input: "trades = [(3, 50), (-2, 60), (-1, 70)]",
        output: "realized_pnl=40, matched=[(2,50,60,20),(1,50,70,20)]",
        explanation: "Sell 2 from first lot (cost 50, price 60, pnl 20); sell 1 more from same lot (cost 50, price 70, pnl 20). Total=40.",
      },
    ],
    constraints: [
      "1 <= len(trades) <= 10^5",
      "qty != 0",
      "Net position never goes short (sells never exceed existing longs in these examples)",
    ],
    approach: `Use a deque of (qty, cost_price) lots. For each sell, pop from the front (FIFO): take min(sell_qty, lot_qty) shares, compute PnL = matched_qty * (sell_price - cost_price). If lot partially consumed, push the remainder back. Append matched lot to log.`,
    code: `from collections import deque
from dataclasses import dataclass

@dataclass
class MatchedLot:
    qty:         int
    cost_price:  float
    sell_price:  float
    realized:    float

def fifo_pnl(trades: list[tuple[int, float]]) -> dict:
    """
    Computes realized P&L under FIFO accounting.
    Positive qty = buy, negative qty = sell.
    Returns total realized P&L and matched lot log.
    """
    lots: deque[list] = deque()    # each entry: [qty, cost_price]
    matched_log: list[MatchedLot]  = []
    total_realized = 0.0

    for qty, price in trades:
        if qty > 0:
            # Buy: add new lot to back of deque
            lots.append([qty, price])
        else:
            # Sell: consume lots from front (FIFO)
            sell_qty = -qty
            while sell_qty > 0 and lots:
                lot_qty, cost = lots[0]
                matched = min(sell_qty, lot_qty)
                pnl = matched * (price - cost)
                total_realized += pnl
                matched_log.append(MatchedLot(matched, cost, price, pnl))
                if matched == lot_qty:
                    lots.popleft()   # lot fully consumed
                else:
                    lots[0][0] -= matched   # partial consumption
                sell_qty -= matched

    # Remaining open lots (unrealized)
    open_position = [(q, c) for q, c in lots]

    return {
        "realized_pnl":  round(total_realized, 6),
        "matched_lots":  matched_log,
        "open_position": open_position,
    }

# ---- demo ----
result = fifo_pnl([(10, 100), (5, 110), (-8, 120)])
print(f"Realized PnL: {result['realized_pnl']}")
for lot in result['matched_lots']:
    print(f"  Matched {lot.qty} @ cost {lot.cost_price} sold @ {lot.sell_price} -> PnL {lot.realized}")
print(f"Open: {result['open_position']}")

print()
result2 = fifo_pnl([(3, 50), (-2, 60), (-1, 70)])
print(f"Realized PnL: {result2['realized_pnl']}")`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
];
