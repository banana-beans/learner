import type { LeetCodeProblem } from "./index";

export const financeProblems20260729B1: LeetCodeProblem[] = [
  {
    id: "fin-20260729-b1-merge-k-orderbooks",
    title: "Merge K Sorted Order Book Streams (Heap)",
    difficulty: "hard",
    topics: ["Heap", "Design", "Sorting"],
    problem:
      "You receive price updates from K exchanges, each maintaining a sorted list of best bid prices in descending order. Merge all K streams into a single sorted descending stream. Implement `MergeOrderBooks(books: List[List[int]]) -> List[int]` returning all prices in descending order (highest first). Assume N total prices across all exchanges.",
    examples: [
      {
        input: "books = [[100, 99, 97], [101, 98, 95], [100, 96]]",
        output: "[101, 100, 100, 99, 98, 97, 96, 95]",
        explanation: "Merge three exchange bid queues into one sorted descending list.",
      },
    ],
    constraints: ["1 ≤ K ≤ 1000", "1 ≤ N ≤ 10^6 total prices", "Prices are integers in [1, 10^9]"],
    approach:
      "Use a max-heap of (price, exchange_idx, position_in_exchange). Initialise with the first price from each exchange. On each pop, add the next price from the same exchange. This gives O(N log K) time — optimal since at least one comparison per element is required.",
    code: `import heapq

def merge_order_books(books):
    # Python heapq is a min-heap; negate prices for max-heap behaviour
    heap = []
    for i, book in enumerate(books):
        if book:
            heapq.heappush(heap, (-book[0], i, 0))

    result = []
    while heap:
        neg_price, ex_idx, pos = heapq.heappop(heap)
        result.append(-neg_price)
        nxt = pos + 1
        if nxt < len(books[ex_idx]):
            heapq.heappush(heap, (-books[ex_idx][nxt], ex_idx, nxt))

    return result

books = [[100, 99, 97], [101, 98, 95], [100, 96]]
print(merge_order_books(books))`,
    language: "python",
    complexity: { time: "O(N log K)", space: "O(K)" },
  },
  {
    id: "fin-20260729-b1-max-drawdown-window",
    title: "Maximum Drawdown in a Sliding Window",
    difficulty: "hard",
    topics: ["Sliding Window", "Monotonic Deque", "Array"],
    problem:
      "Given an array of daily portfolio values `prices` and a window size `w`, find the maximum drawdown (peak-to-trough decline as a fraction) in any window of exactly `w` consecutive days. Drawdown = (peak - trough) / peak where peak and trough are both within the window. Return the maximum such drawdown across all windows.",
    examples: [
      {
        input: "prices = [100, 110, 90, 120, 80, 95], w = 3",
        output: "0.2727",
        explanation:
          "Window [110, 90, 120]: peak=120, trough=90, drawdown=25%. Window [120, 80, 95]: peak=120, trough=80, drawdown=33.33%. Actually worst is [110,90,120]→no. Check [100,110,90]: peak=110 trough=90 → 18.2%. [110,90,120]→ peak=120, trough=90 → 25%. [90,120,80]→ peak=120, trough=80 → 33.33%. Max = 0.3333.",
      },
    ],
    constraints: ["2 ≤ w ≤ len(prices) ≤ 10^5", "prices[i] > 0"],
    approach:
      "Use two monotonic deques: one tracking the running maximum (max-deque, front is max), one tracking the running minimum (min-deque, front is min) within each window. For each window slide, remove out-of-window indices from both deques. Drawdown = (max - min) / max. O(N) total.",
    code: `from collections import deque

def max_drawdown_window(prices, w):
    n = len(prices)
    max_dq = deque()   # indices, front = current window max
    min_dq = deque()   # indices, front = current window min
    best = 0.0

    for i in range(n):
        # Maintain decreasing max deque
        while max_dq and prices[max_dq[-1]] <= prices[i]:
            max_dq.pop()
        max_dq.append(i)

        # Maintain increasing min deque
        while min_dq and prices[min_dq[-1]] >= prices[i]:
            min_dq.pop()
        min_dq.append(i)

        # Remove elements outside window
        if max_dq[0] < i - w + 1:
            max_dq.popleft()
        if min_dq[0] < i - w + 1:
            min_dq.popleft()

        if i >= w - 1:
            peak   = prices[max_dq[0]]
            trough = prices[min_dq[0]]
            best = max(best, (peak - trough) / peak)

    return round(best, 6)

print(max_drawdown_window([100, 110, 90, 120, 80, 95], 3))  # 0.333333`,
    language: "python",
    complexity: { time: "O(N)", space: "O(W)" },
  },
  {
    id: "fin-20260729-b1-dp-k-transactions",
    title: "Maximum Profit with At Most K Transactions (DP)",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Array", "Finance"],
    problem:
      "You are given an array `prices` of daily stock prices and an integer `k`. You may complete at most `k` buy-sell transactions (buy then sell, no overlapping). Find the maximum profit. Each transaction consists of exactly one buy followed by one sell.",
    examples: [
      {
        input: "prices = [3, 2, 6, 5, 0, 3], k = 2",
        output: "7",
        explanation: "Buy at 2, sell at 6 (profit 4); buy at 0, sell at 3 (profit 3). Total = 7.",
      },
      {
        input: "prices = [2, 4, 1], k = 2",
        output: "2",
        explanation: "Buy at 2, sell at 4 = profit 2.",
      },
    ],
    constraints: ["1 ≤ k ≤ 100", "1 ≤ n ≤ 10^5", "0 ≤ prices[i] ≤ 10^4"],
    approach:
      "If k >= n//2, unlimited transactions (greedy: sum all ascending differences). Otherwise, DP: dp[j] = max profit using j transactions up to today. Maintain `max_so_far = max(dp[j-1] - buy_price)` for each j. Update dp[j] = max(dp[j], price + max_so_far). O(k*n) time, O(k) space.",
    code: `def max_profit_k_transactions(k, prices):
    n = len(prices)
    if not prices or k == 0:
        return 0

    # Optimization: if k >= n//2, unlimited transactions
    if k >= n // 2:
        return sum(max(prices[i] - prices[i-1], 0) for i in range(1, n))

    # dp[j] = max profit with exactly j completed transactions up to today
    dp = [0] * (k + 1)
    # max_hold[j] = max(dp[j-1] - price) seen so far (best buy point for j-th tx)
    max_hold = [-float('inf')] * (k + 1)

    for price in prices:
        for j in range(k, 0, -1):  # iterate backwards to avoid using updated dp[j-1]
            dp[j] = max(dp[j], price + max_hold[j])
            max_hold[j] = max(max_hold[j], dp[j-1] - price)

    return dp[k]

print(max_profit_k_transactions(2, [3, 2, 6, 5, 0, 3]))  # 7
print(max_profit_k_transactions(2, [2, 4, 1]))           # 2`,
    language: "python",
    complexity: { time: "O(k·n)", space: "O(k)" },
  },
  {
    id: "fin-20260729-b1-monotonic-stock-span",
    title: "Stock Span Problem (Monotonic Stack)",
    difficulty: "medium",
    topics: ["Stack", "Monotonic Stack", "Array"],
    problem:
      "The stock span of a stock's price on a given day is the maximum number of consecutive days (including the current day) for which the price was less than or equal to today's price. Given a list of daily prices, compute the span for each day. This is used to identify breakout days in technical analysis.",
    examples: [
      {
        input: "prices = [100, 80, 60, 70, 60, 75, 85]",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation:
          "Day 6: price=75 >= 60 (day5), 70 (day4), 60 (day3), 80? no. So span=4 (days 3,4,5,6). Day 7: 85 >= all → span=6.",
      },
    ],
    constraints: ["1 ≤ n ≤ 10^5", "1 ≤ prices[i] ≤ 10^5"],
    approach:
      "Maintain a monotonic decreasing stack of (price, span) pairs. When a new price arrives, pop all stack entries with price ≤ current price, accumulating their spans. Push (price, accumulated_span+1). Each element is pushed and popped at most once: O(N) total.",
    code: `def stock_span(prices):
    # Stack stores (price, span) pairs
    stack = []   # monotonic decreasing by price
    spans = []

    for price in prices:
        span = 1
        # Pop all previous prices that are <= current price
        while stack and stack[-1][0] <= price:
            _, prev_span = stack.pop()
            span += prev_span
        stack.append((price, span))
        spans.append(span)

    return spans

prices = [100, 80, 60, 70, 60, 75, 85]
print(stock_span(prices))  # [1, 1, 1, 2, 1, 4, 6]

# Online version (streaming): maintain stack across calls
class StockSpanner:
    def __init__(self):
        self.stack = []   # (price, cumulative_span)

    def next(self, price: int) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]
        self.stack.append((price, span))
        return span

sp = StockSpanner()
for p in [100, 80, 60, 70, 60, 75, 85]:
    print(sp.next(p), end=" ")`,
    language: "python",
    complexity: { time: "O(N) amortised", space: "O(N)" },
  },
  {
    id: "fin-20260729-b1-shortest-fx-path",
    title: "Minimum Cost FX Conversion (Dijkstra Shortest Path)",
    difficulty: "medium",
    topics: ["Graph", "Dijkstra", "Heap"],
    problem:
      "You have a list of currency pairs with conversion rates. Converting from currency A to B costs a fixed fee plus a proportional spread. Given `rates = [(src, dst, fee, spread)]` and start/end currencies, find the minimum total cost to convert 1 unit of source currency to target currency. Ignore the multiplicative rate for simplicity — minimise total additive cost (fee + spread per hop).",
    examples: [
      {
        input: "rates = [(USD, EUR, 1, 2), (EUR, GBP, 1, 1), (USD, GBP, 3, 5)], src=USD, dst=GBP",
        output: "5 (via USD->EUR->GBP: 1+2+1+1=5 vs direct: 3+5=8)",
        explanation: "Two-hop path via EUR is cheaper than the direct conversion.",
      },
    ],
    constraints: ["Up to 100 currencies", "Up to 10^4 conversion pairs"],
    approach:
      "Model as a weighted directed graph where edge weight = fee + spread. Run Dijkstra from the source currency using a min-heap of (total_cost, currency). O((E + V) log V).",
    code: `import heapq
from collections import defaultdict

def min_fx_cost(rates, src, dst):
    # Build adjacency list: graph[u] = [(cost, v)]
    graph = defaultdict(list)
    for s, d, fee, spread in rates:
        graph[s].append((fee + spread, d))

    # Dijkstra
    dist = {src: 0}
    heap = [(0, src)]

    while heap:
        cost, curr = heapq.heappop(heap)
        if curr == dst:
            return cost
        if cost > dist.get(curr, float('inf')):
            continue
        for edge_cost, nxt in graph[curr]:
            new_cost = cost + edge_cost
            if new_cost < dist.get(nxt, float('inf')):
                dist[nxt] = new_cost
                heapq.heappush(heap, (new_cost, nxt))

    return -1  # no path

rates = [("USD","EUR",1,2), ("EUR","GBP",1,1), ("USD","GBP",3,5)]
print(min_fx_cost(rates, "USD", "GBP"))  # 5`,
    language: "python",
    complexity: { time: "O((E + V) log V)", space: "O(V + E)" },
  },
  {
    id: "fin-20260729-b1-order-book-design",
    title: "Order Book with Best Bid/Ask and Cancel (Design)",
    difficulty: "hard",
    topics: ["Design", "Hash Map", "Sorted Map"],
    problem:
      "Design an order book supporting: `add_order(order_id, side, price, qty)` — add a limit order. `cancel_order(order_id)` — cancel by ID. `get_best_bid()` — return (price, total_qty) at best bid level. `get_best_ask()` — return (price, total_qty) at best ask level. All operations should be as fast as possible.",
    examples: [
      {
        input:
          "add_order(1,'bid',100,200), add_order(2,'bid',101,100), add_order(3,'ask',102,300), cancel_order(2), get_best_bid(), get_best_ask()",
        output: "get_best_bid() = (100, 200), get_best_ask() = (102, 300)",
        explanation: "After cancelling order 2 (bid@101), the best bid is now 100.",
      },
    ],
    constraints: ["Up to 10^6 add/cancel operations", "Prices are positive integers"],
    approach:
      "Use a dict mapping order_id to (side, price, qty) for O(1) cancel lookup. Use sorted containers for price levels: a max-heap proxy for bids and min-heap proxy for asks, with lazy deletion (skip cancelled orders when peeking). Alternatively use a SortedList. Level qty is maintained in a dict.",
    code: `import heapq
from collections import defaultdict

class OrderBook:
    def __init__(self):
        self.orders = {}           # order_id -> (side, price, qty)
        self.bid_heap = []         # max-heap via negation: (-price, order_id)
        self.ask_heap = []         # min-heap: (price, order_id)
        self.level_qty = defaultdict(int)   # (side, price) -> total_qty

    def add_order(self, oid, side, price, qty):
        self.orders[oid] = (side, price, qty)
        self.level_qty[(side, price)] += qty
        if side == 'bid':
            heapq.heappush(self.bid_heap, (-price, oid))
        else:
            heapq.heappush(self.ask_heap, (price, oid))

    def cancel_order(self, oid):
        if oid not in self.orders:
            return
        side, price, qty = self.orders.pop(oid)
        self.level_qty[(side, price)] -= qty
        if self.level_qty[(side, price)] <= 0:
            del self.level_qty[(side, price)]

    def _clean_heap(self, heap, side, negate=False):
        """Lazy deletion: pop stale entries from heap top."""
        while heap:
            val = heap[0]
            price = -val[0] if negate else val[0]
            oid   = val[1]
            if oid in self.orders and self.level_qty.get((side, price), 0) > 0:
                return price, self.level_qty[(side, price)]
            heapq.heappop(heap)
        return None, 0

    def get_best_bid(self):
        return self._clean_heap(self.bid_heap, 'bid', negate=True)

    def get_best_ask(self):
        return self._clean_heap(self.ask_heap, 'ask', negate=False)

ob = OrderBook()
ob.add_order(1, 'bid', 100, 200)
ob.add_order(2, 'bid', 101, 100)
ob.add_order(3, 'ask', 102, 300)
ob.cancel_order(2)
print(ob.get_best_bid())   # (100, 200)
print(ob.get_best_ask())   # (102, 300)`,
    language: "python",
    complexity: { time: "O(log N) add/get, O(1) cancel", space: "O(N)" },
  },
  {
    id: "fin-20260729-b1-markov-expected-steps",
    title: "Expected Fills to Complete Position (Markov Chain)",
    difficulty: "medium",
    topics: ["Math", "Probability", "Markov Chain"],
    problem:
      "A limit order fills with probability p on each time step. You need to fill a position of size N lots, one lot per step. Each step is independent. What is the expected number of steps to fill the entire position? Now extend: suppose each step you submit 1 lot, but with probability q the exchange rejects the order entirely (no fill, no retry slot used). What is the expected steps to fill N lots?",
    examples: [
      {
        input: "N=5, p=0.3, q=0.1",
        output: "Expected steps ≈ 18.52",
        explanation:
          "Effective fill probability per step = p*(1-q) per submitted order. Wait for N successes in a sequence of Bernoulli(p*(1-q)) trials. E[steps] = N / (p*(1-q)).",
      },
    ],
    constraints: ["1 ≤ N ≤ 10^6", "0 < p, q < 1", "p + q < 1"],
    approach:
      "Each step is a Bernoulli trial with success probability p_eff = p*(1-q). Number of steps for N successes follows a Negative Binomial(N, p_eff). E[steps] = N / p_eff. Variance = N*(1-p_eff)/p_eff^2. Simulate to verify.",
    code: `import numpy as np

def expected_fill_steps(N, p, q):
    """Analytical expected steps to fill N lots."""
    p_eff = p * (1 - q)      # probability of a fill on any given step
    expected = N / p_eff
    variance = N * (1 - p_eff) / p_eff**2
    return expected, np.sqrt(variance)

def simulate_fill_steps(N, p, q, n_sims=100_000):
    """Monte Carlo verification."""
    steps_list = []
    for _ in range(n_sims):
        filled = 0
        steps  = 0
        while filled < N:
            steps += 1
            if np.random.random() > q:          # not rejected
                if np.random.random() < p:      # fill
                    filled += 1
        steps_list.append(steps)
    return np.mean(steps_list), np.std(steps_list)

N, p, q = 5, 0.3, 0.1
e, s = expected_fill_steps(N, p, q)
print(f"Analytical: E[steps]={e:.4f}  std={s:.4f}")

mc_e, mc_s = simulate_fill_steps(N, p, q)
print(f"Simulation: E[steps]={mc_e:.4f}  std={mc_s:.4f}")`,
    language: "python",
    complexity: { time: "O(N/p_eff) expected per simulation", space: "O(1)" },
  },
  {
    id: "fin-20260729-b1-rolling-sharpe-heap",
    title: "Maximum Rolling Sharpe Ratio (Sliding Window + Heap)",
    difficulty: "hard",
    topics: ["Sliding Window", "Math", "Statistics"],
    problem:
      "Given a list of daily returns and a window size `w`, compute the Sharpe ratio (annualised mean / std * sqrt(252)) for every window of size `w`. Return the maximum Sharpe ratio across all windows and the starting index of that window.",
    examples: [
      {
        input: "returns = [0.01, 0.02, -0.005, 0.015, 0.008, -0.002, 0.012], w = 4",
        output: "max_sharpe ≈ 4.13 at index 1",
        explanation: "Window [0.02, -0.005, 0.015, 0.008]: mean=0.0095, std≈0.0103, Sharpe≈14.66 annualised. Check all windows to find the max.",
      },
    ],
    constraints: ["w ≥ 2", "w ≤ n ≤ 10^6", "returns[i] in [-1, 1]"],
    approach:
      "Maintain a sliding window sum and sum-of-squares for O(1) mean/variance updates. mean = sum/w, var = (sum_sq - sum^2/w)/(w-1), std = sqrt(var). Sharpe = mean/std * sqrt(252). Scan all windows in O(N).",
    code: `import math

def max_rolling_sharpe(returns, w, annualise=252):
    n = len(returns)
    if n < w:
        return None, -1

    # Init first window
    s  = sum(returns[:w])
    s2 = sum(r*r for r in returns[:w])

    def sharpe(s_, s2_, w_):
        mean = s_ / w_
        var  = (s2_ - s_*s_/w_) / (w_ - 1)
        if var <= 0:
            return 0.0
        return mean / math.sqrt(var) * math.sqrt(annualise)

    best_sr  = sharpe(s, s2, w)
    best_idx = 0

    for i in range(1, n - w + 1):
        # Remove outgoing element, add incoming
        s  += returns[i + w - 1] - returns[i - 1]
        s2 += returns[i + w - 1]**2 - returns[i - 1]**2
        sr = sharpe(s, s2, w)
        if sr > best_sr:
            best_sr  = sr
            best_idx = i

    return round(best_sr, 4), best_idx

returns = [0.01, 0.02, -0.005, 0.015, 0.008, -0.002, 0.012]
sr, idx = max_rolling_sharpe(returns, 4)
print(f"Max Sharpe={sr} at window starting index {idx}")`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260729-b1-portfolio-knapsack",
    title: "Portfolio Budget Allocation with Integer Lots (0/1 Knapsack)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Knapsack", "Finance"],
    problem:
      "You have a budget of `B` dollars and `n` stocks. Each stock i has a lot price `cost[i]` and expected return `ret[i]`. You can buy at most one lot of each stock. Maximize total expected return subject to total cost ≤ B.",
    examples: [
      {
        input: "B=10, costs=[3,4,5,6], rets=[4,5,7,8]",
        output: "13 (buy stocks 0 and 3: cost=3+6=9<=10, ret=4+8=12... or 1+2: 4+5=9<=10, ret=5+7=12. Or 0+1: 3+4=7<=10, ret=4+5=9. Or 2+3: 11>10 invalid. Or 0+2: 8<=10, ret=11. Or 1+3: 10<=10, ret=13). Best: stocks 1 and 3.",
        explanation: "Buy stock 1 (cost=4, ret=5) and stock 3 (cost=6, ret=8): total cost=10, total return=13.",
      },
    ],
    constraints: ["1 ≤ n ≤ 50", "1 ≤ B ≤ 10^4", "1 ≤ cost[i], ret[i] ≤ 10^3"],
    approach:
      "Classic 0/1 knapsack. dp[b] = max return achievable with budget b. Iterate items; for each item iterate budget backwards (to prevent double-counting). O(n*B) time and O(B) space.",
    code: `def max_portfolio_return(B, costs, rets):
    n = len(costs)
    dp = [0] * (B + 1)   # dp[b] = max return with budget b

    for i in range(n):
        # Iterate backwards to ensure each stock used at most once
        for b in range(B, costs[i] - 1, -1):
            dp[b] = max(dp[b], dp[b - costs[i]] + rets[i])

    return dp[B]

def max_portfolio_with_selection(B, costs, rets):
    """Also return which stocks to buy."""
    n = len(costs)
    dp = [[0]*(B+1) for _ in range(n+1)]
    for i in range(1, n+1):
        for b in range(B+1):
            dp[i][b] = dp[i-1][b]
            if b >= costs[i-1]:
                dp[i][b] = max(dp[i][b], dp[i-1][b-costs[i-1]] + rets[i-1])
    # Traceback
    selected, b = [], B
    for i in range(n, 0, -1):
        if dp[i][b] != dp[i-1][b]:
            selected.append(i-1)
            b -= costs[i-1]
    return dp[n][B], selected[::-1]

B = 10
costs = [3, 4, 5, 6]
rets  = [4, 5, 7, 8]
val, sel = max_portfolio_with_selection(B, costs, rets)
print(f"Max return: {val}, stocks: {sel}")`,
    language: "python",
    complexity: { time: "O(n·B)", space: "O(B)" },
  },
  {
    id: "fin-20260729-b1-position-bitmask",
    title: "Portfolio Position Tracker (Bitmask Design)",
    difficulty: "easy",
    topics: ["Bit Manipulation", "Design", "Finance"],
    problem:
      "Design a compact portfolio tracker for up to 64 assets using a bitmask. Support: `open_position(asset_id)` — mark asset as held. `close_position(asset_id)` — mark as sold. `is_held(asset_id)` — check if held. `all_positions()` — list all currently held asset IDs. `num_positions()` — count of held assets. All in O(1) except `all_positions` which is O(n).",
    examples: [
      {
        input: "open(0), open(3), open(7), close(3), all_positions()",
        output: "[0, 7]",
        explanation: "After opening 0, 3, 7 and closing 3, only 0 and 7 remain.",
      },
    ],
    constraints: ["0 ≤ asset_id < 64"],
    approach:
      "Store a 64-bit integer as the position bitmask. open: OR with (1 << id). close: AND with ~(1 << id). is_held: (mask >> id) & 1. num_positions: bin(mask).count('1') or popcount. all_positions: iterate set bits.",
    code: `class PositionTracker:
    def __init__(self):
        self._mask = 0   # 64-bit bitmask

    def open_position(self, asset_id: int):
        self._mask |= (1 << asset_id)

    def close_position(self, asset_id: int):
        self._mask &= ~(1 << asset_id)

    def is_held(self, asset_id: int) -> bool:
        return bool((self._mask >> asset_id) & 1)

    def num_positions(self) -> int:
        return bin(self._mask).count('1')   # popcount

    def all_positions(self):
        """Iterate set bits in O(k) where k = number of held positions."""
        m, positions = self._mask, []
        while m:
            lsb = m & (-m)                  # isolate lowest set bit
            positions.append(lsb.bit_length() - 1)
            m &= m - 1                      # clear lowest set bit
        return positions

    def net_exposure(self, prices: dict) -> float:
        """Sum of prices for all held positions."""
        return sum(prices[i] for i in self.all_positions() if i in prices)

pt = PositionTracker()
pt.open_position(0)
pt.open_position(3)
pt.open_position(7)
pt.close_position(3)
print(pt.all_positions())    # [0, 7]
print(pt.num_positions())    # 2
prices = {0: 150.0, 7: 325.0}
print(pt.net_exposure(prices))  # 475.0`,
    language: "python",
    complexity: { time: "O(1) open/close/is_held, O(k) all_positions", space: "O(1)" },
  },
];
