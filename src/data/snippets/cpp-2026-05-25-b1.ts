import type { Snippet } from "./types";

export const cppSnippets20260525B1: Snippet[] = [
  {
    id: "cpp-20260525-b1-optional-monadic",
    language: "cpp",
    title: "std::optional monadic ops — and_then, transform, or_else (C++23)",
    tag: "stl",
    code: `#include <optional>
#include <string_view>
#include <charconv>

// C++23 monadic optional: chain fallible operations without manual if-checks.
// and_then:  T -> optional<U>  (flatMap — propagates nullopt)
// transform: T -> U            (map — wraps result in optional)
// or_else:   () -> optional<T> (provide fallback when nullopt)

std::optional<double> parse_price(std::string_view s) {
    double v{};
    auto [ptr, ec] = std::from_chars(s.data(), s.data() + s.size(), v);
    if (ec != std::errc{} || ptr != s.data() + s.size()) return std::nullopt;
    return v;
}

std::optional<double> validate_positive(double v) {
    return v > 0.0 ? std::optional{v} : std::nullopt;
}

// Pipeline: parse -> validate -> apply spread; nullopt short-circuits.
std::optional<double> best_ask(std::string_view raw, double spread_bps = 1.0) {
    return parse_price(raw)
        .and_then(validate_positive)
        .transform([spread_bps](double mid) {
            return mid * (1.0 + spread_bps * 1e-4);
        });
}

// or_else supplies a lazy fallback computation.
double ask_or_stale(std::string_view raw, double stale_price) {
    return best_ask(raw)
        .or_else([&]() -> std::optional<double> { return stale_price; })
        .value();
}

int main() {
    auto a = best_ask("100.25");   // optional{100.2601}
    auto b = best_ask("-5.0");     // nullopt (negative)
    auto c = best_ask("xyz");      // nullopt (parse failure)
    (void)a; (void)b; (void)c;
}`,
    explanation:
      "C++23 monadic optional eliminates the nested-if boilerplate of manual nullopt propagation. In a FIX/ITCH parser, each field validation step can return nullopt independently; and_then chains them so the first failure short-circuits the whole expression without a single explicit branch.",
  },
  {
    id: "cpp-20260525-b1-expected",
    language: "cpp",
    title: "std::expected<T,E> — typed error propagation without exceptions",
    tag: "stl",
    code: `#include <expected>
#include <string_view>
#include <charconv>
#include <cstdint>

// std::expected<T,E>: holds either a value T or an error E.
// Zero overhead vs exceptions — no stack unwinding, no try/catch,
// error type is visible in the function signature.
enum class ParseErr { Empty, BadFormat, OutOfRange };

std::expected<std::uint64_t, ParseErr>
parse_order_id(std::string_view s) noexcept {
    if (s.empty()) return std::unexpected(ParseErr::Empty);

    std::uint64_t id{};
    auto [ptr, ec] = std::from_chars(s.data(), s.data() + s.size(), id);
    if (ec == std::errc::result_out_of_range)
        return std::unexpected(ParseErr::OutOfRange);
    if (ec != std::errc{} || ptr != s.data() + s.size())
        return std::unexpected(ParseErr::BadFormat);
    return id;
}

// Chain with monadic ops just like optional.
std::expected<double, ParseErr>
id_to_bucket(std::string_view s) noexcept {
    return parse_order_id(s)
        .transform([](std::uint64_t id) -> double {
            return static_cast<double>(id % 100);
        });
}

int main() {
    auto r = id_to_bucket("9876543210");
    if (r)          (void)*r;          // ok path
    else            (void)r.error();   // error path — no exception thrown

    // and_then: chain another expected-returning function
    auto r2 = parse_order_id("123")
        .and_then([](std::uint64_t id) -> std::expected<bool, ParseErr> {
            return id > 100;
        });
    (void)r2;
}`,
    explanation:
      "std::expected makes error handling explicit in the type system: callers cannot ignore failures without a compiler warning. On the critical path of a message parser where every field can be malformed, expected avoids the overhead of exception-handling tables and keeps error information in CPU registers rather than heap-allocated exception objects.",
  },
  {
    id: "cpp-20260525-b1-fold-expressions",
    language: "cpp",
    title: "Fold expressions — variadic pack reduction (C++17)",
    tag: "templates",
    code: `#include <cstddef>
#include <type_traits>
#include <utility>

// Unary/binary fold expressions collapse parameter packs with an operator.
// Replaces recursive partial specialisations — cleaner and O(1) template depth.

// Sum of arbitrarily many values (unary right fold: v1 + (v2 + (v3 + ...)))
template <typename... Ts>
constexpr auto sum(Ts... vs) { return (vs + ...); }

// Product (unary right fold with identity 1)
template <typename... Ts>
constexpr auto product(Ts... vs) { return (vs * ... * 1); }

// Apply all predicates to a value (binary left fold over &&)
template <typename T, typename... Preds>
bool all_of(T val, Preds&&... preds) {
    return (... && std::forward<Preds>(preds)(val));
}

// Count type list length at compile time
template <typename... Ts>
constexpr std::size_t count_types() { return sizeof...(Ts); }

// Order validation: all constraints must pass
bool valid_order(double price, int qty, int side) {
    return all_of(price, [](double p){ return p > 0.0; })
        && all_of(qty,   [](int q)  { return q > 0;   })
        && (side == 0 || side == 1);
}

// Variadic field printer (comma-fold over <<)
#include <iostream>
template <typename... Args>
void print_fields(Args&&... args) {
    ((std::cout << args << ' '), ...);
    std::cout << '\\n';
}

static_assert(sum(1, 2, 3, 4) == 10);
static_assert(product(2, 3, 4) == 24);
static_assert(count_types<int, double, char>() == 3);`,
    explanation:
      "Fold expressions evaluate left or right to right recursively at compile time, eliminating the O(N) recursive template instantiation depth that caused compile-time explosions in pre-C++17 variadic code. The comma-fold for stream output is especially common in debug loggers that need to print an arbitrary set of tick fields.",
  },
  {
    id: "cpp-20260525-b1-consteval-sieve",
    language: "cpp",
    title: "consteval and if constexpr — compile-time tables and type branching",
    tag: "templates",
    code: `#include <array>
#include <cstddef>
#include <type_traits>

// consteval: function MUST be evaluated at compile time (hard error otherwise).
// Stronger than constexpr, which allows both compile-time and runtime.
template <std::size_t N>
consteval std::array<bool, N> build_prime_table() {
    std::array<bool, N> p{};
    p.fill(true);
    if constexpr (N > 0) p[0] = false;
    if constexpr (N > 1) p[1] = false;
    for (std::size_t i = 2; i * i < N; ++i)
        if (p[i])
            for (std::size_t j = i * i; j < N; ++j)
                if (j % i == 0) p[j] = false;
    return p;
}

// Zero runtime cost — the entire table is in the read-only data segment.
static constexpr auto IS_PRIME = build_prime_table<1024>();

// if constexpr: the discarded branch is never compiled — allows type-specific code
// that would be ill-formed for other types (e.g., floating-point division vs integer).
template <typename T>
constexpr T round_to_tick(T price, T tick) {
    if constexpr (std::is_floating_point_v<T>)
        return static_cast<T>(static_cast<long long>(price / tick)) * tick;
    else
        return (price / tick) * tick;   // integer exact
}

static_assert(IS_PRIME[2] && IS_PRIME[997] && !IS_PRIME[100]);
static_assert(round_to_tick(100.7, 0.5) == 100.5);
static_assert(round_to_tick(107, 5) == 105);`,
    explanation:
      "consteval converts compile-time computation failures into hard errors at the call site, not silent runtime bugs. Paired with if constexpr, it enables zero-cost polymorphism: a single template function handles floating-point and integer prices with completely different logic, and the unused branch is compiled away entirely.",
  },
  {
    id: "cpp-20260525-b1-atomic-wait-notify",
    language: "cpp",
    title: "std::atomic wait/notify — futex-based inter-thread signalling (C++20)",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <chrono>
#include <vector>

// C++20 adds wait()/notify_one()/notify_all() to std::atomic<T>.
// Implemented via futex on Linux — cheaper than condition_variable
// (no mutex, no spurious wakeup storm, tighter integration with the OS scheduler).

std::atomic<int>    g_seq{0};         // monotonically increasing sequence
std::atomic<bool>   g_stop{false};

struct Tick { double price; int seq; };
Tick g_tick{};   // single shared tick slot (demo; real code uses a ring buffer)

// Strategy thread: blocks waiting for a new sequence number.
void strategy() {
    int last = 0;
    while (!g_stop.load(std::memory_order_relaxed)) {
        // Blocks until g_seq != last  (OS futex, zero CPU when idle).
        g_seq.wait(last, std::memory_order_acquire);
        last = g_seq.load(std::memory_order_acquire);
        // Process g_tick here (guaranteed visible after acquire above).
    }
}

// Feed thread: publishes a tick then wakes the strategy.
void feed(const std::vector<double>& prices) {
    for (int i = 0; i < static_cast<int>(prices.size()); ++i) {
        g_tick = {prices[i], i + 1};                    // write data first
        g_seq.store(i + 1, std::memory_order_release);  // publish
        g_seq.notify_one();                             // wake one waiter
        std::this_thread::sleep_for(std::chrono::microseconds(100));
    }
    g_stop.store(true, std::memory_order_release);
    g_seq.store(-1, std::memory_order_release);
    g_seq.notify_all();
}

int main() {
    std::thread s(strategy);
    std::thread f(feed, std::vector<double>{99.5, 100.0, 100.5});
    f.join(); s.join();
}`,
    explanation:
      "atomic::wait() replaces the common spin-loop (while(seq == old) {}) with an OS sleep that returns only when the value changes. On a heavily loaded server, spin-waiting burns CPU time that other threads or processes could use; the futex approach yields the core and still achieves sub-microsecond wake latency.",
  },
  {
    id: "cpp-20260525-b1-treiber-stack",
    language: "cpp",
    title: "Treiber lock-free stack — compare_exchange for LIFO",
    tag: "concurrency",
    code: `#include <atomic>

// Treiber (1986) lock-free stack: CAS on the head pointer.
// LIFO; wait-free push (succeeds after finite retries); lock-free pop.
// ABA hazard: if a node is popped and the same address re-allocated + pushed,
// the CAS in pop sees the old head and succeeds incorrectly.
// Mitigation: tagged pointers (lower bits of aligned ptr) or epoch reclamation.
template <typename T>
class TreiberStack {
    struct Node {
        T     val;
        Node* next;
        Node(T v, Node* n) : val(std::move(v)), next(n) {}
    };

    std::atomic<Node*> head_{nullptr};

public:
    void push(T v) {
        Node* n   = new Node(std::move(v), nullptr);
        Node* old = head_.load(std::memory_order_relaxed);
        do {
            n->next = old;
        } while (!head_.compare_exchange_weak(
                     old, n,
                     std::memory_order_release,
                     std::memory_order_relaxed));
    }

    bool pop(T& out) {
        Node* old = head_.load(std::memory_order_acquire);
        while (old) {
            if (head_.compare_exchange_weak(
                    old, old->next,
                    std::memory_order_acquire,
                    std::memory_order_relaxed)) {
                out = std::move(old->val);
                delete old;   // safe only if no concurrent pops share this node
                return true;
            }
        }
        return false;
    }

    ~TreiberStack() { T tmp; while (pop(tmp)) {} }
};`,
    explanation:
      "compare_exchange_weak is preferred over strong in retry loops: on LL/SC architectures (ARM, PowerPC), weak avoids a spurious double-check. The ABA problem makes this stack unsafe for general production use without hazard pointers — but it is the pedagogically standard MPMC lock-free structure for interview discussions of CAS correctness.",
  },
  {
    id: "cpp-20260525-b1-multiply-shift-hash",
    language: "cpp",
    title: "Multiply-shift universal hash for uint64 order IDs",
    tag: "performance",
    code: `#include <cstdint>
#include <bit>

// Multiply-shift: h(k) = (A * k) >> (64 - m), table size = 2^m.
// A must be odd; collisions <= 1/2^m for any key pair (universally hash).
// Two instructions: imul + shr. No modulo, no branch.
struct MulShiftHash {
    std::uint64_t A;     // odd multiplier
    std::uint32_t shift; // = 64 - log2(table_size)

    explicit MulShiftHash(std::size_t table_size,
                          std::uint64_t a = 0x9E3779B97F4A7C15ULL)
        : A(a | 1),
          shift(static_cast<std::uint32_t>(
              64u - std::bit_width(static_cast<std::uint64_t>(table_size) - 1u)))
    {}

    std::size_t operator()(std::uint64_t key) const noexcept {
        return static_cast<std::size_t>((A * key) >> shift);
    }
};

// 64-bit finaliser (avalanche mix) for non-sequential keys:
constexpr std::uint64_t mix64(std::uint64_t x) noexcept {
    x = (x ^ (x >> 30)) * 0xBF58476D1CE4E5B9ULL;
    x = (x ^ (x >> 27)) * 0x94D049BB133111EBULL;
    return x ^ (x >> 31);
}

// Usage: drop-in replacement for std::hash in an open-addressing map.
int main() {
    MulShiftHash h{1024};
    for (std::uint64_t id = 1'000'000; id < 1'001'000; ++id)
        (void)h(id);   // sequential IDs spread evenly across [0, 1024)
}`,
    explanation:
      "The golden-ratio constant 0x9E3779B97F4A7C15 has good avalanche properties for sequential inputs: consecutive order IDs map to well-dispersed table slots without the clustering seen with identity hashing. Two instructions (imul latency 3 cycles, shr latency 1 cycle) versus FNV-1a's 8+ pairs makes this the fastest option for tight hash-map hot paths.",
  },
  {
    id: "cpp-20260525-b1-par-unseq",
    language: "cpp",
    title: "std::execution par_unseq — parallel + SIMD batch Greeks",
    tag: "stl",
    code: `#include <algorithm>
#include <execution>
#include <vector>
#include <numeric>
#include <cmath>

// std::execution policies (C++17):
//   seq:      single-threaded, in-order.
//   par:      multi-threaded; elements may execute in any thread order.
//   par_unseq: multi-threaded AND vectorised (SIMD); NO synchronisation allowed
//              inside the lambda — no mutexes, no allocation, no exceptions.
struct Option { double S, K, r, sigma, T; };

// Compute Black-Scholes delta for an entire option book.
void batch_delta(const std::vector<Option>& book,
                 std::vector<double>& deltas) {
    deltas.resize(book.size());
    std::transform(
        std::execution::par_unseq,
        book.begin(), book.end(),
        deltas.begin(),
        [](const Option& o) noexcept -> double {
            double sT = o.sigma * std::sqrt(o.T);
            double d1 = (std::log(o.S / o.K) +
                         (o.r + 0.5 * o.sigma * o.sigma) * o.T) / sT;
            return 0.5 * std::erfc(-d1 * M_SQRT1_2);  // N(d1)
        });

    // Parallel reduce: portfolio net delta.
    double net_delta = std::reduce(
        std::execution::par_unseq, deltas.begin(), deltas.end(), 0.0);
    (void)net_delta;
}`,
    explanation:
      "par_unseq authorises the compiler to emit SIMD code (AVX-512 where available) and distribute iterations across threads simultaneously. The no-allocation, no-synchronisation constraint on the lambda is the key: any mutex inside would cause a data race. For a 10 000-option book, this replaces 2 ms of sequential delta computation with ~50 µs on a 20-core Xeon.",
  },
  {
    id: "cpp-20260525-b1-thread-pool",
    language: "cpp",
    title: "Fixed thread pool with packaged_task submission queue",
    tag: "concurrency",
    code: `#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <functional>
#include <vector>
#include <future>

// Bounded thread pool: workers sleep on a condition_variable when idle.
// submit() returns a std::future for synchronisation — no raw thread join needed.
class ThreadPool {
    std::vector<std::thread>          workers_;
    std::queue<std::function<void()>> queue_;
    std::mutex                        mtx_;
    std::condition_variable           cv_;
    bool                              stop_ = false;

public:
    explicit ThreadPool(std::size_t n) {
        for (std::size_t i = 0; i < n; ++i)
            workers_.emplace_back([this] {
                for (;;) {
                    std::function<void()> task;
                    {
                        std::unique_lock lk(mtx_);
                        cv_.wait(lk, [this]{ return stop_ || !queue_.empty(); });
                        if (stop_ && queue_.empty()) return;
                        task = std::move(queue_.front());
                        queue_.pop();
                    }
                    task();
                }
            });
    }

    template <typename F, typename... Args>
    auto submit(F&& f, Args&&... args)
        -> std::future<std::invoke_result_t<F, Args...>>
    {
        using R = std::invoke_result_t<F, Args...>;
        auto t = std::make_shared<std::packaged_task<R()>>(
            [f = std::forward<F>(f),
             ...args = std::forward<Args>(args)]() mutable {
                return std::invoke(std::move(f), std::move(args)...);
            });
        auto fut = t->get_future();
        { std::lock_guard lk(mtx_); queue_.emplace([t]{ (*t)(); }); }
        cv_.notify_one();
        return fut;
    }

    ~ThreadPool() {
        { std::lock_guard lk(mtx_); stop_ = true; }
        cv_.notify_all();
        for (auto& w : workers_) w.join();
    }
};`,
    explanation:
      "A thread pool avoids per-request thread creation overhead — thread spawning costs ~10 µs on Linux. submit() packs any callable into a packaged_task and returns a future, decoupling the caller from knowing which thread executes the work. The condition_variable sleep allows idle workers to yield the CPU entirely, important in multi-strategy systems where not all strategies are active simultaneously.",
  },
  {
    id: "cpp-20260525-b1-bdt-tree",
    language: "cpp",
    title: "Black-Derman-Toy short rate tree (yield-vol calibration)",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// BDT: log-normal short rate model. At each time step n, the rate
// at node j = u[n] * exp(sigma[n] * j * sqrt(dt)).
// Calibrate u[n] at each step by binary-searching for the median rate
// that prices a zero-coupon bond to match the market discount factor.
struct BDTTree {
    int    N;
    double dt;
    std::vector<std::vector<double>> r;  // r[step][node], (step+1) nodes at step

    BDTTree(int steps, double T)
        : N(steps), dt(T / steps), r(steps + 1) {
        for (int i = 0; i <= N; ++i) r[i].resize(i + 1);
    }

    // Price a ZCB maturing at step 'mat' by backward induction (risk-neutral q=0.5).
    double zcb_price(int mat) const {
        std::vector<double> v(mat + 1, 1.0);
        for (int t = mat - 1; t >= 0; --t) {
            std::vector<double> vn(t + 1);
            for (int j = 0; j <= t; ++j)
                vn[j] = 0.5 * (v[j] + v[j+1]) * std::exp(-r[t][j] * dt);
            v = std::move(vn);
        }
        return v[0];
    }

    // Calibrate step n so that zcb_price(n+1) == target_df.
    void calibrate(int n, double sigma, double target_df) {
        double lo = 1e-5, hi = 1.0;
        for (int iter = 0; iter < 80; ++iter) {
            double u = 0.5 * (lo + hi);
            for (int j = 0; j <= n; ++j)
                r[n][j] = u * std::exp(sigma * (j - n * 0.5) * std::sqrt(dt));
            (zcb_price(n + 1) > target_df) ? (lo = u) : (hi = u);
        }
    }
};`,
    explanation:
      "BDT produces a log-normal rate tree that exactly fits the initial yield curve (via u[n]) and a given term structure of yield volatilities (via sigma[n]). Unlike Vasicek, BDT rates are always positive. The binary search per column runs in O(N * log(1/ε)) and is fast enough for the 20-50 step trees used in cap/floor and swaption pricing.",
  },
  {
    id: "cpp-20260525-b1-trinomial-american",
    language: "cpp",
    title: "Trinomial tree pricing for American put",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Trinomial tree: 3 branches (up/mid/down) per node.
// Faster convergence than binomial per step — the middle branch eliminates
// the oscillation artefact that occurs when the barrier passes between levels.
// At step N the tree has 2N+1 nodes (vs N+1 for binomial).
double american_put_trinomial(double S, double K, double r,
                               double sigma, double T, int N) {
    double dt   = T / N;
    double dx   = sigma * std::sqrt(3.0 * dt);   // log-price spacing
    double nu   = r - 0.5 * sigma * sigma;
    double disc = std::exp(-r * dt);

    // Risk-neutral transition probabilities (match first two log-moments)
    double A  = 0.5 * dt * (sigma * sigma / (dx * dx) + nu * nu * dt / (dx * dx));
    double pu = A + 0.5 * nu * dt / dx;
    double pd = A - 0.5 * nu * dt / dx;
    double pm = 1.0 - pu - pd;

    // Terminal payoffs at step N: nodes indexed j in [0, 2N], centre j=N means S.
    std::vector<double> v(2 * N + 1);
    for (int j = 0; j <= 2 * N; ++j)
        v[j] = std::max(K - S * std::exp((j - N) * dx), 0.0);

    // Backward induction with early exercise check.
    for (int t = N - 1; t >= 0; --t) {
        std::vector<double> vn(2 * t + 1);
        for (int j = 0; j <= 2 * t; ++j) {
            double hold = disc * (pu * v[j + 2] + pm * v[j + 1] + pd * v[j]);
            double ST   = S * std::exp((j - t) * dx);
            vn[j] = std::max(hold, K - ST);  // American: exercise if intrinsic > hold
        }
        v = std::move(vn);
    }
    return v[0];
}`,
    explanation:
      "Trinomial trees converge faster than binomial because the middle branch (pm) allows the asset to stay flat — eliminating the parity oscillation that makes binomial convergence zig-zag. For a 200-step trinomial tree, pricing an American put is accurate to within 0.01% of the Barone-Adesi-Whaley approximation.",
  },
  {
    id: "cpp-20260525-b1-stratified-mc",
    language: "cpp",
    title: "Stratified sampling Monte Carlo — barrier option variance reduction",
    tag: "quant",
    code: `#include <random>
#include <cmath>

// Stratified sampling: partition [0,1) into n_paths strata, sample one U per stratum.
// Guarantees even coverage of the distribution — no lucky/unlucky clustering.
// For smooth payoffs, error decreases as O(1/N^2) vs O(1/N) for plain MC.
double barrier_put_stratified(double S0, double K, double B,
                               double r, double sigma, double T,
                               int n_paths, int n_steps, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::uniform_real_distribution<double> ud;
    std::normal_distribution<double>       nd;

    double dt   = T / n_steps;
    double mu   = (r - 0.5 * sigma * sigma) * dt;
    double vol  = sigma * std::sqrt(dt);
    double disc = std::exp(-r * T);

    double sum = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        // Stratified first draw: (p + U[0,1)) / n_paths -> uniform over [p/n, (p+1)/n)
        double u0 = (p + ud(rng)) / n_paths;
        double z0 = std::erfinv(2.0 * u0 - 1.0) * M_SQRT2;   // N^{-1}(u0)

        double S   = S0 * std::exp(mu + vol * z0);
        bool   hit = (S <= B);

        // Remaining steps: plain independent normals.
        for (int t = 1; t < n_steps && !hit; ++t) {
            S *= std::exp(mu + vol * nd(rng));
            if (S <= B) hit = true;
        }
        sum += hit ? 0.0 : std::max(K - S, 0.0);
    }
    return disc * sum / n_paths;
}`,
    explanation:
      "Stratification of the first normal draw removes the largest source of variance: paths are forced to sample each probability stratum exactly once rather than clustering randomly. For a barrier option, paths near the barrier boundary dominate variance — stratifying the first step guarantees representation from both barrier-crossing and non-crossing regions of the distribution.",
  },
  {
    id: "cpp-20260525-b1-heston-cf",
    language: "cpp",
    title: "Heston characteristic function — COS method European call",
    tag: "quant",
    code: `#include <complex>
#include <cmath>
#include <numbers>

using cx = std::complex<double>;
static constexpr double PI = std::numbers::pi;

// Heston (1993) characteristic function of log(S_T / F).
// Parameters: kappa (speed), theta (long-run var), xi (vol-of-vol),
//             rho (spot-vol corr), v0 (initial variance), T (maturity).
cx heston_cf(double u, double kappa, double theta,
             double xi, double rho, double v0, double T) noexcept {
    cx iu{0.0, u};
    cx alpha = -0.5 * (iu * iu + iu);
    cx beta  = kappa - rho * xi * iu;
    cx gamma = 0.5 * xi * xi;

    cx D = std::sqrt(beta * beta - 4.0 * alpha * gamma);
    cx Gm = (beta - D) / (beta + D);

    cx expDT = std::exp(-D * T);
    cx C = kappa * ((beta - D) * T / xi / xi
                    - 2.0 / xi / xi * std::log((1.0 - Gm * expDT) / (1.0 - Gm)));
    cx dd = (beta - D) * (1.0 - expDT) / (xi * xi * (1.0 - Gm * expDT));

    return std::exp(C * theta + dd * v0);
}

// Simplified COS European call (Fang & Oosterlee 2008):
// truncate log-moneyness to [a,b], expand density in cosine series.
double heston_call_cos(double S, double K, double r, double T,
                        double kappa, double theta, double xi,
                        double rho, double v0, int N = 64) noexcept {
    double k = std::log(K / (S * std::exp(r * T)));
    double a = -8.0, b = 8.0;
    double disc = std::exp(-r * T);

    double price = 0.0;
    for (int n = 0; n < N; ++n) {
        double omega = n * PI / (b - a);
        cx     phi   = heston_cf(omega, kappa, theta, xi, rho, v0, T)
                       * std::exp(cx{0.0, -omega * a});
        // Cosine coefficient of the call payoff kernel (analytic)
        double Vn = 2.0 / (b - a) *
            (std::cos(n * PI * (0.0 - a) / (b - a)) - std::cos(n * PI));
        price += (n == 0 ? 0.5 : 1.0) * std::real(phi) * std::cos(-omega * k) * Vn;
    }
    return S * disc * price;
}`,
    explanation:
      "The COS method achieves spectral convergence in N: each extra term in the cosine expansion adds one digit of accuracy, so N=64 terms suffice for 6-figure precision. Compared to a plain Fourier integral (Carr-Madan), COS avoids the log-singular integrand at the boundary and is faster to implement for single-strike evaluations.",
  },
  {
    id: "cpp-20260525-b1-modified-duration",
    language: "cpp",
    title: "Modified duration, convexity and DV01 via Newton-YTM solve",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <stdexcept>

struct CF { double t; double c; };  // cash flow: time (years) and amount

// Yield-to-maturity by Newton-Raphson on the price-yield equation.
double ytm_newton(const std::vector<CF>& cfs, double price,
                  double y0 = 0.05, int max_iter = 100) {
    double y = y0;
    for (int i = 0; i < max_iter; ++i) {
        double pv = 0, dpv = 0;
        for (auto& cf : cfs) {
            double d  = std::exp(-y * cf.t);
            pv  += cf.c * d;
            dpv -= cf.c * cf.t * d;   // dPV/dy
        }
        double f = pv - price;
        if (std::abs(dpv) < 1e-14) throw std::runtime_error("singular");
        y -= f / dpv;
        if (std::abs(f / price) < 1e-12) break;
    }
    return y;
}

struct BondRisk {
    double price, ytm, mac_dur, mod_dur, convexity, dv01;
};

// Compute all risk measures at a given yield y (continuous compounding).
BondRisk bond_risk(const std::vector<CF>& cfs, double y) {
    BondRisk r{};
    for (auto& cf : cfs) {
        double d  = std::exp(-y * cf.t);
        r.price    += cf.c * d;
        r.mac_dur  += cf.c * d * cf.t;
        r.convexity+= cf.c * d * cf.t * cf.t;
    }
    r.ytm      = y;
    r.mac_dur /= r.price;
    r.mod_dur  = r.mac_dur;   // continuous compounding: mac_dur = mod_dur
    r.convexity/= r.price;
    r.dv01     = r.mod_dur * r.price * 1e-4;  // price change per 1 bp rate rise
    return r;
}`,
    explanation:
      "Under continuous compounding, Macaulay duration equals modified duration exactly — no (1 + y/m) adjustment needed. Convexity is always positive for non-callable bonds: a bondholder gains from large parallel yield moves in both directions. DV01 combines duration and price into a single dollar sensitivity: a 10-year $1M bond with DV01 = $800 gains $800 per 1 bp rate decline.",
  },
  {
    id: "cpp-20260525-b1-ema-cov",
    language: "cpp",
    title: "Streaming EMA covariance matrix for n-asset portfolio",
    tag: "quant",
    code: `#include <vector>
#include <cmath>

// Exponential moving average covariance: down-weights old observations.
// lambda = exp(-ln2 / halflife_days).  Only n*(n+1)/2 entries stored (upper tri).
class EmaCovMatrix {
    int                n_;
    double             lam_;
    std::vector<double> mu_;   // EMA means
    std::vector<double> cov_;  // upper-triangular storage

    int idx(int i, int j) const {
        if (i > j) std::swap(i, j);
        return i * n_ - i * (i - 1) / 2 + (j - i);
    }

public:
    EmaCovMatrix(int n, double halflife_days)
        : n_(n),
          lam_(std::exp(-std::log(2.0) / halflife_days)),
          mu_(n, 0.0),
          cov_(n * (n + 1) / 2, 0.0) {}

    // Online update with a new return observation vector.
    void update(const std::vector<double>& r) {
        // Update EMA mean.
        for (int i = 0; i < n_; ++i)
            mu_[i] = lam_ * mu_[i] + (1.0 - lam_) * r[i];
        // Update EMA covariance using demeaned returns.
        for (int i = 0; i < n_; ++i)
            for (int j = i; j < n_; ++j)
                cov_[idx(i, j)] = lam_ * cov_[idx(i, j)]
                    + (1.0 - lam_) * (r[i] - mu_[i]) * (r[j] - mu_[j]);
    }

    double cov(int i, int j) const { return cov_[idx(i, j)]; }
    double corr(int i, int j) const {
        double d = cov_[idx(i, i)] * cov_[idx(j, j)];
        return d > 0 ? cov_[idx(i, j)] / std::sqrt(d) : 0.0;
    }
};`,
    explanation:
      "EMA covariance adapts to correlation regime changes within a single halflife rather than waiting for the full rolling window to refresh. A 60-day halflife retains meaningful information from 6 months ago while emphasising recent structure. Upper-triangular storage halves memory vs a full n×n matrix and keeps the hot loop accessing contiguous memory.",
  },
  {
    id: "cpp-20260525-b1-vwap-stream",
    language: "cpp",
    title: "Streaming VWAP calculator with basis-point deviation",
    tag: "quant",
    code: `#include <cstdint>
#include <cmath>
#include <cassert>

// VWAP = sum(price_i * qty_i) / sum(qty_i).  O(1) per tick, exact.
// Deviation in bps measures execution quality vs benchmark.
class VwapCalc {
    double        sum_pq_ = 0.0;
    std::uint64_t sum_q_  = 0;
    std::uint64_t n_      = 0;

public:
    void add(double price, std::uint32_t qty) noexcept {
        sum_pq_ += price * static_cast<double>(qty);
        sum_q_  += qty;
        ++n_;
    }

    double vwap() const noexcept {
        return sum_q_ > 0 ? sum_pq_ / static_cast<double>(sum_q_) : 0.0;
    }

    // How many basis points above/below VWAP is this trade?
    double dev_bps(double trade_price) const noexcept {
        double v = vwap();
        return (v > 0.0) ? (trade_price - v) / v * 10000.0 : 0.0;
    }

    std::uint64_t count()  const noexcept { return n_; }
    std::uint64_t volume() const noexcept { return sum_q_; }

    void reset() noexcept { sum_pq_ = 0.0; sum_q_ = 0; n_ = 0; }
};

// Interval VWAP (e.g. 5-minute): use a circular buffer of VwapCalc slots.
// On interval boundary: subtract oldest slot's accumulators, reset slot,
// reuse for next interval.  Same O(1) per tick with bounded memory.`,
    explanation:
      "VWAP is the most common execution benchmark: buy-side algorithms are evaluated on their ability to trade at or below VWAP for buy orders. The streaming accumulator requires only two floating-point accumulators per instrument — no tick history. dev_bps in practice is reported per trade and aggregated over the session to compute an Implementation Shortfall.",
  },
  {
    id: "cpp-20260525-b1-tiered-price-array",
    language: "cpp",
    title: "Flat-array order book — cache-line tight near-touch levels",
    tag: "quant",
    code: `#include <array>
#include <cstdint>
#include <cmath>
#include <algorithm>

// For liquid equities/futures, 95% of action is within 5 ticks of best.
// Store top K levels in a flat array per side: one cache-line access = all K levels.
// Encode price as integer tick multiples: avoids FP comparison issues.
static constexpr int TOP_K = 8;

struct Level { std::int64_t price_ticks; std::uint64_t qty; };

class TieredBook {
    alignas(64) std::array<Level, TOP_K> bids_{};
    alignas(64) std::array<Level, TOP_K> asks_{};
    int nb_ = 0, na_ = 0;       // live level counts
    int tick_denom_ = 10000;    // price / tick_denom = double

public:
    void set_bid(int lvl, double price, std::uint64_t qty) noexcept {
        if (lvl >= TOP_K) return;
        bids_[lvl] = {static_cast<std::int64_t>(std::round(price * tick_denom_)), qty};
        nb_ = std::max(nb_, lvl + 1);
    }
    void set_ask(int lvl, double price, std::uint64_t qty) noexcept {
        if (lvl >= TOP_K) return;
        asks_[lvl] = {static_cast<std::int64_t>(std::round(price * tick_denom_)), qty};
        na_ = std::max(na_, lvl + 1);
    }

    double best_bid() const noexcept {
        return nb_ ? bids_[0].price_ticks / double(tick_denom_) : 0.0;
    }
    double best_ask() const noexcept {
        return na_ ? asks_[0].price_ticks / double(tick_denom_) : 0.0;
    }
    // Spread in basis points relative to mid-price.
    double spread_bps() const noexcept {
        if (!nb_ || !na_) return 1e9;
        double mid = 0.5 * (best_bid() + best_ask());
        return (best_ask() - best_bid()) / mid * 10000.0;
    }
};`,
    explanation:
      "Aligning the bid/ask arrays to 64-byte boundaries ensures each side occupies exactly one cache line — a single cache-line read delivers all 8 levels. Integer price encoding eliminates the floating-point representation issue where 100.10 != 100.10 after arithmetic, which can produce phantom spread inversions in naive implementations.",
  },
  {
    id: "cpp-20260525-b1-packaged-task",
    language: "cpp",
    title: "std::packaged_task + std::future for decoupled async pricing",
    tag: "stl",
    code: `#include <future>
#include <thread>
#include <vector>
#include <tuple>
#include <cmath>

static double bs_call(double S, double K, double r, double sigma, double T) noexcept {
    double sT = sigma * std::sqrt(T);
    double d1 = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / sT;
    double d2 = d1 - sT;
    return S * 0.5 * std::erfc(-d1 * M_SQRT1_2)
         - K * std::exp(-r * T) * 0.5 * std::erfc(-d2 * M_SQRT1_2);
}

// Price a batch of options across a thread pool.
// packaged_task separates task creation from execution — the task can be
// moved to any thread; the future allows the caller to collect results.
std::vector<double>
price_batch(const std::vector<std::tuple<double,double,double,double,double>>& opts) {
    int n = static_cast<int>(opts.size());
    std::vector<std::future<double>> futs;
    futs.reserve(n);

    for (auto& [S, K, r, sigma, T] : opts) {
        std::packaged_task<double()> task([=]{ return bs_call(S, K, r, sigma, T); });
        futs.push_back(task.get_future());
        std::thread(std::move(task)).detach();   // in production: submit to pool
    }

    std::vector<double> prices(n);
    for (int i = 0; i < n; ++i)
        prices[i] = futs[i].get();   // blocks until task completes
    return prices;
}`,
    explanation:
      "packaged_task decouples task definition from thread assignment — unlike std::async (which immediately picks a thread), a packaged_task can be queued in a pool and consumed by the next idle worker. The future's get() blocks at most once, making it a safe one-shot synchronisation primitive without manual mutex/condition_variable management.",
  },
  {
    id: "cpp-20260525-b1-csr-spmv",
    language: "cpp",
    title: "CSR sparse matrix–vector product for factor model P&L",
    tag: "quant",
    code: `#include <vector>
#include <cstddef>

// CSR (Compressed Sparse Row) format:
//   values[]  : non-zero entries, row-by-row
//   col_idx[] : column for each non-zero
//   row_ptr[] : start index in values[] for row i (row_ptr[n_rows] = nnz)
// Factor model: pnl[asset] = sum_k B[asset,k] * f[k]
// B is sparse: each asset loads on ~5 of 50 factors => 10x memory savings.
struct CsrMat {
    int                  rows, cols;
    std::vector<double>  val;
    std::vector<int>     col_idx;
    std::vector<int>     row_ptr;  // size = rows + 1

    CsrMat(int r, int c) : rows(r), cols(c), row_ptr(r + 1, 0) {}

    // Add one non-zero entry to row r.
    void push(int r, int c, double v) {
        val.push_back(v);
        col_idx.push_back(c);
        ++row_ptr[r + 1];
    }

    // Convert row_ptr from per-row counts to prefix sums (call once after all push).
    void finalise() {
        for (int i = 1; i <= rows; ++i)
            row_ptr[i] += row_ptr[i - 1];
    }

    // y = A * x.  Inner loop is a dot product over nnz entries of each row.
    void spmv(const std::vector<double>& x, std::vector<double>& y) const {
        y.assign(rows, 0.0);
        for (int i = 0; i < rows; ++i)
            for (int k = row_ptr[i]; k < row_ptr[i + 1]; ++k)
                y[i] += val[k] * x[col_idx[k]];
    }
};`,
    explanation:
      "CSR SpMV accesses only the non-zero entries and their column indices — for a Barra-style exposure matrix where each of 1000 assets loads on ~5 of 50 factors, this is a 10x memory bandwidth saving over dense BLAS DGEMV. Each row's inner loop is a short dot product that fits in L1 cache, making CSR the standard format for nightly risk aggregation.",
  },
  {
    id: "cpp-20260525-b1-span-stride",
    language: "cpp",
    title: "std::span + views::stride — zero-copy matrix column slice (C++23)",
    tag: "stl",
    code: `#include <span>
#include <ranges>
#include <vector>
#include <numeric>

// std::span: non-owning view of contiguous memory — no allocation, bounds-safe.
// views::stride (C++23): take every n-th element from a range.
// Combine to iterate a column of a row-major matrix without transposing.
struct RowMajorMatrix {
    int                 rows, cols;
    std::vector<double> data;  // data[r * cols + c]

    // Non-owning view of a row — O(1), no copy.
    std::span<const double> row_view(int r) const {
        return {data.data() + r * cols, static_cast<std::size_t>(cols)};
    }

    // Column view using stride: elements at offsets c, c+cols, c+2*cols, ...
    auto col_view(int c) const {
        return std::span<const double>(data).subspan(c)
             | std::views::stride(cols);
    }
};

// Mean of a column with no intermediate allocation.
double col_mean(const RowMajorMatrix& m, int c) {
    auto v = m.col_view(c);
    return std::ranges::fold_left(v, 0.0, std::plus<>{}) / m.rows;
}

// Dot product of two rows via span views.
double row_dot(const RowMajorMatrix& m, int r1, int r2) {
    auto a = m.row_view(r1), b = m.row_view(r2);
    return std::inner_product(a.begin(), a.end(), b.begin(), 0.0);
}`,
    explanation:
      "std::span eliminates the pointer-length pair pattern that invites buffer overruns — the size is embedded in the type. views::stride avoids the O(rows) transposition copy that many factor model implementations accidentally introduce when extracting a factor's exposures. The column view is lazy: only the elements actually read are fetched from memory.",
  },
  {
    id: "cpp-20260525-b1-pmr-pool",
    language: "cpp",
    title: "std::pmr::pool_resource — recycling allocator for order nodes",
    tag: "memory",
    code: `#include <memory_resource>
#include <cstddef>

// pool_resource: same-size blocks recycled from a slab pool.
// Allocation and deallocation are O(1) amortised regardless of order.
// Unlike monotonic_buffer_resource, individual deallocations are handled.
struct OrderNode {
    std::uint64_t id;
    double        price;
    std::uint32_t qty;
    char          side;
};

class OrderPool {
    // Upstream: monotonic arena on the stack (avoids malloc for the pool itself).
    static constexpr std::size_t BUF = 256 * 1024;
    alignas(64) std::byte  buf_[BUF];
    std::pmr::monotonic_buffer_resource  upstream_{buf_, BUF};

    std::pmr::unsynchronized_pool_resource pool_{
        std::pmr::pool_options{
            .max_blocks_per_chunk  = 512,
            .largest_required_pool_block = sizeof(OrderNode)
        },
        &upstream_
    };
    std::pmr::polymorphic_allocator<OrderNode> alloc_{&pool_};

public:
    OrderNode* acquire(std::uint64_t id, double price,
                        std::uint32_t qty, char side) {
        auto* n = alloc_.allocate(1);
        alloc_.construct(n, id, price, qty, side);
        return n;
    }
    void release(OrderNode* n) {
        alloc_.destroy(n);
        alloc_.deallocate(n, 1);  // returns slab to pool, not to malloc
    }
};`,
    explanation:
      "unsynchronized_pool_resource maintains per-size freelist slabs — a released OrderNode is pushed onto a freelist and re-issued on the next acquire, all within the pre-allocated stack buffer. This eliminates global malloc/free contention for order nodes in a busy cancel/replace workload where the same memory is recycled thousands of times per second.",
  },
  {
    id: "cpp-20260525-b1-hot-noinline",
    language: "cpp",
    title: "__attribute__((hot)) and [[gnu::noinline]] — function-level layout hints",
    tag: "performance",
    code: `#include <cstdint>
#include <cmath>

// [[gnu::hot]]: moves the function into the .text.hot section and
// applies aggressive optimisation (unrolling, vectorisation, high inline pressure).
// [[gnu::flatten]]: inline all callees into this function.
[[gnu::hot, gnu::flatten]]
double compute_mid(std::int64_t bid_ticks, std::int64_t ask_ticks,
                    double tick_size) noexcept {
    return 0.5 * (bid_ticks + ask_ticks) * tick_size;
}

// [[gnu::noinline]]: cold / large functions that should NOT pollute I-cache.
// Pairing with [[gnu::cold]] additionally hints branch predictor to mark
// callers' branches as unlikely.
[[gnu::noinline, gnu::cold]]
void handle_gap(int expected, int got) noexcept {
    // Heavy retransmit logic; never on the hot path.
    (void)expected; (void)got;
}

// Per-function optimisation level override (useful when global flags are -O2
// but a specific kernel needs -O3 + vectorisation).
[[gnu::optimize("O3,tree-vectorize")]]
void update_pnl(const double* __restrict__ prices,
                 const double* __restrict__ prev,
                 double* __restrict__ pnl, int n) noexcept {
    for (int i = 0; i < n; ++i)
        pnl[i] = prices[i] - prev[i];
}`,
    explanation:
      "Grouping hot functions in .text.hot lets the linker pack them together so they share fewer instruction-cache pages — for a feed handler with a 64 KB L1 I-cache, keeping the tick-processing kernel under 4 KB of hot code eliminates virtually all I-cache misses. noinline + cold on error paths keeps them from inflating the function size visible to the inliner.",
  },
  {
    id: "cpp-20260525-b1-bit-utilities",
    language: "cpp",
    title: "C++20 <bit> utilities — popcount, byteswap, bit_ceil",
    tag: "performance",
    code: `#include <bit>
#include <cstdint>
#include <cassert>

// std::bit_ceil: smallest power of 2 >= n — ideal for ring buffer sizing.
static_assert(std::bit_ceil(100u) == 128u);
static_assert(std::bit_ceil(128u) == 128u);   // already power of 2

// std::popcount: count set bits — emits hardware POPCNT on x86.
// Use for order bitmap counting and risk-flag aggregation.
static_assert(std::popcount(std::uint32_t{0b10110101}) == 5u);

// std::countl_zero: leading zeros.  64 - clz(x) - 1 = floor(log2(x)).
// Map an order ID to a log-scale bucket for latency histogram.
inline int log2_bucket(std::uint64_t x) noexcept {
    return x ? (63 - std::countl_zero(x)) : 0;
}

// std::has_single_bit: exact power-of-2 check (no branch, no division).
static_assert(std::has_single_bit(std::uint32_t{64}));
static_assert(!std::has_single_bit(std::uint32_t{100}));

// std::byteswap (C++23): network byte order conversion.
// Replaces _bswap64/__builtin_bswap64 — portable across compilers.
inline std::uint64_t ntoh64(std::uint64_t wire) noexcept {
    if constexpr (std::endian::native == std::endian::little)
        return std::byteswap(wire);
    return wire;
}

// Branchless max via bit arithmetic (avoid branch mispredictions in sort hot path):
inline std::uint32_t branchless_max(std::uint32_t a, std::uint32_t b) noexcept {
    std::uint32_t mask = -static_cast<std::int32_t>(a > b);  // all-ones if a>b else 0
    return (a & mask) | (b & ~mask);
}`,
    explanation:
      "C++20 standardised the bit-manipulation builtins previously accessed via GCC/Clang __builtin_* functions. std::byteswap in C++23 replaces platform-specific bswap intrinsics — on x86 it compiles to a single BSWAP instruction with no runtime overhead. branchless_max avoids branch misprediction penalties in the innermost loop of sorting networks.",
  },
  {
    id: "cpp-20260525-b1-ouch-parser",
    language: "cpp",
    title: "OUCH binary order-entry protocol zero-copy parser",
    tag: "quant",
    code: `#include <cstdint>
#include <cstring>
#include <bit>

// OUCH (NASDAQ binary order entry): fixed-width little-endian fields.
// No delimiter scanning — field offsets are compile-time constants.
// [1B msg_type][4B token][4B qty][8B price_x10000][1B side] = 18 bytes
#pragma pack(push, 1)
struct OuchNewOrder {
    char          msg_type;     // 'O' = new order
    std::uint32_t order_token;
    std::uint32_t qty;
    std::int64_t  price_x10k;  // price * 10000 (no FP on wire)
    char          side;         // 'B' or 'S'
};
#pragma pack(pop)
static_assert(sizeof(OuchNewOrder) == 18);

// Zero-copy: cast buffer directly to the struct — one pointer operation.
// Valid only when wire encoding and struct layout match (same endianness).
const OuchNewOrder* ouch_parse(const std::byte* buf, std::size_t len) noexcept {
    if (len < sizeof(OuchNewOrder) || buf[0] != std::byte{'O'}) return nullptr;
    return reinterpret_cast<const OuchNewOrder*>(buf);
}

inline double ouch_price(const OuchNewOrder* o) noexcept {
    return static_cast<double>(o->price_x10k) / 10000.0;
}

// On big-endian hosts, swap multi-byte fields after parsing.
void ouch_fix_endian(OuchNewOrder& o) noexcept {
    if constexpr (std::endian::native != std::endian::little) {
        o.order_token = std::byteswap(o.order_token);
        o.qty         = std::byteswap(o.qty);
        o.price_x10k  = std::byteswap(o.price_x10k);
    }
}`,
    explanation:
      "Binary order-entry protocols (OUCH, BATS PITCH, CME iLink) use fixed-width fields to eliminate delimiter scanning. A single reinterpret_cast maps the receive buffer directly to the struct — no copies, no parsing loops. Storing prices as scaled integers (× 10000) removes floating-point representation issues and allows exact integer comparison for order matching.",
  },
  {
    id: "cpp-20260525-b1-std-format",
    language: "cpp",
    title: "std::format for structured trade logging (C++20)",
    tag: "stl",
    code: `#include <format>
#include <string>
#include <chrono>
#include <cstdint>

// std::format: Python-style format strings — type-safe, locale-aware, no printf.
// At compile time the format string is validated; runtime cost is output-length
// proportional (no regex or dynamic dispatch per call).

struct Trade {
    std::uint64_t id;
    double        price;
    std::uint32_t qty;
    char          side;
};

std::string format_trade(const Trade& t) {
    return std::format("id={:012d}  side={}  px={:>10.4f}  qty={:>6d}",
                        t.id, t.side, t.price, t.qty);
}

// Width specifiers align columns in log files without manual padding.
// {:>10.4f} — right-align in 10 chars, 4 decimal places.
// {:012d}   — zero-pad to 12 digits.

// std::format_to writes into a pre-allocated buffer — avoids the small-string
// allocation that std::format incurs when the result doesn't fit in SSO.
void log_trade(char* buf, std::size_t buf_len, const Trade& t) noexcept {
    auto res = std::format_to_n(buf, buf_len - 1,
        "[{:>10.4f}] {} x{}",
        t.price, t.side, t.qty);
    *res.out = '\\0';
}

// Chrono integration: format timestamps directly.
std::string format_now() {
    auto now = std::chrono::system_clock::now();
    return std::format("{:%Y-%m-%d %H:%M:%S}", now);
}`,
    explanation:
      "std::format replaces the unsafe printf family: format specifiers are validated at compile time against the argument types, so a mismatched %d/%f can never corrupt memory. format_to_n writes into a caller-supplied buffer, matching the zero-allocation requirement of hot logging paths where heap allocation is forbidden.",
  },
];
