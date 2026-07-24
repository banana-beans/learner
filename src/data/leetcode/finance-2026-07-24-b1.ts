import type { LeetCodeProblem } from "./index";

export const financeProblems20260724B1: LeetCodeProblem[] = [
  {
    id: "fin-20260724-b1-stock-cooldown",
    title: "Best Time to Buy and Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["dynamic-programming", "state-machine"],
    leetcodeNumber: 309,
    problem:
      "You are given an array `prices` where `prices[i]` is the price of a stock on day i. " +
      "After you sell a stock you must wait one day before you can buy again (cooldown). " +
      "Find the maximum profit you can achieve. You may complete as many transactions as you like.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation: "Buy day 0, sell day 2 (+2). Cooldown day 3. Buy day 3, sell day 4 (+2). But optimal is buy 0, sell 1, cooldown 2, buy 3, sell 4 = 1+2 = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "Three-state DP: `hold` (own stock), `cool` (just sold, in cooldown), `free` (not holding, not in cooldown). " +
      "Transitions: hold→hold (rest), hold→cool (sell), free→hold (buy), cool→free, free→free. " +
      "Answer is max(cool, free) after all days. All three states update simultaneously each day.",
    code: `def max_profit_cooldown(prices):
    if not prices:
        return 0
    # hold  = max profit while holding stock
    # cool  = max profit on cooldown day (just sold)
    # free  = max profit when not holding and not in cooldown
    hold, cool, free = -prices[0], 0, 0

    for p in prices[1:]:
        hold, cool, free = (
            max(hold, free - p),   # hold: stay holding OR buy from free state
            hold + p,              # cool: sell today (always better than not selling)
            max(free, cool),       # free: stay free OR come off cooldown
        )
    return max(cool, free)

# Quant framing: models a regulatory lock-up period between unwinding
# and re-entering a position — common in proprietary trading rules.
print(max_profit_cooldown([1, 2, 3, 0, 2]))  # 3`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260724-b1-sliding-max",
    title: "Sliding Window Maximum (deque-based order book scan)",
    difficulty: "hard",
    topics: ["deque", "monotonic-queue", "sliding-window"],
    leetcodeNumber: 239,
    problem:
      "Given an array `nums` and a window size `k`, return the maximum value in each sliding window of size k. " +
      "In an order-book context: find the highest ask price seen in each rolling window of k ticks to detect price breakouts.",
    examples: [
      {
        input: "nums = [1,3,-1,-3,5,3,6,7], k = 3",
        output: "[3,3,5,5,6,7]",
        explanation: "Windows: [1,3,-1]→3, [3,-1,-3]→3, [-1,-3,5]→5, [-3,5,3]→5, [5,3,6]→6, [3,6,7]→7.",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "1 <= k <= nums.length",
      "-10^4 <= nums[i] <= 10^4",
    ],
    approach:
      "Maintain a monotonic decreasing deque of indices. For each new element: (1) pop the front if it's outside the window; " +
      "(2) pop from the back while the back element is smaller than the current — it can never be the maximum again. " +
      "(3) append current index; (4) the front is always the window maximum. O(n) total because each index is pushed/popped once.",
    code: `from collections import deque

def max_sliding_window(nums, k):
    dq     = deque()   # monotonic decreasing deque of indices
    result = []

    for i, x in enumerate(nums):
        # Evict indices outside the current window [i-k+1, i]
        while dq and dq[0] < i - k + 1:
            dq.popleft()
        # Maintain decreasing invariant: smaller elements behind x
        # can never be the window max, so discard them.
        while dq and nums[dq[-1]] < x:
            dq.pop()
        dq.append(i)
        # Window is full starting at index k-1
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result

# Order-book application: track best ask in a rolling 10-tick window
# to flag when ask price breaks above a resistance level.
print(max_sliding_window([1,3,-1,-3,5,3,6,7], 3))
# [3, 3, 5, 5, 6, 7]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
  },
  {
    id: "fin-20260724-b1-credit-markov",
    title: "Credit Rating Markov Matrix Power (n-year default probability)",
    difficulty: "medium",
    topics: ["matrix-exponentiation", "dynamic-programming"],
    problem:
      "Given a credit-rating transition matrix P (an n×n stochastic matrix where P[i][j] is the " +
      "one-year probability of moving from rating i to rating j) and a horizon of `years`, " +
      "compute the multi-year transition matrix P^years using fast matrix exponentiation. " +
      "Return the probability of transitioning from rating `start` to rating `end` in `years` years.",
    examples: [
      {
        input: "P = [[0.9, 0.1, 0.0], [0.0, 0.8, 0.2], [0.0, 0.0, 1.0]], years = 2, start = 0, end = 2",
        output: "0.02",
        explanation: "P^2 = P@P. Row 0 of P^2 is [0.81, 0.17, 0.02]. Entry [0][2] = 0.02.",
      },
    ],
    constraints: [
      "1 <= n <= 20",
      "1 <= years <= 30",
      "0 <= P[i][j] <= 1, each row sums to 1",
    ],
    approach:
      "Matrix exponentiation by repeated squaring: P^k in O(n^3 log k) instead of O(n^3 k). " +
      "Start with identity, then: if bit is set multiply result by current base, square the base, right-shift k. " +
      "Works because matrix multiplication is associative.",
    code: `import numpy as np

def mat_pow(P, years):
    """Raise stochastic matrix P to integer power via repeated squaring."""
    P      = np.asarray(P, dtype=float)
    n      = P.shape[0]
    result = np.eye(n)          # start with identity (P^0 = I)
    base   = P.copy()
    k      = years

    while k > 0:
        if k & 1:               # if current bit is set, fold base into result
            result = result @ base
        base = base @ base      # square the base for the next bit
        k >>= 1                 # process next bit
    return result

def default_probability(P, years, start_rating, default_state):
    Pk = mat_pow(P, years)
    return Pk[start_rating][default_state]

# 3-state: AAA=0, BB=1, Default=2
P = np.array([[0.90, 0.10, 0.00],
              [0.00, 0.80, 0.20],
              [0.00, 0.00, 1.00]])  # Default is absorbing

prob = default_probability(P, years=5, start_rating=0, default_state=2)
print(f"5-year default prob from AAA: {prob:.4f}")`,
    language: "python",
    complexity: { time: "O(n³ log k)", space: "O(n²)" },
  },
  {
    id: "fin-20260724-b1-weighted-pick",
    title: "Random Pick with Weights (order routing by venue capacity)",
    difficulty: "medium",
    topics: ["prefix-sum", "binary-search", "probability"],
    leetcodeNumber: 528,
    problem:
      "Given an array `weights` where `weights[i]` is the capacity (or fill-rate) of venue i, " +
      "implement a class that picks a venue index with probability proportional to its weight. " +
      "In smart-order routing this models probabilistic allocation of child orders across venues.",
    examples: [
      {
        input: "weights = [1, 3], then call pickIndex() multiple times",
        output: "Index 1 appears ~75% of the time, index 0 ~25%",
      },
    ],
    constraints: [
      "1 <= weights.length <= 10^4",
      "1 <= weights[i] <= 10^5",
      "pickIndex will be called at most 10^4 times",
    ],
    approach:
      "Build prefix sum array. To pick: draw a uniform random number in [0, total_weight), " +
      "then binary search (bisect_left) in the prefix array. The found index is the sampled venue. " +
      "Construction O(n), each pick O(log n).",
    code: `import random
import bisect

class VenuePicker:
    def __init__(self, weights):
        self.prefix = []
        total = 0
        for w in weights:
            total += w
            self.prefix.append(total)
        # self.prefix[-1] == sum(weights)

    def pick(self):
        # Uniform draw in [0, total)
        target = random.uniform(0, self.prefix[-1])
        # bisect_left finds leftmost index where prefix[i] >= target
        return bisect.bisect_left(self.prefix, target)

# Smart-order routing: venues with larger advertised sizes get more flow.
venues = VenuePicker([10, 30, 60])   # 10%, 30%, 60% allocation
counts = [0, 0, 0]
for _ in range(10_000):
    counts[venues.pick()] += 1
print([c / 10_000 for c in counts])  # ≈ [0.10, 0.30, 0.60]`,
    language: "python",
    complexity: { time: "O(n) build, O(log n) per pick", space: "O(n)" },
  },
  {
    id: "fin-20260724-b1-lru-tick",
    title: "LRU Cache for latest tick data",
    difficulty: "medium",
    topics: ["design", "hash-map", "doubly-linked-list"],
    leetcodeNumber: 146,
    problem:
      "Design an LRU (Least Recently Used) cache for storing the most recent tick price for N symbols. " +
      "`get(symbol)` retrieves the cached price (-1 if not present) and marks it recently used. " +
      "`put(symbol, price)` inserts or updates the price; if capacity is exceeded, evict the least recently used symbol.",
    examples: [
      {
        input: 'cache = LRUTickCache(2), put("AAPL",150), put("GOOG",100), get("AAPL"), put("MSFT",200), get("GOOG")',
        output: "get(AAPL)=150, get(GOOG)=-1  (GOOG evicted when MSFT inserted)",
      },
    ],
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= value <= 10^4",
      "At most 3 × 10^4 calls to get and put",
    ],
    approach:
      "Use Python's OrderedDict which maintains insertion order. move_to_end() marks a key as recently used. " +
      "On put: move existing key to end, or insert at end; if over capacity, pop the first item (LRU). " +
      "All operations O(1) amortized.",
    code: `from collections import OrderedDict

class LRUTickCache:
    def __init__(self, capacity):
        self.cap   = capacity
        self.cache = OrderedDict()   # key=symbol, value=price; order=LRU→MRU

    def get(self, symbol):
        if symbol not in self.cache:
            return -1
        self.cache.move_to_end(symbol)   # mark as most recently used
        return self.cache[symbol]

    def put(self, symbol, price):
        if symbol in self.cache:
            self.cache.move_to_end(symbol)
        self.cache[symbol] = price
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)  # evict least recently used (front)

cache = LRUTickCache(2)
cache.put("AAPL", 150)
cache.put("GOOG", 100)
print(cache.get("AAPL"))    # 150  — AAPL moves to MRU
cache.put("MSFT", 200)      # evicts GOOG (LRU)
print(cache.get("GOOG"))    # -1   — evicted
print(cache.get("MSFT"))    # 200`,
    language: "python",
    complexity: { time: "O(1) per get/put", space: "O(capacity)" },
  },
  {
    id: "fin-20260724-b1-kth-largest",
    title: "Kth Largest in a Stream (real-time P&L monitoring)",
    difficulty: "easy",
    topics: ["heap", "design"],
    leetcodeNumber: 703,
    problem:
      "Design a class that tracks the k-th largest P&L value seen so far in a stream of daily P&L reports. " +
      "`add(val)` receives a new value and returns the current k-th largest. " +
      "This models a risk dashboard that always shows the k-th best daily outcome across a portfolio of funds.",
    examples: [
      {
        input: "k = 3, initial = [4, 5, 8, 2], add(3) → add(5) → add(10) → add(9) → add(4)",
        output: "4 → 5 → 5 → 8 → 8",
      },
    ],
    constraints: [
      "1 <= k <= 10^4",
      "-10^4 <= val <= 10^4",
      "At most 10^4 calls to add",
    ],
    approach:
      "Maintain a min-heap of exactly k elements. The heap root is always the k-th largest seen so far. " +
      "On add: push val, then pop if size exceeds k (discarding the smallest). " +
      "Heap invariant: heap[0] is always the k-th largest.",
    code: `import heapq

class KthLargestPnL:
    def __init__(self, k, initial):
        self.k    = k
        self.heap = []   # min-heap of size k; root = k-th largest
        for v in initial:
            self.add(v)

    def add(self, val):
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)     # discard the smallest — below k-th
        return self.heap[0]              # k-th largest = min of top-k heap

# Risk dashboard: track 3rd-best daily P&L across funds
monitor = KthLargestPnL(k=3, initial=[4, 5, 8, 2])
for pnl in [3, 5, 10, 9, 4]:
    print(monitor.add(pnl))
# 4, 5, 5, 8, 8`,
    language: "python",
    complexity: { time: "O(n log k)", space: "O(k)" },
  },
  {
    id: "fin-20260724-b1-stock-fee",
    title: "Best Time to Buy and Sell Stock with Transaction Fee",
    difficulty: "medium",
    topics: ["dynamic-programming", "greedy"],
    leetcodeNumber: 714,
    problem:
      "Given a stock price array `prices` and an integer `fee` (paid once per completed transaction), " +
      "find the maximum profit you can achieve. You may complete as many transactions as you like " +
      "but must pay `fee` each time you sell. Models a broker commission structure.",
    examples: [
      {
        input: "prices = [1, 3, 2, 8, 4, 9], fee = 2",
        output: "8",
        explanation: "Buy day 0 (1), sell day 3 (8-2=6 profit). Buy day 4 (4), sell day 5 (9-2=3 profit). Total: 8.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5 × 10^4",
      "1 <= prices[i] <= 5 × 10^4",
      "0 <= fee <= 5 × 10^4",
    ],
    approach:
      "Two-state DP: `cash` (not holding) and `hold` (holding). " +
      "cash = max(cash, hold + price - fee): either stay out or sell today. " +
      "hold = max(hold, cash - price): either keep holding or buy today. " +
      "Fee is deducted on sell (not buy) to avoid double-counting.",
    code: `def max_profit_with_fee(prices, fee):
    # cash = max profit when NOT holding stock
    # hold = max profit when holding stock
    cash, hold = 0, -prices[0]

    for p in prices[1:]:
        # Update simultaneously to avoid using today's price in both transitions
        cash, hold = (
            max(cash, hold + p - fee),   # sell: collect price minus fee
            max(hold, cash - p),         # buy: pay today's price
        )
    return cash   # always better not to hold at the end

# With fee=2: small bounces no longer worth trading — only large moves profitable.
print(max_profit_with_fee([1, 3, 2, 8, 4, 9], fee=2))  # 8
print(max_profit_with_fee([1, 2, 3, 4],        fee=2))  # 2 (buy 1, sell 4)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260724-b1-mst-hedge",
    title: "Minimum Spanning Tree — Kruskal's for minimum-cost hedging",
    difficulty: "medium",
    topics: ["graph", "union-find", "greedy"],
    problem:
      "You have N assets and a list of possible hedging instruments, each described as " +
      "(cost, asset_i, asset_j) meaning you can hedge the exposure between asset i and asset j for that cost. " +
      "Find the minimum total cost to connect all N assets into a single hedged portfolio " +
      "(every asset pair is indirectly covered). This is the Minimum Spanning Tree problem.",
    examples: [
      {
        input: "n = 4, edges = [(1,0,1),(2,0,2),(3,1,2),(4,1,3),(5,2,3)]",
        output: "cost = 7, MST edges = [(0,1),(0,2),(1,3)]",
      },
    ],
    constraints: [
      "2 <= n <= 10^4",
      "n-1 <= edges.length <= 10^5",
      "0 <= cost <= 10^5",
    ],
    approach:
      "Kruskal's algorithm: sort edges by cost ascending; use Union-Find to add the cheapest edge " +
      "that doesn't create a cycle. Stop when n-1 edges are added. " +
      "Union-Find with path compression + union by rank runs in nearly O(1) per operation.",
    code: `def kruskal_mst(n, edges):
    """
    Minimum spanning tree via Kruskal's.
    edges: list of (cost, u, v)
    Returns (mst_edges, total_cost).
    """
    parent = list(range(n))
    rank   = [0] * n

    def find(x):
        # Path compression: flatten the tree while walking to root
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path halving
            x = parent[x]
        return x

    def union(x, y):
        px, py = find(x), find(y)
        if px == py:
            return False      # same component — would form a cycle
        if rank[px] < rank[py]:
            px, py = py, px
        parent[py] = px       # attach smaller tree under larger
        if rank[px] == rank[py]:
            rank[px] += 1
        return True

    edges.sort()              # sort by cost ascending
    mst, total = [], 0
    for cost, u, v in edges:
        if union(u, v):
            mst.append((u, v, cost))
            total += cost
            if len(mst) == n - 1:
                break         # MST complete — no need to check further

    return mst, total

edges = [(1,0,1),(2,0,2),(3,1,2),(4,1,3),(5,2,3)]
mst, cost = kruskal_mst(4, edges)
print(f"MST cost: {cost}  edges: {mst}")  # 7, [(0,1,1),(0,2,2),(1,3,4)]`,
    language: "python",
    complexity: { time: "O(E log E)", space: "O(N)" },
  },
  {
    id: "fin-20260724-b1-stock-k-txn",
    title: "Best Time to Buy and Sell Stock IV (at most k transactions)",
    difficulty: "hard",
    topics: ["dynamic-programming"],
    leetcodeNumber: 188,
    problem:
      "Given a price array and an integer k, find the maximum profit using at most k transactions. " +
      "A transaction is one buy + one sell, and you must sell before buying again. " +
      "Models a fund with a limited number of allowed trades per quarter.",
    examples: [
      {
        input: "k = 2, prices = [3, 2, 6, 5, 0, 3]",
        output: "7",
        explanation: "Buy day 1 (2), sell day 2 (6): profit 4. Buy day 4 (0), sell day 5 (3): profit 3. Total 7.",
      },
    ],
    constraints: [
      "1 <= k <= 100",
      "1 <= prices.length <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "dp[j][0] = max profit using at most j transactions, not holding. " +
      "dp[j][1] = max profit using at most j transactions, holding. " +
      "Iterate prices: for j from k down to 1: " +
      "dp[j][0] = max(dp[j][0], dp[j][1]+price); dp[j][1] = max(dp[j][1], dp[j-1][0]-price). " +
      "When k >= n//2, transactions are unlimited (use greedy).",
    code: `def max_profit_k_txn(k, prices):
    n = len(prices)
    if n == 0 or k == 0:
        return 0

    # If k is large enough, transactions are effectively unlimited
    if k >= n // 2:
        return sum(max(prices[i+1] - prices[i], 0) for i in range(n - 1))

    # dp[j] = (not_holding, holding) with at most j transactions
    # Initialise: 0 profit not holding; -inf profit holding (can't hold at start)
    dp = [[0, float('-inf')] for _ in range(k + 1)]

    for price in prices:
        # Traverse from k down to avoid using the same price twice
        for j in range(k, 0, -1):
            dp[j][0] = max(dp[j][0], dp[j][1] + price)    # sell
            dp[j][1] = max(dp[j][1], dp[j-1][0] - price)  # buy (uses one txn slot)

    return dp[k][0]

print(max_profit_k_txn(2, [3, 2, 6, 5, 0, 3]))  # 7
print(max_profit_k_txn(1, [1, 4, 2, 7]))         # 6  (buy 1, sell 7)`,
    language: "python",
    complexity: { time: "O(nk)", space: "O(k)" },
  },
  {
    id: "fin-20260724-b1-jump-coverage",
    title: "Jump Game II — minimum hedge trades to cover barriers",
    difficulty: "medium",
    topics: ["greedy", "array"],
    leetcodeNumber: 45,
    problem:
      "Given an array `reach` where `reach[i]` is the maximum coverage an instrument starting at position i can provide, " +
      "find the minimum number of hedge instruments needed to cover from position 0 to position n-1. " +
      "Models selecting the fewest option legs to cover all barrier levels across a structured product.",
    examples: [
      {
        input: "reach = [2, 3, 1, 1, 4]",
        output: "2",
        explanation: "Jump from index 0 to index 1 (covers up to 4), then to index 4. Two instruments cover all barriers.",
      },
      {
        input: "reach = [2, 3, 0, 1, 4]",
        output: "2",
      },
    ],
    constraints: [
      "1 <= reach.length <= 10^4",
      "0 <= reach[i] <= 1000",
      "It is guaranteed you can always reach the last index",
    ],
    approach:
      "Greedy: at each 'jump', pick the instrument that reaches furthest. " +
      "Track cur_end (range of current instrument) and cur_far (best reachable so far). " +
      "When i == cur_end: increment the trade count and extend cur_end to cur_far. " +
      "Stop as soon as cur_end covers the last index.",
    code: `def min_hedge_trades(reach):
    """
    Minimum number of hedge instruments to cover all n positions.
    Greedy: always pick the instrument with maximum forward reach.
    """
    n = len(reach)
    if n <= 1:
        return 0

    trades   = 0     # number of instruments selected
    cur_end  = 0     # coverage end of current set of instruments
    cur_far  = 0     # furthest position reachable from any instrument in current set

    for i in range(n - 1):    # no need to go past last index
        cur_far = max(cur_far, i + reach[i])   # extend reach from position i
        if i == cur_end:       # current instruments exhausted — must add one
            trades  += 1
            cur_end  = cur_far  # new coverage boundary
            if cur_end >= n - 1:
                return trades   # already covers the end

    return trades

print(min_hedge_trades([2, 3, 1, 1, 4]))  # 2
print(min_hedge_trades([2, 3, 0, 1, 4]))  # 2
print(min_hedge_trades([1, 2, 3]))        # 2`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
];
