import type { Snippet } from "./types";

export const cppSnippets20260524B1: Snippet[] = [
  {
    id: "cpp-20260524-b1-memory-order",
    language: "cpp",
    title: "std::atomic memory ordering — acquire/release/seq_cst",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <cassert>

// Producer stores data then sets a flag with release semantics.
// Consumer checks flag with acquire — all stores BEFORE the release
// are visible AFTER the matching acquire. No mutex needed.
std::atomic<int>  g_flag{0};
int               g_data = 0;

void producer() {
    g_data = 42;                                     // plain store — OK
    g_flag.store(1, std::memory_order_release);      // "publish"
}

void consumer() {
    while (g_flag.load(std::memory_order_acquire) == 0) {}  // spin
    assert(g_data == 42);                            // guaranteed visible
}

// Relaxed: no ordering guarantee — only atomicity.
// Use for counters where only the final value matters.
std::atomic<long> g_counter{0};
void increment() { g_counter.fetch_add(1, std::memory_order_relaxed); }

// seq_cst: default; all threads observe all seq_cst ops in the same order.
// Expensive (full memory fence on x86); use release/acquire when possible.`,
    explanation:
      "Release/acquire pairs form a synchronisation edge: every store before the release is visible after the acquire. On x86, release is free (stores are already ordered), and acquire costs only a compiler fence — making it the preferred pattern for inter-thread data handoff.",
  },
  {
    id: "cpp-20260524-b1-mpsc-queue",
    language: "cpp",
    title: "Lock-free MPSC queue (Michael-Scott single-consumer)",
    tag: "concurrency",
    code: `#include <atomic>
#include <memory>

// Multi-producer single-consumer queue — multiple feed threads push,
// one strategy thread pops. Lock-free on the producer path (CAS); wait-free pop.
template <typename T>
class MpscQueue {
    struct Node {
        T                    val;
        std::atomic<Node*>   next{nullptr};
        explicit Node(T v) : val(std::move(v)) {}
    };

    // Producers compete on tail via CAS; consumer owns head exclusively.
    alignas(64) std::atomic<Node*> tail_;
    alignas(64) Node*              head_;  // single-consumer: plain ptr

public:
    MpscQueue() {
        auto* sentinel = new Node(T{});
        tail_.store(sentinel);
        head_ = sentinel;
    }

    void push(T v) {
        auto* n = new Node(std::move(v));
        // Swing tail to n; link predecessor to n.
        Node* prev = tail_.exchange(n, std::memory_order_acq_rel);
        prev->next.store(n, std::memory_order_release);
    }

    bool pop(T& out) {
        Node* head = head_;
        Node* next = head->next.load(std::memory_order_acquire);
        if (!next) return false;
        out    = std::move(next->val);
        head_  = next;
        delete head;   // reclaim old sentinel
        return true;
    }
};`,
    explanation:
      "The MPSC queue uses a single exchange on the tail for producers (O(1), CAS always succeeds against themselves after exchange) and a plain pointer traversal for the consumer (no CAS needed). This makes it ideal for feed-handler → strategy pipelines where producers outnumber consumers.",
  },
  {
    id: "cpp-20260524-b1-pmr-monotonic",
    language: "cpp",
    title: "std::pmr monotonic_buffer_resource — arena per message",
    tag: "memory",
    code: `#include <memory_resource>
#include <vector>
#include <string>

// Per-message arena: allocate from a fixed stack buffer, then reset.
// All allocations are bump-pointer O(1); the entire arena is freed at once.
struct MessageArena {
    static constexpr std::size_t ARENA_SIZE = 4096;
    std::byte                    buf_[ARENA_SIZE];
    std::pmr::monotonic_buffer_resource mbr_{buf_, ARENA_SIZE,
                                             std::pmr::null_memory_resource()};
    std::pmr::polymorphic_allocator<>   alloc_{&mbr_};

    // Reset without freeing: just moves the bump pointer back to the start.
    void reset() { mbr_.release(); }

    // Allocate a pmr::vector that uses our arena — zero heap calls.
    std::pmr::vector<int> make_vec() {
        return std::pmr::vector<int>(alloc_);
    }
};

void process_order_message() {
    static thread_local MessageArena arena;
    arena.reset();

    auto fields = arena.make_vec();
    fields.reserve(16);
    fields.push_back(42);
    // At scope exit: arena.reset() reclaims everything — O(1).
}`,
    explanation:
      "PMR (polymorphic memory resource) lets you swap allocators at runtime without changing container types. A monotonic buffer resource over a stack array gives bump-pointer allocation with zero malloc calls — ideal for per-message or per-tick scratch allocations that are discarded together.",
  },
  {
    id: "cpp-20260524-b1-crtp",
    language: "cpp",
    title: "CRTP — static polymorphism with zero virtual dispatch",
    tag: "templates",
    code: `#include <cstdio>

// CRTP base: derived class is the template parameter.
// Calls to process() resolve at compile time — no vtable lookup.
template <typename Derived>
class Strategy {
public:
    void on_tick(double price) {
        // Static dispatch to derived implementation.
        static_cast<Derived*>(this)->on_tick_impl(price);
    }
    double pnl() const {
        return static_cast<const Derived*>(this)->pnl_impl();
    }
};

class MeanReversion : public Strategy<MeanReversion> {
    double sum_ = 0.0, n_ = 0.0, pos_ = 0.0, pnl_ = 0.0;
public:
    void on_tick_impl(double price) {
        sum_ += price; n_ += 1.0;
        double ma = sum_ / n_;
        double signal = (price - ma) / ma;
        // Simple mean-reversion: short above MA, long below.
        double new_pos = (signal > 0.01) ? -1.0 : (signal < -0.01) ? 1.0 : 0.0;
        pnl_  += (new_pos - pos_) * -price;   // entry cost
        pos_   = new_pos;
    }
    double pnl_impl() const { return pnl_; }
};

int main() {
    MeanReversion strat;
    for (double p : {100.0, 101.5, 99.8, 98.5, 102.0})
        strat.on_tick(p);
    std::printf("PnL: %.2f\\n", strat.pnl());
}`,
    explanation:
      "CRTP gives compile-time polymorphism: the derived type is known at compile time, so the call compiles to a direct function call (or inline). Compared to virtual dispatch, CRTP eliminates the vtable pointer load and indirect branch — saving ~5 ns in a tight tick loop.",
  },
  {
    id: "cpp-20260524-b1-open-address-hash",
    language: "cpp",
    title: "Open-addressing hash map with Robin Hood probing",
    tag: "quant",
    code: `#include <vector>
#include <cstdint>
#include <cassert>

// Robin Hood hashing: on insert, steal from richer (closer-to-home) entries.
// Keeps probe sequences short and variance low — better worst-case than chaining.
template <typename K, typename V, typename Hash = std::hash<K>>
class RobinMap {
    struct Slot { K key; V val; int32_t dist = -1; };  // dist=-1 = empty
    std::vector<Slot> table_;
    std::size_t       size_ = 0;
    Hash              hash_{};

    std::size_t ideal(const K& k) const { return hash_(k) & (table_.size()-1); }

public:
    explicit RobinMap(std::size_t cap = 64) : table_(cap) {}

    void insert(K k, V v) {
        if (size_ * 2 >= table_.size()) rehash(table_.size() * 2);
        Slot cur{k, v, 0};
        std::size_t pos = ideal(k);
        for (;;) {
            auto& s = table_[pos];
            if (s.dist < 0) { s = cur; ++size_; return; }
            if (s.key == cur.key) { s.val = cur.val; return; } // update
            if (s.dist < cur.dist) std::swap(s, cur);          // Robin Hood
            pos = (pos + 1) & (table_.size() - 1);
            ++cur.dist;
        }
    }

    V* find(const K& k) {
        std::size_t pos = ideal(k);
        for (int32_t d = 0; ; ++d) {
            auto& s = table_[pos];
            if (s.dist < 0 || d > s.dist) return nullptr;
            if (s.key == k) return &s.val;
            pos = (pos + 1) & (table_.size() - 1);
        }
    }

    void rehash(std::size_t cap) {
        RobinMap tmp(cap);
        for (auto& s : table_) if (s.dist >= 0) tmp.insert(s.key, s.val);
        *this = std::move(tmp);
    }
};`,
    explanation:
      "Robin Hood probing reduces probe-length variance by stealing slots from entries that are already close to their ideal position. In order-id lookups where the hash table is the hot path, Robin Hood gives tighter tail latencies than std::unordered_map (which uses chaining and can degrade to O(n) on collision chains).",
  },
  {
    id: "cpp-20260524-b1-compile-time-fnv",
    language: "cpp",
    title: "Compile-time FNV-1a string hash for switch dispatch",
    tag: "performance",
    code: `#include <cstdint>
#include <string_view>

// FNV-1a 64-bit: trivially constexpr — evaluated at compile time for literals.
constexpr std::uint64_t fnv1a(std::string_view s) noexcept {
    std::uint64_t h = 14695981039346656037ULL;
    for (unsigned char c : s) {
        h ^= c;
        h *= 1099511628211ULL;
    }
    return h;
}

// "Hashed switch" — replaces a chain of strcmp with integer comparisons.
// Each case label is evaluated at compile time; the switch is O(1).
void dispatch_msg(std::string_view type) {
    switch (fnv1a(type)) {
        case fnv1a("NewOrder"):   /* handle new order */ break;
        case fnv1a("Cancel"):     /* handle cancel    */ break;
        case fnv1a("Modify"):     /* handle modify    */ break;
        case fnv1a("ExecutionReport"): /* handle fill */ break;
        default: break;
    }
}

// Verify no collision on relevant set (assert in unit tests):
static_assert(fnv1a("NewOrder") != fnv1a("Cancel"));
static_assert(fnv1a("Cancel")   != fnv1a("Modify"));`,
    explanation:
      "FIX and FIX-like protocols encode message types as ASCII strings. A hashed switch replaces O(n) strcmp chains with O(1) integer comparisons — the compiler converts the switch to a jump table or binary search over constants. Verify no collisions in the actual message-type set at compile time via static_assert.",
  },
  {
    id: "cpp-20260524-b1-branch-expect",
    language: "cpp",
    title: "__builtin_expect and [[likely]] — branch prediction hints",
    tag: "performance",
    code: `#include <cstdint>

// __builtin_expect(expr, expected): hints the branch predictor which path
// is hot. The compiler moves the cold path out of the inline instruction stream.
// [[likely]] / [[unlikely]] are the C++20 equivalents (portable).

struct Tick { double price; int seq_gap; };

// Sequence gaps are exceptional — the common path is gap==0.
void process_tick(const Tick& t) {
    if (__builtin_expect(t.seq_gap != 0, 0)) [[unlikely]] {
        // Cold path: handle gap (expensive recovery)
        // ... request retransmit, update stats ...
        return;
    }
    // Hot path: normal processing — stays in the fast instruction stream.
    (void)t.price;
}

// Integer overflow check — overflow is rare on valid data.
std::uint64_t safe_add(std::uint64_t a, std::uint64_t b) noexcept {
    if (__builtin_expect(__builtin_add_overflow(a, b, &a), 0)) [[unlikely]]
        return UINT64_MAX;   // saturate
    return a;
}`,
    explanation:
      "Modern CPUs predict branches statically based on position: fallthrough is assumed taken, backward branches assumed taken. __builtin_expect tells the compiler to lay out code so the common path is the fallthrough path, keeping the hot instructions in the same cache line and reducing decode stalls.",
  },
  {
    id: "cpp-20260524-b1-cache-align",
    language: "cpp",
    title: "Cache-line aligned struct layout — false sharing prevention",
    tag: "performance",
    code: `#include <atomic>
#include <cstddef>

// Padding to 64 bytes (one cache line) prevents false sharing:
// two threads modifying different fields don't invalidate each other's cache.
struct alignas(64) ThreadStats {
    std::atomic<std::uint64_t> msg_count{0};
    std::atomic<std::uint64_t> byte_count{0};
    std::atomic<std::uint64_t> error_count{0};
    // Pad to 64 bytes so the next ThreadStats starts on a new cache line.
    char pad_[64 - 3 * sizeof(std::atomic<std::uint64_t>)];
};
static_assert(sizeof(ThreadStats) == 64);

// Per-feed-thread stats — each in its own cache line.
// Without alignment, two threads updating adjacent stats ping-pong
// the cache line between cores, adding ~50-100 ns per update.
ThreadStats feed_stats[8];

// Hot/cold field separation: keep hot fields (read every tick) together,
// cold fields (config, rarely read) in a separate struct or at the end.
struct OrderEntry {
    // Hot: read on every price update (one cache line)
    alignas(64) double       price;
    double                   qty;
    std::uint64_t            order_id;
    int                      side;
    char                     pad_hot[64 - sizeof(double)*2 - sizeof(uint64_t) - sizeof(int)];
    // Cold: only on order state transitions
    alignas(64) char         symbol[12];
    std::uint64_t            ts_ns;
    int                      status;
};`,
    explanation:
      "False sharing occurs when two threads write to different variables that share a cache line — each write invalidates the line on the other core. Padding to 64 bytes ensures each hot field has its own cache line; on a 20-core machine this can turn O(n_cores) write contention into O(1).",
  },
  {
    id: "cpp-20260524-b1-hugepages",
    language: "cpp",
    title: "Transparent hugepages — mmap 2 MB pages for ring buffer",
    tag: "performance",
    code: `#ifdef __linux__
#include <sys/mman.h>
#include <cstddef>
#include <stdexcept>

// Allocate with MAP_HUGETLB: 2 MB pages instead of 4 KB.
// For a 256 MB ring buffer: 4 KB pages = 65536 TLB misses, 2 MB = 128.
// Each TLB miss costs ~10 ns — hugepages give 4 KB miss rate / 512.
void* alloc_huge(std::size_t bytes) {
    constexpr std::size_t HUGE_PAGE = 2 * 1024 * 1024;   // 2 MB
    // Round up to huge page boundary
    bytes = (bytes + HUGE_PAGE - 1) & ~(HUGE_PAGE - 1);

    void* p = mmap(nullptr, bytes,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                   -1, 0);
    if (p == MAP_FAILED) {
        // Fallback: transparent hugepages via madvise (no kernel config needed)
        p = mmap(nullptr, bytes,
                 PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (p == MAP_FAILED) throw std::bad_alloc{};
        madvise(p, bytes, MADV_HUGEPAGE);
    }
    return p;
}

void free_huge(void* p, std::size_t bytes) noexcept {
    munmap(p, bytes);
}
#endif`,
    explanation:
      "TLB entries are scarce (128-1024 per level). A 256 MB ring buffer with 4 KB pages requires 65 536 TLB entries — impossible to hold at once, causing constant misses. Hugepages reduce the entry count by 512x, eliminating TLB thrashing in memory-mapped ring buffers and shared-memory IPC channels.",
  },
  {
    id: "cpp-20260524-b1-fix-parser",
    language: "cpp",
    title: "FIX 4.4 tag-value message parser (zero-allocation)",
    tag: "quant",
    code: `#include <string_view>
#include <cstdint>
#include <cstring>

// FIX wire format: "8=FIX4.4\x019=...\x01...<tag>=<val>\x01...10=<cksum>\x01"
// SOH (0x01) is the delimiter. Parse in a single pass — no heap allocation.
struct FixField { int tag; std::string_view value; };

struct FixMsg {
    FixField fields[64];
    int      count = 0;

    std::string_view get(int tag) const noexcept {
        for (int i = 0; i < count; ++i)
            if (fields[i].tag == tag) return fields[i].value;
        return {};
    }
};

FixMsg parse_fix(std::string_view msg) noexcept {
    FixMsg m;
    const char* p   = msg.data();
    const char* end = p + msg.size();

    while (p < end && m.count < 64) {
        // Parse tag (integer)
        int tag = 0;
        while (p < end && *p != '=') { tag = tag*10 + (*p - '0'); ++p; }
        if (p >= end) break; ++p;  // skip '='

        // Parse value (up to SOH)
        const char* vs = p;
        while (p < end && *p != '\x01') ++p;
        m.fields[m.count++] = { tag, {vs, std::size_t(p - vs)} };
        if (p < end) ++p;  // skip SOH
    }
    return m;
}

// Tag reference: 49=SenderCompID, 56=TargetCompID, 35=MsgType,
//                38=OrderQty, 44=Price, 54=Side (1=Buy, 2=Sell)`,
    explanation:
      "FIX ASCII is the universal protocol for institutional order flow. A zero-allocation parser avoids heap calls on the critical path — field values are string_views into the original buffer. The tag lookup is linear-scan (typical message has <20 fields), which beats hash-map overhead for small fixed sets.",
  },
  {
    id: "cpp-20260524-b1-binheap-orderbook",
    language: "cpp",
    title: "Binary-heap order book side (std::priority_queue)",
    tag: "quant",
    code: `#include <queue>
#include <vector>
#include <unordered_set>
#include <cstdint>

struct Order {
    double        price;
    std::uint64_t ts;       // time priority within same price
    std::uint64_t id;
    std::uint32_t qty;
    bool operator<(const Order& o) const {
        return price != o.price ? price < o.price : ts > o.ts; // max-heap
    }
};

// Lazy-deletion heap: cancelled orders are removed when they reach the top.
class BidSide {
    std::priority_queue<Order> heap_;
    std::unordered_set<std::uint64_t> cancelled_;
public:
    void add(Order o)   { heap_.push(o); }
    void cancel(std::uint64_t id) { cancelled_.insert(id); }

    // Best bid: skip cancelled entries at the top.
    const Order* best() {
        while (!heap_.empty() && cancelled_.count(heap_.top().id))
            heap_.pop();
        return heap_.empty() ? nullptr : &heap_.top();
    }

    // Match qty against best bid; returns filled qty.
    std::uint32_t match(std::uint32_t needed) {
        std::uint32_t filled = 0;
        while (needed > 0 && best()) {
            Order top = heap_.top(); heap_.pop();
            if (cancelled_.count(top.id)) continue;
            std::uint32_t take = std::min(top.qty, needed);
            filled += take; needed -= take;
            if (top.qty > take) {
                top.qty -= take; heap_.push(top);
            }
        }
        return filled;
    }
};`,
    explanation:
      "Lazy deletion keeps the heap simple: rather than removing arbitrary elements (which requires a custom indexed structure), cancelled orders are filtered when they surface to the top. This works because cancels are rare relative to new orders in most books — but degrades if cancel rates are very high.",
  },
  {
    id: "cpp-20260524-b1-vasicek-sim",
    language: "cpp",
    title: "Vasicek short-rate simulation (exact update)",
    tag: "quant",
    code: `#include <random>
#include <vector>
#include <cmath>

// Vasicek: dr = a*(b - r)*dt + sigma*dW.
// Exact discrete update: r(t+dt) = r(t)*exp(-a*dt) + b*(1-exp(-a*dt))
//                                  + sigma*sqrt((1-exp(-2a*dt))/(2a)) * Z
// Unlike Euler, exact update has no discretisation error regardless of dt.
std::vector<std::vector<double>>
vasicek_paths(double a, double b, double sigma, double r0,
              double T, int n_steps, int n_paths, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt       = T / n_steps;
    double e_a      = std::exp(-a * dt);
    double mu_shift = b * (1.0 - e_a);
    double vol_step = sigma * std::sqrt((1.0 - e_a*e_a) / (2.0*a));

    std::vector<std::vector<double>> paths(n_paths,
                                           std::vector<double>(n_steps+1));
    for (int p = 0; p < n_paths; ++p) {
        paths[p][0] = r0;
        for (int i = 0; i < n_steps; ++i)
            paths[p][i+1] = paths[p][i]*e_a + mu_shift + vol_step * nd(rng);
    }
    return paths;
}

// Bond price: P(0,T) = exp(A(T) - B(T)*r0)  (analytic Vasicek formula)
double vasicek_bond(double a, double b, double sigma, double r0, double T) {
    double B  = (1.0 - std::exp(-a*T)) / a;
    double A  = (B - T)*(a*a*b - 0.5*sigma*sigma)/(a*a)
               - sigma*sigma*B*B/(4.0*a);
    return std::exp(A - B*r0);
}`,
    explanation:
      "The exact Vasicek update is a Gaussian conditional distribution — no discretisation error accumulates regardless of step size. This is in contrast to Euler–Maruyama, which requires small dt for accuracy. Use the exact update whenever paths are simulated for bond pricing or risk aggregation.",
  },
  {
    id: "cpp-20260524-b1-bs-greeks",
    language: "cpp",
    title: "Black-Scholes analytic Greeks (delta, gamma, vega, theta, rho)",
    tag: "quant",
    code: `#include <cmath>

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * M_SQRT1_2);
}
static double phi(double x) noexcept {
    return std::exp(-0.5*x*x) / std::sqrt(2.0*M_PI);
}

struct BSGreeks {
    double price, delta, gamma, vega, theta, rho;
};

// is_call: 1 for call, -1 for put.
BSGreeks bs_greeks(double S, double K, double r, double q,
                   double sigma, double T, int is_call) noexcept {
    double sT  = sigma * std::sqrt(T);
    double d1  = (std::log(S/K) + (r - q + 0.5*sigma*sigma)*T) / sT;
    double d2  = d1 - sT;
    double Nd1 = Phi(is_call * d1), Nd2 = Phi(is_call * d2);
    double disc_K = K * std::exp(-r*T);
    double disc_S = S * std::exp(-q*T);

    BSGreeks g;
    g.price = is_call * (disc_S*Nd1 - disc_K*Nd2);
    g.delta = is_call * std::exp(-q*T) * Phi(is_call * d1);
    g.gamma = std::exp(-q*T) * phi(d1) / (S * sT);       // same for call/put
    g.vega  = disc_S * phi(d1) * std::sqrt(T) * 0.01;    // per 1% vol move
    g.theta = (-disc_S*phi(d1)*sigma/(2*std::sqrt(T))
               - is_call*(r*disc_K*Nd2 - q*disc_S*Nd1)) / 365.0;
    g.rho   = is_call * K*T*std::exp(-r*T)*Nd2 * 0.01;   // per 1% rate move
    return g;
}`,
    explanation:
      "Greeks are the risk sensitivities that drive hedging decisions. Gamma (convexity) is particularly important for options market makers: it is strictly positive and identical for calls and puts (put-call parity), meaning a delta-hedged position always gains from large moves — the cost is theta (time decay).",
  },
  {
    id: "cpp-20260524-b1-risk-engine",
    language: "cpp",
    title: "Vectorised portfolio risk engine (DV01 and delta aggregation)",
    tag: "quant",
    code: `#include <vector>
#include <numeric>
#include <cmath>

// Each position: (quantity, DV01_per_unit, delta_per_unit, price).
struct Holding { double qty; double dv01; double delta; double price; };

struct PortfolioRisk {
    double total_dv01;    // $ gain per bp rate decline
    double total_delta;   // $ gain per 1% underlying move
    double market_value;
    double var_1d_95;     // 1-day 95% VaR (parametric)
};

// Parametric VaR: assumes normally distributed P&L.
// sigma_pnl ~ sqrt(sum(w_i^2 * sigma_i^2 + 2*w_i*w_j*rho_ij*sigma_i*sigma_j))
// Simplified single-factor version: sigma_pnl = delta_pnl * sigma_mkt.
PortfolioRisk aggregate_risk(const std::vector<Holding>& book,
                              double sigma_rate_bps = 5.0,   // daily rate vol
                              double sigma_equity   = 0.012) // daily equity vol
{
    PortfolioRisk r{};
    for (const auto& h : book) {
        r.total_dv01   += h.qty * h.dv01;
        r.total_delta  += h.qty * h.delta;
        r.market_value += h.qty * h.price;
    }
    double rate_pnl_sigma   = r.total_dv01 * sigma_rate_bps;
    double equity_pnl_sigma = r.total_delta * sigma_equity * 100.0; // delta in $/%
    double total_sigma = std::hypot(rate_pnl_sigma, equity_pnl_sigma);
    r.var_1d_95 = 1.645 * total_sigma;   // 95% one-tailed normal quantile
    return r;
}`,
    explanation:
      "DV01 (dollar value of a basis point) is the fixed-income analogue of delta: it measures the P&L change per 1 bp rate shift. The parametric VaR assumes P&L is normally distributed — a strong assumption that fails in stress but is fast enough for intraday risk limits monitoring.",
  },
  {
    id: "cpp-20260524-b1-coroutine-generator",
    language: "cpp",
    title: "C++20 coroutine generator for tick replay",
    tag: "stl",
    code: `#include <coroutine>
#include <vector>
#include <optional>

// Minimal generator that lazily yields ticks from a container.
// C++23 has std::generator; this is the C++20 manual version.
template <typename T>
struct Generator {
    struct promise_type;
    using handle_t = std::coroutine_handle<promise_type>;

    struct promise_type {
        std::optional<T> current;
        Generator        get_return_object()  { return Generator{handle_t::from_promise(*this)}; }
        std::suspend_always initial_suspend()  { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        std::suspend_always yield_value(T v)  { current = v; return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    handle_t coro;
    explicit Generator(handle_t h) : coro(h) {}
    ~Generator() { if (coro) coro.destroy(); }

    struct iterator {
        handle_t h;
        bool     done;
        void     operator++()        { h.resume(); done = h.done(); }
        T        operator*() const   { return *h.promise().current; }
        bool     operator!=(std::monostate) const { return !done; }
    };
    auto begin() { coro.resume(); return iterator{coro, coro.done()}; }
    auto end()   { return std::monostate{}; }
};

Generator<double> replay_prices(const std::vector<double>& ticks) {
    for (double p : ticks) co_yield p;
}

int main() {
    std::vector<double> ticks = {100.0, 101.5, 99.8, 102.3};
    for (double p : replay_prices(ticks))
        (void)p;  // process tick p
}`,
    explanation:
      "C++20 coroutines make generators first-class: the compiler rewrites the co_yield into a suspension point that resumes on the next iteration. Compared to a callback-based API, a generator lets the consumer control the pace — critical for backtesting where upstream tick rate must match downstream processing speed.",
  },
  {
    id: "cpp-20260524-b1-std-variant",
    language: "cpp",
    title: "std::variant as a tagged union for market event dispatch",
    tag: "stl",
    code: `#include <variant>
#include <string>
#include <iostream>

// Type-safe union: exactly one of these is active at any time.
// sizeof(MarketEvent) = max(sizeof...) + discriminant — no heap needed.
struct NewOrderEvent  { std::uint64_t id; double price; int qty; char side; };
struct CancelEvent    { std::uint64_t id; };
struct FillEvent      { std::uint64_t bid_id; std::uint64_t ask_id;
                        double fill_price; int fill_qty; };
struct TopOfBookEvent { double bid; double ask; int bid_qty; int ask_qty; };

using MarketEvent = std::variant<NewOrderEvent, CancelEvent,
                                  FillEvent, TopOfBookEvent>;

// std::visit dispatches based on active type — no virtual, no switch.
struct EventPrinter {
    void operator()(const NewOrderEvent& e) const {
        std::cout << "NewOrder id=" << e.id << " px=" << e.price << "\\n";
    }
    void operator()(const CancelEvent& e) const {
        std::cout << "Cancel   id=" << e.id << "\\n";
    }
    void operator()(const FillEvent& e)       const { std::cout << "Fill\\n";  }
    void operator()(const TopOfBookEvent& e)  const { std::cout << "TOB\\n";   }
};

void dispatch(const MarketEvent& ev) {
    std::visit(EventPrinter{}, ev);
}`,
    explanation:
      "std::variant enforces type safety that a raw union cannot: it tracks the active member and throws std::bad_variant_access on wrong-type access. std::visit compiles to a jump table over the variant index — performance matches a hand-written switch with no virtual dispatch overhead.",
  },
  {
    id: "cpp-20260524-b1-simd-dot",
    language: "cpp",
    title: "AVX2 SIMD vectorised dot product for factor model",
    tag: "performance",
    code: `#ifdef __AVX2__
#include <immintrin.h>
#include <cstddef>
#include <cassert>

// Compute dot product of two float32 arrays using 256-bit AVX2 registers.
// Processes 8 floats per SIMD instruction vs 1 for scalar.
// Used in factor model: pnl = weights . factor_returns (N=100-500 factors).
float dot_avx2(const float* __restrict__ a,
               const float* __restrict__ b,
               std::size_t n) noexcept {
    assert(n % 8 == 0);  // caller pads to multiple of 8
    __m256 acc = _mm256_setzero_ps();

    for (std::size_t i = 0; i < n; i += 8) {
        __m256 va = _mm256_loadu_ps(a + i);   // unaligned load (same cost on Haswell+)
        __m256 vb = _mm256_loadu_ps(b + i);
        acc = _mm256_fmadd_ps(va, vb, acc);   // fused multiply-add: acc += va * vb
    }

    // Horizontal sum of 8 lanes
    __m128 lo  = _mm256_castps256_ps128(acc);
    __m128 hi  = _mm256_extractf128_ps(acc, 1);
    __m128 sum = _mm_add_ps(lo, hi);          // 4-wide
    sum = _mm_hadd_ps(sum, sum);
    sum = _mm_hadd_ps(sum, sum);
    return _mm_cvtss_f32(sum);
}
#endif`,
    explanation:
      "_mm256_fmadd_ps performs 8 multiply-adds per instruction — roughly 8x scalar throughput on a factor-model dot product. AVX2 FMA has throughput of 0.5 cycles on modern Intel (2 FMA units), giving ~32 FLOPs/cycle on a 3 GHz core. This matters when recomputing portfolio greeks on every tick.",
  },
  {
    id: "cpp-20260524-b1-order-id-bitmap",
    language: "cpp",
    title: "Bitmap order-ID tracker — O(1) cancel check",
    tag: "quant",
    code: `#include <vector>
#include <cstdint>
#include <cassert>

// For order IDs in range [0, N): a single bit per ID = N/8 bytes.
// 1 million orders = 128 KB bitmap; cancel check = load + bit test.
class OrderBitmap {
    std::vector<std::uint64_t> bits_;
    std::size_t capacity_;
public:
    explicit OrderBitmap(std::size_t capacity)
        : bits_((capacity + 63) / 64, 0), capacity_(capacity) {}

    void set_active(std::uint64_t id) noexcept {
        bits_[id >> 6] |= (1ULL << (id & 63));
    }
    void set_cancelled(std::uint64_t id) noexcept {
        bits_[id >> 6] &= ~(1ULL << (id & 63));
    }
    bool is_active(std::uint64_t id) const noexcept {
        return (bits_[id >> 6] >> (id & 63)) & 1;
    }
    // Count active orders in O(N/64) via popcount.
    std::size_t count_active() const noexcept {
        std::size_t n = 0;
        for (auto w : bits_) n += __builtin_popcountll(w);
        return n;
    }
};`,
    explanation:
      "A bitmap is the densest structure for tracking membership in an integer domain. At one bit per order, 1 million orders consume only 128 KB — fitting in L2 cache. is_active() is a single cache-hit load plus a shift-and-mask, compared to the hash-table lookup and pointer chase of std::unordered_set.",
  },
  {
    id: "cpp-20260524-b1-clock-rdtsc",
    language: "cpp",
    title: "RDTSC timestamp — hardware cycle counter for latency profiling",
    tag: "performance",
    code: `#include <cstdint>
#include <ctime>

#ifdef __x86_64__

// RDTSC: read the hardware cycle counter — cheaper than clock_gettime().
// ~20 CPU cycles vs ~25 ns for VDSO clock_gettime.
// Use for intra-process latency measurement; NOT for wall time (no epoch).
inline std::uint64_t rdtsc() noexcept {
    std::uint32_t lo, hi;
    asm volatile("rdtsc" : "=a"(lo), "=d"(hi));
    return (std::uint64_t(hi) << 32) | lo;
}

// RDTSCP: serialising read — all prior instructions complete before reading.
// Prevents CPU from reordering the counter read before the measured work.
inline std::uint64_t rdtscp() noexcept {
    std::uint32_t lo, hi, aux;
    asm volatile("rdtscp" : "=a"(lo), "=d"(hi), "=c"(aux));
    return (std::uint64_t(hi) << 32) | lo;
}

// Calibrate cycles-per-nanosecond at startup:
double calibrate_tsc_ns() {
    struct timespec t0, t1;
    uint64_t c0 = rdtsc();
    clock_gettime(CLOCK_MONOTONIC, &t0);
    // Busy-wait 10 ms
    while (true) {
        clock_gettime(CLOCK_MONOTONIC, &t1);
        long ns = (t1.tv_sec - t0.tv_sec)*1000000000L + t1.tv_nsec - t0.tv_nsec;
        if (ns >= 10000000L) {
            return (double)(rdtsc() - c0) / ns;
        }
    }
}
#endif`,
    explanation:
      "RDTSCP is the standard HFT latency probe: it serialises against prior instructions (preventing speculative execution from skewing the reading), reads in ~20 cycles, and avoids the VDSO call overhead of clock_gettime. Calibrate once at startup to convert cycles to nanoseconds.",
  },
  {
    id: "cpp-20260524-b1-ring-buffer-spsc",
    language: "cpp",
    title: "SPSC lock-free ring buffer (single producer, single consumer)",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>

// Cache-line separated head/tail prevents false sharing between producer/consumer.
// Power-of-2 capacity enables bitmask wrapping instead of modulo.
template <typename T, std::size_t Cap>
class SpscRing {
    static_assert((Cap & (Cap-1)) == 0, "Cap must be power of 2");
    static constexpr std::size_t MASK = Cap - 1;

    alignas(64) std::atomic<std::size_t> head_{0};  // consumer reads
    alignas(64) std::atomic<std::size_t> tail_{0};  // producer writes
    std::array<T, Cap> buf_{};

public:
    // Producer — returns false if full.
    bool push(T val) noexcept {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        std::size_t h = head_.load(std::memory_order_acquire);
        if (t - h >= Cap) return false;        // full
        buf_[t & MASK] = std::move(val);
        tail_.store(t + 1, std::memory_order_release);
        return true;
    }

    // Consumer — returns empty optional if empty.
    std::optional<T> pop() noexcept {
        std::size_t h = head_.load(std::memory_order_relaxed);
        std::size_t t = tail_.load(std::memory_order_acquire);
        if (h == t) return std::nullopt;       // empty
        T val = std::move(buf_[h & MASK]);
        head_.store(h + 1, std::memory_order_release);
        return val;
    }

    std::size_t size() const noexcept {
        return tail_.load(std::memory_order_acquire)
             - head_.load(std::memory_order_acquire);
    }
};`,
    explanation:
      "The SPSC ring buffer is the canonical inter-thread pipe for HFT: the feed handler (producer) and the strategy (consumer) run on separate pinned cores. Cache-line alignment of head/tail prevents the most common false-sharing bottleneck. Bitmask wrapping replaces modulo division — critical when the ring is the hot path.",
  },
  {
    id: "cpp-20260524-b1-enum-flags",
    language: "cpp",
    title: "enum class flags with bitwise operators",
    tag: "stl",
    code: `#include <cstdint>
#include <type_traits>

// Strongly typed flag enum: prevents mixing OrderFlags with other enums.
enum class OrderFlags : std::uint16_t {
    None         = 0,
    Aggressive   = 1 << 0,
    PostOnly     = 1 << 1,
    ReduceOnly   = 1 << 2,
    Iceberg      = 1 << 3,
    IOC          = 1 << 4,   // Immediate or Cancel
    FOK          = 1 << 5,   // Fill or Kill
};

// Enable bitwise ops for enum class via type-safe template overloads.
constexpr OrderFlags operator|(OrderFlags a, OrderFlags b) noexcept {
    return OrderFlags(std::to_underlying(a) | std::to_underlying(b));
}
constexpr OrderFlags operator&(OrderFlags a, OrderFlags b) noexcept {
    return OrderFlags(std::to_underlying(a) & std::to_underlying(b));
}
constexpr bool has_flag(OrderFlags set, OrderFlags flag) noexcept {
    return (set & flag) != OrderFlags::None;
}

int main() {
    OrderFlags f = OrderFlags::PostOnly | OrderFlags::ReduceOnly;
    static_assert(has_flag(OrderFlags::IOC | OrderFlags::Aggressive,
                            OrderFlags::IOC));
    (void)has_flag(f, OrderFlags::Iceberg);   // false
}`,
    explanation:
      "enum class prevents accidental mixing with int or other enums, but blocks the bitwise operators needed for flag sets. The template overloads restore bitwise ops while preserving type safety. std::to_underlying (C++23, or a cast) extracts the underlying integer without unsafe C casts.",
  },
  {
    id: "cpp-20260524-b1-numa-alloc",
    language: "cpp",
    title: "NUMA-aware memory allocation for multi-socket HFT servers",
    tag: "performance",
    code: `#ifdef __linux__
#include <numa.h>       // libnuma: apt install libnuma-dev
#include <cstddef>
#include <stdexcept>

// On a 2-socket server: DRAM attached to socket 0 is 100 ns from core 0,
// but ~200 ns from core 16 (socket 1). Allocate receive buffers on the
// same NUMA node as the NIC and the cores processing the feed.
class NumaBuffer {
    void*  ptr_  = nullptr;
    size_t size_ = 0;
    int    node_ = 0;
public:
    NumaBuffer(size_t bytes, int numa_node) : size_(bytes), node_(numa_node) {
        if (numa_available() < 0) throw std::runtime_error("libnuma unavailable");
        ptr_ = numa_alloc_onnode(bytes, numa_node);
        if (!ptr_) throw std::bad_alloc{};
    }
    ~NumaBuffer() { if (ptr_) numa_free(ptr_, size_); }

    void* data() noexcept { return ptr_; }
    size_t size() const noexcept { return size_; }
    int node()   const noexcept { return node_; }
};

// Pin the calling thread to the cores on the target NUMA node:
// numa_run_on_node(node); // optional — memory is fast only if thread is local
#endif`,
    explanation:
      "On dual-socket servers, cross-NUMA memory accesses double the latency (local ~75 ns, remote ~130 ns). For the receive buffer of a market-data feed, allocating on the same node as the NIC's DMA target halves the first-hop memory latency. libnuma lets you specify the node without relying on OS placement heuristics.",
  },
  {
    id: "cpp-20260524-b1-concepts-sortable",
    language: "cpp",
    title: "C++20 requires-expression and compound concepts",
    tag: "templates",
    code: `#include <concepts>
#include <algorithm>
#include <vector>
#include <string>

// Sortable: has operator<, is default constructible, is copyable.
// Using a requires-expression to spell out the exact operations needed.
template <typename T>
concept TickSortable = std::totally_ordered<T> && requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
    std::swap(a, b);   // checked swap requirement
};

// Sort-then-deduplicate for a sequence of tick timestamps.
template <TickSortable T>
std::vector<T> sorted_unique(std::vector<T> v) {
    std::ranges::sort(v);
    auto [first, last] = std::ranges::unique(v);
    v.erase(first, last);
    return v;
}

// Abbreviating function templates with constrained auto (C++20):
void print_sorted(const std::ranges::range auto& r) {
    for (const auto& x : r) (void)x;
}

int main() {
    auto ts = sorted_unique(std::vector<long long>{300, 100, 200, 100, 300});
    // ts == {100, 200, 300}
    (void)ts;
}`,
    explanation:
      "requires-expressions let you spell out the exact syntactic and semantic requirements of a template parameter. Unlike SFINAE, failed requirements produce a concise diagnostic: 'T does not satisfy TickSortable because swap is not valid'. The constrained auto shorthand makes function templates nearly as readable as duck-typed Python.",
  },
  {
    id: "cpp-20260524-b1-chrono-timestamps",
    language: "cpp",
    title: "std::chrono — nanosecond timestamps and duration arithmetic",
    tag: "stl",
    code: `#include <chrono>
#include <cstdint>
#include <iostream>

using ns_clock = std::chrono::steady_clock;  // monotonic, no leap seconds
using ns_tp    = std::chrono::time_point<ns_clock, std::chrono::nanoseconds>;

// Record arrival time of a market data message.
struct TickTimestamp {
    std::uint64_t exchange_ns;   // exchange-side nanoseconds (from header)
    ns_tp         recv_tp;       // local receive time

    std::int64_t latency_ns() const {
        auto recv_ns = recv_tp.time_since_epoch().count();
        return static_cast<std::int64_t>(recv_ns) -
               static_cast<std::int64_t>(exchange_ns);
    }
};

inline ns_tp now_ns() noexcept {
    return std::chrono::time_point_cast<std::chrono::nanoseconds>(ns_clock::now());
}

// Latency histogram bucket (10 ns resolution).
int bucket(std::int64_t ns) noexcept {
    return static_cast<int>(ns / 10);
}

int main() {
    auto t0 = now_ns();
    // ... process message ...
    auto t1 = now_ns();
    auto dt  = std::chrono::duration_cast<std::chrono::nanoseconds>(t1 - t0);
    std::cout << dt.count() << " ns\\n";
}`,
    explanation:
      "std::chrono::steady_clock is the correct clock for latency measurement: unlike system_clock it never jumps backward on NTP adjustments. time_point arithmetic is type-safe — subtracting two time_points gives a duration, preventing unit errors that commonly plague ns/us/ms mixed arithmetic in low-latency code.",
  },
  {
    id: "cpp-20260524-b1-mcmc-calibration",
    language: "cpp",
    title: "Simple MCMC Metropolis-Hastings for parameter calibration",
    tag: "quant",
    code: `#include <random>
#include <vector>
#include <cmath>
#include <functional>

// Metropolis-Hastings for posterior sampling of model parameters.
// Useful when gradient-based optimisation gets stuck in local minima.
std::vector<std::vector<double>>
metropolis(std::function<double(const std::vector<double>&)> log_posterior,
           std::vector<double> init,
           std::vector<double> step_sizes,
           int n_samples, int burnin = 1000, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    std::vector<std::vector<double>> samples;
    samples.reserve(n_samples);

    auto current     = init;
    double log_curr  = log_posterior(current);

    for (int iter = 0; iter < burnin + n_samples; ++iter) {
        // Gaussian proposal centred at current position
        auto proposed = current;
        for (std::size_t k = 0; k < proposed.size(); ++k)
            proposed[k] += step_sizes[k] * nd(rng);

        double log_prop = log_posterior(proposed);
        double log_ratio = log_prop - log_curr;

        // Accept with probability min(1, exp(log_ratio))
        if (log_ratio >= 0.0 ||
            std::uniform_real_distribution<>()(rng) < std::exp(log_ratio)) {
            current  = proposed;
            log_curr = log_prop;
        }
        if (iter >= burnin) samples.push_back(current);
    }
    return samples;
}`,
    explanation:
      "Metropolis-Hastings is the workhorse MCMC algorithm: it explores the posterior by proposing moves and accepting or rejecting based on the likelihood ratio. Unlike MLE, it quantifies parameter uncertainty — essential when calibrating options models where the likelihood surface is multi-modal or nearly flat.",
  },
  {
    id: "cpp-20260524-b1-hash-map-order-book",
    language: "cpp",
    title: "Hash-map + sorted-set hybrid order book",
    tag: "quant",
    code: `#include <unordered_map>
#include <map>
#include <list>
#include <cstdint>

// Production order book hybrid: O(1) order lookup by ID + O(log N) price level access.
// Each price level holds a FIFO queue of orders (time priority within price).
struct Order { std::uint64_t id; double price; int qty; char side; };

class HybridBook {
    using Level  = std::list<Order*>;
    using Levels = std::map<double, Level>;   // sorted by price

    Levels                                        bids_;  // descending (rbegin = best)
    Levels                                        asks_;  // ascending  (begin  = best)
    std::unordered_map<std::uint64_t, Order*>     id_map_;

public:
    void add(Order* o) {
        id_map_[o->id] = o;
        auto& book = (o->side == 'B') ? bids_ : asks_;
        book[o->price].push_back(o);
    }

    bool cancel(std::uint64_t id) {
        auto it = id_map_.find(id);
        if (it == id_map_.end()) return false;
        Order* o   = it->second;
        auto& book = (o->side == 'B') ? bids_ : asks_;
        auto& lev  = book.at(o->price);
        lev.remove(o);                             // O(n_level), usually tiny
        if (lev.empty()) book.erase(o->price);
        id_map_.erase(it);
        return true;
    }

    Order* best_bid() { return bids_.empty() ? nullptr : bids_.rbegin()->second.front(); }
    Order* best_ask() { return asks_.empty() ? nullptr : asks_.begin()->second.front();  }
};`,
    explanation:
      "The hash-map + sorted-map hybrid achieves O(1) cancel (lookup by ID, then remove from level's list) and O(log N) best-bid/ask access. The inner list gives FIFO time priority within each price level. This is the textbook structure for a full price-time-priority limit order book.",
  },
  {
    id: "cpp-20260524-b1-template-specialisation",
    language: "cpp",
    title: "Explicit template specialisation — type-specific serialisation",
    tag: "templates",
    code: `#include <cstdint>
#include <cstring>
#include <vector>

// Primary template — compile-error for unsupported types (SFINAE alternative).
template <typename T>
struct BinarySerialiser;

// Specialisation for uint64_t: big-endian wire format.
template <>
struct BinarySerialiser<std::uint64_t> {
    static void write(std::vector<char>& buf, std::uint64_t v) {
        for (int i = 7; i >= 0; --i)
            buf.push_back(static_cast<char>((v >> (8*i)) & 0xFF));
    }
    static std::uint64_t read(const char* p) {
        std::uint64_t v = 0;
        for (int i = 0; i < 8; ++i) v = (v << 8) | static_cast<unsigned char>(p[i]);
        return v;
    }
};

// Specialisation for double: IEEE 754 bit-cast to uint64, then big-endian.
template <>
struct BinarySerialiser<double> {
    static void write(std::vector<char>& buf, double d) {
        std::uint64_t bits;
        std::memcpy(&bits, &d, 8);
        BinarySerialiser<std::uint64_t>::write(buf, bits);
    }
    static double read(const char* p) {
        std::uint64_t bits = BinarySerialiser<std::uint64_t>::read(p);
        double d;
        std::memcpy(&d, &bits, 8);
        return d;
    }
};`,
    explanation:
      "Explicit template specialisations let you plug in completely different implementations for specific types while sharing a common interface. The double serialiser uses std::memcpy for the bit-cast rather than reinterpret_cast — memcpy is defined behaviour for type-punning, while reinterpret_cast violates strict aliasing.",
  },
];
