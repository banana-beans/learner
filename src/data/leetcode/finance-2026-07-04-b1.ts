import type { LeetCodeProblem } from "./index";

export const financeProblems20260704B1: LeetCodeProblem[] = [
  {
    id: "fin-20260704-b1-stock-cooldown",
    title: "Best Time to Buy and Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["dynamic-programming", "state-machine"],
    problem:
      "Given daily stock prices, find the maximum profit with unlimited transactions but a 1-day cooldown after any sale (you cannot buy on the day immediately after selling).",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation: "Buy day 0, sell day 1, cooldown day 2, buy day 3, sell day 4. Profit = 1 + 2 = 3.",
      },
      { input: "prices = [1]", output: "0" },
    ],
    constraints: ["1 <= prices.length <= 5000", "0 <= prices[i] <= 1000"],
    approach:
      "Define three states: held (holding stock), sold (just sold, entering cooldown), rest (cooldown over, can buy). Transitions: held = max(held, rest - price); sold = held_prev + price; rest = max(rest, sold_prev). Initialize held = -inf, sold = 0, rest = 0.",
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    held = float('-inf')
    sold = 0
    rest = 0
    for price in prices:
        prev_held, prev_sold, prev_rest = held, sold, rest
        held = max(prev_held, prev_rest - price)
        sold = prev_held + price
        rest = max(prev_rest, prev_sold)
    return max(sold, rest)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260704-b1-bit-position-tracker",
    title: "Bit Manipulation Position Tracker",
    difficulty: "medium",
    topics: ["bit-manipulation", "hash-map"],
    problem:
      "A trading system tracks up to 64 symbols in a bitmask. Implement open(symbol_id), close(symbol_id), is_open(symbol_id), and count_open() in O(1). symbol_id is 0-indexed up to 63.",
    examples: [
      {
        input: "open(2), open(5), is_open(2), count_open(), close(2), count_open()",
        output: "True, 2, 1",
      },
      { input: "is_open(0) before any open", output: "False" },
    ],
    approach:
      "Use a 64-bit integer as the bitmask. open: mask |= (1 << id); close: mask &= ~(1 << id); is_open: bool(mask & (1 << id)); count_open: bin(mask).count('1') — or use mask.bit_count() in Python 3.10+.",
    code: `class PositionTracker:
    def __init__(self):
        self._mask = 0

    def open(self, symbol_id: int) -> None:
        self._mask |= (1 << symbol_id)

    def close(self, symbol_id: int) -> None:
        self._mask &= ~(1 << symbol_id)

    def is_open(self, symbol_id: int) -> bool:
        return bool(self._mask & (1 << symbol_id))

    def count_open(self) -> int:
        return self._mask.bit_count()  # Python 3.10+ popcount`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(1)" },
  },
  {
    id: "fin-20260704-b1-matrix-exponentiation",
    title: "Compound Return via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["matrix-exponentiation", "dynamic-programming"],
    problem:
      "A portfolio follows a monthly Markov transition matrix T (n×n states). Given initial allocation vector v and month count m, compute the allocation after m months. m can be up to 10^9.",
    examples: [
      {
        input: "T = [[0.9, 0.1], [0.2, 0.8]], v = [1, 0], m = 3",
        output: "[0.772, 0.228]",
        explanation: "v @ T^3 via fast matrix exponentiation.",
      },
    ],
    constraints: ["1 <= n <= 50", "1 <= m <= 10^9"],
    approach:
      "Matrix exponentiation by squaring: T^m in O(n^3 log m). Represent each step as matrix multiply; repeated squaring halves the exponent each iteration. For v @ T^m, start with result = identity, multiply into result when bit is set.",
    code: `import numpy as np

def mat_pow(M: np.ndarray, p: int) -> np.ndarray:
    n = M.shape[0]
    result = np.eye(n)
    base = M.copy().astype(float)
    while p > 0:
        if p & 1:
            result = result @ base
        base = base @ base
        p >>= 1
    return result

def compound_allocation(T: list[list[float]], v: list[float], m: int) -> list[float]:
    T_mat = np.array(T, dtype=float)
    Tm = mat_pow(T_mat, m)
    result = np.array(v, dtype=float) @ Tm
    return result.tolist()`,
    language: "python",
    complexity: { time: "O(n^3 log m)", space: "O(n^2)" },
  },
  {
    id: "fin-20260704-b1-trapping-rain-water",
    title: "Trapping Rain Water (Volume Profile)",
    difficulty: "hard",
    topics: ["two-pointers", "stack"],
    problem:
      "Given a histogram of price levels (heights), compute how much 'volume' (water) is trapped between the bars. Models market microstructure volume-at-price analysis.",
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
      },
      { input: "height = [4,2,0,3,2,5]", output: "9" },
    ],
    constraints: ["n == height.length", "1 <= n <= 2*10^4", "0 <= height[i] <= 10^5"],
    approach:
      "Two-pointer: maintain left_max and right_max. Move the pointer on the side with smaller max; water at that cell = min(left_max, right_max) - height[i]. This avoids the O(n) precomputation pass of the prefix-max approach.",
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
    return water`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 42,
  },
  {
    id: "fin-20260704-b1-jump-game-momentum",
    title: "Jump Game Momentum Validator",
    difficulty: "medium",
    topics: ["greedy", "dynamic-programming"],
    problem:
      "Given an array of price momentum scores (non-negative integers), starting from index 0 you can jump up to arr[i] steps forward. Determine if you can reach the last index. Models momentum-driven position sizing where low score = stalled trade.",
    examples: [
      { input: "momentum = [2,3,1,1,4]", output: "true" },
      { input: "momentum = [3,2,1,0,4]", output: "false" },
    ],
    constraints: ["1 <= momentum.length <= 10^4", "0 <= momentum[i] <= 10^5"],
    approach:
      "Track max_reach greedily: for each index i <= max_reach, update max_reach = max(max_reach, i + arr[i]). If max_reach >= last index, return True. If i ever exceeds max_reach, return False.",
    code: `def can_reach(momentum: list[int]) -> bool:
    max_reach = 0
    n = len(momentum)
    for i in range(n):
        if i > max_reach:
            return False
        max_reach = max(max_reach, i + momentum[i])
        if max_reach >= n - 1:
            return True
    return True`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 55,
  },
  {
    id: "fin-20260704-b1-sliding-window-max-profit",
    title: "Maximum Profit in Sliding Window of K Days",
    difficulty: "medium",
    topics: ["sliding-window", "deque"],
    problem:
      "Given a price array and window size k, find the maximum single-trade profit (buy low, sell high) within any contiguous window of exactly k days.",
    examples: [
      {
        input: "prices = [7,1,5,3,6,4], k = 4",
        output: "5",
        explanation: "Window [1,5,3,6]: max profit = 6-1 = 5.",
      },
      { input: "prices = [7,6,4,3,1], k = 3", output: "0" },
    ],
    approach:
      "Slide a window of size k; within each window track running min and compute price[i] - running_min. Use a deque to maintain the window's minimum in amortized O(1) per step. Overall O(n) time.",
    code: `from collections import deque

def max_profit_window(prices: list[int], k: int) -> int:
    if k < 2:
        return 0
    min_dq: deque = deque()  # indices, increasing prices
    best = 0
    for i, p in enumerate(prices):
        # Remove elements outside window
        while min_dq and min_dq[0] < i - k + 1:
            min_dq.popleft()
        # Maintain monotone increasing deque (front = min)
        while min_dq and prices[min_dq[-1]] >= p:
            min_dq.pop()
        min_dq.append(i)
        if i >= k - 1:
            window_min = prices[min_dq[0]]
            best = max(best, p - window_min)
    return best`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
  },
  {
    id: "fin-20260704-b1-lazy-deletion-median",
    title: "Lazy-Deletion Priority Queue for Streaming Median",
    difficulty: "hard",
    topics: ["heap", "lazy-deletion", "design"],
    problem:
      "Design a data structure that supports add(val), remove(val), and find_median() in O(log n). Elements can be removed at any time (not just the top), which requires lazy deletion.",
    examples: [
      {
        input: "add(3), add(1), add(5), find_median() -> 3, remove(3), find_median() -> add(1,5)=2.0",
        output: "3, 2.0",
      },
    ],
    approach:
      "Two heaps (max-heap for lower half, min-heap for upper half) with lazy deletion. Each heap has a paired 'pending removal' counter. On poll, skip stale tops. Rebalance so sizes differ by at most 1.",
    code: `import heapq
from collections import defaultdict

class LazyMedianFinder:
    def __init__(self):
        self._lo: list = []  # max-heap (negate)
        self._hi: list = []  # min-heap
        self._lo_del = defaultdict(int)
        self._hi_del = defaultdict(int)
        self._lo_size = self._hi_size = 0

    def _clean(self, heap, pending):
        while heap and pending[-heap[0]] > 0:
            pending[-heap[0]] -= 1
            heapq.heappop(heap)

    def add(self, val: int):
        if not self._lo or val <= -self._lo[0]:
            heapq.heappush(self._lo, -val)
            self._lo_size += 1
        else:
            heapq.heappush(self._hi, val)
            self._hi_size += 1
        self._rebalance()

    def remove(self, val: int):
        if val <= -self._lo[0]:
            self._lo_del[val] += 1
            self._lo_size -= 1
        else:
            self._hi_del[val] += 1
            self._hi_size -= 1
        self._rebalance()

    def _rebalance(self):
        while self._lo_size > self._hi_size + 1:
            self._clean(self._lo, self._lo_del)
            v = -heapq.heappop(self._lo)
            self._lo_size -= 1
            heapq.heappush(self._hi, v)
            self._hi_size += 1
        while self._hi_size > self._lo_size:
            self._clean(self._hi, self._hi_del)
            v = heapq.heappop(self._hi)
            self._hi_size -= 1
            heapq.heappush(self._lo, -v)
            self._lo_size += 1

    def find_median(self) -> float:
        self._clean(self._lo, self._lo_del)
        self._clean(self._hi, self._hi_del)
        if self._lo_size > self._hi_size:
            return float(-self._lo[0])
        return (-self._lo[0] + self._hi[0]) / 2.0`,
    language: "python",
    complexity: { time: "O(log n) amortized per op", space: "O(n)" },
  },
  {
    id: "fin-20260704-b1-markov-chain-probs",
    title: "Markov Chain Stationary Distribution",
    difficulty: "medium",
    topics: ["linear-algebra", "dynamic-programming", "probability"],
    problem:
      "Given an n×n Markov transition matrix (rows sum to 1), find the stationary distribution pi such that pi @ T = pi. Also compute the probability of being in state j after exactly k steps starting from state i.",
    examples: [
      {
        input: "T = [[0.7,0.3],[0.4,0.6]], start=0, k=2",
        output: "stationary=[0.571,0.429], prob_after_k=[0.61,0.39]",
      },
    ],
    approach:
      "For stationary: solve pi @ T = pi with pi.sum()=1 — equivalently solve (T^T - I) @ pi = 0 as a linear system. For k-step probability: compute T^k via repeated squaring and return row start.",
    code: `import numpy as np

def markov_analysis(T: list[list[float]], start: int, k: int) -> dict:
    T = np.array(T, dtype=float)
    n = T.shape[0]

    # Stationary distribution: solve (T.T - I) pi = 0, sum = 1
    A = (T.T - np.eye(n))
    A[-1, :] = 1  # replace last equation with normalization
    b = np.zeros(n)
    b[-1] = 1
    stationary = np.linalg.solve(A, b)

    # k-step probability via matrix power
    def mat_pow(M, p):
        result = np.eye(n)
        base = M.copy()
        while p > 0:
            if p & 1:
                result = result @ base
            base = base @ base
            p >>= 1
        return result

    Tk = mat_pow(T, k)
    prob_k = Tk[start]
    return {"stationary": stationary.tolist(), "prob_after_k": prob_k.tolist()}`,
    language: "python",
    complexity: { time: "O(n^3 log k)", space: "O(n^2)" },
  },
  {
    id: "fin-20260704-b1-lcs-pattern-matching",
    title: "LCS-Based Signal Pattern Matching",
    difficulty: "medium",
    topics: ["dynamic-programming", "string"],
    problem:
      "Given a reference signal pattern string p (e.g. 'UUDUDD') and a market signal string s of length n, find the length of the longest common subsequence (LCS) as a similarity score. Also reconstruct the matched subsequence.",
    examples: [
      {
        input: "p = 'UUDUDD', s = 'UUDUUDD'",
        output: "6",
        explanation: "LCS = 'UUDUDD', length 6.",
      },
    ],
    constraints: [
      "1 <= len(p), len(s) <= 1000",
    ],
    approach:
      "Classic O(mn) DP: dp[i][j] = LCS length of p[:i] and s[:j]. If p[i-1]==s[j-1]: dp[i][j]=dp[i-1][j-1]+1, else max(dp[i-1][j], dp[i][j-1]). Reconstruct by backtracking from dp[m][n].",
    code: `def lcs_pattern(p: str, s: str) -> dict:
    m, n = len(p), len(s)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[i-1] == s[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])

    # Reconstruct
    seq = []
    i, j = m, n
    while i > 0 and j > 0:
        if p[i-1] == s[j-1]:
            seq.append(p[i-1])
            i -= 1; j -= 1
        elif dp[i-1][j] > dp[i][j-1]:
            i -= 1
        else:
            j -= 1
    return {"length": dp[m][n], "subsequence": ''.join(reversed(seq))}`,
    language: "python",
    complexity: { time: "O(mn)", space: "O(mn)" },
    leetcodeNumber: 1143,
  },
  {
    id: "fin-20260704-b1-sliding-window-rate-limiter",
    title: "Sliding Window Rate Limiter Design",
    difficulty: "medium",
    topics: ["design", "sliding-window", "deque"],
    problem:
      "Design a rate limiter for an order management system: allow at most max_requests within any rolling window_seconds window. Implement is_allowed(timestamp_ms) returning True/False in O(1) amortized.",
    examples: [
      {
        input: "max_requests=3, window_ms=1000; calls at t=100,200,300,400 all allowed; t=1050: evict t=100, now 3 in window -> allowed; t=1100: evict t=200, still 3 -> blocked",
        output: "True,True,True,True,True,False",
      },
    ],
    approach:
      "Maintain a deque of timestamps. On each call: pop timestamps older than (now - window_ms) from the front. If deque size < max_requests, append timestamp and return True; else return False. Deque front = oldest, back = newest.",
    code: `from collections import deque

class RateLimiter:
    def __init__(self, max_requests: int, window_ms: int):
        self._max = max_requests
        self._window = window_ms
        self._timestamps: deque[int] = deque()

    def is_allowed(self, timestamp_ms: int) -> bool:
        # Evict requests outside the rolling window
        while self._timestamps and self._timestamps[0] <= timestamp_ms - self._window:
            self._timestamps.popleft()
        if len(self._timestamps) < self._max:
            self._timestamps.append(timestamp_ms)
            return True
        return False`,
    language: "python",
    complexity: { time: "O(1) amortized", space: "O(max_requests)" },
  },
];
