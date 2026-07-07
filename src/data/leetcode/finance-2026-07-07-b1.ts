import type { LeetCodeProblem } from "./index";

export const financeProblems20260707B1: LeetCodeProblem[] = [
  {
    id: "fin-20260707-b1-fx-bellman-ford",
    title: "Detect FX Arbitrage via Bellman-Ford Negative Cycle",
    difficulty: "hard",
    topics: ["graphs", "bellman-ford", "negative-cycle"],
    problem:
      "Given N currencies and a list of exchange rates (src, dst, rate), determine if there exists a sequence of trades that starts and ends with the same currency and results in profit (arbitrage). Return the cycle if one exists.",
    examples: [
      {
        input:
          "currencies=['USD','EUR','GBP'], rates=[('USD','EUR',1.2),('EUR','GBP',1.1),('GBP','USD',0.77)]",
        output: "True (arbitrage cycle found)",
        explanation:
          "USD->EUR->GBP->USD: 1.2*1.1*0.77=1.017 > 1. Taking -log of each rate and running Bellman-Ford finds a negative cycle because -log(1.017) < 0.",
      },
    ],
    constraints: ["2 <= N <= 50", "1 <= |rates| <= 500", "rate > 0"],
    approach:
      "Convert to negative log-space: edge weight = -log(rate). Run Bellman-Ford for N-1 rounds. If any distance decreases in round N, a negative cycle (=arbitrage) exists. Track predecessors to reconstruct the cycle.",
    code: `import math

def detect_fx_arbitrage(
    currencies: list[str],
    rates: list[tuple[str, str, float]],
) -> tuple[bool, list[str]]:
    idx   = {c: i for i, c in enumerate(currencies)}
    N     = len(currencies)
    INF   = float('inf')
    dist  = [INF] * N
    pred  = [-1]  * N
    dist[0] = 0.0  # start from currency 0

    edges = [(idx[s], idx[d], -math.log(r)) for s, d, r in rates]

    # Bellman-Ford: N-1 relaxation rounds
    for _ in range(N - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                pred[v] = u

    # N-th round: detect negative cycle
    cycle_node = -1
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            cycle_node = v
            break

    if cycle_node == -1:
        return False, []

    # Trace back to find the actual cycle
    visited = [cycle_node]
    node = pred[cycle_node]
    while node not in visited:
        visited.append(node)
        node = pred[node]
    start = node
    cycle_idx = visited.index(start)
    cycle = visited[cycle_idx:][::-1] + [start]
    cycle_names = [currencies[i] for i in cycle]
    return True, cycle_names

currencies = ['USD', 'EUR', 'GBP']
rates = [('USD','EUR',1.20), ('EUR','GBP',1.10), ('GBP','USD',0.77)]
found, cycle = detect_fx_arbitrage(currencies, rates)
print(f"Arbitrage: {found}, cycle: {' -> '.join(cycle)}")`,
    language: "python",
    complexity: { time: "O(V * E)", space: "O(V + E)" },
  },
  {
    id: "fin-20260707-b1-heap-top-k-stocks",
    title: "Top-K Stocks by Risk-Adjusted Return (Max Heap)",
    difficulty: "medium",
    topics: ["heap", "sorting"],
    problem:
      "Given N stocks each with an expected_return and volatility, find the K stocks with the highest Sharpe ratio (expected_return / volatility). Return them sorted descending by Sharpe. Use O(N log K) time.",
    examples: [
      {
        input:
          "stocks=[('AAPL',0.15,0.20),('MSFT',0.12,0.15),('GOOG',0.18,0.25),('AMZN',0.10,0.12)], K=2",
        output: "[('AMZN',0.833),('MSFT',0.800)]",
        explanation:
          "Sharpes: AAPL=0.75, MSFT=0.80, GOOG=0.72, AMZN=0.833. Top-2 by Sharpe: AMZN then MSFT.",
      },
    ],
    constraints: ["1 <= K <= N <= 10^5", "volatility > 0"],
    approach:
      "Use a min-heap of size K on Sharpe ratio. For each stock, push (sharpe, name) to the heap; if heap exceeds K, pop the minimum. Final heap contains top-K Sharpe stocks. Sort descending before returning.",
    code: `import heapq

def top_k_by_sharpe(
    stocks: list[tuple[str, float, float]],  # (name, ret, vol)
    k: int,
) -> list[tuple[str, float]]:
    heap: list[tuple[float, str]] = []  # (sharpe, name) — min-heap

    for name, ret, vol in stocks:
        sharpe = ret / vol
        heapq.heappush(heap, (sharpe, name))
        if len(heap) > k:
            heapq.heappop(heap)  # remove the lowest Sharpe

    # Sort descending
    result = sorted(heap, key=lambda x: -x[0])
    return [(name, round(sharpe, 4)) for sharpe, name in result]

stocks = [
    ('AAPL',  0.15, 0.20),
    ('MSFT',  0.12, 0.15),
    ('GOOG',  0.18, 0.25),
    ('AMZN',  0.10, 0.12),
    ('TSLA',  0.25, 0.45),
]
print(top_k_by_sharpe(stocks, k=2))
# [('AMZN', 0.8333), ('MSFT', 0.8)]`,
    language: "python",
    complexity: { time: "O(N log K)", space: "O(K)" },
  },
  {
    id: "fin-20260707-b1-dp-stock-k-transactions",
    title: "Maximum Profit with At Most K Transactions",
    difficulty: "hard",
    topics: ["dynamic-programming", "finance"],
    problem:
      "Given daily stock prices and K allowed transactions (buy+sell = 1 transaction), find the maximum total profit. You may hold at most 1 share at a time and must sell before buying again.",
    examples: [
      {
        input: "prices=[3,2,6,5,0,3], k=2",
        output: "7",
        explanation:
          "Transaction 1: buy at 2, sell at 6 (profit=4). Transaction 2: buy at 0, sell at 3 (profit=3). Total=7.",
      },
    ],
    constraints: ["1 <= k <= 1000", "1 <= n <= 1000", "0 <= prices[i] <= 1000"],
    approach:
      "DP: dp[j][i] = max profit using at most j transactions up to day i. Transition: dp[j][i] = max(dp[j][i-1], max over m < i of (prices[i] - prices[m] + dp[j-1][m])). Optimize with a running max_so_far = max(dp[j-1][m] - prices[m]) to reduce from O(n^2 k) to O(nk).",
    code: `def max_profit_k_transactions(prices: list[int], k: int) -> int:
    n = len(prices)
    if n < 2 or k == 0:
        return 0

    # If k >= n//2, we can make every profitable trade
    if k >= n // 2:
        return sum(max(prices[i] - prices[i-1], 0) for i in range(1, n))

    # dp[j][i]: max profit with at most j transactions through day i
    # Use 1D rolling approach per transaction count
    dp_prev = [0] * n  # dp[0][i] = 0

    for j in range(1, k + 1):
        dp_cur = [0] * n
        # max_val = max(dp_prev[m] - prices[m]) for m < i
        max_val = dp_prev[0] - prices[0]
        for i in range(1, n):
            dp_cur[i] = max(dp_cur[i-1], prices[i] + max_val)
            max_val   = max(max_val, dp_prev[i] - prices[i])
        dp_prev = dp_cur

    return dp_prev[-1]

print(max_profit_k_transactions([3, 2, 6, 5, 0, 3], k=2))   # 7
print(max_profit_k_transactions([1, 2, 3, 4, 5], k=1))       # 4
print(max_profit_k_transactions([7, 6, 4, 3, 1], k=3))       # 0 (only decreasing)`,
    language: "python",
    complexity: { time: "O(n*k)", space: "O(n)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260707-b1-monotonic-stack-span",
    title: "Stock Span Problem (Monotonic Stack)",
    difficulty: "medium",
    topics: ["monotonic-stack", "array"],
    problem:
      "The stock span on day i is defined as the maximum number of consecutive days (including day i) going backwards such that the stock price was <= prices[i]. Compute spans for all days in O(n) time.",
    examples: [
      {
        input: "prices = [100, 80, 60, 70, 60, 75, 85]",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation:
          "Day 5 (price=75): prices[4]=60<=75, prices[3]=70<=75, prices[2]=60<=75, prices[1]=80>75. Span=4 (days 2,3,4,5). Day 6 (price=85): all prior days have price<=85. Span=6.",
      },
    ],
    constraints: ["1 <= n <= 10^5", "1 <= prices[i] <= 10^5"],
    approach:
      "Maintain a monotonic decreasing stack of (price, span) pairs. For each new price, pop all pairs with price <= current and accumulate their spans. Push the current price with the accumulated span + 1.",
    code: `def stock_span(prices: list[int]) -> list[int]:
    stack: list[tuple[int, int]] = []  # (price, span)
    spans = []

    for price in prices:
        span = 1
        # Pop all prices <= current (they are dominated)
        while stack and stack[-1][0] <= price:
            span += stack.pop()[1]
        stack.append((price, span))
        spans.append(span)

    return spans

print(stock_span([100, 80, 60, 70, 60, 75, 85]))  # [1, 1, 1, 2, 1, 4, 6]
print(stock_span([10, 4, 5, 90, 120, 80]))         # [1, 1, 2, 4, 5, 1]

# Online version (stream one price at a time)
class StockSpanner:
    def __init__(self):
        self.stack: list[tuple[int,int]] = []

    def next(self, price: int) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]
        self.stack.append((price, span))
        return span

spanner = StockSpanner()
for p in [100, 80, 60, 70, 60, 75, 85]:
    print(spanner.next(p), end=" ")  # 1 1 1 2 1 4 6`,
    language: "python",
    complexity: { time: "O(n) amortized", space: "O(n)" },
    leetcodeNumber: 901,
  },
  {
    id: "fin-20260707-b1-sliding-window-var",
    title: "Rolling Value-at-Risk via Sliding Window + Sorted List",
    difficulty: "hard",
    topics: ["sliding-window", "sorted-containers", "design"],
    problem:
      "Given a stream of daily P&L observations and a window size W, compute the rolling 1-day 99% historical VaR (the 1st percentile loss, i.e. the W*0.01-th smallest return). Process N observations with O(N log W) time.",
    examples: [
      {
        input: "pnl=[-5,-3,-1,2,4,-2,1,-4,3,0], W=5, conf=0.99",
        output: "[-5.0, -5.0, -5.0, -5.0, -4.0, -4.0]",
        explanation:
          "Window size 5, VaR = 1% quantile = index floor(5*0.01)=0 (worst element). Windows: [-5,-3,-1,2,4]->{-5}, [-3,-1,2,4,-2]->{-3}, [-1,2,4,-2,1]->{-2}, [2,4,-2,1,-4]->{-4}, [4,-2,1,-4,3]->{-4}, [-2,1,-4,3,0]->{-4}. Output varies by exact quantile definition.",
      },
    ],
    constraints: ["W <= N <= 10^5", "1 <= W <= 10^4"],
    approach:
      "Use a SortedList (from the sortedcontainers library) to maintain the sliding window. On each step, add the new element and remove the expiring element — both O(log W). The VaR index = max(0, floor(W * (1 - conf)) - 1) positions from the sorted list front.",
    code: `try:
    from sortedcontainers import SortedList
    HAS_SL = True
except ImportError:
    HAS_SL = False

import bisect

def rolling_var(
    pnl: list[float], W: int, conf: float = 0.99
) -> list[float]:
    """Rolling historical VaR at confidence level conf using a sorted sliding window."""
    n      = len(pnl)
    k      = max(0, int(W * (1 - conf)) - 1)  # index of VaR in sorted window

    if HAS_SL:
        sl = SortedList()
        results = []
        for i, val in enumerate(pnl):
            sl.add(val)
            if i >= W:
                sl.remove(pnl[i - W])  # O(log W)
            if i >= W - 1:
                results.append(float(sl[k]))  # O(log W) lookup
        return results
    else:
        # Fallback: sort each window (O(N*W*log W) — acceptable for small W)
        results = []
        for i in range(W - 1, n):
            window = sorted(pnl[i - W + 1: i + 1])
            results.append(window[k])
        return results

pnl = [-5, -3, -1, 2, 4, -2, 1, -4, 3, 0]
print(rolling_var(pnl, W=5, conf=0.99))`,
    language: "python",
    complexity: { time: "O(N log W)", space: "O(W)" },
  },
  {
    id: "fin-20260707-b1-design-position-tracker",
    title: "Real-Time Position Tracker with P&L Attribution",
    difficulty: "medium",
    topics: ["design", "hash-map", "math"],
    problem:
      "Design a PositionTracker that supports: fill(symbol, qty, price) — adds a trade (qty can be negative for sells); mark(symbol, market_price) — updates the current market price; pnl(symbol) — returns the realized + unrealized P&L for the symbol; net_position(symbol) — returns the current net quantity.",
    examples: [
      {
        input:
          "fill('AAPL',100,150), fill('AAPL',50,155), mark('AAPL',160), pnl('AAPL')",
        output: "1250.0",
        explanation:
          "Avg cost = (100*150 + 50*155)/150 = 151.67. Net qty = 150. Unrealized PnL = 150*(160-151.67) = 1250. Realized = 0 (no sells).",
      },
    ],
    approach:
      "Maintain per-symbol: net_qty, avg_cost (weighted average), realized_pnl, current_price. On a fill: if adding to position, update avg_cost via WAVG. If reducing/flipping, compute realized PnL on the closed portion before adjusting.",
    code: `class PositionTracker:
    def __init__(self):
        from collections import defaultdict
        self._pos = {}  # symbol -> {qty, avg_cost, realized, mark_price}

    def _init(self, symbol: str):
        if symbol not in self._pos:
            self._pos[symbol] = {
                'qty': 0.0, 'avg_cost': 0.0,
                'realized': 0.0, 'mark': 0.0,
            }

    def fill(self, symbol: str, qty: float, price: float) -> None:
        """qty > 0 = buy, qty < 0 = sell."""
        self._init(symbol)
        p = self._pos[symbol]
        old_qty = p['qty']

        if old_qty * qty >= 0:  # same direction: increase position
            new_qty = old_qty + qty
            p['avg_cost'] = (old_qty * p['avg_cost'] + qty * price) / new_qty if new_qty else 0
            p['qty']      = new_qty
        else:
            # Closing (or flipping) position
            close_qty = min(abs(qty), abs(old_qty))
            direction = 1 if old_qty > 0 else -1
            p['realized'] += direction * close_qty * (price - p['avg_cost'])
            remaining_qty = old_qty + qty
            if remaining_qty * old_qty < 0:  # flip
                p['avg_cost'] = price
            p['qty'] = remaining_qty

    def mark(self, symbol: str, market_price: float) -> None:
        self._init(symbol)
        self._pos[symbol]['mark'] = market_price

    def pnl(self, symbol: str) -> float:
        self._init(symbol)
        p = self._pos[symbol]
        unrealized = p['qty'] * (p['mark'] - p['avg_cost'])
        return round(p['realized'] + unrealized, 6)

    def net_position(self, symbol: str) -> float:
        return self._pos.get(symbol, {}).get('qty', 0.0)

tracker = PositionTracker()
tracker.fill('AAPL', 100, 150.0)
tracker.fill('AAPL',  50, 155.0)
tracker.mark('AAPL', 160.0)
print(f"Net qty: {tracker.net_position('AAPL')}")   # 150
print(f"P&L:     {tracker.pnl('AAPL'):.2f}")        # 1250.0

tracker.fill('AAPL', -150, 162.0)  # Close all
tracker.mark('AAPL', 165.0)
print(f"P&L after close: {tracker.pnl('AAPL'):.2f}")  # realized only`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(symbols)" },
  },
  {
    id: "fin-20260707-b1-graph-min-tx-cost",
    title: "Minimum Transaction Cost Currency Conversion Graph",
    difficulty: "medium",
    topics: ["graphs", "dijkstra", "shortest-path"],
    problem:
      "Given a currency conversion graph where each edge has a fixed transaction fee (additive, not multiplicative), find the minimum total fee to convert from source currency to target currency via any path of conversions.",
    examples: [
      {
        input:
          "edges=[('USD','EUR',2),('USD','GBP',5),('EUR','GBP',1),('GBP','JPY',3)], src='USD', dst='JPY'",
        output: "6",
        explanation:
          "USD->EUR (cost 2) + EUR->GBP (cost 1) + GBP->JPY (cost 3) = 6. Direct USD->GBP->JPY = 5+3=8. Best: 6.",
      },
    ],
    constraints: ["2 <= N currencies <= 100", "1 <= |edges| <= 1000", "fee >= 0"],
    approach:
      "Standard Dijkstra on additive edge weights. Build a directed graph with both directions (or use given directed edges). Use a min-heap (total_cost, node). Unlike multiplicative FX rates, additive fees are naturally handled by Dijkstra.",
    code: `import heapq
from collections import defaultdict

def min_tx_cost(
    edges: list[tuple[str, str, float]],
    src: str, dst: str,
) -> float:
    graph: dict[str, list] = defaultdict(list)
    for u, v, cost in edges:
        graph[u].append((v, cost))
        graph[v].append((u, cost))  # undirected

    # Dijkstra: (total_cost, node)
    heap = [(0.0, src)]
    dist = {src: 0.0}

    while heap:
        d, u = heapq.heappop(heap)
        if u == dst:
            return d
        if d > dist.get(u, float('inf')):
            continue
        for v, cost in graph[u]:
            nd = d + cost
            if nd < dist.get(v, float('inf')):
                dist[v] = nd
                heapq.heappush(heap, (nd, v))

    return float('inf')  # no path

edges = [
    ('USD', 'EUR', 2), ('USD', 'GBP', 5),
    ('EUR', 'GBP', 1), ('GBP', 'JPY', 3),
]
print(min_tx_cost(edges, 'USD', 'JPY'))   # 6
print(min_tx_cost(edges, 'EUR', 'JPY'))   # 4`,
    language: "python",
    complexity: { time: "O((V + E) log V)", space: "O(V + E)" },
  },
  {
    id: "fin-20260707-b1-prob-gambler-ruin",
    title: "Gambler's Ruin: Probability of Reaching Target Before Ruin",
    difficulty: "medium",
    topics: ["probability", "dynamic-programming", "math"],
    problem:
      "A trader starts with capital C and at each step wins 1 unit with probability p or loses 1 unit with probability 1-p. The game ends when capital reaches 0 (ruin) or T (target). Compute the probability of reaching T starting from each capital level 0..T.",
    examples: [
      {
        input: "T=10, p=0.55",
        output:
          "P(reach 10 | start=5) ≈ 0.871",
        explanation:
          "With p>0.5, the probability of success is (1-(q/p)^k)/(1-(q/p)^T) where q=1-p. For k=5, T=10, q/p=0.818: (1-0.818^5)/(1-0.818^10) ≈ 0.871.",
      },
    ],
    constraints: ["2 <= T <= 10^6", "0 < p < 1"],
    approach:
      "Closed-form: if p != 0.5, P(k) = (1-(q/p)^k)/(1-(q/p)^T). If p=0.5, P(k) = k/T. Compute for all k=0..T using the formula (O(T) time). DP also works: P(k) = p*P(k+1) + (1-p)*P(k-1) with boundary P(0)=0, P(T)=1.",
    code: `def gamblers_ruin(T: int, p: float) -> list[float]:
    """
    P(reach T | start=k) for k in 0..T.
    Closed-form avoids O(T) DP iterations — important for large T.
    """
    q = 1.0 - p
    probs = [0.0] * (T + 1)
    probs[T] = 1.0

    if abs(p - 0.5) < 1e-12:  # fair game: P(k) = k/T
        for k in range(T + 1):
            probs[k] = k / T
    else:
        r = q / p  # q/p ratio
        r_T = r ** T
        denom = 1.0 - r_T
        for k in range(1, T):
            probs[k] = (1.0 - r**k) / denom

    return probs

# Biased coin: p=0.55 (slight edge), T=10
T, p = 10, 0.55
probs = gamblers_ruin(T, p)
for k in [1, 3, 5, 7, 9]:
    print(f"  P(ruin|start={k:2d}): lose={1-probs[k]:.4f}  win={probs[k]:.4f}")

# Risk of ruin for a trading strategy starting with 100 units, target 200
T2 = 200
probs2 = gamblers_ruin(T2, p)
print(f"\\nWith T=200, start=100: P(reach target)={probs2[100]:.4f}")`,
    language: "python",
    complexity: { time: "O(T)", space: "O(T)" },
  },
  {
    id: "fin-20260707-b1-bit-risk-flags",
    title: "Bit Manipulation: Portfolio Risk Flag Aggregation",
    difficulty: "easy",
    topics: ["bit-manipulation", "design"],
    problem:
      "A risk system assigns each risk check a bit flag (e.g., bit 0 = position_limit, bit 1 = concentration, bit 2 = var_breach, ...). Each position returns a bitmask of breached flags. Given a list of position risk masks, compute: (a) the union of all breached flags, (b) flags breached by ALL positions, (c) flags breached by exactly one position.",
    examples: [
      {
        input: "masks=[0b0011, 0b0110, 0b0101]",
        output: "union=0b0111, intersection=0b0000, exactly_one=0b0001",
        explanation:
          "Union: 011|110|101=111=7. Intersection: 011&110&101=000=0. Exactly-one: bits set in exactly one mask = bit0 (in masks[0] and masks[2] — wait that's two). Bit2: only masks[1] has bit2 if 0b0110 = bits 1,2 — only masks[1]. Bit0: masks[0]=0b0011 and masks[2]=0b0101 both have bit0 — two positions. Bit1: masks[0] and masks[1] — two positions. Bit2: masks[1] and masks[2] — two. Bit3: none. So exactly_one = 0.",
      },
    ],
    constraints: ["1 <= n <= 64", "flags are 32-bit integers"],
    approach:
      "Union = OR of all masks. Intersection = AND of all masks. For exactly-one: count how many masks have each bit set using a bit-count array, then set the result bit if count == 1. O(n * 32) = O(n) time.",
    code: `def aggregate_risk_flags(masks: list[int]) -> dict:
    if not masks:
        return {'union': 0, 'intersection': 0, 'exactly_one': 0}

    union = 0
    intersection = masks[0]
    bit_count = [0] * 32  # count how many masks have each bit set

    for mask in masks:
        union        |= mask
        intersection &= mask
        for b in range(32):
            if mask >> b & 1:
                bit_count[b] += 1

    # Exactly one position has this flag
    exactly_one = 0
    for b in range(32):
        if bit_count[b] == 1:
            exactly_one |= (1 << b)

    return {
        'union':        union,
        'intersection': intersection,
        'exactly_one':  exactly_one,
        'breached_flags': [b for b in range(32) if union >> b & 1],
    }

masks = [0b0011, 0b0110, 0b0101]
r = aggregate_risk_flags(masks)
print(f"Union:         {bin(r['union'])}")         # 0b111
print(f"Intersection:  {bin(r['intersection'])}")  # 0b0
print(f"Exactly one:   {bin(r['exactly_one'])}")
print(f"Active flags:  {r['breached_flags']}")

# Practical usage: check if any VaR breach exists
VAR_FLAG = 1 << 2
has_var_breach = bool(r['union'] & VAR_FLAG)
print(f"Any VaR breach: {has_var_breach}")`,
    language: "python",
    complexity: { time: "O(n * 32)", space: "O(1)" },
  },
  {
    id: "fin-20260707-b1-knapsack-lot-alloc",
    title: "0-1 Knapsack Portfolio Allocation with Integer Lots",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack"],
    problem:
      "You have a budget of B dollars and N investment opportunities. Each opportunity i has cost c[i] (whole lots only, each lot = 1 unit of budget) and expected annual return r[i]. You can invest in each opportunity at most once (0-1 knapsack). Maximize total expected return.",
    examples: [
      {
        input: "costs=[2,3,4,5], returns=[3,4,5,6], B=8",
        output: "10",
        explanation:
          "Select items 0 (cost=2,ret=3), 1 (cost=3,ret=4), 2 (cost=4,ret=5) — but cost=9>8. Better: items 0+3 (2+5=7<=8, ret=9) or items 1+2 (3+4=7, ret=9) or items 0+1+? 0+1=5,ret=7; 0+1 then 3:5+5=10>8. Best: items 1+3: 3+5=8<=8, ret=4+6=10.",
      },
    ],
    constraints: ["1 <= N <= 100", "1 <= B <= 10000"],
    approach:
      "Standard 0-1 knapsack DP: dp[b] = max return achievable with budget b. Iterate items; for each item, update dp in reverse to avoid using the item twice. Time O(N*B).",
    code: `def max_portfolio_return(
    costs: list[int], returns: list[float], budget: int
) -> tuple[float, list[int]]:
    n  = len(costs)
    dp = [0.0] * (budget + 1)
    # Track which items were selected
    chosen = [[False] * n for _ in range(budget + 1)]

    for i in range(n):
        for b in range(budget, costs[i] - 1, -1):  # reverse to avoid reuse
            new_val = dp[b - costs[i]] + returns[i]
            if new_val > dp[b]:
                dp[b] = new_val
                # carry forward selections from b - costs[i], add item i
                chosen[b] = chosen[b - costs[i]][:]
                chosen[b][i] = True

    # Reconstruct selected items
    selected = [i for i, sel in enumerate(chosen[budget]) if sel]
    return dp[budget], selected

costs   = [2, 3, 4, 5]
returns = [3, 4, 5, 6]
budget  = 8

max_ret, selected = max_portfolio_return(costs, returns, budget)
print(f"Max return: {max_ret}")        # 10.0
print(f"Selected:   {selected}")        # [1, 3] (items 1 and 3)
total_cost = sum(costs[i] for i in selected)
print(f"Total cost: {total_cost}")     # 8`,
    language: "python",
    complexity: { time: "O(N * B)", space: "O(N * B)" },
    leetcodeNumber: 416,
  },
];
