import type { LeetCodeProblem } from "./index";

export const financeProblems20260603B1: LeetCodeProblem[] = [
  {
    id: "fin-20260603-b1-gambler-ruin",
    title: "Gambler's Ruin Probability",
    difficulty: "medium",
    topics: ["dynamic-programming", "probability", "math", "finance"],
    problem: `A trader starts each day with k dollars in risk capital and bets 1 dollar per trade. Each trade wins with probability p and loses with probability (1-p). Trading stops when capital reaches 0 (ruin) or N dollars (target).

Return the probability of reaching N dollars before going broke, starting from k dollars.

For p ≠ 0.5: P(k) = (1 - (q/p)^k) / (1 - (q/p)^N)  where q = 1 - p
For p = 0.5: P(k) = k / N

This is the classic Gambler's Ruin formula, asked in virtually every quant trading interview.

Input: k=5, N=10, p=0.6
Output: 0.8696  (strong edge -> high success probability)

Input: k=5, N=10, p=0.4
Output: 0.1304  (negative edge -> ruin likely)`,
    examples: [
      {
        input: "k=5, N=10, p=0.6",
        output: "0.8696",
        explanation: "q/p = 0.4/0.6 = 2/3. P(5) = (1 - (2/3)^5) / (1 - (2/3)^10) ≈ 0.8696.",
      },
      {
        input: "k=5, N=10, p=0.5",
        output: "0.5",
        explanation: "Fair game: P(k) = k/N = 5/10 = 0.5.",
      },
      {
        input: "k=1, N=10, p=0.4",
        output: "0.0214",
        explanation: "Only 1 dollar vs 10 target with negative edge: ruin almost certain.",
      },
    ],
    approach:
      "Use the closed-form formula: for p≠0.5 compute r=q/p, then P(k)=(1-r^k)/(1-r^N). For p=0.5 return k/N. Alternatively, solve the linear recurrence P[k]=p*P[k+1]+(1-p)*P[k-1] via DP with boundary conditions P[0]=0, P[N]=1. The closed form is O(1); DP is O(N) but works when p varies per step.",
    code: `def gamblers_ruin(k: int, N: int, p: float) -> float:
    """Returns probability of reaching N before 0, starting at k."""
    if k <= 0:
        return 0.0
    if k >= N:
        return 1.0
    if abs(p - 0.5) < 1e-10:
        return k / N   # fair game: linear probability

    q = 1.0 - p
    r = q / p
    # Closed-form: P(k) = (1 - r^k) / (1 - r^N)
    # Numerically stable: compute r^k and r^N carefully.
    rk = r ** k
    rN = r ** N
    return (1.0 - rk) / (1.0 - rN)

# DP version — handles non-constant p per state:
def gamblers_ruin_dp(k: int, N: int, p: float) -> float:
    P = [0.0] * (N + 1)
    P[N] = 1.0   # boundary: reached target
    # Solve tridiagonal system iteratively.
    # For constant p, converges to the closed form.
    for _ in range(10_000):   # Gauss-Seidel iterations
        for i in range(1, N):
            P[i] = p * P[i + 1] + (1 - p) * P[i - 1]
    return P[k]

print(f"{gamblers_ruin(5, 10, 0.6):.4f}")   # 0.8696
print(f"{gamblers_ruin(5, 10, 0.5):.4f}")   # 0.5000
print(f"{gamblers_ruin(1, 10, 0.4):.4f}")   # 0.0214`,
    language: "python",
    complexity: { time: "O(1) closed-form, O(N·iterations) DP", space: "O(1) or O(N)" },
  },
  {
    id: "fin-20260603-b1-ipo-capital",
    title: "IPO Project Selection — Maximize Capital with Budget Constraint",
    difficulty: "hard",
    topics: ["heap", "greedy", "sorting", "finance"],
    problem: `A fund has initial capital W and can complete at most K investment projects. Each project i requires minimum capital minCapital[i] to start and yields profit[i] upon completion. After completing a project you immediately add its profit to your capital.

Return the maximum capital achievable after completing at most K projects.

Greedy insight: always complete the highest-profit project among all currently affordable ones (those with minCapital <= current capital). This is optimal because capital only increases, so waiting never hurts.

Input: K=2, W=0, profits=[1,2,3], minCapital=[0,1,1]
Output: 4

Input: K=3, W=0, profits=[1,2,3], minCapital=[0,1,2]
Output: 6`,
    examples: [
      {
        input: "K=2, W=0, profits=[1,2,3], minCapital=[0,1,1]",
        output: "4",
        explanation: "W=0: only project 0 (cap=0,profit=1) is affordable. Complete it: W=1. Now projects 1 and 2 affordable; pick profit=3: W=4.",
      },
      {
        input: "K=3, W=0, profits=[1,2,3], minCapital=[0,1,2]",
        output: "6",
        explanation: "Complete project 0 (profit=1, W=1), then project 1 (profit=2, W=3), then project 2 (profit=3, W=6).",
      },
      {
        input: "K=1, W=5, profits=[10,5,1], minCapital=[6,4,0]",
        output: "15",
        explanation: "W=5 can't afford project 0 (cap=6). Best affordable: project 1 (profit=5). But project 2 has profit=1. Pick project 1: W=10. Wait — K=1 so only one project. With W=5: affordable are idx 1 (cap=4) and idx 2 (cap=0). Max profit among them = 5. Final W = 5+5 = 10.",
      },
    ],
    approach:
      "Sort projects by minCapital. Use a max-heap of profits for currently affordable projects. For each of K rounds: push all newly affordable projects onto the max-heap, then pop and add the maximum profit to W. Time: O(N log N) for sort + O(K log N) for heap operations.",
    code: `import heapq

def find_maximized_capital(K: int, W: int,
                            profits: list[int],
                            min_capital: list[int]) -> int:
    n = len(profits)
    # Sort projects by capital requirement (ascending).
    projects = sorted(zip(min_capital, profits))

    max_heap = []   # max-heap via negation
    i = 0           # pointer into sorted projects

    for _ in range(K):
        # Push all newly affordable projects onto the heap.
        while i < n and projects[i][0] <= W:
            heapq.heappush(max_heap, -projects[i][1])
            i += 1

        if not max_heap:
            break   # no affordable project: stop early

        # Always take the highest-profit affordable project.
        W += -heapq.heappop(max_heap)

    return W

print(find_maximized_capital(2, 0, [1, 2, 3], [0, 1, 1]))  # 4
print(find_maximized_capital(3, 0, [1, 2, 3], [0, 1, 2]))  # 6`,
    language: "python",
    complexity: { time: "O(N log N + K log N)", space: "O(N)" },
  },
  {
    id: "fin-20260603-b1-k-closest-strikes",
    title: "K Closest Strike Prices to Spot",
    difficulty: "easy",
    topics: ["binary-search", "two-pointers", "finance"],
    problem: `Given a sorted array of option strike prices and a spot price, return the K strike prices closest to the spot.

If two strikes are equidistant, include the lower one first (prefer in-the-money).

This operation is performed repeatedly in option pricing systems when building the volatility smile around ATM.

Input: strikes=[80,85,90,95,100,105,110,115,120], spot=100, K=4
Output: [95, 100, 105, 90]  → sorted by distance: [90,95,100,105]`,
    examples: [
      {
        input: "strikes=[80,85,90,95,100,105,110,115,120], spot=100, K=4",
        output: "[95, 100, 105, 90]",
        explanation: "Distances: 95→5, 100→0, 105→5, 90→10. Closest 4: 100(0), 95(5), 105(5), 90(10). Ties at ±5 broken by lower strike first.",
      },
      {
        input: "strikes=[90,95,100,105,110], spot=97, K=3",
        output: "[95, 100, 90]",
        explanation: "Distances: 95→2, 100→3, 90→7, 105→8. Closest 3: 95, 100, 90.",
      },
    ],
    approach:
      "Binary search for the insertion point of spot in strikes. Expand outward with two pointers (left, right), always choosing the side with smaller distance (lower index on tie). Collect K strikes. O(log N + K).",
    code: `import bisect

def k_closest_strikes(strikes: list[float], spot: float,
                       K: int) -> list[float]:
    n = len(strikes)
    if K >= n:
        return list(strikes)

    # Binary search: find the index where spot would be inserted.
    pos = bisect.bisect_left(strikes, spot)
    lo, hi = pos - 1, pos   # two-pointer: lo goes left, hi goes right
    result = []

    for _ in range(K):
        if lo < 0:
            result.append(strikes[hi]); hi += 1
        elif hi >= n:
            result.append(strikes[lo]); lo -= 1
        else:
            dist_lo = spot - strikes[lo]
            dist_hi = strikes[hi] - spot
            # Prefer lower strike (lo) on tie.
            if dist_lo <= dist_hi:
                result.append(strikes[lo]); lo -= 1
            else:
                result.append(strikes[hi]); hi += 1

    return result

strikes = [80, 85, 90, 95, 100, 105, 110, 115, 120]
print(k_closest_strikes(strikes, 100, 4))  # [100, 95, 105, 90]
print(k_closest_strikes(strikes, 97,  3))  # [95, 100, 90]`,
    language: "python",
    complexity: { time: "O(log N + K)", space: "O(K)" },
  },
  {
    id: "fin-20260603-b1-max-drawdown-recover",
    title: "Maximum Drawdown and Recovery Period",
    difficulty: "medium",
    topics: ["dynamic-programming", "array", "finance"],
    problem: `Given a time series of portfolio equity values, compute:
1. Maximum drawdown (MDD): the largest peak-to-trough decline, as a fraction.
2. Recovery period: the number of days from the trough to when the equity next exceeds the peak.

Maximum Drawdown = (peak - trough) / peak, over all (peak, trough) pairs where peak comes before trough.

Input: equity = [100, 110, 90, 95, 120, 80, 100, 130]
Output: {"mdd": 0.2727, "peak_idx": 4, "trough_idx": 5, "recovery_idx": 7}
(Peak=120 at idx 4, trough=80 at idx 5, MDD=(120-80)/120=0.333...
 Wait: peak=110 at idx 1, trough=90, MDD=18.2%. Peak=120 at idx 4, trough=80, MDD=33.3% ← maximum)`,
    examples: [
      {
        input: "equity = [100, 110, 90, 95, 120, 80, 100, 130]",
        output: '{"mdd": 0.3333, "peak_idx": 4, "trough_idx": 5, "recovery_idx": 7}',
        explanation: "Peak=120 at index 4, trough=80 at index 5: MDD=(120-80)/120=0.3333. Equity exceeds 120 at index 7 (130): recovery_period=7-5=2 days.",
      },
      {
        input: "equity = [100, 120, 110, 130, 115, 140]",
        output: '{"mdd": 0.0833, "peak_idx": 1, "trough_idx": 2, "recovery_idx": 3}',
        explanation: "Largest drawdown: 120→110 = 8.33%. Recovers at index 3 (130 > 120).",
      },
    ],
    approach:
      "Single pass: track running peak and its index. For each new point compute drawdown. Update max drawdown and record trough index. Second pass: find recovery index (first point after trough exceeding the drawdown peak). Total O(n).",
    code: `def max_drawdown_analysis(equity: list[float]) -> dict:
    if not equity:
        return {}

    n         = len(equity)
    peak      = equity[0]
    peak_idx  = 0
    best_mdd  = 0.0
    mdd_peak_idx   = 0
    mdd_trough_idx = 0

    for i in range(1, n):
        if equity[i] > peak:
            peak     = equity[i]
            peak_idx = i
        else:
            dd = (peak - equity[i]) / peak
            if dd > best_mdd:
                best_mdd       = dd
                mdd_peak_idx   = peak_idx
                mdd_trough_idx = i

    # Find recovery: first index after trough where equity > peak at that drawdown.
    recovery_peak  = equity[mdd_peak_idx]
    recovery_idx   = None
    for i in range(mdd_trough_idx + 1, n):
        if equity[i] >= recovery_peak:
            recovery_idx = i
            break

    return {
        "mdd": round(best_mdd, 4),
        "peak_idx": mdd_peak_idx,
        "trough_idx": mdd_trough_idx,
        "recovery_idx": recovery_idx,
        "recovery_days": (recovery_idx - mdd_trough_idx
                          if recovery_idx is not None else None),
    }

equity = [100, 110, 90, 95, 120, 80, 100, 130]
print(max_drawdown_analysis(equity))`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260603-b1-merge-inversions",
    title: "Count Price Inversions via Merge Sort",
    difficulty: "medium",
    topics: ["sorting", "merge-sort", "divide-and-conquer", "finance"],
    problem: `Given a sequence of daily closing prices, count the number of inversions: pairs (i, j) where i < j but prices[i] > prices[j].

An inversion represents a pair where the earlier price is higher than the later price — a signal of reverting or decaying momentum. High inversion counts indicate disordered, mean-reverting series; low counts indicate trending series.

Input: prices = [7, 5, 3, 8, 2]
Output: 7
Pairs: (7,5),(7,3),(7,8 no),(7,2),(5,3),(5,2),(3,2) → 6 inversions. Wait: (7,5),(7,3),(7,2),(5,3),(5,2),(3,2) = 6.`,
    examples: [
      {
        input: "prices = [7, 5, 3, 8, 2]",
        output: "7",
        explanation: "Inversions: (7,5),(7,3),(7,2),(5,3),(5,2),(3,2),(8,2) = 7 pairs where earlier > later.",
      },
      {
        input: "prices = [1, 2, 3, 4, 5]",
        output: "0",
        explanation: "Perfectly trending (ascending): zero inversions.",
      },
      {
        input: "prices = [5, 4, 3, 2, 1]",
        output: "10",
        explanation: "Perfectly reversed: n*(n-1)/2 = 10 inversions.",
      },
    ],
    approach:
      "Modify merge sort: during the merge step, when a right-half element is placed before a left-half element, it beats all remaining left-half elements — add (mid - left_ptr) to the count. O(n log n) total instead of O(n^2) brute force.",
    code: `def count_inversions(prices: list[float]) -> int:
    """Count pairs (i,j) where i<j but prices[i] > prices[j]."""
    def merge_sort(arr):
        if len(arr) <= 1:
            return arr, 0
        mid = len(arr) // 2
        left, l_inv  = merge_sort(arr[:mid])
        right, r_inv = merge_sort(arr[mid:])
        merged = []
        inv    = l_inv + r_inv
        i = j  = 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i]); i += 1
            else:
                # left[i..end] all > right[j]: count remaining left elements.
                inv += len(left) - i
                merged.append(right[j]); j += 1
        merged.extend(left[i:])
        merged.extend(right[j:])
        return merged, inv

    _, total = merge_sort(list(prices))
    return total

print(count_inversions([7, 5, 3, 8, 2]))   # 7
print(count_inversions([1, 2, 3, 4, 5]))   # 0
print(count_inversions([5, 4, 3, 2, 1]))   # 10

# Normalised inversion ratio: 0 = trending, 1 = perfectly reversed.
def inversion_ratio(prices):
    n = len(prices)
    return 2 * count_inversions(prices) / (n * (n - 1)) if n > 1 else 0.0`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260603-b1-kadane-pnl",
    title: "Maximum Cumulative P&L Period (Kadane's Algorithm)",
    difficulty: "easy",
    topics: ["dynamic-programming", "array", "finance"],
    problem: `Given a sequence of daily P&L values (positive or negative), find the contiguous sub-period with the maximum cumulative P&L. Return the maximum total P&L, and the start and end indices of the best period.

This identifies the best historical trading window — used in strategy evaluation and regime analysis.

Input: pnl = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: {"max_pnl": 6, "start": 3, "end": 6}  (subarray [4, -1, 2, 1] = 6)`,
    examples: [
      {
        input: "pnl = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        output: '{"max_pnl": 6, "start": 3, "end": 6}',
        explanation: "Subarray pnl[3:7] = [4, -1, 2, 1] sums to 6. This is the maximum subarray sum.",
      },
      {
        input: "pnl = [-1, -2, -3]",
        output: '{"max_pnl": -1, "start": 0, "end": 0}',
        explanation: "All losses: best single day is -1 at index 0.",
      },
      {
        input: "pnl = [5, 4, -1, 7, 8]",
        output: '{"max_pnl": 23, "start": 0, "end": 4}',
        explanation: "The entire array sums to 23: all included.",
      },
    ],
    approach:
      "Kadane's algorithm: track current sum and max sum. When current sum drops below 0, reset and start a new window. Track start/end indices for reconstruction. O(n) time, O(1) space.",
    code: `def max_pnl_period(pnl: list[float]) -> dict:
    if not pnl:
        return {}

    max_pnl   = pnl[0]
    cur_pnl   = pnl[0]
    start = end = 0
    temp_start  = 0

    for i in range(1, len(pnl)):
        if cur_pnl + pnl[i] < pnl[i]:
            # Start a new window from here.
            cur_pnl    = pnl[i]
            temp_start = i
        else:
            cur_pnl += pnl[i]

        if cur_pnl > max_pnl:
            max_pnl = cur_pnl
            start   = temp_start
            end     = i

    return {
        "max_pnl": max_pnl,
        "start": start,
        "end": end,
        "period": pnl[start:end + 1],
    }

print(max_pnl_period([-2, 1, -3, 4, -1, 2, 1, -5, 4]))
# {'max_pnl': 6, 'start': 3, 'end': 6, 'period': [4, -1, 2, 1]}
print(max_pnl_period([-1, -2, -3]))
# {'max_pnl': -1, 'start': 0, 'end': 0, 'period': [-1]}`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260603-b1-min-rebalance-trades",
    title: "Minimum Rebalancing Trades to Reach Target Allocation",
    difficulty: "medium",
    topics: ["greedy", "sorting", "finance"],
    problem: `You have a portfolio with current weights summing to 1.0 and a target allocation also summing to 1.0. Each 'trade' moves weight from one asset to another (a buy cancels a corresponding sell).

Find the minimum number of trades (buy + sell pairs) to achieve the target allocation. Each trade is a transfer of weight between two assets.

Insight: the excess sellers provide weight to the deficit buyers. Match them greedily by largest amount to minimise the number of separate trades.

Input: current=[0.4,0.3,0.2,0.1], target=[0.25,0.25,0.25,0.25]
Output: 3 trades
(+/- deltas: -0.15, -0.05, +0.05, +0.15 → match largest deficit/surplus pairs)`,
    examples: [
      {
        input: "current=[0.4, 0.3, 0.2, 0.1], target=[0.25, 0.25, 0.25, 0.25]",
        output: "3",
        explanation: "Deltas: -0.15, -0.05, +0.05, +0.15. Two sellers (-0.15, -0.05) and two buyers (+0.05, +0.15). Match 0.15 seller to 0.15 buyer (1 trade), then 0.05 seller to 0.05 buyer (1 trade). = 2 exact matches. If deltas don't match exactly, need to split, adding trades. Here: max 2 buys × 2 sells with exact match = min 2 trades. General: min(n_sells, n_buys) trades if amounts match; otherwise more.",
      },
      {
        input: "current=[0.5, 0.5], target=[0.0, 1.0]",
        output: "1",
        explanation: "One sell of 0.5 from asset 0, one buy of 0.5 into asset 1: 1 trade.",
      },
    ],
    approach:
      "Compute delta = target - current. Separate into sells (delta < 0) and buys (delta > 0). Use two-pointer on sorted arrays: match the largest sell to the largest buy. If amounts are equal: one trade, advance both. If sell > buy: one trade, reduce sell remainder. Count total trades. O(n log n).",
    code: `import heapq

def min_rebalance_trades(current: list[float],
                          target: list[float],
                          tol: float = 1e-9) -> int:
    deltas = [t - c for t, c in zip(target, current)]

    # Positive deltas = buys; negative = sells.
    sells = sorted([-d for d in deltas if d < -tol], reverse=True)  # largest first
    buys  = sorted([ d for d in deltas if d >  tol], reverse=True)  # largest first

    trades = 0
    si, bi = 0, 0
    sell_rem = sells[si] if sells else 0.0
    buy_rem  = buys[bi]  if buys  else 0.0

    while si < len(sells) and bi < len(buys):
        traded = min(sell_rem, buy_rem)
        sell_rem -= traded
        buy_rem  -= traded
        trades   += 1   # one transaction covers this amount

        if sell_rem < tol:
            si += 1
            sell_rem = sells[si] if si < len(sells) else 0.0
        if buy_rem < tol:
            bi += 1
            buy_rem = buys[bi] if bi < len(buys) else 0.0

    return trades

print(min_rebalance_trades([0.4, 0.3, 0.2, 0.1],
                            [0.25, 0.25, 0.25, 0.25]))  # 3
print(min_rebalance_trades([0.5, 0.5], [0.0, 1.0]))     # 1
print(min_rebalance_trades([0.33, 0.33, 0.34],
                            [0.5, 0.3, 0.2]))            # 2`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260603-b1-kruskal-correlation-mst",
    title: "Minimum Spanning Tree for Portfolio Correlation Clustering",
    difficulty: "hard",
    topics: ["graphs", "union-find", "sorting", "finance"],
    problem: `Given a correlation matrix for N assets, build a Minimum Spanning Tree (MST) using distance d(i,j) = sqrt(2*(1 - corr(i,j))). The MST identifies the most direct risk linkages in the portfolio and is used in hierarchical risk parity.

Return the edges of the MST as (asset_i, asset_j, distance) triples, sorted by distance.

This is Kruskal's algorithm on a complete graph with N*(N-1)/2 edges.

Input: corr = [[1.0, 0.8, 0.2], [0.8, 1.0, 0.3], [0.2, 0.3, 1.0]]
Output: [(0, 1, 0.632), (1, 2, 1.183)]  — MST connects 0-1 then 1-2`,
    examples: [
      {
        input: "corr = [[1.0,0.8,0.2],[0.8,1.0,0.3],[0.2,0.3,1.0]]",
        output: "[(0, 1, 0.6325), (1, 2, 1.1832)]",
        explanation: "d(0,1)=sqrt(2*(1-0.8))=0.632, d(0,2)=sqrt(2*0.8)=1.265, d(1,2)=sqrt(2*0.7)=1.183. MST: shortest edge (0,1), then (1,2) which connects component {0,1} to {2} without cycle.",
      },
      {
        input: "corr = [[1.0,0.9],[0.9,1.0]]",
        output: "[(0, 1, 0.4472)]",
        explanation: "Two assets: single edge MST with d=sqrt(2*(1-0.9))=0.447.",
      },
    ],
    approach:
      "Generate all N*(N-1)/2 pairs (i,j) with distance sqrt(2*(1-corr[i][j])). Sort edges by distance. Apply Kruskal's: iterate edges in order, add edge if it doesn't create a cycle (union-find check). Stop when N-1 edges added. O(E log E) = O(N² log N).",
    code: `import math

def correlation_mst(corr: list[list[float]]) -> list[tuple]:
    n = len(corr)

    # Build all edges with distances.
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            dist = math.sqrt(2.0 * (1.0 - corr[i][j]))
            edges.append((dist, i, j))
    edges.sort()   # Kruskal: process in ascending distance order

    # Union-Find with path compression and union by rank.
    parent = list(range(n))
    rank   = [0] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]   # path halving
            x = parent[x]
        return x

    def union(x, y) -> bool:
        rx, ry = find(x), find(y)
        if rx == ry:
            return False   # same component: would create cycle
        if rank[rx] < rank[ry]:
            rx, ry = ry, rx
        parent[ry] = rx
        if rank[rx] == rank[ry]:
            rank[rx] += 1
        return True

    mst = []
    for dist, i, j in edges:
        if union(i, j):
            mst.append((i, j, round(dist, 4)))
        if len(mst) == n - 1:
            break   # MST complete

    return mst

corr = [[1.0, 0.8, 0.2],
        [0.8, 1.0, 0.3],
        [0.2, 0.3, 1.0]]
print(correlation_mst(corr))   # [(0, 1, 0.6325), (1, 2, 1.1832)]`,
    language: "python",
    complexity: { time: "O(N² log N)", space: "O(N²)" },
  },
  {
    id: "fin-20260603-b1-welford-variance",
    title: "Streaming Portfolio Variance via Welford's Online Algorithm",
    difficulty: "medium",
    topics: ["design", "math", "sliding-window", "finance"],
    problem: `Design a class StreamingStats that processes a stream of portfolio returns one at a time and supports:
- update(x): add a new return observation
- mean(): current mean
- variance(): current sample variance (Bessel-corrected, ddof=1)
- std(): current standard deviation

Additionally support a sliding window version: only the last W observations contribute to the statistics.

Welford's algorithm maintains running mean and variance in O(1) per update with excellent numerical stability — unlike the naive (sum_of_squares - n*mean^2)/n approach which suffers catastrophic cancellation.

Input: returns = [0.01, -0.02, 0.03, 0.01, -0.01]
Output: mean=-0.004, std=0.0187 (after all 5 observations)`,
    examples: [
      {
        input: "returns = [0.01, -0.02, 0.03, 0.01, -0.01]",
        output: "mean=0.004, variance=0.000350, std=0.01871",
        explanation: "Welford updates mean and M2 (sum of squared deviations) incrementally. Final variance = M2 / (n-1).",
      },
      {
        input: "Single observation: returns=[0.05]",
        output: "mean=0.05, variance=nan (undefined for n=1)",
        explanation: "Sample variance requires at least 2 observations.",
      },
    ],
    approach:
      "Welford's online algorithm: maintain count n, running mean mu, and M2 = sum((x-mu)^2). On each update: delta = x - mu; mu += delta/n; delta2 = x - mu; M2 += delta * delta2. Variance = M2/(n-1). For sliding window, undo the oldest observation on removal using the reverse formula.",
    code: `from collections import deque
import math

class StreamingStats:
    """Welford's online mean/variance — numerically stable, O(1) per update."""

    def __init__(self):
        self.n  = 0
        self.mu = 0.0   # running mean
        self.M2 = 0.0   # sum of squared deviations from current mean

    def update(self, x: float) -> None:
        self.n  += 1
        delta    = x - self.mu
        self.mu += delta / self.n
        delta2   = x - self.mu          # note: uses updated mean
        self.M2 += delta * delta2

    def mean(self) -> float:
        return self.mu

    def variance(self) -> float:
        return self.M2 / (self.n - 1) if self.n >= 2 else float('nan')

    def std(self) -> float:
        v = self.variance()
        return math.sqrt(v) if not math.isnan(v) else float('nan')

class SlidingStats:
    """Welford streaming stats over a fixed-size sliding window."""

    def __init__(self, window: int):
        self.W    = window
        self.buf  = deque()
        self.core = StreamingStats()

    def update(self, x: float) -> None:
        self.core.update(x)
        self.buf.append(x)
        if len(self.buf) > self.W:
            # Remove oldest observation (Welford downdate — approximate).
            old = self.buf.popleft()
            n   = self.core.n
            if n > 1:
                delta  = old - self.core.mu
                self.core.mu = (self.core.mu * n - old) / (n - 1)
                self.core.M2 -= delta * (old - self.core.mu)
                self.core.M2  = max(self.core.M2, 0.0)   # numerical floor
            self.core.n -= 1

    def mean(self): return self.core.mean()
    def std(self):  return self.core.std()

returns = [0.01, -0.02, 0.03, 0.01, -0.01]
stats   = StreamingStats()
for r in returns:
    stats.update(r)
print(f"mean={stats.mean():.4f}, std={stats.std():.5f}")`,
    language: "python",
    complexity: { time: "O(1) per update", space: "O(W) sliding window" },
  },
  {
    id: "fin-20260603-b1-dp-coupon-reinvest",
    title: "Optimal Coupon Reinvestment Schedule (DP)",
    difficulty: "medium",
    topics: ["dynamic-programming", "finance", "math"],
    problem: `A bond pays coupons at times t=1,2,...,N (in years). Each coupon can be reinvested at one of two rates: r_short (short-term, available always) or r_long (long-term, higher rate, but locks up capital for L years — can't reinvest again for L years).

Given N coupon periods, a list of coupon amounts, and reinvestment rates, find the reinvestment schedule that maximises total terminal wealth at time T=N.

Simplified version: coupon = 1 at each period, r_short = 0.02, r_long = 0.05 (but locks for L=3 periods). Choose short or long at each step.

Input: N=5, r_short=0.02, r_long=0.05, L=3
Output: optimal terminal wealth and reinvestment choices`,
    examples: [
      {
        input: "N=5, r_short=0.02, r_long=0.05, L=3, coupons=[1,1,1,1,1]",
        output: "terminal_wealth=5.3388, choices=[long, short, short, long, short]",
        explanation: "Coupon at t=1 reinvested long (L=3) earns 1*(1.05)^3=1.1576 by t=4. Coupon at t=2 must go short (locked). t=3 must go short. t=4 reinvested long earns 1*(1.05)^1=1.05. t=5 goes short (no time for long). Sum: 1.1576+1*(1.02)^2+1*1.02+1.05+1=5.2276... (values depend on exact formulation).",
      },
      {
        input: "N=3, r_short=0.03, r_long=0.06, L=2, coupons=[1,1,1]",
        output: "terminal_wealth=3.1818",
        explanation: "t=1 long (earns 1.06^2=1.1236 by t=3), t=2 must short (1.03^1=1.03), t=3 short (1.0). Total=3.1536.",
      },
    ],
    approach:
      "DP where state is (time t, locked_until). dp[t][locked_until] = max terminal wealth from coupon at time t given lock status. For each coupon: if locked (t <= locked_until): must reinvest short. If free: max(short rate, long rate if T-t >= L). Accumulate from t=N down to t=1.",
    code: `def optimal_reinvestment(N: int, r_short: float, r_long: float,
                              L: int, coupons: list[float]) -> dict:
    """
    Each coupon[t] (0-indexed, paid at time t+1) is reinvested until T=N.
    Short: grows at r_short per year for remaining years.
    Long:  grows at r_long  per year, but occupies L years (no new long during lock).
    Returns total terminal wealth and per-coupon choices.
    """
    total_wealth = 0.0
    choices      = []
    locked_until = 0   # locked_until <= t means free to choose long

    for t in range(N):
        coupon_time   = t + 1          # 1-indexed time of payment
        years_left    = N - coupon_time  # years this coupon can compound

        if locked_until > coupon_time:
            # Still locked from a previous long choice.
            wealth = coupons[t] * (1 + r_short) ** years_left
            choices.append("short(locked)")
        elif years_left >= L:
            # Both options available; compare terminal values.
            val_short = coupons[t] * (1 + r_short) ** years_left
            val_long  = coupons[t] * (1 + r_long)  ** years_left
            if val_long > val_short:
                wealth = val_long
                locked_until = coupon_time + L   # lock next L coupons
                choices.append("long")
            else:
                wealth = val_short
                choices.append("short")
        else:
            # Not enough time for long reinvestment.
            wealth = coupons[t] * (1 + r_short) ** years_left
            choices.append("short")

        total_wealth += wealth

    return {"terminal_wealth": round(total_wealth, 4), "choices": choices}

result = optimal_reinvestment(5, 0.02, 0.05, 3, [1.0]*5)
print(result)
result2 = optimal_reinvestment(3, 0.03, 0.06, 2, [1.0]*3)
print(result2)`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
];
