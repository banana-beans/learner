import type { LeetCodeProblem } from "./index";

export const financeProblems20260708B1: LeetCodeProblem[] = [
  {
    id: "fin-20260708-b1-sliding-window-max",
    title: "Rolling Maximum Bid Price",
    difficulty: "medium",
    topics: ["Monotonic Deque", "Sliding Window", "Market Data"],
    problem:
      "Given a stream of bid prices and a window size k, return the maximum bid in every window of k consecutive ticks. This is used to detect resistance levels in real time. For example with prices=[3,1,4,1,5,9,2,6] and k=3, the output is [4,4,5,9,9,9].",
    examples: [
      {
        input: "prices = [3,1,4,1,5,9,2,6], k = 3",
        output: "[4, 4, 5, 9, 9, 9]",
        explanation:
          "Window [3,1,4]→4, [1,4,1]→4, [4,1,5]→5, [1,5,9]→9, [5,9,2]→9, [9,2,6]→9.",
      },
    ],
    constraints: [
      "1 ≤ k ≤ len(prices) ≤ 10^5",
      "Prices are positive integers representing cents.",
      "O(N) time required.",
    ],
    approach:
      "Maintain a monotonic decreasing deque of indices. For each new price, pop from the back while the back element is smaller — it can never be a future window max. Pop from the front when the front index falls outside the current window. The front is always the current window max.",
    code: `from collections import deque

def rolling_max_bid(prices: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()   # stores indices, decreasing in prices value
    result = []

    for i, price in enumerate(prices):
        # Remove indices outside the window
        while dq and dq[0] < i - k + 1:
            dq.popleft()

        # Maintain decreasing invariant: remove smaller back elements
        while dq and prices[dq[-1]] < price:
            dq.pop()

        dq.append(i)

        if i >= k - 1:                 # first full window reached
            result.append(prices[dq[0]])

    return result`,
    language: "python",
    complexity: { time: "O(N)", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260708-b1-running-median",
    title: "Running Median of Trade Prices",
    difficulty: "hard",
    topics: ["Heap", "Two Heaps", "Data Stream", "Market Microstructure"],
    problem:
      "As trade prints arrive one by one, report the running median after each print. The median is the 50th percentile of all trades so far — a real-time VWAP alternative used in dark pool venues. For input [5, 2, 8, 3, 7] the medians are [5, 3.5, 5, 4, 5].",
    examples: [
      {
        input: "trades = [5, 2, 8, 3, 7]",
        output: "[5.0, 3.5, 5.0, 4.0, 5.0]",
        explanation:
          "After each trade: [5]→5, [2,5]→3.5, [2,5,8]→5, [2,3,5,8]→4, [2,3,5,7,8]→5.",
      },
    ],
    constraints: [
      "1 ≤ len(trades) ≤ 10^5",
      "Trade prices are positive integers.",
      "O(log N) per insertion required.",
    ],
    approach:
      "Maintain two heaps: a max-heap for the lower half (negate values in Python) and a min-heap for the upper half. Keep them balanced so they differ in size by at most 1. The median is either the top of the larger heap or the average of both tops.",
    code: `import heapq

def running_median(trades: list[int]) -> list[float]:
    lower = []   # max-heap (negate to simulate with heapq min-heap)
    upper = []   # min-heap
    result = []

    for price in trades:
        # Push to lower half first
        heapq.heappush(lower, -price)

        # Balance: largest in lower must be <= smallest in upper
        if upper and -lower[0] > upper[0]:
            heapq.heappush(upper, -heapq.heappop(lower))

        # Rebalance sizes: lower may have at most 1 extra element
        if len(lower) < len(upper):
            heapq.heappush(lower, -heapq.heappop(upper))
        elif len(lower) > len(upper) + 1:
            heapq.heappush(upper, -heapq.heappop(lower))

        if len(lower) == len(upper):
            result.append((-lower[0] + upper[0]) / 2.0)
        else:
            result.append(float(-lower[0]))

    return result`,
    language: "python",
    complexity: { time: "O(N log N)", space: "O(N)" },
    leetcodeNumber: 295,
  },
  {
    id: "fin-20260708-b1-buy-sell-cooldown",
    title: "Best Time to Buy/Sell with Mandatory Cooldown",
    difficulty: "medium",
    topics: ["Dynamic Programming", "State Machine", "Trading Constraints"],
    problem:
      "Given daily stock prices, find maximum profit with unlimited transactions but a mandatory 1-day cooldown after every sale (you cannot buy on the day immediately after a sale). This models T+1 settlement rules. For prices=[1,2,3,0,2] the answer is 3.",
    examples: [
      {
        input: "prices = [1, 2, 3, 0, 2]",
        output: "3",
        explanation:
          "Buy day 0 (price 1), sell day 1 (price 2), cooldown day 2, buy day 3 (price 0), sell day 4 (price 2). Profit = 1 + 2 = 3.",
      },
    ],
    constraints: [
      "1 ≤ len(prices) ≤ 5000",
      "0 ≤ prices[i] ≤ 1000",
    ],
    approach:
      "Three states: hold (own a share), sold (just sold, next day is cooldown), rest (available to buy). Transitions: hold→hold (do nothing) or hold→sold (sell); sold→rest; rest→rest (do nothing) or rest→hold (buy). Track max profit at each state.",
    code: `def max_profit_cooldown(prices: list[int]) -> int:
    if not prices:
        return 0

    hold = -prices[0]   # profit if currently holding a share
    sold = 0            # profit on the day we just sold
    rest = 0            # profit when in cooldown or idle

    for price in prices[1:]:
        prev_hold = hold
        prev_sold = sold
        prev_rest = rest

        hold = max(prev_hold, prev_rest - price)   # keep holding or buy from rest
        sold = prev_hold + price                    # sell what we held
        rest = max(prev_rest, prev_sold)            # cooldown transitions to rest

    return max(sold, rest)`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
    leetcodeNumber: 309,
  },
  {
    id: "fin-20260708-b1-rate-limiter",
    title: "Design Sliding Window Rate Limiter",
    difficulty: "medium",
    topics: ["Sliding Window", "Queue", "System Design", "Order Throttling"],
    problem:
      "Design a rate limiter that allows at most K requests in any sliding window of W seconds. Used at HFT gateways to enforce exchange throttle limits (e.g. 100 orders per second). Implement allow(timestamp_ms) returning True if the request is permitted.",
    examples: [
      {
        input:
          "K=3, W=1000ms; calls: allow(100), allow(200), allow(300), allow(400), allow(1101)",
        output: "[True, True, True, False, True]",
        explanation:
          "First 3 within [0,1000ms] are allowed. 4th at 400ms exceeds limit. 5th at 1101ms is in new window [101,1101ms] with only 3 prior requests, but 100ms is outside → 1 slot freed.",
      },
    ],
    constraints: [
      "0 < K ≤ 10^6",
      "0 < W ≤ 60000 (ms)",
      "Timestamps are monotonically non-decreasing.",
      "allow() must be O(1) amortised.",
    ],
    approach:
      "Store request timestamps in a deque. On each call, purge timestamps older than (current_time - W) from the front, then check if deque size < K before appending the new timestamp.",
    code: `from collections import deque

class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_ms: int):
        self.k = max_requests
        self.w = window_ms
        self.timestamps: deque[int] = deque()

    def allow(self, timestamp_ms: int) -> bool:
        cutoff = timestamp_ms - self.w
        # Evict requests outside the sliding window
        while self.timestamps and self.timestamps[0] <= cutoff:
            self.timestamps.popleft()

        if len(self.timestamps) < self.k:
            self.timestamps.append(timestamp_ms)
            return True
        return False`,
    language: "python",
    complexity: { time: "O(1) amortised", space: "O(K)" },
  },
  {
    id: "fin-20260708-b1-matrix-power",
    title: "Compounded Returns via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["Matrix Exponentiation", "Linear Algebra", "Fixed Income"],
    problem:
      "A 3-state Markov chain models economic regimes (bull, bear, stagnation) with transition matrix P. Given the initial distribution v and N months, compute the distribution after N steps. If N is up to 10^9, a naive O(N) multiplication is too slow. Use matrix exponentiation in O(M^3 log N) where M=3.",
    examples: [
      {
        input:
          "P = [[0.7,0.2,0.1],[0.3,0.5,0.2],[0.2,0.3,0.5]], v = [1,0,0], N = 12",
        output: "approximately [0.45, 0.31, 0.24]",
        explanation:
          "After 12 months starting in bull state, the probability distribution over regimes converges toward the stationary distribution.",
      },
    ],
    constraints: [
      "M = 3 (fixed state count)",
      "1 ≤ N ≤ 10^9",
      "Rows of P sum to 1.",
    ],
    approach:
      "Matrix exponentiation: P^N using repeated squaring (binary exponentiation). P^N = P^(N//2) @ P^(N//2) if N even, else P @ P^(N-1). Apply to initial vector v.",
    code: `import numpy as np

def mat_mult(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    return A @ B

def mat_pow(M: np.ndarray, n: int) -> np.ndarray:
    result = np.eye(M.shape[0])   # identity matrix
    base   = M.copy()
    while n > 0:
        if n % 2 == 1:
            result = mat_mult(result, base)
        base = mat_mult(base, base)
        n //= 2
    return result

def regime_distribution(P: list[list[float]], v: list[float], N: int) -> list[float]:
    """Return probability distribution over states after N steps."""
    P_mat = np.array(P, dtype=float)
    v_vec = np.array(v, dtype=float)
    P_n = mat_pow(P_mat, N)
    dist = v_vec @ P_n    # row-vector times matrix
    return dist.tolist()

P = [[0.7, 0.2, 0.1],
     [0.3, 0.5, 0.2],
     [0.2, 0.3, 0.5]]
v = [1.0, 0.0, 0.0]

for N in [1, 12, 120, 10**9]:
    d = regime_distribution(P, v, N)
    print(f"N={N:>12}: {[round(x, 4) for x in d]}")`,
    language: "python",
    complexity: { time: "O(M^3 log N)", space: "O(M^2)" },
  },
  {
    id: "fin-20260708-b1-order-matcher",
    title: "Design a Price-Time Priority Order Matcher",
    difficulty: "hard",
    topics: [
      "Heap",
      "Hash Map",
      "System Design",
      "Order Book",
      "Market Microstructure",
    ],
    problem:
      "Design a simplified exchange order matcher supporting: add_order(order_id, side, price, qty), cancel_order(order_id), and match() which executes crosses. Bids match against asks at the best (highest bid / lowest ask) price-time priority. Return a list of (bid_id, ask_id, price, qty) fills.",
    examples: [
      {
        input:
          "add_order(1,'B',100,10), add_order(2,'S',99,5), add_order(3,'S',100,8), match()",
        output: "[(1, 2, 100, 5), (1, 3, 100, 5)]",
        explanation:
          "Bid 1 at 100 matches ask 2 at 99 (price improves to bid price). Then matches ask 3 at 100 for remaining 5 shares.",
      },
    ],
    constraints: [
      "Order IDs are unique positive integers.",
      "Prices are positive integers (ticks).",
      "Quantities are positive integers.",
      "add_order and cancel_order are O(log N). match is O(F log N) where F = fills.",
    ],
    approach:
      "Use a max-heap for bids (negate price) and min-heap for asks. Store (price, order_id, qty) tuples. For cancellations, use a set of cancelled IDs and skip stale entries lazily when popping. Match greedily while best_bid >= best_ask.",
    code: `import heapq

class OrderMatcher:
    def __init__(self):
        self.bids: list = []           # max-heap: (-price, order_id, qty)
        self.asks: list = []           # min-heap: (price, order_id, qty)
        self.cancelled: set[int] = set()
        self.orders: dict[int, tuple] = {}    # order_id -> (side, price, qty)

    def add_order(self, order_id: int, side: str, price: int, qty: int):
        self.orders[order_id] = (side, price, qty)
        if side == "B":
            heapq.heappush(self.bids, (-price, order_id, qty))
        else:
            heapq.heappush(self.asks, (price, order_id, qty))

    def cancel_order(self, order_id: int):
        self.cancelled.add(order_id)

    def _peek_valid(self, heap: list) -> tuple | None:
        """Return top of heap, skipping cancelled/fully filled orders."""
        while heap:
            if heap[0][1] in self.cancelled:
                heapq.heappop(heap)
            else:
                return heap[0]
        return None

    def match(self) -> list[tuple]:
        fills = []
        while True:
            best_bid = self._peek_valid(self.bids)
            best_ask = self._peek_valid(self.asks)
            if best_bid is None or best_ask is None:
                break

            bid_price = -best_bid[0]
            ask_price =  best_ask[0]
            if bid_price < ask_price:
                break    # no cross

            _, bid_id, bid_qty = heapq.heappop(self.bids)
            _, ask_id, ask_qty = heapq.heappop(self.asks)

            fill_qty = min(bid_qty, ask_qty)
            fill_price = ask_price   # use passive (ask) price
            fills.append((bid_id, ask_id, fill_price, fill_qty))

            if bid_qty > fill_qty:
                heapq.heappush(self.bids, (-bid_price, bid_id, bid_qty - fill_qty))
            if ask_qty > fill_qty:
                heapq.heappush(self.asks, (ask_price, ask_id, ask_qty - fill_qty))

        return fills`,
    language: "python",
    complexity: { time: "O(log N) per order, O(F log N) match", space: "O(N)" },
  },
  {
    id: "fin-20260708-b1-kruskal-currency",
    title: "Minimum Cost Currency Conversion Network",
    difficulty: "medium",
    topics: [
      "Union-Find",
      "Kruskal MST",
      "Graph",
      "FX Markets",
      "Greedy",
    ],
    problem:
      "You are given N currencies and a list of exchange pairs (u, v, cost) representing the transaction cost (in basis points) to convert currency u to currency v. Find the minimum total cost to connect all currencies into a single convertible network (minimum spanning tree). Return the total cost and the edges in the MST.",
    examples: [
      {
        input:
          "N=4, edges=[(0,1,3),(0,2,5),(1,2,2),(1,3,4),(2,3,1)]",
        output: "MST cost = 6, edges = [(2,3,1),(1,2,2),(0,1,3)]",
        explanation:
          "Kruskal picks cheapest edges: (2,3,1)→(1,2,2)→(0,1,3). Total 6 bps. Edge (1,3,4) and (0,2,5) are redundant.",
      },
    ],
    constraints: [
      "2 ≤ N ≤ 10^4",
      "N-1 ≤ len(edges) ≤ 10^5",
      "Costs are positive integers.",
      "Graph is connected.",
    ],
    approach:
      "Kruskal's algorithm: sort edges by cost, then greedily add edges that don't form a cycle using Union-Find (path compression + union by rank). Stop after N-1 edges.",
    code: `class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank   = [0] * n

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path compression (halving)
            x = self.parent[x]
        return x

    def union(self, x: int, y: int) -> bool:
        px, py = self.find(x), self.find(y)
        if px == py:
            return False   # already connected -> cycle
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        return True

def min_cost_currency_network(n: int, edges: list[tuple]) -> tuple:
    edges_sorted = sorted(edges, key=lambda e: e[2])   # sort by cost
    uf = UnionFind(n)
    mst_edges = []
    total_cost = 0

    for u, v, cost in edges_sorted:
        if uf.union(u, v):
            mst_edges.append((u, v, cost))
            total_cost += cost
            if len(mst_edges) == n - 1:
                break   # MST complete

    return total_cost, mst_edges`,
    language: "python",
    complexity: { time: "O(E log E)", space: "O(N)" },
  },
  {
    id: "fin-20260708-b1-interval-scheduling",
    title: "Maximum Non-Overlapping Trade Windows",
    difficulty: "medium",
    topics: ["Greedy", "Interval Scheduling", "Trading Strategy"],
    problem:
      "Given N trading opportunity windows [start_i, end_i] (in minutes from market open), select the maximum number of non-overlapping windows to participate in. Each window represents a market-making opportunity where you must be fully committed for its duration. Classic greedy interval scheduling problem with a quant spin.",
    examples: [
      {
        input: "windows = [(1,3),(2,4),(3,6),(5,7),(6,9)]",
        output: "3",
        explanation:
          "Select (1,3), (3,6), (6,9) — 3 non-overlapping windows. (2,4) and (5,7) overlap with earlier choices.",
      },
    ],
    constraints: [
      "1 ≤ N ≤ 10^5",
      "0 ≤ start_i < end_i ≤ 10^5",
    ],
    approach:
      "Sort windows by end time. Greedily select the next window whose start time is >= the end time of the last selected window. This earliest-finish-first greedy is provably optimal: delaying end times only forecloses more future options.",
    code: `def max_trade_windows(windows: list[tuple[int, int]]) -> int:
    # Sort by end time ascending
    sorted_windows = sorted(windows, key=lambda w: w[1])

    count     = 0
    last_end  = -1    # end time of last selected window

    for start, end in sorted_windows:
        if start >= last_end:    # no overlap with last selected
            count    += 1
            last_end  = end

    return count

def max_windows_with_selection(windows):
    """Also returns the chosen intervals."""
    sorted_windows = sorted(enumerate(windows), key=lambda x: x[1][1])
    selected = []
    last_end = -1

    for original_idx, (start, end) in sorted_windows:
        if start >= last_end:
            selected.append((start, end))
            last_end = end

    return len(selected), selected`,
    language: "python",
    complexity: { time: "O(N log N)", space: "O(1)" },
  },
  {
    id: "fin-20260708-b1-markov-chain",
    title: "Expected Return in a Markov Chain Market",
    difficulty: "medium",
    topics: [
      "Dynamic Programming",
      "Probability",
      "Markov Chain",
      "Risk Models",
    ],
    problem:
      "A market alternates between 3 regimes: bull (B), bear (R), flat (F) with transition probabilities. At each step you collect a reward: +2 in bull, -1 in bear, 0 in flat. Given an initial regime and horizon H steps, compute the expected total reward. Also compute the long-run steady-state expected reward per step.",
    examples: [
      {
        input:
          "P=[[0.6,0.3,0.1],[0.2,0.5,0.3],[0.3,0.3,0.4]], rewards=[2,-1,0], start=0, H=10",
        output: "Expected total reward ≈ 5.8",
        explanation:
          "Starting in bull regime, sum expected rewards over 10 steps using forward DP on the state distribution.",
      },
    ],
    constraints: [
      "States: 0=bull, 1=bear, 2=flat",
      "H ≤ 10^6 (use O(M) DP, not matrix exponentiation)",
      "Transition matrix rows sum to 1.",
    ],
    approach:
      "Forward DP: maintain a probability distribution over states at each step. Multiply by transition matrix at each step to get next distribution. Accumulate expected reward as dot(distribution, rewards). Stationary distribution solves pi @ P = pi (eigenvector of P^T for eigenvalue 1).",
    code: `import numpy as np

def expected_markov_reward(P: list[list[float]], rewards: list[float],
                            start: int, H: int) -> float:
    """Forward DP: O(M^2 * H) time but O(M) space."""
    P_mat = np.array(P)
    r_vec = np.array(rewards)
    # Initial distribution: all probability in start state
    dist = np.zeros(len(rewards))
    dist[start] = 1.0

    total_expected = 0.0
    for _ in range(H):
        total_expected += dist @ r_vec    # expected reward this step
        dist = dist @ P_mat              # transition to next step

    return total_expected

def stationary_distribution(P: list[list[float]]) -> np.ndarray:
    """Solve pi P = pi, sum(pi)=1 via eigendecomposition."""
    P_mat = np.array(P).T                           # eigenvectors of P^T
    eigenvalues, eigenvectors = np.linalg.eig(P_mat)
    idx = np.argmin(np.abs(eigenvalues - 1.0))      # eigenvalue closest to 1
    pi = np.real(eigenvectors[:, idx])
    return pi / pi.sum()

P = [[0.6, 0.3, 0.1],
     [0.2, 0.5, 0.3],
     [0.3, 0.3, 0.4]]
rewards = [2.0, -1.0, 0.0]

exp_total = expected_markov_reward(P, rewards, start=0, H=10)
pi = stationary_distribution(P)
steady_reward = pi @ np.array(rewards)

print(f"Expected total reward (H=10, start=bull): {exp_total:.4f}")
print(f"Stationary distribution: {np.round(pi, 4)}")
print(f"Long-run expected reward per step: {steady_reward:.4f}")`,
    language: "python",
    complexity: { time: "O(M^2 H)", space: "O(M)" },
  },
  {
    id: "fin-20260708-b1-reservoir-sample",
    title: "Reservoir Sampling for Fair Order Allocation",
    difficulty: "medium",
    topics: [
      "Reservoir Sampling",
      "Randomised Algorithms",
      "Order Allocation",
      "Probability",
    ],
    problem:
      "At a dark pool venue, N orders arrive in a stream (N unknown in advance). You must select exactly K orders to fill — each order must have equal probability K/N of being selected. Implement reservoir sampling to achieve this in O(N) time and O(K) space. Return the K selected order IDs.",
    examples: [
      {
        input: "stream = [101,102,103,104,105,106,107], K = 3",
        output: "3 randomly chosen IDs, each with probability 3/7",
        explanation:
          "Algorithm R: fill reservoir with first K items, then for each subsequent item i, swap it in with probability K/i.",
      },
    ],
    constraints: [
      "K ≤ N",
      "Stream can be arbitrarily large.",
      "Must use O(K) memory.",
      "Each element must have exactly K/N probability of selection.",
    ],
    approach:
      "Vitter's Algorithm R: place first K elements in the reservoir. For each subsequent element at position i (1-indexed), generate a random integer j in [1, i]. If j <= K, replace reservoir[j-1] with the new element. This maintains uniform probability for all elements seen so far.",
    code: `import random

def reservoir_sample(stream: list, K: int, seed: int = 42) -> list:
    """
    Vitter's Algorithm R: O(N) time, O(K) space.
    Each element has exactly K/N probability of being in the final reservoir.
    """
    rng = random.Random(seed)
    reservoir = stream[:K]    # fill first K slots

    for i in range(K, len(stream)):
        j = rng.randint(0, i)          # uniform in [0, i] inclusive
        if j < K:
            reservoir[j] = stream[i]   # replace with probability K/(i+1)

    return reservoir

def verify_fairness(stream, K, trials=100_000):
    """Empirically verify uniform selection probability."""
    from collections import Counter
    counts = Counter()
    for seed in range(trials):
        selected = reservoir_sample(stream, K, seed=seed)
        counts.update(selected)
    N = len(stream)
    expected = trials * K / N
    print(f"Expected selections per item: {expected:.0f}")
    for item in sorted(stream):
        print(f"  {item}: {counts[item]}  (ratio {counts[item]/expected:.3f})")

stream = [101, 102, 103, 104, 105, 106, 107]
K = 3
sample = reservoir_sample(stream, K)
print(f"Sampled K={K} from {stream}: {sample}")
verify_fairness(stream, K, trials=70_000)`,
    language: "python",
    complexity: { time: "O(N)", space: "O(K)" },
  },
];
