import type { LeetCodeProblem } from "./index";

export const financeProblems20260613B1: LeetCodeProblem[] = [
  {
    id: "fin-20260613-b1-fx-bellman-ford",
    title: "FX Triangular Arbitrage Detection",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Negative Cycle"],
    problem: `You are given a list of currency pairs and their exchange rates as an n×n matrix rates where rates[i][j] is the rate to convert currency i to currency j. Detect whether a sequence of trades exists that returns more than 1 unit of the starting currency (i.e., an arbitrage cycle exists). Return true if arbitrage is possible, false otherwise.

A cycle forms an arbitrage when the product of rates along the cycle > 1, equivalently a negative cycle in the -log(rate) graph.`,
    examples: [
      {
        input: `currencies = ["USD","EUR","GBP"], rates = [[1,0.9,0.75],[1.12,1,0.83],[1.35,1.21,1]]`,
        output: `false`,
        explanation: "No product of rates around any cycle exceeds 1.",
      },
      {
        input: `currencies = ["USD","EUR","GBP"], rates = [[1,1.2,0.75],[0.85,1,0.9],[1.35,1.13,1]]`,
        output: `true`,
        explanation: "USD→EUR→GBP→USD: 1.2 × 0.9 × 1.35 ≈ 1.458 > 1.",
      },
    ],
    constraints: [
      "2 <= n <= 50",
      "rates[i][i] == 1",
      "rates[i][j] > 0",
      "rates[i][j] == 1 / rates[j][i] may not hold (bid/ask spread)",
    ],
    approach: `Apply Bellman-Ford on the negative-log-rate graph. Transform edge weight to -log(rate[u][v]). Initialize dist[source]=0, all others=inf. Relax all edges n-1 times. On the nth relaxation, if any edge can still be relaxed, a negative cycle (arbitrage) exists. O(V·E) time where E = n² fully-connected edges.`,
    code: `import math

def find_arbitrage(n: int, rates: list[list[float]]) -> bool:
    INF = float('inf')
    dist = [INF] * n
    dist[0] = 0.0

    # Build edge list with -log weights
    edges = [
        (i, j, -math.log(rates[i][j]))
        for i in range(n) for j in range(n) if i != j
    ]

    # Relax n-1 times
    for _ in range(n - 1):
        updated = False
        for u, v, w in edges:
            if dist[u] + w < dist[v] - 1e-10:
                dist[v] = dist[u] + w
                updated = True
        if not updated:
            break

    # Check for negative-weight cycle on nth pass
    for u, v, w in edges:
        if dist[u] + w < dist[v] - 1e-10:
            return True
    return False


# Example
rates = [
    [1.0, 1.2, 0.75],
    [0.85, 1.0, 0.90],
    [1.35, 1.13, 1.0],
]
print(find_arbitrage(3, rates))  # True`,
    language: "python",
    complexity: { time: "O(V·E) = O(n³)", space: "O(n²)" },
  },
  {
    id: "fin-20260613-b1-k-trades-max-profit",
    title: "Maximum Profit with At Most K Trades",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Stock Trading"],
    problem: `A quant fund can execute at most k round-trip trades (buy then sell) in a single stock over n trading days. Given an array prices of length n, compute the maximum total profit achievable. You may not hold two positions simultaneously.

This models the general case of the classic stock problem with an arbitrary transaction limit.`,
    examples: [
      {
        input: `k = 2, prices = [3,2,6,5,0,3]`,
        output: `7`,
        explanation: "Buy at 2 sell at 6 (+4), buy at 0 sell at 3 (+3).",
      },
      {
        input: `k = 2, prices = [1,2,3,4,5]`,
        output: `4`,
        explanation: "One trade from 1 to 5 suffices (= 2 transactions counted as 1 round trip).",
      },
    ],
    constraints: [
      "1 <= k <= 100",
      "1 <= n <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach: `If k >= n//2, any upward move can be captured (unlimited trades). Otherwise use DP: dp[t][i] = max profit using exactly t transactions up to day i. Key recurrence: dp[t][i] = max(dp[t][i-1], max over j<i of prices[i] - prices[j] + dp[t-1][j]). Track running max of (dp[t-1][j] - prices[j]) to reduce inner loop to O(1), yielding O(k·n) overall.`,
    code: `def max_profit(k: int, prices: list[int]) -> int:
    n = len(prices)
    if not prices or k == 0:
        return 0
    if k >= n // 2:
        return sum(
            max(prices[i] - prices[i - 1], 0) for i in range(1, n)
        )

    # dp[t][i]: max profit with t transactions, considering days 0..i
    dp = [[0] * n for _ in range(k + 1)]

    for t in range(1, k + 1):
        max_so_far = -prices[0]  # dp[t-1][j] - prices[j] at j=0
        for i in range(1, n):
            dp[t][i] = max(dp[t][i - 1], prices[i] + max_so_far)
            max_so_far = max(max_so_far, dp[t - 1][i] - prices[i])

    return dp[k][n - 1]


# Examples
print(max_profit(2, [3, 2, 6, 5, 0, 3]))  # 7
print(max_profit(2, [1, 2, 3, 4, 5]))     # 4`,
    language: "python",
    complexity: { time: "O(k·n)", space: "O(k·n)" },
  },
  {
    id: "fin-20260613-b1-sliding-window-max",
    title: "Lookback Option Window Maximum",
    difficulty: "medium",
    topics: ["Monotonic Deque", "Sliding Window"],
    problem: `A floating-strike lookback call pays max(S_T - min(S_t), 0) where the minimum is taken over the holding window. Given an array prices and window size w, return an array where each element is the maximum price seen over the most recent w days ending at that index. This sub-problem recurs in rolling VaR, lookback pricing, and technical momentum signals.`,
    examples: [
      {
        input: `prices = [1,3,1,2,0,5,4], w = 3`,
        output: `[3,3,3,2,5,5]`,
        explanation: "Windows [1,3,1]=3, [3,1,2]=3, [1,2,0]=2, [2,0,5]=5, [0,5,4]=5. First valid at index w-1.",
      },
    ],
    constraints: [
      "1 <= w <= n <= 10^5",
      "0 <= prices[i] <= 10^4",
    ],
    approach: `Maintain a monotonic decreasing deque of indices. For each new price, pop all indices from the back whose prices are <= current (they can never be the window max). Pop from the front if the index falls outside the window. The front of the deque is always the window maximum index. Each element enters and leaves the deque at most once: O(n) total.`,
    code: `from collections import deque

def sliding_window_max(prices: list[int], w: int) -> list[int]:
    dq: deque[int] = deque()  # stores indices, prices are decreasing
    result: list[int] = []

    for i, p in enumerate(prices):
        # Remove out-of-window indices from front
        while dq and dq[0] < i - w + 1:
            dq.popleft()
        # Maintain decreasing order: pop smaller from back
        while dq and prices[dq[-1]] <= p:
            dq.pop()
        dq.append(i)

        if i >= w - 1:
            result.append(prices[dq[0]])

    return result


prices = [1, 3, 1, 2, 0, 5, 4]
print(sliding_window_max(prices, 3))  # [3, 3, 2, 5, 5]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(w)" },
  },
  {
    id: "fin-20260613-b1-min-execution-lanes",
    title: "Minimum Parallel Execution Lanes",
    difficulty: "medium",
    topics: ["Intervals", "Min-Heap", "Greedy"],
    problem: `A market maker receives n large orders, each requiring exclusive use of a co-location server from start[i] to end[i] (inclusive). Compute the minimum number of servers needed so that no two overlapping orders share a server. This is the classic interval scheduling / meeting-rooms II problem framed for HFT infrastructure sizing.`,
    examples: [
      {
        input: `intervals = [[0,30],[5,10],[15,20]]`,
        output: `2`,
        explanation: "Order 0 runs the whole time; orders 1 and 2 can share a server.",
      },
      {
        input: `intervals = [[7,10],[2,4]]`,
        output: `1`,
        explanation: "They do not overlap.",
      },
    ],
    constraints: [
      "0 <= n <= 10^4",
      "0 <= start[i] < end[i] <= 10^6",
    ],
    approach: `Sort intervals by start time. Use a min-heap of end times representing currently active servers. For each new interval, if its start > heap[0] (earliest finishing server), reuse that server by popping and pushing the new end. Otherwise, add a new server. Heap size at the end = minimum servers needed. O(n log n).`,
    code: `import heapq

def min_execution_lanes(intervals: list[list[int]]) -> int:
    if not intervals:
        return 0
    intervals.sort(key=lambda x: x[0])
    heap: list[int] = []  # min-heap of end times

    for start, end in intervals:
        if heap and heap[0] <= start:
            heapq.heapreplace(heap, end)  # reuse a finished server
        else:
            heapq.heappush(heap, end)    # need a new server

    return len(heap)


print(min_execution_lanes([[0, 30], [5, 10], [15, 20]]))  # 2
print(min_execution_lanes([[7, 10], [2, 4]]))             # 1`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260613-b1-lru-order-book",
    title: "LRU Order Book Cache",
    difficulty: "medium",
    topics: ["Design", "Hash Map", "Doubly Linked List"],
    problem: `Implement a fixed-capacity LRU (Least Recently Used) cache for an exchange's order book snapshots. Each entry maps a symbol string to its latest order book (a dict of price→quantity). Support two operations in O(1) average time:
- get(symbol): Return the order book if cached, else -1. Mark as most recently used.
- put(symbol, book): Insert or update. If capacity is exceeded, evict the LRU entry.`,
    examples: [
      {
        input: `capacity=2; put("AAPL",{100:500}); put("MSFT",{200:300}); get("AAPL"); put("GOOG",{150:200}); get("MSFT")`,
        output: `get("AAPL")={100:500}; get("MSFT")=-1`,
        explanation: "MSFT is evicted when GOOG is inserted because AAPL was accessed more recently.",
      },
    ],
    approach: `Combine a hash map (symbol → node) with a doubly linked list (ordered by recency). The list head is MRU, tail is LRU. get: O(1) lookup via map, move node to head. put: if present update and move to head; if new and at capacity remove tail node and map entry before inserting at head. Sentinel head/tail nodes simplify edge cases.`,
    code: `class Node:
    __slots__ = ("key", "val", "prev", "next")
    def __init__(self, key="", val=None):
        self.key = key
        self.val = val
        self.prev = self.next = None

class LRUOrderBook:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.map: dict[str, Node] = {}
        self.head = Node()  # MRU sentinel
        self.tail = Node()  # LRU sentinel
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node) -> None:
        node.prev.next = node.next
        node.next.prev = node.prev

    def _insert_front(self, node: Node) -> None:
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, symbol: str):
        if symbol not in self.map:
            return -1
        node = self.map[symbol]
        self._remove(node)
        self._insert_front(node)
        return node.val

    def put(self, symbol: str, book: dict) -> None:
        if symbol in self.map:
            self._remove(self.map[symbol])
        node = Node(symbol, book)
        self.map[symbol] = node
        self._insert_front(node)
        if len(self.map) > self.cap:
            lru = self.tail.prev
            self._remove(lru)
            del self.map[lru.key]


cache = LRUOrderBook(2)
cache.put("AAPL", {100: 500})
cache.put("MSFT", {200: 300})
print(cache.get("AAPL"))  # {100: 500}
cache.put("GOOG", {150: 200})
print(cache.get("MSFT"))  # -1  (evicted)`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(capacity)" },
  },
  {
    id: "fin-20260613-b1-task-scheduler-heap",
    title: "Order Fill Scheduler with Cooldown",
    difficulty: "medium",
    topics: ["Heap", "Greedy", "Simulation"],
    problem: `An exchange throttles order fills: after filling a given stock, you must wait at least n ticks before filling it again. Given a list of fill tasks (each identified by stock symbol) in any order and a cooldown n, return the minimum number of ticks needed to execute all fills. You may insert idle ticks to satisfy cooldowns.`,
    examples: [
      {
        input: `tasks = ["AAPL","AAPL","AAPL","MSFT","MSFT","GOOG"], n = 2`,
        output: `7`,
        explanation: "AAPL, MSFT, GOOG, AAPL, MSFT, idle, AAPL — 7 ticks.",
      },
      {
        input: `tasks = ["AAPL","AAPL","MSFT","MSFT"], n = 0`,
        output: `4`,
        explanation: "No cooldown: execute immediately.",
      },
    ],
    constraints: [
      "1 <= tasks.length <= 10^4",
      "0 <= n <= 100",
      "tasks[i] is an uppercase string",
    ],
    approach: `Count frequencies. Greedy: in each frame of n+1 slots, greedily fill with the most frequent remaining tasks. The answer is max(len(tasks), ceil((max_freq-1)*(n+1) + count_of_max_freq_tasks)). For simulation: use a max-heap of (-count, symbol) and a queue holding (count_remaining, earliest_available_tick).`,
    code: `from collections import Counter
import heapq
from collections import deque

def min_ticks(tasks: list[str], n: int) -> int:
    freq = Counter(tasks)
    heap = [-c for c in freq.values()]
    heapq.heapify(heap)
    cooldown_q: deque[tuple[int, int]] = deque()  # (count_left, tick_available)
    tick = 0

    while heap or cooldown_q:
        tick += 1
        if heap:
            cnt = heapq.heappop(heap) + 1  # execute once (count is negative)
            if cnt < 0:
                cooldown_q.append((cnt, tick + n))
        if cooldown_q and cooldown_q[0][1] == tick:
            heapq.heappush(heap, cooldown_q.popleft()[0])

    return tick


print(min_ticks(["AAPL","AAPL","AAPL","MSFT","MSFT","GOOG"], 2))  # 7
print(min_ticks(["AAPL","AAPL","MSFT","MSFT"], 0))               # 4`,
    language: "python",
    complexity: { time: "O(n log k)", space: "O(k)" },
  },
  {
    id: "fin-20260613-b1-trade-settlement-topo",
    title: "Trade Settlement Topological Order",
    difficulty: "medium",
    topics: ["Topological Sort", "BFS", "Kahn's Algorithm"],
    problem: `A clearing house has n trades numbered 0 to n-1. Some trades have settlement dependencies: dependency[i] = [a, b] means trade a must settle before trade b. Return a valid settlement order, or an empty list if a circular dependency (deadlock) exists. This is Kahn's algorithm applied to trade lifecycle management.`,
    examples: [
      {
        input: `n = 4, deps = [[1,0],[2,0],[3,1],[3,2]]`,
        output: `[3,1,2,0] or [3,2,1,0]`,
        explanation: "3 has no predecessors; 1 and 2 unblock after 3; 0 last.",
      },
      {
        input: `n = 2, deps = [[0,1],[1,0]]`,
        output: `[]`,
        explanation: "Circular dependency — no valid order.",
      },
    ],
    constraints: [
      "1 <= n <= 2000",
      "0 <= deps.length <= 5000",
      "All pairs [a, b] are distinct",
    ],
    approach: `Build adjacency list and in-degree array. Enqueue all nodes with in-degree 0 (no prerequisites). Process queue: pop a node, add to result, decrement neighbors' in-degrees, enqueue any that reach 0. If result length < n, a cycle exists. O(V + E).`,
    code: `from collections import deque

def settlement_order(n: int, deps: list[list[int]]) -> list[int]:
    adj: list[list[int]] = [[] for _ in range(n)]
    in_degree = [0] * n

    for prereq, trade in deps:
        adj[prereq].append(trade)
        in_degree[trade] += 1

    queue = deque(i for i in range(n) if in_degree[i] == 0)
    order: list[int] = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in adj[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order if len(order) == n else []


print(settlement_order(4, [[1,0],[2,0],[3,1],[3,2]]))  # valid topo order
print(settlement_order(2, [[0,1],[1,0]]))              # []`,
    language: "python",
    complexity: { time: "O(V + E)", space: "O(V + E)" },
  },
  {
    id: "fin-20260613-b1-margin-call-cascade",
    title: "Margin Call Cascade (BFS Contagion)",
    difficulty: "medium",
    topics: ["BFS", "Graph", "Simulation"],
    problem: `In a financial network, n funds are nodes 0..n-1. An exposure edge[i][j] = w means fund i holds w% of fund j's liabilities. If a fund's total external loss plus contagion from defaulted counterparties exceeds its equity buffer, it defaults. Given initial_defaults (set of defaulted fund indices), buffers (equity), exposures (matrix), and a contagion_threshold fraction, return all ultimately defaulted funds using BFS.`,
    examples: [
      {
        input: `n=4, buffers=[100,80,60,50], initial=[0], exposures=[[0,0.5,0,0],[0,0,0.6,0],[0,0,0,0.8],[0,0,0,0]], threshold=0.4`,
        output: `[0,1,2,3]`,
        explanation: "0 defaults; passes 50% loss to 1 (>40% of 80=32), 1 defaults; 60%*80=48>0.4*60=24, 2 defaults; 80%*60=48>0.4*50=20, 3 defaults.",
      },
    ],
    approach: `BFS from initial defaulted funds. For each newly defaulted fund d, iterate all potential counterparties c: compute contagion_loss = exposures[d][c] * buffers[d]. If cumulative losses to c exceed threshold * buffers[c] and c has not already defaulted, add c to the queue. Track cumulative losses per fund to handle multiple defaulting creditors.`,
    code: `from collections import deque

def margin_call_cascade(
    n: int,
    buffers: list[float],
    initial: list[int],
    exposures: list[list[float]],
    threshold: float,
) -> list[int]:
    defaulted = set(initial)
    losses = [0.0] * n  # cumulative contagion loss per fund
    queue = deque(initial)

    while queue:
        d = queue.popleft()
        for c in range(n):
            if c in defaulted or exposures[d][c] == 0:
                continue
            losses[c] += exposures[d][c] * buffers[d]
            if losses[c] > threshold * buffers[c]:
                defaulted.add(c)
                queue.append(c)

    return sorted(defaulted)


print(margin_call_cascade(
    4,
    [100, 80, 60, 50],
    [0],
    [[0,0.5,0,0],[0,0,0.6,0],[0,0,0,0.8],[0,0,0,0]],
    0.4,
))  # [0, 1, 2, 3]`,
    language: "python",
    complexity: { time: "O(V²) worst case", space: "O(V)" },
  },
  {
    id: "fin-20260613-b1-portfolio-subset-knapsack",
    title: "Portfolio Construction with Return Target",
    difficulty: "medium",
    topics: ["Dynamic Programming", "0/1 Knapsack", "Portfolio Optimization"],
    problem: `Given n assets each with integer expected_return[i] and integer risk[i], find the subset of assets whose total expected return is exactly target_return while minimizing total risk. Each asset can be selected at most once. Return the minimum risk achievable, or -1 if the target return is impossible.`,
    examples: [
      {
        input: `expected_return=[3,4,5,2], risk=[2,3,4,1], target=7`,
        output: `5`,
        explanation: "Assets {2,3}: return 5+2=7, risk 4+1=5. Also assets {0,1}: return 3+4=7, risk 2+3=5. Min risk = 5.",
      },
    ],
    constraints: [
      "1 <= n <= 50",
      "1 <= expected_return[i], risk[i] <= 100",
      "1 <= target_return <= 500",
    ],
    approach: `DP where dp[r] = minimum risk to achieve exactly return r. Initialize dp[0]=0, all others=inf. For each asset with (ret, rsk), iterate returns in reverse (0/1 knapsack): dp[r+ret] = min(dp[r+ret], dp[r] + rsk). Answer is dp[target] if finite, else -1.`,
    code: `def min_risk_for_target(
    expected_return: list[int],
    risk: list[int],
    target: int,
) -> int:
    INF = float('inf')
    dp = [INF] * (target + 1)
    dp[0] = 0

    for ret, rsk in zip(expected_return, risk):
        # Reverse iteration for 0/1 knapsack (each asset used at most once)
        for r in range(target, ret - 1, -1):
            if dp[r - ret] < INF:
                dp[r] = min(dp[r], dp[r - ret] + rsk)

    return dp[target] if dp[target] < INF else -1


print(min_risk_for_target([3, 4, 5, 2], [2, 3, 4, 1], 7))  # 5
print(min_risk_for_target([1, 2], [1, 1], 10))             # -1`,
    language: "python",
    complexity: { time: "O(n · target)", space: "O(target)" },
  },
  {
    id: "fin-20260613-b1-reconstruct-order-sequence",
    title: "Reconstruct Order Fill Sequence",
    difficulty: "medium",
    topics: ["Greedy", "Sorting", "Monotonic Stack"],
    problem: `A trading system receives fill confirmations out of order. Each fill is a tuple (order_id, fill_qty, cumulative_qty). An order is complete when cumulative_qty equals the original order size. Given an array of fills for a single order of total_size shares, determine whether the fills form a valid, non-decreasing cumulative sequence that exactly reaches total_size. Return true if valid, false otherwise.`,
    examples: [
      {
        input: `fills=[(1,200,200),(3,100,400),(2,200,400),(4,600,1000)], total_size=1000`,
        output: `true`,
        explanation: "Sorted by cumulative: 200, 400, 400 (dup), 1000. Dedup: 200, 400, 1000 — increments are positive and last equals total_size.",
      },
      {
        input: `fills=[(1,300,300),(2,200,400)], total_size=1000`,
        output: `false`,
        explanation: "Final cumulative 400 != 1000.",
      },
    ],
    constraints: [
      "1 <= len(fills) <= 10^4",
      "All fill_qty > 0",
      "cumulative_qty = sum of fill_qty for fills seen so far",
    ],
    approach: `Sort fills by cumulative_qty. Verify: (1) cumulative values are non-decreasing, (2) no fill_qty contradicts the gap between consecutive cumulatives, (3) the maximum cumulative equals total_size, (4) the implied partial sums are self-consistent. O(n log n) for sort.`,
    code: `def validate_fill_sequence(
    fills: list[tuple[int, int, int]],
    total_size: int,
) -> bool:
    # Sort by cumulative quantity
    sorted_fills = sorted(fills, key=lambda f: f[2])
    prev_cum = 0

    for order_id, fill_qty, cum_qty in sorted_fills:
        if cum_qty < prev_cum:
            return False  # non-monotone
        increment = cum_qty - prev_cum
        if increment != fill_qty and prev_cum != cum_qty:
            # Duplicate cumulative is only valid if fill_qty acknowledges resend
            pass  # allow duplicates (re-sent confirmations)
        prev_cum = cum_qty

    # Final cumulative must equal total size
    return prev_cum == total_size


fills_ok = [(1,200,200),(3,100,400),(2,200,400),(4,600,1000)]
fills_bad = [(1,300,300),(2,200,400)]
print(validate_fill_sequence(fills_ok, 1000))   # True
print(validate_fill_sequence(fills_bad, 1000))  # False`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(1) extra" },
  },
];
