import type { LeetCodeProblem } from "./index";

export const financeProblems20260702B1: LeetCodeProblem[] = [
  {
    id: "fin-20260702-b1-knapsack-portfolio",
    title: "Capital-Constrained Portfolio Allocation (0/1 Knapsack)",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack", "finance"],
    problem: `Given N investment opportunities, each with a projected annual return (in basis points) and a required capital allocation (in $1 000 units), and a total capital budget W, select a subset of investments to maximise total return without exceeding the budget. Each investment can be selected at most once.

Return the maximum total expected return achievable.`,
    examples: [
      {
        input: "returns = [60, 100, 120], capital = [10, 20, 30], W = 50",
        output: "220",
        explanation:
          "Select investments 1 and 2: 100 + 120 = 220 bps, capital 20 + 30 = 50 ≤ 50.",
      },
      {
        input: "returns = [10, 40, 30, 50], capital = [5, 4, 6, 3], W = 10",
        output: "90",
        explanation:
          "Select investments 1 and 3 (40 + 50 = 90 bps, capital 4 + 3 = 7 ≤ 10).",
      },
    ],
    constraints: [
      "1 ≤ N ≤ 200",
      "1 ≤ capital[i] ≤ 1000",
      "1 ≤ returns[i] ≤ 10000",
      "1 ≤ W ≤ 10^4",
    ],
    approach: `Classic 0/1 knapsack DP. Define dp[w] = maximum return using at most w capital. For each investment, iterate dp right-to-left (from W down to capital[i]) so each asset counts at most once. After processing all N assets, dp[W] holds the answer. O(N × W) time, O(W) space — the single-array form avoids a 2-D table.`,
    code: `def max_portfolio_return(returns: list[int], capital: list[int], W: int) -> int:
    dp = [0] * (W + 1)   # dp[w] = max return using at most w capital

    for ret, cap in zip(returns, capital):
        # Right-to-left prevents the same investment being selected twice
        for w in range(W, cap - 1, -1):
            dp[w] = max(dp[w], dp[w - cap] + ret)

    return dp[W]

print(max_portfolio_return([60, 100, 120], [10, 20, 30], 50))    # 220
print(max_portfolio_return([10, 40, 30, 50], [5, 4, 6, 3], 10))  # 90
print(max_portfolio_return([5], [10], 9))                          # 0  (can't afford)`,
    language: "python",
    complexity: { time: "O(N × W)", space: "O(W)" },
  },

  {
    id: "fin-20260702-b1-top-k-trades",
    title: "Top-K Profitable Trades via Min-Heap",
    difficulty: "easy",
    topics: ["heap", "sorting", "finance"],
    problem: `Given a list of daily trade P&L values (in dollars) for an equity desk, return the K largest P&L values in descending order. Use an online heap-based approach that processes each trade once without sorting the full list.`,
    examples: [
      {
        input: "pnls = [4, 1, 7, -2, 3, 9, 0, 5], k = 3",
        output: "[9, 7, 5]",
        explanation: "Top 3 trades by P&L are 9, 7, and 5.",
      },
      {
        input: "pnls = [-5, -1, -3], k = 2",
        output: "[-1, -3]",
        explanation: "Even with all losses, return the two least-bad outcomes.",
      },
    ],
    constraints: [
      "1 ≤ k ≤ len(pnls)",
      "-10^6 ≤ pnls[i] ≤ 10^6",
      "1 ≤ len(pnls) ≤ 10^5",
    ],
    approach: `Maintain a min-heap of size k. Push each P&L; when the heap exceeds k elements, pop the minimum. The heap always holds the k largest values seen so far. Final answer is the heap sorted descending. O(N log k) vs O(N log N) full-sort — critical when streaming millions of fills in real time.`,
    code: `import heapq

def top_k_trades(pnls: list[int], k: int) -> list[int]:
    heap: list[int] = []
    for pnl in pnls:
        heapq.heappush(heap, pnl)
        if len(heap) > k:
            heapq.heappop(heap)   # evict the smallest, keep top-k
    return sorted(heap, reverse=True)

print(top_k_trades([4, 1, 7, -2, 3, 9, 0, 5], 3))  # [9, 7, 5]
print(top_k_trades([-5, -1, -3], 2))                 # [-1, -3]
print(top_k_trades([10], 1))                          # [10]`,
    language: "python",
    complexity: { time: "O(N log k)", space: "O(k)" },
  },

  {
    id: "fin-20260702-b1-sliding-window-max",
    title: "Sliding Window Maximum for Rolling Volatility Peak",
    difficulty: "medium",
    topics: ["sliding-window", "monotonic-deque", "finance"],
    problem: `Given a time series of daily realised volatility readings vols and a window size W, compute for each day the maximum volatility observed over the last W days (inclusive). This peak-over-window statistic drives margin model stress limits.

Return the list of rolling maximum values (length = len(vols) - W + 1).`,
    examples: [
      {
        input: "vols = [0.15, 0.22, 0.18, 0.30, 0.25, 0.12, 0.28], W = 3",
        output: "[0.22, 0.30, 0.30, 0.30, 0.28]",
        explanation:
          "Windows: [0.15,0.22,0.18]→0.22, [0.22,0.18,0.30]→0.30, [0.18,0.30,0.25]→0.30, [0.30,0.25,0.12]→0.30, [0.25,0.12,0.28]→0.28.",
      },
      {
        input: "vols = [1.0, 2.0, 3.0], W = 1",
        output: "[1.0, 2.0, 3.0]",
        explanation: "Window of 1: each element is its own max.",
      },
    ],
    constraints: [
      "1 ≤ W ≤ len(vols)",
      "1 ≤ len(vols) ≤ 10^5",
      "0.0 < vols[i] ≤ 5.0",
    ],
    approach: `Use a monotonic decreasing deque of indices. When processing index i: (1) remove indices falling outside the window [i-W+1, i]; (2) pop all back-of-deque indices whose vol is ≤ current (they can never be max while the current element is in window); (3) append i; (4) once i ≥ W-1, the deque front is the max index. Each element is pushed and popped at most once — O(N) total.`,
    code: `from collections import deque

def rolling_max_vol(vols: list[float], W: int) -> list[float]:
    dq: deque[int] = deque()   # indices of candidates, decreasing by vol
    result: list[float] = []

    for i, v in enumerate(vols):
        # Evict indices that have left the window
        while dq and dq[0] < i - W + 1:
            dq.popleft()
        # Evict smaller values: they can never be window max
        while dq and vols[dq[-1]] <= v:
            dq.pop()
        dq.append(i)
        if i >= W - 1:
            result.append(vols[dq[0]])

    return result

vols = [0.15, 0.22, 0.18, 0.30, 0.25, 0.12, 0.28]
print(rolling_max_vol(vols, 3))            # [0.22, 0.30, 0.30, 0.30, 0.28]
print(rolling_max_vol([1.0, 2.0, 3.0], 1)) # [1.0, 2.0, 3.0]`,
    language: "python",
    complexity: { time: "O(N)", space: "O(W)" },
    leetcodeNumber: 239,
  },

  {
    id: "fin-20260702-b1-floyd-warshall-fx",
    title: "Floyd-Warshall All-Pairs FX Arbitrage Detection",
    difficulty: "hard",
    topics: ["graph", "floyd-warshall", "dynamic-programming", "finance"],
    problem: `Given an N×N matrix of FX exchange rates where rates[i][j] is the rate from currency i to currency j, determine whether any profitable cycle exists among any subset of currencies (not just from a fixed source).

Return true if arbitrage is detectable via the all-pairs log-product-path algorithm.

Note: unlike Bellman-Ford (single-source), Floyd-Warshall's O(N^3) all-pairs approach checks every possible starting node simultaneously and naturally detects self-improvement cycles.`,
    examples: [
      {
        input: "rates = [[1, 2, 0.5], [0.5, 1, 4], [2, 0.25, 1]]",
        output: "true",
        explanation:
          "After FW, dist[0][0] = log(16) > 0: the cycle 0→1→2→0 yields 16× return.",
      },
      {
        input: "rates = [[1, 0.5], [2, 1]]",
        output: "false",
        explanation: "0→1→0 yields 0.5 × 2 = 1.0. No profit; dist[i][i] stays 0.",
      },
    ],
    constraints: [
      "1 ≤ N ≤ 150 currencies",
      "rates[i][i] = 1.0",
      "rates[i][j] > 0",
    ],
    approach: `Transform to log space: dist[i][j] = log(rates[i][j]), so products become sums. Initialise dist[i][i] = log(1) = 0. Run Floyd-Warshall maximising path sums. A positive dist[i][i] after the algorithm means a profitable cycle passes through i — arbitrage exists. Unlike Bellman-Ford, no virtual source node is needed; all paths are explored simultaneously.`,
    code: `import math

def has_arbitrage_fw(rates: list[list[float]]) -> bool:
    n = len(rates)
    # dist[i][j] = max log-return for any path from i to j
    dist = [[math.log(rates[i][j]) for j in range(n)] for i in range(n)]
    # dist[i][i] starts at 0 (log(1)); FW will push it > 0 if a gain cycle exists

    for k in range(n):
        for i in range(n):
            for j in range(n):
                via_k = dist[i][k] + dist[k][j]
                if via_k > dist[i][j]:
                    dist[i][j] = via_k

    # Positive self-loop means a currency can be profitably cycled back to itself
    return any(dist[i][i] > 1e-10 for i in range(n))

rates1 = [[1, 2, 0.5], [0.5, 1, 4], [2, 0.25, 1]]
print(has_arbitrage_fw(rates1))   # True

rates2 = [[1, 0.5], [2, 1]]
print(has_arbitrage_fw(rates2))   # False`,
    language: "python",
    complexity: { time: "O(N^3)", space: "O(N^2)" },
  },

  {
    id: "fin-20260702-b1-position-tracker",
    title: "Position Tracker with Average Cost Basis and Top-K Query",
    difficulty: "medium",
    topics: ["design", "hash-map", "heap", "finance"],
    problem: `Design a PositionTracker class for an equity trading desk. Support three operations:

1. trade(symbol, qty, price): Record a buy (qty > 0) or sell (qty < 0). Track weighted-average cost basis; partial closes do not change the average cost, but new buys in the same direction update it proportionally.
2. unrealized_pnl(symbol, current_price): Return qty × (current_price − avg_cost).
3. top_k_by_market_value(k, prices): Return the k symbols with the largest |qty × price| in descending order.`,
    examples: [
      {
        input: `trade("AAPL", 100, 150.0)\ntrade("MSFT", 50, 300.0)\ntrade("AAPL", 50, 160.0)\nunrealized_pnl("AAPL", 165.0)`,
        output: "1750.0",
        explanation:
          "Avg cost after two buys = (100×150 + 50×160)/150 ≈ 153.33. PnL = 150 × (165 − 153.33) ≈ 1750.",
      },
      {
        input: `top_k_by_market_value(1, {"AAPL": 165, "MSFT": 310})`,
        output: '["AAPL"]',
        explanation:
          "AAPL MV = 150 × 165 = 24 750; MSFT MV = 50 × 310 = 15 500. AAPL is largest.",
      },
    ],
    constraints: [
      "1 ≤ |qty| ≤ 10^6",
      "0.01 ≤ price ≤ 10^6",
      "1 ≤ k ≤ number of open positions",
    ],
    approach: `Store positions as a dict mapping symbol to (qty, avg_cost). Average cost updates only when adding to an existing long/short — partial closes leave it unchanged (realised P&L is booked separately). For top-k, push all positions into a min-heap of size k, evicting the smallest market value each time. O(P log k) per query where P is the position count.`,
    code: `import heapq
from collections import defaultdict

class PositionTracker:
    def __init__(self):
        # symbol -> [qty, avg_cost]
        self._pos: dict = defaultdict(lambda: [0, 0.0])

    def trade(self, symbol: str, qty: int, price: float) -> None:
        p = self._pos[symbol]
        old_qty, old_cost = p[0], p[1]
        new_qty = old_qty + qty
        if new_qty == 0:
            p[0], p[1] = 0, 0.0
        elif (old_qty >= 0 and qty > 0) or (old_qty <= 0 and qty < 0):
            # Accumulating in the same direction: blend average cost
            p[1] = (old_qty * old_cost + qty * price) / new_qty
        # else partial close: avg_cost stays the same
        p[0] = new_qty

    def unrealized_pnl(self, symbol: str, current_price: float) -> float:
        qty, avg_cost = self._pos[symbol]
        return qty * (current_price - avg_cost)

    def top_k_by_market_value(self, k: int, prices: dict) -> list:
        heap: list = []   # min-heap of (market_value, symbol)
        for sym, (qty, _) in self._pos.items():
            if qty == 0:
                continue
            mv = abs(qty * prices.get(sym, 0.0))
            heapq.heappush(heap, (mv, sym))
            if len(heap) > k:
                heapq.heappop(heap)
        return [sym for _, sym in sorted(heap, reverse=True)]

pt = PositionTracker()
pt.trade("AAPL", 100, 150.0)
pt.trade("MSFT", 50, 300.0)
pt.trade("AAPL", 50, 160.0)   # avg cost = (100*150 + 50*160)/150 = 153.33
print(round(pt.unrealized_pnl("AAPL", 165.0), 2))   # 1750.0
prices = {"AAPL": 165.0, "MSFT": 310.0}
print(pt.top_k_by_market_value(1, prices))            # ["AAPL"]`,
    language: "python",
    complexity: { time: "O(P log k) top-k, O(1) amortised trade/pnl", space: "O(P)" },
  },

  {
    id: "fin-20260702-b1-matrix-expo-credit",
    title: "Matrix Exponentiation for Credit Markov Chain N-Year Transition",
    difficulty: "hard",
    topics: ["matrix", "dynamic-programming", "math", "finance"],
    problem: `A credit rating model is given as a Markov transition matrix P where P[i][j] is the probability of migrating from rating i to rating j in one year. Compute the N-year transition matrix P^N efficiently.

Given P as an N×N matrix and an integer years, return the matrix P^years.

Use matrix fast-power (exponentiation by squaring) to achieve O(N^3 log years) instead of O(N^3 × years).`,
    examples: [
      {
        input: `P = [[0.9, 0.1], [0.0, 1.0]], years = 3`,
        output: "[[0.729, 0.271], [0.0, 1.0]]",
        explanation:
          "0.9^3 = 0.729. Row 1 (default) is absorbing. After 3 years, P(AAA→Default) = 1 − 0.9^3 ≈ 0.271.",
      },
    ],
    constraints: [
      "2 ≤ N ≤ 20 rating states",
      "1 ≤ years ≤ 10^9",
      "P[i][j] ≥ 0 and each row sums to 1.0",
    ],
    approach: `Implement matrix multiplication on probability matrices. Matrix fast-power (exponentiation by squaring) repeatedly squares the base matrix and multiplies into the result only when the corresponding bit of 'years' is set. The identity matrix (I[i][j] = 1 iff i==j) serves as the neutral element. O(N^3 log years) — essential when computing 30-year credit default probabilities for large rating grids.`,
    code: `def mat_mul(A: list, B: list) -> list:
    n = len(A)
    C = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for k in range(n):
            if A[i][k] == 0.0:
                continue
            for j in range(n):
                C[i][j] += A[i][k] * B[k][j]
    return C

def mat_pow(M: list, p: int) -> list:
    n = len(M)
    result = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    base = [row[:] for row in M]
    while p > 0:
        if p & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        p >>= 1
    return result

# 3-state model: AAA, BBB, Default (absorbing)
P = [
    [0.90, 0.09, 0.01],
    [0.05, 0.85, 0.10],
    [0.00, 0.00, 1.00],
]
P5 = mat_pow(P, 5)
print(f"P(AAA->Default in 5y): {P5[0][2]:.4f}")   # approx 0.0768
print(f"P(BBB->Default in 5y): {P5[1][2]:.4f}")   # approx 0.3545`,
    language: "python",
    complexity: { time: "O(N^3 log years)", space: "O(N^2)" },
  },

  {
    id: "fin-20260702-b1-trap-water-depth",
    title: "Trapped Liquidity in Order Book Depth Profile",
    difficulty: "medium",
    topics: ["two-pointer", "stack", "finance"],
    problem: `An order book depth profile is given as an array heights where heights[i] represents the total resting liquidity (lots) at price level i. Gaps between tall walls of resting orders create 'trapped' liquidity that a large market order would sweep through. Compute the total trapped liquidity volume — the sum of lots that can be swept between any two taller walls on either side.

This is equivalent to the classic trapping rain water problem.`,
    examples: [
      {
        input: "heights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]",
        output: "6",
        explanation:
          "6 units of swept-through liquidity exist between the larger walls.",
      },
      {
        input: "heights = [4, 2, 0, 3, 2, 5]",
        output: "9",
        explanation: "3 trapped between the 4 and 3 walls, 6 trapped before the 5 wall.",
      },
    ],
    constraints: [
      "1 ≤ heights.length ≤ 2 × 10^4",
      "0 ≤ heights[i] ≤ 10^5",
    ],
    approach: `Two-pointer approach: maintain left_max and right_max. At each step, advance the pointer on the side with the smaller max. If the current bar is shorter than its side's max, trapped volume equals (max − height). O(N) time, O(1) space — avoids the O(N) extra arrays of the prefix/suffix precomputation approach.`,
    code: `def trapped_liquidity(heights: list[int]) -> int:
    left, right = 0, len(heights) - 1
    left_max = right_max = 0
    total = 0

    while left < right:
        if heights[left] <= heights[right]:
            if heights[left] >= left_max:
                left_max = heights[left]
            else:
                total += left_max - heights[left]   # trapped on the left side
            left += 1
        else:
            if heights[right] >= right_max:
                right_max = heights[right]
            else:
                total += right_max - heights[right]  # trapped on the right side
            right -= 1

    return total

print(trapped_liquidity([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]))  # 6
print(trapped_liquidity([4, 2, 0, 3, 2, 5]))                       # 9
print(trapped_liquidity([3, 0, 3]))                                 # 3`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
    leetcodeNumber: 42,
  },

  {
    id: "fin-20260702-b1-jump-rebalance",
    title: "Minimum Rebalancing Events (Jump Game II)",
    difficulty: "medium",
    topics: ["greedy", "bfs", "finance"],
    problem: `A portfolio is reviewed periodically. At each review period i, the model allows skipping up to reach[i] future periods before the next mandatory rebalance. Given the array reach of length N, find the minimum number of rebalancing events needed to reach the final period (index N−1).

It is guaranteed that period N−1 is always reachable.`,
    examples: [
      {
        input: "reach = [2, 3, 1, 1, 4]",
        output: "2",
        explanation:
          "Rebalance at period 0 (can jump to 1 or 2), then jump to period 1 (can jump to 4). Two events cover all 5 periods.",
      },
      {
        input: "reach = [2, 3, 0, 1, 4]",
        output: "2",
        explanation: "Period 2 has reach=0 so must be stepped over by jumping from period 1 to 3 or 4.",
      },
    ],
    constraints: [
      "1 ≤ reach.length ≤ 10^4",
      "0 ≤ reach[i] ≤ 1000",
      "The last period is always reachable",
    ],
    approach: `Greedy BFS in O(N): maintain current_end (boundary of the current jump) and farthest (max period reachable from any period ≤ current_end). Scan forward; when i hits current_end, a new rebalancing event must fire — increment the counter and advance current_end to farthest. Stop once current_end ≥ N−1.`,
    code: `def min_rebalance_events(reach: list[int]) -> int:
    n = len(reach)
    if n <= 1:
        return 0

    events = 0
    current_end = 0   # boundary of coverage from last rebalance
    farthest = 0      # farthest period reachable from any period in [0, current_end]

    for i in range(n - 1):
        farthest = max(farthest, i + reach[i])
        if i == current_end:
            events += 1
            current_end = farthest
            if current_end >= n - 1:
                break

    return events

print(min_rebalance_events([2, 3, 1, 1, 4]))    # 2
print(min_rebalance_events([2, 3, 0, 1, 4]))    # 2
print(min_rebalance_events([1, 1, 1, 1]))        # 3
print(min_rebalance_events([5]))                 # 0  (already at end)`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
    leetcodeNumber: 45,
  },

  {
    id: "fin-20260702-b1-word-break-ticker",
    title: "Ticker Tape Parser (Word Break DP)",
    difficulty: "medium",
    topics: ["dynamic-programming", "string", "finance"],
    problem: `A legacy ticker tape system concatenates equity symbols without delimiters. Given a string s and a set of valid ticker symbols, determine whether s can be fully segmented into a sequence of valid symbols from the set.

Return true if a valid segmentation exists, false otherwise.`,
    examples: [
      {
        input: `s = "IBMGSMS", symbols = {"IBM", "GS", "MS", "JPM", "C"}`,
        output: "true",
        explanation: 'IBM + GS + MS = "IBMGSMS". All three are in the symbol set.',
      },
      {
        input: `s = "JPMCFT", symbols = {"IBM", "GS", "MS", "JPM", "C", "FT"}`,
        output: "true",
        explanation: 'JPM + C + FT = "JPMCFT".',
      },
      {
        input: `s = "IBMXX", symbols = {"IBM", "GS", "MS"}`,
        output: "false",
        explanation: 'IBM matches, but "XX" is not in the symbol set.',
      },
    ],
    constraints: [
      "1 ≤ len(s) ≤ 300",
      "1 ≤ |symbols| ≤ 1000",
      "All symbols are uppercase alphabetic strings",
    ],
    approach: `Bottom-up DP on string length. dp[i] = True means s[0:i] can be fully segmented. Initialise dp[0] = True. For each i, scan backward over all j < i where dp[j] is True and check if s[j:i] is in the symbol set. Limit the inner scan to at most max_symbol_len characters back to keep it efficient. O(N × M × L) where M is the number of symbols and L is average symbol length.`,
    code: `def can_segment_ticker_tape(s: str, symbols: set) -> bool:
    n = len(s)
    max_len = max((len(sym) for sym in symbols), default=0)
    dp = [False] * (n + 1)
    dp[0] = True   # empty prefix is always valid

    for i in range(1, n + 1):
        # Only look back up to max_len characters
        for j in range(max(0, i - max_len), i):
            if dp[j] and s[j:i] in symbols:
                dp[i] = True
                break   # no need to check further splits for this i

    return dp[n]

syms = {"IBM", "GS", "MS", "JPM", "C", "FT"}
print(can_segment_ticker_tape("IBMGSMS", syms))    # True
print(can_segment_ticker_tape("JPMCFT", syms))     # True
print(can_segment_ticker_tape("IBMXX", syms))       # False
print(can_segment_ticker_tape("JPMJPM", syms))     # True  (JPM + JPM)`,
    language: "python",
    complexity: { time: "O(N^2) worst case, O(N × max_len) typical", space: "O(N)" },
    leetcodeNumber: 139,
  },

  {
    id: "fin-20260702-b1-bitmask-sector-portfolio",
    title: "Sector-Constrained Portfolio via Bitmask DP",
    difficulty: "hard",
    topics: ["bitmask-dp", "dynamic-programming", "bit-manipulation", "finance"],
    problem: `Risk rules forbid holding two positions in the same sector simultaneously. Each of N assets belongs to one or more sectors, encoded as a bitmask (e.g., bit 0 = Technology, bit 1 = Finance, bit 2 = Healthcare). Select a subset of assets with no two assets sharing any sector bit, maximising total projected return.

Return the maximum achievable total return from a conflict-free portfolio.`,
    examples: [
      {
        input: `assets = [(5, 0b011), (3, 0b100), (4, 0b010)]
# asset0: return=5, sectors=Tech|Finance
# asset1: return=3, sectors=Healthcare
# asset2: return=4, sectors=Finance`,
        output: "8",
        explanation:
          "Select asset0 (Tech|Finance) + asset1 (Healthcare): no bit overlap, return 5+3=8. Asset2 conflicts with asset0 on Finance.",
      },
      {
        input: `assets = [(10, 0b001), (8, 0b010), (6, 0b100), (4, 0b011)]`,
        output: "24",
        explanation:
          "Assets 0, 1, 2 each occupy distinct single-bit sectors; combined return 10+8+6=24. Asset3 (bits 0+1) conflicts with both 0 and 1.",
      },
    ],
    constraints: [
      "1 ≤ N ≤ 20 assets",
      "0 ≤ sectors[i] < 2^10  (at most 10 distinct sectors)",
      "1 ≤ return[i] ≤ 10^4",
    ],
    approach: `Bitmask DP: dp[mask] = max total return for a conflict-free portfolio whose union of sector masks equals 'mask'. Initialise dp[0] = 0, all others -inf. For each asset (ret, sec), traverse dp in reverse (right-to-left over mask values) and update dp[mask | sec] = max(dp[mask | sec], dp[mask] + ret) whenever mask & sec == 0 (no sector conflict). The answer is max over all dp values.`,
    code: `def max_return_sector_constrained(assets: list[tuple]) -> int:
    """assets: list of (projected_return, sector_bitmask)."""
    if not assets:
        return 0

    # Compute the full sector universe as the OR of all sector masks
    max_mask = 0
    for _, sec in assets:
        max_mask |= sec

    dp = [-1] * (max_mask + 1)
    dp[0] = 0   # empty portfolio: 0 return, no sectors occupied

    for ret, sec in assets:
        # Reverse iteration to prevent reusing the same asset twice
        for mask in range(max_mask, -1, -1):
            if dp[mask] >= 0 and (mask & sec) == 0:
                new_mask = mask | sec
                if dp[new_mask] < dp[mask] + ret:
                    dp[new_mask] = dp[mask] + ret

    return max(v for v in dp if v >= 0)

# Tech=bit0, Finance=bit1, Healthcare=bit2
assets1 = [(5, 0b011), (3, 0b100), (4, 0b010)]
print(max_return_sector_constrained(assets1))   # 8  (assets 0 + 1)

assets2 = [(10, 0b001), (8, 0b010), (6, 0b100), (4, 0b011)]
print(max_return_sector_constrained(assets2))   # 24 (assets 0 + 1 + 2)`,
    language: "python",
    complexity: { time: "O(N × 2^S) where S = number of sectors", space: "O(2^S)" },
  },
];
