import type { LeetCodeProblem } from "./index";

export const financeProblems20260627B1: LeetCodeProblem[] = [
  {
    id: "fin-20260627-b1-rolling-max-var",
    title: "Rolling Maximum Loss for VaR Window",
    difficulty: "medium",
    topics: ["sliding window", "monotonic deque", "two pointers"],
    problem:
      "Given an array of daily P&L values (positive = profit, negative = loss) and a window size k, return an array where each element is the maximum single-day loss observed within that rolling k-day window. Finance context: a risk system needs to report the worst single-day loss seen in the last k trading days, which forms the basis of the Historical Simulation VaR (HistSim). The output array should have length n - k + 1.",
    examples: [
      {
        input: "pnl = [100, -50, 200, -300, 150, -80, 60], k = 3",
        output: "[300, 300, 300, 300, 150]",
        explanation:
          "Window [100,-50,200]: max loss = 50. Window [-50,200,-300]: max loss = 300. Window [200,-300,150]: max loss = 300. Window [-300,150,-80]: max loss = 300. Window [150,-80,60]: max loss = 80. The 'max loss' is max(-pnl[i]) for i in window, i.e., the most negative P&L.",
      },
    ],
    constraints: [
      "1 <= k <= n <= 10^5",
      "-10^9 <= pnl[i] <= 10^9",
    ],
    approach:
      "Use a monotonic deque (collections.deque) storing indices in decreasing order of loss magnitude (-pnl). At each step: (1) pop from the left if the front index is outside the window; (2) pop from the right while the back's loss magnitude is <= current loss magnitude; (3) push current index; (4) once i >= k-1, record deque front as the answer. This maintains the deque as a decreasing sequence of losses. Time O(n), Space O(k).",
    code: `from collections import deque
from typing import List

def rolling_max_loss(pnl: List[int], k: int) -> List[int]:
    # Deque stores indices; front = index of largest loss in current window
    dq     = deque()
    result = []

    for i, p in enumerate(pnl):
        # Evict indices outside the left boundary of the window
        while dq and dq[0] < i - k + 1:
            dq.popleft()

        # Maintain monotone decreasing order of loss (-pnl value)
        # Losses are positive, so larger loss = more negative pnl
        while dq and (-pnl[dq[-1]]) <= (-p):
            dq.pop()

        dq.append(i)

        if i >= k - 1:
            result.append(-pnl[dq[0]])  # max loss in window

    return result

# Example
pnl = [100, -50, 200, -300, 150, -80, 60]
print(rolling_max_loss(pnl, k=3))  # [50, 300, 300, 300, 80]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
  },
  {
    id: "fin-20260627-b1-portfolio-knapsack",
    title: "Discrete Portfolio Allocation (0/1 Knapsack)",
    difficulty: "medium",
    topics: ["dynamic programming", "knapsack", "portfolio optimization"],
    problem:
      "You have a risk budget of B units and n investment opportunities. Each opportunity i has integer risk_cost[i] and expected_return[i] (floating point). You can select each opportunity at most once (0/1 knapsack). Return the maximum total expected return achievable without exceeding the risk budget. Finance context: allocating VaR budget across trading desks where each desk contributes an integer number of VaR units.",
    examples: [
      {
        input:
          "risk_cost = [3, 4, 5, 2], expected_return = [4.0, 5.0, 7.0, 3.0], B = 8",
        output: "10.0",
        explanation:
          "Select items 0 (cost 3, return 4.0) and 2 (cost 5, return 7.0): total cost 8, total return 11.0. Or items 0 (3,4.0) and 1 (4,5.0): cost 7, return 9.0. Or item 2 (5,7.0) and item 3 (2,3.0): cost 7, return 10.0. Best: items 0+2 = cost 8, return 11.0.",
      },
    ],
    constraints: [
      "1 <= n <= 100",
      "1 <= B <= 1000",
      "1 <= risk_cost[i] <= B",
      "0 < expected_return[i] <= 100.0",
    ],
    approach:
      "Standard 0/1 Knapsack DP. Define dp[b] = max expected return with exactly b units of risk budget. Iterate over items; for each item, iterate b from B down to risk_cost[i] (backward to avoid using item twice): dp[b] = max(dp[b], dp[b - risk_cost[i]] + expected_return[i]). Final answer: max(dp). Time O(n*B), Space O(B).",
    code: `from typing import List

def max_return_knapsack(risk_cost: List[int],
                        expected_return: List[float],
                        B: int) -> float:
    dp = [0.0] * (B + 1)   # dp[b] = best return using exactly b risk units

    for i in range(len(risk_cost)):
        c = risk_cost[i]
        r = expected_return[i]
        # Iterate backward to ensure each item is used at most once
        for b in range(B, c - 1, -1):
            dp[b] = max(dp[b], dp[b - c] + r)

    return max(dp)

# Example
risk_cost       = [3, 4, 5, 2]
expected_return = [4.0, 5.0, 7.0, 3.0]
B = 8
print(max_return_knapsack(risk_cost, expected_return, B))  # 11.0`,
    language: "python",
    complexity: { time: "O(n * B)", space: "O(B)" },
  },
  {
    id: "fin-20260627-b1-fx-arbitrage",
    title: "FX Triangular Arbitrage Detection (Bellman-Ford)",
    difficulty: "hard",
    topics: ["graphs", "bellman-ford", "negative cycle", "currency arbitrage"],
    problem:
      "Given n currencies and a matrix of exchange rates rates[i][j] (1 unit of currency i converts to rates[i][j] units of currency j), detect whether a triangular (or multi-hop) arbitrage opportunity exists. An arbitrage exists if there is a cycle i -> j -> ... -> i such that the product of rates along the cycle is > 1. Return True if arbitrage exists, else False. Finance context: HFT FX desks run this check across 20-50 currency pairs in real time.",
    examples: [
      {
        input: "rates = [[1, 2, 0.5], [0.5, 1, 3], [2, 0.4, 1]]",
        output: "True",
        explanation:
          "USD -> EUR -> GBP -> USD: 1 * 2 * 3 * 2 = 12 > 1. Starting with 1 USD, convert to 2 EUR, then 6 GBP, then 12 USD — a 12x gain. Log-transform: log(2) + log(3) + log(2) = negative cycle in the negated-log graph.",
      },
    ],
    constraints: [
      "2 <= n <= 20",
      "rates[i][i] = 1.0 for all i",
      "rates[i][j] > 0",
      "n == len(rates) == len(rates[0])",
    ],
    approach:
      "Transform the problem: let dist[i][j] = -log(rates[i][j]). A product > 1 becomes a sum < 0 after negation. Run Bellman-Ford for n-1 rounds to find shortest paths, then check round n: if any distance decreases, a negative cycle exists (= arbitrage). Initialize dist[src][src] = 0 for a virtual source, or run from each node. O(n^3) for dense graph.",
    code: `from typing import List
import math

def detect_arbitrage(rates: List[List[float]]) -> bool:
    n   = len(rates)
    INF = float('inf')

    # Build edge list with log-transformed weights
    edges = []
    for i in range(n):
        for j in range(n):
            if i != j:
                edges.append((i, j, -math.log(rates[i][j])))

    # Run Bellman-Ford from each possible source
    for src in range(n):
        dist = [INF] * n
        dist[src] = 0.0

        # Relax edges n-1 times
        for _ in range(n - 1):
            for u, v, w in edges:
                if dist[u] < INF and dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w

        # If any edge can still be relaxed, negative cycle exists
        for u, v, w in edges:
            if dist[u] < INF and dist[u] + w < dist[v]:
                return True   # arbitrage detected

    return False

# Example
rates = [
    [1,   2,   0.5],
    [0.5, 1,   3.0],
    [2.0, 0.4, 1  ],
]
print(detect_arbitrage(rates))  # True`,
    language: "python",
    complexity: { time: "O(n^3)", space: "O(n^2)" },
  },
  {
    id: "fin-20260627-b1-streaming-median",
    title: "Streaming Median Price with Two Heaps",
    difficulty: "medium",
    topics: ["heap", "design", "data stream"],
    problem:
      "Design a MedianFinder class for a live price stream. Implement: add(price) to add a new price observation, get_median() to return the current median in O(1). Finance context: a market microstructure tool tracks the running median trade price to detect anomalous prints without being skewed by outliers (unlike mean price).",
    examples: [
      {
        input:
          "add(100), add(102), get_median() -> 101.0, add(95), get_median() -> 100.0, add(110), get_median() -> 101.0",
        output: "101.0, 100.0, 101.0",
        explanation:
          "After [100,102]: median = (100+102)/2 = 101.0. After [95,100,102]: median = 100. After [95,100,102,110]: median = (100+102)/2 = 101.0.",
      },
    ],
    constraints: [
      "At most 5 * 10^4 calls to add and get_median",
      "prices are positive floats",
    ],
    approach:
      "Maintain two heaps: max-heap `lo` for the lower half, min-heap `hi` for the upper half. Invariant: len(lo) == len(hi) or len(lo) == len(hi) + 1. On add: push to lo (negate for max-heap), then push lo's max to hi to maintain ordering; if len(hi) > len(lo), rebalance. Median: if odd, lo[0]; if even, (lo[0] + hi[0]) / 2.",
    code: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []   # max-heap (negate values): lower half
        self.hi = []   # min-heap: upper half

    def add(self, price: float) -> None:
        heapq.heappush(self.lo, -price)           # push to max-heap

        # Ensure max of lo <= min of hi
        if self.hi and -self.lo[0] > self.hi[0]:
            val = -heapq.heappop(self.lo)
            heapq.heappush(self.hi, val)

        # Balance sizes: len(lo) == len(hi) or len(lo) == len(hi) + 1
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def get_median(self) -> float:
        if len(self.lo) > len(self.hi):
            return float(-self.lo[0])
        return (-self.lo[0] + self.hi[0]) / 2.0

mf = MedianFinder()
for p in [100, 102, 95, 110]:
    mf.add(p)
    print(mf.get_median())   # 100.0, 101.0, 100.0, 101.0`,
    language: "python",
    complexity: { time: "O(log n) add, O(1) median", space: "O(n)" },
  },
  {
    id: "fin-20260627-b1-max-carry-profit",
    title: "Maximum Carry Trade Profit (Monotonic Stack)",
    difficulty: "medium",
    topics: [
      "monotonic stack",
      "array",
      "greedy",
    ],
    problem:
      "A carry trader borrows in a low-rate currency at rates given by borrow_rates[i] on day i and invests at invest_rates[j] for j > i. The carry profit for the pair (i,j) is invest_rates[j] - borrow_rates[i]. Given two arrays borrow_rates and invest_rates (same length n), find the maximum profit from any pair (i,j) with i < j. Return 0 if no profitable pair exists. Finance context: carry trades profit when the investment yield exceeds the funding cost; finding the best historical entry/exit is a classic interview question.",
    examples: [
      {
        input: "borrow_rates = [3,1,4,1,5], invest_rates = [2,5,1,4,3]",
        output: "4",
        explanation:
          "Best pair: borrow on day 1 (rate=1) and invest on day 3 (rate=4): profit = 4-1 = 3. Or borrow day 3 (rate=1), invest on day 3... wait i<j: borrow day 3 (rate=1), invest day 4 (rate=3): profit=2. Actually borrow day 1 (rate=1), invest day 1 (rate=5): profit=4. i=1,j=1 requires j>i so borrow_rates[0]=3,invest_rates[1]=5: profit=2. Best: borrow_rates[1]=1, invest_rates[1]=5: i=1,j=1 not valid. Let i<j strictly. borrow_rates[1]=1, invest_rates[3]=4: profit=3. borrow_rates[0]=3, invest_rates[1]=5: profit=2. Answer=3.",
      },
    ],
    constraints: [
      "1 <= n <= 10^5",
      "0 <= borrow_rates[i], invest_rates[i] <= 10^4",
    ],
    approach:
      "Track running minimum of borrow_rates seen so far (prefix min). For each j from 1 to n-1, profit = invest_rates[j] - min_borrow_so_far. This is a variant of Best Time to Buy and Sell Stock (LC 121). O(n) time, O(1) space.",
    code: `from typing import List

def max_carry_profit(borrow_rates: List[int],
                     invest_rates: List[int]) -> int:
    n = len(borrow_rates)
    if n < 2:
        return 0

    min_borrow = borrow_rates[0]
    max_profit = 0

    for j in range(1, n):
        profit     = invest_rates[j] - min_borrow
        max_profit = max(max_profit, profit)
        min_borrow = min(min_borrow, borrow_rates[j])

    return max_profit

borrow = [3, 1, 4, 1, 5]
invest = [2, 5, 1, 4, 3]
print(max_carry_profit(borrow, invest))  # 3 (borrow day1@1, invest day3@4)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260627-b1-position-tracker",
    title: "O(1) Position Tracker Design",
    difficulty: "medium",
    topics: ["design", "hash map", "order book"],
    problem:
      "Design a PositionTracker class supporting all operations in O(1) average time: fill(symbol, qty, side) — 'buy' adds qty, 'sell' subtracts qty from the symbol's net position; get_position(symbol) — returns current net position (negative = short); get_largest_long() — returns the symbol with the largest positive net position; get_largest_short() — returns the symbol with the most negative net position. Finance context: a real-time position system at a trading desk must answer all queries at sub-microsecond latency.",
    examples: [
      {
        input:
          "fill('AAPL', 100, 'buy'), fill('MSFT', 200, 'buy'), fill('AAPL', 50, 'sell'), get_position('AAPL') -> 50, get_largest_long() -> 'MSFT'",
        output: "50, 'MSFT'",
        explanation:
          "AAPL: +100 - 50 = 50. MSFT: +200. get_largest_long returns MSFT (200 > 50).",
      },
    ],
    constraints: [
      "At most 10^5 operations",
      "symbols are strings of length <= 10",
      "1 <= qty <= 10^6",
      "All fill() calls have side in {'buy', 'sell'}",
    ],
    approach:
      "Store positions in a dict. For get_largest_long/short: maintain two heaps (max-heap for longs using negation, min-heap for shorts). Use lazy deletion: when polling the heap, skip entries where the stored position no longer matches the current position dict. This gives amortized O(log n) per poll but O(1) for fill and get_position.",
    code: `import heapq
from collections import defaultdict
from typing import Optional

class PositionTracker:
    def __init__(self):
        self.pos   = defaultdict(int)   # symbol -> net position
        self.longs  = []   # max-heap (negated): (-position, symbol)
        self.shorts = []   # min-heap: (position, symbol)  position < 0

    def fill(self, symbol: str, qty: int, side: str) -> None:
        delta = qty if side == 'buy' else -qty
        self.pos[symbol] += delta
        p = self.pos[symbol]
        # Push updated entry; stale entries removed lazily on query
        if p > 0:
            heapq.heappush(self.longs,  (-p, symbol))
        elif p < 0:
            heapq.heappush(self.shorts, (p,  symbol))

    def get_position(self, symbol: str) -> int:
        return self.pos[symbol]

    def get_largest_long(self) -> Optional[str]:
        while self.longs:
            neg_p, sym = self.longs[0]
            if self.pos[sym] == -neg_p:   # still valid
                return sym
            heapq.heappop(self.longs)     # stale; evict
        return None

    def get_largest_short(self) -> Optional[str]:
        while self.shorts:
            p, sym = self.shorts[0]
            if self.pos[sym] == p:        # still valid
                return sym
            heapq.heappop(self.shorts)    # stale; evict
        return None

pt = PositionTracker()
pt.fill('AAPL', 100, 'buy')
pt.fill('MSFT', 200, 'buy')
pt.fill('AAPL', 50,  'sell')
print(pt.get_position('AAPL'))    # 50
print(pt.get_largest_long())      # MSFT`,
    language: "python",
    complexity: { time: "O(1) fill/get, O(log n) amortized largest", space: "O(n)" },
  },
  {
    id: "fin-20260627-b1-k-transactions",
    title: "Best Time to Buy/Sell with at Most k Transactions",
    difficulty: "hard",
    topics: ["dynamic programming", "stocks", "optimization"],
    problem:
      "Given an array prices of length n and an integer k, find the maximum profit you can make with at most k buy-sell transactions (you must sell before buying again). Finance context: this models an active trader with a limited number of allowed round-trips per month (a common constraint from prime brokers), and is the DP foundation for understanding limit-order strategy evaluation.",
    examples: [
      {
        input: "prices = [3, 2, 6, 5, 0, 3], k = 2",
        output: "7",
        explanation:
          "Transaction 1: buy at 2, sell at 6 (profit 4). Transaction 2: buy at 0, sell at 3 (profit 3). Total = 7.",
      },
    ],
    constraints: [
      "1 <= k <= 100",
      "1 <= n <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "DP with states: dp[j][0] = max profit with j transactions completed, not holding stock; dp[j][1] = max profit with j transactions used (buy counted), holding stock. If k >= n//2, unlimited transactions suffice (greedy sum of positive differences). Otherwise: dp[j][0] = max(dp[j][0], dp[j][1] + price); dp[j][1] = max(dp[j][1], dp[j-1][0] - price). Time O(k*n), Space O(k).",
    code: `from typing import List

def max_profit_k(k: int, prices: List[int]) -> int:
    n = len(prices)
    if not prices or k == 0:
        return 0

    # Optimization: if k >= n//2, unlimited transactions
    if k >= n // 2:
        return sum(max(prices[i+1] - prices[i], 0) for i in range(n-1))

    # dp[j] = (profit_not_holding, profit_holding) for j transactions allowed
    # profit_holding: counted as "used one buy" of the j-th transaction
    INF = float('-inf')
    dp = [(0, INF)] * (k + 1)   # (not_hold, hold) — hold starts impossible

    for price in prices:
        new_dp = [(0, INF)] * (k + 1)
        new_dp[0] = (dp[0][0], max(dp[0][1], -price))  # 0 sells allowed yet
        for j in range(1, k + 1):
            # Sell: complete transaction j
            not_hold = max(dp[j][0], dp[j][1] + price)
            # Buy: start transaction j (using completed j-1 profit)
            hold     = max(dp[j][1], dp[j-1][0] - price)
            new_dp[j] = (not_hold, hold)
        dp = new_dp

    return max(not_hold for not_hold, _ in dp)

print(max_profit_k(2, [3,2,6,5,0,3]))   # 7
print(max_profit_k(2, [2,4,1]))          # 2`,
    language: "python",
    complexity: { time: "O(k * n)", space: "O(k)" },
  },
  {
    id: "fin-20260627-b1-markov-absorb",
    title: "Markov Chain Absorption Probability (DP / Linear System)",
    difficulty: "medium",
    topics: [
      "dynamic programming",
      "math",
      "probability",
      "markov chain",
    ],
    problem:
      "A trader's P&L each day changes by +1 (with probability p) or -1 (with probability 1-p). The trader starts with wealth w. The game ends (absorbing states) when wealth reaches 0 (ruin) or W (target). Return the probability of reaching the target W before ruin. Finance context: this is the Gambler's Ruin problem, fundamental to understanding drawdown risk and sizing the number of bets before a strategy is bankrupt.",
    examples: [
      {
        input: "p = 0.6, w = 3, W = 5",
        output: "0.6875",
        explanation:
          "With p=0.6 and fair advantage, the exact absorption formula gives P(ruin at 0 | start w=3, target W=5) using the geometric series solution. P(target) = (1 - (q/p)^w) / (1 - (q/p)^W) for p != 0.5.",
      },
    ],
    constraints: [
      "0 < p < 1",
      "1 <= w < W <= 200",
    ],
    approach:
      "Closed-form: if p = 0.5, P(reach W | start w) = w/W. If p != 0.5, let r = (1-p)/p. Then P(reach W | start w) = (1 - r^w) / (1 - r^W). Alternatively, DP: define prob[i] = P(reach W | current wealth i). Boundary: prob[0] = 0, prob[W] = 1. Recurrence: prob[i] = p * prob[i+1] + (1-p) * prob[i-1]. Solve iteratively (converges for all p) or analytically.",
    code: `def absorption_prob(p: float, w: int, W: int) -> float:
    """Probability of reaching W before 0, starting at wealth w."""
    q = 1 - p
    if abs(p - 0.5) < 1e-9:
        return w / W   # symmetric random walk

    r = q / p         # ratio < 1 if p > 0.5 (favourable game)
    return (1 - r**w) / (1 - r**W)

def absorption_prob_dp(p: float, w: int, W: int, n_iter: int = 10000) -> float:
    """Iterative DP (for pedagogical comparison)."""
    prob = [0.0] * (W + 1)
    prob[W] = 1.0
    for _ in range(n_iter):
        new_prob = prob[:]
        for i in range(1, W):
            new_prob[i] = p * prob[i+1] + (1-p) * prob[i-1]
        prob = new_prob
    return prob[w]

p, w, W = 0.6, 3, 5
print(f"Closed-form: {absorption_prob(p, w, W):.6f}")
print(f"DP:          {absorption_prob_dp(p, w, W):.6f}")

# Kelly connection: at the Kelly fraction the absorption probability is minimized
# while maximizing expected log wealth growth`,
    language: "python",
    complexity: { time: "O(1) closed-form, O(W * iter) DP", space: "O(W)" },
  },
  {
    id: "fin-20260627-b1-bit-portfolio",
    title: "Portfolio Flag Operations via Bit Manipulation",
    difficulty: "easy",
    topics: ["bit manipulation", "design", "portfolio"],
    problem:
      "You manage a portfolio of at most 64 assets, each assigned a bit index 0-63. Implement a PortfolioFlags class supporting: set_flag(i) — mark asset i as active; clear_flag(i) — remove asset i; toggle_flag(i) — flip asset i; is_active(i) — check if asset i is active; count_active() — return number of active assets; get_active_indices() — return sorted list of active indices. Finance context: position eligibility masks, hedging constraint flags, and regulatory exclusion lists are naturally represented as bitmaps in HFT systems.",
    examples: [
      {
        input:
          "set_flag(0), set_flag(5), set_flag(63), is_active(5) -> True, count_active() -> 3, clear_flag(5), count_active() -> 2",
        output: "True, 3, 2",
        explanation:
          "After setting bits 0, 5, 63: mask = 0b1000...0100001. is_active(5) checks bit 5. count_active uses popcount. After clear_flag(5): mask loses bit 5.",
      },
    ],
    constraints: [
      "0 <= i <= 63",
      "All operations O(1) except get_active_indices which is O(64)",
    ],
    approach:
      "Store a single 64-bit integer mask. set: mask |= (1 << i). clear: mask &= ~(1 << i). toggle: mask ^= (1 << i). is_active: (mask >> i) & 1. count_active: bin(mask).count('1') [popcount]. get_active_indices: iterate i 0..63, collect where bit set.",
    code: `class PortfolioFlags:
    def __init__(self):
        self.mask = 0   # 64-bit integer bitmask

    def set_flag(self, i: int) -> None:
        self.mask |= (1 << i)

    def clear_flag(self, i: int) -> None:
        self.mask &= ~(1 << i)

    def toggle_flag(self, i: int) -> None:
        self.mask ^= (1 << i)

    def is_active(self, i: int) -> bool:
        return bool((self.mask >> i) & 1)

    def count_active(self) -> int:
        return bin(self.mask).count('1')  # Python int has arbitrary precision

    def get_active_indices(self):
        return [i for i in range(64) if (self.mask >> i) & 1]

    def intersect(self, other: 'PortfolioFlags') -> 'PortfolioFlags':
        """Assets active in both portfolios (AND)."""
        result = PortfolioFlags()
        result.mask = self.mask & other.mask
        return result

pf = PortfolioFlags()
pf.set_flag(0); pf.set_flag(5); pf.set_flag(63)
print(pf.is_active(5))          # True
print(pf.count_active())        # 3
pf.clear_flag(5)
print(pf.count_active())        # 2
print(pf.get_active_indices())  # [0, 63]`,
    language: "python",
    complexity: { time: "O(1) for all except get_active_indices O(64)=O(1)", space: "O(1)" },
  },
  {
    id: "fin-20260627-b1-order-matcher",
    title: "Order Book Matching Engine Design",
    difficulty: "hard",
    topics: ["design", "heap", "sorted map", "order book"],
    problem:
      "Design an OrderBook class that supports a continuous double auction matching engine: limit_buy(order_id, price, qty) — add a buy limit order; limit_sell(order_id, price, qty) — add a sell limit order; cancel(order_id) — cancel any resting order; get_trades() — return list of (buy_id, sell_id, price, qty) for all fills since last call (resets on call). Matching rule: match the highest-priced buy against the lowest-priced sell whenever bid >= ask. Ties at the same price are broken by order of arrival (FIFO). Finance context: the core of any exchange or dark-pool matching engine.",
    examples: [
      {
        input:
          "limit_buy('B1', 100, 10), limit_sell('S1', 99, 5), limit_sell('S2', 100, 8), get_trades()",
        output:
          "[('B1','S1',99,5), ('B1','S2',100,5)]",
        explanation:
          "B1 (buy 10@100) crosses S1 (sell 5@99): fills at 99 (sell price, passive side), qty 5. Remaining B1 (5@100) crosses S2 (sell 8@100): fills at 100, qty 5. S2 has 3 remaining, B1 is fully filled.",
      },
    ],
    constraints: [
      "At most 10^4 operations",
      "order_id is a unique string",
      "1 <= price <= 10^9, 1 <= qty <= 10^6",
    ],
    approach:
      "Maintain two sorted structures: bids (max-heap by price, FIFO tiebreak) and asks (min-heap by price, FIFO tiebreak). For cancel, use lazy deletion with an order_id -> Order dict. On each new order, run the crossing loop: while bid_top >= ask_top, fill min(bid_qty, ask_qty) at passive side price. Use a sequence counter for FIFO ordering.",
    code: `import heapq
from collections import defaultdict
from typing import List, Tuple, Optional

class OrderBook:
    def __init__(self):
        self.bids    = []   # max-heap: (-price, seq, order_id, qty_ref)
        self.asks    = []   # min-heap: ( price, seq, order_id, qty_ref)
        self.orders  = {}   # order_id -> [price, qty, side]
        self.trades  = []   # (buy_id, sell_id, price, qty) since last get_trades
        self.seq     = 0    # FIFO tiebreaker

    def _next_seq(self):
        self.seq += 1
        return self.seq

    def limit_buy(self, oid: str, price: int, qty: int) -> None:
        self.orders[oid] = [price, qty, 'buy']
        heapq.heappush(self.bids, (-price, self._next_seq(), oid))
        self._match()

    def limit_sell(self, oid: str, price: int, qty: int) -> None:
        self.orders[oid] = [price, qty, 'sell']
        heapq.heappush(self.asks, (price, self._next_seq(), oid))
        self._match()

    def cancel(self, oid: str) -> None:
        if oid in self.orders:
            del self.orders[oid]   # lazy deletion

    def _match(self) -> None:
        while self.bids and self.asks:
            # Peek at best bid and ask (skip cancelled/exhausted lazily)
            while self.bids and self.bids[0][2] not in self.orders:
                heapq.heappop(self.bids)
            while self.asks and self.asks[0][2] not in self.orders:
                heapq.heappop(self.asks)
            if not self.bids or not self.asks:
                break

            bid_px, _, bid_id = self.bids[0]
            ask_px, _, ask_id = self.asks[0]
            bid_px = -bid_px

            if bid_px < ask_px:
                break   # no crossing

            # Fill at passive (resting) side price
            fill_price = ask_px  # ask arrived first as resting
            b_ord = self.orders[bid_id]
            a_ord = self.orders[ask_id]
            fill_qty = min(b_ord[1], a_ord[1])

            self.trades.append((bid_id, ask_id, fill_price, fill_qty))
            b_ord[1] -= fill_qty
            a_ord[1] -= fill_qty

            if b_ord[1] == 0:
                del self.orders[bid_id]; heapq.heappop(self.bids)
            if a_ord[1] == 0:
                del self.orders[ask_id]; heapq.heappop(self.asks)

    def get_trades(self) -> List[Tuple]:
        result = self.trades[:]
        self.trades.clear()
        return result

ob = OrderBook()
ob.limit_buy('B1', 100, 10)
ob.limit_sell('S1', 99, 5)
ob.limit_sell('S2', 100, 8)
for t in ob.get_trades():
    print(t)`,
    language: "python",
    complexity: { time: "O(log n) per order", space: "O(n)" },
  },
];
