import type { LeetCodeProblem } from "./index";

export const financeProblems20260526B1: LeetCodeProblem[] = [
  {
    id: "fin-0526-b1-median-stream",
    leetcodeNumber: 295,
    title: "Find Median from Data Stream — Rolling P&L Median Tracker",
    difficulty: "hard",
    topics: ["heap", "design", "finance"],
    problem:
      "Design a data structure that supports: addNum(num) — adds a daily P&L value to the stream; findMedian() — returns the current median of all values seen so far. This powers a rolling median risk monitor: unlike the mean, the median is robust to outlier days (flash crashes, data errors) and is used in robust VaR and performance attribution. Both operations must run in O(log n) time.",
    examples: [
      {
        input: "addNum(1); addNum(2); findMedian() → 1.5; addNum(3); findMedian() → 2",
        output: "1.5, 2",
        explanation: "After [1,2]: median = (1+2)/2 = 1.5. After [1,2,3]: median = 2.",
      },
      {
        input: "addNum(-5); addNum(3); addNum(7); findMedian() → 3",
        output: "3",
        explanation: "Sorted: [-5, 3, 7]. Middle element = 3.",
      },
    ],
    approach:
      "Two heaps: a max-heap (lo) for the lower half and a min-heap (hi) for the upper half. Invariant: len(lo) == len(hi) or len(lo) == len(hi) + 1. addNum: push to lo, then rebalance by moving the max of lo to hi; if len(hi) > len(lo), move min of hi back to lo. findMedian: if sizes equal → average of both tops; else → top of lo.",
    code: `import heapq

class MedianFinder:
    """
    Two-heap approach: O(log n) add, O(1) findMedian.
    lo: max-heap (invert signs) for lower half.
    hi: min-heap for upper half.
    Invariant: len(lo) >= len(hi), diff <= 1.
    """
    def __init__(self):
        self.lo = []    # max-heap (negated)
        self.hi = []    # min-heap

    def addNum(self, num: float) -> None:
        # Step 1: push to lo (max-heap via negation)
        heapq.heappush(self.lo, -num)
        # Step 2: balance — lo's max must be <= hi's min
        if self.hi and -self.lo[0] > self.hi[0]:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        # Step 3: size balance — lo has at most 1 more than hi
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def findMedian(self) -> float:
        if len(self.lo) == len(self.hi):
            return (-self.lo[0] + self.hi[0]) / 2.0
        return float(-self.lo[0])   # lo has one extra element


class RollingMedianMonitor:
    """
    Extension: sliding-window median for past W days.
    Uses two heaps + a rebalancing queue to remove expired elements.
    Removal from heap: lazy deletion (mark expired elements; skip on pop).
    O(log n) per operation.
    """
    def __init__(self, window: int):
        self.w     = window
        self.buf   = []          # circular buffer of (value, timestep)
        self.lo    = []          # max-heap (negated)
        self.hi    = []          # min-heap
        self.lo_sz = 0
        self.hi_sz = 0
        self.step  = 0
        self.to_remove = {}      # {value: count} for lazy deletion

    def _lazy_pop_lo(self):
        while self.lo and self.to_remove.get(-self.lo[0], 0) > 0:
            self.to_remove[-self.lo[0]] -= 1
            heapq.heappop(self.lo)

    def _lazy_pop_hi(self):
        while self.hi and self.to_remove.get(self.hi[0], 0) > 0:
            self.to_remove[self.hi[0]] -= 1
            heapq.heappop(self.hi)

    def add(self, num: float) -> float:
        if len(self.buf) == self.w:
            old_val, _ = self.buf.pop(0)
            self.to_remove[old_val] = self.to_remove.get(old_val, 0) + 1
            self._lazy_pop_lo(); self._lazy_pop_hi()
            if old_val <= -self.lo[0] if self.lo else True:
                self.lo_sz -= 1
            else:
                self.hi_sz -= 1

        self.buf.append((num, self.step))
        self.step += 1
        heapq.heappush(self.lo, -num); self.lo_sz += 1
        if self.hi and -self.lo[0] > self.hi[0]:
            self._lazy_pop_lo(); self._lazy_pop_hi()
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
            self.lo_sz -= 1; self.hi_sz += 1
        while self.lo_sz > self.hi_sz + 1:
            self._lazy_pop_lo()
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
            self.lo_sz -= 1; self.hi_sz += 1
        while self.hi_sz > self.lo_sz:
            self._lazy_pop_hi()
            heapq.heappush(self.lo, -heapq.heappop(self.hi))
            self.lo_sz += 1; self.hi_sz -= 1
        self._lazy_pop_lo(); self._lazy_pop_hi()
        return self.findMedian()

    def findMedian(self) -> float:
        self._lazy_pop_lo(); self._lazy_pop_hi()
        if self.lo_sz == self.hi_sz:
            return (-self.lo[0] + self.hi[0]) / 2.0 if self.lo and self.hi else 0.0
        return float(-self.lo[0])


# Tests
mf = MedianFinder()
mf.addNum(1); mf.addNum(2)
print(mf.findMedian())   # 1.5
mf.addNum(3)
print(mf.findMedian())   # 2.0

# P&L stream
pnls = [100, -50, 200, -80, 150, 300, -200]
mf2  = MedianFinder()
for p in pnls:
    mf2.addNum(p)
print(f"Median P&L: {mf2.findMedian()}")   # 100`,
    language: "python",
    complexity: { time: "O(log n) add, O(1) findMedian", space: "O(n)" },
  },
  {
    id: "fin-0526-b1-jump-game-ii",
    leetcodeNumber: 45,
    title: "Jump Game II — Minimum Rebalancing Trades",
    difficulty: "medium",
    topics: ["greedy", "dynamic-programming", "finance"],
    problem:
      "A portfolio must move from position 0 to position n-1 through a series of market states. At each state i, you can advance by 1 to moves[i] positions in a single rebalancing trade (one transaction). Find the minimum number of rebalancing trades (jumps) needed to reach the final state. This models optimal infrequent rebalancing: choose momentum windows such that each window jump maximises future reach, minimising transaction costs.",
    examples: [
      {
        input: "moves = [2, 3, 1, 1, 4]",
        output: "2",
        explanation: "Jump to index 1 (reach 3), then jump to index 4. 2 trades total.",
      },
      {
        input: "moves = [2, 3, 0, 1, 4]",
        output: "2",
        explanation: "Jump to index 1, then index 4. The 0 at index 2 can be bypassed.",
      },
    ],
    approach:
      "Greedy: at each step, track the farthest reachable index in the current 'window'. When the pointer reaches the end of the current window, commit a jump (increment count) and extend the window to the farthest reachable. This is always optimal because delaying the jump never extends the reach further. O(n) time, O(1) space.",
    code: `def min_rebalances(moves: list[int]) -> int:
    """
    Greedy BFS layer expansion:
    cur_end   = last index reachable in exactly 'jumps' trades
    farthest  = farthest index reachable in 'jumps + 1' trades
    When i reaches cur_end: commit the trade, extend window.
    """
    n        = len(moves)
    jumps    = 0
    cur_end  = 0      # end of current "free" window
    farthest = 0      # best reach in the next window

    for i in range(n - 1):     # we never need to jump FROM the last position
        farthest = max(farthest, i + moves[i])
        if i == cur_end:       # must commit a trade to advance past cur_end
            jumps   += 1
            cur_end  = farthest
            if cur_end >= n - 1:
                break

    return jumps


def min_rebalances_with_path(moves: list[int]) -> tuple[int, list[int]]:
    """
    Also reconstruct which positions were chosen for each jump.
    Used to identify the specific rebalancing dates in a momentum strategy.
    """
    n       = len(moves)
    jumps   = 0
    cur_end = 0
    farthest = 0
    path    = [0]

    for i in range(n - 1):
        if i + moves[i] > farthest:
            farthest = i + moves[i]
            next_pos = i          # track which position achieves the farthest reach
        if i == cur_end:
            jumps   += 1
            cur_end  = farthest
            path.append(next_pos + 1)   # approximate: next position after best jump
            if cur_end >= n - 1:
                path.append(n - 1)
                break

    return jumps, path


# Tests
print(min_rebalances([2, 3, 1, 1, 4]))   # 2
print(min_rebalances([2, 3, 0, 1, 4]))   # 2
print(min_rebalances([1, 1, 1, 1]))       # 3

n, path = min_rebalances_with_path([2, 3, 1, 1, 4])
print(f"Minimum trades: {n}, rebalancing at positions: {path}")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-0526-b1-burst-balloons",
    leetcodeNumber: 312,
    title: "Burst Balloons — Maximum Portfolio Liquidation Value",
    difficulty: "hard",
    topics: ["dynamic-programming", "divide-and-conquer", "finance"],
    problem:
      "You have N positions with values given in array positions[]. When you liquidate position i, you receive positions[i-1] * positions[i] * positions[i+1] in P&L (market impact is proportional to the product of neighbouring sizes). After liquidating position i, positions i-1 and i+1 become adjacent. Liquidate all positions to maximise total P&L. Boundary positions are padded with 1. This models optimal order-of-execution to minimise market impact in a correlated book.",
    examples: [
      {
        input: "positions = [3, 1, 5, 8]",
        output: "167",
        explanation: "Liquidate 1: 3*1*5=15, then 5: 3*5*8=120, then 3: 1*3*8=24, then 8: 1*8*1=8. Total=167.",
      },
      {
        input: "positions = [1, 5]",
        output: "10",
        explanation: "Liquidate 1: 1*1*5=5, then 5: 1*5*1=5. Or liquidate 5 first: 1*5*1=5, then 1: 1*1*1=1. Best is 5+5=10.",
      },
    ],
    approach:
      "Interval DP: dp[i][j] = maximum P&L from liquidating all positions strictly inside [i, j] (1-indexed with padding). Key insight: instead of thinking about which position to burst first, think about which position k is burst LAST in subarray [i,j]. When k is burst last, its neighbours are exactly i and j. dp[i][j] = max over k of: dp[i][k] + positions[i]*positions[k]*positions[j] + dp[k][j]. O(n^3) time.",
    code: `def max_liquidation_value(positions: list[int]) -> int:
    """
    Interval DP on 'which position is liquidated last in each sub-interval'.
    Pad positions with 1s on both ends: arr = [1] + positions + [1].
    dp[i][j] = max P&L from liquidating all positions between i and j (exclusive).
    Transition: for each k in (i, j):
        dp[i][j] = max(dp[i][k] + arr[i]*arr[k]*arr[j] + dp[k][j])
    (k is the last position liquidated in [i,j]; its remaining neighbors are i and j)
    Base: dp[i][i+1] = 0 (no positions between adjacent indices).
    Fill bottom-up by increasing interval length.
    """
    arr = [1] + positions + [1]
    n   = len(arr)
    dp  = [[0] * n for _ in range(n)]

    for length in range(2, n):          # interval length (at least 2 for any content)
        for left in range(n - length):
            right = left + length
            for k in range(left + 1, right):
                val = (arr[left] * arr[k] * arr[right]
                       + dp[left][k] + dp[k][right])
                dp[left][right] = max(dp[left][right], val)

    return dp[0][n - 1]


def max_liquidation_memoised(positions: list[int]) -> int:
    """
    Top-down memoised version — same logic, easier to trace for debugging.
    """
    arr = [1] + positions + [1]
    n   = len(arr)
    memo = {}

    def dp(left: int, right: int) -> int:
        if right - left < 2:
            return 0
        if (left, right) in memo:
            return memo[(left, right)]
        best = 0
        for k in range(left + 1, right):
            val = arr[left] * arr[k] * arr[right] + dp(left, k) + dp(k, right)
            best = max(best, val)
        memo[(left, right)] = best
        return best

    return dp(0, n - 1)


# Tests
print(max_liquidation_value([3, 1, 5, 8]))    # 167
print(max_liquidation_value([1, 5]))           # 10
print(max_liquidation_value([1]))              # 1

print(max_liquidation_memoised([3, 1, 5, 8])) # 167 (same result)`,
    language: "python",
    complexity: { time: "O(n^3)", space: "O(n^2)" },
  },
  {
    id: "fin-0526-b1-wiggle-subsequence",
    leetcodeNumber: 376,
    title: "Wiggle Subsequence — Longest Oscillating Market Signal",
    difficulty: "medium",
    topics: ["greedy", "dynamic-programming", "finance"],
    problem:
      "A wiggle subsequence is one where successive differences alternate between positive and negative (up-down-up or down-up-down). Given an array of daily returns or signal values, find the length of the longest wiggle subsequence. This identifies how many genuine momentum reversals a signal captures — a 'wiggly' signal oscillates cleanly and generates more trading opportunities for a mean-reversion strategy.",
    examples: [
      {
        input: "returns = [1, 7, 4, 9, 2, 5]",
        output: "6",
        explanation: "All 6 elements form a wiggle: +6, -3, +5, -7, +3 (up-down-up-down-up).",
      },
      {
        input: "returns = [1, 17, 5, 10, 13, 15, 10, 5, 16, 8]",
        output: "7",
        explanation: "Subsequence: [1, 17, 5, 15, 5, 16, 8], length 7.",
      },
    ],
    approach:
      "Greedy: maintain 'up' = longest wiggle ending with an up-move, 'down' = longest ending with a down-move. For each new value: if returns[i] > returns[i-1] → up = down + 1 (the down sequence can extend up). If returns[i] < returns[i-1] → down = up + 1. Equal values don't change anything. O(n) time, O(1) space.",
    code: `def wiggle_length(values: list[float]) -> int:
    """
    Greedy: track longest wiggle ending up (up) and ending down (down).
    Transition:
      up tick  (v[i] > v[i-1]): up  = down + 1
      down tick (v[i] < v[i-1]): down = up  + 1
    Answer: max(up, down).
    Observation: consecutive runs in one direction are effectively collapsed.
    """
    if len(values) < 2:
        return len(values)
    up   = 1   # longest wiggle ending with an upward move
    down = 1   # longest wiggle ending with a downward move

    for i in range(1, len(values)):
        if values[i] > values[i-1]:
            up = down + 1
        elif values[i] < values[i-1]:
            down = up + 1
        # equal: neither counter changes

    return max(up, down)


def wiggle_dp(values: list[float]) -> int:
    """
    DP version for clarity: up[i] = longest wiggle ending at i with up move.
    O(n^2) but illustrates the recurrence more explicitly.
    """
    n    = len(values)
    if n == 0:
        return 0
    up   = [1] * n
    down = [1] * n
    for i in range(1, n):
        for j in range(i):
            if values[i] > values[j]:
                up[i]   = max(up[i],   down[j] + 1)
            elif values[i] < values[j]:
                down[i] = max(down[i], up[j]   + 1)
    return max(max(up), max(down))


def oscillation_score(signal: list[float]) -> dict:
    """
    Finance context: score a trading signal by its wiggle fraction.
    wiggle_fraction = wiggle_length / len(signal).
    Near 1.0: signal alternates on every bar (very mean-reverting).
    Near 0.5: signal shows half as many reversals (trending).
    """
    length = len(signal)
    wl     = wiggle_length(signal)
    return {
        "wiggle_length":   wl,
        "total_length":    length,
        "wiggle_fraction": wl / length if length > 0 else 0.0,
    }


# Tests
print(wiggle_length([1, 7, 4, 9, 2, 5]))                  # 6
print(wiggle_length([1, 17, 5, 10, 13, 15, 10, 5, 16, 8]))# 7
print(wiggle_length([1, 2, 3, 4, 5]))                      # 2 (monotone trend)
print(wiggle_length([1, 1, 1]))                             # 1 (flat signal)

import random
random.seed(42)
signal = [random.gauss(0, 1) for _ in range(100)]
print(oscillation_score(signal))`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-0526-b1-num-islands",
    leetcodeNumber: 200,
    title: "Number of Islands — Correlated Asset Cluster Count",
    difficulty: "medium",
    topics: ["graph", "BFS", "DFS", "union-find", "finance"],
    problem:
      "Given a binary correlation matrix where grid[i][j] = '1' if asset i is significantly correlated with asset j (and '0' otherwise), count the number of distinct correlated clusters (connected components). Each cluster represents a group of assets that move together and should be treated as a single risk factor for diversification analysis. Connected means horizontally or vertically adjacent.",
    examples: [
      {
        input: `grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]`,
        output: "3",
        explanation: "Three correlation clusters: top-left (AAPL/MSFT group), center (standalone), bottom-right (GS/JPM group).",
      },
      {
        input: `grid = [["1","1","1"],["0","1","0"],["1","1","1"]]`,
        output: "1",
        explanation: "All connected through the center — one big correlated cluster.",
      },
    ],
    approach:
      "DFS / BFS flood fill: scan the grid for '1'. When found, BFS/DFS to mark all connected '1's as visited (set to '0'). Increment island count. Repeat until no '1' remains. Union-Find alternative: initialise each '1' as its own component; iterate and union adjacent '1's; count distinct roots. Both are O(m*n) time and space.",
    code: `from collections import deque

def count_clusters(grid: list[list[str]]) -> int:
    """
    BFS flood-fill: each BFS invocation marks one full cluster as visited.
    In-place modification: mark visited cells as '0' (or use a separate seen set).
    """
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    clusters   = 0

    def bfs(r: int, c: int) -> None:
        queue = deque([(r, c)])
        grid[r][c] = "0"        # mark visited in-place
        while queue:
            row, col = queue.popleft()
            for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
                nr, nc = row + dr, col + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
                    grid[nr][nc] = "0"
                    queue.append((nr, nc))

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                clusters += 1
                bfs(r, c)

    return clusters


class UnionFind:
    """Union-Find for cluster counting — supports count() in O(1)."""
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank   = [0] * n
        self.count  = 0           # number of distinct components

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path compression
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return
        if self.rank[ra] < self.rank[rb]: ra, rb = rb, ra
        self.parent[rb] = ra
        if self.rank[ra] == self.rank[rb]: self.rank[ra] += 1
        self.count -= 1


def count_clusters_uf(grid: list[list[str]]) -> int:
    """Union-Find version: add each '1' as a component, then union neighbours."""
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    uf         = UnionFind(rows * cols)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                uf.count += 1
                idx = r * cols + c
                for dr, dc in [(0,1),(1,0)]:    # only right and down to avoid duplicates
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
                        uf.union(idx, nr * cols + nc)

    return uf.count


# Tests
grid1 = [["1","1","0","0"],["1","1","0","0"],["0","0","1","0"],["0","0","0","1"]]
print(count_clusters([row[:] for row in grid1]))    # 3
print(count_clusters_uf(grid1))                      # 3

grid2 = [["1","1","1"],["0","1","0"],["1","1","1"]]
print(count_clusters([row[:] for row in grid2]))    # 1`,
    language: "python",
    complexity: { time: "O(m*n)", space: "O(min(m,n)) BFS queue" },
  },
  {
    id: "fin-0526-b1-task-scheduler",
    leetcodeNumber: 621,
    title: "Task Scheduler — Order Batch Scheduling with Cooldown",
    difficulty: "medium",
    topics: ["heap", "greedy", "finance"],
    problem:
      "Given a list of order types (each type represented by a letter), and a cooldown period n (you must wait n time units between processing the same order type to avoid adverse selection), find the minimum number of time units to process all orders. CPU 'idle' time represents the exchange's cooling window between same-symbol orders. This models how to schedule a mix of order types across multiple symbols with regulatory or risk-management cooldown constraints.",
    examples: [
      {
        input: "tasks = ['A','A','A','B','B','B'], n = 2",
        output: "8",
        explanation: "A -> B -> idle -> A -> B -> idle -> A -> B (8 units). Cooldown between each A or B.",
      },
      {
        input: "tasks = ['A','A','A','B','B','B'], n = 0",
        output: "6",
        explanation: "No cooldown: process all 6 orders back-to-back.",
      },
    ],
    approach:
      "Greedy with max-heap: always process the most-frequent remaining order type to minimise idle time. Each cycle of (n+1) slots: fill with the top-(n+1) most frequent types (or idle). Repeat until all processed. Mathematical shortcut: minimum time = max(len(tasks), (max_freq - 1) * (n + 1) + count_of_max_freq).",
    code: `import heapq
from collections import Counter

def min_schedule_time(tasks: list[str], n: int) -> int:
    """
    Formula approach: O(k) where k = number of distinct task types.
    Intuition: arrange the most frequent task in a grid of width (n+1).
    Each row (except possibly the last) has (n+1) slots.
    The last row has count_max tasks at the same max frequency.
    Total = (max_freq - 1) * (n + 1) + count_max.
    Take max with len(tasks) because if many distinct types, no idle is needed.
    """
    counts   = Counter(tasks)
    max_freq = max(counts.values())
    count_max = sum(1 for v in counts.values() if v == max_freq)

    # Mathematical formula
    formula_time = (max_freq - 1) * (n + 1) + count_max
    return max(len(tasks), formula_time)


def min_schedule_simulation(tasks: list[str], n: int) -> int:
    """
    Simulation with max-heap: greedy — always schedule the most frequent available.
    Explicitly shows the schedule (useful for debugging or logging the order).
    O(time_total * log k).
    """
    counts = Counter(tasks)
    heap   = [-cnt for cnt in counts.values()]   # max-heap via negation
    heapq.heapify(heap)

    time_elapsed = 0
    while heap:
        cycle  = []
        # Process up to n+1 tasks in this cycle (one per slot)
        for _ in range(n + 1):
            if heap:
                cycle.append(heapq.heappop(heap))
        # Re-add tasks with remaining count > 0
        for cnt in cycle:
            if cnt + 1 < 0:    # cnt is negative; cnt+1 means one less remaining
                heapq.heappush(heap, cnt + 1)
        time_elapsed += n + 1 if heap else len(cycle)   # idle only if more to do

    return time_elapsed


def schedule_with_log(tasks: list[str], n: int) -> list[str]:
    """
    Return the actual schedule sequence (including 'idle' slots).
    Useful for audit trails in algorithmic trading systems.
    """
    import heapq
    counts = Counter(tasks)
    heap   = [(-cnt, sym) for sym, cnt in counts.items()]
    heapq.heapify(heap)
    schedule = []

    while heap:
        cycle = []
        for _ in range(n + 1):
            if heap:
                cnt, sym = heapq.heappop(heap)
                schedule.append(sym)
                cycle.append((cnt + 1, sym))
            elif any(c < 0 for c, _ in cycle):  # still more to do after this cycle
                schedule.append("idle")
        for cnt, sym in cycle:
            if cnt < 0:
                heapq.heappush(heap, (cnt, sym))

    return schedule


# Tests
print(min_schedule_time(['A','A','A','B','B','B'], 2))      # 8
print(min_schedule_time(['A','A','A','B','B','B'], 0))      # 6
print(min_schedule_time(['A','A','A','A','B','B','C'], 3))  # 10

print(min_schedule_simulation(['A','A','A','B','B','B'], 2)) # 8`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-0526-b1-insert-interval",
    leetcodeNumber: 57,
    title: "Insert Interval — Price Level Gap Tracker",
    difficulty: "medium",
    topics: ["intervals", "greedy", "finance"],
    problem:
      "Maintain a set of non-overlapping price ranges [low, high] representing visible depth in a sparse order book (only levels with quantity are tracked). When a new level is inserted or updated, merge any overlapping ranges. Given a sorted list of non-overlapping intervals and a new interval, insert the new interval and return the merged result. This maintains the compact representation of filled price ranges in a market depth monitor.",
    examples: [
      {
        input: "intervals = [[1,3],[6,9]], newInterval = [2,5]",
        output: "[[1,5],[6,9]]",
        explanation: "[1,3] and [2,5] overlap → merged to [1,5]. [6,9] stays.",
      },
      {
        input: "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]",
        output: "[[1,2],[3,10],[12,16]]",
        explanation: "[4,8] overlaps with [3,5],[6,7],[8,10] → merged to [3,10].",
      },
    ],
    approach:
      "Three-pass greedy: (1) Add all intervals that end before the new interval starts (no overlap, left of new). (2) Merge all intervals that overlap with the new interval (update new interval's bounds). (3) Add all intervals that start after the new interval ends (no overlap, right of new). O(n) time, O(n) space.",
    code: `def insert_and_merge(intervals: list[list[int]],
                      new_interval: list[int]) -> list[list[int]]:
    """
    Three-phase insertion:
    Phase 1: intervals entirely to the left (end < new.start) → add as-is.
    Phase 2: overlapping intervals (start <= new.end) → extend new interval.
    Phase 3: intervals entirely to the right → add as-is.
    """
    result = []
    i, n   = 0, len(intervals)

    # Phase 1: no overlap on the left
    while i < n and intervals[i][1] < new_interval[0]:
        result.append(intervals[i])
        i += 1

    # Phase 2: merge overlapping intervals into new_interval
    while i < n and intervals[i][0] <= new_interval[1]:
        new_interval[0] = min(new_interval[0], intervals[i][0])
        new_interval[1] = max(new_interval[1], intervals[i][1])
        i += 1
    result.append(new_interval)

    # Phase 3: no overlap on the right
    while i < n:
        result.append(intervals[i])
        i += 1

    return result


class PriceDepthTracker:
    """
    Maintain a compact list of price ranges where depth exists.
    add_range: insert a new filled range.
    remove_range: punch a hole (split intervals at a gap).
    Used to track 'where is there actually a quote?' in sparse markets.
    """
    def __init__(self):
        self.ranges: list[list[int]] = []

    def add_range(self, lo: int, hi: int) -> None:
        self.ranges = insert_and_merge(self.ranges, [lo, hi])

    def remove_range(self, lo: int, hi: int) -> None:
        """Remove (punch a hole) in the range [lo, hi]."""
        result = []
        for start, end in self.ranges:
            if end < lo or start > hi:
                result.append([start, end])   # no overlap with removal
            else:
                if start < lo:
                    result.append([start, lo - 1])   # left remnant
                if end > hi:
                    result.append([hi + 1, end])      # right remnant
        self.ranges = result

    def contains(self, price: int) -> bool:
        for lo, hi in self.ranges:
            if lo <= price <= hi: return True
            if lo > price: break
        return False


# Tests
print(insert_and_merge([[1,3],[6,9]], [2,5]))
# [[1,5],[6,9]]
print(insert_and_merge([[1,2],[3,5],[6,7],[8,10],[12,16]], [4,8]))
# [[1,2],[3,10],[12,16]]
print(insert_and_merge([], [5,7]))
# [[5,7]]

tracker = PriceDepthTracker()
tracker.add_range(100, 105)
tracker.add_range(108, 112)
tracker.add_range(103, 109)
print(tracker.ranges)           # [[100,112]] after merge
tracker.remove_range(106, 108)
print(tracker.ranges)           # [[100,105],[109,112]]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-0526-b1-coin-change-ii",
    leetcodeNumber: 518,
    title: "Coin Change II — Portfolio Weight Combinations",
    difficulty: "medium",
    topics: ["dynamic-programming", "combinatorics", "finance"],
    problem:
      "A portfolio must allocate exactly W units of capital across available instruments, where each instrument has a minimum allocation unit (e.g., 1%, 5%, 10% of capital). Find the total number of distinct allocation combinations that exactly sum to W. This counts how many valid portfolio compositions exist for a given mandate — used in brute-force optimisation over small discrete allocation grids.",
    examples: [
      {
        input: "total = 5, units = [1, 2, 5]",
        output: "4",
        explanation: "5=5; 5=2+2+1; 5=2+1+1+1; 5=1+1+1+1+1. Four distinct combinations.",
      },
      {
        input: "total = 3, units = [2]",
        output: "0",
        explanation: "Cannot make 3 from only 2-unit increments.",
      },
    ],
    approach:
      "Unbounded knapsack DP (each denomination can be used any number of times). dp[w] = number of ways to make exactly w using available unit sizes. Transition: for each unit u, dp[w] += dp[w - u] for all w >= u. Process one denomination at a time (outer loop) to avoid counting permutations (order doesn't matter). O(total * len(units)) time, O(total) space.",
    code: `def count_allocation_combos(total: int, units: list[int]) -> int:
    """
    Unbounded knapsack counting variant:
    dp[w] = number of ways to form exactly w using elements of 'units'
            with repetition allowed and order ignored.
    Key: outer loop over denominations ensures each combination is counted once
         (not once per permutation). This is 'change-making, unordered'.
    """
    dp    = [0] * (total + 1)
    dp[0] = 1                    # one way to allocate 0: use nothing

    for unit in units:
        for w in range(unit, total + 1):
            dp[w] += dp[w - unit]

    return dp[total]


def list_allocation_combos(total: int, units: list[int]) -> list[list[int]]:
    """
    Backtracking to enumerate all combinations (for small total/units).
    Useful for portfolio construction audit: list every valid allocation.
    """
    units  = sorted(units)
    result = []

    def backtrack(remaining: int, start_idx: int, current: list[int]) -> None:
        if remaining == 0:
            result.append(current[:])
            return
        for i in range(start_idx, len(units)):
            if units[i] > remaining:
                break
            current.append(units[i])
            backtrack(remaining - units[i], i, current)   # i (not i+1): reuse allowed
            current.pop()

    backtrack(total, 0, [])
    return result


def portfolio_composition_count(budget_pct: int,
                                  min_allocations: list[int]) -> dict:
    """
    Finance wrapper: given a budget of budget_pct (integer %) and a list of
    minimum per-asset allocation blocks (e.g., [5, 10, 25] for 5%, 10%, 25%),
    count distinct portfolio weight combinations summing to budget_pct.
    """
    count  = count_allocation_combos(budget_pct, min_allocations)
    combos = list_allocation_combos(budget_pct, min_allocations) if count < 1000 else []
    return {"count": count, "examples": combos[:5]}


# Tests
print(count_allocation_combos(5, [1, 2, 5]))    # 4
print(count_allocation_combos(3, [2]))           # 0
print(count_allocation_combos(10, [1, 2, 5]))   # 10

# Portfolio example: allocate exactly 100% using 5%, 10%, 25%, 50% blocks
result = portfolio_composition_count(100, [5, 10, 25, 50])
print(f"Portfolio combinations: {result['count']}")
print(f"First 5 examples:")
for combo in result["examples"]:
    print(f"  {combo} = {sum(combo)}%")`,
    language: "python",
    complexity: { time: "O(total * len(units))", space: "O(total)" },
  },
  {
    id: "fin-0526-b1-swim-rising-water",
    leetcodeNumber: 778,
    title: "Swim in Rising Water — Minimum Volatility Path",
    difficulty: "hard",
    topics: ["heap", "binary-search", "BFS", "union-find", "finance"],
    problem:
      "Given an N×N grid where grid[i][j] represents the volatility (or risk) of routing a trade through market venue (i,j), find the path from (0,0) to (N-1,N-1) that minimises the maximum volatility encountered along the path. This is the 'minimum bottleneck' or 'min-max' path problem: find the routing of an order through a network of venues/dark pools such that the worst-case slippage on any single hop is minimised.",
    examples: [
      {
        input: "grid = [[0,2],[1,3]]",
        output: "3",
        explanation: "Path (0,0)→(0,1)→(1,1): max(0,2,3)=3. Path (0,0)→(1,0)→(1,1): max(0,1,3)=3. Both have bottleneck 3.",
      },
      {
        input: "grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]",
        output: "16",
        explanation: "Spiral path around the grid has maximum volatility 16.",
      },
    ],
    approach:
      "Dijkstra-style min-max: use a min-heap where the priority is the maximum grid value seen on the path to reach each cell. The cost to reach (r,c) is max(current_max, grid[r][c]). Pop the cell with the smallest current max and expand. Alternative: binary search on the answer + BFS feasibility check. Both are O(N² log N).",
    code: `import heapq

def min_max_volatility(grid: list[list[int]]) -> int:
    """
    Modified Dijkstra for min-max path (minimax bottleneck):
    dist[r][c] = minimum possible value of max(grid values on any path to (r,c)).
    Heap entry: (max_so_far, row, col).
    Greedy: always expand the path with the smallest current bottleneck.
    Correct because once we reach a cell with a certain max, any other path
    with a smaller max would have been explored first by the heap.
    """
    N    = len(grid)
    dist = [[float('inf')] * N for _ in range(N)]
    dist[0][0] = grid[0][0]
    heap = [(grid[0][0], 0, 0)]   # (max_vol, row, col)

    while heap:
        max_vol, r, c = heapq.heappop(heap)
        if r == N-1 and c == N-1:
            return max_vol
        if max_vol > dist[r][c]:
            continue             # stale entry
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < N and 0 <= nc < N:
                new_max = max(max_vol, grid[nr][nc])
                if new_max < dist[nr][nc]:
                    dist[nr][nc] = new_max
                    heapq.heappush(heap, (new_max, nr, nc))

    return dist[N-1][N-1]


def min_max_binary_search(grid: list[list[int]]) -> int:
    """
    Binary search on the answer + BFS feasibility.
    Can we reach (N-1,N-1) using only cells with grid value <= threshold?
    Search for the minimum threshold. O(N^2 log N^2) = O(N^2 log N).
    """
    from collections import deque
    N = len(grid)

    def can_reach(threshold: int) -> bool:
        if grid[0][0] > threshold:
            return False
        visited = [[False]*N for _ in range(N)]
        visited[0][0] = True
        queue = deque([(0, 0)])
        while queue:
            r, c = queue.popleft()
            if r == N-1 and c == N-1:
                return True
            for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
                nr, nc = r+dr, c+dc
                if 0<=nr<N and 0<=nc<N and not visited[nr][nc] and grid[nr][nc]<=threshold:
                    visited[nr][nc] = True
                    queue.append((nr, nc))
        return False

    lo, hi = grid[0][0], N * N - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if can_reach(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo


# Tests
print(min_max_volatility([[0,2],[1,3]]))                                # 3
print(min_max_binary_search([[0,2],[1,3]]))                             # 3
print(min_max_volatility([[0,1,2,3,4],[24,23,22,21,5],
                           [12,13,14,15,16],[11,17,18,19,20],
                           [10,9,8,7,6]]))                              # 16`,
    language: "python",
    complexity: { time: "O(N^2 log N)", space: "O(N^2)" },
  },
];
