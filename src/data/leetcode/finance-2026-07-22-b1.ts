import type { LeetCodeProblem } from "./index";

export const financeProblems20260722B1: LeetCodeProblem[] = [
  {
    id: "fin-20260722-b1-sliding-window-max-bid",
    title: "Sliding Window Maximum Bid Price",
    difficulty: "medium",
    topics: ["Sliding Window", "Monotonic Deque", "Array"],
    problem:
      "Given an array of bid prices and a window size k, return the maximum bid price in each sliding window of size k. This models a rolling high-water mark for intraday price momentum signals.",
    examples: [
      {
        input: "prices = [7, 2, 4, 3, 9, 1, 5, 6], k = 3",
        output: "[7, 4, 9, 9, 9, 6]",
        explanation:
          "Windows: [7,2,4]->7, [2,4,3]->4, [4,3,9]->9, [3,9,1]->9, [9,1,5]->9, [1,5,6]->6.",
      },
    ],
    constraints: [
      "1 <= k <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^9",
    ],
    approach:
      "Maintain a monotonic deque of indices in decreasing price order. At each step, pop the front if it's outside the window, pop the back while back price <= current price, then push current index. Front of deque is always the max.",
    code: `from collections import deque

def max_sliding_window(prices: list[int], k: int) -> list[int]:
    dq = deque()   # stores indices, prices are decreasing
    result = []
    for i, p in enumerate(prices):
        # Remove indices outside window
        if dq and dq[0] < i - k + 1:
            dq.popleft()
        # Maintain decreasing order
        while dq and prices[dq[-1]] <= p:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            result.append(prices[dq[0]])
    return result`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260722-b1-meeting-rooms-ii",
    title: "Trading Sessions Overlap (Min Desks)",
    difficulty: "medium",
    topics: ["Greedy", "Heap", "Sorting", "Intervals"],
    problem:
      "Given a list of trading session intervals [start, end], return the minimum number of trading desks required so that no two overlapping sessions share a desk. This is the interval scheduling resource problem.",
    examples: [
      {
        input: "intervals = [[0,30],[5,10],[15,20]]",
        output: "2",
        explanation:
          "[0,30] overlaps with both others, but [5,10] and [15,20] don't overlap, so 2 desks suffice.",
      },
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "0 <= start < end <= 10^6",
    ],
    approach:
      "Sort by start time. Use a min-heap of end times (one entry per desk). For each interval, if the earliest-ending desk finishes before our start, reuse it (pop and push new end). Otherwise allocate a new desk (just push). Heap size is the answer.",
    code: `import heapq

def min_meeting_rooms(intervals: list[list[int]]) -> int:
    if not intervals:
        return 0
    intervals.sort(key=lambda x: x[0])
    heap = []   # min-heap of end times
    for start, end in intervals:
        if heap and heap[0] <= start:
            heapq.heapreplace(heap, end)
        else:
            heapq.heappush(heap, end)
    return len(heap)`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 253,
  },
  {
    id: "fin-20260722-b1-lru-price-cache",
    title: "LRU Price Cache for Market Data",
    difficulty: "medium",
    topics: ["Design", "Hash Map", "Doubly Linked List"],
    problem:
      "Design an LRU (Least Recently Used) cache for market data lookups with O(1) get and put. Model a fixed-capacity cache storing the most recently accessed instrument prices.",
    examples: [
      {
        input:
          'cache = LRUCache(2); cache.put("AAPL",182); cache.put("GOOG",140); cache.get("AAPL"); cache.put("MSFT",380); cache.get("GOOG")',
        output: "-1",
        explanation:
          'After MSFT is inserted the cache is full and GOOG (LRU) is evicted, so get("GOOG") returns -1.',
      },
    ],
    constraints: ["1 <= capacity <= 3000", "O(1) average for get and put"],
    approach:
      "Combine a dict (key->node) with a doubly-linked list ordered by recency. get moves the node to the head; put inserts at head and evicts from tail when over capacity.",
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache: OrderedDict = OrderedDict()

    def get(self, key) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)   # evict LRU`,
    language: "python",
    complexity: { time: "O(1) amortised", space: "O(capacity)" },
    leetcodeNumber: 146,
  },
  {
    id: "fin-20260722-b1-kth-largest-pnl",
    title: "Kth Largest P&L Stream",
    difficulty: "easy",
    topics: ["Heap", "Design", "Data Structures"],
    problem:
      "Design a class that maintains a stream of daily P&L values and returns the kth largest at any point. Used to track the kth-best day in a rolling risk review.",
    examples: [
      {
        input: "k=3, initial=[4,5,8,2]; then add(3), add(5), add(10), add(9), add(4)",
        output: "[4, 5, 5, 8, 8]",
        explanation:
          "After each add the 3rd largest among all values seen so far.",
      },
    ],
    constraints: ["1 <= k <= 10^4", "0 <= val <= 10^9"],
    approach:
      "Keep a min-heap of size k. Adding a new value: push then pop if size exceeds k. The heap's minimum (heap[0]) is always the kth largest.",
    code: `import heapq

class KthLargest:
    def __init__(self, k: int, nums: list[int]):
        self.k = k
        self.heap = []
        for n in nums:
            self.add(n)

    def add(self, val: int) -> int:
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)
        return self.heap[0]`,
    language: "python",
    complexity: { time: "O(log k) per add", space: "O(k)" },
    leetcodeNumber: 703,
  },
  {
    id: "fin-20260722-b1-dp-best-trade-cooldown",
    title: "Stock Trade with Cooldown",
    difficulty: "medium",
    topics: ["Dynamic Programming", "State Machine", "Finance"],
    problem:
      "Given daily stock prices, maximise profit with unlimited trades but a 1-day cooldown after each sell (you cannot buy on the day immediately after you sell). Models a mean-reversion strategy with mandatory reset periods.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation:
          "Buy on day 1 (price=1), sell on day 2 (price=2), cooldown day 3, buy on day 4 (price=0), sell on day 5 (price=2). Profit=2+2-1=3.",
      },
    ],
    constraints: ["1 <= prices.length <= 5000", "0 <= prices[i] <= 1000"],
    approach:
      "Three states: HOLD (own stock), SOLD (just sold, must cool down), COOL (cooled down, can buy). Transitions: HOLD->max(HOLD, COOL-price); SOLD->HOLD+price; COOL->max(COOL, SOLD).",
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    hold = -float("inf")
    sold = 0
    cool = 0
    for p in prices:
        prev_hold = hold
        prev_sold = sold
        prev_cool = cool
        hold = max(prev_hold, prev_cool - p)
        sold = prev_hold + p
        cool = max(prev_cool, prev_sold)
    return max(sold, cool)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260722-b1-word-break-ticker",
    title: "Ticker Sequence Segmentation",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Hash Set", "String"],
    problem:
      "Given a string of concatenated ticker symbols and a dictionary of valid tickers, determine if the string can be segmented into valid tickers. Models parsing compact FIX message tag values.",
    examples: [
      {
        input: 'msg = "AAPLGOOGL", tickers = ["AAPL","GOOG","GOOGL","L"]',
        output: "True",
        explanation: '"AAPL" + "GOOGL" segments the string.',
      },
    ],
    constraints: [
      "1 <= msg.length <= 300",
      "1 <= tickers.length <= 1000",
      "1 <= ticker.length <= 20",
    ],
    approach:
      "DP where dp[i] = True if msg[:i] can be segmented. For each i, check all j<i: if dp[j] and msg[j:i] in ticker_set, set dp[i]=True. Return dp[n].",
    code: `def can_segment_tickers(msg: str, tickers: list[str]) -> bool:
    ticker_set = set(tickers)
    n = len(msg)
    dp = [False] * (n + 1)
    dp[0] = True
    max_len = max(len(t) for t in tickers)
    for i in range(1, n + 1):
        for j in range(max(0, i - max_len), i):
            if dp[j] and msg[j:i] in ticker_set:
                dp[i] = True
                break
    return dp[n]`,
    language: "python",
    complexity: { time: "O(n * max_len)", space: "O(n)" },
    leetcodeNumber: 139,
  },
  {
    id: "fin-20260722-b1-two-sum-sorted",
    title: "Two-Sum on Sorted Bid/Ask Spread",
    difficulty: "easy",
    topics: ["Two Pointers", "Array", "Binary Search"],
    problem:
      "Given a sorted array of order prices and a target spread, find two prices that sum to the target. Returns the 1-indexed positions. Models matching a buy and sell order that together equal a notional target.",
    examples: [
      {
        input: "prices = [2, 7, 11, 15], target = 9",
        output: "[1, 2]",
        explanation: "prices[0] + prices[1] = 2 + 7 = 9.",
      },
    ],
    constraints: [
      "2 <= prices.length <= 3 * 10^4",
      "-1000 <= prices[i] <= 1000",
      "Exactly one solution exists",
    ],
    approach:
      "Two pointers: left=0, right=n-1. If sum==target return; if sum<target move left right; else move right left. O(n) time and O(1) space since array is sorted.",
    code: `def two_sum_sorted(prices: list[int], target: int) -> list[int]:
    lo, hi = 0, len(prices) - 1
    while lo < hi:
        s = prices[lo] + prices[hi]
        if s == target:
            return [lo + 1, hi + 1]
        elif s < target:
            lo += 1
        else:
            hi -= 1
    return []   # guaranteed to find`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 167,
  },
  {
    id: "fin-20260722-b1-serialize-order-tree",
    title: "Serialise / Deserialise Order Book Tree",
    difficulty: "hard",
    topics: ["Tree", "BFS", "Design", "String"],
    problem:
      "Design an algorithm to serialise a binary tree representing an order book hierarchy (e.g. sector -> sub-sector -> instrument) to a string and deserialise it back to the original tree. The tree must round-trip exactly.",
    examples: [
      {
        input: "root = [EQUITIES, [US, [AAPL, null, null], [GOOG, null, null]], [EU, null, null]]",
        output: '"EQUITIES,US,EU,AAPL,GOOG,null,null,null,null,null,null"',
        explanation: "BFS level-order serialisation with null markers.",
      },
    ],
    constraints: [
      "0 <= nodes <= 10^4",
      "Node values are non-empty strings",
      "No commas in node values",
    ],
    approach:
      "Serialise with BFS, appending 'null' for missing children. Deserialise with BFS: split by comma, use a queue to assign children to each non-null node in order.",
    code: `from collections import deque

class TreeNode:
    def __init__(self, val="", left=None, right=None):
        self.val, self.left, self.right = val, left, right

def serialize(root) -> str:
    if not root:
        return ""
    q, parts = deque([root]), []
    while q:
        node = q.popleft()
        if node:
            parts.append(node.val)
            q.append(node.left)
            q.append(node.right)
        else:
            parts.append("null")
    return ",".join(parts)

def deserialize(data: str):
    if not data:
        return None
    vals = data.split(",")
    root = TreeNode(vals[0])
    q = deque([root])
    i = 1
    while q and i < len(vals):
        node = q.popleft()
        if vals[i] != "null":
            node.left = TreeNode(vals[i])
            q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] != "null":
            node.right = TreeNode(vals[i])
            q.append(node.right)
        i += 1
    return root`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 297,
  },
  {
    id: "fin-20260722-b1-number-of-islands-sectors",
    title: "Connected Sectors in Market Graph",
    difficulty: "medium",
    topics: ["BFS", "DFS", "Union-Find", "Graph"],
    problem:
      "Given an n×m grid where 1 represents an active trading sector and 0 represents an inactive sector, count the number of isolated groups of connected sectors (4-directional). Models clustering correlated risk sectors.",
    examples: [
      {
        input:
          'grid = [["1","1","0","0"],["1","1","0","0"],["0","0","1","0"],["0","0","0","1"]]',
        output: "3",
        explanation: "Three isolated clusters of active sectors.",
      },
    ],
    constraints: [
      "1 <= n, m <= 300",
      "grid[i][j] is '0' or '1'",
    ],
    approach:
      "DFS/BFS flood-fill: iterate the grid; when a '1' is found, increment count and flood-fill the cluster to '0' to avoid revisiting. Time is O(n*m).",
    code: `def num_islands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    n, m = len(grid), len(grid[0])
    count = 0

    def dfs(r, c):
        if r < 0 or r >= n or c < 0 or c >= m or grid[r][c] != "1":
            return
        grid[r][c] = "0"
        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)

    for i in range(n):
        for j in range(m):
            if grid[i][j] == "1":
                count += 1
                dfs(i, j)
    return count`,
    language: "python",
    complexity: { time: "O(n * m)", space: "O(n * m) recursion stack" },
    leetcodeNumber: 200,
  },
  {
    id: "fin-20260722-b1-min-path-sum-fees",
    title: "Minimum Transaction Fee Path",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Grid", "Finance"],
    problem:
      "Given an m×n grid where each cell contains a non-negative transaction fee, find the path from top-left to bottom-right (moving only right or down) that minimises the total fee. Models least-cost routing through a trading network.",
    examples: [
      {
        input: "grid = [[1,3,1],[1,5,1],[4,2,1]]",
        output: "7",
        explanation: "Path: 1→3→1→1→1 = 7.",
      },
    ],
    constraints: [
      "1 <= m, n <= 200",
      "0 <= grid[i][j] <= 200",
    ],
    approach:
      "DP in-place: dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]). First row and column are cumulative sums. Answer is dp[m-1][n-1].",
    code: `def min_path_sum(grid: list[list[int]]) -> int:
    m, n = len(grid), len(grid[0])
    for i in range(m):
        for j in range(n):
            if i == 0 and j == 0:
                continue
            elif i == 0:
                grid[i][j] += grid[i][j-1]
            elif j == 0:
                grid[i][j] += grid[i-1][j]
            else:
                grid[i][j] += min(grid[i-1][j], grid[i][j-1])
    return grid[m-1][n-1]`,
    language: "python",
    complexity: { time: "O(m * n)", space: "O(1)" },
    leetcodeNumber: 64,
  },
];
