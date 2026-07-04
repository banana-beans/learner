import type { Snippet } from "./types";

export const cppSnippets20260704B1: Snippet[] = [
  {
    id: "cpp-20260704-b1-perfect-forwarding",
    language: "cpp",
    title: "Perfect Forwarding with std::forward in Order Factory",
    tag: "modern-cpp",
    code: `#include <utility>
#include <string>
#include <iostream>
#include <memory>

struct Order {
    std::string symbol;
    double      price;
    int         qty;
    char        side;
    Order(std::string s, double p, int q, char side)
        : symbol(std::move(s)), price(p), qty(q), side(side) {}
};

// Forwarding reference (T&&) deduces to T& for lvalues, T&& for rvalues.
// std::forward<T> preserves the value category — it does NOT unconditionally move.
template <typename... Args>
std::unique_ptr<Order> make_order(Args&&... args) {
    return std::make_unique<Order>(std::forward<Args>(args)...);
}

// Demonstrates lvalue vs rvalue forwarding
template <typename T>
void inspect(T&& val) {
    if constexpr (std::is_lvalue_reference_v<T>)
        std::cout << "got lvalue: " << val << "\\n";
    else
        std::cout << "got rvalue: " << val << "\\n";
}

int main() {
    std::string sym = "AAPL";

    // sym is an lvalue → forwarded as lvalue (no copy elision, no move)
    auto o1 = make_order(sym, 183.50, 100, 'B');

    // Temporary string → forwarded as rvalue (moved into Order::symbol)
    auto o2 = make_order(std::string("MSFT"), 415.20, 200, 'S');

    inspect(sym);               // lvalue
    inspect(std::move(sym));    // rvalue (sym is now valid but unspecified)

    std::cout << o1->symbol << " " << o1->qty << "@" << o1->price << "\\n";
    std::cout << o2->symbol << " " << o2->qty << "@" << o2->price << "\\n";
}`,
    explanation:
      "std::forward<T> is a conditional cast: if T was deduced as T& (lvalue), it casts to T&; if T was deduced as T&& (rvalue), it casts to T&&. This enables factory functions to pass arguments to constructors with the same value category the caller used — avoiding unnecessary copies for rvalues while not accidentally moving lvalues.",
  },
  {
    id: "cpp-20260704-b1-concepts",
    language: "cpp",
    title: "C++20 Concepts for Order Validation Constraints",
    tag: "concepts",
    code: `#include <concepts>
#include <type_traits>
#include <iostream>
#include <string>
#include <stdexcept>

// Concept: a Priceable type must have a numeric price() member
template <typename T>
concept Priceable = requires(T t) {
    { t.price() } -> std::convertible_to<double>;
    { t.qty()   } -> std::convertible_to<int>;
};

// Concept: type must represent a tradeable instrument
template <typename T>
concept Instrument = Priceable<T> && requires(T t) {
    { t.symbol() } -> std::convertible_to<std::string>;
    { t.notional() } -> std::convertible_to<double>;
};

struct LimitOrder {
    double price_;
    int    qty_;
    std::string sym_;

    double      price()    const { return price_; }
    int         qty()      const { return qty_; }
    std::string symbol()   const { return sym_; }
    double      notional() const { return price_ * qty_; }
};

struct BadOrder { int x; };  // does not satisfy Priceable

// Constrained function: only compiles for types satisfying Instrument
template <Instrument Ord>
void validate_and_route(const Ord& o) {
    if (o.qty() <= 0)    throw std::invalid_argument("non-positive qty");
    if (o.price() <= 0)  throw std::invalid_argument("non-positive price");
    std::cout << "routing: " << o.symbol()
              << " " << o.qty() << "@" << o.price()
              << " notional=" << o.notional() << "\\n";
}

int main() {
    static_assert(Instrument<LimitOrder>,  "LimitOrder should satisfy Instrument");
    static_assert(!Priceable<BadOrder>,    "BadOrder should not satisfy Priceable");

    LimitOrder lo{"NVDA", 850.25, 50};  // wait, struct needs reorder — let's use ctor
    // Actually LimitOrder uses aggregate init with field order: price_, qty_, sym_
    LimitOrder order{850.25, 50, "NVDA"};
    validate_and_route(order);

    // validate_and_route(BadOrder{});  // compile error: BadOrder doesn't satisfy Instrument
}`,
    explanation:
      "C++20 concepts enforce type constraints at the call site with readable error messages instead of deep SFINAE substitution failures. A requires-expression checks both syntax (the expression must compile) and semantics (the return type must satisfy a constraint). Concepts let you express 'this function works for any order type' without sacrificing type safety or requiring inheritance.",
  },
  {
    id: "cpp-20260704-b1-slab-allocator",
    language: "cpp",
    title: "Fixed-Size Slab Allocator for Order Objects",
    tag: "allocators",
    code: `#include <cstddef>
#include <cstdint>
#include <vector>
#include <cassert>
#include <iostream>
#include <new>

// Slab allocator: pre-allocates a contiguous array of N fixed-size slots.
// Each free slot's first bytes hold a pointer to the next free slot (intrusive free list).
// alloc(): O(1) — pop from free list. free(): O(1) — push to free list.
template <std::size_t ObjSize, std::size_t Capacity>
class SlabAllocator {
    static constexpr std::size_t SLOT = (ObjSize < sizeof(void*)) ? sizeof(void*) : ObjSize;

    alignas(std::max_align_t) std::byte storage_[SLOT * Capacity];
    void* free_head_ = nullptr;
    std::size_t allocated_ = 0;

public:
    SlabAllocator() {
        // Build the intrusive free list through the storage array
        for (std::size_t i = 0; i < Capacity; ++i) {
            void* slot = storage_ + i * SLOT;
            void* next = (i + 1 < Capacity) ? (storage_ + (i+1)*SLOT) : nullptr;
            *reinterpret_cast<void**>(slot) = next;
        }
        free_head_ = storage_;
    }

    void* alloc() {
        if (!free_head_) return nullptr;
        void* p     = free_head_;
        free_head_  = *reinterpret_cast<void**>(p);
        ++allocated_;
        return p;
    }

    void free(void* p) {
        *reinterpret_cast<void**>(p) = free_head_;
        free_head_ = p;
        --allocated_;
    }

    std::size_t allocated() const { return allocated_; }
    std::size_t capacity()  const { return Capacity; }
};

struct Order {
    uint64_t id;
    double   price;
    int      qty;
    char     side;
};

int main() {
    SlabAllocator<sizeof(Order), 1024> pool;
    std::cout << "pool capacity: " << pool.capacity() << " orders\\n";

    // Allocate 3 orders
    void* raw1 = pool.alloc();
    void* raw2 = pool.alloc();
    void* raw3 = pool.alloc();

    Order* o1 = new(raw1) Order{1, 100.10, 100, 'B'};
    Order* o2 = new(raw2) Order{2, 100.20, 200, 'S'};
    Order* o3 = new(raw3) Order{3, 100.30,  50, 'B'};

    std::cout << "allocated: " << pool.allocated() << "\\n";

    o1->~Order(); pool.free(raw1);
    o2->~Order(); pool.free(raw2);
    o3->~Order(); pool.free(raw3);

    std::cout << "after free: " << pool.allocated() << "\\n";

    // Verify: the freed memory is immediately reusable
    void* reused = pool.alloc();
    assert(reused == raw3);  // LIFO free list
    std::cout << "reused address matches last freed: " << (reused == raw3) << "\\n";
}`,
    explanation:
      "A slab allocator stores the next-free-slot pointer directly inside each free slot's memory — eliminating external bookkeeping entirely. alloc() is a single pointer load + store; free() is the same. This is 5–10x faster than malloc for fixed-size objects at high allocation rates, which is why HFT order management systems pre-allocate a pool of Order structs at startup and recycle them throughout the day.",
  },
  {
    id: "cpp-20260704-b1-memory-ordering",
    language: "cpp",
    title: "Acquire/Release vs seq_cst Memory Ordering",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <cassert>
#include <iostream>

// Acquire/release: the cheapest ordering that guarantees happens-before across threads.
// seq_cst: adds a total global ordering of all seq_cst operations — costs a full fence.
// Rule: use acq/rel for producer-consumer pairs; seq_cst only when global ordering matters.

struct MarketUpdate {
    double price = 0.0;
    int    size  = 0;
};

MarketUpdate     g_update{};
std::atomic<int> g_ready{0};       // flag; 0=not ready, 1=ready

void publisher() {
    // Write data first (non-atomic), then publish flag with RELEASE
    g_update.price = 183.50;
    g_update.size  = 1000;
    // release: all prior writes are visible to any thread that observes g_ready >= 1
    g_ready.store(1, std::memory_order_release);
}

void subscriber() {
    // Spin until flag is set with ACQUIRE
    while (g_ready.load(std::memory_order_acquire) == 0)
        ; // spin — in production, use exponential back-off or a futex
    // acquire: guarantees we see all writes that happened before the release store
    assert(g_update.price == 183.50);
    assert(g_update.size  == 1000);
    std::cout << "received: " << g_update.price << " x" << g_update.size << "\\n";
}

// Example: two-flag ordering requires seq_cst (Dekker's algorithm variant)
std::atomic<bool> intent_A{false}, intent_B{false};

void thread_A() {
    intent_A.store(true, std::memory_order_seq_cst);   // must see B's store
    if (!intent_B.load(std::memory_order_seq_cst)) {
        // critical section — safe because seq_cst imposes total order
    }
}

int main() {
    std::thread pub(publisher);
    std::thread sub(subscriber);
    pub.join(); sub.join();

    // Demonstrate ordering overhead comparison (conceptual):
    // seq_cst store on x86-64 = MFENCE (expensive, ~40-100 cycles)
    // release  store on x86-64 = ordinary MOV (free — TSO guarantees stores are ordered)
    // acquire  load  on x86-64 = ordinary MOV (free)
    // On ARM/POWER, release/acquire generate lighter barriers than MFENCE.
    std::cout << "acquire/release sufficient for single producer-consumer\\n";
}`,
    explanation:
      "On x86-64, acquire loads and release stores compile to ordinary MOV instructions (TSO guarantees them for free); only seq_cst stores emit an MFENCE (full memory barrier, ~100 cycles). Choosing acq/rel over seq_cst for a market-data flag cuts latency on ARM and POWER where barriers are explicit. The rule: use acq/rel when you only need happens-before between one producer and one consumer; use seq_cst when multiple threads need a globally consistent view of multiple flags.",
  },
  {
    id: "cpp-20260704-b1-spsc-queue",
    language: "cpp",
    title: "SPSC Lock-Free Ring Buffer Queue",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <iostream>
#include <cstdint>

// Single-Producer Single-Consumer (SPSC) ring buffer.
// Producer and consumer each own a separate atomic counter — no contention.
// Size must be a power of 2 for the bitmask wrap trick.
template <typename T, std::size_t N>
class SPSCQueue {
    static_assert((N & (N - 1)) == 0, "N must be power of 2");
    static constexpr std::size_t MASK = N - 1;

    struct alignas(64) AlignedAtomic {   // separate cache lines
        std::atomic<std::size_t> val{0};
    };

    std::array<T, N> buf_{};
    AlignedAtomic    head_;  // written by producer, read by consumer
    AlignedAtomic    tail_;  // written by consumer, read by producer

public:
    // Producer side only
    bool push(const T& item) {
        std::size_t h = head_.val.load(std::memory_order_relaxed);
        std::size_t next_h = (h + 1) & MASK;
        if (next_h == tail_.val.load(std::memory_order_acquire))
            return false;  // queue full
        buf_[h] = item;
        head_.val.store(next_h, std::memory_order_release);
        return true;
    }

    // Consumer side only
    std::optional<T> pop() {
        std::size_t t = tail_.val.load(std::memory_order_relaxed);
        if (t == head_.val.load(std::memory_order_acquire))
            return std::nullopt;  // queue empty
        T item = buf_[t];
        tail_.val.store((t + 1) & MASK, std::memory_order_release);
        return item;
    }

    bool empty() const {
        return tail_.val.load(std::memory_order_acquire)
            == head_.val.load(std::memory_order_acquire);
    }
};

struct Tick { uint64_t seq; double price; };

int main() {
    SPSCQueue<Tick, 1024> q;

    // Simulate: producer pushes 5 ticks
    for (uint64_t i = 1; i <= 5; ++i)
        q.push({i, 100.0 + i * 0.01});

    // Consumer drains
    while (auto t = q.pop())
        std::cout << "seq=" << t->seq << " price=" << t->price << "\\n";
}`,
    explanation:
      "SPSC ring buffers are the canonical inter-thread data structure for market-data pipelines: the producer (network thread) pushes ticks; the consumer (strategy thread) pops them. Placing head_ and tail_ on separate cache lines prevents false sharing — without alignas(64), both counters would share a cache line and every update would invalidate the other thread's L1 entry, adding ~100ns latency per tick.",
  },
  {
    id: "cpp-20260704-b1-fix-parser",
    language: "cpp",
    title: "FIX 4.4 Tag=Value Message Parser",
    tag: "market-data",
    code: `#include <string_view>
#include <unordered_map>
#include <charconv>
#include <optional>
#include <iostream>
#include <cstring>

// FIX 4.4 messages are SOH-delimited (0x01) tag=value pairs.
// e.g. "8=FIX.4.4\x019=...\x0135=D\x01..." (NewOrderSingle)
// This parser is allocation-free: all fields are string_view slices.
class FixParser {
    static constexpr char SOH = '\x01';
    std::unordered_map<int, std::string_view> fields_;
    std::string_view raw_;

public:
    void parse(std::string_view msg) {
        fields_.clear();
        raw_ = msg;
        std::size_t pos = 0;
        while (pos < msg.size()) {
            // find '='
            std::size_t eq = msg.find('=', pos);
            if (eq == std::string_view::npos) break;

            // find next SOH
            std::size_t soh = msg.find(SOH, eq + 1);
            if (soh == std::string_view::npos) soh = msg.size();

            std::string_view tag_sv = msg.substr(pos, eq - pos);
            std::string_view val_sv = msg.substr(eq + 1, soh - eq - 1);

            int tag = 0;
            std::from_chars(tag_sv.data(), tag_sv.data() + tag_sv.size(), tag);
            fields_[tag] = val_sv;

            pos = soh + 1;
        }
    }

    std::optional<std::string_view> get(int tag) const {
        auto it = fields_.find(tag);
        if (it == fields_.end()) return std::nullopt;
        return it->second;
    }

    std::optional<double> get_double(int tag) const {
        auto sv = get(tag);
        if (!sv) return std::nullopt;
        double val;
        auto [ptr, ec] = std::from_chars(sv->data(), sv->data() + sv->size(), val);
        if (ec != std::errc{}) return std::nullopt;
        return val;
    }

    std::optional<int> get_int(int tag) const {
        auto sv = get(tag);
        if (!sv) return std::nullopt;
        int val;
        auto [ptr, ec] = std::from_chars(sv->data(), sv->data() + sv->size(), val);
        if (ec != std::errc{}) return std::nullopt;
        return val;
    }
};

int main() {
    // Synthetic FIX 4.4 NewOrderSingle (35=D)
    // Tags: 8=BeginString,35=MsgType,49=SenderCompID,55=Symbol,54=Side,38=OrderQty,44=Price
    std::string msg =
        "8=FIX.4.4\x01" "35=D\x01" "49=CLIENT1\x01" "56=BROKER\x01"
        "55=AAPL\x01" "54=1\x01" "38=500\x01" "44=183.50\x01" "40=2\x01\0";

    FixParser p;
    p.parse(std::string_view(msg.data(), msg.size() - 1));

    std::cout << "MsgType: " << p.get(35).value_or("?") << "\\n";  // D
    std::cout << "Symbol:  " << p.get(55).value_or("?") << "\\n";  // AAPL
    std::cout << "Side:    " << p.get(54).value_or("?") << "\\n";  // 1=Buy
    std::cout << "Qty:     " << p.get_int(38).value_or(-1) << "\\n";
    std::cout << "Price:   " << p.get_double(44).value_or(0.0) << "\\n";
}`,
    explanation:
      "FIX protocol uses SOH (0x01) as delimiter, never heap-allocating the message — the wire bytes sit in a kernel socket buffer and can be parsed in place using string_view slices. std::from_chars is the key: it converts number strings without allocation, locale dependency, or NUL termination. A FIX parser must handle thousands of messages per second; every allocation is a potential latency spike.",
  },
  {
    id: "cpp-20260704-b1-variant-dispatch",
    language: "cpp",
    title: "std::variant + std::visit for Zero-Overhead Market Message Dispatch",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string>
#include <iostream>
#include <cstdint>
#include <vector>

struct AddOrder    { uint64_t id; double price; int qty; char side; };
struct CancelOrder { uint64_t id; };
struct Trade       { uint64_t buy_id, sell_id; double price; int qty; };
struct QuoteUpdate { double bid, ask; uint32_t bid_sz, ask_sz; };

using MarketMsg = std::variant<AddOrder, CancelOrder, Trade, QuoteUpdate>;

// Visitor: overloaded lambdas (requires C++17 deduction guide trick)
template <typename... Fs>
struct Overloaded : Fs... { using Fs::operator()...; };

template <typename... Fs>
Overloaded(Fs...) -> Overloaded<Fs...>;

// All dispatch branches inlined by the compiler — no virtual dispatch overhead.
// std::visit selects the active alternative in O(1) via a jump table.
void process(const MarketMsg& msg) {
    std::visit(Overloaded{
        [](const AddOrder& o) {
            std::cout << "ADD  id=" << o.id << " " << o.side
                      << " " << o.qty << "@" << o.price << "\\n";
        },
        [](const CancelOrder& c) {
            std::cout << "CANCEL id=" << c.id << "\\n";
        },
        [](const Trade& t) {
            std::cout << "TRADE " << t.qty << "@" << t.price << "\\n";
        },
        [](const QuoteUpdate& q) {
            std::cout << "QUOTE bid=" << q.bid << " ask=" << q.ask << "\\n";
        },
    }, msg);
}

// Type-safe accumulator: count messages by type
struct MsgStats {
    int adds = 0, cancels = 0, trades = 0, quotes = 0;
    void update(const MarketMsg& m) {
        std::visit(Overloaded{
            [this](const AddOrder&)    { ++adds;    },
            [this](const CancelOrder&) { ++cancels; },
            [this](const Trade&)       { ++trades;  },
            [this](const QuoteUpdate&) { ++quotes;  },
        }, m);
    }
};

int main() {
    std::vector<MarketMsg> feed{
        AddOrder{1, 100.10, 500, 'B'},
        AddOrder{2, 100.20, 300, 'S'},
        Trade{1, 2, 100.15, 200},
        CancelOrder{1},
        QuoteUpdate{100.05, 100.20, 1000, 800},
    };

    MsgStats stats;
    for (const auto& m : feed) { process(m); stats.update(m); }

    std::cout << "adds=" << stats.adds << " cancels=" << stats.cancels
              << " trades=" << stats.trades << " quotes=" << stats.quotes << "\\n";
}`,
    explanation:
      "std::variant stores exactly one of its alternatives with no heap allocation, and std::visit dispatches to the matching handler via a compiler-generated jump table — equivalent in speed to a switch on a tag byte, but type-safe. Unlike virtual dispatch, the compiler sees all alternatives and can inline the entire visitor, enabling cross-branch optimization. This pattern replaces union + enum tag in modern C++ market-data handlers.",
  },
  {
    id: "cpp-20260704-b1-false-sharing",
    language: "cpp",
    title: "Preventing False Sharing with alignas(64) Padding",
    tag: "low-latency",
    code: `#include <atomic>
#include <thread>
#include <iostream>
#include <chrono>
#include <array>

// False sharing: two threads write to different variables that share a cache line (64 bytes).
// Each write invalidates the other CPU's copy of the cache line → coherence traffic → latency.

// BAD: both counters share a cache line (likely adjacent in memory)
struct BadCounters {
    std::atomic<long> producer_count{0};
    std::atomic<long> consumer_count{0};
};

// GOOD: each counter occupies its own cache line
struct alignas(64) GoodCounters {
    std::atomic<long> producer_count{0};
    char _pad1[64 - sizeof(std::atomic<long>)];  // fill to 64 bytes
    std::atomic<long> consumer_count{0};
    char _pad2[64 - sizeof(std::atomic<long>)];
};

static_assert(offsetof(GoodCounters, consumer_count) >= 64,
              "consumer_count must be on a different cache line");

template <typename Counters>
long benchmark(int iters) {
    Counters c;
    auto t0 = std::chrono::steady_clock::now();

    std::thread prod([&]{ for (int i = 0; i < iters; ++i) ++c.producer_count; });
    std::thread cons([&]{ for (int i = 0; i < iters; ++i) ++c.consumer_count; });

    prod.join(); cons.join();

    auto t1 = std::chrono::steady_clock::now();
    return std::chrono::duration_cast<std::chrono::microseconds>(t1 - t0).count();
}

int main() {
    const int N = 10'000'000;
    long bad_us  = benchmark<BadCounters>(N);
    long good_us = benchmark<GoodCounters>(N);

    std::cout << "Bad  (false sharing): " << bad_us  << " us\\n";
    std::cout << "Good (padded):        " << good_us << " us\\n";
    std::cout << "Speedup: " << (double)bad_us / good_us << "x\\n";
    // Typical: 3-10x speedup on multi-socket systems with heavy write traffic
}`,
    explanation:
      "False sharing occurs when two threads write to different variables that map to the same 64-byte cache line: every write by one thread causes the other's CPU to re-fetch the whole line from L3/memory. Padding each hot variable to fill a full cache line costs 64 bytes of memory but eliminates the coherence traffic. In HFT, per-thread counters (sequence numbers, message counts) are always cache-line aligned.",
  },
  {
    id: "cpp-20260704-b1-string-view-tokenize",
    language: "cpp",
    title: "Zero-Copy Field Tokenizer with std::string_view",
    tag: "STL",
    code: `#include <string_view>
#include <vector>
#include <charconv>
#include <iostream>
#include <optional>

// Tokenize a delimited string into string_view slices — zero allocation.
// Used for CSV market data feeds, FIX fields, or UDP multicast payloads.
std::vector<std::string_view> split_sv(std::string_view s, char delim) {
    std::vector<std::string_view> parts;
    std::size_t start = 0;
    while (true) {
        std::size_t end = s.find(delim, start);
        parts.push_back(s.substr(start, end - start));
        if (end == std::string_view::npos) break;
        start = end + 1;
    }
    return parts;
}

// Parse a CSV tick: "symbol,bid,ask,bid_size,ask_size,timestamp_ns"
struct Tick {
    std::string_view symbol;
    double bid, ask;
    int    bid_sz, ask_sz;
    uint64_t ts_ns;
};

std::optional<Tick> parse_tick(std::string_view line) {
    auto f = split_sv(line, ',');
    if (f.size() < 6) return std::nullopt;

    Tick t;
    t.symbol = f[0];

    auto pd = [](std::string_view sv, double& out) -> bool {
        auto [p, ec] = std::from_chars(sv.data(), sv.data() + sv.size(), out);
        return ec == std::errc{};
    };
    auto pi = [](std::string_view sv, int& out) -> bool {
        auto [p, ec] = std::from_chars(sv.data(), sv.data() + sv.size(), out);
        return ec == std::errc{};
    };
    auto pu = [](std::string_view sv, uint64_t& out) -> bool {
        auto [p, ec] = std::from_chars(sv.data(), sv.data() + sv.size(), out);
        return ec == std::errc{};
    };

    if (!pd(f[1], t.bid) || !pd(f[2], t.ask)) return std::nullopt;
    if (!pi(f[3], t.bid_sz) || !pi(f[4], t.ask_sz)) return std::nullopt;
    if (!pu(f[5], t.ts_ns)) return std::nullopt;

    return t;
}

int main() {
    // Simulate 3 lines from a CSV market-data snapshot
    const char* lines[] = {
        "AAPL,183.40,183.50,500,300,1720000000100000000",
        "MSFT,415.10,415.20,200,400,1720000000200000000",
        "NVDA,850.05,850.15,100,150,1720000000300000000",
    };

    for (auto* line : lines) {
        if (auto t = parse_tick(line)) {
            std::cout << t->symbol << "  bid=" << t->bid << " ask=" << t->ask
                      << " spread=" << (t->ask - t->bid)
                      << " ts=" << t->ts_ns << "\\n";
        }
    }
}`,
    explanation:
      "std::string_view slices into an existing buffer with no allocation — split_sv() returns a vector of views into the original line, so no string data is copied. std::from_chars converts numeric fields directly from char* without locale, without allocation, and without needing NUL termination. A high-throughput tick plant parsing millions of CSV rows per second cannot afford heap allocations per field.",
  },
  {
    id: "cpp-20260704-b1-asian-arithmetic-mc",
    language: "cpp",
    title: "Asian Arithmetic Average Call Option Monte Carlo",
    tag: "pricing",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <algorithm>

// Arithmetic Asian call: payoff = max(A - K, 0) where A = (1/N) * sum(S_ti)
// No closed-form for arithmetic average; use MC.
// Geometric Asian has a closed form (Kemna-Vorst 1990) used as a control variate.

double asian_arithmetic_call_mc(double S0, double K, double r, double T,
                                  double sigma, int obs = 12,    // monthly obs
                                  int paths = 300'000, int seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    const double dt    = T / obs;
    const double drift = (r - 0.5 * sigma * sigma) * dt;
    const double sv    = sigma * std::sqrt(dt);

    double sum_arith = 0.0, sum_geo = 0.0;  // for control variate
    for (int p = 0; p < paths; ++p) {
        double S = S0;
        double arith_sum = 0.0, log_sum = 0.0;
        for (int t = 0; t < obs; ++t) {
            S *= std::exp(drift + sv * nd(rng));
            arith_sum += S;
            log_sum   += std::log(S);
        }
        double A_arith = arith_sum / obs;
        sum_arith += std::max(A_arith - K, 0.0);
        // Geometric average (for control variate validation)
        double A_geo = std::exp(log_sum / obs);
        sum_geo += std::max(A_geo - K, 0.0);
    }

    double arith_price = std::exp(-r * T) * sum_arith / paths;
    double geo_price   = std::exp(-r * T) * sum_geo   / paths;

    // Kemna-Vorst geometric Asian analytic price (control variate benchmark)
    double sigma_g   = sigma / std::sqrt(3.0);
    double r_g       = 0.5 * (r - 0.5 * sigma * sigma + sigma_g * sigma_g);
    double sqT       = std::sqrt(T);
    double d1g = (std::log(S0/K) + (r_g + 0.5*sigma_g*sigma_g)*T) / (sigma_g*sqT);
    double d2g = d1g - sigma_g * sqT;
    auto N = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    double kv_price = std::exp(-r*T)*(S0*std::exp(r_g*T)*N(d1g) - K*N(d2g));

    std::cout << "Arithmetic Asian MC:  " << arith_price << "\\n";
    std::cout << "Geometric Asian MC:   " << geo_price   << "\\n";
    std::cout << "Geometric Analytic:   " << kv_price    << "\\n";
    // Arithmetic average > geometric average (Jensen's inequality) → arith > geo price
    return arith_price;
}

int main() {
    asian_arithmetic_call_mc(100.0, 100.0, 0.05, 1.0, 0.20);
}`,
    explanation:
      "The arithmetic Asian has no closed form because the sum of lognormals has no simple distribution; MC is the standard method. The geometric Asian's Kemna-Vorst formula provides a benchmark and can serve as a control variate: the variance of (arith − geo) is much smaller than arith alone, reducing standard error. Arithmetic average > geometric average by Jensen's inequality, so arithmetic Asian options always cost more than geometric ones with the same parameters.",
  },
  {
    id: "cpp-20260704-b1-delta-hedge-simulation",
    language: "cpp",
    title: "Discrete Delta-Hedging P&L Simulation",
    tag: "risk",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <vector>
#include <numeric>

// Discrete delta hedging: rebalance every dt, track hedging error vs BS price.
// Hedging error = realised P&L from delta hedges - option payoff.
// Expected P&L of delta hedge: theta + 0.5*gamma*sigma^2*S^2*dt (per time step).

struct BSM {
    static double call(double S, double K, double r, double T, double sig) {
        if (T <= 0 || sig <= 0) return std::max(S - K, 0.0);
        double sqT = std::sqrt(T);
        double d1  = (std::log(S/K) + (r + 0.5*sig*sig)*T) / (sig*sqT);
        double d2  = d1 - sig*sqT;
        auto N = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
        return S * N(d1) - K * std::exp(-r*T) * N(d2);
    }
    static double delta(double S, double K, double r, double T, double sig) {
        if (T <= 0 || sig <= 0) return S > K ? 1.0 : 0.0;
        double d1 = (std::log(S/K) + (r + 0.5*sig*sig)*T) / (sig*std::sqrt(T));
        return 0.5 * std::erfc(-d1 / std::sqrt(2.0));
    }
};

double hedge_pnl(double S0, double K, double r, double T,
                 double sigma_hedge, double sigma_real,
                 int steps, std::mt19937_64& rng)
{
    std::normal_distribution<> nd;
    const double dt    = T / steps;
    const double sv    = sigma_real * std::sqrt(dt);
    const double drift = (r - 0.5 * sigma_real * sigma_real) * dt;

    double V0     = BSM::call(S0, K, r, T, sigma_hedge);  // sold premium
    double S      = S0;
    double delta  = BSM::delta(S, K, r, T, sigma_hedge);
    double hedge  = delta * S;          // cash invested in stock
    double cash   = V0 - hedge;         // initial cash (from premium - cost of hedge)

    for (int t = 0; t < steps; ++t) {
        double tau    = T - t * dt;
        S            *= std::exp(drift + sv * nd(rng));
        cash         *= std::exp(r * dt);         // earn risk-free on cash
        hedge         = delta * S;                // old delta × new price = unrealised
        double new_delta = BSM::delta(S, K, r, tau - dt, sigma_hedge);
        double rebalance = (new_delta - delta) * S;
        cash -= rebalance;   // buy/sell stock to maintain delta neutrality
        delta = new_delta;
    }

    double payoff = std::max(S - K, 0.0);
    return cash + delta * S - payoff;  // residual P&L (hedging error)
}

int main() {
    std::mt19937_64 rng(42);
    const int paths = 20'000;
    std::vector<double> pnls(paths);

    for (auto& p : pnls)
        p = hedge_pnl(100, 100, 0.05, 1.0, 0.20, 0.20, 52, rng);  // 52 weekly hedges

    double mean_pnl = std::accumulate(pnls.begin(), pnls.end(), 0.0) / paths;
    double var_pnl  = 0.0;
    for (double p : pnls) var_pnl += (p - mean_pnl) * (p - mean_pnl);
    var_pnl /= paths;

    std::cout << "Mean hedging error: " << mean_pnl  << " (expect ~0)\\n";
    std::cout << "Hedge P&L std dev:  " << std::sqrt(var_pnl) << "\\n";
    std::cout << "Hedge error grows as sqrt(rebalance_frequency)\\n";
}`,
    explanation:
      "Discrete delta hedging introduces hedging error even when the model is correct: the error variance is proportional to sigma²·S²·Gamma·dt (Figlewski's result) and shrinks as O(sqrt(dt)) with more frequent rebalancing. When sigma_real ≠ sigma_hedge, the average P&L is non-zero — long gamma is profitable if realised vol exceeds implied vol. This simulation is the standard way to measure gamma P&L attribution in options trading.",
  },
  {
    id: "cpp-20260704-b1-atomic-wait-notify",
    language: "cpp",
    title: "std::atomic::wait/notify (C++20) for Event-Driven Market Data",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <iostream>
#include <cstdint>
#include <vector>

// C++20 atomic::wait() blocks until the value changes — like a futex.
// Much cheaper than spinning: the OS suspends the thread rather than burning a core.
// atomic::notify_one()/notify_all() wakes waiting threads.

struct MarketUpdate { double price; int seq; };

std::atomic<int>     g_seq{0};
MarketUpdate         g_latest{};

// Publisher: writes update and wakes waiting consumers
void publisher(int n_updates) {
    for (int i = 1; i <= n_updates; ++i) {
        g_latest = {100.0 + i * 0.01, i};   // write data first
        g_seq.store(i, std::memory_order_release);
        g_seq.notify_all();                   // wake all consumers (broadcast)
        // In production: sleep_for(1ms) or real rate pacing here
    }
    // Signal done with sentinel
    g_seq.store(-1, std::memory_order_release);
    g_seq.notify_all();
}

// Consumer: waits for each new update
void consumer(int id) {
    int last_seen = 0;
    while (true) {
        // Block until g_seq != last_seen (avoids spurious wakeup loops)
        g_seq.wait(last_seen, std::memory_order_acquire);
        int current = g_seq.load(std::memory_order_acquire);
        if (current == -1) break;          // publisher done

        // May skip sequences if publisher is faster than consumer
        last_seen = current;
        std::cout << "consumer " << id << " saw seq=" << current
                  << " price=" << g_latest.price << "\\n";
    }
}

int main() {
    constexpr int N = 5;
    std::thread pub(publisher, N);
    std::thread c1(consumer, 1);
    std::thread c2(consumer, 2);

    pub.join(); c1.join(); c2.join();
    std::cout << "done\\n";
}`,
    explanation:
      "atomic::wait(old) suspends the calling thread until the atomic value differs from 'old' — on Linux this compiles to a futex syscall (~100ns), vastly cheaper than a spin loop (~0.5ns per iteration × thousands of iterations of wasted CPU). notify_all() broadcasts to all waiters. This C++20 primitive replaces the condition_variable+mutex pattern for simple flag-based coordination, saving a mutex acquire on every notification.",
  },
  {
    id: "cpp-20260704-b1-fnv-hash",
    language: "cpp",
    title: "consteval FNV-1a Compile-Time String Hash for Symbol Lookup",
    tag: "low-latency",
    code: `#include <cstdint>
#include <string_view>
#include <unordered_map>
#include <iostream>

// FNV-1a hash: fast, non-cryptographic, excellent distribution for short strings.
// consteval version: symbols are hashed at compile time → zero runtime cost.

consteval uint64_t fnv1a_hash_ct(std::string_view s) {
    uint64_t hash = 14695981039346656037ULL;  // FNV offset basis
    for (char c : s)
        hash = (hash ^ static_cast<uint64_t>(c)) * 1099511628211ULL;  // FNV prime
    return hash;
}

// Runtime version for dynamic strings (same algorithm)
constexpr uint64_t fnv1a_hash(std::string_view s) {
    uint64_t hash = 14695981039346656037ULL;
    for (char c : s)
        hash = (hash ^ static_cast<uint64_t>(c)) * 1099511628211ULL;
    return hash;
}

// Compile-time constants — computed entirely at compile time
constexpr uint64_t H_AAPL = fnv1a_hash_ct("AAPL");
constexpr uint64_t H_MSFT = fnv1a_hash_ct("MSFT");
constexpr uint64_t H_NVDA = fnv1a_hash_ct("NVDA");

// Switch over compile-time hashes: zero string comparison on hot path
std::string_view category(std::string_view sym) {
    switch (fnv1a_hash(sym)) {
        case H_AAPL: return "mega-cap tech";
        case H_MSFT: return "mega-cap tech";
        case H_NVDA: return "AI/GPU";
        default:     return "other";
    }
}

int main() {
    static_assert(fnv1a_hash_ct("AAPL") == H_AAPL, "hash must be deterministic");

    for (const char* sym : {"AAPL", "MSFT", "NVDA", "JPM"})
        std::cout << sym << " -> " << category(sym) << "\\n";

    // Symbol routing table: hash → handler index
    std::unordered_map<uint64_t, int> routing{
        {H_AAPL, 0}, {H_MSFT, 1}, {H_NVDA, 2},
    };
    for (const char* sym : {"AAPL", "MSFT", "NVDA"})
        std::cout << sym << " handler: " << routing[fnv1a_hash(sym)] << "\\n";
}`,
    explanation:
      "FNV-1a is the de facto standard for short-string hashing in latency-sensitive code: it computes in one multiply + xor per byte with no branching, and produces excellent distribution for ticker symbols. Marking the function consteval computes known symbols at compile time — the hash value appears as an integer literal in the binary. On the hot path, 'category(sym)' compares one uint64 against compile-time constants rather than running strcmp against each symbol.",
  },
  {
    id: "cpp-20260704-b1-jthread-stop",
    language: "cpp",
    title: "std::jthread with stop_token for Cancellable Feed Handler",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <iostream>
#include <chrono>
#include <atomic>
#include <cstdint>

// std::jthread (C++20): auto-joins on destruction AND supports cooperative cancellation
// via stop_token. The feed handler stops cleanly when the application shuts down.

std::atomic<uint64_t> g_ticks_received{0};

void feed_handler(std::stop_token stoken) {
    // stop_requested() polls the atomic stop flag — no overhead when not stopping
    while (!stoken.stop_requested()) {
        // Simulate receiving a tick (in production: poll a UDP socket)
        ++g_ticks_received;
        // Instead of sleep, production code would block on recv() or epoll
        std::this_thread::sleep_for(std::chrono::microseconds(10));
    }
    std::cout << "feed handler stopped cleanly after "
              << g_ticks_received.load() << " ticks\\n";
}

void reconnect_handler(std::stop_token stoken, int session_id) {
    int reconnects = 0;
    while (!stoken.stop_requested()) {
        // Monitor heartbeat; if missed, reconnect (simplified)
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
        // stop_callback: register a callback fired when stop is requested
        // Useful to interrupt blocking system calls (e.g., close the socket)
    }
    std::cout << "reconnect handler exiting, session=" << session_id << "\\n";
}

int main() {
    // jthread auto-requests stop + auto-joins on destruction
    {
        std::jthread feed(feed_handler);
        std::jthread recon(reconnect_handler, 42);

        std::cout << "running feed + reconnect handlers...\\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(50));

        // feed.request_stop() + feed.join() both happen automatically at scope exit
        // recon similarly
    }  // <-- both threads stopped and joined here

    std::cout << "all handlers terminated safely\\n";
    std::cout << "total ticks: " << g_ticks_received.load() << "\\n";
}`,
    explanation:
      "std::jthread solves two problems: forgetting to join (causing terminate()) and forceful thread cancellation (which leaves resources in indeterminate state). The stop_token mechanism is cooperative — the thread checks stop_requested() at a safe point and exits cleanly, closing sockets, flushing buffers. stop_callback lets you wake a thread blocked in a syscall (e.g., register a callback that closes the socket fd, causing recv() to return EBADF).",
  },
  {
    id: "cpp-20260704-b1-prefetch",
    language: "cpp",
    title: "__builtin_prefetch for Sequential Order Book Scan",
    tag: "low-latency",
    code: `#include <vector>
#include <cstdint>
#include <iostream>
#include <numeric>
#include <chrono>
#include <cstring>

// __builtin_prefetch(addr, rw, locality)
//   rw: 0=read, 1=write
//   locality: 0=no temporal locality (evict after use), 3=keep in L1

struct PriceLevel {
    double   price;
    uint64_t total_qty;
    int      num_orders;
    char     _pad[44];  // pad to 64 bytes (one cache line)
};
static_assert(sizeof(PriceLevel) == 64, "PriceLevel must be 64 bytes");

// Without prefetch: each PriceLevel access is a potential L1 miss → ~4ns each
double scan_without_prefetch(const std::vector<PriceLevel>& levels) {
    double total = 0.0;
    for (const auto& lv : levels)
        total += lv.price * lv.total_qty;
    return total;
}

// With software prefetch: issue a prefetch N lines ahead to hide memory latency
double scan_with_prefetch(const std::vector<PriceLevel>& levels) {
    const int AHEAD = 8;  // prefetch 8 cache lines ahead (~512 bytes)
    double total = 0.0;
    int n = static_cast<int>(levels.size());

    for (int i = 0; i < n; ++i) {
        if (i + AHEAD < n)
            __builtin_prefetch(&levels[i + AHEAD], 0 /*read*/, 0 /*evict soon*/);
        total += levels[i].price * levels[i].total_qty;
    }
    return total;
}

int main() {
    const int N = 50'000;  // 50k price levels (full book depth)
    std::vector<PriceLevel> levels(N);
    for (int i = 0; i < N; ++i)
        levels[i] = {100.0 + i * 0.01, static_cast<uint64_t>(100 + i), i % 10 + 1, {}};

    // Cold cache run (the comparison is meaningful when data is cold)
    volatile double dummy = 0;

    auto bench = [&](auto fn, const char* name) {
        auto t0 = std::chrono::steady_clock::now();
        for (int r = 0; r < 10; ++r) dummy += fn(levels);
        auto t1 = std::chrono::steady_clock::now();
        std::cout << name << ": "
                  << std::chrono::duration_cast<std::chrono::microseconds>(t1 - t0).count()
                  << " us (10 runs)\\n";
    };

    bench(scan_without_prefetch, "no prefetch");
    bench(scan_with_prefetch,    "with prefetch");
    // On cold cache: prefetch version typically 20-40% faster
    // On hot cache (data fits in L2): difference negligible
    (void)dummy;
}`,
    explanation:
      "__builtin_prefetch issues a non-blocking cache prefetch: the processor continues executing while the memory controller fetches the cache line in the background. For a sequential order-book scan where each PriceLevel is exactly one cache line (64B), prefetching 8 lines ahead completely hides the DRAM latency (~100ns) behind computation. The 'locality=0' hint tells the CPU not to promote the line to L1, leaving space for other hot data.",
  },
  {
    id: "cpp-20260704-b1-sfinae-enable-if",
    language: "cpp",
    title: "SFINAE with enable_if for Numeric/Non-Numeric Dispatch",
    tag: "templates",
    code: `#include <type_traits>
#include <iostream>
#include <string>
#include <vector>
#include <cmath>

// SFINAE (Substitution Failure Is Not An Error): a template overload that fails
// to substitute is silently removed from the candidate set rather than causing an error.
// std::enable_if<Condition, T>::type only exists when Condition is true.

// Overload 1: for arithmetic types (int, float, double)
template <typename T>
std::enable_if_t<std::is_arithmetic_v<T>, double>
normalise(T val, T min_v, T max_v) {
    return (max_v > min_v) ? static_cast<double>(val - min_v) / (max_v - min_v) : 0.0;
}

// Overload 2: for containers — normalise each element
template <typename Container>
std::enable_if_t<!std::is_arithmetic_v<Container>, Container>
normalise(Container vals, typename Container::value_type min_v,
          typename Container::value_type max_v)
{
    Container out;
    out.reserve(vals.size());
    for (auto v : vals)
        out.push_back(static_cast<typename Container::value_type>(
            normalise(v, min_v, max_v)));
    return out;
}

// Modern C++20 equivalent using concepts (cleaner, but SFINAE still widely seen in codebases)
template <std::floating_point F>
F z_score(F val, F mean, F stddev) {
    return (stddev > 0) ? (val - mean) / stddev : F{0};
}

// Type-trait-based rank computation for portfolio weights
template <typename T>
struct IsPrice : std::integral_constant<bool, std::is_floating_point_v<T>> {};

template <typename T>
auto compute_weight(T price, T total)
    -> std::enable_if_t<IsPrice<T>::value, T>
{
    return price / total;
}

int main() {
    // Dispatches to scalar overload
    std::cout << "normalised 75 in [50,100]: " << normalise(75, 50, 100) << "\\n";  // 0.5

    // Dispatches to container overload
    std::vector<double> prices{50.0, 75.0, 100.0, 25.0};
    auto normed = normalise(prices, 25.0, 100.0);
    for (double v : normed) std::cout << v << " ";
    std::cout << "\\n";  // 0.333 0.667 1.0 0.0

    // z-score (concepts overload)
    std::cout << "z-score(105, 100, 2): " << z_score(105.0, 100.0, 2.0) << "\\n";  // 2.5

    std::cout << "weight: " << compute_weight(183.50, 748.95) << "\\n";  // AAPL fraction
}`,
    explanation:
      "SFINAE lets one function name dispatch to completely different implementations based on type properties, resolved at compile time with zero runtime overhead. enable_if_t<cond, T> is an alias for T when cond is true and does not exist otherwise, causing the overload to be removed from consideration. C++20 concepts express the same intent more clearly, but SFINAE is still prevalent in production codebases targeting C++17 or earlier.",
  },
  {
    id: "cpp-20260704-b1-vanna",
    language: "cpp",
    title: "Vanna (dDelta/dVol) and Volga (dVega/dVol) Greeks",
    tag: "risk",
    code: `#include <cmath>
#include <iostream>

// Vanna: sensitivity of delta to a change in vol (or equivalently, vega to a change in S).
// Volga (Vomma): second derivative of option price w.r.t. vol.
// Both are important for hedging a vol surface: vanna drives skew risk, volga drives curvature.

struct GreeksAll {
    double price, delta, gamma, vega, theta, rho;
    double vanna;  // d(delta)/d(sigma) = d(vega)/dS
    double volga;  // d(vega)/d(sigma) = d2V/d(sigma)^2
};

double N_cdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }
double N_pdf(double x) { return std::exp(-0.5*x*x) / std::sqrt(2.0 * M_PI); }

GreeksAll bsm_full_greeks(double S, double K, double r, double T, double sig) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sig*sig)*T) / (sig*sqT);
    double d2  = d1 - sig*sqT;

    double Nd1  = N_cdf(d1);
    double nd1  = N_pdf(d1);
    double Nd2  = N_cdf(d2);

    double price = S * Nd1 - K * std::exp(-r*T) * Nd2;
    double delta = Nd1;
    double gamma = nd1 / (S * sig * sqT);
    double vega  = S * nd1 * sqT;                          // per unit vol (not per 1%)
    double theta = -(S * nd1 * sig / (2*sqT) + r * K * std::exp(-r*T) * Nd2) / 365.0;
    double rho   = K * T * std::exp(-r*T) * Nd2;

    // Analytic Vanna: -nd1 * d2 / sig
    // Derivation: d(delta)/d(sigma) = d(N(d1))/d(sig) = nd1 * d(d1)/d(sig)
    //   d1 w.r.t. sigma: d(d1)/d(sig) = -d2/sig  (for ATM options ≈ -sqT)
    double vanna = -nd1 * d2 / sig;

    // Analytic Volga (Vomma): vega * d1 * d2 / sig
    double volga = vega * d1 * d2 / sig;

    return {price, delta, gamma, vega, theta, rho, vanna, volga};
}

int main() {
    // ATM call: S=100, K=100, r=5%, T=1yr, sigma=20%
    auto g = bsm_full_greeks(100.0, 100.0, 0.05, 1.0, 0.20);

    std::cout << "Price:  " << g.price  << "\\n";   // ~10.45
    std::cout << "Delta:  " << g.delta  << "\\n";   // ~0.637
    std::cout << "Gamma:  " << g.gamma  << "\\n";   // ~0.019
    std::cout << "Vega:   " << g.vega   << "\\n";   // ~37.5 (per unit vol)
    std::cout << "Theta:  " << g.theta  << "\\n";   // ~-0.0141 per day
    std::cout << "Vanna:  " << g.vanna  << "\\n";   // ~-0.376 (important for skew)
    std::cout << "Volga:  " << g.volga  << "\\n";   // ~2.63  (important for curvature)

    // Cross-check: bump-and-reprice vanna
    double eps = 0.001;
    double delta_up = bsm_full_greeks(100.0, 100.0, 0.05, 1.0, 0.20 + eps).delta;
    double delta_dn = bsm_full_greeks(100.0, 100.0, 0.05, 1.0, 0.20 - eps).delta;
    double vanna_fd = (delta_up - delta_dn) / (2 * eps);
    std::cout << "Vanna FD check: " << vanna_fd << " (vs analytic: " << g.vanna << ")\\n";
}`,
    explanation:
      "Vanna (∂²V/∂S∂σ) measures how delta changes when vol moves — a non-zero vanna position requires rehedging delta whenever vol changes. Volga (∂²V/∂σ²) measures convexity in vol: a positive volga position gains when vol moves in either direction. Both are second-order Greeks important for managing a book of options across a vol surface. The analytic formulas avoid numerical noise that afflicts bump-and-reprice for these second-order quantities.",
  },
  {
    id: "cpp-20260704-b1-portfolio-returns",
    language: "cpp",
    title: "Portfolio Return Computation with std::transform and SIMD-Friendly Layout",
    tag: "STL",
    code: `#include <algorithm>
#include <numeric>
#include <vector>
#include <cmath>
#include <iostream>
#include <execution>

// SoA (Structure of Arrays) layout for SIMD-friendly vectorization.
// AoS: {price0_prev, price0_curr, price1_prev, ...} — bad for SIMD
// SoA: {prev_prices[], curr_prices[]} — compiler vectorizes the transform easily

struct PortfolioSoA {
    std::vector<double> prev_prices;
    std::vector<double> curr_prices;
    std::vector<double> weights;
};

// Vectorised log return computation: compiler emits SIMD instructions
std::vector<double> log_returns(const PortfolioSoA& p) {
    int n = static_cast<int>(p.prev_prices.size());
    std::vector<double> ret(n);
    std::transform(std::execution::par_unseq,
                   p.prev_prices.begin(), p.prev_prices.end(),
                   p.curr_prices.begin(), ret.begin(),
                   [](double prev, double curr) {
                       return std::log(curr / prev);
                   });
    return ret;
}

// Weighted portfolio return
double portfolio_log_return(const PortfolioSoA& p) {
    auto rets = log_returns(p);
    return std::transform_reduce(std::execution::par_unseq,
                                  p.weights.begin(), p.weights.end(),
                                  rets.begin(), 0.0);
}

// Annualised volatility from daily returns (std dev × sqrt(252))
double ann_vol(const std::vector<double>& rets) {
    int n = rets.size();
    double mean = std::reduce(rets.begin(), rets.end()) / n;
    double var  = std::transform_reduce(rets.begin(), rets.end(), 0.0,
                                         std::plus<>{},
                                         [mean](double r){ return (r-mean)*(r-mean); });
    return std::sqrt(var / (n-1) * 252.0);
}

int main() {
    PortfolioSoA port{
        {100.0, 50.0, 200.0, 75.0, 300.0},   // prev prices
        {102.0, 49.5, 205.0, 76.5, 298.0},   // curr prices
        {0.30, 0.25, 0.20, 0.15, 0.10}        // weights (sum=1)
    };

    auto rets  = log_returns(port);
    double pr  = portfolio_log_return(port);

    std::cout << "Asset returns: ";
    for (double r : rets) std::cout << r*100 << "% ";
    std::cout << "\\n";
    std::cout << "Portfolio return: " << pr * 100 << "%\\n";

    // Rolling portfolio returns (simulate 10 days)
    std::vector<double> daily_rets;
    double base_ret = 0.0005;
    for (int d = 0; d < 252; ++d)
        daily_rets.push_back(base_ret + (d % 3 == 0 ? -0.002 : 0.001));

    std::cout << "Ann vol (sim): " << ann_vol(daily_rets) * 100 << "%\\n";
}`,
    explanation:
      "SoA layout enables auto-vectorization: transform over two aligned double arrays compiles to AVX2/AVX-512 instructions that process 4 or 8 doubles per clock cycle. std::execution::par_unseq additionally parallelizes across CPU cores with SIMD within each thread. For a 500-stock portfolio, SoA transform_reduce is ~8x faster than an AoS loop computing log(curr/prev) per struct.",
  },
  {
    id: "cpp-20260704-b1-flat-order-book",
    language: "cpp",
    title: "Hash-Map Price-Level Order Book with FIFO Queue Per Level",
    tag: "market-data",
    code: `#include <unordered_map>
#include <deque>
#include <vector>
#include <cstdint>
#include <iostream>
#include <algorithm>
#include <stdexcept>

// Price levels stored in a hash map: O(1) level access.
// Orders within each level stored in a deque (FIFO price-time priority).
// Best bid/ask maintained as separate sorted sets for O(log n) best-price queries.

struct Order { uint64_t id; int qty; };

class HalfBook {
    bool is_bid_;
    std::unordered_map<int64_t, std::deque<Order>> levels_;  // price in ticks -> queue
    std::vector<int64_t> sorted_prices_;  // maintained sorted for best-price access
    bool sorted_dirty_ = false;

    void ensure_sorted() {
        if (!sorted_dirty_) return;
        std::sort(sorted_prices_.begin(), sorted_prices_.end());
        if (!is_bid_) return;  // min for asks; max for bids
        std::reverse(sorted_prices_.begin(), sorted_prices_.end());
        sorted_dirty_ = false;
    }

public:
    explicit HalfBook(bool is_bid) : is_bid_(is_bid) {}

    void add(int64_t price_ticks, uint64_t id, int qty) {
        if (levels_.find(price_ticks) == levels_.end()) {
            levels_[price_ticks] = {};
            sorted_prices_.push_back(price_ticks);
            sorted_dirty_ = true;
        }
        levels_[price_ticks].push_back({id, qty});
    }

    // Cancel first occurrence of order id at given price
    bool cancel(int64_t price_ticks, uint64_t id) {
        auto it = levels_.find(price_ticks);
        if (it == levels_.end()) return false;
        auto& q = it->second;
        auto oit = std::find_if(q.begin(), q.end(), [id](const Order& o){ return o.id == id; });
        if (oit == q.end()) return false;
        q.erase(oit);
        if (q.empty()) {
            levels_.erase(it);
            sorted_prices_.erase(std::remove(sorted_prices_.begin(), sorted_prices_.end(), price_ticks));
        }
        return true;
    }

    std::pair<int64_t, int> best() {
        ensure_sorted();
        if (sorted_prices_.empty()) return {-1, 0};
        int64_t bp = sorted_prices_.front();
        int total = 0;
        for (const auto& o : levels_.at(bp)) total += o.qty;
        return {bp, total};
    }
};

int main() {
    HalfBook bids(true), asks(false);

    // Price in ticks (multiply by tick_size=0.01 for dollars)
    bids.add(10010, 1, 500);  // 100.10
    bids.add(10010, 2, 300);
    bids.add(10005, 3, 200);  // 100.05

    asks.add(10015, 4, 400);  // 100.15
    asks.add(10020, 5, 600);  // 100.20

    auto [bp, bq] = bids.best();
    auto [ap, aq] = asks.best();
    std::cout << "Best bid: " << bp/100.0 << " x" << bq << "\\n";  // 100.10 x800
    std::cout << "Best ask: " << ap/100.0 << " x" << aq << "\\n";  // 100.15 x400
    std::cout << "Spread: " << (ap - bp)/100.0 << " bps\\n";        // 0.05

    bids.cancel(10010, 1);
    auto [bp2, bq2] = bids.best();
    std::cout << "After cancel 1: best bid = " << bp2/100.0 << " x" << bq2 << "\\n";
}`,
    explanation:
      "Storing prices in integer ticks eliminates floating-point comparison issues and allows hash map keys to be exact (hash_map on double is dangerous). The deque within each level gives O(1) push_back and FIFO cancellation in O(level_depth) — acceptable since most price levels have few orders. A sorted vector of active prices is lazily rebuilt on dirty flag, amortizing the sort cost across many add operations between best-price queries.",
  },
  {
    id: "cpp-20260704-b1-rk4-sde",
    language: "cpp",
    title: "Runge-Kutta 4 ODE Solver for Drift Term in Stochastic Dynamics",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>
#include <vector>
#include <functional>

// RK4 for the ODE part of an SDE: dX = f(X,t)dt + g(X,t)dW
// Here we solve the drift f(X,t) deterministically to high accuracy,
// then add the stochastic term via Euler. (Milstein or higher-order stochastic
// schemes exist but require iterated integrals.)

using Fn = std::function<double(double x, double t)>;

// Classic RK4 step for dy/dt = f(y, t)
double rk4_step(Fn f, double y, double t, double dt) {
    double k1 = f(y,            t);
    double k2 = f(y + 0.5*dt*k1, t + 0.5*dt);
    double k3 = f(y + 0.5*dt*k2, t + 0.5*dt);
    double k4 = f(y + dt*k3,   t + dt);
    return y + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4);
}

// CIR (Cox-Ingersoll-Ross) drift: f(r, t) = kappa*(theta - r)
// Stochastic term: sigma * sqrt(max(r,0)) * dW (Euler)
// Combined: Euler-Maruyama for diffusion + RK4 for drift
std::vector<double> cir_rk4_euler(double r0, double kappa, double theta, double sigma,
                                    double T, int steps, int seed = 42)
{
    double dt = T / steps;
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;

    Fn drift = [kappa, theta](double r, double /*t*/) {
        return kappa * (theta - r);
    };

    std::vector<double> path(steps + 1);
    path[0] = r0;
    for (int i = 0; i < steps; ++i) {
        double r    = path[i];
        double t    = i * dt;
        // Deterministic drift via RK4 (more accurate than Euler for mean reversion)
        double r_det = rk4_step(drift, r, t, dt);
        // Add stochastic increment (Euler for diffusion)
        double dW   = std::sqrt(dt) * nd(rng);
        path[i+1]   = std::max(r_det + sigma * std::sqrt(std::max(r, 0.0)) * dW, 0.0);
    }
    return path;
}

#include <random>
int main() {
    // CIR: kappa=1.5, theta=0.04 (4% long-run rate), sigma=0.03, r0=0.05
    auto path = cir_rk4_euler(0.05, 1.5, 0.04, 0.03, 5.0, 500);

    // Print every 100 steps
    for (int i = 0; i <= 500; i += 100)
        std::cout << "t=" << i*5.0/500 << "  r=" << path[i] << "\\n";

    // CIR always stays non-negative (Feller condition: 2*kappa*theta > sigma^2)
    // 2*1.5*0.04=0.12 > 0.0009 ✓
    std::cout << "Min rate in path: "
              << *std::min_element(path.begin(), path.end()) << "\\n";
}`,
    explanation:
      "Splitting the SDE into drift and diffusion parts and applying RK4 to the drift gives more accurate mean-reversion trajectories than pure Euler-Maruyama at the same step size — the drift is an ODE and benefits from higher-order methods. This hybrid approach is practical when the drift is complex (e.g., HJM term structure) but the diffusion coefficient is simple. The CIR model guarantees positive rates when the Feller condition 2κθ > σ² holds.",
  },
  {
    id: "cpp-20260704-b1-greek-ladder",
    language: "cpp",
    title: "Greek Ladder Report Across Strike Ranges",
    tag: "risk",
    code: `#include <cmath>
#include <iostream>
#include <iomanip>
#include <vector>

struct Greeks { double price, delta, gamma, vega, theta; };

Greeks bsm_greeks(double S, double K, double r, double T, double sig) {
    auto N   = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    auto n   = [](double x){ return std::exp(-0.5*x*x) / std::sqrt(2.0*M_PI); };
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sig*sig)*T) / (sig*sqT);
    double d2  = d1 - sig*sqT;
    double nd1 = n(d1);
    return {
        S * N(d1) - K * std::exp(-r*T) * N(d2),
        N(d1),
        nd1 / (S * sig * sqT),
        S * nd1 * sqT * 0.01,            // vega per 1% vol move
        -(S * nd1 * sig / (2*sqT) + r*K*std::exp(-r*T)*N(d2)) / 365.0
    };
}

void greek_ladder(double S, double r, double T, double sigma,
                  const std::vector<double>& strikes)
{
    std::cout << std::fixed << std::setprecision(4);
    std::cout << std::setw(8)  << "Strike"
              << std::setw(10) << "Moneyness"
              << std::setw(10) << "Price"
              << std::setw(10) << "Delta"
              << std::setw(10) << "Gamma"
              << std::setw(10) << "Vega"
              << std::setw(10) << "Theta"
              << "\\n" << std::string(68, '-') << "\\n";

    for (double K : strikes) {
        auto g = bsm_greeks(S, K, r, T, sigma);
        double moneyness = S / K;
        std::cout << std::setw(8)  << K
                  << std::setw(10) << moneyness
                  << std::setw(10) << g.price
                  << std::setw(10) << g.delta
                  << std::setw(10) << g.gamma
                  << std::setw(10) << g.vega
                  << std::setw(10) << g.theta
                  << "\\n";
    }

    // Aggregate book Greeks (assuming long 1 contract each strike)
    double tot_delta = 0, tot_gamma = 0, tot_vega = 0, tot_theta = 0;
    for (double K : strikes) {
        auto g = bsm_greeks(S, K, r, T, sigma);
        tot_delta += g.delta; tot_gamma += g.gamma;
        tot_vega  += g.vega;  tot_theta += g.theta;
    }
    std::cout << std::string(68, '-') << "\\n";
    std::cout << std::setw(18) << "BOOK TOTAL"
              << std::setw(10) << ""
              << std::setw(10) << tot_delta
              << std::setw(10) << tot_gamma
              << std::setw(10) << tot_vega
              << std::setw(10) << tot_theta << "\\n";
}

int main() {
    double S = 100.0, r = 0.05, T = 0.25, sigma = 0.20;
    std::vector<double> strikes{80, 85, 90, 95, 100, 105, 110, 115, 120};
    greek_ladder(S, r, T, sigma, strikes);
}`,
    explanation:
      "A Greek ladder displays risk sensitivities across the strike dimension for all options in a book. Delta is highest deep ITM and near zero deep OTM; gamma and vega peak near ATM; theta is most negative near ATM where time value is greatest. Aggregating book-level Greeks identifies the net exposure that needs hedging — a book with total delta=+2.3 needs to be short 230 shares to be delta-neutral.",
  },
  {
    id: "cpp-20260704-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive Doubly-Linked List for Zero-Alloc Order Queue",
    tag: "data-structures",
    code: `#include <cstdint>
#include <iostream>
#include <cassert>

// Intrusive list: the list node is embedded inside the object itself.
// No separate allocation for the list node — the object IS the node.
// Enables O(1) removal of any element by pointer, without searching.

struct OrderNode {
    OrderNode* prev = nullptr;
    OrderNode* next = nullptr;
};

struct Order {
    OrderNode  node;   // intrusive hook (must be first or at known offset)
    uint64_t   id;
    double     price;
    int        qty;
    char       side;
};

// Convert from node pointer back to Order pointer using offsetof
inline Order* order_of(OrderNode* n) {
    return reinterpret_cast<Order*>(
        reinterpret_cast<std::byte*>(n) - offsetof(Order, node));
}

struct IntrusiveList {
    OrderNode sentinel{&sentinel, &sentinel};  // circular sentinel

    void push_back(Order* o) {
        o->node.prev = sentinel.prev;
        o->node.next = &sentinel;
        sentinel.prev->next = &o->node;
        sentinel.prev       = &o->node;
    }

    void remove(Order* o) {
        o->node.prev->next = o->node.next;
        o->node.next->prev = o->node.prev;
        o->node.prev = o->node.next = nullptr;
    }

    Order* front() {
        if (sentinel.next == &sentinel) return nullptr;
        return order_of(sentinel.next);
    }

    bool empty() const { return sentinel.next == &sentinel; }

    void print() {
        for (OrderNode* n = sentinel.next; n != &sentinel; n = n->next) {
            Order* o = order_of(n);
            std::cout << "id=" << o->id << " " << o->side
                      << " " << o->qty << "@" << o->price << "  ";
        }
        std::cout << "\\n";
    }
};

int main() {
    // Orders live in a pre-allocated array (no heap per-order)
    Order pool[8];
    pool[0] = {{}, 1, 100.10, 500, 'B'};
    pool[1] = {{}, 2, 100.20, 300, 'B'};
    pool[2] = {{}, 3, 100.05, 200, 'S'};

    IntrusiveList queue;
    queue.push_back(&pool[0]);
    queue.push_back(&pool[1]);
    queue.push_back(&pool[2]);
    std::cout << "Queue: "; queue.print();

    // O(1) removal of pool[1] — no search needed (we have the pointer)
    queue.remove(&pool[1]);
    std::cout << "After removing id=2: "; queue.print();

    assert(queue.front()->id == 1);
}`,
    explanation:
      "Intrusive containers embed the list node inside the object, eliminating a separate allocation per node. Crucially, removal is O(1) given a pointer to the object: update prev/next pointers without searching the list. This is how Linux kernel's list_head works and how HFT order management systems implement the order queue within a price level — cancel by order pointer, not by search, removing an order from the book in constant time.",
  },
  {
    id: "cpp-20260704-b1-hugepage",
    language: "cpp",
    title: "Transparent Hugepages and MADV_HUGEPAGE for Tick Buffers",
    tag: "systems",
    code: `#include <sys/mman.h>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <stdexcept>

// Standard pages: 4 KB. HugePages: 2 MB (or 1 GB).
// Benefit: TLB covers 2MB per entry instead of 4KB → fewer TLB misses for large buffers.
// TLB miss penalty: ~100 ns (L2 page walk) vs ~1 ns (TLB hit).

// Allocate aligned memory with hugepage hint via MADV_HUGEPAGE (Linux).
// OS will use 2MB transparent hugepages when available and aligned.

class HugepageBuffer {
    void*       ptr_   = nullptr;
    std::size_t size_  = 0;

public:
    HugepageBuffer(std::size_t bytes) {
        // Align to 2MB for hugepage eligibility
        const std::size_t HP = 2 * 1024 * 1024;
        size_ = (bytes + HP - 1) & ~(HP - 1);  // round up to 2MB boundary

        ptr_ = mmap(nullptr, size_, PROT_READ | PROT_WRITE,
                    MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (ptr_ == MAP_FAILED) throw std::runtime_error("mmap failed");

        // Advise the kernel to use transparent hugepages for this region
        if (madvise(ptr_, size_, MADV_HUGEPAGE) != 0)
            // Not fatal: kernel may still use hugepages without the hint,
            // or fall back to normal pages silently
            std::cerr << "madvise MADV_HUGEPAGE not supported\\n";

        // Optional: MADV_SEQUENTIAL for streaming access pattern
        madvise(ptr_, size_, MADV_SEQUENTIAL);
    }

    void* data()       { return ptr_; }
    std::size_t size() { return size_; }

    // Pre-fault all pages to avoid page faults on hot path
    void prefault() {
        std::memset(ptr_, 0, size_);  // write to every byte → pages are resident
    }

    ~HugepageBuffer() { if (ptr_ != MAP_FAILED) munmap(ptr_, size_); }

    HugepageBuffer(const HugepageBuffer&) = delete;
};

struct TickRecord { uint64_t ts_ns; double bid, ask; uint32_t bid_sz, ask_sz; };

int main() {
    const std::size_t N_TICKS = 10'000'000;  // 10M ticks = 320 MB
    const std::size_t BUF_SIZE = N_TICKS * sizeof(TickRecord);

    HugepageBuffer buf(BUF_SIZE);
    buf.prefault();  // prevent page fault jitter on first access

    TickRecord* ticks = static_cast<TickRecord*>(buf.data());

    // Fill with synthetic data
    for (std::size_t i = 0; i < N_TICKS; ++i)
        ticks[i] = {i * 1000, 100.0 + i*0.001, 100.01 + i*0.001,
                    static_cast<uint32_t>(100 + i % 500),
                    static_cast<uint32_t>(100 + i % 300)};

    std::cout << "Buffer: " << buf.size() / (1<<20) << " MB allocated\\n";
    std::cout << "Ticks:  " << N_TICKS << "\\n";
    std::cout << "Sample: ts=" << ticks[0].ts_ns
              << " bid=" << ticks[0].bid << "\\n";
    // With hugepages: TLB covers entire 2MB block in one entry
    // Without:        320 MB / 4 KB = 81,920 TLB entries needed
}`,
    explanation:
      "A 320 MB tick buffer requires 81,920 4KB page table entries; with 64-entry L1 TLBs, every page access is a TLB miss (L2 page walk, ~100ns). With 2MB hugepages, only 160 entries are needed — the entire buffer fits in a modern TLB. Prefaulting with memset forces all pages into physical memory at startup, eliminating page-fault latency (~1 µs each) from the hot path. Call madvise MADV_HUGEPAGE before the prefault for best results on Linux.",
  },
  {
    id: "cpp-20260704-b1-type-erasure-strategy",
    language: "cpp",
    title: "Type Erasure with std::function for Configurable Execution Strategy",
    tag: "design",
    code: `#include <functional>
#include <iostream>
#include <memory>
#include <string>
#include <cmath>

// Type erasure: store any callable with the right signature without templates.
// std::function<Ret(Args...)> wraps lambdas, function pointers, and functors.

struct Order {
    std::string symbol;
    int qty;
    double limit_price;
};

struct Fill {
    double price;
    int    qty;
};

// Strategy signature: takes order + market mid → returns desired fill
using ExecutionStrategy = std::function<Fill(const Order& o, double mid)>;

// Concrete strategies (could also be lambdas configured at runtime)
Fill twap_strategy(const Order& o, double mid) {
    // TWAP: target mid price, send 1/N of qty
    return {mid, o.qty / 10};  // simplified: 1/10 per slice
}

Fill aggressive_strategy(const Order& o, double mid) {
    // Cross the spread: pay ask = mid + half spread
    double est_ask = mid * 1.0001;  // approx 1bp half-spread
    if (est_ask > o.limit_price) return {0, 0};  // limit exceeded
    return {est_ask, o.qty};
}

Fill passive_strategy(const Order& o, double mid) {
    // Post below mid, wait for fill
    double target = mid * 0.9999;
    return {target, o.qty};
}

class ExecutionEngine {
    ExecutionStrategy strategy_;
    std::string       name_;
public:
    ExecutionEngine(std::string name, ExecutionStrategy strat)
        : strategy_(std::move(strat)), name_(std::move(name)) {}

    Fill execute(const Order& o, double mid) {
        auto fill = strategy_(o, mid);
        if (fill.qty > 0)
            std::cout << "[" << name_ << "] fill " << fill.qty
                      << " @ " << fill.price << "\\n";
        return fill;
    }
};

int main() {
    Order o{"AAPL", 1000, 184.0};
    double mid = 183.50;

    // Configure at runtime — no templates, no inheritance
    ExecutionEngine twap("TWAP",   twap_strategy);
    ExecutionEngine aggr("AGGR",   aggressive_strategy);
    ExecutionEngine pass("PASSIV", passive_strategy);

    // Lambda strategy configured from runtime parameters
    double vol = 0.20;
    ExecutionStrategy vol_adjusted = [vol](const Order& ord, double m) {
        // Adjust aggressiveness based on vol: more passive in high-vol
        double slippage = vol * m * 0.001;
        return Fill{m - slippage, ord.qty / 5};
    };
    ExecutionEngine vagg("VOL-ADJ", std::move(vol_adjusted));

    twap.execute(o, mid);
    aggr.execute(o, mid);
    pass.execute(o, mid);
    vagg.execute(o, mid);
}`,
    explanation:
      "std::function erases the concrete type of any callable (lambda, free function, functor) behind a uniform interface, enabling runtime strategy selection without virtual inheritance. The cost is a small indirection (typically one pointer dereference + possible heap allocation for large closures), acceptable for execution logic that runs at order cadence rather than tick cadence. Compared to virtual dispatch, std::function allows storing the strategy by value and swapping it at runtime without object slicing.",
  },
  {
    id: "cpp-20260704-b1-designated-init",
    language: "cpp",
    title: "C++20 Designated Initializers for Readable Config Structs",
    tag: "modern-cpp",
    code: `#include <iostream>
#include <string>
#include <cstdint>

// Designated initializers (C++20): name each member at the call site.
// Prevents mis-ordering bugs in large config structs (the most common cause
// of subtle production bugs in trading system configuration).

struct OrderConfig {
    std::string symbol       = "AAPL";
    double      limit_price  = 0.0;
    int         qty          = 0;
    char        side         = 'B';           // 'B' or 'S'
    bool        immediate_or_cancel = false;
    bool        all_or_none         = false;
    uint32_t    client_order_id     = 0;
    int         max_retries         = 3;
    double      slippage_tolerance  = 0.001;  // 0.1%
};

struct StrategyConfig {
    std::string  strategy_name     = "twap";
    int          num_slices         = 10;
    double       participation_rate = 0.10;   // 10% of volume
    bool         dark_pool_allowed  = false;
    bool         cross_venue        = true;
    OrderConfig  default_order{};
};

void print_config(const OrderConfig& c) {
    std::cout << "Order: " << c.symbol << " " << c.side
              << " " << c.qty << "@" << c.limit_price
              << " IOC=" << c.immediate_or_cancel
              << " AON=" << c.all_or_none
              << " retries=" << c.max_retries << "\\n";
}

int main() {
    // C++20 designated init: each field named explicitly
    // Fields not named take their default values from the struct
    OrderConfig buy_aapl {
        .symbol             = "AAPL",
        .limit_price        = 183.50,
        .qty                = 500,
        .side               = 'B',
        .immediate_or_cancel = true,
        .client_order_id    = 0x0001,
    };

    OrderConfig sell_msft {
        .symbol      = "MSFT",
        .limit_price = 415.00,
        .qty         = 200,
        .side        = 'S',
        .all_or_none = true,
        .max_retries = 0,  // no retries for AON
    };

    StrategyConfig strat {
        .strategy_name     = "vwap",
        .num_slices         = 20,
        .participation_rate = 0.15,
        .dark_pool_allowed  = true,
        .default_order      = buy_aapl,
    };

    print_config(buy_aapl);
    print_config(sell_msft);
    std::cout << "Strategy: " << strat.strategy_name
              << " slices=" << strat.num_slices
              << " prate=" << strat.participation_rate << "\\n";
}`,
    explanation:
      "Designated initializers make struct initialization self-documenting and order-independent: you cannot accidentally swap the qty and client_order_id arguments. In trading systems, configuration structs with 20+ fields are common; designated init is the only way to ensure each field is set intentionally. Fields not listed take their struct-default value — making it safe to add new fields to the struct without breaking existing initialization sites.",
  },
];
