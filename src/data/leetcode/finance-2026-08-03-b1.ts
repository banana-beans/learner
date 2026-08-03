import type { LeetCodeProblem } from "./index";

export const financeProblems20260803B1: LeetCodeProblem[] = [
  {
    id: "fin-20260803-b1-weighted-interval",
    title: "Maximum Profit from Weighted Interval Scheduling",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Binary Search", "Sorting"],
    problem:
      "You are given n trading windows, each described as [start, end, profit]. No two windows can overlap (if window A ends at time t, window B must start at time > t). Return the maximum total profit you can earn by selecting a non-overlapping subset of trading windows.",
    examples: [
      {
        input: "windows = [[1,3,5],[2,5,6],[4,6,5],[6,7,4]]",
        output: "10",
        explanation:
          "Select [2,5,6] then [6,7,4] for a total of 10. No two windows overlap.",
      },
    ],
    constraints: [
      "1 <= n <= 10^5",
      "0 <= start < end <= 10^9",
      "1 <= profit <= 10^9",
    ],
    approach:
      "Sort by end time. For each window i, binary-search for the latest window j whose end <= start[i]. dp[i] = max(dp[i-1], profit[i] + dp[j]).",
    code: `from bisect import bisect_right
from typing import List

def job_scheduling(start: List[int], end: List[int], profit: List[int]) -> int:
    jobs = sorted(zip(end, start, profit))
    ends = [j[0] for j in jobs]
    n = len(jobs)
    dp = [0] * (n + 1)
    for i, (e, s, p) in enumerate(jobs):
        j = bisect_right(ends, s, 0, i)
        dp[i+1] = max(dp[i], dp[j] + p)
    return dp[n]

assert job_scheduling([1,2,3,3],[3,4,5,6],[50,10,40,70]) == 120
assert job_scheduling([1,2,4,6],[3,5,6,7],[5,6,5,4]) == 10
print("All tests passed")`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
    leetcodeNumber: 1235,
  },
  {
    id: "fin-20260803-b1-kth-largest-stream",
    title: "Kth Largest Element in a Stream (Market Feed)",
    difficulty: "easy",
    topics: ["Heap", "Design", "Data Stream"],
    problem:
      "Design a class that tracks the k-th largest price from a live market data stream. Implement KthLargest(k, prices) and add(price) returning the current k-th largest after each new tick.",
    examples: [
      {
        input: "k=3, prices=[4,5,8,2]; add(3), add(5), add(10), add(9), add(4)",
        output: "[4,5,5,8,8]",
        explanation:
          "Min-heap of size k tracks the k-th largest. The heap minimum is always the k-th largest.",
      },
    ],
    constraints: [
      "1 <= k <= 10^4",
      "-10^4 <= val <= 10^4",
      "At most 10^4 calls to add",
    ],
    approach:
      "Maintain a min-heap of exactly k elements. Each add: push the new element and pop if heap size exceeds k. The heap top is always the k-th largest.",
    code: `import heapq
from typing import List

class KthLargest:
    def __init__(self, k: int, nums: List[int]):
        self.k = k
        self.heap: List[int] = []
        for n in nums:
            self.add(n)

    def add(self, val: int) -> int:
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)
        return self.heap[0]

kth = KthLargest(3, [4,5,8,2])
results = [kth.add(v) for v in [3,5,10,9,4]]
assert results == [4,5,5,8,8], results
print("Tests passed")`,
    language: "python",
    complexity: { time: "O(n log k)", space: "O(k)" },
    leetcodeNumber: 703,
  },
  {
    id: "fin-20260803-b1-house-robber-ii",
    title: "Portfolio Sector Rotation (House Robber II)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Array"],
    problem:
      "You are given an array of n sector profits arranged in a circle. You cannot take two adjacent sectors simultaneously (correlated risks). Maximise total profit. The first and last sectors are considered adjacent.",
    examples: [
      {
        input: "profits = [2,3,2]",
        output: "3",
        explanation:
          "Cannot take both profit[0]=2 and profit[2]=2 since they are adjacent in the circle. Best is profit[1]=3.",
      },
      {
        input: "profits = [1,2,3,1]",
        output: "4",
        explanation: "Take profit[0]=1 and profit[2]=3, total=4.",
      },
    ],
    constraints: ["1 <= n <= 100", "0 <= profit <= 1000"],
    approach:
      "Break the circular constraint into two linear DP runs: one excluding the last element, one excluding the first. Answer is max of both.",
    code: `from typing import List

def rob(nums: List[int]) -> int:
    def linear_rob(arr):
        prev2 = prev1 = 0
        for x in arr:
            prev2, prev1 = prev1, max(prev1, prev2 + x)
        return prev1

    n = len(nums)
    if n == 1:
        return nums[0]
    return max(linear_rob(nums[:-1]), linear_rob(nums[1:]))

assert rob([2,3,2]) == 3
assert rob([1,2,3,1]) == 4
assert rob([1,2,3]) == 3
print("All tests passed")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 213,
  },
  {
    id: "fin-20260803-b1-sliding-window-max",
    title: "Sliding Window Maximum Portfolio Value",
    difficulty: "hard",
    topics: ["Deque", "Sliding Window", "Array"],
    problem:
      "Given an array of daily portfolio values and a window size k, return the maximum portfolio value for each sliding window of size k. This is used to compute rolling high-watermarks.",
    examples: [
      {
        input: "values = [1,3,-1,-3,5,3,6,7], k = 3",
        output: "[3,3,5,5,6,7]",
        explanation:
          "Sliding windows: [1,3,-1]=3, [3,-1,-3]=3, [-1,-3,5]=5, [-3,5,3]=5, [5,3,6]=6, [3,6,7]=7.",
      },
    ],
    constraints: ["1 <= n <= 10^5", "1 <= k <= n"],
    approach:
      "Maintain a monotone decreasing deque storing indices. For each element: pop back while back value <= current; pop front if out of window. Front is always the window maximum.",
    code: `from collections import deque
from typing import List

def max_sliding_window(nums: List[int], k: int) -> List[int]:
    dq: deque = deque()
    result = []
    for i, v in enumerate(nums):
        if dq and dq[0] <= i - k:
            dq.popleft()
        while dq and nums[dq[-1]] <= v:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result

assert max_sliding_window([1,3,-1,-3,5,3,6,7], 3) == [3,3,5,5,6,7]
assert max_sliding_window([1], 1) == [1]
print("All tests passed")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260803-b1-rate-limiter",
    title: "Order Rate Limiter (Sliding Window Counter)",
    difficulty: "medium",
    topics: ["Design", "Hash Table", "Sliding Window"],
    problem:
      "Design an order rate limiter that accepts at most k orders per t seconds. Implement RateLimiter(k, t) and shouldAllow(timestamp) returning True if the order is allowed. Timestamps arrive in non-decreasing order.",
    examples: [
      {
        input:
          "k=2, t=3; shouldAllow(1), shouldAllow(1), shouldAllow(2), shouldAllow(4)",
        output: "[True, True, False, True]",
        explanation:
          "At t=2, two orders already exist in [0,2], so third is rejected. At t=4, window is (1,4]: only 1 order remains so the request is allowed.",
      },
    ],
    constraints: [
      "0 <= timestamp <= 10^9",
      "1 <= k <= 10^4",
      "1 <= t <= 10^9",
    ],
    approach:
      "Use a deque storing accepted timestamps. On each call, evict timestamps older than (current - t). If deque size < k, allow and append; otherwise reject.",
    code: `from collections import deque

class RateLimiter:
    def __init__(self, k: int, t: int):
        self.k = k
        self.t = t
        self.window: deque = deque()

    def should_allow(self, timestamp: int) -> bool:
        while self.window and self.window[0] <= timestamp - self.t:
            self.window.popleft()
        if len(self.window) < self.k:
            self.window.append(timestamp)
            return True
        return False

rl = RateLimiter(2, 3)
assert rl.should_allow(1) == True
assert rl.should_allow(1) == True
assert rl.should_allow(2) == False
assert rl.should_allow(4) == True
print("All tests passed")`,
    language: "python",
    complexity: { time: "O(1) amortised", space: "O(k)" },
  },
  {
    id: "fin-20260803-b1-jump-game-ii",
    title: "Minimum Rebalances to Reach Target Allocation",
    difficulty: "medium",
    topics: ["Greedy", "Array", "BFS"],
    problem:
      "You are given an array rebalances where rebalances[i] is the maximum number of steps you can move forward from position i. Return the minimum number of rebalancing operations to reach the last index.",
    examples: [
      {
        input: "rebalances = [2,3,1,1,4]",
        output: "2",
        explanation: "Jump from index 0 to 1, then to 4.",
      },
      {
        input: "rebalances = [2,3,0,1,4]",
        output: "2",
        explanation: "0 -> 1 -> 4.",
      },
    ],
    constraints: ["1 <= n <= 10^4", "0 <= rebalances[i] <= 1000"],
    approach:
      "Greedy BFS level scan: track curr_end (farthest reachable this jump) and next_end (farthest reachable next jump). Increment jumps whenever we exhaust curr_end.",
    code: `from typing import List

def jump(nums: List[int]) -> int:
    n = len(nums)
    if n <= 1:
        return 0
    jumps = curr_end = next_end = 0
    for i in range(n - 1):
        next_end = max(next_end, i + nums[i])
        if i == curr_end:
            jumps += 1
            curr_end = next_end
            if curr_end >= n - 1:
                break
    return jumps

assert jump([2,3,1,1,4]) == 2
assert jump([2,3,0,1,4]) == 2
assert jump([1]) == 0
print("All tests passed")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 45,
  },
  {
    id: "fin-20260803-b1-target-sum-dp",
    title: "Portfolio Allocation Sign Assignment (Target Sum)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "DFS", "Knapsack"],
    problem:
      "Given n asset returns and a target portfolio return T, count the number of ways to assign +/- signs to each asset return such that their sum equals T.",
    examples: [
      {
        input: "returns = [1,1,1,1,1], target = 3",
        output: "5",
        explanation:
          "5 ways to choose 4 pluses and 1 minus (each of the 5 positions can be the minus).",
      },
    ],
    constraints: [
      "1 <= n <= 20",
      "0 <= returns[i] <= 1000",
      "-sum(returns) <= target <= sum(returns)",
    ],
    approach:
      "DP with offset: dp[s + offset] = number of ways to achieve sum s. For each number create a new dp table by adding and subtracting it from every reachable sum.",
    code: `from typing import List

def find_target_sum_ways(nums: List[int], target: int) -> int:
    total = sum(nums)
    if abs(target) > total:
        return 0
    offset = total
    size   = 2 * total + 1
    dp = [0] * size
    dp[offset] = 1
    for n in nums:
        ndp = [0] * size
        for s in range(size):
            if dp[s] == 0:
                continue
            if s + n < size:
                ndp[s + n] += dp[s]
            if s - n >= 0:
                ndp[s - n] += dp[s]
        dp = ndp
    return dp[target + offset]

assert find_target_sum_ways([1,1,1,1,1], 3) == 5
assert find_target_sum_ways([1], 1) == 1
assert find_target_sum_ways([1,0], 1) == 2
print("All tests passed")`,
    language: "python",
    complexity: { time: "O(n * sum)", space: "O(sum)" },
    leetcodeNumber: 494,
  },
  {
    id: "fin-20260803-b1-matrix-power",
    title: "Fibonacci Portfolio Growth via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["Matrix Exponentiation", "Linear Algebra", "Math"],
    problem:
      "A portfolio follows a two-state recurrence: V(n) = a*V(n-1) + b*V(n-2). Given a, b, V(0), V(1), and n, compute V(n) mod 10^9+7 efficiently using matrix exponentiation.",
    examples: [
      {
        input: "a=1, b=1, V0=0, V1=1, n=10",
        output: "55",
        explanation: "a=1, b=1 gives Fibonacci. Fib(10)=55.",
      },
      {
        input: "a=2, b=1, V0=0, V1=1, n=5",
        output: "11",
        explanation: "Sequence: 0,1,2,5,11.",
      },
    ],
    constraints: ["1 <= n <= 10^18", "1 <= a,b <= 100"],
    approach:
      "Express recurrence as matrix multiplication [[a,b],[1,0]]^(n-1) * [V1,V0]. Use binary exponentiation: O(log n) matrix multiplications each O(1) for 2x2.",
    code: `MOD = 10**9 + 7

def mat_mul(A, B):
    n = len(A)
    C = [[0]*n for _ in range(n)]
    for i in range(n):
        for k in range(n):
            if A[i][k] == 0:
                continue
            for j in range(n):
                C[i][j] = (C[i][j] + A[i][k]*B[k][j]) % MOD
    return C

def mat_pow(M, p):
    n = len(M)
    result = [[1 if i==j else 0 for j in range(n)] for i in range(n)]
    while p:
        if p & 1:
            result = mat_mul(result, M)
        M = mat_mul(M, M)
        p >>= 1
    return result

def recurrence_nth(a, b, V0, V1, n):
    if n == 0: return V0 % MOD
    if n == 1: return V1 % MOD
    M  = [[a, b], [1, 0]]
    Mn = mat_pow(M, n-1)
    return (Mn[0][0]*V1 + Mn[0][1]*V0) % MOD

assert recurrence_nth(1,1,0,1,10) == 55
assert recurrence_nth(2,1,0,1,5)  == 11
print("All tests passed")`,
    language: "python",
    complexity: { time: "O(log n)", space: "O(1)" },
  },
  {
    id: "fin-20260803-b1-mst-correlation",
    title: "Minimum Spanning Tree for Correlation-Based Network",
    difficulty: "medium",
    topics: ["Graph", "Kruskal", "Union Find"],
    problem:
      "Given a matrix of pairwise asset correlations corr[i][j], build a Minimum Spanning Tree (MST) using distance d(i,j) = sqrt(2*(1 - corr[i][j])). Return the edges in the MST. MST of a correlation network reveals the dominant factor structure.",
    examples: [
      {
        input: "corr = [[1,0.9,0.1],[0.9,1,0.2],[0.1,0.2,1]]",
        output: "MST edges: [(0,1), (1,2)]",
        explanation:
          "Assets 0 and 1 are most correlated (shortest distance), then 1 and 2.",
      },
    ],
    constraints: ["2 <= n <= 200", "-1 <= corr[i][j] <= 1"],
    approach:
      "Convert correlation to distance d = sqrt(2*(1-c)), collect all O(n^2) edges, sort by weight, run Kruskal with Union-Find.",
    code: `import math
from typing import List

def mst_correlation(corr: List[List[float]]) -> list:
    n = len(corr)
    edges = []
    for i in range(n):
        for j in range(i+1, n):
            d = math.sqrt(2 * (1 - corr[i][j]))
            edges.append((d, i, j))
    edges.sort()

    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    def union(x, y):
        px, py = find(x), find(y)
        if px == py: return False
        parent[px] = py
        return True

    mst = []
    for d, i, j in edges:
        if union(i, j):
            mst.append((i, j, round(d, 6)))
            if len(mst) == n - 1:
                break
    return mst

corr = [[1,0.9,0.1],[0.9,1,0.2],[0.1,0.2,1]]
mst  = mst_correlation(corr)
print("MST edges:", mst)`,
    language: "python",
    complexity: { time: "O(n^2 log n)", space: "O(n^2)" },
  },
  {
    id: "fin-20260803-b1-stock-price-fluctuation",
    title: "Stock Price Fluctuation Tracker",
    difficulty: "medium",
    topics: ["Design", "Hash Table", "Sorted Container"],
    problem:
      "Design a class StockPrice that supports: update(timestamp, price) — update (or correct) the price at a timestamp; current() — return the latest price; maximum() — return the all-time maximum; minimum() — return the all-time minimum. Prices may be corrected at earlier timestamps.",
    examples: [
      {
        input:
          "update(1,10), update(2,5), current(), maximum(), update(1,3), maximum(), minimum()",
        output: "[_, _, 5, 10, _, 5, 3]",
        explanation:
          "After correcting t=1 from 10 to 3, the max drops from 10 to 5 and min drops to 3.",
      },
    ],
    constraints: [
      "1 <= timestamp <= 10^9",
      "1 <= price <= 10^5",
      "At most 10^5 calls total",
    ],
    approach:
      "HashMap tracks {timestamp: price}. SortedList maintains prices for O(log n) max/min. Remove old price and insert new on each correction.",
    code: `from sortedcontainers import SortedList

class StockPrice:
    def __init__(self):
        self.prices: dict[int, int] = {}
        self.sorted_prices = SortedList()
        self.latest_ts = 0

    def update(self, timestamp: int, price: int) -> None:
        if timestamp in self.prices:
            self.sorted_prices.remove(self.prices[timestamp])
        self.prices[timestamp] = price
        self.sorted_prices.add(price)
        if timestamp >= self.latest_ts:
            self.latest_ts = timestamp

    def current(self) -> int:
        return self.prices[self.latest_ts]

    def maximum(self) -> int:
        return self.sorted_prices[-1]

    def minimum(self) -> int:
        return self.sorted_prices[0]

sp = StockPrice()
sp.update(1, 10); sp.update(2, 5)
assert sp.current() == 5
assert sp.maximum() == 10
sp.update(1, 3)
assert sp.maximum() == 5
assert sp.minimum() == 3
print("All tests passed")`,
    language: "python",
    complexity: { time: "O(log n) per update", space: "O(n)" },
    leetcodeNumber: 2034,
  },
];
