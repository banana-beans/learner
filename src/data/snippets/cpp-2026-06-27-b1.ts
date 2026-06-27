import type { Snippet } from "./types";

export const cppSnippets20260627B1: Snippet[] = [
  {
    id: "cpp-20260627-b1-intrusive-list-ob",
    language: "cpp",
    title: "Intrusive linked list for order book price level",
    tag: "performance",
    code: `#include <cstdint>
#include <cassert>

// Pointers embedded inside Order — zero extra allocation per order.
struct Order {
    uint64_t  id;
    double    price;
    uint32_t  qty;
    Order*    next = nullptr;
    Order*    prev = nullptr;
};

struct PriceLevel {
    double   price    = 0.0;
    Order*   head     = nullptr;
    Order*   tail     = nullptr;
    uint32_t total_qty = 0;

    void push_back(Order* o) {
        o->next = nullptr;
        o->prev = tail;
        if (tail) tail->next = o; else head = o;
        tail = o;
        total_qty += o->qty;
    }

    void remove(Order* o) {
        if (o->prev) o->prev->next = o->next; else head = o->next;
        if (o->next) o->next->prev = o->prev; else tail = o->prev;
        total_qty -= o->qty;
    }
};

void demo() {
    Order a{1, 100.0, 50}, b{2, 100.0, 75}, c{3, 100.0, 25};
    PriceLevel level;
    level.push_back(&a); level.push_back(&b); level.push_back(&c);
    assert(level.total_qty == 150);
    level.remove(&b);   // cancel middle order
    assert(level.total_qty == 75);
}`,
    explanation: "Embedding list pointers directly in the Order struct makes add/cancel O(1) with zero extra heap allocation; combined with a pool allocator for the Order objects themselves, the entire cancel path touches only pre-allocated, cache-warm memory with no malloc/free calls.",
  },
  {
    id: "cpp-20260627-b1-builtin-expect",
    language: "cpp",
    title: "Branch prediction hints: __builtin_expect and [[likely]]",
    tag: "performance",
    code: `#include <cstdint>

// Pre-C++20: GCC/Clang extension
#define LIKELY(x)   __builtin_expect(!!(x), 1)
#define UNLIKELY(x) __builtin_expect(!!(x), 0)

struct Order { uint64_t id; double price; uint32_t qty; bool is_cancel; };

void processOrder_old(Order& o, uint64_t* fills, uint64_t* cancels) {
    // Cancels are <5% of flow — hint the predictor
    if (UNLIKELY(o.is_cancel)) { ++(*cancels); return; }
    if (LIKELY(o.qty > 0))     { ++(*fills); }
}

// C++20 standard attributes — same codegen, no macro
void processOrder_new(Order& o, uint64_t* fills, uint64_t* cancels) {
    if (o.is_cancel) [[unlikely]] { ++(*cancels); return; }
    if (o.qty > 0)   [[likely]]   { ++(*fills); }
}

// Verify the hint works: compile with -O2 and inspect:
//   objdump -d | grep -A5 processOrder
// The unlikely branch will be emitted as a cold forward-taken branch.`,
    explanation: "__builtin_expect and [[likely]] reshape basic block layout so the predicted path is a straight fall-through with no taken branch; a mispredicted branch on the critical path costs 15-20 cycles on modern out-of-order CPUs, so even a 5% cancel rate with bad layout can dominate latency at tick rates.",
  },
  {
    id: "cpp-20260627-b1-avx2-dot",
    language: "cpp",
    title: "AVX2 SIMD dot product for portfolio returns",
    tag: "performance",
    code: `#include <immintrin.h>
#include <cstddef>

// Compute dot product weights[i] * returns[i], summed over n assets.
// AVX2 processes 8 floats per FMA instruction — 8x throughput vs scalar.
float dotProductAVX2(const float* __restrict__ w,
                     const float* __restrict__ r,
                     std::size_t n) {
    __m256 acc = _mm256_setzero_ps();
    std::size_t i = 0;

    for (; i + 8 <= n; i += 8) {
        __m256 vw = _mm256_loadu_ps(w + i);       // unaligned load of 8 weights
        __m256 vr = _mm256_loadu_ps(r + i);       // unaligned load of 8 returns
        acc = _mm256_fmadd_ps(vw, vr, acc);        // acc += vw * vr (fused)
    }

    // Horizontal reduction of 8 lanes into one scalar
    __m128 lo  = _mm256_castps256_ps128(acc);
    __m128 hi  = _mm256_extractf128_ps(acc, 1);
    __m128 sum = _mm_add_ps(lo, hi);
    sum = _mm_hadd_ps(sum, sum);
    sum = _mm_hadd_ps(sum, sum);
    float result = _mm_cvtss_f32(sum);

    for (; i < n; ++i) result += w[i] * r[i];     // scalar tail
    return result;
}`,
    explanation: "A 500-asset portfolio dot product requires 500 multiply-adds; AVX2 reduces this to ~63 VFMADD256 instructions, and the horizontal reduction adds 3 more — on a Skylake core with 2 FMA execution units, throughput is ~16 floats/cycle vs 2 floats/cycle scalar.",
  },
  {
    id: "cpp-20260627-b1-hugepages-mmap",
    language: "cpp",
    title: "Huge pages via mmap for ring buffer",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <stdexcept>

// Allocate memory backed by 2MB huge pages.
// A single TLB entry covers 2MB instead of 4KB, reducing TLB misses by 512x
// for large ring buffers that don't fit in the L2 TLB (typically 1536 entries).
void* allocHugePage(std::size_t size) {
    void* ptr = mmap(nullptr, size,
                     PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                     -1, 0);
    if (ptr == MAP_FAILED) {
        // Fallback: regular pages with kernel transparent huge page advice
        ptr = mmap(nullptr, size, PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (ptr == MAP_FAILED) throw std::runtime_error("mmap failed");
        madvise(ptr, size, MADV_HUGEPAGE);
    }
    return ptr;
}

struct MarketDataRing {
    static constexpr std::size_t kSize = 8UL * 1024 * 1024; // 8 MB
    char* buf;
    MarketDataRing() : buf(static_cast<char*>(allocHugePage(kSize))) {}
    ~MarketDataRing() { munmap(buf, kSize); }
};

// Prerequisite: echo 128 > /proc/sys/vm/nr_hugepages`,
    explanation: "At 10 Gb/s market data rates, a large ring buffer that spills out of the TLB generates page-walk latency spikes of 80-200 ns per miss; 2MB huge pages collapse 512 regular TLB entries into one, eliminating page walks for the entire ring buffer at the cost of one /proc/sys/vm/nr_hugepages reservation.",
  },
  {
    id: "cpp-20260627-b1-numa-pin",
    language: "cpp",
    title: "NUMA thread pinning for NIC-local packet processing",
    tag: "performance",
    code: `#define _GNU_SOURCE
#include <pthread.h>
#include <sched.h>
#include <stdexcept>
#include <string>

// Pin the calling thread to a specific CPU core.
// On dual-socket servers, cross-NUMA access adds 80-120 ns of inter-socket
// latency; the packet-processing thread must live on the same NUMA node as
// the NIC's interrupt and DMA buffers.
void pinToCore(int core_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_id, &cpuset);
    if (pthread_setaffinity_np(pthread_self(),
                               sizeof(cpuset), &cpuset) != 0)
        throw std::runtime_error("setaffinity failed: core " +
                                 std::to_string(core_id));
}

// Determine NUMA node of NIC from sysfs, then select a core on that node.
// e.g., cat /sys/class/net/eth0/device/numa_node  => 1
// Then pin to a core known to be on node 1.
void setupRecvThread(int nic_numa_node) {
    // On a 2-socket machine: node 0 owns cores 0-9, node 1 owns cores 10-19
    int base_core = nic_numa_node * 10;
    pinToCore(base_core + 2); // leave core 0 for OS interrupts
}`,
    explanation: "The OS scheduler is unaware of NIC topology and may migrate threads across NUMA nodes; explicit affinity pinning prevents this and ensures all DMA buffers, ring descriptors, and application state reside in the same memory domain, cutting median packet-to-application latency from ~400 ns to ~280 ns on a typical dual-socket setup.",
  },
  {
    id: "cpp-20260627-b1-cpp20-barrier",
    language: "cpp",
    title: "std::barrier for synchronized parallel Greeks",
    tag: "concurrency",
    code: `#include <barrier>
#include <thread>
#include <vector>
#include <cmath>
#include <cstddef>

// Compute delta and vega for a strip of options in parallel.
// std::barrier synchronizes both threads before results are read.
void parallelGreeks(const std::vector<double>& strikes,
                    double S, double r, double sigma, double T) {
    const std::size_t N = strikes.size();
    std::vector<double> deltas(N), vegas(N);

    // Completion callback: runs on the thread that arrives last
    auto on_phase_done = []() noexcept {};
    std::barrier sync_point{2, on_phase_done};

    auto normCDF = [](double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); };

    auto worker = [&](std::size_t lo, std::size_t hi) {
        for (std::size_t i = lo; i < hi; ++i) {
            double d1 = (std::log(S / strikes[i]) +
                         (r + 0.5 * sigma * sigma) * T) /
                        (sigma * std::sqrt(T));
            double d2 = d1 - sigma * std::sqrt(T);
            deltas[i] = normCDF(d1);
            // Vega: dC/dsigma = S * phi(d1) * sqrt(T)
            vegas[i]  = S * std::exp(-0.5 * d1 * d1) /
                        std::sqrt(2.0 * M_PI) * std::sqrt(T);
        }
        sync_point.arrive_and_wait(); // blocks until both threads finish
    };

    std::thread t1(worker, 0,   N / 2);
    std::thread t2(worker, N / 2, N);
    t1.join(); t2.join();
    // deltas and vegas are fully populated here
}`,
    explanation: "Unlike a one-shot std::latch, std::barrier is reusable across multiple phases — the same barrier object can synchronize N parallel computation rounds without reconstruction, which matters for iterative calibration loops where threads alternate between computation and parameter-update phases.",
  },
  {
    id: "cpp-20260627-b1-concepts-price",
    language: "cpp",
    title: "C++20 Concepts: constrain templates to price types",
    tag: "templates",
    code: `#include <concepts>
#include <cmath>
#include <type_traits>

// Named concept: T must be a floating-point type usable for financial prices
template<typename T>
concept Price = std::floating_point<T>;

// Constrain without enable_if — error messages name the violated concept
template<Price T>
T blackScholesCall(T S, T K, T r, T sigma, T tau) {
    auto N = [](T x) -> T { return T(0.5) * std::erfc(-x / std::sqrt(T(2))); };
    T d1 = (std::log(S / K) + (r + T(0.5) * sigma * sigma) * tau)
           / (sigma * std::sqrt(tau));
    T d2 = d1 - sigma * std::sqrt(tau);
    return S * N(d1) - K * std::exp(-r * tau) * N(d2);
}

// Concept composition: monotone decreasing bid-ask spread
template<typename Spread>
concept ValidSpread = Price<Spread> && requires(Spread s) {
    { s > Spread{0} } -> std::convertible_to<bool>;
};

template<ValidSpread T>
bool isTightEnough(T bid_ask_spread, T threshold) {
    return bid_ask_spread < threshold;
}

void demo() {
    double c = blackScholesCall(100.0, 100.0, 0.05, 0.2, 1.0); // ok
    // blackScholesCall(100, 100, 0, 0, 1);  // error: int does not satisfy Price
    (void)c;
}`,
    explanation: "Concepts move constraint checking from instantiation time (SFINAE error in std::enable_if) to declaration time, so a call like blackScholesCall<int>(...) produces a one-line 'does not satisfy Price' error instead of a 30-line substitution-failure traceback.",
  },
  {
    id: "cpp-20260627-b1-fix-parser",
    language: "cpp",
    title: "FIX 4.2 zero-copy tag-value parser",
    tag: "market-data",
    code: `#include <string_view>
#include <charconv>
#include <cstdint>
#include <functional>

// Parse a FIX message in-place: no heap, no copies.
// FIX format: tag=value\x01 tag=value\x01 ...
// Key tags: 35=MsgType, 49=SenderCompID, 55=Symbol, 44=Price, 38=OrderQty
class FIXParser {
    static constexpr char SOH = '\x01';
public:
    using FieldCallback = std::function<void(uint32_t tag, std::string_view value)>;

    static void parse(std::string_view msg, FieldCallback cb) {
        while (!msg.empty()) {
            auto eq = msg.find('=');
            if (eq == std::string_view::npos) break;

            uint32_t tag = 0;
            std::from_chars(msg.data(), msg.data() + eq, tag); // no alloc

            msg.remove_prefix(eq + 1);
            auto soh = msg.find(SOH);
            std::string_view val = (soh == std::string_view::npos)
                                   ? msg : msg.substr(0, soh);
            cb(tag, val);

            if (soh == std::string_view::npos) break;
            msg.remove_prefix(soh + 1);
        }
    }
};

void demo() {
    const char raw[] = "35=D\x01""49=CLIENT\x01""55=AAPL\x01""44=189.50\x01""38=100\x01";
    FIXParser::parse(raw, [](uint32_t tag, std::string_view val) {
        if (tag == 35 && val == "D") { /* New Order Single */ }
        if (tag == 44) {
            double price = 0;
            std::from_chars(val.data(), val.data() + val.size(), price);
            (void)price;
        }
    });
}`,
    explanation: "string_view into the raw receive buffer and from_chars for numeric conversion avoid all heap allocation on the critical receive path; this zero-copy design achieves 5-10x higher throughput than sscanf/strtod alternatives because the entire parse of a typical FIX order fits within two cache lines.",
  },
  {
    id: "cpp-20260627-b1-price-ladder",
    language: "cpp",
    title: "Order book: sorted map + hash map dual structure",
    tag: "market-data",
    code: `#include <map>
#include <unordered_map>
#include <cstdint>
#include <functional>

struct Order { uint64_t id; double price; uint32_t qty; bool is_buy; };

class OrderBook {
    // Bids descending (best bid first), asks ascending (best ask first)
    std::map<double, uint32_t, std::greater<double>> bids_;
    std::map<double, uint32_t>                        asks_;
    std::unordered_map<uint64_t, Order>               by_id_;

public:
    void add(const Order& o) {
        by_id_[o.id] = o;
        (o.is_buy ? bids_[o.price] : asks_[o.price]) += o.qty;
    }

    void cancel(uint64_t id) {
        auto it = by_id_.find(id);
        if (it == by_id_.end()) return;
        const Order& o = it->second;
        auto& side = o.is_buy ? bids_[o.price] : asks_[o.price];
        side -= o.qty;
        if (side == 0) {
            if (o.is_buy) bids_.erase(o.price);
            else          asks_.erase(o.price);
        }
        by_id_.erase(it);
    }

    double bestBid() const { return bids_.empty() ? 0.0 : bids_.begin()->first; }
    double bestAsk() const { return asks_.empty() ? 0.0 : asks_.begin()->first; }
    double spread()  const { return bestAsk() - bestBid(); }
};`,
    explanation: "The dual-structure design separates concerns: the ordered map gives O(log n) best-bid/ask iteration (needed for NBBO computation and sweep), while the unordered_map gives O(1) cancel-by-id without scanning price levels — a pure-sorted-map implementation would need O(n) to cancel arbitrary orders.",
  },
  {
    id: "cpp-20260627-b1-fd-bs-pde",
    language: "cpp",
    title: "Finite difference explicit Euler for Black-Scholes PDE",
    tag: "pricing",
    code: `#include <vector>
#include <algorithm>
#include <cmath>
#include <cstddef>

// Explicit Euler scheme for the BS PDE (backwards in time).
// Stability requires dt <= dS^2 / (sigma^2 * Smax^2) — the CFL condition.
std::vector<double> fdBSCall(double S0, double K, double r,
                              double sigma, double T,
                              std::size_t M, std::size_t N) {
    double dt   = T / M;
    double Smax = 4.0 * K;
    double dS   = Smax / N;

    std::vector<double> V(N + 1), Vnew(N + 1);

    // Terminal payoff
    for (std::size_t j = 0; j <= N; ++j)
        V[j] = std::max(static_cast<double>(j) * dS - K, 0.0);

    // March backward in time
    for (std::size_t i = 0; i < M; ++i) {
        double t_curr = T - i * dt;
        for (std::size_t j = 1; j < N; ++j) {
            double S     = j * dS;
            double delta = (V[j+1] - V[j-1]) / (2.0 * dS);
            double gamma = (V[j+1] - 2.0*V[j] + V[j-1]) / (dS * dS);
            double theta = 0.5*sigma*sigma*S*S*gamma + r*S*delta - r*V[j];
            Vnew[j] = V[j] + dt * theta;
        }
        Vnew[0] = 0.0;                              // call = 0 at S=0
        Vnew[N] = Smax - K * std::exp(-r * t_curr); // deep ITM boundary
        std::swap(V, Vnew);
    }
    return V; // V[j] = price at S = j*dS; interpolate for S0
}`,
    explanation: "The explicit scheme is the simplest FD method but conditional stable only when dt satisfies the CFL condition (roughly dt < 1/(sigma^2 * N^2)); Crank-Nicolson is unconditionally stable and second-order in both dt and dS but requires solving a tridiagonal system at each time step.",
  },
  {
    id: "cpp-20260627-b1-asian-mc",
    language: "cpp",
    title: "Arithmetic Asian call via Monte Carlo",
    tag: "pricing",
    code: `#include <random>
#include <cmath>
#include <cstdint>

// Arithmetic-average Asian call: payoff = max(A - K, 0) where A = mean(S_t).
// No closed-form exists for the arithmetic average; MC is the standard approach.
double asianCallMC(double S0, double K, double r, double sigma,
                   double T, int steps, int paths, unsigned seed = 42) {
    double dt    = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);

    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;

    double sum_payoff = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S = S0, price_sum = 0.0;
        for (int t = 0; t < steps; ++t) {
            S          *= std::exp(drift + vol * Z(rng));
            price_sum  += S;
        }
        sum_payoff += std::max(price_sum / steps - K, 0.0);
    }
    return std::exp(-r * T) * (sum_payoff / paths);
}

// Standard error of the MC estimate: sigma_payoff / sqrt(paths)
// Use geometric Asian (Kemna-Vorst closed form) as a control variate
// to reduce variance by ~90% without extra paths.`,
    explanation: "The averaging in an Asian option compresses the effective volatility: a realized vol of sigma implies the arithmetic average has vol approximately sigma/sqrt(3) (for uniform monitoring), making Asian options structurally cheaper than vanillas and attractive for commodity hedgers who care about average prices over a delivery period.",
  },
  {
    id: "cpp-20260627-b1-lookback-mc",
    language: "cpp",
    title: "Floating-strike lookback call Monte Carlo",
    tag: "pricing",
    code: `#include <random>
#include <cmath>
#include <algorithm>

// Floating-strike lookback call: payoff = S_T - min_{0<=t<=T}(S_t).
// Buyer achieves the perfect hindsight minimum entry price.
double lookbackCallMC(double S0, double r, double sigma,
                      double T, int steps, int paths, unsigned seed = 42) {
    double dt    = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);

    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;

    double sum_payoff = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S = S0, Smin = S0;
        for (int t = 0; t < steps; ++t) {
            S    *= std::exp(drift + vol * Z(rng));
            Smin  = std::min(Smin, S);
        }
        sum_payoff += S - Smin;  // always >= 0
    }
    return std::exp(-r * T) * (sum_payoff / paths);
}

// Conze-Viswanathan closed form exists for the CONTINUOUS monitoring case.
// Discrete monitoring (daily checks) prices 10-40 bps below continuous
// due to the Broadie-Glasserman-Kou correction: multiply continuous price
// by exp(0.5826 * sigma * sqrt(T/steps)).`,
    explanation: "The lookback's payoff is always non-negative by construction, making it the most expensive path-dependent option; its MC variance is high because Smin is dominated by rare large downmoves — antithetic variates or bridge sampling reduce this substantially.",
  },
  {
    id: "cpp-20260627-b1-barrier-mc",
    language: "cpp",
    title: "Knock-out barrier option Monte Carlo",
    tag: "pricing",
    code: `#include <random>
#include <cmath>
#include <algorithm>

// Down-and-out call: knocked out if S ever falls to or below barrier H.
// Closed form exists for CONTINUOUS barrier; MC handles discrete monitoring.
double downAndOutCallMC(double S0, double K, double H,
                        double r, double sigma, double T,
                        int steps, int paths, unsigned seed = 42) {
    double dt    = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);

    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;

    double sum_payoff = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S     = S0;
        bool knocked = false;
        for (int t = 0; t < steps && !knocked; ++t) {
            S *= std::exp(drift + vol * Z(rng));
            if (S <= H) knocked = true;
        }
        if (!knocked)
            sum_payoff += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * (sum_payoff / paths);
}

// Brownian bridge correction: the exact probability that a continuous path
// crosses the barrier between monitoring dates =
//   exp(-2 * log(S_t/H) * log(S_{t+1}/H) / (sigma^2 * dt))`,
    explanation: "Discrete monitoring means the path could cross the barrier between observation points and not be recorded as knocked-out, making discrete barrier options consistently more expensive than continuous; the Brownian bridge correction converts an MC estimate for discrete barriers into one that approximates the continuous limit.",
  },
  {
    id: "cpp-20260627-b1-crtp",
    language: "cpp",
    title: "CRTP static polymorphism — no vtable per order",
    tag: "templates",
    code: `#include <cstdint>

// Without CRTP: virtual functions add ~8 bytes vtable pointer per object
// and ~3-5 ns indirect call overhead per dispatch.
// With CRTP: method resolution at compile time, zero runtime overhead.
template<typename Derived>
struct OrderBase {
    double   price()  const { return static_cast<const Derived*>(this)->priceImpl(); }
    uint32_t qty()    const { return static_cast<const Derived*>(this)->qtyImpl(); }
    bool     is_buy() const { return static_cast<const Derived*>(this)->isBuyImpl(); }
    double   notional() const { return price() * qty(); }
};

struct LimitOrder : OrderBase<LimitOrder> {
    double price_; uint32_t qty_; bool is_buy_;
    double   priceImpl()  const { return price_; }
    uint32_t qtyImpl()    const { return qty_; }
    bool     isBuyImpl()  const { return is_buy_; }
};

struct MarketOrder : OrderBase<MarketOrder> {
    uint32_t qty_; bool is_buy_;
    double   priceImpl()  const { return 0.0; }  // no price for market orders
    uint32_t qtyImpl()    const { return qty_; }
    bool     isBuyImpl()  const { return is_buy_; }
};

// Generic handler — resolved at compile time, not at runtime
template<typename T>
void route(const OrderBase<T>& o) {
    if (o.is_buy()) { /* send to buy queue */ }
    else            { /* send to sell queue */ }
    (void)o.notional();
}`,
    explanation: "CRTP achieves the code-reuse benefit of inheritance without dynamic dispatch by encoding the derived type in the base template parameter, letting the compiler inline all OrderBase methods into the derived type's call sites — the resulting binary has no vtable, no vptr storage, and no indirect branch on the hot order-routing path.",
  },
  {
    id: "cpp-20260627-b1-variant-dispatch",
    language: "cpp",
    title: "std::variant market message dispatch — zero heap",
    tag: "patterns",
    code: `#include <variant>
#include <cstdint>
#include <cstddef>

struct NewOrder   { uint64_t id; double price; uint32_t qty; bool is_buy; };
struct CancelOrder{ uint64_t id; };
struct Execution  { uint64_t id; uint32_t fill_qty; double fill_price; };
struct Quote      { double bid; double ask; uint32_t bid_sz; uint32_t ask_sz; };

using Msg = std::variant<NewOrder, CancelOrder, Execution, Quote>;

// Overload pattern: lambda per type, resolved at compile time
template<typename... Ts> struct Overload : Ts... { using Ts::operator()...; };
template<typename... Ts> Overload(Ts...) -> Overload<Ts...>;

struct Stats { uint64_t orders{}, cancels{}, execs{}; double last_px{}; };

void processMessages(const Msg* msgs, std::size_t n, Stats& s) {
    for (std::size_t i = 0; i < n; ++i) {
        std::visit(Overload{
            [&](const NewOrder&)    { ++s.orders;  },
            [&](const CancelOrder&) { ++s.cancels; },
            [&](const Execution& e) { ++s.execs; s.last_px = e.fill_price; },
            [&](const Quote&)       { /* update NBBO */ },
        }, msgs[i]);
    }
}`,
    explanation: "std::variant stores all alternatives in a fixed-size discriminated union with no heap allocation; std::visit dispatches through a compiler-generated jump table rather than a vtable, giving the same O(1) type dispatch as virtual functions without per-object pointer overhead or heap allocation per message.",
  },
  {
    id: "cpp-20260627-b1-constexpr-greeks",
    language: "cpp",
    title: "constexpr Black-Scholes Greeks evaluated at compile time",
    tag: "pricing",
    code: `#include <cmath>

// Abramowitz & Stegun rational approximation for N(x); max error 7.5e-8.
// constexpr-compatible in C++20 (cmath functions are constexpr).
constexpr double normCDF(double x) {
    constexpr double a1= 0.31938153, a2=-0.356563782,
                     a3= 1.781477937, a4=-1.821255978, a5= 1.330274429;
    double k   = 1.0 / (1.0 + 0.2316419 * (x < 0 ? -x : x));
    double poly= k*(a1 + k*(a2 + k*(a3 + k*(a4 + k*a5))));
    double phi = std::exp(-0.5*x*x) / std::sqrt(2.0 * M_PI);
    double res = 1.0 - phi * poly;
    return x >= 0.0 ? res : 1.0 - res;
}

constexpr double bsDelta(double S, double K, double r, double sigma, double T) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    return normCDF(d1);
}

constexpr double bsVega(double S, double K, double r, double sigma, double T) {
    double d1  = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double phi = std::exp(-0.5*d1*d1) / std::sqrt(2.0 * M_PI);
    return S * phi * std::sqrt(T);
}

// Baked into the binary — zero runtime cost
constexpr double kAtmDelta = bsDelta(100.0, 100.0, 0.05, 0.20, 1.0);
constexpr double kAtmVega  = bsVega (100.0, 100.0, 0.05, 0.20, 1.0);`,
    explanation: "constexpr evaluation lets the compiler compute option Greeks for fixed benchmark parameters (ATM, standard maturities) during compilation, turning what would be runtime normCDF polynomial evaluations into a single load from the .rodata segment — useful for pre-populating strike grids or initial margin lookup tables.",
  },
  {
    id: "cpp-20260627-b1-pool-alloc",
    language: "cpp",
    title: "Fixed-block pool allocator for orders — O(1) no malloc",
    tag: "performance",
    code: `#include <cstddef>
#include <cassert>
#include <array>
#include <cstdint>

// Each Block overlaps with a free-list pointer when unused,
// and with Order data when live — zero extra metadata per slot.
template<std::size_t BlockSize, std::size_t N>
class PoolAllocator {
    union Block { alignas(8) char data[BlockSize]; Block* next; };
    std::array<Block, N> pool_;
    Block* free_ = nullptr;

public:
    PoolAllocator() {
        for (std::size_t i = 0; i + 1 < N; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[N - 1].next = nullptr;
        free_ = &pool_[0];
    }

    [[nodiscard]] void* allocate() noexcept {
        if (!free_) return nullptr;
        Block* b = free_;
        free_ = b->next;
        return b->data;
    }

    void deallocate(void* p) noexcept {
        auto* b = reinterpret_cast<Block*>(p);
        b->next = free_;
        free_ = b;
    }
};

struct Order { uint64_t id; double price; uint32_t qty; };

// One global pool for 65 536 orders — allocated at program start, no growth
inline PoolAllocator<sizeof(Order), 65536> g_order_pool;

Order* newOrder() { return new(g_order_pool.allocate()) Order{}; }
void   delOrder(Order* o) { o->~Order(); g_order_pool.deallocate(o); }`,
    explanation: "The pool allocator reduces allocation cost from ~100 ns (glibc malloc) to ~1-2 ns (a pointer load and store) by pre-allocating all blocks at startup; the union trick means a free slot stores only the next-pointer, so the pool's memory footprint equals exactly N * sizeof(Order) with no per-block header.",
  },
  {
    id: "cpp-20260627-b1-false-sharing",
    language: "cpp",
    title: "Cache line padding to eliminate false sharing",
    tag: "performance",
    code: `#include <atomic>
#include <thread>
#include <cstdint>
#include <cstddef>

// BAD: both counters likely share a 64-byte cache line.
// Thread 1 writing counter_a and thread 2 writing counter_b cause the
// line to ping-pong between cores under the MESI protocol — ~100 ns/op.
struct BadCounters {
    std::atomic<uint64_t> counter_a{0};
    std::atomic<uint64_t> counter_b{0};
};

// GOOD: each counter occupies its own cache line.
// C++17 hardware_destructive_interference_size is the portable constant.
static constexpr std::size_t kCacheLine = 64;

struct alignas(kCacheLine) PaddedCounter {
    std::atomic<uint64_t> value{0};
    char pad[kCacheLine - sizeof(std::atomic<uint64_t>)]{};
};

struct GoodCounters {
    PaddedCounter recv;  // cache line 0
    PaddedCounter send;  // cache line 1
};

void bench() {
    GoodCounters gc;
    std::thread t1([&]{ for (int i=0;i<1'000'000;++i) gc.recv.value.fetch_add(1, std::memory_order_relaxed); });
    std::thread t2([&]{ for (int i=0;i<1'000'000;++i) gc.send.value.fetch_add(1, std::memory_order_relaxed); });
    t1.join(); t2.join();
}`,
    explanation: "False sharing is invisible to the programmer — both writes are to different variables — but the hardware treats them as conflicting because the cache coherency protocol operates at cache-line granularity; padding each hot variable to its own cache line turns an O(n) coherency-traffic problem into O(1) independent writes.",
  },
  {
    id: "cpp-20260627-b1-rdtsc",
    language: "cpp",
    title: "RDTSC cycle-accurate latency measurement",
    tag: "performance",
    code: `#include <cstdint>
#include <algorithm>

// RDTSC: reads CPU timestamp counter — no syscall, ~25 cycle overhead.
// RDTSCP: serializing variant — ensures all prior stores are visible.
inline uint64_t rdtsc_start() {
    uint32_t lo, hi;
    // CPUID before RDTSC serializes the instruction stream
    __asm__ __volatile__(
        "cpuid\n\t"
        "rdtsc\n\t"
        : "=a"(lo), "=d"(hi) :: "rbx", "rcx"
    );
    return (static_cast<uint64_t>(hi) << 32) | lo;
}

inline uint64_t rdtsc_stop() {
    uint32_t lo, hi;
    // RDTSCP serializes and also outputs IA32_TSC_AUX (processor id) in ecx
    __asm__ __volatile__(
        "rdtscp\n\t"
        : "=a"(lo), "=d"(hi) :: "rcx"
    );
    return (static_cast<uint64_t>(hi) << 32) | lo;
}

// Measure a function call in cycles
template<typename Fn>
uint64_t measureCycles(Fn&& fn, int warmup = 5, int runs = 100) {
    for (int i = 0; i < warmup; ++i) fn(); // warm caches
    uint64_t best = UINT64_MAX;
    for (int i = 0; i < runs; ++i) {
        uint64_t t0 = rdtsc_start();
        fn();
        uint64_t t1 = rdtsc_stop();
        best = std::min(best, t1 - t0);
    }
    return best; // best-of-N removes OS jitter
}`,
    explanation: "RDTSC is far cheaper than clock_gettime (~200 ns syscall) but requires careful serialization: CPUID before start and RDTSCP at stop prevents out-of-order execution from inflating the measurement; taking the minimum over many runs removes OS jitter and gives the true hardware latency floor.",
  },
  {
    id: "cpp-20260627-b1-mmap-prices",
    language: "cpp",
    title: "Memory-mapped file for historical OHLCV data",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstddef>
#include <stdexcept>

struct OHLCV {
    uint64_t timestamp_ns;
    double   open, high, low, close;
    uint64_t volume;
};  // 48 bytes — 1.33 records per cache line

class PriceFile {
    void*       addr_ = MAP_FAILED;
    std::size_t size_ = 0;
    int         fd_   = -1;

public:
    explicit PriceFile(const char* path) {
        fd_ = open(path, O_RDONLY);
        if (fd_ < 0) throw std::runtime_error("open");
        struct stat st; fstat(fd_, &st);
        size_ = static_cast<std::size_t>(st.st_size);
        // MAP_SHARED: pages are loaded on-demand, never copied to userspace
        addr_ = mmap(nullptr, size_, PROT_READ, MAP_SHARED, fd_, 0);
        if (addr_ == MAP_FAILED) throw std::runtime_error("mmap");
        madvise(addr_, size_, MADV_SEQUENTIAL); // trigger kernel readahead
    }

    ~PriceFile() {
        if (addr_ != MAP_FAILED) munmap(addr_, size_);
        if (fd_ >= 0)            close(fd_);
    }

    const OHLCV* data()  const { return static_cast<const OHLCV*>(addr_); }
    std::size_t  count() const { return size_ / sizeof(OHLCV); }

    // Zero-copy range slice — no allocation
    const OHLCV* slice(std::size_t from, std::size_t to) const {
        return data() + from;
        (void)to;
    }
};`,
    explanation: "mmap with MADV_SEQUENTIAL triggers the kernel's page prefetcher to read-ahead 128KB+ in advance; for sequential backtesting over gigabytes of tick data this sustains near-disk-bandwidth throughput while allowing the kernel to evict cold pages, keeping the process RSS small regardless of file size.",
  },
  {
    id: "cpp-20260627-b1-jthread",
    language: "cpp",
    title: "std::jthread with stop_token for graceful shutdown",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <cstdint>

struct Order { uint64_t id; double price; };

class OrderProcessor {
    std::queue<Order>         q_;
    std::mutex                mu_;
    std::condition_variable_any cv_; // must support stop_token overload

    void run(std::stop_token tok) {
        while (true) {
            std::unique_lock lock(mu_);
            // Wakes on new order OR stop request — no busy wait
            bool got_work = cv_.wait(lock, tok,
                                     [this]{ return !q_.empty(); });
            if (!got_work) break; // stop requested and queue empty
            Order o = q_.front(); q_.pop();
            lock.unlock();
            process(o);
        }
    }

    void process(const Order& o) { (void)o; }

    std::jthread worker_; // declares AFTER fields it captures

public:
    OrderProcessor()
        : worker_([this](std::stop_token t){ run(t); }) {}

    void submit(Order o) {
        { std::lock_guard g(mu_); q_.push(o); }
        cv_.notify_one();
    }
    // ~OrderProcessor() calls worker_.request_stop() then join() automatically
};`,
    explanation: "std::jthread owns a stop_source internally and requests a stop then joins in its destructor, eliminating the std::thread anti-pattern of forgetting to join; condition_variable_any::wait with a stop_token enables the waiting thread to unblock on shutdown without a polling loop or a sentinel value in the queue.",
  },
  {
    id: "cpp-20260627-b1-thread-local",
    language: "cpp",
    title: "Thread-local counters — lock-free per-thread stats",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <cstddef>
#include <numeric>
#include <array>

// Each thread writes its own stats slot with no atomic operations on the hot path.
// Aggregation reads all slots on a slow path (e.g., metrics export every second).
static constexpr int kMaxThreads = 64;

struct alignas(64) ThreadStats {   // one full cache line per thread
    uint64_t msg_in   = 0;
    uint64_t msg_out  = 0;
    uint64_t rejected = 0;
    char     _pad[64 - 3 * sizeof(uint64_t)]{};
};

inline std::array<ThreadStats, kMaxThreads> g_stats{};
inline std::atomic<int> g_next_id{0};
inline thread_local int g_tid = g_next_id.fetch_add(1, std::memory_order_relaxed);

// Hot path: plain integer increment — compiles to a single ADD
inline void countIn()       { g_stats[g_tid].msg_in++; }
inline void countOut()      { g_stats[g_tid].msg_out++; }
inline void countReject()   { g_stats[g_tid].rejected++; }

// Slow path: aggregate across all registered threads
uint64_t totalIn(int num_threads) {
    uint64_t s = 0;
    for (int i = 0; i < num_threads; ++i) s += g_stats[i].msg_in;
    return s;
}`,
    explanation: "thread_local storage eliminates atomic RMW instructions on the counting hot path (a single mov vs an XADD + cache coherency round-trip); the 64-byte alignment of each ThreadStats slot prevents false sharing between threads, making this approach effectively free — ~10 ps per increment vs ~15 ns for a shared atomic counter.",
  },
  {
    id: "cpp-20260627-b1-prefetch",
    language: "cpp",
    title: "Software prefetch for order array scan",
    tag: "performance",
    code: `#include <cstddef>
#include <cstdint>

struct Order { uint64_t id; double price; uint32_t qty; char symbol[8]; };
// sizeof(Order) = 32 bytes; 2 per cache line

// Prefetch DIST orders ahead so the cache line arrives before the CPU needs it.
// __builtin_prefetch(addr, rw, locality):
//   rw=0 = read, locality 0-3 (0=evict after use, 3=keep in all caches)
double sumNotional(const Order* orders, std::size_t n) {
    constexpr std::size_t DIST = 8; // 8 * 32 = 256 bytes = 4 cache lines ahead
    double total = 0.0;

    for (std::size_t i = 0; i < n; ++i) {
        if (i + DIST < n)
            __builtin_prefetch(&orders[i + DIST], 0 /*read*/, 1 /*L2 only*/);
        total += orders[i].price * static_cast<double>(orders[i].qty);
    }
    return total;
}

// For write-dominated scans use rw=1.
// Tune DIST by profiling: too small = prefetch arrives late,
// too large = pollutes cache with data not yet needed.`,
    explanation: "Software prefetch hides the ~4 ns L1-miss / ~12 ns L2-miss / ~70 ns L3-miss latency chain by issuing a non-blocking prefetch instruction several iterations ahead of the access; the optimal distance is L3-miss-latency / (ns-per-loop-iteration) cache lines — typically 8-16 for computationally light loops.",
  },
  {
    id: "cpp-20260627-b1-coroutine-gen",
    language: "cpp",
    title: "C++20 generator coroutine for lazy order stream",
    tag: "modern-cpp",
    code: `#include <coroutine>
#include <optional>
#include <vector>
#include <cstdint>

struct Order { uint64_t id; double price; uint32_t qty; };

template<typename T>
struct Generator {
    struct promise_type {
        T value;
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v) noexcept { value = v; return {}; }
        Generator           get_return_object() {
            return { std::coroutine_handle<promise_type>::from_promise(*this) };
        }
        void return_void()        {}
        void unhandled_exception(){ std::terminate(); }
    };
    std::coroutine_handle<promise_type> h;
    ~Generator() { if (h) h.destroy(); }

    std::optional<T> next() {
        if (!h || h.done()) return {};
        h.resume();
        if (h.done())       return {};
        return h.promise().value;
    }
};

Generator<Order> buyOrders(const std::vector<Order>& src, double min_price) {
    for (const auto& o : src)
        if (o.price >= min_price && o.qty > 0)
            co_yield o;
}

void demo(const std::vector<Order>& orders) {
    auto gen = buyOrders(orders, 100.0);
    while (auto o = gen.next())
        (void)o->price; // process lazily, one at a time
}`,
    explanation: "Coroutine generators suspend after each co_yield and resume only when the caller calls next(), so the consumer controls pace and only decodes/filters as many orders as it needs without materializing a full filtered vector; this avoids an O(n) temporary allocation when the consumer typically reads only the first few matching orders.",
  },
  {
    id: "cpp-20260627-b1-delta-hedge",
    language: "cpp",
    title: "Discrete delta-hedging P&L simulation",
    tag: "risk",
    code: `#include <random>
#include <cmath>
#include <algorithm>

// Simulate the P&L of hedging a short call by rebalancing delta daily.
// Perfect continuous hedging => zero P&L. Discrete rebalancing =>
// residual ~ 0.5 * gamma * (realized_dS^2 - sigma^2 * S^2 * dt) per step.
double deltaHedgePnL(double S0, double K, double r, double sigma,
                     double T, int steps, unsigned seed = 42) {
    double dt    = T / steps;
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;

    auto normCDF = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    auto bsDelta = [&](double S, double t_rem) -> double {
        if (t_rem < 1e-10) return S > K ? 1.0 : 0.0;
        double d1 = (std::log(S/K)+(r+0.5*sigma*sigma)*t_rem)/(sigma*std::sqrt(t_rem));
        return normCDF(d1);
    };
    auto bsCall = [&](double S, double t_rem) -> double {
        if (t_rem < 1e-10) return std::max(S-K, 0.0);
        double d1 = (std::log(S/K)+(r+0.5*sigma*sigma)*t_rem)/(sigma*std::sqrt(t_rem));
        double d2 = d1 - sigma*std::sqrt(t_rem);
        return S*normCDF(d1) - K*std::exp(-r*t_rem)*normCDF(d2);
    };

    double S    = S0, t = T;
    double cash = bsCall(S, T);          // receive premium
    double pos  = -bsDelta(S, T);        // short delta shares initially
    cash -= pos * S;                      // finance initial position

    for (int i = 0; i < steps; ++i) {
        S    *= std::exp((r-0.5*sigma*sigma)*dt + sigma*std::sqrt(dt)*Z(rng));
        t    -= dt;
        cash *= std::exp(r * dt);         // accrue risk-free rate
        double new_pos = -bsDelta(S, t);
        cash -= (new_pos - pos) * S;      // rebalance: buy/sell shares
        pos   = new_pos;
    }
    return pos * S + cash - (-std::max(S - K, 0.0)); // net P&L vs short call payoff
}`,
    explanation: "The residual hedging P&L is proportional to gamma × (realized vol^2 – implied vol^2), which is why options market-makers care deeply about vol-of-vol: if realized vol deviates from implied, the hedging error is not zero-mean even in expectation, creating systematic P&L that must be managed through vega-neutral positions.",
  },
  {
    id: "cpp-20260627-b1-mpsc",
    language: "cpp",
    title: "MPSC queue — lock-free multi-producer single-consumer",
    tag: "concurrency",
    code: `#include <atomic>
#include <optional>
#include <memory>

// Based on the Dmitry Vyukov MPSC intrusive queue.
// push() uses a single atomic exchange (always succeeds, no retry loop).
// pop() is called only from the consumer thread — no CAS needed.
template<typename T>
class MPSCQueue {
    struct Node {
        T                  value;
        std::atomic<Node*> next{nullptr};
        explicit Node(T v) : value(std::move(v)) {}
    };

    // stub is the sentinel; tail is written by producers, head by consumer
    alignas(64) std::atomic<Node*> tail_;
    alignas(64) Node*              head_; // only consumer touches this

public:
    MPSCQueue() : tail_(new Node(T{})), head_(tail_.load()) {}
    ~MPSCQueue() {
        while (pop()) {}
        delete head_;
    }

    // Multiple producers may call concurrently
    void push(T val) {
        auto* n    = new Node(std::move(val));
        auto* prev = tail_.exchange(n, std::memory_order_acq_rel);
        prev->next.store(n, std::memory_order_release);
    }

    // Only one thread calls pop()
    std::optional<T> pop() {
        Node* next = head_->next.load(std::memory_order_acquire);
        if (!next) return {};
        T val = std::move(next->value);
        delete head_;
        head_ = next;
        return val;
    }
};`,
    explanation: "The key insight is that tail_.exchange (a single atomic swap) never fails, unlike a CAS retry loop — each producer atomically claims the tail slot and then links itself with a release store; the consumer observes a consistent linked list via the acquire load on next, achieving wait-free producers and lock-free consumer.",
  },
];
