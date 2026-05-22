import type { Snippet } from "./types";

export const cppSnippets20260522B1: Snippet[] = [
  {
    id: "cpp-20260522-b1-sbe-decoder",
    language: "cpp",
    title: "SBE (Simple Binary Encoding) zero-copy decoder",
    tag: "quant",
    code: `#include <cstdint>
#include <cstring>
#include <stdexcept>

// Minimal SBE fixed-layout market-data message.
// All fields sit at fixed offsets — decode is a single memcpy, no parsing.
struct SbeHeader {
    std::uint16_t block_length;  // offset 0
    std::uint16_t template_id;   // offset 2
    std::uint16_t schema_id;     // offset 4
    std::uint16_t version;       // offset 6
};

#pragma pack(push, 1)
struct SbeMdEntry {
    std::int64_t  price_mantissa;  // price * 10^-9 (exponent per schema)
    std::int32_t  quantity;
    std::uint8_t  entry_type;      // 0=bid, 1=ask, 2=trade
};
#pragma pack(pop)

struct SbeDecoder {
    static SbeMdEntry decode(const char* buf, std::size_t len) {
        constexpr std::size_t MIN_LEN = sizeof(SbeHeader) + sizeof(SbeMdEntry);
        if (len < MIN_LEN)
            throw std::runtime_error("SBE buffer too short");
        SbeMdEntry e;
        std::memcpy(&e, buf + sizeof(SbeHeader), sizeof(e));
        return e;
    }
    static double to_double(std::int64_t mantissa) noexcept {
        return mantissa * 1e-9;
    }
};`,
    explanation:
      "SBE achieves sub-microsecond decode because the 'parser' is a bounds check plus a memcpy — there is no scanning, no branching on field tags. CME, NASDAQ, and ICE all offer SBE feeds; contrast with FIX ASCII where every byte must be scanned.",
  },
  {
    id: "cpp-20260522-b1-dual-number-ad",
    language: "cpp",
    title: "Dual-number automatic differentiation (Greeks)",
    tag: "quant",
    code: `#include <cmath>

// Forward-mode AD: carry (value, derivative) through every arithmetic op.
struct Dual {
    double v;   // function value
    double d;   // derivative w.r.t. the 'active' input

    Dual(double v_, double d_ = 0.0) : v(v_), d(d_) {}

    Dual operator+(Dual b) const { return {v + b.v, d + b.d}; }
    Dual operator-(Dual b) const { return {v - b.v, d - b.d}; }
    Dual operator*(Dual b) const { return {v * b.v, v * b.d + d * b.v}; }
    Dual operator/(Dual b) const {
        return {v / b.v, (d * b.v - v * b.d) / (b.v * b.v)};
    }
};

Dual exp_d(Dual x)  { return {std::exp(x.v),  std::exp(x.v) * x.d}; }
Dual log_d(Dual x)  { return {std::log(x.v),  x.d / x.v}; }
Dual sqrt_d(Dual x) { return {std::sqrt(x.v), x.d / (2.0 * std::sqrt(x.v))}; }

// Make S the active variable (d=1) to compute Delta automatically.
// Returns {call_price, delta}.
std::pair<double,double> bs_call_delta(double S, double K, double r,
                                        double sigma, double T) {
    Dual Sd{S, 1.0};           // active variable
    Dual Kd{K}, rd{r}, sd{sigma}, Td{T};

    Dual sT  = sd * sqrt_d(Td);
    Dual d1  = (log_d(Sd / Kd) + (rd + sd * sd * Dual{0.5}) * Td) / sT;
    // norm_cdf via erfc not shown — return d1.v, d1.d as proxy
    return {d1.v, d1.d};  // in real code: return {price.v, price.d}
}`,
    explanation:
      "Forward-mode AD propagates the derivative through the same code path that computes the value — no finite difference rounding, no symbolic differentiation brittleness. Set the 'd' component of each input to 1 for the input you differentiate by; all other inputs have d=0.",
  },
  {
    id: "cpp-20260522-b1-array-orderbook",
    language: "cpp",
    title: "Price-indexed array order book (O(1) add/cancel)",
    tag: "quant",
    code: `#include <cstdint>
#include <array>
#include <limits>

// Flat array keyed by integer price tick. O(1) add, cancel, best-price.
// Trade-off: works only when price range is bounded and tick-based.
constexpr int TICKS = 20000;   // total tick range
constexpr int BASE  = 10000;   // zero tick (offset)

struct Level {
    std::uint32_t qty        = 0;
    std::uint32_t num_orders = 0;
};

class ArrayBook {
    std::array<Level, TICKS> bids{};
    std::array<Level, TICKS> asks{};
    int best_bid_tick = -1;
    int best_ask_tick = TICKS;

public:
    void add_bid(int tick, std::uint32_t qty) {
        bids[tick].qty += qty;
        ++bids[tick].num_orders;
        if (tick > best_bid_tick) best_bid_tick = tick;
    }
    void add_ask(int tick, std::uint32_t qty) {
        asks[tick].qty += qty;
        ++asks[tick].num_orders;
        if (tick < best_ask_tick) best_ask_tick = tick;
    }
    void cancel_bid(int tick, std::uint32_t qty) {
        bids[tick].qty -= qty;
        if (bids[tick].qty == 0) {
            --bids[tick].num_orders;
            // Walk best_bid down if level emptied
            while (best_bid_tick >= 0 && bids[best_bid_tick].qty == 0)
                --best_bid_tick;
        }
    }
    int best_bid() const { return best_bid_tick; }
    int best_ask() const { return best_ask_tick; }
};`,
    explanation:
      "When the tick range is bounded (e.g. a single equity name with ±10k ticks) an array book gives strictly O(1) add/cancel vs O(log n) for std::map. The walking step for best-price update is amortised O(1) over the sequence of inserts and cancels.",
  },
  {
    id: "cpp-20260522-b1-vasicek-sim",
    language: "cpp",
    title: "Vasicek short-rate simulation",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>

// Vasicek: dr = kappa*(theta-r)*dt + sigma*dW
// Exact discrete transition (no Euler error):
//   r(t+dt) = r(t)*exp(-kappa*dt) + theta*(1-exp(-kappa*dt))
//           + sigma*sqrt((1-exp(-2*kappa*dt))/(2*kappa)) * Z
struct VasicekParams { double kappa, theta, sigma, r0; };

std::vector<double> vasicek_path(VasicekParams p, double T, int N,
                                  std::mt19937_64& rng) {
    std::normal_distribution<double> nd;
    double dt = T / N;
    double ex = std::exp(-p.kappa * dt);
    double mean_revert = p.theta * (1.0 - ex);
    double vol = p.sigma * std::sqrt((1.0 - ex * ex) / (2.0 * p.kappa));

    std::vector<double> path(N + 1);
    path[0] = p.r0;
    for (int i = 0; i < N; ++i)
        path[i + 1] = ex * path[i] + mean_revert + vol * nd(rng);
    return path;
}

// Zero-coupon bond price P(0,T) = exp(A(T) - B(T)*r0)
double vasicek_zcb(VasicekParams p, double T) {
    double B = (1.0 - std::exp(-p.kappa * T)) / p.kappa;
    double A = (p.theta - p.sigma * p.sigma / (2.0 * p.kappa * p.kappa))
             * (B - T)
             - p.sigma * p.sigma * B * B / (4.0 * p.kappa);
    return std::exp(A - B * p.r0);
}`,
    explanation:
      "The exact discrete Vasicek update has no discretisation error because the OU process has a Gaussian conditional distribution with known mean and variance. The closed-form ZCB formula makes Vasicek unique among short-rate models — it prices bonds analytically.",
  },
  {
    id: "cpp-20260522-b1-cpu-affinity",
    language: "cpp",
    title: "CPU affinity pinning (Linux)",
    tag: "quant",
    code: `#ifdef __linux__
#include <sched.h>
#include <pthread.h>
#include <stdexcept>

// Pin the calling thread to a single logical CPU core.
// Eliminates OS-scheduled migrations across cores, reducing cache cold-starts
// and making RDTSC timing meaningful.
void pin_to_core(int core_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_id, &cpuset);

    int rc = pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    if (rc != 0)
        throw std::runtime_error("pthread_setaffinity_np failed");
}

// In practice: isolate the core from the OS with isolcpus= kernel param,
// disable IRQ balance (irqbalance), and set the thread policy to SCHED_FIFO.
void set_realtime(int priority = 80) {
    sched_param sp{ priority };
    pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp);
}
#endif`,
    explanation:
      "CPU pinning is the first step in any latency-sensitive C++ program: without it, the OS may migrate the thread mid-loop and every level of the cache hierarchy restarts cold. Combine with isolcpus and SCHED_FIFO for single-digit-microsecond jitter.",
  },
  {
    id: "cpp-20260522-b1-rdtsc-timer",
    language: "cpp",
    title: "RDTSC cycle-accurate timer",
    tag: "quant",
    code: `#include <cstdint>
#include <ctime>

// Read time-stamp counter — cheapest timer available (~3 cycles overhead).
// RDTSCP serialises the instruction stream so prior ops are committed first.
inline std::uint64_t rdtsc_start() {
    std::uint64_t lo, hi;
    __asm__ volatile(
        "CPUID\\n\\t"      // serialise — flush speculative execution
        "RDTSC\\n\\t"
        "mov %%rdx, %0\\n\\t"
        "mov %%rax, %1"
        : "=r"(hi), "=r"(lo)
        :: "%rax", "%rbx", "%rcx", "%rdx"
    );
    return (hi << 32) | lo;
}

inline std::uint64_t rdtsc_stop() {
    std::uint64_t lo, hi;
    __asm__ volatile(
        "RDTSCP\\n\\t"     // serialised read; after prior stores
        "mov %%rdx, %0\\n\\t"
        "mov %%rax, %1\\n\\t"
        "CPUID"            // prevent future ops from moving above
        : "=r"(hi), "=r"(lo)
        :: "%rax", "%rbx", "%rcx", "%rdx"
    );
    return (hi << 32) | lo;
}

// Convert cycles to nanoseconds: ns = cycles * 1e9 / cpu_freq_hz
// Obtain freq once via clock_gettime calibration or /proc/cpuinfo.`,
    explanation:
      "RDTSCP is the standard HFT latency probe: it costs 3-10 cycles, measures wall clock in the CPU's native unit, and does not trigger a syscall. The CPUID serialisation prevents the CPU reordering instructions across the measurement boundary.",
  },
  {
    id: "cpp-20260522-b1-digital-option",
    language: "cpp",
    title: "Digital (cash-or-nothing) option pricing",
    tag: "quant",
    code: `#include <cmath>

// Cumulative standard normal.
static double ncdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }

// Cash-or-nothing: pays $1 if S_T > K, 0 otherwise.
// Call:  e^{-rT} * N(d2)
// Put:   e^{-rT} * N(-d2)
struct DigitalPrices { double call, put; };

DigitalPrices digital_bs(double S, double K, double r, double q,
                          double sigma, double T) {
    double sT = sigma * std::sqrt(T);
    double d1 = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / sT;
    double d2 = d1 - sT;
    double disc = std::exp(-r * T);
    return {disc * ncdf(d2), disc * ncdf(-d2)};
}

// Delta of digital call = e^{-rT} * phi(d2) / (S * sigma * sqrt(T))
// Note: near-strike digital gamma is the "pin risk" every options trader fears.
double digital_delta(double S, double K, double r, double q,
                      double sigma, double T) {
    double sT = sigma * std::sqrt(T);
    double d1 = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / sT;
    double d2 = d1 - sT;
    return std::exp(-r * T) * std::exp(-0.5 * d2 * d2) / std::sqrt(2.0 * M_PI)
           / (S * sT);
}`,
    explanation:
      "Digital options are the building blocks of barrier options and structured products. Their sharp payoff makes them extremely sensitive to spot near expiry ('pin risk') — gamma can be enormous, which is why traders 'detach' the digital using a call spread approximation.",
  },
  {
    id: "cpp-20260522-b1-forward-start-mc",
    language: "cpp",
    title: "Forward-start option Monte Carlo",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <algorithm>

// Forward-start call: at grant date t1 the strike is set as K = m * S(t1).
// Payoff at T: max(S(T) - m*S(t1), 0).
// By homogeneity: V(0) = S(0)*e^{-q*t1} * BS(1, m, r, q, sigma, T-t1).
// This MC version demonstrates the two-period simulation explicitly.
double forward_start_call_mc(double S0, double m, double r, double q,
                               double sigma, double t1, double T,
                               unsigned long n_paths = 200000) {
    std::mt19937_64 rng(42);
    std::normal_distribution<double> nd;
    double dt1 = t1;
    double dt2 = T - t1;
    double disc = std::exp(-r * T);
    double sum  = 0.0;

    for (unsigned long i = 0; i < n_paths; ++i) {
        // Simulate S(t1) and S(T) along the same GBM path.
        double lnS_t1 = std::log(S0)
                      + (r - q - 0.5 * sigma * sigma) * dt1
                      + sigma * std::sqrt(dt1) * nd(rng);
        double St1 = std::exp(lnS_t1);
        double K   = m * St1;   // strike set at grant date

        double lnS_T = lnS_t1
                     + (r - q - 0.5 * sigma * sigma) * dt2
                     + sigma * std::sqrt(dt2) * nd(rng);
        double ST = std::exp(lnS_T);
        sum += std::max(ST - K, 0.0);
    }
    return disc * sum / static_cast<double>(n_paths);
}`,
    explanation:
      "Forward-start options appear in employee stock plans, ratchet products, and cliquet structures. The analytic shortcut (scale by e^{-q*t1} and price a 'normalised' option) works because GBM has stationary log-increments; the MC path makes the two-stage nature explicit for teaching.",
  },
  {
    id: "cpp-20260522-b1-cva-compute",
    language: "cpp",
    title: "CVA (Credit Valuation Adjustment) computation",
    tag: "quant",
    code: `#include <vector>
#include <cmath>

// CVA = (1-R) * sum_i DF(0,t_i) * [Q(t_{i-1}) - Q(t_i)] * EPE(t_i)
// where Q(t) = survival probability, EPE = expected positive exposure.
double compute_cva(
    const std::vector<double>& times,         // monitoring dates
    const std::vector<double>& disc_factors,  // DF(0, t_i) from risk-free curve
    const std::vector<double>& surv_probs,    // Q(tau > t_i), from CDS curve
    const std::vector<double>& epe,           // EPE at each date (from netting MC)
    double recovery = 0.40
) {
    double lgd = 1.0 - recovery;
    double cva = 0.0;
    for (std::size_t i = 0; i < times.size(); ++i) {
        // Marginal default probability in the i-th interval.
        double q_prev = (i == 0) ? 1.0 : surv_probs[i - 1];
        double pd     = q_prev - surv_probs[i];
        cva += lgd * disc_factors[i] * pd * epe[i];
    }
    return cva;
}

// DVA (debt valuation adjustment) is symmetric: replace EPE with ENE
// and use the bank's own survival probability.
// Bilateral CVA = CVA - DVA (reduces book value when own credit worsens).`,
    explanation:
      "CVA is a P&L charge reflecting the possibility the counterparty defaults while the trade has positive mark-to-market. Post-2008 regulation requires dealers to hold capital against CVA volatility (CVA VaR). EPE is usually generated by a Monte Carlo simulation of the netting set.",
  },
  {
    id: "cpp-20260522-b1-flat-sorted-vec",
    language: "cpp",
    title: "Flat sorted-vector set (small N, cache-friendly)",
    tag: "quant",
    code: `#include <vector>
#include <algorithm>

// For small N (say < 64 elements), a sorted vector beats std::set:
// binary search stays in cache; no pointer-chasing through a tree.
template <class T>
class FlatSet {
    std::vector<T> data;
public:
    bool insert(const T& v) {
        auto it = std::lower_bound(data.begin(), data.end(), v);
        if (it != data.end() && *it == v) return false; // already present
        data.insert(it, v);   // shifts right; O(n) but n is small
        return true;
    }
    bool contains(const T& v) const {
        auto it = std::lower_bound(data.begin(), data.end(), v);
        return it != data.end() && *it == v;
    }
    bool erase(const T& v) {
        auto it = std::lower_bound(data.begin(), data.end(), v);
        if (it == data.end() || *it != v) return false;
        data.erase(it);
        return true;
    }
    const std::vector<T>& sorted_range() const { return data; }
    std::size_t size() const { return data.size(); }
};`,
    explanation:
      "std::set uses a red-black tree with pointer-chasing that evicts the cache on every node visit. For small sets (symbol whitelist, active order IDs per level) a sorted vector fits in 2-3 cache lines and binary search is faster despite the O(n) insert.",
  },
  {
    id: "cpp-20260522-b1-sv-tokenizer",
    language: "cpp",
    title: "string_view zero-copy message tokenizer",
    tag: "quant",
    code: `#include <string_view>
#include <vector>
#include <cstddef>

// Split a raw market-data record into fields without any allocation.
// string_view is a non-owning slice — perfect for parsing fixed-wire formats.
std::vector<std::string_view> tokenize(std::string_view msg, char delim = '|') {
    std::vector<std::string_view> fields;
    fields.reserve(16);  // typical field count
    std::size_t start = 0;
    while (true) {
        auto end = msg.find(delim, start);
        if (end == std::string_view::npos) {
            fields.push_back(msg.substr(start));
            break;
        }
        fields.push_back(msg.substr(start, end - start));
        start = end + 1;
    }
    return fields;
}

// Example use: parse a UTDF/CSV price update.
// "AAPL|250.10|100|1716000000000"
// fields[0]="AAPL", fields[1]="250.10", ...
// All string_views point into the original buffer — zero copies, zero allocations.`,
    explanation:
      "string_view tokenization is the idiomatic zero-copy way to parse high-throughput market data in modern C++. The entire parsing pass touches the message buffer only once, which matters when you're processing millions of messages per second.",
  },
  {
    id: "cpp-20260522-b1-type-erasure",
    language: "cpp",
    title: "Type erasure — AnySignal concept wrapper",
    tag: "quant",
    code: `#include <memory>

// Type erasure: expose a single non-template interface that can hold
// any signal type without a common base class in user code.
struct AnySignal {
private:
    struct Base {
        virtual double compute(double px) = 0;
        virtual ~Base() = default;
    };
    template <class T>
    struct Holder : Base {
        T impl;
        explicit Holder(T t) : impl(std::move(t)) {}
        double compute(double px) override { return impl.compute(px); }
    };
    std::unique_ptr<Base> p;
public:
    template <class T>
    explicit AnySignal(T t) : p(std::make_unique<Holder<T>>(std::move(t))) {}

    double compute(double px) { return p->compute(px); }
};

// Any struct with a compute(double) -> double method works:
struct MomoSignal { double last = 0; double compute(double px) {
    double d = px - last; last = px; return d; }};
struct VwapSignal { double sum_pv = 0, sum_v = 0;
    double compute(double px) { sum_pv += px; sum_v += 1; return sum_pv/sum_v; }};`,
    explanation:
      "Type erasure (the pattern underlying std::function and std::any) lets you store heterogeneous objects in a uniform container without virtual inheritance in the user types. The virtual dispatch happens once per call inside the Holder, not in user code.",
  },
  {
    id: "cpp-20260522-b1-std-barrier",
    language: "cpp",
    title: "std::barrier for phased parallel computation (C++20)",
    tag: "quant",
    code: `#include <barrier>
#include <thread>
#include <vector>
#include <numeric>
#include <iostream>

// std::barrier: N threads rendezvous at the barrier; the completion function
// runs once when all arrive, then all threads are released for the next phase.
void parallel_reduce(std::vector<double>& data, int n_threads) {
    std::size_t n = data.size();
    std::vector<double> partial(n_threads, 0.0);
    double total = 0.0;

    // Completion callback: called once when all threads hit the barrier.
    std::barrier sync(n_threads, [&]() noexcept {
        total = std::accumulate(partial.begin(), partial.end(), 0.0);
        std::cout << "phase done, total=" << total << "\\n";
    });

    auto worker = [&](int id) {
        std::size_t chunk = n / n_threads;
        std::size_t lo = id * chunk;
        std::size_t hi = (id + 1 == n_threads) ? n : lo + chunk;
        // Phase 1: local reduce
        partial[id] = std::accumulate(data.begin() + lo, data.begin() + hi, 0.0);
        sync.arrive_and_wait();   // barrier — all partial sums ready
        // Phase 2: each thread can now use 'total'
    };

    std::vector<std::thread> ts;
    for (int i = 0; i < n_threads; ++i) ts.emplace_back(worker, i);
    for (auto& t : ts) t.join();
}`,
    explanation:
      "std::barrier replaces the ad-hoc mutex+counter patterns used before C++20. The completion function is ideal for reduce-and-broadcast steps: risk aggregation across sub-portfolios, end-of-batch PnL roll-ups, or barrier-synchronised simulation phases.",
  },
  {
    id: "cpp-20260522-b1-branchless-ops",
    language: "cpp",
    title: "Branchless integer ops (cmov-friendly)",
    tag: "quant",
    code: `#include <cstdint>
#include <cstring>

// Arithmetic right-shift fills with sign bit: -1 for negative, 0 for positive.
inline std::int64_t iabs64(std::int64_t x) {
    std::int64_t mask = x >> 63;
    return (x ^ mask) - mask;
}

// Branchless sign: -1, 0, +1
inline int isign(std::int64_t x) {
    return (int)((x > 0) - (x < 0));
}

// Branchless clamp — modern compilers emit cmov, not a branch.
inline std::int64_t iclamp(std::int64_t x, std::int64_t lo, std::int64_t hi) {
    x = x < lo ? lo : x;
    x = x > hi ? hi : x;
    return x;
}

// Branchless conditional swap (sort network building block).
inline void cswap(int& a, int& b) {
    int diff = (a - b) & ((a - b) >> 31);  // diff if a < b, else 0
    a -= diff;
    b += diff;
}

// Why it matters: in a hot order-book matching loop a mispredicted branch
// costs 15-20 cycles; a cmov costs 1-3.`,
    explanation:
      "Branchless code removes data-dependent branches whose outcomes the CPU cannot predict well. The arithmetic-right-shift trick for iabs is a classic; modern compilers often generate cmov from the ternary form, but explicit branchless code makes the intent clear and avoids compiler-version surprises.",
  },
  {
    id: "cpp-20260522-b1-g2plus-sim",
    language: "cpp",
    title: "G2++ two-factor Gaussian short-rate simulation",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>

// G2++ model: r(t) = x(t) + y(t) + phi(t)  (phi = fitting to term structure)
// dx = -a*x*dt + sigma1*dW1
// dy = -b*y*dt + sigma2*dW2
// Corr(dW1, dW2) = rho
// Exact OU discrete step: x(t+dt) = x(t)*exp(-a*dt) + vol_x * Z1
struct G2ppParams { double a, b, sigma1, sigma2, rho; };

struct G2ppPath {
    std::vector<double> x, y;   // factor paths
};

G2ppPath g2pp_simulate(G2ppParams p, double x0, double y0,
                        double T, int N, std::mt19937_64& rng) {
    double dt  = T / N;
    double ex  = std::exp(-p.a * dt);
    double ey  = std::exp(-p.b * dt);
    double sx  = p.sigma1 * std::sqrt((1.0 - ex*ex) / (2.0 * p.a));
    double sy  = p.sigma2 * std::sqrt((1.0 - ey*ey) / (2.0 * p.b));
    double rho2 = std::sqrt(1.0 - p.rho * p.rho);  // Cholesky second factor

    std::normal_distribution<double> nd;
    G2ppPath path;
    path.x.reserve(N+1); path.y.reserve(N+1);
    double xv = x0, yv = y0;
    path.x.push_back(xv); path.y.push_back(yv);

    for (int i = 0; i < N; ++i) {
        double z1 = nd(rng);
        double z2 = p.rho * z1 + rho2 * nd(rng);  // correlated normal
        xv = ex * xv + sx * z1;
        yv = ey * yv + sy * z2;
        path.x.push_back(xv);
        path.y.push_back(yv);
    }
    return path;
}`,
    explanation:
      "G2++ is the two-factor Gaussian model popularised by Brigo & Mercurio. Two mean-reverting factors allow a richer yield curve shape than Vasicek; exact discrete simulation via the Cholesky decomposition avoids Euler discretisation error. Used for swaption pricing and CVA simulations.",
  },
  {
    id: "cpp-20260522-b1-sse3-hsum",
    language: "cpp",
    title: "SSE3 horizontal sum of float/double vectors",
    tag: "quant",
    code: `#include <immintrin.h>   // SSE3 / AVX intrinsics

// Sum 4 floats in a __m128 register using SSE3 hadd.
// Two hadd instructions collapse [a,b,c,d] -> [a+b+c+d, ...].
inline float hsum_ps(__m128 v) {
    __m128 s = _mm_hadd_ps(v, v);   // [a+b, c+d, a+b, c+d]
    s = _mm_hadd_ps(s, s);          // [a+b+c+d, ...]
    return _mm_cvtss_f32(s);
}

// Sum 4 doubles in a __m256d register (AVX).
inline double hsum_pd4(__m256d v) {
    __m128d lo  = _mm256_castpd256_pd128(v);          // low 128: v[0], v[1]
    __m128d hi  = _mm256_extractf128_pd(v, 1);         // high 128: v[2], v[3]
    __m128d sum = _mm_add_pd(lo, hi);                  // [v[0]+v[2], v[1]+v[3]]
    __m128d s2  = _mm_shuffle_pd(sum, sum, 0x01);      // swap lanes
    return _mm_cvtsd_f64(_mm_add_pd(sum, s2));          // final add
}

// Dot product of two float arrays (n must be multiple of 4).
float dot_ps(const float* a, const float* b, int n) {
    __m128 acc = _mm_setzero_ps();
    for (int i = 0; i < n; i += 4) {
        __m128 va = _mm_loadu_ps(a + i);
        __m128 vb = _mm_loadu_ps(b + i);
        acc = _mm_add_ps(acc, _mm_mul_ps(va, vb));
    }
    return hsum_ps(acc);
}`,
    explanation:
      "Horizontal reduction is the bottleneck pattern after a vectorised multiply-accumulate loop. Two haddps instructions do what would take four scalar adds; for the 256-bit AVX case, the lane-crossing penalty means extracting and adding 128-bit halves is faster than using _mm256_hadd_pd twice.",
  },
  {
    id: "cpp-20260522-b1-inventory-quote",
    language: "cpp",
    title: "Inventory-skewed market-maker quotes (Avellaneda–Stoikov)",
    tag: "quant",
    code: `#include <cmath>

// Avellaneda-Stoikov reservation price and optimal spread.
// r = s - q * gamma * sigma^2 * T   (skew mid by inventory q)
// spread = gamma * sigma^2 * T + (2/gamma) * ln(1 + gamma/kappa)
// s=mid, q=signed inventory, gamma=risk-aversion, kappa=order-arrival intensity.
struct Quote { double bid, ask; };

Quote as_quotes(double mid,   // current market mid
                double q,     // net inventory (+ = long)
                double sigma, // price vol per unit time
                double gamma, // risk aversion (>0)
                double kappa, // Poisson intensity of market orders
                double T)     // remaining horizon (seconds)
{
    double risk_factor  = gamma * sigma * sigma * T;
    double reservation  = mid - q * risk_factor;   // shift away from inventory
    double half_spread  = risk_factor / 2.0
                        + std::log(1.0 + gamma / kappa) / gamma;
    return {reservation - half_spread, reservation + half_spread};
}

// Rule: long inventory -> reservation price < mid -> bid is lower,
// ask is lower too -> more likely to hit your ask and unwind the long.`,
    explanation:
      "Inventory skewing is the core insight in continuous market making: a long position biases quotes downward to attract selling, reducing inventory risk. The gamma term balances profit from the spread against the cost of holding adverse inventory.",
  },
  {
    id: "cpp-20260522-b1-fx-triangular",
    language: "cpp",
    title: "Triangular FX arbitrage detection (DFS)",
    tag: "quant",
    code: `#include <string>
#include <unordered_map>
#include <vector>
#include <cmath>
#include <functional>

// Detect 3-way FX cycle: USD->EUR->GBP->USD with profit > 0.
// Uses DFS over currency nodes with running log-product of rates.
using RateMatrix = std::unordered_map<std::string,
                   std::unordered_map<std::string, double>>;

bool dfs_arb(const RateMatrix& fx, const std::string& start,
             const std::string& cur, double log_rate, int depth,
             std::vector<bool>& visited,
             const std::vector<std::string>& nodes)
{
    if (depth == 3) {
        // Check if we can return to start with profit
        auto it = fx.find(cur);
        if (it == fx.end()) return false;
        auto jt = it->second.find(start);
        if (jt == it->second.end()) return false;
        return log_rate + std::log(jt->second) > 0.0;  // arbitrage
    }
    for (std::size_t i = 0; i < nodes.size(); ++i) {
        if (visited[i]) continue;
        auto it = fx.find(cur);
        if (it == fx.end()) continue;
        auto jt = it->second.find(nodes[i]);
        if (jt == it->second.end()) continue;
        visited[i] = true;
        if (dfs_arb(fx, start, nodes[i], log_rate + std::log(jt->second),
                    depth + 1, visited, nodes))
            return true;
        visited[i] = false;
    }
    return false;
}`,
    explanation:
      "Log-rates convert the multiplicative arbitrage condition (product > 1) into an additive one (sum > 0), enabling the same algorithms used for negative-cycle detection. For more than 3 currencies, Bellman-Ford on the negative-log-rate graph finds the optimal arbitrage cycle in O(V*E).",
  },
  {
    id: "cpp-20260522-b1-delta-encode",
    language: "cpp",
    title: "Delta-encoded price stream (market data compression)",
    tag: "quant",
    code: `#include <vector>
#include <cstdint>

// Market data feeds often delta-encode prices: send the difference from
// the last price rather than the absolute tick. Fits in fewer bytes.
class DeltaEncoder {
    std::int64_t last = 0;
public:
    std::int32_t encode(std::int64_t price) {
        std::int32_t delta = static_cast<std::int32_t>(price - last);
        last = price;
        return delta;  // typically fits in int16 or even int8 for liquid symbols
    }
};

class DeltaDecoder {
    std::int64_t last = 0;
public:
    std::int64_t decode(std::int32_t delta) {
        last += delta;
        return last;
    }
};

// Variable-length encoding (ZigZag + VarInt) shrinks further:
// small positive/negative deltas encode in 1-2 bytes.
std::uint32_t zigzag_encode(std::int32_t n) {
    return static_cast<std::uint32_t>((n << 1) ^ (n >> 31));
}
std::int32_t zigzag_decode(std::uint32_t n) {
    return static_cast<std::int32_t>((n >> 1) ^ -(std::int32_t)(n & 1));
}`,
    explanation:
      "Price deltas are typically 0-5 ticks, so a 64-bit absolute tick fits in a 8-bit delta most of the time. Delta-then-ZigZag-then-VarInt encoding is the basis of Google's Protocol Buffers and most market data compression schemes.",
  },
  {
    id: "cpp-20260522-b1-explicit-euler-bs",
    language: "cpp",
    title: "Explicit Euler PDE pricer (log-space grid)",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Solve BS PDE in log-space x = ln(S) on uniform grid.
// March forward in tau (time-to-expiry): V^{n+1} = A * V^n.
// CFL stability: dt * sigma^2 / dx^2 <= 1.
double explicit_euler_call(double S, double K, double r, double sigma,
                            double T, int M = 300, int N = 200) {
    double x_lo = std::log(K * 0.05);
    double x_hi = std::log(K * 15.0);
    double dx = (x_hi - x_lo) / M;
    double dt = T / N;   // caller must ensure CFL: dt <= dx^2 / sigma^2

    std::vector<double> V(M + 1);
    for (int i = 0; i <= M; ++i)
        V[i] = std::max(std::exp(x_lo + i * dx) - K, 0.0);

    double nu = r - 0.5 * sigma * sigma;
    double a  = 0.5 * dt * (sigma * sigma / (dx * dx) - nu / dx);
    double bb = 1.0 - dt * (sigma * sigma / (dx * dx) + r);
    double c  = 0.5 * dt * (sigma * sigma / (dx * dx) + nu / dx);

    std::vector<double> Vn(M + 1);
    for (int n = 0; n < N; ++n) {
        double tau = (n + 1) * dt;
        for (int i = 1; i < M; ++i)
            Vn[i] = a * V[i-1] + bb * V[i] + c * V[i+1];
        Vn[0] = 0.0;
        Vn[M] = std::exp(x_hi) - K * std::exp(-r * tau);
        std::swap(V, Vn);
    }
    double x = std::log(S);
    int idx  = std::max(1, std::min(M-1,
                   static_cast<int>((x - x_lo) / dx)));
    double f = (x - (x_lo + idx * dx)) / dx;
    return V[idx] + f * (V[idx+1] - V[idx]);
}`,
    explanation:
      "The explicit Euler scheme is the simplest PDE solver — each grid point updates independently from the previous time layer, with no linear system to solve. Its conditional stability (CFL constraint) is the price: finer spatial grids force proportionally smaller time steps. Crank-Nicolson is unconditionally stable but requires a tridiagonal solve.",
  },
  {
    id: "cpp-20260522-b1-thread-local-stats",
    language: "cpp",
    title: "Thread-local per-core statistics (no atomic)",
    tag: "quant",
    code: `#include <cstdint>
#include <vector>
#include <thread>

// thread_local gives each thread its own copy — no atomic, no contention.
// Critical in hot paths: atomic fetch_add serialises across cores.
struct CoreStats {
    std::uint64_t rx_msgs    = 0;
    std::uint64_t rx_bytes   = 0;
    std::uint64_t orders_out = 0;
    std::uint64_t fills      = 0;
};

thread_local CoreStats tl_stats;

void on_message_received(std::uint64_t len) {
    ++tl_stats.rx_msgs;           // pure register operation — uncontended
    tl_stats.rx_bytes += len;
}
void on_order_sent()  { ++tl_stats.orders_out; }
void on_fill()        { ++tl_stats.fills; }

// Aggregate: collect each thread's copy into a global total.
// Safe to call only after all worker threads are idle / at a barrier.
CoreStats aggregate(const std::vector<CoreStats*>& per_thread) {
    CoreStats total;
    for (const auto* s : per_thread) {
        total.rx_msgs    += s->rx_msgs;
        total.rx_bytes   += s->rx_bytes;
        total.orders_out += s->orders_out;
        total.fills      += s->fills;
    }
    return total;
}`,
    explanation:
      "Thread-local storage is the zero-contention way to accumulate per-thread metrics that are only read periodically. Replacing a hot std::atomic<uint64_t>::fetch_add with a thread_local increment can easily be 10x cheaper in a multi-core feed handler.",
  },
  {
    id: "cpp-20260522-b1-variant-dispatch",
    language: "cpp",
    title: "std::variant + std::visit for order event dispatch",
    tag: "quant",
    code: `#include <variant>
#include <iostream>
#include <string>

struct NewOrder   { int id; double price; int qty; std::string sym; };
struct CancelOrder{ int id; };
struct FillReport { int id; double fill_px; int fill_qty; };

// Tagged union — exhaustive handling enforced by the compiler.
using OrderEvent = std::variant<NewOrder, CancelOrder, FillReport>;

struct EventHandler {
    void operator()(const NewOrder& o) const {
        std::cout << "NEW  " << o.sym << " id=" << o.id
                  << " px=" << o.price << " qty=" << o.qty << "\\n";
    }
    void operator()(const CancelOrder& c) const {
        std::cout << "CXLD id=" << c.id << "\\n";
    }
    void operator()(const FillReport& f) const {
        std::cout << "FILL id=" << f.id
                  << " px=" << f.fill_px << " qty=" << f.fill_qty << "\\n";
    }
};

void process_event(const OrderEvent& ev) {
    std::visit(EventHandler{}, ev);
}`,
    explanation:
      "std::variant is a discriminated union with compile-time exhaustiveness: if you add a new event type and forget to handle it in the visitor, the code won't compile. This is far safer than an enum + switch where new cases silently fall through.",
  },
  {
    id: "cpp-20260522-b1-fnv1a-hash",
    language: "cpp",
    title: "FNV-1a compile-time string hash for switch dispatch",
    tag: "quant",
    code: `#include <cstdint>
#include <string_view>

// FNV-1a: fast, reasonably uniform, and constexpr — usable in case labels.
constexpr std::uint32_t fnv1a(std::string_view s,
                                std::uint32_t h = 2166136261u) {
    for (unsigned char c : s)
        h = (h ^ c) * 16777619u;
    return h;
}

// String dispatch without if-else chains or std::unordered_map overhead.
void handle_msg_type(std::string_view msg_type) {
    switch (fnv1a(msg_type)) {
    case fnv1a("NewOrder"):
        /* handle new order */ break;
    case fnv1a("Cancel"):
        /* handle cancel    */ break;
    case fnv1a("Replace"):
        /* handle replace   */ break;
    default:
        /* unknown          */ break;
    }
}

// All case labels are evaluated at compile time (constexpr).
// The switch body is a single jump-table lookup — O(1) dispatch.
// Collision probability ~ 1/2^32 per pair, acceptable for a known message set.`,
    explanation:
      "Compile-time FNV-1a turns string dispatch into a jump table without any hash map allocation or string comparison in the hot path. An alternative is gperf (perfect hash generator), but FNV-1a in a switch compiles to the same optimal code for small message-type sets.",
  },
  {
    id: "cpp-20260522-b1-almgren-chriss",
    language: "cpp",
    title: "Almgren–Chriss optimal execution trajectory",
    tag: "quant",
    code: `#include <cmath>
#include <vector>

// Almgren-Chriss: sell X shares over N periods to minimise
// E[cost] + lambda * Var[cost].
// Optimal holdings: x_j = X * sinh(kappa*(N-j)*tau) / sinh(kappa*N*tau)
// kappa = sqrt(lambda * sigma^2 / eta_tilde)
//   lambda    = risk aversion
//   sigma     = price vol per period
//   eta_tilde = temporary impact coefficient ($ per share per lot/period)
struct ACParams {
    double X;        // total shares to liquidate
    int    N;        // number of periods
    double sigma;    // per-period price vol (annualised / sqrt(252) for daily)
    double lambda;   // risk aversion
    double eta;      // temporary market-impact coefficient
};

std::vector<double> ac_holdings(const ACParams& p) {
    double kappa = std::sqrt(p.lambda * p.sigma * p.sigma / p.eta);
    std::vector<double> x(p.N + 1);
    double denom = std::sinh(kappa * p.N);
    for (int j = 0; j <= p.N; ++j)
        x[j] = p.X * std::sinh(kappa * (p.N - j)) / denom;
    return x;  // x[j] = shares held entering period j; x[N] = 0
}`,
    explanation:
      "Almgren-Chriss is the foundational continuous execution model: the optimal trajectory is a hyperbolic sine schedule that accelerates trading when kappa is large (high risk aversion or slow liquidation). It balances market impact cost against timing risk, giving a Pareto-efficient frontier of (expected cost, variance).",
  },
  {
    id: "cpp-20260522-b1-spinlock-pause",
    language: "cpp",
    title: "Spinlock with PAUSE instruction (HFT-grade)",
    tag: "quant",
    code: `#include <atomic>
#include <immintrin.h>   // _mm_pause

// Spinlock faster than std::mutex for critical sections < ~200 ns.
// The PAUSE instruction: reduces power consumption and
// speeds up memory-order violation recovery in hyperthreading.
class SpinLock {
    std::atomic<bool> locked{false};
public:
    void lock() noexcept {
        for (;;) {
            // Test-test-and-set: avoid hammering the cache line with CAS.
            if (!locked.load(std::memory_order_relaxed) &&
                !locked.exchange(true, std::memory_order_acquire))
                return;
            _mm_pause();   // hints the CPU about spin-wait; ~10 cycles
        }
    }
    void unlock() noexcept {
        locked.store(false, std::memory_order_release);
    }
    // RAII guard
    struct Guard {
        SpinLock& s;
        explicit Guard(SpinLock& sl) : s(sl) { s.lock(); }
        ~Guard() { s.unlock(); }
    };
};`,
    explanation:
      "The test-test-and-set pattern avoids broadcasting a write to every core when the lock is already held — the fast path is a read-only load that hits the L1 cache. _mm_pause reduces pipeline hazards in the spin loop and is mandatory for correct hyperthreading behaviour.",
  },
];
