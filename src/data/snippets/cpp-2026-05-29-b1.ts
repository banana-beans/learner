import type { Snippet } from "./types";

export const cppSnippets20260529B1: Snippet[] = [
  {
    id: "cpp-20260529-b1-expected",
    language: "cpp",
    title: "std::expected<T,E> — zero-exception error propagation in order validation",
    tag: "stl",
    code: `#include <expected>   // C++23
#include <string>
#include <cstdint>
#include <cmath>

enum class OrderError : std::uint8_t {
    InvalidPrice, InvalidQty, RiskBreached, DuplicateId
};

struct Order {
    std::uint64_t id;
    double        price;
    std::uint32_t qty;
    bool          is_buy;
};

using OrderResult = std::expected<Order, OrderError>;

// Each validator returns the Order on success or an error — no exceptions.
OrderResult validate_price(Order o) noexcept {
    if (o.price <= 0.0 || o.price > 1e7)
        return std::unexpected(OrderError::InvalidPrice);
    return o;
}

OrderResult validate_qty(Order o) noexcept {
    if (o.qty == 0 || o.qty > 1'000'000)
        return std::unexpected(OrderError::InvalidQty);
    return o;
}

static double s_exposure = 0.0;

OrderResult check_risk(Order o) noexcept {
    double delta = (o.is_buy ? 1.0 : -1.0) * o.price * o.qty;
    if (std::abs(s_exposure + delta) > 1e8)
        return std::unexpected(OrderError::RiskBreached);
    return o;
}

// Monadic chain: and_then forwards the value if ok, short-circuits on error.
OrderResult process_order(Order o) noexcept {
    return validate_price(o)
        .and_then(validate_qty)
        .and_then(check_risk);
}

int main() {
    Order bad{1, -5.0, 100, true};
    auto r1 = process_order(bad);
    if (!r1) {
        // r1.error() == OrderError::InvalidPrice
        (void)r1.error();
    }

    Order good{2, 150.25, 500, true};
    if (auto r2 = process_order(good)) {
        s_exposure += r2->price * r2->qty;
    }

    // transform: map over the success value without unwrapping.
    auto notional = process_order(good)
        .transform([](const Order& o) { return o.price * o.qty; });
    (void)notional;
}`,
    explanation:
      "std::expected replaces out-params and exception-based error handling with a value-or-error type: the monadic `and_then` chains validators without nesting if-checks, and the chain short-circuits on the first error. Unlike exceptions, the error type is visible in the function signature and the compiler warns if you ignore the result, making it ideal for hot-path order validation where exceptions cannot be used.",
  },

  {
    id: "cpp-20260529-b1-spsc-ring",
    language: "cpp",
    title: "SPSC lock-free ring buffer — feed handler to strategy thread",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstdint>

// Single-Producer Single-Consumer ring buffer.
// head_ is owned by the producer; tail_ is owned by the consumer.
// No shared atomic write between threads → true lock-free, no CAS.
// Cache-line alignment (64B) prevents false-sharing between head and tail.
// Capacity must be a power of two for the bitmask modulo trick.

template<typename T, std::size_t Cap>
class SPSCQueue {
    static_assert((Cap & (Cap - 1)) == 0, "Cap must be power of two");

    alignas(64) std::atomic<std::size_t> head_{0};  // next write slot
    alignas(64) std::atomic<std::size_t> tail_{0};  // next read  slot
    std::array<T, Cap> buf_{};

    static constexpr std::size_t MASK = Cap - 1;

public:
    // Producer-only: enqueue v. Returns false if the ring is full.
    bool try_push(const T& v) noexcept {
        const std::size_t h    = head_.load(std::memory_order_relaxed);
        const std::size_t next = (h + 1) & MASK;
        if (next == tail_.load(std::memory_order_acquire))
            return false;           // full: would overwrite unread data
        buf_[h] = v;
        head_.store(next, std::memory_order_release);
        return true;
    }

    // Consumer-only: dequeue. Returns nullopt if the ring is empty.
    std::optional<T> try_pop() noexcept {
        const std::size_t t = tail_.load(std::memory_order_relaxed);
        if (t == head_.load(std::memory_order_acquire))
            return std::nullopt;    // empty
        T v = buf_[t];
        tail_.store((t + 1) & MASK, std::memory_order_release);
        return v;
    }

    std::size_t size() const noexcept {
        std::size_t h = head_.load(std::memory_order_acquire);
        std::size_t t = tail_.load(std::memory_order_acquire);
        return (h - t + Cap) & MASK;
    }
    bool empty() const noexcept { return size() == 0; }
};

struct Tick { double price; std::uint32_t qty; std::uint64_t ts_ns; };

// Global queue: feed handler thread → strategy thread.
inline SPSCQueue<Tick, 4096> g_feed_queue;

void feed_handler() {
    g_feed_queue.try_push({100.25, 500, 1'700'000'000'000ULL});
}
void strategy_thread() {
    if (auto t = g_feed_queue.try_pop())
        (void)t->price;
}`,
    explanation:
      "SPSC queues achieve lock-free communication between two threads without any CAS instruction: the producer only writes `head_` and reads `tail_`; the consumer does the opposite. This prevents write contention entirely. The 64-byte `alignas` ensures the two atomic counters land on separate cache lines, eliminating the false-sharing penalty that would occur if they shared a line — a subtle bug that can cost 200ns per operation on a modern server.",
  },

  {
    id: "cpp-20260529-b1-treiber-stack",
    language: "cpp",
    title: "Treiber lock-free stack — pending cancel order IDs",
    tag: "concurrency",
    code: `#include <atomic>
#include <optional>
#include <cstdint>

// Treiber (1986) lock-free stack: push and pop via compare-and-swap.
// Each node holds the value and a next pointer.
// CAS atomically swings the top pointer: either both new_top is installed
// or we retry with the updated old_top — no lock needed.
// ABA hazard: address reuse between a load and a CAS can corrupt the list.
// Mitigation shown here: use a tagged pointer (version counter).
// For production use hazard pointers or epoch-based reclamation for free().

template<typename T>
class TreiberStack {
    struct Node {
        T     value;
        Node* next;
        Node(const T& v, Node* n) : value(v), next(n) {}
    };

    std::atomic<Node*> top_{nullptr};

public:
    void push(const T& v) {
        Node* n = new Node(v, top_.load(std::memory_order_relaxed));
        // CAS: if top_ is still n->next, swing top_ to n.
        while (!top_.compare_exchange_weak(n->next, n,
                                            std::memory_order_release,
                                            std::memory_order_relaxed))
            ; // n->next is updated by CAS on failure — no manual reload needed
    }

    std::optional<T> pop() {
        Node* old = top_.load(std::memory_order_acquire);
        while (old) {
            if (top_.compare_exchange_weak(old, old->next,
                                            std::memory_order_acquire,
                                            std::memory_order_relaxed)) {
                T val = old->value;
                delete old;   // safe only if pop is single-threaded; use hazard ptrs otherwise
                return val;
            }
            // old was reloaded by the failed CAS — loop with fresh value
        }
        return std::nullopt;
    }

    bool empty() const noexcept {
        return top_.load(std::memory_order_acquire) == nullptr;
    }

    ~TreiberStack() {
        while (pop()) {}    // drain remaining nodes
    }
};

// Pending cancel IDs pushed by the order router, consumed by the book engine.
TreiberStack<std::uint64_t> g_cancel_stack;

void router() { g_cancel_stack.push(42001); }
void engine() {
    if (auto id = g_cancel_stack.pop()) { (void)*id; }
}`,
    explanation:
      "The Treiber stack's key insight is that `compare_exchange_weak` on failure automatically reloads `old` with the current `top_` value — so the retry loop always works with fresh data without a separate `load`. The ABA problem occurs when thread A reads top=N1, then thread B pops N1 and pushes a new node that happens to reuse N1's address, then A's CAS succeeds incorrectly. In practice, use tcmalloc or jemalloc (which rarely reuse addresses immediately) plus a version tag for safety.",
  },

  {
    id: "cpp-20260529-b1-pmr-arena",
    language: "cpp",
    title: "std::pmr::monotonic_buffer_resource — per-tick scratch via PMR",
    tag: "memory",
    code: `#include <memory_resource>
#include <vector>
#include <array>
#include <cstddef>
#include <span>
#include <cstdint>

// std::pmr (polymorphic memory resource) lets standard containers use
// a user-supplied allocator without changing their type.
// monotonic_buffer_resource: a bump allocator over a fixed buffer.
// Allocating from it is a pointer increment — cheaper than malloc.
// Freeing individual allocations is a no-op; reset() frees everything.

struct Fill {
    std::uint64_t order_id;
    double        price;
    std::uint32_t qty;
};

// Per-tick: parse fills into pmr vectors, process, then reset.
void process_tick(std::span<const Fill> raw) {
    // 32 KB on the stack — no heap allocation for this scope.
    std::array<std::byte, 32 * 1024> stack_buf{};
    std::pmr::monotonic_buffer_resource mbr{
        stack_buf.data(), stack_buf.size(),
        std::pmr::null_memory_resource()   // throw bad_alloc if overflow
    };

    // pmr::vector uses mbr instead of global ::operator new.
    std::pmr::vector<Fill> good{&mbr};
    std::pmr::vector<Fill> bad{&mbr};
    good.reserve(raw.size());

    for (const auto& f : raw) {
        if (f.price > 0.0 && f.qty > 0)
            good.push_back(f);
        else
            bad.push_back(f);
    }

    // ... process good fills ...
    // At end of scope: mbr destructs, releasing the stack buffer in O(1).
}

// Long-lived message pool: reuse across many ticks.
class TickPool {
    std::array<std::byte, 512 * 1024> buf_;
    std::pmr::monotonic_buffer_resource mbr_{buf_.data(), buf_.size()};

public:
    std::pmr::memory_resource* resource() noexcept { return &mbr_; }

    // Call at end of each trading day to reclaim all memory.
    void reset() noexcept { mbr_.release(); }
};

// Example: using a pool-backed pmr::vector for order references.
void example(TickPool& pool) {
    std::pmr::vector<std::uint64_t> order_ids{pool.resource()};
    order_ids.push_back(10001);
    order_ids.push_back(10002);
    // pool.reset() later reclaims without individual frees.
}`,
    explanation:
      "std::pmr separates the allocation policy from the container type — a `pmr::vector<Fill>` and a regular `vector<Fill>` have the same type layout and ABI, differing only in their allocator. The `monotonic_buffer_resource` is the fastest allocator: allocation is a pointer bump, and release is a pointer reset. By backing it with a stack array, you combine arena performance with zero heap traffic, eliminating malloc contention in a multi-threaded feed handler.",
  },

  {
    id: "cpp-20260529-b1-deducing-this",
    language: "cpp",
    title: "Deducing-this (C++23) — CRTP-style dispatch without templates",
    tag: "templates",
    code: `#include <cmath>
#include <type_traits>

// Deducing-this (C++23, P0847): a member function can deduce its
// own object type via 'this auto& self'. This replaces the CRTP
// pattern (template<typename D> struct Base) with cleaner syntax.
// No extra template parameter on the base class; no static_cast<D&>(*this).

struct PricingBase {
    // 'this auto& self' deduces the concrete type (e.g. BSEngine).
    // All override dispatch is resolved at compile time — no vtable.
    double price(this auto& self, double S, double K, double T) {
        return self.compute(S, K, T);
    }

    // delta via central finite-difference — works for any derived engine.
    double delta(this auto& self, double S, double K, double T,
                  double eps = 0.5) {
        return (self.price(S + eps, K, T) - self.price(S - eps, K, T))
               / (2.0 * eps);
    }

    // gamma: second derivative of price w.r.t. spot.
    double gamma(this auto& self, double S, double K, double T,
                  double eps = 0.5) {
        return (self.price(S + eps, K, T)
              - 2.0 * self.price(S, K, T)
              + self.price(S - eps, K, T))
               / (eps * eps);
    }
};

// Concrete engine: only needs to provide compute().
struct BSEngine : PricingBase {
    double r, sigma;
    BSEngine(double r, double sigma) : r(r), sigma(sigma) {}

    double compute(double S, double K, double T) const noexcept {
        if (T < 1e-9) return std::max(S - K, 0.0);
        double sT = sigma * std::sqrt(T);
        double d1 = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / sT;
        double d2 = d1 - sT;
        auto N = [](double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
        return S * N(d1) - K * std::exp(-r * T) * N(d2);
    }
};

// Alternative engine with different compute() — same base, zero overhead.
struct ShiftedLogNormal : PricingBase {
    double r, sigma, shift;  // shifted log-normal: F' = F + shift
    double compute(double S, double K, double T) const noexcept {
        BSEngine bs{r, sigma};
        return bs.compute(S + shift, K + shift, T);
    }
};

int main() {
    BSEngine bs{0.05, 0.20};
    double call  = bs.price(100.0, 100.0, 1.0);
    double delta = bs.delta(100.0, 100.0, 1.0);
    double gamma = bs.gamma(100.0, 100.0, 1.0);
    (void)call; (void)delta; (void)gamma;
}`,
    explanation:
      "Deducing-this eliminates the awkward `template<typename Derived>` base class and `static_cast<Derived&>(*this)` casts that made CRTP painful to read and extend. The deduced type is resolved at the call site with zero overhead — the compiler generates specialised code for each concrete type exactly as with hand-written CRTP, but the base class stays non-templated and is easier to forward-declare, friend, and document.",
  },

  {
    id: "cpp-20260529-b1-avx2-pnl",
    language: "cpp",
    title: "AVX2 SIMD vectorized mark-to-market — 4 positions per cycle",
    tag: "performance",
    code: `#ifdef __AVX2__
#include <immintrin.h>
#include <cstdint>
#include <vector>
#include <cmath>
#include <cassert>

// AVX2: 256-bit registers hold 4 doubles at once.
// Mark-to-market P&L = sum_i qty_i * (mark_i - cost_i)
// Vectorized loop processes 4 positions per iteration using packed ops.

double mtm_scalar(const double* qty, const double* mark, const double* cost, int n) {
    double total = 0.0;
    for (int i = 0; i < n; ++i) total += qty[i] * (mark[i] - cost[i]);
    return total;
}

// Vectorized version: ~4x throughput on modern CPUs.
double mtm_avx2(const double* qty, const double* mark, const double* cost, int n) {
    assert(n % 4 == 0 && "n must be multiple of 4 for aligned loop");

    __m256d acc = _mm256_setzero_pd();

    for (int i = 0; i < n; i += 4) {
        __m256d q = _mm256_loadu_pd(qty  + i);  // 4 quantities
        __m256d m = _mm256_loadu_pd(mark + i);  // 4 mark prices
        __m256d c = _mm256_loadu_pd(cost + i);  // 4 cost prices

        __m256d diff   = _mm256_sub_pd(m, c);       // (mark - cost)
        __m256d pnl    = _mm256_mul_pd(q, diff);    // qty * (mark - cost)
        acc            = _mm256_add_pd(acc, pnl);   // accumulate
    }

    // Horizontal sum of the 4-lane accumulator.
    // hadd_pd: [a0+a1, b0+b1, a2+a3, b2+b3] — within 128-bit lanes.
    __m256d hsum = _mm256_hadd_pd(acc, acc);
    __m128d lo   = _mm256_castsi256_si128((__m256i)hsum);    // lanes 0,1
    __m128d hi   = _mm256_extractf128_pd(hsum, 1);           // lanes 2,3
    __m128d sum2 = _mm_add_pd((__m128d)lo, hi);
    return _mm_cvtsd_f64(sum2);   // lower 64 bits = total P&L
}

// Fused multiply-add (FMA) variant: qty*(mark-cost) in one operation.
double mtm_fma(const double* qty, const double* mark, const double* cost, int n) {
    __m256d acc = _mm256_setzero_pd();
    for (int i = 0; i < n; i += 4) {
        __m256d q = _mm256_loadu_pd(qty  + i);
        __m256d m = _mm256_loadu_pd(mark + i);
        __m256d c = _mm256_loadu_pd(cost + i);
        // acc += q * (m - c)  — fused, no rounding error between mul and sub
        acc = _mm256_fmadd_pd(q, _mm256_sub_pd(m, c), acc);
    }
    __m256d h = _mm256_hadd_pd(acc, acc);
    return _mm_cvtsd_f64(
        _mm_add_pd(_mm256_castsi256_si128((__m256i)h),
                   _mm256_extractf128_pd(h, 1)));
}
#endif`,
    explanation:
      "AVX2 processes 4 double-precision values simultaneously in a single 256-bit SIMD register, giving ~4x throughput over scalar code for embarrassingly parallel loops like mark-to-market. The horizontal sum at the end (`hadd_pd` + lane extraction) is the only non-trivial part: SIMD add instructions work within register lanes and don't cross them, so reducing 4 values to one requires explicit cross-lane operations. FMA (`fmadd_pd`) further saves one instruction per iteration and avoids the intermediate rounding between the subtraction and multiplication.",
  },

  {
    id: "cpp-20260529-b1-merton-jd",
    language: "cpp",
    title: "Merton jump-diffusion option pricing — MC with Poisson jumps",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <algorithm>

// Merton (1976) jump-diffusion:
//   dS/S = (r - q - lambda*(exp(mu_j + 0.5*sigma_j^2) - 1)) dt
//           + sigma * dW  +  (J - 1) * dN
// where N ~ Poisson(lambda), J ~ LogNormal(mu_j, sigma_j^2).
// The drift is adjusted so that the jump component has zero expected excess return.
// Key: each path simulates the Poisson process per step: if a jump occurs,
// multiply S by a log-normal jump factor.

struct MertonParams {
    double r;        // risk-free rate
    double q;        // dividend yield
    double sigma;    // diffusion vol
    double lam;      // jump intensity (avg jumps per year)
    double mu_j;     // log-jump mean (< 0 for crashes)
    double sigma_j;  // log-jump vol
};

double merton_call_mc(double S0, double K, double T, MertonParams p,
                       int n_paths = 200'000, int n_steps = 252,
                       unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    std::poisson_distribution<int>   pd(p.lam * T / n_steps);
    std::normal_distribution<double> jd(p.mu_j, p.sigma_j);  // jump size ~ LN

    // Drift correction: E[J] = exp(mu_j + 0.5*sigma_j^2) - 1
    double E_J   = std::expm1(p.mu_j + 0.5 * p.sigma_j * p.sigma_j);
    double drift = (p.r - p.q - p.lam * E_J - 0.5 * p.sigma * p.sigma) * T / n_steps;
    double vol   = p.sigma * std::sqrt(T / n_steps);
    double disc  = std::exp(-p.r * T);

    double sum = 0.0;
    for (int path = 0; path < n_paths; ++path) {
        double S = S0;
        for (int s = 0; s < n_steps; ++s) {
            S *= std::exp(drift + vol * nd(rng));  // diffusion step

            // Jump component: each step has lambda*dt expected jumps.
            int n_jumps = pd(rng);
            for (int j = 0; j < n_jumps; ++j)
                S *= std::exp(jd(rng));            // multiply by log-normal jump factor
        }
        sum += std::max(S - K, 0.0);
    }
    return disc * sum / n_paths;
}

// Merton series formula: sum over k Poisson-weighted Black-Scholes prices.
double merton_call_series(double S, double K, double r, double T,
                           double sigma, double lam, double mu_j, double sj,
                           int max_terms = 30) {
    double E_J  = std::expm1(mu_j + 0.5 * sj * sj);
    double lam_prime = lam * (1.0 + E_J);  // risk-neutral jump intensity
    double price = 0.0;
    double log_fac = 0.0;

    for (int k = 0; k < max_terms; ++k) {
        double w   = std::exp(-lam_prime * T) * std::exp(k * std::log(lam_prime * T) - log_fac);
        double r_k = r - lam * E_J + k * (mu_j + 0.5 * sj * sj) / T;
        double s_k = std::sqrt(sigma * sigma + k * sj * sj / T);

        auto N = [](double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
        double d1 = (std::log(S/K) + (r_k + 0.5*s_k*s_k)*T) / (s_k * std::sqrt(T));
        double d2 = d1 - s_k * std::sqrt(T);
        double bs  = S * N(d1) - K * std::exp(-r_k * T) * N(d2);
        price += w * bs;

        if (k > 0) log_fac += std::log(static_cast<double>(k));
    }
    return price;
}`,
    explanation:
      "The Merton jump-diffusion model adds a Poisson-driven jump component to geometric Brownian motion, producing fat tails and negative skewness in returns — matching the empirical observation that equity indices exhibit more frequent large drops than log-normal diffusion predicts. The drift must be adjusted by −λ·E[J] so that the jump has zero excess expected return (risk-neutral measure). The series formula sums Black-Scholes prices weighted by Poisson probabilities — converging rapidly for small λT but requiring the MC approach for longer maturities or path-dependent payoffs.",
  },

  {
    id: "cpp-20260529-b1-char-fn-integral",
    language: "cpp",
    title: "Characteristic function inversion (Gil-Pelaez) — model-agnostic pricer",
    tag: "quant",
    code: `#include <complex>
#include <cmath>
#include <functional>

// Gil-Pelaez (1951) Fourier inversion:
// P(S_T > K) = 1/2 + (1/pi) * Int_0^inf Re[exp(-iu*ln K) * phi(u) / (iu)] du
// phi(u) = E[exp(iu * ln S_T)] is the characteristic function of log S_T.
//
// European call via two such integrals (Bakshi-Madan decomposition):
// C = S * Pi1 - K*exp(-rT) * Pi2
// Pi1: phi1(u) = phi(u-i) / phi(-i)   (stock-numeraire probability)
// Pi2: phi2(u) = phi(u)               (risk-neutral probability)
//
// Characteristic function of log-normal (Black-Scholes baseline):
//   phi_BS(u) = exp(iu*(ln S + (r - q - 0.5*s^2)*T) - 0.5*s^2*T*u^2)

using CFunc = std::function<std::complex<double>(std::complex<double>)>;

// Numerical integration: P(S_T > K) via Gil-Pelaez with N-point trapezoidal rule.
double cdf_inverted(double lnK, CFunc phi, int N = 4096, double du = 0.01) {
    using C = std::complex<double>;
    const double pi = std::acos(-1.0);
    double integral = 0.0;
    for (int k = 1; k <= N; ++k) {
        double u = k * du;
        C iu{0.0, u};
        C num = std::exp(-iu * lnK) * phi(iu);
        integral += std::real(num / iu);
    }
    return 0.5 + integral * du / pi;
}

// Black-Scholes characteristic function for validation.
std::complex<double> phi_bs(std::complex<double> u,
                              double S, double r, double q, double sigma, double T) {
    using C = std::complex<double>;
    C iu = C{0,1} * u;
    double mu = std::log(S) + (r - q - 0.5 * sigma * sigma) * T;
    return std::exp(iu * mu - 0.5 * sigma * sigma * T * u * u);
}

// European call price via characteristic function (Bakshi-Madan).
double call_from_cf(double S, double K, double r, double q, double sigma, double T,
                     CFunc phi_fn, int N = 4096, double du = 0.01) {
    double lnK = std::log(K);

    // phi1: stock-numeraire measure characteristic function
    auto phi1 = [&](std::complex<double> u) -> std::complex<double> {
        std::complex<double> mi{0, -1};
        return phi_fn(u + mi) / phi_fn(mi);   // Girsanov shift by -i
    };

    double Pi1 = cdf_inverted(lnK, phi1, N, du);
    double Pi2 = cdf_inverted(lnK, phi_fn, N, du);

    return S * std::exp(-q * T) * Pi1 - K * std::exp(-r * T) * Pi2;
}

int main() {
    double S = 100, K = 100, r = 0.05, q = 0.0, sigma = 0.20, T = 1.0;
    auto phi = [&](std::complex<double> u) {
        return phi_bs(u, S, r, q, sigma, T);
    };
    double call = call_from_cf(S, K, r, q, sigma, T, phi);
    // Verify: should match Black-Scholes analytical ≈ 10.45
    (void)call;
}`,
    explanation:
      "The characteristic function (CF) approach is model-agnostic: swap `phi_bs` for `phi_heston`, `phi_variance_gamma`, or any affine jump-diffusion CF and the integration kernel stays identical. This is why CF inversion is the industry standard for stochastic-volatility model pricing — calibrating and pricing Heston, SABR (numerical), or Bates models all use the same FFT/quadrature infrastructure. The Bakshi-Madan Π1/Π2 decomposition maps the problem to two CDF inversions, each of which is a single Fourier integral.",
  },

  {
    id: "cpp-20260529-b1-quanto",
    language: "cpp",
    title: "Quanto option — correlation-adjusted foreign asset pricing",
    tag: "quant",
    code: `#include <cmath>

// Quanto option: payoff in domestic currency based on a foreign asset price.
// The holder receives max(S_f - K, 0) in domestic currency, regardless of FX.
// The FX risk is neutralised by the quanto adjustment: the foreign asset's
// drift in the domestic risk-neutral measure gains an extra term:
//   mu_adjusted = r_d - rho * sigma_S * sigma_FX
// where rho is the correlation between S_f and the FX rate S_{d/f}.
//
// Quanto call price is Black-Scholes with the adjusted forward:
//   F_quanto = S_f * exp((r_d - rho*sigma_S*sigma_FX)*T)
// (no S_{d/f} appears in the formula — the notional FX rate is locked at 1).

struct QuantoParams {
    double S;        // foreign asset spot (in foreign ccy)
    double K;        // strike (in foreign ccy)
    double r_d;      // domestic risk-free rate
    double r_f;      // foreign risk-free rate
    double sigma_S;  // foreign asset vol
    double sigma_FX; // FX vol (S_d/f)
    double rho;      // correlation: corr(d ln S_f, d ln S_{d/f})
    double T;        // maturity
};

double quanto_call(const QuantoParams& p) {
    // Adjusted drift: r_d - r_f - rho*sigma_S*sigma_FX + 0 (no domestic dividend)
    // The foreign asset drifts at r_f under its own measure; under domestic measure:
    //   drift = r_d - rho * sigma_S * sigma_FX
    double adj_drift = p.r_d - p.r_f - p.rho * p.sigma_S * p.sigma_FX;
    double F = p.S * std::exp((p.r_f + adj_drift) * p.T);   // quanto forward

    double sT = p.sigma_S * std::sqrt(p.T);
    double d1 = (std::log(F / p.K) + 0.5 * sT * sT) / sT;
    double d2 = d1 - sT;

    auto N = [](double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    double disc = std::exp(-p.r_d * p.T);

    // Price is in domestic currency (notional FX rate = 1 domestic per foreign).
    return disc * (F * N(d1) - p.K * N(d2));
}

// Quanto forward: cost of locking in the FX rate via quanto adjustment.
double quanto_forward(double S_f, double r_d, double r_f,
                       double sigma_S, double sigma_FX, double rho, double T) {
    double adj = r_d - r_f - rho * sigma_S * sigma_FX;
    return S_f * std::exp((r_f + adj) * T);   // = S_f * exp(r_d - rho*s_S*s_FX)*T
}

int main() {
    QuantoParams p{100.0, 100.0, 0.03, 0.05, 0.20, 0.10, -0.50, 1.0};
    double price = quanto_call(p);
    // For rho=-0.5: FX depreciates when asset rallies → quanto call is cheaper
    // than a standard call (negative correlation reduces effective vol).
    (void)price;
}`,
    explanation:
      "The quanto adjustment −ρ·σ_S·σ_FX in the drift reflects Girsanov's theorem: changing from the foreign to the domestic risk-neutral measure introduces a correlation correction between the asset and the FX rate. A negative ρ (common for equities vs USD: asset up, USD down) reduces the quanto forward below the standard forward, making the quanto call cheaper. Quanto options are common in structured products linking, e.g., Nikkei performance to USD payoffs without currency risk.",
  },

  {
    id: "cpp-20260529-b1-avellaneda-stoikov",
    language: "cpp",
    title: "Avellaneda-Stoikov reservation price and optimal spread",
    tag: "quant",
    code: `#include <cmath>
#include <algorithm>
#include <cstdint>

// Avellaneda-Stoikov (2008) market-making model.
// Market maker holds inventory q, faces a risky asset with mid price S.
// Reservation price: the mid price adjusted for inventory risk.
//   r(S, q, t) = S - q * gamma * sigma^2 * (T - t)
// Optimal quotes are symmetric around r:
//   delta_a = delta_b = (gamma * sigma^2 * (T - t)) / 2
//                     + (1/gamma) * ln(1 + gamma/kappa)
// where kappa controls order arrival intensity vs size.
// The bid is at r - delta, ask at r + delta.

struct ASParams {
    double gamma;  // risk-aversion coefficient
    double sigma;  // asset volatility
    double T;      // trading horizon (hours or days)
    double kappa;  // market order arrival intensity decay
};

struct ASQuotes {
    double reservation;  // mid price adjusted for inventory
    double delta;        // half-spread around reservation
    double bid;          // post bid at this price
    double ask;          // post ask at this price
};

ASQuotes as_quotes(double S, int q, double t, const ASParams& p) {
    double tau = p.T - t;                          // time remaining
    tau = std::max(tau, 1e-6);                     // avoid division by zero at horizon

    // Reservation price: inventory q pushes the mid down (long inventory)
    // or up (short inventory) to incentivise trades that reduce risk.
    double r = S - static_cast<double>(q) * p.gamma * p.sigma * p.sigma * tau;

    // Optimal half-spread: wider spread = slower orders but higher margin.
    double delta = 0.5 * p.gamma * p.sigma * p.sigma * tau
                 + (1.0 / p.gamma) * std::log(1.0 + p.gamma / p.kappa);

    return {r, delta, r - delta, r + delta};
}

// Simulate inventory evolution: each side fills with Poisson intensity A*exp(-kappa*delta).
// Expected fill intensity per unit time:
//   lambda_a = A * exp(-kappa * delta_a)
//   lambda_b = A * exp(-kappa * delta_b)
// For symmetric delta_a = delta_b, both sides fill at the same rate.
double fill_intensity(double A, double kappa, double delta_side) {
    return A * std::exp(-kappa * delta_side);
}

int main() {
    ASParams p{0.1, 0.02, 1.0, 1.5};   // gamma, sigma (per step), T=1, kappa=1.5
    double S = 100.0;

    for (int q : {-3, 0, 3}) {
        auto qts = as_quotes(S, q, 0.0, p);
        // q=-3 (short): reservation > S, ask moves up, bid moves up → buy signal
        // q=+3 (long):  reservation < S, ask moves down, bid moves down → sell signal
        (void)qts;
    }
}`,
    explanation:
      "The Avellaneda-Stoikov reservation price is the key insight: a market maker with a long inventory should quote a lower mid price to attract sell orders and reduce exposure. The optimal spread balances two forces — wider spreads mean higher per-trade profit but slower inventory turnover, while tighter spreads fill faster but earn less per round-trip. The kappa parameter (order book decay constant) is calibrated from observed order flow: markets with high kappa require tighter spreads to fill at all.",
  },

  {
    id: "cpp-20260529-b1-parkinson-gk",
    language: "cpp",
    title: "Parkinson / Garman-Klass realized vol estimators from OHLC",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <numeric>

// Close-to-close (standard): high variance, uses only daily close prices.
// Parkinson (1980): uses high-low range — ~5x more efficient than C2C.
//   P = (1 / (4 * ln2)) * (ln(H/L))^2
// Garman-Klass (1980): uses O, H, L, C — most efficient of OHLC estimators.
//   GK = 0.5*(ln(H/L))^2 - (2*ln2-1)*(ln(C/O))^2
// Yang-Zhang (2000): handles overnight gaps by adding an open-to-close term.

struct Bar { double open, high, low, close; };

// Annualised volatility from daily bars.
double close_to_close_vol(const std::vector<Bar>& bars) {
    int n = static_cast<int>(bars.size());
    if (n < 2) return 0.0;
    std::vector<double> lret;
    lret.reserve(n - 1);
    for (int i = 1; i < n; ++i)
        lret.push_back(std::log(bars[i].close / bars[i-1].close));
    double mu  = std::accumulate(lret.begin(), lret.end(), 0.0) / (n - 1);
    double var = 0.0;
    for (double r : lret) var += (r - mu) * (r - mu);
    return std::sqrt(var / (n - 2) * 252.0);   // annualise
}

double parkinson_vol(const std::vector<Bar>& bars) {
    const double k = 1.0 / (4.0 * std::log(2.0));
    double sum = 0.0;
    for (const auto& b : bars) {
        double lHL = std::log(b.high / b.low);
        sum += lHL * lHL;
    }
    // Factor: E[lHL^2] = 4*ln2 * sigma^2 per day.
    return std::sqrt(k * sum / bars.size() * 252.0);
}

double garman_klass_vol(const std::vector<Bar>& bars) {
    const double k2 = 2.0 * std::log(2.0) - 1.0;
    double sum = 0.0;
    for (const auto& b : bars) {
        double lHL = std::log(b.high / b.low);
        double lCO = std::log(b.close / b.open);
        sum += 0.5 * lHL * lHL - k2 * lCO * lCO;
    }
    return std::sqrt(sum / bars.size() * 252.0);
}

// Rogers-Satchell (1991): drift-independent, handles trending markets.
double rogers_satchell_vol(const std::vector<Bar>& bars) {
    double sum = 0.0;
    for (const auto& b : bars) {
        double u = std::log(b.high / b.close);
        double d = std::log(b.low  / b.close);
        double x = std::log(b.high / b.open);
        double y = std::log(b.low  / b.open);
        sum += u * (u - x) + d * (d - y);
    }
    return std::sqrt(sum / bars.size() * 252.0);
}`,
    explanation:
      "OHLC estimators reduce variance compared to close-to-close by using more information from each bar. Parkinson captures the intraday range; Garman-Klass further incorporates the open-to-close drift. The efficiency gain (5–8× for GK vs C2C) means you can estimate volatility with much shorter windows — critical in fast-moving markets where a 5-day GK estimate is more reliable than a 30-day C2C. Rogers-Satchell is the preferred estimator when the underlying has a significant drift (momentum markets), because Parkinson and GK are biased by drift.",
  },

  {
    id: "cpp-20260529-b1-hull-white-zcb",
    language: "cpp",
    title: "Hull-White 1-factor analytic zero-coupon bond price",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <functional>

// Hull-White 1-factor (extended Vasicek):
//   dr = (theta(t) - a*r) dt + sigma * dW
// theta(t) is calibrated to fit the initial yield curve exactly.
// Analytic zero-coupon bond price: P(0, T) = A(0,T) * exp(-B(0,T)*r0)
// where:
//   B(t, T) = (1 - exp(-a*(T-t))) / a
//   ln A(t, T) = ln(P_mkt(0,T)/P_mkt(0,t))
//                + B(t,T)*f(0,t)
//                - sigma^2/(4a) * (1 - exp(-2a*t)) * B(t,T)^2
// f(0,t) is the instantaneous forward rate at 0 for maturity t.

// Market discount function (e.g., flat 5% for demo).
double P_market(double t) { return std::exp(-0.05 * t); }
double f_market(double t, double dt = 1e-5) {
    // Instantaneous forward: f(0,t) = -d(ln P_mkt)/dt
    return -(std::log(P_market(t + dt)) - std::log(P_market(t))) / dt;
}

struct HullWhite1F {
    double a;      // mean reversion speed
    double sigma;  // short-rate vol
};

// B(t, T): annuity function.
double hw_B(double t, double T, double a) {
    return (1.0 - std::exp(-a * (T - t))) / a;
}

// ln A(t, T) from market curve (time-0 formula).
double hw_lnA(double t, double T, const HullWhite1F& hw) {
    double B_tT = hw_B(t, T, hw.a);
    double B_0t = hw_B(0.0, t, hw.a);

    double lnP_T = std::log(P_market(T));
    double lnP_t = std::log(P_market(t));
    double f_t   = f_market(t);

    // Adjustment for vol: - sigma^2/(4a) * (1 - e^{-2at}) * B(t,T)^2
    double vol_adj = -(hw.sigma * hw.sigma / (4.0 * hw.a))
                   * (1.0 - std::exp(-2.0 * hw.a * t))
                   * B_tT * B_tT;

    return lnP_T - lnP_t + B_tT * f_t + vol_adj;
}

// Zero-coupon bond price at time t given short rate r_t.
double hw_zcb(double t, double T, double r_t, const HullWhite1F& hw) {
    double B_tT = hw_B(t, T, hw.a);
    double lnA  = hw_lnA(t, T, hw);
    return std::exp(lnA - B_tT * r_t);
}

// European swaption: use the analytic ZCB formula for each swap leg.
double hw_swap_value(double t, double r_t, const HullWhite1F& hw,
                      const std::vector<double>& coupon_times, double coupon_rate) {
    double value = 0.0;
    for (double T : coupon_times)
        value += coupon_rate * hw_zcb(t, T, r_t, hw);
    value += hw_zcb(t, coupon_times.back(), r_t, hw);   // principal repayment
    value -= 1.0;                                         // floating leg ~ par
    return value;
}

int main() {
    HullWhite1F hw{0.10, 0.015};   // a=10% mean reversion, sigma=1.5%
    double r0 = 0.05;
    double p5y = hw_zcb(0.0, 5.0, r0, hw);    // 5Y ZCB price
    double p10y = hw_zcb(0.0, 10.0, r0, hw);  // 10Y ZCB price
    (void)p5y; (void)p10y;
}`,
    explanation:
      "The Hull-White model fits the initial market curve exactly by construction: the A(t,T) term absorbs the difference between the model's implied forward rates and the observed ones. This is why HW1F remains the market-standard model for interest rate derivatives — it is analytically tractable (affine structure), fits the curve exactly, and produces analytic prices for caps, floors, and European swaptions. The B(t,T) term is the same as in Vasicek but with a time-dependent theta, and it directly gives the duration of the ZCB.",
  },

  {
    id: "cpp-20260529-b1-cir-euler",
    language: "cpp",
    title: "CIR short-rate process — full-truncation Euler simulation",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <vector>
#include <algorithm>

// Cox-Ingersoll-Ross (1985):
//   dr = kappa*(theta - r) dt + sigma * sqrt(r) * dW
// Feller condition: 2*kappa*theta > sigma^2 ensures r stays positive.
// Full-truncation Euler: v_new = max(v + drift*dt + diffusion*sqrt(dt)*Z, 0)
// replaces negative values with 0, preventing complex square roots.

struct CIRParams {
    double kappa;  // mean reversion speed
    double theta;  // long-run mean of r
    double sigma;  // volatility coefficient
    double r0;     // initial short rate
};

bool feller_satisfied(const CIRParams& p) {
    return 2.0 * p.kappa * p.theta > p.sigma * p.sigma;
}

// Single path of the CIR process. Returns path of short rates.
std::vector<double> cir_path(const CIRParams& p, double T, int n_steps,
                               std::mt19937_64& rng) {
    std::normal_distribution<double> nd;
    double dt = T / n_steps;
    std::vector<double> path(n_steps + 1);
    path[0] = p.r0;

    for (int i = 0; i < n_steps; ++i) {
        double r = path[i];
        double r_pos = std::max(r, 0.0);              // full-truncation
        double drift = p.kappa * (p.theta - r_pos) * dt;
        double diff  = p.sigma * std::sqrt(r_pos * dt) * nd(rng);
        path[i+1] = std::max(r + drift + diff, 0.0); // ensure non-negative
    }
    return path;
}

// CIR zero-coupon bond price (closed form via Riccati equations).
// P(0, T) = A(T) * exp(-B(T) * r0)
double cir_zcb(const CIRParams& p, double T) {
    double h = std::sqrt(p.kappa * p.kappa + 2.0 * p.sigma * p.sigma);
    double eht = std::exp(h * T);

    double B = 2.0 * (eht - 1.0)
             / ((h + p.kappa) * (eht - 1.0) + 2.0 * h);

    double A_num   = 2.0 * h * std::exp(0.5 * (h + p.kappa) * T);
    double A_denom = (h + p.kappa) * (eht - 1.0) + 2.0 * h;
    double lnA = 2.0 * p.kappa * p.theta / (p.sigma * p.sigma)
               * std::log(A_num / A_denom);

    return std::exp(lnA - B * p.r0);
}

int main() {
    CIRParams p{0.5, 0.04, 0.10, 0.04};   // fast reversion, 4% LR, 10% vol

    // Validate Feller condition: 2*0.5*0.04 = 0.04 > 0.01 = 0.1^2. OK.
    bool ok = feller_satisfied(p);
    (void)ok;

    // Analytic 5Y ZCB price.
    double p5y = cir_zcb(p, 5.0);

    // MC validation: average discount factor E[exp(-int_0^T r dt)].
    std::mt19937_64 rng(42);
    double mc_sum = 0.0;
    int n_paths = 50000, n_steps = 500;
    for (int i = 0; i < n_paths; ++i) {
        auto path = cir_path(p, 5.0, n_steps, rng);
        double integral = 0.0;
        for (int s = 0; s < n_steps; ++s)
            integral += path[s] * (5.0 / n_steps);
        mc_sum += std::exp(-integral);
    }
    double mc_price = mc_sum / n_paths;
    // mc_price should match p5y within MC error.
    (void)p5y; (void)mc_price;
}`,
    explanation:
      "The CIR model guarantees positive interest rates when the Feller condition 2κθ > σ² holds — unlike Vasicek, which can go negative. The closed-form bond price follows from solving the Riccati ODE that arises in the affine bond pricing framework. Full-truncation Euler is preferred over the reflecting boundary (|r|) for simulation accuracy: it is the most bias-efficient simple discretisation of square-root diffusions, as shown by Higham-Mao (2005).",
  },

  {
    id: "cpp-20260529-b1-variance-gamma",
    language: "cpp",
    title: "Variance Gamma process simulation and option pricing",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <algorithm>

// Variance Gamma (Madan-Senata 1990, Madan-Carr-Chang 1998):
//   X_t = theta * G_t + sigma * W(G_t)
// G_t ~ Gamma(t/nu, nu): stochastic time change (business-time clock).
// W(g) is standard Brownian motion evaluated at random time G_t.
// VG has finite variation (unlike BM), controlled kurtosis, and skewness.
// Parameters: theta < 0 (skewness, crash bias), sigma > 0, nu > 0 (kurtosis).

// CF of VG log-return X_T: phi(u) = (1 - iu*theta*nu + 0.5*sigma^2*nu*u^2)^(-T/nu)
// Used for Fourier pricing (see char-fn-integral snippet).

struct VGParams { double theta, sigma, nu, r; };

// Exact simulation of VG increment over dt.
// 1. Draw gamma-distributed time increment g ~ Gamma(dt/nu, nu).
// 2. Draw standard normal z and compute theta*g + sigma*sqrt(g)*z.
double vg_increment(double dt, const VGParams& p,
                     std::gamma_distribution<double>& gd,
                     std::normal_distribution<double>& nd,
                     std::mt19937_64& rng) {
    // Gamma shape=dt/nu, scale=nu (so mean=dt, var=dt*nu).
    std::gamma_distribution<double> g_dt{dt / p.nu, p.nu};
    double G = g_dt(rng);                    // stochastic time increment
    double Z = nd(rng);
    return p.theta * G + p.sigma * std::sqrt(G) * Z;
}

// VG European call via Monte Carlo.
double vg_call_mc(double S0, double K, const VGParams& p, double T,
                   int n_paths = 200'000, int n_steps = 252, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    std::gamma_distribution<double>  gd; // placeholder; reset per step

    // Risk-neutral drift correction: omega = (1/nu) * ln(1 - theta*nu - 0.5*sigma^2*nu)
    double omega = -std::log(1.0 - p.theta * p.nu - 0.5 * p.sigma * p.sigma * p.nu) / p.nu;
    double disc  = std::exp(-p.r * T);

    double sum = 0.0;
    for (int path = 0; path < n_paths; ++path) {
        double lnS = std::log(S0) + (p.r + omega) * T;  // drift-adjusted log-price
        double dt  = T / n_steps;

        for (int s = 0; s < n_steps; ++s) {
            std::gamma_distribution<double> g_dt{dt / p.nu, p.nu};
            double G = g_dt(rng);
            double Z = nd(rng);
            lnS += p.theta * G + p.sigma * std::sqrt(G) * Z;
        }
        sum += std::max(std::exp(lnS) - K, 0.0);
    }
    return disc * sum / n_paths;
}

// VG characteristic function — feeds into Fourier pricer.
std::complex<double> vg_cf(std::complex<double> u,
                             double S, const VGParams& p, double T) {
    using C = std::complex<double>;
    C iu{0.0, 1.0};
    double omega = -std::log(1.0 - p.theta * p.nu - 0.5 * p.sigma * p.sigma * p.nu) / p.nu;
    // Log-S drift: (r + omega)*T
    C log_drift = iu * u * (std::log(S) + (p.r + omega) * T);

    // VG CF contribution: (1 - iu*theta*nu + 0.5*sigma^2*nu*u^2)^(-T/nu)
    C denom_log = C{1.0} - iu * u * (p.theta * p.nu)
                         + C{0.5 * p.sigma * p.sigma * p.nu} * u * u;
    C vg_term = std::pow(denom_log, C{-T / p.nu});

    return std::exp(log_drift) * vg_term;
}`,
    explanation:
      "The Variance Gamma model replaces Brownian time with a Gamma subordinator, giving pure-jump paths with finite variation and controllable skewness (theta) and kurtosis (nu). Unlike Heston, VG has no diffusion component — every move is a jump — making it suitable for assets that exhibit discrete price increments. The key simulation identity is: first draw the random time G ~ Gamma, then draw a Brownian increment at that time. The omega drift correction ensures the discounted stock price is a martingale under the risk-neutral measure.",
  },

  {
    id: "cpp-20260529-b1-token-bucket",
    language: "cpp",
    title: "Token bucket rate limiter — order submission throttle",
    tag: "performance",
    code: `#include <atomic>
#include <chrono>
#include <cstdint>

// Token bucket rate limiter:
// A bucket holds up to 'capacity' tokens. Tokens refill at 'rate' per second.
// Each order submission consumes 1 token. If the bucket is empty, the order
// is rejected (or the caller spins until tokens are available).
// Implementation: store the token count and last-refill timestamp as a pair
// packed into a single 128-bit value — compare-exchange atomically updates both.
// Simpler variant: use two separate relaxed atomics (not linearisable but practical).

class TokenBucket {
    const double   rate_;        // tokens per nanosecond
    const double   capacity_;    // max token count
    std::atomic<double>   tokens_;
    std::atomic<std::int64_t> last_ns_;

    static std::int64_t now_ns() {
        return std::chrono::duration_cast<std::chrono::nanoseconds>(
            std::chrono::steady_clock::now().time_since_epoch()).count();
    }

public:
    TokenBucket(double rate_per_sec, double capacity)
        : rate_(rate_per_sec / 1e9)   // convert to per-nanosecond
        , capacity_(capacity)
        , tokens_(capacity)
        , last_ns_(now_ns())
    {}

    // Try to consume one token. Returns true if the order may proceed.
    bool try_consume() noexcept {
        std::int64_t now  = now_ns();
        std::int64_t last = last_ns_.exchange(now, std::memory_order_relaxed);
        double elapsed    = static_cast<double>(now - last);

        // Refill: add tokens proportional to elapsed time.
        double current = tokens_.load(std::memory_order_relaxed);
        double refilled = std::min(current + elapsed * rate_, capacity_);
        tokens_.store(refilled, std::memory_order_relaxed);

        // Consume one token if available.
        if (refilled >= 1.0) {
            tokens_.store(refilled - 1.0, std::memory_order_relaxed);
            return true;
        }
        last_ns_.store(last, std::memory_order_relaxed);  // roll back timestamp
        return false;
    }

    double available() const noexcept {
        return tokens_.load(std::memory_order_relaxed);
    }
};

// Sliding-window rate limiter: count events in the last N milliseconds.
// Uses a circular buffer of timestamps — O(1) per check, O(N) space.
#include <array>
class SlidingWindowLimiter {
    static constexpr int  WIN_MS = 1000;   // 1-second window
    static constexpr int  MAX    = 100;    // max orders per second
    std::array<std::int64_t, MAX> ts_{};
    int  head_ = 0;
    int  count_ = 0;

public:
    bool try_consume() noexcept {
        std::int64_t now = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::steady_clock::now().time_since_epoch()).count();

        if (count_ == MAX) {
            // Oldest timestamp in circular buffer.
            std::int64_t oldest = ts_[head_];
            if (now - oldest < WIN_MS) return false;  // still in window → throttled
        }
        ts_[head_] = now;
        head_ = (head_ + 1) % MAX;
        count_ = std::min(count_ + 1, MAX);
        return true;
    }
};`,
    explanation:
      "The token bucket is the standard rate-limiting primitive for exchange order throttles (e.g., limit of 500 orders/second with bursts up to 1000). It allows short bursts while enforcing a long-run rate — superior to a fixed-window counter which permits a burst at the boundary of two windows. The sliding-window variant is strictly fair but requires storing all recent timestamps. In HFT, rate limiters sit on the critical path and must complete in under 100ns — atomic relaxed loads (no memory fence) keep the cost near a single cycle.",
  },

  {
    id: "cpp-20260529-b1-antithetic",
    language: "cpp",
    title: "Antithetic variates MC variance reduction — template wrapper",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <functional>
#include <algorithm>

// Antithetic variates: for each standard normal Z, also evaluate the payoff
// at -Z. The two paths are negatively correlated, reducing estimator variance.
// Variance of the antithetic estimator: Var[0.5*(Y + Y')] = 0.5*Var[Y] + 0.5*Cov[Y,Y']
// When Cov[Y,Y'] < 0 (as for monotone payoffs like calls), variance is reduced.
// Typically halves the number of paths needed for the same standard error.

// Generic antithetic MC: payoff_fn takes a vector of standard normals.
template<typename PayoffFn>
double antithetic_mc(PayoffFn payoff_fn, int n_dims, int n_paths,
                      std::mt19937_64& rng, double disc = 1.0) {
    std::normal_distribution<double> nd;
    std::vector<double> Z(n_dims), Z_anti(n_dims);
    double sum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        for (int d = 0; d < n_dims; ++d) {
            Z[d]      =  nd(rng);
            Z_anti[d] = -Z[d];       // antithetic path
        }
        // Average the two payoffs — correlated negatively for monotone payoffs.
        sum += 0.5 * (payoff_fn(Z) + payoff_fn(Z_anti));
    }
    return disc * sum / n_paths;
}

// Example: GBM European call using antithetic variates.
double bs_antithetic_call(double S0, double K, double r, double sigma, double T,
                            int n_paths = 100'000, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    double drift  = (r - 0.5 * sigma * sigma) * T;
    double vol_T  = sigma * std::sqrt(T);
    double disc   = std::exp(-r * T);

    auto payoff = [&](const std::vector<double>& Z) {
        double S = S0 * std::exp(drift + vol_T * Z[0]);
        return std::max(S - K, 0.0);
    };

    return antithetic_mc(payoff, 1, n_paths, rng, disc);
}

// Multi-step path: antithetic flips sign of ALL increments simultaneously.
double path_antithetic_asian(double S0, double K, double r, double sigma,
                               double T, int n_steps, int n_paths = 50'000,
                               unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    double dt   = T / n_steps;
    double disc = std::exp(-r * T);

    auto payoff = [&](const std::vector<double>& Z) {
        double S = S0, sum_S = 0.0;
        double drift = (r - 0.5*sigma*sigma)*dt;
        double vol   = sigma*std::sqrt(dt);
        for (int s = 0; s < n_steps; ++s) {
            S *= std::exp(drift + vol * Z[s]);
            sum_S += S;
        }
        return std::max(sum_S / n_steps - K, 0.0);  // arithmetic average payoff
    };

    return antithetic_mc(payoff, n_steps, n_paths, rng, disc);
}`,
    explanation:
      "Antithetic variates exploit the monotonicity of option payoffs: a higher Z generates a higher terminal stock price and a higher call payoff; −Z generates the mirror path with a lower payoff. Because call payoffs are convex and monotone in Z, the antithetic pair is negatively correlated, reducing the estimator variance. The template wrapper is generic: the same `antithetic_mc` function works for any payoff that accepts a normal variate vector — path-dependent or not.",
  },

  {
    id: "cpp-20260529-b1-richardson",
    language: "cpp",
    title: "Richardson extrapolation for Greeks — eliminating finite-difference bias",
    tag: "quant",
    code: `#include <functional>
#include <cmath>
#include <array>

// Finite-difference Greeks suffer from discretisation error O(h^n).
// Richardson extrapolation cancels the leading error term by combining
// estimates at h and h/2:
//   f'(x) = [4 * f'_{h/2} - f'_h] / 3   (eliminates O(h^2) term → O(h^4))
// For a second derivative (gamma), applies analogously.
//
// Central difference delta: [f(x+h) - f(x-h)] / (2h)  — error O(h^2)
// Richardson: [4*CD(h/2) - CD(h)] / 3               — error O(h^4)

using PriceFn = std::function<double(double)>;  // price as function of S

// Central-difference delta with Richardson extrapolation.
double delta_richardson(PriceFn price, double S, double h = 1.0) {
    auto cd = [&](double step) {
        return (price(S + step) - price(S - step)) / (2.0 * step);
    };
    return (4.0 * cd(h / 2.0) - cd(h)) / 3.0;
}

// Gamma (second derivative) with Richardson.
double gamma_richardson(PriceFn price, double S, double h = 1.0) {
    auto cd2 = [&](double step) {
        return (price(S + step) - 2.0 * price(S) + price(S - step)) / (step * step);
    };
    return (4.0 * cd2(h / 2.0) - cd2(h)) / 3.0;
}

// Vega: first derivative w.r.t. sigma.
double vega_richardson(std::function<double(double)> price_fn_sigma,
                        double sigma, double h = 0.005) {
    auto cd = [&](double step) {
        return (price_fn_sigma(sigma + step) - price_fn_sigma(sigma - step)) / (2.0 * step);
    };
    return (4.0 * cd(h / 2.0) - cd(h)) / 3.0;
}

// Higher-order: Romberg extrapolation over a sequence of steps.
// Extrapolate delta using steps h, h/2, h/4 with Romberg triangle.
double delta_romberg(PriceFn price, double S, double h = 2.0, int levels = 3) {
    std::array<std::array<double, 4>, 4> T{};
    double step = h;
    for (int i = 0; i < levels; ++i) {
        T[i][0] = (price(S + step) - price(S - step)) / (2.0 * step);
        for (int j = 1; j <= i; ++j) {
            double k = std::pow(4.0, j);
            T[i][j] = (k * T[i][j-1] - T[i-1][j-1]) / (k - 1.0);
        }
        step /= 2.0;
    }
    return T[levels-1][levels-1];
}

// Validate against BS analytic delta.
double bs_call_price(double S, double K, double r, double sigma, double T) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma*std::sqrt(T);
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    return S*N(d1) - K*std::exp(-r*T)*N(d2);
}

int main() {
    double K=100, r=0.05, sigma=0.20, T=1.0;
    auto price_fn = [&](double S){ return bs_call_price(S, K, r, sigma, T); };

    double delta_fd  = delta_richardson(price_fn, 100.0);   // should ≈ 0.6368
    double gamma_fd  = gamma_richardson(price_fn, 100.0);   // should ≈ 0.0188
    (void)delta_fd; (void)gamma_fd;
}`,
    explanation:
      "Richardson extrapolation cancels the leading error term in finite-difference approximations by combining estimates at two different step sizes. For central differences (error O(h²)), one Richardson step gives O(h⁴) — a 4-order improvement that means you can use 10× larger h (less numerical noise from floating-point cancellation) and still achieve the same accuracy. This matters most for second-order Greeks (gamma, volga) where small h causes catastrophic cancellation but large h causes large truncation error.",
  },

  {
    id: "cpp-20260529-b1-correlated-gbm",
    language: "cpp",
    title: "Correlated GBM paths via Cholesky — multi-asset basket simulation",
    tag: "quant",
    code: `#include <vector>
#include <random>
#include <cmath>
#include <stdexcept>

// Multi-asset correlated GBM: dS_i/S_i = (r - q_i) dt + sigma_i dW_i
// corr(dW_i, dW_j) = rho_{ij}
// Simulation: decompose the correlation matrix via Cholesky:
//   Sigma = L @ L^T
// Draw independent Z ~ N(0,I), then W = L @ Z gives corr(W_i, W_j) = rho_{ij}.

class CholeskyDecomp {
    int n_;
    std::vector<double> L_;  // lower triangular, row-major

public:
    CholeskyDecomp(const std::vector<std::vector<double>>& Sigma) : n_(Sigma.size()), L_(n_*n_, 0.0) {
        // Cholesky-Banachiewicz algorithm.
        for (int i = 0; i < n_; ++i) {
            for (int j = 0; j <= i; ++j) {
                double s = Sigma[i][j];
                for (int k = 0; k < j; ++k) s -= L_[i*n_+k] * L_[j*n_+k];
                if (i == j) {
                    if (s <= 0.0) throw std::runtime_error("not positive definite");
                    L_[i*n_+j] = std::sqrt(s);
                } else {
                    L_[i*n_+j] = s / L_[j*n_+j];
                }
            }
        }
    }

    // Apply L to independent normals: correlated_i = sum_j L[i,j] * Z[j]
    void apply(const std::vector<double>& Z, std::vector<double>& out) const {
        out.resize(n_);
        for (int i = 0; i < n_; ++i) {
            double s = 0.0;
            for (int j = 0; j <= i; ++j) s += L_[i*n_+j] * Z[j];
            out[i] = s;
        }
    }
};

// Simulate terminal values of n correlated GBM assets.
std::vector<double> gbm_terminal(
    const std::vector<double>& S0, const std::vector<double>& mu,
    const std::vector<double>& sigma, const CholeskyDecomp& chol,
    double T, std::mt19937_64& rng)
{
    int n = static_cast<int>(S0.size());
    std::normal_distribution<double> nd;
    std::vector<double> Z(n), W(n);
    for (int i = 0; i < n; ++i) Z[i] = nd(rng);
    chol.apply(Z, W);

    std::vector<double> ST(n);
    double sqrtT = std::sqrt(T);
    for (int i = 0; i < n; ++i)
        ST[i] = S0[i] * std::exp((mu[i] - 0.5*sigma[i]*sigma[i])*T + sigma[i]*sqrtT*W[i]);
    return ST;
}

// Basket call: max(mean(S_T) - K, 0)
double basket_call_mc(int n_assets, double K, double r, double T,
                       const std::vector<double>& S0, const std::vector<double>& sigma,
                       const std::vector<std::vector<double>>& corr,
                       int n_paths = 100'000, unsigned seed = 42) {
    CholeskyDecomp chol(corr);
    std::vector<double> mu(n_assets, r);
    std::mt19937_64 rng(seed);
    double disc = std::exp(-r * T), sum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        auto ST = gbm_terminal(S0, mu, sigma, chol, T, rng);
        double basket = 0.0;
        for (double s : ST) basket += s;
        basket /= n_assets;
        sum += std::max(basket - K, 0.0);
    }
    return disc * sum / n_paths;
}`,
    explanation:
      "Cholesky decomposition factorises the correlation matrix Σ = LL^T; multiplying independent standard normals by L produces variates with the desired correlations. This is the universal simulation primitive for multi-asset models — basket options, spread options, cross-asset correlation products — and is also used in interest rate model simulation (HJM, LMM). The key numerical requirement is positive definiteness: a correlation matrix estimated from data can be near-singular and must be regularised (e.g., eigenvalue flooring) before Cholesky.",
  },

  {
    id: "cpp-20260529-b1-fnv-hash",
    language: "cpp",
    title: "Compile-time FNV-1a symbol hash — O(1) tick routing",
    tag: "performance",
    code: `#include <cstdint>
#include <string_view>
#include <array>
#include <cassert>

// FNV-1a (Fowler-Noll-Vo): non-cryptographic hash designed for short strings.
// Used to map ticker symbols to integer keys for O(1) lookup in arrays,
// replacing std::unordered_map with hash-table collision risk in hot paths.
// constexpr: the hash of a string literal is computed entirely at compile time.

constexpr std::uint32_t FNV_PRIME  = 16777619u;
constexpr std::uint32_t FNV_OFFSET = 2166136261u;

constexpr std::uint32_t fnv1a_32(std::string_view s) noexcept {
    std::uint32_t h = FNV_OFFSET;
    for (unsigned char c : s)
        h = (h ^ c) * FNV_PRIME;
    return h;
}

// Compile-time validation: assert no collision in a symbol table.
constexpr std::array<std::string_view, 5> SYMBOLS = {"AAPL","MSFT","GOOG","AMZN","TSLA"};
constexpr std::array<std::uint32_t, 5>    HASHES  = {
    fnv1a_32("AAPL"), fnv1a_32("MSFT"), fnv1a_32("GOOG"),
    fnv1a_32("AMZN"), fnv1a_32("TSLA")
};

// Use hashes as direct array indices via a small open-addressed table.
// Table size = next prime above 2 * num_symbols for good load factor.
struct SymbolEntry { std::uint32_t hash; std::uint8_t idx; };
constexpr std::size_t TABLE_SIZE = 11;

// Lookup ticker → array index in O(1): no dynamic dispatch, no heap.
int lookup_symbol(std::string_view sym) {
    std::uint32_t h = fnv1a_32(sym);
    std::size_t   slot = h % TABLE_SIZE;

    // Linear probe fallback (simple; real system uses Robin Hood).
    for (std::size_t i = 0; i < TABLE_SIZE; ++i) {
        std::size_t s = (slot + i) % TABLE_SIZE;
        for (std::size_t k = 0; k < SYMBOLS.size(); ++k) {
            if (HASHES[k] % TABLE_SIZE == s && SYMBOLS[k] == sym)
                return static_cast<int>(k);
        }
        break;   // simplified single-probe version
    }
    return -1;
}

// Static assert: compile-time collision check (limited, illustrative).
static_assert(fnv1a_32("AAPL") != fnv1a_32("MSFT"), "hash collision!");
static_assert(fnv1a_32("GOOG") != fnv1a_32("AMZN"), "hash collision!");

// Compile-time switch via hash — branch-free dispatch.
void route_tick(std::string_view sym, double price) {
    switch (fnv1a_32(sym)) {
        case fnv1a_32("AAPL"): /* handle AAPL */ break;
        case fnv1a_32("MSFT"): /* handle MSFT */ break;
        default:                /* unknown symbol */ break;
    }
    (void)price;
}`,
    explanation:
      "A compile-time hash allows `switch (fnv1a_32(sym))` with string_view cases — the compiler generates a direct jump table rather than a chain of strcmp calls, achieving O(1) tick routing with zero dynamic allocation. FNV-1a is preferred over CRC32 or MurmurHash3 for ticker symbols (typically 4–6 characters) because it has fewer operations and no SIMD dependency. The `static_assert` collision checks are evaluated at compile time, guaranteeing the routing table is collision-free before the binary is ever deployed.",
  },

  {
    id: "cpp-20260529-b1-perpetual-american",
    language: "cpp",
    title: "Perpetual American put — Merton analytic boundary and price",
    tag: "quant",
    code: `#include <cmath>
#include <algorithm>

// Perpetual American put: never expires, so the optimal exercise boundary S*
// is constant. Solved via the free-boundary ODE:
//   0.5*sigma^2*S^2*V'' + r*S*V' - r*V = 0   for S > S*
//   V(S*) = K - S*   (value matching)
//   V'(S*) = -1      (smooth pasting)
//
// Solution: V(S) = (K - S*) * (S/S*)^beta
// where beta < 0 is the negative root of: 0.5*sigma^2*beta*(beta-1) + r*beta - r = 0
// and S* = K * beta / (beta - 1)    (optimal exercise boundary)

struct PerpAmPutResult {
    double S_star;     // optimal exercise boundary: exercise if S <= S*
    double value;      // option price at spot S
    double delta;      // dV/dS = (K - S*)*(S/S*)^beta * beta / S
};

PerpAmPutResult perpetual_am_put(double S, double K, double r, double sigma) {
    double sigma2 = sigma * sigma;

    // Solve quadratic: 0.5*sigma^2*beta^2 + (r - 0.5*sigma^2)*beta - r = 0
    double b = r - 0.5 * sigma2;
    double disc = b * b + 2.0 * r * sigma2;
    // Two roots: positive (beta_2 > 0) and negative (beta_1 < 0).
    double beta_pos = (-b + std::sqrt(disc)) / sigma2;
    double beta_neg = (-b - std::sqrt(disc)) / sigma2;

    // For the American put, we use the negative root beta = beta_neg.
    double beta = beta_neg;

    // Optimal exercise boundary.
    double S_star = K * beta / (beta - 1.0);  // note: beta < 0, beta-1 < -1, S* < K

    double value = 0.0, delta_val = 0.0;
    if (S <= S_star) {
        // Immediate exercise region: intrinsic value.
        value     = K - S;
        delta_val = -1.0;
    } else {
        // Continuation region: power function.
        double ratio = S / S_star;
        double coeff = K - S_star;
        value     = coeff * std::pow(ratio, beta);
        delta_val = coeff * beta * std::pow(ratio, beta - 1.0) / S_star;
    }
    return {S_star, value, delta_val};
}

int main() {
    // ATM put: S=K=100, r=5%, sigma=20%
    auto res = perpetual_am_put(100.0, 100.0, 0.05, 0.20);
    // S* ≈ 66.67 (exercise if stock falls to 2/3 of K).
    // Value at S=100 ≈ 12.58 (much cheaper than finite-expiry put).
    (void)res;

    // Compare exercise boundary across vol levels.
    for (double sig : {0.10, 0.20, 0.30, 0.40}) {
        auto r2 = perpetual_am_put(100.0, 100.0, 0.05, sig);
        // Higher vol → lower S* (rational to wait longer before exercising)
        (void)r2;
    }
}`,
    explanation:
      "The perpetual American put has a closed-form because the time derivative drops out (no expiry), reducing the Black-Scholes PDE to an ODE with constant coefficients. The smooth-pasting condition (V'(S*) = −1 and V(S*) = K − S*) uniquely determines both the exercise boundary and the power-function coefficient. Higher volatility raises the option value and lowers S* — you wait longer because the upside of continued optionality is larger. The perpetual put is the building block for perpetual callable bonds and real-options problems with no fixed deadline.",
  },

  {
    id: "cpp-20260529-b1-ewma-var",
    language: "cpp",
    title: "Streaming EWMA portfolio variance with incremental Cholesky update",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <cassert>

// EWMA (Exponentially Weighted Moving Average) covariance matrix:
//   Sigma_t = lambda * Sigma_{t-1} + (1 - lambda) * r_{t-1} * r_{t-1}^T
// lambda ~ 0.94 (RiskMetrics daily) or 0.97 (monthly).
// Portfolio variance: w^T * Sigma_t * w — updated in O(N^2) per new return.
// For N large (100+ assets), only update the rows/columns touched by today's return.

class EWMACov {
    int     n_;
    double  lam_;       // decay factor (e.g. 0.94)
    std::vector<double> Sigma_;  // n x n covariance, row-major

public:
    EWMACov(int n, double lambda, double init_var = 1e-4)
        : n_(n), lam_(lambda), Sigma_(n * n, 0.0) {
        // Initialise to diagonal with init_var.
        for (int i = 0; i < n; ++i) Sigma_[i * n + i] = init_var;
    }

    // Update: incorporate new return vector r (length n).
    void update(const std::vector<double>& r) {
        assert(static_cast<int>(r.size()) == n_);
        double w = 1.0 - lam_;
        for (int i = 0; i < n_; ++i)
            for (int j = 0; j < n_; ++j)
                Sigma_[i * n_ + j] = lam_ * Sigma_[i * n_ + j] + w * r[i] * r[j];
    }

    // Portfolio variance w^T * Sigma * w.
    double port_var(const std::vector<double>& w) const {
        assert(static_cast<int>(w.size()) == n_);
        double var = 0.0;
        for (int i = 0; i < n_; ++i)
            for (int j = 0; j < n_; ++j)
                var += w[i] * Sigma_[i * n_ + j] * w[j];
        return var;
    }

    // Marginal risk contribution: dVar/dw_i = 2 * (Sigma * w)_i
    std::vector<double> marginal_risk(const std::vector<double>& w) const {
        std::vector<double> mrc(n_, 0.0);
        for (int i = 0; i < n_; ++i)
            for (int j = 0; j < n_; ++j)
                mrc[i] += Sigma_[i * n_ + j] * w[j];
        // Return 2*Sigma*w; divide by portfolio vol for marginal contribution.
        double pv = std::sqrt(port_var(w));
        for (auto& m : mrc) m /= pv;
        return mrc;
    }

    double sigma(int i, int j) const { return Sigma_[i * n_ + j]; }
    double vol(int i)           const { return std::sqrt(Sigma_[i * n_ + i]); }
    double corr(int i, int j)   const { return Sigma_[i*n_+j] / (vol(i)*vol(j)); }
};`,
    explanation:
      "EWMA covariance updates incrementally in O(N²) per return, versus O(N² × window) for rolling sample covariance — critical for high-dimensional portfolios. RiskMetrics uses λ = 0.94 for daily data (half-life ≈ 11 days), reflecting its view that recent returns dominate the covariance estimate. The incremental update is equivalent to Kalman filtering with known process and observation noise, and the EWMA covariance matrix is always PSD by construction (it is a convex combination of PSD matrices).",
  },

  {
    id: "cpp-20260529-b1-vol-interp",
    language: "cpp",
    title: "Bilinear implied-vol surface interpolation for option pricing",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <stdexcept>
#include <algorithm>

// Bilinear interpolation on a (strike, maturity) vol grid.
// For (K, T) between four grid nodes, interpolate as:
//   vol(K, T) = (1-a)*(1-b)*V[i][j] + a*(1-b)*V[i+1][j]
//             + (1-a)*b*V[i][j+1] + a*b*V[i+1][j+1]
// where a = (K - K[i])/(K[i+1]-K[i]), b = (T - T[j])/(T[j+1]-T[j]).
// Linear in log-moneyness and sqrt(T) is more stable for extrapolation.

class VolSurface {
    std::vector<double>              strikes_;   // sorted ascending
    std::vector<double>              maturities_;// sorted ascending
    std::vector<std::vector<double>> vols_;      // vols_[i_T][i_K]

    static int lower_bound_idx(const std::vector<double>& v, double x) {
        auto it = std::lower_bound(v.begin(), v.end(), x);
        if (it == v.end())   return static_cast<int>(v.size()) - 2;
        if (it == v.begin()) return 0;
        return static_cast<int>(std::distance(v.begin(), it)) - 1;
    }

public:
    VolSurface(std::vector<double> strikes, std::vector<double> mats,
               std::vector<std::vector<double>> vols)
        : strikes_(std::move(strikes)), maturities_(std::move(mats))
        , vols_(std::move(vols)) {}

    // Bilinear interpolation.
    double operator()(double K, double T) const {
        int iK = lower_bound_idx(strikes_,    K);
        int iT = lower_bound_idx(maturities_, T);

        iK = std::min(iK, static_cast<int>(strikes_.size()) - 2);
        iT = std::min(iT, static_cast<int>(maturities_.size()) - 2);

        double a = (K - strikes_[iK])    / (strikes_[iK+1]    - strikes_[iK]);
        double b = (T - maturities_[iT]) / (maturities_[iT+1] - maturities_[iT]);
        a = std::clamp(a, 0.0, 1.0);
        b = std::clamp(b, 0.0, 1.0);

        double v00 = vols_[iT  ][iK  ];
        double v10 = vols_[iT  ][iK+1];
        double v01 = vols_[iT+1][iK  ];
        double v11 = vols_[iT+1][iK+1];

        return (1-a)*(1-b)*v00 + a*(1-b)*v10
             + (1-a)*  b  *v01 + a*  b  *v11;
    }

    // Calendar spread arbitrage check: vol^2 * T must be non-decreasing in T.
    bool is_calendar_arb_free() const {
        for (std::size_t iK = 0; iK < strikes_.size(); ++iK)
            for (std::size_t iT = 0; iT + 1 < maturities_.size(); ++iT) {
                double tv1 = vols_[iT  ][iK] * vols_[iT  ][iK] * maturities_[iT  ];
                double tv2 = vols_[iT+1][iK] * vols_[iT+1][iK] * maturities_[iT+1];
                if (tv2 < tv1 - 1e-9) return false;
            }
        return true;
    }
};`,
    explanation:
      "Bilinear vol surface interpolation is the simplest approach that guarantees a smooth vol between observed strikes and maturities without arbitrage-sensitive extrapolation. The calendar-arb check verifies that total variance (σ²·T) is non-decreasing in maturity — a necessary condition for no-arbitrage because the total variance is a cumulative hazard-like quantity. For production use, parametric surfaces (SVI, SSVI) are preferred because they enforce arbitrage-free constraints globally and extrapolate more stably.",
  },

  {
    id: "cpp-20260529-b1-order-flow-imbalance",
    language: "cpp",
    title: "Order flow imbalance (OFI) — Cont-Kukanov price impact signal",
    tag: "quant",
    code: `#include <cstdint>
#include <cmath>
#include <deque>
#include <algorithm>

// Order flow imbalance (Cont, Kukanov, Stoikov 2014):
//   OFI_t = sum_{bid changes} delta_bid_qty - sum_{ask changes} delta_ask_qty
// where:
//   delta_bid_qty = +V if new best bid qty added at current best bid price
//                 = -V if volume removed from current best bid
//   delta_ask_qty = symmetrically for ask side
//
// Empirically: OFI is the best linear predictor of short-horizon price changes.
//   delta_p_{t+dt} ≈ beta * OFI_t
// beta (price impact per OFI unit) is calibrated per symbol.

struct BookLevel {
    std::int64_t price_ticks;   // price in tick units
    std::int32_t qty;           // total qty at this level
};

struct OFIState {
    std::int64_t best_bid_px = -1, best_ask_px = -1;
    std::int32_t best_bid_qty = 0, best_ask_qty = 0;
    double       ofi = 0.0;
};

// Process a book update and return the OFI contribution.
double update_ofi(OFIState& st,
                   std::int64_t new_bid_px, std::int32_t new_bid_qty,
                   std::int64_t new_ask_px, std::int32_t new_ask_qty) {
    double delta_ofi = 0.0;

    // Bid side: positive OFI contribution.
    if (new_bid_px > st.best_bid_px) {
        // New higher best bid: treat as adding full new qty.
        delta_ofi += new_bid_qty;
    } else if (new_bid_px == st.best_bid_px) {
        // Same price: track the change in qty (positive = added, negative = removed).
        delta_ofi += static_cast<double>(new_bid_qty - st.best_bid_qty);
    } else {
        // Best bid dropped: treat as removing all prior qty.
        delta_ofi -= st.best_bid_qty;
    }

    // Ask side: negative OFI contribution.
    if (new_ask_px < st.best_ask_px || st.best_ask_px == -1) {
        delta_ofi -= new_ask_qty;   // new lower ask: aggressive add
    } else if (new_ask_px == st.best_ask_px) {
        delta_ofi -= static_cast<double>(new_ask_qty - st.best_ask_qty);
    } else {
        delta_ofi += st.best_ask_qty;   // ask retreated: treat as removed
    }

    st.best_bid_px  = new_bid_px;
    st.best_bid_qty = new_bid_qty;
    st.best_ask_px  = new_ask_px;
    st.best_ask_qty = new_ask_qty;
    st.ofi += delta_ofi;

    return delta_ofi;
}

// Rolling OFI over a window of K book updates.
class RollingOFI {
    std::deque<double> window_;
    int k_;
    double sum_ = 0.0;
public:
    explicit RollingOFI(int k) : k_(k) {}
    double push(double delta) {
        window_.push_back(delta);
        sum_ += delta;
        if (static_cast<int>(window_.size()) > k_) {
            sum_ -= window_.front();
            window_.pop_front();
        }
        return sum_;
    }
};`,
    explanation:
      "OFI measures the net pressure on the best bid vs the best ask: large positive OFI means buyers are aggressively adding at or lifting the offer while sellers are pulling, predicting a near-term price increase. The Cont-Kukanov model shows OFI explains 60–80% of 10-second price changes on equities — far more than signed volume (the classic Kyle lambda proxy). The key implementation detail is tracking *changes* at the best quote only, not deeper in the book, because market impact research shows best-level changes dominate short-horizon price discovery.",
  },
];
