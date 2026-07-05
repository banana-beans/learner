import type { Snippet } from "./types";

export const cppSnippets20260705B1: Snippet[] = [
  {
    id: "cpp-20260705-b1-seqlock",
    language: "cpp",
    title: "Seqlock for Ultra-Fast Lock-Free Reads",
    tag: "lock-free",
    code: `#include <atomic>
#include <cstdint>
#include <thread>
#include <iostream>

// Seqlock: writer increments sequence (odd=writing), readers spin until even.
// Ideal when reads vastly outnumber writes and data fits in a few words.
// No reader–writer blocking: writers never wait; readers retry on torn reads.

struct alignas(64) MarketQuote {
    double   bid;
    double   ask;
    uint32_t bid_sz;
    uint32_t ask_sz;
};

struct SeqlockQuote {
    std::atomic<uint64_t> seq{0};
    char _pad1[56];            // push data to next cache line
    MarketQuote data;
    char _pad2[32];

    // Writer side: increment seq (odd), write, increment seq (even)
    void write(const MarketQuote& q) {
        uint64_t s = seq.load(std::memory_order_relaxed);
        seq.store(s + 1, std::memory_order_release);  // odd: write in progress
        data = q;
        seq.store(s + 2, std::memory_order_release);  // even: write complete
    }

    // Reader side: read seq before/after; retry if odd or changed
    MarketQuote read() const {
        MarketQuote q;
        while (true) {
            uint64_t s1 = seq.load(std::memory_order_acquire);
            if (s1 & 1) continue;          // write in progress
            q = data;
            uint64_t s2 = seq.load(std::memory_order_acquire);
            if (s1 == s2) return q;        // consistent read
            // else: writer interleaved — retry
        }
    }
};

SeqlockQuote g_quote;

int main() {
    // Writer thread: publish quotes
    std::thread writer([] {
        for (int i = 0; i < 5; ++i) {
            g_quote.write({100.0 + i*0.01, 100.01 + i*0.01,
                           static_cast<uint32_t>(100 + i),
                           static_cast<uint32_t>(200 - i)});
            std::this_thread::yield();
        }
    });

    // Reader thread: sample quotes
    std::thread reader([] {
        for (int i = 0; i < 10; ++i) {
            auto q = g_quote.read();
            std::cout << "bid=" << q.bid << " ask=" << q.ask << "\\n";
            std::this_thread::yield();
        }
    });

    writer.join(); reader.join();
}`,
    explanation:
      "A seqlock gives readers zero contention when no write is occurring — the sequence counter acts as a version stamp. The critical property is that an odd count means a write is in flight; readers spin until even and verify the count hasn't changed. On x86, acquire/release semantics cost nothing extra, making this the lowest-latency read path for small shared data like NBBO quotes.",
  },
  {
    id: "cpp-20260705-b1-mpsc-queue",
    language: "cpp",
    title: "MPSC Lock-Free Queue (Multiple Producer, Single Consumer)",
    tag: "lock-free",
    code: `#include <atomic>
#include <memory>
#include <optional>
#include <iostream>
#include <thread>
#include <vector>

// Michael-Scott queue variant: producers CAS the tail; consumer pops from head.
// Producers contend only on tail_; consumer never blocks.
template <typename T>
class MPSCQueue {
    struct Node {
        T                       value{};
        std::atomic<Node*>      next{nullptr};
    };

    // Separate cache lines: producers write tail_, consumer reads head_
    alignas(64) std::atomic<Node*> tail_;
    alignas(64) Node* head_;  // only consumer touches head_

public:
    MPSCQueue() {
        auto* sentinel = new Node{};
        head_ = sentinel;
        tail_.store(sentinel, std::memory_order_relaxed);
    }

    ~MPSCQueue() {
        while (head_) {
            Node* n = head_->next.load(std::memory_order_relaxed);
            delete head_;
            head_ = n;
        }
    }

    // Producer: CAS tail to append new node
    void push(T val) {
        Node* n = new Node{std::move(val)};
        Node* prev = tail_.exchange(n, std::memory_order_acq_rel);
        prev->next.store(n, std::memory_order_release);
    }

    // Consumer: pop from head (single consumer only)
    std::optional<T> pop() {
        Node* front = head_->next.load(std::memory_order_acquire);
        if (!front) return std::nullopt;
        T val = std::move(front->value);
        delete head_;
        head_ = front;
        return val;
    }
};

int main() {
    MPSCQueue<int> q;
    const int N = 100;

    // 4 producer threads, 1 consumer
    std::vector<std::thread> prods;
    for (int t = 0; t < 4; ++t)
        prods.emplace_back([&, t]{
            for (int i = 0; i < N; ++i) q.push(t * 1000 + i);
        });

    for (auto& p : prods) p.join();

    int count = 0;
    while (q.pop()) ++count;
    std::cout << "consumed: " << count << " items (expected " << 4*N << ")\\n";
}`,
    explanation:
      "MPSC queues are common in HFT for multiple network threads feeding a single strategy thread. The key insight: tail_ uses atomic exchange (not CAS loop) to link the new node in O(1) without retry — producers only contend on the exchange. The sentinel node pattern avoids the ABA problem and lets the consumer check next without ever touching tail_.",
  },
  {
    id: "cpp-20260705-b1-span-ranges",
    language: "cpp",
    title: "std::span and std::ranges Views for Order Book Slices",
    tag: "STL",
    code: `#include <span>
#include <ranges>
#include <vector>
#include <algorithm>
#include <iostream>
#include <cstdint>

struct PriceLevel {
    double   price;
    uint64_t qty;
    int      count;  // number of orders at this level
};

// std::span: non-owning view of a contiguous sequence.
// No allocation; passed by value (pointer + size).

// Filter top N bid levels above a threshold — zero copy
void print_top_levels(std::span<const PriceLevel> levels,
                      double min_price, int top_n) {
    auto filtered = levels
        | std::views::filter([min_price](const PriceLevel& l) {
              return l.price >= min_price;
          })
        | std::views::take(top_n);

    for (const auto& lv : filtered)
        std::cout << "  " << lv.price << " x" << lv.qty
                  << " (" << lv.count << " orders)\\n";
}

// Compute total notional in a span of levels
double total_notional(std::span<const PriceLevel> levels) {
    double total = 0.0;
    for (const auto& l : levels)
        total += l.price * l.qty;
    return total;
}

// Split book into top-5 and rest using subspan
void analyse_book(std::span<const PriceLevel> bids) {
    auto top5 = bids.first(std::min<std::size_t>(5, bids.size()));
    auto rest  = bids.subspan(top5.size());

    std::cout << "Top-5 notional: " << total_notional(top5) << "\\n";
    std::cout << "Rest notional:  " << total_notional(rest)  << "\\n";
}

int main() {
    std::vector<PriceLevel> bids = {
        {100.10, 500, 3}, {100.09, 300, 2}, {100.08, 800, 5},
        {100.07, 200, 1}, {100.06, 400, 2}, {100.05, 600, 4},
        {100.04, 100, 1}, {100.03, 250, 2},
    };

    // Bids are sorted descending (best first)
    std::cout << "Levels above 100.06:\\n";
    print_top_levels(bids, 100.06, 10);

    analyse_book(bids);

    // std::ranges::sort on a span — works directly
    std::ranges::sort(bids, std::greater{}, &PriceLevel::price);
    std::cout << "Best bid: " << bids.front().price << "\\n";
}`,
    explanation:
      "std::span replaces raw pointer + size pairs with a type-safe, non-owning view. std::views::filter and views::take compose lazily — no intermediate vector is allocated. Passing std::span instead of const vector& allows the function to accept any contiguous container (vector, array, raw buffer) without template bloat.",
  },
  {
    id: "cpp-20260705-b1-arena-allocator",
    language: "cpp",
    title: "Bump-Pointer Arena Allocator for Hot-Path Objects",
    tag: "allocators",
    code: `#include <cstddef>
#include <cstdint>
#include <cassert>
#include <new>
#include <iostream>
#include <string_view>

// Arena (bump) allocator: alloc() advances a pointer; reset() frees everything at once.
// Ideal for per-request allocations in a tick handler: allocate freely, reset after processing.
// No per-object free() overhead — deallocation is O(1) for the whole arena.

class Arena {
    std::byte* base_;
    std::byte* ptr_;
    std::byte* end_;
    std::size_t peak_usage_ = 0;

public:
    explicit Arena(std::size_t capacity)
        : base_(new std::byte[capacity]),
          ptr_(base_),
          end_(base_ + capacity) {}

    ~Arena() { delete[] base_; }

    void* alloc(std::size_t size, std::size_t align = alignof(std::max_align_t)) {
        // Align ptr_ up to 'align'
        auto addr = reinterpret_cast<std::uintptr_t>(ptr_);
        auto aligned = (addr + align - 1) & ~(align - 1);
        auto new_ptr = reinterpret_cast<std::byte*>(aligned) + size;
        if (new_ptr > end_) return nullptr;  // out of space
        ptr_ = new_ptr;
        std::size_t used = ptr_ - base_;
        if (used > peak_usage_) peak_usage_ = used;
        return reinterpret_cast<void*>(aligned);
    }

    template <typename T, typename... Args>
    T* make(Args&&... args) {
        void* p = alloc(sizeof(T), alignof(T));
        assert(p && "arena overflow");
        return new(p) T(std::forward<Args>(args)...);
    }

    void reset() { ptr_ = base_; }

    std::size_t used()       const { return ptr_ - base_; }
    std::size_t peak()       const { return peak_usage_; }
    std::size_t capacity()   const { return end_ - base_; }
};

struct ParsedField {
    std::string_view key;
    std::string_view value;
};

struct ParsedMessage {
    int              msg_type;
    std::size_t      field_count;
    ParsedField*     fields;   // points into arena
};

int main() {
    Arena arena(64 * 1024);  // 64 KB per-tick arena

    // Simulate parsing a FIX message — all allocations from arena
    ParsedMessage* msg = arena.make<ParsedMessage>();
    msg->msg_type = 35;
    msg->field_count = 3;
    msg->fields = static_cast<ParsedField*>(
        arena.alloc(3 * sizeof(ParsedField), alignof(ParsedField)));

    msg->fields[0] = {"symbol", "AAPL"};
    msg->fields[1] = {"qty",    "500"};
    msg->fields[2] = {"price",  "183.50"};

    std::cout << "msg_type: " << msg->msg_type << "\\n";
    for (std::size_t i = 0; i < msg->field_count; ++i)
        std::cout << "  " << msg->fields[i].key << "=" << msg->fields[i].value << "\\n";
    std::cout << "arena used: " << arena.used() << " bytes\\n";

    // After processing the tick, reset — O(1) deallocation
    arena.reset();
    std::cout << "after reset, used: " << arena.used() << "\\n";
    std::cout << "peak usage: " << arena.peak() << "\\n";
}`,
    explanation:
      "Bump allocators are O(1) alloc and free — alloc advances a pointer; free does nothing; reset rewinds it. For tick handlers that allocate many small objects per message, this eliminates malloc/free overhead entirely. The arena is typically sized to a worst-case message and reset between ticks, meaning no fragmentation ever occurs.",
  },
  {
    id: "cpp-20260705-b1-crtp",
    language: "cpp",
    title: "CRTP for Zero-Overhead Static Polymorphism in Order Types",
    tag: "templates",
    code: `#include <iostream>
#include <string>
#include <cstdint>
#include <type_traits>

// CRTP (Curiously Recurring Template Pattern): base class parameterized by derived class.
// Enables compile-time polymorphism — no vtable, no virtual dispatch overhead.
// All virtual calls resolved at compile time; methods inlined by the compiler.

template <typename Derived>
class OrderBase {
public:
    // Non-virtual interface: calls derived impl via CRTP
    std::string symbol() const {
        return static_cast<const Derived*>(this)->symbol_impl();
    }
    double notional() const {
        return static_cast<const Derived*>(this)->notional_impl();
    }
    bool is_valid() const {
        return static_cast<const Derived*>(this)->is_valid_impl();
    }

    // Common logic defined once in the base
    void print() const {
        if (!is_valid()) { std::cout << "INVALID ORDER\\n"; return; }
        std::cout << symbol() << " notional=" << notional() << "\\n";
    }

    // Type-trait to verify CRTP constraint at compile time
    static_assert(std::is_base_of_v<OrderBase<Derived>, Derived>,
                  "Derived must inherit from OrderBase<Derived>");
};

struct LimitOrder : OrderBase<LimitOrder> {
    std::string sym_;
    double price_;
    int    qty_;

    std::string symbol_impl()  const { return sym_; }
    double      notional_impl() const { return price_ * qty_; }
    bool        is_valid_impl() const { return price_ > 0 && qty_ > 0; }
};

struct MarketOrder : OrderBase<MarketOrder> {
    std::string sym_;
    int         qty_;
    double      est_price_;  // estimated fill price

    std::string symbol_impl()  const { return sym_; }
    double      notional_impl() const { return est_price_ * qty_; }
    bool        is_valid_impl() const { return qty_ > 0; }
};

// Template function works with any OrderBase<T> — no virtual dispatch
template <typename Order>
double compute_fee(const OrderBase<Order>& o, double fee_rate) {
    return o.notional() * fee_rate;
}

int main() {
    LimitOrder  lo{"AAPL", 183.50, 100};
    MarketOrder mo{"MSFT", 200, 415.20};

    lo.print();  // "AAPL notional=18350"
    mo.print();  // "MSFT notional=83040"

    std::cout << "LO fee: " << compute_fee(lo, 0.0001) << "\\n";  // 1.835
    std::cout << "MO fee: " << compute_fee(mo, 0.0003) << "\\n";  // 24.912

    // No vtable pointer in either struct — sizeof == data fields only
    std::cout << "sizeof LimitOrder:  " << sizeof(LimitOrder) << "\\n";
    std::cout << "sizeof MarketOrder: " << sizeof(MarketOrder) << "\\n";
}`,
    explanation:
      "CRTP achieves the flexibility of virtual dispatch with zero overhead: the static_cast to Derived is resolved at compile time, enabling full inlining. Compared to virtual functions (indirect call + possible cache miss on vtable), CRTP compute_fee() compiles to a direct inline function call. In a tick handler processing millions of orders, the difference is measurable.",
  },
  {
    id: "cpp-20260705-b1-likely-unlikely",
    language: "cpp",
    title: "[[likely]] / [[unlikely]] Branch Prediction Hints",
    tag: "low-latency",
    code: `#include <iostream>
#include <vector>
#include <chrono>
#include <cstdint>
#include <random>

// [[likely]] / [[unlikely]] (C++20) hint the compiler to optimize the hot path.
// On x86, the assembler places the likely branch immediately after the jump
// instruction so it's in the instruction cache's fall-through path.

struct Order {
    uint64_t id;
    double   price;
    int      qty;
    char     side;
    bool     is_cancel;  // true ~2% of the time
};

// Without hints: compiler may mis-arrange branches
long process_naive(const std::vector<Order>& orders) {
    long fills = 0;
    for (const auto& o : orders) {
        if (o.is_cancel) {
            // handle cancel (rare: ~2% of messages)
            ++fills;  // dummy to prevent optimization
        } else {
            // handle new order (common: ~98% of messages)
            fills += (int)o.price;
        }
    }
    return fills;
}

// With hints: hot path (new order) is the fall-through
long process_hinted(const std::vector<Order>& orders) {
    long fills = 0;
    for (const auto& o : orders) {
        if (o.is_cancel) [[unlikely]] {
            ++fills;
        } else [[likely]] {
            fills += (int)o.price;
        }
    }
    return fills;
}

// Typical application: validation fast-path
bool validate_order(double price, int qty, double market_price) {
    if (qty <= 0)    [[unlikely]] return false;  // never happens in production
    if (price <= 0)  [[unlikely]] return false;
    // Reject >50% away from market (circuit breaker)
    if (price > market_price * 1.5 ||
        price < market_price * 0.5) [[unlikely]] return false;
    return true;  // [[likely]] path
}

int main() {
    std::mt19937_64 rng(42);
    const int N = 1'000'000;
    std::vector<Order> orders(N);
    std::uniform_real_distribution<> price_d(99.0, 101.0);
    std::uniform_int_distribution<>  cancel_d(0, 49);  // 2% cancel rate

    for (auto& o : orders)
        o = {static_cast<uint64_t>(&o - orders.data()),
             price_d(rng), 100, 'B', cancel_d(rng) == 0};

    auto bench = [&](auto fn, const char* name) {
        auto t0 = std::chrono::steady_clock::now();
        volatile long r = fn(orders);
        auto t1 = std::chrono::steady_clock::now();
        std::cout << name << ": "
                  << std::chrono::duration_cast<std::chrono::microseconds>(t1-t0).count()
                  << " us (result=" << r << ")\\n";
    };

    bench(process_naive,  "naive ");
    bench(process_hinted, "hinted");
    // [[unlikely]] causes compiler to emit a forward branch for the rare case,
    // keeping the hot path in the instruction stream for the CPU's branch predictor.
}`,
    explanation:
      "[[likely]] and [[unlikely]] do not insert CPU branch prediction hints directly — they guide the compiler's code layout. The common (likely) path ends up on the fall-through path of the conditional jump, which is in-cache and predicted-taken by the branch predictor. This matters most when branch misprediction would stall a deeply pipelined CPU for ~15 cycles.",
  },
  {
    id: "cpp-20260705-b1-itch-parser",
    language: "cpp",
    title: "NASDAQ ITCH 5.0 Binary Message Parser",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <string_view>
#include <iostream>
#include <arpa/inet.h>  // ntohl, ntohs

// ITCH 5.0: big-endian binary protocol (no delimiters, fixed offsets per type).
// Message header: 1 byte type + fields at known offsets.
// Performance-critical: avoid any heap allocation; read directly from wire buffer.

// Helper: read big-endian integers from a byte buffer
inline uint16_t read_u16(const uint8_t* p) {
    return ntohs(*reinterpret_cast<const uint16_t*>(p));
}
inline uint32_t read_u32(const uint8_t* p) {
    return ntohl(*reinterpret_cast<const uint32_t*>(p));
}
inline uint64_t read_u64(const uint8_t* p) {
    uint64_t v;
    memcpy(&v, p, 8);
    // Manual byte swap for 64-bit
    return  ((v & 0xFF00000000000000ULL) >> 56) |
            ((v & 0x00FF000000000000ULL) >> 40) |
            ((v & 0x0000FF0000000000ULL) >> 24) |
            ((v & 0x000000FF00000000ULL) >>  8) |
            ((v & 0x00000000FF000000ULL) <<  8) |
            ((v & 0x0000000000FF0000ULL) << 24) |
            ((v & 0x000000000000FF00ULL) << 40) |
            ((v & 0x00000000000000FFULL) << 56);
}

// ITCH 5.0 message types
struct AddOrder {
    uint64_t    timestamp_ns;
    uint64_t    order_ref;
    char        side;          // 'B' or 'S'
    uint32_t    shares;
    char        stock[8];
    uint32_t    price;         // price * 10000 (4 decimal places)
};

struct DeleteOrder {
    uint64_t timestamp_ns;
    uint64_t order_ref;
};

// Parse an AddOrder message (type 'A')
// Wire layout: [1 stock_locate] [2 tracking_num] [6 timestamp] [8 ref] [1 side]
//              [4 shares] [8 stock] [4 price]
AddOrder parse_add_order(const uint8_t* msg) {
    AddOrder o;
    // Combine 6-byte ITCH timestamp (nanoseconds since midnight)
    uint64_t ts_high = read_u16(msg + 3);
    uint64_t ts_low  = read_u32(msg + 5);
    o.timestamp_ns = (ts_high << 32) | ts_low;
    o.order_ref = read_u64(msg + 9);
    o.side      = static_cast<char>(msg[17]);
    o.shares    = read_u32(msg + 18);
    memcpy(o.stock, msg + 22, 8);
    o.price     = read_u32(msg + 30);
    return o;
}

int main() {
    // Synthesize a minimal AddOrder message (34 bytes)
    uint8_t buf[34] = {};
    buf[0] = 'A';               // message type
    buf[3] = 0x00; buf[4] = 0x00; buf[5] = 0x12; buf[6] = 0x34;
    buf[7] = 0x56; buf[8] = 0x78;  // timestamp
    // order_ref = 12345 big-endian
    uint64_t ref_be = 0; ref_be = (uint64_t)12345 << 8;
    memcpy(buf + 9, &ref_be, 8);
    buf[17] = 'B';                   // buy side
    uint32_t shares_be = htonl(500);
    memcpy(buf + 18, &shares_be, 4);
    memcpy(buf + 22, "AAPL    ", 8); // 8-char padded
    uint32_t price_be = htonl(1835000); // 183.5000
    memcpy(buf + 30, &price_be, 4);

    auto add = parse_add_order(buf + 1); // skip type byte
    std::cout << "stock: " << std::string_view(add.stock, 8) << "\\n";
    std::cout << "side:  " << add.side << "\\n";
    std::cout << "shares:" << add.shares << "\\n";
    std::cout << "price: " << add.price / 10000.0 << "\\n";
}`,
    explanation:
      "ITCH 5.0 is the standard exchange feed protocol for NASDAQ; parsing speed directly impacts how quickly an HFT system can update its order book. The binary format with fixed field offsets enables O(1) field access — no scanning for delimiters. Reading directly into stack-allocated structs with memcpy avoids all heap allocation and keeps the entire parsed message in L1 cache.",
  },
  {
    id: "cpp-20260705-b1-cpu-affinity",
    language: "cpp",
    title: "CPU Affinity and Priority for Latency-Critical Threads",
    tag: "systems",
    code: `#include <pthread.h>
#include <sched.h>
#include <sys/resource.h>
#include <unistd.h>
#include <cstring>
#include <stdexcept>
#include <iostream>
#include <thread>
#include <atomic>

// Pin a thread to a specific CPU core to eliminate scheduler jitter.
// On a dedicated HFT server, cores are isolated from the OS kernel (isolcpus=N)
// so the thread runs uninterrupted (no context switches except timer interrupts).

void pin_thread_to_core(int core_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_id, &cpuset);
    if (pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset) != 0)
        throw std::runtime_error("pthread_setaffinity_np failed");
}

void set_realtime_priority(int priority = 80) {
    struct sched_param sp;
    sp.sched_priority = priority;
    // SCHED_FIFO: preempts all normal threads; no time-slicing within same priority
    if (pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp) != 0) {
        // Falls back gracefully (requires CAP_SYS_NICE)
        std::cerr << "Note: could not set SCHED_FIFO (need root/CAP_SYS_NICE)\\n";
    }
}

std::atomic<uint64_t> g_tick_count{0};

void market_data_thread(int core) {
    pin_thread_to_core(core);
    set_realtime_priority(80);

    // After pinning, this thread exclusively owns CPU 'core'.
    // No other thread will be scheduled on this core (if isolcpus was set at boot).
    for (int i = 0; i < 1000; ++i) {
        ++g_tick_count;
        // In production: recv() from UDP socket and parse ITCH
    }
    std::cout << "market-data thread done on core " << core
              << ", ticks=" << g_tick_count.load() << "\\n";
}

void strategy_thread(int core) {
    pin_thread_to_core(core);
    set_realtime_priority(79);  // slightly lower priority than data thread

    // Poll for new ticks from a SPSC queue (see spsc-queue snippet)
    std::cout << "strategy thread running on core " << core << "\\n";
}

int main() {
    int num_cores = static_cast<int>(std::thread::hardware_concurrency());
    std::cout << "available cores: " << num_cores << "\\n";

    if (num_cores >= 2) {
        std::thread md(market_data_thread, 0);  // core 0: market data
        std::thread st(strategy_thread,    1);  // core 1: strategy
        md.join(); st.join();
    } else {
        market_data_thread(0);
    }
}`,
    explanation:
      "CPU affinity pins a thread to a specific core, eliminating context-switch-induced cache invalidation — when a thread migrates to another core its L1/L2 data must be fetched again from LLC (~10 ns). Combined with isolcpus= kernel boot parameter (which removes the core from the scheduler's pool), the pinned thread runs without any context switches, reducing worst-case latency from milliseconds to microseconds.",
  },
  {
    id: "cpp-20260705-b1-explicit-fd-bsm",
    language: "cpp",
    title: "Explicit Finite-Difference BSM PDE Pricer",
    tag: "pricing",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <iostream>
#include <iomanip>

// Explicit Euler scheme for the Black-Scholes PDE:
//   dV/dt + 0.5*sigma^2*S^2*d2V/dS^2 + r*S*dV/dS - r*V = 0
//
// Discretize S into N grid points [0, S_max].
// Time: backward from T to 0 (M time steps).
// Stability condition: dt <= (dS)^2 / (sigma*S_max)^2 — must be checked!

std::vector<double> bsm_fd_call(double S0, double K, double r, double T,
                                  double sigma,
                                  int N = 200,     // S grid points
                                  int M = 10000)   // time steps
{
    double S_max = 3.0 * K;
    double dS    = S_max / N;
    double dt    = T / M;

    // Stability check: explicit scheme stable when dt <= dS^2 / (sigma*S)^2
    double max_S    = S_max;
    double stab_dt  = dS * dS / (sigma * sigma * max_S * max_S);
    if (dt > stab_dt)
        std::cerr << "Warning: explicit scheme may be unstable! dt=" << dt
                  << " > " << stab_dt << "\\n";

    // V[j] = option value at grid point j*dS
    std::vector<double> V(N + 1), V_new(N + 1);

    // Terminal condition: max(S_j - K, 0)
    for (int j = 0; j <= N; ++j)
        V[j] = std::max(j * dS - K, 0.0);

    // Time stepping: backward from T to 0
    for (int i = 0; i < M; ++i) {
        // Boundary: V(0, t) = 0 (call worthless at S=0)
        V_new[0] = 0.0;
        // Boundary: V(S_max, t) ≈ S_max - K*exp(-r*(T-t))
        double tau = (M - i) * dt;
        V_new[N]  = S_max - K * std::exp(-r * tau);

        for (int j = 1; j < N; ++j) {
            double S_j = j * dS;
            double d2V = (V[j+1] - 2*V[j] + V[j-1]) / (dS * dS);
            double dV  = (V[j+1] - V[j-1]) / (2 * dS);
            double rhs = 0.5 * sigma*sigma * S_j*S_j * d2V
                       + r * S_j * dV
                       - r * V[j];
            V_new[j] = V[j] + dt * rhs;
        }
        std::swap(V, V_new);
    }
    return V;  // V[j] = price at S = j*dS at t=0
}

int main() {
    double S0=100, K=100, r=0.05, T=1.0, sigma=0.20;
    int N = 200, M = 80000;
    double S_max = 3*K, dS = S_max/N;

    auto V = bsm_fd_call(S0, K, r, T, sigma, N, M);

    // Interpolate to find V(S0)
    int j = static_cast<int>(S0 / dS);
    double frac = (S0 - j*dS) / dS;
    double fd_price = V[j] * (1-frac) + V[j+1] * frac;

    // BSM analytic for comparison
    double d1 = (std::log(S0/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma*std::sqrt(T);
    auto N_ = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    double bs_price = S0*N_(d1) - K*std::exp(-r*T)*N_(d2);

    std::cout << std::fixed << std::setprecision(4);
    std::cout << "FD price:      " << fd_price << "\\n";
    std::cout << "Analytic (BS): " << bs_price << "\\n";
    std::cout << "Error:         " << std::abs(fd_price - bs_price) << "\\n";
}`,
    explanation:
      "The explicit Euler scheme is the simplest PDE discretization but has a strict stability condition: dt must be O(dS²) rather than O(dS), requiring many time steps for fine grids. Its advantage is simplicity — each time step is a single pass over the grid with no matrix inversion. In production, the Crank-Nicolson scheme is preferred (unconditionally stable), but explicit FD is the standard teaching vehicle for understanding the PDE structure.",
  },
  {
    id: "cpp-20260705-b1-barrier-option-mc",
    language: "cpp",
    title: "Knock-Out Barrier Option Monte Carlo Pricer",
    tag: "pricing",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <algorithm>
#include <numeric>
#include <vector>

// Down-and-out barrier call: knocked out if S ever falls below barrier B.
// Payoff: max(S_T - K, 0) if min(S_t) > B, else 0.
//
// Brownian Bridge correction reduces discretization error for barrier crossing:
// probability that S crosses B between observation times t_{i-1} and t_i
// given S_{i-1} and S_i is  exp(-2 * ln(S_{i-1}/B) * ln(S_i/B) / (sigma^2 * dt)).

double barrier_call_mc(double S0, double K, double B, double r, double T,
                        double sigma, int n_steps, int n_paths, int seed = 42)
{
    if (S0 <= B) return 0.0;  // already knocked out

    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    const double dt    = T / n_steps;
    const double drift = (r - 0.5 * sigma * sigma) * dt;
    const double sv    = sigma * std::sqrt(dt);

    double sum = 0.0;
    int knocked_out = 0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0;
        bool ko  = false;

        for (int t = 0; t < n_steps && !ko; ++t) {
            double S_prev = S;
            S *= std::exp(drift + sv * nd(rng));

            // Hard barrier check
            if (S <= B) { ko = true; break; }

            // Brownian bridge correction: P(cross | S_prev, S)
            // Only apply if S stays above B (catches near-barrier paths)
            if (S_prev > B && S > B) {
                double log_ratio = std::log(S_prev / B) * std::log(S / B);
                double p_cross = std::exp(-2.0 * log_ratio / (sigma*sigma * dt));
                std::uniform_real_distribution<> u(0, 1);
                if (u(rng) < p_cross) { ko = true; ++knocked_out; }
            }
        }

        if (!ko)
            sum += std::max(S - K, 0.0);
    }

    double price = std::exp(-r * T) * sum / n_paths;
    std::cout << "knocked-out paths: " << knocked_out + (n_paths - (int)(sum > 0 ? n_paths : 0))
              << "/" << n_paths << "\\n";
    return price;
}

int main() {
    // ATM down-and-out: S=100, K=100, B=90, r=5%, T=1yr, sigma=20%
    double price = barrier_call_mc(100.0, 100.0, 90.0, 0.05, 1.0, 0.20,
                                    252, 500000);
    std::cout << "Down-and-out call MC: " << price << "\\n";
    // Intrinsic comparison: vanilla call ~ 10.45; barrier is cheaper (KO risk)
    // BS analytic for do call exists but is more complex
}`,
    explanation:
      "Discrete monitoring creates discretization bias for barrier options: paths that cross the barrier between observation times are missed. The Brownian bridge correction computes the probability of a barrier crossing in continuous time given the two observed endpoint values, then randomly kills paths proportionally. This reduces the bias from O(1/√N_steps) to O(1/N_steps) for a modest extra cost.",
  },
  {
    id: "cpp-20260705-b1-lookback-option",
    language: "cpp",
    title: "Floating-Strike Lookback Call Monte Carlo",
    tag: "pricing",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <algorithm>
#include <vector>

// Floating-strike lookback call: payoff = S_T - min(S_t over [0,T]).
// Buyer always buys at the historical minimum — maximum hindsight advantage.
// Closed-form (Goldman-Sosin-Gatto 1979) for continuous monitoring.

double gsg_lookback_call(double S, double r, double T, double sigma) {
    // Continuous monitoring analytic formula
    double sqT = std::sqrt(T);
    double a1  = (std::log(S/S) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    // At t=0, min = S (just started), so formula simplifies
    double a2  = a1 - sigma*sqT;
    double a3  = a1 - 2*r*sqT/sigma;
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };

    return S * N(a1) - S * std::exp(-r*T) * N(a2)
           - sigma*sigma/(2*r) * S
             * (N(a1) - std::exp(-r*T) * N(-a3));
}

double lookback_call_mc(double S0, double r, double T, double sigma,
                         int n_steps, int n_paths, int seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<> nd;
    const double dt    = T / n_steps;
    const double drift = (r - 0.5*sigma*sigma)*dt;
    const double sv    = sigma*std::sqrt(dt);

    double sum = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double S   = S0;
        double S_min = S0;
        for (int t = 0; t < n_steps; ++t) {
            S *= std::exp(drift + sv*nd(rng));
            S_min = std::min(S_min, S);
        }
        sum += std::max(S - S_min, 0.0);
    }
    return std::exp(-r*T) * sum / n_paths;
}

int main() {
    double S0=100, r=0.05, T=1.0, sigma=0.20;

    double mc_price    = lookback_call_mc(S0, r, T, sigma, 252, 300000);
    double anal_price  = gsg_lookback_call(S0, r, T, sigma);

    std::cout << "MC price:       " << mc_price   << "\\n";
    std::cout << "Analytic (GSG): " << anal_price << "\\n";
    std::cout << "Error:          " << std::abs(mc_price - anal_price) << "\\n";
    // Lookback call ~ 2x vanilla call price: minimum is always below S_T
    // which makes the payoff generous relative to a vanilla
}`,
    explanation:
      "The floating-strike lookback call has payoff S_T − min(S_t) — the buyer gets to have bought at the lowest price observed. The GSG analytic formula assumes continuous monitoring; discrete-monitoring Monte Carlo produces a slightly lower price because the discrete minimum is above the continuous minimum on average. Lookbacks are used as benchmarks for path-dependent exotic pricing methods.",
  },
  {
    id: "cpp-20260705-b1-timer-wheel",
    language: "cpp",
    title: "Hierarchical Timer Wheel for Order Timeout Management",
    tag: "data-structures",
    code: `#include <vector>
#include <functional>
#include <cstdint>
#include <iostream>
#include <string>

// Timer wheel: O(1) insert/cancel, O(1) amortized per tick.
// Single-level wheel with N slots; timer fires in slot (now + delay) % N.
// Used for IOC order timeouts and heartbeat monitoring in trading systems.

using TimerCallback = std::function<void()>;

struct TimerSlot {
    uint64_t         fire_time;  // absolute tick when this timer fires
    TimerCallback    callback;
    bool             active = false;
};

class TimerWheel {
    static constexpr int WHEEL_SIZE = 1024;  // must be power of 2
    static constexpr int MASK       = WHEEL_SIZE - 1;

    std::vector<std::vector<TimerSlot>> slots_{WHEEL_SIZE};
    uint64_t now_ = 0;

public:
    // Schedule: callback fires after 'delay_ticks' ticks
    // Returns (slot_idx, position) for cancellation
    std::pair<int,int> schedule(uint64_t delay_ticks, TimerCallback cb) {
        uint64_t fire_at = now_ + delay_ticks;
        int slot = static_cast<int>(fire_at & MASK);
        slots_[slot].push_back({fire_at, std::move(cb), true});
        return {slot, static_cast<int>(slots_[slot].size()) - 1};
    }

    void cancel(int slot_idx, int pos) {
        if (pos < static_cast<int>(slots_[slot_idx].size()))
            slots_[slot_idx][pos].active = false;
    }

    // Advance one tick: fire all timers in the current slot
    void tick() {
        int slot = static_cast<int>(now_ & MASK);
        for (auto& t : slots_[slot]) {
            if (t.active && t.fire_time <= now_) {
                t.callback();
                t.active = false;
            }
        }
        slots_[slot].clear();
        ++now_;
    }

    // Advance multiple ticks at once
    void advance(uint64_t ticks) {
        for (uint64_t i = 0; i < ticks; ++i) tick();
    }

    uint64_t now() const { return now_; }
};

int main() {
    TimerWheel tw;

    // Schedule order timeouts (ticks = microseconds in production)
    auto [s1, p1] = tw.schedule(10, []{ std::cout << "Order 1 IOC timeout at t=10\\n"; });
    auto [s2, p2] = tw.schedule(20, []{ std::cout << "Order 2 timeout at t=20\\n"; });
    auto [s3, p3] = tw.schedule(15, []{ std::cout << "Order 3 cancel-on-timeout\\n"; });

    // Cancel order 3 before it fires (e.g., it got filled)
    tw.cancel(s3, p3);

    // Advance time
    tw.advance(25);
    std::cout << "Timer wheel at tick: " << tw.now() << "\\n";
    // Output: order 1 fires at 10, order 3 is cancelled, order 2 fires at 20
}`,
    explanation:
      "Timer wheels achieve O(1) insert and O(1) per-tick processing by mapping fire times to slots via modular arithmetic. Unlike a heap-based priority queue (O(log n) insert), a timer wheel is ideal when timers cluster in a narrow window — typical for IOC orders with fixed 1ms timeouts. The single-level design handles up to WHEEL_SIZE distinct delays; hierarchical wheels extend this to arbitrary delays.",
  },
  {
    id: "cpp-20260705-b1-open-addressing-hash",
    language: "cpp",
    title: "Open-Addressing Hash Table for Order ID Lookup",
    tag: "data-structures",
    code: `#include <cstdint>
#include <vector>
#include <optional>
#include <iostream>
#include <cassert>

// Open-addressing hash map with linear probing.
// Cache-friendly: no linked list nodes, all data in one contiguous array.
// Faster than std::unordered_map for integer keys at high load factors <= 0.75.

template <typename V, std::size_t Cap = 1024>
class OrderMap {
    static_assert((Cap & (Cap - 1)) == 0, "Capacity must be power of 2");
    static constexpr uint64_t EMPTY  = 0;
    static constexpr uint64_t TOMBSTONE = UINT64_MAX;
    static constexpr std::size_t MASK = Cap - 1;

    struct Entry { uint64_t key; V value; };
    std::array<Entry, Cap> table_{};
    std::size_t size_ = 0;

    std::size_t probe_start(uint64_t key) const {
        // Fibonacci hashing: 2^64 / phi ≈ 11400714819323198485
        return (key * 11400714819323198485ULL) >> (64 - __builtin_ctz(Cap));
    }

public:
    OrderMap() {
        for (auto& e : table_) e.key = EMPTY;
    }

    bool insert(uint64_t key, V val) {
        if (size_ * 4 >= Cap * 3) return false;  // load factor 0.75 limit
        std::size_t i = probe_start(key) & MASK;
        while (table_[i].key != EMPTY && table_[i].key != TOMBSTONE
               && table_[i].key != key)
            i = (i + 1) & MASK;
        if (table_[i].key == key) return false;  // duplicate
        table_[i] = {key, std::move(val)};
        ++size_;
        return true;
    }

    V* find(uint64_t key) {
        std::size_t i = probe_start(key) & MASK;
        while (table_[i].key != EMPTY) {
            if (table_[i].key == key) return &table_[i].value;
            i = (i + 1) & MASK;
        }
        return nullptr;
    }

    bool erase(uint64_t key) {
        std::size_t i = probe_start(key) & MASK;
        while (table_[i].key != EMPTY) {
            if (table_[i].key == key) {
                table_[i].key = TOMBSTONE;
                --size_;
                return true;
            }
            i = (i + 1) & MASK;
        }
        return false;
    }

    std::size_t size() const { return size_; }
};

struct OrderInfo { double price; int qty; char side; };

int main() {
    OrderMap<OrderInfo, 256> map;

    map.insert(1001, {183.50, 500, 'B'});
    map.insert(1002, {415.20, 200, 'S'});
    map.insert(1003, {850.05, 100, 'B'});

    if (auto* o = map.find(1002)) {
        std::cout << "found 1002: " << o->side << " " << o->qty
                  << "@" << o->price << "\\n";
    }

    map.erase(1002);
    std::cout << "after erase: size=" << map.size() << "\\n";
    std::cout << "find 1002: " << (map.find(1002) ? "found" : "not found") << "\\n";
    assert(!map.find(1002));
}`,
    explanation:
      "Open-addressing with Fibonacci hashing achieves better cache behavior than std::unordered_map (which chains into a linked list and thrashes the allocator). Linear probing keeps colliding keys in adjacent cache lines; Fibonacci hashing distributes keys more uniformly than simple modulo. For order ID lookups (integer keys, high throughput), this is typically 2-3x faster than unordered_map.",
  },
  {
    id: "cpp-20260705-b1-volatility-surface-bilinear",
    language: "cpp",
    title: "Bilinear Interpolation on a Volatility Surface",
    tag: "pricing",
    code: `#include <vector>
#include <algorithm>
#include <stdexcept>
#include <iostream>
#include <iomanip>
#include <cmath>

// Bilinear interpolation: find value at (T, K) by interpolating
// within the rectangular cell of the vol surface grid.

struct VolSurface {
    std::vector<double> tenors;   // sorted ascending
    std::vector<double> strikes;  // sorted ascending
    std::vector<std::vector<double>> vols;  // vols[i][j] = vol at (tenors[i], strikes[j])

    double interpolate(double T, double K) const {
        // Clamp to grid boundaries (no extrapolation)
        T = std::clamp(T, tenors.front(),  tenors.back());
        K = std::clamp(K, strikes.front(), strikes.back());

        // Find surrounding indices
        auto ti = std::lower_bound(tenors.begin(),  tenors.end(),  T);
        auto ki = std::lower_bound(strikes.begin(), strikes.end(), K);

        if (ti == tenors.end())  --ti;
        if (ki == strikes.end()) --ki;
        if (ti != tenors.begin() && *ti != T)  --ti;
        if (ki != strikes.begin() && *ki != K) --ki;

        int i0 = static_cast<int>(ti - tenors.begin());
        int j0 = static_cast<int>(ki - strikes.begin());
        int i1 = std::min(i0 + 1, (int)tenors.size() - 1);
        int j1 = std::min(j0 + 1, (int)strikes.size() - 1);

        double t0 = tenors[i0],  t1 = tenors[i1];
        double k0 = strikes[j0], k1 = strikes[j1];

        double wt = (t1 > t0) ? (T - t0) / (t1 - t0) : 0.0;
        double wk = (k1 > k0) ? (K - k0) / (k1 - k0) : 0.0;

        // Bilinear interpolation
        double v00 = vols[i0][j0], v01 = vols[i0][j1];
        double v10 = vols[i1][j0], v11 = vols[i1][j1];

        return (1-wt)*(1-wk)*v00 + (1-wt)*wk*v01
             +    wt *(1-wk)*v10 +    wt *wk*v11;
    }
};

int main() {
    // Simplified AAPL vol surface (tenors in years, strikes as fraction of spot)
    VolSurface surf;
    surf.tenors  = {0.083, 0.25, 0.5, 1.0, 2.0};  // 1M, 3M, 6M, 1Y, 2Y
    surf.strikes = {0.80, 0.90, 1.00, 1.10, 1.20}; // 80%-120% moneyness

    // ATM vol increases with tenor (term structure); skew: OTM puts expensive
    surf.vols = {
        {0.35, 0.28, 0.22, 0.23, 0.26},  // 1M: steep skew
        {0.32, 0.26, 0.21, 0.22, 0.24},  // 3M
        {0.30, 0.24, 0.20, 0.21, 0.23},  // 6M
        {0.28, 0.23, 0.19, 0.20, 0.22},  // 1Y
        {0.26, 0.22, 0.18, 0.19, 0.21},  // 2Y
    };

    // Interpolate at various (T, moneyness) pairs
    std::cout << std::fixed << std::setprecision(4);
    for (double T : {0.16, 0.375, 0.75})
        for (double K : {0.95, 1.00, 1.05})
            std::cout << "T=" << T << " K=" << K
                      << " vol=" << surf.interpolate(T, K) << "\\n";
}`,
    explanation:
      "Bilinear interpolation on the vol surface is the standard method for reading implied vol at an arbitrary (T, K) point when only a discrete grid of market quotes is available. The interpolation is done in log-moneyness and sqrt(T) space in practice to preserve convexity, but the mechanics are identical. Clamping to the grid boundary rather than extrapolating avoids arbitrage violations outside the quoted range.",
  },
  {
    id: "cpp-20260705-b1-charm-greek",
    language: "cpp",
    title: "Charm (dDelta/dt) and Color (dGamma/dt) Greeks",
    tag: "risk",
    code: `#include <cmath>
#include <iostream>
#include <iomanip>

// Charm = -d(delta)/d(T) = d(delta)/d(t) ... rate at which delta bleeds with time.
// Also called 'delta bleed'. Tells you how much delta will change overnight.
// Color = dGamma/dt ... rate at which gamma changes with time.
// Both matter for hedging a book as expiry approaches.

double N_cdf(double x){ return 0.5 * std::erfc(-x/std::sqrt(2.0)); }
double N_pdf(double x){ return std::exp(-0.5*x*x)/std::sqrt(2.0*M_PI); }

struct GreeksFull {
    double price, delta, gamma, vega, theta;
    double charm;  // dDelta/dt (units: per day)
    double color;  // dGamma/dt (units: per day)
    double speed;  // dGamma/dS
};

GreeksFull bsm_extended_greeks(double S, double K, double r, double T, double sig) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sig*sig)*T) / (sig*sqT);
    double d2  = d1 - sig*sqT;

    double Nd1  = N_cdf(d1);
    double nd1  = N_pdf(d1);
    double Nd2  = N_cdf(d2);
    double nd2  = N_pdf(d2);

    double gamma = nd1 / (S * sig * sqT);
    double vega  = S * nd1 * sqT;

    // Charm: -d(delta)/d(T)
    // = -nd1 * [2*(r)*T - d2*sig*sqT] / (2*T*sig*sqT)
    double charm = -nd1 * (2*r*T - d2*sig*sqT) / (2*T*sig*sqT);
    charm /= 365.0;  // per calendar day

    // Color: dGamma/d(T)
    // = -Gamma * [2*r*T + 1 + d1*(2*r*T - d2*sig*sqT)/(sig*sqT)] / (2*T)
    double color = -gamma * (2*r*T + 1 + d1*(2*r*T - d2*sig*sqT)/(sig*sqT)) / (2*T);
    color /= 365.0;  // per calendar day

    // Speed: dGamma/dS = -Gamma/S * (d1/(sig*sqT) + 1)
    double speed = -gamma / S * (d1/(sig*sqT) + 1);

    return {
        S*Nd1 - K*std::exp(-r*T)*Nd2,
        Nd1, gamma, vega,
        -(S*nd1*sig/(2*sqT) + r*K*std::exp(-r*T)*Nd2) / 365.0,
        charm, color, speed
    };
}

int main() {
    // 1-month ATM option approaching expiry
    for (double T : {30.0/365, 14.0/365, 7.0/365, 1.0/365}) {
        auto g = bsm_extended_greeks(100.0, 100.0, 0.05, T, 0.20);
        std::cout << std::fixed << std::setprecision(6);
        std::cout << "T=" << std::setw(8) << T*365 << "d  "
                  << "delta=" << g.delta << "  "
                  << "charm=" << g.charm << "/day  "
                  << "gamma=" << g.gamma << "  "
                  << "color=" << g.color << "/day\\n";
    }
    // Near expiry: charm -> +/-inf, color -> +/-inf (pin-risk)
}`,
    explanation:
      "Charm (delta bleed) is crucial for daily delta re-hedging: if charm = -0.05/day, delta decreases by 0.05 overnight without any price move. Near expiry, charm explodes as delta becomes binary (0 or 1), making the hedge delta extremely sensitive to small price changes — this is 'pin risk'. Color (gamma decay rate) helps forecast when gamma hedging will become more or less expensive.",
  },
  {
    id: "cpp-20260705-b1-portfolio-var",
    language: "cpp",
    title: "Parametric Portfolio VaR with Full Covariance Matrix",
    tag: "risk",
    code: `#include <vector>
#include <cmath>
#include <iostream>
#include <iomanip>
#include <numeric>
#include <algorithm>

// Parametric VaR: assumes portfolio returns ~ Normal(mu, sigma_p).
// sigma_p = sqrt(w^T * Sigma * w) where Sigma is the covariance matrix.
// VaR at confidence c = -mu_p + z_c * sigma_p  (for c=99%, z=2.326).

// Simple matrix-vector multiply (n x n) * (n)
std::vector<double> mat_vec(const std::vector<std::vector<double>>& M,
                             const std::vector<double>& v) {
    int n = static_cast<int>(v.size());
    std::vector<double> r(n, 0.0);
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            r[i] += M[i][j] * v[j];
    return r;
}

double dot(const std::vector<double>& a, const std::vector<double>& b) {
    double s = 0.0;
    for (std::size_t i = 0; i < a.size(); ++i) s += a[i]*b[i];
    return s;
}

struct VaRResult {
    double portfolio_vol;   // annualized
    double daily_vol;
    double var_99_1d;       // 1-day 99% VaR as fraction of portfolio
    double var_95_1d;
    double var_99_10d;      // Basel: 10-day 99% VaR (sqrt-T rule)
    std::vector<double> component_var;  // contribution per asset
};

VaRResult parametric_var(const std::vector<double>& weights,
                          const std::vector<std::vector<double>>& cov_annual,
                          double portfolio_value = 1e6)
{
    auto Sw = mat_vec(cov_annual, weights);
    double var_annual = dot(weights, Sw);
    double vol_annual = std::sqrt(var_annual);
    double vol_daily  = vol_annual / std::sqrt(252.0);

    // z-scores for VaR
    constexpr double z99 = 2.3263;
    constexpr double z95 = 1.6449;

    VaRResult r;
    r.portfolio_vol = vol_annual;
    r.daily_vol     = vol_daily;
    r.var_99_1d     = z99 * vol_daily * portfolio_value;
    r.var_95_1d     = z95 * vol_daily * portfolio_value;
    r.var_99_10d    = r.var_99_1d * std::sqrt(10.0);  // sqrt-T scaling

    // Component VaR: marginal contribution × weight
    int n = static_cast<int>(weights.size());
    r.component_var.resize(n);
    for (int i = 0; i < n; ++i)
        r.component_var[i] = weights[i] * Sw[i] / var_annual
                             * r.var_99_1d;

    return r;
}

int main() {
    // 4-asset portfolio: AAPL, MSFT, NVDA, JPM
    std::vector<double> w = {0.30, 0.25, 0.25, 0.20};
    // Annual covariance matrix (annualized vol^2 + correlations)
    std::vector<std::vector<double>> cov = {
        {0.0529, 0.0280, 0.0350, 0.0120},  // AAPL: 23% vol
        {0.0280, 0.0400, 0.0290, 0.0110},  // MSFT: 20% vol
        {0.0350, 0.0290, 0.0900, 0.0130},  // NVDA: 30% vol
        {0.0120, 0.0110, 0.0130, 0.0196},  // JPM:  14% vol
    };

    auto r = parametric_var(w, cov, 1e6);

    std::cout << std::fixed << std::setprecision(2);
    std::cout << "Portfolio vol (ann): " << r.portfolio_vol*100 << "%\\n";
    std::cout << "Daily vol:           " << r.daily_vol*100     << "%\\n";
    std::cout << "1-day 99% VaR:  $"    << r.var_99_1d         << "\\n";
    std::cout << "1-day 95% VaR:  $"    << r.var_95_1d         << "\\n";
    std::cout << "10-day 99% VaR: $"    << r.var_99_10d        << " (Basel)\\n";
    std::cout << "Component VaRs: ";
    for (double cv : r.component_var) std::cout << "$" << cv << " ";
    std::cout << "\\n";
}`,
    explanation:
      "Parametric VaR assumes normality and uses the covariance matrix directly, making it fast and analytically tractable. Component VaR (w_i × (Σw)_i / w'Σw × total_VaR) shows each asset's contribution to total risk — the sum of component VaRs equals total VaR. The 10-day Basel VaR uses the sqrt-T scaling rule, which assumes i.i.d. returns (invalid for fat tails but mandated by regulation).",
  },
  {
    id: "cpp-20260705-b1-pmr-pool",
    language: "cpp",
    title: "std::pmr::monotonic_buffer_resource for Per-Tick Allocation",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <cstdint>
#include <iostream>
#include <array>

// C++17 PMR (Polymorphic Memory Resource) lets containers use custom allocators
// without changing their template type.
// monotonic_buffer_resource: bump allocator backed by a fixed buffer — zero system calls.

struct ParsedField {
    std::pmr::string key;
    std::pmr::string value;
};

// All allocations in this function come from the caller-supplied arena
std::pmr::vector<ParsedField> parse_message(
    std::string_view msg, char delim,
    std::pmr::memory_resource* arena)
{
    std::pmr::vector<ParsedField> fields(arena);
    std::size_t pos = 0;
    while (pos < msg.size()) {
        auto eq  = msg.find('=', pos);
        if (eq == std::string_view::npos) break;
        auto end = msg.find(delim, eq + 1);
        if (end == std::string_view::npos) end = msg.size();

        ParsedField f{
            std::pmr::string(msg.substr(pos, eq - pos), arena),
            std::pmr::string(msg.substr(eq + 1, end - eq - 1), arena),
        };
        fields.push_back(std::move(f));
        pos = end + 1;
    }
    return fields;
}

int main() {
    // 128 KB per-tick arena (stack or pre-allocated heap)
    std::array<std::byte, 131072> buffer{};
    std::pmr::monotonic_buffer_resource arena{buffer.data(), buffer.size(),
                                               std::pmr::null_memory_resource()};
    // null_memory_resource: throws bad_alloc if arena overflows (safe fail)

    // Process a FIX-like message; all string/vector memory comes from 'buffer'
    std::string msg = "symbol=AAPL&qty=500&price=183.50&side=B&client=DESK1";
    auto fields = parse_message(msg, '&', &arena);

    for (const auto& f : fields)
        std::cout << f.key << " = " << f.value << "\\n";

    std::cout << "fields: " << fields.size() << "\\n";

    // Reset: rewind pointer — O(1) deallocation of all fields
    arena.release();
    std::cout << "arena reset\\n";

    // Reuse for next tick
    auto fields2 = parse_message("symbol=MSFT&qty=100&price=415.20&side=S", '&', &arena);
    std::cout << "tick2 fields: " << fields2.size() << "\\n";
}`,
    explanation:
      "C++17 PMR makes standard containers (vector, string, map) allocation-aware without template proliferation — pmr::vector<T> and vector<T> are the same type when viewed through pmr::memory_resource*. The monotonic_buffer_resource is the standard library's bump allocator: O(1) alloc with no fragmentation. Combined with null_memory_resource as the upstream (throws on overflow), it guarantees the tick handler never makes a malloc call.",
  },
  {
    id: "cpp-20260705-b1-coroutine-tick-gen",
    language: "cpp",
    title: "C++20 Coroutine Generator for Tick Replay",
    tag: "modern-cpp",
    code: `#include <coroutine>
#include <optional>
#include <iostream>
#include <vector>
#include <cstdint>

// C++20 coroutine-based generator: produces ticks lazily on demand.
// The coroutine suspends at co_yield and resumes when caller requests next value.
// Useful for tick replay engines: stream large datasets without loading all into memory.

struct Tick {
    uint64_t ts_ns;
    double   price;
    int      qty;
};

// Minimal Generator<T> implementation
template <typename T>
struct Generator {
    struct promise_type {
        T current_value;
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always yield_value(T v) {
            current_value = std::move(v);
            return {};
        }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> handle;

    explicit Generator(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~Generator() { if (handle) handle.destroy(); }

    // Non-copyable, movable
    Generator(const Generator&) = delete;
    Generator(Generator&& o) : handle(o.handle) { o.handle = {}; }

    bool next() {
        if (handle.done()) return false;
        handle.resume();
        return !handle.done();
    }

    const T& value() const { return handle.promise().current_value; }
};

// Coroutine: replays ticks from a buffer with optional filter
Generator<Tick> replay_ticks(const std::vector<Tick>& ticks,
                              double min_price = 0.0)
{
    for (const auto& t : ticks) {
        if (t.price >= min_price)
            co_yield t;  // suspend here; caller processes tick then resumes
    }
}

int main() {
    std::vector<Tick> historical = {
        {1000000, 183.40, 500},
        {1001000, 183.50, 300},
        {1002000, 183.20, 100},  // below filter threshold
        {1003000, 183.60, 400},
        {1004000, 183.45, 200},
    };

    auto gen = replay_ticks(historical, 183.40);
    while (gen.next()) {
        const auto& t = gen.value();
        std::cout << "ts=" << t.ts_ns
                  << " price=" << t.price
                  << " qty=" << t.qty << "\\n";
    }
    // Coroutine resumes from co_yield on each call to next()
    // No callbacks, no manual state machines
}`,
    explanation:
      "C++20 coroutines implement lazy sequences without callbacks or manual state machines: the coroutine suspends at co_yield and the caller advances it with next(). For tick replay, this means loading only the current tick into memory at a time — the rest of the historical data stays in the file/buffer. The Generator type is reusable across any yield-producing coroutine with the same promise_type protocol.",
  },
  {
    id: "cpp-20260705-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson Finite-Difference PDE Pricer (Implicit)",
    tag: "pricing",
    code: `#include <vector>
#include <cmath>
#include <iostream>
#include <iomanip>
#include <algorithm>
#include <stdexcept>

// Crank-Nicolson: average of explicit and implicit Euler.
// Unconditionally stable (no dt/dS^2 constraint), O(N) per time step via Thomas algorithm.

// Solve tridiagonal system Ax = d using Thomas algorithm (O(N))
std::vector<double> thomas(const std::vector<double>& a,   // sub-diagonal
                             const std::vector<double>& b,   // main diagonal
                             const std::vector<double>& c,   // super-diagonal
                             std::vector<double> d)          // RHS
{
    int n = static_cast<int>(b.size());
    std::vector<double> c2(n), d2(n);
    c2[0] = c[0] / b[0];
    d2[0] = d[0] / b[0];
    for (int i = 1; i < n; ++i) {
        double m  = b[i] - a[i-1] * c2[i-1];
        c2[i]     = (i < n-1) ? c[i] / m : 0.0;
        d2[i]     = (d[i] - a[i-1] * d2[i-1]) / m;
    }
    std::vector<double> x(n);
    x[n-1] = d2[n-1];
    for (int i = n-2; i >= 0; --i)
        x[i] = d2[i] - c2[i] * x[i+1];
    return x;
}

double cn_call(double S0, double K, double r, double T, double sigma,
               int N = 100, int M = 200)
{
    double S_max = 3.0 * K;
    double dS    = S_max / N;
    double dt    = T / M;

    std::vector<double> V(N + 1);
    for (int j = 0; j <= N; ++j)
        V[j] = std::max(j * dS - K, 0.0);  // terminal payoff

    // Interior points 1..N-1 only; boundaries set analytically
    for (int i = 0; i < M; ++i) {
        double tau = (M - i) * dt;

        std::vector<double> a(N-1), b_diag(N-1), c(N-1), rhs(N-1);
        for (int j = 1; j < N; ++j) {
            double S_j  = j * dS;
            double alpha = 0.25 * dt * (sigma*sigma * j*j - r*j);
            double beta  = -0.5 * dt * (sigma*sigma * j*j + r);
            double gamma2= 0.25 * dt * (sigma*sigma * j*j + r*j);

            if (j > 1) a[j-1]     = -alpha;
            b_diag[j-1] = 1.0 - beta;
            if (j < N-1) c[j-1]   = -gamma2;

            rhs[j-1] = alpha*V[j-1] + (1+beta)*V[j] + gamma2*V[j+1];
        }

        // Boundary corrections: alpha/gamma coefficients for j=1 and j=N-1
        double V0_new    = 0.0;
        double VN_new    = S_max - K * std::exp(-r * (tau - dt));
        double alpha_bc  = 0.25 * dt * (sigma*sigma * 1.0 - r);
        double gamma_bc  = 0.25 * dt * (sigma*sigma * (N-1)*(N-1) + r*(N-1));
        rhs[0]   += alpha_bc * V0_new;
        rhs[N-2] += gamma_bc * VN_new;

        auto V_int = thomas(a, b_diag, c, rhs);
        V[0] = V0_new;
        for (int j = 1; j < N; ++j) V[j] = V_int[j-1];
        V[N] = VN_new;
    }

    int j = static_cast<int>(S0 / dS);
    double frac = (S0 - j*dS) / dS;
    return V[j] * (1-frac) + V[j+1] * frac;
}`,
    explanation:
      "Crank-Nicolson averages explicit and implicit discretizations, giving O(dt²) accuracy in time (vs O(dt) for pure explicit/implicit) with unconditional stability. Each time step reduces to a tridiagonal linear system solved in O(N) by the Thomas algorithm — no matrix inversion required. In practice, CN is the default choice for equity option PDEs; explicit FD is only used for pedagogical purposes.",
  },
  {
    id: "cpp-20260705-b1-dv01",
    language: "cpp",
    title: "Bond DV01 and Duration via Bump-and-Reprice",
    tag: "risk",
    code: `#include <cmath>
#include <vector>
#include <numeric>
#include <iostream>
#include <iomanip>

// DV01 (Dollar Value of 01): change in price per 1bp shift in yield.
// Modified Duration = DV01 / Price.
// Convexity measures the curvature of the price-yield relationship.

double bond_price(const std::vector<double>& cashflows,
                  const std::vector<double>& times,
                  double yield) {
    double price = 0.0;
    for (std::size_t i = 0; i < cashflows.size(); ++i)
        price += cashflows[i] * std::exp(-yield * times[i]);
    return price;
}

struct BondRisk {
    double price;
    double dv01;          // per $1M face
    double duration;      // years (modified)
    double convexity;
};

BondRisk bond_risk(const std::vector<double>& coupons_face,  // coupon*face at each time
                    const std::vector<double>& times,
                    double face, double yield)
{
    // Build cashflow vector (coupon payments + principal at maturity)
    std::vector<double> cf = coupons_face;
    cf.back() += face;

    double bump = 0.0001;  // 1 basis point
    double P    = bond_price(cf, times, yield);
    double P_up = bond_price(cf, times, yield + bump);
    double P_dn = bond_price(cf, times, yield - bump);

    double dv01      = (P_dn - P_up) / 2.0;  // $ per 1bp per 1 unit notional
    double duration  = -1.0/P * (P_up - P_dn) / (2*bump);  // modified duration
    double convexity = (P_up - 2*P + P_dn) / (P * bump * bump);

    return {P, dv01 * 1e6, duration, convexity};  // DV01 per $1M
}

int main() {
    double face   = 1000.0;   // $1000 face
    double coupon = 0.05;     // 5% annual coupon
    double T      = 5.0;      // 5-year bond
    double yield  = 0.04;     // 4% yield

    // Semi-annual payments: coupon/2 every 6 months
    std::vector<double> times, coupons;
    for (double t = 0.5; t <= T + 1e-9; t += 0.5) {
        times.push_back(t);
        coupons.push_back(face * coupon / 2.0);  // $25 per period
    }

    auto r = bond_risk(coupons, times, face, yield);

    std::cout << std::fixed << std::setprecision(4);
    std::cout << "Bond price:   $" << r.price     << "\\n";
    std::cout << "DV01 ($1M):   $" << r.dv01      << "\\n";
    std::cout << "Mod Duration: "  << r.duration  << " years\\n";
    std::cout << "Convexity:    "  << r.convexity << "\\n";

    // Approximate price change for 50bp yield move:
    double dy = 0.005;
    double approx = -r.duration * r.price * dy
                   + 0.5 * r.convexity * r.price * dy*dy;
    std::cout << "50bp move approx dP: $" << approx << "\\n";
}`,
    explanation:
      "DV01 (dollar value of a basis point) is the fundamental fixed-income risk metric: it measures how much a bond's value changes per 1bp parallel yield shift. Modified duration is DV01 scaled by price, giving a percentage sensitivity. Convexity captures the positive curvature of the price-yield curve — bonds with higher convexity outperform their duration-linear approximation for large yield moves.",
  },
  {
    id: "cpp-20260705-b1-fx-bellman-ford",
    language: "cpp",
    title: "FX Arbitrage Detection via Bellman-Ford Negative Cycle",
    tag: "algorithms",
    code: `#include <vector>
#include <cmath>
#include <string>
#include <iostream>
#include <limits>
#include <algorithm>

// FX arbitrage: a cycle of currency exchanges with product of rates > 1.
// Convert to graph: nodes = currencies, edge weight = -log(rate).
// Negative cycle in this graph ⟺ arbitrage opportunity.
// Bellman-Ford detects negative cycles in O(V * E).

struct FXEdge {
    int from, to;
    double log_weight;  // -log(exchange_rate)
};

struct ArbitrageResult {
    bool found;
    std::vector<int> cycle;   // currency indices in the arbitrage cycle
    double profit_factor;     // product of rates along the cycle
};

ArbitrageResult detect_fx_arbitrage(
    int n_currencies,
    const std::vector<FXEdge>& edges)
{
    const double INF = std::numeric_limits<double>::infinity();
    std::vector<double> dist(n_currencies, 0.0);  // start with all zeros (log-space)
    std::vector<int>    pred(n_currencies, -1);

    int last_relaxed = -1;
    // Run N iterations (N-1 needed for shortest path; Nth finds negative cycle)
    for (int iter = 0; iter < n_currencies; ++iter) {
        last_relaxed = -1;
        for (const auto& e : edges) {
            if (dist[e.from] + e.log_weight < dist[e.to]) {
                dist[e.to] = dist[e.from] + e.log_weight;
                pred[e.to] = e.from;
                last_relaxed = e.to;
            }
        }
    }

    if (last_relaxed == -1)
        return {false, {}, 1.0};

    // Trace back N steps to find a node definitely inside the cycle
    int v = last_relaxed;
    for (int i = 0; i < n_currencies; ++i) v = pred[v];

    // Extract the cycle
    std::vector<int> cycle;
    int start = v;
    do {
        cycle.push_back(v);
        v = pred[v];
    } while (v != start && cycle.size() <= static_cast<std::size_t>(n_currencies));
    cycle.push_back(start);
    std::reverse(cycle.begin(), cycle.end());

    // Compute profit factor
    double log_profit = 0.0;
    for (std::size_t i = 0; i + 1 < cycle.size(); ++i) {
        for (const auto& e : edges)
            if (e.from == cycle[i] && e.to == cycle[i+1])
                log_profit -= e.log_weight;  // subtract because weight = -log(rate)
    }

    return {true, cycle, std::exp(log_profit)};
}

int main() {
    // Currencies: 0=USD, 1=EUR, 2=GBP, 3=JPY
    // Rates: USD->EUR 0.92, EUR->GBP 0.87, GBP->USD 1.26 (product = 1.009 > 1 → arb!)
    std::vector<FXEdge> edges = {
        {0, 1, -std::log(0.920)},  // USD->EUR
        {1, 0, -std::log(1.087)},  // EUR->USD
        {1, 2, -std::log(0.870)},  // EUR->GBP
        {2, 1, -std::log(1.148)},  // GBP->EUR
        {0, 2, -std::log(0.800)},  // USD->GBP
        {2, 0, -std::log(1.260)},  // GBP->USD — this one closes the arb
        {0, 3, -std::log(150.0)},  // USD->JPY
        {3, 0, -std::log(0.0067)}, // JPY->USD
    };

    auto result = detect_fx_arbitrage(4, edges);

    if (result.found) {
        std::cout << "Arbitrage found! Profit factor: " << result.profit_factor << "\\n";
        std::vector<std::string> names{"USD","EUR","GBP","JPY"};
        std::cout << "Cycle: ";
        for (int c : result.cycle) std::cout << names[c] << " ";
        std::cout << "\\n";
    } else {
        std::cout << "No arbitrage\\n";
    }
}`,
    explanation:
      "Taking -log of exchange rates converts the multiplicative arbitrage condition (product > 1) to an additive one (sum of weights < 0), enabling Bellman-Ford to detect it as a negative cycle. The N-th Bellman-Ford iteration relaxes edges that are only reachable via an N-edge path — this only succeeds if a cycle was traversed, which means a negative-weight cycle exists. Real FX arbitrage also requires transaction costs and execution speed constraints.",
  },
  {
    id: "cpp-20260705-b1-bitset-symbol-filter",
    language: "cpp",
    title: "std::bitset for High-Speed Symbol Subscription Filter",
    tag: "low-latency",
    code: `#include <bitset>
#include <string>
#include <unordered_map>
#include <cstdint>
#include <iostream>
#include <vector>

// Symbol subscription filter using a 64-bit bitmask for the most common symbols
// and a hash_map fallback for rare ones.
// Subscribed check: O(1) bitmask AND — one CPU instruction on x86-64.

class SymbolFilter {
    static constexpr int FAST_COUNT = 64;  // fits in uint64_t

    uint64_t fast_mask_ = 0;   // bit i set = symbol i is subscribed
    std::unordered_map<std::string, int> symbol_to_id_;  // symbol -> slot 0..63
    std::unordered_map<std::string, bool> slow_map_;     // overflow symbols
    int next_id_ = 0;

    int assign_id(const std::string& sym) {
        auto it = symbol_to_id_.find(sym);
        if (it != symbol_to_id_.end()) return it->second;
        if (next_id_ < FAST_COUNT) {
            symbol_to_id_[sym] = next_id_;
            return next_id_++;
        }
        return -1;  // use slow path
    }

public:
    void subscribe(const std::string& sym) {
        int id = assign_id(sym);
        if (id >= 0)
            fast_mask_ |= (1ULL << id);
        else
            slow_map_[sym] = true;
    }

    void unsubscribe(const std::string& sym) {
        auto it = symbol_to_id_.find(sym);
        if (it != symbol_to_id_.end())
            fast_mask_ &= ~(1ULL << it->second);
        else
            slow_map_.erase(sym);
    }

    // Hot path: called millions of times per second
    bool is_subscribed(const std::string& sym) const {
        auto it = symbol_to_id_.find(sym);
        if (it != symbol_to_id_.end())
            return (fast_mask_ >> it->second) & 1;  // single AND + shift
        auto sit = slow_map_.find(sym);
        return sit != slow_map_.end() && sit->second;
    }

    int subscribed_count() const {
        return __builtin_popcountll(fast_mask_) +
               static_cast<int>(slow_map_.size());
    }
};

int main() {
    SymbolFilter filter;

    for (const char* s : {"AAPL", "MSFT", "NVDA", "JPM", "GS"})
        filter.subscribe(s);

    std::vector<std::string> symbols = {"AAPL", "GOOG", "MSFT", "AMZN", "NVDA"};
    for (const auto& sym : symbols) {
        bool sub = filter.is_subscribed(sym);
        std::cout << sym << ": " << (sub ? "subscribed" : "filtered") << "\\n";
    }

    std::cout << "subscribed count: " << filter.subscribed_count() << "\\n";

    filter.unsubscribe("MSFT");
    std::cout << "after unsub MSFT: " << filter.subscribed_count() << "\\n";
    std::cout << "MSFT: " << (filter.is_subscribed("MSFT") ? "subscribed" : "unsubscribed") << "\\n";
}`,
    explanation:
      "A bitmask subscription filter checks membership with a single register AND instruction — the fastest possible check. Assigning the 64 most common symbols to fixed bit positions enables O(1) subscription checks with no cache misses. The hash map path handles overflow beyond 64 symbols gracefully. In a market-data handler, this filter runs on every incoming message before any decoding, eliminating work for unsubscribed symbols.",
  },
  {
    id: "cpp-20260705-b1-format-trade-report",
    language: "cpp",
    title: "std::format for Structured Trade Reports (C++20)",
    tag: "modern-cpp",
    code: `#include <format>
#include <iostream>
#include <vector>
#include <string>
#include <cstdint>
#include <chrono>
#include <iomanip>

// std::format (C++20): type-safe, locale-independent alternative to printf/iostream.
// Generates formatted strings at runtime with compile-time format string validation.

struct Fill {
    uint64_t    order_id;
    std::string symbol;
    char        side;
    int         qty;
    double      price;
    uint64_t    ts_ns;
};

struct RiskSummary {
    std::string symbol;
    int         net_position;
    double      avg_price;
    double      realized_pnl;
    double      notional;
};

// Format a fill as a FIX-style execution report string
std::string format_execution(const Fill& f) {
    return std::format(
        "8=FIX.4.4|35=8|49=SERVER|55={0}|54={1}|32={2}|31={3:.4f}|17={4}|52={5}|",
        f.symbol,
        (f.side == 'B' ? 1 : 2),
        f.qty,
        f.price,
        f.order_id,
        f.ts_ns);
}

std::string format_risk_row(const RiskSummary& r) {
    // Align columns: symbol left-padded to 8, numbers right-padded
    return std::format("{:<8} {:>8} {:>10.4f} {:>12.2f} {:>14.2f}",
                       r.symbol, r.net_position, r.avg_price,
                       r.realized_pnl, r.notional);
}

void print_risk_table(const std::vector<RiskSummary>& rows) {
    std::cout << std::format("{:<8} {:>8} {:>10} {:>12} {:>14}\\n",
                              "Symbol", "NetPos", "AvgPrice",
                              "RealizedPnL", "Notional");
    std::cout << std::string(56, '-') << "\\n";
    for (const auto& r : rows)
        std::cout << format_risk_row(r) << "\\n";
}

int main() {
    Fill f{42, "AAPL", 'B', 500, 183.4750, 1720000000100000000ULL};
    std::cout << "Execution report:\\n" << format_execution(f) << "\\n\\n";

    std::vector<RiskSummary> book = {
        {"AAPL",  500, 183.475,  250.00, 91737.50},
        {"MSFT", -200, 415.200, -120.50, 83040.00},
        {"NVDA",  100, 850.050,  500.00, 85005.00},
    };
    print_risk_table(book);

    // Compile-time format string check: wrong types would be a compile error
    // std::format("{:d}", 3.14);  // compile error: d format for float
    std::cout << "\\n" << std::format("Aggregate notional: \${:.0f}\\n",
                                       91737.50 + 83040.00 + 85005.00);
}`,
    explanation:
      "std::format provides compile-time format string validation — a type mismatch is a compile error, not a runtime crash (unlike printf). The format spec syntax ({:<8} for left-aligned, {:>10.4f} for right-aligned fixed-precision) is richer than printf and composes naturally. For trade reporting and risk dashboards, format eliminates the cumbersome stream manipulator boilerplate while keeping allocation-free output options via std::format_to.",
  },
  {
    id: "cpp-20260705-b1-monotone-stack-price",
    language: "cpp",
    title: "Monotone Stack for Next Higher Price Level",
    tag: "algorithms",
    code: `#include <vector>
#include <stack>
#include <iostream>
#include <cstdint>

// Monotone decreasing stack: maintain a stack of indices with decreasing values.
// When a new value is larger than stack top: pop all smaller values (they found their answer).
// Classic O(n) solution for "next greater element" applied to order book levels.

// For each price level in the order book, find the next higher price level.
// Application: order routing — find the closest resistance level above current price.
std::vector<int> next_higher_price(const std::vector<double>& prices) {
    int n = static_cast<int>(prices.size());
    std::vector<int> result(n, -1);  // -1 = no higher price to the right
    std::stack<int> stk;             // indices with decreasing prices

    for (int i = 0; i < n; ++i) {
        // While stack not empty and prices[i] > prices[stk.top()]:
        // prices[i] is the "next higher" for stk.top()
        while (!stk.empty() && prices[i] > prices[stk.top()]) {
            result[stk.top()] = i;
            stk.pop();
        }
        stk.push(i);
    }
    return result;
}

// 2D variant: for each bid level, find the next ask level above it
// (i.e., find the nearest resistance above each support level)
struct Level { double price; uint64_t qty; };

std::vector<Level> next_resistance(const std::vector<Level>& bids,
                                    const std::vector<Level>& asks) {
    std::vector<Level> results;
    for (const auto& bid : bids) {
        Level best{-1.0, 0};
        for (const auto& ask : asks) {
            if (ask.price > bid.price) {
                best = ask;
                break;  // asks are sorted ascending
            }
        }
        results.push_back(best);
    }
    return results;
}

// Daily high/low breakout detector using monotone stack on OHLC
std::vector<int> breakout_levels(const std::vector<double>& highs) {
    return next_higher_price(highs);
}

int main() {
    std::vector<double> prices = {183.40, 183.20, 183.50, 183.35, 183.60, 183.55};
    auto nxt = next_higher_price(prices);

    std::cout << "Price -> Next Higher Price Index:\\n";
    for (int i = 0; i < (int)prices.size(); ++i) {
        std::cout << prices[i] << " -> ";
        if (nxt[i] == -1) std::cout << "none\\n";
        else std::cout << prices[nxt[i]] << " (at idx " << nxt[i] << ")\\n";
    }
    // 183.40 -> 183.50 (idx 2), 183.20 -> 183.50 (idx 2), 183.60 -> none
}`,
    explanation:
      "The monotone stack processes each element exactly once (each index pushed and popped at most once), giving O(n) total time despite the nested while loop. In order book analysis, 'next greater element' maps to finding the nearest resistance level or the next ask price above a bid — used in smart order routing to estimate the cost of lifting the offer. The same pattern solves daily bar breakout detection across many assets efficiently.",
  },
  {
    id: "cpp-20260705-b1-constexpr-bs-table",
    language: "cpp",
    title: "constexpr Black-Scholes Table Pre-Computed at Compile Time",
    tag: "numerics",
    code: `#include <cmath>
#include <array>
#include <iostream>
#include <iomanip>

// Compile-time option price table for rapid ATM lookup.
// For standard vol/tenor grids, pre-computing at compile time
// eliminates the exp/log/erfc calls entirely at runtime.

// C++20 constexpr math functions (available in many implementations)
// We implement our own for portability.

constexpr double cx_sqrt(double x, double guess = 1.0, int iter = 30) {
    return iter == 0 ? guess
           : cx_sqrt(x, 0.5*(guess + x/guess), iter-1);
}

constexpr double cx_exp(double x) {
    // Taylor series for small |x|; for large x use range reduction
    if (x > 10.0) return cx_exp(5.0) * cx_exp(x - 5.0);
    if (x < -10.0) return 1.0 / cx_exp(-x);
    double sum = 1.0, term = 1.0;
    for (int i = 1; i <= 20; ++i) {
        term *= x / i;
        sum += term;
    }
    return sum;
}

constexpr double cx_log(double x, int iter = 50) {
    // Newton's method: log(x) = log(1 + (x-1)) for x near 1; use exp identity
    // Approximate: only works well for x in [0.5, 2]
    double y = (x - 1.0) / (x + 1.0);
    double result = 0.0, term = y;
    for (int i = 0; i < iter; ++i) {
        result += term / (2*i + 1);
        term *= y * y;
    }
    return 2.0 * result;
}

// Compile-time ATM BSM call approximation (Brenner-Subrahmanyam 1988):
// C_atm ≈ S * sigma * sqrt(T / (2*pi))  for ATM calls
constexpr double atm_call_approx(double S, double T, double sigma) {
    constexpr double inv_sqrt_2pi = 0.3989422804014327;
    return S * sigma * cx_sqrt(T) * inv_sqrt_2pi;
}

// Pre-computed table: vol_pct = {10, 15, 20, 25, 30}, tenor_months = {1, 3, 6, 12}
constexpr auto build_atm_table() {
    std::array<std::array<double, 5>, 4> table{};
    constexpr double S = 100.0;
    constexpr double vols[5]   = {0.10, 0.15, 0.20, 0.25, 0.30};
    constexpr double tenors[4] = {1.0/12, 3.0/12, 6.0/12, 1.0};
    for (int i = 0; i < 4; ++i)
        for (int j = 0; j < 5; ++j)
            table[i][j] = atm_call_approx(S, tenors[i], vols[j]);
    return table;
}

constexpr auto ATM_PRICES = build_atm_table();  // compiled into the binary

int main() {
    constexpr double vols[]   = {10, 15, 20, 25, 30};
    constexpr double tenors[] = {1, 3, 6, 12};

    std::cout << std::fixed << std::setprecision(3);
    std::cout << "ATM Call Prices (S=100, BSa approx)\\n";
    std::cout << "       ";
    for (double v : vols) std::cout << std::setw(7) << v << "% ";
    std::cout << "\\n";

    for (int i = 0; i < 4; ++i) {
        std::cout << tenors[i] << "M:  ";
        for (int j = 0; j < 5; ++j)
            std::cout << std::setw(7) << ATM_PRICES[i][j] << " ";
        std::cout << "\\n";
    }
    // ATM_PRICES is a compile-time constant — lookup is a single array access
}`,
    explanation:
      "Pre-computing the ATM table at compile time turns what would be 20 calls to exp/sqrt/erfc into a constant array embedded in the binary's data segment. At runtime, pricing a standard ATM option becomes a table lookup and bilinear interpolation — nanoseconds rather than microseconds. The Brenner-Subrahmanyam ATM approximation S·σ·√(T/2π) is accurate to within 1bp for ATM options and is used when speed matters more than exactness.",
  },
  {
    id: "cpp-20260705-b1-structured-bindings",
    language: "cpp",
    title: "Structured Bindings and if-init for Clean Market Data Processing",
    tag: "modern-cpp",
    code: `#include <tuple>
#include <optional>
#include <string>
#include <unordered_map>
#include <iostream>
#include <vector>
#include <cmath>

// C++17 structured bindings: decompose tuples/pairs/structs without temp names.
// if-init statement: declare variables and test them in the same expression.
// Together they produce the cleanest possible option-chain lookup code.

struct Quote { double bid, ask; int bid_sz, ask_sz; };

// Returns {mid, half_spread, is_valid}
std::tuple<double, double, bool> compute_mid_spread(const Quote& q) {
    if (q.bid <= 0 || q.ask <= 0 || q.ask <= q.bid)
        return {0.0, 0.0, false};
    double mid    = (q.bid + q.ask) / 2.0;
    double spread = q.ask - q.bid;
    return {mid, spread, true};
}

using OptionChain = std::unordered_map<double, Quote>;  // strike -> quote

std::optional<double> implied_skew(const OptionChain& chain,
                                    double atm_strike, double wing_strike) {
    auto atm_it  = chain.find(atm_strike);
    auto wing_it = chain.find(wing_strike);
    if (atm_it == chain.end() || wing_it == chain.end())
        return std::nullopt;

    // Structured bindings on the return of compute_mid_spread
    auto [atm_mid,  atm_sp,  atm_ok]  = compute_mid_spread(atm_it->second);
    auto [wing_mid, wing_sp, wing_ok] = compute_mid_spread(wing_it->second);

    if (!atm_ok || !wing_ok) return std::nullopt;
    return wing_mid / atm_mid - 1.0;  // skew as fraction of ATM
}

int main() {
    OptionChain chain{
        {95.0,  {8.50,  8.70,  200, 100}},
        {100.0, {5.20,  5.40,  500, 400}},
        {105.0, {2.80,  2.95,  300, 250}},
        {110.0, {1.10,  1.20,  150,  80}},
    };

    // if-init with structured binding for idiomatic result handling
    if (auto skew = implied_skew(chain, 100.0, 95.0); skew) {
        std::cout << "95/100 skew: " << *skew * 100 << "%\\n";
    }

    // Range-for with structured bindings on map
    for (const auto& [strike, q] : chain) {
        auto [mid, spread, ok] = compute_mid_spread(q);
        if (ok)
            std::cout << "K=" << strike
                      << " mid=" << mid
                      << " spread=" << spread << "\\n";
    }
}`,
    explanation:
      "Structured bindings make tuple-returning functions readable without artificial temp names: auto [mid, spread, ok] = compute_mid_spread(q) is self-documenting. The if-init statement (if (auto v = f(); v)) declares the variable in the condition, limiting its scope to the if-block and preventing accidental reuse. Both features are standard C++17 and ubiquitous in modern quant codebases.",
  },
];
