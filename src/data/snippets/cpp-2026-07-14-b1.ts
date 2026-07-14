import { Snippet } from "./types";

export const cppSnippets20260714B1: Snippet[] = [
  {
    id: "cpp-20260714-b1-segregated-allocator",
    language: "cpp",
    title: "Segregated Free-List Allocator (Multiple Size Classes)",
    tag: "allocators",
    code: `#include <array>
#include <cstddef>
#include <cstdlib>
#include <cassert>

// Segregated free lists: one slab per size class (8, 16, 32, 64, 128 bytes).
// Much faster than general-purpose malloc for fixed-pattern allocations
// (e.g., order objects, market-data events).
class SegregatedAllocator {
    static constexpr size_t CLASSES[]  = {8, 16, 32, 64, 128};
    static constexpr size_t NUM_CLASSES = 5;
    static constexpr size_t SLAB_BYTES = 65536; // 64 KB per slab

    struct FreeNode { FreeNode* next; };
    FreeNode* heads_[NUM_CLASSES]{};

    static size_t classFor(size_t n) {
        for (size_t i = 0; i < NUM_CLASSES; ++i)
            if (n <= CLASSES[i]) return i;
        return SIZE_MAX; // falls through to system malloc
    }

    void refill(size_t cls) {
        size_t sz   = CLASSES[cls];
        size_t count= SLAB_BYTES / sz;
        // Use aligned_alloc so objects are cache-line friendly
        char* slab  = static_cast<char*>(std::aligned_alloc(64, SLAB_BYTES));
        for (size_t i = 0; i < count; ++i) {
            auto* node = reinterpret_cast<FreeNode*>(slab + i * sz);
            node->next = heads_[cls];
            heads_[cls] = node;
        }
    }

public:
    void* allocate(size_t n) {
        size_t cls = classFor(n);
        if (cls == SIZE_MAX) return std::malloc(n);
        if (!heads_[cls]) refill(cls);
        FreeNode* node = heads_[cls];
        heads_[cls] = node->next;
        return node;
    }

    void deallocate(void* ptr, size_t n) {
        size_t cls = classFor(n);
        if (cls == SIZE_MAX) { std::free(ptr); return; }
        auto* node = static_cast<FreeNode*>(ptr);
        node->next  = heads_[cls];
        heads_[cls] = node;
    }
};

// Usage: single global allocator, zero contention on the hot path
static SegregatedAllocator g_alloc;`,
    explanation:
      "Segregated free lists eliminate per-call malloc overhead by maintaining separate recycled pools for each size class. On a release, the block is instantly recycled with a single pointer update — no kernel call, no coalescing, O(1) both ways. HFT order engines use this for predictable sub-100-ns allocations.",
  },
  {
    id: "cpp-20260714-b1-buddy-allocator",
    language: "cpp",
    title: "Power-of-Two Buddy Allocator for Variable-Size Messages",
    tag: "allocators",
    code: `#include <cstddef>
#include <cstdint>
#include <array>
#include <cassert>
#include <cstring>

// Buddy allocator: arena split recursively into power-of-2 chunks.
// Merge of two same-size, adjacent buddies on free → coalescing in O(log n).
// Well-suited for variable-size network message buffers that arrive in bursts.
class BuddyAllocator {
    static constexpr size_t MAX_ORDER = 17;          // max block = 128 KB
    static constexpr size_t ARENA    = 1 << MAX_ORDER;

    uint8_t mem_[ARENA];                             // backing store
    // free_list_[k] = linked list of free 2^k-byte blocks
    struct Node { Node* next; };
    std::array<Node*, MAX_ORDER + 1> free_{};

    // Index of block within the arena at order k
    size_t index(void* ptr, size_t k) {
        return (static_cast<uint8_t*>(ptr) - mem_) >> k;
    }
    // Buddy of block at ptr with order k
    void* buddy(void* ptr, size_t k) {
        size_t offset = static_cast<uint8_t*>(ptr) - mem_;
        return mem_ + (offset ^ (1 << k));
    }

public:
    BuddyAllocator() {
        free_[MAX_ORDER] = reinterpret_cast<Node*>(mem_);
        free_[MAX_ORDER]->next = nullptr;
    }

    void* allocate(size_t n) {
        size_t k = 0;
        while ((1u << k) < n + sizeof(size_t)) ++k; // store order in header
        size_t ks = k;
        while (ks <= MAX_ORDER && !free_[ks]) ++ks;
        if (ks > MAX_ORDER) return nullptr;
        // Split until we reach order k
        while (ks > k) {
            Node* blk  = free_[ks]; free_[ks] = blk->next; --ks;
            Node* half = reinterpret_cast<Node*>(reinterpret_cast<uint8_t*>(blk) + (1 << ks));
            half->next = free_[ks]; free_[ks] = half;
            free_[ks]->next = blk; // keep blk at head for allocation
        }
        Node* blk = free_[k]; free_[k] = blk->next;
        // Store order just before user data
        *reinterpret_cast<size_t*>(blk) = k;
        return reinterpret_cast<uint8_t*>(blk) + sizeof(size_t);
    }

    void deallocate(void* ptr) {
        auto* raw = reinterpret_cast<uint8_t*>(ptr) - sizeof(size_t);
        size_t k  = *reinterpret_cast<size_t*>(raw);
        // Merge with buddy while possible
        while (k < MAX_ORDER) {
            void* bud = buddy(raw, k);
            // Search free_[k] for the buddy
            Node** p = &free_[k];
            while (*p && *p != bud) p = &(*p)->next;
            if (!*p) break;   // buddy not free — stop
            *p = (*p)->next;  // unlink buddy
            if (bud < raw) raw = static_cast<uint8_t*>(bud);
            ++k;
        }
        auto* node = reinterpret_cast<Node*>(raw);
        node->next = free_[k]; free_[k] = node;
    }
};`,
    explanation:
      "Buddy allocators coalesce adjacent same-size freed blocks in O(log n) without fragmentation growth over time. The power-of-2 granularity means padding overhead is at most 2×, but allocations are always naturally aligned and cache-friendly — ideal for network message buffers where sizes vary by order of magnitude.",
  },
  {
    id: "cpp-20260714-b1-epoch-reclamation",
    language: "cpp",
    title: "Epoch-Based Memory Reclamation (EBR) for Lock-Free Structures",
    tag: "low-latency",
    code: `#include <atomic>
#include <array>
#include <vector>
#include <thread>

// Epoch-Based Reclamation (EBR): readers register their epoch; retired objects
// accumulate in limbo until all threads have advanced past their epoch.
// Avoids the overhead of hazard pointers for read-heavy workloads.
static constexpr int N_THREADS = 16;
static constexpr int N_EPOCHS  = 3;

struct alignas(64) ThreadState {
    std::atomic<int>  epoch{0};
    std::atomic<bool> active{false};
};

std::atomic<int>              global_epoch{0};
std::array<ThreadState, N_THREADS> thread_states;

thread_local int tid = -1;     // assigned on thread registration

struct Limbo {
    void*        ptr;
    int          retire_epoch;
};
std::array<std::vector<Limbo>, N_THREADS> limbo_lists;

inline void enter_critical(int t) {
    thread_states[t].active.store(true,  std::memory_order_relaxed);
    thread_states[t].epoch.store(
        global_epoch.load(std::memory_order_acquire),
        std::memory_order_relaxed);
    std::atomic_thread_fence(std::memory_order_seq_cst); // prevent reorder
}

inline void exit_critical(int t) {
    thread_states[t].active.store(false, std::memory_order_release);
}

void try_advance_epoch() {
    int g = global_epoch.load(std::memory_order_relaxed);
    for (int t = 0; t < N_THREADS; ++t) {
        if (thread_states[t].active.load(std::memory_order_acquire) &&
            thread_states[t].epoch.load(std::memory_order_relaxed) != g)
            return; // some thread still in old epoch
    }
    global_epoch.compare_exchange_strong(g, (g + 1) % N_EPOCHS,
                                          std::memory_order_acq_rel);
}

void retire(int t, void* ptr) {
    int e = global_epoch.load(std::memory_order_relaxed);
    limbo_lists[t].push_back({ptr, e});
    try_advance_epoch();
    // Reclaim objects retired 2 epochs ago (safe: all threads past that epoch)
    int safe = (global_epoch.load(std::memory_order_acquire) + 1) % N_EPOCHS;
    auto& limbo = limbo_lists[t];
    limbo.erase(std::remove_if(limbo.begin(), limbo.end(),
        [safe](const Limbo& l) {
            if (l.retire_epoch == safe) { ::operator delete(l.ptr); return true; }
            return false;
        }), limbo.end());
}`,
    explanation:
      "EBR amortizes reclamation cost by batching frees: a retired node is only freed when every thread has observed at least one epoch increment since the retirement. This is cheaper than hazard pointers (no per-read CAS) but requires threads to periodically advance their epoch. Used in many production lock-free maps and queues.",
  },
  {
    id: "cpp-20260714-b1-expression-templates",
    language: "cpp",
    title: "Expression Templates for Lazy Greeks Vector Arithmetic",
    tag: "meta-programming",
    code: `#include <cstddef>
#include <cmath>
#include <array>

// Expression templates: defer evaluation of vector arithmetic until assignment.
// Avoids temporary arrays — the loop is fused at compile time.
// Useful for Greeks portfolios: delta_total = w1*delta1 + w2*delta2 + ...
template<typename E>
struct VecExpr {
    double operator[](size_t i) const { return static_cast<const E&>(*this)[i]; }
    size_t size() const { return static_cast<const E&>(*this).size(); }
};

// Concrete vector (owns storage)
template<size_t N>
struct Vec : VecExpr<Vec<N>> {
    std::array<double, N> data{};
    double   operator[](size_t i) const { return data[i]; }
    double&  operator[](size_t i)       { return data[i]; }
    size_t   size() const { return N; }

    // Assign from any expression without temporaries
    template<typename E>
    Vec& operator=(const VecExpr<E>& expr) {
        for (size_t i = 0; i < N; ++i) data[i] = expr[i];
        return *this;
    }
};

// Element-wise sum expression node
template<typename L, typename R>
struct VecSum : VecExpr<VecSum<L,R>> {
    const L& l; const R& r;
    VecSum(const L& l, const R& r) : l(l), r(r) {}
    double operator[](size_t i) const { return l[i] + r[i]; }
    size_t size() const { return l.size(); }
};

// Scalar-multiply expression node
template<typename E>
struct ScalMul : VecExpr<ScalMul<E>> {
    double s; const E& e;
    ScalMul(double s, const E& e) : s(s), e(e) {}
    double operator[](size_t i) const { return s * e[i]; }
    size_t size() const { return e.size(); }
};

template<typename L, typename R>
auto operator+(const VecExpr<L>& l, const VecExpr<R>& r) {
    return VecSum<L,R>(static_cast<const L&>(l), static_cast<const R&>(r));
}
template<typename E>
auto operator*(double s, const VecExpr<E>& e) {
    return ScalMul<E>(s, static_cast<const E&>(e));
}

// Example: w1*delta1 + w2*delta2 — zero temporaries, single loop
// Vec<4> delta_total = 0.3 * delta1 + 0.7 * delta2;`,
    explanation:
      "Expression templates encode the entire computation as a type, so assignment walks the expression tree with a single loop — no temporary Vec<N> objects allocated. For large Greeks portfolios (hundreds of factors), this eliminates cache-invalidating intermediate buffers and can halve wall-clock time versus naive operator+.",
  },
  {
    id: "cpp-20260714-b1-crtp-observable",
    language: "cpp",
    title: "CRTP Observable: Zero-Cost Market Data Notification",
    tag: "meta-programming",
    code: `#include <vector>
#include <functional>

// CRTP Observable avoids virtual dispatch for market-data event notification.
// Subscribers are registered at compile time (as template args) for zero overhead.
template<typename Derived, typename Event>
class Observable {
public:
    // Notify all subscribers via static dispatch
    void publish(const Event& e) {
        static_cast<Derived*>(this)->on_publish(e);
    }
};

// Tick event
struct Tick { const char* symbol; double bid; double ask; };

// A concrete market data source that notifies N registered handlers
template<typename... Handlers>
class TickFeed : public Observable<TickFeed<Handlers...>, Tick> {
    std::tuple<Handlers&...> handlers_;
public:
    explicit TickFeed(Handlers&... h) : handlers_(h...) {}

    void on_publish(const Tick& t) {
        // C++17 fold over tuple — all calls inlined
        std::apply([&](auto&... h){ (h.on_tick(t), ...); }, handlers_);
    }

    // Simulate incoming tick
    void receive(const char* sym, double bid, double ask) {
        publish({sym, bid, ask});
    }
};

// Example handlers (no virtual, no heap)
struct Logger  { void on_tick(const Tick& t) { /* log */ (void)t; } };
struct Pricer  { void on_tick(const Tick& t) { /* reprice */ (void)t; } };
struct RiskMgr { void on_tick(const Tick& t) { /* rehedge */ (void)t; } };

// static Logger l; static Pricer p; static RiskMgr r;
// TickFeed<Logger, Pricer, RiskMgr> feed(l, p, r);
// feed.receive("AAPL", 149.99, 150.01);   // all three handlers called inline`,
    explanation:
      "CRTP-based observable delivers events via inlined fold expressions — the compiler sees the exact handler types at instantiation time and eliminates virtual dispatch entirely. For market-data fan-out (a single tick notifying 3-5 downstream components), this cuts per-event latency from ~10 ns (vtable) to ~2 ns (inline).",
  },
  {
    id: "cpp-20260714-b1-bitfield-instrument",
    language: "cpp",
    title: "Bitfield-Packed Instrument Flags (Cache-Friendly Metadata)",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cassert>

// Pack 12 per-instrument Boolean flags into one uint16_t.
// A universe of 10,000 symbols fits in 20 KB — easily hot in L1.
struct InstrumentFlags {
    uint16_t tradable        : 1;  // exchange allows new orders
    uint16_t halted          : 1;  // circuit-breaker halt
    uint16_t auction         : 1;  // in opening/closing auction
    uint16_t short_sell_ok   : 1;  // not on restricted list
    uint16_t borrow_avail    : 1;  // stock borrow available
    uint16_t options_listed  : 1;  // listed options exist
    uint16_t etf             : 1;  // is an ETF
    uint16_t marginable      : 1;  // eligible for margin
    uint16_t hard_to_borrow  : 1;  // borrow costs elevated
    uint16_t fast_market     : 1;  // NBBO fast-market condition
    uint16_t index_component : 1;  // part of a tracked index
    uint16_t _reserved       : 5;

    bool can_short_sell() const {
        return short_sell_ok && !halted && borrow_avail && !hard_to_borrow;
    }
};
static_assert(sizeof(InstrumentFlags) == 2);

// Array for 65,536 instruments: only 128 KB total
static InstrumentFlags g_flags[65536]{};

inline bool is_tradable(uint16_t iid) {
    return g_flags[iid].tradable && !g_flags[iid].halted;
}

// Update flag atomically via the underlying uint16_t
#include <atomic>
inline void set_halted(uint16_t iid, bool v) {
    auto* raw = reinterpret_cast<std::atomic<uint16_t>*>(&g_flags[iid]);
    uint16_t old = raw->load(std::memory_order_relaxed);
    uint16_t next;
    do {
        InstrumentFlags f; std::memcpy(&f, &old, 2);
        f.halted = v;
        std::memcpy(&next, &f, 2);
    } while (!raw->compare_exchange_weak(old, next, std::memory_order_release,
                                          std::memory_order_relaxed));
}`,
    explanation:
      "Packing per-instrument status flags into a uint16_t reduces the metadata footprint by ~8×, keeping the hot flags array resident in L1 cache even for 10,000-symbol universes. The atomic CAS update on the underlying integer avoids data races without a separate mutex per instrument.",
  },
  {
    id: "cpp-20260714-b1-bellman-ford-fx",
    language: "cpp",
    title: "FX Arbitrage Detection via Bellman-Ford Negative Cycle",
    tag: "graphs",
    code: `#include <vector>
#include <string>
#include <cmath>
#include <limits>
#include <iostream>

// Detect triangular FX arbitrage: a cycle where log-rates sum to < 0.
// Log transform: edge weight = -log(rate). A negative cycle means the
// product of exchange rates around the cycle > 1 (free profit).
struct Edge { int u, v; double w; };

// Returns true and populates 'cycle' if a negative-weight cycle exists.
bool bellman_ford_cycle(int n, const std::vector<Edge>& edges,
                         std::vector<int>& cycle) {
    std::vector<double> dist(n, 0.0); // start from "super source" with 0-weight
    std::vector<int>    pred(n, -1);

    int last = -1;
    for (int iter = 0; iter < n; ++iter) {
        last = -1;
        for (const auto& e : edges) {
            if (dist[e.u] + e.w < dist[e.v] - 1e-12) {
                dist[e.v] = dist[e.u] + e.w;
                pred[e.v] = e.u;
                last = e.v;
            }
        }
    }
    if (last == -1) return false; // no negative cycle

    // Walk back n steps to ensure we're inside the cycle
    int v = last;
    for (int i = 0; i < n; ++i) v = pred[v];

    // Trace the cycle
    int start = v;
    cycle.push_back(start);
    v = pred[v];
    while (v != start) { cycle.push_back(v); v = pred[v]; }
    cycle.push_back(start);
    std::reverse(cycle.begin(), cycle.end());
    return true;
}

int main() {
    // USD, EUR, GBP, JPY = 0,1,2,3
    // Rates: USD→EUR=0.92, EUR→GBP=0.86, GBP→USD=1.27 → product=1.003 > 1
    std::vector<Edge> edges;
    auto add = [&](int u, int v, double rate) {
        edges.push_back({u, v, -std::log(rate)});
    };
    add(0,1,0.92); add(1,0,1.0/0.92);
    add(1,2,0.86); add(2,1,1.0/0.86);
    add(2,0,1.27); add(0,2,1.0/1.27);

    std::vector<int> cycle;
    if (bellman_ford_cycle(4, edges, cycle)) {
        std::cout << "Arbitrage cycle: ";
        for (int c : cycle) std::cout << c << " ";
        std::cout << "\n";
    }
}`,
    explanation:
      "Taking the negative log of FX rates transforms 'product of rates > 1' into 'sum of weights < 0', letting Bellman-Ford detect triangular arbitrage as a negative cycle. A single pass of N Bellman-Ford iterations over the rate graph identifies exploitable cycles in O(VE) — practical for small FX graphs (~30 currencies, ~500 pairs).",
  },
  {
    id: "cpp-20260714-b1-richardson-extrapolation",
    language: "cpp",
    title: "Richardson Extrapolation for Higher-Order Finite-Difference Greeks",
    tag: "numerics",
    code: `#include <functional>
#include <cmath>
#include <iostream>

// Richardson extrapolation combines two finite-difference estimates
// with different step sizes to cancel the leading error term.
// Result: O(h^4) accuracy from O(h^2) building blocks.

// Central difference delta: (f(S+h) - f(S-h)) / (2h) — error O(h^2)
double central_delta(std::function<double(double)> f, double S, double h) {
    return (f(S + h) - f(S - h)) / (2.0 * h);
}

// Richardson extrapolation: 4/3 * D(h/2) - 1/3 * D(h) → error O(h^4)
double richardson_delta(std::function<double(double)> f, double S, double h) {
    double d1 = central_delta(f, S, h);
    double d2 = central_delta(f, S, h / 2.0);
    return (4.0 * d2 - d1) / 3.0;
}

// Similar for Gamma (second derivative)
double central_gamma(std::function<double(double)> f, double S, double h) {
    return (f(S + h) - 2.0 * f(S) + f(S - h)) / (h * h);
}
double richardson_gamma(std::function<double(double)> f, double S, double h) {
    double g1 = central_gamma(f, S, h);
    double g2 = central_gamma(f, S, h / 2.0);
    return (4.0 * g2 - g1) / 3.0;
}

// Black-Scholes call price (closed-form reference)
#include <cmath>
static double bs_call(double S, double K=100, double r=0.05,
                      double sigma=0.2, double T=1.0) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma * std::sqrt(T);
    auto N = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    return S * N(d1) - K * std::exp(-r*T) * N(d2);
}

int main() {
    auto f = [](double S){ return bs_call(S); };
    double S = 100.0, h = 1.0;
    std::cout << "Delta  (central h=1): " << central_delta(f, S, h)    << "\n";
    std::cout << "Delta  (Richardson):  " << richardson_delta(f, S, h) << "\n";
    // Analytic delta ≈ 0.6368
}`,
    explanation:
      "Richardson extrapolation cancels the O(h²) error term by combining D(h) and D(h/2): error drops to O(h⁴) with only one extra function evaluation. For Greeks on numerically-priced products (PDE or MC), this halves the required bump size for the same accuracy — reducing discretisation bias without expensive re-calibration.",
  },
  {
    id: "cpp-20260714-b1-crr-binomial",
    language: "cpp",
    title: "CRR Binomial Tree for American Option Pricing",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <iostream>

// Cox-Ross-Rubinstein (CRR) binomial tree.
// American option: at each node, take max(intrinsic, continuation value).
struct AmericanBinom {
    double S, K, r, sigma, T;
    int    N;          // time steps

    double price(bool is_put = true) const {
        double dt = T / N;
        double u  = std::exp(sigma * std::sqrt(dt));
        double d  = 1.0 / u;
        double p  = (std::exp(r * dt) - d) / (u - d); // risk-neutral up prob
        double df = std::exp(-r * dt);                  // per-step discount

        // Terminal node prices — index j = #up moves
        std::vector<double> V(N + 1);
        for (int j = 0; j <= N; ++j) {
            double Sj = S * std::pow(u, j) * std::pow(d, N - j);
            V[j] = is_put ? std::max(K - Sj, 0.0) : std::max(Sj - K, 0.0);
        }

        // Backward induction
        for (int i = N - 1; i >= 0; --i) {
            for (int j = 0; j <= i; ++j) {
                double Sij  = S * std::pow(u, j) * std::pow(d, i - j);
                double cont = df * (p * V[j + 1] + (1 - p) * V[j]);
                double intr = is_put ? std::max(K - Sij, 0.0)
                                     : std::max(Sij - K, 0.0);
                V[j] = std::max(cont, intr); // American early-exercise check
            }
        }
        return V[0];
    }
};

int main() {
    AmericanBinom opt{100, 100, 0.05, 0.2, 1.0, 200};
    std::cout << "American put price (N=200): " << opt.price(true) << "\n";
    // Converges to ~5.57 (compare with European ~5.57 — early ex. premium tiny here)
}`,
    explanation:
      "The CRR tree prices American options by backward induction, replacing the continuation value with the intrinsic value whenever early exercise is optimal. Unlike European closed-form formulae, the tree handles discrete dividends and path-dependent early exercise naturally. Convergence to the continuous-time price is O(1/N); Richardson extrapolation on the tree can push this to O(1/N²).",
  },
  {
    id: "cpp-20260714-b1-shared-mem-ipc",
    language: "cpp",
    title: "POSIX Shared-Memory Ring Buffer for IPC Market Data",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <atomic>
#include <cstring>
#include <cstdint>
#include <stdexcept>

// Lock-free SPSC ring buffer in shared memory.
// Writer (market-data daemon) and reader (strategy process) share
// the same physical pages — no copy, no kernel crossing on the hot path.
struct alignas(64) ShmRing {
    static constexpr uint32_t CAP = 4096; // power-of-2 for masking
    static constexpr uint32_t MASK= CAP - 1;

    std::atomic<uint64_t> write_seq{0};    // cache line 0
    char _pad0[56];
    std::atomic<uint64_t> read_seq{0};     // cache line 1
    char _pad1[56];

    struct Slot {
        uint64_t seq;   // sequence number written by producer
        char     data[56];
    };
    Slot slots[CAP];                        // 256 KB data area

    // Producer: returns false if ring is full
    bool try_push(const void* msg, size_t sz) {
        uint64_t ws = write_seq.load(std::memory_order_relaxed);
        uint64_t rs = read_seq.load(std::memory_order_acquire);
        if (ws - rs >= CAP) return false;  // full
        Slot& s = slots[ws & MASK];
        std::memcpy(s.data, msg, sz > 56 ? 56 : sz);
        s.seq = ws;
        write_seq.store(ws + 1, std::memory_order_release);
        return true;
    }

    // Consumer: returns false if ring is empty
    bool try_pop(void* out, size_t sz) {
        uint64_t rs = read_seq.load(std::memory_order_relaxed);
        uint64_t ws = write_seq.load(std::memory_order_acquire);
        if (rs == ws) return false; // empty
        const Slot& s = slots[rs & MASK];
        if (s.seq != rs) return false; // not yet committed
        std::memcpy(out, s.data, sz > 56 ? 56 : sz);
        read_seq.store(rs + 1, std::memory_order_release);
        return true;
    }
};

ShmRing* open_shm_ring(const char* name, bool create) {
    int fd = shm_open(name, create ? O_CREAT|O_RDWR : O_RDWR, 0600);
    if (fd < 0) throw std::runtime_error("shm_open failed");
    if (create) ftruncate(fd, sizeof(ShmRing));
    void* ptr = mmap(nullptr, sizeof(ShmRing),
                     PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0);
    close(fd);
    if (ptr == MAP_FAILED) throw std::runtime_error("mmap failed");
    return static_cast<ShmRing*>(ptr);
}`,
    explanation:
      "POSIX shared memory lets two processes share a lock-free ring buffer with no kernel involvement on the hot path: after mmap, reads and writes are plain cache-coherent loads/stores. Cache-line padding on write_seq and read_seq prevents false sharing between producer and consumer cores. Production HFT feed handlers use this pattern to achieve sub-500-ns inter-process tick latency.",
  },
  {
    id: "cpp-20260714-b1-soa-tick-store",
    language: "cpp",
    title: "Structure-of-Arrays (SoA) Tick Store for Vectorized Analytics",
    tag: "low-latency",
    code: `#include <vector>
#include <cstdint>
#include <numeric>
#include <algorithm>
#include <immintrin.h> // for SIMD, optional

// Array-of-Structures (AoS): bad for SIMD — interleaved fields prevent
// vectorizing across ticks. Structure-of-Arrays (SoA): each field is a
// contiguous array — AVX2 can process 4 doubles per cycle.
struct TickStoreSoA {
    std::vector<int64_t>  timestamps;  // nanoseconds since epoch
    std::vector<double>   bids;
    std::vector<double>   asks;
    std::vector<uint32_t> volumes;
    std::vector<uint16_t> venue_ids;

    void push(int64_t ts, double bid, double ask, uint32_t vol, uint16_t venue) {
        timestamps.push_back(ts);
        bids.push_back(bid);
        asks.push_back(ask);
        volumes.push_back(vol);
        venue_ids.push_back(venue);
    }

    size_t size() const { return timestamps.size(); }

    // SIMD-friendly: sum of spreads over entire history
    double total_spread() const {
        size_t n = bids.size();
        double sum = 0.0;
        size_t i = 0;
#ifdef __AVX2__
        __m256d acc = _mm256_setzero_pd();
        for (; i + 4 <= n; i += 4) {
            __m256d a = _mm256_loadu_pd(&asks[i]);
            __m256d b = _mm256_loadu_pd(&bids[i]);
            acc = _mm256_add_pd(acc, _mm256_sub_pd(a, b));
        }
        double buf[4]; _mm256_storeu_pd(buf, acc);
        sum = buf[0] + buf[1] + buf[2] + buf[3];
#endif
        for (; i < n; ++i) sum += asks[i] - bids[i];
        return sum;
    }

    // Scalar VWAP
    double vwap() const {
        double pv = 0.0; uint64_t tv = 0;
        for (size_t i = 0; i < bids.size(); ++i) {
            double mid = (bids[i] + asks[i]) * 0.5;
            pv += mid * volumes[i]; tv += volumes[i];
        }
        return tv ? pv / tv : 0.0;
    }
};`,
    explanation:
      "SoA layout stores all bids contiguously, all asks contiguously, etc., so a SIMD spread calculation loads 4 asks and 4 bids in two 32-byte aligned loads — 4× the arithmetic throughput of interleaved AoS. For tick-level backtesting over millions of records, SoA reduces analytics runtime from minutes to seconds.",
  },
  {
    id: "cpp-20260714-b1-variadic-order-tuple",
    language: "cpp",
    title: "Variadic Template Order Message with Compile-Time Field Access",
    tag: "meta-programming",
    code: `#include <tuple>
#include <cstdint>
#include <iostream>

// Encode order fields as a heterogeneous tuple with named access.
// No heap, no virtual dispatch. Field layout determined at compile time.

// Tag types for named access
struct SymTag    {}; struct SideTag   {}; struct QtyTag    {};
struct PriceTag  {}; struct OrderIdTag{};

template<typename... Fields>
struct OrderMsg : std::tuple<Fields...> {
    using Base = std::tuple<Fields...>;
    using Base::Base;

    template<typename Tag, typename T>
    struct Field { Tag tag; T value; };
};

// Convenience wrapper
using LimitOrder = std::tuple<
    uint64_t,   // order_id
    uint32_t,   // symbol_id
    bool,       // is_buy
    uint32_t,   // quantity
    double      // limit_price
>;

// Named accessors
inline uint64_t order_id   (const LimitOrder& o) { return std::get<0>(o); }
inline uint32_t symbol_id  (const LimitOrder& o) { return std::get<1>(o); }
inline bool     is_buy     (const LimitOrder& o) { return std::get<2>(o); }
inline uint32_t quantity   (const LimitOrder& o) { return std::get<3>(o); }
inline double   limit_price(const LimitOrder& o) { return std::get<4>(o); }

// Generic order processor — works with any tuple-like order type
template<typename OrderT>
void log_order(const OrderT& o) {
    std::cout << "OrderID=" << order_id(o)
              << " sym="    << symbol_id(o)
              << " side="   << (is_buy(o) ? "BUY" : "SELL")
              << " qty="    << quantity(o)
              << " px="     << limit_price(o) << "\n";
}

int main() {
    LimitOrder o{42001ULL, 7u, true, 100u, 149.875};
    log_order(o);
}`,
    explanation:
      "Using std::tuple to represent order messages gives compile-time layout (no padding surprises) and zero-overhead field access via std::get. Named accessor functions restore readability without vtables or RTTI. The approach is preferred in HFT over macro-heavy struct definitions because the compiler can fully optimize the accessors away.",
  },
  {
    id: "cpp-20260714-b1-wait-free-seqnum",
    language: "cpp",
    title: "Wait-Free Order Sequence Number with Monotonic Atomic",
    tag: "low-latency",
    code: `#include <atomic>
#include <cstdint>
#include <thread>
#include <vector>
#include <iostream>

// Wait-free global sequence number: every thread gets a unique, monotonically
// increasing order ID in O(1) using a single fetch_add with relaxed ordering.
// Relaxed is sufficient — we only need uniqueness, not a happens-before edge.
class SeqNumGen {
    alignas(64) std::atomic<uint64_t> counter_{1}; // starts at 1; 0 = invalid

public:
    // Lock-free AND wait-free: fetch_add never spins
    uint64_t next() noexcept {
        return counter_.fetch_add(1, std::memory_order_relaxed);
    }

    uint64_t peek() const noexcept {
        return counter_.load(std::memory_order_relaxed);
    }
};

static SeqNumGen g_seq;

// Stress test: 8 threads each grab 100k seq nums; no duplicates
int main() {
    constexpr int THREADS = 8, PER = 100'000;
    std::vector<std::vector<uint64_t>> results(THREADS, std::vector<uint64_t>(PER));

    std::vector<std::thread> workers;
    workers.reserve(THREADS);
    for (int t = 0; t < THREADS; ++t) {
        workers.emplace_back([t, &results]{
            for (int i = 0; i < PER; ++i)
                results[t][i] = g_seq.next();
        });
    }
    for (auto& w : workers) w.join();

    // Verify all sequence numbers are unique
    std::vector<uint64_t> all;
    all.reserve(THREADS * PER);
    for (auto& r : results) all.insert(all.end(), r.begin(), r.end());
    std::sort(all.begin(), all.end());
    bool unique = std::adjacent_find(all.begin(), all.end()) == all.end();
    std::cout << "All unique: " << std::boolalpha << unique
              << "  range: [" << all.front() << ", " << all.back() << "]\n";
}`,
    explanation:
      "fetch_add is wait-free on all major CPU architectures (x86 LOCK XADD, ARM LDADD) — every thread completes in a bounded number of hardware cycles regardless of contention. Relaxed ordering avoids a full memory fence; the sequence number itself is the only shared state, so no synchronization edge is needed between callers.",
  },
  {
    id: "cpp-20260714-b1-consteval-bs-table",
    language: "cpp",
    title: "consteval Compile-Time Black-Scholes Coefficient Table",
    tag: "meta-programming",
    code: `#include <array>
#include <cmath>
#include <cstddef>

// consteval: the function MUST be evaluated at compile time.
// Build a lookup table of d1 values over a grid of moneyness ratios
// so the hot path does a table lookup + interpolation instead of log/sqrt.

consteval double ce_sqrt(double x) {
    // Newton-Raphson sqrt, compile-time only
    double g = x / 2.0;
    for (int i = 0; i < 64; ++i) g = (g + x / g) / 2.0;
    return g;
}
consteval double ce_log(double x) {
    // Using identity: log(x) = 2 * atanh((x-1)/(x+1)), expanded as series
    double y = (x - 1.0) / (x + 1.0), r = 0.0, yk = y;
    for (int k = 0; k < 60; k += 2) {
        r  += yk / (k + 1);
        yk *= y * y;
    }
    return 2.0 * r;
}

constexpr size_t N   = 101;
constexpr double K   = 100.0, r = 0.05, sigma = 0.2, T = 1.0;
constexpr double sqT = ce_sqrt(T);

// Build the d1 table: S from 50 to 150 in steps of 1
consteval auto make_d1_table() {
    std::array<double, N> tbl{};
    for (size_t i = 0; i < N; ++i) {
        double S  = 50.0 + static_cast<double>(i);
        tbl[i] = (ce_log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    }
    return tbl;
}

constexpr auto D1_TABLE = make_d1_table();

// Runtime: index + lerp, no transcendentals
inline double fast_d1(double S) {
    double idx = S - 50.0;
    if (idx <= 0.0) return D1_TABLE[0];
    if (idx >= N - 1) return D1_TABLE[N - 1];
    size_t lo = static_cast<size_t>(idx);
    double frac = idx - lo;
    return D1_TABLE[lo] * (1.0 - frac) + D1_TABLE[lo + 1] * frac;
}`,
    explanation:
      "consteval guarantees zero runtime cost: the d1 table is baked into the binary's read-only data section. The hot path becomes a bounds check, an index computation, and a lerp — no log or sqrt at runtime. For options engines re-pricing thousands of strikes per tick, eliminating transcendentals from the inner loop can cut latency by 30–50%.",
  },
  {
    id: "cpp-20260714-b1-sse4-price-scan",
    language: "cpp",
    title: "SSE4.2 Price Scan: Best Bid in Price Level Array",
    tag: "low-latency",
    code: `#include <immintrin.h>
#include <cstdint>
#include <cstddef>
#include <limits>
#include <iostream>

// Scan an array of int32 price levels (tick-encoded) for the maximum
// (best bid) using SSE4.2 _mm_max_epi32. Processes 4 int32s per cycle.
// Scalar fallback for non-SSE paths.

int32_t best_bid_sse(const int32_t* prices, size_t n) {
    int32_t best = std::numeric_limits<int32_t>::min();
    size_t  i    = 0;

#ifdef __SSE4_1__
    __m128i vbest = _mm_set1_epi32(std::numeric_limits<int32_t>::min());
    for (; i + 4 <= n; i += 4) {
        __m128i v = _mm_loadu_si128(reinterpret_cast<const __m128i*>(prices + i));
        vbest = _mm_max_epi32(vbest, v);
    }
    // Horizontal max of vbest
    __m128i s1 = _mm_shuffle_epi32(vbest, 0xB1); // swap pairs
    vbest = _mm_max_epi32(vbest, s1);
    __m128i s2 = _mm_shuffle_epi32(vbest, 0x4E); // swap 64-bit halves
    vbest = _mm_max_epi32(vbest, s2);
    best  = _mm_extract_epi32(vbest, 0);
#endif

    for (; i < n; ++i) best = std::max(best, prices[i]);
    return best;
}

// VWAP using int32 quantities and int64 price*qty accumulation
int64_t vwap_ticks(const int32_t* prices, const int32_t* qtys, size_t n) {
    int64_t pv = 0; int64_t tv = 0;
    for (size_t i = 0; i < n; ++i) {
        pv += static_cast<int64_t>(prices[i]) * qtys[i];
        tv += qtys[i];
    }
    return tv ? pv / tv : 0;
}

int main() {
    int32_t prices[] = {10025, 10027, 10022, 10030, 10028, 10019};
    std::cout << "Best bid: " << best_bid_sse(prices, 6) << "\n"; // 10030
}`,
    explanation:
      "SSE4.1 _mm_max_epi32 compares 4 signed 32-bit tick-encoded prices in one instruction. For an order book with 64 price levels, this finishes in 16 instructions vs 64 comparisons scalar — a 4× throughput win. Horizontal reduction with shuffle instructions extracts the scalar maximum without a branch loop.",
  },
  {
    id: "cpp-20260714-b1-custom-deque",
    language: "cpp",
    title: "Cache-Friendly Fixed-Capacity Deque for Order Queue",
    tag: "data-structures",
    code: `#include <array>
#include <cstddef>
#include <cassert>
#include <stdexcept>

// Ring-buffer deque: O(1) push_front, push_back, pop_front, pop_back.
// Fixed capacity avoids heap re-allocation mid-session.
// Used for per-price-level order queues in a price-time priority book.
template<typename T, size_t Cap>
class FixedDeque {
    static_assert((Cap & (Cap - 1)) == 0, "Cap must be power of 2");
    static constexpr size_t MASK = Cap - 1;

    std::array<T, Cap> buf_{};
    size_t head_ = 0, tail_ = 0; // [head_, tail_) half-open, modulo Cap

    size_t sz() const { return (tail_ - head_) & MASK; }

public:
    bool   empty()    const { return head_ == tail_; }
    bool   full()     const { return sz() == Cap - 1; }
    size_t size()     const { return sz(); }

    void push_back(const T& v) {
        assert(!full());
        buf_[tail_ & MASK] = v;
        tail_ = (tail_ + 1) & MASK;
    }

    void push_front(const T& v) {
        assert(!full());
        head_ = (head_ - 1) & MASK;
        buf_[head_] = v;
    }

    void pop_front() { assert(!empty()); head_ = (head_ + 1) & MASK; }
    void pop_back()  { assert(!empty()); tail_ = (tail_ - 1) & MASK; }

    T&       front()       { return buf_[head_]; }
    const T& front() const { return buf_[head_]; }
    T&       back()        { return buf_[(tail_ - 1) & MASK]; }
    const T& back()  const { return buf_[(tail_ - 1) & MASK]; }

    // Random access (order processing)
    T& operator[](size_t i) { return buf_[(head_ + i) & MASK]; }
};

struct Order { uint64_t id; uint32_t qty; };
static FixedDeque<Order, 256> level_queue;   // 256-order price level, no heap`,
    explanation:
      "A power-of-2 ring buffer implements all four deque operations with a single AND-mask modulo — no branch, no division. Fixed capacity means the backing array sits inline on the stack or in a pre-allocated pool, keeping it cache-resident for price levels that receive rapid order arrivals and cancellations.",
  },
  {
    id: "cpp-20260714-b1-token-bucket-throttle",
    language: "cpp",
    title: "Token Bucket Rate Limiter with std::chrono (Order Throttle)",
    tag: "design",
    code: `#include <chrono>
#include <cstdint>
#include <algorithm>
#include <iostream>

// Token bucket: replenish tokens at a steady rate; consume one per order.
// Burst capacity = bucket_max (absorbs short bursts without blocking).
// Exchange order-rate limits: e.g., 1000 orders/sec, burst 50.
class TokenBucket {
    using Clock    = std::chrono::steady_clock;
    using Duration = std::chrono::nanoseconds;

    double   rate_;          // tokens per nanosecond
    double   capacity_;      // max tokens
    double   tokens_;        // current balance
    Clock::time_point last_refill_;

    void refill(Clock::time_point now) {
        auto elapsed = std::chrono::duration_cast<Duration>(now - last_refill_).count();
        tokens_ = std::min(capacity_, tokens_ + rate_ * static_cast<double>(elapsed));
        last_refill_ = now;
    }

public:
    // rate_per_sec: sustained rate; burst: max burst size
    TokenBucket(double rate_per_sec, double burst)
        : rate_(rate_per_sec / 1e9)
        , capacity_(burst)
        , tokens_(burst)
        , last_refill_(Clock::now())
    {}

    // Returns true if the order is allowed (consuming 'cost' tokens)
    bool try_consume(double cost = 1.0) {
        refill(Clock::now());
        if (tokens_ < cost) return false;
        tokens_ -= cost;
        return true;
    }

    // Block until tokens available (for non-latency-critical paths)
    void consume_blocking(double cost = 1.0) {
        while (!try_consume(cost)) {
            // busy-wait or yield; production code uses nanosleep
            std::this_thread::yield();
        }
    }

    double available_tokens() const { return tokens_; }
};

int main() {
    TokenBucket tb(1000.0, 50.0);  // 1000 orders/sec, burst 50
    int sent = 0, rejected = 0;
    for (int i = 0; i < 100; ++i) {
        if (tb.try_consume()) ++sent;
        else                  ++rejected;
    }
    std::cout << "sent=" << sent << " rejected=" << rejected << "\n";
}`,
    explanation:
      "Token bucket throttling is preferred over leaky-bucket for HFT because it explicitly models burst capacity — an exchange's burst allowance can be fully consumed before the sustained rate kicks in. The refill step uses nanosecond precision from steady_clock, avoiding the accumulation errors of integer-based implementations.",
  },
  {
    id: "cpp-20260714-b1-exception-hierarchy",
    language: "cpp",
    title: "Quant Exception Hierarchy with Source Location",
    tag: "design",
    code: `#include <stdexcept>
#include <string>
#include <source_location>
#include <sstream>
#include <iostream>

// Typed exception hierarchy: catch ModelError for pricing failures,
// RiskError for risk-limit violations, etc. — without catching everything.
struct QuantError : std::runtime_error {
    explicit QuantError(const std::string& msg,
                        const std::source_location& loc = std::source_location::current())
        : std::runtime_error(format(msg, loc)) {}
private:
    static std::string format(const std::string& msg, const std::source_location& loc) {
        std::ostringstream oss;
        oss << loc.file_name() << ":" << loc.line() << " [" << loc.function_name() << "]: " << msg;
        return oss.str();
    }
};

struct ModelError  : QuantError { using QuantError::QuantError; };
struct RiskError   : QuantError { using QuantError::QuantError; };
struct DataError   : QuantError { using QuantError::QuantError; };
struct CalibError  : ModelError { using ModelError::ModelError; };

// Usage in a pricer
double price_option(double S, double K, double vol) {
    if (vol <= 0.0)
        throw CalibError("Non-positive implied vol: vol=" + std::to_string(vol));
    if (S <= 0.0)
        throw DataError("Non-positive spot price S=" + std::to_string(S));
    return 42.0; // placeholder
}

int main() {
    try {
        price_option(100.0, 100.0, -0.01);
    } catch (const CalibError& e) {
        std::cerr << "Calibration failure: " << e.what() << "\n";
    } catch (const ModelError& e) {
        std::cerr << "Model error: " << e.what() << "\n";
    } catch (const QuantError& e) {
        std::cerr << "Quant error: " << e.what() << "\n";
    }
}`,
    explanation:
      "std::source_location (C++20) automatically captures the throw site (file, line, function) without macros. A typed hierarchy lets risk-management code catch only RiskError while pricing code handles ModelError separately, preventing accidental swallowing of unrelated failures in the same try block.",
  },
  {
    id: "cpp-20260714-b1-rate-limiting-sliding",
    language: "cpp",
    title: "Sliding-Window Order Rate Counter (Circular Queue of Timestamps)",
    tag: "design",
    code: `#include <array>
#include <chrono>
#include <cstddef>
#include <cstdint>
#include <iostream>

// Count how many orders were sent in the last W nanoseconds.
// Uses a circular queue of timestamps; O(1) amortized per order.
// More accurate than token bucket for regulatory order-rate checks.
template<size_t Cap>
class SlidingWindowCounter {
    using ns_t = int64_t;
    static constexpr size_t MASK = Cap - 1;
    static_assert((Cap & MASK) == 0, "Cap must be power of 2");

    std::array<ns_t, Cap> ts_{};
    size_t head_ = 0, tail_ = 0;
    ns_t   window_ns_;

    ns_t now_ns() const {
        return std::chrono::duration_cast<std::chrono::nanoseconds>(
            std::chrono::steady_clock::now().time_since_epoch()).count();
    }

    void evict(ns_t cutoff) {
        while (head_ != tail_ && ts_[head_ & MASK] < cutoff)
            ++head_;
    }

public:
    explicit SlidingWindowCounter(double window_seconds)
        : window_ns_(static_cast<ns_t>(window_seconds * 1e9)) {}

    // Returns false if adding this order would exceed max_count
    bool try_add(size_t max_count) {
        ns_t t = now_ns();
        evict(t - window_ns_);
        if ((tail_ - head_) >= max_count) return false;
        ts_[tail_++ & MASK] = t;
        return true;
    }

    size_t count_in_window() {
        evict(now_ns() - window_ns_);
        return tail_ - head_;
    }
};

int main() {
    SlidingWindowCounter<1024> counter(1.0); // 1-second window
    int sent = 0;
    for (int i = 0; i < 1100; ++i) {
        if (counter.try_add(1000)) ++sent;
    }
    std::cout << "Accepted: " << sent << " / 1100\n"; // ~1000
}`,
    explanation:
      "The circular timestamp queue maintains exactly the last W seconds of order events: the eviction loop advances the head past stale entries, so count_in_window() always reflects the true sliding count. This avoids the epoch-boundary spike of fixed-window counters, which FINRA and MiFID II rate-limit rules effectively require.",
  },
  {
    id: "cpp-20260714-b1-policy-risk-engine",
    language: "cpp",
    title: "Policy-Based Compile-Time Risk Engine (No Virtual Calls)",
    tag: "design",
    code: `#include <iostream>
#include <stdexcept>

// Policy-based design: inject risk-check, position-limit, and fee-model
// behaviors as template parameters so different desks share the same
// engine core with zero vtable overhead.

struct EquityRiskPolicy {
    static bool check_notional(double notional, double limit) {
        return notional < limit;
    }
    static double fee(double notional) { return notional * 0.0001; }
};

struct DerivativesRiskPolicy {
    static bool check_notional(double notional, double limit) {
        // Derivatives: notional can exceed book limit (delta-adjusted)
        return notional * 0.25 < limit; // simplistic delta assumption
    }
    static double fee(double notional) { return notional * 0.00025; }
};

struct NoOpFeePolicy {
    static bool check_notional(double, double) { return true; }
    static double fee(double) { return 0.0; }
};

template<typename RiskPolicy>
class OrderEngine {
    double limit_;
public:
    explicit OrderEngine(double limit) : limit_(limit) {}

    double submit(const char* sym, double notional) {
        if (!RiskPolicy::check_notional(notional, limit_))
            throw std::runtime_error(std::string("Risk limit breach: ") + sym);
        double fee = RiskPolicy::fee(notional);
        std::cout << "[" << sym << "] notional=" << notional
                  << " fee=" << fee << "\n";
        return fee;
    }
};

int main() {
    OrderEngine<EquityRiskPolicy>      eq_engine(1'000'000);
    OrderEngine<DerivativesRiskPolicy> dv_engine(1'000'000);

    eq_engine.submit("AAPL", 500'000);
    dv_engine.submit("SPX-PUT", 3'500'000); // 3.5M * 0.25 = 875k < 1M OK
}`,
    explanation:
      "Policy-based design moves the risk-check and fee-model decision to template instantiation time, so the compiler inlines each policy's static methods. Different desks (equities, derivatives, internalization) get distinct risk semantics with no shared vtable lookup — the same binary has multiple zero-overhead engine specializations.",
  },
  {
    id: "cpp-20260714-b1-simd-pnl",
    language: "cpp",
    title: "AVX2 Horizontal Portfolio P&L from SoA Position Array",
    tag: "low-latency",
    code: `#include <immintrin.h>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <numeric>
#include <vector>

// Compute total P&L = sum(position[i] * (price[i] - cost_basis[i]))
// using AVX2 256-bit double-precision FMA instructions.
// Processes 4 instruments per cycle instead of 1.
double portfolio_pnl_avx2(const double* __restrict__ pos,
                           const double* __restrict__ px,
                           const double* __restrict__ basis,
                           size_t n) {
    double total = 0.0;
    size_t i = 0;
#ifdef __AVX2__
    __m256d acc = _mm256_setzero_pd();
    for (; i + 4 <= n; i += 4) {
        __m256d p  = _mm256_loadu_pd(pos   + i);
        __m256d pr = _mm256_loadu_pd(px    + i);
        __m256d b  = _mm256_loadu_pd(basis + i);
        // FMA: acc += pos * (price - basis)
        acc = _mm256_fmadd_pd(p, _mm256_sub_pd(pr, b), acc);
    }
    // Horizontal sum of acc
    __m128d lo  = _mm256_castpd256_pd128(acc);
    __m128d hi  = _mm256_extractf128_pd(acc, 1);
    __m128d sum = _mm_add_pd(lo, hi);
    sum = _mm_hadd_pd(sum, sum);
    total = _mm_cvtsd_f64(sum);
#endif
    for (; i < n; ++i) total += pos[i] * (px[i] - basis[i]);
    return total;
}

int main() {
    const size_t N = 1024;
    std::vector<double> pos(N, 100.0), px(N, 105.0), basis(N, 100.0);
    double pnl = portfolio_pnl_avx2(pos.data(), px.data(), basis.data(), N);
    std::cout << "Portfolio P&L: " << pnl << "\n"; // 100 * 5 * 1024 = 512000
}`,
    explanation:
      "_mm256_fmadd_pd fuses the multiply and add into a single FP operation with one rounding step, improving accuracy and throughput. For a 1,000-instrument portfolio, AVX2 reduces the P&L calculation from ~1,000 scalar FMAs to ~250 SIMD iterations — completing in under 1 μs even without cache prefetching.",
  },
  {
    id: "cpp-20260714-b1-fixed-point-pnl",
    language: "cpp",
    title: "Fixed-Point P&L Accumulator (Integer Tick Arithmetic)",
    tag: "numerics",
    code: `#include <cstdint>
#include <cassert>
#include <iostream>

// Store price in integer ticks to avoid floating-point rounding.
// 1 tick = 0.01 USD for equities; 0.25 for futures.
// P&L = (exit_ticks - entry_ticks) * tick_size * quantity
// All arithmetic stays integer; only final reporting converts to double.
static constexpr int64_t TICK_DENOM = 100; // 1 tick = 0.01 USD

struct TickPrice {
    int64_t ticks; // price in integer ticks

    static TickPrice from_double(double px, int64_t denom = TICK_DENOM) {
        return {static_cast<int64_t>(px * denom + 0.5)};
    }
    double to_double() const { return static_cast<double>(ticks) / TICK_DENOM; }

    TickPrice operator-(const TickPrice& o) const { return {ticks - o.ticks}; }
    bool operator<(const TickPrice& o) const { return ticks < o.ticks; }
};

struct Trade {
    int64_t   qty;          // signed: +buy, -sell
    TickPrice entry, exit_;
};

int64_t pnl_ticks(const Trade& t) {
    return t.qty * (t.exit_.ticks - t.entry.ticks);
}

double pnl_dollars(const Trade& t) {
    return static_cast<double>(pnl_ticks(t)) / TICK_DENOM;
}

int main() {
    Trade t{100, TickPrice::from_double(149.99), TickPrice::from_double(150.37)};
    std::cout << "P&L ticks: "   << pnl_ticks(t)   << "\n"; // 38 ticks
    std::cout << "P&L dollars: " << pnl_dollars(t) << "\n"; // $0.38 * 100 = $38
    assert(pnl_ticks(t) == 38 * 100); // 0.38 / 0.01 = 38 ticks * 100 qty = 3800
}`,
    explanation:
      "Integer tick arithmetic eliminates the cumulative floating-point rounding errors that accumulate when summing thousands of floating-point P&L values. At the end of a trading session with 10,000 trades, integer arithmetic guarantees exact cent-level reconciliation with the clearing house — critical for automated P&L reporting.",
  },
  {
    id: "cpp-20260714-b1-order-book-price-map",
    language: "cpp",
    title: "Price-Level Order Book with std::map and Volume Index",
    tag: "data-structures",
    code: `#include <map>
#include <deque>
#include <cstdint>
#include <iostream>

struct Order { uint64_t id; uint32_t qty; };

// Bid side: descending by price. Ask side: ascending.
// map<int64_t, deque<Order>, std::greater<>> for bids,
// map<int64_t, deque<Order>>                 for asks.
// volume_at_level for quick depth queries.
class OrderBook {
    using BidMap = std::map<int64_t, std::deque<Order>, std::greater<int64_t>>;
    using AskMap = std::map<int64_t, std::deque<Order>>;

    BidMap bids_;
    AskMap asks_;
    uint64_t next_id_ = 1;

public:
    uint64_t add_bid(int64_t price_ticks, uint32_t qty) {
        uint64_t id = next_id_++;
        bids_[price_ticks].push_back({id, qty});
        return id;
    }
    uint64_t add_ask(int64_t price_ticks, uint32_t qty) {
        uint64_t id = next_id_++;
        asks_[price_ticks].push_back({id, qty});
        return id;
    }

    int64_t best_bid() const { return bids_.empty() ? 0 : bids_.begin()->first; }
    int64_t best_ask() const { return asks_.empty() ? 0 : asks_.begin()->first; }
    int64_t spread()   const { return best_ask() - best_bid(); }

    uint64_t volume_at_bid(int64_t px) const {
        auto it = bids_.find(px);
        if (it == bids_.end()) return 0;
        uint64_t v = 0;
        for (const auto& o : it->second) v += o.qty;
        return v;
    }

    void print_top5() const {
        std::cout << "=== ASK ===\n";
        int cnt = 0;
        for (const auto& [px, q] : asks_) {
            uint64_t v = 0; for (const auto& o : q) v += o.qty;
            std::cout << "  " << px << " x " << v << "\n";
            if (++cnt == 5) break;
        }
        std::cout << "--- BID ---\n";
        cnt = 0;
        for (const auto& [px, q] : bids_) {
            uint64_t v = 0; for (const auto& o : q) v += o.qty;
            std::cout << "  " << px << " x " << v << "\n";
            if (++cnt == 5) break;
        }
    }
};

int main() {
    OrderBook book;
    book.add_bid(10000, 100); book.add_bid(9999, 200);
    book.add_ask(10001, 150); book.add_ask(10002, 300);
    std::cout << "Spread: " << book.spread() << " ticks\n";
    book.print_top5();
}`,
    explanation:
      "Using std::map with std::greater for the bid side gives O(log N) insert/erase and O(1) best-bid access via begin(). The deque at each level preserves FIFO price-time priority, which is required by most exchange matching algorithms. For production books with thousands of levels, a hash-array hybrid replaces std::map for O(1) individual-level access.",
  },
  {
    id: "cpp-20260714-b1-greek-agg-fold",
    language: "cpp",
    title: "Weighted Greeks Aggregation via C++17 Fold Expression",
    tag: "meta-programming",
    code: `#include <tuple>
#include <iostream>
#include <cmath>

// Aggregate Greeks across a portfolio of N legs at compile time.
// Each leg has (weight, delta, gamma, vega, theta).
// Fold expression sums all legs without a runtime loop.
struct Greeks { double delta, gamma, vega, theta; };

// Scalar-multiply a Greeks struct
inline Greeks operator*(double w, const Greeks& g) {
    return {w*g.delta, w*g.gamma, w*g.vega, w*g.theta};
}
inline Greeks operator+(const Greeks& a, const Greeks& b) {
    return {a.delta+b.delta, a.gamma+b.gamma, a.vega+b.vega, a.theta+b.theta};
}

// Weighted leg: (weight, Greeks)
template<typename... Legs>
Greeks aggregate(Legs... legs) {
    // Each leg is a pair<double, Greeks>; fold over +
    return (... + (legs.first * legs.second));
}

int main() {
    Greeks leg1{0.65, 0.03, 0.12, -0.04};
    Greeks leg2{-0.40, 0.02, 0.08, -0.02};
    Greeks leg3{0.20, 0.01, 0.05, -0.01};

    // Portfolio: 2 lots of leg1, 3 lots of leg2, 1 lot of leg3
    using L = std::pair<double, Greeks>;
    auto total = aggregate(L{2.0, leg1}, L{3.0, leg2}, L{1.0, leg3});

    std::cout << "Portfolio Delta: " << total.delta << "\n"; // 2*0.65 - 3*0.40 + 0.20 = 0.30
    std::cout << "Portfolio Vega:  " << total.vega  << "\n";
}`,
    explanation:
      "The unary fold `(... + expr)` expands to (leg1 + leg2 + leg3) at compile time — the loop over legs is fully unrolled and the entire computation inlined. For option books with a fixed set of strategy legs (straddle + delta hedge + vega hedge), this avoids a runtime loop over a std::vector and any associated branch mispredictions.",
  },
];
