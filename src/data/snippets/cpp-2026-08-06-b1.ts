import type { Snippet } from "./types";

export const cppSnippets20260806B1: Snippet[] = [
  {
    id: "cpp-20260806-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-Size Pool Allocator for Order Objects",
    tag: "allocators",
    code: `#include <cstddef>
#include <cassert>
#include <array>
#include <cstdint>

// Pool allocator: pre-allocates a fixed slab; O(1) alloc/free with no
// fragmentation. Ideal for HFT where object size is known at compile time.
template <typename T, std::size_t N>
class PoolAllocator {
    union Slot {
        alignas(T) std::byte storage[sizeof(T)];
        Slot* next;
    };
    std::array<Slot, N> pool_;
    Slot* free_head_{nullptr};
    std::size_t allocated_{0};

public:
    PoolAllocator() {
        // Thread the free list through the pool
        for (std::size_t i = 0; i < N - 1; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[N - 1].next = nullptr;
        free_head_ = &pool_[0];
    }

    T* allocate() {
        assert(free_head_ && "pool exhausted");
        Slot* s = free_head_;
        free_head_ = s->next;
        ++allocated_;
        return reinterpret_cast<T*>(s->storage);
    }

    void deallocate(T* p) {
        p->~T();
        Slot* s = reinterpret_cast<Slot*>(p);
        s->next = free_head_;
        free_head_ = s;
        --allocated_;
    }

    std::size_t allocated() const { return allocated_; }
};

struct Order {
    uint64_t id;
    double   price;
    int      qty;
    char     side; // 'B' or 'S'
};

int main() {
    PoolAllocator<Order, 1024> pool;
    Order* o = pool.allocate();
    new (o) Order{1, 100.25, 500, 'B'};
    pool.deallocate(o);  // calls ~Order(), returns slot
}`,
    explanation: "A pool allocator avoids heap fragmentation and malloc overhead by maintaining a pre-built free list inside a fixed slab. The union trick — storing either T's bytes or a next pointer in the same memory — means zero overhead per slot; the free list is threaded through the pool itself."
  },
  {
    id: "cpp-20260806-b1-concepts-pricer",
    language: "cpp",
    title: "C++20 Concepts to Constrain Pricing Model Types",
    tag: "concepts",
    code: `#include <concepts>
#include <cmath>
#include <iostream>

// Define what a valid pricing model must provide
template <typename M>
concept PricingModel = requires(const M m, double S, double K, double r, double T) {
    { m.price(S, K, r, T) } -> std::convertible_to<double>;
    { m.delta(S, K, r, T) } -> std::convertible_to<double>;
    { m.vega(S, K, r, T)  } -> std::convertible_to<double>;
};

// A model satisfying the concept
struct BlackScholes {
    double sigma;
    static double ncdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }
    static double npdf(double x) { return std::exp(-0.5*x*x) / std::sqrt(2*M_PI); }

    double d1(double S, double K, double r, double T) const {
        return (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    }
    double price(double S, double K, double r, double T) const {
        double d1v = d1(S,K,r,T), d2v = d1v - sigma*std::sqrt(T);
        return S*ncdf(d1v) - K*std::exp(-r*T)*ncdf(d2v);
    }
    double delta(double S, double K, double r, double T) const {
        return ncdf(d1(S,K,r,T));
    }
    double vega(double S, double K, double r, double T) const {
        return S * npdf(d1(S,K,r,T)) * std::sqrt(T);
    }
};

// Concept-constrained function — model must satisfy PricingModel
template <PricingModel M>
void print_greeks(const M& model, double S, double K, double r, double T) {
    std::cout << "price=" << model.price(S,K,r,T)
              << " delta=" << model.delta(S,K,r,T)
              << " vega="  << model.vega(S,K,r,T) << "\\n";
}

int main() {
    BlackScholes bs{0.20};
    print_greeks(bs, 100, 100, 0.05, 1.0);
}`,
    explanation: "C++20 concepts replace SFINAE boilerplate with readable constraints. PricingModel verifies at compile time that a type provides price/delta/vega with the correct signatures; a violated concept produces a clear error message naming the missing method, not an impenetrable template-substitution failure."
  },
  {
    id: "cpp-20260806-b1-sfinae-greek",
    language: "cpp",
    title: "SFINAE enable_if for Optional Gamma Computation",
    tag: "sfinae",
    code: `#include <type_traits>
#include <cmath>
#include <iostream>

// Detect whether a model exposes gamma() at compile time
template <typename T, typename = void>
struct HasGamma : std::false_type {};

template <typename T>
struct HasGamma<T, std::void_t<decltype(std::declval<T>().gamma(0.0,0.0,0.0,0.0))>>
    : std::true_type {};

// Overload selected when model has gamma()
template <typename M>
std::enable_if_t<HasGamma<M>::value, double>
safe_gamma(const M& m, double S, double K, double r, double T) {
    return m.gamma(S, K, r, T);
}

// Fallback: finite-difference approximation
template <typename M>
std::enable_if_t<!HasGamma<M>::value, double>
safe_gamma(const M& m, double S, double K, double r, double T) {
    double h = S * 1e-3;
    // Central difference on delta (which uses price internally)
    auto price = [&](double s){ return m.price(s, K, r, T); };
    return (price(S+h) - 2*price(S) + price(S-h)) / (h*h);
}

struct ModelWithGamma {
    double sigma = 0.2;
    double price(double S, double K, double r, double T) const { return S*0.1; }
    double gamma(double S, double K, double r, double T) const {
        // Analytical BS gamma placeholder
        double sqt = std::sqrt(T);
        double d1  = (std::log(S/K) + (r+0.5*sigma*sigma)*T)/(sigma*sqt);
        return std::exp(-0.5*d1*d1) / (S*sigma*sqt*std::sqrt(2*M_PI));
    }
};

struct ModelWithoutGamma {
    double price(double S, double K, double r, double T) const {
        return std::max(0.0, S - K) * 0.5; // stub
    }
};

int main() {
    ModelWithGamma    m1;
    ModelWithoutGamma m2;
    std::cout << "Analytical gamma: " << safe_gamma(m1, 100, 100, 0.05, 1.0) << "\\n";
    std::cout << "FD gamma:         " << safe_gamma(m2, 100, 100, 0.05, 1.0) << "\\n";
}`,
    explanation: "std::void_t collapses to void if the expression inside decltype is valid — so HasGamma becomes true_type only when gamma() compiles. SFINAE then routes safe_gamma to the analytical path when available, and silently falls back to finite differences otherwise, with zero run-time branching."
  },
  {
    id: "cpp-20260806-b1-fix-parser",
    language: "cpp",
    title: "FIX Protocol Tag-Value Parser (Zero-Copy)",
    tag: "market-data",
    code: `#include <string_view>
#include <unordered_map>
#include <cstdint>
#include <charconv>
#include <iostream>

// FIX 4.x message: "8=FIX.4.4\x019=...\x01<tag>=<val>\x01..."
// Parse without copying — return views into the original buffer.
struct FixMessage {
    std::unordered_map<int, std::string_view> fields;

    void parse(std::string_view raw) {
        fields.clear();
        std::size_t pos = 0;
        while (pos < raw.size()) {
            // Find '='
            auto eq = raw.find('=', pos);
            if (eq == std::string_view::npos) break;
            // Parse tag number
            int tag = 0;
            std::from_chars(raw.data() + pos, raw.data() + eq, tag);
            // Find SOH (0x01) delimiter
            auto soh = raw.find('\\x01', eq + 1);
            std::string_view val = raw.substr(eq + 1,
                soh == std::string_view::npos ? std::string_view::npos : soh - eq - 1);
            fields[tag] = val;
            pos = (soh == std::string_view::npos) ? raw.size() : soh + 1;
        }
    }

    std::string_view get(int tag, std::string_view def = {}) const {
        auto it = fields.find(tag);
        return it != fields.end() ? it->second : def;
    }

    double get_double(int tag, double def = 0.0) const {
        auto sv = get(tag);
        if (sv.empty()) return def;
        double v;
        std::from_chars(sv.data(), sv.data() + sv.size(), v);
        return v;
    }
};

int main() {
    // Tag 49=SenderCompID, 55=Symbol, 44=Price, 38=OrderQty
    std::string msg = "8=FIX.4.4\\x0149=CLIENT\\x0155=AAPL\\x0144=189.50\\x0138=100\\x01";
    FixMessage fix;
    fix.parse(msg);
    std::cout << "Symbol: "   << fix.get(55)           << "\\n";
    std::cout << "Price:  "   << fix.get_double(44)    << "\\n";
    std::cout << "Qty:    "   << fix.get_double(38)    << "\\n";
}`,
    explanation: "FIX parsing is on the critical path of order entry; copying bytes into std::string for each field adds hundreds of nanoseconds. std::string_view combined with std::from_chars gives zero-allocation, zero-copy parsing: all values are slices of the original wire buffer, and numeric conversion skips locale overhead."
  },
  {
    id: "cpp-20260806-b1-intrusive-orderbook",
    language: "cpp",
    title: "Intrusive Doubly-Linked List Price Level for Order Book",
    tag: "order-book",
    code: `#include <cstdint>
#include <cassert>
#include <iostream>

// Intrusive list: the node is embedded in the object itself.
// No heap allocation per node — eliminates malloc in the hot path.
struct OrderNode {
    uint64_t order_id;
    double   price;
    int      qty;
    OrderNode* prev{nullptr};
    OrderNode* next{nullptr};
};

struct PriceLevel {
    double      price;
    int         total_qty{0};
    OrderNode*  head{nullptr};
    OrderNode*  tail{nullptr};

    void push_back(OrderNode* o) {
        o->prev = tail;
        o->next = nullptr;
        if (tail) tail->next = o; else head = o;
        tail = o;
        total_qty += o->qty;
    }

    void remove(OrderNode* o) {
        if (o->prev) o->prev->next = o->next; else head = o->next;
        if (o->next) o->next->prev = o->prev; else tail = o->prev;
        o->prev = o->next = nullptr;
        total_qty -= o->qty;
    }

    bool empty() const { return head == nullptr; }
};

int main() {
    // Orders live in a pre-allocated pool; PriceLevel holds raw pointers
    OrderNode orders[4] = {
        {1, 99.50, 100},
        {2, 99.50, 200},
        {3, 99.50,  50},
    };
    PriceLevel lvl{99.50};
    lvl.push_back(&orders[0]);
    lvl.push_back(&orders[1]);
    lvl.push_back(&orders[2]);
    std::cout << "Total qty: " << lvl.total_qty << "\\n"; // 350
    lvl.remove(&orders[1]);
    std::cout << "After cancel: " << lvl.total_qty << "\\n"; // 150
}`,
    explanation: "An intrusive list stores prev/next pointers inside the Order object, so list operations require no heap allocation — the node IS the order. Combined with a pool allocator, you can process order add/cancel/modify with deterministic, sub-microsecond latency and zero GC pressure."
  },
  {
    id: "cpp-20260806-b1-hugepages",
    language: "cpp",
    title: "Hugepage Allocation for Order Book Ring Buffer",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <cstring>
#include <stdexcept>
#include <cstdint>
#include <iostream>

// MAP_HUGETLB requests 2 MB huge pages; reduces TLB misses by 512x
// compared to 4 KB pages for large contiguous buffers.
void* alloc_hugepage(std::size_t bytes) {
    // Round up to 2 MB boundary
    constexpr std::size_t HUGE = 2UL << 20;
    bytes = (bytes + HUGE - 1) & ~(HUGE - 1);

    void* p = mmap(nullptr, bytes,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                   -1, 0);
    if (p == MAP_FAILED) {
        // Fallback: ordinary pages (still succeeds in containers)
        p = mmap(nullptr, bytes,
                 PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS,
                 -1, 0);
        if (p == MAP_FAILED)
            throw std::runtime_error("mmap failed");
        std::cerr << "Fallback: huge pages unavailable\\n";
    }
    return p;
}

void free_hugepage(void* p, std::size_t bytes) {
    constexpr std::size_t HUGE = 2UL << 20;
    bytes = (bytes + HUGE - 1) & ~(HUGE - 1);
    munmap(p, bytes);
}

// Ring buffer using hugepage-backed memory
struct RingBuffer {
    uint64_t* data;
    std::size_t mask;

    explicit RingBuffer(std::size_t capacity) {
        // capacity must be power of two
        data = static_cast<uint64_t*>(alloc_hugepage(capacity * sizeof(uint64_t)));
        mask = capacity - 1;
    }

    uint64_t& operator[](std::size_t i) { return data[i & mask]; }
};

int main() {
    RingBuffer rb(1 << 20);  // 8 MB ring; requests one 2 MB+ hugepage
    rb[0] = 42;
    std::cout << "rb[0]=" << rb[0] << "\\n";
}`,
    explanation: "2 MB huge pages reduce TLB misses on large arrays: a single TLB entry covers what would otherwise require 512 normal-page entries. For a 64 MB order-book ring buffer, this can cut TLB-miss stalls by 99% and improve throughput by 10-30% in cache-cold benchmark scenarios."
  },
  {
    id: "cpp-20260806-b1-branch-hints",
    language: "cpp",
    title: "Branch Prediction Hints in the Matching Engine Hot Path",
    tag: "low-latency",
    code: `#include <cstdint>
#include <iostream>

// __builtin_expect tells the compiler which branch is 'likely',
// so it can lay out code to avoid branch misprediction penalties.
#define LIKELY(x)   __builtin_expect(!!(x), 1)
#define UNLIKELY(x) __builtin_expect(!!(x), 0)

struct Order { double price; int qty; char side; };

// In a typical market, most orders are limit orders (not market).
// Annotate the hot path to avoid icache misses on the slow path.
enum class MatchResult { FILLED, PARTIAL, NO_MATCH };

MatchResult try_match(const Order& incoming, double best_opposite, int avail_qty) {
    bool crosses;
    if (incoming.side == 'B') {
        crosses = LIKELY(incoming.price >= best_opposite);
    } else {
        crosses = LIKELY(incoming.price <= best_opposite);
    }

    if (UNLIKELY(!crosses)) return MatchResult::NO_MATCH;

    if (LIKELY(incoming.qty <= avail_qty)) {
        return MatchResult::FILLED;
    }
    return MatchResult::PARTIAL;
}

// Hardware prefetch: tell CPU to load the next order into L1 before we need it
void process_batch(const Order* orders, int n) {
    for (int i = 0; i < n; ++i) {
        if (LIKELY(i + 4 < n))
            __builtin_prefetch(&orders[i + 4], 0, 3); // read, high locality
        auto r = try_match(orders[i], 99.50, 500);
        (void)r;
    }
}

int main() {
    Order batch[8];
    for (auto& o : batch) o = {99.60, 100, 'B'};
    process_batch(batch, 8);
    std::cout << "processed\\n";
}`,
    explanation: "__builtin_expect shapes the compiler's branch layout: the 'likely' path becomes a fall-through (no taken-branch penalty), while the unlikely path becomes a forward jump. __builtin_prefetch with locality=3 keeps frequently-reused cache lines in L1; combining both on the order-dispatch loop typically saves 15-30 ns per order on modern x86."
  },
  {
    id: "cpp-20260806-b1-pmr-monotonic",
    language: "cpp",
    title: "std::pmr::monotonic_buffer_resource for Per-Message Arenas",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <iostream>

// monotonic_buffer_resource: bump-pointer allocator over a stack/heap buffer.
// All allocations are O(1); release entire arena in one shot — perfect for
// short-lived per-message processing where you throw everything away at once.

struct MarketDataMessage {
    int        seq;
    std::pmr::vector<double> bids;
    std::pmr::vector<double> asks;
    std::pmr::string         symbol;

    explicit MarketDataMessage(std::pmr::memory_resource* mr)
        : seq(0), bids(mr), asks(mr), symbol(mr) {}
};

void process_message(const char* raw_symbol, int n_levels) {
    // 4 KB stack buffer — no heap for typical messages
    std::byte buf[4096];
    std::pmr::monotonic_buffer_resource arena(buf, sizeof(buf));

    MarketDataMessage msg(&arena);
    msg.seq    = 42;
    msg.symbol = raw_symbol;
    for (int i = 0; i < n_levels; ++i) {
        msg.bids.push_back(99.50 - i * 0.01);
        msg.asks.push_back(99.51 + i * 0.01);
    }

    std::cout << "symbol=" << msg.symbol
              << " bid[0]=" << msg.bids[0] << "\\n";
    // Destructor of arena reclaims all pmr::vector/string storage atomically
}

int main() {
    process_message("AAPL", 10);
}`,
    explanation: "std::pmr::monotonic_buffer_resource is a bump-pointer allocator: each allocation advances a pointer by the requested size (O(1), branchless). When the message is done, destroying the arena resets the pointer in one step instead of calling free() for each field. This eliminates heap fragmentation and malloc lock contention in multi-threaded gateways."
  },
  {
    id: "cpp-20260806-b1-fold-expressions",
    language: "cpp",
    title: "C++17 Fold Expressions for Variadic Greeks Aggregation",
    tag: "modern-cpp",
    code: `#include <iostream>
#include <tuple>

// Fold expressions collapse a variadic pack with a binary operator.
// Here we aggregate Greeks across an arbitrary portfolio of positions.

struct Greeks { double delta, gamma, vega, theta; };

// Sum all Greeks in a parameter pack — no loop, no recursion
template <typename... Gs>
Greeks aggregate(Gs... gs) {
    return {
        (gs.delta + ... + 0.0),  // left-fold over '+'
        (gs.gamma + ... + 0.0),
        (gs.vega  + ... + 0.0),
        (gs.theta + ... + 0.0),
    };
}

// Check if ALL positions have non-negative delta (all long)
template <typename... Gs>
bool all_long(Gs... gs) {
    return (... && (gs.delta >= 0.0));  // unary right-fold with &&
}

// Print each Greeks struct
template <typename... Gs>
void print_each(Gs... gs) {
    // Comma-fold: expand and evaluate left to right
    ((std::cout << "delta=" << gs.delta << " gamma=" << gs.gamma << "\\n"), ...);
}

int main() {
    Greeks g1{0.45, 0.02, 15.3, -0.08};
    Greeks g2{-0.30, 0.03, 12.1, -0.06};
    Greeks g3{0.60, 0.01,  8.5, -0.04};

    auto total = aggregate(g1, g2, g3);
    std::cout << "Net delta=" << total.delta
              << " vega="     << total.vega << "\\n";
    std::cout << "All long? " << all_long(g1, g2, g3) << "\\n"; // 0 (g2 short)
    print_each(g1, g2, g3);
}`,
    explanation: "C++17 fold expressions replace recursive variadic templates with a single expression: `(xs + ... + 0)` expands to `((x0 + x1) + x2) + ... + 0` in O(n) compile time. The comma-fold `(f(xs), ...)` sequences side-effects, replacing the old 'swallow' trick with the initializer_list expansion."
  },
  {
    id: "cpp-20260806-b1-variant-ordertype",
    language: "cpp",
    title: "std::variant for Type-Safe Order Variants (Limit/Market/Stop)",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string>
#include <iostream>
#include <stdexcept>

struct LimitOrder  { double price; int qty; char side; };
struct MarketOrder { int qty; char side; };
struct StopOrder   { double trigger; double limit; int qty; char side; };

using Order = std::variant<LimitOrder, MarketOrder, StopOrder>;

// std::visit dispatches at compile time — no virtual dispatch, no RTTI
struct MatchVisitor {
    double best_bid, best_ask;

    bool operator()(const LimitOrder& o) const {
        return o.side == 'B' ? o.price >= best_ask : o.price <= best_bid;
    }
    bool operator()(const MarketOrder&) const {
        return true;  // market always matches (liquidity permitting)
    }
    bool operator()(const StopOrder& o) const {
        bool triggered = o.side == 'B' ? best_ask >= o.trigger : best_bid <= o.trigger;
        if (!triggered) return false;
        LimitOrder lmt{o.limit, o.qty, o.side};
        return MatchVisitor{best_bid, best_ask}(lmt);
    }
};

std::string order_type(const Order& o) {
    return std::visit([](const auto& x) -> std::string {
        using T = std::decay_t<decltype(x)>;
        if constexpr (std::is_same_v<T, LimitOrder>)  return "LIMIT";
        if constexpr (std::is_same_v<T, MarketOrder>) return "MARKET";
        return "STOP";
    }, o);
}

int main() {
    Order orders[] = {
        LimitOrder{99.50, 100, 'B'},
        MarketOrder{50, 'S'},
        StopOrder{98.00, 97.90, 200, 'S'},
    };
    MatchVisitor mv{99.45, 99.52};
    for (auto& o : orders)
        std::cout << order_type(o) << " matches=" << std::visit(mv, o) << "\\n";
}`,
    explanation: "std::variant + std::visit replaces a class hierarchy of order types with a closed sum type: the compiler generates a jump table over the type index, giving O(1) dispatch without virtual function pointers. if constexpr inside the lambda allows type-specific logic with full inlining — the optimizer sees concrete types, not base-class pointers."
  },
  {
    id: "cpp-20260806-b1-span-marketdata",
    language: "cpp",
    title: "std::span for Zero-Copy Market Data Views",
    tag: "modern-cpp",
    code: `#include <span>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <numeric>

// Market data wire format: [4B seq][4B count][count * 16B entries]
// Each entry: [8B price as int64 (fixed point /1e4)][4B qty][4B flags]
struct __attribute__((packed)) PriceEntry {
    int64_t  price_fp; // price * 10000 stored as integer
    int32_t  qty;
    uint32_t flags;    // bit0=bid, bit1=ask
};

struct MarketDataPacket {
    uint32_t   seq;
    uint32_t   count;
    // Variable-length entries follow in memory
};

// Parse a raw UDP payload without any copy
void process_packet(const std::byte* buf, std::size_t len) {
    if (len < sizeof(MarketDataPacket)) return;

    const auto* hdr = reinterpret_cast<const MarketDataPacket*>(buf);
    std::size_t expected = sizeof(MarketDataPacket) + hdr->count * sizeof(PriceEntry);
    if (len < expected) return;

    // Non-owning view over the entry array — no copy, no allocation
    const auto* first = reinterpret_cast<const PriceEntry*>(hdr + 1);
    std::span<const PriceEntry> entries(first, hdr->count);

    double total_qty = 0;
    for (const auto& e : entries) {
        double price = e.price_fp / 10000.0;
        total_qty += e.qty;
        std::cout << "price=" << price << " qty=" << e.qty
                  << " bid=" << (e.flags & 1) << "\\n";
    }
    std::cout << "total_qty=" << total_qty << "\\n";
}

int main() {
    alignas(8) std::byte buf[256];
    auto* hdr    = reinterpret_cast<MarketDataPacket*>(buf);
    hdr->seq     = 1001;
    hdr->count   = 2;
    auto* ent    = reinterpret_cast<PriceEntry*>(hdr + 1);
    ent[0] = {995000, 200, 1};  // bid 99.50
    ent[1] = {995100, 150, 2};  // ask 99.51
    process_packet(buf, sizeof(MarketDataPacket) + 2*sizeof(PriceEntry));
}`,
    explanation: "std::span is a non-owning view over contiguous data: it stores a pointer and size without any allocation, and its range-for support makes it a drop-in replacement for raw pointer + length pairs. Fixed-point price storage (integer × 1/10000) avoids floating-point parsing on the wire and keeps exact integer arithmetic in the matching engine."
  },
  {
    id: "cpp-20260806-b1-cache-line-padding",
    language: "cpp",
    title: "Cache-Line Padding to Eliminate False Sharing",
    tag: "low-latency",
    code: `#include <atomic>
#include <thread>
#include <iostream>
#include <chrono>
#include <array>

// False sharing: two threads write to different variables that share a
// 64-byte cache line, forcing cache coherency traffic.
constexpr int CACHE_LINE = 64;

struct BadCounters {
    std::atomic<long> a{0};  // a and b share a cache line
    std::atomic<long> b{0};
};

struct GoodCounters {
    alignas(CACHE_LINE) std::atomic<long> a{0};
    alignas(CACHE_LINE) std::atomic<long> b{0}; // each on its own line
};

template <typename Counters>
long benchmark(Counters& c, int iters) {
    auto t0 = std::chrono::steady_clock::now();
    std::thread t1([&]{ for (int i=0; i<iters; ++i) ++c.a; });
    std::thread t2([&]{ for (int i=0; i<iters; ++i) ++c.b; });
    t1.join(); t2.join();
    auto t1ns = std::chrono::duration_cast<std::chrono::nanoseconds>(
        std::chrono::steady_clock::now() - t0).count();
    return t1ns;
}

int main() {
    BadCounters  bad;
    GoodCounters good;
    constexpr int N = 1'000'000;
    std::cout << "bad  (false sharing): " << benchmark(bad,  N) << " ns\\n";
    std::cout << "good (padded):        " << benchmark(good, N) << " ns\\n";
    // good is typically 3-10x faster on x86 multicore
}`,
    explanation: "Two atomic<long> packed together occupy the same 64-byte cache line; when thread 1 modifies a and thread 2 modifies b, the CPU must bounce the line between cores (MESI protocol), serializing what should be independent writes. alignas(CACHE_LINE) forces each counter to its own line, eliminating this coherency traffic."
  },
  {
    id: "cpp-20260806-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson Finite-Difference PDE Pricer for European Options",
    tag: "numerics",
    code: `#include <vector>
#include <algorithm>
#include <cmath>
#include <iostream>

// Crank-Nicolson: unconditionally stable, second-order in both S and t.
// Solves dV/dt + 0.5*sigma^2*S^2*d2V/dS2 + r*S*dV/dS - r*V = 0 backwards.
std::vector<double> cn_european_call(
    double S0, double K, double r, double sigma, double T,
    int M, int N)   // M = S-grid points, N = time steps
{
    double dS = 2.0 * K / M;          // S grid from 0 to 2K
    double dt = T / N;
    std::vector<double> V(M + 1), Vnew(M + 1);

    // Terminal payoff
    for (int i = 0; i <= M; ++i)
        V[i] = std::max(i * dS - K, 0.0);

    // Tridiagonal coefficients (theta=0.5 for CN)
    std::vector<double> a(M+1), b(M+1), c(M+1);

    auto thomas = [&](std::vector<double>& rhs) {
        // Forward sweep
        for (int i = 1; i < M; ++i) {
            double m = a[i] / b[i-1];
            b[i] -= m * c[i-1];
            rhs[i] -= m * rhs[i-1];
        }
        // Back-substitution
        rhs[M-1] /= b[M-1];
        for (int i = M-2; i >= 1; --i)
            rhs[i] = (rhs[i] - c[i] * rhs[i+1]) / b[i];
    };

    for (int n = N - 1; n >= 0; --n) {
        double t = n * dt;
        // Build CN system
        for (int i = 1; i < M; ++i) {
            double S   = i * dS;
            double sig2 = 0.5 * sigma * sigma * S * S / (dS * dS);
            double mu   = 0.5 * r * S / dS;
            // LHS coefficients (implicit part)
            a[i] =  -0.5 * dt * (sig2 - mu);
            b[i] = 1.0 + dt * (sig2 + 0.5 * r);
            c[i] =  -0.5 * dt * (sig2 + mu);
            // RHS: explicit part applied to V
            Vnew[i] = 0.5*dt*(sig2-mu)*V[i-1]
                    + (1 - dt*(sig2 + 0.5*r))*V[i]
                    + 0.5*dt*(sig2+mu)*V[i+1];
        }
        // Boundary conditions
        Vnew[0] = 0.0;
        Vnew[M] = 2.0*K - K * std::exp(-r * (T - t));
        thomas(Vnew);
        V = Vnew;
    }
    return V;
}

int main() {
    auto V = cn_european_call(100, 100, 0.05, 0.20, 1.0, 200, 200);
    int idx = 100;  // S = 100 = K (ATM)
    std::cout << "CN call price (ATM) ≈ " << V[idx] << "\\n"; // ~10.45
}`,
    explanation: "Crank-Nicolson averages the explicit and implicit finite-difference schemes (theta=0.5), achieving second-order accuracy in time with unconditional stability — unlike the explicit scheme which requires dt < dS²/(sigma²S²). The Thomas algorithm solves the resulting tridiagonal system in O(M) time, making the total cost O(M×N)."
  },
  {
    id: "cpp-20260806-b1-barrier-mc",
    language: "cpp",
    title: "Down-and-Out Barrier Option Monte Carlo",
    tag: "exotics",
    code: `#include <random>
#include <cmath>
#include <iostream>
#include <vector>
#include <numeric>

// Down-and-out call: pays max(S_T - K, 0) ONLY if S never touches barrier B.
// Use antithetic variates for variance reduction (pair each path with its mirror).
double barrier_call_mc(
    double S0, double K, double B, double r, double sigma, double T,
    int n_paths, int n_steps, unsigned seed = 42)
{
    std::mt19937_64         rng(seed);
    std::normal_distribution<double> norm(0, 1);

    double dt    = T / n_steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    double sum = 0.0;
    for (int p = 0; p < n_paths; p += 2) {
        double S1 = S0, S2 = S0;
        bool alive1 = true, alive2 = true;
        for (int s = 0; s < n_steps; ++s) {
            double z  = norm(rng);
            double dW =  z * vol;
            double dW2= -z * vol;  // antithetic
            if (alive1) { S1 *= std::exp(drift + dW);  if (S1 <= B) alive1 = false; }
            if (alive2) { S2 *= std::exp(drift + dW2); if (S2 <= B) alive2 = false; }
        }
        sum += (alive1 ? std::max(S1 - K, 0.0) : 0.0);
        sum += (alive2 ? std::max(S2 - K, 0.0) : 0.0);
    }
    return disc * sum / n_paths;
}

int main() {
    // S0=100, K=100, B=80, r=5%, sigma=20%, T=1yr
    double price = barrier_call_mc(100, 100, 80, 0.05, 0.20, 1.0, 100000, 252);
    std::cout << "Down-and-out call price ≈ " << price << "\\n"; // ~9.0
    // Analytic: ~9.02 (Reiner-Rubinstein 1991)
}`,
    explanation: "Antithetic variates pair each standard-normal draw z with its negation -z; because call payoff is convex, E[f(z)] < (f(z)+f(-z))/2 by Jensen's inequality, so the estimator's variance is lower than independent sampling. For barrier options this halves paths-to-convergence without any additional computation, only requiring you to simulate two paths per draw."
  },
  {
    id: "cpp-20260806-b1-asian-mc",
    language: "cpp",
    title: "Arithmetic Asian Option Pricing via Monte Carlo",
    tag: "exotics",
    code: `#include <random>
#include <cmath>
#include <iostream>
#include <numeric>
#include <vector>

// Arithmetic Asian call: payoff = max(A_T - K, 0)
// where A_T = (1/n) * sum(S_{t_i}) over n averaging dates.
// No closed-form for arithmetic average; MC is standard.
double asian_call_mc(
    double S0, double K, double r, double sigma, double T,
    int n_avg, int n_paths, unsigned seed = 42)
{
    std::mt19937_64            rng(seed);
    std::normal_distribution<double> norm;

    double dt    = T / n_avg;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    double sum = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double S = S0, avg = 0.0;
        for (int i = 0; i < n_avg; ++i) {
            S *= std::exp(drift + vol * norm(rng));
            avg += S;
        }
        avg /= n_avg;
        sum += std::max(avg - K, 0.0);
    }
    return disc * sum / n_paths;
}

// Control variate: geometric Asian has a closed form (Kemna-Vorst 1990)
double geometric_asian_call(double S0, double K, double r, double sigma, double T, int n) {
    double sigma_adj = sigma * std::sqrt((2.0*n + 1.0) / (6.0 * (n + 1.0)));
    double mu_adj    = 0.5 * (r - 0.5*sigma*sigma + sigma_adj*sigma_adj);
    double d1  = (std::log(S0/K) + (mu_adj + 0.5*sigma_adj*sigma_adj)*T)/(sigma_adj*std::sqrt(T));
    double d2  = d1 - sigma_adj * std::sqrt(T);
    auto N = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    return std::exp(-r*T) * (S0 * std::exp(mu_adj*T) * N(d1) - K * N(d2));
}

int main() {
    double arith = asian_call_mc(100, 100, 0.05, 0.20, 1.0, 12, 200000);
    double geom  = geometric_asian_call(100, 100, 0.05, 0.20, 1.0, 12);
    std::cout << "Arithmetic Asian MC:    " << arith << "\\n"; // ~7.2
    std::cout << "Geometric Asian (exact): " << geom << "\\n"; // ~6.8
}`,
    explanation: "The arithmetic average of a geometric Brownian motion is log-normally distributed only approximately, so the arithmetic Asian has no simple closed form. The geometric Asian serves as a control variate: its exact Kemna-Vorst price lets you compute a correction factor (arithmetic MC − geometric MC + geometric exact) that can reduce standard error by 70-90%."
  },
  {
    id: "cpp-20260806-b1-lookback-mc",
    language: "cpp",
    title: "Floating-Strike Lookback Option Monte Carlo",
    tag: "exotics",
    code: `#include <random>
#include <cmath>
#include <algorithm>
#include <iostream>

// Floating-strike lookback call: payoff = S_T - min(S_t over [0,T])
// The buyer always buys at the historical minimum — costliest to hedge.
double lookback_call_mc(
    double S0, double r, double sigma, double T,
    int n_steps, int n_paths, unsigned seed = 42)
{
    std::mt19937_64            rng(seed);
    std::normal_distribution<double> norm;

    double dt    = T / n_steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    double sum = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double S = S0, S_min = S0;
        for (int i = 0; i < n_steps; ++i) {
            S *= std::exp(drift + vol * norm(rng));
            S_min = std::min(S_min, S);
        }
        sum += S - S_min;  // always non-negative
    }
    return disc * sum / n_paths;
}

int main() {
    double price = lookback_call_mc(100, 0.05, 0.20, 1.0, 252, 200000);
    std::cout << "Floating-strike lookback call ≈ " << price << "\\n"; // ~20
    // Conze-Viswanathan analytic for continuous monitoring ≈ 19.95
}`,
    explanation: "A floating-strike lookback's payoff is always positive and path-dependent on the realized minimum, making it one of the most expensive vanilla exotics. The discrete monitoring bias (MC steps < continuous) causes prices to be slightly above the continuous analytic — using n_steps=252 (daily) with a Broadie-Glasserman-Kou correction reduces this bias from O(1/n) to O(1/n²)."
  },
  {
    id: "cpp-20260806-b1-portfolio-risk",
    language: "cpp",
    title: "Portfolio Risk Engine: Greeks Aggregation with Delta/Gamma VaR",
    tag: "risk",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <iostream>
#include <algorithm>

struct Position {
    double delta;   // per-share delta
    double gamma;   // per-share gamma
    double vega;
    int    shares;  // signed: positive=long
};

struct RiskReport {
    double net_delta, net_gamma, net_vega;
    double linear_var_1d;   // delta VaR at 99%
    double quadratic_var_1d; // delta-gamma VaR
};

// Daily sigma of S: used for 1-day VaR scaling
RiskReport compute_risk(const std::vector<Position>& book,
                        double spot_price, double daily_vol,
                        double confidence = 0.99)
{
    double nd = 2.326; // 99th percentile z-score
    if (confidence == 0.95) nd = 1.645;

    double dS = nd * daily_vol * spot_price; // 1-day 99% spot move

    RiskReport r{};
    for (const auto& p : book) {
        double pos_delta = p.delta * p.shares;
        double pos_gamma = p.gamma * p.shares;
        r.net_delta += pos_delta;
        r.net_gamma += pos_gamma;
        r.net_vega  += p.vega * p.shares;
    }

    // Linear (delta-only) P&L approximation
    r.linear_var_1d = std::abs(r.net_delta * dS);

    // Quadratic (delta-gamma) P&L = delta*dS + 0.5*gamma*dS^2
    // Worst-case sign for gamma adjustment
    double pnl_move  = r.net_delta * dS  + 0.5 * r.net_gamma * dS * dS;
    double pnl_short = r.net_delta * (-dS) + 0.5 * r.net_gamma * dS * dS;
    r.quadratic_var_1d = std::abs(std::min(pnl_move, pnl_short));
    return r;
}

int main() {
    std::vector<Position> book = {
        {0.45, 0.02, 12.0,  1000},  // long call position
        {-0.50, 0.0,  0.0,   500},  // short stock hedge
        {0.30, 0.015, 8.0,   200},  // long call on different strike
    };
    auto rpt = compute_risk(book, 100.0, 0.013);  // 1.3% daily vol
    std::cout << "Net delta:      " << rpt.net_delta << "\\n";
    std::cout << "Linear 99% VaR: " << rpt.linear_var_1d << "\\n";
    std::cout << "Quad   99% VaR: " << rpt.quadratic_var_1d << "\\n";
}`,
    explanation: "Delta-gamma VaR approximates portfolio P&L as a second-order Taylor expansion in the spot move dS: linear VaR ignores gamma and underestimates risk for large-gamma books (near-ATM options). The quadratic adjustment adds 0.5*gamma*dS² but must consider both directions: a long-gamma book profits from large moves, so the loss is on small moves; a short-gamma book is the opposite."
  },
  {
    id: "cpp-20260806-b1-bellman-ford-fx",
    language: "cpp",
    title: "FX Arbitrage Detection via Bellman-Ford Negative Cycle",
    tag: "graphs",
    code: `#include <vector>
#include <cmath>
#include <limits>
#include <iostream>
#include <string>

// FX arbitrage: if a cycle of exchanges multiplies 1 unit back to > 1,
// log-transform the rates to detect negative-weight cycles.
// weight(u→v) = -log(rate[u][v])
// Negative cycle ⟺ product of rates > 1 ⟺ arbitrage exists.

struct Edge { int u, v; double w; };

struct ArbitrageDetector {
    int V;
    std::vector<Edge> edges;
    std::vector<std::string> names;

    void add_pair(int from, int to, double rate) {
        edges.push_back({from, to, -std::log(rate)});
    }

    // Returns true if a negative cycle exists
    bool has_arbitrage(std::vector<int>& cycle) const {
        std::vector<double> dist(V, 0.0);
        std::vector<int>    pred(V, -1);
        int last = -1;

        // V-1 relaxations + 1 to detect negative cycle
        for (int i = 0; i < V; ++i) {
            last = -1;
            for (const auto& e : edges) {
                if (dist[e.u] + e.w < dist[e.v]) {
                    dist[e.v] = dist[e.u] + e.w;
                    pred[e.v] = e.u;
                    last = e.v;
                }
            }
        }
        if (last == -1) return false;

        // Recover cycle: walk back V steps to guarantee we're on the cycle
        int x = last;
        for (int i = 0; i < V; ++i) x = pred[x];
        // Trace the cycle
        cycle.clear();
        for (int cur = x; ; cur = pred[cur]) {
            cycle.push_back(cur);
            if (cur == x && cycle.size() > 1) break;
        }
        return true;
    }
};

int main() {
    // USD=0, EUR=1, GBP=2, JPY=3
    ArbitrageDetector det{4, {}, {"USD","EUR","GBP","JPY"}};
    det.add_pair(0, 1, 0.91);   // USD->EUR
    det.add_pair(1, 2, 0.86);   // EUR->GBP
    det.add_pair(2, 3, 181.0);  // GBP->JPY
    det.add_pair(3, 0, 0.0072); // JPY->USD  (tiny arb: 0.91*0.86*181*0.0072≈1.017)

    std::vector<int> cyc;
    if (det.has_arbitrage(cyc)) {
        std::cout << "Arbitrage cycle: ";
        for (int v : cyc) std::cout << det.names[v] << " ";
        std::cout << "\\n";
    }
}`,
    explanation: "Taking -log of exchange rates converts the arbitrage condition (cycle product > 1) to a negative-cycle condition (cycle sum of -log rates < 0), which Bellman-Ford detects in O(V·E) time. This is the canonical interview answer for FX arbitrage; the log trick is critical — without it, you'd need to modify Bellman-Ford to track multiplicative paths."
  },
  {
    id: "cpp-20260806-b1-memory-ordering",
    language: "cpp",
    title: "Memory Ordering in Lock-Free Order Status Updates",
    tag: "lock-free",
    code: `#include <atomic>
#include <thread>
#include <iostream>
#include <cassert>

// Order lifecycle: PENDING → OPEN → FILLED/CANCELLED
// Multiple threads read status; one writer thread updates it.
enum class OrderStatus : int { PENDING=0, OPEN=1, FILLED=2, CANCELLED=3 };

struct alignas(64) OrderSlot {
    std::atomic<OrderStatus> status{OrderStatus::PENDING};
    double fill_price{0.0};
    int    fill_qty{0};
    // Pad to cache line to avoid false sharing with adjacent slots
    char pad[64 - sizeof(std::atomic<OrderStatus>)
                - sizeof(double) - sizeof(int)];
};

// Writer: exchange gateway thread calls this on ack
void on_fill(OrderSlot& slot, double price, int qty) {
    slot.fill_price = price;
    slot.fill_qty   = qty;
    // Release: ensures fill_price/qty writes are visible before status flip
    slot.status.store(OrderStatus::FILLED, std::memory_order_release);
}

// Reader: risk thread polls for order state
OrderStatus check_status(const OrderSlot& slot) {
    // Acquire: guarantees that if we see FILLED, we also see fill_price/qty
    return slot.status.load(std::memory_order_acquire);
}

int main() {
    OrderSlot slot;
    std::thread writer([&]{
        on_fill(slot, 99.50, 500);
    });
    writer.join();
    auto s = check_status(slot);
    if (s == OrderStatus::FILLED)
        std::cout << "Filled @ " << slot.fill_price
                  << " x " << slot.fill_qty << "\\n";
}`,
    explanation: "release/acquire ordering creates a happens-before edge: all stores before a release are visible to any thread that later performs an acquire on the same atomic. Without this, the CPU or compiler could reorder the status store before fill_price/fill_qty, causing a reader to see FILLED but stale zeroes. seq_cst would work too but adds a full memory fence (MFENCE on x86), costing ~40 ns."
  },
  {
    id: "cpp-20260806-b1-structured-bindings",
    language: "cpp",
    title: "C++17 Structured Bindings for Order Book Iteration",
    tag: "modern-cpp",
    code: `#include <map>
#include <vector>
#include <iostream>
#include <tuple>

// Order book stored as sorted map: price → {qty, order_ids}
struct LevelInfo { int qty; std::vector<uint64_t> order_ids; };

using Bids = std::map<double, LevelInfo, std::greater<double>>; // descending

// Compute VWAP of top N levels using structured bindings
double vwap_top_n(const Bids& bids, int n) {
    double pv = 0.0, total_qty = 0.0;
    int depth = 0;
    for (const auto& [price, level] : bids) {  // structured binding
        pv        += price * level.qty;
        total_qty += level.qty;
        if (++depth == n) break;
    }
    return total_qty > 0 ? pv / total_qty : 0.0;
}

// Spread and mid using structured bindings + if-init (C++17)
void print_spread(const Bids& bids,
                  const std::map<double, LevelInfo>& asks) {
    if (auto [bid_it, ask_it] = std::make_pair(bids.begin(), asks.begin());
        bid_it != bids.end() && ask_it != asks.end()) {
        const auto& [best_bid, bid_lvl] = *bid_it;
        const auto& [best_ask, ask_lvl] = *ask_it;
        std::cout << "bid=" << best_bid << " ask=" << best_ask
                  << " spread=" << (best_ask - best_bid)
                  << " mid="    << 0.5*(best_bid + best_ask) << "\\n";
    }
}

int main() {
    Bids bids;
    bids[99.50] = {500, {1,2,3}};
    bids[99.49] = {300, {4,5}};
    bids[99.48] = {200, {6}};

    std::map<double, LevelInfo> asks;
    asks[99.51] = {400, {10,11}};
    asks[99.52] = {600, {12}};

    std::cout << "VWAP(top 2): " << vwap_top_n(bids, 2) << "\\n";
    print_spread(bids, asks);
}`,
    explanation: "C++17 structured bindings (`auto& [key, value]`) destructure pairs and structs without naming individual fields, reducing boilerplate in book iteration loops. The if-init extension (`if (auto [a,b] = expr; cond)`) scopes the binding to the if-block, preventing the iterators from leaking into surrounding scope."
  },
  {
    id: "cpp-20260806-b1-thread-local-cache",
    language: "cpp",
    title: "Thread-Local Position Cache for Lock-Free Risk Reads",
    tag: "low-latency",
    code: `#include <thread>
#include <atomic>
#include <unordered_map>
#include <iostream>
#include <vector>
#include <mutex>

// Global position store protected by mutex (written rarely by gateway)
struct GlobalPositions {
    std::mutex                          mu;
    std::unordered_map<int, double>     pos;  // symbol_id → net_qty
    std::atomic<uint64_t>               version{0};

    void update(int sym, double qty) {
        std::lock_guard lk(mu);
        pos[sym] = qty;
        ++version;
    }
};

// Thread-local cache for risk thread — avoids taking mutex on every check
struct TLPositionCache {
    uint64_t                            cached_ver{UINT64_MAX};
    std::unordered_map<int, double>     local;

    void refresh_if_stale(GlobalPositions& gp) {
        uint64_t cur = gp.version.load(std::memory_order_acquire);
        if (cur == cached_ver) return; // still fresh
        {
            std::lock_guard lk(gp.mu);
            local       = gp.pos;
            cached_ver  = gp.version.load(std::memory_order_relaxed);
        }
    }

    double get(GlobalPositions& gp, int sym) {
        refresh_if_stale(gp);
        auto it = local.find(sym);
        return it != local.end() ? it->second : 0.0;
    }
};

// Each thread gets its own cache via thread_local
thread_local TLPositionCache tl_cache;

GlobalPositions gp;

void risk_thread_fn(int sym) {
    for (int i = 0; i < 5; ++i) {
        double pos = tl_cache.get(gp, sym);
        std::cout << "[t=" << std::this_thread::get_id()
                  << "] sym " << sym << " pos=" << pos << "\\n";
    }
}

int main() {
    gp.update(1, 500.0);
    gp.update(2, -200.0);
    std::thread t1(risk_thread_fn, 1);
    std::thread t2(risk_thread_fn, 2);
    t1.join(); t2.join();
}`,
    explanation: "thread_local gives each thread its own cache without synchronization overhead: risk threads read positions at cache-speed (no lock, no atomic) on 99.9% of calls, and only refresh from the global store when the version number changes. The version atomic uses acquire/release to ensure freshness without a full memory fence on the common path."
  },
  {
    id: "cpp-20260806-b1-latch-parallel-greeks",
    language: "cpp",
    title: "std::latch for Parallel Greeks Computation Barrier",
    tag: "modern-cpp",
    code: `#include <latch>
#include <thread>
#include <vector>
#include <atomic>
#include <iostream>
#include <cmath>

// Compute portfolio Greeks in parallel, then aggregate once all are done.
// std::latch is single-use; std::barrier is reusable for multi-phase.

struct Greeks { double delta, vega; int thread_id; };

double compute_delta(int pos_id) {
    // Simulate finite-difference call (~1 ms of work)
    volatile double s = 0;
    for (int i = 0; i < 100000; ++i) s += std::sin(i * 0.001);
    return 0.45 + pos_id * 0.01;
}
double compute_vega(int pos_id) {
    volatile double s = 0;
    for (int i = 0; i < 80000; ++i) s += std::cos(i * 0.001);
    return 12.0 + pos_id * 0.5;
}

int main() {
    const int N = 4;
    std::vector<Greeks> results(N);
    std::latch done(N);  // count-down from N to 0

    std::vector<std::thread> workers;
    for (int i = 0; i < N; ++i) {
        workers.emplace_back([&, i]{
            results[i] = {compute_delta(i), compute_vega(i), i};
            done.count_down();  // signal this worker is complete
        });
    }

    done.wait();  // main thread blocks until all N workers count down

    double net_delta = 0, net_vega = 0;
    for (const auto& g : results) {
        net_delta += g.delta;
        net_vega  += g.vega;
    }
    std::cout << "Net delta=" << net_delta << " vega=" << net_vega << "\\n";

    for (auto& t : workers) t.join();
}`,
    explanation: "std::latch (C++20) is a single-use countdown barrier: each worker calls count_down() once, and the main thread blocks in wait() until the counter reaches zero. Unlike a mutex or condition variable, a latch needs no predicate loop and no spurious-wakeup handling — it's the correct primitive for 'wait for N tasks to complete exactly once'."
  },
  {
    id: "cpp-20260806-b1-custom-hash-orderid",
    language: "cpp",
    title: "Custom Hash Function for Order ID Lookup",
    tag: "stl",
    code: `#include <unordered_map>
#include <cstdint>
#include <string>
#include <iostream>

// Order IDs are typically 64-bit integers; the default hash is identity
// on most platforms, causing clustering when IDs are sequential.
// A mixing hash (FNV-1a or Murmur-like) distributes sequential IDs evenly.

struct MixHash {
    std::size_t operator()(uint64_t key) const noexcept {
        // Murmur-inspired finalizer
        key ^= key >> 33;
        key *= 0xff51afd7ed558ccdULL;
        key ^= key >> 33;
        key *= 0xc4ceb9fe1a85ec53ULL;
        key ^= key >> 33;
        return static_cast<std::size_t>(key);
    }
};

// Combine multiple fields into one hash (for composite keys)
struct OrderKey {
    uint64_t order_id;
    uint32_t venue_id;
    bool operator==(const OrderKey& o) const {
        return order_id == o.order_id && venue_id == o.venue_id;
    }
};
struct OrderKeyHash {
    std::size_t operator()(const OrderKey& k) const noexcept {
        uint64_t combined = k.order_id ^ (static_cast<uint64_t>(k.venue_id) << 32);
        return MixHash{}(combined);
    }
};

struct Order { double price; int qty; };

using FastOrderMap = std::unordered_map<uint64_t, Order, MixHash>;

int main() {
    FastOrderMap book;
    book.reserve(65536);  // pre-size to avoid rehash on insert
    for (uint64_t id = 1000000; id < 1001000; ++id)
        book[id] = {99.50 + id * 0.0001, 100};

    auto it = book.find(1000500);
    if (it != book.end())
        std::cout << "price=" << it->second.price << "\\n";

    using CompositeMap = std::unordered_map<OrderKey, Order, OrderKeyHash>;
    CompositeMap cmap;
    cmap[{12345, 1}] = {100.25, 500};
}`,
    explanation: "The default std::hash<uint64_t> is often the identity function, so sequential order IDs 1000000, 1000001, … map to consecutive buckets and cause linear-probe clustering. The Murmur finalizer avalanches bits across all 64 positions, spreading sequential IDs uniformly — reducing average lookup cost from O(n/bucket) toward O(1)."
  },
  {
    id: "cpp-20260806-b1-numa-alloc",
    language: "cpp",
    title: "NUMA-Aware Allocation with mbind for Tick Data Buffer",
    tag: "low-latency",
    code: `#include <numa.h>
#include <numaif.h>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <stdexcept>

// NUMA: Non-Uniform Memory Access. On multi-socket servers, memory local to
// socket 0 is ~2x faster for threads pinned to socket 0 CPUs.
// mbind() binds pages of an existing allocation to specific NUMA nodes.

struct NumaBuffer {
    void*       data{nullptr};
    std::size_t size{0};

    NumaBuffer(std::size_t bytes, int node) : size(bytes) {
        if (numa_available() < 0) {
            // Fall back to plain malloc in single-NUMA environments
            data = std::aligned_alloc(4096, bytes);
            return;
        }
        // Allocate on the requested NUMA node
        data = numa_alloc_onnode(bytes, node);
        if (!data) throw std::bad_alloc();
        // Touch pages to fault them in on the right node
        std::memset(data, 0, bytes);
    }

    ~NumaBuffer() {
        if (data) numa_free(data, size);
    }

    // Pin this buffer's pages to node 0 after allocation
    void bind_to_node(int node) {
        unsigned long nodemask = 1UL << node;
        mbind(data, size, MPOL_BIND, &nodemask, sizeof(nodemask)*8,
              MPOL_MF_MOVE | MPOL_MF_STRICT);
    }

    NumaBuffer(const NumaBuffer&) = delete;
    NumaBuffer& operator=(const NumaBuffer&) = delete;
};

int main() {
    constexpr std::size_t BUF_SIZE = 64UL << 20; // 64 MB tick ring buffer
    try {
        NumaBuffer buf(BUF_SIZE, 0);  // allocate on socket 0
        std::cout << "Allocated " << BUF_SIZE / (1<<20) << " MB on NUMA node 0\\n";
    } catch (const std::bad_alloc&) {
        std::cerr << "NUMA allocation failed (not available in container)\\n";
    }
}`,
    explanation: "On dual-socket servers (typical in co-location), accessing memory on the remote NUMA node adds ~80 ns of latency per cache miss versus ~40 ns for local memory. numa_alloc_onnode() + mbind() pin the tick ring buffer pages to the socket where the market-data parsing thread is CPU-affinized, halving memory latency for the hot path."
  },
  {
    id: "cpp-20260806-b1-pmr-unsync-pool",
    language: "cpp",
    title: "std::pmr::unsynchronized_pool_resource for Single-Thread Allocations",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <list>
#include <iostream>
#include <chrono>

// unsynchronized_pool_resource: fastest pmr allocator when only one thread
// uses it — no lock overhead vs synchronized_pool_resource.
// Internally maintains per-size free lists; returns memory to OS on destruction.

void benchmark_pmr(int N) {
    // Stack buffer for small allocations — avoids any heap for the arena itself
    std::byte stack_buf[1 << 16]; // 64 KB
    std::pmr::monotonic_buffer_resource mono(stack_buf, sizeof(stack_buf));
    std::pmr::unsynchronized_pool_resource pool(&mono);

    using PmrVec = std::pmr::vector<double>;
    std::pmr::vector<PmrVec> matrix(&pool);
    matrix.reserve(N);

    auto t0 = std::chrono::steady_clock::now();
    for (int i = 0; i < N; ++i) {
        PmrVec row(&pool);
        row.resize(64, 1.0); // 64-element row
        matrix.push_back(std::move(row));
    }
    auto dt = std::chrono::duration_cast<std::chrono::microseconds>(
        std::chrono::steady_clock::now() - t0).count();

    std::cout << N << " rows allocated in " << dt << " us\\n";
    std::cout << "sum[0][0]=" << matrix[0][0] << "\\n";
    // Arena destructor frees all rows in O(1)
}

int main() {
    benchmark_pmr(10000);
}`,
    explanation: "unsynchronized_pool_resource maintains per-size free lists (pool chunks) fed from an upstream resource (here a monotonic_buffer_resource backed by a stack buffer). The pool recycles same-size objects without calling the system allocator on the hot path; the monotonic upstream ensures that when the pool requests more memory it gets it in large contiguous chunks, not individual mallocs."
  },
  {
    id: "cpp-20260806-b1-stl-nth-element",
    language: "cpp",
    title: "std::nth_element for O(n) Quantile Computation on P&L Series",
    tag: "stl",
    code: `#include <algorithm>
#include <vector>
#include <cmath>
#include <iostream>
#include <numeric>
#include <random>

// std::nth_element: O(n) average, rearranges so that element at position k
// is what would be there after full sort, with smaller values to its left.
// Perfect for VaR quantiles on large P&L samples.

double quantile(std::vector<double>& v, double q) {
    std::size_t n  = v.size();
    std::size_t idx = static_cast<std::size_t>(std::floor(q * n));
    // Partial sort: only the idx-th element is in its correct position
    std::nth_element(v.begin(), v.begin() + idx, v.end());
    return v[idx];
}

double historical_var(std::vector<double> pnl, double confidence) {
    // VaR = -quantile at (1-confidence) of P&L distribution
    double q = 1.0 - confidence;
    return -quantile(pnl, q);
}

double cvar_es(std::vector<double> pnl, double confidence) {
    double var = historical_var(pnl, confidence);
    // CVaR = average of losses beyond VaR
    double sum = 0.0; int count = 0;
    for (double p : pnl) {
        if (-p > var) { sum += (-p); ++count; }
    }
    return count > 0 ? sum / count : var;
}

int main() {
    std::mt19937_64 rng(42);
    std::normal_distribution<double> norm(0, 1000); // daily P&L ~N(0, 1000)
    std::vector<double> pnl(2000);
    std::generate(pnl.begin(), pnl.end(), [&]{ return norm(rng); });

    std::cout << "99% VaR:  " << historical_var(pnl, 0.99) << "\\n";
    std::cout << "99% CVaR: " << cvar_es(pnl, 0.99) << "\\n";
}`,
    explanation: "std::nth_element runs in O(n) average time using introselect — it places the k-th element correctly without fully sorting the array. For daily historical VaR from 2,500 scenarios, this saves ~10x over std::sort's O(n log n). CVaR (Expected Shortfall) is the average of losses exceeding VaR and is a coherent risk measure that satisfies subadditivity, unlike VaR."
  },
  {
    id: "cpp-20260806-b1-simd-dot-product",
    language: "cpp",
    title: "Auto-Vectorized SIMD Dot Product for Factor Model Returns",
    tag: "low-latency",
    code: `#include <vector>
#include <numeric>
#include <cmath>
#include <iostream>
#include <immintrin.h>  // AVX2 intrinsics

// Factor model: portfolio_return = factors · exposures + alpha
// Hot path: repeated dot products on float vectors of length 100-500.

// Let the compiler vectorize with -O3 -march=native (pragma hint)
double dot_product_auto(const double* __restrict__ a,
                        const double* __restrict__ b, int n) {
    double sum = 0.0;
    #pragma GCC ivdep      // assert no aliasing to the compiler
    for (int i = 0; i < n; ++i)
        sum += a[i] * b[i];
    return sum;
}

// Explicit AVX2: process 4 doubles at a time
double dot_product_avx2(const double* a, const double* b, int n) {
    __m256d acc = _mm256_setzero_pd();
    int i = 0;
    for (; i + 4 <= n; i += 4) {
        __m256d va = _mm256_loadu_pd(a + i);
        __m256d vb = _mm256_loadu_pd(b + i);
        acc = _mm256_fmadd_pd(va, vb, acc);  // fused multiply-add
    }
    // Horizontal sum of 4-wide accumulator
    __m128d lo = _mm256_castpd256_pd128(acc);
    __m128d hi = _mm256_extractf128_pd(acc, 1);
    __m128d s  = _mm_add_pd(lo, hi);
    s = _mm_hadd_pd(s, s);
    double result; _mm_store_sd(&result, s);
    // Handle remainder
    for (; i < n; ++i) result += a[i] * b[i];
    return result;
}

int main() {
    const int N = 500;  // 500 risk factors
    std::vector<double> exposures(N), factor_returns(N);
    for (int i = 0; i < N; ++i) {
        exposures[i]     = (i % 7 - 3) * 0.1;
        factor_returns[i] = std::sin(i * 0.05) * 0.01;
    }
    double r_auto = dot_product_auto(exposures.data(), factor_returns.data(), N);
    double r_avx2 = dot_product_avx2(exposures.data(), factor_returns.data(), N);
    std::cout << "auto=" << r_auto << " avx2=" << r_avx2 << "\\n";
}`,
    explanation: "AVX2's _mm256_fmadd_pd processes four double-precision multiply-adds per instruction with a single-cycle throughput, giving 4x throughput over scalar code. The #pragma GCC ivdep version achieves the same when compiled with -O3 -mavx2 but is more portable — explicit intrinsics are for cases where the compiler's auto-vectorizer fails to generate optimal code."
  },
];
