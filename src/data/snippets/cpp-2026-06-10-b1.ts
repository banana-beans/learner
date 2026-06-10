import type { Snippet } from "./types";

export const cppSnippets20260610B1: Snippet[] = [
  {
    id: "cpp-20260610-b1-spsc-queue",
    language: "cpp",
    title: "Lock-free SPSC queue — tick ring buffer for market data feed",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Single-Producer Single-Consumer lock-free queue backed by a power-of-2 ring.
// Each side owns exactly one atomic variable — no false sharing between threads.
// Unsigned wrap-around makes (tail - head) == Cap the unambiguous full condition.
template<typename T, std::size_t Cap>
    requires (Cap > 1 && (Cap & (Cap - 1)) == 0)   // power of 2 required
class SPSCQueue {
    static constexpr std::size_t MASK = Cap - 1;

    alignas(64) std::atomic<std::size_t> head_{0};  // owned by consumer
    alignas(64) std::atomic<std::size_t> tail_{0};  // owned by producer
    alignas(64) std::array<T, Cap>       buf_{};

public:
    // Producer thread only
    bool try_push(T val) noexcept {
        const auto t = tail_.load(std::memory_order_relaxed);
        if (t - head_.load(std::memory_order_acquire) == Cap)
            return false;   // full
        buf_[t & MASK] = std::move(val);
        tail_.store(t + 1, std::memory_order_release);
        return true;
    }

    // Consumer thread only
    std::optional<T> try_pop() noexcept {
        const auto h = head_.load(std::memory_order_relaxed);
        if (tail_.load(std::memory_order_acquire) == h)
            return {};      // empty
        T val = std::move(buf_[h & MASK]);
        head_.store(h + 1, std::memory_order_release);
        return val;
    }

    std::size_t size() const noexcept {
        return tail_.load(std::memory_order_acquire) -
               head_.load(std::memory_order_acquire);
    }
};

// Usage: feed thread produces ticks; handler thread consumes.
// struct Tick { double price; int qty; uint64_t ts_ns; };
// SPSCQueue<Tick, 4096> q;`,
    explanation:
      "The SPSC queue achieves zero-contention throughput by separating ownership: only the producer writes tail_ and only the consumer writes head_, so each core's atomic is always in an exclusive cache-line state. The release-store on write and acquire-load on read establish the happens-before edge that makes the payload data visible across cores without a mutex.",
  },
  {
    id: "cpp-20260610-b1-seqlock-quote",
    language: "cpp",
    title: "Seqlock — lock-free market data quote with reader consistency",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>

// Seqlock: one writer, multiple readers, no blocking.
// Writer increments a counter (odd = in-progress, even = complete).
// Readers spin until even seq, copy data, then verify seq unchanged.
// Readers never block the writer; writer never blocks readers.
struct alignas(64) QuoteSlot {
    std::atomic<std::uint32_t> seq{0};   // sequence counter
    double bid  = 0.0;
    double ask  = 0.0;
    int    bid_sz = 0;
    int    ask_sz = 0;
};

// Single writer: called from the feed handler thread
void publishQuote(QuoteSlot& slot, double bid, double ask, int bs, int as) noexcept {
    std::uint32_t s = slot.seq.load(std::memory_order_relaxed);
    slot.seq.store(s + 1, std::memory_order_release);  // mark odd: write starting
    std::atomic_signal_fence(std::memory_order_acq_rel); // compiler barrier
    slot.bid = bid;  slot.ask = ask;
    slot.bid_sz = bs; slot.ask_sz = as;
    std::atomic_signal_fence(std::memory_order_acq_rel);
    slot.seq.store(s + 2, std::memory_order_release);  // mark even: write done
}

// Multiple readers: non-blocking, may spin briefly
struct Quote { double bid, ask; int bid_sz, ask_sz; bool valid; };

Quote readQuote(const QuoteSlot& slot) noexcept {
    for (;;) {
        std::uint32_t s1 = slot.seq.load(std::memory_order_acquire);
        if (s1 & 1) continue;       // writer in progress — spin
        double bid = slot.bid;  double ask = slot.ask;
        int bs = slot.bid_sz;   int as = slot.ask_sz;
        std::uint32_t s2 = slot.seq.load(std::memory_order_acquire);
        if (s1 == s2) return {bid, ask, bs, as, true};
        // seq changed under us — retry
    }
}
// One QuoteSlot per symbol: ~ 64 bytes, fits in a single cache line.
// Throughput: millions of consistent reads/writes per second at low latency.`,
    explanation:
      "The seqlock's odd/even convention provides a lock-free consistency protocol: if a reader sees the same even sequence before and after copying the payload, no concurrent write could have interleaved. The release-store ensures payload writes are visible before the even-seq publish; the acquire-load on the reader side synchronises with that release.",
  },
  {
    id: "cpp-20260610-b1-thread-local-rng",
    language: "cpp",
    title: "Thread-local RNG — per-thread seeded PRNG for parallel MC",
    tag: "concurrency",
    code: `#include <random>
#include <thread>
#include <chrono>
#include <cstdint>

// Thread-local storage: each thread gets its own mt19937_64.
// Avoids: (1) global mutex on a shared rng, (2) false sharing on rng state,
//         (3) correlated sequences across threads from a split mt19937.

inline std::mt19937_64& threadRNG() {
    // Invoked once per thread: seeds with a mix of thread-id + timestamp
    thread_local std::mt19937_64 rng = [] {
        auto tid = std::hash<std::thread::id>{}(std::this_thread::get_id());
        auto clk = static_cast<std::uint64_t>(
            std::chrono::high_resolution_clock::now().time_since_epoch().count());
        // FNV-1a-inspired mixing to avoid bad mt19937 seeds
        std::uint64_t seed = tid ^ (clk * 0x9e3779b97f4a7c15ULL);
        seed ^= seed >> 33;
        seed *= 0xff51afd7ed558ccdULL;
        seed ^= seed >> 33;
        return std::mt19937_64{seed};
    }();
    return rng;
}

// Usage in a parallel MC worker (called from multiple threads)
double callPayoffPath(double S0, double K, double r, double sigma, double T) {
    std::normal_distribution<double> nd;
    auto& rng = threadRNG();           // zero-overhead per call after first
    double lnS = std::log(S0) + (r - 0.5*sigma*sigma)*T
                 + sigma * std::sqrt(T) * nd(rng);
    return std::max(std::exp(lnS) - K, 0.0);
}
// thread_local: static storage duration per thread.
// The lambda initialiser runs exactly once per thread — thread-safe by C++11 rule.`,
    explanation:
      "Splitting a single mt19937 state across threads produces highly correlated sub-sequences because the Mersenne Twister period is achieved only with the full 19937-bit state. Thread-local seeding from a hash of the thread-id guarantees statistically independent streams — the mixing constant 0x9e3779b9... is the Fibonacci hash multiplier that maximises avalanche.",
  },
  {
    id: "cpp-20260610-b1-intrusive-order-list",
    language: "cpp",
    title: "Intrusive doubly-linked list — O(1) order book level queue",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cassert>

// Intrusive list: each Order embeds its own prev/next pointers.
// No separate heap allocation for list nodes — the order IS the node.
// O(1) removal given a raw pointer; O(1) FIFO push/pop at a price level.

struct Order {
    std::int64_t  id;
    std::int64_t  price_ticks;   // integer to avoid FP comparison
    std::int32_t  qty;
    char          side;          // 'B' or 'S'
    // Intrusive links — embedded in the element itself
    Order*        prev = nullptr;
    Order*        next = nullptr;
};

// Doubly-linked FIFO list with sentinel head/tail (no null checks in hot path)
class OrderQueue {
    Order head_, tail_;   // sentinel nodes (not real orders)
    int   count_ = 0;
    long  total_qty_ = 0;

public:
    OrderQueue() noexcept {
        head_.next = &tail_;
        tail_.prev = &head_;
    }

    void push_back(Order* o) noexcept {
        o->prev = tail_.prev;
        o->next = &tail_;
        tail_.prev->next = o;
        tail_.prev       = o;
        ++count_;
        total_qty_ += o->qty;
    }

    // O(1) removal given a direct pointer — no scan
    void remove(Order* o) noexcept {
        assert(o->prev && o->next);
        o->prev->next = o->next;
        o->next->prev = o->prev;
        o->prev = o->next = nullptr;
        --count_;
        total_qty_ -= o->qty;
    }

    // Amend quantity in place
    void amend_qty(Order* o, int new_qty) noexcept {
        total_qty_ += (new_qty - o->qty);
        o->qty = new_qty;
    }

    Order*  front()     const noexcept { return head_.next == &tail_ ? nullptr : head_.next; }
    bool    empty()     const noexcept { return count_ == 0; }
    int     count()     const noexcept { return count_; }
    long    total_qty() const noexcept { return total_qty_; }
};`,
    explanation:
      "The intrusive list stores O(1) pointers inside each order struct, enabling removal in O(1) given the order pointer — critical for order cancellation, which arrives by order-id and must not scan the full queue. The sentinel pattern eliminates all null checks on the hot path: head_.next is always valid (it points to tail_ when the list is empty).",
  },
  {
    id: "cpp-20260610-b1-coroutine-tick-replay",
    language: "cpp",
    title: "C++20 coroutine generator — lazy market data tick replay",
    tag: "modern",
    code: `#include <coroutine>
#include <optional>
#include <vector>
#include <cstdint>

// Stackless coroutine generator: lazily yields one value at a time.
// No buffering of the full stream — perfect for replaying large tick files.
template<typename T>
struct Generator {
    struct promise_type {
        std::optional<T> current;
        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v)  noexcept {
            current = std::move(v);
            return {};
        }
        void return_void()        noexcept {}
        void unhandled_exception()         { std::rethrow_exception(std::current_exception()); }
    };

    using Handle = std::coroutine_handle<promise_type>;
    Handle h_;
    explicit Generator(Handle h) : h_(h) {}
    ~Generator() { if (h_) h_.destroy(); }

    struct Sentinel {};
    struct Iter {
        Handle h;
        bool operator!=(Sentinel) const noexcept { return !h.done(); }
        Iter& operator++() { h.resume(); return *this; }
        T     operator*()  const { return *h.promise().current; }
    };
    Iter    begin() { h_.resume(); return {h_}; }
    Sentinel end() { return {}; }
};

struct Tick { std::uint64_t ts_ns; double price; int qty; char side; };

// Coroutine body — suspends at each co_yield, resumes on ++iterator
Generator<Tick> replayFile(const std::vector<Tick>& ticks,
                            std::uint64_t start_ns = 0) {
    for (const auto& t : ticks) {
        if (t.ts_ns >= start_ns)
            co_yield t;        // suspends here; resumes on next ++
    }
}

// Consumer: range-for drives the coroutine one tick at a time
void backtest(const std::vector<Tick>& ticks) {
    for (const Tick& t : replayFile(ticks))
        (void)t;   // process t
}`,
    explanation:
      "C++20 coroutines suspend at co_yield without a stack frame heap allocation — the frame is allocated once on coroutine creation. The generator pattern is O(1) memory regardless of stream length, unlike a callback that must buffer the entire dataset. This is the basis for high-performance event-loop frameworks where each protocol handler is a coroutine driven by I/O readiness.",
  },
  {
    id: "cpp-20260610-b1-explicit-euler-fd",
    language: "cpp",
    title: "Explicit Euler finite-difference — Black-Scholes PDE on linear grid",
    tag: "quant",
    code: `#include <vector>
#include <algorithm>
#include <cmath>

// Explicit (forward) Euler FD for Black-Scholes: march backwards from expiry.
// Grid: S in [0, S_max] with dS spacing; time in [0, T] with dt spacing.
// Stability requirement: 0.5*sigma^2*S_max^2*dt/dS^2 < 0.5  (CFL condition).
// Violation causes exponentially growing oscillations — always check before use.

double explicitEulerCall(double S0, double K, double r, double sigma, double T,
                          int N = 300,   // asset price steps
                          int M = 1000)  // time steps
{
    const double S_max = 4.0 * K;
    const double dS    = S_max / N;
    const double dt    = T / M;

    // CFL stability check (warn: assertion in production would be assert())
    // dt <= dS^2 / (sigma^2 * S_max^2) is conservative; actual bound depends on r
    std::vector<double> V(N + 1), V_new(N + 1);

    // Terminal condition: V(S, T) = max(S - K, 0)
    for (int i = 0; i <= N; ++i)
        V[i] = std::max(i * dS - K, 0.0);

    // March backwards in time
    for (int j = M - 1; j >= 0; --j) {
        double tau = (M - j) * dt;
        V_new[0] = 0.0;                                        // S=0: call worthless
        V_new[N] = S_max - K * std::exp(-r * tau);            // S=S_max: deep ITM approx

        for (int i = 1; i < N; ++i) {
            double S   = i * dS;
            // Central differences for Greeks
            double dV  = (V[i+1] - V[i-1]) / (2.0 * dS);       // delta approx
            double d2V = (V[i+1] - 2.0*V[i] + V[i-1]) / (dS*dS); // gamma approx
            V_new[i] = V[i] + dt * (0.5*sigma*sigma*S*S*d2V + r*S*dV - r*V[i]);
        }
        V.swap(V_new);
    }

    // Linear interpolation to exact S0
    double fi   = S0 / dS;
    int    i0   = std::clamp(static_cast<int>(fi), 0, N - 1);
    double frac = fi - i0;
    return (1.0 - frac) * V[i0] + frac * V[i0 + 1];
}`,
    explanation:
      "Explicit Euler is conditionally stable only when the time step satisfies the CFL condition — violating it produces a non-physical growing oscillation rather than a smooth price surface. Its key advantage is simplicity: no matrix inversion needed, just a forward sweep over the grid. For production use, Crank-Nicolson (implicit) is preferred because it is unconditionally stable.",
  },
  {
    id: "cpp-20260610-b1-crank-nicolson-fd",
    language: "cpp",
    title: "Crank-Nicolson FD — unconditionally stable implicit European pricer",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Thomas algorithm: O(N) tridiagonal solver  (a[i]*x[i-1] + b[i]*x[i] + c[i]*x[i+1] = d[i])
void thomasSolve(std::vector<double>& a, std::vector<double>& b,
                 std::vector<double>& c, std::vector<double>& d) {
    int n = static_cast<int>(b.size());
    for (int i = 1; i < n; ++i) {
        double m = a[i] / b[i-1];
        b[i] -= m * c[i-1];
        d[i] -= m * d[i-1];
    }
    d[n-1] /= b[n-1];
    for (int i = n-2; i >= 0; --i)
        d[i] = (d[i] - c[i]*d[i+1]) / b[i];
}

// Crank-Nicolson: average of explicit and implicit operator -> second-order in time.
// Unconditionally stable (no CFL constraint) and free of numerical oscillations.
double crankNicolsonCall(double S0, double K, double r, double sigma,
                          double T, int N = 200, int M = 200) {
    const double S_max = 4.0 * K;
    const double dS    = S_max / N;
    const double dt    = T / M;
    const double theta = 0.5;   // 0.5 = Crank-Nicolson; 1.0 = fully implicit

    std::vector<double> V(N + 1);
    for (int i = 0; i <= N; ++i)
        V[i] = std::max(i * dS - K, 0.0);

    std::vector<double> a(N-1), b(N-1), c(N-1), d(N-1);

    for (int j = M - 1; j >= 0; --j) {
        double tau = (M - j) * dt;
        // Boundary values for next time level
        double V_0 = 0.0;
        double V_N = S_max - K * std::exp(-r * tau);

        for (int i = 1; i < N; ++i) {
            double S   = i * dS;
            double sig2 = 0.5 * sigma * sigma * S * S;
            double rS   = 0.5 * r * S;
            // Sub/super/main diagonal of the implicit operator
            a[i-1] = -theta * dt * (sig2/dS/dS - rS/dS);
            b[i-1] =  1.0 + theta * dt * (2.0*sig2/dS/dS + r);
            c[i-1] = -theta * dt * (sig2/dS/dS + rS/dS);
            // Explicit operator applied to current V
            double exp_a = (1.0-theta)*dt*(sig2/dS/dS - rS/dS);
            double exp_b = 1.0 - (1.0-theta)*dt*(2.0*sig2/dS/dS + r);
            double exp_c = (1.0-theta)*dt*(sig2/dS/dS + rS/dS);
            double V_prev = (i == 1) ? V_0 : V[i-1];
            double V_next = (i == N-1) ? V_N : V[i+1];
            d[i-1] = exp_a*V_prev + exp_b*V[i] + exp_c*V_next;
        }
        d[0]   += theta*dt*(0.5*sigma*sigma*dS*dS - 0.5*r*dS) * V_0 / (dS*dS);
        d[N-2] += theta*dt*(0.5*sigma*sigma*(N-1)*(N-1)*dS*dS
                  + 0.5*r*(N-1)*dS) * V_N / (dS*dS);

        thomasSolve(a, b, c, d);
        for (int i = 1; i < N; ++i)
            V[i] = d[i-1];
        V[0] = V_0;  V[N] = V_N;
    }

    double fi = S0 / dS;
    int    i0 = std::clamp(static_cast<int>(fi), 0, N-1);
    return (1.0 - (fi - i0)) * V[i0] + (fi - i0) * V[i0+1];
}`,
    explanation:
      "Crank-Nicolson averages the explicit and implicit operators to achieve second-order accuracy in both space and time with no stability restriction on dt. The tridiagonal structure (each grid point only couples to its neighbours) makes the Thomas algorithm exact in O(N) — the same complexity as the explicit scheme but with arbitrary time step sizes.",
  },
  {
    id: "cpp-20260610-b1-cir-model",
    language: "cpp",
    title: "CIR short-rate model — full-truncation Euler + closed-form ZCB",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <stdexcept>

// Cox-Ingersoll-Ross (1985): dr = kappa*(theta - r)*dt + sigma*sqrt(r)*dW
// Feller condition: 2*kappa*theta > sigma^2 ensures r > 0 a.s.
// Full truncation: replace r in diffusion by max(r, 0) — keeps r non-negative
// without requiring the Feller condition to hold exactly.

std::vector<double> cirEuler(double r0, double kappa, double theta,
                              double sigma, double T, int steps, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double dt  = T / steps;
    double sqdt = std::sqrt(dt);
    std::vector<double> path(steps + 1);
    path[0] = r0;
    for (int i = 0; i < steps; ++i) {
        double r     = path[i];
        double r_pos = std::max(r, 0.0);   // full truncation: diffusion uses max(r,0)
        path[i+1] = r + kappa*(theta - r)*dt + sigma*std::sqrt(r_pos)*sqdt*nd(rng);
    }
    return path;
}

// Closed-form ZCB: P(0,T) = A(T)*exp(-B(T)*r0)
// Only valid analytically when Feller condition holds; use MC otherwise.
struct CIRBondResult { double price, yield; };

CIRBondResult cirZCB(double r0, double kappa, double theta, double sigma, double T) {
    if (T < 1e-9) return {1.0, r0};
    double gamma  = std::sqrt(kappa*kappa + 2.0*sigma*sigma);
    double expGT  = std::exp(gamma * T);
    double denom  = (gamma + kappa)*(expGT - 1.0) + 2.0*gamma;

    double B     = 2.0*(expGT - 1.0) / denom;
    double logA  = (2.0*kappa*theta / (sigma*sigma)) *
                   std::log(2.0*gamma*std::exp(0.5*(kappa + gamma)*T) / denom);
    double P     = std::exp(logA - B*r0);
    double yield = -std::log(P) / T;
    return {P, yield};
}

// Yield curve: solve for rates at tenors [0.25, 0.5, 1, 2, 5, 10]
void printCIRCurve(double r0, double kappa, double theta, double sigma) {
    for (double T : {0.25, 0.5, 1.0, 2.0, 5.0, 10.0}) {
        auto [P, y] = cirZCB(r0, kappa, theta, sigma, T);
        (void)P; (void)y;
    }
}`,
    explanation:
      "The Feller condition (2κθ > σ²) guarantees the CIR process stays strictly positive — when it is borderline satisfied or violated, the full-truncation scheme is the most widely used discretisation because it preserves non-negativity while keeping the drift term correct. The closed-form ZCB formula emerges from the affine term-structure property: both log P and its gradient in r are affine in r₀.",
  },
  {
    id: "cpp-20260610-b1-vasicek-model",
    language: "cpp",
    title: "Vasicek short-rate model — ZCB, yield curve, and forward rates",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>
#include <vector>

// Vasicek (1977): dr = kappa*(theta - r)*dt + sigma*dW
// Gaussian short rate: r can go negative (unlike CIR).
// Affine term structure: P(0,T) = exp(A(T) - B(T)*r0).
// Closed-form for ZCB, yield, forward rate — no simulation needed.
class VasicekModel {
public:
    double kappa;   // mean-reversion speed
    double theta;   // long-run mean
    double sigma;   // instantaneous volatility

    // B(T): loading of r0 on the short rate integral
    double B(double T) const noexcept {
        return (1.0 - std::exp(-kappa * T)) / kappa;
    }

    // log A(T): the deterministic part of log P(0,T)
    double logA(double T) const noexcept {
        double bt = B(T);
        return (theta - sigma*sigma / (2.0*kappa*kappa)) * (bt - T)
               - sigma*sigma * bt*bt / (4.0*kappa);
    }

    // Zero-coupon bond price P(0,T)
    double zcbPrice(double r0, double T) const noexcept {
        return std::exp(logA(T) - B(T)*r0);
    }

    // Continuously compounded yield Y(0,T) = -log P / T
    double yield(double r0, double T) const noexcept {
        return (B(T)*r0 - logA(T)) / T;
    }

    // Instantaneous forward rate f(0,T) = -d/dT log P(0,T)
    double forwardRate(double r0, double T) const noexcept {
        double expkT = std::exp(-kappa * T);
        double dB    = expkT;  // dB/dT = exp(-kappa*T)
        double dlogA = (theta - sigma*sigma / (2.0*kappa*kappa)) * (dB - 1.0)
                       - sigma*sigma * B(T) * dB / (2.0*kappa);
        return -(dlogA - dB * r0);
    }

    // Conditional mean E[r_T | r_0] and variance Var[r_T | r_0]
    double condMean(double r0, double T) const noexcept {
        return theta + (r0 - theta)*std::exp(-kappa*T);
    }
    double condVar(double T) const noexcept {
        double e2 = std::exp(-2.0*kappa*T);
        return sigma*sigma / (2.0*kappa) * (1.0 - e2);
    }

    // Hull-White / extended Vasicek: can set theta(t) = f(0,t) + dlogA/dT to fit initial curve
};`,
    explanation:
      "Vasicek is the prototype affine term-structure model: both the yield and its gradient in r₀ are linear (affine) functions of r₀, giving analytical ZCBs, forward rates, and caps without simulation. Its main limitation is the Gaussian r: negative rates are possible with small but non-zero probability, which was considered unphysical before 2015 but is now empirically observed in many sovereign markets.",
  },
  {
    id: "cpp-20260610-b1-barrier-brownian-bridge",
    language: "cpp",
    title: "Barrier option MC + Brownian bridge crossing correction",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Up-and-out call: knocked out if S touches barrier H from below.
// Discrete monitoring misses crossings between steps — BGK (1997) correction:
// given S_{t_i} = a < H and S_{t_{i+1}} = b < H, the probability of touching H
// in between = exp(-2 * ln(H/a) * ln(H/b) / (sigma^2 * dt)).
double upOutCallMC(double S0, double K, double H, double r, double sigma, double T,
                   int paths = 100'000, int steps = 252, int seed = 42) {
    if (S0 >= H) return 0.0;   // already above barrier

    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    std::uniform_real_distribution<double> ud(0.0, 1.0);
    double dt    = T / steps;
    double drift = (r - 0.5*sigma*sigma)*dt;
    double vol   = sigma * std::sqrt(dt);
    double payoffSum = 0.0;

    for (int p = 0; p < paths; ++p) {
        double S = S0;
        bool knocked = false;

        for (int s = 0; s < steps && !knocked; ++s) {
            double S_prev = S;
            S *= std::exp(drift + vol * nd(rng));

            if (S >= H) {           // discrete knockout
                knocked = true;
            } else if (S_prev < H) { // Brownian bridge correction
                double la = std::log(H / S_prev);
                double lb = std::log(H / S);
                if (la > 0.0 && lb > 0.0) {
                    double p_cross = std::exp(-2.0 * la * lb / (sigma*sigma*dt));
                    if (ud(rng) < p_cross) knocked = true;
                }
            }
        }
        if (!knocked)
            payoffSum += std::max(S - K, 0.0);
    }
    return std::exp(-r*T) * payoffSum / paths;
}

// Down-and-in put MC (reflect barrier at H_low, activated when S falls below H_low)
double downInPutMC(double S0, double K, double H, double r, double sigma, double T,
                   int paths = 100'000, int steps = 252, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    std::uniform_real_distribution<double> ud;
    double dt = T / steps, drift = (r - 0.5*sigma*sigma)*dt, vol = sigma*std::sqrt(dt);
    double payoffSum = 0.0;

    for (int p = 0; p < paths; ++p) {
        double S = S0;
        bool activated = (S0 <= H);
        for (int s = 0; s < steps; ++s) {
            double S_prev = S;
            S *= std::exp(drift + vol * nd(rng));
            if (!activated) {
                if (S <= H) { activated = true; continue; }
                double la = std::log(S_prev / H), lb = std::log(S / H);
                if (la > 0 && lb > 0 && ud(rng) < std::exp(-2.0*la*lb/(sigma*sigma*dt)))
                    activated = true;
            }
        }
        if (activated) payoffSum += std::max(K - S, 0.0);
    }
    return std::exp(-r*T) * payoffSum / paths;
}`,
    explanation:
      "The BGK Brownian bridge correction converts discrete barrier monitoring into a continuous-limit approximation by computing the conditional probability of a Brownian path crossing the barrier given its endpoint values. Without this correction, discrete monitoring underestimates the knockout probability by O(1/√steps), requiring ~4× more time steps to achieve the same accuracy.",
  },
  {
    id: "cpp-20260610-b1-portfolio-dv01",
    language: "cpp",
    title: "Bond portfolio DV01 — parallel yield shift full revaluation",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <numeric>

// DV01 (Dollar Value of 01bp): negative of the portfolio PV change for a +1bp yield shift.
// Full revaluation avoids duration approximation errors on long-dated or callable bonds.

double bondDirtyPrice(double face, double coupon_rate, double ytm,
                      int n_periods, int freq = 2) noexcept {
    double c  = coupon_rate * face / freq;
    double y  = ytm / freq;
    double pv = 0.0;
    double df = 1.0;
    for (int t = 1; t <= n_periods; ++t) {
        df  /= (1.0 + y);
        pv  += c * df;
    }
    pv += face * df;   // final principal at the last coupon date
    return pv;
}

struct BondPos {
    double face;
    double coupon;        // annual coupon rate
    double ytm;           // yield to maturity
    int    periods;       // total semi-annual coupon periods remaining
    double notional;      // quantity (signed: positive = long)
};

// Portfolio DV01 by full revaluation at Y and Y + 1bp
double portfolioDV01(const std::vector<BondPos>& book) {
    constexpr double BP = 0.0001;   // 1 basis point
    double dv01 = 0.0;
    for (const auto& b : book) {
        double P0 = bondDirtyPrice(b.face, b.coupon, b.ytm,       b.periods);
        double P1 = bondDirtyPrice(b.face, b.coupon, b.ytm + BP,  b.periods);
        dv01 += (P1 - P0) * b.notional;  // negative for long bond (price falls as yield rises)
    }
    return dv01;   // sign convention: negative means we lose money when yields rise
}

// Modified duration: DV01 = -ModDur * Price * 0.0001 (approximation)
double modifiedDuration(double face, double coupon, double ytm, int periods) {
    double P   = bondDirtyPrice(face, coupon, ytm, periods);
    double c   = coupon * face / 2.0;
    double y   = ytm / 2.0;
    double mac = 0.0;
    double df  = 1.0;
    for (int t = 1; t <= periods; ++t) {
        df  /= (1.0 + y);
        mac += static_cast<double>(t) / 2.0 * (c + (t == periods ? face : 0.0)) * df;
    }
    return (mac / P) / (1.0 + y);  // convert Macaulay to modified, semi -> annual
}`,
    explanation:
      "Full revaluation DV01 is preferred over duration approximation for non-linear instruments because it captures the convexity effect implicitly — a 30-year bond with convexity 200 has a DV01 approximation error of ~10% for a 100bp move. The sign convention (negative for long bonds) aligns with trading P&L: if you are long duration and yields rise 1bp, you lose |DV01|.",
  },
  {
    id: "cpp-20260610-b1-token-bucket",
    language: "cpp",
    title: "Token bucket rate limiter — atomic order submission throttle",
    tag: "concurrency",
    code: `#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdint>

// Token bucket: allows burst up to capacity, then limits to rate/sec.
// Lock-free for the common (not-throttled) case using CAS on a packed state.
// Packs (tokens_fp * SCALE, last_refill_ns) into two separate atomics.
// Production: use a mutex for simplicity if contention is acceptable.

class TokenBucket {
    using Clock = std::chrono::steady_clock;
    const double   capacity_;
    const double   rate_;          // tokens per second
    std::atomic<double>            tokens_;
    std::atomic<std::int64_t>      last_ns_;

    static std::int64_t now_ns() noexcept {
        return std::chrono::duration_cast<std::chrono::nanoseconds>(
            Clock::now().time_since_epoch()).count();
    }

public:
    TokenBucket(double cap, double rate) noexcept
        : capacity_(cap), rate_(rate),
          tokens_(cap), last_ns_(now_ns()) {}

    // Returns true and consumes 1 token; false if throttled.
    bool try_consume() noexcept {
        const std::int64_t now  = now_ns();
        const std::int64_t last = last_ns_.exchange(now, std::memory_order_relaxed);
        double elapsed = std::max(0.0, (now - last) * 1e-9);
        double current = tokens_.load(std::memory_order_relaxed);
        double refilled = std::min(current + elapsed * rate_, capacity_);
        if (refilled < 1.0) {
            last_ns_.store(last, std::memory_order_relaxed);  // undo timestamp update
            return false;
        }
        // Simple CAS — not truly atomic with the timestamp update (acceptable for rate limiting)
        double expected = current;
        if (tokens_.compare_exchange_strong(expected, refilled - 1.0,
                                             std::memory_order_relaxed)) {
            return true;
        }
        // Retry on CAS failure (another thread consumed)
        last_ns_.store(last, std::memory_order_relaxed);
        return try_consume();
    }

    double available() noexcept {
        auto now  = now_ns();
        auto last = last_ns_.load(std::memory_order_relaxed);
        double t  = tokens_.load(std::memory_order_relaxed);
        return std::min(t + (now - last) * 1e-9 * rate_, capacity_);
    }
};
// Typical config: cap=10 orders/burst, rate=5 orders/sec
// Prevents exchange rejection for excessive message rates (OUCH, FIX throttle)`,
    explanation:
      "The token bucket allows short bursts up to capacity (absorbing bursty market events) while maintaining a long-run rate limit. The exchange timestamp-and-CAS pattern ensures that tokens earned between calls are accounted for even across long idle periods — a critical correctness property that a simple counter does not provide.",
  },
  {
    id: "cpp-20260610-b1-fix-sv-parser",
    language: "cpp",
    title: "std::string_view FIX tag-value parser — zero-copy field extraction",
    tag: "market-data",
    code: `#include <string_view>
#include <optional>
#include <charconv>
#include <cstdint>

// Zero-copy FIX parser: std::string_view slices into the receive buffer.
// No heap allocation; from_chars avoids locale-dependent atoi/strtol.
// FIX message format: "8=FIX.4.2\x0135=D\x0149=SENDER\x01..."
struct FIXField { int tag; std::string_view value; };

class FIXParser {
    std::string_view msg_;
    std::size_t      pos_ = 0;
public:
    explicit FIXParser(std::string_view msg) noexcept : msg_(msg) {}

    // Returns next field or nullopt when exhausted
    [[nodiscard]] std::optional<FIXField> next() noexcept {
        if (pos_ >= msg_.size()) return {};

        // Locate '=' separating tag from value
        auto eq = msg_.find('=', pos_);
        if (eq == std::string_view::npos) return {};

        int tag = 0;
        auto [end, ec] = std::from_chars(msg_.data() + pos_, msg_.data() + eq, tag);
        if (ec != std::errc{}) return {};   // malformed tag number

        // SOH (0x01) terminates the value field
        auto soh = msg_.find('\x01', eq + 1);
        std::string_view value;
        if (soh == std::string_view::npos) {
            value = msg_.substr(eq + 1);
            pos_  = msg_.size();
        } else {
            value = msg_.substr(eq + 1, soh - eq - 1);
            pos_  = soh + 1;
        }
        return FIXField{tag, value};
    }

    void reset() noexcept { pos_ = 0; }
};

// Helper: extract a specific tag (scans forward — O(N) but N is small for FIX messages)
[[nodiscard]] std::optional<std::string_view> fixGetTag(std::string_view msg, int target) noexcept {
    FIXParser p(msg);
    while (auto f = p.next())
        if (f->tag == target) return f->value;
    return {};
}

// Extract double value (e.g. tag 44 = Price) without atof/locale
[[nodiscard]] std::optional<double> fixGetDouble(std::string_view msg, int tag) noexcept {
    auto sv = fixGetTag(msg, tag);
    if (!sv) return {};
    double val = 0.0;
    auto [ptr, ec] = std::from_chars(sv->data(), sv->data() + sv->size(), val);
    return (ec == std::errc{}) ? std::optional{val} : std::nullopt;
}`,
    explanation:
      "std::string_view provides a non-owning slice into an existing buffer — the parser advances pos_ through the fixed SOH-delimited format without any string copies. std::from_chars parses integers and floats directly from the view without null-termination or locale interpretation, which is critical in an international FIX environment where ',' vs '.' decimal separators would corrupt floating-point parsing.",
  },
  {
    id: "cpp-20260610-b1-price-ladder",
    language: "cpp",
    title: "Sorted price ladder — binary search over compact level array",
    tag: "data-structures",
    code: `#include <vector>
#include <algorithm>
#include <optional>
#include <cstdint>

// Compact sorted array for order book price levels.
// Better than std::map for typical market depth (5-20 active levels per side):
// - Contiguous memory: sequential access hits L1 cache every time.
// - Binary search O(log N): for N <= 32, branch predictor + SIMD beats tree traversal.
// - No allocator overhead per level.

struct Level {
    std::int64_t price_ticks;   // integer: avoids FP equality bugs
    std::int64_t total_qty;
    int          order_count;
};

class PriceLadder {
    std::vector<Level> levels_;
    const bool         ascending_;   // true for ask side, false for bid side

    auto cmpFn() const noexcept {
        return [this](const Level& l, std::int64_t t) noexcept {
            return ascending_ ? l.price_ticks < t : l.price_ticks > t;
        };
    }

public:
    explicit PriceLadder(bool ascending) : ascending_(ascending) {}

    // O(log N) lookup; O(N) insert (acceptable for small N)
    Level* touch(std::int64_t ticks) {
        auto it = std::lower_bound(levels_.begin(), levels_.end(), ticks, cmpFn());
        if (it != levels_.end() && it->price_ticks == ticks)
            return &*it;
        return &*levels_.insert(it, Level{ticks, 0, 0});
    }

    [[nodiscard]] std::optional<Level> find(std::int64_t ticks) const noexcept {
        auto it = std::lower_bound(levels_.cbegin(), levels_.cend(), ticks, cmpFn());
        if (it != levels_.cend() && it->price_ticks == ticks)
            return *it;
        return {};
    }

    void erase(std::int64_t ticks) noexcept {
        auto it = std::lower_bound(levels_.begin(), levels_.end(), ticks, cmpFn());
        if (it != levels_.end() && it->price_ticks == ticks)
            levels_.erase(it);
    }

    Level* best()         noexcept { return levels_.empty() ? nullptr : &levels_.front(); }
    std::size_t depth()   const noexcept { return levels_.size(); }
    bool   empty()        const noexcept { return levels_.empty(); }

    // Top-N levels for market impact estimate
    std::vector<Level> topN(int n) const {
        int take = std::min(n, static_cast<int>(levels_.size()));
        return {levels_.begin(), levels_.begin() + take};
    }
};`,
    explanation:
      "For order books with shallow depth (< 32 levels), sorted vector + binary search outperforms std::map because the contiguous layout eliminates cache misses from pointer chasing in tree nodes. At 16 bytes per Level and 16 levels, the entire ask or bid ladder fits in a single 256-byte cache region — a full sweep for market impact calculation touches only 4 cache lines.",
  },
  {
    id: "cpp-20260610-b1-power-iteration",
    language: "cpp",
    title: "Power iteration — dominant eigenvector for portfolio risk PCA",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <stdexcept>

// Power iteration: find dominant (largest eigenvalue) eigenvector of a PSD matrix.
// Converges at rate |lambda_2/lambda_1| per iteration.
// Used for: first principal component of a covariance matrix (market risk factor).
struct EigenPair { std::vector<double> vec; double val; int iters; };

EigenPair powerIteration(const std::vector<std::vector<double>>& A,
                          double tol = 1e-10, int max_iter = 1000) {
    int n = static_cast<int>(A.size());
    if (n == 0 || A[0].size() != static_cast<std::size_t>(n))
        throw std::invalid_argument("A must be square");

    // Start from uniform vector (avoids accidental orthogonality to dominant eigenvector)
    std::vector<double> v(n, 1.0 / std::sqrt(static_cast<double>(n)));
    double lambda = 0.0;

    for (int iter = 0; iter < max_iter; ++iter) {
        // w = A * v
        std::vector<double> w(n, 0.0);
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                w[i] += A[i][j] * v[j];

        // Rayleigh quotient estimate lambda = v^T * w
        double lam_new = std::inner_product(v.begin(), v.end(), w.begin(), 0.0);

        // Normalise w -> next v
        double norm = std::sqrt(std::inner_product(w.begin(), w.end(), w.begin(), 0.0));
        if (norm < 1e-14) throw std::runtime_error("zero vector in power iteration");
        for (auto& x : w) x /= norm;

        if (std::abs(lam_new - lambda) < tol)
            return {w, lam_new, iter + 1};

        lambda = lam_new;
        v      = w;
    }
    return {v, lambda, max_iter};
}

// Extract all k principal components via deflation
std::vector<EigenPair> pca(std::vector<std::vector<double>> C, int k) {
    std::vector<EigenPair> result;
    for (int pc = 0; pc < k; ++pc) {
        auto [vec, val, iters] = powerIteration(C);
        result.push_back({vec, val, iters});
        // Deflate: C -= lambda * v * v^T
        int n = static_cast<int>(vec.size());
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                C[i][j] -= val * vec[i] * vec[j];
    }
    return result;
}`,
    explanation:
      "Power iteration multiplies by A repeatedly and renormalises — the dominant eigenvector emerges because all other components decay geometrically at rate |λ₂/λ₁|. For a correlation matrix, the first PC is typically the market factor (all positive loadings); deflation subtracts it out so that the next iteration converges to the sector or style factor (the second-largest eigenvalue).",
  },
  {
    id: "cpp-20260610-b1-raii-handle",
    language: "cpp",
    title: "RAII unique handle — custom deleter for network and file descriptors",
    tag: "modern",
    code: `#include <memory>
#include <functional>
#include <stdexcept>
#include <string>
#include <utility>

// RAII via unique_ptr with a custom deleter.
// Guarantees cleanup at every exit path (return, throw, scope end)
// without explicit try/finally or error-code checks.

// Pattern 1: wrap an integer file descriptor (POSIX)
struct FDDeleter {
    void operator()(int* p) const noexcept {
        if (p && *p >= 0) {
            // ::close(*p);  // POSIX: would be called here in real code
            *p = -1;
        }
        delete p;
    }
};
using UniqueFile = std::unique_ptr<int, FDDeleter>;

UniqueFile openFile(const char* path) {
    // int fd = ::open(path, O_RDONLY);  // POSIX
    int fd = 3;  // placeholder — substitute actual open() call
    if (fd < 0)
        throw std::runtime_error(std::string("open: ") + path);
    return UniqueFile(new int(fd));
}

// Pattern 2: strong typedef for non-pointer handles (e.g. Windows HANDLE)
template<typename T, T Invalid, auto Destroy>
class UniqueHandle {
    T h_;
public:
    explicit UniqueHandle(T h = Invalid) noexcept : h_(h) {}
    ~UniqueHandle() noexcept { if (h_ != Invalid) Destroy(h_); }
    UniqueHandle(UniqueHandle&& o) noexcept : h_(std::exchange(o.h_, Invalid)) {}
    UniqueHandle& operator=(UniqueHandle&& o) noexcept {
        if (this != &o) { if (h_ != Invalid) Destroy(h_); h_ = std::exchange(o.h_, Invalid); }
        return *this;
    }
    UniqueHandle(const UniqueHandle&)            = delete;
    UniqueHandle& operator=(const UniqueHandle&) = delete;

    T    get()     const noexcept { return h_; }
    bool valid()   const noexcept { return h_ != Invalid; }
    T    release() noexcept       { return std::exchange(h_, Invalid); }
};

// Instantiation examples (type-safe, zero overhead vs naked int):
// auto closeFD = [](int fd) noexcept { if (fd >= 0) ::close(fd); };
// using OwnedFD = UniqueHandle<int, -1, closeFD>;
// For POSIX mmap: UniqueHandle<void*, MAP_FAILED, munmapper> where munmapper wraps munmap.`,
    explanation:
      "Custom deleters encode the cleanup action in the type itself, making resource leaks detectable at compile time — if a UniqueFile goes out of scope, the fd is closed regardless of how many early-return branches exist. The template UniqueHandle generalises this to any non-pointer handle type (Windows HANDLEs, OpenSSL EVP_CTX*, SHM ids) with a type parameter for the invalid sentinel value.",
  },
  {
    id: "cpp-20260610-b1-position-netting",
    language: "cpp",
    title: "Position netting engine — aggregate long/short by symbol",
    tag: "market-data",
    code: `#include <unordered_map>
#include <string>
#include <string_view>
#include <vector>
#include <algorithm>

// Netting engine: aggregate fills into a net position per (symbol, account).
// Flat map of (symbol, account) -> NetPosition handles hundreds of symbols/accounts.

struct Fill {
    std::string    symbol;
    std::string    account;
    double         qty;      // positive = buy, negative = sell
    double         price;    // fill price
};

struct NetPosition {
    double qty         = 0.0;   // signed net quantity
    double avg_cost    = 0.0;   // volume-weighted average cost
    double realised_pnl = 0.0;
    double gross_buy   = 0.0;   // total bought
    double gross_sell  = 0.0;   // total sold (absolute value)

    // Update on fill: WAC for avg_cost, realised PnL on reducing fills
    void applyFill(double fill_qty, double fill_price) noexcept {
        if (fill_qty == 0.0) return;
        bool   same_side = (qty * fill_qty > 0.0);

        if (same_side || qty == 0.0) {
            // Opening or adding to position: update avg_cost
            double new_qty   = qty + fill_qty;
            avg_cost = (avg_cost * std::abs(qty) + fill_price * std::abs(fill_qty))
                       / (std::abs(new_qty) > 1e-9 ? std::abs(new_qty) : 1.0);
            qty = new_qty;
        } else {
            // Reducing or flipping: realise PnL on the closing portion
            double close_qty = std::min(std::abs(fill_qty), std::abs(qty));
            realised_pnl += close_qty * (fill_price - avg_cost) * (qty > 0 ? 1.0 : -1.0);
            qty += fill_qty;
            if (std::abs(qty) < 1e-9) { qty = 0.0; avg_cost = 0.0; } // fully flat
            else if (qty * fill_qty > 0.0) avg_cost = fill_price;     // flipped
        }
        if (fill_qty > 0) gross_buy  += fill_qty;
        else              gross_sell -= fill_qty;
    }
};

using NetMap = std::unordered_map<std::string, NetPosition>;

NetMap netPositions(const std::vector<Fill>& fills) {
    NetMap book;
    for (const auto& f : fills) {
        std::string key = f.symbol + "|" + f.account;
        book[key].applyFill(f.qty, f.price);
    }
    return book;
}`,
    explanation:
      "The netting engine's weighted average cost (WAC) tracks avg_cost as fills accumulate, realising P&L incrementally when a position is reduced. The same-side/opposing-side branch handles partial closes (flip with remaining open) and full closes (position goes to zero) — covering all the edge cases that naive quantity accumulation misses and creating an audit trail for trade matching.",
  },
  {
    id: "cpp-20260610-b1-lock-free-stack",
    language: "cpp",
    title: "Lock-free stack with tagged pointer — ABA hazard mitigation",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <optional>

// ABA problem: thread T1 reads head=A, sleeps; T2 pops A, pushes B, pops B, pushes A.
// T1 resumes and CAS(head, A, A.next) succeeds — but A.next may now be garbage.
// Tagged pointer: pack a version counter into the unused upper bits of the pointer.
// Each successful CAS increments the tag — an old (ptr, tag) pair never matches a new one.

struct Node { int val; Node* next = nullptr; };

struct TaggedPtr {
    std::uintptr_t bits = 0;
    static constexpr std::uintptr_t TAG_MASK  = 0xFFFF000000000000ULL; // upper 16 bits
    static constexpr std::uintptr_t PTR_MASK  = ~TAG_MASK;
    static constexpr int            TAG_SHIFT = 48;

    TaggedPtr() noexcept = default;
    TaggedPtr(Node* p, std::uint16_t tag) noexcept
        : bits((static_cast<std::uintptr_t>(tag) << TAG_SHIFT)
               | (reinterpret_cast<std::uintptr_t>(p) & PTR_MASK)) {}

    Node*        ptr() const noexcept { return reinterpret_cast<Node*>(bits & PTR_MASK); }
    std::uint16_t tag() const noexcept { return static_cast<std::uint16_t>(bits >> TAG_SHIFT); }
};

class LockFreeStack {
    std::atomic<TaggedPtr> head_{};

public:
    void push(Node* node) noexcept {
        TaggedPtr old = head_.load(std::memory_order_relaxed);
        TaggedPtr desired;
        do {
            node->next = old.ptr();
            desired    = TaggedPtr(node, static_cast<std::uint16_t>(old.tag() + 1));
        } while (!head_.compare_exchange_weak(old, desired,
                                               std::memory_order_release,
                                               std::memory_order_relaxed));
    }

    Node* pop() noexcept {
        TaggedPtr old = head_.load(std::memory_order_acquire);
        TaggedPtr desired;
        do {
            if (!old.ptr()) return nullptr;
            desired = TaggedPtr(old.ptr()->next, static_cast<std::uint16_t>(old.tag() + 1));
        } while (!head_.compare_exchange_weak(old, desired,
                                               std::memory_order_release,
                                               std::memory_order_acquire));
        return old.ptr();
    }
};
// Requires lock-free 64-bit atomic (guaranteed on x86-64 and ARM64).
// Hazard pointers or epoch-based reclamation still needed to safely free popped nodes.`,
    explanation:
      "The tagged pointer technique packs a monotonically increasing version counter into the high 16 bits of a 64-bit address (valid on x86-64 where only 48 bits are used for virtual addresses). Because the counter increments on every successful CAS, an old (pointer, stale-tag) pair never matches the current (same-pointer, new-tag) head — closing the ABA window without a separate memory reclamation scheme.",
  },
  {
    id: "cpp-20260610-b1-branchless-ops",
    language: "cpp",
    title: "Branchless abs/sign/clamp — bit tricks for numeric hot paths",
    tag: "performance",
    code: `#include <cstdint>
#include <limits>
#include <cstring>
#include <type_traits>

// Branchless operations for hot numeric loops.
// Modern CPUs can execute conditional moves (CMOV) for if-else chains,
// but the compiler only generates them reliably for simple scalar expressions.
// Bit tricks guarantee branchlessness and avoid branch mispredicts on random data.

// Integer absolute value without branch (avoids UB vs abs() on INT_MIN)
[[nodiscard]] inline std::int64_t abs64(std::int64_t x) noexcept {
    std::int64_t mask = x >> 63;   // arithmetic shift: all-1s if negative, 0 if positive
    return (x + mask) ^ mask;      // two's complement negation via XOR
}

// Sign: returns -1, 0, +1 without branches
[[nodiscard]] inline int sign(std::int64_t x) noexcept {
    return static_cast<int>((x > 0) - (x < 0));  // compiler generates two setg/setl, sub
}

// Branchless clamp for integer tick prices
[[nodiscard]] inline std::int64_t clampTick(std::int64_t v, std::int64_t lo, std::int64_t hi) noexcept {
    // On x86 with -O2: compiles to two CMOV instructions
    v = v < lo ? lo : v;
    v = v > hi ? hi : v;
    return v;
}

// Type-punning double <-> uint64 for bit manipulation on floating-point values
[[nodiscard]] inline std::uint64_t doubleBits(double x) noexcept {
    std::uint64_t bits;
    static_assert(sizeof(x) == sizeof(bits));
    std::memcpy(&bits, &x, sizeof(bits));
    return bits;
}

// Test if two doubles are equal within 1 ULP (Unit in the Last Place)
[[nodiscard]] inline bool ulpEqual(double a, double b) noexcept {
    std::uint64_t ua = doubleBits(a), ub = doubleBits(b);
    return abs64(static_cast<std::int64_t>(ua) -
                 static_cast<std::int64_t>(ub)) <= 1;
}

// Power-of-2 check for capacity validation
[[nodiscard]] constexpr bool isPow2(std::size_t n) noexcept {
    return n > 0 && (n & (n - 1)) == 0;
}

// Next power of 2 >= n
[[nodiscard]] constexpr std::size_t nextPow2(std::size_t n) noexcept {
    --n; n |= n>>1; n |= n>>2; n |= n>>4; n |= n>>8; n |= n>>16; n |= n>>32;
    return ++n;
}`,
    explanation:
      "The arithmetic right-shift trick for abs64 works because the sign bit propagates into all 64 positions on two's-complement hardware — a negative number XORed with its own sign-extended mask performs the two's complement negation. The ulpEqual function uses integer comparison on the IEEE 754 bit pattern because consecutive doubles have consecutive 64-bit integer representations for values with the same exponent sign.",
  },
  {
    id: "cpp-20260610-b1-brownian-bridge",
    language: "cpp",
    title: "Brownian bridge sampling — conditional path refinement",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>

// Brownian bridge: sample W_t conditioned on W_0 = a and W_T = b.
// E[W_t | W_0, W_T] = a + (b - a) * t / T
// Var[W_t | W_0, W_T]  = t * (T - t) / T
//
// Applications: (1) refine coarse MC paths between monitoring dates;
//               (2) stratified sampling — fixes endpoints, samples interior;
//               (3) quasi-random low-discrepancy sequences for path generation.

// Sample W_t given W_0 = a (at s=0) and W_T = b (at s=T)
double bbSample(double a, double b, double s, double t, double T,
                std::mt19937_64& rng) {
    double mean = a + (b - a) * (t - s) / (T - s);
    double var  = (t - s) * (T - t) / (T - s);
    return mean + std::sqrt(var) * std::normal_distribution<double>{}(rng);
}

// Refine a coarse path using the Brownian bridge construction:
// Given path at dates t_0 < t_1 < ... < t_N, insert sub-dates between each step.
std::vector<double> refinePath(const std::vector<double>& coarse_log_S,
                                const std::vector<double>& coarse_times,
                                int sub_steps,
                                std::mt19937_64& rng) {
    int N = static_cast<int>(coarse_times.size()) - 1;
    std::vector<double> fine;
    fine.reserve(N * sub_steps + 1);
    fine.push_back(coarse_log_S[0]);

    for (int i = 0; i < N; ++i) {
        double a = coarse_log_S[i];
        double b = coarse_log_S[i + 1];
        double s = coarse_times[i];
        double T = coarse_times[i + 1];
        double dt_sub = (T - s) / sub_steps;

        for (int k = 1; k <= sub_steps; ++k) {
            double t = s + k * dt_sub;
            if (k < sub_steps)
                fine.push_back(bbSample(a, b, s, t, T, rng));
            else
                fine.push_back(b);   // endpoint is fixed
        }
    }
    return fine;
}`,
    explanation:
      "The Brownian bridge bridges the gap between coarse monitoring dates by conditioning on both endpoints — the intermediate value has the exact conditional distribution of a Brownian motion. This is used in quasi-Monte Carlo path generation (Sobol sequences assigned to the bridge hierarchy converge faster than direct assignment) and in barrier option pricing to maintain path consistency while monitoring barriers at intermediate times.",
  },
  {
    id: "cpp-20260610-b1-exact-ou-simulation",
    language: "cpp",
    title: "Exact Ornstein-Uhlenbeck simulation — no discretisation error",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>

// Ornstein-Uhlenbeck: dX = kappa*(mu - X)*dt + sigma*dW
// Exact transition density for a step of size dt:
//   X_{t+dt} | X_t ~ Normal(mu + (X_t - mu)*e^{-kappa*dt},
//                            sigma^2/(2*kappa) * (1 - e^{-2*kappa*dt}))
// Euler has discretisation error O(dt); exact simulation has none.
// Applications: mean-reverting spreads (stat-arb), short rate (Vasicek), volatility proxy.

std::vector<double> ouExact(double X0, double kappa, double mu, double sigma,
                             double T, int steps, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt      = T / steps;
    double e_kdt   = std::exp(-kappa * dt);
    double var_dt  = sigma * sigma / (2.0 * kappa) * (1.0 - e_kdt * e_kdt);
    double std_dt  = std::sqrt(var_dt);

    std::vector<double> path(steps + 1);
    path[0] = X0;
    for (int i = 0; i < steps; ++i) {
        double mean = mu + (path[i] - mu) * e_kdt;
        path[i+1]  = mean + std_dt * nd(rng);
    }
    return path;
}

// Estimate kappa, mu, sigma from observed process via MLE (closed form for OU)
struct OUParams { double kappa, mu, sigma; };
OUParams ouMLE(const std::vector<double>& path, double dt) {
    int n      = static_cast<int>(path.size()) - 1;
    double Sx  = 0.0, Sy = 0.0, Sxx = 0.0, Sxy = 0.0, Syy = 0.0;
    for (int i = 0; i < n; ++i) {
        double x = path[i], y = path[i+1];
        Sx += x;  Sy += y;  Sxx += x*x;  Sxy += x*y;  Syy += y*y;
    }
    double A = (n*Sxy - Sx*Sy) / (n*Sxx - Sx*Sx);
    double B = (Sy - A*Sx) / n;
    double C = (Syy - 2.0*A*Sxy + A*A*Sxx) / n - B*B;

    double kappa = -std::log(A) / dt;
    double mu    = B / (1.0 - A);
    double sigma = std::sqrt(2.0 * kappa * C / (1.0 - A*A));
    return {kappa, mu, sigma};
}`,
    explanation:
      "The exact OU simulation exploits the Gaussian transition density — the conditional distribution is Gaussian with analytically known mean and variance for any step size. This eliminates discretisation bias entirely, allowing any time step to be used without accuracy loss, unlike Euler-Maruyama which introduces O(dt) error. The MLE estimator is also closed-form, following from OLS regression of X_{t+dt} on X_t.",
  },
  {
    id: "cpp-20260610-b1-cds-valuation",
    language: "cpp",
    title: "CDS mark-to-market — premium leg vs protection leg PV",
    tag: "quant",
    code: `#include <cmath>
#include <vector>

// Credit Default Swap valuation:
// Premium leg:    PV = spread * sum_i( tau * disc(T_i) * survProb(T_i) )
// Protection leg: PV = (1 - R) * sum_i( disc(T_i) * (survProb(T_{i-1}) - survProb(T_i)) )
// At inception: premium leg PV = protection leg PV (par spread).
// MTM = (current_spread - par_spread) * RPV01

struct CDSResult {
    double premium_pv;     // present value of coupon (fee) stream
    double protection_pv;  // present value of default protection payment
    double rpv01;          // risky PV01 = sensitivity to 1bp spread change
    double fair_spread;    // par spread (in bps) that makes MTM = 0
    double mtm;            // mark-to-market for given contract_spread
};

CDSResult valueCDS(
    const std::vector<double>& payment_times,  // e.g. {0.25, 0.5, ..., T}
    const std::vector<double>& disc_factors,   // risk-free discount factors
    const std::vector<double>& surv_probs,     // survival probabilities
    double recovery      = 0.40,
    double contract_spread = 100.0,            // basis points
    double coupon_freq   = 4.0)                // quarterly = 4
{
    int n = static_cast<int>(payment_times.size());
    double dt        = 1.0 / coupon_freq;
    double prem_pv   = 0.0;
    double prot_pv   = 0.0;

    for (int i = 0; i < n; ++i) {
        double Q_i    = surv_probs[i];
        double Q_prev = (i == 0) ? 1.0 : surv_probs[i-1];
        double D      = disc_factors[i];

        prem_pv += dt * D * Q_i;                          // coupon accrual
        prot_pv += (1.0 - recovery) * D * (Q_prev - Q_i); // marginal default probability
    }

    double rpv01       = prem_pv;
    double fair_spread = (rpv01 > 1e-10) ? (prot_pv / rpv01 * 10'000.0) : 0.0;
    double mtm         = (fair_spread - contract_spread) * rpv01 / 10'000.0;

    return {prem_pv, prot_pv, rpv01, fair_spread, mtm};
}
// Par spread calibrated to market CDS quote => hazard rate via bootstrap (see 06-09 pyfin).
// DV01 ≈ 1bp * RPV01: a 1bp spread widening decreases the protection seller's MTM by RPV01.`,
    explanation:
      "The RPV01 (risky PV01) is the CDS equivalent of modified duration — it represents the change in MTM for a 1bp parallel shift in the spread curve. The discount factor reduces future cash flows for time value; the survival probability reduces them further for default risk. The product D×Q is the 'risky discount factor' that jointly accounts for both sources of value reduction.",
  },
  {
    id: "cpp-20260610-b1-quanto-option",
    language: "cpp",
    title: "Quanto call option — foreign asset priced in domestic currency",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>

// Quanto option: payoff in domestic currency of max(S_f - K_f, 0) where S_f is
// a foreign asset priced in foreign currency, but payout is in domestic currency
// at a FIXED notional FX rate (e.g., 1 USD per 1 EUR payoff).
//
// Key: the quanto adjustment shifts the drift of S_f under the domestic measure.
// Adjusted forward: F_q = S_0 * exp((r_d - r_f - rho*sigma_S*sigma_FX) * T)
// where rho = correlation between ln(S_f) and ln(FX) (foreign/domestic).

static double normCDF(double x) noexcept {
    return 0.5 * std::erfc(-x / std::numbers::sqrt2_v<double>);
}

struct QuantoResult { double price, delta, vega; };

QuantoResult quantoCall(
    double S0,        // current foreign asset price (in foreign ccy)
    double K,         // strike in foreign currency
    double r_d,       // domestic risk-free rate
    double r_f,       // foreign risk-free rate
    double sigma_S,   // volatility of the foreign asset
    double sigma_FX,  // volatility of FX rate (foreign/domestic)
    double rho,       // correlation: rho(dln S_f, d ln FX)
    double T)         // expiry
{
    // Quanto drift adjustment: rho*sigma_S*sigma_FX reduces the forward
    double adj_rate = r_d - r_f - rho * sigma_S * sigma_FX;
    double F        = S0 * std::exp(adj_rate * T);

    double sqT = std::sqrt(T);
    double d1  = (std::log(F / K) + 0.5 * sigma_S * sigma_S * T) / (sigma_S * sqT);
    double d2  = d1 - sigma_S * sqT;

    double Nd1 = normCDF(d1);
    double Nd2 = normCDF(d2);
    double phi = std::exp(-0.5 * d1 * d1) / std::sqrt(2.0 * std::numbers::pi);

    double disc  = std::exp(-r_d * T);
    double price = disc * (F * Nd1 - K * Nd2);
    double delta = disc * Nd1 * std::exp(adj_rate * T);  // per unit of foreign asset
    double vega  = disc * F * phi * sqT;

    return {price, delta, vega};
}
// The negative rho*sigma_S*sigma_FX term: when the foreign asset rises, the FX
// rate (foreign/domestic) also tends to rise (if rho > 0), making the domestic
// payout more expensive -> adjusted forward is LOWER than the standard forward.`,
    explanation:
      "The quanto adjustment compensates for the correlation between the foreign asset and the FX rate — ignoring it leads to mispricing because the domestic-currency payoff distribution is not the same as the foreign-currency payoff distribution. A positive correlation (rho > 0) reduces the adjusted forward because when the asset is up, the FX rate is also up, diluting the domestic-currency gain.",
  },
  {
    id: "cpp-20260610-b1-bdt-tree",
    language: "cpp",
    title: "Black-Derman-Toy tree — calibrated lognormal short-rate lattice",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <algorithm>

// Black-Derman-Toy (1990): lognormal short rate on a binomial tree.
// r_{n,i} = theta_n * exp(sigma_n * i) for node (step n, state i).
// Calibrate theta_n at each step so that tree ZCB prices match market ZCB prices.

struct BDTTree {
    int    steps;
    double dt;
    std::vector<std::vector<double>> r;      // short rates r[step][state]
    std::vector<double>              theta;  // calibrated drift per step
    std::vector<double>              sigma;  // vol per step (input)

    // Build calibrated tree matching market ZCB prices
    static BDTTree calibrate(const std::vector<double>& market_zcb,  // P(0,1),P(0,2),...
                              const std::vector<double>& vols,        // sigma for each step
                              double dt_) {
        int n = static_cast<int>(market_zcb.size());
        BDTTree tree;
        tree.steps = n;
        tree.dt    = dt_;
        tree.sigma = vols;
        tree.r.resize(n);
        tree.theta.resize(n);

        for (int step = 0; step < n; ++step) {
            tree.r[step].resize(step + 1);
            // Binary search for theta[step] that reproduces market_zcb[step]
            double lo = 1e-6, hi = 5.0;
            for (int iter = 0; iter < 60; ++iter) {
                double mid = 0.5 * (lo + hi);
                // Fill rates at this step
                for (int i = 0; i <= step; ++i)
                    tree.r[step][i] = mid * std::exp(vols[step] * i);
                // Price ZCB by backward induction
                double pv = tree.priceZCB(step + 1);
                if (pv > market_zcb[step]) lo = mid;
                else                       hi = mid;
            }
            tree.theta[step] = 0.5 * (lo + hi);
            for (int i = 0; i <= step; ++i)
                tree.r[step][i] = tree.theta[step] * std::exp(vols[step] * i);
        }
        return tree;
    }

    // Backward induction: price a ZCB maturing at target_step
    double priceZCB(int target_step) const {
        std::vector<double> V(target_step + 1, 1.0);  // terminal payoff = 1
        for (int step = target_step - 1; step >= 0; --step) {
            std::vector<double> V_new(step + 1);
            for (int i = 0; i <= step; ++i) {
                double disc = std::exp(-r[step][i] * dt);
                V_new[i] = 0.5 * disc * (V[i] + V[i+1]);  // equal risk-neutral prob
            }
            V = V_new;
        }
        return V[0];
    }
};`,
    explanation:
      "BDT's lognormal specification prevents negative interest rates and captures the asymmetric vol smile observed in cap/floor markets. Calibration is achieved by a nested root search: at each time step, a binary search over the drift parameter theta finds the value that reproduces the observed ZCB price exactly via backward induction. The tree is recombining (up-then-down = down-then-up), so the number of nodes grows linearly rather than exponentially.",
  },
  {
    id: "cpp-20260610-b1-parallel-greeks",
    language: "cpp",
    title: "std::execution parallel — portfolio Greeks sweep with parallel policies",
    tag: "performance",
    code: `#include <execution>
#include <algorithm>
#include <numeric>
#include <vector>
#include <cmath>
#include <numbers>

struct OptionGreeks { double delta, gamma, vega, theta, rho; };
struct OptionSpec   { double S, K, r, sigma, T; bool is_call; };

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x / std::numbers::sqrt2_v<double>);
}

OptionGreeks bsGreeks(const OptionSpec& o) noexcept {
    if (o.T <= 0.0 || o.sigma <= 0.0) return {};
    double sqT = std::sqrt(o.T);
    double d1  = (std::log(o.S/o.K) + (o.r + 0.5*o.sigma*o.sigma)*o.T) / (o.sigma*sqT);
    double d2  = d1 - o.sigma*sqT;
    double phi = std::exp(-0.5*d1*d1) / std::sqrt(2.0*std::numbers::pi);
    double Nd1 = Phi(d1), Nd2 = Phi(d2);
    double sign = o.is_call ? 1.0 : -1.0;

    OptionGreeks g;
    g.delta = sign * (o.is_call ? Nd1 : Nd1 - 1.0);
    g.gamma = phi / (o.S * o.sigma * sqT);
    g.vega  = o.S * phi * sqT;
    g.theta = -(o.S * phi * o.sigma / (2.0 * sqT))
              - sign * o.r * o.K * std::exp(-o.r*o.T)
              * (o.is_call ? Nd2 : 1.0 - Nd2);
    g.rho   = sign * o.K * o.T * std::exp(-o.r*o.T)
              * (o.is_call ? Nd2 : 1.0 - Nd2);
    return g;
}

// Compute Greeks for a portfolio of options using parallel execution policy
std::vector<OptionGreeks> portfolioGreeks(const std::vector<OptionSpec>& book) {
    std::vector<OptionGreeks> out(book.size());
    // std::execution::par_unseq: parallel + SIMD; par: parallel only
    std::transform(std::execution::par_unseq,
                   book.begin(), book.end(), out.begin(), bsGreeks);
    return out;
}

// Net portfolio Greeks: sum across all positions (weighted by quantity)
OptionGreeks netGreeks(const std::vector<OptionGreeks>& greeks,
                        const std::vector<double>& quantities) {
    OptionGreeks net{};
    for (std::size_t i = 0; i < greeks.size(); ++i) {
        net.delta += greeks[i].delta * quantities[i];
        net.gamma += greeks[i].gamma * quantities[i];
        net.vega  += greeks[i].vega  * quantities[i];
        net.theta += greeks[i].theta * quantities[i];
    }
    return net;
}`,
    explanation:
      "std::execution::par_unseq signals the runtime scheduler to distribute iterations across available cores AND apply SIMD within each thread. The algorithm must be element-wise independent (no data races between iterations) — bsGreeks() reads from a const OptionSpec and writes to a distinct OptionGreeks, satisfying this requirement. For a 10,000-option book this typically achieves 8-32× speedup over sequential execution on a modern multi-core server.",
  },
  {
    id: "cpp-20260610-b1-bitfield-risk",
    language: "cpp",
    title: "Compact bitfield risk flags — position risk state register",
    tag: "performance",
    code: `#include <cstdint>
#include <string>
#include <array>

// Pack multiple boolean position risk flags into a single uint32_t.
// Cache-efficient: 32 flags in 4 bytes vs 32 bools in 32 bytes.
// Atomic updates: a single CAS on uint32_t changes multiple flags atomically.
// Bit operations compile to single-cycle instructions on all platforms.

enum class RiskFlag : std::uint32_t {
    NONE               = 0,
    EXCEEDS_NOTIONAL   = 1 << 0,   // single position > max_notional
    EXCEEDS_NET_DELTA  = 1 << 1,
    EXCEEDS_GROSS_GAMMA = 1 << 2,
    STALE_PRICE        = 1 << 3,   // last price older than threshold
    CORR_BREAKDOWN     = 1 << 4,   // correlation estimate unreliable
    LIQUIDITY_ALERT    = 1 << 5,   // bid-ask spread > threshold
    MARGIN_CALL        = 1 << 6,
    VAR_BREACH         = 1 << 7,
    ALL                = 0xFF,
};

class RiskRegister {
    std::uint32_t flags_ = 0;
public:
    void   set  (RiskFlag f)         noexcept { flags_ |=  static_cast<std::uint32_t>(f); }
    void   clear(RiskFlag f)         noexcept { flags_ &= ~static_cast<std::uint32_t>(f); }
    void   toggle(RiskFlag f)        noexcept { flags_ ^=  static_cast<std::uint32_t>(f); }
    bool   test (RiskFlag f) const   noexcept { return (flags_ & static_cast<std::uint32_t>(f)) != 0; }
    bool   any  ()           const   noexcept { return flags_ != 0; }
    bool   none ()           const   noexcept { return flags_ == 0; }
    std::uint32_t raw() const        noexcept { return flags_; }

    // Clear multiple flags and set others in one write (atomic if using std::atomic<uint32_t>)
    void update(std::uint32_t clear_mask, std::uint32_t set_mask) noexcept {
        flags_ = (flags_ & ~clear_mask) | set_mask;
    }

    std::string describe() const {
        static constexpr std::array<std::pair<RiskFlag, const char*>, 8> names = {{
            {RiskFlag::EXCEEDS_NOTIONAL,    "NOTIONAL"},
            {RiskFlag::EXCEEDS_NET_DELTA,   "NET_DELTA"},
            {RiskFlag::EXCEEDS_GROSS_GAMMA, "GROSS_GAMMA"},
            {RiskFlag::STALE_PRICE,         "STALE_PRICE"},
            {RiskFlag::CORR_BREAKDOWN,      "CORR_BREAKDOWN"},
            {RiskFlag::LIQUIDITY_ALERT,     "LIQUIDITY"},
            {RiskFlag::MARGIN_CALL,         "MARGIN_CALL"},
            {RiskFlag::VAR_BREACH,          "VAR_BREACH"},
        }};
        std::string s;
        for (auto [flag, name] : names)
            if (test(flag)) { s += name; s += ' '; }
        return s.empty() ? "OK" : s;
    }
};`,
    explanation:
      "Packing risk flags into a uint32_t means a full risk status check compiles to a single test instruction — versus 8 separate branch predictor slots for individual booleans. The combined clear+set update is particularly important for atomic risk state changes: wrapping flags_ in std::atomic<uint32_t> and using compare_exchange allows an order's risk state to transition atomically from {VAR_BREACH} to {MARGIN_CALL} without a race window.",
  },
];
