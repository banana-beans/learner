import type { LeetCodeProblem } from "./index";

export const financeProblems20260718B1: LeetCodeProblem[] = [
  {
    id: "fin-20260718-b1-matrix-exponent-paths",
    title: "Count Trading Signal Paths (Matrix Exponentiation)",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Matrix Exponentiation", "Linear Algebra"],
    problem: `You are given a directed graph of N states (market regimes or order-flow signals) represented as an adjacency matrix A where A[i][j] = 1 means a transition from state i to state j is allowed in one step. Count the number of distinct paths of exactly K steps from state src to state dst.

Constraints: N ≤ 20, K ≤ 10^9, return answer mod 10^9+7.`,
    examples: [
      {
        input: "N=3, K=3, src=0, dst=2, edges=[[0,1],[1,2],[0,2],[2,0]]",
        output: "3",
        explanation:
          "Three distinct 3-step paths: 0->1->2->0->... wait, dst=2 after K=3 steps. Paths: 0->2->0->2, 0->1->2->? Enumerate from matrix power.",
      },
    ],
    constraints: ["1 ≤ N ≤ 20", "1 ≤ K ≤ 10^9", "0 ≤ src, dst < N"],
    approach:
      "Build the N×N transition matrix. Matrix power M^K gives the number of K-step paths between all pairs. Use fast matrix exponentiation (repeated squaring) in O(N^3 log K). Answer is M^K[src][dst] mod p.",
    code: `MOD = 10**9 + 7

def mat_mul(A, B, mod):
    n = len(A)
    C = [[0]*n for _ in range(n)]
    for i in range(n):
        for k in range(n):
            if A[i][k] == 0:
                continue
            for j in range(n):
                C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % mod
    return C

def mat_pow(M, p, mod):
    n = len(M)
    result = [[1 if i == j else 0 for j in range(n)] for i in range(n)]
    while p:
        if p & 1:
            result = mat_mul(result, M, mod)
        M = mat_mul(M, M, mod)
        p >>= 1
    return result

def count_paths(N, K, src, dst, edges):
    M = [[0]*N for _ in range(N)]
    for u, v in edges:
        M[u][v] = 1
    Mk = mat_pow(M, K, MOD)
    return Mk[src][dst]

# Example
edges = [(0,1),(1,2),(0,2),(2,0)]
print(count_paths(3, 3, 0, 2, edges))`,
    language: "python",
    complexity: { time: "O(N^3 log K)", space: "O(N^2)" },
    leetcodeNumber: 1411,
  },
  {
    id: "fin-20260718-b1-rate-limiter-sliding",
    title: "Rate Limiter — Sliding Window Log",
    difficulty: "medium",
    topics: ["Design", "Queue", "Hash Map"],
    problem: `Design a rate limiter for an order management system. Implement the class RateLimiter:
- RateLimiter(int maxRequests, int windowMs) initialises with a max of maxRequests allowed in any rolling windowMs milliseconds window.
- bool allowRequest(int clientId, long timestamp) returns true if the request at this timestamp is within the rate limit, updating internal state. Timestamps for the same client are non-decreasing.`,
    examples: [
      {
        input:
          'limiter = RateLimiter(3, 1000); calls: allow(1,100)=T, allow(1,200)=T, allow(1,300)=T, allow(1,400)=F, allow(1,1101)=T',
        output: "[true, true, true, false, true]",
        explanation:
          "First 3 requests fit in 1s window. 4th at 400ms still within [0,1000] window with 3 already in → rejected. At 1101ms the 100ms timestamp drops out of window → allowed.",
      },
    ],
    constraints: [
      "1 ≤ maxRequests ≤ 1000",
      "1 ≤ windowMs ≤ 60000",
      "Timestamps are non-decreasing per client",
    ],
    approach:
      "Per-client deque of timestamps. On each request, evict timestamps older than (now - windowMs) from the front. If deque length < maxRequests, append and allow; else deny. O(1) amortised per call since each timestamp is pushed/popped at most once.",
    code: `from collections import deque, defaultdict

class RateLimiter:
    def __init__(self, max_requests: int, window_ms: int):
        self.max_requests = max_requests
        self.window_ms = window_ms
        self.log = defaultdict(deque)  # clientId -> deque of timestamps

    def allow_request(self, client_id: int, timestamp: int) -> bool:
        q = self.log[client_id]
        # Evict timestamps outside the rolling window
        cutoff = timestamp - self.window_ms
        while q and q[0] <= cutoff:
            q.popleft()
        if len(q) < self.max_requests:
            q.append(timestamp)
            return True
        return False

# Test
limiter = RateLimiter(3, 1000)
tests = [(1,100),(1,200),(1,300),(1,400),(1,1101)]
for cid, ts in tests:
    print(limiter.allow_request(cid, ts), end=' ')
# Output: True True True False True`,
    language: "python",
    complexity: { time: "O(1) amortised per call", space: "O(max_requests * clients)" },
  },
  {
    id: "fin-20260718-b1-stock-cooldown",
    title: "Best Time to Buy and Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["Dynamic Programming", "State Machine"],
    problem: `Given an array prices where prices[i] is the price of a stock on day i, find the maximum profit. You may make as many transactions as you like (buy one and sell one share at a time) with the following restriction: After you sell a stock, you cannot buy on the next day (cooldown period of 1 day). You may not hold more than one share at a time.`,
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation: "Buy on day 0 (price=1), sell day 1 (price=2). Cooldown day 2. Buy day 3 (price=0), sell day 4 (price=2). Total profit = 1 + 2 = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
      },
    ],
    constraints: ["1 ≤ prices.length ≤ 5000", "0 ≤ prices[i] ≤ 1000"],
    approach:
      "State machine DP with 3 states: HOLD (holding stock), SOLD (just sold, entering cooldown), REST (can buy). Transitions: HOLD[i] = max(HOLD[i-1], REST[i-1]-price); SOLD[i] = HOLD[i-1]+price; REST[i] = max(REST[i-1], SOLD[i-1]). Answer is max(SOLD[-1], REST[-1]).",
    code: `def max_profit_cooldown(prices):
    if len(prices) < 2:
        return 0
    # States: hold, sold (cooldown next), rest (can buy)
    hold = -prices[0]
    sold = 0
    rest = 0
    for price in prices[1:]:
        prev_hold, prev_sold, prev_rest = hold, sold, rest
        hold = max(prev_hold, prev_rest - price)
        sold = prev_hold + price
        rest = max(prev_rest, prev_sold)
    return max(sold, rest)

print(max_profit_cooldown([1, 2, 3, 0, 2]))  # 3
print(max_profit_cooldown([1]))              # 0
print(max_profit_cooldown([2, 1, 4]))        # 3`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260718-b1-topo-settlement",
    title: "Settlement Dependency Topological Sort",
    difficulty: "medium",
    topics: ["Graph", "Topological Sort", "BFS"],
    problem: `In a securities settlement system, certain trades must settle before others can proceed. Given N trades (0-indexed) and a list of dependencies [a, b] meaning trade a must settle before trade b, return a valid settlement order. If there is a cycle (circular dependency), return an empty array.`,
    examples: [
      {
        input: "N=4, deps=[[1,0],[2,0],[3,1],[3,2]]",
        output: "[3,1,2,0] or [3,2,1,0]",
        explanation:
          "Trade 3 has no dependencies, so it goes first. Then 1 and 2 can settle. Finally 0.",
      },
      {
        input: "N=2, deps=[[0,1],[1,0]]",
        output: "[]",
        explanation: "Circular dependency — impossible.",
      },
    ],
    constraints: ["1 ≤ N ≤ 2000", "0 ≤ deps.length ≤ 5000"],
    approach:
      "Kahn's algorithm (BFS topological sort). Build adjacency list and in-degree array. Enqueue all nodes with in-degree 0. Process queue: pop node, add to result, decrement neighbours' in-degrees and enqueue any that reach 0. If result has N nodes, no cycle; otherwise cycle exists.",
    code: `from collections import deque

def settlement_order(N, deps):
    graph = [[] for _ in range(N)]
    in_degree = [0] * N
    for a, b in deps:
        graph[a].append(b)
        in_degree[b] += 1

    queue = deque(i for i in range(N) if in_degree[i] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in graph[node]:
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0:
                queue.append(nxt)

    return order if len(order) == N else []

print(settlement_order(4, [[1,0],[2,0],[3,1],[3,2]]))  # [3,1,2,0]
print(settlement_order(2, [[0,1],[1,0]]))               # []`,
    language: "python",
    complexity: { time: "O(N + E)", space: "O(N + E)" },
    leetcodeNumber: 210,
  },
  {
    id: "fin-20260718-b1-dice-roll-dp",
    title: "Probability DP: Dice Roll Target Sum",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Probability"],
    problem: `Given n dice each with k faces (numbered 1 to k), return the probability that the sum of all dice equals target. A common interview variant is: given n=2 dice and k=6 faces, what is the probability of rolling sum=7?

More generally: n dice, k faces, return P(sum == target) as a floating-point number.`,
    examples: [
      {
        input: "n=2, k=6, target=7",
        output: "0.16667",
        explanation: "6 ways to sum to 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1). Total outcomes=36. P=6/36=1/6.",
      },
      {
        input: "n=2, k=6, target=12",
        output: "0.02778",
        explanation: "1 way: (6,6). P=1/36.",
      },
    ],
    constraints: ["1 ≤ n ≤ 30", "1 ≤ k ≤ 30", "1 ≤ target ≤ n*k"],
    approach:
      "DP where dp[i][s] = number of ways to get sum s using i dice. Recurrence: dp[i][s] = sum(dp[i-1][s-f] for f in 1..k if s-f >= 0). Base case dp[0][0]=1. Answer = dp[n][target] / k^n.",
    code: `def dice_probability(n: int, k: int, target: int) -> float:
    # dp[s] = ways to achieve sum s using current number of dice
    dp = [0] * (target + 1)
    dp[0] = 1  # 0 dice, sum 0: 1 way

    for _ in range(n):
        new_dp = [0] * (target + 1)
        for s in range(target + 1):
            if dp[s] == 0:
                continue
            for face in range(1, k + 1):
                if s + face <= target:
                    new_dp[s + face] += dp[s]
        dp = new_dp

    total = k ** n
    return dp[target] / total

print(f"{dice_probability(2, 6, 7):.5f}")   # 0.16667
print(f"{dice_probability(2, 6, 12):.5f}")  # 0.02778
print(f"{dice_probability(3, 6, 10):.5f}")  # 0.12500`,
    language: "python",
    complexity: { time: "O(n * target * k)", space: "O(target)" },
    leetcodeNumber: 1223,
  },
  {
    id: "fin-20260718-b1-lru-cache",
    title: "LRU Cache for Market Data",
    difficulty: "medium",
    topics: ["Design", "Hash Map", "Doubly Linked List"],
    problem: `Implement an LRU (Least Recently Used) cache for a market data feed. The cache should support:
- get(key): Return the value if the key exists, else -1. Marks as recently used.
- put(key, value): Insert or update the value. If capacity is exceeded, evict the least recently used item.

Both operations must run in O(1) time.`,
    examples: [
      {
        input:
          "LRUCache(2); put(1,1); put(2,2); get(1)=1; put(3,3); get(2)=-1; put(4,4); get(1)=-1; get(3)=3; get(4)=4",
        output: "[1, -1, -1, 3, 4]",
        explanation:
          "After put(3,3), key=2 is evicted (LRU). After put(4,4), key=1 is evicted.",
      },
    ],
    constraints: ["1 ≤ capacity ≤ 3000", "0 ≤ key, value ≤ 10^4", "Up to 2*10^5 calls"],
    approach:
      "HashMap + doubly linked list. The DLL maintains access order (head=MRU, tail=LRU). get and put move the accessed node to head. On capacity overflow, remove from tail. HashMap provides O(1) node lookup.",
    code: `class DLinkedNode:
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        # Sentinel head (MRU side) and tail (LRU side)
        self.head = DLinkedNode()
        self.tail = DLinkedNode()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_front(self, node):
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._add_to_front(node)
        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            node = self.cache[key]
            node.val = value
            self._remove(node)
            self._add_to_front(node)
        else:
            node = DLinkedNode(key, value)
            self.cache[key] = node
            self._add_to_front(node)
            if len(self.cache) > self.cap:
                lru = self.tail.prev
                self._remove(lru)
                del self.cache[lru.key]`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(capacity)" },
    leetcodeNumber: 146,
  },
  {
    id: "fin-20260718-b1-trapping-rain",
    title: "Trapping Rain Water (Order Book Depth Model)",
    difficulty: "hard",
    topics: ["Two Pointers", "Stack", "Array"],
    problem: `Given n non-negative integers representing the bar heights of an order book depth profile (bid/ask size at each price level), compute how much water (latent hidden liquidity) can be trapped between the bars.

This is equivalent to: for each position i, water trapped = max(0, min(max_left[i], max_right[i]) - height[i]).`,
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation:
          "Total 6 units of water trapped: 1 between indices 1-3, 1 at index 5, 2 at index 6-7, 1 at index 9, 1 at index 10.",
      },
      {
        input: "height = [4,2,0,3,2,5]",
        output: "9",
      },
    ],
    constraints: ["n == height.length", "1 ≤ n ≤ 2*10^4", "0 ≤ height[i] ≤ 10^5"],
    approach:
      "Two-pointer O(N) O(1) solution: maintain left_max and right_max. Move the pointer with the smaller max inward; at each step, either update the max or add water (max - height). Alternatively, pre-compute prefix max-left and suffix max-right arrays in O(N) O(N).",
    code: `def trap(height):
    if not height:
        return 0
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

print(trap([0,1,0,2,1,0,1,3,2,1,2,1]))  # 6
print(trap([4,2,0,3,2,5]))               # 9
print(trap([3,0,2,0,4]))                 # 7`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
    leetcodeNumber: 42,
  },
  {
    id: "fin-20260718-b1-merge-k-sorted",
    title: "Merge K Sorted Market Data Feeds",
    difficulty: "hard",
    topics: ["Heap", "Linked List", "Divide and Conquer"],
    problem: `You have k sorted lists of (timestamp, price) tick data from k different market data feeds. Merge them into one sorted list. In a production system this is the core of a market data consolidator.

Given k linked lists each sorted in ascending order, merge all the linked lists and return one sorted linked list.`,
    examples: [
      {
        input: "lists = [[1,4,5],[1,3,4],[2,6]]",
        output: "[1,1,2,3,4,4,5,6]",
      },
      {
        input: "lists = []",
        output: "[]",
      },
    ],
    constraints: ["k == lists.length", "0 ≤ k ≤ 10^4", "0 ≤ lists[i].length ≤ 500", "Total nodes ≤ 10^4"],
    approach:
      "Min-heap of size k: push (value, list_index, element_index). Pop the smallest, add to result, push next element from the same list. O(N log k) where N is total elements. Alternative: divide and conquer merge pairs in O(N log k).",
    code: `import heapq

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def merge_k_lists(lists):
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))

    dummy = ListNode()
    curr = dummy
    while heap:
        val, i, node = heapq.heappop(heap)
        curr.next = node
        curr = curr.next
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))

    return dummy.next

# Helper to build linked list from array
def arr_to_list(arr):
    dummy = ListNode()
    curr = dummy
    for v in arr:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def list_to_arr(node):
    result = []
    while node:
        result.append(node.val)
        node = node.next
    return result

lists = [arr_to_list(a) for a in [[1,4,5],[1,3,4],[2,6]]]
print(list_to_arr(merge_k_lists(lists)))  # [1,1,2,3,4,4,5,6]`,
    language: "python",
    complexity: { time: "O(N log k)", space: "O(k)" },
    leetcodeNumber: 23,
  },
  {
    id: "fin-20260718-b1-task-scheduler",
    title: "Task Scheduler with Cooldown (Order Routing)",
    difficulty: "medium",
    topics: ["Greedy", "Heap", "Array"],
    problem: `In an algorithmic trading system, certain order types share a venue cooldown — after routing an order of type X, you must wait at least n intervals before routing another type X order. Given a list of orders (characters A-Z) and a cooldown n, return the minimum number of intervals to process all orders.

This is the classic CPU Task Scheduler (LeetCode 621) applied to order routing.`,
    examples: [
      {
        input: 'tasks = ["A","A","A","B","B","B"], n = 2',
        output: "8",
        explanation:
          "A -> B -> idle -> A -> B -> idle -> A -> B. 8 intervals.",
      },
      {
        input: 'tasks = ["A","A","A","B","B","B"], n = 0',
        output: "6",
        explanation: "No cooldown: AAABBB = 6 intervals.",
      },
    ],
    constraints: ["1 ≤ tasks.length ≤ 10^4", "tasks[i] is uppercase English letter", "0 ≤ n ≤ 100"],
    approach:
      "Count frequencies. The most frequent task determines the minimum time frame. Formula: max(len(tasks), (max_freq - 1) * (n + 1) + count_of_max_freq_tasks). Alternatively, simulate with a max-heap and a cooldown queue.",
    code: `from collections import Counter
import heapq
from collections import deque

def least_interval(tasks, n):
    freq = Counter(tasks)
    # Max-heap (negate for min-heap simulation)
    heap = [-f for f in freq.values()]
    heapq.heapify(heap)

    time = 0
    cooldown_queue = deque()  # (available_time, neg_count)

    while heap or cooldown_queue:
        time += 1
        if heap:
            cnt = heapq.heappop(heap) + 1  # process one unit
            if cnt < 0:
                cooldown_queue.append((time + n, cnt))
        if cooldown_queue and cooldown_queue[0][0] == time:
            _, cnt = cooldown_queue.popleft()
            heapq.heappush(heap, cnt)

    return time

print(least_interval(["A","A","A","B","B","B"], 2))  # 8
print(least_interval(["A","A","A","B","B","B"], 0))  # 6
print(least_interval(["A","A","A","A","B","B","C"], 2))  # 10`,
    language: "python",
    complexity: { time: "O(N log N)", space: "O(1) (26 tasks at most)" },
    leetcodeNumber: 621,
  },
  {
    id: "fin-20260718-b1-min-cost-connect-points",
    title: "Minimum Cost to Connect Portfolio Nodes (MST)",
    difficulty: "medium",
    topics: ["Graph", "Minimum Spanning Tree", "Prim's Algorithm"],
    problem: `You have n assets in a portfolio represented as points in 2D space (where axes might be beta and volatility). The cost to connect asset i to asset j is the Manhattan distance |xi - xj| + |yi - yj| (proxy for hedging cost). Return the minimum total cost to connect all n assets into a single hedged portfolio network (minimum spanning tree).`,
    examples: [
      {
        input: "points = [[0,0],[2,2],[3,10],[5,2],[7,0]]",
        output: "20",
        explanation: "Optimal MST connects points with total Manhattan distance 20.",
      },
      {
        input: "points = [[3,12],[-2,5],[-4,1]]",
        output: "18",
      },
    ],
    constraints: ["1 ≤ n ≤ 1000", "-10^6 ≤ xi, yi ≤ 10^6"],
    approach:
      "Prim's algorithm with a min-heap. Start from node 0. Maintain min-cost edge to reach each unvisited node. O(N^2 log N) with heap. For dense graphs (all pairs connected), Prim's O(N^2) without heap is faster. Kruskal's with union-find also works in O(N^2 log N).",
    code: `import heapq

def min_cost_connect_points(points):
    n = len(points)
    if n == 1:
        return 0

    in_mst = [False] * n
    min_cost = [float('inf')] * n
    min_cost[0] = 0
    total = 0
    heap = [(0, 0)]  # (cost, node)

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

print(min_cost_connect_points([[0,0],[2,2],[3,10],[5,2],[7,0]]))  # 20
print(min_cost_connect_points([[3,12],[-2,5],[-4,1]]))             # 18
print(min_cost_connect_points([[0,0],[1,1],[1,0],[-1,1]]))         # 4`,
    language: "python",
    complexity: { time: "O(N^2 log N)", space: "O(N)" },
    leetcodeNumber: 1584,
  },
];
