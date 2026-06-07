import type { LeetCodeProblem } from "./index";

export const financeProblems20260607B1: LeetCodeProblem[] = [
  {
    id: "fin-20260607-b1-merge-k-books",
    title: "Merge K Sorted Order Book Streams",
    difficulty: "hard",
    topics: ["heap", "priority-queue", "sorting", "finance"],
    problem:
      "You are given K sorted arrays of (price, quantity) pairs, each representing a live order book level stream sorted ascending by price. Merge them into one sorted stream. Return the merged list of (price, total_qty) pairs sorted by price, summing quantities for duplicate prices.",
    examples: [
      {
        input:
          "streams = [[(100, 10), (102, 5)], [(101, 8), (103, 3)], [(100, 7), (104, 2)]]",
        output: "[(100, 17), (101, 8), (102, 5), (103, 3), (104, 2)]",
        explanation:
          "Price 100 appears in stream 0 and stream 2 with quantities 10 and 7; they merge to (100, 17).",
      },
    ],
    constraints: ["1 <= K <= 100", "Each stream is sorted ascending by price"],
    approach:
      "Use a min-heap initialised with the first element of each stream: (price, qty, stream_idx, element_idx). Pop minimum, merge equal prices, push next element from the same stream. Collect into result list. Time O(N log K) where N = total elements.",
    code: `import heapq
from collections import defaultdict

def merge_order_books(streams):
    heap = []
    for i, stream in enumerate(streams):
        if stream:
            price, qty = stream[0]
            heapq.heappush(heap, (price, qty, i, 0))

    result = []
    agg = defaultdict(int)
    last_price = None

    while heap:
        price, qty, si, ei = heapq.heappop(heap)
        agg[price] += qty
        # Advance pointer in the same stream
        if ei + 1 < len(streams[si]):
            np_, nq = streams[si][ei + 1]
            heapq.heappush(heap, (np_, nq, si, ei + 1))

    # Sorted output (defaultdict preserves insertion, sort for safety)
    for price in sorted(agg):
        result.append((price, agg[price]))
    return result`,
    language: "python",
    complexity: { time: "O(N log K)", space: "O(K + N)" },
  },
  {
    id: "fin-20260607-b1-stock-cooldown",
    title: "Stock Buy/Sell with Cooldown Period",
    difficulty: "medium",
    topics: ["dp", "state-machine", "finance"],
    leetcodeNumber: 309,
    problem:
      "Given an array prices where prices[i] is the stock price on day i, find the maximum profit. You may complete as many transactions as you like, but after selling you must wait one cooldown day before buying again. You may not hold more than one share at a time.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation:
          "Buy day 0 (price=1), sell day 1 (price=2), cooldown day 2, buy day 3 (price=0), sell day 4 (price=2). Profit = 1 + 2 = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
      },
    ],
    approach:
      "State machine DP with three states: hold (own stock), sold (just sold, in cooldown), rest (no stock, past cooldown). Transitions: hold = max(hold, rest - price); sold = hold + price; rest = max(rest, sold). O(N) time, O(1) space.",
    code: `def max_profit_cooldown(prices):
    hold = float("-inf")  # max profit while holding
    sold = 0              # max profit day after selling (cooldown)
    rest = 0              # max profit at rest (can buy)

    for price in prices:
        prev_sold = sold
        sold = hold + price          # sell today
        hold = max(hold, rest - price)  # buy today or do nothing
        rest = max(rest, prev_sold)  # cooldown over or stay resting

    return max(sold, rest)`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260607-b1-fx-arbitrage",
    title: "FX Arbitrage Detection via Bellman-Ford",
    difficulty: "hard",
    topics: ["graph", "bellman-ford", "math", "finance"],
    problem:
      "Given an N×N matrix rates where rates[i][j] is the exchange rate from currency i to currency j (0 means no direct path), detect whether a currency arbitrage exists: a cycle of conversions that starts and ends with the same currency and results in profit. Return True if arbitrage exists, False otherwise.",
    examples: [
      {
        input:
          "rates = [[1, 0.5, 3.0], [2.0, 1, 4.0], [0.25, 0.2, 1]] (USD, EUR, GBP)",
        output: "False",
        explanation: "No cycle has product > 1 after accounting for all paths.",
      },
      {
        input:
          "rates where USD→EUR=1.2, EUR→GBP=1.3, GBP→USD=0.7 (product=1.092)",
        output: "True",
        explanation:
          "1.2 * 1.3 * 0.7 = 1.092 > 1: converting USD→EUR→GBP→USD yields 9.2% risk-free profit.",
      },
    ],
    approach:
      "Transform to shortest-path problem: edge weight = -log(rate). A profitable cycle becomes a negative-weight cycle. Run Bellman-Ford for N-1 iterations then check if any edge can still be relaxed. O(V^3) for dense graph.",
    code: `import math

def has_fx_arbitrage(rates):
    n = len(rates)
    # Weight w[i][j] = -log(rate[i][j]); arbitrage = negative cycle
    INF = float("inf")
    dist = [0.0] * n  # start from all nodes simultaneously

    for _ in range(n - 1):
        for u in range(n):
            for v in range(n):
                if rates[u][v] > 0:
                    w = -math.log(rates[u][v])
                    if dist[u] + w < dist[v]:
                        dist[v] = dist[u] + w

    # N-th relaxation: negative cycle exists if dist improves
    for u in range(n):
        for v in range(n):
            if rates[u][v] > 0:
                w = -math.log(rates[u][v])
                if dist[u] + w < dist[v] - 1e-9:
                    return True
    return False`,
    language: "python",
    complexity: { time: "O(V^3)", space: "O(V)" },
  },
  {
    id: "fin-20260607-b1-max-profit-k",
    title: "Maximum Profit with At Most K Transactions",
    difficulty: "hard",
    topics: ["dp", "finance", "array"],
    leetcodeNumber: 188,
    problem:
      "Given an integer k and an array prices, find the maximum profit you can achieve with at most k transactions. A transaction is one buy followed by one sell. You may not hold more than one share at a time.",
    examples: [
      {
        input: "k = 2, prices = [3, 2, 6, 5, 0, 3]",
        output: "7",
        explanation:
          "Buy at 2, sell at 6 (profit 4). Buy at 0, sell at 3 (profit 3). Total = 7.",
      },
      {
        input: "k = 1, prices = [1, 2]",
        output: "1",
      },
    ],
    approach:
      "DP: for each of k transactions, track best_buy = max(-prices[i], prev_best_buy) and best_sell = max(prev_best_sell, best_buy + prices[i]). One pass per transaction, O(k*N) time. When k >= N/2, unlimited transactions.",
    code: `def max_profit_k_txn(k, prices):
    n = len(prices)
    if not prices or k == 0:
        return 0
    # If k >= n/2, unlimited transactions
    if k >= n // 2:
        return sum(max(prices[i] - prices[i-1], 0) for i in range(1, n))

    # dp[t][i] = max profit using at most t transactions through day i
    # Space optimized: maintain buy/sell arrays per transaction
    buy  = [float("-inf")] * k
    sell = [0] * k

    for price in prices:
        for t in range(k):
            prev_sell = sell[t - 1] if t > 0 else 0
            buy[t]    = max(buy[t],  prev_sell - price)
            sell[t]   = max(sell[t], buy[t] + price)

    return sell[-1]`,
    language: "python",
    complexity: { time: "O(k * N)", space: "O(k)" },
  },
  {
    id: "fin-20260607-b1-position-tracker",
    title: "Design Position Tracker with FIFO P&L",
    difficulty: "medium",
    topics: ["design", "queue", "hash-map", "finance"],
    problem:
      "Design a PositionTracker that tracks stock positions and computes realized P&L using FIFO (first-in, first-out) lot matching. Implement: buy(symbol, qty, price) — add a lot; sell(symbol, qty, price) — realize P&L consuming oldest lots first; get_realized_pnl(symbol) — return total realized P&L; get_position(symbol) — return current net quantity.",
    examples: [
      {
        input:
          "buy('AAPL', 100, 150.0); buy('AAPL', 50, 160.0); sell('AAPL', 120, 170.0)",
        output: "get_realized_pnl('AAPL') = 2200.0",
        explanation:
          "Sell 100 shares at cost 150 → P&L = (170-150)*100 = 2000. Sell 20 shares at cost 160 → P&L = (170-160)*20 = 200. Total = 2200.",
      },
    ],
    approach:
      "Use a deque of (qty, cost_price) lots per symbol. On sell, pop from the front consuming lots until qty satisfied, accumulating (sell_price - cost_price) * consumed_qty. Store running realized P&L in a dict.",
    code: `from collections import deque, defaultdict

class PositionTracker:
    def __init__(self):
        self.lots    = defaultdict(deque)   # symbol -> deque of (qty, cost)
        self.pnl     = defaultdict(float)   # realized P&L per symbol
        self.pos     = defaultdict(int)     # net quantity per symbol

    def buy(self, symbol: str, qty: int, price: float) -> None:
        self.lots[symbol].append((qty, price))
        self.pos[symbol] += qty

    def sell(self, symbol: str, qty: int, price: float) -> float:
        realized = 0.0
        remaining = qty
        while remaining > 0 and self.lots[symbol]:
            lot_qty, lot_cost = self.lots[symbol][0]
            consumed = min(remaining, lot_qty)
            realized += consumed * (price - lot_cost)
            remaining -= consumed
            if consumed == lot_qty:
                self.lots[symbol].popleft()
            else:
                self.lots[symbol][0] = (lot_qty - consumed, lot_cost)
        self.pnl[symbol] += realized
        self.pos[symbol] -= qty
        return realized

    def get_realized_pnl(self, symbol: str) -> float:
        return self.pnl[symbol]

    def get_position(self, symbol: str) -> int:
        return self.pos[symbol]`,
    language: "python",
    complexity: { time: "O(L) per sell (L=lots consumed)", space: "O(N)" },
  },
  {
    id: "fin-20260607-b1-portfolio-knapsack",
    title: "Portfolio Construction as 0-1 Knapsack",
    difficulty: "medium",
    topics: ["dp", "knapsack", "finance"],
    problem:
      "You have a capital budget C (integer). There are N assets, each with integer cost[i] (minimum investment in $1000 units) and expected_return[i] (annual return in bps). Select a subset of assets to maximize total expected return subject to total cost <= C. Each asset is either fully included or excluded (0-1 knapsack).",
    examples: [
      {
        input:
          "C = 10, cost = [3, 4, 5, 2], expected_return = [200, 300, 400, 150]",
        output: "500",
        explanation:
          "Select assets 0 (cost=3, ret=200) and 1 (cost=4, ret=300): total cost=7<=10, total return=500 bps. Adding asset 3 (cost=2) gives 650 bps with total cost=9<=10 — check: assets 0,1,3 → return=650.",
      },
    ],
    approach:
      "Standard 0-1 knapsack DP: dp[c] = max return achievable with exactly c capital units. Iterate assets, update dp from right to left to prevent reuse. Time O(N*C), space O(C).",
    code: `def max_portfolio_return(C: int, cost: list, expected_return: list) -> int:
    n   = len(cost)
    dp  = [0] * (C + 1)  # dp[c] = best return with budget c

    for i in range(n):
        # Traverse right to left to enforce 0-1 (no reuse)
        for c in range(C, cost[i] - 1, -1):
            dp[c] = max(dp[c], dp[c - cost[i]] + expected_return[i])

    return dp[C]

def reconstruct(C, cost, expected_return):
    """Backtrack to find which assets were selected."""
    n   = len(cost)
    dp  = [[0]*(C+1) for _ in range(n+1)]
    for i in range(1, n+1):
        for c in range(C+1):
            dp[i][c] = dp[i-1][c]
            if cost[i-1] <= c:
                dp[i][c] = max(dp[i][c], dp[i-1][c-cost[i-1]] + expected_return[i-1])
    # Backtrack
    selected, c = [], C
    for i in range(n, 0, -1):
        if dp[i][c] != dp[i-1][c]:
            selected.append(i-1)
            c -= cost[i-1]
    return selected`,
    language: "python",
    complexity: { time: "O(N * C)", space: "O(C)" },
  },
  {
    id: "fin-20260607-b1-running-median",
    title: "Running Median of Bid/Ask Price Stream",
    difficulty: "hard",
    topics: ["heap", "design", "finance"],
    leetcodeNumber: 295,
    problem:
      "Design a MedianFinder that supports: add_price(price) — add a new price to the stream; get_median() — return the current median of all prices seen so far. The stream represents a sequence of best bid or ask prices; the median is useful for estimating fair value.",
    examples: [
      {
        input: "add_price(1); add_price(2); get_median(); add_price(3); get_median()",
        output: "[1.5, 2.0]",
        explanation:
          "After [1,2]: median = (1+2)/2 = 1.5. After [1,2,3]: median = 2.0.",
      },
    ],
    approach:
      "Two heaps: max-heap (lo) for lower half, min-heap (hi) for upper half. Maintain |lo| - |hi| in {0, 1}. On add: push to lo, then rebalance. Median = lo[0] if odd, (lo[0] + hi[0]) / 2 if even. O(log N) add, O(1) median.",
    code: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []   # max-heap (negate values): lower half
        self.hi = []   # min-heap: upper half

    def add_price(self, price: float) -> None:
        # Push to lower half (negate for max-heap)
        heapq.heappush(self.lo, -price)
        # Ensure lo's max <= hi's min
        if self.hi and (-self.lo[0]) > self.hi[0]:
            val = -heapq.heappop(self.lo)
            heapq.heappush(self.hi, val)
        # Balance sizes: |lo| can be at most 1 more than |hi|
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def get_median(self) -> float:
        if len(self.lo) > len(self.hi):
            return float(-self.lo[0])
        return (-self.lo[0] + self.hi[0]) / 2.0`,
    language: "python",
    complexity: { time: "O(log N) add, O(1) median", space: "O(N)" },
  },
  {
    id: "fin-20260607-b1-min-fee-trading",
    title: "Maximum Profit with Transaction Fee",
    difficulty: "medium",
    topics: ["dp", "greedy", "finance"],
    leetcodeNumber: 714,
    problem:
      "Given an integer array prices and an integer fee representing a transaction fee per trade, find the maximum profit. You may complete as many transactions as you like, but each sell incurs fee. You may not hold more than one share at a time.",
    examples: [
      {
        input: "prices = [1, 3, 2, 8, 4, 9], fee = 2",
        output: "8",
        explanation:
          "Buy at 1, sell at 8 (profit = 8-1-2=5). Buy at 4, sell at 9 (profit=9-4-2=3). Total=8.",
      },
      {
        input: "prices = [1, 3, 7, 5, 10, 3], fee = 3",
        output: "6",
      },
    ],
    approach:
      "Two-state DP: cash = max profit not holding stock; hold = max profit while holding. Transitions: cash = max(cash, hold + price - fee); hold = max(hold, cash - price). O(N) time, O(1) space. Fee is charged on sell.",
    code: `def max_profit_with_fee(prices, fee):
    cash = 0               # not holding
    hold = -prices[0]      # holding (bought on day 0)

    for i in range(1, len(prices)):
        cash = max(cash, hold + prices[i] - fee)  # sell today
        hold = max(hold, cash - prices[i])         # buy today

    return cash`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
  {
    id: "fin-20260607-b1-spread-window",
    title: "Maximum Bid-Ask Spread in Sliding Window",
    difficulty: "medium",
    topics: ["sliding-window", "deque", "monotonic-deque", "finance"],
    problem:
      "Given two arrays bid[] and ask[] of length N (bid[i] <= ask[i] for all i), and an integer W, find the maximum spread (ask - bid) over any window of size W. The spread in a window is defined as max(ask[i..i+W-1]) - min(bid[i..i+W-1]).",
    examples: [
      {
        input: "bid = [1, 3, 2, 4], ask = [2, 5, 4, 6], W = 2",
        output: "4",
        explanation:
          "Window [1,2]: max_ask=5, min_bid=1 → spread=4. Window [2,3]: max_ask=6, min_bid=2 → spread=4. Max spread = 4.",
      },
    ],
    approach:
      "Two monotonic deques: max-deque for ask (front = max), min-deque for bid (front = min). Slide window of size W, evict expired indices from front of each deque. At each position, spread = ask_deque[0] - bid_deque[0]. O(N) time.",
    code: `from collections import deque

def max_spread_window(bid, ask, W):
    n = len(bid)
    max_ask = deque()  # decreasing (front = max ask index)
    min_bid = deque()  # increasing (front = min bid index)
    result  = 0

    for i in range(n):
        # Maintain max-deque for ask
        while max_ask and ask[max_ask[-1]] <= ask[i]:
            max_ask.pop()
        max_ask.append(i)

        # Maintain min-deque for bid
        while min_bid and bid[min_bid[-1]] >= bid[i]:
            min_bid.pop()
        min_bid.append(i)

        # Remove elements outside window
        if max_ask[0] <= i - W:
            max_ask.popleft()
        if min_bid[0] <= i - W:
            min_bid.popleft()

        # Compute spread for current window
        if i >= W - 1:
            spread = ask[max_ask[0]] - bid[min_bid[0]]
            result = max(result, spread)

    return result`,
    language: "python",
    complexity: { time: "O(N)", space: "O(W)" },
  },
  {
    id: "fin-20260607-b1-candles-pattern",
    title: "Count Bullish and Bearish Engulfing Candles",
    difficulty: "easy",
    topics: ["array", "finance", "pattern"],
    problem:
      "Given arrays open[], close[] representing daily OHLC candle data, count the number of bullish engulfing patterns and bearish engulfing patterns. A bullish engulfing occurs when: close[i-1] < open[i-1] (bearish candle) AND close[i] > open[i] (bullish candle) AND open[i] <= close[i-1] AND close[i] >= open[i-1]. A bearish engulfing is the mirror image.",
    examples: [
      {
        input:
          "open = [10, 9, 12, 11], close = [9, 12, 11, 14]  (open > close = bearish, close > open = bullish)",
        output: "{bullish: 1, bearish: 1}",
        explanation:
          "Day 1: bearish (9<10); Day 2: bullish (12>9), open[2]=9<=close[1]=9, close[2]=12>=open[1]=10 → bullish engulfing. Day 3: bearish (11<12); Day 4: bullish (14>11), check engulfing of day 3.",
      },
    ],
    approach:
      "Linear scan from index 1. Check prior candle direction and current candle direction, then verify the engulfing condition (current body fully contains prior body). O(N) time, O(1) space.",
    code: `def count_engulfing(open_p, close_p):
    bullish = bearish = 0
    n = len(open_p)
    for i in range(1, n):
        prev_bear = close_p[i-1] < open_p[i-1]   # previous red candle
        prev_bull = close_p[i-1] > open_p[i-1]   # previous green candle
        curr_bull = close_p[i]   > open_p[i]      # current green candle
        curr_bear = close_p[i]   < open_p[i]      # current red candle

        if prev_bear and curr_bull:
            # Bullish engulfing: current body wraps prior body
            if open_p[i] <= close_p[i-1] and close_p[i] >= open_p[i-1]:
                bullish += 1

        if prev_bull and curr_bear:
            # Bearish engulfing: current body wraps prior body
            if open_p[i] >= close_p[i-1] and close_p[i] <= open_p[i-1]:
                bearish += 1

    return {"bullish": bullish, "bearish": bearish}`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },
];
