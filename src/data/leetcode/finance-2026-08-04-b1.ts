import type { LeetCodeProblem } from "./index";

export const financeProblems20260804B1: LeetCodeProblem[] = [
  {
    id: "fin-20260804-b1-stock-cooldown",
    title: "Best Time to Buy and Sell Stock with Risk-Off Cooldown",
    difficulty: "medium",
    topics: ["Dynamic Programming", "State Machine"],
    problem:
      "You hold at most one position at a time. After you sell a stock you must wait exactly one day (risk-off cooldown) before you may buy again. Given an array of daily prices, return the maximum profit. You may complete as many transactions as you like subject to the cooldown rule.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation:
          "Buy at 1, sell at 3 (profit 2). Cooldown day. Buy at 0, sell at 2 (profit 1). Total = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
        explanation: "Only one price; no transaction possible.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "Model three states per day: hold (own stock), sold (just sold — in cooldown), rest (no stock, not in cooldown). Transitions each day: hold = max(hold, rest - price); sold = prev_hold + price; rest = max(rest, prev_sold). Final answer is max(sold, rest). O(n) time, O(1) space — no DP array needed.",
    code: `def max_profit_cooldown(prices):
    hold = float('-inf')
    sold = 0
    rest = 0
    for price in prices:
        prev_hold, prev_sold = hold, sold
        hold = max(hold, rest - price)
        sold = prev_hold + price
        rest = max(rest, prev_sold)
    return max(sold, rest)

assert max_profit_cooldown([1, 2, 3, 0, 2]) == 3
assert max_profit_cooldown([1]) == 0
assert max_profit_cooldown([2, 1]) == 0
assert max_profit_cooldown([6, 1, 3, 2, 4, 7]) == 6
print("All cooldown tests passed")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260804-b1-portfolio-knapsack",
    title: "Portfolio Construction Under Capital Constraint",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Knapsack"],
    problem:
      "You have an integer capital budget W and n investment opportunities. Opportunity i requires capital[i] units (integer) and yields expected_return[i] (float). Each opportunity may be taken at most once. Return the maximum total expected return without exceeding the budget W.",
    examples: [
      {
        input: "W=10, capital=[3,4,5,6], expected_return=[4.0,5.0,7.0,8.0]",
        output: "12.0",
        explanation:
          "Take opportunities 0 (cost 3, return 4.0) and 3 (cost 6, return 8.0): total cost 9 <= 10, total return 12.0.",
      },
    ],
    constraints: [
      "1 <= n <= 200",
      "1 <= W <= 1000",
      "1 <= capital[i] <= W",
      "0 < expected_return[i] <= 100.0",
    ],
    approach:
      "Classic 0-1 knapsack. dp[w] = maximum return achievable with exactly w capital units. For each item iterate w from W down to capital[i] to prevent reuse. Answer is max(dp).",
    code: `from typing import List

def portfolio_knapsack(W: int, capital: List[int], returns: List[float]) -> float:
    dp = [0.0] * (W + 1)
    for c, r in zip(capital, returns):
        for w in range(W, c - 1, -1):
            dp[w] = max(dp[w], dp[w - c] + r)
    return max(dp)

result = portfolio_knapsack(10, [3, 4, 5, 6], [4.0, 5.0, 7.0, 8.0])
assert abs(result - 12.0) < 1e-9, f"got {result}"

result2 = portfolio_knapsack(7, [3, 4, 5], [4.0, 5.0, 7.0])
assert abs(result2 - 9.0) < 1e-9, f"got {result2}"
print("Portfolio knapsack tests passed")`,
    language: "python",
    complexity: { time: "O(n * W)", space: "O(W)" },
  },
  {
    id: "fin-20260804-b1-next-resistance",
    title: "Next Price Resistance Level (Monotonic Stack)",
    difficulty: "medium",
    topics: ["Monotonic Stack", "Array"],
    problem:
      "Given an array of daily closing prices, for each day i find the next day j > i where prices[j] > prices[i] (the next resistance level). If no such day exists, output -1 for that day. This is the finance analogue of the classic 'Next Greater Element' problem.",
    examples: [
      {
        input: "prices = [73, 74, 75, 71, 69, 72, 76, 73]",
        output: "[74, 75, 76, 72, 72, 76, -1, -1]",
        explanation:
          "Day 0 (73): next higher is 74 (day 1). Day 6 (76): no higher price follows, so -1.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^5",
    ],
    approach:
      "Maintain a monotonic decreasing stack of indices. When processing price[i], pop all stack entries whose price is less than prices[i] — those entries have found their next resistance at i. Push i onto the stack. Unpopped entries at the end get -1.",
    code: `from typing import List

def next_resistance(prices: List[int]) -> List[int]:
    n = len(prices)
    result = [-1] * n
    stack: List[int] = []  # indices, prices decreasing top-to-bottom
    for i in range(n):
        while stack and prices[stack[-1]] < prices[i]:
            result[stack.pop()] = prices[i]
        stack.append(i)
    return result

prices = [73, 74, 75, 71, 69, 72, 76, 73]
assert next_resistance(prices) == [74, 75, 76, 72, 72, 76, -1, -1]
assert next_resistance([5, 4, 3, 2, 1]) == [-1, -1, -1, -1, -1]
assert next_resistance([1, 2, 3, 4, 5]) == [2, 3, 4, 5, -1]
print("Next resistance tests passed")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260804-b1-zero-beta-pairs",
    title: "Zero-Beta Pair Hedging via Two Pointers",
    difficulty: "easy",
    topics: ["Two Pointers", "Sorting"],
    problem:
      "Given an array of asset betas (floats), find all index pairs (i, j) where i < j and betas[i] + betas[j] == 0 (within tolerance 1e-9). A zero-net-beta pair is perfectly market-neutral and forms a natural hedge. Return all such pairs as (i, j) tuples using the original indices.",
    examples: [
      {
        input: "betas = [0.5, -0.5, 1.2, -1.2, 0.8]",
        output: "[(0, 1), (2, 3)]",
        explanation:
          "betas[0]+betas[1]=0 and betas[2]+betas[3]=0. Asset 4 (beta 0.8) has no zero partner.",
      },
    ],
    constraints: [
      "1 <= n <= 10^4",
      "-10 <= betas[i] <= 10",
      "Values are given to at most 6 decimal places",
    ],
    approach:
      "Create (beta, original_index) pairs and sort by beta. Use two pointers lo and hi. If sum < -tol advance lo; if sum > tol retreat hi; if |sum| <= tol record the pair and advance both. Handle duplicates by collecting all matching pairs at equal values.",
    code: `from typing import List, Tuple

def zero_beta_pairs(betas: List[float], tol: float = 1e-9) -> List[Tuple[int, int]]:
    indexed = sorted(enumerate(betas), key=lambda x: x[1])
    lo, hi = 0, len(indexed) - 1
    pairs = []
    while lo < hi:
        s = indexed[lo][1] + indexed[hi][1]
        if s < -tol:
            lo += 1
        elif s > tol:
            hi -= 1
        else:
            i, j = indexed[lo][0], indexed[hi][0]
            pairs.append((min(i, j), max(i, j)))
            lo += 1
            hi -= 1
    return sorted(pairs)

result = zero_beta_pairs([0.5, -0.5, 1.2, -1.2, 0.8])
assert result == [(0, 1), (2, 3)], f"got {result}"
assert zero_beta_pairs([1.0, 2.0, 3.0]) == []
print("Zero-beta pair tests passed")`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260804-b1-fx-arbitrage",
    title: "Detect FX Arbitrage via Bellman-Ford Negative Cycle",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Shortest Path"],
    problem:
      "You are given n currencies and an n×n matrix rates where rates[i][j] is the exchange rate from currency i to currency j (0 if no direct exchange exists). An arbitrage opportunity exists if you can start with 1 unit of some currency, perform a sequence of exchanges, and end with more than 1 unit of the same currency. Determine whether any arbitrage opportunity exists.",
    examples: [
      {
        input:
          "rates = [[1,1.2,0],[0,1,0.9],[1.05,0,1]] (USD->EUR=1.2, EUR->GBP=0.9, GBP->USD=1.05)",
        output: "True",
        explanation:
          "1 USD -> 1.2 EUR -> 1.08 GBP -> 1.134 USD. Since 1.134 > 1, arbitrage exists.",
      },
    ],
    constraints: [
      "2 <= n <= 100",
      "0 <= rates[i][j] <= 1000",
      "rates[i][i] = 1 for all i",
    ],
    approach:
      "Take -log of each rate to convert products to sums. A profitable cycle (product > 1) becomes a negative-weight cycle (sum < 0) in the transformed graph. Run Bellman-Ford for n-1 relaxations; if any edge still relaxes on the n-th pass, a negative cycle (arbitrage) exists.",
    code: `import math
from typing import List

def detect_fx_arbitrage(rates: List[List[float]]) -> bool:
    n = len(rates)
    edges = []
    for i in range(n):
        for j in range(n):
            if i != j and rates[i][j] > 0:
                edges.append((i, j, -math.log(rates[i][j])))

    INF = float('inf')
    dist = [INF] * n
    dist[0] = 0.0

    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    for u, v, w in edges:
        if dist[u] + w < dist[v] - 1e-10:
            return True
    return False

# USD->EUR->GBP->USD: 1.2 * 0.9 * 1.05 = 1.134 > 1
rates = [[1.0, 1.2, 0.0], [0.0, 1.0, 0.9], [1.05, 0.0, 1.0]]
assert detect_fx_arbitrage(rates) is True

# No arbitrage: rates are inverses
rates2 = [[1.0, 2.0], [0.5, 1.0]]
assert detect_fx_arbitrage(rates2) is False
print("FX arbitrage tests passed")`,
    language: "python",
    complexity: { time: "O(n^3)", space: "O(n^2)" },
  },
  {
    id: "fin-20260804-b1-markov-steady-state",
    title: "Credit Rating Steady-State via Power Iteration",
    difficulty: "medium",
    topics: ["Math", "Linear Algebra", "Probability"],
    problem:
      "A credit rating agency models rating transitions with a row-stochastic matrix P where P[i][j] is the probability of transitioning from rating i to rating j in one period. Given P and an initial distribution vector v0, compute the steady-state (stationary) distribution π where π = π * P using power iteration. The absorbing 'Default' state means the stationary distribution may be concentrated there.",
    examples: [
      {
        input: "P = [[0.9, 0.09, 0.01], [0.05, 0.9, 0.05], [0.0, 0.0, 1.0]]",
        output: "[0.0, 0.0, 1.0]",
        explanation:
          "Default is an absorbing state; all probability mass eventually flows there.",
      },
    ],
    constraints: [
      "2 <= n <= 50",
      "P is row-stochastic: all P[i][j] >= 0 and each row sums to 1",
      "Power iteration converges within 10000 iterations for well-conditioned matrices",
    ],
    approach:
      "Start with a uniform distribution. Repeatedly apply v = v * P (left-multiply the distribution row vector by the transition matrix). Stop when the L-inf norm of the change drops below tolerance. For ergodic chains this converges to the unique stationary distribution.",
    code: `from typing import List

def markov_steady_state(
    P: List[List[float]],
    max_iters: int = 10000,
    tol: float = 1e-12,
) -> List[float]:
    n = len(P)
    v = [1.0 / n] * n
    for _ in range(max_iters):
        new_v = [sum(v[i] * P[i][j] for i in range(n)) for j in range(n)]
        if max(abs(new_v[j] - v[j]) for j in range(n)) < tol:
            return new_v
        v = new_v
    return v

P = [
    [0.9, 0.09, 0.01],
    [0.05, 0.9,  0.05],
    [0.0,  0.0,  1.0 ],
]
pi = markov_steady_state(P)
# Default absorbs everything
assert abs(pi[2] - 1.0) < 1e-6, f"Default prob: {pi[2]}"

# Ergodic 2-state chain
P2 = [[0.7, 0.3], [0.4, 0.6]]
pi2 = markov_steady_state(P2)
# Stationary: pi[0]*0.3 = pi[1]*0.4 => pi[0]=4/7, pi[1]=3/7
assert abs(pi2[0] - 4/7) < 1e-8
print("Markov steady-state tests passed")`,
    language: "python",
    complexity: { time: "O(k * n^2) k=iterations", space: "O(n)" },
  },
  {
    id: "fin-20260804-b1-risk-budget-bitmask",
    title: "Maximum Return Portfolio Under Risk Budget (Bitmask Enumeration)",
    difficulty: "medium",
    topics: ["Bit Manipulation", "Enumeration", "Greedy"],
    problem:
      "You have n assets (n <= 20). Asset i has expected_return[i] and standalone_risk[i] (both floats). You want to select a subset of assets such that the sum of standalone risks does not exceed a budget R, and total expected return is maximized. Risks are assumed additive (no diversification). Return the maximum achievable expected return.",
    examples: [
      {
        input:
          "returns=[0.12, 0.18, 0.08, 0.22], risks=[0.05, 0.10, 0.03, 0.15], R=0.20",
        output: "0.38",
        explanation:
          "Select assets 0, 1, 2: risk=0.18<=0.20, return=0.38. Adding asset 3 would push risk to 0.33>0.20.",
      },
    ],
    constraints: [
      "1 <= n <= 20",
      "0 < standalone_risk[i] <= 1.0",
      "0 < expected_return[i] <= 1.0",
      "0 < R <= n",
    ],
    approach:
      "Enumerate all 2^n subsets via bitmask. For each mask, sum risks and check against R; track maximum return. O(2^n * n) — feasible for n<=20 (~20M ops). For n>20 use 0-1 knapsack with discretised risk.",
    code: `from typing import List

def max_return_risk_budget(
    returns: List[float], risks: List[float], budget: float
) -> float:
    n = len(returns)
    best = 0.0
    for mask in range(1 << n):
        total_risk = sum(risks[i] for i in range(n) if (mask >> i) & 1)
        if total_risk <= budget + 1e-12:
            total_ret = sum(returns[i] for i in range(n) if (mask >> i) & 1)
            if total_ret > best:
                best = total_ret
    return best

rets  = [0.12, 0.18, 0.08, 0.22]
risks = [0.05, 0.10, 0.03, 0.15]
result = max_return_risk_budget(rets, risks, 0.20)
assert abs(result - 0.38) < 1e-9, f"got {result}"

# Empty selection beats budget=0
assert max_return_risk_budget([0.1], [0.5], 0.3) == 0.0
print("Risk budget bitmask tests passed")`,
    language: "python",
    complexity: { time: "O(2^n * n)", space: "O(1)" },
  },
  {
    id: "fin-20260804-b1-order-matcher",
    title: "Order Matching Engine with Partial Fills",
    difficulty: "hard",
    topics: ["Design", "Heap", "Two Heaps"],
    problem:
      "Design a price-time priority order matching engine. Implement add_buy(price, qty) and add_sell(price, qty). When a new order arrives, immediately match it against resting orders on the opposite side at overlapping prices, producing partial fills if quantities differ. Maintain separate buy (max-heap) and sell (min-heap) order books. Return a list of (fill_price, fill_qty) tuples produced by the match.",
    examples: [
      {
        input:
          "add_sell(100.0, 10); add_buy(101.0, 7); add_buy(99.0, 5); add_sell(98.0, 3)",
        output: "fills: [(100.0, 7), (99.0, 3)]",
        explanation:
          "Buy at 101 matches resting sell at 100 for 7 shares. Buy at 99 rests. New sell at 98 matches resting buy at 99 for 3 shares.",
      },
    ],
    constraints: [
      "0 < price <= 10^6",
      "1 <= qty <= 10^6",
      "At most 10^4 add calls",
    ],
    approach:
      "Buy book = max-heap on price (negate for Python heapq). Sell book = min-heap. After each add, repeatedly check if best-buy >= best-sell; if so, fill min(buy_qty, sell_qty) at the sell (maker) price and update or remove the touched orders.",
    code: `import heapq
from typing import List, Tuple

class OrderMatchingEngine:
    def __init__(self):
        self._buys: List[Tuple]  = []  # (-price, qty, oid)
        self._sells: List[Tuple] = []  # (price, qty, oid)
        self.fills: List[Tuple[float, int]] = []
        self._oid = 0

    def add_buy(self, price: float, qty: int) -> None:
        heapq.heappush(self._buys, (-price, qty, self._oid))
        self._oid += 1
        self._match()

    def add_sell(self, price: float, qty: int) -> None:
        heapq.heappush(self._sells, (price, qty, self._oid))
        self._oid += 1
        self._match()

    def _match(self):
        while self._buys and self._sells:
            neg_bp, bqty, bid = self._buys[0]
            sp, sqty, sid     = self._sells[0]
            if -neg_bp < sp:
                break
            fill_qty = min(bqty, sqty)
            self.fills.append((sp, fill_qty))
            heapq.heappop(self._buys)
            heapq.heappop(self._sells)
            if bqty > fill_qty:
                heapq.heappush(self._buys, (neg_bp, bqty - fill_qty, bid))
            if sqty > fill_qty:
                heapq.heappush(self._sells, (sp, sqty - fill_qty, sid))

eng = OrderMatchingEngine()
eng.add_sell(100.0, 10)
eng.add_buy(101.0, 7)
eng.add_buy(99.0, 5)
eng.add_sell(98.0, 3)
assert eng.fills == [(100.0, 7), (99.0, 3)], f"got {eng.fills}"
print("Order matching engine tests passed")`,
    language: "python",
    complexity: { time: "O(m log n) per operation", space: "O(n)" },
  },
  {
    id: "fin-20260804-b1-merge-order-books",
    title: "Merge K Sorted Exchange Order Books",
    difficulty: "medium",
    topics: ["Heap", "Merge K Sorted Lists"],
    problem:
      "You receive order books from K exchanges. Each book is a list of (price, qty) tuples sorted in ascending price order. Merge all K books into a single sorted order book (ascending by price). If the same price appears in multiple books, preserve all entries (do not aggregate quantities — each exchange's order is independent).",
    examples: [
      {
        input:
          "books = [[(97.0,50),(99.0,200)], [(98.0,100),(100.0,150)], [(96.0,75),(101.0,50)]]",
        output:
          "[(96.0,75),(97.0,50),(98.0,100),(99.0,200),(100.0,150),(101.0,50)]",
        explanation: "Interleave three sorted lists in ascending price order.",
      },
    ],
    constraints: [
      "1 <= K <= 500",
      "1 <= total entries <= 10^5",
      "Prices are positive floats",
    ],
    approach:
      "Min-heap of tuples (price, qty, book_index, position_in_book). Initialize with the first element of each non-empty book. Pop the minimum, emit it, and push the next element from the same book if one exists. Classic K-way merge.",
    code: `import heapq
from typing import List, Tuple

def merge_order_books(
    books: List[List[Tuple[float, int]]]
) -> List[Tuple[float, int]]:
    heap: List[Tuple] = []
    for bi, book in enumerate(books):
        if book:
            price, qty = book[0]
            heapq.heappush(heap, (price, qty, bi, 0))
    result: List[Tuple[float, int]] = []
    while heap:
        price, qty, bi, pos = heapq.heappop(heap)
        result.append((price, qty))
        if pos + 1 < len(books[bi]):
            np_, nq = books[bi][pos + 1]
            heapq.heappush(heap, (np_, nq, bi, pos + 1))
    return result

books = [
    [(97.0, 50),  (99.0, 200)],
    [(98.0, 100), (100.0, 150)],
    [(96.0, 75),  (101.0, 50)],
]
merged = merge_order_books(books)
expected = [(96.0,75),(97.0,50),(98.0,100),(99.0,200),(100.0,150),(101.0,50)]
assert merged == expected, f"got {merged}"
print("Merge order books tests passed")`,
    language: "python",
    complexity: { time: "O(N log K)", space: "O(K)" },
  },
  {
    id: "fin-20260804-b1-stock-with-fee",
    title: "Maximize Profit Subject to Bid-Ask Spread (Transaction Fee)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Greedy"],
    problem:
      "You are given an array of daily stock prices and a transaction fee (representing the bid-ask spread paid per trade). You may complete as many transactions as you like but must pay the fee each time you sell. You hold at most one share at a time. Return the maximum net profit after all fees.",
    examples: [
      {
        input: "prices = [1, 3, 2, 8, 4, 9], fee = 2",
        output: "8",
        explanation:
          "Buy at 1, sell at 8 (profit 8-1-2=5). Buy at 4, sell at 9 (profit 9-4-2=3). Total = 8.",
      },
      {
        input: "prices = [1, 3, 7, 5, 10, 3], fee = 3",
        output: "6",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5 * 10^4",
      "1 <= prices[i] <= 5 * 10^4",
      "0 <= fee <= 5 * 10^4",
    ],
    approach:
      "Two states: cash (not holding, profit so far) and hold (holding, profit after buying). Each day: cash = max(cash, hold + price - fee); hold = max(hold, cash - price). Fee is deducted at sell time. O(n) time, O(1) space.",
    code: `from typing import List

def max_profit_with_fee(prices: List[int], fee: int) -> int:
    cash = 0
    hold = -prices[0]
    for price in prices[1:]:
        cash = max(cash, hold + price - fee)
        hold = max(hold, cash - price)
    return cash

assert max_profit_with_fee([1, 3, 2, 8, 4, 9], 2) == 8
assert max_profit_with_fee([1, 3, 7, 5, 10, 3], 3) == 6
assert max_profit_with_fee([1], 0) == 0
assert max_profit_with_fee([5, 4, 3, 2, 1], 1) == 0
print("Stock with fee tests passed")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 714,
  },
];
