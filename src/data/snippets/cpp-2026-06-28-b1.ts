import type { Snippet } from "./types";

export const cppSnippets20260628B1: Snippet[] = [
  {
    id: "cpp-20260628-b1-sfinae-enable-if",
    language: "cpp",
    title: "SFINAE with std::enable_if for numeric-only templates",
    tag: "metaprogramming",
    code: `#include <type_traits>
#include <cmath>

// Only instantiated for floating-point types; hard error otherwise.
template <typename T,
          typename = std::enable_if_t<std::is_floating_point_v<T>>>
T black_scholes_d1(T S, T K, T r, T sigma, T T_exp) {
    return (std::log(S / K) + (r + 0.5 * sigma * sigma) * T_exp)
           / (sigma * std::sqrt(T_exp));
}

// Tag-dispatch alternative — cleaner in multi-overload scenarios.
template <typename T>
T safe_sqrt_impl(T x, std::true_type /*is_floating_point*/) {
    return std::sqrt(x);
}

template <typename T>
T safe_sqrt_impl(T x, std::false_type) {
    static_assert(sizeof(T) == 0, "safe_sqrt requires a floating-point type");
}

template <typename T>
T safe_sqrt(T x) {
    return safe_sqrt_impl(x, std::is_floating_point<T>{});
}

int main() {
    double d1 = black_scholes_d1(100.0, 100.0, 0.05, 0.20, 1.0);
    // black_scholes_d1<int>(...) would fail to instantiate — SFINAE removes it.
    return 0;
}`,
    explanation: "SFINAE (Substitution Failure Is Not An Error) lets you constrain templates at instantiation time without a compiler error; std::enable_if_t makes the second template parameter ill-formed for non-matching types, silently removing the overload from the candidate set.",
  },
  {
    id: "cpp-20260628-b1-concepts-numeric",
    language: "cpp",
    title: "C++20 Concepts for quant numeric constraints",
    tag: "metaprogramming",
    code: `#include <concepts>
#include <cmath>
#include <type_traits>

// Concept: any type usable as a price (float or double)
template <typename T>
concept Price = std::floating_point<T>;

// Concept: instrument with a required price() method
template <typename T>
concept Priceable = requires(T t) {
    { t.price() } -> std::convertible_to<double>;
    { t.symbol() } -> std::convertible_to<std::string_view>;
};

template <Price T>
T bsm_call_price(T S, T K, T r, T sigma, T T_exp) {
    T d1 = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T_exp)
           / (sigma * std::sqrt(T_exp));
    T d2 = d1 - sigma * std::sqrt(T_exp);
    // Approximation for demo; real code uses erfc
    auto N = [](T x) -> T {
        return 0.5 * std::erfc(-x / std::sqrt(T(2)));
    };
    return S * N(d1) - K * std::exp(-r * T_exp) * N(d2);
}

struct Option {
    double px;
    std::string_view sym;
    double price()  const { return px; }
    std::string_view symbol() const { return sym; }
};

template <Priceable Inst>
void print_price(const Inst& inst) {
    // Constraint checked at compile time — cleaner than enable_if
}

int main() {
    double c = bsm_call_price(100.0, 100.0, 0.05, 0.20, 1.0);
    Option o{c, "AAPL"};
    print_price(o);
}`,
    explanation: "C++20 concepts replace SFINAE with readable, self-documenting constraints; the Priceable concept acts as a structural interface check enforced at compile time with clear error messages, while Price reuses the standard library's std::floating_point concept rather than reinventing it.",
  },
  {
    id: "cpp-20260628-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-size pool allocator for order objects",
    tag: "performance",
    code: `#include <cstdint>
#include <cstddef>
#include <array>
#include <cassert>

// O(1) alloc/free, no heap fragmentation, cache-local layout.
template <typename T, std::size_t N>
class PoolAllocator {
    union Slot {
        alignas(T) std::byte storage[sizeof(T)];
        Slot* next;
    };
    std::array<Slot, N> pool_;
    Slot* free_head_ = nullptr;
    std::size_t used_ = 0;

public:
    PoolAllocator() {
        // Build free list through the raw storage
        for (std::size_t i = 0; i + 1 < N; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[N - 1].next = nullptr;
        free_head_ = &pool_[0];
    }

    T* allocate() {
        assert(free_head_ && "pool exhausted");
        Slot* s = free_head_;
        free_head_ = s->next;
        ++used_;
        return reinterpret_cast<T*>(s->storage);
    }

    void deallocate(T* p) {
        p->~T();                              // destroy manually
        Slot* s = reinterpret_cast<Slot*>(p);
        s->next = free_head_;
        free_head_ = s;
        --used_;
    }

    std::size_t used() const { return used_; }
};

struct Order { uint64_t id; double price; uint32_t qty; };

PoolAllocator<Order, 4096> gOrderPool;  // static pool for 4096 orders

int main() {
    Order* o = new (gOrderPool.allocate()) Order{1, 100.25, 500};
    gOrderPool.deallocate(o);
    assert(gOrderPool.used() == 0);
}`,
    explanation: "A pool allocator pre-allocates all objects in a contiguous block and maintains a free-list using the unused storage itself (union trick), giving O(1) alloc/free with zero system calls during the hot path — critical in HFT where malloc latency spikes can cause missed quotes.",
  },
  {
    id: "cpp-20260628-b1-atomic-memory-order",
    language: "cpp",
    title: "std::atomic memory orders: seq_cst vs acquire/release",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <cassert>

// A lock-free flag used to publish a price update.
// seq_cst is the default but most expensive; acquire/release is sufficient here.
struct PriceUpdate {
    double bid = 0.0;
    double ask = 0.0;
    std::atomic<uint64_t> seq{0};  // sequence number acts as a seqlock
};

PriceUpdate g_px;

// Producer: write prices then bump seq (release = "flush stores before here")
void publish(double bid, double ask) {
    g_px.bid = bid;
    g_px.ask = ask;
    // release: all preceding writes visible to any thread that sees the new seq
    g_px.seq.fetch_add(1, std::memory_order_release);
}

// Consumer: spin on seq change, then read prices
double consume_mid() {
    uint64_t s;
    do {
        // acquire: all subsequent reads see writes done before the release above
        s = g_px.seq.load(std::memory_order_acquire);
    } while (s == 0);          // wait for first publish
    return (g_px.bid + g_px.ask) * 0.5;
}

// Seqlock pattern (full read-side)
double seqlock_read() {
    uint64_t s1, s2;
    double mid;
    do {
        s1 = g_px.seq.load(std::memory_order_acquire);
        if (s1 & 1) continue;  // writer in progress (odd seq)
        mid = (g_px.bid + g_px.ask) * 0.5;
        s2 = g_px.seq.load(std::memory_order_acquire);
    } while (s1 != s2);        // retry if seq changed during read
    return mid;
}`,
    explanation: "Acquire/release pairs are sufficient for producer-consumer synchronisation and avoid the global memory fence that std::memory_order_seq_cst imposes on x86; the seqlock pattern extends this to allow concurrent readers without any writer lock, achieving read latency close to two atomic loads.",
  },
  {
    id: "cpp-20260628-b1-spsc-queue",
    language: "cpp",
    title: "Lock-free SPSC (single-producer, single-consumer) ring queue",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstdint>

// Power-of-two capacity for cheap modulo via bitmask.
template <typename T, std::size_t Cap>
class SPSCQueue {
    static_assert((Cap & (Cap - 1)) == 0, "Cap must be power of two");
    static constexpr std::size_t MASK = Cap - 1;

    alignas(64) std::atomic<std::size_t> head_{0};  // written by consumer
    alignas(64) std::atomic<std::size_t> tail_{0};  // written by producer
    alignas(64) std::array<T, Cap> buf_;

public:
    // Producer: returns false if full
    bool push(const T& val) {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        std::size_t h = head_.load(std::memory_order_acquire);
        if (t - h >= Cap) return false;   // full
        buf_[t & MASK] = val;
        tail_.store(t + 1, std::memory_order_release);
        return true;
    }

    // Consumer: returns nullopt if empty
    std::optional<T> pop() {
        std::size_t h = head_.load(std::memory_order_relaxed);
        std::size_t t = tail_.load(std::memory_order_acquire);
        if (h == t) return std::nullopt;  // empty
        T val = buf_[h & MASK];
        head_.store(h + 1, std::memory_order_release);
        return val;
    }

    std::size_t size() const {
        return tail_.load(std::memory_order_acquire)
             - head_.load(std::memory_order_acquire);
    }
};

struct Tick { double price; uint32_t qty; };
SPSCQueue<Tick, 4096> g_queue;`,
    explanation: "Cache-line padding (alignas(64)) between head and tail prevents false sharing between the producer and consumer threads; the power-of-two mask replaces modulo with a bitwise AND, and relaxed loads on the local index avoid unnecessary memory barriers on the hot path.",
  },
  {
    id: "cpp-20260628-b1-fix-tag-parser",
    language: "cpp",
    title: "FIX protocol tag=value message parser (zero-copy, string_view)",
    tag: "market-data",
    code: `#include <string_view>
#include <charconv>
#include <optional>
#include <functional>

// FIX messages: "8=FIX.4.2\x01 35=D\x01 49=SENDER\x01 ..."
// SOH = 0x01 field separator; parse without copying.

struct FixField {
    int             tag;
    std::string_view value;
};

class FixParser {
public:
    // Callback invoked for each tag=value pair
    using Handler = std::function<void(FixField)>;

    static void parse(std::string_view msg, Handler cb) {
        while (!msg.empty()) {
            auto eq = msg.find('=');
            if (eq == std::string_view::npos) break;

            int tag = 0;
            std::from_chars(msg.data(), msg.data() + eq, tag);

            msg.remove_prefix(eq + 1);  // past '='
            auto soh = msg.find('\x01');
            std::string_view val = (soh == std::string_view::npos)
                                   ? msg : msg.substr(0, soh);
            cb({tag, val});
            if (soh == std::string_view::npos) break;
            msg.remove_prefix(soh + 1); // past SOH
        }
    }

    static std::optional<std::string_view> find(std::string_view msg, int want_tag) {
        std::optional<std::string_view> result;
        parse(msg, [&](FixField f) {
            if (f.tag == want_tag) result = f.value;
        });
        return result;
    }
};

int main() {
    std::string_view fix = "8=FIX.4.2\x01""35=D\x01""49=SENDER\x01""56=TARGET\x01""11=ORD001\x01""54=1\x01""55=AAPL\x01""44=150.25\x01""38=100\x01";
    auto symbol = FixParser::find(fix, 55); // tag 55 = Symbol
    // *symbol == "AAPL" — no allocations, zero-copy view into original buffer
}`,
    explanation: "Using std::string_view and std::from_chars throughout avoids any heap allocation during parsing; a FIX gateway processing 500k messages/second cannot afford even a single std::string copy per field, so zero-copy view-based parsing is mandatory in production systems.",
  },
  {
    id: "cpp-20260628-b1-binary-market-data",
    language: "cpp",
    title: "Binary market data decoder (Pitch/ITCH-style, packed structs)",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <bit>

// Always read multibyte integers via memcpy to avoid UB from misaligned access.
inline uint16_t read_u16_be(const uint8_t* p) {
    uint16_t v; std::memcpy(&v, p, 2);
    if constexpr (std::endian::native == std::endian::little)
        v = __builtin_bswap16(v);
    return v;
}
inline uint32_t read_u32_be(const uint8_t* p) {
    uint32_t v; std::memcpy(&v, p, 4);
    if constexpr (std::endian::native == std::endian::little)
        v = __builtin_bswap32(v);
    return v;
}
inline uint64_t read_u64_be(const uint8_t* p) {
    uint64_t v; std::memcpy(&v, p, 8);
    if constexpr (std::endian::native == std::endian::little)
        v = __builtin_bswap64(v);
    return v;
}

// ITCH 5.0-style Add Order message (type 'A', 36 bytes)
struct AddOrder {
    uint64_t timestamp_ns;
    uint64_t order_ref;
    char     side;         // 'B' or 'S'
    uint32_t shares;
    char     stock[8];
    double   price;        // encoded as int32 * 1e-4
};

AddOrder decode_add_order(const uint8_t* buf) {
    AddOrder o;
    o.timestamp_ns = read_u64_be(buf + 1);
    o.order_ref    = read_u64_be(buf + 9);
    o.side         = static_cast<char>(buf[17]);
    o.shares       = read_u32_be(buf + 18);
    std::memcpy(o.stock, buf + 22, 8);
    int32_t px_raw;
    std::memcpy(&px_raw, buf + 30, 4);
    if constexpr (std::endian::native == std::endian::little)
        px_raw = __builtin_bswap32(px_raw);
    o.price = px_raw * 1e-4;
    return o;
}`,
    explanation: "Accessing packed binary protocol data via memcpy rather than pointer casts avoids undefined behaviour from strict-aliasing and misalignment; constexpr if lets the compiler dead-strip the byte-swap on big-endian platforms, keeping the decoder portable without runtime overhead.",
  },
  {
    id: "cpp-20260628-b1-crtp-pricer",
    language: "cpp",
    title: "CRTP static polymorphism for option pricers",
    tag: "metaprogramming",
    code: `#include <cmath>

// Base CRTP class; no vtable, no virtual dispatch overhead.
template <typename Derived>
class OptionPricer {
public:
    double price(double S, double K, double r, double T, double sigma) const {
        return static_cast<const Derived*>(this)->price_impl(S, K, r, T, sigma);
    }
    double delta(double S, double K, double r, double T, double sigma,
                 double eps = 0.01) const {
        // Finite-difference delta: shared in the base, calls derived price_impl
        return (price(S + eps, K, r, T, sigma) - price(S - eps, K, r, T, sigma))
               / (2.0 * eps);
    }
};

// Black-Scholes call
struct BSMCall : OptionPricer<BSMCall> {
    double price_impl(double S, double K, double r, double T, double sigma) const {
        double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
        double d2 = d1 - sigma * std::sqrt(T);
        auto N = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
        return S * N(d1) - K * std::exp(-r*T) * N(d2);
    }
};

// Digital call (same interface, different model)
struct DigitalCall : OptionPricer<DigitalCall> {
    double price_impl(double S, double K, double r, double T, double sigma) const {
        double d2 = (std::log(S/K) + (r - 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
        auto N = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
        return std::exp(-r*T) * N(d2);
    }
};

template <typename Pricer>
void print_greeks(const Pricer& p, double S, double K, double r, double T, double vol) {
    // Fully inlined at compile time — zero virtual dispatch
}`,
    explanation: "CRTP achieves the open-closed principle (add new pricers without modifying the base) with zero runtime overhead: the compiler inlines the derived price_impl directly into every delta/vega call site, unlike virtual dispatch which requires an indirect branch and prevents inlining.",
  },
  {
    id: "cpp-20260628-b1-constexpr-greeks",
    language: "cpp",
    title: "constexpr compile-time option parameters and Greeks tables",
    tag: "metaprogramming",
    code: `#include <cmath>
#include <array>

// Compile-time log approximation (limited range, for demo)
constexpr double cx_abs(double x) { return x < 0 ? -x : x; }

// C++20: many <cmath> functions are constexpr in gcc/clang
// Pre-C++20: implement manually or use consteval thunks.

constexpr double SQRT2 = 1.41421356237309504880168872420969807856967;
constexpr double SQRTPI2 = 0.79788456080286535587989211986876373695;

// Build a compile-time table of BSM implied d1 values for a strike grid.
// (Using approximations valid for constexpr context.)
struct StrikeGrid {
    static constexpr int    N  = 10;
    static constexpr double S  = 100.0;
    static constexpr double r  = 0.05;
    static constexpr double T  = 1.0;
    static constexpr double vol = 0.20;
    static constexpr double K_lo = 90.0;
    static constexpr double K_step = 2.0;
};

// At runtime, the table is a read-only constant — no computation at startup.
// In C++23, constexpr std::log is mandated; here we rely on gcc/clang extension.
consteval std::array<double, StrikeGrid::N> build_strike_table() {
    std::array<double, StrikeGrid::N> tbl{};
    for (int i = 0; i < StrikeGrid::N; ++i) {
        double K = StrikeGrid::K_lo + i * StrikeGrid::K_step;
        // Real constexpr log requires C++23 or compiler extension
        tbl[i] = K;  // placeholder; replace with constexpr BSM d1 in C++23
    }
    return tbl;
}

constexpr auto kStrikeTable = build_strike_table();

int main() {
    // Table exists in .rodata — zero runtime initialisation cost
    for (double k : kStrikeTable) (void)k;
}`,
    explanation: "consteval forces evaluation at compile time (unlike constexpr which may defer to runtime), moving strike-grid or Greeks-table construction to the compiler so the resulting binary contains only a read-only data segment with zero startup overhead — critical in latency-sensitive initialisation paths.",
  },
  {
    id: "cpp-20260628-b1-fold-expressions",
    language: "cpp",
    title: "C++17 fold expressions for variadic portfolio aggregation",
    tag: "metaprogramming",
    code: `#include <iostream>
#include <type_traits>

// Sum an arbitrary number of position notionals at compile time dispatch.
template <typename... Ts>
double total_notional(Ts... notionals) {
    static_assert((std::is_arithmetic_v<Ts> && ...), "all args must be numeric");
    return (... + notionals);   // unary left fold over +
}

// Max of variadic pack
template <typename T, typename... Ts>
T pack_max(T first, Ts... rest) {
    if constexpr (sizeof...(rest) == 0) return first;
    T rest_max = pack_max(rest...);
    return first > rest_max ? first : rest_max;
}

// Variadic risk check: all positions within limit
template <typename... Limits>
bool all_within(double limit, Limits... positions) {
    // Binary right fold: (pos1 < limit) && (pos2 < limit) && ...
    return ((positions < limit) && ...);
}

// Variadic string join (for symbol list building)
template <typename... Strs>
std::string join_symbols(Strs... symbols) {
    std::string result;
    ((result += symbols, result += ','), ...);  // comma fold
    if (!result.empty()) result.pop_back();
    return result;
}

int main() {
    double total = total_notional(1e6, 2.5e6, 500e3);  // 4e6
    bool ok = all_within(1e6, 800e3, 999e3, 500e3);    // true
    std::string syms = join_symbols("AAPL", "MSFT", "GOOG");
}`,
    explanation: "Fold expressions eliminate the need for recursive template specialisations for variadic aggregation; the unary fold (... + notionals) expands to notional0 + notional1 + ... at compile time, while the binary fold in all_within short-circuits like a hand-written loop but with no runtime recursion overhead.",
  },
  {
    id: "cpp-20260628-b1-structured-bindings",
    language: "cpp",
    title: "Structured bindings for order and quote decomposition",
    tag: "modern-cpp",
    code: `#include <tuple>
#include <map>
#include <string>
#include <iostream>

struct Quote {
    double bid, ask, mid;
    int    bid_size, ask_size;
};

Quote make_quote(double bid, double ask, int bs, int as_) {
    return {bid, ask, (bid + ask) / 2.0, bs, as_};
}

// C++17 structured binding to a struct
void process_quote(const Quote& q) {
    auto [bid, ask, mid, bs, as_] = q;  // all fields bound by value
    double spread = ask - bid;
    (void)spread;
}

// Binding map iteration — much cleaner than .first / .second
void process_positions(const std::map<std::string, double>& pos) {
    for (const auto& [symbol, notional] : pos) {
        // symbol = key, notional = value
        if (notional > 1e6) { /* flag large position */ }
    }
}

// Binding tuple returns from multi-value functions
std::tuple<double, double, bool> best_bid_ask(
    const std::map<std::string, Quote>& book, const std::string& sym)
{
    auto it = book.find(sym);
    if (it == book.end()) return {0, 0, false};
    return {it->second.bid, it->second.ask, true};
}

int main() {
    std::map<std::string, Quote> book{{"AAPL", make_quote(149.9, 150.1, 100, 200)}};
    auto [bid, ask, found] = best_bid_ask(book, "AAPL");
    if (found) std::cout << bid << " / " << ask << "\n";
}`,
    explanation: "Structured bindings eliminate the boilerplate of .first/.second on map iterators and named-field access on POD structs, making intent explicit at the call site; they bind by value, reference, or const reference depending on the declaration (auto vs auto& vs const auto&), so use auto& when iterating large containers to avoid copies.",
  },
  {
    id: "cpp-20260628-b1-variant-order-type",
    language: "cpp",
    title: "std::variant for polymorphic order types without inheritance",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string>
#include <iostream>

struct LimitOrder  { uint64_t id; double price; uint32_t qty; std::string symbol; };
struct MarketOrder { uint64_t id; uint32_t qty; std::string symbol; };
struct StopOrder   { uint64_t id; double trigger; uint32_t qty; std::string symbol; };

using Order = std::variant<LimitOrder, MarketOrder, StopOrder>;

struct OrderVisitor {
    void operator()(const LimitOrder& o) const {
        std::cout << "Limit  " << o.symbol << " " << o.qty << "@" << o.price << "\n";
    }
    void operator()(const MarketOrder& o) const {
        std::cout << "Market " << o.symbol << " " << o.qty << "\n";
    }
    void operator()(const StopOrder& o) const {
        std::cout << "Stop   " << o.symbol << " " << o.qty
                  << " trigger=" << o.trigger << "\n";
    }
};

// Returns notional if limit, else 0
double notional(const Order& ord) {
    return std::visit([](const auto& o) -> double {
        if constexpr (std::is_same_v<std::decay_t<decltype(o)>, LimitOrder>)
            return o.price * o.qty;
        else
            return 0.0;
    }, ord);
}

int main() {
    Order o1 = LimitOrder{1, 150.25, 100, "AAPL"};
    Order o2 = MarketOrder{2, 50, "GOOG"};
    std::visit(OrderVisitor{}, o1);
    std::visit(OrderVisitor{}, o2);
    std::cout << "Notional: " << notional(o1) << "\n";  // 15025
}`,
    explanation: "std::variant stores exactly one of a closed set of types in a type-safe discriminated union without heap allocation; std::visit dispatches to the correct overload at runtime using a compile-time jump table, giving the polymorphism of virtual dispatch with the cache efficiency of value types stored in contiguous containers.",
  },
  {
    id: "cpp-20260628-b1-string-view-parse",
    language: "cpp",
    title: "Zero-copy CSV tick data parser with std::string_view",
    tag: "market-data",
    code: `#include <string_view>
#include <charconv>
#include <vector>
#include <cstdint>

struct Tick {
    uint64_t    ts_ns;
    double      price;
    uint32_t    volume;
    char        side;  // 'B' or 'S'
};

// Parse a single CSV line: "1700000001234567890,150.25,500,B"
// Returns false on parse error.
bool parse_tick(std::string_view line, Tick& out) {
    auto next = [&](char delim) -> std::string_view {
        auto pos = line.find(delim);
        std::string_view field = line.substr(0, pos);
        line.remove_prefix(pos == std::string_view::npos ? line.size() : pos + 1);
        return field;
    };

    auto sv_ts  = next(',');
    auto sv_px  = next(',');
    auto sv_vol = next(',');
    auto sv_sd  = next('\n');

    auto res_ts = std::from_chars(sv_ts.data(), sv_ts.data() + sv_ts.size(),  out.ts_ns);
    auto res_px = std::from_chars(sv_px.data(), sv_px.data() + sv_px.size(),  out.price);
    auto res_v  = std::from_chars(sv_vol.data(),sv_vol.data() + sv_vol.size(),out.volume);

    if (res_ts.ec != std::errc{} || res_px.ec != std::errc{} ||
        res_v.ec  != std::errc{} || sv_sd.empty())
        return false;

    out.side = sv_sd[0];
    return true;
}

int main() {
    std::string_view line = "1700000001234567890,150.25,500,B";
    Tick t;
    parse_tick(line, t);
    // t.price == 150.25, t.volume == 500, t.side == 'B'
}`,
    explanation: "std::from_chars does not throw and does not parse locale-specific formats, making it safe and fast for binary-to-text conversion in hot paths; combined with string_view slicing, this parser processes millions of ticks per second without a single heap allocation.",
  },
  {
    id: "cpp-20260628-b1-prefetch-hint",
    language: "cpp",
    title: "Software prefetching for cache-warm order book traversal",
    tag: "performance",
    code: `#include <cstdint>
#include <vector>
#include <immintrin.h>  // _mm_prefetch

struct PriceLevel {
    double   price;
    uint32_t total_qty;
    uint32_t order_count;
    char     padding[44];  // pad to 64 bytes (one cache line)
};

// Without prefetch: each cache miss stalls ~100-300 cycles on DDR5.
// With prefetch: hide latency by issuing loads ahead of time.
double sum_qty_prefetch(const std::vector<PriceLevel>& levels) {
    constexpr int PREFETCH_DIST = 8;  // 8 * 64 = 512 bytes ahead
    double total = 0.0;
    int n = static_cast<int>(levels.size());

    for (int i = 0; i < n; ++i) {
        // Issue prefetch for a future cache line while working on current
        if (i + PREFETCH_DIST < n)
            _mm_prefetch(
                reinterpret_cast<const char*>(&levels[i + PREFETCH_DIST]),
                _MM_HINT_T0);  // T0 = L1 cache, T1 = L2, T2 = L3, NTA = stream

        total += levels[i].total_qty;
    }
    return total;
}

// __builtin_prefetch is the GCC/Clang portable alternative:
// __builtin_prefetch(addr, rw=0, locality=3)
// rw: 0=read, 1=write; locality: 0=no temporal locality, 3=all cache levels`,
    explanation: "Prefetch instructions issue a cache line load N iterations ahead of where the CPU currently is; choosing the right PREFETCH_DIST requires measuring memory latency (typically 50-80ns on DRAM) divided by loop iteration time — too small wastes the benefit, too large evicts other useful data from L1.",
  },
  {
    id: "cpp-20260628-b1-hugepages",
    language: "cpp",
    title: "Transparent Huge Pages and mmap for NUMA-local allocation",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <cstring>
#include <stdexcept>

// Allocate a huge-page-backed buffer — reduces TLB pressure for large order books.
void* alloc_huge(std::size_t bytes) {
    // MAP_ANONYMOUS | MAP_PRIVATE: not backed by a file
    // MAP_HUGETLB: request huge pages (2 MiB on x86-64)
    void* p = mmap(nullptr, bytes,
                   PROT_READ | PROT_WRITE,
                   MAP_ANONYMOUS | MAP_PRIVATE | MAP_HUGETLB,
                   -1, 0);
    if (p == MAP_FAILED) {
        // Fallback: let the kernel use Transparent Huge Pages (THP)
        p = mmap(nullptr, bytes,
                 PROT_READ | PROT_WRITE,
                 MAP_ANONYMOUS | MAP_PRIVATE,
                 -1, 0);
        if (p == MAP_FAILED) throw std::runtime_error("mmap failed");
        // Advise kernel to back with huge pages if possible
        madvise(p, bytes, MADV_HUGEPAGE);
    }
    // Touch every page to ensure physical backing before hot path
    std::memset(p, 0, bytes);
    return p;
}

void free_huge(void* p, std::size_t bytes) {
    munmap(p, bytes);
}

// NUMA-local allocation (libnuma): bind allocation to socket 0
// #include <numa.h>
// void* p = numa_alloc_onnode(bytes, 0);  // socket 0`,
    explanation: "A 4-KiB standard page requires one TLB entry per 4 KiB; a 2-MiB huge page covers 512× more memory per entry, reducing TLB miss rate from ~5% to <0.1% for a 1 GB order book — measurable as a 10-20% throughput improvement in cache-cold order-book scans on modern CPUs.",
  },
  {
    id: "cpp-20260628-b1-fd-pde-pricer",
    language: "cpp",
    title: "Crank-Nicolson finite-difference PDE pricer for European options",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Solves BS PDE backward in time on a uniform S-grid.
// Thomas algorithm for tridiagonal system (O(N) per time step).
std::vector<double> cn_pricer(double S0, double K, double r, double sigma,
                               double T, int Ns, int Nt, bool is_call) {
    double S_max = 3.0 * K;
    double dS    = S_max / Ns;
    double dt    = T    / Nt;
    double alpha = 0.25 * dt;  // Crank-Nicolson: 0.5 implicit + 0.5 explicit

    std::vector<double> S(Ns + 1), V(Ns + 1);
    for (int i = 0; i <= Ns; ++i) S[i] = i * dS;

    // Terminal condition
    for (int i = 0; i <= Ns; ++i)
        V[i] = is_call ? std::max(S[i] - K, 0.0) : std::max(K - S[i], 0.0);

    // Tridiagonal coefficients
    std::vector<double> a(Ns+1), b(Ns+1), c(Ns+1), rhs(Ns+1);
    std::vector<double> c_prime(Ns+1), d_prime(Ns+1);

    for (int n = 0; n < Nt; ++n) {
        for (int i = 1; i < Ns; ++i) {
            double sig2 = sigma * sigma * i * i;
            double mu   = r * i;
            a[i] = -alpha * (sig2 - mu);
            b[i] =  1.0 + alpha * (sig2 + r);
            c[i] = -alpha * (sig2 + mu);
            // RHS uses explicit part (mirrored coefficients)
            rhs[i] = alpha*(sig2-mu)*V[i-1] + (1-alpha*(sig2+r))*V[i]
                   + alpha*(sig2+mu)*V[i+1];
        }
        // Boundary conditions
        V[0]  = is_call ? 0.0 : K * std::exp(-r * (T - n * dt));
        V[Ns] = is_call ? (S_max - K * std::exp(-r * (T - n * dt))) : 0.0;
        rhs[1]    -= a[1]    * V[0];
        rhs[Ns-1] -= c[Ns-1] * V[Ns];

        // Thomas algorithm forward sweep
        c_prime[1] = c[1] / b[1];
        d_prime[1] = rhs[1] / b[1];
        for (int i = 2; i < Ns; ++i) {
            double m = b[i] - a[i] * c_prime[i-1];
            c_prime[i] = c[i] / m;
            d_prime[i] = (rhs[i] - a[i] * d_prime[i-1]) / m;
        }
        // Back substitution
        V[Ns-1] = d_prime[Ns-1];
        for (int i = Ns-2; i >= 1; --i)
            V[i] = d_prime[i] - c_prime[i] * V[i+1];
    }
    return V;
}`,
    explanation: "Crank-Nicolson is second-order accurate in both space and time (unlike explicit Euler which is only first-order) and unconditionally stable for the Black-Scholes PDE; the Thomas algorithm exploits the tridiagonal structure to solve the implicit system in O(N) per time step rather than O(N³) for a general solver.",
  },
  {
    id: "cpp-20260628-b1-asian-option-mc",
    language: "cpp",
    title: "Asian option MC pricer with antithetic variates",
    tag: "numerics",
    code: `#include <random>
#include <cmath>
#include <numeric>
#include <vector>

struct AsianResult { double price; double stderr; };

AsianResult asian_mc(double S0, double K, double r, double sigma,
                     double T, int steps, int n_paths) {
    double dt    = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    std::mt19937_64 rng{42};
    std::normal_distribution<double> norm{0.0, 1.0};

    std::vector<double> payoffs;
    payoffs.reserve(n_paths);

    for (int i = 0; i < n_paths / 2; ++i) {
        double S1 = S0, S2 = S0;
        double sum1 = S0, sum2 = S0;  // arithmetic average including S0

        for (int t = 0; t < steps; ++t) {
            double z = norm(rng);
            S1 *= std::exp(drift + vol * z);   // original path
            S2 *= std::exp(drift - vol * z);   // antithetic path
            sum1 += S1;
            sum2 += S2;
        }

        double avg1 = sum1 / (steps + 1);
        double avg2 = sum2 / (steps + 1);
        payoffs.push_back(disc * std::max(avg1 - K, 0.0));
        payoffs.push_back(disc * std::max(avg2 - K, 0.0));
    }

    double mean  = std::accumulate(payoffs.begin(), payoffs.end(), 0.0) / n_paths;
    double var   = 0.0;
    for (double p : payoffs) var += (p - mean) * (p - mean);
    double se = std::sqrt(var / (n_paths * (n_paths - 1)));
    return {mean, se};
}`,
    explanation: "Antithetic variates pair each random normal z with its negation -z; since the two resulting paths are negatively correlated, their average payoff has lower variance than two independent paths — typically halving the standard error at zero extra cost beyond the second simulation, making it the first variance-reduction technique deployed in practice.",
  },
  {
    id: "cpp-20260628-b1-barrier-option-mc",
    language: "cpp",
    title: "Down-and-out barrier option MC with Brownian bridge correction",
    tag: "numerics",
    code: `#include <random>
#include <cmath>

// Brownian bridge probability of touching barrier b between two points.
// Reduces discretisation bias from large dt.
inline double bb_surv_prob(double S_lo, double S_hi, double b, double sigma, double dt) {
    if (S_lo <= b || S_hi <= b) return 0.0;  // already crossed
    // P(not touch | S_a, S_b) = 1 - exp(-2 * ln(Sa/b) * ln(Sb/b) / (sigma^2 * dt))
    double la = std::log(S_lo / b);
    double lb = std::log(S_hi / b);
    return 1.0 - std::exp(-2.0 * la * lb / (sigma * sigma * dt));
}

double barrier_mc(double S0, double K, double B,  // B = barrier (< S0)
                  double r, double sigma, double T,
                  int steps, int n_paths) {
    double dt    = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    std::mt19937_64 rng{123};
    std::normal_distribution<double> norm{};
    double sum_payoff = 0.0;

    for (int i = 0; i < n_paths; ++i) {
        double S    = S0;
        double prob = 1.0;   // survival probability (product of bridge probs)
        bool killed = false;

        for (int t = 0; t < steps && !killed; ++t) {
            double S_prev = S;
            S *= std::exp(drift + vol * norm(rng));
            if (S <= B) { killed = true; break; }
            prob *= bb_surv_prob(S_prev, S, B, sigma, dt);
        }

        if (!killed)
            sum_payoff += prob * disc * std::max(S - K, 0.0);
    }

    return sum_payoff / n_paths;
}`,
    explanation: "Without Brownian bridge correction, a discrete path can jump over and back across a barrier within a single time step without being detected, causing an upward bias in barrier option prices; the bridge probability weights each surviving path by the probability it never touched the barrier between grid points, recovering O(dt) convergence instead of O(√dt).",
  },
  {
    id: "cpp-20260628-b1-open-addressing-hashmap",
    language: "cpp",
    title: "Open-addressing hash map for symbol→position lookup",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cstring>
#include <string_view>
#include <optional>

// Robin Hood open-addressing hash map — better cache performance than chaining.
template <std::size_t CAP = 1024>
class SymbolMap {
    static_assert((CAP & (CAP-1)) == 0, "CAP must be power of two");
    struct Entry {
        char     key[12] = {};
        int64_t  value   = 0;
        bool     used    = false;
        uint8_t  psl     = 0;  // probe sequence length for Robin Hood
    };
    Entry table_[CAP];
    std::size_t size_ = 0;

    std::size_t hash(std::string_view s) const {
        // FNV-1a: fast, good distribution for short strings
        uint64_t h = 14695981039346656037ULL;
        for (char c : s) h = (h ^ static_cast<uint8_t>(c)) * 1099511628211ULL;
        return h & (CAP - 1);
    }

public:
    void set(std::string_view key, int64_t val) {
        std::size_t idx = hash(key);
        Entry incoming;
        std::memcpy(incoming.key, key.data(), std::min(key.size(), std::size_t(11)));
        incoming.value = val; incoming.used = true; incoming.psl = 0;

        for (;;) {
            Entry& slot = table_[idx & (CAP-1)];
            if (!slot.used) { slot = incoming; ++size_; return; }
            if (incoming.psl > slot.psl) std::swap(incoming, slot);  // Robin Hood swap
            ++incoming.psl;
            ++idx;
        }
    }

    std::optional<int64_t> get(std::string_view key) const {
        std::size_t idx = hash(key); uint8_t psl = 0;
        for (;;) {
            const Entry& slot = table_[idx & (CAP-1)];
            if (!slot.used || psl > slot.psl) return std::nullopt;
            if (std::strncmp(slot.key, key.data(), 11) == 0) return slot.value;
            ++psl; ++idx;
        }
    }
};`,
    explanation: "Robin Hood hashing limits worst-case probe length by swapping an incoming entry with any slot that has a shorter probe sequence, ensuring a more even probe distribution than standard linear probing and making lookup O(1) expected with very low variance — crucial for predictable sub-microsecond symbol→position lookups.",
  },
  {
    id: "cpp-20260628-b1-perf-delta-risk",
    language: "cpp",
    title: "Portfolio delta risk engine with vectorised spot bump",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <numeric>

struct Position {
    double spot;    // current underlying price
    double strike;
    double vol;
    double r;
    double T;
    double qty;     // number of contracts (signed)
};

// Black-Scholes delta for a call
static double bs_delta(double S, double K, double r, double v, double T) {
    double d1 = (std::log(S/K) + (r + 0.5*v*v)*T) / (v * std::sqrt(T));
    return 0.5 * std::erfc(-d1 / std::sqrt(2.0));
}

// Portfolio dollar delta: sum of qty_i * spot_i * delta_i
double portfolio_dollar_delta(const std::vector<Position>& book) {
    double total = 0.0;
    for (const auto& p : book) {
        double delta = bs_delta(p.spot, p.strike, p.r, p.vol, p.T);
        total += p.qty * p.spot * delta;  // dollar delta = qty * S * delta
    }
    return total;
}

// Parallel bump: compute dDelta/dSpot (gamma) via central difference
double portfolio_dollar_gamma(const std::vector<Position>& book, double eps = 0.01) {
    double g = 0.0;
    for (const auto& p : book) {
        double d_up   = bs_delta(p.spot + eps, p.strike, p.r, p.vol, p.T);
        double d_down = bs_delta(p.spot - eps, p.strike, p.r, p.vol, p.T);
        g += p.qty * p.spot * (d_up - d_down) / (2.0 * eps);
    }
    return g;
}`,
    explanation: "Dollar delta (qty × S × Δ) rather than unit delta is the correct risk metric for aggregation across options on different underlyings with different prices; separating the bumped calculation into a function enables easy parallelisation with std::transform_reduce and SIMD autovectorisation when Position members are laid out contiguously.",
  },
  {
    id: "cpp-20260628-b1-type-erasure-pricer",
    language: "cpp",
    title: "Type erasure with std::function for runtime pricer dispatch",
    tag: "modern-cpp",
    code: `#include <functional>
#include <memory>
#include <vector>
#include <string>
#include <unordered_map>

// A pricer is anything callable as (S, K, r, sigma, T) -> double.
using PricerFn = std::function<double(double, double, double, double, double)>;

class PricerRegistry {
    std::unordered_map<std::string, PricerFn> map_;
public:
    void register_pricer(std::string name, PricerFn fn) {
        map_[std::move(name)] = std::move(fn);
    }

    double price(const std::string& name,
                 double S, double K, double r, double sigma, double T) const {
        auto it = map_.find(name);
        if (it == map_.end()) throw std::runtime_error("pricer not found: " + name);
        return it->second(S, K, r, sigma, T);
    }
};

// Register any callable — lambda, function pointer, or functor
double mc_pricer(double S, double K, double r, double sigma, double T);
double bs_pricer(double S, double K, double r, double sigma, double T);

PricerRegistry make_registry() {
    PricerRegistry reg;
    reg.register_pricer("bsm",     bs_pricer);
    reg.register_pricer("mc",      mc_pricer);
    reg.register_pricer("digital", [](double S, double K, double r, double v, double T){
        double d2 = (std::log(S/K)+(r-0.5*v*v)*T)/(v*std::sqrt(T));
        return std::exp(-r*T)*0.5*std::erfc(-d2/std::sqrt(2.0));
    });
    return reg;
}`,
    explanation: "std::function provides type erasure — the registry stores heterogeneous callables (lambdas, free functions, functors) under a uniform interface without requiring a common base class; the trade-off versus CRTP is a small virtual-call-like overhead from the type-erased call, acceptable in risk batch runs where the setup cost dominates.",
  },
  {
    id: "cpp-20260628-b1-template-type-list",
    language: "cpp",
    title: "Compile-time type list for instrument taxonomy",
    tag: "metaprogramming",
    code: `#include <type_traits>
#include <cstddef>

// Typelist — a pure compile-time sequence of types
template <typename... Ts> struct TypeList {};

// Size
template <typename TL> struct TL_Size;
template <typename... Ts>
struct TL_Size<TypeList<Ts...>> : std::integral_constant<std::size_t, sizeof...(Ts)> {};

// Head
template <typename TL> struct TL_Head;
template <typename H, typename... Ts>
struct TL_Head<TypeList<H, Ts...>> { using type = H; };

// Contains
template <typename T, typename TL> struct TL_Contains;
template <typename T>
struct TL_Contains<T, TypeList<>> : std::false_type {};
template <typename T, typename H, typename... Ts>
struct TL_Contains<T, TypeList<H, Ts...>>
    : std::conditional_t<std::is_same_v<T, H>,
                         std::true_type,
                         TL_Contains<T, TypeList<Ts...>>> {};

// Instrument taxonomy
struct EuropeanCall{};
struct EuropeanPut{};
struct AmericanCall{};
struct AsianCall{};
struct BarrierOption{};

using VanillaTypes  = TypeList<EuropeanCall, EuropeanPut>;
using ExoticTypes   = TypeList<AsianCall, BarrierOption>;
using AmericanTypes = TypeList<AmericanCall>;

// Static_assert that a type is in the expected list at compile time
static_assert(TL_Contains<AsianCall, ExoticTypes>::value);
static_assert(!TL_Contains<EuropeanCall, ExoticTypes>::value);
static_assert(TL_Size<ExoticTypes>::value == 2);`,
    explanation: "Compile-time type lists let you encode instrument taxonomies that are enforced by the type checker; TL_Contains enables static_asserts that catch a developer adding a vanilla product to an exotic-only pricer at compile time rather than at runtime, which is especially valuable in a risk system where wrong categorisation silently misprices.",
  },
  {
    id: "cpp-20260628-b1-perfect-forward",
    language: "cpp",
    title: "Perfect forwarding for order factory functions",
    tag: "modern-cpp",
    code: `#include <utility>
#include <memory>
#include <string>
#include <iostream>

struct Order {
    std::string symbol;
    double      price;
    uint32_t    qty;
    Order(std::string s, double p, uint32_t q)
        : symbol(std::move(s)), price(p), qty(q) {}
};

// Without perfect forwarding: must write two overloads (l-value and r-value)
// With perfect forwarding: one template handles both
template <typename... Args>
std::unique_ptr<Order> make_order(Args&&... args) {
    // std::forward preserves value category: lvalue stays lvalue, rvalue stays rvalue
    return std::make_unique<Order>(std::forward<Args>(args)...);
}

// Factory with additional validation
template <typename... Args>
Order* order_pool_emplace(void* storage, Args&&... args) {
    // Placement new into pool storage — no heap allocation
    return new(storage) Order(std::forward<Args>(args)...);
}

int main() {
    std::string sym = "AAPL";

    // lvalue: sym is copied into Order (forwarded as lvalue)
    auto o1 = make_order(sym, 150.25, 100u);

    // rvalue: std::move(sym) is moved into Order (forwarded as rvalue)
    auto o2 = make_order(std::move(sym), 151.00, 200u);

    std::cout << o1->symbol << " " << o2->symbol << "\n";
    // sym is now empty (moved from)
}`,
    explanation: "std::forward preserves the value category of each argument through the forwarding reference (T&&); without it, all forwarded arguments would be treated as lvalues even if they were rvalues at the call site, causing unnecessary copies of move-only types like std::string or std::unique_ptr in hot-path object construction.",
  },
  {
    id: "cpp-20260628-b1-seqlock",
    language: "cpp",
    title: "Seqlock for wait-free price publication",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstring>

// Seqlock: one writer, many readers; readers retry on torn read.
// Avoids reader starvation unlike a mutex — readers never block the writer.
struct alignas(64) Quote {
    std::atomic<uint32_t> seq{0};
    double bid = 0.0;
    double ask = 0.0;
    double last = 0.0;
    uint64_t ts_ns = 0;
};

// Writer (must be single-threaded or externally synchronised)
void publish_quote(Quote& q, double bid, double ask, double last, uint64_t ts) {
    // Odd seq signals write in progress
    q.seq.fetch_add(1, std::memory_order_relaxed);
    std::atomic_thread_fence(std::memory_order_release);  // fence before payload

    q.bid    = bid;
    q.ask    = ask;
    q.last   = last;
    q.ts_ns  = ts;

    std::atomic_thread_fence(std::memory_order_release);
    q.seq.fetch_add(1, std::memory_order_relaxed);  // back to even
}

// Reader: retry if seq was odd (write in progress) or changed mid-read
bool read_quote(const Quote& q, double& bid, double& ask, double& last) {
    uint32_t s1, s2;
    do {
        s1 = q.seq.load(std::memory_order_acquire);
        if (s1 & 1) continue;   // writer in progress
        bid  = q.bid;
        ask  = q.ask;
        last = q.last;
        std::atomic_thread_fence(std::memory_order_acquire);
        s2 = q.seq.load(std::memory_order_relaxed);
    } while (s1 != s2);
    return true;
}`,
    explanation: "A seqlock achieves wait-free reads by allowing readers to detect a torn write via the odd/even sequence counter rather than acquiring a lock; because the writer never waits for readers, publication latency is deterministic — essential for a market-data feed handler that must publish thousands of updates per second without jitter.",
  },
  {
    id: "cpp-20260628-b1-bellman-ford-fx",
    language: "cpp",
    title: "Bellman-Ford negative-cycle detection for FX arbitrage",
    tag: "algorithms",
    code: `#include <vector>
#include <cmath>
#include <limits>
#include <string>

struct Edge { int from, to; double weight; };  // weight = -log(rate)

// Returns true if a negative cycle exists (= FX arbitrage opportunity).
bool detect_arbitrage(int n_currencies,
                      const std::vector<std::tuple<int,int,double>>& rates) {
    // Build edge list: weight = -log(exchange_rate)
    std::vector<Edge> edges;
    for (const auto& [i, j, rate] : rates)
        edges.push_back({i, j, -std::log(rate)});

    constexpr double INF = std::numeric_limits<double>::infinity();
    std::vector<double> dist(n_currencies, INF);
    dist[0] = 0.0;  // virtual source; all currencies reachable in this dense graph

    // Relax n-1 times
    for (int k = 0; k < n_currencies - 1; ++k)
        for (const auto& [u, v, w] : edges)
            if (dist[u] < INF && dist[u] + w < dist[v])
                dist[v] = dist[u] + w;

    // Check for further relaxation (= negative cycle)
    for (const auto& [u, v, w] : edges)
        if (dist[u] < INF && dist[u] + w < dist[v])
            return true;   // arbitrage!

    return false;
}

int main() {
    // USD=0, EUR=1, GBP=2
    std::vector<std::tuple<int,int,double>> rates = {
        {0,1,1.10}, {1,2,1.25}, {2,0,0.73}  // 1.10*1.25*0.73 < 1: no arb
    };
    bool arb = detect_arbitrage(3, rates);
    // arb == false; for a real triangular arb the product > 1 => negative cycle
}`,
    explanation: "Transforming exchange rates via -log maps multiplicative chains (product of rates) to additive paths (sum of log-rates), so a profitable cycle (product > 1) becomes a negative-weight cycle detectable by Bellman-Ford's Nth-iteration relaxation step — the canonical algorithm for FX arbitrage detection in quant interviews.",
  },
  {
    id: "cpp-20260628-b1-greeks-autodiff",
    language: "cpp",
    title: "Dual-number automatic differentiation for exact option Greeks",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>

// Dual number: value + derivative carried in parallel
struct Dual {
    double val = 0.0;
    double dot = 0.0;  // derivative w.r.t. the differentiation variable
    Dual(double v = 0.0, double d = 0.0) : val(v), dot(d) {}
};

// Arithmetic operations propagate derivatives via chain rule
Dual operator+(Dual a, Dual b) { return {a.val+b.val, a.dot+b.dot}; }
Dual operator-(Dual a, Dual b) { return {a.val-b.val, a.dot-b.dot}; }
Dual operator*(Dual a, Dual b) { return {a.val*b.val, a.dot*b.val + a.val*b.dot}; }
Dual operator/(Dual a, Dual b) { return {a.val/b.val, (a.dot*b.val - a.val*b.dot)/(b.val*b.val)}; }
Dual exp_d(Dual a)  { double e = std::exp(a.val);   return {e, a.dot*e}; }
Dual log_d(Dual a)  { return {std::log(a.val), a.dot/a.val}; }
Dual sqrt_d(Dual a) { double s = std::sqrt(a.val);  return {s, a.dot/(2.0*s)}; }
// erfc derivative: d/dx erfc(x) = -2/sqrt(pi) * exp(-x^2)
Dual erfc_d(Dual a) {
    return {std::erfc(a.val),
            -2.0/std::sqrt(M_PI) * std::exp(-a.val*a.val) * a.dot};
}

Dual bs_call(Dual S, Dual K, Dual r, Dual sigma, Dual T) {
    Dual sq2 = {std::sqrt(2.0), 0.0};
    Dual d1 = (log_d(S/K) + (r + sigma*sigma*Dual{0.5}) * T) / (sigma*sqrt_d(T));
    Dual d2 = d1 - sigma*sqrt_d(T);
    auto N = [&](Dual x){ return Dual{0.5}*erfc_d(Dual{-1.0}*x/sq2); };
    return S*N(d1) - K*exp_d(Dual{-1.0}*r*T)*N(d2);
}

int main() {
    // Delta: differentiate w.r.t. S by setting S.dot = 1
    Dual S{100.0, 1.0}, K{100.0}, r{0.05}, sigma{0.20}, T{1.0};
    Dual price = bs_call(S, K, r, sigma, T);
    std::cout << "Price: " << price.val << "\n";   // ~10.45
    std::cout << "Delta: " << price.dot << "\n";   // ~0.637 (exact, not FD approx)
}`,
    explanation: "Forward-mode automatic differentiation via dual numbers produces the exact derivative alongside the function value in a single pass with no finite-difference approximation error; setting S.dot=1 computes delta, sigma.dot=1 computes vega — each requiring one evaluation rather than two (central difference) or one (forward difference) with controlled rounding error.",
  },
];
