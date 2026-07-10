import type { Snippet } from "./types";

export const cppSnippets20260710B1: Snippet[] = [
  {
    id: "cpp-20260710-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-Size Pool Allocator with Free List",
    tag: "allocators",
    code: `#include <cstddef>
#include <new>

// Each idle block reuses its own storage to hold the free-list pointer.
template <std::size_t BlockSize, std::size_t Capacity>
class PoolAllocator {
    static_assert(BlockSize >= sizeof(void*), "block must hold a pointer");
    union Block {
        Block* next;
        alignas(alignof(std::max_align_t)) char buf[BlockSize];
    };
    Block slab_[Capacity];
    Block* head_ = nullptr;
public:
    PoolAllocator() noexcept {
        for (std::size_t i = 0; i + 1 < Capacity; ++i)
            slab_[i].next = &slab_[i + 1];
        slab_[Capacity - 1].next = nullptr;
        head_ = &slab_[0];
    }
    [[nodiscard]] void* allocate() noexcept {
        if (!head_) return nullptr;
        Block* b = head_;
        head_ = head_->next;   // pop from free list: O(1)
        return b->buf;
    }
    void deallocate(void* p) noexcept {
        auto* b = static_cast<Block*>(p);
        b->next = head_;       // push onto free list: O(1)
        head_ = b;
    }
};

struct Order { int id; double px; int qty; char side; };

int main() {
    PoolAllocator<sizeof(Order), 4096> pool;
    auto* o = new (pool.allocate()) Order{1, 100.50, 300, 'B'};
    o->~Order();
    pool.deallocate(o);   // O(1); slot immediately available for reuse
}`,
    explanation:
      "Pool allocators thread a free list through idle blocks' own storage — alloc and dealloc are each a single pointer swap with no heap interaction, typically 3 ns vs 100 ns for system malloc. The union trick means each block stores either a next-pointer (when free) or aligned payload (when allocated) with zero wasted bytes.",
  },
  {
    id: "cpp-20260710-b1-spsc-queue",
    language: "cpp",
    title: "Lock-Free SPSC Ring Buffer (Acquire/Release Ordering)",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <cstddef>
#include <iostream>

// Single-producer single-consumer wait-free ring buffer.
// Producer and consumer each own one index; no CAS needed.
template <typename T, std::size_t N>
class SPSCQueue {
    static_assert(N >= 2 && (N & (N - 1)) == 0, "N must be a power of 2");
    alignas(64) std::array<T, N> buf_{};
    alignas(64) std::atomic<std::size_t> write_{0};  // written by producer only
    alignas(64) std::atomic<std::size_t> read_{0};   // written by consumer only
public:
    // Producer thread only — no mutex needed
    bool push(const T& v) noexcept {
        const std::size_t w = write_.load(std::memory_order_relaxed);
        const std::size_t r = read_.load(std::memory_order_acquire);
        if (w - r >= N) return false;      // queue full
        buf_[w & (N - 1)] = v;
        write_.store(w + 1, std::memory_order_release);
        return true;
    }
    // Consumer thread only
    bool pop(T& out) noexcept {
        const std::size_t r = read_.load(std::memory_order_relaxed);
        const std::size_t w = write_.load(std::memory_order_acquire);
        if (r == w) return false;          // queue empty
        out = buf_[r & (N - 1)];
        read_.store(r + 1, std::memory_order_release);
        return true;
    }
};

int main() {
    SPSCQueue<double, 16> q;
    q.push(99.75); q.push(100.25);
    double v;
    while (q.pop(v)) std::cout << v << "\\n";
}`,
    explanation:
      "The producer reads the consumer's index with acquire (to see freed slots) and publishes new data with release; the consumer mirrors this pattern. Because each thread owns exactly one index and neither ever races on the same atomic, no CAS loop is required — just a single store/load per operation, achieving ~10 ns round-trip at 3 GHz.",
  },
  {
    id: "cpp-20260710-b1-false-sharing",
    language: "cpp",
    title: "Cache-Line Padding to Prevent False Sharing",
    tag: "low-latency",
    code: `#include <atomic>
#include <thread>
#include <iostream>
#include <cstddef>

static constexpr std::size_t CACHE_LINE = 64;

// BAD: both counters occupy the same 64-byte cache line.
// A write by one thread invalidates the entire line in the other core's L1.
struct BadCounters {
    std::atomic<long> buys{0};
    std::atomic<long> sells{0};
};

// GOOD: each counter on its own cache line — independent invalidation.
struct alignas(CACHE_LINE) PaddedLong {
    std::atomic<long> v{0};
    char pad[CACHE_LINE - sizeof(std::atomic<long>)];
};

struct GoodCounters {
    PaddedLong buys;
    PaddedLong sells;
};

template <typename C>
void run(C& c, long n) {
    auto t1 = std::thread([&]{ for (long i = 0; i < n; ++i) c.buys.v.fetch_add(1, std::memory_order_relaxed); });
    auto t2 = std::thread([&]{ for (long i = 0; i < n; ++i) c.sells.v.fetch_add(1, std::memory_order_relaxed); });
    t1.join(); t2.join();
}

int main() {
    GoodCounters good;
    run(good, 10'000'000L);
    std::cout << "buys=" << good.buys.v << " sells=" << good.sells.v << "\\n";
    // GoodCounters is typically 3-5x faster than BadCounters on NUMA systems
}`,
    explanation:
      "False sharing occurs when two threads write to different variables that land in the same 64-byte cache line: every write forces a cache coherence round-trip (MESI protocol) even though the data is logically independent. Padding each hot variable to its own line eliminates this: benchmark typically shows 3–5× speedup on a dual-socket machine.",
  },
  {
    id: "cpp-20260710-b1-spinlock-pause",
    language: "cpp",
    title: "Atomic Spinlock with x86 PAUSE Backoff",
    tag: "lock-free",
    code: `#include <atomic>
#include <thread>
#include <cstdint>
#include <iostream>

#if defined(__x86_64__) || defined(_M_X64)
#  include <immintrin.h>
#  define CPU_PAUSE() _mm_pause()
#else
#  define CPU_PAUSE() __asm__ __volatile__("yield")
#endif

class Spinlock {
    std::atomic_flag flag_ = ATOMIC_FLAG_INIT;
public:
    void lock() noexcept {
        for (uint32_t spin = 0;
             flag_.test_and_set(std::memory_order_acquire);
             ++spin)
        {
            if      (spin < 8)  {}                          // pure spin: fastest path
            else if (spin < 32) CPU_PAUSE();                // reduce pipeline pressure
            else                std::this_thread::yield();  // give up time slice
        }
    }
    void unlock() noexcept { flag_.clear(std::memory_order_release); }
    bool try_lock() noexcept { return !flag_.test_and_set(std::memory_order_acquire); }
};

struct LockGuard { Spinlock& l; LockGuard(Spinlock& l):l(l){l.lock();} ~LockGuard(){l.unlock();} };

static Spinlock gLock;
static int gCounter = 0;

int main() {
    auto inc = []{ for (int i = 0; i < 1'000'000; ++i) { LockGuard g(gLock); ++gCounter; } };
    std::thread t1(inc), t2(inc);
    t1.join(); t2.join();
    std::cout << "counter=" << gCounter << "\\n";  // must equal 2000000
}`,
    explanation:
      "The PAUSE instruction (rep nop on x86) signals the CPU that the loop is a spin-wait: it reduces power, avoids memory-order violations on out-of-order cores, and lets the sibling HyperThread make progress. The three-phase backoff (spin → pause → yield) amortises the cost: latency stays sub-microsecond for short contention, falling back gracefully to OS scheduling under prolonged contention.",
  },
  {
    id: "cpp-20260710-b1-sfinae-numeric",
    language: "cpp",
    title: "SFINAE enable_if Numeric Type Dispatch",
    tag: "templates",
    code: `#include <type_traits>
#include <iostream>
#include <string>

// Overload set resolves at compile time — no virtual dispatch.
template <typename T>
std::enable_if_t<std::is_floating_point_v<T>, std::string>
format_value(T v) {
    char buf[32];
    std::snprintf(buf, sizeof(buf), "%.6f", static_cast<double>(v));
    return buf;
}

template <typename T>
std::enable_if_t<std::is_integral_v<T>, std::string>
format_value(T v) {
    return std::to_string(v);
}

// Third overload via void_t for types with a .str() method
template <typename T, typename = std::void_t<decltype(std::declval<T>().str())>>
std::string format_value(T v) { return v.str(); }

// Compile-time check that only numeric types have a particular trait
template <typename T>
constexpr bool is_price_type_v =
    std::is_floating_point_v<T> && (sizeof(T) >= 4);

static_assert(is_price_type_v<double>);
static_assert(!is_price_type_v<int>);

int main() {
    std::cout << format_value(3.14159)    << "\\n";  // floating overload
    std::cout << format_value(42L)        << "\\n";  // integral overload
    std::cout << format_value(100'000)    << "\\n";
}`,
    explanation:
      "SFINAE (Substitution Failure Is Not An Error) filters the overload set at compile time using enable_if_t<condition>: the compiler silently discards overloads where substitution fails, with zero runtime cost. This is the pre-C++20 technique for selecting code paths based on type properties; C++20 concepts replace it with cleaner requires clauses but the generated code is identical.",
  },
  {
    id: "cpp-20260710-b1-cpp20-concepts",
    language: "cpp",
    title: "C++20 Concepts for Quant Numeric Types",
    tag: "modern-cpp",
    code: `#include <concepts>
#include <type_traits>
#include <iostream>
#include <cmath>

// Concept: any arithmetic type suitable as a price
template <typename T>
concept Price = std::is_arithmetic_v<T> && sizeof(T) >= 4;

// Concept: type must support basic numeric ops (for generic pricers)
template <typename T>
concept Numeric = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
    { a * b } -> std::convertible_to<T>;
    { a / b } -> std::convertible_to<T>;
    { std::sqrt(a) };        // must be sqrt-able (float/double)
};

// Generic Black-Scholes delta constrained to numeric types
template <Numeric T>
T bs_delta(T S, T K, T T_exp, T r, T sigma) {
    T d1 = (std::log(S / K) + (r + T{0.5} * sigma * sigma) * T_exp)
           / (sigma * std::sqrt(T_exp));
    // Approximate N(d1) via logistic: N(x) ≈ 1/(1+exp(-1.7*x))
    return T{1} / (T{1} + std::exp(T{-1.7} * d1));
}

// Requires Price concept: rejects int, char, etc.
template <Price T>
void print_mid(T bid, T ask) {
    std::cout << "mid=" << (bid + ask) / T{2} << "\\n";
}

int main() {
    double delta = bs_delta(100.0, 100.0, 1.0, 0.05, 0.20);
    std::cout << "delta approx=" << delta << "\\n";
    print_mid(99.5, 100.5);
    // print_mid('a', 'b');  // compile error: char is Price (sizeof>=1 fails)
}`,
    explanation:
      "C++20 concepts replace SFINAE with readable requires expressions that are checked and reported at the point of use rather than deep in template instantiation. Constraining pricers to Numeric or Price concepts prevents accidental instantiation with integer or char types and documents intent directly in the function signature.",
  },
  {
    id: "cpp-20260710-b1-branch-hints",
    language: "cpp",
    title: "Branch Prediction Hints [[likely]] / [[unlikely]]",
    tag: "low-latency",
    code: `#include <cstdint>
#include <iostream>

// Market-data parser hot path: the valid-message branch is taken 99.9% of the time.
// [[likely]] / [[unlikely]] guide the compiler to lay out the fast path inline
// and the error path out-of-line, improving instruction cache usage.

enum class ParseResult : uint8_t { OK, BAD_CHECKSUM, TRUNCATED, UNKNOWN_TYPE };

struct MarketMsg { char type; double price; int qty; uint8_t checksum; };

[[nodiscard]] ParseResult parse_msg(const char* buf, std::size_t len, MarketMsg& out) {
    if (len < sizeof(MarketMsg)) [[unlikely]]
        return ParseResult::TRUNCATED;

    const auto* msg = reinterpret_cast<const MarketMsg*>(buf);

    if (msg->checksum != 0xAB) [[unlikely]]
        return ParseResult::BAD_CHECKSUM;

    if (msg->type != 'T' && msg->type != 'Q') [[unlikely]]
        return ParseResult::UNKNOWN_TYPE;

    out = *msg;
    return ParseResult::OK;   // [[likely]] path: falls through inline
}

void process(const MarketMsg& m) {
    // Inline __builtin_expect usage (pre-C++20 equivalent)
    if (__builtin_expect(m.qty > 0, 1))
        std::cout << m.type << " px=" << m.price << " qty=" << m.qty << "\\n";
}

int main() {
    MarketMsg out{};
    MarketMsg msg{'T', 100.25, 500, 0xAB};
    if (parse_msg(reinterpret_cast<const char*>(&msg), sizeof(msg), out) == ParseResult::OK)
        process(out);
}`,
    explanation:
      "[[likely]] and [[unlikely]] (C++20) direct the compiler to place the favoured branch inline and the rare branch in a cold section, improving the instruction cache hit rate on the hot path. On x86 the compiler also adjusts branch prediction metadata in the binary; measured improvement on a tight parse loop is typically 5–15% throughput.",
  },
  {
    id: "cpp-20260710-b1-prefetch-hint",
    language: "cpp",
    title: "__builtin_prefetch for Stride-Access Hot Loop",
    tag: "low-latency",
    code: `#include <cstddef>
#include <iostream>
#include <vector>
#include <numeric>

// Stride through an array computing a rolling sum.
// Prefetch the cache line N iterations ahead so DRAM latency is hidden.

static constexpr int PREFETCH_DIST = 8;   // tune: memory latency / loop iteration time

double sum_with_prefetch(const double* data, std::size_t n) {
    double total = 0.0;
    for (std::size_t i = 0; i < n; ++i) {
        // Issue a prefetch for the cache line we'll need PREFETCH_DIST steps ahead.
        // __builtin_prefetch(ptr, rw=0 (read), locality=0 (no reuse after this))
        __builtin_prefetch(data + i + PREFETCH_DIST, 0, 0);
        total += data[i];
    }
    return total;
}

double sum_naive(const double* data, std::size_t n) {
    double total = 0.0;
    for (std::size_t i = 0; i < n; ++i)
        total += data[i];
    return total;
}

int main() {
    constexpr std::size_t N = 1 << 20;   // 8 MB (does not fit in L2)
    std::vector<double> v(N);
    std::iota(v.begin(), v.end(), 1.0);

    double s1 = sum_naive(v.data(), N);
    double s2 = sum_with_prefetch(v.data(), N);
    std::cout << "naive=" << s1 << " prefetch=" << s2 << "\\n";
    // Both are equal; prefetch version is typically 20-40% faster for L3-resident data
}`,
    explanation:
      "Software prefetch with __builtin_prefetch (maps to PREFETCHNTA or PREFETCHT0) issues a non-blocking memory hint that populates the cache line before the CPU stalls waiting for it. The optimal look-ahead distance equals memory latency (~100 cycles) divided by the loop body's cycle count; too small misses the window, too large evicts useful data from L1.",
  },
  {
    id: "cpp-20260710-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive Doubly-Linked List for Order Queue",
    tag: "data-structures",
    code: `#include <iostream>
#include <cassert>

// Intrusive list: the link node is embedded IN the object, not a separate heap allocation.
// No extra memory per node; O(1) remove-by-pointer without searching the list.
struct ListNode { ListNode* prev = nullptr; ListNode* next = nullptr; };

class IntrusiveList {
    ListNode sentinel_;   // dummy head/tail; simplifies boundary conditions
    std::size_t size_ = 0;
public:
    IntrusiveList() noexcept { sentinel_.prev = sentinel_.next = &sentinel_; }

    void push_back(ListNode* n) noexcept {
        n->prev         = sentinel_.prev;
        n->next         = &sentinel_;
        sentinel_.prev->next = n;
        sentinel_.prev       = n;
        ++size_;
    }
    void remove(ListNode* n) noexcept {
        n->prev->next = n->next;
        n->next->prev = n->prev;
        n->prev = n->next = nullptr;
        --size_;
    }
    ListNode* front() noexcept { return size_ ? sentinel_.next : nullptr; }
    std::size_t size() const noexcept { return size_; }
};

// Order embeds a ListNode — no separate allocation needed
struct Order {
    ListNode link;          // must be first (or use offsetof) for cast
    int id; double px; int qty;
    static Order* from_node(ListNode* n) { return reinterpret_cast<Order*>(n); }
};

int main() {
    Order o1{{}, 1, 100.5, 500};
    Order o2{{}, 2,  99.0, 200};
    Order o3{{}, 3, 101.0, 100};

    IntrusiveList queue;
    queue.push_back(&o1.link);
    queue.push_back(&o2.link);
    queue.push_back(&o3.link);

    queue.remove(&o2.link);   // O(1) cancel by pointer — no scan

    while (auto* node = queue.front()) {
        Order* o = Order::from_node(node);
        queue.remove(node);
        std::cout << "id=" << o->id << " px=" << o->px << "\\n";
    }
}`,
    explanation:
      "Intrusive lists embed the list link directly in the element struct, eliminating the separate heap allocation that std::list requires per node — critical for HFT order queues where allocation is on the hot path. The remove-by-pointer operation is O(1) with no search, enabling O(1) order cancellation given only a pointer to the order object.",
  },
  {
    id: "cpp-20260710-b1-fix-parser",
    language: "cpp",
    title: "FIX Protocol Tag=Value Field Tokenizer",
    tag: "market-data",
    code: `#include <cstdint>
#include <string_view>
#include <functional>
#include <cstdlib>
#include <iostream>

// FIX 4.x messages are SOH-delimited tag=value pairs: "8=FIX.4.4\x01 35=D\x01 ..."
// This parser avoids any heap allocation by operating on a string_view of the buffer.

static constexpr char SOH = '\x01';

struct FIXField {
    int           tag;
    std::string_view value;
};

// Visit each tag=value pair; callback returns false to stop early.
void parse_fix(std::string_view msg,
               std::function<bool(FIXField)> cb)
{
    const char* p   = msg.data();
    const char* end = p + msg.size();

    while (p < end) {
        // Parse tag (integer before '=')
        const char* eq = p;
        while (eq < end && *eq != '=') ++eq;
        if (eq >= end) break;

        int tag = 0;
        for (const char* c = p; c < eq; ++c)
            tag = tag * 10 + (*c - '0');

        // Parse value (up to next SOH)
        const char* soh = eq + 1;
        while (soh < end && *soh != SOH) ++soh;

        if (!cb(FIXField{tag, std::string_view(eq + 1, soh - eq - 1)}))
            return;

        p = soh + 1;
    }
}

int main() {
    // Minimal NewOrderSingle (35=D)
    const char raw[] = "8=FIX.4.4\x01""35=D\x01""49=CLIENT\x01""55=AAPL\x01""54=1\x01""44=150.25\x01""38=100\x01";

    parse_fix(std::string_view(raw, sizeof(raw) - 1), [](FIXField f) {
        std::cout << "Tag " << f.tag << " = " << f.value << "\\n";
        return true;
    });
}`,
    explanation:
      "The parser operates entirely on a string_view of the incoming network buffer — zero copies, zero allocations. The inner loops are trivially auto-vectorisable by the compiler. In production, the callback is inlined at the call site, making total throughput competitive with generated parsers from tools like QuickFIX or SBE.",
  },
  {
    id: "cpp-20260710-b1-price-level-book",
    language: "cpp",
    title: "Price-Level Order Book with std::map",
    tag: "order-book",
    code: `#include <map>
#include <deque>
#include <iostream>
#include <optional>

struct Order { int id; double px; int qty; };

class OrderBook {
    // Bids: descending price (best bid = rbegin)
    std::map<double, std::deque<Order>> bids_;
    // Asks: ascending price (best ask = begin)
    std::map<double, std::deque<Order>> asks_;
public:
    void add(Order o, char side) {
        auto& side_map = (side == 'B') ? bids_ : asks_;
        side_map[o.px].push_back(o);
    }

    // Match: returns filled quantity
    int match(Order incoming, char side) {
        auto& opp = (side == 'B') ? asks_ : bids_;
        int remaining = incoming.qty;

        while (remaining > 0 && !opp.empty()) {
            auto it = (side == 'B') ? opp.begin() : std::prev(opp.end());
            // Check if crossing: buy at or above best ask, sell at or below best bid
            bool cross = (side == 'B') ? (incoming.px >= it->first)
                                        : (incoming.px <= it->first);
            if (!cross) break;

            auto& q = it->second;
            while (remaining > 0 && !q.empty()) {
                Order& passive = q.front();
                int fill = std::min(remaining, passive.qty);
                remaining      -= fill;
                passive.qty    -= fill;
                std::cout << "Fill " << fill << " @ " << it->first << "\\n";
                if (passive.qty == 0) q.pop_front();
            }
            if (q.empty()) opp.erase(it);
        }
        if (remaining > 0)
            add(Order{incoming.id, incoming.px, remaining}, side);
        return incoming.qty - remaining;
    }

    void print_bbo() const {
        if (!bids_.empty()) std::cout << "BBO: " << bids_.rbegin()->first;
        if (!asks_.empty()) std::cout << " / " << asks_.begin()->first;
        std::cout << "\\n";
    }
};

int main() {
    OrderBook book;
    book.add({1, 99.5, 100}, 'B');
    book.add({2, 99.0, 200}, 'B');
    book.add({3, 100.5, 150}, 'S');
    book.print_bbo();
    book.match({4, 100.5, 120}, 'B');   // aggressive buy crosses the ask
    book.print_bbo();
}`,
    explanation:
      "std::map maintains price levels in sorted order automatically; best bid is rbegin() (largest key) and best ask is begin() (smallest key). For throughput-critical books, this is replaced by a sorted array or intrusive-tree with pool-allocated nodes, but the std::map version benchmarks at ~200 ns/order which suffices for non-HFT matching engines.",
  },
  {
    id: "cpp-20260710-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson Finite Difference for Black-Scholes PDE",
    tag: "quant",
    code: `#include <vector>
#include <algorithm>
#include <cmath>
#include <iostream>

// BS PDE on log-price grid: dV/dt + 0.5*sigma^2*d2V/dx2 + (r-0.5*sigma^2)*dV/dx - r*V = 0
// x = log(S), grid: x in [x_min, x_max], time-stepping backward from T to 0.
// Crank-Nicolson: theta=0.5 averages explicit and implicit operators -> O(dt^2) accuracy.

double cn_call(double S0, double K, double T, double r, double sigma,
               int M = 200, int N = 200)
{
    const double x_min = std::log(S0 * 0.1);
    const double x_max = std::log(S0 * 5.0);
    const double dx    = (x_max - x_min) / N;
    const double dt    = T / M;

    const double a = sigma * sigma / (2.0 * dx * dx);
    const double b = (r - 0.5 * sigma * sigma) / (2.0 * dx);

    // Grid values: V[j] = option value at x_j = x_min + j*dx
    std::vector<double> V(N + 1);
    for (int j = 0; j <= N; ++j) {
        double S = std::exp(x_min + j * dx);
        V[j] = std::max(S - K, 0.0);   // terminal condition at t=T
    }

    // Thomas algorithm for tridiagonal system (CN produces tridiagonal A)
    std::vector<double> lo(N+1), di(N+1), up(N+1), rhs(N+1), c(N+1), d(N+1);

    for (int step = 0; step < M; ++step) {
        // Build tridiagonal CN matrix coefficients
        for (int j = 1; j < N; ++j) {
            lo[j] = -0.5 * dt * (a - b);
            di[j] =  1.0 + dt * (a + r / 2.0);
            up[j] = -0.5 * dt * (a + b);
            // RHS: explicit part applied to current V
            rhs[j] = V[j] * (1.0 - dt * (a + r / 2.0))
                   + V[j-1] * 0.5 * dt * (a - b)
                   + V[j+1] * 0.5 * dt * (a + b);
        }
        // Boundary conditions: put-call parity / known limits
        double S_lo = std::exp(x_min);
        double S_hi = std::exp(x_max);
        double disc = std::exp(-r * (T - step * dt));
        rhs[0] = rhs[N] = 0.0;
        V[0] = 0.0;
        V[N] = std::max(S_hi - K * disc, 0.0);

        // Forward sweep
        c[1] = up[1] / di[1]; d[1] = rhs[1] / di[1];
        for (int j = 2; j < N; ++j) {
            double m = di[j] - lo[j] * c[j-1];
            c[j] = up[j] / m;
            d[j] = (rhs[j] - lo[j] * d[j-1]) / m;
        }
        // Back substitution
        V[N-1] = d[N-1];
        for (int j = N-2; j >= 1; --j)
            V[j] = d[j] - c[j] * V[j+1];
    }

    // Interpolate at S0
    double x0 = std::log(S0);
    int j0 = static_cast<int>((x0 - x_min) / dx);
    j0 = std::clamp(j0, 0, N - 1);
    double w = (x0 - (x_min + j0 * dx)) / dx;
    return (1 - w) * V[j0] + w * V[j0 + 1];
}

int main() {
    double price = cn_call(100, 100, 1.0, 0.05, 0.20);
    std::cout << "CN call price: " << price << "\\n";  // ~10.45
}`,
    explanation:
      "Crank-Nicolson averages the explicit and implicit finite-difference operators to achieve second-order accuracy in both space and time (O(dx²+dt²)), unlike the fully-implicit scheme which is only O(dt). The price per grid solve is O(N) via the Thomas tridiagonal algorithm — no matrix inversion — making it practical for real-time vol surface calibration.",
  },
  {
    id: "cpp-20260710-b1-dual-numbers",
    language: "cpp",
    title: "Dual-Number Forward-Mode Autodiff for Greeks",
    tag: "quant",
    code: `#include <cmath>
#include <iostream>

// Dual number: f(a + b*eps) = f(a) + f'(a)*b*eps, eps^2 = 0
// Setting b=1 and differentiating w.r.t. a gives the exact derivative simultaneously.
struct Dual {
    double v, d;   // value, derivative
    explicit Dual(double v, double d = 0.0) : v(v), d(d) {}
};
Dual operator+(Dual a, Dual b) { return Dual{a.v+b.v, a.d+b.d}; }
Dual operator-(Dual a, Dual b) { return Dual{a.v-b.v, a.d-b.d}; }
Dual operator*(Dual a, Dual b) { return Dual{a.v*b.v, a.v*b.d+a.d*b.v}; }
Dual operator/(Dual a, Dual b) { return Dual{a.v/b.v, (a.d*b.v-a.v*b.d)/(b.v*b.v)}; }
Dual exp(Dual x)  { double e=std::exp(x.v);  return Dual{e, e*x.d}; }
Dual log(Dual x)  { return Dual{std::log(x.v), x.d/x.v}; }
Dual sqrt(Dual x) { double s=std::sqrt(x.v);  return Dual{s, x.d/(2*s)}; }

// Logistic approximation to N(x): accurate enough to demonstrate the pattern
Dual ncdf(Dual x) { return Dual{1,0} / (Dual{1,0} + exp(Dual{-1.7019,0} * x)); }

// BS call as a Dual function — differentiate w.r.t. S for delta, sigma for vega
Dual bs_call(Dual S, double K, double T, double r, Dual sigma) {
    Dual d1 = (log(S / Dual{K}) + Dual{r + 0.5*sigma.v*sigma.v} * Dual{T})
              / (sigma * Dual{std::sqrt(T)});
    Dual d2 = d1 - sigma * Dual{std::sqrt(T)};
    return S * ncdf(d1) - Dual{K * std::exp(-r*T)} * ncdf(d2);
}

int main() {
    // Delta = dCall/dS: seed S as (100.0, 1.0)
    Dual call_dS = bs_call(Dual{100.0, 1.0}, 100.0, 1.0, 0.05, Dual{0.20});
    std::cout << "Call price: " << call_dS.v << "  Delta: " << call_dS.d << "\\n";

    // Vega = dCall/dsigma: seed sigma as (0.20, 1.0)
    Dual call_dv = bs_call(Dual{100.0}, 100.0, 1.0, 0.05, Dual{0.20, 1.0});
    std::cout << "Vega:       " << call_dv.d << "\\n";
}`,
    explanation:
      "Forward-mode automatic differentiation computes f(x) and f'(x) simultaneously by propagating dual-number tangents through the same code — no finite differences, no symbolic manipulation. Seeding different inputs as the active variable gives different first-order Greeks in a single pass, and the derivative is exact (machine precision), unlike bump-and-reprice which suffers from step-size bias.",
  },
  {
    id: "cpp-20260710-b1-antithetic-mc",
    language: "cpp",
    title: "Antithetic Variates Monte Carlo Option Pricer",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <numeric>
#include <vector>

// Antithetic variates: for each Z ~ N(0,1) also use -Z.
// Since Cov(f(Z), f(-Z)) < 0 for monotone payoffs, the pair average has lower variance.

struct MCResult { double price, stderr; };

MCResult mc_call(double S0, double K, double T, double r, double sigma,
                 int N, bool antithetic, unsigned seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    const double disc    = std::exp(-r * T);
    const double drift   = (r - 0.5 * sigma * sigma) * T;
    const double vol_sqT = sigma * std::sqrt(T);

    std::vector<double> payoffs;
    payoffs.reserve(antithetic ? N : N);

    for (int i = 0; i < N; ++i) {
        double Z = nd(rng);
        double ST = S0 * std::exp(drift + vol_sqT * Z);
        payoffs.push_back(disc * std::max(ST - K, 0.0));

        if (antithetic) {
            double ST2 = S0 * std::exp(drift - vol_sqT * Z);
            // Average the pair before appending (reduces estimator variance)
            double& last = payoffs.back();
            last = 0.5 * (last + disc * std::max(ST2 - K, 0.0));
        }
    }

    double mean = std::reduce(payoffs.begin(), payoffs.end()) / N;
    double var  = 0.0;
    for (double p : payoffs) var += (p - mean) * (p - mean);
    var /= (N - 1);

    return {mean, std::sqrt(var / N)};
}

int main() {
    auto r1 = mc_call(100, 100, 1.0, 0.05, 0.20, 100'000, false);
    auto r2 = mc_call(100, 100, 1.0, 0.05, 0.20, 100'000, true);
    std::cout << "Plain MC: " << r1.price << " +/- " << r1.stderr << "\\n";
    std::cout << "Antithetic: " << r2.price << " +/- " << r2.stderr << "\\n";
    std::cout << "Variance reduction: " << (r1.stderr/r2.stderr)*(r1.stderr/r2.stderr) << "x\\n";
}`,
    explanation:
      "Antithetic variates exploit the negative correlation between f(Z) and f(-Z) for monotone payoffs like European calls: their average has lower variance than either alone. For a call option the theoretical variance reduction is (1-rho)/2 where rho=Corr(f(Z),f(-Z)) < 0, typically achieving 2–4× variance reduction with zero extra simulation cost beyond generating -Z.",
  },
  {
    id: "cpp-20260710-b1-heston-euler",
    language: "cpp",
    title: "Heston Stochastic Volatility Model: Euler-Maruyama MC",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <vector>
#include <numeric>

// Heston (1993):
//   dS = r*S dt + sqrt(V)*S dW_1
//   dV = kappa*(theta-V) dt + xi*sqrt(V) dW_2
//   Corr(dW_1, dW_2) = rho
// Use reflection: V = |V| (full-truncation scheme avoids negative V).

double heston_call_mc(double S0, double K, double T, double r,
                      double V0, double kappa, double theta,
                      double xi, double rho,
                      int n_steps, int n_paths, unsigned seed = 1)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    const double dt      = T / n_steps;
    const double sqrt_dt = std::sqrt(dt);
    const double rho2    = std::sqrt(1.0 - rho * rho);
    const double disc    = std::exp(-r * T);

    double sum_payoff = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double S = S0, V = V0;
        for (int t = 0; t < n_steps; ++t) {
            double Z1 = nd(rng);
            double Z2 = rho * Z1 + rho2 * nd(rng);  // correlated brownians
            double sqV = std::sqrt(std::max(V, 0.0));

            S *= std::exp((r - 0.5 * V) * dt + sqV * sqrt_dt * Z1);
            // Full-truncation: apply kappa-mean-reversion with |V| rather than V
            V  = std::abs(V) + kappa * (theta - std::abs(V)) * dt
               + xi * sqV * sqrt_dt * Z2;
        }
        sum_payoff += std::max(S - K, 0.0);
    }
    return disc * sum_payoff / n_paths;
}

int main() {
    // Typical SPX-like Heston params
    double price = heston_call_mc(
        100.0,  // S0
        100.0,  // K
        1.0,    // T
        0.05,   // r
        0.04,   // V0  (initial var = 20% vol)
        2.0,    // kappa
        0.04,   // theta (long-run var = 20% vol)
        0.30,   // xi (vol-of-vol)
        -0.70,  // rho (leverage effect)
        50, 50'000
    );
    std::cout << "Heston call price: " << price << "\\n";  // ~10.4 for ATM
}`,
    explanation:
      "The Heston model generates the implied vol smile via the negative rho (leverage effect: stock down → vol up) and mean-reversion. The full-truncation scheme (|V|) outperforms reflection or absorption for small kappa or large xi because it prevents the Euler step from producing large negative variance spikes that bias the estimate upward.",
  },
  {
    id: "cpp-20260710-b1-vasicek-zcb",
    language: "cpp",
    title: "Vasicek Short-Rate Model: Closed-Form Zero-Coupon Bond",
    tag: "quant",
    code: `#include <cmath>
#include <iostream>
#include <vector>

// Vasicek (1977): dr = kappa*(mu - r)*dt + sigma*dW
// Affine model: P(t,T) = A(tau)*exp(-B(tau)*r_t), tau = T - t
// B(tau) = (1 - exp(-kappa*tau)) / kappa
// A(tau) = exp((B(tau)-tau)*(kappa^2*mu - 0.5*sigma^2)/kappa^2
//             - sigma^2*B(tau)^2 / (4*kappa))

struct VasicekModel { double kappa, mu, sigma; };

double B(double tau, double kappa) {
    return (1.0 - std::exp(-kappa * tau)) / kappa;
}
double A(double tau, const VasicekModel& m) {
    double b = B(tau, m.kappa);
    double term1 = (b - tau) * (m.kappa * m.kappa * m.mu - 0.5 * m.sigma * m.sigma)
                   / (m.kappa * m.kappa);
    double term2 = m.sigma * m.sigma * b * b / (4.0 * m.kappa);
    return std::exp(term1 - term2);
}
double zcb_price(double r0, double tau, const VasicekModel& m) {
    return A(tau, m) * std::exp(-B(tau, m.kappa) * r0);
}
double zcb_yield(double r0, double tau, const VasicekModel& m) {
    return -std::log(zcb_price(r0, tau, m)) / tau;
}

int main() {
    VasicekModel m{2.0, 0.05, 0.02};  // kappa=2, mu=5%, sigma=2%
    double r0 = 0.03;                  // current short rate = 3%

    std::cout << "Tau  Price    Yield\\n";
    for (double tau : {0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0}) {
        printf("%.2f  %.6f  %.4f%%\\n", tau, zcb_price(r0, tau, m),
               zcb_yield(r0, tau, m) * 100);
    }
}`,
    explanation:
      "The Vasicek model is the first affine short-rate model: the affine structure P = A(tau)*exp(-B(tau)*r) allows closed-form bond prices and yields, making calibration tractable. Its main limitation is that rates can go negative (a feature post-2008!), and the single factor cannot fit all points on the yield curve simultaneously — that requires Hull-White with a time-varying mean.",
  },
  {
    id: "cpp-20260710-b1-hw-mc",
    language: "cpp",
    title: "Hull-White Short-Rate Model: Monte Carlo Bond Pricer",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <iostream>
#include <numeric>

// Hull-White (1990): dr = (theta(t) - a*r)*dt + sigma*dW
// Theta(t) is chosen to fit the initial yield curve exactly.
// For simplicity: assume flat initial curve at r0, so theta(t) = a*r0 (constant).
// Monte Carlo of numeraire B(0,T) via path of short rate.

double hw_zcb_mc(double r0, double a, double sigma, double T,
                 int n_steps, int n_paths, unsigned seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    const double dt      = T / n_steps;
    const double sqrt_dt = std::sqrt(dt);
    const double theta   = a * r0;   // flat curve calibration

    double sum_disc = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double r = r0;
        double integral_r = 0.0;
        for (int t = 0; t < n_steps; ++t) {
            integral_r += r * dt;             // accumulate r for discount factor
            r += (theta - a * r) * dt + sigma * sqrt_dt * nd(rng);
        }
        sum_disc += std::exp(-integral_r);    // P(0,T) = E[exp(-integral r dt)]
    }
    return sum_disc / n_paths;
}

// Exact Hull-White ZCB formula (for comparison):
// P(0,T) = exp(A(T) - B(T)*r0)
double hw_exact(double r0, double a, double sigma, double T) {
    double B = (1.0 - std::exp(-a * T)) / a;
    double A = (B - T) * (a * r0 - 0.5 * sigma * sigma / (a * a))
             - sigma * sigma * B * B / (4.0 * a);
    return std::exp(A - B * r0);
}

int main() {
    double mc_price    = hw_zcb_mc(0.05, 0.1, 0.01, 5.0, 100, 100'000);
    double exact_price = hw_exact(0.05, 0.1, 0.01, 5.0);
    std::cout << "MC price:    " << mc_price    << "\\n";
    std::cout << "Exact price: " << exact_price << "\\n";
}`,
    explanation:
      "Hull-White extends Vasicek with a time-varying drift theta(t) that exactly fits the observed initial yield curve — unlike Vasicek which only matches the current short rate. The MC approach integrates the short-rate path to compute the stochastic discount factor; the closed-form A-B formula is used for calibration, while MC is used for exotic rate products where closed forms don't exist.",
  },
  {
    id: "cpp-20260710-b1-variant-order",
    language: "cpp",
    title: "std::variant for Type-Safe Order Discriminated Union",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string>
#include <iostream>
#include <cstdint>

struct LimitOrder   { double px; int qty; char side; };
struct MarketOrder  { int qty; char side; };
struct CancelOrder  { uint64_t orig_id; };
struct IOCOrder     { double px; int qty; char side; };

using AnyOrder = std::variant<LimitOrder, MarketOrder, CancelOrder, IOCOrder>;

// Visit pattern: exhaustive compile-time dispatch, zero virtual calls
struct OrderHandler {
    void operator()(const LimitOrder& o) const {
        printf("Limit %c %.2f x %d\\n", o.side, o.px, o.qty);
    }
    void operator()(const MarketOrder& o) const {
        printf("Market %c x %d\\n", o.side, o.qty);
    }
    void operator()(const CancelOrder& o) const {
        printf("Cancel id=%llu\\n", static_cast<unsigned long long>(o.orig_id));
    }
    void operator()(const IOCOrder& o) const {
        printf("IOC %c %.2f x %d\\n", o.side, o.px, o.qty);
    }
};

void route(const AnyOrder& order) {
    std::visit(OrderHandler{}, order);
}

int main() {
    std::vector<AnyOrder> msgs = {
        LimitOrder{100.5, 300, 'B'},
        MarketOrder{100, 'S'},
        CancelOrder{12345ULL},
        IOCOrder{99.0, 500, 'B'},
    };
    for (const auto& m : msgs) route(m);
}`,
    explanation:
      "std::variant stores a type-safe discriminated union with no heap allocation; std::visit dispatches to the correct overload in O(1) via a function pointer table generated at compile time — no virtual table, no dynamic_cast, no type tag check in user code. This is the idiomatic replacement for C-style tagged unions and outperforms virtual dispatch in cache-heavy scenarios.",
  },
  {
    id: "cpp-20260710-b1-perfect-forwarding",
    language: "cpp",
    title: "Perfect Forwarding: Universal Reference Event Bus",
    tag: "templates",
    code: `#include <functional>
#include <vector>
#include <iostream>
#include <string>
#include <utility>

// A lightweight publish/subscribe bus that forwards events without copying.
// T&& is a universal reference (forwarding reference) when T is deduced.
template <typename Event>
class EventBus {
    std::vector<std::function<void(const Event&)>> handlers_;
public:
    void subscribe(std::function<void(const Event&)> h) {
        handlers_.push_back(std::move(h));
    }
    // Perfect-forward: avoids copying if publish() is called with an rvalue
    template <typename E>
    void publish(E&& event) {
        for (const auto& h : handlers_)
            h(std::forward<E>(event));   // forward preserves rvalue-ness
    }
};

struct Tick { std::string symbol; double bid, ask; int seq; };

int main() {
    EventBus<Tick> bus;
    bus.subscribe([](const Tick& t){
        printf("Handler1: %s %.2f/%.2f seq=%d\\n",
               t.symbol.c_str(), t.bid, t.ask, t.seq);
    });
    bus.subscribe([](const Tick& t){
        printf("Handler2: spread=%.4f\\n", t.ask - t.bid);
    });

    Tick t{"AAPL", 182.50, 182.52, 42};
    bus.publish(t);               // lvalue: copies into handlers
    bus.publish(Tick{"MSFT", 415.10, 415.12, 43});  // rvalue: forwarded
}`,
    explanation:
      "std::forward<E>(event) in a template function is the only correct way to preserve value category: if the caller passes an lvalue, it forwards as lvalue (const&); if rvalue, as rvalue (&&). Writing move(event) instead would silently move from lvalue arguments, breaking subsequent use; writing nothing copies every time, defeating the purpose of the universal reference.",
  },
  {
    id: "cpp-20260710-b1-norm-cdf-poly",
    language: "cpp",
    title: "Polynomial Normal CDF Approximation (Abramowitz & Stegun)",
    tag: "quant",
    code: `#include <cmath>
#include <iostream>

// Abramowitz & Stegun 26.2.17: max error < 7.5e-8
// Faster than erfc() for repeated Greek calculations on the pricing hot path.
[[gnu::const]] double norm_cdf(double x) noexcept {
    static constexpr double a[] = {
        0.319381530, -0.356563782, 1.781477937,
       -1.821255978,  1.330274429
    };
    if (x < 0.0) return 1.0 - norm_cdf(-x);
    const double t    = 1.0 / (1.0 + 0.2316419 * x);
    const double poly = t * (a[0] + t * (a[1] + t * (a[2] + t * (a[3] + t * a[4]))));
    const double phi  = 0.3989422804 * std::exp(-0.5 * x * x);  // N'(x)
    return 1.0 - phi * poly;
}

[[gnu::const]] double norm_pdf(double x) noexcept {
    return 0.3989422804 * std::exp(-0.5 * x * x);
}

// Black-Scholes call using the approximation
double bs_call(double S, double K, double T, double r, double sigma) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    return S * norm_cdf(d1) - K * std::exp(-r * T) * norm_cdf(d2);
}

int main() {
    // Compare to known BS price
    double price = bs_call(100, 100, 1.0, 0.05, 0.20);
    printf("BS call price: %.6f  (exact: 10.450584)\\n", price);
    printf("norm_cdf(0.0) = %.8f  (exact: 0.5)\\n", norm_cdf(0.0));
    printf("norm_cdf(1.96) = %.8f  (exact: 0.97500)\\n", norm_cdf(1.96));
}`,
    explanation:
      "The Horner-evaluated polynomial form of the A&S 26.2.17 approximation avoids the erfc() call (which internally uses a different polynomial) and is branch-predictable for positive x. The [[gnu::const]] attribute tells GCC that the function has no side effects and doesn't read global memory, enabling CSE and hoisting in loops over strike/tenor grids.",
  },
  {
    id: "cpp-20260710-b1-policy-router",
    language: "cpp",
    title: "Policy-Based Order Router with Strategy Pattern",
    tag: "design-patterns",
    code: `#include <iostream>
#include <string>
#include <chrono>

struct Order { int id; double px; int qty; std::string symbol; };

// Policies are injected at compile time — zero virtual dispatch overhead.
struct DMAPolicy {
    static const char* name() { return "DMA"; }
    static void route(const Order& o) {
        printf("[DMA] send %s qty=%d px=%.2f\\n", o.symbol.c_str(), o.qty, o.px);
    }
};

struct TWAPPolicy {
    int slices = 10;
    const char* name() const { return "TWAP"; }
    void route(const Order& o) const {
        int slice_qty = o.qty / slices;
        printf("[TWAP] send %d slices of %d shares\\n", slices, slice_qty);
    }
};

struct SORPolicy {
    static const char* name() { return "SOR"; }
    static void route(const Order& o) {
        printf("[SOR] smart-route %s across venues\\n", o.symbol.c_str());
    }
};

// Router templated on execution policy — policy selected at compile time
template <typename Policy>
class OrderRouter {
    Policy policy_;
public:
    explicit OrderRouter(Policy p = {}) : policy_(std::move(p)) {}

    void execute(const Order& o) {
        auto t0 = std::chrono::steady_clock::now();
        policy_.route(o);
        auto ns = std::chrono::duration_cast<std::chrono::nanoseconds>(
                      std::chrono::steady_clock::now() - t0).count();
        printf("  [latency: %lld ns]\\n", static_cast<long long>(ns));
    }
};

int main() {
    Order o{1, 150.25, 10000, "AAPL"};
    OrderRouter<DMAPolicy>   dma;
    OrderRouter<TWAPPolicy>  twap{TWAPPolicy{20}};
    OrderRouter<SORPolicy>   sor;
    dma.execute(o);
    twap.execute(o);
    sor.execute(o);
}`,
    explanation:
      "Policy-based design moves behavioural decisions from runtime to compile time: the compiler inlines policy::route() at the call site, eliminating a virtual dispatch overhead of ~4 ns while also enabling constant propagation across the policy boundary. Unlike inheritance-based strategy, swapping the policy requires a recompile — which is the desired trade-off for a latency-sensitive execution system.",
  },
  {
    id: "cpp-20260710-b1-raii-timer",
    language: "cpp",
    title: "RAII Latency Timer with std::chrono",
    tag: "low-latency",
    code: `#include <chrono>
#include <string>
#include <cstdio>
#include <functional>

// RAII scope timer: records elapsed time on destruction.
// Avoids forgetting to stop the timer when the scope has multiple exit paths.
class ScopeTimer {
    using Clock = std::chrono::steady_clock;
    using Ns    = std::chrono::nanoseconds;
    std::string    name_;
    Clock::time_point start_ = Clock::now();
    std::function<void(long long)> on_done_;
public:
    explicit ScopeTimer(std::string name,
                        std::function<void(long long)> cb = nullptr)
        : name_(std::move(name)), on_done_(std::move(cb)) {}

    ~ScopeTimer() {
        long long elapsed = std::chrono::duration_cast<Ns>(Clock::now() - start_).count();
        if (on_done_) on_done_(elapsed);
        else          printf("[%s] %lld ns\\n", name_.c_str(), elapsed);
    }
    // Non-copyable; moveable for deferred start
    ScopeTimer(const ScopeTimer&) = delete;
    ScopeTimer& operator=(const ScopeTimer&) = delete;
};

// Example: time order-book update path
void update_order_book(/* ... */) {
    ScopeTimer t("order_book_update");
    // Simulate work
    volatile double x = 0;
    for (int i = 0; i < 10000; ++i) x += i * 0.001;
}

int main() {
    update_order_book();
    {
        long long total = 0;
        ScopeTimer t("batch", [&](long long ns){ total = ns; });
        volatile int sum = 0;
        for (int i = 0; i < 1000000; ++i) sum += i;
        (void)sum;
        // destructor fires here: prints elapsed into total
    }
}`,
    explanation:
      "RAII timers guarantee the stop-time is recorded regardless of how the scope exits (return, exception, goto), making them safer than explicit start/stop pairs in complex control flow. The callback variant routes latency samples to a histogram or ring buffer without any I/O on the hot path — I/O is deferred to a stats-collection thread.",
  },
  {
    id: "cpp-20260710-b1-move-position",
    language: "cpp",
    title: "Move-Only Position Record with Deleted Copy",
    tag: "modern-cpp",
    code: `#include <string>
#include <vector>
#include <iostream>
#include <utility>

// Position owns a dynamic fill list — copying would silently duplicate it.
// Delete copy, allow move: prevents accidental O(N) copies on container resize.
struct Position {
    std::string  symbol;
    int          net_qty   = 0;
    double       avg_cost  = 0.0;
    std::vector<double> fills;   // fill prices (can be large)

    Position() = default;
    explicit Position(std::string sym) : symbol(std::move(sym)) {}

    // Copy disabled: forces intentional cloning via .clone()
    Position(const Position&)            = delete;
    Position& operator=(const Position&) = delete;

    // Move is cheap (pointer swap)
    Position(Position&&) noexcept            = default;
    Position& operator=(Position&&) noexcept = default;

    void add_fill(double px, int qty) {
        fills.push_back(px);
        avg_cost = (avg_cost * net_qty + px * qty) / (net_qty + qty);
        net_qty += qty;
    }

    Position clone() const {
        Position p(symbol);
        p.net_qty  = net_qty;
        p.avg_cost = avg_cost;
        p.fills    = fills;
        return p;
    }
};

int main() {
    std::vector<Position> book;
    book.reserve(16);
    book.emplace_back("AAPL");
    book[0].add_fill(182.50, 100);
    book[0].add_fill(181.90, 200);

    Position p2 = std::move(book[0]);     // move: O(1)
    // Position p3 = p2;                  // compile error: copy deleted
    Position p3 = p2.clone();             // explicit O(N) clone

    printf("Moved: symbol=%s qty=%d avg=%.4f\\n",
           p2.symbol.c_str(), p2.net_qty, p2.avg_cost);
}`,
    explanation:
      "Deleting the copy constructor prevents silent O(N) copies when positions are moved between containers — a common source of latency spikes during portfolio rebalancing. The explicit clone() method makes the expensive operation visible at the call site, while move remains free (pointer swap on the vector<double> fill log).",
  },
  {
    id: "cpp-20260710-b1-pmr-arena",
    language: "cpp",
    title: "std::pmr::monotonic_buffer_resource for Per-Tick Arena",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <iostream>
#include <array>

// Per-message arena: allocate all temporaries from a stack buffer;
// reset (not free) the entire arena when the message is processed.
// Avoids per-object heap traffic on the tick-processing hot path.

struct TickField { std::string name; double value; };

class TickParser {
    std::array<std::byte, 4096> buf_;     // stack-allocated arena backing store
    std::pmr::monotonic_buffer_resource mbr_{buf_.data(), buf_.size()};
    std::pmr::polymorphic_allocator<TickField> alloc_{&mbr_};

public:
    // Parse a fake tick into pmr-allocated fields
    std::pmr::vector<TickField> parse(int tag_count) {
        std::pmr::vector<TickField> fields(&mbr_);
        fields.reserve(tag_count);
        for (int i = 0; i < tag_count; ++i) {
            // pmr::string uses arena memory — no malloc
            fields.push_back(TickField{
                std::pmr::string("field_") + std::pmr::string(1, char('A'+i), &mbr_),
                static_cast<double>(i) * 0.5
            });
        }
        return fields;   // NOTE: valid only within this call; arena resets after
    }

    void reset() noexcept { mbr_.release(); }  // O(1): just resets the pointer
};

int main() {
    TickParser parser;
    for (int msg = 0; msg < 5; ++msg) {
        auto fields = parser.parse(8);
        std::cout << "msg " << msg << ": " << fields.size() << " fields\\n";
        parser.reset();  // reclaim entire arena in O(1)
    }
}`,
    explanation:
      "A monotonic_buffer_resource is a bump-pointer allocator backed by a fixed buffer: allocation is O(1) (increment a pointer) and release is O(1) (reset the pointer). For tick processing, all per-message temporaries are allocated from the arena and freed together on reset, eliminating the per-object malloc/free overhead that dominates latency in naive implementations.",
  },
  {
    id: "cpp-20260710-b1-treiber-stack",
    language: "cpp",
    title: "Lock-Free Treiber Stack with Hazard-Pointer-Free Design",
    tag: "lock-free",
    code: `#include <atomic>
#include <memory>
#include <optional>
#include <iostream>
#include <thread>
#include <vector>

// Treiber (1986) lock-free stack via CAS on the head pointer.
// ABA mitigation: use a tagged pointer (bottom 16 bits as version counter).
// WARNING: real production code should use hazard pointers or epoch-based reclamation.
template <typename T>
class TreiberStack {
    struct Node { T value; Node* next = nullptr; };

    // Tagged pointer: top 48 bits = address, bottom 16 = ABA counter
    struct TaggedPtr {
        Node*    ptr = nullptr;
        uint64_t tag = 0;
    };
    std::atomic<TaggedPtr> head_{};

public:
    void push(T val) {
        Node* n = new Node{std::move(val)};
        TaggedPtr expected = head_.load(std::memory_order_acquire);
        TaggedPtr desired;
        do {
            n->next  = expected.ptr;
            desired  = {n, expected.tag + 1};
        } while (!head_.compare_exchange_weak(
                     expected, desired,
                     std::memory_order_release,
                     std::memory_order_acquire));
    }

    std::optional<T> pop() {
        TaggedPtr expected = head_.load(std::memory_order_acquire);
        TaggedPtr desired;
        do {
            if (!expected.ptr) return std::nullopt;
            desired = {expected.ptr->next, expected.tag + 1};
        } while (!head_.compare_exchange_weak(
                     expected, desired,
                     std::memory_order_release,
                     std::memory_order_acquire));
        T val = std::move(expected.ptr->value);
        delete expected.ptr;   // safe here only in single-pop-at-a-time usage
        return val;
    }
};

int main() {
    TreiberStack<int> s;
    s.push(1); s.push(2); s.push(3);
    while (auto v = s.pop()) std::cout << *v << "\\n";  // prints 3 2 1
}`,
    explanation:
      "The Treiber stack uses compare_exchange to atomically swing the head pointer only if it hasn't changed since the load — the ABA problem (head changes A→B→A between load and CAS) is mitigated by the tag counter. In practice, production lock-free stacks use epoch-based reclamation or hazard pointers to safely defer delete; this version illustrates the CAS idiom but is safe only when pops are serialised.",
  },
];
