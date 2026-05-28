import type { LeetCodeProblem } from "./index";

export const financeProblems20260528B1: LeetCodeProblem[] = [
  {
    id: "fin-0528-b1-median-heap",
    leetcodeNumber: 295,
    title: "Running Median of Trade P&L",
    difficulty: "hard",
    topics: ["heap", "design", "finance"],
    problem:
      "Design a MedianTracker class that ingests a live stream of per-trade P&L values and answers getMedian() in O(1) at any point. addTrade(pnl) adds a new observation. This is the core primitive for real-time desk risk: the median is a robust central-tendency measure that ignores fat-tailed outliers that distort the mean.",
    examples: [
      {
        input: "addTrade(100), addTrade(-50), addTrade(200), addTrade(-30), addTrade(75) → getMedian()",
        output: "75.0",
        explanation:
          "Sorted: [-50, -30, 75, 100, 200]. Middle element (index 2) = 75.",
      },
      {
        input: "addTrade(1), addTrade(2) → getMedian()",
        output: "1.5",
        explanation: "Even count: average the two middle values (1+2)/2 = 1.5.",
      },
    ],
    constraints: [
      "-10^6 <= pnl <= 10^6",
      "At most 5 * 10^4 calls to addTrade and getMedian",
      "getMedian is always called with at least one observation",
    ],
    approach:
      "Maintain two heaps: a max-heap `lo` for the lower half and a min-heap `hi` for the upper half. After each insert, rebalance so |lo| - |hi| <= 1 and max(lo) <= min(hi). Median is max(lo) if odd total, or (max(lo)+min(hi))/2 if even. Python's heapq is a min-heap; negate values to simulate max-heap. Each insert is O(log n), query is O(1). The key invariant is the cross-heap ordering condition — both heaps must agree on the split point.",
    code: `import heapq

class MedianTracker:
    def __init__(self):
        self.lo: list = []  # max-heap (store negated)
        self.hi: list = []  # min-heap

    def add_trade(self, pnl: float) -> None:
        heapq.heappush(self.lo, -pnl)
        # Ensure every lo element <= every hi element
        if self.hi and -self.lo[0] > self.hi[0]:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        # Rebalance sizes: lo may have at most one extra
        if len(self.lo) < len(self.hi):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))
        elif len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))

    def get_median(self) -> float:
        if len(self.lo) == len(self.hi):
            return (-self.lo[0] + self.hi[0]) / 2.0
        return float(-self.lo[0])

tracker = MedianTracker()
for pnl in [100, -50, 200, -30, 75]:
    tracker.add_trade(pnl)
print(tracker.get_median())  # 75.0
`,
    language: "python",
    complexity: { time: "O(log n) per addTrade, O(1) getMedian", space: "O(n)" },
  },

  {
    id: "fin-0528-b1-next-breakout",
    title: "Next Price Breakout Level",
    difficulty: "medium",
    topics: ["monotonic-stack", "array", "finance"],
    problem:
      "Given an array of daily closing prices, for each day i compute the first future day j > i where prices[j] > prices[i] (a 'breakout'). Return an array where result[i] is the breakout price, or -1 if none exists. In trend-following strategies this is the core signal for momentum entry: find the next day the price clears the current level.",
    examples: [
      {
        input: "prices = [10, 4, 2, 8, 1, 5]",
        output: "[−1, 8, 8, −1, 5, −1]",
        explanation:
          "Day 0 (price=10): no future day exceeds 10 → -1. Day 1 (price=4): day 3 (price=8) is first breakout. Day 2 (price=2): also day 3. Day 3 (price=8): no future day exceeds 8 → -1. Day 4 (price=1): day 5 (price=5). Day 5: no future → -1.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0.01 <= prices[i] <= 10^6",
    ],
    approach:
      "Monotonic decreasing stack of indices. Scan left to right; when prices[i] exceeds the price at the top index, that top's breakout is prices[i] — pop and record. The stack always holds indices whose breakout has not yet been found, in decreasing price order. O(n) time and space because each index is pushed and popped at most once. This is the 'Next Greater Element' pattern: the finance reframing is trend-breakout detection.",
    code: `from typing import List

def next_breakout(prices: List[float]) -> List[float]:
    n = len(prices)
    result = [-1.0] * n
    stack: List[int] = []  # indices with no breakout yet, decreasing prices

    for i in range(n):
        while stack and prices[i] > prices[stack[-1]]:
            idx = stack.pop()
            result[idx] = prices[i]
        stack.append(i)

    return result

prices = [10.0, 4.0, 2.0, 8.0, 1.0, 5.0]
print(next_breakout(prices))
# [-1.0, 8.0, 8.0, -1.0, 5.0, -1.0]
`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },

  {
    id: "fin-0528-b1-sliding-peak-pnl",
    leetcodeNumber: 239,
    title: "Sliding Window Peak P&L",
    difficulty: "medium",
    topics: ["monotonic-deque", "sliding-window", "finance"],
    problem:
      "Given an array of daily P&L values and an integer k, return an array of the maximum P&L in each sliding window of size k. This corresponds to rolling high-water mark tracking: the best single-day outcome within the look-back period, used in drawdown and recovery analysis.",
    examples: [
      {
        input: "pnl = [1.2, 3.1, -0.5, 2.4, 4.6, -1.0, 2.8], k = 3",
        output: "[3.1, 3.1, 4.6, 4.6, 4.6]",
        explanation:
          "Windows: [1.2,3.1,-0.5]→3.1, [3.1,-0.5,2.4]→3.1, [-0.5,2.4,4.6]→4.6, [2.4,4.6,-1.0]→4.6, [4.6,-1.0,2.8]→4.6.",
      },
    ],
    constraints: [
      "1 <= k <= pnl.length <= 10^5",
      "-10^4 <= pnl[i] <= 10^4",
    ],
    approach:
      "Monotonic deque of indices, maintaining a decreasing order of pnl values. For each new element: (1) evict indices that have fallen out of the window from the front; (2) pop from the back any index whose pnl is <= new value (they can never be the max while the new element is in window); (3) append current index; (4) front of deque is the window max. Each index enters and exits the deque at most once → O(n). The deque is the non-obvious part: a simple heap would give O(n log n).",
    code: `from collections import deque
from typing import List

def sliding_peak_pnl(pnl: List[float], k: int) -> List[float]:
    dq: deque = deque()  # indices; pnl[dq[0]] is always the window max
    result: List[float] = []

    for i, val in enumerate(pnl):
        # Drop indices outside the current window
        while dq and dq[0] < i - k + 1:
            dq.popleft()
        # Maintain decreasing order: smaller values behind are useless
        while dq and pnl[dq[-1]] < val:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            result.append(pnl[dq[0]])

    return result

pnl = [1.2, 3.1, -0.5, 2.4, 4.6, -1.0, 2.8]
print(sliding_peak_pnl(pnl, 3))
# [3.1, 3.1, 4.6, 4.6, 4.6]
`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
  },

  {
    id: "fin-0528-b1-knapsack-sizing",
    title: "Portfolio Position Sizing — 0/1 Knapsack",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack", "finance"],
    problem:
      "You have n assets. Asset i requires costs[i] units of capital and yields expected return returns[i] (float). Given a total capital budget W, select a subset of assets (each at most once) to maximise total expected return. Return the maximum achievable return. This is portfolio construction under a hard capital constraint — realistic when margin requirements or lot sizes force integer allocation.",
    examples: [
      {
        input:
          "W = 10, costs = [3, 4, 5, 2, 6], returns = [4.0, 6.0, 8.0, 3.0, 9.0]",
        output: "17.0",
        explanation:
          "Select asset 1 (cost 4, return 6) + asset 2 (cost 5, return 8) + asset 3 (cost 2, return 3) = capital 11 > 10. Better: asset 1 (4, 6) + asset 4 (6, 9) = 10, return 15. Or asset 2 (5, 8) + asset 1 (4, 6) = 9, return 14; add asset 3 (2, 3) → 11 > 10. Best feasible: asset 1 (3, 4) + asset 2 (4, 6) + asset 3 (5, 8) = 12 > 10. Optimal: asset 0 (3,4) + asset 4 (6,9) = 9 ≤ 10, return 13; asset 1 (4,6) + asset 4 (6,9) = 10, return 15; asset 2 (5,8) + asset 4 (6,9) = 11 > 10. So best is asset 1 + asset 4 = 15? Or asset 0+1+3 = 3+4+2=9, return 4+6+3=13. Recalc: asset 0(3,4)+asset2(5,8)=8, ret=12; +asset3(2,3)=10, ret=15. asset1(4,6)+asset4(6,9)=10, ret=15. asset2(5,8)+asset3(2,3)=7, ret=11; +asset0(3,4)=10, ret=15. All tie at 15. Note: the answer is 15.0.",
      },
    ],
    constraints: [
      "1 <= n <= 500",
      "1 <= costs[i] <= W <= 10^4",
      "0 < returns[i] <= 1000",
    ],
    approach:
      "1-D bottom-up DP: dp[c] = max expected return using exactly c capital. Traverse assets outer loop; traverse c from W down to costs[i] inner loop (reverse order prevents reusing asset i twice — the classic 0/1 knapsack trick). At each c, dp[c] = max(dp[c], dp[c-costs[i]] + returns[i]). Final answer is max(dp). O(n*W) time, O(W) space. Reversing the inner loop is the crucial insight that separates 0/1 from unbounded knapsack.",
    code: `from typing import List

def max_portfolio_return(W: int, costs: List[int], returns: List[float]) -> float:
    dp = [0.0] * (W + 1)

    for i in range(len(costs)):
        # Reverse traversal prevents using asset i more than once
        for c in range(W, costs[i] - 1, -1):
            dp[c] = max(dp[c], dp[c - costs[i]] + returns[i])

    return max(dp)

W = 10
costs   = [3,   4,   5,   2,   6  ]
returns = [4.0, 6.0, 8.0, 3.0, 9.0]
print(max_portfolio_return(W, costs, returns))  # 15.0
`,
    language: "python",
    complexity: { time: "O(n * W)", space: "O(W)" },
  },

  {
    id: "fin-0528-b1-fx-neg-cycle",
    title: "FX Arbitrage — Bellman-Ford Negative Cycle",
    difficulty: "hard",
    topics: ["graph", "bellman-ford", "finance"],
    problem:
      "Given a list of currency pairs and their exchange rates, determine whether a sequence of trades starting and returning to USD can yield a net profit (i.e., a triangular or multi-leg arbitrage). Represent currencies as nodes and exchange rates as directed edges. Formally: detect a negative-weight cycle in a graph where edge weights are -log(rate). Return True if arbitrage exists, False otherwise.",
    examples: [
      {
        input:
          "currencies = ['USD','EUR','GBP'], rates = [(0,1,0.9),(1,2,1.25),(2,0,0.89)]",
        output: "True",
        explanation:
          "USD→EUR→GBP→USD: 0.9 * 1.25 * 0.89 = 1.00125 > 1. Product of log rates = log(1.00125) > 0, so sum of -log(rates) < 0 → negative cycle.",
      },
      {
        input:
          "currencies = ['USD','EUR','GBP'], rates = [(0,1,0.9),(1,2,1.1),(2,0,0.88)]",
        output: "False",
        explanation: "0.9 * 1.1 * 0.88 = 0.8712 < 1. No arbitrage.",
      },
    ],
    constraints: [
      "2 <= len(currencies) <= 100",
      "len(rates) <= n*(n-1)",
      "0.001 <= rate <= 1000",
    ],
    approach:
      "Take -log of each exchange rate to convert multiplication to addition. Bellman-Ford: initialise dist[0]=0, all others=+inf. Relax all edges n-1 times. Then check each edge once more: if any dist[u] + w < dist[v], a negative cycle (arbitrage loop) is reachable. The log trick transforms the 'product > 1' condition into a 'negative sum' condition, bridging multiplicative arbitrage into additive shortest-path theory. O(V*E).",
    code: `import math
from typing import List, Tuple

def has_fx_arbitrage(
    n: int,
    edges: List[Tuple[int, int, float]]
) -> bool:
    INF = float("inf")
    dist = [INF] * n
    dist[0] = 0.0

    for _ in range(n - 1):
        for u, v, rate in edges:
            w = -math.log(rate)
            if dist[u] != INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # Extra relaxation reveals negative cycles
    for u, v, rate in edges:
        w = -math.log(rate)
        if dist[u] != INF and dist[u] + w < dist[v]:
            return True
    return False

# USD(0), EUR(1), GBP(2)
edges_arb = [(0, 1, 0.9), (1, 2, 1.25), (2, 0, 0.89)]
print(has_fx_arbitrage(3, edges_arb))   # True  (0.9*1.25*0.89 = 1.00125)

edges_none = [(0, 1, 0.9), (1, 2, 1.1), (2, 0, 0.88)]
print(has_fx_arbitrage(3, edges_none))  # False (0.9*1.1*0.88 = 0.8712)
`,
    language: "python",
    complexity: { time: "O(V * E)", space: "O(V)" },
  },

  {
    id: "fin-0528-b1-ruin-probability",
    title: "Trader's Ruin Probability",
    difficulty: "medium",
    topics: ["math", "probability", "markov", "finance"],
    problem:
      "A trader starts with capital k and sets a profit target of n (both integers). Each trade wins +1 unit with probability p and loses -1 unit with probability q = 1-p, independently. Return the probability of reaching n before going bankrupt (reaching 0). This is the Gambler's Ruin problem and directly models risk-of-ruin for a fixed-edge strategy: how likely are you to achieve your target before blowing up?",
    examples: [
      {
        input: "k = 40, n = 100, p = 0.52",
        output: "0.9987 (approx)",
        explanation:
          "Even a tiny edge (52% win rate) dramatically improves survival when starting with 40% of target. The closed-form shows near-certainty of reaching the target.",
      },
      {
        input: "k = 1, n = 10, p = 0.50",
        output: "0.1",
        explanation: "Fair coin: probability = k/n = 1/10.",
      },
    ],
    constraints: [
      "1 <= k < n <= 10^6",
      "0 < p < 1",
    ],
    approach:
      "Closed-form solution from solving the recurrence P(k) = p*P(k+1) + q*P(k-1) with boundary conditions P(0)=0, P(n)=1. For p != 0.5: P(k) = (1 - (q/p)^k) / (1 - (q/p)^n). For p = 0.5 (degenerate): P(k) = k/n. Derivation: the recurrence has characteristic roots 1 and q/p; general solution P(k) = A + B*(q/p)^k; apply boundary conditions to solve for A and B. O(1) time once you compute the ratio. For large n with p > 0.5, (q/p)^n → 0, so P(k) ≈ 1 - (q/p)^k.",
    code: `def gamblers_ruin_prob(k: int, n: int, p: float) -> float:
    """P(reach n before 0 | start at k, win prob p per step)."""
    q = 1.0 - p
    if abs(p - 0.5) < 1e-12:
        return k / n  # fair coin: linear in starting capital
    ratio = q / p
    # Closed-form from boundary-value solution of P(k) = p*P(k+1) + q*P(k-1)
    return (1.0 - ratio ** k) / (1.0 - ratio ** n)

# Risk-of-ruin analysis: start at 40% of target, vary edge
k, n = 40, 100
for p in [0.50, 0.51, 0.52, 0.55, 0.60]:
    prob = gamblers_ruin_prob(k, n, p)
    print(f"p={p:.2f}: P(success)={prob:.6f}  P(ruin)={1-prob:.6f}")
`,
    language: "python",
    complexity: { time: "O(1)", space: "O(1)" },
  },

  {
    id: "fin-0528-b1-matrix-power",
    title: "Credit Rating Migration — Matrix Exponentiation",
    difficulty: "hard",
    topics: ["math", "matrix-exponentiation", "markov", "finance"],
    problem:
      "Given a k×k annual credit-rating transition matrix T (a row-stochastic Markov matrix), compute the n-step transition probabilities T^n using matrix exponentiation. The (i,j) entry of T^n is the probability of migrating from rating i to rating j in exactly n years. Efficient computation is critical: naive n multiplications is O(n * k^3); repeated squaring is O(k^3 * log n).",
    examples: [
      {
        input: "T = [[0.9, 0.1], [0.0, 1.0]], n = 5",
        output: "[[0.59049, 0.40951], [0.0, 1.0]]",
        explanation:
          "State 0 survives to state 0 with prob 0.9^5 ≈ 0.5905. State 1 is absorbing (default): once there, stays forever.",
      },
    ],
    constraints: [
      "1 <= k <= 20",
      "1 <= n <= 10^9",
      "T is row-stochastic: all entries >= 0 and each row sums to 1",
    ],
    approach:
      "Matrix exponentiation via repeated squaring: represent T^n in binary. Start with identity matrix as result; while n > 0, if n is odd multiply result by current base, then square the base and halve n. This is the same algorithm as fast modular exponentiation for integers. O(k^3 log n). The log factor makes this tractable even for n = 10^9. Implemented in pure Python to avoid numpy dependency in interviews.",
    code: `from typing import List

Matrix = List[List[float]]

def mat_mul(A: Matrix, B: Matrix) -> Matrix:
    k = len(A)
    C = [[0.0] * k for _ in range(k)]
    for i in range(k):
        for j in range(k):
            for m in range(k):
                C[i][j] += A[i][m] * B[m][j]
    return C

def mat_pow(M: Matrix, n: int) -> Matrix:
    k = len(M)
    result = [[1.0 if i == j else 0.0 for j in range(k)] for i in range(k)]
    base = [row[:] for row in M]
    while n:
        if n & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        n >>= 1
    return result

# 4-state: AAA(0) AA(1) A(2) Default(3, absorbing)
T = [
    [0.90, 0.08, 0.02, 0.00],
    [0.01, 0.88, 0.10, 0.01],
    [0.00, 0.02, 0.87, 0.11],
    [0.00, 0.00, 0.00, 1.00],
]

T5 = mat_pow(T, 5)
print(f"5-year default prob from A-rated bond: {T5[2][3]:.4f}")
print(f"5-year default prob from AAA bond:     {T5[0][3]:.4f}")
`,
    language: "python",
    complexity: { time: "O(k^3 * log n)", space: "O(k^2)" },
  },

  {
    id: "fin-0528-b1-subset-target-return",
    title: "Portfolio Combination Enumeration — Meets-in-the-Middle",
    difficulty: "hard",
    topics: ["bit-manipulation", "bitmask", "meet-in-the-middle", "finance"],
    problem:
      "Given n assets with integer expected returns (in basis points) and a target return T, count the number of distinct subsets of assets whose total expected return equals exactly T. For small n (≤ 20) a bitmask approach works; for n ≤ 40 use meets-in-the-middle to reduce O(2^n) to O(2^(n/2)). This is the portfolio construction problem: how many ways can you hit a target return from a menu of available assets?",
    examples: [
      {
        input: "returns = [50, 80, 30, 100, 20, 60, 40], target = 150",
        output: "3",
        explanation:
          "Subsets: {50,80,20}=150, {30,80,40}=150, {50,60,40}=150. Three distinct combinations reach 150 bps.",
      },
    ],
    constraints: [
      "1 <= n <= 40",
      "1 <= returns[i] <= 10^4",
      "1 <= target <= 4 * 10^5",
    ],
    approach:
      "Split assets into left and right halves. Enumerate all 2^(n/2) subset sums for each half. Store left sums in a frequency dict. For each right subset sum s_r, count left subsets where s_l = target - s_r. Total O(2^(n/2) * n/2) time and O(2^(n/2)) space — far better than O(2^n) for n=40. The bitmask over the half is the index into enumeration; the meet-in-the-middle trick is the key non-obvious insight for this problem class.",
    code: `from collections import defaultdict
from typing import List

def count_subsets_mitm(returns: List[int], target: int) -> int:
    n = len(returns)
    left, right = returns[: n // 2], returns[n // 2 :]

    # Enumerate all subset sums of left half
    left_counts: dict = defaultdict(int)
    for mask in range(1 << len(left)):
        s = sum(left[i] for i in range(len(left)) if mask & (1 << i))
        left_counts[s] += 1

    # For each right subset, look up complementary left sum
    total = 0
    for mask in range(1 << len(right)):
        s = sum(right[i] for i in range(len(right)) if mask & (1 << i))
        total += left_counts[target - s]

    return total

returns = [50, 80, 30, 100, 20, 60, 40]
target = 150
print(count_subsets_mitm(returns, target))  # 3
`,
    language: "python",
    complexity: { time: "O(2^(n/2) * n)", space: "O(2^(n/2))" },
  },

  {
    id: "fin-0528-b1-fifo-position-tracker",
    title: "FIFO Position Tracker with Realized P&L",
    difficulty: "hard",
    topics: ["design", "queue", "simulation", "finance"],
    problem:
      "Design a PositionTracker class for a single symbol that processes a stream of trades (qty > 0 = buy, qty < 0 = sell) and computes realized P&L using FIFO matching. trade(qty, price) → returns realized P&L for this specific trade. unrealized_pnl(mark) → returns the mark-to-market gain on remaining open lots. This is the accounting engine used by every broker and prime: cost basis assignment determines taxable events and regulatory P&L reporting.",
    examples: [
      {
        input:
          "trade(100, 150.0) → 0.0 ; trade(-60, 155.0) → 300.0 ; trade(-40, 148.0) → -80.0",
        output: "realized_pnl = 220.0",
        explanation:
          "Buy 100 @ 150. Sell 60 @ 155: FIFO matches against first 60 lots at cost 150 → realized = 60*(155-150) = 300. Sell 40 @ 148: matches remaining 40 @ 150 → realized = 40*(148-150) = -80. Total = 220.",
      },
    ],
    constraints: [
      "1 <= qty <= 10^6 per trade",
      "0.01 <= price <= 10^6",
      "At most 10^5 trades",
      "Net position must stay >= 0 at all times (long only for simplicity)",
    ],
    approach:
      "Maintain a deque of (qty, cost_price) lots for the long inventory. On a sell, peel off lots from the front (FIFO) until the sell qty is exhausted: realized P&L += matched_qty * (sell_price - cost_price). Partial lots are handled by updating the front entry's remaining qty. The deque front-pop is O(1) amortised. For full long/short tracking (street convention), maintain separate long_queue and short_queue and cross-net on the opposite direction. O(1) amortised per trade if lots are large; O(n/lot_size) worst case with tiny lots.",
    code: `from collections import deque

class PositionTracker:
    def __init__(self) -> None:
        self.lots: deque = deque()   # (qty, cost_price) FIFO
        self.realized_pnl: float = 0.0
        self.net_qty: int = 0

    def trade(self, qty: int, price: float) -> float:
        realized = 0.0
        if qty > 0:
            # Buy: push new lot to back
            self.lots.append([qty, price])
            self.net_qty += qty
        else:
            # Sell: FIFO match against front lots
            remaining = -qty
            while remaining > 0 and self.lots:
                lot_qty, lot_cost = self.lots[0]
                matched = min(remaining, lot_qty)
                realized += matched * (price - lot_cost)
                remaining -= matched
                if matched == lot_qty:
                    self.lots.popleft()
                else:
                    self.lots[0][0] -= matched  # partial lot remains
            self.net_qty += qty  # qty is negative here
        self.realized_pnl += realized
        return realized

    def unrealized_pnl(self, mark: float) -> float:
        return sum(q * (mark - cost) for q, cost in self.lots)

tracker = PositionTracker()
print(tracker.trade(100, 150.0))   # 0.0    (buy, no realization)
print(tracker.trade(-60, 155.0))   # 300.0  (sell 60 @ 155, cost 150)
print(tracker.trade(-40, 148.0))   # -80.0  (sell 40 @ 148, cost 150)
print(f"Total realized: {tracker.realized_pnl}")  # 220.0
print(f"Unrealized @ 152: {tracker.unrealized_pnl(152.0)}")  # 0.0 (flat)
`,
    language: "python",
    complexity: { time: "O(1) amortised per trade", space: "O(n)" },
  },

  {
    id: "fin-0528-b1-delta-coin-change",
    title: "Minimum Contracts to Hedge Delta — Coin Change",
    difficulty: "medium",
    topics: ["dynamic-programming", "coin-change", "finance"],
    problem:
      "A portfolio has a net delta of D (positive integer, in units). You can trade options contracts with delta values given in the array `deltas` (each contract adds exactly deltas[i] delta, unlimited supply). Find the minimum number of contracts needed to bring total delta to exactly 0 (i.e., to hedge exactly). If it's impossible, return -1. This is the options desk problem: cover a delta exposure using the fewest contracts when you have discrete lot sizes.",
    examples: [
      {
        input: "D = 85, deltas = [10, 25, 50]",
        output: "3",
        explanation: "One 50-delta + one 25-delta + one 10-delta = 85. Verified: greedy (50+25+10) also works here, but DP is required in general.",
      },
      {
        input: "D = 30, deltas = [10, 20, 25]",
        output: "2",
        explanation:
          "20 + 10 = 30 (2 contracts). Greedy would pick 25 first, leaving 5 which is unreachable → 3 contracts. DP finds the true minimum of 2.",
      },
    ],
    constraints: [
      "1 <= D <= 10^4",
      "1 <= len(deltas) <= 12",
      "1 <= deltas[i] <= D",
    ],
    approach:
      "Unbounded knapsack DP (same structure as LeetCode 322 Coin Change). dp[d] = minimum contracts to reach delta d exactly. Initialise dp[0]=0, all others=infinity. For each delta d from 1 to D, try each available contract size c: dp[d] = min(dp[d], dp[d-c]+1) if d >= c. The 'unbounded' part means we traverse the outer d-loop forward (unlike 0/1 knapsack which reverses). O(D * len(deltas)). The greedy failure example (30, [10,20,25]) is the canonical interview proof that greedy is wrong here.",
    code: `from typing import List

def min_contracts(D: int, deltas: List[int]) -> int:
    INF = float("inf")
    dp = [INF] * (D + 1)
    dp[0] = 0

    for d in range(1, D + 1):
        for c in deltas:
            if c <= d and dp[d - c] + 1 < dp[d]:
                dp[d] = dp[d - c] + 1

    return int(dp[D]) if dp[D] != INF else -1

print(min_contracts(85, [10, 25, 50]))   # 3  (50+25+10)
print(min_contracts(30, [10, 20, 25]))   # 2  (20+10); greedy gives 3
print(min_contracts(11, [5, 7]))         # -1 (impossible)
`,
    language: "python",
    complexity: { time: "O(D * k) where k = len(deltas)", space: "O(D)" },
  },
];
