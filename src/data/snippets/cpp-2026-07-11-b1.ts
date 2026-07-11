import { Snippet } from "./types";

export const cppSnippets20260711B1: Snippet[] = [
  {
    id: "cpp-20260711-b1-rdtsc-timer",
    language: "cpp",
    title: "RDTSC Hardware Timestamp Counter",
    tag: "low-latency",
    code: `#include <cstdint>
#include <x86intrin.h>

// Read hardware TSC — cycles since CPU reset
inline uint64_t rdtsc() {
    return __rdtsc();
}

// Serialize: drain pipeline before measuring
inline uint64_t rdtscp() {
    unsigned aux;
    return __rdtscp(&aux);  // also writes IA32_TSC_AUX to aux
}

// Calibrate: TSC ticks per wall-clock nanosecond
double calibrate_tsc_ns() {
    struct timespec t1, t2;
    clock_gettime(CLOCK_MONOTONIC_RAW, &t1);
    uint64_t c1 = rdtsc();
    // busy-wait ~100 ms
    volatile uint64_t dummy = 0;
    for (int i = 0; i < 100'000'000; ++i) dummy += i;
    uint64_t c2 = rdtscp();
    clock_gettime(CLOCK_MONOTONIC_RAW, &t2);
    double ns = (t2.tv_sec - t1.tv_sec) * 1e9 + (t2.tv_nsec - t1.tv_nsec);
    return (c2 - c1) / ns;  // ticks / ns
}

// Usage pattern
struct LatencyProbe {
    uint64_t start;
    double   ticks_per_ns;

    void begin()  { start = rdtsc(); }
    double end_ns() const {
        return (rdtscp() - start) / ticks_per_ns;
    }
};`,
    explanation:
      "RDTSC reads the hardware cycle counter — cheapest available timer (~5 ns overhead vs ~25 ns for clock_gettime). RDTSCP adds a pipeline barrier (serialising fence) so instructions before it cannot reorder past the read. Calibration maps ticks to wall-clock nanoseconds. Must confirm constant_tsc and nonstop_tsc CPU flags for reliability across C-states.",
  },
  {
    id: "cpp-20260711-b1-cpu-affinity",
    language: "cpp",
    title: "Thread Pinning & Real-Time Scheduling",
    tag: "low-latency",
    code: `#include <pthread.h>
#include <sched.h>
#include <stdexcept>
#include <string>

// Pin calling thread to a single logical core
void pin_to_core(int core_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_id, &cpuset);
    if (pthread_setaffinity_np(pthread_self(), sizeof(cpuset), &cpuset) != 0)
        throw std::runtime_error("setaffinity failed");
}

// Elevate to SCHED_FIFO (real-time, non-preemptible by normal tasks)
// Requires CAP_SYS_NICE or running as root
void set_realtime(int priority = 80) {
    sched_param sp{};
    sp.sched_priority = priority;   // 1–99, higher = more urgent
    if (sched_setscheduler(0, SCHED_FIFO, &sp) != 0)
        throw std::runtime_error("sched_setscheduler failed");
}

// Typical trading thread bootstrap
void start_order_gateway_thread(int core) {
    pin_to_core(core);
    set_realtime(90);
    // Optionally: mlockall(MCL_CURRENT | MCL_FUTURE) to pre-fault pages
    // Then: enter event loop
}`,
    explanation:
      "Pinning a thread to a dedicated core eliminates OS migration overhead and improves cache affinity. SCHED_FIFO prevents the kernel from preempting the thread for lower-priority tasks. Typical HFT setups isolate cores with isolcpus kernel parameter, disable IRQ affinity on that core, and run with mlockall to avoid page-fault jitter.",
  },
  {
    id: "cpp-20260711-b1-mmap-hist-data",
    language: "cpp",
    title: "Memory-Mapped Historical Price Data",
    tag: "low-latency",
    code: `#include <fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <unistd.h>
#include <cstdint>
#include <span>
#include <stdexcept>

struct TickRecord {
    int64_t  timestamp_ns;
    double   bid, ask;
    uint32_t bid_qty, ask_qty;
} __attribute__((packed));

class MappedTickFile {
    void*  addr_ = MAP_FAILED;
    size_t size_ = 0;
public:
    explicit MappedTickFile(const char* path) {
        int fd = open(path, O_RDONLY);
        if (fd < 0) throw std::runtime_error("open failed");
        struct stat st{};
        fstat(fd, &st);
        size_ = static_cast<size_t>(st.st_size);
        addr_ = mmap(nullptr, size_, PROT_READ, MAP_SHARED | MAP_POPULATE, fd, 0);
        close(fd);
        if (addr_ == MAP_FAILED) throw std::runtime_error("mmap failed");
        madvise(addr_, size_, MADV_SEQUENTIAL);   // hint for prefetch
    }
    ~MappedTickFile() {
        if (addr_ != MAP_FAILED) munmap(addr_, size_);
    }
    // Zero-copy view over packed records
    std::span<const TickRecord> records() const {
        return { static_cast<const TickRecord*>(addr_),
                 size_ / sizeof(TickRecord) };
    }
};`,
    explanation:
      "mmap() avoids read() syscall overhead and copies: the OS directly maps file pages into the process address space. MAP_POPULATE pre-faults all pages at open time, eliminating soft-fault latency during iteration. MADV_SEQUENTIAL enables read-ahead. For write-heavy backtests MAP_PRIVATE + copy-on-write works; for shared writer scenarios use MAP_SHARED with explicit msync().",
  },
  {
    id: "cpp-20260711-b1-psor-american",
    language: "cpp",
    title: "Projected SOR for American Option PDE",
    tag: "derivatives",
    code: `#include <vector>
#include <algorithm>
#include <cmath>

// Projected Successive Over-Relaxation (PSOR) for American put
// Black-Scholes PDE on [0, S_max] uniform grid
std::vector<double> american_put_psor(
    double S0, double K, double r, double sigma, double T,
    int M = 200, int N = 1000, double omega = 1.2)
{
    double dS = K * 2.0 / M;
    double dt = T / N;
    std::vector<double> V(M + 1), Vold(M + 1);

    // Terminal condition (payoff)
    for (int i = 0; i <= M; ++i)
        V[i] = std::max(K - i * dS, 0.0);

    // Build tridiagonal coefficients (Crank-Nicolson flavour)
    std::vector<double> a(M + 1), b(M + 1), c(M + 1);
    for (int i = 1; i < M; ++i) {
        double Si = i * dS;
        double sig2 = sigma * sigma * Si * Si;
        a[i] = -0.25 * dt * (sig2 / (dS * dS) - r * Si / dS);
        b[i] =  1.0 + 0.5 * dt * (sig2 / (dS * dS) + r);
        c[i] = -0.25 * dt * (sig2 / (dS * dS) + r * Si / dS);
    }

    for (int n = N - 1; n >= 0; --n) {
        Vold = V;
        double t = n * dt;
        // PSOR iterations
        for (int iter = 0; iter < 2000; ++iter) {
            double maxErr = 0.0;
            for (int i = 1; i < M; ++i) {
                double rhs = -a[i]*Vold[i-1] + (2 - b[i])*Vold[i] - c[i]*Vold[i+1];
                double Vnew = (rhs - a[i]*V[i-1] - c[i]*V[i+1]) / b[i];
                Vnew = V[i] + omega * (Vnew - V[i]);
                Vnew = std::max(Vnew, K - i * dS);  // early exercise constraint
                maxErr = std::max(maxErr, std::abs(Vnew - V[i]));
                V[i] = Vnew;
            }
            if (maxErr < 1e-8) break;
        }
        V[0] = K;  // deep ITM boundary
        V[M] = 0;
    }
    return V;
}`,
    explanation:
      "American options cannot be priced by the Black-Scholes formula; the early-exercise constraint transforms the problem into a linear complementarity problem (LCP). PSOR solves this by iterating the SOR update and projecting each node onto the payoff floor (max(K-S, V_sor)). Omega > 1 is over-relaxation for faster convergence. Implicit schemes avoid stability constraints on dt vs dS².",
  },
  {
    id: "cpp-20260711-b1-ytm-newton",
    language: "cpp",
    title: "Bond YTM Newton-Raphson Solver",
    tag: "fixed-income",
    code: `#include <vector>
#include <cmath>
#include <stdexcept>

// Dirty price of bond given yield y (semi-annual coupon convention)
double bond_price(double y, const std::vector<double>& cashflows,
                  const std::vector<double>& times) {
    double pv = 0.0;
    for (size_t i = 0; i < cashflows.size(); ++i)
        pv += cashflows[i] / std::pow(1.0 + y / 2.0, 2.0 * times[i]);
    return pv;
}

// Duration (dP/dy) — analytic derivative for Newton step
double bond_duration_dPdy(double y, const std::vector<double>& cashflows,
                           const std::vector<double>& times) {
    double d = 0.0;
    for (size_t i = 0; i < cashflows.size(); ++i)
        d -= cashflows[i] * times[i] /
             std::pow(1.0 + y / 2.0, 2.0 * times[i] + 1.0);
    return d;
}

// Solve YTM via Newton-Raphson
double ytm(double dirty_price, const std::vector<double>& cashflows,
           const std::vector<double>& times, double y0 = 0.05) {
    double y = y0;
    for (int i = 0; i < 100; ++i) {
        double f  = bond_price(y, cashflows, times) - dirty_price;
        double df = bond_duration_dPdy(y, cashflows, times);
        double dy = f / df;
        y -= dy;
        if (std::abs(dy) < 1e-12) return y;
    }
    throw std::runtime_error("YTM did not converge");
}`,
    explanation:
      "YTM is the internal rate of return of bond cash flows; there is no closed form, so Newton-Raphson is used. The derivative dP/dy is the modified duration (negated). Semi-annual convention halves the annual yield per period and doubles the number of periods. Convergence is quadratic (doubles correct digits each iteration), typically <10 iterations for realistic inputs.",
  },
  {
    id: "cpp-20260711-b1-digital-option",
    language: "cpp",
    title: "Cash-or-Nothing Digital Option",
    tag: "derivatives",
    code: `#include <cmath>

// Standard normal CDF (Abramowitz & Stegun approximation)
double norm_cdf(double x) {
    static const double a1=0.319381530, a2=-0.356563782,
                        a3=1.781477937, a4=-1.821255978, a5=1.330274429;
    double t = 1.0 / (1.0 + 0.2316419 * std::abs(x));
    double poly = t*(a1+t*(a2+t*(a3+t*(a4+t*a5))));
    double val = 1.0 - (1.0/std::sqrt(2*M_PI)) * std::exp(-0.5*x*x) * poly;
    return x >= 0 ? val : 1.0 - val;
}

double norm_pdf(double x) {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * M_PI);
}

// Cash-or-nothing call: pays Q if S_T > K
struct DigitalResult { double price, delta, gamma; };

DigitalResult cash_or_nothing_call(
    double S, double K, double r, double q, double sigma, double T, double Q = 1.0)
{
    double sqT  = std::sqrt(T);
    double d2   = (std::log(S / K) + (r - q - 0.5*sigma*sigma)*T) / (sigma * sqT);
    double disc = std::exp(-r * T);

    double price = Q * disc * norm_cdf(d2);
    double delta = Q * disc * norm_pdf(d2) / (S * sigma * sqT);
    // Gamma is large near K at expiry — extreme pin risk
    double gamma = -Q * disc * norm_pdf(d2) * d2 / (S*S * sigma*sigma * T);
    return {price, delta, gamma};
}`,
    explanation:
      "A cash-or-nothing call pays a fixed amount Q if the terminal stock price exceeds K. In risk-neutral terms the price is Q·e^(-rT)·N(d2). The delta is large near the barrier (high pin risk), and gamma flips sign at K. These are common in structured products and binary option markets. The discontinuous payoff makes delta-hedging near expiry costly ('gap risk').",
  },
  {
    id: "cpp-20260711-b1-chooser-option",
    language: "cpp",
    title: "Simple Chooser Option Pricing",
    tag: "derivatives",
    code: `#include <cmath>

// norm_cdf omitted for brevity — use the standard Abramowitz approximation
double norm_cdf(double x);

// Simple chooser: at T_c, holder picks the better of a call or put
// both struck at K with maturity T (T > T_c)
double chooser_price(
    double S, double K, double r, double q, double sigma,
    double T_c, double T)
{
    // Decompose: chooser = call(T) + put(T_c) on fwd-adjusted strike
    // Price = C(S, K, r, q, sigma, T) + P(S, K*, r, q, sigma, T_c)
    // where K* = K * exp(-(r-q)*(T - T_c))
    auto bs_call = [&](double s, double k, double t) {
        double sqt = std::sqrt(t);
        double d1 = (std::log(s/k) + (r - q + 0.5*sigma*sigma)*t) / (sigma*sqt);
        double d2 = d1 - sigma * sqt;
        return s * std::exp(-q*t) * norm_cdf(d1) - k * std::exp(-r*t) * norm_cdf(d2);
    };
    auto bs_put = [&](double s, double k, double t) {
        double sqt = std::sqrt(t);
        double d1 = (std::log(s/k) + (r - q + 0.5*sigma*sigma)*t) / (sigma*sqt);
        double d2 = d1 - sigma * sqt;
        return k * std::exp(-r*t) * norm_cdf(-d2) - s * std::exp(-q*t) * norm_cdf(-d1);
    };
    double K_star = K * std::exp(-(r - q) * (T - T_c));
    return bs_call(S, K, T) + bs_put(S, K_star, T_c);
}`,
    explanation:
      "A chooser option grants the right to decide (at T_c) whether to hold a call or put expiring at T. The decomposition result: chooser = call(T) + put on forward-adjusted strike K* expiring at T_c. This follows from put-call parity applied at the choice date. Choosers are used in event-driven strategies where direction is uncertain but volatility is expected.",
  },
  {
    id: "cpp-20260711-b1-soa-orders",
    language: "cpp",
    title: "Struct of Arrays vs Array of Structs for Orders",
    tag: "low-latency",
    code: `#include <vector>
#include <numeric>
#include <cstdint>

// ----- Array of Structs (AoS) — typical OOP layout -----
struct OrderAoS {
    uint64_t id;
    double   price;
    uint32_t qty;
    uint8_t  side;   // 0=buy, 1=sell
    char     symbol[8];
};
// Iterating over just price: loads full 32-byte struct each time
// Cache line holds only 2 orders — poor cache utilisation for analytics

// ----- Struct of Arrays (SoA) — SIMD/vectorisation-friendly -----
struct OrderBookSoA {
    std::vector<uint64_t> ids;
    std::vector<double>   prices;
    std::vector<uint32_t> qtys;
    std::vector<uint8_t>  sides;

    void add(uint64_t id, double price, uint32_t qty, uint8_t side) {
        ids.push_back(id);
        prices.push_back(price);
        qtys.push_back(qty);
        sides.push_back(side);
    }

    // VWAP: compiler auto-vectorises this with SSE/AVX
    double vwap() const {
        double wsum = 0.0, qsum = 0.0;
        for (size_t i = 0; i < prices.size(); ++i) {
            wsum += prices[i] * qtys[i];
            qsum += qtys[i];
        }
        return wsum / qsum;
    }
};

// Hybrid: use AoS for insertion/lookup, SoA for batch analytics
// Columnar databases (Parquet, Arrow) use SoA permanently`,
    explanation:
      "SoA improves cache efficiency for analytics that access one field across many records. A cache line (64 bytes) holds 8 doubles, so looping over prices[] fetches 8 records per line vs 2 with AoS. SIMD auto-vectorisation requires contiguous same-type data. The tradeoff: SoA complicates single-record access/insertion. Columnar stores (Apache Arrow) adopt SoA globally.",
  },
  {
    id: "cpp-20260711-b1-cir-mc",
    language: "cpp",
    title: "CIR Short-Rate Monte Carlo (Full Truncation)",
    tag: "derivatives",
    code: `#include <vector>
#include <cmath>
#include <random>

// Cox-Ingersoll-Ross short-rate model: dr = k(theta-r)dt + sigma*sqrt(r)*dW
// Full-truncation Euler: r_next = max(r + k(theta-r)dt + sigma*sqrt(max(r,0))*dW, 0)
// Avoids negative rates from discretisation

double cir_bond_mc(
    double r0, double kappa, double theta, double sigma,
    double T, int N = 500, int M = 100'000, unsigned seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> dZ;
    double dt  = T / N;
    double sqdt = std::sqrt(dt);
    double sum = 0.0;

    for (int sim = 0; sim < M; ++sim) {
        double r = r0;
        double integral = 0.0;  // sum of r*dt (for discount)
        for (int n = 0; n < N; ++n) {
            double r_pos = std::max(r, 0.0);
            r += kappa * (theta - r_pos) * dt + sigma * std::sqrt(r_pos) * dZ(rng) * sqdt;
            r  = std::max(r, 0.0);       // full truncation
            integral += r * dt;
        }
        sum += std::exp(-integral);
    }
    return sum / M;
}`,
    explanation:
      "The CIR model guarantees positive rates analytically when 2κθ ≥ σ² (Feller condition), but Euler discretisation can violate this. Full truncation replaces negative r with 0 in both the drift and diffusion before advancing, keeping rates non-negative. The discount factor is exp(-∫r dt) approximated by summing r·dt along each path. Closed-form bond prices exist but MC extends to path-dependent instruments.",
  },
  {
    id: "cpp-20260711-b1-delta-hedge-sim",
    language: "cpp",
    title: "Discrete Delta Hedging P&L Simulation",
    tag: "derivatives",
    code: `#include <vector>
#include <cmath>
#include <random>

double norm_cdf(double x);
double bs_delta(double S, double K, double r, double sigma, double T, bool call = true);
double bs_price(double S, double K, double r, double sigma, double T, bool call = true);

// Simulate hedging error of a short call position
// Hedge at N discrete intervals; residual P&L = gamma*vol*sqrt(dt) noise
double delta_hedge_pnl(
    double S0, double K, double r, double sigma, double T,
    int N, unsigned seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> dZ;
    double dt    = T / N;
    double sqdt  = std::sqrt(dt);
    double S     = S0;
    double prem  = bs_price(S0, K, r, sigma, T, true);    // premium received
    double delta = bs_delta(S0, K, r, sigma, T, true);     // shares held

    double cash  = prem - delta * S;   // cash account (short call, long delta shares)

    for (int i = 1; i <= N; ++i) {
        double dW = dZ(rng) * sqdt;
        S *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*dW);
        double tau = T - i * dt;
        cash *= std::exp(r * dt);      // accrue interest on cash

        double new_delta = (tau > 0) ? bs_delta(S, K, r, sigma, tau, true) : (S > K ? 1.0 : 0.0);
        cash -= (new_delta - delta) * S;  // rebalancing cost
        delta = new_delta;
    }
    double payoff = std::max(S - K, 0.0);
    return cash + delta * S - payoff;   // final hedging error
}`,
    explanation:
      "Discrete hedging introduces tracking error proportional to gamma × realised vol × sqrt(dt). The cash account earns the risk-free rate; rebalancing costs adjust the cash position each period. The terminal P&L measures how well the hedge replicated the short call payoff. Averaging over many seeds reveals the distribution of hedging error — key for understanding gamma/vega risk in practice.",
  },
  {
    id: "cpp-20260711-b1-milstein-gbm",
    language: "cpp",
    title: "Milstein Discretisation for GBM",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <vector>

// Milstein scheme for GBM: dS = mu*S*dt + sigma*S*dW
// Milstein adds correction term: + 0.5*sigma^2*S*(dW^2 - dt)
// Reduces strong order from 0.5 (Euler) to 1.0

double milstein_call_price(
    double S0, double K, double r, double sigma, double T,
    int N = 252, int M = 100'000, unsigned seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> dZ;
    double dt    = T / N;
    double sqdt  = std::sqrt(dt);
    double disc  = std::exp(-r * T);
    double sum   = 0.0;

    for (int sim = 0; sim < M; ++sim) {
        double S = S0;
        for (int n = 0; n < N; ++n) {
            double dW = dZ(rng) * sqdt;
            // Milstein: add 0.5*sigma^2*S*(dW^2 - dt)
            S += r * S * dt
               + sigma * S * dW
               + 0.5 * sigma * sigma * S * (dW*dW - dt);
            // Ensure non-negative (can go negative with large vol + large dt)
            S = std::max(S, 0.0);
        }
        sum += std::max(S - K, 0.0);
    }
    return disc * sum / M;
}`,
    explanation:
      "Euler-Maruyama discretises dS ≈ μS·dt + σS·dW with strong order 0.5. Milstein adds the Itô correction (the σ∂σ/∂S term) making it second-order for GBM, reducing bias for large dt. For GBM the correction is 0.5σ²S(dW²−dt). In practice, log-space Euler-Maruyama (exact for GBM) is often preferred, but Milstein matters for stochastic-vol models where log-transform isn't exact.",
  },
  {
    id: "cpp-20260711-b1-stratified-mc",
    language: "cpp",
    title: "Stratified Sampling Monte Carlo",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <vector>

// Stratified sampling: divide [0,1] into M equal strata,
// draw one uniform from each, map to normal via quantile
double bs_call_stratified(
    double S0, double K, double r, double sigma, double T,
    int M = 10'000, unsigned seed = 42)
{
    // Beasley-Springer-Moro normal quantile (simplified rational approx)
    auto quantile_normal = [](double u) -> double {
        // Rational approximation (Abramowitz & Stegun 26.2.17)
        static const double a[] = {2.515517, 0.802853, 0.010328};
        static const double b[] = {1.432788, 0.189269, 0.001308};
        double p = (u < 0.5) ? u : 1.0 - u;
        double t = std::sqrt(-2.0 * std::log(p));
        double numer = a[0] + t*(a[1] + t*a[2]);
        double denom = 1.0 + t*(b[0] + t*(b[1] + t*b[2]));
        double z = t - numer / denom;
        return (u < 0.5) ? -z : z;
    };

    std::mt19937_64 rng(seed);
    std::uniform_real_distribution<double> U(0.0, 1.0);
    double disc = std::exp(-r * T);
    double sqT  = std::sqrt(T);
    double logS0_adj = std::log(S0) + (r - 0.5*sigma*sigma)*T;
    double sum = 0.0;

    for (int i = 0; i < M; ++i) {
        // Sample uniformly within stratum i
        double u = (i + U(rng)) / M;
        double z = quantile_normal(u);
        double ST = std::exp(logS0_adj + sigma * sqT * z);
        sum += std::max(ST - K, 0.0);
    }
    return disc * sum / M;
}`,
    explanation:
      "Stratified sampling ensures one random draw per stratum of [0,1], guaranteeing coverage across the full distribution. This reduces variance compared to pure MC (where clustering can leave regions unsampled). For M strata, variance is reduced by roughly 1/M in the tails. The quantile function maps uniform draws to normal variates. Pairs with antithetic variates for further variance reduction.",
  },
  {
    id: "cpp-20260711-b1-merton-jump-mc",
    language: "cpp",
    title: "Merton Jump-Diffusion Monte Carlo Pricer",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>

double norm_cdf(double x);

// Merton jump-diffusion: mix over Poisson-weighted BS prices
// S_T = S_0 * exp((mu - 0.5*sigma^2 - lambda*kappa)*T + sigma*W_T) * prod(jump_factors)
// Closed form: sum_{n=0}^{inf} P(N=n) * BS(S0, K, r_n, sigma_n, T)
double merton_call_closed(
    double S, double K, double r, double sigma, double T,
    double lambda, double mu_J, double sigma_J, int terms = 20)
{
    auto bs_call = [](double s, double k, double rr, double sv, double t) {
        double sqt = std::sqrt(t);
        double d1 = (std::log(s/k) + (rr + 0.5*sv*sv)*t) / (sv*sqt);
        double d2 = d1 - sv * sqt;
        // norm_cdf elided — use standard approx
        return s * 0.0 /* norm_cdf(d1) */ - k * std::exp(-rr*t) * 0.0 /* norm_cdf(d2) */;
    };

    double kappa   = std::exp(mu_J + 0.5*sigma_J*sigma_J) - 1.0;  // mean jump size
    double lambda_p = lambda * (1.0 + kappa);                       // risk-neutral jump rate
    double sum      = 0.0;
    double log_fact = 0.0;   // log(n!)
    for (int n = 0; n < terms; ++n) {
        double pn   = std::exp(-lambda_p * T + n * std::log(lambda_p * T) - log_fact);
        double r_n  = r - lambda * kappa + n * (mu_J + 0.5*sigma_J*sigma_J) / T;
        double sv_n = std::sqrt(sigma*sigma + n * sigma_J*sigma_J / T);
        sum += pn * bs_call(S, K, r_n, sv_n, T);
        if (n > 0) log_fact += std::log(static_cast<double>(n + 1));
    }
    return sum;
}`,
    explanation:
      "Merton's 1976 jump-diffusion model adds Poisson jumps (lognormal size) to GBM. The closed-form price is an infinite series of Black-Scholes prices weighted by Poisson probabilities for n jumps. Each term has its own risk-adjusted drift r_n and total vol sigma_n. Truncating at ~20 terms gives sufficient accuracy for realistic parameters. The model explains the volatility smile seen in short-dated options.",
  },
  {
    id: "cpp-20260711-b1-black76-caplet",
    language: "cpp",
    title: "Black-76 Caplet Pricing",
    tag: "fixed-income",
    code: `#include <cmath>

double norm_cdf(double x);  // standard approx

// Black-76 caplet: pays max(L_k - K, 0) * delta * N at T_{k+1}
// L_k is the LIBOR/SOFR fixing at T_k, delta = accrual fraction
struct CapletResult { double price, delta_rate, vega; };

CapletResult black76_caplet(
    double F,      // forward rate at T_k
    double K,      // cap strike
    double sigma,  // Black lognormal vol
    double T,      // fixing date (option expiry = T_k)
    double delta,  // accrual period (e.g. 0.25 for 3M)
    double df,     // discount factor to T_{k+1}
    double N = 1e6 // notional
) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(F / K) + 0.5*sigma*sigma*T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    double Nd1 = norm_cdf(d1), Nd2 = norm_cdf(d2);

    double price      = N * delta * df * (F * Nd1 - K * Nd2);
    double delta_rate = N * delta * df * Nd1;               // dPrice/dF
    double vega       = N * delta * df * F * std::sqrt(T)
                        * std::exp(-0.5*d1*d1) / std::sqrt(2*M_PI) / 100.0;  // per 1 vol point
    return {price, delta_rate, vega};
}`,
    explanation:
      "Black-76 prices interest rate derivatives by treating the forward rate as lognormal. A caplet is a call on the period LIBOR/SOFR rate: at fixing T_k, if LIBOR exceeds the strike K, the holder receives (LIBOR−K)·δ·N paid at T_k+1. The discount factor df applies to the T_k+1 payment. A cap is a portfolio of caplets across successive periods. Inputs are stripped from the volatility cube.",
  },
  {
    id: "cpp-20260711-b1-fold-greeks",
    language: "cpp",
    title: "C++17 Fold Expressions for Greeks Aggregation",
    tag: "modern-cpp",
    code: `#include <tuple>
#include <cmath>

// Individual instrument Greek contribution
struct Greeks {
    double delta = 0, gamma = 0, vega = 0, theta = 0, rho = 0;

    Greeks operator+(const Greeks& o) const {
        return {delta+o.delta, gamma+o.gamma, vega+o.vega, theta+o.theta, rho+o.rho};
    }
};

// Variadic aggregation via C++17 fold over operator+
template<typename... Gs>
Greeks aggregate(Gs&&... greeks) {
    return (Greeks{} + ... + greeks);  // left fold
}

// Scale a position's Greeks by quantity (templates avoid repetition)
template<typename G>
G scale(G g, double qty) {
    g.delta *= qty; g.gamma *= qty; g.vega *= qty;
    g.theta *= qty; g.rho   *= qty;
    return g;
}

// Usage example
Greeks portfolio_greeks() {
    Greeks g1{0.5, 0.02, 0.12, -0.03, 0.01};
    Greeks g2{-0.3, 0.015, 0.08, -0.02, -0.005};
    Greeks g3{0.8, 0.01, 0.05, -0.04, 0.015};
    // Aggregate N positions without manual loops
    return aggregate(scale(g1, 100.0), scale(g2, 200.0), scale(g3, -50.0));
}`,
    explanation:
      "C++17 fold expressions collapse a variadic parameter pack using a binary operator. `(init + ... + pack)` is a left fold equivalent to `((init + a1) + a2) + ... + aN`. This lets portfolio aggregation remain a single expression regardless of the number of positions, with no heap allocation. The compiler unrolls the fold into sequential additions — zero-cost abstraction over a manual loop.",
  },
  {
    id: "cpp-20260711-b1-structured-bindings",
    language: "cpp",
    title: "C++17 Structured Bindings for Order Decomposition",
    tag: "modern-cpp",
    code: `#include <tuple>
#include <map>
#include <string>
#include <cstdint>

struct Order {
    uint64_t    id;
    std::string symbol;
    double      price;
    uint32_t    qty;
    char        side;   // 'B' or 'S'
};

// Enable structured bindings for Order via get<> customisation
template<size_t I> auto get(const Order& o) {
    if constexpr (I == 0) return o.id;
    if constexpr (I == 1) return o.symbol;
    if constexpr (I == 2) return o.price;
    if constexpr (I == 3) return o.qty;
}

namespace std {
    template<> struct tuple_size<Order> : integral_constant<size_t, 4> {};
    template<size_t I> struct tuple_element<I, Order> {
        using type = decltype(::get<I>(Order{}));
    };
}

// Structured binding usage
void process_orders(const std::map<uint64_t, Order>& book) {
    for (const auto& [order_id, order] : book) {
        const auto& [id, sym, px, qty] = order;
        // No manual .id, .symbol etc. — names document intent
        if (px > 100.0 && qty > 500)
            /* risk check */;
    }
}`,
    explanation:
      "Structured bindings (C++17) destructure aggregates, tuples, and pairs in one declaration. Custom types need tuple_size, tuple_element, and get<I> specialisations. This pattern is common in trading systems for iterating price levels, decomposing FIX message fields, and binding map entries without verbose .first/.second. The compiler resolves everything at compile time — no runtime overhead.",
  },
  {
    id: "cpp-20260711-b1-optional-validation",
    language: "cpp",
    title: "std::optional Order Validation Pipeline",
    tag: "modern-cpp",
    code: `#include <optional>
#include <string>
#include <functional>
#include <cstdint>

struct Order {
    uint64_t id;
    double   price;
    uint32_t qty;
    char     side;
    std::string symbol;
};

// Monadic pipeline: each step returns optional, short-circuits on nullopt
using MaybeOrder = std::optional<Order>;

MaybeOrder validate_positive_price(MaybeOrder o) {
    if (!o || o->price <= 0.0) return std::nullopt;
    return o;
}
MaybeOrder validate_nonzero_qty(MaybeOrder o) {
    if (!o || o->qty == 0) return std::nullopt;
    return o;
}
MaybeOrder validate_symbol(MaybeOrder o) {
    if (!o || o->symbol.empty() || o->symbol.size() > 6) return std::nullopt;
    return o;
}

// C++23 and_then would be cleaner, but this compiles on C++17+
MaybeOrder validate(Order raw) {
    return validate_symbol(
               validate_nonzero_qty(
                   validate_positive_price(MaybeOrder{raw})));
}

bool submit(Order raw) {
    auto valid = validate(raw);
    if (!valid) return false;   // rejected
    // send to exchange gateway
    return true;
}`,
    explanation:
      "std::optional models a value that may be absent, replacing error codes and out-parameters. Chaining validators via nested calls creates a monadic pipeline: any failed stage propagates nullopt through all subsequent calls without branching. C++23 adds .and_then() for cleaner chaining. This pattern is common in order ingestion, position parsing, and configuration loading where partial data must be rejected cleanly.",
  },
  {
    id: "cpp-20260711-b1-dispatch-table",
    language: "cpp",
    title: "Function Pointer Dispatch Table for Messages",
    tag: "low-latency",
    code: `#include <array>
#include <cstdint>
#include <stdexcept>

// Exchange protocol message types
enum class MsgType : uint8_t {
    NewOrder    = 0,
    CancelOrder = 1,
    ExecutionReport = 2,
    OrderBook   = 3,
    COUNT
};

// Handler function signature
struct Context { /* gateway state */ };
using MsgHandler = void (*)(const uint8_t* data, size_t len, Context& ctx);

void handle_new_order(const uint8_t*, size_t, Context&)    { /* parse & send */ }
void handle_cancel   (const uint8_t*, size_t, Context&)    { /* parse & cancel */ }
void handle_exec     (const uint8_t*, size_t, Context&)    { /* update pos */ }
void handle_book     (const uint8_t*, size_t, Context&)    { /* update depth */ }

// Compile-time dispatch table — O(1) vs O(n) switch chain
static constexpr std::array<MsgHandler, static_cast<size_t>(MsgType::COUNT)> dispatch = {
    handle_new_order,
    handle_cancel,
    handle_exec,
    handle_book,
};

void dispatch_message(uint8_t type, const uint8_t* data, size_t len, Context& ctx) {
    if (type >= static_cast<uint8_t>(MsgType::COUNT))
        throw std::runtime_error("unknown message type");
    dispatch[type](data, len, ctx);   // one indirect call, branch-predictor-friendly
}`,
    explanation:
      "A dispatch table replaces a switch statement with a direct array index, reducing branch prediction pressure and compiling to a single indirect call instruction. For market-data feeds with a fixed message type space, the array fits in L1 cache. The pattern is also used for FIX tag processors and binary protocol parsers. The constexpr annotation allows zero-overhead initialisation.",
  },
  {
    id: "cpp-20260711-b1-thread-local-rng",
    language: "cpp",
    title: "thread_local Mersenne Twister for Parallel MC",
    tag: "low-latency",
    code: `#include <random>
#include <cmath>
#include <vector>
#include <thread>
#include <atomic>

// Each thread holds its own RNG — eliminates lock contention
thread_local std::mt19937_64 tl_rng{std::random_device{}()};
thread_local std::normal_distribution<double> tl_norm;

double mc_option_thread(double S0, double K, double r, double sigma,
                        double T, int paths_per_thread) {
    double dt   = T;  // single step for simplicity
    double logS = std::log(S0) + (r - 0.5*sigma*sigma)*dt;
    double sig_sqdt = sigma * std::sqrt(dt);
    double sum  = 0.0;
    for (int i = 0; i < paths_per_thread; ++i) {
        double ST = std::exp(logS + sig_sqdt * tl_norm(tl_rng));
        sum += std::max(ST - K, 0.0);
    }
    return sum;
}

double parallel_mc_call(double S0, double K, double r, double sigma, double T,
                        int total = 1'000'000) {
    int nt    = std::thread::hardware_concurrency();
    int batch = total / nt;
    std::vector<double> results(nt);
    std::vector<std::thread> threads;
    for (int t = 0; t < nt; ++t)
        threads.emplace_back([&, t]{ results[t] = mc_option_thread(S0, K, r, sigma, T, batch); });
    for (auto& th : threads) th.join();
    double total_sum = 0.0;
    for (double r2 : results) total_sum += r2;
    return std::exp(-r * T) * total_sum / total;
}`,
    explanation:
      "thread_local gives each thread its own instance of the RNG — no mutex, no false sharing. The OS seeds each with random_device for independent streams (though for reproducibility, seed from a splittable PRNG like SFC64). This pattern is fundamental for parallelising MC simulations: linear speedup with core count, no synchronisation overhead. Production systems often pre-generate random numbers in parallel and store in ring buffers.",
  },
  {
    id: "cpp-20260711-b1-seqlock",
    language: "cpp",
    title: "Seqlock for Wait-Free Market Data Reads",
    tag: "low-latency",
    code: `#include <atomic>
#include <cstdint>

// Seqlock: writer increments seq before+after; readers retry if seq changed mid-read
// Zero reader overhead when no write in progress
struct MarketData {
    double   bid, ask;
    uint32_t bid_qty, ask_qty;
    int64_t  timestamp_ns;
};

struct SeqlockQuote {
    std::atomic<uint32_t> seq{0};
    MarketData data;

    void write(const MarketData& md) {
        seq.fetch_add(1, std::memory_order_release);   // odd = write in progress
        data = md;
        std::atomic_thread_fence(std::memory_order_release);
        seq.fetch_add(1, std::memory_order_release);   // even = done
    }

    // Returns true on clean read
    bool try_read(MarketData& out) const {
        uint32_t s1 = seq.load(std::memory_order_acquire);
        if (s1 & 1) return false;   // write in progress
        out = data;
        std::atomic_thread_fence(std::memory_order_acquire);
        uint32_t s2 = seq.load(std::memory_order_acquire);
        return s1 == s2;
    }

    MarketData read() const {
        MarketData out;
        while (!try_read(out)) { /* spin */ }
        return out;
    }
};`,
    explanation:
      "A seqlock allows one writer and many readers with no reader-side lock. The sequence counter is odd during writes; readers snapshot the counter before and after copying the data — if the values differ or the first is odd, a write happened mid-read and the reader retries. This is wait-free for reads when no concurrent write occurs, common for market-data feeds with one publisher and many strategy threads.",
  },
  {
    id: "cpp-20260711-b1-horner-constexpr",
    language: "cpp",
    title: "constexpr Horner's Method Polynomial Evaluation",
    tag: "modern-cpp",
    code: `#include <array>
#include <cstddef>

// Horner's method: evaluate p(x) = a0 + a1*x + a2*x^2 + ... + an*x^n
// as a0 + x*(a1 + x*(a2 + x*(...)))  — n multiplies vs 2n with naive
template<typename T, size_t N>
constexpr T horner(T x, const std::array<T, N>& coeffs) {
    T result = coeffs[N - 1];
    for (int i = static_cast<int>(N) - 2; i >= 0; --i)
        result = result * x + coeffs[i];
    return result;
}

// Compile-time polynomial at a known x
constexpr double eval_at_compile_time() {
    // e.g. Black-Scholes norm_cdf rational approximation coefficients
    constexpr std::array<double, 6> p = {
        0.0, 0.319381530, -0.356563782, 1.781477937, -1.821255978, 1.330274429
    };
    return horner(0.5, p);
}

// Runtime usage: implied vol smile polynomial fit
double smile_vol(double moneyness, const std::array<double, 5>& fit) {
    return horner(moneyness, fit);
}

// Black-76 vol surface grid evaluation (compile-time or runtime)
void calibrate_surface() {
    constexpr double atm_eval = eval_at_compile_time();
    static_assert(atm_eval > 0.0, "polynomial must be positive at ATM");
}`,
    explanation:
      "Horner's method evaluates an nth-degree polynomial using only n multiplications and n additions (vs ~2n for naive). Marking it constexpr allows the compiler to evaluate polynomial fits at compile time when inputs are known — zero runtime cost for fixed-grid lookups. Common uses: norm_cdf approximation coefficients, smile surface parameterisation (SVI, SABR calibration output), and fixed-point payoff schedules.",
  },
  {
    id: "cpp-20260711-b1-csv-tokenizer",
    language: "cpp",
    title: "Fast CSV Tokenizer with string_view",
    tag: "low-latency",
    code: `#include <string_view>
#include <vector>
#include <charconv>
#include <stdexcept>

// Zero-copy CSV tokeniser: returns views into the original buffer
std::vector<std::string_view> tokenise_csv(std::string_view line, char delim = ',') {
    std::vector<std::string_view> tokens;
    tokens.reserve(16);
    size_t start = 0;
    while (true) {
        size_t end = line.find(delim, start);
        tokens.push_back(line.substr(start, end == std::string_view::npos ? end : end - start));
        if (end == std::string_view::npos) break;
        start = end + 1;
    }
    return tokens;
}

// Parse a tick record line: "ts,bid,ask,qty"
struct Tick { int64_t ts; double bid, ask; uint32_t qty; };

Tick parse_tick(std::string_view line) {
    auto toks = tokenise_csv(line);
    if (toks.size() < 4) throw std::runtime_error("bad tick");
    Tick t{};
    std::from_chars(toks[0].begin(), toks[0].end(), t.ts);
    // from_chars for double (C++17, fast, no locale):
    std::from_chars(toks[1].begin(), toks[1].end(), t.bid);
    std::from_chars(toks[2].begin(), toks[2].end(), t.ask);
    std::from_chars(toks[3].begin(), toks[3].end(), t.qty);
    return t;
}`,
    explanation:
      "string_view is a non-owning reference to a contiguous char sequence — tokenisation returns views into the original buffer with no allocation. std::from_chars is locale-independent and significantly faster than strtod/sscanf for numeric parsing. This matters when processing millions of tick records in backtesting. Avoid std::string construction for tokens that are only read once.",
  },
  {
    id: "cpp-20260711-b1-covered-interest",
    language: "cpp",
    title: "Covered Interest Parity & FX Forward Pricing",
    tag: "fixed-income",
    code: `#include <cmath>
#include <stdexcept>

// Covered Interest Parity: F = S * exp((r_d - r_f) * T)
// No-arbitrage condition between spot FX, forward, and interest rate differentials

struct FXForward {
    double spot;         // S: units of domestic per 1 foreign
    double r_domestic;  // continuously compounded
    double r_foreign;
    double T;           // years to settlement

    double fair_forward() const {
        return spot * std::exp((r_domestic - r_foreign) * T);
    }

    // Value to long forward position (receive foreign, pay domestic)
    double mark_to_market(double current_spot, double contracted_forward) const {
        double current_fwd = current_spot * std::exp((r_domestic - r_foreign) * T);
        return (current_fwd - contracted_forward) * std::exp(-r_domestic * T);
    }

    // Implied foreign rate from quoted forward
    double implied_foreign_rate(double quoted_forward) const {
        return r_domestic - std::log(quoted_forward / spot) / T;
    }

    // Basis: deviation of quoted forward from CIP fair value (in bps)
    double cip_basis_bps(double quoted_forward) const {
        return (implied_foreign_rate(quoted_forward) - r_foreign) * 10000.0;
    }
};`,
    explanation:
      "Covered interest parity states the forward rate equals S·exp((r_d−r_f)T) — if not, an arbitrage exists by borrowing in one currency, converting spot, investing in the other, and locking in the forward. Post-2008 CIP frequently fails due to balance-sheet constraints: the FX basis (deviation in bps) reflects credit/liquidity premium demanded for USD funding. CIP basis is a key metric in cross-currency macro strategies.",
  },
  {
    id: "cpp-20260711-b1-bk-short-rate",
    language: "cpp",
    title: "Black-Karasinski Log-Normal Short-Rate MC",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <vector>

// Black-Karasinski: d(ln r) = (theta(t) - a*ln(r)) dt + sigma dW
// Equivalently: r_t = exp(x_t), dx = (theta - a*x) dt + sigma dW
// Ensures r > 0 always; no closed-form bond price — use tree or MC

double bk_bond_price_mc(
    double r0,     // initial short rate
    double a,      // mean-reversion speed
    double sigma,  // vol of log rate
    double theta,  // long-run log-rate level (calibrated to fit curve)
    double T,      int N = 500, int M = 50'000, unsigned seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> dZ;
    double dt    = T / N;
    double sqdt  = std::sqrt(dt);
    double x0    = std::log(r0);
    double sum   = 0.0;

    for (int sim = 0; sim < M; ++sim) {
        double x = x0, integral = 0.0;
        for (int n = 0; n < N; ++n) {
            x += (theta - a * x) * dt + sigma * sqdt * dZ(rng);
            integral += std::exp(x) * dt;   // r = exp(x)
        }
        sum += std::exp(-integral);
    }
    return sum / M;
}`,
    explanation:
      "The Black-Karasinski model logs the rate so r = exp(x) > 0 always, fixing the negative-rate issue of Vasicek. The x process is Ornstein-Uhlenbeck, so mean-reversion is preserved. The time-varying θ(t) is calibrated to the initial yield curve. Unlike Hull-White, no closed-form bond prices exist, so trinomial trees or MC are used. BK is popular for swaption smiles and callable bond pricing.",
  },
  {
    id: "cpp-20260711-b1-lock-free-seqnum",
    language: "cpp",
    title: "Lock-Free Sequence Number with fetch_add",
    tag: "low-latency",
    code: `#include <atomic>
#include <cstdint>
#include <array>

// Global order ID counter — contention-free on separate cache line
struct alignas(64) SeqNumCounter {
    std::atomic<uint64_t> counter{1};
    uint8_t _padding[56];   // push to own cache line

    uint64_t next() {
        return counter.fetch_add(1, std::memory_order_relaxed);
    }
    // Reserve a block of N IDs (e.g. for batch order submission)
    uint64_t next_block(uint64_t n) {
        return counter.fetch_add(n, std::memory_order_relaxed);
    }
};

// Per-type counters (order, cancel, allocation each have their own line)
struct IdBank {
    SeqNumCounter orders;
    SeqNumCounter cancels;
    SeqNumCounter allocs;
};

// Example: multi-threaded order submission without a mutex
static IdBank g_ids;

struct Order { uint64_t id; double price; uint32_t qty; };

Order make_order(double price, uint32_t qty) {
    return Order{ g_ids.orders.next(), price, qty };
}`,
    explanation:
      "fetch_add with memory_order_relaxed is the fastest atomic increment — no fence, just the hardware atomic operation (~5–10 ns on x86). Aligning the counter to a cache line (64 bytes) prevents false sharing with adjacent data. For block reservation, a single atomic add allocates N consecutive IDs without N individual increments. This pattern underpins order ID generation, fill sequence numbers, and ring-buffer write indices.",
  },
];
