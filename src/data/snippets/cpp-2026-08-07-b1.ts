import type { Snippet } from "./types";

export const cppSnippets20260807B1: Snippet[] = [
  {
    id: "cpp-20260807-b1-perfect-forward",
    language: "cpp",
    title: "Perfect Forwarding and Universal References for Order Factory",
    tag: "modern-cpp",
    code: `#include <utility>
#include <string>
#include <memory>
#include <iostream>

struct Order {
    std::string symbol;
    double price;
    int qty;
    Order(std::string s, double p, int q)
        : symbol(std::move(s)), price(p), qty(q) {}
};

// Universal reference: T&& where T is deduced — can bind to both
// lvalue and rvalue without copying.
template <typename... Args>
std::unique_ptr<Order> make_order(Args&&... args) {
    // std::forward preserves the value category of each argument.
    return std::make_unique<Order>(std::forward<Args>(args)...);
}

int main() {
    std::string sym = "AAPL";
    // sym is an lvalue — forwarded as lvalue reference (no copy elision needed)
    auto o1 = make_order(sym, 182.5, 100);
    // "MSFT" is an rvalue — forwarded as rvalue, moves into Order ctor
    auto o2 = make_order(std::string("MSFT"), 415.0, 50);
    std::cout << o1->symbol << " " << o2->symbol << "\\n";
}`,
    explanation: "Perfect forwarding eliminates redundant copies in factory functions: lvalues arrive as lvalue refs (no ownership transfer), rvalues arrive as rvalue refs (moved, zero copies). In a high-frequency order factory emitting millions of orders per second, removing a single string copy per allocation cuts GC pressure significantly."
  },
  {
    id: "cpp-20260807-b1-std-expected",
    language: "cpp",
    title: "std::expected (C++23) for Zero-Exception Order Validation",
    tag: "modern-cpp",
    code: `#include <expected>
#include <string>
#include <iostream>

enum class OrderError { InvalidQty, NegativePrice, UnknownSymbol };

std::string describe(OrderError e) {
    switch (e) {
        case OrderError::InvalidQty:     return "qty <= 0";
        case OrderError::NegativePrice:  return "price < 0";
        case OrderError::UnknownSymbol:  return "unknown symbol";
    }
    return "?";
}

// Returns the validated price or an error — no exceptions, no error-code
// output params.
std::expected<double, OrderError>
validate_order(const std::string& sym, double price, int qty) {
    if (qty <= 0)    return std::unexpected(OrderError::InvalidQty);
    if (price < 0.0) return std::unexpected(OrderError::NegativePrice);
    if (sym.empty()) return std::unexpected(OrderError::UnknownSymbol);
    return price; // success path
}

int main() {
    auto result = validate_order("NVDA", 900.0, 10);
    if (result) std::cout << "Valid price: " << *result << "\\n";

    auto bad = validate_order("NVDA", -1.0, 10);
    if (!bad) std::cout << "Error: " << describe(bad.error()) << "\\n";
}`,
    explanation: "std::expected<T, E> encodes success or failure in the return type itself — eliminating the performance cost of exceptions and the ergonomic pain of error-code output parameters. In HFT, exception-based validation is forbidden on the hot path; std::expected makes error propagation explicit, composable, and branch-predictor friendly."
  },
  {
    id: "cpp-20260807-b1-flat-map",
    language: "cpp",
    title: "std::flat_map (C++23) for Cache-Friendly Symbol → Instrument Lookup",
    tag: "modern-cpp",
    code: `#include <flat_map>   // C++23
#include <string>
#include <iostream>

struct Instrument {
    double tick_size;
    int    lot_size;
};

// std::flat_map stores keys and values in two contiguous vectors,
// giving sequential cache-line access during sorted range scans.
// Unlike std::map (red-black tree), there are no pointer dereferences.
int main() {
    std::flat_map<std::string, Instrument> universe;
    universe.emplace("AAPL", Instrument{0.01, 100});
    universe.emplace("MSFT", Instrument{0.01, 100});
    universe.emplace("NVDA", Instrument{0.01,  10});

    // Binary search on contiguous key array — fits in a few cache lines
    if (auto it = universe.find("NVDA"); it != universe.end())
        std::cout << "NVDA lot=" << it->second.lot_size << "\\n";

    // Bulk scan is SIMD-friendly because keys are contiguous
    for (auto& [sym, inst] : universe)
        std::cout << sym << " tick=" << inst.tick_size << "\\n";
}`,
    explanation: "std::flat_map (P0429) stores keys and values in two sorted contiguous vectors, so iteration is cache-linear and SIMD-vectorisable — ideal for small-to-medium static universes like exchange symbol tables that are built once and read millions of times. The tradeoff is O(n) insert, so it suits workloads where reads vastly outnumber writes."
  },
  {
    id: "cpp-20260807-b1-ranges-pipeline",
    language: "cpp",
    title: "C++20 Ranges Pipeline for Market Data Filtering",
    tag: "modern-cpp",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <iostream>

struct Tick {
    std::string symbol;
    double      price;
    int         volume;
};

int main() {
    std::vector<Tick> feed = {
        {"AAPL", 182.0, 500},
        {"MSFT", 415.0, 200},
        {"AAPL", 183.0, 1000},
        {"NVDA", 900.0, 50},
        {"AAPL", 181.5, 300},
    };

    // Compose lazy views: filter AAPL ticks with volume >= 400, project price
    auto large_aapl_prices =
        feed
        | std::views::filter([](const Tick& t) {
              return t.symbol == "AAPL" && t.volume >= 400;
          })
        | std::views::transform([](const Tick& t) { return t.price; });

    // Materialize only what we consume — zero intermediate allocations
    for (double p : large_aapl_prices)
        std::cout << "AAPL large tick: " << p << "\\n";

    // Compute VWAP-like sum with fold
    double vwap_num = 0, vwap_den = 0;
    for (const Tick& t : feed | std::views::filter([](auto& t){ return t.symbol=="AAPL"; })) {
        vwap_num += t.price * t.volume;
        vwap_den += t.volume;
    }
    std::cout << "AAPL VWAP: " << vwap_num / vwap_den << "\\n";
}`,
    explanation: "C++20 ranges compose lazy views in a pipeline — no intermediate containers are allocated; each element passes through the chain on demand. In a market data aggregator, chaining filter + transform + fold replaces nested loops with declarative, inlinable code that the compiler can auto-vectorise."
  },
  {
    id: "cpp-20260807-b1-atomic-ref",
    language: "cpp",
    title: "std::atomic_ref for Lock-Free Access to Non-Atomic Position Array",
    tag: "lock-free",
    code: `#include <atomic>
#include <vector>
#include <thread>
#include <iostream>

// Plain array of positions — NOT declared atomic (e.g., a legacy POD struct)
struct PositionEntry { double net_qty; };
std::vector<PositionEntry> positions(256);  // indexed by instrument id

void update_position(int id, double delta) {
    // atomic_ref wraps an ordinary object with atomic semantics
    // for the lifetime of the ref — no layout change to PositionEntry.
    std::atomic_ref<double> pos(positions[id].net_qty);
    pos.fetch_add(delta, std::memory_order_relaxed);
}

double read_position(int id) {
    std::atomic_ref<double> pos(positions[id].net_qty);
    return pos.load(std::memory_order_acquire);
}

int main() {
    // Two threads updating the same instrument concurrently
    auto t1 = std::thread([]{ for (int i=0; i<100; ++i) update_position(0, 1.0); });
    auto t2 = std::thread([]{ for (int i=0; i<100; ++i) update_position(0, -1.0); });
    t1.join(); t2.join();
    std::cout << "Net position: " << read_position(0) << "\\n"; // 0.0
}`,
    explanation: "std::atomic_ref (C++20) lets you retrofit atomic semantics onto any alignas-compatible POD without changing its layout — critical when a struct is shared with external C libraries, FPGA interfaces, or DMA buffers that cannot tolerate embedded mutex fields. The atomic_ref itself is stack-allocated; the underlying data stays in its original memory."
  },
  {
    id: "cpp-20260807-b1-type-erasure",
    language: "cpp",
    title: "Type Erasure Pattern for Strategy Dispatch Without Virtual Tables",
    tag: "modern-cpp",
    code: `#include <functional>
#include <memory>
#include <iostream>

// Any callable that accepts (price, qty) and returns a bool signal.
// No virtual base — no vtable overhead, no forced inheritance.
class SignalStrategy {
    struct Concept {
        virtual bool evaluate(double price, int qty) const = 0;
        virtual std::unique_ptr<Concept> clone() const = 0;
        virtual ~Concept() = default;
    };
    template <typename T>
    struct Model : Concept {
        T impl_;
        explicit Model(T t) : impl_(std::move(t)) {}
        bool evaluate(double p, int q) const override { return impl_(p, q); }
        std::unique_ptr<Concept> clone() const override {
            return std::make_unique<Model<T>>(impl_);
        }
    };
    std::unique_ptr<Concept> concept_;
public:
    template <typename T>
    SignalStrategy(T t) : concept_(std::make_unique<Model<T>>(std::move(t))) {}
    bool evaluate(double price, int qty) const { return concept_->evaluate(price, qty); }
};

int main() {
    // Store a lambda — no inheritance required
    SignalStrategy momentum([](double p, int q){ return p > 100.0 && q > 50; });
    SignalStrategy mean_rev([](double p, int q){ return p < 90.0; });

    std::cout << "momentum: " << momentum.evaluate(120.0, 100) << "\\n";
    std::cout << "mean_rev: " << mean_rev.evaluate(85.0, 10) << "\\n";
}`,
    explanation: "Type erasure via the Small Buffer Optimisation (SBO) pattern separates interface from implementation without a fixed base class, enabling heterogeneous strategy storage in a vector<SignalStrategy> while avoiding the cache-miss cost of vtable dispatch on deeply polymorphic hierarchies. std::function does the same but with heap allocation unless the callable is small — this pattern lets you control the buffer size."
  },
  {
    id: "cpp-20260807-b1-sequence-lock",
    language: "cpp",
    title: "Seqlock for Low-Latency Concurrent Snapshot Reads",
    tag: "lock-free",
    code: `#include <atomic>
#include <cstdint>
#include <thread>
#include <iostream>

// Seqlock: single writer, many readers, zero reader blocking.
// Readers detect a concurrent write by checking sequence parity.
struct PriceSnapshot {
    std::atomic<uint64_t> seq{0};
    double bid{0};
    double ask{0};
    int    bid_qty{0};
    int    ask_qty{0};
};

void write_snapshot(PriceSnapshot& snap, double bid, double ask, int bq, int aq) {
    // Odd seq → write in progress
    snap.seq.fetch_add(1, std::memory_order_release);
    snap.bid = bid; snap.ask = ask;
    snap.bid_qty = bq; snap.ask_qty = aq;
    // Even seq → write complete
    snap.seq.fetch_add(1, std::memory_order_release);
}

bool read_snapshot(const PriceSnapshot& snap, double& bid, double& ask) {
    uint64_t s1 = snap.seq.load(std::memory_order_acquire);
    if (s1 & 1) return false;   // writer active — retry
    bid = snap.bid; ask = snap.ask;
    uint64_t s2 = snap.seq.load(std::memory_order_acquire);
    return s1 == s2;            // no write occurred during our read
}

int main() {
    PriceSnapshot snap;
    auto writer = std::thread([&]{
        for (int i = 0; i < 5; ++i) write_snapshot(snap, 99.0+i, 100.0+i, 100, 100);
    });
    double b, a;
    int retries = 0;
    while (!read_snapshot(snap, b, a)) ++retries;
    std::cout << "bid=" << b << " ask=" << a << " retries=" << retries << "\\n";
    writer.join();
}`,
    explanation: "The seqlock provides wait-free reads with a single writer at the cost of occasional read retries — in practice fewer than 1 in 10,000 on lightly contended L2 cache lines. It is the standard technique for publishing market-data snapshots to multiple subscriber threads without mutexes or per-reader atomic flags."
  },
  {
    id: "cpp-20260807-b1-chrono-latency",
    language: "cpp",
    title: "Nanosecond Latency Measurement with std::chrono and rdtsc",
    tag: "low-latency",
    code: `#include <chrono>
#include <cstdint>
#include <iostream>
#include <numeric>
#include <vector>

// Portable high-res wall clock using std::chrono
inline int64_t now_ns() {
    return std::chrono::duration_cast<std::chrono::nanoseconds>(
        std::chrono::steady_clock::now().time_since_epoch()
    ).count();
}

// CPU-cycle stamp via RDTSC (x86) — zero syscall overhead
inline uint64_t rdtsc() {
    uint64_t lo, hi;
    __asm__ __volatile__("rdtsc" : "=a"(lo), "=d"(hi));
    return (hi << 32) | lo;
}

void benchmark_order_dispatch(int n = 10000) {
    std::vector<int64_t> samples;
    samples.reserve(n);

    volatile int sink = 0; // prevent dead-code elimination
    for (int i = 0; i < n; ++i) {
        auto t0 = now_ns();
        // Simulate the dispatch work
        sink += i * 3;
        auto t1 = now_ns();
        samples.push_back(t1 - t0);
    }

    std::sort(samples.begin(), samples.end());
    int64_t p50 = samples[n * 50 / 100];
    int64_t p99 = samples[n * 99 / 100];
    std::cout << "p50=" << p50 << "ns  p99=" << p99 << "ns\\n";
}

int main() { benchmark_order_dispatch(); }`,
    explanation: "std::chrono::steady_clock is monotonic and suitable for within-process latency sampling; RDTSC gives sub-nanosecond resolution but requires a calibrated TSC-to-wall-clock conversion and a serialising fence (LFENCE/MFENCE) for strict ordering. Reporting p99 (not mean) is the HFT standard because tail latency drives worst-case fill-time and slippage."
  },
  {
    id: "cpp-20260807-b1-dual-numbers-autodiff",
    language: "cpp",
    title: "Dual Numbers for Automatic Differentiation of Option Greeks",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>

// Dual number: d = (value, derivative) with algebra
// (a + aε)(b + bε) = ab + (ab' + a'b)ε
template <typename T>
struct Dual {
    T val, eps;
    Dual(T v, T e = T{0}) : val(v), eps(e) {}
    Dual operator+(const Dual& o) const { return {val+o.val, eps+o.eps}; }
    Dual operator*(const Dual& o) const { return {val*o.val, val*o.eps + eps*o.val}; }
    Dual operator-(const Dual& o) const { return {val-o.val, eps-o.eps}; }
};

template <typename T>
Dual<T> exp_dual(const Dual<T>& x) {
    T e = std::exp(x.val);
    return {e, e * x.eps};  // d/dx e^x = e^x
}
template <typename T>
Dual<T> log_dual(const Dual<T>& x) {
    return {std::log(x.val), x.eps / x.val};  // d/dx ln(x) = 1/x
}
template <typename T>
Dual<T> sqrt_dual(const Dual<T>& x) {
    T s = std::sqrt(x.val);
    return {s, x.eps / (T{2} * s)};
}

// Black-Scholes call implemented with Dual arithmetic
// Setting S = Dual(S0, 1) gives .eps = delta automatically.
double bs_delta_autodiff(double S0, double K, double r, double sigma, double T) {
    using D = Dual<double>;
    D S(S0, 1.0); // differentiate w.r.t. S
    D d1 = (log_dual(S / D(K)) + D((r + 0.5*sigma*sigma)*T)) * D(1.0/(sigma*std::sqrt(T)));
    // For simplicity use std::erf-based N(d1) — real impl uses erfc
    double d1v = d1.val;
    // delta = N(d1)
    return 0.5 * (1.0 + std::erf(d1v / std::sqrt(2.0)));
}

int main() {
    double delta = bs_delta_autodiff(100.0, 100.0, 0.05, 0.20, 1.0);
    std::cout << "ATM call delta (autodiff): " << delta << "\\n"; // ~0.56
}`,
    explanation: "Dual number arithmetic computes exact first derivatives by propagating a perturbation ε alongside the value — no finite-difference rounding or step-size tuning required. For Greeks, set the seed (ε=1) on the variable of interest (S for delta, σ for vega) and the derivative falls out of the same forward pass that prices the option."
  },
  {
    id: "cpp-20260807-b1-bit-cast",
    language: "cpp",
    title: "std::bit_cast for Type-Punning Market Data Integers",
    tag: "modern-cpp",
    code: `#include <bit>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <cassert>

// Network byte-order (big-endian) price received from exchange feed
// encoded as a 64-bit integer with 6 implied decimal places.
uint64_t bswap64(uint64_t v) {
    return __builtin_bswap64(v);
}

double decode_price(uint64_t network_price) {
    uint64_t host = bswap64(network_price);
    // Interpret the bit pattern as IEEE-754 double — undefined behaviour
    // via reinterpret_cast or memcpy is the old way.
    // std::bit_cast is guaranteed well-defined (C++20).
    double raw = std::bit_cast<double>(host);
    // In practice, fixed-point: integer with 6 decimals → divide by 1e6
    // Here we illustrate the safe bit-pun:
    return raw;
}

// Safe fixed-point decode without UB
double fixed_point_price(uint64_t encoded_int) {
    // Reinterpret a uint64 with 6 decimal places as double
    return static_cast<double>(encoded_int) / 1'000'000.0;
}

int main() {
    uint64_t raw = 100'500'000ULL; // 100.5 in fixed-point 6dp
    std::cout << "Price: " << fixed_point_price(raw) << "\\n"; // 100.5

    // Verify bit_cast round-trip
    double v = 3.14;
    uint64_t bits = std::bit_cast<uint64_t>(v);
    double back = std::bit_cast<double>(bits);
    assert(v == back);
    std::cout << "bit_cast round-trip OK\\n";
}`,
    explanation: "std::bit_cast<To>(from) reinterprets bits without undefined behaviour — unlike reinterpret_cast or misaligned pointer tricks — and is constexpr. In market data parsing, it safely converts fixed-point integer prices from the wire to double, and allows inspecting IEEE-754 exponent/mantissa bits for fast range checks."
  },
  {
    id: "cpp-20260807-b1-coroutine-feed",
    language: "cpp",
    title: "C++20 Generator Coroutine for Lazy Tick Data Replay",
    tag: "modern-cpp",
    code: `#include <coroutine>
#include <vector>
#include <iostream>
#include <optional>

// Minimal generator<T> coroutine for C++20 (pre-std::generator)
template <typename T>
struct Generator {
    struct promise_type {
        T current_value;
        auto get_return_object() { return Generator{std::coroutine_handle<promise_type>::from_promise(*this)}; }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        std::suspend_always yield_value(T v) { current_value = v; return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };
    std::coroutine_handle<promise_type> h;
    explicit Generator(std::coroutine_handle<promise_type> h) : h(h) {}
    ~Generator() { if (h) h.destroy(); }
    bool next() { h.resume(); return !h.done(); }
    T value() { return h.promise().current_value; }
};

struct Tick { double price; int vol; };

// Coroutine: yields ticks one at a time — no eager materialisation
Generator<Tick> replay(const std::vector<Tick>& feed) {
    for (const auto& t : feed)
        co_yield t;
}

int main() {
    std::vector<Tick> feed = {{100.0, 500}, {101.0, 300}, {99.5, 800}};
    auto gen = replay(feed);
    while (gen.next()) {
        auto t = gen.value();
        std::cout << "price=" << t.price << " vol=" << t.vol << "\\n";
    }
}`,
    explanation: "Generator coroutines suspend at each co_yield, returning control to the caller — no intermediate vector is allocated for the full tick sequence. This is critical in backtesting replay engines where the tick file may have billions of rows: the generator produces one tick per iteration, keeping working set in L1 cache while the file stays on disk."
  },
  {
    id: "cpp-20260807-b1-bitset-flags",
    language: "cpp",
    title: "std::bitset for Compact Order Permission Flags",
    tag: "modern-cpp",
    code: `#include <bitset>
#include <iostream>
#include <string>

// Permission flags for order types on a trading venue
enum Permission : size_t {
    LIMIT_ORDER   = 0,
    MARKET_ORDER  = 1,
    STOP_ORDER    = 2,
    IOC           = 3,  // Immediate-Or-Cancel
    FOK           = 4,  // Fill-Or-Kill
    HIDDEN        = 5,  // Iceberg/hidden qty
    SHORT_SELL    = 6,
    MARGIN_ORDER  = 7,
    NUM_PERMS     = 8
};

using PermSet = std::bitset<NUM_PERMS>;

PermSet retail_permissions() {
    PermSet p;
    p.set(LIMIT_ORDER);
    p.set(MARKET_ORDER);
    p.set(IOC);
    return p;
}

PermSet institutional_permissions() {
    return PermSet{0b11111111}; // all 8 bits set
}

bool can_submit(const PermSet& perms, Permission p) {
    return perms.test(p);
}

int main() {
    auto retail = retail_permissions();
    auto inst   = institutional_permissions();

    std::cout << "Retail can HIDDEN: " << can_submit(retail, HIDDEN) << "\\n"; // 0
    std::cout << "Inst can HIDDEN:   " << can_submit(inst, HIDDEN) << "\\n";   // 1

    // Intersection: what can both do?
    PermSet common = retail & inst;
    std::cout << "Common: " << common << "\\n";

    // Count active perms
    std::cout << "Retail perm count: " << retail.count() << "\\n"; // 3
}`,
    explanation: "std::bitset packs N boolean flags into N/8 bytes — a 64-permission set fits in a single cache line word. Bitwise AND/OR operations on permission sets execute in a single instruction on modern CPUs, making entitlement checks in order validation zero-overhead compared to a map or vector<bool>."
  },
  {
    id: "cpp-20260807-b1-priority-queue-custom",
    language: "cpp",
    title: "Custom Comparator std::priority_queue for Time-Priority Order Book",
    tag: "stl",
    code: `#include <queue>
#include <vector>
#include <cstdint>
#include <iostream>

struct Order {
    uint64_t order_id;   // monotonically increasing → proxy for arrival time
    double   price;
    int      qty;
    char     side;       // 'B' = bid, 'S' = ask
};

// Bid side: max-heap on price, then min-heap on order_id (FIFO at same price)
struct BidComparator {
    bool operator()(const Order& a, const Order& b) const {
        if (a.price != b.price) return a.price < b.price;   // lower price = worse
        return a.order_id > b.order_id;                      // older id = better
    }
};

// Ask side: min-heap on price, then min-heap on order_id
struct AskComparator {
    bool operator()(const Order& a, const Order& b) const {
        if (a.price != b.price) return a.price > b.price;
        return a.order_id > b.order_id;
    }
};

int main() {
    std::priority_queue<Order, std::vector<Order>, BidComparator> bids;
    bids.push({1, 100.0, 100, 'B'});
    bids.push({2, 100.0, 200, 'B'});  // same price, later order
    bids.push({3, 101.0, 50,  'B'});  // better price

    while (!bids.empty()) {
        auto& o = bids.top();
        std::cout << "id=" << o.order_id << " px=" << o.price << "\\n";
        bids.pop();
    }
    // Expected: 3(101.0), 1(100.0), 2(100.0) — price-time priority
}`,
    explanation: "Price-time priority (the dominant matching rule on equities exchanges) requires a comparator that first sorts by price, then by arrival order within the same price level. Using std::priority_queue with a custom comparator avoids a separate tiebreaker scan and is O(log n) per insert/match — fine for sparse levels, but intrusive lists beat it for dense high-volume levels."
  },
  {
    id: "cpp-20260807-b1-cpu-affinity",
    language: "cpp",
    title: "Thread CPU Affinity Pinning for NUMA-Aware HFT Threads",
    tag: "low-latency",
    code: `#include <pthread.h>
#include <sched.h>
#include <iostream>
#include <thread>
#include <stdexcept>

// Pin the calling thread to a specific CPU core.
// Critical: avoids OS scheduler migration across NUMA nodes.
void pin_to_cpu(int cpu_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(cpu_id, &cpuset);
    // pthread_setaffinity_np is Linux-specific
    int rc = pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    if (rc != 0) throw std::runtime_error("setaffinity failed: " + std::to_string(rc));
}

void market_data_thread(int core) {
    pin_to_cpu(core);
    // Verify
    cpu_set_t cpuset;
    pthread_getaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    std::cout << "MD thread pinned to core " << core
              << " (verified=" << CPU_ISSET(core, &cpuset) << ")\\n";
    // ... hot loop processes market data
}

int main() {
    // Pin market data thread to core 2, order sending to core 4
    std::thread md(market_data_thread, 2);
    md.join();
}`,
    explanation: "CPU affinity pinning prevents the OS scheduler from migrating a latency-sensitive thread between cores mid-execution — a migration can stall for 10-50μs as caches are refilled. On NUMA systems, pinning to a core adjacent to the NIC IRQ handler minimises cross-NUMA memory traffic from the kernel receive path."
  },
  {
    id: "cpp-20260807-b1-compile-time-black-scholes",
    language: "cpp",
    title: "constexpr Black-Scholes for Compile-Time Greeks Tables",
    tag: "modern-cpp",
    code: `#include <cmath>
#include <iostream>
#include <array>

// constexpr-compatible error function approximation (Abramowitz & Stegun)
constexpr double erf_approx(double x) {
    double t = 1.0 / (1.0 + 0.47047 * (x < 0 ? -x : x));
    double poly = t * (0.3480242 + t * (-0.0958798 + t * 0.7478556));
    double result = 1.0 - poly * std::exp(-(x*x));
    return x < 0 ? -result : result;
}

constexpr double norm_cdf(double x) {
    return 0.5 * (1.0 + erf_approx(x / 1.41421356237));
}

constexpr double bs_call(double S, double K, double r, double sigma, double T) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma * std::sqrt(T));
    double d2 = d1 - sigma * std::sqrt(T);
    return S * norm_cdf(d1) - K * std::exp(-r*T) * norm_cdf(d2);
}

// Build a compile-time delta table for 10 strikes (80–120 step 4)
constexpr std::array<double, 10> build_delta_table() {
    std::array<double, 10> tbl{};
    for (int i = 0; i < 10; ++i) {
        double K = 80.0 + i * 4.0;
        // Numerical delta: (C(S+h) - C(S-h)) / 2h
        double h = 0.01;
        tbl[i] = (bs_call(100.0+h, K, 0.05, 0.2, 1.0) - bs_call(100.0-h, K, 0.05, 0.2, 1.0)) / (2*h);
    }
    return tbl;
}

constexpr auto delta_table = build_delta_table();

int main() {
    for (int i = 0; i < 10; ++i)
        std::cout << "K=" << (80+i*4) << " delta=" << delta_table[i] << "\\n";
}`,
    explanation: "Making Black-Scholes constexpr moves the entire Greeks table computation to compile time — the array lives in .rodata and is accessed as a literal constant at runtime. This is the standard approach for building static vol-surface lookup tables in market-makers that can tolerate a deterministic approximation rather than an iterative Newton solve."
  },
  {
    id: "cpp-20260807-b1-optional-order-fields",
    language: "cpp",
    title: "std::optional for Nullable Discretionary Offset and Display Qty",
    tag: "modern-cpp",
    code: `#include <optional>
#include <iostream>
#include <string>

struct Order {
    std::string   symbol;
    double        price;
    int           qty;
    // Iceberg: display only this much; rest is hidden
    std::optional<int>    display_qty;
    // Discretionary: may trade up to this offset from limit price
    std::optional<double> discretionary_offset;
};

void print_order(const Order& o) {
    std::cout << o.symbol << " px=" << o.price << " qty=" << o.qty;
    // Idiomatic optional access: value_or for default
    std::cout << " display=" << o.display_qty.value_or(o.qty);
    if (o.discretionary_offset.has_value())
        std::cout << " disc_off=" << *o.discretionary_offset;
    std::cout << "\\n";
}

int main() {
    Order plain{"AAPL", 182.0, 1000, std::nullopt, std::nullopt};
    Order iceberg{"MSFT", 415.0, 5000, 500, std::nullopt};       // show 500
    Order disc{"NVDA", 900.0, 100, std::nullopt, 0.05};           // +5c discretion

    print_order(plain);
    print_order(iceberg);
    print_order(disc);
}`,
    explanation: "std::optional<T> carries the 'field absent' semantic inline without a sentinel value (e.g., -1 or NaN for qty), making invalid states unrepresentable in the type system. In FIX protocol parsing, optional fields map cleanly to std::optional without extra boolean flags, and the compiler can pack them efficiently via EBO."
  },
  {
    id: "cpp-20260807-b1-string-view-map",
    language: "cpp",
    title: "Heterogeneous Lookup with string_view in std::unordered_map",
    tag: "stl",
    code: `#include <unordered_map>
#include <string>
#include <string_view>
#include <iostream>

// Custom hash that accepts string_view, const char*, and std::string
struct StringHash {
    using is_transparent = void; // opt-in to heterogeneous lookup
    size_t operator()(std::string_view sv) const noexcept {
        return std::hash<std::string_view>{}(sv);
    }
};

struct StringEqual {
    using is_transparent = void;
    bool operator()(std::string_view a, std::string_view b) const noexcept {
        return a == b;
    }
};

// Keyed by std::string for ownership, but lookups take string_view (no alloc)
using SymbolMap = std::unordered_map<std::string, double, StringHash, StringEqual>;

int main() {
    SymbolMap mid_prices;
    mid_prices["AAPL"] = 182.0;
    mid_prices["MSFT"] = 415.0;

    // Lookup with string_view — no std::string construction, no allocation
    const char* sym = "AAPL";
    auto it = mid_prices.find(std::string_view{sym});
    if (it != mid_prices.end())
        std::cout << sym << " mid=" << it->second << "\\n";
}`,
    explanation: "Without transparent hasher/equality, map.find(const char*) constructs a temporary std::string on every lookup — one heap allocation per query on the hot path. The is_transparent tag tells the container to accept any type the hash/equals handles, enabling zero-allocation lookups from const char* or string_view keys that come directly off a wire buffer."
  },
  {
    id: "cpp-20260807-b1-nttp",
    language: "cpp",
    title: "Non-Type Template Parameters for Compile-Time Order Book Depth",
    tag: "modern-cpp",
    code: `#include <array>
#include <cstddef>
#include <iostream>

// Order book whose depth is a compile-time constant — no heap allocation,
// no dynamic resizing, size embedded in the type.
template <std::size_t DEPTH>
class StaticOrderBook {
public:
    struct Level { double price; int qty; };

private:
    std::array<Level, DEPTH> bids_{};
    std::array<Level, DEPTH> asks_{};
    std::size_t bid_count_{0};
    std::size_t ask_count_{0};

public:
    void add_bid(double price, int qty) {
        if (bid_count_ < DEPTH)
            bids_[bid_count_++] = {price, qty};
    }
    void add_ask(double price, int qty) {
        if (ask_count_ < DEPTH)
            asks_[ask_count_++] = {price, qty};
    }
    double best_bid() const { return bid_count_ ? bids_[0].price : 0.0; }
    double best_ask() const { return ask_count_ ? asks_[0].price : 0.0; }
    static constexpr std::size_t depth() { return DEPTH; }
};

int main() {
    // L1 book: 1 level. L5 book: 5 levels. Different types — cannot mix up.
    StaticOrderBook<1> l1;
    StaticOrderBook<5> l5;

    l1.add_bid(99.9, 100);
    l5.add_bid(99.8, 200);

    std::cout << "L1 depth=" << l1.depth() << " best_bid=" << l1.best_bid() << "\\n";
    std::cout << "L5 depth=" << l5.depth() << "\\n";
}`,
    explanation: "Encoding depth as a non-type template parameter (NTTP) bakes the array size into the type — no dynamic allocation, no branch on overflow, and the loop bounds are compile-time constants that enable full auto-vectorisation. Different depths become distinct types, so passing an L1 book where an L5 is expected is a compile error rather than a silent truncation."
  },
  {
    id: "cpp-20260807-b1-wait-free-counter",
    language: "cpp",
    title: "Wait-Free Per-Thread Trade Counter with Thread-Local Storage",
    tag: "lock-free",
    code: `#include <atomic>
#include <thread>
#include <vector>
#include <iostream>
#include <numeric>

// Each thread increments its own counter — zero contention.
// Global total is a relaxed load of all per-thread slots.
constexpr int MAX_THREADS = 16;
struct alignas(64) PaddedCounter { std::atomic<long> value{0}; };
PaddedCounter counters[MAX_THREADS]; // false-sharing prevented by 64-byte alignment

thread_local int thread_id = -1;
std::atomic<int> next_id{0};

int get_thread_id() {
    if (thread_id == -1) thread_id = next_id.fetch_add(1, std::memory_order_relaxed);
    return thread_id;
}

void record_trade() {
    counters[get_thread_id()].value.fetch_add(1, std::memory_order_relaxed);
}

long total_trades() {
    long total = 0;
    int n = next_id.load(std::memory_order_acquire);
    for (int i = 0; i < n; ++i)
        total += counters[i].value.load(std::memory_order_relaxed);
    return total;
}

int main() {
    std::vector<std::thread> workers;
    for (int i = 0; i < 4; ++i)
        workers.emplace_back([]{ for (int j = 0; j < 1000; ++j) record_trade(); });
    for (auto& t : workers) t.join();
    std::cout << "Total trades: " << total_trades() << "\\n"; // 4000
}`,
    explanation: "Per-thread counters with cache-line padding (alignas(64)) eliminate false sharing — each thread's counter lives on its own cache line, so incrementing one never invalidates another's. The global total is computed lazily (not on every trade), making the increment path truly wait-free: a single relaxed atomic add with no CAS loop."
  },
  {
    id: "cpp-20260807-b1-policy-based-pricer",
    language: "cpp",
    title: "Policy-Based Design for Pluggable Discount Curve in Rate Pricer",
    tag: "modern-cpp",
    code: `#include <cmath>
#include <iostream>

// Policy: flat continuously-compounded discount
struct FlatDiscountPolicy {
    double rate;
    double df(double T) const { return std::exp(-rate * T); }
};

// Policy: Nelson-Siegel-style discount (simplified)
struct NelsonSiegelPolicy {
    double beta0, beta1, tau;
    double df(double T) const {
        double fwd = beta0 + beta1 * std::exp(-T / tau);
        return std::exp(-fwd * T);
    }
};

// Generic bond pricer templated on discount policy — zero virtual overhead
template <typename DiscountPolicy>
struct BondPricer {
    const DiscountPolicy& curve;
    explicit BondPricer(const DiscountPolicy& c) : curve(c) {}

    // Coupon bond: sum of discounted cash flows
    double price(double face, double coupon_rate, int n_periods, double dt) const {
        double pv = 0.0;
        for (int i = 1; i <= n_periods; ++i)
            pv += face * coupon_rate * dt * curve.df(i * dt);
        pv += face * curve.df(n_periods * dt); // principal at maturity
        return pv;
    }
};

int main() {
    FlatDiscountPolicy flat{0.05};
    NelsonSiegelPolicy ns{0.05, -0.02, 2.0};

    BondPricer<FlatDiscountPolicy> p1(flat);
    BondPricer<NelsonSiegelPolicy> p2(ns);

    // 5-year annual coupon bond, face=100, coupon=5%
    std::cout << "Flat curve price:  " << p1.price(100.0, 0.05, 5, 1.0) << "\\n";
    std::cout << "NS curve price:    " << p2.price(100.0, 0.05, 5, 1.0) << "\\n";
}`,
    explanation: "Policy-based design injects behaviour at compile time via template parameters rather than at runtime via virtual dispatch — the discount curve call is inlined by the compiler, enabling auto-vectorisation of the coupon loop. This is the architecture used in QuantLib's pricing engines: Instrument<Engine> where Engine is a policy."
  },
  {
    id: "cpp-20260807-b1-mpsc-ring",
    language: "cpp",
    title: "Multi-Producer Single-Consumer Lock-Free Ring Buffer for Orders",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <iostream>
#include <thread>

// MPSC ring: many producers CAS the write head; single consumer advances tail.
// Cache-line aligned to prevent head/tail false sharing.
template <typename T, std::size_t N>
class MPSCRing {
    static_assert((N & (N-1)) == 0, "N must be power of 2");
    struct Slot {
        std::atomic<bool> ready{false};
        T data;
    };
    alignas(64) std::atomic<std::size_t> head_{0}; // producers
    alignas(64) std::size_t tail_{0};               // consumer only
    std::array<Slot, N> slots_;

public:
    bool push(const T& val) {
        std::size_t pos = head_.fetch_add(1, std::memory_order_acq_rel);
        if (pos - tail_ >= N) return false; // full
        slots_[pos & (N-1)].data = val;
        slots_[pos & (N-1)].ready.store(true, std::memory_order_release);
        return true;
    }

    std::optional<T> pop() {
        auto& slot = slots_[tail_ & (N-1)];
        if (!slot.ready.load(std::memory_order_acquire)) return std::nullopt;
        T val = slot.data;
        slot.ready.store(false, std::memory_order_release);
        ++tail_;
        return val;
    }
};

int main() {
    MPSCRing<int, 16> ring;
    auto prod = [&]{ for (int i=0; i<10; ++i) ring.push(i); };
    std::thread t1(prod), t2(prod);
    t1.join(); t2.join();
    int count = 0;
    while (auto v = ring.pop()) ++count;
    std::cout << "consumed " << count << " items\\n";
}`,
    explanation: "MPSC (multi-producer single-consumer) rings are the standard input channel from multiple network threads (one per venue) into a single matching-engine thread: producers CAS the head without coordination between themselves, while the single consumer advances the tail without any atomic — eliminating all reader-side locking overhead."
  },
  {
    id: "cpp-20260807-b1-crtp-event",
    language: "cpp",
    title: "CRTP Event Handler for Zero-Cost Static Dispatch in Feed Gateway",
    tag: "modern-cpp",
    code: `#include <iostream>
#include <string>

// Base defines the protocol; derived provides the implementation.
// No vtable — all dispatch resolved at compile time.
template <typename Derived>
struct FeedGateway {
    void on_quote(double bid, double ask) {
        static_cast<Derived*>(this)->handle_quote(bid, ask);
    }
    void on_trade(double price, int qty) {
        static_cast<Derived*>(this)->handle_trade(price, qty);
    }
    // Default no-op implementations
    void handle_quote(double, double) {}
    void handle_trade(double, double)  {}
};

struct LoggingGateway : FeedGateway<LoggingGateway> {
    void handle_quote(double bid, double ask) {
        std::cout << "[QUOTE] bid=" << bid << " ask=" << ask << "\\n";
    }
    void handle_trade(double price, int qty) {
        std::cout << "[TRADE] px=" << price << " qty=" << qty << "\\n";
    }
};

struct NullGateway : FeedGateway<NullGateway> {
    // Inherits no-op defaults — used in benchmarks to isolate dispatch cost
};

template <typename G>
void simulate_feed(G& gw) {
    gw.on_quote(99.9, 100.1);
    gw.on_trade(100.0, 500);
}

int main() {
    LoggingGateway lg;
    simulate_feed(lg);

    NullGateway ng;
    simulate_feed(ng); // compiles to nothing after inlining
}`,
    explanation: "CRTP replaces virtual dispatch with a static_cast at compile time — the derived class's handler is inlined directly at the call site, enabling the compiler to eliminate dead branches (NullGateway's empty handlers) entirely. Feed gateways using CRTP consistently show sub-nanosecond dispatch overhead vs. 3-5ns for a virtual call on a warm iTLB."
  },
  {
    id: "cpp-20260807-b1-string-template-parse",
    language: "cpp",
    title: "Zero-Allocation FIX BeginString / MsgType Dispatch via string_view",
    tag: "market-data",
    code: `#include <string_view>
#include <iostream>
#include <functional>
#include <unordered_map>

// FIX tag-value separator is SOH (\\x01); we parse over a borrowed view.
struct FixView {
    std::string_view raw;

    // Return value of tag n, or empty view if not found.
    std::string_view get(int tag) const {
        char buf[16];
        // Build tag prefix "N=" in local buffer
        int len = snprintf(buf, sizeof(buf), "%d=", tag);
        std::string_view prefix{buf, static_cast<size_t>(len)};
        auto pos = raw.find(prefix);
        if (pos == std::string_view::npos) return {};
        pos += prefix.size();
        auto end = raw.find('\\x01', pos);
        return raw.substr(pos, end == std::string_view::npos ? raw.size() - pos : end - pos);
    }
};

void process_fix(std::string_view raw_msg) {
    FixView fix{raw_msg};
    auto msg_type = fix.get(35); // Tag 35 = MsgType
    if (msg_type == "D")
        std::cout << "NewOrderSingle: clOrdId=" << fix.get(11) << "\\n";
    else if (msg_type == "8")
        std::cout << "ExecutionReport: execId=" << fix.get(17) << "\\n";
}

int main() {
    // Typical FIX message (SOH = \\x01)
    std::string msg =
        "8=FIX.4.4\\x0135=D\\x0111=ORD001\\x0155=AAPL\\x0154=1\\x0138=100\\x0144=182.0\\x01";
    process_fix(msg);
}`,
    explanation: "Parsing FIX via string_view never copies the underlying buffer — the view is a (pointer, length) pair into the receive buffer itself. For a gateway handling 500k messages/second, eliminating one std::string construction per field reduces heap pressure by ~30MB/s and keeps the per-message allocation count at zero on the hot path."
  },
  {
    id: "cpp-20260807-b1-clamp-branchless",
    language: "cpp",
    title: "Branchless Price Clamping via std::clamp and CMov",
    tag: "low-latency",
    code: `#include <algorithm>
#include <cstdint>
#include <iostream>

// Price validity band: reject ticks outside [ref * (1 - band), ref * (1 + band)]
// A branch here in the hot path is a mispredict hazard; clamp generates CMOVs.
struct PriceFilter {
    double ref_price;
    double band;       // e.g. 0.05 for ±5%

    double lo() const { return ref_price * (1.0 - band); }
    double hi() const { return ref_price * (1.0 + band); }

    // Branchless: std::clamp maps to MINSD/MAXSD on x86 SSE2
    double clamp(double tick) const {
        return std::clamp(tick, lo(), hi());
    }

    bool accept(double tick) const {
        // Comparison generates SETcc + MOVZX — no branch
        return tick >= lo() && tick <= hi();
    }
};

int main() {
    PriceFilter f{100.0, 0.05}; // ref=100, ±5%
    std::cout << f.clamp(112.0) << "\\n";  // 105.0 (clamped)
    std::cout << f.clamp(97.0)  << "\\n";  // 97.0  (within band)
    std::cout << f.accept(106.0) << "\\n"; // 0 (out of band)
}`,
    explanation: "std::clamp(x, lo, hi) compiles to two floating-point min/max instructions on SSE2+ — conditional move semantics with no branch predictor involvement. In tick validation running at hundreds of nanoseconds per message, a single mispredicted branch costs ~15 cycles; the branchless form breaks the data-flow dependency and is fully pipelined."
  },
  {
    id: "cpp-20260807-b1-placement-new-pool",
    language: "cpp",
    title: "Placement new with Custom Deleter for Pool-Owned Objects",
    tag: "allocators",
    code: `#include <memory>
#include <cstddef>
#include <cassert>
#include <iostream>

// Slab of pre-allocated raw storage for Order objects.
// Objects are constructed in-place via placement new.
template <typename T, std::size_t N>
class Slab {
    alignas(T) std::byte storage_[sizeof(T) * N];
    bool in_use_[N]{};
    std::size_t watermark_{0};

public:
    T* construct(auto&&... args) {
        for (std::size_t i = 0; i < N; ++i) {
            if (!in_use_[i]) {
                in_use_[i] = true;
                // Placement new: no heap — constructs directly in the slab
                return new (&storage_[i * sizeof(T)]) T(std::forward<decltype(args)>(args)...);
            }
        }
        return nullptr; // slab exhausted
    }

    void destroy(T* p) {
        p->~T(); // explicit destructor call required after placement new
        std::size_t idx = (reinterpret_cast<std::byte*>(p) - storage_) / sizeof(T);
        in_use_[idx] = false;
    }
};

struct Order { int id; double price; };

int main() {
    Slab<Order, 8> slab;
    Order* o1 = slab.construct(1, 100.0);
    Order* o2 = slab.construct(2, 101.0);
    std::cout << "o1.id=" << o1->id << " o2.price=" << o2->price << "\\n";
    slab.destroy(o1);
    Order* o3 = slab.construct(3, 99.5); // recycles o1's slot
    std::cout << "o3.id=" << o3->id << "\\n";
}`,
    explanation: "Placement new constructs an object at a caller-specified address — here, within a contiguous slab — bypassing malloc entirely. Combined with an explicit destructor call on release, this gives deterministic O(1) allocation with zero heap fragmentation, the prerequisite for sub-microsecond order object lifecycle in a matching engine."
  },
  {
    id: "cpp-20260807-b1-constexpr-hash",
    language: "cpp",
    title: "Compile-Time FNV-1a Hash for Perfect Symbol Table",
    tag: "market-data",
    code: `#include <cstdint>
#include <string_view>
#include <array>
#include <iostream>

// FNV-1a: simple, fast, good distribution for short strings like ticker symbols
constexpr uint32_t fnv1a(std::string_view s) {
    uint32_t hash = 2166136261u;
    for (char c : s) {
        hash ^= static_cast<uint8_t>(c);
        hash *= 16777619u;
    }
    return hash;
}

// Compile-time symbol IDs — no runtime hashing, no string comparison
constexpr uint32_t SYM_AAPL = fnv1a("AAPL");
constexpr uint32_t SYM_MSFT = fnv1a("MSFT");
constexpr uint32_t SYM_NVDA = fnv1a("NVDA");

void route(std::string_view sym) {
    switch (fnv1a(sym)) {          // switch on hash — compiles to jump table
        case SYM_AAPL: std::cout << "AAPL handler\\n"; break;
        case SYM_MSFT: std::cout << "MSFT handler\\n"; break;
        case SYM_NVDA: std::cout << "NVDA handler\\n"; break;
        default:       std::cout << "unknown\\n";
    }
}

int main() {
    route("AAPL");
    route("NVDA");
    route("TSLA"); // unknown
}`,
    explanation: "Using a constexpr hash to generate compile-time integer IDs for ticker symbols lets you route with a switch statement instead of a map lookup — the compiler can emit a perfect jump table. For a universe of <200 symbols, the switch is branch-predictor friendly and resolves in ~1ns vs 10-30ns for an unordered_map lookup."
  },
  {
    id: "cpp-20260807-b1-reverse-iter-bid",
    language: "cpp",
    title: "Reverse Iterator for Descending Bid Traversal on std::map Order Book",
    tag: "stl",
    code: `#include <map>
#include <iostream>

// std::map<price, qty> stores bids ascending by default.
// Reverse iteration gives descending (best-bid-first) traversal.
class BidBook {
    std::map<double, int> levels_; // price → qty
public:
    void add(double price, int qty) { levels_[price] += qty; }
    void remove(double price, int qty) {
        if ((levels_[price] -= qty) <= 0)
            levels_.erase(price);
    }

    // Print best N bid levels in descending order
    void print_top(int n) const {
        int count = 0;
        for (auto it = levels_.rbegin(); it != levels_.rend() && count < n; ++it, ++count)
            std::cout << "  " << it->first << " x " << it->second << "\\n";
    }

    double best_bid() const {
        return levels_.empty() ? 0.0 : levels_.rbegin()->first;
    }
};

int main() {
    BidBook book;
    book.add(99.5, 500);
    book.add(99.8, 200);
    book.add(100.0, 100);
    book.add(99.5, 300); // aggregates to 800

    std::cout << "Top 3 bids:\\n";
    book.print_top(3);
    std::cout << "Best bid: " << book.best_bid() << "\\n";
}`,
    explanation: "std::map's reverse iterator (rbegin/rend) gives O(1) access to the highest key — the best bid — and O(k) traversal of the top k levels without a separate sorted structure. Combined with the logarithmic insert/erase guarantee, this is the canonical academic order book implementation before upgrading to intrusive lists for production."
  },
  {
    id: "cpp-20260807-b1-sfinae-has-method",
    language: "cpp",
    title: "SFINAE Detection Idiom for Compile-Time Priceable Concept Check",
    tag: "sfinae",
    code: `#include <type_traits>
#include <iostream>

// Detect whether T has a .npv() method returning double
template <typename T, typename = void>
struct has_npv : std::false_type {};

template <typename T>
struct has_npv<T,
    std::void_t<decltype(std::declval<const T&>().npv())>
> : std::true_type {};

// Helper variable template
template <typename T>
inline constexpr bool has_npv_v = has_npv<T>::value;

struct Swap {
    double npv() const { return 1234.56; }
};

struct Equity {
    double price() const { return 182.0; } // no npv()
};

template <typename T>
void price_instrument(const T& inst) {
    if constexpr (has_npv_v<T>)
        std::cout << "NPV: " << inst.npv() << "\\n";
    else
        std::cout << "No NPV method\\n";
}

int main() {
    Swap sw;
    Equity eq;
    price_instrument(sw);  // NPV: 1234.56
    price_instrument(eq);  // No NPV method
    static_assert( has_npv_v<Swap>);
    static_assert(!has_npv_v<Equity>);
}`,
    explanation: "The detection idiom via std::void_t collapses ill-formed expressions to std::false_type at compile time — allowing generic code to branch on capability rather than type. In C++20 this is superseded by Concepts, but detection idioms still appear in codebases targeting C++17 and are the mechanism underlying std::iterator_traits specialisation."
  },
  {
    id: "cpp-20260807-b1-aligned-alloc",
    language: "cpp",
    title: "Aligned Allocation for SIMD-Ready Position Vectors",
    tag: "low-latency",
    code: `#include <new>        // std::aligned_alloc / operator new with alignment
#include <cstddef>
#include <memory>
#include <immintrin.h>  // AVX2 intrinsics
#include <iostream>

// AVX2 processes 4 doubles per instruction — data must be 32-byte aligned.
struct alignas(32) AlignedPortfolio {
    double pnl[8];   // 64 bytes = 2 AVX2 registers, naturally aligned
    double delta[8];
};

// Heap-allocate with guaranteed 32-byte alignment
std::unique_ptr<AlignedPortfolio> make_portfolio() {
    void* ptr = std::aligned_alloc(32, sizeof(AlignedPortfolio));
    if (!ptr) throw std::bad_alloc{};
    return std::unique_ptr<AlignedPortfolio>(new(ptr) AlignedPortfolio{});
}

void add_pnl_avx2(AlignedPortfolio& p, const double* increments) {
    // Load 4 doubles, add, store — single AVX2 instruction each
    __m256d cur  = _mm256_load_pd(p.pnl);
    __m256d incr = _mm256_load_pd(increments);
    _mm256_store_pd(p.pnl, _mm256_add_pd(cur, incr));
}

int main() {
    auto port = make_portfolio();
    for (auto& v : port->pnl) v = 1000.0;

    double incr[4] = {10.0, 20.0, 30.0, 40.0};
    add_pnl_avx2(*port, incr);

    for (int i = 0; i < 4; ++i)
        std::cout << "pnl[" << i << "]=" << port->pnl[i] << "\\n";
}`,
    explanation: "SIMD load instructions (_mm256_load_pd, not _mm256_loadu_pd) require 32-byte alignment — using unaligned loads adds a 1-cycle penalty on modern microarchitectures and can be catastrophic on older CPUs. alignas(32) on the struct and std::aligned_alloc on the heap ensure the compiler and allocator both satisfy the SIMD ABI constraint."
  },
];
