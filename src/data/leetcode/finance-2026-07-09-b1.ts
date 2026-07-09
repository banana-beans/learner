import type { LeetCodeProblem } from "./index";

export const financeProblems20260709B1: LeetCodeProblem[] = [
  {
    id: "fin-20260709-b1-topk-pnl",
    title: "Top-K Positions by Unrealised P&L",
    difficulty: "medium",
    topics: ["Heap", "Hash Map", "Portfolio Analytics"],
    problem:
      "Given a list of fills, each as (symbol, price_change, qty), compute the net unrealised P&L per symbol (sum of price_change * qty across all fills for that symbol). Return the k symbols with the highest P&L. If two symbols tie, break ties alphabetically. This is the building block of a real-time blotter that surfaces the top winners.",
    examples: [
      {
        input:
          'fills = [("AAPL", 2.5, 100), ("MSFT", -1.0, 200), ("AAPL", 1.0, 50), ("GOOG", 5.0, 30)], k = 2',
        output: '["GOOG", "AAPL"]',
        explanation:
          "P&L: AAPL = 2.5*100 + 1.0*50 = 300, MSFT = -200, GOOG = 150. Top-2 are AAPL (300) and GOOG (150).",
      },
    ],
    constraints: [
      "1 ≤ len(fills) ≤ 10^5",
      "1 ≤ k ≤ number of distinct symbols",
      "O(N + S log k) where S = distinct symbols",
    ],
    approach:
      "Accumulate P&L per symbol into a hash map in O(N). Then use a min-heap of size k over (pnl, symbol): push each entry and pop when size exceeds k. The heap key is (pnl, symbol) — Python's tuple comparison gives alphabetical tiebreak when P&L is equal. Drain the heap in reverse order for the final ranking.",
    code: `import heapq
from collections import defaultdict
from typing import List, Tuple

def top_k_pnl(fills: List[Tuple[str, float, int]], k: int) -> List[str]:
    pnl: dict[str, float] = defaultdict(float)
    for symbol, price_change, qty in fills:
        pnl[symbol] += price_change * qty

    # Min-heap of (pnl, symbol); negate pnl so smallest = worst
    heap: list[Tuple[float, str]] = []
    for symbol, profit in pnl.items():
        heapq.heappush(heap, (profit, symbol))
        if len(heap) > k:
            heapq.heappop(heap)

    # Heap contains top-k; sort descending by P&L, then alphabetical
    return [sym for _, sym in sorted(heap, key=lambda x: (-x[0], x[1]))]`,
    language: "python",
    complexity: { time: "O(N + S log k)", space: "O(S)" },
  },
  {
    id: "fin-20260709-b1-stock-span",
    title: "Stock Price Span",
    difficulty: "easy",
    topics: ["Monotonic Stack", "Market Data", "Technical Analysis"],
    problem:
      "The span of a stock price on day i is the maximum number of consecutive days (ending on day i) for which the price on each day was less than or equal to prices[i]. Span is used in technical analysis to measure price momentum. For prices = [100, 80, 60, 70, 60, 75, 85], the spans are [1, 1, 1, 2, 1, 4, 6].",
    examples: [
      {
        input: "prices = [100, 80, 60, 70, 60, 75, 85]",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation:
          "Day 6 (price=85): look back — 75, 60, 70, 60, 80 are all ≤ 85 except 100, so span=6.",
      },
    ],
    constraints: [
      "1 ≤ len(prices) ≤ 10^5",
      "1 ≤ prices[i] ≤ 10^5",
      "O(N) amortised time required.",
    ],
    approach:
      "Use a monotonic stack storing (price, span) pairs. For each new price, pop while the top price is ≤ current, accumulating spans. This collapses already-processed runs into a single entry, giving O(1) amortised per element. The final span is 1 + sum of popped spans.",
    code: `from typing import List

def calculate_span(prices: List[float]) -> List[int]:
    # Stack of (price, span_at_that_price)
    stack: list[tuple[float, int]] = []
    spans: list[int] = []

    for price in prices:
        span = 1
        while stack and stack[-1][0] <= price:
            span += stack.pop()[1]   # absorb the run from the popped entry
        stack.append((price, span))
        spans.append(span)

    return spans`,
    language: "python",
    complexity: { time: "O(N) amortised", space: "O(N)" },
    leetcodeNumber: 901,
  },
  {
    id: "fin-20260709-b1-buy-sell-fee",
    title: "Best Time to Buy and Sell with Transaction Fee",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Greedy", "Trading Constraints"],
    problem:
      "Given daily stock prices and a fixed transaction fee (charged once per round-trip trade), find the maximum total profit from unlimited transactions. This models brokerage commission impact on a high-frequency strategy. For prices=[1,3,2,8,4,9] and fee=2, the answer is 8.",
    examples: [
      {
        input: "prices = [1, 3, 2, 8, 4, 9], fee = 2",
        output: "8",
        explanation:
          "Buy at 1, sell at 8 (profit 5). Buy at 4, sell at 9 (profit 3). Total = 8. Fee is subtracted once on each sell.",
      },
    ],
    constraints: [
      "1 ≤ len(prices) ≤ 5 × 10^4",
      "1 ≤ fee ≤ 10^4",
      "0 ≤ prices[i] ≤ 5 × 10^4",
    ],
    approach:
      "Two-state DP: cash = best profit when not holding stock; hold = best profit when holding stock. Each day: cash = max(cash, hold + price - fee) [sell or do nothing]; hold = max(hold, cash - price) [buy or do nothing]. Fee is deducted at sell time. Final answer is cash.",
    code: `from typing import List

def max_profit_with_fee(prices: List[float], fee: float) -> float:
    cash = 0.0          # max profit when NOT holding stock
    hold = -prices[0]   # max profit when holding stock

    for price in prices[1:]:
        cash = max(cash, hold + price - fee)   # sell (pay fee) or wait
        hold = max(hold, cash - price)         # buy or continue holding

    return cash`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
    leetcodeNumber: 714,
  },
  {
    id: "fin-20260709-b1-max-drawdown-range",
    title: "Maximum Drawdown in Range",
    difficulty: "hard",
    topics: ["Segment Tree", "Range Query", "Risk Management"],
    problem:
      "Given a price series and Q range queries [l, r], return the maximum drawdown (peak-to-trough decline) within each range. Maximum drawdown = max over all i ≤ j in [l,r] of (prices[i] - prices[j]). This is a core risk metric queried in real time over rolling windows. Brute force is O(N²) per query; you need O(N log N) build and O(log N) per query.",
    examples: [
      {
        input: "prices = [10, 7, 9, 3, 8, 2, 6], queries = [[0, 6], [1, 4], [3, 5]]",
        output: "[8, 6, 6]",
        explanation:
          "[0,6]: peak 10 at idx 0, trough 2 at idx 5 → drawdown 8. [1,4]: peak 9 at idx 2, trough 3 at idx 3 → 6. [3,5]: peak 8 at idx 4, trough 2 at idx 5 → 6.",
      },
    ],
    constraints: [
      "1 ≤ len(prices) ≤ 10^5",
      "1 ≤ Q ≤ 10^5",
      "0 ≤ l ≤ r < len(prices)",
    ],
    approach:
      "Build a segment tree where each node stores (max_price, min_price, max_drawdown) for its interval. Merge: drawdown = max(left.drawdown, right.drawdown, left.max_price - right.min_price). The cross term captures the case where the peak is in the left half and the trough in the right half.",
    code: `from typing import List, Tuple
import math

class DrawdownTree:
    def __init__(self, prices: List[float]):
        self.n = len(prices)
        # Each node: [max_price, min_price, max_drawdown]
        self.tree: list[list[float]] = [[0.0, 0.0, 0.0]] * (4 * self.n)
        self._build(prices, 1, 0, self.n - 1)

    def _build(self, prices: List[float], node: int, lo: int, hi: int) -> None:
        if lo == hi:
            self.tree[node] = [prices[lo], prices[lo], 0.0]
            return
        mid = (lo + hi) // 2
        self._build(prices, 2 * node, lo, mid)
        self._build(prices, 2 * node + 1, mid + 1, hi)
        self.tree[node] = self._merge(self.tree[2 * node], self.tree[2 * node + 1])

    def _merge(self, L: list, R: list) -> list:
        max_p = max(L[0], R[0])
        min_p = min(L[1], R[1])
        dd = max(L[2], R[2], L[0] - R[1])   # cross: peak in left, trough in right
        return [max_p, min_p, dd]

    def query(self, node: int, lo: int, hi: int, l: int, r: int) -> list:
        if r < lo or hi < l:
            return [-math.inf, math.inf, 0.0]
        if l <= lo and hi <= r:
            return self.tree[node]
        mid = (lo + hi) // 2
        L = self.query(2 * node, lo, mid, l, r)
        R = self.query(2 * node + 1, mid + 1, hi, l, r)
        return self._merge(L, R)

    def max_drawdown(self, l: int, r: int) -> float:
        return self.query(1, 0, self.n - 1, l, r)[2]

def solve(prices: List[float], queries: List[Tuple[int, int]]) -> List[float]:
    tree = DrawdownTree(prices)
    return [tree.max_drawdown(l, r) for l, r in queries]`,
    language: "python",
    complexity: { time: "O((N + Q) log N)", space: "O(N)" },
  },
  {
    id: "fin-20260709-b1-portfolio-knapsack",
    title: "Portfolio Selection 0-1 Knapsack",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Knapsack", "Portfolio Optimisation"],
    problem:
      "You have a budget (integer, in thousands). Each candidate asset has an integer cost (in thousands) and an expected annual return (float). You can invest in each asset at most once. Maximise total expected return subject to the budget. This is a simplified mean-return portfolio construction problem — real allocators use it when positions are indivisible (e.g. real estate, CLOs).",
    examples: [
      {
        input:
          "assets = [(0.12, 3), (0.18, 5), (0.09, 2), (0.22, 6)], budget = 10",
        output: "0.39",
        explanation:
          "Select assets 0 (cost 3, ret 0.12), 1 (cost 5, ret 0.18), 2 (cost 2, ret 0.09): total cost 10 = budget, total return 0.39. Asset 3 (cost 6) cannot be added without exceeding budget.",
      },
    ],
    constraints: [
      "1 ≤ len(assets) ≤ 100",
      "1 ≤ budget ≤ 500",
      "Costs are positive integers; returns are positive floats.",
    ],
    approach:
      "Standard 0-1 knapsack DP. dp[w] = max expected return achievable with budget w. Iterate assets in order; for each asset iterate w from budget down to asset cost to avoid reusing the same asset. Final answer is dp[budget].",
    code: `from typing import List, Tuple

def max_portfolio_return(assets: List[Tuple[float, int]], budget: int) -> float:
    # assets: List of (expected_return, cost_in_thousands)
    dp = [0.0] * (budget + 1)

    for expected_ret, cost in assets:
        # Traverse backwards to enforce 0-1 constraint
        for w in range(budget, cost - 1, -1):
            dp[w] = max(dp[w], dp[w - cost] + expected_ret)

    return round(dp[budget], 6)

# Example usage
assets = [(0.12, 3), (0.18, 5), (0.09, 2), (0.22, 6)]
budget = 10
print(max_portfolio_return(assets, budget))  # 0.39`,
    language: "python",
    complexity: { time: "O(N × budget)", space: "O(budget)" },
  },
  {
    id: "fin-20260709-b1-instrument-flags",
    title: "Instrument Status Flag Operations",
    difficulty: "easy",
    topics: ["Bit Manipulation", "Design", "Market Microstructure"],
    problem:
      "An exchange assigns each instrument a 32-bit integer status word. Flags: TRADING=bit0, HALTED=bit1, AUCTION=bit2, SHORT_EXEMPT=bit3, FAST_MARKET=bit4. Implement set_flag, clear_flag, toggle_flag, has_flag, is_tradeable (TRADING set AND HALTED clear AND AUCTION clear), and active_flag_names. These operations must be O(1) — they run in the hot path of the matching engine.",
    examples: [
      {
        input:
          "Set TRADING, set FAST_MARKET, check is_tradeable; then set HALTED, check is_tradeable again",
        output: "True, False",
        explanation:
          "With TRADING|FAST_MARKET (0b10001) instrument is tradeable. After setting HALTED (0b10011) it is not.",
      },
    ],
    constraints: [
      "All operations must be O(1).",
      "Flag values are powers of 2.",
      "Combinations of flags may be set/cleared in one call using bitwise OR of flag constants.",
    ],
    approach:
      "Store flags in a single integer. set uses |=, clear uses &= ~flag, toggle uses ^=, has uses &. Tradeability is a boolean combination expressible in a single bitmask comparison.",
    code: `from typing import List

class InstrumentStatus:
    TRADING      = 1 << 0
    HALTED       = 1 << 1
    AUCTION      = 1 << 2
    SHORT_EXEMPT = 1 << 3
    FAST_MARKET  = 1 << 4

    _FLAG_NAMES = {
        TRADING: "TRADING", HALTED: "HALTED", AUCTION: "AUCTION",
        SHORT_EXEMPT: "SHORT_EXEMPT", FAST_MARKET: "FAST_MARKET",
    }

    def __init__(self) -> None:
        self._flags: int = 0

    def set_flag(self, flag: int) -> None:
        self._flags |= flag

    def clear_flag(self, flag: int) -> None:
        self._flags &= ~flag

    def toggle_flag(self, flag: int) -> None:
        self._flags ^= flag

    def has_flag(self, flag: int) -> bool:
        return bool(self._flags & flag)

    def is_tradeable(self) -> bool:
        must_set   = self.TRADING
        must_clear = self.HALTED | self.AUCTION
        return (self._flags & must_set) == must_set and (self._flags & must_clear) == 0

    def active_flag_names(self) -> List[str]:
        return [name for bit, name in self._FLAG_NAMES.items() if self._flags & bit]`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(1)" },
  },
  {
    id: "fin-20260709-b1-position-tracker",
    title: "Real-Time Position Tracker with Realised P&L",
    difficulty: "medium",
    topics: ["Design", "Hash Map", "Trading Systems"],
    problem:
      "Design a PositionTracker that processes fills in real time. A fill is (symbol, qty, price) where qty is positive for buys and negative for sells. Track net position and average cost per symbol using FIFO cost basis. Provide: fill(symbol, qty, price) → cumulative realised P&L for that symbol; unrealised_pnl(symbol, mark_price) → current open P&L at mark; net_position(symbol) → current net qty.",
    examples: [
      {
        input:
          "fill('AAPL', 100, 150.0); fill('AAPL', -60, 155.0); unrealised_pnl('AAPL', 160.0)",
        output: "fill returns 300.0; unrealised_pnl returns 400.0",
        explanation:
          "Buy 100 @ 150 (avg cost=150). Sell 60 @ 155: realise 60*(155-150)=300. Remaining 40 @ avg 150: unreal = 40*(160-150)=400.",
      },
    ],
    constraints: [
      "Up to 10^6 fills; O(1) per operation.",
      "qty can be positive (buy) or negative (sell).",
      "Partial close: closing qty less than current position size.",
      "Position may flip direction (sell more than current long).",
    ],
    approach:
      "Store per-symbol state: (net_qty, avg_cost, realised_pnl). On a fill that reduces position, compute realised P&L on the closed portion. If the fill flips direction, split: close the existing position fully (realising P&L), then open the remainder in the new direction at fill price.",
    code: `from collections import defaultdict
from typing import Dict

class PositionTracker:
    def __init__(self) -> None:
        # state: {symbol: [net_qty, avg_cost, realised_pnl]}
        self._state: Dict[str, list] = defaultdict(lambda: [0, 0.0, 0.0])

    def fill(self, symbol: str, qty: int, price: float) -> float:
        s = self._state[symbol]
        net_qty, avg_cost, realised = s

        if net_qty == 0:
            s[0], s[1] = qty, price
        elif (net_qty > 0) == (qty > 0):
            # Same direction: update weighted average cost
            total_cost = net_qty * avg_cost + qty * price
            s[0] = net_qty + qty
            s[1] = total_cost / s[0]
        else:
            # Opposite direction: realise P&L on closed portion
            close_qty = min(abs(qty), abs(net_qty))
            direction = 1 if net_qty > 0 else -1
            s[2] += close_qty * direction * (price - avg_cost)

            remaining_qty = net_qty + qty
            if remaining_qty == 0:
                s[0], s[1] = 0, 0.0
            elif (remaining_qty > 0) == (net_qty > 0):
                # Still same direction, position partially closed
                s[0] = remaining_qty
            else:
                # Position flipped direction
                s[0] = remaining_qty
                s[1] = price   # new avg cost at fill price

        return s[2]   # cumulative realised P&L

    def unrealised_pnl(self, symbol: str, mark_price: float) -> float:
        net_qty, avg_cost, _ = self._state[symbol]
        return net_qty * (mark_price - avg_cost)

    def net_position(self, symbol: str) -> int:
        return self._state[symbol][0]`,
    language: "python",
    complexity: { time: "O(1) per fill", space: "O(S) for S symbols" },
  },
  {
    id: "fin-20260709-b1-fx-arbitrage-bf",
    title: "FX Triangular Arbitrage via Bellman-Ford",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Negative Cycle", "FX Markets"],
    problem:
      "Given N currencies and an N×N matrix of exchange rates (rates[i][j] = amount of currency j per unit of currency i, 0 if no direct quote), detect whether a profitable arbitrage cycle exists and return the cycle as a list of currency names. A cycle is profitable if the product of rates along the cycle exceeds 1.0. Return [] if no arbitrage exists.",
    examples: [
      {
        input:
          'currencies = ["USD","EUR","GBP"], rates = [[1,0.93,0.79],[1.08,1,0.86],[1.27,1.16,1]]',
        output: '["USD", "EUR", "GBP", "USD"]',
        explanation:
          "1 USD → 0.93 EUR → 0.93*1.16=1.0788 GBP → 1.0788*1.27=1.37 USD. Product > 1, so arbitrage exists.",
      },
    ],
    constraints: [
      "2 ≤ N ≤ 20 currencies",
      "rates[i][i] = 1, rates[i][j] = 0 means no direct quote",
      "Return any valid cycle; if multiple exist return any.",
    ],
    approach:
      "Take negative log of each rate. A profitable cycle (product > 1) becomes a negative-weight cycle (sum of -log rates < 0). Run Bellman-Ford for N-1 rounds from a virtual source; on round N check for further relaxation to detect the negative cycle. Trace the cycle via predecessor array.",
    code: `import math
from typing import List, Optional

def find_fx_arbitrage(currencies: List[str], rates: List[List[float]]) -> List[str]:
    n = len(currencies)
    INF = float("inf")

    # Build edge list with negative-log weights
    edges: list[tuple[int, int, float]] = []
    for i in range(n):
        for j in range(n):
            if i != j and rates[i][j] > 0:
                edges.append((i, j, -math.log(rates[i][j])))

    # Add virtual source (node n) with 0-weight edges to all currencies
    for i in range(n):
        edges.append((n, i, 0.0))

    dist = [INF] * (n + 1)
    pred = [-1] * (n + 1)
    dist[n] = 0.0

    for _ in range(n):          # n passes (N-1 standard + 1 detection)
        updated = False
        for u, v, w in edges:
            if dist[u] < INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                pred[v] = u
                updated = True
        if not updated:
            return []            # no negative cycle possible

    # Find a vertex in a negative cycle
    cycle_vertex: Optional[int] = None
    for u, v, w in edges:
        if dist[u] < INF and dist[u] + w < dist[v]:
            cycle_vertex = v
            break

    if cycle_vertex is None or cycle_vertex >= n:
        return []

    # Walk back n steps to ensure we are inside the cycle
    node = cycle_vertex
    for _ in range(n):
        node = pred[node]

    # Trace the cycle
    cycle = []
    start = node
    cur = start
    while True:
        cycle.append(currencies[cur])
        cur = pred[cur]
        if cur == start:
            break
    cycle.append(currencies[start])
    cycle.reverse()
    return cycle`,
    language: "python",
    complexity: { time: "O(N³)", space: "O(N²)" },
  },
  {
    id: "fin-20260709-b1-rolling-sharpe-window",
    title: "Fixed-Size Rolling Sharpe Ratio",
    difficulty: "medium",
    topics: ["Sliding Window", "Prefix Sums", "Risk-Adjusted Returns"],
    problem:
      "Given a series of daily returns and a fixed window size k, compute the annualised Sharpe ratio for every window of exactly k days (assume 252 trading days per year, risk-free rate = 0). Return a list of Sharpe ratios of length len(returns) - k + 1. If the standard deviation of a window is 0, report 0 for that window.",
    examples: [
      {
        input: "returns = [0.01, -0.005, 0.02, 0.015, -0.01, 0.03], k = 3",
        output: "[0.923, 3.265, 1.768, 2.449]",
        explanation:
          "Window [0.01,-0.005,0.02]: mean=0.00833, std=0.01031, Sharpe=0.00833/0.01031*sqrt(252)≈1.28. Values rounded for display.",
      },
    ],
    constraints: [
      "k ≤ len(returns) ≤ 10^5",
      "Returns are floats in (-1, 1)",
      "O(N) time using prefix sums for mean and variance",
    ],
    approach:
      "Build prefix sums of returns and returns-squared. For each window [i, i+k-1], compute mean and variance in O(1) using the identity Var(X) = E[X²] - E[X]². Multiply by sqrt(252) to annualise.",
    code: `import math
from typing import List

def rolling_sharpe(returns: List[float], k: int) -> List[float]:
    n = len(returns)
    if n < k:
        return []

    # Prefix sums for fast window mean and variance
    ps  = [0.0] * (n + 1)   # prefix sum of returns
    ps2 = [0.0] * (n + 1)   # prefix sum of returns squared
    for i, r in enumerate(returns):
        ps[i + 1]  = ps[i]  + r
        ps2[i + 1] = ps2[i] + r * r

    ANNUAL = math.sqrt(252)
    result: list[float] = []

    for i in range(n - k + 1):
        s1  = ps[i + k]  - ps[i]
        s2  = ps2[i + k] - ps2[i]
        mean = s1 / k
        var  = s2 / k - mean * mean
        if var <= 0.0:
            result.append(0.0)
        else:
            result.append(mean / math.sqrt(var) * ANNUAL)

    return result`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
  {
    id: "fin-20260709-b1-optimal-stopping",
    title: "Optimal Stopping (Secretary / Best-Offer Problem)",
    difficulty: "hard",
    topics: ["Probability", "Dynamic Programming", "Decision Theory"],
    problem:
      "You observe N bond prices sequentially (random order, all distinct). You must accept or reject each price immediately — you cannot go back. You want to maximise the probability of selecting the highest price. What is the optimal strategy (cutoff k: reject the first k, then accept the first that beats all prior) and what is the resulting success probability? Return (optimal_k, success_probability) rounded to 6 decimal places. This is the classical secretary problem used in optimal execution timing models.",
    examples: [
      {
        input: "N = 10",
        output: "(4, 0.398)",
        explanation:
          "Reject first 3 (k=3), then accept the first price better than all seen. With k=3, P ≈ 0.399. The true optimum is k=3 here giving P≈0.3987. k=4 gives P≈0.3975. Classic result: optimal k ≈ N/e ≈ 3.68 → k=3 or 4.",
      },
    ],
    constraints: [
      "2 ≤ N ≤ 10^4",
      "O(N) time to compute all k candidates.",
      "Return the k in [1, N-1] with the highest success probability; break ties by smallest k.",
    ],
    approach:
      "For a fixed skip length s, the probability of success is P(s) = (s/N) * sum_{i=s+1}^{N} 1/(i-1). Evaluate P(s) for all s in [1, N-1] in O(N) using a running sum. Return the s maximising P(s) and the corresponding probability.",
    code: `from typing import Tuple

def optimal_stopping(n: int) -> Tuple[int, float]:
    # P(reject first s) = (s/n) * sum_{i=s+1}^{n} 1/(i-1)
    # Precompute harmonic tail: tail[s] = sum_{i=s+1}^{n} 1/(i-1)
    # = 1/s + 1/(s+1) + ... + 1/(n-1)
    # Build from right to left for O(N)

    harmonic_tail = [0.0] * (n + 1)
    for s in range(n - 1, 0, -1):
        harmonic_tail[s] = harmonic_tail[s + 1] + 1.0 / s

    best_prob = -1.0
    best_k = 1
    for s in range(1, n):
        prob = (s / n) * harmonic_tail[s]
        if prob > best_prob:
            best_prob = prob
            best_k = s

    return best_k, round(best_prob, 6)

# Classic result: best_k ≈ n/e, best_prob ≈ 1/e ≈ 0.3679
for n in [10, 100, 1000]:
    k, p = optimal_stopping(n)
    print(f"N={n}: reject first {k}, P(success)={p:.4f}")`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
];
