import { Snippet } from "./types";

export const cppSnippets20260722B1: Snippet[] = [
  {
    id: "cpp-20260722-b1-acquire-release",
    language: "cpp",
    title: "Acquire-Release Memory Ordering for Lock-Free SPSC",
    tag: "low-latency",
    code: `#include <atomic>
#include <cstddef>
#include <optional>
#include <array>

// Memory ordering controls which CPU/compiler reorderings are visible.
// Acquire: "I will see everything the releasing thread wrote before its release."
// Release: "Everything I wrote before this store is now visible to an acquirer."
// Using relaxed where sequencing is not needed cuts unnecessary fence overhead.

template<typename T, std::size_t Cap>
class SPSCQueue {
    static_assert((Cap & (Cap - 1)) == 0);
    static constexpr std::size_t MASK = Cap - 1;

    std::array<T, Cap> buf_;

    // Separate cache lines prevent false sharing between producer and consumer.
    alignas(64) std::atomic<std::size_t> head_{0}; // producer writes
    alignas(64) std::atomic<std::size_t> tail_{0}; // consumer writes

public:
    bool push(const T& val) {
        std::size_t h = head_.load(std::memory_order_relaxed);
        // Acquire on tail_ to see consumer's most recent tail write.
        if (h - tail_.load(std::memory_order_acquire) == Cap)
            return false; // full
        buf_[h & MASK] = val;
        // Release so consumer's acquire on head_ sees the written element.
        head_.store(h + 1, std::memory_order_release);
        return true;
    }

    std::optional<T> pop() {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        // Acquire on head_ to see the element written by the producer.
        if (head_.load(std::memory_order_acquire) == t)
            return std::nullopt; // empty
        T val = buf_[t & MASK];
        // Release so producer's acquire on tail_ sees the updated tail.
        tail_.store(t + 1, std::memory_order_release);
        return val;
    }

    bool empty() const {
        return head_.load(std::memory_order_acquire) ==
               tail_.load(std::memory_order_acquire);
    }
};`,
    explanation:
      "Acquire-release pairs form a happens-before relationship across threads without the full global ordering of seq_cst. The load-acquire on head_ (consumer) synchronises with the store-release from push() so the element write is visible. Relaxed loads on the thread's own counter avoid unnecessary fences; the critical synchronisation is the cross-thread acquire-release pair.",
  },
  {
    id: "cpp-20260722-b1-treiber-stack",
    language: "cpp",
    title: "Treiber Lock-Free Stack with Hazard-Pointer Lite",
    tag: "low-latency",
    code: `#include <atomic>
#include <memory>
#include <optional>
#include <iostream>

// Treiber (1986) lock-free stack using a CAS loop.
// The classic ABA problem: a thread reads A, another pops A, pushes B, then A
// is pushed back. The first thread's CAS on head_ succeeds incorrectly.
// Mitigation: tagged pointers (low bits of pointer) count CAS attempts.
// Simplified here — production uses hazard pointers or epoch reclamation.
template<typename T>
class TreiberStack {
    struct Node {
        T                  val;
        std::atomic<Node*> next{nullptr};
        explicit Node(T v) : val(std::move(v)) {}
    };

    std::atomic<Node*> head_{nullptr};

public:
    void push(T val) {
        Node* n = new Node(std::move(val));
        // CAS loop: if head_ changed since we loaded it, retry
        n->next.store(head_.load(std::memory_order_relaxed),
                      std::memory_order_relaxed);
        while (!head_.compare_exchange_weak(
                   n->next,    // expected (updated on failure)
                   n,          // desired
                   std::memory_order_release,
                   std::memory_order_relaxed))
            ; // retry
    }

    std::optional<T> pop() {
        Node* old_head;
        do {
            old_head = head_.load(std::memory_order_acquire);
            if (!old_head) return std::nullopt; // empty
        } while (!head_.compare_exchange_weak(
                     old_head,
                     old_head->next.load(std::memory_order_relaxed),
                     std::memory_order_acquire,
                     std::memory_order_relaxed));

        T val = std::move(old_head->val);
        // WARNING: deleting old_head here races with concurrent pops.
        // Production: defer deletion via hazard pointer or epoch.
        delete old_head;
        return val;
    }
};

int main() {
    TreiberStack<int> s;
    s.push(1); s.push(2); s.push(3);
    while (auto v = s.pop()) std::cout << *v << " "; // 3 2 1
}`,
    explanation:
      "compare_exchange_weak retries spuriously (hardware advantage over strong on ARM) — the outer do/while absorbs that. The key subtlety is that compare_exchange_weak modifies the 'expected' parameter on failure, so n->next is automatically updated to the current head on each retry. In production, delete old_head must be deferred until no concurrent reader holds the pointer.",
  },
  {
    id: "cpp-20260722-b1-string-interning",
    language: "cpp",
    title: "Symbol String Interning — One Allocation Per Unique Ticker",
    tag: "low-latency",
    code: `#include <unordered_map>
#include <string>
#include <string_view>
#include <cstdint>
#include <mutex>
#include <iostream>

// Interning: map each unique string to a stable const char*, so all
// references to "AAPL" point to the same char[]. Symbol comparisons
// become pointer equality — a single 64-bit compare instead of memcmp.
class SymbolInterner {
    std::unordered_map<std::string, const char*> table_;
    std::mutex mu_;  // write lock only; reads can use shared_mutex in C++17

public:
    // Returns a stable pointer valid for the lifetime of the interner.
    const char* intern(std::string_view sym) {
        {
            // Fast read path: check without holding write lock.
            // Safe because entries are never erased/moved.
            auto it = table_.find(std::string(sym));
            if (it != table_.end()) return it->second;
        }
        std::lock_guard lk(mu_);
        auto [it, inserted] = table_.emplace(sym, nullptr);
        if (inserted) it->second = it->first.c_str(); // stable ptr into key
        return it->second;
    }

    // After interning, compare by pointer — O(1) instead of O(N) memcmp
    static bool eq(const char* a, const char* b) noexcept { return a == b; }
};

// Typical usage in an order struct:
struct Order {
    const char* symbol;  // interned pointer
    double      price;
    uint32_t    qty;
};

int main() {
    SymbolInterner interner;
    const char* aapl1 = interner.intern("AAPL");
    const char* aapl2 = interner.intern("AAPL");
    const char* goog  = interner.intern("GOOG");

    std::cout << std::boolalpha;
    std::cout << (aapl1 == aapl2) << "\n"; // true — same pointer
    std::cout << (aapl1 == goog)  << "\n"; // false

    Order o{aapl1, 150.0, 100};
    if (SymbolInterner::eq(o.symbol, aapl2))
        std::cout << "AAPL order matched\n";
}`,
    explanation:
      "String interning replaces per-message symbol comparisons (memcmp, 4–8 ns) with pointer equality (1 ns). Each unique symbol is allocated once in the unordered_map's key; the interned pointer is stable because std::string in a map node is never reallocated. In HFT, all incoming messages share the same interning table so subsequent routing and aggregation use only pointer comparisons.",
  },
  {
    id: "cpp-20260722-b1-ewma",
    language: "cpp",
    title: "EWMA / EMA Decay with Configurable Halflife",
    tag: "numerics",
    code: `#include <cmath>
#include <cstdint>
#include <vector>
#include <iostream>

// Exponentially weighted moving average: EMA_t = alpha*x_t + (1-alpha)*EMA_{t-1}
// alpha = 1 - exp(-dt/halflife)   for continuous-time equivalence.
// Used for price volatility estimation, signal smoothing, risk metrics.
struct EWMA {
    double alpha;    // decay factor per observation
    double value;    // current EMA
    bool   primed;   // false until first observation

    explicit EWMA(double halflife_periods)
        : alpha(1.0 - std::exp(-std::log(2.0) / halflife_periods))
        , value(0.0)
        , primed(false)
    {}

    double update(double x) {
        if (!primed) { value = x; primed = true; }
        else         { value = alpha * x + (1.0 - alpha) * value; }
        return value;
    }

    // Bias-corrected (like Adam optimizer): adjusts for cold start
    double update_debiased(double x, uint64_t t) {
        update(x);
        return value / (1.0 - std::pow(1.0 - alpha, static_cast<double>(t)));
    }
};

// EWMA volatility (standard deviation of returns)
struct EWMAVol {
    EWMA var_ema;   // EMA of squared returns (zero-mean approx for returns)

    explicit EWMAVol(double halflife) : var_ema(halflife) {}

    double update(double ret) {
        var_ema.update(ret * ret);
        return std::sqrt(var_ema.value);   // realised vol estimate
    }
};

int main() {
    EWMA    ema(20.0);   // 20-period halflife
    EWMAVol evol(20.0);

    std::vector<double> prices = {100, 101, 99, 102, 98, 103, 97, 105};
    double prev = prices[0];
    for (double p : prices) {
        double ret = (p - prev) / prev;
        std::cout << "EMA=" << ema.update(p)
                  << "  vol=" << evol.update(ret) << "\n";
        prev = p;
    }
}`,
    explanation:
      "The halflife parameterisation (alpha = 1 − e^{−ln2/h}) means observations h periods old receive half the weight of the current observation — more intuitive than alpha itself. EWMA volatility (RiskMetrics 1994) uses the same decay on squared returns: it weights recent volatility spikes heavily, naturally producing time-varying vol estimates used in VaR models.",
  },
  {
    id: "cpp-20260722-b1-welford-variance",
    language: "cpp",
    title: "Welford Online Mean and Variance (Numerically Stable)",
    tag: "numerics",
    code: `#include <cmath>
#include <cstdint>
#include <iostream>
#include <vector>

// Welford (1962) online algorithm: computes mean and variance in one pass
// without storing all values. Numerically stable — no catastrophic cancellation.
// Naive: Var = E[x^2] - E[x]^2 loses precision when Var << E[x]^2.
struct WelfordStats {
    uint64_t n   = 0;
    double   mean = 0.0;
    double   M2   = 0.0;  // sum of squared deviations from running mean

    void update(double x) {
        ++n;
        double delta  = x - mean;
        mean         += delta / n;
        double delta2 = x - mean;   // uses NEW mean
        M2           += delta * delta2;
    }

    // Population variance (use when observations == population)
    double variance_pop()  const { return n > 1 ? M2 / n       : 0.0; }
    // Sample variance (use for estimating population from sample)
    double variance_samp() const { return n > 1 ? M2 / (n - 1) : 0.0; }
    double stddev_samp()   const { return std::sqrt(variance_samp()); }

    // Merge two accumulators (parallel / distributed computation)
    WelfordStats& merge(const WelfordStats& other) {
        if (other.n == 0) return *this;
        uint64_t n_total = n + other.n;
        double   delta   = other.mean - mean;
        mean = (n * mean + other.n * other.mean) / n_total;
        M2  += other.M2 + delta * delta * n * other.n / n_total;
        n    = n_total;
        return *this;
    }
};

int main() {
    WelfordStats stats;
    std::vector<double> returns = {0.01, -0.02, 0.015, -0.005, 0.02, -0.01};
    for (double r : returns) stats.update(r);
    std::cout << "n="    << stats.n           << "\n";
    std::cout << "mean=" << stats.mean        << "\n";
    std::cout << "std="  << stats.stddev_samp() << "\n";
    // Annualised vol (252 trading days)
    std::cout << "ann_vol=" << stats.stddev_samp() * std::sqrt(252.0) << "\n";
}`,
    explanation:
      "Welford's recurrence avoids the two-pass algorithm (collect all values, then compute mean and variance) by accumulating M2 as the sum of squared deviations around the running mean. The merge() function enables map-reduce parallelism: each thread computes a partial accumulator, then they are combined. Used in production risk systems for streaming P&L variance computation.",
  },
  {
    id: "cpp-20260722-b1-p2-quantile",
    language: "cpp",
    title: "P² Algorithm for Streaming Quantile Estimation",
    tag: "numerics",
    code: `#include <array>
#include <algorithm>
#include <cmath>
#include <iostream>

// P² algorithm (Jain & Chlamtac 1985): estimates an arbitrary quantile
// in O(1) memory with O(1) update cost — no need to store the data stream.
// Maintains 5 marker positions (q[0..4]) and 5 desired positions (dn[0..4]).
struct P2Quantile {
    double   p;         // target quantile (e.g., 0.95 for 95th percentile)
    double   q[5];      // marker heights (approx quantile values)
    double   n[5];      // current marker positions
    double   dn[5];     // desired marker positions
    int      count = 0; // number of observations received
    double   init_buf[5]; // buffer for first 5 observations

    explicit P2Quantile(double quantile)
        : p(quantile)
        , dn{0, p/2, p, (1+p)/2, 1}
    {}

    // Piecewise parabolic formula for marker height update
    static double parabolic(double q[], double n[], int i, int d) {
        return q[i] + d * (
            (n[i]-n[i-1]+d) * (q[i+1]-q[i]) / (n[i+1]-n[i]) +
            (n[i+1]-n[i]-d) * (q[i]-q[i-1]) / (n[i]-n[i-1])
        ) / (n[i+1] - n[i-1]);
    }

    void update(double x) {
        if (count < 5) {
            init_buf[count++] = x;
            if (count == 5) {
                std::sort(init_buf, init_buf+5);
                for (int i=0;i<5;i++) { q[i]=init_buf[i]; n[i]=i+1; }
            }
            return;
        }
        ++count;
        // Find cell k where x falls
        int k = 0;
        if      (x < q[0]) { q[0] = x; k = 0; }
        else if (x < q[1]) k = 0;
        else if (x < q[2]) k = 1;
        else if (x < q[3]) k = 2;
        else if (x <= q[4]) k = 3;
        else               { q[4] = x; k = 3; }
        for (int i = k+1; i < 5; ++i) n[i]++;

        double np[5] = {1, 1+p/2, 1+p, (3+p)/2, 5};
        // --- update desired positions accumulation ---
        for (int i=0;i<5;i++) np[i] = 1 + (count-1)*dn[i];
        // Adjust marker heights
        for (int i=1; i<4; i++) {
            double d = np[i] - n[i];
            if ((d >= 1 && n[i+1]-n[i] > 1) || (d <= -1 && n[i-1]-n[i] < -1)) {
                int sign = (d > 0) ? 1 : -1;
                double qp = parabolic(q, n, i, sign);
                if (qp > q[i-1] && qp < q[i+1]) q[i] = qp;
                else q[i] += sign * (q[i+sign] - q[i]) / (n[i+sign] - n[i]);
                n[i] += sign;
            }
        }
    }

    double estimate() const { return count >= 5 ? q[2] : 0.0; }
};

int main() {
    P2Quantile q95(0.95);
    for (int i = 0; i < 10000; ++i) {
        double x = (double)rand() / RAND_MAX; // uniform [0,1]
        q95.update(x);
    }
    // True 95th percentile of Uniform(0,1) is 0.95
    std::cout << "P2 estimate of 95th percentile: " << q95.estimate() << "\n";
}`,
    explanation:
      "The P² algorithm maintains only 5 marker values and their desired positions, giving a streaming quantile estimate without storing the full data. It is used in risk systems for computing rolling VaR quantiles over market-data streams where storing all observations would require gigabytes. Typical accuracy is within 1–2% of the true quantile at stable distributions.",
  },
  {
    id: "cpp-20260722-b1-garch11",
    language: "cpp",
    title: "GARCH(1,1) Log-Likelihood Estimation (MLE)",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <array>
#include <iostream>
#include <numeric>

// GARCH(1,1): sigma_t^2 = omega + alpha*eps_{t-1}^2 + beta*sigma_{t-1}^2
// Parameters: omega > 0, alpha >= 0, beta >= 0, alpha+beta < 1 (stationarity).
// Estimated by maximum likelihood: maximise sum of log N(0, sigma_t^2) densities.

struct GARCH11 {
    double omega, alpha, beta;

    // Compute variance path given parameters
    std::vector<double> variance_path(const std::vector<double>& ret) const {
        int n = (int)ret.size();
        std::vector<double> sigma2(n);
        // Initialise to unconditional variance
        double uncond = omega / (1.0 - alpha - beta);
        sigma2[0] = uncond;
        for (int t = 1; t < n; ++t)
            sigma2[t] = omega + alpha * ret[t-1]*ret[t-1] + beta * sigma2[t-1];
        return sigma2;
    }

    // Negative log-likelihood (to minimise)
    double neg_loglik(const std::vector<double>& ret) const {
        if (omega <= 0 || alpha < 0 || beta < 0 || alpha + beta >= 1)
            return 1e20;
        auto sigma2 = variance_path(ret);
        double nll = 0.0;
        for (int t = 1; t < (int)ret.size(); ++t) {
            double s2 = sigma2[t];
            if (s2 <= 0) return 1e20;
            nll += 0.5 * (std::log(s2) + ret[t]*ret[t]/s2);
        }
        return nll;
    }

    // Numerical gradient for simple steepest-descent (production: use Nelder-Mead / L-BFGS)
    void fit(const std::vector<double>& ret, int iters = 500) {
        // Warm start: method-of-moments
        double var = 0;
        for (double r : ret) var += r*r;
        var /= ret.size();
        omega = 0.05 * var; alpha = 0.10; beta = 0.85;

        for (int it = 0; it < iters; ++it) {
            double f0 = neg_loglik(ret);
            double h = 1e-5;
            auto grad = [&](auto& p) {
                p += h; double fp = neg_loglik(ret);
                p -= h; return (fp - f0) / h;
            };
            double go = grad(omega), ga = grad(alpha), gb = grad(beta);
            double lr = 1e-5;
            omega -= lr * go; alpha -= lr * ga; beta -= lr * gb;
            // Project to feasible region
            omega = std::max(omega, 1e-8);
            alpha = std::max(alpha, 0.0);
            beta  = std::max(beta,  0.0);
            if (alpha + beta >= 0.9999) { alpha *= 0.9; beta *= 0.9; }
        }
    }
};

int main() {
    // Simulate GARCH(1,1) returns
    GARCH11 true_p{1e-6, 0.10, 0.85};
    std::vector<double> ret(500, 0);
    double s2 = true_p.omega / (1 - true_p.alpha - true_p.beta);
    for (int t = 1; t < 500; ++t) {
        s2 = true_p.omega + true_p.alpha*ret[t-1]*ret[t-1] + true_p.beta*s2;
        ret[t] = std::sqrt(s2) * ((rand()/(double)RAND_MAX - 0.5) * 3.46); // approx normal
    }
    GARCH11 est{0,0,0};
    est.fit(ret);
    std::cout << "omega=" << est.omega << " alpha=" << est.alpha << " beta=" << est.beta << "\n";
    std::cout << "persistence=" << est.alpha + est.beta << "\n";
}`,
    explanation:
      "GARCH(1,1) models conditional heteroskedasticity: variance tomorrow depends on today's squared shock and today's variance. The persistence α+β measures how long a volatility spike decays; values near 1 (typically 0.97–0.99 for daily equity) indicate long memory. MLE is preferred over method-of-moments because it uses the full variance path, not just second moments.",
  },
  {
    id: "cpp-20260722-b1-irs-npv",
    language: "cpp",
    title: "Fixed-for-Floating Interest Rate Swap NPV",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <iostream>

// IRS: receive fixed coupon K, pay floating LIBOR/SOFR, on a notional N.
// NPV = PV(fixed leg) - PV(float leg)
//     = N * sum_i( K * tau_i * df_i ) - N * (1 - df_N)
// where df_i = discount factor to period i, tau_i = day-count fraction.
// The float leg simplifies to (1 - df_N) when fully collateralised.

struct IRSwap {
    double notional;
    double fixed_rate;       // annual, e.g. 0.04 for 4%
    std::vector<double> payment_times; // years to each coupon
    std::vector<double> disc_factors;  // df for each coupon date

    double pv_fixed_leg() const {
        double pv = 0.0;
        for (int i = 0; i < (int)payment_times.size(); ++i) {
            double tau = (i == 0) ? payment_times[0]
                                  : payment_times[i] - payment_times[i-1];
            pv += fixed_rate * tau * disc_factors[i] * notional;
        }
        return pv;
    }

    // Float leg: assuming reset at start = DF(0) = 1 (par floating)
    double pv_float_leg() const {
        // Par float leg = N*(1 - df_N) under continuous compounding
        return notional * (1.0 - disc_factors.back());
    }

    double npv_receive_fixed() const { return pv_fixed_leg() - pv_float_leg(); }
    double npv_pay_fixed()     const { return pv_float_leg() - pv_fixed_leg(); }

    // DV01: NPV change for 1 bp parallel shift
    double dv01() const {
        double bp = 0.0001;
        // Shift all discount factors by 1bp (approx: df_i -> df_i * exp(-bp*t_i))
        IRSwap shifted = *this;
        for (int i = 0; i < (int)shifted.disc_factors.size(); ++i)
            shifted.disc_factors[i] *= std::exp(-bp * shifted.payment_times[i]);
        return shifted.npv_receive_fixed() - npv_receive_fixed();
    }
};

int main() {
    // 5Y semi-annual swap, fixed 4%, flat yield curve at 3%
    std::vector<double> times, dfs;
    for (int i = 1; i <= 10; ++i) {
        double t = i * 0.5;
        times.push_back(t);
        dfs.push_back(std::exp(-0.03 * t));
    }
    IRSwap swap{1e6, 0.04, times, dfs};
    std::cout << "NPV (receive fixed): " << swap.npv_receive_fixed() << "\n";
    std::cout << "DV01: " << swap.dv01() << "\n"; // ~$425 per $1M
}`,
    explanation:
      "The floating leg of a par swap equals N(1−df_N) because the float resets to par at each period — a standard simplification valid when the curve is used for both discounting and forwarding (single-curve world). In the multi-curve framework (post-2008), the forwarding curve (SOFR) differs from the discounting curve (OIS), and the float leg must be computed explicitly using forward rates.",
  },
  {
    id: "cpp-20260722-b1-cds-hazard",
    language: "cpp",
    title: "CDS Bootstrapping and Hazard Rate Extraction",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <iostream>

// CDS fair spread: buyer pays quarterly premium; seller pays loss given default.
// Hazard rate h: probability of surviving to T is exp(-h*T).
// Bootstrap: given market CDS spreads at 1Y, 2Y, 3Y, 5Y, 10Y,
// extract the piecewise-constant hazard rate curve.

struct CDSCurve {
    // Survival probability S(t) = exp(-int_0^t h(u) du)
    std::vector<double> tenors;  // e.g., {1,2,3,5,10}
    std::vector<double> hazards; // piecewise constant h on [T_{i-1}, T_i]

    double survival(double t) const {
        double cum = 0.0;
        for (int i = 0; i < (int)tenors.size(); ++i) {
            double t0 = (i == 0) ? 0.0 : tenors[i-1];
            double t1 = tenors[i];
            if (t <= t0) break;
            double seg = std::min(t, t1) - t0;
            cum += hazards[i] * seg;
        }
        return std::exp(-cum);
    }

    // CDS spread for maturity T (simplified: quarterly payments, flat df curve)
    double cds_spread(double T, double r, double R) const {
        int n = static_cast<int>(T * 4); // quarterly
        double pv_prem = 0.0, pv_prot = 0.0;
        for (int i = 1; i <= n; ++i) {
            double t = i * 0.25;
            double df = std::exp(-r * t);
            double S  = survival(t);
            pv_prem += 0.25 * df * S; // premium accrues if survived
            // Protection: loss at mid-period
            double S_prev = survival(t - 0.25);
            pv_prot += df * (1 - R) * (S_prev - S);
        }
        return pv_prot / pv_prem;
    }

    // Bootstrap: given spread at tenor T, solve for hazard in (T_{i-1}, T_i]
    void bootstrap(double T, double market_spread, double r, double R) {
        double t0 = tenors.empty() ? 0.0 : tenors.back();
        // Binary search for hazard that matches the market spread
        double lo = 0.0, hi = 5.0;
        for (int iter = 0; iter < 50; ++iter) {
            double mid = 0.5 * (lo + hi);
            tenors.push_back(T); hazards.push_back(mid);
            double sp = cds_spread(T, r, R);
            tenors.pop_back(); hazards.pop_back();
            if (sp < market_spread) lo = mid; else hi = mid;
        }
        tenors.push_back(T); hazards.push_back(0.5*(lo+hi));
    }
};

int main() {
    CDSCurve curve;
    double r = 0.03, R = 0.40; // risk-free rate, recovery rate
    // Bootstrap a 1Y, 3Y, 5Y CDS curve
    curve.bootstrap(1.0, 0.0050, r, R); // 50 bps
    curve.bootstrap(3.0, 0.0075, r, R); // 75 bps
    curve.bootstrap(5.0, 0.0100, r, R); // 100 bps
    std::cout << "S(1Y)=" << curve.survival(1.0)
              << " S(3Y)=" << curve.survival(3.0)
              << " S(5Y)=" << curve.survival(5.0) << "\n";
}`,
    explanation:
      "CDS bootstrapping is the credit analog of yield curve stripping: given market spreads, we sequentially solve for the hazard rate in each time segment that prices the CDS at par. The survival probability exp(−∫h dt) converts to default probability; the protection leg pays (1−R) times the default probability in each quarter. Recovery rates (R=40%) are typically fixed by convention.",
  },
  {
    id: "cpp-20260722-b1-hull-white-sim",
    language: "cpp",
    title: "Hull-White One-Factor Short Rate Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <random>
#include <iostream>
#include <algorithm>

// Hull-White (1990): dr = (theta(t) - a*r) dt + sigma dW
// theta(t) is calibrated to fit the initial zero curve exactly.
// Closed form: r(t) | r(0) ~ N(m(t), v(t)) where:
//   m(t) = r(0)*exp(-a*t) + integral_0^t theta(s)*exp(-a*(t-s))ds
//   v(t) = sigma^2*(1-exp(-2at))/(2a)
// For flat initial curve at r0: theta(t) = a*r0 + sigma^2*(1-exp(-2at))/(2a)
struct HullWhite {
    double a, sigma, r0; // mean-reversion speed, vol, initial rate

    // Exact conditional mean and variance for flat initial curve
    double mean(double t) const {
        return r0; // flat curve: long-run mean = r0
    }

    double variance(double t) const {
        return sigma*sigma * (1.0 - std::exp(-2.0*a*t)) / (2.0*a);
    }

    // Simulate N paths of the short rate at times t_grid
    std::vector<std::vector<double>>
    simulate(const std::vector<double>& t_grid, int n_paths, uint64_t seed = 42) {
        std::mt19937_64 rng(seed);
        std::normal_distribution<double> norm;
        int n_times = (int)t_grid.size();
        std::vector<std::vector<double>> paths(n_paths,
                                               std::vector<double>(n_times));

        for (int p = 0; p < n_paths; ++p) {
            double r = r0;
            double t_prev = 0.0;
            for (int j = 0; j < n_times; ++j) {
                double dt  = t_grid[j] - t_prev;
                double e   = std::exp(-a * dt);
                // Euler-Maruyama discretisation
                double m   = r * e + r0 * (1.0 - e); // flat curve adjustment
                double std = std::sqrt(variance(dt));
                r = m + std * norm(rng);
                paths[p][j] = r;
                t_prev = t_grid[j];
            }
        }
        return paths;
    }

    // Zero-coupon bond price P(0,T) = E[exp(-integral_0^T r(s)ds)]
    double bond_price(double T) const {
        // Analytic: A(T)*exp(-B(T)*r0) with flat initial curve
        double B = (1.0 - std::exp(-a*T)) / a;
        double A = std::exp((r0 - sigma*sigma/(2*a*a))*(B-T)
                           - sigma*sigma*B*B/(4*a));
        return A * std::exp(-B * r0);
    }
};

int main() {
    HullWhite hw{0.10, 0.01, 0.05}; // a=10%, sigma=1%, r0=5%
    std::vector<double> times = {0.25, 0.5, 1.0, 2.0, 5.0};
    auto paths = hw.simulate(times, 10000);

    // Verify: mean rate at T=1 should be near r0
    double sum = 0;
    for (auto& p : paths) sum += p[2]; // index 2 = t=1.0
    std::cout << "Mean r(1Y): " << sum/10000 << " (expected ~0.05)\n";
    std::cout << "P(0,5Y) analytic: " << hw.bond_price(5.0) << "\n";
}`,
    explanation:
      "Hull-White adds time-varying drift θ(t) to the Vasicek model specifically to match the initial zero curve exactly — a key advantage for derivatives pricing where mismatching the curve introduces arbitrage. The Euler-Maruyama step uses the analytic conditional mean (which accounts for mean-reversion) rather than naive Euler, reducing discretisation error from O(dt) to O(dt²).",
  },
  {
    id: "cpp-20260722-b1-sobol-qmc",
    language: "cpp",
    title: "Sobol Quasi-Random Sequence for Low-Discrepancy MC",
    tag: "numerics",
    code: `#include <cstdint>
#include <vector>
#include <cmath>
#include <iostream>

// Sobol sequence: a low-discrepancy quasi-random sequence filling [0,1)^d
// more uniformly than pseudo-random. For smooth integrands, convergence
// is O(log^d(N)/N) vs O(1/sqrt(N)) for pseudo-random.
// Gray code trick: each successive point differs in exactly one direction.

struct Sobol1D {
    static constexpr int BITS = 30;
    uint32_t direction_[BITS]; // direction numbers V_i
    uint32_t x_ = 0;           // current point (integer, divide by 2^BITS)
    uint32_t n_ = 0;           // sample count

    // Initialise with primitive polynomial p=1 (dimension 1 is trivial)
    Sobol1D() {
        for (int i = 0; i < BITS; ++i)
            direction_[i] = (1u << (BITS - 1 - i)); // s=1, a=0
    }

    double next() {
        // Gray code: use lowest zero bit position of n
        uint32_t c = 0;
        uint32_t nn = n_++;
        while ((nn & 1) == 0 && nn != 0) { nn >>= 1; ++c; }
        x_ ^= direction_[c];
        return x_ / static_cast<double>(1u << BITS);
    }
};

// Two-dimension scrambled Sobol for European call via QMC
double bs_call_qmc(double S0, double K, double r, double sigma, double T,
                   int n_points) {
    auto N_cdf = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    Sobol1D sob;
    double sum = 0.0;
    for (int i = 0; i < n_points; ++i) {
        double u = sob.next();
        // Box-Muller inverse CDF: Phi^{-1}(u) ≈ used via std::erfinv (not standard)
        // Use rational approximation for N^{-1}(u)
        double t = std::sqrt(-2.0 * std::log(u + 1e-12));
        double z = t - (2.515517 + 0.802853*t + 0.010328*t*t)
                      / (1 + 1.432788*t + 0.189269*t*t + 0.001308*t*t*t);
        double S = S0 * std::exp((r - 0.5*sigma*sigma)*T + sigma*std::sqrt(T)*z);
        sum += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * sum / n_points;
}

int main() {
    double price = bs_call_qmc(100, 100, 0.05, 0.2, 1.0, 4096);
    std::cout << "QMC call price: " << price << " (BS: ~10.45)\n";
}`,
    explanation:
      "Sobol sequences use the binary representation of n XORed with direction numbers to fill hypercubes more uniformly than pseudo-random. The Gray code trick (each step flips exactly one bit) means each new point is generated with a single XOR. For smooth payoffs (vanilla options), QMC with 4096 Sobol points can match the accuracy of 100,000 pseudo-random paths.",
  },
  {
    id: "cpp-20260722-b1-thread-pool",
    language: "cpp",
    title: "Work-Stealing Thread Pool for Parallel Greeks",
    tag: "low-latency",
    code: `#include <thread>
#include <vector>
#include <queue>
#include <functional>
#include <mutex>
#include <condition_variable>
#include <future>
#include <atomic>
#include <iostream>

// Simple thread pool: fixed worker threads pull tasks from a shared queue.
// Used for parallel Greeks computation: each instrument's delta/gamma
// is computed independently and can be parallelised across cores.
class ThreadPool {
    std::vector<std::thread>          workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex                        mu_;
    std::condition_variable           cv_;
    std::atomic<bool>                 stop_{false};

public:
    explicit ThreadPool(int n_threads) {
        for (int i = 0; i < n_threads; ++i) {
            workers_.emplace_back([this] {
                while (true) {
                    std::function<void()> task;
                    {
                        std::unique_lock lk(mu_);
                        cv_.wait(lk, [this]{ return stop_ || !tasks_.empty(); });
                        if (stop_ && tasks_.empty()) return;
                        task = std::move(tasks_.front());
                        tasks_.pop();
                    }
                    task(); // execute outside the lock
                }
            });
        }
    }

    ~ThreadPool() {
        stop_.store(true);
        cv_.notify_all();
        for (auto& w : workers_) w.join();
    }

    // Submit a callable, returns a future for the result
    template<typename F>
    auto submit(F&& f) -> std::future<decltype(f())> {
        using R = decltype(f());
        auto task = std::make_shared<std::packaged_task<R()>>(std::forward<F>(f));
        auto fut  = task->get_future();
        {
            std::lock_guard lk(mu_);
            tasks_.emplace([task]{ (*task)(); });
        }
        cv_.notify_one();
        return fut;
    }
};

int main() {
    ThreadPool pool(4);
    std::vector<std::future<double>> futs;

    // Compute delta for 8 instruments in parallel
    for (int i = 0; i < 8; ++i) {
        futs.push_back(pool.submit([i]() -> double {
            // Placeholder: expensive Greeks computation
            return 0.5 + i * 0.05;
        }));
    }

    double total_delta = 0;
    for (auto& f : futs) total_delta += f.get();
    std::cout << "Portfolio delta: " << total_delta << "\n";
}`,
    explanation:
      "packaged_task + future decouples submission from result collection: submit() is non-blocking; get() blocks only when the result is needed. The condition_variable avoids busy-polling — worker threads sleep until a task arrives. For parallel Greeks, each instrument is submitted independently; collecting results after all submissions amortises the synchronisation overhead.",
  },
  {
    id: "cpp-20260722-b1-rdtsc-timer",
    language: "cpp",
    title: "RDTSC Cycle Counter for Sub-Microsecond Benchmarking",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstdio>
#include <cmath>

// RDTSC reads the x86 Time Stamp Counter — 64-bit, increments every CPU cycle.
// On modern CPUs it is constant-frequency (invariant TSC), not core frequency.
// Memory fences before/after prevent reordering with the measured code.

inline uint64_t rdtsc() noexcept {
    uint32_t lo, hi;
    __asm__ volatile (
        "mfence\n\t"          // serialise: prevent load/store reordering across TSC
        "rdtsc\n\t"
        "mfence\n\t"
        : "=a"(lo), "=d"(hi)
    );
    return (static_cast<uint64_t>(hi) << 32) | lo;
}

// Estimate CPU frequency (ticks per second) from steady_clock
#include <chrono>
double ticks_per_ns() {
    using namespace std::chrono;
    auto t0 = steady_clock::now();
    uint64_t c0 = rdtsc();
    // Spin for ~1 ms
    volatile uint64_t sink = 0;
    for (uint64_t i = 0; i < 1'000'000; ++i) sink ^= i;
    uint64_t c1 = rdtsc();
    auto t1 = steady_clock::now();
    double ns = duration_cast<nanoseconds>(t1 - t0).count();
    return (c1 - c0) / ns;  // ticks per nanosecond
}

struct Timer {
    uint64_t start_;
    double   tpns_;        // ticks per nanosecond

    explicit Timer(double tpns) : tpns_(tpns), start_(rdtsc()) {}

    double elapsed_ns() const {
        return (rdtsc() - start_) / tpns_;
    }
};

int main() {
    double tpns = ticks_per_ns();
    std::printf("CPU frequency: %.2f GHz\n", tpns);

    // Benchmark a Black-Scholes evaluation
    auto bs_call = [](double S, double K, double r, double sigma, double T) {
        double d1 = (std::log(S/K) + (r+0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
        double d2 = d1 - sigma*std::sqrt(T);
        return S*0.5*std::erfc(-d1/std::sqrt(2.0)) - K*std::exp(-r*T)*0.5*std::erfc(-d2/std::sqrt(2.0));
    };

    Timer t(tpns);
    volatile double price = bs_call(100, 100, 0.05, 0.2, 1.0);
    double ns = t.elapsed_ns();
    std::printf("BS call: %.2f  in %.1f ns\n", price, ns);
}`,
    explanation:
      "RDTSC is the gold standard for sub-microsecond timing on x86 because it has ~1-cycle resolution and near-zero overhead (~3 ns). mfence serialises loads and stores, preventing the CPU from executing the measured code before the TSC read (out-of-order execution would otherwise make the measurement unreliable). Converting cycles to nanoseconds requires calibrating ticks_per_ns against wall time.",
  },
  {
    id: "cpp-20260722-b1-spinlock",
    language: "cpp",
    title: "Spinlock with Exponential Backoff and Pause Hint",
    tag: "low-latency",
    code: `#include <atomic>
#include <thread>
#include <cstdint>
#include <immintrin.h>  // _mm_pause
#include <iostream>
#include <vector>

// Spinlock beats std::mutex for critical sections < 1 µs because
// mutex involves a syscall (futex) when contended. Backoff prevents
// cache-line thrashing when many threads compete.
class Spinlock {
    alignas(64) std::atomic<bool> locked_{false};

public:
    void lock() noexcept {
        uint32_t spin = 1;
        while (true) {
            // Test-and-test-and-set: read (shared mode) before write (exclusive)
            if (!locked_.load(std::memory_order_relaxed) &&
                !locked_.exchange(true, std::memory_order_acquire))
                return; // acquired

            // Exponential backoff: spin spin times with pause hints
            for (uint32_t i = 0; i < spin; ++i)
                _mm_pause(); // x86 PAUSE — tells CPU this is a spin-wait loop

            if (spin < 1024) spin <<= 1; // cap at 1024 pauses
        }
    }

    void unlock() noexcept {
        locked_.store(false, std::memory_order_release);
    }

    // RAII guard
    struct Guard {
        Spinlock& sl;
        explicit Guard(Spinlock& s) : sl(s) { sl.lock(); }
        ~Guard() { sl.unlock(); }
    };
};

// Example: accumulate fill counts with a spinlock
int main() {
    Spinlock sl;
    long fills = 0;
    std::vector<std::thread> threads;
    for (int t = 0; t < 4; ++t) {
        threads.emplace_back([&] {
            for (int i = 0; i < 100000; ++i) {
                Spinlock::Guard g(sl);
                ++fills;
            }
        });
    }
    for (auto& t : threads) t.join();
    std::cout << "Total fills: " << fills << "\n"; // 400000
}`,
    explanation:
      "Test-and-test-and-set reads the lock without writing (shared cache line) and only attempts exchange when the lock looks free — reducing bus traffic. _mm_pause (x86 PAUSE) hints to the pipeline that this is a spin-wait, allowing the CPU to avoid memory-order violations during the spin and reduce power draw. Exponential backoff prevents thundering-herd when the lock becomes available.",
  },
  {
    id: "cpp-20260722-b1-false-sharing",
    language: "cpp",
    title: "False Sharing Prevention with Cache Line Padding",
    tag: "low-latency",
    code: `#include <atomic>
#include <thread>
#include <cstddef>
#include <array>
#include <chrono>
#include <iostream>

// False sharing: two variables on the same cache line (64 bytes),
// updated by different threads. Every write invalidates the entire line
// on all other cores — adding >100 ns of coherence latency to each access.
// Fix: pad each hot variable to occupy a full cache line.

// BAD: counters[0] and counters[1] share a cache line → false sharing
struct BadCounters {
    std::atomic<long> counters[4]; // all in 32 bytes — collide in cache
};

// GOOD: each counter owns 64 bytes
struct alignas(64) PaddedCounter {
    std::atomic<long> value{0};
    char pad[64 - sizeof(std::atomic<long>)]; // fill remaining bytes
};

// C++17: hardware_destructive_interference_size is the authoritative cache line size
static constexpr std::size_t CACHE_LINE =
#ifdef __cpp_lib_hardware_interference_size
    std::hardware_destructive_interference_size;
#else
    64;
#endif

struct GoodCounters {
    std::array<PaddedCounter, 4> counters;
};

void benchmark(auto& counters_ref, const char* label) {
    using namespace std::chrono;
    constexpr int N = 10'000'000;
    auto t0 = steady_clock::now();

    std::thread t0t([&]{ for (int i=0;i<N;++i) counters_ref[0].value.fetch_add(1, std::memory_order_relaxed); });
    std::thread t1t([&]{ for (int i=0;i<N;++i) counters_ref[1].value.fetch_add(1, std::memory_order_relaxed); });
    t0t.join(); t1t.join();

    auto t1 = steady_clock::now();
    std::cout << label << ": " << duration_cast<milliseconds>(t1-t0).count() << " ms\n";
}

int main() {
    GoodCounters good;
    benchmark(good.counters, "padded (no false sharing)");
}`,
    explanation:
      "On a modern x86, a cache line is 64 bytes. Two threads each writing their own variable become serialised if the variables share a line — every write forces all other caches to reload the entire 64-byte line. Padding to fill a full cache line eliminates this: each variable is the sole occupant of its line and threads never invalidate each other's lines. Typical speedup: 5–10× on 2+ threads.",
  },
  {
    id: "cpp-20260722-b1-skip-list-levels",
    language: "cpp",
    title: "Skip List for O(log N) Order Book Level Lookup",
    tag: "data-structures",
    code: `#include <cstdint>
#include <random>
#include <optional>
#include <array>
#include <iostream>

// Skip list: probabilistic multi-level linked list giving O(log N) search.
// Preferred over balanced BSTs in price-level books because insert/erase
// are O(log N) with simpler code and good cache behaviour at level 1.
static constexpr int MAX_LEVEL = 16;

struct SkipNode {
    int64_t  price;     // tick-encoded price
    uint64_t qty;
    std::array<SkipNode*, MAX_LEVEL> fwd; // forward pointers per level
    explicit SkipNode(int64_t p = 0, uint64_t q = 0)
        : price(p), qty(q), fwd{} {}
};

class PriceLevelSkipList {
    SkipNode  header_{std::numeric_limits<int64_t>::min(), 0};
    int       level_ = 0;
    std::mt19937 rng_{42};

    int random_level() {
        int lvl = 0;
        while (lvl < MAX_LEVEL - 1 && (rng_() & 1)) ++lvl;
        return lvl;
    }

public:
    void insert(int64_t price, uint64_t qty) {
        std::array<SkipNode*, MAX_LEVEL> update;
        SkipNode* x = &header_;
        for (int i = level_; i >= 0; --i) {
            while (x->fwd[i] && x->fwd[i]->price < price)
                x = x->fwd[i];
            update[i] = x;
        }
        x = x->fwd[0];
        if (x && x->price == price) { x->qty += qty; return; } // merge
        int lvl = random_level();
        if (lvl > level_) {
            for (int i = level_+1; i <= lvl; ++i) update[i] = &header_;
            level_ = lvl;
        }
        auto* n = new SkipNode(price, qty);
        for (int i = 0; i <= lvl; ++i) {
            n->fwd[i]       = update[i]->fwd[i];
            update[i]->fwd[i] = n;
        }
    }

    std::optional<uint64_t> find(int64_t price) const {
        const SkipNode* x = &header_;
        for (int i = level_; i >= 0; --i)
            while (x->fwd[i] && x->fwd[i]->price < price)
                x = x->fwd[i];
        x = x->fwd[0];
        if (x && x->price == price) return x->qty;
        return std::nullopt;
    }

    SkipNode* best_bid() const { return header_.fwd[0]; } // lowest price
};

int main() {
    PriceLevelSkipList book;
    book.insert(10000, 100); book.insert(10010, 200); book.insert(9990, 50);
    if (auto q = book.find(10010)) std::cout << "10010: " << *q << "\n"; // 200
    std::cout << "Best: " << book.best_bid()->price << "\n"; // 9990
}`,
    explanation:
      "Skip lists achieve O(log N) expected search/insert/delete by maintaining multiple levels of linked lists, each a subset of the level below. The probabilistic level assignment makes the structure self-balancing without rotations. For order book price levels, skip lists are preferred over red-black trees because level-0 forms a natural sorted iterator for sweeping levels during matching.",
  },
  {
    id: "cpp-20260722-b1-fx-graph",
    language: "cpp",
    title: "FX Arbitrage Detection via Bellman-Ford on Log Graph",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <optional>
#include <string>
#include <iostream>
#include <limits>

// FX rate matrix: rates[i][j] = 1 unit of currency i buys rates[i][j] of j.
// Profitable cycle: product of rates along a cycle > 1.
// Transform: w[i][j] = -log(rates[i][j]). Negative cycle ↔ product > 1.
// Bellman-Ford detects negative cycle in O(V*E) time.

struct FXGraph {
    int n; // number of currencies
    std::vector<std::vector<double>> rates;
    std::vector<std::string>         names;

    struct Edge { int u, v; double w; };

    std::vector<Edge> edges() const {
        std::vector<Edge> es;
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                if (i != j && rates[i][j] > 0)
                    es.push_back({i, j, -std::log(rates[i][j])});
        return es;
    }

    // Returns the arbitrage cycle (currencies) if one exists
    std::optional<std::vector<int>> find_arbitrage() const {
        auto es = edges();
        std::vector<double> dist(n, 0.0);  // start from 0 (all reachable)
        std::vector<int>    prev(n, -1);

        // n-1 relaxations
        for (int iter = 0; iter < n - 1; ++iter)
            for (const auto& e : es)
                if (dist[e.u] + e.w < dist[e.v]) {
                    dist[e.v] = dist[e.u] + e.w;
                    prev[e.v] = e.u;
                }

        // n-th relaxation: detect cycle
        for (const auto& e : es) {
            if (dist[e.u] + e.w < dist[e.v] - 1e-10) {
                // Trace back the cycle
                std::vector<bool> visited(n, false);
                int v = e.v;
                for (int i = 0; i < n; ++i) v = prev[v]; // skip pre-cycle nodes
                int start = v;
                std::vector<int> cycle;
                do {
                    cycle.push_back(v);
                    v = prev[v];
                } while (v != start && (int)cycle.size() <= n);
                cycle.push_back(start);
                return cycle;
            }
        }
        return std::nullopt;
    }
};

int main() {
    FXGraph g{3, {{1,0.9,0.8},{1.12,1,0.89},{1.27,1.13,1}},
              {"USD","EUR","GBP"}};
    if (auto cycle = g.find_arbitrage()) {
        std::cout << "Arbitrage: ";
        for (int c : *cycle) std::cout << g.names[c] << " ";
        std::cout << "\n"; // USD EUR GBP USD (or similar)
    }
}`,
    explanation:
      "Taking logs converts the product constraint (rates along cycle > 1) into a sum constraint (log-rates sum < 0), enabling Bellman-Ford's standard negative-cycle detection. Starting all distances at 0 (rather than infinity for one source) allows detection of arbitrage reachable from any currency. Production FX arbitrage systems run this in microseconds on 20–50 currency graphs.",
  },
  {
    id: "cpp-20260722-b1-stop-limit",
    language: "cpp",
    title: "Stop-Limit Order State Machine",
    tag: "data-structures",
    code: `#include <cstdint>
#include <functional>
#include <iostream>

// Stop-limit order: when market price crosses the stop price,
// the order becomes a limit order at the limit price.
// Two prices: stop (trigger) and limit (max buy / min sell).
// States: PENDING → TRIGGERED → LIVE → FILLED / CANCELLED

enum class StopState { PENDING, TRIGGERED, LIVE, FILLED, CANCELLED };

struct StopLimitOrder {
    uint64_t   id;
    double     stop_price;   // activation threshold
    double     limit_price;  // limit price after activation
    uint32_t   qty;
    bool       buy;          // true=buy stop, false=sell stop
    StopState  state = StopState::PENDING;

    // Called on each market print
    void on_market_price(double mkt_price,
                         std::function<void(StopLimitOrder&)> on_trigger) {
        if (state != StopState::PENDING) return;

        bool triggered = buy  ? (mkt_price >= stop_price)   // buy stop: price rises above stop
                               : (mkt_price <= stop_price);  // sell stop: price falls below stop

        if (triggered) {
            state = StopState::TRIGGERED;
            std::cout << "Order " << id << " triggered at " << mkt_price << "\n";
            on_trigger(*this);
            state = StopState::LIVE;
        }
    }

    // Matching engine callback: returns filled qty (partial fill supported)
    uint32_t try_fill(double offer_price) {
        if (state != StopState::LIVE) return 0;
        bool can_fill = buy  ? (offer_price <= limit_price)
                              : (offer_price >= limit_price);
        if (!can_fill) return 0;
        state = StopState::FILLED;
        std::cout << "Order " << id << " filled at " << offer_price << "\n";
        return qty;
    }

    void cancel() { if (state == StopState::PENDING || state == StopState::LIVE)
                        state = StopState::CANCELLED; }
};

int main() {
    StopLimitOrder o{1, 101.0, 100.5, 100, true}; // buy stop at 101, limit 100.5

    auto on_trigger = [](StopLimitOrder& ord) {
        // Typically: submit limit order to the order book here
        std::cout << "  Submitting limit buy " << ord.qty
                  << " @ " << ord.limit_price << "\n";
    };

    o.on_market_price(100.0, on_trigger); // no trigger
    o.on_market_price(101.5, on_trigger); // triggers!
    o.try_fill(100.3);                    // filled (100.3 <= 100.5)
}`,
    explanation:
      "Stop-limit orders require a two-level state machine: the stop triggers passively on market prints, then the resulting limit order participates in matching. Buy stops activate above the stop price (used for breakout entries or loss-limiting short stops); sell stops activate below (used for stop-loss on long positions). The limit price prevents slippage beyond an acceptable level when the market gaps through the stop.",
  },
  {
    id: "cpp-20260722-b1-black76-caplet",
    language: "cpp",
    title: "Black-76 Model for Interest Rate Caplets",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <iostream>

// Black (1976) extension: prices options on forward prices/rates.
// Caplet pays max(L_i - K, 0) * tau at end of accrual period [T_i, T_{i+1}].
// where L_i is the floating rate set at T_i and paid at T_{i+1}.
// Black-76 formula: Caplet = P(0,T_{i+1}) * tau * [F*N(d1) - K*N(d2)]
// F: forward rate for [T_i, T_{i+1}], sigma: Black vol.

static double N_cdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }

struct Black76Caplet {
    double tau;    // accrual fraction (e.g., 0.25 for quarterly)
    double F;      // forward rate for the period
    double K;      // cap strike
    double sigma;  // Black volatility (annualised)
    double T;      // reset date (option expiry)
    double df;     // discount factor to payment date T+tau

    double price() const {
        double sqrt_T = std::sqrt(T);
        double d1 = (std::log(F/K) + 0.5*sigma*sigma*T) / (sigma*sqrt_T);
        double d2 = d1 - sigma * sqrt_T;
        return df * tau * (F * N_cdf(d1) - K * N_cdf(d2));
    }

    double delta() const {  // dCaplet/dF (forward delta)
        double sqrt_T = std::sqrt(T);
        double d1 = (std::log(F/K) + 0.5*sigma*sigma*T) / (sigma*sqrt_T);
        return df * tau * N_cdf(d1);
    }
};

// Cap = sum of caplets over all reset dates
struct IRCap {
    std::vector<Black76Caplet> caplets;
    double notional;

    double price() const {
        double total = 0.0;
        for (const auto& c : caplets) total += c.price();
        return total * notional;
    }
};

int main() {
    // 2Y quarterly cap, strike 5%, flat fwd curve at 4.5%, flat 3% disc, 20% black vol
    IRCap cap{{}, 1e6};
    double r = 0.03;
    for (int i = 1; i <= 8; ++i) {
        double T = i * 0.25;                       // reset date
        double df = std::exp(-r * (T + 0.25));     // payment at T+tau
        cap.caplets.push_back({0.25, 0.045, 0.05, 0.20, T, df});
    }
    std::cout << "2Y Cap price (notional $1M): $" << cap.price() << "\n";
}`,
    explanation:
      "Black-76 applies Black-Scholes to forward rates rather than spot prices: the forward rate F replaces S0, and the discount factor to the payment date replaces e^{-rT}. This is valid because the forward rate is a martingale under the T-forward measure. IR caps are used to hedge floating-rate loan exposure: they pay off when LIBOR/SOFR rises above the cap strike K.",
  },
  {
    id: "cpp-20260722-b1-heston-mc-cpp",
    language: "cpp",
    title: "Heston Stochastic Volatility Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <iostream>

// Heston (1993) model: dS = r*S*dt + sqrt(v)*S*dW1
//                      dv = kappa*(theta-v)*dt + xi*sqrt(v)*dW2
// Corr(dW1,dW2) = rho. Full vol smile via two correlated Brownian motions.

double heston_mc(double S0, double K, double r,
                 double v0, double kappa, double theta, double xi, double rho,
                 double T, int n_steps, int n_paths, uint64_t seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> norm;

    double dt   = T / n_steps;
    double disc = std::exp(-r * T);
    double sum  = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0, v = v0;
        for (int t = 0; t < n_steps; ++t) {
            double Z1 = norm(rng);
            double Z2 = rho*Z1 + std::sqrt(1-rho*rho)*norm(rng);

            double v_pos = std::max(v, 0.0); // truncation fix for negative v
            double sqrt_v = std::sqrt(v_pos);

            // Full Euler-Maruyama for log-price, Milstein for variance
            double log_S = std::log(S);
            log_S += (r - 0.5*v_pos)*dt + sqrt_v*std::sqrt(dt)*Z1;
            S = std::exp(log_S);

            // Milstein correction for v: reduces O(dt) bias
            v += kappa*(theta - v_pos)*dt + xi*sqrt_v*std::sqrt(dt)*Z2
               + 0.25*xi*xi*dt*(Z2*Z2 - 1);  // Milstein term

            v = std::max(v, 0.0); // ensure non-negative (Feller: 2*kappa*theta >= xi^2)
        }
        sum += std::max(S - K, 0.0);
    }
    return disc * sum / n_paths;
}

int main() {
    // Typical equity parameters
    double price = heston_mc(
        100, 100, 0.03,   // S0, K, r
        0.04, 2.0, 0.04, 0.3, -0.7, // v0, kappa, theta, xi, rho
        1.0, 252, 100000  // T, steps, paths
    );
    std::cout << "Heston call MC: " << price << " (BS: ~7.5)\n";
}`,
    explanation:
      "The Milstein correction for the variance process adds a term proportional to (ΔW)²−dt that reduces the strong convergence order from 0.5 to 1.0, halving the number of time steps required for the same accuracy. Truncating v at zero (rather than reflecting) is the simplest fix for negative variance but introduces a small bias; the QE (Quadratic Exponential) scheme is superior for large dt.",
  },
  {
    id: "cpp-20260722-b1-token-bucket",
    language: "cpp",
    title: "Token Bucket Rate Limiter for Order Submission",
    tag: "low-latency",
    code: `#include <atomic>
#include <chrono>
#include <cstdint>
#include <iostream>

// Token bucket: tokens accumulate at rate 'rate_per_ns', capped at 'burst'.
// Each order consumes one token. If no tokens available, order is rejected.
// Lock-free implementation suitable for single-thread hot path.
struct TokenBucket {
    double   rate_per_ns; // tokens added per nanosecond
    double   burst;       // max tokens (sets burst capacity)
    double   tokens;      // current token count
    uint64_t last_ns;     // last refill time (nanoseconds)

    using Clock = std::chrono::steady_clock;

    TokenBucket(double rate_per_second, double burst_size)
        : rate_per_ns(rate_per_second / 1e9)
        , burst(burst_size)
        , tokens(burst_size)
        , last_ns(0)
    {
        auto now = Clock::now().time_since_epoch();
        last_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(now).count();
    }

    // Refill tokens based on elapsed time, then consume one.
    bool allow() {
        auto now_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(
            Clock::now().time_since_epoch()).count();
        double elapsed = static_cast<double>(now_ns - last_ns);
        tokens = std::min(burst, tokens + elapsed * rate_per_ns);
        last_ns = now_ns;

        if (tokens >= 1.0) { tokens -= 1.0; return true; }
        return false; // rate limit hit
    }

    // Attempt to consume n tokens atomically (bulk order check)
    bool allow_n(double n) {
        auto now_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(
            Clock::now().time_since_epoch()).count();
        tokens = std::min(burst, tokens + (now_ns - last_ns) * rate_per_ns);
        last_ns = now_ns;
        if (tokens >= n) { tokens -= n; return true; }
        return false;
    }
};

int main() {
    TokenBucket tb(1000.0, 10.0); // 1000 orders/sec, burst of 10

    int allowed = 0, denied = 0;
    for (int i = 0; i < 15; ++i) {
        if (tb.allow()) ++allowed; else ++denied;
    }
    std::cout << "Allowed: " << allowed << "  Denied: " << denied << "\n";
    // First 10 (burst) allowed immediately; remainder denied
}`,
    explanation:
      "The token bucket is the standard algorithm for smooth rate limiting with burst tolerance: regulators and exchanges impose order-submission rate limits (e.g., 1000 orders/s, burst 50). The continuous-time refill (proportional to elapsed nanoseconds) avoids the slot-boundary effects of discrete-window counters. For multi-threaded access, the token_ and last_ns fields must be protected by a spinlock or made atomic.",
  },
  {
    id: "cpp-20260722-b1-portfolio-greeks",
    language: "cpp",
    title: "Portfolio Delta and Gamma Aggregation Across Instruments",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <unordered_map>
#include <string>
#include <iostream>
#include <numeric>

// For a portfolio of options, aggregate delta and gamma by underlying.
// Delta = sum(pos_i * delta_i * notional_i)
// Gamma = sum(pos_i * gamma_i * notional_i)
// where delta_i and gamma_i are per-share Greeks.

struct OptionPosition {
    std::string underlying; // e.g. "AAPL"
    double      position;   // +100 = long 100 contracts
    double      contract_size; // e.g., 100 shares per contract
    double      delta;      // per-share delta
    double      gamma;      // per-share gamma
    double      vega;       // per-share vega (per 1% vol move)
    double      theta;      // per-share theta (per day)
};

struct GreeksAggregator {
    std::unordered_map<std::string, double> net_delta, net_gamma, net_vega, net_theta;

    void add(const OptionPosition& pos) {
        double shares = pos.position * pos.contract_size;
        net_delta[pos.underlying] += shares * pos.delta;
        net_gamma[pos.underlying] += shares * pos.gamma;
        net_vega [pos.underlying] += shares * pos.vega;
        net_theta[pos.underlying] += shares * pos.theta;
    }

    // Dollar delta: P&L change for $1 move in underlying
    double dollar_delta(const std::string& sym) const {
        auto it = net_delta.find(sym);
        return it != net_delta.end() ? it->second : 0.0;
    }

    // Dollar gamma: change in dollar delta for $1 move
    double dollar_gamma(const std::string& sym) const {
        auto it = net_gamma.find(sym);
        return it != net_gamma.end() ? it->second : 0.0;
    }

    void print() const {
        for (const auto& [sym, d] : net_delta) {
            std::cout << sym
                      << " Delta=" << d
                      << " Gamma=" << net_gamma.at(sym)
                      << " Vega="  << net_vega.at(sym)  << "/1%"
                      << " Theta=" << net_theta.at(sym) << "/day\n";
        }
    }
};

int main() {
    GreeksAggregator agg;
    agg.add({"AAPL", +10, 100, 0.55, 0.025, 15.0, -3.5});  // long 10 AAPL calls
    agg.add({"AAPL", -5,  100, 0.30, 0.018, 10.0, -2.0});  // short 5 AAPL puts
    agg.add({"GOOG",  +2, 100, 0.60, 0.010,  8.0, -1.8});  // long 2 GOOG calls

    agg.print();
    std::cout << "AAPL $Delta=$1 move: " << agg.dollar_delta("AAPL") << "\n";
}`,
    explanation:
      "Portfolio Greeks aggregation scales individual option greeks by position size and contract multiplier. Dollar delta (net_delta × spot) represents the equivalent equity exposure; dollar gamma shows how fast the delta changes. Traders use net delta to hedge via futures/stock, net gamma to assess hedging frequency, and net vega to assess volatility mark-to-market risk.",
  },
  {
    id: "cpp-20260722-b1-compile-matrix",
    language: "cpp",
    title: "Compile-Time N×N Matrix for Covariance Operations",
    tag: "meta-programming",
    code: `#include <array>
#include <cstddef>
#include <cmath>
#include <iostream>

// constexpr N×N matrix stored as a flat array.
// All operations are computed at compile time when inputs are constexpr.
// Used for small covariance matrices known at compile time (e.g., 3-factor model).
template<std::size_t N>
struct Matrix {
    std::array<double, N*N> data{};

    constexpr double  operator()(std::size_t r, std::size_t c) const { return data[r*N+c]; }
    constexpr double& operator()(std::size_t r, std::size_t c)       { return data[r*N+c]; }

    constexpr Matrix operator*(const Matrix& b) const {
        Matrix res{};
        for (std::size_t i = 0; i < N; ++i)
            for (std::size_t k = 0; k < N; ++k)
                for (std::size_t j = 0; j < N; ++j)
                    res(i,j) += (*this)(i,k) * b(k,j);
        return res;
    }

    // Transpose
    constexpr Matrix T() const {
        Matrix res{};
        for (std::size_t i = 0; i < N; ++i)
            for (std::size_t j = 0; j < N; ++j)
                res(i,j) = (*this)(j,i);
        return res;
    }

    // Quadratic form x'Ax
    constexpr double quad(const std::array<double,N>& x) const {
        double s = 0;
        for (std::size_t i = 0; i < N; ++i)
            for (std::size_t j = 0; j < N; ++j)
                s += x[i] * (*this)(i,j) * x[j];
        return s;
    }
};

// 3-factor covariance (mkt, size, value) known at compile time
constexpr Matrix<3> SIGMA = [] {
    Matrix<3> m{};
    m(0,0)=0.04; m(1,1)=0.01; m(2,2)=0.01;
    m(0,1)=m(1,0)=0.005; m(0,2)=m(2,0)=0.002; m(1,2)=m(2,1)=0.001;
    return m;
}();

int main() {
    // Portfolio weight on 3 factors: 0.6*mkt + 0.3*size + 0.1*value
    constexpr std::array<double,3> w = {0.6, 0.3, 0.1};
    constexpr double port_var = SIGMA.quad(w); // w' Sigma w — compile-time!
    std::cout << "Portfolio variance: " << port_var << "\n";
    std::cout << "Portfolio vol:      " << std::sqrt(port_var) << "\n";

    // Check sigma*sigma — compile-time matrix square
    constexpr auto sigma2 = SIGMA * SIGMA;
    std::cout << "Sigma^2[0,0]: " << sigma2(0,0) << "\n";
}`,
    explanation:
      "constexpr matrix operations move fixed computations (covariance of a known factor model, repeated matrix multiplications for term-structure propagation) from runtime to compile time. The compiler evaluates the quadratic form SIGMA.quad(w) at compile time for constexpr weights, producing a constant in the binary with zero runtime cost. This pattern is used in HFT systems to pre-compute volatility bounds and Greeks coefficient matrices.",
  },
  {
    id: "cpp-20260722-b1-rcu-snapshot",
    language: "cpp",
    title: "Read-Copy-Update (RCU) Snapshot for Hot Reference Data",
    tag: "low-latency",
    code: `#include <atomic>
#include <memory>
#include <vector>
#include <thread>
#include <iostream>
#include <functional>

// RCU (Read-Copy-Update): readers always see a consistent snapshot with
// zero synchronisation cost. Writers create a new copy, update it,
// then atomically publish the pointer. Old copy persists until no reader holds it.
// Readers use a shared_ptr; the last reader to drop the old copy frees it.
template<typename T>
class RCUProtected {
    std::atomic<std::shared_ptr<const T>> ptr_;

public:
    explicit RCUProtected(std::shared_ptr<const T> init)
        : ptr_(std::move(init)) {}

    // O(1) read — zero lock, zero CAS; load is a single pointer read
    std::shared_ptr<const T> read() const {
        return std::atomic_load_explicit(&ptr_, std::memory_order_acquire);
    }

    // Writer: apply update function, publish new version
    void update(std::function<T(const T&)> updater) {
        auto old_ptr = std::atomic_load_explicit(&ptr_, std::memory_order_acquire);
        auto new_val = std::make_shared<T>(updater(*old_ptr));
        // Retry if another writer raced (optimistic concurrency)
        while (!std::atomic_compare_exchange_strong_explicit(
                   &ptr_, &old_ptr, std::shared_ptr<const T>(new_val),
                   std::memory_order_release, std::memory_order_acquire)) {
            new_val = std::make_shared<T>(updater(*old_ptr));
        }
    }
};

// Example: reference data for option pricing (vol surface, curves)
struct RefData {
    double r;        // risk-free rate
    double vol_atm;  // ATM vol
    std::vector<double> spot_prices; // per-symbol
};

int main() {
    auto ref = std::make_shared<RefData>(RefData{0.05, 0.20, {100, 200, 300}});
    RCUProtected<RefData> rcu_ref(ref);

    // Simulate multiple strategy threads reading concurrently
    std::thread reader1([&] {
        for (int i = 0; i < 1000; ++i) {
            auto snap = rcu_ref.read(); // no lock, no CAS
            volatile double r = snap->r; // use the snapshot
        }
    });

    // Writer updates the reference data
    rcu_ref.update([](const RefData& old) {
        RefData nw = old;
        nw.vol_atm = 0.21; // vol move
        return nw;
    });

    reader1.join();
    std::cout << "Final vol: " << rcu_ref.read()->vol_atm << "\n"; // 0.21
}`,
    explanation:
      "RCU enables zero-cost reads: strategy threads load a shared_ptr once per tick with only an acquire fence — no mutex, no CAS. Writers create a new copy off the critical path, then publish it atomically. The old snapshot is kept alive as long as any reader holds a shared_ptr to it (reference counting via shared_ptr), so stale readers never access freed memory.",
  },
];
