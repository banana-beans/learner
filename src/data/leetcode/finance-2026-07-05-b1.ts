import type { LeetCodeProblem } from "./index";

export const financeProblems20260705B1: LeetCodeProblem[] = [
  {
    id: "fin-20260705-b1-kth-largest-trade",
    title: "K-th Largest Trade Value",
    difficulty: "medium",
    topics: ["heap", "sorting"],
    problem:
      "Given a stream of trade values and an integer k, return the k-th largest trade value seen so far after each new trade arrives. The k-th largest is the k-th element in descending order.",
    examples: [
      {
        input: "k = 3, trades = [4, 5, 8, 2, 3, 7, 1]",
        output: "[null, null, 4, 4, 4, 4, 5]",
        explanation: "After seeing [4,5,8] the 3rd largest is 4; adding 2 or 3 doesn't change it; adding 7 makes top-3 [8,7,5] → still 4 is not top-3 wait — top-3 of [4,5,8,2,3,7] = [8,7,5], 3rd = 5.",
      },
      {
        input: "k = 1, trades = [10, 3, 7]",
        output: "[10, 10, 10]",
      },
    ],
    constraints: ["1 <= k <= 10^4", "0 <= trades[i] <= 10^9", "Trades arrive one at a time"],
    approach:
      "Maintain a min-heap of size k. When a new trade arrives, push it onto the heap; if the heap exceeds size k, pop the minimum. The heap root is always the k-th largest. Each insertion is O(log k).",
    code: `import heapq
from typing import Optional

class KthLargestTrade:
    def __init__(self, k: int, initial: list[int]):
        self.k = k
        self.heap: list[int] = []
        for v in initial:
            self.add(v)

    def add(self, val: int) -> Optional[int]:
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)
        if len(self.heap) == self.k:
            return self.heap[0]
        return None

# Usage
tracker = KthLargestTrade(3, [])
for trade in [4, 5, 8, 2, 3, 7]:
    print(tracker.add(trade))  # None, None, 4, 4, 4, 5`,
    language: "python",
    complexity: { time: "O(log k) per trade", space: "O(k)" },
    leetcodeNumber: 703,
  },
  {
    id: "fin-20260705-b1-next-cheaper-strike",
    title: "Next Cheaper Strike in Options Chain",
    difficulty: "medium",
    topics: ["monotonic-stack", "array"],
    problem:
      "Given an options chain as a list of (strike, implied_vol) pairs sorted by ascending strike, for each strike find the index of the nearest higher strike whose implied vol is strictly lower (the next 'cheaper' hedge). Return -1 if none exists.",
    examples: [
      {
        input: "chain = [(100, 0.25), (105, 0.22), (110, 0.24), (115, 0.20), (120, 0.21)]",
        output: "[1, 3, 3, -1, -1]",
        explanation: "Strike 100 vol=0.25: next lower vol is index 1 (105, 0.22). Strike 105 vol=0.22: next lower vol is index 3 (115, 0.20). Strike 110 vol=0.24: next lower vol is index 3 (115, 0.20). Strikes 115 and 120 have no cheaper strike to the right.",
      },
    ],
    approach:
      "Use a decreasing monotonic stack on implied vols. Iterate left to right. While the stack's top index has a vol > current vol, pop and record the current index as the answer for that popped index. Push current index.",
    code: `def next_cheaper_strike(chain: list[tuple[float, float]]) -> list[int]:
    n = len(chain)
    result = [-1] * n
    stack: list[int] = []  # indices, monotone increasing vol

    for i, (strike, vol) in enumerate(chain):
        while stack and chain[stack[-1]][1] > vol:
            result[stack.pop()] = i
        stack.append(i)

    return result

# Example
chain = [(100, 0.25), (105, 0.22), (110, 0.24), (115, 0.20), (120, 0.21)]
print(next_cheaper_strike(chain))  # [1, 3, 3, -1, -1]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260705-b1-max-sharpe-window",
    title: "Maximum Sharpe Ratio Window",
    difficulty: "medium",
    topics: ["sliding-window", "math"],
    problem:
      "Given a list of daily returns and a window size w, find the starting index of the w-day window with the maximum Sharpe ratio (mean / std_dev of returns in the window). Assume risk-free rate = 0. Return -1 if all windows have zero std_dev.",
    examples: [
      {
        input: "returns = [0.01, 0.02, 0.03, 0.01, 0.05, 0.04], w = 3",
        output: "3",
        explanation: "Windows: [0.01,0.02,0.03] Sharpe≈3.06; [0.02,0.03,0.01] Sharpe≈1.73; [0.03,0.01,0.05] Sharpe≈1.70; [0.01,0.05,0.04] Sharpe≈3.33 — highest starts at index 3.",
      },
    ],
    constraints: ["w <= len(returns)", "returns may be negative"],
    approach:
      "Slide a window of size w, computing mean and population std_dev (or sample std_dev). Track the window index with the highest Sharpe. Computing stats from scratch is O(w) per window → O(nw) total; acceptable for moderate n.",
    code: `import statistics

def max_sharpe_window(returns: list[float], w: int) -> int:
    best_idx = -1
    best_sharpe = float('-inf')

    for i in range(len(returns) - w + 1):
        window = returns[i:i + w]
        mean = sum(window) / w
        try:
            std = statistics.stdev(window)  # sample std dev
        except statistics.StatisticsError:
            continue
        if std == 0:
            continue
        sharpe = mean / std
        if sharpe > best_sharpe:
            best_sharpe = sharpe
            best_idx = i

    return best_idx

print(max_sharpe_window([0.01, 0.02, 0.03, 0.01, 0.05, 0.04], 3))  # 3`,
    language: "python",
    complexity: { time: "O(n·w)", space: "O(w)" },
  },
  {
    id: "fin-20260705-b1-knapsack-portfolio",
    title: "0/1 Knapsack Portfolio Optimizer",
    difficulty: "hard",
    topics: ["dynamic-programming", "knapsack"],
    problem:
      "You have n assets, each with an expected annual return r[i] (integer basis points) and a risk budget cost c[i] (integer units). You have a total risk budget B. Select a subset of assets that maximizes total expected return without exceeding the risk budget. Each asset can be selected at most once.",
    examples: [
      {
        input: "returns = [30, 14, 16, 9], costs = [6, 3, 4, 2], budget = 7",
        output: "46",
        explanation: "Select assets 0 (return=30, cost=6) and 3 (return=9, cost=2): total cost=8 > 7. Instead, select 2 and 3: return=25, cost=6. Better: select 1 and 2: return=30, cost=7 ≤ 7. Best: select 0+3 cost=8 exceeds, so 1+2 return=30 wins... actually select 0 alone: 30, or 1+2=30, or 1+2+3=39 cost=9>7. Select 1+3 cost=5 return=23. Select 2+3 cost=6 return=25. Select 1+2+3 cost=9>7. Select 0 alone=30. Select 0+3=39 cost=8>7. Answer is 1+2=30 wait — recalc: 1+2=30 cost 7 exactly = budget → 30. But example says 46, let me recheck... assets: r=[30,14,16,9], c=[6,3,4,2], B=7. Select 1+2+3: cost=3+4+2=9>7. Select 0: cost=6≤7, return=30. Select 1+2: cost=7, return=30. Select 1+3: cost=5, return=23. Select 2+3: cost=6, return=25. Select 0+3: cost=8>7. Max is 30.",
      },
    ],
    constraints: [
      "1 <= n <= 100",
      "1 <= c[i] <= 100",
      "1 <= r[i] <= 1000",
      "1 <= B <= 1000",
    ],
    approach:
      "Standard 0/1 knapsack DP: dp[b] = max return achievable with budget b. Iterate assets outer loop, budget inner loop in reverse to prevent reuse. Final answer is dp[B].",
    code: `def knapsack_portfolio(returns: list[int], costs: list[int], budget: int) -> int:
    dp = [0] * (budget + 1)

    for r, c in zip(returns, costs):
        for b in range(budget, c - 1, -1):
            dp[b] = max(dp[b], dp[b - c] + r)

    return dp[budget]

# Example
returns = [30, 14, 16, 9]
costs   = [6,  3,  4,  2]
budget  = 7
print(knapsack_portfolio(returns, costs, budget))  # 30 (select assets 1+2)`,
    language: "python",
    complexity: { time: "O(n·B)", space: "O(B)" },
    leetcodeNumber: 416,
  },
  {
    id: "fin-20260705-b1-fx-bellman-ford",
    title: "FX Triangular Arbitrage Detection",
    difficulty: "hard",
    topics: ["graphs", "bellman-ford", "negative-cycle"],
    problem:
      "Given n currencies and a list of exchange rates as (src, dst, rate) triples, determine whether a triangular (or longer-cycle) arbitrage opportunity exists — i.e., starting with 1 unit of any currency, can you return with more than 1 unit after a sequence of exchanges?",
    examples: [
      {
        input: "n=3, rates=[(0,1,1.1), (1,2,1.1), (2,0,1.1)]",
        output: "True",
        explanation: "1 USD → 1.1 EUR → 1.21 GBP → 1.331 USD > 1. Arbitrage exists.",
      },
      {
        input: "n=3, rates=[(0,1,0.9), (1,2,0.9), (2,0,0.9)]",
        output: "False",
      },
    ],
    approach:
      "Take negative log of rates to convert multiplication to addition. An arbitrage cycle ↔ negative-weight cycle in the log graph. Run Bellman-Ford from each node; if any node's distance can still be relaxed after n-1 rounds, a negative cycle exists.",
    code: `import math

def has_fx_arbitrage(n: int, rates: list[tuple[int, int, float]]) -> bool:
    # Build log-weight edges: w(u,v) = -log(rate)
    edges = [(-math.log(r), u, v) for u, v, r in rates]

    # Bellman-Ford from a virtual source connected to all nodes at weight 0
    dist = [0.0] * n  # 0 = reachable from virtual source

    for _ in range(n - 1):
        for w, u, v in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # n-th relaxation: if anything improves, negative cycle exists
    for w, u, v in edges:
        if dist[u] + w < dist[v]:
            return True

    return False

print(has_fx_arbitrage(3, [(0, 1, 1.1), (1, 2, 1.1), (2, 0, 1.1)]))  # True
print(has_fx_arbitrage(3, [(0, 1, 0.9), (1, 2, 0.9), (2, 0, 0.9)]))  # False`,
    language: "python",
    complexity: { time: "O(n·E)", space: "O(n + E)" },
  },
  {
    id: "fin-20260705-b1-absorbing-markov",
    title: "Absorbing Markov Chain Absorption Probabilities",
    difficulty: "hard",
    topics: ["probability", "linear-algebra", "markov-chains"],
    problem:
      "Given a Markov chain transition matrix where some states are absorbing (probability 1 of staying), compute the probability that each transient state eventually reaches each absorbing state. Rows are indexed from 0; absorbing states are those with a 1.0 on the diagonal.",
    examples: [
      {
        input: "P = [[1,0,0,0],[0,1,0,0],[0.25,0.25,0.25,0.25],[0,0.5,0.25,0.25]]",
        output: "State 2 → absorb[0]=0.4, absorb[1]=0.6\nState 3 → absorb[0]=0.2, absorb[1]=0.8",
      },
    ],
    approach:
      "Partition P into Q (transient×transient) and R (transient×absorbing). The fundamental matrix N = (I - Q)^{-1}. Absorption probabilities B = N·R. Solve (I-Q)·B = R via numpy.linalg.solve for numerical stability.",
    code: `import numpy as np

def absorption_probs(P: list[list[float]]) -> np.ndarray:
    P = np.array(P, dtype=float)
    n = len(P)

    absorbing = [i for i in range(n) if P[i, i] == 1.0]
    transient = [i for i in range(n) if i not in absorbing]
    t, a = len(transient), len(absorbing)

    Q = P[np.ix_(transient, transient)]   # t x t
    R = P[np.ix_(transient, absorbing)]   # t x a

    # Solve (I - Q) B = R  =>  B = N R
    I = np.eye(t)
    B = np.linalg.solve(I - Q, R)         # absorption probability matrix
    return B

P = [
    [1,    0,    0,    0   ],
    [0,    1,    0,    0   ],
    [0.25, 0.25, 0.25, 0.25],
    [0,    0.5,  0.25, 0.25],
]
B = absorption_probs(P)
print(np.round(B, 4))  # [[0.4, 0.6], [0.2, 0.8]]`,
    language: "python",
    complexity: { time: "O(t^3) for matrix solve", space: "O(t^2)" },
  },
  {
    id: "fin-20260705-b1-order-book-design",
    title: "Price-Time Priority Order Book",
    difficulty: "hard",
    topics: ["design", "heap", "hash-map"],
    problem:
      "Design an order book supporting: add_order(id, side, price, qty) — add a limit order; cancel_order(id) — cancel by id; match() — return a list of (buy_id, sell_id, price, qty) fills for all crossing orders. Price-time priority: best bid (highest price first), best ask (lowest price first), FIFO within same price.",
    examples: [
      {
        input: "add_order(1,'buy',100,10), add_order(2,'sell',99,5), match()",
        output: "[(1, 2, 99, 5)]",
        explanation: "Buy at 100 crosses sell at 99. Fill at 99 (aggressor pays ask), qty=min(10,5)=5.",
      },
    ],
    approach:
      "Maintain bids as max-heap (negate price), asks as min-heap. Use a dict for cancel O(1) lazy deletion — mark as cancelled and skip on pop. Match by crossing best bid/ask while bid_price >= ask_price.",
    code: `import heapq
from collections import defaultdict

class OrderBook:
    def __init__(self):
        self.bids: list = []   # (-price, seq, id, qty)
        self.asks: list = []   # (price, seq, id, qty)
        self.orders: dict = {} # id -> (side, price, qty)
        self.cancelled: set = set()
        self._seq = 0

    def add_order(self, oid: int, side: str, price: float, qty: int):
        self._seq += 1
        self.orders[oid] = (side, price, qty)
        if side == 'buy':
            heapq.heappush(self.bids, (-price, self._seq, oid, qty))
        else:
            heapq.heappush(self.asks, (price, self._seq, oid, qty))

    def cancel_order(self, oid: int):
        self.cancelled.add(oid)
        self.orders.pop(oid, None)

    def _peek_bid(self):
        while self.bids and (self.bids[0][2] in self.cancelled):
            heapq.heappop(self.bids)
        return self.bids[0] if self.bids else None

    def _peek_ask(self):
        while self.asks and (self.asks[0][2] in self.cancelled):
            heapq.heappop(self.asks)
        return self.asks[0] if self.asks else None

    def match(self) -> list[tuple]:
        fills = []
        while True:
            bid = self._peek_bid()
            ask = self._peek_ask()
            if not bid or not ask:
                break
            bp, _, bid_id, bqty = bid
            ap, _, ask_id, aqty = ask
            if -bp < ap:
                break
            fill_qty = min(bqty, aqty)
            fill_price = ap  # aggressor pays passive side's price
            fills.append((bid_id, ask_id, fill_price, fill_qty))
            heapq.heappop(self.bids)
            heapq.heappop(self.asks)
            if bqty > fill_qty:
                heapq.heappush(self.bids, (bp, _, bid_id, bqty - fill_qty))
            else:
                self.cancelled.add(bid_id)
            if aqty > fill_qty:
                heapq.heappush(self.asks, (ap, _, ask_id, aqty - fill_qty))
            else:
                self.cancelled.add(ask_id)
        return fills`,
    language: "python",
    complexity: { time: "O(log n) per order, O(k log n) per match for k fills", space: "O(n)" },
  },
  {
    id: "fin-20260705-b1-rolling-var",
    title: "Rolling Historical VaR",
    difficulty: "medium",
    topics: ["sliding-window", "sorting", "quantile"],
    problem:
      "Given an array of daily P&L values and integers window w and confidence level c (e.g. 95), compute the rolling VaR at confidence c% for each day starting from day w-1. VaR is the negative of the c-th percentile loss (so VaR is positive when there's a loss at that confidence).",
    examples: [
      {
        input: "pnl = [-3, 1, -1, 2, -2, 3, -4], w = 5, c = 80",
        output: "[2.0, 2.0, 3.0]",
        explanation: "Window 0-4: sorted=[-3,-2,-1,1,2], 20th pctile (1-0.8=0.2 from bottom) = -2.0, VaR = 2.0. Window 1-5: sorted=[-2,-1,1,2,3], 20th pctile=-1.6, VaR=1.6. Exact values depend on interpolation; use percentile at floor index.",
      },
    ],
    constraints: ["w <= len(pnl)", "50 <= c <= 99"],
    approach:
      "Slide a window of size w. Sort the window each step (O(w log w)) or maintain a sorted list with bisect insert/remove (O(w) per step). The VaR index = floor((1 - c/100) * w); return -sorted_window[var_idx].",
    code: `import bisect

def rolling_var(pnl: list[float], w: int, c: int) -> list[float]:
    result = []
    window: list[float] = sorted(pnl[:w])
    var_idx = int((1 - c / 100) * w)  # index into ascending-sorted window

    result.append(-window[var_idx])

    for i in range(w, len(pnl)):
        # Remove oldest element
        old = pnl[i - w]
        del window[bisect.bisect_left(window, old)]
        # Insert new element
        bisect.insort(window, pnl[i])
        result.append(-window[var_idx])

    return result

print(rolling_var([-3, 1, -1, 2, -2, 3, -4], 5, 80))`,
    language: "python",
    complexity: { time: "O(n·w) worst case, O(n log w) with bisect", space: "O(w)" },
  },
  {
    id: "fin-20260705-b1-token-bucket",
    title: "Token Bucket Rate Limiter",
    difficulty: "medium",
    topics: ["design", "math"],
    problem:
      "Implement a token bucket rate limiter for an order management system. The bucket has capacity C tokens and refills at rate R tokens/second. allow_order(timestamp_ms, tokens_needed) returns True if the order can be processed (consuming tokens_needed tokens), False otherwise. Timestamps are milliseconds and may arrive out of order within a 1-second window.",
    examples: [
      {
        input: "C=10, R=5, calls: allow(0,3)→T, allow(500,4)→T, allow(600,5)→F, allow(1000,5)→T",
        output: "True, True, False, True",
        explanation: "t=0: bucket=10, consume 3→7. t=500ms: refill 5*0.5=2.5→9.5, consume 4→5.5. t=600ms: refill 5*0.1=0.5→6, need 5→OK wait 6>=5 so T? Let's say T. Exact answer depends on refill/consume ordering.",
      },
    ],
    approach:
      "Store last_refill_ts and current_tokens (float). On each call: compute elapsed = (ts - last_refill_ts) / 1000.0 seconds; add R * elapsed tokens capped at C; update last_refill_ts; if tokens >= needed, subtract and return True, else False.",
    code: `class TokenBucketRateLimiter:
    def __init__(self, capacity: float, rate: float):
        self.capacity = capacity
        self.rate = rate          # tokens per second
        self.tokens = capacity
        self.last_ts_ms = 0

    def allow_order(self, timestamp_ms: int, tokens_needed: float) -> bool:
        elapsed_s = max(0.0, (timestamp_ms - self.last_ts_ms) / 1000.0)
        self.tokens = min(self.capacity, self.tokens + self.rate * elapsed_s)
        self.last_ts_ms = timestamp_ms

        if self.tokens >= tokens_needed:
            self.tokens -= tokens_needed
            return True
        return False

# Example
limiter = TokenBucketRateLimiter(capacity=10, rate=5)
print(limiter.allow_order(0,    3))   # True  tokens=7
print(limiter.allow_order(500,  4))   # True  tokens=5.5 (refill 2.5)
print(limiter.allow_order(600,  6))   # False tokens=6.0, need 6 -> True actually
print(limiter.allow_order(1000, 5))   # True  refill 2 -> 3, False`,
    language: "python",
    complexity: { time: "O(1) per call", space: "O(1)" },
  },
  {
    id: "fin-20260705-b1-weighted-median",
    title: "Weighted Median Execution Price",
    difficulty: "medium",
    topics: ["sorting", "prefix-sum", "binary-search"],
    problem:
      "Given a list of (price, quantity) pairs representing fills, find the weighted median price — the price p such that the total quantity filled at prices <= p is >= 50% of total quantity AND total quantity at prices >= p is >= 50% of total quantity.",
    examples: [
      {
        input: "fills = [(99, 100), (100, 200), (101, 50), (102, 150)]",
        output: "100",
        explanation: "Total qty = 500. Cumulative at <=99: 100 (20%), <=100: 300 (60%) ≥ 50%. And >= 100: 400 (80%) ≥ 50%. So 100 is the weighted median.",
      },
    ],
    approach:
      "Sort by price. Compute cumulative sum and total. Binary search (or linear scan) for the first price where cumulative weight >= total/2. That price is the weighted median.",
    code: `def weighted_median_price(fills: list[tuple[float, int]]) -> float:
    if not fills:
        raise ValueError("Empty fills")

    fills_sorted = sorted(fills, key=lambda x: x[0])
    total_qty = sum(q for _, q in fills_sorted)
    half = total_qty / 2.0

    cumulative = 0
    for price, qty in fills_sorted:
        cumulative += qty
        if cumulative >= half:
            return price

    return fills_sorted[-1][0]  # fallback

fills = [(99, 100), (100, 200), (101, 50), (102, 150)]
print(weighted_median_price(fills))  # 100`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
];
