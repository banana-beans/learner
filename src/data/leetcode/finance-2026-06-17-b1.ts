import { LeetCodeProblem } from "./index";

export const financeProblems20260617B1: LeetCodeProblem[] = [
  {
    id: "fin-20260617-b1-sliding-vwap",
    title: "Sliding Window VWAP with Monotonic Deque",
    difficulty: "medium",
    topics: ["sliding-window", "monotonic-deque", "market-data"],
    problem: `You receive a stream of (price, volume) tuples. For each new trade, compute the Volume Weighted Average Price (VWAP) over the last K trades using an efficient data structure. Additionally, maintain the maximum price seen in the current window using a monotonic deque so both metrics are available in O(1) per trade.

Implement class \`VWAPWindow\`:
- \`VWAPWindow(k: int)\`
- \`def add(self, price: float, volume: int) -> tuple[float, float]\` — returns (vwap, max_price) after adding trade.`,
    examples: [
      {
        input: "k=3, trades=[(10,100),(11,200),(12,300),(10,400)]",
        output: "[(10.0,10.0),(10.67,11.0),(11.5,12.0),(11.22,12.0)]",
        explanation: "VWAP at each step uses last k trades. Deque tracks window max efficiently.",
      },
    ],
    constraints: [
      "1 <= k <= 10^5",
      "0.0 < price <= 10^6",
      "1 <= volume <= 10^6",
    ],
    approach: "Maintain a deque for O(1) window max (monotonically decreasing by price). For VWAP keep running sums of price*volume and volume; on eviction subtract the leaving trade's contribution. Both operations are O(1) amortised.",
    code: `from collections import deque

class VWAPWindow:
    def __init__(self, k: int):
        self.k = k
        self.window: deque = deque()   # (price, volume)
        self.mono: deque = deque()     # indices for max-price deque
        self.pv_sum = 0.0
        self.v_sum = 0

    def add(self, price: float, volume: int):
        # Evict oldest if full
        if len(self.window) == self.k:
            old_p, old_v = self.window.popleft()
            self.pv_sum -= old_p * old_v
            self.v_sum  -= old_v
            if self.mono and self.mono[0] == old_p:
                self.mono.popleft()

        self.window.append((price, volume))
        self.pv_sum += price * volume
        self.v_sum  += volume

        # Maintain decreasing monotonic deque for max price
        while self.mono and self.mono[-1] < price:
            self.mono.pop()
        self.mono.append(price)

        vwap = self.pv_sum / self.v_sum
        return vwap, self.mono[0]`,
    language: "python",
    complexity: { time: "O(1) amortised per trade", space: "O(k)" },
    leetcodeNumber: undefined,
  },
  {
    id: "fin-20260617-b1-k-largest-positions",
    title: "K Largest Portfolio Positions (Live Heap)",
    difficulty: "easy",
    topics: ["heap", "portfolio", "streaming"],
    problem: `A risk system receives a stream of position updates (symbol, notional). After each update, return the K largest positions by absolute notional value. Positions are updated in-place: a second message for the same symbol replaces its notional.

Implement \`TopKPositions\`:
- \`__init__(self, k: int)\`
- \`def update(self, symbol: str, notional: float) -> list[tuple[str,float]]\` — returns top-K (symbol, |notional|) sorted descending.`,
    examples: [
      {
        input: "k=2, updates=[('AAPL',1e6),('GOOG',2e6),('MSFT',1.5e6),('AAPL',3e6)]",
        output: "[('AAPL',3e6),('GOOG',2e6)] after last update",
        explanation: "AAPL is updated from 1M to 3M; heap reflects the latest values.",
      },
    ],
    constraints: [
      "1 <= k <= 10^4",
      "Symbol is a non-empty string",
      "Notional may be negative (short positions)",
    ],
    approach: "Store a dictionary of current notionals. For top-K, use a min-heap of size K; a lazy-deletion approach handles stale heap entries from prior updates. After each update rebuild from dict if heap is stale, otherwise push and pop.",
    code: `import heapq

class TopKPositions:
    def __init__(self, k: int):
        self.k = k
        self.positions: dict[str, float] = {}

    def update(self, symbol: str, notional: float) -> list[tuple[str, float]]:
        self.positions[symbol] = abs(notional)
        # For simplicity, nlargest on each call — O(n) but correct
        # Production: lazy-deletion heap for O(log n) amortised
        return heapq.nlargest(self.k, self.positions.items(), key=lambda x: x[1])

# Efficient lazy-deletion variant
class TopKPositionsLazy:
    def __init__(self, k: int):
        self.k = k
        self.pos: dict[str, float] = {}
        self.heap: list = []  # min-heap: (notional, symbol)

    def update(self, symbol: str, notional: float) -> list[tuple[str, float]]:
        self.pos[symbol] = abs(notional)
        heapq.heappush(self.heap, (abs(notional), symbol))
        # Prune stale entries from top
        while self.heap and self.heap[0][1] in self.pos and \
              self.heap[0][0] != self.pos[self.heap[0][1]]:
            heapq.heappop(self.heap)
        top = heapq.nlargest(self.k, self.pos.items(), key=lambda x: x[1])
        return top`,
    language: "python",
    complexity: { time: "O(n log k) amortised (lazy)", space: "O(n)" },
    leetcodeNumber: 215,
  },
  {
    id: "fin-20260617-b1-portfolio-knapsack",
    title: "Portfolio Allocation Knapsack",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack", "portfolio"],
    problem: `You have a capital budget W (integer units). There are N investment opportunities, each requiring capital[i] units and yielding expected_return[i]. You may invest in each opportunity at most once. Find the maximum total expected return without exceeding the budget.

This is the 0/1 knapsack problem applied to portfolio construction.`,
    examples: [
      {
        input: "W=10, capital=[3,4,5,2], returns=[4,5,6,3]",
        output: "10",
        explanation: "Choose investments 0+1+3 (cost=9, return=12) or 1+2 (cost=9, return=11); optimal is 0+1+3 return=12. Wait: 3+4+2=9<=10, 4+5+3=12. Or try 0+2+3: 3+5+2=10, 4+6+3=13. Answer=13.",
      },
    ],
    constraints: [
      "1 <= N <= 100",
      "1 <= W <= 10^4",
      "1 <= capital[i], returns[i] <= 1000",
    ],
    approach: "Standard 0/1 knapsack DP. dp[w] = max return using exactly w capital. Iterate investments; update dp backwards to avoid reuse. Track choices for backtracking to recover the selected investments.",
    code: `def portfolio_knapsack(W: int, capital: list[int], returns: list[int]):
    n = len(capital)
    dp = [0] * (W + 1)
    # For reconstruction
    choice = [[False]*n for _ in range(W + 1)]

    for i in range(n):
        for w in range(W, capital[i] - 1, -1):
            val = dp[w - capital[i]] + returns[i]
            if val > dp[w]:
                dp[w] = val
                choice[w] = choice[w - capital[i]][:]
                choice[w][i] = True

    # Reconstruct
    selected = [i for i, c in enumerate(choice[W]) if c]
    print(f"Max return: {dp[W]}")
    print(f"Selected investments: {selected}")
    print(f"Capital used: {sum(capital[i] for i in selected)}")
    return dp[W], selected

portfolio_knapsack(10, [3,4,5,2], [4,5,6,3])`,
    language: "python",
    complexity: { time: "O(N*W)", space: "O(N*W)" },
    leetcodeNumber: 416,
  },
  {
    id: "fin-20260617-b1-rate-limiter",
    title: "Token Bucket Rate Limiter for Order Flow",
    difficulty: "medium",
    topics: ["design", "sliding-window", "order-management"],
    problem: `Design a token bucket rate limiter for an order management system. The limiter allows at most \`max_tokens\` orders per \`window_seconds\` rolling window. Each call to \`allow(timestamp_ms)\` returns True if the order is permitted and consumes one token, False otherwise. The window is a sliding (not fixed) window.`,
    examples: [
      {
        input: "max_tokens=3, window=1000ms; calls at t=0,300,600,900,1200",
        output: "[True,True,True,False,True]",
        explanation: "At t=900 all 3 slots used. At t=1200 the t=0 slot has expired, freeing one token.",
      },
    ],
    constraints: [
      "0 <= timestamp_ms <= 10^12",
      "1 <= max_tokens <= 10^6",
      "Timestamps are non-decreasing",
    ],
    approach: "Use a deque to store timestamps of allowed orders. On each call evict timestamps older than (current - window). If queue length < max_tokens, append and return True; else return False.",
    code: `from collections import deque

class RateLimiter:
    def __init__(self, max_tokens: int, window_ms: int):
        self.max_tokens = max_tokens
        self.window = window_ms
        self.timestamps: deque[int] = deque()

    def allow(self, ts_ms: int) -> bool:
        # Evict expired timestamps
        while self.timestamps and self.timestamps[0] <= ts_ms - self.window:
            self.timestamps.popleft()

        if len(self.timestamps) < self.max_tokens:
            self.timestamps.append(ts_ms)
            return True
        return False

# Test
rl = RateLimiter(max_tokens=3, window_ms=1000)
for ts in [0, 300, 600, 900, 1200]:
    print(f"t={ts:4d}ms: {rl.allow(ts)}")`,
    language: "python",
    complexity: { time: "O(1) amortised", space: "O(max_tokens)" },
    leetcodeNumber: undefined,
  },
  {
    id: "fin-20260617-b1-stock-span",
    title: "Stock Span (Monotonic Stack)",
    difficulty: "easy",
    topics: ["monotonic-stack", "streaming", "market-data"],
    problem: `The stock span on a given day is the maximum number of consecutive days (including today) for which the stock price was less than or equal to today's price. Implement a streaming \`StockSpanner\` class that computes the span for each new price in O(1) amortised time.`,
    examples: [
      {
        input: "prices = [100, 80, 60, 70, 60, 75, 85]",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation: "Price 75 spans back to 60,70,60 plus itself (4). Price 85 spans all previous 6 plus itself.",
      },
    ],
    constraints: [
      "1 <= price <= 10^5",
      "At most 10^4 calls to next()",
    ],
    approach: "Maintain a monotonic decreasing stack of (price, span) pairs. When a new price arrives, pop all stack elements with price <= current and accumulate their spans. Push (current_price, total_span) onto the stack.",
    code: `class StockSpanner:
    def __init__(self):
        self.stack: list[tuple[int,int]] = []  # (price, span)

    def next(self, price: int) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]
        self.stack.append((price, span))
        return span

spanner = StockSpanner()
prices = [100, 80, 60, 70, 60, 75, 85]
print([spanner.next(p) for p in prices])`,
    language: "python",
    complexity: { time: "O(1) amortised", space: "O(n)" },
    leetcodeNumber: 901,
  },
  {
    id: "fin-20260617-b1-max-profit-k-tx",
    title: "Best Time to Buy/Sell Stock — At Most K Transactions",
    difficulty: "hard",
    topics: ["dynamic-programming", "trading", "finance"],
    problem: `Given an array of daily stock prices and an integer k, find the maximum profit achievable with at most k buy-sell transactions. A transaction is one buy followed by one sell; you must sell before buying again. You cannot hold more than one stock simultaneously.`,
    examples: [
      {
        input: "k=2, prices=[3,2,6,5,0,3]",
        output: "7",
        explanation: "Buy at 2, sell at 6 (profit 4); buy at 0, sell at 3 (profit 3). Total 7.",
      },
    ],
    constraints: [
      "0 <= k <= 100",
      "0 <= prices[i] <= 1000",
      "1 <= len(prices) <= 1000",
    ],
    approach: "DP with state (transaction count, hold/no-hold). dp[i][j][0/1] = max profit after day i using j transactions with 0/1 stocks held. If k >= n//2 then unlimited transactions (greedy). Space-optimise to O(k).",
    code: `def max_profit_k(k: int, prices: list[int]) -> int:
    n = len(prices)
    if not prices or k == 0:
        return 0

    # If k >= n//2, unlimited transactions
    if k >= n // 2:
        return sum(max(prices[i+1]-prices[i], 0) for i in range(n-1))

    # dp[j][0/1]: max profit with j tx, not holding / holding
    INF = float('inf')
    dp = [[-INF, -INF] for _ in range(k + 1)]
    dp[0][0] = 0

    for price in prices:
        new_dp = [[-INF, -INF] for _ in range(k + 1)]
        for j in range(k + 1):
            # Not holding: either stay or sell
            new_dp[j][0] = max(dp[j][0], dp[j][1] + price if dp[j][1] != -INF else -INF)
            # Holding: either stay or buy (uses transaction j)
            if j > 0:
                new_dp[j][1] = max(dp[j][1], dp[j-1][0] - price if dp[j-1][0] != -INF else -INF)
        dp = new_dp

    return max(dp[j][0] for j in range(k + 1) if dp[j][0] != -INF)

print(max_profit_k(2, [3,2,6,5,0,3]))  # 7
print(max_profit_k(2, [1,2,3,4,5]))    # 4`,
    language: "python",
    complexity: { time: "O(n*k)", space: "O(k)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260617-b1-markov-steady-state",
    title: "Markov Chain Steady-State for Credit Migration",
    difficulty: "medium",
    topics: ["linear-algebra", "markov-chains", "credit"],
    problem: `Credit rating agencies publish annual migration matrices P[i][j] = P(move from rating i to rating j in one year). Given an n×n transition matrix (rows sum to 1), compute the steady-state distribution pi such that pi @ P = pi. Also compute the expected time for a single-B bond to reach default (absorption time).

Input: transition matrix as a list of lists (last state is absorbing default).`,
    examples: [
      {
        input: "P = [[0.9,0.05,0.05],[0.1,0.8,0.1],[0,0,1]]",
        output: "steady_state=[0,0,1] (absorbing); absorption time from state 0 ≈ 22 years",
        explanation: "Default is absorbing so eventually all mass flows there. Mean absorption time = (I-Q)^{-1} * 1.",
      },
    ],
    constraints: [
      "2 <= n <= 20",
      "Rows sum to 1.0",
      "Last state is absorbing (P[n-1][n-1]=1)",
    ],
    approach: "For ergodic chains: solve pi @ P = pi with sum(pi)=1 via eigenvalue decomposition (eigenvector for eigenvalue 1). For absorbing chains with default state: partition into transient Q and absorbing R; fundamental matrix N=(I-Q)^{-1}; absorption times = N @ 1.",
    code: `import numpy as np

def credit_migration_analysis(P_list: list[list[float]]):
    P = np.array(P_list, dtype=float)
    n = len(P)

    # Steady state via left eigenvector (eigenvalue = 1)
    vals, vecs = np.linalg.eig(P.T)
    idx = np.argmin(np.abs(vals - 1.0))
    pi = np.real(vecs[:, idx])
    pi = np.abs(pi) / np.abs(pi).sum()
    print(f"Steady-state: {np.round(pi, 4)}")

    # Absorption times (transient states = all but default)
    transient = n - 1
    Q = P[:transient, :transient]
    I = np.eye(transient)
    try:
        N = np.linalg.inv(I - Q)  # fundamental matrix
        t_absorb = N.sum(axis=1)  # expected years to default
        for i in range(transient):
            print(f"  State {i}: E[time to default] = {t_absorb[i]:.2f} yrs")
    except np.linalg.LinAlgError:
        print("(I-Q) singular — chain may not be absorbing")
    return pi

P = [[0.85, 0.10, 0.05],
     [0.05, 0.80, 0.15],
     [0.00, 0.00, 1.00]]
credit_migration_analysis(P)`,
    language: "python",
    complexity: { time: "O(n^3)", space: "O(n^2)" },
    leetcodeNumber: undefined,
  },
  {
    id: "fin-20260617-b1-fx-bitmask",
    title: "FX Multi-Currency Exposure Bitmask",
    difficulty: "medium",
    topics: ["bitmask", "bit-manipulation", "fx"],
    problem: `A portfolio has positions in N currencies (N <= 20). Each trade is encoded as a bitmask of the currencies it involves (e.g. a USD/EUR trade has bits 0 and 1 set). Given a list of trades, find all subsets of currencies such that every trade in the portfolio involves at least one currency in that subset — this is a minimum dominating set approximation. Also compute the net currency exposure from a list of (currency_index, signed_notional) pairs using bitmask grouping.`,
    examples: [
      {
        input: "trades = [0b011, 0b110, 0b101] (3 currencies, 3 trades)",
        output: "Subset 0b111 dominates all; smallest subset: 0b011 (covers trades 0,1), need +0b101 for trade 2",
        explanation: "Find minimum bitmask that shares at least one bit with every trade mask.",
      },
    ],
    constraints: [
      "1 <= N <= 20",
      "1 <= len(trades) <= 1000",
    ],
    approach: "Iterate subsets in order of popcount. For each subset, check if every trade mask has non-zero AND with subset. Return first subset that covers all trades. For small N, brute force over 2^N subsets ordered by size.",
    code: `def min_currency_cover(n: int, trades: list[int]) -> int:
    from itertools import combinations

    all_currencies = (1 << n) - 1
    # Try subsets of increasing size
    for size in range(1, n + 1):
        for bits in combinations(range(n), size):
            subset = sum(1 << b for b in bits)
            if all(subset & t for t in trades):
                print(f"Min covering subset: {bin(subset)} (size={size})")
                return subset
    return all_currencies

def net_fx_exposure(n: int, positions: list[tuple[int,float]]) -> dict:
    """Sum notionals per currency using bitmask index."""
    exposure = [0.0] * n
    for ccy_idx, notional in positions:
        exposure[ccy_idx] += notional
    result = {i: exposure[i] for i in range(n) if abs(exposure[i]) > 1e-9}
    print("Net FX exposure:", {f"CCY{k}": round(v,2) for k,v in result.items()})
    return result

# Test
trades = [0b011, 0b110, 0b101]
min_currency_cover(3, trades)
positions = [(0, 1e6), (1, -500e3), (2, 200e3), (0, -300e3)]
net_fx_exposure(3, positions)`,
    language: "python",
    complexity: { time: "O(2^n * trades) brute force", space: "O(n)" },
    leetcodeNumber: undefined,
  },
  {
    id: "fin-20260617-b1-min-cash-flow",
    title: "Minimum Cash Flow Settlement",
    difficulty: "medium",
    topics: ["greedy", "graph", "settlement"],
    problem: `N desks in a bank owe each other money. Given an NxN matrix where debt[i][j] is the amount desk i owes desk j, compute the minimum number of net transfers needed to settle all debts. This is the "Minimum Cash Flow" problem: compute net positions, then greedily pair largest creditor with largest debtor.`,
    examples: [
      {
        input: "debt=[[0,1000,2000],[0,0,5000],[0,0,0]]",
        output: "2 transfers: desk0→desk1(1000), desk0+desk2 combined",
        explanation: "Net: desk0 owes 3000, desk1 receives 1000-5000=-4000 net... settle with 2 transfers.",
      },
    ],
    constraints: [
      "2 <= N <= 20",
      "0 <= debt[i][j] <= 10^6",
    ],
    approach: "Compute net balance per desk (what they receive minus what they owe). Greedily match the maximum creditor with the maximum debtor: transfer min(|credit|, |debit|), reduce both, repeat until all settled. Count transfers.",
    code: `import heapq

def min_cash_flow(debt: list[list[int]]) -> int:
    n = len(debt)
    net = [0] * n
    for i in range(n):
        for j in range(n):
            net[j] += debt[i][j]  # j receives
            net[i] -= debt[i][j]  # i pays

    # Max-heap for creditors, min-heap (negated) for debtors
    credits = [-x for x in net if x > 0]  # negate for max-heap
    debits  = [x  for x in net if x < 0]  # most negative = most owed
    heapq.heapify(credits)
    heapq.heapify(debits)

    transfers = 0
    while credits and debits:
        credit = -heapq.heappop(credits)
        debit  = -heapq.heappop(debits)   # debit is negative
        settled = min(credit, -debit)
        print(f"Transfer \${settled:,.0f}: debtor → creditor")
        transfers += 1
        remaining_credit = credit - settled
        remaining_debit  = debit  + settled  # less negative
        if remaining_credit > 1e-9:
            heapq.heappush(credits, -remaining_credit)
        if remaining_debit < -1e-9:
            heapq.heappush(debits, -remaining_debit)

    print(f"Total transfers: {transfers}")
    return transfers

debt = [[0,1000,2000],[0,0,5000],[0,0,0]]
min_cash_flow(debt)`,
    language: "python",
    complexity: { time: "O(n^2 + n log n)", space: "O(n)" },
    leetcodeNumber: undefined,
  },
  {
    id: "fin-20260617-b1-order-book-design",
    title: "Design an Order Book",
    difficulty: "hard",
    topics: ["design", "sorted-containers", "order-book"],
    problem: `Design an order book that supports:
- \`add_order(order_id, side, price, qty)\`: add a limit order (side='buy'|'sell')
- \`cancel_order(order_id)\`: cancel an existing order
- \`get_best_bid()\`: return the best (highest) bid price and total quantity at that level
- \`get_best_ask()\`: return the best (lowest) ask price and total quantity at that level
- \`match()\`: match best bid against best ask if bid >= ask; returns list of (price,qty) fills

All operations should be as efficient as possible.`,
    examples: [
      {
        input: "add(1,'buy',100,200); add(2,'sell',101,150); add(3,'buy',101,100); match()",
        output: "fill at 101, qty 100 (order3 vs order2)",
        explanation: "Order 3 bid at 101 crosses ask at 101. Partial fill of order 2.",
      },
    ],
    constraints: [
      "1 <= order_id <= 10^9",
      "0.01 <= price <= 10^6",
      "1 <= qty <= 10^6",
      "At most 10^5 operations",
    ],
    approach: "Use two sorted dicts (bids: descending, asks: ascending) mapping price→total_qty. Track individual orders in a hash map for O(1) cancel. On cancel, reduce the price level qty; remove level if zero. Matching iterates levels until spread is negative.",
    code: `from sortedcontainers import SortedDict

class OrderBook:
    def __init__(self):
        self.bids: SortedDict = SortedDict(lambda k: -k)  # highest bid first
        self.asks: SortedDict = SortedDict()               # lowest ask first
        self.orders: dict = {}  # id -> (side, price, qty)

    def add_order(self, order_id: int, side: str, price: float, qty: int):
        book = self.bids if side == 'buy' else self.asks
        book[price] = book.get(price, 0) + qty
        self.orders[order_id] = (side, price, qty)

    def cancel_order(self, order_id: int):
        if order_id not in self.orders:
            return
        side, price, qty = self.orders.pop(order_id)
        book = self.bids if side == 'buy' else self.asks
        book[price] -= qty
        if book[price] <= 0:
            del book[price]

    def get_best_bid(self):
        if not self.bids:
            return None, 0
        p = self.bids.keys()[0]
        return p, self.bids[p]

    def get_best_ask(self):
        if not self.asks:
            return None, 0
        p = self.asks.keys()[0]
        return p, self.asks[p]

    def match(self) -> list[tuple[float,int]]:
        fills = []
        while self.bids and self.asks:
            bp, bq = self.get_best_bid()
            ap, aq = self.get_best_ask()
            if bp < ap:
                break
            fill_qty = min(bq, aq)
            fills.append((ap, fill_qty))
            self.bids[bp] -= fill_qty
            self.asks[ap] -= fill_qty
            if self.bids[bp] == 0: del self.bids[bp]
            if self.asks[ap] == 0: del self.asks[ap]
        return fills`,
    language: "python",
    complexity: { time: "O(log n) add/cancel, O(fills) match", space: "O(orders)" },
    leetcodeNumber: undefined,
  },
];
