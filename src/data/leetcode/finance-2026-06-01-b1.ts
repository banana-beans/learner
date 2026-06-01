import type { LeetCodeProblem } from "./index";

export const financeProblems20260601B1: LeetCodeProblem[] = [
  {
    id: "fin-20260601-b1-max-product-subarray",
    title: "Maximum Compounded Return Window",
    difficulty: "medium",
    topics: ["dynamic-programming", "arrays"],
    problem: `Given an array of daily return multipliers (e.g., 1.02 for +2%, 0.97 for -3%), find the contiguous subarray with the maximum total compounded return (product of multipliers).

Because the product of negative numbers can become positive, you need to track both the running maximum and minimum products.

Input: factors = [1.02, 0.97, 1.05, 0.94, 1.08, 1.03]
Output: 1.108...  (subarray [1.05, 0.94, 1.08, 1.03] = 1.05*0.94*1.08*1.03 ≈ 1.099... or the best sub-product)

Input: factors = [0.95, 0.5, 0.5, 1.5, 1.5, 1.5]
Output: 3.375  (1.5 * 1.5 * 1.5)`,
    examples: [
      {
        input: "factors = [1.02, 0.97, 1.05, 0.94, 1.08, 1.03]",
        output: "1.0993...",
        explanation:
          "Track max_prod and min_prod at each step. min_prod catches negative chains that become positive later. Best product is the running maximum across all endings.",
      },
      {
        input: "factors = [0.95, 0.5, 0.5, 1.5, 1.5, 1.5]",
        output: "3.375",
        explanation: "Last three elements: 1.5^3 = 3.375. The 0.5 factors drag down any longer subarray.",
      },
    ],
    constraints: [
      "1 <= n <= 2 * 10^4",
      "0 < factors[i] <= 10 (no zero factors; factors > 1 = gain, < 1 = loss)",
      "Answer is the maximum product of any non-empty contiguous subarray",
    ],
    approach: `Adapt the maximum product subarray algorithm (LeetCode 152) to floating-point factors.

At each index i, maintain:
- max_prod: the maximum product of any subarray ending at i
- min_prod: the minimum product of any subarray ending at i (useful when factors can be < 0; for positive factors, min_prod = 1.0/factor path, but still needed for robustness)

Transition:
  candidates = [factors[i], max_prod * factors[i], min_prod * factors[i]]
  new_max = max(candidates)
  new_min = min(candidates)

Update the global answer with new_max.

Time: O(N), Space: O(1).

Note: for purely positive factors, max subarray = max product of any prefix suffix (could also just take log and run Kadane's on log-returns). The 3-candidate approach is universal.`,
    code: `def max_compounded_return(factors: list[float]) -> float:
    max_prod = factors[0]
    min_prod = factors[0]
    best     = factors[0]

    for f in factors[1:]:
        candidates = (f, max_prod * f, min_prod * f)
        max_prod = max(candidates)
        min_prod = min(candidates)
        best = max(best, max_prod)

    return best

# Tests
print(max_compounded_return([1.02, 0.97, 1.05, 0.94, 1.08, 1.03]))  # 1.0993...
print(max_compounded_return([0.95, 0.5, 0.5, 1.5, 1.5, 1.5]))        # 3.375
print(max_compounded_return([0.9, 0.8, 0.7]))                          # 0.9 (best single)

# Log-return variant (equivalent for positive factors).
import math
def max_log_return(factors):
    logs  = [math.log(f) for f in factors]
    # Kadane's algorithm on log-returns.
    best = curr = logs[0]
    for l in logs[1:]:
        curr = max(l, curr + l)
        best = max(best, curr)
    return math.exp(best)

print(max_log_return([1.02, 0.97, 1.05, 0.94, 1.08, 1.03]))  # same answer`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },

  {
    id: "fin-20260601-b1-dutch-flag-signals",
    title: "Three-Way Signal Sort — Dutch National Flag for Buy/Hold/Sell",
    difficulty: "easy",
    topics: ["sorting", "two-pointers", "arrays"],
    problem: `You have an array of trading signals where each element is either -1 (sell), 0 (hold), or 1 (buy). Partition the array in-place so that all sells come first, then holds, then buys — in a single pass without extra memory.

This is the Dutch National Flag problem applied to signal triaging before a portfolio rebalancing step.

Input:  signals = [1, -1, 0, 1, 0, -1, 1, 0]
Output: [-1, -1, 0, 0, 0, 1, 1, 1]  (in-place, order within groups may vary)`,
    examples: [
      {
        input: "signals = [1, -1, 0, 1, 0, -1, 1, 0]",
        output: "[-1, -1, 0, 0, 0, 1, 1, 1]",
        explanation:
          "Use three pointers: lo (boundary before holds), mid (current), hi (boundary after holds). Scan with mid; swap -1s to lo region, +1s to hi region, skip 0s.",
      },
      {
        input: "signals = [1, 1, 1]",
        output: "[1, 1, 1]",
        explanation: "All buys — no movement needed.",
      },
    ],
    constraints: [
      "1 <= n <= 3 * 10^4",
      "signals[i] in {-1, 0, 1}",
      "In-place: O(1) extra space",
      "Single pass: O(N) time",
    ],
    approach: `Dutch National Flag algorithm (Dijkstra):

Maintain three pointers:
  lo = 0     (everything before lo is -1)
  mid = 0    (everything in [lo, mid) is 0)
  hi = n-1   (everything after hi is +1)

While mid <= hi:
  if signals[mid] == -1: swap(signals[lo], signals[mid]); lo++; mid++
  if signals[mid] == 0:  mid++
  if signals[mid] == +1: swap(signals[mid], signals[hi]); hi--
  (don't increment mid when swapping from hi, since new signals[mid] is unknown)`,
    code: `def sort_signals(signals: list[int]) -> list[int]:
    lo, mid, hi = 0, 0, len(signals) - 1

    while mid <= hi:
        if signals[mid] == -1:
            signals[lo], signals[mid] = signals[mid], signals[lo]
            lo  += 1
            mid += 1
        elif signals[mid] == 0:
            mid += 1
        else:  # +1
            signals[mid], signals[hi] = signals[hi], signals[mid]
            hi -= 1
            # Don't increment mid: the swapped element is unknown.

    return signals

# Tests
print(sort_signals([1, -1, 0, 1, 0, -1, 1, 0]))   # [-1,-1, 0, 0, 0, 1, 1, 1]
print(sort_signals([0]))                             # [0]
print(sort_signals([1, -1]))                         # [-1, 1]

# Application: before portfolio rebalancing, partition the signal array
# so sells are processed first (to free up cash), then buys.
signals = [1, -1, 0, 1, 0, -1]
sorted_signals = sort_signals(signals[:])
sell_orders = [i for i, s in enumerate(sorted_signals) if s == -1]
buy_orders  = [i for i, s in enumerate(sorted_signals) if s ==  1]
print("Sell first:", sell_orders, "then buy:", buy_orders)`,
    language: "python",
    complexity: { time: "O(N)", space: "O(1)" },
  },

  {
    id: "fin-20260601-b1-lru-order-cache",
    title: "LRU Order State Cache",
    difficulty: "medium",
    topics: ["design", "hash-map", "doubly-linked-list"],
    problem: `Design a Least Recently Used (LRU) cache for caching order state (e.g., status, fills). The cache has a fixed capacity. When full, the least recently accessed order is evicted.

Implement:
- get(order_id) → OrderState or None: retrieve cached state (counts as an access)
- put(order_id, state): insert or update; evict LRU if at capacity

Both operations must be O(1).

Input: capacity=3
Operations: put(1,A), put(2,B), put(3,C), get(1), put(4,D), get(2), get(3)
Output: get(1)→A, get(2)→None (evicted), get(3)→C`,
    examples: [
      {
        input:
          "capacity=3, ops=[put(1,A),put(2,B),put(3,C),get(1),put(4,D),get(2),get(3)]",
        output: "[A, None, C]",
        explanation:
          "After put(1,A),put(2,B),put(3,C): cache=[1,2,3]. get(1) makes 1 MRU: [2,3,1]. put(4,D) evicts LRU=2: [3,1,4]. get(2)=None. get(3) hits.",
      },
    ],
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= order_id <= 10^6",
      "get and put must each run in O(1) average time",
      "OrderState can be any value",
    ],
    approach: `Combine a hash map for O(1) key lookup with a doubly-linked list to maintain access order.

The linked list keeps the most recently used at the tail and least recently used at the head.

On get: move the accessed node to the tail.
On put: if key exists, update value and move to tail. If key is new and cache is full, remove the head node (LRU) and its hash map entry, then insert the new node at tail.

Use sentinel head and tail nodes to avoid null checks.`,
    code: `class DLinkedNode:
    def __init__(self, key=0, val=None):
        self.key  = key
        self.val  = val
        self.prev = None
        self.next = None

class LRUOrderCache:
    def __init__(self, capacity: int):
        self.cap   = capacity
        self.cache: dict[int, DLinkedNode] = {}
        # Sentinel head (LRU side) and tail (MRU side).
        self.head  = DLinkedNode()
        self.tail  = DLinkedNode()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: DLinkedNode) -> None:
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_tail(self, node: DLinkedNode) -> None:
        node.prev = self.tail.prev
        node.next = self.tail
        self.tail.prev.next = node
        self.tail.prev = node

    def get(self, order_id: int):
        if order_id not in self.cache:
            return None
        node = self.cache[order_id]
        self._remove(node)
        self._add_to_tail(node)
        return node.val

    def put(self, order_id: int, state) -> None:
        if order_id in self.cache:
            node = self.cache[order_id]
            node.val = state
            self._remove(node)
            self._add_to_tail(node)
        else:
            if len(self.cache) == self.cap:
                # Evict LRU: node after sentinel head.
                lru = self.head.next
                self._remove(lru)
                del self.cache[lru.key]
            node = DLinkedNode(order_id, state)
            self.cache[order_id] = node
            self._add_to_tail(node)

# Test
cache = LRUOrderCache(3)
cache.put(1, "NEW"); cache.put(2, "FILLED"); cache.put(3, "PARTIAL")
print(cache.get(1))   # "NEW" — 1 becomes MRU
cache.put(4, "NEW")   # evicts 2 (LRU)
print(cache.get(2))   # None
print(cache.get(3))   # "PARTIAL"`,
    language: "python",
    complexity: { time: "O(1) per operation", space: "O(capacity)" },
  },

  {
    id: "fin-20260601-b1-edit-distance-rebalance",
    title: "Minimum Portfolio Rebalancing Steps",
    difficulty: "medium",
    topics: ["dynamic-programming", "strings", "edit-distance"],
    problem: `A portfolio manager wants to transform a current sector allocation string into a target allocation string using the minimum number of operations:
- Insert a sector position
- Delete a sector position
- Replace a sector position with another

Each operation has unit cost. Find the minimum number of operations.

This is the classical edit distance (Levenshtein) problem applied to portfolio rebalancing sequencing.

Input: current = "TECH-HLTH-ENRG", target = "TECH-FNCL-ENRG-UTIL"
Output: 2  (replace HLTH with FNCL, insert UTIL)

Input: current = "AAPL,GOOG,MSFT", target = "AAPL,META,MSFT,NVDA"
Output: 2  (replace GOOG with META, insert NVDA)`,
    examples: [
      {
        input: 'current = "horse", target = "ros"',
        output: "3",
        explanation:
          'horse → rorse (replace h with r) → rose (delete r) → ros (delete e). Classic example.',
      },
      {
        input: 'current = "intention", target = "execution"',
        output: "5",
        explanation:
          "Standard edit distance result for this classic test case.",
      },
    ],
    constraints: [
      "0 <= len(current), len(target) <= 500",
      "Strings consist of lowercase English letters",
      "Solve in O(M*N) time, O(min(M,N)) space",
    ],
    approach: `Standard DP edit distance (Levenshtein).

dp[i][j] = minimum operations to convert current[:i] to target[:j].

Base cases:
  dp[0][j] = j  (j insertions to build target prefix)
  dp[i][0] = i  (i deletions to empty current prefix)

Transition:
  if current[i-1] == target[j-1]: dp[i][j] = dp[i-1][j-1]   (no op)
  else: dp[i][j] = 1 + min(
    dp[i-1][j],    # delete from current
    dp[i][j-1],    # insert into current
    dp[i-1][j-1]   # replace
  )

Space optimisation: use two 1-D arrays (previous and current row).`,
    code: `def min_rebalance_steps(current: str, target: str) -> int:
    m, n = len(current), len(target)

    # Ensure shorter string is 'n' for space optimisation.
    if m < n:
        current, target = target, current
        m, n = n, m

    # dp[j] = edit distance for current[:i] vs target[:j].
    prev = list(range(n + 1))

    for i in range(1, m + 1):
        curr    = [i] + [0] * n
        for j in range(1, n + 1):
            if current[i-1] == target[j-1]:
                curr[j] = prev[j-1]
            else:
                curr[j] = 1 + min(prev[j],       # delete
                                  curr[j-1],      # insert
                                  prev[j-1])      # replace
        prev = curr

    return prev[n]

# Tests
print(min_rebalance_steps("horse", "ros"))           # 3
print(min_rebalance_steps("intention", "execution")) # 5
print(min_rebalance_steps("", "abc"))                # 3
print(min_rebalance_steps("abc", "abc"))             # 0

# Portfolio application: operations on a list of sector codes.
def sector_edit_distance(current: list[str], target: list[str]) -> int:
    # Encode each sector as a unique character for string edit distance.
    all_sectors = list(set(current + target))
    enc = {s: chr(65+i) for i, s in enumerate(all_sectors)}
    s1  = "".join(enc[s] for s in current)
    s2  = "".join(enc[s] for s in target)
    return min_rebalance_steps(s1, s2)

print(sector_edit_distance(["TECH","HLTH","ENRG"],
                            ["TECH","FNCL","ENRG","UTIL"]))  # 2`,
    language: "python",
    complexity: { time: "O(M*N)", space: "O(min(M,N))" },
  },

  {
    id: "fin-20260601-b1-max-flow-capital",
    title: "Maximum Capital Flow Through Desk Limits (Max Flow)",
    difficulty: "hard",
    topics: ["graphs", "max-flow", "bfs"],
    problem: `A trading firm has N desks arranged in a directed graph. Capital flows from the Head Office (node 0) to the Treasury (node N-1). Each directed edge has a capacity (the maximum capital that desk can pass through per day).

Find the maximum total capital that can flow from Head Office to Treasury.

This is the classical max flow problem, solvable with Edmonds-Karp (BFS-based Ford-Fulkerson).

Input: n=4, edges=[(0,1,3),(0,2,2),(1,2,1),(1,3,3),(2,3,4)]
Output: 5  (path 0→1→3 carries 3, path 0→2→3 carries 2)`,
    examples: [
      {
        input: "n=4, edges=[(0,1,3),(0,2,2),(1,2,1),(1,3,3),(2,3,4)]",
        output: "5",
        explanation:
          "Send 3 units on 0→1→3 and 2 units on 0→2→3. The edge (1,2) with capacity 1 is not needed. Total = 5.",
      },
      {
        input: "n=2, edges=[(0,1,10)]",
        output: "10",
        explanation: "Direct single edge — full capacity flows.",
      },
    ],
    constraints: [
      "2 <= n <= 200",
      "0 <= edges <= n*(n-1)",
      "0 <= capacity <= 10^6",
      "Source = 0, Sink = n-1",
    ],
    approach: `Edmonds-Karp algorithm (BFS-based Ford-Fulkerson):

1. Build an adjacency matrix / residual capacity graph.
2. While BFS finds an augmenting path from source to sink:
   a. Find bottleneck (minimum residual capacity along path).
   b. Augment: subtract bottleneck from forward edges, add to reverse edges.
3. Return total flow.

BFS ensures shortest augmenting paths → O(V * E^2) complexity.
Residual graph: for each edge (u,v,cap), maintain forward residual cap[u][v] and reverse cap[v][u].`,
    code: `from collections import deque

def max_capital_flow(n: int, edges: list[tuple[int,int,int]]) -> int:
    # Build residual capacity matrix.
    cap = [[0] * n for _ in range(n)]
    for u, v, c in edges:
        cap[u][v] += c

    def bfs_path(source: int, sink: int) -> list[int] | None:
        """BFS to find an augmenting path. Returns parent array or None."""
        parent = [-1] * n
        visited = {source}
        q = deque([source])
        while q:
            u = q.popleft()
            if u == sink:
                # Reconstruct path.
                path = []
                v = sink
                while v != source:
                    path.append(v)
                    v = parent[v]
                path.append(source)
                return path[::-1]
            for v in range(n):
                if v not in visited and cap[u][v] > 0:
                    visited.add(v)
                    parent[v] = u
                    q.append(v)
        return None

    max_flow = 0
    while True:
        path = bfs_path(0, n - 1)
        if path is None:
            break
        # Find bottleneck.
        bottleneck = min(cap[path[i]][path[i+1]]
                         for i in range(len(path) - 1))
        # Augment residual capacities.
        for i in range(len(path) - 1):
            u, v = path[i], path[i+1]
            cap[u][v] -= bottleneck
            cap[v][u] += bottleneck
        max_flow += bottleneck

    return max_flow

# Tests
print(max_capital_flow(4, [(0,1,3),(0,2,2),(1,2,1),(1,3,3),(2,3,4)]))  # 5
print(max_capital_flow(2, [(0,1,10)]))                                   # 10
print(max_capital_flow(6, [(0,1,16),(0,2,13),(1,2,10),(1,3,12),(2,1,4),
                           (2,4,14),(3,2,9),(3,5,20),(4,3,7),(4,5,4)]))  # 23`,
    language: "python",
    complexity: { time: "O(V * E^2)", space: "O(V^2)" },
  },

  {
    id: "fin-20260601-b1-bitmask-positions",
    title: "Portfolio Position Flags via Bitmask Operations",
    difficulty: "medium",
    topics: ["bit-manipulation", "design"],
    problem: `You manage a portfolio of up to 30 assets. Each asset can have multiple flags set simultaneously:
  FLAG_LONG     = 1  (has long position)
  FLAG_HEDGED   = 2  (delta-hedged)
  FLAG_REVIEWED = 4  (risk-reviewed today)
  FLAG_STRESSED = 8  (in stress scenario)

Design a PortfolioFlags class that supports:
1. set_flag(asset_id, flag): add a flag to an asset
2. clear_flag(asset_id, flag): remove a flag from an asset
3. has_flag(asset_id, flag): check if flag is set
4. assets_with_all_flags(flags): return list of asset IDs that have all specified flags
5. count_flag(flag): return count of assets with a given flag set

All operations O(N) where N is number of assets.

Input: N=4, ops=[(set,0,LONG),(set,0,HEDGED),(set,1,LONG),(set,2,STRESSED),(set,3,LONG),(set,3,HEDGED),(set,3,REVIEWED)]
Query: assets_with_all_flags(LONG | HEDGED) → [0, 3]`,
    examples: [
      {
        input:
          "set flags on 4 assets, query assets with both LONG and HEDGED flags",
        output: "[0, 3]",
        explanation:
          "Assets 0 and 3 both have FLAG_LONG (bit 0) and FLAG_HEDGED (bit 1) set. Asset 1 only has LONG, asset 2 only has STRESSED.",
      },
    ],
    constraints: [
      "1 <= N <= 30 assets",
      "Flags are powers of 2 from 1 to 2^20",
      "Multiple flags can be set simultaneously (bitwise OR)",
      "assets_with_all_flags(mask): return assets where (flag & mask) == mask",
    ],
    approach: `Store one integer bitmask per asset. Operations are single bitwise instructions.

set_flag: flags[asset] |= flag
clear_flag: flags[asset] &= ~flag
has_flag: return (flags[asset] & flag) != 0
assets_with_all_flags(mask): for each asset, check (flags[asset] & mask) == mask
count_flag: popcount pattern — iterate and count.

For the query function, iterating N ≤ 30 assets is O(N) per query. For larger N, maintain an inverted index per flag bit.`,
    code: `class PortfolioFlags:
    FLAG_LONG     = 1
    FLAG_HEDGED   = 2
    FLAG_REVIEWED = 4
    FLAG_STRESSED = 8

    def __init__(self, n_assets: int):
        self.n      = n_assets
        self.flags  = [0] * n_assets   # bitmask per asset

    def set_flag(self, asset_id: int, flag: int) -> None:
        self.flags[asset_id] |= flag

    def clear_flag(self, asset_id: int, flag: int) -> None:
        self.flags[asset_id] &= ~flag

    def has_flag(self, asset_id: int, flag: int) -> bool:
        return bool(self.flags[asset_id] & flag)

    def toggle_flag(self, asset_id: int, flag: int) -> None:
        self.flags[asset_id] ^= flag

    def assets_with_all_flags(self, mask: int) -> list[int]:
        return [i for i in range(self.n) if (self.flags[i] & mask) == mask]

    def assets_with_any_flag(self, mask: int) -> list[int]:
        return [i for i in range(self.n) if self.flags[i] & mask]

    def count_flag(self, flag: int) -> int:
        return sum(1 for f in self.flags if f & flag)

    def flag_summary(self) -> dict[int, list[int]]:
        from collections import defaultdict
        summary = defaultdict(list)
        for i, f in enumerate(self.flags):
            bit = 1
            while bit <= f:
                if f & bit:
                    summary[bit].append(i)
                bit <<= 1
        return dict(summary)

# Test
pf = PortfolioFlags(4)
pf.set_flag(0, PortfolioFlags.FLAG_LONG | PortfolioFlags.FLAG_HEDGED)
pf.set_flag(1, PortfolioFlags.FLAG_LONG)
pf.set_flag(2, PortfolioFlags.FLAG_STRESSED)
pf.set_flag(3, PortfolioFlags.FLAG_LONG | PortfolioFlags.FLAG_HEDGED | PortfolioFlags.FLAG_REVIEWED)

mask = PortfolioFlags.FLAG_LONG | PortfolioFlags.FLAG_HEDGED
print("Long+Hedged:", pf.assets_with_all_flags(mask))   # [0, 3]
print("Count long:", pf.count_flag(PortfolioFlags.FLAG_LONG))  # 3
print("Has stress(2):", pf.has_flag(2, PortfolioFlags.FLAG_STRESSED))  # True
pf.clear_flag(3, PortfolioFlags.FLAG_REVIEWED)
print("Reviewed after clear:", pf.has_flag(3, PortfolioFlags.FLAG_REVIEWED))  # False`,
    language: "python",
    complexity: { time: "O(N) per query", space: "O(N)" },
  },

  {
    id: "fin-20260601-b1-dag-execution-paths",
    title: "All Execution Routing Paths in a DAG",
    difficulty: "medium",
    topics: ["graphs", "dfs", "backtracking"],
    problem: `An execution management system (EMS) routes orders through a directed acyclic graph of venues and brokers. Node 0 is the source (client), node N-1 is the final clearing venue. Edges represent permitted routing hops.

Find all possible execution paths from source to destination. Return them sorted lexicographically.

Used to enumerate every valid routing sequence for pre-trade compliance checking.

Input: n=4, edges=[(0,1),(0,2),(1,3),(2,3),(0,3)]
Output: [[0,1,3],[0,2,3],[0,3]]`,
    examples: [
      {
        input: "n=4, edges=[(0,1),(0,2),(1,3),(2,3),(0,3)]",
        output: "[[0,1,3],[0,2,3],[0,3]]",
        explanation:
          "Three paths from node 0 to node 3: via 1, via 2, or direct. Sorted lexicographically.",
      },
      {
        input: "n=2, edges=[(0,1)]",
        output: "[[0,1]]",
        explanation: "Single direct path.",
      },
    ],
    constraints: [
      "2 <= n <= 15",
      "Graph is a DAG (no cycles)",
      "0 <= edges.length <= n*(n-1)/2",
      "Return all paths sorted lexicographically",
    ],
    approach: `DFS backtracking from source (0) to sink (n-1).

Build adjacency list. Maintain a current path.

dfs(node):
  if node == n-1: record path and return
  for each neighbor in adj[node] (sorted for lex order):
    path.append(neighbor)
    dfs(neighbor)
    path.pop()

Since the graph is a DAG, there are no cycles and no need for a visited set (each path is a simple path by construction).

Sort the final list for deterministic output.`,
    code: `def all_execution_paths(n: int, edges: list[tuple[int,int]]) -> list[list[int]]:
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
    for u in range(n):
        adj[u].sort()   # sort neighbours for lex order

    results: list[list[int]] = []

    def dfs(node: int, path: list[int]) -> None:
        if node == n - 1:
            results.append(path[:])
            return
        for nxt in adj[node]:
            path.append(nxt)
            dfs(nxt, path)
            path.pop()

    dfs(0, [0])
    return sorted(results)

# Tests
print(all_execution_paths(4, [(0,1),(0,2),(1,3),(2,3),(0,3)]))
# [[0,1,3],[0,2,3],[0,3]]

print(all_execution_paths(2, [(0,1)]))  # [[0,1]]

# Compliance use case: check if any path violates a restricted hop (e.g., (1,3) not allowed).
def check_restricted_hop(paths: list[list[int]], restricted: tuple[int,int]) -> list[list[int]]:
    u, v = restricted
    return [p for p in paths
            if not any(p[i]==u and p[i+1]==v for i in range(len(p)-1))]

paths = all_execution_paths(4, [(0,1),(0,2),(1,3),(2,3),(0,3)])
compliant = check_restricted_hop(paths, restricted=(1,3))
print("Compliant paths (1→3 blocked):", compliant)  # [[0,2,3],[0,3]]`,
    language: "python",
    complexity: { time: "O(2^N * N) worst case", space: "O(N) recursion stack + O(paths) output" },
  },

  {
    id: "fin-20260601-b1-expected-stopping",
    title: "Expected Rounds Until Portfolio Hits Target — Probability DP",
    difficulty: "medium",
    topics: ["dynamic-programming", "probability", "math"],
    problem: `A portfolio starts at value V = start_val. Each round, independently:
- With probability p: value increases by +1 (up move)
- With probability (1-p): value decreases by 1 (down move)

What is the expected number of rounds to first reach target_val (up) or ruin_val (down), starting from start_val?

This is the classic random walk hitting time problem, solved via linear system or DP.

Input: start=5, target=10, ruin=0, p=0.6
Output: expected rounds ≈ 16.67

Input: start=5, target=10, ruin=0, p=0.5  (fair walk)
Output: expected rounds = 25.0 (absorbing barrier formula: start*(target-start))`,
    examples: [
      {
        input: "start=5, target=10, ruin=0, p=0.6",
        output: "~16.67",
        explanation:
          "Biased walk with edge p=0.6 reaches target faster than a fair walk. Solved by the linear system E[t|v] = 1 + p*E[t|v+1] + (1-p)*E[t|v-1] with boundaries E[t|0]=E[t|10]=0.",
      },
      {
        input: "start=5, target=10, ruin=0, p=0.5",
        output: "25.0",
        explanation:
          "Fair walk: hitting time = start * (target - start) = 5 * 5 = 25.",
      },
    ],
    constraints: [
      "ruin_val < start_val < target_val",
      "0 < p < 1",
      "target - ruin <= 200",
      "Solve to 4 decimal places",
    ],
    approach: `Let E[v] = expected rounds to absorption starting from state v.
Boundary conditions: E[ruin] = 0, E[target] = 0.
Interior: E[v] = 1 + p * E[v+1] + (1-p) * E[v-1]  for ruin < v < target.

Rearranging: p * E[v+1] - E[v] + (1-p) * E[v-1] = -1.
This is a tridiagonal linear system of (target - ruin - 1) equations.

Closed-form for E[v] when p != 0.5:
  Let q = 1-p, rho = q/p.
  Homogeneous solution: A + B * rho^v.
  Particular solution: v/(p-q) = v/(2p-1).
  Apply boundary conditions to find A, B.`,
    code: `import numpy as np

def expected_stopping_time(start: int, target: int, ruin: int, p: float) -> float:
    """
    Solve the linear system for expected hitting time.
    Tridiagonal Thomas algorithm: O(N).
    """
    q  = 1.0 - p
    N  = target - ruin - 1   # interior states
    if N <= 0:
        return 0.0

    # Map state v to index i: v = ruin + 1 + i  (i in 0..N-1)
    # E[i] = 1 + p*E[i+1] + q*E[i-1]
    # E[-1] = E[N] = 0 (boundary)
    # Rearranged: -q*E[i-1] + E[i] - p*E[i+1] = 1

    # Tridiagonal: a[i]*E[i-1] + b[i]*E[i] + c[i]*E[i+1] = d[i]
    a = np.full(N, -q)
    b = np.ones(N)
    c = np.full(N, -p)
    d = np.ones(N)

    # Boundary adjustments (E[-1] = 0, E[N] = 0 already handled by zero RHS).
    # Thomas forward sweep.
    for i in range(1, N):
        m    = a[i] / b[i-1]
        b[i] -= m * c[i-1]
        d[i] -= m * d[i-1]

    E = np.zeros(N)
    E[-1] = d[-1] / b[-1]
    for i in range(N-2, -1, -1):
        E[i] = (d[i] - c[i] * E[i+1]) / b[i]

    idx = start - ruin - 1
    return float(E[idx])

# Tests
print(f"p=0.6, start=5: {expected_stopping_time(5, 10, 0, 0.6):.4f}")   # ~16.67
print(f"p=0.5, start=5: {expected_stopping_time(5, 10, 0, 0.5):.4f}")   # 25.0

# Analytical cross-check for p != 0.5.
def analytic_hitting_time(v: int, t: int, r: int, p: float) -> float:
    q   = 1.0 - p
    rho = q / p
    if abs(p - 0.5) < 1e-10:
        return float((v - r) * (t - v))
    # E[v] = v/(2p-1) + A + B*rho^v
    denom = rho**r - rho**t
    B = (r/(2*p-1) - t/(2*p-1)) / (denom + 1e-15) if abs(denom) > 1e-15 else 0
    A = -r/(2*p-1) - B * rho**r
    return v/(2*p-1) + A + B * rho**v

print(f"Analytic p=0.6: {analytic_hitting_time(5, 10, 0, 0.6):.4f}")    # ~16.67`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },

  {
    id: "fin-20260601-b1-word-break-instruments",
    title: "Instrument Name Tokenization — Word Break DP",
    difficulty: "medium",
    topics: ["dynamic-programming", "strings", "hash-set"],
    problem: `An exchange feed sends instrument identifiers as concatenated strings without separators (e.g., "AAPLMSFTNVDA"). Given a dictionary of valid ticker symbols, determine whether the identifier can be segmented into valid tickers and return all valid segmentations.

Part 1 (decision): Can the string be segmented?
Part 2 (enumeration): Return all valid segmentations.

Input: s = "AAPLMSFT", dictionary = {"AAPL", "MSFT", "MS", "FT"}
Part 1 Output: True
Part 2 Output: ["AAPL MSFT", "AAPL MS FT"]`,
    examples: [
      {
        input: 's="AAPLMSFT", dict={"AAPL","MSFT","MS","FT"}',
        output: 'True; ["AAPL MSFT", "AAPL MS FT"]',
        explanation:
          "AAPL+MSFT is one valid split. AAPL+MS+FT is another. Both use only dictionary words.",
      },
      {
        input: 's="AAPLXYZ", dict={"AAPL","MSFT"}',
        output: "False; []",
        explanation: "XYZ is not in the dictionary.",
      },
    ],
    constraints: [
      "1 <= len(s) <= 300",
      "1 <= len(dictionary) <= 1000",
      "s and all dictionary words consist of uppercase letters",
      "Part 1 in O(N^2), Part 2 may be exponential in worst case",
    ],
    approach: `Part 1 (decision DP):
dp[i] = True if s[:i] can be segmented into dictionary words.
dp[0] = True (empty prefix).
For i in 1..n: for j in 0..i: if dp[j] and s[j:i] in dict_set: dp[i] = True.
Return dp[n].

Part 2 (backtracking with memoisation):
dfs(start) returns all segmentations of s[start:].
Memoize on start index to avoid recomputation.
For each end in start+1..n+1: if s[start:end] in dict: prepend s[start:end] to each result from dfs(end).`,
    code: `def can_segment(s: str, dictionary: set[str]) -> bool:
    n  = len(s)
    dp = [False] * (n + 1)
    dp[0] = True
    max_len = max((len(w) for w in dictionary), default=0)

    for i in range(1, n + 1):
        # Only check substrings up to max_word_length for efficiency.
        for j in range(max(0, i - max_len), i):
            if dp[j] and s[j:i] in dictionary:
                dp[i] = True
                break

    return dp[n]

def all_segmentations(s: str, dictionary: set[str]) -> list[str]:
    """Return all segmentations with memoisation."""
    from functools import lru_cache

    @lru_cache(maxsize=None)
    def dfs(start: int) -> list[str]:
        if start == len(s):
            return [""]
        results = []
        for end in range(start + 1, len(s) + 1):
            word = s[start:end]
            if word in dictionary:
                for rest in dfs(end):
                    results.append(word if rest == "" else word + " " + rest)
        return results

    return dfs(0)

# Tests
d = {"AAPL", "MSFT", "MS", "FT"}
print(can_segment("AAPLMSFT", d))                    # True
print(all_segmentations("AAPLMSFT", d))              # ["AAPL MS FT", "AAPL MSFT"]

d2 = {"AAPL", "MSFT"}
print(can_segment("AAPLXYZ", d2))                    # False
print(all_segmentations("AAPLXYZ", d2))              # []

# Application: validate that a concatenated multi-leg instrument name
# (like "EURUSDGBPUSD") can be parsed into individual FX pairs.
fx_pairs = {"EURUSD", "GBPUSD", "EUR", "USD", "GBP"}
print(all_segmentations("EURUSDGBPUSD", fx_pairs))`,
    language: "python",
    complexity: { time: "O(N^2) for decision, O(2^N) worst case for enumeration", space: "O(N)" },
  },

  {
    id: "fin-20260601-b1-spiral-orderbook",
    title: "Order Book Snapshot Spiral Traversal",
    difficulty: "medium",
    topics: ["arrays", "simulation", "matrix"],
    problem: `An exchange sends order book snapshots as N×M matrices where each cell represents quantity at a price level / time window. The risk system processes these snapshots in a spiral order (outermost ring first, then next inner ring, etc.) to prioritise near-the-money, recent data.

Given an N×M matrix, return the elements in spiral order (clockwise starting from top-left).

Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [1,2,3,6,9,8,7,4,5]

Input: matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
Output: [1,2,3,4,8,12,11,10,9,5,6,7]`,
    examples: [
      {
        input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
        output: "[1,2,3,6,9,8,7,4,5]",
        explanation:
          "Top row left→right: 1,2,3. Right col top→bottom: 6,9. Bottom row right→left: 8,7. Left col bottom→top: 4. Centre: 5.",
      },
      {
        input: "matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]",
        output: "[1,2,3,4,8,12,11,10,9,5,6,7]",
        explanation: "Standard clockwise spiral traversal of a 3×4 grid.",
      },
    ],
    constraints: [
      "m == matrix.length, n == matrix[i].length",
      "1 <= m, n <= 10",
      "−100 <= matrix[i][j] <= 100",
    ],
    approach: `Simulate the spiral using four boundary variables: top, bottom, left, right.

In each outer loop iteration:
1. Traverse top row left→right, then increment top.
2. Traverse right col top→bottom, then decrement right.
3. If top <= bottom: traverse bottom row right→left, then decrement bottom.
4. If left <= right: traverse left col bottom→top, then increment left.
Repeat while top <= bottom and left <= right.`,
    code: `def spiral_orderbook(matrix: list[list[int]]) -> list[int]:
    if not matrix or not matrix[0]:
        return []

    result = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1

    while top <= bottom and left <= right:
        # Top row: left → right
        for col in range(left, right + 1):
            result.append(matrix[top][col])
        top += 1

        # Right column: top → bottom
        for row in range(top, bottom + 1):
            result.append(matrix[row][right])
        right -= 1

        # Bottom row: right → left (only if row remains)
        if top <= bottom:
            for col in range(right, left - 1, -1):
                result.append(matrix[bottom][col])
            bottom -= 1

        # Left column: bottom → top (only if column remains)
        if left <= right:
            for row in range(bottom, top - 1, -1):
                result.append(matrix[row][left])
            left += 1

    return result

# Tests
print(spiral_orderbook([[1,2,3],[4,5,6],[7,8,9]]))        # [1,2,3,6,9,8,7,4,5]
print(spiral_orderbook([[1,2,3,4],[5,6,7,8],[9,10,11,12]])) # [1,2,3,4,8,12,11,10,9,5,6,7]
print(spiral_orderbook([[7]]))                              # [7]

# Application: process bid/ask depth snapshot in order of proximity to mid.
# Inner cells represent near-the-money levels most relevant for risk.
def process_book_snapshot(snapshot: list[list[int]]) -> None:
    spiral = spiral_orderbook(snapshot)
    # Outer ring processed first (widest spread levels).
    # For risk, reverse to process inner (near-mid) levels first:
    near_to_mid = spiral[::-1]
    print("Near-mid quantities:", near_to_mid[:5])`,
    language: "python",
    complexity: { time: "O(M*N)", space: "O(M*N) for output" },
  },
];
