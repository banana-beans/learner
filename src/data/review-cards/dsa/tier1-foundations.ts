import type { ReviewCard } from "@/lib/types";

function makeCard(
  partial: Omit<ReviewCard, "fsrs" | "state" | "dueDate" | "createdAt">
): ReviewCard {
  return {
    ...partial,
    fsrs: { stability: 1.0, difficulty: 5.0, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0, state: "new" },
    state: "new",
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export const dsaTier1Cards: ReviewCard[] = [
  makeCard({ id: "card:dsa:t1:complexity:1", nodeId: "dsa:t1:complexity", branchId: "dsa", type: "concept",
    front: "Rank these complexities from fastest to slowest: O(n²), O(1), O(n log n), O(log n), O(n)",
    back: "O(1) < O(log n) < O(n) < O(n log n) < O(n²). Constant, logarithmic, linear, linearithmic, quadratic." }),
  makeCard({ id: "card:dsa:t1:complexity:2", nodeId: "dsa:t1:complexity", branchId: "dsa", type: "concept",
    front: "What does O(log n) mean intuitively? Give an example.",
    back: "O(log n) means the work halves with each step. Binary search is the classic example: searching 1 million elements takes only ~20 steps because each comparison eliminates half the remaining options." }),
  makeCard({ id: "card:dsa:t1:complexity:3", nodeId: "dsa:t1:complexity", branchId: "dsa", type: "concept",
    front: "What is the difference between time complexity and space complexity?",
    back: "Time complexity measures how runtime grows with input size. Space complexity measures how extra memory grows. An in-place algorithm uses O(1) extra space. Hash maps trade O(n) space for O(1) lookup time." }),

  makeCard({ id: "card:dsa:t1:arrays:1", nodeId: "dsa:t1:arrays", branchId: "dsa", type: "concept",
    front: "Explain the two-pointer technique and when to use it.",
    back: "Two pointers use two indices moving through an array (typically from opposite ends or at different speeds). Use for: palindrome checking, reversing arrays, removing duplicates from sorted arrays, and pair-sum problems. Often reduces O(n²) to O(n)." }),
  makeCard({ id: "card:dsa:t1:arrays:2", nodeId: "dsa:t1:arrays", branchId: "dsa", type: "concept",
    front: "What is the sliding window technique?",
    back: "Sliding window maintains a window of elements that grows/shrinks as you scan. Expand the right edge forward; shrink from the left when a condition is violated. Converts O(n²) subarray enumeration into O(n). Use for: max sum of size k, longest substring without repeats, minimum window substring." }),
  makeCard({ id: "card:dsa:t1:arrays:3", nodeId: "dsa:t1:arrays", branchId: "dsa", type: "concept",
    front: "Why is array access O(1) but insertion in the middle O(n)?",
    back: "Arrays are contiguous memory — arr[i] jumps directly to position i using arithmetic (base + i × size). But inserting in the middle requires shifting all subsequent elements one position right to make room, which takes O(n) moves." }),

  makeCard({ id: "card:dsa:t1:hash-maps:1", nodeId: "dsa:t1:hash-maps", branchId: "dsa", type: "concept",
    front: "Explain the 'complement' pattern for two-sum with a hash map.",
    back: "For each element, compute complement = target - element. Check if complement exists in a hash map. If yes, you've found the pair. If no, store the current element. One pass through the array: O(n) time and O(n) space." }),
  makeCard({ id: "card:dsa:t1:hash-maps:2", nodeId: "dsa:t1:hash-maps", branchId: "dsa", type: "concept",
    front: "When should you use a hash set vs a hash map?",
    back: "Hash set: when you only need to check membership (is element present?). Hash map: when you need to associate keys with values (element → count, element → index). Both have O(1) average lookup. Sets use less memory since they don't store values." }),
  makeCard({ id: "card:dsa:t1:hash-maps:3", nodeId: "dsa:t1:hash-maps", branchId: "dsa", type: "concept",
    front: "What is a hash collision and how is it handled?",
    back: "A collision occurs when two different keys hash to the same bucket. Chaining: each bucket stores a linked list of entries. Open addressing: probe for the next empty slot. Good hash functions minimize collisions. Average case stays O(1) with a good load factor." }),

  makeCard({ id: "card:dsa:t1:linked-lists:1", nodeId: "dsa:t1:linked-lists", branchId: "dsa", type: "concept",
    front: "What is the fast/slow pointer technique and what problems does it solve?",
    back: "Use two pointers: slow moves 1 step, fast moves 2 steps. When fast reaches the end, slow is at the middle. If fast and slow meet, there's a cycle (Floyd's algorithm). Solves: find middle, detect cycles, find cycle start, and find nth-from-end." }),
  makeCard({ id: "card:dsa:t1:linked-lists:2", nodeId: "dsa:t1:linked-lists", branchId: "dsa", type: "concept",
    front: "What is a dummy head node and why use it?",
    back: "A dummy (sentinel) node is a fake node placed before the real head. It eliminates edge cases when inserting/deleting the first element, since every real node always has a predecessor. After operations, return dummy.next as the new head." }),
  makeCard({ id: "card:dsa:t1:linked-lists:3", nodeId: "dsa:t1:linked-lists", branchId: "dsa", type: "concept",
    front: "Compare arrays vs linked lists: access time, insertion time, memory usage.",
    back: "Arrays: O(1) access, O(n) insertion, contiguous memory (good cache locality). Linked lists: O(n) access, O(1) insertion at known position, scattered memory (pointer overhead). Use arrays for random access; linked lists for frequent insertions/deletions at known positions." }),
];
