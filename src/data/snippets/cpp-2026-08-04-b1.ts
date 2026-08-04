import type { Snippet } from "./types";

export const cppSnippets20260804B1: Snippet[] = [
  {
    id: "cpp-20260804-b1-spsc-ringbuf",
    language: "cpp",
    title: "Lock-Free SPSC Ring Buffer for Tick Data",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Single-Producer Single-Consumer lock-free ring buffer.
// No CAS loop needed: producer owns head, consumer owns tail.
// Cache-line padding prevents false sharing between the two threads.
template <typename T, std::size_t N>
class SPSCQueue {
    static_assert((N & (N-1)) == 0, "N must be power of 2");

    alignas(64) std::atomic<std::size_t> head_{0};
    alignas(64) std::atomic<std::size_t> tail_{0};
    std::array<T, N> buf_;

public:
    // Called by producer thread only
    bool push(const T& item) {
        std::size_t h = head_.load(std::memory_order_relaxed);
        std::size_t next = (h + 1) & (N - 1);
        if (next == tail_.load(std::memory_order_acquire))
            return false;  // full
        buf_[h] = item;
        head_.store(next, std::memory_order_release);
        return true;
    }

    // Called by consumer thread only
    std::optional<T> pop() {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        if (t == head_.load(std::memory_order_acquire))
            return std::nullopt;  // empty
        T item = buf_[t];
        tail_.store((t + 1) & (N - 1), std::memory_order_release);
        return item;
    }

    bool empty() const {
        return head_.load(std::memory_order_acquire)
            == tail_.load(std::memory_order_acquire);
    }
};

// Usage: SPSCQueue<double, 4096> tick_q;
// Feed thread: tick_q.push(price);
// Strategy thread: if (auto p = tick_q.pop()) process(*p);`,
    explanation: "SPSC requires no CAS because each endpoint is exclusively owned by one thread: producer load-relaxes head and store-releases, consumer load-acquires. The power-of-2 size enables a bitmask instead of modulo. alignas(64) padding prevents the head and tail cache lines from ping-ponging between cores."
  },
  {
    id: "cpp-20260804-b1-arena-allocator",
    language: "cpp",
    title: "Monotonic Arena Allocator for Order Objects",
    tag: "allocators",
    code: `#include <cstddef>
#include <cstdint>
#include <cassert>
#include <new>
#include <memory>

// Monotonic bump-pointer allocator: O(1) alloc, O(1) bulk free.
// Perfect for per-message or per-snapshot allocation where
// all objects live the same lifetime.
class ArenaAllocator {
    std::byte* begin_  = nullptr;
    std::byte* cursor_ = nullptr;
    std::byte* end_    = nullptr;
    std::size_t cap_;

public:
    explicit ArenaAllocator(std::size_t cap)
        : cap_(cap) {
        begin_ = cursor_ = static_cast<std::byte*>(::operator new(cap));
        end_   = begin_ + cap;
    }
    ~ArenaAllocator() { ::operator delete(begin_); }

    // No copy/move; the backing memory is tied to this object's lifetime.
    ArenaAllocator(const ArenaAllocator&)            = delete;
    ArenaAllocator& operator=(const ArenaAllocator&) = delete;

    void* alloc(std::size_t n, std::size_t align = alignof(std::max_align_t)) {
        std::size_t space = static_cast<std::size_t>(end_ - cursor_);
        void* ptr = cursor_;
        if (!std::align(align, n, ptr, space)) return nullptr;
        cursor_ = static_cast<std::byte*>(ptr) + n;
        return ptr;
    }

    // Bulk reset: invalidates every previously allocated pointer.
    void reset() { cursor_ = begin_; }

    std::size_t used() const { return static_cast<std::size_t>(cursor_ - begin_); }
    std::size_t capacity() const { return cap_; }
};

// Helper: construct T in-arena
template <typename T, typename... Args>
T* arena_new(ArenaAllocator& a, Args&&... args) {
    void* mem = a.alloc(sizeof(T), alignof(T));
    if (!mem) return nullptr;
    return ::new(mem) T(std::forward<Args>(args)...);
}

// Usage:
//   ArenaAllocator arena(1 << 20);  // 1 MB
//   Order* o = arena_new<Order>(arena, id, price, qty);
//   // ... process message batch ...
//   arena.reset();  // free everything at once`,
    explanation: "A bump-pointer allocator advances a cursor and returns the current position, completing in two pointer operations. Because all allocations share the same lifetime (a market-data snapshot, a fix message batch), bulk reset replaces N individual free() calls. Per-object destruction must be called manually if destructors have side effects."
  },
  {
    id: "cpp-20260804-b1-span-md-parser",
    language: "cpp",
    title: "std::span for Zero-Copy Market Data Field Parsing",
    tag: "modern-cpp",
    code: `#include <span>
#include <cstdint>
#include <cstring>
#include <string_view>
#include <optional>
#include <stdexcept>

// Binary market data header: fixed-layout network packet.
#pragma pack(push, 1)
struct MDHeader {
    uint16_t msg_type;
    uint16_t body_len;
    uint64_t seq_no;
    uint64_t timestamp_ns;
};
struct MDTradeBody {
    int64_t  price_scaled;  // price * 10^6
    uint32_t qty;
    char     side;   // 'B'/'S'
    char     symbol[8];
};
#pragma pack(pop)

// std::span wraps a raw buffer without copying — zero overhead.
struct ParsedTrade {
    double      price;
    uint32_t    qty;
    char        side;
    std::string_view symbol;
    uint64_t    timestamp_ns;
};

std::optional<ParsedTrade> parse_trade(std::span<const std::byte> buf) {
    if (buf.size() < sizeof(MDHeader) + sizeof(MDTradeBody))
        return std::nullopt;

    const auto* hdr  = reinterpret_cast<const MDHeader*>(buf.data());
    const auto* body = reinterpret_cast<const MDTradeBody*>(buf.data() + sizeof(MDHeader));

    if (hdr->msg_type != 0x0001) return std::nullopt;  // not a trade message

    ParsedTrade t;
    t.price        = body->price_scaled / 1'000'000.0;
    t.qty          = body->qty;
    t.side         = body->side;
    // string_view directly into the packet buffer — no copy, no allocation
    t.symbol       = std::string_view(body->symbol, strnlen(body->symbol, 8));
    t.timestamp_ns = hdr->timestamp_ns;
    return t;
}

// Usage:
//   std::span<const std::byte> pkt{recv_buf, recv_len};
//   if (auto trade = parse_trade(pkt)) process(*trade);`,
    explanation: "std::span carries a pointer plus length without owning the memory, enabling direct parsing of network-received buffers with zero copy. string_view into the packet body similarly avoids allocation. Both types compose safely because they are non-owning views — callers retain responsibility for buffer lifetime."
  },
  {
    id: "cpp-20260804-b1-constexpr-greeks-table",
    language: "cpp",
    title: "Compile-Time Greeks Lookup Table with constexpr",
    tag: "modern-cpp",
    code: `#include <array>
#include <cmath>
#include <cstddef>
#include <utility>

// Precompute a discretised delta table for fast ATM approximation.
// At compile time: table maps 100 vol * sqrt(T) grid points to N(d1) approx.
// Avoids std::erfc at runtime for coarse risk estimates.

constexpr double kSqrt2Pi   = 2.5066282746310002;
constexpr double kSqrtTwo   = 1.4142135623730951;

// Rational approximation to N(x) — max error ~7.5e-8 (Abramowitz & Stegun)
constexpr double ncdf_approx(double x) {
    // Use abs for both halves
    double ax = x < 0 ? -x : x;
    constexpr double p  = 0.2316419;
    constexpr double b1 =  0.319381530;
    constexpr double b2 = -0.356563782;
    constexpr double b3 =  1.781477937;
    constexpr double b4 = -1.821255978;
    constexpr double b5 =  1.330274429;
    double t    = 1.0 / (1.0 + p * ax);
    double pdf  = (1.0 / kSqrt2Pi) * (ax < 20.0 ? 1.0 : 0.0);  // rough guard
    // poly = t*(b1+t*(b2+t*(b3+t*(b4+t*b5))))
    double poly = t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
    double cdf_pos = 1.0 - pdf * poly;
    return x >= 0 ? cdf_pos : 1.0 - cdf_pos;
}

// Generate 200-point delta table for vol_sqrt_T in [0.01, 2.0]
// at moneyness d1 = vol_sqrt_T / 2 (ATM forward approximation).
constexpr auto make_atm_delta_table() {
    constexpr std::size_t N   = 200;
    constexpr double lo = 0.01, hi = 2.0;
    std::array<std::pair<double,double>, N> table{};
    for (std::size_t i = 0; i < N; ++i) {
        double vol_sqt = lo + (hi - lo) * i / (N - 1);
        double d1      = 0.5 * vol_sqt;  // ATM: log(F/K)=0, d1 = 0.5*sig*sqrt(T)
        table[i] = { vol_sqt, ncdf_approx(d1) };
    }
    return table;
}

inline constexpr auto kATMDeltaTable = make_atm_delta_table();

// Runtime lookup: O(1) binary search into the compile-time table
double fast_atm_delta(double vol_sqrt_T) {
    auto it = std::lower_bound(kATMDeltaTable.begin(), kATMDeltaTable.end(),
        std::pair<double,double>{vol_sqrt_T, 0.0},
        [](const auto& a, const auto& b){ return a.first < b.first; });
    if (it == kATMDeltaTable.end()) return kATMDeltaTable.back().second;
    return it->second;
}`,
    explanation: "constexpr enables heavy table computation at compile time — the 200-entry delta table is embedded in the binary's read-only data section and never recomputed at runtime. This shifts Greeks approximation cost entirely to the compiler and delivers cache-friendly O(log N) lookups from a contiguous array rather than a transcendental function call."
  },
  {
    id: "cpp-20260804-b1-jthread-feed-handler",
    language: "cpp",
    title: "std::jthread with Stop Token for Market Feed Handler (C++20)",
    tag: "modern-cpp",
    code: `#include <thread>
#include <stop_token>
#include <atomic>
#include <chrono>
#include <iostream>
#include <functional>

// jthread automatically joins on destruction and signals the stop token.
// Eliminates manual thread.join() / flag.store(false) teardown patterns.

struct Tick { double bid; double ask; };

class FeedHandler {
    std::atomic<Tick> latest_{};
    std::jthread worker_;

    void run(std::stop_token tok, std::function<Tick()> source) {
        while (!tok.stop_requested()) {
            Tick t = source();
            latest_.store(t, std::memory_order_relaxed);
            // In production: wait on a socket/multicast recv()
            using namespace std::chrono_literals;
            std::this_thread::sleep_for(1ms);
        }
    }

public:
    explicit FeedHandler(std::function<Tick()> source) {
        // std::jthread passes stop_token as first arg automatically
        worker_ = std::jthread([this, src = std::move(source)](std::stop_token tok){
            run(tok, src);
        });
    }

    // Destructor: worker_.request_stop() + worker_.join() called automatically
    ~FeedHandler() = default;

    Tick latest() const { return latest_.load(std::memory_order_relaxed); }

    void stop() { worker_.request_stop(); }
};

// Usage:
// int tick_n = 0;
// FeedHandler fh([&]{ return Tick{100.0 + tick_n, 100.1 + tick_n++}; });
// std::this_thread::sleep_for(std::chrono::milliseconds(10));
// auto t = fh.latest();   // non-blocking snapshot
// fh.stop();              // or just let fh go out of scope`,
    explanation: "std::jthread's destructor calls request_stop() on the embedded stop_source and then joins — making feed handler teardown correct-by-default. The stop_token passed to the worker lambda is cooperative: the thread checks it at safe points, avoiding forced-termination races on shared state like sockets and order books."
  },
  {
    id: "cpp-20260804-b1-fold-expr-typelist",
    language: "cpp",
    title: "Fold Expressions for Compile-Time Strategy Type Dispatch",
    tag: "modern-cpp",
    code: `#include <type_traits>
#include <variant>
#include <string_view>
#include <functional>

// Compile-time type list: check if a strategy type is registered.
template <typename T, typename... Types>
constexpr bool contains_type_v = (std::is_same_v<T, Types> || ...);

// Fold expression to invoke a callable on each variant alternative.
template <typename Variant, typename Visitor>
void visit_all_types(Visitor&& v) {
    // Unpack: call v<T>() for every type in the variant
    // (statically, not on a value — used for registration)
    std::apply([&](auto&&... ts) {
        (v(ts), ...);
    }, std::tuple<std::variant_alternative_t<0, Variant>*>{});
}

// Strategies
struct MomentumStrategy { std::string_view name = "Momentum"; };
struct MeanRevStrategy  { std::string_view name = "MeanRev";  };
struct ArbitrageStrategy{ std::string_view name = "Arbitrage";};

using AnyStrategy = std::variant<MomentumStrategy, MeanRevStrategy, ArbitrageStrategy>;

// Check membership at compile time
static_assert(contains_type_v<MomentumStrategy, MomentumStrategy, MeanRevStrategy>);
static_assert(!contains_type_v<ArbitrageStrategy, MomentumStrategy, MeanRevStrategy>);

// Fold over a parameter pack to compute combined notional
template <typename... Strategies>
double total_notional(const Strategies&... strats) {
    double notionals[] = { /* strategy-specific */ 100.0 * sizeof(Strategies)... };
    double sum = 0;
    for (auto n : notionals) sum += n;
    return sum;
}

// std::visit with overloaded lambdas (classic pattern)
template <typename... Ts> struct overloaded : Ts... { using Ts::operator()...; };
template <typename... Ts> overloaded(Ts...) -> overloaded<Ts...>;

double get_signal(const AnyStrategy& s) {
    return std::visit(overloaded{
        [](const MomentumStrategy&)  { return  1.0; },
        [](const MeanRevStrategy&)   { return -0.5; },
        [](const ArbitrageStrategy&) { return  0.1; },
    }, s);
}`,
    explanation: "Fold expressions (pack && ...) collapse parameter packs in a single expression, enabling compile-time set membership checks and per-type registration without recursion. Combined with std::variant and the overloaded deduction guide, they form a complete closed-sum type dispatch — the compiler verifies exhaustiveness at every call site."
  },
  {
    id: "cpp-20260804-b1-trinomial-tree",
    language: "cpp",
    title: "Trinomial Tree for American Put Option",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Trinomial tree: three branches (up, mid, down) per step.
// More stable than binomial for the same number of steps;
// useful for barrier options and short-rate models.
double trinomial_american_put(double S, double K, double r,
                               double sigma, double T, int N) {
    double dt   = T / N;
    double dx   = sigma * std::sqrt(3.0 * dt);  // log-price step
    double u    = std::exp(dx);
    double d    = std::exp(-dx);

    // Risk-neutral probabilities
    double disc = std::exp(-r * dt);
    double pu   = 0.5 * ((r - 0.5 * sigma*sigma) * dt / dx
                         + (r - 0.5*sigma*sigma)*(r - 0.5*sigma*sigma)*dt*dt / (dx*dx)
                         + sigma*sigma*dt/(dx*dx));
    double pd   = 0.5 * (-(r - 0.5 * sigma*sigma) * dt / dx
                         + (r - 0.5*sigma*sigma)*(r - 0.5*sigma*sigma)*dt*dt / (dx*dx)
                         + sigma*sigma*dt/(dx*dx));
    double pm   = 1.0 - pu - pd;

    // Node count at step N: 2N+1 nodes
    int n_nodes = 2 * N + 1;
    std::vector<double> V(n_nodes);

    // Terminal payoffs
    for (int j = 0; j < n_nodes; ++j) {
        int shift = j - N;  // index from centre
        double Si = S * std::pow(u, shift > 0 ? shift : 0)
                      * std::pow(d, shift < 0 ? -shift : 0);
        V[j] = std::max(K - Si, 0.0);
    }

    // Backward induction (American: take max of hold vs exercise)
    for (int i = N - 1; i >= 0; --i) {
        for (int j = 0; j < 2*i+1; ++j) {
            // Map relative to current centre
            int shift = j - i;
            double Si = S * std::pow(u, shift > 0 ? shift : 0)
                          * std::pow(d, shift < 0 ? -shift : 0);
            double hold = disc * (pu * V[j+2] + pm * V[j+1] + pd * V[j]);
            V[j] = std::max(hold, std::max(K - Si, 0.0));
        }
        V.resize(2*i+1);
    }
    return V[0];
}`,
    explanation: "The trinomial tree uses three branches per node (up/mid/down log-price moves of ±dx and 0), giving more freedom to tune probabilities to match GBM drift and variance simultaneously. Early exercise is enforced at each node by taking max(hold, intrinsic value). The same framework extends to Ornstein-Uhlenbeck short-rate models by reparametrising dx."
  },
  {
    id: "cpp-20260804-b1-simd-portfolio-pnl",
    language: "cpp",
    title: "AVX2 Vectorised Portfolio P&L Aggregation",
    tag: "low-latency",
    code: `#include <immintrin.h>
#include <cstddef>
#include <vector>
#include <numeric>

// Compute total portfolio P&L = sum(position[i] * price_change[i])
// across N positions using AVX2 (8 floats per instruction).
float portfolio_pnl_avx2(const float* positions, const float* price_chg,
                           std::size_t n) {
    __m256 acc = _mm256_setzero_ps();
    std::size_t i = 0;

    for (; i + 8 <= n; i += 8) {
        __m256 pos   = _mm256_loadu_ps(positions  + i);
        __m256 pchg  = _mm256_loadu_ps(price_chg  + i);
        acc = _mm256_fmadd_ps(pos, pchg, acc);   // acc += pos * pchg
    }

    // Horizontal add: reduce 8 lanes to 1 scalar
    __m128 lo   = _mm256_castps256_ps128(acc);
    __m128 hi   = _mm256_extractf128_ps(acc, 1);
    __m128 sum4 = _mm_add_ps(lo, hi);
    __m128 shuf = _mm_movehdup_ps(sum4);
    __m128 sum2 = _mm_add_ps(sum4, shuf);
    __m128 dup  = _mm_movehl_ps(shuf, sum2);
    float  total = _mm_cvtss_f32(_mm_add_ss(sum2, dup));

    // Scalar tail
    for (; i < n; ++i) total += positions[i] * price_chg[i];
    return total;
}

// Double-precision version for risk-level accuracy
double portfolio_pnl_avx2_d(const double* positions, const double* price_chg,
                              std::size_t n) {
    __m256d acc = _mm256_setzero_pd();
    std::size_t i = 0;
    for (; i + 4 <= n; i += 4) {
        __m256d pos  = _mm256_loadu_pd(positions + i);
        __m256d pchg = _mm256_loadu_pd(price_chg + i);
        acc = _mm256_fmadd_pd(pos, pchg, acc);
    }
    __m128d lo4  = _mm256_castpd256_pd128(acc);
    __m128d hi4  = _mm256_extractf128_pd(acc, 1);
    __m128d s2   = _mm_add_pd(lo4, hi4);
    double total = _mm_cvtsd_f64(_mm_hadd_pd(s2, s2));
    for (; i < n; ++i) total += positions[i] * price_chg[i];
    return total;
}`,
    explanation: "_mm256_fmadd_ps (FMA) fuses multiply-add into a single instruction, eliminating a rounding step and halving instruction count compared to separate _mul_ps + _add_ps. A 8-wide vectorised FMA loop processes an N=1000 portfolio in ~125 FMA instructions instead of 1000 scalar MADDs — approximately 8x throughput gain on modern AVX2 cores."
  },
  {
    id: "cpp-20260804-b1-variant-order-type",
    language: "cpp",
    title: "std::variant for Heterogeneous Order Types (No Virtual Dispatch)",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string>
#include <cstdint>
#include <functional>

struct LimitOrder {
    int       id;
    double    limit_price;
    int       qty;
    char      side;
};

struct MarketOrder {
    int    id;
    int    qty;
    char   side;
};

struct StopOrder {
    int    id;
    double stop_price;
    double limit_price;  // stop-limit variant
    int    qty;
    char   side;
};

using Order = std::variant<LimitOrder, MarketOrder, StopOrder>;

// Overloaded visitor — resolved at compile time, no vtable.
template <typename... Ts>
struct Overloaded : Ts... { using Ts::operator()...; };
template <typename... Ts> Overloaded(Ts...) -> Overloaded<Ts...>;

double get_worst_price(const Order& o) {
    return std::visit(Overloaded{
        [](const LimitOrder& l)  { return l.limit_price; },
        [](const MarketOrder&)   { return 0.0; },            // fills at market
        [](const StopOrder& s)   { return s.limit_price; },
    }, o);
}

int get_qty(const Order& o) {
    return std::visit([](const auto& x){ return x.qty; }, o);
}

// Pattern-match for routing: limit to maker, market to taker
bool is_passive(const Order& o) {
    return std::holds_alternative<LimitOrder>(o);
}

// Usage:
//   Order o1 = LimitOrder{1, 100.5, 500, 'B'};
//   Order o2 = MarketOrder{2, 200, 'S'};
//   double wp1 = get_worst_price(o1);   // 100.5
//   double wp2 = get_worst_price(o2);   // 0.0`,
    explanation: "std::variant is a closed discriminated union: the set of types is fixed at compile time and std::visit dispatches without vtable lookup. For order routing this matters because the matching engine hot path visits every inbound order — eliminating virtual dispatch shaves a branch-misprediction and an indirect memory load per order."
  },
  {
    id: "cpp-20260804-b1-ois-bootstrap",
    language: "cpp",
    title: "OIS Discount Curve Bootstrapping (Flat-Forward Interpolation)",
    tag: "numerics",
    code: `#include <vector>
#include <algorithm>
#include <cmath>
#include <stdexcept>

// OIS zero-coupon discount factors from OIS fixed-rate swap quotes.
// OIS swap: fixed leg pays annually, floating leg resets daily (overnight).
// Under perfect collateralisation, OIS = risk-free discount curve.

struct OISQuote { double tenor_years; double fixed_rate; };

std::vector<std::pair<double,double>> bootstrap_ois(
    const std::vector<OISQuote>& quotes) {
    // Sort by maturity
    auto sorted = quotes;
    std::sort(sorted.begin(), sorted.end(),
              [](const OISQuote& a, const OISQuote& b){ return a.tenor_years < b.tenor_years; });

    std::vector<std::pair<double,double>> curve;  // (tenor, discount_factor)
    curve.push_back({0.0, 1.0});  // P(0,0) = 1

    for (const auto& q : sorted) {
        double T   = q.tenor_years;
        double R   = q.fixed_rate;
        // Annual fixed leg: sum of P(0, t_i) for i=1..N-1, plus final P(0, T)
        // OIS fixed leg PV = R * sum P(0, t_i) + P(0, T) = 1 (par swap)
        // => P(0, T) = (1 - R * sum_prev) / (1 + R)

        double pv_fixed_prev = 0.0;
        for (auto& [ti, Pi] : curve) {
            if (ti > 0 && ti <= T - 1.0 + 1e-9)
                pv_fixed_prev += Pi;
        }

        double P_T = (1.0 - R * pv_fixed_prev) / (1.0 + R);
        if (P_T <= 0) throw std::runtime_error("Non-positive discount factor");
        curve.push_back({T, P_T});

        // Derived zero rate
        double z = -std::log(P_T) / T;
        (void)z;  // available if caller wants it
    }
    return curve;
}

// Flat-forward interpolation between bootstrapped tenors
double interpolate_df(const std::vector<std::pair<double,double>>& curve, double t) {
    if (t <= 0) return 1.0;
    for (std::size_t i = 1; i < curve.size(); ++i) {
        double t1 = curve[i-1].first,  P1 = curve[i-1].second;
        double t2 = curve[i].first,    P2 = curve[i].second;
        if (t <= t2) {
            // Flat forward: log(P) linear in t between nodes
            double alpha = (t - t1) / (t2 - t1);
            return std::exp(std::log(P1) * (1-alpha) + std::log(P2) * alpha);
        }
    }
    // Extrapolate flat-forward from last segment
    auto [tN, PN] = curve.back();
    auto [tN1, PN1] = curve[curve.size()-2];
    double fwd = (std::log(PN1) - std::log(PN)) / (tN - tN1);
    return PN * std::exp(-fwd * (t - tN));
}`,
    explanation: "OIS bootstrapping extracts the risk-free discount curve from OIS swap quotes by solving the par condition iteratively: each new tenor's discount factor makes the swap fair-valued given the already-bootstrapped earlier discount factors. Flat-forward interpolation preserves arbitrage-free pricing between quoted tenors by holding the instantaneous forward rate constant between nodes."
  },
  {
    id: "cpp-20260804-b1-cds-hazard",
    language: "cpp",
    title: "CDS Hazard Rate Curve Bootstrapping",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <functional>

// CDS par spread = (1 - R) * (integral of hazard * df) / (sum of df * survival)
// Bootstrap: solve for piecewise-constant hazard rates tenor by tenor.
// R: recovery rate (typically 0.40).

struct CDSQuote { double tenor_years; double par_spread; };  // spread in bps

struct HazardCurve {
    std::vector<double> tenors;
    std::vector<double> hazards;  // piecewise-constant hazard rates

    double survival(double t) const {
        if (t <= 0) return 1.0;
        double h_sum = 0.0;
        double t_prev = 0.0;
        for (std::size_t i = 0; i < tenors.size() && t_prev < t; ++i) {
            double t_end = std::min(tenors[i], t);
            h_sum += hazards[i] * (t_end - t_prev);
            t_prev = tenors[i];
        }
        return std::exp(-h_sum);
    }
};

HazardCurve bootstrap_cds(const std::vector<CDSQuote>& quotes,
                           double R = 0.40, int n_steps = 4) {
    auto sorted = quotes;
    std::sort(sorted.begin(), sorted.end(),
              [](const CDSQuote& a, const CDSQuote& b){ return a.tenor_years < b.tenor_years; });

    HazardCurve curve;
    double t_prev = 0.0;

    for (const auto& q : sorted) {
        double T  = q.tenor_years;
        double S  = q.par_spread * 1e-4;  // bps -> decimal

        // Bisect for hazard h in this segment [t_prev, T]
        auto par_error = [&](double h) {
            curve.hazards.push_back(h);
            curve.tenors.push_back(T);

            double dt = T / n_steps, pv_prot = 0.0, pv_prem = 0.0;
            for (int k = 1; k <= n_steps; ++k) {
                double t  = k * dt;
                double df = std::exp(-0.04 * t);  // flat risk-free 4%
                double Q  = curve.survival(t);
                double Qm = curve.survival(t - dt);
                pv_prot  += (1 - R) * (Qm - Q) * df;
                pv_prem  += S * dt * 0.5 * (Q + Qm) * df;
            }

            curve.hazards.pop_back();
            curve.tenors.pop_back();
            return pv_prot - pv_prem;
        };

        double lo = 1e-6, hi = 5.0;
        for (int iter = 0; iter < 50; ++iter) {
            double mid = 0.5 * (lo + hi);
            (par_error(mid) > 0) ? (lo = mid) : (hi = mid);
        }
        curve.hazards.push_back(0.5 * (lo + hi));
        curve.tenors.push_back(T);
        t_prev = T;
    }
    return curve;
}`,
    explanation: "CDS par spread equates the protection leg PV (probability of default * (1-R) * DF) to the premium leg PV (spread * accrual * survival * DF). Bootstrapping isolates each tenor's hazard rate by bisection: earlier tenors are already fixed in the curve so only the new piecewise-constant segment affects the residual. Recovery R=40% is the ISDA standard for senior unsecured bonds."
  },
  {
    id: "cpp-20260804-b1-bellman-ford-fx",
    language: "cpp",
    title: "Bellman-Ford Negative Cycle Detection for FX Arbitrage",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <limits>
#include <string>
#include <optional>

// FX arbitrage: negative cycle in -log(rate) graph means multiplying
// rates around the cycle yields > 1 (profit opportunity).
struct FXEdge { int from, to; double log_rate; };

// Returns the cycle path if an arbitrage exists, else nullopt.
std::optional<std::vector<int>>
detect_fx_arbitrage(int n_currencies,
                    const std::vector<FXEdge>& edges) {
    constexpr double INF = std::numeric_limits<double>::infinity();
    std::vector<double> dist(n_currencies, 0.0);
    std::vector<int>    pred(n_currencies, -1);

    int last_relaxed = -1;

    // Run N rounds of Bellman-Ford (standard is N-1; extra round detects cycle)
    for (int iter = 0; iter < n_currencies; ++iter) {
        last_relaxed = -1;
        for (const auto& e : edges) {
            if (dist[e.from] + e.log_rate < dist[e.to]) {
                dist[e.to] = dist[e.from] + e.log_rate;
                pred[e.to] = e.from;
                last_relaxed = e.to;
            }
        }
    }

    if (last_relaxed == -1) return std::nullopt;  // no negative cycle

    // Trace the cycle: walk back N-1 steps to guarantee we're IN the cycle
    int v = last_relaxed;
    for (int i = 0; i < n_currencies - 1; ++i) v = pred[v];

    // Collect the cycle
    std::vector<int> cycle;
    int start = v;
    do {
        cycle.push_back(v);
        v = pred[v];
    } while (v != start && cycle.size() <= n_currencies);
    cycle.push_back(start);
    std::reverse(cycle.begin(), cycle.end());
    return cycle;
}

// Build edges from quote matrix:
// edges.push_back({from, to, -log(rate[from][to])})
// Negative log: sum of -log(r) < 0  ⟺  product of r > 1`,
    explanation: "Converting rates to -log(rate) transforms the multiplicative cycle condition (product > 1) into a negative-weight cycle detection problem (sum < 0). Bellman-Ford's Nth relaxation round detects if any edge still improves — proving a cycle exists. Walking back N steps from the last-relaxed vertex is guaranteed to land inside the cycle, not just its approach path."
  },
  {
    id: "cpp-20260804-b1-local-vol-euler",
    language: "cpp",
    title: "Local Volatility Monte Carlo via Euler-Maruyama",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <random>
#include <functional>

// Euler-Maruyama discretisation of local-vol SDE:
//   dS = r*S dt + sigma_loc(S,t) * S * dW
// sigma_loc is provided as a callable (e.g. interpolated from Dupire surface).

using LocalVolFn = std::function<double(double S, double t)>;

double lv_call_mc(double S0, double K, double r, double T,
                  LocalVolFn sigma_loc, int n_paths = 50'000,
                  int n_steps = 100, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> ndist(0.0, 1.0);
    double dt       = T / n_steps;
    double sqrt_dt  = std::sqrt(dt);
    double disc     = std::exp(-r * T);
    double payoff_sum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0;
        for (int step = 0; step < n_steps; ++step) {
            double t   = step * dt;
            double sig = sigma_loc(S, t);
            // Euler-Maruyama step (log-normal to avoid negative S)
            S *= std::exp((r - 0.5 * sig * sig) * dt + sig * sqrt_dt * ndist(rng));
        }
        payoff_sum += std::max(S - K, 0.0);
    }
    return disc * payoff_sum / n_paths;
}

// Example: use a flat sigma=0.20 as baseline (exact BS price should follow)
int main_example() {
    auto flat_lv = [](double, double) { return 0.20; };
    double price = lv_call_mc(100.0, 100.0, 0.05, 1.0, flat_lv);
    // Expected ~10.45 (BS ATM call)
    (void)price;
    return 0;
}`,
    explanation: "Local vol MC substitutes sigma(S,t) from the Dupire surface into the GBM discretisation at each path-step, exactly reproducing the implied vol surface in expectation. Log-Euler (exponential stepping) avoids negative spot prices from the standard additive Euler step — critical when sigma is large or dt is coarse."
  },
  {
    id: "cpp-20260804-b1-numa-aware-alloc",
    language: "cpp",
    title: "NUMA-Aware Memory Allocation via mbind",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <numaif.h>
#include <numa.h>
#include <cstddef>
#include <cstring>
#include <stdexcept>

// Allocate memory bound to a specific NUMA node.
// Critical for co-located feed-handler and matching-engine threads:
// if both run on NUMA node 0, their shared ring buffer must live on node 0.
class NumaBuffer {
    void*       ptr_  = nullptr;
    std::size_t size_ = 0;
    int         node_;

public:
    NumaBuffer(std::size_t bytes, int numa_node) : node_(numa_node) {
        if (numa_available() < 0)
            throw std::runtime_error("NUMA not available");

        // Anonymous mmap, then bind to node
        ptr_ = mmap(nullptr, bytes, PROT_READ | PROT_WRITE,
                    MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (ptr_ == MAP_FAILED)
            throw std::runtime_error("mmap failed");

        // nodemask_t: bit per node
        unsigned long nodemask = 1UL << numa_node;
        if (mbind(ptr_, bytes, MPOL_BIND, &nodemask, 64, MPOL_MF_STRICT))
            throw std::runtime_error("mbind failed");

        // Pre-fault pages on the target node
        std::memset(ptr_, 0, bytes);
        size_ = bytes;
    }

    ~NumaBuffer() { if (ptr_ != MAP_FAILED) munmap(ptr_, size_); }

    void* data() { return ptr_; }
    std::size_t size() const { return size_; }

    NumaBuffer(const NumaBuffer&) = delete;
    NumaBuffer& operator=(const NumaBuffer&) = delete;
};

// Usage: allocate the SPSC ring buffer on node 0 where both endpoints run.
// NumaBuffer ring_buf(4 * 1024 * 1024, /*node=*/0);
// auto* q = new(ring_buf.data()) SPSCQueue<Tick, 65536>;`,
    explanation: "NUMA remote access crosses the interconnect (e.g. QPI/UPI) and adds 100–400 ns of latency. Binding shared data structures to the node where the consuming core resides eliminates this penalty. mbind with MPOL_MF_STRICT fails immediately if the policy cannot be satisfied, making NUMA misconfiguration a startup error rather than silent performance degradation."
  },
  {
    id: "cpp-20260804-b1-prefetch-order-walk",
    language: "cpp",
    title: "Software Prefetch for Order Book Level Traversal",
    tag: "low-latency",
    code: `#include <immintrin.h>  // _mm_prefetch
#include <vector>
#include <cstddef>

// A price level in the book
struct Level {
    double price;
    int    qty;
    int    order_count;
    char   padding[44];  // pad to 64 bytes (one cache line)
};
static_assert(sizeof(Level) == 64);

// Walk all bid levels and accumulate volume up to max_depth.
// Prefetch the cache line L2 ahead of the current position.
int accumulate_depth(const std::vector<Level>& book, int max_depth) {
    int total_qty = 0;
    int n = static_cast<int>(book.size());

    for (int i = 0; i < n && i < max_depth; ++i) {
        // Prefetch 2 cache lines ahead (128 bytes = 2 * sizeof(Level))
        if (i + 2 < n)
            _mm_prefetch(reinterpret_cast<const char*>(&book[i + 2]),
                         _MM_HINT_T0);

        total_qty += book[i].qty;
    }
    return total_qty;
}

// Prefetch hint guide:
//   _MM_HINT_T0 : L1 cache (hot path, access within ~4 cycles)
//   _MM_HINT_T1 : L2 cache (moderate access, ~12 cycles)
//   _MM_HINT_T2 : L3 cache (infrequent, ~40 cycles)
//   _MM_HINT_NTA: non-temporal (streaming, bypass cache hierarchy)

// Prefetching works because Level is exactly one cache line: each prefetch
// loads exactly the next element, with no overlap or waste.`,
    explanation: "Software prefetching hides DRAM latency by issuing a load into cache 2–3 iterations before the data is consumed, overlapping memory access with computation. Padding Level to 64 bytes makes each element exactly one cache line — prefetching one Level at a time loads precisely the data needed with no false sharing or wasted bandwidth."
  },
  {
    id: "cpp-20260804-b1-order-book-concept",
    language: "cpp",
    title: "Concepts-Constrained Generic Best-Execution Router",
    tag: "concepts",
    code: `#include <concepts>
#include <optional>
#include <string_view>

// A venue must expose: best_bid/ask, send_order, cancel_order
template <typename V>
concept Venue = requires(V v, double price, int qty, int id) {
    { v.best_bid() }       -> std::convertible_to<std::optional<double>>;
    { v.best_ask() }       -> std::convertible_to<std::optional<double>>;
    { v.send_limit(price, qty, 'B') } -> std::same_as<int>;  // returns order id
    { v.cancel(id) }       -> std::same_as<bool>;
    { v.name() }           -> std::convertible_to<std::string_view>;
};

// Generic smart-order router: sends to the venue with the best available price.
template <Venue... Venues>
class SmartOrderRouter {
    std::tuple<Venues&...> venues_;

    // Fold over all venues to find min ask
    template <typename Tuple, std::size_t... I>
    int route_buy_impl(double qty, Tuple& t, std::index_sequence<I...>) {
        std::optional<double> best_ask;
        int best_venue_idx = 0, idx = 0;

        auto check = [&](auto& v, int i) {
            auto a = v.best_ask();
            if (a && (!best_ask || *a < *best_ask)) {
                best_ask = a;
                best_venue_idx = i;
            }
        };
        (check(std::get<I>(t), I), ...);

        // Send to best venue
        return std::apply([&](auto&... vs) {
            int ret = -1, i = 0;
            auto try_send = [&](auto& v) {
                if (i++ == best_venue_idx) ret = v.send_limit(*best_ask, qty, 'B');
            };
            (try_send(vs), ...);
            return ret;
        }, t);
    }

public:
    explicit SmartOrderRouter(Venues&... vs) : venues_(vs...) {}

    int route_buy(int qty) {
        return route_buy_impl(qty, venues_,
            std::index_sequence_for<Venues...>{});
    }
};`,
    explanation: "The Venues concept constrains the variadic template pack to only types that expose the required venue interface, turning a static_assert into a compiler diagnostic at the point of instantiation rather than deep inside the template. The fold expression (check(get<I>(t), I), ...) visits each venue in the pack without virtual dispatch."
  },
  {
    id: "cpp-20260804-b1-bit-field-flags",
    language: "cpp",
    title: "Bit Field Order Flags for Fast State Queries",
    tag: "modern-cpp",
    code: `#include <cstdint>
#include <type_traits>

// Represent multiple order flags in a single byte — cache-friendly
// for per-order state that is read frequently in the hot path.
struct OrderFlags {
    uint8_t is_ioc       : 1;  // Immediate-or-Cancel
    uint8_t is_fok       : 1;  // Fill-or-Kill
    uint8_t is_hidden    : 1;  // Iceberg (hidden qty)
    uint8_t is_short_sell: 1;  // Requires locate
    uint8_t is_pegged    : 1;  // Midpoint / primary peg
    uint8_t crossed_nbbo : 1;  // Priced through NBBO on arrival
    uint8_t reserved     : 2;
};
static_assert(sizeof(OrderFlags) == 1);

// Strong enum for flag manipulation without bit twiddling
enum class Flag : uint8_t {
    IOC         = 1 << 0,
    FOK         = 1 << 1,
    Hidden      = 1 << 2,
    ShortSell   = 1 << 3,
    Pegged      = 1 << 4,
    CrossedNBBO = 1 << 5,
};

struct FlagSet {
    uint8_t bits = 0;

    bool test(Flag f) const { return bits & static_cast<uint8_t>(f); }
    void set(Flag f)        { bits |= static_cast<uint8_t>(f); }
    void clear(Flag f)      { bits &= ~static_cast<uint8_t>(f); }
};

// Typical check in the matching loop
void apply_time_in_force(FlagSet& flags, bool partial_fill) {
    if (flags.test(Flag::IOC) && partial_fill)
        flags.set(Flag::CrossedNBBO);  // mark for cancel
    if (flags.test(Flag::FOK))
        flags.clear(Flag::Hidden);     // FOK forces all-or-nothing reveal
}`,
    explanation: "Packing order flags into a single uint8_t means the full TIF/visibility state of an order fits in one byte — an entire 64-byte cache line holds 64 orders' flags. Bit fields are attractive but their layout is implementation-defined; the explicit FlagSet pattern with a strong enum guarantees portability while keeping the bit manipulation readable."
  },
  {
    id: "cpp-20260804-b1-black-scholes-coroutine",
    language: "cpp",
    title: "C++20 Generator Coroutine for Monte Carlo Path Streaming",
    tag: "modern-cpp",
    code: `#include <coroutine>
#include <random>
#include <cmath>
#include <optional>

// Minimal generator coroutine: lazily yields GBM price paths one step at a time.
// Avoids storing full path in memory — useful for very long maturity simulations.
template <typename T>
struct Generator {
    struct promise_type {
        T current_value;
        auto get_return_object() { return Generator{handle_type::from_promise(*this)}; }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v) {
            current_value = v;
            return {};
        }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    using handle_type = std::coroutine_handle<promise_type>;
    handle_type handle_;

    explicit Generator(handle_type h) : handle_(h) {}
    ~Generator() { if (handle_) handle_.destroy(); }

    std::optional<T> next() {
        if (!handle_ || handle_.done()) return std::nullopt;
        handle_.resume();
        if (handle_.done()) return std::nullopt;
        return handle_.promise().current_value;
    }
};

// Coroutine: yields spot price at each step
Generator<double> gbm_path(double S0, double r, double sigma,
                            double dt, int n_steps, unsigned seed) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd(0.0, 1.0);

    double S = S0;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);

    for (int i = 0; i < n_steps; ++i) {
        S *= std::exp(drift + vol * nd(rng));
        co_yield S;
    }
}

// Usage: stream without storing the full path
// auto path = gbm_path(100.0, 0.05, 0.20, 1.0/252, 252, 42);
// while (auto price = path.next()) {
//     process_tick(*price);
// }`,
    explanation: "A C++20 generator coroutine suspends at each co_yield and resumes on the next call to next() — enabling streaming Monte Carlo paths that never materialise the full price vector in memory. This pattern is particularly useful for long-dated Heston or multi-factor simulations where storing full paths for millions of scenarios would exhaust memory."
  },
  {
    id: "cpp-20260804-b1-hash-order-book",
    language: "cpp",
    title: "Hash + Array Hybrid Order Book (Price Level Map)",
    tag: "containers",
    code: `#include <unordered_map>
#include <deque>
#include <optional>
#include <cstdint>

// Hybrid order book: hash map from price (in ticks) to level deque.
// O(1) average add/cancel by price + O(1) best-price lookup via cached extremes.
using Tick = int64_t;  // price in integer ticks to avoid float equality issues

struct Order { int id; int qty; };

class HybridBook {
    std::unordered_map<Tick, std::deque<Order>> bid_levels_;
    std::unordered_map<Tick, std::deque<Order>> ask_levels_;

    std::optional<Tick> best_bid_;
    std::optional<Tick> best_ask_;

    void update_best_bid() {
        if (bid_levels_.empty()) { best_bid_ = std::nullopt; return; }
        Tick best = bid_levels_.begin()->first;
        for (auto& [p, _] : bid_levels_) if (p > best) best = p;
        best_bid_ = best;
    }
    void update_best_ask() {
        if (ask_levels_.empty()) { best_ask_ = std::nullopt; return; }
        Tick best = ask_levels_.begin()->first;
        for (auto& [p, _] : ask_levels_) if (p < best) best = p;
        best_ask_ = best;
    }

public:
    void add_bid(Tick price, int id, int qty) {
        bid_levels_[price].push_back({id, qty});
        if (!best_bid_ || price > *best_bid_) best_bid_ = price;
    }
    void add_ask(Tick price, int id, int qty) {
        ask_levels_[price].push_back({id, qty});
        if (!best_ask_ || price < *best_ask_) best_ask_ = price;
    }

    // Cancel by id (linear scan within level — typical cancel is to best)
    bool cancel_bid(Tick price, int id) {
        auto it = bid_levels_.find(price);
        if (it == bid_levels_.end()) return false;
        auto& q = it->second;
        for (auto oi = q.begin(); oi != q.end(); ++oi) {
            if (oi->id == id) { q.erase(oi); break; }
        }
        if (q.empty()) { bid_levels_.erase(it); update_best_bid(); }
        return true;
    }

    std::optional<Tick> best_bid() const { return best_bid_; }
    std::optional<Tick> best_ask() const { return best_ask_; }
};`,
    explanation: "Using integer ticks as map keys avoids floating-point equality comparisons — two prices at the same tick are identical keys regardless of floating-point representation. Caching the best bid/ask avoids iterating the hash map on every price query; the cache is invalidated only when the best level is removed. This hybrid beats a sorted map when the majority of activity is on the top-of-book."
  },
  {
    id: "cpp-20260804-b1-string-view-fix-tag",
    language: "cpp",
    title: "Zero-Allocation FIX Tag-Value Scan with string_view",
    tag: "market-data",
    code: `#include <string_view>
#include <cstdint>
#include <optional>

// Scan a FIX message for a specific tag without allocating or copying.
// Returns a string_view into the original buffer.
// FIX format: 8=FIX.4.2\x01 9=176\x01 ... tag=value\x01 ...

constexpr char SOH = '\x01';

std::optional<std::string_view>
fix_get(std::string_view msg, int target_tag) {
    std::size_t pos = 0;
    while (pos < msg.size()) {
        // Parse tag number (no allocation: integer scan)
        int tag = 0;
        while (pos < msg.size() && msg[pos] != '=') {
            if (msg[pos] >= '0' && msg[pos] <= '9')
                tag = tag * 10 + (msg[pos] - '0');
            ++pos;
        }
        if (pos >= msg.size()) break;
        ++pos;  // skip '='

        // Find end of value (SOH delimiter)
        std::size_t val_start = pos;
        while (pos < msg.size() && msg[pos] != SOH) ++pos;

        if (tag == target_tag)
            return msg.substr(val_start, pos - val_start);

        if (pos < msg.size()) ++pos;  // skip SOH
    }
    return std::nullopt;
}

// Parse integer value inline (no stoi, no allocation)
std::optional<int> fix_get_int(std::string_view msg, int tag) {
    auto sv = fix_get(msg, tag);
    if (!sv) return std::nullopt;
    int val = 0;
    for (char c : *sv) {
        if (c < '0' || c > '9') return std::nullopt;
        val = val * 10 + (c - '0');
    }
    return val;
}

// Usage:
//   std::string_view msg = "8=FIX.4.2\x01 35=D\x01 49=SENDER\x01 10=235\x01";
//   auto msg_type = fix_get(msg, 35);   // returns "D"
//   auto seq_no   = fix_get_int(msg, 34);`,
    explanation: "Returning std::string_view into the original buffer avoids any heap allocation during FIX scanning — the entire parse is branch-only with linear complexity. This matters at 100k+ messages/second where even a single malloc per message adds microseconds of aggregate latency. The integer inline parser also avoids locale-aware std::stoi overhead."
  },
  {
    id: "cpp-20260804-b1-memory-order-release-seq",
    language: "cpp",
    title: "Release Sequence and Consume Ordering for Producer-Consumer",
    tag: "lock-free",
    code: `#include <atomic>
#include <vector>
#include <cstddef>

// Demonstrates acquire/release pairing for a single-flag handoff
// between a data producer and a consumer thread.

struct Payload {
    double values[8];
    int    count;
};

struct Channel {
    Payload          data{};
    std::atomic<int> ready{0};  // 0=empty, 1=written, 2=consumed

    // Producer: write data then signal with release
    void publish(const Payload& p) {
        data = p;
        // release: all preceding stores visible before this store
        ready.store(1, std::memory_order_release);
    }

    // Consumer: spin until ready then read with acquire
    Payload consume() {
        int expected = 1;
        // acquire: all loads after this see everything released before publish()
        while (!ready.compare_exchange_weak(expected, 2,
               std::memory_order_acquire, std::memory_order_relaxed)) {
            expected = 1;
            __builtin_ia32_pause();  // PAUSE: reduce power on spin loop
        }
        return data;
    }
};

// Why not relaxed for both?
// Without the release/acquire pair, the compiler and CPU may reorder
// the data store AFTER ready.store, so the consumer may read stale data.
// Release on the write side and acquire on the read side form a
// synchronisation edge that prevents all such reorderings.`,
    explanation: "A release-store on the producer side and an acquire-load on the consumer side form a synchronises-with edge: all writes before the release store are guaranteed visible after a matching acquire load on the same atomic. Without this pairing, the CPU's store buffer and the compiler's reordering can expose torn reads of the Payload array."
  },
  {
    id: "cpp-20260804-b1-static-dispatch-policy",
    language: "cpp",
    title: "Policy-Based Design for Configurable Order Routing",
    tag: "modern-cpp",
    code: `#include <type_traits>
#include <string_view>
#include <optional>

// Execution policies — plugged in at compile time, zero overhead.
// No virtual functions needed; the compiler inlines the policy body.

struct BestAskPolicy {
    static constexpr std::string_view name = "BestAsk";
    template <typename Book>
    static std::optional<double> get_price(const Book& b) { return b.best_ask(); }
};

struct MidpointPolicy {
    static constexpr std::string_view name = "Midpoint";
    template <typename Book>
    static std::optional<double> get_price(const Book& b) {
        auto bid = b.best_bid(), ask = b.best_ask();
        if (!bid || !ask) return std::nullopt;
        return (*bid + *ask) * 0.5;
    }
};

struct PassivePegPolicy {
    static constexpr std::string_view name = "PassivePeg";
    template <typename Book>
    static std::optional<double> get_price(const Book& b) {
        // Peg to near side (bid for buy)
        auto bid = b.best_bid();
        return bid ? std::optional<double>(*bid - 0.01) : std::nullopt;
    }
};

// Concept to constrain valid policies
template <typename P>
concept ExecutionPolicy = requires {
    { P::name }  -> std::convertible_to<std::string_view>;
} && requires (int dummy_book) {
    // policy must have get_price<Book>(book)
    true;
};

// Generic order factory parameterised by policy
template <typename Policy, typename Book>
    requires ExecutionPolicy<Policy>
std::optional<double> compute_limit_price(const Book& book) {
    return Policy::get_price(book);
}

// Usage:
// auto price1 = compute_limit_price<BestAskPolicy>(book);
// auto price2 = compute_limit_price<MidpointPolicy>(book);
// — both calls compile to direct (inlined) method invocations, no vtable.`,
    explanation: "Policy-based design selects behaviour at compile time via template parameters rather than runtime virtual dispatch. Each policy is a stateless tag type whose get_price method is resolved and inlined at the call site. Compared to a runtime strategy enum + switch, this eliminates the branch predictor cost and lets the compiler constant-fold strategy-specific arithmetic."
  },
  {
    id: "cpp-20260804-b1-concurrent-snapshot",
    language: "cpp",
    title: "Seqlock for Wait-Free Order Book Snapshot",
    tag: "lock-free",
    code: `#include <atomic>
#include <cstdint>
#include <array>

// Seqlock: writer increments a sequence counter before and after updating.
// Reader spins if sequence is odd (write in progress) or if it changed.
// Readers are never blocked; writers are not delayed by readers.

struct BookSnapshot {
    double best_bid;
    double best_ask;
    int    bid_qty;
    int    ask_qty;
    int64_t seq_no;
};

class SeqlockBook {
    alignas(64) std::atomic<uint64_t> seq_{0};
    alignas(64) BookSnapshot snap_{};

public:
    // Writer: always single-threaded (or mutex-protected between writers)
    void update(double bid, double ask, int bq, int aq, int64_t sn) {
        uint64_t s = seq_.load(std::memory_order_relaxed);
        seq_.store(s + 1, std::memory_order_release);  // odd = write in progress
        std::atomic_thread_fence(std::memory_order_release);

        snap_.best_bid = bid;
        snap_.best_ask = ask;
        snap_.bid_qty  = bq;
        snap_.ask_qty  = aq;
        snap_.seq_no   = sn;

        std::atomic_thread_fence(std::memory_order_release);
        seq_.store(s + 2, std::memory_order_release);  // even = write complete
    }

    // Reader: retry if seq was odd or changed mid-read
    BookSnapshot read() const {
        BookSnapshot out;
        while (true) {
            uint64_t s1 = seq_.load(std::memory_order_acquire);
            if (s1 & 1) { __builtin_ia32_pause(); continue; }  // write in progress

            std::atomic_thread_fence(std::memory_order_acquire);
            out = snap_;
            std::atomic_thread_fence(std::memory_order_acquire);

            uint64_t s2 = seq_.load(std::memory_order_acquire);
            if (s1 == s2) return out;  // clean read
        }
    }
};`,
    explanation: "A seqlock allows multiple concurrent readers with zero overhead when no write is occurring — readers only retry on the rare event of a write during their load. Writers pay only two atomic increments. This is the standard pattern for publishing market-data snapshots from the feed thread to strategy threads, where writes are infrequent but reads are constant."
  },
  {
    id: "cpp-20260804-b1-gauss-hermite-greeks",
    language: "cpp",
    title: "Gauss-Hermite Quadrature for Stochastic Volatility Expectations",
    tag: "numerics",
    code: `#include <array>
#include <cmath>
#include <functional>

// Gauss-Hermite quadrature approximates E[f(X)] where X~N(0,1).
// Uses n nodes and weights: integral f(x)*exp(-x^2) dx ≈ sum w_i * f(x_i)
// For E[f(Z)] with Z~N(mu,sigma^2): substitute x = (z-mu)/(sigma*sqrt(2))

// 5-point Gauss-Hermite nodes and weights (exact for polynomials deg <= 9)
constexpr int GH5_N = 5;
constexpr std::array<double, GH5_N> GH5_NODES = {
    -2.020182, -0.958572, 0.0, 0.958572, 2.020182
};
constexpr std::array<double, GH5_N> GH5_WEIGHTS = {
    0.019953, 0.394424, 0.945309, 0.394424, 0.019953
};
constexpr double GH5_NORM = 1.0 / std::sqrt(M_PI);

// E[f(X)] where X ~ N(mu, sigma^2), using GH quadrature
double gh_expectation(std::function<double(double)> f,
                      double mu, double sigma) {
    double sq2 = std::sqrt(2.0) * sigma;
    double sum  = 0.0;
    for (int i = 0; i < GH5_N; ++i) {
        double x = GH5_NODES[i] * sq2 + mu;  // change of variable
        sum += GH5_WEIGHTS[i] * f(x);
    }
    return sum * GH5_NORM;
}

// Example: price an option on the average volatility under Heston.
// E[sqrt(v_T)] where v_T is approximated as log-normal for small nu.
double expected_vol(double v0, double kappa, double theta,
                    double xi, double T) {
    double mu_log  = std::log(v0) * std::exp(-kappa*T)
                   + std::log(theta) * (1 - std::exp(-kappa*T));
    double sig_log = xi * std::sqrt((1 - std::exp(-2*kappa*T)) / (2*kappa));
    return gh_expectation([](double lv){ return std::exp(0.5*lv); },
                          mu_log, sig_log);
}`,
    explanation: "Gauss-Hermite quadrature replaces a Monte Carlo integral over a Gaussian variable with a weighted sum of 5 deterministic evaluations, achieving machine-precision accuracy for smooth integrands in O(1) function calls. It underpins semianalytic Heston pricing moments and control-variate weights where the outer vol integral can be separated from the inner price integral."
  },
];
