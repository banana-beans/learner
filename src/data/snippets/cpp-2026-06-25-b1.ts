import type { Snippet } from "./types";

export const cppSnippets20260625B1: Snippet[] = [
  {
    id: "cpp-20260625-b1-concepts",
    language: "cpp",
    title: "C++20 Concepts for type-safe numeric and order constraints",
    tag: "modern",
    code: `#include <concepts>
#include <type_traits>
#include <cstdint>
#include <vector>
#include <ranges>

// Named concept: any floating-point type usable as a price
template <typename T>
concept Price = std::floating_point<T>;

// Structural concept: any type exposing the order interface
template <typename T>
concept OrderLike = requires(const T& o) {
    { o.price() } -> Price;
    { o.qty()   } -> std::integral;
    { o.id()    } -> std::convertible_to<std::uint64_t>;
};

// Concept for a callable pricer: (S, K, r, sigma, T) -> double
template <typename F>
concept OptionPricer = std::invocable<F, double, double, double, double, double>
    && requires(F f) {
        { f(1.0, 1.0, 0.05, 0.2, 1.0) } -> std::same_as<double>;
    };

// Generic mid-price: works for any pair of OrderLike bid/ask
template <OrderLike Bid, OrderLike Ask>
double midPrice(const Bid& bid, const Ask& ask) {
    return (static_cast<double>(bid.price()) + static_cast<double>(ask.price())) * 0.5;
}

// Batch pricer: apply any OptionPricer over a range of parameter tuples
template <OptionPricer Pricer>
std::vector<double> batchPrice(Pricer&& pricer,
    const std::vector<std::tuple<double,double,double,double,double>>& params) {
    std::vector<double> out;
    out.reserve(params.size());
    for (const auto& [s, k, r, sig, t] : params)
        out.push_back(pricer(s, k, r, sig, t));
    return out;
}

// Abbreviated function template (C++20): auto parameters use concept constraints
auto spreadBps(OrderLike auto const& bid, OrderLike auto const& ask) -> double {
    return (ask.price() - bid.price()) / bid.price() * 10000.0;
}`,
    explanation: "C++20 concepts eliminate SFINAE by expressing interface requirements as readable boolean constraints — the compiler checks the constraint at the call site, generating a short, precise error rather than a multi-page template backtrace; structural concepts (requires-expressions) enable duck typing without inheritance, so any type satisfying OrderLike can be used in generic algorithms without modifying existing classes.",
  },
  {
    id: "cpp-20260625-b1-span",
    language: "cpp",
    title: "std::span for zero-copy order batch processing",
    tag: "modern",
    code: `#include <span>
#include <vector>
#include <cstdint>
#include <numeric>
#include <algorithm>

struct Order {
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    char          side;   // 'B' or 'S'
};

// std::span: non-owning view over contiguous Order memory.
// No copy of orders occurs — the span holds only a pointer + size.
double vwap(std::span<const Order> orders) noexcept {
    double total_notional = 0.0;
    std::int64_t total_qty = 0;
    for (const auto& o : orders) {
        int abs_qty = std::abs(o.qty);
        total_notional += o.price * abs_qty;
        total_qty      += abs_qty;
    }
    return total_qty > 0 ? total_notional / total_qty : 0.0;
}

// Process only the first n orders: static extent span
template <std::size_t N>
double vwapFixed(std::span<const Order, N> orders) noexcept {
    return vwap(orders);  // delegates to dynamic-extent overload
}

// Split large order batch into chunks for parallel processing
void processBatch(std::span<const Order> all_orders,
                   std::size_t chunk_size) {
    for (std::size_t i = 0; i < all_orders.size(); i += chunk_size) {
        // Subspan: no copy, just an offset into the same buffer
        auto chunk = all_orders.subspan(i, std::min(chunk_size,
                                                      all_orders.size() - i));
        double v = vwap(chunk);
        (void)v;  // in production: route chunk to exchange
    }
}

// Functions accepting span work with vectors, arrays, and raw pointers
void demo() {
    std::vector<Order> orders{{1,100.0,100,'B'},{2,100.5,50,'S'}};
    double v1 = vwap(orders);           // from vector — zero copy

    Order arr[3] = {{3,101.0,200,'B'},{4,100.2,150,'S'},{5,99.8,75,'B'}};
    double v2 = vwap(arr);              // from raw array — zero copy
    (void)v1; (void)v2;
}`,
    explanation: "std::span is the C++20 replacement for (pointer, size) pairs — it is a non-owning view that works over any contiguous storage (vector, array, raw pointer) without copying; static-extent spans (std::span<T, N>) carry the size in the type, enabling additional compile-time checks and letting the compiler prove loop bounds at compile time, which can generate tighter SIMD loops than dynamic-extent spans.",
  },
  {
    id: "cpp-20260625-b1-pmr-pool",
    language: "cpp",
    title: "Polymorphic Memory Resource pool allocator for order objects",
    tag: "modern",
    code: `#include <memory_resource>
#include <vector>
#include <list>
#include <cstdint>
#include <cstddef>

// std::pmr (C++17): replace global new/delete with a custom allocator
// without changing the container's type (unlike std::allocator-parameterised containers).

struct Order {
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    std::uint8_t  flags;
};

// 1. Monotonic buffer: never frees individual allocations.
//    Perfect for a single time-step where we allocate many orders, then clear all at once.
class OrderArena {
    static constexpr std::size_t POOL_SIZE = 1 << 20;  // 1 MB on stack/BSS

    alignas(std::max_align_t) std::byte pool_[POOL_SIZE];
    std::pmr::monotonic_buffer_resource mbr_;

public:
    OrderArena() : mbr_(pool_, POOL_SIZE, std::pmr::null_memory_resource()) {}

    // Returns allocator bound to this arena
    std::pmr::polymorphic_allocator<Order> allocator() {
        return std::pmr::polymorphic_allocator<Order>{&mbr_};
    }

    void reset() noexcept { mbr_.release(); }  // rewind all at once
};

// 2. Unsynchronized pool resource: recycles freed blocks of the same size.
//    Better than monotonic when orders have mixed lifetimes.
class OrderPool {
    std::pmr::unsynchronized_pool_resource pool_{
        std::pmr::pool_options{.max_blocks_per_chunk = 4096,
                               .largest_required_pool_block = sizeof(Order)},
        std::pmr::new_delete_resource()  // fallback for large allocations
    };

public:
    std::pmr::polymorphic_allocator<Order> allocator() {
        return std::pmr::polymorphic_allocator<Order>{&pool_};
    }
};

void demo() {
    OrderArena arena;
    auto alloc = arena.allocator();

    // pmr::vector uses the arena's memory — no global new
    std::pmr::vector<Order> orders{alloc};
    orders.reserve(1024);

    orders.push_back({1, 100.0, 500, 0});
    orders.push_back({2, 100.5, 200, 1});

    // pmr::list also works — each node allocates from the arena
    std::pmr::list<Order> pending{alloc};
    pending.push_back({3, 99.0, 100, 0});

    // At end of time-step: O(1) bulk free, no individual destructors called
    arena.reset();
}`,
    explanation: "PMR decouples the allocation strategy from the container type — std::pmr::vector<Order> is the same type regardless of whether it allocates from a monotonic arena, a pool, or global new, enabling polymorphic dispatch of the allocator at runtime without template proliferation; monotonic_buffer_resource is O(1) for both allocation and deallocation of the entire arena, making it ideal for per-message or per-cycle order batches in HFT.",
  },
  {
    id: "cpp-20260625-b1-constexpr-bsm",
    language: "cpp",
    title: "constexpr Black-Scholes at compile time for static option tables",
    tag: "modern",
    code: `#include <cmath>
#include <array>
#include <cstddef>

// constexpr sqrt via Newton-Raphson (needed because std::sqrt is not constexpr before C++23)
constexpr double csqrt(double x) noexcept {
    if (x < 0.0) return 0.0;
    if (x == 0.0) return 0.0;
    double r = x;
    for (int i = 0; i < 64; ++i)
        r = 0.5 * (r + x / r);
    return r;
}

// constexpr approximation of erfc via Horner polynomial (Abramowitz & Stegun 7.1.26)
constexpr double cerfc(double x) noexcept {
    double t = 1.0 / (1.0 + 0.3275911 * x);
    double poly = t * (0.254829592 +
                   t * (-0.284496736 +
                   t * (1.421413741 +
                   t * (-1.453152027 +
                   t *  1.061405429))));
    // exp(-x*x) approximated via Taylor for constexpr
    double xx = -x * x;
    double e  = 1.0;
    double term = 1.0;
    for (int k = 1; k <= 20; ++k) {
        term *= xx / k;
        e    += term;
    }
    return poly * e;
}

constexpr double cN(double x) noexcept {
    return 0.5 * cerfc(-x / csqrt(2.0));
}

// Full Black-Scholes call price — evaluated at compile time if inputs are constexpr
constexpr double bsCall(double S, double K, double r, double sigma, double T) noexcept {
    if (T <= 0.0 || sigma <= 0.0) return (S > K ? S - K : 0.0);
    double sqT = csqrt(T);
    double lSK = S / K;  // approximate log(S/K) as (S-K)/K for constexpr
    // Proper log requires C++26 constexpr math; use approximation here
    // For exact constexpr: use Taylor ln(1+x) if near 1.0
    double ln_sk = (lSK - 1.0) - 0.5*(lSK-1.0)*(lSK-1.0);  // ln(1+u) ≈ u - u^2/2
    double d1 = (ln_sk + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double d2 = d1 - sigma*sqT;
    return S * cN(d1) - K * (1.0 / (1.0 + r*T)) * cN(d2);  // approx disc
}

// Build a strike grid at compile time: 25 prices for strikes 80..120
static constexpr auto STRIKE_TABLE = []() constexpr {
    std::array<double, 25> table{};
    for (std::size_t i = 0; i < 25; ++i) {
        double K = 80.0 + i * 2.0;
        table[i] = bsCall(100.0, K, 0.05, 0.20, 0.5);
    }
    return table;
}();

// At runtime: O(1) lookup into the pre-computed table
double lookupBsCall(double K_nearest) {
    int idx = static_cast<int>((K_nearest - 80.0) / 2.0);
    if (idx < 0 || idx >= 25) return 0.0;
    return STRIKE_TABLE[idx];
}`,
    explanation: "constexpr functions evaluated at compile time produce static data with no runtime cost — the STRIKE_TABLE array is filled entirely by the compiler and placed in the read-only data segment, making option price lookups as fast as an array access; the limitation is that standard math functions (sqrt, log, exp) are not constexpr before C++23/26, requiring polynomial approximations for fully-constexpr pricers.",
  },
  {
    id: "cpp-20260625-b1-ranges",
    language: "cpp",
    title: "C++20 ranges and views for lazy order-book pipeline",
    tag: "modern",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <cstdint>
#include <numeric>

struct Order {
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    char          side;
    bool          is_active;
};

// All range operations below are lazy — no intermediate vectors are allocated.
// The pipeline runs only when the terminal operation (collect, accumulate) consumes elements.

void processOrderBook(const std::vector<Order>& book) {

    // Filter active buys above 100.0, transform to (id, qty) pairs, take first 10
    auto top_bids =
        book
        | std::views::filter([](const Order& o){ return o.is_active && o.side == 'B'; })
        | std::views::filter([](const Order& o){ return o.price > 100.0; })
        | std::views::transform([](const Order& o)
              -> std::pair<std::uint64_t, int> { return {o.id, o.qty}; })
        | std::views::take(10);

    // Materialise only what we actually consume (lazy evaluation)
    std::vector<std::pair<std::uint64_t,int>> result(
        std::ranges::begin(top_bids), std::ranges::end(top_bids));

    // Total notional of active sell orders: ranges::fold_left (C++23) or accumulate
    double sell_notional = std::accumulate(
        std::ranges::begin(book), std::ranges::end(book), 0.0,
        [](double acc, const Order& o) {
            return acc + (o.side == 'S' && o.is_active ? o.price * o.qty : 0.0);
        });

    // Sort by price descending in-place (ranges::sort takes a range directly)
    std::vector<Order> sorted_book = book;  // copy for in-place sort
    std::ranges::sort(sorted_book, std::ranges::greater{}, &Order::price);

    // Zip prices and quantities (C++23 std::views::zip)
    // For C++20: use views::iota + subscript
    auto indices = std::views::iota(0UZ, book.size());
    for (auto i : indices) {
        const auto& o = book[i];
        if (o.price > 99.5) break;
    }

    (void)result; (void)sell_notional;
}`,
    explanation: "Ranges views are lazy: filter() and transform() produce view objects that describe the transformation without executing it — elements are processed one at a time only when the consuming range-for or algorithm pulls them; this avoids allocating intermediate vectors and allows the compiler to fuse adjacent transformations into a single loop, which can improve I-cache utilisation compared to multiple std::copy_if passes over a large order book.",
  },
  {
    id: "cpp-20260625-b1-crtp",
    language: "cpp",
    title: "CRTP for compile-time strategy dispatch without virtual tables",
    tag: "modern",
    code: `#include <cstdint>
#include <cstdio>
#include <type_traits>

// Curiously Recurring Template Pattern (CRTP):
// Base class parameterised by Derived eliminates virtual dispatch.
// The static_cast to Derived* at compile time resolves the exact method,
// so the call is inlined and no vtable indirection occurs.

struct MarketData {
    double bid;
    double ask;
    std::uint64_t ts_ns;
};

template <typename Derived>
class StrategyBase {
public:
    // Non-virtual dispatch: resolved at compile time
    bool shouldTrade(const MarketData& md) noexcept {
        return static_cast<Derived*>(this)->shouldTradeImpl(md);
    }

    double targetQty(const MarketData& md) noexcept {
        return static_cast<Derived*>(this)->targetQtyImpl(md);
    }

    // Default implementations (can be overridden)
    bool shouldTradeImpl(const MarketData& md) noexcept { return md.ask - md.bid < 0.02; }
    double targetQtyImpl(const MarketData&) noexcept { return 100.0; }

    // Non-overrideable template method — always runs before trade
    void onTick(const MarketData& md) noexcept {
        ++tick_count_;
        if (shouldTrade(md)) {
            double qty = targetQty(md);
            (void)qty;  // in production: submit order
        }
    }

protected:
    std::uint64_t tick_count_ = 0;
};

// Concrete strategy overrides only the parts it cares about
class MomentumStrategy : public StrategyBase<MomentumStrategy> {
    double ema_  = 0.0;
    double alpha_ = 0.1;

public:
    bool shouldTradeImpl(const MarketData& md) noexcept {
        double mid = (md.bid + md.ask) * 0.5;
        ema_ = alpha_ * mid + (1 - alpha_) * ema_;
        return mid > ema_ * 1.001;  // price above EMA by 0.1%
    }

    double targetQtyImpl(const MarketData&) noexcept { return 500.0; }
};

class MarketMakingStrategy : public StrategyBase<MarketMakingStrategy> {
    double target_spread_ = 0.01;

public:
    bool shouldTradeImpl(const MarketData& md) noexcept {
        return md.ask - md.bid >= target_spread_;
    }
};

// Caller is fully type-specific — compiler knows exactly which impl to call
template <typename S>
void runStrategy(S& strategy, const MarketData* ticks, int n) noexcept {
    for (int i = 0; i < n; ++i) strategy.onTick(ticks[i]);
}`,
    explanation: "CRTP achieves the 'open recursion' pattern (base calling derived methods) without a vtable — the static_cast at compile time is resolved to the exact derived-class method, which the compiler typically inlines, producing code as fast as a direct function call; unlike non-virtual interfaces (NVI pattern with private virtuals), CRTP pays zero overhead even when instantiated in tight loops, making it suitable for per-tick callbacks that run millions of times per second.",
  },
  {
    id: "cpp-20260625-b1-treiber-stack",
    language: "cpp",
    title: "Treiber lock-free stack for risk limit check pipeline",
    tag: "concurrency",
    code: `#include <atomic>
#include <optional>
#include <memory>
#include <cstdint>

// Treiber (1986) lock-free stack: push/pop via compare-and-swap (CAS).
// Used for a pool of pre-allocated risk-check result objects.
// WARNING: naive implementation suffers from ABA problem.
// Production: use hazard pointers or tagged pointers (below).

template <typename T>
class TreiberStack {
    struct Node {
        T     data;
        Node* next = nullptr;
        explicit Node(T v) : data(std::move(v)) {}
    };

    std::atomic<Node*> top_{nullptr};

public:
    ~TreiberStack() {
        // Drain remaining nodes — single-threaded at destruction
        Node* cur = top_.load(std::memory_order_relaxed);
        while (cur) { auto* n = cur->next; delete cur; cur = n; }
    }

    void push(T val) {
        Node* n = new Node(std::move(val));
        Node* old_top;
        do {
            old_top = top_.load(std::memory_order_relaxed);
            n->next = old_top;
        } while (!top_.compare_exchange_weak(
                     old_top, n,
                     std::memory_order_release,   // success: publish new node
                     std::memory_order_relaxed));  // failure: retry without fence
    }

    std::optional<T> pop() {
        Node* old_top;
        do {
            old_top = top_.load(std::memory_order_acquire);
            if (!old_top) return std::nullopt;
        } while (!top_.compare_exchange_weak(
                     old_top, old_top->next,
                     std::memory_order_acquire,   // success: synchronise with push
                     std::memory_order_relaxed));

        T val = std::move(old_top->data);
        // ABA risk: another thread may have popped AND RE-PUSHED old_top here.
        // Safe only if the allocator never returns the same address during the CAS window.
        // Production fix: use std::atomic<std::pair<Node*, uint64_t>> (tagged pointer).
        delete old_top;
        return val;
    }

    bool empty() const noexcept {
        return top_.load(std::memory_order_acquire) == nullptr;
    }
};

// ABA-safe variant: tagged pointer encodes a version counter in unused high bits
struct TaggedPtr {
    Node*    ptr;
    uint64_t tag;
};
// (full tagged-pointer variant omitted for brevity; require 128-bit CAS on x86-64)`,
    explanation: "The Treiber stack's CAS loop retries only when another thread concurrently modified the top pointer — under low contention, the first CAS usually succeeds; the ABA problem occurs when thread A reads top=X, gets preempted, thread B pops X, deallocates it, pushes a new node that gets the same address, then A's CAS incorrectly succeeds on a now-reused pointer; tagged pointers (incrementing a counter on every push) prevent this because the tag differs even when the address matches.",
  },
  {
    id: "cpp-20260625-b1-memory-order",
    language: "cpp",
    title: "Memory ordering: relaxed, acquire/release, and seq_cst patterns",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <cstdint>

// Three ordering levels and when to use each:

// 1. relaxed: no ordering guarantee. Safe for counters where you only need atomicity.
std::atomic<std::uint64_t> g_tick_count{0};
void incrementTick() noexcept {
    // We don't care about the order relative to other memory operations.
    g_tick_count.fetch_add(1, std::memory_order_relaxed);
}

// 2. acquire/release: single synchronisation point between producer and consumer.
// Producer: write data, then release-store the ready flag.
// Consumer: acquire-load the flag; if set, all prior writes are visible.
struct DataReady {
    double price = 0.0;
    std::uint64_t ts_ns = 0;
    std::atomic<bool> ready{false};  // flag
};

void produceData(DataReady& dr, double price, std::uint64_t ts) {
    dr.price  = price;    // plain stores — no ordering yet
    dr.ts_ns  = ts;
    // release: all prior stores happen-before any load that acquires this
    dr.ready.store(true, std::memory_order_release);
}

bool consumeData(DataReady& dr, double& out_price) {
    // acquire: all subsequent loads see stores from the releasing thread
    if (!dr.ready.load(std::memory_order_acquire)) return false;
    out_price = dr.price;   // guaranteed to see the producer's write
    return true;
}

// 3. seq_cst: total order across all seq_cst operations.
// Required for: Dekker's algorithm, Petersons mutex, any pattern needing
// a single global happens-before order visible to all threads.
// Costs: full memory fence on x86 (MFENCE); significant on ARM.
std::atomic<bool> flag_a{false}, flag_b{false};
std::atomic<int>  turn{0};  // Peterson's mutex (illustrative, not production)

void threadA(int& shared_counter) {
    flag_a.store(true, std::memory_order_seq_cst);
    turn.store(1, std::memory_order_seq_cst);
    while (flag_b.load(std::memory_order_seq_cst) &&
           turn.load(std::memory_order_seq_cst) == 1) {}
    ++shared_counter;  // critical section
    flag_a.store(false, std::memory_order_seq_cst);
}

// Rule of thumb for HFT:
// - counters:     relaxed
// - single handoff (SPSC): release/acquire
// - global visible ordering: seq_cst (use sparingly — ~5ns penalty per op)`,
    explanation: "Acquire/release is the minimum ordering for producer-consumer handoffs — it creates a synchronisation edge only between the releasing store and the acquiring load, avoiding the full memory fence that seq_cst implies; on x86-64, release-store and acquire-load compile to ordinary MOV instructions (x86's TSO model provides acquire/release 'for free'), while seq_cst requires an MFENCE or LOCK XCHG, adding 5-20ns per operation on typical server CPUs.",
  },
  {
    id: "cpp-20260625-b1-fix-parser",
    language: "cpp",
    title: "FIX 4.x tag=value protocol parser with SOH delimiter",
    tag: "market-data",
    code: `#include <string_view>
#include <charconv>
#include <cstdint>
#include <cstring>
#include <optional>

// FIX protocol: messages are sequences of "tag=value\x01" fields
// where 0x01 (SOH, Start of Heading) is the delimiter.
// High-throughput parsing requires zero-copy, zero-allocation field extraction.

static constexpr char SOH = '\x01';

struct FixField {
    int            tag;
    std::string_view value;
};

// Parse a single tag=value field. Returns the field and advances 'buf'.
// Returns nullopt if buf is exhausted or malformed.
std::optional<FixField> parseFixField(std::string_view& buf) noexcept {
    // Find '='
    auto eq = buf.find('=');
    if (eq == std::string_view::npos) return std::nullopt;

    // Parse tag number
    int tag = 0;
    auto [ptr, ec] = std::from_chars(buf.data(), buf.data() + eq, tag);
    if (ec != std::errc{}) return std::nullopt;

    // Value: from after '=' to next SOH
    std::string_view rest = buf.substr(eq + 1);
    auto soh = rest.find(SOH);
    std::string_view value = (soh != std::string_view::npos)
                             ? rest.substr(0, soh)
                             : rest;

    // Advance buf past this field (including SOH)
    buf = (soh != std::string_view::npos)
          ? rest.substr(soh + 1)
          : std::string_view{};

    return FixField{tag, value};
}

struct FixNewOrder {
    std::uint64_t cl_ord_id = 0;
    char          symbol[9] = {};
    char          side       = 0;   // '1'=buy, '2'=sell
    std::int32_t  order_qty  = 0;
    double        price      = 0.0;
    char          ord_type   = 0;   // '1'=market, '2'=limit
    bool          valid       = false;
};

// Decode a FIX NewOrder (tag 35=D) message body (after the header)
FixNewOrder parseNewOrder(std::string_view msg) noexcept {
    FixNewOrder ord{};
    while (!msg.empty()) {
        auto f = parseFixField(msg);
        if (!f) break;

        switch (f->tag) {
        case 11:  // ClOrdID
            std::from_chars(f->value.data(), f->value.data() + f->value.size(), ord.cl_ord_id);
            break;
        case 55: { // Symbol (up to 8 chars)
            std::size_t n = std::min(f->value.size(), std::size_t{8});
            std::memcpy(ord.symbol, f->value.data(), n);
            ord.symbol[n] = '\0';
            break;
        }
        case 54:  // Side
            if (!f->value.empty()) ord.side = f->value[0];
            break;
        case 38:  // OrderQty
            std::from_chars(f->value.data(), f->value.data() + f->value.size(), ord.order_qty);
            break;
        case 44:  // Price
            std::from_chars(f->value.data(), f->value.data() + f->value.size(), ord.price);
            break;
        case 40:  // OrdType
            if (!f->value.empty()) ord.ord_type = f->value[0];
            break;
        }
    }
    ord.valid = ord.cl_ord_id != 0 && ord.symbol[0] != '\0';
    return ord;
}`,
    explanation: "FIX parsing with string_view and std::from_chars is allocation-free and avoids null-termination copies — from_chars parses integers and doubles directly from a pointer range without requiring a null-terminated string, eliminating the strtod/atoi overhead; since FIX messages arrive over TCP as contiguous byte buffers, using string_view sub-views creates zero-copy 'slices' into the network buffer, reducing memory bandwidth by avoiding any copying of field values.",
  },
  {
    id: "cpp-20260625-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list for zero-allocation order book",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cstddef>
#include <type_traits>

// Intrusive list: the list node is embedded in the Order struct itself.
// Eliminates the separate heap allocation that std::list uses per element.
// All Order objects live in a pre-allocated pool; the list just links them.

struct IntrusiveListNode {
    IntrusiveListNode* prev = nullptr;
    IntrusiveListNode* next = nullptr;
};

// Order struct: the node is embedded — no indirection through a pointer
struct Order {
    IntrusiveListNode node;  // MUST be first for safe casting in this demo
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    char          side;
    std::uint8_t  flags;
};

// Retrieve the Order from a node pointer via offsetof/static_cast
inline Order* orderFromNode(IntrusiveListNode* n) noexcept {
    return reinterpret_cast<Order*>(
        reinterpret_cast<std::byte*>(n) - offsetof(Order, node));
}

struct IntrusiveList {
    IntrusiveListNode sentinel;   // dummy head/tail node

    IntrusiveList() noexcept {
        sentinel.prev = &sentinel;
        sentinel.next = &sentinel;
    }

    bool empty() const noexcept { return sentinel.next == &sentinel; }

    void pushBack(Order* o) noexcept {
        auto* n    = &o->node;
        n->prev    = sentinel.prev;
        n->next    = &sentinel;
        sentinel.prev->next = n;
        sentinel.prev       = n;
    }

    void pushFront(Order* o) noexcept {
        auto* n    = &o->node;
        n->next    = sentinel.next;
        n->prev    = &sentinel;
        sentinel.next->prev = n;
        sentinel.next       = n;
    }

    // Unlink: O(1) — no search needed since we have the node directly
    void remove(Order* o) noexcept {
        auto* n = &o->node;
        n->prev->next = n->next;
        n->next->prev = n->prev;
        n->prev = n->next = nullptr;
    }

    Order* front() noexcept {
        return empty() ? nullptr : orderFromNode(sentinel.next);
    }

    Order* back() noexcept {
        return empty() ? nullptr : orderFromNode(sentinel.prev);
    }

    // Iterate: for(Order* o = list.front(); o; o = list.nextOf(o))
    Order* nextOf(Order* o) noexcept {
        auto* n = o->node.next;
        return (n == &sentinel) ? nullptr : orderFromNode(n);
    }
};`,
    explanation: "Intrusive lists embed the linkage inside the object, eliminating the separate Node allocation that std::list uses — for an order book with millions of insert/cancel operations per second, avoiding a heap allocation per operation removes both the allocator lock contention and the cache miss from dereferencing a separately-allocated node; the offset-based pointer recovery (offsetof) is defined behaviour in C++ when the node is a standard-layout member of a standard-layout struct.",
  },
  {
    id: "cpp-20260625-b1-vasicek",
    language: "cpp",
    title: "Vasicek one-factor short-rate model with exact simulation and ZCB pricing",
    tag: "fixed-income",
    code: `#include <cmath>
#include <random>
#include <vector>

// Vasicek (1977): dr = a*(b-r)*dt + sigma*dW
// Gaussian short rate; admits negative rates (unlike CIR).
// Exact transition: r(t+dt)|r(t) ~ N(b + (r-b)*exp(-a*dt), sigma^2*(1-exp(-2*a*dt))/(2*a))

struct VasicekParams {
    double a;      // mean-reversion speed
    double b;      // long-run mean
    double sigma;  // volatility
};

// Exact (Euler-free) simulation: uses analytical conditional distribution
std::vector<double> vasicekExactPath(const VasicekParams& p, double r0,
                                      double T, int n_steps,
                                      std::mt19937_64& rng) {
    std::normal_distribution<double> Z;
    double dt   = T / n_steps;
    double e_adt = std::exp(-p.a * dt);

    // Conditional mean and variance
    double cond_mean_coef = 1.0 - e_adt;          // coeff on (b - r) term
    double cond_var       = p.sigma * p.sigma * (1.0 - e_adt * e_adt) / (2.0 * p.a);
    double cond_std       = std::sqrt(cond_var);

    std::vector<double> path(n_steps + 1);
    path[0] = r0;
    for (int i = 0; i < n_steps; ++i) {
        // r_{i+1} = r_i * exp(-a*dt) + b*(1-exp(-a*dt)) + std * Z
        path[i+1] = path[i] * e_adt
                  + p.b * cond_mean_coef
                  + cond_std * Z(rng);
    }
    return path;
}

// Analytical zero-coupon bond price: P(0,T) = A(T)*exp(-B(T)*r0)
double vasicekZCB(const VasicekParams& p, double r0, double T) noexcept {
    double B = (1.0 - std::exp(-p.a * T)) / p.a;

    // ln A(T)
    double ln_A = (B - T) * (p.a * p.b - 0.5 * p.sigma * p.sigma / (p.a * p.a))
                - 0.25 * p.sigma * p.sigma * B * B / p.a;

    return std::exp(ln_A - B * r0);
}

// Vasicek yield: y(0,T) = -ln P(0,T) / T
double vasicekYield(const VasicekParams& p, double r0, double T) noexcept {
    return -std::log(vasicekZCB(p, r0, T)) / T;
}

// Term structure: yield curve from 1M to 30Y
std::vector<std::pair<double,double>> vasicekCurve(const VasicekParams& p,
                                                      double r0) {
    std::vector<double> tenors = {1.0/12, 0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30};
    std::vector<std::pair<double,double>> curve;
    for (double T : tenors)
        curve.emplace_back(T, vasicekYield(p, r0, T));
    return curve;
}`,
    explanation: "Vasicek's exact conditional simulation avoids Euler discretisation error — since the SDE is linear (Ornstein-Uhlenbeck process), its solution is an Ornstein-Uhlenbeck process with analytically known Gaussian conditional distributions, so each step is exact regardless of dt size; the model's weakness is allowing negative rates (a problem pre-2014, but less so in a negative-rate environment) and the constant sigma assumption (real rates show a vol smile).",
  },
  {
    id: "cpp-20260625-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson finite-difference PDE solver for European options",
    tag: "derivatives",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Thomas algorithm: O(N) tridiagonal solver
// a=sub-diag, b=diag (modified in-place), c=super-diag, d=RHS (solution on exit)
static void thomas(const std::vector<double>& a, std::vector<double> b,
                    const std::vector<double>& c, std::vector<double>& d) {
    int n = static_cast<int>(b.size());
    for (int i = 1; i < n; ++i) {
        double w = a[i] / b[i-1];
        b[i]    -= w * c[i-1];
        d[i]    -= w * d[i-1];
    }
    d[n-1] /= b[n-1];
    for (int i = n-2; i >= 0; --i)
        d[i] = (d[i] - c[i] * d[i+1]) / b[i];
}

// Crank-Nicolson BSM: theta=0.5 averaging of explicit and implicit operators.
// For interior grid point i, S_i = i*dS:
//   alpha_i = 0.5*sigma^2*i^2,  beta_i = 0.5*r*i
//   LHS sub-diag:  -(alpha_i - beta_i)*dt/2
//   LHS diag:       1 + (2*alpha_i + r)*dt/2
//   LHS super-diag: -(alpha_i + beta_i)*dt/2
//   RHS: negated LHS coefficients applied to V^n
double crankNicolson(double S0, double K, double r, double sigma,
                      double T, bool call = true,
                      int M = 200, int N = 200) {
    double S_max = 4.0 * K;
    double dS    = S_max / M;
    double dt    = T / N;
    int n_int    = M - 1;

    // Terminal payoff
    std::vector<double> V(M + 1);
    for (int i = 0; i <= M; ++i) {
        double S = i * dS;
        V[i] = call ? std::max(S - K, 0.0) : std::max(K - S, 0.0);
    }

    std::vector<double> a(n_int), b(n_int), c(n_int);
    for (int k = 0; k < n_int; ++k) {
        int i       = k + 1;
        double A    = 0.5 * sigma * sigma * i * i;   // alpha_i
        double B    = 0.5 * r * i;                    // beta_i
        a[k] = -(A - B) * dt * 0.5;
        b[k] =  1.0 + (2.0*A + r) * dt * 0.5;
        c[k] = -(A + B) * dt * 0.5;
    }

    // Time-stepping: march from T back to 0
    for (int j = N - 1; j >= 0; --j) {
        double tau   = j * dt;  // remaining time to maturity (0 at j=0)
        double V_lo  = call ? 0.0 : K * std::exp(-r * tau);
        double V_hi  = call ? std::max(S_max - K * std::exp(-r * tau), 0.0) : 0.0;

        std::vector<double> d(n_int);
        for (int k = 0; k < n_int; ++k) {
            int i    = k + 1;
            double A = 0.5 * sigma * sigma * i * i;
            double B = 0.5 * r * i;
            double Vm = (i == 1)   ? V_lo : V[i-1];
            double Vc = V[i];
            double Vp = (i == M-1) ? V_hi : V[i+1];

            // Explicit half: (I + 0.5*dt*L)V^n
            d[k] = (A-B)*dt*0.5 * Vm + (1.0-(2.0*A+r)*dt*0.5) * Vc + (A+B)*dt*0.5 * Vp;
            // Boundary adjustments for LHS implicit terms
            if (k == 0)       d[k] -= a[k] * V_lo;
            if (k == n_int-1) d[k] -= c[k] * V_hi;
        }
        thomas(a, b, c, d);
        V[0] = V_lo; V[M] = V_hi;
        for (int k = 0; k < n_int; ++k) V[k+1] = d[k];
    }

    // Interpolate V(S0)
    double pos = S0 / dS;
    int    i0  = std::min(static_cast<int>(pos), M-1);
    double f   = pos - i0;
    return V[i0] * (1.0 - f) + V[i0+1] * f;
}`,
    explanation: "Crank-Nicolson is unconditionally stable (unlike the fully-explicit scheme which requires dt < dS^2/(sigma^2*S^2)) and second-order accurate in both time and space — the theta=0.5 averaging halves the truncation error compared to the fully-implicit scheme, producing O(dt^2) convergence; the Thomas algorithm solves the tridiagonal system in O(M) operations, so each time step costs O(M) rather than O(M^3) for a full matrix solve.",
  },
  {
    id: "cpp-20260625-b1-cds-pricer",
    language: "cpp",
    title: "CDS pricing via constant hazard rate model",
    tag: "credit",
    code: `#include <cmath>
#include <vector>
#include <numeric>

// Credit Default Swap (CDS) pricing under constant hazard rate lambda.
// Default leg: (1-R) * integral_0^T df(t) * lambda * exp(-lambda*t) dt
// Premium leg: s * integral_0^T df(t) * exp(-lambda*t) dt   (survival-weighted annuity)
// Par CDS spread: s = (1-R) * default_leg_pv / annuity
// where df(t) = exp(-r*t) is the risk-free discount factor.

struct CDSResult {
    double par_spread;      // annualised par spread (e.g. 0.02 = 200bps)
    double mtm_npv;         // mark-to-market for a receiver paying coupon s0
    double annuity;         // risky annuity (PV01)
    double default_leg_pv;  // PV of protection leg
    double spread_dv01;     // DV01 in spread (NPV change per 1bp)
    double hazard_rate;     // implied flat hazard rate
};

// Solve for lambda given a market spread using Newton-Raphson
static double spreadToLambda(double spread, double r, double recovery,
                               double T, int n_points = 100) {
    // For constant r and lambda, par_spread = (1-R)*lambda / (r + lambda)
    // -> lambda = spread * (r + lambda) / (1-R) -> solve: lambda*(1-R-spread) = spread*r
    // ...but this closed-form only holds for flat discounting AND flat hazard.
    // General: iterate Newton.
    auto parSpread = [&](double lam) {
        double dt = T / n_points;
        double annuity = 0.0, def_leg = 0.0;
        for (int i = 1; i <= n_points; ++i) {
            double t  = i * dt;
            double df = std::exp(-r * t);
            double sq = std::exp(-lam * t);
            annuity += df * sq * dt;
            def_leg += df * lam * sq * dt;
        }
        return (1.0 - recovery) * def_leg / annuity;
    };
    double lam = spread / (1.0 - recovery);  // initial guess
    for (int iter = 0; iter < 30; ++iter) {
        double h  = lam * 1e-5;
        double f  = parSpread(lam) - spread;
        double df = (parSpread(lam + h) - parSpread(lam - h)) / (2 * h);
        if (std::abs(df) < 1e-15) break;
        double step = f / df;
        lam -= step;
        if (std::abs(step) < 1e-12) break;
    }
    return std::max(lam, 1e-9);
}

CDSResult priceCDS(double notional, double coupon_spread,
                    double market_spread, double r,
                    double recovery, double T,
                    int n_points = 100) {
    double lam = spreadToLambda(market_spread, r, recovery, T, n_points);
    double dt  = T / n_points;

    double annuity = 0.0, def_leg = 0.0;
    for (int i = 1; i <= n_points; ++i) {
        double t  = i * dt;
        double df = std::exp(-r * t);
        double sq = std::exp(-lam * t);
        annuity += df * sq * dt;
        def_leg += df * lam * sq * dt;
    }

    double par_s  = (1.0 - recovery) * def_leg / annuity;
    double npv    = notional * ((1.0-recovery)*def_leg - coupon_spread * annuity);
    double dv01   = notional * annuity * 0.0001;  // per 1bp

    return {par_s, npv, annuity, (1.0-recovery)*def_leg, dv01, lam};
}`,
    explanation: "The hazard rate lambda represents the instantaneous conditional default rate — the probability of defaulting in the next dt given survival to t is lambda*dt; for a flat hazard rate, the survival probability is exp(-lambda*t) which is a memoryless exponential distribution, and the par spread approximates lambda*(1-R) for small r (the interest rate contribution is a second-order correction); CDS DV01 (spread sensitivity) equals notional times the risky annuity, which is the standard risk unit for credit books.",
  },
  {
    id: "cpp-20260625-b1-nelson-siegel",
    language: "cpp",
    title: "Nelson-Siegel term structure fitting via nonlinear least squares",
    tag: "fixed-income",
    code: `#include <cmath>
#include <vector>
#include <array>
#include <numeric>
#include <algorithm>

// Nelson-Siegel (1987) yield curve model:
// y(tau) = beta0 + beta1*(1-exp(-tau/lam))/(tau/lam)
//         + beta2*((1-exp(-tau/lam))/(tau/lam) - exp(-tau/lam))
//
// beta0: long-run level    (asymptote as tau -> inf)
// beta1: slope             (negative = upward sloping curve)
// beta2: curvature/hump    (positive = hump around lam)
// lam:   decay parameter   (location of hump, typically 1.5-3 years)

struct NSParams { double beta0, beta1, beta2, lam; };

double nsYield(const NSParams& p, double tau) noexcept {
    if (tau < 1e-9) return p.beta0 + p.beta1;  // instantaneous short rate
    double x  = tau / p.lam;
    double ex = std::exp(-x);
    double f1 = (1.0 - ex) / x;                // loading on beta1
    double f2 = f1 - ex;                        // loading on beta2
    return p.beta0 + p.beta1 * f1 + p.beta2 * f2;
}

// Gauss-Newton least-squares fit for beta0,beta1,beta2 given lambda
// (lambda is kept fixed for linearity; outer grid search over lambda)
static double fitBetas(const std::vector<double>& tenors,
                        const std::vector<double>& yields,
                        double lam,
                        NSParams& p_out) {
    int n = static_cast<int>(tenors.size());
    // Build design matrix X (n x 3)
    double X0X0=0,X0X1=0,X0X2=0,X1X1=0,X1X2=0,X2X2=0;
    double X0y=0,X1y=0,X2y=0;
    for (int i = 0; i < n; ++i) {
        double tau = tenors[i], y = yields[i];
        double x   = tau / lam;
        double ex  = std::exp(-x);
        double f0 = 1.0, f1 = (1.0-ex)/x, f2 = f1 - ex;
        X0X0+=f0*f0; X0X1+=f0*f1; X0X2+=f0*f2;
        X1X1+=f1*f1; X1X2+=f1*f2; X2X2+=f2*f2;
        X0y +=f0*y; X1y +=f1*y; X2y +=f2*y;
    }
    // 3x3 linear system via Cramer's rule (small matrix)
    // ... simplified: use normal equations A*beta = b
    // For brevity: solve 3x3 via direct formula (omitting full code)
    // Production: use Eigen or LAPACK dposv
    double det = X0X0*(X1X1*X2X2 - X1X2*X1X2)
               - X0X1*(X0X1*X2X2 - X1X2*X0X2)
               + X0X2*(X0X1*X1X2 - X1X1*X0X2);
    if (std::abs(det) < 1e-15) return 1e9;
    p_out.lam   = lam;
    p_out.beta0 = (X0y*(X1X1*X2X2-X1X2*X1X2) - X0X1*(X1y*X2X2-X1X2*X2y) + X0X2*(X1y*X1X2-X1X1*X2y)) / det;
    p_out.beta1 = (X0X0*(X1y*X2X2-X1X2*X2y) - X0y*(X0X1*X2X2-X1X2*X0X2) + X0X2*(X0X1*X2y-X1y*X0X2))  / det;
    p_out.beta2 = (X0X0*(X1X1*X2y-X1y*X1X2) - X0X1*(X0X1*X2y-X1y*X0X2)  + X0y*(X0X1*X1X2-X1X1*X0X2)) / det;
    // Compute RMSE
    double sse = 0.0;
    for (int i = 0; i < n; ++i) {
        double e = yields[i] - nsYield(p_out, tenors[i]);
        sse += e * e;
    }
    return std::sqrt(sse / n);
}

NSParams fitNelsonSiegel(const std::vector<double>& tenors,
                           const std::vector<double>& yields) {
    NSParams best{0,0,0,2.0};
    double best_rmse = 1e9;
    for (double lam : {0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0}) {
        NSParams p{};
        double rmse = fitBetas(tenors, yields, lam, p);
        if (rmse < best_rmse) { best_rmse = rmse; best = p; }
    }
    return best;
}`,
    explanation: "Nelson-Siegel separates the yield curve into three orthogonal factors — level (beta0, constant loading), slope (beta1, loading that decays to zero), and curvature (beta2, hump-shaped loading peaking at tenor lambda) — making it parsimonious with only four parameters yet able to fit typical yield curves well; for a fixed lambda the model is linear in beta0-2 (OLS fit), so the common strategy is a grid search over lambda values and linear regression for the remaining parameters at each lambda.",
  },
  {
    id: "cpp-20260625-b1-fd-greeks",
    language: "cpp",
    title: "Finite-difference Greeks via central differencing for any pricer",
    tag: "derivatives",
    code: `#include <cmath>
#include <functional>

// Generic Greek computation via central finite differences.
// Works with any pricer F(S, K, r, sigma, T) -> price.
// More robust than analytical Greeks for complex/exotic payoffs.

using Pricer = std::function<double(double S, double K, double r, double sigma, double T)>;

struct Greeks {
    double delta;   // dV/dS
    double gamma;   // d^2V/dS^2
    double vega;    // dV/d(sigma), per 1% vol move
    double theta;   // dV/dT (per calendar day, negative for long options)
    double rho;     // dV/dr, per 1% rate move
};

Greeks computeGreeks(const Pricer& pricer,
                      double S, double K, double r, double sigma, double T,
                      double h_S    = 0.0,   // 0 = auto
                      double h_vol  = 0.0,
                      double h_T    = 0.0,
                      double h_r    = 0.0) noexcept {
    // Auto-select bump sizes: ~sqrt(epsilon) * scale
    if (h_S   == 0.0) h_S   = S     * 1e-4;
    if (h_vol == 0.0) h_vol = sigma  * 1e-4;
    if (h_T   == 0.0) h_T   = T     * 1e-4;
    if (h_r   == 0.0) h_r   = 0.0001;  // 1bp

    double V0 = pricer(S, K, r, sigma, T);

    // Delta: central diff in S
    double V_up  = pricer(S + h_S, K, r, sigma, T);
    double V_dn  = pricer(S - h_S, K, r, sigma, T);
    double delta = (V_up - V_dn) / (2.0 * h_S);

    // Gamma: second difference in S
    double gamma = (V_up - 2.0 * V0 + V_dn) / (h_S * h_S);

    // Vega: bump vol by h_vol; report per 1% = 0.01 vol units
    double V_vup = pricer(S, K, r, sigma + h_vol, T);
    double V_vdn = pricer(S, K, r, sigma - h_vol, T);
    double vega  = (V_vup - V_vdn) / (2.0 * h_vol) * 0.01;

    // Theta: reduce T; report per calendar day (1/365)
    double T_dn = std::max(T - h_T, 1e-8);
    double V_tdn = pricer(S, K, r, sigma, T_dn);
    double theta = (V_tdn - V0) / (T - T_dn) / 365.0;

    // Rho: bump r; report per 1% = 0.01 rate units
    double V_rup = pricer(S, K, r + h_r, sigma, T);
    double V_rdn = pricer(S, K, r - h_r, sigma, T);
    double rho   = (V_rup - V_rdn) / (2.0 * h_r) * 0.01;

    return {delta, gamma, vega, theta, rho};
}

// Cross-gamma (dDelta/dSigma): for vol-of-vol sensitivity
double crossGamma(const Pricer& pricer,
                   double S, double K, double r, double sigma, double T) {
    double h_S = S * 1e-3, h_v = sigma * 1e-3;
    double V_pp = pricer(S+h_S, K, r, sigma+h_v, T);
    double V_pm = pricer(S+h_S, K, r, sigma-h_v, T);
    double V_mp = pricer(S-h_S, K, r, sigma+h_v, T);
    double V_mm = pricer(S-h_S, K, r, sigma-h_v, T);
    return (V_pp - V_pm - V_mp + V_mm) / (4.0 * h_S * h_v);
}`,
    explanation: "Central finite-difference Greeks are more accurate than forward differences (O(h) error vs O(h^2)) for the same number of pricer evaluations; the key insight is that the bump size h is a compromise between truncation error (too large h) and cancellation error from floating-point subtraction (too small h) — the optimal bump is ~sqrt(machine_epsilon * scale), giving about 8 correct digits for double precision; cross-Greeks like vanna (delta-vega cross) require four pricer evaluations arranged in a 2x2 central difference grid.",
  },
  {
    id: "cpp-20260625-b1-atomic-position",
    language: "cpp",
    title: "Lock-free atomic position tracker for multi-instrument risk aggregation",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <cstdint>
#include <cstddef>

// Per-instrument positions updated atomically from multiple trading threads.
// We use a separate atomic<int64_t> per instrument to avoid false sharing
// and to allow concurrent updates without locks.

static constexpr std::size_t MAX_INSTRUMENTS = 1024;
static constexpr std::size_t CACHE_LINE = 64;

// Pad each position to its own cache line to prevent false sharing
struct alignas(CACHE_LINE) InstrumentPosition {
    std::atomic<std::int64_t> net_qty{0};      // positive = long
    std::atomic<std::int64_t> gross_long{0};
    std::atomic<std::int64_t> gross_short{0};
    // Padding to fill remaining cache line bytes
    std::byte _pad[CACHE_LINE - 3 * sizeof(std::atomic<std::int64_t>)];
};

static_assert(sizeof(InstrumentPosition) == CACHE_LINE, "alignment mismatch");

class AtomicPositionBook {
    InstrumentPosition positions_[MAX_INSTRUMENTS];

public:
    // Thread-safe position update: called on each fill from trading threads
    void onFill(std::size_t instr_id, std::int64_t qty_filled,
                 char side) noexcept {
        if (instr_id >= MAX_INSTRUMENTS) return;
        auto& pos = positions_[instr_id];

        if (side == 'B') {
            pos.net_qty.fetch_add(qty_filled, std::memory_order_relaxed);
            pos.gross_long.fetch_add(qty_filled, std::memory_order_relaxed);
        } else {
            pos.net_qty.fetch_sub(qty_filled, std::memory_order_relaxed);
            pos.gross_short.fetch_add(qty_filled, std::memory_order_relaxed);
        }
    }

    // Risk thread reads net positions: acquire to see all trader stores
    std::int64_t netQty(std::size_t instr_id) const noexcept {
        if (instr_id >= MAX_INSTRUMENTS) return 0;
        return positions_[instr_id].net_qty.load(std::memory_order_acquire);
    }

    // Total gross exposure (for margin calculation)
    std::int64_t totalGross(std::size_t instr_id) const noexcept {
        if (instr_id >= MAX_INSTRUMENTS) return 0;
        const auto& pos = positions_[instr_id];
        return pos.gross_long.load(std::memory_order_acquire)
             + pos.gross_short.load(std::memory_order_acquire);
    }

    void reset(std::size_t instr_id) noexcept {
        if (instr_id >= MAX_INSTRUMENTS) return;
        auto& pos = positions_[instr_id];
        pos.net_qty.store(0, std::memory_order_release);
        pos.gross_long.store(0, std::memory_order_release);
        pos.gross_short.store(0, std::memory_order_release);
    }
};`,
    explanation: "Cache-line padding prevents false sharing — without padding, two instruments in adjacent struct fields would share a cache line, so a fill on instrument 0 invalidates instrument 1's cache line on another CPU core even though they are logically independent; on a 2-socket server, a false-sharing invalidation causes ~100ns round-trip latency from the coherence protocol, which destroys the throughput of concurrent position updates across instruments.",
  },
  {
    id: "cpp-20260625-b1-cpu-affinity",
    language: "cpp",
    title: "CPU affinity and real-time scheduler for HFT threads",
    tag: "low-latency",
    code: `#include <pthread.h>
#include <sched.h>
#include <stdexcept>
#include <string>
#include <cstring>

// Pin the calling thread to a specific CPU core and optionally promote it
// to SCHED_FIFO (real-time) to prevent OS preemption on the critical path.
void pinThreadToCore(int core_id, bool realtime = false) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_id, &cpuset);

    // Set CPU affinity: thread will only be scheduled on core_id
    int rc = pthread_setaffinity_np(pthread_self(), sizeof(cpuset), &cpuset);
    if (rc != 0) {
        throw std::runtime_error(
            std::string("pthread_setaffinity_np: ") + strerror(rc));
    }

    if (realtime) {
        // SCHED_FIFO: no timeslice expiry; thread runs until it blocks or yields.
        // Requires CAP_SYS_NICE or running as root.
        struct sched_param sp{};
        sp.sched_priority = sched_get_priority_max(SCHED_FIFO);
        rc = pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp);
        if (rc != 0) {
            // Non-fatal: warn but continue (may not have privilege)
        }
    }
}

// Pin a specific pthread to a core (use from the spawning thread)
void pinThread(pthread_t tid, int core_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_id, &cpuset);
    int rc = pthread_setaffinity_np(tid, sizeof(cpuset), &cpuset);
    if (rc != 0) throw std::runtime_error("setaffinity failed");
}

// NUMA-aware core selection: on a 2-socket system with 16 cores per socket,
// cores 0-15 are on socket 0 (near NIC PCIe root complex),
// cores 16-31 are on socket 1.
// Always pin market-data threads to socket 0 if the NIC is on PCIe bus 0.
struct CoreLayout {
    static constexpr int MARKET_DATA_CORE = 1;  // isolated, no siblings
    static constexpr int RISK_ENGINE_CORE  = 2;
    static constexpr int ORDER_ROUTER_CORE = 3;
    static constexpr int LOGGER_CORE       = 14; // non-critical, isolated
};

// Isolate cores from the kernel: edit /etc/default/grub to add
// isolcpus=1,2,3,14 nohz_full=1,2,3,14 rcu_nocbs=1,2,3,14
// This prevents the kernel from scheduling other processes on these cores.`,
    explanation: "CPU affinity eliminates OS scheduling jitter on the critical path — without pinning, the OS can migrate a thread to any core at any timeslice, causing cold cache misses; SCHED_FIFO prevents preemption entirely, but combined with isolcpus in the kernel boot parameters it also stops interrupt handlers, RCU callbacks, and kernel threads from running on pinned cores, reducing jitter from ~100µs to sub-microsecond.",
  },
  {
    id: "cpp-20260625-b1-rdtsc-latency",
    language: "cpp",
    title: "RDTSCP-based latency histogram for order round-trip measurement",
    tag: "low-latency",
    code: `#include <cstdint>
#include <array>
#include <algorithm>
#include <cstring>
#include <x86intrin.h>

// RDTSC: read the CPU timestamp counter — 1-4 cycles on modern x86-64.
// RDTSCP: serialising variant (waits for prior instructions to retire).
// Always use RDTSCP for latency measurement to prevent reordering.

inline std::uint64_t rdtscp() noexcept {
    std::uint32_t aux;           // filled with processor ID (ignored here)
    return __rdtscp(&aux);
}

// Convert TSC ticks to nanoseconds using measured TSC frequency
struct TscCalibration {
    double tsc_ghz = 0.0;  // TSC ticks per nanosecond

    // Calibrate: measure TSC delta vs wall clock over ~10ms
    void calibrate() noexcept;  // implementation calls clock_gettime(CLOCK_MONOTONIC)

    double toNs(std::uint64_t ticks) const noexcept { return ticks / tsc_ghz; }
    std::uint64_t fromNs(double ns) const noexcept {
        return static_cast<std::uint64_t>(ns * tsc_ghz);
    }
};

// Latency histogram: 1024 buckets, each 100ns wide (0-102.4µs)
class LatencyHistogram {
    static constexpr int BUCKETS = 1024;
    static constexpr double BUCKET_NS = 100.0;

    std::array<std::uint64_t, BUCKETS> counts_{};
    std::uint64_t overflow_   = 0;
    std::uint64_t total_      = 0;
    double        sum_ns_     = 0.0;
    double        sum_sq_ns_  = 0.0;
    double        min_ns_     = 1e18;
    double        max_ns_     = 0.0;

    const TscCalibration* cal_;

public:
    explicit LatencyHistogram(const TscCalibration* c) : cal_(c) {}

    // Record a raw TSC delta
    void record(std::uint64_t ticks) noexcept {
        double ns = cal_->toNs(ticks);
        int    b  = static_cast<int>(ns / BUCKET_NS);
        if (b < BUCKETS) ++counts_[b]; else ++overflow_;
        ++total_;
        sum_ns_    += ns;
        sum_sq_ns_ += ns * ns;
        if (ns < min_ns_) min_ns_ = ns;
        if (ns > max_ns_) max_ns_ = ns;
    }

    double percentile(double p) const noexcept {
        std::uint64_t target = static_cast<std::uint64_t>(p * total_ / 100.0);
        std::uint64_t cum = 0;
        for (int i = 0; i < BUCKETS; ++i) {
            cum += counts_[i];
            if (cum >= target) return (i + 0.5) * BUCKET_NS;
        }
        return max_ns_;
    }

    double mean()   const noexcept { return total_ > 0 ? sum_ns_ / total_ : 0.0; }
    double stddev() const noexcept {
        if (total_ < 2) return 0.0;
        double var = sum_sq_ns_ / total_ - mean() * mean();
        return var > 0 ? __builtin_sqrt(var) : 0.0;
    }
    double p50()  const noexcept { return percentile(50.0);  }
    double p99()  const noexcept { return percentile(99.0);  }
    double p999() const noexcept { return percentile(99.9);  }
};`,
    explanation: "RDTSCP is preferred over RDTSC for timing because it includes a serialisation fence that prevents the CPU from reordering it with the measured code — without RDTSCP, out-of-order execution can start reading the TSC before the previous instructions have actually completed, understating latency; the histogram approach is preferred over storing raw samples because it has O(1) insert and O(1) per-bucket query, and for latency percentiles (p99, p999) bucket approximation is accurate enough for operational monitoring.",
  },
  {
    id: "cpp-20260625-b1-dispatch-table",
    language: "cpp",
    title: "Compile-time message dispatch table for low-latency protocol handler",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstddef>
#include <array>
#include <functional>

// Instead of a switch/if-else chain over message type bytes,
// use a 256-entry function-pointer table for O(1) dispatch.
// All branches are predicted by hardware (indirect branch predictor)
// after a few dozen messages of each type.

struct ParseCtx {
    const std::uint8_t* buf;
    std::size_t         len;
    void*               user_data;
};

using Handler = void(*)(const ParseCtx&) noexcept;

// Null handler for unknown message types
static void handleUnknown(const ParseCtx& ctx) noexcept {
    (void)ctx;  // log / drop
}

// Example message handlers
static void handleAddOrder(const ParseCtx& ctx) noexcept {
    if (ctx.len < 20) return;
    // Parse add-order fields from ctx.buf ...
}

static void handleCancelOrder(const ParseCtx& ctx) noexcept {
    if (ctx.len < 12) return;
    // Parse cancel fields ...
}

static void handleTrade(const ParseCtx& ctx) noexcept {
    if (ctx.len < 24) return;
    // Parse trade fields ...
}

// Build the 256-entry table at startup (not constexpr due to non-constexpr function ptrs)
class MessageDispatcher {
    std::array<Handler, 256> table_;

public:
    MessageDispatcher() noexcept {
        table_.fill(handleUnknown);
        // ITCH-like message codes
        table_['A'] = handleAddOrder;
        table_['D'] = handleCancelOrder;
        table_['P'] = handleTrade;
        table_['E'] = handleAddOrder;   // re-use for executed (simplified)
        table_['X'] = handleCancelOrder;
    }

    // Dispatch: single indirect branch — typically predicted after ~50 messages
    void dispatch(std::uint8_t type, const std::uint8_t* buf, std::size_t len,
                  void* user_data = nullptr) const noexcept {
        ParseCtx ctx{buf, len, user_data};
        table_[type](ctx);
    }
};

// Alternative: use std::array<std::function<...>, 256> if you need closures,
// but std::function adds ~15ns overhead per call vs raw function pointer.
// For HFT: always prefer raw function pointers in dispatch tables.

static MessageDispatcher g_dispatcher;

void processMessage(std::uint8_t type, const std::uint8_t* buf, std::size_t len) noexcept {
    g_dispatcher.dispatch(type, buf, len);
}`,
    explanation: "A 256-entry function-pointer table indexed by the raw message type byte replaces a switch/if-else chain — both compile to an indirect branch, but the table approach is O(1) regardless of the number of message types and requires no modification when adding new types; the indirect branch predictor learns the common message type distribution after a brief warm-up and begins predicting the target address correctly, eliminating the branch misprediction penalty for the dominant message type (typically AddOrder in most feeds).",
  },
  {
    id: "cpp-20260625-b1-spsc-ring",
    language: "cpp",
    title: "Single-producer single-consumer lock-free ring buffer",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// SPSC ring buffer: zero CAS operations.
// Producer owns head_ (advance after write); consumer owns tail_ (advance after read).
// Producer reads tail_ with acquire; consumer reads head_ with acquire.
// This is strictly weaker than MPSC — safe only with exactly one producer and one consumer.

template <typename T, std::size_t CAP>
class SPSCRing {
    static_assert((CAP & (CAP - 1)) == 0, "CAP must be power of 2");
    static_assert(CAP >= 2);

    static constexpr std::size_t MASK = CAP - 1;

    // Separate cache lines to avoid false sharing between producer and consumer
    alignas(64) std::atomic<std::size_t> head_{0};  // producer advances
    alignas(64) std::atomic<std::size_t> tail_{0};  // consumer advances
    alignas(64) std::array<T, CAP> buf_{};

public:
    // Called by producer thread only
    bool push(const T& val) noexcept {
        std::size_t h = head_.load(std::memory_order_relaxed);   // own counter
        std::size_t next_h = (h + 1) & MASK;

        // Check full: tail is on the 'other side' — need acquire to see consumer's advance
        if (next_h == tail_.load(std::memory_order_acquire))
            return false;  // full

        buf_[h] = val;
        head_.store(next_h, std::memory_order_release);  // publish to consumer
        return true;
    }

    bool push(T&& val) noexcept {
        std::size_t h = head_.load(std::memory_order_relaxed);
        std::size_t next_h = (h + 1) & MASK;
        if (next_h == tail_.load(std::memory_order_acquire)) return false;
        buf_[h] = std::move(val);
        head_.store(next_h, std::memory_order_release);
        return true;
    }

    // Called by consumer thread only
    std::optional<T> pop() noexcept {
        std::size_t t = tail_.load(std::memory_order_relaxed);  // own counter
        // Check empty
        if (t == head_.load(std::memory_order_acquire)) return std::nullopt;
        T val = buf_[t];
        tail_.store((t + 1) & MASK, std::memory_order_release);  // free slot
        return val;
    }

    bool empty() const noexcept {
        return tail_.load(std::memory_order_acquire) ==
               head_.load(std::memory_order_acquire);
    }

    // Approximate size (may be stale by 1 if called from neither producer nor consumer)
    std::size_t size() const noexcept {
        std::size_t h = head_.load(std::memory_order_acquire);
        std::size_t t = tail_.load(std::memory_order_acquire);
        return (h - t + CAP) & MASK;
    }

    static constexpr std::size_t capacity() noexcept { return CAP - 1; }
};`,
    explanation: "The SPSC ring buffer requires no CAS operations — the producer and consumer each 'own' their respective pointer (head and tail), so they can use relaxed loads on their own counters and only need acquire/release when reading the other thread's counter to detect empty/full; this makes SPSC the fastest possible inter-thread data structure: on x86-64 where relaxed-load and release-store are free (MOV instructions), the only overhead is the acquire-load to check the partner's pointer, which costs a memory barrier worth 0-3ns.",
  },
  {
    id: "cpp-20260625-b1-sabr-vol",
    language: "cpp",
    title: "SABR model implied volatility via Hagan 2002 approximation",
    tag: "derivatives",
    code: `#include <cmath>
#include <algorithm>

// SABR model (Hagan et al. 2002):
// dF = alpha * F^beta * dW_1
// d(alpha) = nu * alpha * dW_2
// <dW_1, dW_2> = rho * dt
//
// Hagan approximation for implied Black (lognormal) vol sigma_B(K, F, T):
// Valid for |log(F/K)| not too large (< ~100% OTM).

struct SABRParams {
    double alpha;  // initial vol
    double beta;   // elasticity (0=normal, 1=lognormal)
    double rho;    // correlation
    double nu;     // vol of vol
};

double sabrVol(double F, double K, double T, const SABRParams& p) noexcept {
    if (F <= 0.0 || K <= 0.0 || T <= 0.0) return p.alpha;

    double alpha = p.alpha, beta = p.beta, rho = p.rho, nu = p.nu;
    double one_minus_beta = 1.0 - beta;
    double FK = F * K;

    // Midpoint (geometric mean of F and K)
    double FK_half = std::pow(FK, 0.5 * one_minus_beta);
    double FK_full = std::pow(FK, one_minus_beta);

    double log_FK = std::log(F / K);

    // ATM case: separate formula to avoid division by zero
    if (std::abs(log_FK) < 1e-7) {
        double F_beta = std::pow(F, one_minus_beta);
        double sigma_atm = alpha / F_beta
            * (1.0 + ((one_minus_beta*one_minus_beta/24.0) * alpha*alpha / (F_beta*F_beta)
                    + (rho*beta*nu*alpha) / (4.0 * std::pow(F, one_minus_beta * 0.5 + 0.5))
                    + (2.0 - 3.0*rho*rho) / 24.0 * nu*nu) * T);
        return sigma_atm;
    }

    // z and chi functions
    double z    = nu / alpha * FK_half * log_FK;
    double dsc  = std::sqrt(1.0 - 2.0*rho*z + z*z);
    double chi  = std::log((dsc + z - rho) / (1.0 - rho));

    if (std::abs(chi) < 1e-12) return p.alpha / FK_half;

    // Leading term
    double leading = alpha / (FK_half
        * (1.0 + (one_minus_beta*one_minus_beta/24.0)*log_FK*log_FK
               + (one_minus_beta*one_minus_beta*one_minus_beta*one_minus_beta/1920.0)*std::pow(log_FK,4)));

    double zchi = z / chi;

    // Expansion term (correction for smile shape over time)
    double expansion = 1.0
        + ((one_minus_beta*one_minus_beta/24.0) * alpha*alpha / FK_full
         + (rho*beta*nu*alpha) / (4.0 * FK_half)
         + (2.0 - 3.0*rho*rho) / 24.0 * nu*nu) * T;

    return leading * zchi * expansion;
}

// ATM SABR vol shortcut (F=K)
double sabrVolATM(double F, double T, const SABRParams& p) noexcept {
    return sabrVol(F, F, T, p);
}`,
    explanation: "The SABR model's key advantage is that its Hagan approximation gives a closed-form expression for the implied vol smile — after calibrating four parameters to a strip of market vols, interpolating to any strike is O(1); the beta parameter controls the backbone shape (beta=0 gives a stochastic-normal model with flat absolute backbone, beta=1 gives stochastic-lognormal with flat percentage backbone), and most rate desks fix beta at 0 or 0.5 and calibrate only alpha, rho, and nu to market quotes.",
  },
  {
    id: "cpp-20260625-b1-optional-validate",
    language: "cpp",
    title: "std::optional for order validation with error propagation",
    tag: "modern",
    code: `#include <optional>
#include <string_view>
#include <cstdint>
#include <cmath>
#include <variant>

struct ValidOrder {
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    char          side;
};

// Error type: string_view into a static string (zero allocation)
using OrderError = std::string_view;

// Result type: either a valid order or an error message
using OrderResult = std::variant<ValidOrder, OrderError>;

// Price tick size constraint
static constexpr double TICK = 0.01;
static constexpr double MIN_PRICE = 0.01;
static constexpr double MAX_PRICE = 1e6;
static constexpr int    MAX_QTY   = 1'000'000;

// Returns nullopt if validation passes, or an error message
std::optional<OrderError> validateOrder(std::uint64_t id, double price,
                                         std::int32_t qty, char side) noexcept {
    if (id == 0)           return "order id must be positive";
    if (price < MIN_PRICE) return "price below minimum";
    if (price > MAX_PRICE) return "price above maximum";
    if (std::isnan(price) || std::isinf(price)) return "price is not finite";
    if (qty <= 0)          return "qty must be positive";
    if (qty > MAX_QTY)     return "qty exceeds position limit";
    if (side != 'B' && side != 'S') return "side must be B or S";

    // Tick-size check: price must be a multiple of TICK
    double rounded = std::round(price / TICK) * TICK;
    if (std::abs(price - rounded) > 1e-9) return "price violates tick size";

    return std::nullopt;  // no error
}

// Compose: validate then construct
OrderResult parseAndValidate(std::uint64_t id, double price,
                               std::int32_t qty, char side) noexcept {
    if (auto err = validateOrder(id, price, qty, side))
        return OrderError{*err};
    return ValidOrder{id, price, qty, side};
}

// Caller uses std::visit or get_if — no exception overhead
void processOrder(const OrderResult& result) noexcept {
    if (const auto* ord = std::get_if<ValidOrder>(&result)) {
        (void)ord;  // route to matching engine
    } else {
        const auto& err = std::get<OrderError>(result);
        (void)err;  // log rejection
    }
}`,
    explanation: "std::optional<Error> for validation creates a zero-cost success path — if validation passes, the function returns a disengaged optional with a single branch taken; the variant<ValidOrder, OrderError> return type models 'either a value or an error' without exceptions (which disable compiler optimisations on some codebases and add latency from unwinding tables) and without raw error codes that callers can silently ignore.",
  },
  {
    id: "cpp-20260625-b1-false-sharing",
    language: "cpp",
    title: "Cache-line padding patterns to prevent false sharing in hot structures",
    tag: "low-latency",
    code: `#include <atomic>
#include <cstddef>
#include <cstdint>
#include <thread>

// False sharing: two threads modify logically independent data
// that happens to share a cache line (64 bytes on x86-64).
// Every store by one thread invalidates the other's L1 cache copy.

static constexpr std::size_t CACHE_LINE_SIZE = 64;

// BAD: counter and flag share a cache line — produces cache thrashing
struct BadCounters {
    std::atomic<std::uint64_t> market_data_count{0};  // written by feed thread
    std::atomic<std::uint64_t> order_count{0};         // written by OMS thread
    // Both in the same 64-byte cache line: ~100ns per store due to coherence
};

// GOOD: each counter isolated on its own cache line
struct alignas(CACHE_LINE_SIZE) PaddedCounter {
    std::atomic<std::uint64_t> value{0};
    std::byte _pad[CACHE_LINE_SIZE - sizeof(std::atomic<std::uint64_t>)];
};

struct GoodCounters {
    PaddedCounter market_data_count;  // cache line 0
    PaddedCounter order_count;        // cache line 1 (next 64 bytes)
};

// Alternative: __attribute__((aligned)) or std::hardware_destructive_interference_size (C++17)
struct ModernCounters {
    alignas(std::hardware_destructive_interference_size) std::atomic<std::uint64_t> a{0};
    alignas(std::hardware_destructive_interference_size) std::atomic<std::uint64_t> b{0};
};

// Thread-local cache: each thread has its own copy, periodically flushed
// to a shared counter — eliminates sharing entirely for the hot path.
struct ThreadLocalCounter {
    static thread_local std::uint64_t local_val;
    std::atomic<std::uint64_t> shared_val{0};

    void increment() noexcept { ++local_val; }

    // Flush periodically (e.g. every 1000 ticks)
    void flush() noexcept {
        shared_val.fetch_add(local_val, std::memory_order_relaxed);
        local_val = 0;
    }

    std::uint64_t read() const noexcept {
        return shared_val.load(std::memory_order_acquire);
    }
};

thread_local std::uint64_t ThreadLocalCounter::local_val = 0;`,
    explanation: "False sharing is insidious because the code is logically correct but runs ~10x slower under contention — Intel's perf-stat 'cache-misses' and 'LLC-load-misses' counters can detect it, and tools like Intel VTune show 'Contested Accesses' hotspots; the thread_local flush pattern is the most aggressive solution: the hot path is purely thread-local with no atomic operations, and the shared counter is only updated when a batch of local increments can be amortised over multiple cache line transfers.",
  },
  {
    id: "cpp-20260625-b1-thread-local-cache",
    language: "cpp",
    title: "Thread-local per-core order pool for allocation-free hot path",
    tag: "low-latency",
    code: `#include <array>
#include <cstdint>
#include <cstddef>
#include <new>

// Thread-local storage (TLS): each thread gets its own copy of the object.
// Used for per-core order pools: the critical path allocates from the local pool
// without any inter-core synchronisation.

static constexpr std::size_t POOL_CAPACITY = 4096;

struct Order {
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    char          side;
    std::uint8_t  flags;
};

// Per-core pool: stack-based bump allocator for Order objects
struct OrderPool {
    alignas(Order) std::byte mem[POOL_CAPACITY * sizeof(Order)]{};
    std::size_t used = 0;

    Order* alloc() noexcept {
        if (used >= POOL_CAPACITY) return nullptr;
        return new (mem + used++ * sizeof(Order)) Order{};
    }

    void reset() noexcept {
        // Batch destroy: call destructors only if Order is non-trivial
        if constexpr (!std::is_trivially_destructible_v<Order>) {
            for (std::size_t i = 0; i < used; ++i)
                std::launder(reinterpret_cast<Order*>(mem + i * sizeof(Order)))->~Order();
        }
        used = 0;
    }

    std::size_t size() const noexcept { return used; }
};

// One pool per thread — no contention, no locks
static thread_local OrderPool tls_order_pool;

// Hot-path allocation: purely local, no atomic operations
Order* allocOrder() noexcept {
    return tls_order_pool.alloc();
}

// End of trading session: batch-free all orders for this thread
void resetOrderPool() noexcept {
    tls_order_pool.reset();
}

// Example: trading thread
void tradingThread(int thread_id) {
    // Each thread gets its own pool — no sharing with other threads
    for (int i = 0; i < 10000; ++i) {
        Order* o = allocOrder();
        if (!o) { resetOrderPool(); o = allocOrder(); }
        o->id    = static_cast<std::uint64_t>(thread_id) * 1000000 + i;
        o->price = 100.0 + i * 0.01;
        o->qty   = 100;
        o->side  = 'B';
        // process order...
    }
    resetOrderPool();
}`,
    explanation: "Thread-local storage eliminates the most common synchronisation bottleneck in order allocation — a shared global pool requires either a mutex (blocking) or a CAS loop (spinning under contention); with TLS, each thread's pool is private memory that no other thread can access, so allocation is a single pointer increment with no atomics, and the reset at end-of-session is also fully local; the tradeoff is that threads must periodically synchronise order data through a separate mechanism (e.g. a lock-free queue back to the matching engine).",
  },
  {
    id: "cpp-20260625-b1-sorted-vec-book",
    language: "cpp",
    title: "Sorted-vector price-level map for small order books (cache-friendly)",
    tag: "data-structures",
    code: `#include <vector>
#include <algorithm>
#include <cstdint>
#include <optional>

// For order books with < ~100 active price levels, a sorted vector
// outperforms std::map because:
// 1. Cache coherence: vector is contiguous; map nodes are scattered.
// 2. SIMD-friendly linear scan for the best bid/ask is faster than pointer chasing.
// 3. Binary search insert is O(N) but N is small.

struct PriceLevel {
    double   price;
    std::int64_t qty;      // aggregate quantity (positive)
    std::uint32_t orders;  // number of resting orders
};

class HalfBook {
    std::vector<PriceLevel> levels_;
    bool descending_;  // true for bids (best = highest price), false for asks

    struct Cmp {
        bool desc;
        bool operator()(const PriceLevel& a, const PriceLevel& b) const noexcept {
            return desc ? a.price > b.price : a.price < b.price;
        }
        bool operator()(const PriceLevel& a, double p) const noexcept {
            return desc ? a.price > p : a.price < p;
        }
    };

public:
    explicit HalfBook(bool descending) : descending_(descending) {
        levels_.reserve(64);  // typical max depth
    }

    void addQty(double price, std::int64_t qty) {
        Cmp cmp{descending_};
        auto it = std::lower_bound(levels_.begin(), levels_.end(), price, cmp);
        if (it != levels_.end() && it->price == price) {
            it->qty += qty;
            ++it->orders;
        } else {
            levels_.insert(it, PriceLevel{price, qty, 1});
        }
    }

    void removeQty(double price, std::int64_t qty) {
        Cmp cmp{descending_};
        auto it = std::lower_bound(levels_.begin(), levels_.end(), price, cmp);
        if (it == levels_.end() || it->price != price) return;
        it->qty -= qty;
        if (--it->orders == 0 || it->qty <= 0) levels_.erase(it);
    }

    const PriceLevel* best() const noexcept {
        return levels_.empty() ? nullptr : &levels_.front();
    }

    std::size_t depth() const noexcept { return levels_.size(); }

    // SIMD-friendly: scan top-N levels for aggregate qty above threshold
    std::int64_t qtyAbove(int top_n) const noexcept {
        std::int64_t total = 0;
        int n = std::min(top_n, static_cast<int>(levels_.size()));
        for (int i = 0; i < n; ++i) total += levels_[i].qty;
        return total;
    }
};

struct OrderBook {
    HalfBook bids{true};   // descending: best bid = levels[0]
    HalfBook asks{false};  // ascending:  best ask = levels[0]

    double spread() const noexcept {
        auto* b = bids.best(); auto* a = asks.best();
        return (b && a) ? a->price - b->price : 0.0;
    }

    double mid() const noexcept {
        auto* b = bids.best(); auto* a = asks.best();
        return (b && a) ? (b->price + a->price) * 0.5 : 0.0;
    }
};`,
    explanation: "For depth < ~50 levels, a sorted vector's cache-line locality outperforms std::map's pointer-chasing: a linear scan over 50 price levels touches only 50*24 = 1200 bytes = ~19 cache lines, while a red-black tree dereferences 50 pointers potentially on different cache lines; the binary search for insert is O(N) worst-case but N is small enough that the constant-factor cache advantage dominates, and std::vector::insert's memmove is highly optimised in libc.",
  },
];
