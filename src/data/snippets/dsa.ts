import type { Snippet } from "./types";

export const dsaSnippets: Snippet[] = [
  {
    id: "dsa-binary-search",
    language: "dsa",
    title: "Binary search (sorted array)",
    tag: "search",
    code: `def bsearch(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2          # midpoint, integer division
        if arr[mid] == target:
            return mid                # found
        if arr[mid] < target:
            lo = mid + 1              # target is right of mid
        else:
            hi = mid - 1              # target is left of mid
    return -1                         # not present

# O(log n). Halves the search space each iteration.
print(bsearch([1, 3, 5, 7, 9, 11], 7))   # 3`,
    explanation:
      "Classic divide-and-conquer search. Stable pattern: closed interval [lo, hi] with <= condition. Off-by-one is the #1 bug source — pick a pattern and stick to it.",
  },
  {
    id: "dsa-two-pointers",
    language: "dsa",
    title: "Two pointers — pair sum (sorted)",
    tag: "technique",
    code: `def two_sum_sorted(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo < hi:
        s = arr[lo] + arr[hi]
        if s == target:
            return (lo, hi)            # found
        if s < target:
            lo += 1                    # too small, advance left
        else:
            hi -= 1                    # too big, retreat right
    return None

# O(n) instead of O(n^2) brute force.
print(two_sum_sorted([1, 3, 5, 8, 11], 13))   # (1, 3)`,
    explanation:
      "Opposite-end two pointers on sorted data. The sortedness lets each step decisively shrink the search — that's why it's O(n) not O(n²).",
  },
  {
    id: "dsa-sliding-window",
    language: "dsa",
    title: "Sliding window — fixed size",
    tag: "technique",
    code: `def max_window_sum(arr, k):
    # Compute sum of the first window of size k.
    s = sum(arr[:k])
    best = s

    # Slide: subtract the leaving item, add the entering item — O(1) per step.
    for i in range(k, len(arr)):
        s += arr[i] - arr[i - k]
        if s > best:
            best = s
    return best

# O(n) instead of O(n*k) recomputing each window.
print(max_window_sum([1, 4, 2, 10, 23, 3, 1, 0, 20], 3))   # 35`,
    explanation:
      "Fixed-window pattern. Slide by adding/removing one item per step — turns naive O(n*k) into O(n). Used everywhere: max sum, average, count.",
  },
  {
    id: "dsa-bfs",
    language: "dsa",
    title: "BFS on a graph",
    tag: "graph",
    code: `from collections import deque

def bfs(graph, start):
    visited = {start}
    q = deque([start])
    order = []
    while q:
        node = q.popleft()              # FIFO — deque pop from left
        order.append(node)
        for nb in graph[node]:
            if nb not in visited:
                visited.add(nb)         # mark on ENQUEUE, not dequeue
                q.append(nb)
    return order

graph = {"A": ["B", "C"], "B": ["A", "D"], "C": ["A", "D"], "D": ["B", "C"]}
print(bfs(graph, "A"))   # ['A', 'B', 'C', 'D']`,
    explanation:
      "BFS = queue + visited set. Mark visited on enqueue (not dequeue) to avoid re-adding. Gives shortest path on unweighted graphs.",
  },
  {
    id: "dsa-dfs",
    language: "dsa",
    title: "DFS on a graph",
    tag: "graph",
    code: `def dfs(graph, start):
    visited = set()
    order = []

    def visit(node):
        if node in visited:
            return
        visited.add(node)
        order.append(node)
        for nb in graph[node]:
            visit(nb)

    visit(start)
    return order

graph = {"A": ["B", "C"], "B": ["D"], "C": [], "D": []}
print(dfs(graph, "A"))   # ['A', 'B', 'D', 'C']`,
    explanation:
      "DFS goes deep first. Recursive form is natural. Iterative form uses an explicit stack — useful when recursion depth is a concern.",
  },
  {
    id: "dsa-memoized-fib",
    language: "dsa",
    title: "Memoized fibonacci",
    tag: "dp",
    code: `from functools import cache

# Without memoization, fib(40) takes seconds — fib(100) is intractable.
# @cache stores return values keyed by arguments — turns exponential to linear.
@cache
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(100))   # 354224848179261915075 — instant`,
    explanation:
      "Pure function + overlapping subproblems = perfect for @cache. The same idea underlies dynamic programming.",
  },
  {
    id: "dsa-heap-top-k",
    language: "dsa",
    title: "Top K with a min-heap",
    tag: "heap",
    code: `import heapq

def top_k_largest(items, k):
    h = []
    for x in items:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)            # drop smallest — keep heap size at k
    return sorted(h, reverse=True)

# Time: O(n log k). Space: O(k).
# Faster than sorting + slicing (O(n log n)) when k << n.
print(top_k_largest([3, 1, 5, 12, 2, 11], 3))   # [12, 11, 5]`,
    explanation:
      "Min-heap of size k tracks the k largest. Each push/pop is O(log k). For top-K of huge streams, this is the canonical approach.",
  },
  {
    id: "dsa-hash-twosum",
    language: "dsa",
    title: "Two-sum with a hash",
    tag: "hashmap",
    code: `def two_sum(nums, target):
    # seen maps value -> index of values we've already scanned.
    seen = {}
    for i, x in enumerate(nums):
        complement = target - x
        if complement in seen:
            return (seen[complement], i)
        seen[x] = i
    return None

# Single pass, O(n) — beats nested-loop O(n^2).
print(two_sum([2, 7, 11, 15], 9))   # (0, 1)`,
    explanation:
      "Trade space (the hash) for time. Whenever you'd do nested loops searching for a complement, a hash usually replaces it.",
  },
  {
    id: "dsa-quicksort",
    language: "dsa",
    title: "Quicksort (concise)",
    tag: "sort",
    code: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    less = [x for x in arr if x < pivot]
    eq   = [x for x in arr if x == pivot]
    more = [x for x in arr if x > pivot]
    return quicksort(less) + eq + quicksort(more)

# Avg O(n log n); worst O(n^2) on already-sorted with naive pivot.
print(quicksort([5, 2, 4, 7, 1, 3, 6]))   # [1, 2, 3, 4, 5, 6, 7]`,
    explanation:
      "Concise but allocates a lot. In production: in-place quicksort with random pivot. In Python: just use sorted() — Timsort is O(n log n), stable, and faster.",
  },
  {
    id: "dsa-mergesort",
    language: "dsa",
    title: "Mergesort",
    tag: "sort",
    code: `def mergesort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = mergesort(arr[:mid])
    right = mergesort(arr[mid:])
    return merge(left, right)

def merge(a, b):
    out, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    # Append leftovers (only one of these does anything).
    out.extend(a[i:])
    out.extend(b[j:])
    return out

# Always O(n log n). Stable. Uses O(n) extra memory.
print(mergesort([5, 2, 4, 7, 1, 3, 6]))`,
    explanation:
      "Divide-and-conquer with a clean recurrence T(n) = 2T(n/2) + O(n). Stable, predictable. Mergesort is the foundation Timsort builds on.",
  },
  {
    id: "dsa-linked-list-reverse",
    language: "dsa",
    title: "Reverse a linked list",
    tag: "linked-list",
    code: `class N:
    def __init__(self, val, nxt=None):
        self.val = val
        self.nxt = nxt

def reverse(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.nxt        # save the next node
        cur.nxt = prev       # flip the pointer
        prev = cur           # advance prev
        cur = nxt            # advance cur
    return prev              # new head

# Build 1 -> 2 -> 3, reverse, walk.
head = N(1, N(2, N(3)))
head = reverse(head)
while head:
    print(head.val)          # 3, 2, 1
    head = head.nxt`,
    explanation:
      "Three-pointer pattern: prev / cur / nxt. In-place, O(n) time, O(1) extra space. Classic interview question and a useful primitive.",
  },
  {
    id: "dsa-tree-inorder",
    language: "dsa",
    title: "BST in-order traversal",
    tag: "tree",
    code: `class N:
    def __init__(self, val, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def inorder(node, out):
    if not node:
        return
    inorder(node.left, out)      # all smaller values first
    out.append(node.val)         # then the root
    inorder(node.right, out)     # then larger values

#       4
#      / \\
#     2   6
#    / \\ / \\
#   1  3 5  7
root = N(4, N(2, N(1), N(3)), N(6, N(5), N(7)))

result = []
inorder(root, result)
print(result)   # [1, 2, 3, 4, 5, 6, 7] — sorted!`,
    explanation:
      "In-order on a BST yields sorted values. Pre-order (root, L, R) is good for cloning; post-order (L, R, root) is good for deletion.",
  },
  {
    id: "dsa-dijkstra",
    language: "dsa",
    title: "Dijkstra's shortest path",
    tag: "graph",
    code: `import heapq

def dijkstra(graph, start):
    # graph[node] = [(neighbor, weight), ...]
    dist = {start: 0}
    pq = [(0, start)]            # min-heap of (distance, node)

    while pq:
        d, node = heapq.heappop(pq)
        if d > dist.get(node, float("inf")):
            continue             # stale entry, skip
        for nb, w in graph.get(node, []):
            new_d = d + w
            if new_d < dist.get(nb, float("inf")):
                dist[nb] = new_d
                heapq.heappush(pq, (new_d, nb))
    return dist

g = {"A": [("B", 1), ("C", 4)],
     "B": [("C", 2), ("D", 5)],
     "C": [("D", 1)],
     "D": []}
print(dijkstra(g, "A"))   # {'A': 0, 'B': 1, 'C': 3, 'D': 4}`,
    explanation:
      "Greedy single-source shortest path on weighted graphs with non-negative edges. Min-heap pulls the closest unvisited node each step.",
  },
  {
    id: "dsa-recursion-base",
    language: "dsa",
    title: "Recursion — always have a base case",
    tag: "recursion",
    code: `# Two parts: BASE CASE (where you stop) and RECURSIVE CASE (closer to base).
def factorial(n):
    if n <= 1:                 # base: stop recursing
        return 1
    return n * factorial(n - 1)  # recurse on smaller problem

print(factorial(5))   # 120

# Without a base case, you blow the stack:
# def bad(n): return n + bad(n - 1)   # never stops`,
    explanation:
      "Every recursion needs a base case AND each recursive call must move toward it. Python depth limit ~1000; no tail-call optimization.",
  },
  {
    id: "dsa-counting-sort",
    language: "dsa",
    title: "Counting sort — O(n + k)",
    tag: "sort",
    code: `def counting_sort(arr, k):
    # arr: ints in [0, k). Counting sort beats O(n log n) by sorting WITHOUT comparisons.
    count = [0] * k
    for x in arr:
        count[x] += 1            # tally each value

    # Reconstruct sorted output.
    out = []
    for value, c in enumerate(count):
        out.extend([value] * c)
    return out

print(counting_sort([4, 2, 2, 8, 3, 3, 1], k=10))
# [1, 2, 2, 3, 3, 4, 8]`,
    explanation:
      "Linear sort when values fit in a small range. Tradeoff: O(k) extra space. Used inside radix sort and bucket sort variants.",
  },
  {
    id: "dsa-bigO-cheat",
    language: "dsa",
    title: "Big-O cheat sheet",
    tag: "complexity",
    code: `# Order of growth as n -> infinity. Faster -> slower:
#
# O(1)        constant       array index, hash lookup
# O(log n)    logarithmic    binary search
# O(n)        linear         single loop
# O(n log n)  linearithmic   mergesort, heapsort, Timsort
# O(n^2)      quadratic      nested loops over n
# O(2^n)      exponential    naive recursive subsets
# O(n!)       factorial      brute-force permutations
#
# At n = 1000:
#   O(n^2)  -> 1 million ops    (slow)
#   O(2^n)  -> heat death of universe
#
# Drop constants and lower-order terms. O(3n + 5) = O(n).`,
    explanation:
      "Memorize the curve order. The gap between O(n²) and O(n log n) is the difference between 'works' and 'doesn't' on real-world inputs.",
  },
  {
    id: "dsa-set-vs-list",
    language: "dsa",
    title: "set membership = O(1)",
    tag: "complexity",
    code: `import time

big = list(range(100_000))
big_set = set(big)

# 'in' on a list is O(n) — must scan.
t0 = time.perf_counter()
99999 in big
t1 = time.perf_counter()

# 'in' on a set is O(1) average — hash lookup.
t2 = time.perf_counter()
99999 in big_set
t3 = time.perf_counter()

print(f"list 'in':  {(t1 - t0) * 1e6:.0f} us")
print(f"set  'in':  {(t3 - t2) * 1e6:.0f} us")
# Set is typically 100x+ faster on big collections.`,
    explanation:
      "When you find yourself doing repeated 'in' checks on a list, build a set first. Trade a tiny bit of memory for huge time savings.",
  },
  {
    id: "dsa-dp-coin-change",
    language: "dsa",
    title: "DP — minimum coins",
    tag: "dp",
    code: `def min_coins(amount, coins):
    # dp[a] = min coins to make amount a. INF means unreachable.
    INF = float("inf")
    dp = [0] + [INF] * amount

    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1   # use coin c, plus the best for (a-c)

    return dp[amount] if dp[amount] != INF else -1

print(min_coins(11, [1, 2, 5]))   # 3   (5+5+1)`,
    explanation:
      "Bottom-up DP. Each subproblem dp[a] depends on smaller ones. Pattern reused for unbounded knapsack, ways-to-climb-stairs, and many more.",
  },
  {
    id: "dsa-trie-skeleton",
    language: "dsa",
    title: "Trie (prefix tree) skeleton",
    tag: "tree",
    code: `class TrieNode:
    def __init__(self):
        self.children = {}      # char -> TrieNode
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_end = True

    def search(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return node.is_end

t = Trie()
for w in ["app", "apple", "ape"]:
    t.insert(w)
print(t.search("app"))     # True
print(t.search("appl"))    # False — prefix only`,
    explanation:
      "Tries shine for prefix queries: autocomplete, IP routing, dictionary lookup. O(m) per insert/search where m is the word length.",
  },
];
