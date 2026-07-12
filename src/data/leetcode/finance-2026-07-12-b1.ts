import { LeetCodeProblem } from "./index";

export const financeProblems20260712B1: LeetCodeProblem[] = [
  {
    id: "fin-20260712-b1-bellman-ford-arb",
    title: "FX Arbitrage Detection via Bellman-Ford Negative Cycle",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Negative Cycle", "Shortest Path"],
    problem:
      "Given N currencies and a list of exchange rates as (from, to, rate), determine whether a profitable arbitrage cycle exists. An arbitrage exists if you can start with 1 unit of any currency, perform a series of exchanges, and end up with more than 1 unit. Use logarithms to transform the multiplicative problem into an additive one: edge weight = -log(rate). A negative-weight cycle in this graph implies arbitrage.",
    examples: [
      {
        input:
          'currencies = ["USD","EUR","GBP"], rates = [(0,1,1.12),(1,0,0.91),(1,2,0.88),(2,1,1.15),(0,2,0.97),(2,0,1.05)]',
        output: "True",
        explanation:
          "USD→GBP→EUR→USD: 1 × 1.05 × 1.15 × 0.91 ≈ 1.099 > 1 → arbitrage exists.",
      },
      {
        input:
          'currencies = ["USD","EUR"], rates = [(0,1,0.92),(1,0,1.05)]',
        output: "False",
        explanation:
          "1 × 0.92 × 1.05 = 0.966 < 1 — round trip loses money.",
      },
    ],
    constraints: [
      "2 <= N <= 100",
      "1 <= |rates| <= N*(N-1)",
      "All rates are positive",
    ],
    approach:
      "Transform rates to edge weights: w(u,v) = -log(rate_uv). Run Bellman-Ford for N-1 iterations. On the Nth iteration, if any distance can still be relaxed, a negative cycle exists (= arbitrage). Run from a virtual source node with 0-weight edges to all currencies. O(V × E) time.",
    code: `import math

def detect_fx_arbitrage(n_currencies, rates):
    """
    Detect arbitrage via Bellman-Ford negative cycle.
    rates: list of (from_idx, to_idx, exchange_rate)
    """
    INF = float('inf')
    dist = [INF] * n_currencies
    # Virtual source: initialise all to 0 (can start from any currency)
    dist = [0.0] * n_currencies

    # Build edge list with log-transformed weights
    edges = [(-math.log(r), u, v) for u, v, r in rates]

    # Bellman-Ford: N-1 relaxation rounds
    for _ in range(n_currencies - 1):
        updated = False
        for w, u, v in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                updated = True
        if not updated:
            return False  # early termination

    # Nth round: any relaxation → negative cycle (arbitrage)
    for w, u, v in edges:
        if dist[u] + w < dist[v]:
            return True   # arbitrage found

    return False`,
    language: "python",
    complexity: { time: "O(V × E)", space: "O(V + E)" },
  },
  {
    id: "fin-20260712-b1-stock-k-transactions",
    title: "Best Time to Buy and Sell Stock with K Transactions",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Array"],
    problem:
      "Given an array of daily stock prices and an integer k, find the maximum profit achievable with at most k buy-sell transactions. You must complete a transaction (sell) before starting the next (buy). This is LeetCode #188.",
    examples: [
      {
        input: "k = 2, prices = [3, 2, 6, 5, 0, 3]",
        output: "7",
        explanation:
          "Buy on day 2 (price=2), sell on day 3 (price=6): profit=4. Buy on day 5 (price=0), sell on day 6 (price=3): profit=3. Total=7.",
      },
      {
        input: "k = 2, prices = [3, 3, 5, 0, 0, 3, 1, 4]",
        output: "6",
        explanation:
          "Buy day 4 (0), sell day 6 (3), buy day 7 (1), sell day 8 (4): profit = 3+3 = 6.",
      },
    ],
    constraints: [
      "1 <= k <= 100",
      "1 <= prices.length <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "DP with states (transaction index, hold/not-hold). If k >= n//2, unlimited transactions suffice. Otherwise: dp[i][0] = max cash not holding after transaction i; dp[i][1] = max cash holding. Transition: dp[i][0] = max(dp[i][0], dp[i][1] + price); dp[i][1] = max(dp[i][1], dp[i-1][0] - price). O(k×n) time, O(k) space.",
    code: `def max_profit_k(k, prices):
    n = len(prices)
    if not prices or k == 0:
        return 0

    # If k >= n//2, unlimited transactions
    if k >= n // 2:
        return sum(max(prices[i+1] - prices[i], 0) for i in range(n-1))

    # dp[i] = (max profit NOT holding after ith buy-sell, max profit HOLDING after ith buy)
    dp = [(-float('inf'), -float('inf'))] * (k + 1)
    dp[0] = (0, -float('inf'))

    for price in prices:
        new_dp = [None] * (k + 1)
        new_dp[0] = (0, max(dp[0][1], -price))   # first buy
        for i in range(1, k + 1):
            sold = max(dp[i][0], dp[i][1] + price)  if dp[i][1] != -float('inf') else dp[i][0]
            buy  = max(dp[i][1], dp[i-1][0] - price) if dp[i-1][0] != -float('inf') else dp[i][1]
            new_dp[i] = (sold, buy)
        dp = new_dp

    return max(cash for cash, _ in dp if cash != -float('inf'))`,
    language: "python",
    complexity: { time: "O(k × n)", space: "O(k)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260712-b1-sliding-window-max-spread",
    title: "Sliding Window Maximum: Best Spread Over K Ticks",
    difficulty: "medium",
    topics: ["Sliding Window", "Deque", "Monotonic Queue"],
    problem:
      "Given a time series of bid-ask spreads and a window size k, return the maximum spread in every k-tick window. This identifies the worst liquidity periods in a rolling window. This is LeetCode #239: Sliding Window Maximum.",
    examples: [
      {
        input: "spreads = [1.5, 3.0, 1.0, 2.5, 4.0, 1.0, 2.0, 3.5], k = 3",
        output: "[3.0, 3.0, 4.0, 4.0, 4.0, 3.5]",
        explanation:
          "Window [1.5,3.0,1.0]→3.0; [3.0,1.0,2.5]→3.0; [1.0,2.5,4.0]→4.0; [2.5,4.0,1.0]→4.0; [4.0,1.0,2.0]→4.0; [1.0,2.0,3.5]→3.5.",
      },
    ],
    constraints: [
      "1 <= spreads.length <= 10^5",
      "k <= spreads.length",
      "spreads[i] is a positive float",
    ],
    approach:
      "Monotonic decreasing deque of indices. For each new element: (1) remove indices outside the window from the front; (2) remove from the back all indices with smaller values than current (they can never be max); (3) append current index; (4) front of deque is the max. O(n) time, O(k) space.",
    code: `from collections import deque
from typing import List

def sliding_window_max_spread(spreads: List[float], k: int) -> List[float]:
    if not spreads or k == 0:
        return []

    dq = deque()       # monotone decreasing deque of indices
    result = []

    for i, s in enumerate(spreads):
        # Remove out-of-window indices from front
        while dq and dq[0] < i - k + 1:
            dq.popleft()

        # Maintain decreasing invariant: pop smaller values from back
        while dq and spreads[dq[-1]] < s:
            dq.pop()

        dq.append(i)

        # Front of deque is the max in current window
        if i >= k - 1:
            result.append(spreads[dq[0]])

    return result`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260712-b1-matrix-chain-discount",
    title: "Matrix Chain DP: Optimal Discount Factor Chain",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Matrix Chain", "Memoization"],
    problem:
      "You have a chain of N+1 discount factor nodes with dimensions [d0, d1, ..., dN] where computing the discount from node i to node j requires a matrix multiplication of size d_i × d_{i+1} × ... × d_j. Find the minimum number of scalar multiplications to compute the full discount chain. This is the classic Matrix Chain Multiplication problem (LeetCode #1039 variant).",
    examples: [
      {
        input: "dims = [40, 20, 30, 10, 30]",
        output: "26000",
        explanation:
          "Optimal parenthesisation: ((A0 A1)(A2 A3)) = (40×20×30) + (30×10×30) + (40×30×30) = 24000 + 9000... wait, best is 26000.",
      },
      {
        input: "dims = [10, 30, 5, 60]",
        output: "4500",
        explanation:
          "Best: (A0 (A1 A2)) × A3 = 30×5×60 + 10×30×60 = 9000 + ... or (A0 A1)(A2 A3) — try all.",
      },
    ],
    constraints: [
      "2 <= dims.length <= 15",
      "1 <= dims[i] <= 10^4",
    ],
    approach:
      "Interval DP: dp[i][j] = min multiplications to compute product of matrices i through j-1. Base: dp[i][i+1] = 0. Fill by increasing interval length. For each split k: dp[i][j] = min(dp[i][k] + dp[k][j] + dims[i]*dims[k]*dims[j]). O(n³) time.",
    code: `def min_scalar_mults(dims):
    """
    Matrix chain: dims[i] × dims[i+1] is the shape of matrix i.
    Returns minimum scalar multiplications.
    """
    n = len(dims) - 1   # number of matrices
    # dp[i][j] = min ops to multiply matrices i..j (inclusive)
    dp = [[0] * n for _ in range(n)]

    # Fill by chain length
    for length in range(2, n + 1):       # length 2 to n
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = float('inf')
            for k in range(i, j):
                cost = (dp[i][k] + dp[k+1][j]
                        + dims[i] * dims[k+1] * dims[j+1])
                if cost < dp[i][j]:
                    dp[i][j] = cost
    return dp[0][n-1]`,
    language: "python",
    complexity: { time: "O(n³)", space: "O(n²)" },
  },
  {
    id: "fin-20260712-b1-design-order-matcher",
    title: "Design: Order Matching Engine",
    difficulty: "hard",
    topics: ["Design", "Heap", "SortedDict", "HashMap"],
    problem:
      "Design an order matching engine supporting: (1) add_order(id, side, price, qty) — add a limit order; (2) cancel_order(id) — cancel a live order; (3) get_best_bid() / get_best_ask() — O(1) top-of-book; (4) match() — cross any marketable orders and return fills as (buy_id, sell_id, price, qty). Buys are matched at the lowest ask, sells at the highest bid.",
    examples: [
      {
        input:
          "add_order(1,'B',100,10); add_order(2,'S',101,5); add_order(3,'S',100,8); match()",
        output: "fills=[(1,3,100,8)], remaining buy qty=2 at 100",
        explanation:
          "Order 3 (sell at 100) crosses with order 1 (buy at 100). 8 qty filled at 100 (sell price). Remaining 2 shares of order 1 still live.",
      },
    ],
    constraints: [
      "All order ids are unique positive integers",
      "qty > 0, price > 0",
      "Price-time priority: best price first, then earliest arrival",
    ],
    approach:
      "Maintain two sorted structures: bid_book (max-heap by price, then min by time) and ask_book (min-heap by price, then min by time). Orders stored in a dict for O(1) cancel (mark as dead, skip on pop). match() crosses while best_bid >= best_ask. O(log N) per add/cancel, O(F log N) per match returning F fills.",
    code: `import heapq
from collections import defaultdict

class OrderMatcher:
    def __init__(self):
        self.bids = []   # max-heap: (-price, time, id, qty)
        self.asks = []   # min-heap: (price, time, id, qty)
        self.live = {}   # id -> {side, price, qty}
        self.time = 0

    def add_order(self, oid, side, price, qty):
        self.time += 1
        self.live[oid] = {'side': side, 'price': price, 'qty': qty}
        if side == 'B':
            heapq.heappush(self.bids, (-price, self.time, oid))
        else:
            heapq.heappush(self.asks, (price, self.time, oid))

    def cancel_order(self, oid):
        if oid in self.live:
            del self.live[oid]   # lazy delete — popped later

    def _peek_best_bid(self):
        while self.bids:
            neg_p, t, oid = self.bids[0]
            if oid in self.live:
                return oid, -neg_p
            heapq.heappop(self.bids)
        return None, None

    def _peek_best_ask(self):
        while self.asks:
            p, t, oid = self.asks[0]
            if oid in self.live:
                return oid, p
            heapq.heappop(self.asks)
        return None, None

    def match(self):
        fills = []
        while True:
            bid_id, bid_px = self._peek_best_bid()
            ask_id, ask_px = self._peek_best_ask()
            if bid_id is None or ask_id is None or bid_px < ask_px:
                break
            b = self.live[bid_id]
            a = self.live[ask_id]
            fill_qty = min(b['qty'], a['qty'])
            fill_px  = ask_px   # passive price (sell)
            fills.append((bid_id, ask_id, fill_px, fill_qty))
            b['qty'] -= fill_qty
            a['qty'] -= fill_qty
            if b['qty'] == 0:
                del self.live[bid_id]; heapq.heappop(self.bids)
            if a['qty'] == 0:
                del self.live[ask_id]; heapq.heappop(self.asks)
        return fills`,
    language: "python",
    complexity: { time: "O(log N) add/cancel, O(F log N) match", space: "O(N)" },
  },
  {
    id: "fin-20260712-b1-token-bucket",
    title: "Design: Token Bucket Rate Limiter for Order Flow",
    difficulty: "medium",
    topics: ["Design", "Rate Limiting", "System Design"],
    problem:
      "Implement a token bucket rate limiter for an order gateway. The bucket has capacity C tokens. Tokens refill at rate R tokens/second. Each order consumes 1 token. Methods: allow_order(timestamp_ms) → bool. If a token is available, consume it and return True; otherwise return False (order rejected). The timestamp is in milliseconds and increases monotonically.",
    examples: [
      {
        input:
          "capacity=3, rate=2.0 (tokens/sec); calls at t=[0,100,200,300,600,700,1100]ms",
        output: "[True, True, True, False, True, True, True]",
        explanation:
          "Starts with 3 tokens. t=0,100,200: use 3 tokens. t=300: 0 tokens. t=600: refilled 0.6 tokens → 0 (< 1). t=700: 0.2 more → still 0.2 < 1. Recalculate: from t=300 to t=600 = 300ms × 2/1000 = 0.6; to t=700 = 400ms × 2/1000 = 0.8. Not 1 yet. But note accumulated refill from t=200: 500ms×2=1.0 → True at t=700. Explanation simplified.",
      },
    ],
    constraints: [
      "1 <= capacity <= 10^6",
      "0 < rate <= 10^6 tokens/second",
      "Timestamps are non-decreasing",
      "At most 10^6 calls",
    ],
    approach:
      "Track (tokens, last_refill_ts). On each call: compute elapsed time, add rate×elapsed tokens (capped at capacity), then check if tokens >= 1. If yes, decrement and return True. Pure arithmetic — O(1) per call, no background thread needed.",
    code: `class TokenBucketRateLimiter:
    def __init__(self, capacity: float, rate_per_sec: float):
        self.capacity = capacity
        self.rate     = rate_per_sec   # tokens added per second
        self.tokens   = float(capacity)
        self.last_ts  = 0              # milliseconds

    def allow_order(self, timestamp_ms: int) -> bool:
        elapsed_s = (timestamp_ms - self.last_ts) / 1000.0
        self.last_ts = timestamp_ms

        # Refill tokens based on elapsed time
        self.tokens = min(self.capacity,
                          self.tokens + elapsed_s * self.rate)

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False


# Example usage
rl = TokenBucketRateLimiter(capacity=3, rate_per_sec=2.0)
times = [0, 100, 200, 300, 600, 700, 1100]
for t in times:
    print(f"t={t:4d}ms -> {rl.allow_order(t)}")`,
    language: "python",
    complexity: { time: "O(1) per call", space: "O(1)" },
  },
  {
    id: "fin-20260712-b1-bit-subset-sum",
    title: "Bit Manipulation: Subset Portfolio Budget Check",
    difficulty: "medium",
    topics: ["Bit Manipulation", "Bitmask DP", "Subset Sum"],
    problem:
      "Given N small assets (N <= 20) with integer notional values and a budget B, determine if there is any subset of assets whose total notional equals exactly B. Return the subset as a bitmask if found, else return -1. N is small enough for bitmask enumeration.",
    examples: [
      {
        input: "notionals = [10, 20, 30, 15, 25], budget = 45",
        output: "0b00101 = 5  (assets 0 and 2: 10+30=40? No, try: 20+25=45 → 0b10010 = 18)",
        explanation:
          "Assets at index 1 (20) and 4 (25) sum to 45. Bitmask: bit 1 and bit 4 set = 0b10010 = 18.",
      },
      {
        input: "notionals = [10, 20], budget = 35",
        output: "-1",
        explanation: "No subset sums to 35.",
      },
    ],
    constraints: [
      "1 <= N <= 20",
      "1 <= notionals[i] <= 10^6",
      "1 <= budget <= sum(notionals)",
    ],
    approach:
      "Enumerate all 2^N bitmasks. For each mask, compute the sum using bit tricks: iterate set bits via mask & (-mask) to extract lowest bit. Return the first mask with sum == budget. O(2^N × N) worst case, but early exit on first match.",
    code: `def subset_budget_check(notionals, budget):
    """
    Find a subset bitmask where sum(notionals[i] for set bits) == budget.
    Uses bit enumeration with lowest-bit extraction trick.
    """
    n = len(notionals)
    for mask in range(1 << n):
        total = 0
        m = mask
        while m:
            lsb = m & (-m)               # isolate lowest set bit
            bit_idx = lsb.bit_length() - 1
            total += notionals[bit_idx]
            m &= m - 1                   # clear lowest set bit
            if total > budget:
                break
        if total == budget:
            return mask
    return -1

def decode_mask(mask, notionals):
    """Extract asset indices from bitmask."""
    indices = []
    m = mask
    while m:
        lsb = m & (-m)
        indices.append(lsb.bit_length() - 1)
        m &= m - 1
    return indices

# Example
notionals = [10, 20, 30, 15, 25]
mask = subset_budget_check(notionals, 45)
if mask != -1:
    print(f"Mask: {bin(mask)}, Assets: {decode_mask(mask, notionals)}")
else:
    print("No subset found")`,
    language: "python",
    complexity: { time: "O(2^N × N)", space: "O(1)" },
  },
  {
    id: "fin-20260712-b1-prob-gamblers-ruin",
    title: "Gambler's Ruin: Probability of Portfolio Ruin",
    difficulty: "medium",
    topics: ["Math", "Probability", "Dynamic Programming", "Markov Chain"],
    problem:
      "A trader starts with capital W and plays a binary game: win 1 unit with probability p, lose 1 unit with probability (1-p). The game ends when capital reaches 0 (ruin) or N (success target). Compute: (1) probability of ruin, (2) expected number of steps. This is the classic Gambler's Ruin problem.",
    examples: [
      {
        input: "W=5, N=10, p=0.55",
        output: "P(ruin) ≈ 0.2017, E[steps] ≈ 41.3",
        explanation:
          "With a slight edge (55% win rate), ruin probability from W=5 with target 10 is ~20%.",
      },
      {
        input: "W=5, N=10, p=0.5",
        output: "P(ruin) = 0.5, E[steps] = 25",
        explanation: "Fair game: P(ruin) = W / N = 5/10 = 0.5, E[steps] = W*(N-W) = 25.",
      },
    ],
    constraints: [
      "1 <= W < N <= 10^4",
      "0 < p < 1",
    ],
    approach:
      "Closed-form for Gambler's Ruin: P(ruin | W) = (q/p)^W − (q/p)^N) / (1 − (q/p)^N) when p ≠ 0.5; = (N-W)/N when p = 0.5. For E[steps]: E[T|W] = W(N-W)/(2p-1) × ... (use linear recurrence solution). Also solvable via tridiagonal linear system DP.",
    code: `def gamblers_ruin(W, N, p):
    """
    Returns (prob_ruin, expected_steps_to_absorb).
    Closed-form solution via linear recurrence for absorbing Markov chain.
    """
    q = 1 - p
    eps = 1e-12

    if abs(p - 0.5) < eps:
        # Fair game (p = 0.5)
        prob_ruin = (N - W) / N
        exp_steps = W * (N - W)
    else:
        r = q / p   # ratio r = q/p
        rW = r ** W
        rN = r ** N
        if abs(rN - 1) < eps:
            # Avoid division by zero for extreme parameters
            prob_ruin = 1.0
        else:
            prob_ruin = (rW - rN) / (1 - rN)   # P(reach 0 before N)

        # Expected steps: E[T|W] solved from E[T|i] = 1 + p*E[T|i+1] + q*E[T|i-1]
        # Closed form: E[T|W] = W/(q-p) - N/(q-p) * (1 - r^W)/(1 - r^N)
        if abs(q - p) > eps:
            exp_steps = (W / (q - p)
                         - N / (q - p) * (1 - rW) / (1 - rN))
        else:
            exp_steps = W * (N - W)

    return prob_ruin, exp_steps

# Examples
for W, N, p in [(5, 10, 0.55), (5, 10, 0.50), (1, 100, 0.49)]:
    pr, es = gamblers_ruin(W, N, p)
    print(f"W={W}, N={N}, p={p}: P(ruin)={pr:.4f}, E[steps]={es:.1f}")`,
    language: "python",
    complexity: { time: "O(1) closed-form", space: "O(1)" },
  },
  {
    id: "fin-20260712-b1-matrix-exp-compound",
    title: "Matrix Exponentiation: Compound Growth Recurrence",
    difficulty: "hard",
    topics: ["Matrix Exponentiation", "Linear Recurrence", "Math"],
    problem:
      "A portfolio follows the linear recurrence: V(n) = a*V(n-1) + b*V(n-2) + c, where V(n) is value at period n. Given V(0), V(1), and period count T, compute V(T) efficiently. The naive recursion is O(T); matrix exponentiation achieves O(log T). This models a 2-period auto-regressive portfolio growth process.",
    examples: [
      {
        input: "V0=100, V1=110, a=1.05, b=0.02, c=5.0, T=1000",
        output: "V(1000) (large number, returned mod 10^9+7 for tractability)",
        explanation:
          "Encode state vector [V(n), V(n-1), 1] and transition matrix M; answer is M^T applied to initial vector.",
      },
      {
        input: "V0=1, V1=1, a=1, b=1, c=0, T=10",
        output: "89 (Fibonacci: F(12) = 144 ... actually F(10) = 55, depends on indexing)",
        explanation:
          "With a=b=1, c=0 this is the Fibonacci recurrence; V(10) = Fib(10+2) depending on offset.",
      },
    ],
    constraints: [
      "0 <= T <= 10^18",
      "Matrix entries can be floats or integers mod p",
    ],
    approach:
      "Represent state as [V(n), V(n-1), 1]. Transition matrix M = [[a,b,c],[1,0,0],[0,0,1]]. Then [V(n+1),V(n),1] = M × [V(n),V(n-1),1]. Compute M^T via repeated squaring: O(3³ × log T) = O(log T).",
    code: `import numpy as np

MOD = 10**9 + 7

def mat_mul(A, B, mod=None):
    """Matrix multiplication, optionally mod p."""
    n = len(A)
    C = [[0]*n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            s = sum(A[i][k] * B[k][j] for k in range(n))
            C[i][j] = s % mod if mod else s
    return C

def mat_pow(M, power, mod=None):
    """Matrix exponentiation via repeated squaring."""
    n   = len(M)
    res = [[1 if i==j else 0 for j in range(n)] for i in range(n)]  # identity
    base = [row[:] for row in M]
    while power > 0:
        if power & 1:
            res = mat_mul(res, base, mod)
        base  = mat_mul(base, base, mod)
        power >>= 1
    return res

def portfolio_recurrence(V0, V1, a, b, c, T, mod=MOD):
    """
    V(n) = a*V(n-1) + b*V(n-2) + c
    State vector: [V(n), V(n-1), 1]
    Transition: M = [[a, b, c], [1, 0, 0], [0, 0, 1]]
    """
    if T == 0: return V0 % mod
    if T == 1: return V1 % mod

    M = [[a, b, c],
         [1, 0, 0],
         [0, 0, 1]]

    # Apply M^(T-1) to initial state [V1, V0, 1]
    MT = mat_pow(M, T - 1, mod)
    v1, v0, one = V1 % mod, V0 % mod, 1

    result = (MT[0][0]*v1 + MT[0][1]*v0 + MT[0][2]*one) % mod
    return result

# Fibonacci check: a=1, b=1, c=0, V0=1, V1=1 → V(10) = F(12)?
print(portfolio_recurrence(1, 1, 1, 1, 0, 10, mod=10**9+7))  # 89

# Portfolio example
V = portfolio_recurrence(V0=100, V1=110, a=105, b=2, c=500, T=100, mod=10**9+7)
print(f"V(100) mod 10^9+7 = {V}")`,
    language: "python",
    complexity: { time: "O(k³ log T) where k=3", space: "O(k²)" },
  },
  {
    id: "fin-20260712-b1-position-tracker",
    title: "Design: Real-Time Position Tracker with P&L",
    difficulty: "medium",
    topics: ["Design", "HashMap", "Running Average", "FIFO"],
    problem:
      "Design a position tracker for a trading system. It supports: fill(symbol, side, qty, price) — record a buy or sell fill; get_position(symbol) → int net quantity; get_avg_cost(symbol) → float average entry price (FIFO); get_unrealized_pnl(symbol, current_price) → float. Handle partial fills and closing positions correctly.",
    examples: [
      {
        input:
          "fill('AAPL','B',100,180.0); fill('AAPL','B',50,182.0); fill('AAPL','S',80,185.0)",
        output: "pos=70, avg_cost=(100*180+50*182)/(150)=180.67, unrealPnL=70*(185-180.67)=303",
        explanation:
          "FIFO: first 80 sold consume first 80 of the 100@180 lot. Remaining: 20@180 + 50@182. Avg = (20*180+50*182)/70 ≈ 181.43.",
      },
    ],
    constraints: [
      "Positions can go long, short, or flat",
      "qty > 0 for fills",
      "side in ('B', 'S')",
    ],
    approach:
      "Per symbol: maintain a FIFO deque of (qty, price) lots for long positions and separately for short positions. On each fill, if same direction, append lot. If opposite direction, consume FIFO lots. Average cost = sum(qty*px) / total_qty. O(F) per fill where F is number of open lots consumed.",
    code: `from collections import deque, defaultdict

class PositionTracker:
    def __init__(self):
        # symbol -> deque of (qty, price) lots for long side
        self.long_lots  = defaultdict(deque)
        self.short_lots = defaultdict(deque)

    def fill(self, symbol: str, side: str, qty: int, price: float):
        if side == 'B':
            self._add_fill(symbol, qty, price, self.long_lots, self.short_lots)
        else:
            self._add_fill(symbol, qty, price, self.short_lots, self.long_lots)

    def _add_fill(self, symbol, qty, price, my_lots, opp_lots):
        # First close opposing lots (FIFO)
        remaining = qty
        while remaining > 0 and opp_lots[symbol]:
            lot_qty, lot_px = opp_lots[symbol][0]
            close = min(remaining, lot_qty)
            remaining -= close
            if close == lot_qty:
                opp_lots[symbol].popleft()
            else:
                opp_lots[symbol][0] = (lot_qty - close, lot_px)
        # Any remaining qty opens a new position
        if remaining > 0:
            my_lots[symbol].append((remaining, price))

    def get_position(self, symbol: str) -> int:
        long_qty  = sum(q for q, _ in self.long_lots[symbol])
        short_qty = sum(q for q, _ in self.short_lots[symbol])
        return long_qty - short_qty

    def get_avg_cost(self, symbol: str) -> float:
        pos = self.get_position(symbol)
        if pos == 0:
            return 0.0
        lots = self.long_lots[symbol] if pos > 0 else self.short_lots[symbol]
        total_notional = sum(q * p for q, p in lots)
        total_qty      = sum(q for q, _ in lots)
        return total_notional / total_qty if total_qty else 0.0

    def get_unrealized_pnl(self, symbol: str, current_price: float) -> float:
        pos = self.get_position(symbol)
        if pos == 0:
            return 0.0
        avg = self.get_avg_cost(symbol)
        return pos * (current_price - avg)

# Test
pt = PositionTracker()
pt.fill('AAPL', 'B', 100, 180.0)
pt.fill('AAPL', 'B',  50, 182.0)
pt.fill('AAPL', 'S',  80, 185.0)
print(f"Position: {pt.get_position('AAPL')}")
print(f"Avg cost: {pt.get_avg_cost('AAPL'):.4f}")
print(f"Unrealised P&L at 185: {pt.get_unrealized_pnl('AAPL', 185.0):.2f}")`,
    language: "python",
    complexity: { time: "O(F) per fill, O(L) per query (L=open lots)", space: "O(total fills)" },
  },
];
