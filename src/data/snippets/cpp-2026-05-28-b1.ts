import type { Snippet } from "./types";

export const cppSnippets20260528B1: Snippet[] = [
  {
    id: "cpp-20260528-b1-concepts",
    language: "cpp",
    title: "C++20 Concepts — type constraints for quant interfaces",
    tag: "templates",
    code: `#include <concepts>
#include <cstdint>
#include <vector>
#include <type_traits>

// Concept: any numeric scalar (integral or floating-point).
template<typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

// Concept: any type that exposes price() and qty() accessors.
template<typename T>
concept Priceable = requires(const T t) {
    { t.price() } -> Numeric;
    { t.qty()   } -> std::integral<std::remove_cvref_t<decltype(t.qty())>>;
};

// Concept: a range that supports push_back and iteration.
template<typename C>
concept PushableRange = requires(C c, typename C::value_type v) {
    c.push_back(v);
    c.begin();
    c.end();
};

struct Quote {
    double price() const noexcept { return px_;  }
    int    qty()   const noexcept { return qty_; }
    double px_  = 0.0;
    int    qty_ = 0;
};

// Constrained template: error fires at call site with a readable message.
template<Priceable T, PushableRange C>
void collect(C& book, const T& q) { book.push_back(q); }

// Abbreviated C++20 syntax: 'auto' parameter with concept name.
Numeric auto clamp_tick(Numeric auto px, Numeric auto lo, Numeric auto hi) {
    if (px < lo) return lo;
    if (px > hi) return hi;
    return px;
}

int main() {
    std::vector<Quote> bids;
    Quote q{100.5, 200};
    collect(bids, q);
    auto p = clamp_tick(250.5, 200.0, 300.0);
    (void)p;
}`,
    explanation:
      "C++20 concepts replace SFINAE: constraints appear at the call site, producing a human-readable error instead of a template-instantiation avalanche. The `requires` clause composes via `&&` and `||`, letting you encode protocol contracts (every priceable quote must expose price() and qty()) directly in the type system.",
  },
  {
    id: "cpp-20260528-b1-sfinae",
    language: "cpp",
    title: "SFINAE with enable_if — pre-concepts approach (still widespread)",
    tag: "templates",
    code: `#include <type_traits>
#include <cstdint>
#include <string>

// SFINAE (Substitution Failure Is Not An Error):
// enable_if<condition, T>::type only exists when condition is true.
// If it doesn't exist, the specialisation is silently discarded.

// Overload 1: enabled only for integral types.
template<typename T,
         typename = std::enable_if_t<std::is_integral_v<T>>>
T round_to_tick(T price, T tick_size) {
    return (price / tick_size) * tick_size;
}

// Overload 2: enabled only for floating-point types.
template<typename T,
         typename = std::enable_if_t<std::is_floating_point_v<T>>,
         int = 0>   // extra dummy parameter to avoid ambiguous overload
T round_to_tick(T price, T tick_size) {
    return static_cast<T>(static_cast<long long>(price / tick_size)) * tick_size;
}

// Tag dispatch alternative — often cleaner than enable_if chains.
template<typename T>
T serialize_price_impl(T v, std::true_type  /*integral*/) { return v; }

template<typename T>
std::int64_t serialize_price_impl(T v, std::false_type /*fp*/) {
    return static_cast<std::int64_t>(v * 10000.0); // store as fixed-point
}

template<typename T>
auto serialize_price(T v) {
    return serialize_price_impl(v, std::is_integral<T>{});
}

int main() {
    auto a = round_to_tick<int>(1237, 5);               // 1235
    auto b = round_to_tick<double>(1237.8, 0.25);       // 1237.75
    auto c = serialize_price(1237.50);                  // 12375000
    (void)a; (void)b; (void)c;
}`,
    explanation:
      "SFINAE is the pre-C++20 mechanism for conditional overload resolution. enable_if is still ubiquitous in legacy codebases and third-party headers; understanding it is essential when reading existing quant infrastructure code. Tag dispatch (the overload accepting a std::true_type / std::false_type dummy) is often cleaner and produces better compiler errors.",
  },
  {
    id: "cpp-20260528-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-size pool allocator for hot-path order nodes",
    tag: "memory",
    code: `#include <cstddef>
#include <array>
#include <stdexcept>
#include <cstdint>

// Pool allocator: a pre-allocated slab of fixed-size blocks arranged as
// a free list. Allocation and deallocation are O(1) with no heap fragmentation.
// Critical in order books where new/delete inside the matching loop would
// introduce unpredictable latency.

template<typename T, std::size_t Capacity>
class PoolAllocator {
    union Block {
        alignas(T) std::byte storage[sizeof(T)];
        Block* next;        // intrusive free-list pointer
    };

    std::array<Block, Capacity> pool_;
    Block* free_head_ = nullptr;
    std::size_t used_  = 0;

public:
    PoolAllocator() noexcept {
        // Link all blocks into the free list at construction.
        for (std::size_t i = 0; i + 1 < Capacity; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[Capacity - 1].next = nullptr;
        free_head_ = &pool_[0];
    }

    [[nodiscard]] T* allocate() {
        if (!free_head_) throw std::bad_alloc{};
        Block* b  = free_head_;
        free_head_ = b->next;
        ++used_;
        return reinterpret_cast<T*>(b->storage);
    }

    void deallocate(T* ptr) noexcept {
        auto* b    = reinterpret_cast<Block*>(ptr);
        b->next    = free_head_;
        free_head_ = b;
        --used_;
    }

    std::size_t used()      const noexcept { return used_; }
    std::size_t available() const noexcept { return Capacity - used_; }
};

struct OrderNode { std::uint64_t id; double price; std::uint32_t qty; };

int main() {
    PoolAllocator<OrderNode, 4096> pool;

    OrderNode* o1 = pool.allocate();
    *o1 = {1001, 100.25, 500};

    pool.deallocate(o1);    // returns block to free list — no heap call
}`,
    explanation:
      "A pool allocator converts heap allocation into a free-list pointer swap: zero system calls, zero fragmentation, and deterministic latency. The entire pool is stack- or BSS-allocated, so it never causes a page fault mid-trade. The union trick reuses the object's storage bytes for the free-list pointer when the block is not in use, avoiding any extra metadata overhead.",
  },
  {
    id: "cpp-20260528-b1-arena-allocator",
    language: "cpp",
    title: "Arena (bump) allocator for per-event scratch memory",
    tag: "memory",
    code: `#include <cstddef>
#include <cstring>
#include <cassert>
#include <new>

// Arena allocator: a monotonic bump pointer.
// Fastest possible allocation — just increment a pointer.
// No individual deallocations; reset() frees the entire arena at once.
// Ideal for per-tick scratch buffers: parse a message, build the side-effect
// structs, apply the trade, then reset_and_reuse for the next message.

template<std::size_t Bytes>
class ArenaAllocator {
    alignas(std::max_align_t) std::byte buf_[Bytes];
    std::size_t offset_ = 0;

public:
    void* allocate(std::size_t size, std::size_t align = alignof(std::max_align_t)) {
        // Round offset up to the required alignment.
        std::size_t pad = (align - (offset_ % align)) % align;
        std::size_t start = offset_ + pad;
        if (start + size > Bytes) return nullptr;  // out of space
        offset_ = start + size;
        return buf_ + start;
    }

    // Typed helper: allocate and construct an object.
    template<typename T, typename... Args>
    T* make(Args&&... args) {
        void* p = allocate(sizeof(T), alignof(T));
        if (!p) throw std::bad_alloc{};
        return ::new(p) T{std::forward<Args>(args)...};
    }

    // Reset without zeroing — next allocation reuses from the beginning.
    void reset() noexcept { offset_ = 0; }

    std::size_t used()      const noexcept { return offset_; }
    std::size_t capacity()  const noexcept { return Bytes;   }
};

struct Spread { double bid; double ask; };

int main() {
    ArenaAllocator<64 * 1024> arena;   // 64 KB per-tick scratch

    Spread* s = arena.make<Spread>(100.0, 100.25);
    (void)s;

    arena.reset();   // ready for the next tick — no individual frees
}`,
    explanation:
      "The arena's `reset()` is a single integer assignment — the cheapest possible bulk deallocation. Because it never calls destructors, it is appropriate only for trivially destructible or explicitly destroyed objects. In feed handlers that process millions of messages per second, using an arena for message parsing eliminates the malloc/free hot path entirely.",
  },
  {
    id: "cpp-20260528-b1-seqlock",
    language: "cpp",
    title: "Seqlock — optimistic reader-writer without mutex",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>

// Seqlock (sequence lock): allows concurrent reads without locking.
// Writer increments an odd sequence counter before and after writing.
// Reader checks: if seq was odd (write in flight) OR changed, retry.
// Fast-path readers pay only two atomic loads + a data copy — no CAS.
// Critical: data members must be accessed with relaxed atomics or
// memcpy into a snapshot, because the retry handles torn reads.

struct SnapPrice {
    double  bid;
    double  ask;
    std::int64_t ts_ns;
};

class SeqLockPrice {
    std::atomic<std::uint32_t> seq_{0};   // even = stable, odd = writing
    SnapPrice data_{};

public:
    // Writer: call only from a single writer thread.
    void write(const SnapPrice& p) noexcept {
        seq_.fetch_add(1, std::memory_order_release);   // seq becomes odd
        data_ = p;                                       // store data
        seq_.fetch_add(1, std::memory_order_release);   // seq becomes even again
    }

    // Reader: retries if a write is in progress or was concurrent.
    SnapPrice read() const noexcept {
        SnapPrice snap;
        std::uint32_t s0, s1;
        do {
            s0 = seq_.load(std::memory_order_acquire);
            if (s0 & 1u) continue;   // write in progress — spin
            snap = data_;            // optimistic copy
            s1 = seq_.load(std::memory_order_acquire);
        } while (s0 != s1);         // retry if seq changed during read
        return snap;
    }
};

int main() {
    SeqLockPrice sl;
    sl.write({100.0, 100.25, 1700000000000LL});
    auto snap = sl.read();
    (void)snap;
}`,
    explanation:
      "Seqlocks are used in Linux kernel timekeeping and in HFT market-data dissemination where one writer updates a quote and many readers consume it. The retry loop adds latency only on contention (concurrent write), which is rare when writes are very short. Unlike rwlocks, readers never block the writer — making it suitable when reads vastly outnumber writes.",
  },
  {
    id: "cpp-20260528-b1-itch-parser",
    language: "cpp",
    title: "ITCH 5.0 binary market-data parser",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <span>
#include <arpa/inet.h>   // ntohl / ntohs (big-endian decode)

// NASDAQ ITCH 5.0: binary UDP packets, big-endian byte order.
// Message type byte at offset 0. Fixed-length per type.
// 'A' (0x41) = Add Order: 36 bytes total.
// Message layout (Add Order):
//   [0]      message_type  char    'A'
//   [1..2]   stock_locate  uint16  market segment
//   [3..4]   tracking_num  uint16  sequence num
//   [5..10]  timestamp_ns  6 bytes big-endian uint48
//   [11..18] order_ref_num uint64  unique order ID
//   [19]     side          char    'B' or 'S'
//   [20..23] shares        uint32  qty
//   [24..31] stock         char[8] right-padded with spaces
//   [32..35] price         uint32  price * 10000

#pragma pack(push, 1)
struct ItchAddOrder {
    char          msg_type;
    std::uint16_t stock_locate;
    std::uint16_t tracking_num;
    std::uint8_t  timestamp[6];     // 48-bit nanosecond timestamp
    std::uint64_t order_ref_num;
    char          side;
    std::uint32_t shares;
    char          stock[8];
    std::uint32_t price;            // price * 10000
};
#pragma pack(pop)
static_assert(sizeof(ItchAddOrder) == 36);

// Decode big-endian 6-byte timestamp into uint64.
inline std::uint64_t decode_ts48(const std::uint8_t* ts) noexcept {
    std::uint64_t v = 0;
    for (int i = 0; i < 6; ++i) v = (v << 8) | ts[i];
    return v;
}

struct ParsedAdd {
    std::uint64_t order_id;
    std::uint64_t ts_ns;
    double        price;
    std::uint32_t qty;
    bool          is_buy;
    char          symbol[9];   // null-terminated copy
};

bool parse_add_order(std::span<const std::byte> buf, ParsedAdd& out) noexcept {
    if (buf.size() < sizeof(ItchAddOrder)) return false;
    const auto* m = reinterpret_cast<const ItchAddOrder*>(buf.data());
    if (m->msg_type != 'A') return false;

    out.order_id = be64toh(m->order_ref_num);
    out.ts_ns    = decode_ts48(m->timestamp);
    out.price    = static_cast<double>(ntohl(m->price)) / 10000.0;
    out.qty      = ntohl(m->shares);
    out.is_buy   = (m->side == 'B');
    std::memcpy(out.symbol, m->stock, 8);
    out.symbol[8] = '\\0';
    return true;
}`,
    explanation:
      "ITCH uses fixed-layout binary messages to achieve maximum throughput: no tag scanning, no string parsing, no heap allocation. The 6-byte timestamp is an unusual 48-bit big-endian integer that must be hand-decoded. `pragma pack(push,1)` ensures the struct matches the wire format exactly, making the cast from a raw byte buffer safe (assuming aligned access or a CPU that handles unaligned reads).",
  },
  {
    id: "cpp-20260528-b1-fix-tokenizer",
    language: "cpp",
    title: "FIX protocol tag-value tokenizer",
    tag: "market-data",
    code: `#include <string_view>
#include <cstdint>
#include <charconv>
#include <array>
#include <cstring>

// FIX 4.x: ASCII, SOH-delimited (0x01), tag=value pairs.
// Example: "8=FIX.4.2\x0135=D\x0149=CLIENT\x01..."
// A zero-copy tokenizer walks the buffer without copying or allocating.

static constexpr char SOH = '\x01';

// Decoded tag-value pair as string_views into the original buffer.
struct FIXField {
    int             tag;
    std::string_view value;
};

// Tokenise a FIX message in place. Caller supplies a pre-allocated slice.
// Returns number of fields populated.
int tokenise_fix(std::string_view msg,
                  FIXField* out, int max_fields) noexcept {
    int n = 0;
    std::size_t pos = 0;

    while (pos < msg.size() && n < max_fields) {
        // Find the '=' separator.
        auto eq = msg.find('=', pos);
        if (eq == std::string_view::npos) break;

        // Parse tag (integer to the left of '=').
        int tag = 0;
        auto [ptr, ec] = std::from_chars(msg.data() + pos,
                                          msg.data() + eq, tag);
        if (ec != std::errc{}) break;

        // Find the SOH delimiter (end of value).
        auto soh = msg.find(SOH, eq + 1);
        std::string_view val = (soh == std::string_view::npos)
            ? msg.substr(eq + 1)
            : msg.substr(eq + 1, soh - eq - 1);

        out[n++] = {tag, val};
        pos = (soh == std::string_view::npos) ? msg.size() : soh + 1;
    }
    return n;
}

int main() {
    // SOH replaced with '|' for readability; use '\\x01' in production.
    std::string_view raw = "8=FIX.4.2\x0135=D\x0149=CUST\x0156=ECN\x0155=AAPL\x0138=100\x0144=250.25\x01";
    std::array<FIXField, 32> fields;

    int count = tokenise_fix(raw, fields.data(), fields.size());
    for (int i = 0; i < count; ++i) {
        if (fields[i].tag == 55)        // Symbol
            (void)fields[i].value;
        if (fields[i].tag == 44)        // Price
            (void)fields[i].value;
    }
}`,
    explanation:
      "Zero-copy FIX tokenisation uses `string_view` slices into the original network buffer — no heap allocation per field. `std::from_chars` is the idiomatic fast integer parser (avoids `atoi`'s locale overhead and `std::stoi`'s exception machinery). In production FIX engines, this tokeniser feeds a direct lookup table indexed by tag number, achieving full message parse in under 200 nanoseconds.",
  },
  {
    id: "cpp-20260528-b1-hash-array-book",
    language: "cpp",
    title: "Hash + array hybrid order book — O(1) add/cancel by order ID",
    tag: "quant",
    code: `#include <unordered_map>
#include <map>
#include <list>
#include <cstdint>
#include <optional>

// Two-index order book:
// 1. Price index: std::map<price, Level> for sorted iteration (best bid/ask).
// 2. Order index: unordered_map<order_id, iterator> for O(1) cancel by ID.
// Cancel by order ID is O(1) amortised; add is O(log n) due to the price map.

using Price = std::int64_t;   // fixed-point, e.g. price * 10000

struct Order {
    std::uint64_t id;
    Price         price;
    std::uint32_t qty;
};

struct Level {
    std::uint32_t      total_qty = 0;
    std::list<Order>   orders;     // insertion-order within the level
};

class HybridBook {
    std::map<Price, Level, std::greater<Price>> bids_;  // highest price first
    std::map<Price, Level>                      asks_;  // lowest price first

    // Maps order_id → (is_bid, price, list iterator) for O(1) cancel.
    struct Ref { bool is_bid; Price price; std::list<Order>::iterator it; };
    std::unordered_map<std::uint64_t, Ref> idx_;

public:
    void add(const Order& o, bool is_bid) {
        auto& side = is_bid ? bids_ : asks_;
        auto& lvl  = side[o.price];
        lvl.total_qty += o.qty;
        auto it = lvl.orders.insert(lvl.orders.end(), o);
        idx_[o.id] = {is_bid, o.price, it};
    }

    bool cancel(std::uint64_t order_id) {
        auto ref_it = idx_.find(order_id);
        if (ref_it == idx_.end()) return false;
        auto& [is_bid, price, it] = ref_it->second;

        auto& side = is_bid ? bids_ : asks_;
        auto& lvl  = side.at(price);
        lvl.total_qty -= it->qty;
        lvl.orders.erase(it);
        if (lvl.orders.empty()) side.erase(price);
        idx_.erase(ref_it);
        return true;
    }

    std::optional<Price> best_bid() const {
        return bids_.empty() ? std::nullopt
                             : std::make_optional(bids_.begin()->first);
    }
    std::optional<Price> best_ask() const {
        return asks_.empty() ? std::nullopt
                             : std::make_optional(asks_.begin()->first);
    }
};`,
    explanation:
      "Production order books combine two data structures because each index is optimal for one access pattern: the sorted price map provides O(log n) top-of-book and level iteration, while the order-ID hash map gives O(1) cancel — the critical operation for high-cancel-rate markets (e.g. NASDAQ, where cancel rates exceed 95%). Storing a list iterator in the index makes cancel truly O(1) without scanning the level queue.",
  },
  {
    id: "cpp-20260528-b1-branch-hints",
    language: "cpp",
    title: "[[likely]] / [[unlikely]] — branch prediction hints in hot paths",
    tag: "performance",
    code: `#include <cstdint>
#include <cstdlib>

// [[likely]] and [[unlikely]] (C++20) communicate branch probabilities to
// the compiler, which reorders basic blocks so the fast path has no branch
// misprediction penalty. In a tight order-matching loop where 99.9% of
// incoming messages are Add orders, marking the cancel path [[unlikely]]
// keeps the Add path in the instruction cache's hot section.

enum class MsgType : std::uint8_t { Add = 0, Cancel, Modify, Trade };

struct Msg { MsgType type; std::uint64_t id; double price; std::uint32_t qty; };

// Simulated book operations.
void apply_add   (const Msg&) { /* insert into price map */ }
void apply_cancel(const Msg&) { /* O(1) erase via order-id index */ }
void apply_modify(const Msg&) { /* cancel + re-add */ }
void apply_trade (const Msg&) { /* update position + risk */ }

void process_message(const Msg& m) noexcept {
    if (m.type == MsgType::Add) [[likely]] {
        apply_add(m);
    } else if (m.type == MsgType::Cancel) [[unlikely]] {
        apply_cancel(m);
    } else if (m.type == MsgType::Modify) [[unlikely]] {
        apply_modify(m);
    } else [[unlikely]] {
        apply_trade(m);
    }
}

// Another pattern: guard clauses with [[unlikely]].
bool validate_order(double price, std::uint32_t qty) noexcept {
    if (price <= 0.0)  [[unlikely]] return false;
    if (qty   == 0)    [[unlikely]] return false;
    if (price > 1e8)   [[unlikely]] return false;  // sanity limit
    return true;
}`,
    explanation:
      "[[likely]]/[[unlikely]] are C++20's standardised branch hints, replacing `__builtin_expect(cond, 1)` from GCC. The compiler places the 'likely' basic block immediately after the conditional branch (no branch-not-taken penalty) and puts 'unlikely' blocks away from the hot L1 instruction cache region. In a 10M msg/s feed handler, eliminating one misprediction per 1000 messages saves ~50ms/second at a 50ns misprediction cost.",
  },
  {
    id: "cpp-20260528-b1-cpu-affinity",
    language: "cpp",
    title: "CPU thread pinning (pthread_setaffinity_np)",
    tag: "performance",
    code: `#ifdef __linux__
#include <pthread.h>
#include <sched.h>
#include <cstdio>
#include <thread>
#include <stdexcept>

// Thread pinning: bind a thread to a specific CPU core to avoid
// cross-core migrations (which flush the L1/L2 cache and reset the TLB).
// In HFT, the feed handler and the strategy thread are typically pinned to
// adjacent cores on the same NUMA node so L3 cache traffic is local.

void pin_thread_to_core(int core_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_id, &cpuset);

    int rc = pthread_setaffinity_np(pthread_self(), sizeof(cpuset), &cpuset);
    if (rc != 0) throw std::runtime_error("setaffinity failed");
}

// Also set real-time FIFO scheduling priority (requires root or CAP_SYS_NICE).
void set_realtime_priority(int priority = 80) {
    struct sched_param sp{};
    sp.sched_priority = priority;   // 1..99; 99 is highest
    int rc = pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp);
    if (rc != 0) std::perror("setschedparam (need root)");
}

// Yield control of the CPU without sleeping — for spin loops.
inline void cpu_relax() noexcept {
#if defined(__x86_64__)
    __asm__ volatile("pause" ::: "memory");   // x86 PAUSE: backoff hint
#elif defined(__aarch64__)
    __asm__ volatile("yield" ::: "memory");   // ARM YIELD
#endif
}

void feed_handler_thread(int core) {
    pin_thread_to_core(core);
    set_realtime_priority(90);

    // Spin on a lock-free queue — cpu_relax() prevents pipeline back-pressure.
    bool running = true;
    while (running) {
        // pop from SPSC ring ...
        cpu_relax();
    }
}
#endif`,
    explanation:
      "CPU pinning prevents the OS scheduler from migrating a thread between cores, which would require reloading L1/L2 cache lines — a latency spike of hundreds of nanoseconds. Pairing pinning with SCHED_FIFO ensures the thread is never preempted by lower-priority kernel work. The PAUSE/YIELD instruction in a spin loop reduces power consumption and avoids pipeline back-pressure by hinting to the CPU that this is a busy-wait.",
  },
  {
    id: "cpp-20260528-b1-rdtsc",
    language: "cpp",
    title: "RDTSC — hardware cycle-counter nanosecond timestamp",
    tag: "performance",
    code: `#include <cstdint>
#include <ctime>
#include <cmath>

// RDTSC (Read Time-Stamp Counter): a single-cycle x86 instruction that
// reads the CPU's cycle counter. Unlike clock_gettime (VDSO, ~20-40ns),
// RDTSC is ~5 cycles. Used to timestamp individual message arrival and
// measure round-trip latency at nanosecond resolution.
//
// RDTSCP is the serialised variant: waits for all prior instructions to
// complete before reading, preventing out-of-order execution from skewing
// the timestamp.

inline std::uint64_t rdtsc() noexcept {
#if defined(__x86_64__)
    std::uint32_t lo, hi;
    __asm__ volatile("rdtsc" : "=a"(lo), "=d"(hi));
    return (static_cast<std::uint64_t>(hi) << 32) | lo;
#else
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC_RAW, &ts);
    return static_cast<std::uint64_t>(ts.tv_sec) * 1'000'000'000ULL + ts.tv_nsec;
#endif
}

inline std::uint64_t rdtscp(std::uint32_t* aux = nullptr) noexcept {
#if defined(__x86_64__)
    std::uint32_t lo, hi, a;
    __asm__ volatile("rdtscp" : "=a"(lo), "=d"(hi), "=c"(a));
    if (aux) *aux = a;    // 'a' encodes the NUMA node in the upper bits
    return (static_cast<std::uint64_t>(hi) << 32) | lo;
#else
    return rdtsc();
#endif
}

// Calibrate: cycles per nanosecond (measure once at startup).
double calibrate_tsc_ghz() {
    struct timespec t0, t1;
    clock_gettime(CLOCK_MONOTONIC_RAW, &t0);
    std::uint64_t c0 = rdtsc();
    // Spin for ~10ms.
    for (volatile int i = 0; i < 10'000'000; ++i);
    std::uint64_t c1 = rdtsc();
    clock_gettime(CLOCK_MONOTONIC_RAW, &t1);
    double ns = (t1.tv_sec - t0.tv_sec) * 1e9 + (t1.tv_nsec - t0.tv_nsec);
    return static_cast<double>(c1 - c0) / ns;
}`,
    explanation:
      "RDTSC's ~5-cycle cost is 4–8x cheaper than a VDSO `clock_gettime` call. The key pitfall is that TSC frequency varies across cores if the CPU lacks an invariant TSC (check `/proc/cpuinfo` for 'constant_tsc'). RDTSCP's serialisation guarantees the counter is read after all prior loads complete, preventing the compiler or CPU from reordering a timestamp read outside the measured interval.",
  },
  {
    id: "cpp-20260528-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson finite-difference PDE pricer (European vanilla)",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Crank-Nicolson (theta = 0.5): combines explicit and implicit Euler.
// Discretise the Black-Scholes PDE on a (S, t) grid.
// Each time step solves a tridiagonal system via the Thomas algorithm.
// CN is unconditionally stable and second-order in both S and t.

// Thomas algorithm: O(n) solver for tridiagonal system.
void thomas(const std::vector<double>& a,   // sub-diagonal
            const std::vector<double>& b,   // main diagonal
            const std::vector<double>& c,   // super-diagonal
            const std::vector<double>& d,   // right-hand side
            std::vector<double>& x) {
    int n = static_cast<int>(b.size());
    std::vector<double> cp(n), dp(n);
    cp[0] = c[0] / b[0];
    dp[0] = d[0] / b[0];
    for (int i = 1; i < n; ++i) {
        double m = b[i] - a[i] * cp[i-1];
        cp[i]    = c[i] / m;
        dp[i]    = (d[i] - a[i] * dp[i-1]) / m;
    }
    x.resize(n);
    x[n-1] = dp[n-1];
    for (int i = n-2; i >= 0; --i)
        x[i] = dp[i] - cp[i] * x[i+1];
}

double cn_european_call(double S0, double K, double r, double sigma,
                         double T, int ns = 200, int nt = 200) {
    double S_max = 3.0 * K;
    double dS    = S_max / ns;
    double dt    = T    / nt;

    // Grid of stock prices.
    std::vector<double> S(ns + 1);
    for (int i = 0; i <= ns; ++i) S[i] = i * dS;

    // Initial condition: max(S - K, 0) at maturity.
    std::vector<double> V(ns + 1);
    for (int i = 0; i <= ns; ++i) V[i] = std::max(S[i] - K, 0.0);

    // Crank-Nicolson coefficients.
    auto alpha = [&](int i) { return 0.25 * dt * (sigma*sigma*i*i - r*i); };
    auto beta  = [&](int i) { return -0.5 * dt * (sigma*sigma*i*i + r);   };
    auto gamma = [&](int i) { return 0.25 * dt * (sigma*sigma*i*i + r*i); };

    std::vector<double> a(ns-1), b(ns-1), c(ns-1), d(ns-1), V_new;

    for (int t = nt - 1; t >= 0; --t) {
        // Boundary conditions.
        double V_low  = 0.0;                       // S = 0
        double V_high = S_max - K * std::exp(-r * (nt - t) * dt); // S -> S_max

        for (int i = 1; i < ns; ++i) {
            int j = i - 1;
            a[j] = -alpha(i);
            b[j] = 1.0 - beta(i);
            c[j] = -gamma(i);
            d[j] = alpha(i)*V[i-1] + (1.0+beta(i))*V[i] + gamma(i)*V[i+1];
        }
        d[0]    += alpha(1) * V_low;
        d[ns-2] += gamma(ns-1) * V_high;

        thomas(a, b, c, d, V_new);
        for (int i = 1; i < ns; ++i) V[i] = V_new[i-1];
        V[0]  = V_low;
        V[ns] = V_high;
    }

    // Interpolate at S = S0.
    int idx = static_cast<int>(S0 / dS);
    double t = (S0 - S[idx]) / dS;
    return (1 - t) * V[idx] + t * V[idx + 1];
}`,
    explanation:
      "Crank-Nicolson is the standard PDE scheme for vanilla options because it is second-order accurate (error ~ O(dt² + dS²)) and unconditionally stable — meaning you can use coarser time grids without oscillation. The Thomas algorithm solves the tridiagonal system in O(n) rather than O(n³) via LU factorisation. For American options, replace the linear system solve with a projected successive over-relaxation (PSOR) at each timestep.",
  },
  {
    id: "cpp-20260528-b1-lookback-mc",
    language: "cpp",
    title: "Lookback option (floating strike) via path-tracking MC",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <algorithm>

// Floating-strike lookback call: payoff = S(T) - min_{0 <= t <= T} S(t)
// The holder always buys at the minimum price and sells at expiry.
// No closed-form for discrete monitoring; continuous has an analytic formula.
// Key: the path minimum must be tracked throughout the simulation.

double lookback_call_mc(double S0, double r, double sigma, double T,
                         int n_paths, int n_steps, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt     = T / n_steps;
    double drift  = (r - 0.5 * sigma * sigma) * dt;
    double vol_dt = sigma * std::sqrt(dt);
    double disc   = std::exp(-r * T);

    double sum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S    = S0;
        double S_min = S0;   // track running minimum

        for (int s = 0; s < n_steps; ++s) {
            S    *= std::exp(drift + vol_dt * nd(rng));
            S_min = std::min(S_min, S);
        }

        // Floating-strike lookback call: S(T) - min(S)
        double payoff = std::max(S - S_min, 0.0);
        sum += payoff;
    }

    return disc * sum / n_paths;
}

// Closed-form continuous-monitoring price (Goldman-Sosin-Gatto 1979).
double lookback_call_analytic(double S0, double r, double sigma, double T) {
    double sT  = sigma * std::sqrt(T);
    double d1  = (std::log(1.0) + (r + 0.5 * sigma*sigma) * T) / sT;  // F = S0 (at-the-money)
    double d2  = d1 - sT;

    auto norm_cdf = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };

    double part1 = S0 * norm_cdf(d1);
    double part2 = -S0 * std::exp(-r * T) * norm_cdf(d2);
    double part3 = S0 * (sigma*sigma / (2*r)) * (norm_cdf(d1) - std::exp(-r*T) * norm_cdf(-d2));

    return part1 + part2 + part3 - S0 * sigma*sigma / (2*r) * std::exp(-r*T);
}`,
    explanation:
      "Lookback options are path-dependent: the payoff requires storing the running minimum (or maximum) throughout the entire simulation. Discrete monitoring (checking S only on fixing dates) requires Monte Carlo; continuous monitoring has the Goldman-Sosin-Gatto closed form. Lookbacks are more expensive than vanillas and are used in structured products to guarantee an 'always buy at the bottom' profile — they're also a useful benchmark for variance-reduction techniques since the MC variance is higher than for European options.",
  },
  {
    id: "cpp-20260528-b1-fifo-pnl",
    language: "cpp",
    title: "FIFO lot P&L accounting",
    tag: "quant",
    code: `#include <deque>
#include <cstdint>
#include <stdexcept>
#include <cmath>

// FIFO lot matching: sells are matched against the oldest (first) buy lots.
// Used for tax reporting (wash-sale rules) and risk system reconciliation.
// Tracks realised P&L and remaining open lots.

struct Lot { double qty; double cost_basis; };

class FIFOPosition {
    std::deque<Lot> lots_;    // open buy lots in FIFO order
    double total_qty_  = 0.0;
    double realised_   = 0.0;

public:
    // Buy: push a new lot at the back.
    void buy(double qty, double price) {
        lots_.push_back({qty, price});
        total_qty_ += qty;
    }

    // Sell: match against front lots, realise P&L.
    double sell(double qty, double price) {
        if (qty > total_qty_ + 1e-9) throw std::runtime_error("oversell");
        double pnl = 0.0;
        double remain = qty;

        while (remain > 1e-9 && !lots_.empty()) {
            Lot& lot = lots_.front();
            double matched = std::min(remain, lot.qty);

            pnl     += matched * (price - lot.cost_basis);
            lot.qty -= matched;
            remain  -= matched;

            if (lot.qty < 1e-9) lots_.pop_front();
        }

        total_qty_  -= qty;
        realised_   += pnl;
        return pnl;
    }

    double mark_to_market(double current_price) const {
        double unrealised = 0.0;
        for (const auto& lot : lots_)
            unrealised += lot.qty * (current_price - lot.cost_basis);
        return unrealised;
    }

    double total_pnl(double current_price) const {
        return realised_ + mark_to_market(current_price);
    }

    double net_qty()    const { return total_qty_; }
    double realised()   const { return realised_; }
};

int main() {
    FIFOPosition pos;
    pos.buy(100, 250.0);
    pos.buy(200, 252.0);
    double pnl = pos.sell(150, 255.0);   // matches 100@250 + 50@252
    (void)pnl;   // pnl = 100*(255-250) + 50*(255-252) = 500 + 150 = 650
}`,
    explanation:
      "FIFO lot matching is required for US tax reporting (earliest lots are sold first) and for reconciling realised/unrealised P&L splits in risk dashboards. Using a deque allows O(1) removal from the front (oldest lots) and O(1) addition at the back (new buys). The partial-lot logic handles the common case where a sell straddles a lot boundary.",
  },
  {
    id: "cpp-20260528-b1-kelly",
    language: "cpp",
    title: "Kelly criterion — full and fractional Kelly sizing",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <numeric>
#include <algorithm>

// Kelly criterion: maximise E[log(W)] to find optimal bet fraction f*.
// For a binary outcome: win fraction b with probability p, lose fraction a
// with probability q = 1 - p.
//   f* = p/a - q/b
// For a continuous Gaussian return (mean mu, variance sigma^2):
//   f* = mu / sigma^2
// Fractional Kelly (f * frac) reduces variance at cost of long-run growth.

struct KellyResult { double f_star; double growth_rate; };

// Binary outcome Kelly.
KellyResult kelly_binary(double p, double win_frac, double loss_frac) {
    double q     = 1.0 - p;
    double f_star = p / loss_frac - q / win_frac;
    f_star = std::max(f_star, 0.0);   // never short via Kelly

    double growth = p * std::log1p(f_star * win_frac)
                  + q * std::log1p(-f_star * loss_frac);
    return {f_star, growth};
}

// Continuous Gaussian Kelly: f* = mu / sigma^2 (Merton 1971).
KellyResult kelly_gaussian(double mu, double sigma) {
    double sigma2 = sigma * sigma;
    double f_star = mu / sigma2;
    // Growth rate of the log portfolio = mu*f - 0.5*sigma^2*f^2
    double growth = mu * f_star - 0.5 * sigma2 * f_star * f_star;
    return {f_star, growth};
}

// Fractional Kelly: reduces f* by fraction to balance growth vs drawdown.
double fractional_kelly(double f_star, double fraction) {
    return f_star * fraction;
}

// Multi-asset Kelly: f = Sigma^{-1} * mu (unconstrained).
// Uses simple Gauss-Jordan for small n.
std::vector<double> kelly_multiasset(const std::vector<double>& mu,
                                      const std::vector<std::vector<double>>& Sigma) {
    int n = static_cast<int>(mu.size());
    // Augmented matrix [Sigma | mu]
    auto A = Sigma;
    for (int i = 0; i < n; ++i) A[i].push_back(mu[i]);

    // Forward elimination
    for (int col = 0; col < n; ++col) {
        for (int row = col+1; row < n; ++row) {
            double f = A[row][col] / A[col][col];
            for (int k = col; k <= n; ++k) A[row][k] -= f * A[col][k];
        }
    }
    // Back-substitution
    std::vector<double> f(n);
    for (int i = n-1; i >= 0; --i) {
        f[i] = A[i][n];
        for (int j = i+1; j < n; ++j) f[i] -= A[i][j] * f[j];
        f[i] /= A[i][i];
    }
    return f;
}`,
    explanation:
      "Kelly sizing maximises the long-run geometric growth rate of a portfolio. The Gaussian formula f* = μ/σ² shows that leverage is proportional to the Sharpe ratio — a strategy with 0 Sharpe is Kelly-sized at 0. Full Kelly halves drawdown probability but produces severe path-dependent losses; most practitioners use 25–50% of f* to avoid ruin from model misspecification.",
  },
  {
    id: "cpp-20260528-b1-span",
    language: "cpp",
    title: "std::span — zero-copy safe view of network buffers",
    tag: "stl",
    code: `#include <span>
#include <cstdint>
#include <cstring>
#include <vector>
#include <stdexcept>

// std::span<T, Extent>: a non-owning, bounds-checked view into a contiguous
// sequence. Dynamic extent = runtime size; static extent = compile-time size.
// Replaces (T* ptr, size_t len) pairs everywhere in low-latency code.

// Network packet with a small fixed header + variable payload.
struct PacketHeader {
    std::uint16_t msg_type;
    std::uint16_t msg_len;   // total length including header
    std::uint32_t seq_num;
};
static_assert(sizeof(PacketHeader) == 8);

// Parse a packet from raw bytes: returns span of the payload (after header).
std::span<const std::byte> parse_packet(std::span<const std::byte> raw,
                                          PacketHeader& hdr) {
    if (raw.size() < sizeof(PacketHeader))
        throw std::runtime_error("buffer too small");

    std::memcpy(&hdr, raw.data(), sizeof(PacketHeader));

    if (raw.size() < hdr.msg_len)
        throw std::runtime_error("truncated");

    // Return a sub-span of the payload — no copy, no heap allocation.
    return raw.subspan(sizeof(PacketHeader), hdr.msg_len - sizeof(PacketHeader));
}

// Process a list of messages in a pre-allocated buffer.
void process_batch(std::span<const std::byte> udp_payload) {
    std::size_t offset = 0;
    while (offset < udp_payload.size()) {
        auto remaining = udp_payload.subspan(offset);
        PacketHeader hdr;
        auto payload = parse_packet(remaining, hdr);

        // Dispatch by message type (no copy — payload points into udp_payload).
        (void)payload;
        offset += hdr.msg_len;
    }
}

int main() {
    std::vector<std::byte> udp_buf(1500);
    // ... fill from socket ...
    process_batch(udp_buf);
}`,
    explanation:
      "std::span replaces raw pointer + length pairs with a bounds-checkable, expressively typed view. Unlike a raw pointer, span carries its size, enabling range-for, subspan arithmetic, and debug-mode bounds checking — without any heap allocation or copy. The zero-copy subspan pattern is essential in feed handlers that process dozens of messages per UDP packet without a secondary allocation per message.",
  },
  {
    id: "cpp-20260528-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list — O(1) order cancel at any position",
    tag: "quant",
    code: `#include <cstdint>
#include <cassert>

// Intrusive list: the list node is embedded in the object, not stored separately.
// Benefit: O(1) remove given a pointer to the element — no search needed.
// Critical for order book cancel: given an order ID, look up the node pointer
// and unlink it directly without scanning the queue for that price level.

struct OrderNode {
    std::uint64_t id;
    double        price;
    std::uint32_t qty;

    // Intrusive list pointers — embedded directly in the order object.
    OrderNode* prev = nullptr;
    OrderNode* next = nullptr;
};

class IntrusiveQueue {
    OrderNode* head_ = nullptr;
    OrderNode* tail_ = nullptr;
    std::size_t size_ = 0;

public:
    void push_back(OrderNode* n) noexcept {
        n->next = nullptr;
        n->prev = tail_;
        if (tail_) tail_->next = n;
        else       head_ = n;
        tail_  = n;
        ++size_;
    }

    // O(1) remove — node knows its own neighbours.
    void remove(OrderNode* n) noexcept {
        if (n->prev) n->prev->next = n->next;
        else         head_ = n->next;

        if (n->next) n->next->prev = n->prev;
        else         tail_ = n->prev;

        n->prev = n->next = nullptr;
        --size_;
    }

    OrderNode* front() const noexcept { return head_; }
    std::size_t size() const noexcept { return size_; }
};

int main() {
    OrderNode a{1, 100.0, 100}, b{2, 100.0, 200}, c{3, 100.0, 50};
    IntrusiveQueue q;
    q.push_back(&a);
    q.push_back(&b);
    q.push_back(&c);

    // Cancel order b without scanning: O(1).
    q.remove(&b);
    assert(q.size() == 2);
    assert(q.front() == &a);
}`,
    explanation:
      "Non-intrusive linked lists require a separate heap-allocated node object that wraps each element — two allocations per insert. Intrusive lists embed the node pointers inside the object itself, yielding a single allocation and perfect cache locality (the list pointer and the data are in the same cache line). This makes order cancellation a pointer-swap rather than a search, which is why all high-performance order books use intrusive structures for their per-price queues.",
  },
  {
    id: "cpp-20260528-b1-fx-arbitrage",
    language: "cpp",
    title: "FX triangular arbitrage via Bellman-Ford negative cycle",
    tag: "quant",
    code: `#include <vector>
#include <string>
#include <cmath>
#include <limits>
#include <optional>

// FX arbitrage: detect a cycle of currencies where the product of exchange
// rates > 1 (profit without risk). Transform: take negative logarithm of
// rates. A profitable cycle becomes a negative-weight cycle detectable via
// Bellman-Ford (which finds shortest paths or detects negative cycles).

struct FXEdge { int from, to; double log_neg_rate; };

// Run Bellman-Ford from source 0. Returns true if a negative cycle exists.
// If true, 'path' contains one negative-cycle edge sequence.
bool detect_arb_cycle(int n_ccy, std::vector<FXEdge>& edges,
                       std::vector<int>& path) {
    std::vector<double> dist(n_ccy, 0.0);   // initialise all to 0 (multi-source)
    std::vector<int>   pred(n_ccy, -1);

    int relay_node = -1;
    for (int i = 0; i < n_ccy; ++i) {                 // relax n times
        relay_node = -1;
        for (const auto& e : edges) {
            if (dist[e.from] + e.log_neg_rate < dist[e.to]) {
                dist[e.to] = dist[e.from] + e.log_neg_rate;
                pred[e.to] = e.from;
                relay_node = e.to;
            }
        }
    }

    if (relay_node == -1) return false;   // no negative cycle

    // Walk backwards n times to guarantee we're inside the cycle.
    for (int i = 0; i < n_ccy; ++i)
        relay_node = pred[relay_node];

    // Trace the cycle.
    int start = relay_node;
    path.clear();
    path.push_back(start);
    for (int cur = pred[start]; cur != start; cur = pred[cur])
        path.push_back(cur);
    path.push_back(start);

    return true;
}

// Build edges from an exchange-rate matrix.
// rates[i][j] = price of currency j in units of currency i.
std::vector<FXEdge> build_edges(const std::vector<std::vector<double>>& rates) {
    int n = static_cast<int>(rates.size());
    std::vector<FXEdge> edges;
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            if (i != j && rates[i][j] > 0)
                edges.push_back({i, j, -std::log(rates[i][j])});
    return edges;
}

int main() {
    // 3 currencies: USD, EUR, GBP
    // rates[i][j]: units of j per unit of i
    std::vector<std::vector<double>> rates = {
        {1.0,    0.92,  0.79 },   // USD -> EUR, GBP
        {1.088,  1.0,   0.862},   // EUR -> USD, GBP
        {1.267,  1.162, 1.0  },   // GBP -> USD, EUR
    };
    // Introduce a tiny arb: GBP->EUR rate slightly off
    rates[2][1] = 1.170;   // should be 1.162; now USD->EUR->GBP->USD > 1

    auto edges = build_edges(rates);
    std::vector<int> cycle;
    bool found = detect_arb_cycle(3, edges, cycle);
    // found == true; cycle encodes the profitable path
    (void)found;
}`,
    explanation:
      "Triangular FX arbitrage is equivalent to finding a negative-weight cycle in a directed graph where edge weights are −log(rate). Bellman-Ford's n-th relaxation step finds a node that was still being relaxed — meaning it's inside a negative cycle. The transformation to logarithms converts multiplicative rate products into additive sums, making the problem a textbook shortest-path one.",
  },
  {
    id: "cpp-20260528-b1-charm",
    language: "cpp",
    title: "Charm Greek — dDelta/dTime via central finite difference",
    tag: "quant",
    code: `#include <cmath>

// Charm (also called DdeltaDtime or delta decay): how much the option's
// delta changes as time passes. Useful for understanding overnight delta
// position changes without any spot move.
// Analytic BS charm for a call:
//   charm = -phi(d1) * [2*(r-q)*T - d2*sigma*sqrt(T)] / (2*T*sigma*sqrt(T))
// where phi is the standard normal PDF.
// We also demonstrate numerical charm via finite difference.

double norm_pdf(double x) noexcept {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * M_PI);
}
double norm_cdf(double x) noexcept {
    return 0.5 * std::erfc(-x / std::sqrt(2.0));
}

struct BSGreeks {
    double price, delta, charm, vanna, speed;
};

BSGreeks bs_greeks(double S, double K, double r, double q,
                    double sigma, double T) noexcept {
    if (T < 1e-9) return {};
    double sT  = sigma * std::sqrt(T);
    double d1  = (std::log(S/K) + (r - q + 0.5*sigma*sigma)*T) / sT;
    double d2  = d1 - sT;
    double pdf1 = norm_pdf(d1);
    double cdf1 = norm_cdf(d1);
    double cdf2 = norm_cdf(d2);
    double eq_T = std::exp(-q * T);
    double er_T = std::exp(-r * T);

    double price  = S * eq_T * cdf1 - K * er_T * cdf2;
    double delta  = eq_T * cdf1;

    // Charm: rate of delta decay with time.
    // Negative for OTM calls (delta converges to 0); positive for ITM.
    double charm = -eq_T * pdf1
                   * (2*(r-q)*T - d2*sT)
                   / (2.0 * T * sT);

    // Vanna: d(delta)/d(sigma) = d(vega)/dS
    double vanna = -eq_T * pdf1 * d2 / sigma;

    // Speed: d(gamma)/dS = third derivative of price w.r.t. S
    double gamma  = eq_T * pdf1 / (S * sT);
    double speed  = -gamma * (d1 / sT + 1.0) / S;

    return {price, delta, charm, vanna, speed};
}`,
    explanation:
      "Charm is critical for end-of-day delta rebalancing: an option desk's delta exposure drifts as time passes even with no market move. A large negative charm means long-dated OTM calls are losing delta overnight — if not rebalanced, the position is incorrectly hedged by morning. Delta decays fastest for near-expiry options (charm is largest for short-dated ATM options), which is why weekly expiry management is especially active on Tuesdays and Thursdays.",
  },
  {
    id: "cpp-20260528-b1-mdspan",
    language: "cpp",
    title: "std::mdspan (C++23) — multi-dimensional view for pricing grids",
    tag: "stl",
    code: `#include <mdspan>    // C++23; GCC 13+ / Clang 17+ with -std=c++23
#include <vector>
#include <cmath>
#include <cstdint>

// std::mdspan: a non-owning multi-dimensional view of contiguous memory.
// No allocation; the storage lives in an existing std::vector or stack buffer.
// Layout policies: row_major (default), column_major, strided.
// Ideal for volatility surfaces (strike × maturity grids) and
// finite-difference pricing grids (S × t).

// Represent an implied-vol surface: rows = maturities, cols = strikes.
void fill_vol_surface(std::mdspan<double,
                                   std::extents<int, std::dynamic_extent,
                                                      std::dynamic_extent>> surf,
                       double sigma_atm, double skew, double term_str) {
    int nm = surf.extent(0);   // number of maturities
    int nk = surf.extent(1);   // number of strikes

    for (int i = 0; i < nm; ++i) {
        double T = 0.25 * (i + 1);           // quarterly maturities
        for (int j = 0; j < nk; ++j) {
            double log_m = -0.1 + 0.2 * j / (nk - 1); // log-moneyness
            // Simple parametric smile: sigma = ATM + skew*log_m + term_str*sqrt(T)
            surf[i, j] = sigma_atm + skew * log_m + term_str * std::sqrt(T);
        }
    }
}

// Slice a single maturity row (also an mdspan, still zero-copy).
auto row_slice(auto& surf, int row) {
    // In C++23, submdspan(surf, row, std::full_extent) extracts a 1D span.
    return std::submdspan(surf, row, std::full_extent);
}

int main() {
    constexpr int N_MAT = 8, N_STR = 20;
    std::vector<double> data(N_MAT * N_STR, 0.0);

    // Wrap the flat vector in a 2D view — zero copy.
    auto surf = std::mdspan(data.data(),
                             std::extents<int, N_MAT, N_STR>{});

    fill_vol_surface(surf, 0.20, -0.10, 0.01);

    auto mat_1y = row_slice(surf, 3);   // 4th maturity = 1Y
    double atm_vol = mat_1y[N_STR / 2];
    (void)atm_vol;
}`,
    explanation:
      "std::mdspan gives multi-dimensional array semantics to any contiguous block of memory without copying or wrapping it in a heap-allocated matrix object. For pricing grids (typically Strike × Maturity × Scenario), it replaces hand-rolled index arithmetic `data[i*N_STR + j]` with `surf[i, j]`, which the compiler can vectorise and bounds-check identically. The `std::submdspan` slice is itself an mdspan — enabling zero-copy row/column views for single-maturity pricing.",
  },
  {
    id: "cpp-20260528-b1-horner",
    language: "cpp",
    title: "constexpr Horner polynomial + compile-time coefficient table",
    tag: "performance",
    code: `#include <array>
#include <cmath>
#include <cstddef>

// Horner's method: evaluate a polynomial p(x) = c0 + c1*x + c2*x^2 + ...
// using n multiplications and n additions (vs 2n for naive).
// Combined with constexpr, it lets us embed pre-computed Taylor coefficients
// in the binary and evaluate them at near-maximum FPU throughput.

// Hart's rational approximation for erfc(x), used in the normal CDF.
// Coefficients valid for x >= 0; relative error < 1e-7.
static constexpr std::array<double, 5> P_ERFC = {
    1.26551223, 1.00002368, 0.37409196, 0.09678418, -0.18628806
};
static constexpr std::array<double, 5> Q_ERFC = {
    1.0, 0.56418958, 0.0, 0.0, 0.0   // placeholder — real coeff are longer
};

// Generic Horner evaluator: fully unrolled if Coeffs is a constexpr array.
template<std::size_t N>
constexpr double horner(double x, const std::array<double, N>& c) noexcept {
    double result = c[N - 1];
    for (int i = static_cast<int>(N) - 2; i >= 0; --i)
        result = result * x + c[i];
    return result;
}

// Fast exp(-x^2) * erfc_approx(x) for x >= 0.
constexpr double erfc_approx(double x) noexcept {
    double t = 1.0 / (1.0 + 0.47047 * x);
    double poly = horner(t, P_ERFC);
    return t * poly * std::exp(-x * x);   // can be constexpr with C++23 math
}

// Compile-time table: CDF at integers 0..10 (stress-testing the constexpr path).
constexpr std::array<double, 11> CDF_TABLE = []() {
    std::array<double, 11> t{};
    for (int i = 0; i <= 10; ++i)
        t[i] = 0.5 * erfc_approx(static_cast<double>(i) / std::sqrt(2.0));
    return t;
}();

static_assert(CDF_TABLE[0] > 0.49 && CDF_TABLE[0] < 0.51,
              "CDF(0) should be ~0.5");

double fast_norm_cdf(double x) noexcept {
    // Runtime path: use SIMD-friendly erfc.
    return x >= 0.0
        ? 1.0 - 0.5 * erfc_approx(x / std::sqrt(2.0))
        :       0.5 * erfc_approx(-x / std::sqrt(2.0));
}`,
    explanation:
      "Horner's method is the textbook way to evaluate polynomials with minimal FPU operations; a degree-n polynomial costs exactly n multiplications and n additions regardless of coefficient count. Embedding the result in a `constexpr` array causes the compiler to evaluate the polynomial completely at compile time, producing a binary that contains only the pre-computed table values — zero runtime polynomial evaluation.",
  },
  {
    id: "cpp-20260528-b1-numa",
    language: "cpp",
    title: "NUMA-aware memory allocation with mmap + mbind",
    tag: "performance",
    code: `#ifdef __linux__
#include <sys/mman.h>
#include <numa.h>           // -lnuma; install libnuma-dev
#include <numaif.h>
#include <cstdlib>
#include <stdexcept>
#include <cstddef>

// NUMA (Non-Uniform Memory Access): on multi-socket servers, memory attached
// to socket 0 is ~60-100ns faster for a thread running on socket 0 than
// memory on socket 1. Feed handlers and order books pinned to socket 0
// should allocate from socket 0's memory pool.
//
// mmap + mbind: allocate a large anonymous mapping, then bind it to a NUMA
// node. All page faults will be satisfied from the specified node.

void* numa_alloc_local(std::size_t bytes, int node = 0) {
    void* p = mmap(nullptr, bytes,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_POPULATE,  // pre-fault pages
                   -1, 0);
    if (p == MAP_FAILED) throw std::bad_alloc{};

    // Bind to the specified NUMA node.
    unsigned long nodemask = 1UL << node;
    int rc = mbind(p, bytes, MPOL_BIND,
                   &nodemask, sizeof(unsigned long) * 8,
                   MPOL_MF_MOVE | MPOL_MF_STRICT);
    if (rc != 0) {
        munmap(p, bytes);
        throw std::runtime_error("mbind failed");
    }
    return p;
}

void numa_free(void* p, std::size_t bytes) noexcept {
    munmap(p, bytes);
}

// Query which NUMA node the calling thread is on.
int current_numa_node() noexcept {
    return numa_node_of_cpu(sched_getcpu());
}

// Hugepage variant: MAP_HUGETLB reduces TLB pressure for 1GB+ buffers.
void* alloc_hugepage(std::size_t bytes_2mb_aligned) {
    void* p = mmap(nullptr, bytes_2mb_aligned,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                   -1, 0);
    if (p == MAP_FAILED) throw std::bad_alloc{};
    return p;
}
#endif`,
    explanation:
      "On a dual-socket server, a thread on socket 0 accessing socket 1's memory pays an extra 60–100ns per cache miss — a significant fraction of total order processing latency. Pinning the thread to a core AND binding its order-book memory to the same NUMA node eliminates cross-socket traffic. MAP_POPULATE pre-faults all pages at allocation time, preventing page-fault jitter during the trading day. Hugepages (2MB vs 4KB) reduce TLB misses for large order-book buffers by 512×.",
  },
  {
    id: "cpp-20260528-b1-ranges-pipeline",
    language: "cpp",
    title: "std::ranges views pipeline — market data filtering and projection",
    tag: "stl",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <cstdint>

struct Quote {
    std::uint64_t ts_ns;
    double bid, ask;
    std::uint32_t bid_sz, ask_sz;

    double mid()    const noexcept { return (bid + ask) * 0.5; }
    double spread() const noexcept { return ask - bid; }
};

// Ranges pipeline: filter → transform → accumulate — no temporaries.
// Everything is lazy: only one pass over the data.

double average_mid_tight_quotes(const std::vector<Quote>& quotes,
                                  double max_spread) {
    // Filter quotes with spread <= max_spread, project to mid price.
    auto tight_mids = quotes
        | std::views::filter([max_spread](const Quote& q) {
              return q.spread() <= max_spread;
          })
        | std::views::transform(&Quote::mid);   // member function pointer as projection

    // std::ranges::fold_left (C++23) or manual accumulate.
    double sum = 0.0;
    long   n   = 0;
    for (double m : tight_mids) { sum += m; ++n; }
    return n > 0 ? sum / n : 0.0;
}

// Top-5 best bid quotes sorted by bid descending, projected to {bid, size}.
struct TopBid { double bid; std::uint32_t sz; };

std::vector<TopBid> top5_bids(std::vector<Quote> quotes) {
    std::ranges::sort(quotes, std::greater{}, &Quote::bid);  // sort by .bid descending

    return quotes
        | std::views::take(5)
        | std::views::transform([](const Quote& q) { return TopBid{q.bid, q.bid_sz}; })
        | std::ranges::to<std::vector>();   // C++23 to<>()
}

// Find the first crossed quote (bid >= ask — should never happen in production).
auto first_crossed(const std::vector<Quote>& quotes) {
    return std::ranges::find_if(quotes,
        [](const Quote& q) { return q.bid >= q.ask; });
}`,
    explanation:
      "The ranges pipeline composes filter + transform + fold into a single lazy pass with zero intermediate allocations. The projection parameter (`&Quote::bid` as the sort key) reads like English and avoids writing an explicit lambda. std::ranges::to<std::vector>() (C++23) materialises the lazy range into a concrete container when needed — keeping the rest of the pipeline allocation-free.",
  },
  {
    id: "cpp-20260528-b1-trinomial",
    language: "cpp",
    title: "Trinomial tree — American option with barrier",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Trinomial tree: at each node, stock can go up (u), stay (1), or go down (d).
// CRR parameterisation: u = exp(sigma*sqrt(2*dt)), d = 1/u, m = 1.
// Risk-neutral probabilities:
//   pu = ((exp(r*dt/2) - exp(-sigma*sqrt(dt/2))) /
//          (exp(sigma*sqrt(dt/2)) - exp(-sigma*sqrt(dt/2))))^2
//   pd = ((exp(sigma*sqrt(dt/2)) - exp(r*dt/2)) /
//          (exp(sigma*sqrt(dt/2)) - exp(-sigma*sqrt(dt/2))))^2
//   pm = 1 - pu - pd
// More stable than binomial for barrier problems: extra middle node
// can be placed exactly at the barrier level.

double trinomial_american_put(double S0, double K, double r,
                               double sigma, double T,
                               int N = 100,
                               double barrier = 0.0) {   // 0 = no barrier
    double dt   = T / N;
    double u    = std::exp(sigma * std::sqrt(2.0 * dt));
    double d    = 1.0 / u;
    double disc = std::exp(-r * dt);

    double a = std::exp(r * dt / 2.0);
    double b = std::exp(sigma * std::sqrt(dt / 2.0));
    double pu = std::pow((a - 1.0/b) / (b - 1.0/b), 2.0);
    double pd = std::pow((b    - a)  / (b - 1.0/b), 2.0);
    double pm = 1.0 - pu - pd;

    int M = 2 * N + 1;   // total nodes at final step (−N..0..+N)
    std::vector<double> S(M), V(M);

    // Terminal stock prices: S(i) = S0 * u^(N - i) for i = 0..2N
    for (int i = 0; i < M; ++i)
        S[i] = S0 * std::pow(u, N - i);

    // Terminal payoff: max(K - S, 0); knock out if barrier breach.
    for (int i = 0; i < M; ++i) {
        if (barrier > 0.0 && S[i] <= barrier) { V[i] = 0.0; continue; }
        V[i] = std::max(K - S[i], 0.0);
    }

    // Backward induction.
    for (int step = N - 1; step >= 0; --step) {
        int nodes = 2 * step + 1;
        for (int i = 0; i < nodes; ++i) {
            double s = S0 * std::pow(u, step - i);
            if (barrier > 0.0 && s <= barrier) { V[i] = 0.0; continue; }
            double cont = disc * (pu * V[i] + pm * V[i+1] + pd * V[i+2]);
            V[i] = std::max(cont, K - s);   // early exercise
        }
    }

    return V[0];
}`,
    explanation:
      "Trinomial trees have three nodes per parent (vs two for binomial), which allows placing a node exactly on the barrier level — eliminating the 'barrier shift' error that occurs in binomial trees when the barrier falls between nodes. The extra middle branch also improves convergence speed: for the same computational effort, trinomial trees are roughly as accurate as binomial trees with 4× the steps.",
  },
  {
    id: "cpp-20260528-b1-roll-model",
    language: "cpp",
    title: "Roll's bid-ask spread estimator from serial covariance",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <algorithm>

// Roll (1984): effective bid-ask spread estimated from transaction-price
// serial covariance. No need for a quote record — only trade prices.
// Theory: if spread = 2c, prices alternate between bid and ask with
// probability 1/2. Then: Cov(dp_t, dp_{t-1}) = -c^2
// => effective spread = 2 * sqrt(-Cov)  (only valid when Cov < 0)

double roll_spread(const std::vector<double>& prices) {
    if (prices.size() < 3) return 0.0;

    // Price changes (returns as absolute moves, not percentages).
    std::vector<double> dp;
    dp.reserve(prices.size() - 1);
    for (std::size_t i = 1; i < prices.size(); ++i)
        dp.push_back(prices[i] - prices[i-1]);

    int n = static_cast<int>(dp.size());
    double mean = std::accumulate(dp.begin(), dp.end(), 0.0) / n;

    // Serial covariance: E[(dp_t - mu)(dp_{t-1} - mu)]
    double cov = 0.0;
    for (int i = 1; i < n; ++i)
        cov += (dp[i] - mean) * (dp[i-1] - mean);
    cov /= (n - 1);

    if (cov >= 0.0) return 0.0;   // spread undefined when cov >= 0 (thin market)
    return 2.0 * std::sqrt(-cov);
}

// Hasbrouck (2009) lambda: price impact per unit volume.
// Regress |dp_t| on sqrt(volume_t); slope = lambda (Kyle's lambda proxy).
double hasbrouck_lambda(const std::vector<double>& price_chg,
                         const std::vector<double>& volumes) {
    int n = static_cast<int>(std::min(price_chg.size(), volumes.size()));
    double sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;
    for (int i = 0; i < n; ++i) {
        double x = std::sqrt(volumes[i]);
        double y = std::abs(price_chg[i]);
        sumX  += x;
        sumY  += y;
        sumXX += x * x;
        sumXY += x * y;
    }
    double denom = n * sumXX - sumX * sumX;
    if (std::abs(denom) < 1e-15) return 0.0;
    return (n * sumXY - sumX * sumY) / denom;   // OLS slope = Kyle's lambda
}`,
    explanation:
      "Roll's estimator requires only transaction prices — no quotes — making it invaluable for historical microstructure research where NBBO data is unavailable. The key insight is that order-flow randomness causes prices to bounce between bid and ask, introducing predictable negative autocorrelation in price changes. A negative serial covariance implies a positive effective spread; its absence suggests either very wide spreads, informed trading, or inventory effects dominating the bounce.",
  },
];
