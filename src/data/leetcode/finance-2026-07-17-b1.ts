import { LeetCodeProblem } from "./index";

export const financeProblems20260717B1: LeetCodeProblem[] = [
  {
    id: "fin-20260717-b1-max-k-transactions",
    title: "Best Time to Buy and Sell Stock with at Most K Transactions",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Array"],
    problem:
      "Given an array prices where prices[i] is the price of a stock on day i, and an integer k, find the maximum profit you can achieve by making at most k transactions. You may not hold more than 1 share at a time and must sell before buying again.",
    examples: [
      {
        input: "k = 2, prices = [3,2,6,5,0,3]",
        output: "7",
        explanation: "Buy on day 1 (price 2), sell on day 2 (price 6), profit 4. Buy on day 4 (price 0), sell on day 5 (price 3), profit 3. Total profit = 7.",
      },
      {
        input: "k = 1, prices = [2,4,1]",
        output: "2",
        explanation: "Buy on day 0, sell on day 1. Profit = 2.",
      },
    ],
    constraints: [
      "1 <= k <= 100",
      "1 <= prices.length <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "DP with two arrays: buy[j] = max cash after j-th buy, sell[j] = max profit after j-th sell. For each price, update in reverse transaction order to prevent same-day buy/sell reuse. When k >= n//2, we can do as many transactions as we want (unlimited). Time O(N*k), Space O(k).",
    code: `def max_profit_k_transactions(k: int, prices: list[int]) -> int:
    n = len(prices)
    if not prices or k == 0:
        return 0

    # If k >= n//2, we can take every profitable move (unlimited case)
    if k >= n // 2:
        return sum(max(prices[i] - prices[i-1], 0) for i in range(1, n))

    # buy[j]  = max profit with j buys done (holding)
    # sell[j] = max profit with j sells done (not holding)
    INF = float('inf')
    buy  = [-INF] * (k + 1)
    sell = [0]    * (k + 1)

    for price in prices:
        # Update in reverse to avoid using same-day transitions twice
        for j in range(k, 0, -1):
            sell[j] = max(sell[j], buy[j] + price)
            buy[j]  = max(buy[j], sell[j-1] - price)

    return sell[k]`,
    language: "python",
    complexity: { time: "O(N * k)", space: "O(k)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260717-b1-stream-median",
    title: "Find Median from Data Stream (Bid-Ask Mid Price)",
    difficulty: "hard",
    topics: ["Heap", "Design", "Two Pointers"],
    problem:
      "Design a MedianFinder class that supports: addNum(int num) — add a number from the data stream; findMedian() — return the median of all elements so far. Applied in HFT systems to maintain the rolling median of bid-ask mid prices for regime detection.",
    examples: [
      {
        input: 'mf = MedianFinder(); mf.addNum(1); mf.addNum(2); mf.findMedian() = 1.5; mf.addNum(3); mf.findMedian() = 2.0',
        output: "[1.5, 2.0]",
        explanation: "After [1,2], median = 1.5. After [1,2,3], median = 2.",
      },
    ],
    constraints: [
      "-10^5 <= num <= 10^5",
      "At most 5 * 10^4 calls to addNum and findMedian",
      "findMedian is called at least once",
    ],
    approach:
      "Two heaps: max-heap `lo` for the lower half, min-heap `hi` for the upper half. Maintain invariant: len(lo) == len(hi) or len(lo) == len(hi)+1. `addNum` pushes to lo, then balances by moving the max of lo to hi if len(hi) > len(lo). `findMedian` is lo[0] for odd count, or (lo[0] + hi[0]) / 2 for even. O(log N) add, O(1) findMedian.",
    code: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []   # max-heap (negated): lower half
        self.hi = []   # min-heap: upper half

    def addNum(self, num: int) -> None:
        # Push to max-heap (lower half)
        heapq.heappush(self.lo, -num)

        # Balance: max of lower must be <= min of upper
        if self.hi and (-self.lo[0]) > self.hi[0]:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))

        # Keep lo size == hi size or lo size == hi size + 1
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def findMedian(self) -> float:
        if len(self.lo) == len(self.hi):
            return (-self.lo[0] + self.hi[0]) / 2.0
        return float(-self.lo[0])`,
    language: "python",
    complexity: { time: "O(log N) per addNum, O(1) findMedian", space: "O(N)" },
    leetcodeNumber: 295,
  },
  {
    id: "fin-20260717-b1-sliding-window-max",
    title: "Sliding Window Maximum P&L",
    difficulty: "hard",
    topics: ["Monotonic Deque", "Sliding Window", "Array"],
    problem:
      "Given an array of daily P&L values and an integer k, return the maximum P&L achievable in any k-day rolling window. This models the risk management question: what is the worst-case best-k-day run in a trading period?",
    examples: [
      {
        input: "pnl = [1,3,-1,-3,5,3,6,7], k = 3",
        output: "[3,3,5,5,6,7]",
        explanation: "Windows: [1,3,-1]-max=3; [3,-1,-3]-max=3; [-1,-3,5]-max=5; [-3,5,3]-max=5; [5,3,6]-max=6; [3,6,7]-max=7.",
      },
      {
        input: "pnl = [1], k = 1",
        output: "[1]",
      },
    ],
    constraints: [
      "1 <= pnl.length <= 10^5",
      "-10^4 <= pnl[i] <= 10^4",
      "1 <= k <= pnl.length",
    ],
    approach:
      "Monotonic decreasing deque: maintain indices of potential maximums. For each new element, pop from deque's right while the element at that index <= new element (can never be maximum). Pop from left when index falls outside window. Deque front is always the current window max. O(N) time, O(k) space.",
    code: `from collections import deque

def sliding_window_max_pnl(pnl: list[int], k: int) -> list[int]:
    dq = deque()   # stores indices; front = max of current window
    result = []

    for i, val in enumerate(pnl):
        # Remove indices outside the current window
        while dq and dq[0] < i - k + 1:
            dq.popleft()

        # Maintain monotonic decreasing order:
        # remove all indices from back where pnl <= current val
        while dq and pnl[dq[-1]] <= val:
            dq.pop()

        dq.append(i)

        # Window is full after first k elements
        if i >= k - 1:
            result.append(pnl[dq[0]])

    return result`,
    language: "python",
    complexity: { time: "O(N)", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260717-b1-max-fee-profit",
    title: "Best Time to Buy and Sell Stock with Transaction Fee",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Greedy"],
    problem:
      "Given an integer array prices and an integer fee representing the transaction cost (paid once per trade), find the maximum profit. You may complete as many transactions as you like but must pay the fee for each. Model this as an execution cost minimisation problem in algo trading.",
    examples: [
      {
        input: "prices = [1,3,2,8,4,9], fee = 2",
        output: "8",
        explanation: "Buy at 1, sell at 8: profit 5. Buy at 4, sell at 9: profit 3. Total = 8 (fee paid twice).",
      },
      {
        input: "prices = [1,3,7,5,10,3], fee = 3",
        output: "6",
        explanation: "Buy at 1, sell at 10. Profit = 9 - 3 (fee) = 6.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5 * 10^4",
      "1 <= prices[i] < 5 * 10^4",
      "0 <= fee < 5 * 10^4",
    ],
    approach:
      "Two-state DP: cash = max profit when not holding; hold = max profit when holding. Transitions: hold = max(hold, cash - price); cash = max(cash, hold + price - fee). Update simultaneously each step. Fee applies on sell. O(N) time, O(1) space.",
    code: `def max_profit_with_fee(prices: list[int], fee: int) -> int:
    cash = 0              # max profit when NOT holding stock
    hold = -prices[0]     # max profit when holding stock

    for price in prices[1:]:
        prev_cash = cash
        # Sell: receive price, pay fee
        cash = max(cash, hold + price - fee)
        # Buy: pay price
        hold = max(hold, prev_cash - price)

    return cash`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
    leetcodeNumber: 714,
  },
  {
    id: "fin-20260717-b1-hire-k-workers",
    title: "Minimum Cost to Hire K Workers (K Best Analysts)",
    difficulty: "hard",
    topics: ["Greedy", "Heap", "Sorting", "Math"],
    problem:
      "You have n workers. Each worker i has a quality[i] and a minimum expected wage wage[i]. To hire exactly k workers, every hired worker must be paid at least their expected wage, and all hired workers must be paid in the same ratio relative to their quality. Find the minimum total cost to hire k workers. Applied to: hiring k analysts where quality = expected alpha contribution.",
    examples: [
      {
        input: "quality = [10,20,5], wage = [70,50,30], k = 2",
        output: "105.0",
        explanation: "Hire worker 0 and 2: ratio = max(70/10, 30/5) = 7. Pay 7*10 + 7*5 = 70+35 = 105.",
      },
      {
        input: "quality = [3,1,10,10,1], wage = [4,8,2,2,7], k = 3",
        output: "30.666...",
      },
    ],
    constraints: [
      "1 <= k <= n <= 10^4",
      "1 <= quality[i], wage[i] <= 10^4",
    ],
    approach:
      "Key insight: the optimal ratio equals wage[i]/quality[i] for some worker i. Sort workers by wage/quality ratio. For each candidate ratio (outer loop), choose the k workers with smallest quality (max-heap). Total cost = ratio * sum_of_quality. O(N log N) sort + O(N log k) heap operations.",
    code: `import heapq

def min_cost_hire_k_workers(quality: list[int],
                             wage: list[int], k: int) -> float:
    # Sort by wage/quality ratio
    workers = sorted(zip(wage, quality),
                     key=lambda wq: wq[0] / wq[1])

    max_heap = []   # max-heap of quality values (negated)
    quality_sum = 0
    best_cost   = float('inf')

    for w, q in workers:
        ratio = w / q
        # Include this worker (they define the current ratio)
        heapq.heappush(max_heap, -q)
        quality_sum += q

        # Keep only k smallest qualities
        if len(max_heap) > k:
            quality_sum += heapq.heappop(max_heap)  # removes largest (most negative)

        # Once we have exactly k workers, compute cost
        if len(max_heap) == k:
            best_cost = min(best_cost, ratio * quality_sum)

    return best_cost`,
    language: "python",
    complexity: { time: "O(N log N + N log k)", space: "O(N)" },
    leetcodeNumber: 857,
  },
  {
    id: "fin-20260717-b1-jump-signal-dp",
    title: "Jump Game VI: Maximum Signal Accumulation",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Monotonic Deque", "Sliding Window"],
    problem:
      "You are given an integer array score (representing daily alpha signals) and an integer k. Starting from index 0, you can jump to any index i+1, i+2, ..., i+k in one step. The total score is the sum of scores at each visited index. Return the maximum score you can achieve reaching index n-1. Applied to: choosing which k-day windows of alpha signal to harvest.",
    examples: [
      {
        input: "score = [1,-1,-2,4,-7,3], k = 2",
        output: "7",
        explanation: "Path 0->1->3->5: 1+(-1)+4+3=7.",
      },
      {
        input: "score = [10,-5,-2,4,0,3], k = 3",
        output: "17",
        explanation: "Path 0->3->5: 10+4+3=17.",
      },
    ],
    constraints: [
      "1 <= score.length <= 10^5",
      "-10^5 <= score[i] <= 10^5",
      "1 <= k <= score.length",
    ],
    approach:
      "DP with monotonic deque: dp[i] = max score to reach index i. dp[i] = score[i] + max(dp[i-k], ..., dp[i-1]). Use a monotonic decreasing deque to query the max of the last k dp values in O(1) per step. Total O(N) time, O(k) space.",
    code: `from collections import deque

def max_signal_accumulation(score: list[int], k: int) -> int:
    n  = len(score)
    dp = [0] * n
    dp[0] = score[0]

    dq = deque([0])   # indices, dp values decreasing

    for i in range(1, n):
        # Remove indices outside the window of size k
        while dq and dq[0] < i - k:
            dq.popleft()

        dp[i] = dp[dq[0]] + score[i]   # best previous dp + current score

        # Maintain decreasing monotonic order in deque
        while dq and dp[dq[-1]] <= dp[i]:
            dq.pop()
        dq.append(i)

    return dp[-1]`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
    leetcodeNumber: 1696,
  },
  {
    id: "fin-20260717-b1-k-pairs-min-sum",
    title: "Find K Pairs with Smallest Risk-Adjusted Returns",
    difficulty: "medium",
    topics: ["Heap", "Array", "Sorting"],
    problem:
      "Given two sorted arrays of risk-adjusted returns nums1 and nums2 (sorted ascending), find the k pairs (i, j) with the k smallest pair sums nums1[i] + nums2[j]. Applied to: finding k pairs of instruments (one from each strategy bucket) with minimum combined drawdown.",
    examples: [
      {
        input: "nums1 = [1,7,11], nums2 = [2,4,6], k = 3",
        output: "[[1,2],[1,4],[1,6]]",
        explanation: "The 3 pairs with smallest sums: 1+2=3, 1+4=5, 1+6=7.",
      },
      {
        input: "nums1 = [1,1,2], nums2 = [1,2,3], k = 2",
        output: "[[1,1],[1,1]]",
      },
    ],
    constraints: [
      "1 <= nums1.length, nums2.length <= 10^5",
      "-10^9 <= nums1[i], nums2[i] <= 10^9",
      "1 <= k <= 10^4",
    ],
    approach:
      "Min-heap seeded with (nums1[i] + nums2[0], i, 0) for each i in nums1. Pop the minimum pair; if its nums2 index j+1 exists, push (nums1[i] + nums2[j+1], i, j+1). Repeat k times. Heap size never exceeds min(k, len(nums1)). O(k log min(k, N)) time.",
    code: `import heapq

def k_smallest_pairs(nums1: list[int], nums2: list[int], k: int) -> list[list[int]]:
    if not nums1 or not nums2:
        return []

    # Seed heap with first element of nums2 paired with each element of nums1
    heap = []
    for i, v1 in enumerate(nums1[:k]):   # at most k seeds needed
        heapq.heappush(heap, (v1 + nums2[0], i, 0))

    result = []
    while heap and len(result) < k:
        total, i, j = heapq.heappop(heap)
        result.append([nums1[i], nums2[j]])
        # Advance nums2 pointer for this nums1[i]
        if j + 1 < len(nums2):
            heapq.heappush(heap, (nums1[i] + nums2[j + 1], i, j + 1))

    return result`,
    language: "python",
    complexity: { time: "O(k log k)", space: "O(k)" },
    leetcodeNumber: 373,
  },
  {
    id: "fin-20260717-b1-markov-target-prob",
    title: "Markov Chain Price Target Probability",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Probability", "Math"],
    problem:
      "A stock price can move up (+1) or down (-1) each step with probability p and 1-p respectively. Starting at position 0, what is the probability of reaching target T before hitting lower barrier L (L < 0 < T)? This is the gambler's ruin problem, commonly asked in quant interviews for option barrier analysis.",
    examples: [
      {
        input: "T = 3, L = -2, p = 0.55",
        output: "0.7392",
        explanation: "With p=0.55, the probability of reaching +3 before -2 is approximately 0.739.",
      },
      {
        input: "T = 1, L = -1, p = 0.5",
        output: "0.5",
        explanation: "Fair coin flip: symmetric, P(reach +1 before -1) = 0.5.",
      },
    ],
    constraints: [
      "L < 0 < T",
      "0 < p < 1",
      "T, |L| <= 100",
    ],
    approach:
      "Analytic solution: for a biased random walk, P(reach T | start at 0, absorbing barriers at L and T) = (q^(-L) - 1) / (q^(-L) - q^T) where q = (1-p)/p (when p != 0.5). For p=0.5 the formula is (-L) / (T - L). DP verification: solve the linear system P(x) = p*P(x+1) + (1-p)*P(x-1) with boundary conditions P(L)=0, P(T)=1.",
    code: `def gambler_ruin_prob(T: int, L: int, p: float) -> float:
    """
    P(reach T before L | start at 0), biased random walk.
    Analytic: uses the ratio q = (1-p)/p.
    """
    if abs(p - 0.5) < 1e-12:
        # Fair walk: linear interpolation
        return -L / (T - L)

    q = (1 - p) / p
    # P(ruin at L) = (1 - q^T) / (q^L - q^T)  -- using L negative
    # P(reach T)  = (1 - q^L) / (1 - q^(T-L)) ... rederiving:
    # General formula: P(reach T from 0) = (q^(-L+0) - 1) / (q^(-L) - q^T) is wrong
    # Correct: let rho = q = (1-p)/p
    # P(0 -> T before L) = (1 - rho^(T - 0)) / (1 - rho^(T - L))
    # (positions shifted so L->0 absorbing, T->T-L target)
    shift = -L                  # shift all by -L, now start at -L, barriers 0 and T-L
    start = 0 - L
    target = T - L
    # P(reach target from start, barrier 0) = (1 - q^start) / (1 - q^target)
    if abs(q - 1.0) < 1e-12:
        return start / target
    return (1 - q**start) / (1 - q**target)

def gambler_ruin_dp(T: int, L: int, p: float) -> float:
    """DP verification via linear system."""
    size = T - L + 1
    prob = [0.0] * size
    # prob[i] = P(reach T | position = L + i)
    # Boundary: prob[0] = 0 (at L), prob[T-L] = 1 (at T)
    # Inner: prob[i] = p*prob[i+1] + (1-p)*prob[i-1]
    # Solve analytically or iteratively
    for _ in range(1000):   # fixed-point iteration
        for i in range(1, T - L):
            prob[i] = p * prob[i + 1] + (1 - p) * prob[i - 1]
        prob[T - L] = 1.0
    return prob[-L]   # index of starting position 0

p_analytic = gambler_ruin_prob(T=3, L=-2, p=0.55)
p_dp       = gambler_ruin_dp(T=3, L=-2, p=0.55)
print(f"Analytic: {p_analytic:.4f}  DP: {p_dp:.4f}")`,
    language: "python",
    complexity: { time: "O(1) analytic, O((T-L)^2) for DP iteration", space: "O(T-L)" },
  },
  {
    id: "fin-20260717-b1-design-position-tracker",
    title: "Design Position Tracker with Bracket Orders",
    difficulty: "medium",
    topics: ["Design", "Hash Table", "Ordered Set"],
    problem:
      "Design a PositionTracker class for an OMS that supports: add_position(instrument, qty, price) — add a new position; close_position(instrument, qty, close_price) — realise P&L on partial/full close; get_unrealised_pnl(instrument, current_price) — compute unrealised P&L; get_top_k_pnl(k, prices_dict) — return top-k instruments by current P&L.",
    examples: [
      {
        input: "pt.add('AAPL',100,150); pt.add('MSFT',50,300); pt.close('AAPL',50,160); pt.get_unrealised_pnl('AAPL', 165)",
        output: "750",
        explanation: "Remaining 50 AAPL shares at avg cost 150, mark at 165: unrealised = 50*(165-150) = 750. Realised from close: 50*(160-150)=500.",
      },
    ],
    constraints: [
      "Instrument is a non-empty string",
      "0 < qty <= 10^6",
      "0 < price <= 10^5",
      "At most 10^4 operations",
    ],
    approach:
      "Hash map per instrument storing (avg_cost, total_qty, realised_pnl). On `add_position`: update weighted average cost. On `close_position`: compute realised P&L from avg cost, reduce qty. `get_top_k_pnl` uses heapq.nlargest over all instruments. FIFO costing would use a deque but AVCO (average cost) is simpler here.",
    code: `import heapq

class PositionTracker:
    def __init__(self):
        # instrument -> {avg_cost, qty, realised_pnl}
        self.positions: dict = {}

    def add_position(self, instrument: str, qty: int, price: float) -> None:
        if instrument not in self.positions:
            self.positions[instrument] = {
                'avg_cost': price, 'qty': qty, 'realised_pnl': 0.0
            }
        else:
            p = self.positions[instrument]
            total_cost = p['avg_cost'] * p['qty'] + price * qty
            p['qty'] += qty
            p['avg_cost'] = total_cost / p['qty']

    def close_position(self, instrument: str, qty: int, close_price: float) -> float:
        if instrument not in self.positions:
            raise ValueError(f"No position in {instrument}")
        p = self.positions[instrument]
        if qty > p['qty']:
            raise ValueError("Close qty exceeds position")
        pnl = (close_price - p['avg_cost']) * qty
        p['realised_pnl'] += pnl
        p['qty'] -= qty
        if p['qty'] == 0:
            del self.positions[instrument]
        return pnl

    def get_unrealised_pnl(self, instrument: str, current_price: float) -> float:
        if instrument not in self.positions:
            return 0.0
        p = self.positions[instrument]
        return (current_price - p['avg_cost']) * p['qty']

    def get_top_k_pnl(self, k: int, prices: dict) -> list:
        pnls = []
        for inst, p in self.positions.items():
            mkt_price = prices.get(inst, p['avg_cost'])
            total_pnl = (mkt_price - p['avg_cost']) * p['qty'] + p['realised_pnl']
            pnls.append((inst, total_pnl))
        return heapq.nlargest(k, pnls, key=lambda x: x[1])

pt = PositionTracker()
pt.add_position('AAPL', 100, 150.0)
pt.add_position('MSFT',  50, 300.0)
pt.close_position('AAPL', 50, 160.0)
print(f"AAPL unrealised: {pt.get_unrealised_pnl('AAPL', 165.0)}")
print(f"Top 2: {pt.get_top_k_pnl(2, {'AAPL':165,'MSFT':310})}")`,
    language: "python",
    complexity: { time: "O(log N) add/close, O(N log k) top-k", space: "O(N)" },
  },
  {
    id: "fin-20260717-b1-max-sum-submatrix",
    title: "Maximum Sum Submatrix (Risk Attribution Table)",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Prefix Sum", "Kadane's Algorithm"],
    problem:
      "Given an m x n matrix of risk P&L contributions (can be negative), find the rectangular submatrix that maximises the total sum. Applied to: identifying the contiguous block of (instruments x factors) in a risk attribution table with the highest combined contribution.",
    examples: [
      {
        input: "matrix = [[1,0,1],[0,-2,3]]",
        output: "4",
        explanation: "Submatrix [[0,1],[-2,3]] has sum 4: top-right 2x2.",
      },
      {
        input: "matrix = [[2,1,-3,-4,5],[0,6,3,4,1],[2,-2,-1,4,-5],[-3,3,1,0,3]]",
        output: "18",
      },
    ],
    constraints: [
      "m == matrix.length",
      "n == matrix[0].length",
      "1 <= m, n <= 100",
      "-100 <= matrix[i][j] <= 100",
    ],
    approach:
      "Fix two row boundaries r1, r2. Collapse columns by summing matrix[r1..r2][j] into a 1D array col_sum. Apply Kadane's algorithm on col_sum to find the max subarray sum. Iterate all O(m^2) row pairs; each Kadane scan is O(n). Total O(m^2 * n).",
    code: `def max_sum_submatrix(matrix: list[list[int]]) -> int:
    m, n = len(matrix), len(matrix[0])
    best = float('-inf')

    def kadane(arr: list) -> int:
        """Maximum subarray sum (1D Kadane)."""
        max_sum = float('-inf')
        cur = 0
        for x in arr:
            cur = max(x, cur + x)
            max_sum = max(max_sum, cur)
        return max_sum

    # Fix top row r1, expand bottom row r2
    for r1 in range(m):
        col_sum = [0] * n   # prefix column sums for current row range
        for r2 in range(r1, m):
            for j in range(n):
                col_sum[j] += matrix[r2][j]
            # Find best subarray in col_sum
            best = max(best, kadane(col_sum))

    return best`,
    language: "python",
    complexity: { time: "O(m^2 * n)", space: "O(n)" },
    leetcodeNumber: 363,
  },
];
