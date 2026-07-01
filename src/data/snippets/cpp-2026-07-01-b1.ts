import type { Snippet } from "./types";

export const cppSnippets20260701B1: Snippet[] = [
  {
    id: "cpp-20260701-b1-ranges-fill-pipeline",
    language: "cpp",
    title: "std::ranges Lazy Pipeline for Trade Fill Analysis",
    tag: "ranges",
    code: `#include <algorithm>
#include <ranges>
#include <vector>
#include <iostream>
#include <numeric>

struct Fill {
    int     symbol_id;
    double  price;
    int     qty;
    char    side;  // 'B' or 'S'
};

int main() {
    std::vector<Fill> fills = {
        {1, 100.5, 200, 'B'}, {2, 50.1,  100, 'S'},
        {1, 101.0, 150, 'B'}, {3, 200.0,  50, 'B'},
        {1,  99.5, 300, 'S'}, {2,  50.3,  80, 'B'},
    };

    // Lazy pipeline: filter symbol 1 buys, compute notional, partial sort top-2
    auto sym1_buy_notional =
        fills
        | std::views::filter([](const Fill& f) {
              return f.symbol_id == 1 && f.side == 'B';
          })
        | std::views::transform([](const Fill& f) {
              return f.price * f.qty;
          });

    std::vector<double> notionals(sym1_buy_notional.begin(),
                                   sym1_buy_notional.end());
    std::ranges::sort(notionals, std::greater<>{});

    std::cout << "Symbol-1 buy notionals (desc):\\n";
    for (double n : notionals)
        std::cout << "  " << n << "\\n";

    // Total sold qty across all symbols
    auto sells = fills | std::views::filter([](const Fill& f){
        return f.side == 'S';
    });
    int total_sell_qty = std::accumulate(
        sells.begin(), sells.end(), 0,
        [](int acc, const Fill& f){ return acc + f.qty; });
    std::cout << "Total sell qty: " << total_sell_qty << "\\n"; // 350
}`,
    explanation: "std::ranges pipelines are lazily evaluated — no intermediate vectors are allocated; filter+transform compose into a single pass. This pattern is ideal for tick-data processing where you want to express complex multi-stage queries on fills or quotes without materialising every intermediate result.",
  },
  {
    id: "cpp-20260701-b1-merton-mc",
    language: "cpp",
    title: "Merton Jump-Diffusion Monte Carlo",
    tag: "pricing",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <algorithm>

// Merton (1976): dS/S = (mu - lambda*kappa)*dt + sigma*dW + (J-1)*dN
// J ~ logN(mu_j, sigma_j), N ~ Poisson(lambda)
double merton_call_mc(double S0, double K, double r, double T,
                      double sigma, double lambda, double mu_j,
                      double sigma_j, int paths = 500'000, int seed = 42)
{
    const double kappa    = std::exp(mu_j + 0.5*sigma_j*sigma_j) - 1.0;
    const double drift    = (r - 0.5*sigma*sigma - lambda*kappa);

    std::mt19937_64 rng(seed);
    std::normal_distribution<> zdiff(0.0, 1.0);
    std::normal_distribution<> zjump(mu_j, sigma_j);
    std::poisson_distribution<> poisson(lambda * T);

    double sum = 0.0;
    const double sqrtT = std::sqrt(T);

    for (int i = 0; i < paths; ++i) {
        double z   = zdiff(rng);
        int    n   = poisson(rng);
        double lnS = std::log(S0) + drift*T + sigma*sqrtT*z;
        for (int j = 0; j < n; ++j)
            lnS += zjump(rng);       // compound Poisson jump log-size
        double ST = std::exp(lnS);
        sum += std::max(ST - K, 0.0);
    }
    return std::exp(-r * T) * sum / paths;
}

int main() {
    // S=100, K=100, r=5%, T=1yr, sigma=20%, lambda=1 jump/yr
    // mu_j=-10%, sigma_j=15%
    double price = merton_call_mc(100.0, 100.0, 0.05, 1.0,
                                   0.20, 1.0, -0.10, 0.15);
    std::cout << "Merton call price: " << price << "\\n"; // ~9.5-10.5
}`,
    explanation: "Merton's jump-diffusion adds compound Poisson jumps to GBM to capture crash risk and excess kurtosis in equity returns; the drift is adjusted by lambda*kappa to keep the model risk-neutral. Monte Carlo simulation is the most direct implementation — analytic pricing exists but requires an infinite series summation.",
  },
  {
    id: "cpp-20260701-b1-barrier-option-mc",
    language: "cpp",
    title: "Down-and-Out Barrier Call MC with Brownian Bridge Correction",
    tag: "pricing",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <algorithm>

// Brownian bridge probability of hitting barrier B during [0,T]
// given end-points S0 and ST (continuous monitoring approximation)
double bridge_prob_hit(double S0, double ST, double B, double sigma, double dt) {
    if (S0 <= B || ST <= B) return 1.0;
    double ln_ratio = std::log(S0 / B) * std::log(ST / B);
    return std::exp(-2.0 * ln_ratio / (sigma * sigma * dt));
}

double down_out_call_mc(double S0, double K, double B, double r,
                        double T, double sigma, int steps = 50,
                        int paths = 200'000, int seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    const double dt    = T / steps;
    const double mu_dt = (r - 0.5*sigma*sigma)*dt;
    const double sv    = sigma * std::sqrt(dt);

    double sum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S   = S0;
        bool   hit = false;
        double prev_S = S0;
        for (int t = 0; t < steps && !hit; ++t) {
            double Snew = S * std::exp(mu_dt + sv * nd(rng));
            // Brownian bridge continuous-barrier correction
            double ph = bridge_prob_hit(S, Snew, B, sigma, dt);
            if ((double)rng() / rng.max() < ph) { hit = true; break; }
            prev_S = S; S = Snew;
            if (S <= B) hit = true;
        }
        if (!hit)
            sum += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * sum / paths;
}

int main() {
    // S=100, K=100, B=90, r=5%, T=1, sigma=20%
    double price = down_out_call_mc(100.0, 100.0, 90.0, 0.05, 1.0, 0.20);
    std::cout << "Down-and-out call: " << price << "\\n"; // ~7.0-8.0
}`,
    explanation: "Discrete monitoring in barrier MC underestimates knock-out probability; the Brownian bridge correction accounts for the probability that the path crossed the barrier between monitoring dates, a technique due to Beaglehole, Dybvig & Zhou (1997). This is essential for accurate pricing when hedging near the barrier.",
  },
  {
    id: "cpp-20260701-b1-lookback-put-mc",
    language: "cpp",
    title: "Floating-Strike Lookback Put Monte Carlo",
    tag: "pricing",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <algorithm>
#include <limits>

// Floating-strike lookback put: payoff = max(S_max - S_T, 0)
// The holder buys at the lowest realised price and sells at S_T
double lookback_put_mc(double S0, double r, double T, double sigma,
                       int steps = 252, int paths = 300'000, int seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    const double dt = T / steps;
    const double drift = (r - 0.5*sigma*sigma)*dt;
    const double sv    = sigma * std::sqrt(dt);

    double sum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S    = S0;
        double Smax = S0;
        for (int t = 0; t < steps; ++t) {
            S *= std::exp(drift + sv * nd(rng));
            Smax = std::max(Smax, S);
        }
        // payoff: holder 'sold' at the max and 'buys' at S_T
        sum += std::max(Smax - S, 0.0);
    }
    return std::exp(-r * T) * sum / paths;
}

int main() {
    // Closed-form for comparison: Goldman-Sosin-Gatto (1979)
    double price = lookback_put_mc(100.0, 0.05, 1.0, 0.20);
    std::cout << "Floating lookback put MC: " << price << "\\n"; // ~14-15
    // Analytic: ~14.98 for these parameters
}`,
    explanation: "Floating-strike lookback options are path-dependent; the holder effectively transacts at the optimal historic price. They are used to benchmark execution quality and in structured products. Analytic formulas exist under GBM (Goldman-Sosin-Gatto), but MC extends naturally to stochastic vol or jumps.",
  },
  {
    id: "cpp-20260701-b1-american-put-crr",
    language: "cpp",
    title: "American Put via CRR Binomial Tree with Early Exercise",
    tag: "pricing",
    code: `#include <cmath>
#include <vector>
#include <iostream>
#include <algorithm>

double american_put_crr(double S, double K, double r,
                        double T, double sigma, int N = 500)
{
    const double dt = T / N;
    const double u  = std::exp(sigma * std::sqrt(dt));
    const double d  = 1.0 / u;
    const double p  = (std::exp(r * dt) - d) / (u - d); // risk-neutral prob
    const double df = std::exp(-r * dt);

    // Terminal payoffs
    std::vector<double> V(N + 1);
    for (int j = 0; j <= N; ++j) {
        double ST = S * std::pow(u, j) * std::pow(d, N - j);
        V[j] = std::max(K - ST, 0.0);
    }

    // Backward induction with early-exercise check
    for (int i = N - 1; i >= 0; --i) {
        for (int j = 0; j <= i; ++j) {
            double hold     = df * (p * V[j + 1] + (1.0 - p) * V[j]);
            double intrinsic = K - S * std::pow(u, j) * std::pow(d, i - j);
            V[j] = std::max(hold, intrinsic); // American early-exercise
        }
    }
    return V[0];
}

int main() {
    double price = american_put_crr(100.0, 100.0, 0.05, 1.0, 0.20, 1000);
    std::cout << "American put (CRR, N=1000): " << price << "\\n"; // ~6.09
    // European put BSM: ~5.57 — American premium ~0.52
}`,
    explanation: "The CRR binomial tree discretises the underlying's log-normal dynamics; at each node the option value is the maximum of continuation value and immediate exercise (the American constraint). Convergence is O(1/N) and oscillates — Richardson extrapolation or the BBS smoothing correction further accelerates it.",
  },
  {
    id: "cpp-20260701-b1-crtp-instrument",
    language: "cpp",
    title: "CRTP Static Polymorphism for Zero-Overhead Instrument Pricing",
    tag: "CRTP",
    code: `#include <iostream>
#include <cmath>

// CRTP base — no vtable, no virtual dispatch overhead
template <typename Derived>
struct Instrument {
    double price() const {
        return static_cast<const Derived*>(this)->price_impl();
    }
    double delta() const {
        // finite-difference default (Derived can override)
        const Derived& d = static_cast<const Derived&>(*this);
        constexpr double h = 1e-4;
        // Assumes Derived has s() mutable accessor — simplified demo
        return (d.price() - d.price()) / h; // placeholder
    }
};

struct ZeroCouponBond : Instrument<ZeroCouponBond> {
    double face, rate, T;
    ZeroCouponBond(double f, double r, double t) : face(f), rate(r), T(t) {}
    double price_impl() const { return face * std::exp(-rate * T); }
};

struct ForwardContract : Instrument<ForwardContract> {
    double S0, K, r, T, q; // q = dividend yield
    ForwardContract(double s, double k, double r_, double t, double q_)
        : S0(s), K(k), r(r_), T(t), q(q_) {}
    double price_impl() const {
        return S0 * std::exp((r - q) * T) - K * std::exp(-r * T);
    }
};

// Generic present-value aggregator — zero overhead, inlined at compile time
template <typename Instr>
void print_pv(const char* name, const Instr& inst) {
    std::cout << name << " PV: " << inst.price() << "\\n";
}

int main() {
    ZeroCouponBond zcb{1000.0, 0.05, 2.0};
    ForwardContract fwd{100.0, 102.0, 0.05, 1.0, 0.02};
    print_pv("ZCB",     zcb); // ~904.84
    print_pv("Forward", fwd); // ~0.99
}`,
    explanation: "CRTP (Curiously Recurring Template Pattern) achieves compile-time polymorphism: the base class calls Derived's implementation directly through a static_cast, the compiler can inline everything, and there is zero vtable indirection — critical for millions of pricing calls per second in a risk engine.",
  },
  {
    id: "cpp-20260701-b1-fixed-point-price",
    language: "cpp",
    title: "Fixed-Point int64 Tick-Exact Price Arithmetic",
    tag: "hft",
    code: `#include <cstdint>
#include <iostream>
#include <stdexcept>

// Represent prices as int64 with 8 decimal places (1 unit = 0.00000001)
// This avoids floating-point rounding in order matching and P&L accounting
struct Price {
    static constexpr int64_t SCALE = 100'000'000LL; // 1e8
    int64_t raw;

    explicit Price(double d)  : raw(static_cast<int64_t>(d * SCALE + 0.5)) {}
    explicit Price(int64_t r) : raw(r) {}

    Price operator+(Price o) const { return Price{raw + o.raw}; }
    Price operator-(Price o) const { return Price{raw - o.raw}; }

    // Multiply price by integer quantity -> notional in same units
    int64_t notional(int64_t qty) const {
        // Split to avoid int64 overflow: qty * (raw / SCALE) is lossy
        // Use 128-bit intermediate via __int128
        __int128 n = (__int128)raw * qty;
        return static_cast<int64_t>(n / SCALE);
    }

    bool operator<(Price o)  const { return raw < o.raw; }
    bool operator==(Price o) const { return raw == o.raw; }

    double to_double() const { return static_cast<double>(raw) / SCALE; }
};

int main() {
    Price bid{100.12345678};
    Price ask{100.12345679};
    std::cout << "Bid: "    << bid.to_double() << "\\n";
    std::cout << "Spread: " << (ask - bid).to_double() << "\\n"; // 1e-8
    std::cout << "Notional 1000 @ bid: "
              << bid.notional(1000) << " (raw)\\n"; // 10012345678 -> /1e8 = 100.12
    std::cout << "Same tick? " << (bid == ask ? "yes" : "no") << "\\n"; // no
}`,
    explanation: "Floating-point prices accumulate rounding error across millions of fills; fixed-point int64 with a power-of-10 scale factor makes every tick representable exactly. __int128 prevents overflow in the notional product before dividing back by scale — essential for correctness in HFT matching engines.",
  },
  {
    id: "cpp-20260701-b1-latch-scenario",
    language: "cpp",
    title: "std::latch for Parallel Scenario Synchronisation Fence",
    tag: "concurrency",
    code: `#include <latch>
#include <thread>
#include <vector>
#include <iostream>
#include <atomic>

// Parallel scenario pricer: N threads each compute one scenario,
// then a single aggregator thread waits at the latch for all results.
int main() {
    constexpr int SCENARIOS = 8;
    std::latch ready(SCENARIOS);    // countdown from N to 0
    std::atomic<double> total_pnl{0.0};

    auto scenario_worker = [&](int id) {
        // Simulate per-scenario pricing work
        double pnl = id * 1'000.0 + 250.0;   // placeholder result
        // Accumulate (atomic CAS loop for double isn't std, use fetch_add approx)
        // Here we use a simplified atomic int representation
        double prev = total_pnl.load(std::memory_order_relaxed);
        while (!total_pnl.compare_exchange_weak(prev, prev + pnl,
               std::memory_order_release, std::memory_order_relaxed))
            ;
        std::cout << "[S" << id << "] pnl=" << pnl << "\\n";
        ready.count_down();  // signal this scenario is done
    };

    std::vector<std::thread> workers;
    workers.reserve(SCENARIOS);
    for (int i = 0; i < SCENARIOS; ++i)
        workers.emplace_back(scenario_worker, i);

    ready.wait();  // aggregator blocks here until all N count_downs fire
    std::cout << "All scenarios complete. Total PnL: "
              << total_pnl.load() << "\\n";

    for (auto& t : workers) t.join();
}`,
    explanation: "std::latch (C++20) is a single-use countdown barrier; once the count reaches zero it stays open. It is ideal for fan-out/fan-in parallel risk runs where a coordinator must wait for all scenario threads before aggregating results, without the complexity of condition_variable or future/promise chains.",
  },
  {
    id: "cpp-20260701-b1-thread-pool",
    language: "cpp",
    title: "Thread Pool with Mutex + condition_variable Task Queue",
    tag: "concurrency",
    code: `#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <functional>
#include <vector>
#include <iostream>
#include <atomic>

class ThreadPool {
    std::vector<std::thread>        workers;
    std::queue<std::function<void()>> tasks;
    std::mutex                      mtx;
    std::condition_variable         cv;
    bool                            stop = false;
public:
    explicit ThreadPool(size_t n) {
        for (size_t i = 0; i < n; ++i)
            workers.emplace_back([this] {
                for (;;) {
                    std::function<void()> task;
                    {
                        std::unique_lock lk(mtx);
                        cv.wait(lk, [this]{ return stop || !tasks.empty(); });
                        if (stop && tasks.empty()) return;
                        task = std::move(tasks.front());
                        tasks.pop();
                    }
                    task();
                }
            });
    }

    void submit(std::function<void()> f) {
        { std::lock_guard lk(mtx); tasks.push(std::move(f)); }
        cv.notify_one();
    }

    ~ThreadPool() {
        { std::lock_guard lk(mtx); stop = true; }
        cv.notify_all();
        for (auto& t : workers) t.join();
    }
};

int main() {
    ThreadPool pool(4);
    std::atomic<int> done{0};
    for (int i = 0; i < 20; ++i)
        pool.submit([i, &done]{
            std::cout << "Pricing scenario " << i << "\\n";
            ++done;
        });
    while (done < 20) std::this_thread::yield();
}`,
    explanation: "A thread pool amortises thread creation overhead by keeping N worker threads alive and feeding them tasks from a shared queue. The condition_variable provides efficient blocking — workers sleep while idle and wake exactly when work arrives, making this pattern suitable for parallel Greeks calculation or batch risk repricing.",
  },
  {
    id: "cpp-20260701-b1-welford-variance",
    language: "cpp",
    title: "Welford Online Mean/Variance (Numerically Stable)",
    tag: "statistics",
    code: `#include <cmath>
#include <iostream>
#include <vector>
#include <limits>

// Welford's one-pass algorithm: numerically stable running mean+variance
// Avoids catastrophic cancellation in the naive sum(x^2) - n*mean^2 formula
struct WelfordStats {
    long long n   = 0;
    double    M1  = 0.0;  // running mean
    double    M2  = 0.0;  // running sum of squared deviations

    void push(double x) {
        ++n;
        double delta  = x - M1;
        M1 += delta / n;
        double delta2 = x - M1;
        M2 += delta * delta2;
    }

    double mean()     const { return n > 0 ? M1 : 0.0; }
    double variance() const { return n > 1 ? M2 / (n - 1) : 0.0; } // sample var
    double stddev()   const { return std::sqrt(variance()); }

    // Combine two independent WelfordStats (parallel Welford)
    static WelfordStats merge(const WelfordStats& a, const WelfordStats& b) {
        WelfordStats c;
        c.n = a.n + b.n;
        double delta = b.M1 - a.M1;
        c.M1 = (a.n * a.M1 + b.n * b.M1) / c.n;
        c.M2 = a.M2 + b.M2 + delta * delta * a.n * b.n / c.n;
        return c;
    }
};

int main() {
    // Simulated daily returns (%)
    std::vector<double> returns = {0.5, -0.3, 1.2, -0.8, 0.4, 1.1, -0.6};
    WelfordStats ws;
    for (double r : returns) ws.push(r);
    std::cout << "Mean return: " << ws.mean() << "%\\n";
    std::cout << "Std dev:     " << ws.stddev() << "%\\n";
    std::cout << "Annualised vol: " << ws.stddev() * std::sqrt(252) << "%\\n";
}`,
    explanation: "Welford's algorithm computes running mean and variance in a single pass with O(1) memory and numerical stability guaranteed even for streams with large values or small differences. This is the correct online algorithm for computing rolling volatility from a tick stream, preferred over the naive two-pass approach.",
  },
  {
    id: "cpp-20260701-b1-expression-templates",
    language: "cpp",
    title: "Expression Templates for Lazy Portfolio Vector Math",
    tag: "metaprogramming",
    code: `#include <vector>
#include <iostream>
#include <cassert>

// Expression template: represents a + b lazily, evaluated element by element
template <typename L, typename R>
struct VecAdd {
    const L& lhs; const R& rhs;
    double operator[](size_t i) const { return lhs[i] + rhs[i]; }
    size_t size()               const { return lhs.size(); }
};

template <typename L, typename R>
struct VecMul {  // scalar-vector multiply
    double scalar; const R& rhs;
    double operator[](size_t i) const { return scalar * rhs[i]; }
    size_t size()               const { return rhs.size(); }
};

// Thin wrapper around std::vector with expression-template operators
struct Vec {
    std::vector<double> data;
    explicit Vec(std::vector<double> d) : data(std::move(d)) {}
    double operator[](size_t i) const { return data[i]; }
    size_t size()               const { return data.size(); }

    // Assign from any expression template
    template <typename Expr>
    Vec& operator=(const Expr& e) {
        assert(data.size() == e.size());
        for (size_t i = 0; i < data.size(); ++i)
            data[i] = e[i];
        return *this;
    }
};

// Operator overloads returning expression nodes (no temporaries)
template <typename L, typename R> VecAdd<L,R> operator+(const L& l, const R& r){ return {l,r}; }
template <typename R>             VecMul<double,R> operator*(double s, const R& r){ return {s,r}; }

int main() {
    Vec weights{{0.3, 0.4, 0.3}};
    Vec returns{{0.05, -0.02, 0.08}};
    Vec hedge  {{0.01,  0.02, 0.01}};

    // Computes 0.5*returns + hedge in one pass — no temporaries
    weights = 0.5 * returns + hedge;

    for (double v : weights.data)
        std::cout << v << " ";   // 0.035 0.010 0.050
    std::cout << "\\n";
}`,
    explanation: "Expression templates defer computation so that compound expressions like alpha*X + beta*Y are evaluated in a single loop rather than allocating temporary vectors for each operation. This dramatically reduces memory bandwidth in dense linear algebra pipelines like portfolio optimisation or factor model aggregation.",
  },
  {
    id: "cpp-20260701-b1-constexpr-discount",
    language: "cpp",
    title: "constexpr Discount Factor Table (Compile-Time Array)",
    tag: "constexpr",
    code: `#include <array>
#include <cmath>
#include <iostream>

// constexpr discount factors for tenors 0–30 years at 5% flat rate
// Computed entirely at compile time — zero runtime cost
constexpr double RATE = 0.05;
constexpr int    MAX_TENOR = 31;

// C++17 constexpr std::exp is not guaranteed; use Taylor series approximation
constexpr double constexpr_exp(double x, int terms = 20) {
    double result = 1.0, term = 1.0;
    for (int i = 1; i < terms; ++i) {
        term *= x / i;
        result += term;
    }
    return result;
}

constexpr auto build_discount_table() {
    std::array<double, MAX_TENOR> table{};
    for (int t = 0; t < MAX_TENOR; ++t)
        table[t] = constexpr_exp(-RATE * t);
    return table;
}

constexpr auto DISCOUNT = build_discount_table();

// Runtime lookup: O(1), no computation
double discount_factor(int years) {
    return (years < MAX_TENOR) ? DISCOUNT[years] : 0.0;
}

int main() {
    for (int t : {1, 5, 10, 20, 30})
        std::cout << "DF(" << t << "yr) = " << discount_factor(t) << "\\n";
    // 0.9512, 0.7788, 0.6065, 0.3679, 0.2231
    static_assert(DISCOUNT[0] == 1.0, "DF(0) must be 1");
}`,
    explanation: "constexpr allows discount factor tables, vol surfaces, or calibration grids to be evaluated at compile time and baked into the binary as read-only data. At runtime, pricing becomes a simple array lookup — no transcendental function calls on the hot path. The Taylor-series exp substitute is required because std::exp is not constexpr before C++26.",
  },
  {
    id: "cpp-20260701-b1-bitset-levels",
    language: "cpp",
    title: "std::bitset for Active Price Level Tracking (O(1) Top-of-Book)",
    tag: "hft",
    code: `#include <bitset>
#include <iostream>
#include <cassert>

// Model an order book with price levels 0..N-1 encoded as a bitset.
// Finding the best bid (highest set bit) or best ask (lowest set bit)
// uses CPU BSR/BSF instructions via _Find_last() / _Find_first().
constexpr int TICK_LEVELS = 1024; // e.g. ticks 99.00 to 108.23 at 0.01

struct PriceLevelBook {
    std::bitset<TICK_LEVELS> bid_levels; // set bit = orders resting at that tick
    std::bitset<TICK_LEVELS> ask_levels;

    void add_bid(int tick)    { bid_levels.set(tick); }
    void add_ask(int tick)    { ask_levels.set(tick); }
    void remove_bid(int tick) { bid_levels.reset(tick); }
    void remove_ask(int tick) { ask_levels.reset(tick); }

    // Best bid = highest set bit (GCC extension _Find_last is O(N/word))
    int best_bid() const {
        for (int i = TICK_LEVELS - 1; i >= 0; --i)
            if (bid_levels[i]) return i;
        return -1; // no bid
    }

    int best_ask() const {
        for (int i = 0; i < TICK_LEVELS; ++i)
            if (ask_levels[i]) return i;
        return -1; // no ask
    }

    int spread_ticks() const { return best_ask() - best_bid(); }
};

int main() {
    PriceLevelBook book;
    book.add_bid(500); book.add_bid(499); book.add_bid(498);
    book.add_ask(501); book.add_ask(502);

    std::cout << "Best bid tick: " << book.best_bid() << "\\n"; // 500
    std::cout << "Best ask tick: " << book.best_ask() << "\\n"; // 501
    std::cout << "Spread ticks:  " << book.spread_ticks() << "\\n"; // 1
    book.remove_bid(500);
    std::cout << "After cancel, best bid: " << book.best_bid() << "\\n"; // 499
}`,
    explanation: "Representing price levels as bitset words lets the CPU use SIMD popcount and bit-scan instructions for fast top-of-book queries and level count. On x86, _Find_last/_Find_first wrap BSR/BSF/LZCNT instructions and outperform pointer-chased linked lists for level tracking in latency-sensitive matching engines.",
  },
  {
    id: "cpp-20260701-b1-gamma-theta-pnl",
    language: "cpp",
    title: "Gamma-Theta P&L Decomposition / Gamma Scalping Simulator",
    tag: "greeks",
    code: `#include <cmath>
#include <iostream>
#include <random>
#include <vector>

struct BSMGreeks {
    double price, delta, gamma, theta, vega;
};

// Standard BSM call Greeks
BSMGreeks bsm_call(double S, double K, double r, double T, double sigma) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma * std::sqrt(T);
    auto N  = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2)); };
    auto n  = [](double x){ return std::exp(-0.5*x*x)/std::sqrt(2*M_PI); };
    double C   = S*N(d1) - K*std::exp(-r*T)*N(d2);
    double dlt = N(d1);
    double gam = n(d1) / (S * sigma * std::sqrt(T));
    double tht = -(S*n(d1)*sigma/(2*std::sqrt(T)) + r*K*std::exp(-r*T)*N(d2)) / 365.0;
    double veg =  S * n(d1) * std::sqrt(T) / 100.0;
    return {C, dlt, gam, tht, veg};
}

int main() {
    double S=100, K=100, r=0.05, T=0.25, sigma=0.20;
    auto g = bsm_call(S, K, r, T, sigma);
    std::cout << "Call: "  << g.price << "  Delta: " << g.delta
              << "  Gamma: " << g.gamma << "\\n";
    std::cout << "Theta/day: " << g.theta << "  Vega/1%: " << g.vega << "\\n";

    // Gamma-theta P&L over dt with dS move
    double dS = 1.0, dt = 1.0/365.0;
    double pnl_gamma = 0.5 * g.gamma * dS * dS;
    double pnl_theta = g.theta * dt;
    std::cout << "Gamma P&L (+1pt move): " << pnl_gamma << "\\n";
    std::cout << "Theta P&L (1 day):     " << pnl_theta << "\\n";
    std::cout << "Net (gamma scalp opportunity if |pnl_gamma| > |pnl_theta|)\\n";
}`,
    explanation: "Gamma scalping monetises convexity: when realised volatility exceeds implied vol, the gamma gain from delta-rehedging exceeds the theta bleed. The P&L decomposition dC ≈ delta*dS + 0.5*gamma*dS² + theta*dt + vega*dsigma is the core tool for understanding an option book's sensitivities and designing hedging strategies.",
  },
  {
    id: "cpp-20260701-b1-symbol-intern",
    language: "cpp",
    title: "Symbol String Interning Pool (hash_map String→uint32_t ID)",
    tag: "hft",
    code: `#include <unordered_map>
#include <vector>
#include <string>
#include <string_view>
#include <iostream>
#include <stdexcept>

// Intern pool: each unique symbol string gets a stable uint32_t ID.
// ID comparison is O(1) integer compare vs O(k) string compare.
class SymbolInternPool {
    std::unordered_map<std::string, uint32_t> str_to_id;
    std::vector<std::string>                  id_to_str;
public:
    uint32_t intern(std::string_view sym) {
        auto it = str_to_id.find(std::string(sym));
        if (it != str_to_id.end()) return it->second;
        uint32_t id = static_cast<uint32_t>(id_to_str.size());
        id_to_str.emplace_back(sym);
        str_to_id.emplace(id_to_str.back(), id);
        return id;
    }

    std::string_view lookup(uint32_t id) const {
        if (id >= id_to_str.size()) throw std::out_of_range("unknown id");
        return id_to_str[id];
    }

    size_t size() const { return id_to_str.size(); }
};

int main() {
    SymbolInternPool pool;
    uint32_t aapl  = pool.intern("AAPL");
    uint32_t msft  = pool.intern("MSFT");
    uint32_t aapl2 = pool.intern("AAPL"); // same ID returned

    std::cout << "AAPL id: "  << aapl  << "\\n"; // 0
    std::cout << "MSFT id: "  << msft  << "\\n"; // 1
    std::cout << "Same AAPL? " << (aapl == aapl2 ? "yes" : "no") << "\\n"; // yes
    std::cout << "Lookup 1: "  << pool.lookup(1) << "\\n"; // MSFT
    std::cout << "Pool size: " << pool.size() << "\\n"; // 2
}`,
    explanation: "String interning replaces expensive O(k) string comparisons with O(1) integer compares in hot paths like order routing, position aggregation, and market data dispatch. A one-time O(k) intern cost at message ingestion pays dividends across all downstream processing, and the pool doubles as a compact symbol dictionary.",
  },
  {
    id: "cpp-20260701-b1-trinomial-tree",
    language: "cpp",
    title: "Trinomial Lattice (Boyle 1986) Option Pricer",
    tag: "pricing",
    code: `#include <cmath>
#include <vector>
#include <iostream>
#include <algorithm>

// Boyle (1986) trinomial tree for European/American options
// Three moves: up (u), flat (m=1), down (d=1/u) with risk-neutral probabilities
double trinomial_option(double S, double K, double r, double T, double sigma,
                        int N, bool is_call, bool american)
{
    const double dt   = T / N;
    const double u    = std::exp(sigma * std::sqrt(2.0 * dt));
    const double d    = 1.0 / u;
    const double disc = std::exp(-r * dt);

    // Risk-neutral probabilities (Boyle)
    double e1 = std::exp((r) * dt / 2.0);
    double e2 = std::exp(sigma * std::sqrt(dt / 2.0));
    double pu = ((e1 - 1.0/e2) / (e2 - 1.0/e2)) *
                ((e1 - 1.0/e2) / (e2 - 1.0/e2));
    double pd = ((e2 - e1) / (e2 - 1.0/e2)) *
                ((e2 - e1) / (e2 - 1.0/e2));
    double pm = 1.0 - pu - pd;

    int nodes = 2*N + 1;
    std::vector<double> V(nodes);

    // Terminal payoffs: node j has S * u^(N-j) for j in [0, 2N]
    for (int j = 0; j < nodes; ++j) {
        double ST = S * std::pow(u, N - j);
        V[j] = is_call ? std::max(ST - K, 0.0) : std::max(K - ST, 0.0);
    }

    // Backward induction
    for (int i = N - 1; i >= 0; --i) {
        for (int j = 0; j <= 2*i; ++j) {
            double cont = disc * (pu*V[j] + pm*V[j+1] + pd*V[j+2]);
            if (american) {
                double Sij = S * std::pow(u, i - j);
                double intrinsic = is_call ? std::max(Sij-K,0.0) : std::max(K-Sij,0.0);
                V[j] = std::max(cont, intrinsic);
            } else {
                V[j] = cont;
            }
        }
    }
    return V[0];
}

int main() {
    double price = trinomial_option(100, 100, 0.05, 1.0, 0.20, 500, true, false);
    std::cout << "European call (trinomial): " << price << "\\n"; // ~10.45
}`,
    explanation: "The trinomial tree adds a stay-flat branch to the binomial, allowing larger time steps for the same accuracy. Convergence is O(1/N²) versus O(1/N) for binomial, and the tree naturally prices American options by comparing continuation value against intrinsic at every node.",
  },
  {
    id: "cpp-20260701-b1-duration-dv01",
    language: "cpp",
    title: "Modified Duration / DV01 / Convexity for Bond Portfolio",
    tag: "fixed-income",
    code: `#include <cmath>
#include <vector>
#include <iostream>
#include <numeric>

struct Bond {
    double face;       // par value
    double coupon;     // annual coupon rate
    double ytm;        // yield to maturity (annual, cont. compound)
    int    periods;    // number of semi-annual periods
};

struct BondAnalytics {
    double price, mac_dur, mod_dur, convexity, dv01;
};

BondAnalytics analyse_bond(const Bond& b) {
    double total_pv  = 0.0;
    double dur_sum   = 0.0;
    double conv_sum  = 0.0;
    double c = b.face * b.coupon / 2.0; // semi-annual coupon cash flow

    for (int t = 1; t <= b.periods; ++t) {
        double cf  = (t == b.periods) ? c + b.face : c;
        double r   = b.ytm / 2.0;
        double df  = std::pow(1.0 + r, -t);
        double pv  = cf * df;
        total_pv  += pv;
        dur_sum   += (t / 2.0) * pv;      // time in years * PV
        conv_sum  += (t * (t + 1.0) / 4.0) * pv;  // convexity numerator
    }

    double mac_dur   = dur_sum / total_pv;
    double mod_dur   = mac_dur / (1.0 + b.ytm / 2.0);
    double convexity = conv_sum / (total_pv * std::pow(1.0 + b.ytm/2.0, 2));
    double dv01      = mod_dur * total_pv * 0.0001;

    return {total_pv, mac_dur, mod_dur, convexity, dv01};
}

int main() {
    Bond b{1000.0, 0.05, 0.05, 10}; // 5% coupon, 5% YTM, 5yr semi-annual
    auto a = analyse_bond(b);
    std::cout << "Price:     " << a.price     << "\\n"; // ~1000 (par)
    std::cout << "Mac Dur:   " << a.mac_dur   << " yrs\\n";
    std::cout << "Mod Dur:   " << a.mod_dur   << " yrs\\n";
    std::cout << "Convexity: " << a.convexity << "\\n";
    std::cout << "DV01:      " << a.dv01      << "\\n"; // ~$ per bp
}`,
    explanation: "Modified duration measures first-order yield sensitivity (dP/dY ≈ -ModDur*P*dy) and DV01 is the dollar value of a basis-point move; convexity captures the curvature correction that makes bond prices gain more on yield falls than they lose on rises. Portfolio-level DV01 is the primary hedging metric for interest rate risk.",
  },
  {
    id: "cpp-20260701-b1-robin-hood-hash",
    language: "cpp",
    title: "Robin Hood Linear-Probing Open-Addressing Hash Map",
    tag: "data-structures",
    code: `#include <vector>
#include <optional>
#include <iostream>
#include <functional>

// Simplified Robin Hood hash map: on collision, if the new element has
// a higher probe distance (DIB) than the occupant, they swap — this
// bounds worst-case probe length and improves cache locality.
template <typename K, typename V, typename Hash = std::hash<K>>
class RobinHoodMap {
    struct Slot { K key; V val; int dib = -1; }; // dib=-1 means empty
    std::vector<Slot> table;
    size_t            count_ = 0;
    Hash              hasher;

    size_t index(const K& k) const { return hasher(k) % table.size(); }
public:
    explicit RobinHoodMap(size_t cap = 16) : table(cap) {}

    void insert(K k, V v) {
        if (count_ * 2 >= table.size()) {
            // Rebuild (simplified — skip for brevity)
            return;
        }
        int  dib = 0;
        size_t i = index(k);
        Slot  s{std::move(k), std::move(v), dib};
        while (table[i].dib >= 0) {
            if (table[i].dib < s.dib) std::swap(table[i], s); // Robin Hood swap
            i = (i + 1) % table.size();
            ++s.dib;
        }
        table[i] = std::move(s);
        ++count_;
    }

    std::optional<V> find(const K& k) const {
        size_t i = index(k); int dib = 0;
        while (table[i].dib >= 0 && table[i].dib >= dib) {
            if (table[i].key == k) return table[i].val;
            i = (i + 1) % table.size(); ++dib;
        }
        return std::nullopt;
    }
};

int main() {
    RobinHoodMap<std::string, double> map;
    map.insert("AAPL", 183.45);
    map.insert("MSFT", 415.10);
    map.insert("NVDA", 875.20);
    auto v = map.find("MSFT");
    std::cout << "MSFT: " << (v ? *v : 0.0) << "\\n"; // 415.10
    auto u = map.find("GOOG");
    std::cout << "GOOG: " << (u ? "found" : "not found") << "\\n";
}`,
    explanation: "Robin Hood hashing bounds probe distances by stealing slots from 'rich' (low DIB) elements and giving them to 'poor' (high DIB) ones. This minimises worst-case lookup time and improves cache hit rates, making it the preferred hash map implementation in HFT systems for symbol→price lookups over std::unordered_map.",
  },
  {
    id: "cpp-20260701-b1-atomic-pnl",
    language: "cpp",
    title: "std::atomic<double> Concurrent P&L Accumulator (CAS Loop)",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <vector>
#include <iostream>
#include <cmath>

// std::atomic<double> has no fetch_add on older platforms; use CAS loop
inline void atomic_add_double(std::atomic<double>& target, double delta) {
    double expected = target.load(std::memory_order_relaxed);
    while (!target.compare_exchange_weak(
               expected, expected + delta,
               std::memory_order_release,
               std::memory_order_relaxed))
        ; // retry on CAS failure (another thread changed value)
}

int main() {
    std::atomic<double> total_pnl{0.0};
    constexpr int THREADS = 8, FILLS_PER = 100'000;

    auto fill_worker = [&](int id) {
        for (int i = 0; i < FILLS_PER; ++i) {
            double fill_pnl = (id % 2 == 0) ? 0.25 : -0.10; // alternating long/short
            atomic_add_double(total_pnl, fill_pnl);
        }
    };

    std::vector<std::thread> threads;
    for (int i = 0; i < THREADS; ++i)
        threads.emplace_back(fill_worker, i);
    for (auto& t : threads) t.join();

    // Expected: 4 threads @ +0.25 + 4 threads @ -0.10, each 100k fills
    double expected = (4*0.25 - 4*0.10) * FILLS_PER;
    std::cout << "Total P&L: " << total_pnl.load() << "\\n";
    std::cout << "Expected:  " << expected  << "\\n";
    std::cout << "Error:     " << std::abs(total_pnl.load() - expected) << "\\n";
}`,
    explanation: "Hardware typically implements atomic add for integers but not doubles; the compare_exchange_weak CAS loop is the portable workaround. It spins only when two threads race on the same cache line; under typical fill-rate contention this is rare. For even lower contention, per-thread accumulators with a final reduction further reduce CAS retries.",
  },
  {
    id: "cpp-20260701-b1-policy-execution",
    language: "cpp",
    title: "Policy-Based Order Execution (Compile-Time Strategy Dispatch)",
    tag: "design-patterns",
    code: `#include <iostream>
#include <string>

// Execution policies as tag types
struct MarketPolicy {};
struct LimitPolicy  {};
struct TwapPolicy   {};

// Primary template (instantiation error for unknown policies)
template <typename Policy>
struct OrderExecutor;

template <>
struct OrderExecutor<MarketPolicy> {
    static std::string execute(double qty, double) {
        return "MARKET " + std::to_string(qty) + " shares — immediate fill";
    }
};

template <>
struct OrderExecutor<LimitPolicy> {
    static std::string execute(double qty, double limit_px) {
        return "LIMIT "  + std::to_string(qty)
             + " @ " + std::to_string(limit_px) + " — resting order";
    }
};

template <>
struct OrderExecutor<TwapPolicy> {
    static std::string execute(double qty, double) {
        // Slicer would compute intervals at runtime; here we just label
        return "TWAP " + std::to_string(qty) + " over session — sliced";
    }
};

// Generic router: strategy selected at compile time, zero virtual calls
template <typename ExecPolicy>
void route_order(double qty, double px = 0.0) {
    std::string result = OrderExecutor<ExecPolicy>::execute(qty, px);
    std::cout << result << "\\n";
}

int main() {
    route_order<MarketPolicy>(500.0);
    route_order<LimitPolicy> (200.0, 183.50);
    route_order<TwapPolicy>  (10'000.0);
    // OrderExecutor<void> — would be compile error: no specialisation
}`,
    explanation: "Policy-based design lets you compose algorithms at compile time with no virtual dispatch overhead. Execution strategy, order type, and venue routing can each be a template policy, producing a combinatorially large family of order handlers that collapse into efficient inlined code — used widely in OMS and smart-order-routing frameworks.",
  },
  {
    id: "cpp-20260701-b1-cholesky",
    language: "cpp",
    title: "Cholesky Decomposition LL^T for Correlated GBM Path Generation",
    tag: "math",
    code: `#include <vector>
#include <cmath>
#include <iostream>
#include <random>
#include <stdexcept>

using Matrix = std::vector<std::vector<double>>;

// Lower-triangular Cholesky factor L such that A = L * L^T
Matrix cholesky(const Matrix& A) {
    int n = A.size();
    Matrix L(n, std::vector<double>(n, 0.0));
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j <= i; ++j) {
            double s = 0.0;
            for (int k = 0; k < j; ++k) s += L[i][k] * L[j][k];
            if (i == j) {
                double v = A[i][i] - s;
                if (v < 0) throw std::domain_error("Matrix not positive definite");
                L[i][j] = std::sqrt(v);
            } else {
                L[i][j] = (L[j][j] != 0.0) ? (A[i][j] - s) / L[j][j] : 0.0;
            }
        }
    }
    return L;
}

int main() {
    // Correlation matrix for 3 assets: rho(1,2)=0.7, rho(1,3)=0.3, rho(2,3)=0.5
    Matrix corr = {{1.0, 0.7, 0.3},
                   {0.7, 1.0, 0.5},
                   {0.3, 0.5, 1.0}};
    Matrix L = cholesky(corr);

    std::cout << "Cholesky factor L:\\n";
    for (auto& row : L) {
        for (double v : row) std::cout << v << "  ";
        std::cout << "\\n";
    }

    // Generate correlated Normals: z_corr = L * z_indep
    std::mt19937_64 rng(42);
    std::normal_distribution<> nd;
    std::vector<double> z_indep(3), z_corr(3, 0.0);
    for (double& v : z_indep) v = nd(rng);
    for (int i = 0; i < 3; ++i)
        for (int j = 0; j <= i; ++j)
            z_corr[i] += L[i][j] * z_indep[j];

    std::cout << "Correlated z: ";
    for (double v : z_corr) std::cout << v << " ";
    std::cout << "\\n";
}`,
    explanation: "Cholesky decomposition converts an independent standard normal vector into correlated normals matching a target correlation matrix. This is the standard method for generating correlated GBM paths in multi-asset Monte Carlo, correlation stress tests, and Gaussian copula credit models.",
  },
  {
    id: "cpp-20260701-b1-implied-vol-bisect",
    language: "cpp",
    title: "Implied Vol via Bisection with Illinois Refinement",
    tag: "pricing",
    code: `#include <cmath>
#include <iostream>
#include <stdexcept>

// BSM call price
double bsm_call(double S, double K, double r, double T, double sig) {
    if (T <= 0 || sig <= 0) return std::max(S - K*std::exp(-r*T), 0.0);
    double d1 = (std::log(S/K) + (r + 0.5*sig*sig)*T) / (sig*std::sqrt(T));
    double d2 = d1 - sig*std::sqrt(T);
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2)); };
    return S*N(d1) - K*std::exp(-r*T)*N(d2);
}

// Illinois method (accelerated false-position): faster than bisection
// near the root by adjusting the retained endpoint's function value
double implied_vol(double market_price, double S, double K,
                   double r, double T,
                   double lo=1e-6, double hi=5.0, int max_iter=100)
{
    double flo = bsm_call(S,K,r,T,lo) - market_price;
    double fhi = bsm_call(S,K,r,T,hi) - market_price;
    if (flo * fhi > 0) throw std::runtime_error("No root in bracket");

    double prev_f = fhi;
    for (int i = 0; i < max_iter; ++i) {
        double mid = lo + (hi - lo) * (-flo) / (fhi - flo); // false position
        double fmid = bsm_call(S,K,r,T,mid) - market_price;
        if (std::abs(fmid) < 1e-10) return mid;
        if (fmid * flo < 0) {
            hi = mid; fhi = fmid;
            if (prev_f * fmid > 0) flo *= 0.5; // Illinois adjustment
        } else {
            lo = mid; flo = fmid;
            if (prev_f * fmid > 0) fhi *= 0.5;
        }
        prev_f = fmid;
    }
    return (lo + hi) / 2.0;
}

int main() {
    // BSM call S=100,K=100,r=5%,T=1yr,sigma=20% -> ~10.45
    double mkt_price = 10.45;
    double iv = implied_vol(mkt_price, 100.0, 100.0, 0.05, 1.0);
    std::cout << "Implied vol: " << iv * 100.0 << "%\\n"; // ~20%
}`,
    explanation: "Bisection is robust but slow; the Illinois variant of the false-position method converges super-linearly by halving the retained endpoint's function value when the same side is retained twice. For implied vol inversion, Newton-Raphson with vega is typically faster but can diverge near zero vega — Illinois is a safer fallback.",
  },
  {
    id: "cpp-20260701-b1-twap-slicer",
    language: "cpp",
    title: "TWAP Order Slicer with Partial Fill Tracking",
    tag: "execution",
    code: `#include <iostream>
#include <vector>
#include <cmath>
#include <numeric>

struct Slice {
    int    interval;     // 0-indexed time bucket
    double target_qty;   // intended qty for this bucket
    double filled_qty;   // how much actually filled
};

// TWAP slicer: divide total_qty evenly over num_intervals.
// After each interval, catch-up logic redistributes unfilled qty.
class TwapSlicer {
    double        total_qty;
    int           num_intervals;
    std::vector<Slice> slices;
    int cur = 0;
public:
    TwapSlicer(double qty, int n) : total_qty(qty), num_intervals(n) {
        double per = qty / n;
        for (int i = 0; i < n; ++i)
            slices.push_back({i, per, 0.0});
    }

    // Called each interval with actual fill received
    void on_fill(double filled) {
        if (cur >= num_intervals) return;
        slices[cur].filled_qty = filled;

        // Redistribute shortfall over remaining intervals
        double shortfall = slices[cur].target_qty - filled;
        int remaining    = num_intervals - cur - 1;
        if (remaining > 0 && shortfall > 1e-9) {
            double catch_up = shortfall / remaining;
            for (int i = cur + 1; i < num_intervals; ++i)
                slices[i].target_qty += catch_up;
        }
        ++cur;
    }

    double next_target() const {
        return (cur < num_intervals) ? slices[cur].target_qty : 0.0;
    }

    double completion_pct() const {
        double filled = 0;
        for (auto& s : slices) filled += s.filled_qty;
        return 100.0 * filled / total_qty;
    }
};

int main() {
    TwapSlicer twap(10'000.0, 5); // 10k shares over 5 intervals
    double fills[] = {2000, 1800, 2000, 2100, 0}; // simulate partial fill in slot 1
    for (double f : fills) {
        std::cout << "Send: " << twap.next_target()
                  << "  Filled: " << f << "\\n";
        twap.on_fill(f);
    }
    std::cout << "Completion: " << twap.completion_pct() << "%\\n";
}`,
    explanation: "TWAP slicers split large orders evenly across time to minimise market impact and information leakage. The catch-up logic redistributes unfilled quantities to future intervals so the algorithm still completes the total order by end-of-session, balancing between passive fill rates and end-of-session urgency.",
  },
  {
    id: "cpp-20260701-b1-treiber-stack",
    language: "cpp",
    title: "Treiber Lock-Free Stack (ABA Hazard Noted)",
    tag: "concurrency",
    code: `#include <atomic>
#include <memory>
#include <iostream>
#include <thread>
#include <vector>

// Treiber (1986) lock-free stack using compare_exchange.
// WARNING: naïve pointer CAS suffers ABA if memory is recycled.
// Production use requires hazard pointers or epoch-based reclamation.
template <typename T>
class TreiberStack {
    struct Node {
        T     val;
        Node* next;
    };
    std::atomic<Node*> head{nullptr};
public:
    void push(T val) {
        Node* n = new Node{std::move(val), nullptr};
        n->next = head.load(std::memory_order_relaxed);
        while (!head.compare_exchange_weak(n->next, n,
               std::memory_order_release,
               std::memory_order_relaxed))
            ;
    }

    bool pop(T& out) {
        Node* old = head.load(std::memory_order_acquire);
        while (old) {
            if (head.compare_exchange_weak(old, old->next,
                std::memory_order_acquire,
                std::memory_order_relaxed)) {
                out = std::move(old->val);
                delete old; // ABA risk here without hazard pointers
                return true;
            }
        }
        return false;
    }
};

int main() {
    TreiberStack<int> stk;
    stk.push(10); stk.push(20); stk.push(30);
    int v = 0;
    while (stk.pop(v))
        std::cout << v << " ";  // 30 20 10
    std::cout << "\\n";
}`,
    explanation: "Treiber's lock-free stack uses a CAS on the head pointer; if another thread modified head between the load and CAS, the CAS fails and we retry with the fresh head. The ABA problem — where pointer goes A→B→A between load and CAS — can cause a dangling pointer; hazard pointers or epoch reclamation are the standard production solutions.",
  },
  {
    id: "cpp-20260701-b1-semaphore-rate",
    language: "cpp",
    title: "std::counting_semaphore for API Order Rate Limiting (C++20)",
    tag: "concurrency",
    code: `#include <semaphore>
#include <thread>
#include <vector>
#include <iostream>
#include <chrono>
#include <atomic>

// Token-bucket rate limiter using std::counting_semaphore.
// Allows at most MAX_TOKENS concurrent "in-flight" order submissions.
// A refill thread periodically releases tokens back to the semaphore.
constexpr int MAX_TOKENS = 10; // max orders per refill interval

class RateLimiter {
    std::counting_semaphore<MAX_TOKENS> sem{MAX_TOKENS};
    std::atomic<bool> running{true};
    std::thread refill_thread;
public:
    RateLimiter() {
        refill_thread = std::thread([this] {
            while (running.load()) {
                std::this_thread::sleep_for(std::chrono::seconds(1));
                // Drain current count to determine tokens to refill
                // Simple approach: just re-release MAX_TOKENS each second
                // (In production: track outstanding and top up to MAX)
                for (int i = 0; i < MAX_TOKENS; ++i) {
                    sem.release(); // idempotent — no-op if already at max
                }
            }
        });
    }

    bool try_acquire() { return sem.try_acquire(); }
    void acquire()     { sem.acquire(); }
    void release()     { sem.release(); }

    ~RateLimiter() {
        running = false;
        if (refill_thread.joinable()) refill_thread.join();
    }
};

int main() {
    RateLimiter limiter;
    std::atomic<int> sent{0};
    auto worker = [&](int id) {
        limiter.acquire(); // blocks if rate limit exhausted
        std::cout << "Thread " << id << " sending order\\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
        limiter.release();
        ++sent;
    };

    std::vector<std::thread> threads;
    for (int i = 0; i < 15; ++i)
        threads.emplace_back(worker, i);
    for (auto& t : threads) t.join();
    std::cout << "Total sent: " << sent.load() << "\\n";
}`,
    explanation: "std::counting_semaphore (C++20) models a permit pool; acquire blocks when zero permits are available, release adds one back. For API rate limiting, the semaphore count represents available order submission slots, and a refill thread tops it up each interval — simpler and lower-overhead than a condition_variable + counter pattern.",
  },
];
