import type { Snippet } from "./types";

export const cppSnippets20260612B1: Snippet[] = [
  {
    id: "cpp-20260612-b1-spsc-ring",
    language: "cpp",
    title: "SPSC lock-free ring buffer — Vyukov-style with cache-line separation",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <cstddef>

// Single-Producer Single-Consumer (SPSC) ring buffer.
// head_ is written by the producer; tail_ is written by the consumer.
// Padding to separate them onto different cache lines prevents false sharing:
// without padding, writing head_ would invalidate tail_'s cache line on the
// consumer core, causing an expensive cache-coherence round trip on every op.

template<typename T, std::size_t Cap>
class SPSCRing {
    static_assert((Cap & (Cap - 1)) == 0, "Cap must be power of 2");
    static constexpr std::size_t Mask = Cap - 1;

    alignas(64) std::atomic<std::size_t> head_{0};  // producer writes
    char                                 _pad[56];   // fill cache line
    alignas(64) std::atomic<std::size_t> tail_{0};  // consumer writes
    std::array<T, Cap>                   buf_{};

public:
    // Producer thread only.
    bool push(const T& v) noexcept {
        const std::size_t h = head_.load(std::memory_order_relaxed);
        // acquire: see all consumer writes before this load
        if (h - tail_.load(std::memory_order_acquire) == Cap)
            return false;    // full
        buf_[h & Mask] = v;
        head_.store(h + 1, std::memory_order_release);  // publish slot
        return true;
    }

    // Consumer thread only.
    bool pop(T& v) noexcept {
        const std::size_t t = tail_.load(std::memory_order_relaxed);
        if (head_.load(std::memory_order_acquire) == t)
            return false;    // empty
        v = buf_[t & Mask];
        tail_.store(t + 1, std::memory_order_release);  // reclaim slot
        return true;
    }

    std::size_t size() const noexcept {
        return head_.load(std::memory_order_acquire)
             - tail_.load(std::memory_order_acquire);
    }
};`,
    explanation:
      "The asymmetry in acquire/release ordering is deliberate: push only needs to acquire tail_ (observe consumer's progress) and release head_ (publish its write), while pop mirrors this. No mutex is needed because each index is owned exclusively by one thread — the producer only ever writes head_ and the consumer only ever writes tail_, so contention is purely read-side (cache coherence), not write-side.",
  },
  {
    id: "cpp-20260612-b1-ranges-pipeline",
    language: "cpp",
    title: "std::ranges lazy pipeline — filter/transform on tick data without allocation",
    tag: "modern",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <cstdint>
#include <numeric>

struct Tick { int64_t ts_ns; double bid; double ask; int64_t volume; };

// std::ranges views are lazy: no intermediate allocation occurs.
// The pipeline below does not materialise any vector until collect().
// Composing views with | is O(1) — just wrapping iterators.

std::vector<double> validMids(const std::vector<Tick>& ticks, double lo, double hi) {
    auto view = ticks
        | std::views::filter([](const Tick& t) {
              return t.bid > 0 && t.ask > t.bid;   // valid spread
          })
        | std::views::transform([](const Tick& t) {
              return 0.5 * (t.bid + t.ask);          // mid price
          })
        | std::views::filter([lo, hi](double mid) {
              return mid >= lo && mid <= hi;          // price band filter
          });

    std::vector<double> out;
    out.reserve(ticks.size());
    std::ranges::copy(view, std::back_inserter(out));
    return out;
}

// Compute VWAP using ranges accumulate-style pattern (C++23 fold_left; C++20: manual)
double vwap(const std::vector<Tick>& ticks) {
    double total_vol = 0.0, notional = 0.0;
    for (auto& t : ticks | std::views::filter([](const Tick& t){ return t.volume > 0; })) {
        double mid = 0.5 * (t.bid + t.ask);
        notional  += mid * static_cast<double>(t.volume);
        total_vol += static_cast<double>(t.volume);
    }
    return total_vol > 0 ? notional / total_vol : 0.0;
}

// iota + transform: generate a synthetic futures roll schedule
std::vector<double> rollSchedule(double spot, double rate, double carry,
                                  int n_months) {
    return std::views::iota(1, n_months + 1)
         | std::views::transform([=](int m) {
               return spot * std::exp((rate - carry) * m / 12.0);
           })
         | std::ranges::to<std::vector>();  // C++23; pre-23: manual copy
}`,
    explanation:
      "Ranges pipelines avoid creating temporary vectors for each filter/transform stage — the view adaptor wraps an iterator pair that evaluates lazily on demand. For a 1M-tick feed the difference between a naive pipeline (three temporary vectors) and a ranges pipeline (zero temporaries) is roughly 3× the memory bandwidth, which matters when the raw data already saturates L3 cache.",
  },
  {
    id: "cpp-20260612-b1-coroutine-generator",
    language: "cpp",
    title: "C++20 coroutine Generator<T> — lazy tick-replay without callbacks",
    tag: "modern",
    code: `#include <coroutine>
#include <utility>
#include <cstddef>

// Minimal Generator<T>: a C++20 coroutine that co_yield's values lazily.
// The coroutine body is suspended at each co_yield; the caller pulls values
// one at a time via next(). No heap allocation per yield (frame reused).

template<typename T>
class Generator {
public:
    struct promise_type {
        T                    current{};
        Generator            get_return_object()     { return Generator{Handle::from_promise(*this)}; }
        std::suspend_always  initial_suspend()        { return {}; }
        std::suspend_always  final_suspend() noexcept { return {}; }
        std::suspend_always  yield_value(T v)         { current = std::move(v); return {}; }
        void                 return_void()            {}
        void                 unhandled_exception()    { std::terminate(); }
    };
    using Handle = std::coroutine_handle<promise_type>;

    explicit Generator(Handle h) : h_(h) {}
    ~Generator() { if (h_) h_.destroy(); }
    Generator(const Generator&) = delete;
    Generator(Generator&& o) noexcept : h_(std::exchange(o.h_, {})) {}

    // Advance to next value; returns false when coroutine is done.
    bool next() { h_.resume(); return !h_.done(); }
    const T& value() const noexcept { return h_.promise().current; }

private:
    Handle h_;
};

// Example: replay ticks from an array with optional time-scaling.
struct Tick { double price; int qty; };

Generator<Tick> replayTicks(const Tick* data, std::size_t n) {
    for (std::size_t i = 0; i < n; ++i)
        co_yield data[i];   // suspends here; caller sees data[i]
}

// Usage:
// auto gen = replayTicks(market_data, N);
// while (gen.next()) {
//     processMarketData(gen.value());
// }
// Benefit over callbacks: linear code flow, no inversion of control,
// no std::function overhead, no heap allocation per tick.`,
    explanation:
      "The coroutine frame is allocated once on the heap at the first call, but each co_yield is a context switch that costs only a few instructions — no heap allocation, no lock, no queue. This pattern replaces the callback-based tick-replay pattern used in event-driven backtesting frameworks, allowing the strategy logic to be written as a simple for-loop while the tick source controls pacing.",
  },
  {
    id: "cpp-20260612-b1-structured-bindings",
    language: "cpp",
    title: "Structured bindings — decompose FIX fields and std::map with zero overhead",
    tag: "modern",
    code: `#include <tuple>
#include <utility>
#include <map>
#include <string_view>
#include <cstdint>
#include <optional>

// C++17 structured bindings (auto [a, b] = expr) decompose aggregates,
// pairs, tuples, and any type with get<> specialisation.
// Zero overhead: the compiler generates the same code as manual member access.

// 1. Decompose a FIX-style tag=value parse result
struct FieldView { int tag; std::string_view value; };

FieldView parseFixField(std::string_view raw) noexcept {
    auto eq = raw.find('=');
    if (eq == std::string_view::npos) return {0, {}};
    // Parse tag as integer (simplified; production: fast_atoi)
    int tag = 0;
    for (char c : raw.substr(0, eq)) tag = tag * 10 + (c - '0');
    return {tag, raw.substr(eq + 1)};
}

void processField(std::string_view raw) {
    auto [tag, value] = parseFixField(raw);   // structured binding
    if (tag == 49)       { /* SenderCompID */ (void)value; }
    else if (tag == 11)  { /* ClOrdID      */ (void)value; }
}

// 2. Iterate a std::map without .first/.second noise
using PriceMap = std::map<int64_t, int64_t>;   // tick -> qty

int64_t totalQtyAbove(const PriceMap& book, int64_t min_ticks) {
    int64_t total = 0;
    for (const auto& [ticks, qty] : book)    // structured binding
        if (ticks >= min_ticks) total += qty;
    return total;
}

// 3. Multiple return values from a function — prefer struct, or use pair/tuple
std::pair<double, double> minMax(const double* data, int n) noexcept {
    double lo = data[0], hi = data[0];
    for (int i = 1; i < n; ++i) {
        if (data[i] < lo) lo = data[i];
        if (data[i] > hi) hi = data[i];
    }
    return {lo, hi};
}

void demo(const double* prices, int n) {
    auto [lo, hi] = minMax(prices, n);    // unpack without std::get<0>()
    (void)lo; (void)hi;
}`,
    explanation:
      "Structured bindings make multiple-return APIs readable without the syntactic noise of .first/.second or std::get<0>() — the compiler sees through the binding to the underlying storage and generates identical code. Binding to const auto& in range-for over a map avoids copying the pair<const Key, Value> and lets the compiler elide the reference entirely when the body is simple.",
  },
  {
    id: "cpp-20260612-b1-cir-zcb",
    language: "cpp",
    title: "CIR model zero-coupon bond — closed-form affine term structure",
    tag: "quant",
    code: `#include <cmath>
#include <vector>

// Cox-Ingersoll-Ross (1985): dr = kappa*(theta - r) dt + sigma*sqrt(r) dW
// Bond price: P(r, 0, T) = A(T) * exp(-B(T) * r)   [affine term structure]
//
// gamma = sqrt(kappa^2 + 2*sigma^2)
// B(T) = 2*(e^{gamma*T} - 1) / [(gamma + kappa)*(e^{gamma*T} - 1) + 2*gamma]
// A(T) = [2*gamma * e^{(kappa+gamma)*T/2} / denom]^{2*kappa*theta/sigma^2}
//
// Feller condition: 2*kappa*theta > sigma^2 ensures r > 0 a.s.

struct CIRParams { double kappa, theta, sigma; };

double cirZCB(double r, double T, const CIRParams& p) noexcept {
    if (T < 1e-9) return 1.0;
    const double gamma  = std::sqrt(p.kappa * p.kappa + 2.0 * p.sigma * p.sigma);
    const double eT     = std::exp(gamma * T);
    const double denom  = (gamma + p.kappa) * (eT - 1.0) + 2.0 * gamma;
    const double B      = 2.0 * (eT - 1.0) / denom;
    const double power  = 2.0 * p.kappa * p.theta / (p.sigma * p.sigma);
    const double A      = std::pow(
        2.0 * gamma * std::exp(0.5 * (p.kappa + gamma) * T) / denom, power);
    return A * std::exp(-B * r);
}

// Implied yield: y(r, T) = -log P(r, T) / T
double cirYield(double r, double T, const CIRParams& p) noexcept {
    return -std::log(cirZCB(r, T, p)) / T;
}

// Build yield curve grid: tenors in years
std::vector<std::pair<double, double>> cirYieldCurve(
    double r, const CIRParams& p,
    const std::vector<double>& tenors) {
    std::vector<std::pair<double, double>> curve;
    curve.reserve(tenors.size());
    for (double T : tenors)
        curve.emplace_back(T, cirYield(r, T, p));
    return curve;
}

// Duration from finite difference: -dP/dr / P (interest rate sensitivity)
double cirDuration(double r, double T, const CIRParams& p,
                    double dr = 1e-4) noexcept {
    double Pup   = cirZCB(r + dr, T, p);
    double Pdown = cirZCB(r - dr, T, p);
    double P0    = cirZCB(r,      T, p);
    return -(Pup - Pdown) / (2.0 * dr) / P0;
}`,
    explanation:
      "The CIR model's affine structure means bond prices are exponential-linear in r, which gives closed-form solutions for ZCBs, caps, and swaptions — a critical advantage over models requiring numerical PDEs. The Feller condition 2κθ > σ² ensures the square-root diffusion never touches zero, preventing the volatility term σ√r from going imaginary, which is the key structural difference from Vasicek (where r can go negative).",
  },
  {
    id: "cpp-20260612-b1-sabr-vol",
    language: "cpp",
    title: "SABR implied vol — Hagan 2002 lognormal approximation",
    tag: "quant",
    code: `#include <cmath>
#include <stdexcept>

// SABR (Hagan et al. 2002): dF = alpha * F^beta * dW_F
//                            d(alpha) = nu * alpha * dW_v
// Approximate lognormal implied vol (Hagan 2002 formula):
// sigma_B(K, T; alpha, beta, rho, nu)

double sabrVol(double F,     // forward price
               double K,     // strike
               double T,     // expiry in years
               double alpha, // initial vol (> 0)
               double beta,  // CEV exponent [0,1]
               double rho,   // correlation (-1, 1)
               double nu)    // vol of vol (>= 0)
{
    if (alpha <= 0 || T <= 0 || nu < 0)
        throw std::invalid_argument("SABR: invalid parameters");

    // At-the-money approximation when F ≈ K
    if (std::abs(std::log(F / K)) < 1e-7) {
        double FK1b  = std::pow(F, 1.0 - beta);
        double logT  = alpha * alpha * (1.0 - beta) * (1.0 - beta)
                     / (24.0 * FK1b * FK1b);
        double midT  = 0.25 * rho * beta * nu * alpha / FK1b;
        double nuT   = nu * nu * (2.0 - 3.0 * rho * rho) / 24.0;
        return alpha / FK1b * (1.0 + (logT + midT + nuT) * T);
    }

    const double one_m_beta = 1.0 - beta;
    const double FK         = std::sqrt(F * K);
    const double FKb        = std::pow(FK, one_m_beta);
    const double logFK      = std::log(F / K);

    // z and chi(z): map log-moneyness to effective vol
    double z    = nu / alpha * FKb * logFK;
    double chi  = std::log(
        (std::sqrt(1.0 - 2.0 * rho * z + z * z) + z - rho) / (1.0 - rho));

    // Expansion terms in log(F/K)
    double A = 1.0 + (one_m_beta * one_m_beta / 24.0) * logFK * logFK
                   + std::pow(one_m_beta, 4) / 1920.0 * std::pow(logFK, 4);

    double num = alpha * (z / chi);
    double den = FKb * A;

    // Correction factor: accounts for vol-of-vol and correlation effects
    double corr  = alpha * alpha * one_m_beta * one_m_beta / (24.0 * FKb * FKb)
                 + 0.25 * rho * beta * nu * alpha / FKb
                 + nu * nu * (2.0 - 3.0 * rho * rho) / 24.0;

    return num / den * (1.0 + corr * T);
}`,
    explanation:
      "The SABR formula maps the absorbed Brownian motion of the CEV process (controlled by beta) and the correlated stochastic vol (controlled by nu and rho) to an equivalent lognormal vol via a matched asymptotic expansion. Beta determines the backbone shape — beta=0 gives a normal smile (flat ATMF vol as F changes), beta=1 gives lognormal (ATMF vol moves with the forward), and intermediate values give the skew tilt seen in equity and rate markets.",
  },
  {
    id: "cpp-20260612-b1-vanna-volga",
    language: "cpp",
    title: "Vanna-Volga FX pricing — smile construction from ATM, RR, BF quotes",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>
#include <array>

// Vanna-Volga (Castagna-Mercurio 2007): price an FX option by replicating
// its vanna and volga using three market instruments:
//   1. ATM straddle (sigma_atm)
//   2. 25-delta risk reversal: sigma_25c - sigma_25p = RR
//   3. 25-delta butterfly:     (sigma_25c + sigma_25p)/2 - sigma_atm = BF
// The method is exact for the replicating instruments and approximates exotics.

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrtpi * std::numbers::sqrt2);
}
static double phi(double x) noexcept {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * std::numbers::pi);
}

struct BSGreeks { double price, delta, vega, vanna, volga; };

BSGreeks bsGreeks(double S, double K, double r, double q,
                   double sigma, double T) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    double Nd1 = Phi(d1), Nd2 = Phi(d2);
    double vega  = S * std::exp(-q * T) * phi(d1) * sqT;
    double vanna = -vega * d2 / (sigma * sqT);   // dVega/dS
    double volga =  vega * d1 * d2 / sigma;       // dVega/dSigma
    double price = S * std::exp(-q * T) * Nd1 - K * std::exp(-r * T) * Nd2;
    return {price, std::exp(-q * T) * Nd1, vega, vanna, volga};
}

// Price an exotic/vanilla FX call using VV smile interpolation
double vannaVolgaPrice(double S, double K, double r, double q, double T,
                        double sigma_atm, double RR, double BF) noexcept {
    double sigma_25c = sigma_atm + BF + 0.5 * RR;
    double sigma_25p = sigma_atm + BF - 0.5 * RR;

    // Approximate 25-delta strikes (log-normal: K_25c = F * exp(sigma * sqrt(T) * d1_25d))
    double F  = S * std::exp((r - q) * T);
    double K25c = F * std::exp( sigma_25c * std::sqrt(T) * 0.6745);  // N^{-1}(0.75)
    double K25p = F * std::exp(-sigma_25p * std::sqrt(T) * 0.6745);

    auto   g0   = bsGreeks(S, K,    r, q, sigma_atm, T);
    auto   g25c = bsGreeks(S, K25c, r, q, sigma_25c, T);
    auto   g25p = bsGreeks(S, K25p, r, q, sigma_25p, T);

    // VV correction weights for vanna and volga matching
    double x1 = g0.vanna / (g25c.vanna + 1e-12);
    double x2 = g0.volga / (g25c.volga + g25p.volga + 1e-12);

    double bs25c = bsGreeks(S, K25c, r, q, sigma_atm, T).price;
    double bs25p = bsGreeks(S, K25p, r, q, sigma_atm, T).price;
    double mkt25c = g25c.price;
    double mkt25p = g25p.price;

    return g0.price
           + x1 * (mkt25c - bs25c)
           + x2 * (mkt25c - bs25c + mkt25p - bs25p);
}`,
    explanation:
      "The Vanna-Volga method replicates a target option's exposure to vanna (sensitivity of vega to spot) and volga (sensitivity of vega to vol) using the three market instruments, then adds the market-price correction for those exposures. It is the standard FX quoting model at many banks because it is model-free in its inputs — the entire smile is parameterised by three observable market quotes rather than requiring calibration to a stochastic vol model.",
  },
  {
    id: "cpp-20260612-b1-fix-parser",
    language: "cpp",
    title: "FIX protocol tag=value parser — zero-copy std::string_view fields",
    tag: "market-data",
    code: `#include <string_view>
#include <functional>
#include <charconv>
#include <cstdint>
#include <array>

// FIX 4.x wire format: tag=value SOH tag=value SOH ...
// Zero-copy parse: std::string_view slices into the original buffer.
// No heap allocation; from_chars avoids locale-dependent overhead of atoi.

static constexpr char SOH = '\x01';   // FIX field delimiter

struct FixField { int tag; std::string_view value; };

// Callback-based field visitor: avoids building a map per message.
// Caller registers a lambda; called once per field in O(N) total.
template<typename Visitor>
void parseFixMessage(std::string_view msg, Visitor&& visit) {
    while (!msg.empty()) {
        // Find '='
        auto eq = msg.find('=');
        if (eq == std::string_view::npos) break;

        // Parse tag using from_chars (branchless, no locale)
        int tag = 0;
        std::from_chars(msg.data(), msg.data() + eq, tag);

        // Find delimiter
        auto soh = msg.find(SOH, eq + 1);
        if (soh == std::string_view::npos) soh = msg.size();

        visit(FixField{tag, msg.substr(eq + 1, soh - eq - 1)});

        msg = (soh < msg.size()) ? msg.substr(soh + 1) : std::string_view{};
    }
}

// Extract a subset of known tags into a compact struct (no map lookup)
struct NewOrderSingle {
    std::string_view cl_ord_id;   // tag 11
    int64_t         order_id = 0; // tag 37
    double          price    = 0; // tag 44
    int             qty      = 0; // tag 38
    char            side     = 0; // tag 54: '1'=Buy, '2'=Sell
    bool            valid    = false;
};

NewOrderSingle decodeOrder(std::string_view msg) {
    NewOrderSingle o;
    parseFixMessage(msg, [&](const FixField& f) {
        switch (f.tag) {
            case 11: o.cl_ord_id = f.value; break;
            case 37: std::from_chars(f.value.data(), f.value.data() + f.value.size(), o.order_id); break;
            case 38: std::from_chars(f.value.data(), f.value.data() + f.value.size(), o.qty); break;
            case 44: { double v = 0; std::from_chars(f.value.data(), f.value.data()+f.value.size(), v); o.price = v; break; }
            case 54: o.side = f.value.empty() ? 0 : f.value[0]; break;
        }
    });
    o.valid = (o.side == '1' || o.side == '2') && o.price > 0 && o.qty > 0;
    return o;
}`,
    explanation:
      "std::string_view slices into the raw network buffer without copying bytes, and std::from_chars parses integers and doubles without touching the locale or allocating — this keeps the hot FIX-decode path entirely on the stack with deterministic latency. The switch-based tag dispatch compiles to a jump table, making each field O(1) to dispatch regardless of the number of supported tags.",
  },
  {
    id: "cpp-20260612-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list — O(1) order queue with no allocator",
    tag: "data-structures",
    code: `#include <cstddef>
#include <cassert>

// Intrusive list: the list node pointers are stored INSIDE the element itself.
// Benefits over std::list: (1) zero allocator overhead — nodes are embedded,
// (2) O(1) removal given a pointer to the element (no search required),
// (3) better cache locality — data and links are contiguous in memory.
// Used for per-price-level order queues in an order book.

struct ListHook {
    ListHook* prev = nullptr;
    ListHook* next = nullptr;
};

// Element must embed a ListHook (or inherit from it).
struct Order {
    ListHook    hook;    // intrusive link — MUST be first for simple cast
    int64_t     id;
    double      price;
    int         qty;
};

// Sentinel-based doubly linked list (head and tail are dummies).
class OrderQueue {
    ListHook head_, tail_;
    int      size_ = 0;

public:
    OrderQueue() noexcept {
        head_.next = &tail_;
        tail_.prev = &head_;
    }

    void push_back(Order* o) noexcept {
        ListHook* h = &o->hook;
        h->prev       = tail_.prev;
        h->next       = &tail_;
        tail_.prev->next = h;
        tail_.prev    = h;
        ++size_;
    }

    // O(1) unlink without searching the list
    void remove(Order* o) noexcept {
        ListHook* h = &o->hook;
        h->prev->next = h->next;
        h->next->prev = h->prev;
        h->prev = h->next = nullptr;
        --size_;
    }

    Order* front() noexcept {
        if (head_.next == &tail_) return nullptr;
        return reinterpret_cast<Order*>(
            reinterpret_cast<char*>(head_.next) - offsetof(Order, hook));
    }

    bool  empty() const noexcept { return size_ == 0; }
    int   size()  const noexcept { return size_; }
};`,
    explanation:
      "The key advantage of intrusive lists over std::list is that you can remove an order given only its pointer in O(1) without a search — essential for cancel operations where you receive an order ID, look it up in a hash table (O(1) average), then unlink it directly from the price-level queue. std::list nodes are separately heap-allocated and opaque to the element, so you cannot go from an Order* to its list position without a search.",
  },
  {
    id: "cpp-20260612-b1-numa-alloc",
    language: "cpp",
    title: "NUMA-aware allocation — pin data to the local memory node",
    tag: "performance",
    code: `#include <cstdlib>
#include <cstddef>
#include <stdexcept>
#include <memory>

// On multi-socket NUMA servers, memory access latency for remote-node memory
// is 1.5-3x higher than local-node memory.
// libnuma (numa.h) provides NUMA-aware allocation; fallback to posix_memalign.
// Typical HFT setup: core 0-7 on socket 0, core 8-15 on socket 1.
// Bind the feed handler thread AND its buffers to socket 0.

#ifdef __linux__
  #include <numa.h>
  #define HAS_NUMA 1
#else
  #define HAS_NUMA 0
#endif

// Allocate bytes on the NUMA node closest to the current thread.
void* numaAlloc(std::size_t bytes, int node = -1) {
#if HAS_NUMA
    if (numa_available() != -1) {
        // node = -1: use the node of the current CPU
        int n = (node >= 0) ? node : numa_node_of_cpu(sched_getcpu());
        void* p = numa_alloc_onnode(bytes, n);
        if (p) return p;
    }
#endif
    // Fallback: 64-byte aligned malloc (cache-line aligned)
    void* p = nullptr;
    if (posix_memalign(&p, 64, bytes) != 0)
        throw std::bad_alloc{};
    return p;
}

void numaFree(void* p, std::size_t bytes) noexcept {
#if HAS_NUMA
    if (numa_available() != -1) { numa_free(p, bytes); return; }
#endif
    free(p);
}

// RAII NUMA buffer for a hot structure (e.g. order book, tick store)
template<typename T>
struct NumaBuffer {
    T*          ptr;
    std::size_t count;
    int         node;

    explicit NumaBuffer(std::size_t n, int numa_node = -1)
        : ptr(static_cast<T*>(numaAlloc(n * sizeof(T), numa_node)))
        , count(n), node(numa_node) {
        new (ptr) T[n]();   // default-construct
    }
    ~NumaBuffer() noexcept { numaFree(ptr, count * sizeof(T)); }
    T& operator[](std::size_t i) noexcept { return ptr[i]; }
};
// Build with: g++ -lnuma ...
// Enable: numactl --cpubind=0 --membind=0 ./feed_handler`,
    explanation:
      "NUMA locality matters because a cache miss to local DRAM costs ~60 ns while a miss to remote DRAM (cross-socket) costs ~100-150 ns. For a feed handler processing 10M ticks/s, this 2-3× latency difference on L3 misses translates to hundreds of microseconds of extra latency per second. Binding the thread with pthread_setaffinity_np and its buffers with numa_alloc_onnode ensures all memory accesses hit local DRAM.",
  },
  {
    id: "cpp-20260612-b1-branch-hints",
    language: "cpp",
    title: "__builtin_expect branch prediction — hint the CPU on likely/unlikely paths",
    tag: "performance",
    code: `#include <cstdint>

// __builtin_expect(expr, value) tells the compiler the likely outcome of expr.
// The compiler places the likely branch immediately after the conditional
// (no unconditional branch instruction taken), reducing pipeline flush cost.
// Use ONLY for genuinely skewed branches (>95% one-sided); wrong hints hurt.
// C++20: [[likely]] / [[unlikely]] attributes are the portable equivalent.

#define LIKELY(x)   __builtin_expect(!!(x), 1)
#define UNLIKELY(x) __builtin_expect(!!(x), 0)

struct Tick { double price; int vol; bool valid; };

// Order validation: the invalid path is rare (<0.01% of ticks).
void processTick(const Tick& t) {
    if (UNLIKELY(!t.valid)) {
        // handle error path — rare
        return;
    }
    // hot path: executed 99.99% of the time
    // Compiler places this code inline, avoids a jump for the common case.
    (void)t.price;
}

// Check if an order is at-risk of margin breach (rare event in normal markets)
bool checkRiskLimit(int64_t position, int64_t limit) noexcept {
    if (UNLIKELY(position > limit)) {
        return false;   // breach — rare, handle in a non-inlined function
    }
    return true;       // typical: position within limit
}

// C++20 portable alternative using attributes:
[[nodiscard]] bool checkLimit20(int64_t pos, int64_t lim) noexcept {
    if (pos > lim) [[unlikely]] return false;   // C++20 attribute
    return true;
}

// Branch-free alternative for simple comparisons (avoid branch entirely):
bool checkLimitBranchFree(int64_t pos, int64_t lim) noexcept {
    return pos <= lim;  // single CMP + SETLE — no branch at all
}

// Benchmark guideline: mispredict cost on modern x86 = 10-20 cycles.
// If the branch is predicted correctly 99% of the time, the expected cost
// is 0.01 * 15 = 0.15 cycles vs a mispredicted 50/50 branch = 7.5 cycles.`,
    explanation:
      "__builtin_expect affects code layout at compile time — the 'likely' block is placed in the fall-through path of the conditional branch, which the branch predictor and the instruction fetch unit favour. The C++20 [[likely]] attribute is portable and equivalent; for truly hot paths, the branch-free version (arithmetic instead of conditional) is often best because it eliminates the predictor dependency entirely.",
  },
  {
    id: "cpp-20260612-b1-prefetch",
    language: "cpp",
    title: "__builtin_prefetch — software cache warming for order book traversal",
    tag: "performance",
    code: `#include <cstddef>
#include <cstdint>

// __builtin_prefetch(addr, rw, locality):
//   rw:       0 = read, 1 = read-write (exclusive prefetch)
//   locality: 0 = no temporal locality (discard after use), 3 = L1 (keep)
// Fires a non-blocking PREFETCHNTA / PREFETCHT0/1/2 instruction.
// Hides latency of L3/DRAM access (200-400 cycles) by issuing the fetch
// ahead of when the data is needed.

struct Level { double price; int64_t qty; int order_count; };

// Prefetch-ahead pattern: for each element, prefetch the element N steps ahead.
// Prefetch distance = desired_latency_cycles / cycles_per_element
// e.g. 200 cycle DRAM latency / 2 cycle per level = 100 levels ahead (clamped).
static constexpr int PREFETCH_DIST = 8;  // typically 4-16 for 64-byte structs

double sweepAsk(const Level* levels, int n) noexcept {
    double total_notional = 0.0;
    for (int i = 0; i < n; ++i) {
        // Prefetch PREFETCH_DIST levels ahead into L1 cache
        if (i + PREFETCH_DIST < n) {
            __builtin_prefetch(&levels[i + PREFETCH_DIST],
                               0,    // read
                               1);   // L2 locality (t1 = PREFETCHT1)
        }
        total_notional += levels[i].price * static_cast<double>(levels[i].qty);
    }
    return total_notional;
}

// Prefetch the next order before processing the current one
struct Order { int64_t id; double price; int qty; Order* next; };

void processQueue(Order* head) noexcept {
    for (Order* o = head; o != nullptr; o = o->next) {
        // Prefetch the next node's cache line before we need it
        if (o->next) {
            __builtin_prefetch(o->next, 0, 1);   // prefetch next Order into L2
        }
        // Process current: by the time we reach o->next, it may be in cache
        (void)o->price;
        (void)o->qty;
    }
}
// Measurement: prefetch gains are 10-40% for linked-list traversal with
// cache-cold data. For hot data (fits in L2/L3), prefetch adds overhead —
// profile before adding.`,
    explanation:
      "Software prefetch hides memory latency by issuing a speculative load instruction early enough that the cache line arrives before it is needed — the CPU continues executing other instructions during the DRAM access instead of stalling. The optimal prefetch distance equals the memory latency in cycles divided by the loop iteration cycles; too short and the data hasn't arrived, too long and it has been evicted before use.",
  },
  {
    id: "cpp-20260612-b1-constexpr-matrix",
    language: "cpp",
    title: "Compile-time fixed NxM matrix — constexpr arithmetic for Greeks Jacobian",
    tag: "modern",
    code: `#include <array>
#include <cstddef>
#include <numeric>
#include <cmath>

// Fixed-size matrix backed by std::array: zero heap, constexpr-capable.
// All operations are checked at compile time via template parameters.
// Use for small dense matrices: Greeks Jacobians, factor loadings, covariance.

template<std::size_t R, std::size_t C, typename T = double>
struct Mat {
    std::array<T, R * C> data{};

    constexpr T& operator()(std::size_t r, std::size_t c) noexcept {
        return data[r * C + c];
    }
    constexpr const T& operator()(std::size_t r, std::size_t c) const noexcept {
        return data[r * C + c];
    }

    // Matrix multiply: (R x K) * (K x C2) -> (R x C2)
    template<std::size_t C2>
    constexpr Mat<R, C2, T> operator*(const Mat<C, C2, T>& rhs) const noexcept {
        Mat<R, C2, T> result{};
        for (std::size_t i = 0; i < R; ++i)
            for (std::size_t k = 0; k < C; ++k)
                for (std::size_t j = 0; j < C2; ++j)
                    result(i, j) += (*this)(i, k) * rhs(k, j);
        return result;
    }

    // Transpose
    constexpr Mat<C, R, T> T_() const noexcept {
        Mat<C, R, T> t{};
        for (std::size_t i = 0; i < R; ++i)
            for (std::size_t j = 0; j < C; ++j)
                t(j, i) = (*this)(i, j);
        return t;
    }

    // Frobenius norm
    T norm() const noexcept {
        T s = 0;
        for (auto v : data) s += v * v;
        return std::sqrt(s);
    }
};

// Greeks Jacobian: 5 options x 5 Greeks (Delta, Gamma, Vega, Rho, Theta)
// constexpr — fully evaluated at compile time if inputs are constexpr
constexpr auto identityGreeks() {
    Mat<5, 5> I{};
    for (std::size_t i = 0; i < 5; ++i) I(i, i) = 1.0;
    return I;
}

// Factor model: returns = loadings * factors + residuals
// loadings: N x K, factors: K x 1 -> returns: N x 1
template<std::size_t N, std::size_t K>
Mat<N, 1> factorReturns(const Mat<N, K>& L, const Mat<K, 1>& f) noexcept {
    return L * f;
}`,
    explanation:
      "std::array-based matrices are entirely stack-allocated for small sizes (N*M*8 bytes), eliminating the heap allocation, reference counting, and size check overhead of Eigen's dynamic matrices. The compiler generates optimal SIMD code for small fixed-size matrix multiplies — a 4×4 double matrix multiply compiles to approximately 64 fused multiply-add (FMA) instructions with no memory access, which is near the theoretical peak for the hardware.",
  },
  {
    id: "cpp-20260612-b1-duration-convexity",
    language: "cpp",
    title: "Bond duration and convexity — modified duration and DV01 from cash flows",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <numeric>

// Bond = series of cash flows {C_i, t_i}. Discount at flat yield y.
// Price P = sum C_i * exp(-y * t_i) (continuous) or (1+y/freq)^{-freq*t_i} (semi-annual)
// Macaulay duration D = (1/P) * sum t_i * C_i * df_i
// Modified duration = D / (1 + y/freq)  — approximate price sensitivity: dP/dy = -Mod_D * P
// Convexity C = (1/P) * sum t_i^2 * C_i * df_i   — second-order correction
// DV01 = P * Mod_D / 10000  — dollar value of a 1bp shift in yield

struct CashFlow { double time; double amount; };

struct BondAnalytics {
    double price;
    double macaulay_dur;
    double modified_dur;
    double convexity;
    double dv01;       // per unit face value
};

// Continuous compounding version (common in quant models)
BondAnalytics bondAnalyticsCC(const std::vector<CashFlow>& flows, double y) {
    double P = 0, D_num = 0, C_num = 0;

    for (const auto& cf : flows) {
        double df  = std::exp(-y * cf.time);
        double pv  = cf.amount * df;
        P     += pv;
        D_num += cf.time * pv;
        C_num += cf.time * cf.time * pv;
    }

    if (P <= 0) return {};
    double mac_dur  = D_num / P;
    double mod_dur  = mac_dur;           // same for continuous compounding
    double conv     = C_num / P;
    double dv01     = P * mod_dur / 10000.0;

    return {P, mac_dur, mod_dur, conv, dv01};
}

// Taylor approximation: dP ≈ -Mod_D * P * dy + 0.5 * Conv * P * dy^2
double priceChange(const BondAnalytics& a, double dy) noexcept {
    return (-a.modified_dur * dy + 0.5 * a.convexity * dy * dy) * a.price;
}

// Build cash flows for a fixed-rate bond (semi-annual coupon)
std::vector<CashFlow> fixedRateBond(double face, double coupon_rate,
                                     double maturity, int freq = 2) {
    std::vector<CashFlow> flows;
    double dt      = 1.0 / freq;
    double coupon  = face * coupon_rate * dt;
    for (int i = 1; i * dt <= maturity + 1e-9; ++i)
        flows.push_back({i * dt, coupon + (i * dt >= maturity - 1e-9 ? face : 0.0)});
    return flows;
}`,
    explanation:
      "Modified duration is the first-order price sensitivity to yield: a bond with modified duration 7 loses approximately 7% in price for a 100 bp yield increase. Convexity corrects for the non-linearity — it is always positive for standard bonds, meaning bonds outperform the linear duration approximation in both yield rally and sell-off, which is why investors pay a premium for convexity in options and long-maturity bonds.",
  },
  {
    id: "cpp-20260612-b1-cds-pricing",
    language: "cpp",
    title: "CDS pricing — protection leg, premium leg, and par spread",
    tag: "quant",
    code: `#include <cmath>
#include <vector>

// CDS (Credit Default Swap) pricing under piecewise-constant hazard rate.
// Protection leg: pays (1 - R) at the default time if it occurs before T.
// Premium leg:    pays spread * dt * P(survival to t) * df(t) quarterly.
// Par spread = PV(protection) / RPV01   where RPV01 = PV(1bp premium stream).
// Survival prob Q(t) = exp(-h * t) for constant hazard h.

struct CdsPricing {
    double protection_pv;   // protection leg PV
    double rpv01;           // risky PV01 (annuity)
    double par_spread_bps;  // fair spread in basis points
    double mtm;             // MtM of existing CDS at running spread s
};

CdsPricing priceCDS(double hazard,          // constant hazard rate
                     double recovery,        // LGD = 1 - recovery
                     double maturity_years,
                     double risk_free_rate,  // flat discount curve
                     double running_spread_bps = 100.0,
                     int    freq = 4) {       // quarterly coupons
    const double dt       = 1.0 / freq;
    const double spread   = running_spread_bps / 10000.0;
    double prot_pv = 0.0, rpv01 = 0.0;

    double Q_prev = 1.0;
    double t_prev = 0.0;

    for (int i = 1; i * dt <= maturity_years + 1e-9; ++i) {
        double t  = i * dt;
        double Q  = std::exp(-hazard * t);
        double df = std::exp(-risk_free_rate * t);

        // Protection: (1-R) * df * (Q_{t-1} - Q_t)  [defaults in this period]
        prot_pv += (1.0 - recovery) * df * (Q_prev - Q);

        // Premium: spread * dt * df * Q_t  [coupon paid if survived]
        rpv01 += dt * df * Q;

        Q_prev = Q;
        t_prev = t;
    }

    double par_spread = (rpv01 > 0) ? prot_pv / rpv01 : 0.0;
    double mtm        = (par_spread - spread) * rpv01;  // +ve = protection seller wins

    return {prot_pv, rpv01, par_spread * 10000.0, mtm};
}

// Spread DV01: change in MtM for +1bp in spread (hold hazard fixed)
double cdsSpreadDV01(double rpv01) noexcept {
    return rpv01 / 10000.0;  // per bp, per unit notional
}`,
    explanation:
      "The CDS par spread equates the present values of the protection and premium legs — conceptually the same as solving for the fair strike of a put option on default. The RPV01 (risky PV01) is the key building block: it is the annuity factor discounted by both the risk-free rate and the survival probability, and it equals the spread sensitivity of the CDS price to the running coupon, analogous to DV01 in fixed income.",
  },
  {
    id: "cpp-20260612-b1-position-tracker",
    language: "cpp",
    title: "Atomic position tracker — lock-free net-position with hard risk limit",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <optional>

// Lock-free position tracker for a single instrument.
// Multiple order-entry threads update net position; risk monitor reads it.
// CAS loop ensures no fill is lost even under contention.
// Hard limit: reject the fill atomically if it would breach the limit.

class PositionTracker {
    std::atomic<int64_t> net_pos_{0};   // shares: +long, -short
    const int64_t        limit_;        // max absolute position (hard)

public:
    explicit PositionTracker(int64_t limit) noexcept : limit_(limit) {}

    // Returns true and updates position if the fill is within limits.
    // fill_qty: positive = bought, negative = sold.
    bool applyFill(int64_t fill_qty) noexcept {
        int64_t old = net_pos_.load(std::memory_order_relaxed);
        for (;;) {
            int64_t new_pos = old + fill_qty;
            // Absolute position limit check
            if (new_pos > limit_ || new_pos < -limit_)
                return false;    // reject: would breach limit
            // CAS: only update if net_pos_ hasn't changed since we read it
            if (net_pos_.compare_exchange_weak(old, new_pos,
                                               std::memory_order_release,
                                               std::memory_order_relaxed))
                return true;
            // CAS failed: old was updated with the current value; retry
        }
    }

    // Thread-safe read (acquire: see all applyFill releases)
    int64_t position() const noexcept {
        return net_pos_.load(std::memory_order_acquire);
    }

    // Risk monitor: check limit utilisation
    double utilizationPct() const noexcept {
        return 100.0 * static_cast<double>(std::abs(net_pos_.load(std::memory_order_acquire)))
                     / static_cast<double>(limit_);
    }

    // Flat: reset to zero (call only when no order activity; e.g. EOD reconcile)
    void flatten() noexcept { net_pos_.store(0, std::memory_order_seq_cst); }
};

// Multi-instrument: one tracker per symbol (uint16_t index from SymbolTable)
// PositionTracker trackers[65536];  // indexed by symbol ID
// bool ok = trackers[symbol_id].applyFill(fill_qty);`,
    explanation:
      "The compare-and-swap loop is the standard lock-free update pattern: read the current value, compute the desired new value, then atomically swap only if the value hasn't changed. The 'weak' CAS is used in the loop because it can spuriously fail but is cheaper on ARM (avoids the load-link/store-conditional exclusive monitor re-acquisition). The hard limit check inside the CAS eliminates the race condition where two threads both pass the limit check but together breach it.",
  },
  {
    id: "cpp-20260612-b1-variance-swap",
    language: "cpp",
    title: "Variance swap fair strike — log-strip integral from options",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <numbers>
#include <algorithm>

// Variance swap: pays (realized_var - K_var) * notional at expiry.
// Fair strike K_var = E^Q[sigma_realized^2] computed model-free
// from a strip of OTM options via the log-contract replication:
// K_var = (2/T) * [sum over K_i of (dK/K^2) * e^{rT} * V(K_i)]
// where V(K) = put for K <= F, call for K > F.
// This is the Demeterfi-Derman-Kamal-Zou (1999) formula.

struct VolStrip {
    double strike;
    double price;    // undiscounted option price (put if K<F, call if K>=F)
};

double varianceSwapStrike(const std::vector<VolStrip>& strip,
                           double F,     // forward price
                           double r,     // risk-free rate
                           double T) {   // expiry in years
    if (strip.empty() || T <= 0) return 0.0;

    // Sort by strike ascending
    auto sorted = strip;
    std::ranges::sort(sorted, {}, &VolStrip::strike);

    double integral = 0.0;
    int n = static_cast<int>(sorted.size());

    for (int i = 0; i < n; ++i) {
        double K  = sorted[i].strike;
        double Q  = sorted[i].price;

        // Trapezoidal dK weight
        double dK_lo = (i > 0)     ? K - sorted[i-1].strike : sorted[1].strike - K;
        double dK_hi = (i < n - 1) ? sorted[i+1].strike - K : K - sorted[i-1].strike;
        double dK    = 0.5 * (dK_lo + dK_hi);

        integral += (dK / (K * K)) * std::exp(r * T) * Q;
    }

    // ATM adjustment: corrects for forward not on the grid
    int    k0_idx = static_cast<int>(std::ranges::lower_bound(sorted, F, {},
                       &VolStrip::strike) - sorted.begin()) - 1;
    k0_idx = std::clamp(k0_idx, 0, n - 1);
    double K0     = sorted[k0_idx].strike;
    double adj    = (1.0 / T) * std::pow(F / K0 - 1.0, 2);

    double K_var  = (2.0 / T) * integral - adj;
    return std::max(K_var, 0.0);
}

// Implied variance annualised from variance swap strike
double annualisedVol(double K_var) noexcept { return std::sqrt(K_var); }`,
    explanation:
      "The log-strip formula is model-free — it does not assume Black-Scholes or any particular dynamics for the underlying — making the variance swap strike the purest measure of the market's expectation of realised variance. The 1/K² weighting scheme arises from the mathematical identity that the payoff of a log contract (ln S_T) can be replicated by a portfolio of options with notional 1/K² at each strike, and variance swap is the payoff of the log contract minus the drift term.",
  },
  {
    id: "cpp-20260612-b1-compound-option",
    language: "cpp",
    title: "Compound option (Geske 1979) — call-on-call with bivariate normal",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>
#include <algorithm>

// Call-on-call: option to buy an underlying European call at time T1 for price K1.
// The underlying call has strike K2 and expiry T2 > T1.
// Geske (1979): C_cc = S*N2(d1, d1*, rho) - K2*e^{-r*T2}*N2(d2, d2*, rho)
//                    - K1*e^{-r*T1}*N(d2)
// where rho = sqrt(T1/T2) and S* is the critical price at T1.

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrtpi * std::numbers::sqrt2);
}
static double phi(double x) noexcept {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * std::numbers::pi);
}

// Bivariate normal CDF via Owen's T-function approximation (Drezner 1978)
static double N2(double h, double k, double rho) noexcept {
    // For rho close to ±1 or |h|/|k| large, use decomposition
    // Simplified: Monte Carlo or numerical quadrature for production
    // This uses the Drezner (1978) 6-point Gauss-Legendre approximation
    static const double w[] = {0.0494048,0.126484,0.169538,0.169538,0.126484,0.0494048};
    static const double x[] = {0.9324696,0.6612094,0.2386192,-0.2386192,-0.6612094,-0.9324696};
    // Scaled to [0,1] -> substitute t = 0.5*(1+x_i)
    double rho2  = std::sqrt(1.0 - rho * rho);
    double sum   = 0.0;
    double hk    = h * k;
    if (rho2 > 0) {
        for (int i = 0; i < 6; ++i) {
            double r  = rho * x[i];
            double r2 = std::sqrt(1.0 - r * r);
            sum += w[i] * std::exp((r * hk - 0.5 * (h*h + k*k)) / (1.0 - r*r));
        }
        sum *= 0.5 * std::numbers::inv_pi / rho2;
    }
    return Phi(h) * Phi(k) + sum * 0.5;
}

// Critical spot price S* at T1 such that BS_call(S*, K2, r, q, sigma, T2-T1) = K1
static double criticalSpot(double K1, double K2, double r, double q,
                             double sigma, double T1, double T2) {
    double lo = 1e-6, hi = K2 * 100;
    auto bsCall = [&](double S) {
        double sqT = std::sqrt(T2 - T1);
        double d1  = (std::log(S/K2) + (r - q + 0.5*sigma*sigma)*(T2-T1)) / (sigma*sqT);
        double d2  = d1 - sigma * sqT;
        return S*std::exp(-q*(T2-T1))*Phi(d1) - K2*std::exp(-r*(T2-T1))*Phi(d2);
    };
    for (int i = 0; i < 50; ++i) {   // bisection
        double mid = 0.5 * (lo + hi);
        if (bsCall(mid) < K1) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
}

double callOnCall(double S, double K1, double K2,
                   double r, double q, double sigma, double T1, double T2) {
    double Ss  = criticalSpot(K1, K2, r, q, sigma, T1, T2);
    double rho = std::sqrt(T1 / T2);
    double sqT1 = std::sqrt(T1), sqT2 = std::sqrt(T2);
    double d1  = (std::log(S/Ss)  + (r-q+0.5*sigma*sigma)*T1) / (sigma*sqT1);
    double d2  = d1 - sigma * sqT1;
    double d1s = (std::log(S/K2)  + (r-q+0.5*sigma*sigma)*T2) / (sigma*sqT2);
    double d2s = d1s - sigma * sqT2;
    return S*std::exp(-q*T2)*N2(d1, d1s, rho)
         - K2*std::exp(-r*T2)*N2(d2, d2s, rho)
         - K1*std::exp(-r*T1)*Phi(d2);
}`,
    explanation:
      "A compound option's value depends on the bivariate normal distribution because the exercise decision at T1 depends jointly on the spot at T1 (which determines whether to exercise) and the spot at T2 (which determines the inner option's payoff). The critical spot S* is where the inner option is exactly worth K1 — above S*, the compound option holder exercises at T1; below S*, they let it expire, making S* the option's effective barrier.",
  },
  {
    id: "cpp-20260612-b1-forward-start",
    language: "cpp",
    title: "Forward start option — Rubinstein (1991) at-the-money-forward pricing",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>

// Forward start call: strike is set at expiry of the forward period.
// At time t1, strike K = alpha * S_{t1} (e.g. alpha=1 for ATM-F).
// At t=0, the value is: C_fwd = e^{-q*t1} * BSCall(S0, alpha*S0, r, q, sigma, T-t1)
//                             = S0 * e^{-q*t1} * BSCall(1, alpha, r, q, sigma, T-t1)
// This factorisation holds because the payoff at T is:
//   max(S_T - alpha*S_{t1}, 0) = S_{t1} * max(S_T/S_{t1} - alpha, 0)
// and S_T/S_{t1} is independent of S_{t1} under GBM, with the same sigma.

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrtpi * std::numbers::sqrt2);
}

double bsCallNorm(double alpha, double r, double q, double sigma, double tau) noexcept {
    // BSCall(F=1, K=alpha) under forward measure
    double sqT = std::sqrt(tau);
    double d1  = (std::log(1.0 / alpha) + (r - q + 0.5 * sigma * sigma) * tau) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    return std::exp(-q * tau) * Phi(d1) - alpha * std::exp(-r * tau) * Phi(d2);
}

struct ForwardStartResult {
    double price;
    double delta;   // dC/dS0
    double vega;    // dC/dsigma (per 1% vol move)
};

ForwardStartResult forwardStartCall(double S0,
                                     double alpha,  // strike as fraction of S_{t1}
                                     double r, double q, double sigma,
                                     double t1,     // forward start date
                                     double T) {    // final expiry
    if (T <= t1) return {0.0, 0.0, 0.0};

    double tau   = T - t1;
    double disc1 = std::exp(-q * t1);
    double C_norm = bsCallNorm(alpha, r, q, sigma, tau);

    double price = S0 * disc1 * C_norm;
    double delta = disc1 * C_norm;   // dC/dS0 = disc1 * C_norm (S0 linear)

    // Vega: dC/dsigma — same as a vanilla on S0 with tenor tau, scaled
    double sqT   = std::sqrt(tau);
    double d1    = (std::log(1.0 / alpha) + (r - q + 0.5 * sigma * sigma) * tau) / (sigma * sqT);
    double vega  = S0 * disc1 * std::exp(-d1*d1*0.5) / std::sqrt(2.0*std::numbers::pi) * sqT * 0.01;

    return {price, delta, vega};
}
// Cliquet: series of forward start options, each resetting at the prior expiry.
// Typical cliquet: monthly forward starts with local floor/cap per period.`,
    explanation:
      "The forward start option factors as S0 × e^{-qt1} × BSCall(1, alpha, r, q, sigma, T-t1) because under GBM, the ratio S_T/S_{t1} is lognormal with the same sigma independent of S_{t1} — the spot level at the forward start date cancels out. This makes the option proportional to current spot, which means its delta equals the normalised Black-Scholes call value, and it has no gamma until the forward start date is reached.",
  },
  {
    id: "cpp-20260612-b1-vwap-schedule",
    language: "cpp",
    title: "VWAP participation schedule — Almgren-Chriss optimal trajectory",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <algorithm>
#include <numeric>

// Almgren-Chriss (2000) optimal execution: liquidate X shares over [0,T].
// Objective: minimise E[cost] + lambda * Var[cost].
// Optimal trajectory: x(t) = X * sinh(kappa*(T-t)) / sinh(kappa*T)
// where kappa^2 = lambda * sigma^2 / eta
// eta = temporary impact coefficient, sigma = daily vol of price.

struct ACParams {
    double eta;    // temporary linear market impact coefficient
    double gamma;  // permanent impact coefficient
    double sigma;  // daily vol
    double lambda; // risk aversion
};

struct VWAPSchedule {
    std::vector<double> times;       // equally spaced execution times
    std::vector<double> holdings;    // remaining shares at each time
    std::vector<double> trade_sizes; // shares traded in each interval
    double expected_cost;
    double cost_variance;
};

VWAPSchedule almgrenChris(double X,           // initial shares to sell
                            const ACParams& p,
                            double T,          // trading horizon
                            int N) {           // number of time slices
    double kappa2 = p.lambda * p.sigma * p.sigma / p.eta;
    double kappa  = std::sqrt(std::max(kappa2, 0.0));
    double dt     = T / N;

    VWAPSchedule sched;
    sched.times.resize(N + 1);
    sched.holdings.resize(N + 1);
    sched.trade_sizes.resize(N);

    // x(t_j) = X * sinh(kappa*(T - j*dt)) / sinh(kappa*T)
    for (int j = 0; j <= N; ++j) {
        double t_j = j * dt;
        sched.times[j] = t_j;
        if (kappa < 1e-8) {
            // Linear liquidation (zero risk aversion)
            sched.holdings[j] = X * (1.0 - t_j / T);
        } else {
            sched.holdings[j] = X * std::sinh(kappa * (T - t_j)) / std::sinh(kappa * T);
        }
    }

    for (int j = 0; j < N; ++j)
        sched.trade_sizes[j] = sched.holdings[j] - sched.holdings[j + 1];

    // Expected cost and variance (simplified; omit permanent impact cross terms)
    double tau   = p.eta / kappa * std::cosh(kappa * T) / std::sinh(kappa * T);
    sched.expected_cost = p.gamma * X * X / 2.0 + p.eta * X * X / (2.0 * std::sinh(kappa*T)) * kappa;
    sched.cost_variance = 0.5 * p.sigma * p.sigma * X * X * tau;

    return sched;
}
// High lambda -> aggressive front-loading (sell quickly, reduce variance).
// Low lambda  -> spread trading evenly (reduce market impact cost).`,
    explanation:
      "The Almgren-Chriss model solves the trade-off between market impact cost (proportional to η × trade_size² per period) and timing risk (proportional to λ × σ² × variance of remaining position). The optimal trajectory is a hyperbolic sine function — it front-loads more aggressively than VWAP when risk aversion λ is high, and converges to linear (VWAP) as λ→0, providing a principled framework for deciding how fast to trade.",
  },
  {
    id: "cpp-20260612-b1-vpin",
    language: "cpp",
    title: "VPIN — volume-synchronized probability of informed trading",
    tag: "market-data",
    code: `#include <cmath>
#include <vector>
#include <algorithm>
#include <numeric>

// VPIN (Easley, Lopez de Prado, O'Hara 2012):
// Bulk Volume Classification assigns each trade as buy or sell using
// the price change relative to a bucket midpoint, then computes
// order flow imbalance (OFI) = |buy_vol - sell_vol| / total_vol per bucket.
// VPIN = EMA of OFI over n recent buckets — proxy for toxicity.

struct Trade { double price; double volume; };

// Classify a single trade as buy fraction using Z-score of delta_P
// (simplified BVC: buy_frac = Phi(delta_P / sigma_bucket))
static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x / std::sqrt(2.0));
}

std::vector<double> computeVPIN(const std::vector<Trade>& trades,
                                  double bucket_volume,   // target volume per bucket
                                  int    window = 50) {  // number of buckets for EMA
    if (trades.empty() || bucket_volume <= 0) return {};

    // Compute rolling price sigma for BVC classification
    std::vector<double> returns;
    for (std::size_t i = 1; i < trades.size(); ++i) {
        if (trades[i-1].price > 0)
            returns.push_back(trades[i].price - trades[i-1].price);
    }
    double sigma_dp = 0;
    for (double r : returns) sigma_dp += r * r;
    sigma_dp = (returns.empty()) ? 1e-6 : std::sqrt(sigma_dp / returns.size());

    // Fill buckets
    std::vector<double> ofi_per_bucket;
    double buy_vol = 0, sell_vol = 0, bucket_filled = 0;
    double prev_price = trades.empty() ? 0 : trades[0].price;

    for (const auto& t : trades) {
        double dp       = t.price - prev_price;
        double buy_frac = Phi(sigma_dp > 0 ? dp / sigma_dp : 0.0);
        double bv       = t.volume * buy_frac;
        double sv       = t.volume * (1.0 - buy_frac);

        buy_vol      += bv;
        sell_vol     += sv;
        bucket_filled += t.volume;
        prev_price    = t.price;

        while (bucket_filled >= bucket_volume) {
            double ofi = std::abs(buy_vol - sell_vol) / (buy_vol + sell_vol + 1e-9);
            ofi_per_bucket.push_back(ofi);
            buy_vol = sell_vol = 0;
            bucket_filled -= bucket_volume;
        }
    }

    // VPIN = rolling mean over last 'window' buckets
    std::vector<double> vpin;
    for (std::size_t i = window - 1; i < ofi_per_bucket.size(); ++i) {
        double sum = 0;
        for (int j = 0; j < window; ++j) sum += ofi_per_bucket[i - j];
        vpin.push_back(sum / window);
    }
    return vpin;
}`,
    explanation:
      "VPIN measures order flow toxicity by classifying each trade as buy- or sell-initiated using the price change normalised by short-term volatility (the Bulk Volume Classification approach), then computing the imbalance per equal-volume bucket rather than per equal-time interval. Volume synchronisation makes VPIN robust to changes in trading activity — it reacts to the same number of transactions regardless of whether trading is fast or slow, unlike time-bar-based microstructure measures.",
  },
  {
    id: "cpp-20260612-b1-convexity-adj",
    language: "cpp",
    title: "Eurodollar futures convexity adjustment — Hull-White formula",
    tag: "quant",
    code: `#include <cmath>
#include <vector>

// Eurodollar/SOFR futures price = 100 - E^P[r_{T1, T2}]  (physical measure)
// FRA rate              = (1/tau) * (P(0,T1)/P(0,T2) - 1)  (risk-neutral)
// The convexity adjustment converts the futures rate to the FRA rate:
// FRA_rate ≈ futures_rate - convexity_adj
//
// Hull-White (1990) adjustment for 3-month future expiring at T1:
// adj = sigma^2 / (2*a^2) * (1 - e^{-a*T1})^2 * (1 - e^{-a*tau})
// where tau = T2 - T1 (accrual period), a = mean reversion speed.
// For the simplified Vasicek case (a → 0): adj ≈ sigma^2 * T1 * tau / 2.

struct HWConvexityAdj {
    double futures_rate;     // market futures rate (annualised)
    double fra_rate;         // forward rate after convexity adjustment
    double adjustment_bps;  // adjustment in basis points
};

HWConvexityAdj eurodollarConvAdj(double futures_rate,  // e.g. 0.054 for 94.60 contract
                                   double T1,            // futures delivery date (years)
                                   double tau,           // accrual period (e.g. 0.25)
                                   double a,             // HW mean reversion speed
                                   double sigma) {       // HW short-rate vol
    double adj;
    if (std::abs(a) < 1e-6) {
        // Vasicek limit (a=0): adj = sigma^2 * T1 * tau / 2
        adj = 0.5 * sigma * sigma * T1 * tau;
    } else {
        // Full Hull-White formula
        double eaT1  = std::exp(-a * T1);
        double eatau = std::exp(-a * tau);
        adj = (sigma * sigma) / (2.0 * a * a)
            * (1.0 - eaT1) * (1.0 - eaT1)
            * (1.0 - eatau);
    }

    double fra = futures_rate - adj;
    return {futures_rate, fra, adj * 10000.0};
}

// Build convexity-adjusted forward curve from SOFR futures strip
std::vector<HWConvexityAdj> adjustFuturesCurve(
    const std::vector<double>& futures_rates,
    double a, double sigma,
    double tau = 0.25) {
    std::vector<HWConvexityAdj> adjs;
    for (std::size_t i = 0; i < futures_rates.size(); ++i) {
        double T1 = (i + 1) * tau;   // quarterly delivery dates
        adjs.push_back(eurodollarConvAdj(futures_rates[i], T1, tau, a, sigma));
    }
    return adjs;
}`,
    explanation:
      "The convexity adjustment arises because futures are marked-to-market daily (with P&L settled via the margin account) whereas an FRA payoff occurs at a single future date. When rates rise (futures price falls), the futures short position gains cash that can be reinvested at higher rates — and vice versa — creating a systematic asymmetry that makes futures rates higher than equivalent FRA rates by the convexity adjustment amount.",
  },
  {
    id: "cpp-20260612-b1-fnv1a-hash",
    language: "cpp",
    title: "FNV-1a fast hash — O(1) order-ID and symbol hashing without collisions",
    tag: "performance",
    code: `#include <cstdint>
#include <cstring>
#include <string_view>

// FNV-1a (Fowler-Noll-Vo alternate): fast non-cryptographic hash.
// XOR-then-multiply on each byte; mixes better than FNV-1 (multiply-then-XOR).
// Properties: avalanche effect, no special-case branches, no division.
// Throughput: ~1 byte/cycle on modern x86 (scalar); SIMD for large buffers.

static constexpr uint64_t FNV_BASIS = 14695981039346656037ULL;
static constexpr uint64_t FNV_PRIME = 1099511628211ULL;

inline uint64_t fnv1a(const void* data, std::size_t len) noexcept {
    uint64_t      hash = FNV_BASIS;
    const uint8_t* p  = static_cast<const uint8_t*>(data);
    for (std::size_t i = 0; i < len; ++i) {
        hash ^= p[i];
        hash *= FNV_PRIME;
    }
    return hash;
}

// Compile-time hash for string literals (constexpr)
constexpr uint64_t fnv1a_ct(std::string_view sv) noexcept {
    uint64_t hash = FNV_BASIS;
    for (unsigned char c : sv) {
        hash ^= c;
        hash *= FNV_PRIME;
    }
    return hash;
}

// Specialised for 8-byte order IDs (common in FIX messages)
inline uint64_t hashOrderId(uint64_t id) noexcept {
    uint64_t hash = FNV_BASIS;
    const uint8_t* p = reinterpret_cast<const uint8_t*>(&id);
    for (int i = 0; i < 8; ++i) { hash ^= p[i]; hash *= FNV_PRIME; }
    return hash;
}

// Combine two hashes for composite keys (price, symbol_id)
inline uint64_t hashCombine(uint64_t h1, uint64_t h2) noexcept {
    return h1 ^ (h2 * 0x9e3779b97f4a7c15ULL + (h1 << 6) + (h1 >> 2));
}

// Custom hash for use with std::unordered_map
struct OrderIdHash {
    std::size_t operator()(uint64_t id) const noexcept {
        return static_cast<std::size_t>(hashOrderId(id));
    }
};`,
    explanation:
      "FNV-1a is widely used in HFT for its excellent avalanche properties with minimal code — the XOR-before-multiply ensures that a single bit flip in the input changes approximately half the output bits. The compile-time constexpr version enables switch statements on string values (dispatching FIX message type strings like '8' / 'D' / 'F' at compile time), and the hashCombine function is the Boost hash_combine idiom adapted for uint64_t.",
  },
  {
    id: "cpp-20260612-b1-bdt-tree",
    language: "cpp",
    title: "Black-Derman-Toy binomial tree — calibrated short-rate lattice",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <algorithm>

// BDT (Black-Derman-Toy 1990): lognormal short-rate model on a binomial tree.
// At each node (i, j): r_{i,j} = u_i * exp(sigma_i * j * sqrt(dt))
// u_i and sigma_i are calibrated to match market ZCB prices and cap vols.
// Simplified here: constant sigma, calibrate u_i to ZCB prices only.
// Arrow-Debreu prices A[i][j] = state price for reaching node (i,j).

struct BDTTree {
    int    N;       // number of time steps
    double dt;
    std::vector<std::vector<double>> rates;    // r[i][j]: rate at step i, node j
    std::vector<std::vector<double>> ad;       // Arrow-Debreu prices
};

BDTTree buildBDT(const std::vector<double>& market_zcb,  // P(0, i*dt) for i=1..N
                  double sigma,                            // constant vol
                  double dt) {
    int N = static_cast<int>(market_zcb.size());
    BDTTree tree;
    tree.N = N; tree.dt = dt;
    tree.rates.assign(N + 1, std::vector<double>(N + 1, 0.0));
    tree.ad.assign(N + 1, std::vector<double>(N + 1, 0.0));
    tree.ad[0][0] = 1.0;

    for (int i = 0; i < N; ++i) {
        // Calibrate u_i by bisection on ZCB price match
        double target = market_zcb[i];
        double lo = 1e-6, hi = 5.0;
        for (int iter = 0; iter < 60; ++iter) {
            double u = 0.5 * (lo + hi);
            // Compute ZCB price from Arrow-Debreu prices
            double zcb = 0.0;
            for (int j = 0; j <= i; ++j) {
                double r = u * std::exp(sigma * (2.0 * j - i) * std::sqrt(dt));
                double df = std::exp(-r * dt);
                zcb += tree.ad[i][j] * df;
            }
            if (zcb < target) hi = u; else lo = u;
        }
        double u_cal = 0.5 * (lo + hi);

        // Fill rates and propagate Arrow-Debreu prices
        for (int j = 0; j <= i; ++j) {
            tree.rates[i][j] = u_cal * std::exp(sigma * (2.0 * j - i) * std::sqrt(dt));
            double df = std::exp(-tree.rates[i][j] * dt);
            double p  = 0.5;  // risk-neutral probability = 0.5 for BDT
            tree.ad[i+1][j+1] += tree.ad[i][j] * p * df;
            tree.ad[i+1][j]   += tree.ad[i][j] * p * df;
        }
    }
    return tree;
}

// Price any European derivative on the short rate using backward induction
double priceDerivative(const BDTTree& tree,
                        std::function<double(double)> payoff_at_maturity) {
    int N = tree.N;
    std::vector<double> V(N + 1);
    for (int j = 0; j <= N; ++j)
        V[j] = payoff_at_maturity(tree.rates[N][j]);
    for (int i = N - 1; i >= 0; --i)
        for (int j = 0; j <= i; ++j) {
            double df = std::exp(-tree.rates[i][j] * tree.dt);
            V[j] = df * 0.5 * (V[j] + V[j + 1]);
        }
    return V[0];
}`,
    explanation:
      "The BDT model prices interest rate derivatives by constructing a lognormal binomial tree for the short rate that is calibrated to match market zero-coupon bond prices exactly. Arrow-Debreu prices (state prices) enable efficient calibration of each time step's centre rate u_i without reprocessing prior nodes — A[i][j] is the present value of $1 paid if and only if the economy reaches state j at time i, making the calibration a straightforward root-finding problem at each step.",
  },
  {
    id: "cpp-20260612-b1-cholesky-sim",
    language: "cpp",
    title: "Cholesky decomposition — correlated risk factor simulation",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <random>
#include <stdexcept>

// Cholesky: decompose a positive definite covariance matrix C = L * L^T.
// To simulate correlated normals: X = L * Z where Z ~ N(0, I).
// Then X ~ N(0, C) — the covariance of X is L*I*L^T = C. Exact.
// Used for: multi-asset MC option pricing, correlated PnL scenarios,
//           Gaussian copula joint default simulation.

// In-place lower Cholesky (overwrites lower triangle of C)
bool choleskyDecompose(std::vector<std::vector<double>>& C) {
    int n = static_cast<int>(C.size());
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j <= i; ++j) {
            double s = C[i][j];
            for (int k = 0; k < j; ++k) s -= C[i][k] * C[j][k];
            if (i == j) {
                if (s < 0) return false;   // not positive definite
                C[i][j] = std::sqrt(s);
            } else {
                C[i][j] = (C[j][j] > 0) ? s / C[j][j] : 0.0;
            }
        }
    }
    return true;
}

// Simulate n_paths paths of correlated normals X ~ N(mu, Sigma)
std::vector<std::vector<double>> simulateCorrelated(
    const std::vector<double>& mu,        // means
    std::vector<std::vector<double>> Sigma, // covariance matrix (modified in place)
    int n_paths, int seed = 42) {

    int n = static_cast<int>(mu.size());
    if (!choleskyDecompose(Sigma))
        throw std::runtime_error("Covariance matrix not positive definite");

    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    std::vector<std::vector<double>> paths(n_paths, std::vector<double>(n));

    for (int p = 0; p < n_paths; ++p) {
        // Draw Z ~ N(0, I)
        std::vector<double> Z(n);
        for (int i = 0; i < n; ++i) Z[i] = nd(rng);

        // Compute X = mu + L * Z
        for (int i = 0; i < n; ++i) {
            double x = mu[i];
            for (int j = 0; j <= i; ++j) x += Sigma[i][j] * Z[j];
            paths[p][i] = x;
        }
    }
    return paths;
}
// Note: Sigma is modified in place (lower triangle filled with L).
// For repeated simulations with the same covariance, store L separately.`,
    explanation:
      "Cholesky decomposition is O(N³/3) compared to full LU decomposition's O(N³/2) — the factor-of-2 speedup comes from exploiting positive-definiteness, which guarantees the diagonal elements are real and positive. In risk simulation with N=50 correlated factors, the Cholesky cost is negligible (done once), and the subsequent path simulation is O(N) per sample using the lower triangular structure via forward substitution.",
  },
];
