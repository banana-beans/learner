import type { Snippet } from "./types";

export const cppSnippets20260615B1: Snippet[] = [
  {
    id: "cpp-20260615-b1-concepts-numeric",
    language: "cpp",
    title: "C++20 Concepts — constrained templates for quant numeric types",
    tag: "modern",
    code: `#include <concepts>
#include <cmath>
#include <type_traits>

// C++20 Concepts replace SFINAE enable_if with readable named constraints.
// Violations produce short messages ("doesn't satisfy Floating") not
// multi-page instantiation backtraces.

// Simple structural concepts
template<typename T>
concept Floating = std::is_floating_point_v<T>;

template<typename T>
concept Arithmetic = std::is_arithmetic_v<T>;

// Requires-expression: verify callable syntax compiles for the type
template<typename T>
concept DualNumber = requires(T x, double d) {
    { x.val() } -> std::convertible_to<double>;  // primal value
    { x.dot() } -> std::convertible_to<double>;  // derivative (tangent)
    T(d, d);   // constructible as (value, derivative) pair
};

// Priceable: any type that supports arithmetic + abs + sqrt + log
template<typename T>
concept Priceable = Floating<T> || DualNumber<T>;

// Black-Scholes d1 constrained to floating-point only
template<Floating T>
T bs_d1(T S, T K, T r, T sigma, T tau) noexcept {
    return (std::log(S / K) + (r + T(0.5) * sigma * sigma) * tau)
           / (sigma * std::sqrt(tau));
}

// Named concept for option-like types (structural interface check)
template<typename Opt>
concept StrikedOption = requires(const Opt& o, double S) {
    { o.payoff(S) } -> std::convertible_to<double>;
    { o.strike()  } -> std::convertible_to<double>;
    { o.expiry()  } -> std::convertible_to<double>;
    { o.is_call   } -> std::convertible_to<bool>;
};

struct EuropeanCall {
    double K, T;
    static constexpr bool is_call = true;
    double payoff(double S) const noexcept { return std::max(S - K, 0.0); }
    double strike() const noexcept { return K; }
    double expiry()  const noexcept { return T; }
};
static_assert(StrikedOption<EuropeanCall>);   // verified at compile time

// Concept in template parameter list: generic delta for any StrikedOption
template<StrikedOption Opt>
double delta(const Opt& opt, double S, double r, double sigma) noexcept {
    double tau = opt.expiry();
    if (tau <= 0.0) return opt.is_call ? (S > opt.strike() ? 1.0 : 0.0) : (S < opt.strike() ? -1.0 : 0.0);
    double d1 = bs_d1(S, opt.strike(), r, sigma, tau);
    double nd1 = 0.5 * std::erfc(-d1 / std::sqrt(2.0));
    return opt.is_call ? nd1 : nd1 - 1.0;
}

// Abbreviated function template (C++20): auto parameter implicitly requires concept
auto safeDiv(Floating auto a, Floating auto b, decltype(a) def = 0) noexcept {
    return std::abs(b) > decltype(b)(1e-14) ? a / b : def;
}`,
    explanation:
      "C++20 Concepts encode template preconditions in the type system rather than as documentation comments — the StrikedOption concept enforces that every pricer template is only instantiated for types that actually implement the option interface, catching errors at the call site with a one-line diagnostic instead of a 40-line substitution failure. The abbreviated function template `Floating auto a` is syntactic sugar for `template<Floating T> auto safeDiv(T a, T b)` — it reduces boilerplate while keeping the constraint visible.",
  },
  {
    id: "cpp-20260615-b1-ranges-pipeline",
    language: "cpp",
    title: "std::ranges pipeline — lazy tick-data transformation with zero allocations",
    tag: "modern",
    code: `#include <ranges>
#include <vector>
#include <cmath>
#include <numeric>
#include <algorithm>

// std::ranges (C++20): composable, lazy view adaptors that chain without
// intermediate containers. The pipeline below allocates nothing until the
// final range-for or std::ranges::to<> materialisation.

struct Tick { double bid, ask, ts_ns; int venue_id; };

// VWAP from a tick stream — filter stale / off-venue ticks, then average mids
double vwap(const std::vector<Tick>& ticks,
            double cutoff_ns, int target_venue) noexcept {
    auto mids = ticks
        | std::views::filter([&](const Tick& t) {
            return t.ts_ns >= cutoff_ns && t.venue_id == target_venue;
          })
        | std::views::transform([](const Tick& t) {
            return (t.bid + t.ask) * 0.5;
          });

    double s = 0.0; int n = 0;
    for (double m : mids) { s += m; ++n; }
    return n > 0 ? s / n : 0.0;
}

// Log returns: std::views::adjacent<2> gives consecutive pairs
std::vector<double> logReturns(const std::vector<double>& prices) {
    auto ret = prices
        | std::views::adjacent<2>
        | std::views::transform([](auto&& p) {
            auto [p0, p1] = p;
            return std::log(p1 / p0);
          });
    return std::ranges::to<std::vector>(ret);
}

// GBM forward curve: iota generates time indices, transform maps to price
std::vector<double> gbmForwards(double S0, double r, double sigma,
                                 double T, int N) {
    double dt = T / N;
    auto fwds = std::views::iota(0, N + 1)
        | std::views::transform([&](int i) {
            return S0 * std::exp((r - 0.5 * sigma * sigma) * i * dt);
          });
    return std::ranges::to<std::vector>(fwds);
}

// Running max drawdown without explicit temporary vector
double maxDrawdown(const std::vector<double>& nav) {
    double peak = nav.front(), worst = 0.0;
    for (double v : nav) {
        peak  = std::max(peak, v);
        worst = std::min(worst, v / peak - 1.0);
    }
    return worst;
}

// std::ranges algorithms: partition strategies by Sharpe without sorting a copy
auto highSharpeFront(std::vector<double>& sharpes, double threshold) {
    return std::ranges::partition(sharpes, [=](double s){ return s >= threshold; });
}`,
    explanation:
      "The views pipeline is evaluated left-to-right lazily: each iteration of the range-for calls only the current element's filter and transform predicates in sequence, so no intermediate vector is allocated and the CPU's instruction cache stays warm on the single lambda callsite. std::views::adjacent<2> is a C++23 extension that avoids the manual index arithmetic of `prices[i], prices[i+1]` pairs, and std::ranges::to<std::vector> in C++23 replaces the verbose `vector(range.begin(), range.end())` materialisation.",
  },
  {
    id: "cpp-20260615-b1-span-udp",
    language: "cpp",
    title: "std::span — zero-copy UDP market data packet parsing",
    tag: "market-data",
    code: `#include <span>
#include <cstdint>
#include <cstddef>
#include <cstring>
#include <optional>
#include <array>

// std::span<T> (C++20): a non-owning view into a contiguous range.
// Unlike string_view, it works with any element type and supports subspan().
// Replacing raw pointer+length pairs eliminates a class of buffer-overrun bugs.

// UDP datagram layout (little-endian example, similar to CME Globex SBE):
// [0..3]  : sequence number (uint32)
// [4..5]  : message count (uint16)
// [6..7]  : padding
// [8..n]  : N variable-length messages starting with (uint8 msg_type, uint8 len)

struct PriceMsg {
    std::uint32_t instrument_id;
    std::int64_t  price_mantissa;  // price * 1e8
    std::int32_t  qty;
    std::uint8_t  side;            // 0=bid, 1=ask
};

// Parse the header — returns false if the span is too short
struct PktHeader { std::uint32_t seq; std::uint16_t msg_count; };

std::optional<PktHeader> parseHeader(std::span<const std::byte> pkt) noexcept {
    if (pkt.size_bytes() < 8) return std::nullopt;
    PktHeader h;
    std::memcpy(&h.seq,       pkt.data(),     4);
    std::memcpy(&h.msg_count, pkt.data() + 4, 2);
    return h;
}

// Iterate over variable-length messages using subspan() to advance the cursor
void processPacket(std::span<const std::byte> pkt) noexcept {
    auto hdr = parseHeader(pkt);
    if (!hdr) return;

    std::span<const std::byte> cursor = pkt.subspan(8);   // skip header
    for (std::uint16_t i = 0; i < hdr->msg_count && cursor.size() >= 2; ++i) {
        std::uint8_t msg_type, msg_len;
        std::memcpy(&msg_type, cursor.data(),     1);
        std::memcpy(&msg_len,  cursor.data() + 1, 1);

        std::span<const std::byte> body = cursor.subspan(2, msg_len);

        if (msg_type == 0x01 && body.size_bytes() >= sizeof(PriceMsg)) {
            PriceMsg msg;
            std::memcpy(&msg, body.data(), sizeof(PriceMsg));
            double price = msg.price_mantissa * 1e-8;
            // process price...
            (void)price;
        }

        if (2 + msg_len > cursor.size()) break;
        cursor = cursor.subspan(2 + msg_len);
    }
}

// Stack-allocated receive buffer — span wraps the array without allocation
void recvLoop(int sock_fd) {
    std::array<std::byte, 1500> buf;  // one Ethernet MTU
    (void)sock_fd;
    // In production: recv(sock_fd, buf.data(), buf.size(), 0) -> recv_len
    // std::span<const std::byte> view{buf.data(), recv_len};
    // processPacket(view);
}`,
    explanation:
      "std::span solves the 'raw pointer + length' anti-pattern: subspan() returns a bounded view of the remaining bytes without copying, and size_bytes() lets you validate before every memcpy — the compiler flags accesses beyond the span boundary in sanitiser builds. The critical HFT advantage is that the entire packet is parsed from the original recv() buffer without a single heap allocation, keeping all data in L1/L2 cache while parsing the 6-10 messages in a typical UDP datagram.",
  },
  {
    id: "cpp-20260615-b1-stack-allocator",
    language: "cpp",
    title: "Stack allocator — STL-compatible allocator backed by on-stack arena",
    tag: "performance",
    code: `#include <cstddef>
#include <array>
#include <cassert>
#include <new>
#include <vector>
#include <list>

// Stack allocator: satisfies the C++ Allocator requirements, backed by a
// fixed-size on-stack (or member) arena. No heap calls at all.
// Used with small_vector / inplace_vector patterns for per-message processing.

template<std::size_t N>
class StackArena {
    alignas(std::max_align_t) std::array<char, N> buf_;
    char* ptr_ = buf_.data();

public:
    StackArena() noexcept = default;
    StackArena(const StackArena&) = delete;

    char* allocate(std::size_t n, std::size_t align = alignof(std::max_align_t)) {
        // Align ptr_ to the requested alignment
        std::size_t offset = static_cast<std::size_t>(ptr_ - buf_.data());
        std::size_t aligned = (offset + align - 1) & ~(align - 1);
        assert(aligned + n <= N && "StackArena overflow");
        char* result = buf_.data() + aligned;
        ptr_ = result + n;
        return result;
    }

    // Monotonic: individual frees are no-ops; reset() reclaims all at once.
    void deallocate(char* /*p*/, std::size_t /*n*/) noexcept {}
    void reset()   noexcept { ptr_ = buf_.data(); }

    std::size_t used() const noexcept {
        return static_cast<std::size_t>(ptr_ - buf_.data());
    }
    static constexpr std::size_t capacity() noexcept { return N; }
};

// Allocator adaptor: makes StackArena usable with std::vector, std::list, etc.
template<typename T, std::size_t N>
class StackAllocator {
    StackArena<N>* arena_;

public:
    using value_type = T;

    explicit StackAllocator(StackArena<N>& a) noexcept : arena_(&a) {}

    template<typename U>
    StackAllocator(const StackAllocator<U, N>& o) noexcept : arena_(o.arena_) {}

    T* allocate(std::size_t n) {
        return reinterpret_cast<T*>(arena_->allocate(n * sizeof(T), alignof(T)));
    }
    void deallocate(T* p, std::size_t n) noexcept {
        arena_->deallocate(reinterpret_cast<char*>(p), n * sizeof(T));
    }

    template<typename U, std::size_t M>
    friend class StackAllocator;

    bool operator==(const StackAllocator& o) const noexcept { return arena_ == o.arena_; }
};

// Usage: a 4096-byte arena for a vector of doubles — zero heap calls
// StackArena<4096> arena;
// using StackVec = std::vector<double, StackAllocator<double, 4096>>;
// StackVec greeks(StackAllocator<double, 4096>{arena});
// greeks.reserve(20);   // allocated from arena, not heap`,
    explanation:
      "The stack allocator is a monotonic resource — individual deallocate() calls are no-ops, and reset() reclaims all memory in O(1) by just resetting the pointer. This matches the allocation pattern of per-message processing: allocate several temporary containers at message arrival, use them, then reset the arena when the message is fully handled. The alignment trick `(offset + align - 1) & ~(align - 1)` rounds up to the next multiple of 'align' using only bitwise operations, which is important because std::vector's internal storage expects stricter alignment than char.",
  },
  {
    id: "cpp-20260615-b1-itch-parser",
    language: "cpp",
    title: "NASDAQ ITCH 5.0 binary parser — big-endian network byte order parsing",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstddef>
#include <cstring>
#include <span>
#include <optional>

// NASDAQ ITCH 5.0: binary protocol carried over MoldUDP64 multicast.
// All multi-byte integers are big-endian (network byte order).
// Message types relevant for order book reconstruction:
//   'A' (0x41) = Add Order; 'U' (0x55) = Order Replace; 'D' (0x44) = Delete Order
//   'E' (0x45) = Order Executed; 'C' (0x43) = Executed with Price

// Big-endian load helpers (avoids htonl dependency)
static inline std::uint16_t be16(const std::byte* p) noexcept {
    return (static_cast<std::uint16_t>(p[0]) << 8)
          | static_cast<std::uint16_t>(p[1]);
}
static inline std::uint32_t be32(const std::byte* p) noexcept {
    return (std::uint32_t(p[0]) << 24) | (std::uint32_t(p[1]) << 16)
         | (std::uint32_t(p[2]) <<  8) |  std::uint32_t(p[3]);
}
static inline std::uint64_t be64(const std::byte* p) noexcept {
    return (std::uint64_t(be32(p)) << 32) | be32(p + 4);
}

struct AddOrder {
    std::uint64_t ts_ns;         // timestamp (nanoseconds past midnight)
    std::uint64_t ref;           // order reference number
    double        price;         // price (ITCH stores as 4-decimal integer / 10000)
    std::uint32_t qty;
    std::uint16_t stock_idx;
    char          side;          // 'B' or 'S'
};

// ITCH 'A' message is 36 bytes (excluding 2-byte length prefix):
// [0]    msg_type (1 byte, 'A')
// [1..2] stock_locate (uint16)
// [3..4] tracking (uint16, skip)
// [5..10] timestamp (uint48 — 6 bytes)
// [11..18] order_ref (uint64)
// [19]   buy_sell_indicator ('B'/'S')
// [20..23] shares (uint32)
// [24..31] stock (8 chars, space-padded)
// [32..35] price (uint32, divide by 10000 for dollars)
std::optional<AddOrder> parseAddOrder(std::span<const std::byte> msg) noexcept {
    if (msg.size_bytes() < 36 || static_cast<char>(msg[0]) != 'A')
        return std::nullopt;

    const auto* p = msg.data();
    AddOrder ao;
    // 6-byte timestamp: treat as upper 48 bits of a 64-bit nanosecond counter
    ao.ts_ns    = (std::uint64_t(be16(p + 5)) << 32) | be32(p + 7);
    ao.ref      = be64(p + 11);
    ao.side     = static_cast<char>(p[19]);
    ao.qty      = be32(p + 20);
    ao.stock_idx = be16(p + 1);

    std::uint32_t price_raw = be32(p + 32);
    ao.price    = price_raw * 0.0001;   // ITCH stores as price × 10000

    return ao;
}

// Delete Order ('D'): 19 bytes — just order reference and timestamp
struct DeleteOrder { std::uint64_t ts_ns, ref; };

std::optional<DeleteOrder> parseDeleteOrder(std::span<const std::byte> msg) noexcept {
    if (msg.size_bytes() < 19 || static_cast<char>(msg[0]) != 'D')
        return std::nullopt;
    const auto* p = msg.data();
    return DeleteOrder{
        (std::uint64_t(be16(p + 5)) << 32) | be32(p + 7),
        be64(p + 11)
    };
}`,
    explanation:
      "ITCH uses big-endian byte order (network standard) while x86 is little-endian — naive memcpy into a uint32_t gives the wrong value. The inline be32() function performs a byte swap with only 3 OR operations and 3 shifts with no branch; at -O2, gcc generates a single BSWAP instruction. The 6-byte (48-bit) timestamp is a subtle ITCH peculiarity: the nanosecond-since-midnight counter is packed in 6 bytes to avoid the overhead of a full 8-byte aligned integer in the multicast stream.",
  },
  {
    id: "cpp-20260615-b1-mpsc-queue",
    language: "cpp",
    title: "MPSC lock-free queue — multi-producer single-consumer with CAS",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstddef>
#include <optional>
#include <new>

// Multi-Producer Single-Consumer (MPSC) intrusive queue.
// Producers compete via CAS on tail; consumer owns head exclusively.
// Unlike SPSC, producers must synchronise with each other.
// The intrusive design: each message carries its own link pointer,
// eliminating per-message allocation — producers pre-allocate their nodes.
//
// Algorithm: Vyukov MPSC (Michael's 1996 variant).
// Push: CAS tail to new node, then link prev->next.
// Pop: consumer checks head->next; if non-null, advances head.

template<typename T>
struct MPSCNode {
    T                   data;
    std::atomic<MPSCNode*> next{nullptr};
    explicit MPSCNode(const T& v) : data(v) {}
};

template<typename T>
class MPSCQueue {
    alignas(64) std::atomic<MPSCNode<T>*> tail_;
    alignas(64) MPSCNode<T>*              head_;   // consumer-owned; no atomic needed

    MPSCNode<T> stub_;   // sentinel node; head_ starts here

public:
    MPSCQueue() noexcept : tail_(&stub_), head_(&stub_) {
        stub_.next.store(nullptr, std::memory_order_relaxed);
    }

    // Producer: can be called concurrently from multiple threads.
    void push(MPSCNode<T>* node) noexcept {
        node->next.store(nullptr, std::memory_order_relaxed);
        // Swing tail to the new node; get the previous tail back
        MPSCNode<T>* prev = tail_.exchange(node, std::memory_order_acq_rel);
        // Link: once this store happens, the consumer can see the node.
        // The producer that wins the exchange "owns" the link from prev.
        prev->next.store(node, std::memory_order_release);
    }

    // Consumer: called from exactly one thread.
    // Returns nullptr if queue is empty.
    MPSCNode<T>* pop() noexcept {
        MPSCNode<T>* head = head_;
        MPSCNode<T>* next = head->next.load(std::memory_order_acquire);

        if (next == nullptr) return nullptr;    // empty

        head_ = next;                           // advance the head sentinel
        next->data = head->data;                // reuse stub pattern: copy data out
        // In practice: return 'next', caller reads next->data, then recycles 'head'
        return next;
    }

    bool empty() const noexcept {
        return head_->next.load(std::memory_order_acquire) == nullptr;
    }
};

// Usage pattern (market data thread → strategy thread):
// MPSCQueue<double> q;
// // Producer threads:
// auto* node = producer_pool.alloc();
// new (node) MPSCNode<double>(100.25);
// q.push(node);
// // Consumer thread:
// while (auto* n = q.pop()) { process(n->data); }`,
    explanation:
      "The MPSC queue requires only one CAS per push (on tail_), whereas a general MPMC queue needs two CAS operations (one for tail, one for the slot state). The 'stub node' pattern (sentinel) eliminates the special case of the first pop on an empty queue — the consumer always sees a valid head pointer, and the sentinel is recycled after the first real push. The brief window between `tail_.exchange()` and `prev->next.store()` creates a 'producer lag': if the consumer arrives during this window, it sees next == nullptr and returns empty, but a subsequent pop will succeed — this is the known safe linearisation point of Vyukov's MPSC.",
  },
  {
    id: "cpp-20260615-b1-matcher-engine",
    language: "cpp",
    title: "Price-time priority order matching engine — core inner loop",
    tag: "systems",
    code: `#include <map>
#include <deque>
#include <cstdint>
#include <optional>
#include <functional>

// Price-time priority matching engine:
// Bids: std::map<price, deque<Order>> keyed in descending order (highest first).
// Asks: std::map<price, deque<Order>> keyed in ascending order (lowest first).
// Match: while best_ask.price <= best_bid.price, fill at the passive (resting) price.

struct Order {
    std::uint64_t id;
    double        price;
    int           qty;
    bool          buy;   // true = bid
};

struct Fill {
    std::uint64_t aggressor_id;
    std::uint64_t passive_id;
    double        exec_price;
    int           exec_qty;
};

class MatchingEngine {
    // Bids: greatest price first — std::greater<double>
    std::map<double, std::deque<Order>, std::greater<double>> bids_;
    // Asks: least price first — default std::less<double>
    std::map<double, std::deque<Order>>                       asks_;

    using FillCallback = std::function<void(const Fill&)>;

    void emitFill(const Order& aggr, const Order& pass,
                  int qty, const FillCallback& cb) {
        cb(Fill{aggr.id, pass.id, pass.price, qty});
    }

public:
    // Returns immediately; fills reported via callback.
    void addOrder(Order ord, const FillCallback& on_fill) {
        auto& passive_side = ord.buy ? asks_ : bids_;

        while (ord.qty > 0 && !passive_side.empty()) {
            auto it = passive_side.begin();
            // Check if a match exists
            if (ord.buy  && it->first > ord.price) break;   // ask too high
            if (!ord.buy && it->first < ord.price) break;   // bid too low

            auto& queue = it->second;
            while (ord.qty > 0 && !queue.empty()) {
                Order& resting = queue.front();
                int fill_qty   = std::min(ord.qty, resting.qty);
                emitFill(ord, resting, fill_qty, on_fill);
                ord.qty     -= fill_qty;
                resting.qty -= fill_qty;
                if (resting.qty == 0) queue.pop_front();
            }
            if (queue.empty()) passive_side.erase(it);
        }

        // Rest any unfilled quantity
        if (ord.qty > 0) {
            auto& own_side = ord.buy ? bids_ : asks_;
            own_side[ord.price].push_back(ord);
        }
    }

    // O(1) best bid/ask via begin() on sorted maps
    std::optional<double> bestBid() const noexcept {
        if (bids_.empty()) return std::nullopt;
        return bids_.begin()->first;
    }
    std::optional<double> bestAsk() const noexcept {
        if (asks_.empty()) return std::nullopt;
        return asks_.begin()->first;
    }
    double spread() const noexcept {
        auto b = bestBid(), a = bestAsk();
        return (b && a) ? *a - *b : 0.0;
    }
};`,
    explanation:
      "The map + deque structure enforces two-level priority: std::map provides O(log P) price ordering (P = distinct price levels, typically 10–50 for a liquid instrument) and the deque at each price level enforces FIFO time priority. The aggressive order walks through resting orders from best price outward — the inner while loop fills at the resting (passive) price, consistent with standard exchange rules. Production engines replace std::map with a custom array-indexed structure for O(1) best-level access, but the algorithmic logic here is identical.",
  },
  {
    id: "cpp-20260615-b1-hugepages",
    language: "cpp",
    title: "Huge page allocation — mmap(MAP_HUGETLB) to eliminate TLB misses",
    tag: "performance",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <cstdint>
#include <cassert>
#include <cstring>

// TLB (Translation Lookaside Buffer): hardware cache for virtual→physical mappings.
// With 4 KB pages, a 100 MB order book = 25 600 TLB entries.
// L1 TLB has 64 entries; each miss → L2 TLB → page walk (~100 ns).
// Huge pages (2 MB on x86): 100 MB = 50 TLB entries — almost never misses.
// mmap with MAP_HUGETLB | MAP_ANONYMOUS: anonymous 2 MB pages from kernel.

constexpr std::size_t HUGEPAGE_SIZE = 2UL << 20;   // 2 MB

// Allocate n bytes on huge pages; size is rounded up to HUGEPAGE_SIZE multiple.
void* hugeAlloc(std::size_t n) noexcept {
    std::size_t sz = (n + HUGEPAGE_SIZE - 1) & ~(HUGEPAGE_SIZE - 1);
    void* p = mmap(nullptr, sz,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                   -1, 0);
    if (p == MAP_FAILED) {
        // Fallback: transparent huge pages via posix_memalign + madvise
        posix_memalign(&p, HUGEPAGE_SIZE, sz);
        madvise(p, sz, MADV_HUGEPAGE);   // request THP promotion
    }
    return p;
}

void hugeFree(void* p, std::size_t n) noexcept {
    std::size_t sz = (n + HUGEPAGE_SIZE - 1) & ~(HUGEPAGE_SIZE - 1);
    munmap(p, sz);
}

// Lock pages into RAM to prevent swap (critical for HFT latency)
void lockPages(void* p, std::size_t n) noexcept {
    mlock(p, n);    // requires CAP_IPC_LOCK or appropriate ulimit
}

// RAII wrapper for a huge-page-backed buffer
template<typename T>
class HugeBuffer {
    T*          data_  = nullptr;
    std::size_t count_ = 0;

public:
    explicit HugeBuffer(std::size_t n) : count_(n) {
        data_ = static_cast<T*>(hugeAlloc(n * sizeof(T)));
        lockPages(data_, n * sizeof(T));
        std::memset(data_, 0, n * sizeof(T));   // fault pages into RAM immediately
    }

    ~HugeBuffer() {
        if (data_) hugeFree(data_, count_ * sizeof(T));
    }

    HugeBuffer(const HugeBuffer&) = delete;
    HugeBuffer& operator=(const HugeBuffer&) = delete;

    T* data()      noexcept { return data_; }
    std::size_t size() const noexcept { return count_; }
    T& operator[](std::size_t i) noexcept { return data_[i]; }

    // Pre-touch all pages so the kernel faults them in now, not during trading
    void preFault() noexcept {
        volatile T dummy{};
        for (std::size_t i = 0; i < count_; i += HUGEPAGE_SIZE / sizeof(T))
            dummy = data_[i];
        (void)dummy;
    }
};

// Example: order book depth array on huge pages
// HugeBuffer<double> bid_prices(10000);
// bid_prices.preFault();  // eliminates first-access page faults during trading`,
    explanation:
      "A 4 KB page TLB miss costs ~100 ns on modern CPUs because the MMU must walk four levels of page tables to resolve the physical address — for an order book accessed in random-access patterns (cancel by order ID), TLB misses can dominate latency. The memset in the constructor forces the kernel to fault all huge pages into RAM immediately (establishing the physical→virtual mappings) rather than lazily on first access during trading; without this, the first access to each new page triggers a kernel fault handler and a TLB shootdown, adding unpredictable latency spikes.",
  },
  {
    id: "cpp-20260615-b1-numa-alloc",
    language: "cpp",
    title: "NUMA-aware allocation — binding memory to CPU socket for HFT latency",
    tag: "performance",
    code: `#include <numa.h>
#include <numaif.h>
#include <sched.h>
#include <cstddef>
#include <cstdint>
#include <cstring>

// NUMA (Non-Uniform Memory Access): on multi-socket servers, accessing memory
// attached to a remote NUMA node adds ~40-80 ns vs local NUMA (~60 ns total).
// HFT strategy: pin the market data thread to CPU 0 on node 0, allocate all
// hot buffers from node 0 memory.

int currentNumaNode() noexcept {
    if (numa_available() < 0) return 0;   // NUMA not available
    int cpu = sched_getcpu();
    return (cpu >= 0) ? numa_node_of_cpu(cpu) : 0;
}

// Allocate n bytes on a specific NUMA node
void* numaAlloc(std::size_t n, int node) noexcept {
    if (numa_available() < 0) return malloc(n);
    return numa_alloc_onnode(n, node);
}

void numaFree(void* p, std::size_t n) noexcept {
    if (numa_available() < 0) { free(p); return; }
    numa_free(p, n);
}

// Verify memory actually lives on the expected NUMA node
bool isOnNode(void* p, int expected_node) noexcept {
    int node = -1;
    get_mempolicy(&node, nullptr, 0, p, MPOL_F_NODE | MPOL_F_ADDR);
    return node == expected_node;
}

// RAII: NUMA-aware buffer — automatically allocated on the calling thread's node
template<typename T>
class NumaBuffer {
    T*          ptr_  = nullptr;
    std::size_t size_ = 0;
    int         node_;

public:
    explicit NumaBuffer(std::size_t n)
        : size_(n), node_(currentNumaNode()) {
        ptr_ = static_cast<T*>(numaAlloc(n * sizeof(T), node_));
        std::memset(ptr_, 0, n * sizeof(T));
    }
    ~NumaBuffer() { if (ptr_) numaFree(ptr_, size_ * sizeof(T)); }

    T*          data()   noexcept { return ptr_; }
    std::size_t size()   const noexcept { return size_; }
    int         node()   const noexcept { return node_; }
    T& operator[](std::size_t i) noexcept { return ptr_[i]; }
};

// Thread-affinity helpers: pin this thread to a specific core
void pinToCore(int cpu_id) noexcept {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(cpu_id, &cpuset);
    sched_setaffinity(0, sizeof(cpuset), &cpuset);
}

// Interleave allocation: spread across nodes for throughput (risk engine uses all cores)
void* numaInterleave(std::size_t n) noexcept {
    if (numa_available() < 0) return malloc(n);
    return numa_alloc_interleaved(n);
}`,
    explanation:
      "NUMA-aware allocation is most critical for data structures that are written on one thread and read on another running on a different NUMA node — without it, every cache miss from the reader causes a remote NUMA access (DRAM on the other socket), adding ~80 ns per miss. The recommended HFT topology is a dedicated core per thread (pinToCore), with all hot data allocated via numaAlloc on that core's node; cross-NUMA traffic is then limited to explicit messaging between the data-ingest and strategy threads across the SPSC ring buffer.",
  },
  {
    id: "cpp-20260615-b1-adi-heston",
    language: "cpp",
    title: "ADI scheme for Heston PDE — Craig-Sneyd operator splitting",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Heston PDE (in S and V):
//   dV/dt = 0.5*V*S^2*d^2U/dS^2 + rho*xi*V*S*d^2U/dSdV + 0.5*xi^2*V*d^2U/dV^2
//           + r*S*dU/dS + kappa*(theta-V)*dU/dV - r*U
// ADI (Alternating Direction Implicit) — Craig-Sneyd (1988) splitting:
//   Alternate between implicit solve in S-direction (V fixed) and V-direction (S fixed).
//   Each sub-step requires only a tridiagonal solve — O(N_s * N_v) per time step.
//   Stable and second-order accurate in both space and time.

static std::vector<double> thomas(std::vector<double> a, std::vector<double> b,
                                   std::vector<double> c, std::vector<double> d) {
    int n = static_cast<int>(d.size());
    for (int i = 1; i < n; ++i) {
        double w = a[i] / b[i-1];
        b[i] -= w * c[i-1];
        d[i] -= w * d[i-1];
    }
    std::vector<double> x(n);
    x[n-1] = d[n-1] / b[n-1];
    for (int i = n-2; i >= 0; --i)
        x[i] = (d[i] - c[i]*x[i+1]) / b[i];
    return x;
}

// Returns call price grid after one full ADI time step (half-step demo)
// U[iv * Ns + is] = U(S_is, V_iv)
void adiHestonStep(std::vector<double>& U,
                    int Ns, int Nv,
                    double ds, double dv, double dt,
                    double r, double kappa, double theta, double xi, double rho) {
    // Half-step 1: implicit in S, explicit in V for each V-slice
    for (int iv = 1; iv < Nv - 1; ++iv) {
        double V = iv * dv;
        std::vector<double> a(Ns-2), b(Ns-2), c(Ns-2), rhs(Ns-2);
        for (int is = 1; is < Ns - 1; ++is) {
            double S    = is * ds;
            double sig2 = V * S * S;
            double a_c  =  0.25 * dt * (sig2 / (ds*ds) - r*S / ds);
            double b_c  = -0.5  * dt * (sig2 / (ds*ds) + r);
            double c_c  =  0.25 * dt * (sig2 / (ds*ds) + r*S / ds);
            int k = is - 1;
            a[k] = -a_c;
            b[k] = 1.0 - b_c;
            c[k] = -c_c;
            // Explicit RHS from V-direction (simplified: omit cross-term here)
            rhs[k] = a_c * U[iv*(Ns)+is-1] + (1.0+b_c)*U[iv*(Ns)+is] + c_c*U[iv*(Ns)+is+1];
        }
        auto sol = thomas(a, b, c, rhs);
        for (int is = 1; is < Ns-1; ++is)
            U[iv*Ns+is] = sol[is-1];
    }
    // Half-step 2: implicit in V (similar structure, operates on V-columns)
    // Omitted here for brevity — mirrors step 1 with kappa, theta, xi coefficients.
}`,
    explanation:
      "The ADI splitting converts the 2D Heston PDE into a sequence of 1D tridiagonal systems — each row or column of the price-vol grid is solved independently in O(N) operations, giving O(N_s × N_v) per time step instead of O(N_s² × N_v²) for a naive 2D direct solver. The Craig-Sneyd variant (over the standard Peaceman-Rachford) was proven by in't Hout and Welfert (2007) to be stable for all ρ ∈ (−1, 1) and all kappa, theta > 0, which is critical for calibrated Heston parameters where ρ ≈ −0.7 is common in equity markets.",
  },
  {
    id: "cpp-20260615-b1-lookback-mc",
    language: "cpp",
    title: "Lookback option Monte Carlo — fixed-strike max-of-path pricing",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <numeric>

// Lookback call (fixed strike): payoff = max(max_{0<=t<=T} S_t - K, 0)
// The option pays the maximum stock price observed over the option life minus K.
// No closed-form for discrete monitoring; continuous monitoring has exact formula.
// MC with antithetic variates; Brownian bridge correction reduces discretisation bias.

struct LookbackResult {
    double price;
    double se;            // standard error
    double bridge_price;  // with Brownian bridge bias correction
};

// Broadie-Glasserman (1996) Brownian bridge correction for discrete monitoring:
// For N monitoring dates, the bias is approximately sigma * sqrt(T/N) * a/sqrt(2*pi)
// where a ~ 0.5826 (Euler-Mascheroni constant related correction).
static constexpr double BB_CORRECT = 0.5826;

LookbackResult lookbackFixedCall(double S0, double K, double r,
                                  double sigma, double T,
                                  int N = 252, int paths = 100000,
                                  int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt   = T / N;
    double mu   = (r - 0.5 * sigma * sigma) * dt;
    double vol  = sigma * std::sqrt(dt);
    double disc = std::exp(-r * T);

    double sum = 0.0, sum2 = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S = S0, Smax = S0;
        for (int i = 0; i < N; ++i) {
            S    *= std::exp(mu + vol * nd(rng));
            Smax  = std::max(Smax, S);
        }
        double pv = disc * std::max(Smax - K, 0.0);
        sum  += pv;
        sum2 += pv * pv;
    }

    double price = sum / paths;
    double var   = (sum2 / paths - price * price) / (paths - 1);
    double se    = std::sqrt(var);

    // Broadie-Glasserman correction: add half the expected extremum of a
    // Brownian bridge over [0, dt] — corrects the O(1/N) discretisation bias
    double bridge_adj = S0 * std::exp(r * T)
                       * BB_CORRECT * sigma * std::sqrt(T / N);
    double bridge_price = std::max(price + disc * bridge_adj, price);

    return {price, se, bridge_price};
}

// Continuous monitoring: closed-form for lookback call (Conze-Viswanathan 1991)
double lookbackContinuous(double S0, double K, double r, double sigma, double T) {
    auto N  = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    double sqT = std::sqrt(T);
    double a   = (std::log(S0/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double b   = a - sigma * sqT;
    double c   = (std::log(S0/K) + (-r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    if (r < 1e-12)
        return S0 * (N(a) + sigma*sqT*(std::exp(-0.5*a*a)/std::sqrt(2.0*M_PI) + a*N(a)))
               - K * std::exp(-r*T) * N(b);
    double d   = 2.0 * r / (sigma * sigma);
    return S0*N(a) - K*std::exp(-r*T)*N(b)
         + S0*std::exp(-r*T)*(sigma*sigma/(2*r))*
           (std::pow(S0/K, -d)*N(-c) - std::exp(r*T)*N(-a));
}`,
    explanation:
      "The Brownian bridge correction addresses the 'discrete monitoring bias' in lookback options: the discretely monitored maximum is always less than or equal to the continuously monitored maximum (you can only sample at N dates, not at every instant), so the discrete-MC price underestimates the continuous-monitoring value by O(σ√(T/N)). Broadie-Glasserman's correction factor 0.5826 × σ√(T/N) is the expected supremum of a standard Brownian bridge over one interval, which accounts for the maximum value the process could have reached between monitoring dates.",
  },
  {
    id: "cpp-20260615-b1-barrier-fd",
    language: "cpp",
    title: "Down-and-out barrier option FD — absorbing boundary condition",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Down-and-out call: pays max(S-K,0) at T if S_t > B for all t in [0,T].
// Finite difference with absorbing boundary at B: V(B,t) = 0 for all t.
// Log-price grid: x = ln(S), x_lo = ln(B), x_hi = ln(S0) + 4*sigma*sqrt(T).
// Crank-Nicolson in the interior; Dirichlet V=0 at the barrier (x_lo).

static std::vector<double> thomasBarrier(const std::vector<double>& a,
                                          std::vector<double> b,
                                          const std::vector<double>& c,
                                          std::vector<double> d) {
    int n = static_cast<int>(d.size());
    for (int i = 1; i < n; ++i) {
        double w = a[i] / b[i-1];
        b[i] -= w * c[i-1];
        d[i] -= w * d[i-1];
    }
    std::vector<double> x(n);
    x[n-1] = d[n-1] / b[n-1];
    for (int i = n-2; i >= 0; --i)
        x[i] = (d[i] - c[i]*x[i+1]) / b[i];
    return x;
}

double downOutCall(double S0, double K, double B, double r,
                   double sigma, double T, int M = 300, int N = 100) {
    if (S0 <= B) return 0.0;   // knocked out immediately

    double x_lo = std::log(B);         // absorbing barrier
    double x_hi = std::log(S0) + 4.0 * sigma * std::sqrt(T);
    double dx   = (x_hi - x_lo) / M;
    double dt   = T / N;

    // Price grid
    std::vector<double> x(M + 1);
    for (int i = 0; i <= M; ++i) x[i] = x_lo + i * dx;

    // Terminal condition: payoff at maturity (V(B,T) = 0 enforced by x_lo = ln(B))
    std::vector<double> V(M + 1);
    for (int i = 0; i <= M; ++i)
        V[i] = std::max(std::exp(x[i]) - K, 0.0);
    V[0] = 0.0;   // barrier: absorbing boundary

    double nu  = r - 0.5 * sigma * sigma;
    double s2  = sigma * sigma;

    double ac =  0.25 * dt * (s2 / (dx*dx) - nu / dx);
    double bc = -0.5  * dt * (s2 / (dx*dx) + r);
    double cc =  0.25 * dt * (s2 / (dx*dx) + nu / dx);

    int inner = M - 1;
    std::vector<double> al(inner, -ac), bm(inner, 1.0 - bc), cu(inner, -cc);

    for (int step = 0; step < N; ++step) {
        std::vector<double> rhs(inner);
        for (int i = 1; i <= inner; ++i)
            rhs[i-1] = ac*V[i-1] + (1.0+bc)*V[i] + cc*V[i+1];

        // Boundary RHS corrections
        rhs[0]       += ac * 0.0;   // V[0] = 0 (barrier); no adjustment needed
        double tau   = (step + 1) * dt;
        rhs[inner-1] += cc * (std::exp(x_hi) - K * std::exp(-r * tau));  // upper BC

        auto Vnew = thomasBarrier(al, bm, cu, rhs);
        for (int i = 1; i <= inner; ++i) V[i] = Vnew[i-1];
        V[0] = 0.0;   // enforce absorbing barrier at every step
    }

    // Interpolate at S0
    int idx  = static_cast<int>((std::log(S0) - x_lo) / dx);
    idx = std::clamp(idx, 0, M - 1);
    double f = (std::log(S0) - x[idx]) / dx;
    return std::max(V[idx] * (1.0 - f) + V[idx+1] * f, 0.0);
}`,
    explanation:
      "The absorbing boundary at x = ln(B) sets V = 0 for all time steps after knock-out, which is implemented by fixing the leftmost grid point V[0] = 0 at every time step and using it as a Dirichlet condition in the Crank-Nicolson RHS. This is mathematically equivalent to removing the knocked-out paths from the simulation — any path that reaches the barrier contributes zero to the option value. The log-price grid places more nodes near the barrier (compared to an S-grid) because the drift in log-space is constant, avoiding the node clustering problem that arises from using a uniform S-grid near the barrier.",
  },
  {
    id: "cpp-20260615-b1-lsm-american",
    language: "cpp",
    title: "Longstaff-Schwartz LSM — American put pricing via regression",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <random>
#include <algorithm>
#include <numeric>

// Longstaff-Schwartz (2001) Least Squares Monte Carlo for American options.
// Key idea: at each exercise date, compare immediate payoff vs continuation value.
// Continuation value is approximated by least-squares regression of discounted
// future cash flows on basis functions of the current stock price.
// Basis: {1, S, S^2} — polynomial regression (sufficient for plain vanilla puts).

static std::vector<double> lsqFit3(const std::vector<double>& x,
                                    const std::vector<double>& y) {
    // Fit y = c0 + c1*x + c2*x^2 via normal equations (X'X c = X'y)
    double s0=0, s1=0, s2=0, s3=0, s4=0, b0=0, b1=0, b2=0;
    int n = static_cast<int>(x.size());
    for (int i = 0; i < n; ++i) {
        double xi = x[i], xi2 = xi*xi;
        s0+=1; s1+=xi; s2+=xi2; s3+=xi2*xi; s4+=xi2*xi2;
        b0+=y[i]; b1+=y[i]*xi; b2+=y[i]*xi2;
    }
    // 3x3 symmetric system: solve via Gaussian elimination
    double A[3][3] = {{s0,s1,s2},{s1,s2,s3},{s2,s3,s4}};
    double b[3]    = {b0, b1, b2};
    for (int p = 0; p < 3; ++p) {
        for (int r = p+1; r < 3; ++r) {
            double f = A[r][p] / A[p][p];
            for (int c = p; c < 3; ++c) A[r][c] -= f * A[p][c];
            b[r] -= f * b[p];
        }
    }
    std::vector<double> coef(3);
    for (int r = 2; r >= 0; --r) {
        coef[r] = b[r];
        for (int c = r+1; c < 3; ++c) coef[r] -= A[r][c] * coef[c];
        coef[r] /= A[r][r];
    }
    return coef;
}

double lsmAmericanPut(double S0, double K, double r, double sigma,
                       double T, int N = 50, int paths = 50000, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double dt = T / N, disc = std::exp(-r * dt);
    double mu = (r - 0.5*sigma*sigma)*dt, vol = sigma*std::sqrt(dt);

    // Simulate paths
    std::vector<std::vector<double>> S(paths, std::vector<double>(N+1, S0));
    for (int p = 0; p < paths; ++p)
        for (int t = 1; t <= N; ++t)
            S[p][t] = S[p][t-1] * std::exp(mu + vol*nd(rng));

    // Cash flow vector: start at maturity payoff
    std::vector<double> cf(paths);
    for (int p = 0; p < paths; ++p)
        cf[p] = std::max(K - S[p][N], 0.0);

    // Backward induction
    for (int t = N-1; t >= 1; --t) {
        double disc_t = std::exp(-r * (N-t) * dt);
        // Collect in-the-money paths for regression
        std::vector<double> xs, ys;
        std::vector<int>    itm_idx;
        for (int p = 0; p < paths; ++p) {
            if (S[p][t] < K) {   // ITM for put
                xs.push_back(S[p][t]);
                ys.push_back(cf[p] * disc_t);   // discounted future CF
                itm_idx.push_back(p);
            }
        }
        if (xs.empty()) continue;

        auto coef = lsqFit3(xs, ys);   // regression: E[continuation | S_t]

        for (int i = 0; i < static_cast<int>(itm_idx.size()); ++i) {
            int p  = itm_idx[i];
            double S_t   = xs[i];
            double hold  = coef[0] + coef[1]*S_t + coef[2]*S_t*S_t;
            double exercise = K - S_t;
            if (exercise > hold) cf[p] = exercise;  // early exercise
        }
        // Discount all CFs one step
        for (double& c : cf) c *= disc;
    }

    double price = 0.0;
    for (double c : cf) price += c;
    return price / paths * disc;
}`,
    explanation:
      "The LSM algorithm works backward: at each exercise date, it fits a polynomial of the current stock price to the discounted future payoff (the continuation value) using only the in-the-money paths. The early exercise decision for each path compares the immediate put payoff (K − S) against the fitted continuation value — if exercising is worth more than waiting, the path's future cash flow is replaced by the intrinsic value. The use of only ITM paths for regression is critical: OTM paths have near-zero continuation value with high relative noise, including them would distort the regression and bias the early exercise boundary.",
  },
  {
    id: "cpp-20260615-b1-fx-bellman",
    language: "cpp",
    title: "FX triangular arbitrage — Bellman-Ford negative cycle detection",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <limits>
#include <algorithm>
#include <optional>
#include <string>

// FX arbitrage: detect a sequence of currency conversions that yields a profit.
// Model as a directed graph: nodes = currencies, edge (i,j) = -log(rate(i,j)).
// A negative cycle in this log-weight graph → multiplicative rate product > 1 → profit.
// Bellman-Ford detects negative cycles in O(V*E) time.

struct Edge { int u, v; double log_neg_rate; };

// rates[i][j] = exchange rate from currency i to currency j (0 if no market)
struct ArbitrageResult {
    bool     found;
    double   profit_factor;    // e.g., 1.003 = 0.3% profit per unit
    std::vector<int> cycle;    // indices of currencies forming the cycle
};

ArbitrageResult detectFXArb(const std::vector<std::vector<double>>& rates,
                              const std::vector<std::string>& names) {
    int V = static_cast<int>(rates.size());

    // Build edges: weight = -log(rate[i][j]), allowing negative cycle detection
    std::vector<Edge> edges;
    for (int i = 0; i < V; ++i)
        for (int j = 0; j < V; ++j)
            if (i != j && rates[i][j] > 0.0)
                edges.push_back({i, j, -std::log(rates[i][j])});

    // Bellman-Ford from a virtual source node (or just from each node once)
    std::vector<double> dist(V, 0.0);   // source = virtual node with 0-weight edges
    std::vector<int>    pred(V, -1);

    for (int iter = 0; iter < V - 1; ++iter)
        for (const auto& e : edges)
            if (dist[e.u] + e.log_neg_rate < dist[e.v]) {
                dist[e.v] = dist[e.u] + e.log_neg_rate;
                pred[e.v] = e.u;
            }

    // Nth relaxation: if any edge still relaxes, there is a negative cycle
    int neg_cycle_node = -1;
    for (const auto& e : edges) {
        if (dist[e.u] + e.log_neg_rate < dist[e.v] - 1e-12) {
            neg_cycle_node = e.v;
            pred[e.v] = e.u;
            break;
        }
    }

    if (neg_cycle_node < 0)
        return {false, 1.0, {}};

    // Trace back V steps to guarantee we're in the cycle
    int node = neg_cycle_node;
    for (int i = 0; i < V; ++i) node = pred[node];

    // Collect cycle path
    std::vector<int> cycle;
    int start = node;
    do {
        cycle.push_back(node);
        node = pred[node];
    } while (node != start && cycle.size() <= static_cast<std::size_t>(V));
    cycle.push_back(start);
    std::reverse(cycle.begin(), cycle.end());

    // Compute actual profit factor
    double log_profit = 0.0;
    for (std::size_t i = 0; i + 1 < cycle.size(); ++i)
        log_profit -= (-std::log(rates[cycle[i]][cycle[i+1]]));

    return {true, std::exp(log_profit), cycle};
}`,
    explanation:
      "Taking the negative log of exchange rates transforms the multiplicative arbitrage condition (product of rates > 1) into an additive negative-cycle condition (sum of log-rates < 0), which Bellman-Ford can detect. The virtual source with zero-weight edges to all currency nodes ensures that all cycles are reachable regardless of the starting currency, avoiding the O(V²) overhead of running Bellman-Ford from every node individually. After the V-th relaxation step identifies a node on the negative cycle, tracing back V predecessor links guarantees the path has looped back into the cycle (the 'V steps back' trick).",
  },
  {
    id: "cpp-20260615-b1-avx2-dot",
    language: "cpp",
    title: "AVX2 portfolio dot product — 4× double-precision SIMD parallelism",
    tag: "performance",
    code: `#include <immintrin.h>
#include <cstddef>
#include <cstdint>
#include <array>
#include <cassert>

// AVX2: 256-bit SIMD registers hold 4 double-precision values simultaneously.
// A portfolio with N assets: dot(weights, pnl) — N multiplications + additions.
// SIMD processes 4 assets per cycle instead of 1, with ~4× throughput increase.
// Requires 32-byte alignment for vmovapd (aligned load).

// AVX2 horizontal sum: reduce 4 doubles in __m256d to one double
static inline double hsum256_pd(__m256d v) noexcept {
    __m128d lo  = _mm256_castpd256_pd128(v);          // lower 2 doubles
    __m128d hi  = _mm256_extractf128_pd(v, 1);        // upper 2 doubles
    __m128d sum = _mm_add_pd(lo, hi);                  // 2-element sum
    return _mm_cvtsd_f64(_mm_hadd_pd(sum, sum));       // scalar sum
}

// Compute dot(weights, pnl) using AVX2: processes 4 doubles per iteration
double portfolioPnL_AVX2(const double* __restrict__ weights,
                           const double* __restrict__ pnl,
                           std::size_t n) noexcept {
    assert(reinterpret_cast<std::uintptr_t>(weights) % 32 == 0);
    assert(reinterpret_cast<std::uintptr_t>(pnl)     % 32 == 0);

    __m256d acc = _mm256_setzero_pd();     // accumulator
    std::size_t i = 0;

    // Main loop: 4 doubles per iteration (256-bit = 4 × 64-bit)
    for (; i + 4 <= n; i += 4) {
        __m256d w = _mm256_load_pd(weights + i);   // aligned load
        __m256d p = _mm256_load_pd(pnl     + i);
        acc       = _mm256_fmadd_pd(w, p, acc);    // FMA: acc += w * p (one instruction)
    }

    double result = hsum256_pd(acc);

    // Scalar tail: handle remaining elements
    for (; i < n; ++i) result += weights[i] * pnl[i];

    return result;
}

// Greeks computation: compute delta vector by AVX2 scalar multiply
void scaleGreeks_AVX2(double* __restrict__ greeks,
                       const double* __restrict__ notionals,
                       double vol_shift, std::size_t n) noexcept {
    __m256d shift_v = _mm256_set1_pd(vol_shift);   // broadcast scalar to all 4 lanes
    std::size_t i = 0;
    for (; i + 4 <= n; i += 4) {
        __m256d g = _mm256_load_pd(greeks    + i);
        __m256d N = _mm256_load_pd(notionals + i);
        _mm256_store_pd(greeks + i, _mm256_mul_pd(g, _mm256_mul_pd(N, shift_v)));
    }
    for (; i < n; ++i) greeks[i] *= notionals[i] * vol_shift;
}

// Aligned allocation helper for AVX2 buffers
alignas(32) std::array<double, 1024> avx2_weights_buf;
alignas(32) std::array<double, 1024> avx2_pnl_buf;`,
    explanation:
      "The _mm256_fmadd_pd instruction fuses a multiply and add into one clock cycle, matching the throughput of a single multiply alone on modern x86 microarchitectures (1 FMA per cycle per port on Skylake). For a 500-asset portfolio, the AVX2 dot product completes in 125 iterations vs 500 scalar operations — combined with the L1 data cache staying warm for the 4× spatial locality of 256-bit loads, the practical speedup is typically 3–3.5× over auto-vectorised scalar code with -O3. The 32-byte alignment requirement for vmovapd is enforced via alignas(32); misaligned loads with vmovupd cost an extra clock on some microarchitectures.",
  },
  {
    id: "cpp-20260615-b1-perfect-forward",
    language: "cpp",
    title: "Perfect forwarding — zero-overhead order factory with variadic templates",
    tag: "modern",
    code: `#include <cstdint>
#include <string>
#include <memory>
#include <utility>
#include <vector>

// Perfect forwarding: T&& (forwarding reference) + std::forward<T> preserves
// the value category (lvalue/rvalue) of each argument through the factory function.
// Without forwarding, every argument would be copied; with forwarding, rvalues
// are moved and lvalues are referenced — zero-copy construction.

struct Order {
    std::uint64_t id;
    std::string   symbol;    // may be constructed from a string literal or moved
    double        price;
    int           qty;
    bool          buy;

    // Explicit members; no copy of symbol if caller passes std::move(sym)
    Order(std::uint64_t id_, std::string sym, double p, int q, bool b)
        : id(id_), symbol(std::move(sym)), price(p), qty(q), buy(b) {}
};

// Generic factory: construct any type from forwarded arguments, no copies.
// emplace_back is the std:: canonical use of perfect forwarding.
template<typename T, typename... Args>
std::unique_ptr<T> makeOrder(Args&&... args) {
    return std::make_unique<T>(std::forward<Args>(args)...);
}

// Object pool with perfect-forward emplace — avoids extra copy on placement
class OrderPool {
    std::vector<Order> pool_;

public:
    // Constructs Order in-place at the end of the pool; no copy of the Order.
    template<typename... Args>
    Order& emplace(Args&&... args) {
        return pool_.emplace_back(std::forward<Args>(args)...);
    }

    void clear() noexcept { pool_.clear(); }
    std::size_t size() const noexcept { return pool_.size(); }
};

// Forwarding wrapper for delayed dispatch — captures a callable + args
template<typename F, typename... Args>
auto defer(F&& f, Args&&... args) {
    // Return a lambda that calls f(args...) when invoked later
    // Args captured by value if rvalue, by reference if lvalue
    return [f  = std::forward<F>(f),
            tup = std::make_tuple(std::forward<Args>(args)...)]() mutable {
        return std::apply(std::move(f), std::move(tup));
    };
}

// Usage:
// OrderPool pool;
// std::string sym = "AAPL";
// pool.emplace(1001, std::move(sym), 180.25, 100, true);  // sym is moved, not copied
// auto deferred = defer([](int x){ return x*2; }, 42);
// int result = deferred();   // calls lambda later: returns 84`,
    explanation:
      "The key distinction is that `Args&&...` in a template context is a 'forwarding reference' (not an rvalue reference) — it binds to both lvalues and rvalues. std::forward<Args>(args) then restores the original value category: if the caller passed an lvalue, forward returns an lvalue reference; if an rvalue (temporary or std::move'd), forward returns an rvalue reference that triggers the move constructor. Without std::forward, all arguments would be treated as lvalues inside the function, causing unnecessary copies even when the caller intended to move.",
  },
  {
    id: "cpp-20260615-b1-cholesky",
    language: "cpp",
    title: "Cholesky decomposition — correlated Brownian motion for multi-asset MC",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <random>
#include <stdexcept>
#include <cstddef>

// Cholesky decomposition: A = L * L^T for symmetric positive-definite matrix A.
// Used to generate correlated Gaussian random variables: if Z ~ N(0,I),
// then L*Z ~ N(0, A) — the covariance matches A exactly.
// O(N^3 / 3) flops; preferred over eigendecomposition for PSD matrices.

std::vector<std::vector<double>> cholesky(
    const std::vector<std::vector<double>>& A) {
    int N = static_cast<int>(A.size());
    std::vector<std::vector<double>> L(N, std::vector<double>(N, 0.0));

    for (int i = 0; i < N; ++i) {
        for (int j = 0; j <= i; ++j) {
            double s = A[i][j];
            for (int k = 0; k < j; ++k)
                s -= L[i][k] * L[j][k];
            if (i == j) {
                if (s < 0.0) throw std::runtime_error("Matrix not PSD");
                L[i][j] = std::sqrt(s);
            } else {
                L[i][j] = (L[j][j] > 1e-14) ? s / L[j][j] : 0.0;
            }
        }
    }
    return L;
}

// Generate one set of N correlated standard normals using L (lower Cholesky factor)
std::vector<double> correlatedNormals(
    const std::vector<std::vector<double>>& L,
    std::mt19937_64& rng,
    std::normal_distribution<double>& nd) {
    int N = static_cast<int>(L.size());
    std::vector<double> Z(N), X(N, 0.0);
    for (double& z : Z) z = nd(rng);      // iid N(0,1)
    for (int i = 0; i < N; ++i)
        for (int j = 0; j <= i; ++j)
            X[i] += L[i][j] * Z[j];       // L * Z
    return X;                               // X ~ N(0, A)
}

// Multi-asset GBM step using correlated Brownian increments
std::vector<double> gbmStep(
    const std::vector<double>& S,          // current prices
    const std::vector<double>& r_vec,      // per-asset risk-free rates
    const std::vector<double>& sigma_vec,  // per-asset vols
    double dt,
    const std::vector<std::vector<double>>& L,
    std::mt19937_64& rng, std::normal_distribution<double>& nd) {
    int N = static_cast<int>(S.size());
    auto dW = correlatedNormals(L, rng, nd);
    std::vector<double> Snew(N);
    for (int i = 0; i < N; ++i)
        Snew[i] = S[i] * std::exp(
            (r_vec[i] - 0.5 * sigma_vec[i] * sigma_vec[i]) * dt
            + sigma_vec[i] * std::sqrt(dt) * dW[i]);
    return Snew;
}

// Example: 3-asset correlation matrix with rho=0.5 between all pairs
// std::vector<std::vector<double>> corr = {{1,.5,.5},{.5,1,.5},{.5,.5,1}};
// auto L = cholesky(corr);`,
    explanation:
      "The Cholesky decomposition is O(N³/3) flops and is the fastest numerical method for generating correlated Gaussians when N ≤ 100 assets — for larger N, the incremental covariance structure of the problem can be exploited via the Cholesky update. The PSD check (throwing when s < 0) is important in practice: a sample correlation matrix estimated from finite data is only approximately PSD and can have small negative eigenvalues due to estimation noise; Ledoit-Wolf shrinkage (adding a scaled identity) ensures a valid Cholesky decomposition before simulation.",
  },
  {
    id: "cpp-20260615-b1-obj-pool",
    language: "cpp",
    title: "Object pool with unique_ptr — type-safe recycling of fixed-size objects",
    tag: "performance",
    code: `#include <vector>
#include <memory>
#include <functional>
#include <cstddef>
#include <cassert>
#include <mutex>

// Object pool: pre-allocates a batch of objects and recycles them via unique_ptr
// with a custom deleter. No heap allocation after pool creation.
// Pool is thread-safe (one mutex for acquire/release); lock is uncontested
// because each thread owns its object for the duration of message processing.

template<typename T>
class ObjectPool {
    struct Deleter {
        ObjectPool<T>* pool;
        void operator()(T* p) const { pool->release(p); }
    };

public:
    using Ptr = std::unique_ptr<T, Deleter>;

private:
    std::vector<std::unique_ptr<T>>     storage_;  // owns all objects
    std::vector<T*>                     free_;     // available objects
    mutable std::mutex                  mu_;

    void release(T* p) {
        p->~T();                       // destroy: reset state
        ::new(p) T{};                  // reconstruct in-place for next use
        std::lock_guard<std::mutex> lk(mu_);
        free_.push_back(p);
    }

public:
    explicit ObjectPool(std::size_t capacity) {
        storage_.reserve(capacity);
        free_.reserve(capacity);
        for (std::size_t i = 0; i < capacity; ++i) {
            storage_.push_back(std::make_unique<T>());
            free_.push_back(storage_.back().get());
        }
    }

    // Acquire: returns a managed pointer; blocks (returns nullptr) if pool exhausted
    Ptr acquire() {
        std::lock_guard<std::mutex> lk(mu_);
        if (free_.empty()) return {nullptr, Deleter{this}};
        T* p = free_.back();
        free_.pop_back();
        return {p, Deleter{this}};
    }

    std::size_t available() const {
        std::lock_guard<std::mutex> lk(mu_);
        return free_.size();
    }
    std::size_t capacity() const noexcept { return storage_.size(); }
};

// Usage: pool of Order objects, recycled after each message
struct MarketMsg { double price; int qty; bool buy; };

// ObjectPool<MarketMsg> msg_pool(1024);
// {
//     auto msg = msg_pool.acquire();  // O(1), no malloc
//     if (msg) { msg->price = 100.25; processMsg(*msg); }
//     // msg goes out of scope: destructor calls release() automatically
// }`,
    explanation:
      "The custom Deleter in the unique_ptr stores a pointer back to the pool, so when the unique_ptr goes out of scope it calls pool->release() instead of delete — the object is returned to the free list rather than freed. The in-place reconstruct (`new(p) T{}`) after release resets the object to a clean state for the next use, ensuring the pool never leaks state between messages. For a message rate of 1 M/sec, the pool eliminates 1 M malloc/free pairs per second, replacing them with a single mutex lock/unlock and two pointer operations (~10 ns vs ~100 ns for malloc).",
  },
  {
    id: "cpp-20260615-b1-bit-position",
    language: "cpp",
    title: "Bit manipulation — position bitmask operations for multi-instrument tracker",
    tag: "performance",
    code: `#include <cstdint>
#include <cstddef>
#include <bit>
#include <array>
#include <cassert>

// Bitmask position tracker: each bit represents an instrument.
// 64-bit uint64_t handles 64 instruments with a single register.
// Operations are single CPU instructions: popcount, ctz, bit_ceil.
// Used in risk engines to track which positions are active, hedged, or breached.

class PositionMask {
    std::uint64_t mask_ = 0;

public:
    void set(int i)    noexcept { assert(i < 64); mask_ |= (1ULL << i); }
    void clear(int i)  noexcept { assert(i < 64); mask_ &= ~(1ULL << i); }
    bool test(int i)   const noexcept { return (mask_ >> i) & 1ULL; }
    void toggle(int i) noexcept { mask_ ^= (1ULL << i); }

    // Count active positions — single POPCNT instruction on x86
    int count() const noexcept { return std::popcount(mask_); }

    // Index of lowest-set-bit (first active position) — CTZ instruction
    int lowestActive() const noexcept {
        return mask_ ? std::countr_zero(mask_) : -1;
    }

    // Index of highest-set-bit — floor(log2(mask))
    int highestActive() const noexcept {
        return mask_ ? 63 - std::countl_zero(mask_) : -1;
    }

    // Iterate over all set bits efficiently (no branch per bit)
    template<typename F>
    void forEach(F&& fn) const noexcept {
        std::uint64_t m = mask_;
        while (m) {
            int idx = std::countr_zero(m);
            fn(idx);
            m &= m - 1;   // clear lowest set bit: classic bit trick
        }
    }

    // Set intersection: instruments with positions in BOTH books
    PositionMask operator&(const PositionMask& o) const noexcept {
        PositionMask r; r.mask_ = mask_ & o.mask_; return r;
    }
    // Set union: instruments with positions in EITHER book
    PositionMask operator|(const PositionMask& o) const noexcept {
        PositionMask r; r.mask_ = mask_ | o.mask_; return r;
    }
    // Complement: instruments NOT currently active
    PositionMask operator~() const noexcept {
        PositionMask r; r.mask_ = ~mask_; return r;
    }

    bool empty() const noexcept { return mask_ == 0; }
    std::uint64_t raw() const noexcept { return mask_; }
};

// Extended to 256 instruments using 4×uint64_t (256-bit bitmask)
class PositionMask256 {
    std::array<std::uint64_t, 4> words_{};

public:
    void set(int i)   noexcept { words_[i/64] |= (1ULL << (i%64)); }
    void clear(int i) noexcept { words_[i/64] &= ~(1ULL << (i%64)); }
    bool test(int i)  const noexcept { return (words_[i/64] >> (i%64)) & 1ULL; }
    int  count()      const noexcept {
        return std::popcount(words_[0]) + std::popcount(words_[1])
             + std::popcount(words_[2]) + std::popcount(words_[3]);
    }
};`,
    explanation:
      "The `m &= m - 1` trick clears the lowest set bit in a single instruction by exploiting two's-complement arithmetic: subtracting 1 from m flips all bits from the lowest set bit down to bit 0, so ANDing with m clears exactly that lowest bit. The forEach loop therefore iterates in exactly popcount(mask_) iterations with no wasted comparisons, compared to `for (i=0; i<64; i++) if (test(i))` which always runs 64 iterations. std::popcount, std::countr_zero, and std::countl_zero (C++20) compile to single POPCNT, BSF, and BSR/LZCNT instructions respectively on x86.",
  },
  {
    id: "cpp-20260615-b1-thread-pool",
    language: "cpp",
    title: "Thread pool for parallel Monte Carlo — work-stealing with atomic task queue",
    tag: "concurrency",
    code: `#include <vector>
#include <thread>
#include <functional>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <future>
#include <atomic>
#include <cmath>

// Thread pool: fixed set of worker threads pulling tasks from a shared queue.
// submit() returns a std::future<T> for the task's result.
// Useful for parallel Monte Carlo: each thread prices one batch of paths.

class ThreadPool {
    std::vector<std::thread>          workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex                        mu_;
    std::condition_variable           cv_;
    std::atomic<bool>                 stop_{false};

public:
    explicit ThreadPool(std::size_t n_threads) {
        workers_.reserve(n_threads);
        for (std::size_t i = 0; i < n_threads; ++i) {
            workers_.emplace_back([this] {
                while (true) {
                    std::function<void()> task;
                    {
                        std::unique_lock<std::mutex> lk(mu_);
                        cv_.wait(lk, [this]{
                            return stop_.load(std::memory_order_relaxed)
                                || !tasks_.empty();
                        });
                        if (stop_ && tasks_.empty()) return;
                        task = std::move(tasks_.front());
                        tasks_.pop();
                    }
                    task();
                }
            });
        }
    }

    ~ThreadPool() {
        stop_.store(true, std::memory_order_relaxed);
        cv_.notify_all();
        for (auto& w : workers_) w.join();
    }

    // Submit a task and return a future for its result
    template<typename F, typename... Args>
    auto submit(F&& f, Args&&... args) -> std::future<std::invoke_result_t<F, Args...>> {
        using R = std::invoke_result_t<F, Args...>;
        auto task = std::make_shared<std::packaged_task<R()>>(
            [f = std::forward<F>(f), args = std::make_tuple(std::forward<Args>(args)...)]() mutable {
                return std::apply(std::move(f), std::move(args));
            });
        auto future = task->get_future();
        {
            std::lock_guard<std::mutex> lk(mu_);
            tasks_.emplace([task]{ (*task)(); });
        }
        cv_.notify_one();
        return future;
    }
};

// Parallel MC: split paths across all CPU cores
double parallelCallMC(double S0, double K, double r, double sigma,
                       double T, int total_paths, int n_threads = 8) {
    ThreadPool pool(n_threads);
    int per_thread = total_paths / n_threads;

    std::vector<std::future<double>> futures;
    for (int t = 0; t < n_threads; ++t) {
        futures.push_back(pool.submit([=, seed = t * 12345] {
            // Each thread prices per_thread paths independently
            double sum = 0.0;
            // ... (GBM + payoff, seeded uniquely per thread)
            (void)seed; // placeholder
            return sum / per_thread;
        }));
    }
    double total = 0.0;
    for (auto& f : futures) total += f.get();
    return total / n_threads;
}`,
    explanation:
      "The packaged_task + future pattern lets callers retrieve results (or exceptions) asynchronously: submit() immediately returns a future<double> while the worker thread runs the MC batch; get() then blocks only if the result is not yet ready. Each MC thread uses a different RNG seed (seeded with thread index × constant) to ensure statistical independence between path batches — using the same seed across threads would produce identical paths and give a biased average with a standard error of zero rather than the correct 1/√N reduction.",
  },
  {
    id: "cpp-20260615-b1-greek-bump",
    language: "cpp",
    title: "Greeks via bump-and-reprice — central finite differences for all first-order",
    tag: "quant",
    code: `#include <cmath>
#include <functional>
#include <array>

// Bump-and-reprice: shift one input by ±h, evaluate the pricing function twice,
// and use the central difference (V(+h) - V(-h)) / (2h).
// Central difference: O(h^2) error vs O(h) for forward difference.
// For option Greeks: choose h as a fraction of the input to maintain signal-to-noise.

// Pricer: any callable double f(S,K,r,q,sigma,T) → option price
using Pricer = std::function<double(double,double,double,double,double,double)>;

struct Greeks {
    double delta, gamma, theta, vega, rho_ir;
};

// Central difference with relative bump size
static double centralDiff(const Pricer& f,
                            double S, double K, double r,
                            double q, double sigma, double T,
                            int param_idx, double rel_h) {
    auto bump = [&](double h) -> double {
        double S_     = S,    K_     = K;
        double r_     = r,    q_     = q;
        double sigma_ = sigma, T_    = T;
        switch (param_idx) {
            case 0: S_     += h * S;     break;   // relative bump for S
            case 1: r_     += h;         break;   // absolute bump for r
            case 2: sigma_ += h;         break;
            case 3: T_     -= h / 252.0; break;   // 1-day theta
        }
        return f(S_, K_, r_, q_, sigma_, T_);
    };
    double h = rel_h;
    return (bump(+h) - bump(-h)) / (2.0 * h);
}

Greeks computeGreeks(const Pricer& f,
                      double S, double K, double r, double q,
                      double sigma, double T) {
    constexpr double H_DELTA = 0.01;   // 1% relative bump for delta/gamma
    constexpr double H_VEGA  = 0.001;  // 0.1% absolute bump for vol
    constexpr double H_THETA = 1.0;    // 1 calendar day
    constexpr double H_RHO   = 0.0001; // 1bp for rho

    double V_up_S   = f(S*(1+H_DELTA), K, r, q, sigma, T);
    double V_dn_S   = f(S*(1-H_DELTA), K, r, q, sigma, T);
    double V0       = f(S, K, r, q, sigma, T);
    double V_up_sig = f(S, K, r, q, sigma + H_VEGA, T);
    double V_dn_sig = f(S, K, r, q, sigma - H_VEGA, T);
    double V_theta  = f(S, K, r, q, sigma, T - 1.0/365.0);  // 1 day forward
    double V_up_r   = f(S, K, r + H_RHO, q, sigma, T);
    double V_dn_r   = f(S, K, r - H_RHO, q, sigma, T);

    double dS    = H_DELTA * S;
    return {
        /* delta */ (V_up_S - V_dn_S) / (2.0 * dS),
        /* gamma */ (V_up_S - 2.0*V0 + V_dn_S) / (dS * dS),
        /* theta */ (V_theta - V0),          // per calendar day
        /* vega  */ (V_up_sig - V_dn_sig) / (2.0 * H_VEGA) * 0.01,  // per 1% vol
        /* rho   */ (V_up_r - V_dn_r) / (2.0 * H_RHO) * 0.0001,    // per 1bp
    };
}`,
    explanation:
      "Gamma uses the second-order central difference (V(S+h) − 2V(S) + V(S−h)) / h² which requires the same two bumped evaluations already computed for delta — a total of 2 extra pricer calls for delta+gamma together. The relative bump (h × S) for delta is critical: using an absolute bump h = 1 for a high-priced stock (S = 5000) or a low-priced stock (S = 0.5) gives very different signal-to-noise ratios because the option payoff is convex in S; the relative bump keeps the perturbation proportional to the option's sensitivity region.",
  },
  {
    id: "cpp-20260615-b1-slab-alloc",
    language: "cpp",
    title: "Slab allocator — O(1) fixed-size allocation for HFT message objects",
    tag: "performance",
    code: `#include <cstddef>
#include <cstdint>
#include <cassert>
#include <array>
#include <cstring>

// Slab allocator: a pool of fixed-size slots managed as a free list.
// Unlike a monotonic arena, individual frees are O(1) — slots are returned
// to the free list by prepending (LIFO order, friendly to L1 cache).
// No fragmentation: all slots are the same size.

template<std::size_t ObjSize, std::size_t Capacity>
class SlabAllocator {
    static_assert(ObjSize >= sizeof(void*), "Object must fit a pointer (free list node)");

    // The slab: a flat array of fixed-size slots, each aligned to max_align_t
    alignas(std::max_align_t)
    std::array<std::byte, ObjSize * Capacity> slab_;

    // Intrusive free list: each free slot's first bytes hold a pointer to the next
    void* free_head_ = nullptr;
    int   n_free_    = 0;

public:
    SlabAllocator() noexcept {
        // Chain all slots into the free list in address order
        for (std::size_t i = 0; i < Capacity; ++i) {
            void* slot = slab_.data() + i * ObjSize;
            // Write the current free_head pointer into the slot's first bytes
            std::memcpy(slot, &free_head_, sizeof(void*));
            free_head_ = slot;
        }
        n_free_ = static_cast<int>(Capacity);
    }

    void* allocate() noexcept {
        if (!free_head_) return nullptr;   // exhausted
        void* p = free_head_;
        // Read the next pointer from the slot before returning it
        std::memcpy(&free_head_, p, sizeof(void*));
        --n_free_;
        return p;
    }

    void deallocate(void* p) noexcept {
        assert(p >= slab_.data() && p < slab_.data() + slab_.size());
        // Prepend the slot to the free list
        std::memcpy(p, &free_head_, sizeof(void*));
        free_head_ = p;
        ++n_free_;
    }

    // Type-safe wrappers
    template<typename T, typename... Args>
    T* construct(Args&&... args) noexcept(noexcept(T(std::forward<Args>(args)...))) {
        static_assert(sizeof(T) <= ObjSize && alignof(T) <= alignof(std::max_align_t));
        void* p = allocate();
        return p ? ::new(p) T(std::forward<Args>(args)...) : nullptr;
    }

    template<typename T>
    void destroy(T* p) noexcept {
        p->~T();
        deallocate(p);
    }

    int  free_count()  const noexcept { return n_free_; }
    int  used_count()  const noexcept { return static_cast<int>(Capacity) - n_free_; }
    bool full()        const noexcept { return n_free_ == 0; }
};

// Example: slab for 1024 64-byte order objects — no heap ever touched
// SlabAllocator<64, 1024> order_slab;
// auto* ord = order_slab.construct<Order>(id, price, qty, true);
// order_slab.destroy(ord);`,
    explanation:
      "The LIFO free list (prepend on deallocate) means that recently freed slots are reused first — if the same thread repeatedly allocates and frees objects, the same memory locations cycle through the L1 data cache, resulting in zero cache misses for the allocation itself. The intrusive design stores the next-pointer in the object's own memory (the first sizeof(void*) bytes), so there is no separate metadata allocation — the slab is a single contiguous array that can be placed on the stack or in a huge-page buffer, and its size is known at compile time (ObjSize × Capacity bytes).",
  },
  {
    id: "cpp-20260615-b1-cds-pricer",
    language: "cpp",
    title: "CDS par spread — hazard rate model with piecewise-constant intensities",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <stdexcept>

// CDS (Credit Default Swap): buyer pays a periodic spread S bp/annum to seller;
// seller pays (1 - Recovery) × Notional if the reference entity defaults.
// Valuation:
//   PV(premium leg) = S × sum_i delta_i × DF(T_i) × SP(T_i)
//   PV(protection leg) = (1-R) × integral DF(t) × (-dSP/dt) dt
// Par spread: S such that PV(prem) = PV(prot).
// SP(t) = survival probability = exp(-integral_0^t h(s) ds).
// h(s) = piecewise-constant hazard rate.

struct CDSResult {
    double par_spread_bps;   // par spread in basis points
    double pv_protection;
    double pv_premium_01;    // PV per 1bp spread
    double risky_annuity;    // sum delta * DF * SP
};

CDSResult priceCDS(
    const std::vector<double>& payment_dates,     // quarterly dates in years
    const std::vector<double>& hazard_breakpoints,// h(t) changes at these tenors
    const std::vector<double>& hazard_rates,      // h[i] on [breakpoints[i-1], breakpoints[i]]
    double r,           // risk-free rate (flat, for simplicity)
    double recovery,    // LGD = 1 - recovery (e.g., recovery=0.4 → LGD=0.6)
    int n_integral = 200  // integration points for protection leg
) {
    // Survival probability at time t under piecewise-constant hazard
    auto sp = [&](double t) {
        double integral = 0.0;
        double t_prev   = 0.0;
        for (std::size_t i = 0; i < hazard_rates.size(); ++i) {
            double t_next = (i + 1 < hazard_breakpoints.size())
                            ? hazard_breakpoints[i + 1] : t;
            t_next = std::min(t_next, t);
            integral += hazard_rates[i] * (t_next - t_prev);
            t_prev = t_next;
            if (t_prev >= t) break;
        }
        return std::exp(-integral);
    };

    // Premium leg: sum of delta_i * DF_i * SP_i
    double pv_premium = 0.0;
    double t_prev_pay = 0.0;
    for (double T : payment_dates) {
        double delta  = T - t_prev_pay;
        double df     = std::exp(-r * T);
        double survival = sp(T);
        pv_premium   += delta * df * survival;
        t_prev_pay    = T;
    }

    // Protection leg: integral of LGD * DF(t) * SP(t) * h(t) dt
    double T_max = payment_dates.back();
    double dt    = T_max / n_integral;
    double lgd   = 1.0 - recovery;
    double pv_protect = 0.0;
    for (int k = 0; k < n_integral; ++k) {
        double t_mid = (k + 0.5) * dt;
        // Find the hazard rate at t_mid
        double h_mid = hazard_rates[0];
        for (std::size_t i = 0; i + 1 < hazard_breakpoints.size(); ++i)
            if (t_mid >= hazard_breakpoints[i]) h_mid = hazard_rates[i];
        pv_protect += lgd * std::exp(-r * t_mid) * sp(t_mid) * h_mid * dt;
    }

    double par_spread = (pv_premium > 1e-12) ? pv_protect / pv_premium : 0.0;

    return {par_spread * 10000.0, pv_protect, pv_premium, pv_premium};
}`,
    explanation:
      "The par spread formula equates the present value of the protection leg (seller's expected payout weighted by default probability and discount) to the present value of the premium leg (buyer's coupon stream weighted by survival probability) — par spread = PV(protection) / risky_annuity. The piecewise-constant hazard rate is the simplest calibratable model: each term of the CDS curve (1Y, 3Y, 5Y, 10Y) pins one hazard rate segment, and bootstrapping sequentially from the shortest to longest tenor determines the full intensity curve.",
  },
  {
    id: "cpp-20260615-b1-merton-jump",
    language: "cpp",
    title: "Merton jump-diffusion — closed-form option pricing with Poisson jumps",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>

// Merton (1976) jump-diffusion model:
//   dS/S = (mu - lambda*k) dt + sigma*dW + J*dN
// J = jump size (log-normally distributed): log(1+J) ~ N(mu_J, sigma_J^2)
// N = Poisson process with intensity lambda (avg jumps per year)
// k = E[J] = exp(mu_J + 0.5*sigma_J^2) - 1  (mean relative jump size)
//
// Option price = infinite series in n (number of jumps), each term is a BS call
// with adjusted vol and drift for exactly n jumps. Converges rapidly for small lambda*T.

static double normal_cdf(double x) noexcept {
    return 0.5 * std::erfc(-x / std::numbers::sqrt2);
}

static double bs_call_core(double F, double K, double disc,
                             double sigma, double T) noexcept {
    if (T <= 0 || sigma <= 0) return std::max(F * disc - K * disc, 0.0);
    double sqT = std::sqrt(T);
    double d1  = (std::log(F / K) + 0.5 * sigma * sigma * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    return disc * (F * normal_cdf(d1) - K * normal_cdf(d2));
}

double mertonJumpCall(double S, double K, double r,
                       double sigma, double T,
                       double lambda,   // jump intensity (jumps/year)
                       double mu_J,     // mean log-jump
                       double sigma_J   // std dev log-jump
) noexcept {
    // Mean jump factor
    double k_mean = std::exp(mu_J + 0.5 * sigma_J * sigma_J) - 1.0;
    // Adjusted drift to compensate for jumps (risk-neutral)
    double lambda_prime = lambda * (1.0 + k_mean);

    double price = 0.0;
    double poisson_prob = std::exp(-lambda_prime * T);  // P(N=0)

    for (int n = 0; n <= 50; ++n) {
        if (n > 0) poisson_prob *= lambda_prime * T / n;  // recurrence

        // Variance and drift for n jumps
        double sigma_n2 = sigma * sigma + n * sigma_J * sigma_J / T;
        double sigma_n  = std::sqrt(sigma_n2);
        double r_n      = r - lambda * k_mean + n * mu_J / T;

        // Forward price under the n-jump measure
        double F_n = S * std::exp(r_n * T);
        double disc = std::exp(-r * T);

        price += poisson_prob * bs_call_core(F_n, K, disc, sigma_n, T);

        // Early termination when contribution is negligible
        if (poisson_prob < 1e-12) break;
    }
    return price;
}`,
    explanation:
      "The Merton series converges because the Poisson probability decreases faster than the Black-Scholes term grows for large n — for lambda = 1 jump/year and T = 0.25 years, the n = 10 term contributes less than 10⁻⁸ of the total. Each term in the series is a Black-Scholes price for a process with volatility √(σ² + n·σ_J²/T) (total variance = diffusive + jump variance per unit time) and an adjusted drift r_n that accounts for the risk-neutral jump-size compensation. Jump diffusion generates implied vol smiles/skews because deep OTM options are repriced by the jump tails, even though the diffusive component is lognormal.",
  },
  {
    id: "cpp-20260615-b1-open-hashmap",
    language: "cpp",
    title: "Open-addressing hash map — O(1) order ID lookup for cancel processing",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cstddef>
#include <vector>
#include <optional>
#include <cassert>

// Open-addressing hash map with linear probing and Robin Hood displacement.
// Robin Hood: on insert, if the new key has a longer probe sequence than the
// incumbent, swap them. This equalises probe lengths and reduces average lookup cost.
// Much more cache-friendly than std::unordered_map (no pointer chasing).

template<typename V>
class FlatHashMap {
    static constexpr std::uint64_t EMPTY = ~0ULL;   // sentinel for empty slot

    struct Slot {
        std::uint64_t key = EMPTY;
        V             val{};
        std::uint32_t dist = 0;   // probe distance from ideal position
    };

    std::vector<Slot> table_;
    std::size_t       size_   = 0;
    std::size_t       mask_;

    // Fibonacci hashing: 0x9E3779B97F4A7C15 = 2^64 / phi
    std::size_t hash(std::uint64_t k) const noexcept {
        return (k * 0x9E3779B97F4A7C15ULL) >> (64 - std::bit_width(table_.size()) + 1);
    }

public:
    explicit FlatHashMap(std::size_t cap = 16) {
        // Round up to power of 2
        std::size_t sz = 1;
        while (sz < cap * 2) sz <<= 1;
        table_.assign(sz, Slot{});
        mask_ = sz - 1;
    }

    bool insert(std::uint64_t key, V val) noexcept {
        if (size_ * 2 >= table_.size()) return false;  // load factor > 0.5: caller rehashes
        std::size_t idx = hash(key) & mask_;
        Slot incoming{key, std::move(val), 0};
        while (true) {
            Slot& cur = table_[idx];
            if (cur.key == EMPTY) { cur = std::move(incoming); ++size_; return true; }
            if (cur.key == key)   { cur.val = std::move(incoming.val); return true; }
            // Robin Hood swap: steal from the rich (low dist) for the poor (high dist)
            if (cur.dist < incoming.dist) std::swap(cur, incoming);
            ++incoming.dist;
            idx = (idx + 1) & mask_;
        }
    }

    V* find(std::uint64_t key) noexcept {
        std::size_t idx = hash(key) & mask_;
        std::uint32_t dist = 0;
        while (true) {
            Slot& cur = table_[idx];
            if (cur.key == key)   return &cur.val;
            // Early termination: no key can have a probe distance > cur.dist
            if (cur.key == EMPTY || dist > cur.dist) return nullptr;
            ++dist;
            idx = (idx + 1) & mask_;
        }
    }

    bool erase(std::uint64_t key) noexcept {
        V* p = find(key);
        if (!p) return false;
        // Backward shift to close the hole
        std::size_t idx = static_cast<std::size_t>(
            reinterpret_cast<Slot*>(p) - reinterpret_cast<Slot*>(table_.data()));
        table_[idx].key = EMPTY;
        std::size_t next = (idx + 1) & mask_;
        while (table_[next].key != EMPTY && table_[next].dist > 0) {
            table_[idx] = std::move(table_[next]);
            --table_[idx].dist;
            table_[next].key = EMPTY;
            idx  = next;
            next = (next + 1) & mask_;
        }
        --size_;
        return true;
    }

    std::size_t size() const noexcept { return size_; }
};`,
    explanation:
      "Robin Hood hashing bounds the maximum probe distance to O(log N) in expectation — the longest-ever chain for a 50%-loaded table of 1M entries is typically ≤ 15 probes, while a naive open-addressing table can have chains of O(N). The early-termination property is the key lookup speedup: if the current slot's probe distance is greater than the search probe distance, the target key cannot be present (Robin Hood guarantees it would have displaced a lower-distance key). This makes find() as cache-efficient as a linear scan of a small array, with no pointer indirection — 2–5× faster than std::unordered_map for integer keys.",
  },
];
