import type { Snippet } from "./types";

export const cppSnippets20260607B1: Snippet[] = [
  {
    id: "cpp-20260607-b1-spsc-queue",
    language: "cpp",
    title: "Lock-free SPSC ring buffer — market data feed",
    tag: "performance",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Single-producer single-consumer lock-free queue.
// head_/tail_ on separate cache lines to prevent false sharing.
template<typename T, std::size_t N>
class SPSCQueue {
    alignas(64) std::atomic<std::size_t> head_{0};
    alignas(64) std::atomic<std::size_t> tail_{0};
    std::array<T, N> buf_;
public:
    bool push(const T& val) {
        std::size_t t    = tail_.load(std::memory_order_relaxed);
        std::size_t next = (t + 1) % N;
        if (next == head_.load(std::memory_order_acquire))
            return false; // full
        buf_[t] = val;
        tail_.store(next, std::memory_order_release);
        return true;
    }
    std::optional<T> pop() {
        std::size_t h = head_.load(std::memory_order_relaxed);
        if (h == tail_.load(std::memory_order_acquire))
            return std::nullopt; // empty
        T val = buf_[h];
        head_.store((h + 1) % N, std::memory_order_release);
        return val;
    }
};

// Usage: SPSCQueue<TickMsg, 4096> q;
// producer: q.push(tick);  consumer: if (auto t = q.pop()) process(*t);`,
    explanation:
      "The release on push and acquire on pop form a happens-before edge: the producer's write to buf_[t] is guaranteed visible to the consumer after the consumer's acquire load sees the updated tail — no mutex needed for this single-producer/single-consumer topology.",
  },
  {
    id: "cpp-20260607-b1-pool-alloc",
    language: "cpp",
    title: "Pool allocator — O(1) alloc/free for order objects",
    tag: "memory",
    code: `#include <array>
#include <cassert>
#include <cstddef>

// Fixed-size pool: intrusive free-list embedded in each block.
// Eliminates per-object heap calls; all blocks live in one contiguous slab.
template<typename T, std::size_t PoolSize>
class PoolAllocator {
    union Block { alignas(T) char storage[sizeof(T)]; Block* next; };
    std::array<Block, PoolSize> pool_;
    Block* free_ = nullptr;
public:
    PoolAllocator() {
        for (std::size_t i = 0; i + 1 < PoolSize; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[PoolSize - 1].next = nullptr;
        free_ = &pool_[0];
    }
    T* allocate() {
        assert(free_ && "pool exhausted");
        Block* blk = free_;
        free_      = blk->next;
        return reinterpret_cast<T*>(blk->storage);
    }
    void deallocate(T* p) noexcept {
        auto* blk  = reinterpret_cast<Block*>(p);
        blk->next  = free_;
        free_      = blk;
    }
};

// struct Order { uint64_t id; double price; int qty; };
// PoolAllocator<Order, 8192> pool;
// Order* o = pool.allocate(); new (o) Order{1, 99.5, 100};`,
    explanation:
      "The union trick reuses each block's memory for either the free-list pointer or the live object, so the pool's metadata has zero memory overhead. Because all blocks are in a single array, allocation stays cache-friendly even at high frequency.",
  },
  {
    id: "cpp-20260607-b1-concepts-pricer",
    language: "cpp",
    title: "C++20 concepts — constrained pricer template",
    tag: "templates",
    code: `#include <concepts>
#include <cmath>

// Named requirement: any type providing payoff(S) and maturity()
template<typename T>
concept Priceable = requires(T inst, double S) {
    { inst.payoff(S) } -> std::convertible_to<double>;
    { inst.maturity() } -> std::convertible_to<double>;
};

template<Priceable Instrument>
double discountedPayoff(const Instrument& inst, double S, double r) {
    double T = inst.maturity();
    return std::exp(-r * T) * inst.payoff(S);
}

struct EuropeanCall {
    double K, T_;
    double payoff(double S)  const { return std::max(S - K, 0.0); }
    double maturity()        const { return T_; }
};

struct EuropeanPut {
    double K, T_;
    double payoff(double S)  const { return std::max(K - S, 0.0); }
    double maturity()        const { return T_; }
};

// discountedPayoff(EuropeanCall{100.0, 1.0}, 105.0, 0.05) == e^{-0.05} * 5`,
    explanation:
      "Concepts replace SFINAE with readable, self-documenting constraints: the error message names the unsatisfied concept instead of dumping a template instantiation stack. They also enable overload resolution — you can specialize discountedPayoff for exotic instruments without if constexpr gymnastics.",
  },
  {
    id: "cpp-20260607-b1-sfinae-container",
    language: "cpp",
    title: "SFINAE void_t — detect contiguous numeric containers",
    tag: "templates",
    code: `#include <type_traits>
#include <cstddef>
#include <vector>
#include <array>

// Detect any contiguous container of arithmetic values via SFINAE.
template<typename T, typename = void>
struct is_price_container : std::false_type {};

template<typename T>
struct is_price_container<T,
    std::void_t<
        decltype(std::declval<T>().data()),
        decltype(std::declval<T>().size()),
        std::enable_if_t<std::is_arithmetic_v<typename T::value_type>>
    >> : std::true_type {};

// Only enabled for std::vector<double>, std::array<float,N>, etc.
template<typename C>
auto vwap(const C& prices, const C& volumes)
    -> std::enable_if_t<is_price_container<C>::value, double>
{
    double pv = 0.0, vol = 0.0;
    for (std::size_t i = 0; i < prices.size(); ++i) {
        pv  += prices[i] * volumes[i];
        vol += volumes[i];
    }
    return vol > 0.0 ? pv / vol : 0.0;
}
// Passing std::vector<std::string> fails at compile time, not runtime.`,
    explanation:
      "void_t collapses any valid expression to void and triggers substitution failure for invalid ones, letting you detect interface properties without specialising on every container type. The enable_if on the return type means the overload is silently removed rather than producing a hard error.",
  },
  {
    id: "cpp-20260607-b1-ranges-ticks",
    language: "cpp",
    title: "C++20 ranges — lazy filter/transform tick stream",
    tag: "modern",
    code: `#include <ranges>
#include <vector>

struct Tick { double price; int volume; bool valid; };

// View pipeline: lazy — no temporary vector is allocated.
// filter + transform fuse into a single pass at the call site.
std::vector<double> activePrices(const std::vector<Tick>& ticks,
                                  int minVolume) {
    auto view = ticks
        | std::views::filter([&](const Tick& t) {
              return t.valid && t.volume >= minVolume;
          })
        | std::views::transform([](const Tick& t) { return t.price; });
    return {view.begin(), view.end()};
}

// Drop first N stale ticks, take the next 100 valid ones:
auto recent = ticks
    | std::views::drop(10)
    | std::views::filter([](const Tick& t){ return t.valid; })
    | std::views::take(100);`,
    explanation:
      "Range adaptors are composable views, not eager operations: the filter predicate is only invoked when the range is consumed (by a range-for or materialised into a container). This means you can build complex pipelines with no intermediate heap allocations.",
  },
  {
    id: "cpp-20260607-b1-span-buffer",
    language: "cpp",
    title: "std::span — zero-copy network buffer view",
    tag: "modern",
    code: `#include <span>
#include <cstdint>
#include <cstring>

struct MarketDataMsg {
    std::uint64_t seqno;
    double        bid, ask;
    std::uint32_t bidSz, askSz;
};

// span is a non-owning view — caller retains the buffer lifetime.
// No copy; bounds checked in debug builds via .size().
void processBuffer(std::span<const std::byte> buf) {
    constexpr std::size_t msgSize = sizeof(MarketDataMsg);
    for (std::size_t off = 0; off + msgSize <= buf.size(); off += msgSize) {
        MarketDataMsg msg;
        std::memcpy(&msg, buf.data() + off, msgSize);
        // route: msg.seqno, msg.bid, msg.ask, msg.bidSz, msg.askSz
    }
}

// Wrapping raw network recv buffer:
// char recvBuf[65536];
// processBuffer({reinterpret_cast<std::byte*>(recvBuf), bytesRead});`,
    explanation:
      "std::span replaces the (ptr, len) convention with a typed, bounds-aware object that the optimizer can reason about. Unlike a raw pointer it encodes the length at the type level when the size is a compile-time constant, enabling full static bounds elimination.",
  },
  {
    id: "cpp-20260607-b1-atomic-level",
    language: "cpp",
    title: "std::atomic acquire/release — order book price level",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>

// Market-data thread writes; matching engine reads.
// acquire/release pair: all writes before store(release) are guaranteed
// visible to a thread whose load(acquire) returns the stored value.
struct PriceLevel {
    alignas(64) std::atomic<std::int64_t> quantity{0};  // in lots

    // Market-data thread
    void addQty(std::int64_t delta) noexcept {
        quantity.fetch_add(delta, std::memory_order_acq_rel);
    }
    void setQty(std::int64_t q) noexcept {
        quantity.store(q, std::memory_order_release);
    }
    // Matching engine thread
    std::int64_t readQty() const noexcept {
        return quantity.load(std::memory_order_acquire);
    }
};
// alignas(64) isolates the atomic from unrelated data on the same cache line
// preventing false sharing between threads updating adjacent price levels.`,
    explanation:
      "acq_rel on fetch_add establishes ordering in both directions: the updater sees all prior releases, and subsequent acquires on other threads see the update. Using relaxed + a separate fence is more efficient when multiple fields must be updated atomically together.",
  },
  {
    id: "cpp-20260607-b1-thread-pool",
    language: "cpp",
    title: "Thread pool — parallel Monte Carlo Greeks",
    tag: "concurrency",
    code: `#include <condition_variable>
#include <functional>
#include <mutex>
#include <queue>
#include <thread>
#include <vector>

class ThreadPool {
    std::vector<std::thread>          workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex                        mu_;
    std::condition_variable           cv_;
    bool                              stop_ = false;
public:
    explicit ThreadPool(std::size_t n) {
        for (std::size_t i = 0; i < n; ++i)
            workers_.emplace_back([this] {
                for (;;) {
                    std::function<void()> task;
                    { std::unique_lock lk(mu_);
                      cv_.wait(lk, [this]{ return stop_ || !tasks_.empty(); });
                      if (stop_ && tasks_.empty()) return;
                      task = std::move(tasks_.front()); tasks_.pop(); }
                    task();
                }
            });
    }
    template<typename F> void submit(F&& f) {
        { std::lock_guard lk(mu_); tasks_.emplace(std::forward<F>(f)); }
        cv_.notify_one();
    }
    ~ThreadPool() {
        { std::lock_guard lk(mu_); stop_ = true; }
        cv_.notify_all();
        for (auto& w : workers_) w.join();
    }
};
// pool.submit([&, i]{ greeks[i] = computeDelta(portfolio[i]); });`,
    explanation:
      "The destructor sets stop_ and notifies all workers before joining, so the pool drains its queue gracefully instead of leaving tasks orphaned. Using condition_variable avoids busy-waiting while idle; the notify_one on submit wakes exactly one sleeping worker.",
  },
  {
    id: "cpp-20260607-b1-rdtsc-timer",
    language: "cpp",
    title: "RDTSC latency timer — nanosecond order timing",
    tag: "performance",
    code: `#include <cstdint>
#ifdef _MSC_VER
#  include <intrin.h>
#else
#  include <x86intrin.h>
#endif

// lfence serialises the instruction stream: no speculative execution
// crosses the fence, ensuring the cycle counter reflects the correct point.
struct RdtscTimer {
    std::uint64_t start_{0};

    void begin() noexcept {
        __builtin_ia32_lfence();
        start_ = __rdtsc();
    }
    std::uint64_t elapsed() const noexcept {
        __builtin_ia32_lfence();
        return __rdtsc() - start_;
    }
};

// Convert cycles to nanoseconds: ns = cycles / GHz
// On a 3.0 GHz system: 300 cycles ≈ 100 ns (wire-to-trade target for HFT)
//
// RdtscTimer t;
// t.begin();
// submitOrder(order);
// auto cycles = t.elapsed();`,
    explanation:
      "RDTSC reads the TSC register in ~10 cycles (vs ~25 for clock_gettime) making it the standard for intra-process latency measurement in HFT. The lfence fence before each read prevents out-of-order execution from moving the read outside the measured section.",
  },
  {
    id: "cpp-20260607-b1-merton-mc",
    language: "cpp",
    title: "Merton jump-diffusion MC pricer",
    tag: "quant",
    code: `#include <cmath>
#include <random>

// Merton (1976): GBM + compound Poisson jump component.
// Drift adjusted so the model is risk-neutral: r - lambda*(e^{muJ+sigmaJ^2/2}-1).
double mertonCallMC(double S0, double K, double r,
                    double sigma, double T,
                    double lambda, double muJ, double sigmaJ,
                    int paths, int steps) {
    std::mt19937_64 rng(42);
    std::normal_distribution<>  nd;
    std::poisson_distribution<> pd(lambda * T / steps);
    double dt      = T / steps;
    double kappa   = std::exp(muJ + 0.5 * sigmaJ * sigmaJ) - 1.0;
    double adjDrift = r - lambda * kappa - 0.5 * sigma * sigma;
    double payoffSum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S = S0;
        for (int s = 0; s < steps; ++s) {
            int    nJumps   = pd(rng);
            double jumpLog  = 0.0;
            for (int j = 0; j < nJumps; ++j)
                jumpLog += muJ + sigmaJ * nd(rng);
            S *= std::exp(adjDrift * dt
                          + sigma * std::sqrt(dt) * nd(rng)
                          + jumpLog);
        }
        payoffSum += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * payoffSum / paths;
}`,
    explanation:
      "The Poisson variate controls how many log-normal jumps occur per step; each jump contributes independently to the log-return. The drift correction term -lambda*kappa ensures the discounted asset price remains a martingale under the risk-neutral measure.",
  },
  {
    id: "cpp-20260607-b1-heston-mc",
    language: "cpp",
    title: "Heston stochastic vol MC — Euler-Maruyama",
    tag: "quant",
    code: `#include <cmath>
#include <random>

// Heston (1993): dS = r*S*dt + sqrt(v)*S*dW_S
//                dv = kappa*(theta-v)*dt + xi*sqrt(v)*dW_v
//                corr(dW_S, dW_v) = rho
double hestonCallMC(double S0, double K, double r,
                    double v0, double kappa, double theta,
                    double xi, double rho,
                    double T, int paths, int steps) {
    std::mt19937_64 rng(42);
    std::normal_distribution<> nd;
    double dt = T / steps, sqDt = std::sqrt(dt), payoffSum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S = S0, v = v0;
        for (int s = 0; s < steps; ++s) {
            double z1 = nd(rng), z2 = nd(rng);
            double zv = z1;
            double zs = rho * z1 + std::sqrt(1.0 - rho * rho) * z2;
            double vP = std::max(v, 0.0);   // full truncation
            v += kappa * (theta - vP) * dt + xi * std::sqrt(vP) * sqDt * zv;
            S *= std::exp((r - 0.5 * vP) * dt + std::sqrt(vP) * sqDt * zs);
        }
        payoffSum += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * payoffSum / paths;
}
// Full truncation (max(v,0)) prevents imaginary sqrt without bias from
// reflection; the Lord-Kahl scheme is more accurate for low kappa*theta.`,
    explanation:
      "Heston captures the implied vol skew absent in Black-Scholes; the correlation rho between price and vol Brownians produces the leverage effect (negative rho → downward skew). The Euler scheme is biased but simple; the QE (quadratic-exponential) scheme of Andersen is preferred for production.",
  },
  {
    id: "cpp-20260607-b1-asian-mc",
    language: "cpp",
    title: "Arithmetic Asian call MC — path-dependent pricing",
    tag: "quant",
    code: `#include <cmath>
#include <random>

// Arithmetic Asian call: payoff = max(mean(S_t) - K, 0).
// No closed form exists for arithmetic mean; MC is the standard approach.
double asianArithMC(double S0, double K, double r,
                    double sigma, double T, int paths, int steps) {
    std::mt19937_64 rng(42);
    std::normal_distribution<> nd;
    double dt = T / steps, payoffSum = 0.0;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    for (int p = 0; p < paths; ++p) {
        double S = S0, sumS = 0.0;
        for (int s = 0; s < steps; ++s) {
            S    *= std::exp(drift + vol * nd(rng));
            sumS += S;
        }
        payoffSum += std::max(sumS / steps - K, 0.0);
    }
    return std::exp(-r * T) * payoffSum / paths;
}
// Variance reduction: use the geometric Asian (closed-form via BS with
// adjusted sigma_g = sigma/sqrt(3)) as a control variate — reduces
// standard error by ~70% for modest extra compute.`,
    explanation:
      "Averaging over the path suppresses terminal spike risk relative to vanilla options, making Asians cheaper and attractive for commodity hedgers. The arithmetic mean lacks a closed form because the sum of log-normals is not log-normal.",
  },
  {
    id: "cpp-20260607-b1-lookback-mc",
    language: "cpp",
    title: "Floating-strike lookback call MC",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Floating-strike lookback call: payoff = S_T - min_{0<=t<=T} S_t.
// The holder effectively buys at the realized minimum — maximum hindsight.
double lookbackFloatCallMC(double S0, double r, double sigma,
                            double T, int paths, int steps) {
    std::mt19937_64 rng(42);
    std::normal_distribution<> nd;
    double dt = T / steps, payoffSum = 0.0;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    for (int p = 0; p < paths; ++p) {
        double S = S0, Smin = S0;
        for (int s = 0; s < steps; ++s) {
            S    *= std::exp(drift + vol * nd(rng));
            Smin  = std::min(Smin, S);
        }
        payoffSum += S - Smin; // payoff always non-negative
    }
    return std::exp(-r * T) * payoffSum / paths;
}
// Closed form exists (Goldman-Sosin-Gatto 1979) for continuous monitoring;
// MC naturally handles discrete monitoring intervals.`,
    explanation:
      "The lookback premium over a vanilla call is the option's time value of hindsight — expensive because you always get the best possible entry. Continuous-monitoring closed forms involve normal CDFs; discrete MC is straightforward but path-count sensitive.",
  },
  {
    id: "cpp-20260607-b1-hull-white-mc",
    language: "cpp",
    title: "Hull-White 1F MC — ZCB pricing",
    tag: "quant",
    code: `#include <cmath>
#include <random>

// Hull-White 1-factor: dr = (theta - a*r)*dt + sigma*dW
// ZCB P(0,T) = E[exp(-integral_0^T r_t dt)]
// theta calibrates to the initial term structure.
double hwZCBMC(double r0, double theta, double a, double sigma,
               double T, int paths = 20000, int steps = 252) {
    std::mt19937_64 rng(42);
    std::normal_distribution<> nd;
    double dt = T / steps, discountSum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double r = r0, integral = 0.0;
        for (int s = 0; s < steps; ++s) {
            integral += r * dt;
            r += (theta - a * r) * dt + sigma * std::sqrt(dt) * nd(rng);
        }
        discountSum += std::exp(-integral);
    }
    return discountSum / paths;
}
// Analytical: P(0,T) = exp(A(T) - B(T)*r0)
// B(T) = (1 - e^{-aT}) / a
// MC validates the formula when theta is time-varying (full HW calibration).`,
    explanation:
      "Hull-White is mean-reverting (speed a) around a time-varying level theta(t) fitted to today's yield curve, guaranteeing exact calibration to observed ZCB prices — unlike Vasicek, which cannot fit an arbitrary initial term structure.",
  },
  {
    id: "cpp-20260607-b1-type-erasure",
    language: "cpp",
    title: "Type erasure via std::function — polymorphic order handler",
    tag: "modern",
    code: `#include <functional>
#include <string>

struct Order { int id; double price; int qty; std::string symbol; };

// Type erasure with std::function: any callable conforming to the
// signature is accepted — lambdas, functors, free functions — without
// a shared base class or virtual table overhead.
class OrderHandler {
    std::function<void(const Order&)> fn_;
public:
    template<typename F>
    explicit OrderHandler(F&& f) : fn_(std::forward<F>(f)) {}

    void operator()(const Order& o) const { fn_(o); }
    explicit operator bool()         const { return static_cast<bool>(fn_); }
};

// Compose a processing pipeline without inheritance:
// OrderHandler logger([](const Order& o){ logTrade(o); });
// OrderHandler riskChk([&limits](const Order& o){ checkRisk(o, limits); });
// for (const auto& o : batch) { logger(o); riskChk(o); }`,
    explanation:
      "std::function's small-buffer optimisation stores lambdas that capture a pointer or small value inline without a heap allocation, so handlers that close over a pointer to a risk engine incur no allocation. For hot paths, a fixed-size std::inplace_function avoids the virtual dispatch inside std::function.",
  },
  {
    id: "cpp-20260607-b1-cow-snapshot",
    language: "cpp",
    title: "Copy-on-write book snapshot — O(1) risk snapshot",
    tag: "modern",
    code: `#include <map>
#include <memory>
#include <cstdint>

using Price = std::int64_t; // ticks
using Qty   = std::int32_t;

// COW: cloning the book for a risk snapshot is O(1) (shared_ptr copy).
// Only the thread that mutates pays the O(N) copy cost, lazily.
struct BookSnap {
    std::shared_ptr<std::map<Price, Qty>> bids =
        std::make_shared<std::map<Price, Qty>>();

    BookSnap clone() const { return *this; }  // O(1) ref-count bump

    void setBid(Price p, Qty q) {
        if (bids.use_count() > 1) // detach before mutating
            bids = std::make_shared<std::map<Price, Qty>>(*bids);
        (*bids)[p] = q;
    }
    void removeBid(Price p) {
        if (bids.use_count() > 1)
            bids = std::make_shared<std::map<Price, Qty>>(*bids);
        bids->erase(p);
    }
};
// Risk thread: auto snap = book.clone(); — stable view with no locking.`,
    explanation:
      "COW defers the copy cost to the first mutation after cloning, so snapshotting for risk calculation is always fast even if the snapshot is rarely mutated. The use_count() check is safe here because the matching engine is the only writer.",
  },
  {
    id: "cpp-20260607-b1-expected-result",
    language: "cpp",
    title: "std::expected — order validation without exceptions",
    tag: "modern",
    code: `#include <expected>
#include <string>

enum class OrderError { InvalidPrice, NegativeQty, ExceedsPositionLimit };

// std::expected<T,E> (C++23): encodes success or a typed error value.
// No exception overhead on the hot path; error propagation is explicit.
std::expected<double, OrderError>
validateOrder(double price, int qty, double positionLimit) {
    if (price <= 0.0) return std::unexpected(OrderError::InvalidPrice);
    if (qty   <= 0)   return std::unexpected(OrderError::NegativeQty);
    double notional = price * qty;
    if (notional > positionLimit)
        return std::unexpected(OrderError::ExceedsPositionLimit);
    return notional;
}

// Usage — zero-cost on success path:
// if (auto r = validateOrder(p, q, limit)) {
//     ship(*r);
// } else {
//     reject(r.error());
// }`,
    explanation:
      "std::expected is an algebraic Either type: returning std::unexpected wraps the error without throwing, so the optimizer can inline both paths. Unlike error codes it is hard to silently ignore — failing to check .has_value() is flagged by [[nodiscard]] on the return type.",
  },
  {
    id: "cpp-20260607-b1-numa-alloc",
    language: "cpp",
    title: "NUMA-aware allocation — same-socket ring buffer",
    tag: "performance",
    code: `#include <stdexcept>
#include <cstddef>
#include <cstdlib>

// On dual-socket machines, cross-NUMA memory access costs ~100 ns vs ~40 ns
// local. Pinning the ring buffer to the NIC's socket halves tick-to-handler
// latency for inbound market data.
#ifdef __linux__
#  include <numa.h>  // link: -lnuma

void* numaAllocLocal(std::size_t bytes) {
    if (numa_available() < 0)
        throw std::runtime_error("NUMA unavailable");
    void* p = numa_alloc_local(bytes);
    if (!p) throw std::bad_alloc();
    return p;
}
void numaFree(void* p, std::size_t bytes) { numa_free(p, bytes); }

#else
void* numaAllocLocal(std::size_t bytes) { return std::malloc(bytes); }
void  numaFree(void* p, std::size_t)    { std::free(p); }
#endif

// Combine with IRQ affinity: echo 01 > /proc/irq/<NIC_IRQ>/smp_affinity
// to keep NIC interrupts and the ring buffer on the same physical core.`,
    explanation:
      "numa_alloc_local allocates on the NUMA node of the calling thread; pairing it with pthread_setaffinity_np to pin the thread to a socket-0 core and setting NIC IRQ affinity to the same socket eliminates cross-socket cache bouncing on the critical data path.",
  },
  {
    id: "cpp-20260607-b1-hugepage-mmap",
    language: "cpp",
    title: "Hugepage mmap — reduce TLB misses for order table",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <stdexcept>
#include <cstddef>

// 2 MB huge pages: a 1 GB order table fits in 512 TLB entries
// vs 262 144 entries with standard 4 KB pages — eliminates TLB thrashing
// when the matching engine scans the full order table each microsecond.
void* allocHugeTLB(std::size_t bytes) {
    void* p = mmap(nullptr, bytes,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                   -1, 0);
    if (p == MAP_FAILED)
        throw std::runtime_error(
            "hugetlb mmap failed — set /proc/sys/vm/nr_hugepages");
    return p;
}
void freeHugeTLB(void* p, std::size_t bytes) { munmap(p, bytes); }

// Transparent huge pages (THP) are an alternative: madvise(p, n, MADV_HUGEPAGE)
// after a regular mmap lets the kernel promote pages without explicit preallocate.`,
    explanation:
      "Each TLB miss costs ~7 ns on modern hardware; with a 512-entry TLB and 4 KB pages a 10 million-order table causes a miss on nearly every random access. Huge pages reduce the working set from 2500 pages to 5, keeping the entire table in the TLB.",
  },
  {
    id: "cpp-20260607-b1-fold-greeks",
    language: "cpp",
    title: "Fold expressions — compile-time portfolio Greeks sum",
    tag: "templates",
    code: `#include <utility>

// C++17 unary right-fold: (init op ... op pack)
// Compiler produces a chain of additions — no loop, no virtual dispatch.
template<typename... Instruments>
double portfolioDelta(const Instruments&... insts) {
    return (0.0 + ... + insts.delta());
}

template<typename... Instruments>
double portfolioGamma(const Instruments&... insts) {
    return (0.0 + ... + insts.gamma());
}

template<typename... Instruments>
double portfolioVega(const Instruments&... insts) {
    return (0.0 + ... + insts.vega());
}

struct Call { double delta() const { return  0.60; }
              double gamma() const { return  0.05; }
              double vega()  const { return  0.30; } };
struct Put  { double delta() const { return -0.40; }
              double gamma() const { return  0.05; }
              double vega()  const { return  0.30; } };

// portfolioDelta(Call{}, Put{}, Call{}) == 0.80  (compile-time verifiable)`,
    explanation:
      "Fold expressions eliminate the need for a runtime loop or a heterogeneous container: the compiler generates an inlined sum at instantiation time. For a portfolio of N compile-time-known instrument types, the result is a single FP addition chain that the optimizer can vectorise.",
  },
  {
    id: "cpp-20260607-b1-if-constexpr-option",
    language: "cpp",
    title: "if constexpr — compile-time call/put dispatch",
    tag: "templates",
    code: `#include <type_traits>
#include <cmath>

struct CallTag {};
struct PutTag  {};

// if constexpr: the dead branch is syntactically parsed but not compiled.
// No code generated for the unchosen path — zero overhead vs runtime if.
template<typename OptionType>
double intrinsicValue(double S, double K) {
    if constexpr (std::is_same_v<OptionType, CallTag>)
        return std::max(S - K, 0.0);
    else
        return std::max(K - S, 0.0);
}

template<typename OptionType>
bool isInTheMoney(double S, double K) {
    if constexpr (std::is_same_v<OptionType, CallTag>)
        return S > K;
    else
        return S < K;
}

// intrinsicValue<CallTag>(105.0, 100.0) == 5.0
// intrinsicValue<PutTag >(95.0,  100.0) == 5.0
// Both compile to a single max/compare instruction — no branch prediction miss.`,
    explanation:
      "Unlike a runtime if, if constexpr prevents the compiler from instantiating the unchosen branch's template dependencies, so you can write type-specific code (e.g., calling a method that only exists on CallTag) without SFINAE workarounds.",
  },
  {
    id: "cpp-20260607-b1-struct-bindings",
    language: "cpp",
    title: "Structured bindings — order book decomposition",
    tag: "modern",
    code: `#include <map>
#include <string>
#include <tuple>
#include <iostream>

struct Order { int id; double price; int qty; std::string side; };

void printBook(const std::map<int, Order>& book) {
    // Structured binding on map entry: [key, value]
    for (const auto& [orderId, order] : book) {
        // Binding on aggregate
        const auto& [id, price, qty, side] = order;
        std::cout << orderId << ": " << side << " "
                  << qty    << " @ " << price << "\\n";
    }
}

// Also usable with tuple returns — eliminates .first/.second clutter:
auto bestBidAsk() -> std::pair<double, double> { return {99.5, 100.0}; }

void demo() {
    auto [bid, ask] = bestBidAsk();
    double spread   = ask - bid; // 0.5
}`,
    explanation:
      "Structured bindings bind to member variables in declaration order for aggregates, and call get<N> for tuple-like types: the compiler generates all the .member and std::get accesses for you. The const auto& form avoids copying while keeping the bindings read-only.",
  },
  {
    id: "cpp-20260607-b1-simd-vwap",
    language: "cpp",
    title: "SIMD-friendly VWAP — auto-vectorisation hints",
    tag: "performance",
    code: `#include <cstddef>

// __restrict__ signals no aliasing — prerequisite for VFMADD vectorisation.
// -O3 -march=native: GCC/Clang emits AVX2 VFMADD231PD (4 doubles/cycle).
double vwap(const double* __restrict__ prices,
            const double* __restrict__ volumes,
            std::size_t n) noexcept {
    double pv = 0.0, vol = 0.0;
#pragma GCC ivdep  // assert: no loop-carried dependence
    for (std::size_t i = 0; i < n; ++i) {
        pv  += prices[i] * volumes[i];
        vol += volumes[i];
    }
    return vol > 0.0 ? pv / vol : 0.0;
}

// Verify vectorisation: objdump -d | grep -i ymm
// For portable SIMD: use std::experimental::simd (C++23) or highway library.
// Typical: 4-8x throughput improvement on 1M-tick VWAP vs scalar baseline.`,
    explanation:
      "The compiler needs two guarantees to auto-vectorise: no aliasing (hence __restrict__) and no loop-carried dependencies (hence #pragma GCC ivdep). The fused multiply-add VFMADD231PD computes p*v+acc in one instruction with one rounding, which also improves numerical accuracy.",
  },
  {
    id: "cpp-20260607-b1-chain-validation",
    language: "cpp",
    title: "Chain of responsibility — order validation pipeline",
    tag: "modern",
    code: `#include <memory>
#include <optional>
#include <string>

struct Order { double price; int qty; double notional; std::string symbol; };

class Validator {
public:
    virtual ~Validator() = default;
    virtual std::optional<std::string> validate(const Order&) const = 0;
    void setNext(std::shared_ptr<Validator> n) { next_ = std::move(n); }
protected:
    std::optional<std::string> chain(const Order& o) const {
        return next_ ? next_->validate(o) : std::nullopt;
    }
    std::shared_ptr<Validator> next_;
};

struct PriceCheck : Validator {
    std::optional<std::string> validate(const Order& o) const override {
        return o.price <= 0.0 ? std::optional{"negative price"} : chain(o);
    }
};
struct SizeCheck : Validator {
    std::optional<std::string> validate(const Order& o) const override {
        return o.qty <= 0 ? std::optional{"non-positive qty"} : chain(o);
    }
};
struct NotionalCheck : Validator {
    double limit_;
    explicit NotionalCheck(double l) : limit_(l) {}
    std::optional<std::string> validate(const Order& o) const override {
        return o.notional > limit_ ? std::optional{"exceeds notional limit"} : chain(o);
    }
};
// Chain: price -> size -> notional; first rejection short-circuits.`,
    explanation:
      "Chain of responsibility decouples validation rules so each can be unit-tested and reordered independently. Returning std::optional instead of throwing preserves exception-free hot-path execution — the nullopt result means 'pass' and propagates through the chain without heap allocation.",
  },
  {
    id: "cpp-20260607-b1-sabr-approx",
    language: "cpp",
    title: "SABR Hagan approximation — implied vol surface",
    tag: "quant",
    code: `#include <cmath>
#include <stdexcept>

// Hagan et al. (2002) SABR lognormal implied vol approximation.
// F: forward; K: strike; T: expiry; alpha/beta/rho/nu: SABR parameters.
double sabrImpliedVol(double F, double K, double T,
                      double alpha, double beta, double rho, double nu) {
    if (alpha <= 0.0 || T <= 0.0 || nu < 0.0)
        throw std::invalid_argument("invalid SABR params");
    if (std::abs(F - K) < 1e-9) {  // ATM approximation
        double FKb = std::pow(F, 1.0 - beta);
        double cor = 1.0
            + ((1-beta)*(1-beta)/24.0 * alpha*alpha / (FKb*FKb)
               + rho*beta*nu*alpha / (4.0*FKb)
               + (2.0-3.0*rho*rho)/24.0 * nu*nu) * T;
        return (alpha / FKb) * cor;
    }
    double logFK  = std::log(F / K);
    double FKmid  = std::pow(F * K, (1.0 - beta) / 2.0);
    double z      = nu / alpha * FKmid * logFK;
    double xz     = std::log(
        (std::sqrt(1.0 - 2.0*rho*z + z*z) + z - rho) / (1.0 - rho));
    double A = alpha / (FKmid * (1.0
        + (1-beta)*(1-beta)/24.0 * logFK*logFK
        + std::pow((1-beta)*logFK, 4.0) / 1920.0));
    double B = (std::abs(xz) > 1e-9) ? z / xz : 1.0;
    double C = 1.0
        + ((1-beta)*(1-beta)/24.0 * alpha*alpha / (FKmid*FKmid)
           + rho*beta*nu*alpha / (4.0*FKmid)
           + (2.0-3.0*rho*rho)/24.0 * nu*nu) * T;
    return A * B * C;
}`,
    explanation:
      "SABR's four parameters (alpha: initial vol, beta: CEV exponent, rho: skew, nu: vol-of-vol) give a closed-form implied vol across strikes, making it fast to calibrate. The beta parameter controls backbone: beta=1 gives lognormal (flat backbone), beta=0 gives normal, and 0.5 is common for rates markets.",
  },
  {
    id: "cpp-20260607-b1-bellman-ford-fx",
    language: "cpp",
    title: "Bellman-Ford FX arbitrage — negative log-cycle detection",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <limits>

// Convert FX arbitrage detection to negative-cycle problem:
// log(r_ij) as edge weight; max-product cycle → max-sum cycle in log-space.
// Negate: looking for negative-weight cycle using standard Bellman-Ford.
bool hasFXArbitrage(const std::vector<std::vector<double>>& rates) {
    int n = static_cast<int>(rates.size());
    std::vector<double> dist(n, 0.0); // start from "all nodes"
    // Relax edges n-1 times
    for (int iter = 0; iter < n - 1; ++iter)
        for (int u = 0; u < n; ++u)
            for (int v = 0; v < n; ++v)
                if (rates[u][v] > 0.0) {
                    double w = std::log(rates[u][v]);
                    if (dist[u] + w > dist[v])
                        dist[v] = dist[u] + w;
                }
    // N-th relaxation: further improvement means positive cycle
    for (int u = 0; u < n; ++u)
        for (int v = 0; v < n; ++v)
            if (rates[u][v] > 0.0 &&
                dist[u] + std::log(rates[u][v]) > dist[v] + 1e-9)
                return true;
    return false;
}
// O(V^3): fine for ~30 FX pairs. Extend to recover the actual cycle path.`,
    explanation:
      "Multiplying exchange rates along a cycle corresponds to summing their logarithms; a cycle product > 1 is a positive log-sum cycle, which Bellman-Ford detects on the N-th relaxation. Practical implementations add bid-ask spread and fee costs to the edge weights to filter theoretical-only arbitrages.",
  },
  {
    id: "cpp-20260607-b1-deque-book",
    language: "cpp",
    title: "std::deque order book — FIFO time priority at each level",
    tag: "stl",
    code: `#include <deque>
#include <map>
#include <optional>
#include <functional>
#include <cstdint>

struct LimitOrder { std::int64_t id; double price; int qty; };

// std::map: O(log N) price level lookup, sorted for best bid/ask.
// std::deque per level: O(1) push_back (new order), O(1) pop_front (fill),
// O(1) front (peek) — natural FIFO time priority queue.
class OrderBook {
    std::map<double, std::deque<LimitOrder>, std::greater<double>> bids_;
    std::map<double, std::deque<LimitOrder>>                       asks_;
public:
    void addBid(LimitOrder o) { bids_[o.price].push_back(o); }
    void addAsk(LimitOrder o) { asks_[o.price].push_back(o); }

    std::optional<double> bestBid() const {
        return bids_.empty() ? std::nullopt
                             : std::optional{bids_.begin()->first};
    }
    std::optional<double> bestAsk() const {
        return asks_.empty() ? std::nullopt
                             : std::optional{asks_.begin()->first};
    }
    double spread() const {
        auto b = bestBid(), a = bestAsk();
        return (b && a) ? *a - *b : 0.0;
    }
};
// Production: replace std::map with a sorted array or skip list
// for O(1) best-level access and better cache behaviour.`,
    explanation:
      "std::greater<double> on the bids map keeps the highest price at begin(), giving O(log N) best-bid access. The deque at each level models exchange price-time priority: orders at the same price execute in arrival order, with O(1) pop from the front and push to the back.",
  },
];
