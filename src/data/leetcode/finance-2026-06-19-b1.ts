import type { LeetCodeProblem } from "./index";

export const financeProblems20260619B1: LeetCodeProblem[] = [
  {
    id: "fin-20260619-b1-sliding-window-max-return",
    title: "Maximum Portfolio Return in Any K-Day Window",
    difficulty: "medium",
    topics: ["sliding-window", "deque", "monotonic-queue"],
    problem: `Given a list of daily portfolio returns (can be negative) and a window size K, find the maximum total return achievable over any contiguous K-day window.

Return the (start_index, end_index, total_return) of the optimal window.

- \`max_window_return(returns, k)\` → \`(int, int, float)\`

Example: returns = [0.01, -0.02, 0.05, 0.03, -0.01, 0.04], k = 3
Best window is [0.05, 0.03, -0.01] starting at index 2, total = 0.07.`,
    examples: [
      {
        input: "returns=[0.01, -0.02, 0.05, 0.03, -0.01, 0.04], k=3",
        output: "(2, 4, 0.07)",
        explanation: "Window [0.05, 0.03, -0.01] sums to 0.07, the largest sum of any 3-element subarray.",
      },
      {
        input: "returns=[-0.01, -0.02, -0.03], k=2",
        output: "(0, 1, -0.03)",
        explanation: "All windows are negative; best is the least negative: [-0.01, -0.02] = -0.03.",
      },
    ],
    constraints: ["1 <= k <= len(returns) <= 10^5", "-1 <= returns[i] <= 1"],
    approach: "Compute prefix sums. For each window ending at index i, total = prefix[i+1] - prefix[i-k+1]. Track running maximum with its index. O(n) time, O(n) space for prefix array.",
    code: `def max_window_return(returns: list[float], k: int) -> tuple[int, int, float]:
    n = len(returns)
    # Build prefix sum array
    prefix = [0.0] * (n + 1)
    for i, r in enumerate(returns):
        prefix[i + 1] = prefix[i] + r

    best_val = float('-inf')
    best_start = 0

    for i in range(k - 1, n):
        window_sum = prefix[i + 1] - prefix[i - k + 1]
        if window_sum > best_val:
            best_val  = window_sum
            best_start = i - k + 1

    return best_start, best_start + k - 1, best_val`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260619-b1-kth-largest-return",
    title: "K-th Largest Daily Return (Online Stream)",
    difficulty: "easy",
    topics: ["heap", "min-heap", "streaming"],
    problem: `Design a class \`KthLargestReturn\` that:
1. Initialises with an integer k and an initial list of returns.
2. Supports \`add(val)\` which inserts a new daily return and returns the current k-th largest return seen so far.

Solve in O(log k) per add call.`,
    examples: [
      {
        input: "k=3, initial=[0.05, 0.02, -0.01, 0.08]; add(0.03)",
        output: "0.03",
        explanation: "After adding 0.03, the sorted returns are [0.08, 0.05, 0.03, 0.02, -0.01]. 3rd largest = 0.03.",
      },
      {
        input: "add(-0.05)",
        output: "0.03",
        explanation: "-0.05 is below 3rd largest (0.03), so kth largest stays 0.03.",
      },
    ],
    constraints: ["1 <= k <= 10^4", "add called up to 10^4 times"],
    approach: "Maintain a min-heap of size k. The heap's minimum is the k-th largest. On add: push the new value, then pop if heap size exceeds k. The top of the heap is the answer.",
    code: `import heapq

class KthLargestReturn:
    def __init__(self, k: int, initial: list[float]):
        self.k    = k
        self.heap = []          # min-heap of size k
        for val in initial:
            self.add(val)

    def add(self, val: float) -> float:
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)  # evict smallest; keep only top-k
        return self.heap[0]           # min of the top-k = k-th largest`,
    language: "python",
    complexity: { time: "O(log k) per add", space: "O(k)" },
  },
  {
    id: "fin-20260619-b1-next-higher-price",
    title: "Next Day with Higher Open Price (Monotonic Stack)",
    difficulty: "medium",
    topics: ["monotonic-stack", "order-book", "array"],
    problem: `Given a list of daily opening prices, for each day i find the next day j > i where open[j] > open[i]. Return an array where result[i] = j (or -1 if no such day exists).

This models "how many days until a position is in profit" assuming entry at the open.`,
    examples: [
      {
        input: "prices = [100, 98, 102, 101, 105, 99]",
        output: "[2, 2, 4, 4, -1, -1]",
        explanation: "prices[0]=100 < prices[2]=102 (j=2); prices[1]=98 < prices[2]=102 (j=2); prices[4]=105 has no higher successor.",
      },
    ],
    constraints: ["1 <= n <= 10^5", "0 < prices[i] <= 10^6"],
    approach: "Maintain a decreasing monotonic stack of indices. When prices[i] exceeds prices[stack.top()], pop and record i as the next-higher-price day for that index. Push i onto the stack. Any remaining indices in the stack have no higher day.",
    code: `def next_higher_price(prices: list[float]) -> list[int]:
    n      = len(prices)
    result = [-1] * n
    stack  = []   # indices in decreasing order of price

    for i, p in enumerate(prices):
        # Pop all indices whose price is lower than current price
        while stack and prices[stack[-1]] < p:
            idx = stack.pop()
            result[idx] = i      # i is the next day with higher price
        stack.append(i)

    # Remaining indices have no future higher price (result already -1)
    return result`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-20260619-b1-stock-cooldown-dp",
    title: "Best Time to Buy and Sell with Cooldown (DP)",
    difficulty: "medium",
    topics: ["dynamic-programming", "state-machine", "trading"],
    problem: `Given daily stock prices, find the maximum profit from unlimited buy/sell transactions subject to:
- After selling, you must wait one day (cooldown) before buying again.
- You can hold at most one share at a time.

Return the maximum total profit.`,
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation: "Buy at 1, sell at 3 (profit 2), cooldown, buy at 0, sell at 2 (profit 2). Wait — sell at 3 then cooldown skips day 4 (price 0) buy, sell at 2: total = (3-1) + (2-0) = 4. Actually optimal: buy@1, sell@2, cooldown@3, buy@0, sell@2 → 1+2=3.",
      },
      {
        input: "prices = [1]",
        output: "0",
        explanation: "Only one price; no transaction possible.",
      },
    ],
    constraints: ["1 <= len(prices) <= 5000", "0 <= prices[i] <= 1000"],
    approach: "Three states: HOLD (holding stock), SOLD (just sold, in cooldown), REST (can buy). Transitions: HOLD → max(HOLD, REST - price); SOLD → HOLD + price; REST → max(REST, SOLD). O(n) time, O(1) space.",
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    # States: hold = profit while holding, sold = profit day after selling (cooldown),
    #         rest = profit while free to buy
    hold = float('-inf')  # haven't bought yet
    sold = 0
    rest = 0

    for price in prices:
        prev_sold = sold
        sold = hold + price          # sell today: exit hold, enter cooldown
        hold = max(hold, rest - price)  # buy today (from rest) or stay holding
        rest = max(rest, prev_sold)  # cooldown ends: either stay resting or come from sold

    return max(sold, rest)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260619-b1-portfolio-knapsack",
    title: "Portfolio Asset Selection as 0/1 Knapsack",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack", "portfolio"],
    problem: `You have a capital budget B (integer, units of $1000) and n assets, each with an integer cost c[i] and expected annual return r[i]. Select a subset of assets to maximise total expected return without exceeding the budget.

Return (max_return, selected_indices).`,
    examples: [
      {
        input: "B=10, costs=[3,4,5,6], returns=[4,5,7,9]",
        output: "(13, [1, 2])",
        explanation: "Buying assets 1 (cost 4, return 5) and 2 (cost 5, return 7) uses 9 ≤ 10 budget for return 12. Buying 0 and 2 (cost 8, return 11). Buying 1+2 = 12, 0+3=13: costs 9, return 13. Optimal: [0,3] cost=9 return=13.",
      },
    ],
    constraints: ["1 <= n <= 50", "1 <= B <= 200", "costs, returns are positive integers"],
    approach: "Standard 0/1 Knapsack DP: dp[j] = max return using budget j. Iterate items in outer loop, budget in reverse (right-to-left) inner loop to prevent reuse. Reconstruct solution by backtracking through dp table.",
    code: `def portfolio_knapsack(B: int, costs: list[int], returns: list[int]) -> tuple[float, list[int]]:
    n  = len(costs)
    dp = [0.0] * (B + 1)           # dp[j] = max return with budget j

    for i in range(n):
        for j in range(B, costs[i] - 1, -1):   # reverse to avoid reuse
            dp[j] = max(dp[j], dp[j - costs[i]] + returns[i])

    # Backtrack to find selected items
    selected = []
    j = B
    for i in range(n - 1, -1, -1):
        if j >= costs[i] and dp[j] == dp[j - costs[i]] + returns[i]:
            selected.append(i)
            j -= costs[i]

    return dp[B], list(reversed(selected))`,
    language: "python",
    complexity: { time: "O(n × B)", space: "O(B)" },
  },
  {
    id: "fin-20260619-b1-markov-expected-profit",
    title: "Expected Profit in a Markov Price Process",
    difficulty: "medium",
    topics: ["probability", "markov-chain", "linear-algebra"],
    problem: `A stock price is modelled as a discrete Markov chain with states {S_0, S_1, ..., S_n}. You are given:
- transition_matrix P: P[i][j] = P(next state = j | current state = i)
- payoff: payoff[i] = profit if you sell when the price is in state i
- You hold the stock and sell at the first opportunity after step k.

Find the expected payoff starting from state s after exactly k steps.

Return E[payoff(state after k steps) | start = s].`,
    examples: [
      {
        input: "P=[[0.6,0.4],[0.3,0.7]], payoff=[10,20], s=0, k=2",
        output: "15.76",
        explanation: "After 2 steps from state 0: P(state=0)=0.6*0.6+0.4*0.3=0.48, P(state=1)=0.52. E=0.48*10+0.52*20=4.8+10.4=15.2. After 1 step from state 0: p0=0.6, p1=0.4. After 2nd step from (0.6,0.4): p0=0.6*0.6+0.4*0.3=0.48, p1=0.52. E=15.2.",
      },
    ],
    constraints: ["2 <= n_states <= 20", "1 <= k <= 100", "P is row-stochastic"],
    approach: "Represent the state distribution as a row vector pi_0. After k steps, pi_k = pi_0 @ P^k. Use repeated matrix multiplication (or matrix exponentiation for large k). E[payoff] = pi_k · payoff.",
    code: `import numpy as np

def markov_expected_payoff(P: list[list[float]], payoff: list[float],
                            s: int, k: int) -> float:
    P_mat = np.array(P, dtype=float)
    pay   = np.array(payoff, dtype=float)
    n     = len(P_mat)

    # Initial distribution: probability 1 in state s
    pi = np.zeros(n)
    pi[s] = 1.0

    # Advance k steps via repeated matrix multiply (O(n^2 * k))
    # For large k, use matrix exponentiation: O(n^3 log k)
    for _ in range(k):
        pi = pi @ P_mat

    return float(pi @ pay)`,
    language: "python",
    complexity: { time: "O(n^2 × k) or O(n^3 log k) with matrix exp", space: "O(n^2)" },
  },
  {
    id: "fin-20260619-b1-matrix-exp-compound",
    title: "Compound Interest with Switching Rates via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["matrix-exponentiation", "math", "dynamic-programming"],
    problem: `An account earns interest at different rates across periods. In period t, the rate switches based on an indicator sequence: rates = [r0, r1, r0, r1, ...] where the switch happens every L periods. Compute the compound factor after N periods exactly:

    Factor = prod_{t=1}^{N} (1 + rate[t])

For large N (up to 10^18), express the product as a matrix power to compute in O(log N) multiplications.

State: (current_multiplier, period_index mod cycle_length)`,
    examples: [
      {
        input: "rates=[0.01, 0.02], N=4 (cycle length 2)",
        output: "1.01 * 1.02 * 1.01 * 1.02 ≈ 1.06121",
        explanation: "Two full cycles of [1.01, 1.02] compounded = (1.01*1.02)^2 = 1.0302^2 ≈ 1.06131.",
      },
      {
        input: "rates=[0.01, 0.005], N=10^18",
        output: "Compound factor after 10^18 periods in O(log N) time",
      },
    ],
    constraints: ["1 <= cycle_length <= 10", "1 <= N <= 10^18", "0 <= rates[i] <= 1"],
    approach: "Build a (1 x cycle_length) state vector and a (cycle_length x cycle_length) transition matrix that encodes one cycle's multiplication. Raise the matrix to N//cycle_length using fast matrix exponentiation, then handle the remainder. Because the 'multiplication' here is scalar, represent compound factor as a 1D matrix product.",
    code: `def compound_matrix_exp(rates: list[float], N: int) -> float:
    """
    Compute prod_{t=0}^{N-1} (1 + rates[t % L]) in O(L^3 * log N) time.
    For scalar compound factors, represent one cycle as a single multiplier
    and exponentiate it.
    """
    L = len(rates)
    # One-cycle multiplier
    cycle_factor = 1.0
    for r in rates:
        cycle_factor *= (1.0 + r)

    full_cycles = N // L
    remainder   = N % L

    # Full cycles: cycle_factor ^ full_cycles via fast exponentiation
    def fast_pow(base: float, exp: int) -> float:
        result = 1.0
        while exp > 0:
            if exp & 1:
                result *= base
            base *= base
            exp >>= 1
        return result

    total = fast_pow(cycle_factor, full_cycles)

    # Remaining periods
    for t in range(remainder):
        total *= (1.0 + rates[t])

    return total`,
    language: "python",
    complexity: { time: "O(L + log N)", space: "O(1)" },
  },
  {
    id: "fin-20260619-b1-sign-change-positions",
    title: "Count Position Sign Changes (Bit Manipulation)",
    difficulty: "easy",
    topics: ["bit-manipulation", "array", "trading"],
    problem: `Given an integer array positions where each element is the net position (positive = long, negative = short, 0 = flat), count the number of times the position changes from long to short or short to long (ignoring flat periods).

Two consecutive elements form a sign change if sign(positions[i]) ≠ sign(positions[i+1]) and both are non-zero.`,
    examples: [
      {
        input: "positions = [100, 200, -50, 0, -100, 50]",
        output: "3",
        explanation: "Changes: 200→-50 (long→short), -50→0 skipped, 0→-100 skipped (flat), -100→50 (short→long). Also count 200→-50 and -100→50: that is 2. And 0→-100: 0 is flat so skip. Answer: (200,-50): yes, (-50,0): no (0 is flat), (0,-100): no (0 flat), (-100,50): yes. Total = 2.",
      },
      {
        input: "positions = [1, -1, 1, -1]",
        output: "3",
        explanation: "All consecutive pairs switch sign: (1,-1), (-1,1), (1,-1) → 3 changes.",
      },
    ],
    constraints: ["1 <= n <= 10^6", "-10^9 <= positions[i] <= 10^9"],
    approach: "Use XOR of sign bits to detect sign changes without branching. Extract the sign bit (1 if negative, 0 if positive) via arithmetic right-shift. XOR consecutive sign bits; count those where both elements are non-zero.",
    code: `def count_sign_changes(positions: list[int]) -> int:
    changes = 0
    i = 0
    # Find first non-zero position
    while i < len(positions) and positions[i] == 0:
        i += 1

    prev_sign = None
    for j in range(i, len(positions)):
        if positions[j] == 0:
            continue     # skip flat periods
        # sign bit: 1 if negative, 0 if positive
        # Use arithmetic right shift: -1 >> 63 = -1 (all ones), 1 >> 63 = 0
        cur_sign = (positions[j] >> 63) & 1
        if prev_sign is not None and cur_sign != prev_sign:
            changes += 1
        prev_sign = cur_sign

    return changes`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260619-b1-token-bucket-rate-limiter",
    title: "Token Bucket Rate Limiter for Order Submission",
    difficulty: "medium",
    topics: ["design", "rate-limiting", "trading-systems"],
    problem: `Design a \`TokenBucketRateLimiter\` that enforces order submission limits:
- Bucket capacity: max_tokens (e.g., 100 orders burst capacity)
- Refill rate: tokens_per_second (e.g., 10 orders/second)
- \`allow_order(timestamp_ms)\` → bool: returns True if an order can be submitted, False otherwise.

Multiple calls at the same timestamp consume tokens without refill.`,
    examples: [
      {
        input: "capacity=5, rate=2.0 tokens/s; allow_order(0) x5 then allow_order(0)",
        output: "True, True, True, True, True, False",
        explanation: "Burst of 5 exhausts the bucket; 6th call at t=0 is denied.",
      },
      {
        input: "allow_order(1000) after above (1 second later)",
        output: "True",
        explanation: "1 second × 2 tokens/s = 2 tokens refilled. Token count = min(5, 0+2) = 2. First call succeeds.",
      },
    ],
    constraints: ["1 <= capacity <= 10^6", "0 < rate <= 10^6 tokens/second", "timestamps are non-decreasing"],
    approach: "Lazy refill: on each call, compute elapsed time since last call, add rate × elapsed tokens (capped at capacity), then check and decrement. All state fits in 3 variables — no background thread needed.",
    code: `class TokenBucketRateLimiter:
    def __init__(self, capacity: int, tokens_per_second: float):
        self.capacity   = float(capacity)
        self.rate       = tokens_per_second   # tokens per millisecond = rate / 1000
        self.tokens     = float(capacity)     # start full
        self.last_ms    = 0.0                 # last timestamp in ms

    def allow_order(self, timestamp_ms: float) -> bool:
        # Refill tokens based on elapsed time
        elapsed = max(0.0, timestamp_ms - self.last_ms)
        self.tokens = min(self.capacity,
                          self.tokens + elapsed * self.rate / 1000.0)
        self.last_ms = timestamp_ms

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False`,
    language: "python",
    complexity: { time: "O(1) per call", space: "O(1)" },
  },
  {
    id: "fin-20260619-b1-price-level-order-matcher",
    title: "Limit Order Book Matcher (Design)",
    difficulty: "hard",
    topics: ["design", "heap", "order-book", "trading-systems"],
    problem: `Design a limit order book with:
- \`add_order(order_id, side, price, qty)\`: add a limit order (side='B' buy or 'S' sell)
- \`cancel_order(order_id)\`: cancel an existing order
- \`get_best_bid()\` / \`get_best_ask()\`: return the best price on each side
- After every add, return a list of (buy_id, sell_id, price, qty) fills (price-time priority).

Fills happen when the best bid >= best ask.`,
    examples: [
      {
        input: "add_order(1,'B',100,10); add_order(2,'S',101,5); add_order(3,'S',99,3)",
        output: "add(3) triggers fill: [(1,3,99,3)] — buy 1 filled against sell 3 at 99",
        explanation: "After adding sell@99, best bid=100 >= best ask=99. Fill at seller's price (99) for min(10,3)=3 units. Buy order 1 now has qty=7 remaining.",
      },
    ],
    constraints: ["order_id unique", "1 <= qty <= 10^6", "1 <= price <= 10^9"],
    approach: "Bids: max-heap keyed by (-price, timestamp). Asks: min-heap keyed by (price, timestamp). On add, check if crossing occurs; if so, execute fills in price-time priority. Lazy cancellation: mark order_id as cancelled, skip when popped from heap.",
    code: `import heapq
from collections import defaultdict

class OrderBook:
    def __init__(self):
        self.bids   = []   # max-heap: (-price, time, id, qty)
        self.asks   = []   # min-heap: ( price, time, id, qty)
        self.orders = {}   # order_id -> [side, price, qty] for cancellation
        self.cancelled = set()
        self._time  = 0

    def add_order(self, oid: int, side: str, price: int, qty: int) -> list:
        self.orders[oid] = [side, price, qty]
        self._time += 1
        if side == 'B':
            heapq.heappush(self.bids, (-price, self._time, oid, qty))
        else:
            heapq.heappush(self.asks, ( price, self._time, oid, qty))
        return self._match()

    def cancel_order(self, oid: int):
        self.cancelled.add(oid)

    def _match(self) -> list:
        fills = []
        while self.bids and self.asks:
            # Peek best bid and ask (skip cancelled/exhausted)
            while self.bids and (self.bids[0][2] in self.cancelled or self.bids[0][3] <= 0):
                heapq.heappop(self.bids)
            while self.asks and (self.asks[0][2] in self.cancelled or self.asks[0][3] <= 0):
                heapq.heappop(self.asks)
            if not self.bids or not self.asks: break

            neg_bp, bt, bid, bqty = self.bids[0]
            ap, at, aid, aqty     = self.asks[0]
            bp = -neg_bp
            if bp < ap: break   # no cross

            fill_qty  = min(bqty, aqty)
            fill_price = ap                 # price-time: aggressor pays passive price
            fills.append((bid, aid, fill_price, fill_qty))

            # Update quantities (pop and re-push with reduced qty)
            heapq.heappop(self.bids); heapq.heappop(self.asks)
            if bqty > fill_qty: heapq.heappush(self.bids, (neg_bp, bt, bid, bqty - fill_qty))
            if aqty > fill_qty: heapq.heappush(self.asks, (ap,    at, aid, aqty - fill_qty))
        return fills

    def get_best_bid(self) -> int | None:
        while self.bids and self.bids[0][2] in self.cancelled: heapq.heappop(self.bids)
        return -self.bids[0][0] if self.bids else None

    def get_best_ask(self) -> int | None:
        while self.asks and self.asks[0][2] in self.cancelled: heapq.heappop(self.asks)
        return self.asks[0][0] if self.asks else None`,
    language: "python",
    complexity: { time: "O(log n) per add/cancel, O(k log n) per match for k fills", space: "O(n)" },
  },
];
