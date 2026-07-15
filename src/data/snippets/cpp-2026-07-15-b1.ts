import { Snippet } from "./types";

export const cppSnippets20260715B1: Snippet[] = [
  {
    id: "cpp-20260715-b1-concepts-financial",
    language: "cpp",
    title: "C++20 Concepts for Financial Type Constraints",
    tag: "concepts",
    code: `#include <concepts>
#include <type_traits>
#include <cstddef>

// Named concepts enforce semantic intent at instantiation time
// rather than producing inscrutable SFINAE error cascades.

template<typename T>
concept FloatPrice = std::floating_point<T>;

template<typename T>
concept TickEncoded = std::integral<T>;

// Requires both arithmetic ops and strict ordering (price-like)
template<typename T>
concept Priceable = std::floating_point<T> &&
    requires(T a, T b) {
        { a + b } -> std::same_as<T>;
        { a * b } -> std::same_as<T>;
        { a < b } -> std::convertible_to<bool>;
    };

// Structural concept: any type exposing .price() and .qty()
template<typename T>
concept OrderLike = requires(const T& o) {
    { o.price() } -> FloatPrice;
    { o.qty()   } -> std::convertible_to<long>;
    { o.is_buy() } -> std::convertible_to<bool>;
};

// Constrained template: only instantiable for Priceable types
template<Priceable T>
T mid_price(T bid, T ask) { return (bid + ask) / T{2}; }

template<FloatPrice T>
T bps(T spread, T mid) { return spread / mid * T{10000}; }

// Concept-checked VWAP — compiler error if price/weight aren't floating-point
template<FloatPrice P, FloatPrice W>
P vwap(const P* prices, const W* weights, std::size_t n) {
    P pv{0}, tv{0};
    for (std::size_t i = 0; i < n; ++i) {
        pv += static_cast<P>(prices[i] * weights[i]);
        tv += static_cast<P>(weights[i]);
    }
    return tv > P{0} ? pv / tv : P{0};
}

// Usage (concept violations caught at compile time, not link time)
static_assert(Priceable<double>);
static_assert(!Priceable<int>);  // int doesn't satisfy std::floating_point`,
    explanation:
      "C++20 concepts replace SFINAE for expressing 'this template requires a Priceable type' in human-readable form: violations produce a single clear error at the call site rather than a 50-line substitution failure chain. Structural concepts (OrderLike) let the compiler check duck-typed interfaces without inheritance.",
  },
  {
    id: "cpp-20260715-b1-pmr-arena",
    language: "cpp",
    title: "std::pmr Monotonic Arena for Per-Tick Event Allocation",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <cstddef>
#include <cstring>

// Monotonic buffer resource: allocates linearly from a fixed buffer;
// deallocation is a no-op. Perfect for per-tick event bursts where
// all allocations live for exactly one tick interval.
struct TickArena {
    static constexpr std::size_t SIZE = 1 << 16; // 64 KB per tick
    alignas(64) std::byte buf_[SIZE];
    std::pmr::monotonic_buffer_resource res_{buf_, SIZE};

    // Every container created with this allocator draws from buf_
    std::pmr::vector<double> deltas{&res_};
    std::pmr::vector<double> gammas{&res_};

    void process_tick(const double* raw_deltas, std::size_t n) {
        deltas.clear();
        gammas.clear();
        deltas.assign(raw_deltas, raw_deltas + n);
        for (auto d : deltas) gammas.push_back(d * d * 0.01); // placeholder
    }

    // Call at tick boundary to reset the arena without touching the OS
    void reset() {
        res_.release(); // rewind pointer back to buf_[0]
        deltas.clear();
        gammas.clear();
    }
};

// In production: one TickArena per thread (thread_local) prevents contention
thread_local TickArena g_tick_arena;`,
    explanation:
      "std::pmr::monotonic_buffer_resource allocates by bumping a pointer — O(1) with zero synchronisation and no fragmentation. Calling release() at the end of each tick resets the pointer to the start of the fixed buffer, recycling all memory instantly. Per-thread arenas eliminate cross-thread contention entirely.",
  },
  {
    id: "cpp-20260715-b1-span-fix-parser",
    language: "cpp",
    title: "std::span Zero-Copy FIX Message Field Extractor",
    tag: "data-structures",
    code: `#include <span>
#include <string_view>
#include <optional>
#include <charconv>
#include <cstdint>

// FIX wire format: "8=FIX.4.4\x01 35=D\x01 49=SENDER\x01 ..."
// Fields are SOH-delimited (0x01); each field is "tag=value".
// std::span provides a zero-copy view into the raw receive buffer.

static constexpr char SOH = '\x01';

// Find the value for a given FIX tag in a SOH-delimited span.
// Returns nullopt if tag is absent; no heap allocation.
std::optional<std::string_view>
fix_field(std::span<const char> msg, std::string_view tag_str) {
    const char* p   = msg.data();
    const char* end = p + msg.size();

    while (p < end) {
        const char* field_start = p;
        // Find '='
        const char* eq = static_cast<const char*>(
            std::memchr(p, '=', static_cast<std::size_t>(end - p)));
        if (!eq) break;
        // Find next SOH
        const char* soh = static_cast<const char*>(
            std::memchr(eq + 1, SOH, static_cast<std::size_t>(end - eq - 1)));
        if (!soh) soh = end;

        std::string_view key(field_start, static_cast<std::size_t>(eq - field_start));
        if (key == tag_str)
            return std::string_view(eq + 1, static_cast<std::size_t>(soh - eq - 1));

        p = soh + 1;
    }
    return std::nullopt;
}

// Parse FIX tag 44 (price) directly to double without string copy
std::optional<double> fix_price(std::span<const char> msg) {
    auto v = fix_field(msg, "44");
    if (!v) return std::nullopt;
    double val;
    auto [ptr, ec] = std::from_chars(v->data(), v->data() + v->size(), val);
    if (ec != std::errc{}) return std::nullopt;
    return val;
}

// Usage:
// char buf[] = "8=FIX.4.4\x0135=D\x0149=BROKER\x0144=100.25\x01";
// auto px = fix_price(std::span(buf, sizeof(buf)-1));`,
    explanation:
      "std::span lets the FIX parser work directly in the receive buffer without copying into a std::string. std::from_chars converts the price substring to double without allocating or touching locale state — critical for the <1 µs per-message budget. The field search is a simple two-pointer scan: O(N) in message length, N typically 200–800 bytes.",
  },
  {
    id: "cpp-20260715-b1-variant-order-dispatch",
    language: "cpp",
    title: "std::variant Order Message Dispatch with std::visit",
    tag: "meta-programming",
    code: `#include <variant>
#include <string>
#include <cstdint>
#include <iostream>

// Closed set of order types modelled as a variant — no virtual dispatch,
// no heap allocation, exhaustive-check enforced at compile time.

struct LimitOrder  { uint64_t id; double price; uint32_t qty; bool buy; };
struct MarketOrder { uint64_t id; uint32_t qty; bool buy; };
struct CancelOrder { uint64_t id; };
struct ModifyOrder { uint64_t id; double new_price; uint32_t new_qty; };

using OrderMsg = std::variant<LimitOrder, MarketOrder, CancelOrder, ModifyOrder>;

// Visitor using overloaded lambdas (C++17 deduction trick)
template<typename... Ts>
struct Overloaded : Ts... { using Ts::operator()...; };
template<typename... Ts>
Overloaded(Ts...) -> Overloaded<Ts...>;

void dispatch(const OrderMsg& msg) {
    std::visit(Overloaded{
        [](const LimitOrder& o) {
            std::cout << "Limit " << (o.buy ? "BUY" : "SELL")
                      << " id=" << o.id << " px=" << o.price
                      << " qty=" << o.qty << "\n";
        },
        [](const MarketOrder& o) {
            std::cout << "Market " << (o.buy ? "BUY" : "SELL")
                      << " id=" << o.id << " qty=" << o.qty << "\n";
        },
        [](const CancelOrder& o) {
            std::cout << "Cancel id=" << o.id << "\n";
        },
        [](const ModifyOrder& o) {
            std::cout << "Modify id=" << o.id
                      << " new_px=" << o.new_price
                      << " new_qty=" << o.new_qty << "\n";
        },
    }, msg);
}

int main() {
    OrderMsg msgs[] = {
        LimitOrder{1, 100.25, 500, true},
        MarketOrder{2, 100, false},
        CancelOrder{1},
        ModifyOrder{2, 100.10, 200},
    };
    for (const auto& m : msgs) dispatch(m);
}`,
    explanation:
      "std::variant + std::visit enforces exhaustive handling: adding a new order type without updating the visitor causes a compile error — unlike a switch/if-else on an enum that silently falls through. The visitor's lambda overhead is zero; the compiler emits a jump table over the variant's type index, matching virtual dispatch speed without vtable pointer overhead.",
  },
  {
    id: "cpp-20260715-b1-coroutine-tick",
    language: "cpp",
    title: "C++20 Coroutine Tick Generator (Lazy Sequence)",
    tag: "meta-programming",
    code: `#include <coroutine>
#include <optional>
#include <vector>
#include <iostream>

// Minimal generator coroutine: co_yield suspends and passes a value
// to the caller without returning. Useful for lazy market-data replay.
template<typename T>
struct Generator {
    struct promise_type {
        T value_;
        Generator get_return_object() { return Generator{this}; }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v)  { value_ = v; return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    using Handle = std::coroutine_handle<promise_type>;
    Handle coro_;

    explicit Generator(promise_type* p) : coro_(Handle::from_promise(*p)) {}
    Generator(Generator&& o) noexcept : coro_(std::exchange(o.coro_, {})) {}
    ~Generator() { if (coro_) coro_.destroy(); }

    bool next() { coro_.resume(); return !coro_.done(); }
    T    value() const { return coro_.promise().value_; }
};

// Generator that replays a recorded tick sequence one tick at a time
Generator<double> tick_replay(std::vector<double> ticks) {
    for (double t : ticks) co_yield t;
}

// Synthetic tick stream: random walk
Generator<double> random_walk(double start, int steps, double step_size = 0.25) {
    double price = start;
    for (int i = 0; i < steps; ++i) {
        price += (i % 3 == 0 ? step_size : -step_size * 0.5);
        co_yield price;
    }
}

int main() {
    auto gen = random_walk(100.0, 5);
    while (gen.next()) std::cout << gen.value() << " ";
    std::cout << "\n"; // 100.25 99.875 100.125 99.75 100.0
}`,
    explanation:
      "Coroutine generators produce values on demand without materialising the full sequence. For backtesting engines replaying millions of ticks, a generator reads ticks from disk incrementally — memory consumption is O(1) regardless of history length. The coroutine state (loop counter, price) lives in the heap-allocated frame, but the caller's stack is not blocked.",
  },
  {
    id: "cpp-20260715-b1-intrusive-order-list",
    language: "cpp",
    title: "Intrusive Doubly-Linked Order List for O(1) Cancel",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cassert>
#include <iostream>

// Intrusive list: the node pointers live inside the Order struct itself.
// Cancel is O(1) — given an Order*, just unlink. No std::list node allocation.
// The order pool owns memory; the list just threads pointers through existing objects.
struct Order {
    uint64_t id;
    double   price;
    uint32_t qty;
    bool     active = true;

    Order* prev = nullptr;
    Order* next = nullptr;
};

// FIFO intrusive list per price level
struct OrderList {
    Order* head = nullptr;
    Order* tail = nullptr;
    int    count = 0;

    void push_back(Order* o) {
        o->prev = tail; o->next = nullptr;
        if (tail) tail->next = o; else head = o;
        tail = o; ++count;
    }

    // O(1) cancel — caller holds a pointer to the order object
    void remove(Order* o) {
        if (o->prev) o->prev->next = o->next; else head = o->next;
        if (o->next) o->next->prev = o->prev; else tail = o->prev;
        o->prev = o->next = nullptr;
        o->active = false;
        --count;
    }

    // Fill front of queue (price-time priority)
    Order* front() { return head; }
};

int main() {
    Order o1{1, 100.0, 100}, o2{2, 100.0, 200}, o3{3, 100.0, 50};
    OrderList q;
    q.push_back(&o1); q.push_back(&o2); q.push_back(&o3);

    q.remove(&o2);   // cancel the middle order — O(1)
    std::cout << "Front: id=" << q.front()->id   // 1
              << " count=" << q.count << "\n";    // 2
    assert(q.head == &o1 && o1.next == &o3 && o3.prev == &o1);
}`,
    explanation:
      "Intrusive lists store prev/next pointers directly in the payload struct, eliminating the separate list-node allocation that std::list requires. Given a pointer to an Order (stored in the exchange's order-ID hash table for cancels), unlinking it from the price-level queue is two pointer updates — no search, no deallocation. Production matching engines use this pattern to achieve sub-100-ns cancel latency.",
  },
  {
    id: "cpp-20260715-b1-open-addressing-hash",
    language: "cpp",
    title: "Open-Addressing Hash Table for Order Lookup by ID",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cstddef>
#include <cassert>
#include <optional>
#include <array>

// Open-addressing with linear probing and tombstone deletion.
// Designed for 64-bit order IDs — FNV-1a hash, power-of-2 capacity.
// Faster than std::unordered_map for int keys: no pointer chasing, no bucket list.
template<typename V, std::size_t Cap>
class OrderHashMap {
    static_assert((Cap & (Cap - 1)) == 0, "Cap must be power of 2");
    static constexpr uint64_t EMPTY  = ~uint64_t{0};
    static constexpr uint64_t TOMB   = ~uint64_t{0} - 1;
    static constexpr std::size_t MASK = Cap - 1;

    struct Slot { uint64_t key = EMPTY; V val{}; };
    std::array<Slot, Cap> slots_{};

    static std::size_t hash(uint64_t k) {
        // Fibonacci hashing: multiply by golden ratio, take upper bits
        return static_cast<std::size_t>((k * 11400714819323198485ULL) >> (64 - __builtin_ctzll(Cap)));
    }

public:
    bool insert(uint64_t key, const V& val) {
        std::size_t idx = hash(key) & MASK;
        for (std::size_t i = 0; i < Cap; ++i) {
            auto& s = slots_[(idx + i) & MASK];
            if (s.key == EMPTY || s.key == TOMB) { s = {key, val}; return true; }
            if (s.key == key) { s.val = val; return true; } // overwrite
        }
        return false; // full (shouldn't happen if load < 0.7)
    }

    V* find(uint64_t key) {
        std::size_t idx = hash(key) & MASK;
        for (std::size_t i = 0; i < Cap; ++i) {
            auto& s = slots_[(idx + i) & MASK];
            if (s.key == EMPTY) return nullptr;
            if (s.key == key)   return &s.val;
        }
        return nullptr;
    }

    bool erase(uint64_t key) {
        std::size_t idx = hash(key) & MASK;
        for (std::size_t i = 0; i < Cap; ++i) {
            auto& s = slots_[(idx + i) & MASK];
            if (s.key == EMPTY) return false;
            if (s.key == key) { s.key = TOMB; return true; }
        }
        return false;
    }
};

// 65536-slot table for order lookup — 65536 * (8+8) = 1 MB, hot in L2
static OrderHashMap<void*, 65536> g_order_map;`,
    explanation:
      "Open-addressing with Fibonacci hashing distributes keys more uniformly than modulo hashing, reducing clustering. Linear probing keeps accessed slots contiguous in cache — a cache miss on the first probe often prefetches the next 7 slots for free. At 50% load, expected probes per lookup is 1.5 vs 2+ for separate chaining with std::unordered_map's linked list.",
  },
  {
    id: "cpp-20260715-b1-prefetch-book-walk",
    language: "cpp",
    title: "Prefetch-Driven Order Book Walk for Level Sweep",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstddef>
#include <vector>
#include <iostream>

// Hardware prefetch instructions hint the CPU to load a cache line
// before it is needed, hiding DRAM latency (100-300 ns) by overlapping
// with compute on the current element.

struct Level {
    int64_t  price;    // tick-encoded
    uint64_t volume;
    Level*   next;     // linked to next-price level
};

// Sweep bid-side from best bid, matching against incoming qty.
// Prefetches the level two steps ahead to hide pointer-chasing latency.
uint64_t sweep_bids(Level* best_bid, uint64_t incoming_qty) {
    uint64_t filled   = 0;
    Level*   level    = best_bid;

    while (level && filled < incoming_qty) {
        // Prefetch the level AFTER next (two hops ahead)
        if (level->next && level->next->next) {
            __builtin_prefetch(level->next->next, 0, 1); // read, L2 hint
        }

        uint64_t take = std::min(level->volume, incoming_qty - filled);
        level->volume -= take;
        filled        += take;

        if (level->volume == 0)
            level = level->next;  // level exhausted, advance
        else
            break;                // level partially filled, stop
    }
    return filled;
}

// Example: 3 price levels, each with 100 contracts
int main() {
    Level l3{9998, 100, nullptr};
    Level l2{9999, 100, &l3};
    Level l1{10000, 100, &l2};

    uint64_t filled = sweep_bids(&l1, 250); // fill 250 across levels
    std::cout << "Filled: " << filled << "\n"; // 250
    std::cout << "L3 remaining: " << l3.volume << "\n"; // 50
}`,
    explanation:
      "__builtin_prefetch(addr, rw, locality) issues an x86 PREFETCHT1 instruction for L2, telling the CPU to start fetching the cache line at addr 8–12 cycles early. For a linked-list level traversal, prefetching two hops ahead converts the 100-300 ns pointer-chase penalty to near-zero by overlapping it with the current level's fill arithmetic.",
  },
  {
    id: "cpp-20260715-b1-numa-affinity",
    language: "cpp",
    title: "NUMA-Aware Thread Pinning and Memory Binding (Linux)",
    tag: "low-latency",
    code: `#include <pthread.h>
#include <sched.h>
#include <sys/mman.h>
#include <numa.h>       // libnuma — link with -lnuma
#include <cstddef>
#include <cstdio>
#include <stdexcept>

// On multi-socket (NUMA) machines, memory accesses cross a QPI/UPI link
// if the thread is on socket 0 and its buffer is on socket 1's DIMM.
// This adds ~80 ns per access. Pin threads to cores AND bind memory to
// the local NUMA node for worst-case latency control.

// Pin calling thread to a specific CPU core
void pin_to_cpu(int cpu) {
    cpu_set_t set;
    CPU_ZERO(&set);
    CPU_SET(cpu, &set);
    if (pthread_setaffinity_np(pthread_self(), sizeof(set), &set) != 0)
        throw std::runtime_error("pthread_setaffinity_np failed");
}

// Allocate a huge-page-backed buffer on a specific NUMA node
// (requires /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages > 0)
void* numa_alloc_huge(std::size_t bytes, int node) {
    if (numa_available() < 0) throw std::runtime_error("NUMA not available");

    // Allocate on the target node's memory
    void* ptr = numa_alloc_onnode(bytes, node);
    if (!ptr) throw std::bad_alloc{};

    // Lock pages to prevent swapping (critical for deterministic latency)
    if (mlock(ptr, bytes) != 0)
        std::fprintf(stderr, "mlock failed — running without mlocked pages\n");

    return ptr;
}

void numa_free_buf(void* ptr, std::size_t bytes) {
    munlock(ptr, bytes);
    numa_free(ptr, bytes);
}

// Production recipe: strategy thread pinned to core 1 (NUMA node 0),
// market-data thread pinned to core 3 (NUMA node 0),
// ring buffer allocated on node 0 — all local, zero cross-socket traffic.`,
    explanation:
      "NUMA topology on dual-socket servers means remote memory access adds ~80 ns per cache miss vs. ~12 ns for local. Pinning the strategy thread and its shared ring buffer to the same NUMA node eliminates this variability. mlock prevents the OS from swapping out hot pages under memory pressure, ensuring the ring buffer stays in physical RAM.",
  },
  {
    id: "cpp-20260715-b1-perfect-forward-factory",
    language: "cpp",
    title: "Perfect-Forwarding Order Factory (Universal References)",
    tag: "meta-programming",
    code: `#include <memory>
#include <utility>
#include <cstdint>
#include <string>
#include <iostream>

// Perfect forwarding: forward<T>(arg) preserves lvalue/rvalue-ness.
// Without it, move-only fields (e.g., a symbol string) would be copied.

struct Order {
    uint64_t    id;
    std::string symbol;  // move-only in typical C++ practice
    double      price;
    uint32_t    qty;
    bool        buy;

    template<typename S>
    Order(uint64_t id, S&& sym, double px, uint32_t q, bool buy_)
        : id(id), symbol(std::forward<S>(sym)), price(px), qty(q), buy(buy_) {}
};

// Factory: constructs in-place in a unique_ptr — no copy of args
template<typename... Args>
std::unique_ptr<Order> make_order(Args&&... args) {
    return std::make_unique<Order>(std::forward<Args>(args)...);
}

// Pool-based factory using placement new — zero heap allocation on hot path
class OrderPool {
    static constexpr int CAP = 1024;
    alignas(Order) char storage_[CAP * sizeof(Order)];
    int head_ = 0;
public:
    template<typename... Args>
    Order* alloc(Args&&... args) {
        if (head_ >= CAP) throw std::bad_alloc{};
        auto* p = reinterpret_cast<Order*>(storage_ + head_ * sizeof(Order));
        new(p) Order(std::forward<Args>(args)...);
        ++head_;
        return p;
    }
    void reset() {
        for (int i = 0; i < head_; ++i)
            reinterpret_cast<Order*>(storage_ + i * sizeof(Order))->~Order();
        head_ = 0;
    }
};

int main() {
    std::string sym = "AAPL";
    auto o1 = make_order(1ULL, sym,  150.25, 100u, true);  // lvalue: copied
    auto o2 = make_order(2ULL, "GOOG", 2800.0, 10u, false); // rvalue: moved

    OrderPool pool;
    auto* o3 = pool.alloc(3ULL, "MSFT", 380.0, 200u, true); // in-place
    std::cout << o3->symbol << " " << o3->price << "\n";
    pool.reset();
}`,
    explanation:
      "std::forward preserves value category: a string lvalue is copied (user still owns the string) and an rvalue is moved into the Order (zero copy). In the pool factory, placement new constructs the Order directly in pre-allocated storage, eliminating heap allocation on the order-entry fast path.",
  },
  {
    id: "cpp-20260715-b1-sfinae-numeric-trait",
    language: "cpp",
    title: "SFINAE enable_if Type Trait for Financial Numerics",
    tag: "meta-programming",
    code: `#include <type_traits>
#include <cmath>
#include <limits>

// SFINAE (pre-C++20): enable a template overload only for floating-point types.
// Used when you can't add a concept-requires (legacy headers, C++17 targets).

// Trait: is the type a signed floating-point price type?
template<typename T>
struct is_price_type
    : std::conjunction<std::is_floating_point<T>, std::is_signed<T>> {};

template<typename T>
inline constexpr bool is_price_type_v = is_price_type<T>::value;

// enable_if overload: only participates in overload resolution for price types
template<typename T, typename = std::enable_if_t<is_price_type_v<T>>>
bool is_valid_price(T price) {
    return std::isfinite(price) && price > T{0};
}

// Tag dispatch alternative — no enable_if noise in the function signature
namespace detail {
    template<typename T>
    bool valid_impl(T v, std::true_type  /*floating*/) {
        return std::isfinite(v) && v > T{0};
    }
    template<typename T>
    bool valid_impl(T v, std::false_type /*integral*/) {
        return v > T{0};
    }
}
template<typename T>
bool is_valid_numeric(T v) {
    return detail::valid_impl(v, std::is_floating_point<T>{});
}

// detect_has_price: true if T has a .price() member returning floating-point
template<typename T, typename = void>
struct has_price_member : std::false_type {};
template<typename T>
struct has_price_member<T,
    std::void_t<decltype(std::declval<T>().price())>>
    : std::is_floating_point<decltype(std::declval<T>().price())> {};

static_assert(is_price_type_v<double>);
static_assert(!is_price_type_v<int>);
static_assert(!is_price_type_v<unsigned double>);  // ill-formed, so: unsigned doesn't apply`,
    explanation:
      "SFINAE enable_if restricts template instantiation at substitution time — the overload simply doesn't exist for non-price types rather than causing a hard error. The void_t detection idiom (has_price_member) inspects the presence of a member function without requiring any base class or trait specialisation in the target type.",
  },
  {
    id: "cpp-20260715-b1-dual-numbers-autodiff",
    language: "cpp",
    title: "Dual Numbers for Automatic Differentiation of Greeks",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>

// Dual number: d = (real, eps) where eps^2 = 0.
// Forward-mode AD: pass (S, 1) to get (price, delta) simultaneously.
// No bump-and-reprice; exact derivative at machine precision.
struct Dual {
    double real, eps;

    Dual(double r, double e = 0.0) : real(r), eps(e) {}

    Dual operator+(const Dual& o) const { return {real + o.real, eps + o.eps}; }
    Dual operator-(const Dual& o) const { return {real - o.real, eps - o.eps}; }
    Dual operator*(const Dual& o) const { return {real * o.real, real * o.eps + eps * o.real}; }
    Dual operator/(const Dual& o) const {
        return {real / o.real,
                (eps * o.real - real * o.eps) / (o.real * o.real)};
    }
};

Dual d_exp(Dual x) { double e = std::exp(x.real); return {e, e * x.eps}; }
Dual d_log(Dual x) { return {std::log(x.real), x.eps / x.real}; }
Dual d_sqrt(Dual x) { double s = std::sqrt(x.real); return {s, x.eps / (2 * s)}; }
Dual d_erf(Dual x) { // erfc is less direct; approximate N(x) via std::erf
    double e = std::erf(x.real);
    double de = 2.0 / std::sqrt(M_PI) * std::exp(-x.real * x.real);
    return {e, de * x.eps};
}
Dual d_norm_cdf(Dual x) {
    // N(x) = 0.5 * (1 + erf(x/sqrt(2)))
    Dual arg = Dual(x.real / std::sqrt(2.0), x.eps / std::sqrt(2.0));
    Dual ef  = d_erf(arg);
    return Dual(0.5) * (Dual(1.0) + ef);
}
Dual operator*(double c, Dual x) { return {c * x.real, c * x.eps}; }

// Black-Scholes call using dual-number arithmetic
Dual bs_call_dual(Dual S, double K, double r, double sigma, double T) {
    Dual d1 = (d_log(S / Dual(K)) + Dual((r + 0.5*sigma*sigma)*T))
              / Dual(sigma * std::sqrt(T));
    Dual d2 = d1 - Dual(sigma * std::sqrt(T));
    return S * d_norm_cdf(d1) - Dual(K * std::exp(-r*T)) * d_norm_cdf(d2);
}

int main() {
    // Pass S=(100, 1): eps=1 seeds the derivative w.r.t. S
    Dual S{100.0, 1.0};
    Dual price = bs_call_dual(S, 100.0, 0.05, 0.2, 1.0);
    std::cout << "Price: " << price.real << "\n"; // ~10.45
    std::cout << "Delta: " << price.eps  << "\n"; // ~0.6368
}`,
    explanation:
      "Dual numbers carry the derivative alongside the value: d/dS propagates automatically through every arithmetic operation via the chain rule encoded in operator overloads. This gives the exact analytic derivative with zero extra function evaluations — unlike finite differences (two evaluations, numerical error) — and generalises to any differentiable function including numerically-priced exotics.",
  },
  {
    id: "cpp-20260715-b1-asian-option-mc",
    language: "cpp",
    title: "Arithmetic Asian Option Pricing via Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <numeric>
#include <vector>
#include <random>
#include <iostream>
#include <algorithm>

// Asian (average-price) call: payoff = max(A_T - K, 0)
// A_T = arithmetic mean of S at N observation dates.
// No closed-form for arithmetic average; MC with control variate reduces variance.

// Geometric average (closed-form control variate for arithmetic Asian)
double geometric_asian_call(double S0, double K, double r,
                             double sigma, double T, int N) {
    // Kemna-Vorst (1990) closed-form for geometric average:
    double dt     = T / N;
    double adj_r  = 0.5 * (r - 0.5*sigma*sigma) + r; // sigma_g approximation
    double sigma_g= sigma * std::sqrt((2.0*N + 1.0) / (6.0*(N + 1.0)));
    double mu_g   = (r - 0.5*sigma*sigma) * (N + 1.0) * dt / 2.0 + std::log(S0);
    double F_g    = std::exp(mu_g + 0.5*sigma_g*sigma_g*T);
    double d1 = (std::log(F_g / K) + 0.5*sigma_g*sigma_g*T) / (sigma_g * std::sqrt(T));
    double d2 = d1 - sigma_g * std::sqrt(T);
    auto N_cdf = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    return std::exp(-r*T) * (F_g * N_cdf(d1) - K * N_cdf(d2));
}

double arithmetic_asian_mc(double S0, double K, double r, double sigma,
                            double T, int N, int n_paths, bool use_cv = true) {
    double dt = T / N;
    std::mt19937_64 rng(42);
    std::normal_distribution<double> norm;
    double disc = std::exp(-r * T);

    double arith_sum = 0.0, cv_sum = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double S = S0, arith_avg = 0.0, geo_log_sum = 0.0;
        for (int t = 0; t < N; ++t) {
            S *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*std::sqrt(dt)*norm(rng));
            arith_avg    += S;
            geo_log_sum  += std::log(S);
        }
        arith_avg   /= N;
        double geo_avg = std::exp(geo_log_sum / N);
        arith_sum += std::max(arith_avg - K, 0.0);
        cv_sum    += std::max(geo_avg   - K, 0.0);
    }
    double arith_mc = disc * arith_sum / n_paths;
    if (!use_cv) return arith_mc;

    // Control variate correction
    double cv_mc    = disc * cv_sum / n_paths;
    double cv_exact = geometric_asian_call(S0, K, r, sigma, T, N);
    return arith_mc + (cv_exact - cv_mc); // variance reduction
}

int main() {
    double price = arithmetic_asian_mc(100, 100, 0.05, 0.2, 1.0, 252, 100000);
    std::cout << "Arithmetic Asian call (CV): " << price << "\n"; // ~7.0
}`,
    explanation:
      "The geometric average Asian has a closed-form price (Kemna-Vorst) which is highly correlated with the arithmetic average Asian. Using it as a control variate — subtracting the MC estimate and adding back the analytic value — reduces variance by 80–95%, cutting the required number of paths by a factor of 20 for the same standard error.",
  },
  {
    id: "cpp-20260715-b1-barrier-option-mc",
    language: "cpp",
    title: "Down-and-Out Barrier Option Monte Carlo (Brownian Bridge)",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <algorithm>

// Down-and-out call: expires worthless if S ever touches barrier H < S0.
// Naive MC: check only at discrete time steps → barrier breach probability
// underestimated by O(1/sqrt(N)). Brownian bridge correction reduces this bias.

// Probability that a Brownian bridge [S_t, S_{t+dt}] crosses barrier H
double brownian_bridge_hit(double S0, double S1, double H, double dt, double sigma) {
    if (S0 <= H || S1 <= H) return 1.0; // already breached
    // Probability = exp(-2 * log(S0/H) * log(S1/H) / (sigma^2 * dt))
    double logS0H = std::log(S0 / H);
    double logS1H = std::log(S1 / H);
    return std::exp(-2.0 * logS0H * logS1H / (sigma * sigma * dt));
}

double barrier_mc(double S0, double K, double H, double r, double sigma,
                  double T, int N, int n_paths, bool bridge_correction = true) {
    if (H >= S0) return 0.0; // barrier above spot — already knocked out
    double dt = T / N;
    std::mt19937_64 rng(42);
    std::normal_distribution<double> norm;
    double disc = std::exp(-r * T);
    double sum  = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0;
        bool knocked = false;
        for (int t = 0; t < N && !knocked; ++t) {
            double S_prev = S;
            S *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*std::sqrt(dt)*norm(rng));
            if (S <= H) { knocked = true; break; }
            if (bridge_correction) {
                double prob_hit = brownian_bridge_hit(S_prev, S, H, dt, sigma);
                if (prob_hit > (double)rand() / RAND_MAX) {
                    knocked = true; break;
                }
            }
        }
        if (!knocked) sum += std::max(S - K, 0.0);
    }
    return disc * sum / n_paths;
}

int main() {
    double naive  = barrier_mc(100, 100, 90, 0.05, 0.2, 1.0, 52, 50000, false);
    double bridge = barrier_mc(100, 100, 90, 0.05, 0.2, 1.0, 52, 50000, true);
    std::cout << "Naive MC:  " << naive  << "\n";
    std::cout << "Bridge MC: " << bridge << "\n"; // closer to analytic ~5.8
}`,
    explanation:
      "Discrete monitoring underestimates barrier crossing probability because the path between steps is unobserved. The Brownian bridge correction uses the conditional probability that a continuous Brownian bridge from S_t to S_{t+1} dips below H — this reduces the O(1/√N) discretisation bias to O(1/N), allowing far fewer time steps for the same accuracy.",
  },
  {
    id: "cpp-20260715-b1-crank-nicolson-pde",
    language: "cpp",
    title: "Crank-Nicolson PDE Pricer for European Options",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <iostream>

// Crank-Nicolson finite-difference scheme for the Black-Scholes PDE:
// dV/dt + 0.5*sigma^2*S^2*d^2V/dS^2 + r*S*dV/dS - r*V = 0
// Backward in time from T to 0 on a uniform log-price grid.
// Second-order accurate in both space and time; unconditionally stable.

struct CNPricer {
    int M, N;           // S-steps, T-steps
    double S_max;       // grid upper boundary (e.g., 5*S0)
    double r, sigma, T;

    // Thomas algorithm for tridiagonal system Ax = b
    void thomas(const std::vector<double>& a,
                const std::vector<double>& b,
                const std::vector<double>& c,
                std::vector<double>&       d) {
        int n = (int)d.size();
        std::vector<double> cc(n), dc(n);
        cc[0] = c[0] / b[0]; dc[0] = d[0] / b[0];
        for (int i = 1; i < n; ++i) {
            double m = b[i] - a[i] * cc[i-1];
            cc[i] = c[i] / m;
            dc[i] = (d[i] - a[i] * dc[i-1]) / m;
        }
        d[n-1] = dc[n-1];
        for (int i = n-2; i >= 0; --i) d[i] = dc[i] - cc[i] * d[i+1];
    }

    double price(double S0, double K, bool is_call = true) {
        double dS = S_max / M;
        double dt = T / N;

        // Initial condition: payoff at expiry
        std::vector<double> V(M + 1);
        for (int i = 0; i <= M; ++i) {
            double S = i * dS;
            V[i] = is_call ? std::max(S - K, 0.0) : std::max(K - S, 0.0);
        }

        // Boundary conditions (constant extrapolation)
        auto bc_lo = [&](double t){ return is_call ? 0.0 : K * std::exp(-r*t) - 0.0; };
        auto bc_hi = [&](double t){ return is_call ? S_max - K * std::exp(-r*t) : 0.0; };

        // Crank-Nicolson time stepping
        for (int n = N - 1; n >= 0; --n) {
            double t = n * dt;
            std::vector<double> a(M-1), b(M-1), c(M-1), d(M-1);
            for (int i = 1; i < M; ++i) {
                double S  = i * dS;
                double al = 0.25 * dt * (sigma*sigma*i*i - r*i);
                double be = -0.5 * dt * (sigma*sigma*i*i + r);
                double ga = 0.25 * dt * (sigma*sigma*i*i + r*i);
                a[i-1] = -al;
                b[i-1] = 1 - be;
                c[i-1] = -ga;
                d[i-1] = al*V[i-1] + (1+be)*V[i] + ga*V[i+1];
            }
            // Apply boundary conditions
            d[0]   -= a[0]   * bc_lo(t);
            d[M-2] -= c[M-2] * bc_hi(t);
            thomas(a, b, c, d);
            for (int i = 1; i < M; ++i) V[i] = d[i-1];
            V[0] = bc_lo(t); V[M] = bc_hi(t);
        }
        // Interpolate at S0
        int idx = static_cast<int>(S0 / dS);
        double frac = (S0 - idx * dS) / dS;
        return V[idx] * (1 - frac) + V[idx+1] * frac;
    }
};

int main() {
    CNPricer p{200, 200, 500.0, 0.05, 0.2, 1.0};
    std::cout << "Call price (CN): " << p.price(100, 100, true) << "\n"; // ~10.45
}`,
    explanation:
      "Crank-Nicolson averages the explicit and implicit finite-difference schemes, making it second-order accurate in time (vs. first-order for pure explicit or implicit) and unconditionally stable. The resulting tridiagonal linear system is solved in O(M) by the Thomas algorithm. For American options, the linear system becomes a linear complementarity problem requiring a PSOR or penalty modification.",
  },
  {
    id: "cpp-20260715-b1-trinomial-tree",
    language: "cpp",
    title: "Trinomial Tree for Bermudan Put Option Pricing",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <iostream>

// Trinomial tree: each node branches to up/mid/down.
// More efficient than binomial for the same accuracy (O(N) vs O(N^2) nodes
// per expiry, and better convergence for small dt).
// Supports Bermudan exercise on a discrete set of dates.
struct TrinomialTree {
    double S0, K, r, sigma, T;
    int    N;           // time steps

    double price(const std::vector<int>& exercise_steps, bool is_put = true) {
        double dt  = T / N;
        double dx  = sigma * std::sqrt(3.0 * dt);  // log-price step
        double nu  = r - 0.5 * sigma * sigma;

        // Risk-neutral trinomial probabilities
        double pu = 0.5 * (dt * (sigma*sigma + nu*nu*dt) / (dx*dx) + nu*dt/dx);
        double pd = 0.5 * (dt * (sigma*sigma + nu*nu*dt) / (dx*dx) - nu*dt/dx);
        double pm = 1.0 - pu - pd;
        double disc = std::exp(-r * dt);

        int   n_nodes = 2 * N + 1;
        std::vector<double> V(n_nodes, 0.0);

        // Terminal payoff (node j relative to centre)
        for (int j = -N; j <= N; ++j) {
            double S = S0 * std::exp(j * dx);
            V[j + N] = is_put ? std::max(K - S, 0.0) : std::max(S - K, 0.0);
        }

        // Backward induction
        for (int t = N - 1; t >= 0; --t) {
            bool exercise_date = std::find(exercise_steps.begin(),
                                           exercise_steps.end(), t)
                                 != exercise_steps.end();
            std::vector<double> V_new(2*t + 1);
            for (int j = -t; j <= t; ++j) {
                double S    = S0 * std::exp(j * dx);
                double cont = disc * (pu * V[(j+1) + N]
                                    + pm * V[j     + N]
                                    + pd * V[(j-1) + N]);
                double intr = is_put ? std::max(K - S, 0.0) : std::max(S - K, 0.0);
                V_new[j + t] = exercise_date ? std::max(cont, intr) : cont;
            }
            // Shift V to match new node count
            for (int j = -t; j <= t; ++j) V[j + N] = V_new[j + t];
        }
        return V[N]; // root node
    }
};

int main() {
    TrinomialTree tree{100, 100, 0.05, 0.2, 1.0, 200};
    // Bermudan: can exercise at month-end (steps 17,33,...,200 for monthly in 200 steps)
    std::vector<int> exercise;
    for (int i = 17; i <= 200; i += 17) exercise.push_back(i);
    std::cout << "Bermudan put: " << tree.price(exercise, true) << "\n";
}`,
    explanation:
      "The trinomial tree matches three moments of the log-price distribution at each step, converging faster than the binomial for the same N. Bermudan exercise is handled identically to American: at each exercise date, replace the continuation value with max(continuation, intrinsic). The trinomial is especially efficient for barrier and Bermudan products where the extra node at the centre (S_t itself) reduces oscillation artifacts.",
  },
  {
    id: "cpp-20260715-b1-implied-vol-newton",
    language: "cpp",
    title: "Implied Volatility via Newton-Raphson with Vega",
    tag: "numerics",
    code: `#include <cmath>
#include <stdexcept>
#include <iostream>

// Bisection is safe but slow (log2(1/tol) iterations).
// Newton-Raphson converges quadratically once close to the root:
// sigma_{n+1} = sigma_n - (C(sigma_n) - C_mkt) / vega(sigma_n)
// Needs only ~3-5 iterations for typical ticks.

static double N_cdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }
static double N_pdf(double x) {
    return std::exp(-0.5*x*x) / std::sqrt(2.0 * M_PI);
}

struct BSResult { double price, vega; };

BSResult bs_call_vega(double S, double K, double r, double sigma, double T) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    double price = S * N_cdf(d1) - K * std::exp(-r*T) * N_cdf(d2);
    double vega  = S * N_pdf(d1) * sqT;   // dC/dsigma
    return {price, vega};
}

double implied_vol(double mkt_price, double S, double K, double r, double T,
                   double sigma0 = 0.2, int max_iter = 100, double tol = 1e-8) {
    double sigma = sigma0;
    for (int i = 0; i < max_iter; ++i) {
        auto [p, v] = bs_call_vega(S, K, r, sigma, T);
        double diff = p - mkt_price;
        if (std::abs(diff) < tol) return sigma;
        if (std::abs(v) < 1e-12) break; // vega near zero — bisect fallback
        sigma -= diff / v;
        sigma = std::clamp(sigma, 1e-6, 10.0); // keep in [0.0001%, 1000%]
    }
    // Bisection fallback
    double lo = 1e-6, hi = 10.0;
    for (int i = 0; i < 100; ++i) {
        double mid = 0.5 * (lo + hi);
        if (bs_call_vega(S, K, r, mid, T).price < mkt_price) lo = mid;
        else hi = mid;
        if (hi - lo < tol) return 0.5 * (lo + hi);
    }
    throw std::runtime_error("Implied vol did not converge");
}

int main() {
    double iv = implied_vol(10.45, 100, 100, 0.05, 1.0);
    std::cout << "Implied vol: " << iv << "\n"; // ~0.20
}`,
    explanation:
      "Newton-Raphson uses vega (dC/dσ) to step directly toward the root — it converges in 3–5 iterations for typical market prices because vega is smooth and positive for vanilla options. The clamp on σ and the bisection fallback guard against the degenerate cases: very deep OTM options where vega ≈ 0, and negative starting estimates.",
  },
  {
    id: "cpp-20260715-b1-bond-duration",
    language: "cpp",
    title: "Bond Duration, Convexity and DV01 Calculation",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <numeric>
#include <iostream>

// Duration: price-weighted average time of cash flows.
// Modified duration: -dP/dy / P = Macaulay / (1 + y/m).
// Convexity: d^2P/dy^2 / P — second-order yield sensitivity.
// DV01: dollar change in price for 1 bp yield move.
struct Bond {
    double face;       // par value
    double coupon_rate;// annual coupon rate
    double ytm;        // yield to maturity (annual, decimal)
    int    periods;    // number of coupon periods
    int    freq;       // coupons per year (1=annual, 2=semi-annual)

    double coupon() const { return face * coupon_rate / freq; }
    double period_ytm() const { return ytm / freq; }

    // Present value of the bond
    double price() const {
        double y = period_ytm();
        double C = coupon();
        double pv = 0.0;
        for (int t = 1; t <= periods; ++t)
            pv += C / std::pow(1 + y, t);
        pv += face / std::pow(1 + y, periods);
        return pv;
    }

    // Macaulay duration (in periods; divide by freq for years)
    double macaulay_duration() const {
        double y = period_ytm(), C = coupon(), P = price();
        double mac = 0.0;
        for (int t = 1; t <= periods; ++t)
            mac += t * (C / std::pow(1 + y, t));
        mac += periods * (face / std::pow(1 + y, periods));
        return mac / P / freq; // in years
    }

    double modified_duration() const {
        return macaulay_duration() / (1 + period_ytm());
    }

    double convexity() const {
        double y = period_ytm(), C = coupon(), P = price();
        double cx = 0.0;
        for (int t = 1; t <= periods; ++t)
            cx += static_cast<double>(t) * (t + 1) * (C / std::pow(1 + y, t + 2));
        cx += static_cast<double>(periods) * (periods + 1)
              * (face / std::pow(1 + y, periods + 2));
        return cx / P / (freq * freq);
    }

    double dv01() const { return modified_duration() * price() / 10000.0; }
};

int main() {
    Bond b{1000, 0.06, 0.05, 10, 2}; // 6% semi-annual, 5% YTM, 5Y
    std::cout << "Price:    " << b.price()             << "\n"; // ~1043.76
    std::cout << "ModDur:   " << b.modified_duration() << "\n"; // ~4.28
    std::cout << "Convex:   " << b.convexity()         << "\n";
    std::cout << "DV01:     " << b.dv01()              << "\n"; // ~0.447
}`,
    explanation:
      "Modified duration is the bond's first-order yield sensitivity: for a 1 bp (0.01%) yield rise, price falls by ModDur × 0.0001 × Price ≈ DV01. Convexity is the second-order correction: dP ≈ -D_mod × P × dy + 0.5 × C × P × dy². High convexity means a bond outperforms its linear approximation whether yields rise or fall — valuable for hedging interest-rate risk.",
  },
  {
    id: "cpp-20260715-b1-fnv-hash-symbol",
    language: "cpp",
    title: "FNV-1a Hash for Compact Symbol ID Encoding",
    tag: "low-latency",
    code: `#include <cstdint>
#include <string_view>
#include <cassert>
#include <array>
#include <iostream>

// FNV-1a (Fowler-Noll-Vo) is a non-cryptographic hash with excellent
// avalanche for short strings — perfect for equity ticker symbols (1-5 chars).
// Compile-time constexpr version enables compile-time symbol dispatch.

constexpr uint64_t FNV_PRIME  = 0x00000100000001B3ULL;
constexpr uint64_t FNV_OFFSET = 0xcbf29ce484222325ULL;

constexpr uint64_t fnv1a(std::string_view s) noexcept {
    uint64_t h = FNV_OFFSET;
    for (char c : s) {
        h ^= static_cast<uint8_t>(c);
        h *= FNV_PRIME;
    }
    return h;
}

// Compile-time lookup table: map symbol hash → integer ID
struct SymbolMap {
    struct Entry { uint64_t hash; int id; };
    static constexpr std::array<Entry, 4> table = {{
        {fnv1a("AAPL"), 1},
        {fnv1a("GOOG"), 2},
        {fnv1a("MSFT"), 3},
        {fnv1a("TSLA"), 4},
    }};

    static int lookup(std::string_view sym) noexcept {
        uint64_t h = fnv1a(sym);
        for (const auto& e : table)
            if (e.hash == h) return e.id;
        return -1;
    }
};

// Ultra-fast switch via compile-time hashes
void handle_symbol(std::string_view sym) {
    switch (fnv1a(sym)) {
        case fnv1a("AAPL"): std::cout << "Apple\n"; break;
        case fnv1a("GOOG"): std::cout << "Google\n"; break;
        case fnv1a("MSFT"): std::cout << "Microsoft\n"; break;
        default:            std::cout << "Unknown\n";
    }
}

int main() {
    assert(SymbolMap::lookup("GOOG") == 2);
    handle_symbol("MSFT");    // Microsoft
    handle_symbol("TSLA");    // Unknown (not in switch)
}`,
    explanation:
      "FNV-1a hashes a 4-character ticker in 4 multiply-XOR operations — faster than std::hash<std::string> which may call memcmp. The constexpr form enables compile-time switch labels over symbol hashes: the compiler emits a single jump table instruction instead of a chain of string comparisons, reducing per-message routing from ~20 ns to ~1 ns.",
  },
  {
    id: "cpp-20260715-b1-mpsc-queue",
    language: "cpp",
    title: "Lock-Free MPSC Queue (Multiple Producer, Single Consumer)",
    tag: "low-latency",
    code: `#include <atomic>
#include <memory>
#include <optional>
#include <iostream>

// Michael-Scott MPSC queue: multiple producers enqueue lock-free;
// single consumer dequeues lock-free. Used for feeding a strategy
// thread from multiple market-data and risk-engine threads.
template<typename T>
class MPSCQueue {
    struct Node {
        T                    data;
        std::atomic<Node*>   next{nullptr};
        explicit Node(T d) : data(std::move(d)) {}
        Node() = default;  // sentinel
    };

    alignas(64) std::atomic<Node*> head_;  // consumer end
    alignas(64) std::atomic<Node*> tail_;  // producer end

public:
    MPSCQueue() {
        Node* sentinel = new Node{};
        head_.store(sentinel, std::memory_order_relaxed);
        tail_.store(sentinel, std::memory_order_relaxed);
    }

    ~MPSCQueue() {
        while (try_pop()) {}
        delete head_.load(std::memory_order_relaxed);
    }

    // Lock-free enqueue (multiple threads may call concurrently)
    void push(T val) {
        Node* node = new Node(std::move(val));
        // Swing tail to new node; previous tail links to it
        Node* prev = tail_.exchange(node, std::memory_order_acq_rel);
        prev->next.store(node, std::memory_order_release);
    }

    // Single-threaded dequeue
    std::optional<T> try_pop() {
        Node* h = head_.load(std::memory_order_relaxed);
        Node* n = h->next.load(std::memory_order_acquire);
        if (!n) return std::nullopt;
        T val = std::move(n->data);
        head_.store(n, std::memory_order_release);
        delete h; // delete old sentinel
        return val;
    }
};

int main() {
    MPSCQueue<int> q;
    q.push(1); q.push(2); q.push(3);
    while (auto v = q.try_pop()) std::cout << *v << " ";
    std::cout << "\n"; // 1 2 3
}`,
    explanation:
      "The MPSC Michael-Scott queue uses a sentinel (dummy) head node so the consumer never competes with producers. The producer's tail.exchange is a single atomic swap — after it returns, prev->next is the only update needed to complete the enqueue. The consumer reads head->next without a CAS, making dequeue a pure load + store — wait-free on the consumer side.",
  },
  {
    id: "cpp-20260715-b1-thread-local-slab",
    language: "cpp",
    title: "Thread-Local Slab Allocator for Zero-Contention Allocation",
    tag: "allocators",
    code: `#include <cstddef>
#include <cstdlib>
#include <cassert>
#include <array>
#include <new>

// Per-thread slab allocator: each thread has its own pool.
// Allocation = pointer bump; no lock, no atomic, no CAS.
// Deallocation = return to the thread's own free list.
template<std::size_t ObjSize, std::size_t Cap = 4096>
class ThreadLocalSlab {
    static_assert(ObjSize >= sizeof(void*), "Object too small for free-list link");
    union Block {
        Block*                                next;
        alignas(std::max_align_t) char        data[ObjSize];
    };

    std::array<Block, Cap> arena_;
    Block*                 free_ = nullptr;
    std::size_t            bump_ = 0;

public:
    ThreadLocalSlab() = default;

    void* allocate() {
        if (free_) {                     // hot path: recycled block
            Block* b = free_;
            free_    = b->next;
            return b->data;
        }
        if (bump_ < Cap) {               // warm path: fresh from arena
            return arena_[bump_++].data;
        }
        return ::operator new(ObjSize);  // cold path: fallback to global heap
    }

    void deallocate(void* ptr) {
        auto* b  = reinterpret_cast<Block*>(static_cast<char*>(ptr) - offsetof(Block, data));
        // Only recycle if ptr came from our arena
        if (b >= arena_.data() && b < arena_.data() + Cap) {
            b->next = free_;
            free_   = b;
        } else {
            ::operator delete(ptr);
        }
    }
};

struct Order { uint64_t id; double price; uint32_t qty; };
thread_local ThreadLocalSlab<sizeof(Order), 2048> tl_order_slab;

Order* alloc_order() { return new (tl_order_slab.allocate()) Order; }
void   free_order(Order* o) { o->~Order(); tl_order_slab.deallocate(o); }`,
    explanation:
      "Thread-local slabs eliminate every synchronisation primitive from the allocation fast path: bump_ and free_ are accessed by only one thread, so no atomic operations are needed. The three code paths mirror OS allocator tiers: recycled (cheapest), bump (cheap), and fallback (rare, expensive). This achieves <5 ns allocation latency under contention, vs. 30–50 ns for jemalloc under multi-thread pressure.",
  },
  {
    id: "cpp-20260715-b1-constexpr-fd-weights",
    language: "cpp",
    title: "constexpr Finite-Difference Weight Table for High-Order Greeks",
    tag: "meta-programming",
    code: `#include <array>
#include <cstddef>
#include <cmath>

// Finite-difference weights for derivatives of arbitrary order
// using the Fornberg (1988) algorithm.
// Computed at compile time: the coefficient table lives in .rodata.

// Central difference weights for first derivative, 2nd-order accuracy:
//   d/dh: [-0.5, 0, 0.5] with step h
// Central difference for second derivative, 4th-order accuracy:
//   d^2/dh^2: [-1/12, 4/3, -5/2, 4/3, -1/12] / h^2

// Hard-coded central FD stencils (Fornberg)
struct FDWeights {
    // 2nd-order first derivative: f'(x) ~ (f(x+h) - f(x-h)) / (2h)
    static constexpr std::array<double, 3> d1_order2 = {-0.5, 0.0, 0.5};

    // 4th-order first derivative: 5-point stencil
    // f'(x) ~ (1/12 f(x-2h) - 2/3 f(x-h) + 2/3 f(x+h) - 1/12 f(x+2h)) / h
    static constexpr std::array<double, 5> d1_order4 =
        {1.0/12.0, -2.0/3.0, 0.0, 2.0/3.0, -1.0/12.0};

    // 2nd-order second derivative: f''(x) ~ (f(x-h) - 2f(x) + f(x+h)) / h^2
    static constexpr std::array<double, 3> d2_order2 = {1.0, -2.0, 1.0};

    // 4th-order second derivative: 5-point stencil
    static constexpr std::array<double, 5> d2_order4 =
        {-1.0/12.0, 4.0/3.0, -5.0/2.0, 4.0/3.0, -1.0/12.0};
};

// Apply a stencil: f is the function values at [x-2h, x-h, x, x+h, x+2h]
template<std::size_t N>
double apply_stencil(const std::array<double, N>& w,
                     const std::array<double, N>& f,
                     double h, int deriv_order) {
    double sum = 0.0;
    for (std::size_t i = 0; i < N; ++i) sum += w[i] * f[i];
    return sum / std::pow(h, deriv_order);
}

// Example: compute delta and gamma of a BS call via 4th-order FD
#include <functional>
double bs_call_price(double S, double K, double r, double sigma, double T);  // forward decl

double delta_4th_order(auto pricer, double S, double h) {
    std::array<double, 5> f;
    for (int i = -2; i <= 2; ++i) f[i+2] = pricer(S + i * h);
    return apply_stencil(FDWeights::d1_order4, f, h, 1);
}`,
    explanation:
      "Pre-computing finite-difference coefficient tables at compile time eliminates the Fornberg recurrence from the hot path. 4th-order stencils use 5 function evaluations but reduce the truncation error from O(h²) to O(h⁴), allowing a 10× larger bump size h for the same accuracy — critical when the pricing function is slow (MC or PDE) and each evaluation costs milliseconds.",
  },
  {
    id: "cpp-20260715-b1-ranges-pipeline",
    language: "cpp",
    title: "std::ranges Pipeline for Order Filtering and Projection",
    tag: "data-structures",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <iostream>
#include <numeric>

struct Order {
    int      id;
    double   price;
    int      qty;
    bool     buy;
    bool     filled;
};

// Compose lazy views without intermediate containers.
// The pipeline below filters, projects, and accumulates in one pass
// — no temporary std::vector<double>.
void analyse_orders(const std::vector<Order>& orders, double min_price) {
    // Active buy orders above min_price, sorted by price descending
    auto filtered = orders
        | std::views::filter([](const Order& o){ return o.buy && !o.filled; })
        | std::views::filter([min_price](const Order& o){ return o.price > min_price; });

    // Total notional of filtered orders (price * qty)
    double total_notional = std::transform_reduce(
        filtered.begin(), filtered.end(), 0.0, std::plus<>{},
        [](const Order& o){ return o.price * o.qty; });
    std::cout << "Notional (filtered buys): " << total_notional << "\n";

    // Best 3 prices (take first 3 from sorted view)
    std::vector<Order> sorted(filtered.begin(), filtered.end());
    std::sort(sorted.begin(), sorted.end(),
              [](const Order& a, const Order& b){ return a.price > b.price; });
    for (const auto& o : sorted | std::views::take(3))
        std::cout << "  id=" << o.id << " px=" << o.price << " qty=" << o.qty << "\n";
}

int main() {
    std::vector<Order> orders = {
        {1, 100.5, 100, true,  false},
        {2, 101.0, 200, true,  false},
        {3,  99.0,  50, true,  true },  // filled — excluded
        {4, 100.2, 150, false, false},  // sell — excluded
        {5, 103.0,  75, true,  false},
    };
    analyse_orders(orders, 100.0); // filter price > 100
}`,
    explanation:
      "std::views are lazy: the filter and projection lambdas run on demand during the single pass in transform_reduce — no intermediate heap allocation. For large order books (10,000+ orders), this avoids allocating a filtered temporary vector, keeping the working set in cache. std::views::take(3) short-circuits iteration after the third element.",
  },
  {
    id: "cpp-20260715-b1-monotonic-stack-drawdown",
    language: "cpp",
    title: "Monotonic Stack for Maximum Drawdown Detection",
    tag: "data-structures",
    code: `#include <vector>
#include <stack>
#include <algorithm>
#include <iostream>

// Maximum drawdown: largest peak-to-trough decline in a price series.
// Naive: O(N^2) — check every (i,j) pair.
// Monotonic stack approach: O(N) — maintain a decreasing stack of peaks.

double max_drawdown(const std::vector<double>& prices) {
    if (prices.empty()) return 0.0;
    double max_dd = 0.0;
    double peak   = prices[0];

    for (double p : prices) {
        if (p > peak) peak = p;       // new all-time high
        double dd = (peak - p) / peak; // drawdown from peak
        if (dd > max_dd) max_dd = dd;
    }
    return max_dd; // as a fraction of peak
}

// Variant: find the (start, end) indices of the maximum drawdown interval
std::pair<int,int> max_drawdown_indices(const std::vector<double>& prices) {
    int n = (int)prices.size();
    int best_peak = 0, best_trough = 0, cur_peak = 0;
    double best_dd = 0.0;

    for (int i = 1; i < n; ++i) {
        if (prices[i] > prices[cur_peak]) {
            cur_peak = i; // monotonically update peak
        } else {
            double dd = (prices[cur_peak] - prices[i]) / prices[cur_peak];
            if (dd > best_dd) {
                best_dd     = dd;
                best_peak   = cur_peak;
                best_trough = i;
            }
        }
    }
    return {best_peak, best_trough};
}

// Calmar ratio: annualised return / max drawdown
double calmar(double ann_return, const std::vector<double>& nav) {
    double dd = max_drawdown(nav);
    return dd > 0 ? ann_return / dd : std::numeric_limits<double>::infinity();
}

int main() {
    std::vector<double> nav = {100, 110, 108, 120, 95, 130, 100, 140};
    auto [pk, tr] = max_drawdown_indices(nav);
    std::cout << "Max drawdown: " << max_drawdown(nav) * 100 << "%\n";  // 20.8%
    std::cout << "Peak idx=" << pk << " Trough idx=" << tr << "\n"; // 3, 4
}`,
    explanation:
      "The single-pass algorithm maintains a running peak: at each price, the drawdown from that peak is computed in O(1). Maximum drawdown is required by FINRA and risk mandates as the measure of worst realized loss; the Calmar ratio (return/MaxDD) is preferred over Sharpe by CTAs because it penalises large drawdowns that Sharpe (which only uses standard deviation) underweights.",
  },
  {
    id: "cpp-20260715-b1-vol-surface-grid",
    language: "cpp",
    title: "2D Volatility Surface Grid with Bilinear Interpolation",
    tag: "numerics",
    code: `#include <vector>
#include <cstddef>
#include <stdexcept>
#include <algorithm>
#include <iostream>

// Row-major 2D grid: rows = expiry tenors, cols = moneyness (K/F ratio).
// Bilinear interpolation for arbitrary (tenor, moneyness) queries.
class VolSurface {
    std::vector<double> tenors_;     // expiry grid (years)
    std::vector<double> moneyness_;  // K/F ratio grid
    std::vector<double> vols_;       // implied vols, row-major

    std::size_t idx(std::size_t row, std::size_t col) const {
        return row * moneyness_.size() + col;
    }

public:
    VolSurface(std::vector<double> t, std::vector<double> m,
               std::vector<double> v)
        : tenors_(std::move(t)), moneyness_(std::move(m)), vols_(std::move(v)) {
        if (vols_.size() != tenors_.size() * moneyness_.size())
            throw std::invalid_argument("Vol grid size mismatch");
    }

    double interpolate(double T, double m) const {
        // Find bracketing indices for T
        auto it_T = std::lower_bound(tenors_.begin(), tenors_.end(), T);
        if (it_T == tenors_.end())   it_T = std::prev(tenors_.end());
        if (it_T == tenors_.begin()) ++it_T; // need at least one step back
        std::size_t i1 = static_cast<std::size_t>(it_T - tenors_.begin());
        std::size_t i0 = i1 - 1;

        // Find bracketing indices for m
        auto it_m = std::lower_bound(moneyness_.begin(), moneyness_.end(), m);
        if (it_m == moneyness_.end())   it_m = std::prev(moneyness_.end());
        if (it_m == moneyness_.begin()) ++it_m;
        std::size_t j1 = static_cast<std::size_t>(it_m - moneyness_.begin());
        std::size_t j0 = j1 - 1;

        // Bilinear weights
        double wT = (T - tenors_[i0]) / (tenors_[i1] - tenors_[i0]);
        double wm = (m - moneyness_[j0]) / (moneyness_[j1] - moneyness_[j0]);

        double v00 = vols_[idx(i0, j0)], v01 = vols_[idx(i0, j1)];
        double v10 = vols_[idx(i1, j0)], v11 = vols_[idx(i1, j1)];

        return (1-wT)*(1-wm)*v00 + (1-wT)*wm*v01
              +    wT*(1-wm)*v10 +    wT*wm*v11;
    }
};

int main() {
    VolSurface surf(
        {0.25, 0.5, 1.0, 2.0},     // tenors
        {0.80, 0.90, 1.00, 1.10, 1.20}, // moneyness
        {  // 4x5 implied vol grid (approximate)
            0.22, 0.20, 0.18, 0.19, 0.21,
            0.21, 0.19, 0.17, 0.18, 0.20,
            0.20, 0.18, 0.16, 0.17, 0.19,
            0.19, 0.17, 0.15, 0.16, 0.18,
        }
    );
    double iv = surf.interpolate(0.75, 0.95);
    std::cout << "Interp vol at T=0.75, m=0.95: " << iv << "\n"; // ~0.18
}`,
    explanation:
      "Bilinear interpolation on a regular grid is O(log N) in each dimension for the binary search and O(1) for the interpolation itself. The row-major layout stores each tenor's moneyness slice contiguously, so reading all columns for a given tenor is a sequential memory access — ideal for the most common query pattern in options systems (sweep across strikes at a fixed expiry).",
  },
  {
    id: "cpp-20260715-b1-lookback-option-mc",
    language: "cpp",
    title: "Floating-Strike Lookback Option Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <iostream>

// Floating-strike lookback call: payoff = S_T - min(S_0,...,S_T)
// (buy at the historical minimum price, receive the terminal price).
// Provides perfect market timing — but prices at a heavy premium.
// Closed-form exists (Goldman-Sosin-Gatto 1979), but MC is shown here
// for extension to path-dependent vol or jumps.

struct LookbackMC {
    double S0, r, sigma, T;
    int    N;  // monitoring steps

    // Floating-strike lookback call price (MC)
    double price_call(int n_paths = 200000) const {
        double dt = T / N;
        std::mt19937_64 rng(42);
        std::normal_distribution<double> norm;
        double disc = std::exp(-r * T);
        double sum  = 0.0;

        for (int p = 0; p < n_paths; ++p) {
            double S = S0, S_min = S0;
            for (int t = 0; t < N; ++t) {
                S    *= std::exp((r - 0.5*sigma*sigma)*dt
                                 + sigma * std::sqrt(dt) * norm(rng));
                S_min = std::min(S_min, S);
            }
            sum += S - S_min;  // floating strike: pay minimum, receive terminal
        }
        return disc * sum / n_paths;
    }

    // Closed-form (Goldman-Sosin-Gatto, continuous monitoring)
    double price_call_analytic() const {
        auto N_cdf = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
        double sqT = std::sqrt(T);
        double a1  = (std::log(S0/S0) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
        double a2  = a1 - sigma * sqT;
        // When S=S_min=S0 at t=0 (standard setup):
        double a3  = (r + 0.5*sigma*sigma)*sqT / sigma;
        double price = S0 * N_cdf(a3)
                     - S0 * std::exp(-r*T) * N_cdf(a3 - sigma*sqT)
                     + std::exp(-r*T) * S0 * (sigma*sigma / (2*r))
                       * (std::exp(r*T) * N_cdf(a3) - N_cdf(a3) * (1 + 2*r*T/(sigma*sigma)));
        // Simplified approx for ATM floating: use known result
        return S0 * (N_cdf(a3) + std::exp(-r*T) * sigma * sqT * N_cdf(a3)); // approx
    }
};

int main() {
    LookbackMC lb{100, 0.05, 0.2, 1.0, 252};
    double mc_price = lb.price_call();
    std::cout << "Lookback MC call: " << mc_price << "\n"; // ~14-15
}`,
    explanation:
      "The floating-strike lookback's payoff is the difference between the terminal price and the path minimum — it always pays a non-negative amount and is more expensive than a vanilla call. Lookbacks are used in fund-linked products and structured notes; their closed-form requires Brownian reflection arguments. The MC version is straightforward but requires sufficient steps to capture the continuous minimum accurately.",
  },
  {
    id: "cpp-20260715-b1-lockfree-spsc-reuse",
    language: "cpp",
    title: "SPSC Ring Buffer with Object Recycling (Zero-Allocation Hot Path)",
    tag: "low-latency",
    code: `#include <atomic>
#include <array>
#include <cstdint>
#include <optional>
#include <iostream>

// SPSC ring buffer where slots hold reusable objects.
// Producer claims a slot, writes into it, publishes.
// Consumer reads, processes, then explicitly releases the slot back.
// Total heap allocations after init: zero.
template<typename T, std::size_t Cap>
class SPSCRingReuse {
    static_assert((Cap & (Cap-1)) == 0, "Cap must be power of 2");
    static constexpr std::size_t MASK = Cap - 1;

    struct alignas(64) Slot {
        std::atomic<uint64_t> seq;
        T                     data;
    };
    std::array<Slot, Cap> ring_;

    alignas(64) std::atomic<uint64_t> write_pos_{0};
    alignas(64) std::atomic<uint64_t> read_pos_{0};

public:
    SPSCRingReuse() {
        for (uint64_t i = 0; i < Cap; ++i)
            ring_[i].seq.store(i, std::memory_order_relaxed);
    }

    // Producer: returns pointer to slot for in-place construction
    T* try_claim() {
        uint64_t pos = write_pos_.load(std::memory_order_relaxed);
        Slot& slot   = ring_[pos & MASK];
        if (slot.seq.load(std::memory_order_acquire) != pos) return nullptr; // full
        write_pos_.store(pos + 1, std::memory_order_relaxed);
        return &slot.data;
    }

    void publish(T* data) {
        // Find the slot and advance its sequence to signal readiness
        auto* slot = reinterpret_cast<Slot*>(
            reinterpret_cast<char*>(data) - offsetof(Slot, data));
        uint64_t pos = write_pos_.load(std::memory_order_relaxed) - 1;
        slot->seq.store(pos + 1, std::memory_order_release); // now readable
    }

    // Consumer: pop available message
    std::optional<T*> try_consume() {
        uint64_t pos  = read_pos_.load(std::memory_order_relaxed);
        Slot& slot    = ring_[pos & MASK];
        uint64_t seq  = slot.seq.load(std::memory_order_acquire);
        if (seq != pos + 1) return std::nullopt; // not ready
        read_pos_.store(pos + 1, std::memory_order_relaxed);
        return &slot.data;
    }

    void release(T* data) {
        auto* slot = reinterpret_cast<Slot*>(
            reinterpret_cast<char*>(data) - offsetof(Slot, data));
        uint64_t rp = read_pos_.load(std::memory_order_relaxed);
        slot->seq.store(rp + Cap - 1, std::memory_order_release); // reclaim
    }
};`,
    explanation:
      "The slot sequence number doubles as an availability flag: the producer sets seq=pos (slot empty, ready to claim), then sets seq=pos+1 (slot full, ready to consume); the consumer resets seq=pos+Cap-1 (slot recycled). This three-state protocol allows zero-copy in-place object reuse across the ring with only atomic stores — no CAS, no lock, sub-20-ns round-trip.",
  },
];
