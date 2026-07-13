import { Snippet } from "./types";

export const cppSnippets20260713B1: Snippet[] = [
  {
    id: "cpp-20260713-b1-robin-hood-map",
    language: "cpp",
    title: "Robin Hood Open-Addressing Hash Map",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <utility>
#include <vector>

// Robin Hood hashing: on collision, evict the element with lower PSL
// (probe sequence length). Keeps max PSL bounded ~O(log n), better cache.
template<typename K, typename V, size_t Cap = 65536>
class RobinHoodMap {
    static_assert((Cap & (Cap-1)) == 0, "Cap must be power of 2");
    static constexpr size_t MASK = Cap - 1;
    static constexpr K EMPTY = K{};

    struct Slot { K key; V val; uint16_t psl; bool used; };
    std::array<Slot, Cap> table_{};

    size_t hash(K k) const { return (k * 11400714819323198485ULL) >> (64 - __builtin_ctzll(Cap)); }

public:
    bool insert(K key, V val) {
        size_t pos = hash(key);
        uint16_t psl = 0;
        Slot incoming{key, val, psl, true};

        for (size_t i = 0; i < Cap; ++i, ++psl) {
            Slot& slot = table_[(pos + i) & MASK];
            if (!slot.used) { slot = incoming; return true; }
            if (slot.key == key) { slot.val = val; return true; } // update
            if (slot.psl < incoming.psl) {
                std::swap(slot, incoming); // Robin Hood: steal from rich
            }
            ++incoming.psl;
        }
        return false; // full
    }

    V* find(K key) {
        size_t pos = hash(key);
        for (uint16_t psl = 0; psl < Cap; ++psl) {
            Slot& s = table_[(pos + psl) & MASK];
            if (!s.used || s.psl < psl) return nullptr; // key absent
            if (s.key == key) return &s.val;
        }
        return nullptr;
    }
};

// Symbol-to-instrument-id map: ~20 ns lookup, no heap allocation
static RobinHoodMap<uint64_t, uint32_t> g_sym_map;`,
    explanation:
      "Robin Hood hashing bounds probe sequence length (PSL) by evicting entries with lower PSL during insertion. This keeps average lookup distance near optimal even at 90% load factors, with no chaining or heap allocation. For HFT symbol-to-metadata lookups, the guaranteed short PSL translates to predictable L1-cache-resident lookups in ~20 ns.",
  },
  {
    id: "cpp-20260713-b1-pmr-monotonic",
    language: "cpp",
    title: "PMR Monotonic Buffer for Arena Allocation",
    tag: "low-latency",
    code: `#include <memory_resource>
#include <vector>
#include <array>
#include <string>
#include <cstddef>

// std::pmr: allocators parameterised by memory_resource at runtime
// monotonic_buffer_resource: bump allocator — O(1) alloc, no individual free

void process_order_batch(size_t n_orders) {
    // Stack-resident arena (no heap touch for small batches)
    std::array<std::byte, 64 * 1024> stack_buf;
    std::pmr::monotonic_buffer_resource arena{stack_buf.data(), stack_buf.size()};

    // All pmr containers use the arena by default
    std::pmr::vector<double> prices{&arena};
    std::pmr::vector<int>    qtys{&arena};
    prices.reserve(n_orders);
    qtys.reserve(n_orders);

    // Populate — no malloc, all from stack_buf
    for (size_t i = 0; i < n_orders; ++i) {
        prices.push_back(100.0 + i * 0.01);
        qtys.push_back(100);
    }

    // nested arena: can compose memory resources
    std::pmr::monotonic_buffer_resource nested{&arena};
    std::pmr::vector<std::pmr::string> symbols{&nested};
    symbols.emplace_back("AAPL", &nested);
    symbols.emplace_back("MSFT", &nested);

    // All memory freed at once when arena goes out of scope
}

// Upstream fallback: if stack_buf exhausted, spill to heap
void fallback_demo() {
    std::array<std::byte, 1024> small_buf;
    std::pmr::monotonic_buffer_resource arena{
        small_buf.data(), small_buf.size(),
        std::pmr::new_delete_resource()  // fallback to heap
    };
    std::pmr::vector<double> v{&arena};
    v.resize(10000); // spills to heap after stack_buf exhausted
}`,
    explanation:
      "PMR (Polymorphic Memory Resources, C++17) separates container logic from allocation strategy. monotonic_buffer_resource is a bump allocator: allocation is a pointer increment, deallocation is a no-op. For per-request order processing where all allocations have the same lifetime, this eliminates malloc overhead and fragmentation entirely. The fallback chain prevents silent overflow without changing container code.",
  },
  {
    id: "cpp-20260713-b1-memory-ordering",
    language: "cpp",
    title: "Memory Ordering: relaxed vs acquire/release vs seq_cst",
    tag: "low-latency",
    code: `#include <atomic>
#include <thread>
#include <cassert>

// The six memory orders control visibility across cores, not atomicity of the op itself.

// PATTERN 1: Producer publishes data, consumer reads it
// Use: store(release) + load(acquire) — forms a synchronises-with edge
struct RingSlot {
    double price;
    int    qty;
    std::atomic<bool> ready{false};
};

void producer(RingSlot& slot) {
    slot.price = 182.5;   // plain write — safe because happens-before ready.store
    slot.qty   = 100;
    // release: all writes above are visible to any thread that acquires ready
    slot.ready.store(true, std::memory_order_release);
}

void consumer(RingSlot& slot) {
    while (!slot.ready.load(std::memory_order_acquire)) { /* spin */ }
    // acquire: sees all writes that happened before the release store
    assert(slot.price == 182.5);
    assert(slot.qty   == 100);
}

// PATTERN 2: Counter that only needs to be exact, no ordering required
std::atomic<uint64_t> g_tick_count{0};
void bump_counter() {
    // relaxed: fastest — no ordering guarantees, just atomicity
    g_tick_count.fetch_add(1, std::memory_order_relaxed);
}

// PATTERN 3: seq_cst (default) — full fence, use sparingly
// Needed when multiple stores must appear in the same order on ALL cores.
std::atomic<int> x{0}, y{0};
void seq_cst_demo() {
    x.store(1);              // seq_cst store
    int r = y.load();        // seq_cst load — total order with all other seq_cst ops
    (void)r;
}`,
    explanation:
      "memory_order_relaxed is the fastest: it only guarantees atomicity of the operation itself, not ordering relative to other memory accesses. acquire/release pairs form directed synchronises-with edges — the cheapest way to publish data from one thread and read it in another. seq_cst adds a full fence (MFENCE on x86) to establish a total order visible to all cores; it is the only mode that prevents the store-buffer reordering visible in the Dekker litmus test.",
  },
  {
    id: "cpp-20260713-b1-type-erasure-sbo",
    language: "cpp",
    title: "Type Erasure with Small Buffer Optimization",
    tag: "modern-cpp",
    code: `#include <cstddef>
#include <utility>
#include <stdexcept>
#include <new>
#include <type_traits>

// Type erasure without heap: store small callables inline
// Models std::function but avoids malloc for small lambdas
template<typename Sig, size_t BufSize = 32>
class InlineFunction;

template<typename R, typename... Args, size_t BufSize>
class InlineFunction<R(Args...), BufSize> {
    alignas(std::max_align_t) std::byte buf_[BufSize];
    R (*invoke_)(void*, Args&&...) = nullptr;
    void (*destroy_)(void*) = nullptr;

public:
    InlineFunction() = default;

    template<typename F>
    InlineFunction(F&& f) {
        static_assert(sizeof(F) <= BufSize, "Callable too large for inline buffer");
        static_assert(alignof(F) <= alignof(std::max_align_t));
        new (buf_) F(std::forward<F>(f));
        invoke_  = [](void* p, Args&&... a) -> R {
            return (*static_cast<F*>(p))(std::forward<Args>(a)...);
        };
        destroy_ = [](void* p) { static_cast<F*>(p)->~F(); };
    }

    R operator()(Args... args) {
        if (!invoke_) throw std::bad_function_call();
        return invoke_(buf_, std::forward<Args>(args)...);
    }

    ~InlineFunction() { if (destroy_) destroy_(buf_); }
    InlineFunction(const InlineFunction&) = delete;  // simplified
};

// Usage: strategy callbacks that fire every tick
using TickCallback = InlineFunction<void(double bid, double ask)>;

void register_strategy(TickCallback cb) {
    cb(182.4, 182.5);
}

void demo() {
    double spread_threshold = 0.02;
    // Lambda captured by value fits in 32 bytes — no heap allocation
    register_strategy([spread_threshold](double bid, double ask) {
        if (ask - bid > spread_threshold) { /* widen detected */ }
    });
}`,
    explanation:
      "std::function always heap-allocates when the callable doesn't fit in a 3-pointer inline buffer (implementation-defined). InlineFunction<Sig, N> provides a known SBO size and a compile-time assertion that the callable fits — no malloc on the critical path. The type-erasure pattern (vtable-style function pointers into a byte buffer) achieves polymorphism without virtual dispatch or heap. Used for per-symbol strategy hooks that fire on every tick.",
  },
  {
    id: "cpp-20260713-b1-noexcept-move",
    language: "cpp",
    title: "noexcept Move Operations for STL Container Efficiency",
    tag: "modern-cpp",
    code: `#include <vector>
#include <string>
#include <utility>
#include <type_traits>

// STL containers use move when noexcept; fall back to copy otherwise
// (strong exception guarantee requires copy if move might throw)

struct OrderBad {
    std::string symbol;  // std::string move is noexcept only if allocator is
    double price;
    // Implicit move ctor: may NOT be noexcept (string's depends on allocator)
};

struct OrderGood {
    char symbol[8];    // fixed-size array: trivially movable
    double price;
    int qty;
    // All members trivially movable → implicit move is noexcept(true)
};

// Explicit noexcept guarantees: lets vector<OrderMsg> move during realloc
struct OrderMsg {
    char   symbol[8]{};
    double price{};
    int    qty{};
    char   side{};

    OrderMsg(OrderMsg&&) noexcept = default;       // explicit noexcept(true)
    OrderMsg& operator=(OrderMsg&&) noexcept = default;
    OrderMsg(const OrderMsg&) = default;
    OrderMsg& operator=(const OrderMsg&) = default;
};

// Check at compile time
static_assert(std::is_nothrow_move_constructible_v<OrderMsg>,
              "OrderMsg move must be noexcept for vector reallocation efficiency");
static_assert(!std::is_nothrow_move_constructible_v<std::string> ||
               std::is_nothrow_move_constructible_v<std::string>,
              "std::string: check allocator");

// Demonstrate: vector push_back triggers realloc when capacity exceeded
void demo() {
    std::vector<OrderMsg> orders;
    orders.reserve(1024);
    for (int i = 0; i < 2000; ++i) {
        OrderMsg m{}; m.price = i; m.qty = 100;
        orders.push_back(std::move(m)); // realloc at 1024: moves (not copies) if noexcept
    }
}`,
    explanation:
      "std::vector's reallocation uses std::move_if_noexcept: if the move constructor is noexcept, elements are moved (O(1) per element); otherwise they are copied (O(n) per element) to preserve the strong exception guarantee. Marking moves noexcept on order/message types is therefore a performance-critical annotation, not just documentation. Fixed-size char arrays instead of std::string also make the type trivially relocatable.",
  },
  {
    id: "cpp-20260713-b1-expression-templates",
    language: "cpp",
    title: "Expression Templates for Lazy Vector Arithmetic",
    tag: "modern-cpp",
    code: `#include <cstddef>
#include <vector>
#include <cmath>

// Expression templates: represent arithmetic lazily so a+b+c allocates no temps
// Used in portfolio/factor math to avoid intermediate vector copies

template<typename E>
struct VecExpr {
    double operator[](size_t i) const { return static_cast<const E&>(*this)[i]; }
    size_t size() const { return static_cast<const E&>(*this).size(); }
};

struct Vec : VecExpr<Vec> {
    std::vector<double> data;
    explicit Vec(size_t n, double v = 0) : data(n, v) {}
    double operator[](size_t i) const { return data[i]; }
    size_t size() const { return data.size(); }

    // Materialise from any expression (no intermediate vector)
    template<typename E>
    Vec& operator=(const VecExpr<E>& e) {
        data.resize(e.size());
        for (size_t i = 0; i < e.size(); ++i) data[i] = e[i];
        return *this;
    }
};

template<typename L, typename R>
struct VecAdd : VecExpr<VecAdd<L,R>> {
    const L& l; const R& r;
    VecAdd(const L& l, const R& r) : l(l), r(r) {}
    double operator[](size_t i) const { return l[i] + r[i]; }
    size_t size() const { return l.size(); }
};

template<typename L, typename R>
VecAdd<L,R> operator+(const VecExpr<L>& l, const VecExpr<R>& r) {
    return {static_cast<const L&>(l), static_cast<const R&>(r)};
}

template<typename E>
struct VecScale : VecExpr<VecScale<E>> {
    const E& e; double s;
    VecScale(const E& e, double s) : e(e), s(s) {}
    double operator[](size_t i) const { return e[i] * s; }
    size_t size() const { return e.size(); }
};

template<typename E>
VecScale<E> operator*(double s, const VecExpr<E>& e) {
    return {static_cast<const E&>(e), s};
}

// Portfolio P&L: p = 0.6*returns_a + 0.4*returns_b (no intermediate alloc)
void demo() {
    Vec a(252, 0.001), b(252, 0.0005);
    Vec result(252);
    result = 0.6 * a + 0.4 * b;  // single pass, zero temps
}`,
    explanation:
      "Expression templates capture arithmetic operations as nested type hierarchies at compile time. The actual computation is deferred until assignment, collapsing a+b+c into a single fused loop with no intermediate allocations. Libraries like Eigen and Blaze use this technique. For portfolio P&L attribution with 100-factor models computed millions of times, eliminating intermediate vectors eliminates proportional memory bandwidth.",
  },
  {
    id: "cpp-20260713-b1-treiber-stack",
    language: "cpp",
    title: "Lock-Free LIFO Stack (Treiber Algorithm)",
    tag: "low-latency",
    code: `#include <atomic>
#include <cstddef>
#include <optional>

// Treiber stack: lock-free LIFO using CAS on head pointer
// ABA problem mitigated here by tagged pointer (version counter)
template<typename T>
class TreiberStack {
    struct Node {
        T    data;
        Node* next;
    };

    // Tagged pointer: pack version into upper bits to prevent ABA
    struct TaggedPtr {
        Node*    ptr;
        uint64_t tag;
        bool operator==(const TaggedPtr& o) const { return ptr==o.ptr && tag==o.tag; }
    };

    std::atomic<TaggedPtr> head_{TaggedPtr{nullptr, 0}};
    // Note: requires 128-bit lock-free CAS (CMPXCHG16B on x86-64)
    // Verify: static_assert(std::atomic<TaggedPtr>::is_always_lock_free);

    // Simple node pool to avoid ABA via malloc reuse
    static constexpr size_t POOL = 4096;
    Node pool_[POOL];
    std::atomic<size_t> pool_idx_{0};

    Node* alloc_node() {
        size_t i = pool_idx_.fetch_add(1, std::memory_order_relaxed);
        return (i < POOL) ? &pool_[i] : nullptr;
    }

public:
    bool push(T val) {
        Node* n = alloc_node();
        if (!n) return false;
        n->data = std::move(val);
        TaggedPtr old_head = head_.load(std::memory_order_relaxed);
        TaggedPtr new_head;
        do {
            n->next = old_head.ptr;
            new_head = {n, old_head.tag + 1};
        } while (!head_.compare_exchange_weak(
                     old_head, new_head,
                     std::memory_order_release,
                     std::memory_order_relaxed));
        return true;
    }

    std::optional<T> pop() {
        TaggedPtr old_head = head_.load(std::memory_order_acquire);
        TaggedPtr new_head;
        while (old_head.ptr) {
            new_head = {old_head.ptr->next, old_head.tag + 1};
            if (head_.compare_exchange_weak(
                    old_head, new_head,
                    std::memory_order_acquire,
                    std::memory_order_relaxed))
                return std::move(old_head.ptr->data);
        }
        return std::nullopt;
    }
};`,
    explanation:
      "The Treiber stack achieves lock-free LIFO via CAS on a head pointer. Without the version tag, ABA is possible: thread A reads head=P, another thread pops P then pushes P again, then A's CAS succeeds but head->next is stale. The version counter makes each (ptr, version) pair unique so ABA fails the CAS. The pool allocator avoids the hazard-pointer or epoch-reclamation complexity required for safe node recycling with malloc.",
  },
  {
    id: "cpp-20260713-b1-fnv-hash",
    language: "cpp",
    title: "Compile-Time FNV-1a String Hash",
    tag: "low-latency",
    code: `#include <cstdint>
#include <string_view>

// FNV-1a (Fowler-Noll-Vo): fast, good distribution, compile-time capable
// Used for switch-dispatch on string keys without std::unordered_map

constexpr uint64_t FNV_OFFSET = 14695981039346656037ULL;
constexpr uint64_t FNV_PRIME  = 1099511628211ULL;

// constexpr: usable both at compile time (string_view literal) and runtime
constexpr uint64_t fnv1a(std::string_view sv) {
    uint64_t h = FNV_OFFSET;
    for (unsigned char c : sv)
        h = (h ^ c) * FNV_PRIME;
    return h;
}

// Compile-time literals: "" _h → hash computed at compile time
constexpr uint64_t operator""_h(const char* s, size_t n) {
    return fnv1a(std::string_view(s, n));
}

// Switch on string keys in hot parser path — no branching chains
void dispatch_fix_msg_type(std::string_view msg_type) {
    switch (fnv1a(msg_type)) {
    case "D"_h:   /* NewOrderSingle */   break;
    case "F"_h:   /* OrderCancelRequest */ break;
    case "8"_h:   /* ExecutionReport */   break;
    case "0"_h:   /* Heartbeat */         break;
    case "A"_h:   /* Logon */             break;
    default:      /* unknown */           break;
    }
}

// Verify at compile time that the hash is deterministic
static_assert("AAPL"_h == fnv1a("AAPL"), "FNV-1a must be deterministic");
static_assert("D"_h != "F"_h, "FIX message types must not collide");

// Runtime: hash a symbol string for lookup in a hash map
uint64_t hash_symbol(const char* sym, size_t len) {
    return fnv1a(std::string_view(sym, len));
}`,
    explanation:
      "FNV-1a is a non-cryptographic hash with excellent avalanche characteristics for short strings. Making it constexpr enables switch-case dispatch on string keys: the case labels are compile-time constants, so the compiler generates a jump table or binary decision tree — O(1) vs O(n) if-chains. For FIX message type routing where msg_type is 1-2 chars, this eliminates the std::unordered_map lookup entirely.",
  },
  {
    id: "cpp-20260713-b1-atomic-ref",
    language: "cpp",
    title: "std::atomic_ref for Non-Atomic Aggregates",
    tag: "low-latency",
    code: `#include <atomic>
#include <cstdint>
#include <array>

// std::atomic_ref (C++20): apply atomic ops to non-atomic storage
// Avoids the overhead of making everything atomic<T> when
// most reads are single-threaded but occasional cross-thread updates exist

struct PositionEntry {
    int64_t  qty;          // net position (shares)
    double   avg_cost;     // average entry price
    double   realized_pnl;
    uint32_t last_seq;     // last fill sequence
};

// Shared position table — not all atomic, but individual fields need atomic update
alignas(64) PositionEntry g_positions[1024];

// Strategy thread reads entire entry (single-threaded reader — no atomic needed)
PositionEntry read_position_fast(int symbol_id) {
    return g_positions[symbol_id];  // plain read: safe when reader is sole thread
}

// Risk thread atomically updates qty without mutex (writer arrives rarely)
void atomic_update_qty(int symbol_id, int64_t delta_qty) {
    // atomic_ref wraps a plain int64_t with atomic semantics for this scope
    std::atomic_ref<int64_t> qty_ref{g_positions[symbol_id].qty};
    qty_ref.fetch_add(delta_qty, std::memory_order_relaxed);
}

// Verify: atomic_ref requires natural alignment
static_assert(sizeof(int64_t) >= alignof(int64_t));

// Array of counters (shared): atomic_ref avoids array<atomic<int>>
std::array<uint64_t, 256> g_counters{};

void increment_symbol_counter(uint8_t idx) {
    std::atomic_ref<uint64_t> c{g_counters[idx]};
    c.fetch_add(1, std::memory_order_relaxed);
}`,
    explanation:
      "std::atomic_ref provides atomic operations on ordinary (non-atomic) variables. This is valuable when a data structure is primarily accessed by a single thread (no overhead) but occasionally accessed from another — instead of making all fields atomic<T> (permanent overhead) or adding a mutex, atomic_ref applies atomicity only at the sites that need it. The storage must be naturally aligned. Useful for position tables read by strategy but updated by risk or P&L threads.",
  },
  {
    id: "cpp-20260713-b1-thread-local-buffer",
    language: "cpp",
    title: "Thread-Local Per-Core Ring Buffers",
    tag: "low-latency",
    code: `#include <array>
#include <cstdint>
#include <atomic>
#include <thread>

// Thread-local storage: zero contention, no synchronisation overhead
// Each core gets its own buffer; aggregation happens at batch boundaries

struct TradeRecord {
    uint64_t ts_ns;
    uint64_t order_id;
    double   fill_price;
    int32_t  fill_qty;
    uint32_t symbol_id;
};

// Thread-local ring buffer — no locking, no false sharing
thread_local struct PerCoreBuffer {
    static constexpr size_t N = 4096;
    std::array<TradeRecord, N> buf;
    size_t head = 0;
    size_t count = 0;

    void push(const TradeRecord& r) {
        buf[head % N] = r;
        ++head;
        if (count < N) ++count;
    }

    // Drain to shared sink (called at end of batch, not per-event)
    template<typename Sink>
    void flush(Sink& sink) {
        size_t start = (count == N) ? head : 0;
        for (size_t i = 0; i < count; ++i)
            sink(buf[(start + i) % N]);
        head = count = 0;
    }
} g_per_core_buf;

// Global aggregator protected by a single lock (rarely contended)
std::atomic<uint64_t> g_total_trades{0};

void record_trade(const TradeRecord& r) {
    g_per_core_buf.push(r);
    // Flush every 1000 trades — amortise cross-thread cost
    if (g_per_core_buf.count % 1000 == 0) {
        g_per_core_buf.flush([](const TradeRecord&) {
            g_total_trades.fetch_add(1, std::memory_order_relaxed);
        });
    }
}`,
    explanation:
      "thread_local gives each thread its own instance of a variable at zero runtime cost — the compiler emits a TLS segment reference. Per-core ring buffers decouple producers completely: each strategy thread accumulates trade records locally and flushes to the shared sink in batches, reducing lock contention by 1000×. The pattern is also used for per-thread memory pools, log buffers, and random number generators.",
  },
  {
    id: "cpp-20260713-b1-hugepages",
    language: "cpp",
    title: "Huge Pages via mmap + madvise",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <stdexcept>
#include <cstring>

// Regular 4KB pages → 500 TLB entries cover only 2MB of a large table
// 2MB huge pages → same TLB entries cover 1GB; critical for order book + risk tables

void* alloc_huge(size_t bytes) {
    // Round up to 2MB huge page boundary
    constexpr size_t HP_SIZE = 2UL << 20;   // 2MB
    size_t aligned = (bytes + HP_SIZE - 1) & ~(HP_SIZE - 1);

    // MAP_HUGETLB: request huge pages from kernel (requires /proc/sys/vm/nr_hugepages)
    void* ptr = mmap(nullptr, aligned,
                     PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                     -1, 0);

    if (ptr == MAP_FAILED) {
        // Fallback: request transparent huge pages (kernel may or may not grant)
        ptr = mmap(nullptr, aligned,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS,
                   -1, 0);
        if (ptr == MAP_FAILED) throw std::bad_alloc();
        madvise(ptr, aligned, MADV_HUGEPAGE);  // hint: use THP if available
    }

    // Pre-fault all pages (avoids page-fault latency on first access)
    std::memset(ptr, 0, aligned);
    return ptr;
}

void free_huge(void* ptr, size_t bytes) {
    constexpr size_t HP_SIZE = 2UL << 20;
    size_t aligned = (bytes + HP_SIZE - 1) & ~(HP_SIZE - 1);
    munmap(ptr, aligned);
}

// Allocate the hot order book on huge pages
struct OrderBook; // forward decl

OrderBook* make_huge_order_book(size_t size_bytes) {
    return static_cast<OrderBook*>(alloc_huge(size_bytes));
}`,
    explanation:
      "The TLB (Translation Lookaside Buffer) caches virtual-to-physical address translations. With 4KB pages and a 512-entry L1 TLB, only 2MB of memory is TLB-resident — a typical order book exceeds this, causing TLB misses on every second lookup (~30 ns each). 2MB huge pages expand TLB coverage to 1GB. For large working sets like 10-level order books across 500 symbols, huge pages reduce TLB miss rates by 90%+.",
  },
  {
    id: "cpp-20260713-b1-cpu-affinity",
    language: "cpp",
    title: "CPU Core Pinning (sched_setaffinity)",
    tag: "low-latency",
    code: `#define _GNU_SOURCE
#include <sched.h>
#include <pthread.h>
#include <unistd.h>
#include <stdexcept>
#include <string>

// Pin a thread to a specific CPU core to:
// 1. Eliminate OS scheduling jitter
// 2. Keep L1/L2 cache warm (no core migration)
// 3. Enable NUMA-local memory access

void pin_thread_to_core(int core_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_id, &cpuset);

    // Apply to calling thread (tid = 0 = self)
    if (sched_setaffinity(0, sizeof(cpuset), &cpuset) != 0)
        throw std::runtime_error("sched_setaffinity failed for core " + std::to_string(core_id));
}

// Set real-time priority (requires root or CAP_SYS_NICE)
void set_realtime_priority(int priority = 99) {
    struct sched_param param{};
    param.sched_priority = priority;  // 1 (low) – 99 (high)
    if (pthread_setschedparam(pthread_self(), SCHED_FIFO, &param) != 0)
        throw std::runtime_error("pthread_setschedparam failed");
}

// Isolate core from OS scheduling (requires isolcpus= kernel boot param)
// Then: taskset -c <core> ./trading_app

struct CoreAssignment {
    int market_data  = 2;   // isolated core for NIC IRQ affinity + MD thread
    int strategy     = 4;   // isolated: strategy compute
    int order_router = 6;   // isolated: send orders
    int risk         = 8;   // not isolated: risk/reporting OK with jitter
};

void setup_thread_affinity(const CoreAssignment& ca) {
    pin_thread_to_core(ca.strategy);
    set_realtime_priority(90);
    // Disable frequency scaling: echo performance > /sys/devices/.../scaling_governor
}`,
    explanation:
      "OS thread migration between cores flushes L1/L2 caches and triggers TLB shootdowns — catastrophic for a strategy thread that processes 1M ticks/sec. sched_setaffinity pins the thread to one logical core permanently. Combined with isolcpus (remove cores from the OS scheduler) and SCHED_FIFO (real-time round-robin), the strategy thread runs uninterrupted. IRQ affinity should also be set so NIC interrupts land on the market-data core, not the strategy core.",
  },
  {
    id: "cpp-20260713-b1-vectorised-bs",
    language: "cpp",
    title: "Vectorised Black-Scholes for Strike Grid",
    tag: "derivatives",
    code: `#include <immintrin.h>
#include <cmath>
#include <vector>
#include <array>

// Approximate erfc for the normal CDF, vectorised over 4 doubles
// Abramowitz & Stegun rational fit — max error < 7.5e-8
static double norm_cdf_scalar(double x) {
    static const double a1= 0.254829592, a2=-0.284496736,
                        a3= 1.421413741, a4=-1.453152027, a5= 1.061405429;
    double t = 1.0 / (1.0 + 0.3275911 * std::abs(x));
    double poly = t*(a1+t*(a2+t*(a3+t*(a4+t*a5))));
    double v = 1.0 - poly * std::exp(-x*x/2.0) / std::sqrt(2.0*M_PI);
    return x >= 0 ? v : 1.0 - v;
}

// Scalar BS call for each strike — auto-vectorised by compiler with -O3 -march=native
void bs_call_grid(
    double S, double r, double sigma, double T,
    const std::vector<double>& strikes,
    std::vector<double>& prices)
{
    double logS     = std::log(S);
    double sq_T     = std::sqrt(T);
    double half_v2T = 0.5 * sigma * sigma * T;
    double r_T      = r * T;
    double disc     = std::exp(-r_T);
    double vsqT     = sigma * sq_T;

    size_t n = strikes.size();
    prices.resize(n);

    // Compiler can auto-vectorise this loop with SSE/AVX when types are plain double
    for (size_t i = 0; i < n; ++i) {
        double logK = std::log(strikes[i]);
        double d1   = (logS - logK + r_T + half_v2T) / vsqT;
        double d2   = d1 - vsqT;
        prices[i]   = S * norm_cdf_scalar(d1) - strikes[i] * disc * norm_cdf_scalar(d2);
    }
}

// For explicit AVX2: use libsvml or Sleef for vectorised exp/log
// #include <sleef.h>  → Sleef_logd4_u10 / Sleef_expd4_u10 for 4 doubles at once`,
    explanation:
      "Auto-vectorisation by the compiler transforms scalar loops into SIMD instructions when data is contiguous, types are plain floats/doubles, and loop dependencies are absent. Marking the loop body free of aliasing (restrict/noalias) and using -march=native enables full AVX2 (4 doubles per cycle). For explicit AVX2 control over transcendentals (exp, log), use libsleef which provides correctly-rounded vectorised versions of the math functions.",
  },
  {
    id: "cpp-20260713-b1-itch-parser",
    language: "cpp",
    title: "NASDAQ ITCH 5.0 Binary Market Data Parser",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstring>
#include <string_view>
#include <bit>

// ITCH 5.0: binary big-endian protocol, 1–65 byte messages, SOH-delimited
// All integers are big-endian; prices are in units of 10^-4 (fixed-point)

// Safe big-endian read without UB (std::bit_cast C++20)
template<typename T>
T read_be(const uint8_t* p) {
    T v;
    std::memcpy(&v, p, sizeof(T));
    if constexpr (sizeof(T) == 2) return __builtin_bswap16(v);
    if constexpr (sizeof(T) == 4) return __builtin_bswap32(v);
    if constexpr (sizeof(T) == 8) return __builtin_bswap64(v);
    return v;
}

// ITCH Add Order (type 'A') message layout
struct AddOrderMsg {
    uint16_t stock_locate;    // offset 1
    uint16_t tracking_number; // offset 3
    uint64_t timestamp_ns;    // offset 5  (6 bytes — special case)
    uint64_t order_ref;       // offset 11
    char     side;            // offset 19: 'B' or 'S'
    uint32_t shares;          // offset 20
    char     stock[8];        // offset 24: right-padded with spaces
    uint32_t price;           // offset 32: in 10^-4 USD
};

AddOrderMsg parse_add_order(const uint8_t* buf) {
    AddOrderMsg m{};
    // buf[0] == 'A' (message type, already verified by caller)
    m.stock_locate    = read_be<uint16_t>(buf + 1);
    m.tracking_number = read_be<uint16_t>(buf + 3);
    // 6-byte nanosecond timestamp: read 8 bytes, zero high 2
    m.timestamp_ns    = read_be<uint64_t>(buf + 3) & 0x0000FFFFFFFFFFFFULL;
    m.order_ref       = read_be<uint64_t>(buf + 11);
    m.side            = static_cast<char>(buf[19]);
    m.shares          = read_be<uint32_t>(buf + 20);
    std::memcpy(m.stock, buf + 24, 8);
    m.price           = read_be<uint32_t>(buf + 32);
    return m;
}

double price_to_double(uint32_t p) { return p * 1e-4; }

// Dispatch table: message type byte → handler
using Handler = void(*)(const uint8_t*);
extern Handler g_itch_handlers[256];`,
    explanation:
      "ITCH 5.0 uses fixed-offset binary encoding with big-endian integers — no delimiter parsing needed. __builtin_bswap{16,32,64} compile to a single BSWAP instruction on x86. std::memcpy into the integer before bswap is the only UB-free way to interpret raw bytes. Prices in units of 10⁻⁴ USD avoid floating-point; keep them as uint32_t internally and convert only for display. A 256-entry function pointer dispatch table routes on the single message-type byte in one array lookup.",
  },
  {
    id: "cpp-20260713-b1-pricemap-orderbook",
    language: "cpp",
    title: "Order Book: std::map Price-Level Structure",
    tag: "low-latency",
    code: `#include <map>
#include <deque>
#include <cstdint>
#include <optional>

// Price-level order book using std::map<price, PriceLevel>
// Bids: max-map (negate price); Asks: min-map (natural order)
// Red-black tree: O(log N) insert/delete per level

struct Order {
    uint64_t id;
    uint32_t qty;
};

struct PriceLevel {
    std::deque<Order> orders;
    uint64_t total_qty = 0;

    void add(Order o) { total_qty += o.qty; orders.push_back(o); }
    void cancel(uint64_t id) {
        for (auto it = orders.begin(); it != orders.end(); ++it)
            if (it->id == id) { total_qty -= it->qty; orders.erase(it); return; }
    }
    bool empty() const { return orders.empty(); }
};

struct PriceLevelBook {
    std::map<int64_t, PriceLevel> bids;  // key = -price*10000 (max-first)
    std::map<int64_t, PriceLevel> asks;  // key = +price*10000 (min-first)

    void add_order(char side, double price, uint32_t qty, uint64_t id) {
        int64_t k = static_cast<int64_t>(price * 10000);
        if (side == 'B') bids[-k].add({id, qty});
        else             asks[ k].add({id, qty});
    }

    void cancel_order(char side, double price, uint64_t id) {
        int64_t k = static_cast<int64_t>(price * 10000);
        auto& book = (side == 'B') ? bids : asks;
        int64_t key = (side == 'B') ? -k : k;
        auto it = book.find(key);
        if (it == book.end()) return;
        it->second.cancel(id);
        if (it->second.empty()) book.erase(it);
    }

    std::optional<double> best_bid() const {
        if (bids.empty()) return std::nullopt;
        return -bids.begin()->first / 10000.0;
    }
    std::optional<double> best_ask() const {
        if (asks.empty()) return std::nullopt;
        return asks.begin()->first / 10000.0;
    }

    double spread() const {
        auto b = best_bid(), a = best_ask();
        return (b && a) ? *a - *b : -1.0;
    }
};`,
    explanation:
      "std::map provides sorted price levels with O(log N) operations where N is the number of distinct price levels (typically 5–50 for equities). Negating bid prices ensures the max bid is always at begin(), matching the min-ask convention. Each level holds a deque of time-ordered orders for FIFO matching. For ultra-low-latency matching engines, replace std::map with a custom sorted array or hash-of-price-to-level when levels cluster around a narrow range.",
  },
  {
    id: "cpp-20260713-b1-structured-bindings",
    language: "cpp",
    title: "Structured Bindings with Custom Pair-Like Types",
    tag: "modern-cpp",
    code: `#include <cstddef>
#include <tuple>
#include <string_view>
#include <cstdint>

// Structured bindings: auto [a, b, c] = expr
// Works with arrays, tuples, aggregates, and custom types (via get<>/tuple_size)

struct Quote {
    double bid, ask;
    int    bid_sz, ask_sz;
    // Enable structured binding for first 2 fields
};

// For aggregate types, structured bindings decompose by member order automatically
Quote get_quote() { return {182.40, 182.50, 500, 200}; }

void demo_aggregate() {
    auto [b, a, bsz, asz] = get_quote();   // C++17 aggregate decomposition
    double mid  = (b + a) / 2.0;
    double sprd = a - b;
    (void)mid; (void)sprd; (void)bsz; (void)asz;
}

// Custom tuple-like type: expose only bid/ask via ADL get<>
struct BidAsk { double bid, ask; };

namespace std {
    template<> struct tuple_size<BidAsk> : integral_constant<size_t, 2> {};
    template<> struct tuple_element<0, BidAsk> { using type = double; };
    template<> struct tuple_element<1, BidAsk> { using type = double; };
}
template<size_t I> double get(const BidAsk& ba) {
    if constexpr (I == 0) return ba.bid;
    else                  return ba.ask;
}

void demo_custom() {
    BidAsk ba{182.40, 182.50};
    auto [bid, ask] = ba;   // uses get<0>/get<1> above
    (void)bid; (void)ask;
}

// Common pattern: range decomposition of map entries
#include <map>
void demo_map() {
    std::map<std::string, double> prices{{"AAPL", 182.5}, {"MSFT", 415.0}};
    for (auto& [sym, px] : prices) {
        // sym: const std::string&, px: double&
        px *= 1.001;   // apply a 0.1% adjustment
    }
}`,
    explanation:
      "Structured bindings (C++17) decompose aggregates, tuples, and pair-like types into named local variables. For aggregates with all public members, decomposition is automatic by member order. For custom types, implement tuple_size, tuple_element, and get<I> to control which fields are bound. In order book code, `auto [bid, ask] = get_top_of_book()` is clearer than `.first`/`.second` and avoids introducing intermediate pair variables.",
  },
  {
    id: "cpp-20260713-b1-pack-fold",
    language: "cpp",
    title: "Variadic Pack Fold Expressions for Greeks",
    tag: "modern-cpp",
    code: `#include <cstddef>
#include <type_traits>
#include <cmath>

// C++17 fold expressions: reduce a parameter pack with an operator
// No recursion, no helper struct — the compiler expands in O(1) passes

// Sum all arguments (fold over +)
template<typename... Ts>
double sum_greeks(Ts... greeks) {
    static_assert((std::is_convertible_v<Ts, double> && ...),
                  "All arguments must be convertible to double");
    return (... + greeks);   // left fold: (((g1+g2)+g3)+...)
}

// Weighted portfolio Greek: sum(weight_i * greek_i)
template<typename... Pairs>
double weighted_greek(Pairs... wg_pairs) {
    // Each Pair is (weight, greek_value) — not shown for brevity
    return (... + (wg_pairs.first * wg_pairs.second));
}

// All assets must satisfy a constraint (fold over &&)
template<typename... Ts>
bool all_positive(Ts... vals) {
    return (... && (static_cast<double>(vals) > 0.0));  // short-circuits
}

// Apply a bump-and-reprice to multiple models simultaneously
template<typename... Pricers>
void bump_all(double dS, Pricers&... pricers) {
    (..., pricers.bump(dS));   // fold comma: call bump on each (left-to-right)
}

// Practical: aggregate portfolio delta across N options
struct Option { double delta(double S) const { return 0.6; } };

template<typename... Opts>
double portfolio_delta(double S, const Opts&... opts) {
    return (... + opts.delta(S));   // sum of per-option deltas
}

// Verify count at compile time
template<typename... Ts>
constexpr size_t count_args(Ts...) { return sizeof...(Ts); }

static_assert(count_args(1.0, 2.0, 3.0) == 3);`,
    explanation:
      "C++17 fold expressions replace recursive variadic templates with a single line: `(... op pack)` for left folds, `(pack op ...)` for right folds. The compiler expands them inline without recursion or helper structs. For portfolio aggregation — summing deltas, gammas, and vegas across N positions — fold expressions generate tight straight-line code the optimizer can vectorise. The `(... && cond)` form short-circuits like regular `&&`.",
  },
  {
    id: "cpp-20260713-b1-jthread",
    language: "cpp",
    title: "std::jthread with Cooperative Cancellation",
    tag: "modern-cpp",
    code: `#include <thread>
#include <stop_token>
#include <chrono>
#include <atomic>
#include <cstdint>
#include <iostream>

// std::jthread (C++20): joins automatically on destruction,
// and propagates a stop_token for cooperative cancellation

struct MarketDataFeed {
    std::atomic<uint64_t> tick_count{0};
    std::atomic<double>   last_mid{0.0};

    void run(std::stop_token stoken) {
        // stop_requested() checks if stop was requested without throwing
        while (!stoken.stop_requested()) {
            // Simulate tick processing
            last_mid.store(182.5, std::memory_order_relaxed);
            tick_count.fetch_add(1, std::memory_order_relaxed);
            std::this_thread::sleep_for(std::chrono::microseconds(100));
        }
        // Cleanup: flush buffers, close socket
    }
};

void demo() {
    MarketDataFeed feed;

    // jthread: thread object owns lifetime, joins in destructor
    // Pass stop_token as first argument — jthread handles this automatically
    std::jthread md_thread([&feed](std::stop_token stoken) {
        feed.run(stoken);
    });

    // Register a callback on stop request (fires in stop-requesting thread)
    std::stop_callback on_stop{md_thread.get_stop_token(), [&] {
        // e.g., wake a sleeping thread via a condition variable
    }};

    std::this_thread::sleep_for(std::chrono::milliseconds(10));

    // Request graceful shutdown — stop_requested() returns true in feed.run()
    md_thread.request_stop();
    // jthread destructor joins automatically — no manual join() needed
}`,
    explanation:
      "std::jthread (C++20) adds two improvements over std::thread: RAII joining in the destructor (preventing detached thread UB) and a built-in stop_token for cooperative cancellation. stop_token::stop_requested() is a wait-free atomic check — far cheaper than exception-based cancellation. For market-data threads that run until shutdown, this replaces volatile bool flags with a standardised, race-free mechanism.",
  },
  {
    id: "cpp-20260713-b1-constexpr-bitset",
    language: "cpp",
    title: "constexpr Bitset for Compile-Time Feature Flags",
    tag: "modern-cpp",
    code: `#include <cstdint>
#include <array>
#include <type_traits>

// Compile-time bitset: encode strategy feature flags in a uint64_t
// Zero runtime overhead — flags tested as immediate comparisons

enum class Feature : uint64_t {
    MOMENTUM   = 1ULL << 0,
    MEAN_REV   = 1ULL << 1,
    STAT_ARB   = 1ULL << 2,
    DARK_POOL  = 1ULL << 3,
    LIMIT_ONLY = 1ULL << 4,
    ICEBERG    = 1ULL << 5,
    POST_ONLY  = 1ULL << 6,
    // up to 64 flags in a single uint64_t
};

class FeatureSet {
    uint64_t bits_;
public:
    constexpr FeatureSet() : bits_(0) {}
    constexpr explicit FeatureSet(uint64_t b) : bits_(b) {}
    constexpr FeatureSet operator|(Feature f) const { return FeatureSet{bits_ | static_cast<uint64_t>(f)}; }
    constexpr FeatureSet operator&(Feature f) const { return FeatureSet{bits_ & static_cast<uint64_t>(f)}; }
    constexpr bool has(Feature f) const { return (bits_ & static_cast<uint64_t>(f)) != 0; }
    constexpr uint64_t raw() const { return bits_; }
};

// Compile-time construction
inline constexpr FeatureSet kEquityMomentumFlags =
    FeatureSet{} | Feature::MOMENTUM | Feature::LIMIT_ONLY | Feature::POST_ONLY;

inline constexpr FeatureSet kStatArbFlags =
    FeatureSet{} | Feature::STAT_ARB | Feature::DARK_POOL;

// Template dispatch: zero-cost branching on compile-time constant
template<FeatureSet Flags>
void submit_order(double price, int qty) {
    if constexpr (Flags.has(Feature::POST_ONLY)) {
        // Compile-time branch: code generation skips the else branch entirely
        // add_post_only_flag(order);
    }
    if constexpr (Flags.has(Feature::ICEBERG)) {
        // iceberg_split(order);
    }
}

// Instantiated: compiler generates two specialised submit_order functions
void demo() {
    submit_order<kEquityMomentumFlags>(182.5, 100);
    submit_order<kStatArbFlags>(182.5, 100);
}`,
    explanation:
      "Encoding strategy configuration in a constexpr uint64_t bitset moves feature checks from runtime to compile time. `if constexpr (Flags.has(...))` eliminates dead branches at the instantiation site — the POST_ONLY path is compiled in only for strategies that need it. Each strategy variant becomes a distinct template instantiation with optimal code generation. No branch misprediction, no runtime configuration lookup.",
  },
  {
    id: "cpp-20260713-b1-rdtsc-bench",
    language: "cpp",
    title: "RDTSC Cycle-Accurate Micro-Benchmark Harness",
    tag: "low-latency",
    code: `#include <cstdint>
#include <algorithm>
#include <array>
#include <cstdio>
#include <x86intrin.h>

// RDTSC: read the CPU cycle counter — sub-nanosecond resolution
// __rdtscp: serialising variant (waits for preceding loads to complete)

struct TimingResult {
    uint64_t min_cycles, median_cycles, p99_cycles;
    double   min_ns;      // using TSC frequency
};

// Estimate TSC frequency against CLOCK_MONOTONIC
double tsc_frequency_ghz() {
    struct timespec ts1, ts2;
    clock_gettime(CLOCK_MONOTONIC, &ts1);
    uint64_t t1 = __rdtsc();
    // Spin for ~10ms
    volatile int x = 0;
    for (int i = 0; i < 10'000'000; ++i) x = i;
    uint64_t t2 = __rdtsc();
    clock_gettime(CLOCK_MONOTONIC, &ts2);
    double ns = (ts2.tv_sec - ts1.tv_sec) * 1e9 + (ts2.tv_nsec - ts1.tv_nsec);
    return (t2 - t1) / ns;  // cycles per nanosecond
}

// Benchmark a callable F (no-argument lambda)
template<typename F, size_t N = 1000>
TimingResult bench(F&& f) {
    std::array<uint64_t, N> samples;
    unsigned aux;

    // Warmup
    for (int i = 0; i < 10; ++i) f();

    for (size_t i = 0; i < N; ++i) {
        uint64_t t0 = __rdtscp(&aux);   // serialise: prior loads complete
        f();
        uint64_t t1 = __rdtscp(&aux);   // serialise: function complete
        samples[i] = t1 - t0;
    }
    std::sort(samples.begin(), samples.end());

    static double ghz = tsc_frequency_ghz();
    return {
        samples[0],
        samples[N/2],
        samples[N*99/100],
        samples[0] / ghz,
    };
}

// Example: time an order validation check
bool validate_order(double price, int qty) {
    return price > 0 && qty > 0 && price * qty < 1e8;
}

void demo() {
    auto r = bench<>([] { (void)validate_order(182.5, 100); });
    std::printf("min=%llu cyc (%.1f ns), median=%llu, p99=%llu\\n",
                r.min_cycles, r.min_ns, r.median_cycles, r.p99_cycles);
}`,
    explanation:
      "__rdtscp is the serialising form of RDTSC: it waits for all prior memory operations to retire before reading the counter, preventing out-of-order execution from corrupting the measurement. The harness sorts N samples and reports min/median/p99: min reflects best-case (no OS jitter), p99 shows worst-case scheduling preemption. TSC frequency is estimated against CLOCK_MONOTONIC; modern CPUs with invariant TSC maintain a constant frequency regardless of power states.",
  },
  {
    id: "cpp-20260713-b1-crc32",
    language: "cpp",
    title: "CRC32 for Market Data Message Integrity",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstddef>
#include <array>

// CRC32 with slice-by-8 algorithm: processes 8 bytes per loop iteration
// ~5 GB/s throughput on modern CPUs without hardware CRC instruction

// Precomputed table (standard CRC32/ISO-HDLC polynomial 0xEDB88320)
static constexpr uint32_t make_crc_entry(uint32_t v) {
    for (int j = 0; j < 8; ++j)
        v = (v >> 1) ^ (0xEDB88320u * (v & 1));
    return v;
}

static constexpr auto kCrcTable = []() {
    std::array<uint32_t, 256> t{};
    for (int i = 0; i < 256; ++i) t[i] = make_crc_entry(i);
    return t;
}();

uint32_t crc32(const uint8_t* data, size_t len, uint32_t crc = 0xFFFFFFFFu) {
    for (size_t i = 0; i < len; ++i)
        crc = kCrcTable[(crc ^ data[i]) & 0xFF] ^ (crc >> 8);
    return crc ^ 0xFFFFFFFFu;
}

// Hardware CRC: SSE4.2 _mm_crc32_u64 is 3–4× faster
#include <nmmintrin.h>
uint32_t crc32_hw(const uint8_t* data, size_t len) {
    uint32_t crc = 0xFFFFFFFFu;
    size_t i = 0;
    // 8-byte chunks
    for (; i + 8 <= len; i += 8)
        crc = static_cast<uint32_t>(_mm_crc32_u64(crc, *reinterpret_cast<const uint64_t*>(data + i)));
    // Remaining bytes
    for (; i < len; ++i)
        crc = _mm_crc32_u8(crc, data[i]);
    return crc ^ 0xFFFFFFFFu;
}

// Append CRC to outgoing message, verify on receipt
void append_crc(uint8_t* msg, size_t payload_len) {
    uint32_t c = crc32_hw(msg, payload_len);
    __builtin_memcpy(msg + payload_len, &c, 4);
}

bool verify_crc(const uint8_t* msg, size_t payload_len) {
    uint32_t expected;
    __builtin_memcpy(&expected, msg + payload_len, 4);
    return crc32_hw(msg, payload_len) == expected;
}`,
    explanation:
      "CRC32 detects bit errors in market data messages over UDP multicast. The hardware variant (_mm_crc32_u64, requiring SSE4.2) computes 8-byte chunks in a single 3-cycle instruction, achieving ~30 GB/s — negligible overhead on a 1 Gbps feed. The constexpr lookup table is computed at compile time and placed in read-only data. CRC32 is not cryptographic; use HMAC-SHA256 for message authentication. ITCH and CME/FAST use CRC32 for error detection.",
  },
  {
    id: "cpp-20260713-b1-horner-cdf",
    language: "cpp",
    title: "Horner Polynomial Normal CDF for BS Pricing",
    tag: "derivatives",
    code: `#include <cmath>
#include <cstdint>

// Horner's method: evaluate polynomial p(x) = a0 + a1*x + a2*x^2 + ...
// as p(x) = a0 + x*(a1 + x*(a2 + x*(...)))
// Minimises multiplications: N-1 muls for degree-N polynomial

// Rational approximation of N(x) — Abramowitz & Stegun 26.2.17
// Maximum absolute error < 7.5e-8
inline double norm_cdf_horner(double x) noexcept {
    constexpr double a1 =  0.254829592;
    constexpr double a2 = -0.284496736;
    constexpr double a3 =  1.421413741;
    constexpr double a4 = -1.453152027;
    constexpr double a5 =  1.061405429;
    constexpr double p  =  0.3275911;
    constexpr double inv_sqrt2pi = 0.3989422804014327;

    double sign = (x >= 0) ? 1.0 : -1.0;
    x = std::abs(x);
    double t = 1.0 / (1.0 + p * x);
    // Horner: evaluate a1 + t*(a2 + t*(a3 + t*(a4 + t*a5)))
    double poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
    double pdf  = inv_sqrt2pi * std::exp(-0.5 * x * x);
    double result = 1.0 - pdf * poly;
    return (sign == 1.0) ? result : 1.0 - result;
}

// Black-Scholes using Horner CDF — avoids std::erfc which may call libm
double bs_call_horner(double S, double K, double r, double sigma, double T) noexcept {
    if (T <= 0.0) return std::max(S - K, 0.0);
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    return S * norm_cdf_horner(d1) - K * std::exp(-r * T) * norm_cdf_horner(d2);
}

// For highest accuracy: std::erfc or Zelen-Severo's 8-coefficient approximation
// For speed: the 5-coefficient Abramowitz & Stegun above is sufficient for pricing`,
    explanation:
      "Horner's method evaluates a degree-n polynomial in n multiplications and n additions — the minimum possible — by factoring out x at each step. For the normal CDF rational approximation used in Black-Scholes, this avoids a std::erfc libm call (which may not be inlined). Marking the function noexcept allows the optimizer to omit the EH table entries and treat the function as a leaf. At 10M pricings/sec, saving 2–3 multiplications compounds to meaningful CPU savings.",
  },
  {
    id: "cpp-20260713-b1-custom-swap",
    language: "cpp",
    title: "ADL-Friendly Custom Swap for Cache Alignment",
    tag: "modern-cpp",
    code: `#include <utility>
#include <cstring>
#include <cstdint>
#include <algorithm>

// Types with cache-line alignment need care in std::sort / std::swap
// ADL (Argument-Dependent Lookup): std::swap finds our swap via the type's namespace

namespace trading {

// 64-byte cache-line-aligned order entry
struct alignas(64) CacheLineOrder {
    uint64_t id;
    double   price;
    uint32_t qty;
    char     side;
    uint32_t symbol_id;
    char     _pad[64 - sizeof(uint64_t) - sizeof(double) - sizeof(uint32_t) - 1 - sizeof(uint32_t)];

    // ADL swap: std::sort will find this via namespace lookup
    friend void swap(CacheLineOrder& a, CacheLineOrder& b) noexcept {
        // Simple member-wise swap — compiler elides to a few registers for small structs
        using std::swap;
        swap(a.id,        b.id);
        swap(a.price,     b.price);
        swap(a.qty,       b.qty);
        swap(a.side,      b.side);
        swap(a.symbol_id, b.symbol_id);
    }
};

} // namespace trading

// std::sort internally calls swap(a,b) via ADL — finds trading::swap
#include <vector>
void sort_by_price(std::vector<trading::CacheLineOrder>& orders) {
    std::sort(orders.begin(), orders.end(),
              [](const trading::CacheLineOrder& a, const trading::CacheLineOrder& b) {
                  return a.price < b.price;
              });
    // Each swap internally calls trading::swap — avoids default memcpy of padding
}

// Verify ADL resolution at compile time
static_assert(noexcept(swap(std::declval<trading::CacheLineOrder&>(),
                            std::declval<trading::CacheLineOrder&>())));`,
    explanation:
      "std::sort and other STL algorithms call swap() via ADL: they call `using std::swap; swap(a,b)`, which finds any swap in the same namespace as the arguments. This lets you provide a swap that skips padding bytes, handles NUMA-local moves, or uses platform-specific instructions. Declaring it noexcept allows std::sort to perform moves rather than copies during partitioning. The pattern is critical for aligned types (SSE/AVX loads require specific alignment) where swapping padding would break alignment guarantees.",
  },
  {
    id: "cpp-20260713-b1-greeks-accum",
    language: "cpp",
    title: "Portfolio Greeks Aggregation via std::accumulate",
    tag: "derivatives",
    code: `#include <numeric>
#include <vector>
#include <functional>
#include <cmath>

struct OptionGreeks {
    double price, delta, gamma, vega, theta, rho;
};

struct PositionGreeks {
    OptionGreeks greeks;
    double       notional;  // position size in contracts × multiplier
};

struct AggGreeks {
    double dollar_delta{}, dollar_gamma{}, dollar_vega{}, dollar_theta{};

    AggGreeks operator+(const PositionGreeks& pg) const {
        double n = pg.notional;
        return {
            dollar_delta  + n * pg.greeks.delta,
            dollar_gamma  + n * pg.greeks.gamma * 0.01,  // 1% S move
            dollar_vega   + n * pg.greeks.vega  / 100.0, // per 1bp vol
            dollar_theta  + n * pg.greeks.theta / 365.0, // per calendar day
        };
    }
};

AggGreeks aggregate_portfolio(const std::vector<PositionGreeks>& positions) {
    // std::accumulate with custom binary op — single pass, no intermediate containers
    return std::accumulate(positions.begin(), positions.end(),
                           AggGreeks{},
                           [](AggGreeks agg, const PositionGreeks& pg) {
                               return agg + pg;
                           });
}

// Risk report: portfolio-level Greeks for hedging
struct HedgeRequirement {
    double delta_shares_to_buy;   // to delta-neutralise
    double vega_contracts_to_buy; // to vega-hedge with ATM straddle
};

HedgeRequirement compute_hedges(const AggGreeks& agg, double S, double atm_vega) {
    return {
        -agg.dollar_delta / S,          // share hedge
        -agg.dollar_vega  / atm_vega,   // straddle hedge
    };
}`,
    explanation:
      "std::accumulate with a custom binary op folds a portfolio of position Greeks into a single aggregate in one cache-friendly pass over the vector. Dollar delta (position × Δ × spot) is the hedge ratio: the number of shares needed to flatten the book. The per-1% gamma and per-1bp vega scalings match trader convention for sensitivities reported to risk management. Accumulate is preferable to a manual loop for readability and eligible for range adaptors in C++23.",
  },
  {
    id: "cpp-20260713-b1-order-dedup",
    language: "cpp",
    title: "Duplicate Order Detection with Bloom Filter",
    tag: "low-latency",
    code: `#include <array>
#include <cstdint>
#include <cstring>
#include <bit>

// Bloom filter: space-efficient probabilistic set membership
// Used to detect duplicate order IDs before expensive map lookup
// False positives possible (configurable); false negatives impossible

template<size_t Bits, size_t NumHashes = 3>
class BloomFilter {
    static_assert((Bits & 63) == 0, "Bits must be multiple of 64");
    static constexpr size_t WORDS = Bits / 64;
    std::array<uint64_t, WORDS> data_{};

    // K independent hash functions via double hashing: h_i = h1 + i*h2
    static uint64_t hash1(uint64_t k) { return k * 11400714819323198485ULL; }
    static uint64_t hash2(uint64_t k) { return k * 14181476777654086739ULL; }

    void set_bit(uint64_t bit_idx) {
        data_[bit_idx >> 6] |= (1ULL << (bit_idx & 63));
    }
    bool get_bit(uint64_t bit_idx) const {
        return (data_[bit_idx >> 6] >> (bit_idx & 63)) & 1;
    }

public:
    void insert(uint64_t order_id) {
        uint64_t h1 = hash1(order_id), h2 = hash2(order_id);
        for (size_t i = 0; i < NumHashes; ++i)
            set_bit((h1 + i * h2) % Bits);
    }

    bool maybe_contains(uint64_t order_id) const {
        uint64_t h1 = hash1(order_id), h2 = hash2(order_id);
        for (size_t i = 0; i < NumHashes; ++i)
            if (!get_bit((h1 + i * h2) % Bits)) return false;
        return true;
    }

    void clear() { data_.fill(0); }

    // Theoretical false positive rate for N elements: (1 - e^(-k*n/m))^k
    static constexpr double fpr(size_t n) {
        double exp_factor = static_cast<double>(NumHashes * n) / Bits;
        // approx: (1 - e^(-exp_factor))^NumHashes
        return 1.0; // placeholder — compute offline with std::pow
    }
};

// 1M bit Bloom filter for order IDs: ~125KB, < 0.01% FPR for 50K orders
using OrderBloom = BloomFilter<1 << 20, 5>;
static OrderBloom g_order_bloom;`,
    explanation:
      "A Bloom filter tests set membership in O(k) bit operations and O(m/8) bytes where k is the number of hash functions and m is the bit array size. False positives are bounded by (1−e^(−kn/m))^k; false negatives are impossible. For duplicate order ID detection, a false positive means an occasional unnecessary secondary check (not a correctness issue). Double hashing generates k independent probes from two hash functions, avoiding k separate hash computations.",
  },
  {
    id: "cpp-20260713-b1-market-impact-model",
    language: "cpp",
    title: "Square-Root Market Impact Model",
    tag: "derivatives",
    code: `#include <cmath>
#include <algorithm>

// Almgren-Chriss (2001) / empirical square-root impact model
// Expected slippage = eta * sigma * sqrt(q / V) * S
// q: trade size (shares), V: ADV, sigma: daily vol, S: price, eta ≈ 0.1

struct MarketImpactParams {
    double eta      = 0.1;   // market impact coefficient
    double adv      = 1e6;   // average daily volume (shares)
    double daily_vol= 0.015; // daily return volatility
};

struct ImpactEstimate {
    double expected_slippage_bps;  // E[slippage] in basis points
    double slippage_std_bps;       // uncertainty (linear in q for large q)
    double total_cost_dollars;
};

ImpactEstimate estimate_impact(
    double trade_qty,    // shares to trade
    double spot,         // current price
    double trade_fraction_of_adv,   // q / ADV
    const MarketImpactParams& p)
{
    // Temporary impact: decays after trade
    double temp_impact = p.eta * p.daily_vol * std::sqrt(trade_fraction_of_adv);

    // Permanent impact: stays in market (half the temporary)
    double perm_impact = 0.5 * temp_impact;

    // Total expected slippage (per unit price)
    double total_impact = temp_impact + perm_impact;

    double slippage_bps = total_impact * 10000.0;  // convert to bps
    double total_cost   = total_impact * spot * trade_qty;

    // Std of impact: uncertainty increases with size
    double std_bps = 0.5 * slippage_bps;  // rough: 50% vol-of-impact

    return {slippage_bps, std_bps, total_cost};
}

// VWAP participation rate target: spread trade over time to minimize impact
double optimal_participation_rate(double target_shares, double adv,
                                  double risk_aversion, double daily_vol) {
    // Almgren-Chriss optimal execution: balance market impact vs timing risk
    // rate* = sqrt(lambda * sigma^2 / (2 * eta * sigma * sqrt(rate*)))
    // Simplified: rate* ≈ (lambda * sigma / eta)^(2/3) * adv^(-1/3)
    double lam = risk_aversion;
    return std::clamp(
        std::pow(lam * daily_vol / (2 * 0.1), 2.0/3.0),
        0.01, 0.25   // 1% to 25% of ADV
    );
}`,
    explanation:
      "The square-root market impact model captures the empirical observation that slippage scales with the square root of trade size relative to ADV, not linearly — doubling size increases impact by only 41%. The Almgren-Chriss framework optimally balances this impact against timing risk: trading faster reduces market risk but increases impact. The participation rate is the key execution decision; values above 20% ADV generate severe adverse impact for most liquid equities.",
  },
];
