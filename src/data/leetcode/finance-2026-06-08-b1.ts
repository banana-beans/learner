import type { LeetCodeProblem } from "./index";

export const financeProblems20260608B1: LeetCodeProblem[] = [
  {
    id: "fin-20260608-b1-token-bucket",
    title: "Design Token Bucket Rate Limiter",
    difficulty: "medium",
    topics: ["design", "queue", "rate-limiting", "finance"],
    problem:
      "Design a TokenBucket rate limiter for an order management system. Implement: TokenBucket(capacity, refill_rate) — capacity: max tokens; refill_rate: tokens added per second. consume(tokens, timestamp) — attempt to consume tokens tokens at the given timestamp (float seconds). Returns True if successful, False if insufficient tokens. Tokens refill continuously at refill_rate per second up to capacity.",
    examples: [
      {
        input:
          "tb = TokenBucket(10, 2); tb.consume(5, 0.0); tb.consume(5, 0.0); tb.consume(1, 0.0); tb.consume(1, 1.0)",
        output: "[True, True, False, True]",
        explanation:
          "Start: 10 tokens. Consume 5 → 5 left. Consume 5 → 0 left. Consume 1 → False (0 < 1). At t=1.0: 0 + 2*1 = 2 tokens refilled, consume 1 → True.",
      },
    ],
    constraints: [
      "0 < capacity <= 10^6",
      "0 < refill_rate <= 10^6",
      "timestamps are non-decreasing",
    ],
    approach:
      "Lazy refill: store last_time and current_tokens. On each consume call, compute elapsed = timestamp - last_time, add elapsed * refill_rate to tokens (capped at capacity), then attempt the consume. O(1) per call.",
    code: `class TokenBucket:
    def __init__(self, capacity: float, refill_rate: float):
        self.capacity    = capacity
        self.refill_rate = refill_rate
        self.tokens      = capacity  # start full
        self.last_time   = 0.0

    def consume(self, tokens: float, timestamp: float) -> bool:
        # Lazy refill: add tokens for elapsed time
        elapsed      = timestamp - self.last_time
        self.tokens  = min(self.capacity,
                           self.tokens + elapsed * self.refill_rate)
        self.last_time = timestamp

        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False`,
    language: "python",
    complexity: { time: "O(1) per consume", space: "O(1)" },
  },
  {
    id: "fin-20260608-b1-biased-coin",
    title: "Simulate Fair Coin from Biased Coin",
    difficulty: "easy",
    topics: ["probability", "math", "randomness", "finance"],
    problem:
      "You have a biased coin that returns Heads with probability p (unknown, 0 < p < 1). Implement a function fair_coin() that uses this biased coin to generate a uniformly random bit (0 or 1 with equal probability). You may call biased_coin() as many times as needed. What is the expected number of biased_coin() calls per fair coin output?",
    examples: [
      {
        input: "p = 0.3 (biased_coin returns 1 with prob 0.3)",
        output: "fair_coin() returns 0 or 1 each with probability 0.5",
        explanation:
          "Von Neumann trick: flip twice. P(HT) = p*(1-p) = P(TH). If HT → return 0; if TH → return 1; otherwise repeat. Both outcomes have equal probability p*(1-p) regardless of p.",
      },
    ],
    approach:
      "Von Neumann (1951) extractor: flip the coin twice. If both same (HH or TT), discard and retry. If HT, return 0; if TH, return 1. Each pair is accepted with probability 2*p*(1-p). Expected flips = 2 / (2*p*(1-p)) = 1/(p*(1-p)). Maximised at p=0.5 (2 flips expected), worst at p→0 or p→1 (infinite).",
    code: `import random

def biased_coin(p: float) -> int:
    """Simulates a coin that returns 1 with probability p."""
    return 1 if random.random() < p else 0

def fair_coin(p: float) -> int:
    """
    Von Neumann extractor: produces uniform {0, 1} from biased coin.
    Expected calls per output = 1 / (p*(1-p)).
    """
    while True:
        a = biased_coin(p)
        b = biased_coin(p)
        if a != b:
            return a   # HT -> 0 (a=1,b=0 means first=H); TH -> 1
            # Actually: return a (a=1,b=0 returns 1; a=0,b=1 returns 0)
            # P(a=1,b=0) = p*(1-p) = P(a=0,b=1) -> uniform

def expected_calls(p: float, samples: int = 100_000) -> float:
    """Empirically estimate expected number of biased_coin() calls."""
    total_calls = 0
    for _ in range(samples):
        calls = 0
        while True:
            a = biased_coin(p); b = biased_coin(p)
            calls += 2
            if a != b:
                break
        total_calls += calls
    return total_calls / samples

# Theoretical: E[calls] = 2 / (2*p*(1-p)) = 1 / (p*(1-p))
# p=0.5: E=2; p=0.1: E=22.2; p=0.01: E=2020`,
    language: "python",
    complexity: {
      time: "O(1/(p*(1-p))) expected",
      space: "O(1)",
    },
  },
  {
    id: "fin-20260608-b1-matrix-exp-markov",
    title: "Markov Chain State via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["matrix-exponentiation", "dp", "probability", "finance"],
    problem:
      "A market has 3 regimes: Bull (0), Neutral (1), Bear (2). The daily transition matrix is given as a 3x3 probability matrix. Given the initial regime distribution (a probability vector), compute the distribution after exactly N days. N can be up to 10^18. Return the probability vector rounded to 6 decimal places.",
    examples: [
      {
        input:
          "T = [[0.7,0.2,0.1],[0.2,0.6,0.2],[0.1,0.2,0.7]], init = [1,0,0], N = 2",
        output: "[0.53, 0.24, 0.23]",
        explanation:
          "After 2 days starting from Bull: (T^2)[0] = [0.53, 0.24, 0.23]. Direct: T^2 = T @ T, then init @ T^2.",
      },
    ],
    constraints: [
      "1 <= N <= 10^18",
      "Transition matrix rows sum to 1",
      "3 <= matrix size <= 20",
    ],
    approach:
      "Matrix exponentiation by squaring: T^N in O(k^3 * log N) time where k is matrix size. Represent matrix multiplication and use binary exponentiation. The state distribution after N steps is init @ T^N.",
    code: `import numpy as np
from typing import List

def mat_mul(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    """Matrix multiplication (used for exact integer-compatible version)."""
    return A @ B

def mat_pow(M: np.ndarray, n: int) -> np.ndarray:
    """Matrix fast exponentiation: computes M^n in O(k^3 * log n)."""
    k      = M.shape[0]
    result = np.eye(k)         # identity matrix
    base   = M.copy()

    while n > 0:
        if n & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        n >>= 1

    return result

def regime_after_n_days(
    T: List[List[float]],
    init: List[float],
    N: int
) -> List[float]:
    """
    Compute state distribution after N Markov chain steps.
    dist_N = init @ T^N
    """
    T_mat   = np.array(T, dtype=float)
    init_v  = np.array(init, dtype=float)
    T_N     = mat_pow(T_mat, N)
    dist    = init_v @ T_N
    # Normalize to correct floating point drift
    dist    = np.maximum(dist, 0)
    dist   /= dist.sum()
    return [round(float(x), 6) for x in dist]

# As N -> inf, dist converges to stationary distribution pi where pi @ T = pi.
# Stationary: solve (T.T - I) @ pi = 0, sum(pi) = 1.`,
    language: "python",
    complexity: { time: "O(k^3 * log N)", space: "O(k^2)" },
  },
  {
    id: "fin-20260608-b1-bit-long-short",
    title: "Count Net Long/Short Positions from Bitmask",
    difficulty: "easy",
    topics: ["bit-manipulation", "math", "finance"],
    problem:
      "You are given a 64-bit integer bitmask where each pair of bits encodes a position: bit 2i = 1 means asset i is LONG, bit 2i+1 = 1 means asset i is SHORT. A position is NET LONG if bit 2i=1 and bit 2i+1=0, NET SHORT if bit 2i=0 and bit 2i+1=1, and FLAT or BOTH if both or neither bits are set. Return (net_long_count, net_short_count) for the 32 possible assets.",
    examples: [
      {
        input: "mask = 0b01_10_01_10 = 0x6A (8 bits for 4 assets)",
        output: "(2, 2)",
        explanation:
          "Asset 0: bits [1,0] = SHORT (net short). Asset 1: bits [1,0] = SHORT. Asset 2: bits [0,1] = LONG (net long). Asset 3: bits [0,1] = LONG. net_long=2, net_short=2.",
      },
      {
        input: "mask = 0b01_01_01_01",
        output: "(4, 0)",
        explanation: "Each asset has bit 2i=1, bit 2i+1=0 → all 4 are LONG.",
      },
    ],
    approach:
      "Isolate pairs of bits: for each i in 0..31, check bits 2i and 2i+1. Use (mask >> (2*i)) & 3 to extract the 2-bit value. Value 1 (binary 01) = LONG; value 2 (binary 10) = SHORT. Count each. O(32) = O(1).",
    code: `def count_net_positions(mask: int) -> tuple:
    """
    For each of 32 assets, extract 2-bit value = mask[2i+1 : 2i].
    01 = LONG, 10 = SHORT, 00 = FLAT, 11 = BOTH (treat as flat).
    """
    net_long = net_short = 0
    for i in range(32):
        bits = (mask >> (2 * i)) & 0b11
        if bits == 0b01:    # bit 2i set, bit 2i+1 clear
            net_long += 1
        elif bits == 0b10:  # bit 2i+1 set, bit 2i clear
            net_short += 1
    return (net_long, net_short)

def toggle_long(mask: int, asset: int) -> int:
    """Set asset as NET LONG: set bit 2i, clear bit 2i+1."""
    return (mask | (1 << (2 * asset))) & ~(1 << (2 * asset + 1))

def toggle_short(mask: int, asset: int) -> int:
    """Set asset as NET SHORT: clear bit 2i, set bit 2i+1."""
    return (mask & ~(1 << (2 * asset))) | (1 << (2 * asset + 1))

def flatten(mask: int, asset: int) -> int:
    """Clear both bits for asset i."""
    return mask & ~(0b11 << (2 * asset))

# Bitwise approach scales to 64-asset portfolios in a single register;
# popcount(long_bits) with Python int.bit_count() is O(1) for 64-bit values.`,
    language: "python",
    complexity: { time: "O(1) (32 assets fixed)", space: "O(1)" },
  },
  {
    id: "fin-20260608-b1-max-profit-blackout",
    title: "Maximum Profit with Blackout Days",
    difficulty: "hard",
    topics: ["dp", "array", "finance"],
    problem:
      "Given stock prices prices[] and a list of blackout intervals [(l1,r1), (l2,r2), ...] during which you cannot buy OR sell, find the maximum profit. You may hold at most one share at a time. Transactions that START (buy) or END (sell) within a blackout day are forbidden, but positions held through blackout days are allowed.",
    examples: [
      {
        input: "prices = [1,2,3,4,5], blackouts = [(2,2)]",
        output: "3",
        explanation:
          "Day 2 (0-indexed) is blacked out. Buy day 0 (price=1), sell day 1 (price=2): profit=1. Then buy day 3 (price=4), sell day 4 (price=5): profit=1. Total=2. OR buy day 0, sell day 4 (skip blackout hold): 5-1=4, but can we sell on day 4? Blackout is only day 2. Buy day 0 sell day 4: profit=4. Best=4.",
      },
      {
        input: "prices = [5,1,2,3], blackouts = [(1,2)]",
        output: "2",
        explanation:
          "Days 1 and 2 are blacked out (cannot buy/sell). Buy day 0: too risky (prices fall). Best: buy day 0 (5): sell never profitable. OR buy on day 3 (3): nowhere to sell. Best: buy day 3, no sell available. Answer: 0. Actually: buy on day 1 is blacked out. Buy day 0 (5), sell never profitable. Profit=0. But prices[3]=3 < prices[0]=5, so never buy. Profit=0.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "Blackout intervals may overlap",
    ],
    approach:
      "Mark blacked-out days in a boolean array. DP with two states: hold (own stock) and free (no stock). Transition: on non-blackout days, can buy/sell; on blackout days, only hold/remain free. O(N) time.",
    code: `def max_profit_blackout(prices, blackouts):
    n = len(prices)
    if n == 0: return 0

    # Build blackout set
    blacked = [False] * n
    for l, r in blackouts:
        for d in range(l, r + 1):
            if 0 <= d < n:
                blacked[d] = True

    # DP states: free = not holding, hold = holding
    free = 0
    hold = -float("inf")

    for i in range(n):
        if blacked[i]:
            # Cannot initiate new buy or sell; can only maintain state
            new_free = free   # stay free (no sell allowed)
            new_hold = hold   # stay holding (no buy allowed)
        else:
            # Can buy or sell
            new_free = max(free, hold + prices[i])  # sell today or stay free
            new_hold = max(hold, free - prices[i])  # buy today or stay holding
        free, hold = new_free, new_hold

    return max(free, 0)`,
    language: "python",
    complexity: { time: "O(N + B) where B = total blackout days", space: "O(N)" },
  },
  {
    id: "fin-20260608-b1-next-greater-price",
    title: "Next Greater Price Level for Options Chain",
    difficulty: "medium",
    topics: ["monotonic-stack", "array", "finance"],
    problem:
      "Given an options chain as an array strikes[] of ascending strike prices, and an array open_interest[] of the open interest at each strike, find for each strike the NEXT strike with STRICTLY GREATER open interest. Return an array result where result[i] = strikes[j] where j > i is the smallest index with open_interest[j] > open_interest[i], or -1 if no such j exists.",
    examples: [
      {
        input:
          "strikes = [90, 95, 100, 105, 110], open_interest = [100, 150, 80, 200, 50]",
        output: "[95, 105, 105, -1, -1]",
        explanation:
          "OI=[100,150,80,200,50]. Strike 90 (OI=100): next greater OI is 150 at strike 95 → 95. Strike 95 (OI=150): next greater OI is 200 at strike 105 → 105. Strike 100 (OI=80): next greater OI is 200 at strike 105 → 105. Strike 105 (OI=200): no greater → -1. Strike 110 (OI=50): no greater → -1.",
      },
    ],
    approach:
      "Monotonic stack (decreasing OI): iterate left to right. For each index i, pop from stack while stack top has OI < open_interest[i] — those stack entries found their answer (= strikes[i]). Push i onto stack. Elements remaining in stack have no answer → -1. O(N) time.",
    code: `def next_greater_oi(strikes, open_interest):
    n      = len(strikes)
    result = [-1] * n
    stack  = []  # indices, maintained with decreasing open_interest

    for i in range(n):
        # Pop all entries whose OI is less than current OI
        while stack and open_interest[stack[-1]] < open_interest[i]:
            j = stack.pop()
            result[j] = strikes[i]   # i is the next greater for j
        stack.append(i)

    # Remaining in stack have no greater OI to the right: result stays -1
    return result

def next_greater_oi_circular(strikes, open_interest):
    """Variant: treat the chain as circular (wraps around expiry to next month)."""
    n      = len(strikes)
    result = [-1] * n
    stack  = []

    for i in range(2 * n):   # two passes to handle wrap-around
        idx = i % n
        while stack and open_interest[stack[-1]] < open_interest[idx]:
            j = stack.pop()
            result[j] = strikes[idx]
        if i < n:
            stack.append(idx)

    return result`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
  {
    id: "fin-20260608-b1-order-matcher",
    title: "Design Price-Time Priority Order Matcher",
    difficulty: "hard",
    topics: ["design", "heap", "sorted-map", "finance"],
    problem:
      "Design an OrderMatcher that supports: place_order(order_id, side, price, qty) — add a limit order ('buy' or 'sell'); cancel_order(order_id) — remove an order; get_trades() — return list of (buy_id, sell_id, price, qty) trades that executed (FIFO within same price level). Matching occurs when best_bid >= best_ask. Price-time priority: highest bid fills first; among equal prices, earlier-placed orders fill first.",
    examples: [
      {
        input:
          "place_order(1,'buy',100,10); place_order(2,'buy',99,5); place_order(3,'sell',100,7)",
        output: "get_trades() = [(1, 3, 100, 7)]",
        explanation:
          "Best bid = 100 (order 1). Sell order at 100 matches bid at 100. Trade: 7 shares at price 100. Order 1 partially filled (3 remaining). Order 3 fully filled.",
      },
    ],
    constraints: [
      "order_id is unique",
      "qty >= 1",
      "price > 0",
      "Multiple fills per order are possible",
    ],
    approach:
      "Maintain sorted bid/ask books: bids as max-heap (by price, then time), asks as min-heap. On place_order: insert into appropriate book, then try matching. Match while best_bid >= best_ask. Use a dict for O(1) cancel (lazy deletion). O(log N) per order.",
    code: `import heapq
from collections import defaultdict

class OrderMatcher:
    def __init__(self):
        self.bids   = []   # max-heap: (-price, seqno, order_id, qty)
        self.asks   = []   # min-heap: (price, seqno, order_id, qty)
        self.active = {}   # order_id -> [price, qty, side]
        self.trades = []
        self.seq    = 0

    def place_order(self, oid: int, side: str, price: float, qty: int):
        self.seq += 1
        self.active[oid] = [price, qty, side]
        if side == "buy":
            heapq.heappush(self.bids, (-price, self.seq, oid, qty))
        else:
            heapq.heappush(self.asks, (price, self.seq, oid, qty))
        self._match()

    def cancel_order(self, oid: int):
        if oid in self.active:
            del self.active[oid]  # lazy deletion from heap

    def _match(self):
        while self.bids and self.asks:
            # Peek tops (skip cancelled/filled via lazy deletion)
            while self.bids and self.bids[0][2] not in self.active:
                heapq.heappop(self.bids)
            while self.asks and self.asks[0][2] not in self.active:
                heapq.heappop(self.asks)
            if not self.bids or not self.asks:
                break
            best_bid = self.bids[0]
            best_ask = self.asks[0]
            bid_price, ask_price = -best_bid[0], best_ask[0]
            if bid_price < ask_price:
                break
            bid_id, ask_id = best_bid[2], best_ask[2]
            trade_price = ask_price   # aggressor pays ask
            trade_qty   = min(self.active[bid_id][1], self.active[ask_id][1])
            self.trades.append((bid_id, ask_id, trade_price, trade_qty))
            self.active[bid_id][1] -= trade_qty
            self.active[ask_id][1] -= trade_qty
            if self.active[bid_id][1] == 0: del self.active[bid_id]
            if self.active[ask_id][1] == 0: del self.active[ask_id]

    def get_trades(self):
        t = self.trades[:]
        self.trades.clear()
        return t`,
    language: "python",
    complexity: { time: "O(log N) place/cancel, O(F log N) fill", space: "O(N)" },
  },
  {
    id: "fin-20260608-b1-topk-momentum",
    title: "Top-K Momentum Stocks from Streaming Returns",
    difficulty: "medium",
    topics: ["heap", "hash-map", "finance"],
    problem:
      "You have a stream of events: update(ticker, daily_return) — update the cumulative return of a ticker (multiply in: cumulative *= (1 + daily_return)); get_top_k(k) — return the k tickers with the highest cumulative return. Tickers can be updated multiple times. Design a data structure that supports both operations efficiently.",
    examples: [
      {
        input:
          "update('AAPL', 0.05); update('GOOG', 0.03); update('MSFT', 0.08); update('AAPL', 0.02); get_top_k(2)",
        output: "['MSFT', 'AAPL']",
        explanation:
          "AAPL: 1.05 * 1.02 = 1.071. GOOG: 1.03. MSFT: 1.08. Top-2: MSFT (1.08), AAPL (1.071).",
      },
    ],
    constraints: [
      "1 <= k <= number of unique tickers",
      "Up to 10^6 update calls",
      "get_top_k called up to 10^3 times",
    ],
    approach:
      "Maintain a dict of cumulative returns. For get_top_k, use heapq.nlargest(k, ...) which runs in O(N + k log N). Alternatively maintain a sorted structure but updates are O(log N) per update. For infrequent get_top_k, heapq.nlargest is optimal.",
    code: `import heapq
from collections import defaultdict

class MomentumTracker:
    def __init__(self):
        self.cum_returns = defaultdict(lambda: 1.0)

    def update(self, ticker: str, daily_return: float) -> None:
        """Compound the daily return into the cumulative return."""
        self.cum_returns[ticker] *= (1.0 + daily_return)

    def get_top_k(self, k: int) -> list:
        """Return top-k tickers by cumulative return (largest first)."""
        # heapq.nlargest is O(N + k log N) — optimal for infrequent queries
        return heapq.nlargest(k, self.cum_returns,
                              key=lambda t: self.cum_returns[t])

    def get_top_k_with_returns(self, k: int) -> list:
        """Return list of (ticker, cumulative_return) tuples, sorted descending."""
        return heapq.nlargest(k, self.cum_returns.items(),
                              key=lambda x: x[1])

    def reset(self, ticker: str) -> None:
        """Reset ticker return to 1.0 (start of new period)."""
        self.cum_returns[ticker] = 1.0

# If get_top_k is called very frequently, maintain a sorted list or
# a max-heap with lazy deletion (similar to the order matcher pattern).
# For N=1000 tickers, heapq.nlargest is fast enough for all use cases.`,
    language: "python",
    complexity: {
      time: "O(1) update, O(N + k log N) get_top_k",
      space: "O(N)",
    },
  },
  {
    id: "fin-20260608-b1-min-fee-fx-path",
    title: "Minimum Fee Currency Exchange Path",
    difficulty: "medium",
    topics: ["graph", "dijkstra", "finance"],
    problem:
      "You have N currencies and a graph of exchange edges. Each edge (u, v) has a fee in basis points. Given a starting currency src, a target currency dst, and a starting amount, find the path that minimises total transaction fees (NOT the maximum amount, just the minimum total bps fee). Return the minimum total fee and the path.",
    examples: [
      {
        input:
          "N=3, edges=[(0,1,10),(1,2,15),(0,2,30)], src=0, dst=2",
        output: "min_fee=25 bps, path=[0,1,2]",
        explanation:
          "Path 0→2 direct: 30 bps. Path 0→1→2: 10+15=25 bps. Minimum is 25 via 0→1→2.",
      },
    ],
    constraints: [
      "1 <= N <= 100",
      "Edges are undirected (can go both ways)",
      "Fees are non-negative",
    ],
    approach:
      "Dijkstra's algorithm on the fee-weighted graph: each edge has weight = fee in bps. Find shortest path by total fee from src to dst. O((E + V) log V) time.",
    code: `import heapq
from collections import defaultdict
from math import inf

def min_fee_path(n: int, edges: list, src: int, dst: int) -> dict:
    """
    Dijkstra for minimum total fee (in bps) from src to dst.
    edges: list of (u, v, fee_bps) tuples (undirected).
    """
    graph = defaultdict(list)
    for u, v, fee in edges:
        graph[u].append((v, fee))
        graph[v].append((u, fee))  # undirected

    dist  = [inf] * n
    prev  = [-1]  * n
    dist[src] = 0

    heap = [(0, src)]   # (total_fee, node)

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue    # stale entry
        for v, fee in graph[u]:
            nd = d + fee
            if nd < dist[v]:
                dist[v] = nd
                prev[v] = u
                heapq.heappush(heap, (nd, v))

    if dist[dst] == inf:
        return {"min_fee": -1, "path": []}

    # Reconstruct path
    path = []
    cur  = dst
    while cur != -1:
        path.append(cur)
        cur = prev[cur]
    path.reverse()

    return {
        "min_fee_bps": int(dist[dst]),
        "path":        path,
    }`,
    language: "python",
    complexity: { time: "O((E + V) log V)", space: "O(V + E)" },
  },
  {
    id: "fin-20260608-b1-yield-maximise-dp",
    title: "Maximum Yield Bond Portfolio with Maturity Constraints",
    difficulty: "hard",
    topics: ["dp", "knapsack", "finance"],
    problem:
      "You have a budget of B dollars and N bonds, each with integer cost[i] dollars and annual yield[i] basis points. You must select bonds such that the sum of maturities maturity[i] (in years) does not exceed a duration limit D. Unlike a standard knapsack, you have TWO constraints: total cost <= B AND total duration <= D. Maximise total yield.",
    examples: [
      {
        input:
          "B=10, D=5, cost=[3,4,2], yield_bps=[200,300,150], maturity=[2,3,1]",
        output: "500",
        explanation:
          "Select bond 0 (cost=3, yield=200, maturity=2) + bond 2 (cost=2, yield=150, maturity=1): total cost=5<=10, total duration=3<=5, total yield=350. Select bond 1 (cost=4, yield=300, maturity=3) + bond 2 (cost=2, yield=150, maturity=1): total cost=6<=10, total duration=4<=5, total yield=450. Select bond 0 + bond 1: cost=7, duration=5<=5, yield=500. Maximum.",
      },
    ],
    constraints: [
      "1 <= N <= 50",
      "1 <= B, D <= 200",
      "All integers",
    ],
    approach:
      "2D knapsack DP: dp[b][d] = max yield with at most b budget and d duration. For each bond, update dp from (B,D) down to (cost,maturity) — standard 0-1 knapsack extended to 2 dimensions. O(N*B*D) time and space.",
    code: `def max_yield_2d_knapsack(B: int, D: int,
                             cost: list, yield_bps: list,
                             maturity: list) -> int:
    """
    2D 0-1 knapsack: two capacity constraints (budget B and duration D).
    dp[b][d] = max yield using at most b budget and d duration limit.
    """
    n  = len(cost)
    # dp dimensions: (B+1) x (D+1)
    dp = [[0] * (D + 1) for _ in range(B + 1)]

    for i in range(n):
        c  = cost[i]
        y  = yield_bps[i]
        m  = maturity[i]
        # Traverse backwards to enforce 0-1 (no reuse)
        for b in range(B, c - 1, -1):
            for d in range(D, m - 1, -1):
                dp[b][d] = max(dp[b][d], dp[b - c][d - m] + y)

    return dp[B][D]

def reconstruct_2d_knapsack(B: int, D: int,
                             cost: list, yield_bps: list,
                             maturity: list) -> list:
    """Backtrack to find which bonds were selected."""
    n  = len(cost)
    dp = [[0] * (D + 1) for _ in range(B + 1)]
    for i in range(n):
        c, y, m = cost[i], yield_bps[i], maturity[i]
        for b in range(B, c - 1, -1):
            for d in range(D, m - 1, -1):
                dp[b][d] = max(dp[b][d], dp[b-c][d-m] + y)
    selected = []
    b, d = B, D
    for i in range(n - 1, -1, -1):
        c, y, m = cost[i], yield_bps[i], maturity[i]
        if b >= c and d >= m and dp[b][d] == dp[b-c][d-m] + y:
            selected.append(i)
            b -= c; d -= m
    return selected`,
    language: "python",
    complexity: { time: "O(N * B * D)", space: "O(B * D)" },
  },
];
