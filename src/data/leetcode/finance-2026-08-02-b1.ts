import type { LeetCodeProblem } from "./index";

export const financeProblems20260802B1: LeetCodeProblem[] = [
  {
    id: "fin-20260802-b1-stock-cooldown",
    title: "Best Time to Buy and Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["Dynamic Programming", "State Machine"],
    problem:
      "You are given an array prices of stock prices indexed by day. You may complete as many transactions as you like but must observe a cooldown of 1 day after selling before you can buy again (i.e., you cannot buy on day i+1 if you sold on day i). Return the maximum profit you can achieve.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation:
          "Buy day 0 (price 1), sell day 1 (price 2), cooldown day 2, buy day 3 (price 0), sell day 4 (price 2). Profit = 1 + 2 = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
        explanation: "Only one day, no transaction possible.",
      },
    ],
    constraints: [
      "1 ≤ prices.length ≤ 5000",
      "0 ≤ prices[i] ≤ 1000",
    ],
    approach:
      "Three-state DP: held (holding stock), sold (just sold today, in cooldown), rest (not holding, not in cooldown). Transitions: held = max(held, rest - price); sold = held + price; rest = max(rest, sold). O(n) time, O(1) space.",
    code: `from typing import List

class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        held = -prices[0]   # max cash when holding stock
        sold = 0            # max cash day after selling (in cooldown)
        rest = 0            # max cash when not holding and not in cooldown

        for price in prices[1:]:
            prev_held = held
            prev_sold = sold
            prev_rest = rest
            held = max(prev_held, prev_rest - price)  # keep or buy from rest state
            sold = prev_held + price                   # sell today (was holding)
            rest = max(prev_rest, prev_sold)           # cool down or stay resting

        return max(sold, rest)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260802-b1-largest-rect-histogram",
    title: "Largest Rectangle in Histogram (Order Book Depth Profile)",
    difficulty: "hard",
    topics: ["Monotonic Stack", "Array"],
    problem:
      "In a quant context, you are given a histogram representing bid depth at each price level: heights[i] is the total quantity available at price level i. Find the largest rectangular area that can be filled from this depth profile (the largest rectangle that fits within the histogram). This represents the maximum liquidity you can execute at a contiguous price range.",
    examples: [
      {
        input: "heights = [2, 1, 5, 6, 2, 3]",
        output: "10",
        explanation:
          "The largest rectangle spans heights[2]=5 and heights[3]=6 with min height=5 and width=2, giving area=10.",
      },
      {
        input: "heights = [2, 4]",
        output: "4",
        explanation: "Single bar of height 4 gives area 4.",
      },
    ],
    constraints: [
      "1 ≤ heights.length ≤ 10^5",
      "0 ≤ heights[i] ≤ 10^4",
    ],
    approach:
      "Monotonic increasing stack: for each bar, pop all taller bars when a shorter one arrives. When popping, the popped bar's rectangle extends leftward to the new stack top and rightward to the current position. O(n) time — each bar pushed and popped once.",
    code: `from typing import List

class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        stack   = []   # monotonic increasing stack of indices
        max_area = 0
        heights  = heights + [0]   # sentinel triggers final pops

        for i, h in enumerate(heights):
            start = i
            while stack and stack[-1][1] > h:
                idx, height = stack.pop()
                width    = i - idx
                max_area = max(max_area, height * width)
                start    = idx   # extend rectangle back to this position
            stack.append((start, h))

        return max_area`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 84,
  },
  {
    id: "fin-20260802-b1-lru-cache-order",
    title: "LRU Cache for Order Lookup (Design)",
    difficulty: "medium",
    topics: ["Design", "Hash Map", "Doubly-Linked List"],
    problem:
      "Design an Order Cache with LRU (Least Recently Used) eviction policy for an order management system. Implement: get(order_id) which returns the order if it exists (and marks it recently used), returning -1 if not found; put(order_id, order_data) which inserts or updates an order, evicting the least recently used entry if capacity is exceeded.",
    examples: [
      {
        input:
          "capacity=2, put(1,100), put(2,200), get(1)->100, put(3,300), get(2)->-1, get(3)->300",
        output: "[100, -1, 300]",
        explanation:
          "After put(3,300): capacity exceeded, evict LRU (key 2 was accessed less recently than key 1). get(2) returns -1.",
      },
    ],
    constraints: [
      "1 ≤ capacity ≤ 3000",
      "0 ≤ order_id ≤ 10^4",
      "At most 2 * 10^5 calls to get and put",
    ],
    approach:
      "Doubly-linked list (for O(1) move-to-front and tail eviction) combined with a hash map (for O(1) lookup by key). Python's OrderedDict provides this natively with move_to_end. get and put are both O(1).",
    code: `from collections import OrderedDict

class OrderCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache    = OrderedDict()   # key -> value; order = access recency

    def get(self, order_id: int) -> int:
        if order_id not in self.cache:
            return -1
        self.cache.move_to_end(order_id)   # mark as most recently used
        return self.cache[order_id]

    def put(self, order_id: int, order_data: int) -> None:
        if order_id in self.cache:
            self.cache.move_to_end(order_id)
        self.cache[order_id] = order_data
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)   # evict LRU (front of OrderedDict)`,
    language: "python",
    complexity: { time: "O(1) for get and put", space: "O(capacity)" },
    leetcodeNumber: 146,
  },
  {
    id: "fin-20260802-b1-meeting-rooms-trade-schedule",
    title: "Meeting Rooms II: Minimum Trading Desks for Overlapping Trades",
    difficulty: "medium",
    topics: ["Heap", "Greedy", "Sorting"],
    problem:
      "You are a quant managing N trades, each with a start and end time (in minutes). Determine the minimum number of trading desks required so that no two overlapping trades share a desk. A desk can handle a new trade as soon as the previous one ends (not strictly after).",
    examples: [
      {
        input: "intervals = [[0,30],[5,10],[15,20]]",
        output: "2",
        explanation:
          "[0,30] and [5,10] overlap — need 2 desks. [15,20] can share the desk freed by [5,10].",
      },
      {
        input: "intervals = [[7,10],[2,4]]",
        output: "1",
        explanation: "The two intervals do not overlap.",
      },
    ],
    constraints: [
      "0 ≤ intervals.length ≤ 10^4",
      "0 ≤ start_i < end_i ≤ 10^6",
    ],
    approach:
      "Sort by start time. Use a min-heap of end times of active trades. For each trade, if the heap's minimum end time <= current start, pop it (reuse desk) and push the new end time; otherwise push new end time (new desk). Answer = max heap size. O(n log n).",
    code: `import heapq
from typing import List

class Solution:
    def minMeetingRooms(self, intervals: List[List[int]]) -> int:
        if not intervals:
            return 0

        intervals.sort(key=lambda x: x[0])   # sort by start time
        end_times = []                         # min-heap of active trade end times
        max_desks  = 0

        for start, end in intervals:
            # Free desks whose trade ended at or before this trade starts
            if end_times and end_times[0] <= start:
                heapq.heapreplace(end_times, end)   # reuse desk: pop min, push new
            else:
                heapq.heappush(end_times, end)       # new desk needed

            max_desks = max(max_desks, len(end_times))

        return max_desks`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 253,
  },
  {
    id: "fin-20260802-b1-coin-change-position-sizing",
    title: "Position Sizing: Minimum Number of Lot Sizes to Fill",
    difficulty: "medium",
    topics: ["Dynamic Programming", "BFS"],
    problem:
      "A broker offers shares in fixed lot sizes (e.g. [1, 5, 10, 50, 100] shares). You want to trade exactly target shares. Find the minimum number of lot transactions to reach exactly target shares. If it is impossible, return -1.",
    examples: [
      {
        input: "lots = [1, 5, 10], target = 11",
        output: "2",
        explanation: "10 + 1 = 11 using 2 lots.",
      },
      {
        input: "lots = [2], target = 3",
        output: "-1",
        explanation: "Cannot make exactly 3 shares using only even lots.",
      },
    ],
    constraints: [
      "1 ≤ lots.length ≤ 12",
      "1 ≤ lots[i] ≤ 2 * 10^4",
      "0 ≤ target ≤ 10^4",
    ],
    approach:
      "Standard unbounded knapsack / BFS coin change. dp[i] = min lots to reach exactly i shares. Initialise dp[0]=0, rest=inf. For each amount, iterate over lots. O(target * n) time.",
    code: `from typing import List

class Solution:
    def minLotTransactions(self, lots: List[int], target: int) -> int:
        INF = float("inf")
        dp  = [INF] * (target + 1)
        dp[0] = 0

        for amount in range(1, target + 1):
            for lot in lots:
                if lot <= amount and dp[amount - lot] + 1 < dp[amount]:
                    dp[amount] = dp[amount - lot] + 1

        return dp[target] if dp[target] != INF else -1`,
    language: "python",
    complexity: { time: "O(target * n)", space: "O(target)" },
    leetcodeNumber: 322,
  },
  {
    id: "fin-20260802-b1-random-pick-weights",
    title: "Random Pick with Weights (Monte Carlo Scenario Sampling)",
    difficulty: "medium",
    topics: ["Prefix Sum", "Binary Search", "Probability"],
    problem:
      "In a Monte Carlo risk simulation, you are given an array scenario_weights of positive floats representing the probability weight of each market scenario. Implement a ScenarioSampler that, on each call to sample(), returns a scenario index sampled proportionally to its weight. Initialisation is O(n); each sample call should be O(log n).",
    examples: [
      {
        input: "weights = [1, 3, 6]",
        output: "sample() returns 0 with prob 0.1, 1 with prob 0.3, 2 with prob 0.6",
        explanation:
          "Total weight=10. Normalised: [0.1, 0.3, 0.6]. Sample 2 most frequently.",
      },
    ],
    constraints: [
      "1 ≤ weights.length ≤ 10^4",
      "1 ≤ weights[i] ≤ 10^6",
      "At most 10^4 calls to sample",
    ],
    approach:
      "Build a prefix sum array. Each sample: draw U ~ Uniform[0, total_weight), binary search for the first prefix sum > U — that index is the sampled scenario. O(n) init, O(log n) per sample.",
    code: `import random
import bisect
from typing import List

class ScenarioSampler:
    def __init__(self, weights: List[float]):
        self.prefix = []
        cumsum = 0.0
        for w in weights:
            cumsum += w
            self.prefix.append(cumsum)
        self.total = cumsum

    def sample(self) -> int:
        target = random.random() * self.total
        # bisect_left finds first index where prefix[i] > target
        return bisect.bisect_left(self.prefix, target)`,
    language: "python",
    complexity: { time: "O(n) init, O(log n) per sample", space: "O(n)" },
    leetcodeNumber: 528,
  },
  {
    id: "fin-20260802-b1-trapping-rain-liquidity",
    title: "Trapping Rain Water (Liquidity Trap in Bid-Ask Profile)",
    difficulty: "hard",
    topics: ["Two Pointers", "Stack", "Array"],
    problem:
      "Given an elevation map heights[] representing bid quantities at each price level (the 'holes' represent price levels with no displayed quantity), compute how much total hidden liquidity can be filled in between displayed levels — i.e., how many total shares would 'pool' in the gaps between visible bid levels. This is analogous to the classic trapping rain water problem.",
    examples: [
      {
        input: "heights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]",
        output: "6",
        explanation:
          "Water trapped between the bars totals 6 units.",
      },
      {
        input: "heights = [4, 2, 0, 3, 2, 5]",
        output: "9",
        explanation: "9 units of water trapped.",
      },
    ],
    constraints: [
      "n == heights.length",
      "1 ≤ n ≤ 2 * 10^4",
      "0 ≤ heights[i] ≤ 10^5",
    ],
    approach:
      "Two-pointer: maintain left_max and right_max. At each step, advance the side with the smaller max — the trapped water at that index is min(left_max, right_max) - height[i]. O(n) time, O(1) space.",
    code: `from typing import List

class Solution:
    def trap(self, height: List[int]) -> int:
        left, right   = 0, len(height) - 1
        left_max = right_max = 0
        water     = 0

        while left < right:
            if height[left] < height[right]:
                if height[left] >= left_max:
                    left_max = height[left]
                else:
                    water += left_max - height[left]
                left += 1
            else:
                if height[right] >= right_max:
                    right_max = height[right]
                else:
                    water += right_max - height[right]
                right -= 1

        return water`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 42,
  },
  {
    id: "fin-20260802-b1-max-subarray-pnl",
    title: "Maximum Subarray (Maximum Continuous P&L Streak)",
    difficulty: "easy",
    topics: ["Dynamic Programming", "Divide and Conquer"],
    problem:
      "Given an array daily_pnl[] of daily profit-and-loss figures (can be negative), find the maximum sum of any contiguous subarray. This represents the best continuous trading streak — the period that produced the highest cumulative P&L.",
    examples: [
      {
        input: "daily_pnl = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        output: "6",
        explanation:
          "Subarray [4, -1, 2, 1] has the maximum sum of 6.",
      },
      {
        input: "daily_pnl = [1]",
        output: "1",
        explanation: "Single element.",
      },
    ],
    constraints: [
      "1 ≤ daily_pnl.length ≤ 10^5",
      "-10^4 ≤ daily_pnl[i] ≤ 10^4",
    ],
    approach:
      "Kadane's algorithm: running maximum subarray sum ending at i is max(pnl[i], prev_max + pnl[i]). Track the global maximum. O(n) time, O(1) space. The subarray represents the highest-Sharpe contiguous trading window.",
    code: `from typing import List

class Solution:
    def maxSubArray(self, daily_pnl: List[int]) -> int:
        max_ending_here = daily_pnl[0]
        max_global      = daily_pnl[0]

        for pnl in daily_pnl[1:]:
            # Either extend the previous subarray or start fresh today
            max_ending_here = max(pnl, max_ending_here + pnl)
            max_global      = max(max_global, max_ending_here)

        return max_global`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 53,
  },
  {
    id: "fin-20260802-b1-design-position-tracker",
    title: "Design Position Tracker (Running Net Long/Short)",
    difficulty: "medium",
    topics: ["Design", "Hash Map", "Sorting"],
    problem:
      "Design a PositionTracker that tracks net positions across multiple assets. Implement: execute(asset, qty, side) where side is 'buy' or 'sell', which updates the net position; net_position(asset) which returns the current net position (positive=long, negative=short); top_k_positions(k) which returns the k assets with the largest absolute net positions in descending order.",
    examples: [
      {
        input:
          "execute('AAPL','buy',100), execute('GOOG','buy',50), execute('AAPL','sell',30), net_position('AAPL')->70, top_k_positions(2)->['AAPL','GOOG']",
        output: "[70, ['AAPL', 'GOOG']]",
        explanation:
          "AAPL net = 100 - 30 = 70. GOOG net = 50. Absolute positions: AAPL=70, GOOG=50. Top-2 is [AAPL, GOOG].",
      },
    ],
    constraints: [
      "1 ≤ asset.length ≤ 10",
      "1 ≤ qty ≤ 10^6",
      "At most 10^5 operations",
      "1 ≤ k ≤ number of unique assets",
    ],
    approach:
      "Hash map stores net position per asset (O(1) update and lookup). top_k_positions uses a min-heap of size k for O(n log k) selection, or simple sort O(n log n) if called infrequently.",
    code: `import heapq
from typing import List

class PositionTracker:
    def __init__(self):
        self.positions = {}   # asset -> net position

    def execute(self, asset: str, side: str, qty: int) -> None:
        delta = qty if side == "buy" else -qty
        self.positions[asset] = self.positions.get(asset, 0) + delta

    def net_position(self, asset: str) -> int:
        return self.positions.get(asset, 0)

    def top_k_positions(self, k: int) -> List[str]:
        # Min-heap of (abs_pos, asset): O(n log k)
        heap = []
        for asset, pos in self.positions.items():
            heapq.heappush(heap, (abs(pos), asset))
            if len(heap) > k:
                heapq.heappop(heap)
        # Sort descending by absolute position
        return [asset for _, asset in sorted(heap, reverse=True)]`,
    language: "python",
    complexity: { time: "O(1) execute, O(n log k) top_k", space: "O(n)" },
  },
  {
    id: "fin-20260802-b1-dp-stock-k-transactions",
    title: "Best Time to Buy and Sell Stock (At Most K Transactions)",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Finance"],
    problem:
      "You are given an array prices and an integer k (maximum number of complete buy-sell transactions). Find the maximum profit. You may not hold more than one share at a time, and each transaction is a complete buy-sell pair.",
    examples: [
      {
        input: "k = 2, prices = [3, 2, 6, 5, 0, 3]",
        output: "7",
        explanation:
          "Buy at 2, sell at 6 (profit 4). Buy at 0, sell at 3 (profit 3). Total = 7.",
      },
      {
        input: "k = 1, prices = [1, 2]",
        output: "1",
        explanation: "Buy at 1, sell at 2.",
      },
    ],
    constraints: [
      "1 ≤ k ≤ 100",
      "1 ≤ prices.length ≤ 1000",
      "0 ≤ prices[i] ≤ 1000",
    ],
    approach:
      "DP: dp[t][i] = max profit using at most t transactions up to day i. For each transaction count t, track buy[t] = max profit after buying in t-th transaction, sell[t] = max profit after selling. If k >= n//2, use unlimited transaction formula (greedy). O(k*n) time, O(k) space.",
    code: `from typing import List

class Solution:
    def maxProfit(self, k: int, prices: List[int]) -> int:
        n = len(prices)
        if n == 0:
            return 0

        # If k >= n//2: effectively unlimited transactions
        if k >= n // 2:
            return sum(max(prices[i+1] - prices[i], 0) for i in range(n - 1))

        # dp arrays: buy[t] = max cash after buying for t-th tx,
        #            sell[t] = max cash after selling for t-th tx
        buy  = [-prices[0]] * (k + 1)
        sell = [0]           * (k + 1)

        for price in prices[1:]:
            for t in range(k, 0, -1):
                sell[t] = max(sell[t], buy[t] + price)
                buy[t]  = max(buy[t], sell[t-1] - price)

        return sell[k]`,
    language: "python",
    complexity: { time: "O(k * n)", space: "O(k)" },
    leetcodeNumber: 188,
  },
];
