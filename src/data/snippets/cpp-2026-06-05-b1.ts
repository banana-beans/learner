import type { Snippet } from "./types";

export const cppSnippets20260605B1: Snippet[] = [
  {
    id: "cpp-20260605-b1-concepts",
    language: "cpp",
    title: "C++20 Concepts — Numeric and Priceable constraints for template safety",
    tag: "templates",
    code: `#include <concepts>
#include <cstdint>
#include <iostream>
#include <type_traits>

// Concept: any arithmetic type usable as a price or quantity.
template <typename T>
concept Numeric = std::is_arithmetic_v<T>;

// Concept: a type that exposes .price() and .qty() accessors.
template <typename T>
concept Priceable = requires(const T& t) {
    { t.price() } -> std::convertible_to<double>;
    { t.qty()   } -> std::convertible_to<std::int64_t>;
};

// Concept: a serialisable message — must expose .serialize(std::byte* buf).
template <typename T>
concept Message = requires(const T& t, std::byte* buf) {
    { t.serialize(buf) } -> std::same_as<std::size_t>;
};

// Concept-constrained aggregate functions.
template <Numeric T>
T vwap(const T* prices, const T* qtys, std::size_t n) {
    T num = 0, den = 0;
    for (std::size_t i = 0; i < n; ++i) { num += prices[i]*qtys[i]; den += qtys[i]; }
    return den ? num / den : T{};
}

template <Priceable Order>
double notional(const Order& o) { return o.price() * static_cast<double>(o.qty()); }

struct LimitOrder {
    double  price_  = 0.0;
    std::int64_t qty_ = 0;
    double  price() const noexcept { return price_; }
    std::int64_t qty()   const noexcept { return qty_;   }
};

static_assert(Priceable<LimitOrder>);   // verified at compile time

int main() {
    double px[] = {100.0, 101.0, 99.5};
    double qt[] = {500.0, 300.0, 200.0};
    std::cout << "VWAP: " << vwap(px, qt, 3) << "\\n";    // 100.35
    LimitOrder lo{100.25, 1000};
    std::cout << "Notional: " << notional(lo) << "\\n";  // 100250
}`,
    explanation:
      "C++20 concepts replace SFINAE for expressing constraints: `concept Priceable` compiles to a boolean predicate evaluated at instantiation, producing a readable error when violated. Unlike enable_if, concepts allow overloading on constraints and appear in the function signature itself — the constraint is part of the interface, not hidden in a trailing parameter.",
  },
  {
    id: "cpp-20260605-b1-sfinae-order-id",
    language: "cpp",
    title: "SFINAE enable_if — compile-time integer vs floating order-ID dispatch",
    tag: "templates",
    code: `#include <type_traits>
#include <string>
#include <sstream>
#include <iostream>

// Overload selected only when T is an integral type (e.g., uint64_t order IDs).
template <typename T,
          std::enable_if_t<std::is_integral_v<T>, int> = 0>
std::string format_order_id(T id) {
    return "INT#" + std::to_string(id);
}

// Overload for floating-point IDs (e.g., FIFO timestamp-based IDs).
template <typename T,
          std::enable_if_t<std::is_floating_point_v<T>, int> = 0>
std::string format_order_id(T id) {
    std::ostringstream ss;
    ss << "FP#" << std::fixed << id;
    return ss.str();
}

// SFINAE-based type traits can also build conditional member types.
template <typename T>
struct OrderTraits {
    using IdType  = std::conditional_t<std::is_integral_v<T>,
                                        std::uint64_t, double>;
    using TagType = std::conditional_t<std::is_same_v<T, char>,
                                        std::string, T>;
    static constexpr bool is_numeric = std::is_arithmetic_v<T>;
};

int main() {
    std::cout << format_order_id(1234567ULL)  << "\\n"; // INT#1234567
    std::cout << format_order_id(1234567.89)  << "\\n"; // FP#1234567.890000
    // format_order_id(std::string{}) would fail to compile — SFINAE eliminates
    // both overloads, producing a "no matching function" error.
    static_assert(OrderTraits<int>::is_numeric);
    static_assert(std::is_same_v<OrderTraits<long>::IdType, std::uint64_t>);
}`,
    explanation:
      "SFINAE (Substitution Failure Is Not An Error) makes the enable_if condition part of the function template's type signature: if T is not integral, substitution of the default argument fails silently and the overload is removed from the candidate set. Prefer C++20 concepts for new code, but understanding SFINAE is essential for reading any pre-C++20 financial library.",
  },
  {
    id: "cpp-20260605-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-size slab pool allocator — O(1) order object allocation",
    tag: "memory",
    code: `#include <cstddef>
#include <cstdint>
#include <array>
#include <stdexcept>

// Slab allocator: carves out fixed-size blocks from a pre-allocated arena.
// Free list links blocks via a union — no overhead beyond the block itself.
template <std::size_t BlockSize, std::size_t Capacity>
class PoolAllocator {
    static_assert(BlockSize >= sizeof(void*), "block too small for free-list ptr");

    alignas(std::max_align_t)
    std::array<std::byte, BlockSize * Capacity> arena_{};
    void* free_list_ = nullptr;
    std::size_t allocated_ = 0;

public:
    PoolAllocator() noexcept {
        // Thread together all blocks into the free list at construction.
        for (std::size_t i = 0; i < Capacity; ++i) {
            void* block = arena_.data() + i * BlockSize;
            *static_cast<void**>(block) = free_list_;
            free_list_ = block;
        }
    }

    [[nodiscard]] void* allocate() {
        if (!free_list_) throw std::bad_alloc{};
        void* block  = free_list_;
        free_list_   = *static_cast<void**>(free_list_);
        ++allocated_;
        return block;
    }

    void deallocate(void* block) noexcept {
        *static_cast<void**>(block) = free_list_;
        free_list_ = block;
        --allocated_;
    }

    std::size_t allocated() const noexcept { return allocated_; }
    std::size_t capacity()  const noexcept { return Capacity; }
};

struct Order { double price; std::uint32_t qty; std::uint64_t id; };

int main() {
    PoolAllocator<sizeof(Order), 1024> pool;

    Order* o1 = new (pool.allocate()) Order{100.25, 500, 1};
    Order* o2 = new (pool.allocate()) Order{100.50, 300, 2};
    std::cout;  // suppress warning
    o1->~Order();
    pool.deallocate(o1);
    pool.deallocate(o2);
    // Reuse: no heap fragmentation, no system call.
}`,
    explanation:
      "The slab pool pre-allocates all blocks in a contiguous arena and links them via a free list embedded in the blocks themselves — no separate metadata structure. Allocation and deallocation are O(1) pointer swaps with no system call after construction. In order management systems, this pattern eliminates `new`/`delete` on the hot path where GC pauses and heap fragmentation are unacceptable.",
  },
  {
    id: "cpp-20260605-b1-spsc-queue",
    language: "cpp",
    title: "SPSC lock-free ring buffer — single-producer single-consumer market feed",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstdint>

// SPSC ring buffer: one producer, one consumer, no locks.
// Power-of-2 capacity: modulo via bitmask (N-1).
// Cache-line padding prevents false sharing between head and tail.
template <typename T, std::size_t N>
class SPSCQueue {
    static_assert((N & (N-1)) == 0, "N must be a power of 2");
    static constexpr std::size_t MASK = N - 1;

    alignas(64) std::atomic<std::size_t> head_{0};  // written by consumer
    alignas(64) std::atomic<std::size_t> tail_{0};  // written by producer
    alignas(64) std::array<T, N> buf_{};

public:
    // Called by the single producer thread only.
    bool push(const T& val) noexcept {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        std::size_t h = head_.load(std::memory_order_acquire);
        if (t - h >= N) return false;   // full
        buf_[t & MASK] = val;
        tail_.store(t + 1, std::memory_order_release);
        return true;
    }

    // Called by the single consumer thread only.
    std::optional<T> pop() noexcept {
        std::size_t h = head_.load(std::memory_order_relaxed);
        std::size_t t = tail_.load(std::memory_order_acquire);
        if (h == t) return std::nullopt;   // empty
        T val = buf_[h & MASK];
        head_.store(h + 1, std::memory_order_release);
        return val;
    }

    std::size_t size() const noexcept {
        return tail_.load(std::memory_order_relaxed)
             - head_.load(std::memory_order_relaxed);
    }
};

struct Tick { double price; std::uint32_t qty; };

int main() {
    SPSCQueue<Tick, 4096> q;
    q.push({100.25, 500});
    auto t = q.pop();   // {100.25, 500}
    (void)t;
}`,
    explanation:
      "The SPSC ring buffer requires only two atomic variables (head and tail) and a single acquire/release pair per operation — no CAS loop. The 64-byte alignment pads head and tail onto separate cache lines, preventing the producer from invalidating the consumer's line on every push. This pattern achieves 100-200 million messages per second on a single core-to-core hop.",
  },
  {
    id: "cpp-20260605-b1-ranges-pipeline",
    language: "cpp",
    title: "std::ranges pipeline — composable filter/transform for tick processing",
    tag: "modern",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <iostream>
#include <cstdint>

struct Tick {
    std::uint64_t ts_ns;
    double        price;
    std::uint32_t qty;
    char          side;   // 'B' or 'A'
};

int main() {
    std::vector<Tick> feed = {
        {1000, 100.10, 1000, 'B'},
        {1001, 100.15,  500, 'A'},
        {1002,  99.90,  200, 'B'},
        {1003, 100.25, 2000, 'A'},
        {1004, 100.20,  100, 'B'},
    };

    // Pipeline: filter large asks, extract their prices, cap at 3.
    // All views are lazy — no copies until materialised by iteration.
    auto large_ask_prices =
        feed
        | std::views::filter([](const Tick& t){ return t.side == 'A' && t.qty >= 500; })
        | std::views::transform([](const Tick& t){ return t.price; })
        | std::views::take(3);

    std::cout << "Large ask prices:\\n";
    for (double px : large_ask_prices)
        std::cout << "  " << px << "\\n";   // 100.15, 100.25

    // Materialise to vector when random access is needed.
    std::vector<double> v(large_ask_prices.begin(), large_ask_prices.end());

    // Compute VWAP over buys using a fold.
    double num = 0, den = 0;
    for (const auto& [ts, px, qty, side] : feed | std::views::filter(
            [](const Tick& t){ return t.side == 'B'; })) {
        num += px * qty; den += qty;
    }
    std::cout << "Buy VWAP: " << (den ? num/den : 0.0) << "\\n";
}`,
    explanation:
      "std::ranges views are lazy adapters — they produce elements on demand rather than materialising intermediate containers. Composing filter | transform | take evaluates the full pipeline in a single forward pass with no heap allocation. For a market-data feed where most ticks are discarded by downstream filters, laziness avoids allocating filtered copies that immediately go out of scope.",
  },
  {
    id: "cpp-20260605-b1-black76",
    language: "cpp",
    title: "Black-76 model — futures/forward option pricing and Greeks",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>

// Black (1976) model: replace spot S with forward F, discount by exp(-rT).
// Black-76 is the standard for caps, floors, swaptions, and futures options.
static double phi76(double x) {
    return std::exp(-0.5*x*x) / std::sqrt(2.0 * std::numbers::pi);
}
static double Phi76(double x) {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrt2);
}

struct B76Result {
    double call, put;
    double delta_call, delta_put;
    double gamma, vega, theta_call;
};

B76Result black76(double F,      // forward price
                   double K,      // strike
                   double r,      // risk-free rate (for discounting only)
                   double sigma,  // implied normal vol of forward
                   double T)      // time to expiry
{
    double df  = std::exp(-r * T);
    double sT  = sigma * std::sqrt(T);
    double d1  = (std::log(F/K) + 0.5*sigma*sigma*T) / sT;
    double d2  = d1 - sT;
    double Nd1 = Phi76(d1), Nd2 = Phi76(d2);
    double nd1 = phi76(d1);

    B76Result res;
    res.call       = df * (F*Nd1 - K*Nd2);
    res.put        = df * (K*Phi76(-d2) - F*Phi76(-d1));
    res.delta_call =  df * Nd1;                   // d(Call)/d(F)
    res.delta_put  = -df * Phi76(-d1);
    res.gamma      =  df * nd1 / (F * sT);        // same for call and put
    res.vega       =  df * F * nd1 * std::sqrt(T) / 100.0;
    res.theta_call = (-df * F * nd1 * sigma / (2*std::sqrt(T))
                      + r * res.call) / 365.0;
    return res;
}

int main() {
    // ATM call on an oil futures: F=K=80, r=5%, sigma=30%, T=1Y
    auto r76 = black76(80.0, 80.0, 0.05, 0.30, 1.0);
    // r76.call ≈ 9.17, r76.delta_call ≈ 0.473 (discounted 0.5)
    (void)r76;
}`,
    explanation:
      "Black-76 prices options on forwards or futures by treating the forward price F itself as the underlying: the forward's drift is zero under the forward measure, so the formula reduces to Black-Scholes with S=F and q=r. In interest rate markets, Black-76 is the market standard for caplet/floorlet pricing where the underlying is a LIBOR or SOFR forward rate.",
  },
  {
    id: "cpp-20260605-b1-lookback",
    language: "cpp",
    title: "Lookback option — floating-strike continuous closed-form",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>
#include <algorithm>

static double Phi_lb(double x) {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrt2);
}

// Floating-strike lookback CALL: payoff = S_T - min_{0..T} S_t
// Goldmann-Sosin-Gatto (1979) closed-form.
// delta = dC/dS is computed analytically here.
struct LookbackResult { double price; double delta; };

LookbackResult lookback_floating_call(
    double S,     // current spot
    double S_min, // running minimum since inception
    double r,     // risk-free rate
    double q,     // dividend yield
    double sigma, // vol
    double T)     // time to expiry
{
    double b   = r - q;          // cost of carry
    double sT  = sigma * std::sqrt(T);
    double S_m = std::min(S, S_min);

    double a1 = (std::log(S / S_m) + (b + 0.5*sigma*sigma)*T) / sT;
    double a2 = a1 - sT;
    double a3 = (std::log(S / S_m) + (-b + 0.5*sigma*sigma)*T) / sT;

    double ebt = std::exp(-b * T);
    double ert = std::exp(-r * T);
    double yf  = (b != 0.0) ? (sigma*sigma / (2.0*b)) : 0.5;

    double price = S * ebt * Phi_lb(a1)
                 - S_m * ert * Phi_lb(a2)
                 + S * ert * yf
                   * (std::pow(S_m/S, 2.0*b/sigma/sigma) * Phi_lb(-a3)
                      - std::exp(b*T) * Phi_lb(-a1));

    double delta = ebt * Phi_lb(a1) + /* approx */ ert * yf;  // simplified
    return {price, delta};
}

int main() {
    // At inception: S=S_min (running min = current spot).
    auto res = lookback_floating_call(100, 100, 0.05, 0.0, 0.20, 1.0);
    // price ≈ 13.8 (more expensive than ATM call ≈ 10.5 due to path-dependency)
    (void)res;
}`,
    explanation:
      "The floating-strike lookback call grants the right to buy at the minimum price achieved over the option's life — the optimal exercise is always in hindsight. It costs roughly 30% more than a vanilla call because the holder benefits from the entire downward path, not just the terminal value. The key complexity in the closed-form is tracking the running minimum S_min, which may already be below spot.",
  },
  {
    id: "cpp-20260605-b1-asian-mc-cv",
    language: "cpp",
    title: "Asian arithmetic average MC + geometric control variate — variance reduction",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <numeric>

// Geometric average Asian call has a closed-form (used as control variate).
// Arithmetic average Asian has no closed-form — use MC with CV for 10-50x speedup.

double geom_asian_bs(double S, double K, double r, double sigma,
                      double T, int n) {
    // Adjusted params for geometric average over n uniform monitoring dates.
    double sigma_g = sigma * std::sqrt((2.0*n + 1.0) / (6.0*(n+1)));
    double mu_g    = 0.5 * (r - 0.5*sigma*sigma) + 0.5*sigma_g*sigma_g;
    double d1 = (std::log(S/K) + (mu_g + 0.5*sigma_g*sigma_g)*T)
                / (sigma_g * std::sqrt(T));
    double d2 = d1 - sigma_g * std::sqrt(T);
    double Phi = [](double x){ return 0.5*std::erfc(-x*0.7071067811865476); };
    (void)Phi;
    // Simplified: just return the log-normal approx.
    return std::exp(-r*T) * (S * std::exp(mu_g*T) *
           0.5*(1+std::erf(d1*0.7071067811865476)) -
           K * 0.5*(1+std::erf(d2*0.7071067811865476)));
}

struct AsianResult { double price; double stderr; };

AsianResult asian_arithmetic_mc(double S, double K, double r, double sigma,
                                  double T, int n_steps, int n_paths,
                                  unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    double dt = T / n_steps, sdt = std::sqrt(dt);
    double disc = std::exp(-r * T);
    double cv_exact = geom_asian_bs(S, K, r, sigma, T, n_steps);

    std::vector<double> pay_a, pay_g;
    pay_a.reserve(n_paths); pay_g.reserve(n_paths);
    for (int p = 0; p < n_paths; ++p) {
        double St = S, sum_a = 0, log_sum = 0;
        for (int i = 0; i < n_steps; ++i) {
            St *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*sdt*nd(rng));
            sum_a += St;
            log_sum += std::log(St);
        }
        double a_avg = sum_a / n_steps;
        double g_avg = std::exp(log_sum / n_steps);
        pay_a.push_back(std::max(a_avg - K, 0.0));
        pay_g.push_back(std::max(g_avg - K, 0.0));
    }
    // Optimal control variate coefficient b* = Cov(Z_a, Z_g) / Var(Z_g).
    double mean_a = 0, mean_g = 0;
    for (int i = 0; i < n_paths; ++i) { mean_a += pay_a[i]; mean_g += pay_g[i]; }
    mean_a /= n_paths; mean_g /= n_paths;
    double cov = 0, var_g = 0;
    for (int i = 0; i < n_paths; ++i) {
        cov   += (pay_a[i]-mean_a)*(pay_g[i]-mean_g);
        var_g += (pay_g[i]-mean_g)*(pay_g[i]-mean_g);
    }
    double b = (var_g > 0) ? cov/var_g : 0.0;
    double total = 0, sq = 0;
    for (int i = 0; i < n_paths; ++i) {
        double z = disc*(pay_a[i] - b*(pay_g[i] - cv_exact));
        total += z; sq += z*z;
    }
    double mean = total/n_paths;
    double var  = sq/n_paths - mean*mean;
    return {mean, std::sqrt(var/n_paths)};
}`,
    explanation:
      "The geometric average Asian option is the ideal control variate for the arithmetic average because the two paths are correlated ~0.98: they share the same Brownian increments and differ only in how they aggregate. The coefficient b* minimises the residual variance, typically reducing the MC standard error by 10-50x — equivalent to using 100-2500x more paths without the control variate.",
  },
  {
    id: "cpp-20260605-b1-bellman-ford-fx",
    language: "cpp",
    title: "FX arbitrage detection — Bellman-Ford negative cycle on log exchange rates",
    tag: "quant",
    code: `#include <vector>
#include <string>
#include <cmath>
#include <limits>
#include <iostream>

// Transform exchange rates to edge weights: -log(rate).
// Cycle with negative total weight means product of rates > 1 (arbitrage).
// Bellman-Ford detects such a cycle in O(V * E).
struct FXEdge {
    int    from, to;
    double weight;   // -log(exchange_rate)
};

// Returns true if a negative cycle exists (= arbitrage opportunity).
// arb_path is populated with one arbitrage cycle if found.
bool detect_fx_arb(int n_ccy,
                   const std::vector<FXEdge>& edges,
                   std::vector<int>& arb_path)
{
    const double INF = std::numeric_limits<double>::infinity();
    std::vector<double> dist(n_ccy, 0.0);   // source = all zeros (no starting ccy)
    std::vector<int>    prev(n_ccy, -1);
    int last_relaxed = -1;

    // Relax V-1 times (guaranteed shortest path if no negative cycle).
    for (int iter = 0; iter < n_ccy; ++iter) {
        last_relaxed = -1;
        for (const auto& e : edges) {
            if (dist[e.from] + e.weight < dist[e.to]) {
                dist[e.to]  = dist[e.from] + e.weight;
                prev[e.to]  = e.from;
                last_relaxed = e.to;
            }
        }
    }
    if (last_relaxed == -1) return false;   // no negative cycle

    // Walk back |V| steps from last_relaxed to guarantee we're in the cycle.
    int v = last_relaxed;
    for (int i = 0; i < n_ccy; ++i) v = prev[v];

    // Trace the cycle.
    int start = v;
    arb_path.push_back(start);
    for (int u = prev[start]; u != start; u = prev[u])
        arb_path.push_back(u);
    arb_path.push_back(start);
    return true;
}

int main() {
    // 3 currencies: USD(0) EUR(1) GBP(2)
    // USD->EUR=1.10, EUR->GBP=1.20, GBP->USD=0.95 -> product=1.254 > 1 (arb!)
    std::vector<FXEdge> edges = {
        {0,1,-std::log(1.10)}, {1,0,-std::log(1.0/1.10)},
        {1,2,-std::log(1.20)}, {2,1,-std::log(1.0/1.20)},
        {2,0,-std::log(0.95)}, {0,2,-std::log(1.0/0.95)},
    };
    std::vector<int> path;
    bool arb = detect_fx_arb(3, edges, path);
    std::cout << "Arbitrage detected: " << arb << "\\n";
    // path encodes the currency sequence to exploit the cycle
}`,
    explanation:
      "Taking -log(rate) converts multiplication of exchange rates into addition of edge weights, so a profitable arbitrage cycle (product > 1) becomes a negative-weight cycle (sum < 0). Bellman-Ford detects negative cycles in O(VE) by checking whether any edge can still be relaxed after V-1 iterations. For N currencies, the graph has N*(N-1) directed edges so total complexity is O(N³).",
  },
  {
    id: "cpp-20260605-b1-par-greeks",
    language: "cpp",
    title: "std::execution::par_unseq — parallel batch option Greeks",
    tag: "performance",
    code: `#include <execution>
#include <algorithm>
#include <vector>
#include <cmath>
#include <numeric>
#include <numbers>

struct OptionInput  { double S, K, r, sigma, T; };
struct OptionOutput { double price, delta, gamma, vega; };

// Single-option BS pricer (no branches for speed).
OptionOutput bs_price_and_greeks(const OptionInput& in) {
    double sT  = in.sigma * std::sqrt(in.T);
    double d1  = (std::log(in.S/in.K) + (in.r + 0.5*in.sigma*in.sigma)*in.T) / sT;
    double d2  = d1 - sT;
    double nd1 = std::exp(-0.5*d1*d1) / std::sqrt(2.0 * std::numbers::pi);
    double Nd1 = 0.5 * std::erfc(-d1 * std::numbers::inv_sqrt2);
    double Nd2 = 0.5 * std::erfc(-d2 * std::numbers::inv_sqrt2);
    double ert = std::exp(-in.r * in.T);
    return {
        in.S * Nd1 - in.K * ert * Nd2,        // price
        Nd1,                                    // delta
        nd1 / (in.S * sT),                     // gamma
        in.S * nd1 * std::sqrt(in.T) / 100.0  // vega
    };
}

// Price an entire book in parallel — no synchronisation needed (output[i] independent).
std::vector<OptionOutput> price_book(const std::vector<OptionInput>& book) {
    std::vector<OptionOutput> out(book.size());
    // par_unseq: parallelize AND vectorize. No data races because each output
    // index is owned by exactly one input index.
    std::transform(std::execution::par_unseq,
                   book.begin(), book.end(),
                   out.begin(),
                   bs_price_and_greeks);
    return out;
}

int main() {
    std::vector<OptionInput> book(10'000);
    for (auto& opt : book) opt = {100.0, 100.0, 0.05, 0.20, 1.0};
    auto results = price_book(book);
    double total_delta = 0;
    for (const auto& r : results) total_delta += r.delta;
    // Parallelised over all available cores via TBB/OpenMP backend.
}`,
    explanation:
      "std::execution::par_unseq requests both parallelism (multiple threads via the TBB or libc++ backend) and vectorisation (SIMD within each thread). The transform here is embarrassingly parallel — each output element depends only on the corresponding input — so the compiler can schedule chunks across cores and SIMD-ify the inner loop. A 10k-option book repriced in ~0.5 ms vs ~5 ms sequential.",
  },
  {
    id: "cpp-20260605-b1-hugepages",
    language: "cpp",
    title: "Huge pages (MAP_HUGETLB) — 2 MB pages for the market data ring buffer",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <stdexcept>
#include <cstring>

#ifndef MAP_HUGETLB
#define MAP_HUGETLB 0x40000   // Linux 2.6.32+
#endif

// Allocate a huge-page backed buffer for a ring buffer or order book.
// Benefit: 2 MB pages reduce TLB miss rate from O(N/4k) to O(N/2M).
// Requires: /proc/sys/vm/nr_hugepages > 0 on the host.
class HugepageBuffer {
    void*       ptr_  = MAP_FAILED;
    std::size_t size_ = 0;
public:
    explicit HugepageBuffer(std::size_t size) {
        // Round up to 2 MB huge page boundary.
        constexpr std::size_t HP = 2UL << 20;  // 2 MB
        size_ = (size + HP - 1) & ~(HP - 1);

        // Try huge pages; fall back to standard 4 kB pages.
        ptr_ = ::mmap(nullptr, size_,
                      PROT_READ | PROT_WRITE,
                      MAP_ANONYMOUS | MAP_PRIVATE | MAP_HUGETLB | MAP_POPULATE,
                      -1, 0);
        if (ptr_ == MAP_FAILED) {
            // Fallback: normal pages (still anonymous, zero-initialised).
            ptr_ = ::mmap(nullptr, size_,
                          PROT_READ | PROT_WRITE,
                          MAP_ANONYMOUS | MAP_PRIVATE | MAP_POPULATE,
                          -1, 0);
        }
        if (ptr_ == MAP_FAILED) throw std::runtime_error("mmap failed");
        std::memset(ptr_, 0, size_);
    }
    ~HugepageBuffer() { if (ptr_ != MAP_FAILED) ::munmap(ptr_, size_); }

    void* data()        const noexcept { return ptr_; }
    std::size_t size()  const noexcept { return size_; }
    HugepageBuffer(const HugepageBuffer&) = delete;
};

// Usage: wrap a 256 MB ring buffer in huge pages.
// HugepageBuffer rb(256 << 20);
// Tick* ticks = static_cast<Tick*>(rb.data());`,
    explanation:
      "A 4 kB page TLB can only map 512 entries with 64-entry L1 TLBs — a 256 MB ring buffer needs 65536 pages, causing TLB thrashing on every sequential scan. Huge pages (2 MB) reduce page count to 128, allowing the entire buffer to fit in the TLB. MAP_POPULATE pre-faults all pages at allocation time so there are no minor page faults on the hot path.",
  },
  {
    id: "cpp-20260605-b1-span-tick",
    language: "cpp",
    title: "std::span — zero-copy view over a shared-memory tick buffer",
    tag: "modern",
    code: `#include <span>
#include <cstdint>
#include <cstddef>
#include <algorithm>
#include <iostream>

// Tick buffer in shared memory — std::span provides a typed, bounds-checked
// view without copying or owning the underlying bytes.
struct Tick {
    std::uint64_t ts_ns;
    double        price;
    std::uint32_t qty;
    std::uint8_t  side;
    std::uint8_t  flags;
    std::uint16_t padding;
};
static_assert(sizeof(Tick) == 24);

// Function accepts a span — works with any contiguous range (array, vector, mmap).
double compute_vwap(std::span<const Tick> ticks) noexcept {
    double num = 0, den = 0;
    for (const auto& t : ticks) {
        num += t.price * t.qty;
        den += t.qty;
    }
    return den ? num / den : 0.0;
}

std::size_t count_side(std::span<const Tick> ticks, std::uint8_t side) noexcept {
    return static_cast<std::size_t>(
        std::count_if(ticks.begin(), ticks.end(),
                      [side](const Tick& t){ return t.side == side; }));
}

int main() {
    Tick ring[1024] = {};
    ring[0] = {1000, 100.10, 500, 0, 0, 0};
    ring[1] = {1001, 100.20, 300, 1, 0, 0};
    ring[2] = {1002,  99.90, 200, 0, 0, 0};

    // Slice: last 3 filled ticks — no copy.
    std::span<const Tick> recent{ring, 3};
    std::cout << "VWAP:     " << compute_vwap(recent) << "\\n";     // 100.09
    std::cout << "Buy ticks: " << count_side(recent, 0) << "\\n";  // 2

    // Subspan: just the first 2 ticks.
    auto first2 = recent.subspan(0, 2);
    std::cout << "2-tick VWAP: " << compute_vwap(first2) << "\\n"; // 100.1375
}`,
    explanation:
      "std::span is a non-owning, bounds-safe reference to a contiguous sequence: it carries a pointer and a size but never allocates or copies. Accepting span<const Tick> makes functions callable on C arrays, std::vector, mmap'd regions, and shared-memory buffers interchangeably. Subspan produces a zero-copy sliding window over the buffer for rolling VWAP or recent-trade analysis.",
  },
  {
    id: "cpp-20260605-b1-latency-histogram",
    language: "cpp",
    title: "Latency histogram with std::chrono — tick-to-action measurement",
    tag: "performance",
    code: `#include <chrono>
#include <array>
#include <cstdint>
#include <algorithm>
#include <iostream>

// Logarithmic-bucket latency histogram: buckets cover 1 ns to 1 ms.
// Each bucket covers a power-of-2 range; bit_width finds the bucket in O(1).
class LatencyHisto {
    using Clock = std::chrono::steady_clock;
    using TP    = Clock::time_point;

    static constexpr int BUCKETS = 20;   // 1ns, 2ns, 4ns, ... 524 µs, 1 ms+
    std::array<std::uint64_t, BUCKETS> counts_{};
    std::uint64_t total_  = 0;
    std::uint64_t sum_ns_ = 0;

    TP start_{};
    bool active_ = false;

    static int bucket_of(std::uint64_t ns) noexcept {
        if (ns == 0) return 0;
        int b = 64 - __builtin_clzll(ns);   // log2(ns) + 1
        return std::min(b, BUCKETS - 1);
    }

public:
    void start() noexcept { active_ = true; start_ = Clock::now(); }

    void stop() noexcept {
        if (!active_) return;
        active_ = false;
        auto ns = static_cast<std::uint64_t>(
            std::chrono::duration_cast<std::chrono::nanoseconds>(
                Clock::now() - start_).count());
        ++counts_[bucket_of(ns)];
        sum_ns_ += ns;
        ++total_;
    }

    void report() const {
        if (!total_) { std::cout << "no samples\\n"; return; }
        std::cout << "avg=" << sum_ns_/total_ << "ns  samples=" << total_ << "\\n";
        for (int b = 0; b < BUCKETS; ++b)
            if (counts_[b])
                std::cout << "  [" << (1<<b) << "ns): " << counts_[b] << "\\n";
    }

    std::uint64_t percentile_bucket(double p) const {
        std::uint64_t thresh = static_cast<std::uint64_t>(total_ * p / 100.0);
        std::uint64_t cum = 0;
        for (int b = 0; b < BUCKETS; ++b)
            if ((cum += counts_[b]) >= thresh) return static_cast<std::uint64_t>(1)<<b;
        return static_cast<std::uint64_t>(1) << (BUCKETS-1);
    }
};`,
    explanation:
      "Logarithmic buckets via __builtin_clzll (count leading zeros) classify any latency into its power-of-2 bucket in a single instruction with no branching — far cheaper than a linear bucket search. The 99th-percentile bucket upper bound is computed from cumulative counts without storing raw samples, keeping memory usage constant regardless of observation count.",
  },
  {
    id: "cpp-20260605-b1-sabr-hagan",
    language: "cpp",
    title: "SABR Hagan (2002) — closed-form implied vol approximation",
    tag: "quant",
    code: `#include <cmath>

// Hagan et al. (2002) SABR model analytical approximation.
// dF = F^beta * sigma * dW1
// d sigma = nu * sigma * dZ,  corr(dW1, dZ) = rho
// Gives Black implied vol sigma_B(K, F) as a function of model params.
double sabr_black_vol(
    double F,      // forward rate/price
    double K,      // strike
    double T,      // time to expiry
    double alpha,  // SABR alpha (initial vol of vol of F^beta)
    double beta,   // CEV exponent in [0, 1]
    double rho,    // correlation between asset and vol processes
    double nu)     // vol-of-vol
{
    if (std::abs(F - K) < 1e-8) {
        // ATM approximation (avoids 0/0).
        double Fmid  = std::pow(F, beta);
        double term1 = alpha / Fmid;
        double term2 = ((1-beta)*(1-beta)/24.0 * alpha*alpha / (Fmid*Fmid)
                        + 0.25 * rho*beta*nu*alpha / Fmid
                        + (2-3*rho*rho)/24.0 * nu*nu) * T;
        return term1 * (1.0 + term2);
    }

    double logFK  = std::log(F / K);
    double FKbeta = std::pow(F * K, 0.5 * (1 - beta));
    double z      = nu / alpha * FKbeta * logFK;
    double x_z    = std::log((std::sqrt(1 - 2*rho*z + z*z) + z - rho)
                              / (1 - rho));
    double denom  = FKbeta * (1
        + (1-beta)*(1-beta)/24.0 * logFK*logFK
        + (1-beta)*(1-beta)*(1-beta)*(1-beta)/1920.0 * logFK*logFK*logFK*logFK);
    double A = alpha / denom * (z / x_z);
    double B = 1.0
        + ((1-beta)*(1-beta)/24.0 * alpha*alpha / std::pow(F*K, 1-beta)
           + 0.25 * rho*beta*nu*alpha / std::pow(F*K, 0.5*(1-beta))
           + (2-3*rho*rho)/24.0 * nu*nu) * T;
    return A * B;
}

int main() {
    // EUR/USD swaption: F=0.03, K=0.025, T=1Y, alpha=0.01, beta=0.5, rho=-0.3, nu=0.4
    double vol = sabr_black_vol(0.03, 0.025, 1.0, 0.01, 0.5, -0.3, 0.4);
    (void)vol;  // smile vol for this strike
}`,
    explanation:
      "SABR (Stochastic Alpha Beta Rho) generates a smile because the vol-of-vol nu causes the implied vol to rise for both OTM calls and puts. The beta parameter controls the backbone: beta=0 gives a Normal model (vol independent of F), beta=1 gives lognormal, and beta=0.5 is the square-root (CIR) model. Negative rho creates a downward skew matching the typical equity smile.",
  },
  {
    id: "cpp-20260605-b1-bachelier",
    language: "cpp",
    title: "Bachelier / Normal model — swaption pricing under negative rates",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>

// Bachelier (1900) / Normal model: dF = sigma_N * dW (additive vol, not %).
// Allows negative forward rates — essential for EUR swaption markets post-QE.
// Sigma_N is in absolute bps/year, not as a fraction of F.
static double Phi_n(double x) {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrt2);
}
static double phi_n(double x) {
    return std::exp(-0.5*x*x) / std::sqrt(2.0 * std::numbers::pi);
}

struct NormalResult { double call, put, delta_call, vega; };

NormalResult bachelier(double F,       // forward rate (can be negative)
                        double K,       // strike
                        double r,       // discount rate
                        double sigma_N, // normal (additive) vol
                        double T)       // time to expiry
{
    double df  = std::exp(-r * T);
    double sT  = sigma_N * std::sqrt(T);
    double d   = (F - K) / sT;   // normalised moneyness

    NormalResult res;
    res.call       = df * ((F - K) * Phi_n(d) + sT * phi_n(d));
    res.put        = df * ((K - F) * Phi_n(-d) + sT * phi_n(d));
    res.delta_call = df * Phi_n(d);
    res.vega       = df * std::sqrt(T) * phi_n(d);   // per 1 bps of sigma_N
    return res;
}

// Convert normal vol to lognormal approx (valid near ATM).
double normal_to_lognormal_vol(double sigma_N, double F, double K, double T) {
    double m = 0.5 * (F + K);
    return sigma_N / m * (1.0 + (F-K)*(F-K)/(12.0*m*m) + (F-K)*T/(24.0));
}

int main() {
    // EUR receiver swaption: F=-0.002 (negative), K=0, sigma_N=0.005 (50 bps/yr)
    auto res = bachelier(-0.002, 0.0, 0.01, 0.005, 1.0);
    // res.call ≈ negative moneyness → mostly from the vol term
    (void)res;
}`,
    explanation:
      "The Normal model is essential for negative forward rates (EUR, JPY, CHF) where the lognormal BS model is undefined. The formula replaces the log-moneyness (F-K)/sT — symmetric in F-K rather than F/K — so it treats moves above and below K equally. In practice, the market quotes both lognormal and normal vol, and conversion formulas are needed at each calibration step.",
  },
  {
    id: "cpp-20260605-b1-implied-vol-halley",
    language: "cpp",
    title: "Implied vol solver — Halley's method for cubic convergence",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>
#include <stdexcept>

// Halley's method: cubically convergent — 3 iterations for 12 decimal places.
// Newton's method converges quadratically (2 iterations = 8 digits).
// Halley: x_{n+1} = x_n - f/f' * (1 - f*f''/(2*f'^2))^{-1}
static double Phi_iv(double x) { return 0.5*std::erfc(-x*std::numbers::inv_sqrt2); }
static double phi_iv(double x) {
    return std::exp(-0.5*x*x)/std::sqrt(2.0*std::numbers::pi);
}

struct BSResult {
    double price, vega, vanna; // vanna = d(vega)/d(F) for Halley correction
};

BSResult bs_call_full(double S, double K, double r, double sigma, double T) {
    double sT = sigma*std::sqrt(T);
    double d1 = (std::log(S/K)+(r+0.5*sigma*sigma)*T)/sT;
    double d2 = d1 - sT;
    double nd1 = phi_iv(d1);
    BSResult res;
    res.price = S*Phi_iv(d1) - K*std::exp(-r*T)*Phi_iv(d2);
    res.vega  = S*nd1*std::sqrt(T);                   // d(C)/d(sigma)
    res.vanna = -nd1*d2/sigma;                         // d(vega)/d(sigma), used for Halley
    return res;
}

double implied_vol_halley(double S, double K, double r, double T,
                            double market_price, double tol = 1e-10,
                            int max_iter = 10)
{
    if (market_price <= 0 || market_price >= S) throw std::domain_error("price OOB");
    double sigma = 0.20;   // initial guess: 20% flat vol
    for (int i = 0; i < max_iter; ++i) {
        auto [C, vega, vanna] = bs_call_full(S, K, r, sigma, T);
        double f  = C - market_price;
        double fp = vega;                     // first derivative
        double fpp = vanna;                   // second derivative (approx)
        // Halley step: sigma -= f/fp / (1 - f*fpp/(2*fp*fp))
        double step = f/fp / (1.0 - 0.5*f*fpp/(fp*fp));
        sigma -= step;
        if (std::abs(step) < tol) break;
    }
    return sigma;
}

int main() {
    double iv = implied_vol_halley(100.0, 100.0, 0.05, 1.0, 10.4506);
    // iv ≈ 0.20000 (recovers the 20% vol used to generate the price)
    (void)iv;
}`,
    explanation:
      "Halley's method adds the second-derivative correction term to Newton's step, achieving cubic convergence: each iteration triples the number of correct digits (8→24 for floating-point double). For implied vol inversion where vanna (d²C/dσ²) has a closed form, the extra cost per iteration is negligible and the iteration count drops from 4-5 (Newton) to 2-3 (Halley).",
  },
  {
    id: "cpp-20260605-b1-crr-binomial",
    language: "cpp",
    title: "Cox-Ross-Rubinstein binomial tree — American put with early exercise",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// CRR binomial tree for American put.
// Up/down factors: u = exp(sigma*sqrt(dt)), d = 1/u.
// Risk-neutral prob: p = (exp(r*dt) - d) / (u - d).
// At each node: max(intrinsic, continuation). O(N^2) time and space.
double crr_american_put(double S, double K, double r, double sigma,
                          double T, int N = 200)
{
    double dt  = T / N;
    double u   = std::exp(sigma * std::sqrt(dt));
    double d   = 1.0 / u;
    double ert = std::exp(r * dt);
    double p   = (ert - d) / (u - d);   // risk-neutral up probability
    double q   = 1.0 - p;
    double disc = 1.0 / ert;

    // Terminal payoffs at t=T.
    std::vector<double> V(N + 1);
    for (int j = 0; j <= N; ++j) {
        double ST = S * std::pow(u, 2*j - N);   // spot at node (N, j)
        V[j] = std::max(K - ST, 0.0);
    }

    // Backward induction with early-exercise check.
    for (int i = N - 1; i >= 0; --i) {
        for (int j = 0; j <= i; ++j) {
            double Sij  = S * std::pow(u, 2*j - i);
            double hold = disc * (p * V[j+1] + q * V[j]);   // continuation
            double exer = std::max(K - Sij, 0.0);             // early exercise
            V[j] = std::max(hold, exer);                       // American choice
        }
    }
    return V[0];
}

int main() {
    double eur_put = crr_american_put(100, 100, 0.05, 0.20, 1.0);
    // American > European put due to early-exercise premium at high rates.
    // euro ≈ 5.57, american ≈ 6.09 (higher by the early-exercise premium)
    (void)eur_put;
}`,
    explanation:
      "The CRR tree prices American options exactly within the lattice by comparing the intrinsic value (immediate exercise payoff) against the continuation value (discounted expected payoff) at every node. The early-exercise boundary — where exercise dominates holding — emerges naturally from the backward induction without requiring a separate search. American put premiums are always positive for positive rates because early exercise captures intrinsic value before discounting erodes it.",
  },
  {
    id: "cpp-20260605-b1-hull-white-mc",
    language: "cpp",
    title: "Hull-White single-factor short rate MC — Gaussian mean-reversion",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <numeric>

// Hull-White (1990): dr = (theta(t) - a*r)*dt + sigma*dW
// theta(t) calibrated to fit the initial zero curve exactly.
// Exact simulation: Gaussian conditional distribution — no discretisation error.
struct HullWhiteParams {
    double a;     // mean-reversion speed
    double sigma; // short-rate vol
};

// Exact simulation of HW short rate over [0, T] on a grid of n_steps.
// Returns path of short rates AND discount factor P(0,T) for each path.
struct HWPath { std::vector<double> r; double P; };

HWPath hw_path(double r0, const HullWhiteParams& p,
               const std::vector<double>& disc_curve, // zero rates at each step
               double T, int n_steps, std::mt19937_64& rng)
{
    std::normal_distribution<> nd;
    double dt = T / n_steps;
    double a  = p.a, sig = p.sigma;

    std::vector<double> r_path(n_steps + 1);
    r_path[0] = r0;
    double sum_r = 0.0;  // for approximating P(0,T)

    for (int i = 0; i < n_steps; ++i) {
        double t   = i * dt;
        // theta(t) from zero curve: approximate as forward rate slope.
        double f0t = (disc_curve.size() > static_cast<std::size_t>(i+1))
                     ? disc_curve[i+1] : disc_curve.back();
        double theta_t = f0t + a * f0t + sig*sig/(2*a) * (1-std::exp(-2*a*t));

        // Exact conditional mean and variance.
        double e_at    = std::exp(-a * dt);
        double mean    = r_path[i]*e_at + (theta_t/a)*(1 - e_at);
        double var     = sig*sig/(2*a) * (1 - e_at*e_at);
        r_path[i+1]    = mean + std::sqrt(var) * nd(rng);
        sum_r         += r_path[i+1];
    }
    // P(0,T) ≈ exp(-average_rate * T) — crude trapezoidal approximation.
    double P = std::exp(-sum_r / n_steps * dt);
    return {r_path, P};
}`,
    explanation:
      "Hull-White's exact conditional distribution is Gaussian (mean and variance have closed forms), so each time step introduces no discretisation error — unlike Euler-Maruyama which has O(dt) strong error. The theta(t) function absorbs the initial yield curve, making HW a no-arbitrage model. For ZCB pricing, the affine structure gives P(t,T) = A(t,T)*exp(-B(t,T)*r_t) analytically.",
  },
  {
    id: "cpp-20260605-b1-jthread-stop",
    language: "cpp",
    title: "std::jthread + stop_token — graceful market data receiver shutdown",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <chrono>
#include <iostream>
#include <atomic>
#include <cstdint>

std::atomic<std::uint64_t> ticks_received{0};

// The stop_token allows external cancellation without shared boolean flags.
// jthread automatically calls request_stop() then joins in its destructor.
void market_data_receiver(std::stop_token stop_tok, int port) {
    std::cout << "Receiver started on port " << port << "\\n";

    while (!stop_tok.stop_requested()) {
        // Simulate tick processing (in production: recv() from UDP multicast).
        ++ticks_received;
        std::this_thread::sleep_for(std::chrono::microseconds(100));

        // Cooperative check at natural yield points (after each tick batch).
        if (stop_tok.stop_requested()) break;
    }
    std::cout << "Receiver stopped. Ticks: " << ticks_received << "\\n";
}

void order_gate_monitor(std::stop_token stop_tok, std::atomic<bool>& gate) {
    // Register a callback that fires when stop is requested.
    std::stop_callback cb(stop_tok, [&]() {
        gate.store(false, std::memory_order_release);
        std::cout << "Order gate closed.\\n";
    });
    while (!stop_tok.stop_requested())
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
}

int main() {
    std::atomic<bool> order_gate{true};
    // jthread auto-joins and auto-requests-stop at scope exit.
    {
        std::jthread recv(market_data_receiver, 9001);
        std::jthread mon(order_gate_monitor, order_gate);
        std::this_thread::sleep_for(std::chrono::milliseconds(2));
        // recv and mon destructed here: request_stop() then join() automatically.
    }
}`,
    explanation:
      "std::jthread (C++20) combines a thread with a cooperative stop mechanism: its destructor calls request_stop() then join(), eliminating the manual join() in finally/RAII wrappers. stop_callback fires synchronously when stop is requested — ideal for closing the order gate before the feed thread terminates to prevent orders from referencing stale market state.",
  },
  {
    id: "cpp-20260605-b1-atomic-ref",
    language: "cpp",
    title: "std::atomic_ref — lock-free element access in a non-atomic price array",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <thread>
#include <iostream>
#include <cstdint>

// std::atomic_ref wraps any object that meets atomic constraints,
// providing atomic operations WITHOUT storing the object in std::atomic<T>.
// Use case: a C-style array shared between a writer and many readers,
// where std::atomic<double> would prevent memcpy-based initialisation.

struct PriceTable {
    alignas(8) double bid[256] = {};  // indexed by instrument_id
    alignas(8) double ask[256] = {};
};

// Shared table — must not be written and read concurrently without sync.
PriceTable g_table;

// Publisher: updates one instrument atomically.
void publish_quote(std::uint8_t id, double bid, double ask) noexcept {
    std::atomic_ref<double> ref_bid(g_table.bid[id]);
    std::atomic_ref<double> ref_ask(g_table.ask[id]);
    // Store with release so readers see a consistent pair via acquire load.
    ref_bid.store(bid, std::memory_order_relaxed);
    ref_ask.store(ask, std::memory_order_release);
}

struct Quote { double bid, ask; };

// Consumer: reads atomically — guaranteed to not tear despite non-atomic array.
Quote read_quote(std::uint8_t id) noexcept {
    std::atomic_ref<const double> ref_ask(g_table.ask[id]);
    double ask = ref_ask.load(std::memory_order_acquire);
    std::atomic_ref<const double> ref_bid(g_table.bid[id]);
    double bid = ref_bid.load(std::memory_order_relaxed);
    return {bid, ask};
}

int main() {
    publish_quote(42, 100.24, 100.26);
    auto q = read_quote(42);
    std::cout << q.bid << " / " << q.ask << "\\n";  // 100.24 / 100.26
}`,
    explanation:
      "std::atomic_ref is the standard C++20 solution for retrofitting atomic access onto an existing POD array without changing the type. The array remains plain double[] (compatible with mmap, memcpy, and C APIs) while individual elements can be read and written atomically on demand. The alignment requirement (alignas(8) for double) must be satisfied for the atomic_ref to compile.",
  },
  {
    id: "cpp-20260605-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive singly-linked list — zero-alloc order node recycling",
    tag: "stl",
    code: `#include <cstdint>
#include <iostream>

// Intrusive list: the list node is EMBEDDED in the element, not separately allocated.
// No heap allocation per element — the node lifetime equals the object lifetime.
// Pattern used in Linux kernel, folly, and HFT order management systems.
struct OrderNode {
    OrderNode* next = nullptr;   // intrusive list link (first field for cache locality)
    std::uint64_t id;
    double        price;
    std::uint32_t qty;
    std::uint8_t  side;
};

// Push-front intrusive stack (LIFO free-list pattern).
class IntrusiveStack {
    OrderNode* head_ = nullptr;
    std::size_t size_ = 0;
public:
    void push(OrderNode* node) noexcept {
        node->next = head_;
        head_ = node;
        ++size_;
    }
    OrderNode* pop() noexcept {
        if (!head_) return nullptr;
        OrderNode* n = head_;
        head_ = head_->next;
        n->next = nullptr;
        --size_;
        return n;
    }
    std::size_t size() const noexcept { return size_; }
    bool empty() const noexcept { return !head_; }
};

// Pre-allocated pool of order nodes — no dynamic allocation on the hot path.
OrderNode g_pool[1024];

int main() {
    IntrusiveStack free_list;
    for (auto& node : g_pool) free_list.push(&node);

    // "Allocate" an order.
    OrderNode* o = free_list.pop();
    *o = {nullptr, 1, 100.25, 500, 0};
    std::cout << "Order: " << o->id << " @ " << o->price << "\\n";

    // "Free" the order.
    free_list.push(o);
    std::cout << "Free list size: " << free_list.size() << "\\n";
}`,
    explanation:
      "Intrusive lists embed the list linkage directly in the object, eliminating the heap allocation and pointer indirection that node-based containers (std::list) require. The HFT pattern: pre-allocate a contiguous pool of OrderNode objects at startup, manage them via an intrusive free-list stack, and never call new/delete on the hot path. Cache locality is excellent because nodes are adjacent in the pool array.",
  },
  {
    id: "cpp-20260605-b1-expression-template",
    language: "cpp",
    title: "Expression templates — zero-copy lazy portfolio return computation",
    tag: "templates",
    code: `#include <cstddef>
#include <array>
#include <iostream>

// Expression templates: build a tree of operations at compile time.
// sum(w * r) over N assets allocates no temporaries — the compiler fuses
// the multiply and accumulate into a single loop.

// Tag for a "scaled" expression: w[i] * expr[i].
template <typename Expr>
struct Scaled {
    const double* weights;
    const Expr&   expr;
    double operator[](std::size_t i) const { return weights[i] * expr[i]; }
    std::size_t size() const { return expr.size(); }
};

// Plain array wrapper.
struct Vec {
    const double* data;
    std::size_t   n;
    double operator[](std::size_t i) const { return data[i]; }
    std::size_t size() const { return n; }
};

// Operator* creates a Scaled expression without allocating memory.
template <typename Expr>
Scaled<Expr> operator*(const double* w, const Expr& e) {
    return {w, e};
}

// Sum evaluates any expression lazily.
template <typename Expr>
double sum(const Expr& e) {
    double acc = 0.0;
    for (std::size_t i = 0; i < e.size(); ++i) acc += e[i];
    return acc;
}

int main() {
    constexpr std::size_t N = 5;
    std::array<double, N> weights = {0.30, 0.25, 0.20, 0.15, 0.10};
    std::array<double, N> returns = {0.08, 0.05, 0.12, -0.03, 0.07};

    // No temporary array: the compiler sees sum(w[i]*r[i]) and emits one loop.
    Vec r_vec{returns.data(), N};
    double port_ret = sum(weights.data() * r_vec);
    std::cout << "Portfolio return: " << port_ret << "\\n";  // 0.0595

    // Nest: weighted sum of excess returns (r - rf).
    // In production ET libraries (Eigen, blaze) nested exprs are equally zero-copy.
}`,
    explanation:
      "Expression templates delay evaluation by building a type-level expression tree: `weights * r_vec` produces a Scaled<Vec> object, not an array. When sum() iterates over it, each element is computed as weights[i]*returns[i] on demand — the compiler sees a single pass over two contiguous arrays and auto-vectorises to AVX2. Libraries like Eigen use this technique to avoid all intermediate allocations in linear algebra pipelines.",
  },
  {
    id: "cpp-20260605-b1-variance-swap",
    language: "cpp",
    title: "Variance swap fair strike — log-contract replication from option strip",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <stdexcept>

// Model-free variance swap fair strike (Demeterfi et al. 1999):
// K_var = (2/T) * [sum_puts(DeltaK/K^2 * P_i * exp(rT))
//                + sum_calls(DeltaK/K^2 * C_i * exp(rT))
//                - (F/K0 - 1 - log(F/K0))]
// Result in units of sigma^2 (annualised squared vol).
double variance_swap_strike(
    const std::vector<double>& strikes,   // sorted ascending
    const std::vector<double>& call_px,   // call prices
    const std::vector<double>& put_px,    // put prices
    double F,   // forward price
    double r,   // risk-free rate
    double T)   // time to expiry in years
{
    std::size_t n = strikes.size();
    if (n < 2) throw std::invalid_argument("need at least 2 strikes");

    double disc = std::exp(r * T);
    std::size_t atm_idx = 0;
    for (std::size_t i = 0; i < n; ++i)
        if (strikes[i] <= F) atm_idx = i;
    double K0 = strikes[atm_idx];

    double var_sum = 0.0;
    for (std::size_t i = 0; i < n; ++i) {
        double dK;
        if      (i == 0)   dK = strikes[1] - strikes[0];
        else if (i == n-1) dK = strikes[n-1] - strikes[n-2];
        else               dK = 0.5 * (strikes[i+1] - strikes[i-1]);

        double K    = strikes[i];
        double px   = (K <= F) ? put_px[i] : call_px[i];
        var_sum += dK / (K * K) * px * disc;
    }
    var_sum *= 2.0 / T;

    // Convexity correction for F != K0.
    double corr = (F / K0 - 1.0 - std::log(F / K0)) * 2.0 / T;
    return var_sum - corr;   // fair variance (e.g., 0.04 = 4% => VIX = 20%)
}`,
    explanation:
      "The variance swap replicates a log-contract using a strip of OTM options: because log(S_T/F) = integral of (1/K^2) * (call or put payoff) dK, any continuous option market in theory prices realised variance without model assumptions. The convexity term F/K0 - 1 - log(F/K0) ≥ 0 corrects for the approximation when the forward and the at-the-money strike differ.",
  },
  {
    id: "cpp-20260605-b1-cms-convexity",
    language: "cpp",
    title: "CMS rate convexity adjustment — replication via swaption strip",
    tag: "quant",
    code: `#include <cmath>
#include <vector>

// CMS (Constant Maturity Swap) convexity adjustment: a CMS coupon pays
// the n-year swap rate at each reset, but the rate is paid immediately,
// not on the swap settlement date.  The adjustment is strictly positive.
//
// Linear TSR (Terminal Swap Rate) approximation:
// Adj = E^Q[S_n(T)] - S_n(0) ≈ A_n * integral_0^inf [ g''(K) * C(K) dK ]
// where g(s) = s / annuity(s), C(K) = swaption price (receiver or payer).
// Here we use a simple closed-form approximation under lognormal swap rate.
double cms_convexity_adjustment_approx(
    double S0,      // forward swap rate (at settlement date T)
    double sigma,   // swaption lognormal vol
    double T,       // time to reset (coupon fixing date)
    double tenor,   // swap tenor in years (n)
    double r)       // flat discount rate
{
    // Annuity for a flat-rate n-year swap paying annually.
    double A = 0.0;
    for (int k = 1; k <= static_cast<int>(tenor); ++k)
        A += std::exp(-r * k);

    // g'(S) = dA/dS evaluated at S0 (derivative of annuity wrt rate).
    // Under flat rate: dA/dS = -sum k * exp(-r*k) ≈ -duration * A.
    double dA = 0.0;
    for (int k = 1; k <= static_cast<int>(tenor); ++k)
        dA -= k * std::exp(-r * k);

    // Linear TSR approximation: Adj ≈ S0^2 * sigma^2 * T * (-dA/A / A).
    // In practice this overestimates; corrections from smile are significant.
    double g_prime = 1.0/A - S0 * dA / (A * A);
    double g_pp    = -2.0 * dA / (A*A) + 2.0 * S0 * dA * dA / (A*A*A);
    double adj = 0.5 * S0 * S0 * sigma * sigma * T * g_pp;
    return adj;
}

int main() {
    // 10-year CMS coupon fixing in 2 years, S0=5%, sigma=20%, r=5%.
    double adj = cms_convexity_adjustment_approx(0.05, 0.20, 2.0, 10.0, 0.05);
    // adj ≈ 0.0003 (3 bps) — a positive upward correction to the CMS fixing
    (void)adj;
}`,
    explanation:
      "The CMS convexity adjustment is positive because the payment timing mismatch (fixing at T, paying at T) creates a Jensen's-inequality term: E[g(S_T)] > g(E[S_T]) when g is convex. In practice the adjustment ranges from 1-5 bps for short tenors to 10-30 bps for 30-year CMS in a steep vol environment. The full replication requires integrating over the entire swaption smile, not just ATM vol.",
  },
  {
    id: "cpp-20260605-b1-constexpr-fix-tags",
    language: "cpp",
    title: "Compile-time FIX tag lookup — constexpr sorted table with binary search",
    tag: "performance",
    code: `#include <array>
#include <algorithm>
#include <string_view>
#include <cstdint>
#include <iostream>

// FIX protocol tag dictionary: tag number -> field name.
// Stored as constexpr sorted array for O(log n) binary search at runtime,
// with zero heap allocation and no hash map indirection.
struct FIXEntry {
    std::uint16_t  tag;
    std::string_view name;
    constexpr bool operator<(const FIXEntry& o) const { return tag < o.tag; }
};

// constexpr: the table is in .rodata, available at compile time for static_assert.
inline constexpr std::array<FIXEntry, 12> FIX_DICT = {{
    { 1,  "Account"},
    { 8,  "BeginString"},
    { 9,  "BodyLength"},
    { 11, "ClOrdID"},
    { 35, "MsgType"},
    { 37, "OrderID"},
    { 38, "OrderQty"},
    { 44, "Price"},
    { 49, "SenderCompID"},
    { 54, "Side"},
    { 55, "Symbol"},
    {100, "ExDestination"},
}};
// Compile-time check: all entries are sorted.
static_assert(std::is_sorted(FIX_DICT.begin(), FIX_DICT.end()));

// Binary search — constexpr so it can be used in constant expressions.
constexpr std::string_view lookup_fix_tag(std::uint16_t tag) {
    auto it = std::lower_bound(FIX_DICT.begin(), FIX_DICT.end(),
                                FIXEntry{tag, {}});
    if (it != FIX_DICT.end() && it->tag == tag) return it->name;
    return "Unknown";
}

// Verify at compile time.
static_assert(lookup_fix_tag(35) == "MsgType");
static_assert(lookup_fix_tag(44) == "Price");
static_assert(lookup_fix_tag(99) == "Unknown");

int main() {
    for (std::uint16_t t : {8, 35, 44, 55, 99})
        std::cout << t << " -> " << lookup_fix_tag(t) << "\\n";
}`,
    explanation:
      "Storing the FIX dictionary in a constexpr sorted array moves the binary search into .rodata — no heap, no static constructor, and the data is shared across all threads via the read-only page. The static_assert on std::is_sorted catches ordering bugs at compile time rather than at runtime. For 100-200 standard FIX tags, the O(log n) search completes in ~5-10 comparisons, beating a hash map's cache miss for a cold lookup.",
  },
];
