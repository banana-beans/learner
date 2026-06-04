import type { Snippet } from "./types";

export const cppSnippets20260604B1: Snippet[] = [
  {
    id: "cpp-20260604-b1-crtp-static-poly",
    language: "cpp",
    title: "CRTP static polymorphism — zero-cost order type dispatch",
    tag: "templates",
    code: `#include <iostream>
#include <cstdint>

// CRTP: Base<Derived> calls Derived's method via static_cast.
// No vtable, no indirect call — the compiler inlines everything.
template <typename Derived>
struct Serializable {
    void serialize() const {
        static_cast<const Derived*>(this)->serialize_impl();
    }
    std::size_t byte_size() const {
        return static_cast<const Derived*>(this)->byte_size_impl();
    }
};

struct LimitOrder : Serializable<LimitOrder> {
    std::uint64_t id; double price; std::uint32_t qty;
    void serialize_impl() const {
        std::cout << "LimitOrder " << id << " @ " << price
                  << " x " << qty << "\\n";
    }
    std::size_t byte_size_impl() const { return sizeof(*this); }
};

struct MarketOrder : Serializable<MarketOrder> {
    std::uint64_t id; std::uint32_t qty;
    void serialize_impl() const {
        std::cout << "MarketOrder " << id << " x " << qty << "\\n";
    }
    std::size_t byte_size_impl() const { return sizeof(*this); }
};

// Template function works for any Serializable<T> — static dispatch.
template <typename Derived>
void log_order(const Serializable<Derived>& o) {
    o.serialize();
}

int main() {
    LimitOrder lo{1, 100.25, 500};
    MarketOrder mo{2, 300};
    log_order(lo);
    log_order(mo);
}`,
    explanation:
      "CRTP achieves static polymorphism: the base class template knows the exact derived type at compile time, so serialize_impl() is resolved without a vtable lookup and inlined. In HFT, CRTP is preferred for order types, serializers, and protocol adapters where the virtual-dispatch overhead of 1-3 ns per call accumulates over millions of orders per second.",
  },
  {
    id: "cpp-20260604-b1-variant-visit",
    language: "cpp",
    title: "std::variant + std::visit — type-safe market event multiplexer",
    tag: "modern",
    code: `#include <variant>
#include <iostream>
#include <cstdint>

struct Trade  { double price; std::uint32_t qty; char side; };
struct Quote  { double bid; double ask; std::uint32_t bid_qty; std::uint32_t ask_qty; };
struct Cancel { std::uint64_t order_id; };
struct Heartbeat {};

using MdEvent = std::variant<Trade, Quote, Cancel, Heartbeat>;

// Overload trick: construct a visitor from multiple lambdas.
template <typename... Ts>
struct overload : Ts... { using Ts::operator()...; };
template <typename... Ts> overload(Ts...) -> overload<Ts...>;

// Each lambda handles one event type — compiler errors on unhandled types.
void process(const MdEvent& ev) {
    std::visit(overload{
        [](const Trade& t) {
            std::cout << "TRADE " << t.price << " x " << t.qty
                      << " side=" << t.side << "\\n";
        },
        [](const Quote& q) {
            std::cout << "QUOTE " << q.bid << "/" << q.ask << "\\n";
        },
        [](const Cancel& c) {
            std::cout << "CANCEL id=" << c.order_id << "\\n";
        },
        [](const Heartbeat&) { /* no-op */ },
    }, ev);
}

int main() {
    MdEvent events[] = {
        Trade{100.25, 500, 'B'},
        Quote{100.24, 100.26, 5000, 3000},
        Cancel{42ULL},
        Heartbeat{},
    };
    for (const auto& e : events) process(e);
}`,
    explanation:
      "std::variant is a type-safe discriminated union: exactly one alternative is active at any time, preventing the undefined behaviour of C unions. std::visit with the overload idiom dispatches to the right lambda without virtual calls. Adding a new message type to MdEvent forces you to handle it in every visitor — exhaustiveness is enforced by the compiler.",
  },
  {
    id: "cpp-20260604-b1-seqlock",
    language: "cpp",
    title: "Seqlock — wait-free best-quote reader with one exclusive writer",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>

// Seqlock: many readers proceed without locks; writer serialised.
// Reader retries if seq changes during its read (writer was active).
// alignas(64): prevents false sharing with adjacent hot data.
struct alignas(64) BestQuoteSlot {
    std::atomic<std::uint32_t> seq{0};  // even = clean, odd = write-in-progress
    double bid = 0.0;
    double ask = 0.0;

    // Called by the single writer thread only.
    void write(double b, double a) noexcept {
        seq.fetch_add(1, std::memory_order_release);   // -> odd
        bid = b;
        ask = a;
        seq.fetch_add(1, std::memory_order_release);   // -> even
    }

    struct Quote { double bid, ask; };

    // Wait-free read: retries only on torn reads.
    Quote read() const noexcept {
        for (;;) {
            std::uint32_t s1 = seq.load(std::memory_order_acquire);
            if (s1 & 1u) continue;   // writer active — spin
            double b = bid, a = ask;
            std::atomic_thread_fence(std::memory_order_acquire);
            std::uint32_t s2 = seq.load(std::memory_order_relaxed);
            if (s1 == s2) return {b, a};  // consistent snapshot
        }
    }
};

int main() {
    BestQuoteSlot slot;
    slot.write(100.24, 100.26);
    auto [bid, ask] = slot.read();
    (void)bid; (void)ask;
}`,
    explanation:
      "A seqlock is the standard HFT primitive for publishing a best-quote that thousands of reader threads consume without locking. The key invariant: an odd sequence means a write is in progress, so readers spin rather than reading a torn value. Cache-line alignment prevents a reader on a different core from invalidating the writer's cache line.",
  },
  {
    id: "cpp-20260604-b1-mmap-tick-replay",
    language: "cpp",
    title: "Memory-mapped tick file — zero-syscall market data replay",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstdint>
#include <stdexcept>

// Pack to 24 bytes so every 2 ticks fit in one 64-byte cache line.
struct alignas(8) Tick {
    std::uint64_t ts_ns;   // exchange timestamp (ns since epoch)
    double        price;
    std::uint32_t qty;
    std::uint8_t  side;    // 0=bid, 1=ask
    std::uint8_t  flags;
    std::uint16_t pad;
};
static_assert(sizeof(Tick) == 24, "pack Tick to 24 bytes");

class TickReplay {
    void*         map_  = MAP_FAILED;
    std::size_t   sz_   = 0;
    int           fd_   = -1;
public:
    explicit TickReplay(const char* path) {
        fd_  = ::open(path, O_RDONLY);
        if (fd_ < 0) throw std::runtime_error("open failed");
        struct stat st;
        ::fstat(fd_, &st);
        sz_  = static_cast<std::size_t>(st.st_size);
        map_ = ::mmap(nullptr, sz_, PROT_READ,
                      MAP_PRIVATE | MAP_POPULATE, fd_, 0);
        if (map_ == MAP_FAILED) throw std::runtime_error("mmap failed");
        ::madvise(map_, sz_, MADV_SEQUENTIAL);   // prefetch ahead
    }
    ~TickReplay() {
        if (map_ != MAP_FAILED) ::munmap(map_, sz_);
        if (fd_ >= 0) ::close(fd_);
    }
    const Tick* begin() const noexcept {
        return static_cast<const Tick*>(map_);
    }
    const Tick* end()   const noexcept { return begin() + sz_ / sizeof(Tick); }
    TickReplay(const TickReplay&) = delete;
};
// for (const Tick& t : TickReplay("day.bin")) { process(t); }`,
    explanation:
      "MAP_POPULATE pre-faults all pages during mmap, and MADV_SEQUENTIAL instructs the kernel to read-ahead aggressively. Together they saturate disk bandwidth without read() syscalls — a 100 M tick replay runs faster than buffered fread because the kernel pipeline stays full. Struct packing to 24 bytes ensures two ticks always cohabit a cache line.",
  },
  {
    id: "cpp-20260604-b1-numa-affinity",
    language: "cpp",
    title: "NUMA CPU affinity — pin thread to socket-local core",
    tag: "performance",
    code: `#define _GNU_SOURCE
#include <pthread.h>
#include <sched.h>
#include <iostream>
#include <stdexcept>

// Pin the calling thread to a specific logical CPU.
// On a 2-socket NUMA server: cores 0-23 on socket 0, 24-47 on socket 1.
// The NIC queue and ring buffer should be NUMA-local to the receive thread.
void pin_to_core(int core) {
    cpu_set_t cs;
    CPU_ZERO(&cs);
    CPU_SET(core, &cs);
    if (::pthread_setaffinity_np(pthread_self(), sizeof(cs), &cs) != 0)
        throw std::runtime_error("pthread_setaffinity_np failed");
}

int current_cpu() noexcept { return ::sched_getcpu(); }

void verify_numa_local(int expected_core) {
    int actual = current_cpu();
    std::cout << "running on CPU " << actual
              << (actual == expected_core ? " [OK]" : " [MISMATCH]") << "\\n";
}

int main() {
    // NIC interrupts steered to CPU 3 -> pin receive thread there.
    pin_to_core(3);
    verify_numa_local(3);
    // Cross-socket memory access costs ~150 ns (QPI/UPI hop) vs ~30 ns local.
}`,
    explanation:
      "NUMA-local execution eliminates inter-socket interconnect (QPI/UPI) latency: a thread reading DRAM on its own socket sees ~30 ns access vs ~150 ns for remote memory. In HFT gateways, the NIC interrupt affinity, the kernel receive queue, and the market-data processing thread are all pinned to the same NUMA node to keep the hot path entirely local.",
  },
  {
    id: "cpp-20260604-b1-milstein",
    language: "cpp",
    title: "Milstein SDE scheme — strong order-1 convergence vs Euler's 0.5",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>

// Milstein (1975): adds 0.5 * sigma * sigma' * dt * (Z^2 - 1) correction.
// Strong convergence order 1 vs Euler's 0.5 — halves step count for same accuracy.
template <typename Drift, typename Diff, typename DiffDeriv>
std::vector<double> milstein(double x0, double T, int steps,
                              Drift mu, Diff sigma, DiffDeriv sigma_dx,
                              std::mt19937_64& rng)
{
    std::normal_distribution<> nd;
    double dt  = T / steps;
    double sdt = std::sqrt(dt);
    std::vector<double> path(steps + 1);
    path[0] = x0;

    for (int i = 0; i < steps; ++i) {
        double t = i * dt, x = path[i];
        double Z = nd(rng);
        double dW = Z * sdt;
        // Milstein correction: 0.5 * sigma * sigma' * (dW^2 - dt)
        path[i+1] = x
            + mu(t, x) * dt
            + sigma(t, x) * dW
            + 0.5 * sigma(t, x) * sigma_dx(t, x) * (dW * dW - dt);
    }
    return path;
}

int main() {
    std::mt19937_64 rng(42);
    // CIR: dX = kappa*(theta-X)*dt + sig*sqrt(X)*dW
    // sigma = sig*sqrt(X), sigma' = sig/(2*sqrt(X))
    double kappa = 2.0, theta = 0.05, sig = 0.1;
    auto path = milstein(
        0.03, 1.0, 500,
        [&](double, double x){ return kappa * (theta - x); },
        [&](double, double x){ return sig * std::sqrt(std::max(x, 0.0)); },
        [&](double, double x){
            return sig / (2.0 * std::sqrt(std::max(x, 1e-12)));
        },
        rng);
    (void)path;
}`,
    explanation:
      "Milstein's extra term captures the curvature of the diffusion coefficient, eliminating the leading error of Euler-Maruyama. For GBM (sigma = sigma*X), the correction cancels with the Ito term and you recover the exact log-normal solution; for the CIR square-root diffusion, the correction is non-trivial and materially improves convergence at coarse time steps.",
  },
  {
    id: "cpp-20260604-b1-bs-greeks",
    language: "cpp",
    title: "Black-Scholes full Greeks — delta, gamma, vega, theta, rho in one pass",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>

// Standard normal PDF and CDF.
static double phi(double x) {
    return std::exp(-0.5*x*x) / std::sqrt(2.0 * std::numbers::pi);
}
static double Phi(double x) {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrt2);
}

struct BSGreeks { double delta, gamma, vega, theta, rho; };

BSGreeks bs_call_greeks(double S, double K, double r, double q,
                         double sigma, double T)
{
    double sT  = sigma * std::sqrt(T);
    double d1  = (std::log(S/K) + (r - q + 0.5*sigma*sigma)*T) / sT;
    double d2  = d1 - sT;
    double Nd1 = Phi(d1), Nd2 = Phi(d2), nd1 = phi(d1);
    double ert = std::exp(-r*T), eqt = std::exp(-q*T);

    BSGreeks g;
    g.delta = eqt * Nd1;                                  // dC/dS
    g.gamma = eqt * nd1 / (S * sT);                      // d²C/dS²
    g.vega  = S * eqt * nd1 * std::sqrt(T) / 100.0;      // per 1 vol point
    g.theta = (-(S * eqt * nd1 * sigma) / (2.0 * std::sqrt(T))
               + q*S*eqt*Nd1 - r*K*ert*Nd2) / 365.0;    // per calendar day
    g.rho   = K * T * ert * Nd2 / 100.0;                 // per 1 bp rate move
    return g;
}

int main() {
    // ATM call: S=K=100, r=5%, q=0, sigma=20%, T=1Y
    auto g = bs_call_greeks(100.0, 100.0, 0.05, 0.0, 0.20, 1.0);
    // g.delta ≈ 0.637, g.gamma ≈ 0.019, g.vega ≈ 0.375
    (void)g;
}`,
    explanation:
      "All five Greeks share the same d1/d2 computation — batching them avoids repeating the expensive log/exp/erfc transcendentals five times. Continuous dividend yield q reduces delta by e^{-qT} (the stock drifts down by q, reducing expected appreciation). Theta is signed negative because an option loses time value as expiry approaches.",
  },
  {
    id: "cpp-20260604-b1-cholesky-mc",
    language: "cpp",
    title: "Cholesky decomposition — correlated multi-asset MC paths",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <random>
#include <stdexcept>

// Cholesky: factor Sigma = L*L^T (L lower-triangular).
// Correlated normals: X = L*Z where Z ~ N(0,I) -> X ~ N(0,Sigma).
std::vector<std::vector<double>> cholesky(
    const std::vector<std::vector<double>>& A)
{
    int n = static_cast<int>(A.size());
    auto L = std::vector(n, std::vector<double>(n, 0.0));
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j <= i; ++j) {
            double s = A[i][j];
            for (int k = 0; k < j; ++k) s -= L[i][k] * L[j][k];
            L[i][j] = (i == j) ? std::sqrt(s) : s / L[j][j];
        }
    }
    return L;
}

// Simulate n_paths correlated log-returns for d assets over dt.
std::vector<std::vector<double>> correlated_returns(
    const std::vector<std::vector<double>>& L,
    const std::vector<double>& mu,
    const std::vector<double>& sigma,
    double dt, int n_paths, std::mt19937_64& rng)
{
    int d = static_cast<int>(L.size());
    std::normal_distribution<> nd;
    std::vector<std::vector<double>> rets(n_paths, std::vector<double>(d));
    for (int p = 0; p < n_paths; ++p) {
        std::vector<double> Z(d);
        for (int i = 0; i < d; ++i) Z[i] = nd(rng);
        for (int i = 0; i < d; ++i) {
            double Lz = 0.0;
            for (int j = 0; j <= i; ++j) Lz += L[i][j] * Z[j];
            rets[p][i] = (mu[i] - 0.5*sigma[i]*sigma[i])*dt + sigma[i]*std::sqrt(dt)*Lz;
        }
    }
    return rets;
}`,
    explanation:
      "Cholesky factorisation is the standard preprocessing step for multi-asset MC: factor the covariance matrix once O(n³), then multiply L by fresh i.i.d. normals for each path O(n² per path). The lower-triangular L ensures each asset's return is a linear combination of independent normals up to and including its own, preserving the full covariance structure.",
  },
  {
    id: "cpp-20260604-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson finite difference — implicit BS European put pricer",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Crank-Nicolson: average of explicit and implicit operators.
// O(dt^2) accurate in time, O(dS^2) in space. Unconditionally stable.
// Thomas algorithm: O(N_s) tridiagonal solve per time step.
double cn_european_put(double S0, double K, double r, double sigma, double T,
                        int Nt = 200, int Ns = 400)
{
    double Smax = 4.0 * K, dS = Smax / Ns, dt = T / Nt;
    std::vector<double> V(Ns + 1);
    for (int j = 0; j <= Ns; ++j) V[j] = std::max(K - j*dS, 0.0);  // terminal

    int M = Ns - 1;
    std::vector<double> a(M), b(M), c(M), rhs(M);

    for (int n = 0; n < Nt; ++n) {
        for (int j = 1; j < Ns; ++j) {
            double Sj = j * dS;
            double A  = 0.25 * dt * (sigma*sigma*Sj*Sj/(dS*dS) - r*Sj/dS);
            double B  = 0.50 * dt * (sigma*sigma*Sj*Sj/(dS*dS) + r);
            double C  = 0.25 * dt * (sigma*sigma*Sj*Sj/(dS*dS) + r*Sj/dS);
            a[j-1] = -A;
            b[j-1] =  1.0 + B;
            c[j-1] = -C;
            rhs[j-1] = A*V[j-1] + (1.0-B)*V[j] + C*V[j+1];
        }
        // Boundary corrections: V[0]=K (deep ITM put), V[Ns]=0.
        rhs[0]   += a[0] * K;      // a[0]=-A, so adds A*K for LHS BC
        // rhs[M-1] += 0 (upper BC = 0, no correction needed)

        // Thomas algorithm (tridiagonal solve).
        for (int i = 1; i < M; ++i) {
            double w = a[i] / b[i-1];
            b[i] -= w * c[i-1];
            rhs[i] -= w * rhs[i-1];
        }
        V[Ns-1] = rhs[M-1] / b[M-1];
        for (int i = M-2; i >= 0; --i)
            V[i+1] = (rhs[i] - c[i] * V[i+2]) / b[i];
        V[0] = K;   V[Ns] = 0.0;
    }
    // Linear interpolation at S0.
    int j0 = static_cast<int>(S0 / dS);
    j0 = std::min(j0, Ns-1);
    double alpha = (S0 - j0*dS) / dS;
    return (1.0-alpha)*V[j0] + alpha*V[j0+1];
}`,
    explanation:
      "Crank-Nicolson averages the explicit (forward Euler) and implicit (backward Euler) operators, achieving O(dt²) time accuracy and unconditional stability — unlike the explicit scheme which requires dt ≤ dS²/σ² to avoid blow-up. The Thomas algorithm solves the resulting tridiagonal system in O(N_s) operations with no fill-in, making each time step extremely cheap.",
  },
  {
    id: "cpp-20260604-b1-yield-bootstrap",
    language: "cpp",
    title: "Zero-curve bootstrap from par swap rates — forward one maturity at a time",
    tag: "quant",
    code: `#include <vector>
#include <cmath>

// Bootstrap piecewise-constant zero rates from annual-coupon par swap rates.
// Par swap: coupon payments at 1..n plus principal at n price to par (=1).
// df[n] = (1 - s_n * sum(df[1..n-1])) / (1 + s_n)
struct ZeroPoint { double maturity; double zero_rate; double discount_factor; };

std::vector<ZeroPoint> bootstrap_zeros(
    const std::vector<double>& maturities,   // e.g., {1,2,3,5,7,10}
    const std::vector<double>& par_rates)    // corresponding par swap rates
{
    int n = static_cast<int>(maturities.size());
    std::vector<ZeroPoint> curve;
    curve.reserve(n);
    double sum_df = 0.0;   // running annuity sum: sum(df[1..k])

    for (int k = 0; k < n; ++k) {
        double T  = maturities[k];
        double s  = par_rates[k];
        // Solve: s*sum_df + df[k]*(1+s) = 1 -> df[k]
        double df = (1.0 - s * sum_df) / (1.0 + s);
        sum_df   += df;
        double z  = -std::log(df) / T;   // continuously compounded zero rate
        curve.push_back({T, z, df});
    }
    return curve;
}

int main() {
    std::vector<double> mats = {1, 2, 3, 5, 7, 10};
    std::vector<double> pars = {0.040, 0.044, 0.047, 0.050, 0.052, 0.053};
    auto zeros = bootstrap_zeros(mats, pars);
    // zeros[5]: T=10, z≈5.35%, df≈0.588
    (void)zeros;
}`,
    explanation:
      "Bootstrapping solves for each discount factor sequentially: the annuity sum accumulated from prior maturities serves as a known input. Each par swap prices exactly to par by construction — unlike fitting a spline which introduces residuals. In production, the loop also handles non-annual coupon frequencies by accumulating accrual fractions rather than integer counts.",
  },
  {
    id: "cpp-20260604-b1-token-bucket",
    language: "cpp",
    title: "Token bucket rate limiter — order-flow throttle (single-threaded)",
    tag: "quant",
    code: `#include <chrono>
#include <algorithm>
#include <cstdint>

// Token bucket: tokens accumulate at rate_per_sec up to capacity.
// Each order submission consumes n tokens; rejected if insufficient.
class TokenBucket {
    using Clock = std::chrono::steady_clock;
    using TP    = Clock::time_point;

    double   tokens_;
    double   capacity_;
    double   rate_per_ns_;   // tokens / nanosecond
    TP       last_;

public:
    TokenBucket(double capacity, double rate_per_sec) noexcept
        : tokens_(capacity), capacity_(capacity),
          rate_per_ns_(rate_per_sec / 1.0e9),
          last_(Clock::now()) {}

    bool try_consume(double n = 1.0) noexcept {
        auto now = Clock::now();
        auto ns  = std::chrono::duration_cast<std::chrono::nanoseconds>(
                       now - last_).count();
        last_   = now;
        tokens_ = std::min(tokens_ + ns * rate_per_ns_, capacity_);
        if (tokens_ < n) return false;
        tokens_ -= n;
        return true;
    }

    double available() const noexcept { return tokens_; }
};

// Usage: one bucket per strategy/session.
// if (!limiter.try_consume()) { reject_order("throttled"); return; }
//
// Burst: initial tokens = capacity allows capacity orders before throttle.
// Sustained: long-run throughput = rate_per_sec orders/second.`,
    explanation:
      "The token bucket separates burst capacity (initial fill) from sustained rate (refill speed) — a strategy can send 50 orders in a burst but only sustain 20/s long-term. Single-threaded operation is the common case (one strategy thread per session); for multi-threaded use, wrap with a mutex or use per-thread sub-buckets with periodic rebalancing.",
  },
  {
    id: "cpp-20260604-b1-parkinson-vol",
    language: "cpp",
    title: "Parkinson high-low volatility estimator — 5x efficiency vs close-to-close",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <stdexcept>

// Parkinson (1980): sigma^2 = 1/(4*n*ln2) * sum((ln(H_i/L_i))^2)
// More efficient: uses intra-day range instead of end-of-day prices alone.
// Assumes no drift (acceptable for high-frequency horizons).
double parkinson_vol(const std::vector<double>& highs,
                     const std::vector<double>& lows,
                     bool annualise = true)
{
    if (highs.size() != lows.size() || highs.empty())
        throw std::invalid_argument("mismatched or empty OHLC vectors");
    double sum = 0.0;
    for (std::size_t i = 0; i < highs.size(); ++i) {
        double x = std::log(highs[i] / lows[i]);
        sum += x * x;
    }
    double n    = static_cast<double>(highs.size());
    double dvar = sum / (4.0 * n * std::log(2.0));   // daily variance
    double dvol = std::sqrt(dvar);
    return annualise ? dvol * std::sqrt(252.0) : dvol;
}

// Garman-Klass extension: also uses open/close for even more efficiency.
double garman_klass_vol(const std::vector<double>& open_,
                         const std::vector<double>& high_,
                         const std::vector<double>& low_,
                         const std::vector<double>& close_)
{
    double sum = 0.0;
    for (std::size_t i = 0; i < high_.size(); ++i) {
        double hl  = std::log(high_[i] / low_[i]);
        double co  = std::log(close_[i] / open_[i]);
        sum += 0.5 * hl * hl - (2.0 * std::log(2.0) - 1.0) * co * co;
    }
    double n = static_cast<double>(high_.size());
    return std::sqrt(sum / n * 252.0);
}`,
    explanation:
      "Parkinson is 5x more statistically efficient than close-to-close because the intra-day range captures information from all intermediate prices. Garman-Klass adds open/close to achieve 7x efficiency. However, both estimators are biased upward by microstructure noise (bid-ask bounce); in practice, they are applied to OHLC bars of 5 min or longer.",
  },
  {
    id: "cpp-20260604-b1-pmr-buffer",
    language: "cpp",
    title: "std::pmr::monotonic_buffer_resource — zero-heap FIX message parse",
    tag: "memory",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <array>
#include <cstddef>

// pmr::monotonic_buffer_resource bump-allocates from a fixed stack buffer.
// When the function returns, all allocations are freed in O(1) — no heap.
struct ParsedField {
    std::pmr::string tag;
    std::pmr::string value;
    ParsedField(std::string_view t, std::string_view v,
                std::pmr::memory_resource* mr)
        : tag(t, mr), value(v, mr) {}
};

void parse_fix_message(std::string_view raw) {
    // 8 KB stack buffer — sufficient for one FIX message.
    std::array<std::byte, 8192> buf;
    std::pmr::monotonic_buffer_resource pool{
        buf.data(), buf.size(), std::pmr::null_memory_resource()};

    std::pmr::vector<ParsedField> fields{&pool};
    fields.reserve(32);

    std::size_t pos = 0;
    while (pos < raw.size()) {
        auto soh = raw.find('\x01', pos);
        if (soh == std::string_view::npos) soh = raw.size();
        auto eq = raw.find('=', pos);
        if (eq != std::string_view::npos && eq < soh)
            fields.emplace_back(raw.substr(pos, eq-pos),
                                raw.substr(eq+1, soh-eq-1), &pool);
        pos = soh + 1;
    }
    // All ParsedFields + their strings destroyed together at scope exit.
    (void)fields;
}`,
    explanation:
      "std::pmr::monotonic_buffer_resource makes the stack arena an STL-compatible allocator: every pmr::string and pmr::vector allocation inside the scope draws from the same bump pointer. When the resource goes out of scope, all memory is reclaimed in a single operation — no per-object frees, no heap fragmentation. The null_memory_resource() sentinel prevents accidental heap fallback.",
  },
  {
    id: "cpp-20260604-b1-structured-bindings",
    language: "cpp",
    title: "Structured bindings + if-constexpr — decompose price levels cleanly",
    tag: "modern",
    code: `#include <map>
#include <tuple>
#include <string>
#include <iostream>
#include <cstdint>

struct PriceLevel { double price; std::int64_t qty; int order_count; };

// Structured bindings work on aggregates, pairs, tuples, and arrays.
PriceLevel best_bid(const std::map<double, PriceLevel>& book) {
    if (book.empty()) return {};
    auto [price, level] = *book.rbegin();   // decompose map entry
    (void)price;                             // suppress unused warning
    return level;
}

// if constexpr: compile-time branch on type trait.
template <typename T>
void print_order_info(const T& order) {
    auto [id, px, qty] = order;
    std::cout << "id=" << id << " px=" << px;
    if constexpr (std::tuple_size_v<T> >= 4) {
        auto [i, p, q, side] = order;
        std::cout << " side=" << side;
    }
    std::cout << " qty=" << qty << "\\n";
}

int main() {
    using Limit3 = std::tuple<std::uint64_t, double, std::uint32_t>;
    using Limit4 = std::tuple<std::uint64_t, double, std::uint32_t, char>;
    Limit3 lo3{1, 100.25, 500};
    Limit4 lo4{2, 99.75, 300, 'S'};
    print_order_info(lo3);
    print_order_info(lo4);   // prints extra 'side' field
}`,
    explanation:
      "Structured bindings (C++17) eliminate .first/.second/.get<N>() boilerplate: names are bound at the point of decomposition, making financial structs with many fields readable. if constexpr eliminates dead branches at compile time — the version without a side field never instantiates the four-field branch, keeping the generated code minimal.",
  },
  {
    id: "cpp-20260604-b1-atomic-pnl-cas",
    language: "cpp",
    title: "Lock-free double accumulator — CAS loop for streaming P&L",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstring>
#include <cstdint>

// std::atomic<double>::fetch_add is NOT lock-free on all hardware.
// CAS over the IEEE-754 bit pattern guarantees lock-free semantics on x86/ARM.
class AtomicDouble {
    std::atomic<std::int64_t> bits_{0};

    static std::int64_t to_bits(double d) noexcept {
        std::int64_t i;
        std::memcpy(&i, &d, sizeof d);   // defined by [basic.types] via memcpy
        return i;
    }
    static double from_bits(std::int64_t i) noexcept {
        double d;
        std::memcpy(&d, &i, sizeof d);
        return d;
    }
public:
    static_assert(std::atomic<std::int64_t>::is_always_lock_free);

    void add(double delta) noexcept {
        std::int64_t expected = bits_.load(std::memory_order_relaxed);
        std::int64_t desired;
        do {
            desired = to_bits(from_bits(expected) + delta);
        } while (!bits_.compare_exchange_weak(expected, desired,
                                               std::memory_order_release,
                                               std::memory_order_relaxed));
    }
    double load() const noexcept {
        return from_bits(bits_.load(std::memory_order_acquire));
    }
    void reset() noexcept { bits_.store(0, std::memory_order_release); }
};

// AtomicDouble g_daily_pnl;
// On each fill: g_daily_pnl.add(fill_price * fill_qty * (side==BUY ? 1 : -1));`,
    explanation:
      "Packing a double into a 64-bit int makes the atomic truly lock-free on x86/ARM — CMPXCHG/CAS is a single hardware instruction that compares and swaps 8 bytes atomically. The CAS loop converges in one iteration under low contention (the common case for a per-strategy P&L register). The memcpy reinterpretation is fully defined behaviour in C++20 and replaces the old union hack.",
  },
  {
    id: "cpp-20260604-b1-treiber-stack",
    language: "cpp",
    title: "Treiber lock-free stack — LIFO free-list for order object recycling",
    tag: "concurrency",
    code: `#include <atomic>
#include <optional>

// Treiber (1986) stack: CAS-based lock-free LIFO.
// Used as a free-list: push() returns an order to the pool; pop() recycles one.
// ABA note: raw pointer CAS is unsafe under concurrent alloc/free.
// For production: use std::atomic<std::uintptr_t> with a 16-bit version tag
// packed into the top bits (on x86-64 only 48 bits are used for addresses).
template <typename T>
class TreiberStack {
    struct Node { T value; Node* next = nullptr; };
    std::atomic<Node*> head_{nullptr};
public:
    void push(T val) {
        auto* node = new Node{std::move(val), nullptr};
        node->next = head_.load(std::memory_order_relaxed);
        while (!head_.compare_exchange_weak(node->next, node,
                                            std::memory_order_release,
                                            std::memory_order_relaxed)) {}
    }
    std::optional<T> pop() {
        Node* top = head_.load(std::memory_order_acquire);
        while (top) {
            if (head_.compare_exchange_weak(top, top->next,
                                            std::memory_order_acquire,
                                            std::memory_order_relaxed)) {
                T val = std::move(top->value);
                delete top;
                return val;
            }
        }
        return std::nullopt;
    }
    ~TreiberStack() {
        Node* n = head_.load();
        while (n) { Node* nx = n->next; delete n; n = nx; }
    }
};`,
    explanation:
      "The Treiber stack is the textbook lock-free LIFO: each push prepends a new node via CAS on the head pointer; pop removes the head with CAS. The ABA problem — a pointer matching the expected value but referring to a recycled object — is suppressed in production by tagging the pointer with a version counter in the unused upper bits of a 48-bit virtual address, or by hazard pointers.",
  },
  {
    id: "cpp-20260604-b1-cir-zcb",
    language: "cpp",
    title: "CIR zero-coupon bond — closed-form non-negative rate model",
    tag: "quant",
    code: `#include <cmath>

// Cox-Ingersoll-Ross (1985): dr = kappa*(theta - r) dt + sigma*sqrt(r) dW
// Non-negative rates guaranteed when Feller condition holds: 2*kappa*theta >= sigma^2.
// P(0,T) = A(T) * exp(-B(T)*r0)  closed-form.
struct CIRParams {
    double kappa;   // mean-reversion speed
    double theta;   // long-run mean rate
    double sigma;   // diffusion coefficient
    double r0;      // current short rate
};

// Returns {price, continuously-compounded zero rate}.
std::pair<double,double> cir_zcb(const CIRParams& p, double T) {
    double g = std::sqrt(p.kappa*p.kappa + 2.0*p.sigma*p.sigma);
    double e = std::exp(g * T);
    // B(T) = 2*(e^{gT}-1) / ((g+kappa)*(e^{gT}-1) + 2*g)
    double B = 2.0 * (e - 1.0) / ((g + p.kappa)*(e - 1.0) + 2.0*g);
    // A(T)^{2*kappa*theta/sigma^2}
    double logA = (2.0*p.kappa*p.theta / (p.sigma*p.sigma))
                  * std::log(2.0*g*std::exp(0.5*(p.kappa+g)*T)
                             / ((g+p.kappa)*(e-1.0) + 2.0*g));
    double price = std::exp(logA - B * p.r0);
    double zero  = -std::log(price) / T;
    return {price, zero};
}

int main() {
    CIRParams cir{0.5, 0.05, 0.10, 0.03};
    auto [p5,  y5]  = cir_zcb(cir, 5.0);
    auto [p10, y10] = cir_zcb(cir, 10.0);
    (void)p5; (void)y5; (void)p10; (void)y10;
}`,
    explanation:
      "CIR guarantees non-negative rates because the square-root diffusion cannot cross zero when 2κθ ≥ σ² (Feller condition). The closed form avoids Bessel functions by using the alternative representation with hyperbolic-like combinations of exponentials. B(T) is bounded above by 2/κ regardless of maturity — unlike Vasicek where duration grows without bound.",
  },
  {
    id: "cpp-20260604-b1-barrier-call-analytic",
    language: "cpp",
    title: "Down-and-out barrier call — Merton reflection principle closed-form",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>
#include <algorithm>

static double Phi_b(double x) {   // standard normal CDF
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrt2);
}
static double bs_call(double S, double K, double r, double v, double T) {
    if (T < 1e-12) return std::max(S-K, 0.0);
    double sv = v * std::sqrt(T);
    double d1 = (std::log(S/K) + (r + 0.5*v*v)*T) / sv;
    return S*Phi_b(d1) - K*std::exp(-r*T)*Phi_b(d1-sv);
}

// Down-and-out call (B < S, B < K): knocked out if S touches barrier B.
// Analytic: C_DOC = C_BS(S) - (S/B)^(2*lambda-2) * C_BS(B^2/S, K, ...)
// lambda = (r + 0.5*sigma^2) / sigma^2
double down_and_out_call(double S, double K, double r, double sigma,
                          double T, double B)
{
    if (S <= B) return 0.0;   // already knocked out
    double lambda = (r + 0.5*sigma*sigma) / (sigma*sigma);
    double scale  = std::pow(S/B, 2.0*lambda - 2.0);
    return bs_call(S, K, r, sigma, T)
         - scale * bs_call(B*B/S, K, r, sigma, T);
}

int main() {
    double vanilla = bs_call(100, 100, 0.05, 0.20, 1.0);
    double doc     = down_and_out_call(100, 100, 0.05, 0.20, 1.0, 90.0);
    // doc < vanilla: barrier reduces value by probability of knock-out
    (void)vanilla; (void)doc;
}`,
    explanation:
      "The reflection principle maps paths that touch the barrier B to paths of the 'mirrored' process starting at B²/S, scaled by the change-of-measure factor (S/B)^(2λ-2). The DOC price is the vanilla call minus the contribution from knocked-out paths. As barrier B approaches spot S, the DOC approaches zero and delta becomes highly negative — pathological for hedging near the barrier.",
  },
  {
    id: "cpp-20260604-b1-coroutine-tick",
    language: "cpp",
    title: "C++20 coroutine generator — lazy tick-by-tick stream",
    tag: "modern",
    code: `#include <coroutine>
#include <cstdint>
#include <iostream>

struct Tick { std::uint64_t ts_ns; double price; std::uint32_t qty; };

// Minimal stackless coroutine generator — co_yield returns one tick at a time.
// Heap-allocated coroutine frame preserves all locals between yields.
template <typename T>
struct Generator {
    struct promise_type {
        T val;
        Generator get_return_object() { return Generator{*this}; }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v) noexcept { val = v; return {}; }
        void return_void()       noexcept {}
        void unhandled_exception() noexcept { std::terminate(); }
    };
    using H = std::coroutine_handle<promise_type>;
    H h;
    explicit Generator(promise_type& p) : h(H::from_promise(p)) {}
    ~Generator() { if (h) h.destroy(); }
    Generator(Generator&& o) noexcept : h(o.h) { o.h = nullptr; }
    struct Iter {
        H h;
        bool operator!=(std::default_sentinel_t) const { return !h.done(); }
        Iter& operator++() { h.resume(); return *this; }
        T& operator*() { return h.promise().val; }
    };
    Iter begin() { h.resume(); return {h}; }
    std::default_sentinel_t end() { return {}; }
};

Generator<Tick> replay(int n) {
    for (int i = 0; i < n; ++i)
        co_yield Tick{static_cast<std::uint64_t>(i)*1000, 100.0+i*0.01, 100};
}

int main() {
    for (auto t : replay(5))
        std::cout << "ts=" << t.ts_ns << " px=" << t.price << "\\n";
}`,
    explanation:
      "co_yield suspends the coroutine, returning the current value to the caller while preserving all local state on the coroutine frame. The frame is heap-allocated once and reused on each resume() — far cheaper than a thread per source. Coroutine generators compose naturally: pipe a replay() through a filter() generator to build zero-allocation processing pipelines.",
  },
  {
    id: "cpp-20260604-b1-flat-map-book",
    language: "cpp",
    title: "std::flat_map (C++23) — cache-friendly sparse order book",
    tag: "stl",
    code: `#include <flat_map>   // C++23
#include <cstdint>
#include <iostream>

// flat_map stores keys and values in two contiguous sorted vectors.
// O(log n) lookup via binary search, cache-friendly for small books (10-50 levels).
// Insertions are O(n) — suitable only when updates are infrequent vs lookups.

struct Level { std::int64_t qty; int order_count; };
using Book = std::flat_map<double, Level>;   // price -> {qty, n_orders}

void apply_update(Book& book, double px, std::int64_t delta_qty) {
    if (delta_qty == 0) {
        book.erase(px);
        return;
    }
    auto it = book.find(px);
    if (it == book.end())
        book.emplace(px, Level{delta_qty, 1});
    else {
        it->second.qty += delta_qty;
        if (it->second.qty <= 0) book.erase(it);
    }
}

int main() {
    Book ask;
    ask[100.26] = {5000, 3};
    ask[100.27] = {3000, 2};
    ask[100.25] = {8000, 5};

    auto [best_ask, lvl] = *ask.begin();
    std::cout << "best ask: " << best_ask
              << " qty=" << lvl.qty << "\\n";

    apply_update(ask, 100.25, -8000);   // level consumed
    std::cout << "new best ask: " << ask.begin()->first << "\\n";
}`,
    explanation:
      "std::flat_map (C++23) replaces std::map's red-black tree with two sorted vectors, eliminating heap-allocation per node and enabling SIMD-accelerated binary search. For an order book with 5-50 active levels, the entire structure fits in L1 cache — random access through a red-black tree would miss L2 for large books. The trade-off: O(n) insertion cost for shifts.",
  },
  {
    id: "cpp-20260604-b1-designated-init",
    language: "cpp",
    title: "Designated initializers (C++20) — safe aggregate init for order structs",
    tag: "modern",
    code: `#include <cstdint>
#include <iostream>

// Aggregate with many flag fields: positional init is a bug magnet.
struct NewOrderSingle {
    std::uint64_t cl_ord_id    = 0;
    std::uint64_t instrument   = 0;
    double        price        = 0.0;
    double        stop_price   = 0.0;
    std::uint32_t qty          = 0;
    std::uint32_t min_qty      = 0;
    std::uint8_t  side         = 0;   // 0=buy, 1=sell
    std::uint8_t  ord_type     = 0;   // 0=limit, 1=market, 2=stop
    std::uint8_t  tif          = 0;   // 0=day, 1=GTC, 2=IOC, 3=FOK
    bool          post_only    = false;
    bool          reduce_only  = false;
};

int main() {
    // Only specified fields deviate from default — no positional ordering errors.
    NewOrderSingle req {
        .cl_ord_id  = 100042,
        .instrument = 0x4141504CULL,   // AAPL
        .price      = 195.50,
        .qty        = 200,
        .side       = 1,              // sell
        .tif        = 2,              // IOC
        .post_only  = true,
    };
    std::cout << "order " << req.cl_ord_id
              << " px=" << req.price
              << " qty=" << req.qty << "\\n";
    // Positional version with 11 fields is unmaintainable and error-prone.
}`,
    explanation:
      "Designated initialisers (C++20) name each field at the initialisation site: unspecified fields remain zero/false-initialised, adding a new field later doesn't silently corrupt existing initialisers, and mistyped field names are compile errors. They are the C++ equivalent of Python's keyword arguments and are essential for large financial structs with many boolean flags.",
  },
  {
    id: "cpp-20260604-b1-simd-dot",
    language: "cpp",
    title: "AVX2 FMA dot product — factor model return in ~25 cycles for 100 factors",
    tag: "performance",
    code: `#include <immintrin.h>
#include <cstddef>
#include <vector>

// Pure C++ scalar loop — auto-vectorised to AVX2/AVX512 with -O3 -march=native.
// __restrict__: no aliasing -> compiler can vectorise.
double dot_scalar(const double* __restrict__ a,
                  const double* __restrict__ b,
                  std::size_t n) noexcept
{
    double s = 0.0;
    for (std::size_t i = 0; i < n; ++i) s += a[i] * b[i];
    return s;
}

// Explicit AVX2 FMA: 4 doubles per 256-bit register, fused multiply-add.
double dot_avx2(const double* a, const double* b, std::size_t n) noexcept {
    __m256d acc = _mm256_setzero_pd();
    std::size_t i = 0;
    for (; i + 4 <= n; i += 4)
        acc = _mm256_fmadd_pd(_mm256_loadu_pd(a+i),
                               _mm256_loadu_pd(b+i), acc);
    // Horizontal reduce 4 lanes -> 1 scalar.
    __m128d lo  = _mm256_castpd256_pd128(acc);
    __m128d hi  = _mm256_extractf128_pd(acc, 1);
    lo = _mm_add_pd(lo, hi);
    lo = _mm_add_pd(lo, _mm_unpackhi_pd(lo, lo));
    double s = _mm_cvtsd_f64(lo);
    for (; i < n; ++i) s += a[i] * b[i];   // tail
    return s;
}

// Factor model: E[r] = loadings . factor_returns
double factor_expected_return(const std::vector<double>& betas,
                               const std::vector<double>& f_ret) {
    return dot_avx2(betas.data(), f_ret.data(), betas.size());
}`,
    explanation:
      "_mm256_fmadd_pd performs a[i]*b[i]+acc in a single AVX2 instruction with no intermediate rounding — both faster and more accurate than separate multiply+add. __restrict__ in the scalar version allows the compiler to emit the same AVX2 code automatically. For a 100-factor model, the entire dot product fits in L1 cache and completes in ~25 clock cycles.",
  },
  {
    id: "cpp-20260604-b1-merton-jump",
    language: "cpp",
    title: "Merton jump-diffusion MC — compound Poisson jumps on GBM",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Merton (1976): dS/S = (mu - lambda*kbar)*dt + sigma*dW + (J-1)*dN
// J = lognormal jump: log J ~ N(muJ, sigmaJ^2)
// lambda = Poisson arrival rate; kbar = E[J-1] = exp(muJ + 0.5*sigmaJ^2) - 1
double merton_call_mc(double S, double K, double r, double sigma,
                       double lambda, double muJ, double sigmaJ,
                       double T, int n_paths = 200'000, unsigned seed = 42)
{
    std::mt19937_64          rng(seed);
    std::normal_distribution<> nd;
    std::poisson_distribution<> pd(lambda * T);
    double kbar = std::exp(muJ + 0.5*sigmaJ*sigmaJ) - 1.0;
    double disc = std::exp(-r * T);
    double total = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        // Diffusion component.
        double ST = S * std::exp(
            (r - lambda*kbar - 0.5*sigma*sigma)*T + sigma*std::sqrt(T)*nd(rng));
        // Jump component: N jumps in [0,T] drawn from Poisson(lambda*T).
        int nj = pd(rng);
        for (int j = 0; j < nj; ++j)
            ST *= std::exp(muJ + sigmaJ * nd(rng));
        total += std::max(ST - K, 0.0);
    }
    return disc * total / n_paths;
}

int main() {
    // lambda=1, muJ=-5%, sigmaJ=10%: one downward jump per year on average.
    double p = merton_call_mc(100, 100, 0.05, 0.15, 1.0, -0.05, 0.10, 1.0);
    (void)p;  // compare to BS: Merton generates a downward implied vol skew
}`,
    explanation:
      "Merton's jump-diffusion explains the volatility smile: negative mean jumps (muJ<0) create a downward skew because the risk-neutral probability of large drops is elevated. The adjusted drift (r - λκ̄) compensates for the expected jump return to keep the model risk-neutral. Deep OTM put prices are materially higher than Black-Scholes because of the heavy left tail from jump risk.",
  },
  {
    id: "cpp-20260604-b1-consteval-fx",
    language: "cpp",
    title: "consteval FX cross-rate matrix — compile-time currency conversion table",
    tag: "modern",
    code: `#include <array>
#include <cstdint>
#include <iostream>

// Base spot rates vs USD (updated at market open, recompile to refresh).
// consteval: MUST be evaluated at compile time — cannot appear in runtime context.
enum class CCY : std::uint8_t { EUR=0, GBP=1, USD=2, JPY=3, N=4 };

constexpr std::array<double, 4> SPOT_VS_USD = {1.08, 1.26, 1.0, 0.0068};

// Cross rate: EUR/JPY = EURUSD / USDJPY = 1.08 / 0.0068.
consteval double cross(CCY from, CCY to) {
    auto i = static_cast<std::size_t>(from);
    auto j = static_cast<std::size_t>(to);
    return SPOT_VS_USD[i] / SPOT_VS_USD[j];
}

// Full 4×4 matrix: all pairs computed at compile time.
constexpr auto FX = []() consteval {
    std::array<std::array<double, 4>, 4> m{};
    for (std::size_t i = 0; i < 4; ++i)
        for (std::size_t j = 0; j < 4; ++j)
            m[i][j] = SPOT_VS_USD[i] / SPOT_VS_USD[j];
    return m;
}();

int main() {
    // No floating-point arithmetic at runtime — loaded from .rodata.
    constexpr double EUR_JPY = FX[0][3];   // 1.08/0.0068 ≈ 158.8
    std::cout << "EUR/JPY = " << EUR_JPY << "\\n";
    std::cout << "GBP/EUR = " << FX[1][0] << "\\n";
}`,
    explanation:
      "consteval (C++20) mandates compile-time evaluation — the compiler rejects any use that would defer to runtime. The FX matrix is stored in the read-only data segment with no floating-point ops at startup: fast, safe, and race-free across threads. For daily base-rate updates, a CI pipeline can regenerate the header and rebuild in seconds.",
  },
  {
    id: "cpp-20260604-b1-latch-risk",
    language: "cpp",
    title: "std::latch (C++20) — fan-out Greeks computation with aggregation gate",
    tag: "concurrency",
    code: `#include <latch>
#include <thread>
#include <vector>
#include <numeric>
#include <iostream>
#include <cstddef>

// std::latch: single-use countdown barrier. All worker threads count_down()
// when done; the aggregator thread blocks in wait() until count reaches 0.
// Unlike std::barrier, a latch cannot be reset.

void compute_book_greeks(std::size_t book_id,
                          std::vector<double>& results,
                          std::latch& gate)
{
    // Simulate per-book Greeks computation.
    results[book_id] = static_cast<double>(book_id + 1) * 0.015;
    gate.count_down();   // last thread to call triggers wait() to return
}

int main() {
    constexpr std::size_t N = 6;   // 6 trading books
    std::vector<double> deltas(N);
    std::latch gate(N);

    std::vector<std::jthread> workers;
    workers.reserve(N);
    for (std::size_t i = 0; i < N; ++i)
        workers.emplace_back(compute_book_greeks, i,
                             std::ref(deltas), std::ref(gate));

    gate.wait();   // blocks until all 6 count_down() calls complete

    double total = std::reduce(deltas.begin(), deltas.end());
    std::cout << "aggregate delta = " << total << "\\n";
    // workers auto-join via jthread destructor
}`,
    explanation:
      "std::latch is the right primitive for a fan-out/fan-in risk computation: N worker threads process one book each, the latch gate counts down to zero, and the aggregation thread proceeds exactly once. Using jthread avoids explicit join() calls. For recurring computations (end-of-minute rolls), replace with std::barrier which auto-resets after each epoch.",
  },
];
