import type { LeetCodeProblem } from "./index";

export const financeProblems20260519B1: LeetCodeProblem[] = [
  {
    id: "fin-0519-b1-fx-arbitrage",
    leetcodeNumber: 0,
    title: "FX Arbitrage Detection (Bellman-Ford)",
    difficulty: "hard",
    topics: ["graphs", "bellman-ford", "shortest-path"],
    problem:
      "Given n currencies and a table of exchange rates rates[i][j] (how many units of currency j you get for 1 unit of currency i), detect whether an arbitrage opportunity exists — a cycle of currency conversions that returns more than you started with. For example, if USD→EUR→GBP→USD yields 1.0023 USD per USD, that is arbitrage.",
    examples: [
      {
        input: "n = 3, rates = [[1, 0.85, 0.77], [1.18, 1, 0.90], [1.30, 1.11, 1]]",
        output: "False",
        explanation: "No cycle of conversions yields a profit in this example.",
      },
      {
        input: "n = 3, rates = [[1, 0.85, 0.77], [1.18, 1, 0.91], [1.35, 1.11, 1]]",
        output: "True",
        explanation: "USD → GBP → EUR → USD gives 0.77 * 1.11 * 1.18 ≈ 1.008 > 1, a profitable cycle.",
      },
    ],
    approach:
      "Take the negative logarithm of each rate: w(i,j) = -log(rates[i][j]). Arbitrage exists iff there is a negative-weight cycle in this graph. Run Bellman-Ford for n-1 relaxation passes; if any edge can still be relaxed on the nth pass, a negative cycle (arbitrage) exists.",
    code: `import math

def detect_arbitrage(rates: list[list[float]]) -> bool:
    n = len(rates)
    # Build edge list with negative-log weights
    edges: list[tuple[int, int, float]] = []
    for i in range(n):
        for j in range(n):
            if i != j and rates[i][j] > 0:
                edges.append((i, j, -math.log(rates[i][j])))

    # Bellman-Ford: dist all 0 = virtual zero-weight source to every node
    dist = [0.0] * n

    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # nth relaxation — if any edge still improves, negative cycle exists
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return True  # arbitrage detected

    return False`,
    language: "python",
    complexity: { time: "O(n^3)", space: "O(n^2)" },
  },
  {
    id: "fin-0519-b1-ipo",
    leetcodeNumber: 502,
    title: "IPO — Maximize Capital",
    difficulty: "hard",
    topics: ["heap", "greedy", "sorting"],
    problem:
      "You are about to IPO. You have w initial capital and can complete at most k projects. Each project i has a minimum capital requirement capital[i] and yields profit profits[i] (added to your capital). Projects cannot overlap. Pick at most k projects to maximize your final capital.",
    examples: [
      {
        input: "k = 2, w = 0, profits = [1, 2, 3], capital = [0, 1, 1]",
        output: "4",
        explanation: "Start with 0: take project 0 (profit 1, now have 1). Then take project 2 (profit 3, total 4).",
      },
      {
        input: "k = 3, w = 0, profits = [1, 2, 3], capital = [0, 1, 2]",
        output: "6",
        explanation: "Take all three sequentially: 0 → 1 → 3 → 6.",
      },
    ],
    approach:
      "Sort projects by minimum capital. Use a pointer to sweep affordable projects into a max-heap (by profit) as your capital grows. Each round, pop the most profitable affordable project, add its profit to w, repeat k times. This greedy is optimal because you always take the best currently available option.",
    code: `import heapq

def find_maximized_capital(
    k: int, w: int, profits: list[int], capital: list[int]
) -> int:
    projects = sorted(zip(capital, profits))
    max_heap: list[int] = []  # negated profits (max-heap via negation)
    idx = 0
    n = len(projects)

    for _ in range(k):
        while idx < n and projects[idx][0] <= w:
            heapq.heappush(max_heap, -projects[idx][1])
            idx += 1
        if not max_heap:
            break
        w += -heapq.heappop(max_heap)

    return w`,
    language: "python",
    complexity: { time: "O((n + k) log n)", space: "O(n)" },
  },
  {
    id: "fin-0519-b1-portfolio-knapsack",
    leetcodeNumber: 0,
    title: "0-1 Portfolio Knapsack",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack"],
    problem:
      "You have a budget W (integer, in thousands of dollars) and n assets. Asset i costs cost[i] and has an expected annual return of expected_return[i] (a float). You may invest in each asset at most once (0-1 knapsack). Find the maximum total expected return achievable without exceeding the budget.",
    examples: [
      {
        input: "W = 10, cost = [3, 4, 5, 6], expected_return = [4.0, 5.0, 3.0, 7.0]",
        output: "12.0",
        explanation: "Pick assets 1 and 3: cost 4+6=10, return 5+7=12.",
      },
      {
        input: "W = 5, cost = [3, 4, 5], expected_return = [4.0, 5.0, 6.0]",
        output: "6.0",
        explanation: "Only asset 2 fits alone (cost 5, return 6). Assets 0+1 cost 7 > 5.",
      },
    ],
    approach:
      "Standard 0-1 knapsack DP. dp[w] = maximum return with budget w. Iterate each asset and update the table right-to-left to prevent using the same asset twice. Answer is max(dp).",
    code: `def portfolio_knapsack(
    W: int, cost: list[int], expected_return: list[float]
) -> float:
    dp = [0.0] * (W + 1)
    for c, r in zip(cost, expected_return):
        # Right-to-left ensures each asset used at most once
        for w in range(W, c - 1, -1):
            dp[w] = max(dp[w], dp[w - c] + r)
    return max(dp)`,
    language: "python",
    complexity: { time: "O(n * W)", space: "O(W)" },
  },
  {
    id: "fin-0519-b1-gamblers-ruin",
    leetcodeNumber: 0,
    title: "Gambler's Ruin",
    difficulty: "medium",
    topics: ["probability", "math", "dynamic-programming"],
    problem:
      "A gambler starts with $i. At each step they win $1 with probability p and lose $1 with probability q = 1 - p. The game ends when they reach $0 (bankrupt) or $N (target). Return the probability of reaching $N before going bankrupt. This models leveraged trading or market-making ruin risk.",
    examples: [
      {
        input: "i = 5, N = 10, p = 0.5",
        output: "0.5",
        explanation: "Fair game: P(reach N) = i / N = 5/10 = 0.5.",
      },
      {
        input: "i = 3, N = 10, p = 0.4",
        output: "≈ 0.0976",
        explanation: "Unfair game: P = (1-(q/p)^i) / (1-(q/p)^N) = (1-1.5^3)/(1-1.5^10) ≈ 0.0976.",
      },
    ],
    approach:
      "For p = 0.5: P(i) = i/N. For p ≠ 0.5: let r = q/p; P(i) = (1 - r^i) / (1 - r^N). Verify with iterative DP: P[j] = p*P[j+1] + q*P[j-1], boundary P[0]=0, P[N]=1.",
    code: `def gamblers_ruin(i: int, N: int, p: float) -> float:
    """Closed-form probability of reaching N starting from i."""
    if i == 0: return 0.0
    if i == N: return 1.0
    q = 1.0 - p
    if abs(p - 0.5) < 1e-12:
        return i / N  # fair game
    r = q / p
    return (1.0 - r ** i) / (1.0 - r ** N)


def gamblers_ruin_dp(i: int, N: int, p: float) -> float:
    """Iterative value-iteration for verification."""
    q = 1.0 - p
    prob = [0.0] * (N + 1)
    prob[N] = 1.0
    for _ in range(10_000):
        new_prob = prob[:]
        for j in range(1, N):
            new_prob[j] = p * prob[j + 1] + q * prob[j - 1]
        if max(abs(new_prob[j] - prob[j]) for j in range(N + 1)) < 1e-9:
            break
        prob = new_prob
    return prob[i]`,
    language: "python",
    complexity: { time: "O(1) closed form; O(N·iter) DP", space: "O(1) closed form; O(N) DP" },
  },
  {
    id: "fin-0519-b1-matrix-exp",
    leetcodeNumber: 0,
    title: "Matrix Exponentiation for Fibonacci",
    difficulty: "medium",
    topics: ["math", "matrix-exponentiation", "divide-and-conquer"],
    problem:
      "Compute the Nth Fibonacci number in O(log N) time using matrix exponentiation. The identity [[1,1],[1,0]]^N = [[F(N+1),F(N)],[F(N),F(N-1)]] generalises to any linear recurrence — including Markov chain transition matrices raised to large powers in quant finance.",
    examples: [
      {
        input: "N = 10",
        output: "55",
        explanation: "F(10) = 55, computed via ~4 matrix multiplications.",
      },
      {
        input: "N = 50",
        output: "12586269025",
        explanation: "Exact integer result from just 6 matrix multiplications.",
      },
    ],
    approach:
      "Represent the recurrence as a 2×2 matrix equation. Implement fast matrix power via repeated squaring (halve exponent each step, square the matrix). Extract F(N) from the result. The same companion-matrix pattern applies to any k-th order linear recurrence.",
    code: `def mat_mul(A: list[list[int]], B: list[list[int]]) -> list[list[int]]:
    return [
        [A[0][0]*B[0][0] + A[0][1]*B[1][0],
         A[0][0]*B[0][1] + A[0][1]*B[1][1]],
        [A[1][0]*B[0][0] + A[1][1]*B[1][0],
         A[1][0]*B[0][1] + A[1][1]*B[1][1]],
    ]

def mat_pow(M: list[list[int]], n: int) -> list[list[int]]:
    result = [[1, 0], [0, 1]]  # identity
    while n:
        if n & 1:
            result = mat_mul(result, M)
        M = mat_mul(M, M)
        n >>= 1
    return result

def fibonacci(n: int) -> int:
    """F(0)=0, F(1)=1, O(log n)."""
    if n == 0:
        return 0
    return mat_pow([[1, 1], [1, 0]], n)[0][1]`,
    language: "python",
    complexity: { time: "O(log N)", space: "O(1)" },
  },
  {
    id: "fin-0519-b1-rate-limiter",
    leetcodeNumber: 0,
    title: "Token Bucket Rate Limiter",
    difficulty: "medium",
    topics: ["design", "rate-limiting"],
    problem:
      "Design a TokenBucket class that models a token-bucket rate limiter. It has a capacity C (max tokens) and a refill rate R (tokens per second). Implement allow(n_tokens, current_time_sec) which returns True if n_tokens are available (and consumes them) or False otherwise. Used in trading systems to enforce exchange-imposed order-submission rate limits.",
    examples: [
      {
        input: "C=10, R=5.0; allow(8, t=0)→True; allow(5, t=0)→False; allow(4, t=1)→True",
        output: "True, False, True",
        explanation: "t=0: 10 tokens, consume 8 → 2 left. 5 requested but 2 left → deny. t=1: 2+5*1=7 tokens, consume 4 → allow.",
      },
      {
        input: "C=5, R=2.0; allow(5, t=0)→True; allow(2, t=0.5)→False; allow(1, t=1)→True",
        output: "True, False, True",
        explanation: "t=0: 5→0. t=0.5: 0+2*0.5=1 token, need 2 → deny. t=1: 1+1=2, consume 1 → allow.",
      },
    ],
    approach:
      "Store last_tokens and last_time. On each call: tokens = min(capacity, last_tokens + rate * elapsed). If tokens >= n_tokens, subtract and return True; else return False. The continuous-refill formula avoids discrete tick timers and handles arbitrary call intervals exactly.",
    code: `class TokenBucket:
    def __init__(self, capacity: float, rate: float):
        self.capacity = capacity
        self.rate = rate          # tokens per second
        self._tokens = float(capacity)
        self._last_time = 0.0

    def allow(self, n_tokens: float, current_time: float) -> bool:
        elapsed = current_time - self._last_time
        self._tokens = min(self.capacity, self._tokens + self.rate * elapsed)
        self._last_time = current_time
        if self._tokens >= n_tokens:
            self._tokens -= n_tokens
            return True
        return False`,
    language: "python",
    complexity: { time: "O(1) per call", space: "O(1)" },
  },
  {
    id: "fin-0519-b1-histogram-rect",
    leetcodeNumber: 84,
    title: "Largest Rectangle in Histogram",
    difficulty: "hard",
    topics: ["stack", "monotonic-stack", "array"],
    problem:
      "Given an array heights where heights[i] is the height of a bar of width 1, find the area of the largest rectangle that fits entirely within the histogram. Market microstructure framing: each bar is available depth (shares) at a price level; the rectangle area is the maximum notional fill at a uniform price.",
    examples: [
      {
        input: "heights = [2, 1, 5, 6, 2, 3]",
        output: "10",
        explanation: "Bars at indices 2 and 3 (heights 5, 6) form a rectangle of height 5, width 2 → area 10.",
      },
      {
        input: "heights = [2, 4]",
        output: "4",
        explanation: "Single bar of height 4 gives area 4.",
      },
    ],
    approach:
      "Maintain a monotonic (non-decreasing) stack of indices. When a shorter bar is encountered, pop all taller bars: each popped bar defines the limiting height with width from the new stack top to the current index. Append a sentinel 0 to flush the stack at the end.",
    code: `def largest_rectangle_area(heights: list[int]) -> int:
    stack: list[int] = []  # indices with non-decreasing heights
    max_area = 0
    bars = heights + [0]   # sentinel flushes remaining stack

    for i, h in enumerate(bars):
        while stack and bars[stack[-1]] > h:
            height = bars[stack.pop()]
            width = i if not stack else i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)

    return max_area`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-0519-b1-weighted-sample",
    leetcodeNumber: 528,
    title: "Random Pick with Weight",
    difficulty: "easy",
    topics: ["math", "binary-search", "prefix-sum"],
    problem:
      "Given an array w of positive weights, implement pickIndex() which returns index i with probability proportional to w[i]. Finance context: sample assets proportional to market capitalisation for index-tracking or Monte Carlo scenario generation.",
    examples: [
      {
        input: "w = [1, 3], many calls to pickIndex()",
        output: "index 0 ≈25%, index 1 ≈75%",
        explanation: "Total weight 4; P(0)=1/4, P(1)=3/4.",
      },
      {
        input: "w = [1, 1, 1, 1]",
        output: "each index ≈25%",
        explanation: "Equal weights → uniform distribution.",
      },
    ],
    approach:
      "Build a prefix-sum array. To sample, draw a uniform integer in [1, total_weight] then binary-search for the leftmost prefix entry >= that value. Construction O(n); each pick O(log n).",
    code: `import random
from bisect import bisect_left

class WeightedPicker:
    def __init__(self, w: list[int]):
        self.prefix: list[int] = []
        running = 0
        for x in w:
            running += x
            self.prefix.append(running)
        self.total = running

    def pick_index(self) -> int:
        target = random.randint(1, self.total)
        return bisect_left(self.prefix, target)`,
    language: "python",
    complexity: { time: "O(n) build, O(log n) pick", space: "O(n)" },
  },
  {
    id: "fin-0519-b1-jump-game-ii",
    leetcodeNumber: 45,
    title: "Jump Game II — Minimum Rebalancing Windows",
    difficulty: "medium",
    topics: ["greedy", "dynamic-programming"],
    problem:
      "Given an array nums where nums[i] is the maximum jump from index i, return the minimum jumps to reach the last index. Finance framing: each index is a rebalancing window; nums[i] is how many future windows you may skip; find the minimum number of rebalancing events to reach the investment horizon.",
    examples: [
      {
        input: "nums = [2, 3, 1, 1, 4]",
        output: "2",
        explanation: "Jump 0→1 then 1→4.",
      },
      {
        input: "nums = [2, 3, 0, 1, 4]",
        output: "2",
        explanation: "Jump 0→1 then 1→4.",
      },
    ],
    approach:
      "Greedy BFS-layer: track current_end (boundary of current jump) and farthest (max reachable). When you exhaust current_end, take another jump and extend to farthest. Increment jump count at each boundary crossing.",
    code: `def min_jumps(nums: list[int]) -> int:
    jumps = 0
    current_end = 0
    farthest = 0
    for i in range(len(nums) - 1):  # no jump needed from last index
        farthest = max(farthest, i + nums[i])
        if i == current_end:
            jumps += 1
            current_end = farthest
            if current_end >= len(nums) - 1:
                break
    return jumps`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-0519-b1-min-hire-k",
    leetcodeNumber: 857,
    title: "Minimum Cost to Hire K Workers",
    difficulty: "hard",
    topics: ["heap", "sorting", "math", "greedy"],
    problem:
      "There are n workers each with quality q[i] and minimum wage w[i]. You must hire exactly k workers; each must be paid proportionally to their quality (paid_i / q[i] = constant for all group members) and at least their minimum wage. Find the minimum total wage to hire k workers.",
    examples: [
      {
        input: "k = 2, quality = [3, 1, 10, 10, 1], wage = [4, 8, 2, 2, 7]",
        output: "≈ 17.333",
        explanation: "Hire workers 0 and 2: ratio = max(4/3, 2/10) = 4/3; cost = 4/3*(3+10) ≈ 17.33.",
      },
      {
        input: "k = 3, quality = [3, 1, 10, 10, 1], wage = [4, 8, 2, 2, 7]",
        output: "≈ 30.667",
        explanation: "Hire workers 0, 2, 3: ratio 4/3, cost = 4/3*23 ≈ 30.67.",
      },
    ],
    approach:
      "Sort workers by wage/quality ratio. For each candidate as rate-setter, the cheapest group of size k uses the k smallest qualities seen so far. Maintain a max-heap of size k on qualities and track their sum; total cost = ratio * quality_sum.",
    code: `import heapq

def min_cost_to_hire_workers(
    quality: list[int], wage: list[int], k: int
) -> float:
    workers = sorted(zip(quality, wage), key=lambda x: x[1] / x[0])
    max_heap: list[int] = []  # negated qualities
    quality_sum = 0
    min_cost = float('inf')

    for q, w in workers:
        ratio = w / q
        heapq.heappush(max_heap, -q)
        quality_sum += q
        if len(max_heap) > k:
            quality_sum += heapq.heappop(max_heap)  # stored negated
        if len(max_heap) == k:
            min_cost = min(min_cost, ratio * quality_sum)

    return min_cost`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
];
