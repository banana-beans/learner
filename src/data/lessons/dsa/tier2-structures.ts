import type { LessonContent } from "../python-basics";

export const dsaTier2Lessons: Record<string, LessonContent> = {
  "dsa:t2:stacks-queues": {
    nodeId: "dsa:t2:stacks-queues",
    title: "Stacks & Queues",
    sections: [
      {
        heading: "Stack: Last In, First Out",
        body: "A stack is like a stack of plates — you add (push) and remove (pop) from the top only. The last item pushed is the first one popped (LIFO). Stacks are used for: function call tracking (the call stack), undo operations, bracket matching, expression evaluation, and DFS traversal. In most languages, arrays/lists with push/pop work as stacks.",
      },
      {
        heading: "Queue: First In, First Out",
        body: "A queue is like a line at a store — items enter at the back (enqueue) and leave from the front (dequeue). First in, first out (FIFO). Queues are used for: BFS traversal, task scheduling, buffering, and print queues. Implement with a linked list or deque for O(1) operations — using an array with shift() is O(n) because elements must be moved.",
      },
      {
        heading: "Classic Stack Problems",
        body: "Bracket matching: push opening brackets, pop when you see a closing one, and verify they match. If the stack is empty at the end, the brackets are valid. Monotonic stack: maintain a stack where elements are always increasing (or decreasing). This solves 'next greater element' and 'stock span' problems in O(n). These patterns appear constantly in coding interviews.",
      },
    ],
    codeExamples: [
      {
        title: "Bracket matching with a stack",
        code: `def is_valid(s):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for char in s:
        if char in '([{':
            stack.append(char)
        elif char in ')]}':
            if not stack or stack[-1] != pairs[char]:
                return False
            stack.pop()
    return len(stack) == 0

print(is_valid("({[]})"))  # True
print(is_valid("([)]"))    # False`,
        explanation: "Push opening brackets. For each closing bracket, check if the top of the stack matches. If the stack is empty at the end, all brackets were matched.",
      },
      {
        title: "BFS with a queue",
        code: `from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    order = []
    while queue:
        node = queue.popleft()  # O(1) dequeue
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return order`,
        explanation: "BFS uses a queue to visit nodes level by level. deque provides O(1) popleft, unlike list's O(n) pop(0).",
      },
    ],
    keyTakeaways: [
      "Stack = LIFO (push/pop from top); Queue = FIFO (enqueue back, dequeue front)",
      "Stacks solve bracket matching, undo/redo, and DFS",
      "Queues solve BFS, scheduling, and buffering",
      "Use deque for O(1) queue operations — list.pop(0) is O(n)",
      "Monotonic stack: maintain sorted order to solve 'next greater element' in O(n)",
    ],
  },

  "dsa:t2:trees": {
    nodeId: "dsa:t2:trees",
    title: "Binary Trees",
    sections: [
      {
        heading: "Tree Terminology",
        body: "A binary tree is a hierarchical structure where each node has at most two children (left and right). The topmost node is the root. Nodes with no children are leaves. The depth of a node is its distance from the root. The height of a tree is the longest path from root to leaf. A complete binary tree fills every level except possibly the last. Trees model hierarchical relationships: file systems, HTML DOM, organization charts.",
      },
      {
        heading: "Tree Traversals",
        body: "There are three depth-first traversals: Inorder (left, root, right) — visits BST nodes in sorted order. Preorder (root, left, right) — visits parent before children, useful for copying trees. Postorder (left, right, root) — visits children before parent, useful for deletion. BFS (level-order) uses a queue to visit nodes level by level. Each traversal has different applications.",
      },
      {
        heading: "Recursive Thinking for Trees",
        body: "Most tree problems are naturally recursive: process the current node, then recurse on left and right subtrees. The base case is when the node is null. Example: tree height = 1 + max(height(left), height(right)). Think in terms of 'what does this node need from its children?' and build the answer bottom-up. This pattern solves height, size, sum, max, mirror, and path problems.",
      },
    ],
    codeExamples: [
      {
        title: "Tree node and traversals",
        code: `class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorder(node):
    if not node: return []
    return inorder(node.left) + [node.val] + inorder(node.right)

def preorder(node):
    if not node: return []
    return [node.val] + preorder(node.left) + preorder(node.right)

#     1
#    / \\
#   2   3
root = TreeNode(1, TreeNode(2), TreeNode(3))
print(inorder(root))   # [2, 1, 3]
print(preorder(root))  # [1, 2, 3]`,
        explanation: "Inorder: left-root-right. Preorder: root-left-right. Both use recursion with a null base case.",
      },
      {
        title: "Recursive tree height",
        code: `def height(node):
    if not node:
        return 0
    return 1 + max(height(node.left), height(node.right))

#       1
#      / \\
#     2   3
#    /
#   4
root = TreeNode(1, TreeNode(2, TreeNode(4)), TreeNode(3))
print(height(root))  # 3`,
        explanation: "Base case: null node has height 0. Each node's height is 1 + the max of its children's heights. Classic bottom-up recursion.",
      },
    ],
    keyTakeaways: [
      "Binary tree nodes have at most two children: left and right",
      "Inorder (L-Root-R), Preorder (Root-L-R), Postorder (L-R-Root)",
      "BFS (level-order) uses a queue; DFS uses recursion or a stack",
      "Most tree problems are recursive: base case is null, recurse on children",
      "Tree height = 1 + max(left height, right height)",
    ],
  },

  "dsa:t2:bst": {
    nodeId: "dsa:t2:bst",
    title: "Binary Search Trees",
    sections: [
      {
        heading: "The BST Property",
        body: "A Binary Search Tree (BST) enforces an ordering: for every node, all values in the left subtree are less than the node, and all values in the right subtree are greater. This property enables O(log n) search, insertion, and deletion — on average. An inorder traversal of a BST visits nodes in sorted order. BSTs are the foundation of many data structures: TreeMap, TreeSet, and database indexes.",
      },
      {
        heading: "Search, Insert, Delete",
        body: "Search: compare with the current node, go left if smaller, right if larger. Insert: search to find the right spot, then attach the new node. Delete has three cases: leaf node (just remove), one child (replace with child), two children (replace with inorder successor — the smallest value in the right subtree, then delete that successor). All operations are O(h) where h is the height.",
      },
      {
        heading: "Balanced vs Unbalanced",
        body: "If you insert sorted data into a BST, it degenerates into a linked list with O(n) operations. Balanced BSTs (AVL trees, Red-Black trees) maintain height O(log n) through rotations after each insertion/deletion. In practice, you rarely implement these — use your language's built-in sorted collections (TreeMap in Java, SortedDictionary in C#). Understanding the concept matters more than the implementation.",
      },
    ],
    codeExamples: [
      {
        title: "BST search and insert",
        code: `def search(node, target):
    if not node: return False
    if target == node.val: return True
    if target < node.val: return search(node.left, target)
    return search(node.right, target)

def insert(node, val):
    if not node: return TreeNode(val)
    if val < node.val:
        node.left = insert(node.left, val)
    else:
        node.right = insert(node.right, val)
    return node`,
        explanation: "Search goes left or right based on comparison. Insert finds the null spot where the value belongs and creates a new node there. Both are O(h).",
      },
      {
        title: "Validate BST",
        code: `def is_valid_bst(node, min_val=float('-inf'), max_val=float('inf')):
    if not node: return True
    if node.val <= min_val or node.val >= max_val:
        return False
    return (is_valid_bst(node.left, min_val, node.val) and
            is_valid_bst(node.right, node.val, max_val))`,
        explanation: "Pass valid ranges down the tree. Left children must be less than the current node (and ancestors). Right children must be greater. This is a classic interview problem.",
      },
    ],
    keyTakeaways: [
      "BST property: left < node < right for every node",
      "Inorder traversal of a BST gives sorted order",
      "Search, insert, delete are all O(h) — O(log n) when balanced",
      "Unbalanced BSTs degenerate to O(n) — balanced trees (AVL, Red-Black) prevent this",
      "Use built-in sorted collections in production; understand the concept for interviews",
    ],
  },

  "dsa:t2:heaps": {
    nodeId: "dsa:t2:heaps",
    title: "Heaps & Priority Queues",
    sections: [
      {
        heading: "What Is a Heap?",
        body: "A heap is a complete binary tree where every parent is smaller (min-heap) or larger (max-heap) than its children. The root is always the minimum (min-heap) or maximum (max-heap). Heaps are stored as arrays: for index i, the left child is at 2i+1, right child at 2i+2, and parent at (i-1)//2. This array representation makes heaps memory-efficient with no pointer overhead.",
      },
      {
        heading: "Heap Operations",
        body: "Insert: add to the end and 'bubble up' — swap with parent while smaller (min-heap). O(log n). Extract-min/max: remove root, move the last element to root, and 'bubble down' — swap with the smaller child. O(log n). Peek: return root without removing. O(1). Building a heap from an array is O(n) using the heapify algorithm, not O(n log n) as you might expect.",
      },
      {
        heading: "Applications: Top-K and Priority Queues",
        body: "A priority queue processes elements by priority instead of arrival order — implemented with a heap. Classic applications: find the K largest/smallest elements, merge K sorted lists, running median, and Dijkstra's shortest path. For top-K largest, use a min-heap of size K: if a new element is larger than the root, replace and heapify. The heap always holds the K largest seen so far.",
      },
    ],
    codeExamples: [
      {
        title: "Using Python's heapq (min-heap)",
        code: `import heapq

nums = [5, 3, 8, 1, 9, 2]
heapq.heapify(nums)  # O(n) — convert list to min-heap

print(heapq.heappop(nums))  # 1 (smallest)
print(heapq.heappop(nums))  # 2

heapq.heappush(nums, 0)
print(heapq.heappop(nums))  # 0`,
        explanation: "heapq provides a min-heap. heapify is O(n). heappush and heappop are O(log n). For max-heap, negate values.",
      },
      {
        title: "Top-K largest elements",
        code: `import heapq

def top_k_largest(nums, k):
    # Min-heap of size k
    heap = nums[:k]
    heapq.heapify(heap)
    for num in nums[k:]:
        if num > heap[0]:  # larger than smallest in heap
            heapq.heapreplace(heap, num)  # pop + push
    return sorted(heap, reverse=True)

print(top_k_largest([3, 1, 4, 1, 5, 9, 2, 6], 3))
# [9, 6, 5]`,
        explanation: "Maintain a min-heap of size K. Only elements larger than the current minimum get in. After processing, the heap contains the K largest. O(n log k) time.",
      },
    ],
    keyTakeaways: [
      "Min-heap: parent ≤ children; root is the minimum. Max-heap: parent ≥ children",
      "Heaps are stored as arrays: children at 2i+1 and 2i+2, parent at (i-1)//2",
      "Insert (bubble up) and extract (bubble down) are O(log n); peek is O(1)",
      "Building a heap from an array is O(n), not O(n log n)",
      "Top-K problems: use a heap of size K for O(n log k) efficiency",
    ],
  },
};
