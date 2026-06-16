import type { Snippet } from "./types";

export const cppSnippets20260616B1: Snippet[] = [
  {
    id: "cpp-20260616-b1-crtp-order",
    language: "cpp",
    title: "CRTP order mixin — zero-cost static polymorphism for order types",
    tag: "modern",
    code: `#include <cstdint>
#include <cmath>

// CRTP (Curiously Recurring Template Pattern): base class templated on the
// derived class. Enables static polymorphism — no vtable, no virtual dispatch.
// Critical for hot order-processing paths where virtual calls add ~5 ns overhead.

template<typename Derived>
class OrderBase {
public:
    // Dispatch to derived via static_cast — resolved at compile time
    double price()  const noexcept { return derived().price_impl(); }
    int    qty()    const noexcept { return derived().qty_impl(); }
    bool   is_buy() const noexcept { return derived().is_buy_impl(); }

    double notional() const noexcept { return price() * qty(); }

    // Non-virtual interface hook: derived can optionally override
    bool validate() const noexcept { return price() > 0.0 && qty() > 0; }

private:
    const Derived& derived() const noexcept {
        return static_cast<const Derived&>(*this);
    }
};

struct LimitOrder : OrderBase<LimitOrder> {
    double limit_px;
    int    shares;
    bool   buy;

    double price_impl()  const noexcept { return limit_px; }
    int    qty_impl()    const noexcept { return shares; }
    bool   is_buy_impl() const noexcept { return buy; }
};

struct MarketOrder : OrderBase<MarketOrder> {
    int  shares;
    bool buy;
    // Market orders have no price limit — return sentinel
    double price_impl()  const noexcept { return buy ? 1e18 : 0.0; }
    int    qty_impl()    const noexcept { return shares; }
    bool   is_buy_impl() const noexcept { return buy; }
};

// Generic function works with any CRTP order — no virtual call, fully inlined
template<typename O>
double computeNotional(const OrderBase<O>& o) noexcept {
    return o.notional();   // resolves to derived price() * qty() at compile time
}

// No vtable pointer: struct sizes are exactly the data members
static_assert(sizeof(LimitOrder) == sizeof(double) + sizeof(int) + sizeof(bool) + 3 /* padding */);`,
    explanation:
      "CRTP replaces virtual dispatch with a compile-time cast: `static_cast<const Derived*>(this)->price_impl()` is resolved at instantiation, so the compiler inlines it and the CPU never makes an indirect branch. The size assertion confirms no vtable pointer is added — a virtual base would add 8 bytes per object, and at millions of orders per second that extra cache pressure is measurable.",
  },
  {
    id: "cpp-20260616-b1-policy-book",
    language: "cpp",
    title: "Policy-based order book sides — injecting sort order as a template parameter",
    tag: "modern",
    code: `#include <map>
#include <deque>
#include <functional>
#include <optional>
#include <cstddef>

// Policy-based design: inject the comparator as a template parameter.
// BidBook uses std::greater (highest price first).
// AskBook uses std::less (lowest price first).
// One PriceLevel template serves both sides — zero code duplication.

template<typename ComparePolicy>
class PriceLevel {
    std::map<double, std::deque<int>, ComparePolicy> levels_;

public:
    void insert(double price, int order_id) {
        levels_[price].push_back(order_id);
    }

    bool remove(double price, int order_id) {
        auto it = levels_.find(price);
        if (it == levels_.end()) return false;
        auto& dq = it->second;
        for (auto dit = dq.begin(); dit != dq.end(); ++dit) {
            if (*dit == order_id) { dq.erase(dit); break; }
        }
        if (dq.empty()) levels_.erase(it);
        return true;
    }

    // O(1) best price via begin() on the sorted map
    std::optional<double> best() const noexcept {
        if (levels_.empty()) return std::nullopt;
        return levels_.begin()->first;
    }

    bool        empty()      const noexcept { return levels_.empty(); }
    std::size_t num_levels() const noexcept { return levels_.size(); }
};

// Two instantiations, zero runtime overhead — policy is an empty type
using BidBook = PriceLevel<std::greater<double>>;   // max at begin()
using AskBook = PriceLevel<std::less<double>>;      // min at begin()

// Usage:
// BidBook bids; AskBook asks;
// bids.insert(99.50, 1); bids.insert(100.00, 2);
// bids.best();  // 100.00  (highest bid)
// asks.insert(100.25, 3);
// asks.best();  // 100.25  (lowest ask)`,
    explanation:
      "std::greater and std::less are empty stateless classes — the compiler eliminates them entirely, generating the same code as if you had hardcoded the comparator. The policy approach is strictly superior to passing a runtime functor (std::function) for this use case because std::function adds a pointer indirection and can't be inlined, whereas the template policy is always inlined and allows the compiler to see the comparator's logic for additional optimisations like branch elimination.",
  },
  {
    id: "cpp-20260616-b1-fixed-price",
    language: "cpp",
    title: "Fixed-point price type — integer ticks with operator overloading",
    tag: "systems",
    code: `#include <cstdint>
#include <cmath>
#include <compare>
#include <string>
#include <sstream>
#include <iomanip>

// Fixed-point price: stores price as integer ticks to eliminate float rounding.
// Floating-point: 100.10 + 100.10 + 100.10 may NOT equal 300.30 in IEEE 754.
// Fixed-point: 10010 + 10010 + 10010 == 30030 — exact.
// TICK_DECIMALS = 2 → 1 tick = $0.01 (US equity standard).

template<int TICK_DECIMALS = 2>
class FixedPrice {
    std::int64_t ticks_;   // price × 10^TICK_DECIMALS

    static constexpr std::int64_t MULTIPLIER = [] {
        std::int64_t m = 1;
        for (int i = 0; i < TICK_DECIMALS; ++i) m *= 10;
        return m;
    }();

public:
    constexpr FixedPrice() noexcept : ticks_(0) {}
    constexpr explicit FixedPrice(std::int64_t ticks) noexcept : ticks_(ticks) {}

    static FixedPrice fromDouble(double d) noexcept {
        return FixedPrice(static_cast<std::int64_t>(std::llround(d * MULTIPLIER)));
    }

    double       toDouble()  const noexcept { return static_cast<double>(ticks_) / MULTIPLIER; }
    std::int64_t ticks()     const noexcept { return ticks_; }

    // Arithmetic stays in integer domain — no accumulation of rounding error
    constexpr FixedPrice operator+(const FixedPrice& o) const noexcept { return FixedPrice(ticks_ + o.ticks_); }
    constexpr FixedPrice operator-(const FixedPrice& o) const noexcept { return FixedPrice(ticks_ - o.ticks_); }
    constexpr FixedPrice operator*(std::int64_t n)       const noexcept { return FixedPrice(ticks_ * n); }

    // C++20 spaceship: single declaration provides all 6 comparisons
    constexpr auto operator<=>(const FixedPrice&) const noexcept = default;

    // Spread in ticks: ask.ticks_ - bid.ticks_ — exact integer subtraction
    constexpr std::int64_t spreadTicks(const FixedPrice& ask) const noexcept {
        return ask.ticks_ - ticks_;
    }

    std::string str() const {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(TICK_DECIMALS) << toDouble();
        return oss.str();
    }
};

using CentPrice = FixedPrice<2>;   // US equity: $100.25 → 10025
using PipPrice  = FixedPrice<4>;   // FX: 1.1234 → 11234

// CentPrice bid = CentPrice::fromDouble(100.24);
// CentPrice ask = CentPrice::fromDouble(100.26);
// auto spread = bid.spreadTicks(ask);  // exactly 2, no float error`,
    explanation:
      "IEEE 754 double has 53-bit mantissa which can represent integers up to 2^53 exactly, but decimal fractions like 0.01 are repeating binary fractions — summing many prices accumulates error. Fixed-point stores everything as int64_t, deferring the lossy conversion to double until display time. The MULTIPLIER is computed by a constexpr lambda, and the entire class is zero-overhead: `FixedPrice<2>` compiles to a single int64_t with no extra metadata.",
  },
  {
    id: "cpp-20260616-b1-sbe-codec",
    language: "cpp",
    title: "SBE message codec — fixed-offset binary encoding for NOS orders",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <span>

// Simple Binary Encoding (SBE): fixed-field binary format used in CME iLink3,
// FIX/FAST, and exchange data feeds. Fields live at compile-time-known offsets —
// parsing is a single memcpy per field, not a loop over delimiters.

// New Order Single layout (little-endian, 24 bytes):
// [0..7]   ClOrdID (uint64)
// [8..15]  Price   (int64, cents: $100.25 → 10025)
// [16..19] Qty     (uint32)
// [20]     Side    (uint8: 1=Buy, 2=Sell)
// [21]     OrdType (uint8: 1=Market, 2=Limit)
// [22..23] pad

struct NOSMessage {
    static constexpr std::size_t SIZE = 24;
    std::uint8_t buf[SIZE]{};

    // Encode fields at fixed offsets — one memcpy each, branch-free
    void setClOrdID(std::uint64_t id)  noexcept { std::memcpy(buf + 0,  &id,  8); }
    void setPrice(double price)        noexcept {
        std::int64_t px = static_cast<std::int64_t>(price * 100 + 0.5);
        std::memcpy(buf + 8, &px, 8);
    }
    void setQty(std::uint32_t qty)     noexcept { std::memcpy(buf + 16, &qty, 4); }
    void setSide(bool buy)             noexcept { buf[20] = buy ? 1 : 2; }
    void setOrdType(bool limit)        noexcept { buf[21] = limit ? 2 : 1; }

    // Decode fields at same fixed offsets
    std::uint64_t clOrdID() const noexcept {
        std::uint64_t v; std::memcpy(&v, buf + 0, 8); return v;
    }
    double price() const noexcept {
        std::int64_t v; std::memcpy(&v, buf + 8, 8);
        return static_cast<double>(v) * 0.01;
    }
    std::uint32_t qty() const noexcept {
        std::uint32_t v; std::memcpy(&v, buf + 16, 4); return v;
    }
    bool isBuy()   const noexcept { return buf[20] == 1; }
    bool isLimit() const noexcept { return buf[21] == 2; }

    // Zero-copy transmit: pass span directly to sendmsg() scatter-gather iov
    std::span<const std::uint8_t> view() const noexcept { return {buf, SIZE}; }
};

// Round-trip test at compile time
static_assert(sizeof(NOSMessage) == NOSMessage::SIZE);

// Usage:
// NOSMessage nos;
// nos.setClOrdID(1001); nos.setPrice(180.25); nos.setQty(100); nos.setSide(true);
// auto bytes = nos.view();  // 24-byte span, no copy`,
    explanation:
      "SBE's fixed-offset design means parse time is O(1) per field (one branch-free memcpy), compared to FIX tag-value which requires scanning for '=' and SOH delimiters. The memcpy through a uint8_t buffer is the standard portable way to do type punning in C++ without strict-aliasing UB — the compiler generates a single MOV instruction for 4/8-byte aligned reads at -O2.",
  },
  {
    id: "cpp-20260616-b1-fix-parser",
    language: "cpp",
    title: "FIX tag-value parser — zero-allocation string_view scan",
    tag: "market-data",
    code: `#include <string_view>
#include <optional>
#include <charconv>
#include <cstdint>

// FIX 4.x format: "8=FIX.4.4|35=D|11=ORD001|55=AAPL|44=180.25|38=100|54=1|"
// (SOH = 0x01 in production; '|' used here for readability)
// Tags are 3-5 digit integers; values are ASCII strings.
// This parser uses string_view throughout — zero heap allocations.

struct FIXField { int tag; std::string_view value; };

// Advance pos past next tag=value| field; return field or nullopt at end
std::optional<FIXField> nextField(std::string_view msg, std::size_t& pos) noexcept {
    if (pos >= msg.size()) return std::nullopt;

    auto eq = msg.find('=', pos);
    if (eq == std::string_view::npos) return std::nullopt;

    int tag = 0;
    auto [ptr, ec] = std::from_chars(msg.data() + pos, msg.data() + eq, tag);
    if (ec != std::errc{}) return std::nullopt;

    auto soh    = msg.find('|', eq + 1);
    auto val_end = (soh == std::string_view::npos) ? msg.size() : soh;
    std::string_view value = msg.substr(eq + 1, val_end - eq - 1);

    pos = (soh == std::string_view::npos) ? msg.size() : soh + 1;
    return FIXField{tag, value};
}

struct FIXOrder {
    std::string_view clord_id;   // tag 11
    std::string_view symbol;     // tag 55
    double           price  = 0; // tag 44
    std::uint32_t    qty    = 0; // tag 38
    char             side   = 0; // tag 54: '1'=buy '2'=sell
    char             msg_type{}; // tag 35
};

FIXOrder parseFIXOrder(std::string_view msg) noexcept {
    FIXOrder o;
    std::size_t pos = 0;
    while (auto f = nextField(msg, pos)) {
        switch (f->tag) {
            case 11: o.clord_id = f->value; break;
            case 35: o.msg_type = f->value.empty() ? 0 : f->value[0]; break;
            case 38: std::from_chars(f->value.data(), f->value.data()+f->value.size(), o.qty); break;
            case 44: {
                // from_chars supports decimal floats in C++17
                double v = 0;
                std::from_chars(f->value.data(), f->value.data()+f->value.size(), v);
                o.price = v;
                break;
            }
            case 54: o.side   = f->value.empty() ? 0 : f->value[0]; break;
            case 55: o.symbol = f->value; break;
        }
    }
    return o;
}

// "8=FIX.4.4|35=D|11=ORD001|55=AAPL|44=180.25|38=100|54=1|"
// → {clord_id="ORD001", symbol="AAPL", price=180.25, qty=100, side='1'}`,
    explanation:
      "std::from_chars is the key: unlike atof/strtod it does not call setlocale, does not allocate, and can be inlined by the compiler into a tight decimal-parsing loop. All string views are non-owning slices into the original receive buffer, so this function runs with exactly zero allocations and produces the parsed struct in a single left-to-right scan of the message.",
  },
  {
    id: "cpp-20260616-b1-delta-compress",
    language: "cpp",
    title: "Delta tick compression — int16 price deltas halve market-data storage",
    tag: "market-data",
    code: `#include <cstdint>
#include <vector>
#include <algorithm>

// Delta encoding: store diff between consecutive ticks instead of absolutes.
// For US equities, the price delta between consecutive ticks is typically ±1–5 cents
// (stored as ±1–5 ticks) — fits in int16_t vs int64_t: 4× compression on price.
// Timestamp deltas in microseconds fit in uint32_t (≤4295 seconds between ticks).

struct TickRec {
    std::int64_t  ts_ns;          // nanoseconds since epoch
    std::int64_t  price_ticks;    // price × 100 (cents)
    std::int32_t  volume;
};

struct DeltaTick {
    std::int16_t  price_delta;    // diff from previous price (clamp to ±32767)
    std::int32_t  volume;
    std::uint32_t ts_delta_us;    // diff from previous ts in microseconds
};

std::vector<DeltaTick> deltaEncode(const std::vector<TickRec>& ticks) {
    std::vector<DeltaTick> out;
    out.reserve(ticks.size());

    std::int64_t prev_px = 0, prev_ts = 0;
    for (const auto& t : ticks) {
        std::int64_t dpx = t.price_ticks - prev_px;
        DeltaTick dt;
        dt.price_delta = static_cast<std::int16_t>(
            std::clamp(dpx, std::int64_t(-32768), std::int64_t(32767)));
        dt.volume      = t.volume;
        dt.ts_delta_us = static_cast<std::uint32_t>((t.ts_ns - prev_ts) / 1000);
        out.push_back(dt);
        prev_px = t.price_ticks;
        prev_ts = t.ts_ns;
    }
    return out;
}

std::vector<TickRec> deltaReconstruct(const std::vector<DeltaTick>& deltas,
                                       std::int64_t start_px,
                                       std::int64_t start_ts_ns) {
    std::vector<TickRec> result;
    result.reserve(deltas.size());
    std::int64_t px = start_px, ts = start_ts_ns;
    for (const auto& d : deltas) {
        px += d.price_delta;
        ts += static_cast<std::int64_t>(d.ts_delta_us) * 1000;
        result.push_back({ts, px, d.volume});
    }
    return result;
}

// Size check: TickRec = 20 bytes; DeltaTick = 10 bytes → 2× compression ratio
static_assert(sizeof(DeltaTick) == 10);
static_assert(sizeof(TickRec)   == 20);

// For most equity streams: |price_delta| <= 127 → int8_t → 3.3× compression.`,
    explanation:
      "Delta encoding exploits the temporal locality of financial tick data — consecutive prices move by a fraction of the total price range, so the delta distribution is tightly concentrated near zero. The clamp to int16 is safe for liquid equities (a 1-second gap rarely exceeds 327.67 ticks of price move), but illiquid securities or halts can produce large jumps, so the decoder must handle the clamp-overflow case (typically by inserting an absolute-price reset message).",
  },
  {
    id: "cpp-20260616-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive linked list — O(1) order cancel without heap allocation",
    tag: "systems",
    code: `#include <cstddef>
#include <cassert>

// Intrusive list: each element embeds the list's next/prev pointers directly.
// Unlike std::list which heap-allocates list nodes separately, the intrusive
// design stores links inside the domain object — zero extra allocation.
// Critical for order level queues: cancel by pointer is O(1) without searching.

struct IntrusiveHook {
    IntrusiveHook* prev = nullptr;
    IntrusiveHook* next = nullptr;
};

// Minimalist intrusive doubly-linked list with a sentinel head node
class IntrusiveList {
    IntrusiveHook head_;   // sentinel: head_.next = first; head_.prev = last
    std::size_t   size_ = 0;

public:
    IntrusiveList() noexcept { head_.next = head_.prev = &head_; }

    void push_back(IntrusiveHook* h) noexcept {
        h->prev = head_.prev;
        h->next = &head_;
        head_.prev->next = h;
        head_.prev = h;
        ++size_;
    }

    // O(1) remove: no search needed — caller holds the pointer directly
    void remove(IntrusiveHook* h) noexcept {
        assert(h->prev && h->next && "node not in any list");
        h->prev->next = h->next;
        h->next->prev = h->prev;
        h->prev = h->next = nullptr;
        --size_;
    }

    IntrusiveHook* front() noexcept {
        return (size_ == 0) ? nullptr : head_.next;
    }
    bool        empty() const noexcept { return size_ == 0; }
    std::size_t size()  const noexcept { return size_; }
};

// Order embedding the hook: cancel by computing address of containing object
struct Order {
    std::uint64_t id;
    double        price;
    int           qty;
    IntrusiveHook hook;   // embedded link
};

// Get Order* from hook* using offsetof — standard-layout struct required
inline Order* orderFromHook(IntrusiveHook* h) noexcept {
    return reinterpret_cast<Order*>(
        reinterpret_cast<char*>(h) - offsetof(Order, hook));
}

// Usage pattern (order book level queue):
// IntrusiveList level_queue;
// Order o1{1001, 100.25, 100, {}};
// level_queue.push_back(&o1.hook);        // O(1), no allocation
// level_queue.remove(&o1.hook);           // O(1) cancel by pointer`,
    explanation:
      "The intrusive design eliminates two costs: the heap allocation per list node (std::list allocates one node object per element) and the indirection from node to element (the element IS the node). For an order book with 10,000 outstanding orders, std::list's allocator overhead can consume 160 KB (16 bytes per node) and introduce cache fragmentation; the intrusive list uses zero additional memory beyond what Order itself occupies.",
  },
  {
    id: "cpp-20260616-b1-avellaneda-stoikov",
    language: "cpp",
    title: "Avellaneda-Stoikov market making — inventory-adjusted bid/ask quotes",
    tag: "quant",
    code: `#include <cmath>
#include <algorithm>

// Avellaneda-Stoikov (2008) stochastic control model for optimal market making.
// Reservation price: r = S - q * gamma * sigma^2 * (T - t)
//   q = signed inventory (positive = long), gamma = risk aversion,
//   sigma = price vol, (T-t) = remaining session time.
// When long (q > 0), the market maker lowers the reservation price to sell faster.
// Optimal spread: delta = gamma*sigma^2*(T-t) + (2/gamma)*ln(1 + gamma/kappa)
//   kappa = order arrival rate sensitivity (fitted to historical fill data).

struct ASParams {
    double gamma;   // risk aversion coefficient (typical: 0.1)
    double sigma;   // price volatility per unit time (e.g., per second)
    double kappa;   // arrival rate sensitivity (typical: 1.5)
};

struct ASQuotes {
    double reservation;  // inventory-adjusted mid
    double spread;       // total optimal bid-ask spread
    double bid;
    double ask;
};

ASQuotes avellanedaStoikov(double S, int q, double T_remaining,
                            const ASParams& p) noexcept {
    // Inventory risk term: exposure from holding q units for remaining time
    double r = S - q * p.gamma * p.sigma * p.sigma * T_remaining;

    // Optimal spread balances spread income vs inventory liquidation cost
    double delta_inv     = p.gamma * p.sigma * p.sigma * T_remaining;
    double delta_arrival = (2.0 / p.gamma) * std::log(1.0 + p.gamma / p.kappa);
    double spread        = delta_inv + delta_arrival;

    return {r, spread, r - spread * 0.5, r + spread * 0.5};
}

// Hard inventory limit: suppress one side when position exceeds q_max
ASQuotes withInventoryFence(ASQuotes q, int inventory, int q_max) noexcept {
    if (inventory >= q_max)  q.bid = -1e18;  // stop buying when too long
    if (inventory <= -q_max) q.ask =  1e18;  // stop selling when too short
    return q;
}

// Example: mid=100, long 50 shares, 3600s remaining, gamma=0.1, sigma=0.01/s, kappa=1.5
// r   = 100 - 50 * 0.1 * 0.0001 * 3600 = 100 - 1.8 = 98.2  (skew down to liquidate)
// delta = 0.036 + 1.386 = 1.422
// bid = 97.49, ask = 98.91  (narrower ask to attract sell orders = reduce long)`,
    explanation:
      "The Avellaneda-Stoikov model formalises the market maker's trade-off: a wider spread earns more per fill but fills less often, while an inventory skew reduces the probability of adverse selection when the position is directional. The reservation price skew (−q·γ·σ²·T) is proportional to how much mark-to-market risk the current inventory represents over the remaining session — a large long position makes the market maker price aggressively on the offer to avoid being left holding inventory at close.",
  },
  {
    id: "cpp-20260616-b1-cir-sim",
    language: "cpp",
    title: "CIR exact simulation — non-central chi-squared short rate sampling",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <stdexcept>

// Cox-Ingersoll-Ross (1985): dr = kappa*(theta-r)*dt + sigma*sqrt(r)*dW
// Exact simulation via non-central chi-squared distribution (Glasserman 2004 §3.4).
// Feller condition: 2*kappa*theta > sigma^2 ensures r > 0 almost surely.
// c  = sigma^2*(1-exp(-kappa*dt)) / (4*kappa)
// df = 4*kappa*theta / sigma^2                (degrees of freedom)
// nc = r_t * exp(-kappa*dt) / c               (non-centrality)
// r_{t+dt} | r_t ~ c * chi^2(df, nc)

double cirStep(double r, double dt, double kappa, double theta, double sigma,
               std::mt19937_64& rng) {
    double e_kdt = std::exp(-kappa * dt);
    double c     = sigma * sigma * (1.0 - e_kdt) / (4.0 * kappa);
    double df    = 4.0 * kappa * theta / (sigma * sigma);
    double nc    = r * e_kdt / c;

    // Poisson-mixing representation of the non-central chi-squared:
    // sample Poisson(nc/2) and then central chi^2(df + 2*k)
    std::poisson_distribution<int>       poi(nc * 0.5);
    int k = poi(rng);
    std::chi_squared_distribution<double> chi2(df + 2.0 * k);
    return c * chi2(rng);
}

std::vector<double> simulateCIR(double r0, double kappa, double theta, double sigma,
                                  double T, int N, int seed = 42) {
    if (2.0 * kappa * theta <= sigma * sigma)
        throw std::runtime_error("Feller condition violated");

    std::mt19937_64 rng(seed);
    double dt = T / N;
    std::vector<double> r(N + 1);
    r[0] = r0;
    for (int i = 1; i <= N; ++i)
        r[i] = cirStep(r[i-1], dt, kappa, theta, sigma, rng);
    return r;
}

// Closed-form zero-coupon bond price P(0,T) = A(T)*exp(-B(T)*r0)
double cirBondPrice(double r0, double kappa, double theta, double sigma, double T) noexcept {
    double h   = std::sqrt(kappa * kappa + 2.0 * sigma * sigma);
    double num = 2.0 * h * std::exp(0.5 * (kappa + h) * T);
    double den = (kappa + h) * (std::exp(h * T) - 1.0) + 2.0 * h;
    double A   = std::pow(num / den, 2.0 * kappa * theta / (sigma * sigma));
    double B   = 2.0 * (std::exp(h * T) - 1.0) / den;
    return A * std::exp(-B * r0);
}`,
    explanation:
      "The Poisson-mixing representation avoids the need to invert the non-central chi-squared CDF (which has no closed form): sample k from Poisson(nc/2) and then sample a central chi-squared with df + 2k degrees of freedom — this produces an exact draw from the non-central chi-squared distribution. Unlike Euler-Maruyama discretisation which can go negative when the Feller condition is tight, the exact simulation always stays positive because chi-squared variables are non-negative.",
  },
  {
    id: "cpp-20260616-b1-bermudan-binomial",
    language: "cpp",
    title: "Bermudan put — binomial backward induction with selective exercise",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Bermudan option: exercise right on a fixed set of dates ⊂ [0,T].
// Priced via backward induction on a CRR binomial tree.
// At allowed exercise dates: V[j] = max(continuation, intrinsic).
// At non-exercise dates: V[j] = continuation only.
// American option = Bermudan with exercise at EVERY node.

double bermudanPut(double S0, double K, double r, double sigma, double T,
                   const std::vector<double>& exercise_times,   // sorted dates in (0,T]
                   int N = 300) {
    double dt   = T / N;
    double u    = std::exp(sigma * std::sqrt(dt));
    double d    = 1.0 / u;
    double p    = (std::exp(r * dt) - d) / (u - d);    // risk-neutral up probability
    double disc = std::exp(-r * dt);

    // Terminal payoffs at maturity
    std::vector<double> V(N + 1);
    for (int j = 0; j <= N; ++j) {
        double S = S0 * std::pow(u, 2 * j - N);   // u^(2j-N) = price at node (N,j)
        V[j] = std::max(K - S, 0.0);
    }

    // Backward induction
    for (int i = N - 1; i >= 0; --i) {
        double t_now = i * dt;

        // Check if this time step is an exercise date
        bool exercise_allowed = false;
        for (double te : exercise_times) {
            if (std::abs(t_now - te) < dt * 0.5) { exercise_allowed = true; break; }
        }

        for (int j = 0; j <= i; ++j) {
            double continuation = disc * (p * V[j + 1] + (1.0 - p) * V[j]);
            if (exercise_allowed) {
                double S_ij    = S0 * std::pow(u, 2 * j - i);
                double intrinsic = std::max(K - S_ij, 0.0);
                V[j] = std::max(continuation, intrinsic);
            } else {
                V[j] = continuation;
            }
        }
    }
    return V[0];
}

// Bermudan >= European (extra exercise right always has non-negative value).
// Bermudan converges to American as exercise_times = {dt, 2*dt, ..., (N-1)*dt}.
// Quarterly Bermudan: exercise_times = {0.25, 0.50, 0.75, 1.0} for T=1 year.`,
    explanation:
      "The binomial grid is computed backward from maturity: at each non-exercise node, the option value is purely the discounted expected continuation; at exercise nodes, the max(continuation, intrinsic) decision is made. The O(N²) tree structure is reduced to O(N) space by reusing the V array in-place — after step i, V[0..i] holds the values at all nodes at time i, and V[0] at i=0 is the option price. The within-dt/2 proximity check handles floating-point rounding when exercise times are specified as decimals.",
  },
  {
    id: "cpp-20260616-b1-asian-cv",
    language: "cpp",
    title: "Arithmetic Asian MC — geometric Asian control variate (Kemna-Vorst)",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <numeric>

// Arithmetic Asian call: payoff = max(A_arith - K, 0), A_arith = (1/N)*sum(S_i).
// Geometric Asian has a closed-form price (Kemna-Vorst 1990) → use as control variate.
// Control variate estimator: V_arith_CV = V_arith_MC + (V_geom_exact - V_geom_MC)
// Reduces variance because arith and geom paths are highly correlated (~0.95+).

// Kemna-Vorst closed form for geometric Asian call
static double geomAsianCall(double S0, double K, double r, double sigma,
                              double T, int N) noexcept {
    double sigma_g = sigma * std::sqrt((2.0*N + 1.0) / (6.0*(N + 1.0)));
    double r_g     = 0.5 * (r - 0.5*sigma*sigma + sigma_g*sigma_g);
    double sqT     = std::sqrt(T);
    double d1      = (std::log(S0/K) + (r_g + 0.5*sigma_g*sigma_g)*T) / (sigma_g*sqT);
    double d2      = d1 - sigma_g * sqT;
    auto   Ncdf    = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    return S0*std::exp((r_g-r)*T)*Ncdf(d1) - K*std::exp(-r*T)*Ncdf(d2);
}

struct AsianResult { double price_naive, se_naive, price_cv, se_cv; };

AsianResult arithmeticAsianCV(double S0, double K, double r, double sigma,
                               double T, int N = 252, int paths = 100000,
                               int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double dt   = T / N;
    double mu   = (r - 0.5*sigma*sigma)*dt;
    double vol  = sigma * std::sqrt(dt);
    double disc = std::exp(-r * T);
    double geom_exact = geomAsianCall(S0, K, r, sigma, T, N);

    double sn=0,sn2=0,sc=0,sc2=0;
    for (int p = 0; p < paths; ++p) {
        double S = S0, arith_sum = 0.0, log_geom = 0.0;
        for (int i = 0; i < N; ++i) {
            S *= std::exp(mu + vol * nd(rng));
            arith_sum += S;
            log_geom  += std::log(S);
        }
        double arith_avg = arith_sum / N;
        double geom_avg  = std::exp(log_geom / N);

        double pay_n  = disc * std::max(arith_avg - K, 0.0);
        double pay_g  = disc * std::max(geom_avg  - K, 0.0);
        double pay_cv = pay_n + (geom_exact - pay_g);   // control variate

        sn += pay_n; sn2 += pay_n*pay_n;
        sc += pay_cv; sc2 += pay_cv*pay_cv;
    }
    auto stats = [&](double s, double s2) {
        double pr = s/paths, var = (s2/paths - pr*pr)/(paths-1);
        return std::make_pair(pr, std::sqrt(var));
    };
    auto [pn, sen] = stats(sn, sn2);
    auto [pc, sec] = stats(sc, sc2);
    return {pn, sen, pc, sec};
}`,
    explanation:
      "The control variate works because the arithmetic and geometric paths share the same Brownian increments — their payoffs are highly correlated, so `pay_arith_MC − pay_geom_MC` has small variance even though each individually has large variance. The exact correction `geom_exact − pay_geom_MC` has expectation zero (correct in expectation) but negative correlation with the MC error in `pay_arith_MC`, substantially reducing variance. Typical variance reductions are 90–95% (standard error falls by 4–5×).",
  },
  {
    id: "cpp-20260616-b1-greeks-reduce",
    language: "cpp",
    title: "Portfolio Greeks via parallel transform_reduce — C++17 execution policy",
    tag: "quant",
    code: `#include <vector>
#include <numeric>
#include <cmath>
#include <execution>

// C++17 parallel algorithms: std::transform_reduce with std::execution::par_unseq
// distributes the work across CPU cores and enables SIMD vectorisation.
// For a 1000-option portfolio, this reduces Greeks aggregation from ~1 ms to ~0.1 ms.

struct OptionGreeks {
    double delta, gamma, vega, theta;
    double notional;
};

struct PortGreeks { double delta=0, gamma=0, vega=0, theta=0; };

// Black-Scholes analytic Greeks
OptionGreeks bsGreeks(double S, double K, double r, double sigma,
                       double T, bool call, double notional = 1.0) noexcept {
    if (T <= 0.0) {
        double d = call ? (S > K ? 1.0 : 0.0) : (S < K ? -1.0 : 0.0);
        return {d*notional, 0, 0, 0, notional};
    }
    double sqT  = std::sqrt(T);
    double d1   = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double d2   = d1 - sigma*sqT;
    auto Ncdf   = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    auto npdf   = [](double x){ return std::exp(-0.5*x*x) / std::sqrt(6.28318530718); };

    double delta = (call ? Ncdf(d1) : Ncdf(d1) - 1.0) * notional;
    double gamma = npdf(d1) / (S * sigma * sqT) * notional;
    double vega  = S * npdf(d1) * sqT * notional * 0.01;   // per 1% vol move
    double theta = (-S*npdf(d1)*sigma/(2*sqT)
                    - r*K*std::exp(-r*T)*(call ? Ncdf(d2) : -Ncdf(-d2)))
                   * notional / 252.0;                      // per calendar day
    return {delta, gamma, vega, theta, notional};
}

// Parallel reduction over the portfolio
PortGreeks aggregateGreeks(const std::vector<OptionGreeks>& positions) {
    return std::transform_reduce(
        std::execution::par_unseq,
        positions.begin(), positions.end(),
        PortGreeks{},
        [](PortGreeks a, const PortGreeks& b) noexcept {
            return PortGreeks{a.delta+b.delta, a.gamma+b.gamma, a.vega+b.vega, a.theta+b.theta};
        },
        [](const OptionGreeks& g) noexcept {
            return PortGreeks{g.delta, g.gamma, g.vega, g.theta};
        }
    );
}`,
    explanation:
      "std::execution::par_unseq is the most aggressive policy: it allows both multi-threading (par) and SIMD vectorisation within a thread (unseq). The transform step (OptionGreeks → PortGreeks) and the reduce step (pairwise PortGreeks addition) are composed into a single fused pass — the compiler can keep partial sums in SIMD registers rather than materialising an intermediate vector. For correctness, the binary reduction operator must be associative (floating-point addition is not exactly associative, but the reordering error is typically 10^-14).",
  },
  {
    id: "cpp-20260616-b1-cache-split",
    language: "cpp",
    title: "Hot/cold cache line split — preventing false sharing on order book levels",
    tag: "performance",
    code: `#include <cstdint>
#include <new>
#include <cstddef>

// False sharing: two threads writing to fields on the same 64-byte cache line
// causes the line to ping-pong between CPU cores (~200 ns penalty per access).
// Solution: split hot (every-tick) fields to one cache line, cold (rare) to another.
//
// Order book level: price and qty are read/written on every market data tick (hot).
// Audit fields (add_count, cancel_count) are written only on order events (cold).

constexpr std::size_t CACHE_LINE = 64;

struct alignas(CACHE_LINE) OrderLevel {
    // === HOT CACHE LINE (line 0, bytes 0-63) ===
    // Written by the market data ingest thread on every price/qty update
    double        price;          // 8 bytes — current best price at this level
    std::int64_t  total_qty;      // 8 bytes — total quantity (updated frequently)
    std::int32_t  order_count;    // 4 bytes — number of outstanding orders
    char          pad_hot[44]{};  // 44 bytes — pad to fill exactly one cache line

    // === COLD CACHE LINE (line 1, bytes 64-127) ===
    // Written by the order management thread on add/cancel events only
    alignas(CACHE_LINE) std::uint64_t last_event_ns;   // 8 bytes
    std::uint64_t                     add_count;        // 8 bytes
    std::uint64_t                     cancel_count;     // 8 bytes
    char                              pad_cold[40]{};   // 40 bytes
};

// Verify layout: cold data starts exactly at cache line 1
static_assert(offsetof(OrderLevel, last_event_ns) == CACHE_LINE,
    "Cold data must start at second cache line");
static_assert(sizeof(OrderLevel) == 2 * CACHE_LINE,
    "Total size must be exactly 2 cache lines");

// Thread A (data ingest): reads/writes price, total_qty, order_count — cache line 0
// Thread B (order mgmt):  reads/writes last_event_ns, add/cancel_count — cache line 1
// Zero false sharing between A and B.

// Prefetch cold line before cancel processing (avoids stall)
void prefetchCold(const OrderLevel* lv) noexcept {
    __builtin_prefetch(reinterpret_cast<const char*>(lv) + CACHE_LINE, 1, 1);
}`,
    explanation:
      "The alignas(CACHE_LINE) on the struct ensures the hot line starts on a 64-byte boundary, and the padding fills each line to exactly 64 bytes — without the padding, a single struct member from line 0 could share a cache line with the first member of line 1 due to natural alignment. The static_asserts verify the invariant at compile time: if a refactor changes the struct layout, the build fails immediately rather than silently reintroducing false sharing.",
  },
  {
    id: "cpp-20260616-b1-variant-event",
    language: "cpp",
    title: "std::variant market event — type-safe tagged union with std::visit",
    tag: "modern",
    code: `#include <variant>
#include <cstdint>
#include <string_view>
#include <cmath>
#include <limits>
#include <type_traits>

// std::variant: type-safe tagged union — replaces C union + int tag pattern.
// Size = max(sizeof(alternatives)) + alignment overhead. No heap allocation.
// std::visit() dispatches to the correct lambda branch at zero runtime cost:
// the compiler generates an indirect jump through a constexpr function table.

struct AddOrder   { std::uint64_t id; double price; int qty; bool buy; };
struct CancelOrder{ std::uint64_t id; };
struct TradeExec  { std::uint64_t aggressor_id, passive_id; double exec_price; int exec_qty; };
struct SessionEnd { std::string_view reason; };

using MktEvent = std::variant<AddOrder, CancelOrder, TradeExec, SessionEnd>;

// Process event — dispatch via if-constexpr in a generic lambda
double handleEvent(const MktEvent& ev, double mid) noexcept {
    return std::visit([&](const auto& msg) noexcept -> double {
        using T = std::decay_t<decltype(msg)>;

        if constexpr (std::is_same_v<T, AddOrder>) {
            // Passive order: update mid estimate
            return msg.buy ? std::max(mid, msg.price) : std::min(mid, msg.price);
        }
        else if constexpr (std::is_same_v<T, TradeExec>) {
            return msg.exec_price;   // last trade = best price estimate
        }
        else if constexpr (std::is_same_v<T, CancelOrder>) {
            return mid;              // cancel has no immediate price impact
        }
        else {   // SessionEnd
            return std::numeric_limits<double>::quiet_NaN();
        }
    }, ev);
}

// Pattern: heterogeneous event bus — no virtual calls, no heap per message
// std::vector<MktEvent> bus;
// bus.push_back(AddOrder{1, 100.25, 100, true});
// bus.push_back(TradeExec{1, 2, 100.25, 50});
// for (auto& ev : bus) { double px = handleEvent(ev, 100.0); }`,
    explanation:
      "std::visit generates a jump table at compile time (one entry per variant alternative), so dispatch is a single indirect branch — equivalent to a virtual function call but without the heap allocation of the object or the vtable pointer overhead per instance. The `if constexpr` branches in the lambda are pruned at instantiation time: for a `TradeExec` visit, the compiler sees only the exec_price branch with no dead code for the other types, enabling further optimisations like inlining the price assignment.",
  },
  {
    id: "cpp-20260616-b1-constexpr-bs",
    language: "cpp",
    title: "constexpr Black-Scholes — compile-time option grid baked into binary",
    tag: "quant",
    code: `#include <cmath>
#include <array>
#include <cstddef>

// constexpr Black-Scholes: precompute a pricing grid at compile time.
// At runtime, the values are just constants in the binary — no computation.
// Requires a constexpr-compatible normal CDF approximation.
// Hart (1968) rational approximation: accurate to ~7 significant figures.

constexpr double normcdf(double x) noexcept {
    // Abramowitz & Stegun 26.2.17 rational approximation
    constexpr double a1 =  0.31938153,  a2 = -0.356563782,
                     a3 =  1.781477937, a4 = -1.821255978, a5 = 1.330274429;
    double ax = x < 0.0 ? -x : x;
    double k  = 1.0 / (1.0 + 0.2316419 * ax);
    double poly = k*(a1 + k*(a2 + k*(a3 + k*(a4 + k*a5))));
    // Approximate exp(-x^2/2) for constexpr via Taylor (sufficient for grid)
    // In C++26 std::exp/log become constexpr; for now, Taylor for small x^2
    double x2   = ax * ax;
    // 6-term Taylor: exp(-x^2/2) ≈ 1 - x^2/2 + x^4/8 - x^6/48 + ...
    double eterm = 1.0 - x2*0.5 + x2*x2/8.0 - x2*x2*x2/48.0 + x2*x2*x2*x2/384.0;
    double tail  = poly * 0.39894228 * eterm;
    return x >= 0.0 ? 1.0 - tail : tail;
}

struct BSResult { double call, put; };

constexpr BSResult blackScholes(double S, double K, double r,
                                 double sigma, double T) noexcept {
    // Approximate sqrt via Newton's method (3 iterations, constexpr)
    auto sqrtApprox = [](double v) constexpr noexcept {
        double x = v * 0.5;
        for (int i = 0; i < 8; ++i) x = 0.5 * (x + v / x);
        return x;
    };
    auto logApprox = [](double v) constexpr noexcept {
        // ln(1+u) series; works for v near 1.0
        double u = (v - 1.0) / (v + 1.0), u2 = u*u;
        return 2.0*u*(1.0 + u2/3.0 + u2*u2/5.0 + u2*u2*u2/7.0);
    };
    double sqT  = sqrtApprox(T);
    double logSK = logApprox(S / K);   // assumes S/K near 1; extend for wider range
    double d1   = (logSK + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double d2   = d1 - sigma * sqT;
    double disc = 1.0 - r*T + r*r*T*T*0.5;   // exp(-rT) approximation
    double call  = S*normcdf(d1) - K*disc*normcdf(d2);
    double put   = K*disc*normcdf(-d2) - S*normcdf(-d1);
    return {call, put};
}

// 5-point moneyness grid computed at compile time — result is .rodata section
constexpr std::array<BSResult, 5> kOptionGrid = {
    blackScholes(100, 90,  0.05, 0.20, 1.0),
    blackScholes(100, 95,  0.05, 0.20, 1.0),
    blackScholes(100, 100, 0.05, 0.20, 1.0),
    blackScholes(100, 105, 0.05, 0.20, 1.0),
    blackScholes(100, 110, 0.05, 0.20, 1.0),
};`,
    explanation:
      "The constexpr functions use Taylor/Newton approximations instead of std::exp/log (which are not constexpr before C++26) — for a compile-time moneyness grid with K/S ratios near 1, the approximations are accurate to 3-4 significant figures, sufficient for a lookup table. At runtime, `kOptionGrid` is a read-only constant array in the .rodata section; the latency to read it is a single L1 cache access (~4 cycles) with no floating-point computation.",
  },
  {
    id: "cpp-20260616-b1-optional-chain",
    language: "cpp",
    title: "std::optional monadic chaining — C++23 and_then / transform for order routing",
    tag: "modern",
    code: `#include <optional>
#include <string>
#include <string_view>
#include <unordered_map>
#include <functional>

// C++23 adds monadic operations to std::optional:
//   .and_then(f)  : if has value, apply f (which returns optional); else propagate nullopt
//   .transform(f) : if has value, apply f (returning T); else propagate nullopt
//   .or_else(f)   : if nullopt, call f() for a fallback optional
// Eliminates nested if(!opt) checks in multi-step lookup chains.

struct Route   { std::string venue; int priority; };
struct RiskOK  { std::uint64_t limit_remaining; };
struct OrderAck{ std::string order_id; };

static const std::unordered_map<std::string, Route> kRoutingTable{
    {"AAPL", {"NYSE",    1}},
    {"MSFT", {"NASDAQ",  1}},
    {"BTC",  {"Coinbase",2}},
};

std::optional<Route> findRoute(std::string_view symbol) {
    auto it = kRoutingTable.find(std::string(symbol));
    if (it == kRoutingTable.end()) return std::nullopt;
    return it->second;
}

std::optional<RiskOK> checkRisk(const Route& r, double price, int qty) {
    if (qty <= 0 || price <= 0.0 || qty > 10000) return std::nullopt;
    return RiskOK{1'000'000ULL - static_cast<std::uint64_t>(price * qty)};
}

std::optional<OrderAck> sendToVenue(const Route& r, const RiskOK&) {
    return OrderAck{"ORD-" + r.venue + "-001"};
}

// C++23 monadic chain: each and_then propagates nullopt on failure
std::optional<OrderAck> routeOrder(std::string_view symbol, double price, int qty) {
    return findRoute(symbol)
        .and_then([&](const Route& r) -> std::optional<RiskOK> {
            return checkRisk(r, price, qty);
        })
        .and_then([&](const RiskOK& ok) -> std::optional<OrderAck> {
            auto r = findRoute(symbol).value();   // safe: already found above
            return sendToVenue(r, ok);
        });
}

// Pre-C++23 equivalent requires:
// auto r = findRoute(sym); if (!r) return nullopt;
// auto ok = checkRisk(*r, px, qty); if (!ok) return nullopt;
// return sendToVenue(*r, *ok);
// The monadic chain is identical semantically but reads as a pipeline.`,
    explanation:
      "The monadic and_then captures the short-circuit evaluation that would otherwise require a cascade of if(!opt) return nullopt; checks. The key distinction from chained if statements is readability and composability: each step in the chain is an independent function that can be tested in isolation, and the chain clearly expresses the dependency ordering (route → risk check → order send). In C++20 and earlier, the same pattern can be achieved manually or with a small helper `flatMap(opt, f)` function.",
  },
  {
    id: "cpp-20260616-b1-spsc-ring",
    language: "cpp",
    title: "SPSC ring buffer — lock-free single-producer single-consumer queue",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Single-Producer Single-Consumer (SPSC) ring buffer.
// Correctness relies on: producer owns write_idx, consumer owns read_idx.
// No CAS needed — each thread modifies only its own index.
// Capacity N must be a power of 2: allows modulo via cheap bitwise AND.
// Cache line separation of indices prevents false sharing (they're on different cores).

template<typename T, std::size_t N>
class SPSCRingBuffer {
    static_assert((N & (N-1)) == 0, "N must be a power of 2");
    static constexpr std::size_t MASK = N - 1;

    alignas(64) std::array<T, N> buf_;
    alignas(64) std::atomic<std::size_t> write_{0};   // producer's index
    alignas(64) std::atomic<std::size_t> read_{0};    // consumer's index

public:
    // Producer thread only: returns false if buffer is full
    bool push(const T& item) noexcept {
        std::size_t w = write_.load(std::memory_order_relaxed);
        std::size_t r = read_.load(std::memory_order_acquire);
        if (w - r >= N) return false;           // full (N outstanding items)
        buf_[w & MASK] = item;
        write_.store(w + 1, std::memory_order_release);   // make visible to consumer
        return true;
    }

    // Consumer thread only: returns nullopt if buffer is empty
    std::optional<T> pop() noexcept {
        std::size_t r = read_.load(std::memory_order_relaxed);
        std::size_t w = write_.load(std::memory_order_acquire);
        if (r == w) return std::nullopt;        // empty
        T item = buf_[r & MASK];
        read_.store(r + 1, std::memory_order_release);    // advance consumer
        return item;
    }

    bool        empty()    const noexcept { return read_.load(std::memory_order_acquire) == write_.load(std::memory_order_acquire); }
    std::size_t size()     const noexcept { return write_.load(std::memory_order_acquire) - read_.load(std::memory_order_acquire); }
    static constexpr std::size_t capacity() noexcept { return N; }
};

// Usage: market data ingest → strategy thread
// SPSCRingBuffer<double, 4096> price_chan;
// // Producer (ingest thread):   price_chan.push(100.25);
// // Consumer (strategy thread): if (auto px = price_chan.pop()) { ... }`,
    explanation:
      "The acquire/release pairing is the critical correctness property: the producer's `release` store to write_ publishes not just the index update but also the preceding write to buf_[w & MASK] — a consumer's `acquire` load of write_ therefore guarantees it sees the complete item. Without this ordering, a consumer on a weakly-ordered CPU (ARM, POWER) could read stale data from buf_ even after observing the updated write_ index. On x86 (TSO model) acquire/release are free — they compile to regular MOV instructions.",
  },
  {
    id: "cpp-20260616-b1-branch-hints",
    language: "cpp",
    title: "__builtin_expect and [[likely]] — branch prediction hints for hot paths",
    tag: "performance",
    code: `#include <cstdint>
#include <atomic>

// Branch misprediction cost: ~15 cycles on modern x86 (Skylake).
// For a 2 GHz inner loop, 15 cycles = 7.5 ns — significant for 10-ns latency targets.
// __builtin_expect(expr, expected_val): compiler hint to arrange hot path inline.
// C++20: [[likely]] / [[unlikely]] attributes — portable, same effect.
// The CPU's dynamic predictor handles regular patterns; these hints help for
// rare events (packet errors, overflow) whose pattern the predictor can't learn.

constexpr int MAX_TICK_COUNT = 100000;

// WITHOUT hint: compiler may place overflow branch inline (pollutes I-cache)
int processNaive(std::atomic<int>& count, int price) {
    if (count.load(std::memory_order_relaxed) > MAX_TICK_COUNT) {
        count.store(0, std::memory_order_relaxed);
        return -1;
    }
    count.fetch_add(1, std::memory_order_relaxed);
    return price;
}

// WITH __builtin_expect: tells the compiler the overflow branch is unlikely
// → compiler places hot path as the fall-through, cold path as a forward branch
int processFast(std::atomic<int>& count, int price) {
    if (__builtin_expect(count.load(std::memory_order_relaxed) > MAX_TICK_COUNT, 0)) {
        count.store(0, std::memory_order_relaxed);
        return -1;
    }
    count.fetch_add(1, std::memory_order_relaxed);
    return price;
}

// C++20 portable equivalent using attributes (GCC/Clang/MSVC all support)
int processModern(std::atomic<int>& count, int price) {
    if (count.load(std::memory_order_relaxed) > MAX_TICK_COUNT) [[unlikely]] {
        count.store(0, std::memory_order_relaxed);
        return -1;
    }
    count.fetch_add(1, std::memory_order_relaxed);
    return price;
}

// FIX message length validation — most messages valid → [[likely]]
bool validateLength(std::uint32_t len) noexcept {
    if (len < 20 || len > 4096) [[unlikely]] return false;
    return true;   // hot path: valid length
}

// Checksum validation — should always pass in a healthy connection
bool validateChecksum(std::uint8_t sum) noexcept {
    if (sum != 0) [[unlikely]] return false;   // FIX checksum field mod 256
    return true;
}`,
    explanation:
      "The effect is on code layout, not on the runtime branch predictor: `__builtin_expect(cond, 0)` tells the compiler to put the false-branch body out-of-line (as a forward jump target), keeping the hot path in contiguous instruction cache lines. This matters most when the cold path contains function calls (e.g., error logging) that would otherwise pollute the instruction cache. The CPU's hardware predictor still works independently and overrides the hint if it learns the branch is actually taken frequently.",
  },
  {
    id: "cpp-20260616-b1-bisect-book",
    language: "cpp",
    title: "Binary search on sorted price levels — O(log N) level lookup",
    tag: "systems",
    code: `#include <vector>
#include <algorithm>
#include <optional>
#include <cstdint>
#include <numeric>

// Flat sorted array of price levels: better cache locality than std::map for
// read-heavy workloads (VWAP calculation, depth queries) where insert/delete is rare.
// std::lower_bound on a sorted vector is O(log N) and cache-friendly (sequential reads).

struct PriceQty { double price; std::int64_t qty; };

class SortedBook {
    std::vector<PriceQty> levels_;   // ascending by price

public:
    // O(log N + shift): insert maintains sorted order
    void insert(double price, std::int64_t qty) {
        auto it = std::lower_bound(levels_.begin(), levels_.end(), price,
            [](const PriceQty& lv, double p) { return lv.price < p; });
        if (it != levels_.end() && it->price == price) {
            it->qty += qty;
        } else {
            levels_.insert(it, {price, qty});
        }
    }

    void remove(double price, std::int64_t qty) {
        auto it = std::lower_bound(levels_.begin(), levels_.end(), price,
            [](const PriceQty& lv, double p) { return lv.price < p; });
        if (it == levels_.end() || it->price != price) return;
        it->qty -= qty;
        if (it->qty <= 0) levels_.erase(it);
    }

    // O(1) best ask (ascending array: front is cheapest)
    std::optional<PriceQty> bestAsk() const noexcept {
        if (levels_.empty()) return std::nullopt;
        return levels_.front();
    }

    // O(1) best bid (ascending array: back is highest)
    std::optional<PriceQty> bestBid() const noexcept {
        if (levels_.empty()) return std::nullopt;
        return levels_.back();
    }

    // Cumulative qty available at prices <= price_limit (for partial-fill simulation)
    std::int64_t qtyUpTo(double price_limit) const noexcept {
        auto it = std::upper_bound(levels_.begin(), levels_.end(), price_limit,
            [](double p, const PriceQty& lv) { return p < lv.price; });
        std::int64_t total = 0;
        for (auto jt = levels_.begin(); jt != it; ++jt) total += jt->qty;
        return total;
    }

    std::size_t numLevels() const noexcept { return levels_.size(); }
};`,
    explanation:
      "A sorted vector has better cache behaviour than std::map (red-black tree) for depth traversal: all N levels fit in N/8 cache lines for int64 prices, whereas an std::map node has 3 pointers (24 bytes) overhead per element causing 3× worse cache utilisation. The O(log N) binary search is fast for up to ~1000 levels (≈10 comparisons); for a deeper book or very high insert rates, a skiplist or hash+array hybrid is preferred. The qtyUpTo scan is O(N) but runs on contiguous memory — cache-friendly for realistic book depths of 10-50 levels.",
  },
  {
    id: "cpp-20260616-b1-ewma-vol",
    language: "cpp",
    title: "EWMA volatility updater — RiskMetrics decay factor with half-life",
    tag: "quant",
    code: `#include <cmath>
#include <cstddef>

// Exponentially Weighted Moving Average (EWMA) volatility:
// sigma^2_t = lambda * sigma^2_{t-1} + (1 - lambda) * r^2_{t-1}
// RiskMetrics (1994) standard: lambda = 0.94 for daily returns.
// Weight on lag-k observation: (1-lambda) * lambda^k — decays geometrically.
// Half-life h satisfies lambda^h = 0.5 → h = -ln(2)/ln(lambda) ≈ 11 days at 0.94.
// Effective N (span): 1/(1-lambda) = ~16.7 days at lambda=0.94.

class EWMAVol {
    double lambda_;
    double sigma_sq_;   // current variance estimate
    std::size_t n_ = 0;

public:
    // lambda: decay factor; sigma0: initial vol annualised (e.g., 0.20 = 20%)
    explicit EWMAVol(double lambda = 0.94, double sigma0_annual = 0.20) noexcept
        : lambda_(lambda), sigma_sq_(sigma0_annual * sigma0_annual / 252.0) {}

    // Call every period with the log return for that period
    void update(double log_return) noexcept {
        sigma_sq_ = lambda_ * sigma_sq_ + (1.0 - lambda_) * log_return * log_return;
        ++n_;
    }

    double vol_daily()    const noexcept { return std::sqrt(sigma_sq_); }
    double vol_annual()   const noexcept { return std::sqrt(sigma_sq_ * 252.0); }
    double var_daily()    const noexcept { return sigma_sq_; }
    std::size_t n_obs()   const noexcept { return n_; }

    // Half-life: number of periods until a shock's contribution decays by 50%
    static double halfLife(double lambda) noexcept {
        return -std::log(2.0) / std::log(lambda);
    }
    double halfLife() const noexcept { return halfLife(lambda_); }

    // Effective sample size: total weight = 1/(1-lambda)
    double effectiveN() const noexcept { return 1.0 / (1.0 - lambda_); }

    // Reset with a new base vol (e.g., after a regime change)
    void reset(double sigma_annual) noexcept {
        sigma_sq_ = sigma_annual * sigma_annual / 252.0;
    }

    // 99% daily VaR for a position with given notional
    double var99(double notional) const noexcept {
        return 2.326 * vol_daily() * notional;
    }
};`,
    explanation:
      "EWMA's persistence parameter lambda determines the memory of past shocks: at lambda = 0.94, a volatility shock from 11 trading days ago receives half the weight of today's observation. Unlike rolling window volatility (which drops old observations suddenly), EWMA decays smoothly, producing a differentiable volatility estimate — important for Greeks hedging where discontinuous vol changes cause artificial gamma P&L. The 2.326 multiplier for 99% VaR assumes normally distributed returns; for fat-tailed distributions, EVT-based quantiles are typically 1.5–2× larger.",
  },
  {
    id: "cpp-20260616-b1-quote-pack",
    language: "cpp",
    title: "64-bit quote packing — encode bid/ask/size into one CPU word",
    tag: "performance",
    code: `#include <cstdint>
#include <cassert>

// Bit-packed quote: encode bid, ask, and both sizes into 8 bytes.
// One 64-bit word = one CPU register = single load/store.
// 8 quotes fit in a 64-byte cache line instead of 2-3 with a struct layout.
// Field layout:
//   [63:48] bid × 100 as uint16 (range $0.00–$655.35)
//   [47:32] ask × 100 as uint16
//   [31:16] bid_size / 10 as uint16 (range 0–655,350 shares)
//   [15: 0] ask_size / 10 as uint16

class PackedQuote {
    std::uint64_t word_ = 0;

    static std::uint16_t toU16(double v, double scale) noexcept {
        long x = static_cast<long>(v * scale + 0.5);
        if (x < 0) x = 0;
        if (x > 65535) x = 65535;
        return static_cast<std::uint16_t>(x);
    }

public:
    void set(double bid, double ask, int bid_sz, int ask_sz) noexcept {
        word_ = (std::uint64_t(toU16(bid, 100.0))               << 48)
              | (std::uint64_t(toU16(ask, 100.0))               << 32)
              | (std::uint64_t(toU16(static_cast<double>(bid_sz), 0.1)) << 16)
              |  std::uint64_t(toU16(static_cast<double>(ask_sz), 0.1));
    }

    double bid()    const noexcept { return static_cast<double>(word_ >> 48)              * 0.01; }
    double ask()    const noexcept { return static_cast<double>((word_ >> 32) & 0xFFFFu)  * 0.01; }
    int    bid_sz() const noexcept { return static_cast<int>((word_ >> 16) & 0xFFFFu)     * 10; }
    int    ask_sz() const noexcept { return static_cast<int>(word_ & 0xFFFFu)              * 10; }

    double mid()    const noexcept { return (bid() + ask()) * 0.5; }
    double spread() const noexcept { return ask() - bid(); }

    std::uint64_t raw() const noexcept { return word_; }
};

static_assert(sizeof(PackedQuote) == 8, "Must be exactly 8 bytes");

// 8 packed quotes = 64 bytes = 1 cache line
// alignas(64) PackedQuote quote_cache[8];
// All 8 quotes loaded in a single cache-line fetch from L1.`,
    explanation:
      "Packing a quote into 8 bytes is a classic memory-bandwidth optimisation: a ring buffer of 1000 ticks takes 8 KB packed vs ~40 KB for a struct with double fields, fitting 5× more ticks into L1 cache. The trade-off is quantisation error (±$0.005 on price, ±5 shares on size) which is acceptable for display and alerting but not for order submission (which would use the original double values). The shift-and-mask extraction compiles to a single SHR + AND instruction on x86.",
  },
  {
    id: "cpp-20260616-b1-merton-jump",
    language: "cpp",
    title: "Merton jump-diffusion MC — Poisson-mixed GBM with log-normal jumps",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>

// Merton (1976) jump-diffusion:
// dS/S = (mu - lambda*k_bar)*dt + sigma*dW + (J-1)*dN
//   J ~ lognormal: log(J) ~ N(mu_J, sigma_J^2)
//   N(t) ~ Poisson(lambda) — arrival rate of jumps
//   k_bar = E[J-1] = exp(mu_J + 0.5*sigma_J^2) - 1 (compensated drift)
// Under risk-neutral measure: mu → r, lambda compensated so E[dS/S] = r*dt.

struct MertonParams {
    double sigma;    // diffusion vol (per year)
    double lambda;   // jump rate (jumps per year)
    double mu_J;     // mean log-jump size
    double sigma_J;  // std dev of log-jump size
};

struct MertonResult { double price, se; };

MertonResult mertonCallMC(double S0, double K, double r, const MertonParams& p,
                           double T, int paths = 100000, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double>    nd;
    std::poisson_distribution<int>      poi(p.lambda * T);
    std::normal_distribution<double>    jnd(p.mu_J, p.sigma_J);

    // Risk-neutral compensated drift: subtract the jump mean
    double k_bar   = std::exp(p.mu_J + 0.5 * p.sigma_J * p.sigma_J) - 1.0;
    double mu_eff  = r - p.lambda * k_bar;
    double drift   = (mu_eff - 0.5 * p.sigma * p.sigma) * T;
    double vol_sqT = p.sigma * std::sqrt(T);
    double disc    = std::exp(-r * T);

    double sum = 0.0, sum2 = 0.0;
    for (int path = 0; path < paths; ++path) {
        // GBM component
        double log_S = std::log(S0) + drift + vol_sqT * nd(rng);

        // Poisson number of jumps; add sum of log-normal jump sizes
        int n_jumps = poi(rng);
        for (int j = 0; j < n_jumps; ++j)
            log_S += jnd(rng);   // log(J_i) for each jump i

        double pay = disc * std::max(std::exp(log_S) - K, 0.0);
        sum  += pay;
        sum2 += pay * pay;
    }
    double price = sum / paths;
    double var   = (sum2 / paths - price * price) / (paths - 1);
    return {price, std::sqrt(var)};
}

// Merton's closed-form: sum of weighted BS prices with Poisson-weighted vols
// V_Merton = sum_{n=0}^{inf} e^{-lambda'*T} * (lambda'*T)^n / n! * BS(sigma_n)
// where lambda' = lambda*(1+k_bar), sigma_n^2 = sigma^2 + n*sigma_J^2/T`,
    explanation:
      "The compensated drift `r − λk̄` is the risk-neutral drift that makes the discounted stock price a martingale: without the compensation, the expected return would be r + λk̄ (drift plus expected jump gains), which would allow arbitrage. The simulation places all jumps at independent random times by sampling their total count from Poisson(λT) and summing iid log-normal log-jump sizes — this is exact because the order of jumps doesn't affect the terminal stock price, only their aggregate log contribution matters.",
  },
  {
    id: "cpp-20260616-b1-constexpr-matrix",
    language: "cpp",
    title: "constexpr matrix algebra — compile-time 2×2 and N×N matrix power",
    tag: "modern",
    code: `#include <array>
#include <cstddef>

// Constexpr matrix: small fixed-size matrices for Greeks rotations,
// DKK/EUR basis transformations, or multi-period compounding at compile time.
// std::array<std::array<double,N>,N> is the idiomatic zero-overhead matrix type.

template<std::size_t N>
using Mat = std::array<std::array<double, N>, N>;

template<std::size_t N>
using Vec = std::array<double, N>;

template<std::size_t N>
constexpr Mat<N> eye() noexcept {
    Mat<N> I{};
    for (std::size_t i = 0; i < N; ++i) I[i][i] = 1.0;
    return I;
}

template<std::size_t N>
constexpr Mat<N> matmul(const Mat<N>& A, const Mat<N>& B) noexcept {
    Mat<N> C{};
    for (std::size_t i = 0; i < N; ++i)
        for (std::size_t k = 0; k < N; ++k)
            for (std::size_t j = 0; j < N; ++j)
                C[i][j] += A[i][k] * B[k][j];
    return C;
}

template<std::size_t N>
constexpr Vec<N> matvec(const Mat<N>& A, const Vec<N>& x) noexcept {
    Vec<N> y{};
    for (std::size_t i = 0; i < N; ++i)
        for (std::size_t j = 0; j < N; ++j)
            y[i] += A[i][j] * x[j];
    return y;
}

// Matrix power via repeated squaring — O(N^3 log n) for n periods
template<std::size_t N>
constexpr Mat<N> matpow(Mat<N> A, int n) noexcept {
    Mat<N> R = eye<N>();
    while (n > 0) {
        if (n & 1) R = matmul(R, A);
        A = matmul(A, A);
        n >>= 1;
    }
    return R;
}

// Compile-time: quarterly compounding matrix for 2-factor short rate model
// M[i][j] = compounding of factor i to factor j (off-diagonal = correlation)
constexpr Mat<2> kQuarterlyCompound = {{{1.0125, 0.0}, {0.0, 1.0075}}};

// Annual compounding after 4 quarters — exact at compile time
constexpr Mat<2> kAnnualCompound = matpow(kQuarterlyCompound, 4);

// FX basis rotation: transform (delta_USD, delta_EUR) to (parallel, cross) basis
constexpr Mat<2> kFXBasis = {{{0.70711, 0.70711}, {-0.70711, 0.70711}}};  // ~45deg`,
    explanation:
      "The repeated-squaring matrix power reduces n multiplications to O(log n) matmul calls — for computing a 252-step compounding factor (one per trading day), this needs only 8 matmul calls instead of 252. All operations are constexpr so a 10-year term structure (2520 days) compounding matrix is computed once at compile time, eliminating the computation entirely from the runtime critical path. The 3-loop matmul is O(N³) which is fine for 2×2 through ~10×10 matrices.",
  },
  {
    id: "cpp-20260616-b1-memory-order",
    language: "cpp",
    title: "C++ memory ordering — the 6 orderings with market-data examples",
    tag: "concurrency",
    code: `#include <atomic>
#include <cassert>
#include <thread>

// C++ memory model: 6 orderings from weakest to strongest.
// On x86 (TSO): acquire/release are free (plain loads/stores), seq_cst adds MFENCE.
// On ARM/POWER: all orderings except seq_cst need explicit fences.
//
// relaxed     — atomicity only; no ordering guarantees. Use: counters, flags.
// consume     — load-dependent ordering; rarely used; often upgraded to acquire.
// acquire     — load: all subsequent reads/writes see what the release wrote.
// release     — store: all preceding reads/writes visible before this store.
// acq_rel     — for RMW ops (exchange, compare_exchange): both acquire and release.
// seq_cst     — total order across all threads; most expensive. Use: global coordination.

// --- Pattern 1: SPSC flag (acquire/release sufficient) ---
std::atomic<int>  payload{0};
std::atomic<bool> ready{false};

void producer_thread() {
    payload.store(42, std::memory_order_relaxed);     // no ordering needed yet
    ready.store(true, std::memory_order_release);     // publish: payload visible before ready
}
void consumer_thread() {
    while (!ready.load(std::memory_order_acquire)) {} // wait: guarantees payload visibility
    assert(payload.load(std::memory_order_relaxed) == 42);  // safe
}

// --- Pattern 2: Statistics counter (relaxed sufficient) ---
std::atomic<std::uint64_t> tick_count{0};
void on_tick() { tick_count.fetch_add(1, std::memory_order_relaxed); }
// Only atomicity needed; we don't care about ordering with other variables.

// --- Pattern 3: Lock flag (acq_rel for RMW) ---
std::atomic<bool> lock_{false};
bool tryLock() {
    // exchange: acq_rel = acquire (reads current) + release (makes lock visible)
    return !lock_.exchange(true, std::memory_order_acq_rel);
}
void unlock() {
    lock_.store(false, std::memory_order_release);   // release: unlock visible globally
}

// --- Pattern 4: When seq_cst is needed ---
// Two producers write to separate atomics; consumer must see both writes in
// consistent global order. acq_rel on different atomics doesn't guarantee this;
// seq_cst provides the single global total order.
std::atomic<bool> flagA{false}, flagB{false};
void writerA() { flagA.store(true, std::memory_order_seq_cst); }
void writerB() { flagB.store(true, std::memory_order_seq_cst); }
// Reader guaranteed: if flagB=true is seen, flagA=true was also already set.`,
    explanation:
      "The key insight is that acquire/release are pairwise: a release store on atomic X only synchronises with an acquire load on the same atomic X — it provides no guarantees about visibility through a different atomic. seq_cst adds a global program order across all seq_cst operations on all atomics, at the cost of a MFENCE (memory fence) instruction on x86 which serialises the store buffer (75–100 cycles). For HFT systems, minimising seq_cst operations is a significant latency optimisation; acquiring and releasing separate mutexes for producer/consumer eliminates most seq_cst needs.",
  },
  {
    id: "cpp-20260616-b1-vasicek-sim",
    language: "cpp",
    title: "Vasicek exact simulation — Gaussian short rate with analytic bond prices",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>

// Vasicek (1977): dr = kappa*(theta - r)*dt + sigma*dW
// Exact simulation: r(t+dt)|r(t) ~ N(mu_dt, var_dt) — no discretisation error.
// mu_dt  = theta + (r_t - theta)*exp(-kappa*dt)         (mean-reverting expectation)
// var_dt = sigma^2/(2*kappa) * (1 - exp(-2*kappa*dt))   (stationary variance scaling)
// Limitation: r can go negative (Vasicek's main weakness; CIR avoids this).

struct Vasicek { double kappa, theta, sigma, r0; };

// Closed-form zero-coupon bond: P(0,T) = exp(A(T) - B(T)*r0)
double vasicekBond(const Vasicek& v, double T) noexcept {
    double kap2 = v.kappa * v.kappa;
    double sig2 = v.sigma  * v.sigma;
    double B    = (1.0 - std::exp(-v.kappa * T)) / v.kappa;
    double A    = (v.theta - sig2 / (2.0 * kap2)) * (B - T)
                  - sig2 * B * B / (4.0 * v.kappa);
    return std::exp(A - B * v.r0);
}

// Implied zero yield from bond price
double vasicekYield(const Vasicek& v, double T) noexcept {
    return -std::log(vasicekBond(v, T)) / T;
}

// Exact simulation of a single step (no Euler-Maruyama bias)
double vasicekStep(double r, double dt, const Vasicek& v, std::mt19937_64& rng) noexcept {
    std::normal_distribution<double> nd;
    double e    = std::exp(-v.kappa * dt);
    double mean = v.theta + (r - v.theta) * e;
    double sd   = v.sigma * std::sqrt((1.0 - e*e) / (2.0 * v.kappa));
    return mean + sd * nd(rng);
}

// Simulate multiple paths; return matrix [n_paths][n_steps+1]
std::vector<std::vector<double>> vasicekPaths(const Vasicek& v, double T,
                                               int n_steps, int n_paths, int seed = 42) {
    std::mt19937_64 rng(seed);
    double dt = T / n_steps;
    std::vector<std::vector<double>> paths(n_paths, std::vector<double>(n_steps + 1, v.r0));
    for (int p = 0; p < n_paths; ++p)
        for (int t = 1; t <= n_steps; ++t)
            paths[p][t] = vasicekStep(paths[p][t-1], dt, v, rng);
    return paths;
}

// Example yield curve: Vasicek with kappa=0.5, theta=0.05, sigma=0.02, r0=0.03
// P(0,5) = vasicekBond({0.5, 0.05, 0.02, 0.03}, 5.0)  → price of 5-year zero bond`,
    explanation:
      "The exact Vasicek simulation differs from Euler-Maruyama in that the variance term `(1 − e^{−2κdt})/(2κ)` shrinks to zero as dt → 0 at the correct rate and captures the effect of mean reversion within the step — Euler would use σ²·dt regardless of kappa. For κ = 0.5 and dt = 1 year, the Euler variance is σ² while the exact variance is σ²·(1−e^{−1})/1 ≈ 0.63σ² — a meaningful difference for long-step simulations like annual Monte Carlo of term structure scenarios.",
  },
];
