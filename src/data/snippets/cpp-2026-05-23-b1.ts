import type { Snippet } from "./types";

export const cppSnippets20260523B1: Snippet[] = [
  {
    id: "cpp-20260523-b1-std-span",
    language: "cpp",
    title: "std::span — zero-overhead contiguous array view (C++20)",
    tag: "stl",
    code: `#include <span>
#include <vector>
#include <numeric>

// span is a non-owning (pointer, length) view — no allocation, no copy.
double sum_window(std::span<const double> w) {
    return std::accumulate(w.begin(), w.end(), 0.0);
}

int main() {
    std::vector<double> px = {100.0, 101.5, 99.8, 102.3, 103.1};

    // Sub-span over the last 3 elements — zero allocation
    auto last3 = std::span<const double>{px}.last(3);
    double s   = sum_window(last3);   // 99.8 + 102.3 + 103.1

    // Compile-time extent: span<T, N> — size is a compile-time constant
    std::span<const double, 2> first2{px.data(), 2};
    (void)s; (void)first2;
}`,
    explanation:
      "std::span replaces the classic (T*, size_t) pair in APIs — it carries the length alongside the pointer. Use it to pass sub-windows to indicator functions without copying or changing the underlying container.",
  },
  {
    id: "cpp-20260523-b1-ranges",
    language: "cpp",
    title: "std::ranges — lazy filter + transform pipeline (C++20)",
    tag: "stl",
    code: `#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<double> prices = {99.0, 101.5, 98.2, 103.0, 97.5, 104.1};

    // Lazy pipeline — no intermediate containers created
    auto above_par = prices
        | std::views::filter([](double p) { return p > 100.0; })
        | std::views::transform([](double p) { return p - 100.0; });

    for (double v : above_par)
        std::cout << v << "\\n";   // 1.5, 3.0, 4.1

    // ranges::sort / ranges::max_element operate directly on the range
    std::ranges::sort(prices);
    auto it = std::ranges::max_element(prices);
    std::cout << *it << "\\n";
}`,
    explanation:
      "Ranges (C++20) provide lazy, composable pipelines: filter | transform evaluates on demand with no temporary vector. In tick-processing pipelines, chained views apply transformations without allocating scratch buffers between stages.",
  },
  {
    id: "cpp-20260523-b1-perfect-forward",
    language: "cpp",
    title: "Perfect forwarding and universal references",
    tag: "templates",
    code: `#include <utility>
#include <memory>
#include <string>

struct Order {
    std::string sym;
    double price;
    int    qty;
    Order(std::string s, double p, int q)
        : sym(std::move(s)), price(p), qty(q) {}
};

// T&& + std::forward: lvalue args are copied once, rvalue args are moved.
// Without forward, every arg inside the function body is an lvalue — rvalues
// would trigger copies rather than moves.
template <typename T, typename... Args>
std::unique_ptr<T> make_obj(Args&&... args) {
    return std::make_unique<T>(std::forward<Args>(args)...);
}

int main() {
    std::string sym = "AAPL";
    // sym is lvalue (copied once into Order), 250.0 and 100 are rvalues (moved).
    auto o = make_obj<Order>(sym, 250.0, 100);
    (void)o;
}`,
    explanation:
      "std::forward preserves the value category of each argument: lvalues stay lvalues (copy), rvalues stay rvalues (move). Forgetting forward in a forwarding factory causes every argument to be treated as an lvalue, silently copying heap-allocated objects.",
  },
  {
    id: "cpp-20260523-b1-variadic-template",
    language: "cpp",
    title: "Variadic templates — compile-time type list",
    tag: "templates",
    code: `#include <cstddef>
#include <type_traits>

// Zero-runtime-cost type list encoded entirely in the template parameter pack.
template <typename... Ts>
struct TypeList {
    static constexpr std::size_t size = sizeof...(Ts);
};

// index_of<T, List> — compile-time position of T.
template <typename T, typename List, std::size_t I = 0>
struct index_of;

template <typename T, typename... Rest, std::size_t I>
struct index_of<T, TypeList<T, Rest...>, I>
    : std::integral_constant<std::size_t, I> {};

template <typename T, typename Head, typename... Rest, std::size_t I>
struct index_of<T, TypeList<Head, Rest...>, I>
    : index_of<T, TypeList<Rest...>, I + 1> {};

// Event bus with a fixed, compile-time-enumerated message set.
struct NewOrder {};  struct CancelOrder {};  struct FillReport {};
using Events = TypeList<NewOrder, CancelOrder, FillReport>;

static_assert(Events::size == 3);
static_assert(index_of<CancelOrder, Events>::value == 1);`,
    explanation:
      "Type lists are the compile-time equivalent of a container: they encode a sequence of types in the parameter pack, allowing index lookup, membership checks, and size queries that are resolved entirely at compile time with zero binary footprint.",
  },
  {
    id: "cpp-20260523-b1-sfinae",
    language: "cpp",
    title: "SFINAE with enable_if — conditional overloads",
    tag: "templates",
    code: `#include <type_traits>
#include <iostream>

// SFINAE removes the integral overload for floats and vice versa.
template <typename T,
          typename = std::enable_if_t<std::is_integral_v<T>>>
void process_tick(T tick) {
    std::cout << "integer tick: " << tick << "\\n";
}

template <typename T,
          typename = std::enable_if_t<std::is_floating_point_v<T>>,
          int = 0>   // extra non-type param to disambiguate the two templates
void process_tick(T price) {
    std::cout << "float price: " << price << "\\n";
}

// C++17 alternative — single template, no SFINAE noise:
template <typename T>
void process_tick_v2(T v) {
    if constexpr (std::is_integral_v<T>)
        std::cout << "int tick " << v << "\\n";
    else
        std::cout << "float px " << v << "\\n";
}

int main() {
    process_tick(25010);    // integer overload
    process_tick(250.10);   // float overload
}`,
    explanation:
      "SFINAE (Substitution Failure Is Not An Error) enables conditional function overloads based on type traits. For new code, if constexpr is cleaner; SFINAE is still common in library code and legacy HFT codebases you'll encounter in quant interviews.",
  },
  {
    id: "cpp-20260523-b1-concepts",
    language: "cpp",
    title: "C++20 concepts — Priceable constraint",
    tag: "templates",
    code: `#include <concepts>
#include <cstdint>

// Priceable: any arithmetic type supporting +, -, *, /
template <typename T>
concept Priceable = std::is_arithmetic_v<T> && requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
    { a - b } -> std::convertible_to<T>;
    { a * b } -> std::convertible_to<T>;
};

// Constrained function template — error message says "T does not satisfy Priceable"
// instead of pages of SFINAE substitution failures.
template <Priceable T>
T spread(T bid, T ask) { return ask - bid; }

// Constrained auto in C++20 (abbreviated function template syntax)
auto mid(Priceable auto bid, Priceable auto ask) {
    return (bid + ask) / 2;
}

// Concept-constrained class template
template <Priceable T>
struct Quote { T bid; T ask; T mid() const { return (bid + ask) / 2; } };

int main() {
    auto s = spread(25010, 25012);     // int ticks
    auto m = mid(250.10, 250.12);      // doubles
    (void)s; (void)m;
}`,
    explanation:
      "Concepts are the C++20 replacement for SFINAE: they produce readable compile-time errors ('T does not satisfy Priceable') and enable overload resolution based on semantic constraints. Constrained auto parameters make signatures nearly as readable as Python type hints while remaining zero-overhead.",
  },
  {
    id: "cpp-20260523-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-size pool allocator (free-list slab)",
    tag: "memory",
    code: `#include <array>
#include <cstddef>
#include <new>
#include <stdexcept>
#include <utility>

// Pre-allocate N slots for T; alloc/free are O(1) with no heap call.
template <typename T, std::size_t N>
class PoolAlloc {
    union Slot {
        alignas(T) char storage[sizeof(T)];
        Slot* next;
    };
    std::array<Slot, N> pool_;
    Slot* free_head_ = nullptr;

public:
    PoolAlloc() {
        for (std::size_t i = 0; i + 1 < N; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[N - 1].next = nullptr;
        free_head_ = &pool_[0];
    }

    template <typename... Args>
    T* construct(Args&&... args) {
        if (!free_head_) throw std::bad_alloc{};
        Slot* s  = free_head_;
        free_head_ = s->next;
        return new (s->storage) T(std::forward<Args>(args)...);
    }

    void destroy(T* p) noexcept {
        p->~T();
        auto* s    = reinterpret_cast<Slot*>(p);
        s->next    = free_head_;
        free_head_ = s;
    }
};`,
    explanation:
      "The pool allocator pre-allocates N slots and uses the union trick to thread a free list through the same memory when slots are idle. It eliminates malloc/free overhead and fragmentation from per-order allocations, which would otherwise cost hundreds of nanoseconds in a hot market-making loop.",
  },
  {
    id: "cpp-20260523-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list for O(1) order cancel",
    tag: "quant",
    code: `#include <cstdint>

// The link pointers live INSIDE the object — no separate Node allocation.
struct IntrusiveNode { IntrusiveNode* prev; IntrusiveNode* next; };

struct Order : IntrusiveNode {
    std::uint64_t id;
    std::int64_t  price_ticks;
    std::uint32_t qty;
};

// FIFO queue for one price level (uses sentinel to avoid null checks).
struct LevelQueue {
    IntrusiveNode head;  // sentinel
    std::size_t   count = 0;

    LevelQueue() { head.prev = head.next = &head; }

    void push_back(Order* o) {
        o->prev       = head.prev;
        o->next       = &head;
        head.prev->next = o;
        head.prev       = o;
        ++count;
    }

    Order* pop_front() {
        if (head.next == &head) return nullptr;
        Order* o = static_cast<Order*>(head.next);
        unlink(o);
        return o;
    }

    // O(1) cancel of any order in the list (found via external hash map)
    static void unlink(Order* o) noexcept {
        o->prev->next = o->next;
        o->next->prev = o->prev;
    }
};`,
    explanation:
      "Intrusive lists embed next/prev directly in the object, eliminating the extra allocation and indirection of a std::list node. Production order books combine intrusive lists per price level with a hash map (order_id -> Order*), giving O(1) cancel by unlinking the node directly.",
  },
  {
    id: "cpp-20260523-b1-seqlock",
    language: "cpp",
    title: "Seqlock — lock-free reads, single writer",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>

// Seqlock: readers never block writers; detect torn reads via version counter.
// Ideal for the current best-bid/ask — written by one feed thread, read by many.
struct BestQuote { double bid; double ask; std::int64_t seq_ns; };

class Seqlock {
    std::atomic<std::uint32_t> seq_{0};
    BestQuote data_{};
public:
    // Single writer — increment seq before/after write so odd = in-progress.
    void write(const BestQuote& q) noexcept {
        seq_.fetch_add(1, std::memory_order_release);   // odd
        data_ = q;
        seq_.fetch_add(1, std::memory_order_release);   // even
    }

    // Readers retry until they see two identical even sequence numbers.
    BestQuote read() const noexcept {
        BestQuote out;
        std::uint32_t s1, s2;
        do {
            s1 = seq_.load(std::memory_order_acquire);
            if (s1 & 1u) { s1 = 0; continue; }   // write in progress
            out = data_;
            std::atomic_thread_fence(std::memory_order_acquire);
            s2 = seq_.load(std::memory_order_relaxed);
        } while (s1 != s2);
        return out;
    }
};`,
    explanation:
      "The seqlock is the standard pattern for read-heavy shared state where writes are rare: readers pay only two seq loads and a memory fence per successful read, with no lock contention. Linux uses seqlocks internally for the VDSO timekeeping fast path.",
  },
  {
    id: "cpp-20260523-b1-prefetch",
    language: "cpp",
    title: "__builtin_prefetch in a hot tick-processing loop",
    tag: "performance",
    code: `#include <vector>
#include <cstddef>

struct Tick { double price; int qty; long long ts_ns; };

// Software prefetch hides the L3 miss by issuing the fetch ahead of time.
// __builtin_prefetch(addr, rw=0 read, locality=1 low)
// tune DIST to L3-latency / clock-cycle: typically 8-16 cache lines.
void process_ticks(const std::vector<Tick>& ticks) {
    constexpr std::size_t DIST = 8;
    const std::size_t n = ticks.size();

    for (std::size_t i = 0; i < n; ++i) {
        if (i + DIST < n)
            __builtin_prefetch(&ticks[i + DIST], 0, 1);

        // By the time we reach ticks[i+DIST], it is already in L1/L2.
        const auto& t = ticks[i];
        (void)t.price;  // ... actual processing here
    }
}`,
    explanation:
      "Cache misses dominate tick-processing latency when messages are scattered in memory. Software prefetch hides the ~100 ns L3 latency by fetching the next cache line before the CPU would stall on it — the sweet spot is issuing the prefetch roughly (L3 latency / cycle time) iterations ahead.",
  },
  {
    id: "cpp-20260523-b1-mmap-ticks",
    language: "cpp",
    title: "Memory-mapped tick file for zero-copy replay",
    tag: "performance",
    code: `#ifdef __linux__
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdexcept>
#include <cstddef>

// Maps a binary tick file directly into address space — no read() per message.
class MmapTickFile {
    void*  ptr_  = MAP_FAILED;
    size_t size_ = 0;
    int    fd_   = -1;
public:
    explicit MmapTickFile(const char* path) {
        fd_ = open(path, O_RDONLY);
        if (fd_ < 0) throw std::runtime_error("open failed");
        struct stat st; fstat(fd_, &st);
        size_ = static_cast<size_t>(st.st_size);
        ptr_  = mmap(nullptr, size_, PROT_READ,
                     MAP_PRIVATE | MAP_POPULATE, fd_, 0);
        if (ptr_ == MAP_FAILED) throw std::runtime_error("mmap failed");
        madvise(ptr_, size_, MADV_SEQUENTIAL);
    }
    ~MmapTickFile() {
        if (ptr_ != MAP_FAILED) munmap(ptr_, size_);
        if (fd_  >= 0) close(fd_);
    }
    template <typename T>
    const T* at(size_t offset) const noexcept {
        return reinterpret_cast<const T*>(
            static_cast<const char*>(ptr_) + offset);
    }
    size_t size() const noexcept { return size_; }
};
#endif`,
    explanation:
      "mmap eliminates the syscall-and-copy overhead of read(): the kernel maps the file's page cache directly into the process. MAP_POPULATE pre-faults all pages at map time, trading startup latency for zero runtime faults — ideal for replay where the full file will be scanned.",
  },
  {
    id: "cpp-20260523-b1-itch-parser",
    language: "cpp",
    title: "NASDAQ ITCH 5.0 Add Order message parser",
    tag: "quant",
    code: `#include <cstdint>
#include <cstring>

// ITCH 5.0 is big-endian binary. 'A' = Add Order (no MPID).
// All multi-byte fields need byte-swap on x86 (little-endian).
#pragma pack(push, 1)
struct ItchAddOrder {
    char     msg_type;         // 'A'
    uint16_t stock_locate;
    uint16_t tracking_number;
    uint8_t  timestamp[6];     // 48-bit nanoseconds since midnight
    uint64_t order_ref;        // big-endian
    char     buy_sell;         // 'B' or 'S'
    uint32_t shares;           // big-endian
    char     stock[8];         // space-padded ASCII
    uint32_t price;            // big-endian, price * 10000
};
#pragma pack(pop)

struct ParsedAdd {
    uint64_t order_ref;
    char     side;             // 'B' or 'S'
    uint32_t shares;
    char     stock[9];         // null-terminated
    double   price;
};

ParsedAdd parse_add(const char* buf) {
    const auto* m = reinterpret_cast<const ItchAddOrder*>(buf);
    ParsedAdd out;
    out.order_ref = __builtin_bswap64(m->order_ref);
    out.side      = m->buy_sell;
    out.shares    = __builtin_bswap32(m->shares);
    std::memcpy(out.stock, m->stock, 8); out.stock[8] = '\\0';
    out.price     = __builtin_bswap32(m->price) / 10000.0;
    return out;
}`,
    explanation:
      "ITCH carries the full NASDAQ order-book delta feed over multicast. The entire decode is a bounds check plus byte-swaps — no branching on field tags like FIX ASCII. __builtin_bswap64/32 compiles to a single BSWAP instruction on x86.",
  },
  {
    id: "cpp-20260523-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson implicit PDE pricer (unconditionally stable)",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Thomas algorithm for tridiagonal Ax = d (in-place).
static void thomas(const std::vector<double>& a,
                   const std::vector<double>& b,
                   const std::vector<double>& c,
                   std::vector<double>& d) {
    int n = (int)d.size();
    std::vector<double> cp(n), dp(n);
    cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
    for (int i = 1; i < n; ++i) {
        double m = b[i] - a[i] * cp[i-1];
        cp[i] = c[i] / m;
        dp[i] = (d[i] - a[i] * dp[i-1]) / m;
    }
    d[n-1] = dp[n-1];
    for (int i = n-2; i >= 0; --i) d[i] = dp[i] - cp[i] * d[i+1];
}

// Crank-Nicolson European call in log-space. O(MN), no CFL constraint.
double cn_call(double S, double K, double r, double sigma, double T,
               int M = 200, int N = 100) {
    double xlo = std::log(K * 0.05), xhi = std::log(K * 15.0);
    double dx = (xhi - xlo) / M, dt = T / N;
    double nu = r - 0.5 * sigma * sigma;
    double al = 0.25 * dt * (sigma*sigma/(dx*dx) - nu/dx);
    double be = -0.5 * dt * (sigma*sigma/(dx*dx) + r);
    double ga = 0.25 * dt * (sigma*sigma/(dx*dx) + nu/dx);

    std::vector<double> V(M+1);
    for (int i = 0; i <= M; ++i)
        V[i] = std::max(std::exp(xlo + i*dx) - K, 0.0);

    std::vector<double> a(M-1), b(M-1), c(M-1), rhs(M-1);
    for (int n = 0; n < N; ++n) {
        double tau = (n+1)*dt;
        for (int i = 1; i < M; ++i) {
            a[i-1] = -al; b[i-1] = 1.0-2*be; c[i-1] = -ga;
            rhs[i-1] = al*V[i-1] + (1.0+2*be)*V[i] + ga*V[i+1];
        }
        rhs[M-2] += ga * (std::exp(xhi) - K*std::exp(-r*tau));
        thomas(a, b, c, rhs);
        for (int i = 1; i < M; ++i) V[i] = rhs[i-1];
        V[M] = std::exp(xhi) - K*std::exp(-r*tau);
    }
    int idx = std::clamp((int)((std::log(S)-xlo)/dx), 1, M-1);
    double f = (std::log(S) - (xlo + idx*dx)) / dx;
    return V[idx]*(1-f) + V[idx+1]*f;
}`,
    explanation:
      "Crank-Nicolson averages the explicit and implicit operators, achieving second-order accuracy in both space and time without the stability constraint of explicit Euler. The Thomas algorithm solves the resulting tridiagonal system in O(M) — unconditional stability allows using large time steps.",
  },
  {
    id: "cpp-20260523-b1-asian-mc",
    language: "cpp",
    title: "Arithmetic Asian option Monte Carlo",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <vector>

// Arithmetic average Asian call: payoff = max(mean(S_i) - K, 0).
// No closed form for arithmetic average — Monte Carlo is standard.
double asian_call_mc(double S0, double K, double r, double sigma, double T,
                      int n_steps, unsigned long n_paths = 200000) {
    std::mt19937_64 rng(42);
    std::normal_distribution<double> nd;
    double dt     = T / n_steps;
    double drift  = (r - 0.5*sigma*sigma)*dt;
    double vol    = sigma*std::sqrt(dt);
    double disc   = std::exp(-r*T);
    double total  = 0.0;

    for (unsigned long p = 0; p < n_paths; ++p) {
        double S = S0, sum = 0.0;
        for (int i = 0; i < n_steps; ++i) {
            S   *= std::exp(drift + vol * nd(rng));
            sum += S;
        }
        total += std::max(sum / n_steps - K, 0.0);
    }
    return disc * total / n_paths;
}

// Variance reduction: price the geometric Asian analytically (closed form
// via moment matching), then use it as a control variate for the arithmetic.
// Typical variance reduction: 10-100x (variance, not std error).`,
    explanation:
      "Arithmetic Asian options cannot be priced analytically because the sum of log-normals is not log-normal. The geometric Asian (product of logs) has a closed-form price — use it as a control variate: subtract the MC geometric payoff and add back the analytic value to collapse variance dramatically.",
  },
  {
    id: "cpp-20260523-b1-barrier-mc",
    language: "cpp",
    title: "Up-and-out barrier option Monte Carlo",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <algorithm>

// Up-and-out call: payoff = max(S_T - K, 0) if S_t < H for all t in [0,T].
// Once the spot crosses H from below, the option knocks out.
double uao_call_mc(double S0, double K, double H, double r, double sigma,
                   double T, int n_steps, unsigned long n_paths = 300000) {
    std::mt19937_64 rng(42);
    std::normal_distribution<double> nd;
    double dt   = T / n_steps;
    double d    = (r - 0.5*sigma*sigma)*dt;
    double v    = sigma*std::sqrt(dt);
    double disc = std::exp(-r*T);
    double sum  = 0.0;

    for (unsigned long p = 0; p < n_paths; ++p) {
        double S = S0;
        bool   out = false;
        for (int i = 0; i < n_steps && !out; ++i) {
            S *= std::exp(d + v * nd(rng));
            if (S >= H) out = true;
        }
        if (!out) sum += std::max(S - K, 0.0);
    }
    return disc * sum / n_paths;
}

// Brownian Bridge correction: probability of hitting H between discrete steps
// P = exp(-2*(H - S_lo)*(H - S_hi) / (sigma^2 * dt * S^2))
// including this halves the step count needed for a given accuracy.`,
    explanation:
      "Discrete monitoring underestimates the true barrier-crossing probability relative to continuous monitoring. The Brownian Bridge correction applies a per-step multiplicative adjustment for the probability of crossing H between two observed prices — essential when step counts are limited for performance.",
  },
  {
    id: "cpp-20260523-b1-lookback-mc",
    language: "cpp",
    title: "Floating-strike lookback call Monte Carlo",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <algorithm>

// Floating-strike lookback call: payoff = S_T - min_{0<=t<=T} S_t
// You buy at the minimum observed price — perfect hindsight.
double lookback_call_mc(double S0, double r, double sigma, double T,
                         int n_steps, unsigned long n_paths = 200000) {
    std::mt19937_64 rng(42);
    std::normal_distribution<double> nd;
    double dt   = T / n_steps;
    double d    = (r - 0.5*sigma*sigma)*dt;
    double v    = sigma*std::sqrt(dt);
    double disc = std::exp(-r*T);
    double total = 0.0;

    for (unsigned long p = 0; p < n_paths; ++p) {
        double S = S0, S_min = S0;
        for (int i = 0; i < n_steps; ++i) {
            S *= std::exp(d + v * nd(rng));
            if (S < S_min) S_min = S;
        }
        total += S - S_min;   // always >= 0
    }
    return disc * total / n_paths;
}

// Analytic price (continuous): Conze & Viswanathan (1991) or Goldman-Sosin-Gatto.
// Discrete monitoring converges to continuous as n_steps -> infinity.`,
    explanation:
      "Lookback options have the highest optionality of any path-dependent product — by construction they end in-the-money. Their continuous-monitoring price has a closed form, but discrete monitoring (weekly, monthly) significantly reduces the value; MC is the practical pricing tool.",
  },
  {
    id: "cpp-20260523-b1-kelly",
    language: "cpp",
    title: "Kelly criterion — optimal bet fraction",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <iostream>

// Continuous Kelly: f* = mu / sigma^2  where mu = mean log-return, sigma^2 = variance.
// Maximises the long-run geometric growth rate of wealth.
double kelly_continuous(const std::vector<double>& log_returns) {
    double n  = static_cast<double>(log_returns.size());
    double mu = std::accumulate(log_returns.begin(), log_returns.end(), 0.0) / n;
    double var = 0.0;
    for (double r : log_returns) var += (r - mu) * (r - mu);
    var /= (n - 1.0);
    return mu / var;   // full Kelly fraction
}

// Binary bet Kelly: f* = (b*p - (1-p)) / b  = edge / odds.
// p = win probability, b = payoff per unit risked on a win.
double kelly_binary(double p, double b) noexcept {
    return (b * p - (1.0 - p)) / b;
}

int main() {
    std::vector<double> r = {0.01, -0.005, 0.02, -0.01, 0.015, -0.003};
    double fk = kelly_continuous(r);
    std::cout << "full Kelly: " << fk << "\\n";
    std::cout << "half Kelly: " << fk * 0.5 << "\\n";
    // Binary: p=0.55, b=1.0 -> f* = 0.1
    std::cout << "binary f*: " << kelly_binary(0.55, 1.0) << "\\n";
}`,
    explanation:
      "Full Kelly maximises long-run geometric growth but produces ~50% peak-to-trough drawdowns. Half-Kelly cuts drawdowns by ~75% at the cost of ~25% less long-run growth — the standard practitioner choice. A negative Kelly fraction signals a negative-expectation bet.",
  },
  {
    id: "cpp-20260523-b1-ewm-cov",
    language: "cpp",
    title: "Exponentially weighted covariance matrix (online update)",
    tag: "quant",
    code: `#include <vector>
#include <cmath>

// RiskMetrics EWM: Sigma_t = lambda * Sigma_{t-1} + (1-lambda) * r_t * r_t^T
// lambda = 0.94 for daily data (JP Morgan, 1994).
// O(N^2) per update; constant memory regardless of history length.
class EwmCov {
    int    n_;
    double lam_;
    std::vector<double> mu_;    // exponentially weighted mean
    std::vector<double> cov_;   // dense N x N
public:
    EwmCov(int n, double lam)
        : n_(n), lam_(lam), mu_(n, 0.0), cov_(n*n, 0.0) {}

    void update(const std::vector<double>& r) {
        // Update EWM mean
        for (int i = 0; i < n_; ++i)
            mu_[i] = lam_*mu_[i] + (1.0-lam_)*r[i];
        // Update covariance with de-meaned returns
        for (int i = 0; i < n_; ++i) {
            double ri = r[i] - mu_[i];
            for (int j = 0; j <= i; ++j) {
                double c = lam_*cov_[i*n_+j] + (1.0-lam_)*ri*(r[j]-mu_[j]);
                cov_[i*n_+j] = cov_[j*n_+i] = c;
            }
        }
    }
    double operator()(int i, int j) const noexcept { return cov_[i*n_+j]; }
};`,
    explanation:
      "The RiskMetrics model popularised lambda=0.94 for daily equity covariance. The update is O(N²) per observation — for large universes you update only the factor covariance (K×K) and per-asset betas (N×K), reducing to O(NK) per tick while keeping full Σ reconstruction via Σ = B F B^T + D.",
  },
  {
    id: "cpp-20260523-b1-position-tracker",
    language: "cpp",
    title: "Position and real-time PnL tracker",
    tag: "quant",
    code: `#include <cstdint>
#include <string>
#include <unordered_map>

struct Fill { std::int64_t price_ticks; std::int32_t qty; };  // qty>0 buy, <0 sell

struct Pos {
    std::int32_t net      = 0;
    std::int64_t avg_cost = 0;   // tick-weighted
    double       realised = 0.0;
    double       unreal   = 0.0;
};

class PosTracker {
    std::unordered_map<std::string, Pos> book_;
    double tick_val_;
public:
    explicit PosTracker(double tick_val) : tick_val_(tick_val) {}

    void on_fill(const std::string& sym, const Fill& f) {
        auto& p = book_[sym];
        // Closing portion: realise PnL
        if ((p.net > 0 && f.qty < 0) || (p.net < 0 && f.qty > 0)) {
            int32_t close = std::min(std::abs(p.net), std::abs(f.qty));
            double  sign  = (p.net > 0) ? 1.0 : -1.0;
            p.realised   += close * (f.price_ticks - p.avg_cost) * tick_val_ * sign;
        }
        std::int64_t new_net = (std::int64_t)p.net + f.qty;
        if (new_net != 0)
            p.avg_cost = (p.avg_cost * p.net + f.price_ticks * f.qty) / new_net;
        p.net = (std::int32_t)new_net;
    }

    void mark(const std::string& sym, std::int64_t last) {
        auto& p = book_[sym];
        p.unreal = p.net * (last - p.avg_cost) * tick_val_;
    }

    const Pos& get(const std::string& sym) const { return book_.at(sym); }
};`,
    explanation:
      "The average-cost method books realised PnL only when reducing position, and updates the cost basis incrementally — avoiding recomputation over the full fill history. Integer tick arithmetic accumulates no floating-point drift across thousands of fills.",
  },
  {
    id: "cpp-20260523-b1-token-bucket",
    language: "cpp",
    title: "Token bucket rate limiter for order submission",
    tag: "quant",
    code: `#include <chrono>
#include <algorithm>

// Models exchange order-throttle: burst up to 'capacity'; refill at 'rate'/sec.
class TokenBucket {
    using clock = std::chrono::steady_clock;
    double capacity_, rate_, tokens_;
    clock::time_point last_;
public:
    TokenBucket(double capacity, double rate)
        : capacity_(capacity), rate_(rate),
          tokens_(capacity), last_(clock::now()) {}

    // Returns true if the request is allowed (consumes 'cost' tokens).
    bool consume(double cost = 1.0) noexcept {
        auto   now = clock::now();
        double dt  = std::chrono::duration<double>(now - last_).count();
        tokens_ = std::min(capacity_, tokens_ + dt * rate_);
        last_   = now;
        if (tokens_ < cost) return false;
        tokens_ -= cost;
        return true;
    }

    double available() const noexcept { return tokens_; }
};

// Usage: if (!limiter.consume()) { /* back off or queue order */ }
// Exchange throttles: CME ~100 orders/sec; burst allowance varies by asset class.`,
    explanation:
      "Token bucket is the standard exchange throttle model: tokens fill at rate/sec up to burst capacity, and each order submission drains one token. consume() is wait-free — appropriate for the hot-path order submission thread where blocking is unacceptable.",
  },
  {
    id: "cpp-20260523-b1-bellman-ford",
    language: "cpp",
    title: "Bellman-Ford — FX arbitrage negative-cycle detection",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <limits>

// Build edges with weight w(i,j) = -log(rate[i][j]).
// A negative cycle in this graph = arbitrage: product of rates > 1.
struct FxEdge { int u, v; double w; };

bool has_fx_arb(int n, const std::vector<FxEdge>& edges) {
    const double INF = std::numeric_limits<double>::infinity();
    std::vector<double> d(n, INF);
    d[0] = 0.0;

    // V-1 relaxations
    for (int pass = 0; pass < n - 1; ++pass)
        for (const auto& e : edges)
            if (d[e.u] < INF && d[e.u] + e.w < d[e.v])
                d[e.v] = d[e.u] + e.w;

    // V-th relaxation: if any edge still relaxes, negative cycle exists
    for (const auto& e : edges)
        if (d[e.u] < INF && d[e.u] + e.w < d[e.v] - 1e-10)
            return true;
    return false;
}

// Convert rate matrix to edge list
std::vector<FxEdge> rates_to_edges(
        const std::vector<std::vector<double>>& rates) {
    int n = (int)rates.size();
    std::vector<FxEdge> edges;
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            if (i != j && rates[i][j] > 0.0)
                edges.push_back({i, j, -std::log(rates[i][j])});
    return edges;
}`,
    explanation:
      "Bellman-Ford on negative log-rates detects arbitrage cycles of any length in O(VE). The V-th relaxation pass serves as the cycle-detection probe: if any distance still improves, the shortest path has V+1 edges, which by the pigeonhole principle must contain a cycle.",
  },
  {
    id: "cpp-20260523-b1-sort-network",
    language: "cpp",
    title: "Branchless sort network (4 and 8 elements)",
    tag: "performance",
    code: `#include <algorithm>

// Sorting network: fixed compare-and-swap (CAS) sequence, no data-dependent branches.
// GCC/Clang frequently compile cas() to CMOV — immune to branch mispredictions.
template <typename T>
inline void cas(T& a, T& b) { if (a > b) std::swap(a, b); }

// Optimal 4-element Bose-Nelson network (5 CAS, 3 parallel stages).
template <typename T>
void sort4(T* a) {
    cas(a[0], a[1]); cas(a[2], a[3]);   // stage 1
    cas(a[0], a[2]); cas(a[1], a[3]);   // stage 2
    cas(a[1], a[2]);                     // stage 3
}

// Optimal 8-element network (19 CAS, 6 parallel stages).
template <typename T>
void sort8(T* a) {
    cas(a[0],a[1]); cas(a[2],a[3]); cas(a[4],a[5]); cas(a[6],a[7]);  // s1
    cas(a[0],a[2]); cas(a[1],a[3]); cas(a[4],a[6]); cas(a[5],a[7]);  // s2
    cas(a[1],a[2]); cas(a[5],a[6]); cas(a[0],a[4]); cas(a[3],a[7]);  // s3
    cas(a[1],a[5]); cas(a[2],a[6]);                                    // s4
    cas(a[1],a[4]); cas(a[3],a[5]);                                    // s5
    cas(a[2],a[4]); cas(a[3],a[5]); cas(a[3],a[4]);                   // s6
}`,
    explanation:
      "Sorting networks have no data-dependent branches, making them immune to branch mispredictions and amenable to SIMD auto-vectorisation. sort4 typically compiles to 5 CMOV instructions; sort8 is the standard technique for sorting top-of-book price levels in a tight aggregation loop.",
  },
  {
    id: "cpp-20260523-b1-jthread",
    language: "cpp",
    title: "std::jthread — auto-joining, cooperative-stop thread (C++20)",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <chrono>
#include <iostream>

// jthread destructor calls request_stop() then join() automatically.
// stop_token enables cooperative cancellation without a shared atomic flag.
void feed_handler(std::stop_token st, int feed_id) {
    while (!st.stop_requested()) {
        // Process next UDP datagram from multicast feed
        std::this_thread::sleep_for(std::chrono::microseconds(100));
    }
    std::cout << "feed " << feed_id << " shutting down\\n";
}

// Register a callback that fires on stop — wakes a blocking socket recv.
void feed_with_callback(std::stop_token st) {
    std::stop_callback cb(st, []{ /* close socket to unblock recv() */ });
    while (!st.stop_requested()) {
        // recv(fd, ...) — will be interrupted by the callback
    }
}

int main() {
    std::jthread t1(feed_handler, 1);
    std::jthread t2(feed_handler, 2);
    std::this_thread::sleep_for(std::chrono::milliseconds(5));
    // Destructors: request_stop() + join() — no explicit shutdown code needed.
}`,
    explanation:
      "std::jthread solves the most common thread bug: forgetting to join before destruction (which calls std::terminate). The stop_callback mechanism integrates with blocking I/O: registering a callback that closes the socket lets the feed handler unblock from recv() without polling.",
  },
  {
    id: "cpp-20260523-b1-latch",
    language: "cpp",
    title: "std::latch — one-shot countdown for startup synchronisation (C++20)",
    tag: "concurrency",
    code: `#include <latch>
#include <thread>
#include <vector>
#include <iostream>

// std::latch: single-use countdown. Once it hits zero, all waiters are released.
// Use case: N worker threads must all complete init before trading begins.
void parallel_startup(int n_workers) {
    std::latch all_ready(n_workers);  // count = n_workers

    std::vector<std::thread> threads;
    for (int id = 0; id < n_workers; ++id) {
        threads.emplace_back([&, id] {
            // Connect to feed, load config, warm caches...
            std::this_thread::sleep_for(std::chrono::milliseconds(id));
            std::cout << "worker " << id << " ready\\n";
            all_ready.count_down();  // decrement; when it hits 0, waiters unblock
        });
    }

    all_ready.wait();   // main thread blocks here
    std::cout << "all systems go\\n";
    for (auto& t : threads) t.join();
}

// std::barrier is latch's reusable cousin: it resets after each phase.
// Use latch for one-time startup; barrier for recurring phased computation.`,
    explanation:
      "std::latch is lighter than mutex+condition_variable for one-time synchronisation: no spurious wakeups, no state to reset. The trading startup pattern (init all workers, then fire them simultaneously) is the canonical use case — each worker decrements the latch and the main thread unblocks only when the count reaches zero.",
  },
  {
    id: "cpp-20260523-b1-static-vector",
    language: "cpp",
    title: "Stack-allocated static vector (zero heap allocation)",
    tag: "quant",
    code: `#include <array>
#include <cstddef>
#include <stdexcept>
#include <utility>
#include <new>

// Fixed-capacity vector that never calls malloc — lives entirely on the stack
// or as a class member. Used for fill lists, top-N levels, aggressor sweeps.
template <typename T, std::size_t Cap>
class StaticVec {
    alignas(T) char buf_[Cap * sizeof(T)];
    std::size_t sz_ = 0;

    T*       ptr()       noexcept { return reinterpret_cast<T*>(buf_); }
    const T* ptr() const noexcept { return reinterpret_cast<const T*>(buf_); }
public:
    ~StaticVec() { for (std::size_t i = 0; i < sz_; ++i) ptr()[i].~T(); }

    template <typename... Args>
    void emplace_back(Args&&... args) {
        if (sz_ >= Cap) throw std::length_error("StaticVec full");
        new (ptr() + sz_++) T(std::forward<Args>(args)...);
    }

    void pop_back() noexcept { if (sz_) ptr()[--sz_].~T(); }

    T&       operator[](std::size_t i) noexcept { return ptr()[i]; }
    const T& operator[](std::size_t i) const noexcept { return ptr()[i]; }

    std::size_t size()  const noexcept { return sz_; }
    bool        empty() const noexcept { return sz_ == 0; }
    T*          begin() noexcept { return ptr(); }
    T*          end()   noexcept { return ptr() + sz_; }
};`,
    explanation:
      "A static vector lives on the stack (or as an inline member) and never calls malloc/free — eliminating the allocation jitter that would otherwise appear in latency histograms. For fill lists capped at a few dozen entries it is strictly faster than std::vector while providing the same interface.",
  },
  {
    id: "cpp-20260523-b1-fast-atof",
    language: "cpp",
    title: "Zero-allocation decimal price parser from string_view",
    tag: "quant",
    code: `#include <string_view>
#include <cstdint>

// Parse fixed-decimal price (e.g. "250.10", "-0.5", "99999.9999") without
// any allocation, locale, or errno overhead. ~3-5 ns vs ~20-30 ns for stod().
double fast_parse_price(std::string_view s) noexcept {
    bool neg = false;
    if (!s.empty() && s[0] == '-') { neg = true; s.remove_prefix(1); }

    std::int64_t integer = 0, frac = 0, frac_div = 1;
    bool in_frac = false;

    for (char c : s) {
        if (c == '.') { in_frac = true; continue; }
        if (c < '0' || c > '9') break;
        if (!in_frac) {
            integer = integer * 10 + (c - '0');
        } else {
            frac    = frac    * 10 + (c - '0');
            frac_div *= 10;
        }
    }

    double v = static_cast<double>(integer)
             + static_cast<double>(frac) / static_cast<double>(frac_div);
    return neg ? -v : v;
}`,
    explanation:
      "std::stod() calls the C runtime, handles locale, and checks errno — all unnecessary for well-formed market data. This hand-rolled parser does a single pass with integer arithmetic and one final division, achieving 5-10x throughput improvement when parsing millions of price fields per second.",
  },
];
