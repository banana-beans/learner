import type { LeetCodeProblem } from "./index";

export const financeProblems20260731B1: LeetCodeProblem[] = [
  {
    id: "fin-20260731-b1-cooldown-stock",
    title: "Best Time to Buy/Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["Dynamic Programming", "State Machine"],
    problem:
      "You are given an integer array prices where prices[i] is the price of a stock on day i. You may buy and sell the stock as many times as you like, but after selling you must wait one day before buying again (cooldown). Return the maximum profit you can achieve.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation:
          "Buy on day 0 (price=1), sell on day 1 (price=2), cooldown day 2, buy on day 3 (price=0), sell on day 4 (price=2). Profit = 1 + 2 = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
        explanation: "Only one price — no transaction possible.",
      },
    ],
    constraints: ["1 ≤ prices.length ≤ 5000", "0 ≤ prices[i] ≤ 1000"],
    approach:
      "State machine DP with three states: hold (owning stock), sold (just sold, next is cooldown), rest (available to buy). Transition: hold = max(hold, rest - price); sold = hold_prev + price; rest = max(rest, sold_prev). Each state tracks the maximum profit achievable. O(n) time, O(1) space.",
    code: `from typing import List

class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        hold = -float("inf")  # max profit while holding stock
        sold = 0              # max profit on day just after selling
        rest = 0              # max profit in rest/cooldown state

        for price in prices:
            prev_hold = hold
            prev_sold = sold
            hold = max(hold, rest - price)   # buy from rest state only
            sold = prev_hold + price          # sell today
            rest = max(rest, prev_sold)       # cooldown or stay resting
        return max(sold, rest)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260731-b1-merge-windows",
    title: "Merge Overlapping Trading Windows",
    difficulty: "medium",
    topics: ["Array", "Sorting", "Interval"],
    problem:
      "You are given an array of trading windows intervals where intervals[i] = [start_i, end_i] (in minutes from market open). Merge all overlapping windows and return the non-overlapping result. Two windows [a, b] and [c, d] overlap if c ≤ b.",
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "[1,3] and [2,6] overlap at minute 2-3, so merge to [1,6].",
      },
      {
        input: "intervals = [[1,4],[4,5]]",
        output: "[[1,5]]",
        explanation: "Touching at 4 counts as overlapping.",
      },
    ],
    constraints: [
      "1 ≤ intervals.length ≤ 10^4",
      "intervals[i].length == 2",
      "0 ≤ start_i ≤ end_i ≤ 10^4",
    ],
    approach:
      "Sort by start time, then iterate. Maintain a running merged interval. If the current interval's start ≤ merged end, extend the merged end. Otherwise, append the merged interval and start a new one. O(n log n) for sorting, O(n) for the merge pass.",
    code: `from typing import List

class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        intervals.sort(key=lambda x: x[0])
        merged = [intervals[0]]
        for start, end in intervals[1:]:
            if start <= merged[-1][1]:           # overlaps with last window
                merged[-1][1] = max(merged[-1][1], end)
            else:
                merged.append([start, end])
        return merged`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 56,
  },
  {
    id: "fin-20260731-b1-lru-order-cache",
    title: "LRU Cache for Order Book Snapshots",
    difficulty: "medium",
    topics: ["Design", "Hash Map", "Doubly Linked List"],
    problem:
      "Design an LRU (Least Recently Used) cache of fixed capacity for storing order-book snapshots keyed by instrument ID (integer). Implement get(key) which returns the snapshot value or -1 if absent, and put(key, value) which inserts or updates a snapshot, evicting the least-recently-used entry when the cache is full. Both operations must run in O(1) average time.",
    examples: [
      {
        input:
          "LRUCache(2); put(1,1); put(2,2); get(1) → 1; put(3,3); get(2) → -1; put(4,4); get(1) → -1; get(3) → 3; get(4) → 4",
        output: "[1,-1,-1,3,4]",
        explanation:
          "After put(3,3) the cache is full and key=2 (LRU) is evicted. After put(4,4) key=1 is evicted.",
      },
    ],
    constraints: [
      "1 ≤ capacity ≤ 3000",
      "0 ≤ key ≤ 10^4",
      "0 ≤ value ≤ 10^5",
      "At most 2 * 10^5 calls total to get and put",
    ],
    approach:
      "Combine a dict {key → node} with a doubly-linked list ordered by recency. On get: move the node to the head (most-recent). On put: insert at head; if over capacity, remove the tail (LRU). O(1) for both operations because dict lookup + linked-list splice are both O(1).",
    code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cap   = capacity
        self.cache = OrderedDict()  # insertion order = recency order

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)   # mark as most-recently-used
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)  # evict LRU (front)`,
    language: "python",
    complexity: { time: "O(1) amortised", space: "O(capacity)" },
    leetcodeNumber: 146,
  },
  {
    id: "fin-20260731-b1-sliding-max-pnl",
    title: "Sliding Window Maximum Rolling PnL",
    difficulty: "hard",
    topics: ["Sliding Window", "Deque", "Monotonic Queue"],
    problem:
      "Given an array pnl of length n and an integer k, return an array of length n-k+1 where result[i] is the maximum PnL value in the window pnl[i..i+k-1]. You must solve it in O(n) time.",
    examples: [
      {
        input: "pnl = [1, 3, -1, -3, 5, 3, 6, 7], k = 3",
        output: "[3, 3, 5, 5, 6, 7]",
        explanation:
          "Window [1,3,-1]=3, [3,-1,-3]=3, [-1,-3,5]=5, [-3,5,3]=5, [5,3,6]=6, [3,6,7]=7.",
      },
    ],
    constraints: [
      "1 ≤ n ≤ 10^5",
      "-10^4 ≤ pnl[i] ≤ 10^4",
      "1 ≤ k ≤ n",
    ],
    approach:
      "Maintain a monotonic decreasing deque of indices. For each new element, pop from the back while pnl[back] ≤ pnl[i] (the new element dominates). Pop from the front when the front index falls outside the window. The front is always the window maximum. O(n) because each index is pushed and popped at most once.",
    code: `from typing import List
from collections import deque

class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        dq  = deque()   # indices, decreasing by nums value
        res = []
        for i, v in enumerate(nums):
            # Remove indices outside the window
            if dq and dq[0] < i - k + 1:
                dq.popleft()
            # Maintain decreasing order: pop smaller values from the back
            while dq and nums[dq[-1]] <= v:
                dq.pop()
            dq.append(i)
            if i >= k - 1:
                res.append(nums[dq[0]])   # front is the window max
        return res`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260731-b1-bid-histogram-rect",
    title: "Largest Rectangle in Bid-Size Histogram",
    difficulty: "hard",
    topics: ["Stack", "Monotonic Stack", "Array"],
    problem:
      "Given an array heights where heights[i] represents the total bid size at price level i of an order book, find the area of the largest rectangle that can be formed within the histogram. The rectangle must be contiguous and bounded by the heights. Return the maximum area.",
    examples: [
      {
        input: "heights = [2, 1, 5, 6, 2, 3]",
        output: "10",
        explanation: "Rectangle of height 5, width 2 (bars at index 2-3): area = 10.",
      },
      {
        input: "heights = [2, 4]",
        output: "4",
      },
    ],
    constraints: [
      "1 ≤ heights.length ≤ 10^5",
      "0 ≤ heights[i] ≤ 10^4",
    ],
    approach:
      "Monotonic increasing stack of indices. When heights[i] < heights[stack.top()], the top bar can no longer extend right. Pop it, compute its area using i as the right boundary and the new top as the left boundary. Process sentinel -1 at the end to flush the stack. O(n) because each bar is pushed and popped exactly once.",
    code: `from typing import List

class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        stack = [-1]    # sentinel for left boundary
        max_area = 0
        heights.append(0)   # sentinel to flush stack at the end

        for i, h in enumerate(heights):
            while stack[-1] != -1 and heights[stack[-1]] >= h:
                height = heights[stack.pop()]
                width  = i - stack[-1] - 1
                max_area = max(max_area, height * width)
            stack.append(i)

        heights.pop()       # restore original array
        return max_area`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 84,
  },
  {
    id: "fin-20260731-b1-connected-hedges",
    title: "Connected Hedge Relationships (Number of Components)",
    difficulty: "medium",
    topics: ["Graph", "Union-Find", "BFS/DFS"],
    problem:
      "You have n positions numbered 0 to n-1. You are given a list of edges where edges[i] = [a, b] means position a is hedged against position b (undirected). Return the number of connected groups of positions — isolated positions with no hedges count as their own group.",
    examples: [
      {
        input: "n = 5, edges = [[0,1],[1,2],[3,4]]",
        output: "2",
        explanation: "Groups: {0,1,2} and {3,4}.",
      },
      {
        input: "n = 5, edges = []",
        output: "5",
        explanation: "No hedges — each position is its own isolated group.",
      },
    ],
    constraints: [
      "1 ≤ n ≤ 2000",
      "0 ≤ edges.length ≤ n*(n-1)/2",
      "edges[i].length == 2",
      "No self-loops or duplicate edges",
    ],
    approach:
      "Union-Find with path compression and union by rank. Start with n components. For each edge, union the two nodes; if they were in different components, decrement the count. Return the final count. Alternatively, count DFS/BFS visits to unvisited nodes.",
    code: `from typing import List

class Solution:
    def countComponents(self, n: int, edges: List[List[int]]) -> int:
        parent = list(range(n))
        rank   = [0] * n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]  # path halving
                x = parent[x]
            return x

        def union(a, b):
            ra, rb = find(a), find(b)
            if ra == rb:
                return 0   # already connected
            if rank[ra] < rank[rb]:
                ra, rb = rb, ra
            parent[rb] = ra
            if rank[ra] == rank[rb]:
                rank[ra] += 1
            return 1       # merged two components

        return n - sum(union(a, b) for a, b in edges)`,
    language: "python",
    complexity: { time: "O(n + E * α(n))", space: "O(n)" },
    leetcodeNumber: 323,
  },
  {
    id: "fin-20260731-b1-min-rebalance",
    title: "Minimum Trades to Rebalance Portfolio (Coin Change)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "BFS", "Greedy"],
    problem:
      "You want to rebalance a portfolio by an integer target amount. You can execute trades of any denomination given in coins[] (each reusable). Return the minimum number of trades (coin uses) needed to hit exactly the target, or -1 if it is impossible.",
    examples: [
      {
        input: "coins = [1, 5, 10, 25], target = 36",
        output: "3",
        explanation: "25 + 10 + 1 = 36, using 3 trades.",
      },
      {
        input: "coins = [2], target = 3",
        output: "-1",
        explanation: "Target 3 is odd — cannot be reached with only denomination 2.",
      },
    ],
    constraints: [
      "1 ≤ coins.length ≤ 12",
      "1 ≤ coins[i] ≤ 2^31 - 1",
      "0 ≤ target ≤ 10^4",
    ],
    approach:
      "Classic unbounded knapsack DP. dp[i] = minimum trades to reach amount i. Initialise dp[0]=0 and dp[1..target]=infinity. For each amount i, try every coin c: dp[i] = min(dp[i], dp[i-c] + 1). Return dp[target] or -1 if still infinity. O(target * len(coins)) time.",
    code: `from typing import List

class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        INF = float("inf")
        dp  = [INF] * (amount + 1)
        dp[0] = 0
        for i in range(1, amount + 1):
            for c in coins:
                if c <= i and dp[i - c] + 1 < dp[i]:
                    dp[i] = dp[i - c] + 1
        return dp[amount] if dp[amount] < INF else -1`,
    language: "python",
    complexity: { time: "O(target × len(coins))", space: "O(target)" },
    leetcodeNumber: 322,
  },
  {
    id: "fin-20260731-b1-exposure-subset",
    title: "Can Portfolio Reach Target Notional Exposure?",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Array", "Subset Sum"],
    problem:
      "You are given an integer array notionals representing the notional exposure of each position (all positive), and a target integer. Determine if you can select a subset of the positions whose notionals sum exactly to target. Return True or False.",
    examples: [
      {
        input: "notionals = [1, 5, 11, 5], target = 11",
        output: "True",
        explanation: "Subset {11} or {1, 5, 5} both sum to 11.",
      },
      {
        input: "notionals = [1, 2, 3, 5], target = 7",
        output: "False",
        explanation: "No subset sums to 7. Closest are 6 (1+2+3) and 8 (3+5).",
      },
    ],
    constraints: [
      "1 ≤ notionals.length ≤ 200",
      "1 ≤ notionals[i] ≤ 100",
      "1 ≤ target ≤ 10^4",
    ],
    approach:
      "0/1 knapsack DP. dp is a boolean set of reachable sums. Initialise dp={0}. For each notional n, update dp |= {s+n for s in dp}. Return target in dp. Using a bitset (Python int) is especially clean: shift by n and OR. O(n * target) time, O(target) space.",
    code: `from typing import List

class Solution:
    def canPartitionTarget(self, notionals: List[int], target: int) -> bool:
        # Bitset approach: bit i of 'reachable' means sum i is achievable
        reachable = 1   # bit 0 = empty subset (sum 0)
        for n in notionals:
            reachable |= reachable << n     # add n to every reachable sum
        return bool(reachable >> target & 1)`,
    language: "python",
    complexity: { time: "O(n × target)", space: "O(target)" },
    leetcodeNumber: 416,
  },
  {
    id: "fin-20260731-b1-sliding-max-pnl-k",
    title: "Kth Largest Order Size (Min-Heap)",
    difficulty: "medium",
    topics: ["Heap", "Sorting", "Array"],
    problem:
      "Given an integer array order_sizes and an integer k, return the kth largest order size in the array. Note that the kth largest is the kth largest in sorted descending order, not the kth distinct element.",
    examples: [
      {
        input: "order_sizes = [3, 2, 1, 5, 6, 4], k = 2",
        output: "5",
        explanation: "Sorted descending: [6,5,4,3,2,1]. The 2nd largest is 5.",
      },
      {
        input: "order_sizes = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4",
        output: "4",
      },
    ],
    constraints: [
      "1 ≤ k ≤ order_sizes.length ≤ 10^4",
      "-10^4 ≤ order_sizes[i] ≤ 10^4",
    ],
    approach:
      "Maintain a min-heap of size k. Push each element; if the heap grows beyond k, pop the minimum. After processing all elements, the heap top (minimum) is the kth largest. O(n log k) time and O(k) space — better than full sorting when k is small.",
    code: `from typing import List
import heapq

class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        heap = []   # min-heap of size k
        for n in nums:
            heapq.heappush(heap, n)
            if len(heap) > k:
                heapq.heappop(heap)   # evict the smallest
        return heap[0]   # smallest in the top-k = kth largest`,
    language: "python",
    complexity: { time: "O(n log k)", space: "O(k)" },
    leetcodeNumber: 215,
  },
  {
    id: "fin-20260731-b1-min-heap-order",
    title: "Top-K Frequent Trading Symbols (Bucket Sort / Heap)",
    difficulty: "medium",
    topics: ["Hash Map", "Heap", "Bucket Sort"],
    problem:
      "Given an array symbols of ticker strings, return the k most frequently traded symbols in decreasing order of frequency. If two symbols have the same frequency, return them in any order.",
    examples: [
      {
        input: 'symbols = ["AAPL","MSFT","AAPL","GOOG","MSFT","AAPL"], k = 2',
        output: '["AAPL","MSFT"]',
        explanation: "AAPL appears 3 times, MSFT 2 times, GOOG 1 time.",
      },
      {
        input: 'symbols = ["TSLA","TSLA","AMZN","AMZN"], k = 2',
        output: '["TSLA","AMZN"]',
      },
    ],
    constraints: [
      "1 ≤ symbols.length ≤ 10^5",
      "k is in the range [1, number of unique symbols]",
    ],
    approach:
      "Count frequencies with a dict. Use a min-heap of size k: push (freq, sym) tuples; pop when size exceeds k so only the top-k remain. Extract and reverse. O(n log k) time. Alternative O(n) bucket-sort: create n+1 buckets by frequency, scan from highest bucket down.",
    code: `from typing import List
from collections import Counter
import heapq

class Solution:
    def topKFrequent(self, symbols: List[str], k: int) -> List[str]:
        freq = Counter(symbols)
        # Min-heap keeps the k most frequent symbols
        heap = []
        for sym, cnt in freq.items():
            heapq.heappush(heap, (cnt, sym))
            if len(heap) > k:
                heapq.heappop(heap)   # drop least-frequent
        return [sym for _, sym in heap]`,
    language: "python",
    complexity: { time: "O(n log k)", space: "O(n)" },
    leetcodeNumber: 347,
  },
];
