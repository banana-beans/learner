import type { Snippet } from "./types";

export const cppSnippets20260602B1: Snippet[] = [
  {
    id: "cpp-20260602-b1-concepts",
    language: "cpp",
    title: "C++20 Concepts — constraining numeric pricing functions",
    tag: "templates",
    code: `#include <concepts>
#include <cmath>

// Concept: T must be a floating-point type.
template <typename T>
concept FloatingPoint = std::is_floating_point_v<T>;

// Concept: T supports the arithmetic required for a discount factor.
template <typename T>
concept Discountable = FloatingPoint<T> && requires(T r, T t) {
    { std::exp(-r * t) } -> std::convertible_to<T>;
};

template <Discountable T>
T discount_factor(T r, T t) {
    return std::exp(-r * t);    // e^{-rT}: risk-free discount
}

// Violation caught at compile time with a readable diagnostic.
// discount_factor<int>(5, 1);  // error: int does not satisfy Discountable`,
    explanation:
      "C++20 Concepts replace SFINAE with readable constraints that produce clear compiler errors. In quant libraries you use them to prevent accidentally passing integer ticks where a floating-point rate is expected, catching a whole class of bugs at compile time.",
  },
  {
    id: "cpp-20260602-b1-perfect-forward-factory",
    language: "cpp",
    title: "Perfect forwarding — zero-copy order factory",
    tag: "templates",
    code: `#include <memory>
#include <utility>
#include <cstdint>

struct LimitOrder {
    std::uint64_t id;
    double        price;
    std::uint32_t qty;
    LimitOrder(std::uint64_t i, double p, std::uint32_t q)
        : id(i), price(p), qty(q) {}
};

// Forwards args directly into T's constructor — no temporary, no extra move.
template <typename T, typename... Args>
std::unique_ptr<T> make_order(Args&&... args) {
    return std::make_unique<T>(std::forward<Args>(args)...);
}

int main() {
    auto o = make_order<LimitOrder>(42ULL, 100.25, 500U);
    (void)o;
}`,
    explanation:
      "std::forward<Args>(args)... preserves each argument's value category (lvalue/rvalue) through the forwarding chain, so temporaries are still moved — not copied — into the constructor. This is the universal zero-overhead factory pattern in modern C++.",
  },
  {
    id: "cpp-20260602-b1-sfinae-enable-if",
    language: "cpp",
    title: "SFINAE with enable_if — pre-Concepts type gating",
    tag: "templates",
    code: `#include <type_traits>
#include <cmath>

// enable_if: if the condition is false the overload silently disappears
// from the candidate set — substitution failure is NOT an error.
template <typename T,
          std::enable_if_t<std::is_integral_v<T>, int> = 0>
T tick_round(T value, T tick) {
    return (value / tick) * tick;          // integer division truncates
}

template <typename T,
          std::enable_if_t<std::is_floating_point_v<T>, int> = 0>
T tick_round(T value, T tick) {
    return std::floor(value / tick) * tick;
}

int main() {
    auto a = tick_round(1053L, 5L);    // integral overload -> 1050
    auto b = tick_round(10.53, 0.05); // float overload   -> 10.50
    (void)a; (void)b;
}`,
    explanation:
      "SFINAE predates Concepts but appears throughout every major quant library. The key mental model: when enable_if's condition is false the template disappears rather than producing an error, letting the compiler select another overload. Concepts supersede this in C++20.",
  },
  {
    id: "cpp-20260602-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-size pool allocator — zero heap fragmentation",
    tag: "memory",
    code: `#include <cstddef>
#include <cassert>
#include <array>

// Pre-allocates N slots of type T. alloc/free are O(1) and never
// touch the global heap — critical for deterministic latency.
template <typename T, std::size_t N>
class PoolAllocator {
    union Slot { char storage[sizeof(T)]; Slot* next; };
    std::array<Slot, N> pool;
    Slot* free_list = nullptr;
public:
    PoolAllocator() {
        for (std::size_t i = 0; i + 1 < N; ++i)
            pool[i].next = &pool[i + 1];
        pool[N - 1].next = nullptr;
        free_list = &pool[0];
    }
    T* alloc() {
        assert(free_list && "pool exhausted");
        Slot* s = free_list;
        free_list = s->next;
        return reinterpret_cast<T*>(s->storage);
    }
    void free(T* p) {
        p->~T();                                      // explicit destructor
        auto* s = reinterpret_cast<Slot*>(p);
        s->next = free_list;
        free_list = s;
    }
};`,
    explanation:
      "Pool allocators are the HFT answer to malloc latency spikes: alloc and free touch only a pre-allocated slab and a linked-list pointer, giving O(1) worst-case time with zero fragmentation and excellent cache locality. Typical use: one pool per order type per matching engine thread.",
  },
  {
    id: "cpp-20260602-b1-shared-mutex",
    language: "cpp",
    title: "std::shared_mutex — read-many write-few position book",
    tag: "concurrency",
    code: `#include <shared_mutex>
#include <unordered_map>
#include <string>

// Multiple risk threads can read positions simultaneously;
// position updates from the fill handler are exclusive.
class PositionBook {
    mutable std::shared_mutex mu;
    std::unordered_map<std::string, long long> pos;
public:
    // Shared lock: any number of concurrent readers.
    long long get(const std::string& sym) const {
        std::shared_lock lock(mu);
        auto it = pos.find(sym);
        return it != pos.end() ? it->second : 0LL;
    }
    // Exclusive lock: only one writer at a time.
    void fill(const std::string& sym, long long qty) {
        std::unique_lock lock(mu);
        pos[sym] += qty;
    }
};`,
    explanation:
      "shared_mutex allows unlimited simultaneous readers but serialises writers. Use it when reads dominate (e.g. 100 risk queries per position update). For mostly-write workloads a regular mutex is faster, because acquiring shared_lock itself has overhead from the internal atomic.",
  },
  {
    id: "cpp-20260602-b1-cas-stack",
    language: "cpp",
    title: "Lock-free stack via compare_exchange_weak (Treiber)",
    tag: "concurrency",
    code: `#include <atomic>

// Treiber stack: CAS loop on the head pointer.
// NOTE: subject to ABA — use hazard pointers or epoch reclamation
// in production. This illustrates the CAS retry pattern.
template <typename T>
class LockFreeStack {
    struct Node { T val; Node* next; };
    std::atomic<Node*> head{nullptr};
public:
    void push(T val) {
        auto* n = new Node{std::move(val), nullptr};
        // Load old head, set n->next, CAS; retry on failure.
        n->next = head.load(std::memory_order_relaxed);
        while (!head.compare_exchange_weak(
                    n->next, n,
                    std::memory_order_release,
                    std::memory_order_relaxed)) {}
    }
    bool pop(T& out) {
        Node* top = head.load(std::memory_order_acquire);
        while (top) {
            if (head.compare_exchange_weak(
                    top, top->next,
                    std::memory_order_acquire,
                    std::memory_order_relaxed)) {
                out = std::move(top->val);
                delete top;
                return true;
            }
        }
        return false;
    }
};`,
    explanation:
      "compare_exchange_weak is cheaper than the strong variant on ARM because it may fail spuriously — saving a retry loop inside the CPU. The success memory_order must be at least as strong as the failure order. This load-prepare-CAS-retry pattern is the universal building block for lock-free structures.",
  },
  {
    id: "cpp-20260602-b1-condition-variable",
    language: "cpp",
    title: "std::condition_variable — tick feed producer/consumer",
    tag: "concurrency",
    code: `#include <condition_variable>
#include <mutex>
#include <queue>

struct Tick { double price; std::uint32_t qty; };

class TickChannel {
    std::mutex mu;
    std::condition_variable cv;
    std::queue<Tick> q;
    bool closed = false;
public:
    void publish(Tick t) {
        { std::lock_guard g(mu); q.push(t); }
        cv.notify_one();                // wake one consumer
    }
    void close() {
        { std::lock_guard g(mu); closed = true; }
        cv.notify_all();                // wake all so they drain and exit
    }
    bool consume(Tick& out) {
        std::unique_lock lock(mu);
        // Always use the predicate form — guards against spurious wakeups.
        cv.wait(lock, [&]{ return !q.empty() || closed; });
        if (q.empty()) return false;    // closed and drained
        out = q.front(); q.pop();
        return true;
    }
};`,
    explanation:
      "The two-argument wait(lock, predicate) is mandatory — spurious wakeups are permitted by the standard and happen on Linux. notify_all is only needed for shutdown broadcasts; using it for every publish wastes CPU on contention.",
  },
  {
    id: "cpp-20260602-b1-fixed-point-arith",
    language: "cpp",
    title: "Fixed-point price arithmetic — integer tick representation",
    tag: "quant",
    code: `#include <cstdint>
#include <cmath>
#include <iostream>

// Represent prices as integer multiples of the minimum tick.
// 10000 ticks = $1.0000 (4 decimal places of precision).
constexpr std::int64_t TICK_SCALE = 10'000;

inline std::int64_t to_ticks(double price) {
    return static_cast<std::int64_t>(std::llround(price * TICK_SCALE));
}
inline double from_ticks(std::int64_t ticks) {
    return static_cast<double>(ticks) / TICK_SCALE;
}

int main() {
    std::int64_t bid    = to_ticks(100.25);   // 1002500
    std::int64_t ask    = to_ticks(100.26);   // 1002600
    std::int64_t spread = ask - bid;           // 100 ticks = exactly $0.0100
    std::cout << from_ticks(spread) << "\\n"; // 0.01

    // 0.26 - 0.25 in raw double == 0.00999999... != 0.01: silent failure.
}`,
    explanation:
      "Fixed-point integer arithmetic eliminates floating-point rounding in price comparison and spread calculations. A spread of 1 tick is 100% representable; the same computation in IEEE-754 doubles produces 0.00999999... and comparisons fail silently. All major exchange protocols transmit prices as scaled integers.",
  },
  {
    id: "cpp-20260602-b1-price-ladder-bitmap",
    language: "cpp",
    title: "Price ladder with bitset — O(1) best bid/ask via TZCNT",
    tag: "quant",
    code: `#include <cstdint>
#include <bit>      // C++20: std::countr_zero, std::countl_zero

// Encodes up to 64 active price levels as bits in a 64-bit word.
// Bit i set ⟺ liquidity exists at (base_price + i * tick_size).
struct PriceLadder {
    std::uint64_t asks_mask = 0;   // set bit = active ask level
    std::uint64_t bids_mask = 0;   // set bit = active bid level

    void set_ask(int offset)   { asks_mask |=  (1ULL << offset); }
    void clear_ask(int offset) { asks_mask &= ~(1ULL << offset); }
    void set_bid(int offset)   { bids_mask |=  (1ULL << offset); }
    void clear_bid(int offset) { bids_mask &= ~(1ULL << offset); }

    // Best ask = lowest set bit: maps to single TZCNT instruction.
    int best_ask_offset() const { return std::countr_zero(asks_mask); }

    // Best bid = highest set bit: maps to LZCNT.
    int best_bid_offset() const { return 63 - std::countl_zero(bids_mask); }
};`,
    explanation:
      "NASDAQ and some CME gateways maintain a compact bitmask over active price levels. std::countr_zero compiles to a single TZCNT instruction — O(1) best-price lookup at register speed with zero cache misses. A 64-level window is sufficient for tick-by-tick proximity to mid.",
  },
  {
    id: "cpp-20260602-b1-compile-time-hash",
    language: "cpp",
    title: "Compile-time FNV-1a hash — O(1) symbol dispatch",
    tag: "performance",
    code: `#include <cstdint>
#include <string_view>

constexpr std::uint64_t FNV_OFFSET = 14695981039346656037ULL;
constexpr std::uint64_t FNV_PRIME  = 1099511628211ULL;

constexpr std::uint64_t fnv1a(std::string_view s) {
    std::uint64_t h = FNV_OFFSET;
    for (unsigned char c : s) { h ^= c; h *= FNV_PRIME; }
    return h;
}

// Switch on string at runtime in O(1) with zero heap allocation.
// Case labels are evaluated at compile time.
void route(std::string_view sym) {
    switch (fnv1a(sym)) {
        case fnv1a("AAPL"): /* equity handler */ break;
        case fnv1a("ES"):   /* futures handler */ break;
        case fnv1a("SPY"):  /* ETF handler */     break;
        default:            /* unknown symbol */  break;
    }
}`,
    explanation:
      "constexpr FNV-1a lets you switch on string values without a hash map: the compiler evaluates the case labels at compile time and emits a jump table. In hot routing code this beats an unordered_map lookup by avoiding a heap dereference and the associated cache miss.",
  },
  {
    id: "cpp-20260602-b1-format-log",
    language: "cpp",
    title: "std::format — type-safe structured trade log (C++20)",
    tag: "modern",
    code: `#include <format>
#include <string>
#include <cstdint>

struct Fill {
    std::uint64_t order_id;
    std::string   symbol;
    double        price;
    std::uint32_t qty;
};

std::string format_fill(const Fill& f) {
    // Compile-time format string check; no printf UB on type mismatch.
    return std::format(
        "[FILL] oid={} sym={} px={:.4f} qty={}",
        f.order_id, f.symbol, f.price, f.qty);
}

int main() {
    Fill f{1001, "AAPL", 250.0625, 100};
    auto s = format_fill(f);
    // s == "[FILL] oid=1001 sym=AAPL px=250.0625 qty=100"
    (void)s;
}`,
    explanation:
      "std::format (C++20) combines the type-safety of streams with the brevity of printf, and the format string is validated at compile time — a wrong specifier is a compile error, not silent UB. Replace snprintf and ostringstream in all new C++20 code.",
  },
  {
    id: "cpp-20260602-b1-ranges-sort-project",
    language: "cpp",
    title: "std::ranges::sort with projection — position ranking",
    tag: "stl",
    code: `#include <algorithm>
#include <ranges>
#include <vector>

struct Position {
    std::string symbol;
    double pnl;
    double notional;
};

int main() {
    std::vector<Position> book = {
        {"AAPL",  500.0,  100000.0},
        {"MSFT", -200.0,   50000.0},
        {"GOOG", 1200.0,  250000.0},
    };

    // Sort by P&L descending — projection extracts the key field.
    std::ranges::sort(book, std::greater<>{}, &Position::pnl);

    // Sort by return-on-notional (lambda projection).
    std::ranges::sort(book, std::greater<>{},
        [](const Position& p) { return p.pnl / p.notional; });
}`,
    explanation:
      "Projections separate 'what to sort on' from 'how to compare'. The comparator stays std::greater and the projection extracts the key — this is cleaner than a combined comparator lambda and also works with member-function pointers, enabling self-documenting one-liners.",
  },
  {
    id: "cpp-20260602-b1-rdtsc-timestamp",
    language: "cpp",
    title: "RDTSC hardware counter — nanosecond tick timestamps",
    tag: "performance",
    code: `#include <cstdint>
#include <iostream>

// Reads the CPU timestamp counter. ~3 cycles overhead vs ~30 for
// clock_gettime. x86-only; requires cores to be TSC-synchronised.
inline std::uint64_t rdtsc() {
    std::uint32_t lo, hi;
    __asm__ volatile ("rdtsc" : "=a"(lo), "=d"(hi));
    return (static_cast<std::uint64_t>(hi) << 32) | lo;
}

// Convert raw ticks to nanoseconds (calibrate ghz at startup).
inline double ticks_to_ns(std::uint64_t ticks, double ghz = 3.0) {
    return static_cast<double>(ticks) / ghz;
}

int main() {
    auto t0 = rdtsc();
    volatile double x = 1.0 / 3.0;    // prevent dead-code elimination
    auto t1 = rdtsc();
    std::cout << ticks_to_ns(t1 - t0) << " ns\\n";
    (void)x;
}`,
    explanation:
      "RDTSC is the lowest-overhead timer available — HFT systems use it for per-packet latency histograms and tick-to-trade measurements. Calibrate ticks-per-nanosecond once at startup by comparing RDTSC against clock_gettime(CLOCK_MONOTONIC_RAW). Never use wall-clock APIs inside the hot loop.",
  },
  {
    id: "cpp-20260602-b1-builtin-expect",
    language: "cpp",
    title: "__builtin_expect — branch hints for hot data paths",
    tag: "performance",
    code: `#include <cstddef>
#include <cstdint>

#define LIKELY(x)   __builtin_expect(!!(x), 1)
#define UNLIKELY(x) __builtin_expect(!!(x), 0)

// In a tight market-data loop, the null-guard is taken essentially never.
// UNLIKELY tells the compiler to put the error path out-of-line so the
// common path is a straight-line basic block with no jumps.
void process_message(const std::uint8_t* buf, std::size_t len) {
    if (UNLIKELY(buf == nullptr || len == 0))
        return;                      // cold path: moved out-of-line

    // Hot path: falls through without a branch penalty.
    std::uint8_t msg_type = buf[0];
    (void)msg_type;
}`,
    explanation:
      "Modern CPUs predict branches dynamically, but __builtin_expect still helps the compiler place the cold basic block away from the hot one — improving instruction cache density and avoiding pipeline restarts. Measure with perf stat before sprinkling hints: overuse creates noise.",
  },
  {
    id: "cpp-20260602-b1-struct-packing",
    language: "cpp",
    title: "Struct padding elimination — cache-line density",
    tag: "performance",
    code: `#include <cstdint>
#include <iostream>

// Poorly ordered: 7 bytes of implicit padding inserted after 'side'.
struct OrderBad {
    std::uint8_t  side;           // 1 byte
                                  // [7 bytes padding]
    double        price;          // 8 bytes
    std::uint32_t qty;            // 4 bytes
};                                // sizeof = 24

// Well ordered: largest alignment first, then smaller.
struct OrderGood {
    double        price;          // 8 bytes
    std::uint32_t qty;            // 4 bytes
    std::uint8_t  side;           // 1 byte
                                  // [3 bytes tail padding]
};                                // sizeof = 16

int main() {
    std::cout << sizeof(OrderBad)  << "\\n";  // 24
    std::cout << sizeof(OrderGood) << "\\n";  // 16
    // 33% smaller: fits 4 orders per cache line instead of 2.
}`,
    explanation:
      "Struct field ordering is a zero-cost throughput improvement: sort fields largest-to-smallest alignment to eliminate interior padding. A 33% smaller struct means 33% more orders fit in L1 cache, directly improving throughput in tight matching-engine loops.",
  },
  {
    id: "cpp-20260602-b1-order-id-gen",
    language: "cpp",
    title: "Atomic monotonic order ID generator",
    tag: "quant",
    code: `#include <atomic>
#include <cstdint>

// Thread-safe monotonic counter. fetch_add is a single LOCK XADD on x86.
class OrderIdGen {
    std::atomic<std::uint64_t> counter{0};
public:
    std::uint64_t next() {
        // memory_order_relaxed is sufficient: the counter only needs to be
        // unique and monotone — it doesn't synchronise other memory.
        return counter.fetch_add(1, std::memory_order_relaxed) + 1;
    }
    // Seed from exchange session for reconnect recovery.
    void seed(std::uint64_t base) {
        counter.store(base, std::memory_order_relaxed);
    }
    // Epoch-prefixed ID: high 32 bits = session, low 32 = sequence.
    std::uint64_t next_prefixed(std::uint32_t session) {
        return (static_cast<std::uint64_t>(session) << 32) | next();
    }
};`,
    explanation:
      "fetch_add on x86 compiles to a single LOCK XADD instruction — roughly 10ns under contention versus 100ns+ for a mutex. Epoch-prefixed IDs (session in upper 32 bits) let you distinguish IDs across reconnects without a full reset.",
  },
  {
    id: "cpp-20260602-b1-gauss-hermite",
    language: "cpp",
    title: "Gauss-Hermite quadrature — expected option payoff",
    tag: "quant",
    code: `#include <cmath>
#include <array>

// 5-point Gauss-Hermite abscissae and weights for
//   integral_{-inf}^{+inf} f(x) * exp(-x^2) dx
constexpr std::array<double, 5> GH_X = {-2.020202, -0.958572, 0.0,
                                          0.958572,  2.020202};
constexpr std::array<double, 5> GH_W = { 0.019953,  0.394424, 0.945309,
                                          0.394424,  0.019953};

// European call via quadrature — matches Black-Scholes to 4+ decimal places.
double call_gh(double S, double K, double r, double sigma, double T) {
    double mu   = std::log(S) + (r - 0.5 * sigma * sigma) * T;
    double sig  = sigma * std::sqrt(T);
    double disc = std::exp(-r * T);
    double sum  = 0.0;
    for (std::size_t i = 0; i < 5; ++i) {
        // Transform standard GH node to log-normal space.
        double lnST   = mu + sig * std::sqrt(2.0) * GH_X[i];
        double payoff = std::max(std::exp(lnST) - K, 0.0);
        sum += GH_W[i] * payoff;
    }
    return disc * sum / std::sqrt(M_PI);
}`,
    explanation:
      "Gauss-Hermite quadrature evaluates the expected payoff under a log-normal distribution using just 5 function evaluations versus thousands of Monte Carlo paths. For smooth payoffs (European options) 5 points gives 4-digit accuracy; 20-point rules reach machine precision.",
  },
  {
    id: "cpp-20260602-b1-fd-greeks",
    language: "cpp",
    title: "Finite difference numerical Greeks — model-agnostic bumping",
    tag: "quant",
    code: `#include <functional>
#include <cmath>

using PricerFn = std::function<double(double S, double K, double r,
                                       double sigma, double T)>;
struct Greeks { double delta, gamma, vega, theta, rho; };

// Central differences: O(h^2) accuracy vs O(h) for one-sided bumps.
Greeks finite_diff_greeks(PricerFn f,
                           double S, double K, double r,
                           double sigma, double T) {
    const double hS  = S * 1e-4;
    const double hv  = 1e-4;
    const double hr  = 1e-4;
    const double hT  = 1.0 / 252.0;   // one trading day

    double base = f(S, K, r, sigma, T);
    double fu   = f(S + hS, K, r, sigma, T);
    double fd   = f(S - hS, K, r, sigma, T);
    return {
        (fu - fd) / (2 * hS),                               // delta
        (fu - 2 * base + fd) / (hS * hS),                   // gamma
        (f(S, K, r, sigma + hv, T)
         - f(S, K, r, sigma - hv, T)) / (2 * hv),           // vega
        -(f(S, K, r, sigma, T - hT) - base) / hT,           // theta
        (f(S, K, r + hr, sigma, T)
         - f(S, K, r - hr, sigma, T)) / (2 * hr),           // rho
    };
}`,
    explanation:
      "Numerical Greeks are model-agnostic — they work on any pricer including Monte Carlo and binomial trees. The bump size trades off truncation error (h too large) against cancellation error (h too small). 1e-4 relative spot bump is the industry default for delta/gamma.",
  },
  {
    id: "cpp-20260602-b1-yield-bootstrap",
    language: "cpp",
    title: "Yield curve bootstrapping from par coupon rates",
    tag: "quant",
    code: `#include <vector>
#include <cmath>

// Bootstrap a zero-coupon discount factor curve from annual par coupon rates.
// par_rates[i] = coupon rate (as a fraction) for maturity (i+1) years.
std::vector<double> bootstrap_zero(const std::vector<double>& par_rates) {
    std::vector<double> df;
    df.reserve(par_rates.size());

    for (std::size_t n = 0; n < par_rates.size(); ++n) {
        double c = par_rates[n];      // annual coupon rate
        // Par condition: sum of coupon PVs + final principal PV = 1.
        // sum_{k=0}^{n-1} c * df[k] + (1 + c) * df[n] = 1
        // Solve for df[n] given known df[0..n-1].
        double sum_coupons = 0.0;
        for (std::size_t k = 0; k < n; ++k)
            sum_coupons += c * df[k];
        df.push_back((1.0 - sum_coupons) / (1.0 + c));
    }
    return df;   // df[i] = P(0, i+1): discount from 0 to year i+1
}`,
    explanation:
      "Par-yield bootstrapping is the first step in any interest-rate model: it backs out the zero-coupon discount factors that are consistent with the observed par coupon rates. Each maturity's DF is determined analytically from the par condition, so there is no numerical root-finding needed.",
  },
  {
    id: "cpp-20260602-b1-cds-protection-leg",
    language: "cpp",
    title: "CDS protection leg — piecewise survival probability sum",
    tag: "quant",
    code: `#include <vector>

// Protection leg PV = LGD * integral discount(t) * (-dS(t)) dt
// approximated as a sum over quarterly coupon periods.
double cds_protection_leg(
    const std::vector<double>& times,     // period end times (years)
    const std::vector<double>& discount,  // risk-free discount factors
    const std::vector<double>& survival,  // risk-neutral survival probs
    double lgd = 0.6)                     // loss given default (1 - recovery)
{
    double pv = 0.0;
    double S_prev = 1.0;    // survival probability at t = 0 is 1
    for (std::size_t i = 0; i < times.size(); ++i) {
        double S_curr  = survival[i];
        // Mid-period discount factor approximation.
        double df_mid  = (i == 0) ? discount[i]
                                  : 0.5 * (discount[i - 1] + discount[i]);
        // Contribution = LGD * midpoint_discount * marginal_default_prob
        pv += lgd * df_mid * (S_prev - S_curr);
        S_prev = S_curr;
    }
    return pv;
}`,
    explanation:
      "The CDS protection leg pays LGD at the moment of default. Discretised, each period contributes LGD times the mid-period discount times the marginal default probability (decrease in survival probability). The companion premium leg sums survival-weighted coupons at the period ends.",
  },
  {
    id: "cpp-20260602-b1-barrier-reflection",
    language: "cpp",
    title: "Down-and-out call — reflection principle closed form",
    tag: "quant",
    code: `#include <cmath>
#include <functional>

// Reflection principle: for a continuous GBM path, the probability of
// hitting barrier H from above and ending above K is computed via an
// 'image' struck at H^2 / S.
// DNO call = C(S, K) - (H/S)^(2*mu) * C(H^2/S, K)
// where mu = (r - q)/sigma^2 - 0.5
double dno_call(double S, double K, double H, double r, double q,
                double sigma, double T,
                std::function<double(double,double,double,double,double,double)> bs) {
    if (H >= S) return 0.0;   // already below barrier
    double mu = (r - q) / (sigma * sigma) - 0.5;
    double c1 = bs(S,         K, r, q, sigma, T);
    double c2 = bs(H * H / S, K, r, q, sigma, T);
    return c1 - std::pow(H / S, 2.0 * mu) * c2;
}`,
    explanation:
      "The reflection principle gives a closed-form down-and-out barrier price under constant parameters — no Monte Carlo needed. The image term subtracts the probability mass of paths that would have crossed the barrier, using the symmetry of Brownian motion around the barrier level.",
  },
  {
    id: "cpp-20260602-b1-variadic-portfolio",
    language: "cpp",
    title: "Variadic template + fold — compile-time Greek aggregation",
    tag: "templates",
    code: `#include <tuple>
#include <iostream>

// Aggregate Greeks across a heterogeneous set of position types with
// zero virtual dispatch. Each type only needs .delta() and .gamma().
template <typename... Legs>
struct Portfolio {
    std::tuple<Legs...> legs;
    explicit Portfolio(Legs... ls) : legs(std::move(ls)...) {}

    double total_delta() const {
        return std::apply([](const auto&... l) {
            return (l.delta() + ...);   // unary fold expression
        }, legs);
    }
    double total_gamma() const {
        return std::apply([](const auto&... l) {
            return (l.gamma() + ...);
        }, legs);
    }
};

struct VanillaCall { double delta() const { return 0.50; } double gamma() const { return 0.02; } };
struct DigitalCall { double delta() const { return 0.08; } double gamma() const { return 0.01; } };

int main() {
    Portfolio<VanillaCall, VanillaCall, DigitalCall> book{{}, {}, {}};
    std::cout << book.total_delta() << "\\n";  // 1.08
}`,
    explanation:
      "Variadic templates and fold expressions aggregate across a heterogeneous tuple of leg types with every call inlined by the compiler — no vtable, no heap allocation, no virtual dispatch overhead. The resulting binary is as tight as hand-written repeated addition.",
  },
  {
    id: "cpp-20260602-b1-deque-orderbook",
    language: "cpp",
    title: "std::deque vs vector for price-level insertion",
    tag: "stl",
    code: `#include <deque>
#include <vector>
#include <cstdint>

struct Level { std::int64_t price_ticks; std::uint32_t qty; };

// deque: O(1) push at both ends. Useful when new far-OTM strikes
// arrive at both ends of the option chain simultaneously.
class OptionChain {
    std::deque<Level> strikes;   // ordered low to high
public:
    void add_lower(Level l) { strikes.push_front(l); }  // O(1)
    void add_upper(Level l) { strikes.push_back(l);  }  // O(1)
    Level& at(std::size_t i)  { return strikes[i];   }  // O(1)
};
// Trade-off: deque chunks break contiguity — cache miss on every chunk
// boundary during sequential sweeps. For tight inner loops prefer vector.
// Benchmark both; the crossover is typically at ~1000 levels.`,
    explanation:
      "std::deque gives O(1) at both ends and O(1) random access via chunked indirection, but is not contiguous — sequential iteration is ~2x slower than vector due to pointer chasing between chunks. Prefer deque when insertions at both ends dominate and sweeps are rare.",
  },
  {
    id: "cpp-20260602-b1-pmr-arena",
    language: "cpp",
    title: "pmr::vector with monotonic buffer — per-message arena",
    tag: "memory",
    code: `#include <memory_resource>
#include <vector>
#include <cstddef>

// Each market-data message gets its own arena from a stack buffer.
// ALL allocations are freed in O(1) when the message scope ends —
// no per-element free() calls, no heap fragmentation.
void parse_order_list(const std::byte* raw, std::size_t n_entries) {
    std::byte buf[4096];       // stack storage — no heap at all for small messages
    std::pmr::monotonic_buffer_resource arena(buf, sizeof(buf));

    // All pmr::vector allocations draw from the arena.
    std::pmr::vector<double>        prices(&arena);
    std::pmr::vector<std::uint32_t> qtys(&arena);
    prices.reserve(n_entries);
    qtys.reserve(n_entries);

    // ... parse raw bytes into prices / qtys ...

    // When 'arena' destructs, everything is freed in one shot.
    (void)raw;
}`,
    explanation:
      "pmr (polymorphic memory resource) lets you swap the allocator at runtime without changing the container type. monotonic_buffer_resource is bump-pointer allocation — O(1) alloc, O(1) bulk free — the fastest pattern for short-lived per-message parsing where you know the working set size.",
  },
];
