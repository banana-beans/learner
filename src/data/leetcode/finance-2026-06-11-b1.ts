import type { LeetCodeProblem } from "./index";

export const financeProblems20260611B1: LeetCodeProblem[] = [
  {
    id: "fin-20260611-b1-fx-arbitrage-bellman",
    title: "FX Arbitrage Detection via Bellman-Ford",
    difficulty: "hard",
    topics: ["graph", "bellman-ford", "finance"],
    problem:
      "You are given an N×N matrix rates where rates[i][j] is the exchange rate from currency i to currency j (rates[i][i] = 1.0). Detect whether there exists an arbitrage cycle — a sequence of currencies c0 -> c1 -> ... -> ck -> c0 such that the product of exchange rates > 1.0. If one exists, return the cycle as a list of currency indices. Otherwise return an empty list.",
    examples: [
      {
        input: "N=3, rates=[[1,0.5,2.0],[2.0,1,3.0],[0.4,0.35,1]]",
        output: "[0, 2, 1, 0]",
        explanation:
          "Currency 0 -> 2: rate 2.0. Currency 2 -> 1: rate 0.35. Currency 1 -> 0: rate 2.0. Product: 2.0 * 0.35 * 2.0 = 1.40 > 1. Arbitrage detected.",
      },
      {
        input: "N=2, rates=[[1,2.0],[0.5,1]]",
        output: "[]",
        explanation:
          "0->1: rate 2.0. 1->0: rate 0.5. Product: 1.0, no arbitrage.",
      },
    ],
    constraints: [
      "2 <= N <= 100",
      "0 < rates[i][j] <= 1000",
      "rates[i][i] = 1.0",
    ],
    approach:
      "Transform: weight[i][j] = -log(rates[i][j]). A profitable cycle becomes a negative-weight cycle. Run Bellman-Ford with a virtual source (all initial distances = 0). If any edge relaxes on the N-th iteration, a negative cycle exists. Trace back N steps along predecessor pointers to enter the cycle, then walk until revisiting a node.",
    code: `import math
from typing import List

def find_fx_arbitrage(rates: List[List[float]]) -> List[int]:
    """
    Detect FX arbitrage via Bellman-Ford on log-rate graph.
    w[i][j] = -log(rates[i][j]): negative-weight cycle = profitable arbitrage.
    Virtual source: initialise all dist[] = 0 (equivalent to adding a node
    with zero-weight edges to all currencies).
    """
    N    = len(rates)
    dist = [0.0] * N
    pred = [-1]  * N

    # Relax all edges N times (N-th relaxation finds cycle if it exists)
    last_updated = -1
    for iteration in range(N):
        last_updated = -1
        for u in range(N):
            for v in range(N):
                if u == v:
                    continue
                w = -math.log(rates[u][v])
                if dist[u] + w < dist[v] - 1e-9:
                    dist[v]      = dist[u] + w
                    pred[v]      = u
                    last_updated = v

    if last_updated == -1:
        return []   # no negative cycle

    # Walk back N steps to ensure we are inside the cycle
    cur = last_updated
    for _ in range(N):
        cur = pred[cur]

    # Trace the cycle
    cycle  = []
    start  = cur
    cycle.append(start)
    nxt    = pred[start]
    while nxt != start and len(cycle) <= N:
        cycle.append(nxt)
        nxt = pred[nxt]
    cycle.append(start)
    cycle.reverse()

    # Verify: product of rates along cycle > 1
    product = 1.0
    for i in range(len(cycle) - 1):
        product *= rates[cycle[i]][cycle[i+1]]

    return cycle if product > 1.0 + 1e-9 else []


# Example verification:
# rates = [[1, 0.5, 2.0], [2.0, 1, 3.0], [0.4, 0.35, 1]]
# find_fx_arbitrage(rates)  -> [0, 2, 1, 0] or similar cycle`,
    language: "python",
    complexity: { time: "O(N^3)", space: "O(N)" },
  },
  {
    id: "fin-20260611-b1-max-profit-k-txn",
    title: "Maximum Profit with At Most K Stock Transactions",
    difficulty: "hard",
    topics: ["dynamic-programming", "finance"],
    problem:
      "You are given a prices array and integer k. A transaction is a buy followed by a sell. You may hold at most one share at a time, and you may complete at most k transactions. Find the maximum profit. Each transaction is a buy on day i and sell on day j > i.",
    examples: [
      {
        input: "k=2, prices=[3,2,6,5,0,3]",
        output: "7",
        explanation:
          "Buy on day 1 (price=2), sell day 2 (price=6): profit=4. Buy day 4 (price=0), sell day 5 (price=3): profit=3. Total=7.",
      },
      {
        input: "k=1, prices=[1,2,3,4,5]",
        output: "4",
        explanation: "Buy day 0, sell day 4: profit=4.",
      },
    ],
    constraints: [
      "0 <= k <= 100",
      "0 <= prices.length <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "DP: dp[i][j] = max profit using at most i transactions up to day j. Transition: dp[i][j] = max(dp[i][j-1], prices[j] + max over m<j of (dp[i-1][m] - prices[m])). Track the running max of (dp[i-1][m] - prices[m]) to reduce to O(kN). If 2k >= N, just sum all positive differences (unlimited transactions effectively).",
    code: `from typing import List

def max_profit_k_transactions(k: int, prices: List[int]) -> int:
    """
    DP solution: dp[t][d] = best profit with t transactions up to day d.
    Key optimisation: track running max of (dp[t-1][m] - prices[m]) for m < d
    to avoid an inner O(N) loop -> O(k*N) total.
    """
    n = len(prices)
    if not prices or k == 0:
        return 0

    # If k >= n/2, we can do unlimited transactions
    if k >= n // 2:
        profit = 0
        for i in range(1, n):
            if prices[i] > prices[i-1]:
                profit += prices[i] - prices[i-1]
        return profit

    # dp[t][d] = max profit using at most t transactions by day d
    # Space optimised: only need previous row
    dp = [[0] * n for _ in range(k + 1)]

    for t in range(1, k + 1):
        # max_so_far = max(dp[t-1][m] - prices[m]) for m <= d
        max_so_far = -prices[0]   # buy on day 0 with t-1 transactions profit
        for d in range(1, n):
            # Option 1: do nothing on day d
            # Option 2: sell on day d, best buy was when (dp[t-1][m] - prices[m]) was max
            dp[t][d] = max(dp[t][d-1], prices[d] + max_so_far)
            # Update max_so_far for next iteration (considering buying on day d)
            max_so_far = max(max_so_far, dp[t-1][d] - prices[d])

    return dp[k][n-1]


# Reconstruct transactions (optional backtracking)
def reconstruct_transactions(k: int, prices: List[int]) -> List[tuple]:
    """Return list of (buy_day, sell_day) pairs."""
    # (Full reconstruction omitted for brevity; use parent tracking in DP.)
    return []`,
    language: "python",
    complexity: { time: "O(k * N)", space: "O(k * N)" },
  },
  {
    id: "fin-20260611-b1-top-k-volatile",
    title: "Top K Most Volatile Assets",
    difficulty: "medium",
    topics: ["heap", "sliding-window", "finance"],
    problem:
      "You are given an (N x D) matrix returns where returns[i][j] is the daily return of asset i on day j. Compute the historical volatility (standard deviation of returns) for each asset over the full D-day window, and return the indices of the k most volatile assets. If k >= N, return all asset indices sorted by volatility descending.",
    examples: [
      {
        input:
          "k=2, returns=[[0.01,-0.02,0.03],[-0.05,0.04,-0.01],[0.001,-0.001,0.002]]",
        output: "[1, 0]",
        explanation:
          "Asset 1 has std≈0.0453, asset 0 has std≈0.0252, asset 2 has std≈0.001. Top 2 by vol: indices [1, 0].",
      },
    ],
    constraints: [
      "1 <= k <= N <= 10^4",
      "1 <= D <= 252",
      "Returns can be any real number",
    ],
    approach:
      "Compute std deviation per asset in O(N*D). Use a min-heap of size k to track top-k volatilities: push each (vol, idx) onto the heap; if heap size > k, pop the minimum. The heap maintains the k largest volatilities at all times. Finally sort the heap descending. Total: O(N*D + N*log k).",
    code: `import heapq
import math
from typing import List

def top_k_volatile(k: int, returns: List[List[float]]) -> List[int]:
    """
    Find k most volatile assets using a min-heap of size k.
    Min-heap stores (vol, asset_idx): pop the smallest when size exceeds k.
    After processing all assets, the heap contains the k largest vols.
    """
    N = len(returns)
    D = len(returns[0]) if N > 0 else 0

    def std(r: List[float]) -> float:
        """Population standard deviation."""
        if len(r) <= 1:
            return 0.0
        mean = sum(r) / len(r)
        var  = sum((x - mean)**2 for x in r) / len(r)
        return math.sqrt(var)

    min_heap: List[tuple] = []   # (vol, idx)

    for i in range(N):
        vol = std(returns[i])
        heapq.heappush(min_heap, (vol, i))
        if len(min_heap) > k:
            heapq.heappop(min_heap)   # remove the least volatile

    # Sort descending by volatility
    result = sorted(min_heap, reverse=True)
    return [idx for vol, idx in result]


def rolling_top_k_volatile(k: int, returns: List[List[float]],
                             window: int = 21) -> List[List[int]]:
    """
    Rolling window version: recompute top-k volatile assets every day.
    Returns a list of k-element lists, one per day starting from day window-1.
    """
    N = len(returns)
    D = len(returns[0]) if N > 0 else 0
    results = []

    for end in range(window, D + 1):
        window_rets = [returns[i][end-window:end] for i in range(N)]
        results.append(top_k_volatile(k, window_rets))

    return results`,
    language: "python",
    complexity: { time: "O(N*D + N*log k)", space: "O(k)" },
  },
  {
    id: "fin-20260611-b1-sliding-window-max",
    title: "Rolling Maximum Price (Sliding Window Maximum)",
    difficulty: "medium",
    topics: ["deque", "sliding-window", "finance"],
    problem:
      "You are given an array prices[] and integer k. Return an array result[] where result[i] is the maximum of prices[i..i+k-1] (the maximum price within a sliding window of size k). This computes the rolling high — used for lookback option payoffs, ATH indicators, and resistance level detection. result has length N-k+1.",
    examples: [
      {
        input: "prices=[100,102,98,105,99,103,97,108], k=3",
        output: "[102,105,105,105,103,108]",
        explanation:
          "Window [100,102,98]->102, [102,98,105]->105, [98,105,99]->105, [105,99,103]->105, [99,103,97]->103, [103,97,108]->108.",
      },
    ],
    constraints: [
      "1 <= k <= prices.length <= 10^5",
      "Prices can be any real number",
    ],
    approach:
      "Monotonic deque: maintain a deque of indices with decreasing prices. When a new price is added, pop from the back while the back's price <= new price (they can never be the window maximum). Pop from the front when the front index is outside the window. The front is always the current window maximum. O(N) amortised — each index is pushed and popped at most once.",
    code: `from collections import deque
from typing import List

def rolling_max(prices: List[float], k: int) -> List[float]:
    """
    Monotonic deque: deque stores indices, prices[deque[0]] is always the max.
    Front is removed when it exits the window (i - dq[0] >= k).
    Back is removed when prices[back] <= prices[i] (dominated, can never be max).
    """
    n      = len(prices)
    result = []
    dq: deque[int] = deque()   # stores indices, decreasing prices

    for i in range(n):
        # Remove indices that are now outside the window
        while dq and i - dq[0] >= k:
            dq.popleft()

        # Maintain decreasing order: remove back elements dominated by prices[i]
        while dq and prices[dq[-1]] <= prices[i]:
            dq.pop()

        dq.append(i)

        # Window is complete starting from index k-1
        if i >= k - 1:
            result.append(prices[dq[0]])

    return result


def rolling_lookback_payoff(prices: List[float], K: float, k: int) -> List[float]:
    """
    Lookback option payoff: max(rolling_max(prices, k) - K, 0).
    Computes the lookback call payoff for each window of length k.
    """
    maxima = rolling_max(prices, k)
    return [max(m - K, 0.0) for m in maxima]`,
    language: "python",
    complexity: { time: "O(N)", space: "O(k)" },
  },
  {
    id: "fin-20260611-b1-markov-portfolio",
    title: "Markov Chain Portfolio Value Distribution",
    difficulty: "medium",
    topics: ["probability", "matrix-exponentiation", "finance"],
    problem:
      "A portfolio cycles through K regimes (states). In regime i it earns daily return r[i]. The transition matrix P[i][j] is the probability of moving from regime i to regime j. Starting in regime s with portfolio value V0, compute the probability distribution over portfolio values after exactly N days. Return: for each possible ending regime, the expected portfolio value and probability of being in that regime.",
    examples: [
      {
        input:
          "K=2, P=[[0.8,0.2],[0.3,0.7]], r=[0.001,-0.002], s=0, N=10, V0=1000",
        output: "state_probs=[0.571,0.429], E[V]≈998.5",
        explanation:
          "After 10 steps from state 0, state probabilities approach stationary distribution. Bull state (r=0.1%) has prob≈0.57, bear (r=-0.2%) ≈0.43. Expected value < 1000 due to negative drift in bear regime.",
      },
    ],
    constraints: [
      "2 <= K <= 20",
      "1 <= N <= 10^9",
      "0 < V0 <= 10^9",
      "P is a valid stochastic matrix",
    ],
    approach:
      "Represent state distribution as a row vector v (initially e_s). After N steps v_N = v_0 @ P^N. Use matrix exponentiation (repeated squaring) for O(K^3 log N). Expected portfolio value in regime k after N steps = V0 * prod(expected return factors). Since returns compound multiplicatively, use the geometric expectation: E[V_N | end in k] ≈ V0 * exp(N * r[k]) as an approximation.",
    code: `import numpy as np
from typing import List

def matmul(A: List[List[float]], B: List[List[float]]) -> List[List[float]]:
    K = len(A)
    C = [[0.0]*K for _ in range(K)]
    for i in range(K):
        for j in range(K):
            for l in range(K):
                C[i][j] += A[i][l] * B[l][j]
    return C

def matpow(M: List[List[float]], n: int) -> List[List[float]]:
    K = len(M)
    result = [[1.0 if i==j else 0.0 for j in range(K)] for i in range(K)]
    base   = [row[:] for row in M]
    while n > 0:
        if n & 1:
            result = matmul(result, base)
        base = matmul(base, base)
        n >>= 1
    return result

def markov_portfolio_distribution(
    transition: List[List[float]],
    returns: List[float],
    start_state: int,
    n_days: int,
    V0: float = 1000.0,
) -> dict:
    """
    Compute state distribution after N days via matrix exponentiation.
    v_N = e_{start} @ P^N  gives probability of ending in each state.
    Expected portfolio value uses geometric compounding per state.
    """
    K    = len(returns)
    P_N  = matpow(transition, n_days)   # O(K^3 log N)

    # State probabilities starting from start_state
    state_probs = P_N[start_state]      # row of P^N

    # Expected V: weight by state probability * compounded return
    # Approximate: each day the portfolio earns the per-state return
    # True expectation requires tracking the full path (path-dependent).
    # Approximation: E[V_N | end in k] ~ V0 * exp(sum of expected log returns)
    # Better: E[V_N] = V0 * (P^N augmented with return factors)[s0][:]
    # Build reward-augmented matrix M[i][j] = P[i][j] * exp(r[j])
    M = [[transition[i][j] * (1.0 + returns[j]) for j in range(K)] for i in range(K)]
    M_N      = matpow(M, n_days)
    # Expected growth factor from state s0: sum of M_N[s0][:]
    growth   = sum(M_N[start_state])
    E_value  = V0 * growth

    # Stationary distribution (power method)
    v = [1.0/K] * K
    for _ in range(200):
        v = [sum(v[i] * transition[i][j] for i in range(K)) for j in range(K)]

    return {
        "state_probs":       [round(p, 6) for p in state_probs],
        "E_portfolio_value": round(float(E_value), 4),
        "growth_factor":     round(float(growth), 6),
        "stationary_dist":   [round(p, 4) for p in v],
        "n_days":            n_days,
    }`,
    language: "python",
    complexity: { time: "O(K^3 log N)", space: "O(K^2)" },
  },
  {
    id: "fin-20260611-b1-max-drawdown",
    title: "Maximum Drawdown of a Portfolio",
    difficulty: "medium",
    topics: ["array", "sliding-window", "finance"],
    problem:
      "Given a time series of portfolio NAV values nav[], compute the maximum drawdown: the maximum peak-to-trough decline over any contiguous period. Maximum drawdown = max over all (i < j) of (nav[i] - nav[j]) / nav[i]. Also return the peak index i and trough index j that achieve this maximum. Solve in O(N) time.",
    examples: [
      {
        input: "nav=[100, 110, 105, 90, 95, 80, 100, 115]",
        output: "max_dd=0.2727, peak_idx=1 (110), trough_idx=5 (80)",
        explanation:
          "Peak 110 at index 1, trough 80 at index 5: drawdown=(110-80)/110=0.2727.",
      },
      {
        input: "nav=[100, 90, 85, 80, 70]",
        output: "max_dd=0.30, peak_idx=0 (100), trough_idx=4 (70)",
        explanation: "Monotonically declining: (100-70)/100=0.30.",
      },
    ],
    constraints: [
      "2 <= nav.length <= 10^6",
      "nav[i] > 0 for all i",
    ],
    approach:
      "Single pass: maintain running peak and its index. For each value, compute the drawdown from the current running peak. Track the maximum observed drawdown and the (peak, trough) pair. O(N) time, O(1) space.",
    code: `from typing import List, Tuple

def max_drawdown(nav: List[float]) -> dict:
    """
    Single-pass O(N) maximum drawdown computation.
    running_peak: highest NAV seen so far and its index.
    At each step, compute drawdown from running peak; update max if larger.
    """
    if len(nav) < 2:
        return {"max_dd": 0.0, "peak_idx": 0, "trough_idx": 0}

    running_peak     = nav[0]
    peak_idx         = 0
    candidate_peak   = 0   # peak for the current potential drawdown period

    max_dd           = 0.0
    best_peak_idx    = 0
    best_trough_idx  = 0

    for i in range(1, len(nav)):
        # Update running peak
        if nav[i] > running_peak:
            running_peak   = nav[i]
            candidate_peak = i

        # Compute drawdown from current running peak
        if running_peak > 0:
            dd = (running_peak - nav[i]) / running_peak
            if dd > max_dd:
                max_dd          = dd
                best_peak_idx   = candidate_peak
                best_trough_idx = i

    return {
        "max_dd":         round(float(max_dd), 6),
        "max_dd_pct":     round(float(max_dd * 100), 4),
        "peak_idx":       best_peak_idx,
        "peak_value":     nav[best_peak_idx],
        "trough_idx":     best_trough_idx,
        "trough_value":   nav[best_trough_idx],
        "drawdown_days":  best_trough_idx - best_peak_idx,
    }


def calmar_ratio(nav: List[float], ann_factor: float = 252) -> float:
    """Calmar ratio = annualised return / max drawdown."""
    dd_result  = max_drawdown(nav)
    total_ret  = (nav[-1] / nav[0] - 1.0) if nav[0] > 0 else 0.0
    n_periods  = len(nav)
    ann_ret    = (1.0 + total_ret) ** (ann_factor / n_periods) - 1.0
    max_dd     = dd_result["max_dd"]
    return ann_ret / max_dd if max_dd > 0 else float("inf")`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260611-b1-min-portfolio-rebalance",
    title: "Minimum Trades to Rebalance Portfolio",
    difficulty: "medium",
    topics: ["greedy", "multiset", "finance"],
    problem:
      "You have a portfolio with N assets. Current weights are current[] and target weights are target[] (both sum to 1.0). Each rebalancing trade exchanges weight from one asset to another. You can transfer any amount in one trade, but each trade incurs a fixed cost C. What is the minimum number of trades required to reach the target allocation exactly? Fractional trades are allowed (you may transfer any amount in a single trade).",
    examples: [
      {
        input:
          "current=[0.5, 0.3, 0.2], target=[0.3, 0.4, 0.3], C=1",
        output: "2",
        explanation:
          "Net changes: asset 0: -0.2 (sell), asset 1: +0.1 (buy), asset 2: +0.1 (buy). 2 assets need buying, 1 needs selling. Min trades = max(#sellers, #buyers) by matching: Trade 1: 0->1 (amount 0.1). Trade 2: 0->2 (amount 0.1). 2 trades total.",
      },
      {
        input: "current=[0.25,0.25,0.25,0.25], target=[0.5,0.1,0.3,0.1]",
        output: "3",
        explanation:
          "Differences: +0.25, -0.15, +0.05, -0.15. 2 buyers, 2 sellers. Min trades = 3 (each trade reduces one side by 1 until balanced).",
      },
    ],
    constraints: [
      "2 <= N <= 1000",
      "sum(current) = sum(target) = 1.0",
      "current[i] >= 0, target[i] >= 0",
    ],
    approach:
      "Compute diffs[i] = target[i] - current[i]. Separate into buyers (diff > 0) and sellers (diff < 0). Use a two-pointer greedy: pair each buyer with sellers, splitting trades when amounts don't match. Minimum trades = |buyers| + |sellers| - 1 (similar to water-pouring: each trade eliminates one constraint, and we have |buyers| + |sellers| constraints total with one redundant since sum(diffs) = 0).",
    code: `from typing import List

def min_rebalance_trades(current: List[float], target: List[float]) -> int:
    """
    Minimum trades = number of net flows needed.
    Key insight: the minimum number of transfers = (number of non-zero diffs) - 1
    because each transfer can eliminate at most one asset from the pending list
    (either the buyer is fully satisfied or the seller is fully depleted),
    and the last trade satisfies the final pair simultaneously.
    """
    eps   = 1e-9
    diffs = [target[i] - current[i] for i in range(len(current))]

    # Separate into buyers (excess needed) and sellers (excess available)
    buyers  = sorted([d for d in diffs if d > eps], reverse=True)
    sellers = sorted([-d for d in diffs if d < -eps], reverse=True)

    if not buyers and not sellers:
        return 0

    trades = 0
    bi, si = 0, 0
    while bi < len(buyers) and si < len(sellers):
        buy_amt  = buyers[bi]
        sell_amt = sellers[si]

        trades += 1

        if abs(buy_amt - sell_amt) < eps:
            bi += 1
            si += 1
        elif buy_amt < sell_amt:
            # Buyer is satisfied; partially fulfil seller
            sellers[si] -= buy_amt
            bi += 1
        else:
            # Seller is exhausted; partially fulfil buyer
            buyers[bi] -= sell_amt
            si += 1

    return trades


def optimal_rebalance_path(current: List[float], target: List[float]) -> List[dict]:
    """Return the actual sequence of (from_asset, to_asset, amount) transfers."""
    eps   = 1e-9
    diffs = [target[i] - current[i] for i in range(len(current))]

    buyers  = [(i, d)  for i, d in enumerate(diffs) if d > eps]
    sellers = [(i, -d) for i, d in enumerate(diffs) if d < -eps]
    transfers = []

    bi, si = 0, 0
    while bi < len(buyers) and si < len(sellers):
        b_idx, buy_amt  = buyers[bi]
        s_idx, sell_amt = sellers[si]
        trade_amt = min(buy_amt, sell_amt)
        transfers.append({"from": s_idx, "to": b_idx, "amount": round(trade_amt, 6)})
        if buy_amt <= sell_amt + eps:
            bi += 1
            sellers[si] = (s_idx, sell_amt - trade_amt)
        else:
            si += 1
            buyers[bi]  = (b_idx, buy_amt - trade_amt)

    return transfers`,
    language: "python",
    complexity: { time: "O(N log N)", space: "O(N)" },
  },
  {
    id: "fin-20260611-b1-position-bitmask",
    title: "Optimal Position Subset Under Correlated Risk Limit",
    difficulty: "hard",
    topics: ["bitmask-dp", "bit-manipulation", "finance"],
    problem:
      "You have N assets (N <= 20). Each asset i has expected return ret[i] and variance var[i]. The portfolio variance for a subset S is sum_{i in S} var[i] + sum_{i,j in S, i<j} 2*covar[i][j]. Find the subset S that maximises total expected return subject to portfolio variance <= max_var. Return the maximum return and the selected asset indices.",
    examples: [
      {
        input:
          "N=3, ret=[3,2,4], var=[1,0.5,2], covar=[[0,0.3,0.2],[0.3,0,0.1],[0.2,0.1,0]], max_var=3",
        output: "max_ret=5, selected=[0,1] (ret 3+2=5, var=1+0.5+2*0.3=2.1 <= 3)",
        explanation:
          "Subset {0,1}: portfolio var = 1 + 0.5 + 2*0.3 = 2.1. Return = 5. Subset {0,2}: var = 1 + 2 + 2*0.2 = 3.4 > 3. Subset {0,1,2}: var = 3.5 > 3. Best feasible: {0,1} with return=5.",
      },
    ],
    constraints: [
      "1 <= N <= 20",
      "0 < max_var <= 1000",
      "All ret[i], var[i], covar[i][j] >= 0",
    ],
    approach:
      "Enumerate all 2^N subsets using bitmask. For each bitmask, compute the portfolio variance in O(N^2) and the total return in O(N). Track the feasible subset with maximum return. Precompute per-bit popcount and covariance contributions to speed up. Total: O(2^N * N^2). For N=20 this is ~400M operations — feasible with fast inner loop.",
    code: `from typing import List

def best_subset_under_var(
    ret: List[float],
    var: List[float],
    covar: List[List[float]],
    max_var: float,
) -> dict:
    """
    Enumerate all 2^N subsets (N <= 20) and find the max-return feasible one.
    Portfolio variance for subset S: sum_i var[i] + 2*sum_{i<j} covar[i][j].
    """
    N       = len(ret)
    best_return  = 0.0
    best_mask    = 0

    for mask in range(1, 1 << N):
        # Extract selected indices
        indices = [i for i in range(N) if mask >> i & 1]

        # Compute portfolio variance
        port_var = sum(var[i] for i in indices)
        for idx_a in range(len(indices)):
            for idx_b in range(idx_a + 1, len(indices)):
                i, j = indices[idx_a], indices[idx_b]
                port_var += 2.0 * covar[i][j]

        if port_var > max_var + 1e-9:
            continue   # infeasible

        # Compute total return
        port_ret = sum(ret[i] for i in indices)
        if port_ret > best_return:
            best_return = port_ret
            best_mask   = mask

    selected = [i for i in range(N) if best_mask >> i & 1]

    # Recompute final portfolio stats
    final_var = sum(var[i] for i in selected)
    for a in range(len(selected)):
        for b in range(a+1, len(selected)):
            final_var += 2.0 * covar[selected[a]][selected[b]]

    return {
        "max_return":   round(float(best_return), 6),
        "selected":     selected,
        "port_var":     round(float(final_var), 6),
        "n_assets":     len(selected),
    }`,
    language: "python",
    complexity: { time: "O(2^N * N^2)", space: "O(1)" },
  },
  {
    id: "fin-20260611-b1-order-book-match",
    title: "Design a Limit Order Book Matcher",
    difficulty: "hard",
    topics: ["design", "heap", "finance"],
    problem:
      "Design an OrderBook class that processes limit and market orders. Implement: (1) add_order(id, side, price, qty) -> matched trades (list of (bid_id, ask_id, price, qty)); (2) cancel_order(id) -> bool; (3) best_bid() -> Optional[float]; (4) best_ask() -> Optional[float]. Price-time priority: at the same price, earlier orders are matched first.",
    examples: [
      {
        input:
          "add_order(1,'bid',100,10); add_order(2,'ask',101,5); add_order(3,'ask',100,8)",
        output:
          "add_order(3): trades=[(1,3,100,8)]. Remaining: bid 1 has qty 2 remaining. ask 2 still open.",
        explanation:
          "Order 3 (ask @ 100) crosses order 1 (bid @ 100). 8 units trade at 100. Order 1 partially filled (2 remaining). Order 3 fully filled.",
      },
    ],
    constraints: [
      "1 <= price <= 10^9",
      "1 <= qty <= 10^9",
      "Order IDs are unique positive integers",
      "Up to 10^5 operations",
    ],
    approach:
      "Maintain two sorted structures: max-heap for bids (negate price for max-heap), min-heap for asks. Use a dict {id: (side, price, remaining_qty)} for O(1) cancel/amend. On each add_order: check if the new order crosses the best opposite side. If yes, match until no cross remains or the new order is filled. Lazy deletion: on heap pop, check if the order is still live and has positive qty.",
    code: `import heapq
from typing import List, Optional, Tuple
from collections import defaultdict

class OrderBook:
    """
    Limit order book with price-time priority matching.
    Bids: max-heap (negated prices). Asks: min-heap.
    Lazy deletion: orders are only removed from heaps when they reach the front.
    """
    def __init__(self):
        self.bids: List[Tuple] = []   # (-price, timestamp, id) max-heap
        self.asks: List[Tuple] = []   # ( price, timestamp, id) min-heap
        self.orders: dict = {}        # id -> {'side','price','qty'}
        self.ts = 0                   # monotonic timestamp for FIFO priority

    def add_order(self, order_id: int, side: str, price: float,
                  qty: int) -> List[dict]:
        self.ts += 1
        self.orders[order_id] = {"side": side, "price": price, "qty": qty}
        trades = []

        if side == "bid":
            heapq.heappush(self.bids, (-price, self.ts, order_id))
            # Match against asks
            while qty > 0 and self.asks:
                ask_price, _, ask_id = self.asks[0]
                # Lazy: skip cancelled or fully filled asks
                if ask_id not in self.orders:
                    heapq.heappop(self.asks); continue
                if ask_price > price:
                    break   # no cross
                heapq.heappop(self.asks)
                ask_qty = self.orders[ask_id]["qty"]
                fill    = min(qty, ask_qty)
                trades.append({"bid_id": order_id, "ask_id": ask_id,
                                "price": ask_price, "qty": fill})
                qty -= fill; ask_qty -= fill
                if ask_qty <= 0:
                    del self.orders[ask_id]
                else:
                    self.orders[ask_id]["qty"] = ask_qty
                    heapq.heappush(self.asks, (ask_price, _, ask_id))
            self.orders[order_id]["qty"] = qty
            if qty <= 0:
                del self.orders[order_id]
        else:   # ask
            heapq.heappush(self.asks, (price, self.ts, order_id))
            while qty > 0 and self.bids:
                neg_bp, _, bid_id = self.bids[0]
                if bid_id not in self.orders:
                    heapq.heappop(self.bids); continue
                if -neg_bp < price:
                    break
                heapq.heappop(self.bids)
                bid_qty = self.orders[bid_id]["qty"]
                fill    = min(qty, bid_qty)
                trades.append({"bid_id": bid_id, "ask_id": order_id,
                                "price": price, "qty": fill})
                qty -= fill; bid_qty -= fill
                if bid_qty <= 0:
                    del self.orders[bid_id]
                else:
                    self.orders[bid_id]["qty"] = bid_qty
                    heapq.heappush(self.bids, (neg_bp, _, bid_id))
            self.orders[order_id]["qty"] = qty
            if qty <= 0:
                del self.orders[order_id]
        return trades

    def cancel_order(self, order_id: int) -> bool:
        if order_id in self.orders:
            del self.orders[order_id]
            return True
        return False

    def best_bid(self) -> Optional[float]:
        while self.bids:
            neg_p, _, oid = self.bids[0]
            if oid in self.orders:
                return -neg_p
            heapq.heappop(self.bids)
        return None

    def best_ask(self) -> Optional[float]:
        while self.asks:
            p, _, oid = self.asks[0]
            if oid in self.orders:
                return p
            heapq.heappop(self.asks)
        return None`,
    language: "python",
    complexity: { time: "O(log N) per order amortised", space: "O(N)" },
  },
  {
    id: "fin-20260611-b1-stock-fee-dp",
    title: "Best Time to Buy/Sell with Transaction Fee",
    difficulty: "medium",
    topics: ["dynamic-programming", "greedy", "finance"],
    problem:
      "You are given prices[] and an integer fee (transaction cost per buy-sell cycle). You may hold at most one share at a time and complete unlimited transactions. Each time you buy and sell, you pay fee once. Find the maximum profit. This models a trading strategy with proportional transaction costs.",
    examples: [
      {
        input: "prices=[1,3,2,8,4,9], fee=2",
        output: "8",
        explanation:
          "Buy at 1, sell at 8 (profit=7, fee=2 -> net=5). Buy at 4, sell at 9 (profit=5, fee=2 -> net=3). Total=8.",
      },
      {
        input: "prices=[1,3,7,5,10,3], fee=3",
        output: "6",
        explanation:
          "Buy at 1, sell at 10 (profit=9, fee=3 -> net=6). Do not trade again.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5 * 10^4",
      "1 <= prices[i] <= 10^4",
      "0 <= fee <= 10^4",
    ],
    approach:
      "DP with two states: cash (not holding) and hold (holding one share). cash[i] = max profit on day i with no position. hold[i] = max profit on day i while holding. Transitions: cash[i] = max(cash[i-1], hold[i-1] + prices[i] - fee); hold[i] = max(hold[i-1], cash[i-1] - prices[i]). O(N) time, O(1) space.",
    code: `from typing import List

def max_profit_with_fee(prices: List[int], fee: int) -> int:
    """
    DP with two states: cash (flat position) and hold (long one share).
    cash: best profit when not holding any stock on day i.
    hold: best profit when holding one share on day i.
    At each day:
      - cash: either stay flat, or sell today (hold + price - fee)
      - hold: either stay long, or buy today (cash - price)
    Fee is paid on sell to avoid double-counting.
    """
    cash = 0             # profit if flat (no position)
    hold = -prices[0]   # profit if long (bought on day 0)

    for i in range(1, len(prices)):
        # Sell: gain prices[i] minus transaction fee
        new_cash = max(cash, hold + prices[i] - fee)
        # Buy: pay prices[i]
        new_hold = max(hold, cash - prices[i])
        cash, hold = new_cash, new_hold

    return cash   # always end flat for maximum profit

# Trace the trades (optional):
def trace_trades_with_fee(prices: List[int], fee: int) -> dict:
    n = len(prices)
    # Store decisions using full DP arrays
    cash   = [0] * n
    hold   = [-prices[0]] * n

    for i in range(1, n):
        cash[i] = max(cash[i-1], hold[i-1] + prices[i] - fee)
        hold[i] = max(hold[i-1], cash[i-1] - prices[i])

    # Backtrack to find buy/sell days
    trades = []
    state  = "cash"
    for i in range(n-1, 0, -1):
        if state == "cash" and hold[i-1] + prices[i] - fee == cash[i]:
            trades.append(("sell", i, prices[i]))
            state = "hold"
        elif state == "hold" and cash[i-1] - prices[i] == hold[i]:
            trades.append(("buy", i, prices[i]))
            state = "cash"

    trades.reverse()
    return {"max_profit": cash[n-1], "trades": trades}`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
];
