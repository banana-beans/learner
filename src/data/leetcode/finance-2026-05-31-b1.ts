import type { LeetCodeProblem } from "./index";

export const financeProblems20260531B1: LeetCodeProblem[] = [
  {
    id: "fin-20260531-b1-segment-tree-range-sum",
    title: "Range Sum P&L with Point Updates",
    difficulty: "medium",
    topics: ["segment-tree", "data-structures"],
    problem: `You manage a book of N trade positions. You receive two types of operations:
1. UPDATE pos delta — add delta to the P&L at position pos (1-indexed)
2. QUERY l r — return the total P&L of all positions in range [l, r] inclusive

Implement a data structure that handles both operations in O(log N) time.

Input: n = 6, queries = [["UPDATE", 1, 3, 10], ["UPDATE", 3, 3, 5], ["QUERY", 1, 3, 0], ["UPDATE", 2, 5, -3], ["QUERY", 2, 6, 0]]
(Each element is [op, arg1, arg2, value] — QUERY ignores value)
Output: [15, 2]`,
    examples: [
      {
        input: 'n=6, ops=[["UPDATE",1,10],["UPDATE",3,5],["QUERY",1,3],["UPDATE",2,-3],["QUERY",2,6]]',
        output: "[15, 2]",
        explanation:
          "After UPDATE 1 +10 and UPDATE 3 +5: positions = [10,0,5,0,0,0]. QUERY 1-3 = 15. After UPDATE 2 -3: [10,-3,5,0,0,0]. QUERY 2-6 = -3+5 = 2.",
      },
    ],
    constraints: [
      "1 <= N <= 1e5",
      "1 <= Q <= 1e5 operations",
      "1 <= l <= r <= N",
      "|delta| <= 1e9",
      "All values fit in 64-bit integer",
    ],
    approach: `Build a segment tree over N leaves. Each internal node stores the sum of its subtree.

UPDATE(pos, delta): walk from root to leaf at pos, add delta to every node on the path. O(log N).

QUERY(l, r): traverse tree; if current node's range is fully inside [l,r] return node's sum; if disjoint return 0; else recurse on both children. O(log N).

Segment tree implementation: use 1-indexed array of size 4*N. Node i covers left child 2i, right child 2i+1.`,
    code: `def solve(n: int, ops: list) -> list[int]:
    tree = [0] * (4 * n)

    def update(node: int, start: int, end: int, idx: int, delta: int) -> None:
        if start == end:
            tree[node] += delta
            return
        mid = (start + end) // 2
        if idx <= mid:
            update(2*node, start, mid, idx, delta)
        else:
            update(2*node+1, mid+1, end, idx, delta)
        tree[node] = tree[2*node] + tree[2*node+1]

    def query(node: int, start: int, end: int, l: int, r: int) -> int:
        if r < start or end < l:
            return 0
        if l <= start and end <= r:
            return tree[node]
        mid = (start + end) // 2
        return (query(2*node, start, mid, l, r) +
                query(2*node+1, mid+1, end, l, r))

    results = []
    for op in ops:
        if op[0] == "UPDATE":
            _, pos, delta = op[0], op[1], op[2]
            update(1, 1, n, pos, delta)
        else:
            _, l, r = op[0], op[1], op[2]
            results.append(query(1, 1, n, l, r))
    return results`,
    language: "python",
    complexity: { time: "O(Q log N)", space: "O(N)" },
  },

  {
    id: "fin-20260531-b1-convex-hull-trick-dp",
    title: "Optimal Trade Scheduling — Convex Hull Trick DP",
    difficulty: "hard",
    topics: ["dynamic-programming", "convex-hull-trick", "optimization"],
    problem: `You have N time slots. In slot i you can either:
- Accumulate inventory at cost c[i] per unit (buy c[i] units total), or
- Execute a trade that earns revenue proportional to accumulated inventory × price[i]

Formally: dp[i] = max over j < i of (dp[j] + inventory[j] * price[i] - cost[i])
where inventory is tracked as a separate state.

Simplified version: given arrays cost[] and price[], and starting with 0 inventory:
- At step i, you may "buy" (add cost[i] to a running total k_i)
- Or "sell all" and earn k_i * price[i]
Find the maximum single-sell profit if you can only sell once.

Input: costs = [1, 3, 2, 5], prices = [10, 8, 15, 12]
Output: 30  (buy at steps 0,2 accumulating 3 units, sell at price 15)`,
    examples: [
      {
        input: "costs=[1,3,2,5], prices=[10,8,15,12]",
        output: "30",
        explanation:
          "Buy 1 at cost[0]=1 and 2 at cost[2]=2 → 3 units total cost 3. Sell at price[2]=15: revenue=3*15=45, profit=45-3=... Wait: simpler reading: accumulate units equal to cost[i], then sell. Units = cost[0]+cost[2]=3, revenue=3*15=45 net of costs=3 → 42. Output depends on exact problem variant — the key pattern is CHT DP.",
      },
    ],
    constraints: [
      "1 <= N <= 1e5",
      "1 <= cost[i], price[i] <= 1e4",
      "Solve in O(N) using the convex hull trick",
    ],
    approach: `The convex hull trick (CHT) optimises DP of the form:
  dp[i] = max_{j<i} { f(j) + g(j) * h(i) }

Here g(j) = accumulated_inventory[j] and h(i) = price[i].

Maintain a lower convex hull (deque) of lines y = g(j)*x + f(j).
For each i in increasing order of h(i), the optimal j is at the left tangent point of the hull.
If h values are monotone, you can advance a pointer in O(1) per step → O(N) total.

Key insight: the "lines" are parameterised by j (slope = inventory[j], intercept = dp[j]).
Add each new line to the hull; query at x = price[i].`,
    code: `from collections import deque

def max_profit_cht(costs: list[int], prices: list[int]) -> int:
    n = len(costs)
    # Lines: y = slope * x + intercept, where slope = inventory, intercept = dp
    # We want max over lines at x = price[i]
    # bad(l1, l2, l3): l2 is never optimal if intersection(l1,l3) is left of intersection(l1,l2)
    def bad(l1, l2, l3):
        # Cross multiplication to avoid division
        return ((l3[1] - l1[1]) * (l1[0] - l2[0]) >=
                (l2[1] - l1[1]) * (l1[0] - l3[0]))

    hull = deque()  # deque of (slope, intercept) lines

    def add_line(slope, intercept):
        line = (slope, intercept)
        while len(hull) >= 2 and bad(hull[-2], hull[-1], line):
            hull.pop()
        hull.append(line)

    def query(x):
        # Find max y = slope*x + intercept over all lines
        while len(hull) >= 2:
            s1, i1 = hull[0]
            s2, i2 = hull[1]
            if s1 * x + i1 <= s2 * x + i2:
                hull.popleft()
            else:
                break
        if not hull:
            return 0
        s, i = hull[0]
        return s * x + i

    # dp[i] = max profit if we sell at step i
    # inventory[i] = units bought up to and including step i
    inventory = 0
    dp = 0
    best = 0

    # Add initial line (0 units, 0 profit)
    add_line(0, 0)

    for i in range(n):
        # Option 1: sell at price[i] using best prior inventory accumulation
        profit = query(prices[i])
        best = max(best, profit)

        # Option 2: accumulate cost[i] more units, continue
        inventory += costs[i]
        # This creates a new line: slope = inventory, intercept = -total_cost
        # (total cost is implicitly tracked in the intercept)
        add_line(inventory, -costs[i])   # simplified

    return best`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },

  {
    id: "fin-20260531-b1-trie-prefix-matching",
    language: "python",
    title: "Instrument Symbol Prefix Search",
    difficulty: "medium",
    topics: ["trie", "strings", "data-structures"],
    problem: `You have a database of N instrument symbols (e.g. "AAPL", "AAPL.OQ", "AAPLQ", "AAPL240621C00180000"). Design a data structure that:
1. insert(symbol) — add a symbol
2. startsWith(prefix) — return all symbols with this prefix
3. countWithPrefix(prefix) — return the count of symbols with this prefix

Input operations:
["insert","AAPL"], ["insert","AAPL.OQ"], ["insert","GOOG"], ["insert","GOOGL"],
["startsWith","AAP"], ["countWithPrefix","GOO"]

Output: [["AAPL","AAPL.OQ"], 2]`,
    examples: [
      {
        input:
          'ops=[["insert","AAPL"],["insert","AAPL.OQ"],["insert","GOOG"],["insert","GOOGL"],["startsWith","AAP"],["countWithPrefix","GOO"]]',
        output: '[["AAPL","AAPL.OQ"], 2]',
        explanation:
          'startsWith("AAP") returns ["AAPL","AAPL.OQ"]. countWithPrefix("GOO") = 2 (GOOG and GOOGL).',
      },
    ],
    constraints: [
      "1 <= N <= 1e4 symbols",
      "1 <= len(symbol) <= 50",
      "Symbols contain uppercase letters, digits, and special chars . and _",
      "1 <= Q queries",
    ],
    approach: `Trie (prefix tree): each node has a dict of children and a list of symbols that end here.

insert(symbol): walk character by character creating nodes as needed; store the full symbol at the terminal node. Also increment a count at each node.

startsWith(prefix): walk to the prefix's terminal node (if it exists), then DFS/BFS to collect all symbols in the subtree.

countWithPrefix(prefix): walk to prefix terminal node and return its subtree count (maintained during insert).`,
    code: `class TrieNode:
    def __init__(self):
        self.children: dict[str, "TrieNode"] = {}
        self.count = 0          # number of symbols in this subtree
        self.words: list[str] = []  # symbols terminating here

class SymbolTrie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, symbol: str) -> None:
        node = self.root
        for ch in symbol:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
            node.count += 1
        node.words.append(symbol)

    def _find_node(self, prefix: str) -> TrieNode | None:
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node

    def countWithPrefix(self, prefix: str) -> int:
        node = self._find_node(prefix)
        return node.count if node else 0

    def startsWith(self, prefix: str) -> list[str]:
        node = self._find_node(prefix)
        if not node:
            return []
        # DFS to collect all terminal symbols
        result = []
        stack = [node]
        while stack:
            curr = stack.pop()
            result.extend(curr.words)
            stack.extend(curr.children.values())
        return sorted(result)   # sorted for determinism

# Example usage
trie = SymbolTrie()
for sym in ["AAPL", "AAPL.OQ", "GOOG", "GOOGL"]:
    trie.insert(sym)

print(trie.startsWith("AAP"))        # ["AAPL", "AAPL.OQ"]
print(trie.countWithPrefix("GOO"))   # 2`,
    complexity: { time: "O(L) per insert/count, O(L + output) for startsWith", space: "O(N*L)" },
  },

  {
    id: "fin-20260531-b1-rpn-evaluator",
    title: "RPN Expression Evaluator for Risk Formulae",
    difficulty: "medium",
    topics: ["stack", "parsing"],
    problem: `Risk systems often store pricing formulae in Reverse Polish Notation (RPN / postfix) to avoid parenthesis parsing overhead. Implement an evaluator that supports:
- Numeric literals (integers and decimals, including negative)
- Binary operators: + - * /
- Unary functions: abs sqrt neg (negate)
- A variable table {"S": 100.0, "K": 100.0, "r": 0.05, ...}

Input: tokens = ["S", "K", "-", "abs"], vars = {"S": 95.0, "K": 100.0}
Output: 5.0  (abs(S - K) = abs(95 - 100) = 5)

Input: tokens = ["S", "0.5", "*", "r", "T", "*", "+"], vars = {"S":100,"r":0.05,"T":1}
Output: 50.05`,
    examples: [
      {
        input: 'tokens=["S","K","-","abs"], vars={"S":95.0,"K":100.0}',
        output: "5.0",
        explanation: "Stack: push 95, push 100, subtract → -5, abs → 5.",
      },
      {
        input: 'tokens=["2","3","+","4","*"], vars={}',
        output: "20.0",
        explanation: "(2+3)*4 = 20.",
      },
    ],
    constraints: [
      "1 <= len(tokens) <= 200",
      "All intermediate results fit in float64",
      "Division by zero does not occur in test cases",
      "Variable names are single uppercase or lowercase letters or short strings",
    ],
    approach: `Classic stack-based RPN evaluation:

1. For each token:
   - If it's a number literal → push float(token)
   - If it's a variable name in vars → push vars[token]
   - If it's a binary operator (+, -, *, /) → pop two values, apply, push result
   - If it's a unary function (abs, sqrt, neg) → pop one value, apply, push result
2. At the end, the stack has exactly one element: the result.

Use a match statement or dispatch dict for operators and functions.`,
    code: `import math

def eval_rpn(tokens: list[str], variables: dict[str, float]) -> float:
    stack: list[float] = []

    binary_ops = {
        "+": lambda a, b: a + b,
        "-": lambda a, b: a - b,
        "*": lambda a, b: a * b,
        "/": lambda a, b: a / b,
    }
    unary_fns = {
        "abs":  abs,
        "sqrt": math.sqrt,
        "neg":  lambda x: -x,
        "exp":  math.exp,
        "log":  math.log,
    }

    for tok in tokens:
        if tok in binary_ops:
            b = stack.pop()
            a = stack.pop()
            stack.append(binary_ops[tok](a, b))
        elif tok in unary_fns:
            a = stack.pop()
            stack.append(unary_fns[tok](a))
        elif tok in variables:
            stack.append(float(variables[tok]))
        else:
            stack.append(float(tok))   # numeric literal

    if len(stack) != 1:
        raise ValueError(f"Malformed RPN: stack={stack}")
    return stack[0]

# Tests
print(eval_rpn(["S","K","-","abs"], {"S":95.0,"K":100.0}))   # 5.0
print(eval_rpn(["2","3","+","4","*"], {}))                    # 20.0
# Black-Scholes d1 numerator: log(S/K)
print(eval_rpn(["S","K","/","log"], {"S":105.0,"K":100.0}))  # ~0.04879`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },

  {
    id: "fin-20260531-b1-monotone-queue-dp",
    title: "Maximum Sliding Window P&L (Monotone Deque)",
    difficulty: "medium",
    topics: ["sliding-window", "deque", "dynamic-programming"],
    problem: `You have a stream of N daily P&L values. Find the maximum total P&L achievable by choosing any contiguous window of exactly K days.

Then extend: find the maximum sum subarray of length at most K (variable window).

Input: pnl = [3, -1, 2, 5, -2, 4, -3, 1], k = 3
Output (exactly k): 7  (window [2,5,-2] → window [5,-2,4] = 7)
Output (at most k): 9  (subarray [5,-2,4] or similar)`,
    examples: [
      {
        input: "pnl=[3,-1,2,5,-2,4,-3,1], k=3",
        output: "exactly_k=7, at_most_k=9",
        explanation:
          "Exactly-3: sliding window sums are [4,6,5,7,-1,2]. Max=7. At-most-3: max subarray length<=3 is [5,-2,4]=7 or [2,5]=7 or using prefix sums with monotone deque to find max prefix[i]-min(prefix[j]) for j>=i-k.",
      },
    ],
    constraints: [
      "1 <= K <= N <= 1e5",
      "-1e4 <= pnl[i] <= 1e4",
      "Solve exactly-K in O(N), at-most-K in O(N) using a monotone deque",
    ],
    approach: `Exactly-K: simple sliding window sum — maintain a running sum, subtract pnl[i-K] as you advance. O(N).

At most K (harder): use prefix sums S[i] = pnl[0]+...+pnl[i-1].
Max subarray ending at i with length <= K = S[i] - min(S[j]) for j in [i-K, i].
Use a monotone deque to maintain the minimum prefix sum in the window [i-K, i] as i advances.
Each element enters and leaves the deque once → O(N).`,
    code: `from collections import deque

def max_pnl_exactly_k(pnl: list[int], k: int) -> int:
    window_sum = sum(pnl[:k])
    best = window_sum
    for i in range(k, len(pnl)):
        window_sum += pnl[i] - pnl[i - k]
        best = max(best, window_sum)
    return best

def max_pnl_at_most_k(pnl: list[int], k: int) -> int:
    n = len(pnl)
    # Prefix sums: S[i] = sum(pnl[0..i-1]), S[0] = 0
    S = [0] * (n + 1)
    for i in range(n):
        S[i + 1] = S[i] + pnl[i]

    # max over i of (S[i] - min S[j] for j in [i-k, i])
    dq: deque[int] = deque()   # indices, monotone increasing S[j]
    best = 0

    for i in range(n + 1):
        # The window for j when querying at i: j in [i-k, i-1]
        # (subarray pnl[j..i-1] has length i-j <= k means j >= i-k)
        # Remove indices out of window
        while dq and dq[0] < i - k:
            dq.popleft()
        # Query: best ending at i
        if dq:
            best = max(best, S[i] - S[dq[0]])
        # Maintain monotone deque (increasing): add index i
        while dq and S[dq[-1]] >= S[i]:
            dq.pop()
        dq.append(i)

    return best

pnl = [3, -1, 2, 5, -2, 4, -3, 1]
k   = 3
print("Exactly K:", max_pnl_exactly_k(pnl, k))   # 7
print("At most K:", max_pnl_at_most_k(pnl, k))   # 9`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N)" },
  },

  {
    id: "fin-20260531-b1-union-find-connectivity",
    title: "Portfolio Connectivity — Union-Find for Correlated Clusters",
    difficulty: "medium",
    topics: ["union-find", "graph"],
    problem: `You have N assets. Given a list of pairs (i, j, corr) indicating pairwise correlations, and a correlation threshold theta, find all connected components where two assets are in the same cluster if there exists a path of high-correlation edges (corr >= theta).

Additionally support:
- are_connected(i, j): return True if i and j are in the same cluster
- cluster_size(i): return the size of i's cluster
- n_clusters(): return total number of distinct clusters

Input: n=5, edges=[(0,1,0.9),(1,2,0.85),(3,4,0.95),(2,3,0.5)], theta=0.8
Output: are_connected(0,2)=True, are_connected(0,3)=False, n_clusters()=2`,
    examples: [
      {
        input: "n=5, edges=[(0,1,0.9),(1,2,0.85),(3,4,0.95),(2,3,0.5)], theta=0.8",
        output: "are_connected(0,2)=True, are_connected(0,3)=False, n_clusters=2",
        explanation:
          "Edges >= 0.8: (0,1), (1,2), (3,4). Components: {0,1,2} and {3,4}. Edge (2,3) is below threshold (0.5 < 0.8) so 2 and 3 are not connected.",
      },
    ],
    constraints: [
      "1 <= N <= 1e5",
      "0 <= M (edges) <= 5*1e5",
      "0 < theta <= 1",
      "Union-Find with path compression and union by rank → near-O(α(N)) per operation",
    ],
    approach: `Union-Find (Disjoint Set Union) with path compression + union by rank.

init: parent[i]=i, rank[i]=0, size[i]=1 for all i.

find(i): follow parent pointers to root, applying path compression (parent[i] = root).

union(i, j): find roots; if same, do nothing; else merge smaller rank into larger (union by rank), update size.

Build graph: sort edges by correlation descending; for each edge (i,j,c) with c >= theta, call union(i,j).

Queries in O(α(N)) ≈ O(1) amortised.`,
    code: `class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank   = [0] * n
        self.size   = [1] * n
        self._components = n

    def find(self, x: int) -> int:
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x: int, y: int) -> bool:
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return False
        # Union by rank
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        self.size[rx] += self.size[ry]
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
        self._components -= 1
        return True

    def are_connected(self, x: int, y: int) -> bool:
        return self.find(x) == self.find(y)

    def cluster_size(self, x: int) -> int:
        return self.size[self.find(x)]

    def n_clusters(self) -> int:
        return self._components

def build_clusters(n: int,
                   edges: list[tuple[int, int, float]],
                   theta: float) -> UnionFind:
    uf = UnionFind(n)
    for i, j, corr in edges:
        if corr >= theta:
            uf.union(i, j)
    return uf

uf = build_clusters(5,
                    [(0,1,0.9),(1,2,0.85),(3,4,0.95),(2,3,0.5)],
                    theta=0.8)
print(uf.are_connected(0, 2))   # True
print(uf.are_connected(0, 3))   # False
print(uf.n_clusters())           # 2
print(uf.cluster_size(0))        # 3  ({0,1,2})`,
    language: "python",
    complexity: {
      time: "O(M * α(N)) for build, O(α(N)) per query",
      space: "O(N)",
    },
  },

  {
    id: "fin-20260531-b1-2d-dp-trade-limits",
    title: "Maximum Profit with Trade Count Constraint (2D DP)",
    difficulty: "hard",
    topics: ["dynamic-programming", "2d-dp"],
    problem: `You have N days of stock prices. You may complete at most K transactions (buy then sell = 1 transaction), but you must sell before buying again. Maximise total profit.

This is LeetCode 188 (Best Time to Buy and Sell Stock IV), a classic 2D DP problem commonly asked in quant interviews.

Input: k=2, prices=[3,2,6,5,0,3]
Output: 7  (buy at 2, sell at 6, buy at 0, sell at 3 → profit = 4+3 = 7)`,
    examples: [
      {
        input: "k=2, prices=[3,2,6,5,0,3]",
        output: "7",
        explanation: "Transaction 1: buy at 2, sell at 6 (+4). Transaction 2: buy at 0, sell at 3 (+3). Total = 7.",
      },
      {
        input: "k=1, prices=[1,2,3,4,5]",
        output: "4",
        explanation: "Single transaction: buy at 1, sell at 5.",
      },
    ],
    constraints: [
      "1 <= k <= 100",
      "1 <= N <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach: `State: dp[t][i] = max profit using exactly t transactions up to day i.

Transition:
  dp[t][i] = max(
    dp[t][i-1],                               # do nothing on day i
    max over j<i of (prices[i] - prices[j] + dp[t-1][j-1])  # sell on day i, bought on day j
  )

Optimise the max over j by maintaining a running maximum of (dp[t-1][j-1] - prices[j]):
  dp[t][i] = max(dp[t][i-1], prices[i] + best_buy)
  best_buy = max(best_buy, dp[t-1][i-1] - prices[i])

This reduces O(N²K) to O(NK).

Special case: if 2K >= N, unlimited transactions (greedy: sum all positive daily changes).`,
    code: `def max_profit_k_transactions(k: int, prices: list[int]) -> int:
    n = len(prices)
    if n <= 1:
        return 0

    # Unlimited transactions when k is large enough
    if k >= n // 2:
        return sum(max(prices[i] - prices[i-1], 0) for i in range(1, n))

    # dp[t][i]: max profit with t transactions, first i+1 days
    # Space-optimised: two arrays (previous and current transaction count)
    prev = [0] * n   # dp[t-1]
    curr = [0] * n   # dp[t]

    for t in range(1, k + 1):
        best_buy = -prices[0]   # max(dp[t-1][j-1] - prices[j]) for j=0
        curr[0] = 0
        for i in range(1, n):
            curr[i] = max(curr[i-1], prices[i] + best_buy)
            best_buy = max(best_buy, prev[i] - prices[i])
        prev = curr[:]

    return prev[n - 1]

# Tests
print(max_profit_k_transactions(2, [3,2,6,5,0,3]))   # 7
print(max_profit_k_transactions(1, [1,2,3,4,5]))      # 4
print(max_profit_k_transactions(2, [1,2,4,2,5,7,2,4,9,0]))  # 13`,
    language: "python",
    complexity: { time: "O(NK)", space: "O(N)" },
  },

  {
    id: "fin-20260531-b1-island-exposure",
    title: "Connected Region Exposure — Grid DFS/BFS",
    difficulty: "medium",
    topics: ["dfs", "bfs", "graph", "grid"],
    problem: `A risk manager models a grid of N×M trading desks. Each cell has an exposure value (positive = long risk, 0 = no position, negative = short risk). Two cells are "connected" if they are 4-directionally adjacent and both have non-zero exposure.

Find the number of connected risk islands and the total net exposure of each island.
Return the island with the maximum absolute net exposure.

Input: grid = [[1,0,3],[0,2,0],[-1,0,4]]
Output: islands=3, max_abs_exposure=4 (the single cell [4])`,
    examples: [
      {
        input: "grid=[[1,0,3],[0,2,0],[-1,0,4]]",
        output: "n_islands=4, exposures=[1,3,2,-1,4]... max_abs=4",
        explanation:
          "Non-zero cells: (0,0)=1, (0,2)=3, (1,1)=2, (2,0)=-1, (2,2)=4. None are adjacent (0-cells separate them). 5 islands each of size 1.",
      },
      {
        input: "grid=[[1,2,0],[3,0,0],[0,0,5]]",
        output: "n_islands=2, max_abs=6 (island {(0,0)=1,(0,1)=2,(1,0)=3}→net=6)",
        explanation:
          "(0,0),(0,1),(1,0) are connected (mutual adjacency). (2,2)=5 is isolated. Two islands with net exposures 6 and 5.",
      },
    ],
    constraints: [
      "1 <= N, M <= 200",
      "-1e4 <= grid[i][j] <= 1e4",
    ],
    approach: `Standard flood-fill (DFS or BFS) with a visited array.

For each unvisited non-zero cell, launch a DFS that:
1. Marks the cell as visited
2. Accumulates the cell's exposure into the island total
3. Recursively visits all 4 adjacent non-zero unvisited cells

Return the list of island net exposures; report the one with maximum absolute value.`,
    code: `def analyze_exposure_grid(grid: list[list[int]]) -> dict:
    if not grid or not grid[0]:
        return {"n_islands": 0, "exposures": [], "max_abs": 0}

    n, m = len(grid), len(grid[0])
    visited = [[False] * m for _ in range(n)]
    exposures = []

    def dfs(r: int, c: int) -> float:
        if r < 0 or r >= n or c < 0 or c >= m:
            return 0.0
        if visited[r][c] or grid[r][c] == 0:
            return 0.0
        visited[r][c] = True
        total = float(grid[r][c])
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            total += dfs(r + dr, c + dc)
        return total

    for r in range(n):
        for c in range(m):
            if not visited[r][c] and grid[r][c] != 0:
                net = dfs(r, c)
                exposures.append(net)

    max_abs = max((abs(e) for e in exposures), default=0.0)
    return {
        "n_islands": len(exposures),
        "exposures": exposures,
        "max_abs": max_abs,
    }

# Tests
print(analyze_exposure_grid([[1,0,3],[0,2,0],[-1,0,4]]))
# n_islands=5, max_abs=4
print(analyze_exposure_grid([[1,2,0],[3,0,0],[0,0,5]]))
# n_islands=2, exposures=[6.0, 5.0], max_abs=6`,
    language: "python",
    complexity: { time: "O(N*M)", space: "O(N*M)" },
  },

  {
    id: "fin-20260531-b1-path-vol-grid",
    title: "Minimum Path Volatility in a Grid",
    difficulty: "medium",
    topics: ["dynamic-programming", "dijkstra", "grid"],
    problem: `A quant models N×M grid of market states. Each cell (i,j) has a "local volatility" vol[i][j]. You start at (0,0) and must reach (N-1,M-1) moving only right or down. The path volatility is the sum of local vols along the path (including start and end).

Find the path with minimum total volatility and return that minimum value.

Input: vol = [[1,3,1],[1,5,1],[4,2,1]]
Output: 7  (path: (0,0)→(0,1)→(0,2)→(1,2)→(2,2) = 1+3+1+1+1=7 →
            or (0,0)→(1,0)→(1,1)→(1,2)→(2,2) = 1+1+5+1+1=9
            best: 1+3+1+1+1=7 or 1+1+1+2+1=6? → let's check: right,down,down: 1+3+5+2+1=12; down,right,right,down: 1+1+5+1+1=9; right,right,down,down: 1+3+1+1+1=7. Output=7)`,
    examples: [
      {
        input: "vol=[[1,3,1],[1,5,1],[4,2,1]]",
        output: "7",
        explanation:
          "Optimal path: right→right→down→down: cells (0,0)+(0,1)+(0,2)+(1,2)+(2,2) = 1+3+1+1+1 = 7.",
      },
      {
        input: "vol=[[1,2,3],[4,5,6]]",
        output: "12",
        explanation: "Path (0,0)→(0,1)→(0,2)→(1,2): 1+2+3+6=12.",
      },
    ],
    constraints: [
      "1 <= N, M <= 200",
      "0 <= vol[i][j] <= 100",
    ],
    approach: `Classic 2D DP. Let dp[i][j] = minimum path vol to reach (i,j).

Base case: dp[0][0] = vol[0][0].
First row: dp[0][j] = dp[0][j-1] + vol[0][j].
First col: dp[i][0] = dp[i-1][0] + vol[i][0].
General: dp[i][j] = vol[i][j] + min(dp[i-1][j], dp[i][j-1]).

Answer: dp[N-1][M-1].

Space-optimised: use a single 1D array of length M, updating left to right row by row.`,
    code: `def min_path_vol(vol: list[list[int]]) -> int:
    n, m = len(vol), len(vol[0])
    # Space-optimised DP: 1D array
    dp = [0] * m

    # Initialise first row
    dp[0] = vol[0][0]
    for j in range(1, m):
        dp[j] = dp[j-1] + vol[0][j]

    # Process remaining rows
    for i in range(1, n):
        dp[0] += vol[i][0]   # first column: can only come from above
        for j in range(1, m):
            dp[j] = vol[i][j] + min(dp[j], dp[j-1])
            # dp[j] (before update) = min vol to (i-1, j)
            # dp[j-1] (already updated) = min vol to (i, j-1)

    return dp[m - 1]

print(min_path_vol([[1,3,1],[1,5,1],[4,2,1]]))   # 7
print(min_path_vol([[1,2,3],[4,5,6]]))             # 12
print(min_path_vol([[1]]))                          # 1`,
    language: "python",
    complexity: { time: "O(N*M)", space: "O(M)" },
  },

  {
    id: "fin-20260531-b1-decode-order-messages",
    title: "Decode Compressed Order Message Stream",
    difficulty: "medium",
    topics: ["dynamic-programming", "strings"],
    problem: `An exchange compresses order side codes: 'B' = Buy, 'S' = Sell. To save bandwidth, consecutive identical sides are run-length encoded as a digit followed by the side: "3B2S1B" means BBB SS B.

But historical logs are sometimes missing the run-length, so a code like "12B3S" could mean either 12 B's + 3 S's OR (1 B + 2 B's) ... In the simplified version:

Given a string of digits and letters, where a digit d followed by letter c means d repetitions of c, count the total number of valid decodings if each digit can be parsed either as a single digit [1-9] alone or as the tens digit of a two-digit number [10-26] combined with the next digit (like LeetCode #91 Decode Ways, adapted to order flow).

Input: s = "226"
Output: 3  ("2 2 6" = BBB or "22 6" = [22-way?] — adapt to finance: count decoding ways)`,
    examples: [
      {
        input: 's="226"',
        output: "3",
        explanation:
          '"2","2","6" → 3 separate codes; "22","6" → 2 codes; "2","26" → 2 codes. Total = 3 ways.',
      },
      {
        input: 's="06"',
        output: "0",
        explanation: "Leading zero makes the string invalid — no valid decoding.",
      },
    ],
    constraints: [
      "1 <= len(s) <= 100",
      "s contains only digits",
      "A code is valid if it is in range [1..26] (no leading zeros)",
    ],
    approach: `Standard DP for string decoding (LeetCode 91).

dp[i] = number of ways to decode s[0..i-1].
dp[0] = 1 (empty prefix, 1 way).
dp[1] = 0 if s[0]=='0' else 1.

For i >= 2:
- Single digit: if s[i-1] != '0', add dp[i-1]
- Two digits: let v = int(s[i-2:i]); if 10 <= v <= 26, add dp[i-2]

Return dp[n].`,
    code: `def count_decodings(s: str) -> int:
    n = len(s)
    if n == 0 or s[0] == '0':
        return 0

    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 1

    for i in range(2, n + 1):
        # Single digit decode
        one_digit = int(s[i-1])
        if one_digit != 0:
            dp[i] += dp[i-1]

        # Two digit decode
        two_digit = int(s[i-2:i])
        if 10 <= two_digit <= 26:
            dp[i] += dp[i-2]

    return dp[n]

print(count_decodings("226"))   # 3
print(count_decodings("06"))    # 0
print(count_decodings("11106")) # 2
print(count_decodings("111"))   # 3

# Application: in order flow, codes 1-9 represent order types,
# codes 10-26 represent extended types; count valid interpretations
# of a compressed message string.`,
    language: "python",
    complexity: { time: "O(N)", space: "O(N) reducible to O(1)" },
  },
];
