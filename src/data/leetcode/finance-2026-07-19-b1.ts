import { LeetCodeProblem } from "./index";

export const financeProblems20260719B1: LeetCodeProblem[] = [
  {
    id: "fin-20260719-b1-bellman-ford-fx",
    title: "FX Arbitrage Detection via Bellman-Ford (Negative Cycle)",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Negative Cycle", "Finance"],
    problem: `You are given an n x n matrix rates where rates[i][j] is the exchange rate from currency i to currency j. Detect whether a sequence of currency exchanges exists that starts and ends at the same currency and returns more money than it started with (i.e., a profitable arbitrage cycle exists). Return true if arbitrage exists, false otherwise.

Currency i to j to k can be composed: rates[i][j] * rates[j][k]. A cycle is profitable if the product of its exchange rates is > 1.`,
    examples: [
      {
        input: `rates = [[1, 0.5, 2], [2, 1, 3], [0.5, 0.33, 1]]`,
        output: `true`,
        explanation: `Currency 0 → 2 → 1 → 0: 2 * 0.33 * 2 = 1.32 > 1, so arbitrage exists.`,
      },
      {
        input: `rates = [[1, 1, 1], [1, 1, 1], [1, 1, 1]]`,
        output: `false`,
        explanation: `All rates are 1, no profit possible.`,
      },
    ],
    constraints: [
      "n == rates.length == rates[i].length",
      "1 <= n <= 100",
      "0 < rates[i][j] <= 100",
      "rates[i][i] == 1",
    ],
    approach: `Transform to shortest-path: take negative log of each rate. A profitable cycle corresponds to a negative-weight cycle in the log-transformed graph. Run Bellman-Ford from a virtual source connected to all nodes with 0-weight edges. If any distance can still be relaxed after n-1 iterations, a negative cycle (arbitrage) exists.

Key insight: log(r1 * r2 * ... * rk) > 0 ⟺ sum(-log(ri)) < 0 ⟺ negative cycle in the transformed graph.
Time: O(n^3), Space: O(n^2).`,
    code: `def find_arbitrage(rates: list[list[float]]) -> bool:
    import math
    n = len(rates)
    # Build log-weight graph: w[i][j] = -log(rates[i][j])
    # Profit cycle iff negative-weight cycle
    INF = float("inf")
    dist = [INF] * n

    # Virtual source: add node n with 0-weight edges to all currencies
    dist = [0.0] * n   # start relaxation from all nodes simultaneously

    edges = []
    for i in range(n):
        for j in range(n):
            if i != j and rates[i][j] > 0:
                edges.append((i, j, -math.log(rates[i][j])))

    # Bellman-Ford: n-1 relaxation rounds
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # nth round: if any relaxation happens, negative cycle exists
    for u, v, w in edges:
        if dist[u] + w < dist[v] - 1e-9:
            return True
    return False

# Test
rates1 = [[1, 0.5, 2], [2, 1, 3], [0.5, 0.33, 1]]
print(find_arbitrage(rates1))   # True

rates2 = [[1, 2, 4], [0.5, 1, 2], [0.25, 0.5, 1]]
print(find_arbitrage(rates2))   # False (consistent rates, no arb)`,
    language: "python",
    complexity: { time: "O(n^3)", space: "O(n^2)" },
    leetcodeNumber: 399,
  },
  {
    id: "fin-20260719-b1-sliding-window-max",
    title: "Sliding Window Maximum (Rolling High-Water Mark)",
    difficulty: "hard",
    topics: ["Deque", "Monotonic Queue", "Sliding Window", "Finance"],
    problem: `Given an integer array prices and an integer k, return an array of the maximum value in each sliding window of size k as it moves left to right across the array.

In finance this models the rolling k-day high-water mark for drawdown calculation. Return the array of maximums.`,
    examples: [
      {
        input: `prices = [1,3,-1,-3,5,3,6,7], k = 3`,
        output: `[3,3,5,5,6,7]`,
        explanation: `Window [1,3,-1]→3, [3,-1,-3]→3, [-1,-3,5]→5, [-3,5,3]→5, [5,3,6]→6, [3,6,7]→7.`,
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "-10^4 <= prices[i] <= 10^4",
      "1 <= k <= prices.length",
    ],
    approach: `Use a monotonic deque (decreasing) that stores indices. For each element:
1. Pop from the front if that index is outside the window (index <= i - k).
2. Pop from the back while the back element is <= current (monotone decreasing).
3. Push current index.
4. The front of the deque is always the index of the window maximum.

Time: O(n) — each element is pushed and popped at most once. Space: O(k).`,
    code: `from collections import deque

def max_sliding_window(prices: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()   # stores indices, front = max
    result = []

    for i, p in enumerate(prices):
        # Remove indices that fell out of the window
        while dq and dq[0] <= i - k:
            dq.popleft()
        # Maintain decreasing monotone invariant
        while dq and prices[dq[-1]] <= p:
            dq.pop()
        dq.append(i)
        # Window is full starting at i == k-1
        if i >= k - 1:
            result.append(prices[dq[0]])

    return result

prices = [1, 3, -1, -3, 5, 3, 6, 7]
print(max_sliding_window(prices, 3))  # [3, 3, 5, 5, 6, 7]

# Finance use: rolling 20-day high-water mark
import random
random.seed(42)
nav = [100 + random.gauss(0, 2) for _ in range(100)]
hwm = max_sliding_window([int(x * 100) for x in nav], 20)
print(f"20-day HWM range: {min(hwm)/100:.2f} – {max(hwm)/100:.2f}")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260719-b1-k-transactions-dp",
    title: "Best Time to Buy/Sell Stock with At Most K Transactions",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Finance", "Array"],
    problem: `Given an integer array prices and an integer k, find the maximum profit you can achieve. You may complete at most k transactions (each transaction = one buy + one sell). You must sell before you buy again. You may not hold more than one share at a time.`,
    examples: [
      {
        input: `prices = [3,2,6,5,0,3], k = 2`,
        output: `7`,
        explanation: `Buy at 2, sell at 6 (profit 4). Buy at 0, sell at 3 (profit 3). Total 7.`,
      },
      {
        input: `prices = [2,4,1], k = 1`,
        output: `2`,
        explanation: `Buy at 2, sell at 4.`,
      },
    ],
    constraints: [
      "1 <= k <= 100",
      "1 <= prices.length <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach: `DP state: dp[j][0/1] = max profit using at most j transactions, currently not-holding (0) or holding (1).

For each price:
  dp[j][0] = max(dp[j][0], dp[j][1] + price)   # sell
  dp[j][1] = max(dp[j][1], dp[j-1][0] - price)  # buy (uses one transaction slot)

If k >= n//2, unlimited transactions (greedy: sum all up-moves).
Iterate transactions outer loop, prices inner loop in-place.
Time: O(n*k), Space: O(k).`,
    code: `def max_profit_k(k: int, prices: list[int]) -> int:
    n = len(prices)
    if n < 2:
        return 0

    # If k is very large, effectively unlimited transactions
    if k >= n // 2:
        return sum(max(prices[i] - prices[i-1], 0) for i in range(1, n))

    # dp[j] = (max_profit_not_holding, max_profit_holding) with j transactions used
    NOT_HOLD, HOLD = 0, 1
    dp = [[0, -float("inf")] for _ in range(k + 1)]

    for price in prices:
        # Iterate j in reverse to avoid using updated values in same pass
        for j in range(k, 0, -1):
            dp[j][NOT_HOLD] = max(dp[j][NOT_HOLD], dp[j][HOLD] + price)
            dp[j][HOLD]     = max(dp[j][HOLD],     dp[j-1][NOT_HOLD] - price)

    return dp[k][NOT_HOLD]

print(max_profit_k(2, [3,2,6,5,0,3]))   # 7
print(max_profit_k(1, [2,4,1]))          # 2
print(max_profit_k(2, [1,2,3,4,5]))      # 4 (or 4 with 2 optimal trades)

# Finance framing: k = max number of round-trips allowed in a quarter
prices = [100, 102, 98, 105, 103, 110, 107, 115]
print(f"Max P&L with 3 round-trips: {max_profit_k(3, prices)}")`,
    language: "python",
    complexity: { time: "O(n*k)", space: "O(k)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260719-b1-next-greater-element",
    title: "Next Greater Price (Monotonic Stack)",
    difficulty: "medium",
    topics: ["Stack", "Monotonic Stack", "Array", "Finance"],
    problem: `Given an array prices of daily closing prices (circular, i.e., the array wraps around), for each day find the price of the next day where the stock is higher than today's close. If no such day exists in the next full cycle, return -1 for that day.

This models finding the next resistance level or the next day a stop-loss would be triggered.`,
    examples: [
      {
        input: `prices = [3, 1, 2, 4]`,
        output: `[4, 2, 4, -1]`,
        explanation: `3→4 (future day), 1→2, 2→4, 4 never higher again.`,
      },
      {
        input: `prices = [5, 4, 3, 2, 1]`,
        output: `[-1, -1, -1, -1, -1]`,
        explanation: `Strictly decreasing, no next greater.`,
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^4",
      "0 <= prices[i] <= 10^4",
    ],
    approach: `Use a monotonic decreasing stack. Iterate 2n times (modular index) to simulate the circular wrap:
- When current price > price at index on top of stack, pop and record current price as the "next greater" for that index.
- Push current index onto the stack.
- Indices remaining in the stack after the pass have no next greater → answer is -1.

Time: O(n), Space: O(n).`,
    code: `def next_greater_circular(prices: list[int]) -> list[int]:
    n = len(prices)
    result = [-1] * n
    stack: list[int] = []   # monotonic decreasing stack of indices

    for i in range(2 * n):
        idx = i % n
        while stack and prices[stack[-1]] < prices[idx]:
            popped = stack.pop()
            result[popped] = prices[idx]
        # Only push actual indices in first pass to avoid duplicates
        if i < n:
            stack.append(idx)

    return result

print(next_greater_circular([3, 1, 2, 4]))     # [4, 2, 4, -1]
print(next_greater_circular([5, 4, 3, 2, 1]))  # [-1, -1, -1, -1, -1]
print(next_greater_circular([1, 2, 1]))         # [2, -1, 2]

# Finance: next day where price exceeds today (rolling 252-day window)
prices = [100, 98, 101, 103, 99, 104, 102]
resistance = next_greater_circular(prices)
print("Next resistance levels:", resistance)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 503,
  },
  {
    id: "fin-20260719-b1-knapsack-portfolio",
    title: "0/1 Knapsack for Discrete Capital Allocation",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Knapsack", "Finance"],
    problem: `You have a capital budget B (integer, in units of $1000) and n investment opportunities. Each opportunity i requires capital[i] units and yields expected_return[i]. You may invest in each opportunity at most once. Find the maximum total expected return subject to the total capital not exceeding B.

This models discrete project selection in private equity / VC allocation.`,
    examples: [
      {
        input: `B = 10, capital = [3, 4, 5, 6], expected_return = [4, 5, 6, 7]`,
        output: `11`,
        explanation: `Invest in projects 0 (cost 3, ret 4) and 2 (cost 5, ret 6): total cost 8 ≤ 10, return 10. Or projects 1+2: cost 9, ret 11. Best: 11.`,
      },
    ],
    constraints: [
      "1 <= n <= 100",
      "1 <= B <= 1000",
      "1 <= capital[i] <= B",
      "1 <= expected_return[i] <= 1000",
    ],
    approach: `Classic 0/1 knapsack DP: dp[b] = max total return using exactly budget b.

For each item i, iterate budget b from B down to capital[i] (reverse to avoid reusing same item):
  dp[b] = max(dp[b], dp[b - capital[i]] + expected_return[i])

Answer: max(dp).
Time: O(n * B), Space: O(B).`,
    code: `def max_portfolio_return(B: int, capital: list[int], ret: list[int]) -> int:
    n = len(capital)
    dp = [0] * (B + 1)   # dp[b] = best return with budget b

    for i in range(n):
        # Reverse iteration: each project selected at most once
        for b in range(B, capital[i] - 1, -1):
            dp[b] = max(dp[b], dp[b - capital[i]] + ret[i])

    return max(dp)

B = 10
capital = [3, 4, 5, 6]
expected_return = [4, 5, 6, 7]
print(max_portfolio_return(B, capital, expected_return))  # 11

# With tracking: reconstruct which projects to fund
def knapsack_with_choices(B, capital, ret):
    n = len(capital)
    dp = [[0] * (B + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for b in range(B + 1):
            dp[i][b] = dp[i-1][b]
            if b >= capital[i-1]:
                dp[i][b] = max(dp[i][b], dp[i-1][b-capital[i-1]] + ret[i-1])
    # Backtrack
    b, chosen = B, []
    for i in range(n, 0, -1):
        if dp[i][b] != dp[i-1][b]:
            chosen.append(i-1)
            b -= capital[i-1]
    return dp[n][B], chosen[::-1]

total, projects = knapsack_with_choices(B, capital, expected_return)
print(f"Return: {total}, Projects: {projects}")`,
    language: "python",
    complexity: { time: "O(n*B)", space: "O(n*B)" },
  },
  {
    id: "fin-20260719-b1-markov-dp",
    title: "Markov Chain Absorption Probability (DP on Probability Graph)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Graph", "Probability", "Finance"],
    problem: `A portfolio can be in one of n states (states 0..n-1). States 0 and n-1 are absorbing: state 0 means bankruptcy, state n-1 means target profit achieved. From state i (1 <= i <= n-2) the portfolio moves to state i+1 with probability p[i] and to state i-1 with probability 1-p[i] at each time step. Given your starting state s, compute the probability of eventually reaching state n-1 (target) before state 0 (ruin).

This is the Gambler's Ruin generalised to non-uniform probabilities.`,
    examples: [
      {
        input: `n = 5, p = [0, 0.6, 0.55, 0.5, 0], s = 2`,
        output: `0.5984`,
        explanation: `States 0 and 4 are absorbing. From state 2, probability of reaching state 4 ≈ 0.5984.`,
      },
    ],
    constraints: [
      "3 <= n <= 100",
      "0 < p[i] < 1 for 1 <= i <= n-2",
      "p[0] = p[n-1] = 0 (absorbing)",
      "1 <= s <= n-2",
    ],
    approach: `Let prob[i] = probability of absorption into state n-1 starting from state i.
Boundary: prob[0] = 0, prob[n-1] = 1.
Linear recurrence: prob[i] = p[i] * prob[i+1] + (1-p[i]) * prob[i-1].

Solve iteratively (value iteration converges since the chain is absorbing):
Initialise prob[0]=0, prob[n-1]=1, others=0.5.
Repeat until convergence: prob[i] = p[i]*prob[i+1] + (1-p[i])*prob[i-1].
Time: O(n * iters), Space: O(n).`,
    code: `def absorption_probability(n: int, p: list[float], s: int) -> float:
    # Value iteration: solve linear system iteratively
    prob = [0.5] * n
    prob[0]   = 0.0   # ruin absorbing state
    prob[n-1] = 1.0   # target absorbing state

    for _ in range(10_000):
        max_change = 0.0
        new_prob = prob[:]
        for i in range(1, n - 1):
            new_val = p[i] * prob[i + 1] + (1 - p[i]) * prob[i - 1]
            max_change = max(max_change, abs(new_val - prob[i]))
            new_prob[i] = new_val
        prob = new_prob
        if max_change < 1e-9:
            break

    return prob[s]

# Example: fair random walk (p=0.5 everywhere) -> prob(reach n-1 before 0) = s/(n-1)
n = 5
p_uniform = [0, 0.5, 0.5, 0.5, 0]
for s in range(1, n - 1):
    res = absorption_probability(n, p_uniform, s)
    print(f"  s={s}: P(target) = {res:.4f}  (expected {s/(n-1):.4f})")

# Finance: edge (p=0.6)
p_edge = [0, 0.6, 0.55, 0.5, 0]
print(f"\\nWith edge, from state 2: {absorption_probability(5, p_edge, 2):.4f}")`,
    language: "python",
    complexity: { time: "O(n * iterations)", space: "O(n)" },
  },
  {
    id: "fin-20260719-b1-bit-position-flags",
    title: "Portfolio Position Flags via Bit Manipulation",
    difficulty: "easy",
    topics: ["Bit Manipulation", "Design", "Finance"],
    problem: `Design a compact portfolio position tracker for n assets (n <= 30) using a single 32-bit integer as a bitmask. Implement the following operations in O(1):
- open(i): set position i to 'long'
- close(i): clear position i
- is_long(i): return true if position i is open
- flip(i): toggle position i
- count_open(): return total number of open positions
- sector_exposure(mask): return number of positions open that overlap with sector bitmask

Each position corresponds to one bit.`,
    examples: [
      {
        input: `open(0), open(2), open(4); count_open()`,
        output: `3`,
      },
      {
        input: `sector_mask = 0b00010101 (assets 0, 2, 4); sector_exposure(sector_mask)`,
        output: `3`,
      },
    ],
    constraints: ["0 <= i < 30", "All operations O(1)"],
    approach: `Use a 32-bit integer. Each bit i represents asset i's long position.
- open(i): flags |= (1 << i)
- close(i): flags &= ~(1 << i)
- is_long(i): (flags >> i) & 1
- flip(i): flags ^= (1 << i)
- count_open(): bin(flags).count('1')  — or use bit_count() in Python 3.10+
- sector_exposure(mask): bin(flags & mask).count('1')

Brian Kernighan's trick counts bits in O(popcount) without builtin: n & (n-1) clears lowest set bit.`,
    code: `class PositionTracker:
    def __init__(self):
        self.flags: int = 0

    def open(self, i: int) -> None:
        self.flags |= (1 << i)

    def close(self, i: int) -> None:
        self.flags &= ~(1 << i)

    def is_long(self, i: int) -> bool:
        return bool((self.flags >> i) & 1)

    def flip(self, i: int) -> None:
        self.flags ^= (1 << i)

    def count_open(self) -> int:
        # Brian Kernighan's algorithm
        n, count = self.flags, 0
        while n:
            n &= n - 1
            count += 1
        return count

    def sector_exposure(self, sector_mask: int) -> int:
        overlap = self.flags & sector_mask
        count = 0
        while overlap:
            overlap &= overlap - 1
            count += 1
        return count

    def __repr__(self) -> str:
        return f"Positions: {bin(self.flags)}"

pt = PositionTracker()
for i in [0, 2, 4, 7, 15]:
    pt.open(i)

print(pt)                             # 0b1000010010101
print("Open:", pt.count_open())      # 5
print("Long 2:", pt.is_long(2))       # True
print("Long 3:", pt.is_long(3))       # False

tech_mask = (1 << 0) | (1 << 2) | (1 << 4)   # assets 0,2,4 are tech
print("Tech exposure:", pt.sector_exposure(tech_mask))  # 3

pt.flip(7)
print("After flip 7:", pt.count_open())  # 4`,
    language: "python",
    complexity: { time: "O(1) per op, O(popcount) for count", space: "O(1)" },
  },
  {
    id: "fin-20260719-b1-order-book-design",
    title: "Order Book Design — Add, Cancel, Best Bid/Ask",
    difficulty: "hard",
    topics: ["Design", "Sorted Map", "Hash Map", "Finance"],
    problem: `Design an order book that supports:
- add_order(order_id, side, price, qty): Add a limit order. side is "BUY" or "SELL".
- cancel_order(order_id): Remove an order.
- best_bid(): Return the highest BUY price with its total quantity, or None.
- best_ask(): Return the lowest SELL price with its total quantity, or None.
- spread(): Return best_ask - best_bid, or None.

Multiple orders can rest at the same price level; quantities are aggregated.`,
    examples: [
      {
        input: `add_order(1,"BUY",100,10); add_order(2,"BUY",101,5); best_bid()`,
        output: `(101, 5)`,
      },
      {
        input: `add_order(3,"SELL",102,8); spread()`,
        output: `1`,
      },
    ],
    constraints: [
      "order_id is unique",
      "1 <= qty <= 10^6",
      "0 < price <= 10^6",
      "All operations should be as fast as possible",
    ],
    approach: `Use two sorted containers:
- bids: SortedDict (descending by price, or negate key) mapping price → total_qty
- asks: SortedDict (ascending) mapping price → total_qty
- orders: dict mapping order_id → (side, price, qty) for cancellation

Python's sortedcontainers.SortedDict provides O(log n) insert/delete.
Use negated price as key for bids so SortedDict[0] gives best bid.

add: O(log n), cancel: O(log n), best_bid/ask: O(1).`,
    code: `from sortedcontainers import SortedDict

class OrderBook:
    def __init__(self):
        # bids: keyed by -price so first key = best bid
        self._bids: SortedDict = SortedDict()
        self._asks: SortedDict = SortedDict()
        self._orders: dict = {}   # order_id -> (side, price, qty)

    def add_order(self, order_id: int, side: str, price: float, qty: int) -> None:
        self._orders[order_id] = (side, price, qty)
        if side == "BUY":
            key = -price
            self._bids[key] = self._bids.get(key, 0) + qty
        else:
            self._asks[price] = self._asks.get(price, 0) + qty

    def cancel_order(self, order_id: int) -> None:
        if order_id not in self._orders:
            return
        side, price, qty = self._orders.pop(order_id)
        if side == "BUY":
            key = -price
            self._bids[key] -= qty
            if self._bids[key] <= 0:
                del self._bids[key]
        else:
            self._asks[price] -= qty
            if self._asks[price] <= 0:
                del self._asks[price]

    def best_bid(self):
        if not self._bids:
            return None
        key, qty = self._bids.peekitem(0)
        return (-key, qty)

    def best_ask(self):
        if not self._asks:
            return None
        price, qty = self._asks.peekitem(0)
        return (price, qty)

    def spread(self):
        bid = self.best_bid()
        ask = self.best_ask()
        if bid and ask:
            return ask[0] - bid[0]
        return None

ob = OrderBook()
ob.add_order(1, "BUY",  100.0, 10)
ob.add_order(2, "BUY",  101.0,  5)
ob.add_order(3, "SELL", 102.0,  8)
ob.add_order(4, "SELL", 103.0, 12)
print("Best bid:", ob.best_bid())   # (101.0, 5)
print("Best ask:", ob.best_ask())   # (102.0, 8)
print("Spread:  ", ob.spread())     # 1.0
ob.cancel_order(2)
print("After cancel 2, best bid:", ob.best_bid())  # (100.0, 10)`,
    language: "python",
    complexity: { time: "O(log n) add/cancel, O(1) best bid/ask", space: "O(n)" },
  },
  {
    id: "fin-20260719-b1-merge-sorted-feeds",
    title: "Merge Two Sorted Price Arrays (Two-Pointer)",
    difficulty: "easy",
    topics: ["Two Pointers", "Array", "Merge", "Finance"],
    problem: `You receive two sorted (ascending) arrays of (timestamp, price) tuples representing tick data from two exchanges. Merge them into a single sorted array. When timestamps are equal, the first exchange's tick comes first. Return the merged array.

This models NBBO (National Best Bid/Offer) consolidation from multiple venue feeds.`,
    examples: [
      {
        input: `feed1 = [(1,100.0),(3,101.0),(5,99.5)], feed2 = [(2,100.5),(3,101.5),(6,98.0)]`,
        output: `[(1,100.0),(2,100.5),(3,101.0),(3,101.5),(5,99.5),(6,98.0)]`,
      },
    ],
    constraints: [
      "0 <= len(feed1), len(feed2) <= 10^5",
      "Each feed is sorted by timestamp ascending",
      "Timestamps are non-negative integers",
    ],
    approach: `Classic two-pointer merge: maintain pointers i, j for each feed. Compare current elements, take the smaller timestamp (tie-break: feed1 first). Advance the pointer of whichever feed was consumed. Append remaining elements.

Time: O(m + n), Space: O(m + n) for output.

Extension: k feeds → use a min-heap of (timestamp, feed_idx, record_idx) for O((m+n) log k).`,
    code: `def merge_feeds(feed1: list, feed2: list) -> list:
    merged = []
    i = j = 0
    m, n = len(feed1), len(feed2)

    while i < m and j < n:
        ts1, p1 = feed1[i]
        ts2, p2 = feed2[j]
        if ts1 <= ts2:          # tie-break: feed1 first
            merged.append(feed1[i])
            i += 1
        else:
            merged.append(feed2[j])
            j += 1

    # Append remaining
    merged.extend(feed1[i:])
    merged.extend(feed2[j:])
    return merged

feed1 = [(1, 100.0), (3, 101.0), (5, 99.5)]
feed2 = [(2, 100.5), (3, 101.5), (6, 98.0)]
result = merge_feeds(feed1, feed2)
print(result)

# Extension: k feeds via heap
import heapq

def merge_k_feeds(feeds: list[list]) -> list:
    heap = []
    iters = [iter(f) for f in feeds]
    for idx, it in enumerate(iters):
        try:
            ts, p = next(it)
            heapq.heappush(heap, (ts, idx, p, it))
        except StopIteration:
            pass

    merged = []
    while heap:
        ts, idx, p, it = heapq.heappop(heap)
        merged.append((ts, p))
        try:
            ts2, p2 = next(it)
            heapq.heappush(heap, (ts2, idx, p2, it))
        except StopIteration:
            pass
    return merged

print(merge_k_feeds([feed1, feed2]))`,
    language: "python",
    complexity: { time: "O(m+n)", space: "O(m+n)" },
    leetcodeNumber: 88,
  },
  {
    id: "fin-20260719-b1-ways-target-return",
    title: "Count Portfolios Achieving a Target Return (Coin Change Variant)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Finance", "Combinatorics"],
    problem: `You have n integer daily returns (in basis points, may be negative). Count the number of distinct ordered sequences of exactly k days that sum to a target return T. Each day's return can be reused any number of times (this models a bootstrapped simulation). Return the count modulo 10^9 + 7.

This is the Coin Change II variant adapted to finance simulation.`,
    examples: [
      {
        input: `returns = [1, 2, 3], k = 3, T = 5`,
        output: `6`,
        explanation: `[1,1,3],[1,2,2],[1,3,1],[2,1,2],[2,2,1],[3,1,1] — 6 ordered sequences of length 3 summing to 5.`,
      },
    ],
    constraints: [
      "1 <= n <= 50",
      "1 <= k <= 20",
      "0 <= T <= 100",
      "1 <= returns[i] <= 20",
    ],
    approach: `DP on (step, current_sum). Let dp[step][s] = number of ordered sequences of length step summing to s.

dp[0][0] = 1 (empty sequence, sum 0).
For each step 1..k, for each achievable sum s, for each return r:
  dp[step][s] += dp[step-1][s - r]  (if s >= r)

Answer: dp[k][T].
Since ordered sequences (permutations matter), the outer loop is over steps (not items).
Time: O(k * T * n), Space: O(k * T) or O(T) with rolling array.`,
    code: `def count_sequences(returns: list[int], k: int, T: int) -> int:
    MOD = 10**9 + 7
    # dp[s] = number of ordered sequences of current length summing to s
    dp = [0] * (T + 1)
    dp[0] = 1

    for _ in range(k):
        new_dp = [0] * (T + 1)
        for s in range(T + 1):
            if dp[s] == 0:
                continue
            for r in returns:
                if s + r <= T:
                    new_dp[s + r] = (new_dp[s + r] + dp[s]) % MOD
        dp = new_dp

    return dp[T]

print(count_sequences([1, 2, 3], 3, 5))   # 6
print(count_sequences([1, 2], 4, 4))       # 5 (1111,112,121,211,22 — len 2 22 counts)

# Finance framing: how many 5-day return paths via {-1bp, 0bp, +1bp} sum to +2bp?
print(count_sequences([0, 1, 2], 5, 5))`,
    language: "python",
    complexity: { time: "O(k * T * n)", space: "O(T)" },
  },
];
