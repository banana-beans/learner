import type { Snippet } from "./types";

export const cppSnippets20260609B1: Snippet[] = [
  {
    id: "cpp-20260609-b1-pmr-arena",
    language: "cpp",
    title: "std::pmr::monotonic_buffer_resource — arena allocator for tick batches",
    tag: "memory",
    code: `#include <memory_resource>
#include <vector>
#include <cstddef>

// monotonic_buffer_resource: bump-pointer allocator backed by a stack slab.
// Individual deallocations are no-ops; memory reclaimed only when resource destructs.
// Zero per-object malloc overhead — ideal for request-scoped tick processing.
struct TickMsg { double bid, ask; int bidSz, askSz; std::uint64_t seqno; };

double processBatch(const std::vector<TickMsg>& raw) {
    alignas(64) std::byte buf[65536];                   // 64 KB stack arena
    std::pmr::monotonic_buffer_resource pool{buf, sizeof(buf)};
    std::pmr::vector<TickMsg> ticks{&pool};             // all allocs from pool
    ticks.reserve(raw.size());

    for (const auto& t : raw) ticks.push_back(t);

    double midSum = 0.0;
    for (const auto& t : ticks)
        midSum += 0.5 * (t.bid + t.ask);
    return midSum / static_cast<double>(ticks.size());
    // pool destructs here: single free() of the stack slab — zero per-item cost
}

// Chain resources: monotonic_buffer_resource{buf, N, &fallback}
// upstream = new_delete_resource(); grows to heap if stack slab overflows.
// synchronized_pool_resource adds thread-safety for shared arenas.`,
    explanation:
      "Monotonic bump allocation is 10–100× faster than per-object new/delete because it reduces every allocation to an increment of an internal pointer. The performance win is largest on hot paths where thousands of tick objects are created and discarded per microsecond, where malloc lock contention dominates.",
  },
  {
    id: "cpp-20260609-b1-concepts-pricer",
    language: "cpp",
    title: "C++20 Concepts — type-safe option pricing interface",
    tag: "templates",
    code: `#include <concepts>
#include <cmath>
#include <type_traits>

// Concept: any type whose callPrice / put_price return a floating-point value.
// Unlike SFINAE, concept errors show 'does not satisfy PricingModel', not line noise.
template<typename M>
concept PricingModel = requires(M m, double S, double K, double r, double sigma, double T) {
    { m.callPrice(S, K, r, sigma, T) } -> std::floating_point;
    { m.putPrice (S, K, r, sigma, T) } -> std::floating_point;
};

// Concept for types that carry both price and vol info
template<typename Q>
concept MarketQuote = requires(Q q) {
    { q.mid()   } -> std::convertible_to<double>;
    { q.spread()} -> std::convertible_to<double>;
    { q.vol()   } -> std::convertible_to<double>;
};

// Generic delta-hedged PnL works with ANY model satisfying PricingModel
template<PricingModel M>
double deltaHedgePnL(M& model, double S, double dS,
                     double K, double r, double sigma, double T) {
    double delta = (model.callPrice(S + 0.01, K, r, sigma, T)
                  - model.callPrice(S - 0.01, K, r, sigma, T)) / 0.02;
    double dV    =  model.callPrice(S + dS,  K, r, sigma, T)
                  - model.callPrice(S,        K, r, sigma, T);
    return dV - delta * dS;   // residual = gamma P&L
}

// static_assert at instantiation time — compile error if model incomplete:
// static_assert(PricingModel<BlackScholes>);`,
    explanation:
      "Concepts replace SFINAE for expressing template requirements: the constraint is documented in the interface, checked at the call site, and produces a readable error at the first violation. Unlike virtual dispatch, constrained templates are monomorphised — zero virtual overhead and full inlining.",
  },
  {
    id: "cpp-20260609-b1-variant-order",
    language: "cpp",
    title: "std::variant + std::visit — zero-cost polymorphic order dispatch",
    tag: "modern",
    code: `#include <variant>
#include <string>
#include <cstdint>

struct LimitOrder  { std::int64_t id; double price; int qty; std::string symbol; };
struct MarketOrder { std::int64_t id;               int qty; std::string symbol; };
struct StopOrder   { std::int64_t id; double stop;  int qty; std::string symbol; };

using AnyOrder = std::variant<LimitOrder, MarketOrder, StopOrder>;

// Overloaded visitor — one lambda per alternative:
template<typename... Fs>
struct overloaded : Fs... { using Fs::operator()...; };

struct OrderDispatcher {
    void operator()(const LimitOrder& o) const {
        // route to limit book
        (void)o;
    }
    void operator()(const MarketOrder& o) const {
        // route to immediate-or-cancel sweep
        (void)o;
    }
    void operator()(const StopOrder& o) const {
        // park in stop list, activate when stop hit
        (void)o;
    }
};

void dispatch(const AnyOrder& order) {
    // std::visit: zero vtable — index stored in variant, dispatcher inlined
    std::visit(OrderDispatcher{}, order);
}

// Retrieve price if present (LimitOrder and StopOrder have a price-like field)
std::optional<double> triggerPrice(const AnyOrder& o) {
    return std::visit(overloaded{
        [](const LimitOrder&  x) -> std::optional<double> { return x.price; },
        [](const StopOrder&   x) -> std::optional<double> { return x.stop;  },
        [](const MarketOrder&  ) -> std::optional<double> { return {};       },
    }, o);
}`,
    explanation:
      "std::variant stores a type index and raw storage — no heap allocation, no vtable. std::visit dispatches on the index via a generated jump table, achieving the same open-dispatch semantics as virtual functions but with all branches visible to the optimiser for inlining and dead-code elimination.",
  },
  {
    id: "cpp-20260609-b1-soa-greeks",
    language: "cpp",
    title: "Struct-of-Arrays (SoA) — vectorised portfolio Greeks",
    tag: "performance",
    code: `#include <vector>
#include <cmath>
#include <numeric>

// AoS: each position is a struct — cache line holds one option's data.
// SoA: each field is its own array — SIMD processes 4/8 options per instruction.
struct OptionSoA {
    std::vector<double> S, K, r, sigma, T;  // underlying, strike, rate, vol, expiry
    std::vector<double> delta, gamma, vega;  // Greeks (output)
    std::size_t         n = 0;

    void resize(std::size_t count) {
        n = count;
        S.resize(n); K.resize(n); r.resize(n); sigma.resize(n); T.resize(n);
        delta.resize(n); gamma.resize(n); vega.resize(n);
    }

    // Auto-vectorised by compiler with -O2: all ops operate on contiguous doubles
    void computeGreeks() {
        for (std::size_t i = 0; i < n; ++i) {
            double sqT = std::sqrt(T[i]);
            double d1  = (std::log(S[i]/K[i]) + (r[i] + 0.5*sigma[i]*sigma[i])*T[i])
                         / (sigma[i] * sqT);
            double d2  = d1 - sigma[i] * sqT;
            double nd1 = 0.5 * std::erfc(-d1 / std::numbers::sqrt2_v<double>);
            double phi = std::exp(-0.5*d1*d1) / std::sqrt(2.0*std::numbers::pi);
            delta[i] = nd1;
            gamma[i] = phi / (S[i] * sigma[i] * sqT);
            vega[i]  = S[i] * phi * sqT;
        }
    }

    double totalDelta() const {
        return std::reduce(delta.begin(), delta.end());
    }
};
// Benchmark: SoA typically 3-5x faster than AoS for portfolio-level Greek sweeps
// because adjacent SIMD loads hit the same cache line for the same field.`,
    explanation:
      "Struct-of-Arrays enables auto-vectorisation: a loop over delta[] can be widened to AVX2 (4 doubles per instruction), whereas an AoS loop must gather scattered fields from each struct — a pattern SIMD cannot vectorise. The trade-off is worse cache locality when accessing multiple fields of one option simultaneously.",
  },
  {
    id: "cpp-20260609-b1-cholesky-corr",
    language: "cpp",
    title: "Cholesky decomposition — correlated multi-asset Brownian motions",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <random>
#include <stdexcept>

// Lower-triangular Cholesky: L s.t. Sigma = L * L^T.
// Converts N independent N(0,1) draws into correlated N(0,Sigma) draws.
std::vector<std::vector<double>>
cholesky(const std::vector<std::vector<double>>& Sigma) {
    int n = static_cast<int>(Sigma.size());
    auto L = std::vector<std::vector<double>>(n, std::vector<double>(n, 0.0));
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j <= i; ++j) {
            double sum = Sigma[i][j];
            for (int k = 0; k < j; ++k) sum -= L[i][k] * L[j][k];
            if (i == j) {
                if (sum <= 0.0) throw std::runtime_error("not positive definite");
                L[i][j] = std::sqrt(sum);
            } else {
                L[i][j] = sum / L[j][j];
            }
        }
    }
    return L;
}

// Generate one correlated sample: X = L * Z, Z ~ N(0,I)
std::vector<double> correlatedNormals(
    const std::vector<std::vector<double>>& L,
    std::mt19937_64& rng)
{
    int n = static_cast<int>(L.size());
    std::normal_distribution<double> nd;
    std::vector<double> Z(n), X(n, 0.0);
    for (auto& z : Z) z = nd(rng);
    for (int i = 0; i < n; ++i)
        for (int j = 0; j <= i; ++j)
            X[i] += L[i][j] * Z[j];
    return X;
}
// Usage: correlate S1 and S2 with rho=0.6:
// Sigma = {{1.0, 0.6}, {0.6, 1.0}}, L = cholesky(Sigma)
// [dW1, dW2] = correlatedNormals(L, rng) * sqrt(dt)`,
    explanation:
      "Cholesky factorises the correlation matrix once O(N³) then produces each correlated sample in O(N²). The key invariant is that L has real entries only if Sigma is symmetric positive definite — a sanity check that the correlation matrix was constructed consistently (e.g., not set to ρ>1 or a non-PD matrix from rounding).",
  },
  {
    id: "cpp-20260609-b1-asian-mc",
    language: "cpp",
    title: "Asian arithmetic average option — Monte Carlo pricing",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <numeric>

// Arithmetic Asian call: payoff = max(A_T - K, 0)  where A_T = (1/N) * sum(S_{t_i}).
// No closed form for arithmetic average under GBM — MC is the standard approach.
double asianArithmeticCallMC(double S0, double K, double r, double sigma,
                              double T, int paths = 100'000, int steps = 252,
                              int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double dt    = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double payoffSum = 0.0;

    for (int p = 0; p < paths; ++p) {
        double S = S0, avgSum = 0.0;
        for (int s = 0; s < steps; ++s) {
            S *= std::exp(drift + vol * nd(rng));
            avgSum += S;
        }
        double avg    = avgSum / steps;
        payoffSum += std::max(avg - K, 0.0);
    }
    return std::exp(-r * T) * payoffSum / paths;
}

// Variance reduction: use geometric Asian (closed form) as control variate.
// E[geometric] is analytic; Cov(arithmetic, geometric) is high -> large reduction.
// Geometric Asian closed form: replace sigma -> sigma/sqrt(3), r -> (r + sigma^2/6)/2
double geometricAsianCallAnalytic(double S0, double K, double r, double sigma,
                                   double T, int N) {
    double sigG  = sigma / std::sqrt(3.0);
    double rG    = 0.5 * (r - 0.5*sigma*sigma + sigG*sigG);
    double d1    = (std::log(S0/K) + (rG + 0.5*sigG*sigG)*T) / (sigG*std::sqrt(T));
    double d2    = d1 - sigG * std::sqrt(T);
    auto N01 = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    return S0 * std::exp((rG - r)*T) * N01(d1) - K * std::exp(-r*T) * N01(d2);
}`,
    explanation:
      "The arithmetic average lacks a closed-form expression because a sum of log-normals is not log-normal. The geometric Asian approximation (whose average IS log-normal) serves as a control variate: since arithmetic ≈ geometric + small adjustment, the two are highly correlated, reducing variance by 80–95% and cutting required paths by 5–20×.",
  },
  {
    id: "cpp-20260609-b1-lookback-mc",
    language: "cpp",
    title: "Fixed-strike lookback call — Monte Carlo path simulator",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Fixed-strike lookback call: payoff = max(S_max - K, 0)
// where S_max = max over all monitored dates.
// The running maximum must be tracked explicitly — no state compression possible.
double lookbackCallMC(double S0, double K, double r, double sigma,
                       double T, int paths = 100'000, int steps = 252,
                       int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double dt    = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double payoffSum = 0.0;

    for (int p = 0; p < paths; ++p) {
        double S = S0, Smax = S0;
        for (int s = 0; s < steps; ++s) {
            S    *= std::exp(drift + vol * nd(rng));
            Smax  = std::max(Smax, S);
        }
        payoffSum += std::max(Smax - K, 0.0);
    }
    return std::exp(-r * T) * payoffSum / paths;
}

// Floating-strike lookback call: payoff = S_T - S_min.
// Always in the money — more expensive than fixed-strike variant.
double lookbackFloatCallMC(double S0, double r, double sigma,
                            double T, int paths = 100'000, int steps = 252,
                            int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double dt    = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double payoffSum = 0.0;

    for (int p = 0; p < paths; ++p) {
        double S = S0, Smin = S0;
        for (int s = 0; s < steps; ++s) {
            S    *= std::exp(drift + vol * nd(rng));
            Smin  = std::min(Smin, S);
        }
        payoffSum += std::max(S - Smin, 0.0);
    }
    return std::exp(-r * T) * payoffSum / paths;
}`,
    explanation:
      "Lookback options are path-dependent on the extremum, not the endpoint — their value can only be found analytically under continuous monitoring (Goldman-Sosin-Gatto 1979). Discrete monitoring (daily fixings) requires simulation; the Broadie-Glasserman-Kou Brownian bridge correction recovers most of the accuracy lost from coarse time grids.",
  },
  {
    id: "cpp-20260609-b1-black76-cap",
    language: "cpp",
    title: "Black-76 caplet/floorlet — interest rate options pricing",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>

// Black-76: option on a forward rate F, discounted at the ZCB.
// Caplet pays tau * max(L - K, 0) at T_end, discounted by P(0, T_end).
// Assumes lognormal forward rate: dF = sigma_F * F * dW under T-forward measure.
struct Black76Result { double price, delta, vega; };

static double normCDF(double x) noexcept {
    return 0.5 * std::erfc(-x / std::numbers::sqrt2_v<double>);
}

Black76Result black76Caplet(
    double F,       // forward LIBOR/SOFR rate
    double K,       // strike rate
    double sigma_F, // lognormal forward vol
    double tau,     // accrual period (e.g. 0.25 for 3M)
    double T,       // option expiry (= reset date)
    double P_T_end) // discount factor to payment date T_end = T + tau
{
    double sqT = std::sqrt(T);
    double d1  = (std::log(F / K) + 0.5 * sigma_F * sigma_F * T) / (sigma_F * sqT);
    double d2  = d1 - sigma_F * sqT;
    double nd1 = normCDF(d1);
    double nd2 = normCDF(d2);
    double phi = std::exp(-0.5 * d1 * d1) / std::sqrt(2.0 * std::numbers::pi);

    Black76Result res;
    res.price = tau * P_T_end * (F * nd1 - K * nd2);
    res.delta = tau * P_T_end * nd1;          // dPrice/dF
    res.vega  = tau * P_T_end * F * phi * sqT; // dPrice/d(sigma_F)
    return res;
}

// A cap = sum of caplets, each on the LIBOR fixing at start of its accrual period.
// Calibrate sigma_F per caplet (spot vol) or assume flat vol (cap vol).
// Floorlet by put-call parity: floorlet = caplet - tau*P*(F - K).`,
    explanation:
      "Black-76 prices a caplet as an option on the forward rate F rather than the spot rate — it applies Black-Scholes mechanics to the forward rate under the T-forward measure where F is a martingale, eliminating the drift term. The cap-floor parity relation is model-free: it follows directly from the payoff structure, providing a consistency check.",
  },
  {
    id: "cpp-20260609-b1-nelson-siegel",
    language: "cpp",
    title: "Nelson-Siegel yield curve — parametric term structure fit",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <numeric>

// Nelson-Siegel (1987): y(tau) = b0 + b1 * f(tau/lambda) + b2 * g(tau/lambda)
// where f(x) = (1 - e^{-x}) / x,  g(x) = f(x) - e^{-x}.
// b0 = long rate, b0+b1 = short rate, b2 = hump magnitude, lambda = hump location.
double nelsonSiegel(double tau, double b0, double b1, double b2, double lam) {
    if (tau < 1e-9) return b0 + b1;    // limit as tau -> 0
    double x  = tau / lam;
    double ex = std::exp(-x);
    double f  = (1.0 - ex) / x;        // loading on b1
    double g  = f - ex;                 // loading on b2 (hump)
    return b0 + b1 * f + b2 * g;
}

// Least-squares calibration given observed yields at given maturities
struct NSParams { double b0, b1, b2, lambda; };

double nsLoss(const NSParams& p, const std::vector<double>& maturities,
              const std::vector<double>& yields) {
    double sse = 0.0;
    for (std::size_t i = 0; i < maturities.size(); ++i) {
        double yhat = nelsonSiegel(maturities[i], p.b0, p.b1, p.b2, p.lambda);
        double e    = yhat - yields[i];
        sse += e * e;
    }
    return sse;
}

// Svensson extension adds a second hump:
// y(tau) = NS(...) + b3 * [(1-e^{-tau/lam2})/(tau/lam2) - e^{-tau/lam2}]
double svensson(double tau, double b0, double b1, double b2, double lam,
                double b3, double lam2) {
    double ns_part = nelsonSiegel(tau, b0, b1, b2, lam);
    if (tau < 1e-9) return ns_part + b3;
    double x2 = tau / lam2;
    double ex2 = std::exp(-x2);
    return ns_part + b3 * ((1.0 - ex2) / x2 - ex2);
}`,
    explanation:
      "Nelson-Siegel decomposes the yield curve into three economically interpretable components: a level factor (b0, loads equally on all maturities), a slope factor (b1, drives the short-long spread), and a curvature factor (b2, produces the hump). These correspond to the three principal components empirically identified in yield data, making it the standard model used by central banks.",
  },
  {
    id: "cpp-20260609-b1-ranges-positions",
    language: "cpp",
    title: "std::ranges views — lazy position filtering and transformation",
    tag: "stl",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <numeric>
#include <string>

struct Position {
    std::string symbol;
    double      quantity;    // positive = long, negative = short
    double      pnl;         // unrealised P&L
    bool        active;
};

// Lazy view pipeline: no intermediate containers allocated.
// All views are evaluated only when iterated.
double netLongDelta(const std::vector<Position>& book) {
    auto longs = book
        | std::views::filter([](const Position& p){ return p.active && p.quantity > 0; })
        | std::views::transform([](const Position& p){ return p.quantity; });

    return std::ranges::fold_left(longs, 0.0, std::plus<>{});
}

// Top-5 losers by unrealised PnL
std::vector<Position> topLosers(std::vector<Position> book, int k = 5) {
    auto active = book | std::views::filter([](const Position& p){ return p.active; });
    // partial_sort equivalent: nth_element on the view
    std::vector<Position> result(active.begin(), active.end());
    int kk = std::min(k, static_cast<int>(result.size()));
    std::ranges::partial_sort(result, result.begin() + kk,
        [](const Position& a, const Position& b){ return a.pnl < b.pnl; });
    result.resize(kk);
    return result;
}

// Count unique symbols: ranges::to (C++23) or std::set
auto uniqueSymbols(const std::vector<Position>& book) {
    auto syms = book | std::views::transform([](const Position& p){ return p.symbol; });
    std::vector<std::string> v(syms.begin(), syms.end());
    std::ranges::sort(v);
    v.erase(std::ranges::unique(v).begin(), v.end());
    return v;
}`,
    explanation:
      "std::ranges views are lazy: the filter + transform pipeline stores only closures, allocating no temporary vectors. Composition with | makes the intent of a pipeline readable as a sequence of transformations — the compiler fuses the predicates into a single loop with no intermediate materialisation.",
  },
  {
    id: "cpp-20260609-b1-antithetic-mc",
    language: "cpp",
    title: "Antithetic variates — European call variance reduction",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <utility>

// Antithetic variates: pair each standard normal Z with -Z.
// E[(f(Z) + f(-Z))/2] = E[f(Z)] but Var[(f(Z)+f(-Z))/2] < Var[f(Z)]
// because f(Z) and f(-Z) are negatively correlated for monotone f.
// Variance reduction factor: 1 - Corr(f(Z), f(-Z)) / 2.
double europeanCallAntithetic(double S0, double K, double r, double sigma,
                               double T, int paths = 50'000, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double drift = (r - 0.5 * sigma * sigma) * T;
    double vol   = sigma * std::sqrt(T);
    double sum   = 0.0;

    for (int p = 0; p < paths; ++p) {
        double Z  = nd(rng);
        double ST1 = S0 * std::exp(drift + vol *  Z);  // original path
        double ST2 = S0 * std::exp(drift + vol * -Z);  // antithetic path
        sum += 0.5 * (std::max(ST1 - K, 0.0) + std::max(ST2 - K, 0.0));
    }
    return std::exp(-r * T) * sum / paths;
}

// Compare standard MC:
double europeanCallMC(double S0, double K, double r, double sigma,
                      double T, int paths = 100'000, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double drift = (r - 0.5 * sigma * sigma) * T;
    double vol   = sigma * std::sqrt(T);
    double sum   = 0.0;
    for (int p = 0; p < paths; ++p) {
        double ST = S0 * std::exp(drift + vol * nd(rng));
        sum += std::max(ST - K, 0.0);
    }
    return std::exp(-r * T) * sum / paths;
}
// Antithetic with 50K pairs ≈ accuracy of 100K independent paths for calls.
// Rule of thumb: antithetic halves variance for near-ATM smooth payoffs.`,
    explanation:
      "Antithetic variates exploit the symmetry of the standard normal — for a European call (monotone in S_T), the pair (f(Z), f(-Z)) has strong negative correlation because large positive Z drives a deep ITM path while -Z drives deep OTM. Halving the variance with the same total paths doubles effective accuracy for no extra computational cost.",
  },
  {
    id: "cpp-20260609-b1-control-variate",
    language: "cpp",
    title: "Control variate — geometric average as control for arithmetic Asian",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <vector>

// Control variate MC: theta_CV = theta_raw - beta*(g_raw - E[g])
// where g = geometric average (known analytic price), beta = Cov/Var.
// For arithmetic Asian, the geometric average is an excellent control.

// Geometric Asian analytic price (closed form)
double geoAsianCall(double S0, double K, double r, double sigma, double T, int N) {
    double sigG = sigma / std::sqrt(3.0);
    double muG  = 0.5 * (r - 0.5*sigma*sigma + sigG*sigG);
    double sqT  = std::sqrt(T);
    double d1   = (std::log(S0/K) + (muG + 0.5*sigG*sigG)*T) / (sigG * sqT);
    double d2   = d1 - sigG * sqT;
    auto N01 = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    return S0 * std::exp((muG - r) * T) * N01(d1) - K * std::exp(-r*T) * N01(d2);
}

double asianArithCV(double S0, double K, double r, double sigma,
                    double T, int paths = 50'000, int steps = 252, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double dt    = T / steps;
    double drift = (r - 0.5*sigma*sigma)*dt;
    double vol   = sigma * std::sqrt(dt);

    std::vector<double> arith(paths), geo(paths);
    for (int p = 0; p < paths; ++p) {
        double S = S0, asum = 0.0, logSum = 0.0;
        for (int s = 0; s < steps; ++s) {
            S    *= std::exp(drift + vol * nd(rng));
            asum += S;  logSum += std::log(S);
        }
        arith[p] = std::max(asum / steps - K, 0.0);
        geo[p]   = std::max(std::exp(logSum / steps) - K, 0.0);
    }

    // Estimate beta = Cov(arith, geo) / Var(geo)
    double mA = 0.0, mG = 0.0;
    for (int p = 0; p < paths; ++p) { mA += arith[p]; mG += geo[p]; }
    mA /= paths;  mG /= paths;
    double cov = 0.0, varG = 0.0;
    for (int p = 0; p < paths; ++p) {
        cov  += (arith[p] - mA) * (geo[p] - mG);
        varG += (geo[p]   - mG) * (geo[p] - mG);
    }
    double beta   = cov / varG;
    double E_geo  = geoAsianCall(S0, K, r, sigma, T, steps);
    double cv_est = (mA - beta * (mG - E_geo));   // control variate correction
    return std::exp(-r * T) * cv_est;
}`,
    explanation:
      "Control variates exploit known expectations to reduce variance: by subtracting beta × (g_MC - E[g]), we remove the component of g's sampling error that correlates with the target. For arithmetic vs geometric Asian options, the correlation is typically 0.95+, achieving 90%+ variance reduction — equivalent to running 100× more paths without the control.",
  },
  {
    id: "cpp-20260609-b1-likely-hot-path",
    language: "cpp",
    title: "[[likely]]/[[unlikely]] attributes — order validation hot path",
    tag: "performance",
    code: `#include <cstdint>
#include <stdexcept>

// [[likely]]/[[unlikely]] (C++20): hints to the compiler's branch predictor.
// The CPU's hardware predictor learns dynamically; these hints guide code layout
// (the likely branch lands in the 'fall-through' path, improving I-cache density).

struct Order { double price; int qty; std::uint64_t id; };
struct RiskLimits { double maxNotional; int maxQty; };

enum class ValidationResult { OK, BAD_PRICE, BAD_QTY, EXCEEDS_RISK };

[[nodiscard]] ValidationResult validateOrder(const Order& o,
                                              const RiskLimits& limits) noexcept {
    // 99.9% of orders pass basic sanity checks — hint the CPU to predict OK
    if ([[likely]]   (o.price > 0.0 && o.qty > 0))    // normal path
        goto check_risk;
    return ValidationResult::BAD_PRICE;

check_risk:
    if ([[unlikely]] (o.price * o.qty > limits.maxNotional))
        return ValidationResult::EXCEEDS_RISK;
    if ([[unlikely]] (o.qty > limits.maxQty))
        return ValidationResult::BAD_QTY;
    return ValidationResult::OK;
}

// Alternative idiomatic form without goto:
bool isValidOrderFast(const Order& o, const RiskLimits& lim) noexcept {
    if ([[unlikely]] (o.price <= 0.0 || o.qty <= 0))
        return false;
    if ([[unlikely]] (o.price * o.qty > lim.maxNotional))
        return false;
    return true;
}

// [[assume(expr)]] (C++23) is stronger: tells the compiler expr is always true,
// enabling constant-folding through branch elimination — useful for loop bounds.`,
    explanation:
      "[[likely]]/[[unlikely]] arrange the likely branch as a fall-through (no branch instruction on taken paths) and moves the unlikely code to cold sections of the binary. This directly reduces I-cache pressure on the hot path — critical for sub-microsecond order validation where even branch mispredicts cost 15+ cycles.",
  },
  {
    id: "cpp-20260609-b1-option-hash",
    language: "cpp",
    title: "Custom std::hash — composite (symbol, strike, expiry) option key",
    tag: "stl",
    code: `#include <unordered_map>
#include <string>
#include <cstdint>
#include <functional>
#include <chrono>

// Option key: (underlying symbol, strike in ticks, days to expiry).
// Custom hash via FNV-1a mixing of each field.
struct OptionKey {
    std::string   symbol;
    std::int64_t  strike_ticks;  // price * 10000 as integer
    int           dte;           // days to expiry
    bool operator==(const OptionKey& o) const noexcept {
        return symbol == o.symbol && strike_ticks == o.strike_ticks && dte == o.dte;
    }
};

struct OptionKeyHash {
    std::size_t operator()(const OptionKey& k) const noexcept {
        // Combine hashes via prime multiplication — FNV-inspired mixing
        std::size_t h = std::hash<std::string>{}(k.symbol);
        h ^= std::hash<std::int64_t>{}(k.strike_ticks) + 0x9e3779b9 + (h << 6) + (h >> 2);
        h ^= std::hash<int>{}(k.dte)                   + 0x9e3779b9 + (h << 6) + (h >> 2);
        return h;
    }
};

using GreeksMap = std::unordered_map<OptionKey, double, OptionKeyHash>;

// Store and look up implied vol surface
GreeksMap buildVolSurface(/* ... */) {
    GreeksMap surface;
    surface.reserve(10'000);
    // surface[OptionKey{"SPY", 4500'0000, 30}] = 0.18;  // 18% implied vol
    return surface;
}

// The magic constant 0x9e3779b9 = 2^32 / phi (golden ratio) — ensures
// good avalanche from each bit of each field into the final hash.`,
    explanation:
      "The golden-ratio mixing constant 0x9e3779b9 (floor(2³²/φ)) makes adjacent integer values map to well-separated hash buckets by exploiting the irrational spacing of φ — a property known as Fibonacci hashing. Combining three fields via XOR + left/right rotation prevents higher-field collisions from cancelling lower-field contributions.",
  },
  {
    id: "cpp-20260609-b1-format-fix",
    language: "cpp",
    title: "std::format — FIX 4.2 NewOrderSingle builder",
    tag: "market-data",
    code: `#include <format>
#include <string>
#include <chrono>
#include <cstdint>

// std::format (C++20): type-safe, locale-independent, no sscanf/sprintf.
// FIX 4.2 NewOrderSingle (MsgType=D) — SOH is \\x01 between tags.
// Zero-overhead vs sprintf for known-format strings; compiler checks format string.

std::string buildNewOrderSingle(
    std::int64_t  orderId,
    std::string_view symbol,
    double        price,
    int           qty,
    bool          isBuy,
    std::string_view senderCompId = "CLIENT",
    std::string_view targetCompId = "BROKER")
{
    // Format: BeginString(8), BodyLength(9), MsgType(35), SenderCompID(49),
    //         TargetCompID(56), MsgSeqNum(34), SendingTime(52), Symbol(55),
    //         Side(54), OrderQty(38), OrdType(40), Price(44), TimeInForce(59).
    // Note: BodyLength and Checksum require post-computation; omitted here.

    auto now = std::chrono::system_clock::now();
    auto ts  = std::chrono::floor<std::chrono::seconds>(now);

    return std::format(
        "8=FIX.4.2\x01"
        "35=D\x01"
        "49={}\x01"
        "56={}\x01"
        "34={}\x01"
        "55={}\x01"
        "54={}\x01"
        "38={}\x01"
        "40=2\x01"          // OrdType=Limit
        "44={:.6f}\x01"
        "59=0\x01",         // TimeInForce=Day
        senderCompId,
        targetCompId,
        orderId,
        symbol,
        isBuy ? 1 : 2,      // Side: 1=Buy, 2=Sell
        qty,
        price
    );
}
// std::format checks arg count and types at compile time via format string parsing.
// For runtime format strings use std::vformat (no compile-time check).`,
    explanation:
      "std::format replaces sprintf with a type-safe, locale-independent formatter: the format string is parsed at compile time, catching mismatched argument types before runtime. For FIX messages, this eliminates the risk of buffer overflows from oversized price strings and the locale-dependent decimal separator that broke sscanf on European systems.",
  },
  {
    id: "cpp-20260609-b1-chrono-latency",
    language: "cpp",
    title: "std::chrono::steady_clock — nanosecond order round-trip timer",
    tag: "performance",
    code: `#include <chrono>
#include <cstdint>
#include <algorithm>
#include <vector>
#include <numeric>
#include <cmath>

using Clock = std::chrono::steady_clock;
using Nanos = std::chrono::nanoseconds;

// RAII latency timer: captures start at construction, records on stop().
struct LatencyTimer {
    Clock::time_point start_;
    explicit LatencyTimer() noexcept : start_(Clock::now()) {}
    [[nodiscard]] std::int64_t stopNs() const noexcept {
        return std::chrono::duration_cast<Nanos>(Clock::now() - start_).count();
    }
};

// Percentile latency statistics from a sample of round-trip times
struct LatencyStats {
    double p50_ns, p95_ns, p99_ns, p999_ns, mean_ns, stddev_ns;
};

LatencyStats computeStats(std::vector<std::int64_t> samples) {
    std::sort(samples.begin(), samples.end());
    std::size_t n = samples.size();
    auto pct = [&](double p) -> double {
        std::size_t idx = static_cast<std::size_t>(p * (n - 1));
        return static_cast<double>(samples[idx]);
    };
    double mean = static_cast<double>(
        std::reduce(samples.begin(), samples.end(), std::int64_t{0})) / n;
    double var  = 0.0;
    for (auto x : samples) { double d = x - mean; var += d * d; }
    return {pct(0.50), pct(0.95), pct(0.99), pct(0.999),
            mean, std::sqrt(var / n)};
}

// steady_clock is monotonic (never goes backwards) — preferred over system_clock
// for latency measurement. On Linux it maps to CLOCK_MONOTONIC; resolution ~1 ns.
// rdtsc is lower overhead (~20 cycles vs ~30 for steady_clock) but non-portable.`,
    explanation:
      "steady_clock::now() is guaranteed monotonic and is the correct choice for elapsed-time measurement — unlike system_clock which can jump backwards on NTP adjustments. The p99.9 latency is the key SLA metric for market-making systems: tail latency determines the worst-case timing jitter during an order book update.",
  },
  {
    id: "cpp-20260609-b1-prefetch-levels",
    language: "cpp",
    title: "__builtin_prefetch — order book level scan optimisation",
    tag: "performance",
    code: `#include <cstddef>
#include <vector>
#include <algorithm>

// __builtin_prefetch(addr, rw, locality):
//   rw:       0=read, 1=write
//   locality: 0=no temporal (stream), 1=L3, 2=L2, 3=L1 (most temporal)
// Issues a PREFETCHT0/1/2/NTA instruction; latency ≈ 100 ns (DRAM).

struct PriceLevel {
    double price;
    long   qty;
    int    orderCount;
    int    pad;          // align to 16 bytes
};

// Sweep the top K levels of the order book, prefetching ahead
double sweepBestK(const std::vector<PriceLevel>& levels, int K,
                  double aggressorQty) {
    double totalQty = 0.0;
    double vwapNum  = 0.0;

    for (int i = 0; i < K && i < static_cast<int>(levels.size()); ++i) {
        // Prefetch level i+8 while processing level i
        if (i + 8 < static_cast<int>(levels.size()))
            __builtin_prefetch(&levels[i + 8], 0, 1); // read, L3 hint

        const auto& lvl = levels[i];
        double fill = std::min(static_cast<double>(lvl.qty), aggressorQty - totalQty);
        if (fill <= 0.0) break;
        vwapNum  += lvl.price * fill;
        totalQty += fill;
    }
    return totalQty > 0.0 ? vwapNum / totalQty : 0.0;
}

// DRAM latency ~70 ns; L3 ~30 cycles; L2 ~10 cycles.
// Prefetching 8 levels ahead (8 * 16 = 128 bytes) keeps the pipeline filled.
// For streaming scans (no reuse), use locality=0 (NTA) to avoid polluting caches.`,
    explanation:
      "Hardware prefetch engines detect sequential access patterns automatically, but non-linear patterns (e.g., following intrusive list pointers) require software hints. In order book sweeps, prefetching 8 levels ahead ensures the next cache line arrives from L3/DRAM before it is needed, converting latency into bandwidth.",
  },
  {
    id: "cpp-20260609-b1-span-buffer",
    language: "cpp",
    title: "std::span — zero-copy ITCH message buffer abstraction",
    tag: "modern",
    code: `#include <span>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <string_view>

// std::span: non-owning view over contiguous data.
// No copies — span wraps a pointer + size; all operations are O(1).
// Type-safe alternative to (char*, size_t) pairs in C APIs.

struct ITCHAddOrder {
    std::uint64_t seqno;
    std::uint64_t timestamp_ns;
    std::int64_t  price;       // fixed-point: divide by 10000.0
    std::int32_t  qty;
    char          side;        // 'B' = buy, 'S' = sell
    char          symbol[8];
};

// Parse from raw network buffer without any copy
ITCHAddOrder parseAddOrder(std::span<const std::byte> buf) {
    if (buf.size() < 30)
        throw std::invalid_argument("buffer too short for AddOrder message");

    ITCHAddOrder msg{};
    // fromBE helper: read big-endian value from arbitrary alignment
    auto rd64 = [&](std::size_t off) -> std::uint64_t {
        std::uint64_t v = 0;
        std::memcpy(&v, buf.data() + off, 8);
        // assume already converted from network byte order by the caller
        return v;
    };
    msg.seqno        = rd64(0);
    msg.timestamp_ns = rd64(8);
    msg.price        = static_cast<std::int64_t>(rd64(16));
    std::int32_t q   = 0;
    std::memcpy(&q, buf.data() + 24, 4);
    msg.qty          = q;
    msg.side         = static_cast<char>(buf[28]);
    std::memcpy(msg.symbol, buf.data() + 29, std::min<std::size_t>(8, buf.size()-29));
    return msg;
}

// std::span<T> can be narrowed: buf.subspan(offset, length)
// Dynamic extent (default) vs fixed extent: span<const byte, 30> has size encoded.
// span does NOT own memory — caller must ensure the buffer outlives the span.`,
    explanation:
      "std::span replaces the common (T*, size_t) pair with a single object that knows its own bounds — enabling bounds-checked iteration and preventing the common bug of miscounting the size separately. Unlike std::vector, it carries zero ownership semantics and zero allocation overhead, making it the right type for passing network buffer views.",
  },
  {
    id: "cpp-20260609-b1-constexpr-ncdf",
    language: "cpp",
    title: "constexpr normal CDF — Abramowitz-Stegun compile-time approximation",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>

// Abramowitz-Stegun rational approximation (26.2.17): max error < 7.5e-8.
// constexpr: can be evaluated at compile time for known inputs.
// Also provides a branch-free implementation with no std::erfc call.
[[nodiscard]] constexpr double normCDF_AS(double x) noexcept {
    constexpr double p  =  0.2316419;
    constexpr double b1 =  0.319381530;
    constexpr double b2 = -0.356563782;
    constexpr double b3 =  1.781477937;
    constexpr double b4 = -1.821255978;
    constexpr double b5 =  1.330274429;
    // Work with |x|; restore sign at the end
    bool negative = x < 0.0;
    double ax  = negative ? -x : x;
    double t   = 1.0 / (1.0 + p * ax);
    double t2  = t  * t;
    double t3  = t2 * t;
    double t4  = t3 * t;
    double t5  = t4 * t;
    double pdf = std::exp(-0.5 * ax * ax) /
                 std::sqrt(2.0 * std::numbers::pi);
    double q   = pdf * (b1*t + b2*t2 + b3*t3 + b4*t4 + b5*t5);
    double cdf = 1.0 - q;
    return negative ? (1.0 - cdf) : cdf;
}

// Compile-time sanity checks
static_assert(normCDF_AS( 0.0) > 0.499 && normCDF_AS( 0.0) < 0.501);
static_assert(normCDF_AS( 1.96) > 0.974 && normCDF_AS( 1.96) < 0.977);
static_assert(normCDF_AS(-1.96) > 0.023 && normCDF_AS(-1.96) < 0.026);

// Use this in constexpr pricers:
constexpr double atmCallDelta(double sigma, double T) noexcept {
    return normCDF_AS(0.5 * sigma * std::sqrt(T));
}`,
    explanation:
      "constexpr normal CDF enables compile-time evaluation of pricing results for known inputs — critical for generating static lookup tables or validating pricing bounds at build time. The Abramowitz-Stegun rational approximation achieves 7.5e-8 accuracy with five multiplications and one exp(), making it faster than std::erfc() on many architectures.",
  },
  {
    id: "cpp-20260609-b1-ewma-vol",
    language: "cpp",
    title: "EWMA volatility estimator — RiskMetrics λ=0.94 rolling vol",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <stdexcept>

// RiskMetrics EWMA (1994): sigma^2_t = lambda * sigma^2_{t-1} + (1-lambda) * r_{t-1}^2
// lambda = 0.94 for daily, 0.97 for monthly (J.P. Morgan defaults).
// Exponentially decays older observations — adapts quickly to vol regimes.
class EWMAVolatility {
    double lambda_;
    double variance_;   // current variance estimate
    bool   initialized_ = false;

public:
    explicit EWMAVolatility(double lambda = 0.94) : lambda_(lambda), variance_(0.0) {}

    // Update with a new return observation (log return, not %)
    void update(double return_obs) {
        if (!initialized_) {
            variance_    = return_obs * return_obs;
            initialized_ = true;
            return;
        }
        variance_ = lambda_ * variance_ + (1.0 - lambda_) * return_obs * return_obs;
    }

    // Annualised volatility estimate
    double vol(double annualisationFactor = 252.0) const {
        if (!initialized_) throw std::runtime_error("no data yet");
        return std::sqrt(variance_ * annualisationFactor);
    }

    double variance() const noexcept { return variance_; }

    // Effective number of observations: sum of weights = 1/(1-lambda)
    double effectiveN() const noexcept { return 1.0 / (1.0 - lambda_); }
};

// Batch initialisation from historical returns
EWMAVolatility fitEWMA(const std::vector<double>& returns, double lambda = 0.94) {
    EWMAVolatility ewma(lambda);
    for (double r : returns) ewma.update(r);
    return ewma;
}
// EWMA vol reacts to volatility clusters in O(1) per observation;
// GARCH adds autoregressive term and mean-reversion, requiring MLE fitting.`,
    explanation:
      "EWMA assigns exponentially decaying weights to past squared returns, making recent observations dominate — this is why EWMA vol spikes sharply on a shock and decays gradually afterwards. The effective observation count 1/(1-λ) reveals the implicit memory window: λ=0.94 corresponds to ~17 days of effective memory.",
  },
  {
    id: "cpp-20260609-b1-barrier-mc-reduce",
    language: "cpp",
    title: "std::barrier — multi-round parallel MC with convergence check",
    tag: "concurrency",
    code: `#include <barrier>
#include <thread>
#include <vector>
#include <atomic>
#include <cmath>
#include <numeric>

// std::barrier (C++20): reusable synchronisation barrier with completion function.
// Unlike std::latch (single-use), barrier can be waited on repeatedly — ideal
// for iterative algorithms that alternate computation and aggregation rounds.

double parallelMCWithConvergence(int nThreads, int batchSize,
                                  auto pricePath, double tol = 1e-4) {
    std::vector<double>   partials(nThreads, 0.0);
    std::atomic<double>   estimate{0.0};
    std::atomic<bool>     converged{false};
    std::atomic<int>      totalPaths{0};

    // Completion function runs once per round, in one thread, after all arrive
    auto onComplete = [&]() noexcept {
        double sum = std::reduce(partials.begin(), partials.end());
        int n = totalPaths.load(std::memory_order_relaxed);
        if (n > 0) {
            double prev = estimate.load();
            double next = sum / n;
            estimate.store(next);
            if (n > 1000 && std::abs(next - prev) < tol)
                converged.store(true);
        }
    };

    std::barrier sync(nThreads, onComplete);
    std::vector<std::thread> workers;

    for (int t = 0; t < nThreads; ++t) {
        workers.emplace_back([&, t] {
            while (!converged.load(std::memory_order_relaxed)) {
                double s = 0.0;
                for (int p = 0; p < batchSize; ++p)
                    s += pricePath();
                partials[t] += s;
                totalPaths.fetch_add(batchSize, std::memory_order_relaxed);
                sync.arrive_and_wait();   // synchronise after each batch
            }
            sync.arrive_and_drop();       // leave barrier permanently
        });
    }
    for (auto& w : workers) w.join();
    return estimate.load();
}`,
    explanation:
      "std::barrier's completion function runs exactly once per phase in an implementation-chosen thread — making it safe to aggregate shared state without additional synchronisation. arrive_and_drop() permanently reduces the barrier's expected count, allowing threads to exit cleanly when convergence is detected without a deadlock.",
  },
  {
    id: "cpp-20260609-b1-fix-state-machine",
    language: "cpp",
    title: "FIX order state machine — enum class + transition table",
    tag: "market-data",
    code: `#include <array>
#include <stdexcept>
#include <string_view>

// FIX order lifecycle: New -> PendingNew -> Accepted -> PartFill -> Filled
//                                        -> Rejected
//                               Accepted -> Cancelled
// Table-driven FSM: no nested switch — lookup instead.

enum class OrdState : int { New=0, PendingNew, Accepted, PartFill, Filled,
                             Rejected, Cancelled, COUNT };
enum class OrdEvent : int { SendNew=0, Ack, Fill, PartFill, Reject, Cancel, COUNT };

constexpr int NS = static_cast<int>(OrdState::COUNT);
constexpr int NE = static_cast<int>(OrdEvent::COUNT);
constexpr int INV = -1; // invalid transition

// transition[state][event] = next_state (or INV if forbidden)
constexpr std::array<std::array<int,NE>,NS> TRANSITIONS = {{
    // state:     SendNew  Ack                     Fill                      PartFill                 Reject                    Cancel
    /* New     */ { static_cast<int>(OrdState::PendingNew), INV, INV, INV, INV, INV },
    /* Pending */ { INV, static_cast<int>(OrdState::Accepted), INV, INV, static_cast<int>(OrdState::Rejected), INV },
    /* Accept  */ { INV, INV, static_cast<int>(OrdState::Filled), static_cast<int>(OrdState::PartFill), INV, static_cast<int>(OrdState::Cancelled) },
    /* PartFil */ { INV, INV, static_cast<int>(OrdState::Filled), static_cast<int>(OrdState::PartFill), INV, static_cast<int>(OrdState::Cancelled) },
    /* Filled  */ { INV, INV, INV, INV, INV, INV }, // terminal
    /* Reject  */ { INV, INV, INV, INV, INV, INV }, // terminal
    /* Cancel  */ { INV, INV, INV, INV, INV, INV }, // terminal
}};

OrdState transition(OrdState s, OrdEvent e) {
    int next = TRANSITIONS[static_cast<int>(s)][static_cast<int>(e)];
    if (next == INV)
        throw std::logic_error("invalid FIX order state transition");
    return static_cast<OrdState>(next);
}

bool isTerminal(OrdState s) noexcept {
    return s == OrdState::Filled || s == OrdState::Rejected || s == OrdState::Cancelled;
}`,
    explanation:
      "A table-driven FSM replaces a nested switch statement with a two-dimensional array lookup — O(1) per transition, and the complete state graph is visible in one place for audit and testing. Marking invalid transitions with INV rather than silently ignoring them makes state bugs crash immediately, preventing silent trade reconciliation errors.",
  },
  {
    id: "cpp-20260609-b1-move-portfolio",
    language: "cpp",
    title: "Value-semantic portfolio with move operations",
    tag: "modern",
    code: `#include <vector>
#include <string>
#include <algorithm>
#include <utility>

struct Leg {
    std::string symbol;
    double      quantity;
    double      cost_basis;
};

// Value-semantic portfolio: copy is a deep clone; move is O(1).
// Rule of zero: let the compiler generate copy/move/destructor from members.
class Portfolio {
    std::vector<Leg> legs_;
    std::string      name_;
    double           cash_balance_ = 0.0;

public:
    explicit Portfolio(std::string name, double cash = 0.0)
        : name_(std::move(name)), cash_balance_(cash) {}

    void addLeg(Leg leg) {
        legs_.push_back(std::move(leg));  // move into vector — no string copy
    }

    // Merge another portfolio into this one — O(N) with no copies of Leg data
    void absorbPortfolio(Portfolio&& other) noexcept {
        for (auto& leg : other.legs_)
            legs_.push_back(std::move(leg));
        cash_balance_ += std::exchange(other.cash_balance_, 0.0);
        other.legs_.clear();
    }

    double totalMarketValue(auto priceOf) const {
        double mv = cash_balance_;
        for (const auto& l : legs_)
            mv += l.quantity * priceOf(l.symbol);
        return mv;
    }

    // Compiler-generated: copy ctor = deep copy (copies vector, strings).
    //                     move ctor = O(1) steal of vector and strings.
    Portfolio(const Portfolio&)            = default;
    Portfolio(Portfolio&&)                 = default;
    Portfolio& operator=(const Portfolio&) = default;
    Portfolio& operator=(Portfolio&&)      = default;
};`,
    explanation:
      "Rule of zero means the compiler generates optimal copy (deep clone of std::vector and std::string) and move (pointer steal, O(1)) automatically. Explicitly writing these operations would risk introducing bugs or preventing copy/move elision — the compiler's generated versions are always correct given well-behaved members.",
  },
  {
    id: "cpp-20260609-b1-optional-book",
    language: "cpp",
    title: "std::optional — sparse order book best bid/ask queries",
    tag: "modern",
    code: `#include <optional>
#include <map>
#include <cstdint>

struct Quote { double price; std::int64_t qty; };

// Order book with sparse levels — gaps are common after cancellations.
// std::optional<Quote> signals absence without a sentinel value (0.0 is a valid price).
class SparseOrderBook {
    std::map<double, std::int64_t, std::greater<double>> bids_; // descending
    std::map<double, std::int64_t>                       asks_; // ascending

public:
    void setBid(double price, std::int64_t qty) {
        if (qty <= 0) bids_.erase(price);
        else          bids_[price] = qty;
    }
    void setAsk(double price, std::int64_t qty) {
        if (qty <= 0) asks_.erase(price);
        else          asks_[price] = qty;
    }

    [[nodiscard]] std::optional<Quote> bestBid() const noexcept {
        if (bids_.empty()) return std::nullopt;
        auto it = bids_.begin();
        return Quote{it->first, it->second};
    }
    [[nodiscard]] std::optional<Quote> bestAsk() const noexcept {
        if (asks_.empty()) return std::nullopt;
        auto it = asks_.begin();
        return Quote{it->first, it->second};
    }

    // Monadic usage: spread is only defined when both sides exist
    [[nodiscard]] std::optional<double> spread() const noexcept {
        auto bid = bestBid();
        auto ask = bestAsk();
        if (!bid || !ask) return std::nullopt;
        return ask->price - bid->price;
    }

    [[nodiscard]] std::optional<double> midPrice() const noexcept {
        auto s = spread();
        if (!s) return std::nullopt;
        return bestBid()->price + *s / 2.0;
    }
};`,
    explanation:
      "std::optional eliminates the need for sentinel values (price = -1.0, qty = 0) that silently propagate through downstream calculations. The monadic spread() and midPrice() functions use the value_or/and_then idiom — if either side is absent, the result is absent rather than a garbage value from dereferencing an empty iterator.",
  },
  {
    id: "cpp-20260609-b1-fixed-point-price",
    language: "cpp",
    title: "Fixed-point price arithmetic — integer tick representation",
    tag: "performance",
    code: `#include <cstdint>
#include <stdexcept>
#include <cmath>

// Fixed-point price: store as int64 * 10^4 (4 decimal places).
// Avoids floating-point precision loss for exact tick-level comparisons.
// 64-bit range: ~9.22e14 in price units — sufficient for all asset classes.
class FixedPrice {
    std::int64_t ticks_;                    // price * SCALE
    static constexpr std::int64_t SCALE = 10'000;

public:
    constexpr explicit FixedPrice(double price)
        : ticks_(static_cast<std::int64_t>(std::round(price * SCALE))) {}

    constexpr explicit FixedPrice(std::int64_t raw_ticks) noexcept
        : ticks_(raw_ticks) {}

    constexpr double toDouble() const noexcept { return ticks_ / static_cast<double>(SCALE); }
    constexpr std::int64_t rawTicks() const noexcept { return ticks_; }

    // Exact comparisons — no floating-point ambiguity
    constexpr bool operator==(const FixedPrice& o) const noexcept = default;
    constexpr bool operator< (const FixedPrice& o) const noexcept { return ticks_ <  o.ticks_; }
    constexpr bool operator<=(const FixedPrice& o) const noexcept { return ticks_ <= o.ticks_; }

    // Arithmetic — results stay in fixed-point domain
    constexpr FixedPrice operator+(const FixedPrice& o) const noexcept {
        return FixedPrice{ticks_ + o.ticks_};
    }
    constexpr FixedPrice operator-(const FixedPrice& o) const noexcept {
        return FixedPrice{ticks_ - o.ticks_};
    }

    // One tick
    static constexpr FixedPrice oneTick() noexcept { return FixedPrice{std::int64_t{1}}; }
    static constexpr FixedPrice fromBps(int bps, FixedPrice base) noexcept {
        return FixedPrice{base.ticks_ * bps / 10'000};
    }
};
// FIX uses fixed-point implicitly: price field "100.25" stored as 1002500 (4dp).
// Comparison: FixedPrice{100.10} == FixedPrice{100.10} is exact;
//             (100.10 == 100.10) as double can fail due to FP rounding.`,
    explanation:
      "Integer fixed-point eliminates the floating-point comparison hazard where 100.10 stored as a double rounds to 100.09999999... and fails exact equality tests. By storing prices as int64 * 10⁴, all order book comparisons (price matching, tick rounding) become exact integer operations — critical for compliance with exchange price-priority rules.",
  },
];
