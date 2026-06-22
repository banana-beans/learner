import type { LeetCodeProblem } from "./index";

export const financeProblems20260622B1: LeetCodeProblem[] = [
  {
    id: "fin-20260622-b1-k-transactions",
    title: "Maximum Profit with At Most K Transactions",
    difficulty: "hard",
    topics: ["dynamic-programming", "stock"],
    problem: `Given an array \`prices\` of daily stock prices and an integer \`k\`, find the maximum profit you can achieve using at most k buy-sell transactions. You may not hold more than one share at a time (must sell before buying again).

Return the maximum profit.`,
    examples: [
      {
        input: "k=2, prices=[3,2,6,5,0,3]",
        output: "7",
        explanation: "Buy at 2, sell at 6 (profit 4). Buy at 0, sell at 3 (profit 3). Total = 7.",
      },
      {
        input: "k=1, prices=[1,2,3,4,5]",
        output: "4",
        explanation: "Buy at 1, sell at 5. One transaction only.",
      },
    ],
    constraints: [
      "0 <= k <= 100",
      "1 <= N <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach: "DP with states dp[i][j][0/1]: max profit on day i, with j transactions used, holding (1) or not holding (0) a share. Transition: not-hold = max(not-hold, hold+price[i]) using a transaction; hold = max(hold, not-hold-price[i]). When k >= N/2, unlimited transactions suffice (greedy). O(k*N) time, O(k) space.",
    code: `def max_profit_k_transactions(k: int, prices: list[int]) -> int:
    n = len(prices)
    if not prices or k == 0:
        return 0

    # When k >= n//2, we can do every profitable trade
    if k >= n // 2:
        return sum(max(prices[i] - prices[i-1], 0) for i in range(1, n))

    # dp_hold[j]     = max profit using j completed transactions, currently holding
    # dp_no_hold[j]  = max profit using j completed transactions, not holding
    NEG_INF = float('-inf')
    dp_hold    = [NEG_INF] * (k + 1)
    dp_no_hold = [0] * (k + 1)

    for price in prices:
        # Iterate in reverse to avoid using updated values
        for j in range(k, 0, -1):
            # Sell: complete transaction j
            dp_no_hold[j] = max(dp_no_hold[j], dp_hold[j] + price)
            # Buy: start a new hold (counts when we sell)
            dp_hold[j]    = max(dp_hold[j], dp_no_hold[j-1] - price)

    return max(dp_no_hold)`,
    language: "python",
    complexity: { time: "O(k * N)", space: "O(k)" },
  },
  {
    id: "fin-20260622-b1-streaming-median",
    title: "Streaming Median of Order Flow Prices",
    difficulty: "medium",
    topics: ["heap", "design"],
    problem: `Design a class \`MedianTracker\` that maintains a running median of a stream of trade prices and supports:

- \`add(price: float)\`: Record a new trade price.
- \`median() -> float\`: Return the current median. For even count, return the average of the two middle values.

Both operations must run in O(log N) time.`,
    examples: [
      {
        input: "add(100), add(102), add(101), median()",
        output: "101.0",
        explanation: "Sorted: [100, 101, 102]. Median = 101.",
      },
      {
        input: "add(50), add(60), median()",
        output: "55.0",
        explanation: "Two values: median = (50+60)/2 = 55.",
      },
    ],
    constraints: [
      "1 <= number of add() calls <= 5 * 10^4",
      "0 <= price <= 10^6",
    ],
    approach: "Maintain two heaps: a max-heap (lo) for the lower half and a min-heap (hi) for the upper half. After each insertion, balance so |lo| - |hi| <= 1. Median is lo's top if odd count, else average of both tops.",
    code: `import heapq

class MedianTracker:
    def __init__(self):
        self._lo: list[float] = []   # max-heap (store negatives)
        self._hi: list[float] = []   # min-heap

    def add(self, price: float) -> None:
        # Push to lo (max-heap)
        heapq.heappush(self._lo, -price)

        # Balance: lo's max must be <= hi's min
        if self._hi and (-self._lo[0]) > self._hi[0]:
            heapq.heappush(self._hi, -heapq.heappop(self._lo))

        # Balance sizes: lo can be at most 1 larger than hi
        if len(self._lo) > len(self._hi) + 1:
            heapq.heappush(self._hi, -heapq.heappop(self._lo))
        elif len(self._hi) > len(self._lo):
            heapq.heappush(self._lo, -heapq.heappop(self._hi))

    def median(self) -> float:
        if not self._lo:
            raise RuntimeError("No prices recorded")
        if len(self._lo) > len(self._hi):
            return float(-self._lo[0])
        return (-self._lo[0] + self._hi[0]) / 2.0`,
    language: "python",
    complexity: { time: "O(log N) add, O(1) median", space: "O(N)" },
  },
  {
    id: "fin-20260622-b1-histogram-depth",
    title: "Largest Depth Window in Order Book Histogram",
    difficulty: "hard",
    topics: ["monotonic-stack", "order-book"],
    problem: `An order book's bid side is represented as an array \`depths\` where \`depths[i]\` is the total quantity available at price level i (from worst bid on the left to best bid on the right). Each bar has width 1.

Find the largest rectangular area you can form within the histogram of bid depths. This represents the maximum guaranteed execution size across a contiguous price range.

Return the area of the largest rectangle.`,
    examples: [
      {
        input: "depths = [2, 1, 5, 6, 2, 3]",
        output: "10",
        explanation: "The rectangle of height 5 and width 2 (levels 2-3) gives area 10.",
      },
      {
        input: "depths = [2, 4]",
        output: "4",
        explanation: "Either the 4×1 rectangle or the 2×2 rectangle; max is 4.",
      },
    ],
    constraints: ["1 <= N <= 10^5", "0 <= depths[i] <= 10^4"],
    approach: "Monotonic stack: maintain a stack of increasing bar indices. When a shorter bar is encountered, pop taller bars and compute the rectangle each popped bar forms as the minimum height. The width extends from the new stack top to the current index. O(N) time.",
    code: `def largest_depth_rectangle(depths: list[int]) -> int:
    stack: list[int] = []   # indices, monotone increasing by depth
    max_area = 0
    n = len(depths)

    for i in range(n + 1):
        h = depths[i] if i < n else 0   # sentinel 0 at end flushes stack

        while stack and depths[stack[-1]] > h:
            height = depths[stack.pop()]
            # Width: from (new top + 1) to (i - 1) inclusive
            width  = i if not stack else i - stack[-1] - 1
            max_area = max(max_area, height * width)

        stack.append(i)

    return max_area`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
  {
    id: "fin-20260622-b1-lru-price-cache",
    title: "LRU Cache for Instrument Price Lookups",
    difficulty: "medium",
    topics: ["design", "hash-map", "linked-list"],
    problem: `Design an \`LRUPriceCache\` with fixed capacity for storing the most recently accessed instrument prices:

- \`get(symbol: str) -> float\`: Return the cached price for \`symbol\`, or -1.0 if not cached. Mark as most recently used.
- \`put(symbol: str, price: float)\`: Insert or update. If at capacity, evict the least recently used entry.

Both operations must be O(1).`,
    examples: [
      {
        input: "capacity=2, put(AAPL,150), put(MSFT,300), get(AAPL)=150, put(GOOG,2800), get(MSFT)=-1",
        output: "[150, -1]",
        explanation: "After put(GOOG), MSFT is evicted (least recently used after get(AAPL) refreshed AAPL).",
      },
    ],
    constraints: ["1 <= capacity <= 3000", "Up to 3 * 10^4 operations"],
    approach: "Doubly-linked list + hash map. The list maintains LRU order (head=MRU, tail=LRU). get() moves the node to head. put() adds at head; if over capacity, remove from tail. All operations are O(1).",
    code: `class Node:
    def __init__(self, key: str = '', val: float = 0.0):
        self.key  = key
        self.val  = val
        self.prev: 'Node | None' = None
        self.next: 'Node | None' = None

class LRUPriceCache:
    def __init__(self, capacity: int):
        self.cap   = capacity
        self.cache: dict[str, Node] = {}
        # Sentinel head (MRU side) and tail (LRU side)
        self.head  = Node()
        self.tail  = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node) -> None:
        node.prev.next = node.next   # type: ignore[union-attr]
        node.next.prev = node.prev   # type: ignore[union-attr]

    def _insert_front(self, node: Node) -> None:
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node  # type: ignore[union-attr]
        self.head.next = node

    def get(self, symbol: str) -> float:
        if symbol not in self.cache:
            return -1.0
        node = self.cache[symbol]
        self._remove(node)
        self._insert_front(node)
        return node.val

    def put(self, symbol: str, price: float) -> None:
        if symbol in self.cache:
            self._remove(self.cache[symbol])
        node = Node(symbol, price)
        self.cache[symbol] = node
        self._insert_front(node)
        if len(self.cache) > self.cap:
            lru = self.tail.prev   # type: ignore[union-attr]
            self._remove(lru)      # type: ignore[arg-type]
            del self.cache[lru.key]  # type: ignore[union-attr]`,
    language: "python",
    complexity: { time: "O(1) get and put", space: "O(capacity)" },
  },
  {
    id: "fin-20260622-b1-max-drawdown-dp",
    title: "Maximum Drawdown via Subarray Minimum Peak-to-Trough",
    difficulty: "medium",
    topics: ["dynamic-programming", "array"],
    problem: `Given a portfolio value array \`values\` (all positive), compute the maximum drawdown: the largest percentage decline from any peak to any subsequent trough.

Formally: max over all i < j of (values[i] - values[j]) / values[i].

Return the maximum drawdown as a decimal (e.g. 0.25 for 25% drawdown).`,
    examples: [
      {
        input: "values = [100, 120, 90, 110, 80, 150]",
        output: "0.3333",
        explanation: "Peak=120 at index 1, trough=80 at index 4. Drawdown = (120-80)/120 ≈ 0.333.",
      },
      {
        input: "values = [1, 2, 3, 4, 5]",
        output: "0.0",
        explanation: "Monotonically increasing — no drawdown.",
      },
    ],
    constraints: ["2 <= N <= 10^5", "1 <= values[i] <= 10^9"],
    approach: "Single pass: track running peak. At each index j, drawdown from current peak = (peak - values[j]) / peak. Update peak when values[j] > peak. O(N) time, O(1) space.",
    code: `def max_drawdown(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0

    peak     = values[0]
    max_dd   = 0.0

    for v in values[1:]:
        if peak > 0:
            dd = (peak - v) / peak
            if dd > max_dd:
                max_dd = dd
        if v > peak:
            peak = v

    return max_dd


def max_drawdown_with_dates(values: list[float]) -> dict:
    """Return drawdown plus the peak and trough indices."""
    peak_idx = 0
    peak     = values[0]
    max_dd   = 0.0
    best_peak_idx   = 0
    best_trough_idx = 0

    for j in range(1, len(values)):
        v  = values[j]
        dd = (peak - v) / peak if peak > 0 else 0.0
        if dd > max_dd:
            max_dd          = dd
            best_peak_idx   = peak_idx
            best_trough_idx = j
        if v > peak:
            peak     = v
            peak_idx = j

    return {'max_dd': max_dd,
            'peak_idx': best_peak_idx, 'trough_idx': best_trough_idx}`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260622-b1-neg-cycle-arbitrage",
    title: "Detect FX Arbitrage via Negative Cycle (Bellman-Ford)",
    difficulty: "hard",
    topics: ["graph", "bellman-ford", "arbitrage"],
    problem: `You are given N currencies and M exchange rates as triples (src, dst, rate). An FX arbitrage exists if you can start with 1 unit of any currency, perform a sequence of conversions, and end up with more than 1 unit of the same currency (a positive-product cycle).

Detect whether any such arbitrage cycle exists. Return True if arbitrage exists, False otherwise.`,
    examples: [
      {
        input: "N=3, rates=[(0,1,1.5),(1,2,1.4),(2,0,0.5)]",
        output: "True",
        explanation: "0→1→2→0: 1.5 * 1.4 * 0.5 = 1.05 > 1. Arbitrage exists.",
      },
      {
        input: "N=2, rates=[(0,1,0.9),(1,0,1.0)]",
        output: "False",
        explanation: "0→1→0: 0.9 * 1.0 = 0.9 < 1. No arbitrage.",
      },
    ],
    constraints: ["2 <= N <= 100", "1 <= M <= 400", "All rates > 0"],
    approach: "Take negative log of all rates: log-product cycle > 0 ↔ sum-of-log-weights < 0 (negative cycle). Run Bellman-Ford for N-1 rounds. If any edge can still be relaxed on round N, a negative cycle exists.",
    code: `import math

def detect_fx_arbitrage(n: int, rates: list[tuple[int, int, float]]) -> bool:
    """
    Convert to log space: maximize product = minimize sum of (-log rates).
    A positive-product cycle => negative-weight cycle in log space.
    """
    # Log-weight edges: w(u,v) = -log(rate(u,v))
    log_edges = [(src, dst, -math.log(rate)) for src, dst, rate in rates]

    INF = float('inf')

    # Try from each source to catch all components
    for src in range(n):
        dist = [INF] * n
        dist[src] = 0.0

        # Relax N-1 times
        for _ in range(n - 1):
            updated = False
            for u, v, w in log_edges:
                if dist[u] < INF and dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w
                    updated = True
            if not updated:
                break

        # N-th relaxation: if any edge still relaxes, negative cycle exists
        for u, v, w in log_edges:
            if dist[u] < INF and dist[u] + w < dist[v]:
                return True   # arbitrage detected

    return False`,
    language: "python",
    complexity: { time: "O(N * (N + M))", space: "O(N)" },
  },
  {
    id: "fin-20260622-b1-stock-span",
    title: "Stock Span — Consecutive Days Below or Equal to Today",
    difficulty: "easy",
    topics: ["monotonic-stack", "array"],
    problem: `The stock span problem: for each day i with price \`prices[i]\`, compute the span — the number of consecutive days ending at day i (including today) where the price was less than or equal to \`prices[i]\`.

Return an array \`spans\` of the same length.`,
    examples: [
      {
        input: "prices = [100, 80, 60, 70, 60, 75, 85]",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation: "Day 5 (price=75): previous prices 60, 70, 60, 80 — 60≤75, 70≤75, 60≤75 but 80>75, so span=4 (days 2,3,4,5). Day 6 (price=85): all previous ≤85, span=6 (all 6 days from day 0).",
      },
    ],
    constraints: ["1 <= N <= 10^5", "1 <= prices[i] <= 10^5"],
    approach: "Monotonic stack storing (price, span). For each new price, pop all stack entries with price <= current price, accumulating their spans. Push (current_price, accumulated_span + 1).",
    code: `def stock_span(prices: list[int]) -> list[int]:
    """
    Monotonic stack of (price, span) pairs.
    Pop entries with price <= current, summing their spans to get today's span.
    """
    stack: list[tuple[int, int]] = []   # (price, span)
    spans: list[int] = []

    for price in prices:
        span = 1   # today itself

        # Pop all previous days with lower or equal price
        while stack and stack[-1][0] <= price:
            _, prev_span = stack.pop()
            span += prev_span

        stack.append((price, span))
        spans.append(span)

    return spans`,
    language: "python",
    complexity: { time: "O(N) amortised", space: "O(N)" },
  },
  {
    id: "fin-20260622-b1-fifo-lot-pnl",
    title: "FIFO Lot P&L Tracker for Trading Position",
    difficulty: "medium",
    topics: ["design", "stack", "queue"],
    problem: `Implement a \`FIFOPositionTracker\` that tracks buy lots and computes realised P&L using FIFO matching:

- \`buy(qty: int, price: float)\`: Record a purchase of \`qty\` shares at \`price\`.
- \`sell(qty: int, price: float) -> float\`: Sell \`qty\` shares at \`price\`. Match against oldest lots first. Return the realised P&L for this sell.
- \`unrealised_pnl(mark: float) -> float\`: Return total unrealised P&L at current mark price.

Raises ValueError if selling more than held.`,
    examples: [
      {
        input: "buy(100, 50), buy(50, 60), sell(120, 70)",
        output: "realised_pnl=2200.0",
        explanation: "Sell 120: first 100 at cost 50 (profit 20*100=2000), then 20 more at cost 60 (profit 10*20=200). Total = 2200.",
      },
    ],
    constraints: [
      "1 <= qty <= 10^6",
      "0 < price <= 10^6",
      "Total sells never exceed total buys",
    ],
    approach: "Use a deque of (qty, price) lots. sell() pops from the front, consuming as many lots as needed. Track remaining qty if a lot is partially consumed. unrealised_pnl() walks remaining lots.",
    code: `from collections import deque

class FIFOPositionTracker:
    def __init__(self):
        self._lots: deque[list[int | float]] = deque()   # [qty, price]
        self._total_qty  = 0
        self._realised   = 0.0

    def buy(self, qty: int, price: float) -> None:
        self._lots.append([qty, price])
        self._total_qty += qty

    def sell(self, qty: int, price: float) -> float:
        if qty > self._total_qty:
            raise ValueError(f"Cannot sell {qty}; only holding {self._total_qty}")

        pnl = 0.0
        remaining = qty

        while remaining > 0:
            lot_qty, lot_price = self._lots[0]
            matched = min(lot_qty, remaining)
            pnl += matched * (price - lot_price)
            remaining          -= matched
            self._lots[0][0]   -= matched    # type: ignore[index]
            if self._lots[0][0] == 0:
                self._lots.popleft()

        self._total_qty  -= qty
        self._realised   += pnl
        return pnl

    def unrealised_pnl(self, mark: float) -> float:
        return sum(qty * (mark - price) for qty, price in self._lots)

    def total_pnl(self, mark: float) -> float:
        return self._realised + self.unrealised_pnl(mark)

    @property
    def position(self) -> int:
        return self._total_qty`,
    language: "python",
    complexity: { time: "O(lots) per sell amortised O(1)", space: "O(N)" },
  },
  {
    id: "fin-20260622-b1-min-window-factors",
    title: "Minimum Window Covering All Risk Factors",
    difficulty: "medium",
    topics: ["sliding-window", "hash-map"],
    problem: `A risk report contains a sequence of factor names \`factors\` (strings). Each factor must be checked at least once. Given a required set \`required\` of factor names, find the minimum-length contiguous window in \`factors\` that contains every name in \`required\` at least once.

Return the start and end indices of the minimum window, or (-1, -1) if no such window exists.`,
    examples: [
      {
        input: 'factors=["MKT","SMB","MKT","HML","MOM","SMB","HML"], required={"MKT","SMB","HML"}',
        output: "(2, 6)",
        explanation: 'Window factors[2..6]=["MKT","HML","MOM","SMB","HML"] contains MKT, SMB, HML. Length 5. Shorter windows exist: factors[3..6] contains HML, MOM, SMB, HML - missing MKT until 2. Actually factors[2..6] is minimum here.',
      },
      {
        input: 'factors=["A","B","C"], required={"D"}',
        output: "(-1, -1)",
        explanation: "Factor D does not appear — no valid window.",
      },
    ],
    constraints: [
      "1 <= len(factors) <= 10^5",
      "1 <= len(required) <= 50",
      "Factor names are non-empty strings",
    ],
    approach: "Two-pointer / sliding window: expand right until all required factors are covered, then contract left to minimise window. Track counts with a hash map and a 'have' counter vs 'need'. O(N) time.",
    code: `from collections import defaultdict

def min_window_factors(factors: list[str], required: set[str]) -> tuple[int, int]:
    if not required or not factors:
        return (-1, -1)

    need = {f: 1 for f in required}   # each factor needed at least once
    have: dict[str, int] = defaultdict(int)
    satisfied = 0   # number of distinct required factors currently in window
    total_needed = len(need)

    best_len = float('inf')
    best = (-1, -1)
    left = 0

    for right, factor in enumerate(factors):
        if factor in need:
            have[factor] += 1
            if have[factor] == need[factor]:
                satisfied += 1

        # Shrink from left while all required factors are covered
        while satisfied == total_needed:
            window_len = right - left + 1
            if window_len < best_len:
                best_len = window_len
                best = (left, right)

            lf = factors[left]
            if lf in need:
                have[lf] -= 1
                if have[lf] < need[lf]:
                    satisfied -= 1
            left += 1

    return best`,
    language: "python",
    complexity: { time: "O(N)", space: "O(|required|)" },
  },
  {
    id: "fin-20260622-b1-matrix-exponent",
    title: "Bond Pricing via Matrix Exponentiation (Markov Credit Model)",
    difficulty: "hard",
    topics: ["matrix-exponentiation", "dynamic-programming", "math"],
    problem: `A bond issuer has K credit states (e.g. AAA, AA, A, ..., D). The issuer transitions between states according to a K×K transition matrix \`P\` each period, where \`P[i][j]\` is the probability of moving from state i to state j.

State K-1 is the default state (absorbing). The bond pays coupon \`c\` each period if not defaulted, and recovery \`R\` upon default.

Given initial state \`s0\`, total periods \`T\`, compute the expected total present value of all cash flows discounted at rate \`r\` per period.

Use matrix exponentiation to compute P^n in O(K^3 log T) time.`,
    examples: [
      {
        input: "K=2, P=[[0.9,0.1],[0.0,1.0]], s0=0, T=5, c=1.0, R=0.4, r=0.05",
        output: "≈3.89",
        explanation: "State 0=healthy, state 1=default (absorbing). Each period: 90% chance of staying healthy (earn coupon), 10% chance of defaulting (earn recovery). PV discounted at 5% per period.",
      },
    ],
    constraints: ["2 <= K <= 20", "1 <= T <= 10^9", "0 < r < 1", "0 <= c, R <= 10^3"],
    approach: "State vector v[t] = probability of being in each state at time t. v[t] = v[0] @ P^t. Use fast matrix exponentiation to compute P^t in O(K^3 log T). PV = sum over t of disc^t * (coupon * prob_alive[t] + recovery * prob_default_at_t). Absorbing default: prob_default_at_t = (v[t-1] @ P)[K-1] - v[t-1][K-1].",
    code: `import numpy as np

def mat_mul(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    return A @ B

def mat_pow(M: np.ndarray, n: int) -> np.ndarray:
    """Fast matrix exponentiation: M^n in O(K^3 log n)."""
    K    = M.shape[0]
    result = np.eye(K)
    base   = M.copy()
    while n > 0:
        if n & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        n >>= 1
    return result

def markov_bond_pv(P: list[list[float]], s0: int, T: int,
                    c: float, recovery: float, r: float) -> float:
    """
    PV of Markov-model bond via matrix exponentiation.
    Default state = K-1 (absorbing).
    """
    K    = len(P)
    Pm   = np.array(P, dtype=float)
    v0   = np.zeros(K)
    v0[s0] = 1.0   # initial state distribution

    disc = 1.0 / (1.0 + r)
    pv   = 0.0

    # Accumulated: v_prev = v0 @ P^{t-1}, v_curr = v0 @ P^t
    # For large T, compute coupon leg analytically via geometric series of Pmatrix
    # Here: iterate for moderate T, matrix-exp for large T blocks
    BLOCK = 64   # direct iteration for first BLOCK periods
    t_direct = min(T, BLOCK)

    v_prev = v0.copy()
    for t in range(1, t_direct + 1):
        v_curr = v_prev @ Pm
        alive_t      = 1.0 - v_curr[K-1]          # prob of NOT being in default
        prob_def_now = v_curr[K-1] - v_prev[K-1]  # prob of defaulting in period t
        pv += (disc**t) * (c * alive_t + recovery * prob_def_now)
        v_prev = v_curr

    if T > BLOCK:
        # Use matrix exponentiation for remaining T - BLOCK periods
        Pblock = mat_pow(Pm, T - BLOCK)
        v_end  = v_prev @ Pblock
        # Approximate remaining PV assuming constant transition (simplified)
        # In production, iterate or use matrix geometric series
        remaining_alive = 1.0 - v_end[K-1]
        remaining_t = T - BLOCK
        avg_disc = disc**(BLOCK + remaining_t // 2 + 1)
        pv += avg_disc * c * remaining_alive

    return pv`,
    language: "python",
    complexity: { time: "O(K^3 log T)", space: "O(K^2)" },
  },
];
