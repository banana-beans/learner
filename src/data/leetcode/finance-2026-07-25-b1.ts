import type { LeetCodeProblem } from "./index";

export const financeProblems20260725B1: LeetCodeProblem[] = [
  {
    id: "fin-20260725-b1-meeting-rooms-ii",
    title: "Meeting Rooms II — Position Consolidation Windows",
    difficulty: "medium",
    topics: ["heap", "greedy", "intervals"],
    leetcodeNumber: 253,
    problem:
      "You are given an array of position intervals intervals[i] = [open_i, close_i] representing when positions are open. Find the minimum number of settlement desks needed so every position can be processed without overlap. Each desk handles one position at a time.",
    examples: [
      {
        input: "intervals = [[0,30],[5,10],[15,20]]",
        output: "2",
        explanation:
          "Desk 1 handles [0,30]; desk 2 handles [5,10] and then [15,20].",
      },
      {
        input: "intervals = [[7,10],[2,4]]",
        output: "1",
        explanation: "Both can be handled sequentially on one desk.",
      },
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "0 <= start_i < end_i <= 10^6",
    ],
    approach:
      "Sort by start time. Use a min-heap of end times. For each interval, if the earliest-ending desk frees up before this interval starts, reuse it (pop and push new end). Otherwise allocate a new desk (push new end). Heap size at end = answer.",
    code: `import heapq

def min_settlement_desks(intervals: list[list[int]]) -> int:
    if not intervals:
        return 0
    intervals.sort(key=lambda x: x[0])
    heap: list[int] = []          # min-heap of end times
    for start, end in intervals:
        if heap and heap[0] <= start:
            heapq.heapreplace(heap, end)
        else:
            heapq.heappush(heap, end)
    return len(heap)

# Example
print(min_settlement_desks([[0,30],[5,10],[15,20]]))  # 2`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260725-b1-gas-station",
    title: "Gas Station — Circular Portfolio Rebalancing",
    difficulty: "medium",
    topics: ["greedy", "array"],
    leetcodeNumber: 134,
    problem:
      "A portfolio manager must rebalance n assets in a fixed circular order. Asset i provides gain[i] liquidity units when sold but requires cost[i] to purchase the next asset. Starting with zero liquidity, find the starting index from which the full rebalancing circuit completes, or return -1 if no valid start exists.",
    examples: [
      {
        input: "gain = [1,2,3,4,5], cost = [3,4,5,1,2]",
        output: "3",
        explanation: "Start at index 3 (gain 4, cost 1 → +3 buffer) and complete the full cycle.",
      },
      {
        input: "gain = [2,3,4], cost = [3,4,3]",
        output: "-1",
        explanation: "Total gain (9) < total cost (10), impossible.",
      },
    ],
    constraints: ["n == gain.length == cost.length", "1 <= n <= 10^5", "0 <= gain[i], cost[i] <= 10^4"],
    approach:
      "If total surplus < 0, return -1. Otherwise exactly one valid start exists. Greedily track running surplus; whenever it goes negative, reset the candidate start to i+1 and reset surplus to 0. The candidate at the end is the answer.",
    code: `def can_complete_circuit(gain: list[int], cost: list[int]) -> int:
    if sum(gain) < sum(cost):
        return -1
    surplus = 0
    start = 0
    for i, (g, c) in enumerate(zip(gain, cost)):
        surplus += g - c
        if surplus < 0:
            surplus = 0
            start = i + 1
    return start

print(can_complete_circuit([1,2,3,4,5], [3,4,5,1,2]))  # 3`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260725-b1-trapping-rainwater",
    title: "Trapping Rain Water — Liquidity Capture in Order Book",
    difficulty: "hard",
    topics: ["two-pointers", "stack", "array"],
    leetcodeNumber: 42,
    problem:
      "An order book depth chart is represented by height[i], the bid/ask size at price level i. Compute total liquidity trapped between peaks — i.e., how much volume can be absorbed across the spread valleys without flowing out either side.",
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation: "6 units of liquidity trapped between the walls.",
      },
      {
        input: "height = [4,2,0,3,2,5]",
        output: "9",
      },
    ],
    constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    approach:
      "Two-pointer approach: maintain left and right pointers. Track left_max and right_max. At each step, process the side with the smaller max — water trapped at that position = max - height[i]. This avoids O(n) extra space versus the prefix-max array approach.",
    code: `def trap(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    left_max = right_max = 0
    water = 0
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
    return water

print(trap([0,1,0,2,1,0,1,3,2,1,2,1]))  # 6`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260725-b1-bellman-ford-fx-arb",
    title: "Bellman-Ford FX Arbitrage — Negative Cycle Detection",
    difficulty: "hard",
    topics: ["graph", "bellman-ford", "shortest-path"],
    problem:
      "Given n currencies and a list of exchange rates rates[i] = [src, dst, rate] meaning 1 unit of src converts to `rate` units of dst, detect whether a profitable FX arbitrage cycle exists. Return True if such a cycle is found.",
    examples: [
      {
        input: 'n=3, rates=[[0,1,1.1],[1,2,1.1],[2,0,0.9]]',
        output: "False",
        explanation: "1.1 * 1.1 * 0.9 = 1.089 < 1, no arbitrage.",
      },
      {
        input: 'n=3, rates=[[0,1,1.5],[1,2,1.5],[2,0,0.5]]',
        output: "True",
        explanation: "1.5 * 1.5 * 0.5 = 1.125 > 1, arbitrage exists.",
      },
    ],
    constraints: ["2 <= n <= 100", "1 <= rates.length <= 5000"],
    approach:
      "Take -log of each rate to convert multiplication to addition. A profitable cycle (product > 1) becomes a negative-weight cycle (-log product < 0). Run Bellman-Ford for n-1 relaxations; if any edge still relaxes on iteration n, a negative cycle exists.",
    code: `import math

def has_fx_arbitrage(n: int, rates: list[list]) -> bool:
    dist = [float('inf')] * n
    dist[0] = 0.0
    edges = [(-math.log(r), s, d) for s, d, r in rates]

    for _ in range(n - 1):
        for w, u, v in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # n-th relaxation: negative cycle exists if any edge still improves
    for w, u, v in edges:
        if dist[u] + w < dist[v]:
            return True
    return False

print(has_fx_arbitrage(3, [[0,1,1.5],[1,2,1.5],[2,0,0.5]]))  # True`,
    language: "python",
    complexity: { time: "O(V * E)", space: "O(V)" },
  },
  {
    id: "fin-20260725-b1-coin-change",
    title: "Coin Change — Minimum Trade Lot Sizing",
    difficulty: "medium",
    topics: ["dynamic-programming", "bfs"],
    leetcodeNumber: 322,
    problem:
      "A trading desk can transact in lot sizes given by the array lots[]. Given a target notional amount, find the minimum number of trades needed to reach exactly that notional. Return -1 if it is impossible.",
    examples: [
      {
        input: "lots = [1, 5, 10, 25], target = 36",
        output: "3",
        explanation: "25 + 10 + 1 = 36 in 3 trades.",
      },
      {
        input: "lots = [2], target = 3",
        output: "-1",
        explanation: "Cannot reach odd target with only size-2 lots.",
      },
    ],
    constraints: ["1 <= lots.length <= 12", "1 <= lots[i] <= 2^31 - 1", "0 <= target <= 10^4"],
    approach:
      "Classic unbounded knapsack / BFS. dp[i] = minimum trades to reach notional i. Initialize dp[0]=0, rest infinity. For each amount from 1 to target, try each lot: dp[i] = min(dp[i], dp[i-lot]+1). Return dp[target] or -1.",
    code: `def min_trades(lots: list[int], target: int) -> int:
    dp = [float('inf')] * (target + 1)
    dp[0] = 0
    for amount in range(1, target + 1):
        for lot in lots:
            if lot <= amount and dp[amount - lot] + 1 < dp[amount]:
                dp[amount] = dp[amount - lot] + 1
    return dp[target] if dp[target] != float('inf') else -1

print(min_trades([1, 5, 10, 25], 36))  # 3
print(min_trades([2], 3))              # -1`,
    language: "python",
    complexity: { time: "O(target * n)", space: "O(target)" },
  },
  {
    id: "fin-20260725-b1-task-scheduler",
    title: "Task Scheduler — Trade Cooling Period",
    difficulty: "medium",
    topics: ["greedy", "heap", "simulation"],
    leetcodeNumber: 621,
    problem:
      "You receive a list of order types (each a letter A–Z). A trading engine must observe a cooldown period n between consecutive executions of the same order type. Find the minimum total time slots to execute all orders, inserting idle slots as needed.",
    examples: [
      {
        input: 'tasks = ["A","A","A","B","B","B"], n = 2',
        output: "8",
        explanation: "A -> B -> idle -> A -> B -> idle -> A -> B",
      },
      {
        input: 'tasks = ["A","A","A","B","B","B"], n = 0',
        output: "6",
        explanation: "No cooldown needed; execute in any order.",
      },
    ],
    constraints: [
      "1 <= tasks.length <= 10^4",
      "tasks[i] is uppercase English letter",
      "0 <= n <= 100",
    ],
    approach:
      "Count frequencies. The minimum time is max(len(tasks), (max_freq - 1) * (n + 1) + count_of_max_freq_tasks). Intuition: tasks with the highest frequency dictate the frame length; others fill in gaps.",
    code: `from collections import Counter

def least_interval(tasks: list[str], n: int) -> int:
    freq = Counter(tasks)
    max_freq = max(freq.values())
    max_count = sum(1 for v in freq.values() if v == max_freq)
    return max(len(tasks), (max_freq - 1) * (n + 1) + max_count)

print(least_interval(["A","A","A","B","B","B"], 2))  # 8
print(least_interval(["A","A","A","B","B","B"], 0))  # 6`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260725-b1-decode-ways",
    title: "Decode Ways — Option Path Counting",
    difficulty: "medium",
    topics: ["dynamic-programming", "string"],
    leetcodeNumber: 91,
    problem:
      "An options desk encodes trade signals as numeric strings where A=1, B=2, ..., Z=26. Given a string of digits s, count the total number of distinct ways to decode it into valid signal sequences. Return the count modulo 10^9 + 7.",
    examples: [
      { input: 's = "12"', output: "2", explanation: '"12" → ["AB","L"]' },
      { input: 's = "226"', output: "3", explanation: '"226" → ["BZ","VF","BBF"]' },
      { input: 's = "06"', output: "0", explanation: "Leading zero is invalid." },
    ],
    constraints: ["1 <= s.length <= 100", "s contains only digits"],
    approach:
      "DP where dp[i] = ways to decode s[:i]. If s[i-1] != '0', dp[i] += dp[i-1]. If s[i-2:i] is between '10' and '26', dp[i] += dp[i-2]. Answer is dp[n].",
    code: `def num_decodings(s: str) -> int:
    MOD = 10**9 + 7
    n = len(s)
    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 0 if s[0] == '0' else 1
    for i in range(2, n + 1):
        one = int(s[i-1])
        two = int(s[i-2:i])
        if one != 0:
            dp[i] = (dp[i] + dp[i-1]) % MOD
        if 10 <= two <= 26:
            dp[i] = (dp[i] + dp[i-2]) % MOD
    return dp[n]

print(num_decodings("226"))  # 3`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260725-b1-median-stream",
    title: "Find Median from Data Stream — Mid-Price Tracker",
    difficulty: "hard",
    topics: ["heap", "design", "two-heaps"],
    leetcodeNumber: 295,
    problem:
      "Design a data structure that tracks a live stream of trade prices and efficiently returns the current median (mid-price) at any point. Implement addPrice(price) and findMedian() operations.",
    examples: [
      {
        input: 'addPrice(1), addPrice(2), findMedian(), addPrice(3), findMedian()',
        output: "1.5, 2.0",
        explanation: "After [1,2] median is 1.5; after [1,2,3] median is 2.0.",
      },
    ],
    constraints: [
      "-10^5 <= price <= 10^5",
      "At most 5 * 10^4 calls to addPrice and findMedian",
      "findMedian is only called after at least one addPrice",
    ],
    approach:
      "Maintain two heaps: a max-heap for the lower half (negate values to simulate), and a min-heap for the upper half. Balance so sizes differ by at most 1. Median = top of larger heap, or average of both tops if equal size.",
    code: `import heapq

class MidPriceTracker:
    def __init__(self):
        self.lo: list[int] = []   # max-heap via negation (lower half)
        self.hi: list[int] = []   # min-heap (upper half)

    def add_price(self, price: float) -> None:
        heapq.heappush(self.lo, -price)
        # Balance: lo top must <= hi top
        if self.hi and -self.lo[0] > self.hi[0]:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        # Keep sizes within 1
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def find_median(self) -> float:
        if len(self.lo) == len(self.hi):
            return (-self.lo[0] + self.hi[0]) / 2.0
        return float(-self.lo[0])

tracker = MidPriceTracker()
tracker.add_price(1); tracker.add_price(2)
print(tracker.find_median())  # 1.5
tracker.add_price(3)
print(tracker.find_median())  # 2.0`,
    language: "python",
    complexity: { time: "O(log n) per add, O(1) per query", space: "O(n)" },
  },
  {
    id: "fin-20260725-b1-circular-deque",
    title: "Design Circular Deque — Ring Buffer for Order Flow",
    difficulty: "medium",
    topics: ["design", "array", "deque"],
    leetcodeNumber: 641,
    problem:
      "Design a circular double-ended queue (deque) of fixed capacity k to buffer incoming market orders. Support insertFront, insertLast, deleteFront, deleteLast, getFront, getRear, isEmpty, isFull — all in O(1).",
    examples: [
      {
        input:
          "k=3, insertLast(1), insertLast(2), insertFront(3), getFront(), isFull(), deleteLast(), insertLast(4), getRear()",
        output: "true, true, true, 3, true, true, true, 4",
        explanation: "Buffer [3,1,2], then [3,1,4] after deleteLast+insertLast(4).",
      },
    ],
    constraints: ["1 <= k <= 1000", "0 <= value <= 1000", "At most 2000 calls total"],
    approach:
      "Use a fixed-size array with head and tail pointers and a size counter. insertFront decrements head (mod k), insertLast increments tail (mod k). Modular arithmetic keeps both pointers within bounds.",
    code: `class CircularDeque:
    def __init__(self, k: int):
        self.buf = [0] * k
        self.k = k
        self.head = 0
        self.size = 0

    def _tail(self) -> int:
        return (self.head + self.size - 1) % self.k

    def insert_front(self, value: int) -> bool:
        if self.is_full():
            return False
        self.head = (self.head - 1) % self.k
        self.buf[self.head] = value
        self.size += 1
        return True

    def insert_last(self, value: int) -> bool:
        if self.is_full():
            return False
        self.buf[(self.head + self.size) % self.k] = value
        self.size += 1
        return True

    def delete_front(self) -> bool:
        if self.is_empty():
            return False
        self.head = (self.head + 1) % self.k
        self.size -= 1
        return True

    def delete_last(self) -> bool:
        if self.is_empty():
            return False
        self.size -= 1
        return True

    def get_front(self) -> int:
        return -1 if self.is_empty() else self.buf[self.head]

    def get_rear(self) -> int:
        return -1 if self.is_empty() else self.buf[self._tail()]

    def is_empty(self) -> bool:
        return self.size == 0

    def is_full(self) -> bool:
        return self.size == self.k`,
    language: "python",
    complexity: { time: "O(1) all ops", space: "O(k)" },
  },
  {
    id: "fin-20260725-b1-three-sum-closest",
    title: "3Sum Closest — Optimal Hedge Ratio",
    difficulty: "medium",
    topics: ["two-pointers", "sorting", "array"],
    leetcodeNumber: 16,
    problem:
      "A risk manager selects three assets whose combined beta must be as close as possible to a target beta. Given an array of individual betas and a target, return the sum of three betas closest to target. If two sums are equally close, return the larger one.",
    examples: [
      {
        input: "betas = [-1, 2, 1, -4], target = 1",
        output: "2",
        explanation: "-1 + 2 + 1 = 2 is closest to 1.",
      },
      {
        input: "betas = [0, 0, 0], target = 1",
        output: "0",
      },
    ],
    constraints: ["3 <= betas.length <= 500", "-10^3 <= betas[i] <= 10^3", "-10^4 <= target <= 10^4"],
    approach:
      "Sort the array. Fix the first element, then use two pointers for the remaining pair. Update best if the current sum is closer to target. Move left pointer up if sum < target, right pointer down if sum > target.",
    code: `def three_sum_closest(betas: list[float], target: float) -> float:
    betas.sort()
    n = len(betas)
    best = betas[0] + betas[1] + betas[2]
    for i in range(n - 2):
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = betas[i] + betas[lo] + betas[hi]
            if abs(s - target) < abs(best - target):
                best = s
            if s < target:
                lo += 1
            elif s > target:
                hi -= 1
            else:
                return s      # exact match
    return best

print(three_sum_closest([-1, 2, 1, -4], 1))  # 2`,
    language: "python",
    complexity: { time: "O(n^2)", space: "O(1)" },
  },
];
