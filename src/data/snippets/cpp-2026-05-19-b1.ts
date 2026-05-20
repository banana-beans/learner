import type { Snippet } from "./types";

export const cppSnippets20260519B1: Snippet[] = [
  {
    id: "cpp-20260519-b1-perfect-forwarding",
    language: "cpp",
    title: "Perfect forwarding (std::forward)",
    tag: "templates",
    code: `#include <iostream>
#include <string>
#include <utility>

void sink(const std::string& s) { std::cout << "copy: " << s << "\\n"; }
void sink(std::string&& s)      { std::cout << "move: " << s << "\\n"; }

// Universal reference T&& + std::forward preserves value category.
template<typename T>
void relay(T&& arg) {
    sink(std::forward<T>(arg));
}

int main() {
    std::string s = "hello";
    relay(s);              // lvalue -> copy overload
    relay(std::move(s));   // rvalue -> move overload
    relay("temporary");    // rvalue -> move overload
}`,
    explanation:
      "Without std::forward, named parameters are always lvalues, silently copying what the caller intended to move. The T&& + forward<T> pair is the canonical factory/wrapper pattern for zero-overhead argument passing.",
  },
  {
    id: "cpp-20260519-b1-sfinae-enable-if",
    language: "cpp",
    title: "SFINAE with std::enable_if_t",
    tag: "templates",
    code: `#include <cmath>
#include <iostream>
#include <type_traits>

// Floating-point version: round price to nearest tick size.
template<typename T>
std::enable_if_t<std::is_floating_point_v<T>, T>
round_to_tick(T price, T tick) {
    return std::round(price / tick) * tick;
}

// Integer version: integer division truncates correctly.
template<typename T>
std::enable_if_t<std::is_integral_v<T>, T>
round_to_tick(T price, T tick) {
    return (price / tick) * tick;
}

int main() {
    std::cout << round_to_tick(100.37, 0.05) << "\\n";  // 100.35
    std::cout << round_to_tick(1037, 5)       << "\\n";  // 1035
}`,
    explanation:
      "SFINAE lets you provide type-safe overloads without virtual dispatch — the wrong branch simply doesn't exist at compile time, so there is zero runtime cost. Prefer C++20 Concepts for new code, but SFINAE remains common in existing quant libraries.",
  },
  {
    id: "cpp-20260519-b1-concepts",
    language: "cpp",
    title: "C++20 Concepts (Numeric and Priceable)",
    tag: "templates",
    code: `#include <concepts>
#include <iostream>
#include <string>

template<typename T>
concept Numeric = std::is_arithmetic_v<T>;

// Priceable: anything with a .price() returning a Numeric type.
template<typename T>
concept Priceable = requires(T t) {
    { t.price() } -> Numeric;
};

template<Numeric T>
T mid(T bid, T ask) { return (bid + ask) / T{2}; }

struct Quote {
    double bid, ask;
    double price() const { return (bid + ask) / 2.0; }
};

template<Priceable P>
void print_mid(P&& p) {
    std::cout << "mid = " << p.price() << "\\n";
}

int main() {
    std::cout << mid(100.0, 101.0) << "\\n";
    print_mid(Quote{100.0, 101.0});
}`,
    explanation:
      "Concepts replace SFINAE with readable constraints and produce clear compiler error messages instead of pages of template substitution failures — the requires clause documents intent at the call site.",
  },
  {
    id: "cpp-20260519-b1-if-constexpr",
    language: "cpp",
    title: "if constexpr (compile-time dispatch)",
    tag: "templates",
    code: `#include <cstdint>
#include <iostream>
#include <string>
#include <type_traits>

// One function serializes int, double, or string — no virtual calls.
template<typename T>
std::string serialize(const T& val) {
    if constexpr (std::is_integral_v<T>) {
        return "INT:" + std::to_string(val);
    } else if constexpr (std::is_floating_point_v<T>) {
        return "DBL:" + std::to_string(val);
    } else {
        return "STR:" + val;
    }
}

int main() {
    std::cout << serialize(42)                     << "\\n";
    std::cout << serialize(3.14)                   << "\\n";
    std::cout << serialize(std::string("AAPL"))    << "\\n";
}`,
    explanation:
      "Unlike a runtime if, if constexpr discards the dead branch entirely so the else clause need not even compile for a given instantiation — safer than tag dispatch and cleaner than full specialisation for simple type bifurcations.",
  },
  {
    id: "cpp-20260519-b1-fold-expressions",
    language: "cpp",
    title: "Fold expressions (sum variadic, any_of)",
    tag: "templates",
    code: `#include <iostream>
#include <type_traits>

// Unary right-fold: sum any number of arithmetic args.
template<typename... Ts>
auto sum(Ts... vals) {
    return (vals + ...);   // expands: v0 + (v1 + (v2 + ...))
}

// Binary fold with || — short-circuits like a hand-written loop.
template<typename T, typename... Ts>
bool any_of(T first, Ts... rest) {
    return (first || ... || rest);
}

// Comma fold: print all args separated by spaces.
template<typename... Ts>
void print_all(Ts&&... args) {
    ((std::cout << args << ' '), ...);
    std::cout << "\\n";
}

int main() {
    std::cout << sum(1, 2, 3, 4, 5) << "\\n";         // 15
    std::cout << any_of(false, false, true) << "\\n";  // 1
    print_all("AAPL", 150.5, "USD");
}`,
    explanation:
      "Fold expressions collapse variadic packs in a single expression without recursion; the compiler emits exactly the same code as if you had written the chain by hand. They are the idiomatic C++17 replacement for old index-sequence tricks.",
  },
  {
    id: "cpp-20260519-b1-string-view-from-chars",
    language: "cpp",
    title: "std::string_view + std::from_chars (zero-copy parser)",
    tag: "modern",
    code: `#include <charconv>
#include <iostream>
#include <string_view>

// Parse "SYM=250.10" without allocating any heap memory.
bool parse_quote(std::string_view msg, std::string_view& sym, double& price) {
    auto eq = msg.find('=');
    if (eq == std::string_view::npos) return false;

    sym = msg.substr(0, eq);
    std::string_view price_sv = msg.substr(eq + 1);

    auto [ptr, ec] = std::from_chars(
        price_sv.data(),
        price_sv.data() + price_sv.size(),
        price
    );
    return ec == std::errc{};
}

int main() {
    std::string_view sym;
    double price{};
    if (parse_quote("AAPL=250.10", sym, price))
        std::cout << sym << " @ " << price << "\\n";
}`,
    explanation:
      "string_view is a non-owning slice (pointer + length) that never allocates; std::from_chars avoids locales and heap. Together they let a market-data handler parse millions of messages per second without touching the allocator.",
  },
  {
    id: "cpp-20260519-b1-span",
    language: "cpp",
    title: "std::span (generic contiguous-range view)",
    tag: "modern",
    code: `#include <array>
#include <iostream>
#include <span>
#include <vector>

// Works for std::vector, std::array, C arrays, and raw pointer+size.
double dot_product(std::span<const double> a, std::span<const double> b) {
    double result = 0.0;
    for (std::size_t i = 0; i < a.size(); ++i)
        result += a[i] * b[i];
    return result;
}

int main() {
    std::vector<double> v1{1, 2, 3};
    std::array<double, 3> a2{4, 5, 6};
    std::cout << dot_product(v1, a2) << "\\n"; // 32

    double raw[3] = {1, 2, 3};
    std::cout << dot_product(raw, a2) << "\\n"; // 32
}`,
    explanation:
      "std::span replaces (pointer, size) pairs with a safe, self-describing view that works across all contiguous container types at zero runtime cost — avoids overloading for vector vs array or adding an unnecessary template parameter.",
  },
  {
    id: "cpp-20260519-b1-pmr-monotonic",
    language: "cpp",
    title: "PMR monotonic_buffer_resource (stack arena)",
    tag: "memory",
    code: `#include <array>
#include <iostream>
#include <memory_resource>
#include <vector>

void process_tick() {
    // 4 KB stack buffer — zero heap allocation for the whole tick.
    std::array<std::byte, 4096> buf;
    std::pmr::monotonic_buffer_resource arena{
        buf.data(), buf.size(),
        std::pmr::null_memory_resource()  // error if overflow
    };

    std::pmr::vector<double> scratch{&arena};
    scratch.reserve(64);

    for (int i = 0; i < 50; ++i)
        scratch.push_back(i * 0.01);

    double s = 0;
    for (double x : scratch) s += x;
    std::cout << "sum = " << s << "\\n";
    // arena destructor frees the whole block in O(1).
}

int main() { process_tick(); }`,
    explanation:
      "A monotonic arena bumps a pointer on each allocation and reclaims all memory in O(1) by resetting, making it ideal for per-event scratch space where deterministic latency matters more than memory reuse between ticks.",
  },
  {
    id: "cpp-20260519-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list (Order/Level)",
    tag: "design",
    code: `#include <iostream>

struct Order {
    int id;
    double price;
    int qty;
    Order* prev{nullptr};
    Order* next{nullptr};
};

struct Level {
    Order* head{nullptr};
    Order* tail{nullptr};

    void push_back(Order* o) {
        o->prev = tail;
        o->next = nullptr;
        if (tail) tail->next = o;
        else head = o;
        tail = o;
    }

    void remove(Order* o) {
        if (o->prev) o->prev->next = o->next;
        else         head = o->next;
        if (o->next) o->next->prev = o->prev;
        else         tail = o->prev;
        o->prev = o->next = nullptr;
    }
};

int main() {
    Order a{1, 100.0, 10}, b{2, 100.0, 20}, c{3, 100.0, 5};
    Level lvl;
    lvl.push_back(&a); lvl.push_back(&b); lvl.push_back(&c);
    lvl.remove(&b);
    for (Order* o = lvl.head; o; o = o->next)
        std::cout << o->id << " qty=" << o->qty << "\\n";
}`,
    explanation:
      "Intrusive lists embed link pointers inside the node object itself, eliminating the separate heap allocation that std::list makes per element; order book cancels are O(1) given a pointer to the order, with no hash lookup needed.",
  },
  {
    id: "cpp-20260519-b1-cas-counter",
    language: "cpp",
    title: "CAS retry loop (lock-free bounded counter)",
    tag: "concurrency",
    code: `#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

struct CasCounter {
    std::atomic<int64_t> value{0};

    // Increment only if counter is below limit — atomically.
    bool try_increment(int64_t limit) {
        int64_t cur = value.load(std::memory_order_relaxed);
        while (cur < limit) {
            if (value.compare_exchange_weak(cur, cur + 1,
                    std::memory_order_release,
                    std::memory_order_relaxed))
                return true;
            // cur is refreshed by CAS on failure — loop retries automatically.
        }
        return false;
    }
};

int main() {
    CasCounter c;
    std::vector<std::thread> threads;
    for (int i = 0; i < 8; ++i)
        threads.emplace_back([&]{ for (int j = 0; j < 1000; ++j) c.try_increment(8000); });
    for (auto& t : threads) t.join();
    std::cout << "final = " << c.value.load() << "\\n";  // <= 8000
}`,
    explanation:
      "compare_exchange_weak is preferred over _strong in retry loops because _weak may spuriously fail (cheaper on some ISAs), while _strong emits an internal loop — the outer while already handles spurious failures.",
  },
  {
    id: "cpp-20260519-b1-treiber-stack",
    language: "cpp",
    title: "Treiber lock-free stack (CAS on atomic head)",
    tag: "concurrency",
    code: `#include <atomic>
#include <iostream>
#include <optional>

template<typename T>
struct TreiberStack {
    struct Node {
        T value;
        Node* next{nullptr};
        explicit Node(T v) : value(std::move(v)) {}
    };

    std::atomic<Node*> head{nullptr};

    void push(T val) {
        Node* n = new Node(std::move(val));
        n->next = head.load(std::memory_order_relaxed);
        while (!head.compare_exchange_weak(n->next, n,
                   std::memory_order_release,
                   std::memory_order_relaxed)) {}
    }

    std::optional<T> pop() {
        Node* old = head.load(std::memory_order_acquire);
        while (old && !head.compare_exchange_weak(old, old->next,
                           std::memory_order_acquire,
                           std::memory_order_relaxed)) {}
        if (!old) return std::nullopt;
        T val = std::move(old->value);
        delete old;   // naive: safe only without concurrent pops (use hazard ptrs)
        return val;
    }
};

int main() {
    TreiberStack<int> s;
    s.push(1); s.push(2); s.push(3);
    while (auto v = s.pop()) std::cout << *v << "\\n"; // 3 2 1
}`,
    explanation:
      "The Treiber stack is the canonical lock-free LIFO structure: push/pop are O(1) via a single CAS on the head pointer. The delete is naive — in production use hazard pointers or epoch-based reclamation to avoid ABA and use-after-free.",
  },
  {
    id: "cpp-20260519-b1-binary-protocol-parser",
    language: "cpp",
    title: "Binary protocol parser (memcpy-based TradeFrame)",
    tag: "performance",
    code: `#include <cstdint>
#include <cstring>
#include <iostream>

// Wire layout: 8-byte instrument_id, 8-byte price (ticks*10000), 4-byte qty.
struct TradeFrame {
    int64_t  instrument_id;
    int64_t  price_ticks;
    uint32_t qty;
};

// memcpy avoids UB from pointer aliasing violations.
bool decode_trade(const uint8_t* buf, std::size_t len, TradeFrame& out) {
    if (len < sizeof(TradeFrame)) return false;
    std::memcpy(&out, buf, sizeof(TradeFrame));
    return true;
}

int main() {
    alignas(8) uint8_t buf[20]{};
    int64_t  id    = 42;
    int64_t  price = 2501000;  // 250.10 * 10000
    uint32_t qty   = 100;
    std::memcpy(buf,      &id,    8);
    std::memcpy(buf + 8,  &price, 8);
    std::memcpy(buf + 16, &qty,   4);

    TradeFrame tf{};
    if (decode_trade(buf, sizeof(buf), tf))
        std::cout << "id=" << tf.instrument_id
                  << " price=" << tf.price_ticks
                  << " qty="   << tf.qty << "\\n";
}`,
    explanation:
      "memcpy is the standard-compliant way to reinterpret raw bytes without strict-aliasing UB; modern compilers optimise memcpy of a known size into a single load instruction. Packing fields in a fixed-layout struct enables deterministic wire-format versioning.",
  },
  {
    id: "cpp-20260519-b1-fix-parser",
    language: "cpp",
    title: "FIX tag=value ASCII parser",
    tag: "quant",
    code: `#include <charconv>
#include <functional>
#include <iostream>
#include <string_view>

using FieldCb = std::function<void(int, std::string_view)>;

void parse_fix(std::string_view msg, char delim, FieldCb cb) {
    while (!msg.empty()) {
        auto sep = msg.find('=');
        if (sep == std::string_view::npos) break;

        int tag{};
        std::from_chars(msg.data(), msg.data() + sep, tag);
        msg.remove_prefix(sep + 1);

        auto end = msg.find(delim);
        std::string_view val = (end == std::string_view::npos)
                               ? msg : msg.substr(0, end);
        cb(tag, val);
        msg.remove_prefix((end == std::string_view::npos) ? msg.size() : end + 1);
    }
}

int main() {
    // Production: use SOH (0x01) as delimiter; '|' here for readability.
    parse_fix("8=FIX.4.2|35=D|49=CLIENT|56=BROKER|", '|',
        [](int tag, std::string_view val) {
            std::cout << "tag=" << tag << " val=" << val << "\\n";
        });
}`,
    explanation:
      "Parsing FIX with string_view slices and from_chars avoids any allocation on the critical path; in ultra-low-latency builds, replace std::function with a template callback parameter to eliminate the indirect virtual call per field.",
  },
  {
    id: "cpp-20260519-b1-hash-order-book",
    language: "cpp",
    title: "Hash-based order book with best bid/ask tracking",
    tag: "quant",
    code: `#include <cstdint>
#include <iostream>
#include <limits>
#include <unordered_map>

struct HashBook {
    std::unordered_map<int64_t, uint64_t> bids, asks;
    int64_t best_bid{std::numeric_limits<int64_t>::min()};
    int64_t best_ask{std::numeric_limits<int64_t>::max()};

    void add_bid(int64_t price, uint64_t qty) {
        bids[price] += qty;
        if (price > best_bid) best_bid = price;
    }
    void add_ask(int64_t price, uint64_t qty) {
        asks[price] += qty;
        if (price < best_ask) best_ask = price;
    }
    void cancel_bid(int64_t price, uint64_t qty) {
        auto it = bids.find(price);
        if (it == bids.end()) return;
        it->second = (it->second > qty) ? it->second - qty : 0;
        if (it->second == 0) { bids.erase(it); recalc_best_bid(); }
    }
    void recalc_best_bid() {
        best_bid = std::numeric_limits<int64_t>::min();
        for (auto& [p, q] : bids) if (q > 0 && p > best_bid) best_bid = p;
    }
};

int main() {
    HashBook book;
    book.add_bid(10050, 100); book.add_bid(10045, 200);
    book.add_ask(10055, 150);
    std::cout << "best bid=" << book.best_bid
              << " best ask=" << book.best_ask << "\\n";
    book.cancel_bid(10050, 100);
    std::cout << "best bid after cancel=" << book.best_bid << "\\n";
}`,
    explanation:
      "An unordered_map book gives O(1) add and lookup but O(n) best-price recalculation after a cancel — acceptable for thin books or research; production HFT systems maintain a sorted structure or parallel heap to keep best-price updates O(log n).",
  },
  {
    id: "cpp-20260519-b1-likely-unlikely",
    language: "cpp",
    title: "[[likely]] / [[unlikely]] branch hints",
    tag: "performance",
    code: `#include <cstdint>
#include <iostream>

enum class MsgType : uint8_t { Trade = 1, Quote = 2, Heartbeat = 3 };

void dispatch(MsgType t) {
    if (t == MsgType::Trade) [[likely]] {
        // 95%+ of messages on most feeds are trades.
        std::cout << "trade\\n";
    } else if (t == MsgType::Quote) [[unlikely]] {
        std::cout << "quote\\n";
    } else [[unlikely]] {
        std::cout << "heartbeat\\n";
    }
}

void process_qty(int64_t qty) {
    if (qty != 0) [[likely]] {
        std::cout << "active order qty=" << qty << "\\n";
    } else [[unlikely]] {
        std::cout << "empty level\\n";
    }
}

int main() {
    dispatch(MsgType::Trade);
    dispatch(MsgType::Heartbeat);
    process_qty(100);
}`,
    explanation:
      "[[likely]] and [[unlikely]] are C++20 attributes that guide the CPU branch predictor by telling the compiler which path to lay out sequentially in the instruction stream, reducing branch-misprediction penalties without modifying logic.",
  },
  {
    id: "cpp-20260519-b1-prefetch",
    language: "cpp",
    title: "__builtin_prefetch (explicit cache warm-up)",
    tag: "performance",
    code: `#include <iostream>
#include <numeric>
#include <vector>

// Prefetch AHEAD elements ahead so data arrives in L1
// by the time the CPU actually processes that element.
double sum_with_prefetch(const std::vector<double>& v) {
    constexpr int AHEAD = 8;  // tune to memory latency / element size
    double total = 0.0;
    const std::size_t n = v.size();
    for (std::size_t i = 0; i < n; ++i) {
        if (i + AHEAD < n)
            __builtin_prefetch(&v[i + AHEAD], 0 /*read*/, 1 /*L2 hint*/);
        total += v[i];
    }
    return total;
}

int main() {
    std::vector<double> prices(1'000'000);
    std::iota(prices.begin(), prices.end(), 0.0);
    std::cout << sum_with_prefetch(prices) << "\\n";
}`,
    explanation:
      "__builtin_prefetch emits a PREFETCHT1 (x86) instruction that starts a cache-line load without stalling the CPU, hiding the ~200-cycle DRAM latency for large sequential scans like order-book depth sweeps.",
  },
  {
    id: "cpp-20260519-b1-thomas-algorithm",
    language: "cpp",
    title: "Thomas algorithm — O(N) tridiagonal solver",
    tag: "quant",
    code: `#include <iostream>
#include <vector>

// Solves A*x = d where A is tridiagonal: a=sub-diag, b=main, c=super-diag.
// Modifies b and d in place; solution returned in d.
void thomas_solve(std::vector<double> a,   // sub  (a[0] unused)
                  std::vector<double> b,   // main
                  std::vector<double> c,   // super (c[n-1] unused)
                  std::vector<double>& d)  // rhs, becomes solution
{
    const int n = static_cast<int>(b.size());
    // Forward sweep
    for (int i = 1; i < n; ++i) {
        double w = a[i] / b[i - 1];
        b[i] -= w * c[i - 1];
        d[i] -= w * d[i - 1];
    }
    // Back substitution
    d[n - 1] /= b[n - 1];
    for (int i = n - 2; i >= 0; --i)
        d[i] = (d[i] - c[i] * d[i + 1]) / b[i];
}

int main() {
    std::vector<double> a{0, -1, -1, -1};
    std::vector<double> b{ 4,  4,  4,  4};
    std::vector<double> c{-1, -1, -1,  0};
    std::vector<double> d{ 1,  2,  3,  4};
    thomas_solve(a, b, c, d);
    for (double x : d) std::cout << x << " ";
    std::cout << "\\n";
}`,
    explanation:
      "The Thomas algorithm solves an N×N tridiagonal system in O(N) time versus O(N³) for general Gaussian elimination, making it the backbone of Crank-Nicolson PDE option pricers where N can reach thousands of price grid points.",
  },
  {
    id: "cpp-20260519-b1-asian-mc",
    language: "cpp",
    title: "Asian arithmetic-mean option Monte Carlo",
    tag: "quant",
    code: `#include <algorithm>
#include <cmath>
#include <iostream>
#include <random>

double asian_call_mc(double S0, double K, double r, double sigma,
                     double T, int steps, int paths, unsigned seed = 42) {
    std::mt19937_64 rng{seed};
    std::normal_distribution<double> norm{0.0, 1.0};

    const double dt    = T / steps;
    const double drift = (r - 0.5*sigma*sigma) * dt;
    const double vol   = sigma * std::sqrt(dt);

    double payoff_sum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S = S0, running_sum = 0.0;
        for (int t = 0; t < steps; ++t) {
            S *= std::exp(drift + vol * norm(rng));
            running_sum += S;
        }
        payoff_sum += std::max(running_sum / steps - K, 0.0);
    }
    return std::exp(-r * T) * payoff_sum / paths;
}

int main() {
    double price = asian_call_mc(100.0, 100.0, 0.05, 0.2, 1.0, 252, 100'000);
    std::cout << "Asian call MC price: " << price << "\\n";
}`,
    explanation:
      "Asian options average the underlying over fixing dates, dampening volatility relative to a vanilla option. Maintaining a running sum instead of storing the path keeps memory O(steps) and the MC variance is lower than for vanilla calls.",
  },
  {
    id: "cpp-20260519-b1-barrier-mc",
    language: "cpp",
    title: "Knock-out barrier option Monte Carlo",
    tag: "quant",
    code: `#include <algorithm>
#include <cmath>
#include <iostream>
#include <random>

// Down-and-out call: knocked out if S ever touches barrier B from above.
double barrier_call_mc(double S0, double K, double B,
                       double r, double sigma, double T,
                       int steps, int paths, unsigned seed = 42) {
    std::mt19937_64 rng{seed};
    std::normal_distribution<double> norm{0.0, 1.0};

    const double dt    = T / steps;
    const double drift = (r - 0.5*sigma*sigma) * dt;
    const double vol   = sigma * std::sqrt(dt);

    double payoff_sum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S = S0;
        bool knocked = false;
        for (int t = 0; t < steps && !knocked; ++t) {
            S *= std::exp(drift + vol * norm(rng));
            if (S <= B) knocked = true;
        }
        if (!knocked)
            payoff_sum += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * payoff_sum / paths;
}

int main() {
    std::cout << barrier_call_mc(100, 100, 90, 0.05, 0.2, 1.0, 252, 100'000)
              << "\\n";
}`,
    explanation:
      "Early-exit on barrier breach saves all remaining step computations, halving simulation time for deep barriers; the Broadie-Kaya continuity correction adjusts discrete-monitoring MC prices to match continuous-barrier analytics.",
  },
  {
    id: "cpp-20260519-b1-delta-hedge-pnl",
    language: "cpp",
    title: "Delta-hedging P&L simulation",
    tag: "quant",
    code: `#include <algorithm>
#include <cmath>
#include <iostream>
#include <random>

static double norm_cdf(double x) {
    return 0.5 * std::erfc(-x / std::sqrt(2.0));
}

double bs_delta(double S, double K, double r, double sigma, double tau) {
    if (tau <= 0.0) return (S >= K) ? 1.0 : 0.0;
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*tau)
                / (sigma * std::sqrt(tau));
    return norm_cdf(d1);
}

int main() {
    const double S0=100, K=100, r=0.05, sigma=0.2, T=1.0;
    const int steps = 252;
    const double dt = T / steps;

    std::mt19937_64 rng{42};
    std::normal_distribution<double> norm{0.0, 1.0};

    double S = S0;
    double delta = bs_delta(S, K, r, sigma, T);
    double cash  = -delta * S;   // borrow to buy delta shares

    for (int t = 0; t < steps; ++t) {
        double tau = T - t*dt;
        S     *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*std::sqrt(dt)*norm(rng));
        cash  *= std::exp(r*dt);                        // risk-free growth
        double new_delta = bs_delta(S, K, r, sigma, tau - dt);
        cash  -= (new_delta - delta) * S;               // rebalance cost
        delta  = new_delta;
    }
    double pnl = delta*S + cash - std::max(S - K, 0.0);
    std::cout << "Hedge tracking error: " << pnl << "\\n";
}`,
    explanation:
      "Discrete delta hedging accumulates gamma P&L at each rebalance; the residual at expiry is proportional to gamma*(realised_vol² - implied_vol²)*dt per step — running thousands of paths and examining this distribution is the standard way to stress-test a hedging strategy.",
  },
  {
    id: "cpp-20260519-b1-ranges-pipeline",
    language: "cpp",
    title: "std::ranges views pipeline (C++20)",
    tag: "stl",
    code: `#include <iostream>
#include <ranges>
#include <vector>

int main() {
    std::vector<double> returns{0.05, -0.02, 0.08, -0.01, 0.12, 0.003, -0.07};

    // Lazy pipeline: filter positives, scale to bps*10, take first 3.
    auto pipeline = returns
        | std::views::filter([](double r) { return r > 0.0; })
        | std::views::transform([](double r) { return r * 100.0; })
        | std::views::take(3);

    for (double v : pipeline)
        std::cout << v << "\\n";

    // Materialise into a vector when you need a concrete container.
    auto result = pipeline | std::ranges::to<std::vector>();
    std::cout << "collected " << result.size() << " values\\n";
}`,
    explanation:
      "Ranges views are lazy — no intermediate allocation occurs as the pipeline is composed, and elements are produced only when iterated. This makes them significantly cheaper than chained transform/copy calls on large tick-data arrays.",
  },
  {
    id: "cpp-20260519-b1-variadic-fold",
    language: "cpp",
    title: "Variadic templates + fold (count_arithmetic, print_all)",
    tag: "templates",
    code: `#include <iostream>
#include <type_traits>

// Count how many types are arithmetic — evaluated at compile time.
template<typename... Ts>
constexpr std::size_t count_arithmetic() {
    return (std::size_t{0} + ... + (std::is_arithmetic_v<Ts> ? 1 : 0));
}

// Print all arguments separated by commas via comma fold.
template<typename First, typename... Rest>
void print_all(First&& first, Rest&&... rest) {
    std::cout << first;
    ((std::cout << ", " << rest), ...);
    std::cout << "\\n";
}

int main() {
    constexpr auto n = count_arithmetic<int, double, std::string, float, char>();
    static_assert(n == 4, "expected 4 arithmetic types");
    std::cout << "arithmetic count: " << n << "\\n";

    print_all("AAPL", 150.5, 200, "USD");
}`,
    explanation:
      "count_arithmetic evaluates entirely at compile time so it can drive template specialisation or concept checks. The comma fold in print_all avoids a runtime loop and generates straight-line code that the compiler can further optimise.",
  },
  {
    id: "cpp-20260519-b1-jthread",
    language: "cpp",
    title: "std::jthread + stop_token (C++20 feed handler)",
    tag: "concurrency",
    code: `#include <atomic>
#include <chrono>
#include <iostream>
#include <stop_token>
#include <thread>

// Feed handler loop: runs until stop is requested cooperatively.
void feed_handler(std::stop_token st) {
    std::atomic<int> msg_count{0};
    while (!st.stop_requested()) {
        ++msg_count;   // simulate processing a market-data message
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
    std::cout << "feed handler exiting, processed "
              << msg_count.load() << " messages\\n";
}

int main() {
    std::jthread handler{feed_handler};   // auto-joins on destruction

    std::this_thread::sleep_for(std::chrono::milliseconds(55));
    handler.request_stop();   // signal cooperative shutdown
    // jthread destructor joins — no manual join or detach needed.
    std::cout << "main done\\n";
}`,
    explanation:
      "std::jthread automatically joins on destruction, eliminating the class of bugs where a thread is accidentally detached or joined twice; the cooperative stop_token avoids busy-polling a flag through a shared atomic bool that can alias with other hot cache lines.",
  },
  {
    id: "cpp-20260519-b1-parallel-stl",
    language: "cpp",
    title: "Parallel STL — par_unseq reduce and sort",
    tag: "stl",
    code: `#include <algorithm>
#include <execution>
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    const int N = 10'000'000;
    std::vector<double> prices(N);
    std::iota(prices.begin(), prices.end(), 1.0);

    // Parallel + vectorised reduction (uses thread pool internally).
    double total = std::reduce(
        std::execution::par_unseq,
        prices.begin(), prices.end(), 0.0
    );
    std::cout << "sum = " << total << "\\n";

    // Parallel sort — typically 3-5x faster than serial for large arrays.
    std::vector<double> v(prices.rbegin(), prices.rend());
    std::sort(std::execution::par_unseq, v.begin(), v.end());
    std::cout << "sorted[0]=" << v.front()
              << " sorted[-1]=" << v.back() << "\\n";
}`,
    explanation:
      "std::execution::par_unseq permits both inter-thread parallelism and SIMD vectorisation — reduce is preferred over accumulate here because floating-point non-associativity is acceptable and the parallel scheduler is free to reorder additions for speed.",
  },
  {
    id: "cpp-20260519-b1-custom-hash",
    language: "cpp",
    title: "Custom hash for compound key (FNV-mix InstrKey)",
    tag: "design",
    code: `#include <cstdint>
#include <iostream>
#include <unordered_map>

struct InstrKey {
    uint32_t venue_id;
    uint32_t symbol_id;
    bool operator==(const InstrKey& o) const noexcept {
        return venue_id == o.venue_id && symbol_id == o.symbol_id;
    }
};

struct InstrKeyHash {
    std::size_t operator()(const InstrKey& k) const noexcept {
        // FNV-1a mix: combine two 32-bit fields into one 64-bit hash.
        uint64_t h = 14695981039346656037ULL;  // FNV offset basis
        auto mix = [&](uint32_t v) {
            h ^= static_cast<uint64_t>(v);
            h *= 1099511628211ULL;              // FNV prime
        };
        mix(k.venue_id);
        mix(k.symbol_id);
        return static_cast<std::size_t>(h);
    }
};

using PriceMap = std::unordered_map<InstrKey, double, InstrKeyHash>;

int main() {
    PriceMap prices;
    prices[{1, 42}] = 150.25;
    prices[{2, 42}] = 98.50;
    prices[{1, 99}] = 42.00;

    std::cout << prices[{1, 42}] << "\\n";  // 150.25
    std::cout << prices[{2, 42}] << "\\n";  // 98.50
}`,
    explanation:
      "Using a compound struct key with a custom FNV hash is faster than concatenating keys into a string because it avoids all heap allocation at lookup time; FNV's multiplicative mixing distributes well for dense integer fields without cryptographic-hash overhead.",
  },
];
