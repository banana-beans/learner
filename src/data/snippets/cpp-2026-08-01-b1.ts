import type { Snippet } from "./types";

export const cppSnippets20260801B1: Snippet[] = [
  {
    id: "cpp-20260801-b1-concepts-numeric",
    language: "cpp",
    title: "C++20 Concepts for Numeric Type Constraints",
    tag: "concepts",
    code: `#include <concepts>
#include <type_traits>
#include <cmath>

// Concept: must be a floating-point type
template <typename T>
concept FloatingPoint = std::is_floating_point_v<T>;

// Concept: supports arithmetic + comparison (covers double, float, __float128)
template <typename T>
concept Arithmetic = std::is_arithmetic_v<T>;

// Generic Black-Scholes d1 computable for any float type
template <FloatingPoint T>
T bs_d1(T S, T K, T r, T sigma, T T_exp) {
    return (std::log(S / K) + (r + T(0.5) * sigma * sigma) * T_exp)
           / (sigma * std::sqrt(T_exp));
}

// Only accept integer-or-float via Arithmetic
template <Arithmetic T>
T clamp_notional(T x, T lo, T hi) {
    return x < lo ? lo : (x > hi ? hi : x);
}

int main() {
    double d1 = bs_d1(100.0, 100.0, 0.05, 0.2, 1.0);
    float  cl  = clamp_notional(1.5f, 0.0f, 1.0f);
    (void)d1; (void)cl;
}`,
    explanation: "C++20 concepts replace SFINAE for readable compile-time constraints. FloatingPoint and Arithmetic are standard-library concepts; constraining template parameters this way gives clear error messages at the call site rather than deep substitution failures."
  },
  {
    id: "cpp-20260801-b1-allocator-pool",
    language: "cpp",
    title: "Fixed-Size Pool Allocator for Order Objects",
    tag: "allocators",
    code: `#include <cstddef>
#include <cassert>
#include <array>
#include <new>

// Slab allocator: pre-allocates N objects of size ObjSize in one block.
// Allocate / deallocate are O(1) and never call ::operator new at runtime.
template <std::size_t ObjSize, std::size_t N>
class PoolAllocator {
    struct Slot { alignas(ObjSize) std::byte data[ObjSize]; Slot* next; };
    std::array<Slot, N> slab_;
    Slot* free_head_ = nullptr;
public:
    PoolAllocator() {
        for (std::size_t i = 0; i < N - 1; ++i)
            slab_[i].next = &slab_[i + 1];
        slab_[N - 1].next = nullptr;
        free_head_ = &slab_[0];
    }
    void* allocate() {
        assert(free_head_ && "pool exhausted");
        Slot* s = free_head_;
        free_head_ = s->next;
        return s->data;
    }
    void deallocate(void* p) {
        Slot* s = reinterpret_cast<Slot*>(p);
        s->next  = free_head_;
        free_head_ = s;
    }
};

struct Order { int id; double price; int qty; };

int main() {
    PoolAllocator<sizeof(Order), 1024> pool;
    Order* o = new (pool.allocate()) Order{1, 99.5, 100};
    o->~Order();
    pool.deallocate(o);
}`,
    explanation: "Pool allocators eliminate per-order heap allocation overhead — critical when an HFT engine processes millions of order objects per second. The slab stores all slots contiguously, improving cache locality versus scattered heap objects."
  },
  {
    id: "cpp-20260801-b1-lockfree-spsc-queue",
    language: "cpp",
    title: "Lock-Free SPSC Queue (Single-Producer Single-Consumer)",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Wait-free SPSC queue for market-data events between threads.
// head_ owned by producer; tail_ owned by consumer.
template <typename T, std::size_t Cap>
class SPSCQueue {
    alignas(64) std::atomic<std::size_t> head_{0};  // cache-line isolated
    alignas(64) std::atomic<std::size_t> tail_{0};
    std::array<T, Cap> buf_;

public:
    bool push(T val) {
        std::size_t h = head_.load(std::memory_order_relaxed);
        std::size_t next = (h + 1) % Cap;
        if (next == tail_.load(std::memory_order_acquire)) return false; // full
        buf_[h] = std::move(val);
        head_.store(next, std::memory_order_release);
        return true;
    }
    std::optional<T> pop() {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        if (t == head_.load(std::memory_order_acquire)) return std::nullopt; // empty
        T val = std::move(buf_[t]);
        tail_.store((t + 1) % Cap, std::memory_order_release);
        return val;
    }
};`,
    explanation: "SPSC queues need only acquire/release fences — no CAS loops — making them the fastest inter-thread pipeline primitive. Aligning head_ and tail_ to separate cache lines prevents false sharing between the producer and consumer cores."
  },
  {
    id: "cpp-20260801-b1-intrusive-list-orderbook",
    language: "cpp",
    title: "Intrusive Doubly-Linked List for Order Book Levels",
    tag: "containers",
    code: `#include <cstddef>
#include <cassert>

// Intrusive lists embed list links inside the node object, eliminating
// a separate allocation for the list node. O(1) insert/remove with pointer.
struct ListHook {
    ListHook* prev = nullptr;
    ListHook* next = nullptr;
};

struct PriceLevel : ListHook {
    double price;
    int    total_qty;
    explicit PriceLevel(double p, int q) : price(p), total_qty(q) {}
};

struct IntrusiveList {
    ListHook sentinel_{&sentinel_, &sentinel_}; // circular dummy head

    void push_back(ListHook* n) {
        n->prev = sentinel_.prev;
        n->next = &sentinel_;
        sentinel_.prev->next = n;
        sentinel_.prev       = n;
    }
    void remove(ListHook* n) {
        n->prev->next = n->next;
        n->next->prev = n->prev;
        n->prev = n->next = nullptr;
    }
    bool empty() const { return sentinel_.next == &sentinel_; }
};

int main() {
    IntrusiveList levels;
    PriceLevel l1{99.5, 500}, l2{99.0, 300};
    levels.push_back(&l1);
    levels.push_back(&l2);
    levels.remove(&l1);
    assert(!levels.empty());
}`,
    explanation: "Intrusive lists are preferred in HFT order books because each PriceLevel is allocated once (in a pool) and linked directly — no extra allocation or indirection. Removing a level during a cancel is O(1) if you hold the pointer."
  },
  {
    id: "cpp-20260801-b1-memory-order-relaxed",
    language: "cpp",
    title: "Memory Ordering: Relaxed vs Release-Acquire",
    tag: "memory-ordering",
    code: `#include <atomic>
#include <thread>
#include <cassert>

// Demonstrate acquire/release pairing for a flag-based handoff.
std::atomic<int>  data{0};
std::atomic<bool> ready{false};

void producer() {
    data.store(42, std::memory_order_relaxed);   // no sync needed for data yet
    ready.store(true, std::memory_order_release); // publish: all prior stores visible
}
void consumer() {
    while (!ready.load(std::memory_order_acquire)) {} // spin until published
    // Guaranteed: data == 42 here, even on weakly-ordered architectures
    assert(data.load(std::memory_order_relaxed) == 42);
}

int main() {
    std::thread p(producer), c(consumer);
    p.join(); c.join();
}`,
    explanation: "Release on a store and acquire on a load create a synchronises-with edge: all writes before the release are visible after the acquire. Relaxed on the data store is safe because the release on ready acts as the fence — avoids unnecessary barriers on x86 but is critical on ARM/POWER."
  },
  {
    id: "cpp-20260801-b1-sfinae-enable-if",
    language: "cpp",
    title: "SFINAE with enable_if for Numeric Overloads",
    tag: "sfinae",
    code: `#include <type_traits>
#include <complex>

// Pre-C++20 technique: enable_if selects overloads based on type properties.
// Use for legacy codebases or when targeting C++17.

// Overload for real types
template <typename T, std::enable_if_t<std::is_floating_point_v<T>, int> = 0>
T norm_squared(T x) { return x * x; }

// Overload for complex types
template <typename T>
auto norm_squared(const std::complex<T>& z) { return z.real()*z.real() + z.imag()*z.imag(); }

// Disable for integral types entirely (would compile but give wrong semantics)
template <typename T, std::enable_if_t<std::is_integral_v<T>, int> = 0>
void norm_squared(T) = delete;

int main() {
    double r = norm_squared(3.0);           // calls real overload
    auto   c = norm_squared(std::complex<double>{3.0, 4.0}); // complex overload
    // norm_squared(5);  // compile error: deleted
    (void)r; (void)c;
}`,
    explanation: "SFINAE via enable_if routes template instantiation without runtime cost. The deleted overload for integers prevents silent implicit conversions — common source of quant bugs when integer tick counts get passed to a float pricing function."
  },
  {
    id: "cpp-20260801-b1-perfect-forward-factory",
    language: "cpp",
    title: "Perfect Forwarding Factory for Order Construction",
    tag: "perfect-forwarding",
    code: `#include <utility>
#include <memory>
#include <string>

struct Order {
    int         id;
    double      price;
    std::string symbol;
    Order(int id, double price, std::string sym)
        : id(id), price(price), symbol(std::move(sym)) {}
};

// Factory: perfectly forwards any args to T's constructor, zero copies.
template <typename T, typename... Args>
std::unique_ptr<T> make(Args&&... args) {
    return std::make_unique<T>(std::forward<Args>(args)...);
}

int main() {
    std::string sym = "AAPL";
    // sym is an lvalue — forwarded as lvalue, no copy of string until constructor moves it
    auto o = make<Order>(42, 150.25, std::move(sym));
    (void)o;
}`,
    explanation: "std::forward preserves value category: lvalue args remain lvalues (extended lifetime), rvalue args are moved — avoiding spurious copies in hot allocation paths. Combined with a pool allocator, this pattern constructs orders with zero heap traffic."
  },
  {
    id: "cpp-20260801-b1-branch-predict-likely",
    language: "cpp",
    title: "Branch Prediction Hints: [[likely]] / [[unlikely]]",
    tag: "low-latency",
    code: `#include <cstdint>

// C++20 attributes hint the branch predictor and layout optimiser.
// The compiler moves the cold path (unlikely) to a separate code section,
// keeping the hot path's instructions contiguous in the I-cache.

enum class OrderType : uint8_t { Market, Limit, Stop, StopLimit };

double compute_fill_price(OrderType type, double bid, double ask, double limit) {
    if (type == OrderType::Market) [[likely]] {
        // 95%+ of orders in most HFT books are market orders
        return (bid + ask) * 0.5;
    } else if (type == OrderType::Limit) [[unlikely]] {
        return limit;
    } else [[unlikely]] {
        // Stop orders: rare, complex — cold path
        return 0.0;
    }
}`,
    explanation: "[[likely]] / [[unlikely]] are zero-cost at runtime — they only inform the compiler. Placing the hot branch first and marking it [[likely]] ensures the fast path's machine code stays cache-local, reducing branch misprediction penalty on tight loops."
  },
  {
    id: "cpp-20260801-b1-hugepage-alloc",
    language: "cpp",
    title: "Huge Page Allocation for Order Book Arrays",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <cstring>
#include <stdexcept>

// Allocates memory backed by 2 MiB huge pages (Linux).
// Reduces TLB misses for large, frequently-accessed book arrays.
void* alloc_hugepage(std::size_t bytes) {
    // Round up to 2 MiB boundary
    constexpr std::size_t HP = 2ul << 20;
    std::size_t aligned = (bytes + HP - 1) & ~(HP - 1);

    void* p = mmap(nullptr, aligned,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                   -1, 0);
    if (p == MAP_FAILED) {
        // Fallback: plain mmap if huge pages are not available
        p = mmap(nullptr, aligned, PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (p == MAP_FAILED) throw std::bad_alloc{};
    }
    std::memset(p, 0, aligned); // touch pages to avoid lazy faults later
    return p;
}`,
    explanation: "A 2 MiB huge page covers 512x more virtual range per TLB entry than a 4 KiB base page. For a 10-million-slot order book array, this collapses TLB pressure from thousands of entries to a handful, cutting memory-access latency on the critical path."
  },
  {
    id: "cpp-20260801-b1-fix-parser",
    language: "cpp",
    title: "Zero-Copy FIX Protocol Tag Parser",
    tag: "market-data",
    code: `#include <string_view>
#include <charconv>
#include <unordered_map>
#include <cstdint>

// Parse a FIX message into tag->value string_view map.
// Zero allocation: views into the original buffer.
using FixMap = std::unordered_map<uint32_t, std::string_view>;

FixMap parse_fix(std::string_view msg, char delim = '\x01') {
    FixMap out;
    out.reserve(32);
    std::size_t pos = 0;
    while (pos < msg.size()) {
        auto eq  = msg.find('=', pos);
        if (eq == std::string_view::npos) break;
        auto sep = msg.find(delim, eq + 1);
        if (sep == std::string_view::npos) sep = msg.size();

        uint32_t tag = 0;
        std::from_chars(msg.data() + pos, msg.data() + eq, tag);
        std::string_view val = msg.substr(eq + 1, sep - eq - 1);
        out[tag] = val;
        pos = sep + 1;
    }
    return out;
}

// Tag 49=SenderCompID, 55=Symbol, 44=Price
// Usage: auto m = parse_fix("8=FIX.4.2\x0149=ME\x0155=AAPL\x0144=150.25\x01");`,
    explanation: "std::from_chars and std::string_view parse FIX fields without any heap allocation — the value views directly into the receive buffer. This is the canonical pattern for ultra-low-latency FIX parsing where even small_string SSO is too slow."
  },
  {
    id: "cpp-20260801-b1-custom-hash-price",
    language: "cpp",
    title: "Custom Hash for Fixed-Point Price Keys",
    tag: "containers",
    code: `#include <unordered_map>
#include <cstdint>
#include <bit>

// Prices stored as integer ticks avoid floating-point hash instability.
// Custom hash uses a finalisation mix for better distribution.
struct TickHash {
    std::size_t operator()(int64_t tick) const noexcept {
        // Murmur3-style finalise: avalanche bits
        uint64_t h = static_cast<uint64_t>(tick);
        h ^= h >> 33;
        h *= 0xff51afd7ed558ccdULL;
        h ^= h >> 33;
        h *= 0xc4ceb9fe1a85ec53ULL;
        h ^= h >> 33;
        return static_cast<std::size_t>(h);
    }
};

// Map from price tick to aggregated quantity (level-2 book)
using PriceBook = std::unordered_map<int64_t, int, TickHash>;

int main() {
    PriceBook book;
    book.reserve(4096);           // pre-bucket to avoid rehash
    book[15025] += 500;           // price 150.25 at tick size 0.01
    book[15024] += 300;
}`,
    explanation: "Default std::hash<int64_t> on many implementations is identity, causing clustering when tick prices concentrate in a narrow range. The Murmur3 finaliser disperses the bits, eliminating bucket collisions at the busiest price levels."
  },
  {
    id: "cpp-20260801-b1-compile-time-greeks",
    language: "cpp",
    title: "Compile-Time Black-Scholes Delta via constexpr",
    tag: "numerics",
    code: `#include <cmath>
#include <numbers>
#include <array>

// constexpr normal CDF approximation (Abramowitz & Stegun 26.2.17)
constexpr double norm_cdf(double x) {
    constexpr double a1 = 0.319381530, a2 = -0.356563782,
                     a3 = 1.781477937, a4 = -1.821255978, a5 = 1.330274429;
    double t   = 1.0 / (1.0 + 0.2316419 * std::abs(x));
    double poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
    double pdf  = std::exp(-0.5 * x * x) / std::sqrt(2.0 * std::numbers::pi);
    double cdf  = 1.0 - pdf * poly;
    return x >= 0 ? cdf : 1.0 - cdf;
}

constexpr double bs_delta_call(double S, double K, double r, double sigma, double T) {
    double d1 = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T)
                / (sigma * std::sqrt(T));
    return norm_cdf(d1);
}

// Evaluated entirely at compile time for known strikes
constexpr std::array<double, 3> deltas = {
    bs_delta_call(100, 90, 0.05, 0.2, 1.0),
    bs_delta_call(100, 100, 0.05, 0.2, 1.0),
    bs_delta_call(100, 110, 0.05, 0.2, 1.0),
};`,
    explanation: "constexpr evaluation of Black-Scholes at compile time lets the compiler embed pre-computed Greeks for known strike/maturity grids as static constants — zero runtime cost. This technique powers pre-computed option surfaces stored in lookup tables."
  },
  {
    id: "cpp-20260801-b1-fd-theta-scheme",
    language: "cpp",
    title: "Crank-Nicolson Finite-Difference PDE Pricer (theta=0.5)",
    tag: "numerics",
    code: `#include <vector>
#include <algorithm>
#include <cmath>

// Crank-Nicolson (theta=0.5) for Black-Scholes PDE.
// Solves: dV/dt + 0.5*sigma^2*S^2*d2V/dS2 + r*S*dV/dS - r*V = 0
// Grid: S in [0, S_max], time from T back to 0.
std::vector<double> cn_pricer(double K, double T, double r,
                               double sigma, int M, int N) {
    double S_max = 3.0 * K;
    double dS    = S_max / M;
    double dt    = T / N;
    double theta = 0.5;            // Crank-Nicolson

    std::vector<double> V(M + 1);  // option values at current time step
    // Terminal condition: European call payoff
    for (int i = 0; i <= M; ++i)
        V[i] = std::max(i * dS - K, 0.0);

    // Time-stepping (tridiagonal system — Thomas algorithm)
    for (int n = N - 1; n >= 0; --n) {
        std::vector<double> a(M - 1), b(M - 1), c(M - 1), rhs(M - 1);
        for (int i = 1; i < M; ++i) {
            double S  = i * dS;
            double al = 0.5 * sigma * sigma * S * S / (dS * dS);
            double be = r * S / (2.0 * dS);
            a[i-1] = -theta * dt * (al - be);
            b[i-1] =  1.0 + theta * dt * (2.0 * al + r);
            c[i-1] = -theta * dt * (al + be);
            rhs[i-1] = (1.0 - theta) * dt * (al - be) * V[i-1]
                     + (1.0 - (1.0 - theta) * dt * (2.0 * al + r)) * V[i]
                     + (1.0 - theta) * dt * (al + be) * V[i+1];
        }
        // Thomas algorithm forward sweep
        for (int i = 1; i < M - 1; ++i) {
            double w = a[i] / b[i-1];
            b[i]   -= w * c[i-1];
            rhs[i] -= w * rhs[i-1];
        }
        // Back substitution
        V[M-1] = rhs[M-2] / b[M-2];
        for (int i = M - 3; i >= 0; --i)
            V[i+1] = (rhs[i] - c[i] * V[i+2]) / b[i];
        V[0]  = 0.0;         // boundary: S=0 -> call worthless
        V[M]  = S_max - K * std::exp(-r * (n + 1) * dt); // upper boundary
    }
    return V; // V[i] = price at S = i*dS
}`,
    explanation: "Crank-Nicolson blends explicit (theta=0) and implicit (theta=1) schemes, achieving O(dt^2) convergence — second-order in both space and time — while remaining unconditionally stable. The Thomas algorithm solves the tridiagonal system in O(M) per time step."
  },
  {
    id: "cpp-20260801-b1-barrier-option-mc",
    language: "cpp",
    title: "Barrier Option Monte Carlo (Down-and-Out Call)",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <cstddef>

// Down-and-out call: knocked out if S drops below barrier B at any step.
// Euler-Maruyama discretisation of GBM.
double barrier_mc_price(double S0, double K, double B, double r,
                        double sigma, double T,
                        std::size_t paths, std::size_t steps,
                        uint64_t seed = 42) {
    std::mt19937_64 rng{seed};
    std::normal_distribution<double> norm{0.0, 1.0};

    double dt    = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);
    double total = 0.0;

    for (std::size_t p = 0; p < paths; ++p) {
        double S = S0;
        bool knocked_out = false;
        for (std::size_t s = 0; s < steps; ++s) {
            S *= std::exp(drift + vol * norm(rng));
            if (S <= B) { knocked_out = true; break; }
        }
        total += knocked_out ? 0.0 : std::max(S - K, 0.0);
    }
    return disc * total / paths;
}`,
    explanation: "Euler-Maruyama simulates GBM with a log-normal step, preserving positivity. The discrete-monitoring approximation understimates the true continuous-barrier price by the Broadie-Glasserman continuity correction (O(1/sqrt(steps))); use Brownian bridge refinement for high accuracy."
  },
  {
    id: "cpp-20260801-b1-asian-option-mc",
    language: "cpp",
    title: "Geometric Asian Option MC with Control Variate",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <numeric>
#include <vector>
#include <cstddef>

// Arithmetic Asian call (average strike on monitoring dates).
// Control variate: geometric Asian has a closed-form price.
double geometric_asian_exact(double S, double K, double r,
                              double sigma, double T, std::size_t n) {
    double sig_g = sigma * std::sqrt((2.0 * n + 1.0) / (6.0 * (n + 1.0)));
    double mu_g  = 0.5 * (r - 0.5 * sigma * sigma) + 0.5 * sig_g * sig_g;
    // Use standard BS formula on geometric average
    double d1 = (std::log(S / K) + (mu_g + 0.5 * sig_g * sig_g) * T)
                / (sig_g * std::sqrt(T));
    double d2 = d1 - sig_g * std::sqrt(T);
    auto N    = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    return S * std::exp((mu_g - r) * T) * N(d1) - K * std::exp(-r * T) * N(d2);
}

double asian_mc_cv(double S0, double K, double r, double sigma,
                   double T, std::size_t n_obs, std::size_t paths,
                   uint64_t seed = 42) {
    std::mt19937_64 rng{seed};
    std::normal_distribution<double> norm{0.0, 1.0};
    double dt   = T / n_obs;
    double disc = std::exp(-r * T);
    double geo_exact = geometric_asian_exact(S0, K, r, sigma, T, n_obs);

    double sum_arith = 0, sum_geo = 0, sum_cross = 0;
    for (std::size_t p = 0; p < paths; ++p) {
        double S = S0, log_sum = 0, arith_sum = 0;
        for (std::size_t i = 0; i < n_obs; ++i) {
            S *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*std::sqrt(dt)*norm(rng));
            arith_sum += S;
            log_sum   += std::log(S);
        }
        double arith_avg = arith_sum / n_obs;
        double geo_avg   = std::exp(log_sum / n_obs);
        double Y = disc * std::max(arith_avg - K, 0.0);
        double X = disc * std::max(geo_avg   - K, 0.0);
        sum_arith += Y; sum_geo += X; sum_cross += X * Y;
    }
    // OLS beta for control variate
    double mu_Y = sum_arith / paths, mu_X = sum_geo / paths;
    double cov  = sum_cross / paths - mu_X * mu_Y;
    double var  = (sum_geo * sum_geo / paths / paths);  // approx var(X)
    double beta = (var > 1e-12) ? cov / var : 0.0;
    return mu_Y - beta * (mu_X - geo_exact);
}`,
    explanation: "The geometric Asian has a closed-form price (since the log of the geometric average is normal); using it as a control variate for the arithmetic Asian can cut MC variance by 90%+. The OLS beta maximises variance reduction for the specific simulated paths."
  },
  {
    id: "cpp-20260801-b1-numa-aware",
    language: "cpp",
    title: "NUMA-Aware Thread Pinning for Market Data Threads",
    tag: "low-latency",
    code: `#include <pthread.h>
#include <numa.h>          // libnuma
#include <sched.h>
#include <stdexcept>
#include <cstdint>

// Pin current thread to a specific CPU and NUMA node.
// Market-data receiver thread should share NUMA node with the NIC.
void pin_thread_to_cpu(int cpu, int numa_node) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(cpu, &cpuset);
    if (pthread_setaffinity_np(pthread_self(), sizeof(cpuset), &cpuset) != 0)
        throw std::runtime_error("setaffinity failed");

    if (numa_available() >= 0) {
        struct bitmask* bm = numa_allocate_nodemask();
        numa_bitmask_setbit(bm, numa_node);
        numa_set_membind(bm);     // allocations prefer local NUMA memory
        numa_free_nodemask(bm);
    }
}

// Usage in market-data processing thread:
//   pin_thread_to_cpu(4, 0);  // CPU 4 on NUMA node 0 (same as 10GbE NIC)`,
    explanation: "Cross-NUMA memory access adds 40-100 ns of latency on dual-socket servers. Pinning the market-data thread to the NUMA node hosting the NIC keeps DMA-written packet buffers in local memory, avoiding the QPI/UPI interconnect on every read."
  },
  {
    id: "cpp-20260801-b1-prefetch-hint",
    language: "cpp",
    title: "Software Prefetch for Order Book Iteration",
    tag: "low-latency",
    code: `#include <immintrin.h>   // _mm_prefetch
#include <vector>
#include <cstddef>

struct PriceLevel { double price; int qty; double vwap; char pad[44]; };

// Walk order book levels; prefetch N levels ahead into L1 cache.
// Critical when random pointer-chasing would otherwise stall the pipeline.
double sum_vwap_prefetch(const std::vector<PriceLevel>& levels, int lookahead = 8) {
    double total = 0.0;
    const std::size_t n = levels.size();
    for (std::size_t i = 0; i < n; ++i) {
        if (i + lookahead < n)
            _mm_prefetch(reinterpret_cast<const char*>(&levels[i + lookahead]),
                         _MM_HINT_T0);       // prefetch to L1
        total += levels[i].vwap;
    }
    return total;
}`,
    explanation: "_mm_prefetch is a hint (not a guarantee) that brings a cache line into L1 roughly 300-400 cycles early. Lookahead of 8 elements works well when each PriceLevel fits in one cache line; tune lookahead empirically to match the prefetch pipeline depth of the target CPU."
  },
  {
    id: "cpp-20260801-b1-market-data-parser-udp",
    language: "cpp",
    title: "Kernel-Bypass UDP Market Data Parser (DPDK-style)",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <netinet/in.h>   // ntohl, ntohs

// Compact binary market-data frame (e.g. CME MDP3 simplified):
// [uint8  msg_type][uint64 seq_no][uint32 price_ticks][uint32 qty][uint16 flags]
struct MDFrame {
    uint8_t  msg_type;
    uint64_t seq_no;
    uint32_t price;
    uint32_t qty;
    uint16_t flags;
} __attribute__((packed));

struct Tick { uint64_t seq; double price; uint32_t qty; bool is_trade; };

Tick parse_frame(const uint8_t* buf) {
    MDFrame f;
    std::memcpy(&f, buf, sizeof(f));       // alignment-safe copy
    return {
        __builtin_bswap64(f.seq_no),       // network byte order -> host
        __builtin_bswap32(f.price) * 0.01, // ticks to price
        __builtin_bswap32(f.qty),
        (f.msg_type == 0x02)               // 0x02 = trade message
    };
}`,
    explanation: "__attribute__((packed)) and memcpy-then-bswap is the canonical kernel-bypass parse: it avoids UB from misaligned pointer casts while letting the compiler emit a single movbe or bswap instruction. This pattern matches how Solarflare/Mellanox drivers deliver raw UDP payloads."
  },
  {
    id: "cpp-20260801-b1-template-mixin-crtp",
    language: "cpp",
    title: "CRTP Mixin for Printable / Comparable Order Types",
    tag: "sfinae",
    code: `#include <iostream>
#include <compare>

// CRTP base adds comparison operators without virtual dispatch.
template <typename Derived>
struct Comparable {
    auto operator<=>(const Comparable& o) const {
        return static_cast<const Derived&>(*this).key()
           <=> static_cast<const Derived&>(o).key();
    }
    bool operator==(const Comparable& o) const {
        return ((*this) <=> o) == 0;
    }
};

template <typename Derived>
struct Printable {
    void print(std::ostream& os = std::cout) const {
        static_cast<const Derived&>(*this).do_print(os);
    }
};

struct Order : Comparable<Order>, Printable<Order> {
    int id; double price;
    Order(int i, double p) : id(i), price(p) {}
    double key() const { return price; }
    void do_print(std::ostream& os) const { os << "Order{" << id << ", " << price << "}"; }
};

int main() {
    Order a{1, 99.5}, b{2, 100.0};
    if (a < b) { a.print(); std::cout << " < "; b.print(); std::cout << "\n"; }
}`,
    explanation: "CRTP mixins add behaviour at zero runtime cost — no vtable, no virtual call overhead. The spaceship operator (<=>) synthesises all six comparisons from one definition, essential for priority-queue and sorted container use cases in order management."
  },
  {
    id: "cpp-20260801-b1-risk-engine-delta-hedge",
    language: "cpp",
    title: "Delta-Hedging Risk Engine: Greeks Aggregation",
    tag: "risk",
    code: `#include <vector>
#include <numeric>
#include <cmath>

struct Position {
    double delta;   // per-unit delta of this leg
    double qty;     // signed quantity (positive = long)
    double gamma;
    double vega;
    double theta;
};

struct PortfolioGreeks { double net_delta, net_gamma, net_vega, net_theta; };

PortfolioGreeks aggregate(const std::vector<Position>& positions) {
    PortfolioGreeks g{};
    for (const auto& p : positions) {
        g.net_delta += p.delta * p.qty;
        g.net_gamma += p.gamma * p.qty;
        g.net_vega  += p.vega  * p.qty;
        g.net_theta += p.theta * p.qty;
    }
    return g;
}

// Hedge: buy/sell underlying to zero net delta
double delta_hedge_qty(const PortfolioGreeks& g) {
    return -g.net_delta; // sell net_delta units of underlying
}`,
    explanation: "Greeks aggregate linearly across positions: portfolio delta is just sum(delta_i * qty_i). The hedge trade is the negative of net delta in underlying units. In practice you'd also account for transaction costs and delta bands to avoid churning."
  },
  {
    id: "cpp-20260801-b1-fx-arbitrage-bellman",
    language: "cpp",
    title: "FX Arbitrage Detection via Bellman-Ford (Log-Weights)",
    tag: "graph",
    code: `#include <vector>
#include <limits>
#include <cmath>
#include <string>

// Represent FX rates as a directed graph.
// Edge weight = -log(rate). Negative cycle = arbitrage opportunity.
struct Edge { int u, v; double w; };

bool detect_fx_arbitrage(int n_currencies,
                          const std::vector<Edge>& edges,
                          std::vector<double>& dist) {
    dist.assign(n_currencies, 0.0); // source = "1 unit of all currencies"

    // Relax n-1 times
    for (int iter = 0; iter < n_currencies - 1; ++iter)
        for (const auto& e : edges)
            if (dist[e.u] + e.w < dist[e.v])
                dist[e.v] = dist[e.u] + e.w;

    // If any edge still relaxes: negative cycle found (arbitrage)
    for (const auto& e : edges)
        if (dist[e.u] + e.w < dist[e.v] - 1e-12)
            return true;  // arbitrage exists
    return false;
}

// Build edges: edge(u->v) weight = -log(rate[u][v])
// A negative cycle means product of rates along the cycle > 1.`,
    explanation: "Converting exchange rates to -log(rate) transforms the product-of-rates arbitrage condition (product > 1) into a sum-of-weights negative cycle (sum < 0), which Bellman-Ford detects exactly. The 1e-12 tolerance avoids false positives from floating-point rounding."
  },
  {
    id: "cpp-20260801-b1-hash-map-hopscotch",
    language: "cpp",
    title: "Hopscotch Hash Map for Order-ID Lookup",
    tag: "containers",
    code: `#include <cstdint>
#include <array>
#include <optional>
#include <cstring>
#include <limits>

// Simplified hopscotch hash map: each bucket has a neighbourhood bitmap.
// Lookups guaranteed within H probes — crucial for order-cancel paths.
template <typename K, typename V, std::size_t Cap = 1024, std::size_t H = 8>
struct HopscotchMap {
    static_assert((Cap & (Cap - 1)) == 0, "Cap must be power of 2");
    struct Bucket { K key; V val; uint8_t hop = 0; bool used = false; };
    std::array<Bucket, Cap> table_{};

    bool insert(K k, V v) {
        std::size_t h = std::hash<K>{}(k) & (Cap - 1);
        // Find empty slot within H hops
        for (std::size_t d = 0; d < H; ++d) {
            auto& b = table_[(h + d) & (Cap - 1)];
            if (!b.used) {
                b = {k, v, 0, true};
                table_[h].hop |= (1u << d);
                return true;
            }
        }
        return false; // full neighbourhood — needs resize
    }
    std::optional<V> find(K k) const {
        std::size_t h = std::hash<K>{}(k) & (Cap - 1);
        uint8_t hop = table_[h].hop;
        while (hop) {
            int d = __builtin_ctz(hop); hop &= hop - 1;
            const auto& b = table_[(h + d) & (Cap - 1)];
            if (b.used && b.key == k) return b.val;
        }
        return std::nullopt;
    }
};`,
    explanation: "Hopscotch hashing bounds the probe distance to H cache-line reads in the worst case, giving O(1) worst-case lookups unlike standard open addressing. The hop bitmap encodes which slots in the neighbourhood are occupied, making lookup as fast as a single popcount."
  },
  {
    id: "cpp-20260801-b1-lookback-option",
    language: "cpp",
    title: "Lookback Option MC (Floating Strike)",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <cstddef>

// Floating-strike lookback call: payoff = S_T - min(S_t, t in [0,T])
double lookback_mc(double S0, double r, double sigma, double T,
                   std::size_t steps, std::size_t paths, uint64_t seed = 42) {
    std::mt19937_64 rng{seed};
    std::normal_distribution<double> Z{0.0, 1.0};
    double dt   = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);
    double total = 0.0;

    for (std::size_t p = 0; p < paths; ++p) {
        double S = S0, S_min = S0;
        for (std::size_t s = 0; s < steps; ++s) {
            S *= std::exp(drift + vol * Z(rng));
            S_min = std::min(S_min, S);
        }
        total += std::max(S - S_min, 0.0); // always positive by construction
    }
    return disc * total / paths;
}`,
    explanation: "The floating-strike lookback always has positive intrinsic value (S_T >= S_min), so its MC estimate has lower variance than barrier options. Note the closed-form exists (Goldman-Sosin-Gatto 1979) — use MC primarily to validate it or for path-dependent extensions."
  },
  {
    id: "cpp-20260801-b1-coroutine-feed",
    language: "cpp",
    title: "C++20 Coroutine Generator for Market Tick Stream",
    tag: "modern-cpp",
    code: `#include <coroutine>
#include <optional>
#include <vector>

// Minimal generator coroutine for streaming market ticks lazily.
template <typename T>
struct Generator {
    struct promise_type {
        T current;
        Generator get_return_object() { return {Handle::from_promise(*this)}; }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        std::suspend_always yield_value(T v) { current = v; return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };
    using Handle = std::coroutine_handle<promise_type>;
    Handle h;
    explicit Generator(Handle h) : h(h) {}
    ~Generator() { if (h) h.destroy(); }

    std::optional<T> next() {
        if (!h || h.done()) return std::nullopt;
        h.resume();
        if (h.done()) return std::nullopt;
        return h.promise().current;
    }
};

struct Tick { double price; int qty; };

Generator<Tick> tick_stream(std::vector<Tick> ticks) {
    for (auto& t : ticks)
        co_yield t;
}

int main() {
    auto stream = tick_stream({{100.0, 100}, {101.0, 200}, {99.5, 150}});
    while (auto tick = stream.next()) { (void)*tick; }
}`,
    explanation: "C++20 coroutines enable lazy, zero-allocation generators: the tick_stream suspends at each co_yield, resuming only when next() is called. This models backpressure naturally — the consumer drives the producer — without threads or queues."
  },
  {
    id: "cpp-20260801-b1-matrix-exp-markov",
    language: "cpp",
    title: "Matrix Exponentiation for Credit Transition Matrices",
    tag: "numerics",
    code: `#include <array>
#include <cmath>

// 3x3 matrix multiply (rating states: AAA, BBB, Default)
constexpr int N = 3;
using Mat = std::array<std::array<double, N>, N>;

Mat matmul(const Mat& A, const Mat& B) {
    Mat C{};
    for (int i = 0; i < N; ++i)
        for (int k = 0; k < N; ++k) if (A[i][k])
            for (int j = 0; j < N; ++j)
                C[i][j] += A[i][k] * B[k][j];
    return C;
}

// Compute A^n via repeated squaring (O(N^3 log n))
Mat mat_pow(Mat A, int n) {
    Mat result{};
    for (int i = 0; i < N; ++i) result[i][i] = 1.0; // identity
    while (n > 0) {
        if (n & 1) result = matmul(result, A);
        A = matmul(A, A);
        n >>= 1;
    }
    return result;
}

// Annual rating transition matrix -> n-year matrix
// E.g. P^5 gives 5-year default probabilities from each rating
Mat multi_period_transition(const Mat& annual_P, int years) {
    return mat_pow(annual_P, years);
}`,
    explanation: "Repeated squaring computes the n-year credit transition matrix in O(N^3 log n) time — critical when pricing multi-year CDOs or computing multi-period PD term structures. For continuous time, use eigendecomposition: P(t) = exp(Q*t) where Q is the generator matrix."
  },
  {
    id: "cpp-20260801-b1-order-book-hash-array",
    language: "cpp",
    title: "Hash + Sorted Array Hybrid Order Book",
    tag: "containers",
    code: `#include <unordered_map>
#include <map>
#include <cstdint>
#include <optional>

// Two-structure order book:
//  - unordered_map<order_id, price>  : O(1) cancel by order id
//  - map<price, int>                  : O(log n) best-bid/ask query
// Trade-off: slightly more memory, but cancel path avoids tree traversal.
class OrderBook {
    std::unordered_map<uint64_t, int64_t> id_to_price_; // order_id -> tick price
    std::map<int64_t, int> bid_levels_;                 // price -> qty (buy side)
    std::map<int64_t, int> ask_levels_;                 // price -> qty (sell side)
public:
    void add_order(uint64_t id, int64_t price, int qty, bool is_buy) {
        id_to_price_[id] = price;
        (is_buy ? bid_levels_ : ask_levels_)[price] += qty;
    }
    bool cancel_order(uint64_t id, int qty, bool is_buy) {
        auto it = id_to_price_.find(id);
        if (it == id_to_price_.end()) return false;
        auto& lvl = (is_buy ? bid_levels_ : ask_levels_)[it->second];
        lvl -= qty;
        if (lvl <= 0) (is_buy ? bid_levels_ : ask_levels_).erase(it->second);
        id_to_price_.erase(it);
        return true;
    }
    std::optional<int64_t> best_bid() const {
        if (bid_levels_.empty()) return std::nullopt;
        return bid_levels_.rbegin()->first; // highest price
    }
    std::optional<int64_t> best_ask() const {
        if (ask_levels_.empty()) return std::nullopt;
        return ask_levels_.begin()->first;  // lowest price
    }
};`,
    explanation: "The dual-structure design separates two distinct access patterns: O(1) cancel by order ID (via hash map) and O(log n) price-priority queries (via std::map). Pure price-tree designs force O(log n) cancel by scanning levels; this avoids that when cancels dominate."
  },
  {
    id: "cpp-20260801-b1-rate-limiter-token-bucket",
    language: "cpp",
    title: "Lock-Free Token Bucket Rate Limiter",
    tag: "lock-free",
    code: `#include <atomic>
#include <chrono>
#include <cstdint>
#include <algorithm>

// Token bucket: burst up to capacity tokens; refill at rate tokens/sec.
// Thread-safe via atomic CAS — no mutex on the hot path.
class TokenBucket {
    std::atomic<int64_t> tokens_;          // scaled by SCALE to avoid floats
    std::atomic<int64_t> last_refill_ns_;  // nanoseconds since epoch
    int64_t capacity_scaled_;
    int64_t rate_per_ns_;                  // tokens per nanosecond (scaled)
    static constexpr int64_t SCALE = 1'000'000;

public:
    TokenBucket(double capacity, double rate_per_sec)
        : capacity_scaled_(static_cast<int64_t>(capacity * SCALE)),
          rate_per_ns_(static_cast<int64_t>(rate_per_sec * SCALE / 1e9)) {
        tokens_.store(capacity_scaled_);
        last_refill_ns_.store(now_ns());
    }

    bool try_consume(int64_t n = 1) {
        refill();
        int64_t want = n * SCALE;
        int64_t cur  = tokens_.load(std::memory_order_relaxed);
        while (cur >= want) {
            if (tokens_.compare_exchange_weak(cur, cur - want,
                                              std::memory_order_acq_rel))
                return true;
        }
        return false;
    }
private:
    int64_t now_ns() const {
        return std::chrono::duration_cast<std::chrono::nanoseconds>(
            std::chrono::steady_clock::now().time_since_epoch()).count();
    }
    void refill() {
        int64_t now  = now_ns();
        int64_t last = last_refill_ns_.load(std::memory_order_relaxed);
        int64_t gen  = (now - last) * rate_per_ns_;
        if (gen <= 0) return;
        if (last_refill_ns_.compare_exchange_strong(last, now)) {
            int64_t cur = tokens_.load(std::memory_order_relaxed);
            tokens_.store(std::min(cur + gen, capacity_scaled_),
                          std::memory_order_release);
        }
    }
};`,
    explanation: "Scaling tokens by 1e6 avoids floating-point arithmetic inside the CAS loop, eliminating FP rounding races. The refill CAS ensures only one thread advances the clock, preventing double-refill in concurrent scenarios without any mutex."
  },
];
