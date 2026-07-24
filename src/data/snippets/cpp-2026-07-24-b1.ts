import type { Snippet } from "./types";

export const cppSnippets20260724B1: Snippet[] = [
  {
    id: "cpp-20260724-b1-deque-price-level",
    language: "cpp",
    title: "std::deque for bid/ask price levels",
    tag: "containers",
    code: `#include <deque>
#include <cstdint>
#include <iostream>

struct Level { int64_t price; int64_t qty; };

// Deque gives O(1) push/pop at both ends — ideal for a depth-of-book
// where best quote is consumed and new levels arrive at either side.
struct HalfBook {
    std::deque<Level> levels;

    void push_best(Level l)  { levels.push_front(l); }
    void push_worst(Level l) { levels.push_back(l);  }
    void pop_best()          { levels.pop_front();   }
    Level& best()            { return levels.front(); }
    bool   empty() const     { return levels.empty(); }
};

int main() {
    HalfBook bids;
    bids.push_best({10050, 100});   // tightest bid
    bids.push_worst({10000, 200});  // deeper level
    std::cout << "Best bid: " << bids.best().price << "\\n";
    bids.pop_best();
    std::cout << "Next bid: " << bids.best().price << "\\n";
}`,
    explanation: "std::deque supports O(1) insertion and removal at both ends, making it a natural fit for maintaining price-level queues in an order book where the best quote is consumed and new levels arrive at either extreme of the book.",
  },
  {
    id: "cpp-20260724-b1-perfect-forward",
    language: "cpp",
    title: "Perfect forwarding for an order factory",
    tag: "templates",
    code: `#include <utility>
#include <memory>
#include <string>
#include <cstdint>

struct LimitOrder {
    std::string symbol;
    int64_t     price;  // integer ticks
    int32_t     qty;
};

// Factory that perfectly forwards constructor args — no extra copies
// for any order type (limit, market, stop, etc.).
template<typename T, typename... Args>
std::unique_ptr<T> make_order(Args&&... args) {
    return std::make_unique<T>(std::forward<Args>(args)...);
}

int main() {
    // std::forward preserves value category: lvalue stays lvalue,
    // rvalue stays rvalue — the LimitOrder ctor sees exactly what
    // the caller passed, enabling move semantics end-to-end.
    auto o = make_order<LimitOrder>("AAPL", int64_t{15000}, int32_t{100});
    (void)o;
}`,
    explanation: "Perfect forwarding (std::forward + universal reference &&) lets a factory function relay constructor arguments with their original value category intact, avoiding redundant copies when inserting orders into a low-latency pipeline.",
  },
  {
    id: "cpp-20260724-b1-variadic-fix-msg",
    language: "cpp",
    title: "Variadic templates for a FIX message builder",
    tag: "templates",
    code: `#include <sstream>
#include <string>

// Variadic template recursion appends tag=value\\x01 pairs.
// Base case (0 args) terminates the recursion at compile time.
void append_fields(std::ostringstream&) {}

template<typename V, typename... Rest>
void append_fields(std::ostringstream& ss, int tag, V val, Rest&&... rest) {
    ss << tag << '=' << val << '\\x01';  // SOH delimiter (ASCII 0x01)
    append_fields(ss, std::forward<Rest>(rest)...);
}

// Builds a raw FIX message from an arbitrary number of tag-value pairs.
// Example: build_fix(8, "FIX.4.2", 35, "D", 55, "AAPL", 38, 100)
template<typename... Fields>
std::string build_fix(Fields&&... fields) {
    std::ostringstream ss;
    append_fields(ss, std::forward<Fields>(fields)...);
    return ss.str();
}

int main() {
    // Generates: "8=FIX.4.2\\x0135=D\\x0155=AAPL\\x0138=100\\x01"
    auto msg = build_fix(8, "FIX.4.2", 35, "D", 55, "AAPL", 38, 100);
    (void)msg;
}`,
    explanation: "Variadic templates let you write a zero-overhead FIX message builder that accepts any number of tag-value pairs at compile time, with full type deduction and no runtime allocation beyond the ostringstream buffer.",
  },
  {
    id: "cpp-20260724-b1-sfinae-tick",
    language: "cpp",
    title: "SFINAE / enable_if for typed tick processing",
    tag: "templates",
    code: `#include <type_traits>
#include <cstdint>

// SFINAE: process_tick<T>() resolves for integral types (fixed-point ticks).
// The floating-point overload uses a dummy int param to disambiguate.
template<typename T, typename = std::enable_if_t<std::is_integral_v<T>>>
void process_tick(T price) {
    // integer-encoded price (e.g. ticks * 10^-4 for 4 decimal places)
    int64_t fixed = static_cast<int64_t>(price);
    (void)fixed;
}

template<typename T, typename = std::enable_if_t<std::is_floating_point_v<T>>>
void process_tick(T price, int = 0) {   // extra int disambiguates
    // floating-point path: scale and convert before storing
    int64_t fixed = static_cast<int64_t>(price * 10'000);
    (void)fixed;
}

// C++20 equivalent using concepts (cleaner):
// template<std::integral T>       void process_tick(T p)    { ... }
// template<std::floating_point T> void process_tick(T p)    { ... }

int main() {
    process_tick(int64_t{15000});   // integral path
    process_tick(1.5000);           // floating-point path
}`,
    explanation: "SFINAE (Substitution Failure Is Not An Error) via enable_if lets you specialize a function template for integer vs floating-point tick types at compile time, keeping the hot path free of runtime type-checks or virtual dispatch.",
  },
  {
    id: "cpp-20260724-b1-stringview-fix",
    language: "cpp",
    title: "std::string_view for zero-copy FIX tag parsing",
    tag: "low-latency",
    code: `#include <string_view>
#include <cstdint>
#include <charconv>

struct FIXField {
    int              tag;
    std::string_view value;  // points into the original buffer — no copy
};

// Parse one FIX field from a "tag=value" slice.
// string_view avoids touching the heap at all.
FIXField parse_field(std::string_view raw) {
    auto eq  = raw.find('=');
    int  tag = 0;
    std::from_chars(raw.data(), raw.data() + eq, tag);
    return { tag, raw.substr(eq + 1) };
}

// Convert a value view directly to int64 — still no allocation.
int64_t field_as_int(std::string_view val) {
    int64_t n = 0;
    std::from_chars(val.data(), val.data() + val.size(), n);
    return n;
}

int main() {
    char buf[] = "49=SENDER_COMP";
    std::string_view raw(buf, sizeof(buf) - 1);
    auto f = parse_field(raw);
    // f.tag == 49, f.value == "SENDER_COMP" — zero heap allocation
    (void)f;
}`,
    explanation: "std::string_view provides a non-owning slice into an existing buffer, letting a FIX parser walk tag-value fields without a single heap allocation—critical when processing thousands of messages per second.",
  },
  {
    id: "cpp-20260724-b1-pmr-pool",
    language: "cpp",
    title: "PMR monotonic_buffer_resource for order batches",
    tag: "memory",
    code: `#include <memory_resource>
#include <vector>
#include <array>
#include <cstdint>

// All allocations for a batch come from a stack buffer.
// monotonic_buffer_resource bumps a pointer in O(1) — no heap contention.
void process_batch() {
    alignas(64) std::array<std::byte, 65536> buf;   // 64 KB on the stack
    std::pmr::monotonic_buffer_resource pool(buf.data(), buf.size());

    // Both vectors use pool instead of the global heap allocator.
    std::pmr::vector<int64_t> prices(&pool);
    std::pmr::vector<int32_t> qtys(&pool);
    prices.reserve(256);
    qtys.reserve(256);

    for (int i = 0; i < 200; ++i) {
        prices.push_back(10000 + i);
        qtys.push_back(100);
    }
    // When pool goes out of scope, the whole buffer is freed in O(1).
    // No per-element delete, no fragmentation.
}

int main() { process_batch(); }`,
    explanation: "std::pmr::monotonic_buffer_resource eliminates per-allocation heap overhead by serving all requests from a pre-allocated arena, which is ideal for short-lived order-batch objects that are created and discarded together.",
  },
  {
    id: "cpp-20260724-b1-treiber-stack",
    language: "cpp",
    title: "Treiber lock-free stack",
    tag: "concurrency",
    code: `#include <atomic>
#include <memory>
#include <optional>

// Treiber stack: compare-exchange on the head pointer.
// Push is wait-free; pop is lock-free.
// NOTE: production code needs hazard pointers or epochs to avoid ABA.
template<typename T>
struct TreiberStack {
    struct Node { T val; Node* next; };

    std::atomic<Node*> head{nullptr};

    void push(T val) {
        auto* n = new Node{std::move(val), nullptr};
        n->next = head.load(std::memory_order_relaxed);
        // CAS loop: retry if another thread snuck in between load and store.
        while (!head.compare_exchange_weak(
                   n->next, n,
                   std::memory_order_release,
                   std::memory_order_relaxed));
    }

    std::optional<T> pop() {
        Node* old = head.load(std::memory_order_acquire);
        while (old && !head.compare_exchange_weak(
                           old, old->next,
                           std::memory_order_acquire,
                           std::memory_order_relaxed));
        if (!old) return std::nullopt;
        T val = std::move(old->val);
        delete old;  // safe only with single consumer; use epochs otherwise
        return val;
    }
};`,
    explanation: "The Treiber stack achieves thread-safe LIFO without mutexes by retrying a CAS on the head pointer whenever contention is detected, making it the canonical lock-free building block for free-lists and work-stealing queues in trading systems.",
  },
  {
    id: "cpp-20260724-b1-fix-tag-parser",
    language: "cpp",
    title: "FIX tag-value parser with zero allocations",
    tag: "low-latency",
    code: `#include <string_view>
#include <cstdint>
#include <charconv>
#include <functional>

// Walk a raw FIX message invoking a callback per field.
// Pure pointer arithmetic — no heap, no copies.
void parse_fix_msg(std::string_view msg,
                   const std::function<void(int, std::string_view)>& cb) {
    const char* p   = msg.data();
    const char* end = p + msg.size();
    while (p < end) {
        const char* eq = p;
        while (eq < end && *eq != '=') ++eq;     // find '='
        int tag = 0;
        std::from_chars(p, eq, tag);

        const char* soh = eq + 1;
        while (soh < end && *soh != '\\x01') ++soh;  // find SOH
        cb(tag, std::string_view(eq + 1, soh - eq - 1));
        p = soh + 1;
    }
}

// Usage:
// parse_fix_msg(raw_msg, [](int tag, std::string_view val) {
//     if (tag == 55) symbol  = val;   // Symbol
//     if (tag == 44) price   = field_as_int(val);
//     if (tag == 38) qty     = field_as_int(val);
// });`,
    explanation: "A callback-based FIX parser avoids building any intermediate data structure — it simply slides two pointers across the SOH-delimited buffer and dispatches each tag-value pair to a lambda, achieving nanosecond-per-field throughput.",
  },
  {
    id: "cpp-20260724-b1-array-book",
    language: "cpp",
    title: "Price-indexed array order book (O(1) lookup)",
    tag: "orderbook",
    code: `#include <array>
#include <cstdint>
#include <cassert>
#include <iostream>

// Map price → total quantity in O(1) using a flat array indexed by price tick.
// Only viable when the price range is known and bounded.
struct ArrayBook {
    static constexpr int64_t MIN_PRICE =  9900;  // ticks
    static constexpr int64_t MAX_PRICE = 10100;
    static constexpr size_t  LEVELS    = MAX_PRICE - MIN_PRICE + 1;

    std::array<int64_t, LEVELS> qty{};  // qty[i] ↔ price (MIN_PRICE + i)

    void add(int64_t price, int64_t q) {
        assert(price >= MIN_PRICE && price <= MAX_PRICE);
        qty[price - MIN_PRICE] += q;
    }
    void cancel(int64_t price, int64_t q) {
        qty[price - MIN_PRICE] -= q;
    }
    int64_t at(int64_t price) const {
        return qty[price - MIN_PRICE];
    }
};

int main() {
    ArrayBook book;
    book.add(10050, 100);
    book.add(10050, 50);
    book.cancel(10050, 30);
    std::cout << "Qty @ 10050: " << book.at(10050) << "\\n";  // 120
}`,
    explanation: "When the tick range is narrow (e.g. ±1% around mid), a flat array indexed by price tick delivers O(1) add/cancel/lookup with zero hash collision overhead, outperforming both std::map and unordered_map in the critical path.",
  },
  {
    id: "cpp-20260724-b1-prefetch-scan",
    language: "cpp",
    title: "__builtin_prefetch for hot price scan",
    tag: "low-latency",
    code: `#include <cstdint>
#include <vector>
#include <cstdio>

// Prefetch the next cache line while processing the current element.
// __builtin_prefetch(addr, rw, locality):
//   rw=0 (read), locality=1 (low — evict soon after use).
void find_breaches(const std::vector<int64_t>& prices,
                   int64_t limit, std::vector<size_t>& out) {
    const size_t N = prices.size();
    for (size_t i = 0; i < N; ++i) {
        // Prefetch 8 elements ahead (~1 cache line for int64_t).
        if (i + 8 < N)
            __builtin_prefetch(&prices[i + 8], 0, 1);

        if (prices[i] > limit)
            out.push_back(i);
    }
}

int main() {
    std::vector<int64_t> px(1'000'000);
    for (size_t i = 0; i < px.size(); ++i) px[i] = 10000 + (int64_t)i % 200;
    std::vector<size_t> hits;
    find_breaches(px, 10150, hits);
    printf("Breaches: %zu\\n", hits.size());
}`,
    explanation: "__builtin_prefetch issues a non-blocking memory hint, hiding DRAM latency (~100 ns) by fetching the next cache line before it is needed; on a stride-1 scan of millions of prices this can cut wall-clock time by 30–50%.",
  },
  {
    id: "cpp-20260724-b1-digital-option",
    language: "cpp",
    title: "Digital cash-or-nothing and asset-or-nothing options",
    tag: "derivatives",
    code: `#include <cmath>

// Cash-or-nothing call: pays Q if S_T > K, else 0.
// Price = Q * e^{-rT} * N(d2)
double cash_or_nothing(double S, double K, double r,
                        double sigma, double T, double Q) {
    double d2 = (std::log(S / K) + (r - 0.5 * sigma * sigma) * T)
                / (sigma * std::sqrt(T));
    double Nd2 = 0.5 * std::erfc(-d2 * M_SQRT1_2);  // standard normal CDF
    return Q * std::exp(-r * T) * Nd2;
}

// Asset-or-nothing call: pays S_T if S_T > K, else 0.
// Price = S * N(d1)  (the asset itself is the payoff — no discounting)
double asset_or_nothing(double S, double K, double r,
                         double sigma, double T) {
    double d1 = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T)
                / (sigma * std::sqrt(T));
    double Nd1 = 0.5 * std::erfc(-d1 * M_SQRT1_2);
    return S * Nd1;
}

// Vanilla call = asset_or_nothing - K*e^{-rT} * cash_or_nothing(Q=1)
// This decomposition is the building block for structured product pricing.`,
    explanation: "A standard European call decomposes into an asset-or-nothing and a cash-or-nothing digital option, so pricing these two instruments is fundamental to understanding barrier products, gap options, and structured notes.",
  },
  {
    id: "cpp-20260724-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson PDE solver for European put",
    tag: "derivatives",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Crank-Nicolson for the Black-Scholes PDE on a uniform S-grid.
// Half-implicit: averages the spatial operator at n and n+1,
// giving O(dt^2) time accuracy vs O(dt) for explicit/implicit alone.
double cn_put(double S0, double K, double r, double sigma, double T,
              int M /*time steps*/, int N /*space steps*/) {
    double S_max = 3.0 * K, dS = S_max / N, dt = T / M;
    double s2 = sigma * sigma;

    std::vector<double> V(N + 1);
    for (int j = 0; j <= N; ++j) V[j] = std::max(K - j * dS, 0.0);

    std::vector<double> a(N), b(N), c(N), d(N), x(N);
    for (int n = M - 1; n >= 0; --n) {
        for (int j = 1; j < N; ++j) {
            double alpha = 0.25 * dt * (s2 * j * j - r * j);
            double beta  = -0.5 * dt * (s2 * j * j + r);
            double gamma = 0.25 * dt * (s2 * j * j + r * j);
            a[j] = -alpha;  b[j] = 1 - beta;  c[j] = -gamma;
            d[j] = alpha*V[j-1] + (1+beta)*V[j] + gamma*V[j+1];
        }
        d[1] -= a[1] * K;  // V(0,t) = K (put lower boundary)
        // Thomas forward sweep
        for (int j = 2; j < N; ++j) {
            double m = a[j] / b[j-1];
            b[j] -= m * c[j-1];  d[j] -= m * d[j-1];
        }
        // Back substitution
        x[N-1] = d[N-1] / b[N-1];
        for (int j = N-2; j >= 1; --j) x[j] = (d[j] - c[j]*x[j+1]) / b[j];
        for (int j = 1; j < N; ++j) V[j] = x[j];
        V[0] = K;  V[N] = 0.0;
    }
    int j0 = (int)(S0 / dS);
    double w = (S0 - j0 * dS) / dS;
    return (1 - w) * V[j0] + w * V[j0 + 1];
}`,
    explanation: "Crank-Nicolson averages the explicit and implicit finite-difference operators, achieving second-order accuracy in both time and space while remaining unconditionally stable, making it the standard PDE solver for vanilla and barrier option pricing.",
  },
  {
    id: "cpp-20260724-b1-delta-gamma-grid",
    language: "cpp",
    title: "Delta-gamma scenario grid for P&L estimation",
    tag: "risk",
    code: `#include <cmath>
#include <vector>
#include <iostream>

// Estimate P&L for a portfolio of options under spot and vol shocks
// using the delta-gamma-vega Taylor expansion:
// ΔP ≈ δ·ΔS + ½γ·ΔS² + ν·Δσ
struct OptionBook {
    double spot;
    double delta;  // portfolio delta (sum over positions)
    double gamma;  // portfolio gamma
    double vega;   // portfolio vega
};

void scenario_grid(const OptionBook& book,
                   const std::vector<double>& dS_grid,    // e.g. -5%..+5%
                   const std::vector<double>& dvol_grid)  // e.g. -5pp..+5pp
{
    std::cout << "dS\\\\dvol";
    for (double dv : dvol_grid) std::cout << "\\t" << dv;
    std::cout << "\\n";

    for (double dS : dS_grid) {
        std::cout << dS;
        for (double dv : dvol_grid) {
            double pnl = book.delta * dS
                       + 0.5 * book.gamma * dS * dS
                       + book.vega * dv;
            std::cout << "\\t" << pnl;
        }
        std::cout << "\\n";
    }
}

int main() {
    OptionBook book{100.0, 0.5, 0.03, 200.0};
    scenario_grid(book, {-5,-2,0,2,5}, {-0.05,-0.02,0,0.02,0.05});
}`,
    explanation: "The delta-gamma-vega Taylor expansion provides a closed-form P&L estimate for small shocks, enabling traders to generate a full scenario grid across spot and vol moves in microseconds without re-pricing every option from scratch.",
  },
  {
    id: "cpp-20260724-b1-heston-mc",
    language: "cpp",
    title: "Heston stochastic-volatility Monte Carlo",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <iostream>

// Heston model: dS = r·S·dt + √V·S·dW₁
//               dV = κ(θ-V)dt + ξ·√V·dW₂
//               Corr(dW₁, dW₂) = ρ
// Euler-Milstein discretization with full truncation for V.
double heston_call_mc(double S0, double V0, double K, double r,
                      double kappa, double theta, double xi,
                      double rho, double T,
                      int steps, int paths) {
    double dt   = T / steps;
    double sqdt = std::sqrt(dt);
    double rho2 = std::sqrt(1.0 - rho * rho);   // orthogonal component

    std::mt19937_64 rng(42);
    std::normal_distribution<double> N01;

    double sum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S = S0, V = V0;
        for (int i = 0; i < steps; ++i) {
            double z1 = N01(rng), z2 = N01(rng);
            double dW1 = sqdt * z1;
            double dW2 = sqdt * (rho * z1 + rho2 * z2);  // correlated noise
            double sqV = std::sqrt(std::max(V, 0.0));     // full truncation
            S += r * S * dt + sqV * S * dW1;
            V += kappa * (theta - V) * dt + xi * sqV * dW2;
            V  = std::max(V, 0.0);  // absorb at zero (Feller condition may fail)
        }
        sum += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * sum / paths;
}

int main() {
    double price = heston_call_mc(100, 0.04, 100, 0.05,
                                  2.0, 0.04, 0.5, -0.7, 1.0, 200, 50000);
    std::cout << "Heston call price: " << price << "\\n";
}`,
    explanation: "The Heston model allows implied volatility to smile and cluster realistically; the key implementation detail is the full-truncation scheme (max(V,0)) to keep variance positive when the Feller condition 2κθ > ξ² is not met.",
  },
  {
    id: "cpp-20260724-b1-sabr-hagan",
    language: "cpp",
    title: "SABR Hagan approximation for implied vol",
    tag: "derivatives",
    code: `#include <cmath>

// SABR Hagan et al. (2002) Black implied volatility formula.
// Parameters: α (initial vol), β (CEV exponent), ρ (correlation),
//             ν (vol-of-vol), F (forward), K (strike), T (expiry).
double sabr_hagan_vol(double F, double K, double T,
                      double alpha, double beta, double rho, double nu) {
    if (std::abs(F - K) < 1e-10) {
        // ATM approximation
        double FK_mid = std::pow(F, 1.0 - beta);
        double term1  = alpha / FK_mid;
        double term2  = 1.0
            + ((1-beta)*(1-beta)/24.0 * alpha*alpha / (FK_mid*FK_mid)
               + 0.25*rho*beta*nu*alpha / FK_mid
               + (2.0 - 3.0*rho*rho)/24.0 * nu*nu) * T;
        return term1 * term2;
    }
    double logFK = std::log(F / K);
    double FK_mid = std::pow(F * K, 0.5 * (1.0 - beta));
    double z    = nu / alpha * FK_mid * logFK;
    double chi  = std::log((std::sqrt(1 - 2*rho*z + z*z) + z - rho) / (1 - rho));
    double A    = alpha / (FK_mid * (1.0
                    + (1-beta)*(1-beta)/24.0 * logFK*logFK
                    + (1-beta)*(1-beta)*(1-beta)*(1-beta)/1920.0 * std::pow(logFK,4)));
    double B    = z / chi;
    double C    = 1.0
        + ((1-beta)*(1-beta)/24.0 * alpha*alpha / (FK_mid*FK_mid)
           + 0.25*rho*beta*nu*alpha / FK_mid
           + (2.0 - 3.0*rho*rho)/24.0 * nu*nu) * T;
    return A * B * C;
}`,
    explanation: "The SABR model is the market standard for interest-rate options because its Hagan approximation maps the four free parameters directly to the observed implied volatility smile, making calibration to swaption grids fast and intuitive.",
  },
  {
    id: "cpp-20260724-b1-cds-hazard",
    language: "cpp",
    title: "CDS hazard-rate bootstrap",
    tag: "credit",
    code: `#include <vector>
#include <cmath>
#include <iostream>

// Piecewise-constant hazard rate λ_i between [T_{i-1}, T_i].
// Survival probability: P(τ > T) = exp(-Σ λ_j * Δt_j).
// Bootstrap: strip λ_i from each CDS spread, using already-known λ_1..λ_{i-1}.

// CDS par spread approximation: s ≈ λ * (1 - R) / (1 + λ * Δt) per period
// Full bootstrap prices risky annuity and protection leg numerically.
std::vector<double> bootstrap_hazard(
        const std::vector<double>& spreads,   // par CDS spreads (fractional)
        const std::vector<double>& tenors,    // e.g. {1,2,3,5,7,10}
        double recovery = 0.40,
        double r = 0.05) {
    int n = (int)spreads.size();
    std::vector<double> h(n), surv(n + 1, 1.0);
    double prev_T = 0.0;

    for (int i = 0; i < n; ++i) {
        double dT  = tenors[i] - prev_T;
        double s   = spreads[i];
        // Solve numerically: h = s / (1 - R) in flat-hazard approximation
        double lambda = s / (1.0 - recovery);   // first-order estimate
        // Newton step to account for risk-free discounting
        double disc = std::exp(-r * dT);
        lambda = -std::log(1.0 - s * disc / ((1.0 - recovery) * disc)) / dT;
        h[i]    = lambda;
        surv[i+1] = surv[i] * std::exp(-lambda * dT);
        prev_T  = tenors[i];
        std::cout << "T=" << tenors[i] << "  λ=" << lambda
                  << "  Q=" << surv[i+1] << "\\n";
    }
    return h;
}

int main() {
    bootstrap_hazard({0.01, 0.012, 0.014, 0.016}, {1,2,3,5});
}`,
    explanation: "CDS hazard-rate bootstrapping extracts a term structure of default intensities from observed par spreads, working short-to-long so each strip depends only on already-calibrated λ values, exactly analogous to bootstrapping a risk-free discount curve.",
  },
  {
    id: "cpp-20260724-b1-hw-tree",
    language: "cpp",
    title: "Hull-White trinomial interest-rate tree",
    tag: "rates",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <iostream>

// Hull-White: dx = -a*x*dt + σ*dW, where x = r - θ(t).
// Trinomial tree: three branches per node — up/mid/down.
// Branching probabilities are chosen to match mean and variance of dx.
struct HWTree {
    int    N;      // time steps
    double dt;
    double a;      // mean reversion speed
    double sigma;  // short-rate vol
    double dr;     // spatial step = sigma * sqrt(3*dt)

    // Short-rate values at node (i, j): r[i][j] = r0 + j*dr
    double rate(int /*i*/, int j) const { return j * dr; }

    // Standard branching probabilities (central node, no mean-reversion drift correction)
    void probs(double x, double& pu, double& pm, double& pd) const {
        double eta  = -a * x * dt / dr;            // drift in dr units
        double eta2 = eta * eta;
        pu = 1.0/6.0 + 0.5*(eta2 + eta);
        pm = 2.0/3.0 - eta2;
        pd = 1.0/6.0 + 0.5*(eta2 - eta);
    }

    void print_top(int levels = 2) const {
        for (int j = levels; j >= -levels; --j)
            std::cout << "r[j=" << j << "]=" << rate(0, j) << "\\n";
    }
};

int main() {
    HWTree t{10, 0.25, 0.10, 0.01, 0.0};
    t.dr = t.sigma * std::sqrt(3.0 * t.dt);
    t.print_top(3);
}`,
    explanation: "The Hull-White trinomial tree calibrates to the initial yield curve by adjusting the drift θ(t) at each time step, giving an exact fit to market zero rates while allowing analytic pricing of swaptions and caps via backward induction.",
  },
  {
    id: "cpp-20260724-b1-calendar-spread",
    language: "cpp",
    title: "Calendar spread pricing (time spread)",
    tag: "derivatives",
    code: `#include <cmath>
#include <iostream>

// European call price via Black-Scholes.
inline double bs_call(double S, double K, double r,
                      double sigma, double T) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma * std::sqrt(T);
    auto   N  = [](double x){ return 0.5 * std::erfc(-x * M_SQRT1_2); };
    return S * N(d1) - K * std::exp(-r*T) * N(d2);
}

// Calendar spread: sell near-term call C(T1), buy far-term call C(T2).
// Maximum profit when underlying pins at K on T1 expiry.
// Key Greek: long theta from the near leg decaying faster.
struct CalendarSpread {
    double S, K, r, sigma, T1, T2;

    double price() const {
        return bs_call(S, K, r, sigma, T2)    // long far
             - bs_call(S, K, r, sigma, T1);   // short near
    }

    // Approximate theta: change in spread value per day
    double theta_1d() const {
        double C_T2_tomorrow = bs_call(S, K, r, sigma, T2 - 1.0/252);
        double C_T1_tomorrow = bs_call(S, K, r, sigma, T1 - 1.0/252);
        return (C_T2_tomorrow - C_T1_tomorrow) - price();
    }
};

int main() {
    CalendarSpread cs{100, 100, 0.05, 0.20, 1.0/12, 3.0/12};
    std::cout << "Spread price: " << cs.price()   << "\\n";
    std::cout << "Daily theta:  " << cs.theta_1d() << "\\n";
}`,
    explanation: "A calendar spread isolates time decay: the near-term leg loses theta faster than the far-term leg when the underlying stays near the strike, so the spread profits from the passage of time even though the position is vega-long.",
  },
  {
    id: "cpp-20260724-b1-ranges-pipeline",
    language: "cpp",
    title: "std::ranges pipeline for tick filtering",
    tag: "cpp20",
    code: `#include <vector>
#include <ranges>
#include <algorithm>
#include <cstdint>
#include <iostream>

struct Tick { int64_t price; int64_t qty; bool is_bid; };

// std::ranges pipeline: filter → sort → take — lazy, no intermediate vectors.
std::vector<Tick> top_bids(std::vector<Tick> ticks, int n = 5) {
    namespace rv = std::ranges::views;

    // filter() and take() are lazy views; no heap allocation yet.
    auto view = ticks
        | rv::filter([](const Tick& t){ return t.is_bid && t.qty > 0; });

    std::vector<Tick> result(view.begin(), view.end());  // materialise

    // Sort by price descending using projection (no custom comparator struct).
    std::ranges::sort(result, std::greater{},
                      [](const Tick& t){ return t.price; });

    if ((int)result.size() > n) result.resize(n);
    return result;
}

int main() {
    std::vector<Tick> ticks = {
        {10050, 100, true}, {10040, 200, true},
        {10060, 150, true}, {10055,   0, true},  // zero qty — filtered out
        {10030,  50, false},                      // ask — filtered out
    };
    for (auto& t : top_bids(ticks))
        std::cout << t.price << " qty=" << t.qty << "\\n";
}`,
    explanation: "std::ranges views compose lazily — filter and transform are chained without creating intermediate containers, and the projection overload of std::ranges::sort lets you specify the sort key in one line without a lambda comparator.",
  },
  {
    id: "cpp-20260724-b1-jthread",
    language: "cpp",
    title: "std::jthread with stop_token for market data feed",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <chrono>
#include <cstdio>
#include <atomic>

std::atomic<int64_t> last_price{0};

// std::jthread automatically joins on destruction — no manual join/detach.
// stop_token lets the thread notice a stop request and exit gracefully.
void feed_thread(std::stop_token stop, const char* feed_name) {
    int64_t seq = 0;
    while (!stop.stop_requested()) {
        // Simulate receiving a tick from a market data feed.
        last_price.store(10000 + seq++ % 200, std::memory_order_relaxed);
        std::this_thread::sleep_for(std::chrono::microseconds(100));
    }
    printf("Feed %s: clean shutdown at seq=%lld\\n",
           feed_name, (long long)seq);
}

int main() {
    std::jthread feed(feed_thread, "NYSE");
    // ... process data for 1 ms ...
    std::this_thread::sleep_for(std::chrono::milliseconds(1));
    // Destructor calls feed.request_stop() then feed.join() — guaranteed.
}`,
    explanation: "std::jthread combines automatic join-on-destruction with a built-in stop token, eliminating the classic bug where a thread destructor throws because join was forgotten, and providing a clean cooperative cancellation path for feed threads.",
  },
  {
    id: "cpp-20260724-b1-rdtsc",
    language: "cpp",
    title: "RDTSC cycle-accurate latency measurement",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstdio>

// Serialized RDTSC: CPUID flushes the out-of-order execution pipeline
// before RDTSC, giving a stable lower bound on elapsed cycles.
inline uint64_t rdtsc_begin() {
    uint32_t lo, hi;
    __asm__ volatile(
        "cpuid\\n\\t"   // serialize — drains instruction pipeline
        "rdtsc\\n\\t"
        : "=a"(lo), "=d"(hi)
        :: "%rbx", "%rcx"
    );
    return (uint64_t)hi << 32 | lo;
}

// RDTSCP is ordered with respect to loads before it — use for the end fence.
inline uint64_t rdtsc_end() {
    uint32_t lo, hi;
    __asm__ volatile(
        "rdtscp\\n\\t"
        "lfence\\n\\t"  // prevent later loads from reordering above RDTSCP
        : "=a"(lo), "=d"(hi)
        :: "%rcx"
    );
    return (uint64_t)hi << 32 | lo;
}

int main() {
    uint64_t t0 = rdtsc_begin();
    // ... code under measurement ...
    uint64_t t1 = rdtsc_end();
    // Divide by CPU GHz to convert cycles → nanoseconds.
    printf("Elapsed cycles: %llu\\n", (unsigned long long)(t1 - t0));
}`,
    explanation: "RDTSC provides cycle-granular timing without OS involvement; pairing it with CPUID (begin) and RDTSCP+LFENCE (end) fences prevents the CPU from reordering instructions across the measurement boundary.",
  },
  {
    id: "cpp-20260724-b1-shm-ipc",
    language: "cpp",
    title: "POSIX shared memory for inter-process tick sharing",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstring>
#include <cstdint>
#include <atomic>

// Shared layout: producer writes, consumer reads — no kernel crossing.
struct SharedTick {
    std::atomic<uint64_t> seq;    // monotonic sequence for detecting stale reads
    int64_t               price;
    int64_t               qty;
};

// Producer: create and map the shared segment.
SharedTick* shm_create(const char* name, int& fd) {
    fd = shm_open(name, O_CREAT | O_RDWR, 0600);
    ftruncate(fd, sizeof(SharedTick));
    return static_cast<SharedTick*>(
        mmap(nullptr, sizeof(SharedTick),
             PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0));
}

// Consumer: attach read-only to the existing segment.
const SharedTick* shm_attach(const char* name, int& fd) {
    fd = shm_open(name, O_RDONLY, 0);
    return static_cast<const SharedTick*>(
        mmap(nullptr, sizeof(SharedTick),
             PROT_READ, MAP_SHARED, fd, 0));
}
// Both processes share the same physical page — IPC latency < 200 ns,
// with no system call in the consumer hot path.`,
    explanation: "POSIX shared memory lets a feed handler and a risk engine exchange ticks through a mapped page without any kernel system calls in the consumer path, achieving sub-microsecond IPC versus the ~5 µs cost of a Unix domain socket.",
  },
  {
    id: "cpp-20260724-b1-impl-shortfall",
    language: "cpp",
    title: "Implementation shortfall decomposition",
    tag: "execution",
    code: `#include <vector>
#include <cstdio>
#include <cstdint>

// Implementation Shortfall breaks the gap between paper and actual P&L:
//   Total IS = Delay cost + Trading cost + Opportunity cost
struct Fill { double price; int64_t qty; };

void impl_shortfall(double decision_px,  // price when order was decided
                    double arrival_px,   // price when order reached the market
                    const std::vector<Fill>& fills,
                    int64_t total_shares) {
    int64_t filled = 0;
    double  exec_cost = 0.0;
    for (auto& f : fills) { exec_cost += f.price * f.qty; filled += f.qty; }

    // Delay cost: market moved against us between decision and arrival.
    double delay    = (arrival_px - decision_px) * total_shares;
    // Trading cost: average fill vs arrival price, on executed shares.
    double avg_fill = filled ? exec_cost / filled : arrival_px;
    double trading  = (avg_fill - arrival_px) * filled;
    // Opportunity cost: unfilled shares priced at last fill.
    double opp      = fills.empty() ? 0.0
                    : (fills.back().price - arrival_px) * (total_shares - filled);

    printf("Delay cost   : %+.4f\\n", delay);
    printf("Trading cost : %+.4f\\n", trading);
    printf("Opportunity  : %+.4f\\n", opp);
    printf("Total IS     : %+.4f\\n", delay + trading + opp);
}

int main() {
    impl_shortfall(100.00, 100.02,
                   {{100.05, 5000}, {100.10, 3000}, {100.15, 1500}},
                   /*total=*/10000);
}`,
    explanation: "Implementation shortfall decomposes execution quality into three economically meaningful components: the cost of deciding late (delay), the cost of moving the market (trading), and the cost of shares left unexecuted (opportunity), enabling attribution across order management, routing, and timing decisions.",
  },
  {
    id: "cpp-20260724-b1-mmap-journal",
    language: "cpp",
    title: "Memory-mapped append-only trade journal",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstdint>
#include <atomic>

// Journal layout: header carries write_pos; records follow.
// Appends are O(1) and survive a process crash (data in page cache,
// durable after msync or kernel writeback).
struct JournalHeader { std::atomic<uint64_t> write_pos; };
struct TradeRecord   { uint64_t seq; int64_t price; int32_t qty; char side; };

constexpr size_t JOURNAL_BYTES = 1 << 26;  // 64 MB

struct MmapJournal {
    char*          base = nullptr;
    JournalHeader* hdr  = nullptr;
    uint64_t       seq  = 0;

    bool open(const char* path) {
        int fd = ::open(path, O_CREAT | O_RDWR, 0600);
        if (fd < 0) return false;
        ftruncate(fd, JOURNAL_BYTES);
        base = static_cast<char*>(
            mmap(nullptr, JOURNAL_BYTES, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0));
        ::close(fd);  // fd no longer needed; mapping keeps file alive
        hdr = reinterpret_cast<JournalHeader*>(base);
        return base != MAP_FAILED;
    }

    void append(int64_t price, int32_t qty, char side) {
        uint64_t off = hdr->write_pos.fetch_add(sizeof(TradeRecord),
                           std::memory_order_relaxed);
        auto* r = reinterpret_cast<TradeRecord*>(
            base + sizeof(JournalHeader) + off);
        *r = {++seq, price, qty, side};
        // Call msync(MS_SYNC) here for immediate durability.
    }
};`,
    explanation: "Memory-mapping a journal file lets the trading engine write trade records with a pointer store instead of a write() syscall; the OS flushes dirty pages to disk asynchronously, combining near-zero latency with crash recovery when msync is called at checkpoint time.",
  },
  {
    id: "cpp-20260724-b1-fix-int-price",
    language: "cpp",
    title: "FIX integer price encoding (fixed-point)",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstdio>

// FIX transmits prices as ASCII decimals; convert to int64 scaled by 10^8
// so all arithmetic is exact with no floating-point rounding.
constexpr int64_t PRICE_SCALE = 100'000'000LL;  // 8 decimal places

// Parse "123.45678901" → 12345678901 (truncates beyond 8 dp)
int64_t fix_price_to_int(const char* str, size_t len) {
    int64_t integer_part = 0, frac_part = 0;
    int     frac_digits  = 0;
    bool    after_dot    = false;

    for (size_t i = 0; i < len; ++i) {
        char c = str[i];
        if (c == '.') { after_dot = true; continue; }
        if (!after_dot) {
            integer_part = integer_part * 10 + (c - '0');
        } else if (frac_digits < 8) {
            frac_part = frac_part * 10 + (c - '0');
            ++frac_digits;
        }
    }
    while (frac_digits++ < 8) frac_part *= 10;  // right-pad to 8 dp
    return integer_part * PRICE_SCALE + frac_part;
}

// Convert back for display: 15000000000 → "150.00000000"
void int_to_fix_price(int64_t raw, char* buf) {
    int64_t whole = raw / PRICE_SCALE;
    int64_t frac  = raw % PRICE_SCALE;
    snprintf(buf, 32, "%lld.%08lld", (long long)whole, (long long)frac);
}

int main() {
    char buf[32];
    int64_t v = fix_price_to_int("150.00", 6);
    int_to_fix_price(v, buf);
    printf("%s -> %lld -> %s\\n", "150.00", (long long)v, buf);
}`,
    explanation: "Encoding FIX prices as int64 scaled by 10^8 eliminates floating-point rounding errors that can cause crossed spread detection or incorrect PnL, and enables comparison, addition, and risk aggregation with CPU-native integer operations at zero precision loss.",
  },
  {
    id: "cpp-20260724-b1-latch-fanin",
    language: "cpp",
    title: "std::latch fan-in for parallel risk computation",
    tag: "concurrency",
    code: `#include <latch>
#include <thread>
#include <vector>
#include <numeric>
#include <cstdio>

// std::latch: single-use, count-down-to-zero barrier.
// Fan-in pattern: spawn N workers, wait for all before aggregating.
void parallel_pnl(int n_books) {
    std::latch done(n_books);        // latch initialised with n_books
    std::vector<double> pnl(n_books, 0.0);
    std::vector<std::jthread> workers;

    for (int i = 0; i < n_books; ++i) {
        workers.emplace_back([&, i] {
            // Simulate per-book P&L computation.
            pnl[i] = (i + 1) * 10'000.0;
            done.count_down();  // decrement latch; releases wait() when zero
        });
    }

    done.wait();  // blocks here until all n_books threads count down

    double total = std::accumulate(pnl.begin(), pnl.end(), 0.0);
    printf("Total P&L across %d books: %.2f\\n", n_books, total);
    // workers join automatically via std::jthread destructor
}

int main() { parallel_pnl(8); }`,
    explanation: "std::latch is a one-shot counter that lets a coordinator wait for N independent workers to finish before aggregating results; unlike std::barrier it cannot be reset, making it cleaner than a condition-variable dance for a single fan-in synchronization point.",
  },
  {
    id: "cpp-20260724-b1-position-bitset",
    language: "cpp",
    title: "Bitset position bitmask for portfolio membership",
    tag: "risk",
    code: `#include <bitset>
#include <cstdint>
#include <cstdio>

// Represent N instruments as a bitset: bit i = 1 means we hold a position.
// SIMD-accelerated: 64 symbols per 64-bit word → ~16 ns for 1024-bit scan.
constexpr int N = 1024;

struct Portfolio {
    std::bitset<N> has_pos;

    void open (int idx) { has_pos.set(idx);   }
    void close(int idx) { has_pos.reset(idx); }
    bool holds(int idx) const { return has_pos.test(idx); }
    int  count()        const { return (int)has_pos.count(); }

    // Positions that are also in a given sector mask.
    std::bitset<N> in_sector(const std::bitset<N>& mask) const {
        return has_pos & mask;
    }

    // Any position in a risk list (used for pre-trade check).
    bool overlaps(const std::bitset<N>& prohibited) const {
        return (has_pos & prohibited).any();
    }
};

int main() {
    Portfolio p;
    p.open(0); p.open(7); p.open(500);

    std::bitset<N> tech_sector;
    tech_sector.set(0); tech_sector.set(7); tech_sector.set(300);

    auto tech_pos = p.in_sector(tech_sector);
    printf("Tech positions: %d\\n", (int)tech_pos.count());  // 2
    printf("Total open:     %d\\n", p.count());              // 3
}`,
    explanation: "A std::bitset<N> portfolio mask enables O(N/64) membership tests, sector intersection, and risk-list overlap checks using CPU SIMD bit operations, replacing a hash-set lookup with a single AND instruction across 64 symbols at a time.",
  },
];
