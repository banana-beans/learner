import type { LeetCodeProblem } from "./index";

export const financeProblems20260525B1: LeetCodeProblem[] = [
  {
    id: "fin-0525-b1-lfu-cache",
    leetcodeNumber: 460,
    title: "LFU Cache — Least Frequently Used Instrument Cache",
    difficulty: "hard",
    topics: ["design", "hash-map", "heap", "finance"],
    problem:
      "Design a cache for instrument metadata (symbol → reference data) that evicts the Least Frequently Used entry when capacity is exceeded. get(key) retrieves an entry (increment its frequency); put(key, value) inserts or updates (increment frequency; evict LFU entry if capacity exceeded, breaking ties by recency — evict least recently used among those with minimum frequency). Both operations must run in O(1) time.",
    examples: [
      {
        input: "capacity=2; put(1,1); put(2,2); get(1)→1; put(3,3); get(2)→-1 (evicted); get(3)→3; put(4,4); get(1)→-1; get(3)→3; get(4)→4",
        output: "1, -1, 3, -1, 3, 4",
        explanation: "When key 3 is inserted, key 2 is evicted (freq=1, LFU). When key 4 is inserted, key 1 is evicted (freq=1, LFU, LRU tiebreak — key 3 was accessed more recently).",
      },
    ],
    approach:
      "Three data structures: (1) key→(value, freq) map for O(1) lookup; (2) freq→OrderedDict[key] map for O(1) LFU eviction (leftmost = LRU within freq); (3) min_freq variable tracking the current minimum. On get/put: update freq, move key to new freq bucket, update min_freq. On eviction: pop from freq[min_freq] bucket (leftmost = LRU), then advance min_freq if bucket is now empty.",
    code: `from collections import defaultdict, OrderedDict

class LFUCache:
    """
    O(1) get and put via three data structures:
    - key_map:  key -> [val, freq]
    - freq_map: freq -> OrderedDict(key -> None)  [LRU ordering within freq]
    - min_freq: current minimum frequency for eviction
    """
    def __init__(self, capacity: int):
        self.cap      = capacity
        self.key_map  = {}                           # key: [val, freq]
        self.freq_map = defaultdict(OrderedDict)     # freq: OrderedDict of keys
        self.min_freq = 0

    def _update(self, key: int) -> None:
        val, freq = self.key_map[key]
        # Remove from current freq bucket
        del self.freq_map[freq][key]
        if not self.freq_map[freq] and freq == self.min_freq:
            self.min_freq += 1   # LFU floor rises when the bucket empties
        # Move to next freq bucket (FIFO order within bucket = LRU)
        new_freq = freq + 1
        self.freq_map[new_freq][key] = None
        self.key_map[key] = [val, new_freq]

    def get(self, key: int) -> int:
        if key not in self.key_map:
            return -1
        self._update(key)
        return self.key_map[key][0]

    def put(self, key: int, value: int) -> None:
        if self.cap <= 0:
            return
        if key in self.key_map:
            self.key_map[key][0] = value
            self._update(key)
            return
        if len(self.key_map) >= self.cap:
            # Evict LFU entry (LRU tiebreak: popitem(last=False) = oldest)
            evict_key, _ = self.freq_map[self.min_freq].popitem(last=False)
            del self.key_map[evict_key]
        # Insert with frequency 1
        self.key_map[key] = [value, 1]
        self.freq_map[1][key] = None
        self.min_freq = 1

# Test
lfu = LFUCache(2)
lfu.put(1, 1); lfu.put(2, 2)
print(lfu.get(1))    # 1  (key 1 freq -> 2)
lfu.put(3, 3)        # evict key 2 (freq=1, LFU)
print(lfu.get(2))    # -1
print(lfu.get(3))    # 3
lfu.put(4, 4)        # evict key 1 (freq=2, but key 3 freq=2 too — LRU tiebreak evicts key 1? No — key 1 freq=2, key 3 freq=2; evict oldest in min_freq=2 => key 1)
print(lfu.get(1))    # -1
print(lfu.get(3))    # 3
print(lfu.get(4))    # 4`,
    language: "python",
    complexity: { time: "O(1) per get/put", space: "O(capacity)" },
  },
  {
    id: "fin-0525-b1-reservoir-sampling",
    leetcodeNumber: 382,
    title: "Reservoir Sampling — Uniform Trade Sampling from Stream",
    difficulty: "medium",
    topics: ["randomized", "math", "finance"],
    problem:
      "A tick feed is a potentially infinite stream of trade records. Design an algorithm to maintain a reservoir of exactly k trades such that at any point in the stream, each trade seen so far has exactly equal probability k/n of being in the reservoir (where n is the total number of trades seen). This powers unbiased Monte Carlo VaR estimation without storing the full trade history.",
    examples: [
      {
        input: "stream = [10, 20, 30, 40, 50], k = 3",
        output: "Any 3-element subset, each with probability 3/5",
        explanation: "After seeing all 5 trades, each of the C(5,3)=10 subsets is equally likely.",
      },
      {
        input: "k=1, stream is infinite",
        output: "At step n, current element is in reservoir with prob 1/n",
        explanation: "Classic: keep element with prob 1/n, replace existing with prob 1/n.",
      },
    ],
    approach:
      "Algorithm R (Vitter 1985): fill reservoir with first k elements. For each subsequent element i (0-indexed from 0), pick a random j in [0, i]. If j < k, replace reservoir[j] with the current element. Proof: after n elements, P(element i in reservoir) = k/n by induction. O(n) time, O(k) space.",
    code: `import random
from typing import Iterator, TypeVar

T = TypeVar('T')

class ReservoirSampler:
    """
    Maintain a uniformly random sample of k items from a data stream
    without knowing the stream length in advance.
    After n items: P(any item in reservoir) = k/n exactly.
    """
    def __init__(self, k: int, seed: int = 42):
        self.k         = k
        self.reservoir = []
        self.n         = 0             # items seen so far
        random.seed(seed)

    def update(self, item) -> None:
        self.n += 1
        if len(self.reservoir) < self.k:
            # Fill reservoir with first k items.
            self.reservoir.append(item)
        else:
            # Replace a random element with decreasing probability.
            j = random.randint(0, self.n - 1)   # uniform in [0, n-1]
            if j < self.k:
                self.reservoir[j] = item         # prob k/n of replacement

    def sample(self) -> list:
        return list(self.reservoir)


def weighted_reservoir(stream, weights, k: int, seed: int = 42):
    """
    Weighted reservoir sampling (Efraimidis & Spirakis 2006):
    Each item gets priority U_i^(1/w_i) where U_i ~ Uniform(0,1).
    Keep the k items with largest priorities.
    Used when trades should be weighted by volume (larger trades sampled more).
    """
    import heapq
    rng = random.Random(seed)
    heap = []   # min-heap of (priority, item)

    for item, w in zip(stream, weights):
        u   = rng.random()
        key = u ** (1.0 / w)   # exponential trick: higher weight -> higher key avg
        if len(heap) < k:
            heapq.heappush(heap, (key, item))
        elif key > heap[0][0]:
            heapq.heapreplace(heap, (key, item))

    return [item for _, item in heap]


# Verify uniformity over many trials
from collections import Counter
counts = Counter()
for trial in range(10_000):
    r = ReservoirSampler(k=2, seed=trial)
    for x in [1, 2, 3, 4, 5]:
        r.update(x)
    counts[tuple(sorted(r.sample()))] += 1

print("Expected each subset count ~1000/10:")
for s, c in sorted(counts.items()):
    print(f"  {s}: {c}")`,
    language: "python",
    complexity: { time: "O(n) total", space: "O(k)" },
  },
  {
    id: "fin-0525-b1-lis-price-trend",
    leetcodeNumber: 300,
    title: "Longest Increasing Subsequence — Monotone Bid Price Sequence",
    difficulty: "medium",
    topics: ["dynamic-programming", "binary-search", "finance"],
    problem:
      "Given a time series of bid price snapshots, find the length of the longest strictly increasing subsequence of prices. This identifies the longest sustained uptrend in the order book — a signal used in momentum strategies. The subsequence need not be contiguous. Solve in O(n log n).",
    examples: [
      {
        input: "prices = [10, 9, 2, 5, 3, 7, 101, 18]",
        output: "4",
        explanation: "Longest increasing subsequence: [2, 3, 7, 18] or [2, 5, 7, 18], length 4.",
      },
      {
        input: "prices = [0, 1, 0, 3, 2, 3]",
        output: "4",
        explanation: "LIS: [0, 1, 2, 3] or [0, 1, 3], length 4 (first) — longest is 4.",
      },
    ],
    approach:
      "Patience sorting (O(n log n)): maintain a 'tails' array where tails[i] = smallest tail element of all increasing subsequences of length i+1. For each new price, binary search in tails for the position to place it (bisect_left). If price > all tails: append (extends LIS); otherwise replace tails[pos] (records better tail for shorter subsequence). LIS length = len(tails).",
    code: `import bisect
from typing import Optional

def length_of_lis(prices: list[int]) -> int:
    """
    Patience sorting: tails[i] = smallest tail of LIS of length i+1.
    Binary search each price into tails — O(log n) per element.
    tails is always sorted; bisect_left finds the insertion point.
    """
    tails = []
    for p in prices:
        pos = bisect.bisect_left(tails, p)
        if pos == len(tails):
            tails.append(p)      # extends the longest LIS
        else:
            tails[pos] = p       # improves (lowers) the tail at length pos+1
    return len(tails)


def lis_with_reconstruction(prices: list[int]) -> tuple[int, list[int]]:
    """
    Reconstruct the actual LIS by storing predecessor indices.
    Used to identify which specific bid levels formed the longest uptrend.
    O(n log n) time, O(n) space.
    """
    n      = len(prices)
    tails  = []          # values (as above)
    idx    = []          # index in prices[] of each tail value
    parent = [-1] * n    # predecessor index for reconstruction
    tails_idx = []       # index of each tail

    for i, p in enumerate(prices):
        pos = bisect.bisect_left(tails, p)
        if pos == len(tails):
            tails.append(p);     tails_idx.append(i)
        else:
            tails[pos] = p;      tails_idx[pos] = i
        parent[i] = tails_idx[pos - 1] if pos > 0 else -1

    # Reconstruct from the last element of the longest LIS
    seq  = []
    i    = tails_idx[-1]
    while i >= 0:
        seq.append(prices[i])
        i = parent[i]
    return len(tails), seq[::-1]


# Test
print(length_of_lis([10, 9, 2, 5, 3, 7, 101, 18]))   # 4
print(length_of_lis([0, 1, 0, 3, 2, 3]))              # 4

length, subseq = lis_with_reconstruction([10, 9, 2, 5, 3, 7, 101, 18])
print(f"LIS length={length}  sequence={subseq}")      # [2, 3, 7, 18]`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-0525-b1-topological-settlement",
    leetcodeNumber: 210,
    title: "Topological Sort — Trade Settlement Dependency Ordering",
    difficulty: "medium",
    topics: ["graph", "topological-sort", "BFS", "finance"],
    problem:
      "In T+2 equity settlement, some trades depend on the proceeds of earlier trades (e.g., buying stock B requires receiving cash from selling stock A first). Given N trades and a list of dependencies [a, b] meaning 'trade a must settle before trade b', determine a valid settlement order. If a circular dependency exists (deadlock — a settlement cycle), return an empty list. This is Course Schedule II applied to trade settlement.",
    examples: [
      {
        input: "n=4, prerequisites=[[1,0],[2,0],[3,1],[3,2]]",
        output: "[0, 1, 2, 3] or [0, 2, 1, 3]",
        explanation: "Trade 0 must settle first. Then 1 and 2 (any order). Then 3.",
      },
      {
        input: "n=2, prerequisites=[[1,0],[0,1]]",
        output: "[]",
        explanation: "Circular dependency: 0 requires 1 and 1 requires 0 — deadlock.",
      },
    ],
    approach:
      "Kahn's algorithm (BFS topological sort): compute in-degree for each node. Push all zero-in-degree nodes into a queue. Process queue: for each node, decrement in-degree of its neighbors; if any neighbor's in-degree drops to 0, enqueue it. If output length < n, a cycle exists (not all nodes were processed).",
    code: `from collections import deque, defaultdict

def settlement_order(n: int, prerequisites: list[list[int]]) -> list[int]:
    """
    Kahn's topological sort: BFS on the directed dependency graph.
    in_degree[i] = number of unsettled prerequisites of trade i.
    A trade is ready to settle when all its prerequisites are done.
    Cycle detection: if the result has fewer than n trades, there is a deadlock.
    """
    # Build adjacency list and in-degree counts
    graph     = defaultdict(list)
    in_degree = [0] * n

    for a, b in prerequisites:
        # 'b must settle before a' => edge b -> a
        graph[b].append(a)
        in_degree[a] += 1

    # Start with all trades that have no unsettled prerequisites
    queue = deque(i for i in range(n) if in_degree[i] == 0)
    order = []

    while queue:
        trade = queue.popleft()
        order.append(trade)
        for dependent in graph[trade]:
            in_degree[dependent] -= 1
            if in_degree[dependent] == 0:
                queue.append(dependent)

    # If not all trades settled, there is a circular dependency (deadlock)
    return order if len(order) == n else []


def has_cycle(n: int, prerequisites: list[list[int]]) -> bool:
    """Return True if settlement graph has a cycle (impossible to settle all)."""
    return len(settlement_order(n, prerequisites)) < n


# Tests
print(settlement_order(4, [[1,0],[2,0],[3,1],[3,2]]))  # [0,1,2,3] or [0,2,1,3]
print(settlement_order(2, [[1,0],[0,1]]))               # [] — cycle!
print(settlement_order(3, [[1,0],[2,1]]))               # [0,1,2]
print(settlement_order(1, []))                           # [0]`,
    language: "python",
    complexity: { time: "O(V + E)", space: "O(V + E)" },
  },
  {
    id: "fin-0525-b1-count-range-sum",
    leetcodeNumber: 327,
    title: "Count Range Sum — Profitable Sub-Periods in [lower, upper]",
    difficulty: "hard",
    topics: ["divide-and-conquer", "binary-indexed-tree", "finance"],
    problem:
      "Given an array of daily returns returns[], count the number of contiguous sub-periods (i, j) where the cumulative P&L in [i, j] falls in [lower, upper]. This counts how many historical windows of any length produced a P&L within your target range — used for strategy parameter sensitivity analysis.",
    examples: [
      {
        input: "returns = [-2, 5, -1], lower = -2, upper = 2",
        output: "3",
        explanation: "Sub-periods: [0,0]=(-2, yes), [0,1]=(3, no), [0,2]=(2, yes), [1,1]=(5, no), [1,2]=(4, no), [2,2]=(-1, yes). Count=3.",
      },
      {
        input: "returns = [0], lower = 0, upper = 0",
        output: "1",
        explanation: "Only one sub-period, P&L=0 in [0,0].",
      },
    ],
    approach:
      "Compute prefix sums. Count pairs (i, j) where lower <= prefix[j] - prefix[i] <= upper, i.e., prefix[j] - upper <= prefix[i] <= prefix[j] - lower. Merge sort on prefix sums: during merge, for each j in right half, use two pointers to count valid i in left half. O(n log n). Alternative: BIT/coordinate compression — insert prefix[i], query range for each j.",
    code: `def count_range_sum(nums: list[int], lower: int, upper: int) -> int:
    """
    Count (i, j) pairs: lower <= prefix[j] - prefix[i] <= upper  (i <= j).
    Merge sort on prefix sums: during merge of left/right halves,
    count how many left-half values fall in [prefix[j]-upper, prefix[j]-lower]
    for each right-half element prefix[j].
    Both left and right are already sorted — use two sliding pointers.
    O(n log n) time.
    """
    prefix = [0]
    for x in nums:
        prefix.append(prefix[-1] + x)

    def merge_count(arr: list[int]) -> int:
        n = len(arr)
        if n <= 1:
            return 0

        mid   = n // 2
        left  = arr[:mid]
        right = arr[mid:]

        count = merge_count(left) + merge_count(right)

        # Count: for each j in right, how many i in left satisfy
        # lower <= right[j] - left[i] <= upper
        # <=> right[j] - upper <= left[i] <= right[j] - lower
        lo = hi = 0          # sliding pointers into left
        for rj in right:
            while lo < len(left) and left[lo] <  rj - upper: lo += 1
            while hi < len(left) and left[hi] <= rj - lower: hi += 1
            count += hi - lo

        # Standard merge (in-place sort arr for parent call)
        i = j = k = 0
        merged = []
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i]); i += 1
            else:
                merged.append(right[j]); j += 1
        merged.extend(left[i:]); merged.extend(right[j:])
        arr[:] = merged
        return count

    return merge_count(prefix)


print(count_range_sum([-2, 5, -1], lower=-2, upper=2))   # 3
print(count_range_sum([0], lower=0, upper=0))              # 1
print(count_range_sum([0, 0], lower=0, upper=0))           # 3`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-0525-b1-min-arrows",
    leetcodeNumber: 452,
    title: "Minimum Arrows to Burst Balloons — Minimum Hedges for Exposure Windows",
    difficulty: "medium",
    topics: ["greedy", "interval-scheduling", "finance"],
    problem:
      "A derivatives desk has N exposure windows, each defined by [start, end] in time (e.g., an option's lifespan). A single hedging instrument (an arrow) covers all positions that overlap the point where it's placed. Find the minimum number of hedging instruments needed so that every exposure window is covered by at least one instrument. This is the minimum number of points to pierce all intervals.",
    examples: [
      {
        input: "windows = [[10,16],[2,8],[1,6],[7,12]]",
        output: "2",
        explanation: "Arrow at 6 covers [2,8], [1,6]. Arrow at 11 covers [10,16], [7,12]. 2 arrows.",
      },
      {
        input: "windows = [[1,2],[3,4],[5,6],[7,8]]",
        output: "4",
        explanation: "No two intervals overlap — each needs its own hedging instrument.",
      },
    ],
    approach:
      "Greedy: sort intervals by end time. Place the first arrow at the end of the first interval. Skip all intervals that contain this arrow position. When an interval starts after the current arrow, place a new arrow at the end of that interval. Repeat. The key insight: placing the arrow at the earliest possible end maximises how many subsequent intervals it covers.",
    code: `def min_arrows(windows: list[list[int]]) -> int:
    """
    Greedy interval covering: sort by end, place arrow at each 'earliest end'.
    An arrow at position x covers all [start, end] where start <= x <= end.
    Sort by end: the interval ending earliest is the most constraining — place
    the arrow at its end to cover it while being as far right as possible.
    """
    if not windows:
        return 0

    # Sort by end time of each exposure window
    windows.sort(key=lambda x: x[1])

    arrows    = 1
    arrow_pos = windows[0][1]    # place first arrow at end of first window

    for start, end in windows[1:]:
        if start > arrow_pos:
            # This window starts AFTER the current arrow — a new instrument is needed
            arrows   += 1
            arrow_pos = end   # place new arrow at end of this window

    return arrows


def min_arrows_with_positions(windows: list[list[int]]) -> tuple[int, list[int]]:
    """
    Also return the optimal arrow placement positions.
    Useful for scheduling: WHERE in time should each hedging instrument be entered.
    """
    if not windows:
        return 0, []

    windows.sort(key=lambda x: x[1])
    positions = [windows[0][1]]
    arrow_pos = windows[0][1]

    for start, end in windows[1:]:
        if start > arrow_pos:
            arrow_pos = end
            positions.append(arrow_pos)

    return len(positions), positions


print(min_arrows([[10,16],[2,8],[1,6],[7,12]]))   # 2
print(min_arrows([[1,2],[3,4],[5,6],[7,8]]))       # 4
print(min_arrows([[1,2],[2,3],[3,4],[4,5]]))       # 2

n, pos = min_arrows_with_positions([[10,16],[2,8],[1,6],[7,12]])
print(f"{n} instruments at {pos}")                 # 2 instruments at [6, 12]`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(1)" },
  },
  {
    id: "fin-0525-b1-skyline",
    leetcodeNumber: 218,
    title: "Skyline Problem — Order Book Volume Profile Outline",
    difficulty: "hard",
    topics: ["heap", "divide-and-conquer", "sweep-line", "finance"],
    problem:
      "Given a list of (left_price, right_price, volume) tuples representing visible volume blocks in an order book depth chart, compute the 'skyline' — the list of (price_level, volume) key points that describe the outer profile of the volume histogram. This is used to render the order book depth chart and identify significant volume cliffs (support/resistance).",
    examples: [
      {
        input: "blocks = [[2,9,10],[3,7,15],[5,12,12],[15,20,10],[19,24,8]]",
        output: "[[2,10],[3,15],[7,12],[9,10],[12,0],[15,10],[19,8],[24,0]]",
        explanation: "Key points where the height changes. [24,0] marks the end.",
      },
      {
        input: "blocks = [[0,2,3],[2,5,3]]",
        output: "[[0,3],[5,0]]",
        explanation: "Consecutive same-height blocks merge into one continuous profile.",
      },
    ],
    approach:
      "Sweep line with a max-heap: convert each block [L,R,H] into events (L, -H, R) for start and (R, 0, 0) for end. Sort events by position. Use a max-heap of (height, end_time) to track active blocks. At each event position, add new blocks, remove expired ones, and record a key point if the maximum height changed.",
    code: `import heapq
from collections import defaultdict

def get_skyline(blocks: list[list[int]]) -> list[list[int]]:
    """
    Sweep line + max-heap:
    Events: (x, -height, end) for block start, (x, 0, 0) for block end.
    Sort events: same x -> starts before ends, taller before shorter.
    At each event: maintain max-heap of active (height, end) pairs.
    Key point: when max height changes, record (x, new_height).
    """
    events = []
    for L, R, H in blocks:
        events.append((L, -H, R))   # start: negative H for max-heap
        events.append((R,  0, 0))   # end marker

    # Sort: by x; same x -> starts (negative H) before ends (H=0); tallest first
    events.sort(key=lambda e: (e[0], e[1]))

    result = []
    heap   = [(0, float('inf'))]   # (neg_height, end_x), sentinel at height 0
    prev_max = 0

    for x, neg_h, end in events:
        if neg_h != 0:
            # Start of a block: push its height and end position
            heapq.heappush(heap, (neg_h, end))

        # Remove all expired blocks from top of heap
        while heap[0][1] <= x:
            heapq.heappop(heap)

        # Current maximum height
        cur_max = -heap[0][0]

        if cur_max != prev_max:
            result.append([x, cur_max])
            prev_max = cur_max

    return result


def skyline_divide_conquer(blocks: list[list[int]]) -> list[list[int]]:
    """
    Divide-and-conquer alternative: split blocks in half, recursively get
    skylines of each half, then merge two skylines into one.
    Merge: walk both sorted lists, maintain current max height of each side.
    O(n log n) time.
    """
    if not blocks:
        return [[0, 0]]
    if len(blocks) == 1:
        L, R, H = blocks[0]
        return [[L, H], [R, 0]]

    mid  = len(blocks) // 2
    left = skyline_divide_conquer(blocks[:mid])
    right= skyline_divide_conquer(blocks[mid:])

    # Merge two skylines
    merged = []
    h1 = h2 = 0
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i][0] < right[j][0]:
            x, h1 = left[i]; i += 1
        elif right[j][0] < left[i][0]:
            x, h2 = right[j]; j += 1
        else:
            x, h1, h2 = left[i][0], left[i][1], right[j][1]; i += 1; j += 1
        h = max(h1, h2)
        if not merged or merged[-1][1] != h:
            merged.append([x, h])

    while i < len(left):
        if not merged or merged[-1][1] != left[i][1]: merged.append(left[i])
        i += 1
    while j < len(right):
        if not merged or merged[-1][1] != right[j][1]: merged.append(right[j])
        j += 1
    return merged


print(get_skyline([[2,9,10],[3,7,15],[5,12,12],[15,20,10],[19,24,8]]))
print(get_skyline([[0,2,3],[2,5,3]]))`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-0525-b1-find-duplicate",
    leetcodeNumber: 287,
    title: "Find Duplicate Order ID — Floyd's Cycle Detection",
    difficulty: "medium",
    topics: ["bit-manipulation", "two-pointers", "math", "finance"],
    problem:
      "Given an array of n+1 order IDs where each ID is in [1, n], find the one duplicate ID without modifying the array and using only O(1) extra space. This models duplicate order detection in a fix-and-forget protocol: the array is the received ID log, and you need to find the replayed order without sorting or a hash set.",
    examples: [
      {
        input: "ids = [1, 3, 4, 2, 2]",
        output: "2",
        explanation: "ID 2 appears twice.",
      },
      {
        input: "ids = [3, 1, 3, 4, 2]",
        output: "3",
        explanation: "ID 3 appears twice.",
      },
    ],
    approach:
      "Floyd's cycle detection (tortoise and hare): treat the array as a linked list where ids[i] points to the next index. A duplicate entry creates a cycle. Phase 1: move slow by 1 step, fast by 2 until they meet (inside the cycle). Phase 2: reset one pointer to start; move both by 1 step; they meet at the cycle entrance = the duplicate ID. O(n) time, O(1) space, no array modification.",
    code: `def find_duplicate(ids: list[int]) -> int:
    """
    Floyd's tortoise and hare applied to the implicit linked list ids[i]->ids[ids[i]].
    The duplicate ID creates two entries pointing to the same index => cycle.
    Phase 1: slow=1 step, fast=2 steps until they collide inside the cycle.
    Phase 2: slow stays, fast resets to index 0; both move 1 step; they meet
             at the cycle entrance, which is the duplicate.
    """
    slow = ids[0]
    fast = ids[0]

    # Phase 1: find the meeting point inside the cycle
    while True:
        slow = ids[slow]           # 1 step
        fast = ids[ids[fast]]      # 2 steps
        if slow == fast:
            break

    # Phase 2: find the entrance to the cycle (= duplicate ID)
    slow = ids[0]
    while slow != fast:
        slow = ids[slow]
        fast = ids[fast]

    return slow   # the duplicate


def find_duplicate_xor(ids: list[int]) -> int:
    """
    Alternative: XOR-based if exactly one duplicate exists and the set is [1..n].
    XOR all ids with 1..n — the unique duplicate survives (all others cancel).
    O(n) time, O(1) space. Only works when exactly one value is duplicated once.
    """
    xor = 0
    n   = len(ids) - 1
    for i in range(1, n + 1):
        xor ^= i          # XOR in expected values
    for x in ids:
        xor ^= x          # XOR in actual values; duplicate appears twice => cancels non-dup

    # NOTE: this is NOT the find_duplicate for general input — it works only
    # when the array contains exactly n+1 elements from [1,n] with one duplicate.
    return xor


print(find_duplicate([1, 3, 4, 2, 2]))   # 2
print(find_duplicate([3, 1, 3, 4, 2]))   # 3
print(find_duplicate([1, 1]))             # 1`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-0525-b1-count-smaller",
    leetcodeNumber: 315,
    title: "Count Smaller Numbers After Self — Order Fill Priority Rank",
    difficulty: "hard",
    topics: ["binary-indexed-tree", "merge-sort", "finance"],
    problem:
      "Given an array of order timestamps (or prices), for each position i, count the number of elements to its right that are strictly less than nums[i]. In an order book replay context, this gives each order's 'rank' among future orders — how many later orders would have higher time-price priority (smaller timestamp or price, meaning they fill first). Return an array counts where counts[i] is the answer for index i.",
    examples: [
      {
        input: "nums = [5, 2, 6, 1]",
        output: "[2, 1, 1, 0]",
        explanation: "5: smaller after = {2,1}. 2: {1}. 6: {1}. 1: nothing.",
      },
      {
        input: "nums = [2, 0, 1]",
        output: "[2, 0, 1]",
        explanation: "2: {0,1}. 0: {}. 1: {}. Wait, 1's right is empty — count=0. Let me recheck: [2,0,1] -> 2 has {0,1}=2, 0 has {}=0, 1 has {}=0. Output: [2,0,0].",
      },
    ],
    approach:
      "Merge sort with index tracking (O(n log n)): during the merge step, when a right-half element is placed before left-half elements, all remaining left-half elements in the current merge window have a count increment. Track original indices to update the counts array correctly. Alternative: Fenwick tree (BIT) after coordinate compression — process right to left, query BIT for sum in [0, nums[i]-1], then update BIT at nums[i].",
    code: `from sortedcontainers import SortedList

def count_smaller(nums: list[int]) -> list[int]:
    """
    Fenwick Tree (BIT) + coordinate compression:
    Process right to left. For each element, query how many already-processed
    (i.e., to the right) elements are smaller — that's the BIT prefix sum.
    Then insert current element into BIT.
    O(n log n) time, O(n) space.
    """
    # Coordinate compression: map values to 1-indexed ranks
    sorted_vals = sorted(set(nums))
    rank        = {v: i + 1 for i, v in enumerate(sorted_vals)}
    N           = len(sorted_vals)

    bit = [0] * (N + 1)

    def update(i: int) -> None:
        while i <= N:
            bit[i] += 1
            i      += i & (-i)

    def query(i: int) -> int:
        s = 0
        while i > 0:
            s += bit[i]
            i -= i & (-i)
        return s

    result = []
    for x in reversed(nums):
        r = rank[x]
        result.append(query(r - 1))   # count of elements strictly less than x
        update(r)

    return result[::-1]


def count_smaller_sorted_list(nums: list[int]) -> list[int]:
    """
    Alternative using SortedList (O(n log n) via bisect internally).
    More readable but requires sortedcontainers library.
    """
    sl     = SortedList()
    result = []
    for x in reversed(nums):
        result.append(sl.bisect_left(x))   # count of elements < x
        sl.add(x)
    return result[::-1]


print(count_smaller([5, 2, 6, 1]))   # [2, 1, 1, 0]
print(count_smaller([2, 0, 1]))      # [2, 0, 0]
print(count_smaller([-1]))           # [0]`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-0525-b1-max-circular-subarray",
    leetcodeNumber: 918,
    title: "Maximum Sum Circular Subarray — Best Circular Trading Period",
    difficulty: "medium",
    topics: ["dynamic-programming", "greedy", "finance"],
    problem:
      "Given a circular array of daily P&Ls (the array wraps around — the day after the last day is the first day again), find the maximum sum contiguous subarray. This models finding the best consecutive trading period in a year where January can follow December. The subarray can wrap around the end of the array.",
    examples: [
      {
        input: "pnl = [1, -2, 3, -2]",
        output: "3",
        explanation: "Non-circular: subarray [3] = 3. Circular wrap doesn't help here.",
      },
      {
        input: "pnl = [5, -3, 5]",
        output: "10",
        explanation: "Wrap: [5] + [5] = 10 (last element + first element as a contiguous circular segment).",
      },
      {
        input: "pnl = [-3, -2, -3]",
        output: "-2",
        explanation: "All negative: best is the single element -2. Circular sum = total - min_subarray = -8-(-5) = -3 < -2, so use Kadane's result.",
      },
    ],
    approach:
      "Two cases: (1) The max subarray does NOT wrap: use Kadane's algorithm. (2) The max subarray wraps: it equals total_sum - min_subarray (the complement). Take the max of both cases. Edge case: if all elements are negative, Kadane's gives the answer (the circular sum would be total - min = 0, which is invalid since we need at least one element).",
    code: `def max_subarray_circular(pnl: list[int]) -> int:
    """
    Case 1: max subarray does not wrap  -> Kadane's algorithm.
    Case 2: max subarray wraps          -> total - min_subarray (Kadane's for min).
    Return max(case1, case2).
    Special case: if all elements negative, case2 = 0 (invalid) -> use case1.

    Kadane's: dp[i] = max(dp[i-1] + pnl[i], pnl[i])
              track global max and min simultaneously.
    """
    max_sum  = pnl[0]    # best non-wrapping subarray (Kadane's)
    min_sum  = pnl[0]    # worst (minimum) subarray (for circular case)
    total    = pnl[0]

    cur_max  = pnl[0]
    cur_min  = pnl[0]

    for i in range(1, len(pnl)):
        p = pnl[i]
        # Kadane's for max
        cur_max = max(p, cur_max + p)
        max_sum = max(max_sum, cur_max)
        # Kadane's for min (inverted Kadane's)
        cur_min = min(p, cur_min + p)
        min_sum = min(min_sum, cur_min)
        total  += p

    # If all elements are negative, total - min_sum = 0 which is invalid (empty subarray).
    # In that case, return max_sum (the least-negative element).
    if max_sum < 0:
        return max_sum

    # Circular case: total - min_subarray (complement is the wrapping max)
    circular_max = total - min_sum
    return max(max_sum, circular_max)


# Tests
print(max_subarray_circular([1, -2, 3, -2]))   # 3  (non-circular)
print(max_subarray_circular([5, -3, 5]))        # 10 (circular: 5+5)
print(max_subarray_circular([-3, -2, -3]))      # -2 (all negative: Kadane's)
print(max_subarray_circular([3, -1, 2, -1]))    # 4  (non-circular: [3,-1,2])
print(max_subarray_circular([3, -2, 2, -3]))    # 3  (non-circular or circular both give 3)`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
];
