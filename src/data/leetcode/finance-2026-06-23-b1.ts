import type { LeetCodeProblem } from "./index";

export const financeProblems20260623B1: LeetCodeProblem[] = [
  {
    id: "fin-20260623-b1-sliding-window-max",
    title: "Rolling Maximum Price (Sliding Window Maximum)",
    difficulty: "hard",
    topics: ["monotonic-deque", "sliding-window"],
    problem: `Given an array \`prices\` representing daily asset prices and an integer \`k\` (window size), return an array of the rolling k-day maximum price.

This models the concept of a *resistance level*: the highest price observed in the past k days that a trader would need to break to confirm an uptrend.

Return an array of length \`len(prices) - k + 1\`, where each element is the max price in the window ending at that index.`,
    examples: [
      {
        input: "prices = [1, 3, -1, -3, 5, 3, 6, 7], k = 3",
        output: "[3, 3, 5, 5, 6, 7]",
        explanation: "Windows: [1,3,-1]→3, [3,-1,-3]→3, [-1,-3,5]→5, [-3,5,3]→5, [5,3,6]→6, [3,6,7]→7.",
      },
      {
        input: "prices = [5, 5, 5], k = 2",
        output: "[5, 5]",
        explanation: "All windows have max 5.",
      },
    ],
    constraints: [
      "1 <= k <= len(prices) <= 10^5",
      "-10^4 <= prices[i] <= 10^4",
    ],
    approach: "Monotonic deque: maintain a deque of indices with decreasing prices. For each new price: (1) Pop from front if index is outside the window. (2) Pop from back while back's price <= current price. (3) Append current index. (4) Front of deque is the window max. O(N) time, O(k) space.",
    code: `from collections import deque

def rolling_max(prices: list[int], k: int) -> list[int]:
    """
    Monotonic deque of indices (front = max, decreasing prices back-to-front).
    Each index enters and exits the deque at most once: O(N) total.
    """
    dq: deque[int] = deque()   # stores indices; prices are decreasing front→back
    result: list[int] = []

    for i, price in enumerate(prices):
        # Remove indices outside the window [i-k+1, i]
        while dq and dq[0] < i - k + 1:
            dq.popleft()

        # Maintain monotone decreasing: pop indices with smaller prices
        while dq and prices[dq[-1]] <= price:
            dq.pop()

        dq.append(i)

        # Window complete from index k-1 onward
        if i >= k - 1:
            result.append(prices[dq[0]])

    return result`,
    language: "python",
    complexity: { time: "O(N)", space: "O(k)" },
  },
  {
    id: "fin-20260623-b1-knapsack-portfolio",
    title: "Portfolio Allocation via 0/1 Knapsack",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack"],
    problem: `You have a budget of \`B\` dollars (integer) and \`n\` assets. Asset \`i\` costs \`costs[i]\` dollars (integer) and has expected return \`returns[i]\` (float). You may invest in each asset at most once (binary allocation).

Find the maximum total expected return achievable without exceeding the budget. Return the maximum total return and the set of selected assets.`,
    examples: [
      {
        input: "B=10, costs=[3,4,5,6], returns=[4.0,5.0,3.0,7.0]",
        output: "max_return=9.0, assets=[0,1]",
        explanation: "Buy assets 0 (cost 3, return 4) and 1 (cost 4, return 5): total cost 7 <= 10, return 9.0. Buying 1+3 gives 5+7=12 but costs 10 exactly — that's also valid, return 12.0. Wait: 4+6=10, returns 5.0+7.0=12.0 is better. assets=[1,3].",
      },
      {
        input: "B=5, costs=[6,7], returns=[10.0,20.0]",
        output: "max_return=0.0, assets=[]",
        explanation: "No asset fits in the budget.",
      },
    ],
    constraints: [
      "1 <= n <= 200",
      "1 <= B <= 10^4",
      "1 <= costs[i] <= B",
      "0 < returns[i] <= 100.0",
    ],
    approach: "Standard 0/1 Knapsack DP: dp[b] = max return using exactly budget b. Iterate assets in outer loop, budget in reverse inner loop to avoid reuse. Reconstruct selected assets by backtracking. O(n*B) time and space.",
    code: `def portfolio_knapsack(B: int, costs: list[int],
                        returns: list[float]) -> dict:
    n  = len(costs)
    # dp[b] = max total return achievable with budget exactly b
    dp = [0.0] * (B + 1)

    # Backtrack table: keep[i][b] = True if asset i was selected in state b
    keep = [[False] * (B + 1) for _ in range(n)]

    for i in range(n):
        c, r = costs[i], returns[i]
        # Reverse iteration: ensures each asset selected at most once
        for b in range(B, c - 1, -1):
            candidate = dp[b - c] + r
            if candidate > dp[b]:
                dp[b] = candidate
                keep[i][b] = True

    # Maximum return and selected assets
    max_ret = max(dp)
    best_b  = dp.index(max_ret)

    selected = []
    b = best_b
    for i in range(n - 1, -1, -1):
        if keep[i][b]:
            selected.append(i)
            b -= costs[i]
    selected.reverse()

    return {
        'max_return':  max_ret,
        'assets':      selected,
        'total_cost':  sum(costs[i] for i in selected),
    }`,
    language: "python",
    complexity: { time: "O(n * B)", space: "O(n * B)" },
  },
  {
    id: "fin-20260623-b1-best-fx-path",
    title: "Best FX Conversion Path (Modified Dijkstra on Log-Rates)",
    difficulty: "medium",
    topics: ["graph", "dijkstra", "heap"],
    problem: `You have \`n\` currencies (0-indexed) and a list of exchange rate triples \`(src, dst, rate)\`. Starting with 1 unit of currency \`source\`, find the maximum amount of currency \`target\` reachable through any sequence of conversions.

Each conversion is multiplicative. You want to maximise the product of rates along the path, which is equivalent to maximising the sum of log-rates (Dijkstra with negated log-rates minimised).

Return the maximum amount reachable (or 0 if no path exists).`,
    examples: [
      {
        input: "n=3, rates=[(0,1,2.0),(1,2,3.0),(0,2,5.0)], source=0, target=2",
        output: "6.0",
        explanation: "0→1→2: 2.0*3.0=6.0. Direct 0→2: 5.0. Best path gives 6.0.",
      },
      {
        input: "n=2, rates=[(0,1,0.5)], source=1, target=0",
        output: "0.0",
        explanation: "No path from 1 to 0.",
      },
    ],
    constraints: [
      "2 <= n <= 100",
      "1 <= len(rates) <= 1000",
      "All rates > 0",
      "source != target",
    ],
    approach: "Modified Dijkstra: use a max-heap on the log-product (or equivalently, store negative log). dist[v] = max product from source to v. Relax edges: if dist[u] * rate(u,v) > dist[v], update. Return dist[target].",
    code: `import heapq
import math

def best_fx_path(n: int, rates: list[tuple[int, int, float]],
                  source: int, target: int) -> float:
    """
    Max-product path using a max-heap (stored as neg log for min-heap).
    Dijkstra's algorithm works because rates are positive (no negative log cycles
    in a max-product context without explicit arbitrage check).
    """
    # Adjacency list
    graph: list[list[tuple[int, float]]] = [[] for _ in range(n)]
    for src, dst, rate in rates:
        graph[src].append((dst, rate))

    # Max-heap: (-product, node)  [negate for Python's min-heap]
    heap = [(-1.0, source)]   # start with 1 unit
    best = [0.0] * n
    best[source] = 1.0

    while heap:
        neg_prod, u = heapq.heappop(heap)
        prod = -neg_prod

        # Skip stale entries
        if prod < best[u]:
            continue

        for v, rate in graph[u]:
            new_prod = prod * rate
            if new_prod > best[v]:
                best[v] = new_prod
                heapq.heappush(heap, (-new_prod, v))

    return best[target]`,
    language: "python",
    complexity: { time: "O((V + E) log V)", space: "O(V + E)" },
  },
  {
    id: "fin-20260623-b1-token-bucket-design",
    title: "Design: Token Bucket Order Rate Limiter",
    difficulty: "medium",
    topics: ["design", "rate-limiting"],
    problem: `Design a class \`OrderRateLimiter\` that enforces a token bucket rate limit on order submissions:

- \`__init__(rate: float, capacity: int)\`: \`rate\` is tokens refilled per second, \`capacity\` is the maximum tokens (burst allowance).
- \`allow(timestamp: float) -> bool\`: Given the current timestamp (in seconds, monotonically increasing), return \`True\` if an order is allowed (consumes 1 token), or \`False\` if the bucket is empty.

Tokens refill continuously at \`rate\` tokens/second up to \`capacity\`.`,
    examples: [
      {
        input: "rate=2, capacity=3; allow(0.0)=True, allow(0.0)=True, allow(0.0)=True, allow(0.0)=False, allow(1.0)=True, allow(1.0)=True",
        output: "[True, True, True, False, True, True]",
        explanation: "Start with 3 tokens. Three orders consume all tokens. Fourth is denied. After 1 second, 2 tokens refill (rate=2). Two more orders allowed.",
      },
    ],
    constraints: [
      "0 < rate <= 1000",
      "1 <= capacity <= 1000",
      "Timestamps are non-decreasing floats",
      "Up to 10^5 allow() calls",
    ],
    approach: "Store current tokens (float) and last timestamp. On each call: compute elapsed time, refill tokens = min(capacity, tokens + rate * elapsed), update last timestamp. If tokens >= 1: consume 1, return True. Else: return False. O(1) per call.",
    code: `class OrderRateLimiter:
    def __init__(self, rate: float, capacity: int):
        self._rate      = rate      # tokens per second
        self._capacity  = capacity  # max tokens
        self._tokens    = float(capacity)   # start full
        self._last_ts   = 0.0       # last refill timestamp

    def allow(self, timestamp: float) -> bool:
        # Refill based on elapsed time
        elapsed = max(0.0, timestamp - self._last_ts)
        self._tokens    = min(self._capacity,
                              self._tokens + self._rate * elapsed)
        self._last_ts   = timestamp

        # Consume 1 token if available
        if self._tokens >= 1.0:
            self._tokens -= 1.0
            return True
        return False

    def tokens_available(self, timestamp: float) -> float:
        """Preview available tokens without consuming."""
        elapsed = max(0.0, timestamp - self._last_ts)
        return min(self._capacity, self._tokens + self._rate * elapsed)`,
    language: "python",
    complexity: { time: "O(1) per allow()", space: "O(1)" },
  },
  {
    id: "fin-20260623-b1-gambler-ruin",
    title: "Gambler's Ruin: Probability of Reaching Target Before Ruin",
    difficulty: "medium",
    topics: ["probability", "math", "dynamic-programming"],
    problem: `A trader starts with \`k\` dollars. Each round: with probability \`p\` they win $1, with probability \`1-p\` they lose $1. The game ends when they reach \`n\` dollars (success) or $0 (ruin).

Compute the exact probability of reaching \`n\` before going broke.

This models a simple mean-reverting PnL strategy: starting at a spread level \`k\`, trying to reach target profit \`n\` before max loss (ruin at 0).

Return a float in [0, 1].`,
    examples: [
      {
        input: "k=5, n=10, p=0.5",
        output: "0.5",
        explanation: "Fair game (p=0.5): prob of reaching n before ruin = k/n = 5/10 = 0.5.",
      },
      {
        input: "k=5, n=10, p=0.6",
        output: "≈0.8702",
        explanation: "Favourable odds: p=0.6 > 0.5. Use formula: (1-(q/p)^k)/(1-(q/p)^n).",
      },
    ],
    constraints: [
      "1 <= k < n <= 1000",
      "0 < p < 1, p != 0.5 (use formula), or p = 0.5",
    ],
    approach: "Closed-form solution: let q = 1-p. If p=0.5: P(k,n) = k/n. If p!=0.5: P(k,n) = (1-(q/p)^k) / (1-(q/p)^n). Alternatively, solve the linear recurrence P(k) = p*P(k+1) + q*P(k-1) with boundary conditions P(0)=0, P(n)=1. O(1) with formula, O(n) with DP.",
    code: `def gamblers_ruin(k: int, n: int, p: float) -> float:
    """
    Exact probability of reaching n before 0, starting from k.
    Uses the closed-form solution to the first-passage time problem.
    """
    q = 1.0 - p

    if abs(p - 0.5) < 1e-12:
        # Fair game: linear in k
        return k / n

    # Biased walk: geometric series solution
    r = q / p   # ratio of losing to winning odds
    # P(k) = (1 - r^k) / (1 - r^n)

    # Use logarithms for large n to avoid overflow
    import math
    if n > 500 or k > 500:
        log_r = math.log(r)
        # P = (1 - exp(k*log_r)) / (1 - exp(n*log_r))
        if log_r > 0:   # r > 1: q > p (unfavourable)
            # Both numerator and denominator dominated by exp term
            log_num = k * log_r   # log(r^k - 1) ≈ log(r^k)
            log_den = n * log_r
            prob = math.exp(log_num - log_den)
        else:
            # Favourable: r < 1, exp terms vanish for large n
            prob = (1.0 - math.exp(k * log_r)) / (1.0 - math.exp(n * log_r))
        return float(min(max(prob, 0.0), 1.0))

    r_k = r ** k
    r_n = r ** n
    return (1.0 - r_k) / (1.0 - r_n)


def gamblers_ruin_dp(k: int, n: int, p: float) -> list[float]:
    """DP: solve for all starting positions simultaneously. O(n)."""
    q    = 1.0 - p
    prob = [0.0] * (n + 1)
    prob[n] = 1.0   # boundary: at n, already successful

    # Tridiagonal system: prob[i] = p*prob[i+1] + q*prob[i-1]
    # Rearrange: -q*prob[i-1] + prob[i] - p*prob[i+1] = 0
    # Use forward elimination (standard tridiagonal solve)
    fwd = [0.0] * (n + 1)
    fwd[1] = q / 1.0   # ratio for elimination
    for i in range(2, n):
        fwd[i] = q / (1.0 - p * fwd[i-1])
    prob[n-1] = p / (1.0 - p * fwd[n-2])
    for i in range(n-2, 0, -1):
        prob[i] = fwd[i] * prob[i+1]
    return prob`,
    language: "python",
    complexity: { time: "O(1) closed-form, O(n) DP", space: "O(n) DP" },
  },
  {
    id: "fin-20260623-b1-skyline-orderbook",
    title: "Order Book Skyline — Visible Top-of-Book After Insertions",
    difficulty: "hard",
    topics: ["heap", "design", "order-book"],
    problem: `You are given a sequence of operations on a bid order book:
- \`("add", price, qty)\`: add a limit order at this price level with the given quantity.
- \`("cancel", price, qty)\`: reduce quantity at this price level by \`qty\` (remove level if qty reaches 0).
- \`("query",)\`: return the current best bid price (highest price with positive qty), or -1 if the book is empty.

Design a class \`BidBook\` that supports these operations. All prices are positive integers.`,
    examples: [
      {
        input: 'ops=[("add",100,50),("add",101,30),("query",),("cancel",101,30),("query",)]',
        output: "[101, 100]",
        explanation: "After two adds, best bid = 101. After cancelling all qty at 101, best bid = 100.",
      },
      {
        input: 'ops=[("add",50,10),("cancel",50,10),("query",)]',
        output: "[-1]",
        explanation: "All qty at 50 cancelled; book is empty.",
      },
    ],
    constraints: [
      "1 <= price <= 10^6",
      "1 <= qty <= 10^6",
      "Up to 10^5 operations",
    ],
    approach: "Use a max-heap of (price, qty) pairs with lazy deletion. Maintain a dict mapping price -> total_qty. On cancel: subtract from dict. On query: pop the heap until the top matches the dict's current qty. O(log N) per add/cancel, O(log N) amortised per query.",
    code: `import heapq
from collections import defaultdict

class BidBook:
    def __init__(self):
        self._heap: list[int] = []          # max-heap via negative prices
        self._qty: dict[int, int] = defaultdict(int)   # price -> live qty

    def add(self, price: int, qty: int) -> None:
        self._qty[price] += qty
        heapq.heappush(self._heap, -price)  # push even if price already in heap

    def cancel(self, price: int, qty: int) -> None:
        self._qty[price] = max(0, self._qty[price] - qty)
        if self._qty[price] == 0:
            del self._qty[price]
        # Lazy deletion: don't touch heap; stale entries removed on query

    def query(self) -> int:
        """Return best bid price or -1."""
        # Pop stale heap entries (prices with zero remaining qty)
        while self._heap:
            price = -self._heap[0]
            if price in self._qty and self._qty[price] > 0:
                return price
            heapq.heappop(self._heap)   # stale entry
        return -1

    def best_qty(self) -> int:
        """Return qty at best bid level."""
        price = self.query()
        return self._qty.get(price, 0) if price >= 0 else 0`,
    language: "python",
    complexity: { time: "O(log N) add/cancel, O(log N) amortised query", space: "O(N)" },
  },
  {
    id: "fin-20260623-b1-bitmask-portfolio",
    title: "Optimal Portfolio Subset via Bitmask DP (Small Universe)",
    difficulty: "hard",
    topics: ["bitmask-dp", "dynamic-programming"],
    problem: `You have a small universe of \`n <= 20\` assets. For each subset of assets, the portfolio Sharpe ratio is given by a function \`sharpe(mask)\` (precomputed). However, you must also satisfy a diversification constraint: the selected portfolio must include at least one asset from each of \`m\` required sector groups.

Each sector group is a bitmask \`required[j]\` (assets in sector j). The portfolio must include at least one asset from each group.

Find the subset of assets (represented as a bitmask) that maximises the Sharpe ratio while satisfying all group constraints.`,
    examples: [
      {
        input: "n=4, sharpe_by_mask=[0,1.0,1.2,1.5,0.8,1.8,1.9,2.1,0.5,1.6,1.7,2.0,1.3,1.9,2.2,2.3], required=[0b0011, 0b1100]",
        output: "mask=0b1111 (or any subset with sharpe 2.3)",
        explanation: "required[0]=0b0011 means must include asset 0 or 1. required[1]=0b1100 means must include asset 2 or 3. Subset 0b1111 (all assets) has sharpe 2.3.",
      },
    ],
    constraints: [
      "1 <= n <= 20",
      "1 <= m <= n",
      "len(sharpe_by_mask) = 2^n",
      "len(required) = m",
    ],
    approach: "Iterate over all 2^n masks. For each mask, check if it covers all required groups (bitwise AND check). Track the best valid mask. O(2^n * m) time, O(1) space.",
    code: `def best_portfolio_bitmask(n: int, sharpe_by_mask: list[float],
                              required: list[int]) -> dict:
    """
    Enumerate all 2^n subsets; filter those satisfying group constraints;
    return the one maximising the Sharpe ratio.

    This is optimal for small n (<= 20); for larger n use approximations.
    """
    best_sharpe = float('-inf')
    best_mask   = 0

    total_masks = 1 << n

    for mask in range(1, total_masks):
        # Check diversification: every required group has at least one asset in mask
        valid = all((mask & req) != 0 for req in required)
        if not valid:
            continue

        s = sharpe_by_mask[mask]
        if s > best_sharpe:
            best_sharpe = s
            best_mask   = mask

    # Decode selected assets
    selected = [i for i in range(n) if (best_mask >> i) & 1]

    return {
        'best_mask':    bin(best_mask),
        'best_sharpe':  best_sharpe,
        'selected_assets': selected,
        'n_assets':     len(selected),
    }


def popcount_dp_variant(n: int, sharpe_by_mask: list[float],
                         required: list[int], min_assets: int = 2) -> dict:
    """Variant: also enforce minimum number of assets in portfolio."""
    best_sharpe = float('-inf')
    best_mask   = 0

    for mask in range(1, 1 << n):
        if bin(mask).count('1') < min_assets:
            continue
        if not all((mask & req) != 0 for req in required):
            continue
        if sharpe_by_mask[mask] > best_sharpe:
            best_sharpe = sharpe_by_mask[mask]
            best_mask   = mask

    return {'best_mask': bin(best_mask), 'best_sharpe': best_sharpe}`,
    language: "python",
    complexity: { time: "O(2^n * m)", space: "O(1)" },
  },
  {
    id: "fin-20260623-b1-max-subarray-pnl",
    title: "Maximum Subarray P&L (Kadane's Algorithm)",
    difficulty: "easy",
    topics: ["dynamic-programming", "array"],
    problem: `Given a sequence of daily P&L changes \`pnl\` (which can be positive or negative), find the contiguous subperiod with the maximum total P&L. Return the maximum sum, its start index, and end index (inclusive).

This models identifying the best consecutive trading period to report or analyse.`,
    examples: [
      {
        input: "pnl = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        output: "max_pnl=6, start=3, end=6",
        explanation: "Subarray [4, -1, 2, 1] from index 3 to 6 gives sum 6.",
      },
      {
        input: "pnl = [-1, -2, -3]",
        output: "max_pnl=-1, start=0, end=0",
        explanation: "All negative; best is the single element -1.",
      },
    ],
    constraints: [
      "1 <= len(pnl) <= 10^5",
      "-10^4 <= pnl[i] <= 10^4",
    ],
    approach: "Kadane's algorithm: maintain current subarray sum and reset to 0 when it goes negative. Track indices of the current and best subarrays. O(N) time, O(1) space.",
    code: `def max_subarray_pnl(pnl: list[float]) -> dict:
    """
    Kadane's algorithm with index tracking.
    Handles all-negative arrays by returning the single maximum element.
    """
    if not pnl:
        return {'max_pnl': 0.0, 'start': 0, 'end': -1}

    max_sum   = pnl[0]
    cur_sum   = pnl[0]
    best_start = 0
    best_end   = 0
    cur_start  = 0

    for i in range(1, len(pnl)):
        if cur_sum + pnl[i] < pnl[i]:
            # Reset: start a new subarray at i
            cur_sum   = pnl[i]
            cur_start = i
        else:
            cur_sum += pnl[i]

        if cur_sum > max_sum:
            max_sum    = cur_sum
            best_start = cur_start
            best_end   = i

    return {
        'max_pnl': max_sum,
        'start':   best_start,
        'end':     best_end,
        'period':  pnl[best_start:best_end + 1],
    }


def max_subarray_circular(pnl: list[float]) -> float:
    """
    Maximum circular subarray: either normal Kadane OR total_sum - min_subarray.
    Models a strategy that wraps around the year boundary.
    """
    def kadane(arr):
        cur = best = arr[0]
        for x in arr[1:]:
            cur  = max(x, cur + x)
            best = max(best, cur)
        return best

    total  = sum(pnl)
    neg    = [-x for x in pnl]
    normal = kadane(pnl)
    wrap   = total - kadane(neg)   # total - min_subarray
    return normal if all(x <= 0 for x in pnl) else max(normal, wrap)`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260623-b1-order-position-tracker",
    title: "Design: Position Tracker with Margin Call Detection",
    difficulty: "medium",
    topics: ["design", "hash-map"],
    problem: `Design a \`PositionTracker\` for a multi-instrument trading system:

- \`fill(instrument: str, qty: int, price: float)\`: Record a fill. Positive qty = buy, negative qty = sell. Update the net position and average cost for the instrument.
- \`mark(prices: dict[str, float])\`: Update current mark prices for all instruments.
- \`unrealised_pnl(instrument: str) -> float\`: Return the unrealised P&L for an instrument at the current mark price.
- \`margin_call_instruments(threshold: float) -> list[str]\`: Return all instruments where unrealised P&L as a fraction of cost basis is below \`-threshold\` (e.g. -0.2 means >20% loss from cost). Return sorted list.`,
    examples: [
      {
        input: "fill(AAPL,100,150.0), fill(MSFT,50,300.0), mark({AAPL:120.0,MSFT:310.0}), margin_call_instruments(0.1)",
        output: "['AAPL']",
        explanation: "AAPL: bought 100@150, mark=120. Unrealised PnL=-3000. Cost basis=15000. Loss ratio=-0.20 < -0.10. MSFT: bought 50@300, mark=310. Profit=500. No margin call.",
      },
    ],
    constraints: [
      "1 <= len(instrument) <= 20",
      "Up to 10^4 fills, 10^3 mark updates",
      "0 < threshold < 1",
    ],
    approach: "Maintain dicts: net_qty[instr], avg_cost[instr], mark_price[instr]. On fill: update avg cost using weighted average formula. On margin_call: iterate instruments, compute unrealised_pnl / (avg_cost * |qty|), filter below -threshold. O(N) per margin call scan.",
    code: `class PositionTracker:
    def __init__(self):
        self._qty:   dict[str, float] = {}
        self._cost:  dict[str, float] = {}   # average cost per share
        self._mark:  dict[str, float] = {}

    def fill(self, instrument: str, qty: int, price: float) -> None:
        prev_qty  = self._qty.get(instrument, 0.0)
        prev_cost = self._cost.get(instrument, 0.0)

        new_qty = prev_qty + qty

        if new_qty == 0.0:
            # Flat position: clear cost basis
            self._qty.pop(instrument, None)
            self._cost.pop(instrument, None)
            return

        if qty > 0 and prev_qty >= 0:
            # Adding to long: update weighted average cost
            self._cost[instrument] = (prev_qty * prev_cost + qty * price) / new_qty
        elif qty < 0 and prev_qty <= 0:
            # Adding to short: update weighted average cost
            self._cost[instrument] = (prev_qty * prev_cost + qty * price) / new_qty
        else:
            # Crossing flat: reduce position, cost unchanged until flat
            self._cost[instrument] = prev_cost

        self._qty[instrument] = new_qty

    def mark(self, prices: dict[str, float]) -> None:
        self._mark.update(prices)

    def unrealised_pnl(self, instrument: str) -> float:
        qty  = self._qty.get(instrument, 0.0)
        cost = self._cost.get(instrument, 0.0)
        mp   = self._mark.get(instrument, cost)
        return qty * (mp - cost)

    def margin_call_instruments(self, threshold: float) -> list[str]:
        result = []
        for instr, qty in self._qty.items():
            cost = self._cost.get(instr, 0.0)
            upnl = self.unrealised_pnl(instr)
            cost_basis = abs(qty * cost)
            if cost_basis > 0 and upnl / cost_basis < -threshold:
                result.append(instr)
        return sorted(result)`,
    language: "python",
    complexity: { time: "O(1) fill, O(N) margin_call", space: "O(N)" },
  },
  {
    id: "fin-20260623-b1-min-cost-rebalance",
    title: "Minimum Transaction Cost Portfolio Rebalancing",
    difficulty: "medium",
    topics: ["greedy", "math", "array"],
    problem: `You have a portfolio with current weights \`current[i]\` and target weights \`target[i]\` (both sum to 1.0). Transaction cost is \`tc\` per unit of weight traded (proportional). You can rebalance any subset of assets.

However, due to minimum trade size constraints, trades smaller than \`min_trade\` (fraction of portfolio) are not executed. Compute the minimum total transaction cost to bring the portfolio as close to target as possible, executing only trades >= min_trade.

Return the total cost and the list of (asset, trade) pairs actually executed.`,
    examples: [
      {
        input: "current=[0.4,0.3,0.3], target=[0.5,0.2,0.3], tc=0.001, min_trade=0.05",
        output: "cost=0.0001, trades=[(0,+0.10),(1,-0.10)]",
        explanation: "Asset 0 needs +0.10 (>0.05 min), asset 1 needs -0.10 (>0.05 min), asset 2 needs 0.00. Total traded=0.10 one-way (sell 0.10 from asset 1, buy 0.10 into asset 0). Cost = 0.10 * 0.001 = 0.0001.",
      },
      {
        input: "current=[0.5,0.5], target=[0.52,0.48], tc=0.001, min_trade=0.05",
        output: "cost=0.0, trades=[]",
        explanation: "Required trades of 0.02 < min_trade=0.05; no trades executed.",
      },
    ],
    constraints: [
      "2 <= n <= 100",
      "0 < tc <= 0.01",
      "0 < min_trade <= 0.2",
      "All weights sum to 1.0 (within floating point tolerance)",
    ],
    approach: "Compute diff[i] = target[i] - current[i]. Filter out trades where |diff[i]| < min_trade. The remaining trades must be balanced (buys must equal sells). Rescale filtered trades proportionally to maintain balance, then compute cost = sum(|executed trades|) * tc / 2 (round-trip = two one-way legs). O(N) greedy.",
    code: `def min_cost_rebalance(current: list[float], target: list[float],
                          tc: float, min_trade: float) -> dict:
    n    = len(current)
    diff = [target[i] - current[i] for i in range(n)]

    # Only execute trades above minimum size
    trades = {}
    for i, d in enumerate(diff):
        if abs(d) >= min_trade:
            trades[i] = d

    if not trades:
        return {'cost': 0.0, 'trades': [], 'executed_diff': 0.0}

    # Trades may not balance exactly (some small trades skipped).
    # Distribute imbalance proportionally to executed trades.
    buy_total  = sum(v for v in trades.values() if v > 0)
    sell_total = sum(v for v in trades.values() if v < 0)
    imbalance  = buy_total + sell_total   # should be ~0 if all trades kept

    if abs(imbalance) > 1e-9 and trades:
        # Scale sells or buys to restore balance
        if imbalance > 0:   # too many buys
            scale = -sell_total / buy_total if buy_total > 1e-9 else 1.0
            for k in list(trades.keys()):
                if trades[k] > 0:
                    trades[k] *= scale
        else:               # too many sells
            scale = buy_total / (-sell_total) if sell_total < -1e-9 else 1.0
            for k in list(trades.keys()):
                if trades[k] < 0:
                    trades[k] *= scale

    # Total one-way volume = sum of buys = sum of absolute sells (after balancing)
    total_volume = sum(v for v in trades.values() if v > 0)
    cost = total_volume * tc

    return {
        'cost':       cost,
        'trades':     [(i, round(v, 6)) for i, v in trades.items()],
        'total_vol':  total_volume,
    }`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
];
