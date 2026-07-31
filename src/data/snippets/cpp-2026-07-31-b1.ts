import type { Snippet } from "./types";

export const cppSnippets20260731B1: Snippet[] = [
  {
    id: "cpp-20260731-b1-ranges-pipeline",
    language: "cpp",
    title: "C++20 Ranges Pipeline for PnL Filtering",
    tag: "modern-cpp",
    code: `#include <ranges>
#include <vector>
#include <print>

int main() {
    std::vector<double> pnl = {-1.2, 3.4, -0.5, 2.1, -0.8, 4.7, -1.1};

    // Lazy pipeline: keep positive days only
    auto pos = pnl
        | std::views::filter([](double x) { return x > 0; });

    double total = std::ranges::fold_left(pos, 0.0, std::plus<double>{});

    for (auto [i, v] : std::views::enumerate(pos))
        std::println("Day {}: {:.2f}", i, v);
    std::println("Sum positive PnL: {:.2f}", total);
}`,
    explanation: "C++20 views compose lazily — no intermediate allocation. std::ranges::fold_left (C++23) replaces std::accumulate. views::enumerate yields index–value pairs without a counter variable."
  },
  {
    id: "cpp-20260731-b1-avx2-fma",
    language: "cpp",
    title: "AVX2 FMA Dot Product (Portfolio Beta)",
    tag: "simd",
    code: `#include <immintrin.h>
#include <cstddef>

// 8-wide float dot product using FMA: one instruction for a*b+c
float dot_avx2_fma(const float* __restrict__ a,
                   const float* __restrict__ b, std::size_t n) {
    __m256 acc = _mm256_setzero_ps();
    std::size_t i = 0;
    for (; i + 8 <= n; i += 8)
        acc = _mm256_fmadd_ps(_mm256_loadu_ps(a + i),
                              _mm256_loadu_ps(b + i), acc);
    // Horizontal sum across 8 lanes
    __m128 lo = _mm256_castps256_ps128(acc);
    __m128 hi = _mm256_extractf128_ps(acc, 1);
    lo = _mm_add_ps(lo, hi);
    lo = _mm_hadd_ps(lo, lo);
    lo = _mm_hadd_ps(lo, lo);
    float r = _mm_cvtss_f32(lo);
    for (; i < n; ++i) r += a[i] * b[i];  // scalar tail
    return r;
}`,
    explanation: "_mm256_fmadd_ps computes a*b+c in one FMA instruction with no intermediate rounding. __restrict__ signals no aliasing. Horizontal sum reduces 8 lanes via two _mm_hadd_ps calls. Use for Greeks, covariance row products, or factor loadings."
  },
  {
    id: "cpp-20260731-b1-rdtsc-timer",
    language: "cpp",
    title: "RDTSC Cycle-Accurate Latency Probe",
    tag: "low-latency",
    code: `#include <cstdint>
#include <x86intrin.h>

// RDTSCP is partially serializing: waits for all prior instructions to retire
inline uint64_t rdtscp_now() {
    unsigned aux;
    return __rdtscp(&aux);  // aux = processor ID (ignored)
}

struct CycleTimer {
    uint64_t t0 = 0;
    void   start()          { t0 = rdtscp_now(); }
    uint64_t stop() const   { return rdtscp_now() - t0; }
    // To convert to ns: ns = cycles / cpu_ghz  (calibrate offline via /proc/cpuinfo)
};

// Usage:
// CycleTimer tm; tm.start(); send_order(msg); auto lat = tm.stop();`,
    explanation: "__rdtscp serializes the instruction stream so measurements aren't reordered. Calibrate CPU GHz offline (compare RDTSC delta to a 1-second wall-clock sleep). Use for sub-microsecond latency tracking in the critical path."
  },
  {
    id: "cpp-20260731-b1-heston-euler",
    language: "cpp",
    title: "Heston Stochastic-Vol Euler-Maruyama Monte Carlo",
    tag: "stochastic-vol",
    code: `#include <cmath>
#include <random>
#include <algorithm>

double heston_mc_call(double S0, double v0, double K, double T,
                      double r, double kappa, double theta,
                      double xi, double rho, int N, int M) {
    std::mt19937_64 rng(42);
    std::normal_distribution<double> nd;
    const double dt = T / N;
    double payoff = 0.0;
    for (int m = 0; m < M; ++m) {
        double S = S0, v = v0;
        for (int n = 0; n < N; ++n) {
            double z1 = nd(rng);
            double z2 = rho * z1 + std::sqrt(1.0 - rho * rho) * nd(rng);
            double vp = std::max(v, 0.0);          // full truncation
            S *= std::exp((r - 0.5 * vp) * dt + std::sqrt(vp * dt) * z1);
            v  += kappa * (theta - vp) * dt + xi * std::sqrt(vp * dt) * z2;
        }
        payoff += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * payoff / M;
}`,
    explanation: "Full-truncation Euler (Lord et al. 2010) prevents negative variance by flooring v at zero before use. Correlated Brownians via Cholesky: z2 = rho*z1 + sqrt(1-rho^2)*z_indep. For higher accuracy near the Feller boundary use the QE scheme (Andersen 2008)."
  },
  {
    id: "cpp-20260731-b1-cir-exact",
    language: "cpp",
    title: "CIR Model Exact Simulation via Poisson Mixing",
    tag: "interest-rates",
    code: `#include <cmath>
#include <random>

// Brigo-Mercurio exact CIR transition:
// r(t+dt) = c * chi2(d + 2*Poisson(lambda/2))
// c = sigma^2*(1-e^{-k*dt})/(4k),  d = 4k*theta/sigma^2
double cir_exact_step(double r, double kappa, double theta,
                      double sigma, double dt, std::mt19937_64& rng) {
    const double ekdt = std::exp(-kappa * dt);
    const double c    = sigma * sigma * (1.0 - ekdt) / (4.0 * kappa);
    const double d    = 4.0 * kappa * theta / (sigma * sigma);
    const double lam  = 4.0 * kappa * r * ekdt
                        / (sigma * sigma * (1.0 - ekdt));
    std::poisson_distribution<int>       pois(lam / 2.0);
    std::chi_squared_distribution<double> chi2(d + 2.0 * pois(rng));
    return c * chi2(rng);
}`,
    explanation: "Exact CIR simulation avoids Euler bias. The noncentral chi-squared is sampled by Poisson mixing: draw k ~ Poisson(lambda/2), then chi2(d + 2k). Guarantees non-negative rates. Required: 2*kappa*theta > sigma^2 (Feller condition) for zero to be inaccessible."
  },
  {
    id: "cpp-20260731-b1-dupire-localvol",
    language: "cpp",
    title: "Dupire Local Volatility from Call Price Grid",
    tag: "vol-surface",
    code: `#include <cmath>
#include <vector>

// Dupire (1994): sigma_loc^2(K,T) = (dC/dT + r*K*dC/dK) / (0.5*K^2 * d^2C/dK^2)
// Requires smooth call prices; fit SVI or spline to implied vols first.
struct DupireGrid {
    std::vector<double> T, K;
    std::vector<std::vector<double>> C;  // C[iT][iK] = BS call price

    double local_var(int iT, int iK, double r) const {
        const double dT  = (T[iT+1] - T[iT-1]) / 2.0;
        const double dK  = (K[iK+1] - K[iK-1]) / 2.0;
        const double CT  = (C[iT+1][iK]   - C[iT-1][iK])   / (2.0 * dT);
        const double CK  = (C[iT][iK+1]   - C[iT][iK-1])   / (2.0 * dK);
        const double CKK = (C[iT][iK+1] - 2.0*C[iT][iK]
                            + C[iT][iK-1]) / (dK * dK);
        const double num = CT + r * K[iK] * CK;
        const double den = 0.5 * K[iK] * K[iK] * CKK;
        return std::max(num / den, 0.0);  // floor at zero
    }
};`,
    explanation: "Dupire formula turns the market call-price surface into a local-vol function sigma(K,T). CKK > 0 is the no-butterfly-arbitrage condition. CT > 0 is the no-calendar-arbitrage condition. Smooth the IV surface with SVI or a cubic spline before finite differencing."
  },
  {
    id: "cpp-20260731-b1-digital-option",
    language: "cpp",
    title: "Digital (Binary) Option Pricing — Black-Scholes",
    tag: "derivatives",
    code: `#include <cmath>

static double ncdf(double x) { return 0.5 * std::erfc(-x * M_SQRT1_2); }

// Cash-or-nothing call: pays 1 unit if S_T > K
double digital_call(double S, double K, double T,
                    double r, double q, double vol) {
    double d2 = (std::log(S/K) + (r - q - 0.5*vol*vol)*T)
                 / (vol * std::sqrt(T));
    return std::exp(-r*T) * ncdf(d2);
}

// Asset-or-nothing call: pays S_T if S_T > K  (used in BS decomposition)
double asset_or_nothing_call(double S, double K, double T,
                             double r, double q, double vol) {
    double d1 = (std::log(S/K) + (r - q + 0.5*vol*vol)*T)
                 / (vol * std::sqrt(T));
    return S * std::exp(-q*T) * ncdf(d1);
}

// Vanilla call = asset_or_nothing(d1) - K*e^{-rT} * digital_call(d2)`,
    explanation: "Digital call = exp(-rT)*N(d2). Decomposes the vanilla call into an asset-or-nothing minus K*e^{-rT} times a cash-or-nothing. Digitals spike in delta near expiry — care required when hedging near the strike."
  },
  {
    id: "cpp-20260731-b1-almgren-chriss",
    language: "cpp",
    title: "Almgren-Chriss Optimal Execution Trajectory",
    tag: "execution",
    code: `#include <cmath>
#include <vector>

// Almgren-Chriss (2001): minimize E[cost] + lambda * Var[cost]
// Optimal trajectory: x(t) = X * sinh(kappa*(T-t)) / sinh(kappa*T)
// kappa = sqrt(lambda * sigma^2 / eta)
// eta = temporary impact coefficient, sigma = asset vol, lambda = risk aversion
std::vector<double> ac_trajectory(double X,      // total shares to sell
                                  double T,      // time horizon
                                  double sigma,  // daily vol
                                  double eta,    // temp impact (cost/share^2)
                                  double lambda, // risk aversion
                                  int N) {
    const double kappa = std::sqrt(lambda * sigma * sigma / eta);
    std::vector<double> traj(N + 1);
    for (int i = 0; i <= N; ++i) {
        double t = T * i / N;
        traj[i] = X * std::sinh(kappa * (T - t)) / std::sinh(kappa * T);
    }
    return traj;  // shares remaining at each time step
}`,
    explanation: "The sinh-shaped trajectory interpolates between TWAP (kappa→0) and immediate liquidation (large kappa). Higher risk aversion front-loads selling to reduce timing risk. Optimal cost = eta*X^2*kappa/(2*tanh(kappa*T/2))."
  },
  {
    id: "cpp-20260731-b1-adi-scheme",
    language: "cpp",
    title: "ADI (Alternating Direction Implicit) PDE Solver",
    tag: "pde",
    code: `#include <vector>
#include <stdexcept>

// Thomas algorithm: solve tridiagonal Ax=d in O(N)
void thomas_solve(const std::vector<double>& a,  // subdiagonal
                        std::vector<double>  b,  // diagonal (modified in-place)
                  const std::vector<double>& c,  // superdiagonal
                        std::vector<double>& d) {// rhs → solution
    int n = static_cast<int>(b.size());
    for (int i = 1; i < n; ++i) {
        double m = a[i] / b[i-1];
        b[i] -= m * c[i-1];
        d[i] -= m * d[i-1];
    }
    d[n-1] /= b[n-1];
    for (int i = n-2; i >= 0; --i)
        d[i] = (d[i] - c[i] * d[i+1]) / b[i];
}
// ADI (Craig-Sneyd): for each time step alternate between
// an S1-direction implicit sweep and an S2-direction implicit sweep.
// Each sweep calls thomas_solve for every row or column.`,
    explanation: "ADI splits a 2D parabolic PDE (e.g., basket options) into alternating 1D implicit steps, each solved in O(N) via the Thomas algorithm. Unconditionally stable for the heat equation; Craig-Sneyd variant handles mixed partial derivatives. Overall O(N^2) per time step."
  },
  {
    id: "cpp-20260731-b1-udp-mcast",
    language: "cpp",
    title: "UDP Multicast Receiver for Market Data Feeds",
    tag: "networking",
    code: `#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

// Opens a UDP multicast socket for market data (MDP 3.0, OPRA, etc.)
int open_udp_mcast(const char* mcast_addr, uint16_t port,
                   const char* iface_addr) {
    int fd = socket(AF_INET, SOCK_DGRAM, 0);
    int reuse = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse));

    sockaddr_in addr{};
    addr.sin_family      = AF_INET;
    addr.sin_port        = htons(port);
    addr.sin_addr.s_addr = inet_addr(mcast_addr);
    bind(fd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr));

    ip_mreq mreq{};
    mreq.imr_multiaddr.s_addr = inet_addr(mcast_addr);
    mreq.imr_interface.s_addr = inet_addr(iface_addr);
    setsockopt(fd, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq));
    return fd;
    // Caller: recv(fd, buf, sizeof(buf), 0) in a tight spin loop
}`,
    explanation: "Multicast is the transport for equities (CME MDP 3.0), options (OPRA), and FX feeds. Bind to the multicast group address (not INADDR_ANY for Linux). Set SO_RCVBUF to a large value to absorb bursts. Pin the receive thread to a core near the NIC NUMA node."
  },
  {
    id: "cpp-20260731-b1-flat-map",
    language: "cpp",
    title: "Flat Map (Cache-Friendly Sorted Vector) for Small Tables",
    tag: "data-structures",
    code: `#include <vector>
#include <algorithm>
#include <stdexcept>

template<typename K, typename V>
class FlatMap {
    std::vector<std::pair<K, V>> data_;
public:
    void insert(K k, V v) {
        auto it = std::lower_bound(data_.begin(), data_.end(), k,
            [](const auto& p, const K& x) { return p.first < x; });
        if (it != data_.end() && it->first == k)
            it->second = std::move(v);
        else
            data_.insert(it, {std::move(k), std::move(v)});
    }
    V& at(const K& k) {
        auto it = std::lower_bound(data_.begin(), data_.end(), k,
            [](const auto& p, const K& x) { return p.first < x; });
        if (it == data_.end() || it->first != k)
            throw std::out_of_range("FlatMap::at");
        return it->second;
    }
    bool contains(const K& k) const {
        auto it = std::lower_bound(data_.begin(), data_.end(), k,
            [](const auto& p, const K& x) { return p.first < x; });
        return it != data_.end() && it->first == k;
    }
    std::size_t size() const { return data_.size(); }
};`,
    explanation: "FlatMap beats std::map for N ≲ 100 due to cache-friendly contiguous layout. Binary search O(log N) for lookup, O(N) insert (acceptable for startup population). Common use: instrument-ID → metadata, symbol → order-book pointer in the hot path."
  },
  {
    id: "cpp-20260731-b1-shared-mutex",
    language: "cpp",
    title: "shared_mutex Reader-Writer Lock for Price Cache",
    tag: "concurrency",
    code: `#include <shared_mutex>
#include <unordered_map>
#include <string>
#include <optional>

class PriceCache {
    mutable std::shared_mutex mu_;
    std::unordered_map<std::string, double> prices_;
public:
    // Many threads may read simultaneously
    std::optional<double> get(const std::string& sym) const {
        std::shared_lock lk(mu_);
        auto it = prices_.find(sym);
        if (it == prices_.end()) return std::nullopt;
        return it->second;
    }
    // Writer takes exclusive ownership; blocks all readers
    void update(const std::string& sym, double price) {
        std::unique_lock lk(mu_);
        prices_[sym] = price;
    }
    void remove(const std::string& sym) {
        std::unique_lock lk(mu_);
        prices_.erase(sym);
    }
};`,
    explanation: "std::shared_mutex (C++17) allows N concurrent readers via shared_lock but exclusive writes via unique_lock. Ideal for read-heavy caches like real-time mark-to-market tables. On high-contention write paths, prefer a striped mutex or a lock-free map."
  },
  {
    id: "cpp-20260731-b1-false-sharing",
    language: "cpp",
    title: "False Sharing Detection and alignas Mitigation",
    tag: "performance",
    code: `#include <atomic>
#include <array>

// BAD: both counters fit in one 64-byte cache line.
// Threads writing a and b bounce the line across cores → slowdown.
struct BadCounters {
    std::atomic<long> a{0};
    std::atomic<long> b{0};
};

// GOOD: pad each counter to occupy its own cache line.
struct alignas(64) PaddedCounter {
    std::atomic<long> value{0};
    // implicit padding to 64 bytes
};

struct GoodCounters {
    PaddedCounter thread0;
    PaddedCounter thread1;
};

// Verify: static_assert(sizeof(PaddedCounter) == 64);
// Measurement: perf stat -e cache-misses ./bench`,
    explanation: "False sharing occurs when two threads write variables on the same 64-byte cache line, causing MESI traffic even though the variables are logically independent. alignas(64) moves each counter to its own line. Typical speedup: 5–20× on multi-socket systems. Confirm with perf or VTune."
  },
  {
    id: "cpp-20260731-b1-brownian-bridge",
    language: "cpp",
    title: "Brownian Bridge Interpolation (Dyadic MC Variance Reduction)",
    tag: "monte-carlo",
    code: `#include <cmath>
#include <vector>
#include <random>

// Fill W[0..N] given W[0]=0 and W[N]=wT using dyadic bisection.
// Reduces variance vs sequential Euler for barrier/path-dependent options.
std::vector<double> brownian_bridge(int N, double T, double wT,
                                    std::mt19937_64& rng) {
    std::normal_distribution<double> nd;
    std::vector<double> W(N + 1, 0.0);
    W[N] = wT;

    auto fill = [&](auto& self, int lo, int hi) -> void {
        if (hi - lo <= 1) return;
        int mid = (lo + hi) / 2;
        double tlo = T * lo / N, thi = T * hi / N, tmid = T * mid / N;
        double mu = W[lo] + (W[hi] - W[lo]) * (tmid - tlo) / (thi - tlo);
        double sg = std::sqrt((thi - tmid) * (tmid - tlo) / (thi - tlo));
        W[mid] = mu + sg * nd(rng);
        self(self, lo, mid);
        self(self, mid, hi);
    };
    fill(fill, 0, N);
    return W;
}`,
    explanation: "Brownian bridge conditions on both endpoints, filling midpoints in dyadic order. The conditional mean is linear interpolation; the conditional std is sqrt((T2-t)*(t-T1)/(T2-T1)). Used in quasi-MC and for improving barrier-option accuracy by fixing the terminal value."
  },
  {
    id: "cpp-20260731-b1-fold-left",
    language: "cpp",
    title: "C++23 fold_left for Portfolio Return Accumulation",
    tag: "modern-cpp",
    code: `#include <ranges>
#include <vector>
#include <cmath>
#include <print>

int main() {
    std::vector<double> daily_ret = {0.01, -0.02, 0.015, 0.005, -0.008, 0.02};

    // Compound growth factor via fold_left
    double growth = std::ranges::fold_left(
        daily_ret, 1.0,
        [](double acc, double r) { return acc * (1.0 + r); });
    std::println("Cumulative return: {:.4f}", growth - 1.0);

    // Sum of squared deviations for variance
    double mean = std::ranges::fold_left(daily_ret, 0.0, std::plus{})
                  / static_cast<double>(daily_ret.size());
    double var  = std::ranges::fold_left(daily_ret, 0.0,
        [mean](double acc, double r) { return acc + (r - mean) * (r - mean); })
        / static_cast<double>(daily_ret.size() - 1);
    std::println("Annualised vol: {:.4f}", std::sqrt(var * 252.0));
}`,
    explanation: "std::ranges::fold_left (C++23, <algorithm>) is the range-aware successor to std::accumulate with cleaner syntax. Left-associative; fold_right also available. Compose with views::filter or views::transform before folding for one-pass pipelines."
  },
  {
    id: "cpp-20260731-b1-avx2-hmax",
    language: "cpp",
    title: "AVX2 Horizontal Maximum of Float Array",
    tag: "simd",
    code: `#include <immintrin.h>
#include <limits>
#include <cstddef>
#include <algorithm>

// Find the maximum value across n floats — useful for payoff normalisation
float hmax_avx2(const float* a, std::size_t n) {
    __m256 vmax = _mm256_set1_ps(-std::numeric_limits<float>::infinity());
    std::size_t i = 0;
    for (; i + 8 <= n; i += 8)
        vmax = _mm256_max_ps(vmax, _mm256_loadu_ps(a + i));

    // Reduce 8 lanes to scalar
    __m128 lo = _mm256_castps256_ps128(vmax);
    __m128 hi = _mm256_extractf128_ps(vmax, 1);
    lo = _mm_max_ps(lo, hi);
    lo = _mm_max_ps(lo, _mm_shuffle_ps(lo, lo, 0x4E));  // swap 64-bit halves
    lo = _mm_max_ps(lo, _mm_shuffle_ps(lo, lo, 0xB1));  // swap adjacent
    float r = _mm_cvtss_f32(lo);
    for (; i < n; ++i) r = std::max(r, a[i]);
    return r;
}`,
    explanation: "_mm256_max_ps takes the lane-wise maximum of two 256-bit vectors. After the main loop, reduce 8 lanes: extract high 128 bits, take max with low 128 bits, then two shuffle-max steps. Shuffle 0x4E swaps 64-bit halves, 0xB1 swaps adjacent 32-bit elements."
  },
  {
    id: "cpp-20260731-b1-symbol-pool",
    language: "cpp",
    title: "Symbol Pool — String Interning for Zero-Copy Market Data",
    tag: "low-latency",
    code: `#include <unordered_set>
#include <string>
#include <string_view>

// Interning returns a stable pointer into the pool.
// Two calls with the same content return the same address.
class SymbolPool {
    std::unordered_set<std::string> pool_;
public:
    std::string_view intern(std::string_view sv) {
        auto [it, inserted] = pool_.emplace(sv);
        return *it;  // stable: set iterators don't invalidate on insert
    }
    std::size_t size() const { return pool_.size(); }
};

// Feed handler usage:
// static SymbolPool syms;
// auto sym = syms.intern(msg.ticker);     // O(1) amortized
// if (sym == "AAPL") process_apple(msg); // pointer compare`,
    explanation: "String interning makes repeated-symbol comparisons O(1) pointer equality instead of O(N) character comparison. The std::unordered_set guarantees stable iterators (no rehashing moves existing strings), so string_view into the pool remains valid. One pool per thread avoids locking."
  },
  {
    id: "cpp-20260731-b1-pmr-pool",
    language: "cpp",
    title: "PMR Pool Allocator — Stack-Backed Zero-Heap Allocation",
    tag: "memory",
    code: `#include <memory_resource>
#include <vector>
#include <array>

struct Order { int id; double price; int qty; char sym[8]; };

void process_orders() {
    // 64 KB stack buffer — no malloc/free for small order batches
    std::array<std::byte, 65536> buf;
    std::pmr::monotonic_buffer_resource mono(buf.data(), buf.size());
    std::pmr::unsynchronized_pool_resource pool(&mono);

    std::pmr::vector<Order> orders(&pool);
    orders.reserve(512);

    for (int i = 0; i < 400; ++i)
        orders.push_back({i, 100.0 + i * 0.01, 100, "AAPL"});

    // No syscalls: all allocations from the stack buffer
}  // buffer goes out of scope — nothing to free`,
    explanation: "PMR (C++17) decouples allocator choice from container type. monotonic_buffer_resource is bump-pointer allocation with O(1) allocate and no-op deallocate. unsynchronized_pool_resource adds fixed-size block recycling. Eliminates malloc overhead in per-message processing loops."
  },
  {
    id: "cpp-20260731-b1-ohlc-agg",
    language: "cpp",
    title: "OHLC Bar Aggregation from Nanosecond Tick Stream",
    tag: "market-data",
    code: `#include <cstdint>
#include <algorithm>

struct Bar {
    uint64_t open_ts = 0, close_ts = 0;
    double open = 0, high = -1e18, low = 1e18, close = 0, volume = 0;
    bool empty() const { return open_ts == 0; }
    void reset() { *this = {}; }
};

class OhlcAggregator {
    Bar bar_;
    uint64_t period_ns_;  // e.g., 1'000'000'000ULL for 1-second bars
public:
    explicit OhlcAggregator(uint64_t period_ns) : period_ns_(period_ns) {}

    // Returns true and bar is the completed bar; caller should emit before reset
    bool on_tick(uint64_t ts_ns, double price, double qty, Bar& out) {
        if (bar_.empty()) {
            bar_.open_ts = ts_ns;
            bar_.open = bar_.high = bar_.low = bar_.close = price;
        }
        bar_.high    = std::max(bar_.high, price);
        bar_.low     = std::min(bar_.low,  price);
        bar_.close   = price;
        bar_.close_ts = ts_ns;
        bar_.volume  += qty;
        if (ts_ns - bar_.open_ts >= period_ns_) {
            out = bar_; bar_.reset(); return true;
        }
        return false;
    }
};`,
    explanation: "OHLC aggregation is a fundamental market-data building block. Duration check uses nanosecond timestamps directly from the wire. Caller emits the completed bar before the aggregator resets. For irregular bar types (volume bars, tick bars), replace the duration check with a quantity threshold."
  },
  {
    id: "cpp-20260731-b1-ols-cholesky",
    language: "cpp",
    title: "OLS Regression via Cholesky — Normal Equations",
    tag: "statistics",
    code: `#include <vector>
#include <cmath>
#include <stdexcept>

// Solve (X'X) beta = X'y via Cholesky: A = L * L^T, then back-sub.
// Pass A = X'X (symmetric positive definite), b = X'y.
std::vector<double> cholesky_solve(std::vector<std::vector<double>> A,
                                   std::vector<double> b) {
    int n = static_cast<int>(A.size());
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < i; ++j) {
            double s = A[i][j];
            for (int k = 0; k < j; ++k) s -= A[i][k] * A[j][k];
            A[i][j] = s / A[j][j];
        }
        double d = A[i][i];
        for (int k = 0; k < i; ++k) d -= A[i][k] * A[i][k];
        if (d <= 0.0) throw std::runtime_error("matrix not positive definite");
        A[i][i] = std::sqrt(d);
    }
    // Forward sub: L y = b
    for (int i = 0; i < n; ++i) {
        for (int k = 0; k < i; ++k) b[i] -= A[i][k] * b[k];
        b[i] /= A[i][i];
    }
    // Back sub: L^T x = y
    for (int i = n-1; i >= 0; --i) {
        for (int k = i+1; k < n; ++k) b[i] -= A[k][i] * b[k];
        b[i] /= A[i][i];
    }
    return b;
}`,
    explanation: "Cholesky is 2× faster than LU for symmetric positive-definite systems and inherits numerical stability from the square-root structure. d ≤ 0 signals rank deficiency (multicollinearity). Use for OLS, portfolio optimisation, and Kalman filter covariance updates."
  },
  {
    id: "cpp-20260731-b1-carr-madan-fft",
    language: "cpp",
    title: "Carr-Madan FFT Option Pricing (Integrand Construction)",
    tag: "derivatives",
    code: `#include <complex>
#include <vector>
#include <cmath>
#include <functional>

using cd = std::complex<double>;

// Carr-Madan (1999): price N strikes simultaneously via FFT.
// psi(v) = e^{-rT} * phi_log(v-(alpha+1)i) / (alpha^2+alpha-v^2 + i*(2*alpha+1)*v)
// where phi_log = characteristic function of log(S_T).
std::vector<cd> carr_madan_integrand(
        double S, double T, double r, double alpha,
        int N, double eta,
        const std::function<cd(cd)>& phi_log) {
    std::vector<cd> psi(N);
    for (int j = 0; j < N; ++j) {
        double v = j * eta;
        cd u(v, -(alpha + 1.0));
        cd denom(alpha * alpha + alpha - v * v,
                 (2.0 * alpha + 1.0) * v);
        psi[j] = std::exp(-cd(0,1) * v * std::log(S))
                 * std::exp(-r * T) * phi_log(u) / denom;
    }
    return psi;  // multiply by exp(-alpha*k)/pi, then FFT
}`,
    explanation: "Carr-Madan maps the option price integral to an FFT by introducing damping parameter alpha > 0. All N strike prices result from a single FFT call: O(N log N) vs O(N) numerical integrations. Plug in any log-characteristic function (Heston, CGMY, VG, etc.)."
  },
  {
    id: "cpp-20260731-b1-convertible-bond",
    language: "cpp",
    title: "Convertible Bond Binomial Tree Pricing",
    tag: "derivatives",
    code: `#include <vector>
#include <algorithm>
#include <cmath>

// At each node the holder may convert to equity (early exercise).
// Simplified: ignores call/put features and credit spread.
double convertible_bond(double S0, double K, double T,
                        double r, double sigma,
                        double coupon_per_step, int N, double face) {
    const double dt = T / N;
    const double u  = std::exp(sigma * std::sqrt(dt));
    const double d  = 1.0 / u;
    const double p  = (std::exp(r * dt) - d) / (u - d);

    std::vector<double> S(N + 1), V(N + 1);
    for (int i = 0; i <= N; ++i)
        S[i] = S0 * std::pow(u, N - 2 * i);

    // Terminal: max(conversion value, redemption + final coupon)
    for (int i = 0; i <= N; ++i)
        V[i] = std::max(S[i], face + coupon_per_step);

    for (int t = N - 1; t >= 0; --t) {
        for (int i = 0; i <= t; ++i) {
            S[i] = S0 * std::pow(u, t - 2 * i);
            double cont = (p * V[i] + (1.0 - p) * V[i+1])
                          * std::exp(-r * dt) + coupon_per_step;
            V[i] = std::max(S[i], cont);  // optimal early conversion
        }
    }
    return V[0];
}`,
    explanation: "Convertible bond: at each node choose max(continuation + coupon, equity value). coupon_per_step = annual_coupon * T / N. For realistic pricing add: (1) issuer call provision (issuer forces conversion), (2) credit risk via risky discount rate, (3) dilution."
  },
  {
    id: "cpp-20260731-b1-type-index-dispatch",
    language: "cpp",
    title: "type_index Factory Dispatch for Order Types",
    tag: "design-patterns",
    code: `#include <typeindex>
#include <unordered_map>
#include <functional>
#include <memory>
#include <stdexcept>

struct OrderBase { virtual ~OrderBase() = default; virtual void print() const = 0; };
struct LimitOrder  : OrderBase { double price; void print() const override {} };
struct MarketOrder : OrderBase { void print() const override {} };
struct IcebergOrder: OrderBase { double visible_qty; void print() const override {} };

class OrderFactory {
    using Creator = std::function<std::unique_ptr<OrderBase>()>;
    std::unordered_map<std::type_index, Creator> reg_;
public:
    template<typename T>
    void register_type() {
        reg_[std::type_index(typeid(T))] = [] { return std::make_unique<T>(); };
    }
    template<typename T>
    std::unique_ptr<OrderBase> create() const {
        auto it = reg_.find(std::type_index(typeid(T)));
        if (it == reg_.end()) throw std::runtime_error("unregistered order type");
        return it->second();
    }
};`,
    explanation: "std::type_index wraps std::type_info for use as an unordered_map key. Register handlers once at startup; dispatch in O(1). Useful for polymorphic order processing without a fragile if-else chain. Extend by registering new order types without touching the factory."
  },
  {
    id: "cpp-20260731-b1-mpsc-two-lock",
    language: "cpp",
    title: "MPSC Two-Lock Queue (Michael-Scott)",
    tag: "concurrency",
    code: `#include <mutex>
#include <memory>

// Separate head-mutex and tail-mutex allow concurrent push/pop.
// The dummy head node prevents lock contention between producer and consumer.
template<typename T>
class TwoLockQueue {
    struct Node { T val{}; std::unique_ptr<Node> next; };
    std::unique_ptr<Node> head_;
    Node*       tail_;
    std::mutex  hmu_, tmu_;
public:
    TwoLockQueue() : head_(std::make_unique<Node>()), tail_(head_.get()) {}

    void push(T val) {
        auto node  = std::make_unique<Node>();
        node->val  = std::move(val);
        std::lock_guard lk(tmu_);
        tail_->next = std::move(node);
        tail_       = tail_->next.get();
    }

    bool pop(T& out) {
        std::lock_guard lk(hmu_);
        if (!head_->next) return false;
        out  = std::move(head_->next->val);
        head_ = std::move(head_->next);
        return true;
    }
};`,
    explanation: "Two separate mutexes allow one producer and one consumer to run concurrently. The dummy node (sentinel head) ensures head and tail always point to different nodes when the queue is non-empty, avoiding head-tail lock collision. O(1) amortized push and pop."
  },
  {
    id: "cpp-20260731-b1-mdspan-matrix",
    language: "cpp",
    title: "C++23 mdspan — Zero-Overhead Multi-Dimensional Buffer View",
    tag: "modern-cpp",
    code: `#include <mdspan>
#include <vector>
#include <numeric>
#include <print>

int main() {
    // Row-major correlation matrix stored in a flat vector
    int N = 4;
    std::vector<double> buf(N * N);
    std::iota(buf.begin(), buf.end(), 1.0);

    // Non-owning 2D view — zero allocation, zero copy
    std::mdspan<double, std::dextents<int, 2>> M(buf.data(), N, N);

    // C++23 multi-index subscript operator
    double trace = 0.0;
    for (int i = 0; i < N; ++i) trace += M[i, i];
    std::println("Trace: {}", trace);

    // Can pass M to linear algebra routines as a non-owning view
    // submdspan (C++26): auto block = std::submdspan(M, pair{0,2}, pair{0,2});
}`,
    explanation: "std::mdspan (C++23) provides a non-owning multi-dimensional view over a contiguous buffer. dextents makes dimensions runtime-specified. The C++23 multi-subscript M[i, j] replaces M(i, j) or M[i][j]. Zero overhead: the compiler sees through the abstraction to direct pointer arithmetic."
  },
];
