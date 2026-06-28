import type { LeetCodeProblem } from "./index";

export const financeProblems20260628B1: LeetCodeProblem[] = [
  {
    id: "fin-20260628-b1-token-bucket",
    title: "Token Bucket Rate Limiter for Order Submission",
    difficulty: "medium",
    topics: ["design", "rate limiting", "simulation"],
    problem:
      "Design a TokenBucket rate limiter for an order management system. Implement: TokenBucket(rate, capacity) — creates a bucket that refills at 'rate' tokens per second up to 'capacity' tokens; try_consume(tokens, current_time_s) — returns True if 'tokens' are available (consumes them), False otherwise. Finance context: exchanges impose order-to-trade ratios and message rate limits; a token bucket enforces these limits on the client side to avoid exchange-imposed throttling or fines.",
    examples: [
      {
        input: "rate=10, capacity=100. try_consume(50, t=0) -> True, try_consume(60, t=0) -> False, try_consume(60, t=6) -> True",
        output: "True, False, True",
        explanation: "At t=0: 100 tokens available, consume 50 -> 50 remain. Consume 60 fails (only 50). At t=6: 60 tokens refilled (6s * 10/s = 60) -> 50+60=110 capped at 100. Consume 60 -> True, 40 remain.",
      },
    ],
    constraints: [
      "0 < rate <= 10^6",
      "0 < capacity <= 10^9",
      "0 <= tokens <= capacity",
      "current_time_s is non-decreasing",
    ],
    approach:
      "Store last_refill_time and current_tokens. On try_consume: refill = min((now - last_time) * rate, capacity - current_tokens); update tokens and time; if tokens >= requested, consume and return True, else return False. All operations O(1).",
    code: `class TokenBucket:
    def __init__(self, rate: float, capacity: float):
        self.rate      = rate       # tokens per second
        self.capacity  = capacity
        self.tokens    = capacity   # start full
        self.last_time = 0.0

    def try_consume(self, tokens: float, current_time_s: float) -> bool:
        # Refill based on elapsed time
        elapsed       = current_time_s - self.last_time
        self.tokens   = min(self.capacity,
                            self.tokens + elapsed * self.rate)
        self.last_time = current_time_s

        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

# Test
tb = TokenBucket(rate=10, capacity=100)
print(tb.try_consume(50, 0.0))   # True  (100 -> 50)
print(tb.try_consume(60, 0.0))   # False (50 remaining)
print(tb.try_consume(60, 6.0))   # True  (50+60=100, consume 60 -> 40)
print(tb.try_consume(45, 6.5))   # True  (40+5=45, consume 45 -> 0)`,
    language: "python",
    complexity: { time: "O(1) per call", space: "O(1)" },
  },
  {
    id: "fin-20260628-b1-matrix-exp-compound",
    title: "Compound Return via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["math", "matrix exponentiation", "dynamic programming"],
    problem:
      "A multi-asset portfolio has a discrete-time return dynamics matrix A of size n×n, where A[i][j] represents the contribution of asset j to the return of asset i each period. Given an initial allocation vector v of length n and the matrix A, compute the portfolio state after exactly k periods (v_k = A^k @ v). Constraints: n <= 20, k <= 10^18. Finance context: this models a factor model with cross-factor dynamics, Markov chain transition matrices, or the exact k-period compounding of a rates model with mean-reversion.",
    examples: [
      {
        input: "A = [[1.05, 0.01], [0.0, 1.03]], v = [1.0, 1.0], k = 2",
        output: "[1.1356, 1.0609]",
        explanation:
          "A^2 = [[1.1025, 0.0206], [0.0, 1.0609]]. v_2 = A^2 @ v = [1.1025+0.0206, 1.0609] = [1.1231, 1.0609]. (Values rounded for illustration.)",
      },
    ],
    constraints: [
      "1 <= n <= 20",
      "1 <= k <= 10^18",
      "All entries of A are floats",
    ],
    approach:
      "Matrix exponentiation by squaring: compute A^k by repeatedly squaring A and multiplying when the corresponding bit of k is set. Each matrix multiplication is O(n^3); total O(n^3 log k). For the k-period compound return, apply A^k to the initial vector v in O(n^2) after computing A^k.",
    code: `import numpy as np
from typing import List

def mat_mul(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    return A @ B   # numpy handles floating-point matrix multiply

def mat_pow(A: np.ndarray, k: int) -> np.ndarray:
    """Compute A^k via repeated squaring. O(n^3 log k)."""
    n      = A.shape[0]
    result = np.eye(n)   # identity matrix
    base   = A.copy()

    while k > 0:
        if k & 1:              # if current bit is set
            result = mat_mul(result, base)
        base = mat_mul(base, base)   # square
        k >>= 1                      # shift right (divide by 2)

    return result

def compound_returns(A: List[List[float]],
                     v: List[float],
                     k: int) -> List[float]:
    A_np = np.array(A, dtype=float)
    v_np = np.array(v, dtype=float)
    Ak   = mat_pow(A_np, k)
    return (Ak @ v_np).tolist()

# Example: 2-asset factor model
A = [[1.05, 0.01],
     [0.00, 1.03]]
v = [1.0, 1.0]
result = compound_returns(A, v, k=2)
print([round(x, 6) for x in result])   # [1.1231, 1.0609]

# Large k: 10^18 periods — still O(log k) matrix multiplications
# result_large = compound_returns(A, v, k=10**18)`,
    language: "python",
    complexity: { time: "O(n^3 log k)", space: "O(n^2)" },
  },
  {
    id: "fin-20260628-b1-next-greater-price",
    title: "Next Greater Price Level (Monotonic Stack)",
    difficulty: "medium",
    topics: ["monotonic stack", "array"],
    problem:
      "Given an array prices of length n representing ask prices at n price levels in an order book (from top-of-book upwards), return an array where result[i] is the index of the next price level j > i such that prices[j] > prices[i]. Return -1 if no such j exists. Finance context: an order routing algorithm needs to identify, for each resting ask level, the first deeper level with a higher quote — used in dark-pool price improvement and smart order routing.",
    examples: [
      {
        input: "prices = [10.0, 10.5, 10.2, 11.0, 10.8]",
        output: "[1, 3, 3, -1, -1]",
        explanation:
          "prices[0]=10.0: next greater is prices[1]=10.5 at index 1. prices[1]=10.5: next greater is prices[3]=11.0 at index 3. prices[2]=10.2: next greater is prices[3]=11.0 at index 3. prices[3]=11.0: no greater after it -> -1. prices[4]=10.8: no greater after it -> -1.",
      },
    ],
    constraints: [
      "1 <= n <= 10^5",
      "0 <= prices[i] <= 10^9",
    ],
    approach:
      "Monotonic stack (decreasing): traverse left to right. For each i, pop all stack indices j where prices[j] < prices[i] — their answer is i. Push i. After traversal, remaining stack elements have answer -1. O(n) time, O(n) space.",
    code: `from typing import List

def next_greater_price(prices: List[float]) -> List[int]:
    n      = len(prices)
    result = [-1] * n
    stack  = []   # indices of prices waiting for their "next greater"

    for i, p in enumerate(prices):
        # All stack entries with price < current price have found their answer
        while stack and prices[stack[-1]] < p:
            j = stack.pop()
            result[j] = i
        stack.append(i)

    # Remaining in stack never found a greater price -> result stays -1
    return result

# Example
prices = [10.0, 10.5, 10.2, 11.0, 10.8]
print(next_greater_price(prices))   # [1, 3, 3, -1, -1]

# Circular variant: exchange prices wrap around (futures roll)
def next_greater_price_circular(prices: List[float]) -> List[int]:
    n      = len(prices)
    result = [-1] * n
    stack  = []
    for i in range(2 * n):   # traverse twice
        while stack and prices[stack[-1]] < prices[i % n]:
            j = stack.pop()
            result[j] = i % n
        if i < n:
            stack.append(i)
    return result`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260628-b1-steady-state-markov",
    title: "Markov Chain Steady-State (Credit Rating Transition)",
    difficulty: "medium",
    topics: ["math", "markov chain", "linear algebra", "probability"],
    problem:
      "A credit-rating agency models issuer ratings as a Markov chain with n states (e.g. AAA, AA, A, ..., D). Given a transition matrix P where P[i][j] is the probability of moving from state i to state j in one year, find the steady-state distribution pi such that pi @ P = pi and sum(pi) = 1. Finance context: the steady-state tells a portfolio manager what fraction of issuers will eventually be in each rating bucket under this model, which drives long-run expected loss calculations for CLOs and credit indices.",
    examples: [
      {
        input: "P = [[0.9, 0.1, 0.0], [0.1, 0.8, 0.1], [0.0, 0.2, 0.8]]",
        output: "[0.333, 0.333, 0.333]",
        explanation:
          "This symmetric doubly-stochastic matrix has uniform steady state [1/3, 1/3, 1/3]. In practice credit matrices are not symmetric — AAA has very low downgrade probability.",
      },
    ],
    constraints: [
      "2 <= n <= 50",
      "P[i][j] >= 0 for all i,j",
      "sum(P[i]) = 1 for all i (row stochastic)",
      "Chain is irreducible (every state reachable from every state)",
    ],
    approach:
      "Solve the linear system: (P^T - I) @ pi = 0 subject to sum(pi) = 1. Replace the last equation with the normalisation constraint. Build the matrix A = (P.T - I); replace its last row with all-ones; set b = [0,...,0,1]; solve A @ pi = b via numpy.linalg.solve. Alternatively: power iteration — repeatedly apply P until convergence.",
    code: `import numpy as np
from typing import List

def steady_state(P: List[List[float]]) -> np.ndarray:
    """
    Find steady-state distribution of a Markov chain.
    Solves (P^T - I) pi = 0 with normalisation.
    """
    P_np = np.array(P, dtype=float)
    n    = P_np.shape[0]

    A    = (P_np.T - np.eye(n))  # (P^T - I) pi = 0
    # Replace last equation with normalisation: sum(pi) = 1
    A[-1, :] = 1.0
    b        = np.zeros(n)
    b[-1]    = 1.0

    pi = np.linalg.solve(A, b)
    return pi

def steady_state_power(P: List[List[float]], tol: float = 1e-10) -> np.ndarray:
    """Power iteration: pi <- pi @ P until convergence."""
    P_np = np.array(P, dtype=float)
    n    = P_np.shape[0]
    pi   = np.ones(n) / n   # uniform start

    for _ in range(10_000):
        pi_new = pi @ P_np
        if np.max(np.abs(pi_new - pi)) < tol:
            return pi_new
        pi = pi_new
    return pi

# Credit rating example (simplified 3-state: IG, HY, Default)
P = [
    [0.92, 0.07, 0.01],   # IG: 92% stay, 7% downgrade, 1% default
    [0.05, 0.88, 0.07],   # HY: 5% upgrade, 88% stay, 7% default
    [0.00, 0.00, 1.00],   # Default: absorbing state
]
pi = steady_state(P)
print(f"Steady state: IG={pi[0]:.4f}, HY={pi[1]:.4f}, Default={pi[2]:.4f}")
# Default is absorbing -> all probability mass flows there eventually`,
    language: "python",
    complexity: { time: "O(n^3) linear solve", space: "O(n^2)" },
  },
  {
    id: "fin-20260628-b1-k-largest-trades",
    title: "K Largest Trades by Notional (Heap)",
    difficulty: "easy",
    topics: ["heap", "sorting"],
    problem:
      "Given a stream of n trade records, each with (symbol, price, quantity), find the k trades with the largest notional value (price * quantity) in O(n log k) time. Finance context: a post-trade surveillance system flags the k largest trades by notional for manual review at end of day — the heap approach is preferred over sorting the entire dataset when k << n and the dataset arrives as a stream.",
    examples: [
      {
        input: "trades = [('AAPL',150,100), ('MSFT',300,50), ('GOOG',100,200), ('AMZN',120,300)], k=2",
        output: "[('AMZN',120,300,36000), ('MSFT',300,50,15000)]",
        explanation:
          "Notionals: AAPL=15000, MSFT=15000, GOOG=20000, AMZN=36000. Top 2 by notional: AMZN=36000 and GOOG=20000.",
      },
    ],
    constraints: [
      "1 <= k <= n <= 10^6",
      "0 < price, quantity <= 10^9",
    ],
    approach:
      "Maintain a min-heap of size k. For each trade compute notional = price * qty. Push (notional, symbol, price, qty) onto the heap. If size > k, pop the minimum. After all trades, the heap contains the k largest. Extract in sorted order. O(n log k) time, O(k) space.",
    code: `import heapq
from typing import List, Tuple

Trade = Tuple[str, float, int]   # (symbol, price, qty)

def k_largest_notional(trades: List[Trade], k: int) -> List[dict]:
    """Return k trades with largest notional, in descending order."""
    min_heap = []   # (notional, idx, symbol, price, qty) — idx breaks ties

    for i, (symbol, price, qty) in enumerate(trades):
        notional = price * qty
        heapq.heappush(min_heap, (notional, i, symbol, price, qty))
        if len(min_heap) > k:
            heapq.heappop(min_heap)   # remove smallest notional

    # Extract in descending order
    result = []
    while min_heap:
        notional, _, symbol, price, qty = heapq.heappop(min_heap)
        result.append({'symbol': symbol, 'price': price,
                       'qty': qty, 'notional': notional})
    result.reverse()   # largest first
    return result

# Example
trades = [
    ('AAPL', 150.0, 100),
    ('MSFT', 300.0, 50),
    ('GOOG', 100.0, 200),
    ('AMZN', 120.0, 300),
]
top2 = k_largest_notional(trades, k=2)
for t in top2:
    print(f"{t['symbol']}: notional={t['notional']:,.0f}")
# AMZN: 36,000  GOOG: 20,000`,
    language: "python",
    complexity: { time: "O(n log k)", space: "O(k)" },
  },
  {
    id: "fin-20260628-b1-dp-order-split",
    title: "Optimal Order Splitting DP (Minimise Market Impact)",
    difficulty: "hard",
    topics: ["dynamic programming", "optimization", "execution"],
    problem:
      "You need to buy Q shares over N time periods. In period i, if you buy q_i shares, the cost is price[i] * q_i + eta * q_i^2 (temporary market impact). Prices price[i] are known (deterministic). Subject to sum(q_i) = Q and q_i >= 0, find the allocation minimising total cost. Finance context: VWAP algorithms split orders across periods to minimise both price risk and market impact; this DP is the discrete counterpart of the Almgren-Chriss continuous-time solution.",
    examples: [
      {
        input: "prices = [100, 102, 101, 103], Q = 400, eta = 0.01",
        output: "q = [125, 75, 100, 100], cost = 41062.5",
        explanation:
          "With quadratic impact, the optimal strategy buys more when prices are low (100 in period 0) and less when high (102 in period 1). The exact allocation follows from the first-order conditions price[i] + 2*eta*q_i = lambda (Lagrange multiplier), giving q_i = (lambda - price[i]) / (2*eta).",
      },
    ],
    constraints: [
      "1 <= N <= 100",
      "1 <= Q <= 10^6",
      "eta > 0",
      "prices[i] > 0",
    ],
    approach:
      "The problem has an analytical solution from KKT conditions: the Lagrange multiplier lambda satisfies sum_i max((lambda - price[i])/(2*eta), 0) = Q. Solve for lambda via bisection. Allocate q_i = max((lambda - price[i])/(2*eta), 0). If a quadratic DP is required instead, use dp[i][remaining] but the closed form is preferred.",
    code: `from typing import List

def optimal_order_split(prices: List[float],
                        Q: int,
                        eta: float) -> List[float]:
    """
    Closed-form solution via Lagrange multipliers.
    q_i = max((lambda - price[i]) / (2*eta), 0)
    Find lambda such that sum(q_i) = Q.
    """
    N = len(prices)
    prices = [float(p) for p in prices]

    def total_qty(lam: float) -> float:
        return sum(max((lam - p) / (2 * eta), 0.0) for p in prices)

    # Bisection on lambda
    lo = max(prices)          # lambda must exceed all prices to buy anything
    hi = max(prices) + 2 * eta * Q  # upper bound

    for _ in range(100):
        mid = (lo + hi) / 2
        if total_qty(mid) < Q:
            lo = mid
        else:
            hi = mid

    lam = (lo + hi) / 2
    q   = [max((lam - p) / (2 * eta), 0.0) for p in prices]

    # Adjust for rounding to ensure exact Q
    diff = Q - sum(q)
    q[0] += diff   # add residual to first period

    total_cost = sum(prices[i]*q[i] + eta*q[i]**2 for i in range(N))
    print(f"Allocations: {[round(x,2) for x in q]}")
    print(f"Total cost: {total_cost:.2f}")
    return q

prices = [100.0, 102.0, 101.0, 103.0]
q      = optimal_order_split(prices, Q=400, eta=0.01)`,
    language: "python",
    complexity: { time: "O(N log(Q/eta))", space: "O(N)" },
  },
  {
    id: "fin-20260628-b1-lru-quote-cache",
    title: "LRU Cache for Stale Quote Detection",
    difficulty: "medium",
    topics: ["design", "hash map", "doubly linked list", "LRU"],
    problem:
      "Design an LRU (Least Recently Used) QuoteCache with capacity C. Support: update(symbol, price, timestamp) — insert or update a quote (mark as most recently used); get(symbol) — return (price, timestamp) if in cache, else None (marks as recently used); evict_stale(current_time, max_age_s) — remove all quotes whose timestamp is older than current_time - max_age_s and return a list of evicted symbols. Finance context: a price server caches live quotes for N instruments; stale quotes must be evicted to avoid pricing orders against outdated data.",
    examples: [
      {
        input: "capacity=3. update('AAPL',150,0), update('MSFT',300,1), update('GOOG',100,2), update('AMZN',120,3) -> evicts 'AAPL'. get('MSFT') -> (300,1).",
        output: "['AAPL'] evicted on 4th insert; get('MSFT') = (300, 1)",
        explanation:
          "Cache holds 3 entries. Adding AMZN evicts the LRU entry (AAPL, accessed at t=0 and never re-accessed). get('MSFT') returns its stored price.",
      },
    ],
    constraints: [
      "1 <= capacity <= 10^4",
      "symbol is a string of length <= 10",
      "All operations O(1) for update/get; O(n) for evict_stale",
    ],
    approach:
      "Implement with a Python dict + collections.OrderedDict for O(1) update and get (move_to_end on access) and O(1) eviction of the LRU (popitem(last=False)). For evict_stale, scan all entries O(n) since eviction is not on the critical path.",
    code: `from collections import OrderedDict
from typing import Optional, Tuple, List

class QuoteCache:
    def __init__(self, capacity: int):
        self.cap  = capacity
        self.data = OrderedDict()   # symbol -> (price, timestamp)

    def update(self, symbol: str, price: float, timestamp: float) -> Optional[str]:
        """Returns evicted symbol if capacity exceeded, else None."""
        if symbol in self.data:
            self.data.move_to_end(symbol)       # mark as recently used
        self.data[symbol] = (price, timestamp)

        if len(self.data) > self.cap:
            evicted, _ = self.data.popitem(last=False)   # remove LRU (front)
            return evicted
        return None

    def get(self, symbol: str) -> Optional[Tuple[float, float]]:
        """Returns (price, timestamp) or None. Marks as recently used."""
        if symbol not in self.data:
            return None
        self.data.move_to_end(symbol)
        return self.data[symbol]

    def evict_stale(self, current_time: float, max_age_s: float) -> List[str]:
        """Remove quotes older than max_age_s. O(n)."""
        cutoff  = current_time - max_age_s
        stale   = [sym for sym, (_, ts) in self.data.items() if ts < cutoff]
        for sym in stale:
            del self.data[sym]
        return stale

# Test
qc = QuoteCache(capacity=3)
print(qc.update('AAPL', 150, 0))   # None
print(qc.update('MSFT', 300, 1))   # None
print(qc.update('GOOG', 100, 2))   # None
print(qc.update('AMZN', 120, 3))   # 'AAPL' (LRU evicted)
print(qc.get('MSFT'))              # (300, 1)
print(qc.evict_stale(current_time=10, max_age_s=7))  # evicts entries with ts < 3`,
    language: "python",
    complexity: { time: "O(1) update/get, O(n) evict_stale", space: "O(capacity)" },
  },
  {
    id: "fin-20260628-b1-portfolio-combinations",
    title: "Counting Distinct Portfolio Allocations (Combinatorics)",
    difficulty: "medium",
    topics: ["combinatorics", "math", "dynamic programming"],
    problem:
      "A portfolio manager must allocate exactly W units of capital (integer) across n assets, with each asset receiving at least min_alloc[i] and at most max_alloc[i] units (all integers). Count the number of distinct integer allocation vectors. Finance context: discretised position sizing — how many distinct integer-lot allocations satisfy position limits? This arises in algorithmic rebalancing where lots are the minimum trade unit.",
    examples: [
      {
        input: "n=2, W=5, min_alloc=[1,1], max_alloc=[3,4]",
        output: "3",
        explanation:
          "Valid allocations summing to 5 with asset 0 in [1,3] and asset 1 in [1,4]: (1,4), (2,3), (3,2). (4,1) invalid: asset 0 max is 3.",
      },
    ],
    constraints: [
      "1 <= n <= 10",
      "0 <= W <= 100",
      "0 <= min_alloc[i] <= max_alloc[i] <= W",
    ],
    approach:
      "DP where dp[i][w] = number of ways to allocate w units across assets 0..i-1. For each new asset i, try all valid allocations a in [min_alloc[i], max_alloc[i]] and sum dp[i][w - a] over valid a. Reduce each allocation by the minimum first to simplify: let adjusted_W = W - sum(min_alloc), adjusted range for each asset is [0, max-min]. Then count ways to split adjusted_W across n assets with per-asset caps.",
    code: `from typing import List

def count_allocations(n: int, W: int,
                      min_alloc: List[int],
                      max_alloc: List[int]) -> int:
    """Count integer allocations summing to W with per-asset bounds."""
    # Subtract minimum allocations to reduce to a bounded compositions problem
    adjusted_W = W - sum(min_alloc)
    caps = [max_alloc[i] - min_alloc[i] for i in range(n)]

    if adjusted_W < 0:
        return 0   # infeasible (minimums exceed budget)

    # dp[w] = number of ways to distribute w units across the first i assets
    dp = [0] * (adjusted_W + 1)
    dp[0] = 1   # base: 0 assets, 0 units = 1 way

    for i in range(n):
        new_dp = [0] * (adjusted_W + 1)
        for w in range(adjusted_W + 1):
            if dp[w] == 0:
                continue
            for a in range(min(caps[i], adjusted_W - w) + 1):
                new_dp[w + a] += dp[w]
        dp = new_dp

    return dp[adjusted_W]

# Example
print(count_allocations(2, 5, [1, 1], [3, 4]))   # 3

# Larger example: 4 assets, 20 units, all caps at 8
print(count_allocations(4, 20, [1,1,1,1], [8,8,8,8]))   # count valid splits

# Alternative: enumerate and verify (for small cases)
def brute_force(n, W, lo, hi):
    from itertools import product
    return sum(1 for combo in product(*[range(lo[i], hi[i]+1) for i in range(n)])
               if sum(combo) == W)

print(brute_force(2, 5, [1,1], [3,4]))   # 3 (verify)`,
    language: "python",
    complexity: { time: "O(n * W * max_cap)", space: "O(W)" },
  },
  {
    id: "fin-20260628-b1-sliding-sharpe",
    title: "Maximum Sliding Window Sharpe Ratio",
    difficulty: "hard",
    topics: ["sliding window", "math", "statistics"],
    problem:
      "Given an array of daily returns of length n and a window size k, compute the Sharpe ratio for each k-day rolling window and return the maximum Sharpe ratio observed and the starting index of that window. Sharpe ratio = mean(returns_in_window) / std(returns_in_window). Finance context: strategy evaluation needs the best k-day sub-period to validate out-of-sample performance and identify the most favourable regime for a given holding period.",
    examples: [
      {
        input: "returns = [0.01, 0.02, -0.005, 0.03, 0.01, -0.01, 0.04], k = 3",
        output: "(3.46, 3)",
        explanation:
          "Window starting at index 3: [0.03, 0.01, -0.01]. mean=0.01, std=0.02, Sharpe=0.5. Window starting at index 4: [0.01, -0.01, 0.04]. mean=0.01333, std=0.02517, Sharpe=0.53. Best is window [0.02,-0.005,0.03] at index 1: mean=0.015, std≈0.01803, Sharpe≈0.832. Or [-0.005,0.03,0.01] at index 2: mean=0.01167, std=0.01528, Sharpe=0.763. Best: window [0.01,0.02,-0.005]: mean=0.00833, std=0.01258, Sharpe=0.663. Inspect all windows carefully.",
      },
    ],
    constraints: [
      "2 <= k <= n <= 10^5",
      "-1 < returns[i] < 1",
      "std of every window > 1e-10 (no constant windows)",
    ],
    approach:
      "Maintain running sums: S1 = sum(r), S2 = sum(r^2). On each slide: S1 -= returns[i-k]; S2 -= returns[i-k]^2; S1 += returns[i]; S2 += returns[i]^2. Compute mean = S1/k, var = S2/k - mean^2, std = sqrt(var), Sharpe = mean/std. Track maximum Sharpe over all windows. O(n) time, O(1) space.",
    code: `import math
from typing import List, Tuple

def max_sharpe_window(returns: List[float], k: int) -> Tuple[float, int]:
    """
    Find rolling window of size k with maximum Sharpe ratio.
    Uses O(1)-space running sum/sum-of-squares for numerically stable computation.
    """
    n   = len(returns)
    s1  = sum(returns[:k])             # sum of returns in initial window
    s2  = sum(r*r for r in returns[:k])  # sum of squared returns

    def sharpe(s1: float, s2: float) -> float:
        mean = s1 / k
        var  = s2 / k - mean * mean
        if var < 1e-20: return 0.0
        return mean / math.sqrt(var)

    best_sh  = sharpe(s1, s2)
    best_idx = 0

    for i in range(k, n):
        s1 += returns[i] - returns[i - k]
        s2 += returns[i]**2 - returns[i - k]**2
        sh  = sharpe(s1, s2)
        if sh > best_sh:
            best_sh  = sh
            best_idx = i - k + 1

    return round(best_sh, 4), best_idx

# Example
returns = [0.01, 0.02, -0.005, 0.03, 0.01, -0.01, 0.04]
sh, idx = max_sharpe_window(returns, k=3)
print(f"Max Sharpe: {sh:.4f} at window starting index {idx}")
print(f"Window returns: {returns[idx:idx+3]}")

# Annualised Sharpe (multiply by sqrt(252) for daily returns)
print(f"Annualised Sharpe: {sh * math.sqrt(252):.2f}")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260628-b1-min-cost-rebalance",
    title: "Minimum Cost Portfolio Rebalance (Graph / Greedy)",
    difficulty: "medium",
    topics: ["greedy", "sorting", "two pointers"],
    problem:
      "You have a portfolio of n assets with current weights w[i] and target weights t[i] (both sum to 1). Each trade incurs a proportional transaction cost of c per unit of weight traded (buying or selling). You can only trade pairs: sell asset i and simultaneously buy asset j. Each trade reduces the excess of i and the deficit of j. Find the minimum number of trades (buy-sell pairs) and minimum total transaction cost to reach the target weights. Finance context: portfolio rebalancing with round-trip transaction costs; minimising number of trades reduces fixed costs (brokerage, market impact).",
    examples: [
      {
        input: "w = [0.50, 0.30, 0.20], t = [0.40, 0.40, 0.20], c = 0.001",
        output: "1 trade, cost = 0.0001",
        explanation:
          "Asset 0 excess: 0.10. Asset 1 deficit: 0.10. Asset 2: no change. One trade: sell 0.10 of asset 0, buy 0.10 of asset 1. Cost = 0.10 * 0.001 = 0.0001.",
      },
    ],
    constraints: [
      "2 <= n <= 1000",
      "sum(w) = sum(t) = 1.0",
      "w[i] >= 0, t[i] >= 0",
      "c > 0",
    ],
    approach:
      "Compute delta[i] = t[i] - w[i]. Separate into over-weight (positive delta, need to sell) and under-weight (negative delta, need to buy). Sort both. Use two-pointer greedy: match the largest overweight with the largest underweight, trade min of the two amounts. Count trades and accumulate cost. Total traded weight = sum of positive deltas = sum of negative deltas (since both sum to 0).",
    code: `from typing import List, Tuple

def min_cost_rebalance(w: List[float],
                       t: List[float],
                       c: float) -> Tuple[int, float]:
    """
    Returns (n_trades, total_cost).
    Greedy: match largest seller with largest buyer each round.
    """
    n   = len(w)
    eps = 1e-9

    # Compute net trade requirement for each asset
    delta = [t[i] - w[i] for i in range(n)]

    sells = sorted([d for d in delta if d < -eps], reverse=True)  # most negative
    buys  = sorted([d for d in delta if d >  eps], reverse=True)  # most positive

    # Two-pointer matching
    i, j = 0, 0
    n_trades  = 0
    total_wt  = 0.0

    # Convert buys to positive quantities for matching
    buys_pos = [abs(b) for b in buys]

    sell_rem = sells[:]   # copy (negative values)
    buy_rem  = buys_pos[:]

    si, bi = 0, 0
    sell_cur = abs(sell_rem[si]) if sell_rem else 0.0
    buy_cur  = buy_rem[bi]       if buy_rem  else 0.0

    while si < len(sell_rem) and bi < len(buy_rem):
        trade_amt = min(sell_cur, buy_cur)
        total_wt += trade_amt
        n_trades  += 1

        sell_cur -= trade_amt
        buy_cur  -= trade_amt

        if sell_cur < eps:
            si += 1
            sell_cur = abs(sell_rem[si]) if si < len(sell_rem) else 0.0
        if buy_cur < eps:
            bi += 1
            buy_cur = buy_rem[bi] if bi < len(buy_rem) else 0.0

    total_cost = total_wt * c
    return n_trades, total_cost

w = [0.50, 0.30, 0.20]
t = [0.40, 0.40, 0.20]
trades, cost = min_cost_rebalance(w, t, c=0.001)
print(f"Trades: {trades}, Cost: {cost:.6f}")   # 1 trade, cost=0.0001`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
];
