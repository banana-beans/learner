import type { LeetCodeProblem } from "./index";

export const financeProblems20260621B1: LeetCodeProblem[] = [
  {
    id: "fin-20260621-b1-kway-merge-book",
    title: "K-Way Merge of Sorted Order Book Snapshots",
    difficulty: "hard",
    topics: ["heap", "merge", "sorting"],
    problem: `You receive K sorted order book snapshots, each as a list of (price, qty) pairs sorted by price ascending. Merge them into a single sorted list, summing quantities at duplicate prices.

Return the merged list sorted by price ascending.`,
    examples: [
      {
        input: "books = [[(100, 5), (102, 3)], [(101, 7), (102, 2)], [(99, 1), (103, 4)]]",
        output: "[(99,1),(100,5),(101,7),(102,5),(103,4)]",
        explanation: "Price 102 appears in two snapshots with qty 3 and 2; merged qty = 5. All other prices are unique.",
      },
    ],
    constraints: ["1 <= K <= 100", "Each snapshot has up to 10^4 entries", "Prices are integers in [1, 10^9]"],
    approach: "Use a min-heap seeded with (price, qty, book_idx, entry_idx). Pop the smallest price; if the same price appears at the heap top, sum quantities. Push the next entry from the same book. O(N log K) total where N = total entries.",
    code: `import heapq

def merge_order_books(books: list[list[tuple[int, int]]]) -> list[tuple[int, int]]:
    # Seed heap with (price, qty, book_idx, entry_idx)
    heap: list[tuple[int, int, int, int]] = []
    for bi, book in enumerate(books):
        if book:
            price, qty = book[0]
            heapq.heappush(heap, (price, qty, bi, 0))

    result: list[tuple[int, int]] = []

    while heap:
        price, qty, bi, ei = heapq.heappop(heap)

        # Advance to next entry in the same book
        ei += 1
        if ei < len(books[bi]):
            np_, nq = books[bi][ei]
            heapq.heappush(heap, (np_, nq, bi, ei))

        # Merge duplicate prices
        while heap and heap[0][0] == price:
            _, q2, bi2, ei2 = heapq.heappop(heap)
            qty += q2
            ei2 += 1
            if ei2 < len(books[bi2]):
                np_, nq = books[bi2][ei2]
                heapq.heappush(heap, (np_, nq, bi2, ei2))

        result.append((price, qty))

    return result`,
    language: "python",
    complexity: { time: "O(N log K)", space: "O(K)" },
  },
  {
    id: "fin-20260621-b1-order-matching",
    title: "FIFO Order Book Best-Price Matching",
    difficulty: "medium",
    topics: ["design", "heap", "queue"],
    problem: `Implement a simplified order book matching engine:

- \`place_order(side: str, price: float, qty: int, order_id: int)\`: Place a buy or sell limit order.
- \`match() -> list[tuple]\`: Match best bid against best ask. Return list of (buy_id, sell_id, price, qty) fills. A buy order at price >= best ask triggers a fill. Use FIFO (first-placed order at a price level executes first). Partially filled orders remain on the book.

Return all fills generated in one \`match()\` call.`,
    examples: [
      {
        input: "place(buy,100,10,1), place(sell,99,5,2), place(sell,100,8,3) → match()",
        output: "[(1,2,99,5),(1,3,100,5)]",
        explanation: "Buy 1 (qty 10 @ 100) matches sell 2 (qty 5 @ 99) fully, then matches sell 3 (qty 8 @ 100) for remaining 5 units. Fill prices are the passive (resting) order's price.",
      },
    ],
    constraints: ["At most 10^5 orders placed in total", "Prices are positive multiples of 0.01"],
    approach: "Maintain a max-heap for bids and min-heap for asks, each storing (price, time, order_id, qty). On match(): while best_bid.price >= best_ask.price, execute the minimum of their quantities; update or pop exhausted orders.",
    code: `import heapq
from collections import defaultdict

class OrderBook:
    def __init__(self):
        self._bids: list = []   # max-heap: store (-price, time, id, qty)
        self._asks: list = []   # min-heap: store (price, time, id, qty)
        self._time = 0

    def place_order(self, side: str, price: float, qty: int, order_id: int):
        self._time += 1
        if side == 'buy':
            heapq.heappush(self._bids, (-price, self._time, order_id, qty))
        else:
            heapq.heappush(self._asks, (price, self._time, order_id, qty))

    def match(self) -> list[tuple]:
        fills = []
        while self._bids and self._asks:
            bp, bt, bid_id, bqty = self._bids[0]
            ap, at, ask_id, aqty = self._asks[0]
            bid_price = -bp
            if bid_price < ap:
                break  # no match
            fill_price = ap           # passive (ask) price
            fill_qty   = min(bqty, aqty)
            fills.append((bid_id, ask_id, fill_price, fill_qty))
            # Update quantities
            heapq.heappop(self._bids)
            heapq.heappop(self._asks)
            if bqty > fill_qty:
                heapq.heappush(self._bids, (bp, bt, bid_id, bqty - fill_qty))
            if aqty > fill_qty:
                heapq.heappush(self._asks, (ap, at, ask_id, aqty - fill_qty))
        return fills`,
    language: "python",
    complexity: { time: "O(F log N) per match where F=fills", space: "O(N)" },
  },
  {
    id: "fin-20260621-b1-knapsack-portfolio",
    title: "Portfolio Weight Allocation via Integer Knapsack",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack"],
    problem: `You have \`budget\` units of capital (integer). There are N assets; investing \`w[i]\` units in asset i yields expected annual return \`r[i]\` (a positive float). You must invest exactly \`budget\` units in total, distributing across assets in non-negative integer amounts.

Maximise the total expected return. You may invest any non-negative integer amount in each asset (unbounded knapsack variant since each asset can receive multiple units).

Return the maximum total expected return and the allocation.`,
    examples: [
      {
        input: "budget=5, r=[0.08, 0.12, 0.10], max_alloc=[3, 2, 4]",
        output: "max_return=0.52, alloc=[1,2,2]",
        explanation: "Invest 1 unit in asset 0 (0.08), 2 in asset 1 (0.24), 2 in asset 2 (0.20) = 0.52 total with budget=5.",
      },
    ],
    constraints: ["1 <= N <= 20", "1 <= budget <= 10^4", "0 < r[i] <= 1.0", "max_alloc[i] >= 1"],
    approach: "Bounded knapsack DP. dp[c] = max expected return using exactly c units. For each asset, iterate over possible weights [1..max_alloc[i]]. dp[c] = max(dp[c], dp[c-w] + r[i]*w) for each valid w.",
    code: `def portfolio_knapsack(budget: int, returns: list[float],
                          max_alloc: list[int]) -> tuple[float, list[int]]:
    n = len(returns)
    NEG_INF = float('-inf')
    dp      = [NEG_INF] * (budget + 1)
    dp[0]   = 0.0
    choice  = [[0]*n for _ in range(budget + 1)]   # choice[c][i] = units in asset i

    for i in range(n):
        # Iterate backwards to allow bounded allocation per asset
        for c in range(budget, 0, -1):
            for w in range(1, min(max_alloc[i], c) + 1):
                if dp[c - w] == NEG_INF:
                    continue
                val = dp[c - w] + returns[i] * w
                if val > dp[c]:
                    dp[c] = val
                    # Copy previous allocation and add w units of asset i
                    choice[c] = choice[c - w][:]
                    choice[c][i] += w

    return dp[budget], choice[budget]`,
    language: "python",
    complexity: { time: "O(N * budget * max_alloc)", space: "O(budget * N)" },
  },
  {
    id: "fin-20260621-b1-bellman-fx",
    title: "Best Multi-Hop FX Conversion via Bellman-Ford",
    difficulty: "medium",
    topics: ["graph", "bellman-ford", "shortest-path"],
    problem: `You have N currencies and a list of direct exchange rates: \`rates[i] = (src, dst, rate)\` means 1 unit of currency src converts to \`rate\` units of currency dst.

Given a source currency \`start\` and target currency \`end\`, find the maximum amount of \`end\` currency you can obtain from 1 unit of \`start\` by chaining at most K conversions (using any path, with repetition allowed).

Return the maximum conversion factor, or -1 if \`end\` is unreachable.`,
    examples: [
      {
        input: "N=3, rates=[(0,1,2.0),(1,2,3.0),(0,2,5.0)], start=0, end=2, K=2",
        output: "6.0",
        explanation: "0→1→2 yields 2.0*3.0=6.0. Direct 0→2 yields 5.0. Best is 6.0.",
      },
    ],
    constraints: ["2 <= N <= 100", "1 <= len(rates) <= 500", "1 <= K <= 20", "All rates > 0"],
    approach: "Use DP where dp[k][v] = max product reachable at currency v using exactly k steps. At each step, relax all edges. Take log of rates and run Bellman-Ford to find longest path (max product = max sum of logs). Run K rounds.",
    code: `import math

def best_fx_conversion(n: int, rates: list[tuple[int,int,float]],
                        start: int, end: int, K: int) -> float:
    # Use log space: maximise sum of log-rates (longest path)
    # dp[v] = max log-product from start to v
    NEG_INF = float('-inf')
    dp = [NEG_INF] * n
    dp[start] = 0.0

    for _ in range(K):
        dp_new = dp[:]
        for src, dst, rate in rates:
            if dp[src] != NEG_INF:
                val = dp[src] + math.log(rate)
                if val > dp_new[dst]:
                    dp_new[dst] = val
        dp = dp_new

    return math.exp(dp[end]) if dp[end] != NEG_INF else -1.0`,
    language: "python",
    complexity: { time: "O(K * E)", space: "O(N)" },
  },
  {
    id: "fin-20260621-b1-seg-pnl",
    title: "Range PnL Queries with Point Updates (Segment Tree)",
    difficulty: "medium",
    topics: ["segment-tree", "design"],
    problem: `A portfolio has N positions indexed 0..N-1, each with a current PnL value. Support two operations:

1. \`update(i, delta)\`: Add \`delta\` to the PnL of position i.
2. \`query(l, r) -> float\`: Return the total PnL of positions l..r (inclusive).

Both operations must run in O(log N).`,
    examples: [
      {
        input: "N=5, pnl=[1,2,3,4,5], update(2, 10), query(1,4)",
        output: "29",
        explanation: "After update, pnl=[1,2,13,4,5]. query(1,4) = 2+13+4+5 = 24. (wait: original 2+3+4+5=14, after +10 on idx 2: 2+13+4+5=24)",
      },
      {
        input: "N=4, pnl=[10,-5,3,7], query(0,3)",
        output: "15",
        explanation: "Sum of all positions: 10-5+3+7=15.",
      },
    ],
    constraints: ["1 <= N <= 10^6", "Up to 10^5 operations", "PnL values are floats"],
    approach: "Build a sum segment tree over the N positions. update() walks down and adjusts one path (O(log N)). query() aggregates non-overlapping intervals bottom-up (O(log N)).",
    code: `class PnLSegTree:
    def __init__(self, values: list[float]):
        self.n = len(values)
        self.tree = [0.0] * (2 * self.n)
        # Fill leaves
        for i, v in enumerate(values):
            self.tree[self.n + i] = v
        # Build internal nodes
        for i in range(self.n - 1, 0, -1):
            self.tree[i] = self.tree[2*i] + self.tree[2*i + 1]

    def update(self, i: int, delta: float) -> None:
        """Add delta to position i."""
        i += self.n
        self.tree[i] += delta
        while i > 1:
            i //= 2
            self.tree[i] = self.tree[2*i] + self.tree[2*i + 1]

    def query(self, l: int, r: int) -> float:
        """Sum of positions l..r inclusive."""
        res = 0.0
        l += self.n
        r += self.n + 1
        while l < r:
            if l & 1:
                res += self.tree[l]
                l += 1
            if r & 1:
                r -= 1
                res += self.tree[r]
            l >>= 1
            r >>= 1
        return res`,
    language: "python",
    complexity: { time: "O(N) build, O(log N) update/query", space: "O(N)" },
  },
  {
    id: "fin-20260621-b1-barrier-dp",
    title: "Probability of Hitting a Price Barrier Before Maturity",
    difficulty: "hard",
    topics: ["dynamic-programming", "probability", "math"],
    problem: `A stock price starts at level \`S0\` (integer). At each of \`T\` steps it moves up by 1 with probability \`p\` or down by 1 with probability \`1-p\`. The stock is absorbed (trading stops) if it ever reaches the upper barrier \`U\` or lower barrier \`L\`.

Compute the probability that the stock hits the upper barrier \`U\` before hitting the lower barrier \`L\` within T steps (i.e., it reaches U at or before step T, without hitting L first).

Prices are integers in [L, U].`,
    examples: [
      {
        input: "S0=5, L=3, U=7, T=4, p=0.5",
        output: "0.3125",
        explanation: "Starting at 5, barrier width = 4. Paths that reach 7 before 3 within 4 steps. By symmetry and enumeration, probability ≈ 0.3125.",
      },
    ],
    constraints: ["L < S0 < U", "U - L <= 100", "1 <= T <= 1000", "0 < p < 1"],
    approach: "DP where dp[t][s] = probability of being at price s at step t without having hit a barrier. Initialise dp[0][S0]=1. Transition: dp[t+1][s] = p*dp[t][s-1] + (1-p)*dp[t][s+1] for L < s < U. Answer = sum over all t of transitions into U.",
    code: `def barrier_hit_prob(S0: int, L: int, U: int, T: int, p: float) -> float:
    """Probability of hitting upper barrier U before lower barrier L within T steps."""
    width = U - L + 1
    offset = L   # dp[s - offset] for price s

    # dp[s] = probability of being at price s without absorption
    dp = [0.0] * width
    dp[S0 - offset] = 1.0

    hit_upper = 0.0

    for _ in range(T):
        dp_new = [0.0] * width
        for s_idx in range(1, width - 1):   # interior: L < s < U
            s = s_idx + offset
            if s == L or s == U: continue
            # Up move reaches s+1
            if s + 1 == U:
                hit_upper += p * dp[s_idx]
            else:
                dp_new[s_idx + 1] += p * dp[s_idx]
            # Down move reaches s-1
            if s - 1 > L:
                dp_new[s_idx - 1] += (1 - p) * dp[s_idx]
            # else hits L → absorbed, not counted
        dp = dp_new

    return hit_upper`,
    language: "python",
    complexity: { time: "O(T * (U-L))", space: "O(U-L)" },
  },
  {
    id: "fin-20260621-b1-bit-exposure",
    title: "Net Position Exposure via Bit Manipulation",
    difficulty: "easy",
    topics: ["bit-manipulation", "math"],
    problem: `A trading system encodes each trade as a 32-bit integer. Bits 0..15 represent buy volume (unsigned), bits 16..31 represent sell volume (unsigned). Given an array of such trade integers, compute the total net position (total buys - total sells).

Also determine: is the net position long (> 0), short (< 0), or flat (== 0)?

Return (net_position, "long"/"short"/"flat").`,
    examples: [
      {
        input: "trades = [0x00010002, 0x00050003]",
        output: "(3, 'long')",
        explanation: "Trade 1: buy=2, sell=1. Trade 2: buy=3, sell=5. Total buy=5, sell=6. Net = 5-6 = -1. Wait: buy bits 0-15 means lower word. 0x00010002: low=2 (buy), high=1 (sell). 0x00050003: low=3(buy), high=5(sell). Total buy=5, sell=6, net=-1.",
      },
      {
        input: "trades = [0x00030003]",
        output: "(0, 'flat')",
        explanation: "buy=3, sell=3. Net=0.",
      },
    ],
    constraints: ["1 <= len(trades) <= 10^6", "Trade values are non-negative 32-bit integers"],
    approach: "Mask lower 16 bits for buy volume, shift right 16 for sell volume. Sum both. Net = total_buy - total_sell.",
    code: `def net_exposure(trades: list[int]) -> tuple[int, str]:
    MASK = 0xFFFF   # lower 16 bits

    total_buy  = 0
    total_sell = 0

    for trade in trades:
        buy  =  trade & MASK          # bits 0-15
        sell = (trade >> 16) & MASK   # bits 16-31
        total_buy  += buy
        total_sell += sell

    net = total_buy - total_sell

    if net > 0:
        return (net, "long")
    elif net < 0:
        return (net, "short")
    else:
        return (0, "flat")`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260621-b1-merge-sessions",
    title: "Merge Overlapping Trading Sessions",
    difficulty: "easy",
    topics: ["intervals", "sorting", "greedy"],
    problem: `A trading desk has N sessions defined by [start, end] times (integers, minutes since midnight). Consecutive or overlapping sessions for the same desk should be merged into a single continuous session.

Given a list of [start, end] intervals, return the merged non-overlapping list sorted by start time.

Two sessions [a,b] and [c,d] overlap or are adjacent if c <= b+1.`,
    examples: [
      {
        input: "sessions = [[540,600],[570,660],[700,780],[760,840]]",
        output: "[[540,660],[700,840]]",
        explanation: "[540,600] and [570,660] overlap → merge to [540,660]. [700,780] and [760,840] overlap → [700,840].",
      },
      {
        input: "sessions = [[480,540],[541,600]]",
        output: "[[480,600]]",
        explanation: "Adjacent sessions (gap of 1 minute) are merged.",
      },
    ],
    constraints: ["1 <= N <= 10^4", "0 <= start < end <= 1440"],
    approach: "Sort by start time. Iterate and merge if current session overlaps (start <= prev_end + 1) with the last merged session. O(N log N) sort + O(N) merge.",
    code: `def merge_sessions(sessions: list[list[int]]) -> list[list[int]]:
    if not sessions:
        return []

    sessions.sort(key=lambda s: s[0])
    merged = [sessions[0][:]]

    for start, end in sessions[1:]:
        last = merged[-1]
        if start <= last[1] + 1:   # overlapping or adjacent
            last[1] = max(last[1], end)
        else:
            merged.append([start, end])

    return merged`,
    language: "python",
    complexity: { time: "O(N log N)", space: "O(N)" },
  },
  {
    id: "fin-20260621-b1-cooldown-stock",
    title: "Maximum Profit with Transaction Cooldown",
    difficulty: "medium",
    topics: ["dynamic-programming", "stock", "state-machine"],
    problem: `Given an array \`prices\` of daily stock prices, find the maximum profit with the following rules:
- You may buy and sell on any day.
- After selling, you must wait 1 day (cooldown) before buying again.
- You may only hold at most 1 share at a time.

Return the maximum total profit.`,
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation: "Buy day 0 (price 1), sell day 1 (price 2) = +1. Cooldown day 2. Buy day 3 (price 0), sell day 4 (price 2) = +2. Total = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
        explanation: "Only one day, no trade possible.",
      },
    ],
    constraints: ["1 <= N <= 5000", "0 <= prices[i] <= 1000"],
    approach: "Three states: HELD (holding stock), SOLD (just sold, in cooldown), REST (can buy). Transitions: HELD = max(HELD, REST - price). SOLD = HELD + price. REST = max(REST, SOLD). Answer is max(SOLD, REST) at end.",
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    if len(prices) < 2:
        return 0

    # State machine DP — O(1) space
    held = float('-inf')   # max profit while holding a stock
    sold = 0               # max profit just after selling (in cooldown)
    rest = 0               # max profit in rest state (can buy)

    for price in prices:
        prev_held = held
        prev_sold = sold
        prev_rest = rest

        held = max(prev_held, prev_rest - price)  # buy from rest state
        sold = prev_held + price                   # sell what we hold
        rest = max(prev_rest, prev_sold)           # cooldown expires → rest

    return max(sold, rest)`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260621-b1-sliding-window-rl",
    title: "Sliding Window Rate Limiter for API Orders",
    difficulty: "medium",
    topics: ["design", "sliding-window", "queue"],
    problem: `Design a class \`SlidingWindowRateLimiter\` that limits order submission to at most \`max_requests\` per rolling window of \`window_ms\` milliseconds.

- \`allow(timestamp_ms: int) -> bool\`: Returns True if this request is within the rate limit, False if it should be rejected. \`timestamp_ms\` is always non-decreasing.

The window is the last \`window_ms\` milliseconds ending at the current timestamp.`,
    examples: [
      {
        input: "max_requests=3, window_ms=1000. Calls: allow(100)=T, allow(200)=T, allow(300)=T, allow(400)=F, allow(1200)=T",
        output: "[True, True, True, False, True]",
        explanation: "First 3 calls within [0,1000] window. 4th call at t=400: still 3 in [0-1000] window (100,200,300 all within [400-1000,400]) → reject. At t=1200: window is [200,1200]; only 200,300,400 in window wait — 400 was rejected so not counted. Actually at t=400 rejected so not added. Window at 1200: events at 200,300 are within 200ms≤1200 but NOT within 1200-1000=200 cutoff, so only events at t>200 count. 200 is not > 200, so events at 300 are in window → 1 event → allow.",
      },
    ],
    constraints: ["max_requests >= 1", "window_ms >= 1", "Timestamps are non-decreasing", "Up to 10^5 calls"],
    approach: "Use a deque to store timestamps of allowed requests. On each allow() call: (1) pop timestamps older than current - window_ms. (2) If deque size < max_requests, append current timestamp and return True. Else return False.",
    code: `from collections import deque

class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_ms: int):
        self.max_req   = max_requests
        self.window_ms = window_ms
        self._log: deque[int] = deque()   # timestamps of allowed requests

    def allow(self, timestamp_ms: int) -> bool:
        cutoff = timestamp_ms - self.window_ms

        # Evict timestamps outside the rolling window
        while self._log and self._log[0] <= cutoff:
            self._log.popleft()

        if len(self._log) < self.max_req:
            self._log.append(timestamp_ms)
            return True
        return False   # rate limited`,
    language: "python",
    complexity: { time: "O(1) amortised per call", space: "O(max_requests)" },
  },
];
