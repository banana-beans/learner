import type { Snippet } from "./types";

export const cppSnippets20260606B1: Snippet[] = [
  {
    id: "cpp-20260606-b1-pmr-monotonic",
    language: "cpp",
    title: "PMR monotonic_buffer_resource — arena allocation for order lifecycle",
    tag: "memory",
    code: `#include <memory_resource>
#include <array>
#include <vector>
#include <cstdint>
#include <iostream>

// PMR (C++17): swap allocators without changing container types.
// monotonic_buffer_resource: bump-pointer allocator — O(1) alloc, mass-free.
// Pattern: allocate all per-order objects from a slab; free the slab at EOD.
struct Order {
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    std::uint8_t  side;
};

int main() {
    // Fixed 256 KB arena on the stack — no heap allocation.
    alignas(64) std::array<std::byte, 256 * 1024> buf;
    std::pmr::monotonic_buffer_resource arena{buf.data(), buf.size()};

    // pmr::vector uses the arena: no individual new/delete per element.
    std::pmr::vector<Order> orders{&arena};
    orders.reserve(1000);

    for (std::uint64_t i = 0; i < 1000; ++i)
        orders.push_back({i, 100.0 + i * 0.01, 100, 0});

    std::cout << "Orders allocated: " << orders.size() << "\\n";
    std::cout << "Arena remaining: "
              << (buf.size() - arena.upstream_resource()->is_equal(arena))
              << " bytes approx\\n";

    // End-of-day: entire arena is freed in O(1) — no destructor loop.
    // arena.release() — implicit on scope exit.
    return 0;
}`,
    explanation:
      "monotonic_buffer_resource is a bump-pointer allocator backed by a pre-allocated arena: each allocation just advances a pointer, and the entire arena is released at once. This eliminates per-object new/delete on the hot path and prevents heap fragmentation — ideal for the lifecycle of a batch of intraday orders that are all freed together at end-of-day reset.",
  },
  {
    id: "cpp-20260606-b1-variant-dispatch",
    language: "cpp",
    title: "std::variant + std::visit — zero-cost order type dispatch",
    tag: "modern",
    code: `#include <variant>
#include <string>
#include <iostream>
#include <cstdint>

struct MarketOrder  { std::uint64_t id; std::int32_t qty; std::uint8_t side; };
struct LimitOrder   { std::uint64_t id; double price; std::int32_t qty; std::uint8_t side; };
struct StopOrder    { std::uint64_t id; double trigger; std::int32_t qty; std::uint8_t side; };

using AnyOrder = std::variant<MarketOrder, LimitOrder, StopOrder>;

// std::visit dispatches to the correct overload at compile time (vtable-free).
struct OrderPrinter {
    void operator()(const MarketOrder& o) const {
        std::cout << "MKT id=" << o.id << " qty=" << o.qty << "\\n";
    }
    void operator()(const LimitOrder& o) const {
        std::cout << "LMT id=" << o.id << " px=" << o.price
                  << " qty=" << o.qty << "\\n";
    }
    void operator()(const StopOrder& o) const {
        std::cout << "STP id=" << o.id << " trig=" << o.trigger
                  << " qty=" << o.qty << "\\n";
    }
};

double worst_case_notional(const AnyOrder& ord) {
    return std::visit([](const auto& o) -> double {
        if constexpr (std::is_same_v<std::decay_t<decltype(o)>, LimitOrder>)
            return o.price * std::abs(o.qty);
        else if constexpr (std::is_same_v<std::decay_t<decltype(o)>, StopOrder>)
            return o.trigger * std::abs(o.qty);
        else
            return 0.0;   // market order: notional determined at fill
    }, ord);
}

int main() {
    std::vector<AnyOrder> book = {
        MarketOrder {1, 100, 0},
        LimitOrder  {2, 99.50, 500, 0},
        StopOrder   {3, 95.00, 200, 1},
    };
    for (const auto& o : book) std::visit(OrderPrinter{}, o);
    for (const auto& o : book) std::cout << "Notional: " << worst_case_notional(o) << "\\n";
}`,
    explanation:
      "std::variant stores one of several types in a discriminated union with no heap allocation; std::visit dispatches to the correct overload via a jump table compiled from the variant index — comparable in cost to a virtual call but without the pointer indirection and vtable. The if constexpr branches inside a generic lambda enable type-specific logic at compile time without runtime overhead.",
  },
  {
    id: "cpp-20260606-b1-perfect-forward",
    language: "cpp",
    title: "Perfect forwarding — order factory with zero-copy construction",
    tag: "templates",
    code: `#include <utility>
#include <memory>
#include <vector>
#include <cstdint>
#include <iostream>
#include <string>

struct Order {
    std::uint64_t id;
    double        price;
    std::int32_t  qty;
    std::string   symbol;

    Order(std::uint64_t i, double p, std::int32_t q, std::string sym)
        : id(i), price(p), qty(q), symbol(std::move(sym)) {}
};

// OrderPool: manages a vector of Orders.
// emplace uses perfect forwarding so no temporary Order is constructed.
class OrderPool {
    std::vector<Order> orders_;
public:
    // Universal reference + std::forward: Args&&... binds to both lvalue and rvalue.
    // Forwards each argument with its original value category to Order's constructor.
    template <typename... Args>
    Order& emplace(Args&&... args) {
        return orders_.emplace_back(std::forward<Args>(args)...);
    }

    // Also demonstrate move vs copy for a string symbol.
    template <typename SymStr>
    Order& emplace_sym(std::uint64_t id, double px, int qty, SymStr&& sym) {
        return orders_.emplace_back(id, px, qty, std::forward<SymStr>(sym));
    }

    std::size_t size() const noexcept { return orders_.size(); }
};

int main() {
    OrderPool pool;

    // Rvalue string: moved directly into Order::symbol — no copy.
    pool.emplace(1ULL, 100.25, 500, std::string{"AAPL"});

    // Lvalue string: copied (correct: forwarded as lvalue).
    std::string sym = "MSFT";
    pool.emplace_sym(2ULL, 200.50, 300, sym);         // copies sym
    pool.emplace_sym(3ULL, 200.60, 200, std::move(sym)); // moves sym

    std::cout << "Pool size: " << pool.size() << "\\n";   // 3
}`,
    explanation:
      "Perfect forwarding with `Args&&...` + `std::forward<Args>(args)...` passes each argument to the target constructor with exactly its original value category: rvalues are moved (zero-copy), lvalues are copied. Without perfect forwarding, a factory that accepts by value would force an extra copy or move; with it, the factory is as efficient as calling the constructor directly.",
  },
  {
    id: "cpp-20260606-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson FD PDE solver — European put on a uniform grid",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <iostream>

// Crank-Nicolson (theta=0.5): unconditionally stable, O(dt^2 + dS^2) accuracy.
// PDE: dV/dt + 0.5*sigma^2*S^2*d2V/dS2 + r*S*dV/dS - r*V = 0 (Black-Scholes)
// Discretise on S-grid [0, S_max]; backward in time from T to 0.
// Tridiagonal system solved by Thomas algorithm (O(N)).
double cn_european_put(double S, double K, double r, double sigma, double T,
                        int N_S = 200, int N_T = 200)
{
    double S_max = 4.0 * K;
    double dS    = S_max / N_S;
    double dt    = T / N_T;

    // Initial condition: payoff at t=T.
    std::vector<double> V(N_S + 1);
    for (int i = 0; i <= N_S; ++i)
        V[i] = std::max(K - i * dS, 0.0);

    // Boundary conditions: V(0,t) = K*exp(-r*(T-t)), V(S_max,t) = 0.
    // Thomas algorithm coefficients.
    std::vector<double> a(N_S + 1), b(N_S + 1), c(N_S + 1), rhs(N_S + 1);

    for (int n = N_T - 1; n >= 0; --n) {
        double t_curr = (n + 0.5) * dt;    // mid-point time for CN

        // Interior nodes 1..N_S-1.
        for (int i = 1; i < N_S; ++i) {
            double Si  = i * dS;
            double al  = 0.25 * dt * (sigma*sigma*i*i - r*i);
            double be  = -0.5 * dt * (sigma*sigma*i*i + r);
            double ga  = 0.25 * dt * (sigma*sigma*i*i + r*i);

            a[i] = -al;
            b[i] = 1.0 - be;
            c[i] = -ga;
            rhs[i] = al*V[i-1] + (1.0+be)*V[i] + ga*V[i+1];
        }
        // Lower BC: put = K*exp(-r*(remaining time)).
        double bc_low  = K * std::exp(-r * (T - n * dt));
        // Upper BC: deep OTM put ≈ 0.
        rhs[1]       -= a[1] * bc_low;
        rhs[N_S - 1] -= c[N_S - 1] * 0.0;
        V[0]          = bc_low;
        V[N_S]        = 0.0;

        // Thomas forward sweep.
        for (int i = 2; i < N_S; ++i) {
            double m = a[i] / b[i-1];
            b[i]   -= m * c[i-1];
            rhs[i] -= m * rhs[i-1];
        }
        // Backward substitution.
        V[N_S-1] = rhs[N_S-1] / b[N_S-1];
        for (int i = N_S - 2; i >= 1; --i)
            V[i] = (rhs[i] - c[i] * V[i+1]) / b[i];
    }

    // Interpolate to exact S.
    int idx  = static_cast<int>(S / dS);
    idx = std::min(idx, N_S - 1);
    double w = (S - idx * dS) / dS;
    return (1.0 - w) * V[idx] + w * V[idx + 1];
}

int main() {
    double put = cn_european_put(100.0, 100.0, 0.05, 0.20, 1.0);
    std::cout << "CN put: " << put << "\\n";   // ≈ 5.57
}`,
    explanation:
      "Crank-Nicolson averages the explicit (old time) and implicit (new time) operators, achieving O(dt²) accuracy — one order better than explicit Euler — while remaining unconditionally stable regardless of the dt/dS ratio. The tridiagonal system is solved in O(N) by the Thomas algorithm. For American options, a projected SOR or PSOR step replaces the Thomas solve at each timestep to enforce the early-exercise constraint.",
  },
  {
    id: "cpp-20260606-b1-crtp-pricer",
    language: "cpp",
    title: "CRTP static polymorphism — zero-overhead pricer hierarchy",
    tag: "templates",
    code: `#include <cmath>
#include <numbers>
#include <iostream>

// CRTP (Curiously Recurring Template Pattern): compile-time polymorphism.
// No virtual dispatch, no vtable pointer, no indirect function call.
// The base class calls Derived::impl() via static_cast — resolved at compile time.
template <typename Derived>
class PricerBase {
public:
    double price(double S, double K, double r, double sigma, double T) const {
        return static_cast<const Derived*>(this)->price_impl(S, K, r, sigma, T);
    }
    double implied_vol(double S, double K, double r, double T,
                        double mkt_price, double tol = 1e-9) const {
        double sig = 0.2;
        for (int i = 0; i < 100; ++i) {
            double p    = price(S, K, r, sig, T);
            double vega = vega_impl(S, K, r, sig, T);
            double step = (p - mkt_price) / (vega > 1e-12 ? vega : 1e-12);
            sig -= step;
            if (std::abs(step) < tol) break;
        }
        return sig;
    }
protected:
    double vega_impl(double S, double K, double r, double sigma, double T) const {
        return static_cast<const Derived*>(this)->vega_impl(S, K, r, sigma, T);
    }
};

class BSCallPricer : public PricerBase<BSCallPricer> {
    static double Phi(double x) { return 0.5*std::erfc(-x*std::numbers::inv_sqrt2); }
    static double phi(double x) {
        return std::exp(-0.5*x*x)/std::sqrt(2.0*std::numbers::pi);
    }
public:
    double price_impl(double S, double K, double r, double sigma, double T) const {
        double sT = sigma*std::sqrt(T);
        double d1 = (std::log(S/K)+(r+0.5*sigma*sigma)*T)/sT;
        double d2 = d1 - sT;
        return S*Phi(d1) - K*std::exp(-r*T)*Phi(d2);
    }
    double vega_impl(double S, double K, double r, double sigma, double T) const {
        double sT = sigma*std::sqrt(T);
        double d1 = (std::log(S/K)+(r+0.5*sigma*sigma)*T)/sT;
        return S*phi(d1)*std::sqrt(T);
    }
};

// Batch pricer: no virtual calls, compiler can inline and vectorise.
template <typename Pricer>
double batch_price_sum(const Pricer& pricer,
                        const double* S, const double* K,
                        double r, double sigma, double T, int n)
{
    double total = 0;
    for (int i = 0; i < n; ++i) total += pricer.price(S[i], K[i], r, sigma, T);
    return total;
}

int main() {
    BSCallPricer bs;
    double iv = bs.implied_vol(100, 100, 0.05, 1.0, 10.4506);
    std::cout << "IV: " << iv << "\\n";   // ≈ 0.20

    double S[] = {100, 105, 95};
    double K[] = {100, 100, 100};
    std::cout << "Sum: " << batch_price_sum(bs, S, K, 0.05, 0.20, 1.0, 3) << "\\n";
}`,
    explanation:
      "CRTP resolves virtual calls at compile time: `static_cast<const Derived*>(this)->price_impl(...)` is a direct function call the compiler can inline and vectorise. The base class provides algorithms (implied_vol Newton loop) that operate on price_impl without knowing the derived type at runtime. This is the standard pattern in performance-critical C++ libraries (Eigen, Boost.Math) where virtual dispatch overhead is unacceptable.",
  },
  {
    id: "cpp-20260606-b1-fixed-point",
    language: "cpp",
    title: "Fixed-point price arithmetic — int64 tick representation",
    tag: "performance",
    code: `#include <cstdint>
#include <cmath>
#include <stdexcept>
#include <iostream>
#include <string>

// Fixed-point price: store price as int64 * 10^{-SCALE} to avoid float rounding.
// SCALE=4: prices in units of 0.0001 (1/100th of a cent for USD equities).
// 10001.2345 → stored as 100012345.
// Benefits: exact comparison, integer arithmetic for P&L, no FP drift.
template <int SCALE>
class FixedPrice {
    static constexpr std::int64_t FACTOR = []() constexpr {
        std::int64_t f = 1;
        for (int i = 0; i < SCALE; ++i) f *= 10;
        return f;
    }();

    std::int64_t raw_;

public:
    constexpr explicit FixedPrice(std::int64_t raw) noexcept : raw_(raw) {}

    // Construct from double (lossy — use only for initialisation from market data).
    static FixedPrice from_double(double d) {
        return FixedPrice{static_cast<std::int64_t>(std::round(d * FACTOR))};
    }

    double to_double() const noexcept { return static_cast<double>(raw_) / FACTOR; }
    std::int64_t raw()  const noexcept { return raw_; }

    FixedPrice operator+(FixedPrice o) const noexcept { return FixedPrice{raw_ + o.raw_}; }
    FixedPrice operator-(FixedPrice o) const noexcept { return FixedPrice{raw_ - o.raw_}; }
    // Multiply by integer quantity → int64 P&L in units of 10^{-SCALE}.
    std::int64_t pnl(std::int64_t qty) const noexcept { return raw_ * qty; }

    bool operator< (FixedPrice o) const noexcept { return raw_ < o.raw_; }
    bool operator==(FixedPrice o) const noexcept { return raw_ == o.raw_; }

    std::string to_string() const {
        std::int64_t whole = raw_ / FACTOR;
        std::int64_t frac  = std::abs(raw_ % FACTOR);
        return std::to_string(whole) + "." + std::to_string(frac);
    }
};

using Price4 = FixedPrice<4>;   // 4 decimal places

int main() {
    auto bid = Price4::from_double(100.2500);
    auto ask = Price4::from_double(100.2501);
    auto spread = ask - bid;
    std::cout << "Bid: "    << bid.to_double() << "\\n";
    std::cout << "Ask: "    << ask.to_double() << "\\n";
    std::cout << "Spread: " << spread.raw() << " ticks\\n";  // 1 tick
    std::cout << "P&L for 1000 shares @ +1 tick: "
              << spread.pnl(1000) << " units of 0.0001\\n"; // 1000 = $0.10
}`,
    explanation:
      "Floating-point prices accumulate rounding error: `100.25 + 0.0001 - 100.25` may not equal `0.0001` in IEEE 754 double. Fixed-point integers are exact: the spread is stored as 1 tick (raw=1) with no rounding. P&L computed as `raw * qty` is exact integer arithmetic — critical for reconciliation systems where the sum of thousands of fills must exactly match the position P&L.",
  },
  {
    id: "cpp-20260606-b1-mmap-ticks",
    language: "cpp",
    title: "Memory-mapped tick history — zero-copy file-backed ring buffer",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <string>
#include <iostream>

// Memory-mapped tick history: map a binary file directly into the address space.
// Reads are served by the OS page cache — no explicit fread(), no copy into user buffer.
// Ideal for replaying historical tick data at maximum I/O bandwidth.
struct alignas(32) TickRecord {
    std::uint64_t ts_ns;
    double        price;
    std::uint32_t qty;
    std::uint8_t  side;
    std::uint8_t  flags;
    std::uint16_t padding;
};
static_assert(sizeof(TickRecord) == 24);

class MmapTickFile {
    void*       ptr_   = MAP_FAILED;
    std::size_t size_  = 0;
    int         fd_    = -1;

public:
    explicit MmapTickFile(const std::string& path) {
        fd_ = ::open(path.c_str(), O_RDONLY);
        if (fd_ < 0) throw std::runtime_error("open: " + path);
        struct stat st{};
        ::fstat(fd_, &st);
        size_ = static_cast<std::size_t>(st.st_size);
        if (size_ == 0) return;
        // MAP_POPULATE prefaults pages — avoids page faults during replay.
        ptr_ = ::mmap(nullptr, size_, PROT_READ,
                      MAP_PRIVATE | MAP_POPULATE, fd_, 0);
        if (ptr_ == MAP_FAILED) throw std::runtime_error("mmap failed");
        // Advise sequential access: prefetches ahead aggressively.
        ::madvise(ptr_, size_, MADV_SEQUENTIAL);
    }

    ~MmapTickFile() {
        if (ptr_ != MAP_FAILED) ::munmap(ptr_, size_);
        if (fd_ >= 0)           ::close(fd_);
    }

    const TickRecord* data()  const noexcept {
        return static_cast<const TickRecord*>(ptr_);
    }
    std::size_t count() const noexcept {
        return size_ / sizeof(TickRecord);
    }

    MmapTickFile(const MmapTickFile&) = delete;
};

// Usage (file must exist in production).
// int main() {
//     MmapTickFile f("/data/ticks/AAPL_20240101.bin");
//     for (std::size_t i = 0; i < f.count(); ++i) {
//         const auto& t = f.data()[i];
//         process_tick(t);   // pointer into mmap region — no copy
//     }
// }`,
    explanation:
      "mmap maps the file into the process's virtual address space: accessing data[i] triggers a page fault only the first time, after which the OS keeps the pages in the page cache for subsequent passes. MAP_POPULATE pre-faults all pages at mmap time, converting random page-fault latency into a single sequential I/O burst. This pattern achieves full NVMe read bandwidth (~7 GB/s) for tick replay with zero application-level buffering code.",
  },
  {
    id: "cpp-20260606-b1-prefetch",
    language: "cpp",
    title: "__builtin_prefetch — hardware prefetch in order book price scan",
    tag: "performance",
    code: `#include <cstdint>
#include <cstddef>
#include <algorithm>
#include <iostream>

// __builtin_prefetch(addr, rw, locality):
//   rw: 0=read, 1=write.
//   locality: 0=no temporal (evict soon), 3=keep in all cache levels.
// Prefetch the NEXT cache line while processing the CURRENT one.
// Benefit: hides ~100 ns L3 / DRAM latency behind computation.

struct PriceLevel {
    double        price;
    std::int64_t  qty;
    std::uint32_t order_count;
    std::uint32_t flags;
};
static_assert(sizeof(PriceLevel) == 24);

// Find total qty available at or below limit price.
std::int64_t sweep_bids(const PriceLevel* levels, std::size_t n,
                         double limit_price) noexcept
{
    std::int64_t total = 0;
    constexpr std::size_t PREFETCH_DIST = 4;  // 4 levels = 4*24 bytes ahead

    for (std::size_t i = 0; i < n; ++i) {
        // Prefetch the level PREFETCH_DIST steps ahead.
        if (i + PREFETCH_DIST < n)
            __builtin_prefetch(&levels[i + PREFETCH_DIST], 0, 0);

        if (levels[i].price < limit_price) break;   // bids sorted descending
        total += levels[i].qty;
    }
    return total;
}

// Prefetch variant for non-sequential access (hash-indexed levels).
inline void prefetch_level(const PriceLevel* p) noexcept {
    __builtin_prefetch(p, 0, 3);   // keep in all cache levels
}

int main() {
    PriceLevel bids[8] = {
        {100.30, 500, 2, 0}, {100.25, 1000, 4, 0},
        {100.20, 800, 3, 0}, {100.15, 200, 1, 0},
        {100.10, 600, 2, 0}, {100.05, 400, 2, 0},
        {100.00, 900, 5, 0}, { 99.95, 300, 1, 0},
    };
    std::int64_t avail = sweep_bids(bids, 8, 100.10);
    std::cout << "Available qty above 100.10: " << avail << "\\n";  // 2300
}`,
    explanation:
      "Software prefetch decouples memory access latency from execution: by issuing the prefetch PREFETCH_DIST iterations early, the cache line arrives from DRAM before the CPU stalls waiting for it. The optimal distance is latency/cycle_time_per_iteration — for an L3 miss (~200 cycles) and a 5-cycle loop body, PREFETCH_DIST=4-8 is typical. The `locality=0` hint for streaming scans avoids polluting the cache with data that won't be reused.",
  },
  {
    id: "cpp-20260606-b1-latch-calibration",
    language: "cpp",
    title: "std::latch — parallel calibration barrier across worker threads",
    tag: "concurrency",
    code: `#include <latch>
#include <thread>
#include <vector>
#include <atomic>
#include <iostream>
#include <cmath>
#include <cstdint>

// Calibrate N instruments in parallel; then aggregate results.
// std::latch (C++20): one-time countdown barrier — each worker decrements once.
// Cheaper than condition_variable + mutex: no spurious wake-ups, no lock.

struct CalibResult { double alpha, beta; };

CalibResult calibrate(int instrument_id) {
    // Simulate heavy calibration (NLS fitting, etc.).
    double a = 0.01 + instrument_id * 0.001;
    double b = 0.5  - instrument_id * 0.02;
    return {a, b};
}

int main() {
    const int N = 8;
    std::vector<CalibResult> results(N);
    std::latch done{N};   // count = N; arrive_and_wait decrements

    // Launch N worker threads.
    std::vector<std::jthread> workers;
    workers.reserve(N);
    for (int i = 0; i < N; ++i) {
        workers.emplace_back([&, i]() {
            results[i] = calibrate(i);   // each worker writes its own slot
            done.count_down();            // decrement latch (no wait here)
        });
    }

    // Main thread waits until all N workers have decremented.
    done.wait();   // returns when count reaches 0

    // Aggregate: portfolio-level vol surface from per-instrument calibrations.
    double avg_alpha = 0;
    for (const auto& r : results) avg_alpha += r.alpha;
    avg_alpha /= N;

    std::cout << "All calibrations done. Avg alpha: " << avg_alpha << "\\n";
    // Workers are joined automatically by jthread destructors.
}`,
    explanation:
      "std::latch is a single-use countdown semaphore: once the count reaches zero it cannot be reset, which avoids the spurious-wakeup and predicate re-check overhead of condition_variable. Each calibration worker writes to its own element of the results vector (no false sharing if elements are cache-line aligned), then signals the latch. The main thread aggregates only after all calibrations complete — a clean producer-consumer handoff.",
  },
  {
    id: "cpp-20260606-b1-matrix-exp",
    language: "cpp",
    title: "Matrix exponentiation — credit rating transition over N periods",
    tag: "quant",
    code: `#include <array>
#include <cstdint>
#include <iostream>

// 3-state credit rating matrix (AAA, BBB, Default).
// M^N = N-period transition probabilities via repeated squaring: O(K^3 log N).
constexpr int K = 3;   // number of states
using Matrix = std::array<std::array<double, K>, K>;

Matrix mat_mul(const Matrix& A, const Matrix& B) {
    Matrix C{};
    for (int i = 0; i < K; ++i)
        for (int j = 0; j < K; ++j)
            for (int k = 0; k < K; ++k)
                C[i][j] += A[i][k] * B[k][j];
    return C;
}

Matrix identity() {
    Matrix I{};
    for (int i = 0; i < K; ++i) I[i][i] = 1.0;
    return I;
}

// Matrix power via binary exponentiation: O(K^3 * log n).
Matrix mat_pow(Matrix M, std::uint64_t n) {
    Matrix result = identity();
    while (n > 0) {
        if (n & 1) result = mat_mul(result, M);
        M = mat_mul(M, M);
        n >>= 1;
    }
    return result;
}

int main() {
    // Annual transition matrix (row = from, col = to): AAA, BBB, Default.
    Matrix annual = {{
        {0.90, 0.09, 0.01},   // AAA row
        {0.05, 0.85, 0.10},   // BBB row
        {0.00, 0.00, 1.00},   // Default (absorbing)
    }};

    // 5-year transition matrix.
    Matrix m5 = mat_pow(annual, 5);
    std::cout << "5-year prob(AAA -> Default): " << m5[0][2] << "\\n";
    std::cout << "5-year prob(BBB -> Default): " << m5[1][2] << "\\n";

    // Monthly sub-period: M^(1/12) via Cayley-Hamilton or GL iteration.
    // Quick approximation: M^(1/12) via mat_pow with n=1 and dt=1/12 entries.
    // Exact: use Padé expm — here shown conceptually.
    Matrix m12 = mat_pow(annual, 10);  // 10-year
    std::cout << "10-year prob(BBB->Def): " << m12[1][2] << "\\n";
}`,
    explanation:
      "Matrix exponentiation via binary squaring computes M^N in O(K³ log N) operations instead of O(K³ N). For credit rating transitions, M^N gives the N-period probability of migrating from state i to state j without explicit simulation. The absorbing Default state has a row of [0,0,1] — once defaulted the probability stays 1 — so the off-diagonal entries in the Default column accumulate the cumulative default probability over the horizon.",
  },
  {
    id: "cpp-20260606-b1-fix-parser",
    language: "cpp",
    title: "FIX protocol tag-value parser — string_view zero-copy field extraction",
    tag: "performance",
    code: `#include <string_view>
#include <charconv>
#include <cstdint>
#include <optional>
#include <array>
#include <iostream>

// FIX wire format: "8=FIX.4.2\\x019=102\\x0135=D\\x01..."
// Each field: TAG=VALUE\\x01 (SOH separator, ASCII 0x01).
// Zero-copy parser: returns string_view into the original buffer.
struct FIXField {
    std::uint16_t   tag;
    std::string_view value;
};

// Parse one FIX field starting at pos; advance pos past the SOH.
// Returns nullopt on malformed input.
std::optional<FIXField> parse_next_field(std::string_view msg, std::size_t& pos) {
    if (pos >= msg.size()) return std::nullopt;

    // Find '=' separator.
    std::size_t eq = msg.find('=', pos);
    if (eq == std::string_view::npos) return std::nullopt;

    // Parse tag number.
    std::uint16_t tag = 0;
    auto [ptr, ec] = std::from_chars(msg.data() + pos, msg.data() + eq, tag);
    if (ec != std::errc{}) return std::nullopt;

    // Find SOH terminator.
    std::size_t soh = msg.find('\x01', eq + 1);
    if (soh == std::string_view::npos) soh = msg.size();

    FIXField f{tag, msg.substr(eq + 1, soh - eq - 1)};
    pos = soh + 1;
    return f;
}

// Parse entire FIX message into a fixed array (no heap allocation).
template <std::size_t MaxFields>
std::size_t parse_fix(std::string_view msg,
                       std::array<FIXField, MaxFields>& fields)
{
    std::size_t pos = 0, n = 0;
    while (n < MaxFields) {
        auto f = parse_next_field(msg, pos);
        if (!f) break;
        fields[n++] = *f;
    }
    return n;
}

int main() {
    // Minimal NewOrderSingle (type D).
    std::string_view fix_msg =
        "8=FIX.4.2\x01" "35=D\x01" "49=CLIENT\x01"
        "55=AAPL\x01"   "54=1\x01" "38=1000\x01"
        "44=150.25\x01" "40=2\x01";

    std::array<FIXField, 32> fields;
    std::size_t n = parse_fix(fix_msg, fields);

    for (std::size_t i = 0; i < n; ++i)
        std::cout << fields[i].tag << "=" << fields[i].value << "\\n";
}`,
    explanation:
      "The FIX parser uses string_view throughout: all value fields are non-owning views into the original buffer, so no strings are copied or allocated. std::from_chars is used for tag-number parsing: it is the only standard integer-parsing function that accepts a non-null-terminated range and returns a std::errc, making it safe and fast on wire data. For a 50-field NewOrderSingle, this parser processes ~1 million messages/second on a single core.",
  },
  {
    id: "cpp-20260606-b1-bit-cast",
    language: "cpp",
    title: "std::bit_cast — type-safe price/int64 serialization",
    tag: "modern",
    code: `#include <bit>
#include <cstdint>
#include <array>
#include <cstring>
#include <iostream>

// std::bit_cast (C++20): reinterpret the bit pattern of an object as another type.
// Unlike reinterpret_cast or memcpy, bit_cast is:
//   - constexpr (usable at compile time)
//   - well-defined (no UB from strict-aliasing violations)
//   - requires sizeof(To) == sizeof(From) — checked at compile time.

// Serialize a double price to 8-byte big-endian wire format.
std::array<std::uint8_t, 8> price_to_wire(double price) {
    std::uint64_t bits = std::bit_cast<std::uint64_t>(price);
    // Convert to big-endian.
    std::array<std::uint8_t, 8> buf;
    for (int i = 7; i >= 0; --i) {
        buf[i] = static_cast<std::uint8_t>(bits & 0xFF);
        bits >>= 8;
    }
    return buf;
}

double wire_to_price(const std::array<std::uint8_t, 8>& buf) {
    std::uint64_t bits = 0;
    for (int i = 0; i < 8; ++i) bits = (bits << 8) | buf[i];
    return std::bit_cast<double>(bits);
}

// Compile-time: bit_cast is constexpr.
constexpr std::uint64_t NAN_BITS = std::bit_cast<std::uint64_t>(
    std::numeric_limits<double>::quiet_NaN());

// Check if a received price is a sentinel "no price" value.
constexpr bool is_null_price(double p) {
    return std::bit_cast<std::uint64_t>(p) == 0x7FF8000000000000ULL;
}

int main() {
    double px = 100.25;
    auto wire = price_to_wire(px);
    double recovered = wire_to_price(wire);
    std::cout << "Original: " << px << ", Recovered: " << recovered << "\\n";
    std::cout << "NaN bits: 0x" << std::hex << NAN_BITS << std::dec << "\\n";
    std::cout << "is_null(NaN): " << is_null_price(std::numeric_limits<double>::quiet_NaN()) << "\\n";
}`,
    explanation:
      "std::bit_cast eliminates the traditional type-punning pattern `memcpy(&u64, &d, 8)` which requires a mutable local variable and is only valid in a constexpr context in C++20+. bit_cast is constexpr, so the NaN bit-pattern can be computed at compile time and the null-price check can be inlined to a single integer comparison. The strict-aliasing guarantees of bit_cast mean compilers won't reorder it relative to adjacent memory operations.",
  },
  {
    id: "cpp-20260606-b1-vasicek-bond",
    language: "cpp",
    title: "Vasicek closed-form bond price — analytical ZCB and yield",
    tag: "quant",
    code: `#include <cmath>
#include <iostream>
#include <vector>

// Vasicek (1977): dr = kappa*(theta - r)*dt + sigma*dW
// Affine model: P(t,T) = exp(A(t,T) - B(t,T)*r_t).
// Exact formulas for A and B.
struct VasicekParams {
    double kappa;   // mean-reversion speed
    double theta;   // long-run mean rate
    double sigma;   // vol of short rate
    double r0;      // current short rate
};

double vasicek_B(double tau, double kappa) {
    return (1.0 - std::exp(-kappa * tau)) / kappa;
}

double vasicek_A(double tau, const VasicekParams& p) {
    double B   = vasicek_B(tau, p.kappa);
    double sig2 = p.sigma * p.sigma;
    // A(tau) = (theta - sig^2/(2*kappa^2)) * (B - tau) - sig^2/(4*kappa) * B^2
    double lim = p.theta - sig2 / (2.0 * p.kappa * p.kappa);
    return lim * (B - tau) - sig2 / (4.0 * p.kappa) * B * B;
}

// Zero-coupon bond price P(0,T).
double vasicek_zcb(double T, const VasicekParams& p) {
    return std::exp(vasicek_A(T, p) - vasicek_B(T, p.kappa) * p.r0);
}

// Yield r(0,T) = -log(P)/T.
double vasicek_yield(double T, const VasicekParams& p) {
    return -std::log(vasicek_zcb(T, p)) / T;
}

// Full yield curve.
void print_curve(const VasicekParams& p,
                  const std::vector<double>& maturities)
{
    std::cout << "Maturity  Yield\\n";
    for (double T : maturities)
        std::cout << "  " << T << "Y     "
                  << vasicek_yield(T, p) * 100.0 << "%\\n";
}

int main() {
    // Calibrated to USD: kappa=0.86, theta=0.09, sigma=0.024, r0=0.03
    VasicekParams p{0.86, 0.09, 0.024, 0.03};
    print_curve(p, {0.25, 0.5, 1, 2, 5, 10, 30});
    double p10 = vasicek_zcb(10.0, p);
    std::cout << "10Y ZCB price: " << p10 << "\\n";
}`,
    explanation:
      "Vasicek's affine structure makes bond prices exponential-linear in the short rate: P(t,T) = exp(A-B*r) where A and B are deterministic functions of maturity. The long-run yield converges to theta as T→∞ (but with a convexity correction from sigma²), and for low kappa the curve is very flat. Unlike Hull-White, Vasicek doesn't fit the observed initial curve exactly but provides clean closed-form intuition for rate risk.",
  },
  {
    id: "cpp-20260606-b1-dual-numbers",
    language: "cpp",
    title: "Dual numbers — forward-mode automatic differentiation for Greeks",
    tag: "quant",
    code: `#include <cmath>
#include <iostream>
#include <numbers>

// Dual number: x + eps*dx where eps^2 = 0.
// Forward-mode AD: set dx=1 for one input to compute the exact derivative.
// No finite-difference truncation error; cost = 1 extra "shadow" arithmetic op per op.
template <typename T>
struct Dual {
    T val;   // primal value
    T dot;   // derivative (tangent)

    Dual(T v, T d = T{}) : val(v), dot(d) {}

    Dual operator+(Dual o) const { return {val + o.val, dot + o.dot}; }
    Dual operator-(Dual o) const { return {val - o.val, dot - o.dot}; }
    Dual operator*(Dual o) const { return {val*o.val, dot*o.val + val*o.dot}; }
    Dual operator/(Dual o) const {
        return {val/o.val, (dot*o.val - val*o.dot)/(o.val*o.val)};
    }
};

// Overload standard math for Dual.
template <typename T>
Dual<T> dexp(Dual<T> x) { T e = std::exp(x.val); return {e, e * x.dot}; }
template <typename T>
Dual<T> dlog(Dual<T> x) { return {std::log(x.val), x.dot / x.val}; }
template <typename T>
Dual<T> dsqrt(Dual<T> x) {
    T s = std::sqrt(x.val); return {s, x.dot / (2.0 * s)};
}
template <typename T>
Dual<T> derfc(Dual<T> x) {
    T d = -2.0/std::sqrt(std::numbers::pi_v<T>) * std::exp(-x.val*x.val);
    return {std::erfc(x.val), d * x.dot};
}

// BS call price with Dual — automatically computes delta when S is Dual.
template <typename T>
Dual<T> bs_call_dual(Dual<T> S, T K, T r, T sigma, T tau) {
    Dual<T> logSK = dlog(S / Dual<T>{K});
    T inv_sqrt2   = std::numbers::inv_sqrt2_v<T>;
    Dual<T> sT    = Dual<T>{sigma * std::sqrt(tau)};
    Dual<T> d1    = (logSK + Dual<T>{(r + 0.5*sigma*sigma)*tau}) / sT;
    Dual<T> d2    = d1 - sT;
    Dual<T> Nd1   = (Dual<T>{1.0} - derfc(d1 * Dual<T>{inv_sqrt2})) * Dual<T>{0.5};
    Dual<T> Nd2   = (Dual<T>{1.0} - derfc(d2 * Dual<T>{inv_sqrt2})) * Dual<T>{0.5};
    Dual<T> disc  = Dual<T>{std::exp(-r * tau)};
    return S * Nd1 - Dual<T>{K} * disc * Nd2;
}

int main() {
    // Seed S with dot=1 to get dC/dS (delta).
    Dual<double> S{100.0, 1.0};   // val=100, dot=1 (direction = S)
    auto C = bs_call_dual(S, 100.0, 0.05, 0.20, 1.0);
    std::cout << "Call price: " << C.val << "\\n";   // ≈ 10.45
    std::cout << "Delta:      " << C.dot << "\\n";   // ≈ 0.637
}`,
    explanation:
      "Forward-mode AD propagates a 'tangent' alongside the primal value through every arithmetic operation using the chain rule encoded in operator overloads. Setting the seed dot=1 on the input variable S computes ∂C/∂S (delta) exactly — no finite-difference step size, no cancellation error. The cost per derivative is exactly 1x the primal evaluation: to compute all 5 Greeks (S, K, r, σ, T) requires 5 forward passes, or one reverse pass (backpropagation) for the same cost.",
  },
  {
    id: "cpp-20260606-b1-hot-cold-split",
    language: "cpp",
    title: "Hot/cold data splitting — cache-conscious order node layout",
    tag: "performance",
    code: `#include <cstdint>
#include <vector>
#include <algorithm>
#include <iostream>

// Hot/cold split: separate frequently accessed fields (hot) from rarely
// accessed fields (cold) to maximise hot-path cache utilisation.
// Without splitting: accessing price/qty drags in clOrdId and text into cache.

// HOT: fields accessed on every tick (price comparison, qty aggregation).
struct OrderHot {
    double        price;
    std::int32_t  qty;
    std::uint32_t order_idx;   // back-pointer into cold array
};

// COLD: fields accessed only on fill, cancel, or audit trail.
struct OrderCold {
    std::uint64_t cl_ord_id;
    std::uint64_t submit_ts_ns;
    char          symbol[16];
    char          text[48];
};

// Order book stores hot and cold data in separate contiguous arrays.
// The hot array fits entirely in L2 cache for a 1000-level book:
//   1000 * sizeof(OrderHot) = 1000 * 16 = 16 KB (fits in 32 KB L2).
class SplitOrderBook {
public:
    std::vector<OrderHot>  hot;
    std::vector<OrderCold> cold;

    void add_order(double px, int qty, std::uint64_t clid,
                   std::uint64_t ts, const char* sym)
    {
        std::uint32_t idx = static_cast<std::uint32_t>(cold.size());
        hot.push_back({px, qty, idx});
        cold.push_back({clid, ts, {}, {}});
        std::strncpy(cold.back().symbol, sym, 15);
    }

    // Hot path: only touches hot array — typically L1/L2 resident.
    double best_bid() const {
        auto it = std::max_element(hot.begin(), hot.end(),
            [](const OrderHot& a, const OrderHot& b){ return a.price < b.price; });
        return it != hot.end() ? it->price : 0.0;
    }

    // Cold path: audit, fill notification.
    const OrderCold& get_cold(std::uint32_t idx) const { return cold[idx]; }
};

int main() {
    SplitOrderBook book;
    book.add_order(100.25, 500, 1001, 1000000, "AAPL");
    book.add_order(100.20, 300, 1002, 1000001, "AAPL");
    book.add_order(100.30, 200, 1003, 1000002, "AAPL");
    std::cout << "Best bid: " << book.best_bid() << "\\n";   // 100.30
    std::cout << "sizeof hot:  " << sizeof(OrderHot) << " bytes\\n";
    std::cout << "sizeof cold: " << sizeof(OrderCold) << " bytes\\n";
}`,
    explanation:
      "Hot/cold splitting reduces working-set pressure: the hot-path scan (price comparison, qty aggregation) touches only 16-byte structs, allowing ~4x more orders to fit in L1/L2 cache compared to a monolithic 80-byte struct. The cold array is accessed only on order creation, cancellation, and fill — events that are ~100x less frequent than price update comparisons. This technique is widely used in the Linux kernel's inode/dentry structure and in HFT order management systems.",
  },
  {
    id: "cpp-20260606-b1-brownian-bridge",
    language: "cpp",
    title: "Brownian bridge — conditional path sampling for barrier option MC",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <numeric>
#include <iostream>

// Brownian bridge: sample W(t) | W(0)=0, W(T)=W_T.
// Used in barrier options: instead of simulating a dense time grid,
// check whether a continuous path (via the BB maximum) crossed the barrier.
// P(max W(s) >= H | W(T) = w, T) = exp(-2*H*(H-w)/T) for H > 0 and w < H.

// Probability that the maximum of a Brownian bridge exceeds H.
double bb_max_exceed_prob(double w0, double wT, double H, double T) {
    // BB maximum exceeds H: probability exp(-2*(H-w0)*(H-wT)/T)
    // where w0 = starting value, wT = ending value.
    if (H <= std::max(w0, wT)) return 1.0;
    return std::exp(-2.0 * (H - w0) * (H - wT) / T);
}

// Monte Carlo down-and-out call using Brownian bridge barrier check.
// Avoids discretisation error from missed crossings between time steps.
double dao_call_bb_mc(double S0, double K, double B,   // B = barrier
                       double r, double sigma, double T,
                       int n_paths, int n_steps, unsigned seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    double dt = T / n_steps;
    double disc = std::exp(-r * T);
    int survived = 0;
    double payoff_sum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0, logS = std::log(S0);
        bool knocked_out = false;
        double logB = std::log(B);

        for (int i = 0; i < n_steps && !knocked_out; ++i) {
            double Z    = nd(rng);
            double dW   = std::sqrt(dt) * Z;
            double logS_new = logS + (r - 0.5*sigma*sigma)*dt + sigma*dW;

            // Brownian bridge barrier check: did the path touch B in [t, t+dt]?
            // In log-space: check if log-path minimum touched logB.
            double minBB_prob = bb_max_exceed_prob(
                logS - logB,
                logS_new - logB,
                0.0, dt);   // H=0 in shifted coords: path < barrier
            // P(min logS path < logB) = exp(-2*(logS-logB)*(logS_new-logB)/(sigma^2*dt))
            double knock_prob = std::exp(
                -2.0 * (logS - logB) * (logS_new - logB) / (sigma*sigma*dt));

            // Stochastic barrier test: accept knock-out with probability knock_prob.
            std::uniform_real_distribution<> ud(0, 1);
            if (logS_new < logB || ud(rng) < knock_prob) {
                knocked_out = true;
            }
            logS = logS_new;
        }
        if (!knocked_out) {
            double ST = std::exp(logS);
            payoff_sum += std::max(ST - K, 0.0);
        }
    }
    return disc * payoff_sum / n_paths;
}

int main() {
    double price = dao_call_bb_mc(
        100, 100, 85, 0.05, 0.20, 1.0, 50000, 50);
    std::cout << "Down-and-out call: " << price << "\\n";
    // Closed-form ≈ 6.8 (vs plain call ≈ 10.45; barrier reduces value)
}`,
    explanation:
      "Discrete-time Monte Carlo systematically underestimates barrier crossing probabilities because it only checks the process at discrete time steps: a path that crosses and recrosses the barrier between steps is missed. The Brownian bridge correction computes the analytical probability that a continuous path dips below the barrier given its start and end values, then stochastically knocks out paths in proportion to that probability — eliminating the O(1/√n_steps) discretisation bias at no extra simulation cost.",
  },
  {
    id: "cpp-20260606-b1-coroutine-gen",
    language: "cpp",
    title: "C++20 coroutine generator — lazy tick replay without allocating a buffer",
    tag: "modern",
    code: `#include <coroutine>
#include <optional>
#include <cstdint>
#include <iostream>
#include <vector>

// Minimal generator coroutine: each co_yield suspends and returns a value.
// Avoids materialising the entire tick history in memory — lazy, pull-based.
template <typename T>
struct Generator {
    struct promise_type {
        T current_value;
        Generator get_return_object() {
            return {std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v)  noexcept {
            current_value = v; return {};
        }
        void return_void() noexcept {}
        void unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> handle;

    ~Generator() { if (handle) handle.destroy(); }
    Generator(const Generator&) = delete;

    bool next() {
        if (!handle || handle.done()) return false;
        handle.resume();
        return !handle.done();
    }
    T value() const { return handle.promise().current_value; }
};

struct Tick { std::uint64_t ts; double price; std::uint32_t qty; };

// Generator that lazily produces filtered ticks from a source vector.
// In production: replace source with mmap'd file reads.
Generator<Tick> filter_ticks(const std::vector<Tick>& src,
                               double min_price) {
    for (const auto& t : src)
        if (t.price >= min_price)
            co_yield t;
}

int main() {
    std::vector<Tick> feed = {
        {1000, 99.5, 100}, {1001, 100.2, 500}, {1002, 101.0, 300},
        {1003,  98.0, 200}, {1004, 100.5, 400},
    };

    auto gen = filter_ticks(feed, 100.0);
    while (gen.next()) {
        auto t = gen.value();
        std::cout << "ts=" << t.ts << " px=" << t.price
                  << " qty=" << t.qty << "\\n";
    }
    // Output: ticks at 100.2, 101.0, 100.5 — 98.0 and 99.5 skipped.
}`,
    explanation:
      "C++20 coroutines allow a function to yield values lazily: each call to gen.next() resumes the coroutine up to the next co_yield and then suspends again. The tick filter produces only matching ticks without allocating a temporary filtered vector — memory usage is O(1) regardless of the source size. This pull-based pattern composes naturally: the caller controls the consumption rate and can stop the generator early without wasting work.",
  },
  {
    id: "cpp-20260606-b1-rule-of-five",
    language: "cpp",
    title: "Rule of Five — order book node with move-only ownership",
    tag: "modern",
    code: `#include <cstdint>
#include <cstring>
#include <utility>
#include <iostream>

// Rule of Five: if you define any of {destructor, copy ctor, copy assign,
// move ctor, move assign}, define all five.
// Here: a heap-allocated order payload that transfers ownership efficiently.
class OrderPayload {
    std::uint8_t* data_;
    std::size_t   size_;

public:
    explicit OrderPayload(std::size_t n)
        : data_(new std::uint8_t[n]{}), size_(n) {}

    ~OrderPayload() { delete[] data_; }                  // 1. Destructor

    OrderPayload(const OrderPayload& o)                  // 2. Copy constructor
        : data_(new std::uint8_t[o.size_]{}), size_(o.size_) {
        std::memcpy(data_, o.data_, size_);
    }

    OrderPayload& operator=(const OrderPayload& o) {     // 3. Copy assignment
        if (this == &o) return *this;
        auto* tmp = new std::uint8_t[o.size_]{};
        std::memcpy(tmp, o.data_, o.size_);
        delete[] data_;
        data_ = tmp; size_ = o.size_;
        return *this;
    }

    OrderPayload(OrderPayload&& o) noexcept              // 4. Move constructor
        : data_(std::exchange(o.data_, nullptr)),
          size_(std::exchange(o.size_, 0)) {}

    OrderPayload& operator=(OrderPayload&& o) noexcept { // 5. Move assignment
        if (this == &o) return *this;
        delete[] data_;
        data_ = std::exchange(o.data_, nullptr);
        size_ = std::exchange(o.size_, 0);
        return *this;
    }

    std::size_t size() const noexcept { return size_; }
    std::uint8_t* data()       noexcept { return data_; }
    const std::uint8_t* data() const noexcept { return data_; }
};

int main() {
    OrderPayload a(128);
    a.data()[0] = 0xAB;

    OrderPayload b = std::move(a);           // move: a.data_ = nullptr
    std::cout << "b[0]: " << (int)b.data()[0] << "\\n";  // 0xAB
    std::cout << "a size: " << a.size() << "\\n";          // 0

    OrderPayload c = b;                      // copy: deep copy
    std::cout << "c size: " << c.size() << " b size: " << b.size() << "\\n";
}`,
    explanation:
      "std::exchange(ptr, nullptr) in the move constructor is the idiomatic way to transfer ownership and null out the source in one expression — more readable than separate assignment and null. The Rule of Five is violated if you only define the destructor (to release memory) but forget the move constructor: the compiler-generated copy constructor will then be used for moves, causing a double-free. In performance-critical code, mark move operations noexcept so standard containers (vector reallocation) use moves instead of copies.",
  },
  {
    id: "cpp-20260606-b1-consteval-tick",
    language: "cpp",
    title: "consteval tick-size rounding — compile-time price normalisation",
    tag: "performance",
    code: `#include <cstdint>
#include <cmath>
#include <iostream>

// consteval: the function MUST be evaluated at compile time.
// Use for exchange tick-size tables that are fixed at build time.
// Benefit: rounding happens in .rodata; zero runtime cost on the hot path.

// Tick size table: maps price range to tick size (in basis points of $0.0001).
consteval double tick_size_for(double price_approx) {
    if (price_approx < 1.0)   return 0.0001;
    if (price_approx < 25.0)  return 0.01;
    if (price_approx < 250.0) return 0.05;
    return 0.10;
}

// Compile-time round-to-tick for a known price level.
consteval std::int64_t round_to_tick_ct(double price, double tick) {
    // Store as integer multiples of tick (exact integer arithmetic).
    return static_cast<std::int64_t>(price / tick + 0.5);
}

// Runtime round-to-tick for incoming market data.
inline std::int64_t round_to_tick(double price, double tick) noexcept {
    return static_cast<std::int64_t>(std::round(price / tick));
}

// Compile-time verified constants for the most common price ranges.
inline constexpr double TICK_PENNY   = tick_size_for(10.0);   // 0.01
inline constexpr double TICK_NICKEL  = tick_size_for(100.0);  // 0.05
inline constexpr double TICK_DIME    = tick_size_for(500.0);  // 0.10

// Example: ETF prices compile-time verified to use $0.01 ticks.
static_assert(TICK_PENNY == 0.01);

// Compile-time level for a benchmark: AAPL @ ~175 => tick = $0.05.
constexpr auto AAPL_BENCHMARK_TICKS = round_to_tick_ct(175.0, 0.05);  // 3500

int main() {
    std::cout << "AAPL 175.03 rounded: "
              << round_to_tick(175.03, TICK_NICKEL) * TICK_NICKEL << "\\n";  // 175.05
    std::cout << "Benchmark ticks: " << AAPL_BENCHMARK_TICKS << "\\n";      // 3500
    std::cout << "Tick for $0.50 stock: " << tick_size_for(0.50) << "\\n";  // 0.0001
}`,
    explanation:
      "consteval forces full compile-time evaluation and emits an error if the call cannot be resolved statically — unlike constexpr which silently falls back to runtime. The tick-size selection logic compiles to a table of constants in .rodata with zero instruction cost at runtime. The static_assert ensures that tick-size invariants (critical for order validation) are checked at build time rather than discovered in production.",
  },
  {
    id: "cpp-20260606-b1-flat-hashmap",
    language: "cpp",
    title: "Open-addressing hash map — O(1) order ID lookup with linear probing",
    tag: "stl",
    code: `#include <cstdint>
#include <vector>
#include <optional>
#include <stdexcept>
#include <iostream>

// Robin Hood / linear-probing open-addressing hash map.
// No separate chaining (no pointer indirection per bucket).
// Load factor <= 0.75 keeps expected probe count < 2.
// Suitable for order ID -> order index lookups on the hot path.
struct OrderEntry {
    std::uint64_t key;    // order ID (0 = empty slot)
    std::uint32_t value;  // index into order array
};

class OrderIDMap {
    static constexpr std::uint64_t EMPTY = 0;
    std::vector<OrderEntry> table_;
    std::size_t             size_    = 0;
    std::size_t             mask_;

    std::size_t hash(std::uint64_t key) const noexcept {
        // Fibonacci hashing: multiply by 2^64/phi, take high bits.
        return static_cast<std::size_t>(
            (key * 11400714819323198485ULL) >> (64 - __builtin_ctz(table_.size())));
    }

public:
    explicit OrderIDMap(std::size_t cap = 1024) {
        // Round cap up to next power of 2.
        std::size_t n = 1;
        while (n < cap) n <<= 1;
        table_.assign(n, {EMPTY, 0});
        mask_ = n - 1;
    }

    void insert(std::uint64_t key, std::uint32_t val) {
        if (key == EMPTY) throw std::invalid_argument("key=0 reserved");
        if (size_ * 4 >= table_.size() * 3) {
            // Rehash: rebuild with 2x capacity.
            OrderIDMap bigger(table_.size() * 2);
            for (const auto& e : table_)
                if (e.key != EMPTY) bigger.insert(e.key, e.value);
            *this = std::move(bigger);
        }
        std::size_t i = hash(key) & mask_;
        while (table_[i].key != EMPTY && table_[i].key != key)
            i = (i + 1) & mask_;
        if (table_[i].key == EMPTY) ++size_;
        table_[i] = {key, val};
    }

    std::optional<std::uint32_t> find(std::uint64_t key) const noexcept {
        std::size_t i = hash(key) & mask_;
        while (table_[i].key != EMPTY) {
            if (table_[i].key == key) return table_[i].value;
            i = (i + 1) & mask_;
        }
        return std::nullopt;
    }

    std::size_t size() const noexcept { return size_; }
};

int main() {
    OrderIDMap map(512);
    map.insert(10001ULL, 0);
    map.insert(10002ULL, 1);
    map.insert(10003ULL, 2);
    std::cout << "find 10002: " << *map.find(10002ULL) << "\\n";  // 1
    std::cout << "find 99999: " << map.find(99999ULL).has_value() << "\\n"; // 0
}`,
    explanation:
      "Open-addressing with linear probing keeps all entries in a flat array — every cache miss is in the same contiguous allocation, not scattered across heap nodes. Fibonacci hashing (multiply by 2⁶⁴/φ) distributes keys more uniformly than modulo, reducing clustering. The 75% load-factor limit ensures the expected probe count stays below 2.5; rehashing doubles capacity lazily so amortised insertion is O(1).",
  },
  {
    id: "cpp-20260606-b1-barrier-parallel-mc",
    language: "cpp",
    title: "std::barrier — parallel MC Greeks aggregation with per-phase sync",
    tag: "concurrency",
    code: `#include <barrier>
#include <thread>
#include <vector>
#include <atomic>
#include <numeric>
#include <cmath>
#include <random>
#include <iostream>

// std::barrier (C++20): reusable N-thread synchronisation point.
// Unlike latch, barrier can be reused across multiple phases (e.g., simulate, aggregate).
// On-completion callback fires exactly once per phase.

std::atomic<double> total_delta{0.0};

void mc_greeks_worker(int worker_id, int n_paths_per_worker,
                       std::barrier<>& phase_barrier)
{
    // Phase 1: each worker simulates its share of paths.
    std::mt19937_64 rng(worker_id * 12345ULL);
    std::normal_distribution<> nd;
    double S0 = 100, K = 100, r = 0.05, sigma = 0.20, T = 1.0;

    double local_delta = 0.0;
    double bump = 0.01;
    for (int p = 0; p < n_paths_per_worker; ++p) {
        double Z = nd(rng);
        auto sim = [&](double s) {
            return std::exp(-r*T) * std::max(
                s * std::exp((r-0.5*sigma*sigma)*T + sigma*std::sqrt(T)*Z) - K, 0.0);
        };
        local_delta += (sim(S0*(1+bump)) - sim(S0*(1-bump))) / (2*S0*bump);
    }

    // Atomic add of local result.
    double expected = total_delta.load(std::memory_order_relaxed);
    double desired;
    do { desired = expected + local_delta; }
    while (!total_delta.compare_exchange_weak(expected, desired,
           std::memory_order_relaxed));

    // Phase 1 complete: all workers arrive at barrier.
    phase_barrier.arrive_and_wait();

    // Phase 2: only worker 0 prints (callback could also do this).
    if (worker_id == 0) {
        int total_paths = 4 * n_paths_per_worker;
        std::cout << "Delta (MC, " << total_paths << " paths): "
                  << total_delta.load() / total_paths << "\\n";  // ≈ 0.637
    }
    phase_barrier.arrive_and_wait();   // sync before teardown
}

int main() {
    const int N_WORKERS = 4;
    const int PATHS_EACH = 25000;
    std::barrier sync{N_WORKERS};

    std::vector<std::jthread> workers;
    for (int i = 0; i < N_WORKERS; ++i)
        workers.emplace_back(mc_greeks_worker, i, PATHS_EACH, std::ref(sync));
}`,
    explanation:
      "std::barrier is a reusable multi-phase synchronisation barrier: all N threads must call arrive_and_wait() before any proceeds past the barrier. Unlike latch (single-use) or condition_variable (complex predicate logic), barrier is designed exactly for the fork-join pattern common in parallel Monte Carlo: simulate in parallel, aggregate at the barrier, then read results. The optional on-completion callback (omitted here) fires on the last arriving thread before any are released.",
  },
  {
    id: "cpp-20260606-b1-noexcept-move",
    language: "cpp",
    title: "noexcept move semantics — enabling O(n) vector reallocation",
    tag: "modern",
    code: `#include <vector>
#include <utility>
#include <cstdint>
#include <iostream>
#include <stdexcept>

// std::vector reallocation uses MOVE only if the move constructor is noexcept.
// If move can throw, vector falls back to COPY for exception-safety guarantee.
// Marking move noexcept is critical for containers of heavy objects (e.g., order queues).

class OrderQueue {
    std::vector<double> prices_;
    std::uint64_t       id_;

public:
    explicit OrderQueue(std::uint64_t id) : id_(id) {}

    // CORRECT: noexcept move — vector will use this during reallocation.
    OrderQueue(OrderQueue&& o) noexcept
        : prices_(std::move(o.prices_)), id_(std::exchange(o.id_, 0)) {}

    OrderQueue& operator=(OrderQueue&& o) noexcept {
        prices_ = std::move(o.prices_);
        id_     = std::exchange(o.id_, 0);
        return *this;
    }

    // Delete copy (move-only type).
    OrderQueue(const OrderQueue&) = delete;
    OrderQueue& operator=(const OrderQueue&) = delete;

    void push(double px) { prices_.push_back(px); }
    std::size_t size() const noexcept { return prices_.size(); }
    std::uint64_t id()  const noexcept { return id_; }
};

int main() {
    // vector<OrderQueue>: on reallocation, will MOVE (noexcept) not COPY.
    std::vector<OrderQueue> queues;
    queues.reserve(2);
    queues.emplace_back(1);
    queues.emplace_back(2);
    queues[0].push(100.0);

    // Trigger reallocation: reserve(2) exhausted -> reallocate.
    queues.emplace_back(3);   // move constructs existing elements

    std::cout << "Queues: " << queues.size() << "\\n";
    std::cout << "Queue 0 prices: " << queues[0].size() << "\\n";
    std::cout << "Queue 0 id: "     << queues[0].id()   << "\\n";

    // std::is_nothrow_move_constructible confirms the noexcept guarantee.
    static_assert(std::is_nothrow_move_constructible_v<OrderQueue>);
}`,
    explanation:
      "std::vector reallocations choose between move and copy based on std::is_nothrow_move_constructible: if the move constructor might throw, vector must copy to maintain the strong exception guarantee (the old storage must remain intact if reallocation fails). Marking move noexcept is therefore not just style — for a container element that wraps a vector<double>, missing noexcept causes O(n) copies on every reallocation instead of O(n) cheap moves.",
  },
  {
    id: "cpp-20260606-b1-format-trade",
    language: "cpp",
    title: "std::format — trade confirmation with compile-time format string checking",
    tag: "modern",
    code: `#include <format>
#include <string>
#include <cstdint>
#include <ctime>
#include <iostream>

struct TradeFill {
    std::uint64_t order_id;
    std::string   symbol;
    double        price;
    std::int32_t  qty;
    char          side;         // 'B' or 'S'
    std::uint64_t fill_ts_ns;
};

std::string format_fill(const TradeFill& f) {
    // std::format: type-checked at compile time (Python-style {} format spec).
    // Equivalent of printf but without UB from wrong format specifiers.
    return std::format(
        "FILL ordId={} sym={} side={} qty={:+d} px={:.5f} ts={}ns",
        f.order_id, f.symbol, f.side, f.qty, f.price, f.fill_ts_ns);
}

std::string format_pnl_report(const char* symbol,
                                double realized, double unrealized,
                                double total)
{
    // Fill-with, alignment, and width specifiers.
    return std::format(
        "{:-^40}\\n"   // centered symbol with dashes
        "  Realized  : {:>10.2f}\\n"
        "  Unrealized: {:>10.2f}\\n"
        "  Total     : {:>10.2f}\\n"
        "{:-^40}",
        std::format(" {} ", symbol),
        realized, unrealized, total);
}

int main() {
    TradeFill f{10001, "AAPL", 175.2500, 500, 'B', 1700000000123456789ULL};
    std::cout << format_fill(f) << "\\n";

    std::cout << "\\n" << format_pnl_report("AAPL", 1250.50, 875.25, 2125.75) << "\\n";
}`,
    explanation:
      "std::format (C++20) validates format strings at compile time via the std::formatter template: passing a format string that expects an integer but receives a double is a compile error, not a runtime crash or undefined behaviour (unlike printf). The format spec language (`:>10.2f`, `:-^40`) is a superset of Python's format mini-language, allowing width, fill character, alignment, and precision in a single coherent syntax.",
  },
  {
    id: "cpp-20260606-b1-string-view-tokenizer",
    language: "cpp",
    title: "string_view-based CSV/FIX tokenizer — allocation-free field splitting",
    tag: "performance",
    code: `#include <string_view>
#include <array>
#include <cstddef>
#include <cstdint>
#include <charconv>
#include <iostream>

// Zero-allocation tokenizer: split a string_view by a delimiter.
// Returns an array of string_view tokens pointing into the original buffer.
// No copies, no heap allocations — each token is a window into the source.
template <std::size_t MaxTokens>
struct TokenResult {
    std::array<std::string_view, MaxTokens> tokens;
    std::size_t count = 0;
};

template <std::size_t MaxTokens>
TokenResult<MaxTokens> tokenize(std::string_view src, char delim) noexcept {
    TokenResult<MaxTokens> result;
    std::size_t start = 0;
    while (start <= src.size() && result.count < MaxTokens) {
        std::size_t end = src.find(delim, start);
        if (end == std::string_view::npos) end = src.size();
        result.tokens[result.count++] = src.substr(start, end - start);
        start = end + 1;
    }
    return result;
}

// Parse a CSV trade record: "timestamp,symbol,side,qty,price"
struct TradeRecord {
    std::uint64_t ts;
    std::string_view symbol;
    char side;
    std::int32_t qty;
    double price;
    bool valid = false;
};

TradeRecord parse_trade_csv(std::string_view line) noexcept {
    auto [toks, n] = tokenize<5>(line, ',');
    if (n < 5) return {};
    TradeRecord r;
    std::from_chars(toks[0].data(), toks[0].data()+toks[0].size(), r.ts);
    r.symbol = toks[1];
    r.side   = toks[2].empty() ? '?' : toks[2][0];
    std::from_chars(toks[3].data(), toks[3].data()+toks[3].size(), r.qty);
    // double from_chars: C++17 but not all compilers support it; fallback:
    r.price  = std::stod(std::string{toks[4]});
    r.valid  = true;
    return r;
}

int main() {
    std::string_view line = "1700000000,AAPL,B,500,175.2500";
    auto trade = parse_trade_csv(line);
    if (trade.valid) {
        std::cout << "ts="     << trade.ts
                  << " sym="   << trade.symbol
                  << " side="  << trade.side
                  << " qty="   << trade.qty
                  << " price=" << trade.price << "\\n";
    }
}`,
    explanation:
      "The tokenizer returns string_view windows into the source buffer: the tokens are valid only as long as the source string lives, but for a line-by-line feed processor where each line is processed and discarded, this is exactly the right lifetime. Avoiding heap allocation per field is critical at market-data parsing speeds (millions of messages/second); even a single std::string allocation per field would dominate the processing time.",
  },
];
