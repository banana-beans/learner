import type { LeetCodeProblem } from "./index";

export const financeProblems20260625B1: LeetCodeProblem[] = [
  {
    id: "fin-20260625-b1-stock-fee",
    title: "Best Time to Buy/Sell Stock with Transaction Fee",
    difficulty: "medium",
    topics: ["dynamic programming", "greedy"],
    leetcodeNumber: 714,
    problem:
      "Given daily stock prices and a transaction fee paid on each sell, find the maximum profit. You may complete as many transactions as you like, but you need to pay the transaction fee for each transaction.",
    examples: [
      {
        input: "prices = [1,3,2,8,4,9], fee = 2",
        output: "8",
        explanation: "Buy at 1, sell at 8 (profit 5); buy at 4, sell at 9 (profit 3). Total = 8.",
      },
    ],
    constraints: ["1 <= prices.length <= 5*10^4", "0 <= prices[i] < 5*10^4", "0 <= fee < 5*10^4"],
    approach:
      "Two-state DP: cash = max profit while not holding; hold = max profit while holding. Transition: hold = max(hold, cash - price); cash = max(cash, hold + price - fee). The fee on sell prevents over-trading.",
    code: `def max_profit_with_fee(prices: list[int], fee: int) -> int:
    cash, hold = 0, -prices[0]
    for p in prices[1:]:
        cash = max(cash, hold + p - fee)
        hold = max(hold, cash - p)
    return cash`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260625-b1-sliding-max",
    title: "Sliding Window Maximum (Rolling High-Water Mark)",
    difficulty: "hard",
    topics: ["deque", "sliding window", "monotonic queue"],
    leetcodeNumber: 239,
    problem:
      "Given an array and window size k, return the maximum of each sliding window. Finance application: rolling peak for drawdown computation.",
    examples: [
      {
        input: "nums = [1,3,-1,-3,5,3,6,7], k = 3",
        output: "[3,3,5,5,6,7]",
        explanation: "Each window of 3 elements: max([1,3,-1])=3, max([3,-1,-3])=3, etc.",
      },
    ],
    constraints: ["1 <= k <= n <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    approach:
      "Maintain a monotone decreasing deque of indices. Evict front if out of window; evict back while back element <= current (useless). Front is always the max for current window.",
    code: `from collections import deque

def sliding_window_max(nums: list[int], k: int) -> list[int]:
    dq  = deque()   # stores indices, decreasing values
    res = []
    for i, x in enumerate(nums):
        while dq and dq[0] < i - k + 1:
            dq.popleft()
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            res.append(nums[dq[0]])
    return res

def rolling_drawdown(pnl: list[float], k: int) -> list[float]:
    peaks = sliding_window_max(pnl, k)
    return [pnl[i + k - 1] - peaks[i] for i in range(len(peaks))]`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
  },
  {
    id: "fin-20260625-b1-bellman-ford-fx",
    title: "FX Arbitrage Detection via Bellman-Ford",
    difficulty: "medium",
    topics: ["graphs", "Bellman-Ford", "negative cycle"],
    problem:
      "Given an n x n matrix of exchange rates rates[i][j], detect whether a profitable FX cycle exists. A cycle i->j->k->i is profitable if rates[i][j]*rates[j][k]*rates[k][i] > 1.",
    examples: [
      {
        input: "rates = [[1,2,0.5],[0.6,1,0.9],[2.1,1.1,1]]",
        output: "true",
        explanation: "Convert rates to -log weights. A negative-weight cycle in this graph equals a profitable arbitrage cycle.",
      },
    ],
    constraints: ["2 <= n <= 50", "rates[i][j] > 0", "rates[i][i] == 1"],
    approach:
      "Take -log of each rate. A profitable cycle is a negative-weight cycle in this graph. Run Bellman-Ford for n-1 iterations; if any edge still relaxes on the nth pass, a negative cycle exists.",
    code: `import math

def has_fx_arbitrage(rates: list[list[float]]) -> bool:
    n = len(rates)
    dist = [0.0] * n

    for iteration in range(n):
        updated = False
        for u in range(n):
            for v in range(n):
                if u == v or rates[u][v] == 0:
                    continue
                w = -math.log(rates[u][v])
                if dist[u] + w < dist[v] - 1e-10:
                    dist[v]  = dist[u] + w
                    updated  = True
        if iteration == n - 1 and updated:
            return True
        if not updated:
            break
    return False`,
    language: "python",
    complexity: { time: "O(n^3)", space: "O(n^2)" },
  },
  {
    id: "fin-20260625-b1-median-stream",
    title: "Find Median from Data Stream (Real-Time P&L)",
    difficulty: "hard",
    topics: ["heap", "two heaps"],
    leetcodeNumber: 295,
    problem:
      "Design a data structure that supports addNum(num) and findMedian(). Finance: maintain running median of trade P&Ls for robust performance tracking.",
    examples: [
      {
        input: "addNum(1), addNum(2), findMedian() -> 1.5, addNum(3), findMedian() -> 2.0",
        output: "1.5, 2.0",
        explanation: "Max-heap holds lower half, min-heap holds upper half; median is average of tops or top of larger heap.",
      },
    ],
    constraints: ["-10^5 <= num <= 10^5", "At most 5*10^4 calls to addNum and findMedian"],
    approach:
      "Maintain two heaps: max-heap for lower half (negated values), min-heap for upper half. Balance sizes so they differ by at most 1. Median = average of tops (even) or top of larger heap (odd).",
    code: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []   # max-heap (store negatives)
        self.hi = []   # min-heap

    def add_num(self, num: float) -> None:
        heapq.heappush(self.lo, -num)
        if self.hi and -self.lo[0] > self.hi[0]:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def find_median(self) -> float:
        if len(self.lo) == len(self.hi):
            return (-self.lo[0] + self.hi[0]) / 2
        return -self.lo[0]`,
    language: "python",
    complexity: { time: "O(log n) per add, O(1) findMedian", space: "O(n)" },
  },
  {
    id: "fin-20260625-b1-lru-cache",
    title: "LRU Cache (Order Book Snapshot Cache)",
    difficulty: "medium",
    topics: ["hash map", "doubly linked list", "design"],
    leetcodeNumber: 146,
    problem:
      "Design an LRU cache with O(1) get and put. Finance application: cache latest order book snapshots per instrument, evicting least-recently-accessed symbols.",
    examples: [
      {
        input: "LRUCache(2): put(1,1), put(2,2), get(1)->1, put(3,3), get(2)->-1",
        output: "-1 (evicted)",
        explanation: "After put(3,3), key 2 is least recently used and evicted.",
      },
    ],
    constraints: ["1 <= capacity <= 3000", "0 <= key <= 10^4", "At most 2*10^5 get and put calls"],
    approach:
      "Doubly-linked list (most recent at head, least recent at tail) + hashmap from key to node. O(1) access via map; O(1) move-to-front via linked list pointers.",
    code: `class LRUNode:
    __slots__ = ("key", "val", "prev", "next")
    def __init__(self, key=0, val=0):
        self.key  = key; self.val  = val
        self.prev = None; self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity; self.cache = {}
        self.head = LRUNode(); self.tail = LRUNode()
        self.head.next = self.tail; self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next; node.next.prev = node.prev

    def _insert_front(self, node):
        node.next = self.head.next; node.prev = self.head
        self.head.next.prev = node; self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.cache: return -1
        node = self.cache[key]
        self._remove(node); self._insert_front(node)
        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.cache: self._remove(self.cache[key])
        node = LRUNode(key, value)
        self._insert_front(node); self.cache[key] = node
        if len(self.cache) > self.cap:
            lru = self.tail.prev
            self._remove(lru); del self.cache[lru.key]`,
    language: "python",
    complexity: { time: "O(1) get/put", space: "O(capacity)" },
  },
  {
    id: "fin-20260625-b1-max-subarray",
    title: "Maximum Subarray / Max Contiguous P&L (Kadane)",
    difficulty: "medium",
    topics: ["dynamic programming"],
    leetcodeNumber: 53,
    problem:
      "Given an array of daily P&Ls, find the contiguous subarray with the largest sum. Identifies the most profitable continuous trading period.",
    examples: [
      {
        input: "pnl = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        output: "6",
        explanation: "[4,-1,2,1] sums to 6.",
      },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    approach:
      "Kadane's algorithm: maintain current_sum = max(current, current + next). At each step decide whether to extend the window or start fresh. Track global max separately and record start/end indices.",
    code: `def max_subarray(pnl: list[int]) -> tuple[int, int, int]:
    """Returns (max_sum, start_idx, end_idx)."""
    best_sum = pnl[0]
    best_start = best_end = 0
    curr_sum   = pnl[0]
    curr_start = 0

    for i in range(1, len(pnl)):
        if curr_sum + pnl[i] < pnl[i]:
            curr_sum   = pnl[i]
            curr_start = i
        else:
            curr_sum  += pnl[i]
        if curr_sum > best_sum:
            best_sum   = curr_sum
            best_start = curr_start
            best_end   = i

    return best_sum, best_start, best_end`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260625-b1-order-book-heap",
    title: "Order Book Design with Lazy-Deletion Heap",
    difficulty: "hard",
    topics: ["heap", "hash map", "design"],
    problem:
      "Design a limit order book supporting: add_order(id, side, price, qty), cancel_order(id), get_best_bid(), get_best_ask() in O(log n) amortized. Lazy deletion skips cancelled orders at peek time.",
    examples: [
      {
        input: "add_order(1,'buy',100,50), add_order(2,'sell',101,30), get_best_bid()->100.0, cancel_order(2), get_best_ask()->None",
        output: "100.0, None",
        explanation: "Max-heap for bids (negate prices), min-heap for asks; on cancel mark order dict, skip at peek.",
      },
    ],
    constraints: ["At most 10^5 total add/cancel operations", "Prices are positive floats"],
    approach:
      "Max-heap for bids (negated prices) and min-heap for asks. Store order details in a dict. On cancel, mark as cancelled. On peek, pop heap top until an uncancelled order is found.",
    code: `import heapq
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Order:
    order_id: int
    price: float
    qty: int
    cancelled: bool = field(default=False)

class LimitOrderBook:
    def __init__(self):
        self.orders: dict[int, Order] = {}
        self.bids: list = []   # max-heap: (-price, id)
        self.asks: list = []   # min-heap: (price, id)

    def add_order(self, oid: int, side: str, price: float, qty: int):
        self.orders[oid] = Order(oid, price, qty)
        if side == "buy":
            heapq.heappush(self.bids, (-price, oid))
        else:
            heapq.heappush(self.asks, (price, oid))

    def cancel_order(self, oid: int) -> bool:
        if oid in self.orders:
            self.orders[oid].cancelled = True
            return True
        return False

    def _peek(self, heap: list, negate: bool) -> Optional[Order]:
        while heap:
            _, oid = heap[0]
            o = self.orders.get(oid)
            if o and not o.cancelled:
                return o
            heapq.heappop(heap)
        return None

    def get_best_bid(self) -> Optional[float]:
        o = self._peek(self.bids, True); return o.price if o else None

    def get_best_ask(self) -> Optional[float]:
        o = self._peek(self.asks, False); return o.price if o else None`,
    language: "python",
    complexity: { time: "O(log n) amortized per op", space: "O(n)" },
  },
  {
    id: "fin-20260625-b1-knapsack-capital",
    title: "0-1 Knapsack Capital Allocation",
    difficulty: "medium",
    topics: ["dynamic programming", "0-1 knapsack"],
    problem:
      "Given n investment opportunities each with required capital and expected return, and a total capital budget, select a subset to maximize total expected return. Each opportunity can only be taken once.",
    examples: [
      {
        input: "capital=[2,3,1,4], returns=[3,4,2,5], budget=5",
        output: "7",
        explanation: "Select index 0 (cap=2,ret=3) and index 1 (cap=3,ret=4): total cap=5, total ret=7.",
      },
    ],
    constraints: ["1 <= n <= 50", "1 <= capital[i] <= 100", "1 <= budget <= 500"],
    approach:
      "Standard 0-1 knapsack DP. dp[c] = max return using at most c capital. Iterate items; for each, iterate budget backwards (right to left) to prevent reusing the same item within one pass.",
    code: `def max_return_knapsack(capital: list[int], returns: list[int],
                          budget: int) -> tuple[int, list[int]]:
    n  = len(capital)
    dp = [0] * (budget + 1)
    choice = [[False] * (budget + 1) for _ in range(n)]

    for i in range(n):
        c_i, r_i = capital[i], returns[i]
        for c in range(budget, c_i - 1, -1):
            if dp[c - c_i] + r_i > dp[c]:
                dp[c]        = dp[c - c_i] + r_i
                choice[i][c] = True

    selected = []
    c = budget
    for i in range(n - 1, -1, -1):
        if choice[i][c]:
            selected.append(i); c -= capital[i]
    return dp[budget], list(reversed(selected))

capital = [2, 3, 1, 4, 2]
returns = [3, 4, 2, 5, 3]
best, picked = max_return_knapsack(capital, returns, budget=5)
print(f"Max return: {best}, selected: {picked}")`,
    language: "python",
    complexity: { time: "O(n * budget)", space: "O(n * budget)" },
  },
  {
    id: "fin-20260625-b1-bit-portfolio",
    title: "Bit Manipulation Portfolio Flag Operations",
    difficulty: "easy",
    topics: ["bit manipulation", "design"],
    problem:
      "Represent a portfolio of up to 64 assets as a bitmask integer. Support O(1) operations: add asset, remove asset, check holding, toggle, intersection of two portfolios, and count positions.",
    examples: [
      {
        input: "add(0), add(2), add(5) -> mask=0b100101, count() -> 3, has(2) -> True",
        output: "3, True",
        explanation: "Bit i is 1 if asset i is held. Intersection of two portfolios = bitwise AND.",
      },
    ],
    constraints: ["0 <= asset_id <= 63", "All operations in O(1)"],
    approach:
      "Each asset maps to a bit position. add = mask |= (1<<id); remove = mask &= ~(1<<id); has = bool(mask & (1<<id)); count = bin(mask).count('1'). Intersection/union via bitwise AND/OR.",
    code: `class BitPortfolio:
    def __init__(self): self.mask = 0
    def add(self, aid: int):    self.mask |= (1 << aid)
    def remove(self, aid: int): self.mask &= ~(1 << aid)
    def toggle(self, aid: int): self.mask ^= (1 << aid)
    def has(self, aid: int) -> bool: return bool(self.mask & (1 << aid))
    def count(self) -> int: return bin(self.mask).count("1")

    def intersection(self, other: "BitPortfolio") -> "BitPortfolio":
        r = BitPortfolio(); r.mask = self.mask & other.mask; return r

    def union(self, other: "BitPortfolio") -> "BitPortfolio":
        r = BitPortfolio(); r.mask = self.mask | other.mask; return r

    def assets(self) -> list[int]:
        m, idx, res = self.mask, 0, []
        while m:
            if m & 1: res.append(idx)
            m >>= 1; idx += 1
        return res

p1, p2 = BitPortfolio(), BitPortfolio()
for i in [0, 2, 5, 7]: p1.add(i)
for i in [2, 5, 9]:    p2.add(i)
print(p1.intersection(p2).assets())   # [2, 5]`,
    language: "python",
    complexity: { time: "O(1) all ops except assets() O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260625-b1-risk-budget-dp",
    title: "Risk Budget Allocation (Lagrangian Closed Form)",
    difficulty: "medium",
    topics: ["dynamic programming", "risk management", "binary search"],
    problem:
      "Given n strategies with expected returns and individual variance coefficients, and a total variance budget, find the allocation maximizing expected return subject to sum(sigma2[i] * w[i]^2) <= budget, w >= 0, sum(w) <= 1.",
    examples: [
      {
        input: "mu=[0.10,0.12,0.08], sigma2=[0.04,0.06,0.03], budget=0.02",
        output: "Optimal weights: w proportional to mu[i]/sigma2[i] rescaled to fit budget",
        explanation: "Lagrangian optimum: w[i] = mu[i] / (2*lambda*sigma2[i]). Binary search for lambda that satisfies risk == budget.",
      },
    ],
    constraints: ["1 <= n <= 100", "mu[i] > 0", "sigma2[i] > 0", "budget > 0"],
    approach:
      "Unconstrained KKT gives w[i] = max(0, mu[i]/(2*lambda*sigma2[i])). Binary search over lambda in [epsilon, big] to satisfy the risk constraint with equality. Normalize if sum(w) > 1.",
    code: `import numpy as np
from scipy.optimize import brentq

def risk_budget_alloc(mu: np.ndarray, sigma2: np.ndarray,
                       budget: float) -> np.ndarray:
    def total_risk(lam):
        w = np.maximum(mu / (2 * lam * sigma2), 0)
        if w.sum() > 1: w /= w.sum()
        return float(w @ (sigma2 * w))

    lam = brentq(lambda l: total_risk(l) - budget, 1e-6, 1e6)
    w   = np.maximum(mu / (2 * lam * sigma2), 0)
    if w.sum() > 1: w /= w.sum()
    return w

mu     = np.array([0.10, 0.12, 0.08, 0.15, 0.09])
sigma2 = np.array([0.04, 0.06, 0.03, 0.09, 0.025])
w = risk_budget_alloc(mu, sigma2, budget=0.02)
print(f"Weights: {w.round(4)}")
print(f"Risk:    {(w @ (sigma2 * w)):.5f}")
print(f"Return:  {(w @ mu):.4%}")`,
    language: "python",
    complexity: { time: "O(n log(1/eps))", space: "O(n)" },
  },
];
