import type { Snippet } from "./types";

export const cppSnippets20260702B1: Snippet[] = [
  {
    id: "cpp-20260702-b1-concepts-numeric",
    language: "cpp",
    title: "C++20 Concepts for Numeric Constraint Enforcement",
    tag: "concepts",
    code: `#include <concepts>
#include <iostream>
#include <cmath>

// Define a concept: type must be floating-point and arithmetic
template <typename T>
concept FloatLike = std::floating_point<T>;

template <typename T>
concept Priceable = FloatLike<T> && requires(T a, T b) {
    { a + b } -> FloatLike;
    { a * b } -> FloatLike;
    { a > b } -> std::convertible_to<bool>;
};

// Constrained function — compile error if called with int or string
template <Priceable T>
T black_scholes_d1(T S, T K, T r, T T_exp, T sigma) {
    return (std::log(S / K) + (r + T(0.5) * sigma * sigma) * T_exp)
           / (sigma * std::sqrt(T_exp));
}

// Concept-constrained class: only works for floating types
template <Priceable T>
struct PriceLevel {
    T bid, ask;
    T mid() const { return (bid + ask) / T(2); }
    T spread() const { return ask - bid; }
};

int main() {
    double d1 = black_scholes_d1(100.0, 100.0, 0.05, 1.0, 0.20);
    std::cout << "d1 = " << d1 << "\\n";  // ~0.35

    PriceLevel<double> lvl{99.95, 100.05};
    std::cout << "Mid: " << lvl.mid() << "  Spread: " << lvl.spread() << "\\n";

    // black_scholes_d1(100, 100, 0, 1, 0); // compile error: int != FloatLike
}`,
    explanation: "C++20 Concepts replace SFINAE with readable constraints: the compiler emits a clear error message naming the failed concept rather than a multi-page substitution failure. In quant codebases this prevents silent narrowing conversions (e.g., passing integer quantities to pricing functions expecting doubles) that cause subtle P&L errors.",
  },
  {
    id: "cpp-20260702-b1-alloc-pool",
    language: "cpp",
    title: "Slab / Pool Allocator for Order Objects",
    tag: "allocators",
    code: `#include <cstdlib>
#include <cstdint>
#include <cassert>
#include <iostream>
#include <new>

// Fixed-size slab allocator: pre-allocates a pool of N objects of size T.
// Allocation is O(1) (pop free-list), deallocation O(1) (push free-list).
// Avoids heap fragmentation and lock contention in the hot order path.
template <typename T, std::size_t N>
class SlabAllocator {
    union Slot {
        alignas(T) char storage[sizeof(T)];
        Slot* next;
    };
    Slot  pool[N];
    Slot* free_head;
    std::size_t allocated_ = 0;

public:
    SlabAllocator() {
        // Build intrusive free list through pool
        for (std::size_t i = 0; i < N - 1; ++i)
            pool[i].next = &pool[i + 1];
        pool[N - 1].next = nullptr;
        free_head = &pool[0];
    }

    T* allocate() {
        if (!free_head) return nullptr; // pool exhausted
        Slot* s = free_head;
        free_head = s->next;
        ++allocated_;
        return reinterpret_cast<T*>(s->storage);
    }

    void deallocate(T* ptr) {
        ptr->~T(); // explicitly destroy
        auto* s = reinterpret_cast<Slot*>(ptr);
        s->next   = free_head;
        free_head = s;
        --allocated_;
    }

    std::size_t allocated() const { return allocated_; }
    std::size_t capacity()  const { return N; }
};

struct Order {
    uint64_t id;
    double   price;
    int      qty;
    char     side;
};

int main() {
    SlabAllocator<Order, 1024> pool;
    Order* o1 = new (pool.allocate()) Order{1, 100.25, 500, 'B'};
    Order* o2 = new (pool.allocate()) Order{2, 100.30, 200, 'S'};
    std::cout << "Orders: " << pool.allocated() << " / " << pool.capacity() << "\\n";
    std::cout << "o1: " << o1->price << " x " << o1->qty << "\\n";
    pool.deallocate(o1);
    std::cout << "After free: " << pool.allocated() << "\\n";
    pool.deallocate(o2);
}`,
    explanation: "Pool allocators pre-allocate fixed-size blocks, eliminating heap lock contention and fragmentation on the critical order-creation path. The intrusive free-list stores the next pointer inside the free slots themselves, so there is zero metadata overhead per allocated object — essential when creating/destroying orders at millions per second.",
  },
  {
    id: "cpp-20260702-b1-sfinae-has-method",
    language: "cpp",
    title: "SFINAE Detection Idiom for Optional price() Method",
    tag: "SFINAE",
    code: `#include <type_traits>
#include <iostream>

// Detection idiom (pre-C++20): check if T has a .price() method
// returning something convertible to double
template <typename T, typename = void>
struct has_price_method : std::false_type {};

template <typename T>
struct has_price_method<T, std::void_t<decltype(std::declval<const T&>().price())>>
    : std::true_type {};

// Generic pricer: dispatches based on whether T has price() or is arithmetic
template <typename T>
double get_price(const T& instrument) {
    if constexpr (has_price_method<T>::value) {
        return static_cast<double>(instrument.price());
    } else if constexpr (std::is_arithmetic_v<T>) {
        return static_cast<double>(instrument);
    } else {
        static_assert(sizeof(T) == 0, "Type has no price() and is not arithmetic");
    }
}

struct Bond {
    double face, rate, maturity;
    double price() const { return face * std::exp(-rate * maturity); }
};

struct SpotQuote {
    double mid; // arithmetic-like — no price() method
};

int main() {
    Bond     bond{1000.0, 0.05, 5.0};
    SpotQuote sq{100.25};

    std::cout << "Bond price:  " << get_price(bond) << "\\n"; // ~778.8
    std::cout << "Spot quote:  " << get_price(sq.mid) << "\\n"; // 100.25
    std::cout << "Bond has price()? " << has_price_method<Bond>::value << "\\n";
    std::cout << "int   has price()? " << has_price_method<int>::value << "\\n";
}`,
    explanation: "SFINAE detection via std::void_t introspects a type's interface at compile time without requiring a base class or virtual methods. This is the C++17 technique for building generic adapters that work with both instrument types that implement a price() method and raw numeric prices — superseded but complementary to C++20 Concepts.",
  },
  {
    id: "cpp-20260702-b1-order-book-intrusive",
    language: "cpp",
    title: "Intrusive Doubly-Linked List Order Book Level",
    tag: "data-structures",
    code: `#include <iostream>
#include <cassert>
#include <cstdint>

// Intrusive list: the node pointers live inside the Order struct itself.
// Avoids allocating separate list-node wrappers — critical for HFT where
// every allocation on the order path adds microseconds of jitter.

struct Order {
    uint64_t id;
    double   price;
    int      qty;
    Order*   prev = nullptr;
    Order*   next = nullptr;
};

struct PriceLevel {
    double  price;
    int     total_qty = 0;
    Order*  head = nullptr; // oldest (FIFO front)
    Order*  tail = nullptr; // newest

    void enqueue(Order* o) {
        o->prev = tail;
        o->next = nullptr;
        if (tail) tail->next = o;
        else       head = o;
        tail = o;
        total_qty += o->qty;
    }

    void remove(Order* o) {
        if (o->prev) o->prev->next = o->next;
        else         head = o->next;
        if (o->next) o->next->prev = o->prev;
        else         tail = o->prev;
        o->prev = o->next = nullptr;
        total_qty -= o->qty;
    }

    void print() const {
        std::cout << "Level " << price << " [total=" << total_qty << "]: ";
        for (Order* o = head; o; o = o->next)
            std::cout << o->id << "(" << o->qty << ") ";
        std::cout << "\\n";
    }
};

int main() {
    Order orders[] = {{1, 100.0, 200}, {2, 100.0, 300}, {3, 100.0, 100}};
    PriceLevel lvl{100.0};
    for (auto& o : orders) lvl.enqueue(&o);
    lvl.print(); // 1(200) 2(300) 3(100)

    lvl.remove(&orders[1]); // cancel order 2
    lvl.print(); // 1(200) 3(100), total=300
}`,
    explanation: "Intrusive linked lists embed prev/next pointers directly in the Order struct, eliminating separate node allocation entirely. In a price-level with thousands of cancels and inserts per second, avoiding malloc/free on each order is the dominant latency win, and the data stays cache-hot since Order and its list linkage share the same cache line.",
  },
  {
    id: "cpp-20260702-b1-huge-pages",
    language: "cpp",
    title: "Huge Pages via mmap for Market-Data Ring Buffer",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <unistd.h>
#include <cstring>
#include <iostream>
#include <cstdint>
#include <stdexcept>

// Allocate memory backed by 2MB huge pages to reduce TLB pressure.
// A ring buffer for market-data ticks benefits enormously: the entire
// buffer may fit in a single TLB entry instead of thousands.
constexpr std::size_t HUGE_PAGE = 2UL * 1024 * 1024; // 2 MiB

void* alloc_huge(std::size_t bytes) {
    // Round up to huge page boundary
    std::size_t aligned = ((bytes + HUGE_PAGE - 1) / HUGE_PAGE) * HUGE_PAGE;
    void* p = mmap(nullptr, aligned,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                   -1, 0);
    if (p == MAP_FAILED) {
        // Fallback: regular allocation (huge pages may not be configured)
        p = mmap(nullptr, aligned, PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (p == MAP_FAILED) throw std::bad_alloc();
        std::cerr << "[warn] Huge pages unavailable, using regular mmap\\n";
    }
    return p;
}

struct Tick {
    uint64_t seq;
    double   bid, ask;
    int      bid_sz, ask_sz;
};

int main() {
    constexpr int   RING_SIZE = 1 << 16; // 65536 ticks
    std::size_t     buf_bytes = RING_SIZE * sizeof(Tick);

    Tick* ring = static_cast<Tick*>(alloc_huge(buf_bytes));
    std::memset(ring, 0, buf_bytes);

    // Simulate writing ticks
    uint64_t head = 0;
    for (int i = 0; i < 10; ++i) {
        ring[head % RING_SIZE] = {head, 100.0 + i*0.01, 100.01 + i*0.01, 100, 100};
        ++head;
    }

    std::cout << "Last tick: seq=" << ring[(head-1) % RING_SIZE].seq
              << " mid=" << (ring[(head-1)%RING_SIZE].bid + ring[(head-1)%RING_SIZE].ask)/2
              << "\\n";

    munmap(ring, ((buf_bytes + HUGE_PAGE - 1) / HUGE_PAGE) * HUGE_PAGE);
}`,
    explanation: "TLB (Translation Lookaside Buffer) misses are a hidden latency killer in market-data processing: with 4KB pages, a 64MB ring buffer requires 16K TLB entries; with 2MB huge pages, just 32. MAP_HUGETLB requests huge pages from the OS huge-page pool (set via /proc/sys/vm/nr_hugepages), reducing TLB miss stalls by 50-100ns per miss.",
  },
  {
    id: "cpp-20260702-b1-memory-order-spsc",
    language: "cpp",
    title: "Lock-Free SPSC Queue with Acquire-Release Memory Ordering",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <iostream>
#include <thread>

// Single-Producer Single-Consumer lock-free queue.
// Uses acquire-release ordering: no sequential consistency needed,
// so no unnecessary full memory barriers are emitted by the CPU.
template <typename T, std::size_t Capacity>
class SPSCQueue {
    static_assert((Capacity & (Capacity - 1)) == 0, "Capacity must be power of 2");
    std::array<T, Capacity>  buffer{};
    std::atomic<std::size_t> head_{0}; // consumer reads head_
    std::atomic<std::size_t> tail_{0}; // producer reads tail_
    static constexpr std::size_t MASK = Capacity - 1;

public:
    // Producer thread only
    bool push(T val) {
        const std::size_t tail = tail_.load(std::memory_order_relaxed);
        const std::size_t next = (tail + 1) & MASK;
        if (next == head_.load(std::memory_order_acquire)) return false; // full
        buffer[tail] = std::move(val);
        tail_.store(next, std::memory_order_release); // publish
        return true;
    }

    // Consumer thread only
    std::optional<T> pop() {
        const std::size_t head = head_.load(std::memory_order_relaxed);
        if (head == tail_.load(std::memory_order_acquire)) return {}; // empty
        T val = buffer[head];
        head_.store((head + 1) & MASK, std::memory_order_release);
        return val;
    }
};

int main() {
    SPSCQueue<int, 1024> q;

    auto producer = [&] {
        for (int i = 0; i < 100; ++i)
            while (!q.push(i)) std::this_thread::yield();
    };

    int sum = 0;
    auto consumer = [&] {
        int received = 0;
        while (received < 100) {
            if (auto v = q.pop()) { sum += *v; ++received; }
        }
    };

    std::thread p(producer), c(consumer);
    p.join(); c.join();
    std::cout << "Sum 0..99 = " << sum << "\\n"; // 4950
}`,
    explanation: "In a SPSC queue only one thread writes head and one writes tail, so acquire-release ordering suffices: the release store on push() synchronises with the acquire load on pop(), establishing the happens-before edge that makes the payload visible without a full memory fence. Sequential consistency (std::memory_order_seq_cst) would add an unnecessary MFENCE on x86.",
  },
  {
    id: "cpp-20260702-b1-fix-parser",
    language: "cpp",
    title: "FIX Protocol Message Parser (Tag=Value, Branchless)",
    tag: "market-data",
    code: `#include <string_view>
#include <cstdint>
#include <iostream>
#include <charconv>

// Lightweight FIX tag=value parser. No allocation, no exception.
// Tags are parsed as integers; values as string_views into the raw buffer.
struct FixMessage {
    double  price   = 0.0;
    int     qty     = 0;
    char    side    = 0;    // '1'=buy, '2'=sell
    uint64_t order_id = 0;

    // Parse a single FIX field "tag=value\x01"
    // Returns number of bytes consumed.
    std::size_t parse_field(std::string_view data) {
        auto sep = data.find('=');
        if (sep == std::string_view::npos) return data.size();
        auto delim = data.find('\x01', sep);
        if (delim == std::string_view::npos) return data.size();

        int tag = 0;
        std::from_chars(data.data(), data.data() + sep, tag);
        std::string_view val = data.substr(sep + 1, delim - sep - 1);

        switch (tag) {
            case 44:  // Price
                std::from_chars(val.data(), val.data() + val.size(), price);
                break;
            case 38:  // OrderQty
                std::from_chars(val.data(), val.data() + val.size(), qty);
                break;
            case 54:  // Side
                side = val.empty() ? 0 : val[0];
                break;
            case 37:  // OrderID
                std::from_chars(val.data(), val.data() + val.size(), order_id);
                break;
        }
        return delim + 1; // consume through delimiter
    }

    void parse(std::string_view raw) {
        while (!raw.empty()) {
            std::size_t n = parse_field(raw);
            raw.remove_prefix(n);
        }
    }
};

int main() {
    // Minimal FIX execution report fields (SOH = \\x01)
    std::string raw = "37=12345\x01""38=500\x01""44=100.25\x01""54=1\x01";
    FixMessage msg;
    msg.parse(raw);
    std::cout << "OrderID=" << msg.order_id
              << " Qty=" << msg.qty
              << " Price=" << msg.price
              << " Side=" << msg.side << "\\n";
}`,
    explanation: "FIX parsing is on the critical path for order flow and market data; std::from_chars is the fastest standard conversion (no locale, no allocation, no exception) and string_view avoids copying the raw buffer. The tag switch dispatches only what we care about — ignoring unknown tags implicitly — making this parser sub-microsecond for typical message sizes.",
  },
  {
    id: "cpp-20260702-b1-perfect-forward",
    language: "cpp",
    title: "Perfect Forwarding in Order Factory Function",
    tag: "perfect-forwarding",
    code: `#include <iostream>
#include <string>
#include <utility>
#include <vector>

struct Order {
    uint64_t    id;
    std::string symbol;  // might be constructed in-place or moved
    double      price;
    int         qty;

    Order(uint64_t i, std::string sym, double p, int q)
        : id(i), symbol(std::move(sym)), price(p), qty(q) {}

    void print() const {
        std::cout << "Order " << id << " " << symbol
                  << " " << qty << "@" << price << "\\n";
    }
};

// Perfect-forwarding factory: constructs Order in-place without copy
template <typename... Args>
Order make_order(Args&&... args) {
    return Order(std::forward<Args>(args)...);
}

// Emplace into vector via perfect forwarding — no temporaries
template <typename Container, typename... Args>
void emplace_order(Container& c, Args&&... args) {
    c.emplace_back(std::forward<Args>(args)...);
}

int main() {
    // Named string: forwarded as lvalue reference
    std::string sym = "AAPL";
    Order o1 = make_order(1UL, sym, 183.45, 100);
    std::cout << "After make_order, sym still alive: " << sym << "\\n";

    // Temporary string: forwarded as rvalue, moved into Order
    Order o2 = make_order(2UL, std::string("MSFT"), 415.0, 200);

    std::vector<Order> orders;
    orders.reserve(10);
    emplace_order(orders, 3UL, "NVDA", 875.0, 50); // constructed in-place
    emplace_order(orders, 4UL, std::string("TSLA"), 250.0, 300);

    for (auto& o : orders) o.print();
}`,
    explanation: "Perfect forwarding (template<typename... Args> with std::forward) preserves the value category of each argument: lvalue references remain lvalue references (no copy), rvalue references remain rvalue references (moved, not copied). In a high-throughput OMS constructing hundreds of thousands of orders per second, this eliminates redundant string copies on the critical path.",
  },
  {
    id: "cpp-20260702-b1-branch-prediction",
    language: "cpp",
    title: "Branch Prediction Hints (__builtin_expect) in Hot Tick Loop",
    tag: "low-latency",
    code: `#include <iostream>
#include <cstdint>
#include <chrono>
#include <vector>
#include <random>

// [[likely]]/[[unlikely]] (C++20) and __builtin_expect guide the CPU's
// static branch predictor. In a tick processing loop, the happy path
// (in-range price, valid seq) is overwhelmingly likely.
struct Tick {
    uint64_t seq;
    double   price;
    bool     valid;
};

// Without hints: compiler doesn't know which branch dominates
uint64_t count_valid_slow(const std::vector<Tick>& ticks, double lo, double hi) {
    uint64_t cnt = 0;
    for (const auto& t : ticks)
        if (t.valid && t.price >= lo && t.price <= hi)
            ++cnt;
    return cnt;
}

// With C++20 [[likely]]: compiler lays out the hot path for fewer jumps
uint64_t count_valid_fast(const std::vector<Tick>& ticks, double lo, double hi) {
    uint64_t cnt = 0;
    for (const auto& t : ticks) {
        if (!t.valid) [[unlikely]] continue;          // errors are rare
        if (t.price < lo || t.price > hi) [[unlikely]] continue; // OOB rare
        [[likely]] ++cnt;                             // most ticks pass
    }
    return cnt;
}

int main() {
    constexpr int N = 1'000'000;
    std::mt19937 rng(42);
    std::uniform_real_distribution<> dist(99.0, 101.0);
    std::bernoulli_distribution valid_dist(0.99); // 99% valid

    std::vector<Tick> ticks(N);
    for (auto& t : ticks) {
        t.seq   = &t - ticks.data();
        t.price = dist(rng);
        t.valid = valid_dist(rng);
    }

    auto t0 = std::chrono::high_resolution_clock::now();
    uint64_t c = count_valid_fast(ticks, 99.5, 100.5);
    auto t1 = std::chrono::high_resolution_clock::now();
    std::cout << "Valid in-range: " << c << "\\n";
    std::cout << "Time: "
              << std::chrono::duration_cast<std::chrono::microseconds>(t1-t0).count()
              << " us\\n";
}`,
    explanation: "[[likely]] / [[unlikely]] (C++20) communicate branch probability to the compiler so it can lay out the hot path as fall-through code, minimising branch misprediction penalties. In a tick loop processing millions of messages per second, even a 1% misprediction rate at 15 cycles per miss is 150K cycles/million ticks — roughly 50µs of latency floor.",
  },
  {
    id: "cpp-20260702-b1-cache-padding",
    language: "cpp",
    title: "Cache-Line Padding to Prevent False Sharing Between Threads",
    tag: "low-latency",
    code: `#include <atomic>
#include <thread>
#include <iostream>
#include <chrono>
#include <vector>

// False sharing: two atomic variables on the same 64-byte cache line
// cause unnecessary cache-line invalidations when different threads write them.
// Solution: pad each variable to occupy its own cache line.

constexpr std::size_t CACHE_LINE = 64;

struct alignas(CACHE_LINE) PaddedCounter {
    std::atomic<long> value{0};
    char pad[CACHE_LINE - sizeof(std::atomic<long>)]; // fill rest of line
};

// Without padding: counters share cache lines -> false sharing
struct UnpaddedCounters {
    std::atomic<long> a{0}, b{0}; // likely share a cache line
};

void benchmark(bool padded) {
    constexpr long ITERS = 10'000'000;
    auto t0 = std::chrono::high_resolution_clock::now();

    if (padded) {
        PaddedCounter ca, cb;
        std::thread t1([&]{ for (long i = 0; i < ITERS; ++i) ca.value.fetch_add(1, std::memory_order_relaxed); });
        std::thread t2([&]{ for (long i = 0; i < ITERS; ++i) cb.value.fetch_add(1, std::memory_order_relaxed); });
        t1.join(); t2.join();
        std::cout << "Padded:   a=" << ca.value << " b=" << cb.value;
    } else {
        UnpaddedCounters uc;
        std::thread t1([&]{ for (long i = 0; i < ITERS; ++i) uc.a.fetch_add(1, std::memory_order_relaxed); });
        std::thread t2([&]{ for (long i = 0; i < ITERS; ++i) uc.b.fetch_add(1, std::memory_order_relaxed); });
        t1.join(); t2.join();
        std::cout << "Unpadded: a=" << uc.a << " b=" << uc.b;
    }
    auto t1e = std::chrono::high_resolution_clock::now();
    std::cout << "  time="
              << std::chrono::duration_cast<std::chrono::milliseconds>(t1e-t0).count()
              << "ms\\n";
}

int main() {
    benchmark(false); // typically slower due to false sharing
    benchmark(true);  // each counter owns a full cache line
}`,
    explanation: "False sharing occurs when two threads write to different variables that reside on the same 64-byte cache line: each write invalidates the entire line on the other core, causing MESI-protocol cache misses. Padding to alignas(64) ensures each counter occupies exactly one cache line — typical speedup is 3-10x for write-heavy concurrent counters.",
  },
  {
    id: "cpp-20260702-b1-prefetch",
    language: "cpp",
    title: "Software Prefetching (__builtin_prefetch) in Order Book Scan",
    tag: "low-latency",
    code: `#include <iostream>
#include <vector>
#include <numeric>
#include <chrono>
#include <cstdint>

// __builtin_prefetch(addr, rw, locality)
// rw: 0=read, 1=write; locality: 0=no temporal, 3=L1 prefetch
// Prefetch N elements ahead to hide memory latency in sequential scan

struct Level {
    double price;
    int    qty;
    uint8_t padding[52]; // inflate to 64 bytes (1 cache line) for demo
};
static_assert(sizeof(Level) == 64, "Level must be 1 cache line");

int scan_no_prefetch(const std::vector<Level>& levels) {
    int total = 0;
    for (const auto& l : levels)
        total += l.qty;
    return total;
}

constexpr int PREFETCH_DIST = 8; // prefetch 8 cache lines ahead

int scan_prefetch(const std::vector<Level>& levels) {
    int total = 0;
    const int n = static_cast<int>(levels.size());
    for (int i = 0; i < n; ++i) {
        if (i + PREFETCH_DIST < n)
            __builtin_prefetch(&levels[i + PREFETCH_DIST], 0, 0);
        total += levels[i].qty;
    }
    return total;
}

int main() {
    constexpr int N = 1 << 18; // 256K levels
    std::vector<Level> levels(N);
    for (int i = 0; i < N; ++i) { levels[i].price = i; levels[i].qty = i % 100; }

    auto bench = [&](auto fn, const char* name) {
        auto t0 = std::chrono::high_resolution_clock::now();
        int r = fn(levels);
        auto t1 = std::chrono::high_resolution_clock::now();
        std::cout << name << ": sum=" << r << "  "
                  << std::chrono::duration_cast<std::chrono::microseconds>(t1-t0).count()
                  << "us\\n";
    };

    bench(scan_no_prefetch, "no-prefetch");
    bench(scan_prefetch,    "prefetch");
}`,
    explanation: "Software prefetching hides DRAM latency by issuing loads speculatively before the data is needed: fetching 8 cache lines ahead gives ~500ns lead time on a typical server, enough to hide one DDR4 miss. This is most effective when access patterns are predictable (sequential scans) — in order book depth-of-book scans during risk checks or volume calculations.",
  },
  {
    id: "cpp-20260702-b1-numa-alloc",
    language: "cpp",
    title: "NUMA-Aware Allocation for Cross-Socket Latency Avoidance",
    tag: "low-latency",
    code: `#include <iostream>
#include <numa.h>
#include <cstring>
#include <stdexcept>

// NUMA (Non-Uniform Memory Access): on multi-socket servers,
// memory local to socket 0 is ~20ns; remote (socket 1) is ~60ns.
// Binding market-data buffers to the socket where the NIC interrupt fires
// prevents all consumer threads from paying remote-access penalties.

class NumaBuffer {
    void*       ptr_     = nullptr;
    std::size_t size_    = 0;
    int         node_    = 0;
public:
    NumaBuffer(std::size_t bytes, int numa_node) : size_(bytes), node_(numa_node) {
        if (numa_available() < 0) {
            // NUMA not available: fallback to regular malloc
            ptr_ = std::malloc(bytes);
            std::cerr << "[warn] NUMA not available, using malloc\\n";
        } else {
            ptr_ = numa_alloc_onnode(bytes, numa_node);
        }
        if (!ptr_) throw std::bad_alloc();
        std::memset(ptr_, 0, bytes);
    }

    ~NumaBuffer() {
        if (ptr_) {
            if (numa_available() >= 0)
                numa_free(ptr_, size_);
            else
                std::free(ptr_);
        }
    }

    void* data()        const { return ptr_; }
    std::size_t size()  const { return size_; }
    int   numa_node()   const { return node_; }

    NumaBuffer(const NumaBuffer&) = delete;
    NumaBuffer& operator=(const NumaBuffer&) = delete;
};

int main() {
    try {
        // Allocate a 4MB market-data ring buffer on NUMA node 0
        // (where the 10GbE NIC typically lives on Intel Xeon)
        NumaBuffer buf(4 * 1024 * 1024, 0);
        std::cout << "Allocated " << buf.size() / 1024 / 1024
                  << " MB on NUMA node " << buf.numa_node() << "\\n";
        // Pin reader threads to node 0 via pthread_setaffinity for optimal throughput
    } catch (const std::bad_alloc& e) {
        std::cerr << "Allocation failed: " << e.what() << "\\n";
    }
}`,
    explanation: "NUMA-aware allocation places data physically on the same memory controller as the threads consuming it, cutting remote-access latency by 2-3x. On a 2-socket server, the typical configuration is: NIC on socket 0, market-data processing threads pinned to socket 0 CPUs, ring buffers allocated on socket 0 memory — all three must align for minimum latency.",
  },
  {
    id: "cpp-20260702-b1-custom-hash",
    language: "cpp",
    title: "FNV-1a Custom Hash for Symbol Lookup in Unordered Map",
    tag: "hft",
    code: `#include <unordered_map>
#include <string>
#include <string_view>
#include <iostream>
#include <cstdint>

// FNV-1a hash: fast, reasonable distribution, branch-free inner loop.
// std::hash<std::string> may call strlen + complex mixing on some STLs;
// FNV-1a is consistently sub-10ns for short symbol strings.
struct FnvHash {
    static constexpr uint64_t PRIME  = 0x00000100000001B3ULL;
    static constexpr uint64_t OFFSET = 0xCBF29CE484222325ULL;

    uint64_t operator()(std::string_view sv) const noexcept {
        uint64_t h = OFFSET;
        for (unsigned char c : sv) {
            h ^= static_cast<uint64_t>(c);
            h *= PRIME;
        }
        return h;
    }
};

// Heterogeneous lookup: allows find("AAPL") without constructing std::string
struct SvEqual {
    using is_transparent = void;
    bool operator()(std::string_view a, std::string_view b) const { return a == b; }
};

using SymbolMap = std::unordered_map<std::string, double, FnvHash, SvEqual>;

int main() {
    SymbolMap prices;
    prices["AAPL"] = 183.45;
    prices["MSFT"] = 415.10;
    prices["NVDA"] = 875.20;
    prices["TSLA"] = 251.30;

    // Heterogeneous find: no std::string allocation for the key
    auto it = prices.find("MSFT");   // string_view overload
    if (it != prices.end())
        std::cout << "MSFT: " << it->second << "\\n";

    // Demo hash values
    FnvHash h;
    std::cout << "hash(AAPL)=" << h("AAPL") << "\\n";
    std::cout << "hash(AAPLX)=" << h("AAPLX") << "\\n"; // very different
}`,
    explanation: "FNV-1a's multiply-then-xor inner loop is branch-free and maps well to modern out-of-order CPUs; for 4-5 character ticker symbols it produces excellent avalanche with minimal collision. The is_transparent equal comparator enables heterogeneous lookup — finding by string_view avoids heap-allocating a std::string key on every tick, saving hundreds of nanoseconds per lookup.",
  },
  {
    id: "cpp-20260702-b1-variant-message",
    language: "cpp",
    title: "std::variant for Zero-Cost Polymorphic Message Dispatch",
    tag: "STL",
    code: `#include <variant>
#include <vector>
#include <iostream>
#include <string>

struct NewOrder {
    uint64_t    id;
    double      price;
    int         qty;
    char        side;
};

struct CancelOrder {
    uint64_t order_id;
};

struct ExecutionReport {
    uint64_t order_id;
    double   fill_price;
    int      fill_qty;
    std::string status; // "FILLED", "PARTIALLY_FILLED"
};

using Message = std::variant<NewOrder, CancelOrder, ExecutionReport>;

// Visitor using overloaded lambdas — dispatches without virtual calls
struct MessageProcessor {
    void operator()(const NewOrder& n) const {
        std::cout << "NEW  " << n.id << " " << n.qty << "@" << n.price
                  << (n.side == 'B' ? " BUY" : " SELL") << "\\n";
    }
    void operator()(const CancelOrder& c) const {
        std::cout << "CXEL " << c.order_id << "\\n";
    }
    void operator()(const ExecutionReport& e) const {
        std::cout << "EXEC " << e.order_id << " " << e.fill_qty
                  << "@" << e.fill_price << " [" << e.status << "]\\n";
    }
};

int main() {
    std::vector<Message> queue = {
        NewOrder{1, 100.25, 500, 'B'},
        NewOrder{2, 100.30, 200, 'S'},
        CancelOrder{1},
        ExecutionReport{2, 100.28, 200, "FILLED"},
    };

    MessageProcessor proc;
    for (const auto& msg : queue)
        std::visit(proc, msg);
}`,
    explanation: "std::variant with std::visit compiles the message dispatch into a jump table (like a virtual call) but avoids heap allocation: the union lives in-place inside the variant. Unlike virtual dispatch, the visitor pattern keeps all message types in a single allocation and avoids pointer indirection — critical when processing 10M messages/second from a wire-protocol decoder.",
  },
  {
    id: "cpp-20260702-b1-crr-greek-grid",
    language: "cpp",
    title: "Parallel Greeks Grid via std::execution::par_unseq",
    tag: "numerics",
    code: `#include <algorithm>
#include <execution>
#include <vector>
#include <cmath>
#include <iostream>
#include <numeric>

struct OptionParams {
    double S, K, r, T, sigma;
};

struct Greeks {
    double price, delta, gamma, vega, theta;
};

Greeks bsm_greeks(const OptionParams& p) {
    if (p.T <= 0 || p.sigma <= 0)
        return {std::max(p.S - p.K, 0.0), 1.0, 0.0, 0.0, 0.0};
    double sqT = std::sqrt(p.T);
    double d1  = (std::log(p.S/p.K) + (p.r + 0.5*p.sigma*p.sigma)*p.T) / (p.sigma*sqT);
    double d2  = d1 - p.sigma * sqT;
    auto N  = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    auto n  = [](double x){ return std::exp(-0.5*x*x)/std::sqrt(2*M_PI); };
    double Nd1 = N(d1), Nd2 = N(d2);
    double df  = std::exp(-p.r * p.T);
    double price = p.S * Nd1 - p.K * df * Nd2;
    double delta = Nd1;
    double gamma = n(d1) / (p.S * p.sigma * sqT);
    double vega  = p.S * n(d1) * sqT / 100.0;
    double theta = -(p.S * n(d1) * p.sigma / (2*sqT) + p.r * p.K * df * Nd2) / 365.0;
    return {price, delta, gamma, vega, theta};
}

int main() {
    // Build a grid of 10K options: vols 10%-50%, strikes 80-120
    std::vector<OptionParams> params;
    for (double sigma : {0.10, 0.20, 0.30, 0.40, 0.50})
        for (double K = 80; K <= 120; K += 2)
            for (double T : {0.25, 0.5, 1.0, 2.0})
                params.push_back({100.0, K, 0.05, T, sigma});

    std::vector<Greeks> results(params.size());

    // Parallelise over the grid using C++17 parallel algorithms
    std::transform(std::execution::par_unseq,
                   params.begin(), params.end(),
                   results.begin(),
                   bsm_greeks);

    double total_vega = 0;
    for (const auto& g : results) total_vega += g.vega;
    std::cout << "Computed " << results.size() << " Greeks\\n";
    std::cout << "Total vega (sum): " << total_vega << "\\n";
}`,
    explanation: "std::execution::par_unseq instructs the STL implementation to parallelise and vectorise the transform, automatically distributing the Greeks calculation across all CPU cores. This is the idiomatic C++17 way to parallelise embarrassingly parallel risk computations (scenario grids, ladder repricing) without writing manual thread management code.",
  },
  {
    id: "cpp-20260702-b1-cox-ingersoll-ross",
    language: "cpp",
    title: "Cox-Ingersoll-Ross Short-Rate MC (Milstein Scheme)",
    tag: "fixed-income",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <vector>

// CIR model: dr = kappa*(theta - r)*dt + sigma*sqrt(r)*dW
// Milstein discretisation preserves positivity better than Euler-Maruyama
// ZCB price: E[exp(-integral r dt)] under risk-neutral measure
double cir_zcb_mc(double r0, double kappa, double theta, double sigma,
                  double T, int steps = 200, int paths = 200'000, int seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    const double dt    = T / steps;
    const double sqdt  = std::sqrt(dt);
    // Milstein correction term: sigma^2 / 4 * (dW^2 - dt)
    const double c2    = 0.25 * sigma * sigma;

    double sum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double r    = r0;
        double disc = 0.0;
        for (int t = 0; t < steps; ++t) {
            double dW = sqdt * nd(rng);
            double sr = std::sqrt(std::max(r, 0.0));
            // Milstein step
            r   += kappa*(theta - r)*dt + sigma*sr*dW + c2*(dW*dW - dt);
            r    = std::max(r, 0.0);    // reflection boundary (Feller condition)
            disc += r;
        }
        sum += std::exp(-disc * dt);
    }
    return sum / paths;
}

// Analytic CIR ZCB for validation (Brigo-Mercurio formula)
double cir_zcb_analytic(double r0, double kappa, double theta, double sigma, double T) {
    double gamma = std::sqrt(kappa*kappa + 2*sigma*sigma);
    double D     = 2*gamma + (kappa+gamma)*(std::exp(gamma*T)-1);
    double A     = std::pow(2*gamma*std::exp(0.5*(kappa+gamma)*T) / D,
                            2*kappa*theta/(sigma*sigma));
    double B     = 2*(std::exp(gamma*T)-1) / D;
    return A * std::exp(-B * r0);
}

int main() {
    double r0=0.05, kappa=0.5, theta=0.05, sigma=0.10, T=5.0;
    double mc     = cir_zcb_mc(r0, kappa, theta, sigma, T);
    double analyt = cir_zcb_analytic(r0, kappa, theta, sigma, T);
    std::cout << "CIR ZCB MC:       " << mc     << "\\n";
    std::cout << "CIR ZCB Analytic: " << analyt << "\\n";
    std::cout << "Error:            " << std::abs(mc - analyt) << "\\n";
}`,
    explanation: "The CIR model guarantees non-negative interest rates when the Feller condition 2*kappa*theta > sigma² holds. The Milstein scheme adds a correction term proportional to dW² that reduces the discretisation bias of Euler-Maruyama for square-root diffusions — critical when sigma is large relative to r, where Euler can produce negative rates.",
  },
  {
    id: "cpp-20260702-b1-yield-curve-interp",
    language: "cpp",
    title: "Cubic Spline Yield Curve Interpolation",
    tag: "fixed-income",
    code: `#include <vector>
#include <cassert>
#include <iostream>
#include <algorithm>
#include <stdexcept>

// Natural cubic spline through yield curve pillar points.
// C2 continuous — avoids the oscillation of polynomial interpolation.
class CubicSpline {
    std::vector<double> x_, y_, h_, b_, d_, c_, a_;
    int n;
public:
    CubicSpline(std::vector<double> xs, std::vector<double> ys)
        : x_(std::move(xs)), y_(std::move(ys)), n(x_.size() - 1)
    {
        assert(x_.size() == y_.size() && n >= 1);
        h_.resize(n); b_.resize(n); a_.resize(n+1, 0); c_.resize(n+1, 0); d_.resize(n);
        for (int i = 0; i < n; ++i) { h_[i] = x_[i+1]-x_[i]; b_[i] = (y_[i+1]-y_[i])/h_[i]; }

        // Tridiagonal system for second derivatives
        std::vector<double> u(n+1,0), v(n+1,0);
        u[1] = 2*(h_[0]+h_[1]); v[1] = 6*(b_[1]-b_[0]);
        for (int i = 2; i < n; ++i) {
            u[i] = 2*(h_[i-1]+h_[i]) - h_[i-1]*h_[i-1]/u[i-1];
            v[i] = 6*(b_[i]-b_[i-1]) - h_[i-1]*v[i-1]/u[i-1];
        }
        // Back-substitution (natural BCs: c_[0]=c_[n]=0)
        c_[n] = 0;
        for (int i = n-1; i >= 1; --i)
            c_[i] = (v[i] - h_[i]*c_[i+1]) / u[i];

        for (int i = 0; i < n; ++i) {
            d_[i] = (c_[i+1]-c_[i]) / (3*h_[i]);
            a_[i] = (y_[i+1]-y_[i])/h_[i] - h_[i]*(2*c_[i]+c_[i+1])/3;
        }
    }

    double eval(double t) const {
        auto it = std::upper_bound(x_.begin(), x_.end(), t);
        int i = std::max(0, (int)(it - x_.begin()) - 1);
        i = std::min(i, n-1);
        double dx = t - x_[i];
        return y_[i] + a_[i]*dx + c_[i]*dx*dx + d_[i]*dx*dx*dx;
    }
};

int main() {
    // SOFR zero rates at benchmark tenors
    std::vector<double> tenors = {0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0};
    std::vector<double> rates  = {0.052, 0.051, 0.049, 0.047, 0.044, 0.043, 0.042};

    CubicSpline curve(tenors, rates);

    for (double t : {0.75, 1.5, 3.0, 7.0, 20.0})
        std::cout << "Z(" << t << "Y) = " << curve.eval(t)*100 << "%\\n";
}`,
    explanation: "Natural cubic splines provide C2-continuous yield curve interpolation — the second derivative is continuous, preventing kink artifacts that affect duration calculations. They are the industry standard for interpolating swap zero rates between pillar tenors; the tridiagonal system solves in O(N) via forward elimination, making calibration fast even for large input grids.",
  },
  {
    id: "cpp-20260702-b1-pnl-explain",
    language: "cpp",
    title: "P&L Explain: Taylor Decomposition into Greek Buckets",
    tag: "risk",
    code: `#include <cmath>
#include <iostream>
#include <vector>
#include <numeric>

struct Greeks {
    double delta, gamma, vega, theta, rho;
};

struct MarketMove {
    double dS;      // spot move
    double dSigma;  // vol move
    double dr;      // rate move
    double dT;      // time decay (negative, in years)
};

struct PnLExplain {
    double delta_pnl;
    double gamma_pnl;
    double vega_pnl;
    double theta_pnl;
    double rho_pnl;
    double cross_gamma_pnl;
    double total_explained;
    double residual;         // actual - explained
};

PnLExplain explain_pnl(const Greeks& g, const MarketMove& mv,
                        double S, double actual_pnl)
{
    PnLExplain e;
    e.delta_pnl       = g.delta * mv.dS;
    e.gamma_pnl       = 0.5 * g.gamma * mv.dS * mv.dS;
    e.vega_pnl        = g.vega * mv.dSigma * 100.0;  // vega per 1% vol move
    e.theta_pnl       = g.theta * mv.dT * 365.0;     // theta per year -> per day
    e.rho_pnl         = g.rho * mv.dr * 100.0;       // rho per 1% rate move
    // Cross-gamma: delta-vol interaction
    e.cross_gamma_pnl = 0.0;                          // simplified: skip higher order

    e.total_explained = e.delta_pnl + e.gamma_pnl + e.vega_pnl
                      + e.theta_pnl + e.rho_pnl;
    e.residual        = actual_pnl - e.total_explained;
    return e;
}

int main() {
    // ATM call: S=100, 20% vol, 1yr
    Greeks g{0.5391, 0.0188, 0.3753, -0.0136, 0.5323}; // delta,gamma,vega,theta,rho
    MarketMove mv{+2.0, +0.01, 0.0, -1.0/365.0};        // +2pt spot, +1% vol, 1day

    double actual_pnl = 1.15; // observed P&L from full revaluation
    auto e = explain_pnl(g, mv, 100.0, actual_pnl);

    std::cout << "Delta P&L:  " << e.delta_pnl       << "\\n";
    std::cout << "Gamma P&L:  " << e.gamma_pnl       << "\\n";
    std::cout << "Vega  P&L:  " << e.vega_pnl        << "\\n";
    std::cout << "Theta P&L:  " << e.theta_pnl       << "\\n";
    std::cout << "Explained:  " << e.total_explained  << "\\n";
    std::cout << "Actual:     " << actual_pnl         << "\\n";
    std::cout << "Residual:   " << e.residual         << "\\n";
}`,
    explanation: "P&L Explain decomposes the day's profit into its contributing Greeks using a Taylor expansion: delta*dS + 0.5*gamma*dS² + vega*dVol + theta*dt + rho*dr. A large residual signals model error, unhedged cross-gamma risk, or a jump event — and is the primary tool risk managers use to validate that Greeks-based hedging is working as intended.",
  },
  {
    id: "cpp-20260702-b1-matrix-power",
    language: "cpp",
    title: "Matrix Exponentiation for Markov Chain Transition Probability",
    tag: "math",
    code: `#include <vector>
#include <iostream>
#include <cassert>

using Matrix = std::vector<std::vector<double>>;

Matrix multiply(const Matrix& A, const Matrix& B) {
    int n = A.size();
    Matrix C(n, std::vector<double>(n, 0.0));
    for (int i = 0; i < n; ++i)
        for (int k = 0; k < n; ++k)
            if (A[i][k] != 0.0)
                for (int j = 0; j < n; ++j)
                    C[i][j] += A[i][k] * B[k][j];
    return C;
}

// Fast matrix exponentiation by squaring: O(n^3 * log T)
Matrix mat_pow(Matrix M, long long T) {
    int n = M.size();
    Matrix result(n, std::vector<double>(n, 0.0));
    for (int i = 0; i < n; ++i) result[i][i] = 1.0; // identity

    while (T > 0) {
        if (T & 1) result = multiply(result, M);
        M  = multiply(M, M);
        T >>= 1;
    }
    return result;
}

int main() {
    // Credit rating transition matrix (S&P-like, simplified 3-state)
    // States: 0=Investment Grade, 1=High Yield, 2=Default (absorbing)
    Matrix P = {
        {0.92, 0.07, 0.01},   // from IG
        {0.05, 0.87, 0.08},   // from HY
        {0.00, 0.00, 1.00},   // from Default (absorbing)
    };

    // 5-year transition probabilities
    Matrix P5 = mat_pow(P, 5);
    std::cout << "5-year transition matrix:\\n";
    for (int i = 0; i < 3; ++i) {
        for (double v : P5[i]) std::cout << v << "  ";
        std::cout << "\\n";
    }
    std::cout << "IG -> Default in 5Y: " << P5[0][2]*100 << "%\\n";
}`,
    explanation: "Matrix exponentiation by squaring computes P^T in O(n³ log T) time, enabling exact N-period Markov transition probabilities without iterative matrix multiplication. This is used in credit risk for multi-period default probability ladders, sovereign rating migration models, and Markov-switching regime analysis.",
  },
  {
    id: "cpp-20260702-b1-asian-arithmetic-mc",
    language: "cpp",
    title: "Arithmetic Asian Option MC with Antithetic Variance Reduction",
    tag: "pricing",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <vector>
#include <algorithm>

// Arithmetic average Asian call: payoff = max(A_T - K, 0) where A_T = mean(S_t)
// Antithetic variates: for each normal z, also evaluate the path with -z.
// The two paths are negatively correlated, halving variance for free.
double asian_arith_call_mc(double S0, double K, double r, double T, double sigma,
                            int steps = 52, int paths = 100'000, int seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    const double dt    = T / steps;
    const double drift = (r - 0.5*sigma*sigma)*dt;
    const double sv    = sigma * std::sqrt(dt);

    double sum = 0.0;
    for (int p = 0; p < paths / 2; ++p) {
        double S1 = S0, S2 = S0;
        double avg1 = 0.0, avg2 = 0.0;
        for (int t = 0; t < steps; ++t) {
            double z   = nd(rng);
            double fac = std::exp(drift + sv * z);
            S1 *= fac;
            S2 *= std::exp(drift - sv * z); // antithetic
            avg1 += S1;
            avg2 += S2;
        }
        avg1 /= steps; avg2 /= steps;
        // Average the two payoffs
        sum += 0.5 * (std::max(avg1 - K, 0.0) + std::max(avg2 - K, 0.0));
    }
    return std::exp(-r * T) * sum / (paths / 2);
}

int main() {
    // S=100, K=100, r=5%, T=1yr, sigma=20%, weekly averaging (52 obs)
    double price = asian_arith_call_mc(100.0, 100.0, 0.05, 1.0, 0.20);
    // Geometric Asian analytic ~7.57; Arithmetic slightly higher ~7.88
    std::cout << "Arithmetic Asian call (antithetic MC): " << price << "\\n";
}`,
    explanation: "Antithetic variates reduce MC variance by roughly 50% at zero additional computational cost: pairing each path with its mirror path (using -z) introduces negative correlation that cancels most of the sampling noise. For Asian options, geometric averaging admits a closed form that can serve as a control variate for even further variance reduction.",
  },
  {
    id: "cpp-20260702-b1-hw-mean-revert",
    language: "cpp",
    title: "Hull-White One-Factor Short Rate MC Path Generator",
    tag: "fixed-income",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <vector>

// Hull-White: dr(t) = [theta(t) - a*r(t)]*dt + sigma*dW
// With constant theta (fitting flat curve): theta_c = a*r_mean + 0.5*sigma^2/a
// This demo uses a simplified flat-curve parameterisation
struct HullWhiteParams {
    double a;      // mean-reversion speed
    double sigma;  // volatility
    double r_mean; // long-run mean rate (flat curve)
};

std::vector<std::vector<double>> hw_paths(
    double r0, const HullWhiteParams& p, double T,
    int steps = 100, int paths = 10'000, int seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    const double dt    = T / steps;
    const double e_adt = std::exp(-p.a * dt);
    const double var   = p.sigma*p.sigma * (1.0 - std::exp(-2*p.a*dt)) / (2*p.a);
    const double sv    = std::sqrt(var);

    std::vector<std::vector<double>> result(paths, std::vector<double>(steps+1));
    for (int path = 0; path < paths; ++path) {
        result[path][0] = r0;
        for (int t = 0; t < steps; ++t) {
            double r_prev = result[path][t];
            // Exact conditional distribution (Vasicek / H-W constant theta)
            double mean_r = p.r_mean + (r_prev - p.r_mean)*e_adt;
            result[path][t+1] = mean_r + sv * nd(rng);
        }
    }
    return result;
}

int main() {
    HullWhiteParams hw{0.1, 0.01, 0.05}; // a=10%, sigma=1%, long-run=5%
    auto paths = hw_paths(0.04, hw, 5.0, 60, 1000);

    // Compute mean rate at each step (first 5 time points)
    int steps = paths[0].size();
    for (int t = 0; t < 6; ++t) {
        double sum = 0.0;
        for (const auto& p : paths) sum += p[t];
        std::cout << "E[r(t=" << t*5.0/60 << ")] = " << sum/paths.size() << "\\n";
    }
}`,
    explanation: "The Hull-White model is Gaussian and analytically tractable: the exact transition distribution (conditional normal) can be sampled directly without Euler approximation error. The exponential mean-reversion factor e^{-a*dt} is computed once and reused across all steps, making path generation very fast compared to models requiring per-step Newton-Raphson solves.",
  },
  {
    id: "cpp-20260702-b1-fd-pde-explicit",
    language: "cpp",
    title: "Explicit Finite Difference BSM PDE Pricer (FTCS Scheme)",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <iostream>
#include <algorithm>
#include <numeric>

// Explicit (Forward-Time Central-Space) finite difference for BSM PDE:
// dC/dt + 0.5*sigma^2*S^2*d^2C/dS^2 + r*S*dC/dS - r*C = 0
// Solved backwards from terminal condition using explicit time-stepping.
// Stability requires: dt <= (dS)^2 / (sigma^2 * S_max^2)
double fd_bsm_call(double S0, double K, double r, double T, double sigma,
                   int NX = 200, int NT = 4000)
{
    const double S_max = 4.0 * K;  // grid spans [0, 4K]
    const double dS    = S_max / NX;
    const double dt    = T / NT;

    // CFL stability check
    double stab = sigma * S_max * dt / (dS * dS);
    if (stab > 0.5)
        std::cerr << "Warning: unstable (stab=" << stab << ")\\n";

    // Grid: V[j] = option value at S = j*dS
    std::vector<double> V(NX + 1), Vnew(NX + 1);
    // Terminal condition: call payoff
    for (int j = 0; j <= NX; ++j)
        V[j] = std::max(j*dS - K, 0.0);

    // Time-stepping backwards from T to 0
    for (int i = 0; i < NT; ++i) {
        // Boundary: V(0,t) = 0; V(S_max,t) = S_max - K*exp(-r*tau)
        double tau = (NT - i) * dt; // remaining time (decreasing)
        Vnew[0]  = 0.0;
        Vnew[NX] = S_max - K * std::exp(-r * tau);

        for (int j = 1; j < NX; ++j) {
            double S  = j * dS;
            double a  = 0.5*dt*(sigma*sigma*j*j - r*j);
            double b  = 1.0 - dt*(sigma*sigma*j*j + r);
            double c  = 0.5*dt*(sigma*sigma*j*j + r*j);
            Vnew[j]   = a*V[j-1] + b*V[j] + c*V[j+1];
        }
        V = Vnew;
    }

    // Interpolate to find V at S0
    int j0 = static_cast<int>(S0 / dS);
    double w = (S0 - j0*dS) / dS;
    return (1-w)*V[j0] + w*V[j0+1];
}

int main() {
    double price = fd_bsm_call(100.0, 100.0, 0.05, 1.0, 0.20);
    std::cout << "FD BSM call: " << price << "\\n"; // ~10.45 (BSM analytic)
}`,
    explanation: "The explicit finite-difference scheme directly maps the PDE's spatial and time derivatives to grid differences; its simplicity comes at a cost: the CFL stability condition requires very small dt relative to dS². It is valuable for teaching the PDE structure and for non-standard payoffs or BCs where implicit methods complicate the backward induction.",
  },
  {
    id: "cpp-20260702-b1-coroutine-stream",
    language: "cpp",
    title: "C++20 Coroutine Generator for Lazy Tick Stream",
    tag: "coroutines",
    code: `#include <coroutine>
#include <iostream>
#include <optional>
#include <cstdint>
#include <random>

// Minimal generator coroutine for a lazy tick stream.
// The coroutine suspends at each co_yield, resuming only when the consumer
// calls next() — no intermediate buffer needed.
struct Tick {
    uint64_t seq;
    double   price;
};

struct Generator {
    struct promise_type {
        Tick current;
        std::suspend_always yield_value(Tick t) { current = t; return {}; }
        std::suspend_always initial_suspend()    { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        Generator           get_return_object()  { return {handle_type::from_promise(*this)}; }
        void                return_void()        {}
        void                unhandled_exception() { std::terminate(); }
    };

    using handle_type = std::coroutine_handle<promise_type>;
    handle_type handle;

    ~Generator() { if (handle) handle.destroy(); }

    std::optional<Tick> next() {
        if (!handle || handle.done()) return std::nullopt;
        handle.resume();
        if (handle.done()) return std::nullopt;
        return handle.promise().current;
    }
};

Generator tick_stream(int count, double start_price, int seed = 42) {
    std::mt19937 rng(seed);
    std::normal_distribution<> nd(0.0, 0.05);
    double price = start_price;
    for (int i = 0; i < count; ++i) {
        price *= std::exp(nd(rng));
        co_yield Tick{static_cast<uint64_t>(i), price};
    }
}

int main() {
    auto stream = tick_stream(5, 100.0);
    while (auto t = stream.next())
        std::cout << "seq=" << t->seq << "  price=" << t->price << "\\n";
}`,
    explanation: "C++20 coroutines implement lazy generators without threads or callbacks: the coroutine body runs incrementally, suspending at each co_yield and transferring control back to the caller. For market-data pipelines, this lets you express a tick-by-tick stream as a simple sequential function while the consumer controls the pacing — ideal for simulation or back-test replay drivers.",
  },
  {
    id: "cpp-20260702-b1-hashmap-array-orderbook",
    language: "cpp",
    title: "Order Book: Hash Map + Sorted Array Hybrid for Level Tracking",
    tag: "data-structures",
    code: `#include <unordered_map>
#include <map>
#include <iostream>
#include <cstdint>

// Hybrid order book:
// - std::map<int,int> for sorted price-level lookup (best bid/ask, spread)
// - std::unordered_map<uint64_t, ...> for O(1) order-by-id lookup (cancel)
// Integer ticks avoid floating-point key comparison issues in std::map.

struct Level {
    int   tick;      // integer tick (price / tick_size)
    int   total_qty;
};

class HybridOrderBook {
    // bid: price descending (highest first) -> use negative tick as key
    std::map<int, Level> bids; // key = -tick => iteration gives highest first
    std::map<int, Level> asks; // key = +tick => iteration gives lowest first

    struct OrderMeta { int tick; char side; int qty; };
    std::unordered_map<uint64_t, OrderMeta> orders; // order_id -> (tick, side, qty)

public:
    void add_order(uint64_t id, int tick, int qty, char side) {
        auto& book = (side == 'B') ? bids : asks;
        int key    = (side == 'B') ? -tick : tick;
        book[key].tick = tick;
        book[key].total_qty += qty;
        orders[id] = {tick, side, qty};
    }

    void cancel_order(uint64_t id) {
        auto it = orders.find(id);
        if (it == orders.end()) return;
        auto& [tick, side, qty] = it->second;
        auto& book = (side == 'B') ? bids : asks;
        int key    = (side == 'B') ? -tick : tick;
        book[key].total_qty -= qty;
        if (book[key].total_qty <= 0) book.erase(key);
        orders.erase(it);
    }

    int best_bid() const { return bids.empty() ? -1 : bids.begin()->second.tick; }
    int best_ask() const { return asks.empty() ? -1 : asks.begin()->second.tick; }
    int spread()   const { return best_ask() - best_bid(); }
};

int main() {
    HybridOrderBook book;
    book.add_order(1, 500, 200, 'B');
    book.add_order(2, 501, 100, 'S');
    book.add_order(3, 499, 300, 'B');
    book.add_order(4, 502, 150, 'S');

    std::cout << "Best bid: " << book.best_bid() << "  Best ask: " << book.best_ask()
              << "  Spread: " << book.spread() << " ticks\\n";

    book.cancel_order(1); // cancel top bid
    std::cout << "After cancel, best bid: " << book.best_bid() << "\\n"; // 499
}`,
    explanation: "The hash+sorted hybrid gives O(1) cancel (via order ID lookup) and O(log N) best-price queries (via sorted map). Using integer ticks as map keys eliminates floating-point comparison instability and allows bitwise tricks for bid/ask ordering. This is the canonical architecture for exchange matching engines requiring both fast cancels and price-priority access.",
  },
  {
    id: "cpp-20260702-b1-var-parametric",
    language: "cpp",
    title: "Parametric VaR / CVaR for a Multi-Asset Portfolio",
    tag: "risk",
    code: `#include <vector>
#include <cmath>
#include <iostream>
#include <algorithm>
#include <numeric>
#include <stdexcept>

// Parametric (variance-covariance) VaR for a long-only portfolio.
// Assumes normally distributed returns; ignores fat tails.
// CVaR = Expected Shortfall: mean of losses beyond VaR threshold.

double normal_quantile(double p) {
    // Beasley-Springer-Moro approximation
    if (p <= 0.0 || p >= 1.0) throw std::domain_error("p must be in (0,1)");
    const double a[] = {2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637};
    const double b[] = {-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833};
    const double c[] = {0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
                        0.0276438810333863, 0.0038405729373609, 0.0003951896511349};
    double y  = p - 0.5;
    double r;
    if (std::abs(y) < 0.42) {
        r = y*y; r = y*(a[0]+r*(a[1]+r*(a[2]+r*a[3])))/(1+r*(b[0]+r*(b[1]+r*(b[2]+r*b[3]))));
    } else {
        r = std::log(-std::log(y > 0 ? 1-p : p));
        r = c[0]+r*(c[1]+r*(c[2]+r*(c[3]+r*(c[4]+r*c[5]))));
        if (y < 0) r = -r;
    }
    return r;
}

struct Portfolio {
    std::vector<double> weights;     // portfolio weights
    std::vector<double> vols;        // per-asset daily vol (%)
    std::vector<std::vector<double>> corr; // correlation matrix
    double notional;
};

struct VarResult { double var_pct, cvar_pct, var_usd, cvar_usd; };

VarResult parametric_var(const Portfolio& p, double confidence = 0.99) {
    int N = p.weights.size();
    // Portfolio variance = w^T * Sigma * w (Sigma = D * corr * D)
    double port_var = 0.0;
    for (int i = 0; i < N; ++i)
        for (int j = 0; j < N; ++j)
            port_var += p.weights[i] * p.weights[j]
                      * p.vols[i] * p.vols[j] * p.corr[i][j];

    double port_vol = std::sqrt(port_var); // portfolio daily vol in %
    double z        = -normal_quantile(1.0 - confidence); // positive z for left tail
    double var_pct  = z * port_vol;
    // CVaR = phi(z_alpha) / (1 - alpha) * sigma where phi is standard normal PDF
    double pdf_z    = std::exp(-0.5*z*z) / std::sqrt(2*M_PI);
    double cvar_pct = port_vol * pdf_z / (1.0 - confidence);

    return {var_pct, cvar_pct, p.notional * var_pct / 100, p.notional * cvar_pct / 100};
}

int main() {
    Portfolio port;
    port.weights    = {0.5, 0.3, 0.2};
    port.vols       = {1.5, 0.8, 2.0}; // daily vol in %
    port.corr       = {{1.0, 0.3, 0.5}, {0.3, 1.0, 0.2}, {0.5, 0.2, 1.0}};
    port.notional   = 10'000'000.0;

    auto r = parametric_var(port, 0.99);
    std::cout << "Portfolio daily vol: "
              << std::sqrt(0.5*0.5*1.5*1.5 + 0.3*0.3*0.8*0.8 + 0.2*0.2*2.0*2.0
                         + 2*0.5*0.3*1.5*0.8*0.3 + 2*0.5*0.2*1.5*2.0*0.5
                         + 2*0.3*0.2*0.8*2.0*0.2) << "%\\n";
    std::cout << "VaR(99%):  " << r.var_pct  << "% = USD " << r.var_usd  << "\\n";
    std::cout << "CVaR(99%): " << r.cvar_pct << "% = USD " << r.cvar_usd << "\\n";
}`,
    explanation: "Parametric VaR assumes multivariate normality and computes risk analytically from the covariance matrix — O(N²) per calculation regardless of confidence level. CVaR (Expected Shortfall) is the average loss beyond the VaR threshold and is a coherent risk measure; Basel III/FRTB mandates CVaR at 97.5% as the standard internal model metric.",
  },
];
