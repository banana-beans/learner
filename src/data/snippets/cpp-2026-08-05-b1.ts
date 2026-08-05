import type { Snippet } from "./types";

export const cppSnippets20260805B1: Snippet[] = [
  {
    id: "cpp-20260805-b1-crtp-pricing",
    language: "cpp",
    title: "CRTP for Static Polymorphic Pricing Engine",
    tag: "modern-cpp",
    code: `#include <cmath>
#include <iostream>

// Curiously Recurring Template Pattern (CRTP) provides compile-time
// polymorphism — zero virtual dispatch overhead, fully inlinable.
template <typename Derived>
class PricingEngine {
public:
    double price(double S, double K, double r, double T) const {
        // Forward to derived implementation via static cast
        return static_cast<const Derived*>(this)->price_impl(S, K, r, T);
    }
    double delta(double S, double K, double r, double T, double h = 1e-5) const {
        return (price(S + h, K, r, T) - price(S - h, K, r, T)) / (2.0 * h);
    }
};

class BSCallEngine : public PricingEngine<BSCallEngine> {
public:
    double sigma_;
    BSCallEngine(double sigma) : sigma_(sigma) {}

    double price_impl(double S, double K, double r, double T) const {
        double sqt = std::sqrt(T);
        double d1  = (std::log(S/K) + (r + 0.5*sigma_*sigma_)*T) / (sigma_*sqt);
        double d2  = d1 - sigma_*sqt;
        // N(x) via erfc
        auto ncdf = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
        return S*ncdf(d1) - K*std::exp(-r*T)*ncdf(d2);
    }
};

class BachelierEngine : public PricingEngine<BachelierEngine> {
public:
    double sigma_n_;  // normal (absolute) vol
    BachelierEngine(double sigma_n) : sigma_n_(sigma_n) {}

    double price_impl(double S, double K, double r, double T) const {
        auto ncdf = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
        auto npdf = [](double x){ return std::exp(-0.5*x*x) / std::sqrt(2*M_PI); };
        double F = S * std::exp(r * T);
        double d = (F - K) / (sigma_n_ * std::sqrt(T));
        return std::exp(-r*T) * ((F - K)*ncdf(d) + sigma_n_*std::sqrt(T)*npdf(d));
    }
};

// Generic pricer — same call for both engines, zero vtable
template <typename E>
void print_greeks(const PricingEngine<E>& eng) {
    double p = eng.price(100, 100, 0.05, 1.0);
    double d = eng.delta(100, 100, 0.05, 1.0);
    std::cout << "price=" << p << "  delta=" << d << "\\n";
}

int main() {
    BSCallEngine   bs(0.20);
    BachelierEngine bach(4.0);
    print_greeks(bs);
    print_greeks(bach);
}`,
    explanation: "CRTP achieves static polymorphism: price_impl is resolved at compile time via static_cast<Derived*>(this), not a vtable lookup. The shared delta() implementation in the base class calls the derived price() without virtual dispatch, so the compiler can inline both the finite-difference loop and the derived pricing formula together."
  },
  {
    id: "cpp-20260805-b1-mpmc-queue",
    language: "cpp",
    title: "MPMC Lock-Free Queue via CAS for Order Gateway",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Multi-Producer Multi-Consumer bounded queue.
// Each slot has a sequence number; CAS on sequence ensures only one
// thread wins each slot.
template <typename T, std::size_t N>
class MPMCQueue {
    static_assert((N & (N-1)) == 0, "N must be a power of 2");

    struct Slot {
        alignas(64) std::atomic<std::size_t> seq;
        T data;
    };

    alignas(64) std::atomic<std::size_t> head_{0};
    alignas(64) std::atomic<std::size_t> tail_{0};
    std::array<Slot, N> slots_;

public:
    MPMCQueue() {
        for (std::size_t i = 0; i < N; ++i)
            slots_[i].seq.store(i, std::memory_order_relaxed);
    }

    bool push(const T& item) {
        std::size_t pos = tail_.load(std::memory_order_relaxed);
        for (;;) {
            auto& slot = slots_[pos & (N-1)];
            std::size_t seq = slot.seq.load(std::memory_order_acquire);
            std::ptrdiff_t diff = (std::ptrdiff_t)seq - (std::ptrdiff_t)pos;
            if (diff == 0) {
                if (tail_.compare_exchange_weak(pos, pos+1, std::memory_order_relaxed))
                {
                    slot.data = item;
                    slot.seq.store(pos+1, std::memory_order_release);
                    return true;
                }
            } else if (diff < 0) {
                return false;  // full
            } else {
                pos = tail_.load(std::memory_order_relaxed);
            }
        }
    }

    std::optional<T> pop() {
        std::size_t pos = head_.load(std::memory_order_relaxed);
        for (;;) {
            auto& slot = slots_[pos & (N-1)];
            std::size_t seq = slot.seq.load(std::memory_order_acquire);
            std::ptrdiff_t diff = (std::ptrdiff_t)seq - (std::ptrdiff_t)(pos+1);
            if (diff == 0) {
                if (head_.compare_exchange_weak(pos, pos+1, std::memory_order_relaxed))
                {
                    T item = slot.data;
                    slot.seq.store(pos + N, std::memory_order_release);
                    return item;
                }
            } else if (diff < 0) {
                return std::nullopt;  // empty
            } else {
                pos = head_.load(std::memory_order_relaxed);
            }
        }
    }
};

// Usage: MPMCQueue<OrderMsg, 1024> gateway_q;
// Multiple feed-handler threads: gateway_q.push(msg);
// Multiple strategy threads:     auto m = gateway_q.pop();`,
    explanation: "Each slot carries a sequence counter that steps through multiples of N. A producer CAS-claims the next tail slot if seq==pos (exact match means slot is clean and ready). A consumer claims a head slot if seq==pos+1 (producer has written and advanced seq). The sequence discipline ensures no ABA problem without using tagged pointers."
  },
  {
    id: "cpp-20260805-b1-pmr-allocator",
    language: "cpp",
    title: "PMR Polymorphic Memory Resource for Order Batches",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <array>
#include <string>
#include <cstddef>

// std::pmr allows swapping allocators at runtime without changing
// container types — useful for profiling vs production paths.

// Stack-backed monotonic resource: fast bump-pointer with fallback.
template <std::size_t BufSize = 65536>
class StackArena {
    std::array<std::byte, BufSize> buf_;
    std::pmr::monotonic_buffer_resource mbr_{buf_.data(), BufSize,
        std::pmr::null_memory_resource()};  // no heap fallback — fail on overflow
public:
    std::pmr::memory_resource* resource() { return &mbr_; }
};

struct Order {
    int    id;
    double price;
    int    qty;
    std::pmr::string symbol;  // PMR-aware string — lives in the arena

    Order(int i, double p, int q, std::string_view sym,
          std::pmr::memory_resource* mr)
        : id(i), price(p), qty(q), symbol(sym, mr) {}
};

// Process a batch of orders without hitting the heap.
void process_batch(const std::vector<std::pair<double,int>>& input) {
    StackArena<65536> arena;
    auto* mr = arena.resource();

    std::pmr::vector<Order> orders(mr);
    orders.reserve(input.size());

    for (int i = 0; i < (int)input.size(); ++i) {
        orders.emplace_back(i, input[i].first, input[i].second, "AAPL", mr);
    }

    // All Order objects and their symbol strings live on the stack arena.
    // At end-of-scope: arena destructs, bumps cursor to zero — O(1) bulk free.
    double total_notional = 0.0;
    for (const auto& o : orders) total_notional += o.price * o.qty;
}`,
    explanation: "std::pmr containers take a memory_resource pointer, separating allocation policy from container type. monotonic_buffer_resource wraps a user-supplied buffer and bump-allocates from it — ideal for order batches where all objects share a lifetime. Passing null_memory_resource() as the fallback converts overflow into an immediate exception rather than silent heap spill."
  },
  {
    id: "cpp-20260805-b1-custom-hash-symbol",
    language: "cpp",
    title: "Compile-Time FNV-1a Hash for Zero-Cost Symbol Lookup",
    tag: "market-data",
    code: `#include <cstdint>
#include <string_view>
#include <unordered_map>
#include <functional>

// FNV-1a hash: fast, good distribution for short strings like ticker symbols.
// Constexpr version enables compile-time symbol constant folding.
constexpr uint64_t FNV_OFFSET = 14695981039346656037ULL;
constexpr uint64_t FNV_PRIME  = 1099511628211ULL;

constexpr uint64_t fnv1a(std::string_view s) noexcept {
    uint64_t h = FNV_OFFSET;
    for (unsigned char c : s)
        h = (h ^ c) * FNV_PRIME;
    return h;
}

// Heterogeneous lookup: avoid constructing std::string for each lookup.
struct SymbolHash {
    using is_transparent = void;  // enables heterogeneous find()

    std::size_t operator()(std::string_view sv) const noexcept {
        return fnv1a(sv);
    }
    std::size_t operator()(const std::string& s) const noexcept {
        return fnv1a(s);
    }
};

struct SymbolEqual {
    using is_transparent = void;
    bool operator()(std::string_view a, std::string_view b) const noexcept {
        return a == b;
    }
    bool operator()(const std::string& a, std::string_view b) const noexcept {
        return a == b;
    }
};

using SymbolTable = std::unordered_map<std::string, double,
                                        SymbolHash, SymbolEqual>;

// Usage
SymbolTable prices;
prices["AAPL"] = 192.35;
prices["MSFT"] = 415.20;

// Lookup with string_view — no heap allocation
auto find_price(const SymbolTable& t, std::string_view sym) {
    return t.find(sym);  // heterogeneous find: no std::string conversion
}

// Compile-time switch on symbol hash (e.g. for FIX tag dispatch)
constexpr uint64_t HASH_AAPL = fnv1a("AAPL");
constexpr uint64_t HASH_MSFT = fnv1a("MSFT");`,
    explanation: "The is_transparent tag on the hash and equality types enables heterogeneous unordered_map lookup: find() accepts string_view directly without constructing a temporary std::string. FNV-1a compiles to ~3 multiplies and XORs per character with excellent avalanche for typical 4-8 character ticker symbols. Compile-time constants like HASH_AAPL enable switch statements on symbol hashes."
  },
  {
    id: "cpp-20260805-b1-branchless-side",
    language: "cpp",
    title: "Branchless Order Side Multiplier via Conditional Move",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cstring>

// In a matching engine hot path, branch on 'B'/'S' for position sign
// can cause mispredictions when buy/sell arrival is random.
// Branchless alternative: use arithmetic on the ASCII value.

// Approach 1: arithmetic — 'B'=66, 'S'=83
// side_multiplier('B') == +1, side_multiplier('S') == -1
inline constexpr int side_multiplier_arith(char side) noexcept {
    // 'B'(66) -> (66>>6) & 1 = 1; 'S'(83) -> (83>>6) & 1 = 1
    // Alternative: map via bit trick
    // 'B' = 0x42, 'S' = 0x53; bit 4 differs:
    // 'B': bit4=0 -> +1; 'S': bit4=1 -> -1
    int b = (side >> 4) & 1;  // 0 for 'B', 1 for 'S'
    return 1 - 2 * b;          // 0->1, 1->-1
}

// Approach 2: branchless via ternary (generates CMOV on x86)
inline int side_multiplier_cmov(char side) noexcept {
    return side == 'B' ? 1 : -1;  // compiler emits cmovne with -O2
}

// Use case: compute signed P&L update from fill
inline double compute_position_delta(char side, int qty, double price) noexcept {
    int sign = side_multiplier_arith(side);
    return sign * qty * price;
}

// Test
static_assert(side_multiplier_arith('B') == +1);
static_assert(side_multiplier_arith('S') == -1);

// Batch position update (no branch in loop body)
double portfolio_pnl(const char* sides, const int* qtys,
                     const double* prices, int n) {
    double pnl = 0.0;
    for (int i = 0; i < n; ++i)
        pnl += compute_position_delta(sides[i], qtys[i], prices[i]);
    return pnl;
}`,
    explanation: "Branch predictors fail on alternating buy/sell sequences, costing ~15 cycles per misprediction. The bit trick ((side >> 4) & 1) exploits that 'B'=0x42 has bit 4 clear while 'S'=0x53 has it set, mapping each to 0/1 without a comparison. The CMOV variant compiles to a conditional-move instruction that avoids the branch entirely by evaluating both paths speculatively."
  },
  {
    id: "cpp-20260805-b1-tls-cache",
    language: "cpp",
    title: "Thread-Local Storage for Per-Thread Rate Calculator Cache",
    tag: "low-latency",
    code: `#include <thread>
#include <cmath>
#include <array>
#include <cstddef>
#include <functional>

// Thread-local caches eliminate cache-line contention between threads.
// Each thread has its own copy: no synchronisation, no false sharing.
struct RateCache {
    static constexpr std::size_t CAP = 256;
    struct Entry { double input; double result; bool valid = false; };
    std::array<Entry, CAP> slots{};
    uint64_t hits   = 0;
    uint64_t misses = 0;

    double get_or_compute(double x, std::function<double(double)> fn) {
        std::size_t idx = std::hash<double>{}(x) & (CAP - 1);
        auto& e = slots[idx];
        if (e.valid && e.input == x) { ++hits; return e.result; }
        ++misses;
        e = {x, fn(x), true};
        return e.result;
    }
};

// Each worker thread owns a private RateCache — no sharing, no locks.
thread_local RateCache tl_cache;

// Compute discount factor; cached per thread for repeated tenors
double get_discount_factor(double r, double T) {
    double key = r * 1e6 + T;  // simple key combining r and T
    return tl_cache.get_or_compute(key, [r, T](double) {
        return std::exp(-r * T);
    });
}

// Example: multiple threads call get_discount_factor() concurrently
// without any mutex — each sees its own tl_cache.
void worker(double r, int n) {
    double sum = 0;
    for (int i = 1; i <= n; ++i)
        sum += get_discount_factor(r, i * 0.25);
    // tl_cache.hits and misses are per-thread — no contention
}`,
    explanation: "thread_local creates one instance per thread, initialised on first use — each thread's cache is private and cache-line isolated. This is the standard pattern for per-thread worker state in risk engines where many threads compute discount factors over a shared rate grid: the cache hit rate is high within one thread's batch, and there is zero synchronisation overhead between threads."
  },
  {
    id: "cpp-20260805-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive Doubly-Linked List for O(1) Order Cancel",
    tag: "containers",
    code: `#include <cstddef>
#include <cassert>

// Intrusive list: nodes embed next/prev pointers directly.
// External order objects can be unlinked in O(1) without searching.
struct ListHook {
    ListHook* prev = nullptr;
    ListHook* next = nullptr;
};

// Generic intrusive doubly-linked list (sentinel header pattern)
struct IntrusiveList {
    ListHook sentinel;  // sentinel.next = head, sentinel.prev = tail

    IntrusiveList() {
        sentinel.next = &sentinel;
        sentinel.prev = &sentinel;
    }

    bool empty() const { return sentinel.next == &sentinel; }

    void push_back(ListHook* n) {
        n->prev       = sentinel.prev;
        n->next       = &sentinel;
        sentinel.prev->next = n;
        sentinel.prev       = n;
    }

    void push_front(ListHook* n) {
        n->next       = sentinel.next;
        n->prev       = &sentinel;
        sentinel.next->prev = n;
        sentinel.next       = n;
    }

    // O(1) unlink: only requires the node itself (no list reference needed)
    static void unlink(ListHook* n) {
        n->prev->next = n->next;
        n->next->prev = n->prev;
        n->prev = n->next = nullptr;
    }

    ListHook* front() { return empty() ? nullptr : sentinel.next; }
    ListHook* back()  { return empty() ? nullptr : sentinel.prev; }
};

// Order type that can live in the book list
struct Order : ListHook {
    int    id;
    double price;
    int    qty;
};

// Macro to recover the containing struct from a ListHook pointer
#define CONTAINER_OF(ptr, type, member) \
    reinterpret_cast<type*>(reinterpret_cast<char*>(ptr) - offsetof(type, ListHook))

// Usage: adding and cancelling an order in O(1)
// IntrusiveList bid_list;
// Order o{.id=1, .price=100.5, .qty=500};
// bid_list.push_back(&o);
// ...
// IntrusiveList::unlink(&o);  // O(1) cancel, no search`,
    explanation: "Intrusive lists embed link pointers inside the payload type, enabling O(1) unlink given only the node pointer — the matching engine stores the pointer when the order is placed, then unlinks in O(1) on cancel without searching the level's queue. Non-intrusive std::list containers require the iterator to unlink, which is harder to store alongside the order."
  },
  {
    id: "cpp-20260805-b1-black-caps",
    language: "cpp",
    title: "Black's Model for Interest Rate Cap Pricing",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <numeric>

// A cap is a strip of caplets. Each caplet pays max(L(T_i) - K, 0) * delta,
// where L is the forward LIBOR for the period [T_i, T_i + delta].
// Under Black's model (lognormal LIBOR): caplet price = delta * P(0,T+delta) * Black(F, K, sigma, T)

struct CapletResult { double price; double delta_sens; double vega; };

double ncdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }
double npdf(double x) { return std::exp(-0.5*x*x) / std::sqrt(2*M_PI); }

CapletResult black_caplet(double F,     // forward LIBOR rate
                           double K,     // strike rate
                           double sigma, // LIBOR lognormal vol
                           double T,     // option expiry (caplet reset date)
                           double delta, // accrual period (e.g., 0.25 for 3m)
                           double P)     // discount factor P(0, T + delta)
{
    if (T <= 0 || sigma <= 0 || F <= 0) return {std::max(F-K, 0.0)*delta*P, 0, 0};

    double sqt = std::sqrt(T);
    double d1  = (std::log(F/K) + 0.5*sigma*sigma*T) / (sigma*sqt);
    double d2  = d1 - sigma*sqt;

    double caplet_price = delta * P * (F*ncdf(d1) - K*ncdf(d2));
    double delta_sens   = delta * P * ncdf(d1);            // dV/dF
    double vega_        = delta * P * F * npdf(d1) * sqt;  // dV/d(sigma)

    return {caplet_price, delta_sens, vega_};
}

// Price a cap as sum of caplets
double price_cap(double F_term,          // flat forward curve level
                 double K, double sigma,
                 const std::vector<double>& tenors,   // [0.25, 0.50, ...]
                 double r) {
    double total = 0.0;
    for (std::size_t i = 0; i + 1 < tenors.size(); ++i) {
        double T     = tenors[i];
        double delta = tenors[i+1] - tenors[i];
        double P     = std::exp(-r * (T + delta));
        auto   res   = black_caplet(F_term, K, sigma, T, delta, P);
        total += res.price;
    }
    return total;
}

// Example: 2-year cap, quarterly resets, 5% flat forward, 5% strike, 20% vol
// std::vector<double> t = {0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 2.25};
// double cap = price_cap(0.05, 0.05, 0.20, t, 0.04);`,
    explanation: "Black's model assumes lognormal LIBOR forward rates; each caplet is an independent European call on the relevant forward rate, priced with the same Black-Scholes formula with F replacing S and K the cap strike. A floor is a strip of floorlets (puts), and cap-floor parity holds: Cap - Floor = Floating leg PV - Fixed leg PV. Swaption pricing uses the same Black formula on the forward swap rate."
  },
  {
    id: "cpp-20260805-b1-fx-forward",
    language: "cpp",
    title: "FX Forward Pricing via Covered Interest Rate Parity",
    tag: "numerics",
    code: `#include <cmath>
#include <stdexcept>

// Covered Interest Rate Parity (CIP):
//   F = S * exp((r_d - r_f) * T)
// F: forward FX rate (domestic per foreign)
// S: spot FX rate
// r_d, r_f: domestic and foreign continuously compounded risk-free rates
// T: maturity in years

struct FXForward {
    double spot;        // e.g. 1.10 USD/EUR
    double r_dom;       // domestic rate (USD)
    double r_for;       // foreign rate (EUR)
    double maturity;    // in years

    // Forward rate under CIP
    double forward_rate() const {
        return spot * std::exp((r_dom - r_for) * maturity);
    }

    // Forward points (pips): F - S (in same units as spot)
    double forward_points() const {
        return forward_rate() - spot;
    }

    // NPV of a forward contract (paying K at maturity, receiving foreign)
    // Viewed from domestic perspective: long forward
    double long_fwd_npv(double K) const {
        double F   = forward_rate();
        double disc = std::exp(-r_dom * maturity);
        return disc * (F - K);  // PV of (F - K) paid at T
    }

    // FX swap: today pay spot, at maturity receive forward
    // FX swap cost = forward_points (positive = contango for high-dom-rate ccy)
    double fx_swap_cost() const { return forward_points(); }

    // Break-even rate: what r_f makes F == S (flat carry)
    double breakeven_foreign_rate() const {
        // r_f = r_d - log(F/S)/T = r_d when F=S
        return r_dom;  // trivially: F==S when r_d==r_f
    }
};

// Example: USD/EUR
// FXForward fxf{1.10, 0.05, 0.03, 1.0};
// Forward: 1.10 * exp(0.02) ~ 1.1222 (USD appreciates, EUR depreciates)
// Forward points > 0 (EUR at discount to USD due to lower EUR rates)`,
    explanation: "CIP guarantees that no round-trip borrowing arbitrage exists between currencies: borrow domestic at r_d, convert at spot S, invest at r_f, and sell forward at F — the cost equals F/S = exp((r_d - r_f)*T). CIP deviations post-2008 (the 'basis') represent funding stress and are traded via FX basis swaps. The forward is also the risk-neutral expectation of the future spot under the domestic measure."
  },
  {
    id: "cpp-20260805-b1-mdspan-vol-surface",
    language: "cpp",
    title: "std::mdspan for 2D Implied Volatility Surface Access",
    tag: "modern-cpp",
    code: `#include <span>
#include <cstddef>
#include <vector>
#include <algorithm>
#include <stdexcept>

// std::mdspan (C++23 / available as reference impl in <mdspan>) provides
// a multidimensional view over a contiguous buffer without ownership.
// Simulated here with a lightweight wrapper for pre-C++23 builds.

// Minimal 2-D span for vol surface (stride-row major)
template <typename T>
struct Surface2D {
    T*          data;
    std::size_t n_strikes;  // columns
    std::size_t n_expiries; // rows

    T& at(std::size_t expiry_idx, std::size_t strike_idx) {
        if (expiry_idx >= n_expiries || strike_idx >= n_strikes)
            throw std::out_of_range("Surface index out of range");
        return data[expiry_idx * n_strikes + strike_idx];
    }
    const T& at(std::size_t e, std::size_t s) const {
        return const_cast<Surface2D*>(this)->at(e, s);
    }

    // Bilinear interpolation for an arbitrary (T, K) point
    T bilinear(double T_query, double K_query,
               const std::vector<double>& expiries,
               const std::vector<double>& strikes) const {
        // Lower-bound index in each dimension
        auto eit = std::lower_bound(expiries.begin(), expiries.end(), T_query);
        auto kit = std::lower_bound(strikes.begin(),  strikes.end(),  K_query);

        if (eit == expiries.end()) --eit;
        if (kit == strikes.end())  --kit;
        if (eit == expiries.begin() && *eit > T_query) { /* clamp */ }

        std::size_t ei = std::min((std::size_t)(eit - expiries.begin()), n_expiries-2);
        std::size_t ki = std::min((std::size_t)(kit - strikes.begin()),  n_strikes-2);

        double t0 = expiries[ei], t1 = expiries[ei+1];
        double k0 = strikes[ki],  k1 = strikes[ki+1];
        double wt  = (T_query - t0) / (t1 - t0 + 1e-12);
        double wk  = (K_query - k0) / (k1 - k0 + 1e-12);

        T v00 = at(ei, ki), v01 = at(ei, ki+1);
        T v10 = at(ei+1, ki), v11 = at(ei+1, ki+1);

        return (1-wt)*((1-wk)*v00 + wk*v01)
              + wt   *((1-wk)*v10 + wk*v11);
    }
};

// Usage:
// std::vector<double> buf(n_exp * n_K);   // flat row-major storage
// Surface2D<double> surface{buf.data(), n_K, n_exp};
// surface.at(0, 2) = 0.25;   // expiry 0, strike 2
// double iv = surface.bilinear(0.75, 105.0, expiries, strikes);`,
    explanation: "A 2D span decouples the multidimensional indexing logic from ownership, mirroring what std::mdspan provides in C++23. Bilinear interpolation on a row-major vol surface is cache-friendly because consecutive strikes in a single expiry row are adjacent in memory. The Surface2D wrapper makes the query pattern explicit and enables views into slabs of a larger pricing cube."
  },
  {
    id: "cpp-20260805-b1-merton-jump-mc",
    language: "cpp",
    title: "Merton Jump-Diffusion Monte Carlo Pricer",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <vector>

// Merton (1976) jump-diffusion:
//   dS/S = (r - lambda*k_bar)*dt + sigma*dW + (J-1)*dN
// J = exp(mu_J + sigma_J * Z) — log-normal jump size
// N(t) = Poisson(lambda*t) jump count
// k_bar = exp(mu_J + 0.5*sigma_J^2) - 1  (expected jump - 1)

double merton_call_mc(double S0, double K, double r,
                      double sigma, double T,
                      double lambda,   // jump intensity (jumps/year)
                      double mu_J,     // log-jump mean
                      double sigma_J,  // log-jump vol
                      int n_paths = 100'000, int n_steps = 100,
                      unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> ndist(0.0, 1.0);
    std::poisson_distribution<int>   pdist(lambda * T / n_steps);

    double dt       = T / n_steps;
    double sqrt_dt  = std::sqrt(dt);
    double k_bar    = std::exp(mu_J + 0.5*sigma_J*sigma_J) - 1.0;
    double drift    = (r - lambda*k_bar - 0.5*sigma*sigma) * dt;
    double disc     = std::exp(-r * T);

    double payoff_sum = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double log_S = std::log(S0);
        for (int step = 0; step < n_steps; ++step) {
            // Diffusion component
            log_S += drift + sigma * sqrt_dt * ndist(rng);
            // Jump component: Poisson number of jumps this step
            int n_jumps = pdist(rng);
            for (int j = 0; j < n_jumps; ++j)
                log_S += mu_J + sigma_J * ndist(rng);
        }
        payoff_sum += std::max(std::exp(log_S) - K, 0.0);
    }
    return disc * payoff_sum / n_paths;
}

// Compare: higher lambda + negative mu_J => negative skew => higher OTM put IV`,
    explanation: "Merton's jump model adds a compound Poisson process to GBM: the drift adjustment -lambda*k_bar compensates so the risk-neutral expectation of S is still S0*exp(r*T). Jumps produce excess kurtosis and skewness in the return distribution — a negative jump mean (mu_J < 0) generates implied vol skew (OTM puts more expensive), matching the equity smile that pure GBM cannot produce."
  },
  {
    id: "cpp-20260805-b1-implied-vol-nr",
    language: "cpp",
    title: "Implied Volatility via Newton-Raphson Inversion",
    tag: "numerics",
    code: `#include <cmath>
#include <stdexcept>

// Invert the Black-Scholes formula for sigma given market price.
// Newton-Raphson: sigma_{n+1} = sigma_n - (BS(sigma_n) - target) / vega(sigma_n)

static double ncdf(double x) {
    return 0.5 * std::erfc(-x / std::sqrt(2.0));
}

struct BSResult { double price; double vega; };

BSResult bs_call_and_vega(double S, double K, double r,
                           double sigma, double T) {
    if (sigma <= 0 || T <= 0) return {std::max(S - K*std::exp(-r*T), 0.0), 0.0};
    double sqt = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqt);
    double d2  = d1 - sigma*sqt;
    double npd = std::exp(-0.5*d1*d1) / std::sqrt(2*M_PI);
    double prc = S*ncdf(d1) - K*std::exp(-r*T)*ncdf(d2);
    double vega = S * npd * sqt;
    return {prc, vega};
}

double implied_vol(double market_price, double S, double K, double r, double T,
                   double sigma_init = 0.20, int max_iter = 50, double tol = 1e-8) {
    // Bounds check: price must be above intrinsic
    double intrinsic = std::max(S - K*std::exp(-r*T), 0.0);
    if (market_price <= intrinsic)
        throw std::domain_error("Market price below intrinsic: no IV");

    double sigma = sigma_init;
    for (int i = 0; i < max_iter; ++i) {
        auto [price, vega] = bs_call_and_vega(S, K, r, sigma, T);
        double error = price - market_price;
        if (std::abs(error) < tol) return sigma;
        if (std::abs(vega) < 1e-12) break;  // near-zero vega: switch to bisection
        sigma -= error / vega;
        sigma = std::clamp(sigma, 1e-6, 5.0);  // stay in [0.01%, 500%]
    }

    // Bisection fallback for poorly-conditioned cases
    double lo = 1e-6, hi = 5.0;
    for (int i = 0; i < 100; ++i) {
        double mid = 0.5*(lo + hi);
        (bs_call_and_vega(S, K, r, mid, T).price < market_price) ? (lo = mid) : (hi = mid);
    }
    return 0.5*(lo + hi);
}

// Usage: implied_vol(10.45, 100.0, 100.0, 0.05, 1.0)  => ~0.20`,
    explanation: "Newton-Raphson converges in 5–10 iterations for most market prices because BS price is monotonically increasing in sigma and vega is always positive for plain vanilla calls. Clamping sigma prevents divergence when the initial guess is far from the solution. The bisection fallback handles deep ITM/OTM options where vega is near zero and NR steps become numerically unstable."
  },
  {
    id: "cpp-20260805-b1-delta-gamma-hedge",
    language: "cpp",
    title: "Delta-Gamma Hedge Portfolio Rebalancing",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <array>

// Delta-gamma hedging maintains a portfolio's first and second-order
// sensitivity to spot price approximately zero.
// Two liquid options + spot needed to zero delta AND gamma simultaneously.
//
// System (2 equations, 2 unknowns n1 and n2):
//   Portfolio delta: delta_book + n1*delta1 + n2*delta2 + n_s = 0
//   Portfolio gamma: gamma_book + n1*gamma1 + n2*gamma2         = 0
// n_s (spot units) zeroes residual delta after gamma neutralisation.

struct Greeks { double delta; double gamma; double vega; };

struct HedgeResult {
    double n1;   // units of option 1
    double n2;   // units of option 2
    double n_s;  // spot hedge residual
};

HedgeResult delta_gamma_hedge(
    double delta_book, double gamma_book,
    Greeks h1, Greeks h2)
{
    // Solve 2x2 system for gamma neutrality then delta residual
    double det = h1.gamma * h2.delta - h2.gamma * h1.delta;
    if (std::abs(det) < 1e-12) {
        // Degenerate: hedges are parallel in (delta, gamma) space
        return {0, 0, -delta_book};
    }

    // Gamma-neutral condition alone requires n1, n2 such that:
    //   n1*gamma1 + n2*gamma2 = -gamma_book
    //   n1*delta1 + n2*delta2 = -delta_book - n_s  (n_s free)
    // Minimise |n_s| by setting delta residual to zero:
    //   n1*delta1 + n2*delta2 = -delta_book  (n_s = 0 first guess)

    // 2x2 Cramer's rule
    double rhs1 = -gamma_book;
    double rhs2 = -delta_book;
    double n1   = (rhs1 * h2.delta - rhs2 * h2.gamma) / det;
    double n2   = (h1.gamma * rhs2 - h1.delta * rhs1) / det;

    // Residual delta after adding hedges
    double residual_delta = delta_book + n1*h1.delta + n2*h2.delta;
    double n_s = -residual_delta;  // spot neutralises residual

    return {n1, n2, n_s};
}

// Example:
// Book: long 1000 ATM calls (delta=0.53, gamma=0.025)
// Hedge with shorter/longer expiry options
// auto h = delta_gamma_hedge(1000*0.53, 1000*0.025,
//            {0.60, 0.030, 15.0}, {0.40, 0.020, 12.0});`,
    explanation: "Delta-gamma hedging solves a 2×2 linear system where the two unknowns are positions in two liquid options that jointly neutralise both first and second-order spot exposure. The spot hedge mops up the residual delta after gamma neutralisation. In practice, a third option is added for vega neutrality, extending this to a 3×3 system."
  },
  {
    id: "cpp-20260805-b1-barrier-analytic",
    language: "cpp",
    title: "Analytic Down-and-Out Call via Reflection Principle",
    tag: "numerics",
    code: `#include <cmath>

// Down-and-out call: standard call that expires worthless if S ever hits barrier H.
// Analytic formula via method of images (reflection principle):
//   C_DOC = C_BS(S,K) - (S/H)^(2*mu) * C_BS(H^2/S, K)
// where mu = (r - 0.5*sigma^2) / sigma^2

static double _ncdf(double x) {
    return 0.5 * std::erfc(-x / std::sqrt(2.0));
}

static double bs_call(double S, double K, double r, double sigma, double T) {
    if (T <= 0 || sigma <= 0 || S <= 0) return std::max(S - K, 0.0);
    double sqt = std::sqrt(T);
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqt);
    double d2 = d1 - sigma*sqt;
    return S*_ncdf(d1) - K*std::exp(-r*T)*_ncdf(d2);
}

double down_and_out_call(double S, double K, double H,
                          double r, double sigma, double T) {
    if (S <= H) return 0.0;  // already knocked out
    if (K <= H) {
        // Strike below barrier: must adjust image strike
        // Exact formula:
        double mu = (r - 0.5*sigma*sigma) / (sigma*sigma);
        double lambda = mu + 1.0;
        double C_vanilla = bs_call(S, K, r, sigma, T);
        double C_image   = bs_call(H*H/S, K, r, sigma, T);
        return C_vanilla - std::pow(H/S, 2*lambda) * C_image;
    }
    // K > H: most common case
    double mu     = (r - 0.5*sigma*sigma) / (sigma*sigma);
    double lambda = mu + 1.0;
    double C1 = bs_call(S, K, r, sigma, T);
    double C2 = bs_call(H*H/S, K, r, sigma, T);
    return C1 - std::pow(H/S, 2*lambda) * C2;
}

// Down-and-in call: C_DIC = C_BS - C_DOC (in-out parity)
double down_and_in_call(double S, double K, double H,
                         double r, double sigma, double T) {
    return bs_call(S, K, r, sigma, T) - down_and_out_call(S, K, H, r, sigma, T);
}

// Example: DOC with S=100, K=105, H=90, r=5%, sigma=20%, T=1y
// Barrier premium discount vs vanilla call`,
    explanation: "The reflection principle maps a Brownian path that first touches H into a 'reflected' path starting at H²/S. The image-source term (H/S)^(2λ) * C_BS(H²/S, K) exactly cancels the contribution of paths that cross the barrier, leaving only the probability weight of paths that never touch H before expiry. In-out parity C_vanilla = C_DOC + C_DIC is an exact identity regardless of barrier level."
  },
  {
    id: "cpp-20260805-b1-asian-mc",
    language: "cpp",
    title: "Arithmetic Asian Option Pricing via Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <numeric>

// Arithmetic Asian call: payoff = max(A - K, 0) where A = (1/n)*sum S(t_i)
// Geometric Asian has analytic formula; arithmetic does not — use MC.
// Variance reduction: geometric Asian as control variate.

static double _bs_geo_asian(double S, double K, double r,
                              double sigma, double T, int n) {
    // Exact formula for geometric-average Asian call (Kemna-Vorst)
    double mu_g  = std::log(S) + (r - 0.5*sigma*sigma) * T * (n+1.0)/(2.0*n);
    double sig_g = sigma * std::sqrt(T * (n+1.0) * (2.0*n+1.0) / (6.0*n*n));
    double disc  = std::exp(-r * T);
    double d1 = (mu_g - std::log(K) + 0.5*sig_g*sig_g) / sig_g;
    double d2 = d1 - sig_g;
    auto ncdf = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    return disc * (std::exp(mu_g + 0.5*sig_g*sig_g)*ncdf(d1) - K*ncdf(d2));
}

double asian_call_mc_cv(double S0, double K, double r, double sigma,
                         double T, int n_obs = 12,
                         int n_paths = 100'000, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd(0.0, 1.0);
    double dt   = T / n_obs;
    double drift = (r - 0.5*sigma*sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    double geo_exact = _bs_geo_asian(S0, K, r, sigma, T, n_obs);
    double sum_arith = 0, sum_geo = 0, sum_cross = 0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0, log_sum = 0;
        std::vector<double> path(n_obs);
        for (int i = 0; i < n_obs; ++i) {
            S *= std::exp(drift + vol * nd(rng));
            path[i] = S;
        }
        double arith = std::accumulate(path.begin(), path.end(), 0.0) / n_obs;
        double geo   = std::exp(std::accumulate(path.begin(), path.end(), 0.0,
                           [n_obs](double acc, double x){
                               return acc + std::log(x)/n_obs;}) );
        double pay_a = std::max(arith - K, 0.0);
        double pay_g = std::max(geo   - K, 0.0);
        sum_arith += pay_a;
        sum_geo   += pay_g;
        sum_cross += pay_a * pay_g;
    }
    // Optimal control variate coefficient
    double mu_a = sum_arith / n_paths;
    double mu_g = sum_geo   / n_paths;
    // Use beta = cov(pay_a, pay_g) / var(pay_g) ≈ 1 for near-geometric payoffs
    double cv_price = disc * (mu_a - (mu_g - geo_exact/disc));
    return cv_price;
}`,
    explanation: "The geometric-average Asian option has an analytic formula (Kemna-Vorst 1990) because geometric averages of lognormal variables are lognormal. Using it as a control variate significantly reduces MC variance: subtract simulated geometric payoff and add back the exact geometric price. The variance reduction is typically 90%+ for ATM options because arithmetic and geometric averages are highly correlated."
  },
  {
    id: "cpp-20260805-b1-vasicek-zcb",
    language: "cpp",
    title: "Vasicek Model Analytic Bond Pricing",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>

// Vasicek (1977): dr = kappa*(theta - r)*dt + sigma*dW
// Analytic zero-coupon bond formula:
//   P(0, T) = A(T) * exp(-B(T) * r0)
// B(T) = (1 - exp(-kappa*T)) / kappa
// A(T) = exp[(B(T) - T)*(kappa^2*theta - 0.5*sigma^2)/kappa^2
//            - sigma^2 * B(T)^2 / (4*kappa)]

struct VasicekModel {
    double kappa;  // mean-reversion speed
    double theta;  // long-run mean rate
    double sigma;  // short-rate vol
    double r0;     // current short rate

    double B(double T) const {
        if (std::abs(kappa) < 1e-12) return T;
        return (1.0 - std::exp(-kappa * T)) / kappa;
    }

    double zcb_price(double T) const {
        double b   = B(T);
        double log_A = (b - T) * (kappa*kappa*theta - 0.5*sigma*sigma)
                        / (kappa*kappa)
                      - sigma*sigma * b*b / (4.0*kappa);
        return std::exp(log_A - b * r0);
    }

    double zero_rate(double T) const {
        if (T <= 0) return r0;
        return -std::log(zcb_price(T)) / T;
    }

    // Coupon bond price as sum of ZCBs
    double coupon_bond(double coupon, double face,
                       const std::vector<double>& payment_times) const {
        double price = 0.0;
        for (double t : payment_times)
            price += coupon * zcb_price(t);
        price += face * zcb_price(payment_times.back());
        return price;
    }

    // Long-run yield (T -> inf)
    double long_run_yield() const {
        return theta - sigma*sigma / (2.0*kappa*kappa);
    }
};

// Example calibration sanity check
// VasicekModel v{0.15, 0.05, 0.01, 0.05};
// v.zcb_price(5.0) => ~exp(-0.05*5.0) for flat curve near long-run mean
// v.zero_rate(30.0) should converge to long_run_yield()`,
    explanation: "The Vasicek model is the simplest affine term structure model: ZCB prices are exponential-affine in the current short rate r0, making the term structure analytic. The long-run yield approaches theta - sigma²/(2*kappa²) — below theta because the convexity adjustment from stochastic rates always lowers long yields. Vasicek allows negative rates (Gaussian), making it unsuitable for environments where floors matter."
  },
  {
    id: "cpp-20260805-b1-rho-calculation",
    language: "cpp",
    title: "Rho (Interest Rate Sensitivity) for Vanilla and FX Options",
    tag: "numerics",
    code: `#include <cmath>

static double _ncdf(double x) { return 0.5*std::erfc(-x/std::sqrt(2.0)); }

struct OptionGreeks {
    double price;
    double delta;
    double gamma;
    double vega;
    double theta;  // per calendar day
    double rho;    // per 1bp move in r
};

OptionGreeks bs_greeks(double S, double K, double r,
                        double sigma, double T, bool is_call = true) {
    OptionGreeks g{};
    if (T <= 0 || sigma <= 0) {
        g.price = is_call ? std::max(S-K, 0.0) : std::max(K-S, 0.0);
        return g;
    }
    double sqt  = std::sqrt(T);
    double disc = std::exp(-r * T);
    double d1   = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqt);
    double d2   = d1 - sigma*sqt;
    double npd  = std::exp(-0.5*d1*d1) / std::sqrt(2*M_PI);

    if (is_call) {
        double Nd1 = _ncdf(d1), Nd2 = _ncdf(d2);
        g.price = S*Nd1 - K*disc*Nd2;
        g.delta = Nd1;
        g.rho   = K * T * disc * Nd2 * 0.01;  // per 1% move in r; per 1bp = * 0.0001
    } else {
        double Nm1 = _ncdf(-d1), Nm2 = _ncdf(-d2);
        g.price = K*disc*Nm2 - S*Nm1;
        g.delta = Nm1 - 1.0;
        g.rho   = -K * T * disc * Nm2 * 0.01;
    }
    g.gamma = npd / (S * sigma * sqt);
    g.vega  = S * npd * sqt * 0.01;       // per 1% vol move
    g.theta = -(S*npd*sigma/(2*sqt)
                + (is_call ? r*K*disc*_ncdf(d2) : -r*K*disc*_ncdf(-d2)))
              / 365.0;
    return g;
}

// FX option rho: two rho components (domestic and foreign rates)
struct FXRho { double rho_dom; double rho_for; };
FXRho fx_rho(double S, double K, double r_d, double r_f,
              double sigma, double T, bool is_call = true) {
    // Garman-Kohlhagen: replace r with r_d, discount S by r_f
    double adj_S = S * std::exp(-r_f * T);
    auto g = bs_greeks(adj_S, K, r_d, sigma, T, is_call);
    double rho_dom = g.rho;
    // Foreign rate rho: delta sensitivity via r_f changes adj_S
    double rho_for = -T * adj_S * g.delta * 0.01;  // per 1% r_f change
    return {rho_dom, rho_for};
}`,
    explanation: "Rho = K*T*e^{-rT}*N(d2) for a call — it grows with maturity because the benefit of paying K later (discounting) is larger for long-dated options. For FX options (Garman-Kohlhagen), there are two rho sensitivities: domestic rate rho (standard) and foreign rate rho (the cost of carry on the foreign currency position, equal to -T * spot * N(d1) * e^{-r_f*T})."
  },
  {
    id: "cpp-20260805-b1-heterogeneous-map",
    language: "cpp",
    title: "Heterogeneous Lookup in std::map for Order ID Search",
    tag: "modern-cpp",
    code: `#include <map>
#include <string>
#include <string_view>
#include <optional>
#include <functional>

// std::map::find() with a std::string key requires a temporary std::string
// when called with a char* or string_view.
// C++14 heterogeneous lookup avoids the allocation via transparent comparator.

struct StrLess {
    using is_transparent = void;  // enables heterogeneous comparisons

    bool operator()(std::string_view a, std::string_view b) const noexcept {
        return a < b;
    }
};

struct OrderRecord {
    double price;
    int    qty;
    char   side;
};

using OrderBook = std::map<std::string, OrderRecord, StrLess>;

// Lookup using string_view — no allocation, no copy
std::optional<OrderRecord> find_order(const OrderBook& book,
                                       std::string_view id) {
    auto it = book.find(id);  // heterogeneous find: no std::string constructed
    if (it == book.end()) return std::nullopt;
    return it->second;
}

// Insert: still requires a std::string key (ownership semantics)
void insert_order(OrderBook& book, std::string id, OrderRecord rec) {
    book.emplace(std::move(id), rec);
}

// Benchmark context: at 100k lookups/s, avoiding one malloc per lookup
// saves ~5ms/s — meaningful for latency-sensitive risk checks.

// Same technique applies to unordered_map with a transparent hash (C++20):
// using is_transparent in both Hash and KeyEqual.
void demo() {
    OrderBook ob;
    insert_order(ob, "ORD-001", {100.5, 500, 'B'});
    auto rec = find_order(ob, "ORD-001");  // no temporary string
}`,
    explanation: "The is_transparent tag on the comparator tells std::map to accept any type that the comparator can handle in its find/count/lower_bound methods, not just the key type. Without it, find(string_view) would fail to compile; with a non-transparent map, you'd need find(std::string(id)), constructing a heap-allocated string. The same mechanism works on std::set and the unordered variants with C++20."
  },
  {
    id: "cpp-20260805-b1-future-calendar-spread",
    language: "cpp",
    title: "Futures Calendar Spread Pricing with Convenience Yield",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>

// Futures price under cost-of-carry:
//   F(T) = S * exp((r + u - y) * T)
// u: storage/carry cost (continuous), y: convenience yield (continuous)
// Calendar spread = F(T2) - F(T1) = S * (exp((r+u-y)*T2) - exp((r+u-y)*T1))

struct FuturesCurve {
    double S;   // spot price
    double r;   // risk-free rate
    double u;   // carry cost (storage/insurance)
    double y;   // convenience yield

    double futures_price(double T) const {
        return S * std::exp((r + u - y) * T);
    }

    // Calendar spread: long T2, short T1
    double calendar_spread(double T1, double T2) const {
        return futures_price(T2) - futures_price(T1);
    }

    // Implied convenience yield from observed futures prices F1, F2
    static double implied_convenience_yield(double S, double r, double u,
                                             double F, double T) {
        // F = S * exp((r + u - y) * T) => y = r + u - log(F/S)/T
        return r + u - std::log(F / S) / T;
    }

    // Roll yield: annualised P&L from rolling a nearby future forward
    // When forward curve is in backwardation (y > r + u): positive roll
    double roll_yield(double T1, double T2) const {
        double F1 = futures_price(T1);
        double F2 = futures_price(T2);
        return (F1 - F2) / F2 / (T2 - T1);  // annualised
    }
};

// Energy commodities: high convenience yield (y > r+u) => backwardation
// Metals: low convenience yield (y ~ 0) => contango when r+u > 0

void analyse_energy_curve() {
    FuturesCurve wti{80.0, 0.05, 0.01, 0.08};  // oil: y=8% > r+u=6%
    double spread = wti.calendar_spread(1.0, 2.0);
    double roll   = wti.roll_yield(0.25, 0.50);  // 3m to 6m roll
    (void)spread; (void)roll;
}`,
    explanation: "The convenience yield y represents the flow of services from holding the physical commodity — refineries pay a premium to hold crude rather than buy futures, creating backwardation (F < S*exp(rT)). Calendar spread trading profits from convergence of the spread toward the cost-of-carry model; positive roll yield (backwardation) accrues to investors rolling futures positions monthly."
  },
  {
    id: "cpp-20260805-b1-sfinae-priceable",
    language: "cpp",
    title: "SFINAE Type Traits for Detecting Priceable Instruments",
    tag: "modern-cpp",
    code: `#include <type_traits>
#include <utility>
#include <concepts>  // C++20 fallback: also use void_t pattern

// Detect if a type T has a .npv() member function returning double.
// SFINAE-based (C++17) for pre-C++20 environments.

template <typename T, typename = void>
struct has_npv : std::false_type {};

template <typename T>
struct has_npv<T,
    std::void_t<decltype(std::declval<T>().npv())>>
    : std::is_convertible<
        decltype(std::declval<T>().npv()), double>
{};

template <typename T>
inline constexpr bool has_npv_v = has_npv<T>::value;

// C++20 concept version (preferred when available)
template <typename T>
concept Priceable = requires(T t) {
    { t.npv() } -> std::convertible_to<double>;
};

// Example instruments
struct VanillaSwap {
    double fixed_rate, notional;
    double npv() const { return fixed_rate * notional; }  // simplified
};

struct CreditNote {
    double spread;
    // no npv() -- not priceable
};

static_assert( has_npv_v<VanillaSwap>);
static_assert(!has_npv_v<CreditNote>);
static_assert( Priceable<VanillaSwap>);
// static_assert(!Priceable<CreditNote>);  // would fail to compile -- that's the point

// Generic aggregator: only accepts Priceable types
template <Priceable... Ts>
double total_npv(const Ts&... instruments) {
    return (... + instruments.npv());
}

// SFINAE-guarded overload for pre-C++20:
template <typename T>
std::enable_if_t<has_npv_v<T>, double>
price_if_possible(const T& t) { return t.npv(); }`,
    explanation: "void_t<expr> evaluates to void when expr is well-formed and causes substitution failure otherwise — enabling detection of specific member functions without requiring a base class. C++20 concepts wrap this in cleaner syntax: the requires clause both detects and documents the interface contract. SFINAE traits are still useful in C++20 when you need the type predicate as a boolean constant for specialisation."
  },
  {
    id: "cpp-20260805-b1-atomic-sharedptr",
    language: "cpp",
    title: "std::atomic<shared_ptr> for Lock-Free Order Reference Sharing",
    tag: "lock-free",
    code: `#include <atomic>
#include <memory>
#include <cassert>

// C++20 std::atomic<shared_ptr<T>> provides atomic read/write/swap
// of a shared_ptr without an external mutex.
// Use case: multiple strategy threads read the current best order
// while the feed thread atomically swaps in a new snapshot.

struct BestQuote {
    double bid;
    double ask;
    int    bid_size;
    int    ask_size;
    long long timestamp_ns;
};

class QuoteFeed {
    std::atomic<std::shared_ptr<BestQuote>> current_;

public:
    QuoteFeed() {
        current_.store(std::make_shared<BestQuote>(),
                       std::memory_order_relaxed);
    }

    // Feed thread: publish a new quote atomically
    void publish(BestQuote q) {
        auto ptr = std::make_shared<BestQuote>(std::move(q));
        // exchange: store new, return old (old destroyed when last ref drops)
        current_.exchange(std::move(ptr), std::memory_order_release);
    }

    // Strategy threads: read the current quote (zero lock, zero copy of raw data)
    std::shared_ptr<const BestQuote> latest() const {
        return current_.load(std::memory_order_acquire);
    }
};

// Usage:
// QuoteFeed feed;
// // Feed thread (single producer):
// feed.publish({100.5, 100.6, 500, 200, ts_ns});
// // Strategy threads (multiple consumers):
// auto q = feed.latest();   // q is a ref-counted pointer — safe even if feed updates
// double mid = 0.5 * (q->bid + q->ask);`,
    explanation: "std::atomic<shared_ptr> (C++20) solves the snapshot-reader problem: the feed thread atomically replaces the current pointer while multiple strategy threads hold their own shared_ptr copies. The reference count ensures the old BestQuote lives until all readers drop their copies, even after the feed thread has published a new one. Pre-C++20, atomic_load/atomic_store on shared_ptr were available but non-member."
  },
  {
    id: "cpp-20260805-b1-cir-simulation",
    language: "cpp",
    title: "Cox-Ingersoll-Ross (CIR) Short Rate Simulation",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <algorithm>

// CIR model: dr = kappa*(theta - r)*dt + sigma*sqrt(r)*dW
// Feller condition: 2*kappa*theta > sigma^2 ensures r stays positive.
// Full-truncation Euler: clamp r to max(r, 0) before sqrt.

struct CIRPaths {
    std::vector<std::vector<double>> r;   // (n_paths, n_steps+1)
    std::vector<double> zcb_mc;           // P(0, T) per path
};

CIRPaths cir_simulate(double kappa, double theta, double sigma,
                       double r0, double T,
                       int n_paths = 10'000, int n_steps = 252,
                       unsigned seed = 42) {
    bool feller = (2.0*kappa*theta > sigma*sigma);
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd(0.0, 1.0);

    double dt   = T / n_steps;
    double sdt  = std::sqrt(dt);
    CIRPaths res;
    res.r.resize(n_paths, std::vector<double>(n_steps+1, r0));
    res.zcb_mc.resize(n_paths);

    for (int p = 0; p < n_paths; ++p) {
        double r = r0, integral = 0.0;
        for (int i = 0; i < n_steps; ++i) {
            double r_pos = std::max(r, 0.0);  // full truncation
            r += kappa*(theta - r_pos)*dt + sigma*std::sqrt(r_pos)*sdt*nd(rng);
            integral += r_pos * dt;
            res.r[p][i+1] = r;
        }
        res.zcb_mc[p] = std::exp(-integral);
    }
    (void)feller;  // for documentation
    return res;
}

// Analytic ZCB price under CIR
double cir_zcb(double kappa, double theta, double sigma,
                double r0, double T) {
    double gamma = std::sqrt(kappa*kappa + 2*sigma*sigma);
    double exp_g = std::exp(gamma*T);
    double B_T   = 2*(exp_g - 1) / ((gamma + kappa)*(exp_g - 1) + 2*gamma);
    double log_A = 2*kappa*theta/(sigma*sigma) *
                   std::log(2*gamma*std::exp(0.5*(kappa+gamma)*T)
                            / ((gamma+kappa)*(exp_g-1) + 2*gamma));
    return std::exp(log_A - B_T*r0);
}`,
    explanation: "CIR avoids Vasicek's negative rates by making the diffusion coefficient proportional to sqrt(r) — when r hits zero the diffusion term vanishes but the drift kappa*theta pulls r back up. The Feller condition 2*kappa*theta > sigma^2 ensures r never touches zero. Full-truncation Euler (clamp before sqrt) is the standard practical discretisation, converging at the same rate as the exact non-central chi-squared transition density."
  },
  {
    id: "cpp-20260805-b1-par-swap-rate",
    language: "cpp",
    title: "Par Swap Rate from Discount Curve",
    tag: "fixed-income",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <stdexcept>

// Par swap rate: the fixed rate that makes NPV of IRS = 0 at inception.
//   S_par = (P(0,T0) - P(0,TN)) / sum(delta_i * P(0,Ti))
// delta_i: day-count fraction for period i (semi-annual = 0.5 approx)
// The annuity (denominator) is the DV01 of the swap.

struct DiscountCurve {
    std::vector<double> tenors;   // in years
    std::vector<double> dfs;      // P(0, tenors[i])

    // Log-linear interpolation between nodes
    double df(double T) const {
        if (T <= 0) return 1.0;
        for (std::size_t i = 1; i < tenors.size(); ++i) {
            if (T <= tenors[i]) {
                double alpha = (T - tenors[i-1]) / (tenors[i] - tenors[i-1]);
                return std::exp((1-alpha)*std::log(dfs[i-1])
                               + alpha*std::log(dfs[i]));
            }
        }
        // Extrapolate flat zero rate
        double rN = -std::log(dfs.back()) / tenors.back();
        return std::exp(-rN * T);
    }
};

double par_swap_rate(const DiscountCurve& curve,
                     double start, double end,
                     double payment_freq = 0.5) {
    std::vector<double> pay_dates;
    for (double t = start + payment_freq; t <= end + 1e-9; t += payment_freq)
        pay_dates.push_back(t);

    if (pay_dates.empty()) throw std::invalid_argument("No payment dates");

    // Annuity = sum of delta_i * P(0, Ti)
    double annuity = 0.0;
    for (std::size_t i = 0; i < pay_dates.size(); ++i) {
        double delta = (i == 0) ? pay_dates[0] - start : payment_freq;
        annuity += delta * curve.df(pay_dates[i]);
    }

    // Par: P(0,start) - P(0,end) (net floating leg PV)
    double numerator = curve.df(start) - curve.df(end);
    return numerator / annuity;
}

// DV01 of a receiver swap (receive fixed, pay floating)
double swap_dv01(const DiscountCurve& curve,
                  double start, double end, double notional,
                  double payment_freq = 0.5) {
    std::vector<double> pay_dates;
    for (double t = start + payment_freq; t <= end + 1e-9; t += payment_freq)
        pay_dates.push_back(t);
    double annuity = 0.0;
    for (double t : pay_dates)
        annuity += payment_freq * curve.df(t);
    return notional * annuity * 0.0001;  // 1bp * annuity * notional
}`,
    explanation: "The par swap rate follows directly from the discount curve: numerator is the PV of the floating leg (par minus par), denominator is the fixed-coupon annuity. This is the market-standard formula used in OIS-discounted valuation where the discount curve is the OIS curve and the forward curve is the projected index rate. DV01 = notional * annuity * 0.0001 gives the dollar sensitivity per basis point."
  },
  {
    id: "cpp-20260805-b1-compile-time-string-hash",
    language: "cpp",
    title: "Compile-Time String Hashing for Constexpr Switch Dispatch",
    tag: "modern-cpp",
    code: `#include <cstdint>
#include <string_view>
#include <stdexcept>

// Compile-time string → uint64 hash enables switch on string values.
// Standard switch only works on integer types; this pattern converts
// string tags to integer constants at compile time.

constexpr uint64_t hash_str(std::string_view s) noexcept {
    uint64_t h = 14695981039346656037ULL;
    for (unsigned char c : s)
        h = (h ^ c) * 1099511628211ULL;
    return h;
}

// Constexpr user-defined literal for ergonomic syntax
constexpr uint64_t operator""_h(const char* s, std::size_t n) noexcept {
    return hash_str(std::string_view(s, n));
}

// Static assertions catch collisions at compile time
constexpr uint64_t H_SPOT    = "SPOT"_h;
constexpr uint64_t H_FORWARD = "FORWARD"_h;
constexpr uint64_t H_SWAP    = "SWAP"_h;
constexpr uint64_t H_OPTION  = "OPTION"_h;

static_assert(H_SPOT != H_FORWARD);
static_assert(H_SWAP != H_OPTION);

enum class InstrumentType { Spot, Forward, Swap, Option, Unknown };

InstrumentType classify(std::string_view type_tag) {
    switch (hash_str(type_tag)) {
        case "SPOT"_h:    return InstrumentType::Spot;
        case "FORWARD"_h: return InstrumentType::Forward;
        case "SWAP"_h:    return InstrumentType::Swap;
        case "OPTION"_h:  return InstrumentType::Option;
        default:          return InstrumentType::Unknown;
    }
}

// Usage in FIX message dispatch:
// InstrumentType t = classify(fix_get(msg, 167).value_or(""));
// switch(t) { case InstrumentType::Option: handle_option(); break; ... }`,
    explanation: "A constexpr hash function converts string literals to integer constants at compile time, enabling switch dispatch on string values — something the C++ grammar forbids directly. The user-defined literal _h gives each case clause the same ergonomics as a string literal while being purely a compile-time constant. Collision detection via static_assert is automatic: two distinct tags with the same hash will fail to compile."
  },
  {
    id: "cpp-20260805-b1-ranges-filter-pipe",
    language: "cpp",
    title: "std::ranges Pipeline for Real-Time Tick Filtering",
    tag: "modern-cpp",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <numeric>
#include <cstddef>

struct Tick {
    double price;
    int    qty;
    char   side;  // 'B' or 'S'
    bool   is_cancel;
};

// Ranges pipeline: filter active buys, map to price, compute VWAP
// All lazy — no intermediate allocations unless collected with to<vector>
double compute_buy_vwap(const std::vector<Tick>& ticks) {
    auto active_buys = ticks
        | std::views::filter([](const Tick& t){ return t.side == 'B' && !t.is_cancel; })
        | std::views::filter([](const Tick& t){ return t.qty > 0; });

    double total_notional = 0.0, total_qty = 0.0;
    for (const Tick& t : active_buys) {
        total_notional += t.price * t.qty;
        total_qty      += t.qty;
    }
    return total_qty > 0 ? total_notional / total_qty : 0.0;
}

// Top-5 ask prices using ranges (sorted, take 5)
std::vector<double> top5_asks(const std::vector<Tick>& ticks) {
    auto ask_prices = ticks
        | std::views::filter([](const Tick& t){ return t.side == 'S' && !t.is_cancel; })
        | std::views::transform([](const Tick& t){ return t.price; });

    std::vector<double> prices(ask_prices.begin(), ask_prices.end());
    std::sort(prices.begin(), prices.end());
    prices.erase(std::unique(prices.begin(), prices.end()), prices.end());
    if (prices.size() > 5) prices.resize(5);
    return prices;
}

// Count ticks above a threshold in a sliding view
std::size_t count_above_threshold(std::span<const Tick> window, double thr) {
    return static_cast<std::size_t>(
        std::ranges::count_if(window, [thr](const Tick& t){ return t.price > thr; })
    );
}`,
    explanation: "std::views::filter and std::views::transform compose into lazy pipelines: no intermediate vector is allocated until the pipeline is iterated or collected. For tick-by-tick risk checks, this means the filter over millions of ticks per second adds zero heap pressure. std::ranges::count_if and std::ranges::sort work on any range, including spans and views, with the same semantics as the algorithm equivalents."
  },
  {
    id: "cpp-20260805-b1-variadic-multileg",
    language: "cpp",
    title: "Variadic Template for Multi-Leg Option Strategy Construction",
    tag: "modern-cpp",
    code: `#include <tuple>
#include <array>
#include <cstddef>
#include <type_traits>
#include <numeric>

// A leg is a signed position in a derivative instrument.
template <typename Instrument>
struct Leg {
    int        qty;    // positive = long, negative = short
    Instrument instr;

    double npv()   const { return qty * instr.npv(); }
    double delta() const { return qty * instr.delta(); }
    double gamma() const { return qty * instr.gamma(); }
    double vega()  const { return qty * instr.vega(); }
};

// Deduction guide
template <typename T> Leg(int, T) -> Leg<T>;

// Multi-leg strategy: heterogeneous tuple of legs (straddle, strangle, etc.)
template <typename... Legs>
class Strategy {
    std::tuple<Legs...> legs_;

    template <std::size_t... I, typename Fn>
    double fold_over(std::index_sequence<I...>, Fn fn) const {
        return (fn(std::get<I>(legs_)) + ...);
    }

public:
    explicit Strategy(Legs... ls) : legs_(std::move(ls)...) {}

    double total_npv() const {
        return fold_over(std::index_sequence_for<Legs...>{},
                         [](const auto& l){ return l.npv(); });
    }
    double net_delta() const {
        return fold_over(std::index_sequence_for<Legs...>{},
                         [](const auto& l){ return l.delta(); });
    }
    double net_gamma() const {
        return fold_over(std::index_sequence_for<Legs...>{},
                         [](const auto& l){ return l.gamma(); });
    }
    double net_vega()  const {
        return fold_over(std::index_sequence_for<Legs...>{},
                         [](const auto& l){ return l.vega(); });
    }
};

// Factory: deduce leg types
template <typename... Ts>
auto make_strategy(Leg<Ts>... legs) {
    return Strategy<Leg<Ts>...>(std::move(legs)...);
}

// Example: straddle = long call + long put
// auto straddle = make_strategy(Leg{1, call_opt}, Leg{1, put_opt});
// straddle.net_delta()  // ~0 for ATM straddle
// straddle.net_vega()   // 2 * individual vega`,
    explanation: "Variadic templates allow the compiler to type-erase the leg list into a fixed heterogeneous tuple, enabling strategies with different instrument types in a single compile-time structure. The fold expression (fn(get<I>(legs)) + ...) aggregates over all legs in a single expression without a runtime loop or virtual dispatch. Strategy types like Straddle, Strangle, and RiskReversal are then just aliases created by the factory."
  },
];
