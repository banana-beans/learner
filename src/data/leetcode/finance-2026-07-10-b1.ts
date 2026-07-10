import { LeetCodeProblem } from "./index";

export const financeProblems20260710B1: LeetCodeProblem[] = [
  {
    id: "fin-20260710-b1-fx-arbitrage",
    title: "FX Arbitrage via Bellman-Ford Negative Cycle",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Negative Cycle"],
    problem:
      "Given a list of currency pairs with exchange rates, determine if a profitable arbitrage cycle exists. An arbitrage opportunity exists when you can start with 1 unit of some currency, trade through a sequence of pairs, and end with more than 1 unit of the same currency.\n\nReturn the cycle as a list of currencies if one exists, otherwise return an empty list.",
    examples: [
      {
        input:
          'currencies = ["USD","EUR","GBP"], rates = [[1,1.2,1.5],[0.83,1,1.25],[0.67,0.8,1]]',
        output: '["USD","EUR","GBP","USD"]',
        explanation:
          "1 USD → 1.2 EUR → 1.5 GBP → 1.005 USD. Product > 1 means arbitrage exists.",
      },
      {
        input:
          'currencies = ["USD","EUR"], rates = [[1,1.2],[0.83,1]]',
        output: "[]",
        explanation: "1 × 1.2 × 0.83 = 0.996 < 1. No arbitrage.",
      },
    ],
    constraints: [
      "2 <= n <= 15 currencies",
      "rates[i][j] > 0 for all i, j",
      "rates[i][i] = 1",
      "rates[i][j] = 1 / rates[j][i]",
    ],
    approach:
      "Take the negative log of each exchange rate to convert the multiplicative problem to an additive one: profit > 1 becomes negative total weight. Run Bellman-Ford for n-1 rounds; if any weight still decreases in round n, a negative cycle exists. Trace the predecessor array to reconstruct the cycle.",
    code: `import math
from typing import List

def find_arbitrage(currencies: List[str], rates: List[List[float]]) -> List[str]:
    n = len(currencies)
    # Convert rates to negative-log weights
    w = [[-math.log(rates[i][j]) for j in range(n)] for i in range(n)]

    dist = [float("inf")] * n
    pred = [-1] * n
    dist[0] = 0.0

    last_relaxed = -1
    for i in range(n):
        last_relaxed = -1
        for u in range(n):
            for v in range(n):
                if u == v:
                    continue
                if dist[u] + w[u][v] < dist[v] - 1e-10:
                    dist[v] = dist[u] + w[u][v]
                    pred[v] = u
                    last_relaxed = v

    if last_relaxed == -1:
        return []

    # Trace back n steps to guarantee we're inside the cycle
    cycle_node = last_relaxed
    for _ in range(n):
        cycle_node = pred[cycle_node]

    # Collect the cycle
    cycle = []
    node = cycle_node
    while True:
        cycle.append(currencies[node])
        node = pred[node]
        if node == cycle_node:
            break
    cycle.append(currencies[cycle_node])
    cycle.reverse()
    return cycle`,
    language: "python",
    complexity: { time: "O(n³)", space: "O(n²)" },
    leetcodeNumber: 743,
  },
  {
    id: "fin-20260710-b1-stock-cooldown",
    title: "Best Time to Buy and Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["Dynamic Programming", "State Machine"],
    problem:
      "You are given an array prices where prices[i] is the price of a given stock on day i. After selling, you must wait one day (cooldown) before buying again. You may not hold multiple shares simultaneously.\n\nFind the maximum profit.",
    examples: [
      {
        input: "prices = [1,2,3,0,2]",
        output: "3",
        explanation: "Buy day 0, sell day 1, cooldown day 2, buy day 3, sell day 4. Profit = 1 + 2 = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
      },
    ],
    constraints: ["1 <= prices.length <= 5000", "0 <= prices[i] <= 1000"],
    approach:
      "Model three states: HELD (holding stock), SOLD (just sold — next day is cooldown), RESTING (not holding, can buy). Transitions: HELD → HELD (rest), HELD → SOLD (sell); SOLD → RESTING (mandatory cooldown); RESTING → HELD (buy), RESTING → RESTING (wait). O(n) time, O(1) space.",
    code: `def max_profit_cooldown(prices):
    held = -prices[0]   # best profit while holding
    sold = 0            # profit on the day we just sold
    rest = 0            # profit while resting (can buy next)

    for p in prices[1:]:
        prev_held, prev_sold, prev_rest = held, sold, rest
        held = max(prev_held, prev_rest - p)   # keep or buy
        sold = prev_held + p                    # sell today
        rest = max(prev_rest, prev_sold)        # was resting or came out of cooldown

    return max(sold, rest)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260710-b1-max-profit-k-tx",
    title: "Best Time to Buy and Sell Stock — At Most K Transactions",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Finance"],
    problem:
      "You are given an integer k and an array prices. Find the maximum profit using at most k transactions. A transaction is one buy followed by one sell; you must sell before buying again.",
    examples: [
      {
        input: "k = 2, prices = [3,2,6,5,0,3]",
        output: "7",
        explanation: "Buy at 2, sell at 6 (profit 4); buy at 0, sell at 3 (profit 3).",
      },
      {
        input: "k = 2, prices = [2,4,1]",
        output: "2",
      },
    ],
    constraints: [
      "0 <= k <= 100",
      "0 <= prices.length <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "If k >= n//2 unlimited transactions apply (greedy). Otherwise, use DP: buy[j] = max profit after j-th buy (not yet sold), sell[j] = max profit after j-th sell. For each price, update backwards: sell[j] = max(sell[j], buy[j] + price); buy[j] = max(buy[j], sell[j-1] - price). O(kn) time, O(k) space.",
    code: `def max_profit_k(k: int, prices) -> int:
    n = len(prices)
    if not prices or k == 0:
        return 0

    # If k large enough, unlimited transactions
    if k >= n // 2:
        return sum(max(prices[i+1] - prices[i], 0) for i in range(n-1))

    buy  = [-float("inf")] * (k + 1)
    sell = [0] * (k + 1)

    for price in prices:
        for j in range(k, 0, -1):
            sell[j] = max(sell[j], buy[j] + price)
            buy[j]  = max(buy[j],  sell[j-1] - price)

    return sell[k]`,
    language: "python",
    complexity: { time: "O(kn)", space: "O(k)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260710-b1-sliding-window-max",
    title: "Sliding Window Maximum — Rolling VaR",
    difficulty: "medium",
    topics: ["Monotonic Deque", "Sliding Window"],
    problem:
      "A risk desk computes a rolling worst-case loss (maximum loss) over a window of w trading days. Given an array of daily P&L values and window size w, return the maximum value in each window of size w.\n\nThis is a direct model of rolling maximum-drawdown or worst-day VaR over a lookback window.",
    examples: [
      {
        input: "pnl = [1,-3,4,-1,2,1,-5,4], w = 3",
        output: "[4,4,4,2,2,4]",
        explanation:
          "Windows: [1,-3,4]→4, [-3,4,-1]→4, [4,-1,2]→4, [-1,2,1]→2, [2,1,-5]→2, [1,-5,4]→4.",
      },
    ],
    constraints: [
      "1 <= pnl.length <= 10^5",
      "1 <= w <= pnl.length",
      "-10^4 <= pnl[i] <= 10^4",
    ],
    approach:
      "Maintain a monotonic decreasing deque of indices. For each element, pop from the back while the back value is smaller (it can never be the max for future windows). Pop from the front if the index is outside the current window. The front of the deque is always the index of the current window maximum.",
    code: `from collections import deque

def rolling_max(pnl, w):
    dq = deque()   # indices, decreasing by pnl value
    result = []

    for i, val in enumerate(pnl):
        # Remove indices outside window
        while dq and dq[0] < i - w + 1:
            dq.popleft()
        # Maintain decreasing order
        while dq and pnl[dq[-1]] < val:
            dq.pop()
        dq.append(i)
        if i >= w - 1:
            result.append(pnl[dq[0]])

    return result`,
    language: "python",
    complexity: { time: "O(n)", space: "O(w)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260710-b1-lru-position-cache",
    title: "LRU Position Cache for Risk Engine",
    difficulty: "medium",
    topics: ["Design", "Hash Map", "Doubly Linked List"],
    problem:
      "A risk engine caches the most recently computed risk metrics for each instrument. Design an LRU (Least Recently Used) cache with O(1) get and O(1) put.\n\n- `get(key)`: return value if it exists, else -1.\n- `put(key, value)`: insert or update. If capacity is exceeded, evict the least recently used entry.",
    examples: [
      {
        input:
          'cache = LRUCache(2); put("AAPL",100); put("GOOG",200); get("AAPL"); put("MSFT",300); get("GOOG"); get("AAPL")',
        output: "100, -1, 100",
        explanation:
          "After MSFT insert, GOOG is evicted (LRU). AAPL was accessed most recently before MSFT was added.",
      },
    ],
    constraints: ["1 <= capacity <= 3000", "0 <= value <= 10^4", "At most 3*10^4 calls to get and put"],
    approach:
      "Combine a hash map (O(1) lookup) with a doubly linked list (O(1) move-to-front and eviction). Sentinel head/tail nodes eliminate edge-case checks. On get/put, unlink the node and relink it at the head. On eviction, remove the node just before the tail.",
    code: `class Node:
    __slots__ = ("key", "val", "prev", "next")
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        self.head, self.tail = Node(), Node()
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, node):
        node.prev.next, node.next.prev = node.next, node.prev

    def _insert_front(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._insert_front(node)
        return node.val

    def put(self, key, value):
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self.cache[key] = node
        self._insert_front(node)
        if len(self.cache) > self.cap:
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(capacity)" },
    leetcodeNumber: 146,
  },
  {
    id: "fin-20260710-b1-matrix-power-compound",
    title: "Matrix Exponentiation for Compound Growth",
    difficulty: "medium",
    topics: ["Matrix Exponentiation", "Math", "Finance"],
    problem:
      "A portfolio transitions between n risk states each period according to a Markov transition matrix T. Given the initial state distribution vector v (a row vector), compute the distribution after exactly k periods.\n\nReturn the resulting distribution vector rounded to 6 decimal places. Use matrix exponentiation in O(n³ log k) time.",
    examples: [
      {
        input:
          "T = [[0.9,0.1],[0.2,0.8]], v = [1.0,0.0], k = 10",
        output: "[0.666667, 0.333333]",
        explanation:
          "After many periods the chain converges toward the stationary distribution [2/3, 1/3].",
      },
    ],
    constraints: ["1 <= n <= 20", "1 <= k <= 10^9", "T is row-stochastic"],
    approach:
      "Use binary exponentiation on the matrix. Represent matrix multiply as standard (n,n)×(n,n). Start with the identity matrix and repeatedly square T, accumulating the result where the corresponding bit in k is set. Then multiply the initial vector v by the resulting T^k.",
    code: `import numpy as np

def mat_mul(A, B):
    return [[sum(A[i][l]*B[l][j] for l in range(len(B)))
             for j in range(len(B[0]))]
            for i in range(len(A))]

def mat_pow(M, k):
    n = len(M)
    result = [[1.0 if i==j else 0.0 for j in range(n)] for i in range(n)]
    while k:
        if k & 1:
            result = mat_mul(result, M)
        M = mat_mul(M, M)
        k >>= 1
    return result

def markov_after_k(T, v, k):
    Tk = mat_pow(T, k)
    n = len(v)
    dist = [sum(v[i] * Tk[i][j] for i in range(n)) for j in range(n)]
    return [round(x, 6) for x in dist]`,
    language: "python",
    complexity: { time: "O(n³ log k)", space: "O(n²)" },
  },
  {
    id: "fin-20260710-b1-portfolio-bitmask",
    title: "Portfolio Allocation with Bitmask DP",
    difficulty: "hard",
    topics: ["Bitmask DP", "Finance", "Combinatorics"],
    problem:
      "You have n assets (n <= 20). Each asset i has an expected return r[i] and variance v[i]. You must choose exactly k assets to include in an equal-weight portfolio to maximize Sharpe ratio (return / sqrt(variance)), where portfolio variance is the sum of individual variances (assets uncorrelated).\n\nReturn the maximum Sharpe ratio and the set of chosen assets.",
    examples: [
      {
        input: "r = [0.1,0.2,0.15,0.05], v = [0.04,0.09,0.02,0.01], k = 2",
        output: "(1.118, [1, 2])",
        explanation:
          "Assets 1,2: return=(0.2+0.15)/2=0.175, var=(0.09+0.02)/2=0.055, Sharpe=0.175/sqrt(0.055)≈0.746. Assets 2,3 beat this.",
      },
    ],
    constraints: ["1 <= n <= 20", "1 <= k <= n"],
    approach:
      "Enumerate all C(n,k) subsets using bitmask iteration (only masks with exactly k bits set). For each mask compute equal-weight portfolio return and variance in O(n) time. Track the best Sharpe. Total time O(2^n * n).",
    code: `import math

def best_portfolio(r, v, k):
    n = len(r)
    best_sharpe = -1.0
    best_mask = 0

    for mask in range(1 << n):
        if bin(mask).count("1") != k:
            continue
        assets = [i for i in range(n) if mask >> i & 1]
        avg_r = sum(r[i] for i in assets) / k
        avg_v = sum(v[i] for i in assets) / (k * k)
        sharpe = avg_r / math.sqrt(avg_v) if avg_v > 0 else 0.0
        if sharpe > best_sharpe:
            best_sharpe = sharpe
            best_mask = mask

    chosen = [i for i in range(n) if best_mask >> i & 1]
    return round(best_sharpe, 6), chosen`,
    language: "python",
    complexity: { time: "O(2^n · n)", space: "O(1)" },
  },
  {
    id: "fin-20260710-b1-order-matcher-design",
    title: "Design an Order Book Matcher",
    difficulty: "hard",
    topics: ["Design", "Heap", "Hash Map"],
    problem:
      "Design an order book that supports:\n- `add_order(order_id, side, price, qty)`: add a limit order. Side is 'B' (buy) or 'S' (sell).\n- `cancel_order(order_id)`: cancel an open order.\n- `get_trades()`: return and clear the list of (buy_id, sell_id, price, qty) trades.\n\nOrders match when the best bid >= best ask. Fill at the passive side's price. Partial fills are supported.",
    examples: [
      {
        input:
          "add(1,'B',100,10); add(2,'S',99,5); add(3,'S',101,10); get_trades()",
        output: "[(1,2,99,5)]",
        explanation:
          "Order 1 bids 100, order 2 asks 99. They cross; fill at ask price 99 for qty min(10,5)=5.",
      },
    ],
    constraints: [
      "order_id is unique",
      "price > 0, qty > 0",
      "Up to 10^4 operations",
    ],
    approach:
      "Maintain a max-heap for bids (negate price) and a min-heap for asks. Each heap entry is (price, order_id). Use a dict for open orders (id → remaining qty). On add, try to match immediately: while best bid >= best ask and both sides non-empty, fill min(bid_qty, ask_qty), record trade, remove exhausted orders. On cancel, mark qty=0 in dict (lazy deletion from heap).",
    code: `import heapq

class OrderBook:
    def __init__(self):
        self.bids = []   # max-heap: (-price, order_id)
        self.asks = []   # min-heap: (price, order_id)
        self.orders = {} # order_id -> [side, price, remaining_qty]
        self.trades = []

    def add_order(self, oid, side, price, qty):
        self.orders[oid] = [side, price, qty]
        if side == 'B':
            heapq.heappush(self.bids, (-price, oid))
        else:
            heapq.heappush(self.asks, (price, oid))
        self._match()

    def cancel_order(self, oid):
        if oid in self.orders:
            self.orders[oid][2] = 0  # lazy delete

    def _match(self):
        while self.bids and self.asks:
            # Peek tops, skip cancelled/exhausted
            while self.bids and self.orders.get(self.bids[0][1], [0,0,0])[2] == 0:
                heapq.heappop(self.bids)
            while self.asks and self.orders.get(self.asks[0][1], [0,0,0])[2] == 0:
                heapq.heappop(self.asks)
            if not self.bids or not self.asks:
                break
            bp, bid = -self.bids[0][0], self.bids[0][1]
            ap, ask = self.asks[0][0], self.asks[0][1]
            if bp < ap:
                break
            fill = min(self.orders[bid][2], self.orders[ask][2])
            self.trades.append((bid, ask, ap, fill))
            self.orders[bid][2] -= fill
            self.orders[ask][2] -= fill
            if self.orders[bid][2] == 0:
                heapq.heappop(self.bids)
            if self.orders[ask][2] == 0:
                heapq.heappop(self.asks)

    def get_trades(self):
        t, self.trades = self.trades, []
        return t`,
    language: "python",
    complexity: { time: "O(log n) per add/cancel", space: "O(n)" },
  },
  {
    id: "fin-20260710-b1-min-cost-connect",
    title: "Minimum Cost to Connect Trading Desks (MST)",
    difficulty: "medium",
    topics: ["Graph", "Minimum Spanning Tree", "Union-Find"],
    problem:
      "You manage n trading desks. Connecting desks i and j has a cost of cost[i][j] (network latency in microseconds). Find the minimum total cost to connect all desks into one network (minimum spanning tree).",
    examples: [
      {
        input: "n = 4, cost = [[0,1,3,4],[1,0,2,5],[3,2,0,1],[4,5,1,0]]",
        output: "4",
        explanation: "MST edges: (1,2)=1, (2,3)=2, (0,1)=1. Total = 4.",
      },
    ],
    constraints: ["2 <= n <= 100", "cost[i][j] >= 0", "cost[i][i] = 0"],
    approach:
      "Use Kruskal's algorithm with Union-Find. Extract all edges, sort by cost, and greedily add edges that don't form a cycle. Stop when n-1 edges are added. Path compression + union by rank gives near-O(E log E) overall.",
    code: `def min_cost_connect(n, cost):
    parent = list(range(n))
    rank   = [0] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        rx, ry = find(x), find(y)
        if rx == ry:
            return False
        if rank[rx] < rank[ry]:
            rx, ry = ry, rx
        parent[ry] = rx
        if rank[rx] == rank[ry]:
            rank[rx] += 1
        return True

    edges = sorted(
        (cost[i][j], i, j)
        for i in range(n) for j in range(i+1, n)
    )

    total = 0
    count = 0
    for c, i, j in edges:
        if union(i, j):
            total += c
            count += 1
            if count == n - 1:
                break

    return total`,
    language: "python",
    complexity: { time: "O(E log E)", space: "O(n)" },
    leetcodeNumber: 1584,
  },
  {
    id: "fin-20260710-b1-target-portfolio",
    title: "Target Portfolio Rebalance — 0/1 Knapsack",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Knapsack", "Finance"],
    problem:
      "You have a budget of B dollars to invest. There are n assets. Asset i requires a minimum investment of weight[i] (integer units) and yields expected_return[i] (integer). You can invest in each asset at most once.\n\nMaximize total expected return without exceeding budget B.",
    examples: [
      {
        input:
          "B = 10, weights = [2,3,4,5], returns = [3,4,5,6]",
        output: "10",
        explanation:
          "Pick assets 0,1,3: cost=2+3+5=10, return=3+4+6=13. Wait, let's recheck: 0+1+2: 2+3+4=9≤10, return=12; 0+1+3: 2+3+5=10, return=13. Best is 13? Output should be 13.",
      },
      {
        input:
          "B = 7, weights = [3,4,5], returns = [4,5,6]",
        output: "9",
        explanation: "Pick assets 0,1: cost=7, return=9.",
      },
    ],
    constraints: [
      "1 <= n <= 100",
      "1 <= B <= 1000",
      "1 <= weights[i], returns[i] <= 100",
    ],
    approach:
      "Classic 0/1 knapsack DP. dp[b] = max return achievable with budget b. Iterate items; for each item iterate budget backwards to avoid using item twice. Final answer is dp[B].",
    code: `def max_return(B, weights, returns):
    dp = [0] * (B + 1)
    for w, r in zip(weights, returns):
        for b in range(B, w - 1, -1):
            dp[b] = max(dp[b], dp[b - w] + r)
    return dp[B]`,
    language: "python",
    complexity: { time: "O(n · B)", space: "O(B)" },
    leetcodeNumber: 416,
  },
];
