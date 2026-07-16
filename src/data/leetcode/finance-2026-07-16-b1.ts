import { LeetCodeProblem } from "./index";

export const financeProblems20260716B1: LeetCodeProblem[] = [
  {
    id: "fin-20260716-b1-fx-arbitrage",
    title: "Detect FX Arbitrage (Currency Cycle)",
    difficulty: "hard",
    topics: ["Graph", "Bellman-Ford", "Shortest Path"],
    problem:
      "Given N currencies and a table of exchange rates rates[i][j] (1 unit of i buys rates[i][j] units of j), determine whether a sequence of currency conversions can start and end at the same currency with more money than you started with (arbitrage). Return true if arbitrage exists.",
    examples: [
      {
        input:
          'currencies = ["USD","EUR","GBP"], rates = [[1,1.2,0.9],[0.83,1,0.75],[1.1,1.33,1]]',
        output: "false",
        explanation: "No profitable cycle exists in this rate table.",
      },
      {
        input:
          'currencies = ["USD","EUR","GBP"], rates = [[1,1.5,1],[0.7,1,1.5],[1,0.7,1]]',
        output: "true",
        explanation:
          "USD -> EUR -> GBP -> USD: 1 * 1.5 * 1.5 * 1 = 2.25 > 1.",
      },
    ],
    constraints: [
      "1 <= N <= 100",
      "rates[i][j] > 0",
      "rates[i][i] = 1",
    ],
    approach:
      "Take negative log of each rate: log(a*b*c) > 0 iff -log(a)-log(b)-log(c) < 0, i.e. a negative-weight cycle. Run Bellman-Ford on the transformed graph. If any distance relaxes after N-1 iterations, a negative cycle (= arbitrage) exists.",
    code: `def find_arbitrage(rates: list[list[float]]) -> bool:
    import math
    n = len(rates)
    # Build edge list with -log weights
    edges = []
    for i in range(n):
        for j in range(n):
            if i != j and rates[i][j] > 0:
                edges.append((i, j, -math.log(rates[i][j])))

    # Bellman-Ford from a virtual source (dist to all nodes = 0)
    dist = [0.0] * n
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # Check for further relaxation -> negative cycle
    for u, v, w in edges:
        if dist[u] + w < dist[v] - 1e-9:
            return True
    return False`,
    language: "python",
    complexity: { time: "O(N^3)", space: "O(N^2)" },
  },
  {
    id: "fin-20260716-b1-stock-cooldown",
    title: "Best Time to Buy/Sell Stock with Cooldown",
    difficulty: "medium",
    topics: ["Dynamic Programming", "State Machine"],
    problem:
      "Given an array prices where prices[i] is the price of a stock on day i, find the maximum profit with the constraint that after selling you must wait 1 day before buying again (cooldown). You may not hold more than 1 share at a time.",
    examples: [
      {
        input: "prices = [1,2,3,0,2]",
        output: "3",
        explanation: "Buy on day 0, sell on day 1, cooldown day 2, buy day 3, sell day 4. Profit = 1 + 2 = 3.",
      },
      {
        input: "prices = [1]",
        output: "0",
      },
    ],
    constraints: ["1 <= prices.length <= 5000", "0 <= prices[i] <= 1000"],
    approach:
      "State machine DP with three states: held (holding stock), sold (just sold, must cool down next day), rest (available to buy). Transitions: held = max(held, rest - price); sold = held + price; rest = max(rest, sold). O(N) time, O(1) space.",
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    held = -prices[0]   # max profit while holding
    sold = 0            # max profit day after selling (cooldown)
    rest = 0            # max profit while resting (can buy)

    for p in prices[1:]:
        prev_held, prev_sold, prev_rest = held, sold, rest
        held = max(prev_held, prev_rest - p)
        sold = prev_held + p
        rest = max(prev_rest, prev_sold)

    return max(sold, rest)`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260716-b1-rate-limiter",
    title: "Design a Rate Limiter (Token Bucket)",
    difficulty: "medium",
    topics: ["Design", "Hash Table", "Sliding Window"],
    problem:
      "Design a RateLimiter class for an order management system. It should support: RateLimiter(capacity, refill_rate) where capacity is the max tokens and refill_rate is tokens added per second. bool allow(timestamp_ms, client_id) returns True if the client can place an order, False otherwise. Each allowed call consumes 1 token. Tokens refill continuously up to capacity.",
    examples: [
      {
        input:
          "rl = RateLimiter(10, 5); rl.allow(0, 'TRADER1') x10 = [True]*10; rl.allow(0, 'TRADER1') = False; rl.allow(1000, 'TRADER1') = True (5 tokens refilled)",
        output: "See explanation",
        explanation:
          "10 tokens at start, 5 refilled per second. After draining at t=0, 5 new tokens available at t=1000ms.",
      },
    ],
    constraints: [
      "0 <= timestamp_ms <= 10^9",
      "client_id is a non-empty string",
      "1 <= capacity <= 10^6",
      "0 < refill_rate <= 10^6",
    ],
    approach:
      "Per-client state stores (tokens, last_refill_ms). On each call compute elapsed seconds, add tokens = rate * elapsed, cap at capacity, then consume 1 if available. O(1) per call, O(clients) space.",
    code: `class RateLimiter:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.rate = refill_rate          # tokens per second
        self.buckets: dict = {}          # client_id -> [tokens, last_ms]

    def allow(self, timestamp_ms: int, client_id: str) -> bool:
        if client_id not in self.buckets:
            self.buckets[client_id] = [self.capacity, timestamp_ms]
        tokens, last_ms = self.buckets[client_id]
        elapsed_s = (timestamp_ms - last_ms) / 1000.0
        tokens = min(self.capacity, tokens + self.rate * elapsed_s)
        self.buckets[client_id][1] = timestamp_ms
        if tokens >= 1:
            self.buckets[client_id][0] = tokens - 1
            return True
        self.buckets[client_id][0] = tokens
        return False`,
    language: "python",
    complexity: { time: "O(1) per call", space: "O(C) where C = distinct clients" },
  },
  {
    id: "fin-20260716-b1-trade-pnl-fifo",
    title: "Trade P&L Calculator (FIFO Matching)",
    difficulty: "medium",
    topics: ["Stack", "Queue", "Simulation"],
    problem:
      "Given a list of trades as (side, quantity, price) where side is 'BUY' or 'SELL', compute realised P&L using FIFO (first-in, first-out) matching. Partial fills are allowed. Return the total realised P&L and a list of matched lots.",
    examples: [
      {
        input:
          "trades = [('BUY',100,10.0),('BUY',50,12.0),('SELL',120,15.0)]",
        output: "580.0",
        explanation:
          "First match 100 @ 10 -> 120 @ 15 sells first lot fully (profit 500) then 20 @ 12 -> 15 (profit 60) + 30 @ 12 remain open. Realised = 500+60 = 560. Wait — sell 120: match 100@10 (PnL=500), then 20@12 (PnL=60). Total = 560.",
      },
    ],
    constraints: [
      "1 <= len(trades) <= 10^5",
      "side in {'BUY', 'SELL'}",
      "1 <= quantity <= 10^6",
      "0 < price <= 10^6",
    ],
    approach:
      "Maintain a deque of open buy lots (qty, price). For each SELL, pop from the front and match against the sell quantity, recording P&L = (sell_price - buy_price) * matched_qty. Handle partial lots by re-pushing remainder.",
    code: `from collections import deque

def fifo_pnl(trades: list) -> tuple:
    buy_queue = deque()   # (qty, price)
    realised_pnl = 0.0
    matched_lots = []

    for side, qty, price in trades:
        if side == "BUY":
            buy_queue.append([qty, price])
        else:  # SELL
            remaining = qty
            while remaining > 0 and buy_queue:
                lot_qty, lot_price = buy_queue[0]
                matched = min(remaining, lot_qty)
                pnl = (price - lot_price) * matched
                realised_pnl += pnl
                matched_lots.append((matched, lot_price, price, pnl))
                remaining -= matched
                if matched < lot_qty:
                    buy_queue[0][0] -= matched
                else:
                    buy_queue.popleft()
            # remaining > 0 means short sell; ignoring for simplicity

    open_position = sum(q for q, _ in buy_queue)
    return realised_pnl, matched_lots, open_position`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },
  {
    id: "fin-20260716-b1-portfolio-knapsack",
    title: "Portfolio Sizing as a Knapsack Problem",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Knapsack"],
    problem:
      "You have capital C (integer units) and N investment opportunities. Each opportunity i requires capital[i] and yields expected_return[i]. You may invest in each opportunity at most once. Find the selection that maximises total expected return without exceeding C.",
    examples: [
      {
        input: "C=10, capital=[3,4,5,2], expected_return=[4,5,7,3]",
        output: "12",
        explanation:
          "Select opportunities 0 (cost 3, return 4) and 2 (cost 5, return 7): total cost 8 <= 10, return 11. Or 1+2: cost 9, return 12. Best = 12.",
      },
    ],
    constraints: [
      "1 <= N <= 200",
      "1 <= C <= 10000",
      "1 <= capital[i] <= C",
      "1 <= expected_return[i] <= 10^4",
    ],
    approach:
      "0/1 Knapsack DP. dp[c] = max return achievable with exactly c capital. Iterate items in outer loop, capital in reverse to prevent reuse. Time O(N*C), space O(C).",
    code: `def max_portfolio_return(C: int, capital: list, expected_return: list) -> int:
    dp = [0] * (C + 1)
    for cap, ret in zip(capital, expected_return):
        for c in range(C, cap - 1, -1):
            dp[c] = max(dp[c], dp[c - cap] + ret)
    return dp[C]`,
    language: "python",
    complexity: { time: "O(N * C)", space: "O(C)" },
  },
  {
    id: "fin-20260716-b1-lis-prices",
    title: "Longest Increasing Subsequence of Prices",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Binary Search"],
    problem:
      "Given a price series, find the length of the longest strictly increasing subsequence of prices. This models finding the longest persistent uptrend ignoring noise. Also return the subsequence itself.",
    examples: [
      {
        input: "prices = [10,9,2,5,3,7,101,18]",
        output: "4",
        explanation: "Subsequence: [2,3,7,101] or [2,5,7,101].",
      },
      {
        input: "prices = [0,1,0,3,2,3]",
        output: "4",
        explanation: "[0,1,2,3].",
      },
    ],
    constraints: ["1 <= len(prices) <= 2500", "0 <= prices[i] <= 10^4"],
    approach:
      "Patience sorting / binary search: maintain tails[] where tails[i] is the smallest tail of all increasing subsequences of length i+1. For each price, binary search for its position. O(N log N) time, O(N) space. Recover the sequence with a parent pointer array.",
    code: `import bisect

def lis_with_sequence(prices: list) -> tuple:
    n = len(prices)
    tails = []       # tails[i] = smallest tail of IS length i+1
    parent = [-1] * n
    pos    = [0] * n   # position in tails where prices[i] was placed

    for i, p in enumerate(prices):
        idx = bisect.bisect_left(tails, p)
        if idx == len(tails):
            tails.append(p)
        else:
            tails[idx] = p
        pos[i] = idx
        parent[i] = -1
        # find predecessor: last j < i with pos[j] = idx-1
        if idx > 0:
            for j in range(i - 1, -1, -1):
                if pos[j] == idx - 1 and prices[j] < p:
                    parent[i] = j
                    break

    # Reconstruct
    length = len(tails)
    seq = []
    cur = next(i for i in range(n - 1, -1, -1) if pos[i] == length - 1)
    while cur != -1:
        seq.append(prices[cur])
        cur = parent[cur]
    return length, list(reversed(seq))`,
    language: "python",
    complexity: { time: "O(N^2) with reconstruction, O(N log N) for length only", space: "O(N)" },
    leetcodeNumber: 300,
  },
  {
    id: "fin-20260716-b1-merge-k-orderbooks",
    title: "Merge K Sorted Order Book Streams",
    difficulty: "hard",
    topics: ["Heap", "Merge", "Priority Queue"],
    problem:
      "You receive K sorted (ascending by price) order book streams of bid orders. Merge them into one sorted stream. Each stream is a list of (price, quantity) pairs sorted ascending. Return the merged list.",
    examples: [
      {
        input:
          "books = [[(1,100),(3,200),(5,50)], [(2,150),(4,300)], [(1,75),(6,200)]]",
        output: "[(1,100),(1,75),(2,150),(3,200),(4,300),(5,50),(6,200)]",
        explanation: "Three streams merged in sorted order by price.",
      },
    ],
    constraints: [
      "1 <= K <= 10^4",
      "0 <= N_i <= 500",
      "Total elements <= 10^4",
    ],
    approach:
      "Use a min-heap of size K. Push the first element of each stream. Pop the minimum, add to result, push the next element from that stream. O(N log K) where N = total elements.",
    code: `import heapq

def merge_k_orderbooks(books: list) -> list:
    result = []
    heap = []   # (price, qty, stream_idx, element_idx)
    for i, book in enumerate(books):
        if book:
            price, qty = book[0]
            heapq.heappush(heap, (price, qty, i, 0))

    while heap:
        price, qty, si, ei = heapq.heappop(heap)
        result.append((price, qty))
        if ei + 1 < len(books[si]):
            np_, nq = books[si][ei + 1]
            heapq.heappush(heap, (np_, nq, si, ei + 1))

    return result`,
    language: "python",
    complexity: { time: "O(N log K)", space: "O(K)" },
    leetcodeNumber: 23,
  },
  {
    id: "fin-20260716-b1-ipo-capital",
    title: "Maximize Capital for IPO Projects",
    difficulty: "hard",
    topics: ["Greedy", "Heap", "Sorting"],
    problem:
      "You have initial capital W and can complete at most k projects. Each project i has a minimum capital requirement capital[i] and a profit[i]. After completing a project your capital increases by its profit. You may not do the same project twice. Find the maximum capital after k projects.",
    examples: [
      {
        input: "k=2, W=0, profits=[1,2,3], capital=[0,1,1]",
        output: "4",
        explanation: "Do project 0 (profit 1, W->1), then project 2 (profit 3, W->4).",
      },
    ],
    constraints: [
      "1 <= k <= 10^5",
      "0 <= W <= 10^9",
      "0 <= capital[i] <= 10^9",
      "0 <= profit[i] <= 10^4",
      "len(profits) == len(capital)",
    ],
    approach:
      "Sort projects by capital. Use a max-heap of profits for all affordable projects. At each step, push all newly-affordable projects, pop max profit. Greedy: always take the most profitable affordable project. O(N log N) for sorting + O(k log N) for heap operations.",
    code: `import heapq

def find_maximized_capital(k: int, W: int,
                           profits: list, capital: list) -> int:
    projects = sorted(zip(capital, profits))
    available = []   # max-heap (negate profit)
    i = 0
    for _ in range(k):
        # Push all projects now affordable
        while i < len(projects) and projects[i][0] <= W:
            heapq.heappush(available, -projects[i][1])
            i += 1
        if not available:
            break
        W += -heapq.heappop(available)
    return W`,
    language: "python",
    complexity: { time: "O(N log N + k log N)", space: "O(N)" },
    leetcodeNumber: 502,
  },
  {
    id: "fin-20260716-b1-non-overlapping-trades",
    title: "Maximum Non-Overlapping Trade Windows",
    difficulty: "medium",
    topics: ["Greedy", "Interval Scheduling"],
    problem:
      "Given N trade windows as (start, end, profit), select the maximum number of non-overlapping windows to maximise total profit. Two windows overlap if one starts before the other ends. Return total profit and selected windows.",
    examples: [
      {
        input: "windows = [(1,4,10),(2,5,5),(4,7,8),(6,9,12)]",
        output: "22",
        explanation: "Select (1,4,10) and (4,7,8) and (6,9,12): no overlaps (end <= start), profit=30. Wait — (4,7) and (6,9) overlap. Best non-overlapping: (1,4,10)+(4,7,8)+(6,9 doesn't fit)=18, or (1,4,10)+(6,9,12)=22.",
      },
    ],
    constraints: [
      "1 <= N <= 10^5",
      "0 <= start < end <= 10^9",
      "1 <= profit <= 10^4",
    ],
    approach:
      "DP + binary search. Sort by end time. dp[i] = max profit considering first i windows. For each window, binary search for the latest non-overlapping previous window. dp[i] = max(dp[i-1], profit[i] + dp[j]) where j is last non-overlapping. O(N log N).",
    code: `import bisect

def max_profit_non_overlapping(windows: list) -> int:
    if not windows:
        return 0
    windows.sort(key=lambda x: x[1])   # sort by end
    ends = [w[1] for w in windows]
    n = len(windows)
    dp = [0] * (n + 1)

    for i, (start, end, profit) in enumerate(windows):
        # Latest window ending <= start
        j = bisect.bisect_right(ends, start, 0, i)
        dp[i + 1] = max(dp[i], dp[j] + profit)

    return dp[n]`,
    language: "python",
    complexity: { time: "O(N log N)", space: "O(N)" },
    leetcodeNumber: 435,
  },
  {
    id: "fin-20260716-b1-position-limit-check",
    title: "Position Limit Compliance Check (Segment Tree)",
    difficulty: "hard",
    topics: ["Segment Tree", "Range Query", "Simulation"],
    problem:
      "A broker tracks N asset positions. Each trade update changes position[i] by delta. The compliance system must answer: after each trade, what is the maximum absolute position across all assets? Also support point queries. Design a data structure supporting: update(i, delta) and query_max_abs() in O(log N).",
    examples: [
      {
        input:
          "N=4, updates=[(0,+100),(1,-200),(2,+150),(0,-50)], query after each",
        output: "[100, 200, 200, 200]",
        explanation:
          "Positions after each update: [100,0,0,0] max=100; [100,-200,0,0] max=200; [100,-200,150,0] max=200; [50,-200,150,0] max=200.",
      },
    ],
    constraints: ["1 <= N <= 10^5", "up to 10^5 updates", "|delta| <= 10^6"],
    approach:
      "Segment tree that stores max absolute value in each node. Point update propagates delta to position[i] and rebuilds the max path up the tree. Each operation is O(log N).",
    code: `class PositionTracker:
    def __init__(self, n: int):
        self.n = n
        self.pos  = [0] * n
        self.tree = [0] * (4 * n)

    def _build(self, node, lo, hi):
        if lo == hi:
            self.tree[node] = abs(self.pos[lo])
            return
        mid = (lo + hi) // 2
        self._build(2*node, lo, mid)
        self._build(2*node+1, mid+1, hi)
        self.tree[node] = max(self.tree[2*node], self.tree[2*node+1])

    def _update(self, node, lo, hi, idx):
        if lo == hi:
            self.tree[node] = abs(self.pos[idx])
            return
        mid = (lo + hi) // 2
        if idx <= mid:
            self._update(2*node, lo, mid, idx)
        else:
            self._update(2*node+1, mid+1, hi, idx)
        self.tree[node] = max(self.tree[2*node], self.tree[2*node+1])

    def update(self, i: int, delta: int) -> None:
        self.pos[i] += delta
        self._update(1, 0, self.n - 1, i)

    def query_max_abs(self) -> int:
        return self.tree[1]`,
    language: "python",
    complexity: { time: "O(log N) per operation", space: "O(N)" },
  },
];
