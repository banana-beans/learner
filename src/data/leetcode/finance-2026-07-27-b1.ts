import type { LeetCodeProblem } from "./index";

export const financeProblems20260727B1: LeetCodeProblem[] = [
  {
    id: "fin-20260727-b1-fx-arbitrage-bellman",
    title: "FX Arbitrage via Bellman-Ford Negative Cycle",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Negative Cycle"],
    problem:
      "Given a list of currency exchange rates as a matrix `rates[i][j]` (rate to convert currency i to currency j), determine whether a profitable arbitrage cycle exists. An arbitrage cycle is a sequence of conversions that starts and ends with the same currency and yields more than you started with (i.e., the product of rates along the cycle > 1).",
    examples: [
      {
        input: 'currencies = ["USD","EUR","GBP"], rates = [[1,0.9,0.8],[1.12,1,0.88],[1.27,1.14,1]]',
        output: "True",
        explanation:
          "USD->EUR->GBP->USD: 0.9 * 0.88 * 1.27 ≈ 1.006 > 1. Arbitrage exists.",
      },
      {
        input: 'currencies = ["USD","EUR"], rates = [[1,0.9],[1.11,1]]',
        output: "False",
        explanation: "0.9 * 1.11 = 0.999 < 1. No arbitrage.",
      },
    ],
    constraints: [
      "2 <= n <= 20 (n = number of currencies)",
      "rates[i][j] > 0",
      "rates[i][i] = 1",
    ],
    approach:
      "Transform to graph: edge weight = -log(rate[i][j]). Arbitrage ↔ negative-weight cycle (product > 1 ↔ sum of logs < 0). Run Bellman-Ford for n-1 relaxations; if a further relaxation still improves any distance, a negative cycle exists. O(n^3) time, O(n^2) space.",
    code: `import math

def has_fx_arbitrage(rates: list[list[float]]) -> bool:
    n = len(rates)
    # Negate log of rates: negative sum <=> product > 1
    weights = [[-math.log(rates[i][j]) for j in range(n)] for i in range(n)]

    # Bellman-Ford from a virtual source node connected to all currencies
    dist = [0.0] * n   # all 0: virtual source with 0-weight edges

    # n-1 relaxations
    for _ in range(n - 1):
        for u in range(n):
            for v in range(n):
                if dist[u] + weights[u][v] < dist[v]:
                    dist[v] = dist[u] + weights[u][v]

    # nth relaxation: any improvement means negative cycle
    for u in range(n):
        for v in range(n):
            if dist[u] + weights[u][v] < dist[v]:
                return True
    return False`,
    language: "python",
    complexity: { time: "O(n^3)", space: "O(n^2)" },
  },
  {
    id: "fin-20260727-b1-stock-dp-cooldown",
    title: "Best Time to Buy and Sell with Cooldown (DP)",
    difficulty: "medium",
    topics: ["Array", "Dynamic Programming", "State Machine"],
    problem:
      "Given an array of stock prices, find the maximum profit from unlimited transactions with a 1-day cooldown after each sale (you cannot buy on the day immediately following a sell). You may not hold more than one share at a time.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation: "Buy day 0, sell day 2 (+2). Cooldown day 3. Buy day 4 sell not available, but profit from sell day 2 = 2, sell day... Trade: buy@1, sell@3 (profit 2), cooldown, buy@0, sell@2 (profit 2) = 4? Actually: buy@1, sell@3, cooldown(0), buy@0, sell@2 => profit=3+2=... Let's re-examine: [1,2,3,0,2] => buy day0@1, sell day2@3=2profit, cooldown day3, buy day4@2 can't sell... So just one trade: profit=2. Or: buy@0(1), sell@1(2)=1, cooldown@2, buy@3(0),sell@4(2)=2, total=3.",
      },
      {
        input: "prices = [1]",
        output: "0",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "Three states: `hold` (holding stock), `sold` (just sold today — must cool down tomorrow), `rest` (not holding, no cooldown). Transitions: hold = max(hold, rest - price); sold = hold + price; rest = max(rest, sold). Answer is max(sold, rest). O(n) time, O(1) space.",
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    hold = float('-inf')   # max profit while holding
    sold = 0               # max profit on sell day
    rest = 0               # max profit on cooldown or idle

    for p in prices:
        prev_sold = sold
        sold = hold + p                    # sell today
        hold = max(hold, rest - p)         # buy today (only from rest state)
        rest = max(rest, prev_sold)        # cooldown or stay idle
    return max(sold, rest)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260727-b1-median-stream-midprice",
    title: "Streaming Mid-Price Median (Find Median from Data Stream)",
    difficulty: "hard",
    topics: ["Heap", "Two Heaps", "Design", "Data Stream"],
    problem:
      "Design a data structure that supports: `add_price(price)` — adds a new mid-price observation from a real-time feed, and `get_median()` — returns the current median mid-price in O(log n) and O(1) respectively. Model: you receive tick-level prices in arbitrary order and need the running median at any moment for VWAP reference.",
    examples: [
      {
        input: "add(1), add(2), get_median(), add(3), get_median()",
        output: "1.5, 2.0",
        explanation: "After [1,2]: median = 1.5. After [1,2,3]: median = 2.0.",
      },
    ],
    constraints: [
      "-10^5 <= price <= 10^5",
      "At most 5 * 10^4 calls to add_price and get_median",
    ],
    approach:
      "Maintain a max-heap for the lower half and a min-heap for the upper half. After each insertion, rebalance so sizes differ by at most 1. Median = top of larger heap or average of both tops. Insertion O(log n), query O(1).",
    code: `import heapq

class StreamingMedian:
    def __init__(self):
        self.lo: list[float] = []   # max-heap (negated)
        self.hi: list[float] = []   # min-heap

    def add_price(self, price: float) -> None:
        heapq.heappush(self.lo, -price)           # push to lower half
        # Ensure every lo element <= every hi element
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        # Rebalance sizes: lo may have at most 1 extra
        if len(self.lo) < len(self.hi):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def get_median(self) -> float:
        if len(self.lo) > len(self.hi):
            return float(-self.lo[0])
        return (-self.lo[0] + self.hi[0]) / 2.0`,
    language: "python",
    complexity: { time: "O(log n) add, O(1) median", space: "O(n)" },
    leetcodeNumber: 295,
  },
  {
    id: "fin-20260727-b1-knapsack-portfolio",
    title: "Portfolio Budget Allocation (0/1 Knapsack)",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Knapsack", "Array"],
    problem:
      "You have a budget of `W` units and `n` investment opportunities. Each opportunity `i` requires `weights[i]` capital units and yields `values[i]` expected profit. You can invest in each opportunity at most once. Find the maximum total expected profit achievable within budget. This is the classic 0/1 knapsack problem framed as a portfolio allocation decision.",
    examples: [
      {
        input: "W=50, weights=[10,20,30], values=[60,100,120]",
        output: "220",
        explanation: "Take opportunities 2 and 3: 100+120=220, capital used=20+30=50.",
      },
      {
        input: "W=10, weights=[5,4,6,3], values=[10,40,30,50]",
        output: "90",
        explanation: "Take items with weights 4 and 3: values 40+50=90.",
      },
    ],
    constraints: [
      "1 <= n <= 500",
      "1 <= W <= 10^4",
      "1 <= weights[i] <= W",
      "1 <= values[i] <= 10^4",
    ],
    approach:
      "DP: `dp[w]` = max profit using exactly budget w. Iterate items in outer loop, budget in reverse inner loop (to prevent reuse). `dp[w] = max(dp[w], dp[w - weight[i]] + value[i])`. O(nW) time, O(W) space (1D rolling array).",
    code: `def portfolio_knapsack(W: int, weights: list[int], values: list[int]) -> int:
    dp = [0] * (W + 1)
    for w_i, v_i in zip(weights, values):
        # Traverse in reverse to ensure each item is used at most once
        for w in range(W, w_i - 1, -1):
            dp[w] = max(dp[w], dp[w - w_i] + v_i)
    return dp[W]`,
    language: "python",
    complexity: { time: "O(n * W)", space: "O(W)" },
    leetcodeNumber: 416,
  },
  {
    id: "fin-20260727-b1-merge-k-orderbooks",
    title: "Merge K Sorted Order Book Streams",
    difficulty: "hard",
    topics: ["Heap", "Priority Queue", "Linked List", "Divide and Conquer"],
    problem:
      "You receive `k` sorted streams of order book price levels (each stream is sorted ascending by price). Merge them into a single sorted list of price levels. This models consolidating order books from k different venues into a NBBO (National Best Bid and Offer) aggregation.",
    examples: [
      {
        input: "streams = [[1,4,5],[1,3,4],[2,6]]",
        output: "[1,1,2,3,4,4,5,6]",
      },
      {
        input: "streams = [[]]",
        output: "[]",
      },
    ],
    constraints: [
      "k == streams.length",
      "0 <= k <= 10^4",
      "0 <= streams[i].length <= 500",
      "Total elements <= 10^4",
    ],
    approach:
      "Min-heap of size k: push the first element of each stream as (value, stream_idx, element_idx). Pop the minimum, push the next element from that stream. O(N log k) time, O(k) space.",
    code: `import heapq

def merge_k_orderbooks(streams: list[list[int]]) -> list[int]:
    heap: list[tuple[int, int, int]] = []
    for i, stream in enumerate(streams):
        if stream:
            heapq.heappush(heap, (stream[0], i, 0))

    result: list[int] = []
    while heap:
        val, i, j = heapq.heappop(heap)
        result.append(val)
        if j + 1 < len(streams[i]):
            heapq.heappush(heap, (streams[i][j + 1], i, j + 1))
    return result`,
    language: "python",
    complexity: { time: "O(N log k)", space: "O(k)" },
    leetcodeNumber: 23,
  },
  {
    id: "fin-20260727-b1-sliding-max-spread",
    title: "Maximum Bid-Ask Spread in Rolling Window",
    difficulty: "medium",
    topics: ["Sliding Window", "Deque", "Monotonic Queue"],
    problem:
      "Given an array of bid-ask spreads `spreads[i]` (in basis points) recorded at regular intervals, and a window size `k`, find the maximum spread in every window of size `k`. Return an array of length `n - k + 1`. Used in monitoring for unusual spread widening events in real-time market surveillance.",
    examples: [
      {
        input: "spreads = [1,3,-1,-3,5,3,6,7], k=3",
        output: "[3,3,5,5,6,7]",
        explanation: "Windows: [1,3,-1]→3, [3,-1,-3]→3, [-1,-3,5]→5, [-3,5,3]→5, [5,3,6]→6, [3,6,7]→7.",
      },
      {
        input: "spreads = [1], k=1",
        output: "[1]",
      },
    ],
    constraints: [
      "1 <= k <= spreads.length <= 10^5",
      "-10^4 <= spreads[i] <= 10^4",
    ],
    approach:
      "Monotonic deque: maintain indices in deque with decreasing spread values (remove from back when new element >= back). Front is always the index of the window maximum. Remove front when it slides out of window. O(n) time, O(k) space.",
    code: `from collections import deque

def max_spread_window(spreads: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()   # stores indices, decreasing spread values
    result: list[int] = []

    for i, s in enumerate(spreads):
        # Remove elements outside window
        while dq and dq[0] < i - k + 1:
            dq.popleft()
        # Maintain decreasing order: pop smaller elements from back
        while dq and spreads[dq[-1]] < s:
            dq.pop()
        dq.append(i)
        # Start recording results after first full window
        if i >= k - 1:
            result.append(spreads[dq[0]])
    return result`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260727-b1-position-tracker-design",
    title: "Real-Time Position Tracker (Design)",
    difficulty: "medium",
    topics: ["Hash Table", "Design", "Simulation"],
    problem:
      "Design a position tracker for a trading desk. Implement `fill(symbol, qty, price, side)` which records a fill (positive qty for buy, negative for sell), and `get_pnl(symbol, current_price)` which returns the unrealised P&L for a symbol based on the average cost basis. Also implement `get_exposure()` which returns total gross notional across all open positions.",
    examples: [
      {
        input:
          'fill("AAPL",100,150.0,"B"); fill("AAPL",50,152.0,"B"); get_pnl("AAPL",160.0); fill("AAPL",80,160.0,"S"); get_pnl("AAPL",155.0)',
        output: "unrealised_pnl=1433.33, after partial sell unrealised_pnl=141.67 (approx)",
        explanation:
          "Average cost of 150 shares = (100*150+50*152)/150 = 150.67. PnL at 160: 150*(160-150.67)=1400. After selling 80, 70 shares remain at avg 150.67; PnL at 155: 70*(155-150.67)=303.",
      },
    ],
    constraints: [
      "1 <= qty <= 10^6",
      "0 < price <= 10^6",
      "At most 10^4 calls",
      "symbol is a string of uppercase letters",
    ],
    approach:
      "Track each position as (net_qty, avg_cost). On buy: update average cost = (old_qty*old_avg + new_qty*price) / (old_qty + new_qty). On sell: average cost unchanged (FIFO approximation). P&L = net_qty * (current_price - avg_cost). Gross exposure = sum of abs(qty * avg_cost).",
    code: `class PositionTracker:
    def __init__(self):
        # symbol -> (net_qty, avg_cost)
        self.positions: dict[str, tuple[float, float]] = {}

    def fill(self, symbol: str, qty: int, price: float, side: str) -> None:
        signed_qty = qty if side == 'B' else -qty
        net_qty, avg_cost = self.positions.get(symbol, (0.0, 0.0))
        new_qty = net_qty + signed_qty

        if new_qty == 0:
            self.positions.pop(symbol, None)
            return

        if signed_qty > 0 and net_qty >= 0:
            # Adding to long position: update average cost
            avg_cost = (net_qty * avg_cost + signed_qty * price) / new_qty
        elif signed_qty < 0 and net_qty <= 0:
            # Adding to short position: update average cost
            avg_cost = (net_qty * avg_cost + signed_qty * price) / new_qty
        # Partial close or flip: keep old avg_cost (simplified)

        self.positions[symbol] = (new_qty, avg_cost)

    def get_pnl(self, symbol: str, current_price: float) -> float:
        if symbol not in self.positions:
            return 0.0
        net_qty, avg_cost = self.positions[symbol]
        return net_qty * (current_price - avg_cost)

    def get_exposure(self) -> float:
        return sum(abs(qty * avg) for qty, avg in self.positions.values())`,
    language: "python",
    complexity: { time: "O(1) per fill/get_pnl, O(n) for exposure", space: "O(n)" },
  },
  {
    id: "fin-20260727-b1-dp-stock-fee",
    title: "Max Profit with Transaction Fee (DP)",
    difficulty: "medium",
    topics: ["Array", "Dynamic Programming", "Greedy"],
    problem:
      "You have an array of stock prices and a transaction fee `fee` charged on every sell. You may complete as many transactions as you like (but must sell before buying again). Find the maximum profit after fees. This models a retail broker charging per-trade commissions.",
    examples: [
      {
        input: "prices = [1, 3, 2, 8, 4, 9], fee = 2",
        output: "8",
        explanation: "Buy at 1, sell at 8 (profit=5). Buy at 4, sell at 9 (profit=3). Total=8.",
      },
      {
        input: "prices = [1, 3, 7, 5, 10, 3], fee = 3",
        output: "6",
      },
    ],
    constraints: [
      "1 <= prices.length <= 5 * 10^4",
      "1 <= prices[i] <= 5 * 10^4",
      "0 <= fee < 5 * 10^4",
    ],
    approach:
      "Two states: `cash` (not holding stock) and `hold` (holding stock). Transition: cash = max(cash, hold + price - fee); hold = max(hold, cash - price). O(n) time, O(1) space.",
    code: `def max_profit_with_fee(prices: list[int], fee: int) -> int:
    cash = 0                    # max profit when not holding
    hold = -prices[0]           # max profit when holding (bought on day 0)
    for p in prices[1:]:
        cash = max(cash, hold + p - fee)   # sell: subtract fee
        hold = max(hold, cash - p)         # buy
    return cash`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 714,
  },
  {
    id: "fin-20260727-b1-bit-power-of-two-lots",
    title: "Valid Lot Size (Power of Two Check)",
    difficulty: "easy",
    topics: ["Bit Manipulation", "Math"],
    problem:
      "Some exchange rules require that order quantities be a power of two (e.g. 1, 2, 4, 8, ... lots). Given a positive integer `n` representing an order quantity, return True if `n` is a valid lot size (a power of two), False otherwise. Must run in O(1) time without loops or log functions.",
    examples: [
      {
        input: "n = 1",
        output: "True",
        explanation: "2^0 = 1.",
      },
      {
        input: "n = 16",
        output: "True",
      },
      {
        input: "n = 3",
        output: "False",
      },
      {
        input: "n = 0",
        output: "False",
      },
    ],
    constraints: ["-2^31 <= n <= 2^31 - 1"],
    approach:
      "A power of two in binary has exactly one bit set. The trick: `n & (n-1) == 0` clears the lowest set bit. If the result is zero and n > 0, exactly one bit was set. O(1) time and space.",
    code: `def is_valid_lot_size(n: int) -> bool:
    # n > 0 guards against 0 (which passes the bit trick but is not a power of 2)
    return n > 0 and (n & (n - 1)) == 0`,
    language: "python",
    complexity: { time: "O(1)", space: "O(1)" },
    leetcodeNumber: 231,
  },
  {
    id: "fin-20260727-b1-markov-chain-regime",
    title: "Expected Holding Period via Markov Chain (Regime Model)",
    difficulty: "medium",
    topics: ["Math", "Dynamic Programming", "Probability", "Matrix"],
    problem:
      "A financial market operates in two regimes: Bull (B) and Bear (R). Transition probabilities are: from B, probability p of staying Bull and (1-p) of switching to Bear; from R, probability q of staying Bear and (1-q) of switching to Bull. Given current regime and a target regime, compute the expected number of periods to first reach the target regime.",
    examples: [
      {
        input: "current='B', target='R', p=0.8, q=0.7",
        output: "5.0",
        explanation:
          "From Bull state, the expected steps to reach Bear: E_B = 1 + p*E_B + (1-p)*0, solving: E_B*(1-p)=1, E_B=1/(1-p)=1/0.2=5.",
      },
      {
        input: "current='R', target='B', p=0.8, q=0.7",
        output: "3.333...",
        explanation: "E_R = 1/(1-q) = 1/0.3 ≈ 3.33.",
      },
    ],
    constraints: [
      "0 < p < 1",
      "0 < q < 1",
      "current and target are 'B' or 'R'",
    ],
    approach:
      "For a two-state chain, the expected first-passage time from state i to state j satisfies a linear system. From B to R: E_B = 1 + p*E_B => E_B = 1/(1-p). From R to B: E_R = 1 + q*E_R => E_R = 1/(1-q). If already at target, return 0.",
    code: `def expected_regime_switch(current: str, target: str,
                             p_bull: float, p_bear: float) -> float:
    """
    p_bull: P(stay in Bull | currently Bull) = p
    p_bear: P(stay in Bear | currently Bear) = q
    Expected steps to first hit target regime.
    """
    if current == target:
        return 0.0

    if current == 'B' and target == 'R':
        # E_B = 1/(1-p_bull)
        return 1.0 / (1.0 - p_bull)
    elif current == 'R' and target == 'B':
        # E_R = 1/(1-p_bear)
        return 1.0 / (1.0 - p_bear)
    raise ValueError("Invalid regime")

# Example
e_bull_to_bear = expected_regime_switch('B', 'R', 0.80, 0.70)
e_bear_to_bull = expected_regime_switch('R', 'B', 0.80, 0.70)
print(f"Expected periods Bull->Bear: {e_bull_to_bear:.3f}")
print(f"Expected periods Bear->Bull: {e_bear_to_bull:.3f}")
# Stationary distribution: pi_B = (1-q)/((1-p)+(1-q)), pi_R = 1 - pi_B
pi_B = (1-0.70) / ((1-0.80) + (1-0.70))
print(f"Stationary: P(Bull)={pi_B:.3f}  P(Bear)={1-pi_B:.3f}")`,
    language: "python",
    complexity: { time: "O(1)", space: "O(1)" },
  },
];
