import type { SkillNode } from "@/lib/types";

const node = (
  partial: Omit<SkillNode, "branchId">
): SkillNode => ({ branchId: "dsa", ...partial });

export const dsaNodes: SkillNode[] = [
  // T1 — Complexity
  node({ id: "dsa:t1:big-o", tier: 1, title: "Big-O Notation", description: "Asymptotic notation, common complexities, why constants don't matter.", hardPrereqs: [], softPrereqs: [], estimatedMinutes: 18, xpReward: 100, concepts: ["Big-O", "asymptotic", "O(1)", "O(n)", "O(log n)", "O(n²)"] }),
  node({ id: "dsa:t1:time-complexity", tier: 1, title: "Time Complexity Analysis", description: "Loops, nested loops, recursion, common patterns.", hardPrereqs: ["dsa:t1:big-o"], softPrereqs: [], estimatedMinutes: 18, xpReward: 110, concepts: ["loop analysis", "recursion analysis", "amortized"] }),
  node({ id: "dsa:t1:space-complexity", tier: 1, title: "Space Complexity", description: "Auxiliary vs total, recursion stack, in-place vs not.", hardPrereqs: ["dsa:t1:time-complexity"], softPrereqs: [], estimatedMinutes: 15, xpReward: 100, concepts: ["space", "in-place", "recursion stack"] }),

  // T2 — Linear Structures
  node({ id: "dsa:t2:arrays", tier: 2, title: "Arrays / Dynamic Arrays", description: "Random access, amortized O(1) append, copy cost.", hardPrereqs: ["dsa:t1:big-o"], softPrereqs: [], estimatedMinutes: 18, xpReward: 130, concepts: ["array", "dynamic array", "amortized append"] }),
  node({ id: "dsa:t2:linked-lists", tier: 2, title: "Linked Lists", description: "Singly, doubly, circular; insert/delete trade-offs vs arrays.", hardPrereqs: ["dsa:t2:arrays"], softPrereqs: [], estimatedMinutes: 22, xpReward: 150, concepts: ["singly", "doubly", "circular", "node"] }),
  node({ id: "dsa:t2:stacks", tier: 2, title: "Stacks", description: "LIFO, push/pop, common uses (DFS, expression eval).", hardPrereqs: ["dsa:t2:arrays"], softPrereqs: [], estimatedMinutes: 15, xpReward: 130, concepts: ["LIFO", "push", "pop", "stack frame"] }),
  node({ id: "dsa:t2:queues", tier: 2, title: "Queues & Deques", description: "FIFO; deque for both ends; circular buffer.", hardPrereqs: ["dsa:t2:arrays"], softPrereqs: [], estimatedMinutes: 15, xpReward: 130, concepts: ["FIFO", "deque", "circular buffer"] }),

  // T3 — Hashing & Trees
  node({ id: "dsa:t3:hash-tables", tier: 3, title: "Hash Tables", description: "Buckets, hash functions, collisions, load factor.", hardPrereqs: ["dsa:t2:arrays"], softPrereqs: [], estimatedMinutes: 22, xpReward: 170, concepts: ["hash function", "collision", "chaining", "open addressing"] }),
  node({ id: "dsa:t3:binary-trees", tier: 3, title: "Binary Trees", description: "Nodes, traversals (pre/in/post/level).", hardPrereqs: ["dsa:t2:linked-lists"], softPrereqs: [], estimatedMinutes: 22, xpReward: 170, concepts: ["preorder", "inorder", "postorder", "level order"] }),
  node({ id: "dsa:t3:bsts", tier: 3, title: "Binary Search Trees", description: "Search/insert/delete, balance, AVL/red-black overview.", hardPrereqs: ["dsa:t3:binary-trees"], softPrereqs: [], estimatedMinutes: 22, xpReward: 180, concepts: ["BST property", "balance", "AVL", "red-black"] }),
  node({ id: "dsa:t3:heaps", tier: 3, title: "Heaps & Priority Queues", description: "Min/max heap, heapify, heappush/heappop.", hardPrereqs: ["dsa:t3:binary-trees"], softPrereqs: [], estimatedMinutes: 22, xpReward: 180, concepts: ["min heap", "heapq", "priority queue", "heapify"] }),

  // T4 — Graphs
  node({ id: "dsa:t4:graphs-bfs", tier: 4, title: "Graphs & BFS", description: "Adjacency list/matrix, BFS, shortest path on unweighted.", hardPrereqs: ["dsa:t2:queues", "dsa:t3:hash-tables"], softPrereqs: [], estimatedMinutes: 25, xpReward: 200, concepts: ["adjacency list", "BFS", "shortest path"] }),
  node({ id: "dsa:t4:graphs-dfs", tier: 4, title: "DFS & Cycle Detection", description: "Recursive/iterative DFS, cycle detection, connected components.", hardPrereqs: ["dsa:t4:graphs-bfs"], softPrereqs: [], estimatedMinutes: 25, xpReward: 200, concepts: ["DFS", "cycle detection", "connected components"] }),
  node({ id: "dsa:t4:topo-sort", tier: 4, title: "Topological Sort", description: "Ordering DAGs via Kahn or DFS post-order.", hardPrereqs: ["dsa:t4:graphs-dfs"], softPrereqs: [], estimatedMinutes: 22, xpReward: 200, concepts: ["DAG", "Kahn's algorithm", "topo order"] }),

  // T5 — Searching / Sorting
  node({ id: "dsa:t5:binary-search", tier: 5, title: "Binary Search", description: "Sorted arrays, predicate-based search, common pitfalls.", hardPrereqs: ["dsa:t2:arrays"], softPrereqs: [], estimatedMinutes: 22, xpReward: 180, concepts: ["binary search", "predicate", "off-by-one"] }),
  node({ id: "dsa:t5:two-pointers", tier: 5, title: "Two Pointers", description: "Same-direction & opposite-direction patterns.", hardPrereqs: ["dsa:t2:arrays"], softPrereqs: [], estimatedMinutes: 18, xpReward: 170, concepts: ["two pointers", "same direction", "fast/slow"] }),
  node({ id: "dsa:t5:sliding-window", tier: 5, title: "Sliding Window", description: "Fixed and variable windows, hash-table aided.", hardPrereqs: ["dsa:t5:two-pointers"], softPrereqs: [], estimatedMinutes: 22, xpReward: 180, concepts: ["sliding window", "variable window", "hashmap"] }),
  node({ id: "dsa:t5:sorting", tier: 5, title: "Sorting Algorithms", description: "Mergesort, quicksort, when to use Python's sorted (Timsort).", hardPrereqs: ["dsa:t5:binary-search"], softPrereqs: [], estimatedMinutes: 25, xpReward: 200, concepts: ["mergesort", "quicksort", "Timsort"] }),

  // T6 — DP & Advanced
  node({ id: "dsa:t6:recursion", tier: 6, title: "Recursion Patterns", description: "Recursion vs iteration, divide & conquer.", hardPrereqs: ["dsa:t1:time-complexity"], softPrereqs: [], estimatedMinutes: 22, xpReward: 180, concepts: ["recursion", "divide and conquer"] }),
  node({ id: "dsa:t6:dp", tier: 6, title: "Dynamic Programming", description: "Memoization & tabulation; 1D and 2D DP problems.", hardPrereqs: ["dsa:t6:recursion"], softPrereqs: [], estimatedMinutes: 30, xpReward: 250, concepts: ["memoization", "tabulation", "subproblem"] }),
  node({ id: "dsa:t6:greedy", tier: 6, title: "Greedy Algorithms", description: "Local choices, when greedy works, classic counterexamples.", hardPrereqs: ["dsa:t6:recursion"], softPrereqs: [], estimatedMinutes: 22, xpReward: 200, concepts: ["greedy", "exchange argument"] }),
  node({ id: "dsa:t6:backtracking", tier: 6, title: "Backtracking", description: "Search trees, pruning, classic problems (n-queens, permutations).", hardPrereqs: ["dsa:t6:recursion"], softPrereqs: [], estimatedMinutes: 25, xpReward: 220, concepts: ["backtracking", "pruning"] }),
];
