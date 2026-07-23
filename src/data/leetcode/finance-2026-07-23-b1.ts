import type { LeetCodeProblem } from "./index";

export const financeProblems20260723B1: LeetCodeProblem[] = [
  {
    id: "fin-20260723-b1-fx-arbitrage",
    title: "FX Triangular Arbitrage (Bellman-Ford Negative Cycle)",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Shortest Path", "Finance"],
    problem:
      "Given a list of currency pairs and their exchange rates, determine whether a triangular arbitrage opportunity exists. An arbitrage exists if there is a cycle of currency conversions that results in more than the starting amount. Return true if such a cycle exists, false otherwise. Rates are given as an array of [from, to, rate] triples.",
    examples: [
      {
        input:
          'pairs = [["USD","EUR",0.9],["EUR","GBP",0.8],["GBP","USD",1.4]]',
        output: "true",
        explanation:
          "1 USD -> 0.9 EUR -> 0.72 GBP -> 1.008 USD. Product > 1, so arbitrage exists. After log transform, the edge weights are -log(rate) and the negative cycle check via Bellman-Ford catches this.",
      },
      {
        input:
          'pairs = [["USD","EUR",0.9],["EUR","GBP",0.8],["GBP","USD",1.38]]',
        output: "false",
        explanation:
          "1 USD -> 0.9 EUR -> 0.72 GBP -> 0.9936 USD. Product < 1, no arbitrage.",
      },
    ],
    constraints: [
      "2 <= currencies <= 20",
      "1 <= pairs.length <= 50",
      "0 < rate <= 100",
    ],
    approach:
      "Transform rates to edge weights w = -log(rate). A product-of-rates > 1 is equivalent to a sum-of-log-rates < 0 (negative cycle in the transformed graph). Run Bellman-Ford for V-1 relaxations then check for a further-improving edge — that signals the negative cycle.",
    code: `import math

def has_fx_arbitrage(pairs: list[tuple[str, str, float]]) -> bool:
    # Assign integer indices to currencies
    idx: dict[str, int] = {}
    for src, dst, _ in pairs:
        for c in (src, dst):
            if c not in idx:
                idx[c] = len(idx)
    n = len(idx)

    # Build edge list with log-transformed weights
    edges = [
        (idx[src], idx[dst], -math.log(rate))
        for src, dst, rate in pairs
    ]

    # Bellman-Ford: initialise dist to 0 (start from every node simultaneously)
    dist = [0.0] * n
    for _ in range(n - 1):
        updated = False
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                updated = True
        if not updated:
            break

    # N-th relaxation: if any edge still improves, negative cycle exists
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return True
    return False

# Tests
print(has_fx_arbitrage([("USD","EUR",0.9),("EUR","GBP",0.8),("GBP","USD",1.4)]))  # True
print(has_fx_arbitrage([("USD","EUR",0.9),("EUR","GBP",0.8),("GBP","USD",1.38)])) # False`,
    language: "python",
    complexity: { time: "O(V * E)", space: "O(V + E)" },
    leetcodeNumber: 399,
  },
  {
    id: "fin-20260723-b1-median-stream",
    title: "Median P&L from Data Stream",
    difficulty: "hard",
    topics: ["Heap", "Design", "Two Heaps", "Finance"],
    problem:
      "Design a data structure that supports streaming daily P&L values and efficiently answers: what is the current median P&L? Implement MedianFinder with addNum(num) and findMedian() operations. The median is used in robust performance analytics and drawdown attribution.",
    examples: [
      {
        input: "addNum(3), addNum(1), findMedian(), addNum(2), findMedian()",
        output: "2.0, 2.0",
        explanation:
          "After [3,1]: sorted=[1,3], median=2.0. After [3,1,2]: sorted=[1,2,3], median=2.0.",
      },
    ],
    constraints: [
      "-10^5 <= num <= 10^5",
      "At most 5 * 10^4 calls to addNum and findMedian",
      "findMedian is always called after at least one addNum",
    ],
    approach:
      "Maintain two heaps: a max-heap for the lower half (negate values since Python's heapq is min-heap) and a min-heap for the upper half. Keep their sizes balanced: len(lo) == len(hi) or len(lo) == len(hi)+1. Median is lo[0] (if odd total) or (lo[0]+hi[0])/2.",
    code: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo: list[int] = []   # max-heap (negated), holds lower half
        self.hi: list[int] = []   # min-heap, holds upper half

    def addNum(self, num: int) -> None:
        heapq.heappush(self.lo, -num)
        # Balance: lo's max must not exceed hi's min
        if self.hi and -self.lo[0] > self.hi[0]:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        # Size invariant: len(lo) >= len(hi)
        if len(self.lo) < len(self.hi):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))
        elif len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))

    def findMedian(self) -> float:
        if len(self.lo) == len(self.hi):
            return (-self.lo[0] + self.hi[0]) / 2.0
        return float(-self.lo[0])

mf = MedianFinder()
for v in [3, 1, 4, 1, 5, 9, 2, 6]:
    mf.addNum(v)
    print(f"added {v}: median={mf.findMedian()}")`,
    language: "python",
    complexity: { time: "O(log n) add, O(1) median", space: "O(n)" },
    leetcodeNumber: 295,
  },
  {
    id: "fin-20260723-b1-next-greater-price",
    title: "Next Greater Ask Price (Monotonic Stack)",
    difficulty: "medium",
    topics: ["Monotonic Stack", "Array", "Finance"],
    problem:
      "Given a circular array of ask prices (the order book wraps around — after the last price we look from the first again), return an array where each element is the next strictly greater ask price. Return -1 if no greater price exists in a full circular scan. This models identifying the next resistance level on a circular intraday book.",
    examples: [
      {
        input: "prices = [3, 1, 4, 1, 5]",
        output: "[4, 4, 5, 5, -1]",
        explanation:
          "3->4 (at index 2), 1->4, 4->5 (at index 4), 1->5, 5 has no greater price in the circular scan.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^4",
      "0 <= prices[i] <= 10^9",
    ],
    approach:
      "Traverse the array twice (indices 0 to 2n-1 mod n) with a monotonic stack of indices. For each price, pop all stack indices whose price is strictly less than current — those indices found their next greater. Remaining indices after 2n steps have no answer (-1).",
    code: `def next_greater_circular(prices: list[int]) -> list[int]:
    n = len(prices)
    result = [-1] * n
    stack: list[int] = []   # indices waiting for their next greater

    for i in range(2 * n):
        idx = i % n
        while stack and prices[stack[-1]] < prices[idx]:
            result[stack.pop()] = prices[idx]
        if i < n:
            stack.append(idx)

    return result

print(next_greater_circular([3, 1, 4, 1, 5]))  # [4, 4, 5, 5, -1]
print(next_greater_circular([5, 4, 3, 2, 1]))  # [-1, 5, 5, 5, 5]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 503,
  },
  {
    id: "fin-20260723-b1-position-flags",
    title: "Portfolio Position Flags (Bit Manipulation)",
    difficulty: "easy",
    topics: ["Bit Manipulation", "Design", "Finance"],
    problem:
      "A position manager tracks up to 32 instruments using an integer bitmask. Implement: set_position(mask, i), clear_position(mask, i), has_position(mask, i), and count_positions(mask). Also implement flip_all(mask, n) which inverts the first n bits (useful for turning a long portfolio into the equivalent short basket).",
    examples: [
      {
        input: "mask=0, set positions 0,2,4; count; flip_all(n=6)",
        output: "mask=21, count=3, flipped=42",
        explanation:
          "Bits 0,2,4 set: binary 10101 = 21. count=3. flip_all n=6: 101010 = 42 (was 010101).",
      },
    ],
    constraints: ["0 <= i < 32", "1 <= n <= 32"],
    approach:
      "Standard bit operations: set with OR, clear with AND NOT, check with AND, count with bin().count('1'). Flip first n bits by XOR-ing with a mask of n ones: (1<<n)-1.",
    code: `def set_position(mask: int, i: int) -> int:
    return mask | (1 << i)

def clear_position(mask: int, i: int) -> int:
    return mask & ~(1 << i)

def has_position(mask: int, i: int) -> bool:
    return bool(mask & (1 << i))

def count_positions(mask: int) -> int:
    return bin(mask).count("1")

def flip_all(mask: int, n: int) -> int:
    return mask ^ ((1 << n) - 1)

# Build a portfolio with instruments 0, 2, 4
m = 0
for inst in [0, 2, 4]:
    m = set_position(m, inst)
print(f"mask={m} ({bin(m)})  count={count_positions(m)}")
print(f"has inst 2: {has_position(m, 2)}, has inst 3: {has_position(m, 3)}")
m_clear = clear_position(m, 2)
print(f"after clearing 2: {m_clear} ({bin(m_clear)})")
m_flip = flip_all(m, 6)
print(f"flip first 6 bits: {m_flip} ({bin(m_flip)})")`,
    language: "python",
    complexity: { time: "O(1) per op", space: "O(1)" },
  },
  {
    id: "fin-20260723-b1-task-scheduler",
    title: "Trading Strategy Cooldown Scheduler",
    difficulty: "medium",
    topics: ["Greedy", "Counting", "Heap", "Finance"],
    problem:
      "A quant has n trading strategies labelled A-Z. Each strategy needs to be executed a certain number of times, but the same strategy cannot run in consecutive time slots — it needs a cooldown of k slots. Each slot can run one strategy or be idle. Return the minimum number of time slots to execute all strategies. This is identical to the CPU task scheduler problem.",
    examples: [
      {
        input: "strategies = ['A','A','A','B','B','B'], cooldown = 2",
        output: "8",
        explanation:
          "A -> B -> idle -> A -> B -> idle -> A -> B. 8 slots total.",
      },
    ],
    constraints: [
      "1 <= strategies.length <= 10^4",
      "0 <= cooldown <= 100",
      "strategies[i] is uppercase English letter",
    ],
    approach:
      "Count frequencies. The optimal schedule is driven by the most frequent strategy. If max_count is the highest frequency and max_count_strats is how many strategies share it: result = max((max_count-1)*(cooldown+1)+max_count_strats, len(strategies)).",
    code: `from collections import Counter

def min_time_slots(strategies: list[str], cooldown: int) -> int:
    freq = Counter(strategies)
    max_count = max(freq.values())
    max_count_strats = sum(1 for v in freq.values() if v == max_count)

    # Either the formula fills all slots, or we have enough tasks to avoid idles
    return max(
        (max_count - 1) * (cooldown + 1) + max_count_strats,
        len(strategies)
    )

print(min_time_slots(["A","A","A","B","B","B"], 2))       # 8
print(min_time_slots(["A","A","A","B","B","B"], 0))       # 6
print(min_time_slots(["A","A","A","A","B","B","B"], 2))   # 10`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1) (26 letters)" },
    leetcodeNumber: 621,
  },
  {
    id: "fin-20260723-b1-settlement-topo",
    title: "Trade Settlement Order (Topological Sort)",
    difficulty: "medium",
    topics: ["Graph", "Topological Sort", "DFS", "Finance"],
    problem:
      "In a settlement system, some trades must settle before others (e.g., a repo must settle before a bond purchase it funds). Given n trades labelled 0 to n-1 and a list of dependency pairs [a, b] meaning trade a must settle before trade b, return a valid settlement order. If a circular dependency exists (deadlock), return an empty list.",
    examples: [
      {
        input: "n=4, deps=[[0,1],[0,2],[1,3],[2,3]]",
        output: "[0, 1, 2, 3] or [0, 2, 1, 3]",
        explanation: "Trade 0 must go first; 3 must go last.",
      },
      {
        input: "n=2, deps=[[0,1],[1,0]]",
        output: "[]",
        explanation: "Circular dependency — settlement deadlock.",
      },
    ],
    constraints: [
      "1 <= n <= 2000",
      "0 <= deps.length <= n*(n-1)",
      "deps[i].length == 2",
      "All dep pairs are unique",
    ],
    approach:
      "Kahn's algorithm (BFS topological sort): compute in-degrees, enqueue zero-in-degree nodes, process in BFS order decrementing neighbour in-degrees. If the result contains fewer nodes than n, a cycle exists.",
    code: `from collections import defaultdict, deque

def settlement_order(n: int, deps: list[list[int]]) -> list[int]:
    graph: dict[int, list[int]] = defaultdict(list)
    in_degree = [0] * n
    for a, b in deps:
        graph[a].append(b)
        in_degree[b] += 1

    queue = deque(i for i in range(n) if in_degree[i] == 0)
    order: list[int] = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nbr in graph[node]:
            in_degree[nbr] -= 1
            if in_degree[nbr] == 0:
                queue.append(nbr)

    return order if len(order) == n else []

print(settlement_order(4, [[0,1],[0,2],[1,3],[2,3]]))  # [0, 1, 2, 3] or similar
print(settlement_order(2, [[0,1],[1,0]]))               # [] (cycle)`,
    language: "python",
    complexity: { time: "O(V + E)", space: "O(V + E)" },
    leetcodeNumber: 207,
  },
  {
    id: "fin-20260723-b1-portfolio-knapsack",
    title: "Portfolio Capital Allocation (0-1 Knapsack)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Knapsack", "Finance"],
    problem:
      "A portfolio manager has a capital budget W (in units of $10k) and n investment opportunities, each requiring capital[i] units and returning expected_return[i] basis points. Select a subset of investments to maximise total expected return without exceeding the budget. Each investment can be taken at most once. Return the maximum achievable expected return.",
    examples: [
      {
        input:
          "W=10, capital=[4,5,3,7], expected_return=[120,150,90,200]",
        output: "270",
        explanation:
          "Take investments 0 (cap=4, ret=120) and 2 (cap=3, ret=90): total cap=7<=10, return=210. Or take 0 and 1: cap=9, ret=270. Best is 0+1=270.",
      },
    ],
    constraints: [
      "1 <= n <= 50",
      "1 <= W <= 500",
      "1 <= capital[i] <= W",
      "1 <= expected_return[i] <= 1000",
    ],
    approach:
      "Classic 0-1 knapsack DP: dp[w] = max total return using budget w. For each investment, iterate w from W down to capital[i] to avoid reuse. O(n*W) time.",
    code: `def max_portfolio_return(
    W: int,
    capital: list[int],
    expected_return: list[int]
) -> int:
    dp = [0] * (W + 1)
    for cap, ret in zip(capital, expected_return):
        for w in range(W, cap - 1, -1):
            dp[w] = max(dp[w], dp[w - cap] + ret)
    return dp[W]

# Example
W = 10
caps = [4, 5, 3, 7]
rets = [120, 150, 90, 200]
print(max_portfolio_return(W, caps, rets))  # 270

# Reconstruct which investments were selected
def trace_portfolio(W, capital, expected_return):
    n = len(capital)
    dp = [[0]*(W+1) for _ in range(n+1)]
    for i, (cap, ret) in enumerate(zip(capital, expected_return), 1):
        for w in range(W+1):
            dp[i][w] = dp[i-1][w]
            if w >= cap:
                dp[i][w] = max(dp[i][w], dp[i-1][w-cap] + ret)
    chosen, w = [], W
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i-1][w]:
            chosen.append(i-1)
            w -= capital[i-1]
    return chosen[::-1], dp[n][W]

selected, total = trace_portfolio(W, caps, rets)
print(f"Selected investments: {selected}, total return: {total} bps")`,
    language: "python",
    complexity: { time: "O(n * W)", space: "O(n * W)" },
    leetcodeNumber: 416,
  },
  {
    id: "fin-20260723-b1-symbol-trie",
    title: "Ticker Symbol Autocomplete (Trie)",
    difficulty: "medium",
    topics: ["Trie", "String", "Design", "Finance"],
    problem:
      "Design a symbol lookup system that supports two operations: insert(symbol) to add a ticker symbol (e.g. 'AAPL'), and search(prefix) to return all symbols starting with a given prefix, sorted lexicographically. This models the autocomplete in an order-entry terminal.",
    examples: [
      {
        input:
          "insert: AAPL, AMZN, AMAT, NVDA, NFLX; search('A'), search('AM'), search('NV')",
        output: "['AAPL','AMAT','AMZN'], ['AMAT','AMZN'], ['NVDA']",
        explanation:
          "Prefix 'A' matches all A-stocks sorted alphabetically. 'NV' matches only NVDA.",
      },
    ],
    constraints: [
      "1 <= symbol.length <= 10",
      "All symbols are uppercase English letters",
      "1 <= prefix.length <= symbol.length",
      "At most 3000 total calls",
    ],
    approach:
      "Build a trie where each node stores its children and a sorted list of complete symbols passing through it. On insert, walk the trie creating nodes and append the symbol to each node's symbol list. On search, descend to the prefix node (if it exists) and return its symbol list — already sorted at insert time.",
    code: `from collections import defaultdict

class TrieNode:
    def __init__(self):
        self.children: dict[str, "TrieNode"] = {}
        self.symbols: list[str] = []  # all symbols through this node (sorted)

class SymbolTrie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, symbol: str) -> None:
        node = self.root
        for ch in symbol:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
            # Insert in sorted order
            import bisect
            bisect.insort(node.symbols, symbol)

    def search(self, prefix: str) -> list[str]:
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return []
            node = node.children[ch]
        return node.symbols

trie = SymbolTrie()
for sym in ["AAPL", "AMZN", "AMAT", "NVDA", "NFLX"]:
    trie.insert(sym)
print(trie.search("A"))   # ['AAPL', 'AMAT', 'AMZN']
print(trie.search("AM"))  # ['AMAT', 'AMZN']
print(trie.search("NV"))  # ['NVDA']
print(trie.search("Z"))   # []`,
    language: "python",
    complexity: { time: "O(n * L) insert, O(L) search", space: "O(n * L)" },
    leetcodeNumber: 208,
  },
  {
    id: "fin-20260723-b1-rate-limiter",
    title: "Order Rate Limiter (Sliding Window Counter)",
    difficulty: "medium",
    topics: ["Sliding Window", "Design", "Queue", "Finance"],
    problem:
      "Design a rate limiter for an order management system. It should allow at most max_orders orders per time_window milliseconds. Implement: is_allowed(timestamp_ms) which returns true if the order at the given timestamp is within the rate limit, false otherwise. Timestamps are monotonically non-decreasing integers in milliseconds.",
    examples: [
      {
        input:
          "max_orders=3, time_window=1000; timestamps=[100,200,300,400,1050,1100,1150,1200,2200]",
        output: "[T,T,T,F,T,T,F,F,T]",
        explanation:
          "With max=3, window=1000ms: ts=100(OK,q=[100]), 200(OK,q=[100,200]), 300(OK,q=[100,200,300]), 400: queue has 3 entries all within 1000ms of 400, adding would make 4 -> rejected. 1050: cutoff=50, q=[100,200,300] (all >50), still 3 -> accept, q=[100,200,300,1050].",
      },
    ],
    constraints: [
      "1 <= max_orders <= 100",
      "100 <= time_window <= 10^6",
      "Timestamps are non-decreasing",
    ],
    approach:
      "Maintain a queue of timestamps of ACCEPTED requests. For each new request: pop front entries older than (timestamp - time_window). If queue length < max_orders, accept and enqueue; otherwise reject. Rejected requests do NOT go into the queue.",
    code: `from collections import deque

class OrderRateLimiter:
    def __init__(self, max_orders: int, time_window_ms: int):
        self.max_orders    = max_orders
        self.time_window   = time_window_ms
        self.accepted: deque[int] = deque()

    def is_allowed(self, timestamp_ms: int) -> bool:
        cutoff = timestamp_ms - self.time_window
        while self.accepted and self.accepted[0] <= cutoff:
            self.accepted.popleft()
        if len(self.accepted) < self.max_orders:
            self.accepted.append(timestamp_ms)
            return True
        return False

limiter = OrderRateLimiter(max_orders=3, time_window_ms=1000)
timestamps = [100, 200, 300, 400, 1050, 1100, 1150, 1200, 2200]
results = [limiter.is_allowed(t) for t in timestamps]
print(list(zip(timestamps, results)))`,
    language: "python",
    complexity: { time: "O(1) amortised", space: "O(max_orders)" },
    leetcodeNumber: 362,
  },
  {
    id: "fin-20260723-b1-merge-trade-intervals",
    title: "Merge Overlapping Trade Windows",
    difficulty: "easy",
    topics: ["Sorting", "Intervals", "Greedy", "Finance"],
    problem:
      "Given a list of trade execution windows [start, end] in seconds (e.g. from an algorithmic execution schedule), merge all overlapping windows and return the consolidated list. This is used to compute total market exposure time and detect scheduling conflicts in execution algorithms.",
    examples: [
      {
        input: "windows = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "[1,3] and [2,6] overlap, merged to [1,6]. Others are disjoint.",
      },
      {
        input: "windows = [[1,4],[4,5]]",
        output: "[[1,5]]",
        explanation: "Touching at endpoint 4 — treat as overlapping.",
      },
    ],
    constraints: [
      "1 <= windows.length <= 10^4",
      "windows[i].length == 2",
      "0 <= start <= end <= 10^4",
    ],
    approach:
      "Sort windows by start time. Maintain a running merged interval. For each window: if it overlaps (start <= prev_end), extend prev_end = max(prev_end, current_end). Otherwise, push the finished interval and start a new one.",
    code: `def merge_trade_windows(windows: list[list[int]]) -> list[list[int]]:
    if not windows:
        return []
    windows.sort(key=lambda w: w[0])
    merged = [windows[0][:]]
    for start, end in windows[1:]:
        if start <= merged[-1][1]:           # overlap or touching
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

print(merge_trade_windows([[1,3],[2,6],[8,10],[15,18]]))  # [[1,6],[8,10],[15,18]]
print(merge_trade_windows([[1,4],[4,5]]))                  # [[1,5]]

# Compute total market-exposure seconds
def total_exposure(windows: list[list[int]]) -> int:
    return sum(e - s for s, e in merge_trade_windows(windows))

print(total_exposure([[1,3],[2,6],[8,10],[15,18]]))  # (6-1)+(10-8)+(18-15) = 5+2+3 = 10`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 56,
  },
];
