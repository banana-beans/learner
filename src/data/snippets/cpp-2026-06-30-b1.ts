import type { Snippet } from "./types";

export const cppSnippets20260630B1: Snippet[] = [
  {
    id: "cpp-20260630-b1-sfinae-enable-if",
    language: "cpp",
    title: "SFINAE + enable_if for type-safe financial numeric constraints",
    tag: "SFINAE",
    code: `#include <type_traits>
#include <cmath>
#include <iostream>

// enable_if restricts a template to floating-point types only
template <typename T,
          typename = std::enable_if_t<std::is_floating_point_v<T>>>
T discount_factor(T rate, T years) {
    return std::exp(-rate * years);
}

// Detect whether T has operator* and is numeric
template <typename T>
using is_numeric = std::conjunction<std::is_arithmetic<T>,
                                    std::negation<std::is_same<T, bool>>>;

// Phantom-type currency tag: prevents implicit USD+EUR addition
template <typename CurrencyTag>
struct Money {
    double amount;
    explicit Money(double v) : amount(v) {}

    Money operator+(const Money& o) const { return Money{amount + o.amount}; }
    Money operator*(double scale)   const { return Money{amount * scale};    }
};
struct USD {}; struct EUR {}; struct GBP {};

// Helper: convert only via explicit FX rate
template <typename From, typename To>
Money<To> fx_convert(Money<From> m, double rate) {
    return Money<To>{m.amount * rate};
}

int main() {
    std::cout << discount_factor(0.05, 1.0) << "\\n";   // 0.9512
    std::cout << discount_factor(0.04, 5.0) << "\\n";   // 0.8187
    // discount_factor(1, 2);  // compile error: int not floating-point

    Money<USD> a{1000.0}, b{500.0};
    Money<USD> total = a + b;
    std::cout << "USD total: " << total.amount << "\\n"; // 1500

    // Convert USD -> EUR at 0.92
    auto eur = fx_convert<USD, EUR>(a, 0.92);
    std::cout << "EUR amount: " << eur.amount << "\\n";  // 920
    // a + eur;  // compile error: Money<USD> + Money<EUR> is ill-formed
}`,
    explanation: "Phantom type tags enforce dimensional analysis at the type level — adding Money<USD> to Money<EUR> is a compile error rather than a runtime bug; SFINAE via enable_if makes template constraints explicit and composable, and is the precursor to C++20 Concepts which generate clearer diagnostics.",
  },
  {
    id: "cpp-20260630-b1-pool-allocator",
    language: "cpp",
    title: "Slab pool allocator for order book nodes (O(1) alloc/free)",
    tag: "performance",
    code: `#include <cstddef>
#include <cassert>
#include <new>
#include <iostream>

// Pre-allocate a fixed slab; hand out slots via an embedded free list.
// Avoids malloc on every order insert — critical for sub-microsecond order entry.
template <typename T, std::size_t Cap>
class PoolAllocator {
    union Slot {
        alignas(T) char obj[sizeof(T)];
        Slot* next;
    };
    Slot  pool_[Cap];
    Slot* head_ = nullptr;
    int   used_ = 0;

public:
    PoolAllocator() {
        for (std::size_t i = 0; i + 1 < Cap; ++i) pool_[i].next = &pool_[i+1];
        pool_[Cap-1].next = nullptr;
        head_ = &pool_[0];
    }

    template <typename... Args>
    T* allocate(Args&&... args) {
        assert(head_ && "Pool exhausted");
        Slot* s = head_;
        head_   = s->next;
        ++used_;
        return ::new(s->obj) T(std::forward<Args>(args)...);
    }

    void deallocate(T* p) noexcept {
        p->~T();
        auto* s = reinterpret_cast<Slot*>(p);
        s->next = head_;
        head_   = s;
        --used_;
    }

    int used() const { return used_; }
};

struct Order {
    uint64_t id;
    double   price;
    int      qty;
    char     side;
};

int main() {
    PoolAllocator<Order, 256> pool;
    auto* o1 = pool.allocate(1001ULL, 150.25, 100, 'B');
    auto* o2 = pool.allocate(1002ULL, 150.50, 200, 'S');
    std::cout << "In use: " << pool.used() << "\\n";   // 2
    std::cout << "o1 price: " << o1->price << "\\n";   // 150.25
    pool.deallocate(o1);
    std::cout << "After free: " << pool.used() << "\\n"; // 1
    pool.deallocate(o2);
    std::cout << "Final: " << pool.used() << "\\n";      // 0
}`,
    explanation: "Pool allocators reduce order insertion latency from ~100ns (system malloc under contention) to ~5ns by pre-allocating a fixed slab and maintaining a free list entirely in user space; the union trick allows the free-list pointer to alias the object storage without wasting memory on a separate pointer field.",
  },
  {
    id: "cpp-20260630-b1-span-market-data",
    language: "cpp",
    title: "std::span for zero-copy market data buffer slicing",
    tag: "C++20",
    code: `#include <span>
#include <cstdint>
#include <cstring>
#include <array>
#include <iostream>

// Market data arrives from NIC/kernel as a raw byte buffer.
// std::span gives a bounds-safe non-owning view — zero allocation, zero copy.

#pragma pack(push, 1)
struct TickHeader {
    uint16_t msg_type;
    uint16_t sym_len;
    double   price;
    uint32_t qty;
    uint64_t ts_ns;
};  // 22 bytes packed
#pragma pack(pop)

struct ParsedTick {
    std::string_view symbol;
    double           price;
    uint32_t         qty;
    uint64_t         ts_ns;
};

// Parse a batch of ticks from a flat buffer — no allocations
std::span<const std::byte>
parse_one_tick(std::span<const std::byte> buf, ParsedTick& out) {
    if (buf.size() < sizeof(TickHeader)) return {};
    TickHeader hdr;
    std::memcpy(&hdr, buf.data(), sizeof(TickHeader));

    auto payload = buf.subspan(sizeof(TickHeader));
    if (payload.size() < hdr.sym_len) return {};

    out.symbol = std::string_view{
        reinterpret_cast<const char*>(payload.data()),
        hdr.sym_len
    };
    out.price  = hdr.price;
    out.qty    = hdr.qty;
    out.ts_ns  = hdr.ts_ns;
    return payload.subspan(hdr.sym_len);   // remaining bytes
}

int main() {
    alignas(8) std::array<std::byte, 256> buf{};

    // Write two ticks into the buffer
    auto write_tick = [&](std::size_t offset, double px, uint32_t qty,
                          const char* sym) {
        TickHeader h{};
        h.msg_type = 1; h.sym_len = (uint16_t)strlen(sym);
        h.price = px; h.qty = qty; h.ts_ns = 1'700'000'000'000ULL;
        std::memcpy(&buf[offset], &h, sizeof(h));
        std::memcpy(&buf[offset + sizeof(h)], sym, h.sym_len);
        return offset + sizeof(h) + h.sym_len;
    };

    auto off = write_tick(0,    150.25, 100, "AAPL");
    /*off    =*/ write_tick(off, 200.10, 200, "MSFT");

    auto view = std::span<const std::byte>{buf.data(), off + sizeof(TickHeader) + 4};
    ParsedTick t;
    view = parse_one_tick(view, t);
    std::cout << t.symbol << " " << t.price << " x " << t.qty << "\\n"; // AAPL 150.25 x 100
    parse_one_tick(view, t);
    std::cout << t.symbol << " " << t.price << " x " << t.qty << "\\n"; // MSFT 200.1 x 200
}`,
    explanation: "std::span compiles to a bare pointer+size pair with zero overhead; subspan() provides a bounds-checked slice without copying bytes, making it ideal for parsing multi-message UDP datagrams where you need to advance a cursor through a flat wire-format buffer at 10M messages/second.",
  },
  {
    id: "cpp-20260630-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list for O(1) order cancellation",
    tag: "data structures",
    code: `#include <cstdint>
#include <iostream>
#include <cassert>

// Intrusive list: link pointers live inside the Order struct itself.
// Cancellation is O(1) because we already have a pointer to the node —
// no linear search needed. No separate node allocation.

struct IntrusiveNode {
    IntrusiveNode* prev = nullptr;
    IntrusiveNode* next = nullptr;
};

struct Order : IntrusiveNode {
    uint64_t id;
    double   price;
    int      qty;
    char     side;
};

class OrderQueue {
    IntrusiveNode sentinel_;  // dummy head — simplifies boundary logic
    int size_ = 0;
public:
    OrderQueue() { sentinel_.prev = sentinel_.next = &sentinel_; }

    void push_back(Order& o) noexcept {
        o.prev             = sentinel_.prev;
        o.next             = &sentinel_;
        sentinel_.prev->next = &o;
        sentinel_.prev       = &o;
        ++size_;
    }

    // O(1): no search — called with pointer retrieved from order map
    void cancel(Order& o) noexcept {
        assert(o.prev && o.next && "Order not in any list");
        o.prev->next = o.next;
        o.next->prev = o.prev;
        o.prev = o.next = nullptr;
        --size_;
    }

    Order* front() noexcept {
        if (sentinel_.next == &sentinel_) return nullptr;
        return static_cast<Order*>(sentinel_.next);
    }

    void pop_front() noexcept {
        if (auto* f = front()) cancel(*f);
    }

    int size() const { return size_; }

    template <typename F>
    void for_each(F&& fn) {
        for (auto* n = sentinel_.next; n != &sentinel_; n = n->next)
            fn(*static_cast<Order*>(n));
    }
};

int main() {
    Order o1{.id=1, .price=100.5, .qty=100, .side='B'};
    Order o2{.id=2, .price=100.5, .qty=200, .side='B'};
    Order o3{.id=3, .price=100.5, .qty=150, .side='B'};

    OrderQueue q;
    q.push_back(o1); q.push_back(o2); q.push_back(o3);
    std::cout << "Size: " << q.size() << "\\n"; // 3

    q.cancel(o2);   // O(1) mid-list removal — no scan
    std::cout << "After cancel: " << q.size() << "\\n"; // 2

    q.for_each([](Order& o) {
        std::cout << "id=" << o.id << " qty=" << o.qty << "\\n";
    }); // id=1, id=3 (o2 removed)
}`,
    explanation: "Intrusive lists store prev/next inside the element itself, so order cancellation is O(1) — you receive a pointer from your order-id map and remove it immediately without scanning the queue; non-intrusive lists require allocating a separate Node wrapper per element and traversing to find the target, making them unsuitable for a limit order book with millions of daily cancel events.",
  },
  {
    id: "cpp-20260630-b1-spsc-ring-buffer",
    language: "cpp",
    title: "Lock-free SPSC ring buffer for tick data pipeline",
    tag: "performance",
    code: `#include <atomic>
#include <optional>
#include <array>
#include <thread>
#include <iostream>

// Single-Producer Single-Consumer lock-free queue.
// Head and tail on separate cache lines to eliminate false sharing.
// Both push and pop are wait-free in non-full/non-empty cases.
template <typename T, std::size_t N>
class SPSCQueue {
    static_assert((N & (N - 1)) == 0, "Capacity must be power of two");
    static constexpr std::size_t MASK = N - 1;

    alignas(64) std::atomic<std::size_t> head_{0};  // consumer cache line
    alignas(64) std::atomic<std::size_t> tail_{0};  // producer cache line
    alignas(64) std::array<T, N> buf_{};

public:
    // Producer thread only
    bool try_push(T item) noexcept {
        auto tail = tail_.load(std::memory_order_relaxed);
        auto next = (tail + 1) & MASK;
        if (next == head_.load(std::memory_order_acquire))
            return false;          // full
        buf_[tail] = std::move(item);
        tail_.store(next, std::memory_order_release);
        return true;
    }

    // Consumer thread only
    std::optional<T> try_pop() noexcept {
        auto head = head_.load(std::memory_order_relaxed);
        if (head == tail_.load(std::memory_order_acquire))
            return std::nullopt;   // empty
        T item = std::move(buf_[head]);
        head_.store((head + 1) & MASK, std::memory_order_release);
        return item;
    }

    bool empty() const noexcept {
        return head_.load(std::memory_order_acquire) ==
               tail_.load(std::memory_order_acquire);
    }
};

int main() {
    SPSCQueue<double, 1024> q;
    std::atomic<int> recv{0};

    std::thread prod([&]() {
        for (int i = 0; i < 10000; ++i) {
            while (!q.try_push(150.0 + i * 0.01))
                ;   // spin if full — in HFT use adaptive backoff
        }
    });

    std::thread cons([&]() {
        while (recv.load(std::memory_order_relaxed) < 10000) {
            if (auto v = q.try_pop())
                recv.fetch_add(1, std::memory_order_relaxed);
        }
    });

    prod.join(); cons.join();
    std::cout << "Received: " << recv.load() << "\\n";   // 10000
}`,
    explanation: "The SPSC queue's correctness rests on the invariant that only the producer writes tail and only the consumer writes head; the alignas(64) separation ensures these atomic counters occupy different cache lines, eliminating the false-sharing coherence traffic that would otherwise halve throughput on a two-core system.",
  },
  {
    id: "cpp-20260630-b1-concepts-finance",
    language: "cpp",
    title: "C++20 Concepts for financial type constraints",
    tag: "C++20",
    code: `#include <concepts>
#include <cmath>
#include <vector>
#include <numeric>
#include <iostream>

// Concept: any floating-point-like scalar usable as a price
template <typename T>
concept FinancialScalar = std::floating_point<T>;

// Concept: a container of floats exposing begin/end/size
template <typename C>
concept ReturnSeries = requires(C c) {
    { c.begin() } -> std::input_iterator;
    { c.end()   } -> std::input_iterator;
    { c.size()  } -> std::convertible_to<std::size_t>;
    requires std::floating_point<typename C::value_type>;
};

// Concept: a discounting function D(t) -> double
template <typename F>
concept DiscountFn = requires(F fn, double t) {
    { fn(t) } -> std::convertible_to<double>;
};

// Constrained function: only valid for floating-point types
template <FinancialScalar T>
T bsm_d1(T S, T K, T r, T sigma, T tau) {
    return (std::log(S / K) + (r + T{0.5} * sigma * sigma) * tau)
           / (sigma * std::sqrt(tau));
}

template <ReturnSeries C>
double sharpe(const C& rets, int ann = 252) {
    using T = typename C::value_type;
    T sum = 0, sum2 = 0;
    for (T r : rets) { sum += r; sum2 += r * r; }
    T n  = static_cast<T>(rets.size());
    T mu = sum / n;
    T s  = std::sqrt(sum2 / n - mu * mu);
    return static_cast<double>(mu * ann / (s * std::sqrt(T(ann))));
}

// Bond price using any callable discount function
template <DiscountFn D>
double bond_price(double coupon, int periods, double face, D disc) {
    double pv = 0;
    for (int t = 1; t <= periods; ++t) {
        double cf = (t == periods) ? coupon + face : coupon;
        pv += cf * disc(t * 0.5);   // semi-annual
    }
    return pv;
}

int main() {
    std::cout << bsm_d1(100.0, 100.0, 0.05, 0.20, 1.0) << "\\n";   // 0.35
    // bsm_d1(100, 100, 5, 20, 100);  // error: int not FinancialScalar

    std::vector<double> rets = {0.01, -0.005, 0.008, 0.003, -0.002};
    std::cout << "Sharpe: " << sharpe(rets) << "\\n";

    // Flat 5% discount curve
    auto flat_disc = [](double t) { return std::exp(-0.05 * t); };
    std::cout << "Bond price: " << bond_price(25.0, 10, 1000.0, flat_disc) << "\\n";
}`,
    explanation: "C++20 Concepts generate readable constraint-violation diagnostics — 'T does not satisfy ReturnSeries' — rather than the multi-page SFINAE backtraces of C++17; they also serve as machine-checked API documentation, making it impossible to accidentally pass an integer array to a function that expects floating-point returns.",
  },
  {
    id: "cpp-20260630-b1-fix-parser",
    language: "cpp",
    title: "FIX protocol tag=value fast parser (zero-alloc, zero-copy)",
    tag: "market data",
    code: `#include <string_view>
#include <optional>
#include <charconv>
#include <cstring>
#include <array>
#include <iostream>

// FIX 4.x: "8=FIX.4.2\x01 35=D\x01 55=AAPL\x01 38=100\x01 44=150.25\x01"
// Each field is tag=value pairs terminated by SOH (\x01).
// Goal: extract specific tags in one pass, no heap allocation.

constexpr char SOH = '\x01';

struct FIXField { int tag; std::string_view value; };

class FIXParser {
    std::string_view buf_;
    std::size_t      pos_ = 0;
public:
    explicit FIXParser(std::string_view msg) : buf_(msg) {}

    std::optional<FIXField> next() noexcept {
        if (pos_ >= buf_.size()) return std::nullopt;
        auto eq = buf_.find('=', pos_);
        if (eq == std::string_view::npos) return std::nullopt;
        auto soh = buf_.find(SOH, eq + 1);
        if (soh == std::string_view::npos) soh = buf_.size();

        int tag = 0;
        std::from_chars(buf_.data() + pos_, buf_.data() + eq, tag);
        std::string_view val = buf_.substr(eq + 1, soh - eq - 1);
        pos_ = soh + 1;
        return FIXField{tag, val};
    }
};

// Extract a fixed set of tags in a single forward scan
template <std::size_t N>
struct FIXExtract {
    std::array<int,             N> tags;
    std::array<std::string_view, N> values{};

    void parse(std::string_view msg) {
        FIXParser p{msg};
        int found = 0;
        while (found < static_cast<int>(N)) {
            auto f = p.next();
            if (!f) break;
            for (std::size_t i = 0; i < N; ++i) {
                if (f->tag == tags[i]) { values[i] = f->value; ++found; }
            }
        }
    }

    // Convert a value to double without std::stod (locale-free)
    double as_double(std::size_t idx) const noexcept {
        double v = 0;
        std::from_chars(values[idx].data(),
                        values[idx].data() + values[idx].size(), v);
        return v;
    }
};

int main() {
    std::string msg =
        "8=FIX.4.2\x01" "35=D\x01" "49=BROKER\x01"
        "55=AAPL\x01" "54=1\x01" "38=100\x01" "44=150.25\x01" "40=2\x01";

    // Extract tags 55 (symbol), 38 (qty), 44 (price)
    FIXExtract<3> ex{{55, 38, 44}};
    ex.parse(msg);
    std::cout << "Symbol: " << ex.values[0] << "\\n"; // AAPL
    std::cout << "Qty:    " << ex.values[1] << "\\n"; // 100
    std::cout << "Price:  " << ex.as_double(2) << "\\n"; // 150.25
}`,
    explanation: "std::from_chars is the correct choice for parsing FIX numeric fields because it has no locale dependency, no exceptions, and no heap allocation — critical when parsing 1M+ messages/second where each std::stod call would add a thread-local locale lookup and a potential heap alloc for error string formatting.",
  },
  {
    id: "cpp-20260630-b1-prefetch-hints",
    language: "cpp",
    title: "__builtin_prefetch for cache-warm order book traversal",
    tag: "performance",
    code: `#include <vector>
#include <numeric>
#include <cstdint>
#include <iostream>
#include <cmath>

// Software prefetch: begin loading a future cache line before it is needed.
// Optimal distance D = (L3 miss latency in cycles) / (cycles per element).
// On modern x86: L3 miss ~200 cycles, 2-4 cycles per element => D ~ 50-100.
// For cache-hot data (L1/L2 hit) prefetch adds overhead — only use for cold data.

constexpr int PREFETCH_DIST = 16;  // tune empirically via perf stat

struct Fill {
    uint64_t order_id;
    double   price;
    int      qty;
    char     side;
    char     _pad[7];  // align to 24 bytes
};

// Process fills with software prefetch
double compute_notional(const std::vector<Fill>& fills) {
    double total = 0.0;
    int n = static_cast<int>(fills.size());
    for (int i = 0; i < n; ++i) {
        // Hint: load &fills[i+DIST] into L1 cache (read=0, temporal locality=3)
        if (i + PREFETCH_DIST < n)
            __builtin_prefetch(&fills[i + PREFETCH_DIST], 0, 3);
        total += fills[i].price * fills[i].qty;
    }
    return total;
}

// Baseline without prefetch
double compute_notional_plain(const std::vector<Fill>& fills) {
    double total = 0.0;
    for (const auto& f : fills) total += f.price * f.qty;
    return total;
}

// Dual-stream: prefetch two interleaved arrays simultaneously
void compute_pnl(const std::vector<double>& fills_px,
                 const std::vector<double>& close_px,
                 std::vector<double>& pnl) {
    int n = static_cast<int>(fills_px.size());
    for (int i = 0; i < n; ++i) {
        if (i + PREFETCH_DIST < n) {
            __builtin_prefetch(&fills_px[i + PREFETCH_DIST], 0, 1);
            __builtin_prefetch(&close_px[i + PREFETCH_DIST], 0, 1);
        }
        pnl[i] = close_px[i] - fills_px[i];
    }
}

int main() {
    std::vector<Fill> fills(100'000);
    for (int i = 0; i < 100'000; ++i)
        fills[i] = {static_cast<uint64_t>(i), 150.0 + i * 0.001, 100, 'B'};

    double n1 = compute_notional(fills);
    double n2 = compute_notional_plain(fills);
    // Both produce identical results; prefetch is a performance hint only
    std::cout << "Match: " << (std::abs(n1-n2) < 1e-6 ? "yes" : "no") << "\\n";
    std::cout << "Total notional: " << n1 << "\\n";
}`,
    explanation: "Software prefetch is only effective for memory that is cold (L3 or DRAM latency); for in-cache data the prefetch instruction wastes execution cycles without benefit, so empirical profiling with 'perf stat -e cache-misses' is mandatory — a wrong PREFETCH_DIST can decrease performance, which is why auto-prefetch tuning in tight loops is a common HFT micro-optimization interview topic.",
  },
  {
    id: "cpp-20260630-b1-variant-order-dispatch",
    language: "cpp",
    title: "std::variant + std::visit for polymorphic order type dispatch",
    tag: "C++17",
    code: `#include <variant>
#include <vector>
#include <iostream>
#include <cstdint>

// Order types as value types — no vtable, no heap alloc per dispatch
struct MarketOrder  { uint64_t id; int qty;   char side; };
struct LimitOrder   { uint64_t id; double px; int qty; char side; };
struct StopOrder    { uint64_t id; double stop; int qty; char side; };
struct IcebergOrder { uint64_t id; double px; int total; int display; char side; };

using Order = std::variant<MarketOrder, LimitOrder, StopOrder, IcebergOrder>;

// Overload trick: construct a visitor from multiple lambdas
template <typename... Fs>
struct Overload : Fs... { using Fs::operator()...; };
template <typename... Fs> Overload(Fs...) -> Overload<Fs...>;

double order_notional(const Order& o) {
    return std::visit(Overload{
        [](const MarketOrder&  m) { return 0.0; },   // price unknown at order time
        [](const LimitOrder&   l) { return l.px * l.qty; },
        [](const StopOrder&    s) { return s.stop * s.qty; },
        [](const IcebergOrder& i) { return i.px * i.total; },
    }, o);
}

void print_order(const Order& o) {
    std::visit(Overload{
        [](const MarketOrder&  m) { std::cout << "MKT  id=" << m.id << " q=" << m.qty << " " << m.side << "\\n"; },
        [](const LimitOrder&   l) { std::cout << "LMT  id=" << l.id << " px=" << l.px << " q=" << l.qty << " " << l.side << "\\n"; },
        [](const StopOrder&    s) { std::cout << "STOP id=" << s.id << " stop=" << s.stop << " q=" << s.qty << "\\n"; },
        [](const IcebergOrder& i) { std::cout << "ICE  id=" << i.id << " tot=" << i.total << " disp=" << i.display << "\\n"; },
    }, o);
}

int main() {
    std::vector<Order> book = {
        MarketOrder{1, 100, 'B'},
        LimitOrder{2, 150.50, 200, 'S'},
        StopOrder{3, 148.00, 300, 'S'},
        IcebergOrder{4, 150.00, 5000, 100, 'B'},
    };

    for (const auto& o : book) {
        print_order(o);
        std::cout << "  notional=" << order_notional(o) << "\\n";
    }

    // Type-safe index query
    std::cout << "Is limit? "
              << std::boolalpha << std::holds_alternative<LimitOrder>(book[1])
              << "\\n";  // true
}`,
    explanation: "std::variant with std::visit generates a compile-time dispatch table (often a jump table) equivalent to virtual dispatch but without the heap allocation and vtable pointer overhead per object; the Overload deduction guide allows assembling a visitor from lambdas inline, making the dispatch site self-documenting with all cases visible at once.",
  },
  {
    id: "cpp-20260630-b1-hull-white-mc",
    language: "cpp",
    title: "Hull-White extended Vasicek short-rate Monte Carlo",
    tag: "derivatives",
    code: `#include <random>
#include <cmath>
#include <vector>
#include <iostream>

// Hull-White (1990): dr = [theta(t) - a*r] dt + sigma dW
// theta(t) calibrated to initial yield curve; simplified here as flat theta = a*r_bar.
// Exact discretisation (no Euler error) for constant a, sigma:
//   r(t+dt) = r(t)*exp(-a*dt) + r_bar*(1-exp(-a*dt))
//             + sigma*sqrt((1-exp(-2a*dt))/(2a)) * Z

struct HWParams {
    double a     = 0.10;    // mean reversion speed
    double sigma = 0.015;   // short-rate vol
    double r0    = 0.04;    // initial rate
    double r_bar = 0.05;    // long-run mean (simplified)
};

// Price a ZCB P(0,T) via MC — comparison target is analytic formula
double hw_zcb_mc(const HWParams& p, double T, int n_paths, int n_steps) {
    std::mt19937_64 rng{42};
    std::normal_distribution<double> nd(0.0, 1.0);

    double dt      = T / n_steps;
    double e_adt   = std::exp(-p.a * dt);
    // Exact discretisation variance coefficient
    double vol_dt  = p.sigma * std::sqrt((1.0 - std::exp(-2.0*p.a*dt)) / (2.0*p.a));

    double sum = 0.0;
    for (int path = 0; path < n_paths; ++path) {
        double r     = p.r0;
        double disc  = 0.0;
        for (int s = 0; s < n_steps; ++s) {
            r      = r * e_adt + p.r_bar * (1.0 - e_adt) + vol_dt * nd(rng);
            disc  += r * dt;    // accumulate integral of r for discounting
        }
        sum += std::exp(-disc);
    }
    return sum / n_paths;
}

// Analytic ZCB: P(0,T) = A(T) * exp(-B(T) * r0)
double hw_zcb_analytic(const HWParams& p, double T) {
    double B   = (1.0 - std::exp(-p.a * T)) / p.a;
    double lnA = (p.r_bar - p.sigma*p.sigma / (2.0*p.a*p.a)) * (B - T)
                 - p.sigma*p.sigma * B*B / (4.0*p.a);
    return std::exp(lnA - B * p.r0);
}

// Swaption approximation: use MC to compute E[max(swap_value, 0)] at expiry
int main() {
    HWParams p;
    double mc   = hw_zcb_mc(p, 5.0, 100'000, 200);
    double exact= hw_zcb_analytic(p, 5.0);
    std::cout << "MC ZCB(5y):       " << mc    << "\\n"; // ~0.78
    std::cout << "Analytic ZCB(5y): " << exact << "\\n";
    std::cout << "MC error: " << std::abs(mc - exact) << "\\n"; // < 0.001

    // Yield curve: compute ZCBs for maturities 1-10y
    std::cout << "\\nYield curve (simplified HW):\\n";
    for (int T = 1; T <= 10; ++T) {
        double zcb   = hw_zcb_analytic(p, T);
        double yield = -std::log(zcb) / T;
        std::cout << "T=" << T << " P=" << zcb << " y=" << yield << "\\n";
    }
}`,
    explanation: "The exact Hull-White discretisation uses the conditional moments of the Ornstein-Uhlenbeck process (r is Gaussian given the past), eliminating the O(dt) Euler bias; Hull-White is the industry standard for pricing Bermudan swaptions and callable bonds because its affine structure yields analytic bond prices, enabling fast calibration to the full ATM swaption volatility surface.",
  },
  {
    id: "cpp-20260630-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson finite-difference European call pricer",
    tag: "derivatives",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <iostream>

// Crank-Nicolson: average of explicit and implicit FD — O(dt^2, dS^2) accuracy.
// Solves a tridiagonal linear system per time step via Thomas algorithm O(N).
double crank_nicolson_call(double S0, double K, double r, double sigma,
                            double T, int Ns, int Nt) {
    const double Smax = 4.0 * K;
    const double dS   = Smax / Ns;
    const double dt   = T   / Nt;

    std::vector<double> S(Ns+1), V(Ns+1);
    for (int i = 0; i <= Ns; ++i) {
        S[i] = i * dS;
        V[i] = std::max(S[i] - K, 0.0);  // terminal payoff
    }

    std::vector<double> al(Ns+1), be(Ns+1), ga(Ns+1), rhs(Ns+1);

    auto thomas_solve = [&]() -> std::vector<double> {
        // Forward sweep
        std::vector<double> cp(Ns+1), dp(Ns+1), x(Ns+1);
        cp[1] = ga[1] / be[1];
        dp[1] = rhs[1] / be[1];
        for (int i = 2; i < Ns; ++i) {
            double m = be[i] - al[i] * cp[i-1];
            cp[i]    = ga[i] / m;
            dp[i]    = (rhs[i] - al[i] * dp[i-1]) / m;
        }
        x[Ns-1] = dp[Ns-1];
        for (int i = Ns-2; i >= 1; --i) x[i] = dp[i] - cp[i] * x[i+1];
        return x;
    };

    for (int tstep = Nt-1; tstep >= 0; --tstep) {
        double tau = T - tstep * dt;   // time remaining at this step

        for (int i = 1; i < Ns; ++i) {
            double sig2 = 0.5 * sigma * sigma * i * i;
            double ri   = 0.5 * r * i;
            // Sub-, super-, and main diagonal (CN theta=0.5)
            al[i]  = -0.5 * dt * (sig2 - ri);
            be[i]  =  1.0 + dt * (sig2 + 0.5 * r);
            ga[i]  = -0.5 * dt * (sig2 + ri);
            // Explicit RHS contribution (old values)
            rhs[i] = 0.5*dt*(sig2-ri)*V[i-1]
                   + (1.0 - dt*(sig2 + 0.5*r))*V[i]
                   + 0.5*dt*(sig2+ri)*V[i+1];
        }
        // Boundary conditions
        V[0]  = 0.0;
        V[Ns] = Smax - K * std::exp(-r * (T - tstep * dt));

        auto x = thomas_solve();
        for (int i = 1; i < Ns; ++i) V[i] = x[i];
    }

    int    idx = static_cast<int>(S0 / dS);
    double frc = (S0 - idx * dS) / dS;
    return V[idx] * (1.0 - frc) + V[idx+1] * frc;
}

int main() {
    double price = crank_nicolson_call(100, 100, 0.05, 0.20, 1.0, 200, 200);
    std::cout << "CN call: " << price << "\\n";  // ~10.45 (BSM)
}`,
    explanation: "Crank-Nicolson achieves O(dt^2) accuracy in time versus O(dt) for fully-explicit schemes, meaning you get equivalent accuracy with far fewer time steps; Thomas' algorithm exploits the tridiagonal structure to solve each time step in O(N) rather than O(N^3) Gaussian elimination, making PDE pricing competitive with Monte Carlo for single-factor models.",
  },
  {
    id: "cpp-20260630-b1-hist-sim-var",
    language: "cpp",
    title: "Historical simulation VaR and Expected Shortfall",
    tag: "risk",
    code: `#include <vector>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iostream>

// Historical simulation VaR: use actual past returns without distributional
// assumptions — captures fat tails, skew, and correlation from real history.
struct VaRResult {
    double var;          // Value at Risk (loss at confidence level)
    double es;           // Expected Shortfall (CVaR): mean of tail losses
    int    tail_count;   // number of scenarios in the tail
};

VaRResult historical_var_es(const std::vector<double>& pnl_series,
                              double confidence = 0.99) {
    // pnl_series: daily P&L (negative = loss, positive = gain)
    auto sorted = pnl_series;
    std::sort(sorted.begin(), sorted.end());  // ascending: worst at front

    int n         = static_cast<int>(sorted.size());
    int tail_n    = static_cast<int>(n * (1.0 - confidence));
    if (tail_n < 1) tail_n = 1;

    // VaR = magnitude of the (1-c)th percentile loss
    double var = -sorted[tail_n - 1];  // negate: VaR is positive number

    // ES = mean of all losses worse than VaR
    double sum = 0.0;
    for (int i = 0; i < tail_n; ++i) sum += sorted[i];
    double es  = -(sum / tail_n);

    return {var, es, tail_n};
}

// Parametric (normal) VaR for comparison
double parametric_var(double mean, double std_dev,
                       double confidence = 0.99) {
    // Inverse normal quantile at (1-confidence): use Beasley-Springer approximation
    // For 99%: z = 2.3263
    const double z99 = 2.3263;
    return -(mean - z99 * std_dev);   // positive = loss
}

// Weighted historical simulation: more recent observations get higher weight
VaRResult weighted_var(const std::vector<double>& pnl, double lam = 0.99,
                        double confidence = 0.99) {
    int n = static_cast<int>(pnl.size());
    std::vector<std::pair<double,double>> weighted(n);  // {pnl, weight}

    double w = 1.0, total_w = 0.0;
    for (int i = n-1; i >= 0; --i) {
        weighted[i] = {pnl[i], w};
        total_w += w;
        w *= lam;
    }
    std::sort(weighted.begin(), weighted.end());  // sort by pnl ascending

    double cum_w = 0.0, threshold = total_w * (1.0 - confidence);
    double es_sum = 0.0, es_w = 0.0;
    double var = 0.0;
    for (auto& [p, wt] : weighted) {
        cum_w += wt;
        es_sum += p * wt;
        es_w   += wt;
        if (cum_w >= threshold) { var = -p; break; }
    }
    return {var, -(es_sum / es_w), static_cast<int>(es_w)};
}

int main() {
    // Simulate 500 days of P&L
    std::vector<double> pnl;
    std::mt19937_64 rng{42};
    std::normal_distribution<double> nd(-100, 10'000);
    for (int i = 0; i < 500; ++i) pnl.push_back(nd(rng));

    auto res = historical_var_es(pnl, 0.99);
    std::cout << "99% VaR: " << res.var << "\\n";
    std::cout << "99% ES:  " << res.es  << "\\n";
    std::cout << "Tail N:  " << res.tail_count << "\\n";

    double pvol = 10'000.0 * std::sqrt(252.0);
    std::cout << "Parametric VaR: " << parametric_var(-100*252, pvol/std::sqrt(252)) << "\\n";
}`,
    explanation: "Historical simulation VaR requires no distributional assumption and automatically captures fat tails, volatility clustering, and cross-asset correlation from actual market history; its main weakness is that it only captures scenarios present in the look-back window — it cannot estimate the risk of unprecedented events, which is why ES is now preferred over VaR under Basel III as it better captures tail severity.",
  },
  {
    id: "cpp-20260630-b1-order-matcher",
    language: "cpp",
    title: "Price-time priority order matching engine core",
    tag: "market microstructure",
    code: `#include <map>
#include <deque>
#include <cstdint>
#include <optional>
#include <iostream>
#include <vector>

struct Order { uint64_t id; double price; int qty; char side; };
struct Fill  { uint64_t buy_id, sell_id; double fill_px; int fill_qty; };

class OrderBook {
    // Bids: descending price (best bid first)
    std::map<double, std::deque<Order>, std::greater<double>> bids_;
    // Asks: ascending price (best ask first)
    std::map<double, std::deque<Order>> asks_;

    std::vector<Fill> fills_;
    uint64_t seq_ = 0;

public:
    // Add order and match immediately against resting orders
    void add_order(uint64_t id, char side, double price, int qty) {
        if (side == 'B') match_buy(id, price, qty);
        else             match_sell(id, price, qty);
    }

    const std::vector<Fill>& fills() const { return fills_; }

    void print() const {
        std::cout << "--- Book ---\\n";
        for (auto& [px, q] : asks_) {
            int total = 0; for (auto& o : q) total += o.qty;
            std::cout << "ASK " << px << " x " << total << "\\n";
        }
        for (auto& [px, q] : bids_) {
            int total = 0; for (auto& o : q) total += o.qty;
            std::cout << "BID " << px << " x " << total << "\\n";
        }
    }

private:
    void match_buy(uint64_t id, double limit_px, int qty) {
        while (qty > 0 && !asks_.empty()) {
            auto it = asks_.begin();
            if (it->first > limit_px) break;   // no cross
            auto& queue = it->second;
            while (qty > 0 && !queue.empty()) {
                auto& resting = queue.front();
                int traded = std::min(qty, resting.qty);
                fills_.push_back({id, resting.id, it->first, traded});
                qty -= traded; resting.qty -= traded;
                if (resting.qty == 0) queue.pop_front();
            }
            if (queue.empty()) asks_.erase(it);
        }
        if (qty > 0)   // resting limit order
            bids_[limit_px].push_back({id, limit_px, qty, 'B'});
    }

    void match_sell(uint64_t id, double limit_px, int qty) {
        while (qty > 0 && !bids_.empty()) {
            auto it = bids_.begin();
            if (it->first < limit_px) break;
            auto& queue = it->second;
            while (qty > 0 && !queue.empty()) {
                auto& resting = queue.front();
                int traded = std::min(qty, resting.qty);
                fills_.push_back({resting.id, id, it->first, traded});
                qty -= traded; resting.qty -= traded;
                if (resting.qty == 0) queue.pop_front();
            }
            if (queue.empty()) bids_.erase(it);
        }
        if (qty > 0)
            asks_[limit_px].push_back({id, limit_px, qty, 'S'});
    }
};

int main() {
    OrderBook book;
    book.add_order(1, 'B', 100.50, 100);
    book.add_order(2, 'B', 100.00, 200);
    book.add_order(3, 'S', 100.50, 150);  // crosses bid at 100.50: fills 100

    book.print();
    for (auto& f : book.fills())
        std::cout << "Fill: buy=" << f.buy_id << " sell=" << f.sell_id
                  << " px=" << f.fill_px << " qty=" << f.fill_qty << "\\n";
}`,
    explanation: "The map<double, deque<Order>> structure gives O(log N) level lookup and O(1) FIFO access within each price level; production matching engines replace std::map with an array-of-deque indexed by a tick-normalised integer price for O(1) level access, but the price-time priority logic is identical.",
  },
  {
    id: "cpp-20260630-b1-jthread-feed",
    language: "cpp",
    title: "std::jthread with stop_token for graceful market feed shutdown",
    tag: "C++20",
    code: `#include <thread>
#include <stop_token>
#include <atomic>
#include <chrono>
#include <iostream>
#include <queue>
#include <mutex>

// std::jthread auto-joins on destruction and provides a cooperative
// cancellation mechanism via stop_token — no flag polling needed.

struct Tick { double price; int qty; };

class MarketFeedThread {
    std::queue<Tick>    q_;
    std::mutex          mtx_;
    std::atomic<uint64_t> count_{0};
    std::jthread        thread_;

public:
    MarketFeedThread() : thread_([this](std::stop_token st) { run(st); }) {}

    // Request stop and wait (destructor also does this automatically)
    void shutdown() { thread_.request_stop(); }

    uint64_t ticks_received() const { return count_.load(); }

private:
    void run(std::stop_token st) {
        int seq = 0;
        while (!st.stop_requested()) {
            // Simulate receiving a tick from the NIC
            Tick t{100.0 + (seq % 10) * 0.01, 100 + seq % 50};
            {
                std::scoped_lock lk(mtx_);
                q_.push(t);
            }
            count_.fetch_add(1, std::memory_order_relaxed);
            ++seq;

            // Simulate ~1ms inter-tick interval
            std::this_thread::sleep_for(std::chrono::microseconds(100));
        }
        std::cout << "Feed thread clean exit, processed " << count_.load() << " ticks\\n";
    }
};

int main() {
    MarketFeedThread feed;
    // Let it run for 50ms
    std::this_thread::sleep_for(std::chrono::milliseconds(50));

    feed.shutdown();
    // jthread auto-joins: blocks until run() exits gracefully
    // No need to call thread_.join() explicitly

    std::cout << "Total ticks: " << feed.ticks_received() << "\\n";
    // Expected: ~500 ticks (50ms / 0.1ms interval)
}`,
    explanation: "std::jthread (C++20) is a self-joining thread that automatically requests a stop signal on destruction, eliminating the common bug of forgetting to join a thread before its owning object is destroyed; the stop_token cooperative cancellation model is preferred over an atomic bool flag because it composes with std::condition_variable::wait() via stop_callback, enabling efficient blocking inside the worker thread.",
  },
  {
    id: "cpp-20260630-b1-atomic-circuit-breaker",
    language: "cpp",
    title: "Atomic state machine for market-data circuit breaker",
    tag: "performance",
    code: `#include <atomic>
#include <iostream>
#include <string_view>
#include <cstdint>

// Circuit breaker: trading halted when price moves > threshold in time window.
// State transitions must be atomic — multiple threads read/write concurrently.
enum class MarketState : uint8_t {
    NORMAL    = 0,
    WARNING   = 1,   // approaching limit
    HALTED    = 2,   // trading suspended
    RESUMING  = 3,   // post-halt auction
};

class CircuitBreaker {
    std::atomic<MarketState> state_{MarketState::NORMAL};
    std::atomic<double>      ref_price_{0.0};
    std::atomic<uint64_t>    halt_time_ns_{0};

    static constexpr double WARN_BPS  = 50.0;   // 50 bps warning
    static constexpr double HALT_BPS  = 100.0;  // 100 bps halt

public:
    void set_reference(double price) {
        ref_price_.store(price, std::memory_order_relaxed);
        state_.store(MarketState::NORMAL, std::memory_order_release);
    }

    // Called on every tick — must be very fast
    bool check_tick(double price, uint64_t ts_ns) {
        double ref  = ref_price_.load(std::memory_order_relaxed);
        double move = std::abs(price - ref) / ref * 10'000.0;  // bps

        auto cur = state_.load(std::memory_order_acquire);
        if (cur == MarketState::HALTED) return false;   // fast path: block

        if (move >= HALT_BPS) {
            // CAS: only succeed if we are the first to trigger halt
            MarketState expected = MarketState::WARNING;
            if (!state_.compare_exchange_strong(expected, MarketState::HALTED,
                                                std::memory_order_acq_rel))
                // Also try from NORMAL if WARNING was skipped
                state_.store(MarketState::HALTED, std::memory_order_release);
            halt_time_ns_.store(ts_ns, std::memory_order_release);
            std::cout << "HALT: " << move << " bps at " << ts_ns << "\\n";
            return false;
        } else if (move >= WARN_BPS && cur == MarketState::NORMAL) {
            state_.store(MarketState::WARNING, std::memory_order_release);
            std::cout << "WARN: " << move << " bps\\n";
        }
        return true;  // trading allowed
    }

    std::string_view state_name() const {
        switch (state_.load(std::memory_order_acquire)) {
            case MarketState::NORMAL:   return "NORMAL";
            case MarketState::WARNING:  return "WARNING";
            case MarketState::HALTED:   return "HALTED";
            case MarketState::RESUMING: return "RESUMING";
        }
        return "?";
    }
};

int main() {
    CircuitBreaker cb;
    cb.set_reference(100.0);
    std::cout << cb.check_tick(100.2, 1000) << "\\n";  // 1 (20 bps, normal)
    std::cout << cb.check_tick(100.6, 2000) << "\\n";  // 1 (60 bps, warning)
    std::cout << cb.check_tick(101.1, 3000) << "\\n";  // 0 (110 bps, halted)
    std::cout << cb.check_tick(101.0, 4000) << "\\n";  // 0 (already halted)
    std::cout << "State: " << cb.state_name() << "\\n";
}`,
    explanation: "The CAS (compare_exchange_strong) on the HALTED transition ensures exactly one thread wins the race to trigger the halt, preventing duplicate halt logs or double-halt events in a multi-threaded feed handler; the fast path (check halted state first with acquire) keeps the critical tick-check path to two atomic loads in the common case.",
  },
  {
    id: "cpp-20260630-b1-nttp-tenor",
    language: "cpp",
    title: "Non-type template parameters (NTTP) for compile-time tenor encoding",
    tag: "C++17",
    code: `#include <ratio>
#include <cmath>
#include <iostream>
#include <chrono>

// Encode tenor as an NTTP — compile-time rational year fraction
// e.g. Tenor<1,12> = 1 month, Tenor<1,4> = 3 months, Tenor<1,1> = 1 year
template <int Num, int Den = 1>
struct Tenor {
    static constexpr double years = static_cast<double>(Num) / Den;
};

// Discount factor specialised for any tenor
template <int Num, int Den>
double discount(double rate, Tenor<Num,Den>) {
    return std::exp(-rate * Tenor<Num,Den>::years);
}

// Forward rate between two tenors
template <int N1, int D1, int N2, int D2>
double forward_rate(double r_start, double r_end,
                    Tenor<N1,D1>, Tenor<N2,D2>) {
    static_assert(N1 * D2 < N2 * D1, "Start tenor must precede end tenor");
    constexpr double T1 = Tenor<N1,D1>::years;
    constexpr double T2 = Tenor<N2,D2>::years;
    return (r_end * T2 - r_start * T1) / (T2 - T1);
}

// Convexity adjustment for futures vs forward rate (Hull-White simplified)
// Futures rate = forward rate + 0.5 * sigma^2 * T1 * T2
template <int N1, int D1, int N2, int D2>
double futures_convexity_adj(double sigma,
                              Tenor<N1,D1> t1, Tenor<N2,D2> t2) {
    constexpr double T1 = Tenor<N1,D1>::years;
    constexpr double T2 = Tenor<N2,D2>::years;
    return 0.5 * sigma * sigma * T1 * T2;  // HW convexity adjustment
}

using ONRate   = Tenor<1,360>;
using OneMonth = Tenor<1,12>;
using ThreeMonth = Tenor<1,4>;
using SixMonth = Tenor<1,2>;
using OneYear  = Tenor<1>;
using TwoYear  = Tenor<2>;
using FiveYear = Tenor<5>;
using TenYear  = Tenor<10>;

int main() {
    std::cout << "3m df (r=4.5%): " << discount(0.045, ThreeMonth{}) << "\\n";
    std::cout << "1y  df (r=5%):  " << discount(0.050, OneYear{})    << "\\n";
    std::cout << "5y  df (r=5%):  " << discount(0.050, FiveYear{})   << "\\n";

    double fwd = forward_rate(0.045, 0.050, ThreeMonth{}, OneYear{});
    std::cout << "3m-1y fwd rate: " << fwd << "\\n";

    double adj = futures_convexity_adj(0.015, ThreeMonth{}, TwoYear{});
    std::cout << "Convexity adj (bps): " << adj * 10000 << "\\n";

    // static_assert(Tenor<3,1>::years == 3.0);   // verifiable at compile time
    static_assert(Tenor<1,12>::years < Tenor<1,4>::years, "1m < 3m");
}`,
    explanation: "Encoding tenors as NTTP rationals moves the year-fraction arithmetic to compile time — the compiler can precompute discount factors for fixed-tenor instruments and static_assert sanity-checks like 'start tenor < end tenor'; in a term structure library with hundreds of fixed tenor combinations, this eliminates an entire class of silent runtime bugs where tenors are passed in the wrong order.",
  },
  {
    id: "cpp-20260630-b1-variance-swap",
    language: "cpp",
    title: "Variance swap strike via log-contract replication",
    tag: "derivatives",
    code: `#include <cmath>
#include <vector>
#include <iostream>
#include <numeric>
#include <algorithm>

// Britten-Jones & Neuberger (2000): fair variance (variance swap strike K_var)
// K_var = (2/T) * [integral_0^F C(K)/K^2 dK + integral_F^inf P(K)/K^2 dK]
// Discretised using market option prices at a finite grid of strikes.

static double N_cdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }

double bsm_call(double F, double K, double r, double sigma, double T) {
    double d1 = (std::log(F/K) + 0.5*sigma*sigma*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma*std::sqrt(T);
    return std::exp(-r*T) * (F * N_cdf(d1) - K * N_cdf(d2));
}

double bsm_put(double F, double K, double r, double sigma, double T) {
    return bsm_call(F, K, r, sigma, T) - std::exp(-r*T) * (F - K); // put-call parity
}

// Compute fair variance from a smile of implied vols
double fair_variance(double S0, double r, double T, double sigma_atm,
                     const std::vector<double>& strikes,
                     const std::vector<double>& iv_smile) {
    double F   = S0 * std::exp(r * T);  // ATM forward
    double sum = 0.0;
    int    n   = static_cast<int>(strikes.size());

    for (int i = 0; i < n - 1; ++i) {
        double K  = 0.5 * (strikes[i] + strikes[i+1]);   // midpoint
        double dK = strikes[i+1] - strikes[i];
        // Interpolate IV at midpoint
        double iv = 0.5 * (iv_smile[i] + iv_smile[i+1]);

        double price;
        if (K <= F) price = bsm_put(F,  K, r, iv, T);
        else        price = bsm_call(F, K, r, iv, T);

        sum += 2.0 * price / (K * K) * dK;
    }
    double K_var = (2.0 / T) * sum;          // fair variance
    double K_vol = std::sqrt(K_var);          // fair vol = variance swap vol
    return K_vol;
}

int main() {
    // Flat vol smile (should return ~sigma_atm)
    double S0 = 100.0, r = 0.05, T = 1.0, sigma = 0.20;
    std::vector<double> K_grid, iv_grid;
    for (int i = 60; i <= 160; i += 5) {
        K_grid.push_back(i);
        iv_grid.push_back(sigma);   // flat smile
    }

    double fv = fair_variance(S0, r, T, sigma, K_grid, iv_grid);
    std::cout << "Fair vol (flat smile): " << fv << "\\n";  // ~0.20

    // Skewed smile: higher vol for low strikes (typical equity skew)
    for (int i = 0; i < static_cast<int>(K_grid.size()); ++i)
        iv_grid[i] = sigma + 0.01 * (100.0 - K_grid[i]) / 10.0;

    double fv2 = fair_variance(S0, r, T, sigma, K_grid, iv_grid);
    std::cout << "Fair vol (skewed):     " << fv2 << "\\n";  // > 0.20 (skew premium)
}`,
    explanation: "The variance swap fair strike integrates option prices across all strikes weighted by 1/K^2, meaning it is more sensitive to OTM put prices than ATM options; this is why equity variance swaps trade at a premium to ATM implied vol squared — the 1/K^2 weighting overweights cheap OTM puts that have high implied vol relative to realized vol during crashes.",
  },
  {
    id: "cpp-20260630-b1-bdt-lattice",
    language: "cpp",
    title: "Black-Derman-Toy interest rate binomial lattice",
    tag: "fixed income",
    code: `#include <vector>
#include <cmath>
#include <iostream>
#include <algorithm>

// Black-Derman-Toy (1990): recombining binomial lattice for short rates.
// Each period: r_up = r * exp(2*sigma*sqrt(dt)); log-normal rates.
// Calibrated here to a flat yield curve + flat vol for illustration.

struct BDTNode { double r_down; double sigma; };

std::vector<std::vector<double>>
bdt_lattice(int N, double r0, double flat_sigma, double dt) {
    // r[t][j]: rate at time step t, state j (j up-moves from bottom)
    std::vector<std::vector<double>> r(N+1);
    for (int t = 0; t <= N; ++t) r[t].resize(t+1);

    // Simplified: constant sigma per step
    double factor = std::exp(2.0 * flat_sigma * std::sqrt(dt));
    r[0][0] = r0;
    for (int t = 1; t <= N; ++t) {
        // Lowest node: calibrate to match term structure (simplified: r0 * e^drift)
        r[t][0] = r[t-1][0] * std::exp(-0.5 * flat_sigma * flat_sigma * dt);
        for (int j = 1; j <= t; ++j)
            r[t][j] = r[t][j-1] * factor;  // each up-move multiplies by factor
    }
    return r;
}

// Price a zero-coupon bond using backward induction on BDT tree
double bdt_zcb_price(const std::vector<std::vector<double>>& r,
                      int N, double dt) {
    double p = 0.5;  // risk-neutral probability (simplified)
    std::vector<double> V(N+1, 1.0);  // terminal: ZCB pays 1 at maturity

    for (int t = N-1; t >= 0; --t) {
        std::vector<double> V_new(t+1);
        for (int j = 0; j <= t; ++j) {
            double disc = std::exp(-r[t][j] * dt);
            V_new[j]   = disc * (p * V[j+1] + (1-p) * V[j]);
        }
        V = V_new;
    }
    return V[0];
}

// Price a callable bond: compare continuation vs call price at each node
double bdt_callable_bond(const std::vector<std::vector<double>>& r,
                          int N, double dt, double coupon, double call_px) {
    double p = 0.5;
    std::vector<double> V(N+1, 1.0 + coupon);  // terminal: par + last coupon

    for (int t = N-1; t >= 0; --t) {
        std::vector<double> V_new(t+1);
        for (int j = 0; j <= t; ++j) {
            double disc = std::exp(-r[t][j] * dt);
            double hold = disc * (p * V[j+1] + (1-p) * V[j]) + coupon * disc;
            V_new[j]   = std::min(hold, call_px);  // issuer calls if V > call_px
        }
        V = V_new;
    }
    return V[0];
}

int main() {
    int N     = 5;     // 5 annual steps
    double r0 = 0.05, sigma = 0.10, dt = 1.0;
    auto R = bdt_lattice(N, r0, sigma, dt);

    std::cout << "BDT rate tree (bottom to top per step):\\n";
    for (int t = 0; t <= N; ++t) {
        for (int j = 0; j <= t; ++j) std::cout << R[t][j] << " ";
        std::cout << "\\n";
    }

    double zcb  = bdt_zcb_price(R, N, dt);
    double call = bdt_callable_bond(R, N, dt, 0.05, 1.02);
    std::cout << "5y ZCB price:     " << zcb  << "\\n";
    std::cout << "Callable bond:    " << call << "\\n";
    std::cout << "Call option value:" << zcb + 0.05 - call << "\\n";  // embedded option
}`,
    explanation: "The BDT lattice enforces log-normal short rates (rates stay positive) and is recombining (j up + 1 down = same state as j down + 1 up), reducing the number of nodes from 2^N to N*(N+1)/2; the callable bond pricing illustrates how an embedded call option is worth exactly the difference between the straight bond and callable bond prices.",
  },
  {
    id: "cpp-20260630-b1-pmr-monotonic",
    language: "cpp",
    title: "std::pmr::monotonic_buffer_resource for batch risk alloc",
    tag: "C++17",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <cmath>
#include <iostream>
#include <array>

// monotonic_buffer_resource: bump-pointer allocator on a fixed buffer.
// All allocations are O(1) pointer bumps; deallocation is a no-op.
// Perfect for per-tick or per-scenario batch computations where all
// temporaries can be freed together at the end of the calculation.

struct GreekResult {
    double delta, gamma, vega, theta, rho;
};

static double N_cdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }

GreekResult compute_greeks(double S, double K, double r, double sigma, double T) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double d2  = d1 - sigma * sqT;
    double phi = std::exp(-0.5*d1*d1) / std::sqrt(2.0 * M_PI);
    double df  = std::exp(-r * T);

    return {
        N_cdf(d1),                        // delta
        phi / (S * sigma * sqT),          // gamma
        S * phi * sqT,                    // vega
        -(S * phi * sigma / (2*sqT)) - r * K * df * N_cdf(d2),  // theta
        K * T * df * N_cdf(d2)           // rho
    };
}

int main() {
    // 16 KB stack buffer — no heap allocation for this entire computation
    alignas(std::max_align_t) std::array<std::byte, 16'384> buf;
    std::pmr::monotonic_buffer_resource pool{buf.data(), buf.size()};

    // All containers use the pool allocator — zero malloc calls
    std::pmr::vector<GreekResult> greeks{&pool};
    std::pmr::vector<double>      strikes{&pool};
    std::pmr::vector<std::pmr::string> labels{&pool};

    greeks.reserve(100);
    for (int i = 80; i <= 120; i += 2) {
        double K = static_cast<double>(i);
        greeks.push_back(compute_greeks(100.0, K, 0.05, 0.20, 1.0));
        strikes.push_back(K);
        labels.push_back(std::pmr::string("K=", &pool) + std::to_string(i));
    }

    // Print ATM Greeks
    auto& atm = greeks[10];  // K=100
    std::cout << "ATM Delta: " << atm.delta << "\\n";  // ~0.54
    std::cout << "ATM Gamma: " << atm.gamma << "\\n";
    std::cout << "ATM Vega:  " << atm.vega  << "\\n";

    std::cout << "Pool used: ~" << greeks.size() * sizeof(GreekResult)
              << " of 16384 bytes\\n";
    // Pool is released instantly — single destructor call, no per-element free
}`,
    explanation: "The monotonic_buffer_resource is the fastest possible C++ allocator: it bumps a pointer and returns — no free list, no heap traversal, no lock; the corresponding deallocation of all objects at once maps to a single pointer reset, making it ideal for per-scenario risk calculations where you compute thousands of greeks, use them, then discard the entire batch.",
  },
  {
    id: "cpp-20260630-b1-van-der-corput",
    language: "cpp",
    title: "Van der Corput low-discrepancy sequence for quasi-Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <iostream>
#include <numeric>

// Van der Corput sequence in base b: radically inverts the binary representation.
// Halton sequence: 2D = (VdC base-2, VdC base-3) — more uniform than pseudo-random.
// QMC with N points gives O(log(N)^d / N) error vs O(1/sqrt(N)) for MC.

double van_der_corput(int n, int base) {
    double result = 0.0;
    double f      = 1.0;
    while (n > 0) {
        f      /= base;
        result += f * (n % base);
        n      /= base;
    }
    return result;
}

// 2D Halton for European call pricing (basis 2, 3)
double halton_call_mc(double S, double K, double r, double sigma, double T,
                       int N) {
    double drift  = (r - 0.5*sigma*sigma)*T;
    double vol    = sigma * std::sqrt(T);
    double sum    = 0.0;

    // Box-Muller using Halton (u1, u2) instead of uniform random
    for (int i = 1; i <= N/2; ++i) {
        double u1 = van_der_corput(i, 2);
        double u2 = van_der_corput(i, 3);
        // Box-Muller transform to N(0,1)
        double z1 = std::sqrt(-2.0*std::log(u1)) * std::cos(2*M_PI*u2);
        double z2 = std::sqrt(-2.0*std::log(u1)) * std::sin(2*M_PI*u2);
        sum += std::max(S * std::exp(drift + vol*z1) - K, 0.0);
        sum += std::max(S * std::exp(drift + vol*z2) - K, 0.0);
    }
    return std::exp(-r*T) * sum / N;
}

// Pseudo-random MC for comparison
double pseudo_random_call(double S, double K, double r, double sigma, double T,
                           int N, unsigned seed = 42) {
    std::mt19937_64 rng{seed};
    std::normal_distribution<double> nd;
    double drift = (r - 0.5*sigma*sigma)*T, vol = sigma*std::sqrt(T), sum = 0;
    for (int i = 0; i < N; ++i)
        sum += std::max(S*std::exp(drift + vol*nd(rng)) - K, 0.0);
    return std::exp(-r*T) * sum / N;
}

int main() {
    double S=100, K=100, r=0.05, sig=0.20, T=1.0;
    for (int N : {1000, 10000, 100000}) {
        double qmc  = halton_call_mc(S, K, r, sig, T, N);
        double mc   = pseudo_random_call(S, K, r, sig, T, N);
        std::cout << "N=" << N
                  << " QMC=" << qmc
                  << " MC=" << mc << " (BSM~10.45)\\n";
    }
}`,
    explanation: "Quasi-Monte Carlo achieves much lower discrepancy (gap in point coverage) than pseudo-random sequences, converging at O((log N)^d / N) rather than O(1/sqrt(N)); the Van der Corput sequence in base b is constructed by writing n in base b and reflecting the digits across the decimal point, ensuring consecutive points fill gaps rather than clustering.",
  },
  {
    id: "cpp-20260630-b1-sabr-vol",
    language: "cpp",
    title: "SABR model analytic vol approximation (Hagan 2002)",
    tag: "vol surface",
    code: `#include <cmath>
#include <iostream>
#include <vector>

// SABR: dF = alpha * F^beta * dW1
//        dalpha = nu * alpha * dW2
//        dW1 dW2 = rho dt
// Hagan (2002) analytic approximation for implied vol sigma_B(K).
// F: forward price, K: strike, T: maturity
// alpha: initial vol, beta: skew exponent [0,1], rho: correlation, nu: vol-of-vol

double sabr_implied_vol(double F, double K, double T,
                         double alpha, double beta, double rho, double nu) {
    if (std::abs(F - K) < 1e-8) {
        // ATM formula (F == K limit)
        double FK_mid = std::pow(F, 1.0 - beta);
        double term1  = alpha / FK_mid;
        double term2  = 1.0 + ((1.0 - beta)*(1.0 - beta)/24.0 * alpha*alpha/std::pow(F, 2*(1-beta))
                                + 0.25 * rho * beta * nu * alpha / FK_mid
                                + (2 - 3*rho*rho)/24.0 * nu * nu) * T;
        return term1 * term2;
    }

    double log_FK    = std::log(F / K);
    double FK_beta   = std::pow(F * K, (1.0 - beta) / 2.0);
    double z         = nu / alpha * FK_beta * log_FK;
    double x_z       = std::log((std::sqrt(1 - 2*rho*z + z*z) + z - rho) / (1 - rho));

    double A = alpha / (FK_beta * (1.0
        + (1-beta)*(1-beta)/24.0 * log_FK*log_FK
        + (1-beta)*(1-beta)*(1-beta)*(1-beta)/1920.0 * log_FK*log_FK*log_FK*log_FK));

    double B = (std::abs(x_z) < 1e-8) ? 1.0 : z / x_z;

    double C = 1.0 + ((1-beta)*(1-beta)/24.0 * alpha*alpha / std::pow(F*K, 1-beta)
                      + 0.25 * rho*beta*nu*alpha / FK_beta
                      + (2 - 3*rho*rho)/24.0 * nu*nu) * T;

    return A * B * C;
}

int main() {
    // Calibrated SABR params for SPX (typical values)
    double alpha = 0.25, beta = 0.7, rho = -0.6, nu = 0.5;
    double F = 5000.0, T = 0.25;  // 3-month SPX options

    std::cout << "SABR smile (3m SPX):\\n";
    for (int delta_K : {-400, -200, -100, 0, 100, 200, 400}) {
        double K     = F + delta_K;
        double iv    = sabr_implied_vol(F, K, T, alpha, beta, rho, nu);
        std::cout << "  K=" << K << " IV=" << iv*100 << "%\\n";
    }
    // ATM: ~25%, OTM puts have higher IV (skew), OTM calls lower
}`,
    explanation: "The SABR model's analytic approximation (Hagan 2002) is the industry standard for fixed income and FX vol surface parameterization because it produces a tractable closed-form smile with intuitive parameters: beta controls the backbone slope (log-normal vs normal), rho drives skew, and nu controls the smile curvature; calibration is a fast nonlinear least-squares fit rather than an expensive PDE solve.",
  },
  {
    id: "cpp-20260630-b1-multilevel-book",
    language: "cpp",
    title: "Multi-level limit order book with O(log N) level access",
    tag: "market microstructure",
    code: `#include <map>
#include <deque>
#include <unordered_map>
#include <cstdint>
#include <optional>
#include <iostream>

// Full order book: map of price levels; O(log N) level lookup.
// Order lookup by ID: hash map for O(1) cancel by order ID.
struct Order {
    uint64_t id;
    double   price;
    int      qty;
    char     side;
};

// Pointer-stable iterator for deque (deque doesn't invalidate references on push_back)
using Level = std::deque<Order>;

class LimitOrderBook {
    std::map<double, Level, std::greater<double>> bids_;  // best bid first
    std::map<double, Level>                       asks_;  // best ask first

    // O(1) cancel: map order ID to (price, side, iterator)
    struct Loc { double price; char side; };
    std::unordered_map<uint64_t, Loc> id_index_;

public:
    bool insert(Order o) {
        if (id_index_.count(o.id)) return false;
        char side = o.side;
        double px = o.price;
        if (side == 'B') bids_[px].push_back(o);
        else             asks_[px].push_back(o);
        id_index_[o.id] = {px, side};
        return true;
    }

    bool cancel(uint64_t id) {
        auto it = id_index_.find(id);
        if (it == id_index_.end()) return false;
        auto [px, side] = it->second;
        auto& levels = (side == 'B') ? bids_ : asks_;
        auto  lvl_it = levels.find(px);
        if (lvl_it != levels.end()) {
            auto& dq = lvl_it->second;
            // Linear scan within level (typically small; use intrusive list for O(1))
            for (auto di = dq.begin(); di != dq.end(); ++di) {
                if (di->id == id) { dq.erase(di); break; }
            }
            if (dq.empty()) levels.erase(lvl_it);
        }
        id_index_.erase(it);
        return true;
    }

    std::optional<double> best_bid() const {
        if (bids_.empty()) return std::nullopt;
        return bids_.begin()->first;
    }
    std::optional<double> best_ask() const {
        if (asks_.empty()) return std::nullopt;
        return asks_.begin()->first;
    }

    void print_top(int n = 3) const {
        int i = 0;
        for (auto& [px, lvl] : asks_) {
            int tot = 0; for (auto& o : lvl) tot += o.qty;
            std::cout << "ASK " << px << " x " << tot << "\\n";
            if (++i >= n) break;
        }
        i = 0;
        for (auto& [px, lvl] : bids_) {
            int tot = 0; for (auto& o : lvl) tot += o.qty;
            std::cout << "BID " << px << " x " << tot << "\\n";
            if (++i >= n) break;
        }
    }
};

int main() {
    LimitOrderBook book;
    book.insert({1, 100.50, 100, 'B'});
    book.insert({2, 100.00, 200, 'B'});
    book.insert({3, 101.00, 150, 'S'});
    book.insert({4, 101.50, 250, 'S'});
    book.insert({5, 100.50, 50,  'B'});  // second order at same price
    book.print_top();
    std::cout << "Spread: " << (*book.best_ask() - *book.best_bid()) << "\\n";
    book.cancel(1);
    std::cout << "After cancel #1:\\n";
    book.print_top(1);
}`,
    explanation: "Separating the price-level map (for O(log N) quote dissemination) from the order-ID hash map (for O(1) cancel) is the canonical limit order book design; production exchanges replace std::map with an array indexed by normalised tick, reducing level access to O(1) at the cost of a fixed memory allocation proportional to the tick range.",
  },
  {
    id: "cpp-20260630-b1-all-greeks-structured-bindings",
    language: "cpp",
    title: "Full BSM Greeks via structured bindings and numeric differentiation",
    tag: "derivatives",
    code: `#include <cmath>
#include <tuple>
#include <iostream>

static double Phi(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }
static double phi(double x) { return std::exp(-0.5*x*x) / std::sqrt(2*M_PI); }

// Return all five first-order Greeks plus gamma via analytic BSM formulas
struct AllGreeks { double price, delta, gamma, vega, theta, rho; };

AllGreeks bsm_all_greeks(double S, double K, double r, double sigma, double T,
                          bool is_call = true) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double d2  = d1 - sigma*sqT;
    double df  = std::exp(-r*T);

    double N1  = Phi(is_call ?  d1 : -d1);
    double N2  = Phi(is_call ?  d2 : -d2);
    double n1  = phi(d1);    // same for both call/put

    double sign = is_call ? 1.0 : -1.0;

    double price = sign * (S * Phi(sign*d1) - K*df * Phi(sign*d2));
    double delta = sign * N1;
    double gamma = n1 / (S * sigma * sqT);         // same for call and put
    double vega  = S * n1 * sqT;                   // same for call and put
    double theta = (-S*n1*sigma/(2*sqT) - sign*r*K*df*N2) / 252.0;  // per calendar day
    double rho   = sign * K * T * df * N2 / 100.0;  // per 1% rate move

    return {price, delta, gamma, vega, theta, rho};
}

int main() {
    // C++17 structured bindings decompose the struct directly
    auto [price, delta, gamma, vega, theta, rho] =
        bsm_all_greeks(100, 100, 0.05, 0.20, 1.0, true);

    std::cout << "BSM Call Greeks:\\n";
    std::cout << "  Price: " << price << "\\n";  // 10.45
    std::cout << "  Delta: " << delta << "\\n";  // 0.637
    std::cout << "  Gamma: " << gamma << "\\n";  // 0.019
    std::cout << "  Vega:  " << vega  << "\\n";  // 37.5  ($ per 1 vol pt)
    std::cout << "  Theta: " << theta << "\\n";  // -0.016 ($ per calendar day)
    std::cout << "  Rho:   " << rho   << "\\n";  // 0.53  ($ per 1% rate move)

    // P&L approximation for a delta-neutral portfolio (+1 call, -delta stock)
    double dS = 1.0, dsigma = 0.01;
    double pnl_gamma = 0.5 * gamma * dS * dS;
    double pnl_vega  = vega * dsigma;
    double pnl_theta = theta;   // daily decay
    std::cout << "\\n+1% vol P&L:     " << pnl_vega  << "\\n";
    std::cout << "+1 spot P&L:     " << pnl_gamma << "\\n";
    std::cout << "1-day theta P&L: " << pnl_theta << "\\n";
}`,
    explanation: "Structured bindings (C++17) let you decompose a struct or tuple into named local variables on a single line — [price, delta, gamma, vega, theta, rho] = bsm_all_greeks(...) — making the call site as readable as Python tuple unpacking while retaining full C++ zero-overhead; theta is divided by 252 to convert from annual to calendar-day decay, which is the convention in equity options.",
  },
  {
    id: "cpp-20260630-b1-chrono-session-timer",
    language: "cpp",
    title: "Market session timer with std::chrono for trading hours enforcement",
    tag: "C++20",
    code: `#include <chrono>
#include <iostream>
#include <string>
#include <cassert>

using namespace std::chrono;
using namespace std::chrono_literals;

// Represent a trading session as [open, close) in UTC seconds-since-midnight
struct Session {
    seconds open_utc;   // seconds from midnight UTC
    seconds close_utc;

    bool is_open(sys_time<seconds> now_utc) const {
        auto midnight = floor<days>(now_utc);
        auto tod      = now_utc - midnight;  // time of day
        return tod >= open_utc && tod < close_utc;
    }

    seconds time_to_open(sys_time<seconds> now_utc) const {
        auto midnight = floor<days>(now_utc);
        auto tod      = now_utc - midnight;
        if (tod >= open_utc && tod < close_utc) return 0s;
        if (tod < open_utc) return open_utc - tod;
        // Past close: time until next-day open
        return days{1} - tod + open_utc;
    }

    seconds time_to_close(sys_time<seconds> now_utc) const {
        auto midnight = floor<days>(now_utc);
        auto tod      = now_utc - midnight;
        if (tod >= close_utc) return 0s;
        return close_utc - tod;
    }
};

// Sub-microsecond latency measurement for order roundtrip
struct LatencyTimer {
    using Clock = steady_clock;
    Clock::time_point t0;

    void start() { t0 = Clock::now(); }
    nanoseconds elapsed() const { return Clock::now() - t0; }

    template <typename D>
    static double to_us(D d) {
        return static_cast<double>(duration_cast<nanoseconds>(d).count()) / 1000.0;
    }
};

int main() {
    // NYSE: 09:30 - 16:00 ET = 14:30 - 21:00 UTC (simplified; ignores DST)
    Session nyse{14h + 30min, 21h};

    // Simulate "now" = 2026-06-30 15:00:00 UTC
    auto epoch    = sys_days{2026y / June / 30};
    auto test_now = sys_time<seconds>{epoch} + 15h;

    std::cout << "NYSE open: " << std::boolalpha << nyse.is_open(test_now) << "\\n";
    std::cout << "Time to close: "
              << duration_cast<minutes>(nyse.time_to_close(test_now)).count()
              << " min\\n";

    // Measure latency of a computation
    LatencyTimer t;
    t.start();
    volatile double x = std::sqrt(2.0);
    (void)x;
    auto lat = t.elapsed();
    std::cout << "sqrt latency: " << LatencyTimer::to_us(lat) << " us\\n";
}`,
    explanation: "std::chrono with C++20 calendar types (year/month/day, sys_days) enables type-safe date arithmetic — you can add months correctly without worrying about leap-year bugs or 30-vs-31-day errors; steady_clock is mandatory for latency measurement because system_clock can jump backward during NTP corrections, which would produce negative latency readings.",
  },
];
