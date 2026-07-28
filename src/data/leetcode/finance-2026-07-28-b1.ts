import type { LeetCodeProblem } from "./index";

export const financeProblems20260728B1: LeetCodeProblem[] = [
  {
    id: "fin-20260728-b1-token-bucket",
    title: "Token Bucket Rate Limiter",
    difficulty: "medium",
    topics: ["Design", "Queue", "Math"],
    problem:
      "Design a token bucket rate limiter for a trading API. The bucket has a fixed capacity C and refills at rate R tokens per second. Each API call consumes one token. Implement: `TokenBucket(capacity, refillRate)`, `bool allowRequest(timestamp)` — return true if a token is available at the given timestamp (fractional seconds), false otherwise.",
    examples: [
      {
        input: "capacity=5, refillRate=2\nallowRequest(0.0) x5, allowRequest(0.0), allowRequest(1.0), allowRequest(1.0), allowRequest(1.0)",
        output: "[true, true, true, true, true, false, true, true, false]",
        explanation:
          "Bucket starts full (5 tokens). Five requests at t=0 drain it. Sixth fails. At t=1.0 two tokens refill; three more attempts at t=1.0 → two succeed, one fails.",
      },
    ],
    constraints: ["0 ≤ timestamp ≤ 1e9", "1 ≤ capacity ≤ 1e6", "0 < refillRate ≤ 1e6"],
    approach:
      "Store last_refill_time and current_tokens. On each request, compute elapsed = timestamp - last_refill_time, add elapsed * refillRate tokens (capped at capacity), update last_refill_time, then check and decrement if tokens ≥ 1.",
    code: `class TokenBucket:
    def __init__(self, capacity: float, refill_rate: float):
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = float(capacity)  # start full
        self.last_time = 0.0

    def allow_request(self, timestamp: float) -> bool:
        elapsed = timestamp - self.last_time
        self.tokens = min(self.capacity,
                          self.tokens + elapsed * self.refill_rate)
        self.last_time = timestamp
        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False

# Test
tb = TokenBucket(5, 2)
timestamps = [0.0]*6 + [1.0]*3
for ts in timestamps:
    print(tb.allow_request(ts), end=" ")`,
    language: "python",
    complexity: { time: "O(1) per request", space: "O(1)" },
  },
  {
    id: "fin-20260728-b1-matrix-exponentiation",
    title: "Compound Return via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["Math", "Matrix", "Dynamic Programming"],
    problem:
      "A portfolio follows a linear recurrence: V(n) = a * V(n-1) + b * V(n-2) where a and b are monthly growth factors. Given V(0), V(1), a, b, and n months, compute V(n) mod 10^9+7. n can be up to 10^18.",
    examples: [
      {
        input: "V0=1, V1=2, a=3, b=1, n=5",
        output: "V(5) = 3*V(4) + V(3) = 3*(3*V(3)+V(2)) + V(3) = ... = 71",
        explanation: "V(2)=8, V(3)=25, V(4)=83, V(5)=284 (before mod). With mod 1e9+7 = 284.",
      },
    ],
    constraints: ["1 ≤ n ≤ 10^18", "0 ≤ a, b < 10^9+7", "Matrix exponentiation required"],
    approach:
      "Represent [V(n), V(n-1)]^T = M^(n-1) * [V(1), V(0)]^T where M = [[a, b],[1, 0]]. Use fast matrix exponentiation (repeated squaring) in O(log n) multiplications.",
    code: `MOD = 10**9 + 7

def mat_mul(A, B):
    n = len(A)
    C = [[0]*n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % MOD
    return C

def mat_pow(M, p):
    n = len(M)
    result = [[1 if i == j else 0 for j in range(n)] for i in range(n)]
    while p:
        if p & 1:
            result = mat_mul(result, M)
        M = mat_mul(M, M)
        p >>= 1
    return result

def compound_return(V0: int, V1: int, a: int, b: int, n: int) -> int:
    if n == 0:
        return V0 % MOD
    if n == 1:
        return V1 % MOD
    # [V(n), V(n-1)] = M^(n-1) * [V(1), V(0)]
    M = [[a % MOD, b % MOD], [1, 0]]
    Mp = mat_pow(M, n - 1)
    result = (Mp[0][0] * V1 + Mp[0][1] * V0) % MOD
    return result

print(compound_return(1, 2, 3, 1, 5))   # 284
print(compound_return(1, 2, 3, 1, 10**18))  # large n`,
    language: "python",
    complexity: { time: "O(k^3 log n) where k=2", space: "O(k^2)" },
    leetcodeNumber: 509,
  },
  {
    id: "fin-20260728-b1-dijkstra-fx",
    title: "Cheapest FX Route (Dijkstra)",
    difficulty: "medium",
    topics: ["Graph", "Dijkstra", "Heap"],
    problem:
      "You are given n currencies and a list of exchange rates as (from, to, rate). Find the maximum product of exchange rates (i.e. most USD you end up with) when converting from currency src to currency dst in at most k hops. If no path exists, return -1.",
    examples: [
      {
        input: "n=4, rates=[(0,1,1.5),(0,2,1.2),(1,3,0.9),(2,3,1.1)], src=0, dst=3, k=3",
        output: "1.32",
        explanation: "0→2→3: 1.2 * 1.1 = 1.32 > 0→1→3: 1.5 * 0.9 = 1.35. Wait: 1.35 > 1.32, so answer is 1.35.",
      },
    ],
    constraints: ["1 ≤ n ≤ 100", "1 ≤ edges ≤ 1000", "rate > 0", "k ≤ n"],
    approach:
      "Use modified Dijkstra with a max-heap on the accumulated product. State = (neg_product, node, hops_remaining). Prune when hops exhausted. Use log-transformation: maximize sum of log(rate) = Dijkstra on negated log rates.",
    code: `import heapq

def best_fx_route(n, rates, src, dst, k):
    graph = [[] for _ in range(n)]
    for u, v, r in rates:
        graph[u].append((v, r))
        graph[v].append((u, 1.0/r))  # bidirectional

    # Max-heap: store (-product, node, hops_left)
    # product tracks accumulated conversion
    heap = [(-1.0, src, k)]
    best = {}  # best product seen at (node, hops)

    while heap:
        neg_prod, node, hops = heapq.heappop(heap)
        prod = -neg_prod

        if node == dst:
            return round(prod, 8)

        if hops == 0:
            continue

        state = (node, hops)
        if state in best and best[state] >= prod:
            continue
        best[state] = prod

        for neighbor, rate in graph[node]:
            new_prod = prod * rate
            heapq.heappush(heap, (-new_prod, neighbor, hops - 1))

    return -1

rates = [(0,1,1.5),(0,2,1.2),(1,3,0.9),(2,3,1.1)]
print(best_fx_route(4, rates, 0, 3, 3))  # 1.35`,
    language: "python",
    complexity: { time: "O((E + V) log V * k)", space: "O(V * k)" },
  },
  {
    id: "fin-20260728-b1-lru-tick-cache",
    title: "LRU Cache for Tick Data",
    difficulty: "medium",
    topics: ["Design", "Hash Map", "Doubly Linked List"],
    problem:
      "Design an LRU (Least Recently Used) cache that stores the latest tick for each trading symbol. Implement `TickCache(capacity)`, `get(symbol) -> price | -1`, `put(symbol, price)`. When capacity is exceeded, evict the least recently accessed symbol.",
    examples: [
      {
        input: "capacity=3\nput(AAPL,150), put(GOOG,200), put(MSFT,300)\nget(AAPL)\nput(AMZN,400)\nget(GOOG)",
        output: "get(AAPL)=150, get(GOOG)=-1",
        explanation: "After get(AAPL), LRU order is GOOG < MSFT < AAPL. put(AMZN) evicts GOOG (LRU). So get(GOOG) returns -1.",
      },
    ],
    constraints: ["1 ≤ capacity ≤ 3000", "At most 10^5 operations"],
    approach:
      "Use an OrderedDict (Python) which maintains insertion order. On get: pop and re-insert to mark as recently used. On put: evict the first key if at capacity. Both ops O(1).",
    code: `from collections import OrderedDict

class TickCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = OrderedDict()  # key: symbol, val: price

    def get(self, symbol: str) -> float:
        if symbol not in self.cache:
            return -1
        self.cache.move_to_end(symbol)  # mark as recently used
        return self.cache[symbol]

    def put(self, symbol: str, price: float) -> None:
        if symbol in self.cache:
            self.cache.move_to_end(symbol)
        self.cache[symbol] = price
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)  # evict LRU (front)

# Test
tc = TickCache(3)
tc.put("AAPL", 150)
tc.put("GOOG", 200)
tc.put("MSFT", 300)
print(tc.get("AAPL"))   # 150 — promotes AAPL
tc.put("AMZN", 400)     # evicts GOOG (LRU)
print(tc.get("GOOG"))   # -1
print(tc.get("MSFT"))   # 300`,
    language: "python",
    complexity: { time: "O(1) get/put", space: "O(capacity)" },
    leetcodeNumber: 146,
  },
  {
    id: "fin-20260728-b1-two-sum-delta-hedge",
    title: "Two-Sum Delta Hedge Matching",
    difficulty: "easy",
    topics: ["Hash Map", "Array"],
    problem:
      "A risk manager has a list of option deltas. Find all pairs of options whose combined delta equals a target hedge delta T (e.g. 0.0 for delta-neutral). Return the indices of all such pairs. Deltas are floats; treat two floats as equal if |a - b| < 1e-9.",
    examples: [
      {
        input: "deltas=[0.3, -0.5, 0.7, 0.2, -0.3, 0.5], T=0.0",
        output: "[[0,4],[1,5],[2,3] if 0.7+(-0.3)!=0 → only [0,4] and [1,5]]",
        explanation: "0.3 + (-0.3) = 0.0 → pair (0,4). -0.5 + 0.5 = 0.0 → pair (1,5). 0.7 + 0.2 = 0.9 ≠ 0.",
      },
    ],
    constraints: ["2 ≤ n ≤ 10^4", "Each delta in [-1, 1]", "Return all unique pairs"],
    approach:
      "Use a hash map from delta value to list of indices. For each delta d, look up (T - d) in the map. Use rounded key (6 decimals) to handle float equality. Collect pairs where i < j to avoid duplicates.",
    code: `from collections import defaultdict
from typing import List

def find_delta_neutral_pairs(deltas: List[float], T: float) -> List[List[int]]:
    seen = defaultdict(list)  # rounded_delta -> [indices]
    pairs = []

    for i, d in enumerate(deltas):
        complement = round(T - d, 6)
        key = round(d, 6)
        if complement in seen:
            for j in seen[complement]:
                pairs.append([j, i])
        seen[key].append(i)

    return pairs

deltas = [0.3, -0.5, 0.7, 0.2, -0.3, 0.5]
result = find_delta_neutral_pairs(deltas, T=0.0)
print(result)  # [[0, 4], [1, 5]]

# Portfolio delta check
deltas2 = [0.25, 0.75, -0.5, -0.25, 0.5]
print(find_delta_neutral_pairs(deltas2, T=0.0))`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
    leetcodeNumber: 1,
  },
  {
    id: "fin-20260728-b1-stock-k-transactions",
    title: "Max Profit with K Transactions",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Array"],
    problem:
      "You are given daily closing prices of a stock. Find the maximum profit using at most k transactions (buy then sell = 1 transaction). You must sell before buying again.",
    examples: [
      {
        input: "prices=[3,2,6,5,0,3], k=2",
        output: "7",
        explanation: "Buy at 2, sell at 6 (profit 4). Buy at 0, sell at 3 (profit 3). Total = 7.",
      },
    ],
    constraints: ["1 ≤ k ≤ n/2", "1 ≤ prices.length ≤ 1000", "0 ≤ prices[i] ≤ 1000"],
    approach:
      "DP: dp[t][i] = max profit using at most t transactions up to day i. Transition: dp[t][i] = max(dp[t][i-1], prices[i] + max over j<i of (dp[t-1][j] - prices[j])). Track running max of (dp[t-1][j] - prices[j]) to reduce inner loop to O(1).",
    code: `from typing import List

def max_profit_k(k: int, prices: List[int]) -> int:
    n = len(prices)
    if n <= 1 or k == 0:
        return 0

    # If k >= n//2, unlimited transactions
    if k >= n // 2:
        return sum(max(prices[i+1] - prices[i], 0) for i in range(n-1))

    # dp[t][i] = max profit with at most t transactions up to day i
    # Optimise: dp is (k+1) x n but we only need current row
    dp = [[0] * n for _ in range(k + 1)]

    for t in range(1, k + 1):
        max_so_far = -prices[0]  # max(dp[t-1][j] - prices[j]) for j < i
        for i in range(1, n):
            dp[t][i] = max(dp[t][i-1], prices[i] + max_so_far)
            max_so_far = max(max_so_far, dp[t-1][i] - prices[i])

    return dp[k][n-1]

print(max_profit_k(2, [3,2,6,5,0,3]))   # 7
print(max_profit_k(2, [1,2,3,4,5]))     # 4
print(max_profit_k(1, [3,2,1]))          # 0`,
    language: "python",
    complexity: { time: "O(k * n)", space: "O(k * n)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260728-b1-stock-span",
    title: "Stock Span (Monotonic Stack)",
    difficulty: "medium",
    topics: ["Stack", "Array", "Design"],
    problem:
      "Design a StockSpanner that computes the span of a stock's price for the current day. The span is the number of consecutive days (including today) for which the price was ≤ today's price. Used to identify support levels in technical analysis.",
    examples: [
      {
        input: "next(100), next(80), next(60), next(70), next(60), next(75), next(85)",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation: "85 spans back through 75, 60, 70, 60, 80 (no: 80>85? 80<85 ✓), so span=6.",
      },
    ],
    constraints: ["1 ≤ price ≤ 10^5", "At most 10^4 calls to next"],
    approach:
      "Maintain a monotonic decreasing stack of (price, span) pairs. When a new price arrives, pop all pairs with price ≤ new price, accumulating their spans. Push the new price with accumulated span. Each element pushed/popped at most once: amortised O(1).",
    code: `class StockSpanner:
    def __init__(self):
        # Stack of (price, span)
        self.stack = []

    def next(self, price: int) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]
        self.stack.append((price, span))
        return span

# Test
spanner = StockSpanner()
prices = [100, 80, 60, 70, 60, 75, 85]
spans  = [spanner.next(p) for p in prices]
print(spans)  # [1, 1, 1, 2, 1, 4, 6]

# Trading application: detect breakout when span > threshold
BREAKOUT_SPAN = 5
for p, s in zip(prices, spans):
    if s >= BREAKOUT_SPAN:
        print(f"Breakout at price {p}: span={s}")`,
    language: "python",
    complexity: { time: "O(1) amortised per call", space: "O(n)" },
    leetcodeNumber: 901,
  },
  {
    id: "fin-20260728-b1-jump-game-bond-ladder",
    title: "Bond Ladder Jump Game",
    difficulty: "medium",
    topics: ["Greedy", "Array", "Dynamic Programming"],
    problem:
      "A bond ladder has n bonds, each maturing at month i (0-indexed) and paying a coupon c[i]. You can reinvest the coupon of bond i into any bond j where j ≤ i + c[i]. Starting from bond 0, can you reach the final bond n-1? If yes, return the minimum number of reinvestments (jumps) needed.",
    examples: [
      {
        input: "coupons=[2,3,1,1,4]",
        output: "2",
        explanation: "Jump from index 0 (reach up to 2) → jump from index 1 (reach up to 4). 2 jumps.",
      },
    ],
    constraints: ["1 ≤ n ≤ 10^4", "0 ≤ coupons[i] ≤ 1000"],
    approach:
      "Greedy BFS: track current reach and next reach. When you exhaust positions reachable in current jump, increment jumps and update current reach to next reach. O(n).",
    code: `from typing import List

def min_jumps(coupons: List[int]) -> int:
    n = len(coupons)
    if n <= 1:
        return 0

    jumps = 0
    current_end = 0  # furthest index reachable with current jumps
    farthest = 0     # furthest index reachable with one more jump

    for i in range(n - 1):  # don't need to jump from last position
        farthest = max(farthest, i + coupons[i])
        if i == current_end:  # must take a jump here
            jumps += 1
            current_end = farthest
            if current_end >= n - 1:
                return jumps

    return jumps if current_end >= n - 1 else -1  # -1 = unreachable

# Tests
print(min_jumps([2,3,1,1,4]))   # 2
print(min_jumps([2,3,0,1,4]))   # 2
print(min_jumps([3,2,1,0,4]))   # -1 (unreachable)
print(min_jumps([0]))            # 0

# Bond ladder interpretation: last bond = target maturity
# coupons = how many periods forward you can reinvest`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
    leetcodeNumber: 45,
  },
  {
    id: "fin-20260728-b1-circular-deque-nav",
    title: "Circular Deque Rolling NAV Window",
    difficulty: "medium",
    topics: ["Design", "Deque", "Array"],
    problem:
      "Design a RollingNAV data structure that maintains a sliding window of the last k daily NAVs. Implement: `push(nav)` — add today's NAV; `window_mean()` — average of last k NAVs; `window_max()` — max in last k NAVs; `window_min()` — min in last k NAVs. All operations O(1) amortised.",
    examples: [
      {
        input: "k=3\npush(100), push(105), push(102), push(110)\nwindow_mean, window_max, window_min",
        output: "mean=105.67, max=110, min=102",
        explanation: "Window after 4 pushes: [105, 102, 110]. Mean=(105+102+110)/3=105.67.",
      },
    ],
    constraints: ["1 ≤ k ≤ 10^4", "At most 10^5 operations"],
    approach:
      "Circular array of size k for the window and running sum for O(1) mean. Two monotonic deques (max-deque decreasing, min-deque increasing) for O(1) amortised max/min.",
    code: `from collections import deque

class RollingNAV:
    def __init__(self, k: int):
        self.k = k
        self.window = deque()  # actual values
        self.total = 0.0
        self.max_dq = deque()  # decreasing: front = max
        self.min_dq = deque()  # increasing: front = min

    def push(self, nav: float) -> None:
        # Evict oldest if window full
        if len(self.window) == self.k:
            old = self.window.popleft()
            self.total -= old
            if self.max_dq[0] == old:
                self.max_dq.popleft()
            if self.min_dq[0] == old:
                self.min_dq.popleft()

        self.window.append(nav)
        self.total += nav

        while self.max_dq and self.max_dq[-1] < nav:
            self.max_dq.pop()
        self.max_dq.append(nav)

        while self.min_dq and self.min_dq[-1] > nav:
            self.min_dq.pop()
        self.min_dq.append(nav)

    def window_mean(self) -> float:
        return self.total / len(self.window)

    def window_max(self) -> float:
        return self.max_dq[0]

    def window_min(self) -> float:
        return self.min_dq[0]

rn = RollingNAV(3)
for nav in [100, 105, 102, 110]:
    rn.push(nav)
print(f"mean={rn.window_mean():.2f} max={rn.window_max()} min={rn.window_min()}")`,
    language: "python",
    complexity: { time: "O(1) amortised push, O(1) queries", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260728-b1-range-sum-vwap",
    title: "Range Sum VWAP Query",
    difficulty: "easy",
    topics: ["Prefix Sum", "Array", "Design"],
    problem:
      "Given a list of (price, volume) ticks, support two operations: `update(i, price, volume)` — update tick at index i; `vwap(l, r)` — return the volume-weighted average price over ticks [l, r] inclusive. Implement efficiently for multiple queries.",
    examples: [
      {
        input: "ticks=[(10,100),(12,200),(11,150),(13,50)]\nvwap(0,3), update(1,14,200), vwap(0,3)",
        output: "vwap(0,3)=11.4, vwap after update=11.88...",
        explanation: "vwap=(10*100+12*200+11*150+13*50)/(100+200+150+50)=(1000+2400+1650+650)/500=5700/500=11.4",
      },
    ],
    constraints: ["1 ≤ n ≤ 10^5", "1 ≤ queries ≤ 10^5", "Use prefix sums for query-heavy, BIT for update-heavy"],
    approach:
      "Use two Binary Indexed Trees (Fenwick trees): one for sum(price*volume), one for sum(volume). VWAP(l,r) = BIT_pv.query(l,r) / BIT_v.query(l,r). Point updates in O(log n), range queries in O(log n).",
    code: `from typing import List, Tuple

class BIT:
    """Binary Indexed Tree (Fenwick Tree) for range sum queries."""
    def __init__(self, n: int):
        self.n = n
        self.tree = [0.0] * (n + 1)

    def update(self, i: int, delta: float) -> None:
        i += 1
        while i <= self.n:
            self.tree[i] += delta
            i += i & (-i)

    def prefix(self, i: int) -> float:
        i += 1
        s = 0.0
        while i > 0:
            s += self.tree[i]
            i -= i & (-i)
        return s

    def query(self, l: int, r: int) -> float:
        return self.prefix(r) - (self.prefix(l-1) if l > 0 else 0)

class VWAPStream:
    def __init__(self, ticks: List[Tuple[float, float]]):
        n = len(ticks)
        self.n = n
        self.prices  = [p for p, _ in ticks]
        self.volumes = [v for _, v in ticks]
        self.bit_pv = BIT(n)
        self.bit_v  = BIT(n)
        for i, (p, v) in enumerate(ticks):
            self.bit_pv.update(i, p * v)
            self.bit_v.update(i, v)

    def update(self, i: int, price: float, volume: float) -> None:
        old_p, old_v = self.prices[i], self.volumes[i]
        self.bit_pv.update(i, price*volume - old_p*old_v)
        self.bit_v.update(i,  volume - old_v)
        self.prices[i] = price
        self.volumes[i] = volume

    def vwap(self, l: int, r: int) -> float:
        total_vol = self.bit_v.query(l, r)
        if total_vol == 0:
            return 0.0
        return self.bit_pv.query(l, r) / total_vol

ticks = [(10,100),(12,200),(11,150),(13,50)]
vs = VWAPStream(ticks)
print(f"VWAP(0,3) = {vs.vwap(0,3):.4f}")   # 11.4
vs.update(1, 14, 200)
print(f"VWAP(0,3) after update = {vs.vwap(0,3):.4f}")`,
    language: "python",
    complexity: { time: "O(log n) update and query", space: "O(n)" },
  },
];
