import { Snippet } from "./types";

export const cppSnippets20260712B1: Snippet[] = [
  {
    id: "cpp-20260712-b1-perfect-forward",
    language: "cpp",
    title: "Perfect Forwarding & Universal References",
    tag: "modern-cpp",
    code: `#include <utility>
#include <string>
#include <vector>

// Universal reference: T&& in a deduced context
// Preserves value category: lvalue → lvalue ref, rvalue → rvalue ref
template<typename T>
void emplace_order(std::vector<T>& container, T&& value) {
    container.push_back(std::forward<T>(value));  // perfect forward
}

// Factory: forward constructor args without extra copies
template<typename T, typename... Args>
T make_order(Args&&... args) {
    return T(std::forward<Args>(args)...);  // pack expand with forward
}

struct Order {
    std::string symbol;
    double price;
    int qty;
    Order(std::string s, double p, int q) : symbol(std::move(s)), price(p), qty(q) {}
};

void demo() {
    std::vector<Order> book;
    book.reserve(1024);

    std::string sym = "AAPL";
    // lvalue: sym is copied into symbol; price/qty are copied
    emplace_order(book, make_order<Order>(sym, 182.5, 100));
    // rvalue: std::move(sym) avoids copy of the string
    emplace_order(book, make_order<Order>(std::move(sym), 183.0, 200));
}`,
    explanation:
      "std::forward<T> casts the argument back to its original value category — lvalue stays lvalue ref, rvalue becomes rvalue ref. Without forwarding, named rvalue references decay to lvalues inside the function, silently turning moves into copies. In hot paths (order construction, message parsing) this matters: unnecessary string copies dominate cache pressure.",
  },
  {
    id: "cpp-20260712-b1-sfinae-numeric",
    language: "cpp",
    title: "SFINAE enable_if for Numeric Type Constraints",
    tag: "modern-cpp",
    code: `#include <type_traits>
#include <cmath>

// Only instantiate for floating-point types (SFINAE via enable_if)
template<typename T, typename = std::enable_if_t<std::is_floating_point_v<T>>>
T black_scholes_d1(T S, T K, T r, T sigma, T T_exp) {
    return (std::log(S / K) + (r + T(0.5) * sigma * sigma) * T_exp)
           / (sigma * std::sqrt(T_exp));
}

// Overload: integral types → rejected by SFINAE (no ambiguity)
template<typename T>
std::enable_if_t<std::is_integral_v<T>, double>
to_price(T ticks, double tick_size) {
    return ticks * tick_size;
}

// Void_t technique: detect if type has .price member
template<typename T, typename = void>
struct has_price : std::false_type {};

template<typename T>
struct has_price<T, std::void_t<decltype(std::declval<T>().price)>>
    : std::true_type {};

struct Quote { double bid, ask, price; };
struct RawTick { int timestamp; };

static_assert(has_price<Quote>::value,    "Quote must have price");
static_assert(!has_price<RawTick>::value, "RawTick has no price");`,
    explanation:
      "SFINAE (Substitution Failure Is Not An Error) removes template overloads from the candidate set when enable_if conditions fail, avoiding hard errors. enable_if_t<cond, T> resolves to T when cond is true, otherwise substitution fails silently. The void_t pattern detects the presence of members at compile time — used to dispatch to specialised paths for enriched vs raw market data types without virtual dispatch overhead.",
  },
  {
    id: "cpp-20260712-b1-concepts",
    language: "cpp",
    title: "C++20 Concepts for Quant Numeric Constraints",
    tag: "modern-cpp",
    code: `#include <concepts>
#include <cmath>
#include <type_traits>

// Named concept: anything that behaves like a real number
template<typename T>
concept RealNumber = std::is_arithmetic_v<T> && !std::is_same_v<T, bool>;

// Refined concept: floating-point for derivatives pricing
template<typename T>
concept FloatLike = std::floating_point<T>;

// Concept-constrained function — cleaner than enable_if
template<FloatLike T>
T norm_cdf_approx(T x) {
    // Abramowitz & Stegun rational approximation
    T a1=0.319381530, a2=-0.356563782, a3=1.781477937,
      a4=-1.821255978, a5=1.330274429;
    T t = T(1) / (T(1) + T(0.2316419) * std::abs(x));
    T poly = t*(a1+t*(a2+t*(a3+t*(a4+t*a5))));
    T val  = T(1) - (T(1)/std::sqrt(T(2)*T(3.14159265358979))) *
             std::exp(-T(0.5)*x*x) * poly;
    return x >= 0 ? val : T(1) - val;
}

// Concept for order-book entries: must have bid, ask, qty
template<typename T>
concept QuoteEntry = requires(T t) {
    { t.bid }  -> std::convertible_to<double>;
    { t.ask }  -> std::convertible_to<double>;
    { t.qty }  -> std::convertible_to<int>;
};

template<QuoteEntry Q>
double midpoint(const Q& q) { return (q.bid + q.ask) / 2.0; }`,
    explanation:
      "C++20 concepts replace SFINAE with readable, composable constraints. concept requires a boolean expression on a template parameter; requires-expressions test syntactic and semantic validity inline. The compiler produces clear diagnostics when constraints are violated rather than deep SFINAE substitution errors. For HFT code, concepts also enable constrained auto parameters and abbreviated function templates without losing zero-overhead abstraction.",
  },
  {
    id: "cpp-20260712-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-Size Pool Allocator for Orders",
    tag: "low-latency",
    code: `#include <cstddef>
#include <cassert>
#include <array>

// Fixed-size object pool: O(1) alloc/free, no fragmentation, no system calls
template<typename T, size_t Capacity>
class PoolAllocator {
    union Slot {
        alignas(T) std::byte data[sizeof(T)];
        Slot* next;   // free list pointer when unallocated
    };

    std::array<Slot, Capacity> pool_;
    Slot* free_head_ = nullptr;
    size_t allocated_ = 0;

public:
    PoolAllocator() {
        // Link all slots into the free list
        for (size_t i = 0; i < Capacity - 1; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[Capacity - 1].next = nullptr;
        free_head_ = &pool_[0];
    }

    T* allocate() {
        assert(free_head_ && "pool exhausted");
        Slot* slot = free_head_;
        free_head_ = slot->next;
        ++allocated_;
        return reinterpret_cast<T*>(slot->data);
    }

    void deallocate(T* p) {
        auto* slot = reinterpret_cast<Slot*>(p);
        slot->next = free_head_;
        free_head_ = slot;
        --allocated_;
    }

    size_t size() const { return allocated_; }
};

struct Order { uint64_t id; double price; int qty; };
static PoolAllocator<Order, 65536> g_order_pool;`,
    explanation:
      "A pool allocator pre-allocates a fixed slab and manages free objects via an embedded intrusive free list. Allocation and deallocation are O(1) pointer updates — no mutex, no system call, no fragmentation. The union-based layout avoids UB while keeping the free-list pointer inside the slot memory. In trading systems, order objects have bounded lifetimes and a known max count, making pools far superior to malloc for latency stability.",
  },
  {
    id: "cpp-20260712-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive Doubly-Linked Order Book List",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cassert>

// Intrusive list: the node is embedded in the object itself
// No heap allocation for linking — O(1) insert/remove with known pointer
struct OrderNode {
    OrderNode* prev = nullptr;
    OrderNode* next = nullptr;
    uint64_t   id;
    double     price;
    uint32_t   qty;
};

struct PriceLevel {
    OrderNode* head = nullptr;
    OrderNode* tail = nullptr;
    uint32_t   count = 0;
    double     total_qty = 0;

    // O(1) append to tail
    void push_back(OrderNode* n) {
        n->prev = tail; n->next = nullptr;
        if (tail) tail->next = n; else head = n;
        tail = n;
        ++count;
        total_qty += n->qty;
    }

    // O(1) removal given the node pointer (from cancel/fill)
    void remove(OrderNode* n) {
        if (n->prev) n->prev->next = n->next;
        else         head = n->next;
        if (n->next) n->next->prev = n->prev;
        else         tail = n->prev;
        n->prev = n->next = nullptr;
        --count;
        total_qty -= n->qty;
    }

    // O(1) front dequeue (first fill)
    OrderNode* pop_front() {
        assert(head);
        OrderNode* n = head;
        remove(n);
        return n;
    }
};`,
    explanation:
      "Intrusive lists embed prev/next pointers inside the node rather than in a wrapper. This eliminates a separate heap allocation per link and improves cache locality — the order data and its queue position are in the same cache line. Cancel/fill operations are O(1) given the order pointer, which the order map provides. This is the standard structure for FIFO price-time priority queues in exchange matching engines.",
  },
  {
    id: "cpp-20260712-b1-mpsc-queue",
    language: "cpp",
    title: "Lock-Free MPSC Ring Queue",
    tag: "low-latency",
    code: `#include <atomic>
#include <array>
#include <cstdint>
#include <optional>

// Multi-producer single-consumer (MPSC) ring queue
// Producers use CAS; single consumer reads without locks
template<typename T, size_t N>
class MPSCQueue {
    static_assert((N & (N-1)) == 0, "N must be power of 2");
    static constexpr size_t MASK = N - 1;

    struct Cell {
        std::atomic<size_t> sequence;
        T data;
    };

    alignas(64) std::array<Cell, N> buf_;
    alignas(64) std::atomic<size_t> head_{0};   // producers claim slots here
    alignas(64) size_t tail_{0};                 // consumer reads here (no atomic needed)

public:
    MPSCQueue() {
        for (size_t i = 0; i < N; ++i)
            buf_[i].sequence.store(i, std::memory_order_relaxed);
    }

    bool push(T val) {
        size_t pos = head_.fetch_add(1, std::memory_order_relaxed);
        Cell& cell = buf_[pos & MASK];
        // Spin until slot is free (sequence == pos)
        while (cell.sequence.load(std::memory_order_acquire) != pos) { /* spin */ }
        cell.data = std::move(val);
        cell.sequence.store(pos + 1, std::memory_order_release);
        return true;
    }

    std::optional<T> pop() {
        Cell& cell = buf_[tail_ & MASK];
        if (cell.sequence.load(std::memory_order_acquire) != tail_ + 1)
            return std::nullopt;   // empty
        T val = std::move(cell.data);
        cell.sequence.store(tail_ + N, std::memory_order_release);
        ++tail_;
        return val;
    }
};`,
    explanation:
      "MPSC queues allow multiple threads to enqueue simultaneously while a single thread dequeues without locks. Each cell carries a sequence number: producers CAS the head counter to claim a slot, then write data and publish by setting sequence = pos+1. The consumer reads only when sequence = tail+1, avoiding any atomic on the read side. Cache-line padding on head/tail prevents false sharing. Suitable for routing tick events from multiple feed threads to a single strategy thread.",
  },
  {
    id: "cpp-20260712-b1-fix-parser",
    language: "cpp",
    title: "FIX Protocol Tag-Value Message Parser",
    tag: "low-latency",
    code: `#include <string_view>
#include <charconv>
#include <cstdint>
#include <array>
#include <optional>

// FIX wire format: 8=FIX.4.2\x0135=D\x01... (SOH=0x01 delimiter)
struct FixMessage {
    std::string_view raw;

    // Find tag value in O(n) — use for infrequent fields; cache hot ones
    std::string_view get(int tag) const {
        char needle[16];
        int n = std::snprintf(needle, sizeof(needle), "\x01%d=", tag);
        auto pos = raw.find(std::string_view(needle, n));
        if (pos == std::string_view::npos) return {};
        pos += n;
        auto end = raw.find('\x01', pos);
        return raw.substr(pos, end == std::string_view::npos ? end : end - pos);
    }

    // Fast typed accessors
    std::optional<double> get_double(int tag) const {
        auto sv = get(tag);
        if (sv.empty()) return std::nullopt;
        double v{};
        auto [ptr, ec] = std::from_chars(sv.begin(), sv.end(), v);
        if (ec != std::errc{}) return std::nullopt;
        return v;
    }

    std::optional<int64_t> get_int(int tag) const {
        auto sv = get(tag);
        if (sv.empty()) return std::nullopt;
        int64_t v{};
        auto [ptr, ec] = std::from_chars(sv.begin(), sv.end(), v);
        if (ec != std::errc{}) return std::nullopt;
        return v;
    }
};

// FIX tag constants
namespace Tag {
    constexpr int MsgType  = 35;  // D=NewOrder, F=Cancel, 8=ExecutionReport
    constexpr int Symbol   = 55;
    constexpr int Price    = 44;
    constexpr int OrderQty = 38;
    constexpr int Side     = 54;  // 1=Buy, 2=Sell
    constexpr int ClOrdID  = 11;
}`,
    explanation:
      "FIX protocol uses tag=value\\x01 framing — the parser is a string search problem. Returning string_view avoids allocation; std::from_chars is locale-independent and faster than strtod/atoi for numeric fields. For production, hot tags (price, qty, side) should be located by a pre-built tag-offset index to avoid re-scanning. The FIX 5.0/FIXT transport layer uses binary FAST encoding to reduce wire size further.",
  },
  {
    id: "cpp-20260712-b1-prefetch",
    language: "cpp",
    title: "Manual Prefetch for Tick Data Streaming",
    tag: "low-latency",
    code: `#include <immintrin.h>
#include <cstddef>
#include <vector>

struct TickRecord {
    int64_t ts_ns;
    double  bid, ask;
    int32_t bid_sz, ask_sz;
    int32_t padding;  // align to 32 bytes
};

// Process ticks with software prefetch N records ahead
// _MM_HINT_T0: bring into L1 + L2 + L3
// _MM_HINT_T1: bring into L2 + L3 (less aggressive)
void process_ticks_prefetch(const std::vector<TickRecord>& ticks,
                             double* out_mids, int prefetch_dist = 16) {
    const int n = static_cast<int>(ticks.size());
    for (int i = 0; i < n; ++i) {
        // Prefetch future record while processing current
        if (i + prefetch_dist < n)
            _mm_prefetch(reinterpret_cast<const char*>(&ticks[i + prefetch_dist]),
                         _MM_HINT_T0);

        out_mids[i] = (ticks[i].bid + ticks[i].ask) * 0.5;
    }
}

// Software prefetch for non-sequential access (e.g. hash table probe)
template<typename T>
inline void prefetch_read(const T* ptr) {
    _mm_prefetch(reinterpret_cast<const char*>(ptr), _MM_HINT_T0);
}

template<typename T>
inline void prefetch_write(T* ptr) {
    _mm_prefetch(reinterpret_cast<const char*>(ptr), _MM_HINT_T0);
}`,
    explanation:
      "L1 cache miss costs ~100 cycles; a software prefetch 16+ cache lines ahead hides the latency by issuing the memory request early. _MM_HINT_T0 prefetches into all cache levels; _MM_HINT_T1 skips L1 (useful for streaming data you only read once). The optimal prefetch distance depends on memory bandwidth and loop body complexity — too close = no benefit, too far = cache pollution. Batch tick processing with sequential access is one of the few cases where prefetch yields consistent 20–40% throughput improvements.",
  },
  {
    id: "cpp-20260712-b1-builtin-expect",
    language: "cpp",
    title: "Branch Prediction Hints with __builtin_expect",
    tag: "low-latency",
    code: `#include <cstdint>
#include <stdexcept>

// Hint: cond is usually true (likely) or false (unlikely)
#define LIKELY(cond)   __builtin_expect(!!(cond), 1)
#define UNLIKELY(cond) __builtin_expect(!!(cond), 0)

// Order validation: 99.9% of orders are valid
bool validate_and_submit(double price, int qty, double max_notional) {
    if (UNLIKELY(price <= 0.0 || qty <= 0)) {
        // Cold path: error handling code moved by compiler to end of function
        return false;
    }
    if (UNLIKELY(price * qty > max_notional)) {
        return false;
    }
    // Hot path: normal order processing
    // Compiler places this code immediately after the branch (no jump)
    return true;
}

// Order book lookup: level almost always exists
struct Level { double price; int qty; };

int get_qty_at_level(const Level* levels, int n, double target_price) {
    for (int i = 0; i < n; ++i) {
        if (LIKELY(levels[i].price != target_price)) continue;
        return levels[i].qty;
    }
    return 0;
}

// C++20 alternative: [[likely]] / [[unlikely]] attributes
void process(int msg_type) {
    if (msg_type == 0) [[likely]] {
        // Normal execution report — compiler optimises jump layout
    } else [[unlikely]] {
        // Rare heartbeat / session-level message
    }
}`,
    explanation:
      "__builtin_expect tells the compiler which branch is taken more often, allowing it to lay out the hot path without a conditional jump (fall-through is faster than taken branch on modern CPUs). The C++20 [[likely]]/[[unlikely]] attributes are the portable standard version. In tight inner loops processing 10M+ ticks/sec, eliminating mispredicted branches can save 5–15 ns per event.",
  },
  {
    id: "cpp-20260712-b1-fixed-point-price",
    language: "cpp",
    title: "Fixed-Point Price Arithmetic (Tick-Size Safe)",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cmath>
#include <stdexcept>

// Store prices as integer ticks to avoid floating-point rounding errors
// E.g. tick_size=0.01: price 182.55 stored as 18255
struct FixedPrice {
    int64_t ticks;
    static constexpr int64_t SCALE = 10000;   // 4 decimal places

    static FixedPrice from_double(double d) {
        return FixedPrice{ static_cast<int64_t>(std::round(d * SCALE)) };
    }

    double to_double() const { return static_cast<double>(ticks) / SCALE; }

    FixedPrice operator+(const FixedPrice& o) const { return {ticks + o.ticks}; }
    FixedPrice operator-(const FixedPrice& o) const { return {ticks - o.ticks}; }
    bool operator<(const FixedPrice& o)  const { return ticks < o.ticks; }
    bool operator==(const FixedPrice& o) const { return ticks == o.ticks; }

    // Round to nearest N ticks (e.g. round to tick size of 0.05 → 500 ticks)
    FixedPrice round_to(int64_t tick_multiple) const {
        int64_t rem = ticks % tick_multiple;
        int64_t base = ticks - rem;
        return { rem >= tick_multiple / 2 ? base + tick_multiple : base };
    }
};

// Notional: avoids double overflow for large qty × price
int64_t notional_ticks(FixedPrice price, int32_t qty) {
    return price.ticks * qty;   // stays integer — no float error
}`,
    explanation:
      "Floating-point prices accumulate rounding errors across arithmetic operations; 0.1 + 0.2 ≠ 0.3 in IEEE 754. Fixed-point stores prices as integers scaled by a power of 10, making comparison, hashing, and aggregation exact. The exchange always specifies a minimum tick size — storing multiples of that tick eliminates spurious price levels. Avoid converting back to double until display; all internal matching should operate on integer ticks.",
  },
  {
    id: "cpp-20260712-b1-lookback-option",
    language: "cpp",
    title: "Floating-Strike Lookback Call (Analytic Formula)",
    tag: "derivatives",
    code: `#include <cmath>

double norm_cdf(double x);
double norm_pdf(double x);

// Floating-strike lookback call: payoff = S_T - S_min
// Conze & Viswanathan (1991) closed-form formula
struct LookbackResult { double price, delta, gamma; };

LookbackResult lookback_float_call(
    double S,     // current spot
    double S_min, // running minimum so far (= S at inception)
    double r,     double q,
    double sigma, double T)
{
    double sqT   = std::sqrt(T);
    double sig2  = sigma * sigma;
    double b     = r - q;  // cost of carry

    double a1 = (std::log(S / S_min) + (b + 0.5*sig2)*T) / (sigma*sqT);
    double a2 = a1 - sigma * sqT;
    double a3 = (std::log(S / S_min) + (-b + 0.5*sig2)*T) / (sigma*sqT);

    double disc_q = std::exp(-q * T);
    double disc_r = std::exp(-r * T);

    double C = S * disc_q * norm_cdf(a1)
             - S_min * disc_r * norm_cdf(a2)
             + S * disc_r * (sig2 / (2*b))
               * (-std::pow(S/S_min, -2*b/sig2) * norm_cdf(a3)
                  + std::exp(b*T) * disc_q * norm_cdf(a1 - 2*b*sqT/sigma));

    double delta = disc_q * norm_cdf(a1)
                 + disc_r * (sig2/(2*b)) * (-std::pow(S/S_min,-2*b/sig2)*norm_cdf(a3)
                             + std::exp(b*T)*disc_q*norm_cdf(a1 - 2*b*sqT/sigma));
    return {C, delta, 0.0};  // gamma requires second derivative
}`,
    explanation:
      "A floating-strike lookback call delivers the difference between the terminal price and the realised minimum over [0,T]. The analytic formula requires the running minimum S_min as a state variable; at inception S_min=S. The price is always ≥ the equivalent vanilla call since the payoff is at least as good. Lookbacks are expensive (high theta) but provide perfect hindsight — used in structured products and for benchmarking path-dependent MC engines.",
  },
  {
    id: "cpp-20260712-b1-asian-mc",
    language: "cpp",
    title: "Arithmetic Asian Option MC Pricer",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <vector>

// Arithmetic Asian call: payoff = max(A_T - K, 0)
// A_T = (1/N) * sum S_{t_i}  (discrete average over N fixing dates)
// No closed form — Monte Carlo is standard

double asian_call_mc(
    double S0, double K, double r, double sigma, double T,
    int N_avg = 252,       // number of averaging dates
    int M = 200'000,       // paths
    unsigned seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> dZ;
    double dt    = T / N_avg;
    double disc  = std::exp(-r * T);
    double mu_dt = (r - 0.5*sigma*sigma) * dt;
    double sig_sqdt = sigma * std::sqrt(dt);
    double sum = 0.0;

    for (int m = 0; m < M; ++m) {
        double S = S0, avg = 0.0;
        for (int n = 0; n < N_avg; ++n) {
            S *= std::exp(mu_dt + sig_sqdt * dZ(rng));
            avg += S;
        }
        avg /= N_avg;
        sum += std::max(avg - K, 0.0);
    }
    return disc * sum / M;
}

// Control variate: geometric Asian has a closed form
double geometric_asian_call(double S0, double K, double r, double sigma, double T, int N);

double asian_call_cv(double S0, double K, double r, double sigma, double T,
                     int N=252, int M=200'000) {
    // Use geometric Asian as control; same parameters → high correlation
    double cg_exact = geometric_asian_call(S0, K, r, sigma, T, N);
    // Compute both estimates on same paths, then apply regression correction
    return cg_exact; // placeholder — full impl requires pair tracking
}`,
    explanation:
      "Arithmetic Asian options average the spot price over fixing dates. No closed form exists for arithmetic averages under GBM, so MC is standard. The geometric Asian (product of prices) does have a closed form and is highly correlated — using it as a control variate reduces MC variance by 90%+, achieving the same accuracy with 100× fewer paths. Asians are cheaper than vanillas (averaging dampens vol) and common in commodity and FX markets.",
  },
  {
    id: "cpp-20260712-b1-barrier-option",
    language: "cpp",
    title: "Down-and-Out Barrier Call Analytic Formula",
    tag: "derivatives",
    code: `#include <cmath>

double norm_cdf(double x);

// Closed-form down-and-out call: knocked out if S ever touches H < S0
// Source: Reiner & Rubinstein (1991)
double down_and_out_call(
    double S,     // spot
    double K,     // strike
    double H,     // barrier (H < K for standard DOC)
    double r, double q, double sigma, double T,
    double rebate = 0.0)
{
    if (S <= H) return rebate * std::exp(-r*T);  // already knocked out

    double sqT = std::sqrt(T);
    double b   = r - q;
    double mu  = (b - 0.5*sigma*sigma) / (sigma*sigma);
    double lam = std::sqrt(mu*mu + 2*r/(sigma*sigma));

    auto d = [&](double x, double t) {
        return (std::log(x) + (b + 0.5*sigma*sigma)*t) / (sigma*std::sqrt(t));
    };

    double d1 = d(S/K, T);
    double d2 = d1 - sigma*sqT;
    double d3 = d(S/H, T);
    double d4 = d3 - sigma*sqT;
    double d5 = d(H*H/(S*K), T);
    double d6 = d5 - sigma*sqT;

    double A  =  S*std::exp((b-r)*T)*norm_cdf(d1) - K*std::exp(-r*T)*norm_cdf(d2);
    double C  = (S*std::exp((b-r)*T)*std::pow(H/S,2*(mu+1))*norm_cdf(-d5)
                -K*std::exp(-r*T)*std::pow(H/S,2*mu)*norm_cdf(-d6));
    return A - C;
}`,
    explanation:
      "Barrier options are path-dependent: a down-and-out call expires worthless if the spot ever hits the lower barrier H. The closed-form uses image solutions — the reflection principle gives the probability of the path staying above H. When H < K (common for DOC), the barrier is not in-the-money, so the knock-out has a limited effect on the price. Barrier options trade significantly cheaper than vanillas and are used for hedging with defined exit points.",
  },
  {
    id: "cpp-20260712-b1-greeks-fd",
    language: "cpp",
    title: "Greeks via Central Finite Differences",
    tag: "derivatives",
    code: `#include <functional>
#include <cmath>

using Pricer = std::function<double(double S, double sigma, double r, double T)>;

struct Greeks {
    double delta, gamma, vega, theta, rho;
};

Greeks compute_greeks_fd(Pricer f,
    double S, double sigma, double r, double T,
    double dS    = 0.01,   // 1 cent bump
    double dSig  = 0.001,  // 10bps bump
    double dR    = 0.0001, // 1bp bump
    double dT    = 1.0/252 // 1 trading day)
{
    double V0 = f(S, sigma, r, T);

    // Delta: dV/dS (central difference, 2nd order accurate)
    double delta = (f(S+dS, sigma, r, T) - f(S-dS, sigma, r, T)) / (2*dS);

    // Gamma: d²V/dS² (central difference)
    double gamma = (f(S+dS, sigma, r, T) - 2*V0 + f(S-dS, sigma, r, T)) / (dS*dS);

    // Vega: dV/d_sigma (per 1% vol move → divide by 100 for convention)
    double vega  = (f(S, sigma+dSig, r, T) - f(S, sigma-dSig, r, T)) / (2*dSig) / 100.0;

    // Theta: -dV/dT (negative: option loses value as T shrinks)
    double theta = -(f(S, sigma, r, T-dT) - V0) / dT / 365.0;  // per calendar day

    // Rho: dV/dr (per 1bp move)
    double rho   = (f(S, sigma, r+dR, T) - f(S, sigma, r-dR, T)) / (2*dR) / 10000.0;

    return {delta, gamma, vega, theta, rho};
}`,
    explanation:
      "Finite differences bump-and-reprice the model for each Greek. Central differences (bump by ±h) achieve O(h²) accuracy vs O(h) for one-sided differences, at the cost of 2 extra pricing calls. For analytic models (Black-Scholes) use closed-form Greeks; for complex models (Heston, LV, SV) or exotics where analytics don't exist, finite differences are standard. The bump size dh is chosen to balance truncation error (large h) and round-off error (small h).",
  },
  {
    id: "cpp-20260712-b1-crtp",
    language: "cpp",
    title: "CRTP for Zero-Overhead Static Polymorphism",
    tag: "modern-cpp",
    code: `#include <cstdint>
#include <iostream>

// CRTP: base class parameterised on derived — static dispatch, no vtable
template<typename Derived>
struct OrderRouter {
    void route(uint64_t order_id, double price, int qty) {
        // Static dispatch: resolved at compile time, no virtual call overhead
        static_cast<Derived*>(this)->send_impl(order_id, price, qty);
    }

    // Default implementation (can be overridden)
    void on_ack(uint64_t order_id) {
        static_cast<Derived*>(this)->on_ack_impl(order_id);
    }

protected:
    void on_ack_impl(uint64_t id) { /* default: log only */ }
};

// Concrete router A: NYSE gateway
struct NYSERouter : OrderRouter<NYSERouter> {
    void send_impl(uint64_t id, double px, int qty) {
        // NYSE-specific framing
    }
    void on_ack_impl(uint64_t id) {
        // NYSE-specific ack handling
    }
};

// Concrete router B: NASDAQ gateway
struct NASDAQRouter : OrderRouter<NASDAQRouter> {
    void send_impl(uint64_t id, double px, int qty) {
        // NASDAQ OUCH protocol
    }
    // on_ack_impl not overridden: uses base default
};

// Template function works with any router — inlined at call site
template<typename R>
void submit_best_quote(R& router, uint64_t id) {
    router.route(id, 182.50, 100);
}`,
    explanation:
      "CRTP achieves polymorphism without virtual dispatch: the base calls static_cast<Derived*>(this)->impl(), which the compiler resolves at compile time and can inline. Vtable dispatch costs ~5 ns + icache miss; CRTP costs 0 ns (direct call). The pattern is common in HFT for protocol adapters, instrument-specific pricing models, and risk calculators where the concrete type is always known at compile time.",
  },
  {
    id: "cpp-20260712-b1-variant-dispatch",
    language: "cpp",
    title: "std::variant Message Bus with std::visit",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string>
#include <cstdint>
#include <functional>

// Strongly-typed union: only one valid state at a time
struct NewOrderMsg  { uint64_t id; double price; int qty; char side; };
struct CancelMsg    { uint64_t order_id; };
struct ExecReport   { uint64_t order_id; double fill_price; int fill_qty; };
struct BookSnapshot { double bids[5]; double asks[5]; int bid_sz[5]; int ask_sz[5]; };

using Message = std::variant<NewOrderMsg, CancelMsg, ExecReport, BookSnapshot>;

// Visitor: exhaustive match — compiler error if a type is missing
struct MessageHandler {
    void operator()(const NewOrderMsg& m) const {
        // route to exchange
    }
    void operator()(const CancelMsg& m) const {
        // find in live orders
    }
    void operator()(const ExecReport& m) const {
        // update position
    }
    void operator()(const BookSnapshot& m) const {
        // update order book state
    }
};

void dispatch(const Message& msg) {
    // std::visit selects the matching overload — O(1) dispatch
    std::visit(MessageHandler{}, msg);
}

// Generic lambda visitor (C++17 overload trick)
template<class... Ts> struct overload : Ts... { using Ts::operator()...; };
template<class... Ts> overload(Ts...) -> overload<Ts...>;

void dispatch_lambda(const Message& msg) {
    std::visit(overload{
        [](const NewOrderMsg& m)  { /* new order */ },
        [](const CancelMsg& m)    { /* cancel */ },
        [](const ExecReport& m)   { /* fill */ },
        [](const BookSnapshot& m) { /* book */ },
    }, msg);
}`,
    explanation:
      "std::variant is a type-safe tagged union; std::visit dispatches to the correct overload at runtime using an internally-generated jump table. Unlike inheritance + virtual, variant avoids heap allocation, and the compiler enforces exhaustive handling. The overload deduction guide pattern bundles lambdas into a single visitor inline. For message buses with a fixed type set (FIX message types, order events), variant + visit is faster and safer than polymorphic base classes.",
  },
  {
    id: "cpp-20260712-b1-ranges-pipeline",
    language: "cpp",
    title: "C++20 Ranges Pipeline for Order Filtering",
    tag: "modern-cpp",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <numeric>
#include <cstdint>

struct Order { uint64_t id; double price; int qty; char side; bool live; };

// Ranges pipeline: filter → transform → accumulate (lazy, zero-copy)
double compute_buy_notional(const std::vector<Order>& orders, double above_price) {
    auto notionals =
        orders
        | std::views::filter([](const Order& o) { return o.side == 'B' && o.live; })
        | std::views::filter([=](const Order& o) { return o.price > above_price; })
        | std::views::transform([](const Order& o) { return o.price * o.qty; });

    return std::ranges::fold_left(notionals, 0.0, std::plus<>{});
}

// Sorted view without modifying original
std::vector<Order*> top_n_by_price(std::vector<Order>& orders, int n) {
    std::vector<Order*> ptrs;
    ptrs.reserve(orders.size());
    for (auto& o : orders) ptrs.push_back(&o);

    // Partial sort: only O(N log n) instead of O(N log N)
    std::ranges::partial_sort(ptrs, ptrs.begin() + n, ptrs.end(),
        [](const Order* a, const Order* b) { return a->price > b->price; });
    ptrs.resize(n);
    return ptrs;
}

// Generate a range of evenly spaced strike prices
auto strike_grid(double low, double high, double step) {
    return std::views::iota(0)
        | std::views::take(static_cast<int>((high - low) / step) + 1)
        | std::views::transform([=](int i) { return low + i * step; });
}`,
    explanation:
      "C++20 ranges are lazy composable views over sequences — filter and transform don't allocate intermediate containers. The pipeline is evaluated element-by-element in a single pass: better cache efficiency than creating intermediate vectors. std::ranges::partial_sort is O(N log k) for the top-k selection problem. The views::iota + transform pattern generates arithmetic sequences lazily — useful for option strike grids and time grids in finite-difference pricers.",
  },
  {
    id: "cpp-20260712-b1-coroutine-ticks",
    language: "cpp",
    title: "C++20 Coroutine Generator for Tick Stream",
    tag: "modern-cpp",
    code: `#include <coroutine>
#include <optional>
#include <vector>
#include <cstdint>

struct Tick { int64_t ts_ns; double bid, ask; };

// Minimal generator coroutine (C++23 std::generator not yet widely available)
template<typename T>
struct Generator {
    struct promise_type {
        T current_value;
        auto get_return_object() { return Generator{Handle::from_promise(*this)}; }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        std::suspend_always yield_value(T v) { current_value = v; return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };
    using Handle = std::coroutine_handle<promise_type>;
    Handle coro;
    explicit Generator(Handle h) : coro(h) {}
    ~Generator() { if (coro) coro.destroy(); }
    Generator(const Generator&) = delete;

    std::optional<T> next() {
        if (!coro || coro.done()) return std::nullopt;
        coro.resume();
        if (coro.done()) return std::nullopt;
        return coro.promise().current_value;
    }
};

// Tick generator: yields filtered ticks from a buffer
Generator<Tick> filter_spread(const std::vector<Tick>& ticks, double max_spread) {
    for (const auto& t : ticks) {
        if (t.ask - t.bid <= max_spread)
            co_yield t;   // suspend here, resume on next()
    }
}

void process() {
    std::vector<Tick> feed = { {1000, 100.0, 100.05}, {2000, 100.0, 100.20}, {3000, 99.9, 99.95} };
    auto gen = filter_spread(feed, 0.10);
    while (auto tick = gen.next()) {
        // Only sees ticks with spread <= 0.10
    }
}`,
    explanation:
      "C++20 coroutines enable lazy generators: co_yield suspends execution and returns a value to the caller; resuming continues from that point. This models a streaming pipeline without threads or callbacks. For market data, a generator chain (parse → filter → normalise → strategy) avoids materialising intermediate buffers, runs synchronously, and is easier to test than async callback chains. C++23 std::generator standardises this pattern.",
  },
  {
    id: "cpp-20260712-b1-ring-buffer",
    language: "cpp",
    title: "Lock-Free Single-Producer Single-Consumer Ring Buffer",
    tag: "low-latency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// SPSC ring buffer: one writer thread, one reader thread
// head_ owned by producer; tail_ owned by consumer
// No CAS needed: only one writer and one reader
template<typename T, size_t N>
class SPSCRingBuffer {
    static_assert((N & (N-1)) == 0, "N must be power of 2");
    static constexpr size_t MASK = N - 1;

    alignas(64) std::array<T, N> buf_;
    alignas(64) std::atomic<size_t> head_{0};  // producer writes here
    alignas(64) std::atomic<size_t> tail_{0};  // consumer reads here

public:
    // Called by producer thread only
    bool push(const T& val) {
        size_t h = head_.load(std::memory_order_relaxed);
        size_t next_h = (h + 1) & MASK;
        if (next_h == tail_.load(std::memory_order_acquire))
            return false;  // full
        buf_[h] = val;
        head_.store(next_h, std::memory_order_release);
        return true;
    }

    // Called by consumer thread only
    std::optional<T> pop() {
        size_t t = tail_.load(std::memory_order_relaxed);
        if (t == head_.load(std::memory_order_acquire))
            return std::nullopt;  // empty
        T val = buf_[t];
        tail_.store((t + 1) & MASK, std::memory_order_release);
        return val;
    }

    size_t approx_size() const {
        return (head_.load(std::memory_order_relaxed) -
                tail_.load(std::memory_order_relaxed)) & MASK;
    }
};`,
    explanation:
      "SPSC ring buffers require only acquire/release atomics on head and tail — no CAS, no full fence. The power-of-2 size enables bitwise masking instead of modulo division. Cache-line alignment on head_ and tail_ prevents false sharing between producer and consumer cores. This is the canonical structure for feeding market data from a NIC capture thread to a strategy thread, typically achieving 50–100 ns latency end-to-end.",
  },
  {
    id: "cpp-20260712-b1-numa-alloc",
    language: "cpp",
    title: "NUMA-Aware Memory Allocation",
    tag: "low-latency",
    code: `#include <numa.h>   // libnuma — link with -lnuma
#include <cstdlib>
#include <stdexcept>
#include <cstring>

// Allocate memory on a specific NUMA node
// Critical: strategy thread and its data on same node = no cross-node fetch
void* numa_alloc_on_node(size_t bytes, int node) {
    void* ptr = numa_alloc_onnode(bytes, node);
    if (!ptr) throw std::bad_alloc();
    return ptr;
}

void numa_free_on_node(void* ptr, size_t bytes) {
    numa_free(ptr, bytes);
}

// Pin the calling thread to cores on a specific NUMA node
void pin_thread_to_numa(int node) {
    struct bitmask* mask = numa_allocate_cpumask();
    numa_node_to_cpus(node, mask);
    numa_sched_setaffinity(0, mask);   // 0 = calling thread
    numa_free_cpumask(mask);
}

// Interleave allocation across all nodes (for shared read-only data)
void* numa_alloc_interleaved(size_t bytes) {
    return numa_alloc_interleaved(bytes);
}

// Example: NUMA-local order book allocation
struct OrderBook; // forward decl

OrderBook* make_numa_local_book(int strategy_core_node, size_t book_bytes) {
    pin_thread_to_numa(strategy_core_node);
    auto* mem = static_cast<OrderBook*>(
        numa_alloc_on_node(book_bytes, strategy_core_node));
    std::memset(mem, 0, book_bytes);
    return mem;
}`,
    explanation:
      "Modern servers have 2–8 NUMA nodes; cross-node memory access costs 2–3× more than local access (~100 ns vs 40 ns). numa_alloc_onnode allocates from the local DRAM of the specified node. Pairing it with thread affinity (pin_to_core) ensures both the code and data reside on the same node, eliminating remote memory fetches. Interleaved allocation distributes shared read-only data (config, symbol tables) evenly for balanced access from multiple nodes.",
  },
  {
    id: "cpp-20260712-b1-simd-dot",
    language: "cpp",
    title: "AVX2 SIMD Dot Product for Factor Model",
    tag: "low-latency",
    code: `#include <immintrin.h>
#include <cstddef>
#include <numeric>

// AVX2 dot product: 8 doubles = 2 AVX registers (256 bits = 4 doubles each)
// Computes sum(a[i] * b[i]) for a portfolio of factor exposures × factor returns
double dot_product_avx2(const double* a, const double* b, size_t n) {
    __m256d acc = _mm256_setzero_pd();  // accumulator (4 doubles)

    size_t i = 0;
    for (; i + 4 <= n; i += 4) {
        __m256d va = _mm256_loadu_pd(a + i);
        __m256d vb = _mm256_loadu_pd(b + i);
        // Fused multiply-add: acc += va * vb (one instruction on Haswell+)
        acc = _mm256_fmadd_pd(va, vb, acc);
    }

    // Horizontal sum: reduce 4 doubles to 1
    __m128d lo = _mm256_castpd256_pd128(acc);
    __m128d hi = _mm256_extractf128_pd(acc, 1);
    lo = _mm_add_pd(lo, hi);
    lo = _mm_hadd_pd(lo, lo);
    double result = _mm_cvtsd_f64(lo);

    // Handle remainder (n not multiple of 4)
    for (; i < n; ++i) result += a[i] * b[i];
    return result;
}

// Factor P&L: portfolio betas × factor returns
// betas: Nx1 per-asset exposure to each factor
// factor_rets: 1 return per factor
double portfolio_factor_pnl(const double* betas, const double* factor_rets,
                             size_t n_factors) {
    return dot_product_avx2(betas, factor_rets, n_factors);
}`,
    explanation:
      "AVX2 processes 4 doubles per cycle (256-bit registers). FMA (fused multiply-add) computes a*b+c in a single instruction with one rounding error vs two separate operations. The horizontal sum extracts the scalar result from the vector accumulator. For factor models with 50–500 risk factors, SIMD dot products are 4–8× faster than scalar loops. Alignment to 32 bytes (use _mm256_load_pd for aligned pointers) avoids the cross-cache-line penalty.",
  },
  {
    id: "cpp-20260712-b1-consteval-greeks",
    language: "cpp",
    title: "consteval Black-Scholes at Compile Time",
    tag: "modern-cpp",
    code: `#include <cmath>
#include <numbers>   // C++20 std::numbers::pi

// consteval: must be evaluated at compile time (unlike constexpr which may be)
// Useful for baking in fixed hedge ratios, exercise boundaries, table lookups

consteval double ce_exp(double x) {
    // Taylor: e^x = 1 + x + x^2/2! + ... (compile-time only)
    double result = 1.0, term = 1.0;
    for (int n = 1; n <= 30; ++n) {
        term *= x / n;
        result += term;
    }
    return result;
}

consteval double ce_sqrt(double x, double guess = 1.0, int iter = 40) {
    // Newton's method for sqrt at compile time
    if (iter == 0) return guess;
    return ce_sqrt(x, 0.5*(guess + x/guess), iter - 1);
}

// Compile-time d1 for ATM option (S = K, known at compile time)
consteval double atm_d1(double r, double sigma, double T) {
    return (r + 0.5 * sigma * sigma) * T / (sigma * ce_sqrt(T));
}

// Bake in option parameters that don't change (e.g. fixed hedge overlay)
inline constexpr double kHedgeRatio =
    // ATM 6-month option at 20% vol, 4% rate: d1 ≈ 0.2121
    atm_d1(0.04, 0.20, 0.5);

static_assert(kHedgeRatio > 0.0, "hedge ratio sanity check");`,
    explanation:
      "consteval mandates compile-time evaluation (unlike constexpr which is also eligible for runtime). This enables baking fixed mathematical constants (ATM delta, exercise thresholds, discount factors for known tenors) directly into the binary as immediates, eliminating all runtime computation for those values. The static_assert provides a compile-time sanity check on the computed result — no unit test needed for deterministic constants.",
  },
  {
    id: "cpp-20260712-b1-string-view-map",
    language: "cpp",
    title: "Compile-Time FIX Tag Name Lookup",
    tag: "low-latency",
    code: `#include <string_view>
#include <array>
#include <algorithm>
#include <optional>
#include <cstdint>

// Sorted compile-time table: binary search at O(log n)
// avoids std::unordered_map heap allocation and hash collision
struct TagEntry {
    int tag;
    std::string_view name;
    constexpr bool operator<(const TagEntry& o) const { return tag < o.tag; }
};

inline constexpr std::array<TagEntry, 16> kFixTagNames {{
    {  8, "BeginString"},
    { 11, "ClOrdID"},
    { 14, "CumQty"},
    { 17, "ExecID"},
    { 35, "MsgType"},
    { 37, "OrderID"},
    { 38, "OrderQty"},
    { 39, "OrdStatus"},
    { 40, "OrdType"},
    { 44, "Price"},
    { 49, "SenderCompID"},
    { 54, "Side"},
    { 55, "Symbol"},
    { 56, "TargetCompID"},
    {150, "ExecType"},
    {151, "LeavesQty"},
}};

// constexpr binary search — resolved at compile time when tag is a constant
constexpr std::optional<std::string_view> fix_tag_name(int tag) {
    TagEntry key{tag, {}};
    auto it = std::lower_bound(kFixTagNames.begin(), kFixTagNames.end(), key);
    if (it != kFixTagNames.end() && it->tag == tag)
        return it->name;
    return std::nullopt;
}

static_assert(fix_tag_name(44) == "Price");
static_assert(!fix_tag_name(999).has_value());`,
    explanation:
      "A sorted constexpr array + binary search avoids hash-map overhead for small lookup tables. The table is in read-only memory, shared across threads with no synchronisation. static_assert verifies correctness at compile time. std::string_view keys avoid string copies. For FIX logging and protocol introspection, this pattern is 5–10× faster than unordered_map due to cache locality: all 16 entries fit in 3–4 cache lines.",
  },
  {
    id: "cpp-20260712-b1-span-buffer",
    language: "cpp",
    title: "std::span for Zero-Copy Buffer Passing",
    tag: "modern-cpp",
    code: `#include <span>
#include <cstdint>
#include <cstring>
#include <vector>
#include <array>

// std::span: non-owning view over contiguous memory
// Works with arrays, vectors, raw pointers — no copy, no allocation

struct MsgHeader {
    uint16_t msg_type;
    uint16_t length;
    uint32_t seq_num;
};

// Accept any contiguous byte buffer without caring about ownership
size_t parse_messages(std::span<const uint8_t> buf) {
    size_t offset = 0;
    size_t count  = 0;
    while (offset + sizeof(MsgHeader) <= buf.size()) {
        MsgHeader hdr{};
        std::memcpy(&hdr, buf.data() + offset, sizeof(hdr));
        if (offset + hdr.length > buf.size()) break;
        // Process body: zero-copy subspan
        auto body = buf.subspan(offset + sizeof(hdr),
                                hdr.length - sizeof(hdr));
        // dispatch(hdr.msg_type, body);
        offset += hdr.length;
        ++count;
    }
    return count;
}

// Caller owns the memory — span just references it
void demo() {
    std::array<uint8_t, 4096> stack_buf{};
    parse_messages(stack_buf);   // stack buffer

    std::vector<uint8_t> heap_buf(65536);
    parse_messages(heap_buf);    // heap buffer — same function, no overload

    uint8_t raw[256];
    parse_messages({raw, sizeof(raw)});  // raw pointer + size
}`,
    explanation:
      "std::span is a non-owning, non-allocating view over contiguous memory. It replaces the ubiquitous (T*, size_t) pair with a type-safe interface that works uniformly with arrays, vectors, and raw buffers. subspan() returns a view of a slice without copying. In network receive loops (UDP/multicast tick data), using span avoids copying received bytes into a new container before parsing, keeping the hot path allocation-free.",
  },
];
