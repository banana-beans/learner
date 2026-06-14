import type { LeetCodeProblem } from "./index";

export const financeProblems20260614B1: LeetCodeProblem[] = [
  {
    id: "fin-20260614-b1-token-bucket",
    title: "Token Bucket Rate Limiter",
    difficulty: "medium",
    topics: ["Design", "Simulation"],
    problem: `Design a Token Bucket rate limiter used in HFT systems to throttle order submission. The bucket refills at a constant rate (tokens/sec) and allows burst up to a capacity.

Implement class TokenBucket with:
- __init__(rate: float, capacity: int) — rate = tokens/second; capacity = max tokens
- allow(n: int = 1) -> bool — return True and consume n tokens if available, else False
- remaining() -> float — current token count (after lazy refill)

Refill is lazy: tokens are computed on each call from elapsed time rather than via a background thread.`,
    examples: [
      {
        input: `tb = TokenBucket(rate=10.0, capacity=50)\ntb.allow(1)`,
        output: `True`,
        explanation: "Bucket starts full at capacity=50.",
      },
      {
        input: `tb = TokenBucket(rate=10.0, capacity=5)\ntb.allow(5)  # drain\ntb.allow(1)  # immediately after`,
        output: `False`,
        explanation: "Bucket empty; at 10 tok/s takes 0.1s to earn 1 token.",
      },
    ],
    constraints: [
      "0 < rate <= 1e6",
      "1 <= capacity <= 1e9",
      "1 <= n <= capacity",
    ],
    approach: `Lazy refill: on each call compute elapsed = now - last_ts, add elapsed*rate to token count (capped at capacity), update last_ts. Check tokens >= n; if so, deduct and return True. O(1) per call.`,
    code: `import time

class TokenBucket:
    def __init__(self, rate: float, capacity: int) -> None:
        self.rate     = rate
        self.capacity = capacity
        self.tokens   = float(capacity)   # start full
        self.last_ts  = time.monotonic()

    def _refill(self) -> None:
        now = time.monotonic()
        self.tokens = min(
            self.capacity,
            self.tokens + (now - self.last_ts) * self.rate,
        )
        self.last_ts = now

    def allow(self, n: int = 1) -> bool:
        self._refill()
        if self.tokens >= n:
            self.tokens -= n
            return True
        return False

    def remaining(self) -> float:
        self._refill()
        return self.tokens


# Usage
tb = TokenBucket(rate=100.0, capacity=1000)
print(tb.allow(500))   # True
print(tb.allow(600))   # False — only 500 remain
print(tb.remaining())  # ~500`,
    language: "python",
    complexity: { time: "O(1) per call", space: "O(1)" },
  },
  {
    id: "fin-20260614-b1-markov-matrix-power",
    title: "n-Step Markov Chain Probability via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["Matrix Exponentiation", "Dynamic Programming", "Math"],
    problem: `A market regime model has k states (bull/bear/sideways). Given a k×k transition matrix P where P[i][j] = P(next=j | now=i), compute the probability of being in state end after exactly steps steps, starting from state start.

Implement n_step_prob(trans, start, end, steps) -> float using matrix exponentiation to handle steps up to 10^18.`,
    examples: [
      {
        input: `trans = [[0.7, 0.3], [0.4, 0.6]], start=0, end=0, steps=2`,
        output: `0.61`,
        explanation: "P^2[0][0] = 0.7*0.7 + 0.3*0.4 = 0.61.",
      },
      {
        input: `trans = [[0.7, 0.3], [0.4, 0.6]], start=0, end=0, steps=100`,
        output: `0.571429 (stationary distribution 4/7)`,
        explanation: "Distribution converges to stationary pi after many steps.",
      },
    ],
    constraints: [
      "2 <= k <= 20",
      "1 <= steps <= 10^18",
      "Each row sums to 1.0",
    ],
    approach: `Matrix exponentiation: P^n in O(k^3 log n) via repeated squaring. Initialize result = identity. While p > 0: if p & 1, result = result * M; M = M * M; p >>= 1. Return result[start][end].`,
    code: `def mat_mul(A: list[list[float]], B: list[list[float]]) -> list[list[float]]:
    k = len(A)
    C = [[0.0] * k for _ in range(k)]
    for i in range(k):
        for m in range(k):
            if A[i][m] == 0.0:
                continue
            for j in range(k):
                C[i][j] += A[i][m] * B[m][j]
    return C

def mat_pow(M: list[list[float]], p: int) -> list[list[float]]:
    k = len(M)
    result = [[float(i == j) for j in range(k)] for i in range(k)]
    while p:
        if p & 1:
            result = mat_mul(result, M)
        M = mat_mul(M, M)
        p >>= 1
    return result

def n_step_prob(
    trans: list[list[float]], start: int, end: int, steps: int
) -> float:
    return mat_pow(trans, steps)[start][end]


# Tests
P = [[0.7, 0.3], [0.4, 0.6]]
print(round(n_step_prob(P, 0, 0, 2),   6))  # 0.61
print(round(n_step_prob(P, 0, 0, 100), 6))  # 0.571429`,
    language: "python",
    complexity: { time: "O(k^3 log n)", space: "O(k^2)" },
  },
  {
    id: "fin-20260614-b1-lis-signals",
    title: "Longest Increasing Subsequence of Alpha Signals",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Binary Search", "Greedy"],
    problem: `Given a sequence of n daily integer alpha scores, find the length of the longest strictly increasing subsequence (LIS). A subsequence preserves relative order but need not be contiguous.

In quant context: the LIS represents the longest run of improving alpha — useful for detecting persistent signal regimes.

Also reconstruct one such subsequence.

LeetCode #300.`,
    examples: [
      {
        input: `signals = [3, 1, 4, 1, 5, 9, 2, 6]`,
        output: `4`,
        explanation: "LIS = [1, 4, 5, 9] or [1, 4, 5, 6].",
      },
      {
        input: `signals = [5, 4, 3, 2, 1]`,
        output: `1`,
        explanation: "All decreasing; any single element is an LIS.",
      },
    ],
    constraints: [
      "1 <= n <= 10^5",
      "-10^9 <= signals[i] <= 10^9",
    ],
    approach: `Patience sorting O(n log n): maintain tails[] where tails[i] = smallest tail value seen for IS of length i+1. For each x, binary search (bisect_left) for first tail >= x and replace it (or append). Length = len(tails). Reconstruct by tracking predecessor indices.`,
    code: `import bisect

def lis_length(signals: list[int]) -> int:
    tails: list[int] = []
    for x in signals:
        pos = bisect.bisect_left(tails, x)
        if pos == len(tails):
            tails.append(x)
        else:
            tails[pos] = x
    return len(tails)

def lis_reconstruct(signals: list[int]) -> list[int]:
    n = len(signals)
    tails: list[int] = []
    tail_idx: list[int] = []  # signals index of each tail
    pred = [-1] * n

    for i, x in enumerate(signals):
        pos = bisect.bisect_left(tails, x)
        if pos == len(tails):
            tails.append(x)
            tail_idx.append(i)
        else:
            tails[pos] = x
            tail_idx[pos] = i
        pred[i] = tail_idx[pos - 1] if pos > 0 else -1

    path: list[int] = []
    idx = tail_idx[-1]
    while idx != -1:
        path.append(signals[idx])
        idx = pred[idx]
    return path[::-1]


signals = [3, 1, 4, 1, 5, 9, 2, 6]
print(lis_length(signals))       # 4
print(lis_reconstruct(signals))  # [1, 4, 5, 9] or similar`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 300,
  },
  {
    id: "fin-20260614-b1-segment-tree-pnl",
    title: "Segment Tree for Real-Time Range P&L Queries",
    difficulty: "hard",
    topics: ["Segment Tree", "Data Structures"],
    problem: `A trading system receives n trade P&L entries indexed 0..n-1. Support two operations in O(log n):
1. update(i, val) — set P&L at index i to val
2. query(l, r) -> float — return sum of P&L in half-open range [l, r)

Implement a flat iterative segment tree backed by an array of size 2n (leaves at positions n..2n-1).`,
    examples: [
      {
        input: `st = SegTree(5)\nst.update(2, 10.0)\nst.update(3, -5.0)\nst.query(1, 4)`,
        output: `5.0`,
        explanation: "Indices 1,2,3: 0 + 10 + (-5) = 5.0.",
      },
      {
        input: `st.update(2, 20.0)\nst.query(0, 5)`,
        output: `15.0`,
        explanation: "All five: 20 + (-5) = 15.0.",
      },
    ],
    constraints: [
      "1 <= n <= 10^6",
      "0 <= i < n",
      "Up to 2e5 mixed update/query calls",
    ],
    approach: `Iterative segment tree: store tree[n..2n-1] = leaves. Update: set leaf, propagate up (i >>= 1, tree[i] = tree[2i] + tree[2i+1]). Query [l,r): advance l/r pointers inward — if l is odd include tree[l]; if r is odd decrement then include tree[r]; shift both by 1.`,
    code: `class SegTree:
    def __init__(self, n: int) -> None:
        self.n    = n
        self.tree = [0.0] * (2 * n)

    def update(self, i: int, val: float) -> None:
        i += self.n
        self.tree[i] = val
        while i > 1:
            i >>= 1
            self.tree[i] = self.tree[2 * i] + self.tree[2 * i + 1]

    def query(self, l: int, r: int) -> float:
        res = 0.0
        l += self.n
        r += self.n
        while l < r:
            if l & 1:
                res += self.tree[l]
                l += 1
            if r & 1:
                r -= 1
                res += self.tree[r]
            l >>= 1
            r >>= 1
        return res


pnl = SegTree(5)
pnl.update(2, 10.0)
pnl.update(3, -5.0)
print(pnl.query(1, 4))   # 5.0
pnl.update(2, 20.0)
print(pnl.query(0, 5))   # 15.0`,
    language: "python",
    complexity: { time: "O(log n) per op", space: "O(n)" },
  },
  {
    id: "fin-20260614-b1-cooldown-dp",
    title: "Best Time to Buy and Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["Dynamic Programming", "State Machine"],
    problem: `Given daily stock prices, maximize profit with unlimited trades subject to: after selling you must skip exactly one day (cooldown) before buying again.

LeetCode #309.`,
    examples: [
      {
        input: `prices = [1, 2, 3, 0, 2]`,
        output: `3`,
        explanation: "Buy@1 sell@2, cooldown, buy@0 sell@2. Profit 1+2=3.",
      },
      {
        input: `prices = [1]`,
        output: `0`,
      },
    ],
    constraints: [
      "1 <= prices.length <= 5000",
      "0 <= prices[i] <= 1000",
    ],
    approach: `Three-state DP per day: hold (max profit while holding), sold (just sold — in cooldown), rest (free to buy). Transitions:
  hold' = max(hold, rest - price)
  sold' = hold + price
  rest' = max(rest, sold)
Start: hold=-prices[0], sold=0, rest=0. Answer: max(sold, rest).`,
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    hold = -prices[0]
    sold = 0
    rest = 0
    for price in prices[1:]:
        hold, sold, rest = (
            max(hold, rest - price),
            hold + price,
            max(rest, sold),
        )
    return max(sold, rest)


print(max_profit_cooldown([1, 2, 3, 0, 2]))  # 3
print(max_profit_cooldown([1]))               # 0
print(max_profit_cooldown([2, 1, 4]))         # 3`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260614-b1-trade-fee-dp",
    title: "Best Time to Buy and Sell Stock with Transaction Fee",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Greedy"],
    problem: `Given daily stock prices and a fixed per-trade fee (charged on sell), find the maximum profit with unlimited trades. You may not hold more than one share.

LeetCode #714.`,
    examples: [
      {
        input: `prices = [1, 3, 2, 8, 4, 9], fee = 2`,
        output: `8`,
        explanation: "Buy@1 sell@8 (net 5), buy@4 sell@9 (net 3): total 8.",
      },
      {
        input: `prices = [1, 3, 7, 5, 10, 3], fee = 3`,
        output: `6`,
        explanation: "Buy@1 sell@10 (one trade, net 6).",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5e4",
      "1 <= prices[i] < 5e4",
      "0 <= fee < 5e4",
    ],
    approach: `Two-state DP: cash (no stock) and hold (stock held). Each day: cash = max(cash, hold + price - fee); hold = max(hold, cash - price). Fee deducted on sell. Start: cash=0, hold=-prices[0]. Answer: cash.`,
    code: `def max_profit_with_fee(prices: list[int], fee: int) -> int:
    cash = 0
    hold = -prices[0]
    for price in prices[1:]:
        cash = max(cash, hold + price - fee)
        hold = max(hold, cash - price)
    return cash


print(max_profit_with_fee([1, 3, 2, 8, 4, 9], 2))   # 8
print(max_profit_with_fee([1, 3, 7, 5, 10, 3], 3))  # 6
print(max_profit_with_fee([1, 2, 3], 2))              # 1`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 714,
  },
  {
    id: "fin-20260614-b1-gamblers-ruin",
    title: "Gambler's Ruin — Expected Hitting Time",
    difficulty: "hard",
    topics: ["Math", "Probability", "Dynamic Programming"],
    problem: `A trader starts with k dollars. Each step: gain 1 dollar with probability p, lose 1 with probability q=1-p. She stops at 0 (ruin) or N (target). Compute E[steps to absorption | start=k].

Implement both the closed-form formula and a DP solver (linear system) for verification.`,
    examples: [
      {
        input: `N=10, p=0.5, k=5`,
        output: `25.0`,
        explanation: "Fair walk: E[k] = k*(N-k) = 5*5 = 25.",
      },
      {
        input: `N=6, p=0.6, k=2`,
        output: `approx 4.63`,
        explanation: "Favorable odds shorten expected absorption time.",
      },
    ],
    constraints: [
      "2 <= N <= 10^4",
      "0 < p < 1",
      "1 <= k <= N-1",
    ],
    approach: `Closed form via optional stopping theorem:
- p=0.5: E[k] = k*(N-k)
- p!=0.5: let rho=q/p. E[k] = k/(q-p) - N/(q-p)*(1-rho^k)/(1-rho^N)

DP (tridiagonal): E[i] = 1 + p*E[i+1] + q*E[i-1], E[0]=E[N]=0. Solve (N-1)x(N-1) linear system.`,
    code: `def expected_hitting_time(N: int, p: float, k: int) -> float:
    q = 1.0 - p
    if abs(p - 0.5) < 1e-12:
        return float(k * (N - k))
    rho   = q / p
    rho_k = rho ** k
    rho_N = rho ** N
    return k / (q - p) - N / (q - p) * (1 - rho_k) / (1 - rho_N)

def expected_hitting_time_dp(N: int, p: float, k: int) -> float:
    """Solve via numpy linear system for verification."""
    import numpy as np
    q = 1.0 - p
    # E[i] = 1 + p*E[i+1] + q*E[i-1]  =>  -q*E[i-1] + E[i] - p*E[i+1] = 1
    A = np.zeros((N - 1, N - 1))
    b = np.ones(N - 1)
    for i in range(N - 1):
        A[i, i] = 1.0
        if i > 0:
            A[i, i - 1] = -q
        if i < N - 2:
            A[i, i + 1] = -p
    E = np.linalg.solve(A, b)
    return float(E[k - 1])


print(expected_hitting_time(10, 0.5, 5))    # 25.0
print(expected_hitting_time(6, 0.6, 2))     # approx 4.63
print(expected_hitting_time_dp(10, 0.5, 5)) # 25.0`,
    language: "python",
    complexity: { time: "O(1) formula / O(N^3) DP", space: "O(N) DP" },
  },
  {
    id: "fin-20260614-b1-jump-order-routing",
    title: "Jump Game II — Minimum Order Routing Hops",
    difficulty: "medium",
    topics: ["Greedy", "BFS"],
    problem: `An order router must forward a trade from venue 0 to venue n-1. venues[i] is the maximum number of venues ahead that venue i can directly forward to. Find the minimum number of hops to reach venue n-1. Guaranteed reachable.

LeetCode #45 framed as minimum-latency order routing.`,
    examples: [
      {
        input: `venues = [2, 3, 1, 1, 4]`,
        output: `2`,
        explanation: "0 -> 1 (reach up to 4) -> 4. Two hops.",
      },
      {
        input: `venues = [2, 3, 0, 1, 4]`,
        output: `2`,
        explanation: "0 -> 1 -> 4.",
      },
    ],
    constraints: [
      "1 <= venues.length <= 10^4",
      "0 <= venues[i] <= 1000",
      "Always reachable",
    ],
    approach: `Greedy BFS: track cur_end (boundary of current wave) and farthest (max reach from current wave). When i reaches cur_end, advance to farthest and increment jumps. O(n) time, O(1) space.`,
    code: `def min_hops(venues: list[int]) -> int:
    n = len(venues)
    if n <= 1:
        return 0
    jumps   = 0
    cur_end = 0
    farthest = 0
    for i in range(n - 1):
        farthest = max(farthest, i + venues[i])
        if i == cur_end:
            jumps  += 1
            cur_end = farthest
            if cur_end >= n - 1:
                break
    return jumps


print(min_hops([2, 3, 1, 1, 4]))  # 2
print(min_hops([2, 3, 0, 1, 4]))  # 2
print(min_hops([1, 1, 1, 1]))      # 3`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 45,
  },
  {
    id: "fin-20260614-b1-twap-tracker",
    title: "TWAP Position Tracker",
    difficulty: "medium",
    topics: ["Design", "Simulation"],
    problem: `Design a TwapTracker that tracks (timestamp, price) pairs per symbol and computes the time-weighted average price (TWAP) over a rolling window.

Implement:
- add_price(symbol, ts, price) — record a price observation
- twap(symbol, window) -> float — return TWAP over the last window seconds, where each price is weighted by the time until the next observation (or window end)

Timestamps are non-decreasing per symbol.`,
    examples: [
      {
        input: `t = TwapTracker()\nt.add_price("AAPL", 0.0, 100.0)\nt.add_price("AAPL", 2.0, 110.0)\nt.add_price("AAPL", 5.0, 105.0)\nt.twap("AAPL", 5.0)`,
        output: `106.0`,
        explanation: "Window [0,5]: price 100 held 2s, price 110 held 3s. TWAP = (100*2+110*3)/5 = 106.",
      },
    ],
    constraints: [
      "Timestamps non-decreasing per symbol",
      "window > 0",
      "At least one price per queried symbol",
    ],
    approach: `Per symbol, store a list of (ts, price). On twap(), find the latest ts, discard entries older than (latest - window), compute weighted sum: each consecutive pair (t_i, t_{i+1}) contributes price_i * (t_{i+1} - t_i). Divide by total window elapsed.`,
    code: `from collections import defaultdict

class TwapTracker:
    def __init__(self) -> None:
        self._data: dict[str, list[tuple[float, float]]] = defaultdict(list)

    def add_price(self, symbol: str, ts: float, price: float) -> None:
        self._data[symbol].append((ts, price))

    def twap(self, symbol: str, window: float) -> float:
        series = self._data[symbol]
        if not series:
            return 0.0
        latest  = series[-1][0]
        cutoff  = latest - window
        entries = [(ts, p) for ts, p in series if ts >= cutoff]
        if len(entries) == 1:
            return entries[0][1]
        weighted = 0.0
        total    = 0.0
        for i in range(len(entries) - 1):
            dt = entries[i + 1][0] - entries[i][0]
            weighted += entries[i][1] * dt
            total    += dt
        return weighted / total if total > 0 else entries[-1][1]


t = TwapTracker()
t.add_price("AAPL", 0.0, 100.0)
t.add_price("AAPL", 2.0, 110.0)
t.add_price("AAPL", 5.0, 105.0)
print(t.twap("AAPL", 5.0))  # 106.0`,
    language: "python",
    complexity: { time: "O(n) per query", space: "O(n) total" },
  },
  {
    id: "fin-20260614-b1-min-rebalance",
    title: "Minimum Rebalancing Trades — Two Pointer",
    difficulty: "medium",
    topics: ["Greedy", "Two Pointers", "Sorting"],
    problem: `A portfolio has n assets. current[i] is current shares, target[i] is desired. A trade moves units from an over-weighted asset (excess) to an under-weighted one (deficit). Each trade fully resolves the smaller imbalance and partially the larger. Find the minimum number of trades to reach target.

Assume sum(current) == sum(target) so total units are conserved.`,
    examples: [
      {
        input: `current = [5, 0, 5, 0], target = [2, 3, 2, 3]`,
        output: `2`,
        explanation: "Excess: [3,3]. Deficit: [3,3]. Trade 0→1 (3 units), trade 2→3 (3 units). 2 trades.",
      },
      {
        input: `current = [6, 2, 8, 1], target = [3, 4, 5, 5]`,
        output: `3`,
        explanation: "Excess [3,3] vs deficit [2,4]: trade partially 3 times.",
      },
    ],
    constraints: [
      "1 <= n <= 10^5",
      "0 <= current[i], target[i] <= 10^9",
      "sum(current) == sum(target)",
    ],
    approach: `Compute delta[i] = current[i] - target[i]. Separate into excess[] and deficit[] lists. Two-pointer merge: greedily match front of each list — consume the smaller imbalance fully, carry over remainder in the other. Count one trade per iteration. O(n log n) for sort.`,
    code: `def min_rebalancing_trades(current: list[int], target: list[int]) -> int:
    delta   = [c - t for c, t in zip(current, target)]
    excess  = sorted(d for d in delta if d > 0)
    deficit = sorted(-d for d in delta if d < 0)
    i = j = trades = 0
    while i < len(excess) and j < len(deficit):
        if excess[i] < deficit[j]:
            deficit[j] -= excess[i]
            i += 1
        elif excess[i] > deficit[j]:
            excess[i] -= deficit[j]
            j += 1
        else:
            i += 1
            j += 1
        trades += 1
    return trades


print(min_rebalancing_trades([5, 0, 5, 0], [2, 3, 2, 3]))  # 2
print(min_rebalancing_trades([6, 2, 8, 1], [3, 4, 5, 5]))  # 3
print(min_rebalancing_trades([3, 3, 3], [3, 3, 3]))          # 0`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
];
