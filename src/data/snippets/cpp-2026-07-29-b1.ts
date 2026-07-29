import type { Snippet } from "./types";

export const cppSnippets20260729B1: Snippet[] = [
  {
    id: "cpp-20260729-b1-acquire-release",
    language: "cpp",
    title: "Acquire-release memory ordering for producer-consumer",
    tag: "memory-model",
    code: `#include <atomic>
#include <thread>
#include <cassert>

// acquire-release pairs are the cheapest synchronisation that still
// gives the happens-before guarantee between one writer and one reader.

struct Slot {
    int  value{0};
    std::atomic<bool> ready{false};   // the flag
};

Slot slot;

void producer() {
    slot.value = 42;                        // plain store — safe before publish
    slot.ready.store(true, std::memory_order_release);   // release: all prior
                                            // stores visible to the acquirer
}

void consumer() {
    while (!slot.ready.load(std::memory_order_acquire))  // acquire: pairs with
        ;                                                // the release above
    assert(slot.value == 42);   // guaranteed: no data race
}

int main() {
    std::thread t1(producer);
    std::thread t2(consumer);
    t1.join(); t2.join();
}`,
    explanation: "Acquire-release is the minimal ordering needed for a single-producer/single-consumer handoff: the release store flushes preceding writes, and the matching acquire load makes them visible — cheaper than seq_cst because it avoids full memory barriers on TSO hardware like x86.",
  },
  {
    id: "cpp-20260729-b1-seqcst-vs-relaxed",
    language: "cpp",
    title: "seq_cst vs relaxed ordering: when each matters",
    tag: "memory-model",
    code: `#include <atomic>
#include <thread>
#include <cstdio>

// seq_cst = total global order; relaxed = only atomicity, no ordering.
// Use relaxed for counters that only need an eventual consistent view.
// Use seq_cst (default) when multiple threads read each other's flags.

std::atomic<int>  counter{0};          // shared hit-count
std::atomic<bool> flagA{false}, flagB{false};

void writerA() {
    flagA.store(true, std::memory_order_seq_cst); // total-order store
}
void writerB() {
    flagB.store(true, std::memory_order_seq_cst);
}
void observer() {
    // With seq_cst: if observer sees flagB==true, it MUST also see flagA==true
    // if A's store preceded B's in the total order — this guarantee collapses
    // under acquire-release when two independent flags are involved.
    if (flagA.load(std::memory_order_seq_cst) &&
        flagB.load(std::memory_order_seq_cst))
        printf("both flags set\\n");
}

void hot_path_counter(int n) {
    for (int i = 0; i < n; ++i)
        counter.fetch_add(1, std::memory_order_relaxed); // no barrier needed
}

int main() {
    std::thread t1(writerA), t2(writerB), t3(observer);
    t1.join(); t2.join(); t3.join();
    hot_path_counter(1'000'000);
    printf("counter=%d\\n", counter.load(std::memory_order_relaxed));
}`,
    explanation: "seq_cst creates a single total modification order visible to all threads, essential when you coordinate multiple independent atomics (e.g., Dekker/Peterson flags); relaxed gives only atomicity at no synchronisation cost and is ideal for statistics counters where stale reads are harmless.",
  },
  {
    id: "cpp-20260729-b1-hazard-pointer",
    language: "cpp",
    title: "Hazard pointer for safe lock-free node reclamation",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <vector>
#include <cstdio>

// Hazard pointers: each thread publishes a pointer it is currently
// reading; the deleter scans all hazard slots and defers any node
// that appears in them. Simple 1-slot version for illustration.

constexpr int MAX_THREADS = 8;
std::atomic<void*> hazard_ptrs[MAX_THREADS];  // one slot per thread

thread_local int tid = 0;   // caller sets this before using the algorithm

struct Node { int val; std::atomic<Node*> next; };

// Announce that this thread is reading 'ptr'.
template<typename T>
T* protect(std::atomic<T*>& src, int slot) {
    T* p;
    do {
        p = src.load(std::memory_order_relaxed);
        hazard_ptrs[slot].store(p, std::memory_order_release);
    } while (src.load(std::memory_order_acquire) != p); // re-check after publish
    return p;
}

// Check if 'p' is in any hazard slot.
bool is_hazardous(void* p) {
    for (auto& h : hazard_ptrs)
        if (h.load(std::memory_order_acquire) == p) return true;
    return false;
}

// Safe deletion — defers nodes still protected.
void retire(Node* p, std::vector<Node*>& retired) {
    retired.push_back(p);
    if (retired.size() >= 2 * MAX_THREADS) {
        auto it = retired.begin();
        while (it != retired.end()) {
            if (!is_hazardous(*it)) { delete *it; it = retired.erase(it); }
            else ++it;
        }
    }
}

int main() {
    hazard_ptrs[0].store(nullptr, std::memory_order_relaxed);
    printf("Hazard pointer skeleton compiled OK\\n");
}`,
    explanation: "Hazard pointers let threads safely read shared nodes in a lock-free structure without ABA or use-after-free: each reader publishes the pointer it is examining; deleters scan those slots and defer reclamation until no thread holds the pointer, trading memory overhead for wait-freedom.",
  },
  {
    id: "cpp-20260729-b1-mpmc-queue",
    language: "cpp",
    title: "Dmitry Vyukov MPMC bounded queue",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Vyukov's cache-friendly MPMC ring-buffer. Each cell has its own
// sequence counter so producers and consumers coordinate without
// a single contended head/tail pair.

template<typename T, std::size_t N>
class MPMCQueue {
    static_assert((N & (N-1)) == 0, "N must be power of two");

    struct Cell {
        std::atomic<std::size_t> seq;
        T data;
    };
    alignas(64) std::array<Cell, N> buf_;
    alignas(64) std::atomic<std::size_t> head_{0};
    alignas(64) std::atomic<std::size_t> tail_{0};

public:
    MPMCQueue() {
        for (std::size_t i = 0; i < N; ++i)
            buf_[i].seq.store(i, std::memory_order_relaxed);
    }

    bool push(T val) {
        std::size_t pos = tail_.load(std::memory_order_relaxed);
        for (;;) {
            Cell& cell = buf_[pos & (N-1)];
            std::size_t seq = cell.seq.load(std::memory_order_acquire);
            std::ptrdiff_t diff = (std::ptrdiff_t)seq - (std::ptrdiff_t)pos;
            if (diff == 0) {
                if (tail_.compare_exchange_weak(pos, pos+1, std::memory_order_relaxed))
                { cell.data = std::move(val); cell.seq.store(pos+1, std::memory_order_release); return true; }
            } else if (diff < 0) return false; // full
            else pos = tail_.load(std::memory_order_relaxed);
        }
    }

    std::optional<T> pop() {
        std::size_t pos = head_.load(std::memory_order_relaxed);
        for (;;) {
            Cell& cell = buf_[pos & (N-1)];
            std::size_t seq = cell.seq.load(std::memory_order_acquire);
            std::ptrdiff_t diff = (std::ptrdiff_t)seq - (std::ptrdiff_t)(pos+1);
            if (diff == 0) {
                if (head_.compare_exchange_weak(pos, pos+1, std::memory_order_relaxed))
                { T v = std::move(cell.data); cell.seq.store(pos+N, std::memory_order_release); return v; }
            } else if (diff < 0) return std::nullopt; // empty
            else pos = head_.load(std::memory_order_relaxed);
        }
    }
};`,
    explanation: "Vyukov's MPMC queue avoids a shared head/tail counter per operation by giving each slot its own sequence number: producers CAS the tail, write the item, then publish via the cell's sequence — consumers mirror the pattern; each cell acts as its own micro-mutex, eliminating the thundering-herd effect of a single contended pair.",
  },
  {
    id: "cpp-20260729-b1-hugepages-mmap",
    language: "cpp",
    title: "Hugepage allocation via mmap MAP_HUGETLB",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <cstdio>
#include <cstring>
#include <stdexcept>

// Hugepages (2 MB on x86-64) cut TLB misses dramatically for large
// arrays — critical for order books and historical tick buffers.

inline void* alloc_hugepage(std::size_t bytes) {
    // Round up to 2 MB boundary.
    constexpr std::size_t HUGE = 1UL << 21;
    bytes = (bytes + HUGE - 1) & ~(HUGE - 1);

    void* p = mmap(nullptr, bytes,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                   -1, 0);
    if (p == MAP_FAILED) {
        // Fallback: system may need 'echo N > /proc/sys/vm/nr_hugepages'
        perror("mmap hugepage");
        // Fall back to regular pages
        p = mmap(nullptr, bytes,
                 PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS,
                 -1, 0);
        if (p == MAP_FAILED) throw std::bad_alloc{};
    }
    return p;
}

inline void free_hugepage(void* p, std::size_t bytes) {
    constexpr std::size_t HUGE = 1UL << 21;
    bytes = (bytes + HUGE - 1) & ~(HUGE - 1);
    munmap(p, bytes);
}

// Custom deleter for unique_ptr
struct HugepageDeleter {
    std::size_t sz;
    void operator()(void* p) const { free_hugepage(p, sz); }
};

int main() {
    constexpr std::size_t N = 1 << 22; // 4 MB of doubles
    auto* buf = static_cast<double*>(alloc_hugepage(N * sizeof(double)));
    buf[0] = 3.14;
    printf("buf[0]=%.2f\\n", buf[0]);
    free_hugepage(buf, N * sizeof(double));
}`,
    explanation: "On a server with 64 GB of tick data or a 10M-row order book, hugepages cut TLB misses from millions per second to near-zero by mapping 2 MB per TLB entry instead of 4 KB; requires pre-allocated huge pages in the kernel (`/proc/sys/vm/nr_hugepages`) but the fallback to regular mmap keeps non-prod builds working.",
  },
  {
    id: "cpp-20260729-b1-itch-parser",
    language: "cpp",
    title: "ITCH 5.0 Add Order message binary parser",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <cstdio>
#include <arpa/inet.h>   // ntohl, ntohs — big-endian network order

// NASDAQ ITCH 5.0: all fields are big-endian, no padding.
// Message type 'A' = Add Order (No MPID Attribution)
// Layout (bytes): type(1) | stock_locate(2) | tracking(2) |
//                 timestamp(6) | order_ref(8) | side(1) |
//                 shares(4) | stock(8) | price(4)

#pragma pack(push, 1)
struct AddOrderMsg {
    char     type;           // 'A'
    uint16_t stock_locate;
    uint16_t tracking_number;
    uint8_t  timestamp[6];   // 6-byte big-endian nanoseconds since midnight
    uint64_t order_ref;
    char     side;           // 'B' or 'S'
    uint32_t shares;
    char     stock[8];       // space-padded
    uint32_t price;          // fixed-point: divide by 10000 for dollars
};
#pragma pack(pop)

struct Order {
    uint64_t ref;
    char     side;
    uint32_t shares;
    double   price;
    char     stock[9];
};

Order parse_add_order(const uint8_t* buf) {
    const auto* m = reinterpret_cast<const AddOrderMsg*>(buf);
    Order o{};
    o.ref    = be64toh(m->order_ref);
    o.side   = m->side;
    o.shares = ntohl(m->shares);
    o.price  = ntohl(m->price) / 10000.0;
    std::memcpy(o.stock, m->stock, 8);
    o.stock[8] = '\\0';
    return o;
}

int main() {
    // Synthetic 'A' message (big-endian price = 10000*100.5 = 1005000 = 0x000F5208)
    uint8_t buf[36] = {};
    buf[0] = 'A';
    buf[19] = 'B';  // side
    uint32_t shares_be = htonl(100);
    std::memcpy(buf + 20, &shares_be, 4);
    std::memcpy(buf + 24, "AAPL    ", 8);
    uint32_t price_be = htonl(1005000);
    std::memcpy(buf + 32, &price_be, 4);

    Order o = parse_add_order(buf);
    printf("%.8s %c %u @ %.4f\\n", o.stock, o.side, o.shares, o.price);
}`,
    explanation: "ITCH 5.0 is big-endian binary with no delimiters; `#pragma pack(1)` removes struct padding so the layout matches the wire format exactly, and `be64toh`/`ntohl` flip byte order in a single instruction — the entire parse is a cast and a few byte-swaps, suitable for 10M+ messages/second.",
  },
  {
    id: "cpp-20260729-b1-hash-array-orderbook",
    language: "cpp",
    title: "Hash+array hybrid order book with O(1) cancel",
    tag: "order-book",
    code: `#include <unordered_map>
#include <map>
#include <cstdint>
#include <cstdio>

// Price levels stored in a sorted map; individual orders stored in
// a flat array indexed by order ID. Cancel is O(1) array lookup +
// O(1) level size decrement; level erasure is O(log P).

struct Order {
    uint64_t id;
    uint32_t price_ticks; // price * 100
    uint32_t qty;
    bool     is_bid;
    bool     active;
};

constexpr uint32_t MAX_ORDERS = 1 << 20;
Order order_pool[MAX_ORDERS];   // slab — avoid heap allocations in hot path

struct Level { uint64_t total_qty; uint32_t count; };
std::map<uint32_t, Level, std::greater<uint32_t>> bids; // descending
std::map<uint32_t, Level, std::less<uint32_t>>    asks; // ascending
std::unordered_map<uint64_t, uint32_t> id_to_slot; // order_id -> pool index

uint32_t next_slot = 0;

void add_order(uint64_t id, uint32_t price, uint32_t qty, bool is_bid) {
    uint32_t slot = next_slot++;
    order_pool[slot] = {id, price, qty, is_bid, true};
    id_to_slot[id] = slot;
    auto& levels = is_bid ? (std::map<uint32_t,Level,std::greater<uint32_t>>&)bids
                          : (std::map<uint32_t,Level,std::less<uint32_t>>&)asks;
    auto& lvl = is_bid ? bids[price] : asks[price];
    lvl.total_qty += qty;
    lvl.count++;
}

void cancel_order(uint64_t id) {
    auto it = id_to_slot.find(id);
    if (it == id_to_slot.end()) return;
    Order& o = order_pool[it->second];
    if (!o.active) return;
    o.active = false;
    if (o.is_bid) {
        auto& lvl = bids[o.price_ticks];
        lvl.total_qty -= o.qty;
        if (--lvl.count == 0) bids.erase(o.price_ticks);
    } else {
        auto& lvl = asks[o.price_ticks];
        lvl.total_qty -= o.qty;
        if (--lvl.count == 0) asks.erase(o.price_ticks);
    }
    id_to_slot.erase(it);
}

int main() {
    add_order(1, 10050, 100, true);
    add_order(2, 10060, 200, false);
    cancel_order(1);
    printf("Best ask: %u ticks  qty=%lu\\n",
           asks.begin()->first, asks.begin()->second.total_qty);
}`,
    explanation: "A flat array indexed by slot gives O(1) cancel lookup without pointer chasing, while the sorted std::map maintains price level ordering for best-bid/ask queries; this hybrid is simpler than an intrusive list and avoids dynamic allocation in the cancel path, which is the most latency-sensitive operation.",
  },
  {
    id: "cpp-20260729-b1-prefetch",
    language: "cpp",
    title: "__builtin_prefetch for cache-line prefetching",
    tag: "low-latency",
    code: `#include <cstddef>
#include <cstdint>
#include <cstdio>

// __builtin_prefetch(addr, rw, locality)
//   rw:       0=read, 1=write
//   locality: 0=NTA (non-temporal, evict soon), 1-3=L3->L1

// Pattern 1: stride prefetch in a tight loop
void sum_with_prefetch(const double* data, std::size_t n, double& out) {
    constexpr int PREFETCH_DIST = 16; // prefetch 16 elements ahead (~128 B)
    double acc = 0.0;
    for (std::size_t i = 0; i < n; ++i) {
        if (i + PREFETCH_DIST < n)
            __builtin_prefetch(&data[i + PREFETCH_DIST], 0, 1); // read, L2
        acc += data[i];
    }
    out = acc;
}

// Pattern 2: prefetch next node in a linked-list traversal
struct PriceNode { double price; PriceNode* next; };

double traverse(PriceNode* head) {
    double sum = 0;
    PriceNode* cur = head;
    while (cur) {
        if (cur->next)
            __builtin_prefetch(cur->next, 0, 0); // NTA: not needed again soon
        sum += cur->price;
        cur = cur->next;
    }
    return sum;
}

// Pattern 3: scatter prefetch — prefetch future write targets
void scatter(const uint32_t* indices, double* dst, double val, std::size_t n) {
    constexpr int PD = 8;
    for (std::size_t i = 0; i < n; ++i) {
        if (i + PD < n)
            __builtin_prefetch(&dst[indices[i + PD]], 1, 0); // write, NTA
        dst[indices[i]] += val;
    }
}

int main() {
    double data[1024] = {}, result = 0;
    sum_with_prefetch(data, 1024, result);
    printf("sum=%.0f\\n", result);
}`,
    explanation: "Software prefetching hides memory latency by issuing a cache-line load 100–200 cycles before the data is needed; stride prefetch (pattern 1) works well for sequential scans, while NTA (non-temporal) hints (patterns 2–3) avoid polluting the cache with data that won't be reused.",
  },
  {
    id: "cpp-20260729-b1-std-variant-order",
    language: "cpp",
    title: "std::variant for type-safe order union",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string>
#include <cstdio>

struct LimitOrder  { double price; int qty; };
struct MarketOrder { int qty; };
struct StopOrder   { double trigger; int qty; };
struct IOCOrder    { double price; int qty; };

using Order = std::variant<LimitOrder, MarketOrder, StopOrder, IOCOrder>;

// Overloaded visitor pattern (C++17)
template<typename... Ts>
struct Overloaded : Ts... { using Ts::operator()...; };
template<typename... Ts> Overloaded(Ts...) -> Overloaded<Ts...>;

void process(const Order& o) {
    std::visit(Overloaded{
        [](const LimitOrder&  l) { printf("LIMIT  price=%.2f qty=%d\\n", l.price, l.qty); },
        [](const MarketOrder& m) { printf("MARKET qty=%d\\n", m.qty); },
        [](const StopOrder&   s) { printf("STOP   trigger=%.2f qty=%d\\n", s.trigger, s.qty); },
        [](const IOCOrder&    i) { printf("IOC    price=%.2f qty=%d\\n", i.price, i.qty); },
    }, o);
}

// Statically-sized: sizeof(variant) = max(sizeof(T)...) + discriminant
static_assert(sizeof(Order) <= 24, "variant fits in 3 cache words");

int main() {
    Order orders[] = {
        LimitOrder{100.50, 200},
        MarketOrder{50},
        StopOrder{99.0, 100},
        IOCOrder{100.55, 75},
    };
    for (auto& o : orders) process(o);
}`,
    explanation: "std::variant replaces tagged unions with type-safe visit dispatch: the compiler rejects unhandled alternatives, the discriminant fits in the existing padding, and std::visit with the Overloaded trick produces a single jump table — zero overhead compared to a hand-rolled enum + union but with full type safety.",
  },
  {
    id: "cpp-20260729-b1-std-span",
    language: "cpp",
    title: "std::span for zero-copy market-data message view",
    tag: "modern-cpp",
    code: `#include <span>
#include <cstdint>
#include <cstddef>
#include <cstring>
#include <cstdio>

// std::span is a non-owning view — no allocation, no copy.
// Ideal for referencing a slice of a ring buffer without memcpy.

struct FieldView {
    std::span<const uint8_t> data;
    uint32_t as_u32() const {
        uint32_t v; std::memcpy(&v, data.data(), 4); return __builtin_bswap32(v);
    }
    double as_price() const { return as_u32() / 10000.0; }
};

void parse_message(std::span<const uint8_t> msg) {
    if (msg.size() < 10) return;
    char type = static_cast<char>(msg[0]);
    // Subspan: bytes 6-10 contain the price field (big-endian uint32)
    FieldView price_field{msg.subspan(6, 4)};
    printf("type=%c price=%.4f\\n", type, price_field.as_price());
}

// Ring-buffer scenario: parse a slice without copying
void process_ring(const uint8_t* ring, std::size_t ring_size,
                  std::size_t head, std::size_t msg_len) {
    // Contiguous case (no wrap) — zero-copy span into the ring
    if (head + msg_len <= ring_size) {
        parse_message({ring + head, msg_len});
    } else {
        // Wrap: fall back to a small stack buffer
        uint8_t tmp[256];
        std::size_t first = ring_size - head;
        std::memcpy(tmp,         ring + head, first);
        std::memcpy(tmp + first, ring,        msg_len - first);
        parse_message({tmp, msg_len});
    }
}

int main() {
    uint8_t buf[] = {'A', 0,0,0,0,0, 0,0x0F,0x52,0x08, 0};
    parse_message(buf);   // 0x000F5208 = 1005000 -> $100.5000
}`,
    explanation: "std::span makes function signatures self-documenting: callers pass any contiguous range (array, vector, ring-buffer slice) without copying, and subspan() lets you cut named field windows into a raw wire message with zero overhead — the span is 16 bytes (pointer + size) regardless of message length.",
  },
  {
    id: "cpp-20260729-b1-structured-bindings",
    language: "cpp",
    title: "Structured bindings for order decomposition",
    tag: "modern-cpp",
    code: `#include <tuple>
#include <map>
#include <string>
#include <cstdio>

// C++17 structured bindings decompose tuples, pairs, arrays, and
// aggregates without named accessors — concise in hot loops.

struct Fill {
    uint64_t    order_id;
    double      price;
    int         qty;
    const char* venue;
};

// Aggregate decomposition
void print_fill(const Fill& f) {
    auto [id, price, qty, venue] = f;
    printf("fill #%llu %.4f x%d @ %s\\n", id, price, qty, venue);
}

// std::map iteration — pair decomposition
void print_book(const std::map<double, int>& book) {
    for (const auto& [price, qty] : book)
        printf("  %.2f x %d\\n", price, qty);
}

// Returning multiple values without a named struct
std::tuple<double, double, int> vwap_stats(const std::vector<Fill>& fills) {
    double pv = 0, vol = 0; int n = fills.size();
    for (auto [id, p, q, v] : fills) { pv += p * q; vol += q; }
    return {pv / vol, vol, n};
}

int main() {
    Fill f{1, 100.50, 200, "NYSE"};
    print_fill(f);

    std::map<double, int> bids{{100.5, 200}, {100.4, 500}};
    print_book(bids);

    std::vector<Fill> fills{{1, 100.5, 100, "A"}, {2, 100.6, 200, "B"}};
    auto [vwap, total_vol, count] = vwap_stats(fills);
    printf("VWAP=%.4f vol=%.0f fills=%d\\n", vwap, total_vol, count);
}`,
    explanation: "Structured bindings eliminate `.first`/`.second` noise in map iteration and make multi-return functions composable without intermediate variable names; the decomposition is zero-cost — the compiler binds references to the underlying fields rather than copying.",
  },
  {
    id: "cpp-20260729-b1-coroutine-tick",
    language: "cpp",
    title: "C++20 coroutine generator for tick stream",
    tag: "modern-cpp",
    code: `#include <coroutine>
#include <optional>
#include <cstdio>

// Minimal generator coroutine — produces values lazily on demand.
// In production a tick feed coroutine wraps an async socket read.

template<typename T>
struct Generator {
    struct promise_type {
        T value;
        std::suspend_always yield_value(T v) { value = v; return {}; }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        Generator           get_return_object() { return {Handle::from_promise(*this)}; }
        void                return_void() {}
        void                unhandled_exception() { std::terminate(); }
    };
    using Handle = std::coroutine_handle<promise_type>;
    Handle h;
    ~Generator() { if (h) h.destroy(); }

    std::optional<T> next() {
        if (!h || h.done()) return std::nullopt;
        h.resume();
        if (h.done()) return std::nullopt;
        return h.promise().value;
    }
};

struct Tick { double bid, ask; int seq; };

// Simulated tick feed — in prod, co_await socket_recv() here
Generator<Tick> tick_feed() {
    for (int i = 0; i < 5; ++i)
        co_yield Tick{100.0 + i*0.01, 100.01 + i*0.01, i};
}

int main() {
    auto feed = tick_feed();
    while (auto t = feed.next())
        printf("seq=%d bid=%.2f ask=%.2f\\n", t->seq, t->bid, t->ask);
}`,
    explanation: "C++20 coroutines suspend at each co_yield without stack allocation, making a generator a zero-overhead abstraction over a lazy sequence; in a real tick-feed application, co_await replaces the yield, and the compiler transforms the coroutine frame into a heap-allocated state machine with continuation passing.",
  },
  {
    id: "cpp-20260729-b1-constexpr-bs-delta",
    language: "cpp",
    title: "Compile-time Black-Scholes delta with constexpr",
    tag: "numerics",
    code: `#include <cmath>
#include <cstdio>
#include <array>

// constexpr enables evaluation at compile time for fixed parameters,
// and at runtime for runtime inputs — same function, zero overhead either way.

// Abramowitz & Stegun approximation for std normal CDF (error < 7.5e-8)
constexpr double norm_cdf(double x) {
    constexpr double a1=0.254829592, a2=-0.284496736, a3=1.421413741;
    constexpr double a4=-1.453152027, a5=1.061405429, p=0.3275911;
    double sign = (x < 0) ? -1.0 : 1.0;
    x = std::abs(x);                            // std::abs is constexpr in C++23
    double t = 1.0 / (1.0 + p * x);
    double poly = t*(a1 + t*(a2 + t*(a3 + t*(a4 + t*a5))));
    // Approximate exp via series if needed; here we rely on the compiler
    // to evaluate at runtime when x is not a constant expression.
    return 0.5 * (1.0 + sign * (1.0 - poly * std::exp(-x*x/2.0) * 0.3989422804));
}

constexpr double bs_delta(double S, double K, double T,
                           double r, double sigma, bool call) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    return call ? norm_cdf(d1) : norm_cdf(d1) - 1.0;
}

// Table of deltas for a fixed strike grid — evaluated at compile time
constexpr std::array<double, 5> DELTAS = {
    bs_delta(90,100,1,0.05,0.2,true),
    bs_delta(95,100,1,0.05,0.2,true),
    bs_delta(100,100,1,0.05,0.2,true),
    bs_delta(105,100,1,0.05,0.2,true),
    bs_delta(110,100,1,0.05,0.2,true),
};

int main() {
    double spots[] = {90,95,100,105,110};
    for (int i = 0; i < 5; ++i)
        printf("S=%.0f delta=%.4f\\n", spots[i], DELTAS[i]);
}`,
    explanation: "Marking the formula constexpr lets the compiler evaluate the entire delta table at compile time, embedding the results as constants in the binary — useful for lookups over a static grid where computing at load time would repeat work, and for unit-testing that formula logic is pure with no hidden state.",
  },
  {
    id: "cpp-20260729-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson implicit finite-difference PDE solver",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <cstdio>

// Crank-Nicolson: average of explicit (FTCS) and implicit (BTCS) schemes.
// Unconditionally stable; second-order in both space and time.
// Tridiagonal system solved by Thomas algorithm (O(N)).

void thomas(const std::vector<double>& a, std::vector<double> b,
            const std::vector<double>& c, std::vector<double> d,
            std::vector<double>& x) {
    int n = b.size();
    x.resize(n);
    for (int i = 1; i < n; ++i) {
        double m = a[i] / b[i-1];
        b[i] -= m * c[i-1];
        d[i] -= m * d[i-1];
    }
    x[n-1] = d[n-1] / b[n-1];
    for (int i = n-2; i >= 0; --i)
        x[i] = (d[i] - c[i]*x[i+1]) / b[i];
}

double cn_european_put(double S0, double K, double T, double r,
                        double sigma, int M=200, int N=200) {
    double Smax = 3*K, dS = Smax/M, dt = T/N;
    std::vector<double> S(M+1), V(M+1);
    for (int j = 0; j <= M; ++j) S[j] = j*dS;

    // Terminal condition: put payoff
    for (int j = 0; j <= M; ++j) V[j] = std::max(K - S[j], 0.0);

    std::vector<double> a(M-1), b(M-1), c(M-1), d(M-1), Vnew;

    for (int i = N-1; i >= 0; --i) {
        for (int j = 1; j < M; ++j) {
            double s = S[j];
            double alpha = 0.25*dt*(sigma*sigma*j*j - r*j);
            double beta  = -0.5*dt*(sigma*sigma*j*j + r);
            double gamma = 0.25*dt*(sigma*sigma*j*j + r*j);
            int jj = j-1;
            a[jj] = -alpha;
            b[jj] = 1 - beta;
            c[jj] = -gamma;
            d[jj] = alpha*V[j-1] + (1+beta)*V[j] + gamma*V[j+1];
        }
        // Boundary: V(0)=K*exp(-r*(T-i*dt)), V(Smax)~0
        d[0]   += alpha_bound(0,dt,r)*K*std::exp(-r*(i)*dt);
        thomas(a, b, c, d, Vnew);
        for (int j = 1; j < M; ++j) V[j] = Vnew[j-1];
        V[0] = K*std::exp(-r*(i)*dt);
        V[M] = 0;
    }
    int j0 = static_cast<int>(S0/dS);
    double w = (S0 - S[j0])/dS;
    return (1-w)*V[j0] + w*V[j0+1];
}

// Helper — extracted to avoid lambda in function body
static double alpha_bound(int,double dt,double r){ return 0.25*dt*r; }

int main() {
    printf("CN put: %.4f\\n", cn_european_put(100,100,1,0.05,0.2));
}`,
    explanation: "Crank-Nicolson averages the forward and backward time steps to achieve O(dt²) accuracy with unconditional stability, avoiding the CFL condition that limits explicit schemes to tiny time steps; the Thomas algorithm solves the resulting tridiagonal system in O(N) instead of O(N³), making it fast enough for real-time Greeks via bumped grids.",
  },
  {
    id: "cpp-20260729-b1-asian-mc",
    language: "cpp",
    title: "Asian option Monte Carlo (arithmetic average)",
    tag: "numerics",
    code: `#include <cmath>
#include <numeric>
#include <vector>
#include <random>
#include <cstdio>

// Arithmetic average Asian call: payoff = max(A - K, 0) where A = mean(S_t).
// No closed form for arithmetic Asian; geometric Asian has a closed form
// and can be used as a control variate.

double asian_call_mc(double S0, double K, double T, double r,
                     double sigma, int n_paths=200'000, int n_steps=252) {
    double dt = T / n_steps;
    double drift = (r - 0.5*sigma*sigma)*dt;
    double diffuse = sigma*std::sqrt(dt);

    std::mt19937_64 rng(42);
    std::normal_distribution<double> nd;

    double sum_payoff = 0;
    for (int p = 0; p < n_paths; ++p) {
        double S = S0;
        double running_sum = 0;
        for (int i = 0; i < n_steps; ++i) {
            S *= std::exp(drift + diffuse * nd(rng));
            running_sum += S;
        }
        double arith_avg = running_sum / n_steps;
        sum_payoff += std::max(arith_avg - K, 0.0);
    }
    return std::exp(-r*T) * sum_payoff / n_paths;
}

// Geometric average — has closed-form benchmark
double asian_geo_call_mc(double S0, double K, double T, double r,
                          double sigma, int n_paths=200'000, int n_steps=252) {
    double dt = T / n_steps;
    double drift = (r - 0.5*sigma*sigma)*dt;
    double diffuse = sigma*std::sqrt(dt);
    std::mt19937_64 rng(42);
    std::normal_distribution<double> nd;
    double sp = 0;
    for (int p = 0; p < n_paths; ++p) {
        double S = S0, log_sum = 0;
        for (int i = 0; i < n_steps; ++i) {
            S *= std::exp(drift + diffuse*nd(rng));
            log_sum += std::log(S);
        }
        double geo_avg = std::exp(log_sum / n_steps);
        sp += std::max(geo_avg - K, 0.0);
    }
    return std::exp(-r*T) * sp / n_paths;
}

int main() {
    printf("Arith Asian: %.4f\\n", asian_call_mc(100,100,1,0.05,0.2));
    printf("Geo   Asian: %.4f\\n", asian_geo_call_mc(100,100,1,0.05,0.2));
}`,
    explanation: "Arithmetic Asians have no closed form because the sum of lognormals isn't lognormal; the geometric average does have a closed form and acts as an excellent control variate — compute both with the same random numbers and regress to reduce variance by 90%+ in practice.",
  },
  {
    id: "cpp-20260729-b1-lookback-mc",
    language: "cpp",
    title: "Lookback option Monte Carlo (fixed and floating strike)",
    tag: "numerics",
    code: `#include <cmath>
#include <algorithm>
#include <random>
#include <cstdio>

// Fixed-strike lookback call: payoff = max(S_max - K, 0)
// Floating-strike lookback call: payoff = S_T - S_min
// Both path-dependent; MC is the standard pricing method.

struct LookbackPrices { double fixed_call, floating_call; };

LookbackPrices lookback_mc(double S0, double K, double T, double r,
                            double sigma, int n_paths=200'000, int n_steps=252) {
    double dt = T / n_steps;
    double drift   = (r - 0.5*sigma*sigma)*dt;
    double diffuse = sigma*std::sqrt(dt);
    std::mt19937_64 rng(42);
    std::normal_distribution<double> nd;

    double sum_fixed = 0, sum_floating = 0;
    for (int p = 0; p < n_paths; ++p) {
        double S = S0, S_max = S0, S_min = S0;
        for (int i = 0; i < n_steps; ++i) {
            S *= std::exp(drift + diffuse*nd(rng));
            S_max = std::max(S_max, S);
            S_min = std::min(S_min, S);
        }
        sum_fixed    += std::max(S_max - K, 0.0);   // fixed strike
        sum_floating += S - S_min;                   // floating: guaranteed > 0
    }
    double df = std::exp(-r*T);
    return {df * sum_fixed    / n_paths,
            df * sum_floating / n_paths};
}

int main() {
    auto [fc, fl] = lookback_mc(100, 100, 1, 0.05, 0.2);
    printf("Fixed lookback call:    %.4f\\n", fc);
    printf("Floating lookback call: %.4f\\n", fl);
}`,
    explanation: "Lookback options have the highest gamma of any vanilla exotic because the payoff depends on the running extremum — the holder always gets the best price; the floating-strike variant is always in the money (payoff ≥ 0), so its price is typically several times a vanilla call, and both variants have closed-form solutions that the MC can be benchmarked against.",
  },
  {
    id: "cpp-20260729-b1-barrier-closed-form",
    language: "cpp",
    title: "Up-and-in barrier call: closed-form analytical price",
    tag: "numerics",
    code: `#include <cmath>
#include <cstdio>

// Up-and-in call: activated only if S crosses barrier H from below.
// For H >= K, the Rubinstein-Reiner (1991) formula applies.
// Uses reflection principle: UIC = BSCall - UOC, where UOC is up-and-out.

static double N(double x) {
    return 0.5 * std::erfc(-x / std::sqrt(2.0));
}

double up_and_in_call(double S, double K, double H,
                       double T, double r, double q, double sigma) {
    if (H <= K) {
        // When H <= K, UIC = vanilla call (barrier is OTM)
        // Simplified: revert to BS
    }
    double mu   = (r - q - 0.5*sigma*sigma) / (sigma*sigma);
    double lam  = std::sqrt(mu*mu + 2*r/(sigma*sigma));
    double y1   = std::log(H*H/(S*K)) / (sigma*std::sqrt(T))
                  + lam*sigma*std::sqrt(T);
    double x1   = std::log(S/H)        / (sigma*std::sqrt(T))
                  + lam*sigma*std::sqrt(T);
    double eta  = 1.0;  // up-and-in: eta = 1, phi = 1
    double phi  = 1.0;

    double HoS  = H / S;
    // Rubinstein-Reiner formula for up-and-in call (H >= K)
    double price = S * std::exp(-q*T) * std::pow(HoS, 2*(mu+1))
                   * N(eta*y1)
                 - K * std::exp(-r*T) * std::pow(HoS, 2*mu)
                   * N(eta*y1 - eta*sigma*std::sqrt(T));
    return price;
}

int main() {
    // S=100, K=100, H=110, T=1, r=5%, q=0%, sigma=20%
    double p = up_and_in_call(100, 100, 110, 1.0, 0.05, 0.0, 0.20);
    printf("Up-and-in call (H=110): %.4f\\n", p);
    // Compare: vanilla call at these params ~10.45; UIC < vanilla since
    // barrier must be hit first.
}`,
    explanation: "The Rubinstein-Reiner formula prices barrier options analytically via the reflection principle: the barrier creates a 'mirror' path in log-price space, and the up-and-in price is the probability-weighted portion of the vanilla call that activates; it converges to the vanilla price as H → 0 and to zero as H → ∞.",
  },
  {
    id: "cpp-20260729-b1-fx-graph-maxrate",
    language: "cpp",
    title: "FX conversion: maximum product path via log-transform",
    tag: "graph",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <limits>
#include <cstdio>

// To maximise the product of exchange rates (S1*S2*...*Sk),
// take log: maximise sum(log(rate)). Equivalently, find shortest
// path of -log(rate) weights via Bellman-Ford.
// Negative cycle = FX arbitrage opportunity.

struct Edge { int u, v; double log_neg_rate; };

std::vector<double> best_fx_conversion(int n, const std::vector<Edge>& edges, int src) {
    const double INF = std::numeric_limits<double>::infinity();
    std::vector<double> dist(n, INF);
    dist[src] = 0.0;

    for (int i = 0; i < n-1; ++i) {
        bool updated = false;
        for (auto& [u, v, w] : edges) {
            if (dist[u] < INF && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                updated = true;
            }
        }
        if (!updated) break; // early exit
    }

    // Check for negative-weight cycles (arbitrage)
    for (auto& [u, v, w] : edges) {
        if (dist[u] < INF && dist[u] + w < dist[v] - 1e-9) {
            printf("Arbitrage cycle detected!\\n");
            return {};
        }
    }
    return dist;  // best_rate[i] = exp(-dist[i])
}

int main() {
    // 4 currencies: USD(0), EUR(1), GBP(2), JPY(3)
    // rates: USD->EUR 0.92, EUR->GBP 0.86, USD->GBP 0.79, GBP->JPY 185.0
    std::vector<Edge> edges = {
        {0, 1, -std::log(0.92)},
        {1, 2, -std::log(0.86)},
        {0, 2, -std::log(0.79)},
        {2, 3, -std::log(185.0)},
        {0, 3, -std::log(150.0)}, // direct USD->JPY
    };
    auto dist = best_fx_conversion(4, edges, 0);
    if (!dist.empty()) {
        printf("Best USD->JPY rate: %.4f\\n", std::exp(-dist[3]));
        printf("Best USD->EUR rate: %.4f\\n", std::exp(-dist[1]));
    }
}`,
    explanation: "Maximising a product of rates is equivalent to minimising the sum of negative logs, reducing the FX routing problem to a single-source shortest-path on a weighted directed graph; Bellman-Ford finds the optimal path in O(V·E) and its negative-cycle detection directly identifies arbitrage opportunities where the product of a cycle's rates exceeds 1.",
  },
  {
    id: "cpp-20260729-b1-thread-affinity",
    language: "cpp",
    title: "CPU pinning with pthread_setaffinity_np",
    tag: "low-latency",
    code: `#include <pthread.h>
#include <sched.h>
#include <cstdio>
#include <stdexcept>
#include <string>

// Pinning a thread to a specific logical CPU eliminates scheduler
// migrations and reduces context-switch overhead. Combine with
// isolcpus= kernel parameter to keep the OS off that core entirely.

void pin_thread_to_cpu(int cpu_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(cpu_id, &cpuset);
    int rc = pthread_setaffinity_np(pthread_self(),
                                    sizeof(cpu_set_t), &cpuset);
    if (rc != 0)
        throw std::runtime_error("pthread_setaffinity_np failed: "
                                  + std::string(strerror(rc)));
}

// Also set real-time scheduling priority (requires CAP_SYS_NICE or root)
void set_realtime(int priority = 80) {
    struct sched_param sp{};
    sp.sched_priority = priority;
    if (pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp) != 0)
        perror("setschedparam");  // log but don't throw — may lack permission
}

void market_data_thread() {
    pin_thread_to_cpu(3);      // isolated core 3
    set_realtime(90);          // highest priority on that core
    printf("Pinned to CPU 3, SCHED_FIFO priority 90\\n");
    // hot loop here — never yields, never migrates
}

void order_entry_thread() {
    pin_thread_to_cpu(4);
    set_realtime(85);
    printf("Pinned to CPU 4\\n");
}

int main() {
    pthread_t t1, t2;
    pthread_create(&t1, nullptr, [](void*)->void*{ market_data_thread(); return nullptr; }, nullptr);
    pthread_create(&t2, nullptr, [](void*)->void*{ order_entry_thread(); return nullptr; }, nullptr);
    pthread_join(t1, nullptr);
    pthread_join(t2, nullptr);
}`,
    explanation: "Pinning the market-data thread to an isolated core eliminates OS scheduling jitter from hundreds of microseconds to sub-microsecond; combining with SCHED_FIFO prevents preemption, and placing the order-entry thread on an adjacent core sharing the same L3 cache minimises the latency of inter-thread communication via the shared cache.",
  },
  {
    id: "cpp-20260729-b1-pnl-attribution",
    language: "cpp",
    title: "Greeks-based P&L attribution across risk factors",
    tag: "risk",
    code: `#include <cmath>
#include <cstdio>

// Taylor-expand P&L in delta, gamma, vega, theta, rho:
//   dP = delta*dS + 0.5*gamma*dS^2 + vega*dVol + theta*dt + rho*dr
//      + unexplained_residual

struct Greeks {
    double delta;   // dP/dS
    double gamma;   // d²P/dS²
    double vega;    // dP/d(sigma)
    double theta;   // dP/dt  (per day, usually negative)
    double rho;     // dP/dr
};

struct RiskFactorMove {
    double dS;      // spot move
    double dVol;    // implied vol move
    double dt;      // time elapsed (days)
    double dr;      // rate move
};

struct PnLAttribution {
    double delta_pnl;
    double gamma_pnl;
    double vega_pnl;
    double theta_pnl;
    double rho_pnl;
    double total_explained;
    double residual;     // actual - explained (higher-order effects)
};

PnLAttribution attribute(const Greeks& g, const RiskFactorMove& m,
                          double actual_pnl) {
    PnLAttribution a{};
    a.delta_pnl = g.delta * m.dS;
    a.gamma_pnl = 0.5 * g.gamma * m.dS * m.dS;
    a.vega_pnl  = g.vega * m.dVol;
    a.theta_pnl = g.theta * m.dt;
    a.rho_pnl   = g.rho * m.dr;
    a.total_explained = a.delta_pnl + a.gamma_pnl + a.vega_pnl
                       + a.theta_pnl + a.rho_pnl;
    a.residual = actual_pnl - a.total_explained;
    return a;
}

int main() {
    Greeks g{0.50, 0.03, 150.0, -0.05, 25.0};
    RiskFactorMove m{+1.0, +0.005, 1.0, 0.0};
    double actual = 0.58;   // observed P&L
    auto a = attribute(g, m, actual);
    printf("delta: %+.4f  gamma: %+.4f  vega: %+.4f\\n",
           a.delta_pnl, a.gamma_pnl, a.vega_pnl);
    printf("theta: %+.4f  rho:   %+.4f  resid: %+.4f\\n",
           a.theta_pnl, a.rho_pnl, a.residual);
    printf("explained=%.4f  actual=%.4f\\n", a.total_explained, actual);
}`,
    explanation: "Greeks-based P&L attribution decomposes the daily P&L into risk-factor contributions, enabling a risk manager to verify that the book's actual P&L is consistent with its reported sensitivities; a large unexplained residual signals either model risk (higher-order terms dominating) or a data error.",
  },
  {
    id: "cpp-20260729-b1-incremental-pnl",
    language: "cpp",
    title: "Incremental P&L engine on each tick update",
    tag: "risk",
    code: `#include <unordered_map>
#include <string>
#include <cstdio>

// An incremental P&L engine updates each position's unrealised P&L
// on every tick, rather than revaluing the whole portfolio.
// Critical for real-time risk limits in HFT.

struct Position {
    int       qty;         // net quantity (positive = long)
    double    avg_price;   // VWAP entry price
    double    last_price;  // last market price
    double    unrealised_pnl() const { return qty * (last_price - avg_price); }
};

class IncrementalPnL {
    std::unordered_map<std::string, Position> positions_;
    double realised_pnl_ = 0.0;

public:
    void on_fill(const std::string& sym, int qty, double price) {
        auto& p = positions_[sym];
        if (p.qty == 0) {
            p.avg_price = price;
            p.last_price = price;
            p.qty = qty;
        } else if ((p.qty > 0) == (qty > 0)) {
            // Adding to position: VWAP update
            double total_cost = p.avg_price * p.qty + price * qty;
            p.qty += qty;
            p.avg_price = total_cost / p.qty;
        } else {
            // Reducing/reversing position: realise P&L on closed portion
            int closed = std::min(std::abs(p.qty), std::abs(qty));
            realised_pnl_ += closed * (price - p.avg_price) * (p.qty > 0 ? 1 : -1);
            p.qty += qty;
            if (p.qty == 0) p.avg_price = 0;
            else if ((p.qty > 0) != (qty > 0)) p.avg_price = price; // reversed
        }
    }

    void on_tick(const std::string& sym, double price) {
        auto it = positions_.find(sym);
        if (it != positions_.end()) it->second.last_price = price;
    }

    double total_pnl() const {
        double upnl = 0;
        for (auto& [sym, pos] : positions_) upnl += pos.unrealised_pnl();
        return realised_pnl_ + upnl;
    }

    void print(const std::string& sym) const {
        if (auto it = positions_.find(sym); it != positions_.end()) {
            const auto& p = it->second;
            printf("%s qty=%d avg=%.2f last=%.2f upnl=%.2f\\n",
                   sym.c_str(), p.qty, p.avg_price, p.last_price, p.unrealised_pnl());
        }
    }
};

int main() {
    IncrementalPnL engine;
    engine.on_fill("AAPL", 100, 150.00);
    engine.on_tick("AAPL", 151.50);
    engine.print("AAPL");
    engine.on_fill("AAPL", -50, 152.00);  // partial close
    printf("Total P&L: %.2f\\n", engine.total_pnl());
}`,
    explanation: "An incremental P&L engine updates only the affected position on each event rather than re-scanning the entire portfolio, reducing per-tick work from O(N) to O(1); the VWAP update formula avoids accumulating floating-point error by computing a running average rather than summing all fills.",
  },
  {
    id: "cpp-20260729-b1-flat-map-levels",
    language: "cpp",
    title: "std::flat_map (C++23) for price level storage",
    tag: "modern-cpp",
    code: `// C++23: std::flat_map stores keys and values in separate sorted vectors,
// giving better cache locality than std::map's pointer-chasing nodes.
// Ideal for a small number of price levels (< 100) accessed sequentially.

#ifdef __cpp_lib_flat_map
#include <flat_map>
#include <cstdint>
#include <cstdio>

// flat_map<price, qty>: underlying storage is two contiguous vectors.
// Iteration order is sorted ascending by price.
// Insert/erase: O(N) (shift), Lookup: O(log N) binary search.
// Wins over std::map when N < ~200 due to cache-line utilisation.

int main() {
    std::flat_map<uint32_t, uint64_t> ask_levels;  // price_ticks -> total_qty
    ask_levels[10050] += 200;
    ask_levels[10055] += 100;
    ask_levels[10060] += 500;
    ask_levels[10050] += 300;  // add to existing level

    printf("Ask book (sorted):\\n");
    for (auto [price, qty] : ask_levels)
        printf("  %.2f x %llu\\n", price / 100.0, qty);

    // best ask: begin()
    printf("Best ask: %.2f\\n", ask_levels.begin()->first / 100.0);

    // Erase depleted level
    ask_levels.erase(10050);
    printf("After erase best ask: %.2f\\n", ask_levels.begin()->first / 100.0);
}
#else
#include <cstdio>
int main() { printf("std::flat_map requires C++23\\n"); }
#endif`,
    explanation: "std::flat_map stores keys and values in contiguous memory (two sorted vectors), achieving better cache performance than std::map for iteration and small-N lookups — an order book with under 200 price levels fits entirely in L2 cache, turning what would be pointer-chasing into a sequential scan or binary search within a single cache line.",
  },
  {
    id: "cpp-20260729-b1-order-matcher",
    language: "cpp",
    title: "Price-time priority order matcher",
    tag: "order-book",
    code: `#include <map>
#include <queue>
#include <cstdint>
#include <functional>
#include <cstdio>

// Price-time priority: best price first, FIFO within a price level.
// Bids: descending price; asks: ascending price.

struct Order { uint64_t id; uint32_t qty; uint64_t ts; };
// Level = FIFO queue at one price
using Level = std::queue<Order>;

struct Fill { uint64_t bid_id, ask_id; uint32_t qty; uint32_t price; };

std::map<uint32_t, Level, std::greater<uint32_t>> bids;
std::map<uint32_t, Level, std::less<uint32_t>>    asks;

std::vector<Fill> fills;
uint64_t order_seq = 0;

void add_bid(uint32_t price, uint32_t qty) {
    bids[price].push({++order_seq, qty, order_seq});
    // Try to match against resting asks
    while (!bids.empty() && !asks.empty() &&
           bids.begin()->first >= asks.begin()->first) {
        auto& [bp, blvl] = *bids.begin();
        auto& [ap, alvl] = *asks.begin();
        uint32_t trade_qty = std::min(blvl.front().qty, alvl.front().qty);
        uint32_t trade_px  = alvl.front().ts < blvl.front().ts ? ap : bp; // passive side sets price
        fills.push_back({blvl.front().id, alvl.front().id, trade_qty, trade_px});
        printf("FILL %u x %u @ %u\\n", trade_qty, trade_qty, trade_px);
        blvl.front().qty -= trade_qty;
        alvl.front().qty -= trade_qty;
        if (blvl.front().qty == 0) { blvl.pop(); if (blvl.empty()) bids.erase(bids.begin()); }
        if (alvl.front().qty == 0) { alvl.pop(); if (alvl.empty()) asks.erase(asks.begin()); }
    }
}

void add_ask(uint32_t price, uint32_t qty) {
    asks[price].push({++order_seq, qty, order_seq});
}

int main() {
    add_ask(10050, 100);
    add_ask(10055, 200);
    add_bid(10060, 150);   // crosses the spread — should match 100@10050 + 50@10055
}`,
    explanation: "Price-time priority matches the oldest order at the best price first; storing each price level as a FIFO queue gives O(1) front-of-queue access and O(log P) to advance to the next price level, where P is the number of distinct prices — in a liquid market P is small and the book fits in L2 cache.",
  },
  {
    id: "cpp-20260729-b1-dupire-local-vol",
    language: "cpp",
    title: "Dupire local volatility from implied vol surface",
    tag: "numerics",
    code: `#include <cmath>
#include <functional>
#include <cstdio>

// Dupire (1994): local vol sigma_loc(K,T)^2 derived from market implied vols.
// sigma_loc^2 = [ dC/dT + r*K*dC/dK ] /
//               [ 0.5*K^2*d²C/dK² ]
// where C(K,T) is the market call price surface.
// We compute finite-difference derivatives on a sampled surface.

// Market implied vol surface (toy: flat + skew)
double implied_vol(double K, double T) {
    double atm = 0.20;
    double skew = -0.05 * std::log(K / 100.0);  // negative skew
    double term_structure = 0.01 * std::sqrt(T);
    return atm + skew + term_structure;
}

double bs_call(double S, double K, double T, double r, double sigma) {
    double d1 = (std::log(S/K) + (r+0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma*std::sqrt(T);
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    return S*N(d1) - K*std::exp(-r*T)*N(d2);
}

double market_call(double S, double K, double T, double r) {
    return bs_call(S, K, T, r, implied_vol(K, T));
}

double dupire_local_vol(double S, double K, double T, double r) {
    double dK = K * 0.001, dT = T * 0.01;
    double C    = market_call(S, K,    T,    r);
    double C_Kp = market_call(S, K+dK, T,    r);
    double C_Km = market_call(S, K-dK, T,    r);
    double C_Tp = market_call(S, K,    T+dT, r);

    double dC_dT  = (C_Tp - C)   / dT;
    double dC_dK  = (C_Kp - C_Km)/ (2*dK);
    double d2C_dK2= (C_Kp - 2*C + C_Km) / (dK*dK);

    double num = dC_dT + r * K * dC_dK;
    double den = 0.5 * K*K * d2C_dK2;
    return (den > 1e-12) ? std::sqrt(std::max(num/den, 0.0)) : 0.0;
}

int main() {
    double S=100, r=0.05;
    for (double K : {80.0, 90.0, 100.0, 110.0, 120.0})
        printf("K=%.0f  impl_vol=%.4f  local_vol=%.4f\\n",
               K, implied_vol(K,1.0), dupire_local_vol(S,K,1.0,r));
}`,
    explanation: "Dupire's formula inverts the relationship between market call prices and the local volatility function sigma(K,T), producing a diffusion that exactly reproduces all observed option prices simultaneously; it is fundamental in exotics pricing where the model must be consistent with the vanilla surface, and the finite-difference implementation handles arbitrary market surfaces numerically.",
  },
];
