import type { Snippet } from "./types";

export const cppSnippets20260622B1: Snippet[] = [
  {
    id: "cpp-20260622-b1-pmr-monotonic",
    language: "cpp",
    title: "PMR monotonic_buffer_resource for per-order arena allocation",
    tag: "memory",
    code: `#include <memory_resource>
#include <vector>
#include <array>
#include <cstddef>

// PMR monotonic buffer: bump-allocates from a fixed stack array.
// Deallocation is a no-op; the entire arena resets between orders.
// Zero system-allocator calls during order processing.
struct OrderArena {
    std::array<std::byte, 65536> buf;
    std::pmr::monotonic_buffer_resource mbr{buf.data(), buf.size(),
        std::pmr::null_memory_resource()};  // throw if we overflow the arena

    // PMR vector: stores in the arena, not on the heap
    std::pmr::vector<double> prices{&mbr};
    std::pmr::vector<int>    qtys  {&mbr};

    void resetArena() noexcept {
        // Destroy objects first, then reset the bump pointer
        prices = std::pmr::vector<double>{&mbr};
        qtys   = std::pmr::vector<int>   {&mbr};
        mbr.release();   // reset bump pointer to start of buf
    }
};

// Usage pattern per tick:
//   arena.prices.push_back(bid);
//   arena.qtys.push_back(qty);
//   ... process ...
//   arena.resetArena();   // O(1), no heap interaction`,
    explanation: "PMR monotonic_buffer_resource is a constant-time bump allocator: allocation is a pointer increment plus a size check, deallocation is a no-op, and release() resets the entire arena in O(1); using null_memory_resource as the upstream ensures an exception rather than a silent heap fallback if the arena overflows.",
  },
  {
    id: "cpp-20260622-b1-variant-dispatch",
    language: "cpp",
    title: "std::variant market message dispatcher with std::visit",
    tag: "modern",
    code: `#include <variant>
#include <string_view>
#include <cstdint>
#include <iostream>

struct NewOrder  { std::uint64_t id; double price; int qty; char side; };
struct CancelOrder { std::uint64_t id; };
struct ModifyOrder { std::uint64_t id; double new_price; int new_qty; };
struct TradeReport { std::uint64_t buy_id, sell_id; double price; int qty; };

using MarketMessage = std::variant<NewOrder, CancelOrder, ModifyOrder, TradeReport>;

// Overload trick: create a functor from multiple lambdas
template <typename... Ts> struct overload : Ts... { using Ts::operator()...; };
template <typename... Ts> overload(Ts...) -> overload<Ts...>;

void dispatchMessage(const MarketMessage& msg) {
    std::visit(overload{
        [](const NewOrder&  o) {
            // insert into order book
            (void)o;
        },
        [](const CancelOrder& c) {
            // remove from book
            (void)c;
        },
        [](const ModifyOrder& m) {
            // update price/qty in place
            (void)m;
        },
        [](const TradeReport& t) {
            // record fill, update P&L
            (void)t;
        }
    }, msg);
}

// Zero-overhead dispatch: the compiler generates a jump table over the
// variant's type index — equivalent to a switch on a tag, but type-safe.`,
    explanation: "std::visit over a variant generates an O(1) jump table indexed by the variant's discriminant — unlike a chain of dynamic_cast or if/else, it scales to many message types without penalty; the overload deduction guide wires multiple lambdas into a single visitor without a hand-written struct.",
  },
  {
    id: "cpp-20260622-b1-crtp-counter",
    language: "cpp",
    title: "CRTP mixin for per-class zero-cost performance counters",
    tag: "modern",
    code: `#include <atomic>
#include <cstdint>

// CRTP base injects per-class static counters with no virtual dispatch overhead.
// Each derived class D gets its OWN static atomics (different instantiations).
template <typename Derived>
struct PerfCounted {
    static std::atomic<std::uint64_t> s_allocs;
    static std::atomic<std::uint64_t> s_frees;

    static std::uint64_t allocs() noexcept { return s_allocs.load(std::memory_order_relaxed); }
    static std::uint64_t frees()  noexcept { return s_frees .load(std::memory_order_relaxed); }
    static std::uint64_t live()   noexcept { return allocs() - frees(); }
protected:
    PerfCounted() noexcept { s_allocs.fetch_add(1, std::memory_order_relaxed); }
    ~PerfCounted() noexcept { s_frees .fetch_add(1, std::memory_order_relaxed); }
};

template <typename D> std::atomic<std::uint64_t> PerfCounted<D>::s_allocs{0};
template <typename D> std::atomic<std::uint64_t> PerfCounted<D>::s_frees {0};

struct Order   : PerfCounted<Order>   { double price; int qty; };
struct Position: PerfCounted<Position>{ double notional; };

// Order::live()   counts live Order objects
// Position::live() counts live Position objects — independent counters`,
    explanation: "CRTP instantiates the template with a distinct type argument per class, so each derived class gets its own static atomic counters with no pointer indirection — querying Order::live() touches exactly two cache lines (the two atomics) and requires no vtable lookup or runtime type identification.",
  },
  {
    id: "cpp-20260622-b1-span-parser",
    language: "cpp",
    title: "std::span for zero-copy binary message field extraction",
    tag: "market-data",
    code: `#include <span>
#include <cstdint>
#include <cstring>
#include <stdexcept>

// Binary market data header (big-endian on wire):
//   [0..1]  msg_type  uint16
//   [2..5]  seq_no    uint32
//   [6..13] price     double (IEEE 754)
//   [14..17] qty      uint32
struct MsgView {
    std::span<const std::byte> data;

    explicit MsgView(const void* buf, std::size_t len) noexcept
        : data{static_cast<const std::byte*>(buf), len} {}

    // Unaligned read with explicit byte-swap (portable)
    template <typename T>
    T readAt(std::size_t offset) const {
        if (offset + sizeof(T) > data.size())
            throw std::out_of_range("MsgView: field past end");
        T val;
        std::memcpy(&val, data.data() + offset, sizeof(T));
        return val;  // caller handles endianness
    }

    std::uint16_t msgType() const { return __builtin_bswap16(readAt<std::uint16_t>(0)); }
    std::uint32_t seqNo()   const { return __builtin_bswap32(readAt<std::uint32_t>(2)); }
    double        price()   const { return readAt<double>(6); }   // assume native endian
    std::uint32_t qty()     const { return __builtin_bswap32(readAt<std::uint32_t>(14)); }

    // Sub-view of the payload portion
    std::span<const std::byte> payload() const {
        return data.subspan(18);
    }
};`,
    explanation: "std::span carries a pointer and length without owning the memory — combined with memcpy into a local variable it avoids undefined behaviour from unaligned pointer casts while still not copying the entire message; subspan() creates a view into the payload without any allocation.",
  },
  {
    id: "cpp-20260622-b1-mpsc-queue",
    language: "cpp",
    title: "Lock-free MPSC queue (Dmitry Vyukov linked-list)",
    tag: "concurrency",
    code: `#include <atomic>
#include <memory>
#include <optional>
#include <cstddef>

// Multiple-producer, single-consumer lock-free queue.
// Based on Vyukov's intrusive list: each node is its own sentinel.
// Producers: CAS-swap tail, then link backward.
// Consumer:  reads head; may spin briefly if producer has swapped tail
//            but not yet written next pointer.
template <typename T>
class MPSCQueue {
    struct Node {
        T                     val{};
        std::atomic<Node*>    next{nullptr};
    };

    alignas(64) std::atomic<Node*> tail_;
    alignas(64) Node*              head_;   // consumer-only: no sharing

    Node* allocNode() { return new Node{}; }

public:
    MPSCQueue() {
        Node* stub = allocNode();
        head_ = stub;
        tail_.store(stub, std::memory_order_relaxed);
    }

    void push(T val) {
        Node* n = allocNode();
        n->val = std::move(val);
        Node* prev = tail_.exchange(n, std::memory_order_acq_rel);
        prev->next.store(n, std::memory_order_release); // linearisation point
    }

    std::optional<T> pop() noexcept {
        Node* h    = head_;
        Node* next = h->next.load(std::memory_order_acquire);
        if (!next) return std::nullopt;   // empty
        head_ = next;
        T val = std::move(next->val);
        delete h;   // delete old sentinel
        return val;
    }

    ~MPSCQueue() {
        while (pop()) {}
        delete head_;
    }
};`,
    explanation: "The Vyukov MPSC queue allows multiple producers to push concurrently via a single exchange() on the tail, then each producer writes its next pointer independently — the consumer must spin on next if it pops before the producer finishes linking, which is the only safe spin-wait in this design.",
  },
  {
    id: "cpp-20260622-b1-bs-greeks",
    language: "cpp",
    title: "Black-Scholes closed-form Greeks (delta, gamma, vega, theta, rho)",
    tag: "derivatives",
    code: `#include <cmath>

// Standard normal PDF and CDF
static double npdf(double x) noexcept {
    return std::exp(-0.5*x*x) / std::sqrt(2.0*M_PI);
}
static double ncdf(double x) noexcept {
    return 0.5 * std::erfc(-x / std::sqrt(2.0));
}

struct BSGreeks {
    double price, delta, gamma, vega, theta, rho;
};

// call = true for call, false for put
BSGreeks bsGreeks(double S, double K, double r, double sigma,
                  double T, bool call = true) noexcept {
    const double sqT = std::sqrt(T);
    const double d1  = (std::log(S / K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    const double d2  = d1 - sigma*sqT;
    const double Nd1 = ncdf(d1), Nd2 = ncdf(d2);
    const double Pd1 = npdf(d1);
    const double disc = std::exp(-r*T);

    BSGreeks g{};
    if (call) {
        g.price = S*Nd1 - K*disc*Nd2;
        g.delta = Nd1;
        g.theta = (-S*Pd1*sigma/(2.0*sqT) - r*K*disc*Nd2) / 365.0;
        g.rho   =  K*T*disc*Nd2 / 100.0;
    } else {
        g.price = K*disc*(1.0-Nd2) - S*(1.0-Nd1);
        g.delta = Nd1 - 1.0;
        g.theta = (-S*Pd1*sigma/(2.0*sqT) + r*K*disc*(1.0-Nd2)) / 365.0;
        g.rho   = -K*T*disc*(1.0-Nd2) / 100.0;
    }
    // Gamma and vega are the same for call and put
    g.gamma = Pd1 / (S*sigma*sqT);
    g.vega  = S*Pd1*sqT / 100.0;   // per 1 vol point
    return g;
}`,
    explanation: "Gamma and vega are identical for calls and puts by put-call parity differentiation; theta is expressed per calendar day (divide by 365) and rho per percentage-point rate move (divide by 100) to match the quoting convention traders use on option desks.",
  },
  {
    id: "cpp-20260622-b1-asian-mc",
    language: "cpp",
    title: "Arithmetic Asian option Monte Carlo (geometric control variate)",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <numeric>

// Closed-form price for GEOMETRIC average Asian call (used as control variate)
static double geometricAsianCall(double S0, double K, double r,
                                  double sigma, double T, int n) noexcept {
    double sig_g = sigma * std::sqrt((2.0*n+1) / (6.0*(n+1)));
    double mu_g  = 0.5*(r - 0.5*sigma*sigma) + 0.5*sig_g*sig_g;
    double d1    = (std::log(S0/K) + (mu_g + 0.5*sig_g*sig_g)*T) / (sig_g*std::sqrt(T));
    double d2    = d1 - sig_g*std::sqrt(T);
    double nd1   = 0.5*std::erfc(-d1/std::sqrt(2.0));
    double nd2   = 0.5*std::erfc(-d2/std::sqrt(2.0));
    return std::exp(-r*T) * (S0*std::exp(mu_g*T)*nd1 - K*nd2);
}

double arithmeticAsianCall(double S0, double K, double r, double sigma,
                            double T, int n_fix = 12, int n_paths = 100000,
                            unsigned seed = 0) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;
    const double dt = T / n_fix, sqdt = std::sqrt(dt), disc = std::exp(-r*T);
    const double geo_price = geometricAsianCall(S0, K, r, sigma, T, n_fix);

    double sum_arith = 0.0, sum_geo_mc = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double S    = S0, arith_sum = 0.0, geo_logsum = 0.0;
        for (int i = 0; i < n_fix; ++i) {
            S *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*sqdt*Z(rng));
            arith_sum   += S;
            geo_logsum  += std::log(S);
        }
        double A_avg = arith_sum   / n_fix;
        double G_avg = std::exp(geo_logsum / n_fix);
        sum_arith   += std::max(A_avg - K, 0.0);
        sum_geo_mc  += std::max(G_avg - K, 0.0);
    }

    // Control variate: E[C_arith] ≈ MC_arith - beta*(MC_geo - CF_geo)
    double beta = 1.0;  // beta ≈ 1 works well for arithmetic/geometric pair
    return disc * (sum_arith/n_paths - beta*(sum_geo_mc/n_paths - geo_price));
}`,
    explanation: "Using the geometric Asian as a control variate cuts variance by 70-90% because the arithmetic and geometric averages are highly correlated path-by-path; the geometric average has a closed-form price, so the correction (MC_geo - CF_geo) has zero mean and the variance reduction is near-optimal for beta=1.",
  },
  {
    id: "cpp-20260622-b1-barrier-mc",
    language: "cpp",
    title: "Discrete-monitoring up-and-out barrier option Monte Carlo",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>

// Up-and-out call: pays max(S_T-K, 0) if S never exceeded barrier H
// at any of the N_bar discrete monitoring dates.
// Continuity correction (Broadie-Glasserman-Kou): shift barrier by
//   H * exp(0.5826 * sigma * sqrt(dt)) for continuous-approximation.
double uoBarrierCall(double S0, double K, double H, double r,
                     double sigma, double T,
                     int n_bar = 252, int n_paths = 100000,
                     unsigned seed = 0, bool bcc = true) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;
    const double dt    = T / n_bar;
    const double sqdt  = std::sqrt(dt);
    const double disc  = std::exp(-r*T);
    // BGK continuity correction (discrete → continuous approximation)
    const double H_adj = bcc ? H * std::exp(0.5826 * sigma * sqdt) : H;

    double payoff_sum = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double S = S0;
        bool knocked_out = false;
        for (int i = 0; i < n_bar; ++i) {
            S *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*sqdt*Z(rng));
            if (S >= H_adj) { knocked_out = true; break; }
        }
        if (!knocked_out)
            payoff_sum += std::max(S - K, 0.0);
    }
    return disc * payoff_sum / n_paths;
}`,
    explanation: "The Broadie-Glasserman-Kou continuity correction shifts the discrete monitoring barrier inward by exp(0.5826σ√dt), where 0.5826 = -ζ(1/2)/√(2π); this converts the discrete-monitoring price into an approximation of the continuous-monitoring price without running at daily step sizes.",
  },
  {
    id: "cpp-20260622-b1-lookback-mc",
    language: "cpp",
    title: "Floating-strike lookback call Monte Carlo",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Floating-strike lookback call: payoff = S_T - min(S_t, 0<=t<=T)
// The holder buys at the realized minimum — maximum regret instrument.
// Conze-Viswanathan (1991) has a closed form; MC here for comparison.
double lookbackCallMC(double S0, double r, double sigma, double T,
                       int n_steps = 252, int n_paths = 100000,
                       unsigned seed = 0) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;
    const double dt   = T / n_steps, sqdt = std::sqrt(dt);
    const double disc = std::exp(-r*T);
    double psum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0, S_min = S0;
        for (int i = 0; i < n_steps; ++i) {
            S    *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*sqdt*Z(rng));
            S_min = std::min(S_min, S);
        }
        psum += S - S_min;   // always non-negative
    }
    return disc * psum / n_paths;
}

// Analytic price (Conze-Viswanathan)
double lookbackCallAnalytic(double S0, double r, double sigma, double T) {
    auto ncdf = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    double a1 = (std::log(S0/S0)+(r+0.5*sigma*sigma)*T)/(sigma*std::sqrt(T));
    double a2 = a1 - sigma*std::sqrt(T);
    double c  = 2.0*r/(sigma*sigma);
    return S0*ncdf(a1) - S0*std::exp(-r*T)*ncdf(a2)
           + S0*sigma*sigma/(2.0*r)*(1.0 - S0/S0*std::exp(-r*T))
           - S0*ncdf(-a1) + S0*std::exp(-r*T)*ncdf(-a2); // reduces at S0=S_min
}`,
    explanation: "The floating-strike lookback call is the most expensive vanilla-style exotic because it guarantees buying at the path minimum; its analytic price has an extra term proportional to σ²/(2r) reflecting the expected benefit of the minimum being below S0, which increases with vol and decreases with high rates that erode the present value of future optionality.",
  },
  {
    id: "cpp-20260622-b1-hull-white",
    language: "cpp",
    title: "Hull-White one-factor exact simulation and ZCB pricing",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <vector>

// Hull-White: dr = (theta(t) - kappa*r)*dt + sigma*dW
// For a flat initial curve r0, theta(t) = kappa*r0 + 0.5*sigma^2/kappa*(1-e^{-2*kappa*t})
// Exact conditional distribution: r(t+dt)|r(t) ~ N(mean, var)
struct HullWhite {
    double kappa, sigma, r0;

    double condMean(double r, double dt) const noexcept {
        double e  = std::exp(-kappa*dt);
        double lrm = r0 + 0.5*sigma*sigma/(kappa*kappa);  // long-run mean approx
        return r*e + lrm*(1.0-e);
    }
    double condVar(double dt) const noexcept {
        return sigma*sigma/(2.0*kappa)*(1.0 - std::exp(-2.0*kappa*dt));
    }

    // Simulate short-rate path
    std::vector<double> simulate(double T, int n, unsigned seed=0) const {
        std::mt19937_64 rng(seed);
        std::normal_distribution<double> Z;
        double dt = T/n, r = r0, cv = condVar(dt);
        std::vector<double> path(n+1);
        path[0] = r;
        for (int i = 0; i < n; ++i) {
            r = condMean(r, dt) + std::sqrt(cv)*Z(rng);
            path[i+1] = r;
        }
        return path;
    }

    // Analytic ZCB price P(0,T) = A(T)*exp(-B(T)*r0)
    double B(double T) const noexcept {
        return (1.0 - std::exp(-kappa*T))/kappa;
    }
    double zcb(double T) const noexcept {
        double b   = B(T);
        double lnA = (b - T)*( r0 - 0.5*sigma*sigma/(kappa*kappa) )
                     - sigma*sigma*b*b/(4.0*kappa);
        return std::exp(lnA - b*r0);
    }
};`,
    explanation: "Hull-White's exact conditional Gaussian simulation uses the known mean and variance of the conditional distribution, eliminating the O(√dt) Euler bias entirely — this matters for long-maturity rates products where thousands of steps would be needed to match the exact distribution otherwise.",
  },
  {
    id: "cpp-20260622-b1-antithetic",
    language: "cpp",
    title: "Antithetic variates for European option Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <random>

// Antithetic variates: for each path Z, also compute -Z.
// f(Z) and f(-Z) are negatively correlated => Var[0.5*(f(Z)+f(-Z))] < Var[f(Z)].
// Halves the number of RNG calls for the same variance reduction factor.
double callWithAntithetic(double S0, double K, double r, double sigma,
                           double T, int n_paths = 50000, unsigned seed = 0) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;
    const double fwd_factor = (r - 0.5*sigma*sigma)*T;
    const double sig_sqT    = sigma*std::sqrt(T);
    const double disc       = std::exp(-r*T);
    double psum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double z  = Z(rng);
        double S1 = S0 * std::exp(fwd_factor + sig_sqT * z);   // original path
        double S2 = S0 * std::exp(fwd_factor - sig_sqT * z);   // antithetic path
        psum += 0.5*(std::max(S1-K, 0.0) + std::max(S2-K, 0.0));
    }
    return disc * psum / n_paths;
}

// The variance reduction is roughly (1-rho)/2 where rho = corr(payoff(Z), payoff(-Z)).
// For OTM calls rho is strongly negative, so variance halves or better.
// For deeply OTM options near zero, both paths give zero payoff => no reduction.`,
    explanation: "Antithetic sampling exploits the symmetry of the standard normal: f(Z) and f(-Z) are generated from the same draw, so effective paths double with no extra RNG calls; for near-ATM options the variance reduction approaches 50%, though for digital options or barrier instruments antithetic paths can actually increase variance if both hit or miss simultaneously.",
  },
  {
    id: "cpp-20260622-b1-control-variate",
    language: "cpp",
    title: "Control variate MC: exact BS price reduces Heston variance",
    tag: "numerics",
    code: `#include <cmath>
#include <random>

// Control variate: run Heston MC while simultaneously recording the
// BS payoff (using the same Brownian shocks). The BS price is known exactly.
// Estimator: Heston_price ≈ MC_heston - beta*(MC_bs - BS_closed)
// With optimal beta = Cov(heston, bs) / Var(bs) ≈ 1 for small vol-of-vol.
double hestonCallCV(double S0, double K, double r,
                    double v0, double kappa, double theta, double sigma,
                    double rho, double bs_sigma,  // BS vol for control
                    double T, int n = 200, int P = 50000, unsigned seed=0) {
    double bs_closed = [&]() {  // BS closed-form (lambda for brevity)
        double d1 = (std::log(S0/K)+(r+0.5*bs_sigma*bs_sigma)*T)/(bs_sigma*std::sqrt(T));
        double d2 = d1 - bs_sigma*std::sqrt(T);
        auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
        return S0*N(d1) - K*std::exp(-r*T)*N(d2);
    }();

    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;
    double dt=T/n, sqdt=std::sqrt(dt), disc=std::exp(-r*T);
    double sum_h=0, sum_bs=0;

    for (int p=0; p<P; ++p) {
        double S_h=S0, S_bs=S0, v=v0;
        for (int i=0; i<n; ++i) {
            double z1=Z(rng), z2=rho*z1+std::sqrt(1-rho*rho)*Z(rng);
            double sv=std::sqrt(std::max(v,0.0));
            v+=kappa*(theta-std::max(v,0.0))*dt+sigma*sv*sqdt*z2; v=std::max(v,0.0);
            S_h  *=std::exp((r-0.5*std::max(v,0.0))*dt+sv*sqdt*z1);
            S_bs *=std::exp((r-0.5*bs_sigma*bs_sigma)*dt+bs_sigma*sqdt*z1);
        }
        sum_h  +=std::max(S_h -K,0.0);
        sum_bs +=std::max(S_bs-K,0.0);
    }
    double mc_h  = disc*sum_h /P;
    double mc_bs = disc*sum_bs/P;
    return mc_h - (mc_bs - bs_closed);  // beta=1 approximation
}`,
    explanation: "The BS control variate reuses the same standard-normal draws for both the Heston and BS processes, so the two payoffs share the same realised equity path noise; the remaining variance difference reflects only the vol-of-vol component, which is typically 5-15% of total Heston variance for modest sigma.",
  },
  {
    id: "cpp-20260622-b1-almgren-chriss",
    language: "cpp",
    title: "Almgren-Chriss optimal execution trajectory",
    tag: "market-microstructure",
    code: `#include <vector>
#include <cmath>

// Almgren-Chriss (2001): liquidate Q shares over T periods.
// Temporary impact: lambda per share per period.
// Permanent impact: gamma per share per period.
// Risk aversion: kappa (higher = faster liquidation).
// Optimal trajectory: x_j = Q * sinh(kappa*(N-j)*tau) / sinh(kappa*N*tau)
struct AlmgrenChriss {
    double Q;       // initial inventory to liquidate
    double T;       // total time horizon (years)
    int    N;       // number of periods
    double sigma;   // annualised vol
    double gamma;   // permanent impact (shares -> price)
    double lambda;  // temporary impact
    double kappa_r; // risk aversion (AIM parameter)

    double kappa() const noexcept {
        // Solve the characteristic equation numerically for simplicity
        return std::sqrt(kappa_r * sigma * sigma / lambda);
    }

    // Optimal holdings at each step (Q at start, 0 at end)
    std::vector<double> holdings() const {
        std::vector<double> x(N+1);
        const double k   = kappa();
        const double tau = T / N;
        const double denom = std::sinh(k * N * tau);
        for (int j = 0; j <= N; ++j) {
            x[j] = (denom > 1e-12)
                ? Q * std::sinh(k * (N - j) * tau) / denom
                : Q * double(N - j) / N;   // linear limit as kappa->0
        }
        return x;
    }

    // Trades (shares sold) in each period
    std::vector<double> trades() const {
        auto x = holdings();
        std::vector<double> n(N);
        for (int j = 0; j < N; ++j) n[j] = x[j] - x[j+1];
        return n;
    }
};`,
    explanation: "When kappa→0 (risk-neutral), the Almgren-Chriss trajectory degenerates to TWAP (linear equal slices); as kappa increases (higher risk aversion), the trajectory front-loads sales to avoid adverse drift, trading off higher market impact for lower variance — the optimal curve between these extremes is exactly the hyperbolic-sine ratio.",
  },
  {
    id: "cpp-20260622-b1-vwap-online",
    language: "cpp",
    title: "Online VWAP calculator with rolling reset",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>

// Online VWAP accumulator: updated on every fill or trade print.
// No division until VWAP is queried — avoids division-per-tick cost.
struct VWAPCalc {
    double cum_pv   = 0.0;   // cumulative price * volume
    double cum_vol  = 0.0;   // cumulative volume

    void addTrade(double price, double qty) noexcept {
        cum_pv  += price * qty;
        cum_vol += qty;
    }

    double vwap() const noexcept {
        return (cum_vol > 0.0) ? cum_pv / cum_vol : 0.0;
    }

    void reset() noexcept { cum_pv = cum_vol = 0.0; }
};

// Session VWAP with time-weighted fallback for thin markets
struct SessionVWAP {
    VWAPCalc calc;
    double   last_price = 0.0;
    std::uint64_t last_ts = 0;    // nanoseconds since epoch

    void onTrade(double price, double qty, std::uint64_t ts_ns) noexcept {
        calc.addTrade(price, qty);
        last_price = price;
        last_ts    = ts_ns;
    }

    // Inject a time-slice contribution when no trade: use last price, weight by time
    void onTimeslice(std::uint64_t ts_ns, double qty_equiv = 1.0) noexcept {
        if (last_price > 0.0 && ts_ns > last_ts) {
            double weight = (ts_ns - last_ts) * 1e-9 * qty_equiv;
            calc.addTrade(last_price, weight);
            last_ts = ts_ns;
        }
    }

    double vwap() const noexcept { return calc.vwap(); }
};`,
    explanation: "Deferring division to query time means each tick costs only two multiply-adds; the time-weighted fallback uses mid-point interpolation during sparse periods so the session VWAP doesn't collapse to a simple average of traded prices when volume is concentrated in short bursts.",
  },
  {
    id: "cpp-20260622-b1-digital-call",
    language: "cpp",
    title: "Binary/digital call option: closed-form and finite-difference",
    tag: "derivatives",
    code: `#include <cmath>
#include <vector>

static double ncdf(double x) noexcept {
    return 0.5*std::erfc(-x/std::sqrt(2.0));
}

// Cash-or-nothing digital call: pays $1 if S_T > K, else 0
// Price = e^{-rT} * N(d2)
struct DigitalCall {
    double S0, K, r, sigma, T;

    double price() const noexcept {
        double d2 = (std::log(S0/K) + (r - 0.5*sigma*sigma)*T)
                    / (sigma*std::sqrt(T));
        return std::exp(-r*T) * ncdf(d2);
    }

    // Delta of digital = -Nd'(d2) / (S * sigma * sqrt(T)) * disc
    double delta() const noexcept {
        double sqT = std::sqrt(T);
        double d2  = (std::log(S0/K) + (r - 0.5*sigma*sigma)*T) / (sigma*sqT);
        double pd2 = std::exp(-0.5*d2*d2) / std::sqrt(2.0*M_PI);
        return std::exp(-r*T) * pd2 / (S0 * sigma * sqT);
    }

    // Replication: digital ≈ (call_spread) / dK
    // long call(K), short call(K+dK), scale by 1/dK
    double replicatedPrice(double dK = 0.10) const noexcept {
        auto bs = [&](double k) {
            double sqT = std::sqrt(T);
            double d1  = (std::log(S0/k)+(r+0.5*sigma*sigma)*T)/(sigma*sqT);
            double d2  = d1 - sigma*sqT;
            return S0*ncdf(d1) - k*std::exp(-r*T)*ncdf(d2);
        };
        return (bs(K) - bs(K+dK)) / dK;
    }
};`,
    explanation: "The digital call's delta spikes to infinity as S→K near expiry, making delta-hedging practically impossible — practitioners instead replicate it as a tight call spread (long K, short K+ε), which caps the replication delta at 1/ε and introduces a small model error proportional to the spread width.",
  },
  {
    id: "cpp-20260622-b1-variance-swap",
    language: "cpp",
    title: "Variance swap fair strike from discrete log-returns",
    tag: "derivatives",
    code: `#include <vector>
#include <cmath>
#include <numeric>

// Variance swap: buyer pays fixed strike K_var, receives realized variance.
// Fair strike under BS: K_var = sigma^2 (trivially).
// From realized log-returns: annualised variance = (252/N) * sum(r_i^2) - drift term.
struct VarianceSwap {
    double notional;     // vega notional (PnL = notional * (realised - strike) / 2)
    double K_var;        // strike in variance (e.g. 0.04 = 20% strike)

    // Compute realised variance from a price path
    static double realisedVariance(const std::vector<double>& prices,
                                    double ann_factor = 252.0) noexcept {
        const int n = static_cast<int>(prices.size()) - 1;
        if (n <= 0) return 0.0;
        std::vector<double> lr(n);
        for (int i = 0; i < n; ++i)
            lr[i] = std::log(prices[i+1] / prices[i]);
        double mean = std::reduce(lr.begin(), lr.end()) / n;
        double var  = 0.0;
        for (double r : lr) var += (r - mean)*(r - mean);
        return ann_factor * var / (n - 1);   // unbiased estimator * annualise
    }

    // P&L at maturity given realised var
    double pnl(double realised_var) const noexcept {
        return notional * (realised_var - K_var) / 2.0;
    }

    // Replication: fair strike = sum of log-contract weights over option strip
    // Approx: K_var ≈ (2/T) * [F/S0 - 1 - ln(F/S0)] + integral vol surface
    static double approxStrike(double /*F*/, double /*S0*/,
                                 double atm_vol, double /*T*/) noexcept {
        return atm_vol * atm_vol;   // flat smile approximation
    }
};`,
    explanation: "Variance swaps are pure volatility instruments: unlike straddles they have no delta and their P&L depends only on the path-integrated variance; the replication as a log contract (continuous strip of weighted OTM options) is why variance swap strikes are typically quoted as implied variance rather than implied vol, since variance is additive across time.",
  },
  {
    id: "cpp-20260622-b1-irs-pricing",
    language: "cpp",
    title: "Fixed-for-floating interest rate swap pricing",
    tag: "fixed-income",
    code: `#include <vector>
#include <cmath>
#include <numeric>

// Plain vanilla IRS: fixed leg pays K * notional * tau every period,
// float leg pays LIBOR/SOFR reset at start of each period.
// NPV(payer) = float_leg_PV - fixed_leg_PV
// Fixed rate par swap: set K so NPV = 0.
struct IRSwap {
    double notional;
    std::vector<double> tenors;     // coupon dates in years
    std::vector<double> dfs;        // risk-free discount factors at each tenor
    std::vector<double> fwd_rates;  // forward rates for each period

    double fixedLegPV(double K) const noexcept {
        double pv = 0.0;
        for (std::size_t i = 0; i < tenors.size(); ++i) {
            double tau = (i==0) ? tenors[0] : tenors[i]-tenors[i-1];
            pv += K * notional * tau * dfs[i];
        }
        return pv;
    }

    double floatLegPV() const noexcept {
        double pv = 0.0;
        for (std::size_t i = 0; i < tenors.size(); ++i) {
            double tau = (i==0) ? tenors[0] : tenors[i]-tenors[i-1];
            pv += fwd_rates[i] * notional * tau * dfs[i];
        }
        return pv;
    }

    // Par swap rate: K such that NPV = 0
    double parSwapRate() const noexcept {
        double num = 0.0, den = 0.0;
        for (std::size_t i = 0; i < tenors.size(); ++i) {
            double tau = (i==0) ? tenors[0] : tenors[i]-tenors[i-1];
            num += fwd_rates[i] * tau * dfs[i];
            den += tau * dfs[i];
        }
        return (den > 0.0) ? num / den : 0.0;
    }

    // DV01: derivative of fixed-leg PV w.r.t. K (per bp)
    double dv01() const noexcept {
        return fixedLegPV(1.0) * 0.0001;   // 1bp = 0.01% move in K
    }
};`,
    explanation: "The par swap rate is the weighted average of forward rates, where weights are discount-factor-times-coverage — this is the IRR of the float leg; DV01 equals the annuity factor (sum of tau*df) times notional times 1bp, which is why long-dated swaps have enormous DV01 relative to their notional.",
  },
  {
    id: "cpp-20260622-b1-cubic-spline",
    language: "cpp",
    title: "Natural cubic spline for implied vol surface interpolation",
    tag: "numerics",
    code: `#include <vector>
#include <stdexcept>
#include <cmath>

// Natural cubic spline: second derivative = 0 at endpoints.
// Solves a tridiagonal system for the coefficients.
struct CubicSpline {
    std::vector<double> xs_, as_, bs_, cs_, ds_;

    CubicSpline(const std::vector<double>& x, const std::vector<double>& y) {
        const int n = static_cast<int>(x.size()) - 1;
        if (n < 2) throw std::invalid_argument("need >= 3 points");
        xs_ = x; as_ = y;
        std::vector<double> h(n), mu(n), z(n+1);
        for (int i=0; i<n; ++i) h[i]=x[i+1]-x[i];
        std::vector<double> alpha(n), l(n+1,1.0), mp(n+1,0.0);
        z.assign(n+1, 0.0);
        for (int i=1; i<n; ++i)
            alpha[i]=3.0/h[i]*(y[i+1]-y[i])-3.0/h[i-1]*(y[i]-y[i-1]);
        for (int i=1; i<n; ++i) {
            l[i]  = 2.0*(x[i+1]-x[i-1]) - h[i-1]*mp[i-1];
            mp[i] = h[i]/l[i];
            z[i]  = (alpha[i]-h[i-1]*z[i-1])/l[i];
        }
        cs_.resize(n+1,0.0); bs_.resize(n); ds_.resize(n);
        for (int j=n-1; j>=0; --j) {
            cs_[j] = z[j] - mp[j]*cs_[j+1];
            bs_[j] = (y[j+1]-y[j])/h[j] - h[j]*(cs_[j+1]+2.0*cs_[j])/3.0;
            ds_[j] = (cs_[j+1]-cs_[j])/(3.0*h[j]);
        }
    }

    double operator()(double x) const noexcept {
        int lo=0, hi=static_cast<int>(xs_.size())-1;
        while (hi-lo>1){int m=(lo+hi)/2;(x<xs_[m]?hi:lo)=m;}
        double dx=x-xs_[lo];
        return as_[lo]+dx*(bs_[lo]+dx*(cs_[lo]+dx*ds_[lo]));
    }
};`,
    explanation: "Natural boundary conditions (zero second derivative at endpoints) prevent the spline from curling up at the extremes of the strike range, which is critical for vol surfaces where the wings are less constrained by market quotes; using a tridiagonal solver rather than full LU decomposition keeps the coefficient fitting O(n) instead of O(n³).",
  },
  {
    id: "cpp-20260622-b1-ols-handrolled",
    language: "cpp",
    title: "Handrolled OLS regression for factor model beta estimation",
    tag: "risk",
    code: `#include <vector>
#include <cmath>
#include <stdexcept>

// Simple univariate OLS: y = alpha + beta * x + eps
// Solves the normal equations analytically.
struct OLSResult {
    double alpha, beta, r_squared, se_beta, t_stat;
};

OLSResult ols(const std::vector<double>& x, const std::vector<double>& y) {
    const int n = static_cast<int>(x.size());
    if (n < 3 || y.size() != x.size())
        throw std::invalid_argument("ols: need n>=3 matched vectors");

    double sx=0, sy=0, sxx=0, sxy=0, syy=0;
    for (int i=0; i<n; ++i){
        sx+=x[i]; sy+=y[i]; sxx+=x[i]*x[i]; sxy+=x[i]*y[i]; syy+=y[i]*y[i];
    }
    double n_  = static_cast<double>(n);
    double denom = sxx - sx*sx/n_;
    if (std::abs(denom) < 1e-14) throw std::runtime_error("ols: singular");

    OLSResult r{};
    r.beta  = (sxy - sx*sy/n_) / denom;
    r.alpha = (sy - r.beta*sx) / n_;

    // Residual sum of squares
    double ss_res = 0.0, ss_tot = 0.0;
    double ym = sy/n_;
    for (int i=0; i<n; ++i) {
        double e = y[i] - r.alpha - r.beta*x[i];
        ss_res += e*e;
        ss_tot += (y[i]-ym)*(y[i]-ym);
    }
    r.r_squared = 1.0 - ss_res/ss_tot;
    double s2   = ss_res / (n - 2);          // unbiased residual variance
    r.se_beta   = std::sqrt(s2 / denom);      // standard error of beta
    r.t_stat    = r.beta / r.se_beta;
    return r;
}`,
    explanation: "The normal equations for univariate OLS reduce to four sufficient statistics (sx, sy, sxx, sxy) computable in a single pass; computing R² and se_beta requires a second pass for residuals, but the model parameters themselves never require storing the full data — making this streaming-compatible for rolling-window betas.",
  },
  {
    id: "cpp-20260622-b1-expected-result",
    language: "cpp",
    title: "std::expected for order submission error handling (C++23)",
    tag: "modern",
    code: `#include <expected>
#include <string>
#include <cstdint>
#include <system_error>

// Rich error type instead of error codes or exceptions on the hot path
enum class OrderError : std::uint8_t {
    THROTTLED       = 1,
    REJECTED_PRICE  = 2,
    INSUFFICIENT_MARGIN = 3,
    EXCHANGE_DOWN   = 4,
};

std::string to_string(OrderError e) {
    switch (e) {
        case OrderError::THROTTLED:         return "throttled";
        case OrderError::REJECTED_PRICE:    return "price rejected";
        case OrderError::INSUFFICIENT_MARGIN: return "insufficient margin";
        case OrderError::EXCHANGE_DOWN:     return "exchange down";
    }
    return "unknown";
}

struct OrderAck { std::uint64_t order_id; double fill_price; };

// Returns either an acknowledgement or an error — no exception overhead
std::expected<OrderAck, OrderError>
submitOrder(double price, int qty, bool throttled, bool margin_ok) {
    if (throttled)   return std::unexpected(OrderError::THROTTLED);
    if (!margin_ok)  return std::unexpected(OrderError::INSUFFICIENT_MARGIN);
    if (price <= 0)  return std::unexpected(OrderError::REJECTED_PRICE);
    return OrderAck{1234567890ULL, price};   // simulated fill
}

// Monadic composition: chain operations without nested if-checks
void processOrder(double price, int qty) {
    auto result = submitOrder(price, qty, false, true)
        .transform([](const OrderAck& ack) { return ack.fill_price; });
    if (result) { /* use *result */ }
    else { /* log to_string(result.error()) */ }
    (void)result;
}`,
    explanation: "std::expected<T,E> is a discriminated union whose error path carries a typed error value without unwinding the stack — on x86-64, a successful path through a chain of transform() calls compiles to straight-line code with a single branch at the end, making it lower-latency than try/catch for anticipated error conditions like throttling.",
  },
  {
    id: "cpp-20260622-b1-compile-hash",
    language: "cpp",
    title: "Compile-time FNV-1a string hash for message-type dispatch",
    tag: "modern",
    code: `#include <cstdint>
#include <string_view>

// FNV-1a 64-bit hash — compile-time and runtime compatible.
constexpr std::uint64_t FNV_OFFSET = 14695981039346656037ULL;
constexpr std::uint64_t FNV_PRIME  = 1099511628211ULL;

constexpr std::uint64_t fnv1a(std::string_view s) noexcept {
    std::uint64_t h = FNV_OFFSET;
    for (unsigned char c : s) {
        h ^= c;
        h *= FNV_PRIME;
    }
    return h;
}

// Make the hash a usable non-type template parameter via user-defined literal
consteval std::uint64_t operator""_h(const char* s, std::size_t n) noexcept {
    return fnv1a({s, n});
}

// Compile-time switch on message type tag (avoids strcmp at runtime)
void routeMessage(std::string_view tag, const void* body) {
    switch (fnv1a(tag)) {
        case "D"_h:  // New Order Single (FIX tag 35=D)
            (void)body;
            break;
        case "F"_h:  // Order Cancel Request
            break;
        case "G"_h:  // Order Cancel Replace
            break;
        case "8"_h:  // Execution Report
            break;
        default:
            break;
    }
}`,
    explanation: "FNV-1a is non-cryptographic and intentionally weak against adversarial inputs, but it is a perfect choice for compile-time dispatch tables where the keys are known at build time; consteval ensures the literal hash is computed by the compiler and the switch statement compiles to a jump table with O(1) dispatch regardless of the number of message types.",
  },
  {
    id: "cpp-20260622-b1-price-hash-book",
    language: "cpp",
    title: "Hash-array order book: price-indexed flat array of quantities",
    tag: "data-structures",
    code: `#include <array>
#include <cstdint>
#include <algorithm>

// Hash-array order book: maps integer price (in ticks) to total qty.
// Constant-time update and query for prices within a fixed window.
// Works for markets where prices cluster around a known midpoint.
template <int WINDOW = 1024>
class HashBook {
    static_assert((WINDOW & (WINDOW-1)) == 0, "WINDOW must be power of 2");
    std::array<std::int32_t, WINDOW> bids_{};
    std::array<std::int32_t, WINDOW> asks_{};
    std::int64_t base_price_{0};  // anchor price in ticks

public:
    void setBase(std::int64_t midTick) noexcept {
        bids_.fill(0); asks_.fill(0);
        base_price_ = midTick - WINDOW/2;
    }

    std::size_t idx(std::int64_t tick) const noexcept {
        return static_cast<std::size_t>(tick - base_price_) & (WINDOW-1);
    }

    void setBid(std::int64_t tick, std::int32_t qty) noexcept { bids_[idx(tick)] = qty; }
    void setAsk(std::int64_t tick, std::int32_t qty) noexcept { asks_[idx(tick)] = qty; }

    std::int32_t bid(std::int64_t tick) const noexcept { return bids_[idx(tick)]; }
    std::int32_t ask(std::int64_t tick) const noexcept { return asks_[idx(tick)]; }

    // Best bid: scan downward from base + WINDOW/2
    std::int64_t bestBid() const noexcept {
        for (int d = WINDOW/2-1; d >= 0; --d)
            if (bids_[idx(base_price_+WINDOW/2+d)] > 0)
                return base_price_+WINDOW/2+d;
        return -1;
    }
};`,
    explanation: "By indexing the book as an array offset from a base price, bid/ask updates become a single array write with no allocation; the power-of-2 window lets the index wrap with a bitwise AND, so stale quotes from outside the window are silently overwritten — correct as long as prices don't move more than WINDOW/2 ticks without a setBase() call.",
  },
  {
    id: "cpp-20260622-b1-risk-engine",
    language: "cpp",
    title: "Real-time position and P&L risk engine with FIFO lots",
    tag: "risk",
    code: `#include <deque>
#include <cstdint>
#include <cmath>

// FIFO lot accounting: each buy creates a lot; sells consume oldest lots first.
// Realised P&L accumulated per closed lot; unrealised from open lots.
struct Lot { double price; double qty; };

struct RiskEngine {
    std::deque<Lot> lots_;   // open long lots (FIFO)
    double realised_pnl_ = 0.0;
    double net_qty_      = 0.0;

    // Process a fill: qty > 0 is a buy, qty < 0 is a sell
    void onFill(double fill_price, double qty) noexcept {
        net_qty_ += qty;
        if (qty > 0.0) {
            lots_.push_back({fill_price, qty});
        } else {
            // Consume oldest lots (FIFO)
            double to_close = -qty;
            while (to_close > 1e-9 && !lots_.empty()) {
                Lot& lot = lots_.front();
                double closed = std::min(lot.qty, to_close);
                realised_pnl_ += closed * (fill_price - lot.price);
                lot.qty   -= closed;
                to_close  -= closed;
                if (lot.qty < 1e-9) lots_.pop_front();
            }
        }
    }

    // Mark-to-market unrealised P&L at current price
    double unrealisedPnL(double mark_price) const noexcept {
        double upnl = 0.0;
        for (const auto& lot : lots_)
            upnl += lot.qty * (mark_price - lot.price);
        return upnl;
    }

    double totalPnL(double mark_price) const noexcept {
        return realised_pnl_ + unrealisedPnL(mark_price);
    }
};`,
    explanation: "FIFO lot accounting is required by GAAP and most exchange regulations for determining realised P&L for tax purposes; using a deque instead of a vector for lots allows O(1) pop_front() when front lots are exhausted, while push_back for new buys is also O(1) amortised.",
  },
  {
    id: "cpp-20260622-b1-option-strategy",
    language: "cpp",
    title: "Portfolio of BS options: aggregate Greeks across legs",
    tag: "derivatives",
    code: `#include <vector>
#include <cmath>
#include <numeric>

static double ncdf_(double x) noexcept { return 0.5*std::erfc(-x/std::sqrt(2.0)); }
static double npdf_(double x) noexcept {
    return std::exp(-0.5*x*x)/std::sqrt(2.0*M_PI);
}

struct OptionLeg {
    double S, K, r, sigma, T;
    double qty;    // positive = long, negative = short
    bool   call;   // true = call, false = put
};

struct AggGreeks { double price, delta, gamma, vega, theta; };

AggGreeks aggregateGreeks(const std::vector<OptionLeg>& legs) noexcept {
    AggGreeks agg{};
    for (const auto& l : legs) {
        double sqT = std::sqrt(l.T);
        double d1  = (std::log(l.S/l.K)+(l.r+0.5*l.sigma*l.sigma)*l.T)/(l.sigma*sqT);
        double d2  = d1 - l.sigma*sqT;
        double Nd1 = ncdf_(d1), Nd2 = ncdf_(d2);
        double Pd1 = npdf_(d1);
        double disc = std::exp(-l.r*l.T);

        double px, dlt;
        if (l.call) { px=l.S*Nd1-l.K*disc*Nd2;  dlt=Nd1; }
        else         { px=l.K*disc*(1-Nd2)-l.S*(1-Nd1); dlt=Nd1-1.0; }

        agg.price += l.qty * px;
        agg.delta += l.qty * dlt;
        agg.gamma += l.qty * Pd1/(l.S*l.sigma*sqT);
        agg.vega  += l.qty * l.S*Pd1*sqT/100.0;
        agg.theta += l.qty * (-l.S*Pd1*l.sigma/(2.0*sqT)
                    - (l.call?1:-1)*l.r*l.K*disc*(l.call?Nd2:(1-Nd2)))/365.0;
    }
    return agg;
}`,
    explanation: "Aggregating Greeks linearly across legs is valid for first-order risk management because BS is linear in positions; the key portfolio-level insight is that gamma and vega are always positive for long options and always negative for short options, so a net-zero gamma position requires an explicit hedge leg regardless of delta.",
  },
];
