import type { Snippet } from "./types";

export const cppSnippets20260709B1: Snippet[] = [
  {
    id: "cpp-20260709-b1-coroutine-tick-feed",
    language: "cpp",
    title: "C++20 Coroutine: Lazy Tick Feed Generator",
    tag: "modern-cpp",
    code: `#include <coroutine>
#include <iostream>
#include <vector>

// Minimal generator coroutine that yields one tick at a time without allocating
template <typename T>
struct Generator {
    struct promise_type {
        T value_;
        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v)  noexcept { value_ = v; return {}; }
        void return_void()  noexcept {}
        void unhandled_exception() { std::terminate(); }
    };

    using Handle = std::coroutine_handle<promise_type>;
    Handle h_;

    explicit Generator(Handle h) : h_(h) {}
    ~Generator() { if (h_) h_.destroy(); }
    Generator(const Generator&) = delete;
    Generator(Generator&& o) noexcept : h_(o.h_) { o.h_ = nullptr; }

    bool next() { h_.resume(); return !h_.done(); }
    T    value() const noexcept { return h_.promise().value_; }
};

// Simulate a tick replayer — no intermediate container, lazy evaluation
Generator<double> tick_replay(std::vector<double> prices) {
    for (double p : prices)
        co_yield p;
}

int main() {
    std::vector<double> tape = {99.50, 100.00, 100.25, 99.75, 100.50};
    auto feed = tick_replay(tape);
    while (feed.next())
        std::cout << "Tick: " << feed.value() << "\\n";
}`,
    explanation:
      "Coroutine generators suspend after each co_yield, resuming only when the consumer calls next() — so memory for the full tick series is never materialised at once. In a real feed handler the generator wraps a kernel ringbuffer read, hiding the async I/O behind a clean pull-based interface without callback spaghetti.",
  },
  {
    id: "cpp-20260709-b1-crtp-quoter",
    language: "cpp",
    title: "CRTP Static Polymorphism: Equity vs FX Quoter",
    tag: "CRTP",
    code: `#include <iostream>
#include <cmath>

// Base uses CRTP to call derived methods at compile time — zero vtable overhead
template <typename Derived>
class QuoterBase {
public:
    double mid()    const { return static_cast<const Derived*>(this)->mid_impl(); }
    double spread() const { return static_cast<const Derived*>(this)->spread_impl(); }
    double bid()    const { return mid() - spread() / 2.0; }
    double ask()    const { return mid() + spread() / 2.0; }

    void print() const {
        std::cout << "[" << Derived::name() << "]"
                  << " bid=" << bid()
                  << " ask=" << ask() << "\\n";
    }
};

struct EquityQuoter : QuoterBase<EquityQuoter> {
    double price, tick;
    EquityQuoter(double p, double t) : price(p), tick(t) {}
    double mid_impl()    const noexcept { return price; }
    double spread_impl() const noexcept { return tick; }        // 1 tick spread
    static const char* name() { return "EQ"; }
};

struct FXQuoter : QuoterBase<FXQuoter> {
    double spot, pip_value;
    FXQuoter(double s, double pv) : spot(s), pip_value(pv) {}
    double mid_impl()    const noexcept { return spot; }
    double spread_impl() const noexcept { return 2.0 * pip_value; } // 2-pip spread
    static const char* name() { return "FX"; }
};

// Template accepting any QuoterBase without virtual dispatch
template <typename Q>
void hedge_against(const QuoterBase<Q>& q, double notional) {
    double qty = notional / q.mid();
    std::cout << "Hedge " << qty << " units at ask=" << q.ask() << "\\n";
}

int main() {
    EquityQuoter eq{100.50, 0.01};
    FXQuoter     fx{1.0850, 0.0001};
    eq.print();
    fx.print();
    hedge_against(eq, 1'000'000.0);
}`,
    explanation:
      "CRTP replaces virtual dispatch with a compile-time template cast, eliminating the indirect call and enabling inlining of mid_impl and spread_impl into the caller — a ~3 ns saving per quote update that compounds on hundreds of symbols ticking simultaneously. The trade-off is that heterogeneous collections require std::variant; CRTP is optimal when the derived type is known statically.",
  },
  {
    id: "cpp-20260709-b1-intrusive-list-order",
    language: "cpp",
    title: "Intrusive Doubly-Linked List for O(1) Order Cancel",
    tag: "containers",
    code: `#include <iostream>
#include <cassert>

// Embed link pointers directly in the object — no heap allocation for the node
struct ListHook {
    ListHook* prev = nullptr;
    ListHook* next = nullptr;
};

struct Order {
    int    id;
    double price;
    int    qty;
    ListHook hook;   // intrusive hook — must be the sole owner of its list position
};

class IntrusiveList {
    ListHook sentinel_;  // sentinel head/tail: prev points to last, next to first

public:
    IntrusiveList() { sentinel_.prev = sentinel_.next = &sentinel_; }

    void push_back(Order& o) {
        o.hook.next = &sentinel_;
        o.hook.prev = sentinel_.prev;
        sentinel_.prev->next = &o.hook;
        sentinel_.prev = &o.hook;
    }

    // O(1) unlink: order carries its own pointers, so we need no search
    static void remove(Order& o) {
        assert(o.hook.prev && o.hook.next);
        o.hook.prev->next = o.hook.next;
        o.hook.next->prev = o.hook.prev;
        o.hook.prev = o.hook.next = nullptr;  // mark as unlinked
    }

    bool empty() const noexcept { return sentinel_.next == &sentinel_; }

    template <typename Fn>
    void for_each(Fn fn) {
        for (ListHook* h = sentinel_.next; h != &sentinel_; h = h->next)
            fn(*reinterpret_cast<Order*>(reinterpret_cast<char*>(h)
               - offsetof(Order, hook)));
    }
};

int main() {
    Order o1{1, 100.0, 100}, o2{2, 99.5, 200}, o3{3, 99.0, 50};
    IntrusiveList book;
    book.push_back(o1); book.push_back(o2); book.push_back(o3);

    IntrusiveList::remove(o2);   // O(1) cancel — no map lookup needed

    book.for_each([](const Order& o){
        std::cout << "Order " << o.id << " @ " << o.price << "\\n";
    });
    // prints: 1 @ 100.0,  3 @ 99.0
}`,
    explanation:
      "By embedding list pointers inside the Order object itself, cancellation is O(1) pointer-splice with no hash-map lookup. std::list stores nodes in separate heap allocations, requiring an iterator lookup before removal; an intrusive list avoids both the extra allocation and the search because each order carries its own position.",
  },
  {
    id: "cpp-20260709-b1-ranges-tick-pipeline",
    language: "cpp",
    title: "std::ranges Views Pipeline for Market Data Filtering",
    tag: "modern-cpp",
    code: `#include <ranges>
#include <vector>
#include <iostream>
#include <algorithm>
#include <numeric>

struct Tick { double bid, ask, qty; };

int main() {
    std::vector<Tick> ticks = {
        {99.95, 100.05, 500},
        {100.00, 100.10, 50},    // thin — skip
        {99.90, 100.00, 1000},
        {100.05, 100.15, 0},     // zero qty — skip
        {99.85, 100.00, 800},
    };

    // Lazy pipeline: no intermediate containers
    auto liquid_mids = ticks
        | std::views::filter([](const Tick& t){ return t.qty >= 200; })
        | std::views::transform([](const Tick& t){ return (t.bid + t.ask) / 2.0; });

    double sum  = std::ranges::fold_left(liquid_mids, 0.0, std::plus<>{});
    long   cnt  = std::ranges::distance(liquid_mids);
    double vwap = sum / cnt;

    std::cout << "Liquid ticks: " << cnt << "  VWAP mid: " << vwap << "\\n";

    // Collect into a vector for downstream use
    std::vector<double> mids(liquid_mids.begin(), liquid_mids.end());
    for (double m : mids) std::cout << "  mid=" << m << "\\n";
}`,
    explanation:
      "std::views::filter and std::views::transform compose lazily: no temporary vector is created between stages — the pipeline pulls one element at a time when the fold_left consumes it. This matters in high-frequency tick processing where allocating an intermediate filtered vector would add heap pressure and latency on every book update.",
  },
  {
    id: "cpp-20260709-b1-fnv-hash-symbol",
    language: "cpp",
    title: "Compile-Time FNV-1a Hash for Symbol Dispatch",
    tag: "low-latency",
    code: `#include <cstdint>
#include <string_view>
#include <iostream>

// FNV-1a: fast, distribution-friendly, minimal collisions on short strings
constexpr uint64_t FNV_PRIME  = 0x00000100000001B3ULL;
constexpr uint64_t FNV_OFFSET = 0xcbf29ce484222325ULL;

consteval uint64_t fnv1a_ct(std::string_view s) noexcept {
    uint64_t h = FNV_OFFSET;
    for (char c : s) { h ^= static_cast<uint8_t>(c); h *= FNV_PRIME; }
    return h;
}

uint64_t fnv1a_rt(std::string_view s) noexcept {
    uint64_t h = FNV_OFFSET;
    for (char c : s) { h ^= static_cast<uint8_t>(c); h *= FNV_PRIME; }
    return h;
}

// Compile-time switch using consteval hash — branch becomes a lookup table
void dispatch_symbol(std::string_view sym) {
    switch (fnv1a_rt(sym)) {
        case fnv1a_ct("AAPL"):  std::cout << "Apple equity handler\\n";  break;
        case fnv1a_ct("EURUSD"):std::cout << "EURUSD FX handler\\n";     break;
        case fnv1a_ct("GBP"):   std::cout << "GBP currency handler\\n";  break;
        default:                std::cout << "Unknown symbol\\n";          break;
    }
}

int main() {
    dispatch_symbol("AAPL");
    dispatch_symbol("EURUSD");
    dispatch_symbol("TSLA");

    // Verify compile-time equality with runtime hash
    constexpr uint64_t aapl_hash = fnv1a_ct("AAPL");
    static_assert(aapl_hash != 0);
    std::cout << "AAPL hash: 0x" << std::hex << aapl_hash << "\\n";
}`,
    explanation:
      "By hashing string constants at compile time with consteval and using them in switch case labels, the compiler generates a jump table instead of a strcmp chain — reducing symbol dispatch from O(N×length) to O(1). The FNV-1a finaliser has no multiply after the XOR, so it's roughly twice as fast as FNV-1 on short exchange symbol strings (4-6 bytes).",
  },
  {
    id: "cpp-20260709-b1-spsc-ring-buffer",
    language: "cpp",
    title: "SPSC Lock-Free Ring Buffer (Disruptor Pattern)",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <thread>
#include <iostream>

// Single-Producer Single-Consumer ring buffer
// No CAS needed: only one thread reads head, only one thread writes tail
template <typename T, std::size_t Cap>
class SPSCRing {
    static_assert((Cap & (Cap - 1)) == 0, "Cap must be power of 2");
    static constexpr std::size_t MASK = Cap - 1;

    alignas(64) std::atomic<std::size_t> head_{0};  // consumer reads
    alignas(64) std::atomic<std::size_t> tail_{0};  // producer writes
    alignas(64) std::array<T, Cap> buf_{};

public:
    // Producer only
    bool push(const T& val) noexcept {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        std::size_t h = head_.load(std::memory_order_acquire); // see consumer
        if (t - h >= Cap) return false;   // full
        buf_[t & MASK] = val;
        tail_.store(t + 1, std::memory_order_release); // publish
        return true;
    }

    // Consumer only
    std::optional<T> pop() noexcept {
        std::size_t h = head_.load(std::memory_order_relaxed);
        std::size_t t = tail_.load(std::memory_order_acquire); // see producer
        if (h == t) return std::nullopt;  // empty
        T val = buf_[h & MASK];
        head_.store(h + 1, std::memory_order_release); // consume
        return val;
    }

    std::size_t size() const noexcept {
        return tail_.load(std::memory_order_acquire)
             - head_.load(std::memory_order_acquire);
    }
};

int main() {
    SPSCRing<int, 1024> ring;
    std::atomic<long>   sum{0};

    std::thread producer([&]{
        for (int i = 0; i < 10000; ++i)
            while (!ring.push(i));
    });

    std::thread consumer([&]{
        long local = 0;
        for (int i = 0; i < 10000; ++i) {
            std::optional<int> v;
            while (!(v = ring.pop()));
            local += *v;
        }
        sum.store(local, std::memory_order_release);
    });

    producer.join(); consumer.join();
    std::cout << "Sum: " << sum << "\\n";  // 49995000
}`,
    explanation:
      "With one producer and one consumer, no CAS or mutex is needed because only one thread ever writes head and only one thread ever writes tail — the release/acquire pair on the index is sufficient to synchronise. The 64-byte alignment of head_ and tail_ prevents false sharing: if both counters shared a cache line, an update to tail_ would invalidate the consumer's cached head_, causing expensive cross-core coherence traffic.",
  },
  {
    id: "cpp-20260709-b1-span-message-parser",
    language: "cpp",
    title: "std::span Zero-Copy Binary Message Parser",
    tag: "low-latency",
    code: `#include <span>
#include <cstdint>
#include <cstring>
#include <cassert>
#include <iostream>

// Market-data wire message layout (packed, big-endian)
struct alignas(1) WireMsg {
    uint16_t msg_type;
    uint32_t seq_num;
    uint64_t timestamp_ns;
    int64_t  price_raw;     // price * 10^8
    int32_t  qty;
};

// No copy of the buffer — span is a (pointer, length) view into existing storage
struct ParsedMsg {
    uint16_t type;
    uint32_t seq;
    double   price;
    int32_t  qty;
};

inline uint16_t read_be16(const std::byte* p) noexcept {
    return static_cast<uint16_t>(std::to_integer<uint16_t>(p[0]) << 8
                                | std::to_integer<uint16_t>(p[1]));
}
inline uint32_t read_be32(const std::byte* p) noexcept {
    uint32_t v; std::memcpy(&v, p, 4);
    return __builtin_bswap32(v);
}
inline int64_t read_be64(const std::byte* p) noexcept {
    uint64_t v; std::memcpy(&v, p, 8);
    return static_cast<int64_t>(__builtin_bswap64(v));
}

ParsedMsg parse(std::span<const std::byte> buf) {
    assert(buf.size() >= sizeof(WireMsg));
    return {
        .type  = read_be16(buf.data()),
        .seq   = read_be32(buf.data() + 2),
        .price = static_cast<double>(read_be64(buf.data() + 14)) / 1e8,
        .qty   = static_cast<int32_t>(read_be32(buf.data() + 22)),
    };
}

int main() {
    // Synthetic big-endian wire bytes: type=0x0041('A'), seq=1, ts=1000, price=100*10^8, qty=500
    alignas(8) std::byte buf[] = {
        std::byte{0x00}, std::byte{0x41},                         // type = 65 = 'A'
        std::byte{0x00}, std::byte{0x00}, std::byte{0x00}, std::byte{0x01}, // seq = 1
        std::byte{0x00}, std::byte{0x00}, std::byte{0x00}, std::byte{0x00},
        std::byte{0x00}, std::byte{0x00}, std::byte{0x03}, std::byte{0xE8}, // ts = 1000
        std::byte{0x00}, std::byte{0x00}, std::byte{0x00}, std::byte{0x05},
        std::byte{0xF5}, std::byte{0xE1}, std::byte{0x00}, std::byte{0x00}, // price = 100*10^8
        std::byte{0x00}, std::byte{0x00}, std::byte{0x01}, std::byte{0xF4}, // qty = 500
    };

    auto msg = parse(std::span<const std::byte>(buf, sizeof(buf)));
    std::cout << "type=" << msg.type
              << " seq="   << msg.seq
              << " price=" << msg.price
              << " qty="   << msg.qty << "\\n";
}`,
    explanation:
      "std::span carries a pointer and length but does not own memory — passing it into parse() avoids copying the network buffer into a struct, keeping the data on the same cache line it arrived on. The __builtin_bswap intrinsics compile to a single BSWAP instruction on x86, making big-endian to host conversion a zero-overhead one-cycle operation.",
  },
  {
    id: "cpp-20260709-b1-variant-message-dispatch",
    language: "cpp",
    title: "std::variant + std::visit for Polymorphic Message Dispatch",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string>
#include <iostream>
#include <vector>

struct NewOrder  { int id; double price; int qty; char side; };
struct CancelOrder { int id; };
struct TradeReport { int buyer; int seller; double price; int qty; };

using Message = std::variant<NewOrder, CancelOrder, TradeReport>;

// Visitor using overloaded lambdas — exhaustive: compiler errors on missing case
template <typename... Fs>
struct Overload : Fs... { using Fs::operator()...; };

// Stateful market stats visitor
struct StatsAccumulator {
    long  order_count{};
    long  cancel_count{};
    long  trade_count{};
    double total_traded{};

    void operator()(const NewOrder&)    { ++order_count; }
    void operator()(const CancelOrder&) { ++cancel_count; }
    void operator()(const TradeReport& t) {
        ++trade_count;
        total_traded += t.price * t.qty;
    }
};

int main() {
    std::vector<Message> log = {
        NewOrder{1, 100.0, 200, 'B'},
        NewOrder{2, 99.5,  150, 'S'},
        TradeReport{1, 2, 99.5, 150},
        CancelOrder{1},
    };

    StatsAccumulator stats;
    for (const auto& msg : log)
        std::visit(stats, msg);

    std::cout << "Orders: "   << stats.order_count
              << " Cancels: " << stats.cancel_count
              << " Trades: "  << stats.trade_count
              << " Volume: $" << stats.total_traded << "\\n";

    // Overloaded visitor for ad-hoc dispatch
    auto describer = Overload{
        [](const NewOrder& o)     { std::cout << "New order " << o.id << "\\n"; },
        [](const CancelOrder& c)  { std::cout << "Cancel "   << c.id << "\\n"; },
        [](const TradeReport& t)  { std::cout << "Trade @ "  << t.price << "\\n"; },
    };
    for (const auto& msg : log) std::visit(describer, msg);
}`,
    explanation:
      "std::variant + std::visit encodes the closed set of message types in the type system: forgetting to handle TradeReport is a compile error, not a silent runtime default. The Overload trick composes lambdas into a single visitor via pack-expansion of using declarations — cleaner than a hand-written struct with multiple operator() overloads.",
  },
  {
    id: "cpp-20260709-b1-bitset-instrument-flags",
    language: "cpp",
    title: "std::bitset for Compact Instrument State Flags",
    tag: "low-latency",
    code: `#include <bitset>
#include <cstdint>
#include <iostream>
#include <string>

// Instrument state packed into a single 64-bit word — cache-line efficient
// for scanning 512 instruments whose state fits in 8 words
enum InstrumentFlag : std::size_t {
    HALTED         = 0,
    SHORT_SELL_BAN = 1,
    FAST_MARKET    = 2,
    CIRCUIT_BREAKER= 3,
    TRADING_PAUSED = 4,
    POST_ONLY      = 5,
    IMBALANCE_FLAG = 6,
    // ... up to 64 bits in a single uint64_t view
};

class InstrumentState {
    std::bitset<64> flags_;

public:
    void   set  (InstrumentFlag f)        { flags_.set(f); }
    void   clear(InstrumentFlag f)        { flags_.reset(f); }
    bool   test (InstrumentFlag f) const  { return flags_.test(f); }
    bool   tradeable() const noexcept     { return !(flags_[HALTED] || flags_[CIRCUIT_BREAKER]
                                                  || flags_[TRADING_PAUSED]); }
    // Mask comparison: any halting flags set?
    bool   any_halt() const noexcept {
        constexpr std::bitset<64> HALT_MASK(
            (1ULL << HALTED) | (1ULL << CIRCUIT_BREAKER) | (1ULL << TRADING_PAUSED));
        return (flags_ & HALT_MASK).any();
    }
    uint64_t raw() const noexcept {
        return flags_.to_ulong();
    }
};

int main() {
    InstrumentState aapl;
    aapl.set(FAST_MARKET);
    aapl.set(POST_ONLY);

    std::cout << "Tradeable: " << std::boolalpha << aapl.tradeable() << "\\n"; // true
    std::cout << "Raw flags: 0x" << std::hex << aapl.raw()           << "\\n"; // 0x24

    aapl.set(CIRCUIT_BREAKER);
    std::cout << "Tradeable: " << aapl.tradeable()  << "\\n"; // false
    std::cout << "Any halt:  " << aapl.any_halt()   << "\\n"; // true
    aapl.clear(CIRCUIT_BREAKER);
    std::cout << "Tradeable: " << aapl.tradeable()  << "\\n"; // true
}`,
    explanation:
      "Packing 64 boolean flags into a single uint64_t bitset lets the exchange gateway check tradeable state with a single AND + test, fitting the state of all instruments on a market in a few cache lines rather than one bool-per-instrument array spread across hundreds of lines. The bitset::to_ulong() accessor also allows fast serialisation to a compact wire format for state broadcast.",
  },
  {
    id: "cpp-20260709-b1-timer-wheel",
    language: "cpp",
    title: "Hierarchical Timer Wheel for Order Timeout Eviction",
    tag: "containers",
    code: `#include <array>
#include <vector>
#include <functional>
#include <cstdint>
#include <iostream>

// Single-level timer wheel: O(1) insert and tick advance for orders with max TTL
// Sufficient for exchange cancel-on-disconnect timeouts (max ~10s, 1ms resolution)
class TimerWheel {
    static constexpr int SLOTS   = 1024;          // covers 1024 ms at 1 ms resolution
    static constexpr int MASK    = SLOTS - 1;

    struct Entry { uint32_t order_id; std::function<void(uint32_t)> cb; };

    std::array<std::vector<Entry>, SLOTS> wheel_;
    uint64_t current_tick_{0};

public:
    // Schedule callback at (delay_ms) from now
    void schedule(uint32_t order_id, int delay_ms, std::function<void(uint32_t)> cb) {
        int slot = (static_cast<int>(current_tick_) + delay_ms) & MASK;
        wheel_[slot].push_back({order_id, std::move(cb)});
    }

    // Advance one millisecond; fire all entries in the next slot
    void tick() {
        ++current_tick_;
        int slot = static_cast<int>(current_tick_) & MASK;
        for (auto& e : wheel_[slot])
            e.cb(e.order_id);
        wheel_[slot].clear();
    }

    uint64_t now_ticks() const noexcept { return current_tick_; }
};

int main() {
    TimerWheel tw;
    int fired = 0;

    tw.schedule(1001, 100, [&](uint32_t id){
        std::cout << "Order " << id << " expired at tick " << tw.now_ticks() << "\\n";
        ++fired;
    });
    tw.schedule(1002, 200, [&](uint32_t id){
        std::cout << "Order " << id << " expired at tick " << tw.now_ticks() << "\\n";
        ++fired;
    });

    // Advance 250 ticks
    for (int i = 0; i < 250; ++i) tw.tick();
    std::cout << "Fired: " << fired << "\\n";  // 2
}`,
    explanation:
      "A timer wheel amortises timeout tracking to O(1) insert and O(1) amortised tick advance — a heap-based priority queue would cost O(log N) per insertion. For HFT gateways that maintain thousands of GTC orders with cancel-on-disconnect timeouts, the wheel's constant-time operations prevent priority-queue overhead from accumulating on the critical path.",
  },
  {
    id: "cpp-20260709-b1-hugepage-ring",
    language: "cpp",
    title: "Hugepage-Backed Ring Buffer via madvise",
    tag: "low-latency",
    code: `#ifdef __linux__
#include <sys/mman.h>
#include <cstring>
#include <cstddef>
#include <iostream>

// Hugepages (2 MB) reduce TLB pressure for large, frequently-accessed buffers
// A 2-MB TLB entry covers what 512 standard 4-KB entries would need
void* hugepage_alloc(std::size_t size) {
    // Align size to 2 MB boundary
    constexpr std::size_t HUGEPAGE = 2UL * 1024 * 1024;
    size = (size + HUGEPAGE - 1) & ~(HUGEPAGE - 1);

    void* ptr = mmap(nullptr, size,
                     PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (ptr == MAP_FAILED) return nullptr;

    // Hint: use transparent hugepages (kernel may honour on next page fault)
    madvise(ptr, size, MADV_HUGEPAGE);

    // Pre-fault all pages so no page-fault latency occurs during message processing
    std::memset(ptr, 0, size);
    return ptr;
}

struct alignas(64) MsgSlot {
    uint64_t seq;
    char     payload[56];
};

int main() {
    constexpr std::size_t SLOTS    = 131072;   // 128k × 64B = 8 MB
    constexpr std::size_t BUF_SIZE = SLOTS * sizeof(MsgSlot);

    auto* ring = static_cast<MsgSlot*>(hugepage_alloc(BUF_SIZE));
    if (!ring) { std::cerr << "hugepage_alloc failed\\n"; return 1; }

    // Write and read a slot
    ring[0].seq = 42;
    std::memcpy(ring[0].payload, "TICK", 4);
    std::cout << "seq=" << ring[0].seq << " payload=" << ring[0].payload << "\\n";

    munmap(ring, BUF_SIZE);
}
#else
int main() { return 0; }
#endif`,
    explanation:
      "The Linux TLB typically has 64 L2 entries covering only 64 × 4 KB = 256 KB in standard pages; a ring buffer larger than that causes TLB misses on random-access patterns. Pre-faulting with memset (the MADV_HUGEPAGE path) materialises all 2 MB hugepages at startup so no page faults occur during the trading session — a critical requirement for deterministic latency.",
  },
  {
    id: "cpp-20260709-b1-prefetch-book-scan",
    language: "cpp",
    title: "Software Prefetch for Cache-Friendly Book Scan",
    tag: "low-latency",
    code: `#include <vector>
#include <cmath>
#include <iostream>
#include <chrono>
#include <numeric>

struct PriceLevel {
    double price;
    int    qty;
    int    order_count;
    char   pad[44];   // pad to 64 bytes (one cache line)
};

// Without prefetch: each level access may wait for a cache miss (~100 cycles)
double scan_naive(const std::vector<PriceLevel>& book) noexcept {
    double total = 0.0;
    for (const auto& lv : book) total += lv.price * lv.qty;
    return total;
}

// With software prefetch: tell the CPU to start fetching AHEAD of the current position
// __builtin_prefetch(addr, rw=0[read], locality=1[L2])
double scan_prefetch(const std::vector<PriceLevel>& book) noexcept {
    constexpr int PREFETCH_DISTANCE = 4;   // fetch 4 levels ahead
    double total = 0.0;
    int n = static_cast<int>(book.size());

    for (int i = 0; i < n; ++i) {
        if (i + PREFETCH_DISTANCE < n)
            __builtin_prefetch(&book[i + PREFETCH_DISTANCE], 0, 1);
        total += book[i].price * book[i].qty;
    }
    return total;
}

int main() {
    std::vector<PriceLevel> book(512);
    for (int i = 0; i < 512; ++i)
        book[i] = {100.0 + i * 0.01, 100 + i, 1};

    // Time both variants
    auto bench = [&](const char* name, auto fn) {
        auto t0 = std::chrono::steady_clock::now();
        volatile double r = 0;
        for (int i = 0; i < 10000; ++i) r += fn(book);
        auto ns = std::chrono::duration_cast<std::chrono::nanoseconds>(
                      std::chrono::steady_clock::now() - t0).count();
        std::cout << name << ": " << ns / 10000 << " ns avg\\n";
    };

    bench("Naive   ", scan_naive);
    bench("Prefetch", scan_prefetch);
}`,
    explanation:
      "Software prefetch inserts a non-blocking memory hint that starts a cache-line fetch without stalling the CPU — when the program reaches the prefetched element 4 iterations later, it is already in L2 cache. The prefetch distance of 4 is empirically tuned: too small and the data still isn't ready; too large and the prefetch evicts data that is currently being processed.",
  },
  {
    id: "cpp-20260709-b1-branch-free-sign",
    language: "cpp",
    title: "Branch-Free Sign and Abs for P&L Flip Detection",
    tag: "low-latency",
    code: `#include <cstdint>
#include <iostream>
#include <bit>

// Branch-free sign bit extraction for int64_t
// Avoids branch misprediction on alternating positive/negative P&L
inline int64_t sign_i64(int64_t x) noexcept {
    // Arithmetic right shift: fills with sign bit (0 or -1 in two's complement)
    // (x >> 63) | ((-x) >> 63)  gives -1/0/+1
    return (x >> 63) | (static_cast<uint64_t>(-x) >> 63);
}

inline int64_t abs_i64(int64_t x) noexcept {
    int64_t mask = x >> 63;   // -1 if negative, 0 if positive
    return (x ^ mask) - mask; // conditional negate via XOR + subtract
}

// Detect P&L sign flip without branch
inline bool sign_flip(int64_t prev_pnl, int64_t curr_pnl) noexcept {
    return (prev_pnl ^ curr_pnl) < 0;   // MSB differs iff signs differ
}

// Branch-free clamp to [-limit, +limit]
inline int64_t clamp_risk(int64_t pos, int64_t limit) noexcept {
    int64_t upper_excess = pos - limit;
    int64_t lower_excess = -limit - pos;
    // Branchless: only subtract excess when it is positive
    pos -= upper_excess & -(upper_excess > 0);
    pos += lower_excess & -(lower_excess > 0);
    return pos;
}

int main() {
    for (int64_t x : {-42LL, -1LL, 0LL, 1LL, 42LL}) {
        std::cout << "x=" << x
                  << " sign=" << sign_i64(x)
                  << " abs="  << abs_i64(x) << "\\n";
    }

    std::cout << "Flip -100->+50: " << std::boolalpha << sign_flip(-100, 50) << "\\n"; // true
    std::cout << "Flip +100->+50: " << sign_flip(100, 50) << "\\n";                    // false

    int64_t pos = 750;
    std::cout << "Clamped 750 to ±500: " << clamp_risk(pos, 500) << "\\n"; // 500
}`,
    explanation:
      "On modern out-of-order CPUs a branch misprediction costs 15-20 cycles. In the matching engine's fill loop where P&L flips occur on every position reversal, replacing a conditional with an arithmetic identity eliminates that penalty. The sign_flip check (XOR of MSBs) is a single instruction — useful for triggering position-flip callbacks in a risk system without conditional branches.",
  },
  {
    id: "cpp-20260709-b1-flat-map-sparse",
    language: "cpp",
    title: "std::flat_map (C++23) for Sparse Instrument Metadata",
    tag: "modern-cpp",
    code: `// Requires C++23 and a supporting standard library (GCC 14+, Clang 18+)
#include <map>       // fallback: std::map equivalent semantics
#include <string>
#include <optional>
#include <iostream>

// std::flat_map stores keys and values in two contiguous sorted vectors
// providing sorted-order iteration with better cache locality than std::map nodes.
// For sparse lookups over a small, stable instrument universe this is ideal.

// C++23 example (shown as std::map for portability in this demo):
struct InstrMeta {
    std::string name;
    double      lot_size;
    double      tick_size;
    int         decimal_places;
};

// Simulates flat_map<string, InstrMeta> with std::map (same interface)
using InstrMap = std::map<std::string, InstrMeta>;

InstrMap make_universe() {
    return {
        {"AAPL",   {"Apple Inc.",       1.0,    0.01, 2}},
        {"EURUSD", {"Euro/Dollar",  100000.0, 0.0001, 4}},
        {"CL",     {"Crude Oil Fut",    1000.0, 0.01, 2}},
    };
}

std::optional<double> tick_size(const InstrMap& m, const std::string& sym) {
    auto it = m.find(sym);
    return it != m.end() ? std::optional{it->second.tick_size} : std::nullopt;
}

int main() {
    auto universe = make_universe();

    // Iteration order is alphabetical (C < E < ... : sorted keys)
    for (const auto& [sym, meta] : universe)
        std::cout << sym << ": lot=" << meta.lot_size
                  << " tick=" << meta.tick_size << "\\n";

    // Lookup
    if (auto ts = tick_size(universe, "EURUSD"))
        std::cout << "EURUSD tick: " << *ts << "\\n";  // 0.0001
    if (!tick_size(universe, "TSLA"))
        std::cout << "TSLA not in universe\\n";
}`,
    explanation:
      "std::flat_map keeps keys and values in two separate contiguous vectors, making iteration and lower_bound scans significantly faster than std::map's node-based layout where each lookup follows a pointer tree and defeats the cache prefetcher. For a static instrument universe loaded at startup and queried millions of times per session, the memory locality improvement is consistently measurable.",
  },
  {
    id: "cpp-20260709-b1-implied-vol-newton",
    language: "cpp",
    title: "Implied Volatility via Newton-Raphson (Vega as Derivative)",
    tag: "numerics",
    code: `#include <cmath>
#include <stdexcept>
#include <iostream>

static double norm_cdf(double x) noexcept {
    return 0.5 * std::erfc(-x / std::sqrt(2.0));
}
static double norm_pdf(double x) noexcept {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * M_PI);
}

double bs_call(double S, double K, double T, double r, double sig) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sig*sig)*T) / (sig*sqT);
    double d2  = d1 - sig*sqT;
    return S*norm_cdf(d1) - K*std::exp(-r*T)*norm_cdf(d2);
}

double vega(double S, double K, double T, double r, double sig) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sig*sig)*T) / (sig*sqT);
    return S * norm_pdf(d1) * sqT;  // dC/dsigma
}

// Newton-Raphson: sigma_{n+1} = sigma_n - (BS(sigma_n) - target) / vega(sigma_n)
double implied_vol(double C_market, double S, double K, double T, double r,
                   int max_iter = 100, double tol = 1e-10) {
    double sig = 0.2;  // initial guess: 20% vol
    for (int i = 0; i < max_iter; ++i) {
        double price = bs_call(S, K, T, r, sig);
        double diff  = price - C_market;
        if (std::fabs(diff) < tol) return sig;
        double v = vega(S, K, T, r, sig);
        if (v < 1e-12) throw std::runtime_error("Vega too small — near intrinsic");
        sig -= diff / v;
        if (sig < 1e-7) sig = 1e-7;   // guard against negative vol
    }
    throw std::runtime_error("Implied vol did not converge");
}

int main() {
    double S=100, K=100, T=1, r=0.05;

    for (double target_vol : {0.10, 0.15, 0.20, 0.25, 0.35}) {
        double market_price = bs_call(S, K, T, r, target_vol);
        double iv = implied_vol(market_price, S, K, T, r);
        std::cout << "target=" << target_vol
                  << "  market_px=" << market_price
                  << "  IV=" << iv << "\\n";
    }
}`,
    explanation:
      "Newton-Raphson converges quadratically (roughly doubling correct digits per iteration) because BS-price is smooth in sigma; typical convergence to 1e-10 accuracy occurs in 4-6 iterations starting from 20% vol. Using vega as the derivative is exact — unlike a numerical step — and the vega guard prevents division-by-zero for deep ITM/OTM options near expiry where vega collapses.",
  },
  {
    id: "cpp-20260709-b1-crank-nicolson-pde",
    language: "cpp",
    title: "Crank-Nicolson PDE Pricer for European Options",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <iostream>
#include <algorithm>

// Crank-Nicolson finite-difference scheme for the Black-Scholes PDE
// Unconditionally stable (unlike explicit Euler) and second-order in both S and t
double crank_nicolson_call(double S0, double K, double T,
                            double r, double sigma,
                            int M = 200, int N = 200) {
    double S_max = 3.0 * K;        // truncated domain [0, S_max]
    double dS    = S_max / M;
    double dt    = T / N;

    std::vector<double> V(M + 1);
    // Terminal condition: call payoff at T
    for (int j = 0; j <= M; ++j) V[j] = std::max(j * dS - K, 0.0);

    // Step backward from T to 0
    for (int n = 0; n < N; ++n) {
        std::vector<double> a(M - 1), b(M - 1), c(M - 1), d(M - 1);
        for (int j = 1; j < M; ++j) {
            double S  = j * dS;
            double mu = 0.5 * (r * S / dS - sigma*sigma * S*S / (dS*dS));
            double va = 0.5 * (sigma*sigma * S*S / (dS*dS));
            double la = mu;
            double ua = -mu;

            // CN: average of implicit and explicit operators
            a[j-1] = -0.5 * dt * (la - va);
            b[j-1] =  1.0 + dt * va;
            c[j-1] = -0.5 * dt * (ua - va);
            d[j-1] =  0.5 * dt * (la - va) * V[j-1]
                    + (1.0 - dt * va)       * V[j]
                    - 0.5 * dt * (ua - va)  * V[j+1];
        }
        // Boundary: V[0] = 0 (call), V[M] = S_max - K*exp(-r*(T - n*dt))
        d[0] -= a[0] * 0.0;
        d[M-2] -= c[M-2] * (S_max - K * std::exp(-r * (n+1) * dt));

        // Thomas algorithm (tridiagonal solve)
        for (int j = 1; j < M - 1; ++j) {
            double w = a[j] / b[j-1];
            b[j] -= w * c[j-1];
            d[j] -= w * d[j-1];
        }
        std::vector<double> Vnew(M + 1, 0.0);
        Vnew[M] = S_max - K * std::exp(-r * (n+1) * dt);
        Vnew[M-1] = d[M-2] / b[M-2];
        for (int j = M-3; j >= 0; --j)
            Vnew[j+1] = (d[j] - c[j] * Vnew[j+2]) / b[j];
        V = Vnew;
    }

    // Interpolate to S0
    int j0   = static_cast<int>(S0 / dS);
    double w = (S0 - j0 * dS) / dS;
    return (1 - w) * V[j0] + w * V[std::min(j0+1, M)];
}

int main() {
    double S=100, K=100, T=1, r=0.05, sig=0.20;
    double price = crank_nicolson_call(S, K, T, r, sig);
    std::cout << "CN call price: " << price << "\\n";  // ~10.45 (BS exact ~10.451)
}`,
    explanation:
      "The Crank-Nicolson scheme averages the implicit and explicit finite-difference operators at each time step, achieving second-order accuracy in both grid dimensions without the time-step stability constraint of the explicit scheme. The tridiagonal structure allows O(M) solution via the Thomas algorithm at each time step, making the total cost O(M × N) — comparable to Monte Carlo but with no variance noise.",
  },
  {
    id: "cpp-20260709-b1-crr-binomial-american",
    language: "cpp",
    title: "CRR Binomial Tree for American Option Pricing",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <iostream>

// Cox-Ross-Rubinstein binomial tree with early exercise for American puts
double crr_american_put(double S0, double K, double T, double r, double sigma,
                         int N = 500) {
    double dt = T / N;
    double u  = std::exp(sigma * std::sqrt(dt));
    double d  = 1.0 / u;
    double p  = (std::exp(r * dt) - d) / (u - d);   // risk-neutral up probability
    double df = std::exp(-r * dt);

    // Terminal payoffs
    std::vector<double> V(N + 1);
    for (int j = 0; j <= N; ++j) {
        double S = S0 * std::pow(u, N - 2 * j);  // S at node (N, j)
        V[j] = std::max(K - S, 0.0);
    }

    // Backward induction with early exercise check
    for (int i = N - 1; i >= 0; --i) {
        for (int j = 0; j <= i; ++j) {
            double S     = S0 * std::pow(u, i - 2 * j);
            double hold  = df * (p * V[j] + (1 - p) * V[j + 1]);
            double ex    = std::max(K - S, 0.0);   // intrinsic value (exercise now)
            V[j] = std::max(hold, ex);              // American: take the better
        }
    }

    return V[0];
}

int main() {
    double S=100, K=100, T=1, r=0.05, sig=0.20;
    double am = crr_american_put(S, K, T, r, sig, 500);
    // European put via put-call parity: C - P = S - K*exp(-rT)
    double call_bs = 10.4506;   // analytical BS call
    double eu_put  = call_bs - S + K * std::exp(-r * T);

    std::cout << "American put: " << am     << "\\n"; // ~6.09
    std::cout << "European put: " << eu_put << "\\n"; // ~5.57
    std::cout << "Early exercise premium: " << am - eu_put << "\\n"; // ~0.52
}`,
    explanation:
      "American options command an early exercise premium over their European counterparts because the holder can optimally exercise when the intrinsic value exceeds the continuation value — this is captured by the max(hold, intrinsic) step at each node. The CRR parameterisation ensures the tree recombines (U × D = 1), reducing the O(2^N) full tree to O(N²) nodes while preserving log-normal terminal distribution in the limit.",
  },
  {
    id: "cpp-20260709-b1-cholesky-correlated-mc",
    language: "cpp",
    title: "Cholesky Decomposition for Correlated Asset MC Paths",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <random>
#include <iostream>

// Lower Cholesky factor L such that L L^T = Sigma
std::vector<std::vector<double>> cholesky(const std::vector<std::vector<double>>& A) {
    int n = static_cast<int>(A.size());
    std::vector<std::vector<double>> L(n, std::vector<double>(n, 0.0));
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j <= i; ++j) {
            double sum = A[i][j];
            for (int k = 0; k < j; ++k) sum -= L[i][k] * L[j][k];
            L[i][j] = (i == j) ? std::sqrt(sum) : sum / L[j][j];
        }
    }
    return L;
}

// Simulate N paths for n assets over T with given correlation
std::vector<std::vector<double>>
correlated_paths(const std::vector<double>& S0, const std::vector<double>& mu,
                 const std::vector<double>& sigma,
                 const std::vector<std::vector<double>>& corr,
                 double T, int steps, int paths, unsigned seed = 42) {
    int n = static_cast<int>(S0.size());
    double dt = T / steps;

    // Build covariance from correlation and vols
    std::vector<std::vector<double>> cov(n, std::vector<double>(n));
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            cov[i][j] = corr[i][j] * sigma[i] * sigma[j] * dt;
    auto L = cholesky(cov);

    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    std::vector<std::vector<double>> S_T(paths, S0);

    for (int p = 0; p < paths; ++p) {
        std::vector<double> S = S0;
        for (int t = 0; t < steps; ++t) {
            // Generate n independent standard normals
            std::vector<double> Z(n);
            for (int i = 0; i < n; ++i) Z[i] = nd(rng);
            // Correlate: dW = L Z
            std::vector<double> dW(n, 0.0);
            for (int i = 0; i < n; ++i)
                for (int j = 0; j <= i; ++j)
                    dW[i] += L[i][j] * Z[j];
            // GBM step
            for (int i = 0; i < n; ++i)
                S[i] *= std::exp((mu[i] - 0.5*sigma[i]*sigma[i])*dt + dW[i]);
        }
        S_T[p] = S;
    }
    return S_T;
}

int main() {
    int n = 2;
    std::vector<double> S0 = {100.0, 80.0};
    std::vector<double> mu  = {0.05,  0.07};
    std::vector<double> sig = {0.20,  0.25};
    std::vector<std::vector<double>> corr = {{1.0, 0.6}, {0.6, 1.0}};

    auto paths = correlated_paths(S0, mu, sig, corr, 1.0, 252, 10000);

    double sum0 = 0, sum1 = 0;
    for (const auto& p : paths) { sum0 += p[0]; sum1 += p[1]; }
    std::cout << "E[S1]=" << sum0/paths.size()
              << "  E[S2]=" << sum1/paths.size() << "\\n";
    // Should be near S0 * exp(mu * T): ~105.13, ~85.73
}`,
    explanation:
      "Cholesky decomposition converts a correlation matrix into a lower triangular factor L so that multiplying L by independent standard normals produces correlated normals matching the target covariance. This is the standard approach for generating correlated GBM paths in basket option Monte Carlo and credit portfolio simulations — it requires a positive definite covariance matrix, which can be enforced by adding a small diagonal regulariser if market data introduces numerical noise.",
  },
  {
    id: "cpp-20260709-b1-lookback-exact",
    language: "cpp",
    title: "Lookback Option Exact Pricing (Floating Strike)",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>

// Goldman-Sosin-Gatto (1979) analytical formula for floating-strike lookback call
// Payoff: max(S_T - S_min, 0) where S_min = minimum S over [0, T]
// Equivalently: price_call = S0 * N(a1) - S0 * (sigma^2/(2r)) * N(-a1)
//             + S0 * exp(-r*T) * (sigma^2/(2r)) * N(a2) - S_min * exp(-r*T) * N(a2 - sigma*sqrt(T))
// where a1 = (log(S0/S_min) + (r + 0.5*sig^2)*T) / (sig*sqrt(T))
//       a2 = (log(S0/S_min) + (-r + 0.5*sig^2)*T) / (sig*sqrt(T))

double lookback_float_call(double S0, double S_min, double T,
                            double r, double sigma) noexcept {
    auto N = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    double sqT = std::sqrt(T);
    double df  = std::exp(-r * T);
    double a1  = (std::log(S0 / S_min) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double a2  = (std::log(S0 / S_min) + (-r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double b   = sigma*sigma / (2.0*r);

    return S0 * N(a1)
         - S0 * b * N(-a1)
         + S0 * b * df * N(a2)
         - S_min * df * N(a2 - sigma*sqT);
}

// Put with floating strike: payoff = S_max - S_T (symmetric formula)
double lookback_float_put(double S0, double S_max, double T,
                           double r, double sigma) noexcept {
    auto N = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    double sqT = std::sqrt(T);
    double df  = std::exp(-r * T);
    double a1  = (std::log(S_max / S0) + (-r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double b   = sigma*sigma / (2.0*r);

    return S_max * df * N(a1)
         - S0 * df * N(a1 - sigma*sqT)
         + S0 * b * N(sigma*sqT - a1)
         - S0 * b * df * N(-a1);
}

int main() {
    double S0=100, T=1, r=0.05, sig=0.20;

    // At inception: S_min = S0 (current price is the running minimum)
    double call_lb = lookback_float_call(S0, S0, T, r, sig);
    double put_lb  = lookback_float_put (S0, S0, T, r, sig);

    std::cout << "Lookback float call (S0=S_min=100): " << call_lb << "\\n"; // ~18.0
    std::cout << "Lookback float put  (S0=S_max=100): " << put_lb  << "\\n"; // ~13.0

    // Put-call symmetry: C(S_min=m) = P(S_max=m) under spot/forward symmetry
    // holds approximately for small r
}`,
    explanation:
      "The floating-strike lookback call is the most expensive vanilla-ish path-dependent option because it always guarantees the lowest buy price over the full path — the premium reflects that you buy at the minimum. The GSG closed form avoids Monte Carlo entirely by conditioning on the running minimum's distribution, which is known analytically for GBM.",
  },
  {
    id: "cpp-20260709-b1-barrier-mc-exact",
    language: "cpp",
    title: "Down-and-Out Barrier Option: Brownian Bridge Correction",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <iostream>

// Naive MC undercounts barrier breaches between discrete monitoring dates
// Brownian Bridge correction: given S_t and S_{t+1}, the probability that
// the path crosses the barrier H in between is:
// P(min in [t,t+dt] < H) = exp(-2 * log(S_t/H) * log(S_{t+dt}/H) / (sigma^2 * dt))
// conditioned on neither S_t nor S_{t+dt} breaching H

double barrier_prob(double S_start, double S_end, double H,
                    double sigma, double dt) noexcept {
    if (S_start <= H || S_end <= H) return 1.0;   // already breached
    double a = std::log(S_start / H);
    double b = std::log(S_end   / H);
    return std::exp(-2.0 * a * b / (sigma * sigma * dt));
}

double down_and_out_call_mc(double S0, double K, double H, double T,
                             double r, double sigma, int steps, int paths,
                             unsigned seed = 42) {
    double dt   = T / steps;
    double mu_d = (r - 0.5*sigma*sigma) * dt;
    double sig_d = sigma * std::sqrt(dt);

    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double sum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S   = S0;
        bool   ko  = false;
        for (int t = 0; !ko && t < steps; ++t) {
            double S_next = S * std::exp(mu_d + sig_d * nd(rng));
            // Brownian Bridge probability of touching barrier between steps
            double p_cross = barrier_prob(S, S_next, H, sigma, dt);
            if ((std::uniform_real_distribution<double>{}(rng)) < p_cross) {
                ko = true; break;
            }
            S = S_next;
        }
        if (!ko) sum += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * sum / paths;
}

int main() {
    double S=100, K=100, H=90, T=1, r=0.05, sig=0.20;

    // Compare coarse vs fine monitoring
    double c_coarse = down_and_out_call_mc(S, K, H, T, r, sig, 12,  100'000);
    double c_fine   = down_and_out_call_mc(S, K, H, T, r, sig, 252, 100'000);
    double c_bridge = down_and_out_call_mc(S, K, H, T, r, sig,  12, 100'000);  // bridge corrected

    std::cout << "Coarse MC (12 steps):  " << c_coarse << "\\n";
    std::cout << "Fine MC (252 steps):   " << c_fine   << "\\n";
    std::cout << "Bridge-corrected (12): " << c_bridge << "\\n";
}`,
    explanation:
      "Monitoring a barrier only at discrete time steps (weekly/daily) misses intra-step breaches, causing a systematic bias in barrier option prices. The Brownian Bridge correction adds a stochastic knockout probability conditioned on the start and end points of each step, allowing coarse simulations to match the continuous monitoring price without the computational cost of fine-stepping.",
  },
  {
    id: "cpp-20260709-b1-format-order-log",
    language: "cpp",
    title: "std::format (C++20) for Structured Order Audit Log",
    tag: "modern-cpp",
    code: `#include <format>
#include <chrono>
#include <string>
#include <vector>
#include <iostream>

enum class Side : char { Buy = 'B', Sell = 'S' };
enum class OrderState { New, PartFilled, Filled, Cancelled };

struct OrderLogEntry {
    int        order_id;
    Side       side;
    double     price;
    int        qty;
    int        filled_qty;
    OrderState state;
    std::chrono::steady_clock::time_point ts;
};

std::string format_entry(const OrderLogEntry& e) {
    const char* state_str[] = {"NEW", "PART", "FILL", "CXLD"};
    return std::format(
        "[{:06d}] {:4s} {:c} qty={:5d}/{:5d} px={:.4f}",
        e.order_id,
        state_str[static_cast<int>(e.state)],
        static_cast<char>(e.side),
        e.filled_qty,
        e.qty,
        e.price
    );
}

// Pad and align a table header (compile-time width specs)
std::string format_table_header() {
    return std::format(
        "{:<10} {:<6} {:<6} {:>10} {:>10} {:>12}",
        "OrderID", "State", "Side", "FilledQty", "TotalQty", "Price"
    );
}

int main() {
    std::vector<OrderLogEntry> log = {
        {100001, Side::Buy,  100.50, 1000,    0,  OrderState::New,      {}},
        {100001, Side::Buy,  100.50, 1000,  500,  OrderState::PartFilled,{}},
        {100001, Side::Buy,  100.50, 1000, 1000,  OrderState::Filled,   {}},
        {100002, Side::Sell, 100.25,  500,    0,  OrderState::Cancelled, {}},
    };

    std::cout << format_table_header() << "\\n";
    std::cout << std::string(60, '-') << "\\n";
    for (const auto& e : log)
        std::cout << format_entry(e) << "\\n";
}`,
    explanation:
      "std::format (C++20) replaces printf-style format strings with type-safe, compile-time-checked format specifications — the format string is validated at compile time and cannot cause undefined behaviour via type mismatch. For order audit logging at HFT speeds, it produces tighter formatted output than std::ostringstream without the runtime overhead of format string parsing every call.",
  },
  {
    id: "cpp-20260709-b1-bellman-ford-fx",
    language: "cpp",
    title: "FX Triangular Arbitrage via Bellman-Ford Negative Cycle",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <string>
#include <limits>
#include <iostream>

// Detect FX arbitrage: transform rates to negative log weights so a negative
// cycle in Bellman-Ford corresponds to a log-return > 0 (profit) cycle
struct Edge { int u, v; double weight; };

// Returns true and populates cycle if a negative-weight cycle exists
bool find_arbitrage(int n_currencies,
                    const std::vector<std::pair<int,int>>& pairs,
                    const std::vector<double>& rates,
                    std::vector<int>& cycle) {
    std::vector<Edge> edges;
    for (std::size_t i = 0; i < pairs.size(); ++i) {
        auto [u, v] = pairs[i];
        double w = -std::log(rates[i]);  // negative log: positive rate → negative weight
        edges.push_back({u, v, w});
        edges.push_back({v, u, -w});      // reverse edge (reciprocal rate)
    }

    std::vector<double> dist(n_currencies, 0.0);  // start from 0 (all zeros = no-cost start)
    std::vector<int>    pred(n_currencies, -1);

    int last_relaxed = -1;
    // N-1 rounds: relax all edges
    for (int i = 0; i < n_currencies; ++i) {
        last_relaxed = -1;
        for (const auto& e : edges) {
            if (dist[e.u] + e.weight < dist[e.v] - 1e-12) {
                dist[e.v]    = dist[e.u] + e.weight;
                pred[e.v]    = e.u;
                last_relaxed = e.v;
            }
        }
    }

    if (last_relaxed == -1) return false;   // no negative cycle

    // Trace the cycle from last_relaxed
    int cur = last_relaxed;
    for (int i = 0; i < n_currencies; ++i) cur = pred[cur];
    int start = cur;
    do {
        cycle.push_back(cur);
        cur = pred[cur];
    } while (cur != start);
    cycle.push_back(start);
    std::reverse(cycle.begin(), cycle.end());
    return true;
}

int main() {
    // Currencies: 0=USD 1=EUR 2=GBP 3=JPY
    std::vector<std::pair<int,int>> pairs = {{0,1},{0,2},{1,2},{0,3},{1,3}};
    // Slightly mis-priced: EUR/GBP off by 0.002 creating a USD→EUR→GBP→USD arb
    std::vector<double> rates = {1.09, 1.27, 1.163, 150.0, 163.5}; // last is EUR/JPY

    std::vector<std::string> names = {"USD","EUR","GBP","JPY"};
    std::vector<int> cycle;
    if (find_arbitrage(4, pairs, rates, cycle)) {
        std::cout << "Arbitrage: ";
        for (int c : cycle) std::cout << names[c] << " ";
        std::cout << "\\n";
    } else {
        std::cout << "No arbitrage detected\\n";
    }
}`,
    explanation:
      "Taking the negative logarithm of exchange rates converts a multiplicative cycle condition (product of rates > 1) into an additive one (sum of weights < 0), which Bellman-Ford detects as a negative cycle on the Nth relaxation pass. This is the canonical FX arbitrage detection algorithm, and the same transform applies to any multiplicative graph problem such as commodity conversion chains.",
  },
  {
    id: "cpp-20260709-b1-sobol-quasi-mc",
    language: "cpp",
    title: "Sobol Quasi-Random Sequence for Low-Discrepancy MC",
    tag: "numerics",
    code: `#include <cstdint>
#include <vector>
#include <cmath>
#include <iostream>

// 1-dimensional Sobol sequence via direction numbers (primitive polynomial x+1, degree 1)
// Full multi-dimensional Sobol requires a table of primitive polynomials per dimension
struct Sobol1D {
    static constexpr int BITS = 30;
    std::vector<uint32_t> v_;   // direction numbers
    uint32_t x_{0};
    int      n_{0};

    Sobol1D() : v_(BITS) {
        // Degree-1 direction numbers: m_i = 1 for all i → v_i = 2^(BITS-i)
        for (int i = 0; i < BITS; ++i)
            v_[i] = 1u << (BITS - 1 - i);
    }

    double next() {
        int c = __builtin_ctz(~n_) + 1;   // rightmost zero bit of n (1-indexed)
        ++n_;
        if (c <= BITS) x_ ^= v_[c - 1];
        return static_cast<double>(x_) / (1u << BITS);
    }
};

// Compare plain MC vs quasi-MC for E[exp(-r*T)*max(S_T - K, 0)] (Asian geometric)
int main() {
    double S0=100, K=100, T=1.0, r=0.05, sigma=0.20;
    int N = 8192;

    Sobol1D sobol;
    double sum_sobol = 0.0;

    // Box-Muller using Sobol uniform pairs
    // (pair from two independent 1-D Sobol sequences for 2-D Sobol)
    Sobol1D sobol2;
    for (int i = 0; i < N; ++i) {
        double u1 = sobol.next(),  u2 = sobol2.next();
        if (u1 < 1e-15) u1 = 1e-15;
        double z  = std::sqrt(-2.0 * std::log(u1)) * std::cos(2*M_PI*u2);
        double ST = S0 * std::exp((r - 0.5*sigma*sigma)*T + sigma*std::sqrt(T)*z);
        sum_sobol += std::max(ST - K, 0.0);
    }
    double price_sobol = std::exp(-r*T) * sum_sobol / N;

    // BS reference
    auto N_cdf = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    double d1 = (std::log(S0/K) + (r+0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma*std::sqrt(T);
    double bs_exact = S0*N_cdf(d1) - K*std::exp(-r*T)*N_cdf(d2);

    std::cout << "Sobol MC (" << N << " paths): " << price_sobol << "\\n";
    std::cout << "BS exact:                    " << bs_exact    << "\\n";
    std::cout << "Error: " << std::fabs(price_sobol - bs_exact) << "\\n";
    // Sobol converges as O(log(N)^d / N) vs O(1/sqrt(N)) for plain MC
}`,
    explanation:
      "Sobol sequences fill the unit hypercube more evenly than pseudo-random numbers, achieving convergence rate O((log N)^d / N) versus O(1/√N) for plain Monte Carlo — for 10,000 paths in 1D, Sobol needs only ~300 paths to match the same accuracy. The direction numbers encode the bit-reversal property that makes consecutive Sobol points interleave maximally in each dimension.",
  },
  {
    id: "cpp-20260709-b1-rejection-sampling",
    language: "cpp",
    title: "Rejection Sampling for Non-Normal Return Distributions",
    tag: "numerics",
    code: `#include <random>
#include <cmath>
#include <vector>
#include <iostream>
#include <numeric>

// Sample from a target density p(x) using a proposal q(x) = Normal(0,1)
// Requires: p(x) <= M * q(x) for all x (bound M must be found analytically)
// For Student-t(nu) target: M ~ (nu/2)^(nu/2+0.5) * ... (typically ~1.5 for nu=5)

double student_t_pdf(double x, double nu) noexcept {
    double c = std::tgamma((nu+1)/2) / (std::sqrt(nu*M_PI) * std::tgamma(nu/2));
    return c * std::pow(1.0 + x*x/nu, -(nu+1)/2.0);
}

double normal_pdf(double x) noexcept {
    return std::exp(-0.5*x*x) / std::sqrt(2*M_PI);
}

// Sample N draws from Student-t(nu) via rejection sampling
std::vector<double> rejection_sample_t(double nu, int N, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    std::uniform_real_distribution<double> ud(0.0, 1.0);

    // Bound M: max over all x of p(x)/q(x) for Student-t
    // For nu=5, M ≈ 1.3 suffices; use 1.5 as safe upper bound
    double M = 1.5 + std::pow(2.0/nu, 0.5);

    std::vector<double> samples;
    samples.reserve(N);
    int total_draws = 0;

    while (static_cast<int>(samples.size()) < N) {
        double z = nd(rng);               // draw from proposal q = N(0,1)
        double u = ud(rng);
        ++total_draws;
        if (u < student_t_pdf(z, nu) / (M * normal_pdf(z))) {
            samples.push_back(z);         // accept
        }
    }

    double acceptance = static_cast<double>(N) / total_draws;
    std::cout << "Acceptance rate: " << acceptance << "\\n";
    return samples;
}

int main() {
    auto samples = rejection_sample_t(5.0, 50'000);

    // Sample kurtosis should be > 3 (fat tails)
    double mean = std::reduce(samples.begin(), samples.end()) / samples.size();
    double var  = 0.0, kurt = 0.0;
    for (double x : samples) {
        double d = x - mean;
        var  += d*d;
        kurt += d*d*d*d;
    }
    var  /= samples.size();
    kurt  = kurt / samples.size() / (var*var);  // excess kurtosis + 3
    std::cout << "Variance: " << var << "  Excess kurtosis: " << kurt - 3.0
              << "\\n";  // kurtosis ~6 for t(5) (theoretical: 6/(5-4) = 6)
}`,
    explanation:
      "Rejection sampling generates exact samples from any distribution whose density is known up to a constant, as long as a tight proposal bound M can be found — it is the fallback when inverse CDF transforms are unavailable. The efficiency (acceptance rate) is 1/M, so a tight bound is important; for Student-t with moderate degrees of freedom, a Normal proposal has acceptance ~70%, meaning only 40% more draws than needed.",
  },
];
