import type { LeetCodeProblem } from "./index";

export const financeProblems20260604B1: LeetCodeProblem[] = [
  {
    id: "fin-20260604-b1-matrix-exp-markov",
    title: "Multi-Period Default Probability via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["matrix-exponentiation", "dynamic-programming", "math", "finance"],
    problem: `A credit rating agency models borrowers using a Markov chain with N credit states (e.g., AAA, AA, ..., CCC, Default). The transition matrix P[i][j] gives the 1-year probability of moving from state i to state j.

Given the transition matrix P, the initial state s, and the number of years n, compute the probability of reaching the Default state (last state) in exactly n years — meaning the borrower has NOT defaulted before year n.

Efficiently compute P^n using matrix exponentiation (repeated squaring).

Input: P = [[0.95,0.05,0.0],[0.0,0.90,0.10],[0.0,0.0,1.0]], s=0, n=3
Output: 0.1426  (probability of being in Default after 3 years, starting from AAA)`,
    examples: [
      {
        input: "P=[[0.95,0.05,0.0],[0.0,0.90,0.10],[0.0,0.0,1.0]], s=0, n=3",
        output: "0.1426",
        explanation: "P^3[0][2]: AAA after 3 years has ~14.26% chance of being in Default. Compute P^3 via squaring: P^2 = P@P, P^3 = P^2@P.",
      },
      {
        input: "P=[[1.0,0.0],[0.0,1.0]], s=0, n=100",
        output: "0.0",
        explanation: "Identity: absorbing state 0 stays in state 0 forever.",
      },
      {
        input: "P=[[0.5,0.5],[0.0,1.0]], s=0, n=1",
        output: "0.5",
        explanation: "Direct: P[0][1]=0.5 after 1 step.",
      },
    ],
    approach:
      "Matrix exponentiation (repeated squaring): P^n in O(N³ log n) by squaring. P^(2k) = (P^k)², P^(2k+1) = P * P^(2k). Start with identity matrix as P^0. The probability of being in state j after n steps starting from state s is (P^n)[s][j]. Time: O(N³ log n), Space: O(N²).",
    code: `import numpy as np

def mat_mul(A: list[list[float]], B: list[list[float]]) -> list[list[float]]:
    n = len(A)
    C = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for k in range(n):
            if A[i][k] == 0.0: continue
            for j in range(n):
                C[i][j] += A[i][k] * B[k][j]
    return C

def mat_pow(P: list[list[float]], n: int) -> list[list[float]]:
    """Matrix exponentiation: P^n via repeated squaring."""
    N = len(P)
    result = [[float(i == j) for j in range(N)] for i in range(N)]  # identity
    base   = [row[:] for row in P]
    while n > 0:
        if n & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        n >>= 1
    return result

def default_probability(P: list[list[float]], s: int, n: int) -> float:
    """P(state = Default = last state after n steps from state s)."""
    Pn = mat_pow(P, n)
    return round(Pn[s][-1], 6)

# 3-state Markov chain: AAA(0), BB(1), Default(2).
P = [[0.95, 0.05, 0.0],
     [0.0,  0.90, 0.10],
     [0.0,  0.0,  1.0 ]]
print(default_probability(P, s=0, n=3))   # ~0.1426
print(default_probability(P, s=1, n=5))   # ~0.4095
print(default_probability(P, s=0, n=10))  # much higher`,
    language: "python",
    complexity: { time: "O(N³ log n)", space: "O(N²)" },
  },
  {
    id: "fin-20260604-b1-merge-scenario-windows",
    title: "Merge Overlapping Stress Scenario Windows",
    difficulty: "medium",
    topics: ["sorting", "intervals", "greedy", "finance"],
    problem: `A risk team has a list of historical stress periods, each defined by a start and end date (as integer day offsets from epoch). Stress windows from different risk factors may overlap or be adjacent.

Merge all overlapping or adjacent stress windows into the minimum number of non-overlapping intervals. Return the merged intervals sorted by start date.

This is the classic merge-intervals problem applied to risk calendar management — identifying the total number of distinct stressed trading days.

Input: windows = [[1,4],[2,6],[8,10],[9,12]]
Output: [[1,6],[8,12]]

Input: windows = [[1,3],[3,5],[6,8],[8,9]]
Output: [[1,5],[6,9]]  (adjacent endpoints are merged)`,
    examples: [
      {
        input: "windows = [[1,4],[2,6],[8,10],[9,12]]",
        output: "[[1,6],[8,12]]",
        explanation: "[1,4] and [2,6] overlap (2<=4), merge to [1,6]. [8,10] and [9,12] overlap, merge to [8,12].",
      },
      {
        input: "windows = [[1,3],[3,5],[6,8],[8,9]]",
        output: "[[1,5],[6,9]]",
        explanation: "Adjacent intervals (3==3 and 8==8) are merged: [1,3]+[3,5]=[1,5]; [6,8]+[8,9]=[6,9].",
      },
      {
        input: "windows = [[5,7],[1,2],[3,3]]",
        output: "[[1,2],[3,3],[5,7]]",
        explanation: "No overlaps after sorting: three distinct periods.",
      },
    ],
    approach:
      "Sort intervals by start date. Initialize result with the first interval. For each subsequent interval: if it overlaps or is adjacent to the last result interval (start <= result_end), extend result_end = max(result_end, end). Otherwise append a new interval. O(n log n) for sort, O(n) for merge.",
    code: `def merge_stress_windows(windows: list[list[int]]) -> list[list[int]]:
    if not windows:
        return []
    # Sort by start date.
    windows = sorted(windows, key=lambda w: w[0])
    merged  = [windows[0][:]]

    for start, end in windows[1:]:
        if start <= merged[-1][1]:          # overlaps or adjacent
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])

    return merged

print(merge_stress_windows([[1,4],[2,6],[8,10],[9,12]]))  # [[1,6],[8,12]]
print(merge_stress_windows([[1,3],[3,5],[6,8],[8,9]]))    # [[1,5],[6,9]]
print(merge_stress_windows([[5,7],[1,2],[3,3]]))          # [[1,2],[3,3],[5,7]]

# Count total stressed trading days (assuming 1 unit = 1 day).
def stressed_days(windows: list[list[int]]) -> int:
    merged = merge_stress_windows(windows)
    return sum(end - start + 1 for start, end in merged)

print(stressed_days([[1,4],[2,6],[8,10],[9,12]]))  # 6 + 5 = 11 days`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260604-b1-stock-span",
    title: "Stock Span — Days Since Last Higher or Equal Price",
    difficulty: "medium",
    topics: ["monotonic-stack", "stack", "array", "finance"],
    problem: `Given a list of daily closing prices, compute the span of each day: the number of consecutive days (including today) looking backward for which the price was less than or equal to today's price.

The span is used in technical analysis to identify momentum and breakout signals — a span of 10 means the stock is trading at a 10-day high.

Input:  prices = [100, 80, 60, 70, 60, 75, 85]
Output: spans  = [1,   1,  1,  2,  1,  4,  6]
(Day 6: price=85 >= [75,60,70,60,80] for 5 prior days but not 100)

Wait: Day 5 (75): 75>=60 (1), 75>=60 (2), 75>=70 (3), 75>=80? No. So span=4 (today+3).
Day 6 (85): 85>=75 (1), 85>=60 (2), 85>=70 (3), 85>=60 (4), 85>=80 (5), 85>=100? No. Span=6.`,
    examples: [
      {
        input: "prices = [100, 80, 60, 70, 60, 75, 85]",
        output: "[1, 1, 1, 2, 1, 4, 6]",
        explanation: "Use a decreasing monotonic stack of (price, index). For each day, pop all entries with price <= current. Span = current_index - index_of_last_higher + 1 (or current_index+1 if stack empty).",
      },
      {
        input: "prices = [10, 20, 30, 40, 50]",
        output: "[1, 2, 3, 4, 5]",
        explanation: "Each day breaks the previous high: span grows by 1 each day.",
      },
      {
        input: "prices = [50, 40, 30, 20, 10]",
        output: "[1, 1, 1, 1, 1]",
        explanation: "Falling prices: each day is below the previous, span=1 always.",
      },
    ],
    approach:
      "Maintain a monotonic decreasing stack of (price, index) pairs. For each day i: pop elements from the stack while stack top price <= prices[i]. Span = i - stack_top_index (or i+1 if empty). Push (prices[i], i). Amortised O(1) per day, O(n) total.",
    code: `def stock_span(prices: list[float]) -> list[int]:
    """Compute span[i] = # consecutive days up to i where price <= prices[i]."""
    stack  = []   # decreasing stack of (price, index)
    spans  = []

    for i, p in enumerate(prices):
        # Pop all entries with price <= current price.
        while stack and stack[-1][0] <= p:
            stack.pop()

        # Span: distance to last strictly higher price (or start of array).
        span = i + 1 if not stack else i - stack[-1][1]
        spans.append(span)
        stack.append((p, i))

    return spans

print(stock_span([100, 80, 60, 70, 60, 75, 85]))  # [1, 1, 1, 2, 1, 4, 6]
print(stock_span([10, 20, 30, 40, 50]))            # [1, 2, 3, 4, 5]
print(stock_span([50, 40, 30, 20, 10]))            # [1, 1, 1, 1, 1]

# Online version: process one price at a time (real-time feed).
class StockSpanOnline:
    def __init__(self):
        self.stack = []   # (price, span)
    def next(self, price: float) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]
        self.stack.append((price, span))
        return span`,
    language: "python",
    complexity: { time: "O(n) amortised", space: "O(n)" },
  },
  {
    id: "fin-20260604-b1-rate-limiter-design",
    title: "Design a Sliding Window Rate Limiter for Order Submission",
    difficulty: "medium",
    topics: ["design", "sliding-window", "queue", "finance"],
    problem: `Design a RateLimiter class for an order management system that enforces a per-session rate limit of at most K orders in any sliding window of W seconds.

Implement:
- RateLimiter(K, W): constructor with max K orders per W-second window
- allow_order(timestamp): returns True if the order is permitted at this timestamp (integer seconds), False if it would exceed the limit. Timestamps arrive in non-decreasing order.

The sliding window must be exact (not approximate like a fixed-window counter).

Input: K=3, W=10. Calls: allow(1), allow(2), allow(3), allow(5), allow(15)
Output: True, True, True, False, True
(At t=5, 3 orders in [1..10] already; t=15 window [6..15] has 0 prior orders)`,
    examples: [
      {
        input: "K=3, W=10. allow(1), allow(2), allow(3), allow(5), allow(15)",
        output: "True, True, True, False, True",
        explanation: "Window at t=5: orders at t=1,2,3 all fall in [5-10+1=0..5]. That's 3 — capacity reached. Reject. At t=15, window [6..15] contains no prior orders.",
      },
      {
        input: "K=2, W=5. allow(1), allow(3), allow(4), allow(6)",
        output: "True, True, False, True",
        explanation: "At t=4: window [0..4] has orders at 1,3 — full. At t=6: window [2..6], only t=3 is in it. Allowed.",
      },
    ],
    approach:
      "Use a deque of accepted timestamps. On each allow(t): evict timestamps older than t - W + 1 from the front. If len(deque) < K, append t and return True; else return False. Amortised O(1) per call — each timestamp is pushed and popped at most once.",
    code: `from collections import deque

class RateLimiter:
    """Sliding window rate limiter: at most K orders in any W-second window."""

    def __init__(self, K: int, W: int):
        self.K    = K
        self.W    = W
        self.dq   = deque()   # timestamps of accepted orders

    def allow_order(self, timestamp: int) -> bool:
        # Evict orders outside the sliding window [timestamp - W + 1, timestamp].
        cutoff = timestamp - self.W + 1
        while self.dq and self.dq[0] < cutoff:
            self.dq.popleft()

        if len(self.dq) < self.K:
            self.dq.append(timestamp)
            return True
        return False

# Example 1.
rl = RateLimiter(K=3, W=10)
for t in [1, 2, 3, 5, 15]:
    print(f"allow({t:2d}): {rl.allow_order(t)}")
# True True True False True

# Example 2.
rl2 = RateLimiter(K=2, W=5)
for t in [1, 3, 4, 6]:
    print(f"allow({t:2d}): {rl2.allow_order(t)}")
# True True False True`,
    language: "python",
    complexity: { time: "O(1) amortised per call", space: "O(K)" },
  },
  {
    id: "fin-20260604-b1-two-ptr-hedges",
    title: "Two Pointers: Find Hedge Pair with Target Net DV01",
    difficulty: "medium",
    topics: ["two-pointers", "binary-search", "sorting", "finance"],
    problem: `A bond trader has a list of available bond positions with their DV01 values (dollar value of a 1bp yield move). Some DV01s are positive (long bonds, lose value when rates rise) and some are negative (short bonds).

Find all pairs (i, j) where i < j such that dv01[i] + dv01[j] == target_net_dv01. Return the count and one such pair (if any).

This is the Two Sum variant: find pairs whose DV01s sum to a target hedge ratio.

Input: dv01 = [-500, -300, 200, 400, 600, 800], target = 100
Output: count=1, pair=(-500, 600) since -500+600=100

Input: dv01 = [100, 200, 300, 400], target = 500
Output: count=2, pairs=(100,400) and (200,300)`,
    examples: [
      {
        input: "dv01 = [-500, -300, 200, 400, 600, 800], target = 100",
        output: "count=1, pair=(-500, 600)",
        explanation: "Sort: [-500,-300,200,400,600,800]. Two pointers: lo=0, hi=5. Sum=-500+800=300>100, hi--. Sum=-500+600=100 ✓.",
      },
      {
        input: "dv01 = [100, 200, 300, 400], target = 500",
        output: "count=2: (-500,1000)... in this case (100,400) and (200,300)",
        explanation: "Both (100,400) and (200,300) sum to 500.",
      },
      {
        input: "dv01 = [1, 1, 1], target = 2",
        output: "count=3",
        explanation: "Three pairs of duplicates: (0,1),(0,2),(1,2). Handle duplicates carefully.",
      },
    ],
    approach:
      "Sort the array. Use two pointers lo=0, hi=n-1. If arr[lo]+arr[hi]==target: count the pair, skip duplicates, advance both. If < target: lo++. If > target: hi--. O(n log n) for sort, O(n) for scan.",
    code: `def find_hedge_pairs(dv01: list[int], target: int) -> tuple[int, list[tuple]]:
    arr = sorted(enumerate(dv01), key=lambda x: x[1])
    vals = [v for _, v in arr]
    n   = len(vals)
    lo, hi = 0, n - 1
    count  = 0
    pairs  = []

    while lo < hi:
        s = vals[lo] + vals[hi]
        if s == target:
            # Count all pairs at this (lo, hi) level, handle duplicates.
            if vals[lo] == vals[hi]:
                m = hi - lo + 1
                count += m * (m - 1) // 2
                pairs.append((vals[lo], vals[hi]))
                break
            else:
                # Count duplicates on each side.
                cnt_lo = 1
                while lo + cnt_lo < hi and vals[lo + cnt_lo] == vals[lo]:
                    cnt_lo += 1
                cnt_hi = 1
                while hi - cnt_hi > lo and vals[hi - cnt_hi] == vals[hi]:
                    cnt_hi += 1
                count += cnt_lo * cnt_hi
                pairs.append((vals[lo], vals[hi]))
                lo += cnt_lo
                hi -= cnt_hi
        elif s < target:
            lo += 1
        else:
            hi -= 1

    return count, pairs

print(find_hedge_pairs([-500, -300, 200, 400, 600, 800], 100))
# (1, [(-500, 600)])
print(find_hedge_pairs([100, 200, 300, 400], 500))
# (2, [(100, 400), (200, 300)])
print(find_hedge_pairs([1, 1, 1], 2))
# (3, [(1, 1)])`,
    language: "python",
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "fin-20260604-b1-trie-symbol",
    title: "Trie-Based Instrument Symbol Autocomplete",
    difficulty: "medium",
    topics: ["trie", "design", "string", "finance"],
    problem: `Design a SymbolTrie class for an order management system that supports fast instrument symbol lookup and autocomplete. Trading desks need to resolve partial ticker inputs (e.g., "APP" -> ["AAPL", "APPS"]).

Implement:
- insert(symbol, instrument_id): add a symbol to the trie
- search(symbol): return True if exact symbol exists
- starts_with(prefix): return all symbols with this prefix, sorted lexicographically
- autocomplete(prefix, k): return the top k symbols by instrument_id (lower = higher priority)

Input: insert("AAPL", 1), insert("APPS", 5), insert("AMZN", 2), insert("GOOGL", 3)
starts_with("A") -> ["AAPL", "AMZN", "APPS"]
autocomplete("A", 2) -> ["AAPL", "AMZN"]`,
    examples: [
      {
        input: 'insert("AAPL",1),insert("APPS",5),insert("AMZN",2). starts_with("A")',
        output: '["AAPL", "AMZN", "APPS"]',
        explanation: "DFS from the 'A' node collects all terminals under it, sorted lexicographically.",
      },
      {
        input: 'autocomplete("A", 2)',
        output: '["AAPL", "AMZN"]',
        explanation: "AAPL (id=1) and AMZN (id=2) have the two lowest instrument IDs under prefix A.",
      },
    ],
    approach:
      "Each trie node stores a dict of children and an optional (symbol, instrument_id) at terminal nodes. insert: walk/create nodes for each char. search: walk; check terminal. starts_with: walk to prefix node, DFS collect all terminals. autocomplete: collect all, sort by id, return top k. Insert O(L), search O(L), autocomplete O(M log M) where M=matches.",
    code: `class TrieNode:
    def __init__(self):
        self.children: dict[str, 'TrieNode'] = {}
        self.symbol: str | None = None
        self.inst_id: int = 0

class SymbolTrie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, symbol: str, instrument_id: int) -> None:
        node = self.root
        for ch in symbol:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.symbol   = symbol
        node.inst_id  = instrument_id

    def _walk(self, prefix: str) -> TrieNode | None:
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node

    def search(self, symbol: str) -> bool:
        node = self._walk(symbol)
        return node is not None and node.symbol == symbol

    def starts_with(self, prefix: str) -> list[str]:
        node = self._walk(prefix)
        if node is None:
            return []
        result: list[str] = []
        stack = [node]
        while stack:
            n = stack.pop()
            if n.symbol:
                result.append(n.symbol)
            for ch in sorted(n.children.keys(), reverse=True):
                stack.append(n.children[ch])
        return sorted(result)

    def autocomplete(self, prefix: str, k: int) -> list[str]:
        matches = self.starts_with(prefix)
        inst_map = {}
        node = self._walk(prefix)
        stack = [node] if node else []
        visited: list[tuple[int, str]] = []
        while stack:
            n = stack.pop()
            if n and n.symbol:
                visited.append((n.inst_id, n.symbol))
            if n:
                for child in n.children.values():
                    stack.append(child)
        visited.sort()
        return [sym for _, sym in visited[:k]]

trie = SymbolTrie()
for sym, iid in [("AAPL",1),("APPS",5),("AMZN",2),("GOOGL",3),("GOOG",4)]:
    trie.insert(sym, iid)
print(trie.starts_with("A"))         # ['AAPL', 'AMZN', 'APPS']
print(trie.autocomplete("A", 2))     # ['AAPL', 'AMZN']
print(trie.search("AAPL"))           # True
print(trie.search("AAP"))            # False`,
    language: "python",
    complexity: { time: "O(L) insert/search, O(M log M) autocomplete", space: "O(total chars)" },
  },
  {
    id: "fin-20260604-b1-connected-portfolios",
    title: "Count Correlated Asset Clusters (Number of Connected Components)",
    difficulty: "medium",
    topics: ["graphs", "union-find", "dfs", "finance"],
    problem: `Given N assets and a correlation matrix, two assets are considered 'correlated' if their Pearson correlation exceeds a threshold tau. Assets form clusters (connected components) in this correlation graph.

Count the number of clusters and identify which assets belong to each cluster.

This analysis appears in portfolio construction: assets within the same cluster tend to move together and provide limited diversification benefit relative to each other.

Input: N=5, correlations = [[1.0,0.9,0.1,0.1,0.2],[0.9,1.0,0.1,0.05,0.1],[0.1,0.1,1.0,0.85,0.1],[0.1,0.05,0.85,1.0,0.15],[0.2,0.1,0.1,0.15,1.0]], tau=0.5
Output: 3 clusters: {0,1}, {2,3}, {4}`,
    examples: [
      {
        input: "N=5, corr[0][1]=0.9, corr[2][3]=0.85, others<0.5, tau=0.5",
        output: "3 clusters: [0,1], [2,3], [4]",
        explanation: "Assets 0-1 are highly correlated (>0.5) -> same cluster. Assets 2-3 similarly. Asset 4 is isolated.",
      },
      {
        input: "N=3, all pairs corr>0.5",
        output: "1 cluster: [0,1,2]",
        explanation: "All assets correlated: one connected component.",
      },
    ],
    approach:
      "Union-Find (DSU): iterate all pairs (i,j) with i<j, if corr[i][j]>tau then union(i,j). Count distinct roots. Alternatively, DFS/BFS from each unvisited node. Union-Find: O(N² * alpha(N)), DFS: O(N²).",
    code: `def correlation_clusters(corr: list[list[float]],
                           tau: float) -> list[list[int]]:
    """Find connected components in the correlation graph with threshold tau."""
    N = len(corr)

    # Union-Find with path compression and union by rank.
    parent = list(range(N))
    rank   = [0] * N

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path halving
            x = parent[x]
        return x

    def union(x: int, y: int) -> None:
        rx, ry = find(x), find(y)
        if rx == ry: return
        if rank[rx] < rank[ry]: rx, ry = ry, rx
        parent[ry] = rx
        if rank[rx] == rank[ry]: rank[rx] += 1

    for i in range(N):
        for j in range(i + 1, N):
            if corr[i][j] > tau:
                union(i, j)

    # Collect clusters.
    clusters: dict[int, list[int]] = {}
    for i in range(N):
        root = find(i)
        clusters.setdefault(root, []).append(i)

    return sorted(clusters.values(), key=lambda c: c[0])

# Example.
corr = [[1.0, 0.9, 0.1, 0.1, 0.2],
        [0.9, 1.0, 0.1, 0.05,0.1],
        [0.1, 0.1, 1.0, 0.85,0.1],
        [0.1, 0.05,0.85,1.0, 0.15],
        [0.2, 0.1, 0.1, 0.15,1.0]]
clusters = correlation_clusters(corr, tau=0.5)
print(f"{len(clusters)} clusters: {clusters}")
# 3 clusters: [[0, 1], [2, 3], [4]]

# Diversification measure: Herfindahl index of cluster sizes.
n = sum(len(c) for c in clusters)
hhi = sum((len(c)/n)**2 for c in clusters)
print(f"HHI (diversification): {hhi:.4f}  (1=one cluster, 1/N=fully diverse)")`,
    language: "python",
    complexity: { time: "O(N² α(N))", space: "O(N)" },
  },
  {
    id: "fin-20260604-b1-bit-position-exposure",
    title: "Bit Manipulation: Net Position Exposure from Trade Flags",
    difficulty: "easy",
    topics: ["bit-manipulation", "math", "finance"],
    problem: `A high-frequency trading system encodes trade directions as bit flags in a 32-bit integer. Each bit position i corresponds to trade i: bit=1 means BUY, bit=0 means SELL.

Given an integer trades (bit-encoded trades) and an integer n (number of trades to consider from LSB), compute:
1. net_buys: count of 1-bits (buys) in the first n bits
2. net_sells: count of 0-bits (sells) in the first n bits
3. is_net_long: True if more buys than sells
4. flip_all: flip all n trade directions (buys become sells and vice versa) — return the new integer

Input: trades=0b10110, n=5 → bits = [0,1,1,0,1] (LSB first)
Output: net_buys=3, net_sells=2, is_net_long=True, flip=0b01001=9`,
    examples: [
      {
        input: "trades=0b10110 (=22), n=5",
        output: "net_buys=3, net_sells=2, is_net_long=True, flip=9",
        explanation: "Bits 0..4: 0,1,1,0,1 -> 3 ones (buys). Flip: 1,0,0,1,0 = 0b01001 = 9.",
      },
      {
        input: "trades=0, n=4",
        output: "net_buys=0, net_sells=4, is_net_long=False, flip=15",
        explanation: "All zeros: all sells. Flip makes all ones = 15 = 0b1111.",
      },
      {
        input: "trades=0xFF, n=8",
        output: "net_buys=8, net_sells=0, is_net_long=True, flip=0",
        explanation: "All 8 bits set = all buys. Flip = 0.",
      },
    ],
    approach:
      "Mask to n bits: mask = (1<<n)-1. net_buys = bin(trades & mask).count('1') or use bit_count(). net_sells = n - net_buys. flip = (~trades) & mask (bitwise NOT then mask). All O(1).",
    code: `def analyze_trades(trades: int, n: int) -> dict:
    """Analyze bit-encoded trade directions (1=buy, 0=sell) in first n positions."""
    mask      = (1 << n) - 1          # n-bit mask: 0b111...1
    masked    = trades & mask

    net_buys  = bin(masked).count('1')  # or: masked.bit_count() in Python 3.10+
    net_sells = n - net_buys
    flipped   = (~masked) & mask        # flip all n bits

    return {
        'net_buys':    net_buys,
        'net_sells':   net_sells,
        'is_net_long': net_buys > net_sells,
        'flip':        flipped,
        'flip_bin':    bin(flipped),
    }

print(analyze_trades(0b10110, 5))
# {'net_buys': 3, 'net_sells': 2, 'is_net_long': True, 'flip': 9, ...}
print(analyze_trades(0, 4))
# {'net_buys': 0, 'net_sells': 4, 'is_net_long': False, 'flip': 15, ...}
print(analyze_trades(0xFF, 8))
# {'net_buys': 8, 'net_sells': 0, 'is_net_long': True, 'flip': 0, ...}

# Extension: find first SELL trade (first 0-bit in n positions).
def first_sell(trades: int, n: int) -> int:
    """Index of the least-significant 0-bit in positions 0..n-1. -1 if all buys."""
    mask = (1 << n) - 1
    inv  = (~trades) & mask   # flip: 0-bits become 1s
    if inv == 0: return -1
    return (inv & -inv).bit_length() - 1   # index of lowest set bit

print(first_sell(0b10110, 5))   # 0 (bit 0 = 0 = first sell)
print(first_sell(0b11111, 5))   # -1 (all buys)`,
    language: "python",
    complexity: { time: "O(1)", space: "O(1)" },
  },
  {
    id: "fin-20260604-b1-jump-rebalance",
    title: "Minimum Rebalance Intervals (Jump Game Variant)",
    difficulty: "medium",
    topics: ["greedy", "dynamic-programming", "array", "finance"],
    problem: `A portfolio manager must rebalance a portfolio of N assets. The portfolio is currently at state 0 (all positions at starting weights). After each rebalancing event, they can 'jump' forward by at most jumps[i] assets to process — the maximum number of assets they can rebalance in one session.

Given an array jumps where jumps[i] is the maximum number of additional assets you can rebalance starting from asset i, find the minimum number of rebalancing sessions to process all N assets (reach index N-1).

This is LeetCode 45 (Jump Game II) in a portfolio-management framing.

Input: jumps = [2, 3, 1, 1, 4]
Output: 2  (session 1: jump to index 1 or 2; session 2: jump to end)

Input: jumps = [2, 3, 0, 1, 4]
Output: 2`,
    examples: [
      {
        input: "jumps = [2, 3, 1, 1, 4]",
        output: "2",
        explanation: "Session 1: from 0, can reach up to index 2. Best: go to index 1 (jump=3, farthest reach). Session 2: from index 1 jump 3 to index 4 (end). Total: 2 sessions.",
      },
      {
        input: "jumps = [1, 1, 1, 1]",
        output: "3",
        explanation: "Each step advances by exactly 1: 3 sessions to go from 0 to index 3.",
      },
      {
        input: "jumps = [5, 0, 0, 0, 0]",
        output: "1",
        explanation: "From index 0 can jump 5, reaching index 4 directly in 1 session.",
      },
    ],
    approach:
      "Greedy: track current session end and farthest reachable index. When you reach current end, start a new session. Advance current end to farthest. Stop when farthest >= n-1. O(n) time, O(1) space.",
    code: `def min_rebalance_sessions(jumps: list[int]) -> int:
    """Minimum number of jump sessions to rebalance all n assets."""
    n = len(jumps)
    if n <= 1:
        return 0

    sessions    = 0
    cur_end     = 0   # farthest index reachable in current session
    farthest    = 0   # farthest index reachable overall so far

    for i in range(n - 1):
        farthest = max(farthest, i + jumps[i])
        if i == cur_end:          # exhausted current session's range
            sessions += 1
            cur_end  = farthest
            if cur_end >= n - 1:  # can already reach the end
                break

    return sessions

print(min_rebalance_sessions([2, 3, 1, 1, 4]))   # 2
print(min_rebalance_sessions([2, 3, 0, 1, 4]))   # 2
print(min_rebalance_sessions([1, 1, 1, 1]))       # 3
print(min_rebalance_sessions([5, 0, 0, 0, 0]))    # 1

# DP version: O(n^2) for comparison — confirms greedy.
def min_sessions_dp(jumps: list[int]) -> int:
    n  = len(jumps)
    dp = [float('inf')] * n
    dp[0] = 0
    for i in range(n):
        for j in range(1, jumps[i] + 1):
            if i + j < n:
                dp[i + j] = min(dp[i + j], dp[i] + 1)
    return dp[-1]`,
    language: "python",
    complexity: { time: "O(n) greedy, O(n²) DP", space: "O(1) greedy, O(n) DP" },
  },
  {
    id: "fin-20260604-b1-spiral-risk-grid",
    title: "Spiral Traversal of a Risk Scenario Grid",
    difficulty: "medium",
    topics: ["matrix", "simulation", "finance"],
    problem: `A risk engine stores a 2D grid of scenario P&L values where rows represent market scenarios (e.g., equity down 5%, 10%, 15%) and columns represent vol scenarios (vol up 10%, 20%, 30%).

The risk manager wants to read the P&L scenarios in spiral order (clockwise from top-left) to report them from the most central (least stressed) to the most extreme scenarios.

Given an M x N matrix of P&L values, return all values in clockwise spiral order.

Input: grid = [[1,2,3],[4,5,6],[7,8,9]]
Output: [1,2,3,6,9,8,7,4,5]`,
    examples: [
      {
        input: "grid = [[1,2,3],[4,5,6],[7,8,9]]",
        output: "[1,2,3,6,9,8,7,4,5]",
        explanation: "Top row L->R: 1,2,3. Right col top->bottom: 6,9. Bottom row R->L: 8,7. Left col bottom->top: 4. Center: 5.",
      },
      {
        input: "grid = [[-5,-10],[-15,-20],[2,8]]",
        output: "[-5,-10,-20,8,2,-15]",
        explanation: "Top row: -5,-10. Right col: -20,8. Bottom row R->L: 2. Left col: -15.",
      },
      {
        input: "grid = [[1,2,3,4]]",
        output: "[1,2,3,4]",
        explanation: "Single row: just read left to right.",
      },
    ],
    approach:
      "Four boundary pointers: top, bottom, left, right. Iterate: traverse top row L->R (top++), right col T->B (right--), bottom row R->L if top<=bottom (bottom--), left col B->T if left<=right (left++). Repeat until boundaries cross. O(M*N).",
    code: `def spiral_risk_grid(grid: list[list[float]]) -> list[float]:
    """Read all P&L scenario values in clockwise spiral order."""
    if not grid or not grid[0]:
        return []

    top, bottom = 0, len(grid) - 1
    left, right = 0, len(grid[0]) - 1
    result = []

    while top <= bottom and left <= right:
        # Traverse top row left to right.
        for col in range(left, right + 1):
            result.append(grid[top][col])
        top += 1

        # Traverse right column top to bottom.
        for row in range(top, bottom + 1):
            result.append(grid[row][right])
        right -= 1

        # Traverse bottom row right to left (if still has rows).
        if top <= bottom:
            for col in range(right, left - 1, -1):
                result.append(grid[bottom][col])
            bottom -= 1

        # Traverse left column bottom to top (if still has cols).
        if left <= right:
            for row in range(bottom, top - 1, -1):
                result.append(grid[row][left])
            left += 1

    return result

print(spiral_risk_grid([[1,2,3],[4,5,6],[7,8,9]]))
# [1, 2, 3, 6, 9, 8, 7, 4, 5]
print(spiral_risk_grid([[-5,-10],[-15,-20],[2,8]]))
# [-5, -10, -20, 8, 2, -15]
print(spiral_risk_grid([[1,2,3,4]]))
# [1, 2, 3, 4]

# Identify the most stressed scenario (extreme corner).
grid = [[-100,-200,-300],
        [ -50,-100,-150],
        [  10,  20,  30]]
order = spiral_risk_grid(grid)
print(f"Most stressed P&L: {min(order)}")   # -300 (last in spiral = most extreme corner)`,
    language: "python",
    complexity: { time: "O(M×N)", space: "O(M×N)" },
  },
];
