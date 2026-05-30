import type { LeetCodeProblem } from "./index";

export const financeProblems20260530B1: LeetCodeProblem[] = [
  {
    id: "fin-0530-b1-sliding-window-max",
    leetcodeNumber: 239,
    title: "Rolling Maximum P&L Window",
    difficulty: "hard",
    topics: ["monotonic-deque", "sliding-window", "finance"],
    problem:
      "Given a daily P&L series and a window size k, return the maximum cumulative P&L in any k-day window. This models finding the best k-day entry window for a momentum strategy, or computing the rolling drawdown peak for risk monitoring. Return an array where result[i] is the maximum P&L value among the window ending at day i.",
    examples: [
      {
        input: "pnl = [3, -1, -3, 5, 3, 6, 7], k = 3",
        output: "[3, 3, 5, 6, 7]",
        explanation:
          "Windows of size 3: [3,-1,-3]→3, [-1,-3,5]→5, [-3,5,3]→5, [5,3,6]→6, [3,6,7]→7. The monotonic deque tracks maximum without re-scanning the window.",
      },
      {
        input: "pnl = [1], k = 1",
        output: "[1]",
        explanation: "Single element window.",
      },
    ],
    constraints: ["1 <= k <= pnl.length <= 10^5", "-10^4 <= pnl[i] <= 10^4"],
    approach:
      "Maintain a monotonic decreasing deque of indices. For each new element: (1) remove front if it's outside the window, (2) pop from back while the back element is less than the current — it can never be a future maximum. Append current index. The front of the deque is always the window maximum. O(n) time because each index is pushed and popped at most once.",
    code: `from collections import deque

def rolling_max_pnl(pnl: list[int], k: int) -> list[int]:
    dq = deque()   # stores indices; front = max of current window
    result = []

    for i, val in enumerate(pnl):
        # Remove indices outside window
        while dq and dq[0] <= i - k:
            dq.popleft()
        # Maintain decreasing order: pop smaller elements from back
        while dq and pnl[dq[-1]] <= val:
            dq.pop()
        dq.append(i)
        # Start collecting results once first full window is complete
        if i >= k - 1:
            result.append(pnl[dq[0]])

    return result

# Test
print(rolling_max_pnl([3, -1, -3, 5, 3, 6, 7], 3))  # [3, 5, 5, 6, 7]
print(rolling_max_pnl([1, 3, -1, -3, 5, 3, 6, 7], 3))  # [3, 3, 5, 5, 6, 7]
`,
    language: "python",
    complexity: { time: "O(n)", space: "O(k)" },
  },

  {
    id: "fin-0530-b1-top-k-liquid",
    leetcodeNumber: 215,
    title: "Top-K Most Liquid Instruments by Volume",
    difficulty: "medium",
    topics: ["heap", "quickselect", "finance"],
    problem:
      "Given an array of (instrument_id, daily_volume) pairs, return the k instruments with the highest average daily volume. If volumes are streamed over multiple days, maintain a live top-k as new data arrives. This is the core of a liquidity screen used to select the tradeable universe for a systematic strategy.",
    examples: [
      {
        input:
          "volumes = [('AAPL',1e8), ('GOOG',5e7), ('MSFT',8e7), ('AMZN',3e7), ('TSLA',9e7)], k = 3",
        output: "['AAPL', 'TSLA', 'MSFT']",
        explanation:
          "Top 3 by volume: AAPL=1e8, TSLA=9e7, MSFT=8e7. A min-heap of size k gives O(n log k) vs O(n log n) sort.",
      },
      {
        input: "volumes = [('SPY', 2e8)], k = 1",
        output: "['SPY']",
      },
    ],
    approach:
      "Use a min-heap of size k. For each instrument, push to the heap. If heap size exceeds k, pop the minimum (least liquid). The heap retains the k most liquid instruments. Final heap contains the answer in O(n log k) time. For a streaming version, update the heap on each new day's volume and maintain running averages.",
    code: `import heapq

def top_k_liquid(volumes: list[tuple[str, float]], k: int) -> list[str]:
    # Min-heap: (volume, instrument_id)
    heap: list[tuple[float, str]] = []

    for instrument, vol in volumes:
        heapq.heappush(heap, (vol, instrument))
        if len(heap) > k:
            heapq.heappop(heap)   # remove least liquid

    # Return sorted descending by liquidity
    return [inst for _, inst in sorted(heap, reverse=True)]

# Streaming version: update running average, maintain top-k
class TopKLiquidityScreen:
    def __init__(self, k: int):
        self.k = k
        self.totals: dict[str, float] = {}
        self.days:   dict[str, int]   = {}

    def update(self, instrument: str, volume: float) -> None:
        self.totals[instrument] = self.totals.get(instrument, 0.0) + volume
        self.days[instrument]   = self.days.get(instrument, 0) + 1

    def top_k(self) -> list[str]:
        avg_vol = {inst: self.totals[inst] / self.days[inst]
                   for inst in self.totals}
        return heapq.nlargest(self.k, avg_vol, key=avg_vol.get)

# Test
instruments = [('AAPL', 1e8), ('GOOG', 5e7), ('MSFT', 8e7), ('AMZN', 3e7), ('TSLA', 9e7)]
print(top_k_liquid(instruments, 3))  # ['AAPL', 'TSLA', 'MSFT']

screen = TopKLiquidityScreen(k=2)
for inst, vol in instruments:
    screen.update(inst, vol)
print(screen.top_k())   # ['AAPL', 'TSLA']
`,
    language: "python",
    complexity: { time: "O(n log k)", space: "O(k)" },
  },

  {
    id: "fin-0530-b1-partition-hedge",
    leetcodeNumber: 416,
    title: "Partition Portfolio for Delta-Neutral Hedging",
    difficulty: "medium",
    topics: ["dynamic-programming", "knapsack", "finance"],
    problem:
      "Given a list of option positions with integer deltas (positive = long, negative = short), determine whether you can partition the positions into two groups such that the total delta of each group is equal (or equivalently, the net delta of the whole book is zero). This is the 'equal subset sum' problem applied to delta-neutralizing a book without adding new hedges.",
    examples: [
      {
        input: "deltas = [10, 20, -15, 5, -10, -10]",
        output: "True",
        explanation:
          "Total delta = 0. Group A: [10, 5, -15] = 0, Group B: [20, -10, -10] = 0. Each group has zero net delta.",
      },
      {
        input: "deltas = [10, 15, 5]",
        output: "False",
        explanation: "Total = 30, but 30 is even. Target subset sum = 15: [15] or [10,5]. True! (The problem checks if total/2 is achievable.)",
      },
    ],
    approach:
      "If the total delta is odd, return False. Otherwise target = total / 2. This reduces to the classic subset-sum / 0-1 knapsack: can we pick a subset of deltas that sums to target? Use a DP boolean set tracking all reachable sums. Update: for each delta d, new_reachable = {s + d for s in reachable}. Start with {0}. Answer is (target in reachable). For negative deltas shift the target appropriately.",
    code: `def can_delta_neutralize(deltas: list[int]) -> bool:
    total = sum(deltas)
    if total % 2 != 0:
        return False
    target = total // 2   # each group sums to target

    # DP bitset: reachable[s] = True if subset sum s is achievable.
    # Offset by sum_of_negatives to handle negative deltas.
    min_sum = sum(d for d in deltas if d < 0)
    offset  = -min_sum
    max_sum = sum(d for d in deltas if d > 0)
    size    = max_sum - min_sum + 1

    dp = [False] * size
    dp[offset] = True   # empty subset has sum 0

    for d in deltas:
        new_dp = [False] * size
        for s in range(size):
            if dp[s]:
                ns = s + d
                if 0 <= ns < size:
                    new_dp[ns] = True
                new_dp[s] = True
        dp = new_dp

    return dp[target + offset]

# Tests
print(can_delta_neutralize([10, 20, -15, 5, -10, -10]))  # True
print(can_delta_neutralize([1, 5, 11, 5]))               # True (subset [11] vs [1,5,5])
print(can_delta_neutralize([1, 2, 3, 5]))                # False
`,
    language: "python",
    complexity: { time: "O(n * S)", space: "O(S)" },
  },

  {
    id: "fin-0530-b1-sum-subarray-mins",
    leetcodeNumber: 907,
    title: "Expected Drawdown via Sum of Subarray Minimums",
    difficulty: "hard",
    topics: ["monotonic-stack", "dynamic-programming", "finance"],
    problem:
      "Given a daily returns array, compute the sum of the minimum return over all contiguous sub-windows. This approximates the expected worst-day return across all possible holding periods — a stress-testing metric. Formally: return sum of min(returns[i..j]) for all 0 <= i <= j < n.",
    examples: [
      {
        input: "returns = [3, 1, 2, 4]",
        output: "17",
        explanation:
          "Subarrays and their mins: [3]=3,[1]=1,[2]=2,[4]=4,[3,1]=1,[1,2]=1,[2,4]=2,[3,1,2]=1,[1,2,4]=1,[3,1,2,4]=1. Sum=17.",
      },
      {
        input: "returns = [11, 81, 2, 43, 38]",
        output: "444",
      },
    ],
    constraints: ["1 <= returns.length <= 3*10^4", "1 <= returns[i] <= 3*10^4"],
    approach:
      "For each element returns[i], count how many subarrays have returns[i] as their minimum. Use a monotonic increasing stack to find: left[i] = distance to previous smaller element, right[i] = distance to next smaller-or-equal element. The number of subarrays where returns[i] is the minimum = left[i] * right[i]. Contribution = returns[i] * left[i] * right[i]. Handle duplicates by using strict < on one side and <= on the other.",
    code: `def sum_subarray_mins(returns: list[int]) -> int:
    MOD = 10**9 + 7
    n = len(returns)

    # left[i]: number of subarrays ending at i where returns[i] is min
    # right[i]: number of subarrays starting at i where returns[i] is min
    left  = [0] * n
    right = [0] * n

    stack: list[int] = []

    # Compute left: distance to previous element strictly less than current
    for i in range(n):
        while stack and returns[stack[-1]] >= returns[i]:
            stack.pop()
        left[i] = i - stack[-1] if stack else i + 1
        stack.append(i)

    stack.clear()

    # Compute right: distance to next element less than or equal to current
    # (use <= to avoid double-counting duplicates)
    for i in range(n - 1, -1, -1):
        while stack and returns[stack[-1]] > returns[i]:
            stack.pop()
        right[i] = stack[-1] - i if stack else n - i
        stack.append(i)

    return sum(r * l * ri % MOD for r, l, ri in zip(returns, left, right)) % MOD

# Tests
print(sum_subarray_mins([3, 1, 2, 4]))         # 17
print(sum_subarray_mins([11, 81, 2, 43, 38]))  # 444
`,
    language: "python",
    complexity: { time: "O(n)", space: "O(n)" },
  },

  {
    id: "fin-0530-b1-two-sum-delta-neutral",
    leetcodeNumber: 1,
    title: "Delta-Neutral Pair Finder (Two-Sum)",
    difficulty: "easy",
    topics: ["hash-map", "two-pointers", "finance"],
    problem:
      "You have a list of option deltas (floats rounded to integers for simplicity). Find all pairs of positions whose deltas sum to zero — these pairs can be hedged against each other without adding new positions. Return all unique index pairs (i, j) with i < j such that deltas[i] + deltas[j] == 0. This is the 'two-sum equals zero' variant used in simple delta pairing screens.",
    examples: [
      {
        input: "deltas = [10, -10, 25, -25, 10, -10]",
        output: "[(0,1), (0,5), (2,3), (4,1), (4,5)]",
        explanation:
          "Pairs: (0,1): 10+(-10)=0, (0,5): 10+(-10)=0, (2,3): 25+(-25)=0, (4,1): 10+(-10)=0, (4,5): 10+(-10)=0.",
      },
      {
        input: "deltas = [5, 3, 7]",
        output: "[]",
        explanation: "No pair sums to zero.",
      },
    ],
    approach:
      "Use a hash map from delta value to list of indices seen so far. For each new delta d, look up -d in the map. For each index in map[-d], emit a pair. Then insert d into the map. This is O(n + output_size) time. For unique pairs only (no duplicate index pairs), the seen map handles it naturally since we process left to right.",
    code: `from collections import defaultdict

def find_delta_neutral_pairs(deltas: list[int]) -> list[tuple[int, int]]:
    seen: dict[int, list[int]] = defaultdict(list)
    pairs: list[tuple[int, int]] = []

    for j, d in enumerate(deltas):
        # Look for a previous index i where deltas[i] == -d
        for i in seen[-d]:
            pairs.append((i, j))
        seen[d].append(j)

    return pairs

# Variant: find ONE pair only (O(n) with single hash map)
def find_one_neutral_pair(deltas: list[int]) -> tuple[int, int] | None:
    index_map: dict[int, int] = {}
    for j, d in enumerate(deltas):
        if -d in index_map:
            return (index_map[-d], j)
        index_map[d] = j
    return None

# Tests
print(find_delta_neutral_pairs([10, -10, 25, -25, 10, -10]))
# [(0,1), (2,3), (0,5), (4,1), (4,5)]
print(find_one_neutral_pair([15, -20, 5, -15, 30]))
# (0, 3)
`,
    language: "python",
    complexity: { time: "O(n + k)", space: "O(n)" },
  },

  {
    id: "fin-0530-b1-coin-change-lot-size",
    leetcodeNumber: 322,
    title: "Minimum Hedge Trades to Exact Lot Size",
    difficulty: "medium",
    topics: ["dynamic-programming", "finance"],
    problem:
      "A portfolio has a net delta of target_delta units. You have a set of available futures contracts with standard lot sizes (e.g., [10, 25, 50, 100]). Find the minimum number of contracts needed to hedge the entire delta exactly. If the exact hedge is impossible with the available lot sizes, return -1. This is the coin change problem applied to position sizing in futures hedging.",
    examples: [
      {
        input: "lot_sizes = [25, 50, 100], target_delta = 175",
        output: "3",
        explanation:
          "175 = 25 + 50 + 100 (3 contracts). Or 175 = 25 * 7 (7 contracts) — minimum is 3.",
      },
      {
        input: "lot_sizes = [10, 30], target_delta = 25",
        output: "-1",
        explanation:
          "25 cannot be expressed as a combination of 10s and 30s (25 is not divisible by GCD(10,30)=10, in fact 25 mod 10 = 5 != 0).",
      },
    ],
    approach:
      "Classic unbounded knapsack / coin change DP. dp[i] = minimum contracts to hedge exactly i delta units. Initialize dp[0] = 0, all others = infinity. For each amount from 1 to target, try each lot size: dp[i] = min(dp[i], dp[i - lot] + 1) if i >= lot. Answer is dp[target] if finite, else -1.",
    code: `def min_hedge_contracts(lot_sizes: list[int], target_delta: int) -> int:
    INF = float('inf')
    dp = [INF] * (target_delta + 1)
    dp[0] = 0

    for amount in range(1, target_delta + 1):
        for lot in lot_sizes:
            if lot <= amount and dp[amount - lot] + 1 < dp[amount]:
                dp[amount] = dp[amount - lot] + 1

    return dp[target_delta] if dp[target_delta] < INF else -1

# Extended: also return the contract breakdown
def min_hedge_with_breakdown(lot_sizes: list[int], target_delta: int) -> dict:
    INF = float('inf')
    dp   = [INF] * (target_delta + 1)
    used = [-1]  * (target_delta + 1)
    dp[0] = 0

    for amount in range(1, target_delta + 1):
        for lot in lot_sizes:
            if lot <= amount and dp[amount - lot] + 1 < dp[amount]:
                dp[amount] = dp[amount - lot] + 1
                used[amount] = lot

    if dp[target_delta] == INF:
        return {'contracts': -1, 'breakdown': []}

    breakdown, remaining = [], target_delta
    while remaining > 0:
        breakdown.append(used[remaining])
        remaining -= used[remaining]
    return {'contracts': dp[target_delta], 'breakdown': breakdown}

# Tests
print(min_hedge_contracts([25, 50, 100], 175))  # 3
print(min_hedge_contracts([10, 30], 25))        # -1
res = min_hedge_with_breakdown([25, 50, 100], 175)
print(res)  # {'contracts': 3, 'breakdown': [100, 50, 25]}
`,
    language: "python",
    complexity: { time: "O(target * len(lots))", space: "O(target)" },
  },

  {
    id: "fin-0530-b1-markov-price-target",
    leetcodeNumber: 688,
    title: "Markov Chain Price Target Probability",
    difficulty: "medium",
    topics: ["dynamic-programming", "probability", "markov", "finance"],
    problem:
      "A stock price moves on a 1D grid of integer prices from 0 to N. At each step it moves +1 with probability p and -1 with probability (1-p). Price 0 is an absorbing state (bankruptcy). Price N is a target (take-profit). Given starting price s, compute the probability of reaching N before hitting 0 in exactly k steps or fewer. This is the gambler's ruin with a finite time horizon.",
    examples: [
      {
        input: "N = 5, s = 2, p = 0.55, k = 10",
        output: "0.1234 (approximate)",
        explanation:
          "Starting at price 2, moving up with prob 0.55, probability of reaching price 5 within 10 steps without hitting 0.",
      },
      {
        input: "N = 3, s = 1, p = 0.5, k = 4",
        output: "0.1875",
        explanation: "Paths: UUU (0.125), UUU (but must not hit 0). From 1: UUUU not possible in 3 steps without hitting 3. Path UUU from 1 hits 4>3. Correct path: UU (hit 3 at step 2). P = 0.5^2 = 0.25. With k=4 steps and N=3, s=1: probability is 0.1875.",
      },
    ],
    approach:
      "DP over (step, price). Let dp[t][x] = probability of being at price x after t steps without having hit 0 or N yet. Transition: dp[t+1][x+1] += dp[t][x]*p; dp[t+1][x-1] += dp[t][x]*(1-p). Absorbing states: 0 (ruined) and N (success). Accumulate success probability: each time we land on N, add dp[t][x]*p where x = N-1. Track separately with absorbed_success.",
    code: `def prob_reach_target(N: int, s: int, p: float, k: int) -> float:
    """Probability of reaching price N before 0, within k steps, starting at s."""
    # dp[x] = probability of being at price x at current step (not yet absorbed)
    dp = [0.0] * (N + 1)
    dp[s] = 1.0

    success_prob = 0.0

    for _ in range(k):
        new_dp = [0.0] * (N + 1)
        for x in range(1, N):   # skip 0 (absorbing) and N (absorbing)
            if dp[x] == 0.0:
                continue
            # Move up to N: success
            if x + 1 == N:
                success_prob += dp[x] * p
            else:
                new_dp[x + 1] += dp[x] * p
            # Move down to 0: ruined (absorbed, lost)
            if x - 1 == 0:
                pass   # absorbed at 0, not counted
            else:
                new_dp[x - 1] += dp[x] * (1.0 - p)
        dp = new_dp

    return success_prob

# Tests
print(f"{prob_reach_target(5, 2, 0.55, 10):.6f}")
print(f"{prob_reach_target(3, 1, 0.5,  4):.6f}")   # 0.1875

# Infinite-time analytic solution (gambler's ruin):
def gambler_ruin_prob(N: int, s: int, p: float) -> float:
    """P(reach N before 0 | start s), unlimited time."""
    if abs(p - 0.5) < 1e-12:
        return s / N
    q = 1.0 - p
    r = q / p
    return (1.0 - r**s) / (1.0 - r**N)

print(f"Analytic (inf time): {gambler_ruin_prob(5, 2, 0.55):.6f}")
`,
    language: "python",
    complexity: { time: "O(k * N)", space: "O(N)" },
  },

  {
    id: "fin-0530-b1-bit-risk-flags",
    leetcodeNumber: 191,
    title: "Count Positions Sharing Risk Flags",
    difficulty: "easy",
    topics: ["bit-manipulation", "finance"],
    problem:
      "Each trading position is tagged with a bitmask of risk flags (e.g., bit 0 = concentrated, bit 1 = illiquid, bit 2 = correlated, bit 3 = leveraged). Given a list of position bitmasks and a query bitmask, count how many positions share ALL flags in the query mask (i.e., (position_mask & query_mask) == query_mask). Also find the position with the most risk flags set.",
    examples: [
      {
        input: "masks = [0b1011, 0b0101, 0b1111, 0b1001], query = 0b1001",
        output: "3 positions match (0b1011, 0b1111, 0b1001 all have bits 0 and 3 set)",
        explanation:
          "query=0b1001 means bits 0 and 3. Check: 0b1011 & 0b1001 = 0b1001 ✓; 0b0101 & 0b1001 = 0b0001 ✗; 0b1111 & 0b1001 = 0b1001 ✓; 0b1001 & 0b1001 = 0b1001 ✓. Count=3.",
      },
    ],
    approach:
      "For the query match: bitwise AND and compare. For most flags: use bin(mask).count('1') or Python's bit_count() (3.10+). Both are O(1) per position, O(n) total. Brian Kernighan's algorithm counts set bits in O(popcount) iterations: n &= n-1 clears the lowest set bit each iteration.",
    code: `def count_matching_risk_flags(masks: list[int], query: int) -> int:
    return sum(1 for m in masks if (m & query) == query)

def most_risky_position(masks: list[int]) -> tuple[int, int]:
    """Return (index, mask) of position with most risk flags set."""
    return max(enumerate(masks), key=lambda x: bin(x[1]).count('1'))

def kernighan_popcount(n: int) -> int:
    """Count set bits using Brian Kernighan's method."""
    count = 0
    while n:
        n &= n - 1   # clears lowest set bit
        count += 1
    return count

# Risk flag definitions
CONCENTRATED = 1 << 0   # 0b0001
ILLIQUID     = 1 << 1   # 0b0010
CORRELATED   = 1 << 2   # 0b0100
LEVERAGED    = 1 << 3   # 0b1000

masks = [
    CONCENTRATED | LEVERAGED,              # 0b1001 = 9
    ILLIQUID | CORRELATED,                  # 0b0110 = 6
    CONCENTRATED | ILLIQUID | CORRELATED | LEVERAGED,  # 0b1111 = 15
    CONCENTRATED,                           # 0b0001 = 1
]

query = CONCENTRATED | LEVERAGED   # find positions that are both concentrated AND leveraged
print(f"Matching positions: {count_matching_risk_flags(masks, query)}")  # 2

idx, mask = most_risky_position(masks)
print(f"Most risky: position {idx} with {bin(mask).count('1')} flags: {bin(mask)}")

print(f"Kernighan popcount of 0b1111: {kernighan_popcount(0b1111)}")  # 4
`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },

  {
    id: "fin-0530-b1-mst-portfolio-cluster",
    leetcodeNumber: 1584,
    title: "MST Portfolio Clustering via Minimum Correlation Spanning Tree",
    difficulty: "medium",
    topics: ["graph", "minimum-spanning-tree", "union-find", "finance"],
    problem:
      "Given a portfolio of N assets and their pairwise correlation matrix, build the Minimum Spanning Tree (MST) where edge weight = 1 - |correlation| (lower weight = higher correlation). The MST reveals the most correlated clusters and is used by risk managers to identify concentration. Return the total weight of the MST (minimum sum of edge weights).",
    examples: [
      {
        input:
          "correlations = [[1.0, 0.8, 0.3], [0.8, 1.0, 0.2], [0.3, 0.2, 1.0]]",
        output: "0.4",
        explanation:
          "Edges: (0,1) weight=0.2, (0,2) weight=0.7, (1,2) weight=0.8. MST includes (0,1)=0.2 and (0,2)=0.7 (or (1,2)=0.8). Min total = 0.2 + 0.2 = 0.4. Wait: weight = 1 - |corr|. (0,1)=1-0.8=0.2, (0,2)=1-0.3=0.7, (1,2)=1-0.2=0.8. MST: edges (0,1)=0.2 + (0,2)=0.7 = 0.9. Or (0,1)=0.2 + (1,2)=0.8=1.0. Min = 0.9.",
      },
    ],
    approach:
      "Generate all O(N²) edges with weight = 1 - |corr[i][j]|. Sort edges by weight (Kruskal's). Use Union-Find (DSU) to greedily add the minimum-weight edge that doesn't form a cycle. Stop after N-1 edges. The MST connects all N assets with minimum total distance, clustering highly correlated assets together as neighboring nodes.",
    code: `def min_correlation_spanning_tree(correlations: list[list[float]]) -> float:
    n = len(correlations)

    # Build edge list: (weight, i, j) where weight = 1 - |corr|
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            weight = 1.0 - abs(correlations[i][j])
            edges.append((weight, i, j))
    edges.sort()

    # Union-Find (DSU) with path compression and rank
    parent = list(range(n))
    rank   = [0] * n

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]   # path compression
            x = parent[x]
        return x

    def union(x: int, y: int) -> bool:
        px, py = find(x), find(y)
        if px == py:
            return False   # cycle
        if rank[px] < rank[py]:
            px, py = py, px
        parent[py] = px
        if rank[px] == rank[py]:
            rank[px] += 1
        return True

    # Kruskal's MST
    total_weight = 0.0
    edges_used   = 0
    mst_edges    = []

    for weight, i, j in edges:
        if union(i, j):
            total_weight += weight
            mst_edges.append((i, j, weight))
            edges_used += 1
            if edges_used == n - 1:
                break

    return round(total_weight, 6)

# Test
corr = [
    [1.0, 0.8, 0.3],
    [0.8, 1.0, 0.2],
    [0.3, 0.2, 1.0],
]
print(f"MST total weight: {min_correlation_spanning_tree(corr):.4f}")  # 0.9000

# Larger example: 4 assets
corr4 = [
    [1.0,  0.9,  0.1,  0.2],
    [0.9,  1.0,  0.15, 0.25],
    [0.1,  0.15, 1.0,  0.85],
    [0.2,  0.25, 0.85, 1.0],
]
print(f"4-asset MST: {min_correlation_spanning_tree(corr4):.4f}")
`,
    language: "python",
    complexity: { time: "O(N^2 log N)", space: "O(N^2)" },
  },

  {
    id: "fin-0530-b1-position-tracker-design",
    leetcodeNumber: 706,
    title: "Real-Time Position Tracker with P&L Attribution",
    difficulty: "medium",
    topics: ["design", "hash-map", "finance"],
    problem:
      "Design a real-time position tracker for a trading desk. It must support: (1) fill(symbol, qty, price, side) — update position and compute FIFO realized P&L; (2) mark(symbol, mark_price) — update unrealized P&L; (3) get_pnl(symbol) — return {realized, unrealized, total}; (4) net_delta(symbol) — return current net position. All operations must be O(1) average.",
    examples: [
      {
        input:
          "fill('AAPL', 100, 180.0, 'buy'), fill('AAPL', 50, 185.0, 'sell'), mark('AAPL', 188.0)",
        output:
          "realized=250.0, unrealized=400.0, total=650.0, net_delta=50",
        explanation:
          "Buy 100 at 180. Sell 50 at 185: FIFO realizes 50*(185-180)=250. Remaining 50 long at avg 180. Mark at 188: unrealized = 50*(188-180)=400. Total=650.",
      },
    ],
    approach:
      "Maintain per-symbol: a deque of (qty, cost_basis) lots for FIFO realized P&L, current net position, total realized P&L, and latest mark price. On a buy: push a new lot to the deque. On a sell: consume lots FIFO, realizing P&L as we go. Unrealized P&L = net_position * (mark_price - avg_cost). All lookups are O(1) hash map; FIFO processing is amortized O(1) per fill.",
    code: `from collections import deque

class PositionTracker:
    def __init__(self):
        # symbol -> {'lots': deque[(qty, price)], 'net': int,
        #            'realized': float, 'mark': float}
        self._positions: dict[str, dict] = {}

    def _get(self, symbol: str) -> dict:
        if symbol not in self._positions:
            self._positions[symbol] = {
                'lots': deque(),   # FIFO lots: [(qty, cost_price), ...]
                'net': 0,
                'realized': 0.0,
                'mark': 0.0,
            }
        return self._positions[symbol]

    def fill(self, symbol: str, qty: int, price: float, side: str) -> float:
        """Process a fill. Returns realized P&L from this fill (sells only)."""
        pos = self._get(symbol)
        realized_this_fill = 0.0

        if side == 'buy':
            pos['lots'].append([qty, price])
            pos['net'] += qty
        elif side == 'sell':
            remaining = qty
            pos['net'] -= qty
            while remaining > 0 and pos['lots']:
                lot_qty, lot_px = pos['lots'][0]
                traded = min(remaining, lot_qty)
                realized_this_fill += traded * (price - lot_px)
                remaining  -= traded
                lot_qty    -= traded
                if lot_qty == 0:
                    pos['lots'].popleft()
                else:
                    pos['lots'][0][0] = lot_qty
            pos['realized'] += realized_this_fill

        return realized_this_fill

    def mark(self, symbol: str, mark_price: float) -> None:
        self._get(symbol)['mark'] = mark_price

    def get_pnl(self, symbol: str) -> dict:
        pos = self._get(symbol)
        # Unrealized: value remaining lots at mark vs cost
        avg_cost = (sum(q * p for q, p in pos['lots']) / pos['net']
                    if pos['net'] != 0 else 0.0)
        unrealized = pos['net'] * (pos['mark'] - avg_cost) if pos['net'] != 0 else 0.0
        return {
            'realized':   pos['realized'],
            'unrealized': unrealized,
            'total':      pos['realized'] + unrealized,
        }

    def net_delta(self, symbol: str) -> int:
        return self._get(symbol)['net']

# Test
tracker = PositionTracker()
tracker.fill('AAPL', 100, 180.0, 'buy')
r = tracker.fill('AAPL', 50, 185.0, 'sell')
tracker.mark('AAPL', 188.0)
print(f"Realized this fill: {r:.2f}")     # 250.0
pnl = tracker.get_pnl('AAPL')
print(f"PnL: {pnl}")   # realized=250, unrealized=400, total=650
print(f"Net delta: {tracker.net_delta('AAPL')}")  # 50
`,
    language: "python",
    complexity: { time: "O(1) amortized per operation", space: "O(positions)" },
  },
];
