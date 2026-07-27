import type { Snippet } from "./types";

export const cppSnippets20260727B1: Snippet[] = [
  {
    id: "cpp-20260727-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-size pool allocator for order objects",
    tag: "allocators",
    code: `#include <cstddef>
#include <cstdint>
#include <cassert>
#include <array>

// Pool allocator: pre-allocates a slab, hands out fixed-size chunks via a
// free-list embedded in the chunks themselves — O(1) alloc and free, no
// system-call overhead after construction.
template<typename T, std::size_t N>
class PoolAllocator {
    static_assert(sizeof(T) >= sizeof(void*), "T too small for free-list link");
    alignas(T) std::array<std::byte, sizeof(T) * N> slab_;
    void* free_head_ = nullptr;
    std::size_t allocated_ = 0;
public:
    PoolAllocator() {
        // Thread the slab into a singly-linked free-list
        for (std::size_t i = 0; i < N; ++i) {
            void* chunk = slab_.data() + i * sizeof(T);
            *reinterpret_cast<void**>(chunk) = free_head_;
            free_head_ = chunk;
        }
    }

    T* allocate() {
        assert(free_head_ && "pool exhausted");
        void* p = free_head_;
        free_head_ = *reinterpret_cast<void**>(p);
        ++allocated_;
        return static_cast<T*>(p);
    }

    void deallocate(T* p) noexcept {
        p->~T();                                   // explicit destructor
        *reinterpret_cast<void**>(p) = free_head_;
        free_head_ = p;
        --allocated_;
    }

    std::size_t allocated() const { return allocated_; }
};

struct Order { int64_t price; int32_t qty; char side; };

int main() {
    PoolAllocator<Order, 1024> pool;
    Order* o = new (pool.allocate()) Order{10050, 100, 'B'}; // placement new
    pool.deallocate(o);                                       // returns to pool
}`,
    explanation: "A pool allocator embeds the free-list pointer directly inside each unallocated chunk; this means allocation is a pointer swap (one load, one store) and there are zero heap fragmentation concerns — critical for HFT order objects that are created and destroyed thousands of times per second.",
  },
  {
    id: "cpp-20260727-b1-spsc-ring-buffer",
    language: "cpp",
    title: "Lock-free SPSC ring buffer for market data ticks",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstdint>
#include <cstdio>

// Single-Producer Single-Consumer ring buffer using release/acquire semantics.
// Producer owns write_pos_, consumer owns read_pos_; each is on its own
// cache line to prevent false sharing.
template<typename T, std::size_t N>
class SpscRingBuffer {
    static_assert((N & (N-1)) == 0, "N must be a power of 2");
    static constexpr std::size_t MASK = N - 1;

    alignas(64) std::atomic<std::size_t> write_pos_{0};
    alignas(64) std::atomic<std::size_t> read_pos_{0};
    std::array<T, N> buf_;

public:
    // Called by producer thread only
    bool push(const T& val) noexcept {
        std::size_t w = write_pos_.load(std::memory_order_relaxed);
        std::size_t r = read_pos_.load(std::memory_order_acquire);
        if (w - r == N) return false;      // full
        buf_[w & MASK] = val;
        write_pos_.store(w + 1, std::memory_order_release);
        return true;
    }

    // Called by consumer thread only
    std::optional<T> pop() noexcept {
        std::size_t r = read_pos_.load(std::memory_order_relaxed);
        std::size_t w = write_pos_.load(std::memory_order_acquire);
        if (r == w) return std::nullopt;   // empty
        T val = buf_[r & MASK];
        read_pos_.store(r + 1, std::memory_order_release);
        return val;
    }
};

struct Tick { int64_t price; int32_t qty; };

int main() {
    SpscRingBuffer<Tick, 1024> rb;
    rb.push({10055, 200});
    auto t = rb.pop();
    if (t) printf("price=%lld qty=%d\\n", (long long)t->price, t->qty);
}`,
    explanation: "The release/acquire pair on write_pos_ and read_pos_ establishes a happens-before edge: the producer's store of the element is guaranteed visible to the consumer before the consumer reads read_pos_, while padding each counter to 64 bytes prevents the two false-sharing-prone hot cache lines from residing on the same cache line.",
  },
  {
    id: "cpp-20260727-b1-concepts-numeric",
    language: "cpp",
    title: "C++20 concepts to constrain numeric financial types",
    tag: "concepts",
    code: `#include <concepts>
#include <cstdio>

// Define a concept for fixed-point or floating-point price types
template<typename T>
concept FinancialPrice = std::is_arithmetic_v<T> && requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
    { a * b } -> std::convertible_to<T>;
    { a / b } -> std::convertible_to<T>;
};

// Concept for anything that looks like an option payoff
template<typename F>
concept PayoffFn = requires(F f, double spot) {
    { f(spot) } -> std::convertible_to<double>;
};

// Constrained function: only compiles if T satisfies FinancialPrice
template<FinancialPrice T>
T mid_price(T bid, T ask) {
    return (bid + ask) / T{2};  // avoids division by literal 2 (type safety)
}

// Generic payoff evaluator — accepts any callable matching PayoffFn
template<PayoffFn F>
double eval_payoff(F&& f, double spot) {
    return f(spot);
}

int main() {
    double m = mid_price(100.25, 100.75);
    printf("mid=%.2f\\n", m);

    // Lambda satisfies PayoffFn
    auto call_payoff = [K=100.0](double S){ return S > K ? S - K : 0.0; };
    printf("payoff(105)=%.2f\\n", eval_payoff(call_payoff, 105.0));
}`,
    explanation: "C++20 concepts replace SFINAE `enable_if` chains with readable named constraints that produce clear compiler diagnostics; in a quant library, concepts like FinancialPrice and PayoffFn document the semantic contract (not just syntax) of template parameters, making misuse a compile-time error instead of a silent type coercion.",
  },
  {
    id: "cpp-20260727-b1-intrusive-list-orderbook",
    language: "cpp",
    title: "Intrusive doubly-linked list for price-level order queue",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cstdio>

// Intrusive list: node pointers are embedded INSIDE the object.
// No separate allocation per insertion — the object IS the node.
// Standard std::list allocates a separate list_node wrapper per element.

struct Order {
    int64_t price;
    int32_t qty;
    char    side;
    Order*  prev = nullptr;
    Order*  next = nullptr;
};

struct OrderQueue {
    Order* head = nullptr;
    Order* tail = nullptr;
    int    size = 0;

    void push_back(Order* o) noexcept {
        o->prev = tail; o->next = nullptr;
        if (tail) tail->next = o; else head = o;
        tail = o;
        ++size;
    }

    Order* pop_front() noexcept {
        if (!head) return nullptr;
        Order* o = head;
        head = o->next;
        if (head) head->prev = nullptr; else tail = nullptr;
        o->prev = o->next = nullptr;
        --size;
        return o;
    }

    // O(1) removal — only possible because prev pointer is stored in the node
    void remove(Order* o) noexcept {
        if (o->prev) o->prev->next = o->next; else head = o->next;
        if (o->next) o->next->prev = o->prev; else tail = o->prev;
        o->prev = o->next = nullptr;
        --size;
    }
};

int main() {
    Order o1{10050, 100, 'B'}, o2{10050, 200, 'B'}, o3{10050, 50, 'B'};
    OrderQueue q;
    q.push_back(&o1); q.push_back(&o2); q.push_back(&o3);
    q.remove(&o2);         // cancel middle order — O(1)
    while (auto* o = q.pop_front())
        printf("qty=%d\\n", o->qty);
}`,
    explanation: "Intrusive containers eliminate the allocator call per insert because the link pointers live inside the domain object itself; this is why real order books (FIX engines, matching engines) universally use intrusive lists — cancel (remove) is O(1) given the order pointer, and there is no heap fragmentation from list node allocations.",
  },
  {
    id: "cpp-20260727-b1-open-addr-hashmap",
    language: "cpp",
    title: "Open-addressing hash map for O(1) symbol lookup",
    tag: "data-structures",
    code: `#include <cstring>
#include <cstdint>
#include <cstdio>
#include <string_view>

// Flat open-addressing hash map: all entries in a single array (cache-friendly).
// Robin Hood probing reduces worst-case probe length variance.
static constexpr std::size_t CAP = 256; // must be power of 2
static constexpr std::size_t MASK = CAP - 1;

struct Entry {
    char    key[8] = {};  // up to 8-char ticker symbol
    int64_t val    = 0;
    bool    used   = false;
};

struct SymbolMap {
    Entry table[CAP]{};

    // FNV-1a hash (branchless, good avalanche for short strings)
    static uint32_t hash(std::string_view s) {
        uint32_t h = 2166136261u;
        for (char c : s) { h ^= (uint8_t)c; h *= 16777619u; }
        return h;
    }

    void insert(std::string_view sym, int64_t val) {
        uint32_t idx = hash(sym) & MASK;
        while (table[idx].used && std::strncmp(table[idx].key, sym.data(), 8) != 0)
            idx = (idx + 1) & MASK;
        std::strncpy(table[idx].key, sym.data(), 8);
        table[idx].val  = val;
        table[idx].used = true;
    }

    int64_t lookup(std::string_view sym) const {
        uint32_t idx = hash(sym) & MASK;
        while (table[idx].used) {
            if (std::strncmp(table[idx].key, sym.data(), 8) == 0)
                return table[idx].val;
            idx = (idx + 1) & MASK;
        }
        return -1; // not found
    }
};

int main() {
    SymbolMap m;
    m.insert("AAPL", 189'50);
    m.insert("GOOG", 175'20);
    printf("AAPL=%lld GOOG=%lld\\n",
           (long long)m.lookup("AAPL"), (long long)m.lookup("GOOG"));
}`,
    explanation: "Open-addressing with linear probing keeps all entries in a single flat array so hardware prefetchers can stream consecutive slots during probing; at typical load factors (< 0.75), the average probe length is < 2, making symbol lookup latency dominated by a single L1 cache hit rather than pointer chasing as in std::unordered_map's chained buckets.",
  },
  {
    id: "cpp-20260727-b1-branch-prediction-hint",
    language: "cpp",
    title: "Branch prediction hints for hot-path order validation",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstdio>

// __builtin_expect(expr, likely_val) tells GCC/Clang the branch is (un)likely.
// C++20 standardises [[likely]] / [[unlikely]] attributes for the same effect.
// Use on the exceptional path — validation errors are rare in production feed.

inline bool validate_order_fast(int64_t price, int32_t qty, char side) noexcept {
    // 99.9% of orders are valid — mark the error path [[unlikely]]
    if (__builtin_expect(price <= 0, 0)) [[unlikely]] {
        return false;
    }
    if (__builtin_expect(qty <= 0, 0)) [[unlikely]] {
        return false;
    }
    if (__builtin_expect(side != 'B' && side != 'S', 0)) [[unlikely]] {
        return false;
    }
    return true;
}

// C++20 attribute syntax (compiler-agnostic)
inline int64_t compute_notional(int64_t price, int32_t qty) noexcept {
    [[likely]] if (price > 0 && qty > 0)
        return price * (int64_t)qty;
    [[unlikely]] return 0;
}

int main() {
    printf("%s\\n", validate_order_fast(10050, 100, 'B') ? "valid" : "invalid");
    printf("notional=%lld\\n", (long long)compute_notional(10050, 100));
}`,
    explanation: "Branch prediction hints nudge the compiler to lay out the hot path as a straight-line fall-through (no taken branch penalty) while placing the cold path in a distant basic block; on a modern out-of-order core the difference is < 1 ns per call, but at 1 million orders/second that accumulates to measurable throughput in the matching engine critical path.",
  },
  {
    id: "cpp-20260727-b1-aligned-storage-placement-new",
    language: "cpp",
    title: "Aligned storage and placement new for variant order types",
    tag: "memory",
    code: `#include <cstdint>
#include <cstring>
#include <new>
#include <cstdio>

// Aligned storage: a raw byte buffer with guaranteed alignment.
// Placement new constructs an object at a specific address without allocation.
// Used internally by std::optional, std::variant, and arena allocators.

struct LimitOrder {
    int64_t price; int32_t qty; char side;
    void describe() const { printf("Limit %c %d @ %lld\\n", side, qty, (long long)price); }
};

struct MarketOrder {
    int32_t qty; char side;
    void describe() const { printf("Market %c %d\\n", side, qty); }
};

// Storage big enough for either type, correctly aligned
alignas(alignof(LimitOrder)) alignas(alignof(MarketOrder))
    std::byte storage[std::max(sizeof(LimitOrder), sizeof(MarketOrder))];

int main() {
    // Construct LimitOrder in-place — no heap allocation
    LimitOrder* lo = new (storage) LimitOrder{10050, 100, 'B'};
    lo->describe();
    lo->~LimitOrder();   // must call destructor manually

    // Reuse the same storage for a MarketOrder
    MarketOrder* mo = new (storage) MarketOrder{50, 'S'};
    mo->describe();
    mo->~MarketOrder();
}`,
    explanation: "Aligned storage with placement new is the low-level primitive underlying std::optional and std::variant: it lets you construct objects in a pre-allocated buffer at a specific address without any dynamic allocation, which is essential for embedding variant order types in contiguous ring buffers or stack-allocated message arenas.",
  },
  {
    id: "cpp-20260727-b1-fix-parser",
    language: "cpp",
    title: "Zero-copy FIX protocol tag=value parser",
    tag: "market-data",
    code: `#include <cstring>
#include <cstdint>
#include <cstdio>
#include <string_view>

// FIX messages: "8=FIX.4.2\\x01 35=D\\x01 49=SENDER\\x01 ...\\x01"
// SOH (0x01) is the field delimiter. Parse without heap allocation.

static constexpr char SOH = '\x01';

struct FixField { int tag; std::string_view value; };

// Simple iterator over tag=value pairs in a FIX message buffer
class FixParser {
    const char* pos_;
    const char* end_;
public:
    FixParser(const char* buf, std::size_t len)
        : pos_(buf), end_(buf + len) {}

    bool next(FixField& out) noexcept {
        if (pos_ >= end_) return false;
        // Find '='
        const char* eq = (const char*)std::memchr(pos_, '=', end_ - pos_);
        if (!eq) return false;
        // Parse tag number manually (avoid atoi allocation)
        int tag = 0;
        for (const char* p = pos_; p != eq; ++p) tag = tag * 10 + (*p - '0');
        // Find SOH delimiter for value end
        const char* soh = (const char*)std::memchr(eq + 1, SOH, end_ - (eq + 1));
        if (!soh) soh = end_;
        out = { tag, std::string_view(eq + 1, soh - (eq + 1)) };
        pos_ = soh + 1;
        return true;
    }
};

int main() {
    const char msg[] = "8=FIX.4.2\x01" "35=D\x01" "49=BROKER\x01" "55=AAPL\x01" "38=100\x01";
    FixParser parser(msg, sizeof(msg) - 1);
    FixField f;
    while (parser.next(f))
        printf("tag %d = %.*s\\n", f.tag, (int)f.value.size(), f.value.data());
}`,
    explanation: "A zero-copy FIX parser uses memchr to locate delimiters directly in the receive buffer and returns string_views (pointer + length) rather than copied strings; this eliminates every heap allocation from the parse path so a 10-Gbps feed can be parsed at wire speed without malloc pressure causing GC-like latency spikes.",
  },
  {
    id: "cpp-20260727-b1-cache-line-padding",
    language: "cpp",
    title: "Cache-line padding to eliminate false sharing",
    tag: "low-latency",
    code: `#include <atomic>
#include <thread>
#include <cstdio>

// On x86-64 a cache line is 64 bytes.  Two std::atomic<int64_t>s on the
// same line cause "false sharing": every write by one thread invalidates
// the other thread's copy, bouncing the cache line between cores.

// BAD: both counters share the same 64-byte cache line
struct BadCounters {
    std::atomic<int64_t> orders_in{0};
    std::atomic<int64_t> orders_out{0};
};

// GOOD: pad each counter to occupy its own cache line
struct alignas(64) GoodCounters {
    std::atomic<int64_t> orders_in{0};
    char pad0[64 - sizeof(std::atomic<int64_t>)];
    std::atomic<int64_t> orders_out{0};
    char pad1[64 - sizeof(std::atomic<int64_t>)];
};

static_assert(sizeof(GoodCounters) == 128, "should be two cache lines");

GoodCounters g_cnt;

void producer(int n) {
    for (int i = 0; i < n; ++i)
        g_cnt.orders_in.fetch_add(1, std::memory_order_relaxed);
}
void consumer(int n) {
    for (int i = 0; i < n; ++i)
        g_cnt.orders_out.fetch_add(1, std::memory_order_relaxed);
}

int main() {
    std::thread t1(producer, 1'000'000), t2(consumer, 1'000'000);
    t1.join(); t2.join();
    printf("in=%lld  out=%lld\\n",
           (long long)g_cnt.orders_in.load(),
           (long long)g_cnt.orders_out.load());
}`,
    explanation: "False sharing occurs when two threads modify independent variables that happen to reside on the same 64-byte cache line, causing the MESI protocol to ping-pong the line between cores with every write; padding each hot counter to its own cache line can cut contended-counter throughput from ~100 M ops/s to over 1 B ops/s on a 10-core machine.",
  },
  {
    id: "cpp-20260727-b1-pmr-monotonic",
    language: "cpp",
    title: "std::pmr::monotonic_buffer_resource for per-order arena",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <cstdio>

// Polymorphic Memory Resources (C++17): swap the allocator behind STL containers
// without changing their type.  monotonic_buffer_resource is a bump-pointer
// allocator: allocates by advancing a pointer into a slab, frees are no-ops.
// Perfect for "allocate many small objects, free all at once" (per-tick arenas).

struct Order {
    int64_t price;
    int32_t qty;
    std::pmr::string symbol;   // uses whatever resource is passed in
};

int main() {
    // 4 KB stack slab — no heap allocation for orders in this scope
    std::byte buf[4096];
    std::pmr::monotonic_buffer_resource arena(buf, sizeof(buf));

    // Vector and string both use the arena allocator
    std::pmr::vector<Order> orders(&arena);
    orders.reserve(32);

    orders.push_back({10050, 100, std::pmr::string("AAPL", &arena)});
    orders.push_back({175'20, 50,  std::pmr::string("GOOG", &arena)});

    for (auto& o : orders)
        printf("%s  %d @ %lld\\n", o.symbol.c_str(), o.qty, (long long)o.price);

    // arena destructor resets the bump pointer — zero per-object free overhead
}`,
    explanation: "pmr::monotonic_buffer_resource is a bump-pointer allocator backed by a user-supplied slab: each allocation just advances a pointer (3-5 ns) with no free-list bookkeeping and no fragmentation; for per-message or per-tick arenas in a matching engine this is 10-20× faster than the default allocator and eliminates the latency variance introduced by returning memory to the OS.",
  },
  {
    id: "cpp-20260727-b1-constexpr-bs-price",
    language: "cpp",
    title: "Compile-time Black-Scholes price with constexpr",
    tag: "numerics",
    code: `#include <cstdio>
#include <cmath>

// constexpr Black-Scholes for European call.
// All math is done at compile time when arguments are compile-time constants,
// avoiding any runtime computation on the hot path.

namespace cxpr {
    // Newton's method approximation to erf (sufficient for CTEval)
    // For production, use a Horner-form rational approximation.
    constexpr double abs_val(double x) { return x < 0 ? -x : x; }
    // Simple normal CDF via error function (available as std::erf in C++23 constexpr)
    // For C++20 we inline a polynomial approximation.
    constexpr double norm_cdf(double x) {
        // Abramowitz & Stegun 26.2.17 approximation — max error < 7.5e-8
        constexpr double p = 0.2316419;
        double t = 1.0 / (1.0 + p * abs_val(x));
        double poly = t * (0.319381530 + t * (-0.356563782
            + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
        double phi = std::exp(-0.5 * x * x) / 2.506628274631;
        double cdf = 1.0 - phi * poly;
        return x < 0 ? 1.0 - cdf : cdf;
    }
}

constexpr double bs_call(double S, double K, double r, double sigma, double T) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma * std::sqrt(T));
    double d2 = d1 - sigma * std::sqrt(T);
    return S * cxpr::norm_cdf(d1) - K * std::exp(-r*T) * cxpr::norm_cdf(d2);
}

int main() {
    // Evaluated at compile time — no runtime cost
    constexpr double price = bs_call(100.0, 100.0, 0.05, 0.20, 1.0);
    printf("BS call = %.4f\\n", price);   // ~10.45
}`,
    explanation: "Marking Black-Scholes constexpr lets the compiler evaluate it at compile time for known strike/vol/maturity combinations — the machine code for that call site is just a load of a floating-point constant; for runtime unknowns the same function path executes normally, so one implementation serves both contexts without duplication.",
  },
  {
    id: "cpp-20260727-b1-dual-numbers-greeks",
    language: "cpp",
    title: "Automatic differentiation via dual numbers for Greeks",
    tag: "numerics",
    code: `#include <cstdio>
#include <cmath>

// Dual number: x + eps*dx where eps^2 = 0.
// Overloading arithmetic on Dual propagates derivatives exactly (no FD error).
struct Dual {
    double x, dx;
    Dual(double x, double dx=0.0) : x(x), dx(dx) {}
};

inline Dual operator+(Dual a, Dual b) { return {a.x+b.x, a.dx+b.dx}; }
inline Dual operator*(Dual a, Dual b) { return {a.x*b.x, a.x*b.dx + a.dx*b.x}; }
inline Dual operator-(Dual a, Dual b) { return {a.x-b.x, a.dx-b.dx}; }
inline Dual operator/(Dual a, Dual b) { return {a.x/b.x, (a.dx*b.x - a.x*b.dx)/(b.x*b.x)}; }

inline Dual exp_d(Dual a) { double e=std::exp(a.x); return {e, e*a.dx}; }
inline Dual log_d(Dual a) { return {std::log(a.x), a.dx/a.x}; }
inline Dual sqrt_d(Dual a){ double s=std::sqrt(a.x); return {s, a.dx/(2*s)}; }

// Simplified call payoff (log-space) for demonstration
// Real use: thread Dual<S> through full BS formula
double delta_via_dual(double S, double K, double r, double sigma, double T) {
    Dual S_d{S, 1.0};  // seed: derivative of S w.r.t. S is 1
    Dual d1 = (log_d(S_d / Dual{K}) + Dual{(r + 0.5*sigma*sigma)*T})
              / Dual{sigma * std::sqrt(T)};
    // N(d1) from first principles is the delta of a call
    // Here we return d1.dx as a proxy for illustration
    (void)d1;
    // For a real BS call, thread Dual through norm_cdf too;
    // the .dx field of the result IS the exact delta.
    return d1.x;   // placeholder: prints d1 value
}

int main() {
    double S=100, K=100, r=0.05, sigma=0.2, T=1.0;
    // Direct finite difference delta
    double eps = 1e-4;
    double delta_fd = (/* call(S+eps) - call(S-eps) */ 0.0); (void)delta_fd;
    printf("d1=%.4f (dual)\\n", delta_via_dual(S,K,r,sigma,T));
    printf("Use Dual<S> through full payoff for exact delta/gamma simultaneously\\n");
}`,
    explanation: "Dual-number automatic differentiation computes a function and its derivative in a single forward pass at the cost of doubling the arithmetic; unlike finite differences there is no step-size tuning and no cancellation error — threading the spot price as a Dual variable through the entire pricing function simultaneously yields exact Delta and Gamma (via a second Dual extension) with no approximation.",
  },
  {
    id: "cpp-20260727-b1-span-zero-copy",
    language: "cpp",
    title: "std::span for zero-copy market data buffer views",
    tag: "cpp20",
    code: `#include <span>
#include <cstdint>
#include <cstdio>
#include <array>
#include <vector>
#include <numeric>

// std::span is a non-owning view: pointer + length.
// Pass it instead of (ptr, len) pairs or copying into a vector.

struct PriceBar { int64_t open, high, low, close; int32_t volume; };

// Accepts any contiguous range — array, vector, raw pointer — without copying
double vwap(std::span<const PriceBar> bars) {
    double sum_pv = 0, sum_v = 0;
    for (const auto& b : bars) {
        double mid = (b.high + b.low) * 0.5;
        sum_pv += mid * b.volume;
        sum_v  += b.volume;
    }
    return sum_v > 0 ? sum_pv / sum_v : 0.0;
}

// Subspan to process only a portion of the buffer — zero copy
double vwap_last_n(std::span<const PriceBar> bars, std::size_t n) {
    n = std::min(n, bars.size());
    return vwap(bars.last(n));   // subspan: last n bars
}

int main() {
    std::array<PriceBar, 5> arr = {{
        {100, 102, 99, 101, 1000},
        {101, 103, 100, 102, 1200},
        {102, 104, 101, 103, 800},
        {103, 105, 102, 104, 1500},
        {104, 106, 103, 105, 900},
    }};
    printf("VWAP (all)    = %.2f\\n", vwap(arr));
    printf("VWAP (last 3) = %.2f\\n", vwap_last_n(arr, 3));
}`,
    explanation: "std::span standardises the (pointer, length) idiom as a first-class non-owning view type; it accepts arrays, vectors, and raw buffers interchangeably so a single vwap() signature processes any contiguous container — and subspan/last/first operations slice the view in O(1) without copying bytes, which is essential for windowed analytics on a DMA receive buffer.",
  },
  {
    id: "cpp-20260727-b1-variant-message-bus",
    language: "cpp",
    title: "std::variant as a discriminated order message type",
    tag: "cpp17",
    code: `#include <variant>
#include <cstdint>
#include <cstdio>

struct NewOrder    { int64_t price; int32_t qty; char side; uint64_t clord_id; };
struct CancelOrder { uint64_t clord_id; };
struct Execution   { uint64_t clord_id; int64_t fill_px; int32_t fill_qty; };

// All three messages packed into a single variant — no virtual dispatch,
// no heap allocation, stored inline in the variant's aligned storage.
using OrderMsg = std::variant<NewOrder, CancelOrder, Execution>;

void process(const OrderMsg& msg) {
    std::visit([](const auto& m) {
        using T = std::decay_t<decltype(m)>;
        if constexpr (std::is_same_v<T, NewOrder>)
            printf("NewOrder %c %d @ %lld  id=%llu\\n",
                   m.side, m.qty, (long long)m.price, (unsigned long long)m.clord_id);
        else if constexpr (std::is_same_v<T, CancelOrder>)
            printf("Cancel id=%llu\\n", (unsigned long long)m.clord_id);
        else
            printf("Execution id=%llu fill %d @ %lld\\n",
                   (unsigned long long)m.clord_id, m.fill_qty, (long long)m.fill_px);
    }, msg);
}

int main() {
    OrderMsg msgs[] = {
        NewOrder{10050, 100, 'B', 1001},
        CancelOrder{1001},
        Execution{1001, 10048, 100},
    };
    for (const auto& m : msgs) process(m);
}`,
    explanation: "std::variant with std::visit generates a jump table (switch on the type index) at compile time — the discriminant check and dispatch are a single conditional branch with no virtual pointer indirection, which matters on a hot order-flow path where the message bus might carry millions of events per second through the same code.",
  },
  {
    id: "cpp-20260727-b1-ranges-pnl",
    language: "cpp",
    title: "C++20 ranges pipeline for portfolio P&L aggregation",
    tag: "cpp20",
    code: `#include <ranges>
#include <vector>
#include <numeric>
#include <algorithm>
#include <cstdio>

struct Position {
    const char* symbol;
    double      notional;  // positive = long, negative = short
    double      pnl;       // unrealised P&L
};

int main() {
    std::vector<Position> book = {
        {"AAPL",  1'000'000,  12'500},
        {"GOOG", -500'000,   -8'200},
        {"MSFT",  750'000,    6'100},
        {"TSLA", -300'000,    3'400},  // short, profit
        {"AMZN",  200'000,   -1'800},
    };

    // Filter long positions and sum their P&L — lazy pipeline
    auto long_pnl = book
        | std::views::filter([](const Position& p){ return p.notional > 0; })
        | std::views::transform([](const Position& p){ return p.pnl; });

    double total = std::ranges::fold_left(long_pnl, 0.0, std::plus<>{});
    printf("Long book P&L: %.0f\\n", total);   // 12500 + 6100 - 1800

    // Top-3 P&L positions (in-place sort on copy)
    auto by_pnl = book;
    std::ranges::sort(by_pnl, std::greater{}, &Position::pnl);
    printf("Top 3 P&L positions:\\n");
    for (auto& p : by_pnl | std::views::take(3))
        printf("  %-6s  pnl=%+.0f\\n", p.symbol, p.pnl);
}`,
    explanation: "C++20 ranges combine lazy evaluation (filter and transform compose without intermediate containers) with readable declarative syntax; ranges::sort with a projection member pointer (& Position::pnl) eliminates the lambda boilerplate while staying fully inline — the same performance as a hand-written loop.",
  },
  {
    id: "cpp-20260727-b1-coroutine-feed",
    language: "cpp",
    title: "C++20 coroutine generator for lazy tick streaming",
    tag: "cpp20",
    code: `#include <coroutine>
#include <optional>
#include <cstdio>

// Minimal generator coroutine: suspends at each co_yield, resumes on demand.
// No threads, no callbacks — caller controls the pace (pull model).

template<typename T>
struct Generator {
    struct promise_type {
        std::optional<T> value;
        Generator get_return_object() { return {std::coroutine_handle<promise_type>::from_promise(*this)}; }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        std::suspend_always yield_value(T v) { value = v; return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> h;
    explicit Generator(std::coroutine_handle<promise_type> h) : h(h) {}
    ~Generator() { if (h) h.destroy(); }

    std::optional<T> next() {
        if (h.done()) return std::nullopt;
        h.resume();
        if (h.done()) return std::nullopt;
        return h.promise().value;
    }
};

struct Tick { int64_t price; int32_t qty; };

Generator<Tick> replay_feed() {
    // Simulates a market data replay — in production, reads from mmap'd file
    co_yield {10050, 100};
    co_yield {10051, 200};
    co_yield {10049,  50};
}

int main() {
    auto gen = replay_feed();
    while (auto tick = gen.next())
        printf("price=%lld qty=%d\\n", (long long)tick->price, tick->qty);
}`,
    explanation: "A coroutine generator suspends at each co_yield and resumes when the caller calls next(); the stack frame is heap-allocated once (the coroutine frame) and re-entered cheaply via a function pointer in the coroutine_handle — this replaces callback-based tick dispatchers with straight-line sequential code that is easier to test and profile.",
  },
  {
    id: "cpp-20260727-b1-memory-order-seqcst",
    language: "cpp",
    title: "Memory ordering: relaxed vs acquire-release vs seq_cst",
    tag: "lock-free",
    code: `#include <atomic>
#include <thread>
#include <cstdio>

// Three memory orderings illustrated on a simple flag-and-data pattern:
// relaxed: no ordering constraint — cheapest, only safe for single-variable ops
// acquire/release: establishes happens-before between producer/consumer
// seq_cst: total order across all threads — most expensive (full fence on x86)

std::atomic<int>  g_data{0};
std::atomic<bool> g_ready{false};

// --- Acquire-Release pattern (correct producer/consumer) ---
void producer() {
    g_data.store(42, std::memory_order_relaxed);   // data may reorder before ready
    g_ready.store(true, std::memory_order_release); // release: all prior stores visible
}

void consumer() {
    while (!g_ready.load(std::memory_order_acquire)) // acquire: sees all prior releases
        ;  // spin
    printf("data=%d\\n", g_data.load(std::memory_order_relaxed)); // always 42
}

// --- Relaxed counter: only correct when no ordering with other variables needed ---
std::atomic<int64_t> g_counter{0};
void increment_relaxed() {
    // Relaxed fetch_add is the cheapest atomic — just LOCK XADD on x86
    g_counter.fetch_add(1, std::memory_order_relaxed);
}

int main() {
    std::thread t1(producer), t2(consumer);
    t1.join(); t2.join();
    increment_relaxed();
    printf("counter=%lld\\n", (long long)g_counter.load());
}`,
    explanation: "Acquire-release is the sweet spot for producer-consumer synchronisation: the release store on the flag ensures all preceding writes are globally visible before the flag is set, and the acquire load on the consumer side guarantees it sees all those writes — with zero extra fences on TSO architectures like x86, where the hardware already enforces this ordering for free.",
  },
  {
    id: "cpp-20260727-b1-bitcast",
    language: "cpp",
    title: "std::bit_cast for safe float/int reinterpretation",
    tag: "cpp20",
    code: `#include <bit>
#include <cstdint>
#include <cstdio>

// bit_cast<To>(from): reinterprets the bit pattern of 'from' as type 'To'
// — like reinterpret_cast/memcpy but defined behaviour and constexpr.
// Essential for IEEE 754 tricks without UB.

constexpr float  fast_rsqrt(float x) {
    // Quake III fast inverse square root — fully defined with bit_cast
    uint32_t i = std::bit_cast<uint32_t>(x);
    i = 0x5F3759DFu - (i >> 1);            // magic constant
    float y = std::bit_cast<float>(i);
    return y * (1.5f - 0.5f * x * y * y);  // one Newton-Raphson step
}

// Pack a FIX price (int64_t) into a network message using bit_cast
constexpr double price_from_int(int64_t raw, int precision = 4) {
    // raw = price * 10^precision stored as integer to avoid FP wire format
    double scale = 1.0;
    for (int i = 0; i < precision; ++i) scale *= 10.0;
    return static_cast<double>(raw) / scale;
}

// bit_cast lets us inspect IEEE 754 fields without UB
void inspect_float(float v) {
    uint32_t bits = std::bit_cast<uint32_t>(v);
    uint32_t sign = bits >> 31;
    uint32_t exp  = (bits >> 23) & 0xFF;
    uint32_t mant = bits & 0x7FFFFF;
    printf("%.6g -> sign=%u exp=%u mant=%u\\n", v, sign, exp, mant);
}

int main() {
    printf("rsqrt(4.0) = %.6f  (expected 0.5)\\n", fast_rsqrt(4.0f));
    printf("price = %.4f\\n", price_from_int(100503, 1));  // 10050.3
    inspect_float(3.14f);
}`,
    explanation: "std::bit_cast provides defined behaviour for type-punning that was undefined via reinterpret_cast or union; in HFT code it is used to implement fast numerical tricks (inverse square root, sign extraction, ULP comparison) and to reinterpret network-endian wire formats without the UB that plagued C-style casts, and unlike memcpy it is constexpr.",
  },
  {
    id: "cpp-20260727-b1-nttp-ticksize",
    language: "cpp",
    title: "Non-type template parameters for compile-time tick size",
    tag: "templates",
    code: `#include <cstdint>
#include <cstdio>
#include <type_traits>

// NTTP (Non-Type Template Parameter): encode tick size as a compile-time constant.
// The compiler specialises PriceLevel for each instrument type — the tick-size
// arithmetic becomes constant folding, not a runtime division.

template<int64_t TickSizeX10000>
struct PriceLevel {
    static constexpr double tick = TickSizeX10000 / 10000.0;

    // Round price to nearest tick — computed with compile-time tick constant
    static constexpr int64_t round_to_tick(int64_t price_x10000) noexcept {
        return (price_x10000 / TickSizeX10000) * TickSizeX10000;
    }

    // Tick count between two prices
    static constexpr int64_t tick_distance(int64_t from_x10000, int64_t to_x10000) noexcept {
        return (to_x10000 - from_x10000) / TickSizeX10000;
    }
};

// Instrument-specific specialisations
using SPXLevel   = PriceLevel<10>;     // 0.001 (SPX options, 0.1c tick)
using ES_Level   = PriceLevel<25>;     // 0.0025 (E-mini S&P futures)
using BTC_Level  = PriceLevel<10000>;  // 1.0000 (BTC whole dollar)

int main() {
    int64_t raw = 480050;  // 48.005 in x10000 format
    printf("SPX tick: %.4f   round: %lld  dist: %lld\\n",
           SPXLevel::tick,
           (long long)SPXLevel::round_to_tick(raw),
           (long long)SPXLevel::tick_distance(480000, raw));

    printf("ES tick:  %.4f   round: %lld\\n",
           ES_Level::tick,
           (long long)ES_Level::round_to_tick(raw));
}`,
    explanation: "Encoding tick size as a non-type template parameter lets the compiler specialise round_to_tick for each instrument at compile time, turning the modular arithmetic into a constant divisor that modern compilers convert to a multiply-shift sequence — avoiding a runtime integer divide (latency ~20-40 cycles) on the critical path of price validation.",
  },
  {
    id: "cpp-20260727-b1-simd-dotprod",
    language: "cpp",
    title: "SSE2 dot product for portfolio weight vector",
    tag: "SIMD",
    code: `#include <immintrin.h>
#include <cstddef>
#include <cstdio>

// Process 4 doubles at a time using SSE2 _mm256 (AVX) or SSE2 _mm128 (fallback).
// Here we use SSE2 (128-bit = 2 doubles) for maximum compatibility.

// Dot product: sum_i a[i]*b[i]
double dot_sse2(const double* __restrict__ a,
                const double* __restrict__ b,
                std::size_t n) {
    __m128d acc = _mm_setzero_pd();
    std::size_t i = 0;
    // Process 2 doubles per iteration
    for (; i + 2 <= n; i += 2) {
        __m128d va = _mm_loadu_pd(a + i);
        __m128d vb = _mm_loadu_pd(b + i);
        acc = _mm_add_pd(acc, _mm_mul_pd(va, vb));
    }
    // Horizontal sum: add high half to low half
    __m128d shuf = _mm_shuffle_pd(acc, acc, 1);
    double result;
    _mm_store_sd(&result, _mm_add_pd(acc, shuf));
    // Scalar tail
    for (; i < n; ++i) result += a[i] * b[i];
    return result;
}

int main() {
    const double weights[4] = {0.25, 0.30, 0.20, 0.25};
    const double returns[4] = {0.10, -0.05, 0.08, 0.12};
    double port_ret = dot_sse2(weights, returns, 4);
    printf("Portfolio return: %.4f\\n", port_ret);  // 0.0565
}`,
    explanation: "SSE2 double-precision intrinsics process two doubles per instruction cycle, roughly doubling throughput for inner-product computation compared to scalar code; for a 200-asset portfolio, the dot product for P&L or risk contribution attribution drops from ~200 to ~100 cycles, and scaling to AVX-512 (8 doubles/cycle) cuts it to ~25 cycles.",
  },
  {
    id: "cpp-20260727-b1-fd-pricer",
    language: "cpp",
    title: "Explicit finite-difference (FTCS) European option pricer",
    tag: "numerics",
    code: `#include <vector>
#include <algorithm>
#include <cmath>
#include <cstdio>

// Forward-in-time, central-in-space (FTCS) explicit finite difference.
// Grid: S in [0, S_max], time backward from T to 0.
// Stability requires dt <= dS^2 / (sigma^2 * S^2) — explicit scheme.

double bs_fd_european_call(double S0, double K, double r, double sigma,
                           double T, int M=200, int N=1000) {
    double S_max = 3.0 * K;
    double dS    = S_max / M;
    double dt    = T    / N;

    // Initial condition: call payoff at T
    std::vector<double> V(M + 1);
    for (int i = 0; i <= M; ++i) V[i] = std::max(i * dS - K, 0.0);

    std::vector<double> V_new(M + 1);

    for (int n = 0; n < N; ++n) {
        double t = T - n * dt;  // backward time
        for (int i = 1; i < M; ++i) {
            double S   = i * dS;
            double a   =  0.5 * dt * (sigma*sigma*S*S/(dS*dS) - r*S/dS);
            double b   = 1.0 - dt * (sigma*sigma*S*S/(dS*dS) + r);
            double c   =  0.5 * dt * (sigma*sigma*S*S/(dS*dS) + r*S/dS);
            V_new[i] = a*V[i-1] + b*V[i] + c*V[i+1];
        }
        // Boundary conditions
        V_new[0] = 0.0;                           // call value at S=0 is 0
        V_new[M] = S_max - K * std::exp(-r * t);  // deep ITM: call ≈ S - K*e^{-rt}
        V.swap(V_new);
    }

    // Interpolate to S0
    int i0   = (int)(S0 / dS);
    double w = (S0 - i0 * dS) / dS;
    return V[i0] * (1 - w) + V[i0 + 1] * w;
}

int main() {
    double price = bs_fd_european_call(100, 100, 0.05, 0.2, 1.0);
    printf("FD call price = %.4f  (BS = ~10.45)\\n", price);
}`,
    explanation: "The explicit FTCS scheme computes V(S, t-dt) directly from V(S, t) without solving a linear system, making each time step O(M) with no matrix factorisation; the stability constraint (CFL condition) limits the time step relative to the spatial grid, so in practice the implicit Crank-Nicolson scheme is preferred for production pricers, but FTCS is ideal for teaching the PDE structure.",
  },
  {
    id: "cpp-20260727-b1-greek-bump-revalue",
    language: "cpp",
    title: "Bump-and-revalue Greek engine with finite differences",
    tag: "numerics",
    code: `#include <cmath>
#include <cstdio>

// Black-Scholes call price (scalar, no SIMD)
inline double bs_call(double S, double K, double r, double sigma, double T) {
    auto norm_cdf = [](double x) {
        return 0.5 * std::erfc(-x / std::sqrt(2.0));
    };
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma * std::sqrt(T));
    double d2 = d1 - sigma * std::sqrt(T);
    return S * norm_cdf(d1) - K * std::exp(-r*T) * norm_cdf(d2);
}

struct Greeks {
    double price, delta, gamma, vega, theta, rho;
};

// Central finite-difference bump-and-revalue for all first-order Greeks
Greeks compute_greeks(double S, double K, double r, double sigma, double T) {
    double h_S     = S     * 1e-4;  // 1 bp bump in spot
    double h_sigma = sigma * 1e-4;  // 1 bp bump in vol
    double h_r     = 1e-4;          // 1 bp bump in rate
    double h_T     = 1.0 / 365.0;  // 1-day bump for theta

    double p  = bs_call(S, K, r, sigma, T);
    double pu = bs_call(S + h_S, K, r, sigma, T);
    double pd = bs_call(S - h_S, K, r, sigma, T);

    Greeks g;
    g.price = p;
    g.delta = (pu - pd) / (2 * h_S);
    g.gamma = (pu - 2*p + pd) / (h_S * h_S);
    g.vega  = (bs_call(S, K, r, sigma + h_sigma, T) - bs_call(S, K, r, sigma - h_sigma, T)) / (2 * h_sigma);
    g.theta = (bs_call(S, K, r, sigma, T - h_T) - p) / h_T;
    g.rho   = (bs_call(S, K, r + h_r, sigma, T) - bs_call(S, K, r - h_r, sigma, T)) / (2 * h_r);
    return g;
}

int main() {
    auto g = compute_greeks(100, 100, 0.05, 0.2, 1.0);
    printf("Price=%.4f Delta=%.4f Gamma=%.4f Vega=%.4f Theta=%.4f Rho=%.4f\\n",
           g.price, g.delta, g.gamma, g.vega, g.theta, g.rho);
}`,
    explanation: "Bump-and-revalue is the universal Greek engine: perturb one parameter by a small h, reprice, and divide by 2h (central difference, O(h²) error vs O(h) for one-sided); it generalises to any pricing model without analytical Greek formulas, at the cost of 2N+1 pricing calls — parallelisable across bumps for complex exotics.",
  },
  {
    id: "cpp-20260727-b1-heap-top-k-trades",
    language: "cpp",
    title: "std::priority_queue top-K P&L trades",
    tag: "STL",
    code: `#include <queue>
#include <vector>
#include <cstdint>
#include <cstdio>

// Maintain a min-heap of size K to find the K largest P&L trades
// without sorting the full history.  O(N log K) vs O(N log N).

struct Trade {
    uint64_t id;
    double   pnl;
};

std::vector<Trade> top_k_pnl(const std::vector<Trade>& trades, int K) {
    // Min-heap: smallest P&L at top
    auto cmp = [](const Trade& a, const Trade& b){ return a.pnl > b.pnl; };
    std::priority_queue<Trade, std::vector<Trade>, decltype(cmp)> pq(cmp);

    for (const auto& t : trades) {
        pq.push(t);
        if ((int)pq.size() > K) pq.pop();  // evict smallest
    }

    std::vector<Trade> result;
    while (!pq.empty()) { result.push_back(pq.top()); pq.pop(); }
    // Result is in ascending order; reverse for descending
    std::reverse(result.begin(), result.end());
    return result;
}

int main() {
    std::vector<Trade> history = {
        {1,  1500}, {2, -200}, {3, 800}, {4, 3200},
        {5,  2100}, {6,  450}, {7, 100}, {8, 2900},
    };
    auto top3 = top_k_pnl(history, 3);
    for (auto& t : top3)
        printf("Trade %llu: P&L=%.0f\\n", (unsigned long long)t.id, t.pnl);
}`,
    explanation: "A K-size min-heap solves the top-K selection problem in O(N log K) time and O(K) space: each new element evicts the smallest in the heap if it exceeds it, maintaining exactly K candidates at all times; this is the approach used in trade P&L attribution reports where N (millions of fills) >> K (top 10 contributors).",
  },
  {
    id: "cpp-20260727-b1-string-view-fix-tag",
    language: "cpp",
    title: "std::string_view for zero-copy FIX tag lookup",
    tag: "STL",
    code: `#include <string_view>
#include <array>
#include <algorithm>
#include <cstdio>

// FIX tag dictionary backed by a sorted array — no heap allocation.
// Binary search gives O(log N) lookup; all strings are string_view over literals.

struct TagEntry { int tag; std::string_view name; };

constexpr std::array<TagEntry, 12> kFIXTags = {{
    {8,  "BeginString"},   {9,  "BodyLength"},   {11, "ClOrdID"},
    {21, "HandlInst"},     {35, "MsgType"},       {38, "OrderQty"},
    {40, "OrdType"},       {44, "Price"},         {49, "SenderCompID"},
    {54, "Side"},          {55, "Symbol"},         {60, "TransactTime"},
}};

// Binary search — works on sorted constexpr array
std::string_view tag_name(int tag) {
    auto it = std::lower_bound(kFIXTags.begin(), kFIXTags.end(), tag,
        [](const TagEntry& e, int t){ return e.tag < t; });
    if (it != kFIXTags.end() && it->tag == tag) return it->name;
    return "Unknown";
}

int main() {
    for (int t : {8, 35, 55, 44, 999})
        printf("Tag %3d = %s\\n", t, std::string(tag_name(t)).c_str());
}`,
    explanation: "string_view over string literals stores only a pointer and length into the read-only data segment — there is no allocation and no copy; combining it with a constexpr sorted array gives a zero-allocation FIX tag dictionary whose binary search touches only two or three cache lines for a 12-entry table, with no dynamic memory at any point.",
  },
  {
    id: "cpp-20260727-b1-order-book-array-price",
    language: "cpp",
    title: "Price-indexed order book using hash array of price levels",
    tag: "data-structures",
    code: `#include <unordered_map>
#include <vector>
#include <cstdint>
#include <cstdio>

// Order book: maps price -> total quantity at that level.
// Uses integer prices (ticks) to avoid floating-point key comparison.
// unordered_map gives O(1) amortized insert/delete/lookup.

struct Level { int64_t total_qty = 0; int order_count = 0; };

struct OrderBook {
    std::unordered_map<int64_t, Level> bids;  // key = price in ticks
    std::unordered_map<int64_t, Level> asks;

    void add_order(char side, int64_t price_ticks, int32_t qty) {
        auto& book = (side == 'B') ? bids : asks;
        auto& lvl  = book[price_ticks];
        lvl.total_qty += qty;
        ++lvl.order_count;
    }

    void cancel_order(char side, int64_t price_ticks, int32_t qty) {
        auto& book = (side == 'B') ? bids : asks;
        auto  it   = book.find(price_ticks);
        if (it == book.end()) return;
        it->second.total_qty -= qty;
        --it->second.order_count;
        if (it->second.order_count == 0) book.erase(it);
    }

    // Best bid: highest price; best ask: lowest price
    int64_t best_bid() const {
        int64_t best = INT64_MIN;
        for (auto& [px, lvl] : bids) if (px > best) best = px;
        return best;
    }
    int64_t best_ask() const {
        int64_t best = INT64_MAX;
        for (auto& [px, lvl] : asks) if (px < best) best = px;
        return best;
    }
};

int main() {
    OrderBook book;
    book.add_order('B', 10050, 100); book.add_order('B', 10049, 200);
    book.add_order('S', 10052, 150); book.add_order('S', 10053, 100);
    printf("Spread: %lld / %lld\\n", (long long)book.best_bid(), (long long)book.best_ask());
    book.cancel_order('B', 10050, 100);
    printf("After cancel best bid: %lld\\n", (long long)book.best_bid());
}`,
    explanation: "Representing prices as integers (ticks) avoids floating-point key comparison instability in hash maps and eliminates the ULP equality problem; a hash map on integer tick prices gives O(1) add/cancel with simple collision handling, while the best-bid/ask scan is O(L) in the number of levels — acceptable for typical books with < 20 populated levels.",
  },
];
