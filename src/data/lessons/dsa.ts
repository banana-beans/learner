// ============================================================
// DSA — All Tiers (T1–T6)
// ============================================================
// Algorithms are language-agnostic. Lesson code uses Python.
// ============================================================

import type { LessonContent } from "./python-basics";

export const dsaLessons: Record<string, LessonContent> = {
  // ── T1 ──────────────────────────────────────────────────
  "dsa:t1:big-o": {
    nodeId: "dsa:t1:big-o", title: "Big-O Notation",
    sections: [
      { heading: "What Big-O Measures", body: "Big-O describes how runtime (or memory) grows as input size n grows. It ignores constants and lower-order terms. O(2n) and O(100n) are both O(n). What matters is the shape of the curve as n becomes large." },
      { heading: "The Big Six", body: "O(1) constant — array index. O(log n) — binary search. O(n) — single loop. O(n log n) — comparison sorts. O(n²) — nested loops. O(2ⁿ) — naive recursion (subsets). Plot them: at n=1000, O(n²) is a million ops; O(2ⁿ) is the heat death of the universe." },
      { heading: "Best, Average, Worst", body: "Most analysis cares about worst case (Big-O). Average case (Big-θ) is sometimes more honest (e.g. quicksort is O(n²) worst, O(n log n) average — and we still use it because the average dominates in practice)." },
    ],
    codeExamples: [
      { title: "Constant vs linear", code: `# O(1) — independent of n
def first(items):
    return items[0]

# O(n) — touches every element
def total(items):
    s = 0
    for x in items:
        s += x
    return s`, explanation: "Index access is constant; summing is linear in the size of the list." },
      { title: "Quadratic", code: `# O(n²) — nested loops
def has_duplicate(items):
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            if items[i] == items[j]:
                return True
    return False`, explanation: "n² pairs to compare. Faster: use a set (O(n))." },
      { title: "Logarithmic", code: `# O(log n) — halves the search space each step
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target: return mid
        if arr[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1`, explanation: "After k steps the range is n / 2^k. Solve for k: log₂ n." },
    ],
    keyTakeaways: ["Big-O describes growth as n → ∞", "Constants and lower-order terms are dropped", "Memorize the curve order: 1 < log n < n < n log n < n² < 2ⁿ", "Quadratic is the death zone for n > a few thousand", "Worst case is the default; average matters in practice"],
  },
  "dsa:t1:time-complexity": {
    nodeId: "dsa:t1:time-complexity", title: "Time Complexity Analysis",
    sections: [
      { heading: "Counting Operations", body: "Walk through the code; count loops, recursive calls, and the work done per call. A loop that runs n times doing O(1) work is O(n). Two nested loops both n long give O(n²). Sequential loops add: O(n) + O(m) = O(n + m)." },
      { heading: "Recursion Recurrences", body: "T(n) = a·T(n/b) + f(n). Master Theorem: compare f(n) to n^(log_b a). Mergesort: T(n) = 2T(n/2) + O(n) → O(n log n). Naive Fibonacci: T(n) = T(n-1) + T(n-2) → ~O(2ⁿ)." },
      { heading: "Amortized Analysis", body: "Some operations are usually fast and occasionally slow. Python's list .append is O(1) amortized — every doubling makes one O(n) copy, but averaged over many appends it's constant. Always factor in amortization for the right answer." },
    ],
    codeExamples: [
      { title: "Loops add and multiply", code: `# O(n + m), not O(n*m)
def two_loops(a, b):
    for x in a: pass
    for y in b: pass

# O(n*m)
def nested(a, b):
    for x in a:
        for y in b:
            pass`, explanation: "Sequential loops add complexities. Nested ones multiply." },
      { title: "Recursion analysis", code: `# T(n) = T(n-1) + O(1)  → O(n)
def fact(n):
    if n <= 1: return 1
    return n * fact(n - 1)

# T(n) = T(n-1) + T(n-2)  → ~O(2^n)
def fib(n):
    return n if n < 2 else fib(n-1) + fib(n-2)`, explanation: "Single recursive call is linear. Branching recursion explodes." },
      { title: "Amortized append", code: `lst = []
for i in range(10**6):
    lst.append(i)   # O(1) amortized — even with periodic resize`, explanation: "Resize doubles capacity. The big copy is rare; averaged out, append is constant." },
    ],
    keyTakeaways: ["Sequential loops add: O(n) + O(m) = O(n + m)", "Nested loops multiply: O(n*m)", "Single recursive call shrinking by 1 = O(n)", "Branching recursion (T(n-1) + T(n-2)) is exponential", "Amortized analysis matters for dynamic arrays and hash tables"],
  },
  "dsa:t1:space-complexity": {
    nodeId: "dsa:t1:space-complexity", title: "Space Complexity",
    sections: [
      { heading: "Auxiliary vs Total Space", body: "Auxiliary space is what your algorithm allocates beyond the input. Total includes the input. Reverse-in-place uses O(1) auxiliary; reverse-into-new-list uses O(n)." },
      { heading: "Recursion Stack", body: "Recursive calls cost stack frames. Naive recursive sum of an n-element list uses O(n) stack — possibly worse than the iterative version. Tail recursion would help, but Python doesn't optimize it." },
      { heading: "Hash Tables Aren't Free", body: "Dedup with a set is fast (O(n)) but O(n) extra space. In-place techniques are usually slower constants but tiny memory. Pick by what's scarce." },
    ],
    codeExamples: [
      { title: "In-place vs new list", code: `# O(n) extra space
def reversed_copy(arr):
    return arr[::-1]

# O(1) extra space (in-place)
def reverse_in_place(arr):
    i, j = 0, len(arr) - 1
    while i < j:
        arr[i], arr[j] = arr[j], arr[i]
        i += 1; j -= 1
    return arr`, explanation: "Slicing creates a new list. Two-pointer swap mutates in place." },
      { title: "Recursion uses stack", code: `# O(n) stack space
def rec_sum(arr, i=0):
    if i == len(arr): return 0
    return arr[i] + rec_sum(arr, i + 1)

# O(1) stack space
def iter_sum(arr):
    s = 0
    for x in arr: s += x
    return s`, explanation: "Each recursive call adds a frame. The iterative version reuses one frame." },
      { title: "Set tradeoff", code: `# O(n) time, O(n) space
def has_dup_set(arr):
    seen = set()
    for x in arr:
        if x in seen: return True
        seen.add(x)
    return False

# O(n²) time, O(1) space
def has_dup_naive(arr):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j]: return True
    return False`, explanation: "Hash set trades memory for speed. The right choice depends on which is scarce." },
    ],
    keyTakeaways: ["Auxiliary space = what you allocate beyond input", "Recursion uses O(depth) stack space", "In-place algorithms save memory but often have trickier code", "Hash tables turn time into space — useful when memory is cheap", "Always state both time AND space when analyzing"],
  },

  // ── T2 ──────────────────────────────────────────────────
  "dsa:t2:arrays": {
    nodeId: "dsa:t2:arrays", title: "Arrays / Dynamic Arrays",
    sections: [
      { heading: "What An Array Is", body: "Contiguous memory, fixed-size elements, O(1) random access via index. C-style arrays have fixed length; Python lists are dynamic arrays — they resize automatically by doubling when full." },
      { heading: "Cost Of Operations", body: "Random access: O(1). Append (amortized): O(1). Insert/delete at index i: O(n) because everything after must shift. Pop from end: O(1). Pop from front: O(n)." },
      { heading: "Common Pitfalls", body: "Inserting in the middle in a loop is O(n²). If you need many front operations, use collections.deque (O(1) both ends). If you need O(1) lookup by key, use a dict — not a list with linear search." },
    ],
    codeExamples: [
      { title: "Array operations", code: `lst = [10, 20, 30]
print(lst[1])           # 20 — O(1)
lst.append(40)          # O(1) amortized
lst.insert(0, 0)        # O(n) — everything shifts
lst.pop()               # O(1) — pop from end
lst.pop(0)              # O(n) — pop from front
print(lst)`, explanation: "Index, append, pop-from-end are fast. Inserting and popping at the front are linear." },
      { title: "When NOT to use a list", code: `from collections import deque

# Front + back O(1)
q = deque([1, 2, 3])
q.appendleft(0)         # O(1)
q.popleft()             # O(1)
print(q)                # deque([1, 2, 3])`, explanation: "deque (double-ended queue) gives O(1) at both ends." },
      { title: "Dynamic resize behavior", code: `import sys
lst = []
for i in range(20):
    lst.append(i)
    print(len(lst), sys.getsizeof(lst))`, explanation: "Capacity grows in jumps. Each jump is O(n) but amortizes to O(1) per append." },
    ],
    keyTakeaways: ["Arrays = contiguous memory + O(1) index", "Append is O(1) amortized; insert/delete in middle is O(n)", "Don't insert at index 0 in a loop — use deque", "Python lists are dynamic arrays under the hood", "For key-based lookup, prefer dict over list+linear search"],
  },
  "dsa:t2:linked-lists": {
    nodeId: "dsa:t2:linked-lists", title: "Linked Lists",
    sections: [
      { heading: "Nodes And Pointers", body: "Each node has a value and a pointer to the next node (and optionally previous). Insert/delete at any known node is O(1) — just rewire pointers. But finding a node is O(n) since you must traverse." },
      { heading: "Singly vs Doubly", body: "Singly linked: one next pointer. Doubly: next + prev. Doubly costs more memory but supports O(1) backwards traversal and node removal given a reference." },
      { heading: "When To Reach For One", body: "Real answer: rarely in Python. List or deque covers most cases. Linked lists shine in low-level work (kernels, allocators) and in implementing other structures (LRU cache uses doubly linked list + hash map)." },
    ],
    codeExamples: [
      { title: "Singly linked list", code: `class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

# build 1 -> 2 -> 3
head = Node(1, Node(2, Node(3)))

# traverse
cur = head
while cur:
    print(cur.val)
    cur = cur.next`, explanation: "Walk forward via next. No random access — O(n) to find the kth node." },
      { title: "Reverse a list", code: `def reverse(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev`, explanation: "Three pointers, in-place. Classic interview question." },
      { title: "Remove node O(1) given reference", code: `def remove_node(node):
    # only works if node is not the tail
    node.val = node.next.val
    node.next = node.next.next`, explanation: "Trick: copy successor's value, then skip it. Doesn't work for the tail." },
    ],
    keyTakeaways: ["Linked lists trade indexing speed for cheap insertion", "Find: O(n); insert/delete with reference: O(1)", "Singly = one pointer; doubly = two", "Reversing in-place is the canonical interview problem", "In Python, prefer list / deque unless you have a reason"],
  },
  "dsa:t2:stacks": {
    nodeId: "dsa:t2:stacks", title: "Stacks",
    sections: [
      { heading: "LIFO", body: "Last in, first out. Operations: push, pop, peek (top without removing). Implemented with an array — append/pop from the end, both O(1)." },
      { heading: "Where They Show Up", body: "Function call frames (the call stack). Expression evaluation. DFS via explicit stack. Undo history. Matched-brackets problems. Browser history." },
      { heading: "Monotonic Stacks", body: "A stack that maintains an invariant (e.g. strictly increasing) by popping until the new element fits. Powerful for problems like next-greater-element in O(n) total." },
    ],
    codeExamples: [
      { title: "Python list as stack", code: `stack = []
stack.append(1)
stack.append(2)
stack.append(3)
print(stack.pop())   # 3
print(stack[-1])     # 2 (peek)`, explanation: "Use append/pop on a list. Peek is just stack[-1]." },
      { title: "Balanced brackets", code: `def is_balanced(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
    return not stack

print(is_balanced("([])"))   # True
print(is_balanced("([)]"))   # False`, explanation: "Push opens; pop and match on closes. Balanced if stack ends empty." },
      { title: "Monotonic stack — next greater", code: `def next_greater(arr):
    res = [-1] * len(arr)
    stack = []  # indices
    for i, x in enumerate(arr):
        while stack and arr[stack[-1]] < x:
            res[stack.pop()] = x
        stack.append(i)
    return res

print(next_greater([2, 1, 3, 0, 5]))
# [3, 3, 5, 5, -1]`, explanation: "Each index pushed once and popped once → O(n)." },
    ],
    keyTakeaways: ["Stack = LIFO; push/pop/peek all O(1)", "Implement with a Python list (append/pop)", "Used for matching, evaluation, DFS, undo", "Monotonic stacks solve next-greater patterns in O(n)", "The function call stack is a stack"],
  },
  "dsa:t2:queues": {
    nodeId: "dsa:t2:queues", title: "Queues & Deques",
    sections: [
      { heading: "FIFO", body: "First in, first out. Enqueue at the back, dequeue from the front. O(1) both ends. Underlies BFS, scheduling, producer-consumer pipelines." },
      { heading: "Use deque", body: "Python's collections.deque is a doubly linked structure with O(1) operations at both ends. Don't use a list as a queue: list.pop(0) is O(n)." },
      { heading: "Queue Variants", body: "Priority queue: dequeue the min/max — use heapq. Circular buffer: fixed-size deque(maxlen=k). Multi-producer thread-safe queue: queue.Queue from stdlib." },
    ],
    codeExamples: [
      { title: "deque as queue", code: `from collections import deque

q = deque()
q.append(1)        # enqueue
q.append(2)
print(q.popleft()) # 1 — dequeue
print(q.popleft()) # 2`, explanation: "append + popleft = O(1) FIFO." },
      { title: "BFS skeleton", code: `from collections import deque

def bfs(start, neighbors):
    visited = {start}
    q = deque([start])
    while q:
        node = q.popleft()
        # ... visit node ...
        for nxt in neighbors(node):
            if nxt not in visited:
                visited.add(nxt)
                q.append(nxt)`, explanation: "Queue + visited set is the BFS pattern." },
      { title: "Circular buffer (last N)", code: `from collections import deque
recent = deque(maxlen=3)
for x in [1,2,3,4,5]:
    recent.append(x)
print(list(recent))  # [3, 4, 5]`, explanation: "maxlen drops oldest items automatically." },
    ],
    keyTakeaways: ["Queue = FIFO; O(1) enqueue and dequeue with deque", "Don't use list.pop(0) — that's O(n)", "BFS uses a queue; DFS uses a stack", "deque(maxlen=k) = circular buffer", "heapq for priority queues; queue.Queue for thread-safe"],
  },

  // ── T3 ──────────────────────────────────────────────────
  "dsa:t3:hash-tables": {
    nodeId: "dsa:t3:hash-tables", title: "Hash Tables",
    sections: [
      { heading: "Buckets And Hashing", body: "A hash table maps keys to buckets via a hash function. Average O(1) for insert/lookup/delete. Worst case O(n) when hash collides badly. Python's dict is a hash table; so is set." },
      { heading: "Collision Strategies", body: "Chaining: each bucket holds a list of entries. Open addressing (Python uses this): probe to the next bucket on collision. Load factor (entries/buckets) controls speed; resize triggers when it gets too high." },
      { heading: "Hashable Keys", body: "Keys must be hashable: same hash for equal objects, immutable equality. Strings, numbers, tuples of hashables work. Lists, dicts, sets — don't (mutable)." },
    ],
    codeExamples: [
      { title: "dict and set", code: `prices = {"apple": 1.0, "banana": 0.5}
print(prices["apple"])   # 1.0 — O(1) average
print("cherry" in prices) # False — O(1)

s = {1, 2, 3}
print(2 in s)            # O(1)`, explanation: "dict / set provide O(1) lookup average." },
      { title: "Counting", code: `from collections import Counter
text = "the quick brown fox jumps over the lazy dog"
counts = Counter(text.split())
print(counts.most_common(3))`, explanation: "Counter is a dict subclass for counting." },
      { title: "Custom hashable", code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __eq__(self, other):
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)
    def __hash__(self):
        return hash((self.x, self.y))

s = {Point(1, 2), Point(1, 2)}
print(len(s))  # 1 — equal Points hash to the same bucket`, explanation: "Override __eq__ and __hash__ together for custom keys." },
    ],
    keyTakeaways: ["Hash tables give average O(1); worst case O(n)", "Python dict/set use open addressing with random probing", "Keys must be hashable: equal-by-value + immutable-for-hash", "Override __eq__ AND __hash__ together on custom classes", "Counter, defaultdict — common dict-based tools"],
  },
  "dsa:t3:binary-trees": {
    nodeId: "dsa:t3:binary-trees", title: "Binary Trees",
    sections: [
      { heading: "Structure", body: "A node with up to two children: left and right. Height = longest root-to-leaf path. Balanced height is O(log n); a degenerate tree is O(n). General binary trees aren't sorted — that's BSTs." },
      { heading: "Traversals", body: "Pre-order: root, left, right (good for cloning). In-order: left, root, right (sorted on a BST). Post-order: left, right, root (good for deletion). Level-order (BFS): use a queue." },
      { heading: "Recursion Is Natural", body: "Most tree algorithms are: solve for left subtree, solve for right subtree, combine. Base case: None (empty subtree). The recursion follows the structure of the tree." },
    ],
    codeExamples: [
      { title: "Tree node", code: `class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

#        1
#       / \\
#      2   3
#     / \\
#    4   5
root = Node(1, Node(2, Node(4), Node(5)), Node(3))`, explanation: "Each node holds a value and optional left/right children." },
      { title: "Recursive traversals", code: `def inorder(node, out):
    if not node: return
    inorder(node.left, out)
    out.append(node.val)
    inorder(node.right, out)

result = []
inorder(root, result)
print(result)  # [4, 2, 5, 1, 3]`, explanation: "Visit left subtree, then root, then right." },
      { title: "Level-order with queue", code: `from collections import deque

def level_order(root):
    if not root: return []
    out, q = [], deque([root])
    while q:
        node = q.popleft()
        out.append(node.val)
        if node.left: q.append(node.left)
        if node.right: q.append(node.right)
    return out

print(level_order(root))  # [1, 2, 3, 4, 5]`, explanation: "BFS — visit by depth. Queue is essential here." },
    ],
    keyTakeaways: ["Binary tree node has left and right children", "Pre/in/post-order are recursion shapes", "In-order on a BST yields sorted values", "Level-order = BFS with a queue", "Most tree problems solve via recursion"],
  },
  "dsa:t3:bsts": {
    nodeId: "dsa:t3:bsts", title: "Binary Search Trees",
    sections: [
      { heading: "BST Property", body: "For every node, left subtree values < node value < right subtree values. This invariant means search runs O(height): O(log n) if balanced, O(n) if degenerate (e.g. inserting sorted values into an unbalanced BST)." },
      { heading: "Operations", body: "Search/insert: walk down, comparing. Delete is the tricky one: leaf — just remove; one child — splice out; two children — replace with in-order successor (leftmost of right subtree)." },
      { heading: "Self-Balancing", body: "Plain BSTs degrade with bad insertion order. AVL trees and red-black trees rebalance on insert/delete to keep height O(log n). Most languages' sorted maps use red-black under the hood. Python doesn't have one in stdlib — use sortedcontainers.SortedDict." },
    ],
    codeExamples: [
      { title: "BST insert", code: `class N:
    def __init__(self, val): self.val, self.left, self.right = val, None, None

def insert(root, val):
    if not root: return N(val)
    if val < root.val:
        root.left = insert(root.left, val)
    elif val > root.val:
        root.right = insert(root.right, val)
    return root

root = None
for v in [5, 3, 7, 1, 4]: root = insert(root, v)`, explanation: "Recursive insert. Returns root each time so parent links are updated." },
      { title: "Search", code: `def search(node, target):
    if not node: return None
    if target == node.val: return node
    return search(node.left, target) if target < node.val else search(node.right, target)

print(search(root, 4).val)  # 4
print(search(root, 99))     # None`, explanation: "Halve the search space at each step — O(height)." },
      { title: "In-order = sorted", code: `def inorder(node, out):
    if not node: return
    inorder(node.left, out)
    out.append(node.val)
    inorder(node.right, out)

result = []
inorder(root, result)
print(result)  # [1, 3, 4, 5, 7]`, explanation: "BST in-order traversal is the most elegant way to enumerate sorted values." },
    ],
    keyTakeaways: ["BST: left < node < right at every node", "Operations are O(height); height is O(log n) when balanced", "Worst-case unbalanced BST = O(n) — same as a linked list", "Self-balancing trees (AVL, red-black) keep height log", "In-order traversal of a BST yields sorted values"],
  },
  "dsa:t3:heaps": {
    nodeId: "dsa:t3:heaps", title: "Heaps & Priority Queues",
    sections: [
      { heading: "Heap Property", body: "A binary heap is a complete binary tree where every parent satisfies an ordering with its children. Min-heap: parent ≤ children. Max-heap: parent ≥ children. Implemented as an array; parent of i is (i-1)//2." },
      { heading: "Operations", body: "push (add at end, sift up): O(log n). pop (remove root, fill with last, sift down): O(log n). peek root: O(1). heapify a list: O(n) — surprisingly linear via bottom-up siftdown." },
      { heading: "Use Cases", body: "Priority queues for Dijkstra/A*. Top-K problems (use a min-heap of size K). Median maintenance with two heaps. Event scheduling. Python: heapq is min-heap only — for max, push the negation." },
    ],
    codeExamples: [
      { title: "heapq basics", code: `import heapq

h = []
heapq.heappush(h, 3)
heapq.heappush(h, 1)
heapq.heappush(h, 2)
print(heapq.heappop(h))  # 1
print(heapq.heappop(h))  # 2
print(heapq.heappop(h))  # 3`, explanation: "heappush + heappop maintain the heap invariant. Min-heap by default." },
      { title: "Top-K largest", code: `import heapq

def top_k(items, k):
    h = []
    for x in items:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)  # drop smallest
    return sorted(h, reverse=True)

print(top_k([3, 1, 5, 12, 2, 11], 3))  # [12, 11, 5]`, explanation: "Maintain a min-heap of size k. Total: O(n log k)." },
      { title: "heapify is O(n)", code: `import heapq
arr = [5, 3, 8, 1, 4]
heapq.heapify(arr)         # in-place, O(n)
print(arr[0])              # 1 — smallest
print(heapq.heappop(arr))  # 1`, explanation: "Bottom-up siftdown is O(n) — faster than n pushes (which would be O(n log n))." },
    ],
    keyTakeaways: ["Heap = complete binary tree with order between parent and children", "Push/pop are O(log n); peek is O(1); heapify is O(n)", "Python's heapq is min-heap; negate values for max-heap", "Top-K pattern: maintain a heap of size K", "Backbone of priority queues, Dijkstra, A*, Huffman coding"],
  },

  // ── T4 ──────────────────────────────────────────────────
  "dsa:t4:graphs-bfs": {
    nodeId: "dsa:t4:graphs-bfs", title: "Graphs & BFS",
    sections: [
      { heading: "Graph Representations", body: "Adjacency list: dict of node → list of neighbors. O(V + E) total memory. Adjacency matrix: 2D array, O(V²) memory — only worth it for very dense graphs. Lists win in practice." },
      { heading: "Breadth-First Search", body: "Explore neighbors before going deeper — wave outward from the start. Uses a queue. Discovers shortest path in number-of-edges (unweighted graphs). Mark visited as you enqueue, not when you dequeue, to avoid re-adding." },
      { heading: "When BFS Beats DFS", body: "Shortest path on unweighted graphs. Level-order tree traversal. 'Find anything within k steps'. For weighted graphs, you need Dijkstra (BFS with a heap)." },
    ],
    codeExamples: [
      { title: "Adjacency list", code: `graph = {
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A", "D"],
    "D": ["B", "C"],
}`, explanation: "Common Pythonic representation — dict mapping each node to its neighbors." },
      { title: "BFS", code: `from collections import deque

def bfs(graph, start):
    visited = {start}
    q = deque([start])
    order = []
    while q:
        node = q.popleft()
        order.append(node)
        for n in graph[node]:
            if n not in visited:
                visited.add(n)
                q.append(n)
    return order

print(bfs(graph, "A"))  # ['A', 'B', 'C', 'D']`, explanation: "Mark visited on enqueue. Each edge is explored at most twice." },
      { title: "Shortest path BFS", code: `from collections import deque

def shortest(graph, start, end):
    if start == end: return 0
    q = deque([(start, 0)])
    visited = {start}
    while q:
        node, dist = q.popleft()
        for n in graph[node]:
            if n == end: return dist + 1
            if n not in visited:
                visited.add(n)
                q.append((n, dist + 1))
    return -1

print(shortest(graph, "A", "D"))  # 2`, explanation: "BFS gives shortest distance on unweighted graphs." },
    ],
    keyTakeaways: ["Use adjacency list (dict of lists) for most graphs", "BFS explores by depth — shortest path in edges on unweighted graphs", "Mark visited on enqueue, not dequeue", "Queue is essential — using a stack gives DFS instead", "For weighted graphs, use Dijkstra"],
  },
  "dsa:t4:graphs-dfs": {
    nodeId: "dsa:t4:graphs-dfs", title: "DFS & Cycle Detection",
    sections: [
      { heading: "Depth-First Search", body: "Go deep before going wide. Recursion is the natural implementation; or use an explicit stack. Useful for cycle detection, topological sort, finding connected components, exhaustive search." },
      { heading: "Cycle Detection", body: "On undirected: DFS, if you reach an already-visited neighbor that isn't your parent, there's a cycle. On directed: track three colors — unvisited (white), on stack (gray), done (black). A back edge to a gray node = cycle." },
      { heading: "Connected Components", body: "Count components by running DFS from every unvisited node. Each DFS run discovers one component. Same idea applies to flood-fill, island counting, and many grid problems." },
    ],
    codeExamples: [
      { title: "Recursive DFS", code: `def dfs(graph, node, visited=None):
    if visited is None: visited = set()
    visited.add(node)
    print(node)
    for n in graph[node]:
        if n not in visited:
            dfs(graph, n, visited)
    return visited

graph = {"A": ["B", "C"], "B": ["D"], "C": [], "D": []}
dfs(graph, "A")  # A B D C`, explanation: "Recursion follows the tree of unvisited neighbors." },
      { title: "Cycle in undirected", code: `def has_cycle_undirected(graph, node, parent=None, visited=None):
    if visited is None: visited = set()
    visited.add(node)
    for n in graph[node]:
        if n not in visited:
            if has_cycle_undirected(graph, n, node, visited): return True
        elif n != parent:
            return True
    return False

graph = {1: [2], 2: [1, 3], 3: [2, 4], 4: [3, 1]}  # has cycle
graph[1].append(4)
print(has_cycle_undirected(graph, 1))`, explanation: "If a neighbor is already visited and isn't the parent, you've closed a cycle." },
      { title: "Connected components", code: `def components(graph):
    visited = set()
    count = 0
    for node in graph:
        if node not in visited:
            stack = [node]
            while stack:
                n = stack.pop()
                if n in visited: continue
                visited.add(n)
                stack.extend(graph[n])
            count += 1
    return count

g = {1: [2], 2: [1], 3: [4], 4: [3], 5: []}
print(components(g))  # 3`, explanation: "Run DFS from every unvisited node; each run = one component." },
    ],
    keyTakeaways: ["DFS goes deep first — recursion or explicit stack", "Cycle in undirected: visited neighbor that isn't parent", "Cycle in directed: back edge to a node on the recursion stack", "DFS counts connected components in O(V+E)", "Flood-fill is just DFS or BFS on a grid"],
  },
  "dsa:t4:topo-sort": {
    nodeId: "dsa:t4:topo-sort", title: "Topological Sort",
    sections: [
      { heading: "What It Does", body: "Orders the nodes of a DAG so every edge goes from earlier to later. Use cases: build systems (compile order), course prereqs, task scheduling, deadlock-free resource ordering. Cyclic graphs have no topo order." },
      { heading: "Kahn's Algorithm", body: "Compute in-degrees. Queue all nodes with in-degree 0. Repeatedly: pop a node, output it, decrement neighbors' in-degrees, enqueue those that hit 0. If you didn't output every node, the graph has a cycle." },
      { heading: "DFS Method", body: "Run DFS; on finish, prepend the node to the output list. The reverse order of finish times is a topo order. Slightly trickier to detect cycles but reuses the DFS skeleton." },
    ],
    codeExamples: [
      { title: "Kahn's algorithm", code: `from collections import deque, defaultdict

def topo_kahn(graph):
    in_deg = defaultdict(int)
    for u in graph:
        for v in graph[u]:
            in_deg[v] += 1
    q = deque(u for u in graph if in_deg[u] == 0)
    out = []
    while q:
        u = q.popleft()
        out.append(u)
        for v in graph[u]:
            in_deg[v] -= 1
            if in_deg[v] == 0:
                q.append(v)
    return out if len(out) == len(graph) else None  # None on cycle

graph = {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []}
print(topo_kahn(graph))  # ['A', 'B', 'C', 'D']`, explanation: "Process zero-in-degree nodes first. If you can't process them all, there's a cycle." },
      { title: "DFS-based topo", code: `def topo_dfs(graph):
    visited = set()
    out = []
    def dfs(u):
        visited.add(u)
        for v in graph[u]:
            if v not in visited: dfs(v)
        out.append(u)  # post-order
    for u in graph:
        if u not in visited: dfs(u)
    return out[::-1]

print(topo_dfs(graph))  # one valid topo order`, explanation: "Reverse post-order is a topo order. Doesn't detect cycles by itself — add a 'gray' set." },
      { title: "Course schedule", code: `# Can you finish all courses given prereqs?
def can_finish(num_courses, prereqs):
    graph = {i: [] for i in range(num_courses)}
    for c, p in prereqs:
        graph[p].append(c)
    # Try Kahn — return True iff a valid topo exists
    return topo_kahn(graph) is not None

print(can_finish(2, [[1, 0]]))         # True
print(can_finish(2, [[1, 0], [0, 1]])) # False — cycle`, explanation: "Cycle detection via topo. Classic LeetCode problem." },
    ],
    keyTakeaways: ["Topological sort orders a DAG so edges go forward", "Kahn's algorithm: BFS on in-degrees", "DFS-based: post-order, then reverse", "Output size != node count ⇒ cycle (no topo order)", "Used in build systems, course prereqs, task scheduling"],
  },

  // ── T5 ──────────────────────────────────────────────────
  "dsa:t5:binary-search": {
    nodeId: "dsa:t5:binary-search", title: "Binary Search",
    sections: [
      { heading: "On Sorted Arrays", body: "Search a sorted array in O(log n) by repeatedly halving. Maintain a [lo, hi] window. Compare middle to target; shrink one side. Off-by-one bugs are the #1 source of binary search pain." },
      { heading: "Predicate-Based", body: "Generalize: find the smallest index where some monotonic predicate is true. Many problems reduce to this — minimum capacity, minimum days, smallest valid x. Classic 'binary search on the answer'." },
      { heading: "Common Pitfalls", body: "Use lo + (hi - lo) // 2 to avoid overflow in low-level languages (no issue in Python). Decide whether the loop is `while lo < hi` or `while lo <= hi` — they correspond to slightly different invariants. Stick with one pattern." },
    ],
    codeExamples: [
      { title: "Classic binary search", code: `def bsearch(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target: return mid
        if arr[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1

print(bsearch([1, 3, 5, 7, 9, 11], 7))  # 3
print(bsearch([1, 3, 5, 7], 4))         # -1`, explanation: "Closed-interval pattern with hi = len - 1 and <= condition." },
      { title: "First true index", code: `def first_true(lo, hi, pred):
    """Return smallest x in [lo, hi] where pred(x) is True; else hi + 1."""
    while lo < hi:
        mid = (lo + hi) // 2
        if pred(mid): hi = mid
        else: lo = mid + 1
    return lo

# example: smallest n where n*n >= 50
print(first_true(0, 10, lambda n: n * n >= 50))  # 8`, explanation: "Half-open invariant. Powerful for predicate-based searches." },
      { title: "Search rotated array", code: `def search_rotated(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target: return mid
        if arr[lo] <= arr[mid]:  # left half is sorted
            if arr[lo] <= target < arr[mid]: hi = mid - 1
            else: lo = mid + 1
        else:  # right half is sorted
            if arr[mid] < target <= arr[hi]: lo = mid + 1
            else: hi = mid - 1
    return -1

print(search_rotated([4,5,6,7,0,1,2], 0))  # 4`, explanation: "Determine which half is sorted, then search there." },
    ],
    keyTakeaways: ["Binary search is O(log n) on sorted data", "Two common patterns: closed (lo<=hi) and half-open (lo<hi)", "Predicate-based binary search generalizes to many problems", "bisect from stdlib for sorted lists", "Off-by-one is the most common bug — pick a pattern and stick to it"],
  },
  "dsa:t5:two-pointers": {
    nodeId: "dsa:t5:two-pointers", title: "Two Pointers",
    sections: [
      { heading: "Opposite Ends", body: "lo and hi at the ends of a sorted array; converge based on a comparison. Solves: pair sum, palindrome check, container with most water. O(n) instead of O(n²)." },
      { heading: "Same Direction", body: "Both pointers move forward but at different speeds. Solves: removing duplicates in place, sliding-window-like problems, Floyd's cycle detection (fast pointer goes 2x)." },
      { heading: "When To Reach For It", body: "Often when you need O(n) but a naive solution is O(n²) and the data is sorted (or can be). Look for problems where you maintain a relationship between two indices as you scan." },
    ],
    codeExamples: [
      { title: "Pair sum (sorted)", code: `def two_sum_sorted(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo < hi:
        s = arr[lo] + arr[hi]
        if s == target: return (lo, hi)
        if s < target: lo += 1
        else: hi -= 1
    return None

print(two_sum_sorted([1, 3, 5, 8, 11], 13))  # (1, 3)`, explanation: "Move lo up if too small; hi down if too big. O(n)." },
      { title: "Remove duplicates in place", code: `def remove_dups(arr):
    if not arr: return 0
    write = 1
    for read in range(1, len(arr)):
        if arr[read] != arr[read - 1]:
            arr[write] = arr[read]
            write += 1
    return write   # new length

a = [1, 1, 2, 3, 3, 4]
n = remove_dups(a)
print(a[:n])  # [1, 2, 3, 4]`, explanation: "Read and write pointers, both moving forward. O(n) and O(1) extra space." },
      { title: "Linked-list cycle (Floyd)", code: `def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast: return True
    return False`, explanation: "Two pointers at different speeds. They meet iff there's a cycle." },
    ],
    keyTakeaways: ["Two pointers turn many O(n²) brute-forces into O(n)", "Opposite ends: converge based on a comparison", "Same direction: read + write, or fast + slow", "Often requires sorted data (or you sort first)", "Floyd's tortoise-and-hare detects cycles in O(1) space"],
  },
  "dsa:t5:sliding-window": {
    nodeId: "dsa:t5:sliding-window", title: "Sliding Window",
    sections: [
      { heading: "Fixed Window", body: "Sum / max over a contiguous subarray of size k. Compute the first window, then slide: subtract the leaving element, add the entering element. O(n) instead of O(n*k)." },
      { heading: "Variable Window", body: "Window size grows and shrinks based on a constraint (e.g. longest substring without repeats). Two pointers form the window; expand right, shrink from left when the constraint breaks." },
      { heading: "Pair With A Hash", body: "Most variable-window problems track frequencies in a dict/Counter. Update on expand and shrink. The hash keeps the constraint-checking O(1) per move." },
    ],
    codeExamples: [
      { title: "Max sum window of size k", code: `def max_window_sum(arr, k):
    if k > len(arr): return None
    s = sum(arr[:k])
    best = s
    for i in range(k, len(arr)):
        s += arr[i] - arr[i - k]
        best = max(best, s)
    return best

print(max_window_sum([1, 2, 3, 4, 5], 3))  # 12`, explanation: "Slide the window in O(1) per step." },
      { title: "Longest substring without repeats", code: `def longest_unique(s):
    seen = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in seen and seen[ch] >= left:
            left = seen[ch] + 1
        seen[ch] = right
        best = max(best, right - left + 1)
    return best

print(longest_unique("abcabcbb"))  # 3
print(longest_unique("bbbbb"))     # 1`, explanation: "Variable window. left jumps past the previous occurrence on collision." },
      { title: "Min window with K distinct", code: `from collections import Counter

def min_window_k_distinct(s, k):
    counts = Counter()
    left = 0
    best = float("inf")
    for right, ch in enumerate(s):
        counts[ch] += 1
        while len(counts) > k:
            counts[s[left]] -= 1
            if counts[s[left]] == 0: del counts[s[left]]
            left += 1
        if len(counts) == k:
            best = min(best, right - left + 1)
    return best if best != float("inf") else 0

print(min_window_k_distinct("aabacbebebe", 3))  # 7`, explanation: "Counter tracks chars in window. Shrink from left to maintain the constraint." },
    ],
    keyTakeaways: ["Sliding window converts many O(n*k) problems to O(n)", "Fixed window: slide by adding/removing one element", "Variable window: expand right, shrink from left when invalid", "Pair with a hash to keep updates O(1)", "Many substring/subarray problems are sliding window in disguise"],
  },
  "dsa:t5:sorting": {
    nodeId: "dsa:t5:sorting", title: "Sorting Algorithms",
    sections: [
      { heading: "Comparison Sorts", body: "Mergesort: O(n log n) always, stable, O(n) extra space. Quicksort: O(n log n) average, O(n²) worst, in-place. Heapsort: O(n log n), in-place, not stable. Each has tradeoffs — Timsort (Python's default) blends mergesort + insertion sort." },
      { heading: "Linear-Time Sorts", body: "When values fit certain assumptions you can beat O(n log n). Counting sort: integers in a small range, O(n + k). Radix sort: digit-by-digit, O(d·n). Bucket sort: uniform distribution. All O(n) but with constraints on the data." },
      { heading: "Stability And When To Care", body: "A stable sort preserves the order of equal-keyed items. Matters when you sort by multiple keys (sort by city, then by name — the second sort must be stable to keep the city order). Python's sorted is stable." },
    ],
    codeExamples: [
      { title: "Use Python's sorted", code: `nums = [3, 1, 4, 1, 5, 9, 2, 6]
print(sorted(nums))                # ascending
print(sorted(nums, reverse=True))  # descending

# Multi-key
people = [("Ada", 36), ("Linus", 36), ("Grace", 50)]
people.sort(key=lambda p: (p[1], p[0]))  # by age then name
print(people)`, explanation: "Timsort is O(n log n), stable, fast on real-world (often partially-sorted) data." },
      { title: "Mergesort", code: `def mergesort(arr):
    if len(arr) <= 1: return arr
    mid = len(arr) // 2
    left = mergesort(arr[:mid])
    right = mergesort(arr[mid:])
    return merge(left, right)

def merge(a, b):
    out, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]: out.append(a[i]); i += 1
        else: out.append(b[j]); j += 1
    out.extend(a[i:]); out.extend(b[j:])
    return out

print(mergesort([5, 2, 4, 7, 1, 3, 6]))  # [1, 2, 3, 4, 5, 6, 7]`, explanation: "Divide → conquer → merge. Always O(n log n), stable, O(n) extra." },
      { title: "Quicksort", code: `def quicksort(arr):
    if len(arr) <= 1: return arr
    pivot = arr[len(arr) // 2]
    less = [x for x in arr if x < pivot]
    eq   = [x for x in arr if x == pivot]
    more = [x for x in arr if x > pivot]
    return quicksort(less) + eq + quicksort(more)

print(quicksort([5, 2, 4, 7, 1, 3, 6]))`, explanation: "Average O(n log n). Worst case O(n²) on already-sorted input with naive pivot." },
    ],
    keyTakeaways: ["Comparison sorts are bounded below by O(n log n)", "Mergesort always n log n; quicksort average n log n, worst n²", "Linear-time sorts (counting/radix/bucket) need value assumptions", "Stable sorts preserve equal-key order — critical for multi-key sort", "In Python: just use sorted() — it's Timsort, stable and fast"],
  },

  // ── T6 ──────────────────────────────────────────────────
  "dsa:t6:recursion": {
    nodeId: "dsa:t6:recursion", title: "Recursion Patterns",
    sections: [
      { heading: "Reduction To Subproblems", body: "Recursion solves a problem by reducing it to smaller versions of the same problem. Two parts: base case (where you stop) and recursive case (how you recurse). Without a base case, you blow the stack." },
      { heading: "Divide And Conquer", body: "Split into independent subproblems, solve each, combine. Mergesort, quicksort, fast Fourier transform. The recurrence T(n) = a·T(n/b) + f(n) governs runtime — Master Theorem solves common cases." },
      { heading: "When To Avoid", body: "Linear recursion in Python pays a stack cost (depth ~1000 limit, no tail-call optimization). For deep recursion, convert to iteration with an explicit stack or queue. Memoization rescues many otherwise-exponential recursive solutions." },
    ],
    codeExamples: [
      { title: "Linear recursion", code: `def length(arr, i=0):
    if i == len(arr): return 0
    return 1 + length(arr, i + 1)

print(length([3, 1, 4, 1, 5]))  # 5`, explanation: "Trivial recursion. Iteration is much faster — only do this for the practice." },
      { title: "Divide and conquer (max)", code: `def max_dc(arr, lo=0, hi=None):
    if hi is None: hi = len(arr) - 1
    if lo == hi: return arr[lo]
    mid = (lo + hi) // 2
    return max(max_dc(arr, lo, mid), max_dc(arr, mid + 1, hi))

print(max_dc([3, 1, 4, 1, 5, 9, 2, 6]))  # 9`, explanation: "T(n) = 2T(n/2) + O(1) → O(n). Same as a single loop, but the structure scales to harder problems." },
      { title: "Memoization", code: `from functools import cache

@cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(100))  # instant`, explanation: "Without @cache, fib(100) is intractable. Memoization turns exponential into linear." },
    ],
    keyTakeaways: ["Recursion = base case + recursive case (smaller version)", "Divide & conquer combines results from independent subproblems", "Master Theorem analyzes T(n) = aT(n/b) + f(n) recurrences", "Python depth limit ~1000; no tail-call optimization", "Memoization rescues overlapping-subproblem recursions"],
  },
  "dsa:t6:dp": {
    nodeId: "dsa:t6:dp", title: "Dynamic Programming",
    sections: [
      { heading: "Overlapping Subproblems + Optimal Substructure", body: "DP applies when (a) the problem can be broken into subproblems and (b) the same subproblems recur. Cache subproblem results. Two flavors: memoization (top-down, recursion + cache) and tabulation (bottom-up, iterative)." },
      { heading: "Five Steps", body: "(1) Define the subproblem precisely. (2) Write the recurrence. (3) Identify base cases. (4) Decide order of computation. (5) Implement memoized recursion or a table. The state definition is usually the hardest step." },
      { heading: "Common Patterns", body: "1D: fib, climbing stairs, house robber. 2D: edit distance, longest common subsequence, knapsack. Pick patterns by spotting the state — what minimal info do you need to make the next decision?" },
    ],
    codeExamples: [
      { title: "Climbing stairs (1D)", code: `def climb(n):
    if n <= 2: return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b

print(climb(5))  # 8`, explanation: "ways(n) = ways(n-1) + ways(n-2). Iterative with O(1) space." },
      { title: "Memoized recursion", code: `from functools import cache

@cache
def coin_change(amount, coins):
    if amount == 0: return 0
    if amount < 0: return float("inf")
    best = min(coin_change(amount - c, coins) + 1 for c in coins)
    return best

print(coin_change(11, (1, 2, 5)))  # 3 (5+5+1)`, explanation: "@cache turns exponential into polynomial. Subproblem: min coins for x." },
      { title: "Edit distance (2D)", code: `def edit_distance(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i-1] == b[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]

print(edit_distance("kitten", "sitting"))  # 3`, explanation: "Tabular DP. State: dp[i][j] = edits to transform a[:i] to b[:j]." },
    ],
    keyTakeaways: ["DP needs overlapping subproblems + optimal substructure", "Memoization (top-down) and tabulation (bottom-up) are equivalent", "Define the state precisely — it's the hardest step", "1D problems: fib, stairs; 2D: edit distance, LCS, knapsack", "Often O(n) space → O(1) space by keeping only the last row/values"],
  },
  "dsa:t6:greedy": {
    nodeId: "dsa:t6:greedy", title: "Greedy Algorithms",
    sections: [
      { heading: "Local Choices", body: "At each step, take the locally optimal choice and hope the globals work out. Fast (often O(n log n) for sort + scan). When greedy works, it's elegant; when it doesn't, it's quietly wrong." },
      { heading: "When Greedy Works", body: "You need to prove (or convince yourself with examples) that the local choice can't be regretted later. Common proof: exchange argument — show any optimal solution can be transformed into the greedy one without making things worse." },
      { heading: "Classic Greedy Wins", body: "Activity selection by earliest end-time. Huffman coding by smallest two frequencies. Fractional knapsack by value/weight ratio. Dijkstra's. Each one has a clean proof of correctness." },
    ],
    codeExamples: [
      { title: "Activity selection", code: `def schedule(intervals):
    # max non-overlapping intervals
    intervals.sort(key=lambda x: x[1])  # by end time
    end = float("-inf")
    count = 0
    for s, e in intervals:
        if s >= end:
            count += 1
            end = e
    return count

print(schedule([(1,4), (2,3), (3,5), (0,6), (5,7), (8,9)]))  # 4`, explanation: "Always pick the activity that ends earliest among compatible ones." },
      { title: "Coin change (greedy works for canonical sets)", code: `def coin_greedy(amount, coins=(1, 5, 10, 25)):
    coins = sorted(coins, reverse=True)
    out = 0
    for c in coins:
        out += amount // c
        amount %= c
    return out if amount == 0 else None

print(coin_greedy(67))  # 7  (25+25+10+5+1+1)
# Note: doesn't always work — e.g. coins=(1, 3, 4), amount=6
# Greedy: 4+1+1 = 3 coins. Optimal: 3+3 = 2 coins.`, explanation: "Greedy is correct only for canonical coin systems. DP for the general case." },
      { title: "Job scheduling with deadlines", code: `import heapq

def max_profit(jobs):
    # jobs = [(deadline, profit), ...]
    jobs.sort()  # by deadline
    h = []
    for d, p in jobs:
        heapq.heappush(h, p)
        if len(h) > d:
            heapq.heappop(h)  # drop smallest profit
    return sum(h)

print(max_profit([(1, 5), (2, 10), (2, 6), (3, 4), (3, 8)]))  # 23`, explanation: "Greedy by deadline + min-heap of profits. Replace smallest when full." },
    ],
    keyTakeaways: ["Greedy = locally optimal at each step", "Prove correctness via exchange argument", "Often: sort by some criterion, then scan once", "Doesn't always work — coin change is the canonical counterexample", "Dijkstra, Huffman, activity selection are clean greedy wins"],
  },
  "dsa:t6:backtracking": {
    nodeId: "dsa:t6:backtracking", title: "Backtracking",
    sections: [
      { heading: "Search With Undo", body: "Try a choice; recurse; if it doesn't work, undo and try another. The pattern: pick → recurse → unpick. Solves combinatorial problems where you enumerate possibilities." },
      { heading: "Pruning", body: "Don't explore obviously-bad branches. Add early-exit conditions: bound the answer so far, check feasibility constraints. Pruning can turn an exponential search into something tractable." },
      { heading: "Classic Problems", body: "Permutations, subsets, n-queens, sudoku, graph coloring, word break, palindrome partitioning. The skeleton is the same; constraints and state vary." },
    ],
    codeExamples: [
      { title: "All permutations", code: `def perms(arr):
    out = []
    def back(used, path):
        if len(path) == len(arr):
            out.append(path[:])
            return
        for i, x in enumerate(arr):
            if used[i]: continue
            used[i] = True
            path.append(x)
            back(used, path)
            path.pop()
            used[i] = False
    back([False] * len(arr), [])
    return out

print(perms([1, 2, 3]))
# [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]`, explanation: "Pick → recurse → unpick. used[] tracks what's already in path." },
      { title: "Subsets", code: `def subsets(arr):
    out = []
    def back(start, path):
        out.append(path[:])
        for i in range(start, len(arr)):
            path.append(arr[i])
            back(i + 1, path)
            path.pop()
    back(0, [])
    return out

print(subsets([1, 2, 3]))
# [[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]`, explanation: "Each call adds the current path; recurses on each future index." },
      { title: "N-queens (count solutions)", code: `def solve(n):
    cols, diag1, diag2 = set(), set(), set()
    count = 0
    def back(row):
        nonlocal count
        if row == n:
            count += 1; return
        for c in range(n):
            if c in cols or (row - c) in diag1 or (row + c) in diag2:
                continue
            cols.add(c); diag1.add(row - c); diag2.add(row + c)
            back(row + 1)
            cols.remove(c); diag1.remove(row - c); diag2.remove(row + c)
    back(0)
    return count

print(solve(8))  # 92`, explanation: "Place one queen per row. Three sets prune attacks in O(1) per check." },
    ],
    keyTakeaways: ["Backtracking = pick / recurse / unpick", "Prune branches that can't lead to a valid solution", "Track state with sets/lists; remember to undo on the way back", "Permutations, subsets, n-queens, sudoku — same skeleton", "Combine with memoization when subproblems overlap"],
  },
};
