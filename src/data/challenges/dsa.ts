// ============================================================
// DSA Challenges — language-agnostic algorithms in Python
// (Pyodide runs them since lang inference treats "dsa:" as python)
// ============================================================

import type { Challenge } from "@/lib/types";

export const dsaChallenges: Challenge[] = [
  // T1 — analysis is theoretical → manual
  {
    id: "dsa-t1-bigo-1", nodeId: "dsa:t1:big-o", type: "predict_output", title: "Identify the complexity",
    description: "What is the time complexity of a function that has two nested for-loops over the same n-element array? Read the solution.",
    difficulty: 1, isBoss: false, lang: "manual", starterCode: "",
    hints: [
      { tier: "nudge", text: "Inner loop runs n times for each iteration of the outer.", xpPenalty: 0.9 },
      { tier: "guide", text: "Total = n * n.", xpPenalty: 0.75 },
      { tier: "reveal", text: `O(n²) — quadratic.`, xpPenalty: 0.5 },
    ],
    baseXP: 80, tags: ["big-o"],
  },
  {
    id: "dsa-t1-time-1", nodeId: "dsa:t1:time-complexity", type: "predict_output", title: "Recurrence to complexity",
    description: "T(n) = 2T(n/2) + O(n). What is the solved complexity?",
    difficulty: 2, isBoss: false, lang: "manual", starterCode: "",
    hints: [
      { tier: "nudge", text: "Master Theorem.", xpPenalty: 0.9 },
      { tier: "guide", text: "f(n)=n, n^(log_2 2) = n. Equal → multiplied by log n.", xpPenalty: 0.75 },
      { tier: "reveal", text: `O(n log n) — same as mergesort.`, xpPenalty: 0.5 },
    ],
    baseXP: 100, tags: ["recurrence"],
  },
  {
    id: "dsa-t1-space-1", nodeId: "dsa:t1:space-complexity", type: "predict_output", title: "In-place reverse space",
    description: "What is the auxiliary space of in-place two-pointer reversal of an array?",
    difficulty: 1, isBoss: false, lang: "manual", starterCode: "",
    hints: [
      { tier: "nudge", text: "Two index variables only.", xpPenalty: 0.9 },
      { tier: "guide", text: "No new array allocated.", xpPenalty: 0.75 },
      { tier: "reveal", text: `O(1) auxiliary space.`, xpPenalty: 0.5 },
    ],
    baseXP: 80, tags: ["space"],
  },

  // T2
  {
    id: "dsa-t2-arr-1", nodeId: "dsa:t2:arrays", type: "write_from_scratch", title: "Reverse via two pointers",
    description: "In-place reverse arr = [1, 2, 3, 4, 5] using two-pointer swap. Print it.",
    difficulty: 2, isBoss: false,
    starterCode: "arr = [1, 2, 3, 4, 5]\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "[5, 4, 3, 2, 1]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Two indices i=0 and j=len-1.", xpPenalty: 0.9 },
      { tier: "guide", text: "Swap arr[i], arr[j], then i+=1, j-=1.", xpPenalty: 0.75 },
      { tier: "reveal", text: `arr = [1, 2, 3, 4, 5]
i, j = 0, len(arr) - 1
while i < j:
    arr[i], arr[j] = arr[j], arr[i]
    i += 1; j -= 1
print(arr)`, xpPenalty: 0.5 },
    ],
    baseXP: 130, tags: ["array", "two-pointer"],
  },
  {
    id: "dsa-t2-ll-1", nodeId: "dsa:t2:linked-lists", type: "write_from_scratch", title: "Reverse linked list",
    description: "Reverse a singly linked list defined inline. Print the values from head: should be 3,2,1.",
    difficulty: 3, isBoss: true,
    starterCode: `class N:
    def __init__(self, v, next=None):
        self.v, self.next = v, next

# 1 -> 2 -> 3
head = N(1, N(2, N(3)))
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "3\n2\n1", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Three pointers: prev, cur, nxt.", xpPenalty: 0.9 },
      { tier: "guide", text: "cur.next = prev; advance.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class N:
    def __init__(self, v, next=None):
        self.v, self.next = v, next
head = N(1, N(2, N(3)))

prev, cur = None, head
while cur:
    nxt = cur.next
    cur.next = prev
    prev = cur
    cur = nxt
head = prev
while head:
    print(head.v)
    head = head.next`, xpPenalty: 0.5 },
    ],
    baseXP: 250, tags: ["linked-list", "reverse"],
  },
  {
    id: "dsa-t2-stack-1", nodeId: "dsa:t2:stacks", type: "write_from_scratch", title: "Balanced brackets",
    description: "Print whether s = '([{}])' is balanced. Expected: True",
    difficulty: 2, isBoss: false,
    starterCode: "s = '([{}])'\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "True", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Push opens, pop and match on closes.", xpPenalty: 0.9 },
      { tier: "guide", text: "Map close → open in a dict.", xpPenalty: 0.75 },
      { tier: "reveal", text: `s = '([{}])'
pairs = {")": "(", "]": "[", "}": "{"}
stack = []
ok = True
for ch in s:
    if ch in "([{": stack.append(ch)
    elif ch in pairs:
        if not stack or stack[-1] != pairs[ch]:
            ok = False; break
        stack.pop()
print(ok and not stack)`, xpPenalty: 0.5 },
    ],
    baseXP: 180, tags: ["stack", "matching"],
  },
  {
    id: "dsa-t2-queue-1", nodeId: "dsa:t2:queues", type: "write_from_scratch", title: "FIFO with deque",
    description: "Use collections.deque to enqueue 1, 2, 3 and dequeue twice. Print the resulting deque as a list.",
    difficulty: 1, isBoss: false,
    starterCode: "from collections import deque\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "[3]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "append + popleft = FIFO.", xpPenalty: 0.9 },
      { tier: "guide", text: "list(q) gives a list view.", xpPenalty: 0.75 },
      { tier: "reveal", text: `from collections import deque
q = deque()
for x in [1,2,3]: q.append(x)
q.popleft(); q.popleft()
print(list(q))`, xpPenalty: 0.5 },
    ],
    baseXP: 100, tags: ["queue", "deque"],
  },

  // T3
  {
    id: "dsa-t3-hash-1", nodeId: "dsa:t3:hash-tables", type: "write_from_scratch", title: "Two-sum (hash)",
    description: "Given nums = [2, 7, 11, 15], target = 9. Print the indices of the two numbers that sum to target. Expected: (0, 1)",
    difficulty: 2, isBoss: true,
    starterCode: "nums = [2, 7, 11, 15]\ntarget = 9\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "(0, 1)", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Hash complement → index.", xpPenalty: 0.9 },
      { tier: "guide", text: "Track seen[value] = index.", xpPenalty: 0.75 },
      { tier: "reveal", text: `nums = [2, 7, 11, 15]
target = 9
seen = {}
for i, x in enumerate(nums):
    if target - x in seen:
        print((seen[target - x], i)); break
    seen[x] = i`, xpPenalty: 0.5 },
    ],
    baseXP: 200, tags: ["hashmap", "two-sum"],
  },
  {
    id: "dsa-t3-tree-1", nodeId: "dsa:t3:binary-trees", type: "write_from_scratch", title: "In-order traversal",
    description: "Traverse the tree shown in the solution and print values in-order. Expected: [4, 2, 5, 1, 3]",
    difficulty: 2, isBoss: false,
    starterCode: `class N:
    def __init__(self, v, l=None, r=None):
        self.v, self.l, self.r = v, l, r
root = N(1, N(2, N(4), N(5)), N(3))
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "[4, 2, 5, 1, 3]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Recursive: left, root, right.", xpPenalty: 0.9 },
      { tier: "guide", text: "Append root value between subtree calls.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class N:
    def __init__(self, v, l=None, r=None):
        self.v, self.l, self.r = v, l, r
root = N(1, N(2, N(4), N(5)), N(3))

out = []
def inorder(n):
    if not n: return
    inorder(n.l); out.append(n.v); inorder(n.r)
inorder(root)
print(out)`, xpPenalty: 0.5 },
    ],
    baseXP: 150, tags: ["tree", "inorder"],
  },
  {
    id: "dsa-t3-bst-1", nodeId: "dsa:t3:bsts", type: "write_from_scratch", title: "BST search",
    description: "Insert [5, 3, 7, 1, 4] then search for 4. Print 'found' or 'missing'. Expected: found",
    difficulty: 2, isBoss: false,
    starterCode: "",
    testCases: [{ id: "tc1", input: "", expectedOutput: "found", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Walk left if target < node, right if greater.", xpPenalty: 0.9 },
      { tier: "guide", text: "Recursive insert + search.", xpPenalty: 0.75 },
      { tier: "reveal", text: `class N:
    def __init__(self, v): self.v, self.l, self.r = v, None, None

def insert(n, v):
    if not n: return N(v)
    if v < n.v: n.l = insert(n.l, v)
    elif v > n.v: n.r = insert(n.r, v)
    return n

def search(n, v):
    if not n: return False
    if v == n.v: return True
    return search(n.l, v) if v < n.v else search(n.r, v)

root = None
for v in [5,3,7,1,4]: root = insert(root, v)
print("found" if search(root, 4) else "missing")`, xpPenalty: 0.5 },
    ],
    baseXP: 180, tags: ["bst", "search"],
  },
  {
    id: "dsa-t3-heap-1", nodeId: "dsa:t3:heaps", type: "write_from_scratch", title: "Top 3 with heap",
    description: "Print top 3 largest of [3, 1, 5, 12, 2, 11] using heapq. Expected: [12, 11, 5]",
    difficulty: 3, isBoss: true,
    starterCode: "import heapq\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "[12, 11, 5]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Min-heap of size k. Drop smallest when full.", xpPenalty: 0.9 },
      { tier: "guide", text: "Sort the heap descending at the end.", xpPenalty: 0.75 },
      { tier: "reveal", text: `import heapq
items = [3, 1, 5, 12, 2, 11]
h = []
for x in items:
    heapq.heappush(h, x)
    if len(h) > 3: heapq.heappop(h)
print(sorted(h, reverse=True))`, xpPenalty: 0.5 },
    ],
    baseXP: 220, tags: ["heap", "top-k"],
  },

  // T4
  {
    id: "dsa-t4-bfs-1", nodeId: "dsa:t4:graphs-bfs", type: "write_from_scratch", title: "BFS order",
    description: "BFS from 'A' on the given graph. Print the visit order as a list. Expected: ['A', 'B', 'C', 'D']",
    difficulty: 2, isBoss: false,
    starterCode: `from collections import deque
graph = {"A": ["B", "C"], "B": ["A", "D"], "C": ["A", "D"], "D": ["B", "C"]}
`,
    testCases: [{ id: "tc1", input: "", expectedOutput: "['A', 'B', 'C', 'D']", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Queue + visited set.", xpPenalty: 0.9 },
      { tier: "guide", text: "Mark visited on enqueue, not dequeue.", xpPenalty: 0.75 },
      { tier: "reveal", text: `from collections import deque
graph = {"A": ["B", "C"], "B": ["A", "D"], "C": ["A", "D"], "D": ["B", "C"]}
visited = {"A"}; q = deque(["A"]); order = []
while q:
    n = q.popleft(); order.append(n)
    for x in graph[n]:
        if x not in visited:
            visited.add(x); q.append(x)
print(order)`, xpPenalty: 0.5 },
    ],
    baseXP: 200, tags: ["graph", "bfs"],
  },
  {
    id: "dsa-t4-dfs-1", nodeId: "dsa:t4:graphs-dfs", type: "write_from_scratch", title: "Connected components",
    description: "Count connected components in {1:[2], 2:[1], 3:[4], 4:[3], 5:[]}. Expected: 3",
    difficulty: 2, isBoss: false,
    starterCode: "",
    testCases: [{ id: "tc1", input: "", expectedOutput: "3", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "DFS from every unvisited node.", xpPenalty: 0.9 },
      { tier: "guide", text: "Each DFS run = one component.", xpPenalty: 0.75 },
      { tier: "reveal", text: `g = {1:[2], 2:[1], 3:[4], 4:[3], 5:[]}
visited = set(); count = 0
for u in g:
    if u in visited: continue
    stack = [u]
    while stack:
        n = stack.pop()
        if n in visited: continue
        visited.add(n); stack.extend(g[n])
    count += 1
print(count)`, xpPenalty: 0.5 },
    ],
    baseXP: 200, tags: ["graph", "dfs"],
  },
  {
    id: "dsa-t4-topo-1", nodeId: "dsa:t4:topo-sort", type: "write_from_scratch", title: "Topological sort",
    description: "Topological order of {'A':['B','C'],'B':['D'],'C':['D'],'D':[]}. Expected: ['A', 'B', 'C', 'D']",
    difficulty: 3, isBoss: true,
    starterCode: "from collections import deque, defaultdict\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "['A', 'B', 'C', 'D']", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Kahn's algorithm: in-degree + queue.", xpPenalty: 0.9 },
      { tier: "guide", text: "Start with all in-degree-0 nodes.", xpPenalty: 0.75 },
      { tier: "reveal", text: `from collections import deque, defaultdict
g = {"A":["B","C"], "B":["D"], "C":["D"], "D":[]}
in_deg = defaultdict(int)
for u in g:
    for v in g[u]: in_deg[v] += 1
q = deque(u for u in g if in_deg[u] == 0)
out = []
while q:
    u = q.popleft(); out.append(u)
    for v in g[u]:
        in_deg[v] -= 1
        if in_deg[v] == 0: q.append(v)
print(out)`, xpPenalty: 0.5 },
    ],
    baseXP: 250, tags: ["topo-sort", "kahn"],
  },

  // T5
  {
    id: "dsa-t5-bs-1", nodeId: "dsa:t5:binary-search", type: "write_from_scratch", title: "Binary search",
    description: "Find index of 7 in [1, 3, 5, 7, 9, 11]. Expected: 3",
    difficulty: 2, isBoss: false,
    starterCode: "arr = [1, 3, 5, 7, 9, 11]\ntarget = 7\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "3", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "lo, hi, mid; halve each step.", xpPenalty: 0.9 },
      { tier: "guide", text: "Compare arr[mid] to target.", xpPenalty: 0.75 },
      { tier: "reveal", text: `arr = [1, 3, 5, 7, 9, 11]
target = 7
lo, hi = 0, len(arr) - 1
ans = -1
while lo <= hi:
    mid = (lo + hi) // 2
    if arr[mid] == target: ans = mid; break
    if arr[mid] < target: lo = mid + 1
    else: hi = mid - 1
print(ans)`, xpPenalty: 0.5 },
    ],
    baseXP: 180, tags: ["binary-search"],
  },
  {
    id: "dsa-t5-tp-1", nodeId: "dsa:t5:two-pointers", type: "write_from_scratch", title: "Pair sum sorted",
    description: "Find indices in [1, 3, 5, 8, 11] that sum to 13 using two pointers. Expected: (1, 3)",
    difficulty: 2, isBoss: false,
    starterCode: "arr = [1, 3, 5, 8, 11]\ntarget = 13\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "(1, 3)", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "lo at start, hi at end. Adjust based on sum.", xpPenalty: 0.9 },
      { tier: "guide", text: "lo += 1 if too small; hi -= 1 if too big.", xpPenalty: 0.75 },
      { tier: "reveal", text: `arr = [1, 3, 5, 8, 11]
target = 13
lo, hi = 0, len(arr) - 1
while lo < hi:
    s = arr[lo] + arr[hi]
    if s == target: print((lo, hi)); break
    if s < target: lo += 1
    else: hi -= 1`, xpPenalty: 0.5 },
    ],
    baseXP: 180, tags: ["two-pointer"],
  },
  {
    id: "dsa-t5-sw-1", nodeId: "dsa:t5:sliding-window", type: "write_from_scratch", title: "Max window sum",
    description: "Print the max sum of any contiguous window of size 3 in [1, 4, 2, 10, 23, 3, 1, 0, 20]. Expected: 35",
    difficulty: 2, isBoss: true,
    starterCode: "arr = [1, 4, 2, 10, 23, 3, 1, 0, 20]\nk = 3\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "35", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Compute first window, then slide.", xpPenalty: 0.9 },
      { tier: "guide", text: "Each step: subtract leaving, add entering.", xpPenalty: 0.75 },
      { tier: "reveal", text: `arr = [1, 4, 2, 10, 23, 3, 1, 0, 20]
k = 3
s = sum(arr[:k]); best = s
for i in range(k, len(arr)):
    s += arr[i] - arr[i-k]
    if s > best: best = s
print(best)`, xpPenalty: 0.5 },
    ],
    baseXP: 200, tags: ["sliding-window"],
  },
  {
    id: "dsa-t5-sort-1", nodeId: "dsa:t5:sorting", type: "write_from_scratch", title: "Multi-key sort",
    description: "Sort people = [('Ada', 36), ('Linus', 36), ('Grace', 50)] by age then name. Print the result.",
    difficulty: 2, isBoss: false,
    starterCode: "people = [('Ada', 36), ('Linus', 36), ('Grace', 50)]\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "[('Ada', 36), ('Linus', 36), ('Grace', 50)]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "key=lambda p: (p[1], p[0])", xpPenalty: 0.9 },
      { tier: "guide", text: "Tuple keys sort lexicographically.", xpPenalty: 0.75 },
      { tier: "reveal", text: `people = [('Ada', 36), ('Linus', 36), ('Grace', 50)]
print(sorted(people, key=lambda p: (p[1], p[0])))`, xpPenalty: 0.5 },
    ],
    baseXP: 150, tags: ["sort", "multi-key"],
  },

  // T6
  {
    id: "dsa-t6-rec-1", nodeId: "dsa:t6:recursion", type: "write_from_scratch", title: "Recursive sum",
    description: "Sum [3, 1, 4, 1, 5] recursively. Expected: 14",
    difficulty: 1, isBoss: false,
    starterCode: "arr = [3, 1, 4, 1, 5]\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "14", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Base case: empty list → 0.", xpPenalty: 0.9 },
      { tier: "guide", text: "rec(arr) = arr[0] + rec(arr[1:]).", xpPenalty: 0.75 },
      { tier: "reveal", text: `arr = [3, 1, 4, 1, 5]
def s(a):
    if not a: return 0
    return a[0] + s(a[1:])
print(s(arr))`, xpPenalty: 0.5 },
    ],
    baseXP: 100, tags: ["recursion"],
  },
  {
    id: "dsa-t6-dp-1", nodeId: "dsa:t6:dp", type: "write_from_scratch", title: "Climbing stairs",
    description: "Number of distinct ways to climb 10 steps taking 1 or 2 at a time. Expected: 89",
    difficulty: 2, isBoss: true,
    starterCode: "n = 10\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "89", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "ways(n) = ways(n-1) + ways(n-2).", xpPenalty: 0.9 },
      { tier: "guide", text: "Iterate with two variables.", xpPenalty: 0.75 },
      { tier: "reveal", text: `n = 10
a, b = 1, 2
for _ in range(3, n+1):
    a, b = b, a + b
print(b)`, xpPenalty: 0.5 },
    ],
    baseXP: 200, tags: ["dp", "fib-like"],
  },
  {
    id: "dsa-t6-greedy-1", nodeId: "dsa:t6:greedy", type: "write_from_scratch", title: "Activity selection",
    description: "Max non-overlapping intervals from [(1,4),(2,3),(3,5),(0,6),(5,7),(8,9)]. Expected: 4",
    difficulty: 3, isBoss: false,
    starterCode: "intervals = [(1,4),(2,3),(3,5),(0,6),(5,7),(8,9)]\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "4", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Sort by end time.", xpPenalty: 0.9 },
      { tier: "guide", text: "Pick if its start >= last picked end.", xpPenalty: 0.75 },
      { tier: "reveal", text: `intervals = [(1,4),(2,3),(3,5),(0,6),(5,7),(8,9)]
intervals.sort(key=lambda x: x[1])
end = float("-inf"); count = 0
for s, e in intervals:
    if s >= end: count += 1; end = e
print(count)`, xpPenalty: 0.5 },
    ],
    baseXP: 220, tags: ["greedy", "scheduling"],
  },
  {
    id: "dsa-t6-bt-1", nodeId: "dsa:t6:backtracking", type: "write_from_scratch", title: "All subsets",
    description: "All subsets of [1, 2, 3]. Print as a list of lists in the same order as the solution.",
    difficulty: 3, isBoss: true,
    starterCode: "arr = [1, 2, 3]\n",
    testCases: [{ id: "tc1", input: "", expectedOutput: "[[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]", visible: true, category: "basic" }],
    hints: [
      { tier: "nudge", text: "Backtracking: pick / recurse / unpick.", xpPenalty: 0.9 },
      { tier: "guide", text: "Track a start index to avoid duplicates.", xpPenalty: 0.75 },
      { tier: "reveal", text: `arr = [1, 2, 3]
out = []
def back(start, path):
    out.append(path[:])
    for i in range(start, len(arr)):
        path.append(arr[i])
        back(i + 1, path)
        path.pop()
back(0, [])
print(out)`, xpPenalty: 0.5 },
    ],
    baseXP: 250, tags: ["backtracking", "subsets"],
  },
];
