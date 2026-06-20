import type { Snippet } from "./types";

export const cppSnippets20260620B1: Snippet[] = [
  {
    id: "cpp-20260620-b1-generator-ticks",
    language: "cpp",
    title: "C++23 std::generator coroutine for lazy tick streaming",
    tag: "modern",
    code: `#include <generator>   // C++23
#include <vector>
#include <cstdint>

struct Tick { std::int64_t ts_ns; double bid; double ask; };

// co_yield suspends here and resumes when the caller calls operator++
// The generator is lazy: no tick is parsed until the consumer pulls one.
std::generator<Tick> streamTicks(const std::vector<Tick>& raw) {
    for (const auto& t : raw) {
        if (t.bid > 0.0 && t.ask >= t.bid)   // filter stale/crossed ticks
            co_yield t;
    }
}

// Consumer: range-for drives the coroutine — pull-based, zero buffering
void consume(const std::vector<Tick>& raw) {
    for (const Tick& t : streamTicks(raw)) {
        double mid = (t.bid + t.ask) * 0.5;
        // process mid ...
    }
}`,
    explanation: "C++23 std::generator produces a pull-based coroutine range: the producer suspends at each co_yield and the frame is only advanced when the consumer iterates, eliminating the need for a separate thread or callback queue for pipeline stages.",
  },
  {
    id: "cpp-20260620-b1-hazard-ptr",
    language: "cpp",
    title: "Hazard pointer for safe lock-free node reclamation",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <functional>
#include <cstddef>

// Hazard pointers prevent ABA/use-after-free in lock-free structures.
// Each thread publishes a "hazard" pointer it is reading; the reclaimer
// must not free any node that appears in any thread's hazard slot.

constexpr int MAX_THREADS = 64;

struct HazardSlot {
    alignas(64) std::atomic<void*> ptr{nullptr};
};

inline std::array<HazardSlot, MAX_THREADS> gHazards;

thread_local int tl_tid = -1;   // assigned at thread startup

// Acquire: publish pointer before dereferencing it
inline void* hazard_acquire(int tid, std::atomic<void*>& src) {
    void* p;
    do {
        p = src.load(std::memory_order_acquire);
        gHazards[tid].ptr.store(p, std::memory_order_release);
    } while (src.load(std::memory_order_acquire) != p);  // retry if changed
    return p;
}

// Release: clear slot when done with the pointer
inline void hazard_release(int tid) {
    gHazards[tid].ptr.store(nullptr, std::memory_order_release);
}

// Reclaim: only free if no thread has this pointer protected
void safe_reclaim(void* node, std::function<void(void*)> deleter) {
    for (auto& slot : gHazards)
        if (slot.ptr.load(std::memory_order_acquire) == node) return; // still live
    deleter(node);
}`,
    explanation: "Hazard pointers are the standard solution to ABA and use-after-free in lock-free data structures: each reader pins a pointer before dereferencing it, and the reclaimer scans all hazard slots before freeing — the cost is O(H) scan per reclamation where H is the number of threads.",
  },
  {
    id: "cpp-20260620-b1-dual-number-greeks",
    language: "cpp",
    title: "Dual-number forward-mode autodiff for exact Greeks",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>

// A dual number d = (real, epsilon) where epsilon^2 = 0.
// Arithmetic propagates the derivative automatically.
struct Dual {
    double v;  // value
    double d;  // derivative
    Dual(double v, double d = 0.0) : v(v), d(d) {}
    Dual operator+(Dual o) const { return {v + o.v, d + o.d}; }
    Dual operator-(Dual o) const { return {v - o.v, d - o.d}; }
    Dual operator*(Dual o) const { return {v * o.v, v * o.d + d * o.v}; }
    Dual operator/(Dual o) const { return {v / o.v, (d*o.v - v*o.d)/(o.v*o.v)}; }
};
Dual exp(Dual x) { return {std::exp(x.v), std::exp(x.v) * x.d}; }
Dual log(Dual x) { return {std::log(x.v), x.d / x.v}; }
Dual sqrt(Dual x){ return {std::sqrt(x.v), x.d / (2.0 * std::sqrt(x.v))}; }
Dual norm_cdf(Dual x) {
    double cdf = 0.5 * std::erfc(-x.v * M_SQRT1_2);
    double pdf = std::exp(-0.5*x.v*x.v) / std::sqrt(2.0*M_PI);
    return {cdf, pdf * x.d};
}

// Black-Scholes call: pass S as Dual(S0, 1.0) to get delta automatically
Dual bs_call(Dual S, double K, double r, double sigma, double T) {
    Dual d1 = (log(S / Dual{K}) + Dual{(r + 0.5*sigma*sigma)*T}) / Dual{sigma*std::sqrt(T)};
    Dual d2 = d1 - Dual{sigma * std::sqrt(T)};
    return S * norm_cdf(d1) - Dual{K * std::exp(-r*T)} * norm_cdf(d2);
}

int main() {
    Dual S{100.0, 1.0};   // seed derivative w.r.t. S
    Dual call = bs_call(S, 100.0, 0.05, 0.2, 1.0);
    std::cout << "Price: " << call.v << "  Delta: " << call.d << "\\n";
}`,
    explanation: "Forward-mode autodiff threads a derivative component through every arithmetic operation by the chain rule, giving exact (not finite-difference) Greeks at the cost of one extra double per variable — ideal for single-input sensitivities like Delta without touching the pricing formula.",
  },
  {
    id: "cpp-20260620-b1-carr-madan-fft",
    language: "cpp",
    title: "Carr-Madan FFT option pricing via characteristic function",
    tag: "derivatives",
    code: `#include <complex>
#include <vector>
#include <cmath>
#include <numbers>

using cx = std::complex<double>;

// Characteristic function of log(S_T) under Black-Scholes
cx bs_cf(cx u, double S0, double r, double sigma, double T) {
    cx i{0.0, 1.0};
    double lnS = std::log(S0);
    cx exponent = i*u*(lnS + (r - 0.5*sigma*sigma)*T)
                - 0.5 * sigma*sigma * T * u*u;
    return std::exp(exponent);
}

// Carr-Madan formula: price = (exp(-alpha*k)/pi) * Re[integral]
// Discretised as FFT over N log-strike points.
// alpha: dampening parameter (typically 1.5 for calls).
std::vector<double> carr_madan(double S0, double r, double sigma, double T,
                                double alpha = 1.5, int N = 4096) {
    double eta   = 0.25;                       // integration step in u
    double lambda= 2.0*std::numbers::pi / (N * eta);  // log-strike spacing
    double b     = std::numbers::pi / eta;     // log-strike grid starts at -b

    std::vector<cx> x(N);
    for (int j = 0; j < N; ++j) {
        double u   = j * eta;
        cx psi_u = std::exp(-r*T) * bs_cf(cx{u - (alpha+1.0), 0.0}, S0, r, sigma, T)
                   / (alpha*alpha + alpha - u*u + cx{0.0, (2.0*alpha+1.0)*u});
        // Simpson's rule weight
        double w = (j == 0) ? 1.0/3.0 : (j % 2 == 1 ? 4.0/3.0 : 2.0/3.0);
        x[j] = std::exp(cx{0.0, b*u}) * psi_u * eta * w;
    }
    // Full FFT would replace the loop below; shown inline for clarity:
    std::vector<double> prices(N);
    for (int k = 0; k < N; ++k) {
        double km = -b + lambda * k;          // log-strike
        cx sum{0.0, 0.0};
        for (int j = 0; j < N; ++j)
            sum += x[j] * std::exp(cx{0.0, -2.0*std::numbers::pi*j*k/N});
        prices[k] = std::exp(-alpha*km) / std::numbers::pi * sum.real();
    }
    return prices;  // indexed by log-strike grid
}`,
    explanation: "The Carr-Madan method recasts option pricing as a Fourier integral over the characteristic function of log-price; a single FFT then prices calls at N strikes simultaneously, making it dramatically faster than N independent numerical integrations for calibration.",
  },
  {
    id: "cpp-20260620-b1-flat-map-book",
    language: "cpp",
    title: "C++23 std::flat_map for sorted price-level order book",
    tag: "stl",
    code: `#include <flat_map>   // C++23
#include <cstdint>
#include <print>      // C++23

// std::flat_map stores keys and values in two contiguous vectors, giving
// O(log n) lookup and O(1) iteration — better cache behaviour than std::map's
// node-based red-black tree for read-heavy order books.

struct Level { double qty; int count; };

// Bids: descending (greater<> comparator); asks: ascending (default)
std::flat_map<std::int64_t, Level, std::greater<std::int64_t>> bids;
std::flat_map<std::int64_t, Level>                              asks;

void addOrder(bool is_bid, std::int64_t price_pts, double qty) {
    auto& book = is_bid ? reinterpret_cast<decltype(asks)&>(bids) : asks;
    (void)book;  // separate maps for clarity in the example
    if (is_bid) { bids[price_pts].qty += qty; bids[price_pts].count++; }
    else        { asks[price_pts].qty += qty; asks[price_pts].count++; }
}

void printTop5() {
    int n = 0;
    for (auto& [px, lv] : bids) {
        std::print("BID {:.2f} x {:.0f}\\n", px / 1e8, lv.qty);
        if (++n == 5) break;
    }
}`,
    explanation: "std::flat_map (C++23) replaces std::map's linked tree with a sorted contiguous array, cutting pointer-chasing on iteration and improving prefetcher efficiency — for a 20-level book display the cache savings over map can halve the CPU time.",
  },
  {
    id: "cpp-20260620-b1-hull-white-zcb",
    language: "cpp",
    title: "Hull-White one-factor zero coupon bond price",
    tag: "fixed-income",
    code: `#include <cmath>
#include <vector>

// Hull-White: dr = (theta(t) - a*r)*dt + sigma*dW
// Analytic ZCB: P(t,T) = A(t,T)*exp(-B(t,T)*r(t))
// calibrated to today's term structure via theta(t).

struct HullWhite {
    double a;     // mean reversion speed
    double sigma; // volatility

    double B(double t, double T) const {
        return (1.0 - std::exp(-a*(T-t))) / a;
    }

    // P_mkt(0,t): market discount factor at t (input curve)
    double A(double t, double T,
             const std::vector<double>& times,
             const std::vector<double>& df_mkt) const {
        // Interpolate log discount factors linearly
        auto logDF = [&](double tau) {
            for (std::size_t i = 1; i < times.size(); ++i)
                if (times[i] >= tau) {
                    double w = (tau - times[i-1]) / (times[i] - times[i-1]);
                    return (1-w)*std::log(df_mkt[i-1]) + w*std::log(df_mkt[i]);
                }
            return std::log(df_mkt.back());
        };
        double lnA = logDF(T) - logDF(t)
                   - B(t,T) * (-logDF(t) / t)    // fwd rate approx
                   - 0.25 * sigma*sigma / a
                     * (1 - std::exp(-2*a*t)) * B(t,T)*B(t,T);
        return std::exp(lnA);
    }

    // ZCB price given current short rate r0 at time t
    double zcb(double t, double T, double r0,
               const std::vector<double>& times,
               const std::vector<double>& df_mkt) const {
        return A(t, T, times, df_mkt) * std::exp(-B(t,T) * r0);
    }
};`,
    explanation: "The Hull-White analytic ZCB formula fits the initial term structure exactly via theta(t) — the A(t,T) factor absorbs the discrepancy between a flat Vasicek curve and the market curve, making it the workhorse short-rate model for swaption and cap/floor pricing.",
  },
  {
    id: "cpp-20260620-b1-black76",
    language: "cpp",
    title: "Black-76 option on futures / forward",
    tag: "derivatives",
    code: `#include <cmath>

// Black-76: forward price F replaces S*exp(r*T); discount factor exp(-r*T)
// is applied separately. Used for options on futures, caps, floors, swaptions.
struct Black76 {
    static double d1(double F, double K, double sigma, double T) {
        return (std::log(F/K) + 0.5*sigma*sigma*T) / (sigma*std::sqrt(T));
    }
    static double norm_cdf(double x) {
        return 0.5 * std::erfc(-x * M_SQRT1_2);
    }
    static double call(double F, double K, double r, double sigma, double T) {
        double d_1 = d1(F, K, sigma, T);
        double d_2 = d_1 - sigma * std::sqrt(T);
        return std::exp(-r*T) * (F*norm_cdf(d_1) - K*norm_cdf(d_2));
    }
    static double put(double F, double K, double r, double sigma, double T) {
        double d_1 = d1(F, K, sigma, T);
        double d_2 = d_1 - sigma * std::sqrt(T);
        return std::exp(-r*T) * (K*norm_cdf(-d_2) - F*norm_cdf(-d_1));
    }
    // Delta w.r.t. F (not S — futures delta = exp(-r*T)*N(d1))
    static double delta(double F, double K, double r, double sigma, double T) {
        return std::exp(-r*T) * norm_cdf(d1(F, K, sigma, T));
    }
};`,
    explanation: "Black-76 replaces the stock price with the forward/futures price and removes the cost-of-carry drift, making it the standard for commodity futures options and interest rate derivatives (caplets as options on LIBOR/SOFR forward rates).",
  },
  {
    id: "cpp-20260620-b1-asian-arithmetic-mc",
    language: "cpp",
    title: "Arithmetic Asian call MC with antithetic variates",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <numeric>

// Arithmetic average Asian: payoff = max(A_T - K, 0) where A_T = (1/n)*sum(S_ti)
// No closed form (unlike geometric); MC with antithetic reduces variance ~50%.
double asianArithCall(double S0, double K, double r, double sigma,
                      double T, int n_obs, int n_paths, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> N01;
    double dt   = T / n_obs;
    double disc = std::exp(-r * T);
    double payoff_sum = 0.0;

    for (int p = 0; p < n_paths; p += 2) {
        double S  = S0, Sa = S0;    // antithetic pair
        double sumS = 0.0, sumSa = 0.0;
        for (int i = 0; i < n_obs; ++i) {
            double z = N01(rng);
            double fac  = std::exp((r - 0.5*sigma*sigma)*dt + sigma*std::sqrt(dt)*z);
            double faca = std::exp((r - 0.5*sigma*sigma)*dt + sigma*std::sqrt(dt)*(-z));
            S  *= fac;  Sa *= faca;
            sumS += S;  sumSa += Sa;
        }
        double A  = sumS  / n_obs;
        double Aa = sumSa / n_obs;
        payoff_sum += std::max(A  - K, 0.0)
                    + std::max(Aa - K, 0.0);
    }
    return disc * payoff_sum / n_paths;
}`,
    explanation: "Antithetic variates pair each normal draw z with -z; for a monotone payoff like a call on the arithmetic average the two paths are negatively correlated, cutting variance roughly in half at zero additional simulation cost.",
  },
  {
    id: "cpp-20260620-b1-cir-simulation",
    language: "cpp",
    title: "CIR square-root process simulation (Milstein scheme)",
    tag: "fixed-income",
    code: `#include <cmath>
#include <random>
#include <vector>

// Cox-Ingersoll-Ross: dr = kappa*(theta-r)*dt + sigma*sqrt(r)*dW
// Euler can go negative; Milstein with reflection is safer for small dt.
// Condition 2*kappa*theta >= sigma^2 (Feller condition) ensures r stays > 0.
std::vector<double> cirSimulate(double r0, double kappa, double theta,
                                 double sigma, double T, int n_steps,
                                 unsigned seed = 0) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> N01;
    double dt = T / n_steps;
    std::vector<double> path(n_steps + 1);
    path[0] = r0;
    for (int i = 1; i <= n_steps; ++i) {
        double r  = path[i-1];
        double sqr = std::sqrt(std::max(r, 0.0));
        double z  = N01(rng);
        // Milstein correction: adds 0.25*sigma^2*(z^2*dt - dt) to reduce bias
        double r_new = r
                     + kappa*(theta - r)*dt
                     + sigma*sqr*std::sqrt(dt)*z
                     + 0.25*sigma*sigma*(z*z*dt - dt);  // Milstein term
        path[i] = std::max(r_new, 0.0);  // reflection at zero
    }
    return path;
}

// ZCB price under CIR via analytic formula
double cirZCB(double r0, double kappa, double theta,
              double sigma, double tau) {
    double gamma = std::sqrt(kappa*kappa + 2.0*sigma*sigma);
    double denom = (gamma+kappa)*(std::exp(gamma*tau)-1.0) + 2.0*gamma;
    double B = 2.0*(std::exp(gamma*tau)-1.0) / denom;
    double A = std::pow(2.0*gamma*std::exp((kappa+gamma)*tau/2.0) / denom,
                        2.0*kappa*theta / (sigma*sigma));
    return A * std::exp(-B * r0);
}`,
    explanation: "The Milstein scheme adds a second-order correction (the Ito correction term) that captures the curvature of the diffusion coefficient, eliminating the O(√dt) bias of Euler for the CIR square-root diffusion while remaining analytically tractable.",
  },
  {
    id: "cpp-20260620-b1-lookback-closed",
    language: "cpp",
    title: "Continuous lookback call closed-form (floating strike)",
    tag: "derivatives",
    code: `#include <cmath>

// Floating-strike lookback call: payoff = S_T - min_{0<=t<=T} S_t
// Closed form from Goldman-Sosin-Gatto (1979).
// m0: observed minimum so far (= S0 at inception)
double lookbackCallFloat(double S0, double m0, double r,
                          double sigma, double T) {
    double sig2 = sigma * sigma;
    double a1 = (std::log(S0/m0) + (r + 0.5*sig2)*T) / (sigma*std::sqrt(T));
    double a2 = a1 - sigma*std::sqrt(T);
    double a3 = (std::log(S0/m0) + (-r + 0.5*sig2)*T) / (sigma*std::sqrt(T));

    auto N = [](double x){ return 0.5*std::erfc(-x*M_SQRT1_2); };

    return S0 * N(a1)
         - m0 * std::exp(-r*T) * N(a2)
         - S0 * std::exp(-r*T) * sig2/(2.0*r)
           * (std::pow(S0/m0, -2.0*r/sig2) * N(-a3)
              - std::exp(r*T) * N(-a1));
}`,
    explanation: "The floating-strike lookback call is always in the money at expiry by design; its premium embeds the value of knowing the minimum ex-post, priced analytically without MC by exploiting the reflection principle for Brownian motion.",
  },
  {
    id: "cpp-20260620-b1-trinomial-american",
    language: "cpp",
    title: "Trinomial tree for American option pricing",
    tag: "derivatives",
    code: `#include <cmath>
#include <vector>
#include <algorithm>

// Trinomial tree: three branches (up, mid, down) per node.
// Calibrated to match sigma and r; generally converges faster than binomial.
double trinomialAmerican(double S0, double K, double r, double sigma,
                          double T, int N, bool isCall) {
    double dt  = T / N;
    double u   = std::exp(sigma * std::sqrt(2.0*dt));
    double d   = 1.0 / u;
    double m   = 1.0;
    // Risk-neutral probabilities (Kamrad-Ritchken)
    double pu  = std::pow((std::exp(r*dt/2.0) - std::exp(-sigma*std::sqrt(dt/2.0)))
                        / (std::exp(sigma*std::sqrt(dt/2.0)) - std::exp(-sigma*std::sqrt(dt/2.0))), 2.0);
    double pd  = std::pow((std::exp(sigma*std::sqrt(dt/2.0)) - std::exp(r*dt/2.0))
                        / (std::exp(sigma*std::sqrt(dt/2.0)) - std::exp(-sigma*std::sqrt(dt/2.0))), 2.0);
    double pm  = 1.0 - pu - pd;
    double disc = std::exp(-r * dt);

    int nodes = 2*N + 1;
    std::vector<double> V(nodes);
    // Terminal payoff
    for (int i = 0; i < nodes; ++i) {
        double S = S0 * std::pow(u, N - i);
        double payoff = isCall ? std::max(S - K, 0.0) : std::max(K - S, 0.0);
        V[i] = payoff;
    }
    // Backward induction with early exercise
    for (int step = N - 1; step >= 0; --step) {
        for (int i = 0; i <= 2*step; ++i) {
            double S = S0 * std::pow(u, step - i);
            double hold = disc * (pu*V[i] + pm*V[i+1] + pd*V[i+2]);
            double exercise = isCall ? std::max(S - K, 0.0) : std::max(K - S, 0.0);
            V[i] = std::max(hold, exercise);
        }
    }
    return V[0];
}`,
    explanation: "The trinomial tree adds a middle branch that stays flat, giving three instead of two recombination possibilities; this converges roughly twice as fast as the CRR binomial for smooth payoffs and handles barrier options naturally since nodes can be placed exactly on the barrier.",
  },
  {
    id: "cpp-20260620-b1-constexpr-newtons-impliedvol",
    language: "cpp",
    title: "Constexpr Newton's method for compile-time implied volatility",
    tag: "numerics",
    code: `#include <cmath>
#include <stdexcept>

// A constexpr BS call for scalar S, K, r, sigma, T
constexpr double norm_cdf_approx(double x) {
    // Abramowitz & Stegun rational approximation, max error 7.5e-8
    constexpr double a1= 0.319381530, a2=-0.356563782,
                     a3= 1.781477937, a4=-1.821255978, a5= 1.330274429;
    double t = 1.0 / (1.0 + 0.2316419 * (x < 0 ? -x : x));
    double poly = t*(a1+t*(a2+t*(a3+t*(a4+t*a5))));
    double val  = 1.0 - poly * std::exp(-0.5*x*x) / 2.506628274631;
    return x < 0 ? 1.0 - val : val;
}

constexpr double bs_call(double S, double K, double r, double sigma, double T) {
    double sq = sigma * std::sqrt(T);
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / sq;
    double d2 = d1 - sq;
    return S*norm_cdf_approx(d1) - K*std::exp(-r*T)*norm_cdf_approx(d2);
}

constexpr double bs_vega(double S, double K, double r, double sigma, double T) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    return S * std::sqrt(T) * std::exp(-0.5*d1*d1) / 2.506628274631;
}

// Newton's method: iterate sigma -= (price(sigma) - mktPrice) / vega(sigma)
constexpr double implied_vol(double S, double K, double r,
                              double T, double mkt_price,
                              int max_iter = 50, double tol = 1e-10) {
    double sig = 0.2;
    for (int i = 0; i < max_iter; ++i) {
        double diff = bs_call(S, K, r, sig, T) - mkt_price;
        if (diff < tol && diff > -tol) break;
        sig -= diff / bs_vega(S, K, r, sig, T);
        if (sig < 1e-8) sig = 1e-8;
    }
    return sig;
}

// Evaluate at compile time if inputs are constexpr
static_assert(implied_vol(100.0, 100.0, 0.05, 1.0, 10.4506) > 0.19);`,
    explanation: "Newton's method for implied vol converges quadratically (typically 4–5 iterations from sigma=0.2) because Vega is smooth and non-zero away from deep OTM; marking it constexpr lets the compiler compute strike grids or vol tables at build time with zero runtime overhead.",
  },
  {
    id: "cpp-20260620-b1-mdspan-returns",
    language: "cpp",
    title: "std::mdspan for strided 2D return matrix (C++23)",
    tag: "modern",
    code: `#include <mdspan>   // C++23
#include <vector>
#include <cstddef>
#include <numeric>

// std::mdspan is a non-owning view over a flat buffer with multi-dimensional
// indexing. Zero overhead vs. raw pointer arithmetic.

void computeCovariance(const std::vector<double>& flat_returns,
                       std::size_t n_assets, std::size_t n_obs,
                       std::vector<double>& cov_out) {
    // View the flat buffer as a [n_obs x n_assets] matrix
    auto R = std::mdspan(flat_returns.data(),
                         std::extents<std::size_t, std::dynamic_extent,
                                                   std::dynamic_extent>{n_obs, n_assets});

    // Compute means
    std::vector<double> mu(n_assets, 0.0);
    for (std::size_t t = 0; t < n_obs; ++t)
        for (std::size_t a = 0; a < n_assets; ++a)
            mu[a] += R[t, a];     // multidimensional subscript (C++23)
    for (auto& m : mu) m /= static_cast<double>(n_obs);

    // Covariance
    cov_out.assign(n_assets * n_assets, 0.0);
    auto C = std::mdspan(cov_out.data(),
                         std::extents<std::size_t, std::dynamic_extent,
                                                   std::dynamic_extent>{n_assets, n_assets});
    for (std::size_t t = 0; t < n_obs; ++t)
        for (std::size_t i = 0; i < n_assets; ++i)
            for (std::size_t j = i; j < n_assets; ++j) {
                double c = (R[t,i]-mu[i])*(R[t,j]-mu[j]) / (n_obs-1);
                C[i,j] += c;
                if (i != j) C[j,i] += c;
            }
}`,
    explanation: "std::mdspan gives a zero-overhead multi-dimensional view over existing memory using C++23's multi-argument operator[], avoiding the manual index arithmetic (`flat[t*n_assets + a]`) that hides algorithmic intent and invites off-by-one bugs.",
  },
  {
    id: "cpp-20260620-b1-bitset-order-flags",
    language: "cpp",
    title: "std::bitset for compact order attribute flags",
    tag: "stl",
    code: `#include <bitset>
#include <cstdint>
#include <string>

// Pack boolean order attributes into a single word; cheaper than bool fields
// and avoids padding. Bitset operations are branchless POPCNT/AND/OR.
enum class OrderFlag : std::size_t {
    IOC          = 0,   // Immediate-or-cancel
    FOK          = 1,   // Fill-or-kill
    POST_ONLY    = 2,   // Maker only (rejected if would take liquidity)
    REDUCE_ONLY  = 3,   // Never increase position
    HIDDEN       = 4,   // Iceberg / hidden order
    PEGGED       = 5,   // Mid/primary peg
    CROSS_MARGINED = 6,
    _COUNT       = 7,
};

using Flags = std::bitset<static_cast<std::size_t>(OrderFlag::_COUNT)>;

inline void set(Flags& f, OrderFlag flag) {
    f.set(static_cast<std::size_t>(flag));
}
inline bool test(const Flags& f, OrderFlag flag) {
    return f.test(static_cast<std::size_t>(flag));
}

struct Order {
    std::uint64_t id;
    std::int64_t  price_pts;
    std::uint32_t qty;
    Flags         flags;
};

bool isAggressive(const Order& o) {
    return !test(o.flags, OrderFlag::POST_ONLY)
        && !test(o.flags, OrderFlag::HIDDEN);
}`,
    explanation: "std::bitset packs multiple boolean attributes into a machine word, letting a modern CPU test or modify any combination of flags in a single instruction — compared to a struct of bools which wastes a full cache line on padding.",
  },
  {
    id: "cpp-20260620-b1-jthread-stop-token",
    language: "cpp",
    title: "std::jthread + stop_token for graceful feed shutdown",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <chrono>
#include <iostream>
#include <atomic>

// std::jthread automatically joins on destruction and provides a built-in
// stop_token so the thread can poll for cancellation without shared atomics.
std::atomic<long> tick_count{0};

void feedThread(std::stop_token stop, int feed_id) {
    while (!stop.stop_requested()) {
        // Simulate processing one tick packet
        ++tick_count;
        // stop_requested() is checked here; the thread exits cleanly on scope exit
        std::this_thread::sleep_for(std::chrono::microseconds(100));
    }
    std::cout << "Feed " << feed_id << " shut down cleanly\\n";
}

int main() {
    {
        std::jthread t1(feedThread, 1);   // starts immediately
        std::jthread t2(feedThread, 2);
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
        // request_stop() signals all threads sharing this token
        t1.request_stop();
        t2.request_stop();
    }  // jthread destructor joins — no dangling threads
    std::cout << "Processed " << tick_count << " ticks\\n";
}`,
    explanation: "std::jthread bundles a stop_source with the thread: calling request_stop() flips a flag the thread polls via stop_token, enabling cooperative cancellation without a shared atomic or condition variable — the destructor guarantees joining even on exception paths.",
  },
  {
    id: "cpp-20260620-b1-expression-templates",
    language: "cpp",
    title: "Expression templates for lazy vector arithmetic (no temporaries)",
    tag: "modern",
    code: `#include <vector>
#include <cstddef>

// Expression templates represent a + b*c as a type tree at compile time,
// fusing the loop into a single pass — zero intermediate allocations.

template <typename L, typename R>
struct VecAdd {
    const L& lhs; const R& rhs;
    double operator[](std::size_t i) const { return lhs[i] + rhs[i]; }
    std::size_t size() const { return lhs.size(); }
};

template <typename L, typename R>
struct VecMul {
    const L& lhs; const R& rhs;
    double operator[](std::size_t i) const { return lhs[i] * rhs[i]; }
    std::size_t size() const { return lhs.size(); }
};

struct Vec {
    std::vector<double> data;
    explicit Vec(std::size_t n, double v = 0.0) : data(n, v) {}
    double operator[](std::size_t i) const { return data[i]; }
    std::size_t size() const { return data.size(); }

    // Assign from any expression template — single fused loop
    template <typename Expr>
    Vec& operator=(const Expr& e) {
        for (std::size_t i = 0; i < data.size(); ++i) data[i] = e[i];
        return *this;
    }
};

template <typename L, typename R>
VecAdd<L,R> operator+(const L& l, const R& r) { return {l, r}; }
template <typename L, typename R>
VecMul<L,R> operator*(const L& l, const R& r) { return {l, r}; }

// Usage: result = a + b * c  — compiled to a single loop, no heap allocation
void demo() {
    Vec a(1024, 1.0), b(1024, 2.0), c(1024, 3.0), result(1024);
    result = a + b * c;   // single fused pass, zero temporaries
}`,
    explanation: "Expression templates encode the computation graph as a type tree so the compiler can see the entire expression at once; the assignment operator then emits a single fused loop — eliminating the intermediate Vec objects that a naive operator+ would allocate.",
  },
  {
    id: "cpp-20260620-b1-std-expected",
    language: "cpp",
    title: "std::expected<T,E> for zero-overhead order result error handling",
    tag: "modern",
    code: `#include <expected>   // C++23
#include <string>
#include <variant>

// std::expected is a value type that holds either T (success) or E (error).
// No exceptions, no dynamic allocation — compile-time discriminated union.

enum class OrderError { INSUFFICIENT_MARGIN, PRICE_CROSSED, DUPLICATE_ID, MARKET_CLOSED };

struct Fill { std::uint64_t trade_id; double fill_price; int fill_qty; };

std::expected<Fill, OrderError>
submitOrder(std::uint64_t oid, double price, int qty, double margin) {
    if (margin < qty * price * 0.1)
        return std::unexpected(OrderError::INSUFFICIENT_MARGIN);
    if (qty <= 0)
        return std::unexpected(OrderError::DUPLICATE_ID);
    // ... actual matching logic ...
    return Fill{oid * 1000, price, qty};   // success path
}

void processOrder() {
    auto result = submitOrder(42, 100.5, 10, 200.0);
    if (!result) {
        // error branch: result.error() is the OrderError enum
        return;
    }
    Fill& f = *result;   // dereference like optional
    (void)f.fill_price;
}`,
    explanation: "std::expected is C++23's monadic error type: the success and error values share the same storage (like std::variant), so there is no heap allocation or virtual dispatch — important for a hot order-processing path where exceptions are too expensive to throw.",
  },
  {
    id: "cpp-20260620-b1-type-erasure-trade",
    language: "cpp",
    title: "Type erasure for heterogeneous trade leg container",
    tag: "modern",
    code: `#include <memory>
#include <vector>
#include <cstdio>

// Type erasure: store different leg types in a single vector without
// templates, by programming to a non-template interface via virtual dispatch
// hidden inside a wrapper. The caller never sees the derived types.

struct ILeg {
    virtual double pv()       const = 0;
    virtual double dv01()     const = 0;
    virtual ~ILeg() = default;
};

struct FixedLeg { double notional; double rate; double tau;
    double pv()   const { return notional * rate * tau * std::exp(-rate*tau); }
    double dv01() const { return pv() * tau * 0.0001; }
};
struct FloatingLeg { double notional; double fwd; double tau;
    double pv()   const { return notional * fwd * tau * std::exp(-fwd*tau); }
    double dv01() const { return pv() * tau * 0.0001; }
};

template <typename T>
struct LegModel : ILeg {
    T impl;
    explicit LegModel(T t) : impl(std::move(t)) {}
    double pv()   const override { return impl.pv(); }
    double dv01() const override { return impl.dv01(); }
};

using Leg = std::unique_ptr<ILeg>;

template <typename T>
Leg makeLeg(T t) { return std::make_unique<LegModel<T>>(std::move(t)); }

double netPV(const std::vector<Leg>& legs) {
    double total = 0.0;
    for (auto& l : legs) total += l->pv();
    return total;
}`,
    explanation: "Type erasure via a model/concept pair lets you store Fixed, Floating, CDS, and Swaption legs in a single std::vector<Leg> without a common base class in the domain types — the virtual dispatch cost per leg is negligible compared to the pricing computation.",
  },
  {
    id: "cpp-20260620-b1-gamma-pnl",
    language: "cpp",
    title: "Gamma PnL decomposition from delta hedge",
    tag: "risk",
    code: `#include <cmath>
#include <vector>
#include <numeric>

// Daily delta-hedge PnL = Theta*dt + 0.5*Gamma*dS^2 + residual
// Realized gamma PnL = 0.5 * Gamma * (dS)^2 - Theta * dt
// If realized vol > implied vol, gamma PnL > 0 (you are long vol cheaply).

struct GammaPnLRecord {
    double date;
    double dS;          // spot move
    double gamma;       // option gamma at start of period
    double theta;       // option theta (per day, negative for long option)
    double gamma_pnl;   // = 0.5 * gamma * dS^2 + theta * dt
};

std::vector<GammaPnLRecord>
computeGammaPnL(const std::vector<double>& spot,
                const std::vector<double>& gammas,
                const std::vector<double>& thetas,
                double dt_years = 1.0/252.0) {
    std::vector<GammaPnLRecord> records;
    for (std::size_t i = 1; i < spot.size(); ++i) {
        double dS = spot[i] - spot[i-1];
        double g  = gammas[i-1];
        double th = thetas[i-1];
        double gpnl = 0.5 * g * dS*dS + th * dt_years;
        records.push_back({static_cast<double>(i), dS, g, th, gpnl});
    }
    return records;
}

// Total gamma PnL = cumulative comparison of realized vs. implied variance
double totalGammaPnL(const std::vector<GammaPnLRecord>& recs) {
    return std::accumulate(recs.begin(), recs.end(), 0.0,
        [](double s, const GammaPnLRecord& r){ return s + r.gamma_pnl; });
}`,
    explanation: "The gamma PnL identity (0.5·Γ·dS² + Θ·dt) shows that a delta-neutral long-gamma position profits whenever realized variance exceeds the implied variance priced into theta — the continuous-time P&L is exactly zero only when realized vol equals implied vol on every path.",
  },
  {
    id: "cpp-20260620-b1-fx-tri-arb",
    language: "cpp",
    title: "FX triangular arbitrage detection via log-weight cycle",
    tag: "graph",
    code: `#include <vector>
#include <cmath>
#include <optional>
#include <string>

// Triangular arbitrage: if USD->EUR->GBP->USD yields more than 1.0,
// a riskless profit exists. Model as shortest-path on -log(rate) graph.
// A negative-weight cycle in Bellman-Ford signals arbitrage.

struct Edge { int from, to; double log_neg_rate; };  // -log(rate)

std::optional<std::vector<int>>
detectFXArb(int n_ccy, const std::vector<Edge>& edges) {
    std::vector<double> dist(n_ccy, 0.0);
    std::vector<int>    pred(n_ccy, -1);

    // Relax edges n-1 times
    for (int iter = 0; iter < n_ccy - 1; ++iter)
        for (auto& e : edges)
            if (dist[e.from] + e.log_neg_rate < dist[e.to]) {
                dist[e.to] = dist[e.from] + e.log_neg_rate;
                pred[e.to] = e.from;
            }

    // One more pass: if any edge relaxes, there's a negative cycle (arb)
    int cycle_node = -1;
    for (auto& e : edges)
        if (dist[e.from] + e.log_neg_rate < dist[e.to] - 1e-9) {
            cycle_node = e.to;
            break;
        }
    if (cycle_node == -1) return std::nullopt;

    // Trace the cycle
    std::vector<bool> visited(n_ccy, false);
    int cur = cycle_node;
    for (int i = 0; i < n_ccy; ++i) cur = pred[cur];  // guarantee on cycle
    std::vector<int> cycle;
    int start = cur;
    do { cycle.push_back(cur); cur = pred[cur]; } while (cur != start);
    cycle.push_back(start);
    return cycle;
}`,
    explanation: "Taking -log of exchange rates converts a product-of-ratios condition into a sum, so a triangular arbitrage (product > 1) maps exactly to a negative-weight cycle in Bellman-Ford — the standard linear-time detection algorithm for graphs with potentially negative edges.",
  },
  {
    id: "cpp-20260620-b1-lut-normal-cdf",
    language: "cpp",
    title: "Compile-time LUT for fast normal CDF approximation",
    tag: "numerics",
    code: `#include <array>
#include <cmath>
#include <cstddef>

// Pre-compute N(x) for x in [-4, 4] at step 0.001 at compile time.
// At runtime: one array index + linear interpolation = ~2ns vs. ~8ns erfc.
constexpr int   LUT_SIZE = 8001;
constexpr double LUT_LO  = -4.0;
constexpr double LUT_HI  =  4.0;
constexpr double LUT_STEP = (LUT_HI - LUT_LO) / (LUT_SIZE - 1);

constexpr double norm_cdf_scalar(double x) {
    return 0.5 * std::erfc(-x * 0.7071067811865476);  // M_SQRT1_2
}

// Build the table at compile time using a constexpr lambda + iota trick
constexpr auto buildLUT() {
    std::array<float, LUT_SIZE> lut{};
    for (int i = 0; i < LUT_SIZE; ++i)
        lut[i] = static_cast<float>(norm_cdf_scalar(LUT_LO + i * LUT_STEP));
    return lut;
}
constexpr auto kNormLUT = buildLUT();

inline double norm_cdf_fast(double x) noexcept {
    if (x <= LUT_LO) return 0.0;
    if (x >= LUT_HI) return 1.0;
    double idx = (x - LUT_LO) / LUT_STEP;
    int i = static_cast<int>(idx);
    double frac = idx - i;
    return kNormLUT[i] + frac * (kNormLUT[i+1] - kNormLUT[i]);
}`,
    explanation: "A constexpr LUT built at compile time costs zero runtime cycles to populate; the resulting array fits in ~32 KB of L1 cache, and linear interpolation between adjacent float entries keeps absolute error below 5e-7 — accurate enough for option Greeks at far lower cost than erfc().",
  },
  {
    id: "cpp-20260620-b1-udp-mcast-parser",
    language: "cpp",
    title: "UDP multicast market-data receive and fast field parse",
    tag: "networking",
    code: `#include <sys/socket.h>
#include <arpa/inet.h>
#include <netinet/in.h>
#include <string_view>
#include <cstring>
#include <cstdint>

// Parse a minimal binary tick: [seq:8][ts:8][price:8][qty:4] = 28 bytes
#pragma pack(push, 1)
struct TickPkt {
    std::uint64_t seq;
    std::uint64_t ts_ns;
    double        price;
    std::uint32_t qty;
};
#pragma pack(pop)

int openMcast(const char* group, std::uint16_t port) {
    int fd = socket(AF_INET, SOCK_DGRAM, 0);
    int reuse = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse));

    sockaddr_in addr{};
    addr.sin_family      = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port        = htons(port);
    bind(fd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr));

    ip_mreq mreq{};
    inet_pton(AF_INET, group, &mreq.imr_multiaddr);
    mreq.imr_interface.s_addr = INADDR_ANY;
    setsockopt(fd, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq));
    return fd;
}

void recvLoop(int fd) {
    alignas(64) char buf[1500];
    while (true) {
        ssize_t n = recv(fd, buf, sizeof(buf), 0);
        if (n < static_cast<ssize_t>(sizeof(TickPkt))) continue;
        const TickPkt* pkt = reinterpret_cast<const TickPkt*>(buf);
        // Process pkt->price, pkt->qty, pkt->ts_ns ...
    }
}`,
    explanation: "IP multicast delivers one UDP datagram to many subscribers simultaneously; packing the binary struct with #pragma pack(1) and casting the recv buffer directly avoids memcpy and struct-copy overhead in the hot receive path, keeping latency under 1 µs on a local LAN.",
  },
  {
    id: "cpp-20260620-b1-crtp-strategy",
    language: "cpp",
    title: "CRTP static polymorphism for zero-cost strategy dispatch",
    tag: "modern",
    code: `#include <iostream>

// CRTP: derive from Base<Derived> to get static virtual dispatch.
// The compiler inlines the Derived methods — no vtable lookup.

template <typename Derived>
struct StrategyBase {
    void onTick(double bid, double ask) {
        static_cast<Derived*>(this)->handleTick(bid, ask);
    }
    void onFill(double price, int qty) {
        static_cast<Derived*>(this)->handleFill(price, qty);
    }
};

struct MomentumStrategy : StrategyBase<MomentumStrategy> {
    double ema = 0.0;
    void handleTick(double bid, double ask) {
        double mid = (bid + ask) * 0.5;
        ema = 0.94 * ema + 0.06 * mid;   // decay factor α = 0.06
        if (mid > ema * 1.001) {/* buy signal */}
    }
    void handleFill(double price, int qty) {
        std::cout << "Filled " << qty << " @ " << price << "\\n";
    }
};

struct MarketMakingStrategy : StrategyBase<MarketMakingStrategy> {
    void handleTick(double bid, double ask) {
        double spread = ask - bid;
        if (spread > 0.002) {/* post quotes inside spread */}
    }
    void handleFill(double price, int qty) {}
};

// Template caller: zero overhead vs. direct call
template <typename S>
void dispatchTick(S& strat, double bid, double ask) {
    strat.onTick(bid, ask);  // inlined by compiler
}`,
    explanation: "CRTP achieves polymorphic dispatch without a vtable by embedding the derived type as a template parameter; the compiler can inline the derived method directly into dispatchTick's call site, saving the indirect branch and its branch-predictor penalty on the hot tick path.",
  },
  {
    id: "cpp-20260620-b1-varswap-replication",
    language: "cpp",
    title: "Variance swap fair strike via log-contract replication",
    tag: "derivatives",
    code: `#include <cmath>
#include <vector>
#include <numeric>

// Variance swap fair strike K_var = E^Q[realized variance]
// = (2/T) * [integral_0^F (P(K)/K^2)dK + integral_F^inf (C(K)/K^2)dK]
// Discrete approximation from a strip of vanilla options.

struct OptionQuote { double strike; double price; bool is_call; };

double varSwapStrike(double F,           // forward price
                     double T,           // maturity in years
                     double r,           // risk-free rate
                     const std::vector<OptionQuote>& opts) {
    // Sort by strike
    auto sorted = opts;
    std::sort(sorted.begin(), sorted.end(),
              [](const OptionQuote& a, const OptionQuote& b){ return a.strike < b.strike; });

    double integral = 0.0;
    for (std::size_t i = 0; i + 1 < sorted.size(); ++i) {
        const auto& q  = sorted[i];
        const auto& q2 = sorted[i+1];
        double dK = q2.strike - q.strike;
        // Mid-point rule: weight by dK / K^2
        double K  = 0.5 * (q.strike + q2.strike);
        double px = 0.5 * (q.price  + q2.price);
        integral += px / (K * K) * dK;
    }
    // Fair variance: 2/T * e^(rT) * integral
    double K_var = (2.0 / T) * std::exp(r * T) * integral;
    return std::sqrt(K_var);   // return as vol strike (annualised)
}`,
    explanation: "The Carr-Madan log-contract decomposition shows that the fair variance strike equals a model-free weighted sum of all vanilla option prices across strikes; this is exactly how the VIX index is constructed and how dealers statically replicate the var swap payoff.",
  },
  {
    id: "cpp-20260620-b1-fold-multi-greek",
    language: "cpp",
    title: "Variadic fold expression to aggregate Greeks across a book",
    tag: "modern",
    code: `#include <tuple>
#include <utility>

struct Greeks { double delta; double gamma; double vega; double theta; };

// Sum two Greeks structs
constexpr Greeks operator+(Greeks a, const Greeks& b) {
    return {a.delta+b.delta, a.gamma+b.gamma, a.vega+b.vega, a.theta+b.theta};
}

// Fold expression: expand the parameter pack with + and reduce left-to-right.
// Works for any number of positions at compile time.
template <typename... Legs>
constexpr Greeks aggregateGreeks(Legs&&... legs) {
    return (... + std::forward<Legs>(legs));  // left fold over +
}

Greeks optionGreeks(double delta, double gamma, double vega, double theta) {
    return {delta, gamma, vega, theta};
}

int main() {
    // Aggregate a 3-leg book in one expression — no loop, fully unrolled
    Greeks book = aggregateGreeks(
        optionGreeks( 0.50, 0.02, 0.18, -0.05),   // long call
        optionGreeks(-0.30, 0.01, 0.10, -0.03),   // short put
        optionGreeks( 0.10, 0.00, 0.00,  0.00)    // stock delta hedge
    );
    // book.delta = 0.30, book.gamma = 0.03, ...
}`,
    explanation: "The C++17 fold expression `(... + legs)` expands to `leg0 + leg1 + leg2` with the compiler unrolling the entire reduction at compile time — zero function-call overhead and no intermediate vector allocation for small fixed-size books like spreads and straddles.",
  },
];
