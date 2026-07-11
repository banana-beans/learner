import { LeetCodeProblem } from "./index";

export const financeProblems20260711B1: LeetCodeProblem[] = [
  {
    id: "fin-20260711-b1-kway-merge",
    title: "K-Way Merge of Sorted Price Streams",
    difficulty: "medium",
    topics: ["Heap", "Merge", "Greedy"],
    problem:
      "You receive K sorted streams of (timestamp, price) pairs from K different exchanges. Merge all streams into a single sorted-by-timestamp output. Each stream is a list sorted in ascending timestamp order.",
    examples: [
      {
        input:
          "streams = [[(1,100),(3,101)], [(2,99),(4,102)], [(1,100),(5,103)]]",
        output: "[(1,100),(1,100),(2,99),(3,101),(4,102),(5,103)]",
        explanation:
          "Min-heap tracks the current head of each stream; repeatedly extract the minimum timestamp.",
      },
    ],
    constraints: [
      "1 <= K <= 10^4",
      "0 <= len(stream_i) <= 10^5",
      "Total elements <= 10^6",
      "Timestamps may be equal (stable merge by stream index)",
    ],
    approach:
      "Min-heap of (timestamp, price, stream_idx, element_idx). Pop min, push next element from that stream. O(N log K) time, O(K) space.",
    code: `import heapq
from typing import List, Tuple

def merge_price_streams(
    streams: List[List[Tuple[int, float]]]
) -> List[Tuple[int, float]]:
    heap = []
    for k, stream in enumerate(streams):
        if stream:
            ts, px = stream[0]
            heapq.heappush(heap, (ts, k, 0, px))  # (ts, stream_id, idx, price)

    result = []
    while heap:
        ts, k, idx, px = heapq.heappop(heap)
        result.append((ts, px))
        nxt = idx + 1
        if nxt < len(streams[k]):
            nts, npx = streams[k][nxt]
            heapq.heappush(heap, (nts, k, nxt, npx))

    return result`,
    language: "python",
    complexity: { time: "O(N log K)", space: "O(K)" },
    leetcodeNumber: 23,
  },
  {
    id: "fin-20260711-b1-histogram-rect",
    title: "Largest Rectangle in Histogram (Max Arbitrage Window)",
    difficulty: "hard",
    topics: ["Stack", "Monotonic Stack", "Array"],
    problem:
      "Given an array of bar heights representing the bid-ask spread compressed to bars over time, find the largest contiguous rectangular region (max arbitrage window). This is equivalent to LeetCode #84: Largest Rectangle in Histogram.",
    examples: [
      {
        input: "heights = [2, 1, 5, 6, 2, 3]",
        output: "10",
        explanation:
          "Rectangle of height 5 spanning indices 2-3 gives area 5×2=10.",
      },
      {
        input: "heights = [2, 4]",
        output: "4",
      },
    ],
    constraints: [
      "1 <= n <= 10^5",
      "0 <= heights[i] <= 10^4",
    ],
    approach:
      "Monotonic increasing stack. For each bar, pop the stack when the current bar is shorter. The popped bar is the height; width spans from current index back to the new stack top. Track the maximum. O(n) time, O(n) space.",
    code: `def largest_rectangle(heights):
    stack = []   # indices of bars in increasing height order
    max_area = 0
    n = len(heights)

    for i in range(n + 1):
        h = 0 if i == n else heights[i]
        while stack and heights[stack[-1]] > h:
            height = heights[stack.pop()]
            width  = i if not stack else i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)

    return max_area`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 84,
  },
  {
    id: "fin-20260711-b1-meeting-rooms2",
    title: "Minimum Trading Platforms (Meeting Rooms II)",
    difficulty: "medium",
    topics: ["Heap", "Greedy", "Sorting", "Intervals"],
    problem:
      "Given N trading sessions as (start, end) intervals, find the minimum number of trading platforms (rooms) needed to run all sessions without overlap. This is the classic Meeting Rooms II problem applied to financial scheduling.",
    examples: [
      {
        input: "sessions = [(0,30),(5,10),(15,20)]",
        output: "2",
        explanation:
          "Sessions (0,30) and (5,10) overlap, requiring 2 platforms. (15,20) can reuse the platform freed by (5,10).",
      },
      {
        input: "sessions = [(7,10),(2,4)]",
        output: "1",
        explanation: "Sessions do not overlap — one platform suffices.",
      },
    ],
    constraints: [
      "1 <= n <= 10^4",
      "0 <= start_i < end_i <= 10^6",
    ],
    approach:
      "Sort by start time. Use a min-heap of end times. For each session, if the earliest ending session has finished, reuse its slot (pop the heap). Otherwise add a new platform. Heap size = answer.",
    code: `import heapq

def min_trading_platforms(sessions):
    if not sessions:
        return 0
    sessions.sort(key=lambda x: x[0])
    heap = []  # min-heap of end times
    for start, end in sessions:
        if heap and heap[0] <= start:
            heapq.heapreplace(heap, end)  # reuse earliest-ending platform
        else:
            heapq.heappush(heap, end)     # need a new platform
    return len(heap)`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 253,
  },
  {
    id: "fin-20260711-b1-task-scheduler",
    title: "Order Scheduler with Cooldown",
    difficulty: "medium",
    topics: ["Greedy", "Heap", "Counting", "Array"],
    problem:
      "An exchange processes order types A–Z. After processing an order of type X, the same type cannot be processed again for `n` time slots (cooldown). Given a list of order types and cooldown n, return the minimum total slots to process all orders. This mirrors LeetCode #621: Task Scheduler.",
    examples: [
      {
        input: 'orders = ["A","A","A","B","B","B"], n = 2',
        output: "8",
        explanation: "A -> B -> idle -> A -> B -> idle -> A -> B",
      },
      {
        input: 'orders = ["A","A","A","B","B","B"], n = 0',
        output: "6",
        explanation: "No cooldown needed.",
      },
    ],
    constraints: [
      "1 <= orders.length <= 10^4",
      "orders[i] is uppercase English letter",
      "0 <= n <= 100",
    ],
    approach:
      "Count frequencies. Most frequent order determines the minimum schedule. Formula: max(len(orders), (max_freq-1)*(n+1) + count_of_max_freq). This greedy avoids simulating the entire schedule.",
    code: `from collections import Counter

def min_order_slots(orders, n):
    freq = Counter(orders)
    counts = sorted(freq.values(), reverse=True)
    max_freq   = counts[0]
    max_count  = counts.count(max_freq)
    # Minimum slots: fill frames of (n+1) around most frequent type
    return max(len(orders), (max_freq - 1) * (n + 1) + max_count)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 621,
  },
  {
    id: "fin-20260711-b1-coin-change",
    title: "Portfolio Denomination: Minimum Coins",
    difficulty: "medium",
    topics: ["Dynamic Programming", "BFS"],
    problem:
      "A portfolio must reach exactly a target notional using available denomination sizes (bond face values). Return the minimum number of bonds needed. If impossible, return -1. This is LeetCode #322: Coin Change.",
    examples: [
      {
        input: "denominations = [1, 5, 10, 25], target = 41",
        output: "4",
        explanation: "25 + 10 + 5 + 1 = 41, 4 bonds.",
      },
      {
        input: "denominations = [2], target = 3",
        output: "-1",
        explanation: "Cannot reach 3 with only even denominations.",
      },
    ],
    constraints: [
      "1 <= denominations.length <= 12",
      "1 <= denominations[i] <= 2^31-1",
      "0 <= target <= 10^4",
    ],
    approach:
      "Bottom-up DP: dp[i] = min coins to reach amount i. For each amount, try all denominations. dp[0]=0, dp[i]=min(dp[i-d]+1) for each d. O(target×len(denominations)) time.",
    code: `def min_bonds(denominations, target):
    dp = [float('inf')] * (target + 1)
    dp[0] = 0
    for amount in range(1, target + 1):
        for d in denominations:
            if d <= amount and dp[amount - d] + 1 < dp[amount]:
                dp[amount] = dp[amount - d] + 1
    return dp[target] if dp[target] != float('inf') else -1`,
    language: "python",
    complexity: { time: "O(target × D)", space: "O(target)" },
    leetcodeNumber: 322,
  },
  {
    id: "fin-20260711-b1-jump-game-2",
    title: "Jump Game II: Minimum Market Hops",
    difficulty: "medium",
    topics: ["Greedy", "BFS", "Array"],
    problem:
      "You are scanning market microstructure levels. At each level i you can advance up to levels[i] steps forward. Return the minimum number of jumps to reach the last level. This is LeetCode #45: Jump Game II.",
    examples: [
      {
        input: "levels = [2, 3, 1, 1, 4]",
        output: "2",
        explanation: "Jump from index 0 to 1 (length 1), then to 4 (length 3).",
      },
      {
        input: "levels = [2, 3, 0, 1, 4]",
        output: "2",
      },
    ],
    constraints: [
      "1 <= n <= 10^4",
      "0 <= levels[i] <= 1000",
      "It is always possible to reach the last level.",
    ],
    approach:
      "Greedy BFS: track current jump's farthest reach and current boundary. When i crosses the boundary, take a jump and update boundary to farthest. O(n) time, O(1) space.",
    code: `def min_jumps(levels):
    jumps = cur_end = farthest = 0
    for i in range(len(levels) - 1):
        farthest = max(farthest, i + levels[i])
        if i == cur_end:
            jumps += 1
            cur_end = farthest
    return jumps`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 45,
  },
  {
    id: "fin-20260711-b1-dijkstra-fx",
    title: "Dijkstra Minimum-Cost FX Conversion",
    difficulty: "medium",
    topics: ["Graph", "Dijkstra", "Heap", "Shortest Path"],
    problem:
      "Given a directed weighted graph of currency pairs where each edge has a fee, find the minimum total fee path to convert from source currency S to target currency T. Edge weight represents transaction cost in basis points.",
    examples: [
      {
        input:
          "currencies = 4, edges = [(0,1,10),(0,2,5),(1,3,1),(2,1,3),(2,3,2)], src=0, dst=3",
        output: "7",
        explanation:
          "Path 0→2→3 costs 5+2=7. Path 0→2→1→3 costs 5+3+1=9. Path 0→1→3 costs 11.",
      },
    ],
    constraints: [
      "2 <= currencies <= 10^4",
      "1 <= edges <= 10^5",
      "0 <= cost <= 10^4",
    ],
    approach:
      "Standard Dijkstra with min-heap. Priority queue stores (total_cost, node). On pop, if node already visited with lower cost, skip. Relax neighbours. O((V+E) log V) time.",
    code: `import heapq

def min_fx_cost(n_currencies, edges, src, dst):
    adj = [[] for _ in range(n_currencies)]
    for u, v, cost in edges:
        adj[u].append((v, cost))

    dist = [float('inf')] * n_currencies
    dist[src] = 0
    heap = [(0, src)]

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, cost in adj[u]:
            nd = d + cost
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(heap, (nd, v))

    return dist[dst] if dist[dst] != float('inf') else -1`,
    language: "python",
    complexity: { time: "O((V+E) log V)", space: "O(V+E)" },
    leetcodeNumber: 743,
  },
  {
    id: "fin-20260711-b1-lis-trend",
    title: "Longest Increasing Subsequence for Bull Trend Detection",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Binary Search", "Array"],
    problem:
      "Given a time series of closing prices, find the length of the longest strictly increasing subsequence (LIS). This identifies the longest bull trend (non-contiguous) embedded in the price series. This is LeetCode #300: Longest Increasing Subsequence.",
    examples: [
      {
        input: "prices = [10, 9, 2, 5, 3, 7, 101, 18]",
        output: "4",
        explanation:
          "Longest increasing subsequence: [2, 3, 7, 101] or [2, 5, 7, 101], length 4.",
      },
      {
        input: "prices = [0, 1, 0, 3, 2, 3]",
        output: "4",
      },
    ],
    constraints: [
      "1 <= n <= 2500",
      "−10^4 <= prices[i] <= 10^4",
    ],
    approach:
      "Patience sorting: maintain a list `tails` where tails[i] is the smallest tail element of an IS of length i+1. Use binary search to find where to insert/replace each new element. O(n log n) time.",
    code: `import bisect

def lis_bull_trend(prices):
    tails = []
    for p in prices:
        pos = bisect.bisect_left(tails, p)
        if pos == len(tails):
            tails.append(p)
        else:
            tails[pos] = p
    return len(tails)`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 42,
  },
  {
    id: "fin-20260711-b1-trap-water",
    title: "Trapping Rain Water / Capital Buffer Analysis",
    difficulty: "hard",
    topics: ["Two Pointers", "Stack", "Dynamic Programming"],
    problem:
      "Given elevation values representing capital reserve levels across n time periods, compute how much total excess liquidity can be trapped between periods — water that stays above the local lows but below the surrounding peaks. This is LeetCode #42: Trapping Rain Water.",
    examples: [
      {
        input: "height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]",
        output: "6",
        explanation:
          "6 units of 'water' trapped between the peaks.",
      },
      {
        input: "height = [4, 2, 0, 3, 2, 5]",
        output: "9",
      },
    ],
    constraints: [
      "n == height.length",
      "1 <= n <= 2 × 10^4",
      "0 <= height[i] <= 10^5",
    ],
    approach:
      "Two-pointer approach: maintain left_max and right_max. The pointer with the smaller max moves inward; water at that position is (min_max - height[i]). O(n) time, O(1) space.",
    code: `def trap_water(height):
    left, right = 0, len(height) - 1
    left_max = right_max = 0
    total = 0
    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                total += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                total += right_max - height[right]
            right -= 1
    return total`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 42,
  },
];
