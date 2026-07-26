import type { LeetCodeProblem } from "./index";

export const financeProblems20260726B1: LeetCodeProblem[] = [
  {
    id: "fin-20260726-b1-kadane-profit",
    title: "Maximum Profit Window (Kadane's Algorithm)",
    difficulty: "medium",
    topics: ["Array", "Dynamic Programming", "Kadane's Algorithm"],
    problem:
      "Given an array of daily P&L values (positive or negative), find the contiguous subarray with the maximum total profit. Return the maximum sum. This models finding the best contiguous trading period in a backtest.",
    examples: [
      {
        input: "pnl = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        output: "6",
        explanation: "Subarray [4,-1,2,1] has the largest sum = 6.",
      },
      {
        input: "pnl = [1]",
        output: "1",
      },
      {
        input: "pnl = [-1, -2, -3]",
        output: "-1",
        explanation: "All periods are losses; best single day is -1.",
      },
    ],
    constraints: [
      "1 <= pnl.length <= 10^5",
      "-10^4 <= pnl[i] <= 10^4",
    ],
    approach:
      "Kadane's algorithm: track `current_sum` (reset to 0 when negative) and `best_sum`. At each step `current_sum = max(pnl[i], current_sum + pnl[i])` and `best_sum = max(best_sum, current_sum)`. O(n) time, O(1) space.",
    code: `def max_profit_window(pnl: list[int]) -> int:
    best = current = pnl[0]
    for x in pnl[1:]:
        current = max(x, current + x)
        best = max(best, current)
    return best`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 53,
  },
  {
    id: "fin-20260726-b1-jump-game-min-trades",
    title: "Minimum Trades to Reach Target Price Level",
    difficulty: "medium",
    topics: ["Array", "Greedy", "BFS"],
    problem:
      "You are given an array `levels` where `levels[i]` is how many price levels forward you can jump from position `i`. Starting at index 0 (current price), find the minimum number of jumps (trades) needed to reach the last index (target level). Return -1 if unreachable.",
    examples: [
      {
        input: "levels = [2, 3, 1, 1, 4]",
        output: "2",
        explanation: "Jump from index 0 → 1 → 4. Two trades.",
      },
      {
        input: "levels = [2, 3, 0, 1, 4]",
        output: "2",
      },
      {
        input: "levels = [0, 2, 3]",
        output: "-1",
        explanation: "Stuck at index 0.",
      },
    ],
    constraints: [
      "1 <= levels.length <= 10^4",
      "0 <= levels[i] <= 10^5",
    ],
    approach:
      "Greedy BFS: maintain `current_end` (farthest reachable in current jump) and `farthest` (farthest reachable overall). When we reach `current_end` we must take another jump. If `farthest` never advances past `current_end`, return -1.",
    code: `def min_trades(levels: list[int]) -> int:
    n = len(levels)
    if n == 1:
        return 0
    jumps = current_end = farthest = 0
    for i in range(n - 1):
        farthest = max(farthest, i + levels[i])
        if i == current_end:
            if farthest <= current_end:
                return -1
            jumps += 1
            current_end = farthest
            if current_end >= n - 1:
                return jumps
    return jumps`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 45,
  },
  {
    id: "fin-20260726-b1-lru-order-cache",
    title: "Order Book Cache (LRU Design)",
    difficulty: "medium",
    topics: ["Hash Table", "Linked List", "Design"],
    problem:
      "Design an LRU (Least Recently Used) cache to store recently accessed order book snapshots keyed by instrument symbol. Implement `get(symbol)` which returns the cached spread or -1 if not present, and `put(symbol, spread)` which inserts/updates — evicting the least recently used entry when capacity is exceeded.",
    examples: [
      {
        input:
          'cache = LRUCache(2); put("AAPL",5); put("GOOG",3); get("AAPL"); put("MSFT",2); get("GOOG")',
        output: "get(AAPL)=5, get(GOOG)=-1",
        explanation: "GOOG was evicted when MSFT was inserted (LRU after AAPL was accessed).",
      },
    ],
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= value <= 10^4",
      "At most 3 * 10^4 calls to get and put",
    ],
    approach:
      "Use an `OrderedDict` (doubly-linked hash map). `get` moves the key to the end (MRU). `put` inserts at end; if over capacity, pop the first entry (LRU). All operations O(1).",
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache: OrderedDict[str, int] = OrderedDict()

    def get(self, symbol: str) -> int:
        if symbol not in self.cache:
            return -1
        self.cache.move_to_end(symbol)
        return self.cache[symbol]

    def put(self, symbol: str, spread: int) -> None:
        if symbol in self.cache:
            self.cache.move_to_end(symbol)
        self.cache[symbol] = spread
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(capacity)" },
    leetcodeNumber: 146,
  },
  {
    id: "fin-20260726-b1-next-resistance-level",
    title: "Next Resistance Level (Next Greater Element)",
    difficulty: "easy",
    topics: ["Array", "Stack", "Monotonic Stack"],
    problem:
      "Given a list of daily closing prices, for each price find the next day's price that is strictly greater (the next resistance level). If no such day exists, return -1 for that position.",
    examples: [
      {
        input: "prices = [4, 5, 2, 10, 8]",
        output: "[5, 10, 10, -1, -1]",
        explanation:
          "Price 4 → next greater is 5; price 5 → 10; price 2 → 10; price 10 → none; price 8 → none.",
      },
      {
        input: "prices = [1, 1, 1]",
        output: "[-1, -1, -1]",
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^4",
      "0 <= prices[i] <= 10^9",
    ],
    approach:
      "Monotonic decreasing stack: iterate left-to-right keeping indices of unresolved prices. When a larger price is found, pop all stack entries smaller than it — their answer is the current price. Remaining entries get -1.",
    code: `def next_resistance(prices: list[int]) -> list[int]:
    n = len(prices)
    result = [-1] * n
    stack: list[int] = []   # indices
    for i, p in enumerate(prices):
        while stack and prices[stack[-1]] < p:
            result[stack.pop()] = p
        stack.append(i)
    return result`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 496,
  },
  {
    id: "fin-20260726-b1-rate-limiter-sliding-window",
    title: "Order Rate Limiter (Sliding Window)",
    difficulty: "medium",
    topics: ["Queue", "Sliding Window", "Design"],
    problem:
      "Design a rate limiter for an order management system. Implement `RateLimiter(max_orders, window_ms)` and `allow(timestamp_ms)` which returns True if another order is allowed at the given timestamp, enforcing a maximum of `max_orders` in any rolling window of `window_ms` milliseconds.",
    examples: [
      {
        input:
          "rl = RateLimiter(3, 1000); allow(100); allow(500); allow(800); allow(1050); allow(1200)",
        output: "[True, True, True, True, False]",
        explanation:
          "At t=1050 the window [50,1050] contains t=100,500,800 — 3 orders already. At t=1200 window [200,1200] still contains t=500,800,1050 — limit hit.",
      },
    ],
    constraints: [
      "1 <= max_orders <= 10^4",
      "1 <= window_ms <= 10^9",
      "Timestamps are non-decreasing",
    ],
    approach:
      "Maintain a deque of timestamps. On each call: evict timestamps older than `ts - window_ms` from the front. If deque size < max_orders, append and return True; else return False.",
    code: `from collections import deque

class RateLimiter:
    def __init__(self, max_orders: int, window_ms: int):
        self.limit = max_orders
        self.window = window_ms
        self.timestamps: deque[int] = deque()

    def allow(self, ts_ms: int) -> bool:
        cutoff = ts_ms - self.window
        while self.timestamps and self.timestamps[0] <= cutoff:
            self.timestamps.popleft()
        if len(self.timestamps) < self.limit:
            self.timestamps.append(ts_ms)
            return True
        return False`,
    language: "python",
    complexity: { time: "O(1) amortized", space: "O(max_orders)" },
  },
  {
    id: "fin-20260726-b1-lis-trend",
    title: "Longest Uptrend (Longest Increasing Subsequence)",
    difficulty: "medium",
    topics: ["Array", "Binary Search", "Dynamic Programming"],
    problem:
      "Given an array of daily closing prices, find the length of the longest strictly increasing subsequence. This models detecting the longest consistent uptrend across non-consecutive trading days.",
    examples: [
      {
        input: "prices = [10, 9, 2, 5, 3, 7, 101, 18]",
        output: "4",
        explanation: "LIS is [2, 3, 7, 18] or [2, 5, 7, 18], length 4.",
      },
      {
        input: "prices = [0, 1, 0, 3, 2, 3]",
        output: "4",
      },
      {
        input: "prices = [7, 7, 7, 7, 7]",
        output: "1",
      },
    ],
    constraints: [
      "1 <= prices.length <= 2500",
      "-10^4 <= prices[i] <= 10^4",
    ],
    approach:
      "Patience sorting (binary search): maintain `tails` array where `tails[i]` is the smallest tail value of all increasing subsequences of length `i+1`. Binary search for the insertion point of each element. Length of `tails` is the LIS length. O(n log n).",
    code: `import bisect

def longest_uptrend(prices: list[int]) -> int:
    tails: list[int] = []
    for p in prices:
        pos = bisect.bisect_left(tails, p)
        if pos == len(tails):
            tails.append(p)
        else:
            tails[pos] = p
    return len(tails)`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 300,
  },
  {
    id: "fin-20260726-b1-word-break-fx-chain",
    title: "FX Conversion Chain Feasibility (Word Break)",
    difficulty: "medium",
    topics: ["Hash Table", "String", "Dynamic Programming"],
    problem:
      "Given a target currency pair string (e.g. `\"EURUSD\"`) and a list of directly tradeable pairs, determine whether the target can be formed by concatenating directly tradeable pairs. This models checking if an indirect FX conversion route is constructible from available legs.",
    examples: [
      {
        input: 'target = "EURUSD", pairs = ["EUR", "USD", "EURUSD"]',
        output: "True",
        explanation: '"EURUSD" is directly in pairs.',
      },
      {
        input: 'target = "EURUSD", pairs = ["EUR", "USD"]',
        output: "True",
        explanation: '"EUR" + "USD" = "EURUSD".',
      },
      {
        input: 'target = "EURJPY", pairs = ["EUR", "USD"]',
        output: "False",
      },
    ],
    constraints: [
      "1 <= target.length <= 300",
      "1 <= pairs.length <= 1000",
      "Pairs contain only uppercase letters",
    ],
    approach:
      "DP: `dp[i]` = True if `target[:i]` can be formed from the pair list. For each position `i`, check all `j < i` where `dp[j]` is True and `target[j:i]` is in the set. O(n^2).",
    code: `def fx_chain_feasible(target: str, pairs: list[str]) -> bool:
    pair_set = set(pairs)
    n = len(target)
    dp = [False] * (n + 1)
    dp[0] = True
    for i in range(1, n + 1):
        for j in range(i):
            if dp[j] and target[j:i] in pair_set:
                dp[i] = True
                break
    return dp[n]`,
    language: "python",
    complexity: { time: "O(n^2)", space: "O(n)" },
    leetcodeNumber: 139,
  },
  {
    id: "fin-20260726-b1-peak-price-binary-search",
    title: "Local Price Peak (Find Peak Element)",
    difficulty: "medium",
    topics: ["Array", "Binary Search"],
    problem:
      "Given a price series where no two consecutive prices are equal, find any index where the price is a local peak (greater than its neighbors). The series is padded with -infinity at both ends. Return any valid peak index. Must run in O(log n).",
    examples: [
      {
        input: "prices = [1, 2, 3, 1]",
        output: "2",
        explanation: "Index 2 (price=3) is a peak: 3 > 2 and 3 > 1.",
      },
      {
        input: "prices = [1, 2, 1, 3, 5, 6, 4]",
        output: "5",
        explanation: "Index 5 (price=6) is one valid peak.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "-2^31 <= prices[i] <= 2^31 - 1",
      "prices[i] != prices[i+1] for all i",
    ],
    approach:
      "Binary search: if `prices[mid] < prices[mid+1]` a peak must be in the right half (ascending slope); otherwise in the left half. Invariant: there is always a peak in the maintained range.",
    code: `def find_local_peak(prices: list[int]) -> int:
    lo, hi = 0, len(prices) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if prices[mid] < prices[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
    language: "python",
    complexity: { time: "O(log n)", space: "O(1)" },
    leetcodeNumber: 162,
  },
  {
    id: "fin-20260726-b1-matrix-exp-compound",
    title: "Compound Interest via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["Math", "Matrix", "Divide and Conquer"],
    problem:
      "Model compound interest with re-investment: each period, balance grows by rate `r` and a fixed deposit `d` is added. The recurrence is `B[n] = (1+r)*B[n-1] + d`. Given `B0`, `r`, `d`, and `n`, compute `B[n]` using matrix exponentiation in O(log n) multiplications.",
    examples: [
      {
        input: "B0=1000, r=0.01, d=100, n=12",
        output: "2533.47 (approx)",
        explanation:
          "Matrix [[1+r, d],[0, 1]] raised to the n-th power applied to [B0, 1].",
      },
    ],
    constraints: [
      "0 <= n <= 10^9",
      "0.0 <= r <= 1.0",
      "0.0 <= d <= 10^6",
      "0.0 <= B0 <= 10^9",
    ],
    approach:
      "Express recurrence as matrix product: `[B[n], 1] = M^n * [B0, 1]` where `M = [[1+r, d],[0, 1]]`. Use fast matrix exponentiation (repeated squaring) for O(log n) cost.",
    code: `def mat_mul(A: list, B: list) -> list:
    # 2x2 matrix multiply
    return [
        [A[0][0]*B[0][0] + A[0][1]*B[1][0],
         A[0][0]*B[0][1] + A[0][1]*B[1][1]],
        [A[1][0]*B[0][0] + A[1][1]*B[1][0],
         A[1][0]*B[0][1] + A[1][1]*B[1][1]],
    ]

def mat_pow(M: list, n: int) -> list:
    result = [[1,0],[0,1]]   # identity
    while n:
        if n & 1:
            result = mat_mul(result, M)
        M = mat_mul(M, M)
        n >>= 1
    return result

def compound(B0: float, r: float, d: float, n: int) -> float:
    if n == 0:
        return B0
    M = [[1 + r, d], [0, 1]]
    Mn = mat_pow(M, n)
    return Mn[0][0] * B0 + Mn[0][1]`,
    language: "python",
    complexity: { time: "O(log n)", space: "O(1)" },
  },
  {
    id: "fin-20260726-b1-topo-sort-trade-deps",
    title: "Trade Execution Order (Course Schedule II)",
    difficulty: "medium",
    topics: ["Graph", "Topological Sort", "BFS", "DFS"],
    problem:
      "You have `n` trade legs (numbered 0 to n-1) and a list of prerequisite pairs `[a, b]` meaning leg `a` must settle before leg `b` can execute. Return a valid execution order, or an empty list if a circular dependency (deadlock) exists.",
    examples: [
      {
        input: "n=4, prerequisites=[[1,0],[2,0],[3,1],[3,2]]",
        output: "[0,1,2,3] or [0,2,1,3]",
        explanation: "Leg 0 first, then 1 and 2 in either order, then 3.",
      },
      {
        input: "n=2, prerequisites=[[0,1],[1,0]]",
        output: "[]",
        explanation: "Circular dependency — no valid order.",
      },
    ],
    constraints: [
      "1 <= n <= 2000",
      "0 <= prerequisites.length <= n*(n-1)",
      "prerequisites[i].length == 2",
      "No duplicate edges",
    ],
    approach:
      "Kahn's BFS topological sort: build in-degree counts and adjacency list. Start with all zero-in-degree nodes. Process queue: append to result, decrement neighbors' in-degree, enqueue any that reach 0. If result length < n there's a cycle.",
    code: `from collections import deque

def trade_order(n: int, prerequisites: list[list[int]]) -> list[int]:
    indegree = [0] * n
    adj: list[list[int]] = [[] for _ in range(n)]
    for a, b in prerequisites:
        adj[a].append(b)
        indegree[b] += 1
    queue = deque(i for i in range(n) if indegree[i] == 0)
    order: list[int] = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nb in adj[node]:
            indegree[nb] -= 1
            if indegree[nb] == 0:
                queue.append(nb)
    return order if len(order) == n else []`,
    language: "python",
    complexity: { time: "O(V + E)", space: "O(V + E)" },
    leetcodeNumber: 210,
  },
];
