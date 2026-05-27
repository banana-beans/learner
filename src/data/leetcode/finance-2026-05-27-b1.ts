import type { LeetCodeProblem } from "./index";

export const financeProblems20260527B1: LeetCodeProblem[] = [
  {
    id: "fin-0527-b1-trapping-rain",
    leetcodeNumber: 42,
    title: "Trapping Rain Water — Liquidity Gap Analysis",
    difficulty: "hard",
    topics: ["two-pointers", "array", "finance"],
    problem:
      "Given an array representing bid-side depth at each price level (height[i] = available size), compute how much latent buy interest is 'trapped' between dominant walls — the total volume that could fill if a sweep order consumed all offers up to each peak. Formally: for each index i, trapped[i] = min(max_left[i], max_right[i]) - height[i]. Return sum of all trapped[i]. This models liquidity gap analysis: sparse order books with islands of depth trap notional that only surfaces under aggressive market orders.",
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,1,2,1,2,1]",
        output: "6",
        explanation: "Trapped between peaks: 1+1+0+1+0+1+1+0+1 = 6 units of latent depth.",
      },
      {
        input: "height = [4,2,0,3,2,5]",
        output: "9",
        explanation: "Gaps at levels 1–4 trap 9 total units.",
      },
    ],
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5",
    ],
    approach:
      "Two-pointer O(n)/O(1): maintain left and right pointers. Track max_left and max_right seen so far. Whichever side has the smaller max determines how much water that pointer can hold: water += max_side - height[ptr]. Advance the smaller-max pointer inward. This avoids the O(n) prefix/suffix arrays of the naive approach.",
    code: `from typing import List

def trap(height: List[int]) -> int:
    left, right = 0, len(height) - 1
    max_left = max_right = 0
    water = 0

    while left < right:
        if height[left] <= height[right]:
            if height[left] >= max_left:
                max_left = height[left]
            else:
                water += max_left - height[left]
            left += 1
        else:
            if height[right] >= max_right:
                max_right = height[right]
            else:
                water += max_right - height[right]
            right -= 1

    return water


# ----- Finance framing -----
def liquidity_gap(depth_by_level: List[int]) -> dict:
    """
    Returns total trapped notional and a per-level gap map.
    In practice depth_by_level[i] = bid size at price tick i.
    """
    n = len(depth_by_level)
    max_left = [0] * n
    max_right = [0] * n

    mx = 0
    for i in range(n):
        mx = max(mx, depth_by_level[i])
        max_left[i] = mx

    mx = 0
    for i in range(n - 1, -1, -1):
        mx = max(mx, depth_by_level[i])
        max_right[i] = mx

    gaps = {
        i: min(max_left[i], max_right[i]) - depth_by_level[i]
        for i in range(n)
        if min(max_left[i], max_right[i]) > depth_by_level[i]
    }
    return {"total_trapped": sum(gaps.values()), "gap_map": gaps}


if __name__ == "__main__":
    book = [0, 1, 0, 2, 1, 0, 1, 3, 1, 2, 1, 2, 1]
    print(trap(book))                    # 6
    print(liquidity_gap(book)["total_trapped"])  # 6`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },

  {
    id: "fin-0527-b1-largest-rect",
    leetcodeNumber: 84,
    title: "Largest Rectangle in Histogram — Max Order Depth Window",
    difficulty: "hard",
    topics: ["monotonic-stack", "array", "finance"],
    problem:
      "Given heights[] representing the bid depth at consecutive price ticks, find the maximum 'depth-window': the largest rectangular area under the depth curve. This models the maximum notional a single sweep order can absorb without exhausting any price level within a contiguous tick range — a key input to market impact estimation and optimal execution algorithms (VWAP, IS).",
    examples: [
      {
        input: "heights = [2,1,5,6,2,3]",
        output: "10",
        explanation: "Rectangle of height 5 spanning ticks 2–3 (0-indexed) gives area 5*2=10.",
      },
      {
        input: "heights = [2,4]",
        output: "4",
        explanation: "Either single bar of height 4, or span of 2 at height 2 — max is 4.",
      },
    ],
    constraints: [
      "1 <= n <= 10^5",
      "0 <= heights[i] <= 10^4",
    ],
    approach:
      "Monotonic stack: maintain a stack of indices with strictly increasing heights. When we encounter a bar shorter than the stack top, pop and compute the area using that bar as the height; the width extends from the current index back to the new stack top. Append sentinel 0 at the end to flush the stack. O(n) time, O(n) space.",
    code: `from typing import List

def largest_rect_histogram(heights: List[int]) -> int:
    stack: list[int] = []   # indices, increasing heights
    max_area = 0
    heights = heights + [0]  # sentinel flushes remaining stack

    for i, h in enumerate(heights):
        start = i
        while stack and heights[stack[-1]] > h:
            idx = stack.pop()
            width = i - (stack[-1] + 1 if stack else 0)
            max_area = max(max_area, heights[idx] * width)
            start = idx
        stack.append(start)

    return max_area


# ----- Market impact framing -----
def max_sweep_notional(bid_depth: List[int], tick_size: float = 0.01) -> dict:
    """
    Find the largest contiguous tick range where a single order can be
    filled at every level without exhausting any tick's depth.
    Returns max notional (shares * ticks), the optimal price range, and
    the constraining depth (the minimum depth in that range).
    """
    n = len(bid_depth)
    heights = bid_depth + [0]
    stack: list[int] = []
    best = {"notional": 0, "left_tick": 0, "right_tick": 0, "depth": 0}

    for i, h in enumerate(heights):
        start = i
        while stack and bid_depth[stack[-1]] > h:
            idx = stack.pop()
            left = stack[-1] + 1 if stack else 0
            width = i - left
            area = bid_depth[idx] * width
            if area > best["notional"]:
                best = {
                    "notional": area,
                    "left_tick": left,
                    "right_tick": i - 1,
                    "depth": bid_depth[idx],
                }
            start = idx
        stack.append(start)

    best["price_range"] = best["right_tick"] - best["left_tick"] + 1
    best["notional_usd"] = best["notional"] * tick_size
    return best


if __name__ == "__main__":
    book = [2, 1, 5, 6, 2, 3]
    print(largest_rect_histogram(book))        # 10
    print(max_sweep_notional(book))`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },

  {
    id: "fin-0527-b1-k-closest",
    leetcodeNumber: 973,
    title: "K Closest Points to Origin — Nearest Benchmark Selection",
    difficulty: "medium",
    topics: ["heap", "sorting", "finance"],
    problem:
      "Given a list of factor-exposure vectors (each represented as a 2D point [beta_market, beta_value]) and an integer k, return the k assets whose factor exposure is closest to the benchmark (origin = zero active exposure). Distance is Euclidean: sqrt(x^2 + y^2). Used in benchmark-aware portfolio construction: after running an optimizer, select the k closest factor-neutral positions to minimize tracking error.",
    examples: [
      {
        input: "points = [[1,3],[-2,2]], k = 1",
        output: "[[-2,2]]",
        explanation: "sqrt(1^2+3^2)=sqrt(10) vs sqrt((-2)^2+2^2)=sqrt(8). [-2,2] is closer.",
      },
      {
        input: "points = [[3,3],[5,-1],[-2,4]], k = 2",
        output: "[[3,3],[-2,4]]",
        explanation: "Distances: sqrt(18), sqrt(26), sqrt(20). Two smallest: sqrt(18), sqrt(20).",
      },
    ],
    constraints: [
      "1 <= k <= points.length <= 10^4",
      "-10^4 <= xi, yi <= 10^4",
    ],
    approach:
      "Max-heap of size k: maintain a max-heap keyed on negative squared distance. For each point, push to heap; if heap exceeds k, pop the farthest. Final heap contains k nearest. Alternatively, use heapq.nsmallest — same complexity but cleaner. O(n log k) time, O(k) space. For large n, Quickselect gives O(n) average.",
    code: `import heapq
from typing import List

def k_closest(points: List[List[int]], k: int) -> List[List[int]]:
    # max-heap (negate distance so smallest stay)
    heap: list = []
    for x, y in points:
        dist2 = x * x + y * y
        heapq.heappush(heap, (-dist2, x, y))
        if len(heap) > k:
            heapq.heappop(heap)
    return [[x, y] for _, x, y in heap]


# ----- Factor exposure framing -----
def nearest_benchmark_assets(
    exposures: list[tuple[str, float, float]],   # (ticker, beta_mkt, beta_val)
    k: int,
    benchmark: tuple[float, float] = (0.0, 0.0),
) -> list[dict]:
    """
    Return k assets with factor exposures nearest to \`benchmark\`.
    benchmark = (0,0) means zero active factor bets.
    """
    bx, by = benchmark
    heap: list = []
    for ticker, bm, bv in exposures:
        dist2 = (bm - bx) ** 2 + (bv - by) ** 2
        heapq.heappush(heap, (-dist2, ticker, bm, bv))
        if len(heap) > k:
            heapq.heappop(heap)

    return [
        {"ticker": t, "beta_mkt": bm, "beta_val": bv, "dist": (-d) ** 0.5}
        for d, t, bm, bv in sorted(heap, key=lambda x: -x[0])
    ]


if __name__ == "__main__":
    pts = [[1, 3], [-2, 2], [3, 3], [5, -1]]
    print(k_closest(pts, 2))

    assets = [("AAPL", 1.1, 0.3), ("MSFT", 0.1, 0.05), ("GS", 1.8, -0.4)]
    print(nearest_benchmark_assets(assets, 2))`,
    language: "python",
    complexity: { time: "O(n log k)", space: "O(k)" },
  },

  {
    id: "fin-0527-b1-count-smaller",
    leetcodeNumber: 315,
    title: "Count of Smaller Numbers After Self — Trade Impact Ranking",
    difficulty: "hard",
    topics: ["merge-sort", "binary-indexed-tree", "finance"],
    problem:
      "Given a list of trade execution prices in chronological order, for each trade compute how many subsequent trades executed at a strictly lower price. This is the 'adverse selection count': trades followed by many lower-priced deals suggest the trader moved the market or suffered informed flow. Return an array counts[] where counts[i] = number of trades[j] < trades[i] for all j > i.",
    examples: [
      {
        input: "nums = [5,2,6,1]",
        output: "[2,1,1,0]",
        explanation: "5 has [2,1] after it that are smaller → 2. 2 has [1] → 1. 6 has [1] → 1. 1 has nothing → 0.",
      },
      {
        input: "nums = [-1,-1]",
        output: "[0,0]",
        explanation: "No element is strictly smaller than -1 after each position.",
      },
    ],
    constraints: [
      "1 <= n <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
    ],
    approach:
      "Merge sort with index tracking: during merge, whenever we take a right-half element over a left-half element, all remaining left-half elements have found one more 'smaller after self'. Accumulate counts during the merge step. O(n log n) time, O(n) space. Alternatively, a BIT (Fenwick tree) on coordinate-compressed values iterated right-to-left achieves the same complexity.",
    code: `from typing import List

def count_smaller(nums: List[int]) -> List[int]:
    n = len(nums)
    counts = [0] * n
    indexed = list(enumerate(nums))   # (original_index, value)

    def merge_sort(arr):
        if len(arr) <= 1:
            return arr
        mid = len(arr) // 2
        left = merge_sort(arr[:mid])
        right = merge_sort(arr[mid:])
        return merge(left, right)

    def merge(left, right):
        result = []
        i = j = 0
        right_count = 0    # how many right elements we've consumed
        while i < len(left) and j < len(right):
            if left[i][1] > right[j][1]:
                # right[j] is smaller than left[i]; any remaining left
                # elements we'll place later will also count right[j]
                right_count += 1
                result.append(right[j])
                j += 1
            else:
                # place left[i]; it has seen \`right_count\` smaller elements
                counts[left[i][0]] += right_count
                result.append(left[i])
                i += 1
        while i < len(left):
            counts[left[i][0]] += right_count
            result.append(left[i])
            i += 1
        result.extend(right[j:])
        return result

    merge_sort(indexed)
    return counts


# ----- Adverse selection framing -----
def adverse_selection_counts(exec_prices: list[float]) -> dict:
    """
    For each execution, count how many later executions were cheaper
    (indicating the trade may have contributed to adverse price impact).
    High counts = potential informed flow or market impact.
    """
    counts = count_smaller([int(p * 100) for p in exec_prices])
    n = len(exec_prices)
    return {
        "counts": counts,
        "most_adverse_idx": max(range(n), key=lambda i: counts[i]),
        "avg_adverse": sum(counts) / n,
    }


if __name__ == "__main__":
    print(count_smaller([5, 2, 6, 1]))   # [2, 1, 1, 0]
    trades = [100.5, 100.2, 100.8, 99.9]
    print(adverse_selection_counts(trades))`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },

  {
    id: "fin-0527-b1-min-cost-connect",
    leetcodeNumber: 1584,
    title: "Min Cost to Connect All Points — Portfolio Minimum Spanning Tree",
    difficulty: "medium",
    topics: ["graph", "minimum-spanning-tree", "finance"],
    problem:
      "Given n assets as points in factor-exposure space ([beta1, beta2]), find the minimum total 'distance' needed to connect all assets into a single spanning structure. Distance between two assets is Manhattan distance |x1-x2| + |y1-y2|, representing the cost of a relative-value trade (pair trade) that neutralises factor exposure differences. The MST gives the cheapest set of pair trades that fully hedges the cross-asset factor structure.",
    examples: [
      {
        input: "points = [[0,0],[2,2],[3,10],[5,2],[7,0]]",
        output: "20",
        explanation: "Optimal MST edges cost 20 total.",
      },
      {
        input: "points = [[3,12],[-2,5],[-4,1]]",
        output: "18",
        explanation: "Connect all three assets with two pair trades costing 18.",
      },
    ],
    constraints: [
      "1 <= n <= 1000",
      "-10^6 <= points[i][j] <= 10^6",
    ],
    approach:
      "Prim's algorithm starting from node 0: maintain min_cost[i] = cheapest edge connecting node i to the current MST. At each step, pick the unvisited node with smallest min_cost, add it to MST, then update neighbors. O(n^2) — optimal for dense graphs where O(E log E) Kruskal would be worse since E = O(n^2).",
    code: `from typing import List
import heapq

def min_cost_connect_points(points: List[List[int]]) -> int:
    n = len(points)
    in_mst = [False] * n
    min_cost = [float("inf")] * n
    min_cost[0] = 0
    total = 0

    heap = [(0, 0)]   # (cost, node)
    while heap:
        cost, u = heapq.heappop(heap)
        if in_mst[u]:
            continue
        in_mst[u] = True
        total += cost
        for v in range(n):
            if not in_mst[v]:
                dist = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1])
                if dist < min_cost[v]:
                    min_cost[v] = dist
                    heapq.heappush(heap, (dist, v))

    return total


# ----- Portfolio MST framing -----
def portfolio_mst(
    tickers: list[str],
    factor_exposures: list[tuple[float, float]],
) -> dict:
    """
    Build the minimum-cost pair-trade graph that hedges all cross-asset
    factor differences. Each MST edge (i, j) represents a pair trade
    with hedging cost proportional to factor-exposure distance.
    """
    n = len(tickers)
    points = [[x, y] for x, y in factor_exposures]

    # Reconstruct MST edges for reporting
    in_mst = [False] * n
    min_cost = [float("inf")] * n
    parent = [-1] * n
    min_cost[0] = 0
    total = 0
    edges = []

    heap = [(0, 0)]
    while heap:
        cost, u = heapq.heappop(heap)
        if in_mst[u]:
            continue
        in_mst[u] = True
        total += cost
        if parent[u] != -1:
            edges.append((tickers[parent[u]], tickers[u], cost))
        for v in range(n):
            if not in_mst[v]:
                dist = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1])
                if dist < min_cost[v]:
                    min_cost[v] = dist
                    parent[v] = u
                    heapq.heappush(heap, (dist, v))

    return {"total_hedging_cost": total, "pair_trades": edges}


if __name__ == "__main__":
    pts = [[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]
    print(min_cost_connect_points(pts))   # 20
    tickers = ["AAPL", "MSFT", "GS", "JPM", "BAC"]
    print(portfolio_mst(tickers, [(0, 0), (2, 2), (3, 10), (5, 2), (7, 0)]))`,
    language: "python",
    complexity: { time: "O(n^2 log n)", space: "O(n)" },
  },

  {
    id: "fin-0527-b1-course-schedule",
    leetcodeNumber: 210,
    title: "Course Schedule II — Strategy DAG Execution Order",
    difficulty: "medium",
    topics: ["topological-sort", "graph", "finance"],
    problem:
      "A quant research pipeline has n tasks (0-indexed) with dependencies: prerequisite[i] = [a, b] means task b must complete before task a. Return a valid execution order of all tasks, or [] if a circular dependency exists (impossible pipeline). In systematic trading, this models strategy DAGs: a signal computation must precede its downstream risk model, which must precede the order-sizer, etc.",
    examples: [
      {
        input: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]",
        output: "[0,2,1,3] or [0,1,2,3]",
        explanation: "0 has no deps, then 1 and 2 (either order), then 3.",
      },
      {
        input: "numCourses = 2, prerequisites = [[1,0],[0,1]]",
        output: "[]",
        explanation: "Circular dependency 0→1→0; no valid order.",
      },
    ],
    constraints: [
      "1 <= numCourses <= 2000",
      "0 <= prerequisites.length <= numCourses * (numCourses - 1)",
    ],
    approach:
      "Kahn's algorithm (BFS topological sort): compute in-degrees. Push all zero-in-degree nodes to queue. Process queue: pop node, add to order, decrement neighbor in-degrees; if any reach 0, push them. If final order length < numCourses, a cycle exists.",
    code: `from typing import List
from collections import deque, defaultdict

def find_order(num_courses: int, prerequisites: List[List[int]]) -> List[int]:
    graph = defaultdict(list)
    in_degree = [0] * num_courses

    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1

    queue = deque(i for i in range(num_courses) if in_degree[i] == 0)
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order if len(order) == num_courses else []


# ----- Strategy pipeline framing -----
def strategy_execution_order(
    tasks: list[str],
    dependencies: list[tuple[str, str]],   # (task, must_run_after)
) -> dict:
    """
    Topologically sort a strategy computation DAG.
    Returns the execution order or raises if a cycle is detected
    (indicates a circular model dependency that must be resolved).
    """
    idx = {t: i for i, t in enumerate(tasks)}
    n = len(tasks)
    prereqs = [[idx[b], idx[a]] for a, b in dependencies]
    order_idx = find_order(n, prereqs)

    if not order_idx:
        cycle_nodes = [t for t, i in idx.items() if i not in set(order_idx)]
        return {"valid": False, "cycle_candidates": cycle_nodes}

    return {"valid": True, "order": [tasks[i] for i in order_idx]}


if __name__ == "__main__":
    print(find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]]))
    pipeline = ["raw_data", "signal", "risk_model", "order_sizer", "execution"]
    deps = [
        ("signal", "raw_data"),
        ("risk_model", "signal"),
        ("order_sizer", "risk_model"),
        ("execution", "order_sizer"),
    ]
    print(strategy_execution_order(pipeline, deps))`,
    language: "python",
    complexity: { time: "O(V + E)", space: "O(V + E)" },
  },

  {
    id: "fin-0527-b1-weighted-pick",
    leetcodeNumber: 528,
    title: "Random Pick with Weight — Weighted Venue Routing",
    difficulty: "medium",
    topics: ["prefix-sum", "binary-search", "randomization", "finance"],
    problem:
      "Design a smart order router that randomly selects a trading venue proportional to its historical fill rate (weight). Given weights[] where weights[i] is venue i's fill-rate score, implement: __init__(weights) — preprocesses the weights; pickIndex() — returns a random venue index with probability proportional to its weight. Used in SOR (Smart Order Routing) to probabilistically distribute flow across lit exchanges and dark pools.",
    examples: [
      {
        input: "weights = [1,3]; pickIndex() called many times",
        output: "Index 1 returned ~75% of the time, index 0 ~25%",
        explanation: "Total weight 4. P(0) = 1/4 = 0.25, P(1) = 3/4 = 0.75.",
      },
      {
        input: "weights = [1,2,3,4]",
        output: "Indices with probabilities [0.1, 0.2, 0.3, 0.4]",
        explanation: "Total=10. Prefix sums [1,3,6,10], sample uniform [0,10) and bisect.",
      },
    ],
    constraints: [
      "1 <= weights.length <= 10^4",
      "1 <= weights[i] <= 10^5",
      "At most 10^4 calls to pickIndex()",
    ],
    approach:
      "Prefix sum + binary search: build cumulative weight array. To pick, draw a uniform random float in [0, total_weight), then bisect_left to find which bucket it falls into. O(n) build, O(log n) per pick.",
    code: `import random
import bisect
from typing import List

class Solution:
    def __init__(self, weights: List[int]):
        self.prefix = []
        total = 0
        for w in weights:
            total += w
            self.prefix.append(total)
        self.total = total

    def pickIndex(self) -> int:
        target = random.random() * self.total
        return bisect.bisect_left(self.prefix, target)


# ----- Smart Order Router framing -----
class SmartOrderRouter:
    """
    Probabilistic venue selector weighted by fill-rate quality scores.
    pickVenue() returns a venue proportional to its weight, used to
    distribute orders across exchanges/dark pools to maximise fill rate
    while minimising market impact.
    """

    def __init__(self, venues: list[str], fill_rates: list[float]):
        self.venues = venues
        self.prefix: list[float] = []
        total = 0.0
        for fr in fill_rates:
            total += fr
            self.prefix.append(total)
        self.total = total

    def pick_venue(self) -> str:
        target = random.random() * self.total
        idx = bisect.bisect_left(self.prefix, target)
        return self.venues[idx]

    def simulate_routing(self, n_orders: int) -> dict[str, int]:
        counts: dict[str, int] = {v: 0 for v in self.venues}
        for _ in range(n_orders):
            counts[self.pick_venue()] += 1
        return counts


if __name__ == "__main__":
    sol = Solution([1, 3])
    from collections import Counter
    results = Counter(sol.pickIndex() for _ in range(10_000))
    print(dict(results))    # ~{0: 2500, 1: 7500}

    router = SmartOrderRouter(
        ["NYSE", "NASDAQ", "BATS", "IEX"],
        [0.40, 0.30, 0.20, 0.10]
    )
    print(router.simulate_routing(10_000))`,
    language: "python",
    complexity: { time: "O(n) build, O(log n) pick", space: "O(n)" },
  },

  {
    id: "fin-0527-b1-job-sched",
    leetcodeNumber: 1235,
    title: "Maximum Profit in Job Scheduling — Non-Overlapping Trade Windows",
    difficulty: "hard",
    topics: ["dynamic-programming", "binary-search", "sorting", "finance"],
    problem:
      "A high-frequency desk can execute at most one strategy at a time. Given n trading windows each defined by (startTime, endTime, profit), select a non-overlapping subset that maximises total P&L. Two windows overlap if one starts before the other ends. This is the weighted interval scheduling problem — a staple in optimal trade scheduling and backtest window selection.",
    examples: [
      {
        input: "startTime=[1,2,3,3], endTime=[3,4,5,6], profit=[50,10,40,70]",
        output: "120",
        explanation: "Select windows (1,3,50) and (3,6,70) — they are non-overlapping, total 120.",
      },
      {
        input: "startTime=[1,2,3,4,6], endTime=[3,5,10,6,9], profit=[20,20,100,200,19]",
        output: "200",
        explanation: "Single window (4,6,200) gives the best profit.",
      },
    ],
    constraints: [
      "1 <= n <= 5 * 10^4",
      "1 <= startTime[i] < endTime[i] <= 10^9",
      "1 <= profit[i] <= 10^4",
    ],
    approach:
      "Sort jobs by endTime. DP[i] = max profit using the first i jobs (sorted). For each job i, use bisect_right on endTimes to find the latest job j whose endTime <= startTime[i]. dp[i+1] = max(dp[i], dp[j] + profit[i]). O(n log n).",
    code: `from typing import List
import bisect

def job_scheduling(
    start_time: List[int],
    end_time: List[int],
    profit: List[int],
) -> int:
    jobs = sorted(zip(start_time, end_time, profit), key=lambda x: x[1])
    n = len(jobs)
    end_times = [j[1] for j in jobs]
    # dp[i] = max profit considering first i jobs (0-indexed: dp[0]=0 base)
    dp = [0] * (n + 1)

    for i, (s, e, p) in enumerate(jobs):
        # find rightmost job whose end <= s (can run before this job)
        j = bisect.bisect_right(end_times, s)
        dp[i + 1] = max(dp[i], dp[j] + p)

    return dp[n]


# ----- Trade window scheduling framing -----
def max_pnl_windows(windows: list[dict]) -> dict:
    """
    Select a non-overlapping subset of trade execution windows to
    maximise total P&L. Each window: {start, end, pnl, strategy}.
    Returns the selected windows and their total P&L.
    """
    windows_sorted = sorted(windows, key=lambda w: w["end"])
    n = len(windows_sorted)
    end_times = [w["end"] for w in windows_sorted]
    pnls = [w["pnl"] for w in windows_sorted]

    dp = [0] * (n + 1)
    chosen = [[] for _ in range(n + 1)]

    for i, w in enumerate(windows_sorted):
        j = bisect.bisect_right(end_times, w["start"])
        skip_pnl = dp[i]
        take_pnl = dp[j] + pnls[i]
        if take_pnl > skip_pnl:
            dp[i + 1] = take_pnl
            chosen[i + 1] = chosen[j] + [w]
        else:
            dp[i + 1] = skip_pnl
            chosen[i + 1] = chosen[i]

    return {"max_pnl": dp[n], "selected_windows": chosen[n]}


if __name__ == "__main__":
    print(job_scheduling([1, 2, 3, 3], [3, 4, 5, 6], [50, 10, 40, 70]))  # 120
    wins = [
        {"start": 1, "end": 3, "pnl": 50, "strategy": "MR"},
        {"start": 2, "end": 4, "pnl": 10, "strategy": "MOM"},
        {"start": 3, "end": 6, "pnl": 70, "strategy": "STAT-ARB"},
    ]
    print(max_pnl_windows(wins))`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },

  {
    id: "fin-0527-b1-lis",
    leetcodeNumber: 300,
    title: "Longest Increasing Subsequence — Max Consecutive Return Run",
    difficulty: "medium",
    topics: ["dynamic-programming", "binary-search", "finance"],
    problem:
      "Given a time series of daily returns, find the length of the longest strictly increasing subsequence (LIS). This identifies the longest 'uptrend run' — the maximum number of days (not necessarily consecutive) whose returns form a strictly increasing sequence. Used in momentum signal validation: a long LIS indicates persistent upward drift in return distribution, supporting a momentum strategy.",
    examples: [
      {
        input: "nums = [10,9,2,5,3,7,101,18]",
        output: "4",
        explanation: "LIS: [2,3,7,101] or [2,5,7,18] — length 4.",
      },
      {
        input: "nums = [0,1,0,3,2,3]",
        output: "4",
        explanation: "LIS: [0,1,2,3] — length 4.",
      },
    ],
    constraints: [
      "1 <= nums.length <= 2500",
      "-10^4 <= nums[i] <= 10^4",
    ],
    approach:
      "Patience sorting (O(n log n)): maintain 'piles' array where piles[i] = smallest tail element of all LIS of length i+1 found so far. For each number, binary search for its position in piles (bisect_left). If found within piles, replace; otherwise extend. len(piles) = LIS length. Does not reconstruct the actual subsequence without backtracking.",
    code: `from typing import List
import bisect

def length_of_lis(nums: List[int]) -> int:
    piles: list[int] = []   # piles[i] = min tail of all IS of length i+1
    for num in nums:
        pos = bisect.bisect_left(piles, num)
        if pos == len(piles):
            piles.append(num)
        else:
            piles[pos] = num
    return len(piles)


def reconstruct_lis(nums: List[int]) -> List[int]:
    """Return one actual LIS (not just its length)."""
    n = len(nums)
    tails: list[int] = []
    parent = [-1] * n
    index_of_tail: list[int] = []   # index_of_tail[k] = index in nums of tail of LIS len k+1

    for i, num in enumerate(nums):
        pos = bisect.bisect_left(tails, num)
        if pos == len(tails):
            tails.append(num)
            index_of_tail.append(i)
        else:
            tails[pos] = num
            index_of_tail[pos] = i
        parent[i] = index_of_tail[pos - 1] if pos > 0 else -1

    # trace back from last element in LIS
    result = []
    idx = index_of_tail[-1]
    while idx != -1:
        result.append(nums[idx])
        idx = parent[idx]
    return result[::-1]


# ----- Momentum signal framing -----
def momentum_lis_signal(returns: list[float]) -> dict:
    """
    LIS-based momentum signal.
    High LIS / n ratio → strong uptrend; signals long momentum position.
    Returns LIS length, ratio, and the actual return subsequence.
    """
    scaled = [int(r * 10_000) for r in returns]   # avoid float bisect issues
    lis_len = length_of_lis(scaled)
    lis_seq = reconstruct_lis(scaled)

    n = len(returns)
    ratio = lis_len / n
    signal = "STRONG_MOM" if ratio > 0.6 else "WEAK_MOM" if ratio > 0.4 else "NO_SIGNAL"

    return {
        "lis_length": lis_len,
        "ratio": ratio,
        "signal": signal,
        "lis_returns": [s / 10_000 for s in lis_seq],
    }


if __name__ == "__main__":
    print(length_of_lis([10, 9, 2, 5, 3, 7, 101, 18]))   # 4
    daily = [0.01, -0.005, 0.02, 0.015, 0.03, -0.01, 0.04, 0.035]
    print(momentum_lis_signal(daily))`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
];
