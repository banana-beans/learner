import type { Snippet } from "./types";

export const cppSnippets20260527B1: Snippet[] = [
  {
    id: "cpp-20260527-b1-generator",
    language: "cpp",
    title: "std::generator<T> (C++23) — lazy OHLC bar stream",
    tag: "stl",
    code: `// Requires C++23 + GCC 14 / Clang 18 / MSVC 17.10+
// std::generator: a range-based stackless coroutine that yields values
// on demand.  No threads, no callbacks — the caller pulls each bar.
#include <generator>   // C++23
#include <cstdint>
#include <random>
#include <algorithm>

struct Bar {
    std::uint64_t ts_ns;
    double open, high, low, close;
    std::uint32_t volume;
};

// Each co_yield suspends here and resumes on the next range iteration.
// The tick accumulation state lives in the coroutine frame — no struct needed.
std::generator<Bar> tick_to_bar(double seed_price, double bar_secs) {
    std::mt19937_64 rng(42);
    std::normal_distribution<> nd(0.0, 0.001);   // 10 bps per tick

    double px   = seed_price;
    double open = px, hi = px, lo = px;
    std::uint32_t vol = 0;
    std::uint64_t bar_start_ns = 0;

    while (true) {
        px   *= (1.0 + nd(rng));              // GBM tick
        hi    = std::max(hi, px);
        lo    = std::min(lo, px);
        ++vol;

        // Simulate elapsed time: pretend each tick is bar_secs / 1000 wide.
        bar_start_ns += static_cast<std::uint64_t>(bar_secs * 1e6);
        if (bar_start_ns % static_cast<std::uint64_t>(bar_secs * 1e9) == 0) {
            co_yield Bar{bar_start_ns, open, hi, lo, px, vol};
            open = px; hi = px; lo = px; vol = 0;   // reset for next bar
        }
    }
}

int main() {
    int count = 0;
    for (Bar b : tick_to_bar(100.0, 60.0)) {   // 1-minute bars
        (void)b;
        if (++count == 5) break;    // pull exactly 5 bars then stop
    }
}`,
    explanation:
      "std::generator turns an infinite tick stream into a lazily-evaluated range: the coroutine frame is stack-allocated (no heap in typical implementations) and only resumes when the caller asks for the next bar. This pull-based design inverts the push-callback model used in most feed handlers, making the aggregation logic trivially composable with views::filter, views::take, and other range adaptors.",
  },
  {
    id: "cpp-20260527-b1-move-only-fn",
    language: "cpp",
    title: "std::move_only_function (C++23) — non-copyable strategy callbacks",
    tag: "stl",
    code: `#include <functional>  // C++23 for move_only_function
#include <memory>
#include <cstdint>
#include <vector>

// std::function requires its stored callable to be CopyConstructible.
// std::move_only_function relaxes this: accepts move-only closures (those
// capturing unique_ptr, file descriptors, socket handles, etc.).
// const-qualified version: operator() is const, preventing accidental mutation.

struct Fill { std::uint64_t order_id; double price; std::uint32_t qty; };

// A position book that owns its hedge allocation — not copyable.
struct PositionBook {
    std::unique_ptr<std::vector<Fill>> fills
        = std::make_unique<std::vector<Fill>>();
    void record(const Fill& f) { fills->push_back(f); }
    std::size_t size() const   { return fills->size(); }
};

// Event bus: stores a list of fill handlers.
class FillBus {
    std::vector<std::move_only_function<void(const Fill&)>> handlers_;
public:
    void subscribe(std::move_only_function<void(const Fill&)> h) {
        handlers_.push_back(std::move(h));
    }
    void publish(const Fill& f) {
        for (auto& h : handlers_) h(f);
    }
};

int main() {
    FillBus bus;

    // Capture a move-only object — impossible with std::function.
    PositionBook book;
    bus.subscribe([b = std::move(book)](const Fill& f) mutable {
        b.record(f);
    });

    // Lambda with no state (trivially copyable, also fine here).
    bus.subscribe([](const Fill& f) {
        (void)f;  // log fill
    });

    bus.publish({42, 100.5, 100});
    bus.publish({43, 100.6,  50});
}`,
    explanation:
      "std::move_only_function is the right choice wherever the callable captures a unique resource: a file handle, a network socket, or a heap-allocated position table. Using std::function for such callbacks either forces an unnecessary shared_ptr or fails to compile. The const-qualified version (std::move_only_function<void(const Fill&) const>) additionally prevents the handler from mutating its own closed-over state, which is useful for thread-safety analysis.",
  },
  {
    id: "cpp-20260527-b1-adjacent-view",
    language: "cpp",
    title: "std::views::adjacent<N> (C++23) — N-period tick analytics",
    tag: "stl",
    code: `#include <ranges>
#include <vector>
#include <cmath>
#include <numeric>
#include <algorithm>

// views::adjacent<N> (C++23): lazily produces overlapping N-tuples of
// consecutive elements — the C++ equivalent of Python's zip(v, v[1:]).
// No allocation; compile-time N means each tuple is a structured binding.

// 3-period momentum: up if price now > price 3 bars ago.
std::vector<int> momentum_3(const std::vector<double>& px) {
    std::vector<int> sig;
    sig.reserve(px.size());
    for (auto [a, b, c] : px | std::views::adjacent<3>)
        sig.push_back(c > a ? 1 : -1);
    return sig;
}

// Realised vol: std dev of 1-bar log-returns over the whole series.
double realised_vol_annualised(const std::vector<double>& px) {
    std::vector<double> r;
    r.reserve(px.size() - 1);
    for (auto [p0, p1] : px | std::views::adjacent<2>)
        r.push_back(std::log(p1 / p0));
    if (r.size() < 2) return 0.0;
    double mean = std::accumulate(r.begin(), r.end(), 0.0) / r.size();
    double var  = std::transform_reduce(r.begin(), r.end(), 0.0,
        std::plus<>{}, [mean](double x){ return (x-mean)*(x-mean); })
        / (r.size() - 1);
    return std::sqrt(var * 252.0);  // annualise daily returns
}

// Count local extrema (peaks + troughs) — used in zigzag indicators.
int count_extrema(const std::vector<double>& px) {
    int cnt = 0;
    for (auto [a, b, c] : px | std::views::adjacent<3>)
        if ((b > a && b > c) || (b < a && b < c)) ++cnt;
    return cnt;
}

int main() {
    std::vector<double> prices = {100, 101, 99, 102, 98, 103, 97, 104};
    auto sig = momentum_3(prices);
    double vol = realised_vol_annualised(prices);
    int   ext  = count_extrema(prices);
    (void)sig; (void)vol; (void)ext;
}`,
    explanation:
      "views::adjacent<N> eliminates manual index arithmetic for sliding-window calculations: adjacent<2> replaces the common for(i=1; i<n; ++i) ret[i-1] = f(v[i-1], v[i]) pattern. The compile-time N lets the compiler pack the tuple into registers and unroll the inner loop. For realised-vol and momentum indicators running on hundreds of symbols every tick, this matters.",
  },
  {
    id: "cpp-20260527-b1-ms-queue",
    language: "cpp",
    title: "Michael-Scott lock-free MPMC queue (two-pointer sentinel)",
    tag: "concurrency",
    code: `#include <atomic>
#include <memory>
#include <optional>

// Michael & Scott (1996): two-CAS non-blocking FIFO.
// Head points to a dummy sentinel; tail lags or equals head.
// Enqueue: swing tail->next to new node, then advance tail.
// Dequeue: advance head past the sentinel, which becomes the new sentinel.
// Memory management: raw node pool or hazard pointers in production.
template<typename T>
class MSQueue {
    struct Node {
        T                  val{};
        std::atomic<Node*> next{nullptr};
    };
    std::atomic<Node*> head_;
    std::atomic<Node*> tail_;

public:
    MSQueue() {
        // Sentinel node: head == tail initially
        auto* s = new Node{};
        head_.store(s, std::memory_order_relaxed);
        tail_.store(s, std::memory_order_relaxed);
    }

    ~MSQueue() {
        while (dequeue()) {}                 // drain
        delete head_.load(std::memory_order_relaxed); // delete sentinel
    }

    void enqueue(T val) {
        auto* n = new Node{};
        n->val  = std::move(val);
        Node* t;
        for (;;) {
            t          = tail_.load(std::memory_order_acquire);
            Node* next = t->next.load(std::memory_order_acquire);
            if (t == tail_.load(std::memory_order_acquire)) {   // consistent snapshot
                if (!next) {
                    // Tail->next is null: try to link new node
                    if (t->next.compare_exchange_weak(next, n,
                            std::memory_order_release,
                            std::memory_order_relaxed))
                        break;  // success
                } else {
                    // Tail is lagging — help advance it
                    tail_.compare_exchange_weak(t, next,
                            std::memory_order_release,
                            std::memory_order_relaxed);
                }
            }
        }
        // Try to swing tail; OK if another thread already did it
        tail_.compare_exchange_weak(t, n,
                std::memory_order_release,
                std::memory_order_relaxed);
    }

    std::optional<T> dequeue() {
        for (;;) {
            Node* h    = head_.load(std::memory_order_acquire);
            Node* t    = tail_.load(std::memory_order_acquire);
            Node* next = h->next.load(std::memory_order_acquire);
            if (h == head_.load(std::memory_order_acquire)) {
                if (h == t) {
                    if (!next) return std::nullopt;   // empty
                    tail_.compare_exchange_weak(t, next,
                            std::memory_order_release,
                            std::memory_order_relaxed);
                } else {
                    T val = next->val;
                    if (head_.compare_exchange_weak(h, next,
                            std::memory_order_release,
                            std::memory_order_relaxed)) {
                        delete h;   // h was the old sentinel
                        return val;
                    }
                }
            }
        }
    }
};`,
    explanation:
      "The Michael-Scott queue is the canonical lock-free MPMC queue: it avoids locks by using two CAS operations (one to link the new node, one to swing the tail pointer). The sentinel node ensures head never overtakes tail, and the 'help tail' step means no thread ever blocks waiting for a slow enqueuer. In HFT, MS queues appear in the path between the feed handler thread and the strategy thread where a mutex would add unacceptable jitter.",
  },
  {
    id: "cpp-20260527-b1-prefetch",
    language: "cpp",
    title: "__builtin_prefetch / _mm_prefetch — sequential scan optimisation",
    tag: "performance",
    code: `#include <cstdint>
#include <vector>
#include <cmath>
#ifdef _MSC_VER
#  include <intrin.h>
#  define PREFETCH_R(ptr) _mm_prefetch(reinterpret_cast<const char*>(ptr), _MM_HINT_T0)
#else
#  define PREFETCH_R(ptr) __builtin_prefetch(ptr, 0 /*read*/, 3 /*L1 locality*/)
#endif

// Software prefetch: tell the CPU to load data from memory into the L1/L2
// cache N iterations ahead of where the loop is currently executing.
// Useful when the array is too large to fit in L1 and access is sequential.
// Optimal prefetch distance: memory latency / loop body latency (cycles).
// Rule of thumb for DDR4: prefetch ~16-32 elements ahead.

struct PriceLevel { double price; std::uint32_t qty; std::uint32_t order_count; };

// Compute total notional on one side of the book.
double sum_notional(const std::vector<PriceLevel>& levels, int depth) noexcept {
    constexpr int PREFETCH_DIST = 16;   // prefetch 16 elements ahead
    int n = std::min(depth, static_cast<int>(levels.size()));
    double total = 0.0;

    for (int i = 0; i < n; ++i) {
        // Prefetch the element PREFETCH_DIST steps ahead
        if (i + PREFETCH_DIST < n)
            PREFETCH_R(&levels[i + PREFETCH_DIST]);

        total += levels[i].price * levels[i].qty;
    }
    return total;
}

// VWAP across a pre-sorted price array — prefetch write target too.
double vwap(const double* __restrict__ prices,
            const std::uint32_t* __restrict__ qtys, int n) noexcept {
    constexpr int PD = 16;
    double pv = 0.0, tv = 0.0;
    for (int i = 0; i < n; ++i) {
        if (i + PD < n) {
            PREFETCH_R(prices + i + PD);
            PREFETCH_R(qtys   + i + PD);
        }
        double q = qtys[i];
        pv += prices[i] * q;
        tv += q;
    }
    return tv > 0 ? pv / tv : 0.0;
}

int main() {
    std::vector<PriceLevel> bids(1000, {100.0, 100, 3});
    double notional = sum_notional(bids, 20);
    (void)notional;
}`,
    explanation:
      "Software prefetch hides memory latency by overlapping computation with data fetch: the CPU initiates a cache-line load while the current iteration's arithmetic is still executing. The optimal prefetch distance depends on the loop's arithmetic intensity — for a tight add-multiply loop on a modern core, 16-32 elements ahead covers the ~100ns DRAM latency. Don't over-prefetch: too far ahead evicts other data from L1, causing net slowdown.",
  },
  {
    id: "cpp-20260527-b1-sbe-codec",
    language: "cpp",
    title: "SBE (Simple Binary Encoding) fixed-layout message codec",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <array>
#include <span>

// SBE (Simple Binary Encoding, FIX protocol extension):
// All fields at compile-time fixed offsets; values in little-endian by default.
// Zero copy: encoder writes directly into a network buffer; decoder maps in-place.
// No heap allocation, no virtual dispatch — latency dominated by memcpy/store.
//
// Message layout (New Order Single, minimal):
//   offset  0: uint64  ClOrdID
//   offset  8: double  Price       (8-byte IEEE 754)
//   offset 16: uint32  Qty
//   offset 20: char    Side        ('B' buy, 'S' sell)
//   offset 21: char[7] Symbol      (null-padded)
// Total: 28 bytes

#pragma pack(push, 1)
struct SbeNewOrder {
    std::uint64_t cl_ord_id;
    double        price;
    std::uint32_t qty;
    char          side;
    char          symbol[7];   // fixed-length, null-padded
};
#pragma pack(pop)
static_assert(sizeof(SbeNewOrder) == 28);

// Encoder: fills the buffer and returns a span over the written bytes.
std::span<const std::byte> encode_new_order(
        std::span<std::byte, 28> buf,
        std::uint64_t id, double px, std::uint32_t qty,
        char side, std::string_view sym) noexcept {
    auto* m = reinterpret_cast<SbeNewOrder*>(buf.data());
    m->cl_ord_id = id;
    m->price     = px;
    m->qty       = qty;
    m->side      = side;
    std::memset(m->symbol, 0, 7);
    std::memcpy(m->symbol, sym.data(), std::min(sym.size(), std::size_t{6}));
    return {buf.data(), 28};
}

// Decoder: interprets a raw network buffer — zero-copy pointer cast.
const SbeNewOrder* decode_new_order(std::span<const std::byte> buf) noexcept {
    if (buf.size() < 28) return nullptr;
    return reinterpret_cast<const SbeNewOrder*>(buf.data());
}

int main() {
    alignas(8) std::array<std::byte, 28> buf{};
    auto wire = encode_new_order(buf, 1001, 100.25, 500, 'B', "AAPL");
    auto* msg  = decode_new_order(wire);
    (void)msg;
}`,
    explanation:
      "SBE achieves sub-microsecond encoding/decoding because every field has a compile-time fixed offset — no tag-value scanning, no varint decoding, no heap allocation. The pragma pack(push, 1) removes padding to match the wire format exactly. In production, a code-generation tool (SBE Tool) generates the structs from an XML schema; hand-writing them is error-prone but illustrates the principle.",
  },
  {
    id: "cpp-20260527-b1-vasicek-zcb",
    language: "cpp",
    title: "Vasicek model — closed-form ZCB price + Monte Carlo validation",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <random>
#include <numeric>

// Vasicek (1977): dr = kappa*(theta - r)*dt + sigma*dW
// Oldest affine model; rates CAN go negative (unlike CIR).
// Closed form: P(0,T) = exp(A(T) - B(T)*r0)
// where B(T) = (1 - exp(-kappa*T)) / kappa
//       A(T) = (B(T) - T)*(kappa^2 * theta - sigma^2/2) / kappa^2
//            - sigma^2 * B(T)^2 / (4*kappa)

struct VasicekModel {
    double kappa, theta, sigma, r0;

    double zcb_price(double T) const noexcept {
        double B  = (1.0 - std::exp(-kappa * T)) / kappa;
        double A  = (B - T) * (kappa * kappa * theta - 0.5 * sigma * sigma)
                    / (kappa * kappa)
                  - sigma * sigma * B * B / (4.0 * kappa);
        return std::exp(A - B * r0);
    }

    double zero_rate(double T) const noexcept {
        double p = zcb_price(T);
        return (p > 0.0 && T > 0.0) ? -std::log(p) / T : r0;
    }

    // MC validation: E[exp(-integral_0^T r(t) dt)]
    double zcb_mc(double T, int paths = 100000, int steps = 100,
                  unsigned seed = 42) const {
        std::mt19937_64 rng(seed);
        std::normal_distribution<> nd;
        double dt   = T / steps;
        double sum  = 0.0;

        for (int p = 0; p < paths; ++p) {
            double r = r0;
            double integral = 0.0;
            for (int s = 0; s < steps; ++s) {
                integral += r * dt;
                r += kappa * (theta - r) * dt + sigma * std::sqrt(dt) * nd(rng);
            }
            sum += std::exp(-integral);
        }
        return sum / paths;
    }
};

int main() {
    VasicekModel v{2.0, 0.05, 0.015, 0.03};   // fast reversion to 5%, r0=3%
    for (double T : {0.5, 1.0, 2.0, 5.0, 10.0}) {
        double cf  = v.zcb_price(T);
        double mc  = v.zcb_mc(T);
        double zr  = v.zero_rate(T);
        (void)cf; (void)mc; (void)zr;
    }
}`,
    explanation:
      "Vasicek's closed form makes bond pricing instantaneous — no grid, no MC required. The formula follows from the Ricatti ODEs for affine term-structure models: the ZCB is an exponential-affine function of the initial rate. Despite the negative-rate possibility (a practical concern in post-2008 EUR markets), Vasicek remains widely used as a baseline because it has exact simulation of r(T): r(T)|r(0) ~ N(mean, var) with known parameters.",
  },
  {
    id: "cpp-20260527-b1-barrier-mc",
    language: "cpp",
    title: "Barrier option Monte Carlo — up-and-out call, discrete monitoring",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <algorithm>

// Barrier options: payoff is cancelled (knocked out) or activated (knocked in)
// if S crosses the barrier at any monitored time.
// Discrete monitoring: check barrier only at closing prices (N times).
// Continuous monitoring: analytic formula exists for plain barriers.
// Here: Up-and-out call — pays max(S-K,0) at T if S never touched H > K.
// Prices LESS than a vanilla call: the knock-out reduces the expected payoff.

double barrier_uo_call_mc(
        double S, double K, double H,    // spot, strike, barrier
        double r, double sigma, double T,
        int n_paths, int n_steps,
        unsigned seed = 42) {
    if (H <= K)  return 0.0;          // barrier below strike => always knocked out
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;

    double dt    = T / n_steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double payoff_sum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double s    = S;
        bool   live = true;

        for (int step = 0; step < n_steps && live; ++step) {
            s *= std::exp(drift + vol * nd(rng));
            if (s >= H) live = false;   // knocked out
        }
        if (live) payoff_sum += std::max(s - K, 0.0);
    }
    return std::exp(-r * T) * payoff_sum / n_paths;
}

// Down-and-out put: pays max(K-S,0) if S never touched L < K.
double barrier_do_put_mc(
        double S, double K, double L,
        double r, double sigma, double T,
        int n_paths, int n_steps,
        unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    double dt = T / n_steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double sum   = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double s = S;
        bool live = true;
        for (int i = 0; i < n_steps && live; ++i) {
            s *= std::exp(drift + vol * nd(rng));
            if (s <= L) live = false;
        }
        if (live) sum += std::max(K - s, 0.0);
    }
    return std::exp(-r * T) * sum / n_paths;
}

int main() {
    // S=100, K=100, barrier H=120, 1Y, 20% vol, 5% rate
    double uo = barrier_uo_call_mc(100, 100, 120, 0.05, 0.20, 1.0, 200000, 252);
    double do_put = barrier_do_put_mc(100, 100, 80,  0.05, 0.20, 1.0, 200000, 252);
    (void)uo; (void)do_put;
    // Analytical: uo_call ~ 5.5 (vs vanilla call ~ 10.45 at same params)
}`,
    explanation:
      "Barrier options are priced less than vanilla options because the knock-out condition destroys the payoff — the probability of surviving the barrier exactly cancels the extra delta hedging cost. The continuous-monitoring analytic formula (Merton 1973) is exact but can only be applied when the barrier is checked continuously. In practice, equity options with daily closing-price checks require Monte Carlo or the Broadie-Glasserman-Kou continuity correction to account for discrete monitoring error.",
  },
  {
    id: "cpp-20260527-b1-cond-noexcept",
    language: "cpp",
    title: "Conditional noexcept(noexcept(...)) propagation",
    tag: "modern",
    code: `#include <utility>
#include <type_traits>
#include <vector>
#include <cstdint>

// noexcept(expr): is an operator that evaluates to true if 'expr' cannot throw.
// noexcept(noexcept(expr)): annotate a function with the noexcept status of
// the expression it evaluates — propagates exception-safety down the call chain.
// Critical in HFT: the compiler eliminates exception-handling overhead for
// noexcept functions; also enables std::vector to use move_if_noexcept.

struct Order {
    std::uint64_t id;
    double        price;
    std::uint32_t qty;
    bool operator<(const Order& o) const noexcept { return price < o.price; }
};

// Swap specialisation: noexcept iff moving T is noexcept.
template<typename T>
void my_swap(T& a, T& b)
    noexcept(noexcept(T(std::move(a))) &&
             noexcept(a = std::move(b))) {
    T tmp(std::move(a));
    a = std::move(b);
    b = std::move(tmp);
}

// Conditional forwarding: noexcept if both the construction and assignment can't throw.
template<typename Container, typename T>
void push_if_noexcept(Container& c, T&& val)
    noexcept(noexcept(c.push_back(std::forward<T>(val)))) {
    c.push_back(std::forward<T>(val));
}

// Verify at compile time: Order is nothrow-movable → vector can move on realloc.
static_assert(std::is_nothrow_move_constructible_v<Order>,
              "Order must be nothrow-move-constructible for efficient vector growth");

// Factory function: exception spec derived from constructor.
template<typename T, typename... Args>
T make_noexcept_if_possible(Args&&... args)
    noexcept(std::is_nothrow_constructible_v<T, Args...>) {
    return T{std::forward<Args>(args)...};
}

int main() {
    std::vector<Order> book;
    book.reserve(1024);
    auto o = make_noexcept_if_possible<Order>(1ULL, 100.25, 100U);
    push_if_noexcept(book, o);

    Order a{1, 99.0, 50}, b{2, 101.0, 100};
    my_swap(a, b);   // noexcept on trivially-movable types
}`,
    explanation:
      "Conditional noexcept propagation is how standard library containers decide whether to move or copy on reallocation: std::vector calls move_if_noexcept, which moves only if the move constructor is marked noexcept (otherwise it falls back to copy to preserve strong exception safety). Any type used in hot-path data structures should be nothrow-move-constructible; the static_assert enforces this at compile time.",
  },
  {
    id: "cpp-20260527-b1-andersen-qe",
    language: "cpp",
    title: "Andersen QE scheme — Heston variance process without blow-up",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <vector>
#include <algorithm>

// Andersen (2008) Quadratic-Exponential (QE) scheme for the Heston CIR variance process:
//   dv = kappa*(theta - v)*dt + xi*sqrt(v)*dW_v
// Standard Euler-Maruyama can produce negative v; QE matches moments exactly
// using a moment-matching mixture of an exponential and a quadratic distribution.
// This eliminates the 'full truncation' hack and gives better convergence.

struct QEParams {
    double kappa, theta, xi;  // mean reversion, long-run var, vol-of-vol
    double psi_c = 1.5;       // threshold between exponential and quadratic regimes
};

// Simulate one step of v(t+dt) | v(t) using QE.
double qe_step(double v, double dt, const QEParams& p,
               double uv,   // uniform for v (from Sobol or MT)
               std::mt19937_64& rng, std::uniform_real_distribution<>& ud) {
    (void)uv; (void)rng; (void)ud;   // use uv directly
    double e_kdt  = std::exp(-p.kappa * dt);
    // Conditional mean and variance of v(t+dt) | v(t)
    double m      = p.theta + (v - p.theta) * e_kdt;
    double s2     = v * p.xi * p.xi * e_kdt * (1.0 - e_kdt) / p.kappa
                  + p.theta * p.xi * p.xi * (1.0 - e_kdt) * (1.0 - e_kdt) / (2.0 * p.kappa);
    double psi    = s2 / (m * m);   // coefficient of variation^2

    if (psi <= p.psi_c) {
        // Quadratic regime: match first two moments to a non-central chi-squared.
        double b2 = 2.0 / psi - 1.0 + std::sqrt(2.0 / psi) * std::sqrt(2.0 / psi - 1.0);
        double a  = m / (1.0 + b2);
        // z = inverse_normal(uv); v_next = a*(b + z)^2
        double z  = std::erfinv(2.0 * uv - 1.0) * std::sqrt(2.0);  // approx inv normal
        return a * (std::sqrt(b2) + z) * (std::sqrt(b2) + z);
    } else {
        // Exponential regime: v_next ~ p*delta(0) + (1-p)*Exp(beta).
        double p_zero = (psi - 1.0) / (psi + 1.0);
        double beta   = (1.0 - p_zero) / m;
        if (uv <= p_zero) return 0.0;           // v_next = 0 (floor)
        return -std::log((1.0 - p_zero) / (1.0 - uv)) / beta;
    }
}

// Simulate n_steps of the variance process.
std::vector<double> heston_var_path(double v0, double dt, int n_steps,
                                     const QEParams& p, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::uniform_real_distribution<> ud(0.0, 1.0);
    std::vector<double> path(n_steps + 1);
    path[0] = v0;
    for (int i = 0; i < n_steps; ++i)
        path[i+1] = qe_step(path[i], dt, p, ud(rng), rng, ud);
    return path;
}

int main() {
    QEParams p{2.0, 0.04, 0.5, 1.5};        // typical Heston params
    auto path = heston_var_path(0.04, 1.0/252, 252, p);  // daily over 1Y
    // No negatives; E[v(T)] ≈ theta = 0.04
    double v_mean = 0.0;
    for (double v : path) v_mean += v;
    v_mean /= path.size();
    (void)v_mean;
}`,
    explanation:
      "The QE scheme was motivated by the failure of Euler discretisation for the Heston variance process: even small time steps occasionally produce v < 0, which then propagates NaN through the stock price simulation. QE avoids this by switching between two moment-matched distributions based on the coefficient of variation (ψ): when ψ is small, the variance is near its mean and a non-central chi-squared approximation works well; when ψ is large (near zero), an exponential distribution with a point mass at zero is used.",
  },
  {
    id: "cpp-20260527-b1-nelson-siegel-cpp",
    language: "cpp",
    title: "Nelson-Siegel yield curve fitting (Gauss-Newton in C++)",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <array>
#include <algorithm>

// Nelson-Siegel (1987): y(t) = b0 + b1*(1-exp(-t/tau))/(t/tau)
//                             + b2*((1-exp(-t/tau))/(t/tau) - exp(-t/tau))
// b0: long-run level, b1: slope (short-end), b2: curvature (hump), tau: decay.
// Fit via Gauss-Newton least squares on observed par yields.

struct NSParams { double b0, b1, b2, tau; };

double ns_yield(double t, const NSParams& p) noexcept {
    if (t < 1e-8) return p.b0 + p.b1;   // limit as t->0
    double x  = t / p.tau;
    double ex = std::exp(-x);
    double f  = (1.0 - ex) / x;
    return p.b0 + p.b1 * f + p.b2 * (f - ex);
}

// Partial derivatives for Gauss-Newton Jacobian.
std::array<double,4> ns_grad(double t, const NSParams& p) noexcept {
    double x  = t / p.tau;
    double ex = std::exp(-x);
    double f  = (x < 1e-10) ? 1.0 : (1.0 - ex) / x;
    // df/dtau = (1/tau) * (t/tau * exp(-t/tau) - (1 - exp(-t/tau))) / (t/tau)^2
    double df_dtau = (x < 1e-10) ? 0.0
        : (x * ex - (1.0 - ex)) / (x * x) * (-1.0 / p.tau);
    return {1.0,               // dNS/db0
            f,                 // dNS/db1
            f - ex,            // dNS/db2
            p.b1 * df_dtau + p.b2 * (df_dtau - (-1.0/p.tau)*ex*(-1.0)) };
}

// Gauss-Newton fit: minimise sum (y_obs - y_model)^2.
NSParams fit_nelson_siegel(const std::vector<double>& maturities,
                            const std::vector<double>& yields,
                            NSParams init = {0.04, -0.01, 0.02, 2.0},
                            int max_iter = 500) {
    NSParams p = init;
    int n = static_cast<int>(maturities.size());
    for (int iter = 0; iter < max_iter; ++iter) {
        // Build J^T J and J^T r (4×4 system)
        std::array<std::array<double,4>,4> JtJ{};
        std::array<double,4> Jtr{};
        for (int i = 0; i < n; ++i) {
            double r = yields[i] - ns_yield(maturities[i], p);
            auto g   = ns_grad(maturities[i], p);
            for (int a = 0; a < 4; ++a) {
                Jtr[a] += g[a] * r;
                for (int b = 0; b < 4; ++b) JtJ[a][b] += g[a] * g[b];
            }
        }
        // Tikhonov regularisation: JtJ += lambda*I
        for (int a = 0; a < 4; ++a) JtJ[a][a] += 1e-6;
        // Solve 4x4 system via Gaussian elimination (small enough)
        std::array<double,4> delta{Jtr};
        for (int col = 0; col < 4; ++col) {
            for (int row = col+1; row < 4; ++row) {
                double f = JtJ[row][col] / JtJ[col][col];
                for (int k = col; k < 4; ++k) JtJ[row][k] -= f * JtJ[col][k];
                delta[row] -= f * delta[col];
            }
        }
        for (int i = 3; i >= 0; --i) {
            for (int j = i+1; j < 4; ++j) delta[i] -= JtJ[i][j] * delta[j];
            delta[i] /= JtJ[i][i];
        }
        p.b0 += delta[0]; p.b1 += delta[1];
        p.b2 += delta[2]; p.tau = std::max(p.tau + delta[3], 0.1);
        if (std::abs(delta[0]) + std::abs(delta[1]) + std::abs(delta[2]) < 1e-8) break;
    }
    return p;
}

int main() {
    // Typical upward-sloping curve (maturities in years)
    std::vector<double> mats  = {0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30};
    std::vector<double> yields = {0.052, 0.053, 0.054, 0.055, 0.056, 0.057, 0.058, 0.059, 0.060, 0.060};
    auto p = fit_nelson_siegel(mats, yields);
    (void)p;   // p.b0 ≈ long-run rate ≈ 0.060
}`,
    explanation:
      "Nelson-Siegel is the most widely used parametric yield-curve model in central bank and buy-side analytics: it requires only 4 parameters to represent level, slope, curvature, and decay — making it robust with sparse market quotes. Gauss-Newton converges faster than Nelder-Mead for this smooth, differentiable objective. The tau parameter controls which maturity the hump peaks at; for typical USD curves tau ≈ 1.5–2.5 years.",
  },
  {
    id: "cpp-20260527-b1-greek-ladder",
    language: "cpp",
    title: "Bucketed Greek ladder — delta / vega by strike and maturity",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <map>
#include <cstdint>

// Greeks ladder: aggregate net delta and vega across all positions bucketed
// by strike (rounded to nearest 5%) and maturity bucket (0-3M, 3-6M, etc.)
// Used to identify concentrated exposures and plan hedging needs.

struct OptionPos {
    double S, K, r, sigma, T;   // market / contract parameters
    double notional;             // signed (positive = long)
};

struct GreekBucket {
    double net_delta = 0.0;
    double net_vega  = 0.0;
    double net_gamma = 0.0;
};

double norm_cdf(double x) noexcept {
    return 0.5 * std::erfc(-x / std::sqrt(2.0));
}
double norm_pdf(double x) noexcept {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * M_PI);
}

// Strike bucket key: strike rounded to nearest 5% of S.
int strike_bucket(double K, double S) noexcept {
    return static_cast<int>(std::round(K / S * 20.0));  // in units of 5%
}

// Maturity bucket: 0=0-3M, 1=3-6M, 2=6-12M, 3=1-2Y, 4=2Y+
int tenor_bucket(double T) noexcept {
    if (T < 0.25) return 0;
    if (T < 0.50) return 1;
    if (T < 1.00) return 2;
    if (T < 2.00) return 3;
    return 4;
}

using LadderKey = std::pair<int, int>;   // (strike_bucket, tenor_bucket)
using Ladder    = std::map<LadderKey, GreekBucket>;

// Compute BS greeks for one position and accumulate into the ladder.
void accumulate_greeks(Ladder& ladder, const OptionPos& p) {
    double sT = p.sigma * std::sqrt(p.T);
    if (sT < 1e-14) return;
    double d1 = (std::log(p.S / p.K) + (p.r + 0.5 * p.sigma * p.sigma) * p.T) / sT;
    double d2 = d1 - sT;
    double nd1  = norm_cdf(d1);
    double pdf1 = norm_pdf(d1);

    double delta = nd1 * p.notional;
    double gamma = pdf1 / (p.S * sT) * p.notional;
    double vega  = p.S * pdf1 * std::sqrt(p.T) * p.notional * 0.01; // per 1% vol move

    auto& bucket = ladder[{strike_bucket(p.K, p.S), tenor_bucket(p.T)}];
    bucket.net_delta += delta;
    bucket.net_vega  += vega;
    bucket.net_gamma += gamma;
}

int main() {
    Ladder ladder;
    std::vector<OptionPos> book = {
        {100, 95,  0.05, 0.20, 0.25,  1000},   // short-dated ITM
        {100, 100, 0.05, 0.20, 0.50, -500 },   // 6-month ATM short
        {100, 110, 0.05, 0.25, 1.00,  2000},   // 1Y OTM call
        {100, 90,  0.05, 0.18, 2.00, -800 },   // 2Y ITM put
    };
    for (auto& pos : book) accumulate_greeks(ladder, pos);
    for (auto& [key, g] : ladder)
        (void)g;   // inspect g.net_delta, g.net_vega, g.net_gamma per bucket
}`,
    explanation:
      "The Greek ladder is the core risk dashboard for an options book: instead of reporting a single portfolio delta, it shows *where* the delta lives across strikes and maturities. A concentrated vega at the 1Y 110% strike might be hedged by buying short-dated OTM variance; the ladder makes this need visible at a glance. In production, buckets are computed every second and fed to a live dashboard.",
  },
  {
    id: "cpp-20260527-b1-if-consteval",
    language: "cpp",
    title: "if consteval (C++23) — dual compile-time / runtime implementation",
    tag: "modern",
    code: `#include <cmath>
#include <numbers>
#include <cstdint>
#include <stdexcept>

// if consteval (C++23): branches at compile time vs runtime without
// std::is_constant_evaluated() boilerplate.  Cleaner than C++20's
// if (std::is_constant_evaluated()) block.
// Contrast:
//   C++20:  if (std::is_constant_evaluated()) { /* constexpr path */ }
//   C++23:  if consteval { /* constexpr path */ }
//           else         { /* runtime path */ }

// Natural log: use Taylor series at compile time (no libm); fast log() at runtime.
constexpr double my_log(double x) {
    if consteval {
        // Compile-time path: Taylor series around x=1.
        // Only valid for x near 1; adjust for other ranges.
        if (x <= 0.0) throw std::domain_error("log of non-positive");
        double y   = (x - 1.0) / (x + 1.0);
        double y2  = y * y;
        double sum = 0.0;
        double term = y;
        for (int k = 0; k < 50; ++k) {
            sum += term / (2*k + 1);
            term *= y2;
        }
        return 2.0 * sum;
    } else {
        return std::log(x);   // runtime: use fast libm
    }
}

// Fixed-point sqrt via Newton-Raphson at compile time; sqrtf at runtime.
constexpr double my_sqrt(double x) noexcept {
    if consteval {
        if (x < 0.0) return 0.0;
        double guess = x > 1.0 ? x * 0.5 : 1.0;
        for (int i = 0; i < 30; ++i) guess = 0.5 * (guess + x / guess);
        return guess;
    } else {
        return std::sqrt(x);
    }
}

// Compile-time check for BS d1 with known parameters.
// Ensures the compile-time formula is numerically consistent with runtime.
consteval double bs_d1_compile_time(double S, double K, double r,
                                     double sigma, double T) {
    return (my_log(S / K) + (r + 0.5 * sigma * sigma) * T)
           / (sigma * my_sqrt(T));
}

static_assert(bs_d1_compile_time(100, 100, 0.05, 0.20, 1.0) > 0.0,
              "ATM call d1 must be positive");

int main() {
    constexpr double v = my_log(std::numbers::e);   // compile-time: ≈ 1.0
    double r = my_log(2.718281828);                 // runtime: std::log
    (void)v; (void)r;
}`,
    explanation:
      "if consteval allows a single function to have separate compile-time and runtime implementations without a separate constexpr overload. The compile-time path uses iterative algorithms that avoid undefined-behaviour in constant expressions; the runtime path calls the platform's optimised libm functions. In quant code, compile-time evaluation is used to pre-compute constants (discount factors, Black-Scholes model parameters) and validate invariants at zero runtime cost.",
  },
  {
    id: "cpp-20260527-b1-murmurhash3",
    language: "cpp",
    title: "MurmurHash3 — fast non-cryptographic symbol string hash",
    tag: "performance",
    code: `#include <cstdint>
#include <cstring>
#include <string_view>

// MurmurHash3 (Austin Appleby 2011): non-cryptographic hash with excellent
// avalanche properties and very fast throughput on 64-bit hardware.
// Used for: hash map keys (symbol strings, order IDs), sharding, bloom filters.
// NOT for security (collision attacks possible).

namespace murmur3 {

static constexpr std::uint64_t C1 = 0x87c3'7b91'1142'53d5ULL;
static constexpr std::uint64_t C2 = 0x4cf5'ad43'2745'937fULL;

inline std::uint64_t rotl64(std::uint64_t x, int r) noexcept {
    return (x << r) | (x >> (64 - r));
}

inline std::uint64_t fmix64(std::uint64_t k) noexcept {
    k ^= k >> 33;
    k *= 0xff51afd7ed558ccdULL;
    k ^= k >> 33;
    k *= 0xc4ceb9fe1a85ec53ULL;
    k ^= k >> 33;
    return k;
}

// 128-bit variant; return the lower 64 bits for use as a map key.
std::uint64_t hash64(std::string_view key, std::uint32_t seed = 0) noexcept {
    const std::uint8_t* data = reinterpret_cast<const std::uint8_t*>(key.data());
    int len = static_cast<int>(key.size());
    int nblocks = len / 16;

    std::uint64_t h1 = seed, h2 = seed;

    auto getblock = [&](int i) -> std::uint64_t {
        std::uint64_t v;
        std::memcpy(&v, data + i * 8, 8);
        return v;
    };

    for (int i = 0; i < nblocks; ++i) {
        std::uint64_t k1 = getblock(i*2), k2 = getblock(i*2+1);
        k1 *= C1; k1 = rotl64(k1, 31); k1 *= C2; h1 ^= k1;
        h1 = rotl64(h1, 27); h1 += h2; h1 = h1*5 + 0x52dce729;
        k2 *= C2; k2 = rotl64(k2, 33); k2 *= C1; h2 ^= k2;
        h2 = rotl64(h2, 31); h2 += h1; h2 = h2*5 + 0x38495ab5;
    }
    // Tail bytes
    const std::uint8_t* tail = data + nblocks * 16;
    std::uint64_t k1 = 0, k2 = 0;
    switch (len & 15) {
        case 15: k2 ^= std::uint64_t(tail[14]) << 48; [[fallthrough]];
        case 14: k2 ^= std::uint64_t(tail[13]) << 40; [[fallthrough]];
        case  8: k1 ^= std::uint64_t(tail[ 7]) << 56; [[fallthrough]];
        case  1: k1 ^= tail[0];
                 k1 *= C1; k1 = rotl64(k1,31); k1 *= C2; h1 ^= k1;
                 break;
        default: break;
    }
    h1 ^= len; h2 ^= len;
    h1 += h2;  h2 += h1;
    return fmix64(h1);
}

} // namespace murmur3

int main() {
    auto h_aapl = murmur3::hash64("AAPL");
    auto h_msft = murmur3::hash64("MSFT");
    (void)h_aapl; (void)h_msft;
    // Use as hash map bucket index: bucket = hash64(sym) & (N-1) where N is power of 2
}`,
    explanation:
      "MurmurHash3 offers near-hardware-speed hashing (1-2 cycles/byte on modern CPUs) with outstanding distribution quality — crucial for order maps where key clustering degrades O(1) to O(n). The 128-bit variant's lower 64 bits have full avalanche (changing one bit in the input affects ~50% of output bits), making it nearly collision-free for typical symbol universes (< 10,000 distinct tickers). Never use std::hash<std::string> in production; its implementation quality is compiler-defined.",
  },
  {
    id: "cpp-20260527-b1-carry-roll-down",
    language: "cpp",
    title: "Bond carry-roll-down — return decomposition",
    tag: "quant",
    code: `#include <cmath>
#include <vector>

// Bond return decomposition over holding period dt (years):
//   Total P&L = Carry + Roll-down + Duration * (-yield change)
// Carry: coupon income + financing cost (repo rate) over dt.
// Roll-down: price change as bond "ages" along the curve (yield changes
//            because the bond is now shorter-dated, not because rates moved).
// This tells you how much you earn if the yield curve doesn't move at all.

struct CurvePoint { double maturity; double yield; };   // par yield at each maturity

// Linear interpolation on the par yield curve.
double interp_yield(const std::vector<CurvePoint>& curve, double t) {
    if (curve.empty()) return 0.03;
    if (t <= curve.front().maturity) return curve.front().yield;
    if (t >= curve.back().maturity)  return curve.back().yield;
    for (std::size_t i = 1; i < curve.size(); ++i) {
        if (t <= curve[i].maturity) {
            double a = (t - curve[i-1].maturity) / (curve[i].maturity - curve[i-1].maturity);
            return curve[i-1].yield + a * (curve[i].yield - curve[i-1].yield);
        }
    }
    return curve.back().yield;
}

// Full-price of a fixed-rate bond at a flat yield (semi-annual coupons).
double bond_price(double coupon, double ytm, double maturity,
                   double freq = 2.0, double face = 100.0) {
    int n     = static_cast<int>(std::round(maturity * freq));
    double y  = ytm / freq;
    double c  = coupon / freq * face;
    double pv = 0.0;
    for (int i = 1; i <= n; ++i)
        pv += c / std::pow(1.0 + y, i);
    pv += face / std::pow(1.0 + y, n);
    return pv;
}

struct CarryRollDown {
    double carry;        // coupon income net of repo
    double roll_down;    // price change as bond slides down the curve
    double carry_rnd;    // carry + roll-down (total horizon return, no rate move)
};

CarryRollDown decompose(double coupon, double maturity,
                         double repo_rate,
                         const std::vector<CurvePoint>& curve,
                         double dt) {
    double y_now  = interp_yield(curve, maturity);
    double y_roll = interp_yield(curve, maturity - dt);   // yield after aging

    double p_now  = bond_price(coupon, y_now,  maturity);
    double p_roll = bond_price(coupon, y_roll, maturity - dt);

    // Carry: coupon accrual minus financing cost
    double carry_income = coupon * dt * 100.0;            // % of face
    double carry_cost   = p_now * repo_rate * dt;         // financing
    double carry        = carry_income - carry_cost;

    // Roll-down: pure price change from aging (no parallel shift)
    double roll_down = p_roll - p_now;

    return {carry, roll_down, carry + roll_down};
}

int main() {
    std::vector<CurvePoint> curve = {
        {0.5, 0.052}, {1.0, 0.053}, {2.0, 0.055},
        {5.0, 0.056}, {10.0, 0.058}
    };
    auto rd = decompose(0.055, 5.0, 0.051, curve, 1.0/12.0);  // 1-month hold
    (void)rd;   // rd.carry ≈ 0.03, rd.roll_down depends on curve steepness
}`,
    explanation:
      "Carry-roll-down decomposition separates the two free-lunch components of bond return: carry (coupons net of financing) and roll-down (price appreciation as the bond moves to a shorter, lower-yield part of an upward-sloping curve). In a steep curve environment, a 5Y bond rolling to 4.92Y over a month earns meaningful roll-down on top of carry. Knowing carry-roll-down helps fixed-income managers decide whether to 'carry and roll' or trade the spread.",
  },
  {
    id: "cpp-20260527-b1-book-diff-bitmask",
    language: "cpp",
    title: "Order book diff bitmask — compressed level-change broadcast",
    tag: "market-data",
    code: `#include <cstdint>
#include <array>
#include <vector>
#include <bit>

// In a multicast book-snapshot feed, broadcasting all N price levels every
// update is wasteful.  Better: send a bitmask of changed levels + only those levels.
// For a book with up to 64 active price levels, a single uint64 captures
// which levels changed.  Receiver applies the diff against its local book.

static constexpr int MAX_LEVELS = 64;

struct PriceLevel { double price; std::uint32_t qty; };

struct BookSnapshot {
    std::array<PriceLevel, MAX_LEVELS> bids;
    std::array<PriceLevel, MAX_LEVELS> asks;
    int n_bids = 0, n_asks = 0;
};

struct BookDiff {
    std::uint64_t bid_mask = 0;   // bit i set means bids[i] changed
    std::uint64_t ask_mask = 0;
    std::array<PriceLevel, MAX_LEVELS> bid_levels;
    std::array<PriceLevel, MAX_LEVELS> ask_levels;
};

// Compute diff between old and new snapshots.
BookDiff compute_diff(const BookSnapshot& old_bk, const BookSnapshot& new_bk) noexcept {
    BookDiff d{};
    int n = std::max(old_bk.n_bids, new_bk.n_bids);
    for (int i = 0; i < n && i < MAX_LEVELS; ++i) {
        bool changed = (i >= old_bk.n_bids)
                    || (i >= new_bk.n_bids)
                    || (old_bk.bids[i].qty   != new_bk.bids[i].qty)
                    || (old_bk.bids[i].price != new_bk.bids[i].price);
        if (changed) {
            d.bid_mask |= (1ULL << i);
            d.bid_levels[i] = (i < new_bk.n_bids) ? new_bk.bids[i] : PriceLevel{0, 0};
        }
    }
    // Same for asks
    n = std::max(old_bk.n_asks, new_bk.n_asks);
    for (int i = 0; i < n && i < MAX_LEVELS; ++i) {
        bool changed = (i >= old_bk.n_asks)
                    || (i >= new_bk.n_asks)
                    || (old_bk.asks[i].qty   != new_bk.asks[i].qty)
                    || (old_bk.asks[i].price != new_bk.asks[i].price);
        if (changed) {
            d.ask_mask |= (1ULL << i);
            d.ask_levels[i] = (i < new_bk.n_asks) ? new_bk.asks[i] : PriceLevel{0, 0};
        }
    }
    return d;
}

// Apply diff to a local snapshot.  Only modifies levels in the mask.
void apply_diff(BookSnapshot& bk, const BookDiff& d) noexcept {
    for (std::uint64_t m = d.bid_mask; m; m &= m-1) {
        int i = std::countr_zero(m);   // index of lowest set bit
        bk.bids[i] = d.bid_levels[i];
    }
    for (std::uint64_t m = d.ask_mask; m; m &= m-1) {
        int i = std::countr_zero(m);
        bk.asks[i] = d.ask_levels[i];
    }
}

int main() {
    BookSnapshot prev{}, next{};
    prev.n_bids = next.n_bids = 5;
    prev.bids[0] = {100.0, 500}; next.bids[0] = {100.0, 400};  // qty changed
    BookDiff d = compute_diff(prev, next);
    apply_diff(prev, d);
    // prev.bids[0].qty == 400 now
}`,
    explanation:
      "The bitmask diff pattern reduces the bytes sent per book update from O(levels × sizeof(PriceLevel)) to O(changed_levels × sizeof(PriceLevel)) plus 8 bytes for the mask. When only 1-2 levels change per event (typical for order modifications), this cuts network bandwidth by 10-20×. The m &= m-1 trick iterates over only the set bits in constant time per bit, making the apply step proportional to the number of changes rather than the total book depth.",
  },
  {
    id: "cpp-20260527-b1-risk-limit-tree",
    language: "cpp",
    title: "Hierarchical position-limit tree — parent cascades to children",
    tag: "design",
    code: `#include <unordered_map>
#include <string>
#include <vector>
#include <stdexcept>
#include <cstdint>
#include <optional>

// Risk hierarchy: Firm → Desk → Strategy → Symbol.
// Adding a position checks all ancestors' remaining capacity simultaneously.
// If any level is breached, the whole order is rejected.
// This prevents a runaway strategy from consuming the firm's risk budget.

class LimitNode {
public:
    std::string          name;
    std::int64_t         limit;     // max gross notional (signed: both long and short count)
    std::int64_t         used  = 0;
    std::string          parent;    // empty string = root
};

class RiskTree {
    std::unordered_map<std::string, LimitNode> nodes_;

public:
    void add_node(std::string name, std::int64_t limit, std::string parent = "") {
        if (!parent.empty() && !nodes_.count(parent))
            throw std::invalid_argument("parent not found: " + parent);
        nodes_[name] = {std::move(name), limit, 0, std::move(parent)};
    }

    // Walk from leaf to root; check each limit before committing.
    // Returns the first ancestor that would breach, or nullopt if all clear.
    std::optional<std::string> check(const std::string& leaf,
                                      std::int64_t delta) const {
        for (auto* n = node_ptr(leaf); n; n = parent_ptr(n->parent)) {
            if (std::abs(n->used + delta) > n->limit)
                return n->name;
        }
        return std::nullopt;
    }

    // Commit a delta: add to all ancestors atomically (pre-checked above).
    void commit(const std::string& leaf, std::int64_t delta) {
        for (auto* n = node_ptr_mut(leaf); n; n = parent_ptr_mut(n->parent))
            n->used += delta;
    }

    // Combined check + commit: returns false if any level breaches.
    bool try_add(const std::string& leaf, std::int64_t delta) {
        if (check(leaf, delta)) return false;
        commit(leaf, delta);
        return true;
    }

    std::int64_t remaining(const std::string& name) const {
        auto* n = node_ptr(name);
        return n ? n->limit - std::abs(n->used) : 0;
    }

private:
    const LimitNode* node_ptr(const std::string& name) const {
        auto it = nodes_.find(name);
        return (it != nodes_.end()) ? &it->second : nullptr;
    }
    LimitNode* node_ptr_mut(const std::string& name) {
        auto it = nodes_.find(name);
        return (it != nodes_.end()) ? &it->second : nullptr;
    }
    const LimitNode* parent_ptr(const std::string& p) const {
        return p.empty() ? nullptr : node_ptr(p);
    }
    LimitNode* parent_ptr_mut(const std::string& p) {
        return p.empty() ? nullptr : node_ptr_mut(p);
    }
};

int main() {
    RiskTree tree;
    tree.add_node("firm",           1'000'000);
    tree.add_node("equities",         600'000, "firm");
    tree.add_node("us-equities",      400'000, "equities");
    tree.add_node("momentum-strat",   100'000, "us-equities");

    bool ok = tree.try_add("momentum-strat", 50'000);   // true
    bool ov = tree.try_add("momentum-strat", 90'000);   // false: would exceed strat limit
    (void)ok; (void)ov;
}`,
    explanation:
      "Hierarchical risk limits implement the 'accountability chain' mandated by prime brokers and regulators: a single strategy cannot consume more than its own limit, its desk's limit, or the firm's limit. Walking from leaf to root on check is O(depth) — typically 4-5 levels — which is negligible latency. In production, limits are stored in a lock-free structure and the commit step uses atomic fetch_add to handle concurrent order submissions from multiple strategy threads.",
  },
  {
    id: "cpp-20260527-b1-cds-cpp",
    language: "cpp",
    title: "CDS pricing via iterative hazard rate bootstrapping in C++",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Credit Default Swap (CDS) pricing:
// Buyer pays a fixed spread s quarterly; seller pays (1 - R) on default.
// Fair spread: s = (1-R) * sum_i [df(t_i) * Delta_Q(t_i)] / annuity
// where Q(t) = survival probability = exp(-integral_0^t lambda(u) du)
//       R    = recovery rate
// Bootstrap: given market CDS spreads for increasing maturities,
//            solve for each hazard rate interval sequentially.

struct DiscountCurve {
    std::vector<double> times;
    std::vector<double> dfs;     // discount factors P(0, t_i)

    double df(double t) const {
        if (times.empty()) return std::exp(-0.05 * t);
        if (t <= times.front()) return dfs.front();
        if (t >= times.back())  return dfs.back();
        for (std::size_t i = 1; i < times.size(); ++i) {
            if (t <= times[i]) {
                double a = (t - times[i-1]) / (times[i] - times[i-1]);
                return std::exp((1-a)*std::log(dfs[i-1]) + a*std::log(dfs[i]));
            }
        }
        return dfs.back();
    }
};

class HazardCurve {
    std::vector<double> nodes_;  // {t0, lam0, t1, lam1, ...} piecewise-flat hazard
public:
    // Survival probability Q(0, T) = exp(-sum_i lambda_i * (t_{i+1} - t_i))
    double survival(double T) const {
        double integral = 0.0;
        for (std::size_t i = 0; i + 1 < nodes_.size(); i += 2) {
            double t_lo = nodes_[i], lam = nodes_[i+1];
            double t_hi = (i+2 < nodes_.size()) ? nodes_[i+2] : T;
            double seg  = std::min(t_hi, T) - t_lo;
            if (seg <= 0.0) break;
            integral += lam * seg;
        }
        return std::exp(-integral);
    }

    // Bootstrap one new tenor: solve hazard lambda such that CDS PV = 0.
    void bootstrap(double maturity, double spread, double recovery,
                   const DiscountCurve& ir, int steps_per_year = 4) {
        double prev_t = nodes_.empty() ? 0.0 : nodes_[nodes_.size()-2];
        int    n = static_cast<int>(maturity * steps_per_year);
        double dt = maturity / n;

        // Binary search on lambda for [prev_t, maturity]
        double lo = 0.0, hi = 2.0;
        for (int iter = 0; iter < 80; ++iter) {
            double lam = 0.5 * (lo + hi);
            nodes_.push_back(prev_t);
            nodes_.push_back(lam);

            // Compute CDS PV: protection leg - premium leg
            double prot_pv = 0.0, annuity = 0.0;
            for (int s = 1; s <= n; ++s) {
                double t  = s * dt;
                double df = ir.df(t);
                double q  = survival(t);
                double dq = survival(t - dt) - q;   // default probability in interval
                prot_pv += (1.0 - recovery) * dq * df;
                annuity += dt * q * df;
            }
            double pv = prot_pv - spread * annuity;

            nodes_.pop_back(); nodes_.pop_back();   // undo trial
            (pv > 0) ? (lo = lam) : (hi = lam);
        }
        nodes_.push_back(prev_t);
        nodes_.push_back(0.5 * (lo + hi));
    }
};

int main() {
    DiscountCurve ir{{0.25, 0.5, 1, 2, 5}, {0.987, 0.974, 0.948, 0.897, 0.779}};
    HazardCurve hc;
    // Bootstrap 1Y, 3Y, 5Y from par CDS spreads (bps)
    hc.bootstrap(1.0, 0.0050, 0.40, ir);  // 50 bps
    hc.bootstrap(3.0, 0.0080, 0.40, ir);  // 80 bps
    hc.bootstrap(5.0, 0.0100, 0.40, ir);  // 100 bps
    double q5 = hc.survival(5.0);          // ≈ exp(-0.01/0.6 * 5) ≈ 0.92
    (void)q5;
}`,
    explanation:
      "CDS bootstrapping mirrors interest-rate curve stripping: each new maturity's hazard rate is solved while holding shorter-maturity hazard rates fixed, because earlier default probabilities are already pinned by shorter CDS contracts. The binary search converges in ~60 iterations for double precision. In production, the hazard curve is re-bootstrapped every time a market CDS spread moves, making the survival probability function used in bond pricing consistent with live credit markets.",
  },
  {
    id: "cpp-20260527-b1-cross-gamma",
    language: "cpp",
    title: "Cross-gamma matrix — second-order multi-asset sensitivities",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <functional>

// Cross-gamma (or cross-vega): d^2 P / (dS_i * dS_j)
// For a multi-asset option (basket, spread, rainbow), the second-order
// sensitivity to TWO different underlyings' joint move captures correlation risk.
// Cross-gamma is large when the option has a pronounced two-asset interaction
// (e.g., a best-of option is long correlation; a spread option is short).
// Computed via central finite differences on the repricing function.

using PriceFn = std::function<double(const std::vector<double>&)>;

// Compute the full Hessian (n×n gamma matrix) via central differences.
// Price function: takes a vector of spot prices, returns option price.
std::vector<std::vector<double>> hessian(
        const PriceFn& price_fn,
        const std::vector<double>& spots,
        double bump_pct = 0.01) {
    int n = static_cast<int>(spots.size());
    std::vector<std::vector<double>> H(n, std::vector<double>(n, 0.0));

    for (int i = 0; i < n; ++i) {
        double hi = spots[i] * bump_pct;
        // Diagonal (self-gamma): d^2P/dSi^2
        auto s_up = spots, s_dn = spots;
        s_up[i] += hi; s_dn[i] -= hi;
        double p0   = price_fn(spots);
        H[i][i] = (price_fn(s_up) - 2.0*p0 + price_fn(s_dn)) / (hi*hi);

        // Off-diagonal (cross-gamma): d^2P/(dSi*dSj)
        for (int j = i+1; j < n; ++j) {
            double hj = spots[j] * bump_pct;
            auto spp = spots, spm = spots, smp = spots, smm = spots;
            spp[i] += hi; spp[j] += hj;
            spm[i] += hi; spm[j] -= hj;
            smp[i] -= hi; smp[j] += hj;
            smm[i] -= hi; smm[j] -= hj;
            double cross = (price_fn(spp) - price_fn(spm)
                          - price_fn(smp) + price_fn(smm)) / (4.0*hi*hj);
            H[i][j] = H[j][i] = cross;
        }
    }
    return H;
}

// Dollar-weighted cross-gamma P&L: 0.5 * dS^T * H * dS.
double crossgamma_pnl(const std::vector<std::vector<double>>& H,
                       const std::vector<double>& dS) {
    int n = static_cast<int>(dS.size());
    double pnl = 0.0;
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            pnl += 0.5 * H[i][j] * dS[i] * dS[j];
    return pnl;
}

int main() {
    // Best-of 2 option: payoff = max(S1, S2) - K
    // Positive cross-gamma (long correlation).
    PriceFn best_of = [](const std::vector<double>& s) {
        return std::max({s[0], s[1]}) - 100.0;
    };
    auto H = hessian(best_of, {100.0, 100.0});
    double pnl = crossgamma_pnl(H, {1.0, -1.0});   // S1 up 1, S2 down 1
    (void)pnl;  // negative: best-of suffers when assets diverge
}`,
    explanation:
      "Cross-gamma is the risk that is missed by managing greeks on each asset independently: a basket option has negative cross-gamma (benefits from co-movement), while a spread option has positive cross-gamma (benefits from divergence). The full Hessian requires O(n²) repricing calls — for a 10-asset rainbow option, that is 100 pricer calls every second, which drives the need for fast closed-form or semi-analytic pricers. DV01 cross-sensitivities work identically, with yield-curve tenors as the 'underlyings'.",
  },
  {
    id: "cpp-20260527-b1-formatter",
    language: "cpp",
    title: "std::formatter<T> specialisation for a custom OrderKey type",
    tag: "modern",
    code: `#include <format>
#include <string>
#include <cstdint>
#include <concepts>

// std::formatter<T> lets a type participate in std::format / std::print
// without operator<< or a virtual interface.
// This is the recommended C++20/23 approach for structured types:
// zero-overhead formatting with compile-time format-string checking.

struct OrderKey {
    std::uint64_t cl_ord_id;
    std::uint32_t venue_id;
    char          side;     // 'B' or 'S'
};

// Specifier mini-language: default {} | verbose {:v}
template<>
struct std::formatter<OrderKey> {
    bool verbose_ = false;

    // Parse the format specifier (the part between { and }).
    constexpr auto parse(std::format_parse_context& ctx) {
        auto it = ctx.begin();
        if (it != ctx.end() && *it == 'v') { verbose_ = true; ++it; }
        return it;  // must return iterator past the specifier
    }

    // Format the value.
    auto format(const OrderKey& k, std::format_context& ctx) const {
        if (verbose_) {
            return std::format_to(ctx.out(),
                "OrderKey{{cl_ord_id={}, venue={}, side={}}}",
                k.cl_ord_id, k.venue_id, k.side);
        }
        return std::format_to(ctx.out(), "{}/{}/{}",
            k.cl_ord_id, k.venue_id, k.side);
    }
};

// std::formatter also works for logging types that wrap a price integer.
struct Ticks { std::int64_t raw; double scale; };
template<>
struct std::formatter<Ticks> {
    constexpr auto parse(std::format_parse_context& ctx) { return ctx.begin(); }
    auto format(const Ticks& t, std::format_context& ctx) const {
        return std::format_to(ctx.out(), "{:.4f}", t.raw * t.scale);
    }
};

int main() {
    OrderKey k{12345678, 3, 'B'};
    // Compile-time format string check — mismatched types are errors, not UB.
    auto s1 = std::format("{}", k);           // "12345678/3/B"
    auto s2 = std::format("{:v}", k);         // "OrderKey{cl_ord_id=12345678, venue=3, side=B}"

    Ticks px{100250, 0.0001};                // 100.0250 in 4-decimal fixed
    auto s3 = std::format("price: {}", px);   // "price: 100.0250"

    (void)s1; (void)s2; (void)s3;
}`,
    explanation:
      "std::formatter is the extensible hook for the C++20 formatting library: once specialised, your type works with std::format, std::print, std::format_to (zero-alloc), and future logging libraries that adopt <format>. Unlike operator<<, the format specifier mini-language is parsed at compile time, so type mismatches or unknown specifiers are compile errors rather than silent runtime failures. For HFT logging, the zero-copy std::format_to path writes directly into a pre-allocated ring buffer.",
  },
  {
    id: "cpp-20260527-b1-adaptive-milstein",
    language: "cpp",
    title: "Adaptive Milstein SDE stepping with local error control",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <functional>
#include <algorithm>

// Milstein scheme for Ito SDE: dX = mu(X)*dt + sigma(X)*dW
// X_{n+1} = X_n + mu(X_n)*dt + sigma(X_n)*dW + 0.5*sigma(X_n)*sigma'(X_n)*(dW^2 - dt)
// Strong order 1.0 (vs Euler's 0.5) — much better for stochastic vol models.
// Adaptive stepping: if local error > tolerance, halve dt and retry.

using SdeFn = std::function<double(double, double)>;  // f(t, x) -> value

// One Milstein step given dW (caller provides random increment).
double milstein_step(double x, double t, double dt, double dW,
                     const SdeFn& mu, const SdeFn& sigma,
                     double h = 1e-6) {
    double s  = sigma(t, x);
    double m  = mu(t, x);
    // Sigma derivative via central finite difference
    double ds = (sigma(t, x + h) - sigma(t, x - h)) / (2.0 * h);
    return x + m*dt + s*dW + 0.5*s*ds*(dW*dW - dt);
}

// Adaptive path using Richardson extrapolation for error estimate.
// Compute one coarse step (dt) and two fine steps (dt/2); if differ > tol, halve.
std::vector<std::pair<double,double>> adaptive_milstein_path(
        double x0, double T,
        const SdeFn& mu, const SdeFn& sigma,
        double tol = 1e-4, double dt0 = 0.01, unsigned seed = 42) {
    std::vector<std::pair<double,double>> path;
    path.push_back({0.0, x0});

    // Simple PCG-inspired random (demo; use real N(0,1) in production)
    std::uint64_t state = seed;
    auto next_normal = [&]() -> double {
        state ^= state << 13; state ^= state >> 7; state ^= state << 17;
        double u = static_cast<double>(state & 0xFFFFFFFFFFFF) / 1e15 - 1.0;
        return u;   // crude uniform, not normal — illustrative only
    };

    double t  = 0.0;
    double x  = x0;
    double dt = dt0;
    while (t < T) {
        dt = std::min(dt, T - t);
        double dW_coarse = next_normal() * std::sqrt(dt);

        // One coarse step
        double x_c = milstein_step(x, t, dt, dW_coarse, mu, sigma);

        // Two half steps with the same dW (Brownian bridge decomposition approx)
        double dW1 = next_normal() * std::sqrt(dt * 0.5);
        double dW2 = dW_coarse - dW1;
        double x_f1 = milstein_step(x,   t,         dt*0.5, dW1, mu, sigma);
        double x_f  = milstein_step(x_f1, t + dt*0.5, dt*0.5, dW2, mu, sigma);

        double err = std::abs(x_f - x_c);
        if (err > tol && dt > 1e-8) {
            dt *= 0.5;   // retry with smaller step
            continue;
        }
        x = x_f;  t += dt;
        path.push_back({t, x});
        if (err < tol * 0.1) dt = std::min(dt * 2.0, dt0);  // grow step if accurate
    }
    return path;
}

int main() {
    // CIR variance process: mu = kappa*(theta - x), sigma = xi*sqrt(x)
    auto path = adaptive_milstein_path(
        0.04, 1.0,
        [](double, double x){ return 2.0 * (0.04 - x); },      // mu
        [](double, double x){ return 0.3 * std::sqrt(std::max(x, 0.0)); });  // sigma
    (void)path;
}`,
    explanation:
      "Adaptive stepping with Richardson extrapolation estimates the local truncation error by comparing a coarse and fine discretisation: when the error is too large, the step is rejected and retried at half the size. For CIR / Heston variance paths near zero, where sigma ∝ sqrt(v) changes rapidly, a fixed dt can produce large errors; adaptive control keeps the global error within tolerance with fewer steps than an overly conservative fixed grid.",
  },
  {
    id: "cpp-20260527-b1-small-buffer-book",
    language: "cpp",
    title: "Small-buffer price-level array — inplace vector for top-of-book",
    tag: "performance",
    code: `#include <cstdint>
#include <array>
#include <algorithm>
#include <stdexcept>

// For a top-of-book structure (best 5-10 levels), a heap allocation is wasteful.
// Small Buffer Optimisation: store up to N levels inline; never allocate.
// This is what std::inplace_vector (C++26) will formalise; here is the pattern.

template<typename T, std::size_t N>
class InplaceVec {
    std::array<T, N> buf_{};
    std::size_t      size_{0};

public:
    constexpr std::size_t size()      const noexcept { return size_; }
    constexpr bool        empty()     const noexcept { return size_ == 0; }
    constexpr std::size_t capacity()  const noexcept { return N; }

    void push_back(T val) {
        if (size_ >= N) throw std::overflow_error("InplaceVec overflow");
        buf_[size_++] = val;
    }

    void pop_back()     noexcept { if (size_) --size_; }
    T&   front()        noexcept { return buf_[0]; }
    T&   back()         noexcept { return buf_[size_-1]; }
    T&   operator[](std::size_t i) noexcept { return buf_[i]; }
    const T& operator[](std::size_t i) const noexcept { return buf_[i]; }

    T*       begin() noexcept { return buf_.data(); }
    T*       end()   noexcept { return buf_.data() + size_; }
    const T* begin() const noexcept { return buf_.data(); }
    const T* end()   const noexcept { return buf_.data() + size_; }

    // Insert maintaining sorted descending order (for bid ladder).
    void insert_sorted_desc(T val) {
        if (size_ == N) {
            if (val <= buf_[size_-1]) return;   // below worst level: discard
            --size_;
        }
        auto it = std::lower_bound(begin(), end(), val, std::greater<T>{});
        std::copy_backward(it, end(), end() + 1);
        *it = val;
        ++size_;
    }
};

struct PriceQty { double price; std::uint32_t qty; };
// Sort bids descending by price.
inline bool operator>(const PriceQty& a, const PriceQty& b) noexcept {
    return a.price > b.price;
}
inline bool operator<=(const PriceQty& a, const PriceQty& b) noexcept {
    return a.price <= b.price;
}

using TopBids = InplaceVec<PriceQty, 10>;   // top 10 bid levels, fully on stack

int main() {
    TopBids bids;
    bids.push_back({100.0, 500});
    bids.push_back({99.5,  300});
    bids.insert_sorted_desc({100.5, 200});  // inserts at front, pushes others down
    // bids[0] == {100.5, 200} — best bid
    (void)bids;
    static_assert(sizeof(TopBids) == 10 * sizeof(PriceQty) + sizeof(std::size_t));
}`,
    explanation:
      "The Small Buffer Optimisation (SBO) is the technique behind std::string's short-string inline storage and std::optional's no-heap guarantee. For a level-2 book with 5-10 levels, storing them in a fixed stack array gives 2-3× better L1 cache utilisation compared to a std::vector with a separate heap allocation: the entire book fits in 2-4 cache lines. C++26 will standardise this as std::inplace_vector; until then, a hand-rolled wrapper is the idiomatic approach.",
  },
  {
    id: "cpp-20260527-b1-fx-carry-fwd",
    language: "cpp",
    title: "Carry-adjusted FX forward curve (CIP parity pricing)",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <stdexcept>

// Covered Interest Parity (CIP): F = S * exp((r_d - r_f) * T)
// For cross-currency swap or FX forward pricing:
//   F(T): forward rate (domestic / foreign)
//   S:    spot rate (domestic / foreign)
//   r_d:  domestic continuously compounded risk-free rate
//   r_f:  foreign continuously compounded risk-free rate
// 'Carry' = r_d - r_f: positive carry means domestic pays more —
//   rolling a long FX forward earns carry income.
// 'Deviation from CIP' (basis): in stressed markets, measured by XCCY basis swap.

struct FxForwardCurve {
    double spot;            // e.g., USD/JPY = 150.0
    double r_dom;           // domestic (JPY here) risk-free rate
    double r_for;           // foreign (USD here) risk-free rate
    double xccy_basis = 0.0; // XCCY basis spread (add to domestic rate)

    // Forward rate at maturity T (years).
    double forward(double T) const noexcept {
        return spot * std::exp((r_dom + xccy_basis - r_for) * T);
    }

    // Implied forward points (pips = forward - spot, typically quoted in 1/100).
    double fwd_points(double T) const noexcept {
        return forward(T) - spot;
    }

    // Roll yield per day: daily change in forward price as time passes.
    // dF/dT * (1 day) ≈ F * (r_d - r_f) / 365.
    double roll_yield_per_day() const noexcept {
        return spot * (r_dom + xccy_basis - r_for) / 365.0;
    }

    // Implied domestic rate from observable forward and foreign rate.
    static double implied_dom_rate(double spot, double fwd, double r_for, double T) {
        if (T < 1e-8) throw std::domain_error("T must be positive");
        return r_for + std::log(fwd / spot) / T;
    }
};

struct FxFwdPoint { double T; double fwd; };   // market-observable forward

// Build a forward curve from a list of market forward quotes.
std::vector<FxFwdPoint> build_forward_curve(
        double spot, double r_for,
        const std::vector<std::pair<double, double>>& market_fwds) {
    std::vector<FxFwdPoint> curve;
    curve.reserve(market_fwds.size());
    for (auto [T, fwd] : market_fwds)
        curve.push_back({T, fwd});
    return curve;
}

int main() {
    FxForwardCurve usdjpy{150.0, 0.001, 0.052, -0.0005};  // JPY near-zero, USD 5.2%, -5bp basis
    for (double T : {1.0/12, 3.0/12, 6.0/12, 1.0, 2.0}) {
        double fwd = usdjpy.forward(T);
        double pts = usdjpy.fwd_points(T);
        (void)fwd; (void)pts;
    }
    double rpy = usdjpy.roll_yield_per_day();
    (void)rpy;  // negative: JPY rate < USD rate → holding long USD/JPY forward costs carry
}`,
    explanation:
      "CIP parity is the no-arbitrage condition linking spot FX, interest rates, and forward FX: if violated, a round-trip borrow-convert-invest-convert-back trade earns risk-free profit. Post-2008, the cross-currency basis (XCCY basis) measures persistent deviations from CIP caused by balance-sheet constraints on large banks. Including the basis in the forward pricing formula is essential for any trade that involves currency hedging or cross-currency funding.",
  },
  {
    id: "cpp-20260527-b1-ewma-cov-streaming",
    language: "cpp",
    title: "Streaming EWMA covariance matrix update (pairwise, O(N²) per tick)",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <cstddef>

// EWMA (Exponentially Weighted Moving Average) covariance matrix:
// Cov_{t}(i,j) = (1-alpha) * Cov_{t-1}(i,j) + alpha * r_i(t) * r_j(t)
// where alpha = 2/(span + 1).  On each tick, update all N*(N+1)/2 pairs.
// Note: EWMA covariance is NOT centred (mean is implicitly 0 for daily returns).
// For a 50-asset universe: 1275 pair updates per tick — fast enough for tick-level.

class EwmaCov {
    int                     n_;
    double                  alpha_;
    std::vector<double>     cov_;   // upper triangular, row-major: cov_[i*(2n-i-1)/2 + j]
    std::vector<double>     var_;   // diagonal for quick correlation

    std::size_t idx(int i, int j) const noexcept {
        if (i > j) std::swap(i, j);
        return static_cast<std::size_t>(i * (2*n_ - i - 1) / 2 + j);
    }

public:
    explicit EwmaCov(int n, double halflife_days)
        : n_(n), alpha_(1.0 - std::exp(-std::log(2.0) / halflife_days)),
          cov_(static_cast<std::size_t>(n*(n+1)/2), 0.0),
          var_(n, 1e-6) {}   // seed variance to avoid divide-by-zero

    // Update with a vector of returns (length n_).
    void update(const std::vector<double>& r) {
        double decay = 1.0 - alpha_;
        for (int i = 0; i < n_; ++i) {
            for (int j = i; j < n_; ++j) {
                cov_[idx(i,j)] = decay * cov_[idx(i,j)] + alpha_ * r[i] * r[j];
            }
            var_[i] = cov_[idx(i,i)];
        }
    }

    double covariance(int i, int j) const noexcept { return cov_[idx(i,j)]; }
    double variance(int i)          const noexcept { return var_[i]; }

    double correlation(int i, int j) const noexcept {
        double vi = var_[i], vj = var_[j];
        if (vi < 1e-14 || vj < 1e-14) return 0.0;
        return covariance(i,j) / std::sqrt(vi * vj);
    }

    double portfolio_variance(const std::vector<double>& weights) const noexcept {
        double pv = 0.0;
        for (int i = 0; i < n_; ++i)
            for (int j = 0; j < n_; ++j)
                pv += weights[i] * weights[j] * covariance(i, j);
        return pv;
    }
};

int main() {
    EwmaCov ecov(3, 20.0);  // 3 assets, 20-day halflife

    // Daily returns (simulated)
    for (int t = 0; t < 100; ++t)
        ecov.update({0.001 * std::sin(t), 0.002 * std::cos(t), -0.001 * std::sin(t * 1.1)});

    double rho01 = ecov.correlation(0, 1);
    double pvar  = ecov.portfolio_variance({0.4, 0.4, 0.2});
    (void)rho01; (void)pvar;
}`,
    explanation:
      "The upper-triangular storage halves memory relative to a full matrix and keeps covariance lookup at O(1). The EWMA update is O(N²) per tick and can be SIMD-vectorised for large asset universes by processing pairs in chunks of 4 or 8 doubles. Halflife of 20 days weights recent returns more heavily than older ones, adapting to volatility regime changes; RiskMetrics (J.P. Morgan 1994) standardised this approach with halflife ≈ 75 days for longer-horizon risk.",
  },
  {
    id: "cpp-20260527-b1-dv01-buckets",
    language: "cpp",
    title: "Portfolio DV01 key-rate duration bucket distribution",
    tag: "quant",
    code: `#include <vector>
#include <map>
#include <cmath>
#include <string>
#include <algorithm>

// Key-rate DV01: sensitivity of portfolio value to a 1 bp bump at one
// specific tenor node of the yield curve, all other tenors unchanged.
// Unlike parallel-shift DV01, key-rate buckets reveal WHERE on the curve
// the duration risk sits — essential for hedging with CMT swaps or futures.

static const std::vector<double> TENOR_NODES = {0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30};

// Bump weights: a 1bp bump at node T ripples linearly to adjacent tenors
// (linear interpolation basis function, triangular kernel).
std::vector<double> bump_weights(const std::vector<double>& tenors, double T_key) {
    std::vector<double> w(tenors.size(), 0.0);
    for (std::size_t i = 0; i < tenors.size(); ++i) {
        double t = tenors[i];
        if (i > 0 && i < tenors.size()-1) {
            if (t == T_key) { w[i] = 1.0; continue; }
            if (t > tenors[i-1] && t < T_key && T_key > 0)
                w[i] = (t - tenors[i-1]) / (T_key - tenors[i-1]);
            else if (t > T_key && t < tenors[i+1])
                w[i] = (tenors[i+1] - t) / (tenors[i+1] - T_key);
        }
    }
    return w;
}

// Bond price as a function of a yield curve (parallel shift here, simplification).
double bond_pv(double coupon, double maturity, const std::vector<double>& yields,
               const std::vector<double>& yield_tenors, double face = 100.0) {
    int n = static_cast<int>(maturity * 2);
    double pv = 0.0;
    for (int k = 1; k <= n; ++k) {
        double t = k * 0.5;
        // Interpolate yield at t
        double y = yields.front();
        for (std::size_t i = 1; i < yield_tenors.size(); ++i) {
            if (t <= yield_tenors[i]) {
                double a = (t - yield_tenors[i-1]) / (yield_tenors[i] - yield_tenors[i-1]);
                y = yields[i-1] + a * (yields[i] - yields[i-1]);
                break;
            }
        }
        double cf = (k == n) ? coupon * 0.5 * face + face : coupon * 0.5 * face;
        pv += cf * std::exp(-y * t);
    }
    return pv;
}

// Compute key-rate DV01 for one bond at each tenor node.
std::map<double, double> key_rate_dv01(double coupon, double maturity, double notional,
                                        const std::vector<double>& base_yields) {
    std::map<double, double> kr_dv01;
    double bump = 1e-4;  // 1 bp
    double pv0  = bond_pv(coupon, maturity, base_yields, TENOR_NODES) * notional / 100.0;

    for (double key_t : TENOR_NODES) {
        auto bumped = base_yields;
        for (std::size_t i = 0; i < TENOR_NODES.size(); ++i)
            bumped[i] += bump * (i < bumped.size() && TENOR_NODES[i] == key_t ? 1.0 : 0.0);
        // Bump only the closest node
        std::size_t closest = std::min_element(TENOR_NODES.begin(), TENOR_NODES.end(),
            [&](double a, double b){ return std::abs(a-key_t) < std::abs(b-key_t); })
            - TENOR_NODES.begin();
        bumped[closest] += bump;
        double pv_up = bond_pv(coupon, maturity, bumped, TENOR_NODES) * notional / 100.0;
        kr_dv01[key_t] = pv0 - pv_up;   // DV01: price falls when yield rises
    }
    return kr_dv01;
}

int main() {
    std::vector<double> yields = {0.052, 0.053, 0.054, 0.055, 0.056, 0.057, 0.058, 0.059, 0.060, 0.060};
    auto kr = key_rate_dv01(0.055, 10.0, 1e6, yields);   // 10Y 5.5% bond, $1M notional
    for (auto& [t, d] : kr)
        (void)d;  // kr[10.0] will be the largest DV01 bucket for a 10Y bond
}`,
    explanation:
      "Key-rate duration reveals the curve shape risk that parallel-shift DV01 hides: a 10-year bond's entire DV01 clusters at the 10-year node, while a barbell (long 2Y + long 10Y) has DV01 split between the 2Y and 10Y nodes. Portfolio managers hedge key-rate exposure by buying/selling CMT swaps or Treasury futures at the matching tenor. The triangular interpolation basis ensures that bumping a node smoothly affects nearby maturities, avoiding unrealistic kinks in the yield curve.",
  },
];
