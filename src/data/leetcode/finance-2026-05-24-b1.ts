import type { LeetCodeProblem } from "./index";

export const financeProblems20260524B1: LeetCodeProblem[] = [
  {
    id: "fin-0524-b1-stock-txn-fee",
    leetcodeNumber: 714,
    title: "Best Time to Buy and Sell Stock with Transaction Fee",
    difficulty: "medium",
    topics: ["dynamic-programming", "greedy", "finance"],
    problem:
      "Given an array prices where prices[i] is the stock price on day i, and an integer fee (flat transaction cost per complete round-trip trade), find the maximum profit. You may complete unlimited transactions but must pay the fee on each sell. You may not hold multiple positions simultaneously.",
    examples: [
      {
        input: "prices = [1, 3, 2, 8, 4, 9], fee = 2",
        output: "8",
        explanation: "Buy@1 sell@8 (profit=7, pay fee=2, net=5). Buy@4 sell@9 (profit=5, pay fee=2, net=3). Total=8.",
      },
      {
        input: "prices = [1, 3, 7, 5, 10, 3], fee = 3",
        output: "6",
        explanation: "Buy@1 sell@10 (profit=9, fee=3, net=6). One transaction optimal.",
      },
    ],
    approach:
      "Two states: cash (max profit holding no stock) and hold (max profit holding a stock). Transitions: cash = max(cash, hold + price - fee); hold = max(hold, cash - price). The fee is deducted on sell, which accounts for transaction costs without deciding up front which transactions to make.",
    code: `def max_profit_with_fee(prices: list[int], fee: int) -> int:
    """
    DP: cash = best profit without a position,
        hold = best profit while holding a stock.
    Greedy-style O(1) space — only two states needed.
    """
    cash = 0            # starting with no position
    hold = -prices[0]   # cost of buying on day 0

    for price in prices[1:]:
        # Sell: receive price, pay fee; or do nothing
        cash = max(cash, hold + price - fee)
        # Buy: pay price; or continue holding
        hold = max(hold, cash - price)

    return cash   # never optimal to hold at the end


# Examples
print(max_profit_with_fee([1, 3, 2, 8, 4, 9], fee=2))   # 8
print(max_profit_with_fee([1, 3, 7, 5, 10, 3], fee=3))  # 6
print(max_profit_with_fee([1, 2], fee=5))                # 0 (fee exceeds profit)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-0524-b1-jump-game-reach",
    leetcodeNumber: 45,
    title: "Jump Game II — Minimum Steps to Full Investment",
    difficulty: "medium",
    topics: ["greedy", "dynamic-programming", "finance"],
    problem:
      "You have an array liquidity[] where liquidity[i] is the maximum number of positions forward you can skip from venue i. Starting at index 0, find the minimum number of routing hops to reach the last venue (index n-1). This models minimum-hop smart order routing: each venue can forward to venues within its capacity range.",
    examples: [
      {
        input: "liquidity = [2, 3, 1, 1, 4]",
        output: "2",
        explanation: "Jump from index 0 (reach=2) to index 1 (reach=1+3=4), then jump to index 4. Two hops.",
      },
      {
        input: "liquidity = [2, 3, 0, 1, 4]",
        output: "2",
        explanation: "Jump to index 1 (max reach = 4), then jump to index 4.",
      },
    ],
    approach:
      "Greedy BFS level-by-level: maintain current_reach (farthest reachable in current jump) and next_reach (farthest reachable in next jump). When i exceeds current_reach, a new jump is forced — increment jumps and set current_reach = next_reach. O(n) time, O(1) space.",
    code: `def min_jumps(liquidity: list[int]) -> int:
    """
    Greedy: process each index, tracking farthest reachable in the current
    jump and the farthest reachable after one more jump.
    When we pass the current reach boundary, we must use one more jump.
    """
    n = len(liquidity)
    if n <= 1:
        return 0

    jumps = 0
    current_reach = 0   # farthest index reachable in <= jumps hops
    next_reach    = 0   # farthest index reachable in <= jumps+1 hops

    for i in range(n - 1):   # don't need to jump from the last index
        next_reach = max(next_reach, i + liquidity[i])

        if i == current_reach:       # exhausted current jump range
            jumps        += 1
            current_reach = next_reach

            if current_reach >= n - 1:
                break

    return jumps


print(min_jumps([2, 3, 1, 1, 4]))  # 2
print(min_jumps([2, 3, 0, 1, 4]))  # 2
print(min_jumps([1, 1, 1, 1]))     # 3`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-0524-b1-heap-kth-largest",
    leetcodeNumber: 703,
    title: "K-th Largest PnL in Streaming Trades",
    difficulty: "easy",
    topics: ["heap", "design", "finance"],
    problem:
      "Design a class that tracks the k-th largest PnL across all trades seen so far, updating in O(log k) per trade. This is used in a live trading dashboard: at any moment, display the k-th best trade result since the session began.",
    examples: [
      {
        input: "k=3, initial=[4,5,8,2]; then add 3, then 5, then 10, then 9, then 4",
        output: "4, 5, 5, 8, 8",
        explanation: "After each add, the 3rd largest of all PnLs seen so far.",
      },
    ],
    approach:
      "Maintain a min-heap of exactly k elements. The heap top is always the k-th largest. On add: push the new value; if heap size > k, pop the minimum. O(log k) per add, O(1) for kth_largest (just peek top).",
    code: `import heapq

class KthLargestPnL:
    """
    Min-heap of size k: heap[0] is always the k-th largest element seen.
    Adding a smaller element than the current k-th largest has no effect.
    """
    def __init__(self, k: int, initial_pnls: list[int]):
        self.k    = k
        self.heap = []
        for p in initial_pnls:
            self.add(p)

    def add(self, pnl: int) -> int:
        heapq.heappush(self.heap, pnl)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)   # remove smallest — not in top-k
        return self.heap[0]            # k-th largest

    def kth_largest(self) -> int:
        return self.heap[0] if len(self.heap) == self.k else None


# Test
tracker = KthLargestPnL(k=3, initial_pnls=[4, 5, 8, 2])
print(tracker.add(3))   # 4  (top-3: {4,5,8}, k-th=4)
print(tracker.add(5))   # 5  (top-3: {5,5,8}, k-th=5)
print(tracker.add(10))  # 5  (top-3: {5,8,10}, k-th=5)
print(tracker.add(9))   # 8  (top-3: {8,9,10}, k-th=8)
print(tracker.add(4))   # 8  (top-3: {8,9,10}, k-th=8 — 4 not in top-3)`,
    language: "python",
    complexity: { time: "O(n log k) total", space: "O(k)" },
  },
  {
    id: "fin-0524-b1-monotonic-next-greater-price",
    leetcodeNumber: 496,
    title: "Next Greater Price Level (Monotonic Stack)",
    difficulty: "medium",
    topics: ["monotonic-stack", "hash-map", "finance"],
    problem:
      "Given an array of price levels representing the order book (bid side), for each price level find the next higher price level to its right (the first ask price that beats it). Return -1 if none exists. This models finding the nearest resistance level above each support zone.",
    examples: [
      {
        input: "bid_levels = [100, 98, 101, 99, 103]",
        output: "[101, 99, 103, 103, -1]",
        explanation: "For 100: next greater is 101. For 98: next greater is 99. For 101: next greater is 103. For 99: next greater is 103. For 103: none.",
      },
      {
        input: "bid_levels = [5, 4, 3, 2, 1]",
        output: "[-1, -1, -1, -1, -1]",
        explanation: "Strictly decreasing — no element has a greater element to its right.",
      },
    ],
    approach:
      "Monotonic stack: maintain a stack of indices of elements for which we haven't found the next greater yet. For each new element, pop all stack entries smaller than it — the current element is their 'next greater'. Push current index. Elements remaining at the end get -1.",
    code: `def next_greater_price(levels: list[int]) -> list[int]:
    """
    Monotonic stack: stack holds indices of elements in decreasing order.
    When we see a larger element, it answers all pending stack entries.
    O(n) — each element pushed and popped at most once.
    """
    n      = len(levels)
    result = [-1] * n
    stack  = []   # indices with unanswered 'next greater' queries

    for i, price in enumerate(levels):
        # Answer all stack entries smaller than current price
        while stack and levels[stack[-1]] < price:
            idx = stack.pop()
            result[idx] = price   # current price is next greater for idx

        stack.append(i)
    # Remaining in stack: no next greater — result stays -1

    return result


# Circular variant: for index i in a circular array, scan up to 2n
def next_greater_circular(levels: list[int]) -> list[int]:
    n      = len(levels)
    result = [-1] * n
    stack  = []

    for i in range(2 * n):       # two passes simulates circular
        price = levels[i % n]
        while stack and levels[stack[-1]] < price:
            idx = stack.pop()
            result[idx] = price
        if i < n:
            stack.append(i)

    return result


print(next_greater_price([100, 98, 101, 99, 103]))   # [101, 99, 103, 103, -1]
print(next_greater_price([5, 4, 3, 2, 1]))            # [-1, -1, -1, -1, -1]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-0524-b1-weighted-job-sched",
    leetcodeNumber: 1235,
    title: "Weighted Job Scheduling — Maximum Profit Trade Schedule",
    difficulty: "hard",
    topics: ["dynamic-programming", "binary-search", "finance"],
    problem:
      "You have N trading windows, each defined by (start_time, end_time, profit). No two overlapping windows can be active simultaneously (capital is fully deployed in one trade at a time). Find the schedule maximising total profit. This is the weighted interval scheduling problem — the foundation of algorithmic trade scheduling.",
    examples: [
      {
        input: "jobs = [(1,3,50), (2,5,20), (4,6,100), (6,9,200)]",
        output: "350",
        explanation: "Take jobs (1,3,50) and (4,6,100) and (6,9,200) = 350. Cannot take (2,5) with (4,6).",
      },
      {
        input: "jobs = [(1,4,3), (2,3,1), (3,6,2)]",
        output: "5",
        explanation: "(1,4,3) and (3,6,2) overlap; (2,3,1) and (3,6,2) don't. Best: (1,4,3) + nothing after = 3? Or (2,3,1)+(3,6,2)=3. Max=3.",
      },
    ],
    approach:
      "Sort jobs by end time. dp[i] = max profit using first i jobs. For each job i, binary search for the latest job j that ends <= start[i]. dp[i] = max(dp[i-1], dp[j] + profit[i]). O(n log n).",
    code: `import bisect

def max_profit_schedule(jobs: list[tuple[int, int, int]]) -> int:
    """
    Weighted job scheduling via DP + binary search.
    Sort by end time; dp[i] = best profit from first i jobs (0-indexed + offset).
    For each job, either skip it or take it (adding best compatible prefix).
    """
    jobs.sort(key=lambda x: x[1])   # sort by end time
    n    = len(jobs)
    ends = [j[1] for j in jobs]

    # dp[i] = max profit using a subset of jobs[0..i-1]
    dp = [0] * (n + 1)

    for i in range(1, n + 1):
        start, end, profit = jobs[i - 1]

        # Binary search: latest job j that ends <= start of job i
        # bisect_right on ends[0..i-2] gives insertion point
        j = bisect.bisect_right(ends, start, 0, i - 1)
        # j is the number of jobs with end <= start (0-indexed into dp)

        # Option 1: skip job i
        # Option 2: take job i (add to best profit from compatible jobs)
        dp[i] = max(dp[i - 1], dp[j] + profit)

    return dp[n]


print(max_profit_schedule([(1,3,50),(2,5,20),(4,6,100),(6,9,200)]))  # 350
print(max_profit_schedule([(1,4,3),(2,3,1),(3,6,2)]))                 # 5
print(max_profit_schedule([(1,2,5),(2,3,6),(1,3,9)]))                 # 11`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-0524-b1-random-walk-probability",
    leetcodeNumber: 0,
    title: "Expected Steps to Ruin in a Biased Random Walk",
    difficulty: "hard",
    topics: ["math", "probability", "dynamic-programming", "finance"],
    problem:
      "A trader starts with W dollars. Each step, they win $1 with probability p or lose $1 with probability q = 1-p. They stop when they reach 0 (ruin) or N dollars (goal). Find: (1) probability of ruin starting from W, (2) expected number of steps to stop. This is the Gambler's Ruin problem — foundational for sizing positions against a risk-of-ruin constraint.",
    examples: [
      {
        input: "W=10, N=20, p=0.55",
        output: "Ruin prob ≈ 0.134, Expected steps ≈ 150",
        explanation: "With edge p=0.55 > 0.5, ruin probability is low but non-zero. Analytic formulas exist.",
      },
      {
        input: "W=10, N=20, p=0.5",
        output: "Ruin prob = 0.5, Expected steps = W*(N-W) = 100",
        explanation: "Fair coin: ruin prob = W/N. Expected steps = W*(N-W) — exact analytic result.",
      },
    ],
    approach:
      "Closed-form solutions exist. Let r = q/p. Ruin prob P(ruin | W) = (r^W - r^N) / (1 - r^N) for p ≠ 0.5, else W/N-1 wait wait: P(ruin) = (r^W - r^N)/(1 - r^N). Expected steps = W(N-W)/|2p-1| for biased walk. Also verify with DP: fill an array E[i] for i in 0..N.",
    code: `def gamblers_ruin(W: int, N: int, p: float) -> dict:
    """
    Gambler's Ruin: start at W, absorbing barriers at 0 (ruin) and N (goal).
    Analytic formulas + DP verification.
    """
    q = 1.0 - p

    # Analytic ruin probability
    if abs(p - 0.5) < 1e-9:
        ruin_prob = 1.0 - W / N       # fair game: P(ruin) = 1 - W/N
        exp_steps = float(W * (N - W))
    else:
        r = q / p
        rN = r ** N
        rW = r ** W
        ruin_prob = (rW - rN) / (1.0 - rN)   # P(reach 0 before N)
        # Expected duration formula (Feller):
        C1 = W / (q - p) - N / (q - p) * (1.0 - rW) / (1.0 - rN)
        exp_steps = C1 if p != q else float(W * (N - W))

    # DP verification of ruin probability
    P = [0.0] * (N + 1)
    P[0] = 1.0   # absorbing: already ruined
    P[N] = 0.0   # absorbing: reached goal
    for _ in range(5000):   # iterate to convergence
        P_new = P[:]
        for i in range(1, N):
            P_new[i] = p * P[i + 1] + q * P[i - 1]
        if max(abs(P_new[i] - P[i]) for i in range(1, N)) < 1e-10:
            break
        P = P_new

    print(f"Analytic: P(ruin|W={W}) = {ruin_prob:.4f}  E[steps] = {exp_steps:.1f}")
    print(f"DP check: P(ruin|W={W}) = {P[W]:.4f}")
    return {"ruin_prob": ruin_prob, "exp_steps": exp_steps, "dp_ruin": P[W]}

gamblers_ruin(10, 20, 0.55)
gamblers_ruin(10, 20, 0.50)`,
    language: "python",
    complexity: { time: "O(N) analytic, O(N * iters) DP", space: "O(N)" },
  },
  {
    id: "fin-0524-b1-bitmask-portfolio-state",
    leetcodeNumber: 0,
    title: "Bitmask DP — Portfolio State across Binary Positions",
    difficulty: "hard",
    topics: ["bit-manipulation", "dynamic-programming", "finance"],
    problem:
      "You have N assets (N ≤ 20), each of which you can hold (+1) or not hold (0). For each subset of assets, you know the expected return[mask] and risk[mask]. Find the subset that maximises return - lambda * risk (where lambda is the risk-aversion parameter), subject to at most K assets held. This models small-N brute-force portfolio optimisation.",
    examples: [
      {
        input: "N=3, K=2, lambda=1.0, returns=[0.1, 0.15, 0.08], risks=[0.02, 0.04, 0.015]",
        output: "Best mask=0b011 (assets 0,1): return=0.25, risk=0.06, utility=0.19",
        explanation: "Try all 2^3=8 subsets with popcount≤2; pick max(return - 1.0*risk).",
      },
    ],
    approach:
      "Iterate all 2^N bitmasks. For each mask, check popcount(mask) <= K. Compute return and risk by summing individual contributions (simple diagonal covariance approximation here). Track maximum utility. O(N * 2^N) time.",
    code: `def bitmask_portfolio(returns: list[float], risks: list[float],
                         lam: float = 1.0, K: int = None) -> dict:
    """
    Enumerate all 2^N subsets; maximise return - lam * risk.
    Simple additive approximation (diagonal covariance); use correlation
    matrix for full Markowitz in the brute-force setting.
    N must be small (<=20 practical, <=25 with pruning).
    """
    N     = len(returns)
    K     = K or N        # default: any number of assets allowed
    best  = float('-inf')
    best_mask = 0

    for mask in range(1, 1 << N):
        if bin(mask).count('1') > K:
            continue
        r = sum(returns[i] for i in range(N) if mask & (1 << i))
        s = sum(risks[i]   for i in range(N) if mask & (1 << i))
        utility = r - lam * s
        if utility > best:
            best      = utility
            best_mask = mask

    assets = [i for i in range(N) if best_mask & (1 << i)]
    total_r = sum(returns[i] for i in assets)
    total_s = sum(risks[i]   for i in assets)

    print(f"Best mask: {bin(best_mask)}  Assets: {assets}")
    print(f"  Return={total_r:.4f}  Risk={total_s:.4f}  Utility={best:.4f}")
    return {"mask": best_mask, "assets": assets, "utility": best}


bitmask_portfolio([0.1, 0.15, 0.08], [0.02, 0.04, 0.015], lam=1.0, K=2)`,
    language: "python",
    complexity: { time: "O(N * 2^N)", space: "O(1)" },
  },
  {
    id: "fin-0524-b1-network-flow-allocation",
    leetcodeNumber: 0,
    title: "Max-Flow Capital Allocation across Venues (Ford-Fulkerson)",
    difficulty: "hard",
    topics: ["graph", "max-flow", "finance"],
    problem:
      "A broker network has a source (capital pool), N intermediate routing nodes (venues), and a sink (execution). Each edge has a capacity (max capital that can be routed per day). Find the maximum amount of capital that can be deployed from source to execution. This models the max-flow / min-cut structure of a multi-venue execution network.",
    examples: [
      {
        input: `N=4 nodes (0=source, 3=sink)
edges: (0,1,10), (0,2,10), (1,3,10), (2,3,10), (1,2,2)`,
        output: "20",
        explanation: "10 units via 0→1→3 and 10 units via 0→2→3. The cross-link (1,2,2) is not needed. Max-flow = min-cut = 20.",
      },
    ],
    approach:
      "Edmonds-Karp (BFS-based Ford-Fulkerson): repeatedly find augmenting paths from source to sink using BFS. Augment by the bottleneck capacity. Update residual graph (subtract forward, add backward). Terminate when no augmenting path exists. O(V * E²).",
    code: `from collections import deque, defaultdict

def max_flow(n: int, edges: list[tuple[int,int,int]],
             source: int, sink: int) -> int:
    """
    Edmonds-Karp max-flow on a capacity graph.
    edges: (u, v, capacity) — directed.
    Returns maximum flow from source to sink.
    """
    # Residual capacity graph: cap[u][v] = remaining capacity on edge u->v
    cap: dict[int, dict[int, int]] = defaultdict(lambda: defaultdict(int))
    graph: dict[int, list[int]]    = defaultdict(list)

    for u, v, c in edges:
        cap[u][v] += c
        graph[u].append(v)
        graph[v].append(u)   # reverse edges (for residual)

    def bfs_path() -> list[int] | None:
        """BFS to find augmenting path; returns parent array or None."""
        parent = [-1] * n
        parent[source] = source
        queue = deque([source])
        while queue:
            u = queue.popleft()
            for v in graph[u]:
                if parent[v] == -1 and cap[u][v] > 0:
                    parent[v] = u
                    if v == sink:
                        return parent
                    queue.append(v)
        return None

    total_flow = 0
    while (parent := bfs_path()) is not None:
        # Trace back the path and find bottleneck capacity
        path_flow = float('inf')
        v = sink
        while v != source:
            u = parent[v]
            path_flow = min(path_flow, cap[u][v])
            v = u

        # Augment along the path
        v = sink
        while v != source:
            u = parent[v]
            cap[u][v] -= path_flow
            cap[v][u] += path_flow
            v = u

        total_flow += path_flow

    return total_flow


print(max_flow(4, [(0,1,10),(0,2,10),(1,3,10),(2,3,10),(1,2,2)], 0, 3))  # 20
print(max_flow(4, [(0,1,3),(0,2,5),(1,3,4),(2,3,3)], 0, 3))              # 6`,
    language: "python",
    complexity: { time: "O(V * E^2)", space: "O(V + E)" },
  },
  {
    id: "fin-0524-b1-sliding-sharpe",
    leetcodeNumber: 0,
    title: "Sliding Window Maximum Sharpe Ratio",
    difficulty: "medium",
    topics: ["sliding-window", "math", "finance"],
    problem:
      "Given an array of daily returns and a window size k, compute the annualised Sharpe ratio for each consecutive window of k days. Return the index of the window with the maximum Sharpe ratio. This is used to identify the best historical performance period for a strategy.",
    examples: [
      {
        input: "returns = [0.01, 0.02, -0.01, 0.03, -0.005, 0.015, 0.02], k=4",
        output: "Window starting at index 3 has highest Sharpe",
        explanation: "Compute mean/std for each window of 4 days; annualise by sqrt(252); return argmax.",
      },
    ],
    approach:
      "Sliding window with Welford's online variance update or a simple approach: maintain a deque of last k returns and recompute mean/std. For O(n) time, use a running sum and sum of squares: mean = sum/k, var = (sum_sq - sum^2/k) / (k-1). Compute Sharpe = sqrt(252) * mean / std for each window.",
    code: `import numpy as np
from collections import deque

def sliding_sharpe(returns: list[float], k: int,
                    rf_daily: float = 0.0) -> dict:
    """
    O(n) rolling Sharpe via running sum and sum-of-squares.
    var = (sum_sq/k - mean^2) * k/(k-1)  (sample variance Bessel correction).
    Returns list of Sharpe ratios and index of best window.
    """
    n       = len(returns)
    sharpes = []
    window  = deque()   # last k returns
    s1 = s2 = 0.0       # sum and sum-of-squares

    for i, r in enumerate(returns):
        window.append(r)
        s1 += r
        s2 += r * r

        if len(window) > k:
            old = window.popleft()
            s1 -= old
            s2 -= old * old

        if len(window) == k:
            mean = (s1 - rf_daily * k) / k     # excess return mean
            # Sample variance: E[X^2] - (E[X])^2, corrected
            var  = max(0.0, (s2 - s1**2 / k) / (k - 1))
            std  = var ** 0.5
            sh   = (np.sqrt(252) * (s1/k - rf_daily) / std
                    if std > 1e-10 else 0.0)
            sharpes.append((i - k + 1, sh))   # (start_index, sharpe)

    if not sharpes:
        return {}

    best_start, best_sh = max(sharpes, key=lambda x: x[1])
    print(f"Best window starts at index {best_start}: Sharpe={best_sh:.2f}")
    return {"best_start": best_start, "best_sharpe": best_sh, "all": sharpes}


r = [0.01, 0.02, -0.01, 0.03, -0.005, 0.015, 0.02]
sliding_sharpe(r, k=4)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
  },
  {
    id: "fin-0524-b1-min-heap-median",
    leetcodeNumber: 295,
    title: "Find Median from Live Tick Stream (Two Heaps)",
    difficulty: "hard",
    topics: ["heap", "design", "finance"],
    problem:
      "Design a MedianStream class that supports: add_price(price) — adds a new trade price to the stream, and get_median() — returns the median price of all prices seen so far. This powers a live median-price display for VWAP deviation analysis. Both operations should run in O(log n) time.",
    examples: [
      {
        input: "add 1, 2, 3; get_median() → 2.0. Add 4; get_median() → 2.5.",
        output: "2.0, 2.5",
        explanation: "Odd count: middle element. Even count: average of two middle elements.",
      },
    ],
    approach:
      "Maintain two heaps: a max-heap for the lower half and a min-heap for the upper half. Always keep them balanced (differ by at most 1). Median = top of the larger heap (odd count) or average of both tops (even count). Each add: push to max-heap (lower), rebalance by pushing max-heap top to min-heap if cross-over.",
    code: `import heapq

class MedianStream:
    """
    Two-heap median tracker:
    - lo: max-heap of lower half (negate for Python's min-heap)
    - hi: min-heap of upper half
    Invariant: len(lo) == len(hi) or len(lo) == len(hi) + 1
    """
    def __init__(self):
        self.lo: list[float] = []   # max-heap (negated)
        self.hi: list[float] = []   # min-heap

    def add_price(self, price: float) -> None:
        # Push to lower half (max-heap)
        heapq.heappush(self.lo, -price)

        # Ensure lo's max <= hi's min (maintain heap property)
        if self.hi and -self.lo[0] > self.hi[0]:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))

        # Balance sizes: lo can have at most 1 more element than hi
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def get_median(self) -> float:
        if not self.lo:
            raise ValueError("No prices added yet")
        if len(self.lo) > len(self.hi):
            return float(-self.lo[0])               # odd total: lower half top
        return (-self.lo[0] + self.hi[0]) / 2.0    # even total: average of midpoints


ms = MedianStream()
for p in [1.0, 2.0, 3.0]:
    ms.add_price(p)
print(ms.get_median())   # 2.0

ms.add_price(4.0)
print(ms.get_median())   # 2.5

ms.add_price(100.0)
print(ms.get_median())   # 3.0  (outlier doesn't break median)`,
    language: "python",
    complexity: { time: "O(log n) per add, O(1) per query", space: "O(n)" },
  },
  {
    id: "fin-0524-b1-burst-balloons-capital",
    leetcodeNumber: 312,
    title: "Burst Balloons — Optimal Capital Release Order",
    difficulty: "hard",
    topics: ["dynamic-programming", "interval-dp", "finance"],
    problem:
      "You have N capital positions with sizes coins[i]. When you liquidate position i, you gain coins[i-1] * coins[i] * coins[i+1] (product of adjacent remaining positions). Liquidate all positions to maximise total proceeds. Add virtual positions of value 1 at both ends. This is the interval DP 'burst balloons' problem — models optimal order of trade unwinding.",
    examples: [
      {
        input: "coins = [3, 1, 5, 8]",
        output: "167",
        explanation: "Liquidate 1: 3*1*5=15. Liquidate 5: 3*5*8=120. Liquidate 3: 1*3*8=24. Liquidate 8: 1*8*1=8. Total=167.",
      },
      {
        input: "coins = [1, 5]",
        output: "10",
        explanation: "Liquidate 5: 1*5*1=5. Liquidate 1: 1*1*1=1? No: liquidate 1 first: 1*1*5=5, then 1*5*1=5. Total=10.",
      },
    ],
    approach:
      "Interval DP: think in reverse — for each interval [l, r], choose k as the LAST balloon to burst (not first). dp[l][r] = max over k in (l,r) of coins[l]*coins[k]*coins[r] + dp[l][k] + dp[k][r]. Base case: adjacent l,r have no balloons to burst. Fill by increasing interval length.",
    code: `def max_coins(coins: list[int]) -> int:
    """
    Interval DP — 'last to burst' formulation avoids the dependency on
    which neighbours are still alive when k is burst.
    Pad with virtual 1s at both ends.
    """
    nums = [1] + coins + [1]
    n    = len(nums)

    # dp[i][j] = max coins from bursting all balloons strictly between i and j
    dp = [[0] * n for _ in range(n)]

    # Fill by increasing length of interval
    for length in range(2, n):        # minimum gap = 2 (one balloon in between)
        for left in range(0, n - length):
            right = left + length

            for k in range(left + 1, right):   # k is last balloon to burst in (left, right)
                gain      = nums[left] * nums[k] * nums[right]
                dp[left][right] = max(dp[left][right],
                                      gain + dp[left][k] + dp[k][right])

    return dp[0][n - 1]   # all balloons between virtual 1s


print(max_coins([3, 1, 5, 8]))   # 167
print(max_coins([1, 5]))          # 10
print(max_coins([1, 2, 3, 4]))    # 20`,
    language: "python",
    complexity: { time: "O(n^3)", space: "O(n^2)" },
  },
];
