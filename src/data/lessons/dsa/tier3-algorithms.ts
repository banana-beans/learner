import type { LessonContent } from "../python-basics";

export const dsaTier3Lessons: Record<string, LessonContent> = {
  "dsa:t3:sorting": {
    nodeId: "dsa:t3:sorting",
    title: "Sorting Algorithms",
    sections: [
      {
        heading: "Simple Sorts: O(n²)",
        body: "Bubble sort: repeatedly swap adjacent elements if out of order. Selection sort: find the minimum, swap to the front, repeat for the remaining. Insertion sort: build a sorted portion by inserting each new element in its correct position. All are O(n²) but insertion sort is fast on nearly-sorted data (O(n) best case) and is used as the base case in hybrid sorting algorithms.",
      },
      {
        heading: "Efficient Sorts: O(n log n)",
        body: "Merge sort: divide the array in half, recursively sort each half, then merge them. Always O(n log n) but uses O(n) extra space. Quicksort: pick a pivot, partition elements into less-than and greater-than groups, recurse on each. O(n log n) average, O(n²) worst case (rare with good pivot selection). Quicksort is typically faster in practice due to cache locality.",
      },
      {
        heading: "Sorting Stability and Choosing an Algorithm",
        body: "A stable sort preserves the relative order of equal elements. Merge sort and insertion sort are stable; quicksort and selection sort are not. Stability matters when sorting by multiple keys (sort by name, then by age — stable sort keeps name order within same age). In practice, use your language's built-in sort — it's usually a hybrid algorithm (Timsort in Python, IntroSort in C++).",
      },
    ],
    codeExamples: [
      {
        title: "Merge sort",
        code: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

print(merge_sort([5, 3, 8, 1, 9, 2]))  # [1, 2, 3, 5, 8, 9]`,
        explanation: "Divide in half, sort each half, merge sorted halves. O(n log n) always. Uses O(n) extra space for the merge step.",
      },
      {
        title: "Quicksort partition",
        code: `def quicksort(arr, lo=0, hi=None):
    if hi is None: hi = len(arr) - 1
    if lo >= hi: return
    pivot = arr[hi]
    i = lo
    for j in range(lo, hi):
        if arr[j] < pivot:
            arr[i], arr[j] = arr[j], arr[i]
            i += 1
    arr[i], arr[hi] = arr[hi], arr[i]  # place pivot
    quicksort(arr, lo, i - 1)
    quicksort(arr, i + 1, hi)

nums = [5, 3, 8, 1, 9, 2]
quicksort(nums)
print(nums)  # [1, 2, 3, 5, 8, 9]`,
        explanation: "Partition puts elements less than pivot on the left. Recurse on each side. In-place (O(log n) stack space). O(n log n) average.",
      },
    ],
    keyTakeaways: [
      "O(n²) sorts: bubble, selection, insertion — simple but slow for large data",
      "O(n log n) sorts: merge sort (stable, O(n) space), quicksort (fast, in-place)",
      "Stable sorts preserve the order of equal elements",
      "Insertion sort is best for small/nearly-sorted arrays",
      "Use your language's built-in sort — it's optimized (usually Timsort or IntroSort)",
    ],
  },

  "dsa:t3:binary-search": {
    nodeId: "dsa:t3:binary-search",
    title: "Binary Search",
    sections: [
      {
        heading: "Classic Binary Search",
        body: "Binary search finds a target in a sorted array in O(log n). Maintain lo and hi pointers. Calculate mid = (lo + hi) // 2. If arr[mid] == target, found. If arr[mid] < target, search right (lo = mid + 1). If arr[mid] > target, search left (hi = mid - 1). The key insight: each comparison eliminates half the remaining elements. Only works on sorted data.",
      },
      {
        heading: "Search Variants",
        body: "Beyond finding an exact match: find the first occurrence (leftmost), find the last occurrence (rightmost), find the insertion point (bisect_left/bisect_right). These variants adjust what happens when arr[mid] == target — do you continue searching left or right? These are used for range queries, counting occurrences, and maintaining sorted order.",
      },
      {
        heading: "Binary Search on Answer",
        body: "Sometimes you don't search an array — you search a range of possible answers. 'Can I complete this task with X resources?' If the answer is monotonic (once true, always true for larger X), you can binary search for the minimum X. Examples: minimum capacity to ship packages in D days, minimum speed to eat bananas in H hours. The pattern: binary search + feasibility check.",
      },
    ],
    codeExamples: [
      {
        title: "Classic binary search",
        code: `def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

print(binary_search([1, 3, 5, 7, 9, 11], 7))  # 3
print(binary_search([1, 3, 5, 7, 9, 11], 6))  # -1`,
        explanation: "Each step halves the search space. 1 million elements → ~20 steps. Always ensure lo <= hi and update correctly to avoid infinite loops.",
      },
      {
        title: "Binary search on answer",
        code: `def can_finish(tasks, workers, max_time):
    # Can all tasks be done if each worker works at most max_time?
    needed = sum((t + max_time - 1) // max_time for t in tasks)
    return needed <= workers

def min_time(tasks, workers):
    lo, hi = 1, max(tasks)
    while lo < hi:
        mid = (lo + hi) // 2
        if can_finish(tasks, workers, mid):
            hi = mid  # try less time
        else:
            lo = mid + 1  # need more time
    return lo

print(min_time([10, 20, 30], 3))  # 10`,
        explanation: "Binary search the answer space (1 to max). For each candidate time, check feasibility. O(n log m) where m is the answer range.",
      },
    ],
    keyTakeaways: [
      "Binary search works on sorted data and runs in O(log n)",
      "Key invariant: the target is always between lo and hi (inclusive)",
      "Variants: find first/last occurrence, insertion point",
      "Binary search on answer: search a range of possible solutions with a feasibility check",
      "Always check: does lo/hi update avoid infinite loops? (lo = mid + 1, not lo = mid)",
    ],
  },

  "dsa:t3:recursion": {
    nodeId: "dsa:t3:recursion",
    title: "Recursion & Backtracking",
    sections: [
      {
        heading: "Recursive Thinking",
        body: "Recursion solves a problem by breaking it into smaller instances of the same problem. Every recursive function needs: a base case (when to stop), a recursive case (how to break down), and progress toward the base case. Think 'if I had the answer to the smaller problem, how do I combine it?' Factorial: n! = n * (n-1)!. Fibonacci: fib(n) = fib(n-1) + fib(n-2). Trees are inherently recursive — left and right subtrees are smaller trees.",
      },
      {
        heading: "The Call Stack",
        body: "Each recursive call adds a frame to the call stack. The stack stores local variables and the return address. Too many calls cause a stack overflow (Python default limit: ~1000). Tail recursion (where the recursive call is the last operation) can be optimized by some languages to reuse the stack frame, but Python does not optimize tail calls. Convert deep recursion to iteration when stack depth is a concern.",
      },
      {
        heading: "Backtracking",
        body: "Backtracking is recursion with choice and undo. At each step, you make a choice, recurse, then undo the choice and try the next option. It explores all possible paths in a decision tree, pruning branches that can't lead to a valid solution. Classic problems: generate all permutations, all subsets, N-queens, Sudoku solver, and word search. The pattern: choose → explore → unchoose.",
      },
    ],
    codeExamples: [
      {
        title: "Generate all subsets (backtracking)",
        code: `def subsets(nums):
    result = []
    def backtrack(start, current):
        result.append(current[:])  # add a copy
        for i in range(start, len(nums)):
            current.append(nums[i])      # choose
            backtrack(i + 1, current)     # explore
            current.pop()                 # unchoose
    backtrack(0, [])
    return result

print(subsets([1, 2, 3]))
# [[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]`,
        explanation: "At each position, choose to include or not include each remaining element. The backtrack undoes the choice (pop) after exploring.",
      },
      {
        title: "Generate all permutations",
        code: `def permutations(nums):
    result = []
    used = [False] * len(nums)
    def backtrack(current):
        if len(current) == len(nums):
            result.append(current[:])
            return
        for i in range(len(nums)):
            if used[i]: continue
            used[i] = True
            current.append(nums[i])
            backtrack(current)
            current.pop()
            used[i] = False
    backtrack([])
    return result

print(permutations([1, 2, 3]))
# [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]`,
        explanation: "Track used elements. At each position, try every unused element — choose, recurse, unchoose. Generates n! permutations.",
      },
    ],
    keyTakeaways: [
      "Every recursion needs a base case and progress toward it",
      "Think: 'if I had the answer to smaller input, how do I build the full answer?'",
      "The call stack tracks each recursive call — too deep causes stack overflow",
      "Backtracking: choose → explore → unchoose. Explores all paths in a decision tree",
      "Classic backtracking problems: subsets, permutations, N-queens, Sudoku",
    ],
  },

  "dsa:t3:graphs": {
    nodeId: "dsa:t3:graphs",
    title: "Graph Basics",
    sections: [
      {
        heading: "Graph Representations",
        body: "A graph is a set of nodes (vertices) connected by edges. Graphs can be directed (edges have direction) or undirected. Two main representations: Adjacency list — a dictionary mapping each node to its neighbors. Best for sparse graphs (few edges), O(V + E) space. Adjacency matrix — a 2D array where matrix[i][j] indicates an edge from i to j. Best for dense graphs, O(V²) space. Most real-world graphs are sparse, so adjacency lists are standard.",
      },
      {
        heading: "BFS and DFS",
        body: "BFS (Breadth-First Search) uses a queue to explore level by level — nearest nodes first. It finds shortest paths in unweighted graphs. DFS (Depth-First Search) uses a stack (or recursion) to explore as deep as possible before backtracking. DFS is simpler to code recursively and is used for cycle detection, topological sort, and connected components. Both visit every node and edge: O(V + E).",
      },
      {
        heading: "Connected Components and Cycle Detection",
        body: "Connected components are groups of nodes where every pair is reachable. Find them by running BFS/DFS from each unvisited node — each run discovers one component. Cycle detection: in undirected graphs, a cycle exists if DFS visits a node that's already been visited (and isn't the parent). In directed graphs, a cycle exists if DFS visits a node still on the current recursion stack (not just visited).",
      },
    ],
    codeExamples: [
      {
        title: "BFS shortest path",
        code: `from collections import deque

def bfs_shortest_path(graph, start, target):
    queue = deque([(start, [start])])
    visited = {start}
    while queue:
        node, path = queue.popleft()
        if node == target:
            return path
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
    return None  # not reachable

graph = {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2, 4], 4: [3]}
print(bfs_shortest_path(graph, 0, 4))  # [0, 1, 3, 4]`,
        explanation: "BFS explores level by level, so the first time it reaches the target is the shortest path. Each queue entry stores the path so far.",
      },
      {
        title: "DFS cycle detection (undirected)",
        code: `def has_cycle(graph):
    visited = set()
    def dfs(node, parent):
        visited.add(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                if dfs(neighbor, node):
                    return True
            elif neighbor != parent:
                return True  # back edge = cycle
        return False
    for node in graph:
        if node not in visited:
            if dfs(node, -1):
                return True
    return False`,
        explanation: "In DFS, if we reach a visited node that isn't our parent, there's a cycle (a 'back edge'). Run DFS from each unvisited node to handle disconnected graphs.",
      },
    ],
    keyTakeaways: [
      "Adjacency list for sparse graphs (most common), adjacency matrix for dense graphs",
      "BFS: queue-based, finds shortest paths in unweighted graphs, explores level by level",
      "DFS: stack/recursion-based, explores depth-first, used for cycles and components",
      "Both BFS and DFS run in O(V + E) time",
      "Connected components: run BFS/DFS from each unvisited node",
      "Cycle detection: back edge in DFS indicates a cycle",
    ],
  },
};
