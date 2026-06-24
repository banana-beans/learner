import type { Snippet } from "./types";

export const cppSnippets20260624B1: Snippet[] = [
  {
    id: "cpp-20260624-b1-numa-alloc",
    language: "cpp",
    title: "NUMA-aware memory allocation for multi-socket HFT servers",
    tag: "low-latency",
    code: `#include <numaif.h>
#include <numa.h>
#include <cstdlib>
#include <cstdint>
#include <stdexcept>
#include <sys/mman.h>

// Allocate memory on a specific NUMA node to avoid cross-socket latency.
// On a 2-socket server, accessing memory on the remote socket adds ~80ns.
void* numaAlloc(std::size_t size, int node) {
    if (numa_available() < 0)
        throw std::runtime_error("NUMA not available");

    // mmap anonymous memory; bind to specific NUMA node
    void* ptr = mmap(nullptr, size, PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (ptr == MAP_FAILED)
        throw std::bad_alloc{};

    // mbind: bind pages to node — must be called BEFORE first touch
    nodemask_t mask;
    nodemask_zero(&mask);
    nodemask_set_compat(&mask, node);
    if (mbind(ptr, size, MPOL_BIND, mask.n, sizeof(mask)*8/sizeof(long)+1,
              MPOL_MF_STRICT) != 0) {
        munmap(ptr, size);
        throw std::runtime_error("mbind failed");
    }
    return ptr;
}

void numaFree(void* ptr, std::size_t size) noexcept {
    munmap(ptr, size);
}

// RAII wrapper
struct NumaBuffer {
    void*       ptr;
    std::size_t size;
    int         node;

    NumaBuffer(std::size_t n, int numa_node)
        : ptr(numaAlloc(n, numa_node)), size(n), node(numa_node) {}

    ~NumaBuffer() noexcept { numaFree(ptr, size); }

    NumaBuffer(const NumaBuffer&) = delete;
    NumaBuffer& operator=(const NumaBuffer&) = delete;

    template <typename T>
    T* as() noexcept { return static_cast<T*>(ptr); }
};`,
    explanation: "NUMA binding must happen before the first page fault (first write) — if you bind after first touch, Linux has already placed pages on the calling core's local socket; mbind with MPOL_MF_STRICT migrates existing pages but incurs the migration cost upfront, which is preferable to ongoing cross-socket latency on the critical path.",
  },
  {
    id: "cpp-20260624-b1-hugepages",
    language: "cpp",
    title: "Huge pages (2MB) to eliminate TLB misses in order-book hot path",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <stdexcept>

// TLB (Translation Lookaside Buffer) typically holds 64-1024 entries.
// With 4KB pages, 1024 entries covers only 4MB — a hot order book of 10MB
// causes TLB thrashing (~7ns per miss). Huge pages (2MB) cover 2GB in the same TLB.
static constexpr std::size_t HUGE_PAGE_SIZE = 2ULL * 1024 * 1024;  // 2MB

void* allocHugePages(std::size_t size) {
    // Round up to huge page boundary
    std::size_t rounded = (size + HUGE_PAGE_SIZE - 1) & ~(HUGE_PAGE_SIZE - 1);

    void* ptr = mmap(nullptr, rounded, PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                     -1, 0);
    if (ptr == MAP_FAILED) {
        // Fallback: transparent huge pages (kernel may still promote)
        ptr = mmap(nullptr, rounded, PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (ptr == MAP_FAILED) throw std::bad_alloc{};
        // Advise kernel to use huge pages
        madvise(ptr, rounded, MADV_HUGEPAGE);
    }
    return ptr;
}

void freeHugePages(void* ptr, std::size_t size) noexcept {
    std::size_t rounded = (size + HUGE_PAGE_SIZE - 1) & ~(HUGE_PAGE_SIZE - 1);
    munmap(ptr, rounded);
}

// Global order-book storage on huge pages
struct HugePagedOrderBook {
    static constexpr std::size_t BOOK_SIZE = 64 * HUGE_PAGE_SIZE;
    void*       mem;

    HugePagedOrderBook() : mem(allocHugePages(BOOK_SIZE)) {
        // First-touch to trigger page allocation on this NUMA node
        std::memset(mem, 0, BOOK_SIZE);
    }
    ~HugePagedOrderBook() noexcept { freeHugePages(mem, BOOK_SIZE); }
};`,
    explanation: "MAP_HUGETLB requests 2MB huge pages directly from the kernel's huge-page pool (pre-allocated via /proc/sys/vm/nr_hugepages); the madvise MADV_HUGEPAGE fallback instructs the kernel's transparent huge page daemon to promote 4KB pages to 2MB when possible, which happens asynchronously and may not occur on the critical path but reduces steady-state TLB pressure.",
  },
  {
    id: "cpp-20260624-b1-robin-hood-map",
    language: "cpp",
    title: "Robin Hood open-addressing hash map for order-ID lookup",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cstddef>
#include <vector>
#include <optional>
#include <functional>

// Robin Hood hashing: on collision, steal from the rich (large probe distance)
// and give to the poor (short probe distance). Result: maximum probe distance
// is minimised, giving better worst-case lookup than linear probing.
template <typename K, typename V, typename Hash = std::hash<K>>
class RobinHoodMap {
    struct Entry {
        K          key;
        V          value;
        int        dist = -1;   // probe distance from ideal slot (-1 = empty)
    };

    std::vector<Entry> table_;
    std::size_t        size_   = 0;
    std::size_t        cap_;
    Hash               hasher_;

    static constexpr double MAX_LOAD = 0.7;

    std::size_t idealSlot(const K& k) const noexcept {
        return hasher_(k) & (cap_ - 1);
    }

    void rehash(std::size_t new_cap) {
        RobinHoodMap<K, V, Hash> tmp;
        tmp.cap_   = new_cap;
        tmp.table_.assign(new_cap, Entry{});
        for (auto& e : table_)
            if (e.dist >= 0) tmp.insert(e.key, e.value);
        *this = std::move(tmp);
    }

public:
    explicit RobinHoodMap(std::size_t cap = 64) : cap_(cap) {
        table_.assign(cap_, Entry{});
    }

    void insert(const K& key, const V& val) {
        if (size_ + 1 > cap_ * MAX_LOAD) rehash(cap_ * 2);

        Entry incoming{key, val, 0};
        std::size_t slot = idealSlot(key);

        for (;;) {
            Entry& cur = table_[slot];
            if (cur.dist < 0) {          // empty: place here
                cur = incoming; ++size_; return;
            }
            if (cur.key == incoming.key) { // update
                cur.value = incoming.value; return;
            }
            if (cur.dist < incoming.dist) { // rich: steal slot, continue with displaced
                std::swap(cur, incoming);
            }
            ++incoming.dist;
            slot = (slot + 1) & (cap_ - 1);
        }
    }

    std::optional<V> find(const K& key) const noexcept {
        std::size_t slot = idealSlot(key);
        for (int dist = 0; ; ++dist) {
            const Entry& cur = table_[slot];
            if (cur.dist < 0 || dist > cur.dist) return std::nullopt;
            if (cur.key == key) return cur.value;
            slot = (slot + 1) & (cap_ - 1);
        }
    }

    bool erase(const K& key) noexcept {
        std::size_t slot = idealSlot(key);
        for (int dist = 0; ; ++dist) {
            Entry& cur = table_[slot];
            if (cur.dist < 0 || dist > cur.dist) return false;
            if (cur.key == key) {
                // Backward shift deletion: restore Robin Hood invariant
                for (;;) {
                    std::size_t next = (slot + 1) & (cap_ - 1);
                    if (table_[next].dist <= 0) { cur.dist = -1; return true; }
                    table_[slot] = table_[next];
                    --table_[slot].dist;
                    slot = next;
                }
            }
            slot = (slot + 1) & (cap_ - 1);
        }
    }

    std::size_t size() const noexcept { return size_; }
};`,
    explanation: "Robin Hood hashing reduces the variance in probe distances by swapping elements during insertion — if a new element has probed further from its ideal slot than the resident element, it steals the slot; this keeps the maximum probe distance logarithmic in the load factor, making lookup time much more predictable than standard linear probing, which is critical in HFT where tail latency matters as much as average latency.",
  },
  {
    id: "cpp-20260624-b1-variadics-log",
    language: "cpp",
    title: "Variadic templates for zero-overhead structured trade logging",
    tag: "modern",
    code: `#include <cstdint>
#include <cstdio>
#include <type_traits>
#include <string_view>

// Compile-time format string validation + zero-allocation logging
// using variadic templates and fold expressions.
// All formatting happens into a stack buffer: no heap allocation.

static char g_log_buf[4096];
static int  g_log_pos = 0;

// Base case: write a single value
template <typename T>
void writeVal(T val) {
    if constexpr (std::is_integral_v<T>) {
        g_log_pos += std::snprintf(g_log_buf + g_log_pos,
                                   sizeof(g_log_buf) - g_log_pos,
                                   "%lld", static_cast<long long>(val));
    } else if constexpr (std::is_floating_point_v<T>) {
        g_log_pos += std::snprintf(g_log_buf + g_log_pos,
                                   sizeof(g_log_buf) - g_log_pos,
                                   "%.6f", static_cast<double>(val));
    } else if constexpr (std::is_same_v<std::decay_t<T>, char*> ||
                         std::is_same_v<std::decay_t<T>, const char*> ||
                         std::is_same_v<std::decay_t<T>, std::string_view>) {
        std::string_view sv{val};
        g_log_pos += std::snprintf(g_log_buf + g_log_pos,
                                   sizeof(g_log_buf) - g_log_pos,
                                   "%.*s", static_cast<int>(sv.size()), sv.data());
    }
}

// Variadic: write all args separated by '|'
template <typename... Args>
void tradeLog(std::string_view tag, Args&&... args) {
    g_log_pos = 0;
    writeVal(tag);
    g_log_buf[g_log_pos++] = '|';
    // Fold expression: write each arg then '|'
    ((writeVal(std::forward<Args>(args)), g_log_buf[g_log_pos++] = '|'), ...);
    g_log_buf[g_log_pos] = '\\n';
    // In production: write to ring buffer or lock-free logger
    // fwrite(g_log_buf, 1, g_log_pos + 1, stdout);
}

// Usage: tradeLog("FILL", order_id, side, qty, price, timestamp);
// All types resolved at compile time — no runtime dispatch, no allocation.`,
    explanation: "Fold expressions over comma-separated pack expansions allow a single line to apply a function to every argument in a variadic pack — (f(args), ...) calls f on each element left-to-right with no recursion; using if constexpr inside the formatter removes all branches at compile time for each concrete type, producing code equivalent to a hand-written sequence of snprintf calls.",
  },
  {
    id: "cpp-20260624-b1-perfect-forward",
    language: "cpp",
    title: "Perfect forwarding for generic order factory with in-place construction",
    tag: "modern",
    code: `#include <memory>
#include <cstdint>
#include <utility>
#include <type_traits>

// Perfect forwarding: preserve lvalue/rvalue category of arguments
// so objects are move-constructed when possible (avoiding copies).

struct Order {
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    char          side;

    // Explicit constructor — no default
    Order(std::uint64_t i, double p, std::int32_t q, char s) noexcept
        : id(i), price(p), qty(q), side(s) {}
};

// Pool that creates Orders in-place — forwarding prevents double-construction
template <typename T>
struct InPlaceFactory {
    alignas(T) std::byte storage[sizeof(T)];
    T* obj = nullptr;

    template <typename... Args>
    T* construct(Args&&... args) {
        // std::forward preserves lvalue/rvalue:
        // if args[i] is an rvalue ref, move-constructs; if lvalue, copy-constructs
        obj = ::new (storage) T(std::forward<Args>(args)...);
        return obj;
    }

    void destroy() noexcept {
        if (obj) { obj->~T(); obj = nullptr; }
    }
};

// Generic emplace into a container — returns constructed pointer
template <typename Container, typename T, typename... Args>
T* emplaceOrder(Container& pool, Args&&... args) {
    // Perfect forwarding all the way through: caller's value categories preserved
    return pool.template construct<T>(std::forward<Args>(args)...);
}

// Order factory wrapping std::make_unique with forwarding
template <typename... Args>
std::unique_ptr<Order> makeOrder(Args&&... args) {
    return std::make_unique<Order>(std::forward<Args>(args)...);
}

// Demonstrates universal reference vs rvalue reference:
// T&&         when T is deduced = universal reference (can bind to lvalue or rvalue)
// Specific&&  (non-deduced) = rvalue reference (binds to rvalue only)
template <typename T>
void sink(T&& val) {
    // Forward: if T = Order&  -> val is lvalue -> copies
    //          if T = Order   -> val is rvalue -> moves
    auto owned = std::forward<T>(val);
    (void)owned;
}`,
    explanation: "Universal references (T&& with deduced T) collapse to lvalue references when bound to lvalues and remain rvalue references when bound to rvalues — std::forward<T> restores the original value category, enabling move semantics all the way through the call chain; the key mistake is forwarding a parameter more than once (after the first forward, the object may be in a moved-from state).",
  },
  {
    id: "cpp-20260624-b1-type-erasure",
    language: "cpp",
    title: "Type erasure for polymorphic order strategies without vtable overhead",
    tag: "modern",
    code: `#include <memory>
#include <functional>
#include <cstdint>

// Type erasure: store heterogeneous types behind a uniform interface
// without requiring them to share a base class.
// Avoids virtual dispatch overhead (indirect call + cache miss on vtable ptr).

struct OrderContext {
    std::uint64_t order_id;
    double        mid_price;
};

// Erased strategy: any callable (lambda, functor, function pointer)
// that takes an OrderContext and returns a bool (should submit?).
class OrderStrategy {
    // Internal concept: any callable matching the signature
    struct Concept {
        virtual ~Concept() = default;
        virtual bool execute(const OrderContext&) = 0;
        virtual std::unique_ptr<Concept> clone() const = 0;
    };

    template <typename F>
    struct Model : Concept {
        F fn;
        explicit Model(F f) : fn(std::move(f)) {}
        bool execute(const OrderContext& ctx) override { return fn(ctx); }
        std::unique_ptr<Concept> clone() const override {
            return std::make_unique<Model<F>>(fn);
        }
    };

    std::unique_ptr<Concept> impl_;

public:
    template <typename F,
              typename = std::enable_if_t<!std::is_same_v<std::decay_t<F>, OrderStrategy>>>
    OrderStrategy(F&& f) : impl_(std::make_unique<Model<std::decay_t<F>>>(std::forward<F>(f))) {}

    OrderStrategy(const OrderStrategy& o) : impl_(o.impl_->clone()) {}
    OrderStrategy(OrderStrategy&&) noexcept = default;
    OrderStrategy& operator=(OrderStrategy&&) noexcept = default;

    bool operator()(const OrderContext& ctx) { return impl_->execute(ctx); }
};

// Usage: any lambda/functor works — no inheritance required
// OrderStrategy aggressive = [](const OrderContext& c){ return c.mid_price > 100.0; };
// OrderStrategy passive    = [threshold=0.01](const OrderContext& c){
//     return c.mid_price > 100.0 - threshold; };
// Both stored in vector<OrderStrategy> without templates bleeding into callers.`,
    explanation: "Type erasure combines a virtual interface (Concept) and a templated wrapper (Model<F>) to bridge static polymorphism (templates, no overhead) with runtime polymorphism (stored in containers, runtime dispatch) — the caller's type information is 'erased' at the OrderStrategy boundary; small-buffer optimization (storing small callables inline) is the next step for eliminating the heap allocation for lambdas under a size threshold.",
  },
  {
    id: "cpp-20260624-b1-timer-wheel",
    language: "cpp",
    title: "Hierarchical timer wheel for O(1) order expiry scheduling",
    tag: "data-structures",
    code: `#include <array>
#include <vector>
#include <cstdint>
#include <functional>

// Timer wheel: O(1) add/cancel, O(1) amortised advance.
// Used for GTC order expiry, IOC timeout, and heartbeat management.
// Two levels: coarse (seconds) and fine (milliseconds within a second).
static constexpr int FINE_SLOTS  = 1000;   // 1000 ms per second
static constexpr int COARSE_SLOTS = 60;    // 60 seconds per rotation

using TimerCallback = std::function<void(std::uint64_t order_id)>;

struct TimerEntry {
    std::uint64_t  order_id;
    TimerCallback  cb;
    int            remaining_rotations;  // for coarse overflow
};

class TimerWheel {
    std::array<std::vector<TimerEntry>, FINE_SLOTS>   fine_;    // ms slots
    std::array<std::vector<TimerEntry>, COARSE_SLOTS> coarse_;  // second slots

    int fine_pos_   = 0;
    int coarse_pos_ = 0;

public:
    // Schedule callback after delay_ms milliseconds
    void schedule(std::uint64_t id, TimerCallback cb, int delay_ms) {
        if (delay_ms < FINE_SLOTS) {
            int slot = (fine_pos_ + delay_ms) % FINE_SLOTS;
            fine_[slot].push_back({id, std::move(cb), 0});
        } else {
            // Place in coarse wheel; re-schedule to fine when coarse fires
            int coarse_delay = (delay_ms / FINE_SLOTS) % COARSE_SLOTS;
            int slot = (coarse_pos_ + coarse_delay) % COARSE_SLOTS;
            int remaining_ms = delay_ms % FINE_SLOTS;
            coarse_[slot].push_back({id, std::move(cb), remaining_ms});
        }
    }

    // Advance by 1 ms — call from a timer thread at 1kHz
    void tick() {
        fine_pos_ = (fine_pos_ + 1) % FINE_SLOTS;

        // Fire all timers in this fine slot
        for (auto& entry : fine_[fine_pos_]) {
            entry.cb(entry.order_id);
        }
        fine_[fine_pos_].clear();

        // On full fine rotation, advance coarse wheel and cascade
        if (fine_pos_ == 0) {
            coarse_pos_ = (coarse_pos_ + 1) % COARSE_SLOTS;
            for (auto& entry : coarse_[coarse_pos_]) {
                // Re-insert into fine wheel with remaining time
                int slot = (fine_pos_ + entry.remaining_rotations) % FINE_SLOTS;
                fine_[slot].push_back(std::move(entry));
            }
            coarse_[coarse_pos_].clear();
        }
    }
};`,
    explanation: "A hierarchical timer wheel avoids the O(log N) insertion cost of a priority queue — at the cost of requiring periodic tick() calls; the two-level hierarchy handles both short (< 1s) and long (up to 60s) timeouts without wasting slots, cascading coarse-wheel entries into the fine wheel when the coarse position advances, similar to how CPU hardware timers work.",
  },
  {
    id: "cpp-20260624-b1-itch-parser",
    language: "cpp",
    title: "NASDAQ ITCH 5.0 binary market-data message parser",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <string_view>
#include <arpa/inet.h>   // ntohl / ntohs for big-endian decoding

// ITCH 5.0: binary protocol, big-endian, variable-length messages.
// Each message starts with a 2-byte length + 1-byte type.
// This parser decodes the most common message types inline (no allocation).

inline std::uint16_t be16(const uint8_t* p) noexcept {
    std::uint16_t v; std::memcpy(&v, p, 2); return ntohs(v);
}
inline std::uint32_t be32(const uint8_t* p) noexcept {
    std::uint32_t v; std::memcpy(&v, p, 4); return ntohl(v);
}
inline std::uint64_t be64(const uint8_t* p) noexcept {
    std::uint64_t hi = be32(p), lo = be32(p + 4);
    return (hi << 32) | lo;
}

struct AddOrderMsg {
    std::uint64_t timestamp_ns;
    std::uint64_t order_ref;
    char          buy_sell;   // 'B' or 'S'
    std::uint32_t shares;
    char          stock[9];   // 8-char padded stock symbol + NUL
    std::uint32_t price_ticks; // price in 1/10000 of a dollar
};

struct ExecutedMsg {
    std::uint64_t timestamp_ns;
    std::uint64_t order_ref;
    std::uint32_t executed_shares;
    std::uint64_t match_number;
};

struct ITCHHandler {
    virtual void onAddOrder(const AddOrderMsg&)  noexcept = 0;
    virtual void onExecuted(const ExecutedMsg&)  noexcept = 0;
    virtual ~ITCHHandler() = default;
};

bool parseITCH(const uint8_t* buf, std::size_t len, ITCHHandler& handler) noexcept {
    if (len < 3) return false;
    char type = static_cast<char>(buf[2]);

    if (type == 'A' && len >= 36) {          // Add Order (no MPID)
        AddOrderMsg msg{};
        msg.timestamp_ns = be64(buf + 5);    // 6-byte ns; simplified as 8-byte
        msg.order_ref    = be64(buf + 11);
        msg.buy_sell     = static_cast<char>(buf[19]);
        msg.shares       = be32(buf + 20);
        std::memcpy(msg.stock, buf + 24, 8); msg.stock[8] = '\0';
        msg.price_ticks  = be32(buf + 32);
        handler.onAddOrder(msg);
        return true;
    }

    if (type == 'E' && len >= 31) {          // Order Executed
        ExecutedMsg msg{};
        msg.timestamp_ns     = be64(buf + 5);
        msg.order_ref        = be64(buf + 11);
        msg.executed_shares  = be32(buf + 19);
        msg.match_number     = be64(buf + 23);
        handler.onExecuted(msg);
        return true;
    }
    return false;
}`,
    explanation: "ITCH uses big-endian byte order (network byte order) while x86-64 uses little-endian, so every multi-byte field requires ntohl/ntohs — reading via memcpy then byte-swapping avoids undefined behaviour from unaligned pointer casts; the handler virtual dispatch is acceptable at this layer because market-data parsing is not the innermost loop (the inner loop is per-field decode, which is branch-free).",
  },
  {
    id: "cpp-20260624-b1-exp-lut",
    language: "cpp",
    title: "Lookup table fast exp() approximation for Black-Scholes Greeks batch",
    tag: "numerics",
    code: `#include <cmath>
#include <array>
#include <cstdint>
#include <cstring>

// Fast exp approximation using bit manipulation (Schraudolph 1999).
// Error < 2% for most inputs — sufficient for batch Greeks computation
// where precision in the 5th decimal place is irrelevant.

// Schraudolph fast exp: exploits IEEE 754 float representation.
inline float fastExpF(float x) noexcept {
    // x scaled to match IEEE 754 exponent bias and mantissa.
    // 1065353216 = (127 << 23) maps x=0 -> 1.0
    union { float f; std::int32_t i; } u;
    u.i = static_cast<std::int32_t>(12102203.16f * x + 1064807.32f * 1024);
    return u.f;
}

// Higher accuracy: 2^x via LUT on integer part + polynomial on fractional part
static constexpr int LUT_SIZE = 256;
static float g_exp2_lut[LUT_SIZE];   // exp2(i / LUT_SIZE) for i in [0, LUT_SIZE)

void initExpLut() noexcept {
    for (int i = 0; i < LUT_SIZE; ++i)
        g_exp2_lut[i] = static_cast<float>(std::exp2(static_cast<double>(i) / LUT_SIZE));
}

// exp(x) using LUT: x -> 2^(x / log2) = 2^(x * log2e)
inline float lutExp(float x) noexcept {
    static constexpr float LOG2E = 1.4426950408889634f;
    float y = x * LOG2E;
    int   n = static_cast<int>(y);       // integer part
    float f = y - static_cast<float>(n); // fractional part in [0,1)
    int   idx = static_cast<int>(f * LUT_SIZE) & (LUT_SIZE - 1);
    // 2^n via bit manipulation on float exponent
    union { float v; std::int32_t i; } scale;
    scale.i = (127 + n) << 23;           // set exponent field
    return scale.v * g_exp2_lut[idx];
}

// Batch compute discounted payoffs using fast exp
void batchDiscount(const float* rates, const float* times,
                   float* out, int n) noexcept {
    for (int i = 0; i < n; ++i)
        out[i] = lutExp(-rates[i] * times[i]);
}`,
    explanation: "The Schraudolph approximation reinterprets the float bit pattern — since exp(x) ~ 2^(x*log2e) and IEEE 754 exponent bits represent powers of 2, adding a scaled integer to the float's bit representation gives a fast but approximate exp; the LUT refinement samples exp2 at LUT_SIZE points to reduce the fractional-part error from 2% to ~0.01%, which is useful for batch options pricing where accuracy requirements are lower than for a single precise calculation.",
  },
  {
    id: "cpp-20260624-b1-avx2-greeks",
    language: "cpp",
    title: "AVX2 SIMD vectorized Black-Scholes delta for options batches",
    tag: "low-latency",
    code: `#include <immintrin.h>
#include <cmath>
#include <cstdint>

// Process 8 options simultaneously using AVX2 (256-bit = 8 floats).
// Black-Scholes delta: N(d1) for calls, N(d1)-1 for puts.

// Approximate erfc for 8 floats simultaneously
// Using Abramowitz & Stegun 7.1.26 polynomial approximation.
static __m256 avx2_erfc(__m256 x) noexcept {
    // |error| < 1.5e-7; sufficient for delta computation.
    __m256 t = _mm256_div_ps(_mm256_set1_ps(1.0f),
                              _mm256_fmadd_ps(_mm256_set1_ps(0.3275911f), x,
                                              _mm256_set1_ps(1.0f)));
    // Polynomial in t: coefficients from A&S
    __m256 p = _mm256_set1_ps(1.061405429f);
    p = _mm256_fmsub_ps(p, t, _mm256_set1_ps(1.453152027f));
    p = _mm256_fmadd_ps(p, t, _mm256_set1_ps(1.421413741f));
    p = _mm256_fmsub_ps(p, t, _mm256_set1_ps(0.284496736f));
    p = _mm256_fmadd_ps(p, t, _mm256_set1_ps(0.254829592f));
    p = _mm256_mul_ps(p, t);

    // erfc(x) = poly * exp(-x*x)
    __m256 xsq  = _mm256_mul_ps(x, x);
    __m256 neg_xsq = _mm256_sub_ps(_mm256_setzero_ps(), xsq);
    // Use _mm256_exp_ps (requires SVML or scalar fallback)
    // Scalar fallback for portability:
    float tmp[8]; _mm256_storeu_ps(tmp, neg_xsq);
    for (int i = 0; i < 8; ++i) tmp[i] = std::exp(tmp[i]);
    __m256 exp_neg_xsq = _mm256_loadu_ps(tmp);

    return _mm256_mul_ps(p, exp_neg_xsq);
}

// Batch delta for 8 options. call_mask: 0xFFFFFFFF=call, 0=put per lane.
void batchDelta(const float* S, const float* K, const float* r,
                const float* sigma, const float* T,
                const uint32_t* call_mask,
                float* delta_out, int n) noexcept {
    // Process 8 at a time
    for (int i = 0; i + 8 <= n; i += 8) {
        __m256 s = _mm256_loadu_ps(S + i);
        __m256 k = _mm256_loadu_ps(K + i);
        __m256 rv = _mm256_loadu_ps(r + i);
        __m256 sv = _mm256_loadu_ps(sigma + i);
        __m256 tv = _mm256_loadu_ps(T + i);

        __m256 sqT    = _mm256_sqrt_ps(tv);
        __m256 half   = _mm256_set1_ps(0.5f);
        __m256 one    = _mm256_set1_ps(1.0f);
        __m256 sqrt2  = _mm256_set1_ps(1.41421356f);

        // d1 = (log(S/K) + (r + 0.5*sigma^2)*T) / (sigma*sqrt(T))
        // Use scalar log for simplicity (replace with polynomial approx for max speed)
        float log_sk[8]; _mm256_storeu_ps(log_sk, _mm256_div_ps(s, k));
        for (int j = 0; j < 8; ++j) log_sk[j] = std::log(log_sk[j]);
        __m256 log_ratio = _mm256_loadu_ps(log_sk);

        __m256 d1 = _mm256_div_ps(
            _mm256_fmadd_ps(_mm256_fmadd_ps(sv, sv, _mm256_add_ps(rv, rv)), half, log_ratio),
            _mm256_mul_ps(sv, sqT));

        // N(d1) = 0.5 * erfc(-d1 / sqrt(2))
        __m256 neg_d1_sq2 = _mm256_div_ps(_mm256_sub_ps(_mm256_setzero_ps(), d1), sqrt2);
        __m256 Nd1 = _mm256_fmadd_ps(half, avx2_erfc(neg_d1_sq2), half);

        _mm256_storeu_ps(delta_out + i, Nd1);
    }
}`,
    explanation: "AVX2 FMA instructions (_mm256_fmadd_ps) combine a multiply and add in a single instruction with one rounding error instead of two, improving both precision and throughput — on a modern CPU that can retire two FMA instructions per cycle with 8-wide SIMD, this represents a theoretical 16x speedup over scalar; the main bottleneck in practice is memory bandwidth for loading the input arrays, so prefetching the next batch is the next optimisation after vectorising the compute.",
  },
  {
    id: "cpp-20260624-b1-branch-hints",
    language: "cpp",
    title: "Branch prediction hints for hot/cold path separation in order routing",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstdlib>

// __builtin_expect(cond, expected): tells the compiler which branch is likely,
// enabling layout of hot path as straight-line code (no jump) for better I-cache use.
// Equivalent to C++20 [[likely]] / [[unlikely]] attributes.

#define LIKELY(x)   __builtin_expect(!!(x), 1)
#define UNLIKELY(x) __builtin_expect(!!(x), 0)

struct Order {
    std::uint64_t id;
    double        price;
    int           qty;
    char          side;
    bool          is_market;
};

// Hot path: most orders are limit orders in normal market conditions.
// Market orders (is_market) are rare but must be handled quickly.
void routeOrder(const Order& o) noexcept {
    if (LIKELY(!o.is_market)) {
        // Hot path: limit order — compiler places this inline, no branch taken
        // Straight-line code: check price band, post to book
        if (UNLIKELY(o.price <= 0.0)) return;  // cold: validation failure
        // ... post_to_book(o) ...
    } else {
        // Cold path: market order — placed in separate code section by linker
        // when using -fprofile-guided-optimization
        // ... execute_immediately(o) ...
    }
}

// C++20 attributes version (no macros):
void routeOrderCpp20(const Order& o) noexcept {
    if (o.is_market) [[unlikely]] {
        // cold path
        return;
    }
    // hot path continues as straight-line code
    [[likely]] if (o.qty > 0) {
        // In practice: both the branch and the expectation compile to CMOV or branch
    }
}

// Sentinel value pattern: use UNLIKELY for error returns
int parsePrice(const char* s, double& out) noexcept {
    char* end;
    out = std::strtod(s, &end);
    if (UNLIKELY(end == s || *end != '\\0')) return -1;  // parse error — rare
    return 0;
}`,
    explanation: "Branch prediction hints do not add or remove branches — they affect code layout: the 'likely' path becomes fall-through (no branch instruction needed on modern CPUs with branch prediction), keeping the hot path in the same cache line; on processors with static branch predictors (some embedded, some ARM cores), the hint becomes the actual prediction when the branch predictor has no history.",
  },
  {
    id: "cpp-20260624-b1-black76",
    language: "cpp",
    title: "Black-76 model for futures options and swaptions",
    tag: "derivatives",
    code: `#include <cmath>

// Black (1976) model: prices options on futures/forwards.
// Unlike Black-Scholes, the forward F is used directly (no financing drift).
// dF = sigma * F * dW  (F is a martingale under the T-forward measure).
// Widely used for: interest rate caps/floors, swaptions, commodity futures options.

struct Black76Result {
    double call, put;
    double delta_call, delta_put;
    double gamma;
    double vega;
    double theta;  // per calendar day
};

Black76Result black76(double F,      // forward price (or rate for swaptions)
                       double K,      // strike
                       double r,      // risk-free rate for discounting
                       double sigma,  // vol of the forward
                       double T)      // time to expiry
{
    if (T <= 0.0 || sigma <= 0.0) {
        double intrinsic_call = std::max(F - K, 0.0);
        double intrinsic_put  = std::max(K - F, 0.0);
        return {intrinsic_call, intrinsic_put, (F > K ? 1.0 : 0.0),
                (F < K ? -1.0 : 0.0), 0.0, 0.0, 0.0};
    }

    double sqT  = std::sqrt(T);
    double d1   = (std::log(F / K) + 0.5 * sigma * sigma * T) / (sigma * sqT);
    double d2   = d1 - sigma * sqT;
    double df   = std::exp(-r * T);  // discount factor

    // Standard normal CDF via erfc
    auto N  = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    auto Nd = [](double x){       // standard normal PDF
        return std::exp(-0.5 * x * x) / std::sqrt(2.0 * M_PI); };

    double Nd1 = N(d1), Nd2 = N(d2);
    double nd1 = Nd(d1);

    double call = df * (F * Nd1 - K * Nd2);
    double put  = df * (K * (1.0 - Nd2) - F * (1.0 - Nd1));

    // Greeks
    double delta_c = df * Nd1;
    double delta_p = df * (Nd1 - 1.0);
    double gamma   = df * nd1 / (F * sigma * sqT);
    double vega_    = df * F * nd1 * sqT / 100.0;  // per 1% vol move
    double theta   = -(df * F * nd1 * sigma / (2.0 * sqT)
                       + r * call) / 365.0;

    return {call, put, delta_c, delta_p, gamma, vega_, theta};
}

// Normal (Bachelier) model for near-zero rates: dF = sigma_n * dW
double bachelierCall(double F, double K, double sigma_n, double T) {
    double sqT  = std::sqrt(T);
    double d    = (F - K) / (sigma_n * sqT);
    auto N  = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    auto Nd = [](double x){ return std::exp(-0.5*x*x) / std::sqrt(2.0*M_PI); };
    return (F - K) * N(d) + sigma_n * sqT * Nd(d);
}`,
    explanation: "Black-76 uses the T-forward measure where the forward price is a martingale, eliminating the drift term and making the formula identical to Black-Scholes with F replacing S and no e^{rT} multiplication in the underlying term; the Bachelier (normal) model is preferred when rates can go negative (as in EUR rates post-2014) because lognormal Black-76 assigns zero probability to negative forwards.",
  },
  {
    id: "cpp-20260624-b1-asian-mc",
    language: "cpp",
    title: "Asian option arithmetic average Monte Carlo with control variate",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <numeric>

// Asian call: payoff = max(A(T) - K, 0) where A(T) = (1/n)*sum(S(t_i)).
// No closed-form for arithmetic average. Geometric average has closed-form
// -> use geometric as control variate for variance reduction.

double geometricAsianCall(double S0, double K, double r, double sigma,
                           double T, int n) {
    // Closed-form for geometric-average Asian call (Kemna-Vorst 1990)
    double dt      = T / n;
    double sigma_g = sigma * std::sqrt((2.0*n + 1.0) / (6.0*(n + 1.0)));
    double mu_g    = (r - 0.5*sigma*sigma) * T * (n + 1.0) / (2.0 * n)
                   + 0.5 * sigma_g * sigma_g * T;
    double d1 = (std::log(S0 / K) + mu_g + 0.5*sigma_g*sigma_g*T) / (sigma_g*std::sqrt(T));
    double d2 = d1 - sigma_g * std::sqrt(T);
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    return std::exp(-r*T) * (S0*std::exp(mu_g)*N(d1) - K*N(d2));
}

double arithmeticAsianCall(double S0, double K, double r, double sigma,
                             double T, int n_obs, int n_paths = 100000,
                             unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;

    const double dt   = T / n_obs;
    const double sqdt = std::sqrt(dt);
    const double disc = std::exp(-r * T);
    const double geo_cf = geometricAsianCall(S0, K, r, sigma, T, n_obs);

    double arith_sum = 0.0, geo_sum = 0.0;
    double arith_geo_cross = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0;
        double arith_avg = 0.0, log_geo = 0.0;

        for (int i = 0; i < n_obs; ++i) {
            double z = Z(rng);
            S *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*sqdt*z);
            arith_avg += S;
            log_geo   += std::log(S);
        }
        arith_avg /= n_obs;
        double geo_pay  = std::max(std::exp(log_geo / n_obs) - K, 0.0);
        double arith_pay = std::max(arith_avg - K, 0.0);

        arith_sum      += arith_pay;
        geo_sum        += geo_pay;
        arith_geo_cross += arith_pay * geo_pay;
    }

    // Compute optimal beta (correlation of arithmetic and geometric payoffs)
    double mean_a = arith_sum / n_paths;
    double mean_g = geo_sum   / n_paths;
    double cov_ag = arith_geo_cross / n_paths - mean_a * mean_g;
    double var_g  = geo_sum * geo_sum / (n_paths * n_paths);  // approx
    double beta   = (var_g > 1e-15) ? cov_ag / var_g : 1.0;

    // Control variate adjusted price
    return disc * (mean_a - beta * (mean_g - geo_cf));
}`,
    explanation: "The geometric average Asian option has a closed-form price under GBM (Kemna-Vorst) because the geometric average is itself log-normal, while the arithmetic average is not; using the geometric payoff as a control variate exploits the high correlation (~0.99 for large n) between arithmetic and geometric path payoffs, reducing Monte Carlo standard error by a factor of 5-20x depending on moneyness.",
  },
  {
    id: "cpp-20260624-b1-barrier-mc",
    language: "cpp",
    title: "Discrete barrier option pricing with Brownian bridge correction",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Discrete down-and-out barrier: the option knocks out if S_t <= H
// at any of the discrete monitoring dates t_1, ..., t_n.
// Naive MC: O(N * n_paths). Brownian bridge correction reduces bias.

double barrierBrownianBridgeCorrection(double S_start, double S_end,
                                        double H, double sigma, double dt) {
    // Probability of hitting barrier between two GBM points given
    // starting price S_start and ending price S_end (Kou 2003 formula).
    if (S_start <= H || S_end <= H) return 1.0;  // already crossed
    double logS1 = std::log(S_start / H);
    double logS2 = std::log(S_end   / H);
    // P(min[S_t] <= H | S_start, S_end) = exp(-2*logS1*logS2 / (sigma^2*dt))
    double prob_cross = std::exp(-2.0 * logS1 * logS2 / (sigma * sigma * dt));
    return prob_cross;
}

double discreteBarrierDOC(double S0, double K, double H, double r,
                            double sigma, double T, int n_monitor,
                            int n_paths = 100000, unsigned seed = 0) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;

    const double dt   = T / n_monitor;
    const double sqdt = std::sqrt(dt);
    const double disc = std::exp(-r * T);

    double payoff_sum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S      = S0;
        bool knocked  = false;
        double S_prev = S0;

        for (int i = 0; i < n_monitor; ++i) {
            double z  = Z(rng);
            double S_next = S * std::exp((r - 0.5*sigma*sigma)*dt + sigma*sqdt*z);

            // Brownian bridge correction: probability of hitting H between steps
            double p_hit = barrierBrownianBridgeCorrection(S_prev, S_next, H, sigma, dt);

            // Stochastic knock-out using bridge probability
            if (S_next <= H || p_hit > 0.0) {
                // Sample Bernoulli(p_hit)
                std::uniform_real_distribution<double> U(0.0, 1.0);
                if (S_next <= H || U(rng) < p_hit) {
                    knocked = true;
                    break;
                }
            }
            S_prev = S;
            S = S_next;
        }

        if (!knocked) {
            payoff_sum += std::max(S - K, 0.0);
        }
    }
    return disc * payoff_sum / n_paths;
}`,
    explanation: "Naive discrete barrier MC underestimates the barrier-crossing probability between monitoring dates because a path that dips below H between dates H is counted as surviving; the Brownian bridge correction adds the probability of an inter-step crossing, computed analytically from the known distribution of the Brownian bridge minimum, reducing the bias substantially with negligible extra computation.",
  },
  {
    id: "cpp-20260624-b1-lookback-mc",
    language: "cpp",
    title: "Floating-strike lookback option Monte Carlo pricing",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <limits>

// Floating-strike lookback call: payoff = S(T) - min(S(t), t in [0,T]).
// The strike is set to the minimum price over the life of the option.
// Closed-form exists for continuous monitoring; discrete MC used in practice.

struct LookbackResult {
    double price;
    double se;       // standard error
};

LookbackResult lookbackFloatingCall(double S0, double r, double sigma,
                                     double T, int n_steps = 252,
                                     int n_paths = 100000,
                                     unsigned seed = 0) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;

    const double dt   = T / n_steps;
    const double sqdt = std::sqrt(dt);
    const double disc = std::exp(-r * T);

    double sum = 0.0, sum2 = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S   = S0;
        double Smin = S0;

        for (int i = 0; i < n_steps; ++i) {
            S *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*sqdt*Z(rng));
            Smin = std::min(Smin, S);
        }

        double payoff = S - Smin;   // always >= 0
        sum  += payoff;
        sum2 += payoff * payoff;
    }

    double mean   = sum / n_paths;
    double var    = (sum2 / n_paths - mean * mean) / (n_paths - 1);
    double se     = std::sqrt(var);

    return {disc * mean, disc * se};
}

// Closed-form for continuous monitoring (Goldman-Sosin-Gatto 1979)
double lookbackClosedForm(double S0, double r, double sigma, double T) {
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    double a1 = (std::log(1.0) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double a2 = a1 - sigma*std::sqrt(T);
    double a3 = (std::log(1.0) + (-r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double disc = std::exp(-r*T);
    // For S0 = Smin (at time 0, min = S0):
    return S0*N(a1) - S0*disc*N(a2)
         + S0*sigma*sigma/(2.0*r)*(-N(a1) + std::exp(-r*T)*N(a3));
}`,
    explanation: "Lookback options are path-dependent on the running minimum (or maximum) of the price, making them the most expensive vanilla exotic because the buyer pays for perfect hindsight; the floating-strike call always pays S(T) - min_path which is always non-negative, so the price is strictly higher than a vanilla call — the premium represents the cost of the investor being able to lock in the lowest price retrospectively.",
  },
  {
    id: "cpp-20260624-b1-hull-white",
    language: "cpp",
    title: "Hull-White one-factor short-rate model simulation and bond pricing",
    tag: "fixed-income",
    code: `#include <cmath>
#include <random>
#include <vector>

// Hull-White: dr(t) = [theta(t) - a*r(t)]*dt + sigma*dW(t)
// theta(t) is calibrated to match the initial forward curve exactly.
// Mean-reverting with constant a (speed) and sigma.
//
// Zero-coupon bond: P(t,T) = A(t,T) * exp(-B(t,T)*r(t))
// B(t,T) = (1 - exp(-a*(T-t))) / a
// A(t,T) from market discount factors (fitted exactly).

struct HullWhiteParams {
    double a;      // mean-reversion speed
    double sigma;  // volatility of short rate
};

// B function: bond price sensitivity to short rate
inline double hwB(double a, double tau) noexcept {
    return (1.0 - std::exp(-a * tau)) / a;
}

// Simulate short rate path using Euler-Maruyama
std::vector<double> hwSimulate(const HullWhiteParams& p,
                                 double r0, double T, int n_steps,
                                 std::mt19937_64& rng,
                                 const std::vector<double>& theta_t) {
    std::normal_distribution<double> Z;
    double dt   = T / n_steps;
    double sqdt = std::sqrt(dt);

    std::vector<double> path(n_steps + 1);
    path[0] = r0;
    double r = r0;

    for (int i = 0; i < n_steps; ++i) {
        // theta(t) fitted to market; use piecewise constant approximation
        double theta = (i < static_cast<int>(theta_t.size())) ? theta_t[i]
                       : p.a * r0;   // fallback: long-run mean = r0
        double drift = (theta - p.a * r) * dt;
        double diff  = p.sigma * sqdt * Z(rng);
        r += drift + diff;
        path[i + 1] = r;
    }
    return path;
}

// Analytical zero-coupon bond price given r(t)
double hwZCBPrice(const HullWhiteParams& p, double r_t, double t, double T,
                   double ln_A_tT) noexcept {
    // ln_A(t,T) must be pre-computed from market discount factors:
    // ln A(t,T) = ln(P_mkt(0,T)/P_mkt(0,t)) + B(t,T)*f(0,t)
    //             - 0.5*sigma^2/a^2 * (1-exp(-2*a*t)) * B(t,T)^2
    double tau = T - t;
    double B   = hwB(p.a, tau);
    return std::exp(ln_A_tT - B * r_t);
}

// Caplet price: Jamshidian (1991) — cap is a portfolio of bond puts
double hwCapletPrice(const HullWhiteParams& p, double P_0t, double P_0T,
                      double K_cap, double sigma_B, double t) noexcept {
    // sigma_p: vol of P(t,T) as seen from time 0
    double sigma_p = p.sigma * hwB(p.a, /*tau*/ 1.0)   // placeholder
                   * std::sqrt((1.0 - std::exp(-2.0*p.a*t)) / (2.0*p.a));
    double d1 = std::log(P_0T / (P_0t * K_cap)) / sigma_B + 0.5 * sigma_B;
    double d2 = d1 - sigma_B;
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    // Caplet as put on ZCB (Jamshidian decomposition)
    return P_0t * K_cap * N(-d2) - P_0T * N(-d1);
}`,
    explanation: "Hull-White's key advantage over Vasicek is that theta(t) is chosen to match the initial term structure exactly — this is done by inverting the market discount factors, making H-W an arbitrage-free model by construction; Jamshidian's trick prices a cap (portfolio of caplets) as a portfolio of bond puts, with each put having a closed-form Black-like formula under H-W due to the affine short-rate structure.",
  },
  {
    id: "cpp-20260624-b1-hist-var",
    language: "cpp",
    title: "Historical simulation VaR using full mark-to-market revaluation",
    tag: "risk",
    code: `#include <vector>
#include <algorithm>
#include <cstdint>
#include <cmath>

// Historical simulation VaR: apply the last N historical return scenarios
// to the current portfolio positions and take the alpha-quantile loss.
// Unlike delta-normal, this captures non-linearity (e.g. option gamma).

struct Position {
    double quantity;   // number of shares/contracts
    double current_price;
};

// A historical scenario: vector of price changes per instrument
using Scenario = std::vector<double>;

struct HistSimVaR {
    // portfolio: current positions
    // scenarios: (n_scenarios x n_instruments) historical returns (not P&L)
    // alpha: confidence level (e.g. 0.99)
    static double compute(const std::vector<Position>& portfolio,
                           const std::vector<Scenario>& scenarios,
                           double alpha = 0.99,
                           bool weighted = false,
                           double decay = 0.995) {
        int n_scen = static_cast<int>(scenarios.size());
        std::vector<double> pnl(n_scen);

        for (int s = 0; s < n_scen; ++s) {
            double port_pnl = 0.0;
            for (int i = 0; i < static_cast<int>(portfolio.size()); ++i) {
                // Full revaluation: apply scenario return to current price
                double new_price = portfolio[i].current_price
                                 * (1.0 + scenarios[s][i]);
                double pos_pnl   = portfolio[i].quantity
                                 * (new_price - portfolio[i].current_price);
                port_pnl += pos_pnl;
            }
            pnl[s] = port_pnl;
        }

        if (!weighted) {
            // Simple: sort losses, take (1-alpha) quantile
            std::sort(pnl.begin(), pnl.end());
            int idx = static_cast<int>(std::floor((1.0 - alpha) * n_scen));
            return -pnl[std::max(0, idx)];
        } else {
            // Age-weighted: recent scenarios have higher weight (BIS recommendation)
            // w_i = lambda^{n-i} * (1-lambda) / (1-lambda^n), i=0=oldest
            std::vector<double> weights(n_scen);
            double denom = 1.0 - std::pow(decay, n_scen);
            for (int i = 0; i < n_scen; ++i) {
                weights[i] = std::pow(decay, n_scen - 1 - i) * (1.0 - decay) / denom;
            }
            // Sort PnL-weight pairs, accumulate CDF from worst
            std::vector<std::pair<double, double>> pw(n_scen);
            for (int i = 0; i < n_scen; ++i) pw[i] = {pnl[i], weights[i]};
            std::sort(pw.begin(), pw.end());
            double cum = 0.0;
            for (auto& [p, w] : pw) {
                cum += w;
                if (cum >= 1.0 - alpha) return -p;
            }
            return -pw.back().first;
        }
    }
};`,
    explanation: "Historical simulation VaR requires no distributional assumptions — it uses actual observed market moves, capturing fat tails, volatility clustering, and option non-linearity automatically; the age-weighting (BIS FRTB recommendation) addresses the staleness problem: a 2008 scenario that occurred 500 trading days ago receives weight decay^500 ≈ 0.08 times the weight of yesterday's scenario, making VaR more responsive to current volatility.",
  },
  {
    id: "cpp-20260624-b1-component-var",
    language: "cpp",
    title: "Component VaR and marginal contribution to portfolio risk",
    tag: "risk",
    code: `#include <vector>
#include <cmath>
#include <numeric>

// Component VaR: CVaR_i = rho(R_i, R_portfolio) * VaR_i
// Sum of component VaRs = portfolio VaR (unlike individual VaRs which overcount).
// Used to identify which positions drive risk for risk-limit allocation.

struct ComponentVaRResult {
    std::vector<double> component_var;    // CVaR_i per asset
    std::vector<double> pct_contrib;      // CVaR_i / VaR_portfolio
    std::vector<double> marginal_var;     // dVaR/dw_i
    double port_var;
};

ComponentVaRResult componentVaR(
        const std::vector<double>& weights,     // dollar weights
        const std::vector<std::vector<double>>& Sigma, // daily cov matrix
        double z_alpha = 2.3263) {              // z for 99%

    int n = static_cast<int>(weights.size());

    // Portfolio variance: w' Sigma w
    double port_var = 0.0;
    std::vector<double> cov_portfolio(n, 0.0);  // Sigma * w
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            cov_portfolio[i] += Sigma[i][j] * weights[j];
        }
        port_var += weights[i] * cov_portfolio[i];
    }
    double port_vol = std::sqrt(std::max(port_var, 0.0));
    double port_VaR = z_alpha * port_vol;

    ComponentVaRResult res;
    res.port_var = port_VaR;
    res.component_var.resize(n);
    res.pct_contrib.resize(n);
    res.marginal_var.resize(n);

    for (int i = 0; i < n; ++i) {
        // Marginal VaR: dVaR/dw_i = z * (Sigma*w)_i / port_vol
        res.marginal_var[i] = (port_vol > 1e-10)
                              ? z_alpha * cov_portfolio[i] / port_vol
                              : 0.0;
        // Component VaR: weight_i * marginal VaR_i
        res.component_var[i] = weights[i] * res.marginal_var[i];
        // Percentage contribution
        res.pct_contrib[i] = (port_VaR > 1e-10)
                             ? res.component_var[i] / port_VaR
                             : 0.0;
    }
    // Verify: sum(component_var) should equal port_VaR (Euler decomposition)
    return res;
}`,
    explanation: "Component VaR satisfies the Euler decomposition property: sum_i(CVaR_i) = VaR_portfolio, making it budget-consistent — you can allocate a total risk budget of X across positions so their components sum to X exactly; marginal VaR measures the instantaneous rate of change of portfolio VaR per unit increase in a position, useful for finding the position that, if reduced by $1, reduces portfolio VaR the most.",
  },
  {
    id: "cpp-20260624-b1-ledoit-wolf",
    language: "cpp",
    title: "Ledoit-Wolf analytical shrinkage for covariance matrix estimation",
    tag: "risk",
    code: `#include <vector>
#include <cmath>
#include <numeric>

// Ledoit-Wolf (2004): shrink sample covariance toward the identity (scaled).
// Optimal shrinkage coefficient alpha minimises MSE E[||S_shrunk - Sigma_true||^2].
// Critical for n ~ T (few observations per asset) — avoids singular sample covariance.
//
// Shrunk covariance: S* = alpha * mu_F * I + (1-alpha) * S_sample
// where mu_F is the average eigenvalue (traces a multiple of identity).

struct LedoitWolfResult {
    std::vector<std::vector<double>> shrunk;    // (n x n) shrunk covariance
    double alpha;       // optimal shrinkage intensity
    double mu;          // average variance (target diagonal)
};

LedoitWolfResult ledoitWolfOracle(
        const std::vector<std::vector<double>>& S,  // sample covariance (n x n)
        int T,   // number of observations used to compute S
        int n) { // number of assets
    // Oracle Ledoit-Wolf (analytical formula, not cross-validation)
    // mu = trace(S) / n
    double mu = 0.0;
    for (int i = 0; i < n; ++i) mu += S[i][i];
    mu /= n;

    // delta^2 = ||S - mu*I||_F^2 (squared Frobenius distance from target)
    double delta2 = 0.0;
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j) {
            double d = S[i][j] - (i == j ? mu : 0.0);
            delta2 += d * d;
        }

    // beta^2 = estimated variance of S entries (asymptotic formula)
    double beta2 = 0.0;
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            beta2 += S[i][j] * S[i][j];
    beta2 = (beta2 / (T * T));  // simplified — full formula requires 4th moments

    // Optimal shrinkage: alpha = beta2 / delta2
    double alpha = std::min(1.0, beta2 / std::max(delta2, 1e-15));

    // Shrunk covariance
    std::vector<std::vector<double>> S_star(n, std::vector<double>(n, 0.0));
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            S_star[i][j] = (1.0 - alpha) * S[i][j]
                         + alpha * (i == j ? mu : 0.0);

    return {S_star, alpha, mu};
}`,
    explanation: "The sample covariance matrix is singular when T < n (more assets than observations) and poorly conditioned when T is only slightly larger than n — Ledoit-Wolf shrinkage blends the sample covariance toward a well-conditioned target (multiple of identity) with an analytically derived optimal weight, provably minimising the Frobenius-norm estimation error; for a 200-asset portfolio with 250 daily observations, typical shrinkage alpha values are 0.2-0.4.",
  },
  {
    id: "cpp-20260624-b1-mpsc-queue",
    language: "cpp",
    title: "Multi-producer single-consumer lock-free queue (Dmitry Vyukov)",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstddef>
#include <optional>
#include <array>

// MPSC queue: multiple producers write concurrently, one consumer reads.
// Based on Vyukov's intrusive linked-list: each node is stamped with a sequence.
// No CAS loops needed — each producer owns its slot atomically.
template <typename T, std::size_t CAP>
class MPSCQueue {
    static_assert((CAP & (CAP - 1)) == 0, "CAP must be power of 2");

    struct Slot {
        std::atomic<std::size_t> seq{0};  // 0 = empty, i+1 = written
        T data;
    };

    alignas(64) std::array<Slot, CAP> buf_;
    alignas(64) std::atomic<std::size_t> head_{0};  // producer claim counter (shared)
    alignas(64) std::size_t tail_{0};               // consumer's private counter

    static constexpr std::size_t MASK = CAP - 1;

public:
    MPSCQueue() noexcept {
        for (std::size_t i = 0; i < CAP; ++i)
            buf_[i].seq.store(i, std::memory_order_relaxed);
    }

    // Producer: claim a slot via fetch_add, then write
    bool push(const T& val) noexcept {
        std::size_t pos = head_.fetch_add(1, std::memory_order_relaxed);
        Slot& slot = buf_[pos & MASK];

        // Wait until this slot is free (seq == pos)
        std::size_t expected = pos;
        while (slot.seq.load(std::memory_order_acquire) != expected) {
            // Spin — in practice brief because slot was previously free
        }
        slot.data = val;
        // Signal written: seq = pos + 1
        slot.seq.store(pos + 1, std::memory_order_release);
        return true;
    }

    // Consumer: single-threaded pop
    std::optional<T> pop() noexcept {
        Slot& slot = buf_[tail_ & MASK];
        // Check if this slot has been written (seq == tail_ + 1)
        if (slot.seq.load(std::memory_order_acquire) != tail_ + 1)
            return std::nullopt;   // empty or not yet written
        T val = slot.data;
        // Mark slot as free for the next rotation: seq = tail_ + CAP
        slot.seq.store(tail_ + CAP, std::memory_order_release);
        ++tail_;
        return val;
    }

    bool empty() const noexcept {
        return buf_[tail_ & MASK].seq.load(std::memory_order_acquire) != tail_ + 1;
    }
};`,
    explanation: "Vyukov's MPSC queue uses a sequence number in each slot to replace a CAS retry loop — each producer atomically increments the head counter (fetch_add), claiming a unique slot position, then spins briefly until the slot is freed by a previous consumer rotation; the consumer never needs atomics on its private tail counter, making the dequeue path entirely lock-free and wait-free in the common case.",
  },
  {
    id: "cpp-20260624-b1-variant-order",
    language: "cpp",
    title: "std::variant for discriminated union of order types without virtual dispatch",
    tag: "modern",
    code: `#include <variant>
#include <cstdint>
#include <string_view>
#include <iostream>

// Instead of a virtual base class with derived LimitOrder, MarketOrder, etc.,
// use std::variant — zero virtual dispatch overhead, inline storage, no heap.

struct LimitOrder {
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    char          side;
};

struct MarketOrder {
    std::uint64_t id;
    std::int32_t  qty;
    char          side;
};

struct StopOrder {
    std::uint64_t id;
    double        trigger_price;
    double        limit_price;   // 0 = stop-market, >0 = stop-limit
    std::int32_t  qty;
    char          side;
};

using AnyOrder = std::variant<LimitOrder, MarketOrder, StopOrder>;

// Visitor pattern via std::visit + overloaded lambdas (Overload trick)
template <typename... Ts>
struct Overload : Ts... { using Ts::operator()...; };
template <typename... Ts>
Overload(Ts...) -> Overload<Ts...>;

// Process any order type at compile time — no virtual dispatch
void processOrder(const AnyOrder& order) noexcept {
    std::visit(Overload{
        [](const LimitOrder& o) noexcept {
            // Book insertion at o.price
            (void)o;
        },
        [](const MarketOrder& o) noexcept {
            // Immediate match sweep
            (void)o;
        },
        [](const StopOrder& o) noexcept {
            // Monitor trigger; convert to limit/market when triggered
            (void)o;
        },
    }, order);
}

// Compile-time size check: variant is larger of all alternatives + discriminant
static_assert(sizeof(AnyOrder) >= sizeof(LimitOrder));

// Extract order id from any variant
std::uint64_t orderId(const AnyOrder& o) noexcept {
    return std::visit([](const auto& ord){ return ord.id; }, o);
}`,
    explanation: "std::variant stores the discriminant inline with the data — no heap allocation, no vtable pointer — and std::visit compiles to a jump table over the discriminant index, which the CPU's branch predictor can learn if one type dominates; the Overload trick (C++17 deduction guide + pack expansion) creates an overloaded function object from multiple lambdas in a single expression, cleaner than writing a full visitor struct.",
  },
  {
    id: "cpp-20260624-b1-mmap-ticks",
    language: "cpp",
    title: "Memory-mapped file for zero-copy historical tick playback",
    tag: "market-data",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstdint>
#include <cstddef>
#include <stdexcept>
#include <string>

// Memory-mapped tick file: map a binary tick file into virtual address space.
// Read-only mmap avoids copying data into user buffers — the kernel maps
// file pages on demand as they are accessed.

struct alignas(16) Tick {
    std::uint64_t ts_ns;       // nanoseconds since epoch
    double        price;
    std::int32_t  qty;
    std::uint32_t instr_id;
};
static_assert(sizeof(Tick) == 24 || sizeof(Tick) == 32, "check padding");

class MmapTickFile {
    int           fd_    = -1;
    void*         addr_  = MAP_FAILED;
    std::size_t   size_  = 0;

public:
    explicit MmapTickFile(const std::string& path) {
        fd_ = open(path.c_str(), O_RDONLY | O_CLOEXEC);
        if (fd_ < 0) throw std::runtime_error("open failed: " + path);

        struct stat sb{};
        if (fstat(fd_, &sb) < 0) throw std::runtime_error("fstat failed");
        size_ = static_cast<std::size_t>(sb.st_size);

        // MAP_POPULATE: prefault all pages at mmap time (useful for backtesting
        // where the entire file will be read sequentially anyway)
        addr_ = mmap(nullptr, size_, PROT_READ,
                     MAP_PRIVATE | MAP_POPULATE, fd_, 0);
        if (addr_ == MAP_FAILED) throw std::runtime_error("mmap failed");

        // Advise sequential access: kernel will read-ahead pages aggressively
        madvise(addr_, size_, MADV_SEQUENTIAL);
    }

    ~MmapTickFile() noexcept {
        if (addr_ != MAP_FAILED) munmap(addr_, size_);
        if (fd_ >= 0)            close(fd_);
    }

    MmapTickFile(const MmapTickFile&) = delete;
    MmapTickFile& operator=(const MmapTickFile&) = delete;

    const Tick* data() const noexcept { return static_cast<const Tick*>(addr_); }
    std::size_t count() const noexcept { return size_ / sizeof(Tick); }

    const Tick* begin() const noexcept { return data(); }
    const Tick* end()   const noexcept { return data() + count(); }
};`,
    explanation: "Memory-mapped files bypass the read() system call per chunk — the OS maps file pages directly into the process virtual address space, and the CPU's hardware prefetcher and OS read-ahead handle bringing pages into RAM; MADV_SEQUENTIAL informs the kernel to evict pages immediately after use, limiting RSS to a window around the current read position rather than mapping the entire file into physical RAM.",
  },
  {
    id: "cpp-20260624-b1-coroutine-feed",
    language: "cpp",
    title: "C++20 coroutine generator for lazy market-data replay",
    tag: "modern",
    code: `#include <coroutine>
#include <optional>
#include <cstdint>
#include <vector>

// C++20 coroutine-based generator: co_yield one tick at a time.
// The caller drives execution; the coroutine suspends between yields.
// Enables lazy, composable pipelines without explicit state machines.

struct Tick { std::uint64_t ts_ns; double price; std::int32_t qty; };

template <typename T>
struct Generator {
    struct promise_type {
        T current_value;

        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        Generator           get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        void return_void() noexcept {}
        void unhandled_exception() { std::terminate(); }
        std::suspend_always yield_value(T val) noexcept {
            current_value = std::move(val);
            return {};
        }
    };

    using Handle = std::coroutine_handle<promise_type>;
    Handle coro_;

    explicit Generator(Handle h) : coro_(h) {}
    ~Generator() noexcept { if (coro_) coro_.destroy(); }
    Generator(const Generator&) = delete;
    Generator(Generator&& o) noexcept : coro_(o.coro_) { o.coro_ = nullptr; }

    // Advance to next value
    std::optional<T> next() {
        if (!coro_ || coro_.done()) return std::nullopt;
        coro_.resume();
        if (coro_.done()) return std::nullopt;
        return coro_.promise().current_value;
    }
};

// Coroutine: filter ticks above a price threshold
Generator<Tick> filteredFeed(const std::vector<Tick>& ticks,
                               double min_price) {
    for (const auto& t : ticks) {
        if (t.price >= min_price)
            co_yield t;    // suspend here; resume on next next() call
    }
}

// Usage: auto feed = filteredFeed(raw_ticks, 100.0);
//        while (auto tick = feed.next()) { process(*tick); }`,
    explanation: "A coroutine generator allows writing a data pipeline as straight-line code with co_yield — the compiler transforms it into a state machine that suspends at each yield point, making the caller's loop look simple while the producer's logic stays readable; unlike callbacks or explicit iterators, the coroutine preserves its local variables across suspensions, enabling filter pipelines that accumulate state (e.g. running aggregators) without extra struct definitions.",
  },
  {
    id: "cpp-20260624-b1-move-semantics",
    language: "cpp",
    title: "Move semantics for zero-copy order queue transfer between engines",
    tag: "modern",
    code: `#include <vector>
#include <cstdint>
#include <utility>
#include <memory>

// Demonstrating move semantics: transferring ownership without copying data.
// Crucial for passing large order batches between components on the critical path.

struct OrderBatch {
    std::vector<std::uint64_t> ids;
    std::vector<double>        prices;
    std::vector<std::int32_t>  qtys;
    std::uint64_t              seq_start = 0;

    // Default: copy constructs by duplicating all vectors (O(N))
    OrderBatch() = default;

    // Move constructor: steals the vectors (O(1))
    OrderBatch(OrderBatch&& o) noexcept
        : ids(std::move(o.ids)), prices(std::move(o.prices)),
          qtys(std::move(o.qtys)), seq_start(o.seq_start)
    {
        o.seq_start = 0;
    }

    OrderBatch& operator=(OrderBatch&& o) noexcept {
        if (this != &o) {
            ids       = std::move(o.ids);
            prices    = std::move(o.prices);
            qtys      = std::move(o.qtys);
            seq_start = o.seq_start;
            o.seq_start = 0;
        }
        return *this;
    }

    // Explicitly deleted copy to prevent accidental copies
    OrderBatch(const OrderBatch&) = delete;
    OrderBatch& operator=(const OrderBatch&) = delete;

    void push(std::uint64_t id, double price, std::int32_t qty) {
        ids.push_back(id);
        prices.push_back(price);
        qtys.push_back(qty);
    }

    std::size_t size() const noexcept { return ids.size(); }
};

// Passing batch to a downstream processor — move avoids copying
class RiskEngine {
public:
    void receive(OrderBatch&& batch) noexcept {
        // batch's data is now ours; caller's batch is empty
        pending_ = std::move(batch);
    }
private:
    OrderBatch pending_;
};

// Named Return Value Optimisation (NRVO): return by value — compiler elides copy
OrderBatch buildBatch(const std::vector<std::uint64_t>& raw_ids) {
    OrderBatch b;
    for (auto id : raw_ids) b.push(id, 100.0, 100);
    return b;   // NRVO: constructed directly in caller's frame
}`,
    explanation: "Move semantics transfer the internal heap buffer's ownership (pointer + size + capacity) in O(1) regardless of the number of elements — the moved-from vector is left empty, not invalid; deleting the copy constructor forces callers to be explicit about copies (they must call a named clone() method), preventing accidental O(N) copies in performance-critical paths hidden inside function call signatures.",
  },
  {
    id: "cpp-20260624-b1-string-view-parse",
    language: "cpp",
    title: "std::string_view for zero-copy CSV market-data parsing",
    tag: "market-data",
    code: `#include <string_view>
#include <charconv>
#include <cstdint>
#include <cstring>
#include <array>

// CSV line: "timestamp_ns,instrument,side,qty,price\\n"
// Parse without any heap allocation using string_view to slice the buffer.

struct CsvTick {
    std::uint64_t ts_ns;
    char          instr[9];
    char          side;
    std::int32_t  qty;
    double        price;
    bool          valid = false;
};

// Split a string_view by delimiter, yields subviews of the original buffer.
struct SplitIterator {
    std::string_view remaining;
    char             delim;

    std::string_view next() noexcept {
        auto pos = remaining.find(delim);
        std::string_view field = (pos != std::string_view::npos)
                                 ? remaining.substr(0, pos)
                                 : remaining;
        remaining = (pos != std::string_view::npos)
                    ? remaining.substr(pos + 1)
                    : std::string_view{};
        return field;
    }

    bool done() const noexcept { return remaining.empty(); }
};

CsvTick parseCsvTick(std::string_view line) noexcept {
    // Strip trailing newline
    while (!line.empty() && (line.back() == '\\n' || line.back() == '\\r'))
        line.remove_suffix(1);

    SplitIterator it{line, ','};
    CsvTick t{};

    // Timestamp
    auto ts_sv = it.next();
    if (std::from_chars(ts_sv.data(), ts_sv.data() + ts_sv.size(), t.ts_ns).ec
            != std::errc{}) return t;

    // Instrument (up to 8 chars)
    auto instr = it.next();
    std::size_t len = std::min(instr.size(), std::size_t{8});
    std::memcpy(t.instr, instr.data(), len);
    t.instr[len] = '\\0';

    // Side
    auto side = it.next();
    if (side.empty()) return t;
    t.side = side[0];

    // Qty
    auto qty_sv = it.next();
    if (std::from_chars(qty_sv.data(), qty_sv.data() + qty_sv.size(), t.qty).ec
            != std::errc{}) return t;

    // Price
    auto px_sv = it.next();
    if (std::from_chars(px_sv.data(), px_sv.data() + px_sv.size(), t.price).ec
            != std::errc{}) return t;

    t.valid = true;
    return t;
}`,
    explanation: "std::string_view is a non-owning reference to a character buffer — SplitIterator slices the original line into field views without any copies, and std::from_chars parses integers and doubles directly from the view's data pointer without null-termination (unlike atof/strtod); for a feed processing 1 million ticks per second, avoiding malloc/free per tick can reduce memory bandwidth by 40-50%.",
  },
  {
    id: "cpp-20260624-b1-spinlock",
    language: "cpp",
    title: "Spin lock with exponential backoff for low-contention order state",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <thread>

// Spinlock: busy-wait for short critical sections (< 1 µs).
// Mutex requires a syscall (~1 µs) which is unacceptable in HFT.
// Exponential backoff: prevents cache-line thrashing when contention is high.

class Spinlock {
    std::atomic_flag flag_ = ATOMIC_FLAG_INIT;

public:
    void lock() noexcept {
        for (int spin = 0; flag_.test_and_set(std::memory_order_acquire); ) {
            // Spin with backoff
            if (spin < 16) {
                // PAUSE instruction: hints to CPU that we're in a spin-wait loop.
                // Reduces memory order machine clears. On ARM: YIELD.
                for (int i = 0; i < (1 << spin); ++i)
                    __builtin_ia32_pause();
            } else {
                // Too long: yield to OS scheduler to reduce power consumption
                std::this_thread::yield();
                spin = 0;
            }
            ++spin;
        }
    }

    void unlock() noexcept {
        flag_.clear(std::memory_order_release);
    }

    // RAII guard
    struct Guard {
        Spinlock& lock_;
        explicit Guard(Spinlock& l) noexcept : lock_(l) { lock_.lock(); }
        ~Guard() noexcept { lock_.unlock(); }
    };
};

// Ticket spinlock: fair ordering (FIFO) — prevents starvation
struct TicketSpinlock {
    std::atomic<std::uint32_t> now_serving{0};
    std::atomic<std::uint32_t> next_ticket{0};

    std::uint32_t lock() noexcept {
        std::uint32_t ticket = next_ticket.fetch_add(1, std::memory_order_relaxed);
        while (now_serving.load(std::memory_order_acquire) != ticket)
            __builtin_ia32_pause();
        return ticket;
    }

    void unlock() noexcept {
        now_serving.fetch_add(1, std::memory_order_release);
    }
};`,
    explanation: "The x86 PAUSE instruction is critical in spin loops — without it, the out-of-order speculative execution creates memory order machine clears when the lock owner updates the flag, adding 100-200 cycle penalties per thread waiting; exponential backoff prevents the thundering herd problem when many threads release the lock simultaneously, reducing the peak inter-core traffic from O(N) to O(log N) where N is the number of waiting threads.",
  },
];
