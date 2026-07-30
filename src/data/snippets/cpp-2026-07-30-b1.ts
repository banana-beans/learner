import type { Snippet } from "./types";

export const cppSnippets20260730B1: Snippet[] = [
  {
    id: "cpp-20260730-b1-sfinae-enable-if",
    language: "cpp",
    title: "SFINAE with std::enable_if for constrained templates",
    tag: "SFINAE",
    code: `#include <type_traits>
#include <cstdio>

// SFINAE (Substitution Failure Is Not An Error): if the enable_if condition
// is false, the specialisation is silently removed from the overload set
// rather than producing a compile error.

// Enable only for floating-point types
template<typename T>
std::enable_if_t<std::is_floating_point_v<T>, T>
price_pnl(T entry, T exit_, T qty) {
    return (exit_ - entry) * qty;
}

// Enable only for integral types (lot counts)
template<typename T>
std::enable_if_t<std::is_integral_v<T>, double>
price_pnl(T entry, T exit_, T qty) {
    return static_cast<double>(exit_ - entry) * qty;
}

// SFINAE via trailing return type — detect if T has a .tick_size() member
template<typename T>
auto tick_size(const T& t) -> decltype(t.tick_size(), double{}) {
    return t.tick_size();
}

struct Instrument { double tick_size() const { return 0.01; } };

int main() {
    printf("%.2f\\n", price_pnl(100.0, 101.5, 200.0)); // floating-point overload
    printf("%.2f\\n", price_pnl(1000, 1015, 200));      // integral overload
    Instrument inst;
    printf("tick=%.3f\\n", tick_size(inst));
}`,
    explanation: "SFINAE lets the compiler silently discard template specialisations that would be ill-formed for a given type, enabling function overloading on type properties without runtime dispatch; the pattern is superseded by Concepts in C++20 but remains ubiquitous in pre-C++20 codebases.",
  },
  {
    id: "cpp-20260730-b1-concepts",
    language: "cpp",
    title: "C++20 Concepts for order and instrument constraints",
    tag: "concepts",
    code: `#include <concepts>
#include <type_traits>
#include <cstdio>

// Concept: must have .price() -> double and .qty() -> int
template<typename T>
concept OrderLike = requires(const T& o) {
    { o.price() } -> std::convertible_to<double>;
    { o.qty()   } -> std::convertible_to<int>;
};

// Concept: numeric type usable as a price
template<typename T>
concept PriceType = std::is_arithmetic_v<T>;

// Constrained function — cleaner than enable_if
template<OrderLike O>
double notional(const O& order) {
    return order.price() * order.qty();
}

// Requires clause on function template
template<PriceType T>
T round_to_tick(T price, T tick) {
    return static_cast<T>(static_cast<long long>(price / tick + 0.5) * tick);
}

// Abbreviated function template syntax (C++20)
double mid_price(OrderLike auto& bid, OrderLike auto& ask) {
    return (bid.price() + ask.price()) / 2.0;
}

struct LimitOrder {
    double price() const { return px_; }
    int    qty()   const { return qty_; }
    double px_; int qty_;
};

int main() {
    LimitOrder bid{100.50, 200}, ask{100.55, 300};
    printf("notional=%.2f\\n", notional(bid));
    printf("mid=%.4f\\n", mid_price(bid, ask));
    printf("rounded=%.2f\\n", round_to_tick(100.543, 0.01));
}`,
    explanation: "C++20 Concepts replace SFINAE with readable named constraints: the compiler emits a clear error message saying which concept was not satisfied rather than a cascade of substitution failures; the abbreviated syntax (auto& parameter with concept prefix) makes constrained templates look like regular functions.",
  },
  {
    id: "cpp-20260730-b1-perfect-forwarding",
    language: "cpp",
    title: "Perfect forwarding with std::forward in order factory",
    tag: "modern-cpp",
    code: `#include <utility>
#include <memory>
#include <string>
#include <cstdio>

// Universal reference (T&&) deduces to T& for lvalues and T&& for rvalues.
// std::forward preserves that category — essential for zero-copy construction.

struct Order {
    std::string symbol;
    double      price;
    int         qty;
    Order(std::string sym, double p, int q)
        : symbol(std::move(sym)), price(p), qty(q) {}
    Order(const Order&)            = delete;
    Order& operator=(const Order&) = delete;
    Order(Order&&)                 = default;
};

// Factory that perfectly forwards constructor arguments — avoids a copy
// when the caller passes temporaries.
template<typename... Args>
std::unique_ptr<Order> make_order(Args&&... args) {
    return std::make_unique<Order>(std::forward<Args>(args)...);
}

// Wrapper that forwards a callable's return value without copying
template<typename F, typename... Args>
decltype(auto) timed_call(F&& f, Args&&... args) {
    return std::forward<F>(f)(std::forward<Args>(args)...);
}

double compute_pnl(double entry, double exit_) { return exit_ - entry; }

int main() {
    std::string sym = "AAPL";
    auto o1 = make_order(sym, 150.0, 100);        // lvalue: copied internally
    auto o2 = make_order(std::move(sym), 150.0, 100); // rvalue: moved
    printf("%s %.2f x%d\\n", o1->symbol.c_str(), o1->price, o1->qty);

    auto pnl = timed_call(compute_pnl, 100.0, 101.5);
    printf("pnl=%.2f\\n", pnl);
}`,
    explanation: "Without std::forward, a function with a universal reference parameter would always pass its argument as an lvalue to downstream calls, triggering unnecessary copies; forward preserves the rvalue-ness of temporaries so they are moved rather than copied through the call chain — critical in order factories that construct heavy objects like market data messages.",
  },
  {
    id: "cpp-20260730-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-size pool allocator for order nodes",
    tag: "allocators",
    code: `#include <cstddef>
#include <cassert>
#include <cstdio>

// Pool allocator: pre-allocates a slab of N fixed-size blocks.
// Allocation = pop from free list = O(1) with no heap fragmentation.
// Critical for HFT order nodes where new/delete latency is unacceptable.

template<typename T, std::size_t N>
class PoolAllocator {
    union Block {
        alignas(T) char storage[sizeof(T)];
        Block* next;
    };

    Block   pool_[N];
    Block*  free_head_;
    int     in_use_{0};

public:
    PoolAllocator() {
        // Build free list
        for (std::size_t i = 0; i < N - 1; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[N-1].next = nullptr;
        free_head_ = &pool_[0];
    }

    T* allocate() {
        assert(free_head_ && "pool exhausted");
        Block* b = free_head_;
        free_head_ = b->next;
        ++in_use_;
        return reinterpret_cast<T*>(b->storage);
    }

    void deallocate(T* ptr) {
        Block* b = reinterpret_cast<Block*>(ptr);
        b->next  = free_head_;
        free_head_ = b;
        --in_use_;
    }

    int in_use() const { return in_use_; }
};

struct OrderNode {
    uint64_t id;
    double   price;
    int      qty;
};

int main() {
    PoolAllocator<OrderNode, 1024> pool;
    auto* o1 = pool.allocate();
    *o1 = {1, 100.50, 200};
    auto* o2 = pool.allocate();
    *o2 = {2, 100.55, 100};
    printf("in_use=%d  o1=%.2f\\n", pool.in_use(), o1->price);
    pool.deallocate(o1);
    printf("in_use=%d\\n", pool.in_use());
}`,
    explanation: "A pool allocator eliminates per-allocation heap overhead by maintaining a pre-built free list of same-sized blocks; the union trick shares storage between the T payload and the free-list pointer with zero extra bytes, and because all blocks are the same size, there is no fragmentation even after millions of alloc/free cycles.",
  },
  {
    id: "cpp-20260730-b1-pmr-arena",
    language: "cpp",
    title: "std::pmr::monotonic_buffer_resource for arena allocation",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <array>
#include <cstdio>

// PMR (C++17): polymorphic allocators share an interface so containers
// can use a custom memory resource without being parameterised on it.
// monotonic_buffer_resource: bump-pointer allocator — O(1) alloc, free does nothing.
// Ideal for transient per-message allocation that is freed in bulk.

void process_message(std::byte* arena, std::size_t arena_sz) {
    std::pmr::monotonic_buffer_resource mbr{arena, arena_sz,
                                             std::pmr::null_memory_resource()};
    // Containers use the arena — no heap allocation
    std::pmr::vector<double> prices{&mbr};
    std::pmr::vector<int>    qtys{&mbr};

    prices.reserve(8);
    qtys.reserve(8);

    for (int i = 0; i < 5; ++i) {
        prices.push_back(100.0 + i * 0.01);
        qtys.push_back(100 * (i + 1));
    }

    double vwap = 0, total_qty = 0;
    for (std::size_t i = 0; i < prices.size(); ++i) {
        vwap      += prices[i] * qtys[i];
        total_qty += qtys[i];
    }
    printf("VWAP=%.4f\\n", vwap / total_qty);
    // Arena freed in bulk when mbr goes out of scope — O(1)
}

int main() {
    alignas(std::max_align_t) std::array<std::byte, 4096> arena{};
    process_message(arena.data(), arena.size());
}`,
    explanation: "A monotonic_buffer_resource uses a fixed slab of memory and bumps a pointer for each allocation, making alloc O(1) with zero synchronisation; all memory is reclaimed at once when the resource is destroyed, which is ideal for request-scoped allocations in a market-data handler where the message's lifetime is well-bounded.",
  },
  {
    id: "cpp-20260730-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list for order queue",
    tag: "custom-containers",
    code: `#include <cstddef>
#include <cstdio>
#include <cassert>

// Intrusive list: list pointers embedded in the node itself.
// Zero allocation overhead — the node IS the element.
// Used in kernel schedulers and HFT order books.

struct ListHook {
    ListHook* prev{nullptr};
    ListHook* next{nullptr};
};

// Intrusive doubly-linked list — O(1) insert/remove given the node.
class IntrusiveList {
    ListHook sentinel_;   // circular: sentinel.next = head, sentinel.prev = tail
public:
    IntrusiveList() { sentinel_.prev = sentinel_.next = &sentinel_; }

    void push_back(ListHook* node) {
        node->prev = sentinel_.prev;
        node->next = &sentinel_;
        sentinel_.prev->next = node;
        sentinel_.prev = node;
    }

    void remove(ListHook* node) {
        node->prev->next = node->next;
        node->next->prev = node->prev;
        node->prev = node->next = nullptr;
    }

    bool empty() const { return sentinel_.next == &sentinel_; }

    ListHook* front() {
        assert(!empty());
        return sentinel_.next;
    }
};

struct Order {
    ListHook hook;   // embedded — no separate node allocation
    uint64_t id;
    double   price;
    int      qty;
};

// Recover the containing Order from a ListHook pointer
inline Order* hook_to_order(ListHook* h) {
    return reinterpret_cast<Order*>(
        reinterpret_cast<char*>(h) - offsetof(Order, hook));
}

int main() {
    Order o1{{}, 1, 100.50, 200};
    Order o2{{}, 2, 100.51, 100};

    IntrusiveList queue;
    queue.push_back(&o1.hook);
    queue.push_back(&o2.hook);

    while (!queue.empty()) {
        Order* o = hook_to_order(queue.front());
        queue.remove(queue.front());
        printf("Order %llu price=%.2f qty=%d\\n", o->id, o->price, o->qty);
    }
}`,
    explanation: "An intrusive list embeds the list pointers inside the element struct itself, eliminating the separate heap allocation that std::list requires per node; given a pointer to the node, removal is O(1) unconditionally — critical for cancel-by-pointer in an HFT order book where the order management system holds raw pointers to resting orders.",
  },
  {
    id: "cpp-20260730-b1-crtp-strategy",
    language: "cpp",
    title: "CRTP for zero-overhead static execution strategy",
    tag: "SFINAE",
    code: `#include <cstdio>
#include <cstdint>

// CRTP (Curiously Recurring Template Pattern): base class calls derived's
// override at compile time via static_cast — no vtable, no virtual call overhead.

template<typename Derived>
struct ExecutionAlgo {
    void on_tick(double bid, double ask, int target_qty) {
        static_cast<Derived*>(this)->do_on_tick(bid, ask, target_qty);
    }
    void send_order(double price, int qty, const char* side) {
        printf("SEND %s %.4f x%d\\n", side, price, qty);
    }
};

struct TWAPAlgo : ExecutionAlgo<TWAPAlgo> {
    int slices_;
    double slice_qty_;
    TWAPAlgo(int slices, double total_qty)
        : slices_(slices), slice_qty_(total_qty / slices) {}

    void do_on_tick(double bid, double ask, int /*target*/) {
        if (slices_-- > 0)
            send_order((bid + ask) / 2.0, static_cast<int>(slice_qty_), "BUY");
    }
};

struct PegAlgo : ExecutionAlgo<PegAlgo> {
    void do_on_tick(double bid, double ask, int qty) {
        // Peg to best bid
        send_order(bid, qty, "BUY");
    }
};

// Function template works on any algo without a virtual call
template<typename Algo>
void run_algo(Algo& algo, double bid, double ask, int qty) {
    algo.on_tick(bid, ask, qty);
}

int main() {
    TWAPAlgo twap{3, 300};
    PegAlgo  peg;

    for (int i = 0; i < 3; ++i)
        run_algo(twap, 100.50 + i*0.01, 100.51 + i*0.01, 100);

    run_algo(peg, 100.55, 100.56, 200);
}`,
    explanation: "CRTP inlines the derived class's override at compile time by casting `this` to the concrete type, producing the same dispatch as a virtual call but with zero vtable lookup overhead; unlike type erasure (std::function), it preserves inlining opportunities so the compiler can vectorise the hot path across tick updates.",
  },
  {
    id: "cpp-20260730-b1-chrono-latency",
    language: "cpp",
    title: "std::chrono high-resolution latency profiling",
    tag: "low-latency",
    code: `#include <chrono>
#include <cstdint>
#include <cstdio>
#include <array>
#include <algorithm>
#include <numeric>

using Clock = std::chrono::steady_clock;
using Ns    = std::chrono::nanoseconds;

// Percentile latency histogram for a code region
struct LatencyHistogram {
    static constexpr int SAMPLES = 1024;
    std::array<int64_t, SAMPLES> samples_{};
    int count_{0};

    void record(Ns elapsed) {
        if (count_ < SAMPLES)
            samples_[count_++] = elapsed.count();
    }

    void report() const {
        if (count_ == 0) return;
        auto s = samples_;
        std::sort(s.begin(), s.begin() + count_);
        auto n = count_;
        printf("p50=%lld ns  p99=%lld ns  p99.9=%lld ns  max=%lld ns\\n",
               s[n/2], s[n*99/100],
               s[static_cast<int>(n*0.999)],
               s[n-1]);
    }
};

// RAII scope timer
struct ScopeTimer {
    Clock::time_point start = Clock::now();
    LatencyHistogram& hist;
    explicit ScopeTimer(LatencyHistogram& h) : hist(h) {}
    ~ScopeTimer() {
        hist.record(std::chrono::duration_cast<Ns>(Clock::now() - start));
    }
};

volatile double sink = 0; // prevent optimisation of work loop

void work() {
    double sum = 0;
    for (int i = 0; i < 1000; ++i) sum += i * 0.001;
    sink = sum;
}

int main() {
    LatencyHistogram hist;
    for (int i = 0; i < 512; ++i) {
        ScopeTimer t{hist};
        work();
    }
    hist.report();
}`,
    explanation: "std::chrono::steady_clock is monotonic and immune to NTP adjustments, making it the correct choice for latency measurement; percentile reporting (p50/p99/p99.9) is more informative than mean latency because HFT systems are tail-latency sensitive — a 5 μs mean with 200 μs p99.9 indicates occasional scheduler jitter that must be investigated.",
  },
  {
    id: "cpp-20260730-b1-builtin-expect",
    language: "cpp",
    title: "__builtin_expect for hot/cold branch prediction hints",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstdio>
#include <atomic>

// __builtin_expect(expr, expected_val): tells the compiler that expr is
// likely/unlikely to equal expected_val. The compiler arranges the machine
// code so the predicted branch falls through — no jump = no branch penalty.

#define LIKELY(x)   __builtin_expect(!!(x), 1)
#define UNLIKELY(x) __builtin_expect(!!(x), 0)

struct OrderMsg { uint8_t type; uint32_t qty; double price; };

// Hot path: most messages are valid; errors are rare
void process(const OrderMsg& msg) {
    if (UNLIKELY(msg.qty == 0)) {
        printf("REJECT: zero qty\\n");
        return;
    }
    if (UNLIKELY(msg.price <= 0)) {
        printf("REJECT: bad price\\n");
        return;
    }
    // LIKELY: almost always a LIMIT order
    if (LIKELY(msg.type == 'L')) {
        // hot path — limit order processing
        printf("LIMIT %.4f x%u\\n", msg.price, msg.qty);
    } else {
        printf("OTHER type=%c\\n", msg.type);
    }
}

// Lock-free counter: increment is the common case, wrap is rare
void counter_increment(std::atomic<uint64_t>& ctr) {
    auto val = ctr.load(std::memory_order_relaxed);
    if (UNLIKELY(val == UINT64_MAX)) {
        ctr.store(0, std::memory_order_relaxed);
    } else {
        ctr.fetch_add(1, std::memory_order_relaxed);
    }
}

int main() {
    OrderMsg msgs[] = {
        {'L', 100, 100.50},
        {'L',   0, 100.50},  // rejected
        {'M', 200,  -1.0 },  // rejected
    };
    for (auto& m : msgs) process(m);
}`,
    explanation: "__builtin_expect moves cold branches (error paths) out of the instruction cache's prefetch stream so the processor's branch predictor never needs to recover from a misprediction on the hot path; on x86-64 the assembler uses a forward conditional jump for the unlikely case, which the CPU's static predictor defaults to 'not taken'.",
  },
  {
    id: "cpp-20260730-b1-sse2-dot",
    language: "cpp",
    title: "SSE2 vectorized dot product for portfolio Greeks",
    tag: "low-latency",
    code: `#include <immintrin.h>
#include <cstddef>
#include <cstdio>
#include <cassert>

// SSE2: process 2 doubles per instruction (128-bit register).
// AVX2 would do 4; AVX-512 does 8. This is the minimum SIMD baseline.

// Scalar reference
double dot_scalar(const double* a, const double* b, std::size_t n) {
    double s = 0;
    for (std::size_t i = 0; i < n; ++i) s += a[i] * b[i];
    return s;
}

// SSE2 vectorized: process 2 doubles at a time
double dot_sse2(const double* a, const double* b, std::size_t n) {
    __m128d acc = _mm_setzero_pd();
    std::size_t i = 0;
    for (; i + 2 <= n; i += 2) {
        __m128d va = _mm_loadu_pd(a + i);   // load 2 doubles unaligned
        __m128d vb = _mm_loadu_pd(b + i);
        acc = _mm_add_pd(acc, _mm_mul_pd(va, vb));  // acc += a * b
    }
    // Horizontal sum: add high lane to low lane
    __m128d hi  = _mm_unpackhi_pd(acc, acc);
    double  sum = _mm_cvtsd_f64(_mm_add_pd(acc, hi));
    // Handle tail (n not multiple of 2)
    for (; i < n; ++i) sum += a[i] * b[i];
    return sum;
}

int main() {
    // Portfolio: delta[i] * position[i] = total delta
    double deltas[8]    = {0.5, 0.3, -0.2, 0.8, 0.1, -0.4, 0.6, 0.9};
    double positions[8] = {100,  50,  200,  75,  300, 120,  80, 250};

    double scalar = dot_scalar(deltas, positions, 8);
    double simd   = dot_sse2  (deltas, positions, 8);
    printf("Scalar total delta: %.2f\\n", scalar);
    printf("SIMD   total delta: %.2f\\n", simd);
    printf("Match: %s\\n", (scalar - simd < 1e-9) ? "yes" : "no");
}`,
    explanation: "SSE2 processes two double-precision values per instruction using 128-bit xmm registers, giving roughly 2x throughput over scalar code for aligned arrays; the horizontal sum requires an unpack-and-add step since SSE2 lacks a dedicated hadd instruction (added in SSE3), and the tail loop handles odd-length arrays cleanly.",
  },
  {
    id: "cpp-20260730-b1-fix-parser",
    language: "cpp",
    title: "FIX protocol tag=value message parser",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <cstdio>
#include <charconv>
#include <array>
#include <string_view>

// FIX 4.x message format: tag=value|tag=value|...
// SOH (\\x01) is the field delimiter.
// We parse into a flat tag->value map using string_views for zero-copy.

struct FIXField {
    int  tag;
    std::string_view value;
};

constexpr int MAX_FIELDS = 64;

struct FIXMessage {
    std::array<FIXField, MAX_FIELDS> fields;
    int count{0};

    std::string_view get(int tag) const {
        for (int i = 0; i < count; ++i)
            if (fields[i].tag == tag) return fields[i].value;
        return {};
    }
};

// Parse in-place: the buffer must outlive the FIXMessage
FIXMessage parse_fix(char* buf, std::size_t len) {
    FIXMessage msg;
    char* p = buf;
    char* end = buf + len;
    while (p < end && msg.count < MAX_FIELDS) {
        // Find '='
        char* eq = static_cast<char*>(std::memchr(p, '=', end - p));
        if (!eq) break;
        // Parse tag
        int tag = 0;
        std::from_chars(p, eq, tag);
        // Find SOH or end
        char* soh = static_cast<char*>(std::memchr(eq + 1, '\x01', end - eq - 1));
        char* val_end = soh ? soh : end;
        msg.fields[msg.count++] = {tag, {eq + 1, static_cast<std::size_t>(val_end - eq - 1)}};
        p = soh ? soh + 1 : end;
    }
    return msg;
}

int main() {
    // FIX NewOrderSingle (type 'D'), SOH = \\x01
    char msg[] = "8=FIX.4.2\x01" "35=D\x01" "49=CLIENT1\x01"
                 "56=BROKER\x01" "11=ORD001\x01" "55=AAPL\x01"
                 "54=1\x01" "38=100\x01" "44=150.50\x01" "40=2\x01";
    FIXMessage fix = parse_fix(msg, sizeof(msg) - 1);
    printf("MsgType=%.*s\\n", (int)fix.get(35).size(), fix.get(35).data());
    printf("Symbol=%.*s\\n",  (int)fix.get(55).size(), fix.get(55).data());
    printf("Price=%.*s\\n",   (int)fix.get(44).size(), fix.get(44).data());
    printf("Qty=%.*s\\n",     (int)fix.get(38).size(), fix.get(38).data());
}`,
    explanation: "Parsing FIX with string_view over the original buffer avoids any allocation — each field is a (tag, view) pair pointing into the receive buffer; std::from_chars parses the integer tag without locale overhead and std::memchr finds the delimiter in a single machine word at a time, making this suitable for 10M+ messages/second throughput.",
  },
  {
    id: "cpp-20260730-b1-spsc-queue",
    language: "cpp",
    title: "Lamport SPSC lock-free queue for tick feed pipeline",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>
#include <cstdio>

// Lamport (1983) single-producer / single-consumer ring buffer.
// No CAS required: only head is written by consumer, only tail by producer.
// head and tail are atomic to ensure visibility, relaxed stores suffice
// with appropriate acquire/release on the critical loads.

template<typename T, std::size_t N>
class SPSCQueue {
    static_assert((N & (N-1)) == 0, "N must be power of two");
    std::array<T, N>         buf_{};
    alignas(64) std::atomic<std::size_t> tail_{0}; // written by producer only
    alignas(64) std::atomic<std::size_t> head_{0}; // written by consumer only

public:
    bool push(const T& val) {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        std::size_t h = head_.load(std::memory_order_acquire);
        if (t - h >= N) return false;  // full
        buf_[t & (N-1)] = val;
        tail_.store(t + 1, std::memory_order_release);
        return true;
    }

    std::optional<T> pop() {
        std::size_t h = head_.load(std::memory_order_relaxed);
        std::size_t t = tail_.load(std::memory_order_acquire);
        if (h == t) return std::nullopt;  // empty
        T val = buf_[h & (N-1)];
        head_.store(h + 1, std::memory_order_release);
        return val;
    }

    std::size_t size() const {
        return tail_.load(std::memory_order_acquire)
             - head_.load(std::memory_order_acquire);
    }
};

struct Tick { int seq; double mid; };

int main() {
    SPSCQueue<Tick, 256> q;
    for (int i = 0; i < 5; ++i)
        q.push({i, 100.0 + i * 0.01});
    printf("size=%zu\\n", q.size());
    while (auto t = q.pop())
        printf("seq=%d mid=%.2f\\n", t->seq, t->mid);
}`,
    explanation: "The Lamport SPSC queue requires only two atomic variables and no CAS loops: the producer reads head with acquire (to see the consumer's progress) and writes tail with release (to publish data); on x86-64, release/acquire translate to plain stores and loads with no explicit fence, making this one of the cheapest inter-thread communication mechanisms available.",
  },
  {
    id: "cpp-20260730-b1-token-bucket",
    language: "cpp",
    title: "Token bucket rate limiter for order submission",
    tag: "design",
    code: `#include <chrono>
#include <cstdio>
#include <algorithm>

using Clock = std::chrono::steady_clock;
using Dur   = std::chrono::duration<double>;

// Token bucket: tokens replenish at rate tokens_per_sec.
// A request costs 'cost' tokens; if insufficient tokens, reject or block.
// Used to enforce exchange-mandated order rate limits (e.g. 500 orders/sec).

class TokenBucket {
    double tokens_;
    double max_tokens_;
    double rate_;          // tokens / second
    Clock::time_point last_refill_;

    void refill() {
        auto now  = Clock::now();
        double dt = Dur(now - last_refill_).count();
        tokens_   = std::min(max_tokens_, tokens_ + rate_ * dt);
        last_refill_ = now;
    }

public:
    TokenBucket(double rate, double burst)
        : tokens_(burst), max_tokens_(burst),
          rate_(rate), last_refill_(Clock::now()) {}

    bool try_consume(double cost = 1.0) {
        refill();
        if (tokens_ < cost) return false;  // reject
        tokens_ -= cost;
        return true;
    }

    double available_tokens() {
        refill();
        return tokens_;
    }
};

int main() {
    TokenBucket tb{100.0, 200.0};  // 100 orders/sec, burst=200

    int accepted = 0, rejected = 0;
    for (int i = 0; i < 250; ++i) {
        if (tb.try_consume()) ++accepted;
        else                  ++rejected;
    }
    printf("accepted=%d  rejected=%d  remaining=%.1f\\n",
           accepted, rejected, tb.available_tokens());
}`,
    explanation: "A token bucket allows short bursts (up to max_tokens) while enforcing a sustained rate (rate_), which matches how most exchanges set order throttle limits; the lazy refill pattern avoids a background thread by computing elapsed time only when a request arrives, giving O(1) consume operations with no synchronisation in the single-threaded case.",
  },
  {
    id: "cpp-20260730-b1-hull-white-zcb",
    language: "cpp",
    title: "Hull-White one-factor closed-form bond price",
    tag: "numerics",
    code: `#include <cmath>
#include <cstdio>
#include <vector>

// Hull-White (1990): dr = (theta(t) - a*r)*dt + sigma*dW
// Calibrated to the initial term structure; theta(t) matches market forward rates.
// Closed-form ZCB: P(0,T) = exp(A(T) - B(T)*r0)

double hw_B(double a, double T) {
    return (1.0 - std::exp(-a * T)) / a;
}

// A(T) requires the initial forward rate term structure f(0,t)
// For a flat yield curve r_flat: f(0,t) = r_flat for all t
double hw_A_flat(double a, double sigma, double r_flat, double T) {
    double B = hw_B(a, T);
    // Integral of B(s)^2 ds from 0 to T
    double int_B2 = (2*a*T - 3 + 4*std::exp(-a*T) - std::exp(-2*a*T)) / (2*a*a*a);
    return (B - T) * (r_flat - sigma*sigma / (2*a*a))
           - sigma*sigma * B*B / 4 / a;
    // Note: simplified formula valid for flat initial term structure
}

double hw_zcb(double r0, double a, double sigma, double r_flat, double T) {
    double B = hw_B(a, T);
    double A = hw_A_flat(a, sigma, r_flat, T);
    return std::exp(A - B * r0);
}

// Simulate Hull-White path (Euler-Maruyama)
double hw_simulate_terminal(double r0, double a, double sigma,
                             double theta, double T,
                             int n_steps = 1000) {
    double dt = T / n_steps;
    double r  = r0;
    for (int i = 0; i < n_steps; ++i) {
        r += (theta - a * r) * dt + sigma * std::sqrt(dt) * 0.0; // demo: no noise
    }
    return r;
}

int main() {
    double a = 0.1, sigma = 0.01, r0 = 0.03, r_flat = 0.03;
    printf("Hull-White ZCB prices (flat curve):\\n");
    for (double T : {1.0, 2.0, 5.0, 10.0}) {
        double p = hw_zcb(r0, a, sigma, r_flat, T);
        printf("  P(0,%.0f) = %.6f  (impl yield=%.4f)\\n",
               T, p, -std::log(p)/T);
    }
}`,
    explanation: "The Hull-White model adds mean-reversion to the Vasicek model and is calibrated to the initial yield curve via theta(t), ensuring no static arbitrage with observed bond prices; the closed-form bond price exponential-affine formula avoids simulation for vanilla discount factors, and calibrated theta is backed out from the market forward rate curve analytically.",
  },
  {
    id: "cpp-20260730-b1-variance-swap",
    language: "cpp",
    title: "Variance swap fair strike via log-contract replication",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <functional>
#include <cstdio>
#include <numeric>

// Variance swap fair strike: E[integral sigma^2 dt] = K_var
// Under replication: K_var = 2/T * integral_{0}^{inf} (C(K)/K^2 dK for K>F
//                                                     + P(K)/K^2 dK for K<F)
// Numerically: sum over strike grid.

double bs_call(double F, double K, double T, double sigma) {
    if (K <= 0 || sigma <= 0 || T <= 0) return std::max(F - K, 0.0);
    double d1 = (std::log(F/K) + 0.5*sigma*sigma*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma*std::sqrt(T);
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    return F*N(d1) - K*N(d2);
}

double bs_put(double F, double K, double T, double sigma) {
    return bs_call(F, K, T, sigma) - F + K;  // put-call parity (F = fwd, no disc)
}

// Vol surface: simple flat + skew for demo
double implied_vol(double K, double F) {
    return 0.20 - 0.05 * std::log(K/F);  // negative skew
}

double variance_swap_strike(double S0, double r, double T,
                             int n_strikes = 200) {
    double F = S0 * std::exp(r * T);
    double dK = S0 * 6.0 / n_strikes;   // range [S0*0, S0*6]
    double integral = 0.0;

    for (int i = 1; i <= n_strikes; ++i) {
        double K    = dK * i;
        double sig  = implied_vol(K, F);
        double w    = 2.0 / (K * K) * dK;  // weight = dK / K^2 * 2
        if (K < F)
            integral += w * bs_put(F, K, T, sig);
        else
            integral += w * bs_call(F, K, T, sig);
    }
    return integral / T * 10000;  // return in vol^2 * 10000 (bps^2) basis
}

int main() {
    double K_var = variance_swap_strike(100, 0.05, 1.0);
    printf("Variance swap strike: %.4f%%^2  (vol strike=%.2f%%)\\n",
           K_var / 100.0, std::sqrt(K_var / 10000.0) * 100.0);
}`,
    explanation: "The Carr-Madan variance swap replication theorem shows that the fair variance strike equals a model-free weighted integral of call and put prices across all strikes; the skewed implied vol surface means the fair variance strike exceeds the at-the-money implied variance — this convexity bias (Jensen's inequality) is why variance swaps trade at a premium to squared ATM vol.",
  },
  {
    id: "cpp-20260730-b1-antithetic-mc",
    language: "cpp",
    title: "Antithetic variates for MC variance reduction",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <cstdio>
#include <numeric>

// Antithetic variates: pair each path Z with its mirror -Z.
// Payoff(Z) and Payoff(-Z) are negatively correlated, so their average
// has lower variance: Var[(X + X')/2] = (Var(X) + Cov(X,X')) / 2.
// Works best when payoff is monotone in the Brownian motion.

double antithetic_european_call(double S0, double K, double T,
                                 double r, double sigma,
                                 int n_paths = 100'000) {
    double dt     = T;
    double drift  = (r - 0.5*sigma*sigma)*dt;
    double diffuse = sigma*std::sqrt(dt);

    std::mt19937_64 rng(42);
    std::normal_distribution<double> nd;

    double sum = 0;
    int half = n_paths / 2;
    for (int i = 0; i < half; ++i) {
        double Z  =  nd(rng);
        double Zp = -Z;          // antithetic

        double S_fwd  = S0 * std::exp(drift + diffuse * Z);
        double S_anti = S0 * std::exp(drift + diffuse * Zp);

        sum += std::max(S_fwd  - K, 0.0)
             + std::max(S_anti - K, 0.0);
    }
    return std::exp(-r*T) * sum / n_paths;
}

double plain_mc(double S0, double K, double T, double r, double sigma,
                int n_paths = 100'000) {
    double drift = (r - 0.5*sigma*sigma)*T;
    double diff  = sigma*std::sqrt(T);
    std::mt19937_64 rng(42);
    std::normal_distribution<double> nd;
    double sum = 0;
    for (int i = 0; i < n_paths; ++i) {
        double ST = S0 * std::exp(drift + diff * nd(rng));
        sum += std::max(ST - K, 0.0);
    }
    return std::exp(-r*T) * sum / n_paths;
}

int main() {
    // Black-Scholes exact ~= 10.4506
    printf("Plain MC:      %.4f\\n", plain_mc(100, 100, 1, 0.05, 0.2));
    printf("Antithetic MC: %.4f\\n", antithetic_european_call(100, 100, 1, 0.05, 0.2));
}`,
    explanation: "Antithetic variates pair each random draw Z with its negative -Z, creating two paths that are mirror images; for a call payoff (monotone in S_T which is monotone in Z), the two payoffs are negatively correlated so their average concentrates around the true expectation, typically halving the number of paths needed for the same standard error.",
  },
  {
    id: "cpp-20260730-b1-fold-expressions",
    language: "cpp",
    title: "C++17 fold expressions for variadic Greeks aggregation",
    tag: "modern-cpp",
    code: `#include <cstdio>
#include <utility>

// Fold expressions: apply a binary operator across a parameter pack.
// Left fold:  (... op pack)  = ((a op b) op c)
// Right fold: (pack op ...) = (a op (b op c))
// Unary fold requires at least one argument; binary fold provides an init.

// Sum a pack of Greeks contributions
template<typename... Ts>
double sum_greeks(Ts... contributions) {
    return (... + contributions);   // unary left fold: a + b + c + ...
}

// All of a pack of bool checks (e.g., validation rules)
template<typename... Checks>
bool all_pass(Checks... checks) {
    return (... && checks);   // short-circuit left fold
}

// Apply a callable to each element in a pack (comma fold)
template<typename F, typename... Args>
void for_each_greek(F&& f, Args&&... args) {
    (f(std::forward<Args>(args)), ...);   // comma left fold — executes in order
}

// Count how many pack elements exceed a threshold
template<typename... Vs>
int count_exceeding(double threshold, Vs... values) {
    return (... + (values > threshold ? 1 : 0));  // fold with ternary
}

int main() {
    // Aggregate delta contributions from multiple instruments
    double total_delta = sum_greeks(0.50, -0.30, 0.80, 0.20, -0.10);
    printf("Total delta: %.2f\\n", total_delta);

    bool valid = all_pass(
        total_delta < 1.5,   // delta limit
        total_delta > -1.5,  // delta limit
        true                 // always pass rule
    );
    printf("Valid: %s\\n", valid ? "yes" : "no");

    // Print each contribution
    for_each_greek([](double g){ printf("  greek=%.2f\\n", g); },
                   0.50, -0.30, 0.80);

    int n = count_exceeding(0.4, 0.50, 0.20, 0.80, 0.10);
    printf("Count > 0.40: %d\\n", n);
}`,
    explanation: "C++17 fold expressions eliminate recursive variadic template boilerplate by applying an operator directly across a parameter pack in the language; the comma fold is idiomatic for executing a callable on each element in-order, and all-of / any-of folds with logical operators short-circuit correctly at compile time for constant expressions.",
  },
  {
    id: "cpp-20260730-b1-consteval",
    language: "cpp",
    title: "consteval for mandatory compile-time Greeks tables",
    tag: "modern-cpp",
    code: `#include <cmath>
#include <array>
#include <cstdio>

// consteval (C++20): function MUST be evaluated at compile time.
// Stronger than constexpr: calling it at runtime is a compile error.
// Guarantees the result is a compile-time constant — useful for
// lookup tables that must not vary at runtime.

// Compile-time normal CDF (Abramowitz & Stegun rational approximation)
consteval double norm_cdf_ct(double x) {
    const double p  = 0.2316419;
    const double b1 = 0.319381530, b2 = -0.356563782;
    const double b3 = 1.781477937, b4 = -1.821255978, b5 = 1.330274429;
    double ax = x < 0 ? -x : x;
    double t  = 1.0 / (1.0 + p * ax);
    double poly = t*(b1 + t*(b2 + t*(b3 + t*(b4 + t*b5))));
    // std::exp is constexpr in GCC14+/Clang17+; use approximation otherwise
    // poly * exp(-ax^2/2) * inv_sqrt2pi
    double pdf_approx = 0.3989422804 * (1.0 - ax*ax/2 + ax*ax*ax*ax/8);
    double cdf = 1.0 - pdf_approx * poly;
    return x < 0 ? 1.0 - cdf : cdf;
}

consteval double bs_delta_ct(double S_over_K, double sigma_sqrtT) {
    double d1 = (S_over_K > 0 ? __builtin_log(S_over_K) : 0.0) / sigma_sqrtT
                 + 0.5 * sigma_sqrtT;
    return norm_cdf_ct(d1);
}

// Delta table for moneyness grid [0.8, 0.85, ..., 1.20]
constexpr std::array<double, 9> DELTA_TABLE = {
    bs_delta_ct(0.80, 0.20),
    bs_delta_ct(0.85, 0.20),
    bs_delta_ct(0.90, 0.20),
    bs_delta_ct(0.95, 0.20),
    bs_delta_ct(1.00, 0.20),
    bs_delta_ct(1.05, 0.20),
    bs_delta_ct(1.10, 0.20),
    bs_delta_ct(1.15, 0.20),
    bs_delta_ct(1.20, 0.20),
};

int main() {
    double moneyness[] = {0.80,0.85,0.90,0.95,1.00,1.05,1.10,1.15,1.20};
    for (int i = 0; i < 9; ++i)
        printf("S/K=%.2f delta=%.4f\\n", moneyness[i], DELTA_TABLE[i]);
}`,
    explanation: "consteval prevents the accidental runtime evaluation that constexpr allows: if DELTA_TABLE were ever re-computed at runtime due to a non-constant argument, the compiler would error rather than silently degrading to runtime arithmetic; this is valuable for lookup tables that are shipped as read-only data in the binary and must match the compile-time formula exactly.",
  },
  {
    id: "cpp-20260730-b1-optional-chain",
    language: "cpp",
    title: "std::optional chain for order validation pipeline",
    tag: "modern-cpp",
    code: `#include <optional>
#include <string>
#include <cstdio>
#include <cmath>

// std::optional encodes the absence of a value without a sentinel.
// Chaining optional-returning validators creates a pipeline where the
// first failure short-circuits the rest — without exceptions.

struct Order { std::string symbol; double price; int qty; };

using Result = std::optional<Order>;

Result validate_symbol(Order o) {
    if (o.symbol.empty() || o.symbol.size() > 8) return std::nullopt;
    return o;
}

Result validate_price(Order o) {
    if (o.price <= 0 || !std::isfinite(o.price)) return std::nullopt;
    return o;
}

Result validate_qty(Order o) {
    if (o.qty <= 0 || o.qty > 1'000'000) return std::nullopt;
    return o;
}

// Monadic chain: and_then (C++23) or manual lambda chaining
Result validate(Order o) {
    // C++23: return Result{o}
    //     .and_then(validate_symbol)
    //     .and_then(validate_price)
    //     .and_then(validate_qty);
    // C++17 compatible:
    auto r1 = validate_symbol(o);
    if (!r1) return std::nullopt;
    auto r2 = validate_price(*r1);
    if (!r2) return std::nullopt;
    return validate_qty(*r2);
}

void process(const char* sym, double price, int qty) {
    Order o{sym, price, qty};
    if (auto valid = validate(o)) {
        printf("ACCEPTED: %s %.2f x%d\\n",
               valid->symbol.c_str(), valid->price, valid->qty);
    } else {
        printf("REJECTED: %s %.2f x%d\\n", sym, price, qty);
    }
}

int main() {
    process("AAPL",   150.50, 100);
    process("",       150.50, 100);  // bad symbol
    process("MSFT",   -1.00,  100);  // bad price
    process("GOOGL",  150.50, 0  );  // bad qty
}`,
    explanation: "Returning std::optional from each validation step makes the failure channel explicit in the type system rather than relying on exceptions or error codes; the C++23 and_then monadic bind chains these steps without nested if-statements, and the compiler can inline the chain completely — no virtual dispatch, no heap allocation, no exception overhead.",
  },
  {
    id: "cpp-20260730-b1-striped-mutex",
    language: "cpp",
    title: "Striped mutex hash map for parallel order lookup",
    tag: "lock-free",
    code: `#include <mutex>
#include <unordered_map>
#include <vector>
#include <cstdint>
#include <cstdio>

// Striped locking: instead of one global mutex, use N mutexes.
// Each key is assigned to stripe = hash(key) % N.
// N threads accessing different stripes proceed in parallel.
// Reduces contention by factor N without going fully lock-free.

template<typename K, typename V, int STRIPES = 16>
class StripedMap {
    struct Shard {
        std::mutex mu;
        std::unordered_map<K, V> map;
    };
    std::vector<Shard> shards_{STRIPES};

    Shard& shard_for(const K& key) {
        return shards_[std::hash<K>{}(key) % STRIPES];
    }

public:
    void insert(const K& k, V v) {
        auto& s = shard_for(k);
        std::lock_guard lk{s.mu};
        s.map[k] = std::move(v);
    }

    bool get(const K& k, V& out) {
        auto& s = shard_for(k);
        std::lock_guard lk{s.mu};
        auto it = s.map.find(k);
        if (it == s.map.end()) return false;
        out = it->second;
        return true;
    }

    bool erase(const K& k) {
        auto& s = shard_for(k);
        std::lock_guard lk{s.mu};
        return s.map.erase(k) > 0;
    }

    std::size_t size() const {
        std::size_t total = 0;
        for (auto& s : shards_) {
            // Note: racy read — only valid when no concurrent writers
            total += s.map.size();
        }
        return total;
    }
};

int main() {
    StripedMap<uint64_t, double> order_prices;
    for (uint64_t i = 1; i <= 100; ++i)
        order_prices.insert(i, 100.0 + i * 0.01);

    double price;
    if (order_prices.get(42, price))
        printf("order 42: price=%.2f\\n", price);
    printf("total orders=%zu\\n", order_prices.size());
}`,
    explanation: "Striped locking reduces contention to 1/N of a global mutex by partitioning the keyspace into N shards, each with its own lock; 16 stripes already reduce write contention dramatically for typical order-to-cancel ratios, while remaining simpler than a lock-free hash map that requires ABA protection and memory reclamation.",
  },
  {
    id: "cpp-20260730-b1-risk-marginal",
    language: "cpp",
    title: "Portfolio marginal risk contribution (matrix computation)",
    tag: "risk",
    code: `#include <vector>
#include <cmath>
#include <cstdio>
#include <numeric>

// Marginal risk contribution (MRC) of asset i:
//   MRC_i = w_i * (Sigma @ w)_i / portfolio_vol
// where Sigma is the N×N covariance matrix.
// Risk contribution = MRC_i; sum of all MRC_i = portfolio vol.

class PortfolioRisk {
    int n_;
    std::vector<double> cov_;  // n x n, row-major

    double cov(int i, int j) const { return cov_[i*n_ + j]; }

public:
    PortfolioRisk(int n, const std::vector<double>& cov)
        : n_(n), cov_(cov) {}

    // Sigma @ w
    std::vector<double> cov_times_w(const std::vector<double>& w) const {
        std::vector<double> result(n_, 0.0);
        for (int i = 0; i < n_; ++i)
            for (int j = 0; j < n_; ++j)
                result[i] += cov(i,j) * w[j];
        return result;
    }

    double portfolio_vol(const std::vector<double>& w) const {
        auto sw = cov_times_w(w);
        double var = 0;
        for (int i = 0; i < n_; ++i) var += w[i] * sw[i];
        return std::sqrt(var);
    }

    std::vector<double> marginal_risk(const std::vector<double>& w) const {
        auto sw   = cov_times_w(w);
        double pv = portfolio_vol(w);
        std::vector<double> mrc(n_);
        for (int i = 0; i < n_; ++i)
            mrc[i] = w[i] * sw[i] / pv;
        return mrc;
    }
};

int main() {
    // 3 assets: covariance matrix (annualised)
    std::vector<double> cov = {
        0.04,  0.006, 0.002,
        0.006, 0.0025, 0.001,
        0.002, 0.001,  0.01,
    };
    std::vector<double> w = {0.5, 0.3, 0.2};

    PortfolioRisk pr{3, cov};
    auto mrc = pr.marginal_risk(w);
    double pvol = pr.portfolio_vol(w);

    printf("Portfolio vol: %.4f\\n", pvol);
    printf("Risk contributions (sum=%.4f):\\n",
           std::accumulate(mrc.begin(), mrc.end(), 0.0));
    for (int i = 0; i < 3; ++i)
        printf("  asset %d: MRC=%.6f (%.1f%%)\\n",
               i, mrc[i], 100*mrc[i]/pvol);
}`,
    explanation: "Marginal risk contributions decompose portfolio volatility into per-asset terms that sum exactly to the total volatility (Euler's theorem), providing a consistent budget for risk allocation; an equal-risk-contribution portfolio sets w_i * (Sigma w)_i = constant for all i, which is the mathematical definition of risk parity.",
  },
  {
    id: "cpp-20260730-b1-fix-builder",
    language: "cpp",
    title: "FIX NewOrderSingle message builder with checksum",
    tag: "market-data",
    code: `#include <cstdio>
#include <cstring>
#include <cstdint>

// FIX message layout: BeginString|BodyLength|... body ...|Checksum
// Checksum (tag 10) = sum of all bytes mod 256, formatted as 3-digit string.
// SOH (\\x01) is the field separator.

class FIXBuilder {
    char buf_[4096];
    int  pos_{0};

    void append_field(int tag, const char* value) {
        pos_ += std::snprintf(buf_ + pos_, sizeof(buf_) - pos_,
                              "%d=%s\x01", tag, value);
    }
    void append_field(int tag, double value) {
        char tmp[32];
        std::snprintf(tmp, sizeof(tmp), "%.4f", value);
        append_field(tag, tmp);
    }
    void append_field(int tag, int value) {
        char tmp[16];
        std::snprintf(tmp, sizeof(tmp), "%d", value);
        append_field(tag, tmp);
    }

public:
    // Build FIX 4.2 NewOrderSingle (MsgType D)
    int build_new_order(const char* clordid, const char* symbol,
                        char side, double price, int qty) {
        pos_ = 0;
        // Header
        append_field(8, "FIX.4.2");       // BeginString (updated below)
        int body_len_pos = pos_;           // placeholder for BodyLength
        append_field(9, "000");            // BodyLength placeholder
        append_field(35, "D");             // MsgType
        append_field(49, "SENDER");
        append_field(56, "TARGET");
        // Body
        append_field(11, clordid);         // ClOrdID
        append_field(55, symbol);          // Symbol
        append_field(54, (side=='B')?"1":"2"); // Side
        append_field(38, qty);             // OrderQty
        append_field(44, price);           // Price
        append_field(40, "2");             // OrdType=Limit
        // Compute body length = bytes from MsgType to end (excl. BeginString, BodyLength, Checksum)
        // Simplified: just return full message
        // Compute checksum
        uint8_t cksum = 0;
        for (int i = 0; i < pos_; ++i)
            cksum = static_cast<uint8_t>((cksum + static_cast<uint8_t>(buf_[i])) % 256);
        pos_ += std::snprintf(buf_ + pos_, sizeof(buf_) - pos_,
                              "10=%03u\x01", cksum);
        return pos_;
    }

    const char* data() const { return buf_; }
};

int main() {
    FIXBuilder fb;
    int len = fb.build_new_order("ORD001", "AAPL", 'B', 150.5000, 100);
    // Print replacing SOH with '|' for readability
    for (int i = 0; i < len; ++i)
        putchar(fb.data()[i] == '\x01' ? '|' : fb.data()[i]);
    putchar('\\n');
}`,
    explanation: "Building FIX messages with a statically-sized char buffer avoids heap allocation in the order entry path; the checksum is a simple byte-sum mod 256 (not a cryptographic hash) designed to catch bit flips in transmission over serial lines, and the body length field is required for the receiver to know where to start reading the next message in the stream.",
  },
  {
    id: "cpp-20260730-b1-vasicek-sim",
    language: "cpp",
    title: "Vasicek short-rate model: exact simulation and bond price",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <cstdio>

// Vasicek (1977): dr = kappa*(theta - r)*dt + sigma*dW
// Gaussian: can go negative. Exact simulation avoids Euler discretisation error.
// r(t+dt) | r(t) ~ N(mu, sigma^2)

struct VasicekParams { double kappa, theta, sigma; };

// Exact transition distribution
double vasicek_next(double r, double dt, const VasicekParams& p,
                    double Z) {
    double E   = p.theta + (r - p.theta) * std::exp(-p.kappa * dt);
    double Var = p.sigma*p.sigma / (2*p.kappa)
                 * (1 - std::exp(-2*p.kappa * dt));
    return E + std::sqrt(Var) * Z;
}

// Closed-form ZCB price P(0,T)
double vasicek_zcb(double r0, const VasicekParams& p, double T) {
    double k = p.kappa, th = p.theta, sig = p.sigma;
    double B = (1 - std::exp(-k*T)) / k;
    double A = std::exp((th - sig*sig/(2*k*k)) * (B - T)
                        - sig*sig*B*B / (4*k));
    return A * std::exp(-B * r0);
}

int main() {
    VasicekParams p{0.5, 0.04, 0.01};
    double r0 = 0.03;
    std::mt19937_64 rng(42);
    std::normal_distribution<double> nd;

    // Simulate 10 paths of 1-year
    int n_steps = 252;
    double dt = 1.0 / n_steps;
    double r_sum = 0;
    for (int path = 0; path < 10; ++path) {
        double r = r0;
        for (int i = 0; i < n_steps; ++i)
            r = vasicek_next(r, dt, p, nd(rng));
        r_sum += r;
        printf("path %2d: r(1)=%.4f\\n", path, r);
    }
    printf("Mean r(1) across 10 paths: %.4f\\n", r_sum / 10);

    printf("\\nClosed-form ZCB prices:\\n");
    for (double T : {1.0, 3.0, 5.0, 10.0})
        printf("  P(0,%.0f)=%.6f\\n", T, vasicek_zcb(r0, p, T));
}`,
    explanation: "The Vasicek model admits exact simulation because its transition distribution is Gaussian, avoiding the bias that Euler-Maruyama introduces for the mean-reverting diffusion; the closed-form bond price is exponential-affine in r0, making calibration to market rates tractable via 1-D non-linear least squares over the three parameters.",
  },
  {
    id: "cpp-20260730-b1-std-string-view-fix",
    language: "cpp",
    title: "Custom string_view field iterator for zero-copy FIX parsing",
    tag: "market-data",
    code: `#include <string_view>
#include <cstdio>
#include <charconv>
#include <cstring>

// Custom iterator over FIX fields without allocating strings.
// Each call to next() returns a (tag, value) pair as string_views.

struct FIXField {
    int             tag;
    std::string_view value;
    bool            valid{false};
};

class FIXIterator {
    std::string_view msg_;
    std::size_t pos_{0};

public:
    explicit FIXIterator(std::string_view msg) : msg_(msg) {}

    FIXField next() {
        if (pos_ >= msg_.size()) return {};
        // Find '='
        auto eq = msg_.find('=', pos_);
        if (eq == std::string_view::npos) return {};
        // Parse tag
        int tag = 0;
        auto [ptr, ec] = std::from_chars(msg_.data() + pos_, msg_.data() + eq, tag);
        if (ec != std::errc{}) return {};
        // Find SOH (\x01)
        auto soh = msg_.find('\x01', eq + 1);
        std::size_t val_end = (soh == std::string_view::npos) ? msg_.size() : soh;
        std::string_view value = msg_.substr(eq + 1, val_end - eq - 1);
        pos_ = val_end + (soh != std::string_view::npos ? 1 : msg_.size());
        return {tag, value, true};
    }
};

int main() {
    std::string_view msg =
        "8=FIX.4.2\x01" "35=D\x01" "49=CLIENT\x01"
        "55=TSLA\x01" "54=1\x01" "38=500\x01" "44=250.00\x01";

    FIXIterator it{msg};
    for (;;) {
        auto f = it.next();
        if (!f.valid) break;
        printf("tag=%3d value=%.*s\\n",
               f.tag, (int)f.value.size(), f.value.data());
    }
}`,
    explanation: "A custom FIX iterator returns string_views into the original buffer, so parsing produces no heap allocation and zero copy; std::from_chars converts the ASCII tag number to an integer without locale overhead and without constructing a std::string, making this pattern suitable for kernel-bypass (DPDK/RDMA) receive buffers where allocations must be avoided entirely.",
  },
  {
    id: "cpp-20260730-b1-parallel-for-each",
    language: "cpp",
    title: "std::execution parallel portfolio repricing",
    tag: "modern-cpp",
    code: `#include <execution>
#include <algorithm>
#include <vector>
#include <cmath>
#include <cstdio>
#include <numeric>

// C++17 parallel algorithms: std::execution::par_unseq uses SIMD + threads.
// Available when linked with TBB (Intel) or libstdc++ parallel extensions.

struct OptionPosition {
    double S, K, T, r, sigma, qty;
    double pv{0.0};   // computed field
};

double bs_call_price(double S, double K, double T, double r, double sigma) {
    if (T <= 0 || sigma <= 0) return std::max(S - K, 0.0);
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma*std::sqrt(T);
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    return S*N(d1) - K*std::exp(-r*T)*N(d2);
}

int main() {
    const int N = 100'000;
    std::vector<OptionPosition> portfolio(N);
    // Initialise with random-ish positions
    for (int i = 0; i < N; ++i) {
        portfolio[i] = {100.0 + i%10, 100.0, 1.0 + (i%5)*0.1,
                        0.05, 0.15 + (i%8)*0.01, 10.0*(i%20+1)};
    }

    // Parallel repricing: one thread per core, SIMD within each thread
    std::for_each(std::execution::par_unseq,
                  portfolio.begin(), portfolio.end(),
                  [](OptionPosition& p) {
                      p.pv = bs_call_price(p.S, p.K, p.T, p.r, p.sigma) * p.qty;
                  });

    double total_pv = std::transform_reduce(
        std::execution::par_unseq,
        portfolio.begin(), portfolio.end(),
        0.0, std::plus<double>{},
        [](const OptionPosition& p){ return p.pv; });

    printf("Portfolio PV: %.2f\\n", total_pv);
    printf("First 3 PVs: %.4f  %.4f  %.4f\\n",
           portfolio[0].pv, portfolio[1].pv, portfolio[2].pv);
}`,
    explanation: "std::execution::par_unseq requests both multi-threading and SIMD vectorisation, making the inner lambda callable with SIMD registers; transform_reduce with parallel execution implements a parallel map-reduce in one expression, and on a machine with 16 cores and AVX2, repricing 100k options takes under 1 ms compared to 10 ms serially.",
  },
  {
    id: "cpp-20260730-b1-deque-vs-vector-book",
    language: "cpp",
    title: "std::deque vs vector for order book price levels",
    tag: "modern-cpp",
    code: `#include <deque>
#include <vector>
#include <chrono>
#include <cstdio>
#include <algorithm>

using Clock = std::chrono::steady_clock;

// std::deque: O(1) push_front/push_back, pointer stability for middle elements.
// std::vector: contiguous memory, O(N) push_front due to shift.
// For a price level queue where new prices arrive at both ends (spread widens
// and narrows), deque avoids the shift cost but pays more for cache misses.

constexpr int N = 100'000;

void bench_vector() {
    std::vector<double> levels;
    levels.reserve(N);
    auto t0 = Clock::now();
    for (int i = 0; i < N; ++i) {
        levels.push_back(100.0 + i * 0.01);    // append: O(1) amortised
        if (levels.size() > 20)
            levels.erase(levels.begin());       // remove front: O(N)
    }
    auto dt = std::chrono::duration_cast<std::chrono::microseconds>(
                  Clock::now() - t0).count();
    printf("vector push+erase_front: %lld us  size=%zu\\n", dt, levels.size());
}

void bench_deque() {
    std::deque<double> levels;
    auto t0 = Clock::now();
    for (int i = 0; i < N; ++i) {
        levels.push_back(100.0 + i * 0.01);    // append: O(1)
        if (levels.size() > 20)
            levels.pop_front();                 // remove front: O(1)
    }
    auto dt = std::chrono::duration_cast<std::chrono::microseconds>(
                  Clock::now() - t0).count();
    printf("deque  push+pop_front:   %lld us  size=%zu\\n", dt, levels.size());
}

int main() {
    bench_vector();
    bench_deque();
    printf("\\nUse deque when front removal is frequent;\\n");
    printf("Use vector when random access and cache locality dominate.\\n");
}`,
    explanation: "std::deque stores elements in fixed-size chunks with O(1) push/pop at both ends without contiguous memory, making it superior to vector for FIFO order queues at each price level; however, vector's contiguous layout gives better cache behaviour for sequential scans, so the right choice depends on whether cancels arrive uniformly or cluster at the front/back.",
  },
];
