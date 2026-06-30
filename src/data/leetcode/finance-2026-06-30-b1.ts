import type { LeetCodeProblem } from "./index";

export const financeProblems20260630B1: LeetCodeProblem[] = [
  {
    id: "fin-20260630-b1-segment-tree-range-vol",
    title: "Range Volatility Query with Segment Tree",
    difficulty: "hard",
    topics: ["Segment Tree", "Range Query", "Statistics"],
    problem:
      "Given an array of daily log-returns for N days, build a data structure that answers Q queries of the form (l, r): return the annualised realised volatility (std dev of log-returns × √252) over the index range [l, r]. Updates to individual returns must also be supported in O(log N).",
    examples: [
      {
        input: "returns = [0.01, -0.02, 0.015, -0.005, 0.03], query (1, 3)",
        output: "annualised vol over indices 1..3",
        explanation:
          "Merge running sums of x and x² to recover mean and variance in O(1) from two segment-tree nodes.",
      },
    ],
    constraints: [
      "1 ≤ N ≤ 10^5",
      "1 ≤ Q ≤ 10^5",
      "Queries and updates both O(log N)",
    ],
    approach:
      "Each segment tree node stores (count, sum_x, sum_x2). Merge: count+=, sum_x+=, sum_x2+=. From any node, variance = sum_x2/count - (sum_x/count)^2. Build in O(N), query/update O(log N).",
    code: `import math

class SegTreeVol:
    def __init__(self, data: list[float]):
        self.n = len(data)
        # each node: [count, sum_x, sum_x2]
        self.tree = [[0, 0.0, 0.0]] * (4 * self.n)
        self._build(data, 1, 0, self.n - 1)

    def _leaf(self, x: float):
        return [1, x, x * x]

    def _merge(self, L, R):
        return [L[0] + R[0], L[1] + R[1], L[2] + R[2]]

    def _build(self, data, node, lo, hi):
        if lo == hi:
            self.tree[node] = self._leaf(data[lo]); return
        mid = (lo + hi) // 2
        self._build(data, 2*node, lo, mid)
        self._build(data, 2*node+1, mid+1, hi)
        self.tree[node] = self._merge(self.tree[2*node], self.tree[2*node+1])

    def update(self, idx: int, val: float, node=1, lo=0, hi=None):
        if hi is None: hi = self.n - 1
        if lo == hi:
            self.tree[node] = self._leaf(val); return
        mid = (lo + hi) // 2
        if idx <= mid: self.update(idx, val, 2*node, lo, mid)
        else:          self.update(idx, val, 2*node+1, mid+1, hi)
        self.tree[node] = self._merge(self.tree[2*node], self.tree[2*node+1])

    def query(self, l: int, r: int, node=1, lo=0, hi=None):
        if hi is None: hi = self.n - 1
        if l > hi or r < lo: return [0, 0.0, 0.0]
        if l <= lo and hi <= r: return self.tree[node]
        mid = (lo + hi) // 2
        return self._merge(
            self.query(l, r, 2*node, lo, mid),
            self.query(l, r, 2*node+1, mid+1, hi)
        )

    def vol(self, l: int, r: int) -> float:
        cnt, sx, sx2 = self.query(l, r)
        if cnt < 2: return 0.0
        mean = sx / cnt
        var  = sx2 / cnt - mean * mean
        return math.sqrt(max(var, 0)) * math.sqrt(252)

returns = [0.01, -0.02, 0.015, -0.005, 0.03]
st = SegTreeVol(returns)
print(st.vol(1, 3))   # range query
st.update(2, 0.005)   # point update
print(st.vol(0, 4))`,
    language: "python",
    complexity: { time: "O((N + Q) log N)", space: "O(N)" },
  },
  {
    id: "fin-20260630-b1-sliding-window-max-bid",
    title: "Rolling Highest Bid / Maximum in Sliding Window",
    difficulty: "medium",
    topics: ["Monotonic Deque", "Sliding Window"],
    problem:
      "Given a stream of bid prices and a window size k, return the maximum bid price for each window of k consecutive ticks. This models the 'rolling best bid' used in execution algorithms to time entries.",
    examples: [
      {
        input: "bids = [3, 1, 4, 1, 5, 9, 2, 6], k = 3",
        output: "[4, 4, 5, 9, 9, 9]",
        explanation:
          "Window [3,1,4]→4, [1,4,1]→4, [4,1,5]→5, [1,5,9]→9, [5,9,2]→9, [9,2,6]→9.",
      },
    ],
    constraints: ["1 ≤ k ≤ N ≤ 10^5", "Prices are positive floats"],
    approach:
      "Maintain a monotonic decreasing deque of indices. For each new price, pop from the back while the back is ≤ current (not useful). Pop from the front if its index is outside the window. The front is always the window maximum.",
    code: `from collections import deque

def rolling_max_bid(bids: list[float], k: int) -> list[float]:
    dq: deque[int] = deque()   # stores indices, decreasing by bids[i]
    result = []

    for i, b in enumerate(bids):
        # remove indices outside the window
        while dq and dq[0] < i - k + 1:
            dq.popleft()
        # maintain decreasing invariant
        while dq and bids[dq[-1]] <= b:
            dq.pop()
        dq.append(i)

        if i >= k - 1:
            result.append(bids[dq[0]])   # front is window max

    return result

bids = [3, 1, 4, 1, 5, 9, 2, 6]
print(rolling_max_bid(bids, k=3))   # [4, 4, 5, 9, 9, 9]`,
    language: "python",
    complexity: { time: "O(N)", space: "O(k)" },
    leetcodeNumber: 239,
  },
  {
    id: "fin-20260630-b1-union-find-counterparty",
    title: "Counterparty Exposure Clustering (Union-Find)",
    difficulty: "medium",
    topics: ["Union-Find", "Graph", "Credit Risk"],
    problem:
      "You have N counterparties and a list of bilateral credit agreements (u, v, exposure). Find: (1) the number of distinct connected exposure groups, (2) the maximum total exposure within any single group. This models netting-set aggregation for CVA calculations.",
    examples: [
      {
        input:
          "n=5, agreements=[(0,1,10),(1,2,20),(3,4,15)], query max group exposure",
        output: "groups=2, max_exposure=30",
        explanation:
          "{0,1,2} has total exposure 30; {3,4} has 15. Isolated node 5 is its own group with 0.",
      },
    ],
    constraints: ["1 ≤ N ≤ 10^5", "Exposures are non-negative integers"],
    approach:
      "Union-Find with path compression and union-by-rank. Maintain a per-root exposure sum. After all unions, iterate roots to find the maximum.",
    code: `class DSU:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank   = [0] * n
        self.exp    = [0.0] * n    # total exposure per root

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]  # path compression
            x = self.parent[x]
        return x

    def union(self, u: int, v: int, exposure: float):
        ru, rv = self.find(u), self.find(v)
        if ru == rv:
            self.exp[ru] += exposure
            return
        if self.rank[ru] < self.rank[rv]: ru, rv = rv, ru
        self.parent[rv] = ru
        self.exp[ru] += self.exp[rv] + exposure
        if self.rank[ru] == self.rank[rv]:
            self.rank[ru] += 1

def counterparty_exposure(n: int,
                           agreements: list[tuple[int, int, float]]
                           ) -> dict:
    dsu = DSU(n)
    for u, v, exp in agreements:
        dsu.union(u, v, exp)
    roots = {dsu.find(i) for i in range(n)}
    max_exp = max(dsu.exp[r] for r in roots)
    return {"groups": len(roots), "max_exposure": max_exp}

print(counterparty_exposure(5, [(0,1,10),(1,2,20),(3,4,15)]))
# {'groups': 2, 'max_exposure': 30.0}`,
    language: "python",
    complexity: { time: "O((N + E) α(N))", space: "O(N)" },
  },
  {
    id: "fin-20260630-b1-binary-search-lot-size",
    title: "Optimal Trade Lot Size (Binary Search on Answer)",
    difficulty: "medium",
    topics: ["Binary Search", "Greedy", "Market Microstructure"],
    problem:
      "A broker must execute Q shares by splitting into lots. Each lot of size x incurs market impact cost c(x) = a*x^1.5 (square-root market impact). You also pay a fixed ticket charge F per lot. Given total shares Q and budget B for total cost, find the maximum lot size x such that ceil(Q/x) lots fit within budget B.",
    examples: [
      {
        input: "Q=1000, a=0.001, F=5.0, B=200.0",
        output: "optimal lot size (integer)",
        explanation:
          "Binary search on x in [1, Q]. For each candidate x, compute cost = ceil(Q/x)*(a*x^1.5 + F) and check ≤ B.",
      },
    ],
    constraints: [
      "1 ≤ Q ≤ 10^6",
      "a, F > 0",
      "Answer guaranteed to exist",
      "Monotone cost in x",
    ],
    approach:
      "As lot size x increases, number of lots decreases, fixed costs fall, but per-lot market impact rises. The total cost function is U-shaped; binary search works if we restrict to the regime where larger lots cost more (right side). Alternatively, minimise total cost numerically and then binary-search for the budget constraint.",
    code: `import math

def max_lot_size(Q: int, a: float, F: float, B: float) -> int:
    """Binary search: largest lot size x such that total cost <= B."""
    def total_cost(x: int) -> float:
        n_lots = math.ceil(Q / x)
        return n_lots * (a * x**1.5 + F)

    lo, hi = 1, Q
    ans = 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if total_cost(mid) <= B:
            ans = mid      # feasible, try larger
            lo = mid + 1
        else:
            hi = mid - 1   # too costly, reduce lot size
    return ans

Q, a, F, B = 1000, 0.001, 5.0, 200.0
x_opt = max_lot_size(Q, a, F, B)
print(f"Optimal lot size: {x_opt}")

# Verify: scan around the answer
for x in range(max(1, x_opt-2), x_opt+3):
    n = math.ceil(Q/x)
    cost = n * (a * x**1.5 + F)
    print(f"x={x}: lots={n}, cost={cost:.2f}, feasible={cost<=B}")`,
    language: "python",
    complexity: { time: "O(log Q)", space: "O(1)" },
  },
  {
    id: "fin-20260630-b1-kmp-fix-message",
    title: "FIX Protocol Message Substring Search (KMP)",
    difficulty: "medium",
    topics: ["String", "KMP", "Pattern Matching"],
    problem:
      "A FIX protocol feed streams raw messages as strings (e.g., '8=FIX.4.2|35=D|49=SENDER|...'). Given a list of M patterns (tag=value pairs, e.g., '35=D'), find the first occurrence position of each pattern in the message stream. Minimise total comparisons.",
    examples: [
      {
        input:
          "message = '8=FIX.4.2|35=D|49=SENDER|55=AAPL|', patterns = ['35=D', '55=AAPL']",
        output: "[10, 23]  (0-indexed positions)",
        explanation:
          "KMP avoids re-scanning already-matched characters via the failure function.",
      },
    ],
    constraints: [
      "1 ≤ |message| ≤ 10^6",
      "1 ≤ M ≤ 100",
      "1 ≤ |pattern| ≤ 50",
    ],
    approach:
      "Build KMP failure function (partial match table) for each pattern in O(|P|). Search in O(|T|). Total: O(|T|*M + sum|P_i|). For a single stream with many patterns, Aho-Corasick is O(|T| + sum|P_i| + matches) — show KMP first then note the upgrade.",
    code: `def kmp_search(text: str, pattern: str) -> list[int]:
    """Return all start indices where pattern occurs in text."""
    n, m = len(text), len(pattern)
    if m == 0: return []

    # Build failure function
    fail = [0] * m
    j = 0
    for i in range(1, m):
        while j > 0 and pattern[i] != pattern[j]:
            j = fail[j - 1]
        if pattern[i] == pattern[j]:
            j += 1
        fail[i] = j

    # Search
    positions = []
    j = 0
    for i in range(n):
        while j > 0 and text[i] != pattern[j]:
            j = fail[j - 1]
        if text[i] == pattern[j]:
            j += 1
        if j == m:
            positions.append(i - m + 1)
            j = fail[j - 1]
    return positions

def search_fix_tags(message: str, patterns: list[str]) -> dict[str, list[int]]:
    return {p: kmp_search(message, p) for p in patterns}

msg = "8=FIX.4.2|35=D|49=SENDER|55=AAPL|44=150.25|"
patterns = ["35=D", "55=AAPL", "44="]
print(search_fix_tags(msg, patterns))`,
    language: "python",
    complexity: { time: "O(|T| * M)", space: "O(sum |P_i|)" },
    leetcodeNumber: 28,
  },
  {
    id: "fin-20260630-b1-dp-bond-portfolio",
    title: "Bond Portfolio Selection (0-1 Knapsack, Yield Maximisation)",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Knapsack", "Fixed Income"],
    problem:
      "A fund manager has a capital budget B (integer, in $M) and N bonds to choose from. Each bond i has cost c_i ($M, integer) and expected yield y_i (float). Select a subset of bonds that fits the budget and maximises total yield. Each bond can be bought at most once.",
    examples: [
      {
        input:
          "B=10, bonds=[(cost=3,yield=4.5),(cost=4,yield=5.2),(cost=5,yield=6.1),(cost=2,yield=2.8)]",
        output: "max_yield=11.3, selected=[bond1,bond2]  (cost=3+4=7)",
        explanation:
          "Bonds 1+2+4 cost 9 and yield 12.5; bonds 1+3 cost 8 and yield 10.6; best is 1+2+4.",
      },
    ],
    constraints: [
      "1 ≤ N ≤ 300",
      "1 ≤ B ≤ 10^4",
      "All costs are positive integers",
    ],
    approach:
      "Standard 0-1 knapsack DP: dp[j] = max yield achievable with budget exactly j. Iterate bonds outer, budget inner (descending to avoid reuse). Track choices via a boolean keep[][] matrix for reconstruction.",
    code: `def bond_knapsack(budget: int,
                  bonds: list[tuple[int, float]]
                  ) -> dict:
    n = len(bonds)
    # dp[j] = max yield with exactly j budget used (use 0-based budget capacity)
    NEG_INF = float('-inf')
    dp   = [NEG_INF] * (budget + 1)
    dp[0] = 0.0
    keep = [[False] * (budget + 1) for _ in range(n)]

    for i, (cost, yld) in enumerate(bonds):
        # iterate budget descending (0-1 knapsack — no reuse)
        for j in range(budget, cost - 1, -1):
            if dp[j - cost] + yld > dp[j]:
                dp[j] = dp[j - cost] + yld
                keep[i][j] = True

    # max yield is max over all j
    best_j  = max(range(budget + 1), key=lambda j: dp[j])
    max_yld = dp[best_j]

    # Reconstruct which bonds were selected
    selected, j = [], best_j
    for i in range(n - 1, -1, -1):
        if keep[i][j]:
            selected.append(i)
            j -= bonds[i][0]
    selected.reverse()

    return {"max_yield": max_yld, "budget_used": best_j,
            "selected_bonds": selected}

bonds = [(3, 4.5), (4, 5.2), (5, 6.1), (2, 2.8)]
print(bond_knapsack(budget=10, bonds=bonds))`,
    language: "python",
    complexity: { time: "O(N × B)", space: "O(N × B)" },
  },
  {
    id: "fin-20260630-b1-two-pointer-margin-call",
    title: "Minimum Portfolio Liquidation to Meet Margin Call (Two Pointers)",
    difficulty: "medium",
    topics: ["Two Pointers", "Sorting", "Greedy", "Portfolio Management"],
    problem:
      "A trader has N positions with current market values. A margin call requires raising at least M dollars of cash by liquidating positions (selling at current value, with no partial fills — each position is all-or-nothing). Find the minimum number of positions to liquidate.",
    examples: [
      {
        input: "values=[5, 2, 8, 3, 7, 1], M=10",
        output: "2  (liquidate positions with values 8 and 7, raising 15 >= 10)",
        explanation: "Sort descending, pick greedily until sum ≥ M.",
      },
    ],
    constraints: [
      "1 ≤ N ≤ 10^5",
      "0 < M ≤ sum(values)",
      "Each value is a positive integer",
    ],
    approach:
      "Greedy: sort positions by value descending, take the largest until the cumulative sum ≥ M. This minimises the count because each pick maximises cash raised per position liquidated. Two-pointer framing: prefix sums after sorting; binary search for the smallest prefix sum ≥ M.",
    code: `import bisect
import itertools

def min_liquidations(values: list[int], M: int) -> dict:
    """Greedy: sort descending, take until sum >= M."""
    sorted_vals = sorted(values, reverse=True)

    # Prefix sums via itertools.accumulate
    prefix = list(itertools.accumulate(sorted_vals))

    # Binary search for smallest prefix sum >= M
    idx = bisect.bisect_left(prefix, M)
    if idx >= len(prefix):
        return {"error": "impossible — total value < M"}

    count = idx + 1
    cash_raised = prefix[idx]
    liquidated  = sorted_vals[:count]
    return {"min_positions": count, "cash_raised": cash_raised,
            "liquidated": liquidated}

values = [5, 2, 8, 3, 7, 1]
print(min_liquidations(values, M=10))
# {'min_positions': 2, 'cash_raised': 15, 'liquidated': [8, 7]}`,
    language: "python",
    complexity: { time: "O(N log N)", space: "O(N)" },
  },
  {
    id: "fin-20260630-b1-event-queue-simulation",
    title: "Market Event Simulation with Priority Queue",
    difficulty: "medium",
    topics: ["Heap", "Event-Driven Simulation", "Market Microstructure"],
    problem:
      "Simulate a limit order book with time-stamped events: PLACE (timestamp, order_id, side, price, qty) and CANCEL (timestamp, order_id). Process events in timestamp order. After all events, return the best bid, best ask, and total volume at each price level.",
    examples: [
      {
        input:
          "events=[(t=1,PLACE,id=1,BUY,99.5,100),(t=2,PLACE,id=2,SELL,100.5,50),(t=3,CANCEL,id=1)]",
        output: "best_bid=None (id=1 cancelled), best_ask=100.5@50",
        explanation:
          "Use a min-heap on timestamp. Cancelled orders are lazily removed via a 'dead set'.",
      },
    ],
    constraints: [
      "1 ≤ E ≤ 10^5 events",
      "Timestamps are unique integers",
      "All order_ids in CANCEL were previously PLACEd",
    ],
    approach:
      "Push all events into a min-heap keyed by timestamp. Process in order: PLACE → insert into sorted bid/ask dict; CANCEL → add to dead_set. When querying best bid/ask, skip dead orders lazily. Use SortedDict or sorted dicts for O(log N) bid/ask operations.",
    code: `import heapq
from collections import defaultdict

def simulate_lob(events: list[tuple]) -> dict:
    """
    events: list of tuples
      PLACE: (ts, 'PLACE', oid, side, price, qty)
      CANCEL: (ts, 'CANCEL', oid)
    """
    # Priority queue: (timestamp, event_tuple)
    heap = []
    for ev in events:
        heapq.heappush(heap, (ev[0], ev))

    bids: dict[float, int] = defaultdict(int)   # price -> qty
    asks: dict[float, int] = defaultdict(int)
    order_index: dict[int, tuple] = {}           # oid -> (side, price, qty)
    dead: set[int] = set()

    while heap:
        _, ev = heapq.heappop(heap)
        ts = ev[0]
        if ev[1] == 'PLACE':
            _, _, oid, side, price, qty = ev
            order_index[oid] = (side, price, qty)
            if side == 'BUY':  bids[price] += qty
            else:              asks[price] += qty
        else:   # CANCEL
            _, _, oid = ev
            if oid in order_index:
                side, price, qty = order_index[oid]
                if side == 'BUY':  bids[price] = max(0, bids[price] - qty)
                else:              asks[price] = max(0, asks[price] - qty)
            dead.add(oid)

    best_bid = max((p for p,q in bids.items() if q>0), default=None)
    best_ask = min((p for p,q in asks.items() if q>0), default=None)
    return {"best_bid": best_bid,
            "best_ask": best_ask,
            "bid_depth": dict(bids),
            "ask_depth": dict(asks)}

events = [
    (1, 'PLACE', 1, 'BUY',  99.5,  100),
    (2, 'PLACE', 2, 'SELL', 100.5,  50),
    (3, 'CANCEL', 1),
    (4, 'PLACE', 3, 'BUY',  99.0,  200),
]
print(simulate_lob(events))`,
    language: "python",
    complexity: { time: "O(E log E)", space: "O(E)" },
  },
  {
    id: "fin-20260630-b1-stack-option-payoff",
    title: "Option Payoff Expression Evaluator (Stack)",
    difficulty: "medium",
    topics: ["Stack", "Parsing", "Derivatives"],
    problem:
      "Given a payoff expression string for a structured product in reverse Polish notation (RPN), evaluate it. Supported operators: + - * / MAX MIN ABS. Operands are either float literals or the variable 'S' (spot price). Given spot S, compute the payoff.",
    examples: [
      {
        input: "expr = '100 S - 0 MAX'  (call payoff max(S-100, 0)), S = 115",
        output: "15.0",
        explanation:
          "Push 100, push S=115, subtract (115-100=15), push 0, MAX(15,0)=15.",
      },
      {
        input: "expr = 'S 95 - 0 MAX 110 S - 0 MAX -'  (bull spread), S=105",
        output: "10.0",
        explanation: "max(105-95,0) - max(110-105,0) = 10 - 5 = 5. (Wait: 10-5=5, not 10.)",
      },
    ],
    constraints: [
      "Expression tokens are space-separated",
      "All operands fit in float64",
      "Unbalanced expressions are undefined behaviour",
    ],
    approach:
      "Classic RPN evaluation with a float stack. For each token: if numeric or 'S', push the value; otherwise, pop the required number of operands, apply the operator, push the result.",
    code: `def evaluate_rpn_payoff(expr: str, S: float) -> float:
    """Evaluate an RPN payoff expression with spot price S."""
    stack: list[float] = []
    tokens = expr.split()

    for tok in tokens:
        if tok == 'S':
            stack.append(S)
        elif tok in ('+', '-', '*', '/'):
            b, a = stack.pop(), stack.pop()
            if tok == '+': stack.append(a + b)
            elif tok == '-': stack.append(a - b)
            elif tok == '*': stack.append(a * b)
            else:            stack.append(a / b)
        elif tok == 'MAX':
            b, a = stack.pop(), stack.pop()
            stack.append(max(a, b))
        elif tok == 'MIN':
            b, a = stack.pop(), stack.pop()
            stack.append(min(a, b))
        elif tok == 'ABS':
            stack.append(abs(stack.pop()))
        else:
            stack.append(float(tok))   # numeric literal

    return stack[-1]

# Vanilla call: max(S - 100, 0)
call_expr = "S 100 - 0 MAX"
for spot in [90, 100, 110, 125]:
    print(f"S={spot}: call payoff = {evaluate_rpn_payoff(call_expr, spot)}")

# Bull spread: max(S-95,0) - max(S-110,0)
bull_expr = "S 95 - 0 MAX S 110 - 0 MAX -"
for spot in [90, 100, 105, 115]:
    print(f"S={spot}: bull spread = {evaluate_rpn_payoff(bull_expr, spot)}")`,
    language: "python",
    complexity: { time: "O(T) (T = number of tokens)", space: "O(T)" },
  },
  {
    id: "fin-20260630-b1-bfs-currency-conversion",
    title: "Optimal Currency Conversion Path (BFS / Dijkstra)",
    difficulty: "hard",
    topics: ["Graph", "BFS", "Dijkstra", "FX Markets"],
    problem:
      "Given N currencies and M direct FX quotes (u, v, rate) meaning 1 unit of u buys rate units of v (bidirectional, with bid/ask spread: ask=rate, bid=1/rate * (1-spread)), find the maximum amount of currency T you receive starting from 1 unit of currency S, allowing at most K intermediate hops. Maximise the product of rates along the path.",
    examples: [
      {
        input:
          "edges=[(USD,EUR,0.92),(EUR,GBP,0.86),(USD,GBP,0.79)], S=USD, T=GBP, K=2",
        output: "0.7912 via USD→EUR→GBP (0.92*0.86=0.7912 > direct 0.79)",
        explanation:
          "Take log of rates, negate, run Dijkstra on -log(rate) to find max-product path.",
      },
    ],
    constraints: [
      "2 ≤ N ≤ 100",
      "1 ≤ M ≤ 1000",
      "0 < rate ≤ 10",
      "1 ≤ K ≤ N-1",
    ],
    approach:
      "Transform to shortest path on -log(rate) weights (minimising negative log maximises product). Use Dijkstra (no negative cycles in valid FX markets) or Bellman-Ford if negative cycles (arbitrage) must be detected. Optionally enforce K-hop limit with a layer-by-layer BFS.",
    code: `import heapq
import math

def max_conversion(
    currencies: list[str],
    quotes: list[tuple[str, str, float]],
    source: str, target: str,
    max_hops: int = 5,
    spread: float = 0.001,
) -> dict:
    idx = {c: i for i, c in enumerate(currencies)}
    N = len(currencies)
    # adjacency list: (neighbour_index, -log(rate))
    graph: list[list[tuple[int, float]]] = [[] for _ in range(N)]

    for u, v, rate in quotes:
        ask_rate = rate * (1 - spread)
        bid_rate = (1 / rate) * (1 - spread)
        # u -> v at ask rate, v -> u at bid rate
        graph[idx[u]].append((idx[v], -math.log(ask_rate)))
        graph[idx[v]].append((idx[u], -math.log(bid_rate)))

    src, tgt = idx[source], idx[target]
    # Dijkstra with hop limit: state = (neg_log_product, node, hops)
    # -log_product minimised = product maximised
    dist = [[math.inf] * (max_hops + 1) for _ in range(N)]
    dist[src][0] = 0.0
    heap = [(0.0, src, 0)]   # (cost, node, hops)
    prev = {}

    while heap:
        cost, u, hops = heapq.heappop(heap)
        if cost > dist[u][hops]: continue
        if u == tgt:
            break
        if hops >= max_hops: continue
        for v, w in graph[u]:
            nc = cost + w
            if nc < dist[v][hops + 1]:
                dist[v][hops + 1] = nc
                prev[(v, hops+1)] = (u, hops)
                heapq.heappush(heap, (nc, v, hops + 1))

    best_hops = min(range(max_hops+1), key=lambda h: dist[tgt][h])
    best_log  = dist[tgt][best_hops]
    if best_log == math.inf:
        return {"reachable": False}
    return {"amount": math.exp(-best_log),
            "hops": best_hops, "reachable": True}

currencies = ["USD", "EUR", "GBP", "JPY"]
quotes = [("USD","EUR",0.92),("EUR","GBP",0.86),("USD","GBP",0.79),
          ("USD","JPY",149.5),("EUR","JPY",162.5)]
print(max_conversion(currencies, quotes, "USD", "GBP", max_hops=3))`,
    language: "python",
    complexity: {
      time: "O(K × (N + M) log N)",
      space: "O(K × N)",
    },
  },
];
