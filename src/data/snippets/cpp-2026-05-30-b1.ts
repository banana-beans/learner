import type { Snippet } from "./types";

export const cppSnippets20260530B1: Snippet[] = [
  {
    id: "cpp-20260530-b1-flat-map-book",
    language: "cpp",
    title: "std::flat_map (C++23) as cache-friendly price-level map",
    tag: "stl",
    code: `#include <flat_map>   // C++23
#include <cstdint>
#include <print>

// std::flat_map stores keys+values in two contiguous vectors.
// Sequential scans (iterating all price levels) are ~3x faster than
// std::map due to cache locality; random inserts are slower.
// Ideal for read-heavy order books with infrequent updates.

struct Level { std::int64_t qty; std::uint32_t order_count; };

int main() {
    std::flat_map<double, Level, std::greater<double>> bids; // descending

    bids[100.50] = {500, 3};
    bids[100.25] = {1000, 7};
    bids[100.75] = {200, 1};

    // Iteration is contiguous-memory linear scan — cache-hot.
    for (const auto& [px, lvl] : bids) {
        std::println("px={:.2f}  qty={}  orders={}", px, lvl.qty, lvl.order_count);
    }

    // Best bid is begin() since comparator is greater<>.
    if (!bids.empty()) {
        auto [best_px, best_lvl] = *bids.begin();
        std::println("best bid: {:.2f} x {}", best_px, best_lvl.qty);
    }
}`,
    explanation:
      "std::flat_map (C++23) backs its key and value sequences with sorted vectors, so price-level iteration hits L1/L2 cache linearly — crucial when risk engines scan the entire book every tick. The tradeoff is O(N) insert cost, making it unsuitable for books with constant order amendments at arbitrary price levels.",
  },

  {
    id: "cpp-20260530-b1-forward-like",
    language: "cpp",
    title: "std::forward_like (C++23) — forwarding based on owner's value category",
    tag: "templates",
    code: `#include <utility>   // std::forward_like (C++23)
#include <string>
#include <print>

// Problem: inside a lambda or member, you want to forward a captured/member
// based on *your* value category (lvalue vs rvalue), not the member's.
// std::forward_like<Self>(member) does exactly that.

struct OrderCache {
    std::string symbol;

    // Deducing-this + forward_like: returns string& if *this is lvalue,
    // string&& if *this is rvalue — single definition, correct semantics.
    template<typename Self>
    auto&& get_symbol(this Self&& self) noexcept {
        return std::forward_like<Self>(self.symbol);
    }
};

int main() {
    OrderCache c{"AAPL"};
    std::string& ref   = c.get_symbol();          // lvalue: borrow
    std::string moved  = std::move(c).get_symbol(); // rvalue: move out
    std::println("moved: {}", moved);
    (void)ref;
}`,
    explanation:
      "std::forward_like<Owner>(member) propagates the owner's value category to the member — if the owner is an rvalue you can move the member, if lvalue you borrow it. Combined with deducing-this this eliminates the const/non-const overload pair that plagues every accessor in a quant library.",
  },

  {
    id: "cpp-20260530-b1-atomic-ref",
    language: "cpp",
    title: "std::atomic_ref — atomic ops on non-atomic storage",
    tag: "concurrency",
    code: `#include <atomic>
#include <vector>
#include <thread>
#include <print>

// std::atomic_ref wraps an ordinary (non-atomic) object with atomic
// operations for the ref's lifetime. Useful for arrays where only
// one cell is hot at a time but you don't want to pay atomic overhead
// for the whole array all the time.

int main() {
    std::vector<long> pnl(4, 0L);  // plain storage

    auto worker = [&](int id, long profit) {
        // Each thread touches a different slot — safe as independent atomics.
        std::atomic_ref<long> cell(pnl[id]);
        cell.fetch_add(profit, std::memory_order_relaxed);
    };

    std::thread t0(worker, 0, 150'000);
    std::thread t1(worker, 1, -30'000);
    t0.join(); t1.join();

    long total = 0;
    for (auto v : pnl) total += v;
    std::println("total pnl: {}", total);  // 120000
}`,
    explanation:
      "std::atomic_ref lets you retrofit atomic operations onto plain storage without changing the storage type — handy for per-strategy P&L arrays that are indexed at runtime where you'd otherwise need an array<atomic<long>, N> with its inflexible size or a mutex. The atomic guarantee only holds while the ref exists and the underlying object isn't accessed non-atomically concurrently.",
  },

  {
    id: "cpp-20260530-b1-latch-startup",
    language: "cpp",
    title: "std::latch — countdown barrier for multi-feed startup",
    tag: "concurrency",
    code: `#include <latch>
#include <thread>
#include <vector>
#include <print>
#include <chrono>

// std::latch is a single-use countdown: count_down() decrements,
// wait() blocks until the count reaches zero. Perfect for "all feeds
// connected before strategy starts" patterns.

int main() {
    constexpr int N_FEEDS = 3;
    std::latch ready(N_FEEDS);   // count = 3

    auto feed_thread = [&](int id) {
        using namespace std::chrono_literals;
        std::this_thread::sleep_for(10ms * id);   // simulate connect delay
        std::println("feed {} connected", id);
        ready.count_down();   // decrement; releases wait() when count hits 0
    };

    std::vector<std::thread> threads;
    for (int i = 0; i < N_FEEDS; ++i)
        threads.emplace_back(feed_thread, i);

    ready.wait();   // strategy thread blocks here
    std::println("all feeds up — strategy starting");

    for (auto& t : threads) t.join();
}`,
    explanation:
      "std::latch (C++20) is a lighter, single-use alternative to a condition_variable+counter pair: it needs no mutex and its semantics are obvious from the name. The asymmetry between count_down() (called by N threads) and wait() (called by one) maps directly to the 'N data sources must be ready before one consumer starts' pattern common in HFT gateways.",
  },

  {
    id: "cpp-20260530-b1-barrier-epoch",
    language: "cpp",
    title: "std::barrier — reusable phased epoch sync for batch risk",
    tag: "concurrency",
    code: `#include <barrier>
#include <thread>
#include <vector>
#include <atomic>
#include <print>

// std::barrier is like latch but reusable: after all threads call
// arrive_and_wait(), the barrier resets and optionally runs a
// completion function. Used for epoch-based batch computation.

int main() {
    constexpr int N = 4;
    std::vector<double> partial_pnl(N, 0.0);
    double epoch_total = 0.0;
    int epoch = 0;

    // Completion function runs after every epoch (on one thread).
    auto on_epoch = [&]() noexcept {
        epoch_total = 0.0;
        for (auto v : partial_pnl) epoch_total += v;
        std::println("epoch {} pnl: {:.2f}", epoch++, epoch_total);
    };

    std::barrier bar(N, on_epoch);

    auto worker = [&](int id, double contrib) {
        for (int e = 0; e < 3; ++e) {
            partial_pnl[id] = contrib * (e + 1);
            bar.arrive_and_wait();   // sync; completion runs once per epoch
        }
    };

    std::vector<std::thread> ts;
    for (int i = 0; i < N; ++i)
        ts.emplace_back(worker, i, (i + 1) * 1000.0);
    for (auto& t : ts) t.join();
}`,
    explanation:
      "std::barrier (C++20) resets automatically after every phase, making it ideal for epoch-based risk loops where N worker threads compute per-instrument Greeks and a single aggregation phase sums them — the completion callback runs on the last arriving thread with no extra synchronization needed.",
  },

  {
    id: "cpp-20260530-b1-jthread-stop",
    language: "cpp",
    title: "std::jthread + stop_token — graceful feed handler shutdown",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <chrono>
#include <print>
#include <atomic>

// std::jthread auto-joins on destruction and carries a stop_token
// the owner can signal via request_stop(). Feed handlers can poll the
// token rather than checking a global flag.

std::atomic<long> tick_count{0};

void feed_loop(std::stop_token stoken, int feed_id) {
    using namespace std::chrono_literals;
    while (!stoken.stop_requested()) {
        tick_count.fetch_add(1, std::memory_order_relaxed);
        std::this_thread::sleep_for(1ms);   // simulate tick arrival
    }
    std::println("feed {} stopped cleanly after {} ticks", feed_id, tick_count.load());
}

int main() {
    std::jthread feed0(feed_loop, 0);   // starts immediately
    std::jthread feed1(feed_loop, 1);

    using namespace std::chrono_literals;
    std::this_thread::sleep_for(5ms);

    feed0.request_stop();   // signals stop_token; jthread joins on scope exit
    feed1.request_stop();
    // destructor joins both — no explicit join() needed
}`,
    explanation:
      "std::jthread (C++20) removes the classic 'join in destructor' boilerplate and replaces ad-hoc global flags with a type-safe stop_token. Passing the token as a first parameter (the magic convention) lets the thread be cancelled from the outside while still running cleanup code before exit — critical for flushing logs or ACKing the exchange.",
  },

  {
    id: "cpp-20260530-b1-thread-local-stats",
    language: "cpp",
    title: "Thread-local per-core latency histogram",
    tag: "low-latency",
    code: `#include <array>
#include <atomic>
#include <thread>
#include <vector>
#include <print>
#include <chrono>

// thread_local storage has zero contention — each thread owns its slot.
// Aggregate only at drain time, not on the hot path.

struct LatencyBucket {
    static constexpr std::size_t N = 16;
    // buckets: <1us, <2us, <4us, <8us, ... <32768us
    std::array<std::uint64_t, N> counts{};

    void record(std::uint64_t ns) noexcept {
        std::uint64_t us = ns / 1000;
        std::size_t bucket = 0;
        while (bucket + 1 < N && (1u << bucket) <= us) ++bucket;
        ++counts[bucket];
    }
};

thread_local LatencyBucket tl_hist;

void simulate_work(int iters) {
    for (int i = 0; i < iters; ++i) {
        auto t0 = std::chrono::high_resolution_clock::now();
        // simulate order processing
        volatile double x = 1.0;
        for (int k = 0; k < 50; ++k) x *= 1.0001;
        auto t1 = std::chrono::high_resolution_clock::now();
        auto ns = std::chrono::duration_cast<std::chrono::nanoseconds>(t1 - t0).count();
        tl_hist.record(static_cast<std::uint64_t>(ns));
    }
}

int main() {
    std::vector<std::thread> ts;
    for (int i = 0; i < 2; ++i)
        ts.emplace_back(simulate_work, 100);
    for (auto& t : ts) t.join();
    // Each thread's tl_hist is independent; drain separately.
    std::println("bucket[0]: {}", tl_hist.counts[0]);
}`,
    explanation:
      "Thread-local histograms avoid cache-line bouncing that happens with shared atomic counters on every tick. Each core accumulates into its own storage; a separate drain thread reads them at lower frequency without any lock, keeping the hot measurement path contention-free.",
  },

  {
    id: "cpp-20260530-b1-udp-multicast",
    language: "cpp",
    title: "UDP multicast socket — exchange market data receive",
    tag: "networking",
    code: `#include <cstdio>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

// Exchanges (CME, NASDAQ) deliver market data via UDP multicast.
// Receiver joins a multicast group on a specific interface.

int make_mcast_socket(const char* group_ip, std::uint16_t port,
                      const char* iface_ip) {
    int fd = socket(AF_INET, SOCK_DGRAM, 0);

    // Allow multiple processes on same host to bind the same port.
    int reuse = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse));

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port   = htons(port);
    addr.sin_addr.s_addr = INADDR_ANY;
    bind(fd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr));

    // Join the multicast group via IGMP.
    ip_mreq mreq{};
    inet_pton(AF_INET, group_ip, &mreq.imr_multiaddr);
    inet_pton(AF_INET, iface_ip, &mreq.imr_interface);
    setsockopt(fd, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq));

    return fd;
}

int main() {
    int fd = make_mcast_socket("239.0.0.1", 30001, "0.0.0.0");
    char buf[1500];  // MTU-sized receive buffer
    while (true) {
        ssize_t n = recv(fd, buf, sizeof(buf), 0);
        if (n <= 0) break;
        // parse buf[0..n) as exchange protocol (ITCH, SBE, etc.)
        (void)n;
    }
    close(fd);
}`,
    explanation:
      "Exchanges publish market data as UDP multicast so thousands of subscribers can receive the same stream at the cost of a single sender transmission. The kernel handles IGMP group membership; the application just calls recv() in a tight loop. Packet loss is expected and handled by sequence-number gap detection followed by retransmit requests on a separate TCP channel.",
  },

  {
    id: "cpp-20260530-b1-digital-option",
    language: "cpp",
    title: "Digital (cash-or-nothing) option — BSM closed form",
    tag: "derivatives",
    code: `#include <cmath>
#include <print>

// Cash-or-nothing call pays $1 if S_T > K, else 0.
// BSM price = e^{-rT} * N(d2).
// Asset-or-nothing call pays S_T if S_T > K, else 0.
// BSM price = S * e^{-qT} * N(d2 + sigma*sqrt(T)).

static double norm_cdf(double x) noexcept {
    return 0.5 * std::erfc(-x * M_SQRT1_2);
}

struct DigitalResult { double cash; double asset; };

DigitalResult digital_bsm(double S, double K, double r, double q,
                           double sigma, double T, bool is_call) noexcept {
    double sqrtT = std::sqrt(T);
    double d1 = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T)
                / (sigma * sqrtT);
    double d2 = d1 - sigma * sqrtT;

    double sign = is_call ? 1.0 : -1.0;
    double Nd2  = norm_cdf(sign * d2);
    double Nd1  = norm_cdf(sign * d1);

    double cash  = std::exp(-r * T) * Nd2;
    double asset = S * std::exp(-q * T) * Nd1;
    return {cash, asset};
}

int main() {
    // ATM cash-or-nothing call: should be ~e^{-rT}*0.5 for near-zero rates.
    auto [cash, asset] = digital_bsm(100.0, 100.0, 0.05, 0.0, 0.20, 1.0, true);
    std::println("cash-or-nothing: {:.4f}", cash);    // ~0.4629
    std::println("asset-or-nothing: {:.4f}", asset);  // ~52.9
}`,
    explanation:
      "Digital options are the building blocks of range accruals and structured products; the cash-or-nothing price is exactly the risk-neutral probability (discounted) that the option finishes in-the-money. Vega of a digital is the derivative of N(d2) — proportional to the normal density — which spikes sharply ATM near expiry and creates the dreaded 'digital risk' that traders manage with call spreads.",
  },

  {
    id: "cpp-20260530-b1-adi-bs",
    language: "cpp",
    title: "ADI (Craig-Sneyd) splitting for 2-factor BS PDE",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <print>

// Two-factor Black-Scholes PDE (e.g. spread option on S1, S2):
//   dV/dt + 0.5*s1^2*S1^2*Vss1 + rho*s1*s2*S1*S2*Vs1s2
//         + 0.5*s2^2*S2^2*Vss2 + r*S1*Vs1 + r*S2*Vs2 - r*V = 0
//
// ADI splits each time step into two half-steps along S1 and S2,
// solving tridiagonal systems (Thomas algorithm) instead of a 2D sparse solve.

struct Grid2D {
    int N1, N2;
    std::vector<double> v;
    double& at(int i, int j) { return v[i * N2 + j]; }
};

// Thomas algorithm for tridiagonal Ax=b (in-place).
static void thomas(std::vector<double>& a, std::vector<double>& b,
                   std::vector<double>& c, std::vector<double>& d, int n) {
    for (int i = 1; i < n; ++i) {
        double m = a[i] / b[i-1];
        b[i] -= m * c[i-1];
        d[i] -= m * d[i-1];
    }
    d[n-1] /= b[n-1];
    for (int i = n-2; i >= 0; --i)
        d[i] = (d[i] - c[i] * d[i+1]) / b[i];
}

// Placeholder: one ADI half-step in S1 direction for demonstration.
void adi_half_step_s1(Grid2D& V, int N1, int N2, double dt,
                      double dS1, double r, double sigma1) {
    std::vector<double> a(N1), b(N1), c(N1), d(N1);
    for (int j = 0; j < N2; ++j) {
        for (int i = 0; i < N1; ++i) {
            double S1 = (i + 1) * dS1;
            double alpha = 0.25 * sigma1 * sigma1 * S1 * S1 / (dS1 * dS1);
            double beta  = 0.25 * r * S1 / dS1;
            a[i] = -(alpha - beta);
            b[i] = 1.0 + 2.0 * alpha + 0.5 * r * dt;
            c[i] = -(alpha + beta);
            d[i] = V.at(i, j);   // explicit rhs omitted for brevity
        }
        thomas(a, b, c, d, N1);
        for (int i = 0; i < N1; ++i) V.at(i, j) = d[i];
    }
}

int main() {
    constexpr int N = 20;
    Grid2D V; V.N1 = N; V.N2 = N; V.v.assign(N * N, 0.0);
    // Set terminal condition: max(S1-S2-K, 0) — spread option payoff
    double K = 5.0, dS = 5.0;
    for (int i = 0; i < N; ++i)
        for (int j = 0; j < N; ++j)
            V.at(i, j) = std::max((i - j) * dS - K, 0.0);

    adi_half_step_s1(V, N, N, 0.01, dS, 0.05, 0.20);
    std::println("V[10,9] = {:.4f}", V.at(10, 9));
}`,
    explanation:
      "ADI (Alternating Direction Implicit) reduces a 2D PDE timestep into two 1D tridiagonal solves via operator splitting — each solve is O(N) via the Thomas algorithm instead of O(N²) for a full 2D sparse system. The Craig-Sneyd variant adds a correction term to reduce splitting error to second-order in time, which is essential for accurate cross-gamma in spread option pricing.",
  },

  {
    id: "cpp-20260530-b1-cva-mc",
    language: "cpp",
    title: "CVA Monte Carlo — unilateral credit value adjustment",
    tag: "derivatives",
    code: `#include <vector>
#include <random>
#include <cmath>
#include <numeric>
#include <print>

// CVA = (1 - Recovery) * integral_0^T  EE(t) * dPD(t)
// where EE(t) = E[max(V(t),0)] is the expected exposure at time t
// and dPD(t) is the marginal default probability in [t, t+dt].
// Simplified: constant hazard rate lambda => PD density = lambda*exp(-lambda*t).

double cva_mc(double S0, double r, double q, double sigma,
              double T, double K, double lambda, double recovery,
              int n_paths, int n_steps, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> norm;

    double dt    = T / n_steps;
    double sqdt  = std::sqrt(dt);
    double drift = (r - q - 0.5 * sigma * sigma) * dt;

    double cva = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0;
        for (int step = 0; step < n_steps; ++step) {
            S *= std::exp(drift + sigma * sqdt * norm(rng));
            double t     = (step + 1) * dt;
            double V     = std::max(S - K, 0.0) * std::exp(-r * (T - t)); // fwd value
            double pd_dt = lambda * std::exp(-lambda * t) * dt;            // hazard density
            cva += std::max(V, 0.0) * pd_dt;
        }
    }

    return (1.0 - recovery) * cva / n_paths;
}

int main() {
    double result = cva_mc(100.0, 0.05, 0.0, 0.20, 1.0, 100.0,
                           0.02, 0.40, 10'000, 50);
    std::println("CVA = {:.4f}", result);
}`,
    explanation:
      "CVA is the market value of counterparty default risk on a derivative portfolio; it converts credit exposure into a dollar adjustment to the risk-free price. The Monte Carlo approach paths the underlying, computes the mark-to-market at each monitoring date, and weights by the hazard-rate density — this naturally extends to netting sets and collateral agreements by modifying the exposure calculation per step.",
  },

  {
    id: "cpp-20260530-b1-asian-geo-exact",
    language: "cpp",
    title: "Asian geometric option — closed-form + MC control variate",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <print>

// Geometric Asian: payoff = max(G_n - K, 0) where G_n = (prod S_ti)^{1/n}.
// Closed form exists (Kemna-Vorst 1990) with adjusted vol and drift.
// Use as control variate to reduce arithmetic Asian MC variance.

static double norm_cdf(double x) { return 0.5 * std::erfc(-x * M_SQRT1_2); }

double geo_asian_bs(double S, double K, double r, double sigma,
                    double T, int n) noexcept {
    // Adjusted parameters for geometric average.
    double sigma_adj = sigma * std::sqrt((2.0 * n + 1.0) / (6.0 * (n + 1.0)));
    double r_adj     = 0.5 * (r - 0.5 * sigma * sigma + sigma_adj * sigma_adj);
    double sqT       = std::sqrt(T);
    double d1 = (std::log(S / K) + (r_adj + 0.5 * sigma_adj * sigma_adj) * T)
                / (sigma_adj * sqT);
    double d2 = d1 - sigma_adj * sqT;
    return std::exp(-r * T) * (S * std::exp(r_adj * T) * norm_cdf(d1)
                               - K * norm_cdf(d2));
}

double arith_asian_cv(double S, double K, double r, double sigma,
                      double T, int n, int paths, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> norm;
    double dt = T / n, sqdt = std::sqrt(dt);
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double geo_exact = geo_asian_bs(S, K, r, sigma, T, n);

    double sum_arith = 0.0, sum_geo = 0.0;
    for (int p = 0; p < paths; ++p) {
        double s = S, log_sum = 0.0, arith_sum = 0.0;
        for (int i = 0; i < n; ++i) {
            s *= std::exp(drift + sigma * sqdt * norm(rng));
            arith_sum += s;
            log_sum   += std::log(s);
        }
        double geo = std::exp(log_sum / n);
        sum_arith += std::max(arith_sum / n - K, 0.0) * std::exp(-r * T);
        sum_geo   += std::max(geo        - K, 0.0) * std::exp(-r * T);
    }
    double arith_raw = sum_arith / paths;
    double geo_mc    = sum_geo   / paths;
    return arith_raw + (geo_exact - geo_mc);   // control variate correction
}

int main() {
    double price = arith_asian_cv(100.0, 100.0, 0.05, 0.20, 1.0, 12, 20'000);
    std::println("Arithmetic Asian call (CV): {:.4f}", price);
}`,
    explanation:
      "The geometric Asian has a closed-form BSM price (Kemna-Vorst) because the log of a product of lognormals is still normal. Using it as a control variate for the arithmetic Asian dramatically reduces MC variance since the two payoffs are highly correlated — cutting paths needed for a given error by 10-100x.",
  },

  {
    id: "cpp-20260530-b1-constexpr-payoff",
    language: "cpp",
    title: "constexpr payoff functions — compile-time option Greeks",
    tag: "numerics",
    code: `#include <cmath>
#include <print>
#include <numbers>   // std::numbers::sqrt2_v

// constexpr math functions (C++23 <cmath>) allow Greeks to be
// evaluated at compile time for fixed strikes and known vol regimes.

constexpr double norm_cdf_approx(double x) noexcept {
    // Hart rational approximation — accurate to ~1e-7, constexpr-friendly.
    const double a1 =  0.254829592, a2 = -0.284496736,
                 a3 =  1.421413741, a4 = -1.453152027, a5 = 1.061405429;
    const double p  =  0.3275911;
    double sign = (x < 0.0) ? -1.0 : 1.0;
    double t    = 1.0 / (1.0 + p * sign * x);
    double poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
    return 0.5 * (1.0 + sign * (1.0 - poly * std::exp(-x * x)));
}

constexpr double bs_call(double S, double K, double r,
                          double sigma, double T) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    return S * norm_cdf_approx(d1) - K * std::exp(-r * T) * norm_cdf_approx(d2);
}

constexpr double bs_delta(double S, double K, double r,
                           double sigma, double T) noexcept {
    double d1 = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * std::sqrt(T));
    return norm_cdf_approx(d1);
}

int main() {
    // Evaluated at compile time when args are constexpr.
    constexpr double price = bs_call(100.0, 100.0, 0.05, 0.20, 1.0);
    constexpr double delta = bs_delta(100.0, 100.0, 0.05, 0.20, 1.0);
    std::println("price={:.4f}  delta={:.4f}", price, delta);
}`,
    explanation:
      "constexpr option pricers let the compiler evaluate fixed-parameter Greeks at compile time with zero runtime overhead; in template metaprogramming they can generate lookup tables for standard strikes at link time. C++23 relaxed restrictions allow std::log and std::sqrt in constexpr contexts, making the full BSM formula evaluable at compile time.",
  },

  {
    id: "cpp-20260530-b1-custom-hash-composite",
    language: "cpp",
    title: "Custom std::hash for composite order key — symbol + venue",
    tag: "stl",
    code: `#include <unordered_map>
#include <string_view>
#include <cstdint>
#include <functional>
#include <print>

// FNV-1a hash combining two fields without heap allocation.
struct SymbolVenue {
    std::string_view symbol;   // e.g. "AAPL"
    std::uint8_t     venue_id; // 0=NYSE,1=NASDAQ,2=BATS
    bool operator==(const SymbolVenue& o) const noexcept = default;
};

struct SVHash {
    std::size_t operator()(const SymbolVenue& sv) const noexcept {
        // FNV-1a seed
        std::size_t h = 14695981039346656037ULL;
        constexpr std::size_t prime = 1099511628211ULL;
        for (unsigned char c : sv.symbol) { h ^= c; h *= prime; }
        h ^= sv.venue_id; h *= prime;
        return h;
    }
};

int main() {
    std::unordered_map<SymbolVenue, double, SVHash> best_bid;

    best_bid[{"AAPL", 0}] = 182.50;
    best_bid[{"AAPL", 1}] = 182.52;
    best_bid[{"GOOG", 0}] = 175.10;

    if (auto it = best_bid.find({"AAPL", 1}); it != best_bid.end())
        std::println("AAPL NASDAQ bid: {:.2f}", it->second);
}`,
    explanation:
      "Hashing composite keys without heap allocation requires a specialization of std::hash that processes each field in sequence — FNV-1a is cache-friendly and branch-free, making it suitable for per-tick lookups. Using string_view avoids copying the symbol into the key, so the map can be populated directly from raw wire-format buffers.",
  },

  {
    id: "cpp-20260530-b1-fifo-matching",
    language: "cpp",
    title: "FIFO matching engine kernel — price-time priority execution",
    tag: "order-book",
    code: `#include <deque>
#include <map>
#include <cstdint>
#include <print>

struct Order {
    std::uint64_t id;
    std::uint32_t qty;
    double        price;
    bool          is_buy;
};

struct Fill { std::uint64_t taker_id, maker_id; std::uint32_t qty; double price; };

// Ask side: ascending price (cheapest ask first).
// Bid side: descending price (highest bid first).
// Each price level holds a FIFO queue of resting orders.

using Level = std::deque<Order>;

struct Book {
    std::map<double, Level>                bids_map;  // descending via rbegin
    std::map<double, Level, std::less<>>   asks_map;  // ascending

    std::vector<Fill> match_buy(Order taker) {
        std::vector<Fill> fills;
        while (taker.qty > 0 && !asks_map.empty()) {
            auto it = asks_map.begin();
            if (it->first > taker.price) break;  // price crosses
            Level& lvl = it->second;
            while (taker.qty > 0 && !lvl.empty()) {
                Order& maker = lvl.front();
                std::uint32_t traded = std::min(taker.qty, maker.qty);
                fills.push_back({taker.id, maker.id, traded, maker.price});
                taker.qty -= traded;
                maker.qty -= traded;
                if (maker.qty == 0) lvl.pop_front();
            }
            if (lvl.empty()) asks_map.erase(it);
        }
        if (taker.qty > 0)  // residual rests on bid side
            bids_map[taker.price].push_back(taker);
        return fills;
    }
};

int main() {
    Book book;
    book.asks_map[100.50].push_back({1, 200, 100.50, false});
    book.asks_map[100.50].push_back({2, 100, 100.50, false});

    auto fills = book.match_buy({3, 250, 100.50, true});
    for (auto& f : fills)
        std::println("fill: taker={} maker={} qty={} px={:.2f}",
                     f.taker_id, f.maker_id, f.qty, f.price);
}`,
    explanation:
      "FIFO price-time priority assigns the first order at a price level to trade first, which is the standard for most equity and futures venues. The inner loop walks a std::deque (for O(1) front-pop) per price level; the outer loop walks a std::map ascending by ask price, stopping as soon as the best ask exceeds the incoming bid — this is the core of every exchange matching engine.",
  },

  {
    id: "cpp-20260530-b1-cache-oblivious-transpose",
    language: "cpp",
    title: "Cache-oblivious matrix transpose — recursive blocking",
    tag: "low-latency",
    code: `#include <vector>
#include <algorithm>
#include <print>

// Naïve transpose of an N×N matrix has terrible cache behavior
// when N is large: reading A[i][j] for all j touches N cache lines.
// Cache-oblivious recursion picks the optimal block size automatically
// for any cache hierarchy without a tuning parameter.

static void transpose_recursive(std::vector<double>& A,
                                 std::vector<double>& B,
                                 int r0, int c0, int r1, int c1, int N) {
    int dr = r1 - r0, dc = c1 - c0;
    if (dr * dc <= 64) {   // base case fits in ~4 cache lines
        for (int i = r0; i < r1; ++i)
            for (int j = c0; j < c1; ++j)
                B[j * N + i] = A[i * N + j];
        return;
    }
    if (dr >= dc) {        // split the longer dimension
        int rm = (r0 + r1) / 2;
        transpose_recursive(A, B, r0, c0, rm, c1, N);
        transpose_recursive(A, B, rm, c0, r1, c1, N);
    } else {
        int cm = (c0 + c1) / 2;
        transpose_recursive(A, B, r0, c0, r1, cm, N);
        transpose_recursive(A, B, r0, cm, r1, c1, N);
    }
}

int main() {
    constexpr int N = 8;
    std::vector<double> A(N * N), B(N * N, 0.0);
    for (int i = 0; i < N * N; ++i) A[i] = i;

    transpose_recursive(A, B, 0, 0, N, N, N);
    // B[j][i] == A[i][j]
    std::println("B[1][0] = {:.0f}  (expect {})", B[1 * N + 0], 1.0 * N);
}`,
    explanation:
      "Cache-oblivious algorithms are designed so that the recursion bottoms out at a block size that fits in whatever level of cache is present — no manual tuning parameter needed. For covariance matrix computation in risk engines, transposing a large correlation matrix this way reduces cache misses by 2-8x versus the naïve loop.",
  },

  {
    id: "cpp-20260530-b1-kalman-price",
    language: "cpp",
    title: "Kalman filter for mid-price estimation from noisy quotes",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <print>

// 1D Kalman filter: state = true mid-price, observation = noisy quote.
// State model:  x_t = x_{t-1} + w_t,  w ~ N(0, Q)  [random walk]
// Observation:  z_t = x_t + v_t,       v ~ N(0, R)

struct KalmanMid {
    double x;    // state estimate (filtered mid)
    double P;    // state covariance (uncertainty)
    double Q;    // process noise variance
    double R;    // observation noise variance

    explicit KalmanMid(double init_price, double Q_=0.01, double R_=0.25)
        : x(init_price), P(1.0), Q(Q_), R(R_) {}

    double update(double z) noexcept {
        // Predict
        P += Q;
        // Update
        double K = P / (P + R);   // Kalman gain
        x = x + K * (z - x);
        P = (1.0 - K) * P;
        return x;
    }
};

int main() {
    // Simulate noisy mid-price observations around a drifting true mid.
    std::vector<double> obs = {100.0, 100.3, 99.8, 100.5, 101.0, 100.7};
    KalmanMid kf(obs[0]);
    for (double z : obs) {
        double filtered = kf.update(z);
        std::println("obs={:.2f}  filtered={:.4f}  P={:.5f}", z, filtered, kf.P);
    }
}`,
    explanation:
      "The Kalman filter optimally blends a noisy measurement with a model prediction when both noise sources are Gaussian; for mid-price tracking it smooths quote noise while adapting to genuine drift faster than a simple moving average. The process noise Q controls how quickly the filter follows real price moves, while R encodes trust in the observed quote — a wide bid-ask spread implies large R.",
  },

  {
    id: "cpp-20260530-b1-sv-string-view-parse",
    language: "cpp",
    title: "std::string_view zero-copy FIX field parsing",
    tag: "market-data",
    code: `#include <string_view>
#include <charconv>
#include <optional>
#include <print>

// FIX messages arrive as "8=FIX.4.4|35=D|55=AAPL|44=182.50|38=100|..."
// string_view lets us slice fields without any heap allocation.

struct FixField { std::string_view tag, value; };

// Iterator over SOH-delimited FIX fields.
class FixIterator {
    std::string_view buf_;
    std::size_t pos_ = 0;
public:
    explicit FixIterator(std::string_view buf) : buf_(buf) {}

    std::optional<FixField> next() noexcept {
        if (pos_ >= buf_.size()) return std::nullopt;
        auto eq  = buf_.find('=', pos_);
        auto soh = buf_.find('\x01', eq + 1);
        if (eq == std::string_view::npos) return std::nullopt;
        std::string_view tag   = buf_.substr(pos_, eq - pos_);
        std::string_view value = buf_.substr(eq + 1,
            (soh == std::string_view::npos ? buf_.size() : soh) - eq - 1);
        pos_ = (soh == std::string_view::npos) ? buf_.size() : soh + 1;
        return FixField{tag, value};
    }
};

int main() {
    // Use \x01 as SOH delimiter in the string literal.
    std::string_view msg = "8=FIX.4.4\x0135=D\x0155=AAPL\x0144=182.50\x0138=100\x01";
    FixIterator it(msg);
    while (auto f = it.next()) {
        double val = 0.0;
        auto [ptr, ec] = std::from_chars(f->value.begin(), f->value.end(), val);
        if (ec == std::errc{})
            std::println("tag={:>3}  value={:.4f}", f->tag, val);
        else
            std::println("tag={:>3}  value={}", f->tag, f->value);
    }
}`,
    explanation:
      "std::string_view (C++17) is a non-owning slice into existing memory — it lets a FIX parser hand out field references without any malloc, which matters at thousands of messages per second. Combined with std::from_chars (also allocation-free), the entire parse-to-number pipeline is zero-copy and avoids locale overhead that plagues std::stod.",
  },

  {
    id: "cpp-20260530-b1-small-vector",
    language: "cpp",
    title: "Small buffer optimization (SBO) vector for order legs",
    tag: "allocators",
    code: `#include <array>
#include <vector>
#include <cstdint>
#include <cstring>
#include <print>

// Most multi-leg orders have 1-4 legs. SBO stores small counts inline,
// spilling to heap only when the leg count exceeds the buffer.

template<typename T, std::size_t InlineCap = 4>
class SmallVec {
    std::array<T, InlineCap> buf_{};
    std::size_t size_ = 0;
    std::vector<T> heap_;   // used only when size_ > InlineCap

    bool is_inline() const noexcept { return size_ <= InlineCap; }
public:
    void push_back(T v) {
        if (size_ < InlineCap) {
            buf_[size_++] = v;
        } else {
            if (is_inline()) {          // first spill: migrate to heap
                heap_.assign(buf_.begin(), buf_.begin() + size_);
            }
            heap_.push_back(v);
            ++size_;
        }
    }

    T& operator[](std::size_t i) noexcept {
        return is_inline() ? buf_[i] : heap_[i];
    }

    std::size_t size() const noexcept { return size_; }
};

struct Leg { double price; std::int32_t qty; std::uint8_t venue; };

int main() {
    SmallVec<Leg, 4> legs;
    legs.push_back({182.50, 100, 0});
    legs.push_back({182.48, 200, 1});
    std::println("legs: {}  first px: {:.2f}", legs.size(), legs[0].price);
}`,
    explanation:
      "Small buffer optimization avoids heap allocation for the common case — if 90% of orders have ≤4 legs, the SBO vector allocates zero bytes on the heap for those orders, reducing allocator pressure and improving cache locality. The LLVM/libc++ std::string uses the same trick; implementing it for order legs is a pattern seen in HFT OMS code.",
  },

  {
    id: "cpp-20260530-b1-fx-forward",
    language: "cpp",
    title: "FX forward pricing with cross-currency basis",
    tag: "derivatives",
    code: `#include <cmath>
#include <print>

// Textbook covered-interest parity: F = S * (1+r_d)^T / (1+r_f)^T
// In practice, cross-currency basis (xccy) adjusts r_f:
//   F = S * exp((r_d - r_f - basis) * T)
//
// basis < 0 when USD funding is cheap (USD is being lent out).

struct FXForward {
    double spot;       // e.g. 1.0800 USD per EUR
    double r_dom;      // domestic (USD) continuously compounded rate
    double r_for;      // foreign (EUR) continuously compounded rate
    double basis;      // cross-currency basis (continuously compounded)
    double T;          // maturity in years

    double forward() const noexcept {
        return spot * std::exp((r_dom - r_for - basis) * T);
    }

    // Pip sensitivity: how much does 1bp move in basis shift the forward?
    double forward_basis_dv01() const noexcept {
        return -T * forward();  // dF/d(basis) * 0.0001
    }

    // Spot delta: dF/dS = exp((r_dom - r_for - basis)*T)
    double forward_delta() const noexcept {
        return std::exp((r_dom - r_for - basis) * T);
    }
};

int main() {
    FXForward fxf{1.0800, 0.053, 0.035, -0.0015, 1.0};
    std::println("Forward:      {:.5f}", fxf.forward());
    std::println("Basis DV01:   {:.6f}", fxf.forward_basis_dv01() * 1e-4);
    std::println("Forward delta:{:.5f}", fxf.forward_delta());
}`,
    explanation:
      "Cross-currency basis is a persistent deviation from covered-interest parity caused by USD funding demand; it was consistently negative for EUR/USD from 2014 to 2022. Including basis in FX forward pricing matters when hedging multi-currency books: mispricing basis by 10bp on a 1Y EUR forward moves the price by ~10bp * T * F, which is real P&L on large notionals.",
  },

  {
    id: "cpp-20260530-b1-butterfly-spread",
    language: "cpp",
    title: "Butterfly spread P&L decomposition — long gamma, short theta",
    tag: "derivatives",
    code: `#include <cmath>
#include <print>

static double norm_cdf(double x) { return 0.5 * std::erfc(-x * M_SQRT1_2); }
static double norm_pdf(double x) { return std::exp(-0.5 * x * x) / std::sqrt(2.0 * M_PI); }

struct BSGreeks {
    double price, delta, gamma, theta, vega;
};

BSGreeks bs_call_greeks(double S, double K, double r, double sigma, double T) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    double Nd1 = norm_cdf(d1), Nd2 = norm_cdf(d2), nd1 = norm_pdf(d1);
    double price = S * Nd1 - K * std::exp(-r * T) * Nd2;
    double delta = Nd1;
    double gamma = nd1 / (S * sigma * sqT);
    double theta = -(S * nd1 * sigma / (2.0 * sqT)) - r * K * std::exp(-r * T) * Nd2;
    double vega  = S * nd1 * sqT;
    return {price, delta, gamma, theta, vega};
}

int main() {
    double S = 100.0, r = 0.05, sigma = 0.20, T = 0.25;
    double K_lo = 95.0, K_atm = 100.0, K_hi = 105.0;

    // Long 1 call at K_lo, short 2 calls at K_atm, long 1 call at K_hi.
    auto g0 = bs_call_greeks(S, K_lo,  r, sigma, T);
    auto g1 = bs_call_greeks(S, K_atm, r, sigma, T);
    auto g2 = bs_call_greeks(S, K_hi,  r, sigma, T);

    double net_price = g0.price - 2.0 * g1.price + g2.price;
    double net_delta = g0.delta - 2.0 * g1.delta + g2.delta;
    double net_gamma = g0.gamma - 2.0 * g1.gamma + g2.gamma;
    double net_theta = g0.theta - 2.0 * g1.theta + g2.theta;
    double net_vega  = g0.vega  - 2.0 * g1.vega  + g2.vega;

    std::println("net price: {:.4f}", net_price);
    std::println("net delta: {:.5f}  gamma: {:.5f}", net_delta, net_gamma);
    std::println("net theta: {:.5f}  vega:  {:.5f}", net_theta, net_vega);
}`,
    explanation:
      "A long butterfly is long gamma (profits from realized vol exceeding implied) but pays theta (time decay), with near-zero net vega — it's a pure realized-vs-implied vol bet around the centre strike. Delta and vega nearly cancel by construction, so the position is cheapest to hedge and its P&L approximation is ½ * Γ * (δS)² − Θ * δt.",
  },

  {
    id: "cpp-20260530-b1-realized-vol",
    language: "cpp",
    title: "Realized volatility with Parkinson bias correction",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <print>

// Close-to-close realized vol underestimates true vol if there is
// intraday drift. Parkinson (1980) uses the daily high-low range:
//   sigma_p^2 = 1/(4*n*ln2) * sum( ln(H_i/L_i)^2 )
// This estimator is 4x more efficient than close-to-close.

struct OHLC { double open, high, low, close; };

double parkinson_vol(const std::vector<OHLC>& bars, int period = 20) noexcept {
    if (bars.size() < static_cast<std::size_t>(period)) return 0.0;
    double sum_sq = 0.0;
    for (int i = bars.size() - period; i < static_cast<int>(bars.size()); ++i) {
        double ln_hl = std::log(bars[i].high / bars[i].low);
        sum_sq += ln_hl * ln_hl;
    }
    double daily_var = sum_sq / (4.0 * period * std::log(2.0));
    return std::sqrt(daily_var * 252.0);   // annualised
}

double close_to_close_vol(const std::vector<OHLC>& bars, int period = 20) noexcept {
    double sum_sq = 0.0;
    int n = bars.size();
    for (int i = n - period; i < n; ++i) {
        double ret = std::log(bars[i].close / bars[i-1].close);
        sum_sq += ret * ret;
    }
    return std::sqrt(sum_sq / (period - 1) * 252.0);
}

int main() {
    // Synthetic OHLC with known vol.
    std::vector<OHLC> bars(22);
    bars[0] = {100.0, 101.0, 99.0, 100.2};
    for (int i = 1; i < 22; ++i)
        bars[i] = {bars[i-1].close, bars[i-1].close * 1.012,
                   bars[i-1].close * 0.991, bars[i-1].close * 1.003};

    std::println("Parkinson vol:     {:.3f}", parkinson_vol(bars));
    std::println("Close-to-close:    {:.3f}", close_to_close_vol(bars));
}`,
    explanation:
      "Parkinson's range-based estimator uses the full intraday high-low information, giving four times the statistical efficiency of close-to-close returns for the same number of bars — meaning you need only five days of OHLC data to achieve the same precision as 20 days of close returns. It underestimates vol if prices can jump overnight, so practitioners blend it with Garman-Klass which includes the open.",
  },

  {
    id: "cpp-20260530-b1-delta-hedge-sim",
    language: "cpp",
    title: "Delta hedging P&L simulation — realized vs implied vol",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <print>

static double norm_cdf(double x) { return 0.5 * std::erfc(-x * M_SQRT1_2); }

// Delta-hedge a long call, rehedging daily.
// P&L per step ≈ 0.5 * Gamma * (dS)^2 - Theta * dt (dollar gamma P&L).
// If realized_vol > implied_vol the hedger profits.

int main() {
    double S = 100.0, K = 100.0, r = 0.05;
    double sigma_impl = 0.20;   // vol used to price and delta-hedge
    double sigma_real = 0.25;   // vol the stock actually moves at

    int T_days = 21;
    double dt = 1.0 / 252.0;
    double sqdt = std::sqrt(dt);

    std::mt19937_64 rng(42);
    std::normal_distribution<double> norm;

    double T = T_days * dt;
    double pnl = 0.0, S_cur = S;

    for (int i = 0; i < T_days; ++i) {
        double tau = T - i * dt;
        if (tau <= 0.0) break;
        // Compute delta using implied vol.
        double sqtau = std::sqrt(tau);
        double d1 = (std::log(S_cur / K) + (r + 0.5 * sigma_impl * sigma_impl) * tau)
                    / (sigma_impl * sqtau);
        double delta = norm_cdf(d1);

        // Stock moves at realized vol.
        double dS = S_cur * (r * dt + sigma_real * sqdt * norm(rng));
        S_cur += dS;

        // Delta hedge P&L: long delta shares pay us dS * delta,
        // but we subtract the call's mark-to-market change (approximated).
        // Net: 0.5 * Gamma * dS^2 - Theta * dt
        double nd1 = std::exp(-0.5 * d1 * d1) / std::sqrt(2.0 * M_PI);
        double gamma = nd1 / (S_cur * sigma_impl * sqtau);
        double theta = -(S_cur * nd1 * sigma_impl / (2.0 * sqtau))
                       - r * K * std::exp(-r * tau) * norm_cdf(d1 - sigma_impl * sqtau);
        pnl += 0.5 * gamma * dS * dS + theta * dt;
    }

    std::println("Hedge P&L (realized > implied): {:.4f}", pnl);
}`,
    explanation:
      "Delta hedging locks in the implied vol you paid for the option; your daily P&L is ½Γ(δS)²−Θδt — positive when realized variance exceeds the implied variance 'rented' via theta decay. This is the fundamental equation of dynamic replication and why long gamma traders root for large moves while short gamma traders pray for calm markets.",
  },

  {
    id: "cpp-20260530-b1-gamma-theta-attr",
    language: "cpp",
    title: "Gamma/Theta daily P&L attribution for a delta-hedged book",
    tag: "risk",
    code: `#include <vector>
#include <cmath>
#include <print>

// For each position in the book, compute the daily P&L split:
//   GammaPnL = 0.5 * dollar_gamma * (dS/S)^2
//   ThetaPnL = theta * dt
// This attribution decomposes total P&L into convexity and decay components.

struct Position {
    double notional;    // e.g. vega notional
    double spot;        // current S
    double dollar_gamma; // = 0.5 * S^2 * gamma (per unit notional)
    double theta;        // per-day theta (negative for long options)
};

struct PnLAttr { double gamma_pnl, theta_pnl, total; };

PnLAttr attribute_daily(const Position& pos, double dS) noexcept {
    double ret = dS / pos.spot;   // daily return
    double gamma_pnl = pos.dollar_gamma * ret * ret * pos.notional;
    double theta_pnl = pos.theta * pos.notional;  // theta is per day
    return {gamma_pnl, theta_pnl, gamma_pnl + theta_pnl};
}

int main() {
    std::vector<Position> book = {
        {1'000'000.0, 100.0, 2.5e-4, -45.0 / 252.0},   // long call
        {-500'000.0,  100.0, 2.5e-4, -45.0 / 252.0},   // short call
    };

    double dS = 1.50;   // stock moved up $1.50
    double total_gamma = 0.0, total_theta = 0.0;

    for (const auto& pos : book) {
        auto attr = attribute_daily(pos, dS);
        total_gamma += attr.gamma_pnl;
        total_theta += attr.theta_pnl;
        std::println("gamma={:+.2f}  theta={:+.2f}  total={:+.2f}",
                     attr.gamma_pnl, attr.theta_pnl, attr.total);
    }
    std::println("BOOK gamma={:+.2f}  theta={:+.2f}", total_gamma, total_theta);
}`,
    explanation:
      "Splitting daily P&L into gamma (convexity from realized moves) and theta (option decay) lets a desk see whether today's P&L was earned by correct positioning or just gifted by a large market move. A book running long gamma and short theta should be profitable over a sustained high-vol period; this attribution is the first sanity check in any options risk report.",
  },
];
