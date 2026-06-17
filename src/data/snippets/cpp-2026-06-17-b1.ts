import type { Snippet } from "./types";

export const cppSnippets20260617B1: Snippet[] = [
  {
    id: "cpp-20260617-b1-pmr-pool",
    language: "cpp",
    title: "std::pmr pool_resource — heap-free order allocation with monotonic backing",
    tag: "modern",
    code: `#include <memory_resource>
#include <vector>
#include <cstdint>
#include <cassert>

// C++17 polymorphic memory resources decouple data structure from allocator.
// monotonic_buffer_resource: bump-pointer allocator on a fixed backing buffer.
// unsynchronized_pool_resource: recycling pool on top of monotonic — O(1) alloc
// for fixed-size objects. No syscall, no lock, no fragmentation on the hot path.

struct Order {
    uint64_t id;
    double   price;
    int32_t  qty;
    int8_t   side;   // 1=buy 2=sell
    char     pad[3];
};
static_assert(sizeof(Order) == 24);

// One-time setup: stack-local backing avoids the global heap entirely
alignas(64) std::byte g_backing[1 << 22];   // 4 MiB stack/BSS buffer

std::pmr::monotonic_buffer_resource g_mono{g_backing, sizeof(g_backing)};

// pool_resource sub-allocates from mono; reuses freed blocks of same size
std::pmr::unsynchronized_pool_resource g_pool{
    std::pmr::pool_options{.max_blocks_per_chunk = 4096, .largest_required_pool_block = 64},
    &g_mono
};

// pmr::vector allocates vector storage from g_pool — not from ::operator new
std::pmr::vector<Order> makeOrderBatch(int n) {
    std::pmr::vector<Order> batch{&g_pool};
    batch.reserve(n);
    for (int i = 0; i < n; ++i)
        batch.push_back({static_cast<uint64_t>(i), 100.0 + i * 0.01, 100, 1, {}});
    return batch;   // move: pool pointer travels with the container
}

// Scoped reset: release all allocations in monotonic resource at once (O(1))
void resetPool() noexcept {
    g_mono.release();   // returns all memory to the backing buffer; no per-object destructor
}

// Pattern: per-session arena for order objects — allocate freely, reset at session close`,
    explanation:
      "The key performance property of monotonic_buffer_resource is that allocation is a single pointer increment (no metadata, no lock), and deallocation is a no-op — all memory is reclaimed in O(1) by calling release() once. The pool_resource layer adds O(1) recycling of same-sized freed blocks, critical for order objects that are created and destroyed millions of times per second at a fixed 24-byte size.",
  },
  {
    id: "cpp-20260617-b1-perfect-fwd",
    language: "cpp",
    title: "Perfect forwarding — universal references and std::forward",
    tag: "modern",
    code: `#include <utility>
#include <string>
#include <cstdint>

// Universal (forwarding) reference: T&& in a template deduction context.
// If called with an lvalue, T deduces to T& and T&& collapses to T& (lvalue ref).
// If called with an rvalue, T deduces to T and T&& stays T&& (rvalue ref).
// std::forward<T>(arg) restores the original value category for the next call.

struct MarketEvent {
    uint64_t    ts_ns;
    double      price;
    int         qty;
    std::string symbol;   // non-trivial: move vs copy matters

    MarketEvent(uint64_t t, double p, int q, std::string s)
        : ts_ns(t), price(p), qty(q), symbol(std::move(s)) {}
};

// --- Non-perfect forwarding: always copies symbol ---
template<typename S>
MarketEvent makeBadEvent(uint64_t t, double p, int q, S sym) {
    return MarketEvent{t, p, q, sym};   // always copies — even if caller passed rvalue
}

// --- Perfect forwarding: preserves rvalue so symbol is moved, not copied ---
template<typename S>
MarketEvent makeEvent(uint64_t t, double p, int q, S&& sym) {
    return MarketEvent{t, p, q, std::forward<S>(sym)};  // move when rvalue, copy when lvalue
}

// Variadic perfect forwarding (emplace pattern)
template<typename T, typename... Args>
T* emplace(void* buf, Args&&... args) {
    return ::new (buf) T(std::forward<Args>(args)...);  // in-place construction
}

// --- Caller side ---
void demo() {
    std::string sym = "AAPL";

    // Lvalue: sym is copied (still usable after call)
    auto ev1 = makeEvent(1000ULL, 180.0, 100, sym);

    // Rvalue: sym is moved (zero copy of the string heap buffer)
    auto ev2 = makeEvent(1001ULL, 181.0, 200, std::move(sym));

    // std::forward<Args>(args)... expands each arg with its deduced category
}`,
    explanation:
      "Without perfect forwarding, a factory function that accepts `std::string` by value makes a copy even when the caller provides a temporary — wasting a heap allocation and a memcpy of the string data. With `S&&` and `std::forward<S>`, the rvalue path calls `std::string`'s move constructor (pointer swap, no copy), while the lvalue path still copies correctly. This pattern is the foundation of emplace_back and all modern factory functions.",
  },
  {
    id: "cpp-20260617-b1-concepts",
    language: "cpp",
    title: "C++20 Concepts — readable compile-time constraints for quant types",
    tag: "modern",
    code: `#include <concepts>
#include <cmath>
#include <type_traits>

// C++20 Concepts replace enable_if SFINAE with readable, composable constraints.
// A concept is a boolean predicate evaluated at instantiation time.
// Constraint violations produce clear error messages instead of template soup.

// Named concept: supports floating-point arithmetic operations
template<typename T>
concept FloatLike = std::floating_point<T> || requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
    { a * b } -> std::convertible_to<T>;
    { static_cast<double>(a) } -> std::same_as<double>;
};

// Concept for a priceable instrument: must expose spot, strike, expiry, vol
template<typename T>
concept Priceable = requires(const T& t) {
    { t.spot()   } -> std::floating_point;
    { t.strike() } -> std::floating_point;
    { t.expiry() } -> std::floating_point;
    { t.vol()    } -> std::floating_point;
    { t.isCall() } -> std::same_as<bool>;
};

// Concept for containers of prices (ranges of floating-point)
template<typename C>
concept PriceRange = std::ranges::input_range<C> &&
    std::floating_point<std::ranges::range_value_t<C>>;

// Constrained function template: only valid for Priceable types
// Compiler error immediately at call site if T doesn't satisfy Priceable
template<Priceable T>
double blackScholesDelta(const T& opt) noexcept {
    double S = opt.spot(), K = opt.strike(), T_exp = opt.expiry(), v = opt.vol();
    double d1 = (std::log(S / K) + 0.5 * v * v * T_exp) / (v * std::sqrt(T_exp));
    auto   Ncdf = [](double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    return opt.isCall() ? Ncdf(d1) : Ncdf(d1) - 1.0;
}

// Abbreviated function template (C++20 shorthand): auto parameter = unconstrained template
auto mid(std::floating_point auto bid, std::floating_point auto ask) noexcept {
    return (bid + ask) / decltype(bid)(2);
}

// Requires clause on function directly (alternative syntax)
template<typename T>
    requires FloatLike<T> && (sizeof(T) >= 4)
T basisPointValue(T price, T duration) noexcept {
    return price * duration / T(10000);
}

// concept composition: constrain on two named concepts simultaneously
template<PriceRange R>
double vwap(const R& prices, const R& volumes) {
    double pv = 0, v = 0;
    auto pit = std::ranges::begin(prices);
    auto vit = std::ranges::begin(volumes);
    for (; pit != std::ranges::end(prices); ++pit, ++vit)
        { pv += *pit * *vit; v += *vit; }
    return v > 0 ? pv / v : 0.0;
}`,
    explanation:
      "Concepts differ from SFINAE in that the constraint is checked before instantiation begins, so error messages name the unsatisfied concept rather than pointing into the middle of template expansion. The `requires` expression inside a concept body specifies a list of valid expressions and their return-type constraints — if any expression fails, the concept is false and overload resolution moves on to the next candidate.",
  },
  {
    id: "cpp-20260617-b1-treiber-stack",
    language: "cpp",
    title: "Treiber lock-free stack — CAS-based order recycling pool",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstddef>
#include <optional>

// Treiber (1986) lock-free stack: single compare_exchange on the head pointer.
// Used for lock-free object pools: producer returns exhausted order objects,
// consumer thread takes them for reuse — no mutex required.
// ABA problem: if thread 1 reads head=A, thread 2 pops A, frees it, pushes A
// back, then thread 1's CAS on A succeeds but A->next may be stale.
// ABA fix shown: generational counter packed with the pointer (not shown here;
// common fix is hazard pointers or epoch-based reclamation in production).

struct alignas(64) PoolNode {
    PoolNode* next = nullptr;   // intrusive list link
    char      data[56];         // payload (padded to cache line)
};

class TreiberStack {
    // acquire/release pairing: push uses release, pop uses acquire
    std::atomic<PoolNode*> head_{nullptr};

public:
    void push(PoolNode* node) noexcept {
        PoolNode* old_head = head_.load(std::memory_order_relaxed);
        do {
            node->next = old_head;
        } while (!head_.compare_exchange_weak(
            old_head, node,
            std::memory_order_release,   // publish node->next before head update
            std::memory_order_relaxed));
    }

    PoolNode* pop() noexcept {
        PoolNode* top = head_.load(std::memory_order_acquire);   // sync with push's release
        while (top) {
            // CAS: try to move head from top to top->next
            if (head_.compare_exchange_weak(
                    top, top->next,
                    std::memory_order_acquire,
                    std::memory_order_acquire))
                return top;
            // On failure, top is reloaded with the current head
        }
        return nullptr;   // stack is empty
    }

    bool empty() const noexcept {
        return head_.load(std::memory_order_acquire) == nullptr;
    }
};

// Thread A (producer): returns exhausted order slots to pool
// Thread B (consumer): takes order slots from pool for new orders
// No mutex; correctness relies solely on CAS atomicity + acquire/release ordering.

// compare_exchange_weak can spuriously fail (returns false even if equal on ARM).
// Always use weak in a retry loop: it generates a more efficient conditional branch
// on architectures with LL/SC (load-linked/store-conditional) pairs.`,
    explanation:
      "compare_exchange_weak on ARM compiles to LL/SC: a store-conditional that can fail spuriously when an interrupt occurs between load and store, even if no other thread interfered. The `weak` variant tolerates this and loops, generating a tighter retry loop than `strong` (which adds an outer loop itself). On x86, both compile to CMPXCHG; on ARM, `weak` is the preferred primitive because `strong` emulates the guaranteed-success semantic with an extra branch.",
  },
  {
    id: "cpp-20260617-b1-hugepages",
    language: "cpp",
    title: "Transparent huge pages — mmap + MADV_HUGEPAGE for hot ring buffers",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <cstring>
#include <stdexcept>
#include <cstdint>

// TLB miss cost: 20-100 ns (requires page-table walk).
// 4 KiB page: 1 MiB buffer = 256 TLB entries needed.
// 2 MiB huge page: 1 MiB buffer = 1 TLB entry. Huge pages are critical for
// hot data structures (ring buffer, order book array) that fit in a few MB.

static constexpr std::size_t HUGE_PAGE_SIZE = 2UL * 1024 * 1024;   // 2 MiB

class HugePageBuffer {
    void*       ptr_  = nullptr;
    std::size_t size_ = 0;

    static std::size_t roundUp(std::size_t n, std::size_t align) noexcept {
        return (n + align - 1) & ~(align - 1);
    }

public:
    explicit HugePageBuffer(std::size_t bytes) {
        size_ = roundUp(bytes, HUGE_PAGE_SIZE);

        // MAP_ANONYMOUS | MAP_PRIVATE: no file backing, copy-on-write
        ptr_ = ::mmap(nullptr, size_,
                      PROT_READ | PROT_WRITE,
                      MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (ptr_ == MAP_FAILED)
            throw std::runtime_error("mmap failed");

        // Ask kernel to back this region with 2 MiB huge pages
        // Kernel may fall back to 4 KiB pages if huge pages are unavailable
        ::madvise(ptr_, size_, MADV_HUGEPAGE);

        // MADV_POPULATE_WRITE: pre-fault all pages now (Linux 5.14+)
        // Avoids page-fault jitter on first access during trading hours
        ::madvise(ptr_, size_, MADV_POPULATE_WRITE);

        // Alternative: explicit memset forces physical page allocation
        std::memset(ptr_, 0, size_);
    }

    ~HugePageBuffer() noexcept {
        if (ptr_ && ptr_ != MAP_FAILED) ::munmap(ptr_, size_);
    }

    HugePageBuffer(const HugePageBuffer&) = delete;
    HugePageBuffer& operator=(const HugePageBuffer&) = delete;
    HugePageBuffer(HugePageBuffer&& o) noexcept : ptr_(o.ptr_), size_(o.size_) {
        o.ptr_ = nullptr; o.size_ = 0;
    }

    void*       data() noexcept       { return ptr_; }
    const void* data() const noexcept { return ptr_; }
    std::size_t size() const noexcept { return size_; }

    // Number of 2 MiB pages backing this buffer
    std::size_t numHugePages() const noexcept { return size_ / HUGE_PAGE_SIZE; }
};

// System-level setup (run once at process start, root required):
// echo 256 > /proc/sys/vm/nr_hugepages    # reserve 256 huge pages (512 MiB)
// cat /proc/meminfo | grep HugePages      # verify allocation`,
    explanation:
      "The TLB (Translation Lookaside Buffer) is typically 64-1024 entries. For a 128-entry L1 TLB with 4 KiB pages, a 512 KiB working set already exceeds capacity — every cache-miss also becomes a TLB miss. Huge pages reduce the TLB footprint by 512×, which is why HFT systems allocate all hot ring buffers and order book arrays from huge pages and observe 5-15% throughput improvements on memory-bound workloads.",
  },
  {
    id: "cpp-20260617-b1-prefetch-stream",
    language: "cpp",
    title: "Software prefetch for streaming order book — hiding DRAM latency",
    tag: "performance",
    code: `#include <cstddef>
#include <vector>
#include <cstdint>

// L1 cache hit: ~4 cycles (1-2 ns).
// DRAM access: ~200 cycles (70-100 ns).
// Prefetch: non-blocking hint that moves data from DRAM to L1/L2 before it's needed.
// For a sequential scan of an order book, prefetch PREFETCH_DIST lines ahead
// so each level is already in cache when the loop body executes it.
// __builtin_prefetch(addr, rw, locality): rw=0=read, 1=write; locality=0-3.

struct alignas(64) Level {
    int64_t  price_ticks;  // integer ticks
    int64_t  qty;
    uint32_t order_count;
    char     pad[44];      // fill to exactly 64 bytes (one cache line)
};
static_assert(sizeof(Level) == 64);

static constexpr int PREFETCH_DIST = 8;   // prefetch 8 levels = 512 bytes ahead

// Fill sweep: accumulate qty from best ask up to limit price
int64_t sweepAsk(const Level* levels, int n_levels, int64_t limit_ticks) noexcept {
    int64_t filled = 0;
    for (int i = 0; i < n_levels; ++i) {
        // Issue prefetch for level that will be needed PREFETCH_DIST iters later
        if (i + PREFETCH_DIST < n_levels) {
            __builtin_prefetch(&levels[i + PREFETCH_DIST], 0, 1);
            // locality=1: temporal locality low — evict after use, keep in L2
        }
        if (levels[i].price_ticks > limit_ticks) break;
        filled += levels[i].qty;
    }
    return filled;
}

// Volume-weighted average price of all levels up to limit
double vwapSweep(const std::vector<Level>& book, int64_t limit_ticks) noexcept {
    double pv = 0.0, vol = 0.0;
    const Level* data = book.data();
    const int    n    = static_cast<int>(book.size());
    for (int i = 0; i < n; ++i) {
        if (i + PREFETCH_DIST < n)
            __builtin_prefetch(data + i + PREFETCH_DIST, 0, 0);  // locality=0: no reuse
        if (data[i].price_ticks > limit_ticks) break;
        double p = data[i].price_ticks * 0.0001;
        pv  += p * data[i].qty;
        vol += data[i].qty;
    }
    return vol > 0 ? pv / vol : 0.0;
}

// Tuning PREFETCH_DIST:
// DIST too small: prefetch arrives too late (still a DRAM miss).
// DIST too large: pollutes cache with levels that won't be reached (fill < depth).
// Empirical target: DIST * loop_body_cycles ≈ DRAM_latency_cycles (~200 cycles).
// At 10 cycles/iteration, DIST=20; at 25 cycles/iter, DIST=8.`,
    explanation:
      "Software prefetch is most effective for sequential access patterns with predictable stride — exactly what order book sweeps provide. The key is calibrating PREFETCH_DIST so the prefetch arrives ≈200 cycles before the corresponding iteration, hiding the full DRAM latency. For random access patterns (e.g., hash map lookups with arbitrary keys), prefetch is less effective because the next address isn't known far enough in advance.",
  },
  {
    id: "cpp-20260617-b1-explicit-fd",
    language: "cpp",
    title: "Explicit finite-difference BS PDE — Euler-forward on a price grid",
    tag: "quant",
    code: `#include <vector>
#include <algorithm>
#include <cmath>

// Black-Scholes PDE: dV/dt + 0.5*sigma^2*S^2*d2V/dS2 + r*S*dV/dS - r*V = 0
// Discretise backwards in time: V[j,i] → V at price S_j at time step i.
// S-grid: S_j = j * dS, j=0..M. T-grid: t_i = i * dt, i=0..N (i=N is maturity).
// Explicit (forward Euler in time, centred in space):
//   V[j,i] = alpha[j]*V[j-1,i+1] + (1-2*alpha[j]-r*dt)*V[j,i+1] + alpha[j]*V[j+1,i+1]
//   where alpha[j] = 0.5*sigma^2*j^2*dt (proportional to gamma)
// Stability condition: sigma^2 * M^2 * dt / (2 * dS^2) <= 0.5, i.e., max alpha <= 0.5.

struct FDResult { double price; std::vector<double> v_grid; };

FDResult explicitFD(double S0, double K, double r, double sigma, double T,
                    bool call, int M = 200, int N = 5000) {
    const double S_max = 3.0 * K;          // grid upper bound (3× strike)
    const double dS = S_max / M;           // price step
    const double dt = T / N;               // time step

    // Stability check: max alpha = 0.5 * sigma^2 * M^2 * dt <= 0.5
    // (largest j contribution at j=M)
    if (0.5 * sigma * sigma * M * M * dt > 0.5)
        throw std::runtime_error("FD scheme unstable: reduce dt or increase N");

    std::vector<double> V(M + 1), Vnew(M + 1);

    // Terminal condition at maturity (i = N)
    for (int j = 0; j <= M; ++j) {
        double S = j * dS;
        V[j] = call ? std::max(S - K, 0.0) : std::max(K - S, 0.0);
    }

    // Backward in time
    for (int i = N - 1; i >= 0; --i) {
        // Boundary conditions
        Vnew[0] = call ? 0.0 : K * std::exp(-r * (N - i) * dt);   // S=0
        Vnew[M] = call ? S_max - K * std::exp(-r * (N - i) * dt)  // S=S_max
                       : 0.0;

        // Interior nodes: explicit update
        for (int j = 1; j < M; ++j) {
            double alpha = 0.5 * sigma * sigma * j * j * dt;  // j = S_j / dS
            double drift  = 0.5 * r * j * dt;                  // drift term
            Vnew[j] = (alpha - drift) * V[j - 1]
                    + (1.0 - 2.0 * alpha - r * dt) * V[j]
                    + (alpha + drift) * V[j + 1];
        }
        V = Vnew;
    }

    // Interpolate at S0
    double jf   = S0 / dS;
    int    jl   = static_cast<int>(jf);
    double frac = jf - jl;
    double price = (1.0 - frac) * V[jl] + frac * V[jl + 1];
    return {price, V};
}`,
    explanation:
      "The explicit FD scheme's stability condition `α_max ≤ 0.5` constrains the time step: `dt ≤ dS² / (σ² · S_max²)`. For S_max = 3K and a fine price grid, this forces very small dt (many time steps N), making explicit FD O(M·N) and slow compared to the implicit Crank-Nicolson scheme which is unconditionally stable. However, explicit FD is simple to implement, trivially parallelisable across price nodes, and useful for teaching PDE structure before learning the tridiagonal solvers needed for implicit methods.",
  },
  {
    id: "cpp-20260617-b1-heston-mc",
    language: "cpp",
    title: "Heston stochastic volatility MC — correlated Brownian paths",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <numeric>

// Heston (1993):
//   dS = r*S*dt + sqrt(v)*S*dW_S
//   dv = kappa*(theta-v)*dt + xi*sqrt(v)*dW_v
//   Corr(dW_S, dW_v) = rho
// Euler-Milstein discretisation:
//   S_{t+dt} = S_t * exp((r - 0.5*v_t)*dt + sqrt(v_t*dt)*Z1)
//   v_{t+dt} = max(v_t + kappa*(theta-v_t)*dt + xi*sqrt(v_t*dt)*Z2, 0)
// Correlation: Z2 = rho*Z1 + sqrt(1-rho^2)*Z_ind

struct HestonParams {
    double kappa;   // mean-reversion speed
    double theta;   // long-run variance
    double xi;      // vol-of-vol
    double rho;     // S-v correlation (typically negative: -0.7 to -0.3)
    double v0;      // initial variance
};

struct HestonResult { double price; double se; };

HestonResult hestonCallMC(double S0, double K, double r,
                           const HestonParams& p,
                           double T, int n_steps = 252,
                           int n_paths = 200000, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt   = T / n_steps;
    double disc = std::exp(-r * T);
    double sum  = 0.0, sum2 = 0.0;
    double sqrt1rho2 = std::sqrt(1.0 - p.rho * p.rho);

    for (int path = 0; path < n_paths; ++path) {
        double S = S0, v = p.v0;
        for (int t = 0; t < n_steps; ++t) {
            double Z1 = nd(rng), Zind = nd(rng);
            double Z2 = p.rho * Z1 + sqrt1rho2 * Zind;   // correlated increment

            double sqrt_v_dt = std::sqrt(std::max(v, 0.0) * dt);

            // Log-normal step for S (Milstein has no correction for GBM)
            S *= std::exp((r - 0.5 * v) * dt + sqrt_v_dt * Z1);

            // Euler step for v, clamped to 0 (full truncation scheme)
            v = std::max(
                v + p.kappa * (p.theta - v) * dt + p.xi * sqrt_v_dt * Z2,
                0.0);
        }
        double pay = disc * std::max(S - K, 0.0);
        sum  += pay;
        sum2 += pay * pay;
    }
    double price = sum / n_paths;
    double se    = std::sqrt((sum2 / n_paths - price * price) / (n_paths - 1));
    return {price, se};
}

// Feller condition: 2*kappa*theta > xi^2 ensures v stays positive (continuous time).
// Under Euler discretisation, v can touch 0 even when Feller holds; full truncation
// (clamping to 0) is the numerically most stable approach for vanilla options.`,
    explanation:
      "The negative rho (typically −0.6 to −0.3 for equity indices) is the leverage effect: when the stock falls (Z1 < 0), variance tends to rise (Z2 < 0 pulls v up via rho·Z1). This correlation cannot be captured by Black-Scholes and is why Heston produces a downward-sloping implied vol skew across strikes. The full-truncation scheme clamps v to zero rather than reflecting or absorbing it, which is unbiased and converges to the exact distribution faster than the Euler or QE schemes for most practical parameters.",
  },
  {
    id: "cpp-20260617-b1-lookback-mc",
    language: "cpp",
    title: "Floating-strike lookback call — MC path maximum tracking",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Floating-strike lookback call: payoff = S_T - min(S_t, t in [0,T]).
// The option holder gets to buy at the lowest price realised over the life.
// Closed-form (Goldman-Sosin-Gatto 1979) exists for continuous monitoring.
// Here: daily-monitoring MC + analytic comparison.

struct LookbackResult {
    double mc_price;
    double mc_se;
    double analytic_price;   // continuous-monitoring closed form
};

// Goldman-Sosin-Gatto (1979) closed form for continuous floating-strike lookback call
static double analyticsLookback(double S0, double r, double sigma, double T) noexcept {
    auto Ncdf = [](double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    double sqT = std::sqrt(T);
    double a1  = (r / (sigma * sigma) + 0.5) * sigma * sqT;
    double a2  = a1 - sigma * sqT;
    double c   = S0 * (Ncdf(a1) - sigma * sigma / (2.0 * r) * std::exp(-r * T) * Ncdf(-a2)
                       + std::exp(-r * T) * Ncdf(-a2) * sigma * sigma / (2.0 * r) * 0.0);
    // Simplified: S0*(N(d1) + sigma^2/(2r)*exp(-rT)*[N(d2) - 1] + exp(-rT)*N(-d1))
    // Full formula (Shreve 2004 §7.3):
    double d1_inv = (std::log(1.0) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2_inv = d1_inv - sigma * sqT;
    double term_a = S0 * Ncdf(d1_inv);
    double term_b = S0 * std::exp(-r * T) * Ncdf(-d1_inv);
    double term_c = S0 * (sigma * sigma / (2.0 * r))
                    * (std::exp(-r * T) * Ncdf(-d2_inv) - Ncdf(-d1_inv));
    return term_a - term_b + term_c;  // approximate; full formula omits closed-form edge cases
}

LookbackResult lookbackCallMC(double S0, double r, double sigma, double T,
                               int n_steps = 252, int n_paths = 200000, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double dt   = T / n_steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    double sum = 0.0, sum2 = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double S = S0, S_min = S0;
        for (int t = 0; t < n_steps; ++t) {
            S *= std::exp(drift + vol * nd(rng));
            S_min = std::min(S_min, S);   // track running minimum
        }
        double pay = disc * (S - S_min);   // floating-strike payoff
        sum  += pay;
        sum2 += pay * pay;
    }
    double price = sum / n_paths;
    double se    = std::sqrt((sum2 / n_paths - price * price) / (n_paths - 1));
    return {price, se, analyticsLookback(S0, r, sigma, T)};
}

// Lookback >= plain vanilla call: the holder always buys at the minimum,
// which is <= S_T in expectation → expected payoff >= max(S_T - S_0, 0).
// Typical price: 1.5-2× ATM vanilla call, depending on sigma and monitoring frequency.`,
    explanation:
      "The floating-strike lookback option achieves perfect market timing in hindsight — buying at the lowest realised price. Its premium relative to a vanilla call captures the value of this hindsight. The continuous-monitoring closed form assumes the minimum is observed at every instant, while daily monitoring (n_steps=252) gives slightly lower prices because the minimum over 252 observations is higher than the continuous minimum on average.",
  },
  {
    id: "cpp-20260617-b1-irs-par",
    language: "cpp",
    title: "IRS par rate — interest rate swap fair fixed coupon from discount factors",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <stdexcept>

// Interest Rate Swap: pay fixed coupon C, receive floating (SOFR).
// At par: PV(fixed leg) = PV(floating leg).
// Floating leg: sum of forward LIBOR × notional × tau × DF = notional × (1 - DF(T_N))
//   (bootstrap identity: floating leg = par bond minus 1 discounted).
// Fixed leg: C × notional × sum(tau_i × DF(T_i))  for each coupon period i.
// Par rate: C* = (1 - DF(T_N)) / sum(tau_i * DF(T_i))   [zero = annuity / pvbp]

struct IRSResult {
    double par_rate;     // fair fixed coupon rate (annualized)
    double pvbp;         // price value of a basis point per notional (BPV/DV01)
    double annuity;      // sum of tau * DF (fixed leg annuity factor)
    double pv_receive;   // PV of floating leg (at par = 1 - DF_N per unit notional)
};

// discount_factors: DF(T_i) for each payment date T_i (i=1..N)
// tenors: year fractions tau_i for each period [T_{i-1}, T_i]
IRSResult irsParRate(const std::vector<double>& discount_factors,
                     const std::vector<double>& tenors) {
    if (discount_factors.empty() || discount_factors.size() != tenors.size())
        throw std::invalid_argument("DF and tenor vectors must match");

    // Annuity: sum of discount_factor × accrual_fraction for fixed coupon
    double annuity = 0.0;
    for (std::size_t i = 0; i < discount_factors.size(); ++i)
        annuity += tenors[i] * discount_factors[i];

    // Floating leg PV = 1 - DF(T_N) (per unit notional, assuming DF(T_0)=1)
    double df_N = discount_factors.back();
    double pv_float = 1.0 - df_N;

    // Par rate: fixed rate that makes NPV = 0
    double par_rate = pv_float / annuity;

    // BPV (DV01): change in fixed leg PV per 1 basis point change in par rate
    double pvbp = annuity * 0.0001;   // annuity × 0.01% = per-notional DV01

    return {par_rate, pvbp, annuity, pv_float};
}

// Build flat-curve discount factors for illustration
std::vector<double> flatCurveDF(double rate, const std::vector<double>& times) {
    std::vector<double> dfs;
    dfs.reserve(times.size());
    for (double T : times) dfs.push_back(std::exp(-rate * T));
    return dfs;
}

// Example: 5-year semi-annual swap, flat 4% curve
// times = {0.5, 1.0, 1.5, ..., 5.0}; tenors = {0.5, 0.5, ..., 0.5}
// par_rate ≈ 4% (equals flat rate when curve is flat)`,
    explanation:
      "The floating leg identity `PV_float = 1 − DF(T_N)` is a model-free result: the floating leg pays SOFR for each period, which is exactly what a rolling overnight deposit earns, so its PV equals the difference between investing $1 today and receiving the par bond at maturity. This means the par rate depends only on the discount factors, not on any model for future floating rates — it is a direct observable from the sovereign yield curve.",
  },
  {
    id: "cpp-20260617-b1-ranges",
    language: "cpp",
    title: "C++20 std::views pipeline — lazy tick filtering and transformation",
    tag: "modern",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <numeric>
#include <cstdint>
#include <cmath>

// C++20 ranges: lazy view adaptor pipeline.
// Views are non-owning, zero-copy — they store iterators into the source range.
// Composition with | is left-to-right and each adaptor is evaluated on demand.
// No intermediate vectors; memory usage is O(1) per pipeline step.

struct Tick {
    int64_t ts_ns;
    double  price;
    int     volume;
    int     venue;       // 0=NYSE, 1=NASDAQ, 2=BATS
    bool    canceled;
};

// Compose a pipeline: filter out canceled ticks, keep NYSE/NASDAQ, return prices
auto livePrices(const std::vector<Tick>& ticks) {
    return ticks
        | std::views::filter([](const Tick& t) { return !t.canceled; })
        | std::views::filter([](const Tick& t) { return t.venue <= 1; })
        | std::views::transform([](const Tick& t) { return t.price; });
}

// VWAP via ranges accumulation
double vwapFromTicks(const std::vector<Tick>& ticks) {
    auto live = ticks
        | std::views::filter([](const Tick& t) { return !t.canceled; });

    double pv = 0.0, vol = 0.0;
    for (const auto& t : live) { pv += t.price * t.volume; vol += t.volume; }
    return vol > 0 ? pv / vol : 0.0;
}

// Sliding window (C++23 std::views::slide; or manual take/drop in C++20)
// Here: manual 20-tick rolling max using drop + take
double slidingMax(const std::vector<Tick>& ticks, std::size_t window) {
    double best = -1e18;
    auto prices_view = ticks | std::views::transform([](const Tick& t){ return t.price; });
    for (auto p : prices_view) best = std::max(best, p);
    return best;
}

// iota + zip-like pattern: generate and annotate tick indices
auto indexedTicks(const std::vector<Tick>& ticks) {
    // C++23 std::views::zip; in C++20 use std::views::iota + manual offset
    return std::views::iota(0UZ, ticks.size())
         | std::views::transform([&](std::size_t i) {
               return std::pair{i, ticks[i].price};
           });
}

// Count using ranges algorithms — reads exactly once through the view
int countBuySide(const std::vector<Tick>& ticks) {
    return static_cast<int>(std::ranges::count_if(
        ticks, [](const Tick& t){ return !t.canceled && t.price > 0; }));
}`,
    explanation:
      "std::views::filter and transform compose into a single lazy iterator: when the for-loop pulls the next element, each adaptor propagates the pull upwards to the source. No intermediate `std::vector<double>` is materialised — the full pipeline allocates zero bytes on the heap and has O(1) space complexity. This contrasts sharply with a method chain on `std::vector` (e.g., `.filter()` followed by `.map()`) in languages like Python, which create intermediate collections at each step.",
  },
  {
    id: "cpp-20260617-b1-jthread",
    language: "cpp",
    title: "std::jthread with stop_token — auto-stopping risk engine worker",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <atomic>
#include <chrono>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <cstdint>

// C++20 std::jthread: automatically joins on destruction (RAII thread).
// stop_token / stop_source: cooperative cancellation without a global flag.
// std::stop_callback: register cleanup code that runs when stop is requested.

struct RiskUpdate { uint64_t position_id; double delta; };

class RiskEngine {
    std::queue<RiskUpdate>      queue_;
    std::mutex                  mu_;
    std::condition_variable_any cv_;   // _any variant works with stop_token
    std::atomic<double>         total_delta_{0.0};

    // Worker function: takes stop_token as first argument (jthread convention)
    void worker(std::stop_token stoken) {
        // stop_callback: executed when stop is requested (even while blocked on cv)
        std::stop_callback on_stop{stoken, [this]{ cv_.notify_all(); }};

        while (!stoken.stop_requested()) {
            std::unique_lock lock{mu_};
            // cv_.wait with stop_token: wakes on notify OR on stop request
            cv_.wait(lock, stoken, [this]{ return !queue_.empty(); });

            if (stoken.stop_requested()) break;

            while (!queue_.empty()) {
                auto upd = queue_.front(); queue_.pop();
                lock.unlock();
                total_delta_.fetch_add(upd.delta, std::memory_order_relaxed);
                lock.lock();
            }
        }
    }

    std::jthread thread_;   // joins automatically in destructor

public:
    RiskEngine() : thread_([this](std::stop_token st){ worker(st); }) {}

    ~RiskEngine() {
        // thread_.request_stop() + thread_.join() called automatically by jthread dtor
    }

    void submit(RiskUpdate upd) {
        { std::lock_guard lock{mu_}; queue_.push(upd); }
        cv_.notify_one();
    }

    double totalDelta() const noexcept {
        return total_delta_.load(std::memory_order_relaxed);
    }

    void stop() { thread_.request_stop(); }
};

// With std::thread: must manually track thread + shared bool + call join().
// With std::jthread: destruction is always safe — no join() to forget.
// In destructors and exception handlers, forgetting join() caused hard-to-debug hangs.`,
    explanation:
      "std::jthread solves two classic problems with std::thread: forgetting to join (which terminates the process) and forgetting to signal threads to stop. The stop_token/stop_source mechanism is superior to a shared `bool stopped` flag because it integrates with std::condition_variable_any's wait overload — the CV wakes up when the stop is requested even if the predicate is false, eliminating the race between checking the flag and entering the wait.",
  },
  {
    id: "cpp-20260617-b1-cholesky-gbm",
    language: "cpp",
    title: "Cholesky-correlated multi-asset GBM — basket option pricing",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <array>
#include <numeric>

// Multi-asset GBM with correlation:
//   dS_i / S_i = r*dt + sigma_i * sum_j(L_ij * dZ_j)
// where L is the lower Cholesky factor of the correlation matrix Rho.
// Correlated innovations: epsilon_i = sum_j(L_ij * Z_j), Z_j ~ N(0,1) iid.
// Cholesky: L*L^T = Rho, computed once; each path samples n iid normals.

// Cholesky decomposition (n×n lower triangular)
template<int N>
std::array<std::array<double, N>, N>
cholesky(const std::array<std::array<double, N>, N>& A) {
    std::array<std::array<double, N>, N> L{};
    for (int i = 0; i < N; ++i) {
        for (int j = 0; j <= i; ++j) {
            double s = A[i][j];
            for (int k = 0; k < j; ++k) s -= L[i][k] * L[j][k];
            L[i][j] = (i == j) ? std::sqrt(s) : s / L[j][j];
        }
    }
    return L;
}

// Basket call: max(mean(S_i(T)) - K, 0)
double basketCallMC(const std::array<double, 3>& S0,
                    const std::array<double, 3>& sigma,
                    const std::array<std::array<double, 3>, 3>& corr,
                    double K, double r, double T,
                    int n_paths = 200000, int seed = 42) {
    auto L = cholesky<3>(corr);
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double disc = std::exp(-r * T);
    double sum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        // Sample 3 iid normals
        std::array<double, 3> Z = {nd(rng), nd(rng), nd(rng)};

        // Correlated innovations: eps = L * Z
        std::array<double, 3> eps{};
        for (int i = 0; i < 3; ++i)
            for (int j = 0; j <= i; ++j)
                eps[i] += L[i][j] * Z[j];

        // Terminal prices
        double basket = 0.0;
        for (int i = 0; i < 3; ++i) {
            double ST = S0[i] * std::exp(
                (r - 0.5 * sigma[i] * sigma[i]) * T + sigma[i] * std::sqrt(T) * eps[i]);
            basket += ST;
        }
        basket /= 3.0;
        sum += disc * std::max(basket - K, 0.0);
    }
    return sum / n_paths;
}

// Usage:
// std::array<std::array<double,3>,3> corr = {{{1.0,0.5,0.3},{0.5,1.0,0.4},{0.3,0.4,1.0}}};
// double price = basketCallMC({100,100,100}, {0.2,0.25,0.18}, corr, 100, 0.05, 1.0);`,
    explanation:
      "Cholesky decomposition of the correlation matrix satisfies `L·L^T = Rho`, so `Cov(ε_i, ε_j) = (L·L^T)_ij = Rho_ij` as required. The key numerical requirement is that the correlation matrix must be positive semi-definite (all eigenvalues ≥ 0); near-singular correlation matrices from overlapping assets require regularisation (e.g., nearest PSD matrix via eigenvalue clamping) before Cholesky can succeed.",
  },
  {
    id: "cpp-20260617-b1-dupire-lv",
    language: "cpp",
    title: "Dupire local vol from call price surface — finite-difference approximation",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <functional>
#include <stdexcept>

// Dupire (1994) formula:
//   sigma_loc^2(K, T) = [dC/dT + r*K*dC/dK] / [0.5 * K^2 * d2C/dK2]
// Numerator: time decay of call price + carry on the strike.
// Denominator: 0.5 * K^2 * Gamma in K-space (butterfly spread value).
// All partials computed via finite differences on a grid of call prices.

// call_grid[i][j] = call price at (K[i], T[j])
double dupireLocalVol(const std::vector<std::vector<double>>& call_grid,
                       const std::vector<double>& strikes,   // K axis
                       const std::vector<double>& expiries,  // T axis
                       double r,
                       int ki, int ti) {                     // grid indices
    if (ki < 1 || ki >= (int)strikes.size() - 1)
        throw std::out_of_range("ki must be interior strike");
    if (ti < 1 || ti >= (int)expiries.size() - 1)
        throw std::out_of_range("ti must be interior expiry");

    double K    = strikes[ki];
    double dK_u = strikes[ki + 1] - K;
    double dK_d = K - strikes[ki - 1];
    double dK   = 0.5 * (dK_u + dK_d);    // average spacing
    double dT   = expiries[ti] - expiries[ti - 1];

    double C   = call_grid[ki][ti];
    double C_u = call_grid[ki + 1][ti];    // call at higher strike
    double C_d = call_grid[ki - 1][ti];    // call at lower strike
    double C_T = call_grid[ki][ti + 1];    // call at next expiry (note: T[ti+1] > T[ti])

    // dC/dT: forward difference in T (or centred if available)
    double dC_dT = (C_T - C) / dT;

    // dC/dK: centred difference in K
    double dC_dK = (C_u - C_d) / (2.0 * dK);

    // d2C/dK2: second centred difference
    double d2C_dK2 = (C_u - 2.0 * C + C_d) / (dK * dK);

    // Dupire numerator and denominator
    double numerator   = dC_dT + r * K * dC_dK;
    double denominator = 0.5 * K * K * d2C_dK2;

    if (denominator <= 1e-10) return 0.0;   // surface is too flat (no info)
    double lv2 = numerator / denominator;
    return lv2 > 0 ? std::sqrt(lv2) : 0.0;
}

// In practice:
// 1. Fit a parametric surface (SVI, SABR) to market quotes to get smooth C(K,T).
// 2. Evaluate Dupire on the smooth surface (noisy raw quotes → NaN from d2C/dK2).
// 3. Use the local vol for path-dependent products (barrier, Asian) via MC or PDE.`,
    explanation:
      "The denominator `K²·∂²C/∂K²` is the (undiscounted) butterfly spread — it must be positive for no-arbitrage; negative d²C/dK² means a negative probability density, which cannot produce a valid local vol. The numerator's `r·K·∂C/∂K` term is a carry adjustment that ensures the drift of the risk-neutral measure under the local vol model equals r. In practice, the raw market call grid is too noisy for numerical second derivatives — a smooth parametric fit (SVI in particular) is always applied first.",
  },
  {
    id: "cpp-20260617-b1-rdtsc",
    language: "cpp",
    title: "RDTSC latency timer — cycle-accurate measurement with CPUID serialization",
    tag: "performance",
    code: `#include <cstdint>
#include <cstring>
#include <array>

// RDTSC (Read Time-Stamp Counter): reads the CPU cycle counter.
// Without serialization: out-of-order execution may reorder RDTSC relative
// to the code being measured → understated latencies.
// CPUID is a serializing instruction: forces all preceding instructions to
// retire before CPUID executes, then RDTSC reads the count after quiescing.
// RDTSCP (available on AMD/Intel x86-64): also serializes on the read side.

inline uint64_t rdtsc_start() noexcept {
    uint32_t lo, hi;
    // CPUID serializes out-of-order execution before the RDTSC
    // Volatile asm: prevents compiler from reordering around this barrier
    __asm__ volatile (
        "cpuid\\n\\t"
        "rdtsc\\n\\t"
        "mov %%edx, %0\\n\\t"
        "mov %%eax, %1\\n\\t"
        : "=r"(hi), "=r"(lo)
        :: "%rax", "%rbx", "%rcx", "%rdx");
    return (static_cast<uint64_t>(hi) << 32) | lo;
}

inline uint64_t rdtsc_end() noexcept {
    uint32_t lo, hi;
    // RDTSCP serializes on the read side (drains the store buffer)
    __asm__ volatile (
        "rdtscp\\n\\t"
        "mov %%edx, %0\\n\\t"
        "mov %%eax, %1\\n\\t"
        "cpuid\\n\\t"       // serialize after to prevent hoisting the next code
        : "=r"(hi), "=r"(lo)
        :: "%rax", "%rbx", "%rcx", "%rdx");
    return (static_cast<uint64_t>(hi) << 32) | lo;
}

// Measure time in nanoseconds given known CPU frequency
double cyclesToNs(uint64_t cycles, double cpu_ghz = 3.0) noexcept {
    return static_cast<double>(cycles) / cpu_ghz;
}

// Calibrate: measure overhead of the RDTSC pair itself (~20-40 cycles)
uint64_t rdtscOverhead() noexcept {
    constexpr int N = 100;
    std::array<uint64_t, N> samples;
    for (int i = 0; i < N; ++i) {
        uint64_t t0 = rdtsc_start();
        uint64_t t1 = rdtsc_end();
        samples[i] = t1 - t0;
    }
    // Median of samples (minimum is cleaner: measures serialization overhead only)
    uint64_t min_val = samples[0];
    for (auto v : samples) if (v < min_val) min_val = v;
    return min_val;
}

// Usage:
// uint64_t t0 = rdtsc_start();
// processOrder(order);
// uint64_t t1 = rdtsc_end();
// double ns = cyclesToNs(t1 - t0 - rdtscOverhead());`,
    explanation:
      "RDTSC without CPUID can return a timestamp from before the code under measurement actually starts, because the CPU's out-of-order engine may execute RDTSC speculatively while earlier instructions are still pending. The CPUID+RDTSC / RDTSCP+CPUID sandwich provides a fenced measurement: the pre-RDTSC CPUID ensures all prior instructions have retired, and the post-RDTSC CPUID prevents the measurement block's code from being moved into the timed region by the optimizer.",
  },
  {
    id: "cpp-20260617-b1-atomic-ref",
    language: "cpp",
    title: "std::atomic_ref — atomic access to non-atomic storage fields",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <thread>
#include <vector>

// std::atomic_ref (C++20): provides atomic operations on a non-atomic variable.
// Use case: existing struct with plain fields where only some accesses need atomicity.
// std::atomic_ref is a zero-overhead wrapper — on x86 it compiles to the same
// LOCK-prefixed instructions as std::atomic, but doesn't force the field to be
// always-atomic (saves padding/size overhead when single-threaded access dominates).

struct OrderBook {
    // Hot data read by many threads simultaneously
    double best_bid;     // plain double — atomic_ref provides thread-safe access
    double best_ask;
    int64_t bid_qty;
    int64_t ask_qty;
    uint64_t seq_no;
    char pad[24];        // not aligned to atomic_ref requirements for illustration
};

// Market data ingest: atomically update best bid
void updateBid(OrderBook& book, double new_bid, int64_t new_qty) noexcept {
    // atomic_ref provides atomic load/store without changing OrderBook layout
    std::atomic_ref<double>  bid_ref{book.best_bid};
    std::atomic_ref<int64_t> qty_ref{book.bid_qty};

    // Store: release ordering ensures qty is visible before bid update
    qty_ref.store(new_qty, std::memory_order_relaxed);
    bid_ref.store(new_bid, std::memory_order_release);
}

// Strategy thread: atomically read best bid
double readBid(const OrderBook& book) noexcept {
    // atomic_ref on const storage: only read operations are allowed
    std::atomic_ref<const double> bid_ref{book.best_bid};
    return bid_ref.load(std::memory_order_acquire);
}

// Sequence number: CAS-based optimistic update
bool updateSeqNo(OrderBook& book, uint64_t expected, uint64_t next) noexcept {
    std::atomic_ref<uint64_t> seq_ref{book.seq_no};
    return seq_ref.compare_exchange_strong(expected, next,
                                           std::memory_order_acq_rel,
                                           std::memory_order_relaxed);
}

// Requirement: OrderBook must be at least aligned as required_alignment of atomic_ref<T>.
// std::atomic_ref<double>::required_alignment == alignof(double) on all platforms.
// For lock-free guarantee: the object must not straddle two cache lines.
static_assert(std::atomic_ref<double>::required_alignment <= alignof(double));
static_assert(std::atomic_ref<int64_t>::is_always_lock_free);`,
    explanation:
      "std::atomic_ref enables gradual migration from plain fields to atomic access without changing struct layout or forcing all code paths to pay the atomic overhead. It is particularly useful when a struct is normally accessed by a single thread (so no atomics needed) but occasionally needs thread-safe hand-off — the `atomic_ref` is only constructed at hand-off points. The object referenced must stay alive for the lifetime of all atomic_refs to it; using a dangling atomic_ref is UB.",
  },
  {
    id: "cpp-20260617-b1-greeks-fd",
    language: "cpp",
    title: "Bump-and-reval finite-difference Greeks — central differences",
    tag: "quant",
    code: `#include <cmath>
#include <functional>

// Bump-and-reval: compute option Greeks by bumping each input and repricing.
// Central differences: G ≈ (V(x+h) - V(x-h)) / (2h) — O(h^2) error vs O(h) for forward.
// Second-order (gamma): G ≈ (V(x+h) - 2V(x) + V(x-h)) / h^2.
// Bump sizes: typical practice is h_S = 0.01*S (1%), h_sigma = 0.001 (0.1%), h_T = 1/365.

// Model-agnostic: accepts any pricing function V(S, K, r, T, sigma, call)
using Pricer = std::function<double(double S, double K, double r, double T, double sigma, bool call)>;

struct Greeks {
    double delta;    // dV/dS
    double gamma;    // d2V/dS2
    double vega;     // dV/d_sigma (per 1% vol move)
    double theta;    // dV/dT (per calendar day, negative for long options)
    double rho_rate; // dV/dr (per 1% rate move)
};

Greeks computeGreeks(const Pricer& V,
                     double S, double K, double r, double T, double sigma, bool call) {
    // Bump sizes calibrated to O(h^2) accuracy
    double h_S     = 0.01 * S;           // 1% of spot
    double h_sigma = 0.0001;             // 1 basis-point vol bump
    double h_T     = 1.0 / 365.0;       // 1 calendar day
    double h_r     = 0.0001;            // 1 basis-point rate bump

    double V0 = V(S, K, r, T, sigma, call);

    // Delta: central difference in S
    double Vu = V(S + h_S, K, r, T, sigma, call);
    double Vd = V(S - h_S, K, r, T, sigma, call);
    double delta = (Vu - Vd) / (2.0 * h_S);

    // Gamma: second difference in S
    double gamma = (Vu - 2.0 * V0 + Vd) / (h_S * h_S);

    // Vega: central difference in sigma, normalised to 1% move
    double Vu_sig = V(S, K, r, T, sigma + h_sigma, call);
    double Vd_sig = V(S, K, r, T, sigma - h_sigma, call);
    double vega = (Vu_sig - Vd_sig) / (2.0 * h_sigma) * 0.01;   // per 1% vol

    // Theta: forward difference in time (T decreasing = option approaching maturity)
    double Vt_fwd = V(S, K, r, T - h_T, sigma, call);
    double theta  = (Vt_fwd - V0) / h_T;   // negative for long options

    // Rho: central difference in r
    double Vu_r = V(S, K, r + h_r, T, sigma, call);
    double Vd_r = V(S, K, r - h_r, T, sigma, call);
    double rho_rate = (Vu_r - Vd_r) / (2.0 * h_r) * 0.01;   // per 1% rate

    return {delta, gamma, vega, theta, rho_rate};
}

// Analytic BS for verification
double bsCall(double S, double K, double r, double T, double sigma, bool call) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma * std::sqrt(T);
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    return call ? S*N(d1) - K*std::exp(-r*T)*N(d2)
                : K*std::exp(-r*T)*N(-d2) - S*N(-d1);
}`,
    explanation:
      "Central differences achieve O(h²) accuracy: the truncation error in `(V(x+h) − V(x−h))/(2h)` is proportional to h², while forward differences are O(h). For h = 0.01·S, the error in delta is ~10⁻⁴ (4 significant figures), which is sufficient for hedging but not for second-order Greeks (gamma), where the relative error is larger. The bump-and-reval approach is model-agnostic: the same code works for any pricer, including exotic options with no closed-form Greeks.",
  },
  {
    id: "cpp-20260617-b1-small-buf-fn",
    language: "cpp",
    title: "Small buffer optimization for callable — avoiding std::function heap allocation",
    tag: "modern",
    code: `#include <cstddef>
#include <type_traits>
#include <utility>
#include <cstring>
#include <new>
#include <cassert>

// std::function allocates on the heap for callables larger than its internal buffer
// (~16-32 bytes, implementation-defined). For hot paths (order event callbacks),
// this allocation is too slow. SBOFunction stores small callables inline.

template<typename Sig, std::size_t BufSize = 32>
class SBOFunction;

template<typename Ret, typename... Args, std::size_t BufSize>
class SBOFunction<Ret(Args...), BufSize> {
    alignas(max_align_t) std::byte buf_[BufSize]{};

    // Type-erased vtable
    Ret  (*invoke_)(void*, Args&&...) = nullptr;
    void (*destroy_)(void*)           = nullptr;
    void (*copy_)(void*, const void*) = nullptr;

public:
    SBOFunction() = default;

    template<typename F>
    SBOFunction(F&& f) {
        using Decay = std::decay_t<F>;
        static_assert(sizeof(Decay) <= BufSize,
                      "callable too large for SBOFunction buffer");
        static_assert(alignof(Decay) <= alignof(max_align_t));

        // Construct callable in-place in buf_
        ::new (static_cast<void*>(buf_)) Decay(std::forward<F>(f));

        invoke_  = [](void* p, Args&&... a) -> Ret {
            return (*static_cast<Decay*>(p))(std::forward<Args>(a)...);
        };
        destroy_ = [](void* p) { static_cast<Decay*>(p)->~Decay(); };
        copy_    = [](void* dst, const void* src) {
            ::new (dst) Decay(*static_cast<const Decay*>(src));
        };
    }

    ~SBOFunction() { if (destroy_) destroy_(buf_); }

    SBOFunction(const SBOFunction& o) {
        if (o.invoke_) {
            o.copy_(buf_, o.buf_);
            invoke_ = o.invoke_; destroy_ = o.destroy_; copy_ = o.copy_;
        }
    }

    Ret operator()(Args... args) {
        assert(invoke_ && "calling an empty SBOFunction");
        return invoke_(buf_, std::forward<Args>(args)...);
    }

    explicit operator bool() const noexcept { return invoke_ != nullptr; }
};

// Usage: hot-path market event callbacks with no heap allocation
// SBOFunction<void(double, int)> on_trade;
// on_trade = [pos = 0](double px, int qty) mutable { pos += qty; };
// on_trade(100.25, 100);  // zero heap allocation`,
    explanation:
      "std::function's heap fallback occurs when the callable's sizeof exceeds the implementation's internal buffer. SBOFunction guarantees inline storage up to BufSize bytes and triggers a static_assert rather than silently falling back to the heap. The static vtable (function pointer triplet) is zero-overhead compared to std::function's polymorphic vtable: both perform one indirect function call, but SBOFunction eliminates the type-erased reference to a heap-allocated control block.",
  },
  {
    id: "cpp-20260617-b1-jamshidian",
    language: "cpp",
    title: "Jamshidian decomposition — bond option as portfolio of ZCB options",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <algorithm>

// Jamshidian (1989): under an affine term structure (Vasicek, CIR), a coupon
// bond option can be decomposed into a portfolio of zero-coupon bond (ZCB) options.
// Key insight: in an affine model, bond prices are monotone decreasing in r.
// So there exists a unique critical rate r* such that:
//   coupon_bond_price(r*) = K (the exercise condition).
// Then: call on bond = sum of calls on each ZCB with strike K_i = ZCB_i(r*).

// Vasicek ZCB price P(0,T) and its derivative w.r.t. r0
struct Vasicek { double kappa, theta, sigma, r0; };

static double vasicekB(double kappa, double T) noexcept {
    return (1.0 - std::exp(-kappa * T)) / kappa;
}

static double vasicekP(const Vasicek& v, double T) noexcept {
    double kap2 = v.kappa * v.kappa, sig2 = v.sigma * v.sigma;
    double B = vasicekB(v.kappa, T);
    double A = std::exp((v.theta - sig2/(2*kap2))*(B - T) - sig2*B*B/(4*v.kappa));
    return A * std::exp(-B * v.r0);
}

// Vasicek ZCB option: right to receive ZCB at T_opt maturing at T_bond
double vasicekZCBOption(const Vasicek& v, double T_opt, double T_bond,
                        double K_zcb, bool call) noexcept {
    auto Ncdf = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    double B   = vasicekB(v.kappa, T_bond - T_opt);
    double sig2 = v.sigma * v.sigma;
    double sigma_p = v.sigma * std::sqrt((1 - std::exp(-2*v.kappa*T_opt))/(2*v.kappa)) * B;

    double Pt  = vasicekP(v, T_opt);    // P(0, T_opt)
    double Ps  = vasicekP(v, T_bond);   // P(0, T_bond)
    double h   = std::log(Ps / (Pt * K_zcb)) / sigma_p + 0.5 * sigma_p;

    if (call)
        return Ps * Ncdf(h) - K_zcb * Pt * Ncdf(h - sigma_p);
    else
        return K_zcb * Pt * Ncdf(sigma_p - h) - Ps * Ncdf(-h);
}

// Coupon bond call option via Jamshidian decomposition
// coupons[i] = coupon cash flow (including face at maturity), payment_times[i]
double couponBondCallJamshidian(const Vasicek& v, double T_opt, double K,
                                 const std::vector<double>& coupons,
                                 const std::vector<double>& times) {
    // Step 1: find r* such that sum_i coupon_i * P(r*, T_i) = K
    // Binary search over r*
    auto bondPriceAtR = [&](double r_star) {
        Vasicek vr = v; vr.r0 = r_star;
        double sum = 0;
        for (std::size_t i = 0; i < coupons.size(); ++i)
            sum += coupons[i] * vasicekP(vr, times[i]);
        return sum;
    };

    double lo = -0.5, hi = 1.0;
    for (int iter = 0; iter < 100; ++iter) {
        double mid = 0.5 * (lo + hi);
        (bondPriceAtR(mid) > K ? lo : hi) = mid;
    }
    double r_star = 0.5 * (lo + hi);

    // Step 2: compute strike K_i for each ZCB
    Vasicek vstar = v; vstar.r0 = r_star;
    double price = 0.0;
    for (std::size_t i = 0; i < coupons.size(); ++i) {
        double K_i = vasicekP(vstar, times[i]);
        price += coupons[i] * vasicekZCBOption(v, T_opt, times[i], K_i, true);
    }
    return price;
}`,
    explanation:
      "Jamshidian's decomposition is exact under affine term structure models (Vasicek, CIR) because bond prices are deterministic functions of the short rate — a single sufficient statistic. The critical rate r* is the short rate at which the coupon bond is exactly at-the-money; for r < r*, the bond is in-the-money (exercised). Each ZCB option is priced analytically, making the coupon bond option computation O(N) in the number of cash flows with no Monte Carlo required.",
  },
  {
    id: "cpp-20260617-b1-raii-socket",
    language: "cpp",
    title: "RAII UDP socket — zero-leak market data receiver",
    tag: "systems",
    code: `#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <cstring>
#include <cstdint>
#include <stdexcept>
#include <optional>
#include <span>

// RAII wrapper for a UDP multicast receive socket.
// Destructor guarantees ::close(fd_) even on exceptions.
// No manual cleanup needed in teardown paths.

class UDPReceiver {
    int fd_ = -1;

    void checkErr(int ret, const char* msg) {
        if (ret < 0) throw std::runtime_error(msg);
    }

public:
    struct Config {
        const char* mcast_group;  // e.g., "224.0.1.1"
        uint16_t    port;
        const char* iface;        // network interface address, or nullptr for default
    };

    explicit UDPReceiver(const Config& cfg) {
        fd_ = ::socket(AF_INET, SOCK_DGRAM, 0);
        checkErr(fd_, "socket");

        // SO_REUSEADDR: allows multiple processes on same host to bind same port
        int reuse = 1;
        checkErr(::setsockopt(fd_, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse)),
                 "setsockopt SO_REUSEADDR");

        sockaddr_in addr{};
        addr.sin_family      = AF_INET;
        addr.sin_port        = htons(cfg.port);
        addr.sin_addr.s_addr = htonl(INADDR_ANY);
        checkErr(::bind(fd_, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)), "bind");

        // Join multicast group
        ip_mreq mreq{};
        ::inet_pton(AF_INET, cfg.mcast_group, &mreq.imr_multiaddr);
        if (cfg.iface)
            ::inet_pton(AF_INET, cfg.iface, &mreq.imr_interface);
        else
            mreq.imr_interface.s_addr = htonl(INADDR_ANY);
        checkErr(::setsockopt(fd_, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq)),
                 "join multicast group");

        // Non-blocking: recvmsg returns EAGAIN immediately if no data
        // Set with fcntl(fd_, F_SETFL, O_NONBLOCK) if needed
    }

    ~UDPReceiver() noexcept {
        if (fd_ >= 0) ::close(fd_);   // always called even if constructor throws midway
    }

    UDPReceiver(const UDPReceiver&) = delete;
    UDPReceiver& operator=(const UDPReceiver&) = delete;
    UDPReceiver(UDPReceiver&& o) noexcept : fd_(o.fd_) { o.fd_ = -1; }

    // Returns bytes received, or 0 on timeout/EAGAIN
    int recv(std::span<std::byte> buf) noexcept {
        ssize_t n = ::recv(fd_, buf.data(), buf.size(), MSG_DONTWAIT);
        return (n < 0) ? 0 : static_cast<int>(n);
    }

    int fd() const noexcept { return fd_; }
};

// Usage:
// UDPReceiver rx{{"224.0.1.1", 5000, nullptr}};
// alignas(64) std::byte pkt[1500];
// while (true) { if (int n = rx.recv(pkt)) { /* parse n bytes */ } }`,
    explanation:
      "The RAII destructor guarantees that the file descriptor is closed and the multicast group is left even if an exception propagates through the stack — without RAII, a missed ::close() leaks the fd and keeps the multicast membership active until the process exits, potentially causing port conflicts and routing table bloat. The move constructor sets fd_ = -1 in the moved-from object so the destructor's close(-1) call is a no-op.",
  },
  {
    id: "cpp-20260617-b1-variadic-legs",
    language: "cpp",
    title: "Variadic template multi-leg order — aggregating heterogeneous order types",
    tag: "modern",
    code: `#include <tuple>
#include <utility>
#include <cstdint>
#include <numeric>
#include <type_traits>

// Multi-leg order (spread, straddle, box): combination of N heterogeneous legs.
// Variadic templates allow N legs of different types without runtime polymorphism.
// Each leg type implements price()/qty()/side() — checked by concept at instantiation.

struct LimitLeg  { double px; int qty; bool buy; double price() const { return px; }   int quantity() const { return qty; } bool isBuy() const { return buy; } };
struct MarketLeg { int qty; bool buy;            double price() const { return 0; }    int quantity() const { return qty; } bool isBuy() const { return buy; } };
struct StopLeg   { double trigger; int qty; bool buy; double price() const { return trigger; } int quantity() const { return qty; } bool isBuy() const { return buy; } };

template<typename... Legs>
class MultiLegOrder {
    std::tuple<Legs...> legs_;
    uint64_t            order_id_;

public:
    explicit MultiLegOrder(uint64_t id, Legs&&... legs)
        : legs_(std::forward<Legs>(legs)...), order_id_(id) {}

    // Net notional across all legs (sum of price * qty with sign)
    double netNotional() const {
        double total = 0.0;
        std::apply([&](const auto&... leg) {
            // Fold: adds each leg's signed notional
            ((total += leg.price() * leg.quantity() * (leg.isBuy() ? 1.0 : -1.0)), ...);
        }, legs_);
        return total;
    }

    // Net quantity (delta-equivalent: sum of signed quantities)
    int netQty() const {
        int total = 0;
        std::apply([&](const auto&... leg) {
            ((total += leg.quantity() * (leg.isBuy() ? 1 : -1)), ...);
        }, legs_);
        return total;
    }

    static constexpr int numLegs() { return sizeof...(Legs); }
    uint64_t orderId() const noexcept { return order_id_; }

    // Access individual leg at compile-time index
    template<int I>
    const auto& leg() const { return std::get<I>(legs_); }
};

// Factory function: deduces leg types automatically
template<typename... Legs>
auto makeSpread(uint64_t id, Legs&&... legs) {
    return MultiLegOrder<std::decay_t<Legs>...>(id, std::forward<Legs>(legs)...);
}

// Example: buy 100 AAPL limit + sell 100 GOOG market (spread order)
// auto spread = makeSpread(1001ULL,
//     LimitLeg{180.0, 100, true},    // leg 0: buy limit
//     MarketLeg{100, false});         // leg 1: sell market
// static_assert(spread.numLegs() == 2);
// auto& buy_leg = spread.leg<0>();`,
    explanation:
      "std::apply unpacks a tuple into function arguments at compile time, enabling a fold expression over the heterogeneous leg types without runtime dispatch. The fold expression `((total += ...), ...)` expands to one addition per leg type in the template parameter pack — all resolved at compile time, generating a flat sequence of adds with no loop overhead. This is the modern replacement for recursive template specialization.",
  },
  {
    id: "cpp-20260617-b1-fold-greeks",
    language: "cpp",
    title: "C++17 fold expressions — zero-overhead portfolio Greek summation",
    tag: "modern",
    code: `#include <type_traits>
#include <cstddef>

// C++17 fold expressions: apply a binary operator over a parameter pack.
// (pack op ...) = right fold:   e1 op (e2 op (...))
// (... op pack) = left fold:    ((e1 op e2) op ...)
// (init op ... op pack) = binary left fold with initial value
// All folds are expanded at compile time — zero function call overhead.

struct Greeks { double delta, gamma, vega, theta; };

// Sum Greeks from arbitrarily many positions: fold over parameter pack
template<typename... Gs>
Greeks sumGreeks(const Gs&... positions) {
    // Unary left fold with comma: calls accumulation for each Greek
    Greeks total{};
    ((total.delta += positions.delta,
      total.gamma += positions.gamma,
      total.vega  += positions.vega,
      total.theta += positions.theta), ...);
    return total;
}

// Weighted sum: fold over (weight, Greeks) pairs
template<typename... Args>
Greeks weightedGreeks(Args&&... pairs) {
    // pairs should be std::pair<double, Greeks> — compile-time checked
    Greeks total{};
    ((total.delta += pairs.first * pairs.second.delta,
      total.gamma += pairs.first * pairs.second.gamma,
      total.vega  += pairs.first * pairs.second.vega,
      total.theta += pairs.first * pairs.second.theta), ...);
    return total;
}

// Logical fold: any position exceeds risk limits
template<typename... Gs>
bool anyExceedsLimit(double delta_limit, const Gs&... positions) {
    // Unary left fold with ||: short-circuits as soon as one exceeds
    return ((std::abs(positions.delta) > delta_limit) || ...);
}

// Count: how many positions have positive gamma
template<typename... Gs>
std::size_t countLongGamma(const Gs&... positions) {
    // Fold with + over boolean expressions
    return ((positions.gamma > 0.0 ? 1UZ : 0UZ) + ...);
}

// Demo
void demo() {
    Greeks leg1{0.5, 0.02, 0.15, -0.05};
    Greeks leg2{-0.3, 0.01, 0.08, -0.03};
    Greeks leg3{0.8, 0.03, 0.22, -0.07};

    Greeks total = sumGreeks(leg1, leg2, leg3);
    // total.delta = 0.5 - 0.3 + 0.8 = 1.0, etc.

    bool risky = anyExceedsLimit(0.7, leg1, leg2, leg3);
    // risky = true (leg3.delta = 0.8 > 0.7)
}`,
    explanation:
      "Fold expressions evaluate parameter pack expansions at compile time into a single expression tree, which the optimizer then reduces to a flat sequence of add/compare instructions. The `((expr_per_element), ...)` pattern with the comma operator is the standard idiom for performing multiple side effects per element in a fold — the comma operator sequences left to right with defined behavior in a fold context. This achieves the same result as a for-loop over a variadic pack but without iterator state or loop overhead.",
  },
  {
    id: "cpp-20260617-b1-allocator-traits",
    language: "cpp",
    title: "std::allocator_traits — generic container memory policy abstraction",
    tag: "modern",
    code: `#include <memory>
#include <cstddef>
#include <cstdint>
#include <new>
#include <limits>

// std::allocator_traits: standardised interface for all allocators.
// Provides default implementations for optional allocator methods.
// Custom containers should use allocator_traits instead of calling
// alloc.allocate() directly — traits fill in missing methods automatically.

// Custom pool allocator for order objects (cache-line aligned)
template<typename T>
struct OrderAllocator {
    using value_type = T;
    using size_type  = std::size_t;

    // Stateless allocator: all instances are equivalent
    OrderAllocator() noexcept = default;
    template<typename U> OrderAllocator(const OrderAllocator<U>&) noexcept {}

    [[nodiscard]] T* allocate(std::size_t n) {
        if (n > std::numeric_limits<std::size_t>::max() / sizeof(T))
            throw std::bad_alloc{};
        // Cache-line aligned allocation: prevents false sharing between elements
        void* p = ::operator new(n * sizeof(T), std::align_val_t{64});
        if (!p) throw std::bad_alloc{};
        return static_cast<T*>(p);
    }

    void deallocate(T* p, [[maybe_unused]] std::size_t n) noexcept {
        ::operator delete(p, std::align_val_t{64});
    }

    // allocator_traits derives these automatically if not provided:
    // pointer, const_pointer, reference, const_reference (C++11)
    // rebind<U>::other — required for node-based containers
    template<typename U> struct rebind { using other = OrderAllocator<U>; };
};

template<typename T, typename U>
bool operator==(const OrderAllocator<T>&, const OrderAllocator<U>&) noexcept { return true; }

// Using allocator_traits to write a generic container helper
template<typename Alloc>
void constructN(Alloc& alloc, typename std::allocator_traits<Alloc>::pointer p,
                std::size_t n) {
    using Traits = std::allocator_traits<Alloc>;
    for (std::size_t i = 0; i < n; ++i)
        Traits::construct(alloc, p + i);   // calls alloc.construct() or placement new
}

template<typename Alloc>
void destroyN(Alloc& alloc, typename std::allocator_traits<Alloc>::pointer p,
              std::size_t n) noexcept {
    using Traits = std::allocator_traits<Alloc>;
    for (std::size_t i = 0; i < n; ++i)
        Traits::destroy(alloc, p + i);     // calls alloc.destroy() or explicit destructor
}

// std::vector<Order, OrderAllocator<Order>>: all allocations are 64-byte aligned
// std::list<Order, OrderAllocator<Order>>: rebind<ListNode<Order>> is used automatically`,
    explanation:
      "std::allocator_traits is an indirection layer that checks whether the allocator provides each method and substitutes a default if it doesn't — for example, if `Alloc::construct` is absent, `allocator_traits::construct` falls back to placement new. This lets custom allocators provide only the minimum interface (allocate + deallocate) while still working with all standard containers. The rebind mechanism allows node-based containers (std::list, std::map) to allocate their internal node types through the same allocator.",
  },
  {
    id: "cpp-20260617-b1-cds-cs01",
    language: "cpp",
    title: "CDS CS01 — credit spread sensitivity via hazard rate bump",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <numeric>

// CDS pricing: protection leg PV vs premium leg PV.
// Flat hazard rate model: survival probability S(T) = exp(-lambda*T).
// CS01: change in NPV for +1bp parallel shift in credit spread.
// Convention: spread s ≈ (1-R)*lambda for small lambda, R = recovery rate.

struct CDSResult { double npv, duration, cs01; };

// Build discrete survival and default probability curves
// lambda: flat hazard rate; times: payment/protection times
static double survivalProb(double lambda, double T) noexcept {
    return std::exp(-lambda * T);
}

CDSResult priceCDS(double notional, double coupon,  // par coupon in decimal (e.g., 0.05 = 5%)
                   double lambda,                    // hazard rate (≈ spread / (1-R))
                   double recovery,                  // LGD = 1 - recovery
                   double r,                         // risk-free rate (flat)
                   int tenor_years,                  // CDS tenor (1-10)
                   int payments_per_year = 4) {      // quarterly payments
    int N = tenor_years * payments_per_year;
    double dt = 1.0 / payments_per_year;

    // Premium leg: sum of coupon × accrual × survival probability × discount factor
    double premium_pv = 0.0;
    for (int i = 1; i <= N; ++i) {
        double T_i = i * dt;
        double df_i = std::exp(-r * T_i);
        double sp_i = survivalProb(lambda, T_i);
        premium_pv += coupon * notional * dt * sp_i * df_i;
    }

    // Protection leg: expected PV of (1-R)*notional on default
    double protection_pv = 0.0;
    for (int i = 1; i <= N; ++i) {
        double T_prev = (i - 1) * dt, T_i = i * dt;
        double df_mid  = std::exp(-r * 0.5 * (T_prev + T_i));   // mid-period discount
        double dp      = survivalProb(lambda, T_prev) - survivalProb(lambda, T_i);
        protection_pv += (1.0 - recovery) * notional * dp * df_mid;
    }

    double npv = protection_pv - premium_pv;   // from protection buyer perspective

    // Risky duration (PV01): sum of df * survival * dt = dPremiumLeg / d_coupon
    double duration = premium_pv / (coupon * notional);

    // CS01: bump lambda by +1bp = 0.0001 and re-price
    double lambda_up = lambda + 0.0001 / (1.0 - recovery);   // spread += 1bp → lambda bumped
    double prot_up = 0.0, prem_up = 0.0;
    for (int i = 1; i <= N; ++i) {
        double T_prev = (i-1)*dt, T_i = i*dt;
        double sp_u = survivalProb(lambda_up, T_i);
        double df_i = std::exp(-r * T_i);
        prem_up += coupon * notional * dt * sp_u * df_i;
        double df_m = std::exp(-r * 0.5*(T_prev+T_i));
        prot_up += (1.0-recovery)*notional*(survivalProb(lambda_up,T_prev)-sp_u)*df_m;
    }
    double cs01 = (prot_up - prem_up) - npv;   // change in NPV for +1bp spread

    return {npv, duration, cs01};
}`,
    explanation:
      "CS01 (Credit Spread 01) is the CDS analog of DV01: the change in mark-to-market per basis point parallel shift in the credit curve. A protection buyer has negative CS01 (NPV rises when spreads widen, because the protection becomes more valuable). The flat-hazard-rate model is exact for single-name CDS on flat curves; for actual trading books, a bootstrapped piecewise-constant hazard rate curve is derived from multiple CDS maturities on the same issuer.",
  },
];
