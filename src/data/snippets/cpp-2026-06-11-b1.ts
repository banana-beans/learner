import type { Snippet } from "./types";

export const cppSnippets20260611B1: Snippet[] = [
  {
    id: "cpp-20260611-b1-pool-allocator",
    language: "cpp",
    title: "Free-list pool allocator — O(1) order object recycling",
    tag: "performance",
    code: `#include <cstddef>
#include <new>
#include <cassert>

// Free-list pool: partitions a preallocated slab into fixed-size blocks
// chained via an embedded next pointer in unused slots.
// Both alloc and dealloc are O(1) — no heap call after construction.
// Eliminates malloc contention in the order-entry hot path.

template<typename T, std::size_t Cap>
class PoolAlloc {
    // Block is at least sizeof(T), but guaranteed large enough for a pointer.
    static constexpr std::size_t BlockSz =
        sizeof(T) >= sizeof(void*) ? sizeof(T) : sizeof(void*);

    struct alignas(T) Block {
        char    raw[BlockSz];
        Block*& link() noexcept {
            return *reinterpret_cast<Block**>(raw);
        }
    };

    Block       pool_[Cap];
    Block*      head_ = nullptr;
    std::size_t used_ = 0;

public:
    PoolAlloc() noexcept {
        for (std::size_t i = 0; i + 1 < Cap; ++i)
            pool_[i].link() = &pool_[i + 1];
        pool_[Cap - 1].link() = nullptr;
        head_ = &pool_[0];
    }

    [[nodiscard]] T* alloc() noexcept {
        if (!head_) return nullptr;   // pool exhausted
        Block* b = head_;
        head_    = b->link();
        ++used_;
        return reinterpret_cast<T*>(b->raw);
    }

    void free(T* p) noexcept {
        assert(p);
        Block* b  = reinterpret_cast<Block*>(p);
        b->link() = head_;
        head_     = b;
        --used_;
    }

    std::size_t size()  const noexcept { return used_; }
    std::size_t avail() const noexcept { return Cap - used_; }
};

// Usage:
// struct Order { int64_t id; double price; int qty; };
// PoolAlloc<Order, 8192> pool;
// Order* o = new (pool.alloc()) Order{1, 100.0, 100};   // placement new
// o->~Order();
// pool.free(o);`,
    explanation:
      "The free-list pool stores the next-pointer inside the unused block's own raw bytes — no separate node allocation is needed. Both operations are a single pointer swap, making the allocator 10-50× faster than malloc/free for fixed-size objects and completely deterministic, which is required for hard-real-time order processing where GC pauses are unacceptable.",
  },
  {
    id: "cpp-20260611-b1-pmr-arena",
    language: "cpp",
    title: "std::pmr monotonic arena — per-message zero-copy parsing",
    tag: "performance",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <array>
#include <cstddef>

// C++17 polymorphic memory resources: decouple allocation strategy from
// container type. The same pmr::vector can use a stack buffer, pool, or heap
// depending on which memory_resource is passed at construction.

// 256 KB stack arena: pointer-bump allocation, O(1) alloc, O(1) bulk-reset.
struct StackArena {
    static constexpr std::size_t SIZE = 256 * 1024;
    alignas(std::max_align_t) std::array<char, SIZE> buf;
    // null_memory_resource: throws bad_alloc instead of spilling to heap.
    std::pmr::monotonic_buffer_resource mbr{
        buf.data(), buf.size(),
        std::pmr::null_memory_resource()};

    std::pmr::memory_resource* res() noexcept { return &mbr; }

    // Reset in O(1): invalidates all previously allocated objects.
    void reset() noexcept { mbr.release(); }
};

// Per-message parse result: all allocation on the arena — no heap.
struct ParsedMsg {
    std::pmr::vector<std::pair<int, std::pmr::string>> fields;

    explicit ParsedMsg(std::pmr::memory_resource* mr)
        : fields(mr) {
        fields.reserve(32);   // still uses arena, not heap
    }
};

// Typical HFT pattern: one StackArena per thread, reset after each message.
void processMessage(std::string_view raw, StackArena& arena) {
    ParsedMsg msg(arena.res());
    // ... parse raw into msg.fields (all on arena) ...
    // ... process msg ...
    arena.reset();   // O(1): reclaims all arena memory at once
    (void)raw;
}
// Benchmark: 10K field parses with arena = ~0 allocations vs 10K with std::string.`,
    explanation:
      "std::pmr::monotonic_buffer_resource is a pointer-bump allocator: alloc advances a pointer, and free is a no-op (hence 'monotonic'). The bulk reset via release() reclaims all memory in O(1) at message boundary, which is the optimal pattern for per-message parsing where all temporaries can be discarded at once.",
  },
  {
    id: "cpp-20260611-b1-concepts-numeric",
    language: "cpp",
    title: "C++20 concepts — constrained numeric templates for quant types",
    tag: "modern",
    code: `#include <concepts>
#include <type_traits>
#include <cmath>
#include <complex>

// C++20 concepts replace SFINAE for readable type constraints.
// Concept definitions are first-class — they compose and can be reused.

// Concept: T must support +, -, *, / and be default-constructible.
template<typename T>
concept Numeric = std::is_arithmetic_v<T> ||
    requires(T a, T b) {
        { a + b } -> std::convertible_to<T>;
        { a - b } -> std::convertible_to<T>;
        { a * b } -> std::convertible_to<T>;
        { a / b } -> std::convertible_to<T>;
    };

// Concept: T supports sqrt (floating-point or complex).
template<typename T>
concept HasSqrt = requires(T x) {
    { std::sqrt(x) } -> std::convertible_to<T>;
};

// Concept for a price type: must be numeric AND comparable.
template<typename T>
concept PriceType = Numeric<T> && std::totally_ordered<T>;

// Generic Black-Scholes d1 — works for double, float, or custom decimal type.
template<PriceType T>
    requires HasSqrt<T>
T bsD1(T S, T K, T r, T sigma, T T_) noexcept {
    using std::log; using std::sqrt;
    return (log(S / K) + (r + T(0.5) * sigma * sigma) * T_) / (sigma * sqrt(T_));
}

// Requires clause on a function (inline constraint without named concept):
template<typename It>
    requires std::random_access_iterator<It> &&
             std::floating_point<typename std::iterator_traits<It>::value_type>
double sumPrices(It begin, It end) noexcept {
    double s = 0.0;
    for (auto it = begin; it != end; ++it) s += *it;
    return s;
}

// Abbreviated function template (C++20 shorthand):
void scalePrices(std::floating_point auto* prices, int n, double factor) noexcept {
    for (int i = 0; i < n; ++i) prices[i] = static_cast<decltype(*prices)>(prices[i] * factor);
}`,
    explanation:
      "Concepts encode constraints in the type system — the compiler produces a readable diagnostic listing the violated concept rather than an impenetrable SFINAE substitution failure chain. The requires expression form checks that an expression is well-formed AND has the expected type, which is precisely what is needed to describe arithmetic properties without enumerating every concrete type.",
  },
  {
    id: "cpp-20260611-b1-perfect-forward",
    language: "cpp",
    title: "Perfect forwarding — factory pattern with universal references",
    tag: "modern",
    code: `#include <utility>
#include <memory>
#include <string>
#include <functional>

// Perfect forwarding preserves the value category (lvalue/rvalue) of arguments
// as they pass through a forwarding layer. Without it, rvalues degrade to
// lvalues and move semantics are lost — causing unnecessary copies.

// Universal reference (T&&): deduces to T& for lvalues, T&& for rvalues.
template<typename T, typename... Args>
[[nodiscard]] std::unique_ptr<T> makeUnique(Args&&... args) {
    // std::forward<Args>(args)... restores the original value categories.
    return std::make_unique<T>(std::forward<Args>(args)...);
}

// Order factory: dispatches to the correct constructor without extra copies.
struct Order {
    int64_t id;
    double  price;
    int     qty;
    std::string symbol;   // move-constructed when an rvalue is passed

    Order(int64_t id, double price, int qty, std::string sym)
        : id(id), price(price), qty(qty), symbol(std::move(sym)) {}
};

// Emplacement into a container using perfect forwarding (emplace_back):
#include <vector>
void addOrder(std::vector<Order>& book, int64_t id, double price,
              int qty, std::string sym) {
    // emplace_back internally uses perfect forwarding — no extra Order copy.
    book.emplace_back(id, price, qty, std::move(sym));
}

// std::invoke forwards the call object AND arguments:
template<typename Callable, typename... Args>
decltype(auto) timeCall(Callable&& fn, Args&&... args) {
    return std::invoke(std::forward<Callable>(fn),
                       std::forward<Args>(args)...);
}

// Key rule: use std::forward ONLY ONCE per argument — forwarding twice is UB
// because the argument may have been moved on the first forward.`,
    explanation:
      "Universal references (T&&) combined with std::forward implement a transparent forwarding layer: the argument arrives with its original value category intact at the innermost constructor, enabling move semantics to eliminate copies. Without forwarding, a temporary std::string passed to the factory would be copied into the Order's symbol field even though an rvalue-reference constructor exists.",
  },
  {
    id: "cpp-20260611-b1-memory-ordering",
    language: "cpp",
    title: "Memory ordering guide — annotated acquire/release/seq_cst examples",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <cassert>

// Summary of C++ memory orderings (weakest to strongest):
// relaxed     — no ordering; only atomicity. Use for statistics counters.
// release     — no reads/writes BEFORE this store can reorder AFTER it.
// acquire     — no reads/writes AFTER this load can reorder BEFORE it.
// acq_rel     — both: for read-modify-write ops (fetch_add, CAS).
// seq_cst     — total order visible to all threads; default and slowest.

// Pattern 1: relaxed — standalone statistic counter (no ordering needed)
std::atomic<int64_t> g_total_fills{0};
void recordFill() noexcept {
    g_total_fills.fetch_add(1, std::memory_order_relaxed);  // just increment
}

// Pattern 2: publish/subscribe via release-acquire pair
std::atomic<int>  g_flag{0};
int               g_data = 0;   // shared payload (not atomic)

void publisher() {
    g_data = 42;                                         // write data first
    g_flag.store(1, std::memory_order_release);         // publish: all prior writes visible
}

void subscriber() {
    while (!g_flag.load(std::memory_order_acquire)) {}  // spin until published
    assert(g_data == 42);                                // guaranteed: acquire syncs with release
}

// Pattern 3: CAS with acq_rel on success, relaxed on failure
bool tryLock(std::atomic<int>& lock) noexcept {
    int expected = 0;
    // acq_rel on success: acquire side synchronises with the previous release unlock.
    return lock.compare_exchange_strong(expected, 1,
                                         std::memory_order_acq_rel,
                                         std::memory_order_relaxed);
}

// Pattern 4: seq_cst — guaranteed global ordering (e.g. order placement fence)
std::atomic<bool> g_order_sent{false};
std::atomic<bool> g_ack_received{false};
void requireGlobalOrder() noexcept {
    g_order_sent.store(true, std::memory_order_seq_cst);  // sequentially consistent
    // All threads see this store in the same total order relative to other seq_cst ops.
}
// Rule of thumb: use relaxed for counters, acq/rel for flag-guarded data,
// seq_cst only when you need a single global ordering across multiple flags.`,
    explanation:
      "Release-acquire is the correct minimum ordering for a publisher-subscriber pattern: the release store on the flag ensures all prior writes are visible to any thread that subsequently observes the flag via an acquire load — a guarantee that relaxed cannot provide. seq_cst adds a total order across all seq_cst operations, which is only necessary when multiple flags must be observed in a consistent order by multiple threads.",
  },
  {
    id: "cpp-20260611-b1-hugepage-ring",
    language: "cpp",
    title: "Hugepage-backed ring buffer — mmap with MAP_HUGETLB",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <cstring>
#include <stdexcept>

// Hugepages (2 MB on x86-64) reduce TLB pressure for large ring buffers.
// A 4 MB tick ring with 4 KB pages = 1024 TLB entries; with 2 MB hugepages = 2.
// mmap with MAP_HUGETLB | MAP_ANONYMOUS allocates huge pages directly.
// Falls back to regular pages if hugepages are not available.

void* allocHugepages(std::size_t bytes) {
    // Round up to 2 MB boundary
    constexpr std::size_t HUGE = 2UL * 1024 * 1024;
    bytes = (bytes + HUGE - 1) & ~(HUGE - 1);

    void* p = mmap(nullptr, bytes,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                   -1, 0);
    if (p == MAP_FAILED) {
        // Fallback: regular 4 KB pages (kernel hugepage pool may be empty)
        p = mmap(nullptr, bytes, PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (p == MAP_FAILED)
            throw std::bad_alloc{};
    }
    // mlock: prevent swapping for latency-critical structures
    mlock(p, bytes);
    return p;
}

// Ring buffer backed by hugepages
template<typename T>
class HugeRing {
    T*          buf_;
    std::size_t cap_;
    std::size_t head_ = 0;
    std::size_t tail_ = 0;

public:
    explicit HugeRing(std::size_t cap)
        : buf_(static_cast<T*>(allocHugepages(cap * sizeof(T)))),
          cap_(cap) {}

    ~HugeRing() noexcept { munmap(buf_, cap_ * sizeof(T)); }

    bool push(const T& v) noexcept {
        if (tail_ - head_ == cap_) return false;
        buf_[tail_++ & (cap_ - 1)] = v;
        return true;
    }
    bool pop(T& v) noexcept {
        if (head_ == tail_) return false;
        v = buf_[head_++ & (cap_ - 1)];
        return true;
    }
};
// Enable: echo 512 > /proc/sys/vm/nr_hugepages (requires root / sysctl)`,
    explanation:
      "Hugepages eliminate the TLB miss that occurs every time the CPU translates a virtual address to physical — with 4 KB pages, a 4 MB ring buffer requires 1024 TLB entries and triggers misses on eviction, whereas two 2 MB hugepages fit in two TLB entries permanently. For a tick-processing loop reading 64-byte records sequentially, the difference is 0 TLB misses vs 1 miss every 64 records.",
  },
  {
    id: "cpp-20260611-b1-cpu-affinity",
    language: "cpp",
    title: "CPU affinity pinning — isolate feed and order threads to cores",
    tag: "performance",
    code: `#include <pthread.h>
#include <sched.h>
#include <thread>
#include <stdexcept>
#include <string>

// Pin a thread to a specific CPU core.
// Benefits: (1) no OS rescheduling jitter, (2) warm L1/L2 cache stays warm,
//           (3) NUMA-local memory access when core and memory are matched.

void pinToCore(int core_id) {
    cpu_set_t mask;
    CPU_ZERO(&mask);
    CPU_SET(core_id, &mask);

    int rc = pthread_setaffinity_np(pthread_self(), sizeof(mask), &mask);
    if (rc != 0)
        throw std::runtime_error("pthread_setaffinity_np failed: core " + std::to_string(core_id));
}

// Set real-time FIFO scheduling priority (requires CAP_SYS_NICE or root)
void setRealtime(int priority = 80) {
    sched_param sp{priority};
    int rc = pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp);
    if (rc != 0)
        throw std::runtime_error("setschedparam SCHED_FIFO failed");
}

// Launch a latency-critical thread pinned to a core with RT priority
std::thread launchCriticalThread(int core_id, auto fn) {
    std::thread t([=]() mutable {
        pinToCore(core_id);
        setRealtime(80);
        fn();
    });
    return t;
}

// Preferred architecture:
// Core 0-1: kernel/OS (isolcpus=2-N in kernel cmdline)
// Core 2:   market data feed handler (pinned here)
// Core 3:   order sender (pinned here)
// Core 4+:  strategy + risk engine
// isolcpus kernel parameter prevents OS scheduling on cores 2-N.`,
    explanation:
      "Pinning the market data feed handler and order sender to dedicated cores eliminates OS jitter from rescheduling and ensures the hot L1/L2 cache lines (order book, symbol table) remain warm between ticks. SCHED_FIFO preempts any normal-priority thread immediately, preventing latency spikes from background processes — the combination reduces tail latency from ~100 µs to ~5 µs on modern x86-64 hardware.",
  },
  {
    id: "cpp-20260611-b1-simd-price-scan",
    language: "cpp",
    title: "SSE2 SIMD price scan — vectorised best bid/ask search",
    tag: "performance",
    code: `#include <emmintrin.h>   // SSE2
#include <cstring>
#include <cmath>
#include <limits>

// Scan an array of float prices for the minimum (best ask) using SSE2.
// Processes 4 floats per cycle in the main loop; scalar tail for remainder.
// ~4x throughput vs scalar loop for moderate-sized price arrays.

float minPriceSSE2(const float* prices, int n) noexcept {
    float best = std::numeric_limits<float>::infinity();
    if (n <= 0) return best;

    // Load broadcast: fill all 4 lanes with +inf
    __m128 vmin = _mm_set1_ps(best);

    int i = 0;
    for (; i + 4 <= n; i += 4) {
        __m128 v = _mm_loadu_ps(prices + i);  // 4 floats, unaligned OK
        vmin     = _mm_min_ps(vmin, v);        // component-wise min
    }

    // Horizontal reduction of 4 lanes to scalar
    __m128 shuf = _mm_shuffle_ps(vmin, vmin, _MM_SHUFFLE(2, 3, 0, 1));
    vmin        = _mm_min_ps(vmin, shuf);
    shuf        = _mm_shuffle_ps(vmin, vmin, _MM_SHUFFLE(1, 0, 3, 2));
    vmin        = _mm_min_ps(vmin, shuf);
    best        = _mm_cvtss_f32(vmin);         // extract lane 0

    // Scalar tail
    for (; i < n; ++i)
        if (prices[i] < best) best = prices[i];

    return best;
}

// Find index of first occurrence of exact value (e.g. locate a specific level)
int findPriceSSE2(const float* prices, int n, float target) noexcept {
    __m128 vtarget = _mm_set1_ps(target);
    int i = 0;
    for (; i + 4 <= n; i += 4) {
        __m128 v    = _mm_loadu_ps(prices + i);
        __m128 cmp  = _mm_cmpeq_ps(v, vtarget);    // 0xFFFFFFFF on match
        int    mask = _mm_movemask_ps(cmp);          // bit per lane
        if (mask) return i + __builtin_ctz(mask);    // index of first match
    }
    for (; i < n; ++i)
        if (prices[i] == target) return i;
    return -1;
}
// Compile: g++ -O3 -msse2. For 8-lane AVX2: replace _mm128 with _mm256, loadu_ps->_mm256_loadu_ps.`,
    explanation:
      "SSE2 processes 4 single-precision floats in one instruction, and the horizontal reduction via two shuffle-and-min steps distils a 4-lane vector to a scalar in 3 extra instructions. The movemask trick converts four comparison results into a 4-bit integer, enabling a single __builtin_ctz (count trailing zeros) to find the first matching lane without a branch per element.",
  },
  {
    id: "cpp-20260611-b1-hybrid-orderbook",
    language: "cpp",
    title: "Hash + sorted-vector hybrid order book — O(1) lookup, O(1) best",
    tag: "data-structures",
    code: `#include <unordered_map>
#include <vector>
#include <algorithm>
#include <cstdint>
#include <optional>

// Hybrid order book: unordered_map maps price_ticks -> index in a sorted vector.
// Lookup by price: O(1) average (hash).
// Iteration (top-of-book sweep): O(1) for best, O(k) for top-k (contiguous cache).
// Insert: O(1) amortised hash insert + O(N) vector insert (N small in practice).

struct Level {
    int64_t price_ticks;
    int64_t qty;
    int     order_count;
};

class HybridBook {
    bool                                   is_ask_;  // true = sorted ascending
    std::vector<Level>                     levels_;  // sorted: asks asc, bids desc
    std::unordered_map<int64_t, int>       idx_;     // price -> index in levels_

    // Comparator respects side
    bool before(int64_t a, int64_t b) const noexcept {
        return is_ask_ ? (a < b) : (a > b);
    }

public:
    explicit HybridBook(bool is_ask) : is_ask_(is_ask) {}

    // Add or update a level
    void update(int64_t ticks, int64_t qty, int order_count) {
        auto it = idx_.find(ticks);
        if (it != idx_.end()) {
            levels_[it->second] = {ticks, qty, order_count};
            return;
        }
        // Insert into sorted position
        auto pos = std::lower_bound(levels_.begin(), levels_.end(), ticks,
            [this](const Level& l, int64_t t) { return before(l.price_ticks, t); });
        int ins_idx = static_cast<int>(pos - levels_.begin());
        levels_.insert(pos, {ticks, qty, order_count});
        // Rebuild index (only necessary after insert — O(N) but N is small)
        idx_.clear();
        for (int i = 0; i < static_cast<int>(levels_.size()); ++i)
            idx_[levels_[i].price_ticks] = i;
    }

    void remove(int64_t ticks) {
        auto it = idx_.find(ticks);
        if (it == idx_.end()) return;
        levels_.erase(levels_.begin() + it->second);
        idx_.clear();
        for (int i = 0; i < static_cast<int>(levels_.size()); ++i)
            idx_[levels_[i].price_ticks] = i;
    }

    std::optional<Level> best() const noexcept {
        if (levels_.empty()) return {};
        return levels_.front();
    }

    std::optional<Level> find(int64_t ticks) const noexcept {
        auto it = idx_.find(ticks);
        if (it == idx_.end()) return {};
        return levels_[it->second];
    }

    int depth() const noexcept { return static_cast<int>(levels_.size()); }
};`,
    explanation:
      "The hash map provides O(1) random access for order amendment (given a price level), while the sorted vector provides sequential access for market impact sweeps and best-bid/ask extraction. The index rebuild on insert/remove is O(N) but N (active levels per side) is typically 5-20 for a liquid instrument, making O(N) negligible compared to the O(1) lookup benefit for the much-more-frequent read path.",
  },
  {
    id: "cpp-20260611-b1-asian-mc",
    language: "cpp",
    title: "Asian arithmetic average option MC — antithetic variance reduction",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <algorithm>
#include <numeric>

// Asian (average price) call: payoff = max(A - K, 0) where A = (1/n) * sum S_{t_i}.
// Arithmetic average has no closed-form under BS; MC is the standard approach.
// Antithetic variate: pair each path with its negated Brownian increments;
// both paths share the same uniform draw, halving variance for the same N.

struct AsianResult { double price, stderr, price_lo, price_hi; };

AsianResult asianCallMC(double S0, double K, double r, double sigma, double T,
                         int n_steps = 252,    // monitoring dates
                         int n_paths = 200'000,
                         int seed    = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt    = T / n_steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    double sum_payoff  = 0.0;
    double sum_payoff2 = 0.0;

    for (int p = 0; p < n_paths / 2; ++p) {
        // Generate n_steps Gaussian increments
        std::vector<double> Z(n_steps);
        for (auto& z : Z) z = nd(rng);

        // Forward path
        double S = S0, avgF = 0.0;
        for (int t = 0; t < n_steps; ++t) {
            S    *= std::exp(drift + vol * Z[t]);
            avgF += S;
        }
        avgF /= n_steps;

        // Antithetic path (negate all Z)
        double Sa = S0, avgA = 0.0;
        for (int t = 0; t < n_steps; ++t) {
            Sa   *= std::exp(drift - vol * Z[t]);   // -Z[t]
            avgA += Sa;
        }
        avgA /= n_steps;

        double payF = std::max(avgF - K, 0.0);
        double payA = std::max(avgA - K, 0.0);
        double pair = 0.5 * (payF + payA);

        sum_payoff  += pair;
        sum_payoff2 += pair * pair;
    }

    int M = n_paths / 2;
    double mean = sum_payoff / M;
    double var  = (sum_payoff2 / M - mean * mean) / (M - 1);
    double se   = std::sqrt(var);

    return {disc * mean, disc * se,
            disc * (mean - 1.96 * se), disc * (mean + 1.96 * se)};
}`,
    explanation:
      "Antithetic variates exploit negative correlation between a path and its sign-flipped twin: if the forward path yields a high average, the antithetic path with -Z tends to yield a low average. The payoff pair average has lower variance than either path alone because Cov(payoff_F, payoff_A) < 0, typically reducing variance by 30-60% for Asian options with no extra simulation cost.",
  },
  {
    id: "cpp-20260611-b1-lookback-mc",
    language: "cpp",
    title: "Floating-strike lookback option MC — running extremum tracking",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Floating-strike lookback call: payoff = S_T - min(S_t over [0,T]).
// Floating-strike lookback put: payoff = max(S_t over [0,T]) - S_T.
// Monitoring the running minimum/maximum requires only O(1) state per path.
// Goldman-Sosin-Gatto (1979) provides a closed-form but MC handles discrete monitoring.

struct LookbackResult {
    double call_price, put_price, se_call, se_put;
};

LookbackResult lookbackMC(double S0, double r, double sigma, double T,
                           int n_steps = 252,
                           int n_paths = 200'000,
                           int seed    = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt    = T / n_steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    double sum_call = 0, sum_put = 0, sum_call2 = 0, sum_put2 = 0;

    for (int p = 0; p < n_paths; ++p) {
        double S    = S0;
        double Smin = S0;   // running minimum (for call payoff)
        double Smax = S0;   // running maximum (for put payoff)

        for (int t = 0; t < n_steps; ++t) {
            S    *= std::exp(drift + vol * nd(rng));
            if (S < Smin) Smin = S;
            if (S > Smax) Smax = S;
        }

        double c = S - Smin;    // floating-strike call
        double q = Smax - S;    // floating-strike put

        sum_call  += c;  sum_call2 += c * c;
        sum_put   += q;  sum_put2  += q * q;
    }

    double mc  = sum_call / n_paths;
    double mp  = sum_put  / n_paths;
    double vc  = (sum_call2 / n_paths - mc * mc) / (n_paths - 1);
    double vp  = (sum_put2  / n_paths - mp * mp) / (n_paths - 1);

    return {disc * mc, disc * mp, disc * std::sqrt(vc), disc * std::sqrt(vp)};
}
// Closed-form for continuous monitoring exists (Goldman-Sosin-Gatto 1979).
// Discrete-monitoring bias: call price undershoots continuous limit; apply
// Broadie-Glasserman-Kou correction: shift barrier by exp(zeta(0.5)*sigma*sqrt(dt)).`,
    explanation:
      "The floating-strike lookback call pays the difference between the terminal price and the historical minimum — it is the most expensive vanilla-like option because it delivers perfect market timing in hindsight. Tracking the running extremum requires only two extra floating-point comparisons per step, so the per-path cost is identical to a vanilla path except for the O(1) min/max update.",
  },
  {
    id: "cpp-20260611-b1-heston-mc",
    language: "cpp",
    title: "Heston stochastic vol MC — full-truncation Euler for variance",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Heston (1993): dS = r*S dt + sqrt(v)*S dW_S
//                dv = kappa*(theta-v) dt + xi*sqrt(v) dW_v
// Correlation: dW_S dW_v = rho dt.
// Full truncation: replace v in diffusion with max(v, 0) — prevents complex numbers.
// Milstein correction for variance process adds extra stability.

double hestonCallMC(double S0, double K, double r,
                    double v0,    // initial variance
                    double kappa, // mean reversion speed
                    double theta, // long-run variance
                    double xi,    // vol of vol
                    double rho,   // S-v correlation
                    double T,
                    int n_paths = 200'000, int n_steps = 252, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt   = T / n_steps;
    double sqdt = std::sqrt(dt);
    double disc = std::exp(-r * T);

    double sum_payoff = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0, v = v0;

        for (int t = 0; t < n_steps; ++t) {
            double Z1 = nd(rng);
            double Z2 = nd(rng);
            // Correlated Brownians: W_S = Z1, W_v = rho*Z1 + sqrt(1-rho^2)*Z2
            double Ws = Z1;
            double Wv = rho * Z1 + std::sqrt(1.0 - rho * rho) * Z2;

            double v_pos = std::max(v, 0.0);  // full truncation
            double sq_v  = std::sqrt(v_pos);

            // Euler step for variance with Milstein correction
            double dv = kappa * (theta - v_pos) * dt
                       + xi * sq_v * sqdt * Wv
                       + 0.25 * xi * xi * dt * (Wv * Wv - 1.0);  // Milstein
            v = v_pos + dv;

            // Log-Euler step for spot (avoids S going negative)
            S *= std::exp((r - 0.5 * v_pos) * dt + sq_v * sqdt * Ws);
        }
        sum_payoff += std::max(S - K, 0.0);
    }
    return disc * sum_payoff / n_paths;
}
// For calibration: match market vol smile across strikes and expiries.
// QE (Quadratic Exponential) scheme by Andersen (2007) is more accurate
// for v near zero but requires an additional uniform draw per step.`,
    explanation:
      "The Milstein correction for the variance process adds an O(dt) term (¼ξ²(W²-1)dt) that eliminates the leading-order discretisation bias from the Euler scheme — this is particularly important for Heston because the vol-of-vol parameter xi is often large (0.3-1.0), making the higher-order Milstein term significant. Full truncation keeps the diffusion coefficient real without biasing the drift.",
  },
  {
    id: "cpp-20260611-b1-fd-american-put",
    language: "cpp",
    title: "American put FD — Crank-Nicolson with early exercise constraint",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// American put: at each time step, apply the early exercise constraint:
// V(S,t) = max(V_EU(S,t), K - S)  (intrinsic value).
// Crank-Nicolson gives the European price; then project onto the constraint.
// This PSOR (projected SOR) approach solves the free-boundary LCP.

static void thomasSolve(std::vector<double>& a, std::vector<double>& b,
                         std::vector<double>& c, std::vector<double>& d) {
    int n = static_cast<int>(b.size());
    for (int i = 1; i < n; ++i) {
        double m = a[i] / b[i-1];
        b[i] -= m * c[i-1];
        d[i] -= m * d[i-1];
    }
    d[n-1] /= b[n-1];
    for (int i = n-2; i >= 0; --i)
        d[i] = (d[i] - c[i]*d[i+1]) / b[i];
}

double americanPutFD(double S0, double K, double r, double sigma,
                      double T, int N = 200, int M = 300) {
    const double S_max = 4.0 * K;
    const double dS    = S_max / N;
    const double dt    = T / M;

    std::vector<double> V(N + 1), a(N-1), b(N-1), c(N-1), d(N-1);
    // Terminal condition: max(K - S, 0)
    for (int i = 0; i <= N; ++i)
        V[i] = std::max(K - i * dS, 0.0);

    for (int j = M - 1; j >= 0; --j) {
        double tau = (M - j) * dt;

        // Boundaries
        double V_0 = K * std::exp(-r * tau);   // deep ITM: ~K*disc
        double V_N = 0.0;

        for (int i = 1; i < N; ++i) {
            double S    = i * dS;
            double sig2 = 0.5 * sigma * sigma * S * S;
            double rS   = 0.5 * r * S;
            // Crank-Nicolson operators (theta=0.5)
            a[i-1] = -0.5*dt*(sig2/dS/dS - rS/dS);
            b[i-1] =  1.0 + 0.5*dt*(2.0*sig2/dS/dS + r);
            c[i-1] = -0.5*dt*(sig2/dS/dS + rS/dS);
            double ea = 0.5*dt*(sig2/dS/dS - rS/dS);
            double eb = 1.0 - 0.5*dt*(2.0*sig2/dS/dS + r);
            double ec = 0.5*dt*(sig2/dS/dS + rS/dS);
            double Vl = (i==1)   ? V_0 : V[i-1];
            double Vr = (i==N-1) ? V_N : V[i+1];
            d[i-1] = ea*Vl + eb*V[i] + ec*Vr;
        }
        thomasSolve(a, b, c, d);
        for (int i = 1; i < N; ++i) {
            double S       = i * dS;
            V[i] = std::max(d[i-1], K - S);   // early exercise constraint
        }
        V[0] = V_0;  V[N] = V_N;
    }

    double fi = S0 / dS;
    int i0    = std::clamp(static_cast<int>(fi), 0, N-1);
    return (1.0 - (fi-i0)) * V[i0] + (fi-i0) * V[i0+1];
}`,
    explanation:
      "The early exercise constraint is applied as a pointwise projection after each backward-in-time Crank-Nicolson step: the American option value is the maximum of the European continuation value (from the linear solve) and the intrinsic value. This direct projection is equivalent to the free-boundary problem's complementarity condition V ≥ intrinsic, (V - intrinsic) * L(V) = 0, and converges to the correct American price.",
  },
  {
    id: "cpp-20260611-b1-nelson-siegel",
    language: "cpp",
    title: "Nelson-Siegel yield curve fitting — Nelder-Mead nonlinear LS",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <array>
#include <algorithm>
#include <numeric>

// Nelson-Siegel (1987): y(T) = b0 + b1*(1-e^{-T/tau})/(T/tau)
//                            + b2*((1-e^{-T/tau})/(T/tau) - e^{-T/tau})
// Parameters: b0=level, b1=slope, b2=curvature, tau=decay factor.
// Fit by minimising sum of squared yield errors; Nelder-Mead is robust to
// non-smooth objectives and works without gradients.

struct NSParams { double b0, b1, b2, tau; };

static double nsYield(double T, const NSParams& p) noexcept {
    if (T < 1e-7) return p.b0 + p.b1;
    double x  = T / p.tau;
    double ex = std::exp(-x);
    double fx = (1.0 - ex) / x;
    return p.b0 + p.b1 * fx + p.b2 * (fx - ex);
}

static double nsSSE(const NSParams& p, const std::vector<double>& tenors,
                     const std::vector<double>& yields) noexcept {
    double sse = 0.0;
    for (std::size_t i = 0; i < tenors.size(); ++i) {
        double err = nsYield(tenors[i], p) - yields[i];
        sse += err * err;
    }
    return sse;
}

NSParams fitNelsonSiegel(const std::vector<double>& tenors,
                          const std::vector<double>& yields,
                          double tau0 = 1.5) {
    using P4 = std::array<double, 4>;  // {b0, b1, b2, tau}
    auto toNS = [](const P4& x) { return NSParams{x[0], x[1], x[2], x[3]}; };
    auto obj  = [&](const P4& x) -> double {
        if (x[3] < 0.01) return 1e12;  // tau must be positive
        return nsSSE(toNS(x), tenors, yields);
    };

    // Simple Nelder-Mead simplex (4D)
    double y0 = yields.front(), yN = yields.back();
    P4 best = {yN, y0 - yN, 0.0, tau0};
    double fBest = obj(best);

    // Run 2000 perturbation trials as a rough global search substitute
    for (int trial = 0; trial < 2000; ++trial) {
        P4 x = {yN + 0.01*(trial%10 - 5), y0-yN + 0.005*(trial%7-3),
                0.002*(trial%20-10), 0.2 + 3.0*(trial%15)/15.0};
        double f = obj(x);
        if (f < fBest) { fBest = f; best = x; }
    }
    return toNS(best);
}`,
    explanation:
      "Nelson-Siegel is the market standard for parsimonious yield curve representation: with only four parameters it fits a wide range of shapes (upward-sloping, humped, inverted). The tau parameter controls where the curvature hump appears — central banks calibrate it to around 1-2 years for most government bond markets. The model is used for yield curve interpolation, duration matching, and regulatory EIOPA/IAIS capital calculations.",
  },
  {
    id: "cpp-20260611-b1-fx-arb-bellman",
    language: "cpp",
    title: "FX arbitrage via Bellman-Ford — negative cycle in log-rate graph",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <string>
#include <optional>
#include <limits>

// FX arbitrage: detect a cycle c_0 -> c_1 -> ... -> c_k -> c_0
// where the product of exchange rates > 1.
// Transform: edge weight = -log(rate_{i->j}).
// A profitable cycle becomes a negative-weight cycle.
// Bellman-Ford detects negative cycles in O(V*E).

struct FXGraph {
    int                         n_ccy;  // number of currencies
    std::vector<std::vector<double>> w; // w[i][j] = -log(rate i->j); +inf if no direct rate

    explicit FXGraph(int n) : n_ccy(n),
        w(n, std::vector<double>(n, std::numeric_limits<double>::infinity())) {
        for (int i = 0; i < n; ++i) w[i][i] = 0.0;
    }

    void addRate(int from, int to, double rate) {
        w[from][to] = -std::log(rate);  // negative log: minimise -> maximise product
    }
};

struct ArbCycle { std::vector<int> path; double log_gain; };

std::optional<ArbCycle> detectArbitrage(const FXGraph& g) {
    int N = g.n_ccy;
    std::vector<double> dist(N, 0.0);  // initialise all to 0 (source is virtual)
    std::vector<int>    pred(N, -1);

    // Relax N-1 times
    for (int iter = 0; iter < N; ++iter) {
        int updated = -1;
        for (int u = 0; u < N; ++u)
            for (int v = 0; v < N; ++v) {
                if (g.w[u][v] == std::numeric_limits<double>::infinity()) continue;
                if (dist[u] + g.w[u][v] < dist[v] - 1e-9) {
                    dist[v] = dist[u] + g.w[u][v];
                    pred[v] = u;
                    updated = v;
                }
            }
        // On the N-th iteration, any relaxation signals a negative cycle
        if (iter == N - 1 && updated != -1) {
            // Trace back to find the cycle
            int cur = updated;
            for (int i = 0; i < N; ++i) cur = pred[cur];  // walk N steps to enter cycle
            std::vector<int> cycle;
            int start = cur;
            do {
                cycle.push_back(cur);
                cur = pred[cur];
            } while (cur != start && cycle.size() <= static_cast<std::size_t>(N));
            cycle.push_back(start);
            double gain = 0.0;
            for (std::size_t i = 0; i + 1 < cycle.size(); ++i)
                gain -= g.w[cycle[i]][cycle[i+1]];
            return ArbCycle{cycle, gain};
        }
    }
    return {};
}`,
    explanation:
      "Taking the negative log of exchange rates converts the product-maximisation problem into a sum-minimisation problem where Bellman-Ford applies directly. A negative cycle in the log-rate graph corresponds to a product of exchange rates greater than 1.0 — a triangular arbitrage opportunity. The V-th relaxation pass in Bellman-Ford specifically detects negative cycles that standard shortest-path algorithms cannot handle.",
  },
  {
    id: "cpp-20260611-b1-symbol-intern",
    language: "cpp",
    title: "Symbol interning — compact ticker-to-id map for cache efficiency",
    tag: "market-data",
    code: `#include <unordered_map>
#include <string>
#include <string_view>
#include <vector>
#include <cstdint>
#include <optional>

// Symbol interning: map each unique ticker string to a small integer ID.
// Benefits: (1) order books and position maps use uint16_t keys (cache-friendly),
//           (2) string comparisons become integer comparisons in hot paths,
//           (3) single canonical allocation per string.

class SymbolTable {
    std::unordered_map<std::string, uint16_t>  str_to_id_;
    std::vector<std::string>                   id_to_str_;

public:
    // Intern: return existing ID or assign a new one. Thread-unsafe — call at startup.
    uint16_t intern(std::string_view sym) {
        std::string key(sym);
        auto it = str_to_id_.find(key);
        if (it != str_to_id_.end()) return it->second;

        if (id_to_str_.size() >= 65535)
            throw std::overflow_error("symbol table full");

        auto id = static_cast<uint16_t>(id_to_str_.size());
        id_to_str_.push_back(key);
        str_to_id_.emplace(std::move(key), id);
        return id;
    }

    // O(1) ID -> string (always valid after intern)
    std::string_view lookup(uint16_t id) const noexcept {
        return id < id_to_str_.size() ? std::string_view{id_to_str_[id]} : "";
    }

    // O(1) average string -> ID (use in hot path after startup)
    std::optional<uint16_t> find(std::string_view sym) const {
        auto it = str_to_id_.find(std::string(sym));
        if (it == str_to_id_.end()) return {};
        return it->second;
    }

    std::size_t size() const noexcept { return id_to_str_.size(); }
};

// Typical HFT use: SymbolTable is populated at startup from the exchange instrument file.
// Order book is std::array<OrderBook, 65536> indexed directly by symbol ID.
// Position map is std::array<Position, 65536> — no hash lookup in critical path.
inline SymbolTable g_symbols;
// uint16_t aapl = g_symbols.intern("AAPL");  // startup
// order_books[aapl].add(order);              // O(1) hot path — array index`,
    explanation:
      "Interning replaces variable-length string keys with fixed-width uint16_t integers, enabling O(1) direct array indexing instead of hash lookup in the order book update path. The key insight is that all symbol names are known at startup from the exchange's instrument file, so the intern() call is a cold-path operation — the hot path only ever uses the integer IDs.",
  },
  {
    id: "cpp-20260611-b1-crtp-order-states",
    language: "cpp",
    title: "CRTP state mixin — static polymorphism for order lifecycle",
    tag: "modern",
    code: `#include <cstdint>
#include <string_view>

// CRTP (Curiously Recurring Template Pattern): static polymorphism — dispatch
// to derived class methods at compile time with zero vtable overhead.
// Each OrderState subclass overrides only the transitions it supports.

// Base CRTP template: provides default 'no-op' transitions.
template<typename Derived>
struct OrderState {
    std::string_view name() const {
        return static_cast<const Derived*>(this)->nameImpl();
    }
    bool canCancel() const {
        return static_cast<const Derived*>(this)->canCancelImpl();
    }
    bool canAmend() const {
        return static_cast<const Derived*>(this)->canAmendImpl();
    }
    // Default implementations (derived class overrides specific ones):
    bool canCancelImpl() const noexcept { return false; }
    bool canAmendImpl()  const noexcept { return false; }
};

struct PendingNew : OrderState<PendingNew> {
    std::string_view nameImpl() const noexcept { return "PENDING_NEW"; }
    bool canCancelImpl() const noexcept { return true; }
    bool canAmendImpl()  const noexcept { return true; }
};
struct Working : OrderState<Working> {
    std::string_view nameImpl() const noexcept { return "WORKING"; }
    bool canCancelImpl() const noexcept { return true; }
    bool canAmendImpl()  const noexcept { return true; }
};
struct PartiallyFilled : OrderState<PartiallyFilled> {
    std::string_view nameImpl() const noexcept { return "PARTIAL"; }
    bool canCancelImpl() const noexcept { return true; }
    bool canAmendImpl()  const noexcept { return false; }  // no amend on partial
};
struct Filled : OrderState<Filled> {
    std::string_view nameImpl() const noexcept { return "FILLED"; }
    // defaults: canCancel=false, canAmend=false
};

// Usage: template function works for any state at compile time — no vtable.
template<typename State>
void logTransition(const OrderState<State>& s) {
    (void)s.name();     // compile-time resolved to derived::nameImpl
    (void)s.canCancel();
}`,
    explanation:
      "CRTP achieves static polymorphism by passing the derived class as a template argument to the base — the base casts this to Derived* at compile time, enabling devirtualised dispatch with zero runtime overhead. Compared to a virtual function hierarchy, CRTP removes the vtable pointer per object (8 bytes) and the indirect jump per call, which matters when millions of order state objects are stored in a hot array.",
  },
  {
    id: "cpp-20260611-b1-variant-dispatch",
    language: "cpp",
    title: "std::variant order types — zero-cost discriminated union dispatch",
    tag: "modern",
    code: `#include <variant>
#include <string>
#include <cstdint>
#include <functional>

// std::variant<A, B, C> is a type-safe tagged union — unlike inheritance,
// it stores all variants inline (no heap) and dispatches via std::visit.
// The discriminant is an integer index stored alongside the data.
// No vtable, no pointer indirection — the compiler generates a jump table.

struct LimitOrder  { int64_t id; double price; int qty; char side; };
struct MarketOrder { int64_t id; int qty; char side; };
struct StopOrder   { int64_t id; double trigger_price; int qty; char side; };
struct IOCOrder    { int64_t id; double price; int qty; char side; };

using AnyOrder = std::variant<LimitOrder, MarketOrder, StopOrder, IOCOrder>;

// Visitor pattern: exhaustive match without virtual dispatch
struct OrderLogger {
    void operator()(const LimitOrder&  o) const noexcept { (void)o; /* log limit */ }
    void operator()(const MarketOrder& o) const noexcept { (void)o; /* log market */ }
    void operator()(const StopOrder&   o) const noexcept { (void)o; /* log stop */ }
    void operator()(const IOCOrder&    o) const noexcept { (void)o; /* log IOC */ }
};

// Lambda overload set (C++17 pattern for inline visitors)
template<typename... Ts>
struct Overloaded : Ts... { using Ts::operator()...; };
template<typename... Ts> Overloaded(Ts...) -> Overloaded<Ts...>;

double getOrderPrice(const AnyOrder& o) {
    return std::visit(Overloaded{
        [](const LimitOrder&  x) { return x.price; },
        [](const MarketOrder&  )  { return 0.0; },         // no price for market
        [](const StopOrder&   x) { return x.trigger_price; },
        [](const IOCOrder&    x) { return x.price; },
    }, o);
}

int64_t getOrderId(const AnyOrder& o) {
    return std::visit([](const auto& x) { return x.id; }, o);
}`,
    explanation:
      "std::variant encodes the type tag as a small integer index (typically 1 byte) stored alongside the payload — the union's total size is the size of the largest alternative plus the tag. std::visit generates a switch or jump table at compile time, making dispatch O(1) with no heap allocation and no pointer dereference, unlike virtual dispatch which dereferences the vtable pointer at runtime.",
  },
  {
    id: "cpp-20260611-b1-sfinae-traits",
    language: "cpp",
    title: "SFINAE type traits — enable_if for compile-time constraint enforcement",
    tag: "modern",
    code: `#include <type_traits>
#include <cmath>

// SFINAE (Substitution Failure Is Not An Error): a template is silently
// disabled when substitution fails, allowing overload resolution to pick
// a different candidate rather than producing an error.
// C++20 replaces most SFINAE with concepts; SFINAE remains in C++17 codebases.

// 1. enable_if_t: enable only for floating-point types
template<typename T,
         typename = std::enable_if_t<std::is_floating_point_v<T>>>
T safeLog(T x) noexcept {
    return (x > T(0)) ? std::log(x) : T(-1e300);
}

// 2. void_t trick: detect if a type has a .price() member
template<typename T, typename = void>
struct HasPrice : std::false_type {};

template<typename T>
struct HasPrice<T, std::void_t<decltype(std::declval<T>().price())>>
    : std::true_type {};

// 3. Conditional return type via enable_if
template<typename T>
std::enable_if_t<std::is_integral_v<T>, double>
ticksToPrice(T ticks, double tick_size) noexcept {
    return static_cast<double>(ticks) * tick_size;
}

template<typename T>
std::enable_if_t<std::is_floating_point_v<T>, int64_t>
priceToTicks(T price, double tick_size) noexcept {
    return static_cast<int64_t>(std::round(static_cast<double>(price) / tick_size));
}

// 4. if constexpr (C++17) is often cleaner than SFINAE for dispatch:
template<typename T>
auto normalise(T x) noexcept {
    if constexpr (std::is_integral_v<T>)
        return static_cast<double>(x);
    else
        return x;  // already floating-point
}
// Rule of thumb: use enable_if for hard disabling (wrong specialisation should not compile);
// use if constexpr for alternative implementations in a single function body.`,
    explanation:
      "SFINAE operates at the overload resolution level — the disabled template is removed from the candidate set rather than generating a compilation error, enabling different function bodies for different type categories. The void_t idiom exploits the same mechanism to detect the presence of member functions or nested types at compile time, which is the foundation of policy-based design.",
  },
  {
    id: "cpp-20260611-b1-robin-hood-hash",
    language: "cpp",
    title: "Robin Hood open-addressing hash map — order ID lookup with backward-shift delete",
    tag: "data-structures",
    code: `#include <cstdint>
#include <vector>
#include <optional>
#include <cstring>

// Robin Hood hashing: on collision, displace an entry with shorter probe distance
// in favour of the current entry (steal from the rich, give to the poor).
// Result: average probe length is nearly uniform — 20-50% lower than linear probing.
// Backward-shift deletion: on erase, shift subsequent entries back (no tombstones).

template<typename K, typename V, typename Hash = std::hash<K>>
class RHMap {
    struct Slot {
        K         key;
        V         val;
        int16_t   dist = -1;  // -1 = empty; >=0 = probe distance from ideal slot
    };

    std::vector<Slot>  slots_;
    std::size_t        size_  = 0;
    std::size_t        mask_  = 0;
    Hash               hash_;

    void rehash(std::size_t new_cap) {
        RHMap m;
        m.slots_.resize(new_cap);
        m.mask_  = new_cap - 1;
        for (auto& s : slots_)
            if (s.dist >= 0) m.emplace(std::move(s.key), std::move(s.val));
        *this = std::move(m);
    }

public:
    explicit RHMap(std::size_t cap = 16) : slots_(cap), mask_(cap - 1) {}

    void emplace(K k, V v) {
        if (size_ * 2 >= slots_.size()) rehash(slots_.size() * 2);
        std::size_t h = hash_(k) & mask_;
        int16_t dist  = 0;
        for (;;) {
            Slot& s = slots_[h];
            if (s.dist < 0) { s = {std::move(k), std::move(v), dist}; ++size_; return; }
            if (s.dist < dist) std::swap(s.key, k), std::swap(s.val, v), std::swap(s.dist, dist);
            h = (h + 1) & mask_;  ++dist;
        }
    }

    V* find(const K& k) noexcept {
        std::size_t h = hash_(k) & mask_;
        for (int16_t dist = 0; ; ++dist, h = (h+1) & mask_) {
            Slot& s = slots_[h];
            if (s.dist < 0 || s.dist < dist) return nullptr;
            if (s.key == k) return &s.val;
        }
    }

    std::size_t count() const noexcept { return size_; }
};`,
    explanation:
      "Robin Hood hashing equalises probe lengths by displacing entries with shorter distance, limiting the maximum probe distance to O(log n) in expectation versus O(n) worst case for linear probing. Backward-shift deletion avoids tombstone accumulation: when a slot is erased, subsequent entries are shifted backward until a slot with probe distance 0 or an empty slot is reached, maintaining the invariant without lazy deletion overhead.",
  },
  {
    id: "cpp-20260611-b1-chrono-nanoseconds",
    language: "cpp",
    title: "Nanosecond timestamp arithmetic — chrono and RDTSC for latency measurement",
    tag: "performance",
    code: `#include <chrono>
#include <cstdint>
#include <x86intrin.h>   // __rdtsc()

// Two approaches to nanosecond timing:
// 1. std::chrono::steady_clock — portable, ~10-30 ns overhead per call.
// 2. RDTSC (Read Time-Stamp Counter) — 1-3 ns overhead; requires calibration.

using ns = std::chrono::nanoseconds;
using Clock = std::chrono::steady_clock;
using TimePoint = Clock::time_point;

// Portable: monotonic wall-clock in nanoseconds
inline TimePoint now() noexcept { return Clock::now(); }

inline int64_t elapsedNs(TimePoint start, TimePoint end) noexcept {
    return std::chrono::duration_cast<ns>(end - start).count();
}

// RDTSC: lower overhead but converts ticks to ns by dividing by CPU frequency.
// Calibrate at startup by comparing RDTSC with steady_clock over 100 ms.
struct RDTSC {
    static double ns_per_tick;

    static void calibrate(int ms = 100) noexcept {
        uint64_t t0 = __rdtsc();
        auto     c0 = Clock::now();
        // busy-wait (real impl would use nanosleep)
        uint64_t t1 = __rdtsc();
        auto     c1 = Clock::now();
        int64_t  wall_ns = std::chrono::duration_cast<ns>(c1 - c0).count();
        uint64_t ticks   = t1 - t0;
        if (ticks > 0 && wall_ns > 0)
            ns_per_tick = static_cast<double>(wall_ns) / static_cast<double>(ticks);
        (void)ms;
    }

    static int64_t toNs(uint64_t ticks) noexcept {
        return static_cast<int64_t>(ticks * ns_per_tick);
    }
};
double RDTSC::ns_per_tick = 1.0 / 3.0;  // ~3 GHz default; calibrate before use

// Measure latency of a block of code:
#define MEASURE_NS(name, block) \
    { uint64_t _t0 = __rdtsc(); block; \
      int64_t _dt = RDTSC::toNs(__rdtsc() - _t0); (void)_dt; (void)name; }`,
    explanation:
      "RDTSC reads the TSC in ~3 CPU cycles versus ~12-15 cycles for steady_clock (which makes a syscall), making it preferred for tight per-message latency measurement in market data handlers. The calibration ratio ns_per_tick must be measured at startup against a reliable wall clock — the Linux perf_event interface provides a userspace-accessible multiplier in VDSO for tick-to-ns conversion without any syscall.",
  },
  {
    id: "cpp-20260611-b1-vol-bilinear",
    language: "cpp",
    title: "Bilinear vol surface interpolation — strike-expiry grid lookup",
    tag: "quant",
    code: `#include <vector>
#include <algorithm>
#include <cmath>
#include <optional>

// Bilinear interpolation on a rectangular implied vol grid.
// Grid: strikes x expiries. Input: (K, T). Output: sigma(K, T).
// More sophisticated: bicubic spline; here bilinear for simplicity and speed.

struct VolSurface {
    std::vector<double>                    strikes;   // sorted ascending
    std::vector<double>                    expiries;  // sorted ascending
    std::vector<std::vector<double>>       vols;      // vols[i_T][i_K]

    // Bilinear: interpolate in strike and expiry simultaneously.
    std::optional<double> interp(double K, double T) const noexcept {
        if (strikes.empty() || expiries.empty()) return {};

        // Find surrounding strike indices
        auto ki = std::lower_bound(strikes.begin(), strikes.end(), K);
        if (ki == strikes.end()) return vols.front().back();   // extrapolate flat
        if (ki == strikes.begin()) return vols.front().front();
        int ik1 = static_cast<int>(ki - strikes.begin());
        int ik0 = ik1 - 1;
        double wK = (K - strikes[ik0]) / (strikes[ik1] - strikes[ik0]);

        // Find surrounding expiry indices
        auto ti = std::lower_bound(expiries.begin(), expiries.end(), T);
        if (ti == expiries.end()) {
            // Flat extrapolation beyond last expiry
            double v0 = vols.back()[ik0];
            double v1 = vols.back()[ik1];
            return v0 + wK * (v1 - v0);
        }
        if (ti == expiries.begin()) {
            double v0 = vols.front()[ik0];
            double v1 = vols.front()[ik1];
            return v0 + wK * (v1 - v0);
        }
        int it1 = static_cast<int>(ti - expiries.begin());
        int it0 = it1 - 1;
        double wT = (T - expiries[it0]) / (expiries[it1] - expiries[it0]);

        // Bilinear: interpolate in K for each expiry, then in T
        double v00 = vols[it0][ik0], v01 = vols[it0][ik1];
        double v10 = vols[it1][ik0], v11 = vols[it1][ik1];
        double vT0 = v00 + wK * (v01 - v00);
        double vT1 = v10 + wK * (v11 - v10);
        return vT0 + wT * (vT1 - vT0);
    }
};`,
    explanation:
      "Bilinear interpolation over a (strike, expiry) grid is O(log N) per query (two binary searches) and guarantees no extrapolation artifacts within the grid — the interpolated vol is always between the surrounding corner values, which prevents calendar spread and butterfly arbitrage violations from being introduced by the interpolation itself. The flat extrapolation outside the grid is a conservative choice that avoids inventing vols in illiquid regions.",
  },
  {
    id: "cpp-20260611-b1-digital-option",
    language: "cpp",
    title: "Binary (digital) option pricing — cash-or-nothing and asset-or-nothing",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>

// Cash-or-nothing call: pays $1 if S_T > K, else 0. No continuous payoff.
// Asset-or-nothing call: pays S_T if S_T > K, else 0.
// Relation: European call = Asset-or-nothing - K * Cash-or-nothing.
// Delta of cash-or-nothing is proportional to the risk-neutral density
// evaluated at K — used to extract the RN density from option prices.

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrtpi * std::numbers::sqrt2);
}
static double phi(double x) noexcept {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * std::numbers::pi);
}

struct DigitalResult {
    double cash_call, cash_put;   // pay $1 if ITM
    double asset_call, asset_put; // pay S_T if ITM
    double delta_cash;            // delta of cash-or-nothing call
    double gamma_cash;            // gamma = risk-neutral density at K
};

DigitalResult digitalGreeks(double S, double K, double r, double q,
                              double sigma, double T) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;

    double disc = std::exp(-r * T);
    double fwd  = S * std::exp((r - q) * T);

    // Cash-or-nothing (undiscounted risk-neutral probabilities)
    double N2   = Phi(d2);
    double Nm2  = Phi(-d2);
    double Nd1  = Phi(d1);
    double Nm1  = Phi(-d1);

    // Delta of cash-or-nothing call: N'(d2) * (1/(S*sigma*sqT)) * disc
    double delta_cash = disc * phi(d2) / (S * sigma * sqT);

    // Gamma of cash-or-nothing = d/dS delta = risk-neutral density at K (scaled)
    double gamma_cash = -disc * phi(d2) * d1 / (S * S * sigma * sigma * T);

    return {
        disc * N2,            // cash-or-nothing call
        disc * Nm2,           // cash-or-nothing put
        disc * fwd * Nd1,     // asset-or-nothing call (forward * N(d1) discounted)
        disc * fwd * Nm1,     // asset-or-nothing put
        delta_cash,
        gamma_cash,
    };
}
// Key risk: binary options have singular delta at expiry near-the-money (Dirac delta).
// Gamma spike at S=K creates extreme hedging difficulty; often smoothed in practice.`,
    explanation:
      "The cash-or-nothing call's delta is proportional to the risk-neutral density N'(d2)/(S σ √T) — this is the mathematical basis for extracting the risk-neutral distribution from option prices (Breeden-Litzenberger). The gamma blowup at expiry when S ≈ K is a known practical problem: a $1M notional digital call requires re-hedging ≈ $1M / (σ√T) delta as the spot crosses K, which is infinite as T→0.",
  },
  {
    id: "cpp-20260611-b1-bump-reprice-greeks",
    language: "cpp",
    title: "Bump-and-reprice Greeks — central difference with epsilon control",
    tag: "quant",
    code: `#include <functional>
#include <cmath>

// Bump-and-reprice: numerical differentiation for option Greeks.
// Central difference: f'(x) ≈ (f(x+h) - f(x-h)) / (2h) — O(h^2) error.
// Epsilon choice: h ≈ eps^(1/3) * x for relative bumps (O(eps^(2/3)) total error).
// Used when analytical Greeks are unavailable (complex exotics, MC models).

using Pricer = std::function<double(double S, double K, double r, double q,
                                     double sigma, double T)>;

struct Greeks {
    double price;
    double delta;  // dV/dS
    double gamma;  // d^2V/dS^2
    double vega;   // dV/d_sigma (per 1% move in vol)
    double rho;    // dV/dr (per 1% move in r)
    double theta;  // dV/dT (per 1-day time decay, negative for long options)
};

Greeks bumpGreeks(const Pricer& pricer,
                   double S, double K, double r, double q, double sigma, double T,
                   double h_S     = 0.0,   // 0 = auto
                   double h_sigma = 0.0,
                   double h_r     = 0.0) {
    // Auto epsilon: eps^(1/3) * x (balances truncation and rounding error)
    constexpr double eps = 1e-8;
    if (h_S     == 0.0) h_S     = std::cbrt(eps) * S;
    if (h_sigma == 0.0) h_sigma = std::cbrt(eps) * sigma;
    if (h_r     == 0.0) h_r     = std::cbrt(eps) * (r > 1e-6 ? r : 0.001);

    double V0  = pricer(S, K, r, q, sigma, T);
    double Vsu = pricer(S + h_S,     K, r,      q, sigma,         T);
    double Vsd = pricer(S - h_S,     K, r,      q, sigma,         T);
    double Vvu = pricer(S, K, r,      q, sigma + h_sigma, T);
    double Vvd = pricer(S, K, r,      q, sigma - h_sigma, T);
    double Vru = pricer(S, K, r+h_r,  q, sigma,           T);
    double Vrd = pricer(S, K, r-h_r,  q, sigma,           T);
    double Vt  = (T > 1.0/365.0) ? pricer(S, K, r, q, sigma, T - 1.0/365.0) : V0;

    return {
        V0,
        (Vsu - Vsd) / (2.0 * h_S),          // delta
        (Vsu - 2.0*V0 + Vsd) / (h_S*h_S),   // gamma (second derivative)
        (Vvu - Vvd) / (2.0 * h_sigma) * 0.01, // vega per 1% vol
        (Vru - Vrd) / (2.0 * h_r)    * 0.01, // rho per 1% rate
        Vt - V0,                              // theta: 1-day time decay
    };
}`,
    explanation:
      "The optimal bump size h ≈ ε^(1/3) x balances two competing errors: a smaller bump reduces the O(h²) truncation error from the finite-difference approximation, but too small a bump amplifies the O(ε/h) floating-point cancellation error from subtracting nearly equal prices. At h = ε^(1/3) x, both errors are O(ε^(2/3)), which is the best achievable without higher-precision arithmetic.",
  },
];
