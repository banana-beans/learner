import type { Snippet } from "./types";

export const cppSnippets20260614B1: Snippet[] = [
  {
    id: "cpp-20260614-b1-spsc-ring",
    language: "cpp",
    title: "SPSC ring buffer — lock-free single-producer single-consumer queue",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Single-producer single-consumer (SPSC) ring buffer — no mutex, no CAS.
// Producer owns tail_; consumer owns head_. They never race on the same variable.
// The acquire/release pair on load/store creates a happens-before between
// the write to buf_ and the subsequent read, without a full fence.
// Capacity must be power-of-2 for the bitmask modulo trick.

template<typename T, std::size_t N>
class SPSCQueue {
    static_assert((N & (N - 1)) == 0, "N must be power of 2");
    static constexpr std::size_t MASK = N - 1;

    alignas(64) std::atomic<std::size_t> tail_{0};  // written by producer only
    alignas(64) std::atomic<std::size_t> head_{0};  // written by consumer only
    std::array<T, N> buf_{};

public:
    // Producer: returns false if the ring is full
    bool push(const T& val) noexcept {
        const std::size_t t = tail_.load(std::memory_order_relaxed);
        const std::size_t h = head_.load(std::memory_order_acquire); // sync: see consumer pops
        if (t - h >= N) return false;           // full
        buf_[t & MASK] = val;
        tail_.store(t + 1, std::memory_order_release);  // makes val visible to consumer
        return true;
    }

    // Consumer: returns empty optional if the ring is empty
    std::optional<T> pop() noexcept {
        const std::size_t h = head_.load(std::memory_order_relaxed);
        const std::size_t t = tail_.load(std::memory_order_acquire); // sync: see producer push
        if (h == t) return std::nullopt;        // empty
        T val = buf_[h & MASK];
        head_.store(h + 1, std::memory_order_release);
        return val;
    }

    std::size_t size() const noexcept {
        return tail_.load(std::memory_order_acquire)
             - head_.load(std::memory_order_acquire);
    }
    bool empty() const noexcept { return size() == 0; }
};

// Usage: market data thread (producer) → strategy thread (consumer)
// SPSCQueue<double, 4096> ticks;
// Producer: ticks.push(100.25);
// Consumer: if (auto v = ticks.pop()) processPrice(*v);`,
    explanation:
      "The SPSC queue needs no CAS because the two threads write to disjoint variables (tail_ vs head_) — only a store/load pair with release/acquire semantics is required to prevent the CPU from reordering the data write after the index update. Placing tail_ and head_ on separate 64-byte cache lines eliminates false sharing, which would otherwise cause each push or pop to invalidate the other thread's L1 line even though they access different fields.",
  },
  {
    id: "cpp-20260614-b1-pmr-pool",
    language: "cpp",
    title: "std::pmr pool_resource — arena allocation for burst order messages",
    tag: "performance",
    code: `#include <memory_resource>
#include <array>
#include <cstddef>
#include <cstdint>

// std::pmr::pool_resource: a pool allocator backed by an upstream resource.
// Allocating from a pool costs ~5 ns vs ~100 ns for malloc — critical for
// objects constructed at message-arrival frequency (100 k–10 M/sec).

struct OrderMsg {
    std::uint64_t order_id;
    double        price;
    int           qty;
    bool          buy;
    char          symbol[8];
};

class OrderArena {
    // 1 MB on-stack buffer: avoids a heap allocation for the pool itself.
    // Use alignas(64) to guarantee the pool start is cache-aligned.
    alignas(64) std::array<std::byte, 1 << 20> buf_;
    std::pmr::monotonic_buffer_resource mono_{buf_.data(), buf_.size()};
    std::pmr::unsynchronized_pool_resource pool_{
        std::pmr::pool_options{/*max_blocks_per_chunk=*/512,
                               /*largest_required_pool_block=*/sizeof(OrderMsg)},
        &mono_};

public:
    OrderMsg* alloc() {
        void* p = pool_.allocate(sizeof(OrderMsg), alignof(OrderMsg));
        return ::new(p) OrderMsg{};
    }

    void dealloc(OrderMsg* p) noexcept {
        p->~OrderMsg();
        pool_.deallocate(p, sizeof(OrderMsg), alignof(OrderMsg));
    }

    // End of trading day: release the entire monotonic buffer at once — O(1)
    void reset() { mono_.release(); }
};

// pmr containers: std::pmr::vector uses the pool for its internal storage.
// void batchAlloc(OrderArena& arena) {
//     std::pmr::vector<OrderMsg> batch(&arena.pool_);
//     batch.reserve(1000);
//     // ... all allocations come from the arena, no individual malloc calls
// }`,
    explanation:
      "std::pmr::unsynchronized_pool_resource maintains per-size-class free lists and recycles deallocated blocks — unlike the monotonic resource, individual deallocs are O(1) and return memory to the pool for reuse within the same trading session. The upstream monotonic_buffer_resource provides bulk memory from a stack array, so the pool never calls the system allocator after the first chunk, making allocation latency deterministic and immune to heap fragmentation.",
  },
  {
    id: "cpp-20260614-b1-variant-overload",
    language: "cpp",
    title: "std::variant + overload pattern — zero-overhead heterogeneous message dispatch",
    tag: "modern",
    code: `#include <variant>
#include <cstdint>
#include <cstdio>

// Overload pattern (C++17): inherit multiple lambdas into a single type
// whose operator() is overloaded on each message type.
// std::visit dispatches to the matching overload via a compile-time jump table —
// no virtual calls, no dynamic_cast, no type tags.

template<typename... Ts>
struct Overload : Ts... { using Ts::operator()...; };

// C++17 deduction guide (implicit in C++20)
template<typename... Ts>
Overload(Ts...) -> Overload<Ts...>;

struct NewOrder    { std::uint64_t id; double price; int qty; bool buy; };
struct CancelOrder { std::uint64_t id; };
struct ModifyOrder { std::uint64_t id; double new_price; int new_qty; };
struct Heartbeat   { std::uint64_t seq_no; };

using Message = std::variant<NewOrder, CancelOrder, ModifyOrder, Heartbeat>;

// Visitor: one lambda per message type — exhaustive (compiler enforces completeness)
auto handler = Overload{
    [](const NewOrder& o) {
        std::printf("NEW  id=%lu side=%c qty=%d @ %.2f\\n",
                    o.id, o.buy ? 'B' : 'S', o.qty, o.price);
    },
    [](const CancelOrder& o) {
        std::printf("CXL  id=%lu\\n", o.id);
    },
    [](const ModifyOrder& o) {
        std::printf("MOD  id=%lu new_price=%.2f qty=%d\\n",
                    o.id, o.new_price, o.new_qty);
    },
    [](const Heartbeat& h) {
        std::printf("HB   seq=%lu\\n", h.seq_no);
    },
};

void dispatch(const Message& msg) {
    std::visit(handler, msg);   // O(1); compiles to an indirect jump
}

// Alternatively: stateless visitor via generic lambda
auto sizer = Overload{
    [](const NewOrder&)    { return sizeof(NewOrder); },
    [](const CancelOrder&) { return sizeof(CancelOrder); },
    [](const ModifyOrder&) { return sizeof(ModifyOrder); },
    [](const Heartbeat&)   { return sizeof(Heartbeat); },
};`,
    explanation:
      "std::visit on a std::variant compiles to an indexed jump table (one pointer per alternative) rather than a chain of if/else or virtual dispatch — for 4 message types, the dispatch is a single indirect branch instruction. The Overload pattern makes the visitor self-contained and trivially extensible: adding a new message type forces a compile error at every std::visit site that lacks the new handler, eliminating the silent fall-through bugs of switch statements.",
  },
  {
    id: "cpp-20260614-b1-sfinae-numeric",
    language: "cpp",
    title: "SFINAE enable_if — compile-time floating-point vs integral dispatch",
    tag: "modern",
    code: `#include <type_traits>
#include <cmath>
#include <complex>

// SFINAE (Substitution Failure Is Not An Error): enable_if removes a function
// template from the overload set when the condition is false.
// Cleaner in C++20 via Concepts, but enable_if still dominates C++17 codebases.

// Only available for floating-point types
template<typename T, std::enable_if_t<std::is_floating_point_v<T>, int> = 0>
T bsDelta(T S, T K, T r, T sigma, T tau) noexcept {
    if (tau <= T{0}) return S > K ? T{1} : T{0};
    T sqt = std::sqrt(tau);
    T d1  = (std::log(S / K) + (r + T{0.5} * sigma * sigma) * tau) / (sigma * sqt);
    return T{0.5} * std::erfc(-d1 / std::sqrt(T{2}));   // N(d1) via erfc
}

// Separate overload for integer types (floor delta for digital options)
template<typename T, std::enable_if_t<std::is_integral_v<T>, int> = 0>
T bsDelta(T S, T K, T /*r*/, T /*sigma*/, T /*tau*/) noexcept {
    return (S > K) ? T{1} : T{0};  // simplified: digital payoff
}

// Type predicate for complex<U> types
template<typename T> struct is_complex_type : std::false_type {};
template<typename U> struct is_complex_type<std::complex<U>> : std::true_type {};
template<typename T>
inline constexpr bool is_complex_v = is_complex_type<T>::value;

// Enable only for complex types (e.g., Carr-Madan Fourier pricing)
template<typename T, std::enable_if_t<is_complex_v<T>, int> = 0>
T fourierCharFn(T u, double mu, double sigma2, double T_) {
    using U = typename T::value_type;
    // log-characteristic function of GBM: exp((i*u*mu - 0.5*u^2*sigma^2)*T)
    T iu{U{0}, static_cast<U>(1)};   // i = sqrt(-1)
    return std::exp((iu * u * U(mu) - U(0.5) * u * u * U(sigma2)) * U(T_));
}

// Safe division: floating → epsilon guard; integral → zero-check
template<typename T, std::enable_if_t<std::is_floating_point_v<T>, int> = 0>
T safeDiv(T a, T b, T def = T{0}) noexcept {
    return std::abs(b) > T{1e-14} ? a / b : def;
}

template<typename T, std::enable_if_t<std::is_integral_v<T>, int> = 0>
T safeDiv(T a, T b, T def = T{0}) noexcept {
    return b != T{0} ? a / b : def;
}`,
    explanation:
      "The enable_if idiom uses the default non-type template parameter trick (= 0) so that both overloads can co-exist without ambiguity — when one set's condition is false, it silently falls out of the overload set rather than causing a hard error. The pattern is especially valuable in quant libraries where the same formula must work with float, double, long double, and dual-number autodiff types: the enable_if constraint documents which numeric category each overload targets.",
  },
  {
    id: "cpp-20260614-b1-branch-hints",
    language: "cpp",
    title: "[[likely]] / [[unlikely]] branch hints — branch predictor annotation in the hot path",
    tag: "performance",
    code: `#include <cstdint>
#include <cmath>
#include <limits>

// [[likely]] / [[unlikely]] (C++20 attributes): tell the branch predictor
// which path is hot. The compiler reorders basic blocks to minimise
// branch taken penalties in the likely path.
// On x86: misprediction costs ~15-20 cycles; useful when branch rate is not
// predictable from dynamic history (e.g., incoming message type).

// FIX message dispatcher: execution reports >> cancel acks >> heartbeats
inline void dispatchFIX(std::uint8_t msg_type, const void* data) noexcept {
    if (msg_type == '8') [[likely]] {        // ExecutionReport: 90%+ of messages
        // process fill...
        (void)data;
        return;
    }
    if (msg_type == 'D') [[unlikely]] {      // NewOrderSingle: rare in downstream feed
        return;
    }
    if (msg_type == '0') [[unlikely]] {      // Heartbeat: periodic, not latency-sensitive
        return;
    }
    // Other rare admin messages
}

// Price validation: NaN and negative are exceptional
inline double logReturn(double p0, double p1) noexcept {
    if (p0 > 0.0 && p1 > 0.0) [[likely]]
        return std::log(p1 / p0);
    [[unlikely]];                            // standalone attribute on a null statement
    return 0.0;
}

// Pre-C++20 equivalent using __builtin_expect
inline bool isMarketOpen(std::uint32_t ts_sec) noexcept {
    constexpr std::uint32_t OPEN  = 9 * 3600 + 30 * 60;
    constexpr std::uint32_t CLOSE = 16 * 3600;
    // Market is open ~6.5 hours/day — true is more likely during trading hours
    return __builtin_expect(ts_sec >= OPEN && ts_sec < CLOSE, 1);
}

// Order book update: bid updates are ~60% of all updates — hint the predictor
inline void applyUpdate(double* bids, double* asks,
                         int level, double price, bool is_bid) noexcept {
    if (is_bid) [[likely]]
        bids[level] = price;
    else
        asks[level] = price;
}`,
    explanation:
      "[[likely]] and [[unlikely]] move the taken-branch penalty to the cold path: the compiler places the likely code sequentially in the instruction stream (no branch needed on the fast path) and jumps to the unlikely code that may be in a separate cold section. On Skylake and later x86 CPUs, the static prediction from the compiler's block ordering matters most for irregular branches that the CPU's dynamic history table cannot predict from past patterns.",
  },
  {
    id: "cpp-20260614-b1-false-sharing",
    language: "cpp",
    title: "Cache line padding — prevent false sharing between producer/consumer threads",
    tag: "performance",
    code: `#include <atomic>
#include <cstdint>
#include <cstddef>

// False sharing: two threads write to different variables that happen to
// occupy the same 64-byte cache line. Every write from thread A invalidates
// the entire line in thread B's L1, stalling B for ~40-100 cycles.
// Fix: pad each hot per-thread variable to its own cache line with alignas(64).

// BAD: head_ and tail_ share a cache line; every push/pop invalidates the peer's L1.
struct BadRingMeta {
    std::atomic<std::uint32_t> head_;   // consumer writes
    std::atomic<std::uint32_t> tail_;   // producer writes — on the same cache line!
};

// GOOD: each counter on its own 64-byte cache line.
struct alignas(64) ProducerState {
    std::atomic<std::uint64_t> tail{0};
    // Pad to exactly 64 bytes so the next field starts on a new line.
    char _pad[64 - sizeof(std::atomic<std::uint64_t>)];
};

struct alignas(64) ConsumerState {
    std::atomic<std::uint64_t> head{0};
    char _pad[64 - sizeof(std::atomic<std::uint64_t>)];
};

// Per-thread statistics: each ThreadStats instance on its own cache line
// so that threads writing to their own counters don't invalidate others.
struct alignas(std::hardware_destructive_interference_size) ThreadStats {
    std::uint64_t orders_sent     = 0;
    std::uint64_t orders_filled   = 0;
    std::uint64_t orders_rejected = 0;
    std::uint64_t latency_sum_ns  = 0;
    // Remaining padding handled automatically by alignas — struct size = 1 cache line.
};

// Array: each element is one cache line — no false sharing across threads.
inline constexpr std::size_t MAX_THREADS = 64;
static ThreadStats thread_stats[MAX_THREADS];

inline void recordFill(int tid, std::uint64_t latency_ns) noexcept {
    // Safe: only thread tid writes to thread_stats[tid]
    ++thread_stats[tid].orders_sent;
    ++thread_stats[tid].orders_filled;
    thread_stats[tid].latency_sum_ns += latency_ns;
}`,
    explanation:
      "std::hardware_destructive_interference_size (C++17) returns the actual L1 cache line size of the target platform (typically 64 bytes on x86, 128 bytes on Apple Silicon) — using the compile-time constant instead of the magic number 64 ensures the padding is correct on all deployment targets. For a ring buffer where the producer and consumer each run on dedicated cores at 10 M msg/s, false sharing between head and tail creates ~400 ns of spurious coherence traffic per message; separating them eliminates this entirely.",
  },
  {
    id: "cpp-20260614-b1-acquire-release",
    language: "cpp",
    title: "Acquire/release memory ordering — seqlock for NBBO quote updates",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <cstddef>

// Memory ordering in C++20:
//   relaxed:  atomicity only — no happens-before, no synchronisation.
//   release (store): all preceding writes are visible to any thread that
//              does an acquire load of the same atomic.
//   acquire (load): sees all writes from the matching release store.
//   seq_cst:  release + acquire + global total order (most expensive: ~40 cycles).
//
// Seqlock: writer makes seq odd before writing (signals in-progress),
//          then even after. Reader retries if seq changes mid-read.
//          One writer / many readers — no reader contention.

struct Quote { double bid; double ask; std::int64_t ts_ns; };

class SeqLock {
    alignas(64) std::atomic<std::uint64_t> seq_{0};
    Quote data_{};

public:
    // Writer (single thread): increment seq to odd, write, increment to even.
    void write(const Quote& q) noexcept {
        std::uint64_t s = seq_.load(std::memory_order_relaxed);
        seq_.store(s + 1, std::memory_order_release);  // odd: write in progress
        // All CPU stores to data_ happen AFTER this release store.
        data_ = q;
        seq_.store(s + 2, std::memory_order_release);  // even: write complete
    }

    // Reader (multiple threads): retry if seq changes between the two reads.
    Quote read() const noexcept {
        while (true) {
            std::uint64_t s0 = seq_.load(std::memory_order_acquire); // sync
            if (s0 & 1u) { /* writer active */ continue; }
            Quote q = data_;
            std::atomic_thread_fence(std::memory_order_acquire); // prevent reorder past seq_ load
            std::uint64_t s1 = seq_.load(std::memory_order_relaxed);
            if (s0 == s1) return q;   // consistent read
            // Writer modified data mid-read: retry
        }
    }
};

// relaxed vs seq_cst performance guide:
//   seq_cst store : ~40 cycles (MFENCE on x86)
//   release store : ~5 cycles  (MOV — x86 TSO makes this free)
//   acquire load  : ~5 cycles  (MOV — x86 TSO makes this free)
//   relaxed store : ~4 cycles
// On ARM/POWER (weaker memory models), acquire/release compile to fences.`,
    explanation:
      "On x86 (TSO memory model), release stores and acquire loads compile to plain MOV instructions because x86 hardware already prevents store-load reordering — the only seq_cst penalty is the MFENCE instruction needed to prevent store-store reordering across multiple atomics. On ARM (weakly ordered), release and acquire compile to STLR/LDAR instructions, making seq_cst significantly more expensive and making explicit release/acquire preferable for inner loops.",
  },
  {
    id: "cpp-20260614-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson PDE solver — second-order implicit FD scheme for BS equation",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Black-Scholes PDE in log-price coordinates (x = ln S):
// dV/dt = 0.5*sigma^2*d^2V/dx^2 + (r - 0.5*sigma^2)*dV/dx - r*V
// Crank-Nicolson: average of explicit (t) and implicit (t+dt) finite differences.
// O(dt^2, dx^2) accuracy; unconditionally stable (unlike explicit Euler).
// Tridiagonal system solved with Thomas algorithm in O(N) per time step.

static std::vector<double> thomas(std::vector<double> a,   // sub-diag
                                   std::vector<double> b,   // main diag
                                   std::vector<double> c,   // super-diag
                                   std::vector<double> d) { // RHS
    int n = static_cast<int>(d.size());
    for (int i = 1; i < n; ++i) {
        double w = a[i] / b[i-1];
        b[i] -= w * c[i-1];
        d[i] -= w * d[i-1];
    }
    std::vector<double> x(n);
    x[n-1] = d[n-1] / b[n-1];
    for (int i = n-2; i >= 0; --i)
        x[i] = (d[i] - c[i] * x[i+1]) / b[i];
    return x;
}

double crankNicolsonCall(double S0, double K, double r, double sigma, double T,
                          int M = 200, int N = 100) {
    double x_lo = std::log(S0 / K) - 4.0 * sigma * std::sqrt(T);
    double x_hi = std::log(S0 / K) + 4.0 * sigma * std::sqrt(T);
    double dx = (x_hi - x_lo) / M;
    double dt = T / N;

    // x-grid  (log S/K values)
    std::vector<double> x(M + 1);
    for (int i = 0; i <= M; ++i) x[i] = x_lo + i * dx;

    // Initial condition at maturity: V = max(K*e^x - K, 0)
    std::vector<double> V(M + 1);
    for (int i = 0; i <= M; ++i)
        V[i] = std::max(K * (std::exp(x[i]) - 1.0), 0.0);

    double a_coef =  0.25 * dt * (sigma*sigma/(dx*dx) - (r - 0.5*sigma*sigma)/dx);
    double b_coef = -0.5  * dt * (sigma*sigma/(dx*dx) + r);
    double c_coef =  0.25 * dt * (sigma*sigma/(dx*dx) + (r - 0.5*sigma*sigma)/dx);

    int inner = M - 1;
    std::vector<double> a_lo(inner, -a_coef);
    std::vector<double> b_im(inner, 1.0 - b_coef);  // implicit diagonal
    std::vector<double> c_up(inner, -c_coef);

    for (int step = 0; step < N; ++step) {
        std::vector<double> rhs(inner);
        for (int i = 1; i <= inner; ++i)
            rhs[i-1] = a_coef*V[i-1] + (1.0 + b_coef)*V[i] + c_coef*V[i+1];
        // Boundary: left = 0 (far OTM), right = S - K*e^{-r*tau}
        double tau = (step + 1) * dt;
        rhs[inner-1] += c_coef * (K * std::exp(x_hi) - K * std::exp(-r * tau));

        auto Vn = thomas(a_lo, b_im, c_up, rhs);
        for (int i = 1; i <= inner; ++i) V[i] = Vn[i-1];
    }

    // Interpolate V at x = 0 (i.e., S = K)
    int idx = static_cast<int>(-x_lo / dx);
    idx = std::clamp(idx, 0, M - 1);
    double frac = (0.0 - x[idx]) / dx;
    return K * std::max(V[idx] * (1.0 - frac) + V[idx+1] * frac, 0.0);
}`,
    explanation:
      "Crank-Nicolson averages the spatial operator at the current and next time levels, producing a tridiagonal implicit system — the Thomas algorithm solves it in O(M) operations versus O(M²) for Gaussian elimination. The key advantage over explicit Euler is unconditional stability: the CN scheme is stable for any dt/dx² ratio, allowing large time steps (N = 100 for a year is typical), whereas explicit Euler requires dt < dx²/sigma² (the CFL condition), which forces N ~ 10 000 steps for typical grid sizes.",
  },
  {
    id: "cpp-20260614-b1-nelson-siegel",
    language: "cpp",
    title: "Nelson-Siegel yield curve — OLS fit of 3-factor parametric model",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <stdexcept>

// Nelson-Siegel (1987): y(tau) = beta0
//   + beta1 * (1 - e^{-tau/lambda}) / (tau/lambda)
//   + beta2 * [(1 - e^{-tau/lambda}) / (tau/lambda) - e^{-tau/lambda}]
// beta0: long-run level; beta1: slope (short-end tilt); beta2: curvature (hump).
// For fixed lambda, the model is LINEAR in (beta0, beta1, beta2): use OLS.
// Grid-search lambda over [0.5, 5.0] to find the global minimum of SSE.

struct NSParams { double beta0, beta1, beta2, lambda; };

double nsYield(double tau, const NSParams& p) noexcept {
    if (tau < 1e-8) return p.beta0 + p.beta1;
    double lt   = tau / p.lambda;
    double elt  = std::exp(-lt);
    double f1   = (1.0 - elt) / lt;     // factor 1: slope loading
    double f2   = f1 - elt;             // factor 2: curvature loading
    return p.beta0 + p.beta1 * f1 + p.beta2 * f2;
}

// OLS for fixed lambda: solve (X'X) beta = X'y for [beta0, beta1, beta2]
static NSParams ols3(const std::vector<double>& tau,
                      const std::vector<double>& y, double lam) {
    double A[3][3] = {}, b[3] = {};
    for (std::size_t i = 0; i < tau.size(); ++i) {
        double lt  = tau[i] / lam;
        double elt = std::exp(-lt);
        double f1  = (lt > 1e-8) ? (1.0 - elt) / lt : 1.0;
        double phi[3] = {1.0, f1, f1 - elt};
        for (int r = 0; r < 3; ++r) {
            b[r] += phi[r] * y[i];
            for (int c = 0; c < 3; ++c) A[r][c] += phi[r] * phi[c];
        }
    }
    // Gaussian elimination
    for (int p = 0; p < 3; ++p) {
        for (int row = p+1; row < 3; ++row) {
            double f = A[row][p] / A[p][p];
            for (int c = p; c < 3; ++c) A[row][c] -= f * A[p][c];
            b[row] -= f * b[p];
        }
    }
    double coef[3];
    for (int r = 2; r >= 0; --r) {
        coef[r] = b[r];
        for (int c = r+1; c < 3; ++c) coef[r] -= A[r][c] * coef[c];
        coef[r] /= A[r][r];
    }
    return {coef[0], coef[1], coef[2], lam};
}

// Fit NS by searching lambda in [0.5, 5.0]
NSParams fitNelsonSiegel(const std::vector<double>& tau,
                          const std::vector<double>& yields,
                          int lambda_steps = 50) {
    double best_sse = 1e30;
    NSParams best{};
    for (int k = 0; k <= lambda_steps; ++k) {
        double lam = 0.5 + (5.0 - 0.5) * k / lambda_steps;
        NSParams p = ols3(tau, yields, lam);
        double sse = 0;
        for (std::size_t i = 0; i < tau.size(); ++i) {
            double e = nsYield(tau[i], p) - yields[i];
            sse += e * e;
        }
        if (sse < best_sse) { best_sse = sse; best = p; }
    }
    return best;
}

double nsDf(double tau, const NSParams& p) noexcept {
    return std::exp(-nsYield(tau, p) * tau);
}`,
    explanation:
      "Nelson-Siegel is globally identified for fixed lambda because the three loading functions (1, f1, f2) form a basis for level, slope, and curvature — the three principal components that empirically explain 99%+ of yield curve variation. Grid-searching lambda is standard: the curvature factor f2 reaches its maximum at tau = lambda (the peak of the hump), so lambda is chosen to match where the hump appears in the observed data (typically 2-4 years for the EUR swap curve).",
  },
  {
    id: "cpp-20260614-b1-variance-swap",
    language: "cpp",
    title: "Variance swap replication — Demeterfi-Derman log-contract static replication",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>
#include <vector>
#include <functional>

// Variance swap: pays N * (sigma_realised^2 - K_var) at expiry.
// Fair variance K_var via static replication (Demeterfi-Derman-Kamal-Zou 1999):
// K_var = (2/T) * [ integral_{0}^{F} P(K)/K^2 dK + integral_{F}^{inf} C(K)/K^2 dK ]
//       + correction for discreteness: log(F/S) - (F/S - 1)
// This is model-free: only market call/put prices are needed.

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrtpi * std::numbers::sqrt2);
}
static double bsCall(double S, double K, double r, double sig, double T) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sig*sig)*T) / (sig*sqT);
    double d2  = d1 - sig * sqT;
    return S * Phi(d1) - K * std::exp(-r*T) * Phi(d2);
}
static double bsPut(double S, double K, double r, double sig, double T) noexcept {
    return bsCall(S, K, r, sig, T) - S + K * std::exp(-r*T);
}

struct VarSwapResult {
    double K_var;  // fair variance (annualised)
    double K_vol;  // sqrt(K_var) — the fair vol strike quoted in practice
};

// Use a market-provided vol surface (or flat smile for illustration)
VarSwapResult varSwapFair(double S, double r, double T,
                           std::function<double(double K)> sigma_fn,
                           int N = 300, double n_sigma = 3.0) {
    double sig_atm = sigma_fn(S);
    double F       = S * std::exp(r * T);
    double K_lo    = F * std::exp(-n_sigma * sig_atm * std::sqrt(T));
    double K_hi    = F * std::exp( n_sigma * sig_atm * std::sqrt(T));
    double dK      = (K_hi - K_lo) / N;

    double integral = 0.0;
    for (int i = 0; i < N; ++i) {
        double K   = K_lo + (i + 0.5) * dK;
        double sig = sigma_fn(K);
        double price = (K <= F) ? bsPut(S, K, r, sig, T)
                                : bsCall(S, K, r, sig, T);
        integral += price / (K * K) * dK;
    }

    // Model-free correction (accounts for the difference between log-forward
    // and arithmetic forward in the replication)
    double corr  = std::log(F / S) - (F / S - 1.0);
    double K_var = (2.0 / T) * (integral + corr);
    return {std::max(K_var, 0.0), std::sqrt(std::max(K_var, 0.0))};
}`,
    explanation:
      "The log-contract replication is model-free: the weights 2/K² ensure that a static portfolio of European options across all strikes exactly replicates the variance swap payoff under any diffusion model. When using an implied vol surface with a skew, the fair variance K_var exceeds ATM implied variance σ²_ATM because the negative skew (puts richer than calls) causes OTM put prices to be elevated, increasing the left-side integral — this is why variance swap strikes consistently exceed ATM vol in equity markets.",
  },
  {
    id: "cpp-20260614-b1-heston-mc",
    language: "cpp",
    title: "Heston MC — correlated stock and variance paths with full-truncation scheme",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Heston (1993) stochastic vol model:
//   dS/S = r dt + sqrt(V) dW_S
//   dV   = kappa*(theta - V) dt + xi*sqrt(V) dW_V
//   Corr(dW_S, dW_V) = rho
// Full-truncation (FT) discretisation: clamp V to zero before sqrt()
// to handle the boundary crossing problem. More accurate than reflection.
// Antithetic paths halve variance at no extra function evaluations.

struct HestonP { double kappa, theta, xi, rho, V0; };

double hestonCallMC(double S0, double K, double r, double T,
                     const HestonP& h,
                     int N = 200, int paths = 50000, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt    = T / N;
    double sdt   = std::sqrt(dt);
    double disc  = std::exp(-r * T);
    double rho2  = std::sqrt(1.0 - h.rho * h.rho);  // orthogonal component

    double sum = 0.0;
    for (int p = 0; p < paths / 2; ++p) {
        double S[2] = {S0, S0};
        double V[2] = {h.V0, h.V0};

        for (int t = 0; t < N; ++t) {
            double Z1 = nd(rng), Z2 = nd(rng);
            // Correlated increments: dW_S = Z1, dW_V = rho*Z1 + sqrt(1-rho^2)*Z2
            double dWs = Z1;
            double dWv = h.rho * Z1 + rho2 * Z2;

            for (int a = 0; a < 2; ++a) {
                double sign = (a == 0) ? 1.0 : -1.0;  // antithetic: negate both shocks
                double Vt   = std::max(V[a], 0.0);      // full truncation: clamp before sqrt
                double sqV  = std::sqrt(Vt);

                // Log-Euler for stock (exact under constant vol within dt)
                S[a] *= std::exp((r - 0.5*Vt)*dt + sqV*sdt*sign*dWs);
                // Euler for variance (absorbing barrier at 0 via max)
                V[a]  = std::max(V[a] + h.kappa*(h.theta - Vt)*dt
                                      + h.xi*sqV*sdt*sign*dWv, 0.0);
            }
        }
        for (int a = 0; a < 2; ++a)
            sum += disc * std::max(S[a] - K, 0.0);
    }
    return sum / paths;
}`,
    explanation:
      "The correlation between stock and variance Brownian motions is implemented via the Cholesky decomposition: dW_V = ρ·dW_S + √(1−ρ²)·Z₂, where Z₁ and Z₂ are independent. The full-truncation scheme sets V = max(V, 0) before the square root and before updating V — this prevents imaginary volatility when the variance process crosses zero (a problem that occurs more frequently for high ξ or when kappa·theta is small), and it has been shown to have lower bias than the absorption (V = max(V, 0) in the SDE) scheme.",
  },
  {
    id: "cpp-20260614-b1-string-view-fix",
    language: "cpp",
    title: "std::string_view FIX parser — zero-copy tag=value field extraction",
    tag: "market-data",
    code: `#include <string_view>
#include <optional>
#include <charconv>
#include <cstdint>

// FIX protocol (Financial Information eXchange): ASCII messages delimited by SOH (\\x01).
// Format: "8=FIX.4.4\\x0135=D\\x0149=SENDER\\x0156=TARGET\\x0144=100.25\\x01..."
// std::string_view allows zero-copy slicing of the raw UDP/TCP buffer.
// std::from_chars converts ASCII numbers without locale overhead or allocation.

class FIXParser {
    std::string_view msg_;

    // Return the value string for a given numeric tag (e.g., "44" -> price field)
    std::optional<std::string_view> tag(std::string_view tag_str) const noexcept {
        std::string_view s = msg_;
        while (!s.empty()) {
            auto soh = s.find('\\x01');
            std::string_view field = (soh == std::string_view::npos) ? s : s.substr(0, soh);
            auto eq = field.find('=');
            if (eq != std::string_view::npos && field.substr(0, eq) == tag_str)
                return field.substr(eq + 1);
            if (soh == std::string_view::npos) break;
            s.remove_prefix(soh + 1);
        }
        return std::nullopt;
    }

public:
    explicit FIXParser(std::string_view raw) noexcept : msg_(raw) {}

    // Tag 35: message type ('D' = NewOrderSingle, '8' = ExecutionReport)
    std::optional<char> msgType() const noexcept {
        auto v = tag("35");
        return (v && !v->empty()) ? std::optional<char>((*v)[0]) : std::nullopt;
    }

    // Tag 44: price (floating point; from_chars avoids locale and allocation)
    std::optional<double> price() const noexcept {
        auto v = tag("44");
        if (!v) return std::nullopt;
        double val{};
        auto [ptr, ec] = std::from_chars(v->data(), v->data() + v->size(), val);
        return (ec == std::errc{}) ? std::optional<double>(val) : std::nullopt;
    }

    // Tag 38: order quantity
    std::optional<int> orderQty() const noexcept {
        auto v = tag("38");
        if (!v) return std::nullopt;
        int val{};
        auto [ptr, ec] = std::from_chars(v->data(), v->data() + v->size(), val);
        return (ec == std::errc{}) ? std::optional<int>(val) : std::nullopt;
    }

    // Tag 54: side ('1' = Buy, '2' = Sell)
    std::optional<bool> isBuy() const noexcept {
        auto v = tag("54");
        return (v && !v->empty()) ? std::optional<bool>((*v)[0] == '1') : std::nullopt;
    }

    // Tag 11: ClOrdID (order reference — return as a view, no copy)
    std::optional<std::string_view> clOrdId() const noexcept {
        return tag("11");
    }
};`,
    explanation:
      "std::string_view is a non-owning reference to a character sequence — parsing FIX fields with it eliminates every heap allocation (no std::string copies). std::from_chars for floating-point number conversion is typically 3-5× faster than std::stod or sscanf because it is locale-independent and maps directly to floating-point parsing algorithms without the std::locale lookup overhead that adds ~50 ns per call in glibc.",
  },
  {
    id: "cpp-20260614-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly linked list — O(1) order cancellation without heap allocation",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cassert>
#include <cstddef>

// Intrusive list: the prev/next pointers live INSIDE the Order struct itself.
// This avoids a separate list-node heap allocation per order.
// Given a pointer to the Order, removal is O(1) — no traversal.
// PriceLevel is a circular list with a sentinel node (dummy head) to simplify edge cases.

struct ListNode {
    ListNode* prev = nullptr;
    ListNode* next = nullptr;
};

struct Order {
    ListNode     link;      // must be the first member for the offset trick below
    std::uint64_t id;
    double       price;
    int          qty;
    bool         buy;
    bool         in_book = false;
};

// Convert a ListNode* back to the containing Order*
inline Order* nodeToOrder(ListNode* n) noexcept {
    static_assert(offsetof(Order, link) == 0, "link must be first member");
    return reinterpret_cast<Order*>(n);
}

class PriceLevel {
    ListNode sentinel_;  // head: sentinel_.next = first order; sentinel_.prev = last order
    int      count_   = 0;
    int      qty_sum_ = 0;

public:
    PriceLevel() noexcept {
        sentinel_.next = &sentinel_;
        sentinel_.prev = &sentinel_;
    }

    // O(1) append at the back (time-priority queue)
    void push(Order& o) noexcept {
        ListNode* tail = sentinel_.prev;
        o.link.prev = tail;
        o.link.next = &sentinel_;
        tail->next      = &o.link;
        sentinel_.prev  = &o.link;
        ++count_;
        qty_sum_ += o.qty;
        o.in_book = true;
    }

    // O(1) removal: caller holds a pointer to the order (from an OMS map)
    void remove(Order& o) noexcept {
        assert(o.in_book);
        o.link.prev->next = o.link.next;
        o.link.next->prev = o.link.prev;
        o.link.prev = o.link.next = nullptr;
        qty_sum_ -= o.qty;
        --count_;
        o.in_book = false;
    }

    // O(1) front-of-queue peek for matching
    Order* front() const noexcept {
        if (count_ == 0) return nullptr;
        return nodeToOrder(sentinel_.next);
    }

    bool empty()    const noexcept { return count_ == 0; }
    int  count()    const noexcept { return count_; }
    int  qty_sum()  const noexcept { return qty_sum_; }
};`,
    explanation:
      "Intrusive lists enable O(1) cancel without searching the price level because the OMS stores an Order* and that pointer directly provides the list node — there is no intermediate allocation to find and free. The key discipline is that the Order struct owns its list membership: when the order is cancelled, both the OMS hash map and the PriceLevel list can be updated in a single pass of constant time, which is critical when processing 100k cancel messages per second.",
  },
  {
    id: "cpp-20260614-b1-prefetch",
    language: "cpp",
    title: "__builtin_prefetch — hide memory latency in the order matching inner loop",
    tag: "performance",
    code: `#include <cstddef>
#include <cstdint>
#include <vector>
#include <cmath>

// __builtin_prefetch(addr, rw, locality):
//   rw:       0 = read, 1 = write
//   locality: 0 = evict after use (streaming), 3 = keep in L1 (hot data)
// Prefetch latency: ~80-100 ns (DDR4), ~40-50 ns (L3 hit).
// Effective when the CPU is compute-bound (pipeline full) and the next data
// access will be a cache miss. Issue prefetch ~DIST iterations before the use.

struct Order { double price; std::int32_t qty; std::uint64_t id; char pad[4]; };

// Order matching hot loop: for each order at a price level, match against
// incoming qty. Prefetch DIST orders ahead to hide L3/DRAM latency.
int matchOrders(std::vector<Order>& book, int incoming_qty) noexcept {
    constexpr std::size_t DIST = 8;  // tune: DIST * (cycles_per_iteration / cache_miss_latency)
    int filled = 0;
    std::size_t n = book.size();

    for (std::size_t i = 0; i < n && filled < incoming_qty; ++i) {
        // Issue a read prefetch for the element DIST iterations ahead, into L1.
        if (i + DIST < n)
            __builtin_prefetch(&book[i + DIST], 0, 3);

        int take      = std::min(book[i].qty, incoming_qty - filled);
        book[i].qty  -= take;
        filled       += take;
    }
    return filled;
}

// Log-return computation over a large price array: streaming access pattern.
// Prefetch source + destination for write, hint for eviction (locality=0).
void logReturns(const double* __restrict__ prices,
                double*       __restrict__ out, std::size_t n) noexcept {
    constexpr std::size_t PFDIST = 16;
    for (std::size_t i = 1; i < n; ++i) {
        if (i + PFDIST < n) {
            __builtin_prefetch(prices + i + PFDIST, 0, 0);  // prefetch source (streaming)
            __builtin_prefetch(out    + i + PFDIST, 1, 0);  // prefetch dest for write
        }
        out[i-1] = std::log(prices[i] / prices[i-1]);
    }
}`,
    explanation:
      "Prefetching is beneficial only when two conditions hold: (1) the data is not already in cache (L3 miss), and (2) the CPU has spare issue slots to dispatch the prefetch concurrently with useful work. DIST should satisfy DIST ≈ cache_miss_latency_cycles / cycles_per_loop_iteration — for DDR4 (~300 cycles) and a 10-cycle loop body, DIST ≈ 30; for L3 hits (~40 cycles) and a 10-cycle loop, DIST ≈ 4. Over-prefetching with locality=3 on a streaming workload thrashes the L1/L2 caches, degrading performance below no-prefetch.",
  },
  {
    id: "cpp-20260614-b1-consteval",
    language: "cpp",
    title: "consteval — compile-time option parameter validation and constant tables",
    tag: "modern",
    code: `#include <cmath>
#include <numbers>
#include <array>

// consteval: the function MUST be evaluated at compile time.
// Any call with non-constant arguments is a hard compile error.
// Unlike constexpr (can be evaluated at runtime), consteval guarantees
// no runtime code generation — use for parameter validation and lookup tables.

// Compile-time strike validation: throw (consteval throw) causes a compile error
consteval double validStrike(double K) {
    if (K <= 0.0) throw "strike must be positive";   // compile error if violated
    return K;
}
consteval double validVol(double sigma) {
    if (sigma <= 0.0 || sigma > 5.0) throw "sigma out of [0, 5]";
    return sigma;
}
consteval int validExpiry(int days) {
    if (days <= 0 || days > 3650) throw "expiry must be 1–3650 days";
    return days;
}

// Option metadata validated entirely at compile time
template<int Strike100, int Expiry_days, int Sigma100>
struct OptionSpec {
    static constexpr double K     = validStrike(Strike100 / 100.0);
    static constexpr double T     = validExpiry(Expiry_days) / 252.0;
    static constexpr double sigma = validVol(Sigma100 / 100.0);
    // ATM vega approximation: S * sqrt(T / (2*pi)) — compile-time constant
    static constexpr double atm_vega_factor =
        std::sqrt(T / (2.0 * std::numbers::pi));
};

// Compile-time precomputed table of discount factors for standard tenors
consteval std::array<double, 10> makeDiscountTable(double r) {
    std::array<double, 10> df{};
    for (int i = 0; i < 10; ++i)
        df[i] = std::exp(-r * (i + 1));  // df[i] = e^{-r*(i+1)}
    return df;
}

// Generated entirely at compile time — no runtime exp() calls
inline constexpr auto DISCOUNT_5PCT = makeDiscountTable(0.05);

// Usage: OptionSpec<20000, 30, 25> = AAPL 200-strike, 30 DTE, 25% vol.
// Invalid: OptionSpec<-100, 30, 25> — compile error "strike must be positive".
using AAPL_200C_30D = OptionSpec<20000, 30, 25>;
static_assert(AAPL_200C_30D::T > 0.0);`,
    explanation:
      "consteval eliminates entire categories of runtime errors by moving them to compile time: a misconfigured option contract with a negative strike or out-of-range vol fails the build rather than silently pricing incorrectly in production. The consteval discount factor table (makeDiscountTable) is a zero-cost abstraction: the compiler evaluates all ten std::exp calls at compile time and embeds the results as immediate literals in the binary, identical to a hand-written constant array.",
  },
  {
    id: "cpp-20260614-b1-atomic-wait",
    language: "cpp",
    title: "std::atomic::wait / notify_all — C++20 futex-like gate for risk clearance",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <cstdint>

// std::atomic<T>::wait(old) (C++20): blocks until the atomic's value differs from old.
// notify_one() / notify_all(): unblock waiters, similar to condition_variable.
// Implementation: maps to futex (Linux) or WaitOnAddress (Windows).
// Unlike condition_variable: no mutex, no predicate lambda — simpler for flag patterns.
// Unlike spin-wait: does not consume CPU while blocking.

// Risk gate: strategy threads wait for risk engine to clear before sending orders.
class RiskGate {
    std::atomic<std::uint32_t> state_{0};   // 0 = blocked, 1 = cleared

public:
    // Strategy threads: block until cleared
    void waitForClear() const noexcept {
        std::uint32_t s = state_.load(std::memory_order_acquire);
        while (s == 0) {
            state_.wait(0, std::memory_order_relaxed); // OS-level block
            s = state_.load(std::memory_order_acquire);
        }
    }

    void open() noexcept {
        state_.store(1, std::memory_order_release);
        state_.notify_all();    // wake all blocked strategy threads
    }

    void close() noexcept {
        state_.store(0, std::memory_order_release);
        // Threads in waitForClear will re-check and re-block
    }

    bool isOpen() const noexcept {
        return state_.load(std::memory_order_acquire) != 0;
    }
};

// Sequence barrier: consumer waits until a specific sequence number is published.
class SeqBarrier {
    alignas(64) std::atomic<std::int64_t> cursor_{-1};

public:
    void publish(std::int64_t seq) noexcept {
        cursor_.store(seq, std::memory_order_release);
        cursor_.notify_all();
    }

    void waitFor(std::int64_t target) const noexcept {
        std::int64_t cur;
        while ((cur = cursor_.load(std::memory_order_acquire)) < target)
            cursor_.wait(cur, std::memory_order_relaxed);
    }
};`,
    explanation:
      "std::atomic::wait is superior to a spin loop for gate patterns where the wait time is non-trivial (> 1 µs): a spinning thread consumes a full CPU core and generates cache-coherence traffic on the state_ variable, while wait() suspends the thread at the OS level (futex in Linux) and allows the core to be used by other threads or enter a power-saving state. For sub-microsecond gates, a spin-wait is still faster because futex has ~200 ns overhead to enter and exit the kernel.",
  },
  {
    id: "cpp-20260614-b1-token-bucket",
    language: "cpp",
    title: "Token bucket rate limiter — burst-and-sustain order throttling",
    tag: "systems",
    code: `#include <atomic>
#include <chrono>
#include <algorithm>
#include <cstdint>

// Token bucket rate limiter:
//   - bucket holds up to 'capacity' tokens (burst headroom).
//   - 'rate' tokens per second are added continuously.
//   - each order consumes 'cost' tokens; rejected if insufficient.
// Commonly used by exchanges to enforce message rate limits (e.g., 1000 orders/sec).
// Lock-free implementation: separate atomics for tokens and last-refill timestamp.

class TokenBucket {
    double capacity_;
    double rate_;   // tokens per second

    alignas(64) std::atomic<std::int64_t> tokens_x1000_{};  // tokens * 1000 (fixed-point)
    alignas(64) std::atomic<std::int64_t> last_ns_{};

    static std::int64_t nowNs() noexcept {
        return std::chrono::steady_clock::now().time_since_epoch().count();
    }

public:
    TokenBucket(double capacity, double rate)
        : capacity_(capacity), rate_(rate) {
        tokens_x1000_.store(static_cast<std::int64_t>(capacity * 1000),
                            std::memory_order_relaxed);
        last_ns_.store(nowNs(), std::memory_order_relaxed);
    }

    // Returns true if order is allowed; false if rate-limited.
    // Not fully lock-free under contention, but suitable for single-threaded OMS.
    bool tryConsume(double cost = 1.0) noexcept {
        std::int64_t now  = nowNs();
        std::int64_t prev = last_ns_.exchange(now, std::memory_order_relaxed);
        double elapsed_s  = static_cast<double>(now - prev) * 1e-9;

        std::int64_t refill = static_cast<std::int64_t>(elapsed_s * rate_ * 1000.0);
        std::int64_t cap    = static_cast<std::int64_t>(capacity_ * 1000.0);
        std::int64_t cost_k = static_cast<std::int64_t>(cost * 1000.0);

        std::int64_t tokens = tokens_x1000_.load(std::memory_order_relaxed);
        tokens = std::min(tokens + refill, cap);

        if (tokens < cost_k) {
            tokens_x1000_.store(tokens, std::memory_order_relaxed);
            return false;
        }
        tokens_x1000_.store(tokens - cost_k, std::memory_order_relaxed);
        return true;
    }

    double available() const noexcept {
        return tokens_x1000_.load(std::memory_order_relaxed) / 1000.0;
    }
};

// Usage: 200 orders/sec sustained, 10-order burst
// TokenBucket limiter(10.0, 200.0);
// if (!limiter.tryConsume()) { rejectOrder(id); return; }`,
    explanation:
      "The token bucket naturally handles burst-and-sustain patterns that leaky bucket cannot: if no orders arrive for 50 ms, the bucket accumulates up to 'capacity' tokens, which allows a brief burst to fill an opportunity before the sustained rate takes over. Storing tokens as a fixed-point integer (×1000) avoids floating-point atomics while preserving sub-order precision for fractional rate calculations — the key invariant is that accumulated tokens never exceed capacity.",
  },
  {
    id: "cpp-20260614-b1-swap-npv",
    language: "cpp",
    title: "Interest rate swap NPV — payer swap valuation using discount curve",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <numeric>

// Fixed-float vanilla interest rate swap (payer: pay fixed K, receive floating).
// NPV_payer = PV_float - PV_fixed
// PV_float  = N * (P(0, T_0) - P(0, T_N))   (telescoping of forward rates)
// PV_fixed  = N * K * sum_i delta_i * P(0, T_i)
// Par swap rate: K_par = (P(0, T_0) - P(0, T_N)) / annuity
// DV01: dollar value of 1bp = N * annuity * 1e-4

struct CashFlowDate {
    double tenor;      // time from today in years
    double df;         // discount factor P(0, tenor)
};

struct SwapResult {
    double npv_payer;    // positive = in-the-money for fixed payer
    double par_rate;     // fair fixed rate (annualised, decimal)
    double annuity;      // sum_i delta_i * P(0, T_i) — fixed leg annuity
    double dv01;         // dollar value of 1 basis point (per unit notional)
    double duration_mod; // modified duration of the fixed leg
};

SwapResult pricePayerSwap(double fixed_rate, double notional,
                           const std::vector<CashFlowDate>& schedule) {
    double annuity = 0.0;
    for (std::size_t i = 0; i < schedule.size(); ++i) {
        double delta = (i == 0) ? schedule[0].tenor
                                : schedule[i].tenor - schedule[i-1].tenor;
        annuity += delta * schedule[i].df;
    }

    // P(0, T_0): discount factor at start (today if spot-starting = 1.0)
    double df0 = 1.0;
    double dfN = schedule.empty() ? 1.0 : schedule.back().df;

    double pv_float  = notional * (df0 - dfN);
    double pv_fixed  = notional * fixed_rate * annuity;
    double par_rate  = (df0 - dfN) / annuity;
    double dv01      = notional * annuity * 1e-4;

    // Modified duration: weighted average maturity of fixed cash flows
    double cf_sum = 0.0, cf_pv = 0.0;
    for (std::size_t i = 0; i < schedule.size(); ++i) {
        double delta = (i == 0) ? schedule[0].tenor
                                : schedule[i].tenor - schedule[i-1].tenor;
        double cf = (i + 1 == schedule.size())
                    ? (fixed_rate * delta + 1.0) * schedule[i].df  // final: coupon + principal
                    : fixed_rate * delta * schedule[i].df;
        cf_sum += cf * schedule[i].tenor;
        cf_pv  += cf;
    }
    double duration_mod = (cf_pv > 0) ? cf_sum / cf_pv / (1.0 + par_rate) : 0.0;

    return {pv_float - pv_fixed, par_rate, annuity, dv01, duration_mod};
}`,
    explanation:
      "The floating leg PV telescopes to N·(P(0,T₀) − P(0,T_N)) regardless of the number of payment dates because forward rates compound exactly to the spot discount factors in a no-arbitrage model — this is why the floating leg valuation requires only two discount factors, not one per coupon date. The annuity (sum of delta_i × P(0,T_i)) is also the key sensitivity: DV01 = N × annuity × 10⁻⁴, meaning a swap with a large annuity has proportionally larger rate sensitivity and is used to hedge parallel shifts in the yield curve.",
  },
  {
    id: "cpp-20260614-b1-dupire-lv",
    language: "cpp",
    title: "Dupire local vol — extracting sigma_loc(K,T) from the call price surface",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <stdexcept>

// Dupire (1994) formula: the unique local volatility surface consistent with
// all European call prices C(K, T) is:
//   sigma_loc^2(K, T) = (dC/dT + r*K*dC/dK) / (0.5 * K^2 * d^2C/dK^2)
// Numerator: Dupire's "calendar spread" — rate of forward price increase.
// Denominator: Breeden-Litzenberger risk-neutral density * K^2/2.
// Compute partial derivatives via centred finite differences on a grid.

struct CallSurface {
    std::vector<double> strikes;   // K-grid, N_K points
    std::vector<double> expiries;  // T-grid, N_T points
    // prices[iT * N_K + iK] = C(K_iK, T_iT)
    std::vector<double> prices;

    double at(std::size_t iT, std::size_t iK) const noexcept {
        return prices[iT * strikes.size() + iK];
    }
};

// Returns local vol at grid point (iT, iK); needs interior points.
double dupireLocalVol(const CallSurface& surf, std::size_t iT, std::size_t iK,
                       double r, double q = 0.0) {
    std::size_t NK = surf.strikes.size();
    std::size_t NT = surf.expiries.size();
    if (iT == 0 || iT + 1 >= NT || iK == 0 || iK + 1 >= NK)
        throw std::out_of_range("Dupire: need interior grid point");

    double K  = surf.strikes[iK];
    double T  = surf.expiries[iT];
    double dK = 0.5 * (surf.strikes[iK+1] - surf.strikes[iK-1]);
    double dT = 0.5 * (surf.expiries[iT+1] - surf.expiries[iT-1]);

    double C    = surf.at(iT, iK);
    double Cu   = surf.at(iT, iK+1);  // C(K+dK)
    double Cd   = surf.at(iT, iK-1);  // C(K-dK)
    double Ct   = surf.at(iT+1, iK);  // C(T+dT)
    double Cb   = surf.at(iT-1, iK);  // C(T-dT)

    double dC_dT   = (Ct - Cb) / (2.0 * dT);
    double dC_dK   = (Cu - Cd) / (2.0 * dK);
    double d2C_dK2 = (Cu - 2.0*C + Cd) / (dK * dK);

    // Include dividend yield q: numerator becomes dC/dT + (r-q)*K*dC/dK + q*C
    double numer = dC_dT + (r - q) * K * dC_dK + q * C;
    double denom = 0.5 * K * K * d2C_dK2;

    if (denom < 1e-12) return 0.0;   // butterfly arbitrage: zero/negative density

    double lv2 = numer / denom;
    return (lv2 > 0.0) ? std::sqrt(lv2) : 0.0;
}`,
    explanation:
      "The Dupire formula is the continuous-time analogue of state-price density extraction: the denominator d²C/dK² is the Breeden-Litzenberger risk-neutral density multiplied by K²/2 (the discount factor is absorbed into C), and the numerator measures how the call price grows with time (the forward measure drift term). A negative denominator signals a butterfly arbitrage in the surface — the local vol model cannot be calibrated there, and the surface must be smoothed before application.",
  },
  {
    id: "cpp-20260614-b1-sabr-hagan",
    language: "cpp",
    title: "SABR Hagan formula — stochastic-alpha-beta-rho implied vol smile",
    tag: "quant",
    code: `#include <cmath>
#include <stdexcept>

// SABR model (Hagan et al. 2002): dF = alpha*F^beta*dW_F, d(alpha) = nu*alpha*dW_v.
// Corr(dW_F, dW_v) = rho.
// Hagan's approximate closed-form for lognormal (Black) implied vol.
// Widely used for FX, rates, and equity surface calibration.

struct SABRParams { double alpha, beta, rho, nu; };

double sabrBlackVol(double F, double K, double T,
                     const SABRParams& p) noexcept {
    if (F <= 0 || K <= 0 || T <= 0) return 0.0;

    double logFK = std::log(F / K);

    if (std::abs(logFK) < 1e-6) {
        // ATM case: moneyness ~ 0, use separate ATM formula
        double Fb   = std::pow(F, 1.0 - p.beta);
        double A    = p.alpha / Fb;
        double corr = 1.0 + T * (
            (1.0-p.beta)*(1.0-p.beta) * p.alpha*p.alpha / (24.0 * Fb*Fb)
            + 0.25 * p.rho * p.beta * p.nu * p.alpha / Fb
            + (2.0 - 3.0*p.rho*p.rho) * p.nu*p.nu / 24.0
        );
        return A * corr;
    }

    double FK     = F * K;
    double FKb2   = std::pow(FK, (1.0-p.beta)/2.0);

    // z = nu/alpha * FKb2 * log(F/K)
    double z      = (p.nu / p.alpha) * FKb2 * logFK;

    // x(z) = ln[(sqrt(1-2rho*z+z^2)+z-rho)/(1-rho)]
    double sq     = std::sqrt(1.0 - 2.0*p.rho*z + z*z);
    double xz     = std::log((sq + z - p.rho) / (1.0 - p.rho));
    double z_xz   = (std::abs(xz) > 1e-10) ? z / xz : 1.0;

    // Denominator: FKb2 * [1 + ((1-beta)*logFK)^2/24 + ...]
    double log2   = logFK * logFK;
    double bb     = (1.0-p.beta)*(1.0-p.beta);
    double denom  = FKb2 * (1.0 + bb*log2/24.0 + bb*bb*log2*log2/1920.0);

    // Correction term for finite T
    double corr   = 1.0 + T * (
        bb * p.alpha*p.alpha / (24.0 * std::pow(FK, 1.0-p.beta))
        + 0.25 * p.rho * p.beta * p.nu * p.alpha / FKb2
        + (2.0 - 3.0*p.rho*p.rho) * p.nu*p.nu / 24.0
    );

    return (p.alpha / denom) * z_xz * corr;
}`,
    explanation:
      "The SABR formula produces a smile because the z/x(z) term encodes the asymmetry from correlation ρ: when ρ < 0 (equity skew), the implied vol increases for lower strikes (higher put prices) because negative shocks to the stock are accompanied by positive vol shocks, amplifying downside moves. The beta parameter controls the ATM vol backbone: β = 0 is the normal (Bachelier) model, β = 1 is the lognormal (Black) model, and β = 0.5 is the square-root CEV — rates desks commonly use β = 0 for near-zero rate environments.",
  },
  {
    id: "cpp-20260614-b1-ewma-cov",
    language: "cpp",
    title: "EWMA covariance matrix — RiskMetrics exponential decay for dynamic risk",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <cstddef>

// EWMA (Exponentially Weighted Moving Average) covariance:
//   C_t = lambda * C_{t-1} + (1-lambda) * r_t * r_t^T
// lambda = 0.94 (daily) — RiskMetrics standard; equivalent to 16-day half-life.
// Responds to vol regime changes faster than a rolling window.
// Full N×N matrix update is O(N^2) per day; adequate for N <= 500.

class EWMACovariance {
    std::size_t N_;
    double      lambda_;
    std::vector<double> C_;  // N×N, row-major

    double& at(std::size_t i, std::size_t j) noexcept { return C_[i*N_ + j]; }
    double  at(std::size_t i, std::size_t j) const noexcept { return C_[i*N_ + j]; }

public:
    EWMACovariance(std::size_t N, double lambda = 0.94)
        : N_(N), lambda_(lambda), C_(N*N, 0.0) {}

    // Seed with initial variance estimate (e.g., from prior 60-day sample)
    void init(double initial_daily_var) noexcept {
        C_.assign(N_*N_, 0.0);
        for (std::size_t i = 0; i < N_; ++i)
            at(i,i) = initial_daily_var;
    }

    // Ingest one day's return vector (length N)
    void update(const double* r) noexcept {
        double w1 = lambda_, w2 = 1.0 - lambda_;
        for (std::size_t i = 0; i < N_; ++i) {
            for (std::size_t j = i; j < N_; ++j) {
                double v = w1 * at(i,j) + w2 * r[i] * r[j];
                at(i,j) = v;
                at(j,i) = v;   // symmetric update
            }
        }
    }

    // Portfolio variance: w' * C * w
    double portVar(const double* w) const noexcept {
        double s = 0.0;
        for (std::size_t i = 0; i < N_; ++i)
            for (std::size_t j = 0; j < N_; ++j)
                s += w[i] * at(i,j) * w[j];
        return s;
    }

    double vol(std::size_t i, double ann = 252.0) const noexcept {
        return std::sqrt(at(i,i) * ann);
    }

    double corr(std::size_t i, std::size_t j) const noexcept {
        double vi = std::sqrt(at(i,i)), vj = std::sqrt(at(j,j));
        return (vi*vj > 1e-14) ? at(i,j)/(vi*vj) : 0.0;
    }

    const std::vector<double>& matrix() const noexcept { return C_; }
};`,
    explanation:
      "The EWMA half-life is ln(2)/ln(1/λ) ≈ 11 days for λ=0.94 — this means a vol shock from 11 days ago has half the weight of today's observation. This compares to a 60-day rolling window which gives equal weight to all observations regardless of recency; during a vol spike, EWMA immediately reflects the new regime while the rolling window takes 60 days to incorporate it fully. The tradeoff is that EWMA correlation estimates are noisier than rolling-window estimates because they never have more than an effective sample size of 1/(1-λ) ≈ 17 observations.",
  },
  {
    id: "cpp-20260614-b1-array-book",
    language: "cpp",
    title: "Array-based order book — O(1) best bid/ask with integer price grid",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cstddef>
#include <vector>
#include <optional>
#include <cassert>

// Price-level array book: map integer tick price → volume.
// O(1) update; O(1) best bid/ask via a cached pointer.
// Works for instruments with a fixed tick grid (equities, futures).
// Memory: N_levels × 16 bytes = 160 KB for 10 000 levels (fits in L2).

struct Level { std::int64_t qty; std::int32_t order_count; char _pad[4]; };

class ArrayBook {
    double   ref_price_;   // price at index 0
    double   tick_;        // price increment per level
    std::size_t n_;

    std::vector<Level> bids_;
    std::vector<Level> asks_;
    int best_bid_ = -1;                    // highest non-empty bid index
    int best_ask_ = std::numeric_limits<int>::max();  // lowest non-empty ask index

    int toIdx(double price) const noexcept {
        return static_cast<int>((price - ref_price_) / tick_ + 0.5);
    }
    double toPrice(int i) const noexcept {
        return ref_price_ + i * tick_;
    }

public:
    ArrayBook(std::size_t n_levels, double ref_price, double tick)
        : ref_price_(ref_price), tick_(tick), n_(n_levels),
          bids_(n_levels), asks_(n_levels) {
        best_ask_ = static_cast<int>(n_levels);
    }

    void addBid(double price, std::int64_t qty) noexcept {
        int i = toIdx(price);
        if (i < 0 || i >= static_cast<int>(n_)) return;
        bids_[i].qty += qty; bids_[i].order_count++;
        if (i > best_bid_) best_bid_ = i;
    }

    void removeBid(double price, std::int64_t qty) noexcept {
        int i = toIdx(price);
        if (i < 0 || i >= static_cast<int>(n_)) return;
        bids_[i].qty -= qty; bids_[i].order_count--;
        // Lazy update: scan backward only when best is removed
        while (best_bid_ >= 0 && bids_[best_bid_].qty <= 0) --best_bid_;
    }

    void addAsk(double price, std::int64_t qty) noexcept {
        int i = toIdx(price);
        if (i < 0 || i >= static_cast<int>(n_)) return;
        asks_[i].qty += qty; asks_[i].order_count++;
        if (i < best_ask_) best_ask_ = i;
    }

    void removeAsk(double price, std::int64_t qty) noexcept {
        int i = toIdx(price);
        if (i < 0 || i >= static_cast<int>(n_)) return;
        asks_[i].qty -= qty; asks_[i].order_count--;
        while (best_ask_ < static_cast<int>(n_) && asks_[best_ask_].qty <= 0)
            ++best_ask_;
    }

    std::optional<double> bestBid() const noexcept {
        if (best_bid_ < 0) return std::nullopt;
        return toPrice(best_bid_);
    }
    std::optional<double> bestAsk() const noexcept {
        if (best_ask_ >= static_cast<int>(n_)) return std::nullopt;
        return toPrice(best_ask_);
    }
    double spread() const noexcept {
        auto b = bestBid(), a = bestAsk();
        return (b && a) ? *a - *b : 0.0;
    }
};`,
    explanation:
      "The array book outperforms a price-sorted map for high-frequency update workloads because the tick-to-index mapping is a single multiply-add with no hash collision or tree rebalancing. The lazy best-bid/ask update is amortised O(1): in normal markets, the best quote moves by at most 1-2 ticks per update, so the backward scan terminates almost immediately. For instruments with wider ranges (e.g., crude oil 0–200 USD at 0.01 tick = 20 000 levels × 16 bytes = 320 KB), the array still fits comfortably in L3 cache.",
  },
  {
    id: "cpp-20260614-b1-coroutine-gen",
    language: "cpp",
    title: "C++20 generator coroutine — lazy GBM path for memory-efficient backtesting",
    tag: "modern",
    code: `#include <coroutine>
#include <optional>
#include <cmath>
#include <random>

// C++20 coroutines: co_yield suspends execution and produces one value at a time.
// Generator<T> is a lazy sequence — the full path is never stored in memory.
// Useful for backtesting millions of MC paths without a large pre-allocated vector.
// The coroutine frame (local variables + rng state) is heap-allocated once.

template<typename T>
class Generator {
public:
    struct promise_type {
        T current_val{};
        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v) noexcept {
            current_val = v; return {};
        }
        void return_void() noexcept {}
        void unhandled_exception() { throw; }
    };

    using Handle = std::coroutine_handle<promise_type>;

    explicit Generator(Handle h) noexcept : h_(h) {}
    ~Generator() { if (h_) h_.destroy(); }
    Generator(const Generator&) = delete;
    Generator(Generator&& o) noexcept : h_(std::exchange(o.h_, {})) {}

    // Advance the coroutine and return the next price, or nullopt at end
    std::optional<T> next() {
        if (!h_ || h_.done()) return std::nullopt;
        h_.resume();
        return h_.done() ? std::optional<T>{} : std::optional<T>{h_.promise().current_val};
    }

private:
    Handle h_;
};

// Coroutine: yields one GBM price per call; local rng survives each suspension.
Generator<double> gbmPath(double S0, double r, double sigma,
                            double dt, int steps, std::uint64_t seed = 42) {
    std::mt19937_64 rng(seed);          // rng lives in the coroutine frame
    std::normal_distribution<double> nd;
    double S    = S0;
    double mu   = (r - 0.5 * sigma * sigma) * dt;
    double vol  = sigma * std::sqrt(dt);
    for (int i = 0; i < steps; ++i) {
        S *= std::exp(mu + vol * nd(rng));
        co_yield S;                     // suspend: return S to the caller
    }
}

// Usage: stream 252 daily prices without allocating a 252-element vector
// auto path = gbmPath(100.0, 0.05, 0.20, 1.0/252, 252);
// while (auto price = path.next()) { strategy.onPrice(*price); }`,
    explanation:
      "The coroutine frame is heap-allocated once per path, but it avoids the O(N) pre-allocation of the full price vector — for 1 million paths of 252 steps, this saves 252 MB of peak memory and enables streaming processing that stays within L3 cache. The local rng state (mt19937_64: 2.5 KB) persists across co_yield suspensions inside the coroutine frame, maintaining exact reproducibility without needing to serialise and restore the generator state between iterations.",
  },
  {
    id: "cpp-20260614-b1-tsrv",
    language: "cpp",
    title: "Two-scales realized variance (TSRV) — microstructure-robust intraday vol",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <numeric>

// Zhang-Mykland-Ait-Sahalia (2005) Two-Scales Realized Variance:
// RV from tick-by-tick data is inflated by bid-ask bounce (microstructure noise).
// TSRV = RV_coarse - (n_coarse / n_fine) * RV_fine
// where RV_coarse uses K-tick subsampling (e.g., every 5 ticks) averaged over K offsets,
// and RV_fine is tick-by-tick (mostly noise).
// The correction removes the additive noise bias at O(n^{-1/6}) rate.

// Returns sum of squared log-returns at the given step size (not annualised)
static double rvKStep(const std::vector<double>& lp, int step) noexcept {
    double rv = 0.0;
    int cnt = 0;
    for (int i = step; i < static_cast<int>(lp.size()); i += step) {
        double r = lp[i] - lp[i - step];
        rv += r * r;
        ++cnt;
    }
    return (cnt > 0) ? rv / cnt : 0.0;
}

struct TSRVResult {
    double tsrv;          // TSRV estimate (daily variance)
    double rv_fine;       // tick-by-tick RV (noise-inflated)
    double rv_coarse;     // averaged K-step RV
    double daily_vol;     // sqrt(tsrv) — daily vol
};

// lp: vector of log prices at each tick
// K: coarse grid step (e.g., 5 = every 5 ticks, roughly 30 sec for 6-sec ticks)
TSRVResult twoScalesRV(const std::vector<double>& lp, int K = 5) noexcept {
    int n = static_cast<int>(lp.size());

    // Fine scale: tick-by-tick (step=1)
    double rv_fine = rvKStep(lp, 1);

    // Coarse scale: average over K offset-shifted subsamples
    double rv_coarse_sum = 0.0;
    int    valid_offsets = 0;
    for (int offset = 0; offset < K; ++offset) {
        // Build subsample starting at 'offset'
        std::vector<double> sub;
        sub.reserve(n / K + 1);
        for (int i = offset; i < n; i += K)
            sub.push_back(lp[i]);
        if (sub.size() < 2) continue;
        // RV of this subsample (step=1 within the subsampled series)
        double rv_s = 0.0;
        for (std::size_t j = 1; j < sub.size(); ++j) {
            double r = sub[j] - sub[j-1];
            rv_s += r * r;
        }
        rv_coarse_sum += rv_s / (static_cast<double>(sub.size()) - 1.0);
        ++valid_offsets;
    }

    double rv_coarse = (valid_offsets > 0) ? rv_coarse_sum / valid_offsets : 0.0;

    // n_coarse / n_fine correction factor
    double n_coarse  = static_cast<double>(n) / K;
    double n_fine    = static_cast<double>(n) - 1.0;
    double bias_corr = n_coarse / n_fine;

    double tsrv = rv_coarse - bias_corr * rv_fine;
    tsrv = std::max(tsrv, 0.0);

    return {tsrv, rv_fine, rv_coarse, std::sqrt(tsrv)};
}`,
    explanation:
      "The bid-ask bounce adds a constant noise variance 2σ²_noise to the naive tick-by-tick realized variance, making it severely upward biased — for a bid-ask spread of 1 cent and a mid-price around $100, the noise contribution equals a 10-bps daily return per transaction, which swamps the actual realised vol at 5-minute sampling. TSRV removes this bias by exploiting the fact that the noise cancels when you difference two K-spaced observations and then correct for the K-fold reduction in sample size.",
  },
  {
    id: "cpp-20260614-b1-segment-tree",
    language: "cpp",
    title: "Segment tree — O(log N) range volume query for order book depth",
    tag: "data-structures",
    code: `#include <vector>
#include <cstddef>
#include <cstdint>
#include <algorithm>

// Segment tree: supports range-sum queries and point updates in O(log N).
// Application: total bid/ask volume in a price range [lo, hi] (depth at risk),
// or finding the kth price level by cumulative volume.

class SegTree {
    std::size_t n_;
    std::vector<std::int64_t> t_;  // 1-indexed; t_[1] = root = total sum

    void build(const std::vector<std::int64_t>& a, std::size_t v,
               std::size_t lo, std::size_t hi) {
        if (lo == hi) { t_[v] = a[lo]; return; }
        std::size_t mid = (lo + hi) / 2;
        build(a, 2*v, lo, mid);
        build(a, 2*v+1, mid+1, hi);
        t_[v] = t_[2*v] + t_[2*v+1];
    }

    void upd(std::size_t v, std::size_t lo, std::size_t hi,
             std::size_t pos, std::int64_t delta) noexcept {
        if (lo == hi) { t_[v] += delta; return; }
        std::size_t mid = (lo + hi) / 2;
        if (pos <= mid) upd(2*v, lo, mid, pos, delta);
        else            upd(2*v+1, mid+1, hi, pos, delta);
        t_[v] = t_[2*v] + t_[2*v+1];
    }

    std::int64_t qry(std::size_t v, std::size_t lo, std::size_t hi,
                      std::size_t ql, std::size_t qr) const noexcept {
        if (qr < lo || hi < ql) return 0;
        if (ql <= lo && hi <= qr) return t_[v];
        std::size_t mid = (lo + hi) / 2;
        return qry(2*v, lo, mid, ql, qr) + qry(2*v+1, mid+1, hi, ql, qr);
    }

public:
    explicit SegTree(std::size_t n) : n_(n), t_(4*n, 0) {}

    explicit SegTree(const std::vector<std::int64_t>& a)
        : n_(a.size()), t_(4*a.size(), 0) {
        if (!a.empty()) build(a, 1, 0, n_-1);
    }

    // Add delta_qty to price level idx (0-indexed)
    void update(std::size_t idx, std::int64_t delta) noexcept {
        upd(1, 0, n_-1, idx, delta);
    }

    // Total qty in price levels [lo, hi] inclusive (0-indexed)
    std::int64_t query(std::size_t lo, std::size_t hi) const noexcept {
        if (lo > hi || hi >= n_) return 0;
        return qry(1, 0, n_-1, lo, hi);
    }

    std::int64_t total() const noexcept { return n_ ? t_[1] : 0; }
};

// Example: 10000 price levels, bid book
// SegTree bids(10000);
// bids.update(4995, 500);  // 500 shares at tick 4995
// bids.update(4994, 300);
// auto depth_5ticks = bids.query(4990, 4995);  // total qty in top-5-tick range`,
    explanation:
      "The segment tree generalises the Fenwick tree to support arbitrary range queries (not just prefix sums) and range updates — for depth-at-risk queries such as 'how many shares are within 5 ticks of the NBBO', the segment tree answers in O(log N) = 14 comparisons for 10 000 levels. The 4N internal array size (1-indexed, 2× for children of each node) is the standard allocation; a complete binary tree of height ⌈log₂N⌉ never uses more than 4N nodes, making pre-allocation safe.",
  },
];
