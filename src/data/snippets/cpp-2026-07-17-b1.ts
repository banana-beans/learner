import { Snippet } from "./types";

export const cppSnippets20260717B1: Snippet[] = [
  {
    id: "cpp-20260717-b1-fold-multileg",
    language: "cpp",
    title: "Fold Expression: Aggregate Multi-Leg Greeks",
    tag: "generics",
    code: `#include <tuple>
#include <iostream>

struct GreekLeg {
    double delta{0}, gamma{0}, vega{0}, theta{0};
};

// Fold over + collapses a parameter pack without recursion.
// All legs must be the same type; works with any count >= 1.
template<typename... Legs>
GreekLeg aggregate_greeks(Legs&&... legs) {
    return {
        (legs.delta + ...),   // unary right fold: a + (b + (c + ...))
        (legs.gamma + ...),
        (legs.vega  + ...),
        (legs.theta + ...),
    };
}

int main() {
    // Bull-call spread: long ATM call, short OTM call
    GreekLeg atm_call{ 0.55,  0.035,  0.15, -0.04};
    GreekLeg otm_call{-0.30, -0.020, -0.08,  0.02};
    auto net = aggregate_greeks(atm_call, otm_call);
    // Net: delta=0.25 gamma=0.015 vega=0.07 theta=-0.02
    std::cout << "net delta=" << net.delta << " vega=" << net.vega << "\\n";
}`,
    explanation:
      "Fold expressions eliminate hand-written summation loops and make the number of legs a compile-time parameter — the compiler can unroll or vectorize the reduction. Unlike `std::accumulate`, no default-constructible identity element is needed: the fold works with any associative binary operator.",
  },
  {
    id: "cpp-20260717-b1-nttp-ring",
    language: "cpp",
    title: "NTTP Ring Buffer (Compile-Time Capacity)",
    tag: "low-latency",
    code: `#include <array>
#include <atomic>
#include <optional>
#include <cstddef>

// N is a non-type template parameter: capacity is baked into the type.
// Power-of-2 constraint lets modulo become a single bitmask AND.
template<typename T, std::size_t N>
class RingBuffer {
    static_assert((N & (N - 1)) == 0, "N must be a power of two");
    static constexpr std::size_t MASK = N - 1;

    alignas(64) std::array<T, N> buf_{};   // 64-byte aligned for cache lines
    alignas(64) std::atomic<std::size_t> head_{0};
    alignas(64) std::atomic<std::size_t> tail_{0};

public:
    // Single-producer push; returns false when full
    bool push(const T& v) noexcept {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        std::size_t next = (t + 1) & MASK;
        if (next == head_.load(std::memory_order_acquire)) return false;
        buf_[t] = v;
        tail_.store(next, std::memory_order_release);
        return true;
    }

    // Single-consumer pop; returns nullopt when empty
    std::optional<T> pop() noexcept {
        std::size_t h = head_.load(std::memory_order_relaxed);
        if (h == tail_.load(std::memory_order_acquire)) return std::nullopt;
        T v = buf_[h];
        head_.store((h + 1) & MASK, std::memory_order_release);
        return v;
    }

    std::size_t size() const noexcept {
        return (tail_.load() - head_.load()) & MASK;
    }
};

// 4 KB of tick prices lives entirely on the stack / in BSS
using TickRing = RingBuffer<double, 512>;`,
    explanation:
      "Making capacity an NTTP means the `std::array` is embedded inline — no heap allocation, no pointer indirection. Separating `head_` and `tail_` into their own 64-byte-aligned cache lines eliminates false sharing between the producer and consumer threads: each thread writes to a different cache line.",
  },
  {
    id: "cpp-20260717-b1-constexpr-bs",
    language: "cpp",
    title: "Constexpr Black-Scholes Call Price (C++23)",
    tag: "numerics",
    code: `#include <cmath>   // constexpr std::log/sqrt/exp require C++23

// Abramowitz & Stegun 26.2.17 polynomial approximation for N(x)
constexpr double ncdf(double x) noexcept {
    if (x >  8.0) return 1.0;
    if (x < -8.0) return 0.0;
    const bool neg = (x < 0.0);
    double ax = neg ? -x : x;
    double k = 1.0 / (1.0 + 0.2316419 * ax);
    // Horner-form polynomial in k
    double poly = k * (0.319381530
                + k * (-0.356563782
                + k * (1.781477937
                + k * (-1.821255978
                + k * 1.330274429))));
    constexpr double inv_sqrt2pi = 0.3989422804014327;
    double pdf = inv_sqrt2pi * std::exp(-0.5 * ax * ax);
    double cdf = 1.0 - pdf * poly;
    return neg ? 1.0 - cdf : cdf;
}

// Black-Scholes European call; all inputs are well-defined at compile time
constexpr double bs_call(double S, double K,
                          double r, double T, double sigma) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    return S * ncdf(d1) - K * std::exp(-r * T) * ncdf(d2);
}

// C++23: this runs entirely at compile time
constexpr double atm_price = bs_call(100.0, 100.0, 0.05, 1.0, 0.20);
static_assert(atm_price > 10.0 && atm_price < 11.0,
              "ATM 1Y 20vol call should be ~10.45");`,
    explanation:
      "Elevating Black-Scholes to `constexpr` lets the compiler pre-price a grid of options at build time: model calibration tables, strike-vol lookup grids, and stress-scenario payoffs can all become read-only data segments with zero runtime overhead. The key is replacing the standard CDF with a constexpr-safe polynomial that avoids branchy transcendental iteration.",
  },
  {
    id: "cpp-20260717-b1-antithetic-mc",
    language: "cpp",
    title: "Antithetic Variates for Monte Carlo Variance Reduction",
    tag: "numerics",
    code: `#include <random>
#include <cmath>
#include <utility>
#include <iostream>

// Antithetic variates: for each Gaussian Z, also evaluate at -Z.
// E[(f(Z)+f(-Z))/2] == E[f(Z)] but Var is cut by ~50% in smooth payoffs.

double bs_path_payoff(double S0, double K, double r, double sigma,
                      double T, double z) {
    double ST = S0 * std::exp((r - 0.5 * sigma * sigma) * T
                              + sigma * std::sqrt(T) * z);
    return std::max(ST - K, 0.0);
}

std::pair<double,double> mc_call_price(double S0, double K, double r,
                                        double sigma, double T,
                                        int n_paths, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double sum_plain = 0.0, sum_anti = 0.0;
    for (int i = 0; i < n_paths; ++i) {
        double z = nd(rng);
        double f1 = bs_path_payoff(S0, K, r, sigma, T,  z);  // path +Z
        double f2 = bs_path_payoff(S0, K, r, sigma, T, -z);  // antithetic -Z
        sum_plain += f1;
        sum_anti  += 0.5 * (f1 + f2);   // pair-averaged payoff
    }
    double df = std::exp(-r * T);
    return { df * sum_plain / n_paths,   // plain MC
             df * sum_anti  / n_paths }; // antithetic MC (lower variance)
}

int main() {
    auto [plain, anti] = mc_call_price(100, 100, 0.05, 0.20, 1.0, 100'000);
    // Standard error of anti is typically ~3-4x smaller than plain
    std::cout << "Plain MC: " << plain << "  Antithetic: " << anti << "\\n";
}`,
    explanation:
      "Antithetic variates exploit the negative correlation between `f(Z)` and `f(-Z)`: their covariance is strongly negative for monotone payoffs, so the average has a variance far below the individual estimate. This halves the number of paths needed for a given confidence interval — equivalent to a 4x speedup in convergence rate.",
  },
  {
    id: "cpp-20260717-b1-variance-swap",
    language: "cpp",
    title: "Variance Swap Fair Strike via Discretised Realised Variance",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <stdexcept>

// Realised variance (annualised) from a price series.
// Uses log-return squared sum: RV = (252/N) * sum(ln(S_i/S_{i-1})^2)
double realised_variance(const std::vector<double>& prices) {
    if (prices.size() < 2) throw std::invalid_argument("need >= 2 prices");
    int n = static_cast<int>(prices.size()) - 1;
    double rv = 0.0;
    for (int i = 1; i <= n; ++i) {
        double lr = std::log(prices[i] / prices[i - 1]);
        rv += lr * lr;
    }
    return rv * (252.0 / n);   // annualised, assuming daily data
}

// Fair variance strike Kvar for a var swap under log-contract replication:
//   Kvar = (2/T) * sum_i [ (F_i - K_i)/K_i^2 * DeltaK_i ] * df
// Discrete approximation using market OTM option prices.
// Here we demonstrate the formula skeleton; actual calibration reads IV surface.
double var_swap_strike_approx(
        const std::vector<double>& strikes,   // OTM strikes (sorted)
        const std::vector<double>& prices,    // corresponding option prices (call or put)
        double F,     // forward price
        double df,    // discount factor
        double T)     // maturity in years
{
    int n = static_cast<int>(strikes.size());
    double sum = 0.0;
    for (int i = 0; i < n; ++i) {
        double dk = (i == 0)     ? strikes[1] - strikes[0]
                  : (i == n - 1) ? strikes[n-1] - strikes[n-2]
                  : 0.5 * (strikes[i+1] - strikes[i-1]);
        double K = strikes[i];
        sum += (prices[i] / (K * K)) * dk;
    }
    // Kvar annualised, expressed as vol^2
    return (2.0 / T) * df * sum;
}`,
    explanation:
      "The fair variance strike of a variance swap equals (2/T) times the integral of OTM option prices weighted by 1/K²: this is the spanning replication formula that prices realised variance model-independently from the option surface. Discretising over available strikes introduces a truncation error that practitioners mitigate by extrapolating the smile wings.",
  },
  {
    id: "cpp-20260717-b1-bloom-dedup",
    language: "cpp",
    title: "Bloom Filter for Low-Latency Order Deduplication",
    tag: "low-latency",
    code: `#include <bitset>
#include <cstdint>
#include <functional>
#include <string>

// Bloom filter: probabilistic set membership with zero false negatives.
// Used to detect duplicate order IDs before the expensive hash-map lookup.
template<std::size_t BITS, int K>
class BloomFilter {
    std::bitset<BITS> bits_;

    // K independent hash functions via double-hashing trick
    void hashes(uint64_t key, uint64_t out[K]) const {
        uint64_t h1 = key * 6364136223846793005ULL + 1442695040888963407ULL;
        uint64_t h2 = key * 2862933555777941757ULL + 3037000493ULL;
        for (int i = 0; i < K; ++i)
            out[i] = (h1 + static_cast<uint64_t>(i) * h2) % BITS;
    }

public:
    void insert(uint64_t key) {
        uint64_t hs[K];
        hashes(key, hs);
        for (int i = 0; i < K; ++i) bits_.set(hs[i]);
    }

    // Returns true if key *may* be present (false positive possible)
    // Returns false if key is definitely NOT present
    bool may_contain(uint64_t key) const {
        uint64_t hs[K];
        hashes(key, hs);
        for (int i = 0; i < K; ++i)
            if (!bits_.test(hs[i])) return false;
        return true;
    }

    void clear() { bits_.reset(); }
    double false_positive_rate(std::size_t n) const {
        // FPR ≈ (1 - e^(-K*n/m))^K
        double exponent = -static_cast<double>(K) * n / BITS;
        double p = 1.0 - std::exp(exponent);
        double fpr = 1.0;
        for (int i = 0; i < K; ++i) fpr *= p;
        return fpr;
    }
};

// 1 MB filter, 5 hash functions: FPR < 0.001% for 100k orders
using OrderBloom = BloomFilter<8'000'000, 5>;`,
    explanation:
      "A Bloom filter performs set membership in O(K) time with no per-element memory — the bitset lives in L2/L3 cache. In a FIX gateway, checking the filter before the order-ID hash map eliminates ~99.9% of expensive map lookups for genuine first-time orders; only potential duplicates (rare) pay the hash-map cost.",
  },
  {
    id: "cpp-20260717-b1-dv01-bucket",
    language: "cpp",
    title: "Bucketed DV01 Rate Risk Ladder",
    tag: "numerics",
    code: `#include <map>
#include <vector>
#include <cmath>
#include <iostream>

// A rate risk ladder maps each standard tenor to its DV01 contribution.
// DV01 = -dP/dr * 1bp = present value sensitivity to +1bp shift at that tenor.

struct CashFlow {
    double time;    // years
    double amount;  // notional cashflow
};

// Discount factor for flat rate r
inline double df(double r, double t) { return std::exp(-r * t); }

// Compute DV01 per tenor bucket using parallel bump
// Each cashflow's DV01 = -amount * t * exp(-r*t) * 0.0001
std::map<double, double> dv01_ladder(
    const std::vector<CashFlow>& cashflows,
    double flat_rate,
    const std::vector<double>& tenors)  // standard tenors: 0.5,1,2,5,10,30
{
    std::map<double, double> ladder;
    for (double t : tenors) ladder[t] = 0.0;

    for (const auto& cf : cashflows) {
        // Assign to nearest tenor (for bucketing)
        double nearest = tenors[0];
        for (double t : tenors)
            if (std::abs(t - cf.time) < std::abs(nearest - cf.time))
                nearest = t;

        // DV01 of this cashflow assigned to its tenor bucket
        double dv01_cf = cf.amount * cf.time * df(flat_rate, cf.time) * 1e-4;
        ladder[nearest] += dv01_cf;
    }
    return ladder;
}

int main() {
    // 5Y fixed bond: annual coupons + bullet principal
    std::vector<CashFlow> bond = {
        {1,5},{2,5},{3,5},{4,5},{5,105}
    };
    auto ladder = dv01_ladder(bond, 0.05, {0.5,1,2,3,5,7,10,30});
    for (auto [t, dv01] : ladder)
        if (dv01 != 0.0)
            std::cout << t << "Y: " << dv01 << "\\n";
}`,
    explanation:
      "Bucketing DV01 by tenor reveals where a bond's interest rate risk lives on the yield curve — a 5Y bond's DV01 concentrates at the 5Y tenor but earlier coupons add small contributions at shorter tenors. Risk systems aggregate ladder entries across a portfolio to net offsetting positions and compute carry-adjusted hedges.",
  },
  {
    id: "cpp-20260717-b1-chrono-tsc",
    language: "cpp",
    title: "RDTSC + std::chrono for Nanosecond Latency Measurement",
    tag: "low-latency",
    code: `#include <chrono>
#include <cstdint>
#include <iostream>

// RDTSC: reads the CPU timestamp counter in ~1 cycle.
// On modern Intel/AMD, it is invariant (not affected by frequency scaling).
inline uint64_t rdtsc() {
    unsigned int lo, hi;
    __asm__ __volatile__("rdtsc" : "=a"(lo), "=d"(hi));
    return (static_cast<uint64_t>(hi) << 32) | lo;
}

// Convert TSC ticks to nanoseconds once at startup using wall-clock calibration
struct TscCalibrator {
    double ns_per_tick{0};

    TscCalibrator() {
        auto t0 = std::chrono::high_resolution_clock::now();
        uint64_t c0 = rdtsc();
        // Busy-wait ~10ms to accumulate enough ticks
        volatile int dummy = 0;
        for (int i = 0; i < 10'000'000; ++i) dummy += i;
        uint64_t c1 = rdtsc();
        auto t1 = std::chrono::high_resolution_clock::now();
        double ns_elapsed = std::chrono::duration<double, std::nano>(t1 - t0).count();
        ns_per_tick = ns_elapsed / static_cast<double>(c1 - c0);
    }

    double ticks_to_ns(uint64_t ticks) const { return ticks * ns_per_tick; }
};

int main() {
    TscCalibrator cal;
    uint64_t start = rdtsc();
    // Measure some work...
    volatile double x = 1.0;
    for (int i = 0; i < 1000; ++i) x *= 1.000001;
    uint64_t stop = rdtsc();
    std::cout << "Elapsed: " << cal.ticks_to_ns(stop - start) << " ns\\n";
}`,
    explanation:
      "RDTSC has ~1ns precision and zero kernel overhead, making it the industry standard for latency histogramming in HFT gateways. Calibrating against `std::chrono` at startup converts ticks to nanoseconds without relying on the OS timer interrupt — important on kernels with `nohz_full` isolation where the `clock_gettime` syscall may be disabled on certain cores.",
  },
  {
    id: "cpp-20260717-b1-optional-pricer",
    language: "cpp",
    title: "std::optional Chaining for Pricer Pipeline",
    tag: "generics",
    code: `#include <optional>
#include <cmath>
#include <string>
#include <iostream>

struct MarketData {
    double spot, rate, vol, time_to_expiry;
};

// Each stage returns nullopt on invalid input instead of throwing.
// Chain with and_then (C++23) or manual monadic composition.

std::optional<double> validate(const MarketData& md) {
    if (md.spot <= 0 || md.vol <= 0 || md.time_to_expiry <= 0) return std::nullopt;
    return md.spot;   // pass-through on success
}

std::optional<double> compute_d1(const MarketData& md) {
    if (!validate(md)) return std::nullopt;
    return (std::log(md.spot / md.spot) // simplified: ATM => d1 = ...
            + (md.rate + 0.5 * md.vol * md.vol) * md.time_to_expiry)
           / (md.vol * std::sqrt(md.time_to_expiry));
}

// Manual monadic chain: pipe optional through a lambda
template<typename T, typename F>
auto and_then(std::optional<T> opt, F f) -> std::invoke_result_t<F, T> {
    if (!opt) return std::nullopt;
    return f(*opt);
}

std::optional<double> price_call(const MarketData& md, double K) {
    return and_then(validate(md), [&](double /*spot*/) -> std::optional<double> {
        double sqT = std::sqrt(md.time_to_expiry);
        double d1  = (std::log(md.spot / K) + (md.rate + 0.5*md.vol*md.vol)*md.time_to_expiry)
                     / (md.vol * sqT);
        double d2  = d1 - md.vol * sqT;
        // Approximation of N(d): skip full CDF for brevity
        auto ncdf = [](double x){ return 0.5 * std::erfc(-x * M_SQRT1_2); };
        return md.spot * ncdf(d1) - K * std::exp(-md.rate*md.time_to_expiry) * ncdf(d2);
    });
}

int main() {
    MarketData md{100.0, 0.05, 0.20, 1.0};
    if (auto p = price_call(md, 100.0))
        std::cout << "Call price: " << *p << "\\n";
    else
        std::cout << "Invalid market data\\n";
    // Invalid case:
    MarketData bad{-1.0, 0.05, 0.20, 1.0};
    auto p2 = price_call(bad, 100.0);
    std::cout << "Bad input: " << (p2 ? "got price" : "nullopt") << "\\n";
}`,
    explanation:
      "Expressing the pricer pipeline as `optional`-returning stages turns error handling from exception-driven to value-driven: each stage propagates `nullopt` without unwinding the stack, and callers can distinguish 'bad input' from 'negative price' without exception overhead. C++23 formalises this as `std::optional::and_then`.",
  },
  {
    id: "cpp-20260717-b1-atomic-risk",
    language: "cpp",
    title: "Atomic Real-Time Position & Risk Limit Check",
    tag: "low-latency",
    code: `#include <atomic>
#include <cstdint>
#include <stdexcept>
#include <iostream>

// Hot-path position tracker with lock-free risk check.
// Uses fetch_add for O(1) update + compare_exchange for limit enforcement.

class PositionManager {
    std::atomic<int64_t> net_position_{0};   // signed shares / contracts
    std::atomic<int64_t> gross_exposure_{0}; // sum of |position| per leg
    const int64_t pos_limit_;
    const int64_t gross_limit_;

public:
    explicit PositionManager(int64_t pos_limit, int64_t gross_limit)
        : pos_limit_(pos_limit), gross_limit_(gross_limit) {}

    // Returns true and updates position if within limits; false otherwise.
    // Hot path: two atomic fetches + one compare for the limit check.
    bool try_fill(int64_t qty) {  // positive = buy, negative = sell
        int64_t new_net = net_position_.fetch_add(qty, std::memory_order_acq_rel) + qty;
        if (new_net > pos_limit_ || new_net < -pos_limit_) {
            net_position_.fetch_sub(qty, std::memory_order_release);  // rollback
            return false;
        }
        int64_t new_gross = gross_exposure_.fetch_add(
            qty > 0 ? qty : -qty, std::memory_order_acq_rel) + (qty > 0 ? qty : -qty);
        if (new_gross > gross_limit_) {
            net_position_.fetch_sub(qty, std::memory_order_release);
            gross_exposure_.fetch_sub(qty > 0 ? qty : -qty, std::memory_order_release);
            return false;
        }
        return true;
    }

    int64_t net()   const { return net_position_.load(std::memory_order_acquire); }
    int64_t gross() const { return gross_exposure_.load(std::memory_order_acquire); }
};

int main() {
    PositionManager pm(1000, 2000);
    std::cout << pm.try_fill(500)   << " net=" << pm.net() << "\\n"; // true
    std::cout << pm.try_fill(600)   << " net=" << pm.net() << "\\n"; // false (>1000)
    std::cout << pm.try_fill(-200)  << " net=" << pm.net() << "\\n"; // true
}`,
    explanation:
      "Using `fetch_add` for position updates and a rollback on limit breach avoids a mutex on the critical path while keeping the risk check accurate under concurrent fills. The acquire-release pairing ensures that a thread seeing the updated `net_position_` also sees any preceding writes from the filler thread.",
  },
  {
    id: "cpp-20260717-b1-stl-pool-alloc",
    language: "cpp",
    title: "Stateful Pool Allocator for STL Containers",
    tag: "memory",
    code: `#include <vector>
#include <list>
#include <cstddef>
#include <cstdlib>
#include <new>
#include <iostream>

// A bump-pointer arena that STL containers can use as their allocator.
// Ideal for short-lived order collections that are reset between sessions.
struct Arena {
    char*       buf;
    std::size_t cap;
    std::size_t used{0};

    Arena(std::size_t bytes) : buf(new char[bytes]), cap(bytes) {}
    ~Arena() { delete[] buf; }

    void* alloc(std::size_t n, std::size_t align) {
        std::size_t aligned = (used + align - 1) & ~(align - 1);
        if (aligned + n > cap) throw std::bad_alloc{};
        used = aligned + n;
        return buf + aligned;
    }
    void reset() { used = 0; }  // O(1) bulk free
};

template<typename T>
struct ArenaAlloc {
    using value_type = T;
    Arena* arena;

    explicit ArenaAlloc(Arena* a) noexcept : arena(a) {}
    template<typename U> ArenaAlloc(const ArenaAlloc<U>& o) noexcept : arena(o.arena) {}

    T* allocate(std::size_t n) {
        return static_cast<T*>(arena->alloc(n * sizeof(T), alignof(T)));
    }
    void deallocate(T*, std::size_t) noexcept {}  // no-op: arena owns memory
    bool operator==(const ArenaAlloc& o) const { return arena == o.arena; }
};

int main() {
    Arena arena(64 * 1024);  // 64 KB scratch space
    std::vector<double, ArenaAlloc<double>> prices(ArenaAlloc<double>(&arena));
    prices.reserve(1000);
    for (int i = 0; i < 1000; ++i) prices.push_back(100.0 + i * 0.01);
    std::cout << "Used " << arena.used << " bytes for " << prices.size() << " prices\\n";
    arena.reset();  // free everything in O(1)
}`,
    explanation:
      "A bump-pointer arena allocator makes `push_back` on `std::vector` a pointer increment — no `malloc` system call, no free-list overhead. The critical benefit for trading systems is the O(1) bulk reset: at end-of-session, resetting the arena pointer discards all per-session order objects instantly without calling individual destructors.",
  },
  {
    id: "cpp-20260717-b1-pmr-order-list",
    language: "cpp",
    title: "std::pmr::list for Order Level Management",
    tag: "memory",
    code: `#include <memory_resource>
#include <list>
#include <iostream>
#include <cstddef>

// Order at a single price level
struct Order {
    uint64_t order_id;
    double   price;
    int      qty;
    bool     is_buy;
};

// Per-level order queue backed by a monotonic buffer (no heap calls)
class PriceLevel {
    alignas(64) char buf_[4096];              // 4 KB stack buffer
    std::pmr::monotonic_buffer_resource mbr_{buf_, sizeof(buf_)};
    std::pmr::list<Order> orders_{&mbr_};     // list nodes from the buffer

public:
    void add(Order o)       { orders_.push_back(o); }
    void remove(uint64_t id) {
        orders_.remove_if([id](const Order& o){ return o.order_id == id; });
    }
    int total_qty() const {
        int sum = 0;
        for (const auto& o : orders_) sum += o.qty;
        return sum;
    }
    std::size_t count() const { return orders_.size(); }
};

int main() {
    PriceLevel level;
    level.add({1001, 100.50, 200, true});
    level.add({1002, 100.50, 300, true});
    std::cout << "Level qty: " << level.total_qty() << "\\n";  // 500
    level.remove(1001);
    std::cout << "After cancel: " << level.total_qty() << "\\n";  // 300
}`,
    explanation:
      "By binding `std::pmr::list` to a `monotonic_buffer_resource` backed by a stack array, each node allocation is a pointer increment into the pre-allocated buffer — the OS sees zero heap syscalls after the price level is constructed. This is the C++17 PMR pattern for embedding allocator state in an object without requiring custom allocators in every dependent type.",
  },
  {
    id: "cpp-20260717-b1-simd-portfolio-beta",
    language: "cpp",
    title: "SIMD AVX2 Dot Product for Portfolio Beta",
    tag: "SIMD",
    code: `#ifdef __AVX2__
#include <immintrin.h>
#endif
#include <vector>
#include <cstddef>
#include <numeric>
#include <iostream>

// Compute portfolio beta = sum(weights * asset_betas) using AVX2 FMA
// for a large factor model (e.g. 512-asset portfolio)
double portfolio_beta_avx2(const float* weights, const float* betas,
                            std::size_t n) {
#ifdef __AVX2__
    __m256 acc = _mm256_setzero_ps();
    std::size_t i = 0;
    for (; i + 8 <= n; i += 8) {
        __m256 w = _mm256_loadu_ps(weights + i);
        __m256 b = _mm256_loadu_ps(betas   + i);
        // Fused multiply-add: acc += w * b (no round-trip through memory)
        acc = _mm256_fmadd_ps(w, b, acc);
    }
    // Horizontal sum of 8 floats in acc
    __m128 lo = _mm256_castps256_ps128(acc);
    __m128 hi = _mm256_extractf128_ps(acc, 1);
    __m128 sum4 = _mm_add_ps(lo, hi);
    sum4 = _mm_hadd_ps(sum4, sum4);
    sum4 = _mm_hadd_ps(sum4, sum4);
    float result = _mm_cvtss_f32(sum4);
    // Scalar tail
    for (; i < n; ++i) result += weights[i] * betas[i];
    return static_cast<double>(result);
#else
    double s = 0.0;
    for (std::size_t i = 0; i < n; ++i) s += weights[i] * betas[i];
    return s;
#endif
}

int main() {
    const int N = 512;
    std::vector<float> w(N, 1.0f / N), b(N, 1.2f);
    double beta = portfolio_beta_avx2(w.data(), b.data(), N);
    std::cout << "Portfolio beta: " << beta << "\\n";  // ~1.2
}`,
    explanation:
      "AVX2 FMA processes 8 float multiplications in a single instruction with no intermediate rounding, making the dot product ~8x faster than scalar code for large factor portfolios. The horizontal reduction at the end uses `_mm_hadd_ps` to collapse the 8-lane accumulator — this is the standard pattern for finishing a vectorised reduction.",
  },
  {
    id: "cpp-20260717-b1-bellman-ford-fx",
    language: "cpp",
    title: "Bellman-Ford Negative Cycle for FX Arbitrage",
    tag: "algorithms",
    code: `#include <vector>
#include <cmath>
#include <limits>
#include <iostream>
#include <string>

// Detect FX arbitrage: a sequence of currency conversions that ends
// with more of the starting currency (negative-weight cycle in -log space).
struct Edge {
    int u, v;
    double w;   // -log(rate[u][v])
};

bool find_arbitrage(int n_currencies,
                    const std::vector<std::vector<double>>& rates,
                    std::vector<int>& cycle_nodes) {
    std::vector<Edge> edges;
    for (int i = 0; i < n_currencies; ++i)
        for (int j = 0; j < n_currencies; ++j)
            if (i != j && rates[i][j] > 0)
                edges.push_back({i, j, -std::log(rates[i][j])});

    // Virtual source: set all initial distances to 0 (reachable from anywhere)
    std::vector<double> dist(n_currencies, 0.0);
    std::vector<int>    pred(n_currencies, -1);

    // Relax N-1 times
    for (int iter = 0; iter < n_currencies - 1; ++iter)
        for (const auto& e : edges)
            if (dist[e.u] + e.w < dist[e.v]) {
                dist[e.v] = dist[e.u] + e.w;
                pred[e.v] = e.u;
            }

    // N-th relaxation: any improvement reveals a negative cycle
    int cycle_start = -1;
    for (const auto& e : edges)
        if (dist[e.u] + e.w < dist[e.v] - 1e-10) {
            cycle_start = e.v;
            break;
        }

    if (cycle_start == -1) return false;

    // Walk pred[] backwards to find cycle
    std::vector<bool> visited(n_currencies, false);
    int cur = cycle_start;
    for (int i = 0; i < n_currencies; ++i) cur = pred[cur]; // skip tail
    int start = cur;
    do {
        cycle_nodes.push_back(cur);
        cur = pred[cur];
    } while (cur != start);
    cycle_nodes.push_back(start);
    return true;
}

int main() {
    // USD->EUR->GBP->USD with small arbitrage
    std::vector<std::vector<double>> rates = {
        {1.0, 1.5, 1.0},
        {0.7, 1.0, 1.5},
        {1.0, 0.7, 1.0}
    };
    std::vector<int> cycle;
    bool arb = find_arbitrage(3, rates, cycle);
    std::cout << "Arbitrage: " << (arb ? "YES" : "NO") << "\\n";
}`,
    explanation:
      "Taking `-log(rate)` converts currency multiplication chains to addition, turning 'find a profitable cycle' into 'find a negative-weight cycle' — the classic Bellman-Ford post-condition. The virtual source trick initialises all distances to 0 so a negative cycle reachable from *any* currency is found without trying every starting point.",
  },
  {
    id: "cpp-20260717-b1-udp-multicast",
    language: "cpp",
    title: "UDP Multicast Market Data Receiver",
    tag: "networking",
    code: `#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <net/if.h>
#include <cstring>
#include <cstdio>
#include <unistd.h>

// Join a multicast group and receive market data packets (Linux/POSIX).
// Typical HFT stack: kernel-bypass (Solarflare/Exablaze) replaces this,
// but the socket API is the fallback and interview reference.

int open_multicast_receiver(const char* group_ip,
                             uint16_t    port,
                             const char* iface_name)
{
    int fd = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (fd < 0) return -1;

    // SO_REUSEADDR lets multiple processes bind the same port
    int yes = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

    sockaddr_in addr{};
    addr.sin_family      = AF_INET;
    addr.sin_port        = htons(port);
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    if (bind(fd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0) {
        close(fd); return -1;
    }

    // Join multicast group on the specified interface
    ip_mreq mreq{};
    inet_pton(AF_INET, group_ip, &mreq.imr_multiaddr);
    mreq.imr_interface.s_addr = htonl(INADDR_ANY);
    if (*iface_name) {
        // Optionally pin to a specific NIC for deterministic latency
        unsigned int idx = if_nametoindex(iface_name);
        ip_mreqn mreqn{};
        mreqn.imr_multiaddr = mreq.imr_multiaddr;
        mreqn.imr_ifindex   = static_cast<int>(idx);
        setsockopt(fd, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreqn, sizeof(mreqn));
    } else {
        setsockopt(fd, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq));
    }

    return fd;
}

void recv_loop(int fd, char* buf, std::size_t bufsz) {
    while (true) {
        ssize_t n = recv(fd, buf, bufsz, 0);
        if (n > 0) {
            // parse market data frame here (e.g. MDP 3.0 SBE messages)
            (void)n;
        }
    }
}`,
    explanation:
      "Binding to `INADDR_ANY` then joining the multicast group (rather than binding to the multicast address itself) is the portable idiom that works across Linux and BSD. Pinning to a specific NIC via `ip_mreqn.imr_ifindex` prevents the kernel from choosing the interface on a machine with multiple NICs — critical for deterministic latency on dedicated market-data cards.",
  },
  {
    id: "cpp-20260717-b1-type-erase-pricer",
    language: "cpp",
    title: "Type Erasure for Pluggable Option Pricers",
    tag: "generics",
    code: `#include <functional>
#include <memory>
#include <cmath>
#include <iostream>
#include <string>

// ── Type-erased pricer ─────────────────────────────────────────────
// Stores any callable/model that implements (S,K,r,T,sigma)->double
// without exposing a base class to callers.
class Pricer {
    std::function<double(double,double,double,double,double)> impl_;
    std::string name_;
public:
    template<typename F>
    Pricer(std::string name, F&& f)
        : impl_(std::forward<F>(f)), name_(std::move(name)) {}

    double price(double S, double K, double r, double T, double sigma) const {
        return impl_(S, K, r, T, sigma);
    }
    const std::string& name() const { return name_; }
};

// Two concrete models; neither inherits from anything
double bs_call_price(double S, double K, double r, double T, double sigma) {
    auto ncdf = [](double x){ return 0.5 * std::erfc(-x * M_SQRT1_2); };
    double sqT = std::sqrt(T);
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double d2 = d1 - sigma * sqT;
    return S * ncdf(d1) - K * std::exp(-r * T) * ncdf(d2);
}

double bachelier_call_price(double S, double K, double r, double T, double sigma) {
    // Normal model (used for negative rates)
    auto nd = [](double x){ return 0.5 * std::erfc(-x * M_SQRT1_2); };
    double F = S * std::exp(r * T);
    double vol = sigma * std::sqrt(T);
    double d  = (F - K) / vol;
    return std::exp(-r * T) * ((F - K) * nd(d) + vol * std::exp(-0.5*d*d) / std::sqrt(2*M_PI));
}

int main() {
    std::vector<Pricer> models = {
        Pricer("Black-Scholes", bs_call_price),
        Pricer("Bachelier",     bachelier_call_price),
    };
    for (auto& m : models)
        std::cout << m.name() << " call: " << m.price(100,100,0.05,1.0,0.20) << "\\n";
}`,
    explanation:
      "Wrapping pricers in `std::function` achieves type erasure without a virtual base class: models can be lambdas, function pointers, or functor objects, all interchangeable at runtime. The cost is one virtual dispatch per `price()` call — acceptable for EOD Greeks computation but replace with a tagged union or direct template dispatch in the hot path.",
  },
  {
    id: "cpp-20260717-b1-mempool-order",
    language: "cpp",
    title: "Fixed-Size Memory Pool (Free-List) for Order Allocation",
    tag: "memory",
    code: `#include <cstddef>
#include <cassert>
#include <cstdlib>
#include <new>
#include <iostream>

// Pool allocator for a fixed-size type T.
// Pre-allocates CAPACITY objects; allocation/deallocation are O(1) pointer ops.
template<typename T, std::size_t CAPACITY>
class MemPool {
    union Slot {
        alignas(T) char storage[sizeof(T)];
        Slot* next;
    };

    Slot slots_[CAPACITY];
    Slot* free_head_{nullptr};

public:
    MemPool() {
        // Build free list through all slots
        for (std::size_t i = 0; i < CAPACITY - 1; ++i)
            slots_[i].next = &slots_[i + 1];
        slots_[CAPACITY - 1].next = nullptr;
        free_head_ = &slots_[0];
    }

    T* alloc() {
        if (!free_head_) return nullptr;   // pool exhausted
        Slot* s = free_head_;
        free_head_ = s->next;
        return reinterpret_cast<T*>(s->storage);
    }

    void free(T* p) {
        p->~T();   // explicit destructor call
        Slot* s = reinterpret_cast<Slot*>(p);
        s->next  = free_head_;
        free_head_ = s;
    }

    template<typename... Args>
    T* construct(Args&&... args) {
        T* p = alloc();
        if (!p) throw std::bad_alloc{};
        return new(p) T(std::forward<Args>(args)...);  // placement new
    }
};

struct Order { uint64_t id; double price; int qty; };

int main() {
    MemPool<Order, 1024> pool;
    Order* o1 = pool.construct(1001ULL, 100.25, 500);
    Order* o2 = pool.construct(1002ULL,  99.75, 300);
    std::cout << "o1 price=" << o1->price << " o2 qty=" << o2->qty << "\\n";
    pool.free(o1);  // O(1), slot returns to free list
    pool.free(o2);
}`,
    explanation:
      "A free-list pool pre-allocates all objects at startup; subsequent alloc/free are single pointer operations that touch no kernel code. Because `sizeof(Slot) == sizeof(T)`, the free-list pointer is stored in the same memory as the unused object — there is zero overhead per slot beyond the object itself.",
  },
  {
    id: "cpp-20260717-b1-async-batch-greeks",
    language: "cpp",
    title: "Parallel Batch Greeks with std::async",
    tag: "concurrency",
    code: `#include <future>
#include <vector>
#include <cmath>
#include <iostream>
#include <numeric>

struct Option { double S, K, r, T, sigma; };
struct Greeks { double delta, gamma, vega, theta; };

// Compute Black-Scholes Greeks for a single option
Greeks compute_greeks(const Option& o) {
    auto ncdf = [](double x){ return 0.5 * std::erfc(-x * M_SQRT1_2); };
    auto npdf = [](double x){ return std::exp(-0.5*x*x) / std::sqrt(2.0*M_PI); };
    double sqT = std::sqrt(o.T);
    double d1  = (std::log(o.S/o.K) + (o.r + 0.5*o.sigma*o.sigma)*o.T) / (o.sigma*sqT);
    double d2  = d1 - o.sigma * sqT;
    double df  = std::exp(-o.r * o.T);
    double nd1 = npdf(d1);
    return {
        ncdf(d1),                            // delta
        nd1 / (o.S * o.sigma * sqT),         // gamma
        o.S * nd1 * sqT,                     // vega (per 1 vol)
        -(o.S * nd1 * o.sigma / (2*sqT)) - o.r * o.K * df * ncdf(d2)  // theta
    };
}

// Fan out Greek computation across a thread pool via std::async
std::vector<Greeks> batch_greeks(const std::vector<Option>& opts) {
    std::vector<std::future<Greeks>> futs;
    futs.reserve(opts.size());
    for (const auto& o : opts)
        futs.push_back(std::async(std::launch::async, compute_greeks, o));
    std::vector<Greeks> result;
    result.reserve(opts.size());
    for (auto& f : futs)
        result.push_back(f.get());
    return result;
}

int main() {
    std::vector<Option> book(100, {100,100,0.05,1.0,0.20});
    auto gs = batch_greeks(book);
    double total_vega = 0.0;
    for (auto& g : gs) total_vega += g.vega;
    std::cout << "Portfolio vega: " << total_vega << "\\n";
}`,
    explanation:
      "`std::async(std::launch::async, ...)` spawns a thread per option (or re-uses from a pool on most STL implementations). For EOD Greeks on a book of hundreds of options, the fan-out pattern reduces wall time proportional to core count. Replace with a thread pool and `std::packaged_task` to avoid per-call thread overhead for books >10k options.",
  },
  {
    id: "cpp-20260717-b1-sparse-risk",
    language: "cpp",
    title: "Sparse Risk Vector for Large-Factor Portfolio",
    tag: "numerics",
    code: `#include <unordered_map>
#include <vector>
#include <string>
#include <cmath>
#include <iostream>

// A portfolio with M positions exposed to N risk factors (N >> M).
// Dense N-vector wastes memory; sparse map only stores non-zero exposures.

struct SparseRiskVec {
    std::unordered_map<std::string, double> factors;  // factor_id -> exposure

    void add(const std::string& f, double v) { factors[f] += v; }

    // Dot product with a dense factor covariance row (for portfolio variance)
    double dot(const std::unordered_map<std::string, double>& other) const {
        double sum = 0.0;
        for (const auto& [f, v] : factors) {
            auto it = other.find(f);
            if (it != other.end()) sum += v * it->second;
        }
        return sum;
    }

    // L2 norm as proxy for total factor risk
    double norm() const {
        double s = 0.0;
        for (const auto& [f, v] : factors) s += v * v;
        return std::sqrt(s);
    }

    // Net two risk vectors (for hedge netting)
    SparseRiskVec operator+(const SparseRiskVec& o) const {
        SparseRiskVec result = *this;
        for (const auto& [f, v] : o.factors) result.factors[f] += v;
        return result;
    }
};

int main() {
    SparseRiskVec pos;
    pos.add("MktBeta", 0.80);
    pos.add("SMB",     0.30);
    pos.add("HML",    -0.15);
    pos.add("Mom",     0.50);

    SparseRiskVec hedge;
    hedge.add("MktBeta", -0.80);   // delta-hedge market beta
    auto net = pos + hedge;
    std::cout << "Net risk L2 norm: " << net.norm() << "\\n";
}`,
    explanation:
      "Factor models with hundreds or thousands of factors (BARRA, Axioma) produce risk exposures sparse across the factor set — an individual equity touches maybe 30 of 3000 factors. A sparse map reduces memory from O(N) to O(non-zero) and makes the dot product O(min(nnz_a, nnz_b)), which is critical when netting thousands of positions nightly.",
  },
  {
    id: "cpp-20260717-b1-structured-bindings",
    language: "cpp",
    title: "Structured Bindings for Order Book Entries",
    tag: "modern-cpp",
    code: `#include <map>
#include <tuple>
#include <vector>
#include <iostream>

// Structured bindings (C++17) give readable names to tuple/pair fields
// without intermediate variables — especially ergonomic in range-for loops
// over containers like std::map.

struct OrderLevel {
    int    qty;
    int    order_count;
    double total_value;
};

int main() {
    // std::map<price, OrderLevel> simulates a sorted order book side
    std::map<double, OrderLevel, std::greater<double>> bids = {
        {100.50, {500, 3, 50250.0}},
        {100.25, {300, 2, 30075.0}},
        {100.00, {800, 5, 80000.0}},
    };

    // Structured binding on map iterator: auto& [key, value]
    for (const auto& [price, level] : bids)
        std::cout << "Bid " << price
                  << " qty=" << level.qty
                  << " orders=" << level.order_count << "\\n";

    // Structured binding from std::pair (e.g. insert result)
    auto [it, inserted] = bids.insert_or_assign(99.75, OrderLevel{200, 1, 19950.0});
    std::cout << "Inserted=" << inserted << " price=" << it->first << "\\n";

    // With tuple decomposition for complex returns
    auto top_of_book = [&]() -> std::tuple<double, int, double> {
        const auto& [px, lvl] = *bids.begin();
        return {px, lvl.qty, lvl.total_value};
    };
    auto [best_bid, tob_qty, tob_val] = top_of_book();
    std::cout << "TOB: " << best_bid << " x " << tob_qty << "\\n";
}`,
    explanation:
      "Structured bindings eliminate `.first`/`.second` gymnastics and allow the compiler to see that names like `price` and `level` alias the same storage as the map node, enabling it to elide copies. The `[it, inserted]` pattern from `insert_or_assign` is the canonical C++17 way to distinguish inserts from updates in a hot-path handler.",
  },
  {
    id: "cpp-20260717-b1-concept-serialisable",
    language: "cpp",
    title: "C++20 Concept for Serialisable Market Messages",
    tag: "concepts",
    code: `#include <concepts>
#include <cstddef>
#include <cstdint>
#include <span>
#include <iostream>

// A type satisfies Serialisable if it exposes:
//   - static constexpr size_t byte_size
//   - void serialise(std::byte* dst) const
//   - static T deserialise(const std::byte* src)
template<typename T>
concept Serialisable = requires(const T msg, std::byte* dst, const std::byte* src) {
    { T::byte_size  } -> std::convertible_to<std::size_t>;
    { msg.serialise(dst) } -> std::same_as<void>;
    { T::deserialise(src) } -> std::same_as<T>;
};

// A minimal FIX-style new-order message
struct NewOrder {
    uint64_t order_id;
    int32_t  qty;
    double   price;
    bool     is_buy;

    static constexpr std::size_t byte_size = 8 + 4 + 8 + 1;  // 21 bytes

    void serialise(std::byte* dst) const {
        std::memcpy(dst,      &order_id, 8);
        std::memcpy(dst +  8, &qty,      4);
        std::memcpy(dst + 12, &price,    8);
        dst[20] = static_cast<std::byte>(is_buy ? 1 : 0);
    }
    static NewOrder deserialise(const std::byte* src) {
        NewOrder o{};
        std::memcpy(&o.order_id, src,      8);
        std::memcpy(&o.qty,      src +  8, 4);
        std::memcpy(&o.price,    src + 12, 8);
        o.is_buy = (src[20] != std::byte{0});
        return o;
    }
};

static_assert(Serialisable<NewOrder>, "NewOrder must satisfy Serialisable");

template<Serialisable Msg>
void write_to_wire(const Msg& m, std::byte* buf) {
    m.serialise(buf);
}`,
    explanation:
      "Concepts replace SFINAE-based dispatch for protocol message traits: the compiler error at `static_assert(Serialisable<T>)` pinpoints exactly which methods are missing, rather than emitting a template instantiation cascade. Requiring `byte_size` as a `constexpr` member lets `write_to_wire` statically bound-check or stack-allocate the buffer without a runtime size query.",
  },
  {
    id: "cpp-20260717-b1-coro-producer",
    language: "cpp",
    title: "C++20 Coroutine Generator for Market Event Stream",
    tag: "concurrency",
    code: `#include <coroutine>
#include <optional>
#include <iostream>
#include <vector>

// Minimal generator<T> coroutine type (C++23 has std::generator; this
// is a hand-rolled version for C++20 environments).

template<typename T>
struct Generator {
    struct promise_type;
    using handle_type = std::coroutine_handle<promise_type>;

    struct promise_type {
        T current_value;
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        Generator           get_return_object() {
            return Generator{handle_type::from_promise(*this)};
        }
        std::suspend_always yield_value(T v) {
            current_value = v;
            return {};
        }
        void return_void() {}
        void unhandled_exception() {}
    };

    handle_type coro_;
    explicit Generator(handle_type h) : coro_(h) {}
    ~Generator() { if (coro_) coro_.destroy(); }

    bool next() {
        if (!coro_ || coro_.done()) return false;
        coro_.resume();
        return !coro_.done();
    }
    T value() const { return coro_.promise().current_value; }
};

// Market tick producer: simulates a live tick stream
Generator<double> tick_feed(const std::vector<double>& prices) {
    for (double p : prices) {
        co_yield p;   // suspends here each iteration
    }
}

int main() {
    std::vector<double> ticks = {100.1, 100.3, 99.8, 100.5, 101.0};
    auto feed = tick_feed(ticks);
    while (feed.next())
        std::cout << "Tick: " << feed.value() << "\\n";
}`,
    explanation:
      "A `co_yield`-based generator suspends at each tick, resuming only when the consumer calls `next()` — there is no thread, no queue, and no locking. The coroutine stack frame lives on the heap but is extremely lightweight (~64 bytes for this generator), making it practical to run thousands of concurrent instrument feeds as coroutines rather than OS threads.",
  },
  {
    id: "cpp-20260717-b1-argsort-rank",
    language: "cpp",
    title: "Argsort / Cross-Sectional Rank for Signal Normalisation",
    tag: "algorithms",
    code: `#include <algorithm>
#include <numeric>
#include <vector>
#include <iostream>

// Compute rank (0-based) of each element by sorted order.
// Used in cross-sectional momentum: rank(alpha) -> position weights.
std::vector<int> argsort(const std::vector<double>& v) {
    std::vector<int> idx(v.size());
    std::iota(idx.begin(), idx.end(), 0);
    // Sort indices by their value in v (ascending)
    std::sort(idx.begin(), idx.end(),
              [&](int a, int b){ return v[a] < v[b]; });
    return idx;
}

// Convert raw alpha scores to z-score ranks in [-0.5, +0.5]
std::vector<double> rank_normalise(const std::vector<double>& alphas) {
    int n = static_cast<int>(alphas.size());
    std::vector<int>    idx   = argsort(alphas);
    std::vector<double> ranks(n);
    for (int rank = 0; rank < n; ++rank) {
        // Map rank [0, N-1] to [-0.5, +0.5]
        ranks[idx[rank]] = (rank / static_cast<double>(n - 1)) - 0.5;
    }
    return ranks;
}

// Long-short weights: long top-half, short bottom-half, dollar-neutral
std::vector<double> ls_weights(const std::vector<double>& alphas) {
    auto r = rank_normalise(alphas);
    // Demean and scale so abs(weights) sum to 1
    double abs_sum = 0.0;
    for (double v : r) abs_sum += (v > 0 ? v : -v);
    for (double& v : r) v /= abs_sum;
    return r;
}

int main() {
    std::vector<double> alpha = {0.3, -0.1, 0.8, 0.0, -0.5, 0.2};
    auto w = ls_weights(alpha);
    for (int i = 0; i < (int)alpha.size(); ++i)
        std::cout << "asset[" << i << "] alpha=" << alpha[i]
                  << " weight=" << w[i] << "\\n";
}`,
    explanation:
      "Rank-normalising alpha scores before computing weights removes the raw signal's scale and distribution, making portfolios constructed on different days comparable and eliminating the need to calibrate a signal-to-weight translation function. Dollar-neutrality (positive and negative weights sum to zero independently) eliminates market-beta exposure from the resulting portfolio.",
  },
  {
    id: "cpp-20260717-b1-order-book-array",
    language: "cpp",
    title: "Price-Indexed Array Order Book for Tight Bid-Ask Ladder",
    tag: "data-structures",
    code: `#include <array>
#include <cstdint>
#include <cstddef>
#include <iostream>

// For assets with a fixed tick size and bounded price range,
// a direct price-indexed array provides O(1) add/cancel/query.
// E.g. AAPL tick=0.01, range 0-1000$ => 100'000 levels.

static constexpr double TICK    = 0.01;
static constexpr int    LEVELS  = 200'000;  // 0.01 .. 2000.00

inline int price_to_idx(double price) {
    return static_cast<int>(price / TICK + 0.5);
}
inline double idx_to_price(int idx) {
    return idx * TICK;
}

struct Level {
    int32_t qty{0};
    int16_t order_count{0};
};

class ArrayOrderBook {
    std::array<Level, LEVELS> bids_{};
    std::array<Level, LEVELS> asks_{};
    int best_bid_idx_{0}, best_ask_idx_{LEVELS - 1};

public:
    // O(1) add: increment qty and count at the price index
    void add_order(bool is_buy, double price, int qty) {
        int idx = price_to_idx(price);
        auto& lvl = is_buy ? bids_[idx] : asks_[idx];
        lvl.qty += qty;
        ++lvl.order_count;
        if (is_buy  && idx > best_bid_idx_) best_bid_idx_ = idx;
        if (!is_buy && idx < best_ask_idx_) best_ask_idx_ = idx;
    }

    // O(1) cancel: decrement; update best only when level empties
    void cancel_order(bool is_buy, double price, int qty) {
        int idx = price_to_idx(price);
        auto& lvl = is_buy ? bids_[idx] : asks_[idx];
        lvl.qty -= qty;
        --lvl.order_count;
        // Update best price lazily when the level drains
        if (lvl.qty == 0) {
            if (is_buy)  while (best_bid_idx_ > 0 && bids_[best_bid_idx_].qty == 0) --best_bid_idx_;
            if (!is_buy) while (best_ask_idx_ < LEVELS-1 && asks_[best_ask_idx_].qty == 0) ++best_ask_idx_;
        }
    }

    double best_bid() const { return idx_to_price(best_bid_idx_); }
    double best_ask() const { return idx_to_price(best_ask_idx_); }
};

int main() {
    ArrayOrderBook book;
    book.add_order(true,  100.50, 200);
    book.add_order(false, 100.51, 150);
    std::cout << "Bid: " << book.best_bid() << "  Ask: " << book.best_ask() << "\\n";
}`,
    explanation:
      "Direct addressing by price index eliminates hash or tree lookups entirely — an order update is two array writes plus a branch. The memory cost (200k × 6 bytes = 1.2 MB per side) fits in L3 cache for a single instrument, making this design preferred over hash maps for equities and futures with fixed tick sizes and bounded price ranges.",
  },
];
