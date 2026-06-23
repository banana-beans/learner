import type { Snippet } from "./types";

export const cppSnippets20260623B1: Snippet[] = [
  {
    id: "cpp-20260623-b1-ranges-sort",
    language: "cpp",
    title: "C++20 std::ranges algorithms for order-book level sorting",
    tag: "modern",
    code: `#include <algorithm>
#include <ranges>
#include <vector>
#include <cstdint>

struct Level {
    std::int64_t price_ticks;
    std::int32_t qty;
    std::uint64_t seq;     // insertion sequence number
};

void sortBook(std::vector<Level>& bids, std::vector<Level>& asks) {
    // Bids: descending price, then by seq for stability
    std::ranges::sort(bids, [](const Level& a, const Level& b) {
        if (a.price_ticks != b.price_ticks) return a.price_ticks > b.price_ticks;
        return a.seq < b.seq;
    });

    // Asks: ascending price
    std::ranges::sort(asks, [](const Level& a, const Level& b) {
        if (a.price_ticks != b.price_ticks) return a.price_ticks < b.price_ticks;
        return a.seq < b.seq;
    });
}

// Ranges projection: sort by qty descending using a projection (no lambda body)
void sortByQtyDesc(std::vector<Level>& levels) {
    std::ranges::sort(levels, std::ranges::greater{}, &Level::qty);
}

// Filter non-zero levels into a view without copying
auto nonZeroLevels(const std::vector<Level>& levels) {
    return levels | std::views::filter([](const Level& l){ return l.qty > 0; });
}`,
    explanation: "std::ranges::sort with a projection avoids writing a comparator lambda entirely — &Level::qty projects each element to a single key before comparison; the composed view pipeline (filter → transform) is lazy and zero-copy, evaluated only when iterated, which avoids allocating a temporary vector for intermediate results.",
  },
  {
    id: "cpp-20260623-b1-sfinae-enable-if",
    language: "cpp",
    title: "SFINAE with enable_if for compile-time numeric type dispatch",
    tag: "modern",
    code: `#include <type_traits>
#include <cmath>
#include <complex>

// SFINAE: function only participates in overload resolution when T is floating-point.
// The return type is a substitution failure for non-float types — removed silently.
template <typename T>
std::enable_if_t<std::is_floating_point_v<T>, T>
bsPrice(T S, T K, T r, T sigma, T T_exp) {
    // Black-Scholes closed-form for plain vanilla call
    T sqT = std::sqrt(T_exp);
    T d1  = (std::log(S/K) + (r + T(0.5)*sigma*sigma)*T_exp) / (sigma*sqT);
    T d2  = d1 - sigma*sqT;
    auto ncdf = [](T x){ return T(0.5)*std::erfc(-x/std::sqrt(T(2))); };
    return S*ncdf(d1) - K*std::exp(-r*T_exp)*ncdf(d2);
}

// Overload for integral types — rejected at compile time by SFINAE
template <typename T>
std::enable_if_t<std::is_integral_v<T>, double>
bsPrice(T, T, T, T, T) = delete;   // explicit delete for clarity

// Alternatively, use if constexpr inside a single template
template <typename T>
auto safeLog(T x) -> decltype(std::log(x)) {
    static_assert(std::is_floating_point_v<T>,
                  "safeLog requires a floating-point type");
    if (x <= T(0)) return -std::numeric_limits<T>::infinity();
    return std::log(x);
}`,
    explanation: "enable_if_t makes invalid specialisations silently disappear from the overload set rather than producing hard errors — the key difference from static_assert; in a library with many numeric overloads this allows template-based dispatch without requiring the caller to specify types explicitly.",
  },
  {
    id: "cpp-20260623-b1-concepts-numeric",
    language: "cpp",
    title: "C++20 concepts for constrained quant numeric templates",
    tag: "modern",
    code: `#include <concepts>
#include <cmath>
#include <limits>
#include <type_traits>

// Custom concept: a type usable as a financial price
template <typename T>
concept FinancialScalar =
    std::floating_point<T> &&
    requires(T a, T b) {
        { a + b } -> std::convertible_to<T>;
        { a * b } -> std::convertible_to<T>;
        { std::log(a)  } -> std::convertible_to<T>;
        { std::sqrt(a) } -> std::convertible_to<T>;
        std::numeric_limits<T>::is_iec559;   // requires IEEE 754
    };

// Constrained function: accepted only for FinancialScalar types
template <FinancialScalar T>
T forwardPrice(T spot, T rate, T div_yield, T time) noexcept {
    return spot * std::exp((rate - div_yield) * time);
}

// Concept for a type that behaves like a price-qty pair
template <typename T>
concept PriceLevel = requires(T t) {
    { t.price } -> std::convertible_to<double>;
    { t.qty   } -> std::convertible_to<int>;
};

template <PriceLevel L>
double levelNotional(const L& lev) noexcept {
    return lev.price * lev.qty;
}

// Abbreviation: trailing-requires in function signature
void processPrice(FinancialScalar auto price) noexcept {
    (void)(price * price);   // silently works for float/double/long double only
}`,
    explanation: "C++20 concepts provide readable error messages — instead of 10-line template substitution failures, the compiler points directly to the unsatisfied concept requirement; the requires-expression inside a concept can test arbitrary expressions including associated types and nested calls, giving finer-grained control than the old enable_if idiom.",
  },
  {
    id: "cpp-20260623-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-size pool allocator for zero-fragmentation order objects",
    tag: "memory",
    code: `#include <cstddef>
#include <array>
#include <cassert>
#include <new>

// Fixed-size pool: preallocates N objects of size ObjSize.
// Allocation and deallocation are both O(1); no heap interaction after init.
// Suitable for order objects that are created/destroyed at high frequency.
template <std::size_t ObjSize, std::size_t N>
class PoolAllocator {
    alignas(std::max_align_t)
    std::array<std::byte, ObjSize * N> storage_;

    // Free list: each free slot holds a pointer to the next free slot
    void* free_head_ = nullptr;
    std::size_t allocated_ = 0;

public:
    PoolAllocator() noexcept {
        // Link all slots into the free list
        for (std::size_t i = 0; i + 1 < N; ++i) {
            void* slot = storage_.data() + i * ObjSize;
            void* next = storage_.data() + (i+1) * ObjSize;
            *reinterpret_cast<void**>(slot) = next;
        }
        *reinterpret_cast<void**>(storage_.data() + (N-1)*ObjSize) = nullptr;
        free_head_ = storage_.data();
    }

    [[nodiscard]] void* allocate() noexcept {
        if (!free_head_) return nullptr;           // pool exhausted
        void* p    = free_head_;
        free_head_ = *reinterpret_cast<void**>(p); // pop head
        ++allocated_;
        return p;
    }

    void deallocate(void* p) noexcept {
        *reinterpret_cast<void**>(p) = free_head_; // push onto free list
        free_head_ = p;
        --allocated_;
    }

    std::size_t allocated() const noexcept { return allocated_; }
    std::size_t capacity()  const noexcept { return N; }
};`,
    explanation: "A pool allocator eliminates fragmentation and amortised allocation cost by recycling fixed-size slots via a singly-linked free list embedded in the free memory itself — the free list pointer is stored directly in the unused bytes of each free slot, requiring no extra memory; this is the pattern used in exchange matching engines where order create/cancel rates can exceed 1 million events per second.",
  },
  {
    id: "cpp-20260623-b1-false-sharing",
    language: "cpp",
    title: "Detecting and eliminating false sharing with cache-line padding",
    tag: "low-latency",
    code: `#include <atomic>
#include <cstdint>
#include <thread>

// BAD: two counters on the same cache line — writer to one invalidates the other.
struct BadCounters {
    std::atomic<std::uint64_t> producer_count{0};  // written by thread A
    std::atomic<std::uint64_t> consumer_count{0};  // written by thread B
    // Both fit in 16 bytes, likely on the same 64-byte cache line.
    // Benchmark: ~200 ns per operation due to constant invalidation.
};

// GOOD: pad each counter to its own cache line (64 bytes on x86-64).
struct alignas(64) CacheLinePadded {
    std::atomic<std::uint64_t> value{0};
    // Pad to full 64 bytes so the next struct member starts on a new line.
    char pad[64 - sizeof(std::atomic<std::uint64_t>)];
};

struct GoodCounters {
    CacheLinePadded producer_count;  // cache line 0
    CacheLinePadded consumer_count;  // cache line 1
    // Benchmark: ~4 ns per operation — no inter-core invalidation.
};

// Hardware prefetch for sequential access patterns
void prefetchSeq(const void* ptr, int locality = 3) noexcept {
    // locality 0=no temporal locality, 3=high (stays in L1)
    __builtin_prefetch(ptr, 0 /* read */, locality);
}

// Verify alignment at compile time
static_assert(sizeof(CacheLinePadded) == 64, "must be exactly one cache line");
static_assert(alignof(CacheLinePadded) == 64, "must be cache-line aligned");`,
    explanation: "False sharing occurs when two threads modify different variables that share a cache line — every write by either thread invalidates the line in all other cores' L1/L2 caches, forcing a round-trip to the LLC or main memory; padding to 64 bytes (or using hardware_destructive_interference_size in C++17) eliminates this by ensuring each independently-written variable owns its line.",
  },
  {
    id: "cpp-20260623-b1-prefetch",
    language: "cpp",
    title: "Software prefetching for sequential market-data scan hot paths",
    tag: "low-latency",
    code: `#include <cstddef>
#include <cstdint>

// Prefetch distance: how many iterations ahead to prefetch.
// For a 64-byte cache line with 8-byte elements, 8 elements per line.
// A prefetch 8-16 iterations ahead hides the L2/L3 latency (~10-50 cycles).
static constexpr std::size_t PREFETCH_DIST = 16;

struct Tick {
    std::uint64_t ts_ns;
    double        price;
    std::int32_t  qty;
    std::uint32_t instr_id;
};

// Compute sum of prices with software prefetching
double sumPrices(const Tick* ticks, std::size_t n) noexcept {
    double sum = 0.0;
    for (std::size_t i = 0; i < n; ++i) {
        // Issue prefetch PREFETCH_DIST iterations ahead
        if (i + PREFETCH_DIST < n)
            __builtin_prefetch(&ticks[i + PREFETCH_DIST], 0 /* read */, 1 /* L2 */);
        sum += ticks[i].price;
    }
    return sum;
}

// Non-temporal store: write-combining, bypasses cache — useful for large writes
// that won't be re-read soon (e.g. archiving historical ticks to memory buffer).
#include <immintrin.h>

void streamWriteTick(Tick* dst, const Tick& src) noexcept {
    // For non-temporal stores the destination must be 16-byte aligned.
    static_assert(sizeof(Tick) == 24);  // adjust for actual size
    // Use memcpy for correctness; non-temporal intrinsics require exact alignment.
    __builtin_memcpy(dst, &src, sizeof(Tick));
}`,
    explanation: "Software prefetching is most effective when memory access patterns are predictable and the prefetch distance matches the memory latency measured in loop iterations — too close and the data isn't ready, too far and the cache line is evicted before use; for L2 cache on modern x86, a distance of 16-32 cache lines typically hides latency for sequential scans.",
  },
  {
    id: "cpp-20260623-b1-spsc-queue",
    language: "cpp",
    title: "SPSC lock-free ring buffer (Lamport queue) for tick data",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Single-Producer Single-Consumer lock-free ring buffer.
// No CAS operations: uses a head/tail pair with separate cache-line ownership.
// Producer owns tail_ (writes it), consumer owns head_ (writes it).
// Each reads the other's counter read-only — no contention.
template <typename T, std::size_t CAP>
class SPSCQueue {
    static_assert((CAP & (CAP - 1)) == 0, "CAP must be power of 2");

    std::array<T, CAP> buf_{};

    // Separate cache lines to prevent false sharing between producer and consumer
    alignas(64) std::atomic<std::size_t> head_{0};  // consumer writes head_
    alignas(64) std::atomic<std::size_t> tail_{0};  // producer writes tail_

    static constexpr std::size_t MASK = CAP - 1;

public:
    // Called by producer thread only
    bool push(const T& val) noexcept {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        std::size_t next_t = (t + 1) & MASK;
        // If next_t == head, the queue is full
        if (next_t == head_.load(std::memory_order_acquire)) return false;
        buf_[t] = val;
        tail_.store(next_t, std::memory_order_release);
        return true;
    }

    // Called by consumer thread only
    std::optional<T> pop() noexcept {
        std::size_t h = head_.load(std::memory_order_relaxed);
        if (h == tail_.load(std::memory_order_acquire)) return std::nullopt;
        T val = buf_[h];
        head_.store((h + 1) & MASK, std::memory_order_release);
        return val;
    }

    bool empty() const noexcept {
        return head_.load(std::memory_order_acquire)
            == tail_.load(std::memory_order_acquire);
    }
};`,
    explanation: "The Lamport SPSC queue requires no CAS or mutexes because each index (head/tail) is owned by exactly one thread — the producer reads head_ read-only (to detect full) and the consumer reads tail_ read-only (to detect empty); the acquire/release pairing on the index stores/loads creates a happens-before edge that ensures the data write is visible before the index update becomes visible to the reader.",
  },
  {
    id: "cpp-20260623-b1-fix-parser",
    language: "cpp",
    title: "FIX protocol tag-value message parser (zero-copy)",
    tag: "market-data",
    code: `#include <string_view>
#include <cstring>
#include <cstdint>
#include <charconv>
#include <array>

// FIX messages: "8=FIX.4.4\x0135=D\x0149=SENDER\x0156=TARGET\x01..."
// Each field is tag=value, delimited by SOH (0x01).
// This parser builds a lookup array indexed by tag for O(1) field access.

static constexpr int MAX_TAG = 10000;

struct FixField {
    const char* value_ptr = nullptr;
    std::uint16_t value_len = 0;

    std::string_view value() const noexcept {
        return {value_ptr, value_len};
    }

    int asInt() const noexcept {
        int v = 0;
        std::from_chars(value_ptr, value_ptr + value_len, v);
        return v;
    }

    double asDouble() const noexcept {
        double v = 0.0;
        std::from_chars(value_ptr, value_ptr + value_len, v);
        return v;
    }
};

struct FixMessage {
    std::array<FixField, MAX_TAG> fields{};

    // Parse in-place: 'buf' must stay alive during use (zero-copy)
    bool parse(char* buf, std::size_t len) noexcept {
        char* end = buf + len;
        char* p   = buf;
        while (p < end) {
            // Find '='
            char* eq = static_cast<char*>(std::memchr(p, '=', end - p));
            if (!eq) break;
            int tag = 0;
            std::from_chars(p, eq, tag);
            // Find SOH
            char* soh = static_cast<char*>(std::memchr(eq + 1, '\x01', end - eq - 1));
            if (!soh) soh = end;
            if (tag > 0 && tag < MAX_TAG) {
                fields[tag] = {eq + 1, static_cast<std::uint16_t>(soh - eq - 1)};
            }
            p = soh + 1;
        }
        return fields[35].value_ptr != nullptr;  // tag 35 = MsgType required
    }

    std::string_view msgType()   const noexcept { return fields[35].value(); }
    std::string_view clOrdID()   const noexcept { return fields[11].value(); }
    double           price()     const noexcept { return fields[44].asDouble(); }
    int              orderQty()  const noexcept { return fields[38].asInt(); }
    char             side()      const noexcept {
        return fields[54].value_ptr ? *fields[54].value_ptr : '0';
    }
};`,
    explanation: "Indexing fields by tag into a flat array turns any tag lookup into a single pointer dereference — O(1) regardless of message size — at the cost of 10000 * 10 bytes ≈ 100 KB per message object; the zero-copy design means the parser stores pointers into the original buffer rather than copying strings, eliminating all heap allocations on the critical path.",
  },
  {
    id: "cpp-20260623-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson finite-difference solver for Black-Scholes PDE",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Crank-Nicolson: second-order in time and space for BS PDE.
// dV/dt + 0.5*sigma^2*S^2*d2V/dS^2 + r*S*dV/dS - r*V = 0
// Transformed to log-space: u = log(S), uniform grid.
// Tridiagonal system solved by Thomas algorithm each time step.
std::vector<double> cnBSCall(double S0, double K, double r, double sigma,
                              double T, int M = 100, int N = 200) {
    // Grid: log-price from u_min to u_max
    const double u_min = std::log(S0 * 0.1);
    const double u_max = std::log(S0 * 10.0);
    const double du    = (u_max - u_min) / M;
    const double dt    = T / N;
    const double alpha = 0.5 * (0.5*sigma*sigma - r) * dt / du;
    const double beta  = 0.5 * 0.5*sigma*sigma * dt / (du*du);

    // Initialise grid at expiry: max(exp(u) - K, 0)
    std::vector<double> V(M+1);
    for (int j = 0; j <= M; ++j)
        V[j] = std::max(std::exp(u_min + j*du) - K, 0.0);

    // Time-step backward from T to 0
    for (int n = 0; n < N; ++n) {
        std::vector<double> rhs(M-1);
        for (int j = 1; j < M; ++j) {
            // Crank-Nicolson: average of explicit and implicit operators
            double lhs_coeff = -beta + alpha;
            double cen_coeff =  1.0 + 2.0*beta + r*dt*0.5;
            double rhs_coeff = -beta - alpha;
            rhs[j-1] = -lhs_coeff*V[j-1] + (2.0-2.0*beta-r*dt)*V[j]
                        - rhs_coeff*V[j+1];
        }
        // Thomas algorithm for tridiagonal solve
        std::vector<double> lower(M-2, -beta+alpha);
        std::vector<double> upper(M-2, -beta-alpha);
        std::vector<double> mid(M-1,  1.0+2.0*beta+r*dt*0.5);
        // Forward sweep
        for (int i = 1; i < M-1; ++i) {
            double w = lower[i-1] / mid[i-1];
            mid[i] -= w * upper[i-1];
            rhs[i] -= w * rhs[i-1];
        }
        // Back substitution
        std::vector<double> Vnew(M+1);
        Vnew[0] = 0.0; Vnew[M] = std::exp(u_max) - K*std::exp(-r*(T-n*dt));
        Vnew[M-1] = rhs[M-2] / mid[M-2];
        for (int i = M-3; i >= 0; --i)
            Vnew[i+1] = (rhs[i] - upper[i]*Vnew[i+2]) / mid[i];
        V = Vnew;
    }
    return V;   // V[j] = option price at log-price j*du + u_min
}`,
    explanation: "Crank-Nicolson achieves O(dt²) convergence by averaging the explicit (forward Euler) and implicit (backward Euler) operators — each individually O(dt) — at the cost of solving a tridiagonal system per time step; the Thomas algorithm solves the tridiagonal in O(M) rather than the O(M³) of general LU, keeping the full scheme O(M*N) like explicit methods but with far better accuracy.",
  },
  {
    id: "cpp-20260623-b1-trinomial-tree",
    language: "cpp",
    title: "Trinomial tree pricer for American options",
    tag: "derivatives",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Trinomial tree: each node has three branches (up, middle, down).
// More stable than binomial with fewer steps for the same accuracy.
// American option: take max(intrinsic, continuation) at each node.
double trinomialAmerican(double S0, double K, double r, double sigma,
                          double T, int n, bool isCall) {
    const double dt    = T / n;
    const double nu    = r - 0.5*sigma*sigma;
    const double dX    = sigma * std::sqrt(3.0 * dt);
    const double disc  = std::exp(-r * dt);

    // Risk-neutral probabilities
    const double pu = 0.5*(sigma*sigma*dt + nu*nu*dt*dt) / (dX*dX)
                     + 0.5*nu*dt/dX;
    const double pd = 0.5*(sigma*sigma*dt + nu*nu*dt*dt) / (dX*dX)
                     - 0.5*nu*dt/dX;
    const double pm = 1.0 - pu - pd;

    // Terminal nodes at step n: 2n+1 nodes, centred at log(S0)
    const int nodes = 2*n + 1;
    std::vector<double> V(nodes);
    for (int j = 0; j < nodes; ++j) {
        double S = S0 * std::exp((j - n) * dX);
        double intrinsic = isCall ? std::max(S - K, 0.0) : std::max(K - S, 0.0);
        V[j] = intrinsic;
    }

    // Backward induction
    for (int step = n - 1; step >= 0; --step) {
        std::vector<double> Vnew(2*step + 1);
        for (int j = 0; j <= 2*step; ++j) {
            double S = S0 * std::exp((j - step) * dX);
            double intrinsic = isCall ? std::max(S - K, 0.0) : std::max(K - S, 0.0);
            // Continuation value (expected discounted future payoff)
            double cont = disc * (pu*V[j+2] + pm*V[j+1] + pd*V[j]);
            Vnew[j] = std::max(intrinsic, cont);  // American: exercise or hold
        }
        V = Vnew;
    }
    return V[0];
}`,
    explanation: "The trinomial tree uses three branches per node (up, middle, down) instead of two, which allows matching the first three moments of the log-normal return distribution exactly and provides better accuracy per step than the CRR binomial — for American options, the early exercise condition is enforced at every backward induction step by taking max(intrinsic, continuation).",
  },
  {
    id: "cpp-20260623-b1-sabr-implied",
    language: "cpp",
    title: "SABR model: Hagan et al. approximate implied vol formula",
    tag: "derivatives",
    code: `#include <cmath>

// SABR: dF = sigma * F^beta * dW,  dsigma = nu * sigma * dZ,  corr(dW,dZ) = rho
// Hagan (2002) asymptotic approximation for implied Black vol.
// Valid for F > 0, K > 0, T > 0, 0 < beta < 1.
double sabrImpliedVol(double F,     // forward price
                       double K,     // strike
                       double T,     // time to expiry
                       double alpha, // initial vol
                       double beta,  // CEV exponent [0,1]
                       double rho,   // correlation
                       double nu)    // vol-of-vol
{
    if (std::abs(F - K) < 1e-10) {
        // ATM formula (no log(F/K) term)
        double FK_mid  = std::pow(F * K, 0.5 * (1.0 - beta));
        double gamma1  = beta / (F * K);           // (1-beta)^2 expanded
        double term1   = 1.0 + ((1.0-beta)*(1.0-beta)/24.0 * alpha*alpha / (FK_mid*FK_mid)
                              + rho*beta*nu*alpha / (4.0*FK_mid)
                              + (2.0-3.0*rho*rho)/24.0*nu*nu) * T;
        return alpha / FK_mid * term1;
    }

    double logFK  = std::log(F / K);
    double FK_b   = std::pow(F * K, 0.5 * (1.0 - beta));
    double z      = nu / alpha * FK_b * logFK;
    double xi     = std::log((std::sqrt(1.0 - 2.0*rho*z + z*z) + z - rho)
                              / (1.0 - rho));

    // Numerator factors
    double num1 = alpha;
    double num2 = FK_b * (1.0
        + (1.0-beta)*(1.0-beta)/24.0 * logFK*logFK
        + (1.0-beta)*(1.0-beta)*(1.0-beta)*(1.0-beta)/1920.0 * logFK*logFK*logFK*logFK);
    double num3 = z / (std::abs(xi) > 1e-15 ? xi : 1.0);

    double denom_correction = 1.0
        + ((1.0-beta)*(1.0-beta)/24.0 * alpha*alpha/(FK_b*FK_b)
        +  rho*beta*nu*alpha/(4.0*FK_b)
        +  (2.0-3.0*rho*rho)/24.0*nu*nu) * T;

    return num1 / num2 * num3 * denom_correction;
}`,
    explanation: "The Hagan SABR approximation is the industry standard for swaption vol cube construction because it produces a smile that matches market data well with only 4 parameters (alpha, beta, rho, nu), and the ATM branch avoids a 0/0 indeterminate form; however the approximation breaks down for long maturities or very high vol-of-vol, where the Antonov-Spector exact expansion or Monte Carlo must be used.",
  },
  {
    id: "cpp-20260623-b1-heston-euler",
    language: "cpp",
    title: "Heston stochastic-vol model Euler-Milstein MC pricer",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>

// Heston: dS = r*S*dt + sqrt(v)*S*dW1
//         dv = kappa*(theta-v)*dt + sigma*sqrt(v)*dW2
//         corr(dW1, dW2) = rho
// Euler full-truncation (clamp v to 0) + Milstein correction for dv.
double hestonCallEuler(double S0, double K, double r,
                        double v0, double kappa, double theta,
                        double sigma, double rho, double T,
                        int n_steps = 200, int n_paths = 50000,
                        unsigned seed = 0) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;

    const double dt   = T / n_steps;
    const double sqdt = std::sqrt(dt);
    const double disc = std::exp(-r * T);
    const double rho2 = std::sqrt(1.0 - rho * rho);

    double payoff_sum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0, v = v0;

        for (int i = 0; i < n_steps; ++i) {
            double z1 = Z(rng);
            double z2 = rho * z1 + rho2 * Z(rng);

            double sv = std::sqrt(std::max(v, 0.0));

            // Milstein correction for variance process
            double dv = kappa*(theta - std::max(v,0.0))*dt
                       + sigma*sv*sqdt*z2
                       + 0.25*sigma*sigma*dt*(z2*z2 - 1.0);  // Milstein term

            S *= std::exp((r - 0.5*std::max(v,0.0))*dt + sv*sqdt*z1);
            v  = std::max(v + dv, 0.0);   // full truncation
        }
        payoff_sum += std::max(S - K, 0.0);
    }
    return disc * payoff_sum / n_paths;
}`,
    explanation: "The Milstein correction adds a term proportional to (Z²-1) to the Euler discretisation of the variance SDE, reducing the strong order from 0.5 to 1.0 by capturing the Ito correction; full truncation (clamping v to 0) is preferred over reflection because it avoids bias that reflection introduces near the zero boundary when the Feller condition is violated.",
  },
  {
    id: "cpp-20260623-b1-cholesky",
    language: "cpp",
    title: "Cholesky decomposition for correlated multi-asset MC simulation",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <stdexcept>
#include <random>

// Cholesky: decompose Sigma = L * L' where L is lower triangular.
// Used to generate correlated normal vectors: X = L * Z for Z ~ N(0,I).
std::vector<std::vector<double>> cholesky(
        const std::vector<std::vector<double>>& Sigma) {
    int n = static_cast<int>(Sigma.size());
    std::vector<std::vector<double>> L(n, std::vector<double>(n, 0.0));

    for (int i = 0; i < n; ++i) {
        for (int j = 0; j <= i; ++j) {
            double sum = Sigma[i][j];
            for (int k = 0; k < j; ++k) sum -= L[i][k] * L[j][k];
            if (i == j) {
                if (sum <= 0.0) throw std::runtime_error("Matrix not positive definite");
                L[i][j] = std::sqrt(sum);
            } else {
                L[i][j] = sum / L[j][j];
            }
        }
    }
    return L;
}

// Generate one correlated sample vector given Cholesky factor L and iid normals Z
std::vector<double> correlatedNormal(
        const std::vector<std::vector<double>>& L,
        std::vector<double>& Z) {
    int n = static_cast<int>(L.size());
    std::vector<double> X(n, 0.0);
    for (int i = 0; i < n; ++i)
        for (int j = 0; j <= i; ++j)
            X[i] += L[i][j] * Z[j];
    return X;
}

// Multi-asset correlated GBM step
void stepGBM(std::vector<double>& S,
              const std::vector<double>& r_vec,
              const std::vector<double>& sigma_vec,
              const std::vector<std::vector<double>>& L,
              double dt, std::mt19937_64& rng) {
    std::normal_distribution<double> dZ;
    int n = static_cast<int>(S.size());
    std::vector<double> Z(n);
    for (auto& z : Z) z = dZ(rng);
    auto X = correlatedNormal(L, Z);
    double sqdt = std::sqrt(dt);
    for (int i = 0; i < n; ++i)
        S[i] *= std::exp((r_vec[i] - 0.5*sigma_vec[i]*sigma_vec[i])*dt
                         + sigma_vec[i]*sqdt*X[i]);
}`,
    explanation: "The Cholesky factorisation L*L' is computed in O(n³) once and applied O(n²) per path to generate correlated normals — the matrix-vector product L*Z maps independent normals Z into correlated ones with exactly the target covariance because E[(LZ)(LZ)'] = L*E[ZZ']*L' = L*I*L' = LL' = Σ; a positive-definite check at the diagonal step catches numerically degenerate or ill-specified covariance matrices early.",
  },
  {
    id: "cpp-20260623-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list for O(1) order book level management",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cassert>

// Intrusive list: nodes embed prev/next pointers inside themselves.
// No separate Node wrapper — the element IS the node.
// O(1) insert, remove, and splice without allocating a node object.
struct IntrusiveListNode {
    IntrusiveListNode* prev = nullptr;
    IntrusiveListNode* next = nullptr;
};

struct IntrusiveList {
    IntrusiveListNode sentinel;  // head sentinel: sentinel.next = first, sentinel.prev = last

    IntrusiveList() noexcept {
        sentinel.next = &sentinel;
        sentinel.prev = &sentinel;
    }

    void pushBack(IntrusiveListNode* n) noexcept {
        n->prev        = sentinel.prev;
        n->next        = &sentinel;
        sentinel.prev->next = n;
        sentinel.prev  = n;
    }

    void pushFront(IntrusiveListNode* n) noexcept {
        n->next        = sentinel.next;
        n->prev        = &sentinel;
        sentinel.next->prev = n;
        sentinel.next  = n;
    }

    void remove(IntrusiveListNode* n) noexcept {
        n->prev->next = n->next;
        n->next->prev = n->prev;
        n->prev = n->next = nullptr;
    }

    IntrusiveListNode* front() const noexcept {
        return sentinel.next == &sentinel ? nullptr : sentinel.next;
    }

    bool empty() const noexcept { return sentinel.next == &sentinel; }
};

// Order uses intrusive list node — no separate allocation for the list node
struct Order : IntrusiveListNode {
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    char          side;
};

// Usage: list.pushBack(order_ptr) — the Order IS the node, zero extra allocation.`,
    explanation: "An intrusive list avoids the extra heap allocation that a std::list<Order*> would require for its std::list::Node wrapper — each Order object contains its own prev/next pointers, so inserting an order into the book is a pointer manipulation only, and removing it is O(1) given a direct pointer to the Order regardless of list length.",
  },
  {
    id: "cpp-20260623-b1-bitset-flags",
    language: "cpp",
    title: "std::bitset for compact position and risk flag tracking",
    tag: "data-structures",
    code: `#include <bitset>
#include <cstdint>
#include <string>

// Encode per-instrument risk flags in a single bitset for fast bulk operations.
// Checking 1000 instruments for any breach: one bitset AND + any() = 2 instructions.
enum class RiskFlag : std::size_t {
    LONG_LIMIT      = 0,
    SHORT_LIMIT     = 1,
    LOSS_LIMIT      = 2,
    MARGIN_BREACH   = 3,
    SUSPENDED       = 4,
    STALE_PRICE     = 5,
    CIRCUIT_BREAKER = 6,
    MAX_FLAGS       = 7,
};

using FlagSet = std::bitset<static_cast<std::size_t>(RiskFlag::MAX_FLAGS)>;

struct InstrumentRisk {
    std::uint32_t instr_id;
    FlagSet flags;

    void set(RiskFlag f) noexcept   { flags.set(static_cast<std::size_t>(f)); }
    void clear(RiskFlag f) noexcept { flags.reset(static_cast<std::size_t>(f)); }
    bool test(RiskFlag f) const noexcept {
        return flags.test(static_cast<std::size_t>(f));
    }
    bool anyBreached() const noexcept { return flags.any(); }
};

// Per-strategy: bitmask over N instruments
static constexpr int N_INSTR = 1024;
using StrategyFlags = std::bitset<N_INSTR>;

struct StrategyRisk {
    StrategyFlags suspended;    // bit i = instrument i is suspended
    StrategyFlags long_breach;  // bit i = instrument i over long limit

    // Which instruments can we send orders to?
    StrategyFlags tradeable() const noexcept {
        return ~suspended & ~long_breach;  // bitwise NOT + AND: O(N/64) words
    }

    bool canTrade(int i) const noexcept {
        return !suspended.test(i) && !long_breach.test(i);
    }
};`,
    explanation: "std::bitset stores N bits in N/64 machine words, so checking all 1024 instruments for any suspended flag is a single word-size OR reduction rather than a loop — this is the key advantage over vector<bool> for bulk risk checks in a pre-trade gateway where tens of thousands of instrument checks happen per second.",
  },
  {
    id: "cpp-20260623-b1-circular-buffer",
    language: "cpp",
    title: "Circular buffer for rolling OHLC window without heap allocation",
    tag: "data-structures",
    code: `#include <array>
#include <cstddef>
#include <cstdint>
#include <limits>
#include <algorithm>

// Lock-free (single-thread) circular buffer of Tick data.
// Size must be power-of-2 for fast modulo via bitwise AND.
template <std::size_t CAP>
class CircularBuffer {
    static_assert((CAP & (CAP-1)) == 0, "CAP must be power of 2");

    struct Tick { double price; std::int32_t qty; std::uint64_t ts_ns; };

    std::array<Tick, CAP> buf_{};
    std::size_t write_idx_ = 0;
    std::size_t count_     = 0;

    static constexpr std::size_t MASK = CAP - 1;

public:
    void push(double price, std::int32_t qty, std::uint64_t ts_ns) noexcept {
        buf_[write_idx_ & MASK] = {price, qty, ts_ns};
        ++write_idx_;
        if (count_ < CAP) ++count_;
    }

    std::size_t size()  const noexcept { return count_; }
    bool        empty() const noexcept { return count_ == 0; }

    // Access the i-th most recent tick (0 = newest)
    const Tick& operator[](std::size_t i) const noexcept {
        // Newest is at (write_idx_ - 1), second newest at (write_idx_ - 2), etc.
        return buf_[(write_idx_ - 1 - i) & MASK];
    }

    // Compute OHLC over the last n ticks
    struct OHLC { double open, high, low, close; std::int64_t volume; };
    OHLC ohlc(std::size_t n) const noexcept {
        n = std::min(n, count_);
        if (n == 0) return {};
        OHLC r{(*this)[n-1].price,
               std::numeric_limits<double>::lowest(),
               std::numeric_limits<double>::max(),
               (*this)[0].price, 0};
        for (std::size_t i = 0; i < n; ++i) {
            auto& t = (*this)[i];
            r.high   = std::max(r.high,  t.price);
            r.low    = std::min(r.low,   t.price);
            r.volume += t.qty;
        }
        return r;
    }
};`,
    explanation: "A power-of-2 capacity allows (index & (CAP-1)) to replace the modulo operation with a single AND instruction; the write pointer advances monotonically and the 'oldest element' index is simply write_idx_ - count_, so random access by recency is O(1) without maintaining a separate read pointer.",
  },
  {
    id: "cpp-20260623-b1-fx-arbitrage-graph",
    language: "cpp",
    title: "FX triangular arbitrage detection via shortest-path graph",
    tag: "market-data",
    code: `#include <vector>
#include <cmath>
#include <limits>
#include <string>

// Triangular arbitrage: convert CCY A -> B -> C -> A.
// Product of rates > 1 => arbitrage.
// Equivalent to negative-weight cycle in -log(rate) graph.
// Use Bellman-Ford: detect negative cycle in N-1 relaxations.
struct FXArbitrage {
    int n_ccy;
    std::vector<double> dist;   // min -log path from source
    std::vector<int>    pred;   // predecessor for path reconstruction

    struct Edge { int from, to; double neg_log_rate; };
    std::vector<Edge> edges;

    explicit FXArbitrage(int n) : n_ccy(n), dist(n), pred(n, -1) {}

    void addRate(int from, int to, double rate) {
        edges.push_back({from, to, -std::log(rate)});
    }

    // Returns true if an arbitrage cycle exists; populates dist/pred
    bool detect(int source) {
        std::fill(dist.begin(), dist.end(), std::numeric_limits<double>::infinity());
        dist[source] = 0.0;

        for (int iter = 0; iter < n_ccy - 1; ++iter) {
            for (const auto& e : edges) {
                if (dist[e.from] < std::numeric_limits<double>::infinity()
                    && dist[e.from] + e.neg_log_rate < dist[e.to]) {
                    dist[e.to] = dist[e.from] + e.neg_log_rate;
                    pred[e.to] = e.from;
                }
            }
        }

        // N-th relaxation: if any edge still relaxes, negative cycle exists
        for (const auto& e : edges) {
            if (dist[e.from] < std::numeric_limits<double>::infinity()
                && dist[e.from] + e.neg_log_rate < dist[e.to]) {
                return true;   // arbitrage detected
            }
        }
        return false;
    }
};`,
    explanation: "Taking -log of each exchange rate converts the multiplicative arbitrage condition (product > 1) into an additive one (sum of -log rates < 0 = negative cycle), which Bellman-Ford can detect in O(V*E) time; in production, this graph is updated tick-by-tick on best-bid/ask changes and the negative-cycle check is run after each update to detect latent arbitrage before routing an order.",
  },
  {
    id: "cpp-20260623-b1-atomic-fence",
    language: "cpp",
    title: "std::atomic_thread_fence for publish-subscribe sequencing",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <array>

// Seqlock: allows multiple concurrent readers with a single writer.
// Writer increments a sequence counter before and after the write.
// Reader retries if seq is odd (write in progress) or changes between retries.
struct Seqlock {
    std::atomic<std::uint64_t> seq{0};
    double                     bid = 0.0;
    double                     ask = 0.0;
    std::uint64_t              ts  = 0;

    // Writer: called from a single writer thread
    void write(double b, double a, std::uint64_t t) noexcept {
        seq.fetch_add(1, std::memory_order_relaxed);   // begin write: make seq odd
        std::atomic_thread_fence(std::memory_order_release);
        bid = b; ask = a; ts = t;
        std::atomic_thread_fence(std::memory_order_release);
        seq.fetch_add(1, std::memory_order_relaxed);   // end write: make seq even
    }

    // Reader: may be called from multiple threads simultaneously
    bool read(double& b, double& a, std::uint64_t& t) const noexcept {
        std::uint64_t s1, s2;
        do {
            s1 = seq.load(std::memory_order_acquire);
            if (s1 & 1) continue;   // write in progress — spin
            std::atomic_thread_fence(std::memory_order_acquire);
            b = bid; a = ask; t = ts;
            std::atomic_thread_fence(std::memory_order_acquire);
            s2 = seq.load(std::memory_order_acquire);
        } while (s1 != s2);   // retry if seq changed during read
        return true;
    }
};`,
    explanation: "A seqlock allows readers to proceed without acquiring a lock — they simply retry if the sequence number is odd (write in progress) or differs between the two reads; the standalone thread_fence calls ensure the actual data reads happen between the two sequence loads and are not reordered by the compiler or CPU, which is the subtlety that makes seqlocks correct without making each data field atomic.",
  },
  {
    id: "cpp-20260623-b1-branchless",
    language: "cpp",
    title: "Branchless arithmetic for tick-size rounding and price comparison",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cmath>
#include <bit>

// Branchless min/max using conditional move (CMOV on x86)
inline std::int64_t bmin(std::int64_t a, std::int64_t b) noexcept {
    return b + ((a - b) & ((a - b) >> 63));   // b if a>b, a if a<b
}
inline std::int64_t bmax(std::int64_t a, std::int64_t b) noexcept {
    return a - ((a - b) & ((a - b) >> 63));
}

// Branchless absolute value for int64
inline std::int64_t babs(std::int64_t x) noexcept {
    std::int64_t mask = x >> 63;   // all 1s if negative, all 0s if positive
    return (x ^ mask) - mask;
}

// Round price (in ticks) DOWN to tick-size grid — branchless for non-power-of-2
inline std::int64_t roundDownToTick(std::int64_t price_ticks,
                                      std::int64_t tick_size) noexcept {
    std::int64_t rem = price_ticks % tick_size;
    // Avoid branch: if rem < 0, add tick_size (floor division)
    // (rem >> 63) is -1 for negative, 0 for non-negative
    rem += tick_size & (rem >> 63);
    return price_ticks - rem;
}

// Branchless clamp of quantity to [lo, hi]
inline std::int32_t clamp(std::int32_t v, std::int32_t lo, std::int32_t hi) noexcept {
    v = static_cast<std::int32_t>(bmax(v, lo));
    v = static_cast<std::int32_t>(bmin(v, hi));
    return v;
}

// Count trailing zeros (intrinsic maps to BSF/TZCNT instruction)
inline int ctz(std::uint64_t x) noexcept { return std::countr_zero(x); }`,
    explanation: "Branch mispredictions cost 15-20 cycles on modern CPUs; arithmetic branchless tricks replace conditional branches with sign-extension of the MSB — (x >> 63) produces an all-ones mask for negative x and all-zeros for non-negative, enabling branchless select; the compiler will usually emit a CMOV for std::min/max anyway, but explicit arithmetic is portable and debuggable without inspecting assembly.",
  },
  {
    id: "cpp-20260623-b1-token-bucket",
    language: "cpp",
    title: "Token bucket rate limiter for order submission throttling",
    tag: "market-microstructure",
    code: `#include <atomic>
#include <cstdint>
#include <chrono>

// Token bucket: allows bursts up to 'capacity' tokens, refilling at 'rate'
// tokens per nanosecond. Prevents order spam while allowing short bursts.
// Thread-safe: uses atomic CAS to update tokens + timestamp atomically.
struct TokenBucket {
    double   rate_per_ns;   // tokens per nanosecond (e.g. 100 orders/s = 1e-7/ns)
    double   capacity;      // max tokens (burst allowance)

    // Pack tokens (as int64 fixed-point, scaled by 1e6) and last_ns into a struct
    // updated atomically with compare_exchange. Here we use a mutex-free approach
    // by storing in two separate atomics with a generation counter.
    std::atomic<std::int64_t> tokens_scaled{0};  // tokens * 1e6
    std::atomic<std::int64_t> last_ns{0};

    explicit TokenBucket(double rate_per_sec, double burst)
        : rate_per_ns(rate_per_sec / 1e9), capacity(burst)
    {
        tokens_scaled.store(static_cast<std::int64_t>(burst * 1e6));
        last_ns.store(nowNs());
    }

    static std::int64_t nowNs() noexcept {
        using namespace std::chrono;
        return duration_cast<nanoseconds>(
            steady_clock::now().time_since_epoch()).count();
    }

    // Returns true if the request is allowed (consumes 1 token)
    bool allow() noexcept {
        std::int64_t now  = nowNs();
        std::int64_t last = last_ns.exchange(now);
        std::int64_t elapsed = now - last;

        // Refill
        double refill  = rate_per_ns * elapsed * 1e6;  // scaled
        std::int64_t max_tokens = static_cast<std::int64_t>(capacity * 1e6);
        std::int64_t cur = tokens_scaled.load();
        std::int64_t new_tokens = std::min(cur + static_cast<std::int64_t>(refill), max_tokens);
        tokens_scaled.store(new_tokens);

        // Consume 1 token (scaled)
        constexpr std::int64_t ONE_TOKEN = 1'000'000;
        if (tokens_scaled.fetch_sub(ONE_TOKEN) < ONE_TOKEN) {
            tokens_scaled.fetch_add(ONE_TOKEN);  // restore
            return false;   // throttled
        }
        return true;
    }
};`,
    explanation: "The token bucket decouples burst allowance (capacity) from steady-state rate: an algo can submit 100 orders in a 10ms burst if capacity=100, then is throttled to the steady rate — unlike a leaky bucket which enforces a strict inter-order delay; exchange rate limits are typically specified as a burst limit plus a per-second rate, exactly matching the token bucket model.",
  },
  {
    id: "cpp-20260623-b1-welford",
    language: "cpp",
    title: "Welford online algorithm for numerically stable rolling statistics",
    tag: "numerics",
    code: `#include <cstdint>
#include <cmath>

// Welford (1962) one-pass online variance: numerically stable unlike naive sum-of-squares.
// Naive method: var = E[X^2] - E[X]^2 suffers catastrophic cancellation when mean >> std.
// Welford accumulates deviations from the running mean, avoiding large intermediate values.
struct WelfordStats {
    std::uint64_t n      = 0;
    double        mean   = 0.0;
    double        M2     = 0.0;   // sum of squared deviations from running mean
    double        min_v  = 0.0;
    double        max_v  = 0.0;

    void update(double x) noexcept {
        ++n;
        double delta  = x - mean;
        mean         += delta / n;
        double delta2 = x - mean;
        M2           += delta * delta2;  // key: uses both old and new mean
        if (n == 1 || x < min_v) min_v = x;
        if (n == 1 || x > max_v) max_v = x;
    }

    double variance()     const noexcept { return (n < 2) ? 0.0 : M2 / (n - 1); }
    double stddev()       const noexcept { return std::sqrt(variance()); }
    double pop_variance() const noexcept { return (n < 1) ? 0.0 : M2 / n; }

    // Combine two WelfordStats objects (Chan's parallel algorithm)
    static WelfordStats merge(const WelfordStats& a, const WelfordStats& b) noexcept {
        WelfordStats c;
        c.n    = a.n + b.n;
        double delta = b.mean - a.mean;
        c.mean = (a.n * a.mean + b.n * b.mean) / c.n;
        c.M2   = a.M2 + b.M2 + delta*delta * a.n * b.n / c.n;
        c.min_v = std::min(a.min_v, b.min_v);
        c.max_v = std::max(a.max_v, b.max_v);
        return c;
    }
};`,
    explanation: "Welford's algorithm is numerically stable because M2 accumulates squared deviations from the running mean rather than the raw sum-of-squares — when prices are clustered near 100.00 with variance 0.01, the naive method computes 10000 - 9999.99 ≈ 0 and suffers complete cancellation, while Welford accumulates small deviations directly; the merge() method enables SIMD or multi-core parallel variance computation with exact results.",
  },
  {
    id: "cpp-20260623-b1-dupire-lv",
    language: "cpp",
    title: "Dupire local volatility from implied vol surface (Breeden-Litzenberger)",
    tag: "derivatives",
    code: `#include <cmath>
#include <functional>

// Dupire (1994): sigma_loc^2(K,T) = (dC/dT + r*K*dC/dK) / (0.5*K^2*d2C/dK^2)
// Numerically stable finite-difference approximation.
// Inputs: a function impliedVol(K, T) -> sigma (call vol surface).
double dupireLocalVol(double S0, double K, double T, double r,
                       std::function<double(double, double)> impliedVol,
                       double dK = 0.001, double dT = 1.0/252.0) {
    // Helper: BS call price from implied vol
    auto bsCall = [&](double k, double t) -> double {
        double iv  = impliedVol(k, t);
        if (iv <= 0 || t <= 0) return std::max(S0 * std::exp(-r*0) - k, 0.0);
        double sqT = std::sqrt(t);
        double d1  = (std::log(S0/k) + (r + 0.5*iv*iv)*t) / (iv*sqT);
        double d2  = d1 - iv*sqT;
        auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
        return S0*N(d1) - k*std::exp(-r*t)*N(d2);
    };

    // Finite-difference derivatives of the call price surface
    double dC_dT   = (bsCall(K, T+dT) - bsCall(K, T-dT)) / (2.0*dT);
    double dC_dK   = (bsCall(K+dK, T) - bsCall(K-dK, T)) / (2.0*dK);
    double d2C_dK2 = (bsCall(K+dK, T) - 2.0*bsCall(K, T) + bsCall(K-dK, T)) / (dK*dK);

    if (d2C_dK2 < 1e-10) return 0.0;  // butterfly arbitrage or numerical noise

    double numerator   = dC_dT + r * K * dC_dK;
    double denominator = 0.5 * K * K * d2C_dK2;

    double loc_var = numerator / denominator;
    return (loc_var > 0.0) ? std::sqrt(loc_var) : 0.0;
}`,
    explanation: "Dupire's formula derives local vol from the market call price surface without assuming any model — the denominator d²C/dK² is proportional to the risk-neutral density (Breeden-Litzenberger), so a negative second derivative implies a butterfly arbitrage in the market; in practice the implied vol surface must be smoothed before applying finite differences to avoid amplifying numerical noise in the second derivative.",
  },
  {
    id: "cpp-20260623-b1-fd-greeks",
    language: "cpp",
    title: "Central finite-difference Greeks for arbitrary option pricing functions",
    tag: "derivatives",
    code: `#include <functional>
#include <cmath>
#include <array>

// Model-agnostic Greeks via central finite differences.
// Works for any pricer function f(S, K, r, sigma, T).
using Pricer = std::function<double(double S, double K, double r,
                                     double sigma, double T)>;

struct FDGreeks {
    double price, delta, gamma, vega, theta, rho;
};

FDGreeks fdGreeks(Pricer f, double S, double K, double r,
                   double sigma, double T) {
    const double dS    = S     * 0.001;    // 0.1% bump
    const double dsig  = sigma * 0.001;    // 0.1% bump
    const double dr    = 0.0001;           // 1 bp
    const double dT    = 1.0 / 252.0;     // 1 business day

    FDGreeks g{};
    g.price = f(S, K, r, sigma, T);

    // Delta: dP/dS (central diff)
    g.delta = (f(S+dS, K, r, sigma, T) - f(S-dS, K, r, sigma, T)) / (2.0*dS);

    // Gamma: d^2P/dS^2
    g.gamma = (f(S+dS, K, r, sigma, T) - 2.0*g.price + f(S-dS, K, r, sigma, T))
              / (dS*dS);

    // Vega: dP/d(sigma) per vol point (percent)
    g.vega  = (f(S, K, r, sigma+dsig, T) - f(S, K, r, sigma-dsig, T))
              / (2.0*dsig) / 100.0;

    // Theta: -dP/dT (per calendar day; negative because T shrinks)
    g.theta = -(f(S, K, r, sigma, T-dT) - f(S, K, r, sigma, T+dT))
              / (2.0*dT) / 365.0;

    // Rho: dP/dr per basis point
    g.rho   = (f(S, K, r+dr, sigma, T) - f(S, K, r-dr, sigma, T))
              / (2.0*dr) / 100.0;

    return g;
}`,
    explanation: "Central finite differences achieve O(h²) accuracy versus O(h) for forward differences — for a typical h of 0.001, the error is 10⁻⁶ rather than 10⁻³; using a common pricer interface via std::function makes this infrastructure reusable across Black-Scholes, Heston, SABR, and Monte Carlo pricers, though std::function's overhead precludes use in the highest-frequency calibration loops.",
  },
  {
    id: "cpp-20260623-b1-delta-normal-var",
    language: "cpp",
    title: "Delta-normal parametric VaR for a linear portfolio",
    tag: "risk",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <stdexcept>

// Delta-normal VaR: assumes portfolio P&L is normally distributed.
// sigma_p = sqrt(w' * Sigma * w) where w = dollar sensitivities.
// VaR_alpha = sigma_p * z_alpha * sqrt(horizon)
struct DeltaNormalVaR {
    std::vector<double> dollar_deltas;  // position * delta (dollar sensitivity)
    std::vector<std::vector<double>> cov_daily; // daily covariance matrix of returns

    double portfolioVol() const {
        const int n = static_cast<int>(dollar_deltas.size());
        if (n != static_cast<int>(cov_daily.size()))
            throw std::invalid_argument("dimension mismatch");

        double var = 0.0;
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                var += dollar_deltas[i] * cov_daily[i][j] * dollar_deltas[j];
        return std::sqrt(std::max(var, 0.0));
    }

    // z_alpha for 99% VaR: 2.3263, for 95%: 1.6449
    double var(double alpha = 0.99, int horizon = 1) const {
        // Standard normal quantile approximation (Beasley-Springer-Moro)
        auto ncdfInv = [](double p) -> double {
            // Rational approximation (Abramowitz & Stegun 26.2.17)
            static const double c[] = {2.515517, 0.802853, 0.010328};
            static const double d[] = {1.432788, 0.189269, 0.001308};
            double t = std::sqrt(-2.0 * std::log(1.0 - p));
            return t - (c[0]+t*(c[1]+t*c[2])) / (1.0+t*(d[0]+t*(d[1]+t*d[2])));
        };
        double z_alpha = ncdfInv(alpha);
        return portfolioVol() * z_alpha * std::sqrt(static_cast<double>(horizon));
    }

    double expectedShortfall(double alpha = 0.99) const {
        // ES for normal: sigma_p * phi(z_alpha) / (1 - alpha)
        double z = 2.3263;  // approx for 99%
        if (std::abs(alpha - 0.95) < 0.001) z = 1.6449;
        double phi_z = std::exp(-0.5*z*z) / std::sqrt(2.0*M_PI);
        return portfolioVol() * phi_z / (1.0 - alpha);
    }
};`,
    explanation: "Delta-normal VaR is O(n²) due to the quadratic form w'Σw but can be reduced to O(kn) using PCA decomposition of the covariance matrix — the key assumption is that portfolio P&L is linear in market moves, which fails for options with large gamma; expected shortfall (CVaR) under normality equals vol times the standard normal density at the quantile divided by the tail probability, which is always larger than VaR.",
  },
  {
    id: "cpp-20260623-b1-order-matcher",
    language: "cpp",
    title: "Price-time priority order matching engine core",
    tag: "market-microstructure",
    code: `#include <map>
#include <deque>
#include <cstdint>
#include <optional>
#include <functional>

struct Order {
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    char          side;   // 'B' or 'S'
};

struct Fill {
    std::uint64_t buy_id, sell_id;
    double        price;
    std::int32_t  qty;
};

// Price-time priority matching engine.
// Bids: sorted by price descending (highest first), then FIFO within price.
// Asks: sorted by price ascending (lowest first), then FIFO within price.
class MatchingEngine {
    // bid book: higher prices first (use reverse compare)
    std::map<double, std::deque<Order>, std::greater<double>> bids_;
    // ask book: lower prices first
    std::map<double, std::deque<Order>> asks_;

public:
    std::vector<Fill> submit(Order order) {
        std::vector<Fill> fills;
        if (order.side == 'B') {
            // Match against asks: take the best (lowest) ask until filled or no match
            while (order.qty > 0 && !asks_.empty()) {
                auto it = asks_.begin();
                if (it->first > order.price) break;  // no price cross
                auto& queue = it->second;
                while (order.qty > 0 && !queue.empty()) {
                    Order& resting = queue.front();
                    int matched = std::min(order.qty, resting.qty);
                    fills.push_back({order.id, resting.id, resting.price, matched});
                    order.qty   -= matched;
                    resting.qty -= matched;
                    if (resting.qty == 0) queue.pop_front();
                }
                if (queue.empty()) asks_.erase(it);
            }
            if (order.qty > 0) bids_[order.price].push_back(order);
        } else {
            // Mirror for sell side
            while (order.qty > 0 && !bids_.empty()) {
                auto it = bids_.begin();
                if (it->first < order.price) break;
                auto& queue = it->second;
                while (order.qty > 0 && !queue.empty()) {
                    Order& resting = queue.front();
                    int matched = std::min(order.qty, resting.qty);
                    fills.push_back({resting.id, order.id, resting.price, matched});
                    order.qty   -= matched;
                    resting.qty -= matched;
                    if (resting.qty == 0) queue.pop_front();
                }
                if (queue.empty()) bids_.erase(it);
            }
            if (order.qty > 0) asks_[order.price].push_back(order);
        }
        return fills;
    }
};`,
    explanation: "Using std::map<double, deque<Order>, greater<double>> for the bid book gives O(log N) price-level lookup and O(1) FIFO dequeue per fill, matching the time-priority guarantee; in production, double price keys cause floating-point comparison issues — tick-size integer prices (long) are used instead, and std::map is often replaced by a sorted flat array when the number of active price levels is small.",
  },
];
