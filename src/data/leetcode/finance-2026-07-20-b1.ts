import { LeetCodeProblem } from "./index";

export const financeProblems20260720B1: LeetCodeProblem[] = [
  {
    id: "fin-20260720-b1-k-largest-pnl",
    title: "K Largest Daily P&Ls",
    difficulty: "easy",
    topics: ["heap", "sorting"],
    problem:
      "Given an array of daily P&L values (positive = profit, negative = loss), return the K largest P&Ls in descending order. Your solution must run in O(n log k) time.",
    examples: [
      {
        input: "pnls = [300, -200, 500, 100, -50, 800, 150], k = 3",
        output: "[800, 500, 300]",
        explanation: "Top 3 P&Ls are 800, 500, 300.",
      },
    ],
    constraints: ["1 ≤ k ≤ n ≤ 10⁵", "-10⁶ ≤ pnl[i] ≤ 10⁶"],
    approach:
      "Use a min-heap of size k. Iterate through P&Ls: push to heap, then pop the smallest if heap exceeds k. Result is the heap sorted descending. Min-heap keeps the k largest at O(log k) per element.",
    code: `import heapq
from typing import List

def k_largest_pnls(pnls: List[float], k: int) -> List[float]:
    heap: List[float] = []
    for p in pnls:
        heapq.heappush(heap, p)
        if len(heap) > k:
            heapq.heappop(heap)
    return sorted(heap, reverse=True)`,
    language: "python",
    complexity: { time: "O(n log k)", space: "O(k)" },
  },
  {
    id: "fin-20260720-b1-rate-limiter",
    title: "Order Rate Limiter (Sliding Window)",
    difficulty: "medium",
    topics: ["queue", "sliding-window", "design"],
    problem:
      "Design an order rate limiter that enforces a maximum of `max_orders` within any rolling `window_sec` seconds. Implement `allow(timestamp_ms: int) -> bool` that returns True if the order is allowed, False if it would violate the rate limit. Multiple calls may share the same timestamp.",
    examples: [
      {
        input:
          "max_orders=3, window_sec=1\ncalls: allow(0), allow(500), allow(800), allow(999), allow(1001)",
        output: "[True, True, True, False, True]",
        explanation:
          "At t=999 there are already 3 orders in [0,999]. At t=1001 the order at t=0 has left the window [1,1001].",
      },
    ],
    constraints: [
      "0 ≤ timestamp_ms ≤ 10⁹",
      "1 ≤ max_orders ≤ 1000",
      "Timestamps are non-decreasing",
    ],
    approach:
      "Maintain a deque of accepted timestamps. On each call, pop front entries older than (timestamp - window_sec*1000). If deque length < max_orders, accept and append; else reject.",
    code: `from collections import deque

class RateLimiter:
    def __init__(self, max_orders: int, window_sec: int):
        self.max_orders = max_orders
        self.window_ms  = window_sec * 1000
        self.window: deque = deque()

    def allow(self, timestamp_ms: int) -> bool:
        cutoff = timestamp_ms - self.window_ms
        while self.window and self.window[0] <= cutoff:
            self.window.popleft()
        if len(self.window) < self.max_orders:
            self.window.append(timestamp_ms)
            return True
        return False`,
    language: "python",
    complexity: { time: "O(1) amortised per call", space: "O(max_orders)" },
  },
  {
    id: "fin-20260720-b1-stock-span",
    title: "Stock Span Problem",
    difficulty: "medium",
    topics: ["stack", "monotonic-stack"],
    problem:
      "The stock span for a given day is the number of consecutive days (including today) going backwards for which the price was ≤ today's price. Given an array of daily closing prices, return the span for each day.",
    examples: [
      {
        input: "prices = [100, 80, 60, 70, 60, 75, 85]",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation:
          "On day 6 (price 85), the previous 5 days all had prices ≤ 85, so span = 6.",
      },
    ],
    constraints: ["1 ≤ n ≤ 10⁵", "1 ≤ prices[i] ≤ 10⁵"],
    approach:
      "Use a monotonic decreasing stack of (price, span) pairs. For each day, pop all pairs with price ≤ current and accumulate their spans. Push (current_price, accumulated_span) to the stack.",
    code: `from typing import List

def stock_span(prices: List[int]) -> List[int]:
    stack: List[tuple] = []  # (price, span)
    result = []
    for p in prices:
        span = 1
        while stack and stack[-1][0] <= p:
            span += stack.pop()[1]
        stack.append((p, span))
        result.append(span)
    return result`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260720-b1-lru-pricer",
    title: "LRU Pricer Cache",
    difficulty: "medium",
    topics: ["hash-map", "doubly-linked-list", "design"],
    problem:
      "Implement an LRU (Least Recently Used) cache for option prices. Operations: `get(key)` returns the cached price or -1; `put(key, price)` inserts or updates. When capacity is exceeded, evict the least recently used entry. Both operations must be O(1).",
    examples: [
      {
        input:
          "capacity=2\nput('AAPL-C-150', 5.20)\nput('MSFT-C-300', 3.80)\nget('AAPL-C-150')\nput('GOOG-C-120', 7.10)\nget('MSFT-C-300')",
        output: "5.20, -1",
        explanation:
          "After inserting GOOG, MSFT (LRU) is evicted because AAPL was accessed more recently.",
      },
    ],
    constraints: ["1 ≤ capacity ≤ 3000", "0 ≤ price ≤ 10⁶"],
    approach:
      "Combine a dict (O(1) lookup) with a doubly-linked list to track access order. get/put both move the node to the head; eviction removes the tail.",
    code: `from collections import OrderedDict

class LRUPricerCache:
    def __init__(self, capacity: int):
        self.cap   = capacity
        self.cache: OrderedDict = OrderedDict()

    def get(self, key: str) -> float:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: str, price: float) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = price
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(capacity)" },
  },
  {
    id: "fin-20260720-b1-segment-vwap",
    title: "Range VWAP Query with Segment Tree",
    difficulty: "hard",
    topics: ["segment-tree", "range-query"],
    problem:
      "Given arrays of trade prices and quantities for n ticks, answer q queries: each query asks for the VWAP (Volume-Weighted Average Price) over a range [l, r]. VWAP = sum(price[i]*qty[i]) for i in [l,r] / sum(qty[i]) for i in [l,r]. Build in O(n), answer each query in O(log n).",
    examples: [
      {
        input:
          "prices=[10,11,9,12,10], qtys=[100,200,150,50,300]\nquery(0,2), query(1,4)",
        output: "10.222, 10.52",
        explanation:
          "query(0,2): (10*100+11*200+9*150)/(100+200+150) = 4600/450 ≈ 10.222.",
      },
    ],
    constraints: [
      "1 ≤ n ≤ 10⁵",
      "1 ≤ q ≤ 10⁵",
      "0 ≤ prices[i], qtys[i] ≤ 10⁶",
    ],
    approach:
      "Build a segment tree where each node stores (sum_pq, sum_q) for its range. Merge nodes by adding both sums. VWAP for any range is sum_pq / sum_q from the combined query result.",
    code: `from typing import List, Tuple

class VWAPSegTree:
    def __init__(self, prices: List[float], qtys: List[float]):
        n = len(prices)
        self.n = n
        self.tree: List[Tuple[float,float]] = [(0.0,0.0)] * (4*n)
        self._build(prices, qtys, 0, n-1, 0)

    def _build(self, p, q, l, r, node):
        if l == r:
            self.tree[node] = (p[l]*q[l], q[l])
            return
        mid = (l+r)//2
        self._build(p, q, l, mid, 2*node+1)
        self._build(p, q, mid+1, r, 2*node+2)
        a, b = self.tree[2*node+1], self.tree[2*node+2]
        self.tree[node] = (a[0]+b[0], a[1]+b[1])

    def _query(self, ql, qr, l, r, node):
        if ql > r or qr < l:
            return (0.0, 0.0)
        if ql <= l and r <= qr:
            return self.tree[node]
        mid = (l+r)//2
        a = self._query(ql, qr, l, mid, 2*node+1)
        b = self._query(ql, qr, mid+1, r, 2*node+2)
        return (a[0]+b[0], a[1]+b[1])

    def vwap(self, l: int, r: int) -> float:
        pq, q = self._query(l, r, 0, self.n-1, 0)
        return pq / q if q > 0 else 0.0`,
    language: "python",
    complexity: { time: "O(n) build, O(log n) per query", space: "O(n)" },
  },
  {
    id: "fin-20260720-b1-matrix-markov",
    title: "Multi-Step Markov Transition via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["matrix-exponentiation", "dynamic-programming"],
    problem:
      "A credit rating system has n states (AAA, AA, ... Default). Given the one-period transition matrix T (n×n), compute the k-step transition matrix T^k. Use matrix exponentiation to solve in O(n³ log k) instead of O(n³ k). Return T^k[start][end] for given start, end states.",
    examples: [
      {
        input:
          "T=[[0.9,0.1,0],[0.05,0.85,0.10],[0,0,1]], k=10, start=0, end=2",
        output: "≈ 0.0861",
        explanation: "Probability of transitioning from AAA to Default in 10 steps.",
      },
    ],
    constraints: ["2 ≤ n ≤ 10", "1 ≤ k ≤ 10⁹", "T is a valid stochastic matrix"],
    approach:
      "Implement matrix multiply over floats, then fast exponentiation: T^k = (T^(k//2))^2 * T^(k%2). Base case is the identity matrix. Runs in O(n³ log k).",
    code: `from typing import List
import numpy as np

def mat_mul(A: List[List[float]], B: List[List[float]]) -> List[List[float]]:
    n = len(A)
    C = [[0.0]*n for _ in range(n)]
    for i in range(n):
        for k in range(n):
            if A[i][k] == 0:
                continue
            for j in range(n):
                C[i][j] += A[i][k] * B[k][j]
    return C

def mat_pow(M: List[List[float]], k: int) -> List[List[float]]:
    n = len(M)
    result = [[1.0 if i==j else 0.0 for j in range(n)] for i in range(n)]
    while k > 0:
        if k & 1:
            result = mat_mul(result, M)
        M = mat_mul(M, M)
        k >>= 1
    return result

def markov_k_step(T, k, start, end):
    Tk = mat_pow(T, k)
    return Tk[start][end]`,
    language: "python",
    complexity: { time: "O(n³ log k)", space: "O(n²)" },
    leetcodeNumber: 509,
  },
  {
    id: "fin-20260720-b1-min-cash-flow",
    title: "Minimum Cash Flow to Settle Debts",
    difficulty: "hard",
    topics: ["recursion", "backtracking", "greedy"],
    problem:
      "After a series of bilateral trades, each of n counterparties has a net position (positive = owes money, negative = owed money). Find the minimum number of cash transfers needed to settle all debts. A single transfer goes from one counterparty to another.",
    examples: [
      {
        input: "net = [3, -1, -2]",
        output: "2",
        explanation:
          "Two transfers: person 0 pays person 1 one unit and person 2 two units.",
      },
    ],
    constraints: [
      "2 ≤ n ≤ 10",
      "sum(net) == 0",
      "net[i] != 0 for all i initially",
    ],
    approach:
      "Use backtracking: at each step, pick the person with the largest debt and the person with the largest credit and settle the smaller amount between them. Recursively solve the remaining positions. Track minimum transfers.",
    code: `from typing import List

def min_transfers(net: List[int]) -> int:
    nonzero = [x for x in net if x != 0]

    def dfs(idx: int) -> int:
        while idx < len(nonzero) and nonzero[idx] == 0:
            idx += 1
        if idx == len(nonzero):
            return 0
        best = float('inf')
        for j in range(idx+1, len(nonzero)):
            if nonzero[idx] * nonzero[j] < 0:  # opposite signs
                nonzero[j] += nonzero[idx]
                best = min(best, 1 + dfs(idx+1))
                nonzero[j] -= nonzero[idx]
        return best

    return dfs(0)`,
    language: "python",
    complexity: { time: "O(n!) worst case", space: "O(n)" },
  },
  {
    id: "fin-20260720-b1-cooldown-dp",
    title: "Best Time to Buy/Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["dynamic-programming", "state-machine"],
    problem:
      "Given an array of daily stock prices, find the maximum profit. You may make as many transactions as you like, but after selling you must wait one day (cooldown) before buying again. You may not hold more than one share at a time.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation: "Buy at 1, sell at 3, cooldown, buy at 0, sell at 2. Profit = 2+2 = 4... wait, correct answer: buy day0 sell day2 (+2), cooldown day3, buy day3 sell day4 (+2) = 3 net.",
      },
    ],
    constraints: ["1 ≤ n ≤ 5000", "0 ≤ prices[i] ≤ 1000"],
    approach:
      "State machine DP with three states per day: held (holding stock), sold (just sold today, must cooldown), rest (idle, can buy). Transitions: held = max(held, rest - price); sold = held + price; rest = max(rest, sold).",
    code: `from typing import List

def max_profit_cooldown(prices: List[int]) -> int:
    held = -prices[0]
    sold = 0
    rest = 0
    for price in prices[1:]:
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
    id: "fin-20260720-b1-two-sum-book",
    title: "Order Book Two-Sum Matching",
    difficulty: "easy",
    topics: ["hash-map", "two-pointers"],
    problem:
      "Given a list of buy orders (each a price) and a target spread S, find all pairs of buy prices (p1, p2) where p1 + p2 == S. Return pairs in ascending order of p1. Each price can appear multiple times in the list.",
    examples: [
      {
        input: "bids = [100, 150, 200, 100, 50], target = 250",
        output: "[[50, 200], [100, 150]]",
        explanation: "50+200=250, 100+150=250. (100,150) appears once despite two 100-bids.",
      },
    ],
    constraints: [
      "2 ≤ n ≤ 10⁴",
      "0 < bids[i] ≤ 10⁶",
      "Return unique pairs in sorted order",
    ],
    approach:
      "Use a set for seen prices and a result set for dedup. For each price p, check if target-p is in the seen set. Add (min(p, target-p), max(p, target-p)) to results set to deduplicate. Sort and return.",
    code: `from typing import List

def two_sum_pairs(bids: List[int], target: int) -> List[List[int]]:
    seen: set = set()
    pairs: set = set()
    for p in bids:
        complement = target - p
        if complement in seen:
            pair = (min(p, complement), max(p, complement))
            pairs.add(pair)
        seen.add(p)
    return sorted([list(pair) for pair in pairs])`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260720-b1-batch-partition",
    title: "Partition Batch Orders Evenly",
    difficulty: "medium",
    topics: ["dynamic-programming", "partition"],
    problem:
      "You have a list of order sizes. Partition them into exactly k batches (non-empty) to minimise the maximum batch size (sum of orders in a batch). Batches must use contiguous orders (preserve order). Return the minimum possible maximum batch sum.",
    examples: [
      {
        input: "orders = [7, 2, 5, 10, 8], k = 2",
        output: "18",
        explanation:
          "Split into [7,2,5] and [10,8] → max(14, 18) = 18. Or [7,2,5,10] and [8] → 24. Best is 18.",
      },
    ],
    constraints: ["1 ≤ k ≤ n ≤ 10³", "1 ≤ orders[i] ≤ 10⁶"],
    approach:
      "Binary search on the answer. For a given max batch size mid, greedily check if k batches suffice. Lower bound = max(orders), upper bound = sum(orders). O(n log(sum)) total.",
    code: `from typing import List

def min_max_batch(orders: List[int], k: int) -> int:
    def feasible(mid: int) -> bool:
        batches, current = 1, 0
        for o in orders:
            if current + o > mid:
                batches += 1
                current = 0
            current += o
        return batches <= k

    lo, hi = max(orders), sum(orders)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    language: "python",
    complexity: { time: "O(n log(sum))", space: "O(1)" },
    leetcodeNumber: 410,
  },
];
