import { LeetCodeProblem } from "./index";

export const financeProblems20260721B1: LeetCodeProblem[] = [
  {
    id: "fin-20260721-b1-fx-arbitrage",
    title: "FX Arbitrage Detection via Bellman-Ford",
    difficulty: "hard",
    topics: ["graphs", "bellman-ford", "negative-cycle"],
    problem:
      "Given a matrix rates[i][j] representing the exchange rate from currency i to currency j, detect whether a profitable arbitrage cycle exists (i.e., starting with 1 unit of any currency, can you return with more than 1 unit by converting through a sequence of currencies?). Return True if arbitrage exists, False otherwise.",
    examples: [
      {
        input:
          "rates = [[1, 0.9, 0.8], [1.12, 1, 0.89], [1.27, 1.13, 1]]\n(USD, EUR, GBP)",
        output: "True",
        explanation:
          "USD→EUR→GBP→USD: 1 * 0.9 * 0.89 * 1.27 ≈ 1.017 > 1. Arbitrage found via negative cycle in log-weight graph.",
      },
    ],
    constraints: [
      "2 ≤ n ≤ 30 (currencies)",
      "rates[i][i] = 1.0",
      "rates[i][j] > 0",
    ],
    approach:
      "Convert to log-weights: w[i][j] = -log(rates[i][j]). A profitable cycle has negative total log-weight (product > 1 → sum of logs < 0). Run Bellman-Ford from each source; if any node can be relaxed on the (n-1)th+ iteration, a negative cycle exists.",
    code: `import math
from typing import List

def has_arbitrage(rates: List[List[float]]) -> bool:
    n = len(rates)
    # Build graph with negative log-weights
    # w[i][j] = -log(rates[i][j]); negative cycle = product > 1
    INF = float('inf')

    for src in range(n):
        dist = [INF] * n
        dist[src] = 0.0

        # Bellman-Ford: n-1 relaxations
        for _ in range(n - 1):
            for u in range(n):
                if dist[u] == INF:
                    continue
                for v in range(n):
                    w = -math.log(rates[u][v])
                    if dist[u] + w < dist[v]:
                        dist[v] = dist[u] + w

        # n-th relaxation: if any dist improves, negative cycle exists
        for u in range(n):
            if dist[u] == INF:
                continue
            for v in range(n):
                w = -math.log(rates[u][v])
                if dist[u] + w < dist[v] - 1e-10:
                    return True

    return False`,
    language: "python",
    complexity: { time: "O(n³)", space: "O(n)" },
  },
  {
    id: "fin-20260721-b1-kway-merge",
    title: "K-Way Merge of Sorted Order Book Streams",
    difficulty: "medium",
    topics: ["heap", "merge", "sorting"],
    problem:
      "You have k sorted arrays of (price, quantity) bid tuples. Merge them into a single sorted array of bids in descending price order (highest bid first). If two bids have the same price, sum their quantities.",
    examples: [
      {
        input:
          "books = [[(10.5,100),(10.0,200)], [(10.5,50),(9.5,300)], [(10.2,150),(9.8,100)]]",
        output: "[(10.5,150),(10.2,150),(10.0,200),(9.8,100),(9.5,300)]",
        explanation:
          "The two bids at 10.5 (from books 0 and 1) are merged into (10.5, 150). All bids sorted descending by price.",
      },
    ],
    constraints: [
      "1 ≤ k ≤ 500",
      "Total bids n ≤ 10⁵",
      "Bids within each book are sorted descending",
    ],
    approach:
      "Use a max-heap (negate prices) with (neg_price, qty, book_idx, item_idx). Pop the best bid, add to result or merge with last if same price, then push the next item from that book. O(n log k) overall.",
    code: `import heapq
from typing import List, Tuple

def merge_order_books(
    books: List[List[Tuple[float, int]]]
) -> List[Tuple[float, int]]:
    # Max-heap: store (-price, qty, book_idx, item_idx)
    heap = []
    for i, book in enumerate(books):
        if book:
            p, q = book[0]
            heapq.heappush(heap, (-p, q, i, 0))

    result: List[Tuple[float, int]] = []

    while heap:
        neg_p, qty, bi, ii = heapq.heappop(heap)
        price = -neg_p

        # Merge with previous entry if same price
        if result and abs(result[-1][0] - price) < 1e-9:
            result[-1] = (price, result[-1][1] + qty)
        else:
            result.append((price, qty))

        # Push next item from same book
        next_ii = ii + 1
        if next_ii < len(books[bi]):
            np_, nq = books[bi][next_ii]
            heapq.heappush(heap, (-np_, nq, bi, next_ii))

    return result`,
    language: "python",
    complexity: { time: "O(n log k)", space: "O(k)" },
  },
  {
    id: "fin-20260721-b1-buy-sell-k2",
    title: "Best Time to Buy/Sell Stock — At Most 2 Transactions",
    difficulty: "hard",
    topics: ["dynamic-programming", "state-machine"],
    problem:
      "Given an array of daily stock prices, find the maximum profit using at most 2 transactions. You must sell before you can buy again. You cannot hold more than one share at a time.",
    examples: [
      {
        input: "prices = [3, 3, 5, 0, 0, 3, 1, 4]",
        output: "6",
        explanation:
          "Buy on day 4 (price 0), sell on day 6 (price 3), profit=3. Buy on day 7 (price 1), sell on day 8 (price 4), profit=3. Total=6.",
      },
      {
        input: "prices = [1, 2, 3, 4, 5]",
        output: "4",
        explanation: "Buy on day 1, sell on day 5. Only one transaction needed.",
      },
    ],
    constraints: ["1 ≤ n ≤ 10⁵", "0 ≤ prices[i] ≤ 10⁵"],
    approach:
      "Track 4 states: buy1 (holding after 1st buy), sell1 (cash after 1st sell), buy2 (holding after 2nd buy), sell2 (final cash). Transitions: buy1 = max(buy1, -price); sell1 = max(sell1, buy1+price); buy2 = max(buy2, sell1-price); sell2 = max(sell2, buy2+price).",
    code: `from typing import List

def max_profit_two_txn(prices: List[int]) -> int:
    buy1 = buy2 = float('-inf')
    sell1 = sell2 = 0

    for price in prices:
        buy1  = max(buy1,  -price)
        sell1 = max(sell1,  buy1  + price)
        buy2  = max(buy2,   sell1 - price)
        sell2 = max(sell2,  buy2  + price)

    return sell2`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 123,
  },
  {
    id: "fin-20260721-b1-max-subarray-drawdown",
    title: "Maximum Subarray Sum (Maximum P&L Run)",
    difficulty: "easy",
    topics: ["dynamic-programming", "divide-and-conquer"],
    problem:
      "Given an array of daily P&L values (positive or negative), find the contiguous subarray with the largest sum. This represents the best possible trading period: the maximum cumulative P&L run. Return the sum and the start/end indices.",
    examples: [
      {
        input: "pnl = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        output: "6  (subarray [4, -1, 2, 1], indices 3..6)",
        explanation:
          "Kadane's algorithm: current_sum resets to 0 when it goes negative. Maximum sum is 4-1+2+1=6.",
      },
    ],
    constraints: ["1 ≤ n ≤ 10⁵", "-10⁴ ≤ pnl[i] ≤ 10⁴"],
    approach:
      "Kadane's algorithm: maintain current_sum and best_sum. At each element, current_sum = max(pnl[i], current_sum + pnl[i]). Track start/end indices by resetting on restart.",
    code: `from typing import List, Tuple

def max_pnl_run(pnl: List[int]) -> Tuple[int, int, int]:
    best_sum = float('-inf')
    curr_sum = 0
    best_start = best_end = 0
    start = 0

    for i, p in enumerate(pnl):
        if curr_sum + p < p:   # restart: p alone is better
            curr_sum = p
            start    = i
        else:
            curr_sum += p

        if curr_sum > best_sum:
            best_sum   = curr_sum
            best_start = start
            best_end   = i

    return int(best_sum), best_start, best_end`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 53,
  },
  {
    id: "fin-20260721-b1-histogram-rectangle",
    title: "Largest Order Book Depth Rectangle",
    difficulty: "hard",
    topics: ["stack", "monotonic-stack"],
    problem:
      "An order book's bid depth is represented as a histogram: depths[i] is the total quantity available at price level i (ascending prices, left = lowest). Find the area of the largest rectangle that can be formed within the histogram. This represents the maximum notional you can trade within a given price range at full depth.",
    examples: [
      {
        input: "depths = [2, 1, 5, 6, 2, 3]",
        output: "10",
        explanation:
          "The largest rectangle has height 5 and width 2 (levels 2 and 3, depths 5 and 6). Area = 5*2 = 10.",
      },
    ],
    constraints: ["1 ≤ n ≤ 10⁵", "0 ≤ depths[i] ≤ 10⁴"],
    approach:
      "Use a monotonic increasing stack of indices. When we pop index j (because depths[i] < depths[j]), the rectangle with height depths[j] extends from the new stack top+1 to i-1. Width = i - stack[-1] - 1 if stack else i.",
    code: `from typing import List

def largest_depth_rectangle(depths: List[int]) -> int:
    stack: List[int] = []   # indices, monotonically increasing depths
    max_area = 0
    n = len(depths)

    for i in range(n + 1):
        h = depths[i] if i < n else 0
        while stack and depths[stack[-1]] > h:
            height = depths[stack.pop()]
            width  = i - stack[-1] - 1 if stack else i
            max_area = max(max_area, height * width)
        stack.append(i)

    return max_area`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 84,
  },
  {
    id: "fin-20260721-b1-stock-fee-dp",
    title: "Maximum Profit with Transaction Fee",
    difficulty: "medium",
    topics: ["dynamic-programming", "greedy"],
    problem:
      "Given daily stock prices and a transaction fee per trade (charged on the sell), find the maximum profit with unlimited transactions. You cannot hold more than one share at a time.",
    examples: [
      {
        input: "prices = [1, 3, 2, 8, 4, 9], fee = 2",
        output: "8",
        explanation:
          "Buy at 1, sell at 8 (fee 2): profit 5. Buy at 4, sell at 9 (fee 2): profit 3. Total 8.",
      },
    ],
    constraints: ["1 ≤ n ≤ 5*10⁴", "1 ≤ fee ≤ 10⁴", "0 ≤ prices[i] ≤ 10⁵"],
    approach:
      "DP with two states: cash (not holding) and held (holding a share). cash = max(cash, held + price - fee); held = max(held, cash - price). O(n) time, O(1) space.",
    code: `from typing import List

def max_profit_with_fee(prices: List[int], fee: int) -> int:
    cash = 0           # max profit when not holding a share
    held = -prices[0]  # max profit when holding a share (bought at prices[0])

    for price in prices[1:]:
        cash = max(cash, held + price - fee)
        held = max(held, cash - price)

    return cash`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 714,
  },
  {
    id: "fin-20260721-b1-task-scheduler",
    title: "Order Routing Task Scheduler",
    difficulty: "medium",
    topics: ["greedy", "heap", "counting"],
    problem:
      "A trading system must route orders of n types. After routing k orders of the same type, the system must wait `cooldown` time slots before routing that type again. Each time slot routes exactly one order or idles. Given an order queue (list of order types), find the minimum number of time slots needed to route all orders.",
    examples: [
      {
        input: "orders = ['AAPL','AAPL','MSFT','AAPL'], cooldown = 2",
        output: "7",
        explanation:
          "AAPL → MSFT → idle → AAPL → idle → idle → AAPL. AAPL appears 3× with gap of 2.",
      },
    ],
    constraints: [
      "1 ≤ len(orders) ≤ 10⁴",
      "0 ≤ cooldown ≤ 100",
      "Order types are uppercase letters",
    ],
    approach:
      "The minimum slots = max(n, (max_count-1)*(cooldown+1) + count_of_max_freq), where max_count is the frequency of the most common order type. This formula comes from filling a grid of (cooldown+1) columns: the last row may be partial.",
    code: `from typing import List
from collections import Counter

def min_routing_slots(orders: List[str], cooldown: int) -> int:
    counts = Counter(orders)
    max_count = max(counts.values())
    # How many order types share the maximum frequency?
    n_max = sum(1 for v in counts.values() if v == max_count)
    # Formula: frames of size (cooldown+1), last frame may be partial
    slots = (max_count - 1) * (cooldown + 1) + n_max
    return max(slots, len(orders))`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 621,
  },
  {
    id: "fin-20260721-b1-coin-change-lots",
    title: "Minimum Lot Sizes for Target Position",
    difficulty: "medium",
    topics: ["dynamic-programming", "bfs"],
    problem:
      "A derivatives desk can trade in fixed lot sizes: lots[] is an array of available lot sizes (e.g., [1, 5, 10, 50]). Given a target position size (number of contracts), find the minimum number of individual trade tickets needed to reach exactly the target position. If impossible, return -1.",
    examples: [
      {
        input: "lots = [1, 5, 10, 50], target = 67",
        output: "5",
        explanation:
          "50+10+5+1+1 = 67 using 5 tickets: [50, 10, 5, 1, 1].",
      },
    ],
    constraints: [
      "1 ≤ len(lots) ≤ 12",
      "1 ≤ lots[i] ≤ 10⁴",
      "1 ≤ target ≤ 10⁴",
    ],
    approach:
      "Classic coin change DP. dp[i] = minimum tickets to reach position i. dp[0]=0; for each i, dp[i] = min(dp[i-lot]+1) for each lot ≤ i. Return dp[target] or -1.",
    code: `from typing import List

def min_lot_tickets(lots: List[int], target: int) -> int:
    INF = float('inf')
    dp  = [INF] * (target + 1)
    dp[0] = 0

    for i in range(1, target + 1):
        for lot in lots:
            if lot <= i and dp[i - lot] + 1 < dp[i]:
                dp[i] = dp[i - lot] + 1

    return dp[target] if dp[target] != INF else -1`,
    language: "python",
    complexity: { time: "O(target × len(lots))", space: "O(target)" },
    leetcodeNumber: 322,
  },
  {
    id: "fin-20260721-b1-position-bits",
    title: "Count Active Positions from Bitmasked Risk Flags",
    difficulty: "easy",
    topics: ["bit-manipulation"],
    problem:
      "A risk system encodes up to 64 position flags in a single 64-bit integer: bit i is set if position i is active (non-zero). Given an array of such bitmask integers (one per account), return for each account the number of active positions. Constraints: must use O(1) per lookup — no loops over bits at runtime.",
    examples: [
      {
        input: "masks = [0b1011, 0b1110, 0b0000, 0b1111]",
        output: "[3, 3, 0, 4]",
        explanation:
          "0b1011 has 3 set bits (positions 0, 1, 3). 0b1111 has 4 set bits.",
      },
    ],
    constraints: [
      "1 ≤ n ≤ 10⁵",
      "0 ≤ masks[i] < 2⁶⁴",
      "O(1) per account lookup required",
    ],
    approach:
      "Use Python's built-in bin(x).count('1') or int.bit_count() (Python 3.10+). For production C++, use __builtin_popcountll(). The lookup-table trick: precompute popcount for all 16-bit values, then split 64-bit mask into four 16-bit chunks and sum.",
    code: `from typing import List

# Python 3.10+: int.bit_count()
def count_active_positions(masks: List[int]) -> List[int]:
    return [m.bit_count() for m in masks]

# Portable alternative (pre-3.10)
def count_active_portable(masks: List[int]) -> List[int]:
    return [bin(m).count('1') for m in masks]

# Lookup-table approach for very hot paths
def build_popcount_table() -> List[int]:
    table = [0] * 65536
    for i in range(1, 65536):
        table[i] = table[i >> 1] + (i & 1)
    return table

_POPCOUNT = build_popcount_table()

def count_active_lookup(masks: List[int]) -> List[int]:
    result = []
    for m in masks:
        count = (_POPCOUNT[m & 0xFFFF]
               + _POPCOUNT[(m >> 16) & 0xFFFF]
               + _POPCOUNT[(m >> 32) & 0xFFFF]
               + _POPCOUNT[(m >> 48) & 0xFFFF])
        result.append(count)
    return result`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1) per lookup (O(65536) for table)" },
  },
  {
    id: "fin-20260721-b1-jump-circuit",
    title: "Jump Game — Market Circuit Breaker Propagation",
    difficulty: "medium",
    topics: ["greedy", "dynamic-programming"],
    problem:
      "A market simulation has n trading sessions. Session i can propagate volatility to the next jump[i] sessions (i.e., from session i you can reach sessions i+1 through i+jump[i]). Starting from session 0, can you reach the final session n-1? If yes, return the minimum number of jumps; if no, return -1.",
    examples: [
      {
        input: "jump = [2, 3, 1, 1, 4]",
        output: "2",
        explanation:
          "Jump from session 0 (reach 1 or 2) → jump from session 1 (reach 2, 3, or 4). Minimum 2 jumps.",
      },
      {
        input: "jump = [3, 2, 1, 0, 4]",
        output: "-1",
        explanation:
          "From sessions 0→3 all have jump[3]=0, cannot reach session 4.",
      },
    ],
    constraints: ["1 ≤ n ≤ 10⁴", "0 ≤ jump[i] ≤ 1000"],
    approach:
      "Greedy: track current_end (rightmost reachable with current jumps) and farthest (rightmost reachable with one more jump). When we reach current_end, increment jumps and set current_end=farthest. If farthest never reaches n-1, return -1.",
    code: `from typing import List

def min_jumps(jump: List[int]) -> int:
    n = len(jump)
    if n == 1:
        return 0
    jumps = 0
    current_end = 0
    farthest    = 0

    for i in range(n - 1):
        farthest = max(farthest, i + jump[i])
        if i == current_end:
            jumps      += 1
            current_end = farthest
            if current_end >= n - 1:
                return jumps
            if current_end == i:  # stuck
                return -1

    return -1 if current_end < n - 1 else jumps`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 45,
  },
];
