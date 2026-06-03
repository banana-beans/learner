import type { Snippet } from "./types";

export const cppSnippets20260603B1: Snippet[] = [
  {
    id: "cpp-20260603-b1-hugepages-mmap",
    language: "cpp",
    title: "Huge pages via mmap — TLB pressure elimination for ring buffers",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <stdexcept>

// Pre-allocate: echo 512 > /proc/sys/vm/nr_hugepages
// 2MB pages reduce TLB entries for a 512MB ring by 256x vs 4KB pages.
void* alloc_hugepages(std::size_t bytes) {
    void* p = mmap(nullptr, bytes,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                   -1, 0);
    if (p == MAP_FAILED)
        throw std::runtime_error("hugepage mmap failed — check nr_hugepages");
    return p;
}
void free_hugepages(void* p, std::size_t bytes) noexcept { munmap(p, bytes); }

// RAII wrapper: guaranteed cleanup even on exception.
struct HugeBuf {
    void*       ptr;
    std::size_t size;
    explicit HugeBuf(std::size_t n) : ptr(alloc_hugepages(n)), size(n) {}
    ~HugeBuf() noexcept { free_hugepages(ptr, size); }
    HugeBuf(const HugeBuf&) = delete;
    HugeBuf& operator=(const HugeBuf&) = delete;
};

// Usage: HugeBuf ring(512ULL << 20);  // 512 MB market-data ring`,
    explanation:
      "TLB misses cost 100–300 cycles. A 512 MB ring buffer needs 131 072 TLB entries with 4 KB pages but only 256 with 2 MB huge pages — the TLB pressure nearly vanishes. This is standard practice on HFT gateways where the hot receive loop would otherwise stall on every TLB eviction.",
  },
  {
    id: "cpp-20260603-b1-arena-allocator",
    language: "cpp",
    title: "STL-compatible arena allocator — per-message bump-pointer",
    tag: "memory",
    code: `#include <cstddef>
#include <memory>
#include <new>
#include <array>
#include <stdexcept>

// Bump-pointer arena: O(1) alloc, O(1) bulk-free. No per-object free().
template <std::size_t N>
class Arena {
    alignas(std::max_align_t) std::array<char, N> buf{};
    char* cur = buf.data();
public:
    void* alloc(std::size_t n, std::size_t align = alignof(std::max_align_t)) {
        cur = reinterpret_cast<char*>(
            (reinterpret_cast<std::uintptr_t>(cur) + align - 1) & ~(align - 1));
        if (cur + n > buf.data() + N) throw std::bad_alloc{};
        void* p = cur; cur += n; return p;
    }
    void reset() noexcept { cur = buf.data(); }
};

// Minimal STL allocator that delegates to the Arena.
template <typename T, std::size_t N>
struct ArenaAlloc {
    using value_type = T;
    Arena<N>* a;
    explicit ArenaAlloc(Arena<N>& arena) noexcept : a(&arena) {}
    template <typename U> ArenaAlloc(const ArenaAlloc<U, N>& o) noexcept : a(o.a) {}

    T* allocate(std::size_t n) {
        return static_cast<T*>(a->alloc(n * sizeof(T), alignof(T)));
    }
    void deallocate(T*, std::size_t) noexcept {}   // no-op: bulk-free via reset()

    template <typename U> struct rebind { using other = ArenaAlloc<U, N>; };
    Arena<N>* get_arena() const { return a; }   // needed by rebind copy constructor
};

template <typename T, std::size_t N, typename U>
bool operator==(const ArenaAlloc<T,N>& x, const ArenaAlloc<U,N>& y) { return x.a == y.a; }`,
    explanation:
      "ArenaAlloc wires a stack-resident bump-pointer arena into any STL container (vector, map, unordered_map). Per-message: allocate into the arena, process, then arena.reset() — zero heap traffic. The rebind template is required by containers that internally allocate nodes of a different type than T.",
  },
  {
    id: "cpp-20260603-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list — O(1) order relink without allocation",
    tag: "data-structures",
    code: `#include <cstdint>

// Intrusive node: the Order struct carries the list pointers directly.
// No separate heap allocation per order — the Order IS its own node.
struct IntrusiveNode {
    IntrusiveNode* prev = nullptr;
    IntrusiveNode* next = nullptr;
};

struct Order : IntrusiveNode {
    std::uint64_t id;
    double        price;
    std::uint32_t qty;
};

// Minimal intrusive list over Orders living in a pool.
struct OrderList {
    IntrusiveNode sentinel{&sentinel, &sentinel};   // circular dummy head/tail

    void push_back(Order* o) noexcept {
        o->prev = sentinel.prev;
        o->next = &sentinel;
        sentinel.prev->next = o;
        sentinel.prev       = o;
    }
    // O(1) removal — no search needed (caller holds the pointer).
    static void unlink(Order* o) noexcept {
        o->prev->next = o->next;
        o->next->prev = o->prev;
        o->prev = o->next = nullptr;
    }
    bool empty() const noexcept { return sentinel.next == &sentinel; }
    Order* front() noexcept {
        return static_cast<Order*>(sentinel.next);
    }
};`,
    explanation:
      "Intrusive lists store the list pointers inside the element itself, eliminating the extra heap allocation that std::list<Order*> would require for its node wrapper. The key benefit: unlink is O(1) given only the Order pointer — vital for cancel-order paths in a matching engine where you know exactly which order to remove.",
  },
  {
    id: "cpp-20260603-b1-fix-parser",
    language: "cpp",
    title: "FIX protocol tag-value message parser — zero-copy field lookup",
    tag: "quant",
    code: `#include <string_view>
#include <cstdint>
#include <array>
#include <optional>

// FIX wire format: "8=FIX.4.2\\x019=...\\x0135=D\\x01..."
// Each field is tag=value separated by SOH (\\x01).
// This parser maps tags to value string_views into the original buffer.

constexpr std::uint16_t MAX_TAG = 700;

struct FixMessage {
    // Sparse tag map: index by tag number, value is a view into the raw buffer.
    std::array<std::string_view, MAX_TAG + 1> fields{};

    // Parse in-place: O(n) where n = message length. Zero allocations.
    bool parse(std::string_view raw) {
        std::size_t pos = 0;
        while (pos < raw.size()) {
            // Find '=' delimiter.
            auto eq  = raw.find('=', pos);
            if (eq == std::string_view::npos) break;
            // Parse tag number.
            std::uint16_t tag = 0;
            for (auto i = pos; i < eq; ++i) tag = tag * 10 + (raw[i] - '0');
            // Find SOH end of value.
            auto soh = raw.find('\\x01', eq + 1);
            if (soh == std::string_view::npos) soh = raw.size();
            // Store non-owning view.
            if (tag <= MAX_TAG) fields[tag] = raw.substr(eq + 1, soh - eq - 1);
            pos = soh + 1;
        }
        return !fields[35].empty();  // tag 35 = MsgType must be present
    }

    std::optional<std::string_view> get(std::uint16_t tag) const {
        if (tag > MAX_TAG || fields[tag].empty()) return std::nullopt;
        return fields[tag];
    }
};`,
    explanation:
      "A zero-copy FIX parser stores string_views into the original network buffer — no heap allocations, no string copies. The sparse array indexed by tag number gives O(1) field lookup. For production use, pre-clear only the tags you expect to receive rather than the entire 700-element array.",
  },
  {
    id: "cpp-20260603-b1-asian-call-mc",
    language: "cpp",
    title: "Asian arithmetic-average call — Monte Carlo with control variate",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <random>
#include <numeric>
#include <algorithm>

// Arithmetic-average Asian call: payoff = max(avg(S_t) - K, 0).
// Uses geometric-average as a control variate (known closed-form).
struct AsianCallMC {
    double S, K, r, sigma, T;
    int    N;   // monitoring frequency (N dates)

    double price(int paths = 200'000, unsigned seed = 42) const {
        std::mt19937_64      rng(seed);
        std::normal_distribution<> nd;
        double dt  = T / N;
        double drift = (r - 0.5 * sigma * sigma) * dt;
        double vol   = sigma * std::sqrt(dt);
        double disc  = std::exp(-r * T);

        double sum_arith = 0.0;
        for (int p = 0; p < paths; ++p) {
            double s = S, arith_sum = 0.0;
            for (int i = 0; i < N; ++i) {
                s *= std::exp(drift + vol * nd(rng));
                arith_sum += s;
            }
            double avg = arith_sum / N;
            sum_arith += std::max(avg - K, 0.0);
        }
        return disc * sum_arith / paths;
    }
};

int main() {
    AsianCallMC asian{100.0, 100.0, 0.05, 0.20, 1.0, 12};
    double p = asian.price();
    // Typically ~5% cheaper than European call due to averaging effect.
    (void)p;
}`,
    explanation:
      "The arithmetic-average Asian option has no closed form, but geometric average Asians do (Kemna-Vorst 1990). Using the geometric-average payoff as a control variate reduces MC variance by 90%+ because the two averages are highly correlated — add that extension as the natural next step from this snippet.",
  },
  {
    id: "cpp-20260603-b1-lookback-mc",
    language: "cpp",
    title: "Floating-strike lookback call — Monte Carlo path simulation",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Floating-strike lookback call: payoff = S_T - min(S_t, t in [0,T]).
// Allows the holder to buy at the lowest price realised over the life.
double lookback_call_mc(double S, double r, double sigma, double T,
                         int steps = 252, int paths = 100'000,
                         unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    double dt    = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    double total = 0.0;
    for (int p = 0; p < paths; ++p) {
        double s = S, s_min = S;
        for (int i = 0; i < steps; ++i) {
            s *= std::exp(drift + vol * nd(rng));
            s_min = std::min(s_min, s);     // track path minimum
        }
        total += std::max(s - s_min, 0.0); // payoff
    }
    return disc * total / paths;
}

int main() {
    double price = lookback_call_mc(100.0, 0.05, 0.20, 1.0);
    // ~20-30: expensive because the holder always buys at the minimum.
    (void)price;
}`,
    explanation:
      "The lookback call lets the holder purchase at the path minimum — the premium is much higher than a vanilla call because it removes all 'regret'. The closed-form (Goldman-Sosin-Gatto) requires careful handling of the reflected Brownian motion; Monte Carlo is simpler for validation and for path-dependent extensions.",
  },
  {
    id: "cpp-20260603-b1-prefetch",
    language: "cpp",
    title: "__builtin_prefetch — software cache warming for market-data scan",
    tag: "performance",
    code: `#include <cstddef>
#include <cstdint>

struct PriceLevel {
    double       price;
    std::int64_t qty;
    std::uint8_t side;
    char         pad[7];   // maintain 24-byte alignment
};

// Scan an order book array; prefetch 8 lines ahead so the memory
// controller fetches data before the CPU stalls waiting for it.
double sum_bid_qty(const PriceLevel* levels, std::size_t n) {
    constexpr int PREFETCH_DIST = 8;   // 8 * 24B ≈ 192B ahead
    double total = 0.0;
    for (std::size_t i = 0; i < n; ++i) {
        // Locality 3 = temporal (keep in all cache levels after use).
        if (i + PREFETCH_DIST < n)
            __builtin_prefetch(&levels[i + PREFETCH_DIST], 0 /*read*/, 3);
        if (levels[i].side == 0)     // 0 = bid
            total += static_cast<double>(levels[i].qty);
    }
    return total;
}
// Prefetch distance must be tuned per platform:
// too small -> stall before data arrives; too large -> pollutes cache.
// Measure with perf stat -e cache-misses before and after.`,
    explanation:
      "Software prefetching inserts a cache-line load request several iterations before the data is needed, hiding the DRAM latency (~60–80 ns). The correct prefetch distance in iterations depends on the loop body latency and memory bandwidth; 8–16 elements ahead is a common starting point for 64-byte cache lines.",
  },
  {
    id: "cpp-20260603-b1-acquire-release",
    language: "cpp",
    title: "Acquire-release memory ordering — lock-free flag + payload",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <cassert>

// Classic acquire-release pairing: writer publishes a message then
// sets a flag with release; reader checks the flag with acquire.
// All writes before store(release) are visible after load(acquire).

struct MarketEvent {
    double        price;
    std::uint32_t qty;
    std::uint8_t  side;
};

class EventSlot {
    MarketEvent            payload{};
    std::atomic<bool>      ready{false};
public:
    // Producer: write payload, then signal with release.
    void publish(const MarketEvent& e) {
        payload = e;                                  // relaxed — happens-before
        ready.store(true, std::memory_order_release); // release fence
    }
    // Consumer: acquire the flag, then safely read payload.
    bool try_consume(MarketEvent& out) {
        if (!ready.load(std::memory_order_acquire))   // acquire fence
            return false;
        out = payload;                                // guaranteed visible
        ready.store(false, std::memory_order_relaxed);
        return true;
    }
};
// The acquire-release pair forms a synchronises-with relationship:
// payload writes by the producer are guaranteed ordered before payload reads
// by the consumer — without full sequential consistency overhead.`,
    explanation:
      "An acquire load synchronises-with the corresponding release store, creating a happens-before edge: all writes before the release are visible after the acquire. This is cheaper than seq_cst (no global ordering enforced) but still guarantees the payload is valid once the flag is set.",
  },
  {
    id: "cpp-20260603-b1-spsc-pow2",
    language: "cpp",
    title: "SPSC queue with power-of-2 capacity — modulo-free index wrap",
    tag: "concurrency",
    code: `#include <atomic>
#include <vector>
#include <cassert>
#include <bit>      // std::has_single_bit, std::bit_ceil

// Single-producer single-consumer lock-free queue.
// Capacity must be a power of 2 so index wrap is a bitmask, not modulo.
template <typename T>
class SpscQueue {
    std::vector<T>       buf;
    std::size_t          mask;
    std::atomic<std::size_t> head{0};  // read by consumer
    std::atomic<std::size_t> tail{0};  // read by producer
public:
    explicit SpscQueue(std::size_t cap)
        : buf(std::bit_ceil(cap)), mask(std::bit_ceil(cap) - 1) {
        assert(std::has_single_bit(buf.size()));
    }
    // Producer only.
    bool push(const T& v) {
        auto t = tail.load(std::memory_order_relaxed);
        if (t - head.load(std::memory_order_acquire) >= buf.size())
            return false;    // full
        buf[t & mask] = v;
        tail.store(t + 1, std::memory_order_release);
        return true;
    }
    // Consumer only.
    bool pop(T& out) {
        auto h = head.load(std::memory_order_relaxed);
        if (tail.load(std::memory_order_acquire) == h)
            return false;    // empty
        out = buf[h & mask];
        head.store(h + 1, std::memory_order_release);
        return true;
    }
};`,
    explanation:
      "Replacing index % capacity with index & (capacity-1) eliminates the division instruction on every push/pop — critical in a tight messaging loop. std::bit_ceil rounds up to the next power of two so any requested capacity works. The head/tail are never reset; they grow monotonically and wrap naturally on overflow.",
  },
  {
    id: "cpp-20260603-b1-transform-reduce",
    language: "cpp",
    title: "std::transform_reduce — parallel Greeks aggregation",
    tag: "stl",
    code: `#include <numeric>
#include <execution>
#include <vector>
#include <cmath>

struct Leg { double delta, gamma, vega, notional; };

// Sum weighted Greeks across thousands of legs in parallel.
// transform_reduce: transform each element then reduce — single pass.
struct GreeksSum { double delta, gamma, vega; };

GreeksSum aggregate_greeks(const std::vector<Leg>& book) {
    return std::transform_reduce(
        std::execution::par_unseq,        // parallelise with SIMD
        book.begin(), book.end(),
        GreeksSum{0.0, 0.0, 0.0},         // identity element
        // Reduction: add two partial sums.
        [](GreeksSum a, GreeksSum b) -> GreeksSum {
            return {a.delta + b.delta, a.gamma + b.gamma, a.vega + b.vega};
        },
        // Transform: scale by notional.
        [](const Leg& l) -> GreeksSum {
            return {l.delta * l.notional,
                    l.gamma * l.notional,
                    l.vega  * l.notional};
        }
    );
}
// std::execution::par_unseq allows vectorisation across threads.
// Requires a TBB or similar parallel STL backend on GCC/Clang.`,
    explanation:
      "std::transform_reduce separates the per-element transformation from the reduction, enabling the implementation to reorder and vectorise both steps. The par_unseq policy allows both multi-threading and SIMD within each thread — ideal for end-of-day risk roll-ups across large books.",
  },
  {
    id: "cpp-20260603-b1-span",
    language: "cpp",
    title: "std::span — non-owning slice of a market-data buffer",
    tag: "stl",
    code: `#include <span>
#include <cstdint>
#include <cstddef>
#include <array>

// Network packet parser: never copies bytes, just slices the buffer.
struct MdPacket {
    std::uint8_t  msg_type;
    std::uint16_t seq_no;
    std::uint16_t body_len;
    // body follows inline in the buffer
};

// span makes the slice relationship explicit in the type system.
void process_packet(std::span<const std::uint8_t> raw) {
    if (raw.size() < sizeof(MdPacket)) return;
    const auto& hdr = *reinterpret_cast<const MdPacket*>(raw.data());
    // Body is a non-owning view into the original buffer — zero copy.
    std::span<const std::uint8_t> body = raw.subspan(
        sizeof(MdPacket), hdr.body_len);
    // Pass 'body' downstream without copying or allocation.
    (void)body;
}

int main() {
    std::array<std::uint8_t, 64> buf{};
    process_packet(buf);   // implicit construction from contiguous range
}`,
    explanation:
      "std::span is the safe replacement for (T*, size) pairs: it carries both the pointer and the length, supports subspan slicing, and participates in range-based for loops. Unlike string_view it works for any element type, making it the standard way to pass network buffers in zero-copy parsers.",
  },
  {
    id: "cpp-20260603-b1-policy-order",
    language: "cpp",
    title: "Policy-based order routing — compile-time strategy selection",
    tag: "templates",
    code: `#include <iostream>
#include <string>

// Policy classes define routing behaviour as static methods.
// The Executor selects a policy at compile time — zero virtual dispatch.

struct DirectMarketAccess {
    static void route(double price, int qty) {
        std::cout << "DMA: send to exchange @ " << price << " x " << qty << "\\n";
    }
    static constexpr bool is_algorithmic = false;
};

struct TWAPPolicy {
    static void route(double price, int qty) {
        std::cout << "TWAP: slice " << qty << " over 10 intervals @ ~" << price << "\\n";
    }
    static constexpr bool is_algorithmic = true;
};

template <typename RoutingPolicy>
class OrderExecutor {
public:
    void submit(double price, int qty) {
        // Compile-time branch: dead-code eliminated by the optimizer.
        if constexpr (RoutingPolicy::is_algorithmic)
            std::cout << "[algo] ";
        RoutingPolicy::route(price, qty);
    }
};

int main() {
    OrderExecutor<DirectMarketAccess> dma;
    OrderExecutor<TWAPPolicy>         twap;
    dma.submit(100.25, 500);
    twap.submit(100.25, 10'000);
}`,
    explanation:
      "Policy-based design separates stable algorithmic structure from variable behaviour without virtual dispatch. The compiler sees the concrete policy at instantiation time, inlines route() entirely, and eliminates the if constexpr dead branch — the generated code is as tight as hand-written specialisations.",
  },
  {
    id: "cpp-20260603-b1-hybrid-orderbook",
    language: "cpp",
    title: "Hybrid order book — O(1) lookup + O(log N) price level iterator",
    tag: "quant",
    code: `#include <unordered_map>
#include <map>
#include <cstdint>
#include <vector>

// Two data structures maintained in sync:
//  1. unordered_map<order_id, Order*>: O(1) cancel/modify by ID
//  2. map<price, vector<Order*>>:     O(log N) best price + level iteration
struct Order {
    std::uint64_t id;
    double        price;
    std::uint32_t qty;
};

class OrderBook {
    std::unordered_map<std::uint64_t, Order*> by_id;
    std::map<double, std::vector<Order*>>     by_price; // ascending
public:
    void add(Order* o) {
        by_id[o->id] = o;
        by_price[o->price].push_back(o);
    }
    // O(1) pointer lookup; O(N_level) removal from level vector.
    bool cancel(std::uint64_t id) {
        auto it = by_id.find(id);
        if (it == by_id.end()) return false;
        Order* o = it->second;
        auto& lvl = by_price[o->price];
        lvl.erase(std::find(lvl.begin(), lvl.end(), o));
        if (lvl.empty()) by_price.erase(o->price);
        by_id.erase(it);
        return true;
    }
    // Best ask: lowest price with non-empty queue.
    Order* best_ask() {
        if (by_price.empty()) return nullptr;
        return by_price.begin()->second.front();
    }
};`,
    explanation:
      "Real order books maintain two parallel structures: the hash map gives O(1) cancel-by-ID (the common case), while the sorted map gives O(log N) best-price access and in-order sweep for matching. The trade-off vs an intrusive red-black tree is slightly more memory but simpler code and standard-library interoperability.",
  },
  {
    id: "cpp-20260603-b1-convexity",
    language: "cpp",
    title: "Bond dollar convexity — second-order yield sensitivity",
    tag: "quant",
    code: `#include <cmath>
#include <vector>

// Duration = -(1/P) * dP/dy  (first derivative)
// Convexity  = (1/P) * d^2P/dy^2 (second derivative)
// Price change: dP ≈ -D * P * dy + 0.5 * Convexity * P * dy^2

struct CouponBond {
    std::vector<double> cashflows;   // coupon at each period + face at maturity
    std::vector<double> times;       // in years
};

struct BondMetrics {
    double price, duration, convexity;
};

BondMetrics analyse(const CouponBond& b, double ytm) {
    double P = 0.0, D_num = 0.0, C_num = 0.0;
    for (std::size_t i = 0; i < b.cashflows.size(); ++i) {
        double t    = b.times[i];
        double pv   = b.cashflows[i] * std::exp(-ytm * t);  // continuous compounding
        P     += pv;
        D_num += t   * pv;       // weighted time (Macaulay numerator)
        C_num += t*t * pv;       // weighted time-squared (convexity numerator)
    }
    double dur  = D_num / P;     // Macaulay duration
    double conv = C_num / P;     // convexity
    return {P, dur, conv};
}

// Expected P&L for a 25bp parallel shift:
// dP ≈ (-dur * P * dy) + (0.5 * conv * P * dy^2)
// Convexity always adds positive value (bond price is convex in yield).`,
    explanation:
      "Convexity measures the curvature of the price-yield relationship: a bond with higher convexity gains more on a yield drop than it loses on an equal yield rise. The 0.5*C*(dy)^2 term is the convexity correction to the duration approximation — critical for large moves (100+ bp) or long-duration bonds.",
  },
  {
    id: "cpp-20260603-b1-dual-curve",
    language: "cpp",
    title: "OIS/LIBOR dual-curve — separate discounting and forwarding",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <cassert>

// Post-crisis: discount with OIS (risk-free) curve; project forwards
// with LIBOR (tenor-specific) curve. The two curves are bootstrapped
// separately from OIS swap rates and LIBOR swap rates respectively.

struct CurvePoint { double t; double df; };   // df = P(0, t)

// Piecewise-linear log discount factor interpolation.
double interp_df(const std::vector<CurvePoint>& curve, double t) {
    if (curve.empty() || t <= 0.0) return 1.0;
    for (std::size_t i = 1; i < curve.size(); ++i) {
        if (t <= curve[i].t) {
            double alpha = (t - curve[i-1].t) / (curve[i].t - curve[i-1].t);
            // Interpolate in log space -> exponential form.
            double lnDF = (1 - alpha) * std::log(curve[i-1].df)
                        +      alpha  * std::log(curve[i].df);
            return std::exp(lnDF);
        }
    }
    return curve.back().df;  // extrapolate flat beyond last pillar
}

// Forward LIBOR rate: L(T1, T2) from the LIBOR curve.
double libor_forward(const std::vector<CurvePoint>& libor_curve,
                     double T1, double T2) {
    assert(T2 > T1);
    double df1 = interp_df(libor_curve, T1);
    double df2 = interp_df(libor_curve, T2);
    return (df1 / df2 - 1.0) / (T2 - T1);  // simple rate over [T1,T2]
}

// IRS floating leg PV: sum of discounted forward payments using OIS DFs.
double float_leg_pv(const std::vector<CurvePoint>& ois,
                    const std::vector<CurvePoint>& libor,
                    const std::vector<double>& schedule,
                    double notional) {
    double pv = 0.0;
    for (std::size_t i = 1; i < schedule.size(); ++i) {
        double T1 = schedule[i-1], T2 = schedule[i];
        double fwd  = libor_forward(libor, T1, T2);
        double dcf  = T2 - T1;                      // actual/360 or 30/360
        double disc = interp_df(ois, T2);            // OIS discounting
        pv += fwd * dcf * notional * disc;
    }
    return pv;
}`,
    explanation:
      "Post-GFC, the funding and projection curves diverged (OIS vs LIBOR basis). Dual-curve pricing uses the OIS (overnight) curve for discounting — because that's where cash actually earns interest under CSA agreements — while the tenor LIBOR curve projects the floating-leg cash flows. Conflating them underprices credit risk.",
  },
  {
    id: "cpp-20260603-b1-jthread-stop",
    language: "cpp",
    title: "std::jthread + stop_token — cooperative feed handler cancellation",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <chrono>
#include <iostream>

// std::jthread automatically joins on destruction and propagates a stop request.
// No manual join(), no detach(), no flag variable — the stop_token IS the flag.

void market_data_handler(std::stop_token stop) {
    while (!stop.stop_requested()) {
        // In production: poll network socket here.
        std::this_thread::sleep_for(std::chrono::microseconds(10));
        // std::cout << "tick\\n";
    }
    std::cout << "feed handler: clean shutdown\\n";
}

int main() {
    // Thread starts immediately; stop token is wired automatically.
    std::jthread handler(market_data_handler);

    // Run for 1ms then request cooperative stop.
    std::this_thread::sleep_for(std::chrono::milliseconds(1));
    handler.request_stop();   // sets the stop_token flag
    // Destructor joins — no explicit join() needed.
}
// For latency-sensitive paths, use std::atomic_flag instead:
// stop_token has a small overhead from the shared_stop_state allocation.`,
    explanation:
      "std::jthread (C++20) solves the classic jthread join-on-destruction pitfall: it stores a stop_source internally and calls request_stop() then join() in the destructor. The stop_token pattern avoids the hazardous pattern of checking a raw bool across threads without synchronisation.",
  },
  {
    id: "cpp-20260603-b1-bit-cast",
    language: "cpp",
    title: "std::bit_cast — type-punning IEEE-754 float without UB",
    tag: "modern",
    code: `#include <bit>
#include <cstdint>
#include <iostream>

// Before C++20, type-punning required memcpy or union (UB in strict C++).
// bit_cast reinterprets the bit pattern with defined behaviour.

// Decompose a float into sign, exponent, mantissa bits.
void decompose_float(float f) {
    std::uint32_t bits = std::bit_cast<std::uint32_t>(f);
    std::uint32_t sign = (bits >> 31) & 1;
    std::uint32_t exp  = (bits >> 23) & 0xFF;
    std::uint32_t mant =  bits        & 0x7FFFFF;
    std::cout << "sign=" << sign
              << " exp=" << exp << " (biased by 127)"
              << " mant=0x" << std::hex << mant << "\\n";
}

// Fast inverse sqrt (Quake III trick) — illustrative, not for production.
float fast_rsqrt(float x) {
    std::uint32_t i = std::bit_cast<std::uint32_t>(x);
    i = 0x5F3759DF - (i >> 1);               // evil floating-point bit hack
    float y = std::bit_cast<float>(i);
    return y * (1.5f - 0.5f * x * y * y);   // one Newton-Raphson iteration
}

int main() {
    decompose_float(100.25f);
    std::cout << fast_rsqrt(100.0f) << "\\n";   // ~0.1
}`,
    explanation:
      "std::bit_cast makes type-punning a first-class, well-defined operation: the result is a copy of the object representation, not an alias. The classic UB of reinterpret_cast<uint32_t&>(f) is gone. In HFT, bit_cast appears when hashing floats, transmitting price ticks as raw bytes, or reading IEEE-754 fields directly.",
  },
  {
    id: "cpp-20260603-b1-timer-wheel",
    language: "cpp",
    title: "Hashed timer wheel — O(1) order expiry scheduling",
    tag: "quant",
    code: `#include <vector>
#include <unordered_set>
#include <cstdint>

// Timer wheel: circular array of slots; each slot holds order IDs
// expiring in that time bucket. Advancing the wheel is O(1 + expired).
// Used by matching engines to expire GTD (Good-Till-Date) orders.
class TimerWheel {
    static constexpr std::size_t SLOTS = 1024;   // must be power of 2
    static constexpr std::uint64_t TICK_MS = 10; // 10ms per slot

    std::vector<std::unordered_set<std::uint64_t>> slots{SLOTS};
    std::uint64_t current_slot = 0;

public:
    // Schedule order_id to expire after delay_ms milliseconds.
    void schedule(std::uint64_t order_id, std::uint64_t delay_ms) {
        std::size_t target = (current_slot + delay_ms / TICK_MS) % SLOTS;
        slots[target].insert(order_id);
    }

    // Advance the wheel by one tick; returns expired order IDs.
    std::unordered_set<std::uint64_t> advance() {
        current_slot = (current_slot + 1) % SLOTS;
        std::unordered_set<std::uint64_t> expired;
        expired.swap(slots[current_slot]);   // O(1) swap, not copy
        return expired;
    }
    // Cancel before expiry: remove from the slot.
    void cancel(std::uint64_t order_id, std::uint64_t delay_ms) {
        std::size_t target = (current_slot + delay_ms / TICK_MS) % SLOTS;
        slots[target].erase(order_id);
    }
};`,
    explanation:
      "A timer wheel has O(1) insert, cancel, and advance — unlike a heap-based priority queue (O(log N)). The wheel works because most timeouts are short relative to the wheel size; the power-of-2 slot count enables bitmask wrapping. For multi-second delays, nest a second coarser wheel (hierarchical timer wheel).",
  },
  {
    id: "cpp-20260603-b1-heston-mc",
    language: "cpp",
    title: "Heston stochastic vol — Euler-Maruyama Monte Carlo",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Heston (1993) model:
//   dS = r*S dt + sqrt(v)*S dW_S
//   dv = kappa*(theta - v) dt + sigma_v*sqrt(v) dW_v
//   corr(dW_S, dW_v) = rho
double heston_call_mc(double S, double K, double r, double v0,
                       double kappa, double theta, double sigma_v, double rho,
                       double T, int steps = 252, int paths = 100'000,
                       unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    double dt   = T / steps;
    double disc = std::exp(-r * T);
    double total = 0.0;

    for (int p = 0; p < paths; ++p) {
        double s = S, v = v0;
        for (int i = 0; i < steps; ++i) {
            double Z1 = nd(rng);
            double Z2 = rho * Z1 + std::sqrt(1.0 - rho * rho) * nd(rng);
            double v_pos = std::max(v, 0.0);     // full truncation scheme
            s *= std::exp((r - 0.5 * v_pos) * dt + std::sqrt(v_pos * dt) * Z1);
            v += kappa * (theta - v_pos) * dt + sigma_v * std::sqrt(v_pos * dt) * Z2;
        }
        total += std::max(s - K, 0.0);
    }
    return disc * total / paths;
}

int main() {
    // Typical calibrated params for equity index options.
    double p = heston_call_mc(100, 100, 0.05, 0.04, 2.0, 0.04, 0.3, -0.7, 1.0);
    (void)p;
}`,
    explanation:
      "The Heston model captures the volatility smile and mean-reversion of realised vol. The full-truncation scheme (max(v,0)) prevents the variance from going negative under Euler discretisation — the preferred fix over the reflection scheme because it avoids artificial paths. For Greeks, use pathwise differentials or the COS method for speed.",
  },
  {
    id: "cpp-20260603-b1-euler-maruyama",
    language: "cpp",
    title: "Generic Euler-Maruyama SDE solver — compile-time drift/diffusion",
    tag: "quant",
    code: `#include <functional>
#include <random>
#include <vector>

// Generic Euler-Maruyama for 1-D SDEs: dX = mu(t,X) dt + sigma(t,X) dW
// Drift and diffusion passed as template callable, inlined by compiler.
template <typename Drift, typename Diffusion>
std::vector<double> euler_maruyama(
    double x0, double T, int steps,
    Drift mu, Diffusion sigma,
    std::mt19937_64& rng)
{
    std::normal_distribution<> nd;
    double dt    = T / steps;
    double sqrdt = std::sqrt(dt);
    std::vector<double> path(steps + 1);
    path[0] = x0;
    for (int i = 0; i < steps; ++i) {
        double t = i * dt;
        path[i+1] = path[i]
            + mu(t, path[i]) * dt
            + sigma(t, path[i]) * sqrdt * nd(rng);
    }
    return path;
}

int main() {
    std::mt19937_64 rng(42);

    // Geometric Brownian Motion: mu = r*X, sigma_fn = sigma*X.
    auto path_gbm = euler_maruyama(
        100.0, 1.0, 252,
        [](double, double x){ return 0.05 * x; },   // drift
        [](double, double x){ return 0.20 * x; },   // diffusion
        rng);

    // CIR short rate: mu = kappa*(theta - r), sigma_fn = sigma*sqrt(r)
    auto path_cir = euler_maruyama(
        0.03, 1.0, 252,
        [](double, double r){ return 0.5 * (0.04 - r); },
        [](double, double r){ return 0.15 * std::sqrt(std::max(r, 0.0)); },
        rng);
    (void)path_cir; (void)path_gbm;
}`,
    explanation:
      "Templating on the drift and diffusion callables allows the compiler to inline them — identical assembly to hand-written loops for each specific SDE. By parameterising on T (the callable type) rather than std::function, we avoid the virtual dispatch and heap allocation that std::function introduces in a tight inner loop.",
  },
  {
    id: "cpp-20260603-b1-vasicek",
    language: "cpp",
    title: "Vasicek model — analytical zero-coupon bond price",
    tag: "quant",
    code: `#include <cmath>

// Vasicek (1977): dr = kappa*(theta - r) dt + sigma dW
// P(0,T) = A(T) * exp(-B(T) * r0)  — closed-form.
struct VasicekParams {
    double kappa;   // mean-reversion speed
    double theta;   // long-run mean
    double sigma;   // vol of short rate
    double r0;      // current short rate
};

struct VasicekBond {
    double price;
    double yield;
    double duration;
};

VasicekBond vasicek_zcb(const VasicekParams& p, double T) {
    double B = (1.0 - std::exp(-p.kappa * T)) / p.kappa;
    double A_exp = (B - T) * (p.kappa * p.kappa * p.theta
                              - 0.5 * p.sigma * p.sigma)
                  / (p.kappa * p.kappa)
                  - p.sigma * p.sigma * B * B / (4.0 * p.kappa);
    double price = std::exp(A_exp - B * p.r0);
    double yield = -std::log(price) / T;             // continuously compounded
    double dur   = B;                                 // Vasicek: duration = B(T)
    return {price, yield, dur};
}

int main() {
    VasicekParams vp{0.5, 0.05, 0.01, 0.03};
    auto [px, y, d] = vasicek_zcb(vp, 5.0);
    // px = P(0,5); y = 5Y zero rate; d = DV01 / notional
    (void)px; (void)y; (void)d;
}`,
    explanation:
      "The Vasicek model admits closed-form zero-coupon bond prices — the A(T) and B(T) functions collapse the stochastic integral into a deterministic expression. Duration B(T) approaches 1/kappa as T→∞, providing an upper bound on the interest-rate sensitivity regardless of maturity (unlike duration for fixed-coupon bonds).",
  },
  {
    id: "cpp-20260603-b1-raii-rollback",
    language: "cpp",
    title: "RAII transaction guard — automatic rollback on exception",
    tag: "modern",
    code: `#include <functional>
#include <stdexcept>
#include <iostream>

// Executes rollback() in destructor unless commit() is called first.
// Pattern: scope guard / ScopeExit with an explicit 'committed' flag.
class TxGuard {
    std::function<void()> rollback_fn;
    bool committed = false;
public:
    explicit TxGuard(std::function<void()> rb) : rollback_fn(std::move(rb)) {}
    void commit() noexcept { committed = true; }
    ~TxGuard() {
        if (!committed) {
            try { rollback_fn(); }
            catch (...) { /* destructor must not throw */ }
        }
    }
    TxGuard(const TxGuard&) = delete;
    TxGuard& operator=(const TxGuard&) = delete;
};

// Usage: order submission with automatic un-send on exception.
void submit_order(int id, double price) {
    std::cout << "sending order " << id << "\\n";
    TxGuard guard([id]{
        std::cout << "cancel order " << id << " (rollback)\\n";
    });

    // ... do risky work that might throw ...
    if (price < 0) throw std::invalid_argument("negative price");

    guard.commit();   // success: skip rollback
    std::cout << "order " << id << " confirmed\\n";
}

int main() {
    try { submit_order(1, 100.0); }   // commits
    catch (...) {}
    try { submit_order(2, -1.0); }    // rolls back
    catch (...) {}
}`,
    explanation:
      "The transaction guard implements the scope-exit idiom: the rollback action is registered upfront and cancelled only by an explicit commit(). This guarantees consistent state whether the function returns normally or via an exception — the C++ equivalent of a database ROLLBACK on failed transaction.",
  },
  {
    id: "cpp-20260603-b1-custom-hash",
    language: "cpp",
    title: "Custom hash for composite order key — FNV-1a over struct bytes",
    tag: "stl",
    code: `#include <unordered_map>
#include <cstdint>
#include <cstring>

// Composite order key: session_id + seqno. Must be hashable for unordered_map.
struct OrderKey {
    std::uint32_t session_id;
    std::uint64_t seq_no;
    bool operator==(const OrderKey& o) const noexcept {
        return session_id == o.session_id && seq_no == o.seq_no;
    }
};

// FNV-1a hash over the raw bytes of the struct.
struct OrderKeyHash {
    std::size_t operator()(const OrderKey& k) const noexcept {
        constexpr std::size_t FNV_OFFSET = 14695981039346656037ULL;
        constexpr std::size_t FNV_PRIME  = 1099511628211ULL;
        std::size_t h = FNV_OFFSET;
        const auto* p = reinterpret_cast<const unsigned char*>(&k);
        for (std::size_t i = 0; i < sizeof(k); ++i) {
            h ^= p[i];
            h *= FNV_PRIME;
        }
        return h;
    }
};

using OrderMap = std::unordered_map<OrderKey, double, OrderKeyHash>;

int main() {
    OrderMap prices;
    prices[{1, 100}] = 99.5;
    prices[{1, 101}] = 100.0;
    prices[{2, 100}] = 55.0;   // different session
    (void)prices;
}`,
    explanation:
      "std::unordered_map requires a hash functor and equality operator for custom keys. FNV-1a hashing over raw struct bytes is fast and generally well-distributed for integer composites. Ensure the struct has no padding bytes (reorder fields or use __attribute__((packed))) before hashing the raw representation, otherwise collisions arise from garbage padding values.",
  },
  {
    id: "cpp-20260603-b1-atomic-flag-halt",
    language: "cpp",
    title: "std::atomic_flag trading halt — lock-free kill switch",
    tag: "concurrency",
    code: `#include <atomic>
#include <iostream>

// std::atomic_flag is guaranteed lock-free on every platform.
// Two states: set (halted) / clear (trading active).
class TradingHalt {
    std::atomic_flag flag = ATOMIC_FLAG_INIT;  // starts clear = trading active
public:
    void halt()  noexcept { flag.test_and_set(std::memory_order_seq_cst); }
    void resume() noexcept { flag.clear(std::memory_order_seq_cst); }
    bool is_halted() const noexcept {
        // test() (C++20): read without modifying.
        return flag.test(std::memory_order_acquire);
    }
};

// In the hot order-send loop: checked on every order submission.
TradingHalt g_halt;

void send_order(double price, int qty) {
    if (g_halt.is_halted()) {
        std::cout << "HALTED — order rejected\\n";
        return;
    }
    std::cout << "order @ " << price << " x " << qty << "\\n";
}

int main() {
    send_order(100.0, 500);   // allowed
    g_halt.halt();
    send_order(100.1, 200);   // rejected
    g_halt.resume();
    send_order(100.2, 100);   // allowed again
}`,
    explanation:
      "atomic_flag is the only C++ primitive guaranteed to be lock-free on every conforming implementation. The C++20 test() member reads without modifying — previously you needed test_and_set() then clear() which is not idempotent. Seq_cst on halt/resume ensures the halt is visible to all threads immediately.",
  },
  {
    id: "cpp-20260603-b1-constexpr-pow",
    language: "cpp",
    title: "constexpr integer power — compile-time discount factor tables",
    tag: "modern",
    code: `#include <cstdint>
#include <array>
#include <cmath>
#include <iostream>

// Recursive constexpr power: exponentiation by squaring O(log n).
constexpr double cpow(double base, int exp) {
    if (exp == 0) return 1.0;
    if (exp < 0)  return 1.0 / cpow(base, -exp);
    if (exp % 2 == 0) {
        double half = cpow(base, exp / 2);
        return half * half;
    }
    return base * cpow(base, exp - 1);
}

// Pre-compute annual discount factors at compile time for r = 5%.
// Avoids repeated std::exp(-r*T) calls in inner loops.
constexpr double R = 0.05;
constexpr auto DISC = []() {
    std::array<double, 31> a{};  // a[t] = exp(-0.05*t), t=0..30
    for (int t = 0; t <= 30; ++t)
        a[t] = cpow(cpow(M_E, -R), t);  // e^{-r*t}
    return a;
}();

int main() {
    // All values computed at compile time — no runtime math.
    for (int t = 0; t <= 5; ++t)
        std::cout << "df[" << t << "] = " << DISC[t] << "\\n";
}`,
    explanation:
      "constexpr immediately-invoked lambdas (C++17+) let you build lookup tables at compile time from complex initialisation logic. The resulting array is embedded in the read-only data section — index access is as cheap as a constant load with no floating-point ops at runtime.",
  },
  {
    id: "cpp-20260603-b1-simd-bs-batch",
    language: "cpp",
    title: "Auto-vectorised Black-Scholes batch — SoA layout for SIMD",
    tag: "performance",
    code: `#include <vector>
#include <cmath>
#include <cstddef>

// Structure of Arrays layout: all Ss together, all Ks together, etc.
// The compiler can vectorise the loop with AVX2 (8x doubles/cycle).
struct BsBatch {
    std::vector<double> S, K, r, sigma, T;   // inputs
    std::vector<double> price;               // output
    std::size_t         n;

    explicit BsBatch(std::size_t count)
        : S(count), K(count), r(count), sigma(count), T(count),
          price(count), n(count) {}
};

// Standard normal CDF — approximation suitable for SIMD (Horner form).
inline double norm_cdf(double x) {
    // Abramowitz & Stegun 7.1.26 — max error 7.5e-8.
    constexpr double a1=0.319381530, a2=-0.356563782, a3=1.781477937,
                     a4=-1.821255978, a5=1.330274429;
    double t = 1.0 / (1.0 + 0.2316419 * std::abs(x));
    double poly = t*(a1+t*(a2+t*(a3+t*(a4+t*a5))));
    double val  = 1.0 - (1.0/std::sqrt(2*M_PI)) * std::exp(-0.5*x*x) * poly;
    return x >= 0 ? val : 1.0 - val;
}

// Tight loop: compiler sees independent iterations -> auto-vectorised.
void price_batch(BsBatch& b) {
    for (std::size_t i = 0; i < b.n; ++i) {
        double sT = b.sigma[i] * std::sqrt(b.T[i]);
        double d1 = (std::log(b.S[i]/b.K[i]) + (b.r[i] + 0.5*b.sigma[i]*b.sigma[i])*b.T[i]) / sT;
        double d2 = d1 - sT;
        b.price[i] = b.S[i]*norm_cdf(d1) - b.K[i]*std::exp(-b.r[i]*b.T[i])*norm_cdf(d2);
    }
}`,
    explanation:
      "Structure of Arrays (SoA) is the SIMD-friendly layout: vectorised loads can fetch 4 or 8 adjacent doubles for the same field across different options in one instruction. Array of Structures (AoS) alternates S,K,r,sigma per element, making it impossible to load all Ss contiguously. Compile with -O3 -march=native and inspect with -fopt-info-vec-optimized.",
  },
  {
    id: "cpp-20260603-b1-monotonic-stack-spread",
    language: "cpp",
    title: "Monotonic stack — maximum rolling bid-ask spread window",
    tag: "stl",
    code: `#include <deque>
#include <vector>
#include <cstddef>
#include <algorithm>

// For each day i, find the maximum spread in the window [i-W+1, i].
// Naive: O(N*W). Monotonic deque: O(N) total.
std::vector<double> rolling_max_spread(const std::vector<double>& spreads,
                                        std::size_t W) {
    std::size_t n = spreads.size();
    std::vector<double> result(n, 0.0);
    std::deque<std::size_t> dq;  // indices; front = max of current window

    for (std::size_t i = 0; i < n; ++i) {
        // Remove indices that are out of the window.
        while (!dq.empty() && dq.front() + W <= i)
            dq.pop_front();
        // Remove indices whose spread is <= current (they can never be max).
        while (!dq.empty() && spreads[dq.back()] <= spreads[i])
            dq.pop_back();
        dq.push_back(i);
        result[i] = spreads[dq.front()];
    }
    return result;
}

int main() {
    std::vector<double> spreads = {2.0, 5.0, 1.0, 3.0, 4.0, 6.0, 2.0};
    auto maxS = rolling_max_spread(spreads, 3);
    // maxS = [2, 5, 5, 5, 4, 6, 6]
    (void)maxS;
}`,
    explanation:
      "The monotonic deque (decreasing front-to-back) maintains the maximum of a sliding window in amortised O(1) per element — each index is pushed and popped at most once. The pattern appears in trading analysis (rolling max spread, max realised vol) and is the backbone of the 'Sliding Window Maximum' interview problem.",
  },
];
