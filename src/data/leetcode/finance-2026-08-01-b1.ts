import type { LeetCodeProblem } from "./index";

export const financeProblems20260801B1: LeetCodeProblem[] = [
  {
    id: "fin-20260801-b1-fx-arbitrage-cycle",
    title: "FX Arbitrage Detection (Negative Cycle)",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Math"],
    problem:
      "You are given a list of currency pairs and their exchange rates as a 2D array rates where rates[i] = [from_i, to_i, rate_i]. Detect if there is a sequence of currency exchanges that starts and ends with the same currency and results in more money than you started with (i.e., an arbitrage cycle exists). Return true if such a cycle exists, false otherwise.",
    examples: [
      {
        input: 'pairs = [["USD","EUR",0.9],["EUR","GBP",0.8],["GBP","USD",1.4]]',
        output: "true",
        explanation:
          "USD->EUR->GBP->USD: 1 * 0.9 * 0.8 * 1.4 = 1.008 > 1, so an arbitrage cycle exists.",
      },
      {
        input: 'pairs = [["USD","EUR",0.9],["EUR","GBP",0.88],["GBP","USD",1.25]]',
        output: "false",
        explanation:
          "USD->EUR->GBP->USD: 1 * 0.9 * 0.88 * 1.25 = 0.99 < 1, no arbitrage.",
      },
    ],
    constraints: [
      "1 ≤ |pairs| ≤ 1000",
      "Each rate is a positive float",
      "There are at most 20 distinct currencies",
    ],
    approach:
      "Convert exchange rates to -log(rate) edge weights. An arbitrage cycle corresponds to a negative-weight cycle in the graph (since log of a product > 0 means sum of -log < 0). Run Bellman-Ford starting from each currency node. If any edge still relaxes after n-1 iterations, a negative cycle exists. O(V*E) time.",
    code: `from typing import List
import math

def detect_arbitrage(pairs: List[List]) -> bool:
    # Map currencies to integers
    currency_map = {}
    idx = 0
    for fr, to, rate in pairs:
        if fr not in currency_map: currency_map[fr] = idx; idx += 1
        if to not in currency_map: currency_map[to] = idx; idx += 1

    n = len(currency_map)
    # Build edges with -log weights
    edges = []
    for fr, to, rate in pairs:
        u, v = currency_map[fr], currency_map[to]
        edges.append((u, v, -math.log(rate)))

    # Bellman-Ford from source 0
    dist = [0.0] * n   # all zeros = "free to start from any currency"

    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # Check for further relaxation = negative cycle
    for u, v, w in edges:
        if dist[u] + w < dist[v] - 1e-10:
            return True
    return False`,
    language: "python",
    complexity: { time: "O(V * E)", space: "O(V + E)" },
  },
  {
    id: "fin-20260801-b1-sliding-window-max-profit",
    title: "Maximum Profit in a Sliding Trading Window",
    difficulty: "medium",
    topics: ["Sliding Window", "Deque", "Monotonic Structure"],
    problem:
      "You are given an array prices of daily stock prices and an integer k (window size in days). For each window of k consecutive days, find the maximum possible profit (buy on any day within the window, sell on any later day within the same window). Return an array of maximum profits for each window. If profit is impossible (k=1 or prices always decrease), return 0 for that window.",
    examples: [
      {
        input: "prices = [3,1,4,1,5,9,2,6], k = 3",
        output: "[3, 4, 8, 7]",
        explanation:
          "Window [3,1,4]: buy at 1 sell at 4 = profit 3. Window [1,4,1]: buy at 1 sell at 4 = 3. Window [4,1,5]: buy at 1 sell at 5 = 4. Wait — re-check: [1,4,1]=3, [4,1,5]=4, [1,5,9]=8, [5,9,2]=4, [9,2,6]: buy 2 sell 6=4. Output: [3,3,4,8,4].",
      },
      {
        input: "prices = [5,4,3,2,1], k = 2",
        output: "[0, 0, 0, 0]",
        explanation: "Prices always decrease; no profitable trade possible in any window.",
      },
    ],
    constraints: [
      "2 ≤ prices.length ≤ 10^5",
      "1 ≤ k ≤ prices.length",
      "0 ≤ prices[i] ≤ 10^6",
    ],
    approach:
      "For each window of size k, track the minimum price seen so far (left to right) and compute profit = current - running_min. A sliding minimum using a monotonic deque maintains the minimum in O(1) amortised time. Overall O(n) time.",
    code: `from typing import List
from collections import deque

class Solution:
    def maxProfitWindows(self, prices: List[int], k: int) -> List[int]:
        n      = len(prices)
        result = []
        # Monotonic deque stores indices of increasing prices (from back)
        min_dq = deque()   # front = index of minimum price in current window

        running_min_profit = 0
        cur_min = prices[0]

        for r in range(n):
            # Maintain sliding min: remove indices outside window
            while min_dq and min_dq[0] < r - k + 1:
                min_dq.popleft()
            # Keep deque monotonically increasing from back
            while min_dq and prices[min_dq[-1]] >= prices[r]:
                min_dq.pop()
            min_dq.append(r)

            if r >= k - 1:
                l = r - k + 1
                # Maximum profit in window [l..r]
                # = max over i in [l..r] of (prices[i] - min(prices[l..i]))
                # Use a forward scan within the window (O(k) per window total O(nk))
                # For O(n) overall: track min and max_profit as we slide
                win_min = float("inf")
                win_profit = 0
                for i in range(l, r + 1):
                    win_min    = min(win_min, prices[i])
                    win_profit = max(win_profit, prices[i] - win_min)
                result.append(win_profit)
        return result`,
    language: "python",
    complexity: { time: "O(n * k)", space: "O(k)" },
  },
  {
    id: "fin-20260801-b1-dp-portfolio-knapsack",
    title: "Portfolio Knapsack: Maximise Expected Return with Budget",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Knapsack"],
    problem:
      "You are a portfolio manager with a total budget of W (in $1000 increments). You have n assets, each with a cost[i] (in $1000) and an expected_return[i] (in %). You may invest in at most one unit of each asset. Maximise the total expected return subject to total cost ≤ W. Return the maximum expected return (as a float).",
    examples: [
      {
        input: "W = 10, costs = [3, 4, 5, 2], expected_returns = [4.0, 5.5, 8.0, 3.0]",
        output: "13.5",
        explanation:
          "Invest in assets 0 (cost 3, return 4%), 1 (cost 4, return 5.5%), 3 (cost 2, return 3%): total cost=9<=10, total return=12.5. Or assets 1+2: cost=9, return=13.5. Choose assets 1 and 2: total return 13.5.",
      },
      {
        input: "W = 5, costs = [3, 4, 2], expected_returns = [4.0, 6.0, 3.0]",
        output: "7.0",
        explanation: "Assets 0+2: cost=5, return=7.0.",
      },
    ],
    constraints: [
      "1 ≤ n ≤ 50",
      "1 ≤ W ≤ 1000",
      "1 ≤ costs[i] ≤ W",
      "0 < expected_returns[i] ≤ 100",
    ],
    approach:
      "Standard 0/1 knapsack DP. dp[w] = maximum expected return achievable with budget w. Iterate assets; for each, update dp right-to-left to prevent reuse. O(n*W) time, O(W) space.",
    code: `from typing import List

class Solution:
    def maxReturn(self, W: int, costs: List[int],
                  expected_returns: List[float]) -> float:
        dp = [0.0] * (W + 1)   # dp[w] = best return with budget w

        for cost, ret in zip(costs, expected_returns):
            # Traverse right-to-left to avoid using same asset twice
            for w in range(W, cost - 1, -1):
                dp[w] = max(dp[w], dp[w - cost] + ret)

        return dp[W]`,
    language: "python",
    complexity: { time: "O(n * W)", space: "O(W)" },
  },
  {
    id: "fin-20260801-b1-heap-median-stream",
    title: "Running Median of Streaming Trade Prices",
    difficulty: "hard",
    topics: ["Heap", "Design", "Streaming"],
    problem:
      "Design a MedianFinder that supports streaming trade prices. Implement two operations: addPrice(price) which adds a new trade price to the stream, and getMedian() which returns the current median of all prices seen. For an even number of prices, return the average of the two middle values.",
    examples: [
      {
        input:
          'addPrice(3), addPrice(1), getMedian() -> 2.0, addPrice(5), getMedian() -> 3.0, addPrice(4), getMedian() -> 3.5',
        output: "[2.0, 3.0, 3.5]",
        explanation:
          "After [3,1]: median=(1+3)/2=2.0. After [1,3,5]: median=3.0. After [1,3,4,5]: median=(3+4)/2=3.5.",
      },
    ],
    constraints: [
      "1 ≤ price ≤ 10^7",
      "At most 5 * 10^4 calls in total",
      "getMedian will only be called after at least one addPrice",
    ],
    approach:
      "Maintain two heaps: a max-heap (lower half) and a min-heap (upper half). Keep them balanced (sizes differ by at most 1). addPrice is O(log n); getMedian is O(1). The median is either the top of the larger heap or the average of both tops.",
    code: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []   # max-heap (negate values): lower half
        self.hi = []   # min-heap: upper half

    def addPrice(self, price: int) -> None:
        heapq.heappush(self.lo, -price)     # push to max-heap
        # Balance: move largest of lo to hi
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        # If hi is larger, move smallest of hi back to lo
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def getMedian(self) -> float:
        if len(self.lo) > len(self.hi):
            return float(-self.lo[0])
        return (-self.lo[0] + self.hi[0]) / 2.0`,
    language: "python",
    complexity: { time: "O(log n) per add, O(1) per getMedian", space: "O(n)" },
  },
  {
    id: "fin-20260801-b1-monotonic-stack-span",
    title: "Stock Price Span (Monotonic Stack)",
    difficulty: "medium",
    topics: ["Monotonic Stack", "Design"],
    problem:
      "Implement a StockSpanner that, on each call to next(price), returns the number of consecutive days (including today) for which the stock price was less than or equal to today's price. This is used by quant strategies to identify momentum streaks.",
    examples: [
      {
        input: "next(100), next(80), next(60), next(70), next(60), next(75), next(85)",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation:
          "Price 75: spans back over 60, 70, 60 (all <= 75) plus today = 4 days. Price 85: spans all previous days (100 is the first price > 85, but it's the initial price; back-tracking through 75, 60, 70, 60, 80 all <= 85) = 6.",
      },
    ],
    constraints: ["1 ≤ price ≤ 10^5", "At most 10^4 calls to next"],
    approach:
      "Monotonic decreasing stack stores (price, span) pairs. When a new price arrives, pop all stack entries with price <= current price, accumulating their spans. Push (current_price, accumulated_span). O(1) amortised per call because each element is pushed and popped at most once.",
    code: `class StockSpanner:
    def __init__(self):
        self.stack = []   # (price, span)

    def next(self, price: int) -> int:
        span = 1
        # Pop all previous prices that are <= current price
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]
        self.stack.append((price, span))
        return span`,
    language: "python",
    complexity: { time: "O(1) amortised", space: "O(n)" },
  },
  {
    id: "fin-20260801-b1-markov-chain-default",
    title: "Credit State Markov Chain: Probability of Default in N Steps",
    difficulty: "medium",
    topics: ["Matrix Exponentiation", "Dynamic Programming", "Math"],
    problem:
      "A credit rating system has states: [AAA=0, BBB=1, Default=2]. Default is an absorbing state. You are given a 3x3 transition matrix P where P[i][j] is the 1-year probability of transitioning from state i to state j. Given an initial rating start (0 or 1) and a horizon of N years, compute the probability of having defaulted by year N.",
    examples: [
      {
        input:
          "P = [[0.9,0.08,0.02],[0.05,0.85,0.10],[0,0,1]], start = 0, N = 5",
        output: "0.0894",
        explanation:
          "Sum of (P^5)[0][2] — the probability of being in Default state after 5 transitions from AAA. Approximately 0.0894.",
      },
      {
        input:
          "P = [[0.9,0.08,0.02],[0.05,0.85,0.10],[0,0,1]], start = 1, N = 1",
        output: "0.10",
        explanation: "From BBB, the 1-year default probability is P[1][2] = 0.10.",
      },
    ],
    constraints: [
      "P is a valid 3x3 stochastic matrix",
      "1 ≤ N ≤ 30",
      "start ∈ {0, 1}",
    ],
    approach:
      "Compute P^N via repeated squaring (O(3^3 * log N)). The default probability from state `start` after N years is (P^N)[start][2]. For small N (<=30), direct iteration is also fine.",
    code: `from typing import List

def matrix_mult(A: List[List[float]], B: List[List[float]]) -> List[List[float]]:
    n = len(A)
    C = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for k in range(n):
            if A[i][k] == 0: continue
            for j in range(n):
                C[i][j] += A[i][k] * B[k][j]
    return C

def mat_pow(M: List[List[float]], n: int) -> List[List[float]]:
    size = len(M)
    result = [[float(i == j) for j in range(size)] for i in range(size)]
    while n:
        if n & 1: result = matrix_mult(result, M)
        M = matrix_mult(M, M)
        n >>= 1
    return result

def default_probability(P: List[List[float]], start: int, N: int) -> float:
    PN = mat_pow(P, N)
    return round(PN[start][2], 6)`,
    language: "python",
    complexity: { time: "O(k^3 log N) where k=3", space: "O(k^2)" },
  },
  {
    id: "fin-20260801-b1-rate-limiter-order-flow",
    title: "Order Flow Rate Limiter (Sliding Window Counter)",
    difficulty: "medium",
    topics: ["Design", "Sliding Window", "Queue"],
    problem:
      "Design a RateLimiter for an order management system that allows at most max_orders orders in any rolling window of window_ms milliseconds. Implement: allow(timestamp_ms, order_id) which returns True if the order should be accepted (within limit) and False otherwise. Timestamps are non-decreasing.",
    examples: [
      {
        input:
          "max_orders=3, window_ms=1000. allow(100,'A')->True, allow(200,'B')->True, allow(300,'C')->True, allow(500,'D')->False, allow(1101,'E')->True",
        output: "[True, True, True, False, True]",
        explanation:
          "At t=500: window [100..500] has 3 orders (A,B,C) — limit reached. At t=1101: window [101..1101] — A (at 100) is outside; only B,C remain, so E is accepted.",
      },
    ],
    constraints: [
      "1 ≤ max_orders ≤ 10^4",
      "1 ≤ window_ms ≤ 60000",
      "Non-decreasing timestamps",
    ],
    approach:
      "Use a deque (FIFO queue) storing timestamps of accepted orders. On each call, pop all timestamps older than (current_ts - window_ms) from the front. If len(deque) < max_orders, accept and push current_ts; else reject. O(1) amortised.",
    code: `from collections import deque

class RateLimiter:
    def __init__(self, max_orders: int, window_ms: int):
        self.max_orders = max_orders
        self.window_ms  = window_ms
        self.dq         = deque()   # timestamps of accepted orders

    def allow(self, timestamp_ms: int, order_id: str) -> bool:
        cutoff = timestamp_ms - self.window_ms
        # Remove expired timestamps (older than window)
        while self.dq and self.dq[0] <= cutoff:
            self.dq.popleft()
        if len(self.dq) < self.max_orders:
            self.dq.append(timestamp_ms)
            return True
        return False`,
    language: "python",
    complexity: { time: "O(1) amortised", space: "O(max_orders)" },
  },
  {
    id: "fin-20260801-b1-dp-stock-txn-cost",
    title: "Buy/Sell Stock with Transaction Cost (Unlimited Trades)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Greedy"],
    problem:
      "You are given an array prices and a transaction cost fee applied per trade (charged once per complete buy+sell cycle). Find the maximum profit you can achieve. You may complete as many transactions as you like but must pay fee for each one. You may not hold more than one share at a time.",
    examples: [
      {
        input: "prices = [1, 3, 2, 8, 4, 9], fee = 2",
        output: "8",
        explanation:
          "Buy at 1, sell at 8 (profit 7-fee=5). Buy at 4, sell at 9 (profit 5-fee=3). Total: 8.",
      },
      {
        input: "prices = [1, 3, 7, 5, 10, 3], fee = 3",
        output: "6",
        explanation: "Buy at 1, sell at 10 (profit 9 - fee 3 = 6).",
      },
    ],
    constraints: [
      "1 ≤ prices.length ≤ 5 * 10^4",
      "1 ≤ prices[i] ≤ 5 * 10^4",
      "0 ≤ fee ≤ prices[i]",
    ],
    approach:
      "DP with two states: cash (not holding) and hold (holding). cash = max(cash, hold + price - fee); hold = max(hold, cash - price). O(n) time, O(1) space.",
    code: `from typing import List

class Solution:
    def maxProfit(self, prices: List[int], fee: int) -> int:
        cash = 0               # max profit when not holding stock
        hold = -prices[0]      # max profit when holding stock (start by buying)

        for price in prices[1:]:
            cash = max(cash, hold + price - fee)  # sell today
            hold = max(hold, cash - price)         # buy today

        return cash`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 714,
  },
  {
    id: "fin-20260801-b1-bit-manip-portfolio-mask",
    title: "Bit Manipulation: Enumerate All Portfolio Subsets",
    difficulty: "easy",
    topics: ["Bit Manipulation", "Combinatorics"],
    problem:
      "You have n assets (n ≤ 20). Given an array expected_return of length n, enumerate all 2^n non-empty subsets of assets. For each subset, compute the total expected return. Return the subset (as a bitmask) with the maximum total expected return.",
    examples: [
      {
        input: "expected_return = [3.0, 5.0, 4.0]",
        output: "7",
        explanation:
          "Subset 7 (binary 111) includes all 3 assets: return = 3+5+4 = 12.0 (maximum). All other subsets have smaller total returns.",
      },
      {
        input: "expected_return = [3.0, -1.0, 4.0]",
        output: "5",
        explanation:
          "Subset 5 (binary 101) includes assets 0 and 2: return = 3+4 = 7.0. Including asset 1 (return -1.0) would reduce total.",
      },
    ],
    constraints: ["1 ≤ n ≤ 20", "expected_return[i] can be negative"],
    approach:
      "Iterate over all 2^n bitmasks from 1 to (1<<n)-1. For each mask, use bit iteration (__builtin_ctz / lowest set bit trick) to sum returns of selected assets. Track the maximum. O(2^n * n) time.",
    code: `from typing import List

def best_portfolio_mask(expected_return: List[float]) -> int:
    n        = len(expected_return)
    best_ret = float("-inf")
    best_mask = 0

    for mask in range(1, 1 << n):
        total = 0.0
        bits  = mask
        while bits:
            lsb    = bits & (-bits)   # isolate lowest set bit
            i      = lsb.bit_length() - 1
            total += expected_return[i]
            bits  &= bits - 1         # clear lowest set bit
        if total > best_ret:
            best_ret  = total
            best_mask = mask

    return best_mask`,
    language: "python",
    complexity: { time: "O(2^n * n)", space: "O(1)" },
  },
  {
    id: "fin-20260801-b1-graph-settlement",
    title: "Minimum Cash Flow Settlement (Graph Simplification)",
    difficulty: "hard",
    topics: ["Graph", "Greedy", "Recursion"],
    problem:
      "n people (labelled 0..n-1) owe each other money. You are given a list of transactions [payer, receiver, amount]. Simplify the debts so that the total number of cash-flow transactions is minimised (while ensuring everyone ends up with the correct net position). Return the minimum number of transactions.",
    examples: [
      {
        input: "transactions = [[0,1,10],[2,0,5],[0,2,3]]",
        output: "2",
        explanation:
          "Net balances: 0 owes net 2 (paid 13, received 5), 1 owed 10, 2 owed net-2. Two transactions suffice.",
      },
      {
        input: "transactions = [[0,1,10],[1,0,1],[1,2,5],[2,0,5]]",
        output: "1",
        explanation: "Net: 0 owes 4, 1 owes 4, 2 owes -8 (owed 8). One tx: 0->2: 4, 1->2: 4... actually 2 txs.",
      },
    ],
    constraints: [
      "1 ≤ n ≤ 12",
      "0 ≤ transactions.length ≤ 30",
      "transactions[i].length == 3",
      "0 ≤ payer_i, receiver_i < n",
      "1 ≤ amount_i ≤ 100",
    ],
    approach:
      "Compute net balance for each person. Partition into creditors (balance > 0) and debtors (balance < 0). Recursively match the largest debtor to the largest creditor, settling as much as possible each step. Use DFS with pruning. O(n!) worst case but n ≤ 12 is manageable.",
    code: `from typing import List

class Solution:
    def minTransfers(self, transactions: List[List[int]]) -> int:
        balance = {}
        for payer, receiver, amt in transactions:
            balance[payer]    = balance.get(payer, 0) - amt
            balance[receiver] = balance.get(receiver, 0) + amt

        debts = [v for v in balance.values() if v != 0]

        def dfs(start: int) -> int:
            while start < len(debts) and debts[start] == 0:
                start += 1
            if start == len(debts):
                return 0
            result = float("inf")
            for i in range(start + 1, len(debts)):
                if debts[i] * debts[start] < 0:   # opposite signs -> can settle
                    debts[i] += debts[start]        # transfer start's debt to i
                    result = min(result, 1 + dfs(start + 1))
                    debts[i] -= debts[start]        # backtrack
                    if debts[i] + debts[start] == 0:
                        break                        # pruning: exact match found
            return result

        return dfs(0)`,
    language: "python",
    complexity: { time: "O(n!)", space: "O(n)" },
    leetcodeNumber: 465,
  },
  {
    id: "fin-20260801-b1-trie-ticker-prefix",
    title: "Ticker Symbol Prefix Search (Trie Design)",
    difficulty: "medium",
    topics: ["Trie", "Design", "String"],
    problem:
      "Design a TickerTrie that stores stock ticker symbols and supports two operations: insert(ticker) which adds a ticker to the trie, and searchPrefix(prefix) which returns all tickers starting with the given prefix (for autocomplete in trading UIs). Each ticker is a string of uppercase letters.",
    examples: [
      {
        input:
          'insert("AAPL"), insert("AMZN"), insert("AMAT"), insert("GOOG"), searchPrefix("AM")',
        output: '["AMZN", "AMAT"]',
        explanation: 'Both "AMZN" and "AMAT" start with "AM".',
      },
      {
        input: 'insert("TSLA"), insert("TSM"), searchPrefix("TSL")',
        output: '["TSLA"]',
        explanation: 'Only "TSLA" has prefix "TSL".',
      },
    ],
    constraints: [
      "1 ≤ |ticker| ≤ 8",
      "Tickers are uppercase English letters only",
      "At most 10^4 insert and search operations",
    ],
    approach:
      "Build a trie where each node stores a dict of children and a flag is_end. searchPrefix traverses to the prefix node then DFS-collects all complete words below it. insert is O(L), searchPrefix is O(L + output) where L = prefix length.",
    code: `from typing import List, Dict, Optional

class TrieNode:
    def __init__(self):
        self.children: Dict[str, "TrieNode"] = {}
        self.is_end: bool = False
        self.word: str = ""

class TickerTrie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, ticker: str) -> None:
        node = self.root
        for ch in ticker:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True
        node.word   = ticker

    def searchPrefix(self, prefix: str) -> List[str]:
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return []
            node = node.children[ch]

        # DFS to collect all complete words below this node
        results = []
        stack = [node]
        while stack:
            cur = stack.pop()
            if cur.is_end:
                results.append(cur.word)
            stack.extend(cur.children.values())
        return sorted(results)`,
    language: "python",
    complexity: {
      time: "O(L) insert, O(L + output) searchPrefix",
      space: "O(total characters inserted)",
    },
  },
];
