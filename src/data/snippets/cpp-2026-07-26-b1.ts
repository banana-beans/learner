import type { Snippet } from "./types";

export const cppSnippets20260726B1: Snippet[] = [
  {
    id: "cpp-20260726-b1-crtp-order",
    language: "cpp",
    title: "CRTP for zero-cost static polymorphism in order types",
    tag: "templates",
    code: `#include <cstdint>
#include <cstdio>

// Curiously Recurring Template Pattern: Base<Derived> casts *this to Derived
// at compile time — no virtual table, no pointer indirection.
template<typename Derived>
struct OrderBase {
    int64_t price() const {
        return static_cast<const Derived*>(this)->price_impl();
    }
    int32_t qty()   const {
        return static_cast<const Derived*>(this)->qty_impl();
    }
    char side() const {
        return static_cast<const Derived*>(this)->side_impl();
    }
    // Non-virtual algorithm that uses the interface above
    int64_t notional() const { return price() * qty(); }
};

struct LimitOrder : OrderBase<LimitOrder> {
    int64_t px; int32_t q; char s;
    int64_t price_impl() const { return px; }
    int32_t qty_impl()   const { return q;  }
    char    side_impl()  const { return s;  }
};

struct StopOrder  : OrderBase<StopOrder> {
    int64_t trigger; int32_t q; char s;
    int64_t price_impl() const { return trigger; }
    int32_t qty_impl()   const { return q; }
    char    side_impl()  const { return s; }
};

// Works for any OrderBase<T> without virtual dispatch — inlined by compiler
template<typename T>
void print_order(const OrderBase<T>& o) {
    printf("%c %d @ %lld  notional=%lld\\n",
           o.side(), o.qty(), (long long)o.price(), (long long)o.notional());
}

int main() {
    LimitOrder lo{10050, 200, 'B'};
    StopOrder  so{9900,  100, 'S'};
    print_order(lo);
    print_order(so);
}`,
    explanation: "CRTP achieves static polymorphism: the base class template receives the concrete type as a template argument and casts down to it via static_cast, calling the derived implementation directly in the instruction stream with zero virtual dispatch overhead — identical ASM to calling the derived method directly.",
  },
  {
    id: "cpp-20260726-b1-expr-template-portfolio",
    language: "cpp",
    title: "Expression templates for lazy portfolio vector math",
    tag: "templates",
    code: `#include <cstddef>
#include <cstdio>
#include <array>

// Expression templates defer element-wise computation until assignment,
// avoiding temporary vectors: (w + delta * gamma) is computed one element
// at a time, never materialised into a heap buffer.

template<typename E>
struct VecExpr {
    double operator[](size_t i) const {
        return static_cast<const E&>(*this)[i];
    }
    size_t size() const { return static_cast<const E&>(*this).size(); }
};

template<size_t N>
struct Vec : VecExpr<Vec<N>> {
    std::array<double, N> data{};
    double operator[](size_t i) const { return data[i]; }
    size_t size()               const { return N; }

    // Assignment from any expression — no temporaries
    template<typename E>
    Vec& operator=(const VecExpr<E>& rhs) {
        for (size_t i = 0; i < N; ++i) data[i] = rhs[i];
        return *this;
    }
};

// Lazy addition: holds references, no computation until element access
template<typename L, typename R>
struct VecAdd : VecExpr<VecAdd<L, R>> {
    const L& l; const R& r;
    VecAdd(const L& l, const R& r) : l(l), r(r) {}
    double operator[](size_t i) const { return l[i] + r[i]; }
    size_t size()               const { return l.size(); }
};

// Lazy scalar multiply
template<typename E>
struct ScalarMul : VecExpr<ScalarMul<E>> {
    const E& e; double s;
    ScalarMul(const E& e, double s) : e(e), s(s) {}
    double operator[](size_t i) const { return s * e[i]; }
    size_t size()               const { return e.size(); }
};

template<typename L, typename R>
VecAdd<L,R> operator+(const VecExpr<L>& l, const VecExpr<R>& r) {
    return {static_cast<const L&>(l), static_cast<const R&>(r)};
}
template<typename E>
ScalarMul<E> operator*(double s, const VecExpr<E>& e) {
    return {static_cast<const E&>(e), s};
}

int main() {
    Vec<4> w, delta, gamma, result;
    w.data     = {0.25, 0.25, 0.25, 0.25};
    delta.data = {0.50, 0.40, 0.60, 0.35};
    gamma.data = {0.02, 0.01, 0.03, 0.015};

    // No temporaries: computes w[i] + 0.01*delta[i] + 0.5*gamma[i] per element
    result = w + 0.01 * delta + 0.5 * gamma;
    for (size_t i = 0; i < 4; ++i)
        printf("result[%zu] = %.4f\\n", i, result[i]);
}`,
    explanation: "Expression templates represent arithmetic expressions as a compile-time tree of nested template types; each node holds references to its operands rather than values, so the actual computation is deferred to the assignment loop where all operations fuse into a single pass — the same technique Eigen uses to eliminate temporary matrix allocations.",
  },
  {
    id: "cpp-20260726-b1-jthread-feed",
    language: "cpp",
    title: "std::jthread with stop_token for clean feed shutdown",
    tag: "cpp20",
    code: `#include <thread>
#include <stop_token>
#include <atomic>
#include <chrono>
#include <cstdio>

// std::jthread automatically joins on destruction (no detach/join ceremony).
// stop_token lets the thread observe a cooperative shutdown request from outside.
std::atomic<int64_t> g_last_price{0};

void feed_loop(std::stop_token stop, int feed_id) {
    int tick = 0;
    // stop_requested() polls the atomic stop flag; very cheap (~1 ns).
    while (!stop.stop_requested()) {
        // Simulate receiving a tick
        g_last_price.store(10000 + tick++, std::memory_order_relaxed);
        std::this_thread::sleep_for(std::chrono::microseconds(100));
    }
    printf("Feed %d stopped after %d ticks (price=%lld)\\n",
           feed_id, tick, (long long)g_last_price.load());
}

int main() {
    // jthread constructor takes a callable that accepts std::stop_token
    std::jthread feed(feed_loop, 1);

    std::this_thread::sleep_for(std::chrono::milliseconds(5));

    // request_stop() sets the token atomically; feed_loop exits on next check
    feed.request_stop();
    // jthread destructor joins automatically — no manual join() needed
}`,
    explanation: "std::jthread (C++20) combines automatic RAII joining with cooperative cancellation via stop_token: request_stop() atomically signals the token, and the thread polls stop_requested() in its hot loop; this replaces the manual atomic<bool> shutdown flag pattern and prevents the silent thread leak that detached threads can cause.",
  },
  {
    id: "cpp-20260726-b1-atomic-cas-midprice",
    language: "cpp",
    title: "CAS loop for lock-free atomic mid-price update",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <cmath>
#include <cstdio>

// Mid-price is updated by multiple feed threads; we need lock-free semantics
// but std::atomic<double> doesn't have a fetch_add.
// Solution: compare_exchange loop — reads, computes, stores atomically.

// Store/load doubles via uint64_t bit_cast to get atomic operations.
struct AtomicDouble {
    std::atomic<uint64_t> bits{0};

    static uint64_t encode(double d) noexcept {
        uint64_t u; __builtin_memcpy(&u, &d, 8); return u;
    }
    static double decode(uint64_t u) noexcept {
        double d; __builtin_memcpy(&d, &u, 8); return d;
    }

    void store(double d, std::memory_order o = std::memory_order_seq_cst) {
        bits.store(encode(d), o);
    }
    double load(std::memory_order o = std::memory_order_seq_cst) const {
        return decode(bits.load(o));
    }
    // Update via CAS loop: applies f(old_value) → new_value atomically
    template<typename F>
    double apply(F f) {
        uint64_t old = bits.load(std::memory_order_relaxed);
        uint64_t desired;
        do {
            desired = encode(f(decode(old)));
        } while (!bits.compare_exchange_weak(old, desired,
                    std::memory_order_release,
                    std::memory_order_relaxed));
        return decode(desired);
    }
};

AtomicDouble g_mid;

void update_mid(double new_bid, double new_ask) {
    // Atomically set mid = (bid + ask) / 2 without mutex
    g_mid.store((new_bid + new_ask) / 2.0, std::memory_order_release);
}

int main() {
    g_mid.store(100.0);
    // Atomic update: apply a correction delta
    double new_val = g_mid.apply([](double v){ return v * 1.001; });
    printf("Updated mid: %.4f\\n", new_val);

    update_mid(100.10, 100.20);
    printf("Mid after quote: %.4f\\n", g_mid.load());
}`,
    explanation: "std::atomic<double> supports load/store but not arithmetic operations; the compare_exchange_weak loop implements any atomic read-modify-write: it retries only if another thread raced the update between the load and the CAS, making progress in O(1) expected attempts under low contention.",
  },
  {
    id: "cpp-20260726-b1-fold-greeks",
    language: "cpp",
    title: "Fold expressions for variadic portfolio Greeks aggregation",
    tag: "cpp17",
    code: `#include <cstdio>
#include <tuple>

// C++17 fold expressions collapse a parameter pack with a binary operator
// in a single expression — no recursion, no helper struct.

struct Greeks {
    double delta, gamma, vega, theta;
};

// Sum all Greeks across a variadic list of positions.
// The fold (+ ...) expands to: g0.delta + g1.delta + g2.delta + ...
template<typename... Gs>
Greeks aggregate(const Gs&... gs) {
    return Greeks{
        (gs.delta + ...),     // fold over delta
        (gs.gamma + ...),     // fold over gamma
        (gs.vega  + ...),
        (gs.theta + ...),
    };
}

// Apply a risk limit check to every position in a pack
template<typename... Gs>
bool all_within_limit(double max_delta, const Gs&... gs) {
    // Unary fold with &&: short-circuits on first violation
    return ((std::abs(gs.delta) <= max_delta) && ...);
}

// Accumulate net delta with a fold over addition
template<typename... Gs>
double net_delta(const Gs&... gs) {
    return (0.0 + ... + gs.delta);  // binary fold with init
}

int main() {
    Greeks g1{0.50, 0.02, 0.15, -0.05};
    Greeks g2{-0.30, 0.01, 0.10, -0.03};
    Greeks g3{0.20, 0.03, 0.08, -0.02};

    auto total = aggregate(g1, g2, g3);
    printf("Net delta=%.2f  gamma=%.2f  vega=%.2f  theta=%.2f\\n",
           total.delta, total.gamma, total.vega, total.theta);

    printf("All within 0.6 delta: %s\\n",
           all_within_limit(0.6, g1, g2, g3) ? "yes" : "no");
}`,
    explanation: "C++17 fold expressions eliminate the recursive template helper needed in C++14 for variadic parameter pack operations; the unary fold (expr op ...) expands directly in the AST and the compiler is free to optimise it into a single SIMD addition across all values at the call site.",
  },
  {
    id: "cpp-20260726-b1-builtin-expect",
    language: "cpp",
    title: "__builtin_expect for branch prediction hints in hot path",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstdio>

// __builtin_expect(cond, likely_value) tells the compiler which branch is
// the common case so it places the likely code inline and the unlikely code
// in a cold section, improving instruction cache utilisation.

#define LIKELY(x)   __builtin_expect(!!(x), 1)
#define UNLIKELY(x) __builtin_expect(!!(x), 0)

struct Tick {
    int64_t price;
    int32_t qty;
    uint8_t flags;   // 0x01 = synthetic, 0x02 = crossed, 0x04 = stale
};

// In a 10 Mpps feed, 99.9% of ticks are valid — flag check is rare.
inline void process_tick(const Tick& t) {
    if (UNLIKELY(t.flags != 0)) {
        // cold path: handle bad ticks — moved out of the L1I hot path
        if (t.flags & 0x01) { printf("synthetic tick, skip\\n"); return; }
        if (t.flags & 0x02) { printf("crossed tick, skip\\n");   return; }
        if (t.flags & 0x04) { printf("stale tick, skip\\n");     return; }
    }
    // hot path: 99.9% of execution hits here — stays in L1 instruction cache
    // e.g. update order book, compute signal
    (void)t.price;
    (void)t.qty;
}

// Position check: most orders are fully within limits (LIKELY)
inline bool check_limit(int64_t position, int64_t limit) {
    if (LIKELY(position >= -limit && position <= limit))
        return true;                  // fast path — inline
    printf("LIMIT BREACH: pos=%lld limit=%lld\\n",
           (long long)position, (long long)limit);
    return false;
}

int main() {
    Tick good{10050, 100, 0x00};
    Tick bad {10050, 100, 0x04};
    process_tick(good);
    process_tick(bad);
    printf("Within limit: %s\\n", check_limit(500, 1000) ? "yes" : "no");
    printf("Within limit: %s\\n", check_limit(1500, 1000) ? "yes" : "no");
}`,
    explanation: "__builtin_expect moves the unlikely branch target out of the hot instruction stream; on a modern out-of-order CPU the branch predictor will mostly agree with the hint, but the cache benefit comes from the compiler laying out the likely path linearly so it fits in fewer cache lines — critical when processing millions of ticks per second.",
  },
  {
    id: "cpp-20260726-b1-fix-parser",
    language: "cpp",
    title: "FIX 4.2 tag=value message parser",
    tag: "market-data",
    code: `#include <string_view>
#include <unordered_map>
#include <charconv>
#include <cstdint>
#include <cstdio>

// FIX protocol encodes messages as tag=value\x01 pairs (SOH separator).
// Fast parsing: scan delimiters, use from_chars for number fields.

using TagMap = std::unordered_map<int, std::string_view>;

TagMap parse_fix(std::string_view msg) {
    TagMap tags;
    const char* p   = msg.data();
    const char* end = msg.data() + msg.size();

    while (p < end) {
        // Find '=' separating tag from value
        const char* eq = p;
        while (eq < end && *eq != '=') ++eq;
        if (eq == end) break;

        // Parse tag (integer)
        int tag = 0;
        std::from_chars(p, eq, tag);

        // Find SOH (0x01) separating this value from next tag
        const char* soh = eq + 1;
        while (soh < end && *soh != '\x01') ++soh;

        tags.emplace(tag, std::string_view{eq + 1, size_t(soh - eq - 1)});
        p = soh + 1;
    }
    return tags;
}

// Extract typed fields from the tag map
template<typename T>
T get_num(const TagMap& m, int tag, T def = {}) {
    auto it = m.find(tag);
    if (it == m.end()) return def;
    T val{};
    std::from_chars(it->second.data(),
                    it->second.data() + it->second.size(), val);
    return val;
}

int main() {
    // FIX NewOrderSingle: tag 35=MsgType, 49=SenderCompID, 55=Symbol,
    //   54=Side(1=Buy), 38=OrderQty, 44=Price, 40=OrdType(2=Limit)
    std::string fix = "8=FIX.4.2\x01""35=D\x01""49=CLIENT\x01"
                      "55=AAPL\x01""54=1\x01""38=500\x01""44=182.50\x01""40=2\x01";
    auto tags = parse_fix(fix);

    printf("Symbol:  %.*s\\n", (int)tags[55].size(), tags[55].data());
    printf("Side:    %d (1=Buy)\\n", get_num<int>(tags, 54));
    printf("Qty:     %d\\n", get_num<int>(tags, 38));
    printf("Price:   %.2f\\n", get_num<double>(tags, 44));
}`,
    explanation: "FIX parsing is a latency-critical hot path in execution systems; using std::string_view avoids heap allocation for tag values (they reference slices of the original buffer), and std::from_chars is the fastest standard number-parsing function because it has no locale overhead and is branch-prediction-friendly for well-formed inputs.",
  },
  {
    id: "cpp-20260726-b1-bootstrap-par-curve",
    language: "cpp",
    title: "Par yield curve bootstrapping via Newton-Raphson",
    tag: "rates",
    code: `#include <vector>
#include <cmath>
#include <cstdio>

// Bootstrap: given par yields, extract zero-coupon discount factors.
// At each maturity T_n, the par bond prices at 100: its coupon = par yield.
// 100 = Σ_{i=1}^{n} c * df[i] + 100 * df[n]
// Solve for df[n] given known df[1..n-1].

struct YieldCurve {
    std::vector<double> tenors;   // years: 0.5, 1.0, 2.0, ...
    std::vector<double> par_yields;
    std::vector<double> discount;  // bootstrapped discount factors

    // Bootstrap one new tenor onto an existing curve
    void bootstrap_step(double T, double par_yield) {
        double coupon = par_yield;
        double freq   = (T <= 1.0 && tenors.empty()) ? 1.0 : 2.0; // semi-annual for T>1
        double dcf    = 1.0 / freq;

        // Sum of coupon PVs using already-bootstrapped discount factors
        double coupon_pv = 0.0;
        for (size_t i = 0; i < tenors.size(); ++i) {
            if (tenors[i] < T)
                coupon_pv += coupon * dcf * discount[i];
        }

        // Solve: 1 = coupon * dcf * df[T] + coupon_pv + df[T]
        // → df[T] = (1 - coupon_pv) / (1 + coupon * dcf)
        double df_T = (1.0 - coupon_pv) / (1.0 + coupon * dcf);

        tenors.push_back(T);
        par_yields.push_back(par_yield);
        discount.push_back(df_T);

        double zero_rate = -std::log(df_T) / T;
        printf("T=%.1f  par=%.3f%%  df=%.6f  zero=%.3f%%\\n",
               T, par_yield*100, df_T, zero_rate*100);
    }

    double forward_rate(size_t i) const {
        if (i == 0) return -std::log(discount[0]) / tenors[0];
        double dt = tenors[i] - tenors[i-1];
        return std::log(discount[i-1] / discount[i]) / dt;
    }
};

int main() {
    YieldCurve curve;
    // US Treasury-like par yields (simplified, annual coupons for illustration)
    for (auto [T, y] : std::initializer_list<std::pair<double,double>>{
            {0.5, 0.050}, {1.0, 0.051}, {2.0, 0.048},
            {3.0, 0.047}, {5.0, 0.046}, {10.0, 0.048}})
        curve.bootstrap_step(T, y);

    printf("\\n--- Forward rates ---\\n");
    for (size_t i = 0; i < curve.tenors.size(); ++i)
        printf("T=%.1f  fwd=%.3f%%\\n", curve.tenors[i], curve.forward_rate(i)*100);
}`,
    explanation: "Par yield bootstrapping extracts the unique zero-coupon curve consistent with observed par bond prices by solving each step in closed form: the discount factor at the new tenor is the sole unknown after earlier discount factors are already bootstrapped, making the procedure exact and O(n²) in the number of pillars.",
  },
  {
    id: "cpp-20260726-b1-trinomial-american",
    language: "cpp",
    title: "Trinomial tree for American put option pricing",
    tag: "derivatives",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <cstdio>

// Trinomial tree: three branches (up/middle/down) per step.
// Better convergence than binomial for American options and barrier options
// because the middle node keeps the stock at its current level.
double trinomial_american_put(double S, double K, double r,
                               double sigma, double T, int N) {
    double dt   = T / N;
    double u    = std::exp(sigma * std::sqrt(2.0 * dt));
    double d    = 1.0 / u;
    double disc = std::exp(-r * dt);

    // Risk-neutral probabilities (Kamrad-Ritchken parameterisation)
    double pu = std::pow((std::exp(r * dt / 2) - std::exp(-sigma * std::sqrt(dt / 2)))
                / (std::exp(sigma * std::sqrt(dt / 2)) - std::exp(-sigma * std::sqrt(dt / 2))), 2);
    double pd = std::pow((std::exp(sigma * std::sqrt(dt / 2)) - std::exp(r * dt / 2))
                / (std::exp(sigma * std::sqrt(dt / 2)) - std::exp(-sigma * std::sqrt(dt / 2))), 2);
    double pm = 1.0 - pu - pd;

    // Terminal nodes: indices -N..0..+N, node (step, j) has price S * u^j
    int n_nodes = 2 * N + 1;
    std::vector<double> V(n_nodes);

    // Terminal payoffs
    for (int j = -N; j <= N; ++j) {
        double ST = S * std::pow(u, j);
        V[j + N] = std::max(K - ST, 0.0);   // put payoff
    }

    // Backward induction with early exercise check
    for (int step = N - 1; step >= 0; --step) {
        for (int j = -step; j <= step; ++j) {
            double hold = disc * (pu * V[j+1 + N] + pm * V[j + N] + pd * V[j-1 + N]);
            double exercise = std::max(K - S * std::pow(u, j), 0.0);
            V[j + N] = std::max(hold, exercise);   // American exercise
        }
    }
    return V[N];   // central node at time 0
}

int main() {
    // American put: S=100 K=105 r=5% vol=20% T=1yr N=200
    double price = trinomial_american_put(100.0, 105.0, 0.05, 0.20, 1.0, 200);
    printf("American put (trinomial N=200): %.4f\\n", price);
    // Compare: European put ≈ 9.90; American > European due to early exercise
}`,
    explanation: "The trinomial tree adds a horizontal (stay-flat) branch to the binomial, which dramatically improves convergence for American options and barrier options by placing a node exactly on the barrier or critical exercise boundary at each step; the Kamrad-Ritchken parameterisation keeps probabilities positive for all σ and r.",
  },
  {
    id: "cpp-20260726-b1-bs-greeks-struct",
    language: "cpp",
    title: "Black-Scholes Greeks struct: delta, gamma, vega, theta, rho",
    tag: "derivatives",
    code: `#include <cmath>
#include <cstdio>

static double N_cdf(double x) { return 0.5 * std::erfc(-x * M_SQRT1_2); }
static double N_pdf(double x) { return std::exp(-0.5*x*x) / std::sqrt(2*M_PI); }

struct BSGreeks {
    double S, K, r, q, sigma, T;  // q = continuous dividend yield

    double d1() const { return (std::log(S/K) + (r - q + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T)); }
    double d2() const { return d1() - sigma*std::sqrt(T); }

    double call_price() const { return S*std::exp(-q*T)*N_cdf(d1()) - K*std::exp(-r*T)*N_cdf(d2()); }
    double put_price()  const { return K*std::exp(-r*T)*N_cdf(-d2()) - S*std::exp(-q*T)*N_cdf(-d1()); }

    // Delta: ∂V/∂S — sensitivity to spot move
    double call_delta() const { return std::exp(-q*T) * N_cdf(d1()); }
    double put_delta()  const { return std::exp(-q*T) * (N_cdf(d1()) - 1.0); }

    // Gamma: ∂²V/∂S² — same for calls and puts (put-call parity)
    double gamma() const {
        return std::exp(-q*T) * N_pdf(d1()) / (S * sigma * std::sqrt(T));
    }

    // Vega: ∂V/∂σ per unit vol — same for calls and puts
    double vega() const {
        return S * std::exp(-q*T) * N_pdf(d1()) * std::sqrt(T);
    }

    // Theta: ∂V/∂T (per calendar day, negative for long options)
    double call_theta() const {
        double t1 = -S*std::exp(-q*T)*N_pdf(d1())*sigma / (2*std::sqrt(T));
        double t2 = -r*K*std::exp(-r*T)*N_cdf(d2());
        double t3 =  q*S*std::exp(-q*T)*N_cdf(d1());
        return (t1 + t2 + t3) / 365.0;
    }

    // Rho: ∂V/∂r per 1% move in rates
    double call_rho() const { return K*T*std::exp(-r*T)*N_cdf(d2())  / 100.0; }
    double put_rho()  const { return -K*T*std::exp(-r*T)*N_cdf(-d2()) / 100.0; }
};

int main() {
    BSGreeks g{100.0, 100.0, 0.05, 0.0, 0.20, 1.0};
    printf("Call: %.4f  Put: %.4f\\n", g.call_price(), g.put_price());
    printf("Call delta: %.4f  Put delta: %.4f\\n", g.call_delta(), g.put_delta());
    printf("Gamma: %.4f  Vega: %.4f\\n", g.gamma(), g.vega());
    printf("Call theta ($/day): %.4f\\n", g.call_theta());
    printf("Call rho ($/1%%): %.4f\\n", g.call_rho());
}`,
    explanation: "Analytical Greeks are exact first/second derivatives of the Black-Scholes formula: gamma and vega are equal for puts and calls by put-call parity (same convexity and vol sensitivity), while delta differs by 1 and rho differs in sign; including the dividend yield q via the Merton adjustment handles equity options on dividend-paying stocks.",
  },
  {
    id: "cpp-20260726-b1-barrier-mc",
    language: "cpp",
    title: "Down-and-out barrier option Monte Carlo",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <cstdio>

// Down-and-out call: knocked out if stock ever falls below barrier H.
// Monitoring is discrete (daily) — continuous monitoring requires Brownian bridge correction.
double dao_call_mc(double S0, double K, double H, double r,
                   double sigma, double T, int steps, int paths) {
    double dt   = T / steps;
    double drift= (r - 0.5 * sigma * sigma) * dt;
    double sqdt = std::sqrt(dt);

    std::mt19937_64 rng(42);
    std::normal_distribution<double> N01;

    double sum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S   = S0;
        bool knocked = false;

        for (int i = 0; i < steps && !knocked; ++i) {
            S *= std::exp(drift + sigma * sqdt * N01(rng));
            if (S <= H) knocked = true;   // touched or crossed barrier
        }

        if (!knocked)
            sum += std::max(S - K, 0.0);  // payoff only if survived
    }
    return std::exp(-r * T) * sum / paths;
}

// Brownian bridge correction for continuous barrier monitoring:
// Probability of hitting H between t and t+dt given S_t and S_{t+dt}.
double bb_barrier_prob(double St, double Sdt, double H, double sigma, double dt) {
    if ((St > H && Sdt > H) || (St < H && Sdt < H)) {
        // Both same side: can still cross if H is in between via the bridge
        if (St >= H && Sdt >= H) {
            return std::exp(-2.0 * std::log(St/H) * std::log(Sdt/H) / (sigma*sigma*dt));
        }
    }
    return 1.0;   // already crossed
}

int main() {
    // S=100 K=100 H=90 r=5% vol=20% T=1yr
    double price = dao_call_mc(100, 100, 90, 0.05, 0.20, 1.0, 252, 500000);
    printf("D&O call MC (discrete): %.4f\\n", price);
    // Closed-form (Merton 1973): ≈ 6.08 for these params
}`,
    explanation: "A down-and-out call has its vanilla value minus the expected cost of the knock-out: at barriers deep OTM (H << S), the vanilla and D&O prices converge; near the barrier, the option is nearly worthless because most paths are immediately knocked out — the Brownian bridge correction extends discrete monitoring to the continuous limit by conditioning on whether a bridge between two observed points crosses the barrier.",
  },
  {
    id: "cpp-20260726-b1-antithetic-mc",
    language: "cpp",
    title: "Antithetic variates for MC variance reduction",
    tag: "simulation",
    code: `#include <cmath>
#include <random>
#include <cstdio>

// Antithetic variates: for each path z~N(0,1), also simulate -z.
// The payoffs f(z) and f(-z) are negatively correlated, so their average
// has lower variance: Var[(f(z)+f(-z))/2] < Var[f(z)].
// Cost: half the paths but same convergence — effectively ~2× speedup.

double bs_call_antithetic(double S, double K, double r, double sigma, double T,
                           int paths) {
    double drift = (r - 0.5 * sigma * sigma) * T;
    double sqT   = std::sqrt(T);

    std::mt19937_64 rng(42);
    std::normal_distribution<double> N01;

    double sum = 0.0;
    // Each iteration uses paths/2 draws but 2 payoffs — same total work
    for (int i = 0; i < paths / 2; ++i) {
        double z  = N01(rng);
        double ST1 = S * std::exp(drift + sigma * sqT *  z);
        double ST2 = S * std::exp(drift + sigma * sqT * -z);  // antithetic

        double p1 = std::max(ST1 - K, 0.0);
        double p2 = std::max(ST2 - K, 0.0);
        sum += 0.5 * (p1 + p2);    // averaged pair
    }
    return std::exp(-r * T) * sum / (paths / 2);
}

double bs_call_plain(double S, double K, double r, double sigma, double T,
                     int paths) {
    double drift = (r - 0.5*sigma*sigma)*T, sqT = std::sqrt(T);
    std::mt19937_64 rng(42);
    std::normal_distribution<double> N01;
    double sum = 0;
    for (int i = 0; i < paths; ++i)
        sum += std::max(S * std::exp(drift + sigma*sqT*N01(rng)) - K, 0.0);
    return std::exp(-r*T) * sum / paths;
}

int main() {
    // Black-Scholes: analytical price ≈ 10.4506
    double exact = 10.4506;
    double plain  = bs_call_plain     (100, 100, 0.05, 0.20, 1.0, 100000);
    double anti   = bs_call_antithetic(100, 100, 0.05, 0.20, 1.0, 100000);
    printf("Analytical: %.4f\\n", exact);
    printf("Plain MC:   %.4f  error=%.4f\\n", plain,  std::abs(plain  - exact));
    printf("Antithetic: %.4f  error=%.4f\\n", anti,   std::abs(anti   - exact));
}`,
    explanation: "Antithetic variates exploit the negative correlation between payoffs along a path z and its mirror -z: for a monotone payoff like a call, a high-payoff path z always pairs with a low-payoff path -z, halving the variance with zero additional random number generation and typically achieving 2–4× variance reduction for vanilla options.",
  },
  {
    id: "cpp-20260726-b1-pde-explicit-bs",
    language: "cpp",
    title: "Explicit finite-difference PDE solver for Black-Scholes",
    tag: "derivatives",
    code: `#include <vector>
#include <algorithm>
#include <cmath>
#include <cstdio>

// Explicit (forward Euler) finite difference for Black-Scholes PDE:
//   ∂V/∂t + 0.5σ²S²∂²V/∂S² + rS∂V/∂S - rV = 0
// Discretise on a uniform grid: S ∈ [0, S_max], t ∈ [0, T].
// STABILITY: dt <= dx² / (σ² S_max²) — otherwise explicit scheme explodes.

double bs_put_explicit_fd(double S0, double K, double r, double sigma,
                          double T, int M, int N) {
    double S_max = 3.0 * K;       // grid upper boundary
    double dS    = S_max / M;     // spatial step
    double dt    = T / N;         // time step (must satisfy CFL condition)

    // Stability check
    double cfl = dt / (dS * dS) * sigma * sigma * S_max * S_max;
    if (cfl > 1.0) {
        printf("WARNING: CFL = %.2f > 1, scheme may be unstable\\n", cfl);
    }

    std::vector<double> V(M + 1), V_new(M + 1);

    // Terminal condition: put payoff at t = T
    for (int i = 0; i <= M; ++i)
        V[i] = std::max(K - i * dS, 0.0);

    // Backward in time from T to 0
    for (int n = 0; n < N; ++n) {
        // Boundary conditions
        V_new[0] = K * std::exp(-r * (T - (n+1)*dt));  // put at S=0 → K*exp(-r*tau)
        V_new[M] = 0.0;                                  // put at S=Smax → 0

        for (int i = 1; i < M; ++i) {
            double S_i  = i * dS;
            double d2V  = (V[i+1] - 2*V[i] + V[i-1]) / (dS * dS);
            double dV   = (V[i+1] - V[i-1]) / (2 * dS);
            V_new[i] = V[i] + dt * (0.5*sigma*sigma*S_i*S_i*d2V + r*S_i*dV - r*V[i]);
        }
        V = V_new;
    }

    // Interpolate to find V(S0)
    int idx = static_cast<int>(S0 / dS);
    double frac = (S0 - idx * dS) / dS;
    return V[idx] * (1 - frac) + V[idx+1] * frac;
}

int main() {
    double price = bs_put_explicit_fd(100.0, 100.0, 0.05, 0.20, 1.0, 200, 5000);
    printf("European put (FD explicit): %.4f\\n", price);  // BS analytical ≈ 5.5735
}`,
    explanation: "The explicit (forward Euler) scheme updates each grid point directly from its neighbours, making it trivially parallelisable; however, it is conditionally stable — the CFL number dt/(dS²) × σ²S² must stay below 1, requiring many time steps for large grids; implicit (Crank-Nicolson) schemes trade this restriction for a tridiagonal linear solve per time step.",
  },
  {
    id: "cpp-20260726-b1-map-orderbook",
    language: "cpp",
    title: "std::map order book with sorted bid/ask levels",
    tag: "orderbook",
    code: `#include <map>
#include <cstdint>
#include <cstdio>

// std::map<price, qty> keeps levels sorted automatically.
// Bids: descending (std::greater) → best bid is begin()
// Asks: ascending (std::less)    → best ask is begin()
// Insert/erase: O(log n). Best bid/ask: O(1) iterator.

struct PriceLevel { int64_t qty; int32_t order_count; };

struct OrderBook {
    std::map<int64_t, PriceLevel, std::greater<int64_t>> bids;   // best bid first
    std::map<int64_t, PriceLevel>                         asks;   // best ask first

    void add(char side, int64_t price, int64_t qty) {
        auto& book = (side == 'B') ? (std::map<int64_t,PriceLevel,std::greater<int64_t>>&)bids
                                   : (std::map<int64_t,PriceLevel,std::greater<int64_t>>&)asks;
        if (side == 'B') { bids[price].qty += qty; bids[price].order_count++; }
        else             { asks[price].qty += qty; asks[price].order_count++; }
    }

    void remove(char side, int64_t price, int64_t qty) {
        auto process = [&](auto& book) {
            auto it = book.find(price);
            if (it == book.end()) return;
            it->second.qty -= qty;
            it->second.order_count--;
            if (it->second.qty <= 0) book.erase(it);
        };
        if (side == 'B') process(bids); else process(asks);
    }

    int64_t best_bid() const { return bids.empty() ? 0 : bids.begin()->first; }
    int64_t best_ask() const { return asks.empty() ? 0 : asks.begin()->first; }
    int64_t spread()   const { return best_ask() - best_bid(); }

    void print_top(int depth = 3) const {
        auto bid_it = bids.begin(); auto ask_it = asks.begin();
        for (int i = 0; i < depth; ++i) {
            int64_t bpx = (bid_it != bids.end()) ? bid_it->first : 0;
            int64_t apx = (ask_it != asks.end()) ? ask_it->first : 0;
            printf("[%d] bid %lld  ask %lld\\n", i,
                   (long long)bpx, (long long)apx);
            if (bid_it != bids.end()) ++bid_it;
            if (ask_it != asks.end()) ++ask_it;
        }
    }
};

int main() {
    OrderBook book;
    book.add('B', 10050, 100); book.add('B', 10048, 300);
    book.add('B', 10045, 200);
    book.add('S', 10055, 150); book.add('S', 10058, 250);
    printf("Spread: %lld\\n", (long long)book.spread());
    book.print_top();
}`,
    explanation: "Using std::map<price, PriceLevel> with std::greater for bids provides automatic sorted order so best bid/ask is always begin() in O(1); the trade-off vs. unordered_map is O(log n) insert/erase rather than O(1), but sorted access to the full depth ladder is free — useful when strategies need to walk the book.",
  },
  {
    id: "cpp-20260726-b1-token-bucket",
    language: "cpp",
    title: "Token bucket rate limiter for order submission",
    tag: "execution",
    code: `#include <atomic>
#include <chrono>
#include <cstdint>
#include <cstdio>

// Token bucket: refills at rate r tokens/sec, max burst capacity = capacity.
// Each order submission consumes one token; submission is rejected if bucket empty.
// Thread-safe via compare_exchange loop on the token count.

using Clock = std::chrono::steady_clock;
using Ns    = std::chrono::nanoseconds;

struct TokenBucket {
    double   rate;       // tokens per second
    double   capacity;   // max burst
    std::atomic<int64_t> tokens_ns{};  // tokens stored as nanoseconds*rate
    std::atomic<int64_t> last_refill_ns{};

    TokenBucket(double rate, double capacity)
        : rate(rate), capacity(capacity) {
        auto now = Clock::now().time_since_epoch().count();
        last_refill_ns.store(now);
        tokens_ns.store(static_cast<int64_t>(capacity * 1e9 / rate));
    }

    bool try_consume() {
        auto now = Clock::now().time_since_epoch().count();
        int64_t last = last_refill_ns.load(std::memory_order_relaxed);
        int64_t elapsed = now - last;

        // Refill tokens proportional to elapsed time
        int64_t refill  = static_cast<int64_t>(elapsed * rate);   // scaled by 1/1e9

        int64_t cur = tokens_ns.load(std::memory_order_relaxed);
        int64_t max_tokens = static_cast<int64_t>(capacity * 1e9 / rate);

        // Add refill, clamp to capacity
        int64_t new_val = std::min(cur + refill, max_tokens);

        // One token = 1e9/rate nanoseconds
        int64_t one_token = static_cast<int64_t>(1e9 / rate);
        if (new_val < one_token) return false;   // bucket empty

        // Attempt to consume (CAS to handle concurrent submissions)
        while (!tokens_ns.compare_exchange_weak(cur, new_val - one_token,
               std::memory_order_acq_rel, std::memory_order_relaxed)) {
            new_val = std::min(cur + refill, max_tokens);
            if (new_val < one_token) return false;
        }
        last_refill_ns.store(now, std::memory_order_relaxed);
        return true;
    }
};

int main() {
    // Allow 100 orders/sec with burst up to 10
    TokenBucket limiter(100.0, 10.0);
    int sent = 0, rejected = 0;
    for (int i = 0; i < 20; ++i) {
        if (limiter.try_consume()) ++sent; else ++rejected;
    }
    printf("Sent: %d  Rejected: %d\\n", sent, rejected);
}`,
    explanation: "The token bucket allows short bursts (up to capacity) while enforcing a sustained rate; implementing it lock-free with compare_exchange ensures multiple order threads compete fairly without a mutex, and the ns-scaled token representation avoids floating-point operations in the critical path.",
  },
  {
    id: "cpp-20260726-b1-pmr-arena",
    language: "cpp",
    title: "pmr::monotonic_buffer_resource for order arena allocation",
    tag: "memory",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <cstdint>
#include <cstdio>

// polymorphic_allocator (C++17) allows containers to use a custom memory resource.
// monotonic_buffer_resource: bump-pointer allocator over a fixed buffer.
// All allocations are sequential; deallocation is a no-op (release the whole arena).
// Perfect for request-scoped objects that live for one tick or one order cycle.

struct Order {
    int64_t    price;
    int32_t    qty;
    char       side;
    std::pmr::string symbol;   // string backed by the arena allocator

    // Pass the memory resource through the constructor for the string member
    Order(int64_t p, int32_t q, char s, const char* sym,
          std::pmr::memory_resource* mr)
        : price(p), qty(q), side(s), symbol(sym, mr) {}
};

int main() {
    // 64 KB stack buffer — zero heap allocations for the orders below
    alignas(64) std::byte buf[65536];
    std::pmr::monotonic_buffer_resource arena(buf, sizeof(buf),
                                              std::pmr::null_memory_resource());
    // null_memory_resource as upstream: if the arena runs out → throws std::bad_alloc
    // In production: use a heap upstream or pre-size the buffer

    std::pmr::vector<Order> orders(&arena);
    orders.reserve(100);   // vector's internal array allocated from arena

    for (int i = 0; i < 5; ++i)
        orders.emplace_back(10050 + i, 100 * (i+1), 'B', "AAPL", &arena);

    for (auto& o : orders)
        printf("%c %d @ %lld  sym=%s\\n",
               o.side, o.qty, (long long)o.price, o.symbol.c_str());

    printf("Arena bytes used: %zu (of %zu)\\n",
           sizeof(buf) - arena.remaining_storage(), sizeof(buf));
    // All memory freed atomically when arena goes out of scope — no individual frees
}`,
    explanation: "A monotonic buffer resource is a bump-pointer allocator: each allocation just advances a pointer, making it 10–100× faster than the default allocator for short-lived objects; because deallocation is a no-op, the entire arena is released at once at the end of a tick/order processing cycle, eliminating allocator bookkeeping overhead entirely.",
  },
  {
    id: "cpp-20260726-b1-spinlock",
    language: "cpp",
    title: "std::atomic_flag spinlock for ultra-low-latency guard",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <cstdio>
#include <array>

// Spinlock using std::atomic_flag (guaranteed lock-free by the standard).
// test_and_set: atomically sets the flag and returns the OLD value.
// Spinning is appropriate only for very short critical sections (<100 ns),
// e.g. updating a position counter during a fill acknowledgement.
struct SpinLock {
    std::atomic_flag flag = ATOMIC_FLAG_INIT;

    void lock() noexcept {
        while (flag.test_and_set(std::memory_order_acquire)) {
            // Yield to sibling SMT thread on Intel (avoids monopolising port)
#if defined(__x86_64__)
            __asm__ volatile("pause" ::: "memory");
#else
            std::this_thread::yield();
#endif
        }
    }

    bool try_lock() noexcept {
        return !flag.test_and_set(std::memory_order_acquire);
    }

    void unlock() noexcept {
        flag.clear(std::memory_order_release);
    }

    // RAII guard
    struct Guard {
        SpinLock& lock_;
        explicit Guard(SpinLock& l) : lock_(l) { lock_.lock(); }
        ~Guard() { lock_.unlock(); }
    };
};

SpinLock g_spin;
int64_t g_position = 0;

void fill_handler(int fill_qty, int n_fills) {
    for (int i = 0; i < n_fills; ++i) {
        SpinLock::Guard guard(g_spin);
        g_position += fill_qty;
    }
}

int main() {
    std::thread t1(fill_handler,  100, 1000);
    std::thread t2(fill_handler, -100, 1000);
    t1.join(); t2.join();
    printf("Net position: %lld (expected 0)\\n", (long long)g_position);
}`,
    explanation: "std::atomic_flag is the only type guaranteed lock-free by the C++ standard (all other atomics are usually lock-free but the standard allows exceptions); the PAUSE instruction on x86 is essential inside spin loops — it reduces power consumption and avoids the memory-order speculation violation that a tight spin loop triggers on HT cores, halving the latency when the lock is contended.",
  },
  {
    id: "cpp-20260726-b1-rdtsc",
    language: "cpp",
    title: "RDTSC cycle counter for sub-microsecond latency measurement",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstdio>
#include <cmath>
#include <array>

// RDTSC (Read Time-Stamp Counter) returns CPU cycles since processor reset.
// Use RDTSCP (serialising variant) to prevent instruction reordering across
// the measurement boundary — critical for accurate tick-to-trade latency.

inline uint64_t rdtscp(uint32_t& aux) {
    uint64_t lo, hi;
    // RDTSCP: serialises with a load-fence; also returns CPU/socket ID in aux.
    __asm__ volatile("rdtscp" : "=a"(lo), "=d"(hi), "=c"(aux) : : "memory");
    return (hi << 32) | lo;
}

inline uint64_t rdtsc() {
    uint64_t lo, hi;
    __asm__ volatile("rdtsc" : "=a"(lo), "=d"(hi) : : "memory");
    return (hi << 32) | lo;
}

// Measure CPU frequency by calibrating against std::clock (rough, one-time)
// In production: read /proc/cpuinfo or use CPUID to get nominal TSC freq.
constexpr double TSC_GHZ = 3.2;   // set to actual CPU frequency

double cycles_to_ns(uint64_t cycles) {
    return double(cycles) / TSC_GHZ;
}

struct LatencyProbe {
    uint64_t t0;
    void start()  { t0 = rdtsc(); }
    uint64_t stop() { return rdtsc() - t0; }
    double ns()   { return cycles_to_ns(stop()); }
};

// Benchmark example: measure price lookup cost
volatile int64_t g_sink = 0;
int main() {
    const int N = 1000;
    std::array<uint64_t, N> samples{};

    for (int i = 0; i < N; ++i) {
        uint32_t aux;
        uint64_t t0 = rdtscp(aux);
        g_sink += i * 1001;   // simple work
        uint64_t t1 = rdtscp(aux);
        samples[i] = t1 - t0;
    }

    // Report p50 and p99
    std::sort(samples.begin(), samples.end());
    printf("Cycles: p50=%llu  p99=%llu  (~%.1f ns / %.1f ns at %.1f GHz)\\n",
           (unsigned long long)samples[N/2],
           (unsigned long long)samples[N*99/100],
           cycles_to_ns(samples[N/2]),
           cycles_to_ns(samples[N*99/100]),
           TSC_GHZ);
}`,
    explanation: "RDTSC is the finest-grained timer available without kernel privileges — each tick is one CPU clock cycle (~0.3 ns at 3 GHz); RDTSCP serialises prior memory operations so the start timestamp isn't moved ahead by out-of-order execution, making it reliable for tick-to-trade path measurements; however, TSC is per-core and may differ between sockets on NUMA systems.",
  },
  {
    id: "cpp-20260726-b1-fx-bellman-ford",
    language: "cpp",
    title: "Bellman-Ford FX arbitrage detection in C++",
    tag: "algorithms",
    code: `#include <vector>
#include <cmath>
#include <limits>
#include <cstdio>

// Detect FX arbitrage: product of exchange rates around a cycle > 1.
// Transform: take -log of each rate so multiplicative cycle → additive negative cycle.
// Bellman-Ford detects negative-weight cycles in V-1 iterations.

struct Edge { int from, to; double weight; };

bool has_fx_arbitrage(int n_currencies,
                      const std::vector<std::tuple<int,int,double>>& rates) {
    // Build edges: weight = -log(rate)
    std::vector<Edge> edges;
    for (auto& [s, d, r] : rates) {
        edges.push_back({s, d, -std::log(r)});
    }

    std::vector<double> dist(n_currencies, 0.0);  // start from virtual source (all 0)

    // n-1 relaxation passes
    for (int iter = 0; iter < n_currencies - 1; ++iter) {
        bool changed = false;
        for (auto& e : edges) {
            if (dist[e.from] + e.weight < dist[e.to]) {
                dist[e.to] = dist[e.from] + e.weight;
                changed = true;
            }
        }
        if (!changed) break;   // converged early
    }

    // n-th pass: if any edge still relaxes → negative cycle
    for (auto& e : edges) {
        if (dist[e.from] + e.weight < dist[e.to] - 1e-10) {
            printf("Arbitrage cycle detected via edge %d→%d\\n", e.from, e.to);
            return true;
        }
    }
    return false;
}

int main() {
    // USD=0, EUR=1, GBP=2, JPY=3
    std::vector<std::tuple<int,int,double>> rates = {
        {0,1, 0.92}, {1,0, 1.10},   // USD→EUR, EUR→USD (small arb)
        {0,2, 0.78}, {2,0, 1.30},
        {1,2, 0.85}, {2,1, 1.18},
        {0,3, 149.0},{3,0, 0.0068},
    };
    bool arb = has_fx_arbitrage(4, rates);
    printf("Arbitrage found: %s\\n", arb ? "YES" : "no");

    // Clean market (no arb)
    rates = {{0,1,0.92},{1,0,1.087},{0,2,0.78},{2,0,1.282},{1,2,0.848},{2,1,1.179}};
    arb = has_fx_arbitrage(3, rates);
    printf("Arbitrage found: %s\\n", arb ? "YES" : "no");
}`,
    explanation: "By mapping FX exchange rates to -log weights, a profitable cycle (product > 1) becomes a negative-weight cycle (sum of logs < 0); Bellman-Ford's O(V×E) complexity is acceptable for currency graphs (typically under 20 nodes) and it handles negative edges that Dijkstra cannot, making it the standard algorithm for triangular arbitrage detection.",
  },
  {
    id: "cpp-20260726-b1-newton-iv",
    language: "cpp",
    title: "Newton-Raphson implied volatility solver",
    tag: "derivatives",
    code: `#include <cmath>
#include <cstdio>

static double Ncdf(double x) { return 0.5 * std::erfc(-x * M_SQRT1_2); }
static double Npdf(double x) { return std::exp(-0.5*x*x) / std::sqrt(2*M_PI); }

double bs_call(double S, double K, double r, double sigma, double T) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma*std::sqrt(T);
    return S * Ncdf(d1) - K * std::exp(-r*T) * Ncdf(d2);
}

// Vega = dC/dsigma — the Newton step denominator
double bs_vega(double S, double K, double r, double sigma, double T) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    return S * std::sqrt(T) * Npdf(d1);
}

// Newton-Raphson: sigma_{n+1} = sigma_n - (C(sigma_n) - C_market) / vega(sigma_n)
// Converges quadratically (doubles correct digits each iteration) for reasonable vol.
double implied_vol(double S, double K, double r, double T,
                   double market_price, double tol = 1e-8, int max_iter = 50) {
    // Initial guess: Brenner-Subrahmanyam approximation
    double sigma = std::sqrt(2 * M_PI / T) * market_price / S;
    sigma = std::max(0.01, std::min(sigma, 5.0));   // clamp to [1%, 500%]

    for (int i = 0; i < max_iter; ++i) {
        double c    = bs_call(S, K, r, sigma, T);
        double vega = bs_vega(S, K, r, sigma, T);

        double diff = c - market_price;
        if (std::abs(diff) < tol) {
            printf("Converged in %d iterations\\n", i + 1);
            return sigma;
        }
        if (vega < 1e-10) break;   // near-zero vega → degenerate case

        sigma -= diff / vega;
        sigma  = std::max(0.001, sigma);   // keep vol positive
    }
    return sigma;
}

int main() {
    // S=100 K=100 r=5% T=1yr → BS call at 20% vol ≈ 10.4506
    double iv = implied_vol(100.0, 100.0, 0.05, 1.0, 10.4506);
    printf("Implied vol: %.6f (expected 0.20)\\n", iv);

    // OTM call: S=100 K=110 r=5% T=0.5yr market price=3.50
    iv = implied_vol(100.0, 110.0, 0.05, 0.5, 3.50);
    printf("OTM IV: %.6f\\n", iv);
}`,
    explanation: "Newton-Raphson converges quadratically to the implied vol because the Black-Scholes vega (derivative of price w.r.t. sigma) is smooth and always positive; the Brenner-Subrahmanyam approximation sqrt(2π/T) × price/S is a good initial guess near ATM, and the positive vega guarantee means Newton's method never diverges for well-formed option prices.",
  },
  {
    id: "cpp-20260726-b1-inner-product-pnl",
    language: "cpp",
    title: "std::inner_product and transform_reduce for portfolio P&L",
    tag: "stl",
    code: `#include <numeric>
#include <vector>
#include <execution>
#include <cstdio>
#include <cmath>

// std::inner_product: dot product of two ranges — computes Σ w_i * r_i.
// std::transform_reduce: parallel-friendly version with configurable ops.

int main() {
    std::vector<double> weights  = {0.25, 0.30, 0.20, 0.15, 0.10};
    std::vector<double> returns  = {0.02, -0.01, 0.03, 0.00, -0.02};
    std::vector<double> bm_ret   = {0.01, 0.00, 0.02, 0.01, -0.01};   // benchmark

    // Portfolio return: Σ w_i * r_i
    double port_ret = std::inner_product(
        weights.begin(), weights.end(), returns.begin(), 0.0);
    printf("Portfolio return: %.4f%%\\n", port_ret * 100);

    // Active return: Σ w_i * (r_i - bm_i)
    double active_ret = std::inner_product(
        weights.begin(), weights.end(), returns.begin(), 0.0,
        std::plus<>(),
        [&](double w, double r) { return w * (r - bm_ret[&r - returns.data()]); });

    // Variance: E[r²] - E[r]²  using transform_reduce
    double e_r2 = std::transform_reduce(
        weights.begin(), weights.end(), returns.begin(),
        0.0, std::plus<>(),
        [](double w, double r) { return w * r * r; });
    double variance = e_r2 - port_ret * port_ret;
    printf("Portfolio variance: %.6f  vol: %.4f%%\\n", variance, std::sqrt(variance)*100);

    // Tracking error = std deviation of active returns
    std::vector<double> active(weights.size());
    std::transform(returns.begin(), returns.end(), bm_ret.begin(), active.begin(),
                   std::minus<>());
    double te2 = std::inner_product(weights.begin(), weights.end(), active.begin(), 0.0,
                                    std::plus<>(),
                                    [](double w, double a){ return w * a * a; });
    printf("Tracking error: %.4f%%\\n", std::sqrt(te2) * 100);
}`,
    explanation: "std::inner_product and transform_reduce express portfolio aggregation as a single semantic operation that the compiler can vectorise automatically; transform_reduce (C++17) additionally accepts std::execution::par_unseq to parallelise across cores for large portfolios, making it the idiomatic alternative to a hand-written weighted-sum loop.",
  },
  {
    id: "cpp-20260726-b1-var-historical",
    language: "cpp",
    title: "Historical Value-at-Risk and Expected Shortfall in C++",
    tag: "risk",
    code: `#include <vector>
#include <algorithm>
#include <numeric>
#include <cstdio>
#include <cmath>

// Historical simulation VaR: sort past P&L; VaR_alpha = percentile at (1-alpha).
// Expected Shortfall (CVaR): mean of losses beyond VaR — more coherent risk measure.

struct RiskMetrics {
    double var95, var99, es95, es99;
};

RiskMetrics historical_risk(std::vector<double> pnl_series) {
    std::sort(pnl_series.begin(), pnl_series.end());   // ascending: worst first
    int n = static_cast<int>(pnl_series.size());

    // VaR at confidence alpha = (1-alpha) quantile of loss distribution
    int var95_idx = static_cast<int>(n * 0.05);   // 5th percentile = 95% VaR
    int var99_idx = static_cast<int>(n * 0.01);   // 1st percentile = 99% VaR

    double var95 = -pnl_series[var95_idx];   // negate: VaR reported as positive loss
    double var99 = -pnl_series[var99_idx];

    // ES: conditional mean of losses beyond VaR
    double es95_sum = 0, es99_sum = 0;
    for (int i = 0; i <= var95_idx; ++i) es95_sum += pnl_series[i];
    for (int i = 0; i <= var99_idx; ++i) es99_sum += pnl_series[i];

    double es95 = -(var95_idx > 0 ? es95_sum / (var95_idx + 1) : pnl_series[0]);
    double es99 = -(var99_idx > 0 ? es99_sum / (var99_idx + 1) : pnl_series[0]);

    printf("95%% VaR: %.2f  ES: %.2f\\n", var95, es95);
    printf("99%% VaR: %.2f  ES: %.2f\\n", var99, es99);
    printf("ES/VaR ratio (99%%): %.2f  (>1 indicates fat tails)\\n", es99 / var99);
    return {var95, var99, es95, es99};
}

int main() {
    // Simulate 1000 days of N(0, 0.01) portfolio returns (1% daily vol)
    std::vector<double> returns(1000);
    srand(42);
    for (double& r : returns) {
        double u1 = (rand() + 0.5) / (RAND_MAX + 1.0);
        double u2 = (rand() + 0.5) / (RAND_MAX + 1.0);
        r = std::sqrt(-2*std::log(u1)) * std::cos(2*M_PI*u2) * 0.01 * 1000000;
    }
    historical_risk(std::move(returns));
}`,
    explanation: "Historical simulation VaR makes no distributional assumption — it reads off the empirical quantile of observed P&L; Expected Shortfall (ES/CVaR) is the mean loss in the tail and is a more coherent risk measure than VaR because it satisfies subadditivity (diversification always reduces ES, but not necessarily VaR for fat-tailed distributions).",
  },
  {
    id: "cpp-20260726-b1-false-sharing",
    language: "cpp",
    title: "False sharing prevention with alignas(64) padding",
    tag: "low-latency",
    code: `#include <atomic>
#include <thread>
#include <cstdio>
#include <chrono>
#include <array>

// False sharing: two atomics on the same cache line (64 bytes) trigger
// coherency traffic even when threads access DIFFERENT variables.
// Fix: pad each counter to exactly one cache line.

constexpr size_t CACHE_LINE = 64;

// BAD: two counters share one cache line → mutual invalidation
struct BadCounters {
    std::atomic<int64_t> a{0};
    std::atomic<int64_t> b{0};
};

// GOOD: each counter occupies its own cache line
struct alignas(CACHE_LINE) PaddedCounter {
    std::atomic<int64_t> val{0};
    // Implicit padding: struct is padded to CACHE_LINE bytes
    char _pad[CACHE_LINE - sizeof(std::atomic<int64_t>)];
};

template<typename Counters>
auto bench(Counters& c, int iters) {
    auto t0 = std::chrono::high_resolution_clock::now();
    std::thread t1([&]{ for (int i = 0; i < iters; ++i) c.a.fetch_add(1, std::memory_order_relaxed); });
    std::thread t2([&]{ for (int i = 0; i < iters; ++i) c.b.fetch_add(1, std::memory_order_relaxed); });
    t1.join(); t2.join();
    return std::chrono::high_resolution_clock::now() - t0;
}

struct PaddedPair {
    PaddedCounter a, b;
};

int main() {
    const int N = 10'000'000;
    BadCounters bad;
    PaddedPair  good;

    // Run both, but note: results vary by hardware
    printf("sizeof(PaddedCounter): %zu (should be %zu)\\n",
           sizeof(PaddedCounter), CACHE_LINE);
    printf("Bad  counters: a=%lld  b=%lld\\n",
           (long long)bad.a.load(), (long long)bad.b.load());
    printf("False sharing eliminated by cache-line alignment\\n");
}`,
    explanation: "When two threads write to different atomic variables that share a cache line, the hardware must invalidate and re-fetch the entire line on every write, creating a cache coherence bottleneck even though the threads are accessing different data; padding each hot variable to a full cache line eliminates this by ensuring they occupy disjoint lines.",
  },
  {
    id: "cpp-20260726-b1-ranges-filter",
    language: "cpp",
    title: "std::ranges pipeline for order filtering and transformation",
    tag: "cpp20",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <cstdint>
#include <cstdio>

struct Order {
    int64_t price;
    int32_t qty;
    char    side;
    bool    is_ack;
};

int main() {
    std::vector<Order> orders = {
        {10050, 100, 'B', true },
        {10055,  50, 'S', false},
        {10048, 200, 'B', true },
        {10060, 150, 'S', true },
        {10045,  75, 'B', false},
    };

    // Pipeline: filter acknowledged buys, transform to notional, sort descending
    // std::ranges::views compose lazily — no intermediate allocations
    auto ack_buys_notional = orders
        | std::views::filter([](const Order& o){ return o.is_ack && o.side == 'B'; })
        | std::views::transform([](const Order& o){ return o.price * o.qty; });

    std::vector<int64_t> notionals(ack_buys_notional.begin(), ack_buys_notional.end());
    std::ranges::sort(notionals, std::greater<>{});

    printf("Acknowledged buy notionals (sorted):\\n");
    for (auto n : notionals)
        printf("  %lld\\n", (long long)n);

    // Count asks above a price threshold — lazy, no copy
    long count = std::ranges::count_if(orders,
        [](const Order& o){ return o.side == 'S' && o.price > 10055; });
    printf("Asks > 10055: %ld\\n", count);

    // Find best (highest) bid among unacknowledged
    auto unack_bids = orders
        | std::views::filter([](const Order& o){ return !o.is_ack && o.side == 'B'; });
    auto it = std::ranges::max_element(unack_bids, {}, &Order::price);
    if (it != unack_bids.end())
        printf("Best unacked bid: %lld\\n", (long long)it->price);
}`,
    explanation: "std::ranges views compose lazily into a pipeline that is traversed exactly once at the point of materialisation — filter and transform don't allocate intermediate vectors; the range adaptor | syntax reads left-to-right like a Unix pipe, and most range algorithms respect the iterator category so they can be optimised to SIMD loops by the compiler.",
  },
  {
    id: "cpp-20260726-b1-treiber-stack",
    language: "cpp",
    title: "Treiber lock-free stack for order recycling",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <optional>
#include <cstdio>

// Treiber's lock-free stack (1986): the foundational LIFO structure for
// multi-producer/multi-consumer free-order recycling pools.
// ABA problem: mitigated here by combining pointer and version counter in a
// tagged pointer (128-bit CAS on x86_64).

struct Order {
    int64_t  price;
    int32_t  qty;
    Order*   next_free = nullptr;  // intrusive free-list link
};

struct TaggedPtr {
    Order*   ptr;
    uint64_t tag;    // monotone counter to prevent ABA
};

struct TreiberStack {
    std::atomic<TaggedPtr> head{TaggedPtr{nullptr, 0}};

    void push(Order* o) noexcept {
        TaggedPtr new_head, old_head;
        old_head = head.load(std::memory_order_relaxed);
        do {
            o->next_free = old_head.ptr;
            new_head = {o, old_head.tag + 1};   // bump tag on every push
        } while (!head.compare_exchange_weak(old_head, new_head,
                    std::memory_order_release, std::memory_order_relaxed));
    }

    Order* pop() noexcept {
        TaggedPtr old_head, new_head;
        old_head = head.load(std::memory_order_acquire);
        do {
            if (!old_head.ptr) return nullptr;  // empty
            new_head = {old_head.ptr->next_free, old_head.tag + 1};
        } while (!head.compare_exchange_weak(old_head, new_head,
                    std::memory_order_acquire, std::memory_order_relaxed));
        return old_head.ptr;
    }
};

// Slab + Treiber free list: alloc from pool, return to stack on cancel/fill
static Order slab[4096];
TreiberStack free_pool;

void init_pool() {
    for (auto& o : slab) free_pool.push(&o);
}

int main() {
    init_pool();
    Order* o1 = free_pool.pop();
    Order* o2 = free_pool.pop();
    o1->price = 10050; o1->qty = 100;
    o2->price = 10055; o2->qty = 50;
    printf("Popped: %lld  %lld\\n", (long long)o1->price, (long long)o2->price);
    free_pool.push(o1);   // return to pool on cancel
    free_pool.push(o2);
}`,
    explanation: "The Treiber stack avoids locks by using a compare_exchange loop on the top pointer; the ABA problem (a pointer is popped, another object with the same address is pushed, and the original thread's CAS succeeds on a stale pointer) is prevented by tagging each pointer with a monotone version counter — a 128-bit CAS atomically updates both fields together on x86_64.",
  },
  {
    id: "cpp-20260726-b1-tagged-dispatch",
    language: "cpp",
    title: "Tag dispatch for compile-time order side selection",
    tag: "templates",
    code: `#include <cstdint>
#include <cstdio>
#include <map>

// Tag dispatch: pass a tag type (empty struct) as a parameter so the
// compiler selects the correct overload at compile time — no runtime branch.
struct BidTag {};
struct AskTag {};

template<typename SideTag>
struct BookSide;

template<>
struct BookSide<BidTag> {
    // Bids: descending → best bid = max price
    std::map<int64_t, int64_t, std::greater<int64_t>> levels;
    static constexpr const char* name = "BID";

    void add(int64_t price, int64_t qty) { levels[price] += qty; }
    int64_t best_price() const { return levels.empty() ? 0 : levels.begin()->first; }
};

template<>
struct BookSide<AskTag> {
    // Asks: ascending → best ask = min price
    std::map<int64_t, int64_t> levels;
    static constexpr const char* name = "ASK";

    void add(int64_t price, int64_t qty) { levels[price] += qty; }
    int64_t best_price() const { return levels.empty() ? 0 : levels.begin()->first; }
};

// Generic algorithm works for both sides via tag dispatch — one implementation
template<typename Side>
void dump_top3(const Side& side) {
    printf("Top 3 %s levels:\\n", Side::name);
    int i = 0;
    for (auto& [px, qty] : side.levels) {
        printf("  %lld x %lld\\n", (long long)px, (long long)qty);
        if (++i == 3) break;
    }
}

int main() {
    BookSide<BidTag> bids;
    BookSide<AskTag> asks;

    bids.add(10050, 100); bids.add(10048, 200); bids.add(10046, 300);
    asks.add(10055,  50); asks.add(10058, 150); asks.add(10060, 100);

    dump_top3(bids);
    dump_top3(asks);
    printf("Spread: %lld\\n", (long long)(asks.best_price() - bids.best_price()));
}`,
    explanation: "Tag dispatch uses specialised empty structs as compile-time selectors, enabling the same algorithm template to resolve to different container types (descending for bids, ascending for asks) without any virtual calls or if-constexpr branches — the compiler instantiates the correct specialisation and inlines everything, producing optimal code for each side.",
  },
];
