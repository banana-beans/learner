import type { LessonContent } from "../python-basics";

export const dsaTier1Lessons: Record<string, LessonContent> = {
  "dsa:t1:complexity": {
    nodeId: "dsa:t1:complexity",
    title: "Big-O Complexity",
    sections: [
      {
        heading: "What Is Big-O?",
        body: "Big-O notation describes how an algorithm's runtime or memory usage grows as the input size grows. It answers: 'If I double my input, how much longer will this take?' We ignore constants and lower-order terms because we care about the growth rate at scale. O(n) means the time grows linearly with input size. O(1) means the time is constant regardless of input size.",
      },
      {
        heading: "Common Complexities",
        body: "From fastest to slowest: O(1) constant — hash lookups, array access. O(log n) logarithmic — binary search, halving the problem each step. O(n) linear — scanning every element once. O(n log n) — efficient sorting (merge sort, quicksort). O(n²) quadratic — nested loops over the data. O(2ⁿ) exponential — brute-force subsets. Anything O(n log n) or better is generally considered efficient for large inputs.",
      },
      {
        heading: "Space Complexity",
        body: "Space complexity measures extra memory used beyond the input. An in-place algorithm uses O(1) extra space. Creating a copy of the input array uses O(n) space. Recursive algorithms use O(depth) stack space. When analyzing algorithms, always consider both time AND space — sometimes you trade one for the other (e.g., hash maps trade O(n) space for O(1) lookups).",
      },
    ],
    codeExamples: [
      {
        title: "O(1) vs O(n) vs O(n²)",
        code: `# O(1) — constant time
def get_first(arr):
    return arr[0]  # Always one operation

# O(n) — linear time
def find_max(arr):
    max_val = arr[0]
    for x in arr:     # n iterations
        if x > max_val:
            max_val = x
    return max_val

# O(n²) — quadratic time
def has_duplicate(arr):
    for i in range(len(arr)):       # n iterations
        for j in range(i+1, len(arr)):  # ~n iterations
            if arr[i] == arr[j]:
                return True
    return False`,
        explanation:
          "get_first is O(1) — one step. find_max is O(n) — visits every element. has_duplicate is O(n²) — nested loops compare every pair.",
      },
      {
        title: "O(log n) — binary search",
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

# Array of 1,000,000 elements? Only ~20 comparisons!`,
        explanation:
          "Each step halves the search space. 1000 elements → ~10 steps. 1,000,000 elements → ~20 steps. That's the power of O(log n).",
      },
    ],
    keyTakeaways: [
      "Big-O measures growth rate, not exact time — ignore constants and lower terms",
      "O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)",
      "Nested loops often signal O(n²) — look for loop-in-loop patterns",
      "Binary search achieves O(log n) by halving the search space each step",
      "Space complexity counts extra memory beyond the input",
      "Hash maps trade O(n) space for O(1) lookup time",
    ],
  },

  "dsa:t1:arrays": {
    nodeId: "dsa:t1:arrays",
    title: "Arrays & Strings",
    sections: [
      {
        heading: "Array Fundamentals",
        body: "An array is a contiguous block of memory where elements are stored at consecutive positions. This gives O(1) random access by index (arr[i] jumps directly to position i). However, inserting or removing from the middle requires shifting all subsequent elements — O(n). Arrays are the most fundamental data structure and the building block for strings, stacks, queues, and more.",
      },
      {
        heading: "Two-Pointer Technique",
        body: "Two pointers is a pattern where you use two indices moving through the array (usually from opposite ends or at different speeds). Classic applications: reversing an array (swap left and right, move inward), checking palindromes, removing duplicates from sorted arrays, and the container with most water problem. It often reduces O(n²) brute force to O(n).",
      },
      {
        heading: "Sliding Window",
        body: "The sliding window technique maintains a 'window' of elements as you scan the array. As you move the right edge forward, you expand the window. When a condition is violated, you shrink from the left. This is perfect for subarray problems: maximum sum of subarray of size k, longest substring without repeating characters, etc. It converts O(n²) subarray enumeration into O(n).",
      },
    ],
    codeExamples: [
      {
        title: "Two pointers: reverse an array in place",
        code: `def reverse(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1
    return arr

print(reverse([1, 2, 3, 4, 5]))  # [5, 4, 3, 2, 1]`,
        explanation:
          "Two pointers start at opposite ends and swap, moving inward. O(n) time, O(1) space — in-place reversal.",
      },
      {
        title: "Sliding window: max sum of subarray of size k",
        code: `def max_subarray_sum(arr, k):
    window_sum = sum(arr[:k])  # Initial window
    max_sum = window_sum

    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]  # Slide: add new, remove old
        max_sum = max(max_sum, window_sum)

    return max_sum

print(max_subarray_sum([2, 1, 5, 1, 3, 2], 3))  # 9 (5+1+3)`,
        explanation:
          "Instead of recalculating the sum for each window (O(nk)), we slide: add the new element, subtract the old one. O(n) total.",
      },
    ],
    keyTakeaways: [
      "Array access by index is O(1); insertion/deletion in the middle is O(n)",
      "Two pointers: use two indices moving inward or at different speeds",
      "Sliding window: maintain a window that grows and shrinks — great for subarray problems",
      "Both techniques convert O(n²) brute force into O(n)",
      "Strings are just arrays of characters — the same techniques apply",
    ],
  },

  "dsa:t1:hash-maps": {
    nodeId: "dsa:t1:hash-maps",
    title: "Hash Maps & Sets",
    sections: [
      {
        heading: "How Hash Maps Work",
        body: "A hash map stores key-value pairs with O(1) average lookup, insertion, and deletion. It works by computing a hash function on the key to determine which 'bucket' to store the value in. When two keys hash to the same bucket (a collision), the map handles it via chaining (linked lists) or open addressing. Python's dict, JavaScript's Map/object, and C#'s Dictionary are all hash maps.",
      },
      {
        heading: "Frequency Counting Pattern",
        body: "One of the most common hash map patterns is frequency counting: loop through a collection and count occurrences. This solves problems like: finding the most frequent element, checking if two strings are anagrams (same letter frequencies), finding the first non-repeating character, and grouping elements. Building a frequency map is O(n), and lookups are O(1).",
      },
      {
        heading: "Hash Sets for Uniqueness",
        body: "A hash set stores unique elements with O(1) add, remove, and contains operations. Use it when you need fast membership testing without values. Applications: detecting duplicates, finding intersection/union of arrays, and the 'two-sum complement' pattern where you check if the complement of each number exists in the set.",
      },
    ],
    codeExamples: [
      {
        title: "Two Sum using a hash map",
        code: `def two_sum(nums, target):
    seen = {}  # value -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

print(two_sum([2, 7, 11, 15], 9))  # [0, 1]`,
        explanation:
          "For each number, check if its complement (target - num) exists in the map. O(n) time and O(n) space — much better than O(n²) brute force.",
      },
      {
        title: "Frequency counting: is anagram",
        code: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    freq = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    for c in t:
        freq[c] = freq.get(c, 0) - 1
        if freq[c] < 0:
            return False
    return True

print(is_anagram("listen", "silent"))  # True`,
        explanation:
          "Count frequencies from the first string, then decrement from the second. If any count goes negative, it's not an anagram. O(n) time.",
      },
    ],
    keyTakeaways: [
      "Hash maps provide O(1) average lookup, insert, and delete",
      "The 'complement' pattern: for each element, check if (target - element) exists",
      "Frequency counting: loop and count with a dict — solves anagram, mode, grouping problems",
      "Hash sets test membership in O(1) — use for duplicate detection",
      "Hash maps trade O(n) space for O(1) lookups — a common and worthwhile trade",
    ],
  },

  "dsa:t1:linked-lists": {
    nodeId: "dsa:t1:linked-lists",
    title: "Linked Lists",
    sections: [
      {
        heading: "What Is a Linked List?",
        body: "A linked list is a chain of nodes where each node stores a value and a pointer to the next node. Unlike arrays, linked list elements are not contiguous in memory — each node can be anywhere. This means O(1) insertion and deletion at known positions (just rewire pointers), but O(n) access by index (must traverse from the head). A doubly linked list adds a 'prev' pointer for backward traversal.",
      },
      {
        heading: "Core Operations",
        body: "Insertion: to insert after a node, create a new node, point it to the next node, then update the previous node's next pointer. Deletion: point the previous node's next to the node after the target, then the target is unlinked. Both are O(1) if you have a reference to the insertion/deletion point. Traversal is always O(n) — start at head and follow next pointers until null.",
      },
      {
        heading: "Common Patterns: Dummy Head and Fast/Slow",
        body: "Dummy head: create a fake node before the real head. This eliminates edge cases when inserting/deleting the first element. Fast/slow pointers: move one pointer at 2x speed. When fast reaches the end, slow is at the middle. This also detects cycles — if fast and slow ever meet, there's a cycle (Floyd's algorithm). These two patterns solve most linked list interview problems.",
      },
    ],
    codeExamples: [
      {
        title: "Linked list node and traversal",
        code: `class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

# Create: 1 -> 2 -> 3
head = Node(1, Node(2, Node(3)))

# Traverse
current = head
while current:
    print(current.val, end=" ")  # 1 2 3
    current = current.next`,
        explanation:
          "Each Node stores a value and a pointer to the next node. Traversal follows the chain until current is None (end of list).",
      },
      {
        title: "Fast/slow pointers: find the middle",
        code: `def find_middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next        # 1 step
        fast = fast.next.next   # 2 steps
    return slow.val

# 1 -> 2 -> 3 -> 4 -> 5
head = Node(1, Node(2, Node(3, Node(4, Node(5)))))
print(find_middle(head))  # 3`,
        explanation:
          "Fast moves 2x speed. When fast reaches the end, slow is at the middle. O(n) time, O(1) space. Works for any list length.",
      },
    ],
    keyTakeaways: [
      "Linked lists have O(1) insertion/deletion (at known position) but O(n) access by index",
      "Each node stores a value and a 'next' pointer (also 'prev' in doubly linked lists)",
      "Dummy head eliminates edge cases for operations at the beginning",
      "Fast/slow pointers find the middle and detect cycles",
      "Arrays vs linked lists: arrays for random access, linked lists for frequent insertions/deletions",
    ],
  },
};
