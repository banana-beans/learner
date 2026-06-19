import type { Snippet } from "./types";

export const cppSnippets20260619B1: Snippet[] = [
  {
    id: "cpp-20260619-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-block pool allocator with freelist",
    tag: "performance",
    code: `#include <cstdlib>
#include <new>

// Fixed-size block pool: allocates a slab upfront, serves blocks via freelist.
// Avoids per-allocation system-call overhead; allocation is O(1) with zero fragmentation.
template <std::size_t BlockSize, std::size_t Capacity>
class PoolAllocator {
    static_assert(BlockSize >= sizeof(void*), "Block must fit a pointer");
    alignas(std::max_align_t) char slab_[BlockSize * Capacity];
    void* free_head_ = nullptr;
    std::size_t count_ = 0;
public:
    PoolAllocator() noexcept {
        for (std::size_t i = 0; i < Capacity; ++i) {
            void* blk = slab_ + i * BlockSize;
            *reinterpret_cast<void**>(blk) = free_head_;
            free_head_ = blk;
        }
        count_ = Capacity;
    }
    void* allocate() noexcept {
        if (!free_head_) return nullptr;
        void* blk = free_head_;
        free_head_ = *reinterpret_cast<void**>(blk);
        --count_;
        return blk;
    }
    void deallocate(void* p) noexcept {
        *reinterpret_cast<void**>(p) = free_head_;
        free_head_ = p;
        ++count_;
    }
    std::size_t available() const noexcept { return count_; }
};

struct Order { int id; double price; int qty; };
PoolAllocator<sizeof(Order), 1024> orderPool;

Order* newOrder(int id, double price, int qty) {
    void* mem = orderPool.allocate();
    if (!mem) throw std::bad_alloc{};
    return new(mem) Order{id, price, qty};  // placement new into pool memory
}
void freeOrder(Order* o) {
    o->~Order();
    orderPool.deallocate(o);
}`,
    explanation: "A pool allocator pre-allocates a fixed slab and maintains a freelist of available blocks, giving O(1) alloc/dealloc with no heap fragmentation — critical for order objects that are created and destroyed thousands of times per second.",
  },
  {
    id: "cpp-20260619-b1-pmr-monotonic",
    language: "cpp",
    title: "std::pmr monotonic_buffer_resource for per-message allocation",
    tag: "performance",
    code: `#include <memory_resource>
#include <vector>
#include <array>

// monotonic_buffer_resource allocates sequentially from a fixed buffer with
// no per-deallocation cost — memory is released only when the resource is
// destroyed (or reset). Ideal for per-message data with stack-like lifetimes.

void processTick(const char* raw, std::size_t len) {
    alignas(64) std::array<char, 8192> stack_buf;
    std::pmr::monotonic_buffer_resource pool{
        stack_buf.data(), stack_buf.size(),
        std::pmr::null_memory_resource()  // fail instead of falling back to heap
    };
    std::pmr::polymorphic_allocator<double> alloc{&pool};

    // All containers below draw from the stack buffer — zero heap calls
    std::pmr::vector<double> prices{alloc};
    std::pmr::vector<int>    sizes{alloc};
    prices.reserve(64);
    sizes.reserve(64);

    // Parse raw buffer into prices/sizes ...
    // When 'pool' goes out of scope the stack buffer is simply reclaimed.
}`,
    explanation: "std::pmr::monotonic_buffer_resource turns a stack array into a bump allocator: allocations are a pointer increment and deallocation is a no-op, giving single-digit-nanosecond allocation for per-message parsing pipelines.",
  },
  {
    id: "cpp-20260619-b1-custom-hash-pricemap",
    language: "cpp",
    title: "Unordered_map with Fibonacci hash for int64 price levels",
    tag: "stl",
    code: `#include <unordered_map>
#include <cstdint>

// Default std::hash<int64_t> clusters adjacent prices (incremental keys hash
// to adjacent buckets). Fibonacci hashing multiplies by the golden-ratio
// constant to scatter bits across the full 64-bit range.

struct FibHash {
    std::size_t operator()(std::int64_t p) const noexcept {
        return static_cast<std::size_t>(
            static_cast<std::uint64_t>(p) * 0x9E3779B97F4A7C15ULL);
    }
};

struct Level { double qty; int count; };
using PriceMap = std::unordered_map<std::int64_t, Level, FibHash>;

int main() {
    PriceMap book;
    book.reserve(4096);             // pre-allocate bucket array to avoid rehash
    book.max_load_factor(0.5f);     // keep load low for fewer collisions

    // Price stored as integer * 1e8 for exact decimal representation
    std::int64_t px = 10050'00000000LL;  // 10050.00 in fixed-point
    book[px].qty   += 100.0;
    book[px].count += 1;
}`,
    explanation: "Fibonacci hashing (multiply-and-shift) distributes integer keys that differ by small deltas uniformly across buckets, reducing collision chains in order-book price maps where ticks differ by exactly one lot.",
  },
  {
    id: "cpp-20260619-b1-concepts-c20",
    language: "cpp",
    title: "C++20 concepts to constrain numeric template parameters",
    tag: "modern",
    code: `#include <concepts>
#include <cmath>
#include <type_traits>

// Concepts provide clear, readable constraints on template parameters.
// Violations produce a "constraint not satisfied" error at the call site,
// not deep in a template instantiation chain.

template <std::floating_point T>
T blackScholesD1(T S, T K, T r, T sigma, T tau) {
    return (std::log(S / K) + (r + T(0.5) * sigma * sigma) * tau)
           / (sigma * std::sqrt(tau));
}

// Custom concept: "satisfies both copy-constructible and arithmetic ops"
template <typename T>
concept PriceType = std::is_arithmetic_v<T> && std::copyable<T>;

template <PriceType T>
T midPrice(T bid, T ask) { return (bid + ask) / T(2); }

// Requires-expression for ad-hoc constraints
template <typename T>
concept HasPV = requires(T t) {
    { t.presentValue() } -> std::convertible_to<double>;
    { t.duration()     } -> std::convertible_to<double>;
};

template <HasPV Instrument>
double dv01(const Instrument& inst) {
    return inst.presentValue() * inst.duration() * 0.0001;
}`,
    explanation: "C++20 concepts replace SFINAE boilerplate with intent-revealing constraints: the compiler checks them eagerly at the call site, collapsing multi-page template error traces into a single readable message.",
  },
  {
    id: "cpp-20260619-b1-sfinae-enableif",
    language: "cpp",
    title: "SFINAE with enable_if for compile-time overload selection",
    tag: "modern",
    code: `#include <type_traits>
#include <cmath>

// SFINAE: if the substitution of T into enable_if_t fails (because the condition
// is false), that overload is silently discarded — not a compile error.
// Pre-C++20 approach; concepts are cleaner when available.

// Only enabled for floating-point types
template <typename T, std::enable_if_t<std::is_floating_point_v<T>, int> = 0>
T normalPDF(T x) noexcept {
    constexpr T inv_sqrt2pi = T(0.3989422804014327);
    return inv_sqrt2pi * std::exp(-T(0.5) * x * x);
}

// Overload for integral types — delegates to the float version
template <typename T, std::enable_if_t<std::is_integral_v<T>, int> = 0>
double normalPDF(T x) noexcept {
    return normalPDF<double>(static_cast<double>(x));
}

// void_t trick: detect if a type has a .pv() method
template <typename T, typename = void>
struct HasPV : std::false_type {};

template <typename T>
struct HasPV<T, std::void_t<decltype(std::declval<T>().pv())>> : std::true_type {};

// static_assert(HasPV<SomeInstrument>::value);
int main() {
    double v = normalPDF(1.5);   // float overload
    double v2 = normalPDF(2);    // integral overload → float overload
}`,
    explanation: "SFINAE with enable_if is the C++14/17 idiom for constraining templates; the dummy non-type template parameter (= 0) is the canonical trick to avoid ambiguity between two otherwise-identical signatures.",
  },
  {
    id: "cpp-20260619-b1-lock-free-spsc",
    language: "cpp",
    title: "Lock-free SPSC ring buffer (acquire/release)",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Single-Producer Single-Consumer queue: producer owns head, consumer owns tail.
// No lock needed because only one thread reads/writes each counter.
// Cache-line alignment prevents false sharing (head and tail on separate lines).

template <typename T, std::size_t N>
class SPSCQueue {
    static_assert((N & (N - 1)) == 0, "N must be a power of 2 for cheap masking");
    alignas(64) std::array<T, N>           buf_;
    alignas(64) std::atomic<std::size_t>   head_{0};  // written by producer
    alignas(64) std::atomic<std::size_t>   tail_{0};  // written by consumer
public:
    bool push(T val) noexcept {
        std::size_t h = head_.load(std::memory_order_relaxed);
        if (h - tail_.load(std::memory_order_acquire) >= N)
            return false;  // full
        buf_[h & (N - 1)] = std::move(val);
        head_.store(h + 1, std::memory_order_release);  // publish to consumer
        return true;
    }
    std::optional<T> pop() noexcept {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        if (head_.load(std::memory_order_acquire) == t)
            return std::nullopt;  // empty
        T val = std::move(buf_[t & (N - 1)]);
        tail_.store(t + 1, std::memory_order_release);  // publish to producer
        return val;
    }
    std::size_t size() const noexcept {
        return head_.load(std::memory_order_acquire)
             - tail_.load(std::memory_order_acquire);
    }
};`,
    explanation: "The acquire/release pair on head and tail establishes a happens-before edge: the producer's data write is sequenced before the release store to head, and the consumer's acquire load on head guarantees the data is visible — no mutex needed.",
  },
  {
    id: "cpp-20260619-b1-spinlock-backoff",
    language: "cpp",
    title: "Test-and-test-and-set spinlock with exponential backoff",
    tag: "concurrency",
    code: `#include <atomic>
#include <immintrin.h>   // _mm_pause

// TTAS spinlock: spin on a plain (cached) read; only attempt CAS when the
// lock looks free. This avoids constant cache-line bouncing between cores
// that the naive TAS (test-and-set) spinlock causes.

class Spinlock {
    std::atomic_flag flag_ = ATOMIC_FLAG_INIT;
public:
    void lock() noexcept {
        for (unsigned backoff = 1;;) {
            // Fast path: try to acquire immediately
            if (!flag_.test_and_set(std::memory_order_acquire))
                return;
            // Slow path: spin locally while flag is set
            while (flag_.test(std::memory_order_relaxed)) {
                for (unsigned i = 0; i < backoff; ++i)
                    _mm_pause();  // reduce power, avoid memory-order violations
                backoff = (backoff < 1024) ? backoff * 2 : 1024;
            }
        }
    }
    void unlock() noexcept {
        flag_.clear(std::memory_order_release);
    }
    // RAII guard
    struct Guard {
        Spinlock& sl;
        explicit Guard(Spinlock& s) : sl(s) { sl.lock(); }
        ~Guard() { sl.unlock(); }
    };
};`,
    explanation: "_mm_pause in the spin loop signals to the CPU that this is a spin-wait, allowing the hyper-thread sibling to use execution resources and reducing the power penalty of a hot spin; exponential backoff reduces coherence traffic on heavily-contested locks.",
  },
  {
    id: "cpp-20260619-b1-memory-order-protocol",
    language: "cpp",
    title: "Acquire/release publish protocol for shared market data",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>

// Acquire/release pair: the release store synchronises with the acquire load,
// establishing a happens-before edge. Everything written by the producer before
// the release is visible to the consumer after the acquire — no fence needed.

struct Snapshot {
    double bid, ask;
    std::int64_t seq;
};

alignas(64) Snapshot data;
alignas(64) std::atomic<std::uint64_t> seq_ready{0};  // odd = writing, even = ready

// Producer (market-data thread)
void publishQuote(double bid, double ask, std::int64_t seq) {
    std::uint64_t gen = seq_ready.load(std::memory_order_relaxed);
    seq_ready.store(gen | 1, std::memory_order_relaxed);  // mark as writing
    data = {bid, ask, seq};
    // Release: ensures data writes are visible before incrementing gen
    seq_ready.store(gen + 2, std::memory_order_release);
}

// Consumer (strategy thread) — seqlock-style optimistic read
bool readQuote(Snapshot& out) {
    std::uint64_t g1 = seq_ready.load(std::memory_order_acquire);
    if (g1 & 1) return false;   // write in progress
    out = data;
    std::uint64_t g2 = seq_ready.load(std::memory_order_acquire);
    return g1 == g2;            // retry if generation changed mid-read
}`,
    explanation: "A seqlock (sequence lock) lets one writer and many readers coexist without a mutex: the reader detects a concurrent write by checking the generation counter before and after copying data, retrying on mismatch.",
  },
  {
    id: "cpp-20260619-b1-rdtsc-timer",
    language: "cpp",
    title: "RDTSCP cycle counter for nanosecond-resolution profiling",
    tag: "performance",
    code: `#include <cstdint>
#include <x86intrin.h>

// RDTSCP reads the Time Stamp Counter and serialises the instruction stream
// (all prior instructions committed) more cheaply than CPUID.
// Useful for latency profiling of 10–1000 ns hot paths.

inline std::uint64_t rdtsc_start() noexcept {
    unsigned aux;
    return __rdtscp(&aux);   // serialise: all prior insns retire before read
}

inline std::uint64_t rdtsc_end() noexcept {
    unsigned aux;
    std::uint64_t t = __rdtscp(&aux);
    _mm_lfence();            // prevent later loads from appearing before this
    return t;
}

// Convert ticks to nanoseconds (requires TSC frequency, not invariant across sleep)
double ticksToNs(std::uint64_t ticks, double tsc_ghz) {
    return static_cast<double>(ticks) / tsc_ghz;
}

// Usage:
// const double TSC_GHZ = 3.0;  // measure with rdpmc or OS API
// auto t0 = rdtsc_start();
// hotPath();
// auto t1 = rdtsc_end();
// double ns = ticksToNs(t1 - t0, TSC_GHZ);`,
    explanation: "RDTSCP is preferred over RDTSC for timing because it includes a serialisation barrier — RDTSC can be executed out-of-order relative to surrounding instructions, making measured intervals unreliable without an explicit fence.",
  },
  {
    id: "cpp-20260619-b1-cacheline-padding",
    language: "cpp",
    title: "Cache-line padding to prevent false sharing between threads",
    tag: "performance",
    code: `#include <atomic>
#include <array>
#include <cstddef>

// False sharing: two variables on the same 64-byte cache line cause the
// coherence protocol to bounce the whole line between cores on every write,
// even if the variables are logically independent.

constexpr std::size_t CL = 64;  // x86 cache-line size

struct alignas(CL) PaddedCounter {
    std::atomic<long> value{0};
    char _pad[CL - sizeof(std::atomic<long>)];  // fill to 64 bytes
};

// Each per-core counter lives on its own cache line
std::array<PaddedCounter, 8> perCoreOrders;

void recordOrder(int core) {
    perCoreOrders[core].value.fetch_add(1, std::memory_order_relaxed);
}

long totalOrders() {
    long sum = 0;
    for (auto& c : perCoreOrders)
        sum += c.value.load(std::memory_order_relaxed);
    return sum;
}`,
    explanation: "Padding atomic counters to cache-line boundaries trades memory (8 × 56 bytes wasted) for eliminating the coherence-traffic bottleneck that would otherwise limit per-core throughput to the cache-coherence bus speed.",
  },
  {
    id: "cpp-20260619-b1-prefetch-hint",
    language: "cpp",
    title: "__builtin_prefetch to hide memory latency in order-book scan",
    tag: "performance",
    code: `#include <vector>
#include <cstddef>

// __builtin_prefetch(addr, rw, locality): issues a non-binding prefetch hint.
// rw=0 (prefetch for read), locality=0 (no temporal locality — streaming).
// Hides DRAM latency (~80 ns) by prefetching N elements ahead.

struct PriceLevel {
    double price;
    double totalQty;
    int    orderCount;
    int    _pad;   // keep struct at 32 bytes (power of 2)
};

// Walk bid levels searching for a sufficient qty, prefetching ahead
double findQtyAtOrAbove(const std::vector<PriceLevel>& levels,
                        double target, std::size_t prefetchAhead = 8) {
    double accum = 0.0;
    std::size_t n = levels.size();
    for (std::size_t i = 0; i < n; ++i) {
        if (i + prefetchAhead < n)
            __builtin_prefetch(&levels[i + prefetchAhead], 0, 0);
        if (levels[i].price >= target) accum += levels[i].totalQty;
    }
    return accum;
}`,
    explanation: "Prefetching 8 elements ahead (≈ 32×8 = 256 bytes) hides a full DRAM round-trip latency per iteration; the prefetch is a hint so it never raises faults and degrades gracefully when data is already in cache.",
  },
  {
    id: "cpp-20260619-b1-sbe-decoder",
    language: "cpp",
    title: "Simple Binary Encoding (SBE) zero-copy message decoder",
    tag: "systems",
    code: `#include <cstdint>
#include <cstring>

// SBE: fields at deterministic offsets, fixed width, no dynamic allocation.
// memcpy avoids strict-aliasing UB (vs direct pointer cast).
// templateId dispatch replaces runtime type tags.

#pragma pack(push, 1)
struct SBEHeader {
    uint16_t blockLength;
    uint16_t templateId;
    uint16_t schemaId;
    uint16_t version;
};

struct MDNewOrderSingle {
    int64_t  orderId;    // offset 0
    int64_t  price;      // offset 8  — fixed-point price * 1e8
    int32_t  qty;        // offset 16
    uint8_t  side;       // offset 20 (1=buy, 2=sell)
    uint8_t  orderType;  // offset 21 (1=limit, 2=market)
};
#pragma pack(pop)

constexpr uint16_t TID_NEW_ORDER = 1;

void decodeSBE(const char* buf, std::size_t len) {
    if (len < sizeof(SBEHeader)) return;
    SBEHeader hdr;
    std::memcpy(&hdr, buf, sizeof(hdr));

    if (hdr.templateId == TID_NEW_ORDER &&
        len >= sizeof(SBEHeader) + sizeof(MDNewOrderSingle)) {
        MDNewOrderSingle msg;
        std::memcpy(&msg, buf + sizeof(SBEHeader), sizeof(msg));
        double price = static_cast<double>(msg.price) / 1e8;
        // dispatch msg.side, msg.qty, price ...
    }
}`,
    explanation: "SBE achieves near-wire-speed decoding because every field is at a compile-time offset with a known width — the decoder is a sequence of memcpys, which the compiler can lower to a few SIMD loads on modern CPUs.",
  },
  {
    id: "cpp-20260619-b1-udp-multicast-recv",
    language: "cpp",
    title: "UDP multicast market-data socket setup (Linux)",
    tag: "systems",
    code: `#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <cstring>
#include <stdexcept>

// Multicast: one sender, many receivers. The kernel handles fan-out at the
// NIC level. SO_RCVBUF must be set large to absorb bursts without ring-drops.
// Check /proc/net/udp for receive errors after tuning.

int openMcastSocket(const char* group, const char* iface_ip, uint16_t port) {
    int fd = ::socket(AF_INET, SOCK_DGRAM, 0);
    if (fd < 0) throw std::runtime_error("socket");

    int reuse = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse));

    int rcvbuf = 8 * 1024 * 1024;  // 8 MB — check with getsockopt after setting
    setsockopt(fd, SOL_SOCKET, SO_RCVBUF, &rcvbuf, sizeof(rcvbuf));

    sockaddr_in addr{};
    addr.sin_family      = AF_INET;
    addr.sin_port        = htons(port);
    addr.sin_addr.s_addr = INADDR_ANY;
    if (::bind(fd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0)
        throw std::runtime_error("bind");

    ip_mreq mreq{};
    inet_pton(AF_INET, group,    &mreq.imr_multiaddr);
    inet_pton(AF_INET, iface_ip, &mreq.imr_interface);
    setsockopt(fd, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq));

    return fd;
}`,
    explanation: "IP_ADD_MEMBERSHIP subscribes the socket to a multicast group on a specific NIC; without specifying imr_interface the kernel picks an arbitrary interface, which silently fails on multi-homed hosts with separate market-data NICs.",
  },
  {
    id: "cpp-20260619-b1-fix-tag-parser",
    language: "cpp",
    title: "FIX protocol tag=value parser using string_view and charconv",
    tag: "systems",
    code: `#include <string_view>
#include <charconv>
#include <unordered_map>

// FIX message: "8=FIX.4.2<SOH>55=MSFT<SOH>54=1<SOH>38=100<SOH>10=054<SOH>"
// SOH (0x01) separates tag=value pairs. string_view is zero-copy: no allocation.
// std::from_chars avoids locale-dependent overhead of atoi/strtol.

constexpr char SOH = '\x01';
using FIXMap = std::unordered_map<int, std::string_view>;

FIXMap parseFIX(std::string_view msg) {
    FIXMap fields;
    fields.reserve(32);
    while (!msg.empty()) {
        auto eq = msg.find('=');
        if (eq == std::string_view::npos) break;

        int tag = 0;
        std::from_chars(msg.data(), msg.data() + eq, tag);

        auto soh = msg.find(SOH, eq + 1);
        std::string_view val = (soh == std::string_view::npos)
            ? msg.substr(eq + 1)
            : msg.substr(eq + 1, soh - eq - 1);

        fields[tag] = val;
        msg = (soh == std::string_view::npos) ? "" : msg.substr(soh + 1);
    }
    return fields;
}
// Common FIX tags: 49=SenderCompID, 55=Symbol, 54=Side, 38=OrderQty, 44=Price`,
    explanation: "Using string_view avoids copying the raw FIX buffer; from_chars parses integers without touching locale state and is the fastest standard tag-to-int conversion — both are essential when decoding tens of thousands of messages per second.",
  },
  {
    id: "cpp-20260619-b1-intrusive-list-ob",
    language: "cpp",
    title: "Intrusive doubly-linked list for order-book price level",
    tag: "systems",
    code: `#include <cstddef>

// Intrusive list: next/prev pointers live inside the Order struct itself,
// so adding an order to a price level costs zero heap allocation.
// Removal is O(1) given a pointer to the order (no linear search).

struct Order;

struct IntrusiveNode {
    Order* prev = nullptr;
    Order* next = nullptr;
};

struct Order {
    IntrusiveNode node;   // embedded link — must be accessible from PriceLevel
    int    id;
    double price;
    int    qty;
};

struct PriceLevel {
    Order* head  = nullptr;
    Order* tail  = nullptr;
    int    count = 0;

    void push_back(Order* o) noexcept {
        o->node.prev = tail;
        o->node.next = nullptr;
        if (tail) tail->node.next = o;
        else      head = o;
        tail = o;
        ++count;
    }
    void remove(Order* o) noexcept {
        if (o->node.prev) o->node.prev->node.next = o->node.next;
        else              head = o->node.next;
        if (o->node.next) o->node.next->node.prev = o->node.prev;
        else              tail = o->node.prev;
        --count;
    }
};`,
    explanation: "Intrusive lists are the data structure of choice for order books because removing a specific order (cancel) is O(1) with a direct pointer and adds zero allocator overhead — std::list requires a separate Node allocation per element.",
  },
  {
    id: "cpp-20260619-b1-hybrid-array-hashmap-ob",
    language: "cpp",
    title: "Hybrid array + hash-map order book for tight bid-ask spread",
    tag: "systems",
    code: `#include <array>
#include <unordered_map>
#include <cstdint>
#include <cstddef>

// Most activity concentrates within a narrow band around the best bid/ask.
// A flat array indexed by (price - ref) / tick_size gives O(1) random access
// without pointer chasing. Outlier prices overflow into an unordered_map.

constexpr int HALF  = 500;   // ±500 ticks covered by the array
constexpr int TICK  = 100;   // integer tick size (price stored as int * 1e6)

struct LevelData { double qty; int count; };

class HybridBook {
    int64_t ref_;
    std::array<LevelData, 2*HALF+1> arr_{};
    std::unordered_map<int64_t, LevelData> ovf_;

    int64_t idx(int64_t p) const { return (p - ref_) / TICK + HALF; }
    bool inRange(int64_t p) const { auto i = idx(p); return i >= 0 && i <= 2*HALF; }

    LevelData& get(int64_t p) {
        return inRange(p) ? arr_[idx(p)] : ovf_[p];
    }
public:
    explicit HybridBook(int64_t ref) : ref_(ref) {}
    void add(int64_t price, double qty) { get(price).qty += qty; get(price).count++; }
    void rem(int64_t price, double qty) { get(price).qty -= qty; }
    LevelData& at(int64_t price)        { return get(price); }
};`,
    explanation: "The array-plus-hashmap pattern exploits temporal locality (most orders cluster near the touch) to keep the common path branch-free and cache-hot, while the overflow map handles rare outlier quotes without wasting memory on a huge array.",
  },
  {
    id: "cpp-20260619-b1-branch-free-cmp",
    language: "cpp",
    title: "Branch-free integer min/max via arithmetic right shift",
    tag: "performance",
    code: `#include <cstdint>

// Branch-free selection avoids misprediction penalties (~15 cycles on Intel).
// Trick: sign = (a - b) >> 63 is -1 (all-ones) if a < b, else 0.
// For float: compilers emit MINSD/MAXSD SSE instructions — just write std::min.

inline int64_t branchMin(int64_t a, int64_t b) noexcept {
    int64_t diff = a - b;           // may overflow for extreme values
    int64_t mask = diff >> 63;      // arithmetic shift: all 1s if a < b, else 0
    return a + (diff & mask);       // = a if mask=0, = b if mask=-1
}

inline int64_t branchMax(int64_t a, int64_t b) noexcept {
    int64_t diff = b - a;
    int64_t mask = diff >> 63;
    return a - (diff & mask);       // = a if a >= b, = b otherwise
}

// Branchless clamp for price-level bounding
inline int64_t clampPrice(int64_t p, int64_t lo, int64_t hi) noexcept {
    return branchMax(branchMin(p, hi), lo);
}

// Double version: let the compiler use SSE2 MINSD (check with -O2 -S)
inline double fastMin(double a, double b) noexcept { return a < b ? a : b; }`,
    explanation: "Arithmetic right-shift of a signed integer extends the sign bit into all positions, creating an all-zeros or all-ones mask that replaces a conditional branch with bitwise arithmetic — important on price-clamping hot paths with unpredictable data.",
  },
  {
    id: "cpp-20260619-b1-bs-greeks-fd",
    language: "cpp",
    title: "Black-Scholes Greeks via central finite differences",
    tag: "quant",
    code: `#include <cmath>

double bsCall(double S, double K, double r, double sig, double T) {
    if (T <= 0.0) return std::max(S - K, 0.0);
    double sq = std::sqrt(T);
    double d1 = (std::log(S/K) + (r + 0.5*sig*sig)*T) / (sig*sq);
    double d2 = d1 - sig*sq;
    auto N = [](double x){ return 0.5 * std::erfc(-x * M_SQRT1_2); };
    return S*N(d1) - K*std::exp(-r*T)*N(d2);
}

struct Greeks { double delta, gamma, vega, theta, rho; };

// Central differences: O(h^2) accuracy vs O(h) for forward differences.
// Bump sizes chosen so bump > FP rounding noise but << nonlinearity scale.
Greeks computeGreeks(double S, double K, double r, double sig, double T) {
    const double hS   = S * 1e-4;      // ~0.01% spot bump
    const double hSig = 0.001;         // 10 bps vol bump
    const double hT   = 1.0/252.0;     // one trading day
    const double hR   = 0.0001;        // 1 bps rate bump

    Greeks g;
    g.delta = (bsCall(S+hS, K, r, sig, T) - bsCall(S-hS, K, r, sig, T)) / (2*hS);
    g.gamma = (bsCall(S+hS, K, r, sig, T) - 2*bsCall(S,K,r,sig,T)
              + bsCall(S-hS, K, r, sig, T)) / (hS*hS);
    g.vega  = (bsCall(S, K, r, sig+hSig, T) - bsCall(S, K, r, sig-hSig, T)) / (2*hSig);
    g.theta = (bsCall(S, K, r, sig, T-hT)   - bsCall(S, K, r, sig, T+hT))   / (2*hT);
    g.rho   = (bsCall(S, K, r+hR, sig, T)   - bsCall(S, K, r-hR, sig, T))   / (2*hR);
    return g;
}`,
    explanation: "Central finite differences are standard for risk systems when analytic Greeks aren't available (e.g., path-dependent exotics): using hS = S×ε instead of a constant bump keeps relative accuracy uniform across spot levels.",
  },
  {
    id: "cpp-20260619-b1-asian-mc-antithetic",
    language: "cpp",
    title: "Arithmetic Asian call via Monte Carlo with antithetic variates",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Arithmetic Asian option: payoff = max(A - K, 0) where A = arithmetic mean of S.
// No analytic solution exists for arithmetic average; MC is standard.
// Antithetic variate (simulate z and -z) reduces variance ~50% at zero extra RNG cost.

double asianCallMC(double S0, double K, double r, double sigma, double T,
                   int nSteps, int nPaths, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;
    const double dt    = T / nSteps;
    const double drift = (r - 0.5*sigma*sigma) * dt;
    const double vol   = sigma * std::sqrt(dt);
    const double disc  = std::exp(-r * T);
    double payoffSum = 0.0;

    for (int p = 0; p < nPaths; p += 2) {
        double S1 = S0, S2 = S0, A1 = 0.0, A2 = 0.0;
        for (int t = 0; t < nSteps; ++t) {
            double z = Z(rng);
            S1 *= std::exp(drift + vol *  z);  // original path
            S2 *= std::exp(drift + vol * -z);  // antithetic path
            A1 += S1; A2 += S2;
        }
        A1 /= nSteps; A2 /= nSteps;
        payoffSum += std::max(A1 - K, 0.0) + std::max(A2 - K, 0.0);
    }
    return disc * payoffSum / nPaths;
}`,
    explanation: "Antithetic variates pair each random path with its mirror (z → -z): because geometric paths are log-normally distributed and symmetric, the two payoffs are negatively correlated, halving the Monte Carlo standard error without additional random draws.",
  },
  {
    id: "cpp-20260619-b1-barrier-knockin-mc",
    language: "cpp",
    title: "Up-and-out knock-out barrier call via Monte Carlo",
    tag: "quant",
    code: `#include <cmath>
#include <random>

// Knock-out call: worthless if S ever reaches barrier B from below.
// Discrete monitoring checks at each time step — continuous monitoring
// requires a Brownian-bridge correction for the crossing probability.

double upOutCallMC(double S0, double K, double B, double r, double sigma,
                   double T, int nSteps, int nPaths, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z;
    const double dt    = T / nSteps;
    const double drift = (r - 0.5*sigma*sigma) * dt;
    const double vol   = sigma * std::sqrt(dt);
    const double disc  = std::exp(-r * T);
    double sum = 0.0;

    for (int p = 0; p < nPaths; ++p) {
        double S = S0;
        bool knocked = false;
        for (int t = 0; t < nSteps && !knocked; ++t) {
            S *= std::exp(drift + vol * Z(rng));
            if (S >= B) knocked = true;   // barrier hit: option extinguished
        }
        if (!knocked) sum += std::max(S - K, 0.0);
    }
    return disc * sum / nPaths;
}`,
    explanation: "Discrete monitoring underprices a knock-out barrier relative to continuous monitoring; the Broadie-Glasserman-Kou correction adds σ√(dt)×0.5826 to the barrier at each step to approximate the continuous crossing probability.",
  },
  {
    id: "cpp-20260619-b1-heston-euler-mc",
    language: "cpp",
    title: "Heston stochastic-vol MC pricer (full-truncation scheme)",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Heston: dS = r*S dt + sqrt(v)*S dW_S
//         dv = kappa*(theta-v)*dt + xi*sqrt(v)*dW_v,  corr(dW_S,dW_v) = rho
// Full-truncation: max(v,0) before sqrt to prevent complex numbers.
// Euler-Maruyama is biased; Milstein or QE schemes improve accuracy.

double hestonCallMC(double S0, double K, double r, double v0,
                    double kappa, double theta, double xi, double rho,
                    double T, int nSteps, int nPaths, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> N01;
    const double dt   = T / nSteps;
    const double disc = std::exp(-r * T);
    const double sqdt = std::sqrt(dt);
    const double rho2 = std::sqrt(1.0 - rho*rho);
    double sum = 0.0;

    for (int p = 0; p < nPaths; ++p) {
        double S = S0, v = v0;
        for (int t = 0; t < nSteps; ++t) {
            double z1 = N01(rng), z2 = N01(rng);
            double wS = z1;
            double wV = rho*z1 + rho2*z2;          // correlated Brownian motion
            double sqv = std::sqrt(std::max(v, 0.0));
            S *= std::exp((r - 0.5*v)*dt + sqv*sqdt*wS);
            v  = std::max(v + kappa*(theta - v)*dt + xi*sqv*sqdt*wV, 0.0);
        }
        sum += std::max(S - K, 0.0);
    }
    return disc * sum / nPaths;
}`,
    explanation: "The full-truncation scheme (max(v, 0) before every sqrt and before applying the update) prevents the Euler scheme from producing negative variance, which would cause NaN; the QE (Quadratic-Exponential) scheme by Andersen eliminates this bias more accurately.",
  },
  {
    id: "cpp-20260619-b1-crtp-instrument",
    language: "cpp",
    title: "CRTP mixin for zero-overhead static polymorphism",
    tag: "modern",
    code: `#include <iostream>
#include <cmath>

// CRTP: base receives Derived as template arg; static_cast<Derived*>(this)
// calls the derived implementation without a virtual dispatch.
// No vtable pointer, no indirect call — inlined by the compiler.

template <typename Derived>
struct Instrument {
    double price()  const { return self().priceImpl(); }
    double pv01()   const { return self().pv01Impl(); }
    void   report() const {
        std::cout << "price=" << price() << "  PV01=" << pv01() << '\\n';
    }
private:
    const Derived& self() const { return *static_cast<const Derived*>(this); }
};

struct ZCB : Instrument<ZCB> {
    double face, r, T;
    double priceImpl() const { return face * std::exp(-r * T); }
    double pv01Impl()  const { return -T * priceImpl() * 0.0001; }
};

struct FRA : Instrument<FRA> {
    double notional, fixedRate, floatRate, alpha;
    double priceImpl() const { return notional * (floatRate - fixedRate) * alpha; }
    double pv01Impl()  const { return notional * alpha * 0.0001; }
};

// Template function works with any Instrument subtype — resolved at compile time
template <typename I>
void printRisk(const Instrument<I>& inst) { inst.report(); }`,
    explanation: "CRTP achieves the same interface uniformity as virtual dispatch but with zero overhead: the derived method call is resolved at compile time and inlined, making it viable for hot risk-calculation loops over thousands of instruments.",
  },
  {
    id: "cpp-20260619-b1-stdvariant-dispatch",
    language: "cpp",
    title: "std::variant + std::visit for lock-free message dispatch",
    tag: "modern",
    code: `#include <variant>
#include <string>
#include <iostream>

// std::variant is a type-safe union; std::visit dispatches to the correct
// handler at runtime without inheritance or virtual calls.
// The compiler generates a jump table for visit — branch-predictor friendly
// for streams dominated by one message type.

struct NewOrder    { int id; double price; int qty; char side; };
struct CancelOrder { int id; };
struct ModifyOrder { int id; double newPrice; int newQty; };

using Message = std::variant<NewOrder, CancelOrder, ModifyOrder>;

// Overload set visitor: one struct with multiple operator() overloads
struct Handler {
    int& newCount;
    int& cancelCount;

    void operator()(const NewOrder& o) const {
        ++newCount;
        // insert into book
    }
    void operator()(const CancelOrder& c) const {
        ++cancelCount;
        // remove from book
    }
    void operator()(const ModifyOrder& m) const {
        // remove old, insert new
    }
};

void dispatch(const Message& msg, Handler& h) {
    std::visit(h, msg);
}`,
    explanation: "std::visit uses the variant's type index as an index into a compiler-generated dispatch table, giving O(1) type dispatch with static type safety — unlike a dynamic_cast chain or a virtual call hierarchy, there's no heap allocation or pointer indirection.",
  },
  {
    id: "cpp-20260619-b1-coroutine-generator",
    language: "cpp",
    title: "C++20 coroutine generator for lazy price-path streaming",
    tag: "modern",
    code: `#include <coroutine>
#include <optional>
#include <utility>
#include <cmath>

// Generator coroutine: co_yield suspends the function and returns one value
// to the caller. Resumes from where it left off on the next call to next().
// Useful for lazily generating price paths or synthetic tick streams.

template <typename T>
struct Generator {
    struct promise_type {
        T current;
        std::suspend_always yield_value(T v) { current = std::move(v); return {}; }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        Generator           get_return_object() { return Generator{this}; }
        void                return_void()      {}
        void                unhandled_exception() { throw; }
    };
    using H = std::coroutine_handle<promise_type>;
    H h;
    explicit Generator(promise_type* p) : h(H::from_promise(*p)) {}
    ~Generator() { if (h) h.destroy(); }
    Generator(Generator&& o) noexcept : h(std::exchange(o.h, {})) {}
    std::optional<T> next() {
        if (h.done()) return std::nullopt;
        h.resume();
        return h.done() ? std::nullopt : std::optional<T>{h.promise().current};
    }
};

// Generate a GBM tick stream lazily (one step per call to next())
Generator<double> gbmStream(double S0, double muDt, double sigSqDt, double z = 0.1) {
    double S = S0;
    while (true) {
        S *= std::exp(muDt + sigSqDt * z);  // z would come from RNG in production
        co_yield S;
    }
}`,
    explanation: "Coroutine generators decouple the production of data (price path simulation) from its consumption (strategy logic) without allocating an intermediate buffer — the coroutine frame on the heap holds state between co_yields, acting as a resumable function.",
  },
  {
    id: "cpp-20260619-b1-pnl-attribution",
    language: "cpp",
    title: "P&L attribution via Taylor-expanded Greeks (risk explain)",
    tag: "quant",
    code: `#include <cmath>

// Daily P&L decomposition: dV ≈ delta*dS + 0.5*gamma*dS^2 + vega*dsigma
//                               + theta*dt + rho*dr + residual.
// The 'explain' report shows how much each risk factor contributed;
// a large residual signals unmodelled risks (vol-of-vol, jumps, etc.).

struct Greeks { double delta, gamma, vega, theta, rho; };

struct PnLExplain {
    double delta_pnl, gamma_pnl, vega_pnl, theta_pnl, rho_pnl;
    double residual, total;
};

PnLExplain attributePnL(const Greeks& g,
                         double dS, double dSigma, double dt, double dr,
                         double actualPnL) {
    PnLExplain e;
    e.delta_pnl = g.delta * dS;
    e.gamma_pnl = 0.5 * g.gamma * dS * dS;
    e.vega_pnl  = g.vega * dSigma;
    e.theta_pnl = g.theta * dt;
    e.rho_pnl   = g.rho * dr;

    double explained = e.delta_pnl + e.gamma_pnl + e.vega_pnl
                     + e.theta_pnl + e.rho_pnl;
    e.residual = actualPnL - explained;
    e.total    = actualPnL;
    return e;
}`,
    explanation: "The Taylor expansion of option value decomposes P&L exactly at first and second order in spot and vol moves; the residual captures third-order (speed), cross-gamma, and vol-of-vol terms that are outside the standard Greeks — a fat residual on a trading desk is a red flag.",
  },
  {
    id: "cpp-20260619-b1-hugepages-mmap",
    language: "cpp",
    title: "Hugepage allocation via mmap MAP_HUGETLB (Linux)",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <stdexcept>
#include <cerrno>
#include <cstring>

// Hugepages (2 MB vs 4 KB) reduce TLB pressure for large data structures.
// The TLB typically covers only 4 KB x 1536 entries = 6 MB on a modern CPU;
// an order book or ring buffer larger than that benefits greatly.
// Prerequisite: echo 512 > /proc/sys/vm/nr_hugepages (as root)

constexpr std::size_t HUGE_SIZE = 2UL << 20;  // 2 MB

void* allocHugepages(std::size_t bytes) {
    bytes = (bytes + HUGE_SIZE - 1) & ~(HUGE_SIZE - 1);  // round up
    void* p = ::mmap(nullptr, bytes,
                     PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                     -1, 0);
    if (p == MAP_FAILED)
        throw std::runtime_error(std::strerror(errno));
    return p;
}

void freeHugepages(void* p, std::size_t bytes) {
    bytes = (bytes + HUGE_SIZE - 1) & ~(HUGE_SIZE - 1);
    ::munmap(p, bytes);
}

// Transparent Huge Pages alternative (no root needed):
// madvise(p, size, MADV_HUGEPAGE);  // after a regular mmap`,
    explanation: "A 2MB hugepage covers 512 4KB page-table entries in a single TLB slot: an order book accessed randomly across 100 MB benefits from ~50× TLB coverage improvement, reducing TLB miss penalty (typically 50–200 cycles each) on the hot lookup path.",
  },
  {
    id: "cpp-20260619-b1-constexpr-lut",
    language: "cpp",
    title: "consteval lookup table for norm CDF built at compile time",
    tag: "performance",
    code: `#include <array>
#include <cstddef>
#include <cmath>

// consteval function runs only at compile time, so the table has zero runtime
// initialisation cost. Useful for expensive transcendentals in hot loops.
// Abramowitz & Stegun 7.1.26 polynomial used (max error < 1.5e-7).

constexpr std::size_t N   = 4096;
constexpr double      MAX = 4.0;   // covers ±4σ

consteval std::array<float, N> buildNormCDFTable() {
    std::array<float, N> t{};
    for (std::size_t i = 0; i < N; ++i) {
        double x = MAX * static_cast<double>(i) / (N - 1);
        double t1 = 1.0 / (1.0 + 0.2316419 * x);
        double poly = t1*(0.319381530 + t1*(-0.356563782
                    + t1*(1.781477937 + t1*(-1.821255978 + t1*1.330274429))));
        double erf_val = 1.0 - poly * std::exp(-x*x) / std::sqrt(2.0*M_PI) * std::sqrt(2.0*M_PI);
        // N(x) = 0.5 * (1 + erf(x/sqrt(2))) approximated here
        t[i] = static_cast<float>(1.0 - poly * std::exp(-0.5*x*x) / std::sqrt(2.0*M_PI) * std::sqrt(2.0*M_PI));
    }
    return t;
}

inline const std::array<float, N> NORM_CDF_TABLE = buildNormCDFTable();

float fastNCDF(float x) {
    bool neg = x < 0.0f;
    if (neg) x = -x;
    if (x >= static_cast<float>(MAX)) return neg ? 0.0f : 1.0f;
    std::size_t i = static_cast<std::size_t>(x / MAX * (N - 1));
    return neg ? 1.0f - NORM_CDF_TABLE[i] : NORM_CDF_TABLE[i];
}`,
    explanation: "consteval guarantees compile-time evaluation and produces a read-only data section entry — the table lookup becomes a load from .rodata rather than a transcendental function call, trading 4KB of binary size for ~10× throughput on pricing loops that call N() millions of times.",
  },
];
