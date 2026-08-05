import type { LeetCodeProblem } from "./index";

export const financeProblems20260805B1: LeetCodeProblem[] = [
  {
    id: "fin-20260805-b1-rolling-vwap",
    title: "Rolling VWAP Over Fixed Window",
    difficulty: "medium",
    topics: ["Sliding Window", "Array"],
    problem:
      "Given arrays price[n] and volume[n] and a window size k, compute the Volume-Weighted Average Price (VWAP = Σ(price[i]·volume[i]) / Σvolume[i]) for every contiguous window of exactly k bars. Return all n-k+1 VWAP values rounded to 4 decimal places.",
    examples: [
      {
        input: "price=[10.0,11.0,12.0,13.0], volume=[100,200,150,300], k=2",
        output: "[10.6667, 11.4286, 12.6667]",
        explanation:
          "Window 0: (10×100+11×200)/300=3200/300≈10.6667; Window 1: 4000/350≈11.4286; Window 2: 5700/450≈12.6667.",
      },
      {
        input: "price=[5.0,5.0,5.0], volume=[1,1,1], k=3",
        output: "[5.0]",
        explanation: "All prices equal; VWAP equals the uniform price.",
      },
    ],
    constraints: [
      "1 <= k <= n <= 10^5",
      "0 < volume[i] <= 10^6",
      "0 < price[i] <= 10^6",
    ],
    approach:
      "Maintain rolling sums of price×volume and volume: when sliding the window subtract the leftmost bar and add the new one. Divide running PV sum by volume sum. O(n) time, O(1) extra space.",
    code: `from typing import List

def rolling_vwap(price: List[float], volume: List[float], k: int) -> List[float]:
    pv = sum(p * v for p, v in zip(price[:k], volume[:k]))
    vol = sum(volume[:k])
    result = [round(pv / vol, 4)]
    for i in range(k, len(price)):
        pv += price[i] * volume[i] - price[i-k] * volume[i-k]
        vol += volume[i] - volume[i-k]
        result.append(round(pv / vol, 4))
    return result

p = [10.0, 11.0, 12.0, 13.0]
v = [100, 200, 150, 300]
assert rolling_vwap(p, v, 2) == [10.6667, 11.4286, 12.6667]
assert rolling_vwap([5.0, 5.0, 5.0], [1, 1, 1], 3) == [5.0]
print("Rolling VWAP tests passed")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260805-b1-max-drawdown",
    title: "Maximum Portfolio Drawdown",
    difficulty: "easy",
    topics: ["Array", "Greedy"],
    problem:
      "Given an array port[n] of portfolio values (all positive), return the maximum drawdown, defined as max over all pairs i<j of (port[i]-port[j])/port[i], expressed as a decimal rounded to 4 places. If the portfolio never declines, return 0.0.",
    examples: [
      {
        input: "port = [100.0, 120.0, 80.0, 110.0, 70.0]",
        output: "0.4167",
        explanation:
          "Peak at 120 then trough at 70: (120-70)/120 ≈ 0.4167. The earlier peak-100/trough-80 gives only 0.2.",
      },
      {
        input: "port = [90.0, 95.0, 100.0]",
        output: "0.0",
        explanation: "Portfolio only rises; no drawdown.",
      },
    ],
    constraints: ["1 <= n <= 10^5", "0 < port[i] <= 10^6"],
    approach:
      "Scan left to right maintaining a running peak. At each index j, compute (peak - port[j]) / peak and update the global maximum. O(n) time, O(1) space.",
    code: `from typing import List

def max_drawdown(port: List[float]) -> float:
    peak = port[0]
    max_dd = 0.0
    for value in port[1:]:
        if value > peak:
            peak = value
        dd = (peak - value) / peak
        if dd > max_dd:
            max_dd = dd
    return round(max_dd, 4)

assert max_drawdown([100.0, 120.0, 80.0, 110.0, 70.0]) == 0.4167
assert max_drawdown([90.0, 95.0, 100.0]) == 0.0
assert max_drawdown([100.0, 50.0]) == 0.5
print("Drawdown tests passed")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "fin-20260805-b1-k-transactions",
    title: "Maximum Profit with K Trade Limit",
    difficulty: "hard",
    topics: ["Dynamic Programming", "Greedy"],
    problem:
      "A prop trader is restricted to at most k completed round-trips (one buy then one sell = one transaction) with at most one open position at a time. Given daily prices, return the maximum total profit. When k is very large, treat it as unlimited transactions.",
    examples: [
      {
        input: "k=2, prices=[3,2,6,5,0,3]",
        output: "7",
        explanation:
          "Buy at 2 sell at 6 (+4), buy at 0 sell at 3 (+3). Total = 7.",
      },
      {
        input: "k=1, prices=[1,2,4,2,5,7,2,4,9,0]",
        output: "8",
        explanation: "Buy at 1, sell at 9. Single best transaction.",
      },
    ],
    constraints: [
      "0 <= k <= 100",
      "1 <= prices.length <= 1000",
      "0 <= prices[i] <= 1000",
    ],
    approach:
      "When k >= n//2 any profitable adjacent pair can be taken — use greedy sum-of-positive-diffs. Otherwise maintain buy[t] and sell[t] arrays for t=1..k: sell[t]=max(sell[t], buy[t]+price); buy[t]=max(buy[t], sell[t-1]-price). Process k in reverse each day. Answer = sell[k]. O(nk) time, O(k) space.",
    code: `from typing import List

def max_profit_k(k: int, prices: List[int]) -> int:
    n = len(prices)
    if not prices or k == 0:
        return 0
    if k >= n // 2:
        return sum(max(0, prices[i] - prices[i-1]) for i in range(1, n))
    buy  = [float('-inf')] * (k + 1)
    sell = [0] * (k + 1)
    for price in prices:
        for t in range(k, 0, -1):
            sell[t] = max(sell[t], buy[t] + price)
            buy[t]  = max(buy[t],  sell[t-1] - price)
    return sell[k]

assert max_profit_k(2, [3,2,6,5,0,3]) == 7
assert max_profit_k(1, [1,2,4,2,5,7,2,4,9,0]) == 8
assert max_profit_k(0, [1,5]) == 0
assert max_profit_k(2, [1,2,3,4,5]) == 4
print("K-transactions tests passed")`,
    language: "python",
    complexity: { time: "O(nk)", space: "O(k)" },
    leetcodeNumber: 188,
  },
  {
    id: "fin-20260805-b1-top-k-sharpe",
    title: "Top-K Assets by Sharpe Ratio",
    difficulty: "medium",
    topics: ["Heap", "Sorting"],
    problem:
      "Given n assets each described by (name, mu, sigma) — expected annual return and volatility — compute Sharpe ratio = mu/sigma (risk-free rate = 0). Return the names of the top-k assets by Sharpe, highest first. Break ties alphabetically by name.",
    examples: [
      {
        input:
          "assets=[('A',0.12,0.2),('B',0.08,0.1),('C',0.15,0.3),('D',0.10,0.15)], k=2",
        output: "['B', 'D']",
        explanation:
          "Sharpes: A=0.6, B=0.8, C=0.5, D=0.667. Top-2: B(0.8) then D(0.667).",
      },
    ],
    constraints: [
      "1 <= k <= n <= 10^4",
      "0 < sigma[i] <= 10",
      "0 < mu[i] <= 10",
    ],
    approach:
      "Use a min-heap of size k on (sharpe, name). Push each asset; pop the minimum when heap exceeds k. The heap retains the top-k. Sort the result by Sharpe descending then name ascending. O(n log k) time.",
    code: `import heapq
from typing import List, Tuple

def top_k_sharpe(assets: List[Tuple[str, float, float]], k: int) -> List[str]:
    heap = []  # (sharpe, name) min-heap
    for name, mu, sigma in assets:
        sharpe = mu / sigma
        heapq.heappush(heap, (sharpe, name))
        if len(heap) > k:
            heapq.heappop(heap)
    result = sorted(heap, key=lambda x: (-x[0], x[1]))
    return [name for _, name in result]

assets = [('A', 0.12, 0.2), ('B', 0.08, 0.1),
          ('C', 0.15, 0.3), ('D', 0.10, 0.15)]
assert top_k_sharpe(assets, 2) == ['B', 'D']
assert top_k_sharpe(assets, 1) == ['B']
assert top_k_sharpe(assets, 4) == ['B', 'D', 'A', 'C']
print("Top-K Sharpe tests passed")`,
    language: "python",
    complexity: { time: "O(n log k)", space: "O(k)" },
  },
  {
    id: "fin-20260805-b1-gamblers-ruin",
    title: "Gambler's Ruin — Probability of Reaching Target Capital",
    difficulty: "medium",
    topics: ["Dynamic Programming", "Probability"],
    problem:
      "A trader starts with s dollars and bets one dollar per round. Each round they win with probability p and lose with probability 1-p. They stop when they reach 0 (ruin) or T (target). Return the probability of reaching T, rounded to 6 decimal places.",
    examples: [
      {
        input: "s=5, T=10, p=0.5",
        output: "0.5",
        explanation: "Fair game: classical result P(s) = s/T = 5/10 = 0.5.",
      },
      {
        input: "s=3, T=5, p=0.6",
        output: "0.810427",
        explanation:
          "Biased toward winning. Formula: P(s)=(1-(q/p)^s)/(1-(q/p)^T) with q/p=2/3 gives (1-(2/3)^3)/(1-(2/3)^5)=171/211≈0.810427.",
      },
    ],
    constraints: ["1 <= s < T <= 100", "0 < p < 1"],
    approach:
      "Closed-form: let r = (1-p)/p. For p ≠ 0.5: P(s) = (1 - r^s) / (1 - r^T). For p = 0.5: P(s) = s / T. This avoids iterative DP and is numerically stable for moderate T.",
    code: `def gamblers_ruin(s: int, T: int, p: float) -> float:
    if abs(p - 0.5) < 1e-12:
        return round(s / T, 6)
    r = (1 - p) / p
    prob = (1 - r**s) / (1 - r**T)
    return round(prob, 6)

assert gamblers_ruin(5, 10, 0.5) == 0.5
assert abs(gamblers_ruin(3, 5, 0.6) - 0.810427) < 1e-5
assert gamblers_ruin(1, 2, 0.5) == 0.5
assert gamblers_ruin(1, 2, 0.6) == 0.6
print("Gambler's ruin tests passed")`,
    language: "python",
    complexity: { time: "O(1)", space: "O(1)" },
  },
  {
    id: "fin-20260805-b1-position-book-design",
    title: "Real-Time Position Book with P&L Query",
    difficulty: "medium",
    topics: ["Design", "Hash Map"],
    problem:
      "Design a PositionBook supporting: add_fill(symbol, qty, price) where qty is positive for buys and negative for sells; get_pnl(symbol, mark) returning unrealized P&L = net_qty * mark - cost_basis; get_top_gainer(marks_dict) returning the symbol with the highest unrealized P&L given a dict of mark prices.",
    examples: [
      {
        input:
          "add_fill('AAPL',100,150); add_fill('AAPL',-50,160); get_pnl('AAPL',155)",
        output: "750.0",
        explanation:
          "net_qty=50, cost_basis=100*150+(-50)*160=7000. P&L=50*155-7000=750.",
      },
    ],
    constraints: [
      "Up to 10^4 distinct symbols",
      "Up to 10^6 total fills",
      "prices and marks are positive floats",
    ],
    approach:
      "Store per-symbol (net_qty, cost_basis). On each fill: cost_basis += qty * price; net_qty += qty. P&L = net_qty * mark - cost_basis is O(1). get_top_gainer iterates all symbols in marks_dict — O(S) where S = number of symbols.",
    code: `class PositionBook:
    def __init__(self):
        self.net_qty = {}
        self.cost_basis = {}

    def add_fill(self, symbol: str, qty: int, price: float):
        self.net_qty[symbol] = self.net_qty.get(symbol, 0) + qty
        self.cost_basis[symbol] = self.cost_basis.get(symbol, 0.0) + qty * price

    def get_pnl(self, symbol: str, mark: float) -> float:
        qty = self.net_qty.get(symbol, 0)
        basis = self.cost_basis.get(symbol, 0.0)
        return qty * mark - basis

    def get_top_gainer(self, marks: dict) -> str:
        return max(marks, key=lambda s: self.get_pnl(s, marks[s]))

book = PositionBook()
book.add_fill('AAPL', 100, 150.0)
book.add_fill('AAPL', -50, 160.0)
assert book.get_pnl('AAPL', 155.0) == 750.0
book.add_fill('MSFT', 200, 300.0)
assert book.get_top_gainer({'AAPL': 155.0, 'MSFT': 350.0}) == 'MSFT'
print("PositionBook tests passed")`,
    language: "python",
    complexity: { time: "O(1) fill and get_pnl, O(S) top-gainer", space: "O(S)" },
  },
  {
    id: "fin-20260805-b1-option-flag-decoder",
    title: "Option Strategy Flag Encoder / Decoder",
    difficulty: "easy",
    topics: ["Bit Manipulation"],
    problem:
      "An options strategy is packed into a 32-bit integer. Bit positions: 0=is_call, 1=is_long, 2=is_european, 3=delta_hedge_active, 4=auto_roll. Implement decode_flags(n) → dict of flag names to booleans, and encode_flags(d) → int.",
    examples: [
      {
        input: "decode_flags(22)",
        output:
          "{'is_call':False,'is_long':True,'is_european':True,'delta_hedge_active':False,'auto_roll':True}",
        explanation:
          "22 = 0b10110. Bit0=0(put), bit1=1(long), bit2=1(european), bit3=0, bit4=1(auto_roll).",
      },
      {
        input:
          "encode_flags({'is_call':True,'is_long':True,'is_european':True,'delta_hedge_active':False,'auto_roll':False})",
        output: "7",
        explanation: "Bits 0,1,2 set: 1+2+4=7.",
      },
    ],
    constraints: ["0 <= n <= 2^32 - 1"],
    approach:
      "Define a list of (name, bit) pairs. decode: (n >> bit) & 1 for each entry. encode: OR together 1 << bit for each True entry. Both are O(number of flags) = O(1).",
    code: `FLAG_BITS = [
    ('is_call',            0),
    ('is_long',            1),
    ('is_european',        2),
    ('delta_hedge_active', 3),
    ('auto_roll',          4),
]

def decode_flags(n: int) -> dict:
    return {name: bool((n >> bit) & 1) for name, bit in FLAG_BITS}

def encode_flags(d: dict) -> int:
    result = 0
    for name, bit in FLAG_BITS:
        if d.get(name, False):
            result |= (1 << bit)
    return result

assert decode_flags(22) == {
    'is_call': False, 'is_long': True, 'is_european': True,
    'delta_hedge_active': False, 'auto_roll': True,
}
assert encode_flags({'is_call': True, 'is_long': True, 'is_european': True,
                     'delta_hedge_active': False, 'auto_roll': False}) == 7
assert encode_flags(decode_flags(22)) == 22
print("Flag encoder/decoder tests passed")`,
    language: "python",
    complexity: { time: "O(1)", space: "O(1)" },
  },
  {
    id: "fin-20260805-b1-optimal-order-slicing",
    title: "Optimal Order Slicing — Minimum Quadratic Market Impact",
    difficulty: "medium",
    topics: ["Math", "Greedy"],
    problem:
      "You must execute Q shares over T time periods. The market impact cost for trading q shares in one period is lambda * q^2 (quadratic model). Find the minimum total cost subject to sum of per-period quantities equaling Q, where each quantity is a non-negative integer.",
    examples: [
      {
        input: "Q=6, T=3, lambda=1.0",
        output: "12.0",
        explanation:
          "Equal split [2,2,2] is optimal by convexity. Cost = 1*(4+4+4) = 12.0.",
      },
      {
        input: "Q=5, T=2, lambda=1.0",
        output: "13.0",
        explanation:
          "Best integer split is [3,2] or [2,3]. Cost = 1*(9+4) = 13.0.",
      },
    ],
    constraints: ["1 <= Q <= 10^4", "1 <= T <= 100", "lambda > 0"],
    approach:
      "By convexity of x^2, the optimal integer allocation is as even as possible. Let q=Q//T and r=Q%T. Then r periods get (q+1) shares and (T-r) periods get q shares. Cost = (r*(q+1)^2 + (T-r)*q^2) * lambda. O(1) — no DP needed.",
    code: `def min_impact_cost(Q: int, T: int, lam: float) -> float:
    q, r = divmod(Q, T)
    cost = r * (q + 1) ** 2 + (T - r) * q ** 2
    return cost * lam

assert min_impact_cost(6, 3, 1.0) == 12.0
assert min_impact_cost(5, 2, 1.0) == 13.0
assert min_impact_cost(10, 5, 2.0) == 40.0   # 5*(2^2)*2 = 40
assert min_impact_cost(7, 3, 1.0) == 17.0    # r=1: 1*(3^2)+2*(2^2)=9+8=17
print("Order slicing tests passed")`,
    language: "python",
    complexity: { time: "O(1)", space: "O(1)" },
  },
  {
    id: "fin-20260805-b1-compound-return-matrix",
    title: "Regime-Switching Compound Return via Matrix Exponentiation",
    difficulty: "hard",
    topics: ["Matrix Exponentiation", "Dynamic Programming"],
    problem:
      "A portfolio switches between k regimes. State vector v[t][i] = expected wealth in regime i at time t. Transition: v[t+1] = M @ v[t] where M[i][j] = (prob of j→i) * (gross return in regime i). Starting from v0 = [1.0, 0.0, ...], compute v[n] = M^n @ v0 for large n using fast matrix exponentiation.",
    examples: [
      {
        input: "M=[[1.05,0.0],[0.0,0.98]], v0=[1.0,0.0], n=10",
        output: "[1.6289, 0.0]",
        explanation:
          "Diagonal: regime 0 compounds at 1.05, regime 1 at 0.98, no transitions. After 10 steps: 1.05^10 ≈ 1.6289.",
      },
    ],
    constraints: ["2 <= k <= 10", "0 <= n <= 10^9", "M[i][j] >= 0"],
    approach:
      "Implement k×k matrix multiply and compute M^n via binary exponentiation: start with identity, square-and-multiply based on bits of n. O(k^3 log n) time, O(k^2) space.",
    code: `from typing import List

def mat_mul(A: List[List[float]], B: List[List[float]]) -> List[List[float]]:
    k = len(A)
    C = [[0.0] * k for _ in range(k)]
    for i in range(k):
        for l in range(k):
            if A[i][l] == 0.0:
                continue
            for j in range(k):
                C[i][j] += A[i][l] * B[l][j]
    return C

def mat_pow(M: List[List[float]], n: int) -> List[List[float]]:
    k = len(M)
    result = [[float(i == j) for j in range(k)] for i in range(k)]
    while n:
        if n & 1:
            result = mat_mul(result, M)
        M = mat_mul(M, M)
        n >>= 1
    return result

def compound_return(M: List[List[float]], v0: List[float], n: int) -> List[float]:
    Mn = mat_pow(M, n)
    k = len(v0)
    return [round(sum(Mn[i][j] * v0[j] for j in range(k)), 4) for i in range(k)]

M = [[1.05, 0.0], [0.0, 0.98]]
result = compound_return(M, [1.0, 0.0], 10)
assert result == [round(1.05 ** 10, 4), 0.0]
assert compound_return([[1.0]], [2.0], 5) == [2.0]
print("Matrix exponentiation tests passed")`,
    language: "python",
    complexity: { time: "O(k^3 log n)", space: "O(k^2)" },
  },
  {
    id: "fin-20260805-b1-min-cost-rebalance",
    title: "Minimum Transaction Cost Portfolio Rebalance",
    difficulty: "easy",
    topics: ["Greedy", "Array"],
    problem:
      "You hold a portfolio with current weights curr[n] (summing to 1) and want target weights tgt[n] (also summing to 1). Each unit of weight traded costs transaction_cost. Buys and sells can be netted: the minimum total weight traded equals the sum of all positive deviations (= sum of all negative deviations). Return the total transaction cost.",
    examples: [
      {
        input:
          "curr=[0.5,0.3,0.2], tgt=[0.4,0.4,0.2], transaction_cost=0.001",
        output: "0.0001",
        explanation:
          "Deviations: -0.1, +0.1, 0. Sum of buys = 0.1. Cost = 0.1 * 0.001 = 0.0001.",
      },
      {
        input:
          "curr=[0.25,0.25,0.25,0.25], tgt=[1.0,0.0,0.0,0.0], transaction_cost=0.005",
        output: "0.00375",
        explanation:
          "Must buy 0.75 of asset 0 (funded by selling 0.75 total from the rest). Cost = 0.75 * 0.005 = 0.00375.",
      },
    ],
    constraints: [
      "1 <= n <= 1000",
      "0 <= curr[i], tgt[i] <= 1; sum(curr)=sum(tgt)=1",
      "0 <= transaction_cost <= 1",
    ],
    approach:
      "Compute deviation[i] = tgt[i] - curr[i]. Total weight to trade = sum of positive deviations (equals sum of absolute deviations / 2 by construction). Multiply by transaction_cost. O(n) time.",
    code: `from typing import List

def min_rebalance_cost(curr: List[float], tgt: List[float], tc: float) -> float:
    total_buys = sum(max(0.0, t - c) for c, t in zip(curr, tgt))
    return round(total_buys * tc, 8)

assert abs(min_rebalance_cost([0.5, 0.3, 0.2], [0.4, 0.4, 0.2], 0.001) - 0.0001) < 1e-9
assert abs(min_rebalance_cost([0.25]*4, [1.0, 0.0, 0.0, 0.0], 0.005) - 0.00375) < 1e-9
assert min_rebalance_cost([0.5, 0.5], [0.5, 0.5], 0.01) == 0.0
print("Rebalance cost tests passed")`,
    language: "python",
    complexity: { time: "O(n)", space: "O(1)" },
  },
];
