import type { LeetCodeProblem } from "./index";

export const financeProblems20260626B1: LeetCodeProblem[] = [
  {
    id: "fin-20260626-b1-token-bucket",
    title: "Token Bucket Rate Limiter",
    difficulty: "medium",
    topics: ["design", "sliding window", "rate limiting"],
    problem:
      "Design a TokenBucket rate limiter supporting: allow(timestamp_ms) -> bool. The bucket refills at `rate` tokens/second up to `capacity`. Each request consumes 1 token. Multiple calls with the same timestamp are allowed up to the remaining tokens. Finance application: throttling order submission to exchange rate limits (e.g., 100 orders/second).",
    examples: [
      {
        input: "rate=2, capacity=5; allow(0), allow(0), allow(500), allow(1000), allow(1000), allow(1000)",
        output: "True, True, True, True, True, False",
        explanation:
          "Start with 5 tokens. First two calls consume 2. At 500ms, 1 token refills (total 4), consume 1. At 1000ms, 1 more refills (total 4), two calls consume 2, third fails (0 tokens left).",
      },
    ],
    constraints: [
      "0 <= timestamp_ms, timestamps are non-decreasing",
      "1 <= rate <= 10^6",
      "1 <= capacity <= 10^6",
    ],
    approach:
      "Track tokens (float) and last_refill_time. On each allow() call, compute elapsed = (timestamp - last_time)/1000.0, add elapsed*rate tokens (capped at capacity), then check if tokens >= 1 and decrement. No queue needed — just arithmetic.",
    code: `class TokenBucketLimiter:
    def __init__(self, rate: float, capacity: float):
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_time = 0.0

    def allow(self, timestamp_ms: int) -> bool:
        elapsed = (timestamp_ms - self.last_time) / 1000.0
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_time = timestamp_ms
        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False

# Example usage
limiter = TokenBucketLimiter(rate=2, capacity=5)
timestamps = [0, 0, 500, 1000, 1000, 1000]
results = [limiter.allow(t) for t in timestamps]
print(results)  # [True, True, True, True, True, False]`,
    language: "python",
    complexity: { time: "O(1)", space: "O(1)" },
  },
  {
    id: "fin-20260626-b1-matrix-power",
    title: "Matrix Exponentiation for Compound Returns",
    difficulty: "medium",
    topics: ["matrix exponentiation", "divide and conquer", "math"],
    problem:
      "Given a transition matrix M (n×n) representing a Markov chain of asset states and a number of periods k, compute M^k efficiently. Application: multi-period portfolio transition probabilities or compound return decomposition where portfolio returns compound via a state matrix.",
    examples: [
      {
        input: "M = [[0.9, 0.1], [0.2, 0.8]], k = 4",
        output: "M^4 (each row sums to 1, stochastic matrix property preserved)",
        explanation:
          "Binary exponentiation reduces 4 matrix multiplications to 2: M^2 = M*M, then M^4 = M^2*M^2.",
      },
    ],
    constraints: [
      "1 <= n <= 100",
      "1 <= k <= 10^9",
      "M is a valid stochastic matrix (rows sum to 1)",
    ],
    approach:
      "Binary exponentiation on matrices: M^k = M^(k//2) * M^(k//2) (* M if k odd). Each matrix multiplication is O(n^3); total O(n^3 log k).",
    code: `import numpy as np

def matrix_power(M: np.ndarray, k: int) -> np.ndarray:
    n = M.shape[0]
    result = np.eye(n)
    base = M.copy()
    while k > 0:
        if k % 2 == 1:
            result = result @ base
        base = base @ base
        k //= 2
    return result

# Verify M^4 * M^6 == M^10
M = np.array([[0.9, 0.1], [0.2, 0.8]])
M4 = matrix_power(M, 4)
M6 = matrix_power(M, 6)
M10 = matrix_power(M, 10)
combined = M4 @ M6
print(np.allclose(combined, M10))  # True
print(matrix_power(M, 1))  # Should equal M`,
    language: "python",
    complexity: { time: "O(n^3 log k)", space: "O(n^2)" },
  },
  {
    id: "fin-20260626-b1-markov-absorb",
    title: "Markov Chain Absorption Probability",
    difficulty: "medium",
    topics: ["probability", "linear algebra", "graphs"],
    problem:
      "Given a Markov chain with n transient states and 2 absorbing states (default=0, survival=1), and a transition matrix Q for transient→transient transitions, compute the probability each transient state eventually reaches the default absorbing state. Finance: credit portfolio absorption into default vs survival states.",
    examples: [
      {
        input:
          "Q = [[0.1,0.2,0.0],[0.0,0.2,0.3],[0.1,0.0,0.1]], R = [[0.6,0.1],[0.3,0.2],[0.4,0.4]]",
        output: "absorption probabilities for each transient state reaching default",
        explanation:
          "R[:,0] gives transition probabilities from each transient state to the default absorbing state.",
      },
    ],
    constraints: [
      "1 <= n <= 100 (transient states)",
      "Q rows sum to less than 1 (remainder goes to absorbing states via R)",
      "Each row of Q + corresponding row of R sums to 1",
    ],
    approach:
      "Fundamental matrix N = (I - Q)^{-1}. Absorption probability B = N * R where R is the transient→absorbing sub-matrix. Use numpy.linalg.solve instead of explicit inversion for numerical stability.",
    code: `import numpy as np

def absorption_probs(Q: np.ndarray, R: np.ndarray) -> np.ndarray:
    n = Q.shape[0]
    I = np.eye(n)
    # Solve (I - Q) @ B = R  instead of inverting (I - Q)
    B = np.linalg.solve(I - Q, R)
    return B  # B[i, 0] = prob transient state i reaches default

# 3-state example
Q = np.array([
    [0.1, 0.2, 0.0],
    [0.0, 0.2, 0.3],
    [0.1, 0.0, 0.1]
])
R = np.array([
    [0.6, 0.1],
    [0.3, 0.2],
    [0.4, 0.4]
])
B = absorption_probs(Q, R)
print("Default absorption probs:", B[:, 0].round(4))
print("Survival absorption probs:", B[:, 1].round(4))
print("Row sums (should be ~1):", B.sum(axis=1).round(4))`,
    language: "python",
    complexity: { time: "O(n^3)", space: "O(n^2)" },
  },
  {
    id: "fin-20260626-b1-position-tracker",
    title: "Real-Time Position Tracker with P&L",
    difficulty: "medium",
    topics: ["design", "hash map", "running statistics"],
    problem:
      "Design a PositionTracker supporting: fill(symbol, qty, price) — adds a fill (positive=buy, negative=sell); get_position(symbol) → net qty; get_avg_cost(symbol) → average cost; get_unrealized_pnl(symbol, market_price) → float; get_realized_pnl(symbol) → float. Handle both long and short positions, and partial/full closes that realize P&L.",
    examples: [
      {
        input: "buy 100 @ 50, buy 50 @ 52, sell 80 @ 55",
        output: "position=70, avg_cost≈50.67, unrealized_pnl(55)=≈302, realized_pnl≈352",
        explanation:
          "Avg cost after two buys: (100*50 + 50*52)/150 ≈ 50.67. Selling 80 realizes pnl = 80*(55-50.67) ≈ 346.4. Remaining 70 shares have unrealized pnl = 70*(55-50.67) ≈ 303.1.",
      },
    ],
    constraints: [
      "qty can be positive (buy) or negative (sell)",
      "Positions can be long or short",
      "Partial closes realize proportional P&L",
    ],
    approach:
      "Per symbol track (net_qty, avg_cost, realized_pnl). On a fill: if same direction as position, update avg_cost = (old_notional + new_notional) / new_qty. On opposite direction (partial close), realize pnl = closed_qty * (price - avg_cost) and reduce position.",
    code: `class PositionTracker:
    def __init__(self):
        self.positions = {}  # symbol -> [net_qty, avg_cost, realized_pnl]

    def fill(self, symbol: str, qty: float, price: float):
        if symbol not in self.positions:
            self.positions[symbol] = [0.0, 0.0, 0.0]
        net_qty, avg_cost, realized = self.positions[symbol]
        same_dir = (net_qty >= 0 and qty > 0) or (net_qty <= 0 and qty < 0)
        if same_dir or net_qty == 0:
            new_qty = net_qty + qty
            if new_qty != 0:
                avg_cost = (net_qty * avg_cost + qty * price) / new_qty
            net_qty = new_qty
        else:
            close_qty = min(abs(qty), abs(net_qty))
            realized += close_qty * (price - avg_cost) * (1 if net_qty > 0 else -1)
            net_qty += qty
            if abs(net_qty) < 1e-9:
                avg_cost = 0.0
        self.positions[symbol] = [net_qty, avg_cost, realized]

    def get_position(self, symbol): return self.positions.get(symbol, [0])[0]
    def get_avg_cost(self, symbol): return self.positions.get(symbol, [0, 0])[1]
    def get_realized_pnl(self, symbol): return self.positions.get(symbol, [0, 0, 0])[2]
    def get_unrealized_pnl(self, symbol, market_price):
        net_qty, avg_cost, _ = self.positions.get(symbol, [0, 0, 0])
        return net_qty * (market_price - avg_cost)

tracker = PositionTracker()
tracker.fill("AAPL", 100, 50); tracker.fill("AAPL", 50, 52); tracker.fill("AAPL", -80, 55)
print(f"pos={tracker.get_position('AAPL')}, avg={tracker.get_avg_cost('AAPL'):.2f}")
print(f"realized={tracker.get_realized_pnl('AAPL'):.2f}, unrealized={tracker.get_unrealized_pnl('AAPL', 55):.2f}")`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(symbols)" },
  },
  {
    id: "fin-20260626-b1-next-greater-price",
    title: "Next Greater Price Level (Monotonic Stack)",
    difficulty: "medium",
    topics: ["monotonic stack", "array"],
    leetcodeNumber: 739,
    problem:
      "Given an array of daily closing prices, for each day find the index of the next day where the price is strictly higher. If no such day exists, return -1. Finance application: computing the next time a stop-loss trigger level is exceeded, or finding the next resistance break for each candle.",
    examples: [
      {
        input: "[73, 74, 75, 71, 69, 72, 76, 73]",
        output: "[1, 2, 6, 5, 5, 6, -1, -1]",
        explanation:
          "Day 0 (73): next higher is day 1 (74). Day 2 (75): next higher is day 6 (76). Days 6 and 7 have no higher price after them.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^9",
    ],
    approach:
      "Maintain a monotonic decreasing stack of indices. For each price, pop indices from the stack while prices[stack[-1]] < current price — those popped indices found their next greater. Push current index. After iterating, remaining indices in stack have no next greater (-1).",
    code: `from typing import List

def next_greater_price(prices: List[int]) -> List[int]:
    n = len(prices)
    result = [-1] * n
    stack = []  # monotonic decreasing stack of indices

    for i, price in enumerate(prices):
        while stack and prices[stack[-1]] < price:
            idx = stack.pop()
            result[idx] = i
        stack.append(i)
    # Remaining indices in stack have no next greater; already -1
    return result

# Example
prices = [73, 74, 75, 71, 69, 72, 76, 73]
print(next_greater_price(prices))  # [1, 2, 6, 5, 5, 6, -1, -1]

# Finance use case: find next resistance break
prices2 = [100, 98, 99, 105, 103, 110]
print(next_greater_price(prices2))  # [3, 3, 3, 5, 5, -1]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260626-b1-stock-cooldown",
    title: "Best Time to Buy/Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["dynamic programming", "state machine"],
    leetcodeNumber: 309,
    problem:
      "Given daily stock prices, find the maximum profit. You may complete as many transactions as you like, but after selling you must wait one day (cooldown) before buying again. You cannot hold more than one share at a time.",
    examples: [
      {
        input: "[1,2,3,0,2]",
        output: "3",
        explanation: "Buy at 1, sell at 2 (profit 1), cooldown, buy at 0, sell at 2 (profit 2). Total = 3.",
      },
      {
        input: "[1]",
        output: "0",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "Three-state DP: held (holding a share), sold (just sold, in cooldown), rest (not holding, not in cooldown). Transitions: held = max(held, rest - price); sold = held + price; rest = max(rest, sold). Only from rest can you buy; after selling you are in sold (cooldown) for one day.",
    code: `from typing import List

def max_profit_cooldown(prices: List[int]) -> int:
    held = float('-inf')  # max profit while holding a stock
    sold = 0              # max profit on cooldown day (just sold)
    rest = 0              # max profit at rest (can buy next day)

    for price in prices:
        prev_held = held
        prev_sold = sold
        prev_rest = rest
        held = max(prev_held, prev_rest - price)
        sold = prev_held + price
        rest = max(prev_rest, prev_sold)

    return max(sold, rest)

# Examples
print(max_profit_cooldown([1, 2, 3, 0, 2]))  # 3
print(max_profit_cooldown([1]))               # 0
print(max_profit_cooldown([2, 1, 4]))         # 3 (buy@1, sell@4)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260626-b1-meeting-rooms-ii",
    title: "Minimum Trading Windows (Meeting Rooms II)",
    difficulty: "medium",
    topics: ["heap", "intervals", "greedy"],
    leetcodeNumber: 253,
    problem:
      "Given n trading session intervals [start, end] representing when strategies require exclusive access to a market data feed, find the minimum number of feeds required to avoid any overlap. Finance application: scheduling market data subscriptions across overlapping strategy windows.",
    examples: [
      {
        input: "[[0,30],[5,10],[15,20]]",
        output: "2",
        explanation:
          "Session [0,30] overlaps with both [5,10] and [15,20]. But [5,10] and [15,20] don't overlap so they can share a feed. Minimum 2 feeds needed.",
      },
      {
        input: "[[7,10],[2,4]]",
        output: "1",
      },
    ],
    constraints: [
      "0 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= start_i < end_i <= 10^6",
    ],
    approach:
      "Sort intervals by start time. Use a min-heap tracking end times of active sessions. For each new interval, if the earliest-ending session has ended (heap[0] <= start), pop and reuse; otherwise add a new feed. Heap size at the end equals the minimum feeds needed.",
    code: `import heapq
from typing import List

def min_feeds(intervals: List[List[int]]) -> int:
    if not intervals:
        return 0
    intervals.sort(key=lambda x: x[0])
    heap = []  # min-heap of end times

    for start, end in intervals:
        if heap and heap[0] <= start:
            heapq.heapreplace(heap, end)
        else:
            heapq.heappush(heap, end)

    return len(heap)

# Examples
print(min_feeds([[0, 30], [5, 10], [15, 20]]))  # 2
print(min_feeds([[7, 10], [2, 4]]))              # 1
print(min_feeds([[1,5],[2,6],[3,7],[4,8]]))      # 4`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260626-b1-buy-sell-k-txns",
    title: "Best Time to Buy/Sell Stock with K Transactions",
    difficulty: "hard",
    topics: ["dynamic programming"],
    leetcodeNumber: 188,
    problem:
      "Given daily prices and integer k, find the maximum profit with at most k transactions. A transaction = one buy + one sell. You must sell before you buy again.",
    examples: [
      {
        input: "k=2, prices=[3,2,6,5,0,3]",
        output: "7",
        explanation: "Buy at 2, sell at 6 (profit 4), then buy at 0, sell at 3 (profit 3). Total = 7.",
      },
      {
        input: "k=2, prices=[2,4,1]",
        output: "2",
      },
    ],
    constraints: [
      "0 <= k <= 100",
      "0 <= prices.length <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "DP with states: dp[t][d] = max profit using t transactions on day d. Optimize by iterating over transactions and tracking a running max of (dp[t-1][j] - prices[j]) over j < d. When k >= n//2, it's equivalent to unlimited transactions (greedy sum of positive differences).",
    code: `from typing import List

def max_profit_k_txns(k: int, prices: List[int]) -> int:
    n = len(prices)
    if not prices or k == 0:
        return 0
    # If k >= n//2, unlimited transactions (greedy)
    if k >= n // 2:
        return sum(max(prices[i+1] - prices[i], 0) for i in range(n - 1))

    dp = [0] * n  # dp[t][d] but we reuse array per transaction
    for t in range(k):
        new_dp = [0] * n
        best = -prices[0]  # max of (dp[t-1][j] - prices[j]) for j <= d
        for d in range(1, n):
            new_dp[d] = max(new_dp[d-1], best + prices[d])
            best = max(best, dp[d] - prices[d])
        dp = new_dp

    return dp[-1]

# Examples
print(max_profit_k_txns(2, [3, 2, 6, 5, 0, 3]))  # 7
print(max_profit_k_txns(2, [2, 4, 1]))             # 2
print(max_profit_k_txns(1, [1, 2, 3, 4, 5]))       # 4`,
    language: "python",
    complexity: { time: "O(k*n)", space: "O(k)" },
  },
  {
    id: "fin-20260626-b1-jump-game-stoploss",
    title: "Jump Game III — Stop-Loss Reach Analysis",
    difficulty: "medium",
    topics: ["BFS", "DFS", "graphs"],
    leetcodeNumber: 1306,
    problem:
      "Given a price array and a starting index, at index i you can jump to i+arr[i] or i-arr[i]. Determine if you can reach any index with value 0 (representing a zero-loss exit level). Finance application: can a strategy reach a stop-loss exit level from its current state given discrete jump constraints?",
    examples: [
      {
        input: "arr=[4,2,3,0,3,1,2], start=5",
        output: "True",
        explanation:
          "From index 5 (value 1): jump to 4 or 6. From 4 (value 3): jump to 1 or 7. From 6 (value 2): jump to 4 or 8(OOB). From 1 (value 2): jump to 3 (value 0). Reached!",
      },
      {
        input: "arr=[3,0,2,1,2], start=2",
        output: "False",
      },
    ],
    constraints: [
      "1 <= arr.length <= 5 * 10^4",
      "0 <= arr[i] < arr.length",
      "0 <= start < arr.length",
    ],
    approach:
      "BFS from start; for each position, try both jumps (i+arr[i] and i-arr[i]); mark visited to avoid cycles. Return True if any position with arr[i]==0 is reached.",
    code: `from typing import List
from collections import deque

def can_reach(arr: List[int], start: int) -> bool:
    n = len(arr)
    visited = set()
    queue = deque([start])
    visited.add(start)

    while queue:
        i = queue.popleft()
        if arr[i] == 0:
            return True
        for nxt in [i + arr[i], i - arr[i]]:
            if 0 <= nxt < n and nxt not in visited:
                visited.add(nxt)
                queue.append(nxt)

    return False

# Examples
print(can_reach([4, 2, 3, 0, 3, 1, 2], 5))  # True
print(can_reach([3, 0, 2, 1, 2], 2))         # False
print(can_reach([0], 0))                      # True`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260626-b1-count-paths",
    title: "Count Paths in Price Grid (Combinatorics)",
    difficulty: "medium",
    topics: ["dynamic programming", "combinatorics", "math"],
    problem:
      "A stock price starts at value 0. Each day it can go up by 1 or down by 1. Count the number of paths of length n that end at exactly value k (k must be same parity as n). Finance application: counting lattice paths in a binomial tree that end at a specific terminal price level. Extension: count paths that never go below a barrier level b.",
    examples: [
      {
        input: "n=4, k=0",
        output: "6",
        explanation: "UUDD, UDUD, UDDU, DUUD, DUDU, DDUU — all 4-step paths returning to 0.",
      },
      {
        input: "n=4, k=2",
        output: "4",
        explanation: "UUUD, UUDU, UDUU, DUUU — three ups and one down ending at +2.",
      },
    ],
    constraints: [
      "1 <= n <= 1000",
      "-n <= k <= n",
      "k and n must have the same parity, else count is 0",
    ],
    approach:
      "DP: dp[step][price] counts paths reaching each price level at each step. Alternatively, closed-form: C(n, (n+k)/2) when (n+k) is even, else 0. For barrier constraint, use reflection principle: subtract paths that touch the barrier.",
    code: `from math import comb
from typing import Dict

def count_paths(n: int, k: int) -> int:
    if (n + k) % 2 != 0 or abs(k) > n:
        return 0
    ups = (n + k) // 2
    return comb(n, ups)

def count_paths_dp(n: int, k: int) -> int:
    # dp[price_offset] where price_offset = price + n (shift to non-negative)
    dp: Dict[int, int] = {0: 1}
    for _ in range(n):
        new_dp: Dict[int, int] = {}
        for price, cnt in dp.items():
            for move in [1, -1]:
                new_price = price + move
                new_dp[new_price] = new_dp.get(new_price, 0) + cnt
        dp = new_dp
    return dp.get(k, 0)

def count_paths_barrier(n: int, k: int, barrier: int) -> int:
    # Reflection principle: subtract paths that touch barrier b
    # Reflected endpoint: k' = 2*barrier - k - 2 (reflect across barrier-1)
    if (n + k) % 2 != 0 or abs(k) > n:
        return 0
    direct = count_paths(n, k)
    k_reflected = 2 * barrier - k - 2
    reflected = count_paths(n, k_reflected) if (n + k_reflected) % 2 == 0 else 0
    return direct - reflected

print(count_paths(4, 0))          # 6
print(count_paths(4, 2))          # 4
print(count_paths_dp(4, 0))       # 6
print(count_paths_barrier(4, 0, -1))  # paths not touching -1`,
    language: "python",
    complexity: { time: "O(n^2) for DP or O(1) for closed-form", space: "O(n) for DP" },
  },
];
