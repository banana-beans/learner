import type { LeetCodeProblem } from "./index";

export const financeProblems20260522B1: LeetCodeProblem[] = [
  {
    id: "fin-0522-b1-merge-k-streams",
    leetcodeNumber: 23,
    title: "Merge K Sorted Market Data Streams",
    difficulty: "hard",
    topics: ["heap", "linked-list", "market-data"],
    problem:
      "You receive K sorted streams of (timestamp, price) tick data from K different venues. Merge them into a single chronologically ordered stream. This is the real-time data normalisation problem every exchange aggregator solves.",
    examples: [
      {
        input: "streams = [[(1,100),(3,101)], [(2,99),(4,102)], [(1,100),(5,103)]]",
        output: "[(1,100),(1,100),(2,99),(3,101),(4,102),(5,103)]",
        explanation: "Merge all streams by timestamp; ties broken by stream index.",
      },
    ],
    approach:
      "Min-heap of size K storing (timestamp, price, stream_idx, item_idx). Pop the minimum, push the next item from that stream. O(N log K) total where N = total ticks. For the live case, block on the stream with the smallest unconfirmed timestamp.",
    code: `import heapq
from typing import Iterator

def merge_k_streams(streams: list[list[tuple[int, float]]]) -> list[tuple[int, float]]:
    heap: list[tuple[int, float, int, int]] = []

    # Initialise heap with the first element from each stream
    for s_idx, stream in enumerate(streams):
        if stream:
            ts, px = stream[0]
            heapq.heappush(heap, (ts, px, s_idx, 0))

    result: list[tuple[int, float]] = []
    while heap:
        ts, px, s_idx, item_idx = heapq.heappop(heap)
        result.append((ts, px))
        next_idx = item_idx + 1
        if next_idx < len(streams[s_idx]):
            nts, npx = streams[s_idx][next_idx]
            heapq.heappush(heap, (nts, npx, s_idx, next_idx))

    return result`,
    language: "python",
    complexity: { time: "O(N log K)", space: "O(K)" },
  },
  {
    id: "fin-0522-b1-lru-instrument-cache",
    leetcodeNumber: 146,
    title: "LRU Cache for Instrument State",
    difficulty: "medium",
    topics: ["design", "hash-map", "doubly-linked-list"],
    problem:
      "Design an LRU (Least Recently Used) cache that stores the latest quote for each instrument. When the cache is full and a new instrument arrives, evict the least recently accessed instrument. Supports O(1) get(symbol) and put(symbol, quote).",
    examples: [
      {
        input: `cache = InstrumentCache(capacity=2)
cache.put("AAPL", 250.0)
cache.put("MSFT", 420.0)
cache.get("AAPL")       # → 250.0 (AAPL promoted to MRU)
cache.put("TSLA", 180.0) # MSFT evicted (LRU)
cache.get("MSFT")        # → -1 (evicted)`,
        output: "250.0, -1",
        explanation: "MSFT was LRU when TSLA arrived because AAPL was accessed after MSFT.",
      },
    ],
    approach:
      "Doubly linked list for O(1) move-to-front and eviction + hash map for O(1) key lookup. The list stores keys in access order; the map maps key to node. On get: move to front. On put: insert at front, evict tail if over capacity.",
    code: `from collections import OrderedDict

class InstrumentCache:
    def __init__(self, capacity: int):
        self.cap   = capacity
        self.cache = OrderedDict()   # key -> value, ordered by access time

    def get(self, symbol: str) -> float:
        if symbol not in self.cache:
            return -1.0
        self.cache.move_to_end(symbol)   # mark as most recently used
        return self.cache[symbol]

    def put(self, symbol: str, quote: float) -> None:
        if symbol in self.cache:
            self.cache.move_to_end(symbol)
        self.cache[symbol] = quote
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)   # evict LRU (first item)`,
    language: "python",
    complexity: { time: "O(1) get and put", space: "O(capacity)" },
  },
  {
    id: "fin-0522-b1-floyd-warshall-arb",
    leetcodeNumber: 0,
    title: "FX Arbitrage via Floyd-Warshall (All-Pairs)",
    difficulty: "hard",
    topics: ["graph", "floyd-warshall", "dynamic-programming", "finance"],
    problem:
      "Given an N×N matrix of FX rates where rates[i][j] is the exchange rate from currency i to currency j, detect whether any profitable arbitrage cycle exists (a sequence of trades that returns more than the starting amount). Use Floyd-Warshall to check all pairs simultaneously.",
    examples: [
      {
        input: "N=3, rates = [[1, 0.9, 0.8], [1.12, 1, 0.89], [1.28, 1.14, 1]]",
        output: "True — cycle USD->EUR->GBP->USD has product 0.9*0.89*1.28 ≈ 1.025",
        explanation: "Take log of rates; arbitrage exists iff the max-product path from i to i exceeds 1, i.e. sum of log-rates > 0.",
      },
    ],
    approach:
      "Convert to log-rates: d[i][j] = log(rate[i][j]). Run Floyd-Warshall maximising path weight (negative log = Bellman-Ford min; positive log = FW max). After all pairs, check diagonal d[i][i] > 0 for any i — that is an arbitrage cycle.",
    code: `import math

def has_fx_arbitrage(rates: list[list[float]]) -> bool:
    n  = len(rates)
    # Log-rates: positive means profit
    d  = [[math.log(rates[i][j]) if i != j else 0.0
           for j in range(n)] for i in range(n)]

    # Floyd-Warshall: maximise sum of log-rates along path i -> k -> j
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] > d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]

    # Arbitrage: any self-path with positive gain
    return any(d[i][i] > 1e-10 for i in range(n))`,
    language: "python",
    complexity: { time: "O(N^3)", space: "O(N^2)" },
  },
  {
    id: "fin-0522-b1-event-scheduler",
    leetcodeNumber: 0,
    title: "Priority-Queue Event Scheduler (Order Book Events)",
    difficulty: "medium",
    topics: ["heap", "design", "simulation"],
    problem:
      "Design a trade event scheduler that processes events at their scheduled timestamps in order. Events include: PLACE(t, order_id, side, price, qty), CANCEL(t, order_id), and EXPIRE(t, order_id). Process all events in timestamp order; ties broken by event type priority (CANCEL < EXPIRE < PLACE). Return the list of processed event IDs in order.",
    examples: [
      {
        input: `events = [
  ("PLACE",  3, 101, "B", 100.0, 10),
  ("CANCEL", 1, 101),
  ("PLACE",  1, 102, "S", 101.0, 5),
  ("EXPIRE", 2, 102),
]`,
        output: "Processed: CANCEL@1(101), EXPIRE@2(102), PLACE@3(101)",
        explanation: "Cancel arrives before the order it references; in real matching engines events are sequenced by exchange-assigned sequence numbers.",
      },
    ],
    approach:
      "Push all events into a min-heap keyed by (timestamp, type_priority, event_id). Pop and process in order. Type priority encodes: CANCEL=0, EXPIRE=1, PLACE=2 so cancels take precedence at equal timestamps.",
    code: `import heapq
from dataclasses import dataclass, field
from typing import Any

TYPE_PRIORITY = {"CANCEL": 0, "EXPIRE": 1, "PLACE": 2}

def schedule_events(events: list[tuple]) -> list[str]:
    heap: list[tuple] = []
    for ev in events:
        etype, ts = ev[0], ev[1]
        pri = TYPE_PRIORITY.get(etype, 9)
        heapq.heappush(heap, (ts, pri, ev))

    processed = []
    while heap:
        ts, pri, ev = heapq.heappop(heap)
        etype = ev[0]
        oid   = ev[2]
        processed.append(f"{etype}@{ts}(oid={oid})")
        # In a real engine: dispatch to order book here
    return processed`,
    language: "python",
    complexity: { time: "O(N log N)", space: "O(N)" },
  },
  {
    id: "fin-0522-b1-max-profit-k2",
    leetcodeNumber: 123,
    title: "Best Time to Buy and Sell — At Most 2 Transactions",
    difficulty: "hard",
    topics: ["dynamic-programming", "finance"],
    problem:
      "Given daily prices, find the maximum profit using at most 2 non-overlapping transactions (must sell before buying again). This models a trader with a 2-trade allocation for the period.",
    examples: [
      {
        input: "prices = [3, 3, 5, 0, 0, 3, 1, 4]",
        output: "6",
        explanation: "Buy @0, sell @5 (+3), buy @1, sell @4 (+3) = 6.",
      },
      {
        input: "prices = [1, 2, 3, 4, 5]",
        output: "4",
        explanation: "Single transaction: buy @1 sell @5.",
      },
    ],
    approach:
      "Four state variables: buy1 (best outcome after 1st buy), sell1 (after 1st sell), buy2 (after 2nd buy), sell2 (after 2nd sell). Scan prices once, updating each state optimally. O(1) space generalises from the k-transaction DP.",
    code: `def max_profit_2(prices: list[int]) -> int:
    buy1 = buy2 = float('-inf')
    sell1 = sell2 = 0

    for p in prices:
        buy1  = max(buy1,  -p)          # best profit after buying once
        sell1 = max(sell1, buy1  + p)   # best profit after selling once
        buy2  = max(buy2,  sell1 - p)   # best profit after buying second time
        sell2 = max(sell2, buy2  + p)   # best profit after selling second time

    return sell2`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-0522-b1-count-inversions",
    leetcodeNumber: 0,
    title: "Count Inversions in Tick Stream (Merge Sort)",
    difficulty: "medium",
    topics: ["merge-sort", "divide-and-conquer", "finance"],
    problem:
      "Given a sequence of N tick prices, count the number of inversions — pairs (i, j) where i < j but price[i] > price[j]. An inversion count measures how 'out of order' a price series is, which correlates with short-term mean reversion. Return the inversion count modulo 10^9 + 7.",
    examples: [
      {
        input: "prices = [5, 3, 2, 4, 1]",
        output: "7",
        explanation: "(5,3),(5,2),(5,4),(5,1),(3,2),(3,1),(2,1) — 7 inversions.",
      },
    ],
    approach:
      "Merge sort: during the merge step, when an element from the right half is placed before elements from the left half, those left-half elements form inversions. Count them as mid - left_ptr + 1 and accumulate.",
    code: `MOD = 10**9 + 7

def count_inversions(prices: list[int]) -> int:
    def merge_sort(arr: list[int]) -> tuple[list[int], int]:
        if len(arr) <= 1:
            return arr, 0
        mid   = len(arr) // 2
        left,  inv_l = merge_sort(arr[:mid])
        right, inv_r = merge_sort(arr[mid:])

        merged, inv = [], 0
        i = j = 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i]); i += 1
            else:
                # All remaining left elements are > right[j]: inversions
                inv += (len(left) - i) % MOD
                merged.append(right[j]); j += 1
        merged.extend(left[i:])
        merged.extend(right[j:])
        return merged, (inv_l + inv_r + inv) % MOD

    _, total = merge_sort(prices)
    return total`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-0522-b1-min-cost-execution",
    leetcodeNumber: 743,
    title: "Minimum Cost Execution Routing (Dijkstra)",
    difficulty: "medium",
    topics: ["graph", "dijkstra", "shortest-path", "finance"],
    problem:
      "A broker has N execution venues connected by routing edges with cost = latency + fee. Given a source venue S and destination venue D, find the minimum total cost path to route an order. Edge costs are non-negative (fees are always non-negative in practice).",
    examples: [
      {
        input: `N=4, S=0, D=3
edges = [(0,1,2),(0,2,6),(1,2,3),(1,3,8),(2,3,1)]`,
        output: "6  (path: 0->1->2->3, cost 2+3+1=6)",
        explanation: "Direct 0->2->3 costs 7; routing via 1 saves 1 unit.",
      },
    ],
    approach:
      "Standard Dijkstra with a min-heap. Each state is (cumulative_cost, node). Relax edges greedily — correct because all costs are non-negative.",
    code: `import heapq

def min_route_cost(n: int, edges: list[tuple[int,int,int]],
                   src: int, dst: int) -> int:
    graph: list[list[tuple[int,int]]] = [[] for _ in range(n)]
    for u, v, w in edges:
        graph[u].append((v, w))
        graph[v].append((u, w))   # undirected

    dist = [float('inf')] * n
    dist[src] = 0
    heap = [(0, src)]

    while heap:
        cost, u = heapq.heappop(heap)
        if cost > dist[u]:
            continue
        for v, w in graph[u]:
            nc = cost + w
            if nc < dist[v]:
                dist[v] = nc
                heapq.heappush(heap, (nc, v))

    return dist[dst] if dist[dst] != float('inf') else -1`,
    language: "python",
    complexity: { time: "O((V + E) log V)", space: "O(V + E)" },
  },
  {
    id: "fin-0522-b1-subarray-target-pnl",
    leetcodeNumber: 560,
    title: "Subarray with Target PnL (Prefix Sum)",
    difficulty: "medium",
    topics: ["prefix-sum", "hash-map", "finance"],
    problem:
      "Given an array of daily PnL values (positive = gain, negative = loss) and a target T, return the number of contiguous subarrays whose total PnL equals exactly T. This is the 'find all periods with a specific accumulated return' problem.",
    examples: [
      {
        input: "pnl = [1, -1, 2, 3, -2, 1], T = 3",
        output: "4",
        explanation: "Subarrays with sum=3: [1,-1,2,3,-2] sum=3? no. [3],[-2,1,2,3],... enumerate: [3], [-1,2,3-1]... [3]=3, [-1,2,3-1]=3? check: 2+3-2=3 yes, and so on.",
      },
    ],
    approach:
      "Running prefix sum P[i]. For each i, count how many j < i have P[j] = P[i] - T. Store prefix sum counts in a hash map. O(n) time.",
    code: `from collections import defaultdict

def count_target_pnl_periods(pnl: list[int], target: int) -> int:
    prefix_count: dict[int, int] = defaultdict(int)
    prefix_count[0] = 1   # empty prefix has sum 0

    running = 0
    total   = 0
    for p in pnl:
        running += p
        # Number of subarrays ending here with sum == target
        total += prefix_count[running - target]
        prefix_count[running] += 1

    return total`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "fin-0522-b1-design-ema",
    leetcodeNumber: 0,
    title: "Design: Streaming EMA with Configurable Decay",
    difficulty: "easy",
    topics: ["design", "math", "finance"],
    problem:
      "Design a class ExponentialMovingAverage(alpha) that: (1) accepts a stream of prices via update(price), (2) returns the current EMA via value(), (3) supports reset(). The EMA is defined as: EMA_t = alpha * price_t + (1 - alpha) * EMA_{t-1}. Also implement the 'de-biased' initialisation for the cold-start period.",
    examples: [
      {
        input: `ema = EMA(alpha=0.1)
ema.update(100); ema.update(102); ema.update(101)
ema.value()`,
        output: "≈100.29 (exact depends on initialisation)",
        explanation: "First update: EMA=100. Second: 0.1*102 + 0.9*100 = 100.2. Third: 0.1*101 + 0.9*100.2 = 100.28.",
      },
    ],
    approach:
      "Track current EMA and a bias correction term (1 - (1-alpha)^t). The bias-corrected EMA = raw_ema / correction avoids the cold-start bias when the EMA is initialised to zero instead of the first price.",
    code: `class EMA:
    def __init__(self, alpha: float):
        assert 0 < alpha <= 1, "alpha must be in (0, 1]"
        self.alpha   = alpha
        self._ema    = 0.0
        self._corr   = 0.0    # 1 - (1-alpha)^t for bias correction
        self._t      = 0

    def update(self, price: float) -> None:
        self._t   += 1
        a          = self.alpha
        self._ema  = a * price + (1.0 - a) * self._ema
        self._corr = 1.0 - (1.0 - a) ** self._t   # converges to 1

    def value(self) -> float:
        if self._t == 0:
            return 0.0
        return self._ema / self._corr   # bias-corrected (Adam-style)

    def reset(self) -> None:
        self._ema = self._corr = 0.0
        self._t   = 0`,
    language: "python",
    complexity: { time: "O(1) per update", space: "O(1)" },
  },
  {
    id: "fin-0522-b1-coin-change-lot-size",
    leetcodeNumber: 322,
    title: "Minimum Lot-Size Decomposition (Coin Change)",
    difficulty: "medium",
    topics: ["dynamic-programming", "finance"],
    problem:
      "A broker supports trades in lot sizes [1, 5, 10, 50, 100] shares. Given a target quantity Q, find the minimum number of trades (lots) needed to reach exactly Q shares. This generalises to order splitting across venues with fixed lot minimums.",
    examples: [
      {
        input: "lot_sizes = [1, 5, 10, 50, 100], Q = 73",
        output: "5  (100 is too big; 50+10+10+1+1+1 = 6 vs 50+10+10+1+1+1=6 vs 50+10+5+5+1+1+1=7... optimal: 50+10+10+1+1+1=6? Actually: 50+10+10+3*1=6)",
        explanation: "Greedy doesn't always work (e.g. lot_sizes=[1,3,4], Q=6: greedy gives 4+1+1=3 trades, DP gives 3+3=2 trades). DP is correct.",
      },
    ],
    approach:
      "Classic coin-change DP: dp[q] = min trades to reach quantity q. dp[0]=0, dp[q] = min over all lot_sizes l where l<=q of dp[q-l]+1.",
    code: `def min_lots(lot_sizes: list[int], Q: int) -> int:
    INF = float('inf')
    dp  = [INF] * (Q + 1)
    dp[0] = 0

    for q in range(1, Q + 1):
        for lot in lot_sizes:
            if lot <= q and dp[q - lot] + 1 < dp[q]:
                dp[q] = dp[q - lot] + 1

    return dp[Q] if dp[Q] < INF else -1   # -1 = impossible`,
    language: "python",
    complexity: { time: "O(Q * |lots|)", space: "O(Q)" },
  },
];
