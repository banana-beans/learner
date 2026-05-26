import type { Snippet } from "./types";

export const cppSnippets20260526B1: Snippet[] = [
  {
    id: "cpp-20260526-b1-flat-map",
    language: "cpp",
    title: "std::flat_map / flat_set (C++23) — sorted-vector order book",
    tag: "stl",
    code: `#include <flat_map>
#include <flat_set>
#include <cstdint>
#include <iostream>

// std::flat_map (C++23): stores keys + values in two parallel sorted vectors.
// Better cache locality for iteration vs std::map (red-black tree).
// Cost: O(n) insertion/erase — ideal for read-heavy, snapshot-updated books.
using Ticks = std::int64_t;
using Qty   = std::uint32_t;

class FlatBook {
    std::flat_map<Ticks, Qty, std::greater<Ticks>> bids_;  // highest bid first
    std::flat_map<Ticks, Qty>                       asks_;  // lowest ask first
public:
    void set_bid(Ticks px, Qty q) {
        if (q == 0) bids_.erase(px); else bids_[px] = q;
    }
    void set_ask(Ticks px, Qty q) {
        if (q == 0) asks_.erase(px); else asks_[px] = q;
    }
    Ticks best_bid() const { return bids_.empty() ? 0 : bids_.begin()->first; }
    Ticks best_ask() const { return asks_.empty() ? 0 : asks_.begin()->first; }
    Ticks mid_ticks() const { return (best_bid() + best_ask()) / 2; }

    void print_top(int n) const {
        int i = 0;
        for (auto& [px, q] : bids_) {
            std::cout << "bid " << px << " x" << q << "\\n";
            if (++i == n) break;
        }
        i = 0;
        for (auto& [px, q] : asks_) {
            std::cout << "ask " << px << " x" << q << "\\n";
            if (++i == n) break;
        }
    }
};

// flat_set: sorted-vector set of unique keys — no hash collision overhead.
std::flat_set<std::uint64_t> active_orders;

int main() {
    FlatBook book;
    book.set_bid(100050, 200); book.set_bid(100000, 500);
    book.set_ask(100100, 150); book.set_ask(100200, 300);
    book.print_top(2);
    std::cout << "mid: " << book.mid_ticks() << "\\n";
    active_orders.insert(42); active_orders.insert(99);
    std::cout << "live orders: " << active_orders.size() << "\\n";
}`,
    explanation:
      "flat_map stores keys and values in separate contiguous arrays, making sequential scans of price levels nearly as fast as iterating a vector. The O(n) insert penalty is acceptable for snapshot-book feeds (e.g., CME MDP3) where an entire price ladder is replaced in bulk once per event.",
  },
  {
    id: "cpp-20260526-b1-mdspan",
    language: "cpp",
    title: "std::mdspan (C++23) — 2D volatility surface without allocation",
    tag: "stl",
    code: `#include <mdspan>
#include <vector>
#include <cmath>
#include <cstddef>

// std::mdspan: a non-owning multidimensional view over a flat buffer.
// No allocation — maps an index pair (i,j) to buffer[i * cols + j].
// Replaces hand-rolled ptr + stride arithmetic in vol surface code.

struct VolSurface {
    std::vector<double>       data;        // flat storage, row-major
    std::size_t               n_strikes;
    std::size_t               n_tenors;

    VolSurface(std::size_t ks, std::size_t ts)
        : data(ks * ts, 0.0), n_strikes(ks), n_tenors(ts) {}

    // Return a 2D view — zero-cost, no copy.
    auto view() {
        return std::mdspan(data.data(),
                           std::extents<std::size_t, std::dynamic_extent,
                                                     std::dynamic_extent>{
                               n_strikes, n_tenors});
    }

    // Bilinear interpolation at fractional indices.
    double interp(double si, double ti) const {
        std::size_t s0 = static_cast<std::size_t>(si);
        std::size_t t0 = static_cast<std::size_t>(ti);
        s0 = std::min(s0, n_strikes - 2);
        t0 = std::min(t0, n_tenors  - 2);
        double fs = si - s0, ft = ti - t0;

        auto v = std::mdspan(data.data(),
                             std::extents<std::size_t,
                                          std::dynamic_extent,
                                          std::dynamic_extent>{n_strikes, n_tenors});
        return (1-fs)*(1-ft)*v[s0,t0] + fs*(1-ft)*v[s0+1,t0]
             + (1-fs)*  ft  *v[s0,t0+1] + fs*  ft  *v[s0+1,t0+1];
    }
};

int main() {
    VolSurface vs(10, 8);   // 10 strikes x 8 tenors
    auto surf = vs.view();
    // Populate from market data — surf[strike_idx, tenor_idx] = implied_vol
    for (std::size_t i = 0; i < 10; ++i)
        for (std::size_t j = 0; j < 8; ++j)
            surf[i, j] = 0.15 + 0.005 * static_cast<double>(i) - 0.003 * j;

    double v = vs.interp(3.5, 2.5);   // interpolate between grid nodes
    (void)v;
}`,
    explanation:
      "std::mdspan decouples the logical 2D layout from ownership — the same flat buffer can be viewed as a row-major or column-major grid without copying. For a volatility surface with 50 strikes × 20 tenors, the bilinear interpolation accesses only 4 cache-adjacent elements per query when the layout matches the access pattern.",
  },
  {
    id: "cpp-20260526-b1-constinit",
    language: "cpp",
    title: "constinit — guaranteed zero-initialisation at startup",
    tag: "modern",
    code: `#include <atomic>
#include <cstdint>

// constinit (C++20): the variable MUST be constant-initialised at compile time.
// Prevents the "static initialisation order fiasco" — the object is in the
// .bss / .data segment before any user code runs, never a runtime init.
// Unlike constexpr, constinit does NOT make the variable read-only.

// Global sequence counter — reads/writes happen at runtime, but the zero
// initial value is guaranteed before any thread starts.
constinit std::atomic<std::uint64_t> g_order_seq{0};

// Compile-time-sized ring buffer with constinit backing array.
static constexpr std::size_t RING_SZ = 4096;
constinit thread_local std::uint64_t tl_ring[RING_SZ]{};  // zero-initialised

// Policy flags bitmask — must exist before any constructor or function body runs.
constinit std::uint32_t g_risk_flags = 0;

// Contrast with constexpr — read-only:
//   constexpr std::uint64_t MAX_ORDER_ID = 1ULL << 48;
// constinit is mutable but guaranteed early:
//   constinit std::uint64_t g_last_id = 0;   // modified at runtime

std::uint64_t next_seq() noexcept {
    // Relaxed is safe here: the caller handles ordering via other means.
    return g_order_seq.fetch_add(1, std::memory_order_relaxed);
}`,
    explanation:
      "Static initialisation order is undefined between translation units in C++. constinit hard-errors at compile time if the initialiser isn't a constant expression, eliminating a whole class of startup-race bugs that are notoriously hard to reproduce in production. All global order book state and sequence counters should be constinit or explicitly default-initialized in a single designated startup function.",
  },
  {
    id: "cpp-20260526-b1-nttp-auto",
    language: "cpp",
    title: "Non-type template parameter `auto` — compile-time tick precision",
    tag: "templates",
    code: `#include <cstdint>
#include <type_traits>
#include <cmath>

// C++17: NTTP with 'auto' deduces the type from the provided constant.
// Lets callers write FixedPoint<int64_t, 10000> without repeating the type
// of the multiplier — it's inferred as int (or long, etc.) automatically.
template <typename T, auto Multiplier>
struct FixedPoint {
    static_assert(std::is_integral_v<decltype(Multiplier)>, "Multiplier must be integer");
    static_assert(Multiplier > 0, "Multiplier must be positive");

    T ticks{};   // internal integer representation

    constexpr explicit FixedPoint(double v)
        : ticks(static_cast<T>(std::round(v * Multiplier))) {}

    constexpr explicit FixedPoint(T raw) noexcept : ticks(raw) {}

    constexpr double to_double() const noexcept {
        return static_cast<double>(ticks) / static_cast<double>(Multiplier);
    }

    constexpr FixedPoint operator+(FixedPoint o) const noexcept {
        return FixedPoint{static_cast<T>(ticks + o.ticks)};
    }
    constexpr FixedPoint operator-(FixedPoint o) const noexcept {
        return FixedPoint{static_cast<T>(ticks - o.ticks)};
    }
    constexpr bool operator<(FixedPoint o) const noexcept { return ticks < o.ticks; }
};

// Two different tick sizes — completely separate types, no conversion:
using Price4  = FixedPoint<std::int64_t, 10000>;    // 4 decimal places (equities)
using Price8  = FixedPoint<std::int64_t, 100000000>;// 8 decimal places (crypto)

int main() {
    Price4 bid{100.25};
    Price4 ask{100.27};
    auto spread = ask - bid;
    static_assert(std::is_same_v<decltype(spread), Price4>);

    Price8 btc_price{67543.12345678};
    (void)btc_price;
    // bid + btc_price would be a compile error: different types
}`,
    explanation:
      "NTTP auto lets the multiplier be baked into the type at compile time — Price4 and Price8 are distinct types, so mixing equity prices and crypto prices is a compile-time error. This eliminates an entire category of unit-mismatch bugs that show up as bizarre P&L figures in production.",
  },
  {
    id: "cpp-20260526-b1-tagged-ptr-freelist",
    language: "cpp",
    title: "Lock-free freelist with ABA-safe tagged pointer",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <new>

// ABA problem: thread A pops X, B pops X then Y then re-pushes X;
// A's CAS on the head sees X again and succeeds, but now head points into B's
// partially-freed list. Fix: embed a generation counter in the pointer's high bits.
// On x86-64, only 48 bits of a pointer are used — the top 16 bits are free for a tag.
struct alignas(8) Node {
    Node*         next;
    std::uint64_t data;
};

class TaggedFreelist {
    struct TaggedPtr {
        std::uintptr_t val;  // bits [63:48] = generation tag, [47:0] = pointer
        Node* ptr()  const { return reinterpret_cast<Node*>(val & 0x0000'FFFF'FFFF'FFFFUL); }
        std::uint16_t tag() const { return static_cast<std::uint16_t>(val >> 48); }
        static TaggedPtr make(Node* p, std::uint16_t t) {
            return {(static_cast<std::uintptr_t>(t) << 48)
                    | (reinterpret_cast<std::uintptr_t>(p) & 0x0000'FFFF'FFFF'FFFFUL)};
        }
    };
    std::atomic<TaggedPtr> head_{{0}};

public:
    void push(Node* n) noexcept {
        TaggedPtr old = head_.load(std::memory_order_acquire);
        TaggedPtr next;
        do {
            n->next = old.ptr();
            // Increment tag on every push — breaks ABA sequences.
            next = TaggedPtr::make(n, static_cast<std::uint16_t>(old.tag() + 1));
        } while (!head_.compare_exchange_weak(old, next,
                                               std::memory_order_release,
                                               std::memory_order_acquire));
    }

    Node* pop() noexcept {
        TaggedPtr old = head_.load(std::memory_order_acquire);
        TaggedPtr next;
        do {
            if (!old.ptr()) return nullptr;
            next = TaggedPtr::make(old.ptr()->next,
                                   static_cast<std::uint16_t>(old.tag() + 1));
        } while (!head_.compare_exchange_weak(old, next,
                                               std::memory_order_release,
                                               std::memory_order_acquire));
        return old.ptr();
    }
};`,
    explanation:
      "Incrementing the generation counter on every push means that even if the same memory address re-appears at the head, the tag is different and the CAS will fail. This is correct on x86-64 where user-space pointers occupy at most 48 bits; on ARM64 the approach needs TBI (Top-Byte Ignore) or a separate 128-bit CAS (LDXP/STXP) for correctness.",
  },
  {
    id: "cpp-20260526-b1-robin-hood-map",
    language: "cpp",
    title: "Robin Hood open-addressing hash map for order-ID lookup",
    tag: "performance",
    code: `#include <vector>
#include <cstdint>
#include <cstring>
#include <stdexcept>

// Robin Hood hashing: on collision, displace a "rich" entry (one close to home)
// in favour of a "poor" entry (one far from home). Keeps probe lengths balanced.
// Load factor up to 0.9 is usable — typical std::unordered_map needs <0.75.
template <typename V>
class RobinHoodMap {
    struct Slot {
        std::uint64_t key   = 0;
        V             value{};
        int           psl   = -1;   // probe-sequence length; -1 = empty
    };
    std::vector<Slot> table_;
    std::size_t       size_  = 0;
    std::size_t       mask_;

    std::size_t home(std::uint64_t k) const noexcept { return k & mask_; }

public:
    explicit RobinHoodMap(std::size_t cap = 1024) : table_(cap), mask_(cap - 1) {
        if (cap & (cap - 1)) throw std::invalid_argument("cap must be power of 2");
    }

    void insert(std::uint64_t key, V val) {
        if (size_ * 10 >= table_.size() * 9) rehash(table_.size() * 2);
        Slot ins{key, std::move(val), 0};
        std::size_t idx = home(key);
        for (;;) {
            Slot& s = table_[idx];
            if (s.psl < 0) { s = std::move(ins); ++size_; return; }
            if (s.key == ins.key) { s.value = std::move(ins.value); return; }
            if (s.psl < ins.psl) std::swap(s, ins);  // rob the rich
            idx = (idx + 1) & mask_;
            ++ins.psl;
        }
    }

    V* find(std::uint64_t key) noexcept {
        std::size_t idx = home(key);
        for (int psl = 0;; ++psl) {
            Slot& s = table_[idx];
            if (s.psl < 0 || psl > s.psl) return nullptr;
            if (s.key == key) return &s.value;
            idx = (idx + 1) & mask_;
        }
    }

    void rehash(std::size_t new_cap) {
        RobinHoodMap tmp(new_cap);
        for (auto& s : table_) if (s.psl >= 0) tmp.insert(s.key, s.value);
        *this = std::move(tmp);
    }
    std::size_t size() const noexcept { return size_; }
};`,
    explanation:
      "Robin Hood hashing bounds the maximum probe-sequence length to O(log n) in expectation, versus unbounded chains in chained hashing. For order-book lookup (keyed by uint64 order ID), a 0.85 load factor Robin Hood table is about 2× faster than std::unordered_map due to better cache line utilisation and no pointer chasing.",
  },
  {
    id: "cpp-20260526-b1-zip-view",
    language: "cpp",
    title: "std::views::zip (C++23) — paired quote/trade stream processing",
    tag: "stl",
    code: `#include <ranges>
#include <vector>
#include <cmath>
#include <numeric>

// std::views::zip (C++23): lazily pairs elements from multiple ranges.
// No allocation — the view advances all iterators in lockstep.
// Perfect for correlating two time-aligned tick series without copying.

struct Quote { double bid, ask; };
struct Trade { double price; int qty; };

double average_effective_spread(const std::vector<Quote>& quotes,
                                 const std::vector<Trade>& trades) {
    // For each (trade, contemporaneous quote): spread = |trade - mid| * 2
    double total = 0.0;
    int    count = 0;
    for (auto&& [q, t] : std::views::zip(quotes, trades)) {
        double mid     = 0.5 * (q.bid + q.ask);
        double eff_spr = 2.0 * std::abs(t.price - mid);
        total += eff_spr;
        ++count;
    }
    return count ? total / count : 0.0;
}

// views::zip_transform: apply a function element-wise across paired ranges.
// Compute per-tick realised return: log(trade[i].price / trade[i-1].price)
std::vector<double> log_returns(const std::vector<Trade>& trades) {
    auto prev = trades | std::views::take(trades.size() - 1);
    auto curr = trades | std::views::drop(1);
    std::vector<double> ret;
    ret.reserve(trades.size() - 1);
    for (auto&& [p, c] : std::views::zip(prev, curr))
        ret.push_back(std::log(c.price / p.price));
    return ret;
}

int main() {
    std::vector<Quote> quotes = {{99.9, 100.1}, {99.8, 100.2}};
    std::vector<Trade> trades = {{100.05, 50},  {99.85,  100}};
    double eff = average_effective_spread(quotes, trades);
    auto   lr  = log_returns(trades);
    (void)eff; (void)lr;
}`,
    explanation:
      "views::zip eliminates the hand-rolled index loop over parallel vectors, which is both error-prone and harder for the compiler to vectorise. Since zip is lazy, the quote and trade vectors never need to be merged into a single struct — memory layout stays optimal for each stream independently.",
  },
  {
    id: "cpp-20260526-b1-source-location",
    language: "cpp",
    title: "std::source_location (C++20) — zero-overhead structured logging",
    tag: "stl",
    code: `#include <source_location>
#include <string_view>
#include <cstdio>
#include <cstdint>

// std::source_location: captures file, function, line at the CALL SITE
// without macros. The default argument is evaluated at the call site,
// so you get the caller's location, not the logger's.
enum class LogLevel : std::uint8_t { DEBUG, INFO, WARN, ERROR };

void log(std::string_view msg,
         LogLevel lvl = LogLevel::INFO,
         std::source_location loc = std::source_location::current()) {
    constexpr const char* names[] = {"DEBUG","INFO","WARN","ERROR"};
    std::fprintf(stderr, "[%s] %s:%d  %.*s\\n",
                 names[static_cast<int>(lvl)],
                 loc.file_name(),
                 loc.line(),
                 static_cast<int>(msg.size()), msg.data());
}

// Typed log helpers — each macro-free.
template <typename... Args>
void log_warn(std::string_view msg,
              std::source_location loc = std::source_location::current()) {
    log(msg, LogLevel::WARN, loc);
}

// Risk check that logs the call site on breach.
bool check_position(int pos, int limit,
                    std::source_location loc = std::source_location::current()) {
    if (pos > limit) {
        log("position limit breached", LogLevel::ERROR, loc);
        return false;
    }
    return true;
}

int main() {
    log("feed connected");                         // file + line auto-captured
    log_warn("latency spike detected");
    check_position(1500, 1000);                    // logs THIS line number
}`,
    explanation:
      "Before C++20, structured logging required ugly __FILE__/__LINE__ macros. std::source_location as a default argument is evaluated at the call site at compile time — zero runtime overhead, and the function signature clearly documents the intent. Particularly valuable in risk and monitoring code where you need to trace which strategy module triggered an alert.",
  },
  {
    id: "cpp-20260526-b1-views-chunk",
    language: "cpp",
    title: "std::views::chunk (C++23) — batch order processing",
    tag: "stl",
    code: `#include <ranges>
#include <vector>
#include <numeric>
#include <cstdint>

struct Order { std::uint64_t id; double price; std::uint32_t qty; };

// views::chunk (C++23): lazily splits a range into fixed-size sub-ranges.
// No copies — each chunk is a view into the original buffer.
// Ideal for batch-throttled order submission (N orders per burst).
void process_in_batches(const std::vector<Order>& orders,
                         std::size_t batch_size) {
    for (auto batch : orders | std::views::chunk(batch_size)) {
        // 'batch' is a view over at most batch_size orders.
        double total_notional = 0.0;
        for (auto& o : batch)
            total_notional += o.price * o.qty;
        // Submit batch over network, log aggregate notional, etc.
        (void)total_notional;
    }
}

// views::chunk_by: split on a predicate (e.g., split by symbol).
void process_by_symbol(std::vector<Order> orders) {
    // Sort by symbol id (simulate with id / 1000).
    std::ranges::sort(orders, {}, [](const Order& o){ return o.id / 1000; });

    for (auto run : orders
                  | std::views::chunk_by([](const Order& a, const Order& b){
                        return (a.id / 1000) == (b.id / 1000);   // same symbol bucket
                    })) {
        std::size_t cnt = std::ranges::distance(run);
        (void)cnt;
    }
}

int main() {
    std::vector<Order> book;
    for (std::uint64_t i = 0; i < 100; ++i)
        book.push_back({i, 100.0 + i, 10});
    process_in_batches(book, 10);   // 10 batches of 10
    process_by_symbol(book);
}`,
    explanation:
      "views::chunk eliminates the manual i += batch_size loop that is error-prone when the last chunk is smaller than the others. chunk_by is the generalisation that splits on any transition predicate — equivalent to SQL GROUP BY on a sorted sequence, without materialising the groups in memory.",
  },
  {
    id: "cpp-20260526-b1-swap-bootstrap",
    language: "cpp",
    title: "Swap curve bootstrap — deposit and swap rates to ZC discount factors",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <stdexcept>

// Bootstrap the zero-coupon discount curve from market rates.
// Short end: deposit rates (add_deposit: single cash flow at maturity).
// Long end: par swap rates (add_swap: iterative stripping from the short end).
// All rates are continuously-compounded unless stated.

struct DiscountCurve {
    struct Node { double t; double df; };   // time (years) and discount factor
    std::vector<Node> nodes;

    void add_deposit(double t, double rate) {
        // Deposit: ZC rate; df = exp(-r * t)
        nodes.push_back({t, std::exp(-rate * t)});
    }

    // Interpolate discount factor (linear on log(df), i.e. piece-wise flat ZC rate).
    double df(double t) const {
        if (nodes.empty()) return std::exp(-0.03 * t);  // flat fallback
        if (t <= nodes.front().t) return nodes.front().df;
        if (t >= nodes.back().t)  return nodes.back().df;
        for (std::size_t i = 1; i < nodes.size(); ++i) {
            if (t <= nodes[i].t) {
                double a = (t - nodes[i-1].t) / (nodes[i].t - nodes[i-1].t);
                return std::exp(
                    (1-a)*std::log(nodes[i-1].df) + a*std::log(nodes[i].df));
            }
        }
        return nodes.back().df;
    }

    // Add a par-swap rate: fixed leg pays annually; floating resets annually.
    // Bootstrap: solve for df(T) such that PV(fixed) = PV(floating).
    // PV(floating) = 1 - df(T) (ignores spreads).
    // PV(fixed) = sum_{i=1..n} rate * df(t_i) + df(T) [principal].
    // => df(T) = (1 - rate * sum_{i=1..n-1} df(t_i)) / (1 + rate)
    void add_swap(double maturity_yrs, double par_rate) {
        int n = static_cast<int>(std::round(maturity_yrs));  // annual payments
        double annuity = 0.0;
        for (int i = 1; i < n; ++i)
            annuity += df(static_cast<double>(i));
        double dfT = (1.0 - par_rate * annuity) / (1.0 + par_rate);
        nodes.push_back({maturity_yrs, dfT});
        // Keep nodes sorted by time.
        std::sort(nodes.begin(), nodes.end(), [](auto& a, auto& b){ return a.t < b.t; });
    }

    double zero_rate(double t) const {
        double d = df(t);
        return d > 0.0 ? -std::log(d) / t : 0.0;
    }
};

int main() {
    DiscountCurve curve;
    curve.add_deposit(0.25, 0.052);   // 3M deposit 5.2%
    curve.add_deposit(0.50, 0.053);   // 6M deposit 5.3%
    curve.add_swap(1.0,  0.054);      // 1Y par swap 5.4%
    curve.add_swap(2.0,  0.055);      // 2Y par swap 5.5%
    curve.add_swap(5.0,  0.056);      // 5Y par swap 5.6%

    for (double t : {0.5, 1.0, 2.0, 5.0})
        (void)curve.zero_rate(t);
}`,
    explanation:
      "Bootstrapping strips each new maturity from the shorter maturities already solved, building the curve iteratively without matrix inversion. The log-linear interpolation preserves positive forward rates between nodes — linear interpolation on discount factors allows negative forwards at steep portions of the curve.",
  },
  {
    id: "cpp-20260526-b1-cir-bond",
    language: "cpp",
    title: "Cox-Ingersoll-Ross (CIR) bond pricing — closed form",
    tag: "quant",
    code: `#include <cmath>
#include <vector>

// CIR short rate model: dr = kappa*(theta - r)*dt + sigma*sqrt(r)*dW
// Closed-form ZCB price P(0,T) = A(T)*exp(-B(T)*r0).
// Parameters: kappa (mean reversion), theta (long-run rate),
//             sigma (vol), r0 (initial rate).
// Ensures positive rates; chi-squared distribution for the short rate.
struct CIRModel {
    double kappa, theta, sigma, r0;

    double zcb_price(double T) const {
        double gamma = std::sqrt(kappa * kappa + 2.0 * sigma * sigma);
        double e_gT  = std::exp(gamma * T);

        // B(T) and A(T) from the Ricatti equation solution
        double B = 2.0 * (e_gT - 1.0)
                 / ((gamma + kappa) * (e_gT - 1.0) + 2.0 * gamma);

        double log_A =
            2.0 * kappa * theta / (sigma * sigma)
            * std::log(2.0 * gamma * std::exp(0.5 * (kappa + gamma) * T)
                       / ((gamma + kappa) * (e_gT - 1.0) + 2.0 * gamma));

        return std::exp(log_A - B * r0);
    }

    double zero_rate(double T) const {
        double p = zcb_price(T);
        return (p > 0.0) ? -std::log(p) / T : 0.0;
    }

    // Monte Carlo simulation: Milstein scheme to keep r > 0.
    // Reflection at 0: r_next = max(r_prev + drift + diffusion, 0).
    std::vector<double> simulate_path(double T, int steps, double seed_z = 0.5) const {
        double dt  = T / steps;
        std::vector<double> path(steps + 1);
        path[0] = r0;
        for (int i = 0; i < steps; ++i) {
            double r  = std::max(path[i], 0.0);
            double dW = seed_z * std::sqrt(dt);   // deterministic demo; use RNG in prod
            double drift = kappa * (theta - r) * dt;
            double diff  = sigma * std::sqrt(r) * dW;
            double milstein_correction = 0.25 * sigma * sigma * (dW * dW - dt);
            path[i+1] = std::max(r + drift + diff + milstein_correction, 0.0);
        }
        return path;
    }
};

int main() {
    CIRModel cir{2.0, 0.05, 0.1, 0.04};   // fast mean reversion, 5% long-run, 10% vol
    for (double T : {1.0, 2.0, 5.0, 10.0})
        (void)cir.zcb_price(T);
}`,
    explanation:
      "CIR is the first affine term-structure model to guarantee positive interest rates — the square-root diffusion prevents the rate from becoming negative (the Feller condition 2κθ > σ² ensures zero is inaccessible). Its closed-form A, B functions make bond pricing instantaneous, unlike the Hull-White model which requires numerical integration for non-constant parameters.",
  },
  {
    id: "cpp-20260526-b1-dupire-local-vol",
    language: "cpp",
    title: "Dupire local vol surface from market implied vols",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <functional>

// Dupire (1994): local vol sigma_L(K,T)^2 from the implied vol surface sigma(K,T).
// sigma_L^2 = (d(C)/dT + r*K*d(C)/dK) / (0.5*K^2*d^2(C)/dK^2)
// Equivalent form in terms of total implied variance w = sigma^2 * T:
//   sigma_L^2 = dw/dT / (1 - y/w*dw/dy + 0.25*(-0.25 - 1/w + y/w)*(dw/dy)^2 + 0.5*d^2w/dy^2)
// where y = ln(K / F).  This avoids butterfly-arbitrage violations.
// Here we compute numerically from a grid of Black implied vols.
struct DupireSurface {
    std::vector<double> strikes;   // grid of strikes
    std::vector<double> tenors;    // grid of tenors
    // impvol[i*n_K + k] = sigma(T_i, K_k)
    std::vector<double> impvol;

    double local_vol(int t_idx, int k_idx, double F, double r) const {
        int nK = static_cast<int>(strikes.size());
        auto at = [&](int ti, int ki) -> double {
            ti = std::max(0, std::min(ti, static_cast<int>(tenors.size())-1));
            ki = std::max(0, std::min(ki, nK - 1));
            return impvol[ti * nK + ki];
        };
        double T  = tenors[t_idx];
        double K  = strikes[k_idx];
        double w  = at(t_idx, k_idx) * at(t_idx, k_idx) * T;  // total variance

        // Numerical derivatives via finite differences
        double dT = (t_idx + 1 < (int)tenors.size())
                    ? tenors[t_idx+1] - tenors[t_idx] : tenors[t_idx] - tenors[t_idx-1];
        double dK = (k_idx + 1 < nK)
                    ? strikes[k_idx+1] - strikes[k_idx] : strikes[k_idx] - strikes[k_idx-1];

        double w_Tp1 = at(t_idx+1,k_idx) * at(t_idx+1,k_idx) * tenors[t_idx+1];
        double dw_dT = (w_Tp1 - w) / dT;

        double w_Kp1 = at(t_idx,k_idx+1) * at(t_idx,k_idx+1) * T;
        double w_Km1 = at(t_idx,k_idx-1) * at(t_idx,k_idx-1) * T;
        double dw_dK  = (w_Kp1 - w_Km1) / (2.0 * dK);
        double d2w_dK2= (w_Kp1 - 2.0*w + w_Km1) / (dK * dK);

        double y  = std::log(K / F);
        double g  = 1.0 - y * dw_dK / w
                  + 0.25 * (-0.25 - 1.0/w + y*y/(w*w)) * dw_dK * dw_dK
                  + 0.5  * d2w_dK2;
        if (g <= 0.0) return at(t_idx, k_idx);   // degenerate guard
        return std::sqrt(dw_dT / g) / std::sqrt(T);
    }
};`,
    explanation:
      "Dupire's formula inverts the market's risk-neutral density from option prices: a unique local-vol function makes the stock process consistent with all observed European option prices. In practice, the numerical derivatives amplify smile interpolation noise — spline-fitting the implied vol surface before applying finite differences is mandatory to avoid negative local variances.",
  },
  {
    id: "cpp-20260526-b1-merton-mc",
    language: "cpp",
    title: "Merton jump-diffusion Monte Carlo",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <algorithm>

// Merton (1976) jump-diffusion: dS/S = (mu - lambda*kappa_j)*dt + sigma*dW
//                                      + (exp(J) - 1) for Poisson jumps.
// J ~ N(mu_j, sigma_j^2); lambda = jump arrival rate.
// Price a European call by simulation including jump compensation drift.
double merton_call(double S, double K, double r,
                   double sigma, double T,
                   double lambda,  // jump intensity (jumps/year)
                   double mu_j,    // mean log-jump
                   double sigma_j, // std of log-jump
                   int n_paths, unsigned seed = 42) {
    std::mt19937_64           rng(seed);
    std::normal_distribution<> ndist;
    std::poisson_distribution<int> poisson(lambda * T);

    // Jump compensation: E[exp(J)-1] = exp(mu_j + 0.5*sigma_j^2) - 1
    double kappa_j  = std::exp(mu_j + 0.5 * sigma_j * sigma_j) - 1.0;
    double drift    = (r - 0.5 * sigma * sigma - lambda * kappa_j) * T;
    double diffusion = sigma * std::sqrt(T);

    double payoff_sum = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        // Diffusive component (GBM)
        double log_S = drift + diffusion * ndist(rng);

        // Poisson jump component: draw number of jumps in [0,T]
        int n_jumps = poisson(rng);
        for (int j = 0; j < n_jumps; ++j)
            log_S += mu_j + sigma_j * ndist(rng);   // add log-jump

        double ST = S * std::exp(log_S);
        payoff_sum += std::max(ST - K, 0.0);
    }
    return std::exp(-r * T) * payoff_sum / n_paths;
}

int main() {
    // lambda=0.1 (avg 1 jump per 10 years), mu_j=-0.1 (10% avg down-jump),
    // sigma_j=0.2 (jump size std dev).
    double price = merton_call(100, 100, 0.05, 0.2, 1.0, 0.1, -0.1, 0.2, 200000);
    (void)price;   // slightly above Black-Scholes due to volatility smile
}`,
    explanation:
      "Merton's model adds a compound Poisson jump process to GBM, generating a leptokurtic (fat-tailed) return distribution that better fits the observed implied-vol smile. The jump compensation term λκⱼ in the drift keeps the process risk-neutral. Merton gives a semi-closed form (infinite sum of Black-Scholes prices weighted by Poisson probabilities), but MC is simpler to extend to path-dependent payoffs.",
  },
  {
    id: "cpp-20260526-b1-inflation-bond",
    language: "cpp",
    title: "Inflation-indexed bond pricing (TIPS-style)",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// TIPS (Treasury Inflation-Protected Securities):
// Principal is adjusted by CPI; coupon = real_coupon_rate * adjusted_principal.
// Price = sum(coupon_i * I(t_i)/I(0) * df(t_i)) + notional * I(T)/I(0) * df(T)
// where I(t) = CPI index at time t, df = nominal discount factor.
// Break-even inflation: implied CPI growth rate where TIPS = nominal bond price.
struct TIPSBond {
    double notional   = 1000.0;
    double real_rate  = 0.015;    // real coupon rate
    double maturity   = 10.0;     // years
    int    freq       = 2;        // semi-annual coupons
    double I0         = 300.0;    // base CPI at issuance

    // Price given expected CPI index path and nominal discount curve.
    double price(const std::vector<double>& cpi_path,    // CPI at each coupon date
                 const std::vector<double>& discount_factors) const {
        int n = static_cast<int>(maturity * freq);
        if (cpi_path.size() != static_cast<size_t>(n) ||
            discount_factors.size() != static_cast<size_t>(n))
            return 0.0;

        double coupon_real = notional * real_rate / freq;
        double pv = 0.0;
        for (int i = 0; i < n; ++i) {
            double index_ratio = cpi_path[i] / I0;       // inflation accrual
            double adj_coupon  = coupon_real * index_ratio;
            pv += adj_coupon * discount_factors[i];
        }
        // Final principal repayment (also indexed, min 1 for deflation floors)
        double adj_principal = notional * std::max(cpi_path.back() / I0, 1.0);
        pv += adj_principal * discount_factors.back();
        return pv;
    }

    // Break-even inflation: CPI growth rate g such that TIPS price = nominal bond price.
    double break_even_inflation(double nominal_price,
                                const std::vector<double>& discount_factors) const {
        // Binary search on g.
        double lo = -0.05, hi = 0.20;
        int    n  = static_cast<int>(maturity * freq);
        for (int iter = 0; iter < 80; ++iter) {
            double g = 0.5 * (lo + hi);
            std::vector<double> cpi(n);
            for (int i = 0; i < n; ++i)
                cpi[i] = I0 * std::pow(1.0 + g, (i+1.0) / freq);
            double tips_px = price(cpi, discount_factors);
            (tips_px > nominal_price) ? (hi = g) : (lo = g);
        }
        return 0.5 * (lo + hi);
    }
};`,
    explanation:
      "TIPS embed a deflation floor — the principal paid at maturity cannot fall below par, creating an implicit option on CPI. Break-even inflation is the market's implied long-run CPI growth; when actual inflation exceeds break-even, TIPS outperform nominal bonds. Traders monetise this view via inflation swaps rather than physical TIPS to avoid the illiquidity premium.",
  },
  {
    id: "cpp-20260526-b1-wilder-rsi",
    language: "cpp",
    title: "Wilder RSI streaming calculator (O(1) per tick)",
    tag: "quant",
    code: `#include <cmath>
#include <stdexcept>

// RSI (Relative Strength Index, Wilder 1978):
// RS = avg_gain / avg_loss (Wilder's smoothing = EMA with alpha=1/N)
// RSI = 100 - 100 / (1 + RS)
// Commonly used as an overbought/oversold indicator; also as a filter for
// mean-reversion signals (short RSI>70, long RSI<30).
class WilderRSI {
    int    period_;
    double avg_gain_ = 0.0;
    double avg_loss_ = 0.0;
    double prev_px_  = 0.0;
    int    bars_seen_ = 0;
    double alpha_;   // = 1.0 / period (Wilder's smoothing factor)

public:
    explicit WilderRSI(int period) : period_(period), alpha_(1.0 / period) {
        if (period < 2) throw std::invalid_argument("period must be >= 2");
    }

    // Feed a new close price; returns RSI (0-100) or -1 if still warming up.
    double update(double close) {
        if (bars_seen_ == 0) {
            prev_px_ = close;
            ++bars_seen_;
            return -1.0;
        }
        double change = close - prev_px_;
        double gain   = (change > 0) ? change : 0.0;
        double loss   = (change < 0) ? -change : 0.0;
        prev_px_ = close;

        if (bars_seen_ < period_) {
            // Accumulate raw sums for the seed average.
            avg_gain_ += gain;
            avg_loss_ += loss;
            ++bars_seen_;
            if (bars_seen_ == period_) {
                avg_gain_ /= period_;
                avg_loss_ /= period_;
                return compute_rsi();
            }
            return -1.0;
        }
        // Wilder's smoothing: new_avg = alpha * current + (1 - alpha) * prev_avg
        avg_gain_ = alpha_ * gain + (1.0 - alpha_) * avg_gain_;
        avg_loss_ = alpha_ * loss + (1.0 - alpha_) * avg_loss_;
        ++bars_seen_;
        return compute_rsi();
    }

private:
    double compute_rsi() const {
        if (avg_loss_ < 1e-14) return 100.0;
        double rs = avg_gain_ / avg_loss_;
        return 100.0 - 100.0 / (1.0 + rs);
    }
};`,
    explanation:
      "Wilder's smoothing is an EMA with a specific decay factor (1/N), giving more weight to recent gains/losses than a simple rolling average. RSI above 70 or below 30 classifies the asset as overbought/oversold in trend-following frameworks, but in mean-reverting markets the opposite holds — RSI extremes signal entry points. Always validate against your actual market regime before trading on it.",
  },
  {
    id: "cpp-20260526-b1-ewma-zscore",
    language: "cpp",
    title: "EWMA Z-score mean-reversion signal",
    tag: "quant",
    code: `#include <cmath>

// EWMA mean and variance for a streaming mid-price series.
// Z-score = (price - ewma_mean) / sqrt(ewma_variance).
// Z > +2: price is above its recent average -> potential short signal.
// Z < -2: price is below average -> potential long signal.
// Half-life hl satisfies: alpha = 1 - exp(-ln2 / hl).
class EwmaZScore {
    double alpha_;
    double mu_   = 0.0;    // EWMA mean
    double var_  = 0.001;  // EWMA variance (seeded to avoid /0 early on)
    bool   init_ = false;

public:
    explicit EwmaZScore(double halflife_bars) {
        alpha_ = 1.0 - std::exp(-std::log(2.0) / halflife_bars);
    }

    // Returns z-score (zero until first observation).
    double update(double price) {
        if (!init_) {
            mu_   = price;
            init_ = true;
            return 0.0;
        }
        double dev  = price - mu_;
        // Update mean first, then variance (standard online EWMA).
        mu_  += alpha_ * dev;
        var_  = (1.0 - alpha_) * (var_ + alpha_ * dev * dev);
        double std = std::sqrt(var_);
        return (std > 1e-12) ? dev / std : 0.0;
    }

    double mean()   const { return mu_; }
    double stddev() const { return std::sqrt(var_); }

    // Signal: +1 short, -1 long, 0 flat.
    int signal(double price, double entry_z = 2.0, double exit_z = 0.5) {
        double z = update(price);
        if (z >  entry_z) return -1;   // overbought
        if (z < -entry_z) return  1;   // oversold
        if (std::abs(z) < exit_z) return 0;
        return 0;  // stay flat within exit zone
    }
};`,
    explanation:
      "EWMA Z-score adapts to regime shifts within one halflife rather than requiring a fixed lookback window to roll off. The variance update uses the squared deviation from the old mean (not the new), which is the correct online EWMA covariance formula. Setting halflife around 20-60 bars is typical for intraday mean-reversion — longer halflives favour trend-following and lose the mean-reversion signal.",
  },
  {
    id: "cpp-20260526-b1-twap-slicer",
    language: "cpp",
    title: "TWAP execution slicer — uniform time-bucket distribution",
    tag: "quant",
    code: `#include <cstdint>
#include <vector>
#include <algorithm>
#include <cassert>

// TWAP (Time-Weighted Average Price) slicer:
// Split a parent order of size S into N uniform time buckets.
// Optionally randomise slice size within a band to reduce market impact.
// Remaining quantity is accumulated if a slice cannot be filled.
struct TwapSlice {
    std::int64_t start_ns;   // bucket start in epoch nanoseconds
    std::int64_t end_ns;
    std::uint32_t target_qty;
};

class TwapSlicer {
    std::uint32_t total_qty_;
    int           n_slices_;
    std::int64_t  start_ns_, end_ns_;

public:
    TwapSlicer(std::uint32_t qty, int n, std::int64_t start, std::int64_t end)
        : total_qty_(qty), n_slices_(n), start_ns_(start), end_ns_(end) {
        assert(n > 0 && start < end && qty > 0);
    }

    std::vector<TwapSlice> build() const {
        std::vector<TwapSlice> slices(n_slices_);
        std::uint64_t bucket_ns  = (end_ns_ - start_ns_) / n_slices_;
        std::uint32_t base_qty   = total_qty_ / n_slices_;
        std::uint32_t remainder  = total_qty_ % n_slices_;  // add to first slices

        for (int i = 0; i < n_slices_; ++i) {
            slices[i].start_ns   = start_ns_ + i * static_cast<std::int64_t>(bucket_ns);
            slices[i].end_ns     = slices[i].start_ns + static_cast<std::int64_t>(bucket_ns);
            slices[i].target_qty = base_qty + (i < static_cast<int>(remainder) ? 1 : 0);
        }
        slices.back().end_ns = end_ns_;   // snap last bucket to exact end time
        return slices;
    }

    // On fill confirmation: reduce remaining quantity.
    // If slice underfills, carry-forward qty to next slice.
    static std::uint32_t carryforward(
            const TwapSlice& slice, std::uint32_t filled, std::uint32_t carry) {
        std::uint32_t needed = slice.target_qty + carry;
        return (needed > filled) ? (needed - filled) : 0;
    }
};`,
    explanation:
      "TWAP minimises market impact by spreading the order across time. The integer division remainder distributes the leftover lots to the first slices (rather than the last) to avoid end-of-period urgency that would push up execution price. In practice, TWAP strategies randomise slice sizes by ±10-20% of the target to prevent other algos from predicting and front-running the order flow.",
  },
  {
    id: "cpp-20260526-b1-sobol",
    language: "cpp",
    title: "Sobol low-discrepancy sequence (first two dimensions) for quasi-MC",
    tag: "quant",
    code: `#include <cstdint>
#include <vector>
#include <cmath>
#include <array>

// Sobol sequence (Joe & Kuo direction numbers):
// A low-discrepancy sequence that fills the unit hypercube more uniformly
// than pseudo-random numbers. For a d-dimensional European option MC,
// quasi-random samples converge as O(log(N)^d / N) vs O(1/sqrt(N)).
// Below: 2D Sobol (d=2) using the standard direction numbers.

class Sobol2D {
    static constexpr int BITS = 30;
    // Direction numbers for dimension 2 (primitive polynomial x + 1)
    std::array<std::uint32_t, BITS> V1{};   // dim 1 = Van der Corput in base 2
    std::array<std::uint32_t, BITS> V2{};   // dim 2

    std::uint32_t x1_{0}, x2_{0};
    std::uint32_t idx_{0};
    static constexpr double NORM = 1.0 / (1U << BITS);

    static int rightmost_zero(std::uint32_t n) {
        int c = 0;
        while (n & 1) { n >>= 1; ++c; }
        return c;
    }

public:
    Sobol2D() {
        // Initialise direction numbers for dimension 1 (Gray code path)
        for (int i = 0; i < BITS; ++i) V1[i] = 1U << (BITS - 1 - i);

        // Direction numbers for dim 2 (primitive poly x+1, s=1, a=0)
        V2[0] = 1U << (BITS - 1);
        for (int i = 1; i < BITS; ++i)
            V2[i] = V2[i-1] ^ (V2[i-1] >> 1);  // recurrence for degree-1 poly
    }

    // Return next point in [0,1)^2.
    std::pair<double,double> next() {
        int c = rightmost_zero(idx_++);
        if (c >= BITS) c = BITS - 1;
        x1_ ^= V1[c];
        x2_ ^= V2[c];
        return {x1_ * NORM, x2_ * NORM};
    }
};

// European call via quasi-MC with 2D Sobol (one factor: log-price at T).
double sobol_call(double S, double K, double r, double sigma, double T, int N) {
    Sobol2D sob;
    double drift    = (r - 0.5 * sigma * sigma) * T;
    double diffusion = sigma * std::sqrt(T);
    double sum = 0.0;
    for (int i = 0; i < N; ++i) {
        auto [u, _] = sob.next();
        // Inverse normal CDF via Beasley-Springer-Moro approximation
        double z = (u < 0.5) ? -std::log(-std::log(1.0 - u + 1e-12))
                              :  std::log(-std::log(u + 1e-12));  // crude approx
        double ST = S * std::exp(drift + diffusion * z);
        sum += std::max(ST - K, 0.0);
    }
    return std::exp(-r * T) * sum / N;
}`,
    explanation:
      "Sobol sequences are the industry standard for quasi-Monte Carlo option pricing. The convergence rate improvement from O(1/√N) to O((log N)^d/N) is dramatic for low dimensions (d ≤ 5): 10,000 Sobol points can match the accuracy of 1,000,000 pseudo-random points for a plain vanilla call. For high-dimensional path-dependent options, use Brownian bridge construction to align the most important dimensions with the best Sobol dimensions.",
  },
  {
    id: "cpp-20260526-b1-matrix-power",
    language: "cpp",
    title: "Matrix exponentiation for n-step Markov chain pricing",
    tag: "quant",
    code: `#include <vector>
#include <cmath>

// Matrix multiplication (n×n square matrices in row-major flat vector).
using Mat = std::vector<double>;

Mat mat_mul(const Mat& A, const Mat& B, int n) {
    Mat C(n * n, 0.0);
    for (int i = 0; i < n; ++i)
        for (int k = 0; k < n; ++k) {
            double a = A[i*n + k];
            if (a == 0.0) continue;
            for (int j = 0; j < n; ++j)
                C[i*n + j] += a * B[k*n + j];
        }
    return C;
}

// Repeated squaring: A^m in O(n^3 * log m) instead of O(n^3 * m).
Mat mat_pow(Mat A, int n, long long m) {
    Mat result(n * n, 0.0);
    for (int i = 0; i < n; ++i) result[i*n + i] = 1.0;  // identity
    while (m > 0) {
        if (m & 1) result = mat_mul(result, A, n);
        A = mat_mul(A, A, n);
        m >>= 1;
    }
    return result;
}

// Credit migration: probability of being in state j after m quarters, given state i.
// States: [AAA, AA, A, BBB, BB, B, CCC, Default].
std::vector<double> migrate(const Mat& transition, int n, int start_state, int steps) {
    Mat P = mat_pow(transition, n, steps);
    std::vector<double> prob(n);
    for (int j = 0; j < n; ++j)
        prob[j] = P[start_state * n + j];
    return prob;
}

int main() {
    // 3-state model: {Good, Watch, Default}
    int n = 3;
    Mat T = {
        0.90, 0.09, 0.01,   // Good -> ...
        0.05, 0.80, 0.15,   // Watch -> ...
        0.00, 0.00, 1.00    // Default (absorbing)
    };
    auto p5 = migrate(T, n, 0, 20);   // prob of each state after 20 quarters
    (void)p5;
}`,
    explanation:
      "Matrix exponentiation computes the n-step transition probabilities for any Markov chain in O(k³ log n) versus O(k³ n) for naive multiplication. Credit migration matrices from Moody's or S&P give quarterly 1-step transitions; matrix power gives the multi-year default probabilities needed for CLO tranche pricing and CVA computation.",
  },
  {
    id: "cpp-20260526-b1-bidirectional-map",
    language: "cpp",
    title: "Bidirectional map for symbol ↔ internal ID routing",
    tag: "design",
    code: `#include <unordered_map>
#include <string>
#include <optional>
#include <cstdint>
#include <stdexcept>

// A bidirectional map for O(1) lookup in both directions.
// Use case: feed handler receives a string symbol; strategy needs an integer
// slot index for array-based position tracking; confirmations arrive with
// the integer slot and need the symbol for logging.
class BiMap {
    std::unordered_map<std::string,   std::uint32_t> fwd_;  // symbol -> id
    std::unordered_map<std::uint32_t, std::string>   rev_;  // id -> symbol

public:
    // Insert a new (symbol, id) pair. Throws if either key already exists.
    void insert(const std::string& sym, std::uint32_t id) {
        if (fwd_.count(sym) || rev_.count(id))
            throw std::invalid_argument("BiMap: duplicate key");
        fwd_.emplace(sym, id);
        rev_.emplace(id, sym);
    }

    std::optional<std::uint32_t> lookup_id(const std::string& sym) const {
        auto it = fwd_.find(sym);
        return (it != fwd_.end()) ? std::optional{it->second} : std::nullopt;
    }

    std::optional<std::string> lookup_sym(std::uint32_t id) const {
        auto it = rev_.find(id);
        return (it != rev_.end()) ? std::optional{it->second} : std::nullopt;
    }

    // Erase by symbol (also removes the reverse entry).
    bool erase(const std::string& sym) {
        auto it = fwd_.find(sym);
        if (it == fwd_.end()) return false;
        rev_.erase(it->second);
        fwd_.erase(it);
        return true;
    }

    std::size_t size() const { return fwd_.size(); }
};

int main() {
    BiMap m;
    m.insert("AAPL", 0);
    m.insert("MSFT", 1);
    auto id  = m.lookup_id("AAPL");    // optional{0}
    auto sym = m.lookup_sym(1);        // optional{"MSFT"}
    (void)id; (void)sym;
}`,
    explanation:
      "Two unordered_maps maintained in sync is the simplest correct bidirectional map — Boost.Bimap exists but is rarely worth the dependency. The critical invariant is that every insert and erase updates both maps atomically in the same function; any caller touching only fwd_ or rev_ directly will create inconsistency. The optional return avoids the 'exception vs sentinel' debate for lookups.",
  },
  {
    id: "cpp-20260526-b1-transform-reduce",
    language: "cpp",
    title: "std::transform_reduce — parallel portfolio Greeks aggregation",
    tag: "stl",
    code: `#include <numeric>
#include <execution>
#include <vector>
#include <cmath>

// std::transform_reduce (C++17): map each element to a value, then reduce.
// Equivalent to transform + accumulate but expressly parallelisable.
// With par_unseq policy: runs on all available threads + SIMD in one pass.
struct Option {
    double S, K, r, sigma, T, notional;
};

struct Greeks { double delta, vega, gamma; };

// Per-option delta (Black-Scholes normal CDF of d1).
Greeks calc_greeks(const Option& o) noexcept {
    double sT = o.sigma * std::sqrt(o.T);
    double d1 = (std::log(o.S / o.K) + (o.r + 0.5 * o.sigma * o.sigma) * o.T) / sT;
    double nd1 = 0.5 * std::erfc(-d1 / std::sqrt(2.0));  // N(d1)
    double pdf = std::exp(-0.5 * d1 * d1) / std::sqrt(2.0 * M_PI);
    return {
        nd1    * o.notional,                    // delta
        o.S * pdf * std::sqrt(o.T) * o.notional,// vega
        pdf / (o.S * sT) * o.notional           // gamma
    };
}

// Aggregate portfolio Greeks in one parallel pass.
Greeks portfolio_greeks(const std::vector<Option>& book) {
    return std::transform_reduce(
        std::execution::par_unseq,
        book.begin(), book.end(),
        Greeks{0, 0, 0},                      // identity
        [](Greeks a, Greeks b) noexcept {     // reduce: pairwise sum
            return Greeks{a.delta + b.delta, a.vega + b.vega, a.gamma + b.gamma};
        },
        calc_greeks                            // transform: option -> Greeks
    );
}

int main() {
    std::vector<Option> book(10000, {100, 100, 0.05, 0.2, 1.0, 1.0});
    auto [net_delta, net_vega, net_gamma] = portfolio_greeks(book);
    (void)net_delta; (void)net_vega; (void)net_gamma;
}`,
    explanation:
      "transform_reduce makes the parallelism intent explicit in the type system: the compiler and runtime know the reduce operator is associative (addition) and can split the work across threads at any granularity. Compared to a hand-written parallel for + atomic accumulator, this composes safely with execution policies and avoids the synchronisation overhead of fine-grained atomic updates.",
  },
  {
    id: "cpp-20260526-b1-blacks-bond-option",
    language: "cpp",
    title: "Black's model for bond options and European swaptions",
    tag: "quant",
    code: `#include <cmath>

// Black's (1976) model: prices European options on forward prices/rates.
// Assumes the underlying (forward bond price or forward swap rate)
// follows dF = sigma * F * dW under the T-forward measure.
// Used for: cap/floor caplets, European swaptions, bond options.
double norm_cdf(double x) noexcept {
    return 0.5 * std::erfc(-x / std::sqrt(2.0));
}

// European call on a forward bond price F (or forward rate for cap/floor).
// F = forward price, K = strike, sigma = lognormal vol, T = option expiry,
// df = discount factor to expiry (P(0,T)).
double black76_call(double F, double K, double sigma, double T, double df) noexcept {
    double sT = sigma * std::sqrt(T);
    if (sT < 1e-14) return df * std::max(F - K, 0.0);
    double d1 = (std::log(F / K) + 0.5 * sT * sT) / sT;
    double d2 = d1 - sT;
    return df * (F * norm_cdf(d1) - K * norm_cdf(d2));
}

double black76_put(double F, double K, double sigma, double T, double df) noexcept {
    double sT = sigma * std::sqrt(T);
    if (sT < 1e-14) return df * std::max(K - F, 0.0);
    double d1 = (std::log(F / K) + 0.5 * sT * sT) / sT;
    double d2 = d1 - sT;
    return df * (K * norm_cdf(-d2) - F * norm_cdf(-d1));
}

// European payer swaption: option to enter a fixed-for-float swap paying fixed K.
// Annuity = sum of discount factors for each fixed-leg coupon date.
// Payer swaption ~ Black76 call on forward swap rate with notional = annuity.
double payer_swaption(double fwd_rate, double strike, double sigma,
                       double expiry, double annuity) noexcept {
    return annuity * black76_call(fwd_rate, strike, sigma, expiry, 1.0);
}

// Cap / floor from caplets (Black76 applied to each forward LIBOR/SOFR fixing).
double cap_price(const std::vector<double>& fwd_rates,
                 const std::vector<double>& dfs,
                 const std::vector<double>& sigmas,
                 const std::vector<double>& expiries,
                 double strike, double delta_t) {
    double total = 0.0;
    for (std::size_t i = 0; i < fwd_rates.size(); ++i) {
        // Caplet notional = delta_t (day-count fraction for the period)
        total += delta_t * dfs[i]
               * black76_call(fwd_rates[i], strike, sigmas[i], expiries[i], 1.0);
    }
    return total;
}`,
    explanation:
      "Black76 is to interest rate derivatives what Black-Scholes is to equity options: a closed-form formula under a different numeraire. The forward price/rate is the underlying; the discount factor to expiry plays the role of e^(-rT). For swaptions, the annuity factor (sum of coupon discount factors) converts the per-unit payoff into a dollar amount — this is the 'annuity numeraire' measure.",
  },
  {
    id: "cpp-20260526-b1-gamma-scalp",
    language: "cpp",
    title: "Gamma scalping P&L attribution (Theta + Gamma split)",
    tag: "quant",
    code: `#include <cmath>
#include <vector>

// A delta-hedged option portfolio earns P&L from:
//  Gamma P&L ≈ +0.5 * Gamma * (dS)^2     (positive for long gamma)
//  Theta P&L ≈ Theta * dt                  (negative for long gamma = time decay)
// If realised vol > implied vol: gamma P&L > theta loss -> net positive.
// Break-even: realised vol = implied vol (gamma P&L = theta loss at each step).
struct OptionState {
    double delta, gamma, theta, vega;
    double S;     // current spot
    double sigma; // implied vol used to price
};

struct PnlAttrib {
    double delta_pnl;   // from delta hedge residual
    double gamma_pnl;   // from convexity
    double theta_pnl;   // from time decay
    double vega_pnl;    // from vol change
    double total;
};

// P&L attribution for a one-step hedging interval.
// dS = spot change, dt = time step (years), d_sigma = vol change.
PnlAttrib attribute_pnl(const OptionState& opt, double dS, double dt, double d_sigma) {
    PnlAttrib p{};
    // First-order: delta * dS (ideally hedged to zero, but residual remains if hedge lagged)
    p.delta_pnl = opt.delta * dS;
    // Second-order convexity: 0.5 * Gamma * dS^2
    p.gamma_pnl = 0.5 * opt.gamma * dS * dS;
    // Time decay: theta * dt (theta in $/year; negative for long option)
    p.theta_pnl = opt.theta * dt;
    // Vol P&L: vega * d_sigma (change in mark-to-market from vol shift)
    p.vega_pnl  = opt.vega * d_sigma;
    p.total     = p.delta_pnl + p.gamma_pnl + p.theta_pnl + p.vega_pnl;
    return p;
}

// Simulate delta-hedge rolling across a price path.
std::vector<PnlAttrib> simulate_hedge(
        const std::vector<double>& prices,
        const std::vector<OptionState>& states, double dt) {
    std::vector<PnlAttrib> history;
    for (std::size_t i = 1; i < prices.size(); ++i) {
        double dS = prices[i] - prices[i-1];
        history.push_back(attribute_pnl(states[i-1], dS, dt, 0.0));
    }
    return history;
}`,
    explanation:
      "Gamma P&L versus theta is the core trade-off of a delta-hedged options book: you pay theta every night but collect gamma whenever the spot moves. The break-even condition 0.5 × Γ × σ_realised² × dt = |θ| × dt simplifies to σ_realised = σ_implied — this is why vol traders focus on whether the market will actually move as much as implied vol predicts.",
  },
  {
    id: "cpp-20260526-b1-quanto-adjust",
    language: "cpp",
    title: "Quanto option — foreign payoff in domestic currency",
    tag: "quant",
    code: `#include <cmath>

// A quanto option pays in domestic currency but is written on a foreign asset.
// Example: call on Nikkei 225 but payoff is in USD, not JPY.
// The correlation between the foreign stock (S_f) and FX rate (X = domestic/foreign)
// introduces a quanto adjustment to the drift of S_f under the domestic risk-neutral measure.
// Adjusted forward: F_quanto = S * exp((r_d - r_f - rho*sigma_S*sigma_X) * T)
// where rho = corr(dW_S, dW_X), sigma_S = stock vol, sigma_X = FX vol.
// Then price = standard BS call with the adjusted forward.
double norm_cdf(double x) noexcept { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }

double quanto_call(
        double S,         // foreign asset spot (in foreign CCY)
        double K,         // strike (in domestic CCY per unit of foreign asset)
        double r_d,       // domestic risk-free rate
        double r_f,       // foreign risk-free rate
        double sigma_S,   // foreign asset vol
        double sigma_X,   // FX vol (domestic/foreign)
        double rho,       // corr(asset, FX)
        double T) noexcept {
    // Quanto drift adjustment: -rho * sigma_S * sigma_X
    double drift_adj = r_d - r_f - rho * sigma_S * sigma_X;
    double F = S * std::exp(drift_adj * T);   // quanto-adjusted forward

    double sT = sigma_S * std::sqrt(T);
    double d1 = (std::log(F / K) + 0.5 * sigma_S * sigma_S * T) / sT;
    double d2 = d1 - sT;

    return std::exp(-r_d * T) * (F * norm_cdf(d1) - K * norm_cdf(d2));
}

int main() {
    // Nikkei call denominated in USD
    // rho = -0.3 (Nikkei often rises when USD/JPY falls = negative correlation)
    double c = quanto_call(
        /*S=*/28000,  /*K=*/28000,
        /*r_d=*/0.05, /*r_f=*/0.002,
        /*sigma_S=*/0.18, /*sigma_X=*/0.10, /*rho=*/-0.3,
        /*T=*/0.5);
    (void)c;
}`,
    explanation:
      "The quanto adjustment appears because the FX hedge to convert foreign P&L to domestic CCY introduces a correlation term in the drift. When rho < 0 (asset rises as domestic CCY weakens — typical for export-driven markets), the adjustment increases the effective drift and raises the quanto call price relative to the unhedged foreign call. Failing to include this adjustment misprices the risk by the full rho × σ_S × σ_X annual drag.",
  },
  {
    id: "cpp-20260526-b1-forward-rate-agree",
    language: "cpp",
    title: "Forward Rate Agreement (FRA) pricing and DV01",
    tag: "quant",
    code: `#include <cmath>
#include <vector>

// A Forward Rate Agreement locks in a borrowing/lending rate for a future period.
// Buyer pays fixed K, receives floating SOFR/LIBOR for [T1, T2].
// FRA value = notional * delta * (L - K) * df(T2)
//           where L = forward rate, delta = day-count fraction.
// L is bootstrapped from the discount curve: L = (df(T1)/df(T2) - 1) / delta.
struct FRA {
    double notional;
    double K;       // agreed fixed rate
    double T1;      // settlement date (years)
    double T2;      // maturity date
    double delta;   // day-count fraction = T2 - T1 (approx)
};

// Discount factor interpolator (piecewise-linear on log-df).
double interp_df(const std::vector<double>& times,
                 const std::vector<double>& dfs, double t) {
    if (t <= times.front()) return dfs.front();
    if (t >= times.back())  return dfs.back();
    for (std::size_t i = 1; i < times.size(); ++i) {
        if (t <= times[i]) {
            double a = (t - times[i-1]) / (times[i] - times[i-1]);
            return std::exp((1-a)*std::log(dfs[i-1]) + a*std::log(dfs[i]));
        }
    }
    return dfs.back();
}

double fra_pv(const FRA& fra,
              const std::vector<double>& times,
              const std::vector<double>& dfs) {
    double df1  = interp_df(times, dfs, fra.T1);
    double df2  = interp_df(times, dfs, fra.T2);
    double fwd_L = (df1 / df2 - 1.0) / fra.delta;  // forward SOFR rate
    // Discounted payoff paid at T2
    return fra.notional * fra.delta * (fwd_L - fra.K) * df2;
}

// DV01: present-value change per 1 bp parallel shift in the curve.
double fra_dv01(const FRA& fra,
                const std::vector<double>& times,
                std::vector<double> dfs) {
    double bump = 1e-4;                     // 1 bp
    for (auto& d : dfs) d *= std::exp(-bump * 1.0);  // approximate parallel shift
    double pv_up = fra_pv(fra, times, dfs);
    for (auto& d : dfs) d *= std::exp(+2 * bump * 1.0);
    double pv_dn = fra_pv(fra, times, dfs);
    return (pv_dn - pv_up) / 2.0;          // dollar value per 1 bp
}`,
    explanation:
      "A FRA is priced as the present value of the difference between the forward rate locked in at inception and the current fair forward rate. DV01 measures the sensitivity to a 1 bp parallel yield curve shift: for a 3-month FRA on $10M notional at 5%, DV01 ≈ $250 (= 10M × 0.0001 × 0.25). Stacking FRAs replicates a swap; a strip of Eurodollar/SOFR futures is the exchange-traded equivalent.",
  },
];
