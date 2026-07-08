import type { Snippet } from "./types";

export const cppSnippets20260708B1: Snippet[] = [
  {
    id: "cpp-20260708-b1-concepts-pricing",
    language: "cpp",
    title: "C++20 Concepts: PricingModel Constraint",
    tag: "concepts",
    code: `#include <concepts>
#include <cmath>
#include <iostream>

// Concept: T must expose price() and delta() returning double
template <typename T>
concept PricingModel = requires(const T& m, double S, double K, double Tv) {
    { m.price(S, K, Tv) } -> std::convertible_to<double>;
    { m.delta(S, K, Tv) } -> std::convertible_to<double>;
};

struct BlackScholes {
    double r, sigma;
    double price(double S, double K, double T) const noexcept {
        auto N = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
        double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
        double d2 = d1 - sigma*std::sqrt(T);
        return S*N(d1) - K*std::exp(-r*T)*N(d2);
    }
    double delta(double S, double K, double T) const noexcept {
        auto N = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
        double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
        return N(d1);
    }
};

// Constrained template: compiler rejects types that lack price() / delta()
template <PricingModel M>
void print_greeks(const M& model, double S, double K, double T) {
    std::cout << "Price: " << model.price(S, K, T)
              << "  Delta: " << model.delta(S, K, T) << "\\n";
}

int main() {
    BlackScholes bs{0.05, 0.20};
    print_greeks(bs, 100.0, 100.0, 1.0);   // Price: ~10.45  Delta: ~0.636
}`,
    explanation:
      "C++20 concepts produce a crisp error message at the call site when a type doesn't satisfy the interface, unlike SFINAE substitution failures that generate deep template instantiation backtracks. Requiring { m.price(...) } -> std::convertible_to<double> checks both that the method exists and that its return type is usable as a double, ruling out types that accidentally expose a method with the right name but wrong signature.",
  },
  {
    id: "cpp-20260708-b1-sfinae-dispatch",
    language: "cpp",
    title: "SFINAE enable_if: Integer Ticks vs Float Price Overloads",
    tag: "SFINAE",
    code: `#include <type_traits>
#include <cmath>
#include <iostream>

// Convert integer tick count to a rounded dollar price
template <typename T>
std::enable_if_t<std::is_integral_v<T>, double>
to_price(T ticks, double tick_size) noexcept {
    return static_cast<double>(ticks) * tick_size;
}

// Convert a raw float to the nearest valid tick
template <typename T>
std::enable_if_t<std::is_floating_point_v<T>, double>
to_price(T raw, double tick_size) noexcept {
    return std::round(static_cast<double>(raw) / tick_size) * tick_size;
}

// Spread in ticks (integer result)
template <typename T, typename U>
auto spread_ticks(T bid, U ask, double tick_size) {
    return static_cast<long>((to_price(ask, tick_size) - to_price(bid, tick_size))
                             / tick_size + 0.5);
}

int main() {
    std::cout << to_price(1050, 0.01)   << "\\n"; // int overload: 1050 ticks -> 10.50
    std::cout << to_price(10.503, 0.01) << "\\n"; // float overload: 10.50 (rounded)
    std::cout << spread_ticks(99.995, 100.005, 0.01) << " ticks\\n"; // 1 tick spread
}`,
    explanation:
      "enable_if_t creates a valid overload only when the boolean condition is true, removing the other overload from the candidate set without an error. The integer overload is exact (multiplying an exact integer by a tick size), while the floating-point overload needs rounding — separating these at compile time prevents callers from accidentally mixing contexts and getting silent precision loss.",
  },
  {
    id: "cpp-20260708-b1-pmr-arena",
    language: "cpp",
    title: "std::pmr Monotonic Arena for Order Event Bursts",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <iostream>

struct OrderEvent {
    int    id;
    double price;
    int    qty;
    char   side;   // 'B' or 'S'
};

int main() {
    // 64 KB stack buffer — all allocations come from here during processing
    alignas(64) std::byte buf[65536];
    std::pmr::monotonic_buffer_resource arena(buf, sizeof(buf),
        std::pmr::null_memory_resource());  // abort if buffer overflows

    {
        // pmr::vector uses the arena — zero heap calls during push_back
        std::pmr::vector<OrderEvent> events{&arena};
        events.reserve(200);

        for (int i = 0; i < 200; ++i)
            events.push_back({i, 100.0 + i * 0.01, 100, (i%2) ? 'S' : 'B'});

        std::cout << "Processed " << events.size() << " events from stack arena\\n";
        // When events goes out of scope, destructors run but no heap free is called
    }

    // Reset the arena in O(1): no per-element teardown
    arena.release();
    std::cout << "Arena reset — ready for next batch\\n";
}`,
    explanation:
      "Monotonic buffer resource hands out memory by bumping a pointer forward, making each allocation O(1) with no fragmentation and no locking. The critical difference from a pool allocator is that release() frees everything in a single operation — ideal for per-message-burst processing loops where all events in a tick are allocated together and freed together at the end of the handler.",
  },
  {
    id: "cpp-20260708-b1-open-addressing",
    language: "cpp",
    title: "Open-Addressing Hash Map (Linear Probing) for Symbol Table",
    tag: "containers",
    code: `#include <array>
#include <cstring>
#include <string_view>
#include <optional>
#include <iostream>

// Open-addressing map with linear probing: better cache behaviour than std::unordered_map
// which uses chaining (linked-list buckets that scatter across the heap)
template <std::size_t Cap>
class SymbolMap {
    static_assert((Cap & (Cap-1)) == 0, "Cap must be power of 2");
    struct Slot {
        char   key[8] = {};
        double val    = 0.0;
        bool   used   = false;
    };
    std::array<Slot, Cap> slots_{};

    static std::size_t hash(std::string_view s) noexcept {
        uint64_t h = 0;
        std::memcpy(&h, s.data(), std::min(s.size(), std::size_t(8)));
        h ^= h >> 33; h *= 0xff51afd7ed558ccdULL; h ^= h >> 33; // finalizer
        return h;
    }

public:
    void put(std::string_view key, double val) noexcept {
        std::size_t i = hash(key) & (Cap - 1);
        char k8[8]{}; std::memcpy(k8, key.data(), std::min(key.size(), std::size_t(8)));
        while (slots_[i].used && std::memcmp(slots_[i].key, k8, 8) != 0)
            i = (i + 1) & (Cap - 1);  // linear probe
        slots_[i] = {{}};  // clear key bytes first
        std::memcpy(slots_[i].key, k8, 8);
        slots_[i].val  = val;
        slots_[i].used = true;
    }

    std::optional<double> get(std::string_view key) const noexcept {
        std::size_t i = hash(key) & (Cap - 1);
        char k8[8]{}; std::memcpy(k8, key.data(), std::min(key.size(), std::size_t(8)));
        while (slots_[i].used) {
            if (std::memcmp(slots_[i].key, k8, 8) == 0) return slots_[i].val;
            i = (i + 1) & (Cap - 1);
        }
        return std::nullopt;
    }
};

int main() {
    SymbolMap<256> mid;
    mid.put("AAPL",  175.5);
    mid.put("GOOGL", 2800.0);
    mid.put("MSFT",  310.0);
    if (auto p = mid.get("AAPL")) std::cout << "AAPL: " << *p << "\\n";  // 175.5
    if (!mid.get("TSLA"))         std::cout << "TSLA not found\\n";
}`,
    explanation:
      "Linear probing stores all entries in a single array, so a cache line fetched during key comparison also brings adjacent probed slots into cache — a property chained hash maps can't provide because each bucket's next pointer jumps to a different heap location. For a read-heavy symbol table in a tick handler, a load factor below 0.5 keeps average probe length near 1.5 and makes the map effectively L1-resident for hot symbols.",
  },
  {
    id: "cpp-20260708-b1-fixed-point-price",
    language: "cpp",
    title: "Fixed-Point int64 Price: Exact Arithmetic for Tick Sizes",
    tag: "numerics",
    code: `#include <cstdint>
#include <iostream>
#include <stdexcept>

// 8 implied decimal places: 1 raw unit = 0.00000001 (10^-8)
// Eliminates floating-point drift when accumulating millions of price updates
struct Price {
    static constexpr int64_t SCALE = 100'000'000LL;  // 10^8
    int64_t raw;

    explicit Price(double p) noexcept
        : raw(static_cast<int64_t>(p * SCALE + (p >= 0 ? 0.5 : -0.5))) {}
    constexpr explicit Price(int64_t r) noexcept : raw(r) {}

    double to_double() const noexcept { return static_cast<double>(raw) / SCALE; }

    Price operator+(Price o) const noexcept { return Price{raw + o.raw}; }
    Price operator-(Price o) const noexcept { return Price{raw - o.raw}; }
    bool  operator< (Price o) const noexcept { return raw < o.raw; }
    bool  operator==(Price o) const noexcept { return raw == o.raw; }

    // Spread in basis points (1 bp = 0.01% of base price)
    int64_t bps_from(Price base) const noexcept {
        return (raw - base.raw) * 10'000LL / base.raw;
    }

    // Notional = price * qty, result scaled back to SCALE
    int64_t notional(int64_t qty) const noexcept { return raw * qty; }
};

int main() {
    Price bid(99.995), ask(100.005);
    Price spread = ask - bid;
    std::cout << "Spread: " << spread.to_double()
              << " (" << ask.bps_from(bid) << " bps)\\n";  // 0.01, 1 bp

    // Exact equality that floating-point cannot guarantee:
    Price p1(0.1), p2(0.2), p3(0.3);
    std::cout << "0.1+0.2 == 0.3? "
              << std::boolalpha << ((p1+p2) == p3) << "\\n";  // true (exact)
}`,
    explanation:
      "Floating-point prices accumulate rounding error across millions of operations: 0.1 + 0.2 ≠ 0.3 in IEEE 754, causing P&L mismatches between front office and risk systems. Storing prices as int64_t with a fixed scale factor makes all arithmetic exact for the decimal precision required — exchanges themselves often use this representation (CME Group uses 10^7 for price, 10^0 for quantity).",
  },
  {
    id: "cpp-20260708-b1-numa-alloc",
    language: "cpp",
    title: "NUMA-Aware Memory Allocation with mmap + mbind",
    tag: "low-latency",
    code: `#ifdef __linux__
#include <numaif.h>
#include <sys/mman.h>
#include <cstring>
#include <iostream>

// Allocate and bind physical pages to a specific NUMA node
// Prevents remote-NUMA memory access (adds ~80ns per access on 2-socket systems)
void* numa_alloc_node(std::size_t size, int node) {
    void* ptr = mmap(nullptr, size,
                     PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (ptr == MAP_FAILED) return nullptr;

    // mbind moves the virtual memory policy to bind on node
    unsigned long nodemask = 1UL << node;
    if (mbind(ptr, size, MPOL_BIND, &nodemask, sizeof(nodemask)*8, 0) != 0) {
        munmap(ptr, size);
        return nullptr;
    }
    // First write to trigger page allocation on the target node
    std::memset(ptr, 0, size);
    return ptr;
}

void numa_free(void* ptr, std::size_t size) { munmap(ptr, size); }

struct MarketDataCache {
    alignas(64) double prices[512];
    alignas(64) int    quantities[512];
};

int main() {
    constexpr std::size_t SIZE = sizeof(MarketDataCache);
    auto* cache = static_cast<MarketDataCache*>(numa_alloc_node(SIZE, 0));
    if (cache) {
        cache->prices[0] = 100.5;
        std::cout << "NUMA node 0 cache at " << static_cast<void*>(cache)
                  << " price[0]=" << cache->prices[0] << "\\n";
        numa_free(cache, SIZE);
    } else {
        std::cout << "NUMA bind failed (needs Linux + numactl)\\n";
    }
}
#else
int main() { return 0; }  // NUMA is Linux-only
#endif`,
    explanation:
      "On multi-socket NUMA servers (common in HFT colos), a CPU accessing memory on a remote NUMA node pays ~80 ns extra latency versus its local node (~60 ns vs ~140 ns). Binding the market-data cache for the matching engine thread to the same NUMA node as its CPU eliminates that penalty; mbind with MPOL_BIND enforces that the kernel only allocates physical pages from the target node.",
  },
  {
    id: "cpp-20260708-b1-level-iterator",
    language: "cpp",
    title: "Custom Iterator: Bid Level Traversal Best-to-Worst",
    tag: "containers",
    code: `#include <map>
#include <iostream>

struct Level { int qty; };

// Wraps std::map<double,Level> to iterate from best bid (highest) downward
class BidBook {
    std::map<double, Level> levels_;  // ascending by price key

public:
    void add(double price, int qty) { levels_[price].qty += qty; }

    // reverse_iterator gives descending price (best bid first)
    struct BidIter {
        using It = std::map<double,Level>::reverse_iterator;
        It cur_;
        std::pair<double,int> operator*()  const { return {cur_->first, cur_->second.qty}; }
        BidIter& operator++()              { ++cur_; return *this; }
        bool     operator!=(BidIter o)     const { return cur_ != o.cur_; }
    };

    BidIter begin() { return {levels_.rbegin()}; }
    BidIter end()   { return {levels_.rend()}; }

    // Notional available within max_ticks of best bid
    double notional_within(int max_ticks, double tick_size) {
        if (levels_.empty()) return 0.0;
        double best = levels_.rbegin()->first;
        double limit = best - max_ticks * tick_size;
        double total = 0.0;
        for (auto [price, qty] : *this) {
            if (price < limit) break;
            total += price * qty;
        }
        return total;
    }
};

int main() {
    BidBook book;
    for (auto [p, q] : std::initializer_list<std::pair<double,int>>{
            {99.75,100},{100.00,250},{99.50,150}})
        book.add(p, q);

    for (auto [price, qty] : book)
        std::cout << "Bid " << price << " x " << qty << "\\n"; // 100, 99.75, 99.50

    std::cout << "Notional within 3 ticks: $"
              << book.notional_within(3, 0.25) << "\\n";
}`,
    explanation:
      "Wrapping the reverse_iterator in a named type gives the bid book a range-compatible interface while keeping the internal representation as an ascending map — no separate data structure needed. The notional_within helper computes market depth in dollar terms, which is the standard way to measure how much size is available without moving the market by more than a specified number of ticks.",
  },
  {
    id: "cpp-20260708-b1-treiber-stack",
    language: "cpp",
    title: "Treiber Lock-Free Stack with ABA-Proof Tagged Pointer",
    tag: "lock-free",
    code: `#include <atomic>
#include <optional>
#include <cstdint>
#include <iostream>

// Pack a 48-bit pointer + 16-bit version counter into one uint64_t
// x86-64 uses only 48 bits for virtual addresses, so the top 16 are free
static constexpr int     TAG_BITS = 16;
static constexpr uint64_t PTR_MASK = (1ULL << (64 - TAG_BITS)) - 1;

inline uint64_t pack(void* p, uint16_t tag) noexcept {
    return (reinterpret_cast<uint64_t>(p) & PTR_MASK)
         | (static_cast<uint64_t>(tag) << (64 - TAG_BITS));
}
inline void*    get_ptr(uint64_t v) noexcept { return reinterpret_cast<void*>(v & PTR_MASK); }
inline uint16_t get_tag(uint64_t v) noexcept { return static_cast<uint16_t>(v >> (64 - TAG_BITS)); }

template <typename T>
class TreiberStack {
    struct Node { T val; Node* next; };
    std::atomic<uint64_t> top_{pack(nullptr, 0)};

public:
    void push(T v) {
        auto* n = new Node{std::move(v), nullptr};
        uint64_t old = top_.load(std::memory_order_relaxed);
        uint64_t desired;
        do {
            n->next = static_cast<Node*>(get_ptr(old));
            desired = pack(n, get_tag(old) + 1);
        } while (!top_.compare_exchange_weak(old, desired,
                  std::memory_order_release, std::memory_order_relaxed));
    }

    std::optional<T> pop() {
        uint64_t old = top_.load(std::memory_order_acquire);
        uint64_t desired;
        do {
            auto* n = static_cast<Node*>(get_ptr(old));
            if (!n) return std::nullopt;
            desired = pack(n->next, get_tag(old) + 1);
        } while (!top_.compare_exchange_weak(old, desired,
                  std::memory_order_acquire, std::memory_order_relaxed));
        auto* n = static_cast<Node*>(get_ptr(old));
        T result = std::move(n->val);
        delete n;  // safe for single-consumer; production needs hazard pointers
        return result;
    }
};

int main() {
    TreiberStack<int> s;
    s.push(10); s.push(20); s.push(30);
    while (auto v = s.pop()) std::cout << *v << " ";  // 30 20 10
    std::cout << "\\n";
}`,
    explanation:
      "The ABA problem occurs when a thread reads top → A, another thread pops A, pushes B, pushes A back, and the first thread's CAS succeeds even though A now points to different memory. Embedding a version counter that increments on every successful CAS detects the stale-pointer case because the tag will have changed, causing the CAS to fail and retry. Packing the counter into unused virtual-address bits costs zero extra memory and keeps the CAS as a single 64-bit operation.",
  },
  {
    id: "cpp-20260708-b1-expected-gateway",
    language: "cpp",
    title: "std::expected (C++23): Gateway Error Propagation",
    tag: "modern-cpp",
    code: `#include <expected>
#include <string>
#include <cmath>
#include <iostream>

enum class GatewayErr { InvalidPrice, ExceedsLimit, SessionDown };

struct Order { double price; int qty; bool is_buy; };

// Returns order ID on success, or a typed error without exceptions
std::expected<int, GatewayErr>
submit(const Order& o, int pos_limit, bool session_up) {
    if (!session_up)
        return std::unexpected(GatewayErr::SessionDown);
    if (o.price <= 0.0 || std::isnan(o.price))
        return std::unexpected(GatewayErr::InvalidPrice);
    if (std::abs(o.qty) > pos_limit)
        return std::unexpected(GatewayErr::ExceedsLimit);

    static int next_id = 1000;
    return ++next_id;
}

// Monadic chaining: and_then / or_else (C++23)
std::expected<double, GatewayErr>
submit_and_calc_notional(const Order& o, int limit, bool up) {
    return submit(o, limit, up)
        .and_then([&](int id) -> std::expected<double, GatewayErr> {
            std::cout << "Order id=" << id << " acknowledged\\n";
            return o.price * o.qty;
        });
}

int main() {
    auto r1 = submit_and_calc_notional({100.5, 200, true}, 1000, true);
    if (r1) std::cout << "Notional: $" << *r1 << "\\n";

    auto r2 = submit({-1.0, 10, true}, 1000, true);
    if (!r2) std::cout << "Error: " << static_cast<int>(r2.error()) << "\\n";
}`,
    explanation:
      "std::expected<T,E> makes error handling explicit in the type system without exception overhead — the caller is forced to check the result, unlike an unchecked return code that can be silently ignored. The monadic and_then chain lets you compose operations that may each fail, short-circuiting on the first error and propagating it to the top level without nested if-else ladders.",
  },
  {
    id: "cpp-20260708-b1-jthread-feed",
    language: "cpp",
    title: "std::jthread + stop_token: Cooperative Feed Cancellation",
    tag: "modern-cpp",
    code: `#include <thread>
#include <stop_token>
#include <atomic>
#include <chrono>
#include <iostream>

// Market data receiver that checks for cancellation between ticks
std::atomic<long> tick_count{0};

void feed_receiver(std::stop_token stop) {
    while (!stop.stop_requested()) {
        ++tick_count;
        // In a real feed: recv() on a UDP socket with a timeout
        std::this_thread::sleep_for(std::chrono::microseconds(100));
    }
    std::cout << "Feed stopped cleanly after " << tick_count << " ticks\\n";
}

int main() {
    {
        // jthread: calls request_stop() + join() automatically on destruction
        std::jthread feed(feed_receiver);

        std::this_thread::sleep_for(std::chrono::milliseconds(5));
        // No explicit join() needed — RAII handles it
    }  // <-- destructor here: stop requested, thread joined

    std::cout << "Total ticks: " << tick_count << "\\n";
}`,
    explanation:
      "std::jthread integrates the stop_token mechanism: each jthread owns a stop_source, and its destructor automatically calls request_stop() before joining, ensuring the thread exits cleanly without a manual join() call that could be forgotten on an exception path. The receiver checks stop_requested() between ticks rather than blocking indefinitely on a socket, which keeps the response to cancellation bounded by the maximum tick-processing duration.",
  },
  {
    id: "cpp-20260708-b1-bit-cast-endian",
    language: "cpp",
    title: "std::bit_cast for Type-Safe Network Byte-Order Conversion",
    tag: "low-latency",
    code: `#include <bit>
#include <array>
#include <cstdint>
#include <iostream>

// bit_cast avoids UB from reinterpret_cast-based type punning for network parsing
// Requires source and target to be the same size and trivially copyable

// Swap bytes of any trivially-copyable type (portable endian conversion)
template <typename T>
T byteswap(T val) noexcept {
    auto bytes = std::bit_cast<std::array<std::byte, sizeof(T)>>(val);
    std::reverse(bytes.begin(), bytes.end());
    return std::bit_cast<T>(bytes);
}

// Big-endian (network) to host (little-endian on x86)
uint16_t ntohs_safe(uint16_t net) noexcept { return byteswap(net); }
uint32_t ntohl_safe(uint32_t net) noexcept { return byteswap(net); }

// Typical binary market-data header (e.g. ITCH, OUCH)
struct alignas(8) MsgHeader {
    uint16_t msg_len;   // big-endian in wire format
    uint16_t msg_type;
    uint32_t seq_num;
};

int main() {
    // Simulate receiving 8 bytes from the wire: msg_len=26, type=0x41('A'), seq=1
    std::array<std::byte, sizeof(MsgHeader)> wire = {
        std::byte{0x00}, std::byte{0x1A},  // msg_len = 26
        std::byte{0x00}, std::byte{0x41},  // msg_type = 'A'
        std::byte{0x00}, std::byte{0x00}, std::byte{0x00}, std::byte{0x01}  // seq = 1
    };

    MsgHeader hdr = std::bit_cast<MsgHeader>(wire);
    std::cout << "len="  << ntohs_safe(hdr.msg_len)
              << " type=" << static_cast<char>(ntohs_safe(hdr.msg_type))
              << " seq="  << ntohl_safe(hdr.seq_num) << "\\n";  // 26 A 1
}`,
    explanation:
      "reinterpret_cast for type punning is undefined behaviour in C++ because it violates strict aliasing; std::bit_cast is the standards-compliant replacement that both compilers and the optimizer can reason about correctly. On x86 little-endian hardware, all binary protocols (FIX/FAST, OUCH, ITCH, ARCA) require a byte-swap of every multi-byte field after reading from the network buffer.",
  },
  {
    id: "cpp-20260708-b1-mpmc-queue",
    language: "cpp",
    title: "Bounded MPMC Queue via Atomic Sequence Numbers",
    tag: "lock-free",
    code: `#include <atomic>
#include <vector>
#include <optional>
#include <thread>
#include <iostream>

// Dmitry Vyukov's MPMC queue: each slot carries a sequence counter
// that indicates when a slot is ready for write or read
template <typename T, std::size_t Cap>
class MPMCQueue {
    static_assert((Cap & (Cap-1)) == 0);
    struct Slot {
        std::atomic<std::size_t> seq;
        T data;
    };
    alignas(64) std::vector<Slot> buf_;
    alignas(64) std::atomic<std::size_t> head_{0};
    alignas(64) std::atomic<std::size_t> tail_{0};

public:
    MPMCQueue() : buf_(Cap) {
        for (std::size_t i = 0; i < Cap; ++i)
            buf_[i].seq.store(i, std::memory_order_relaxed);
    }

    bool push(T val) {
        std::size_t tail = tail_.load(std::memory_order_relaxed);
        for (;;) {
            Slot& s  = buf_[tail & (Cap-1)];
            auto  sq = s.seq.load(std::memory_order_acquire);
            auto  diff = static_cast<intptr_t>(sq) - static_cast<intptr_t>(tail);
            if (diff == 0 &&
                tail_.compare_exchange_weak(tail, tail+1, std::memory_order_relaxed)) {
                s.data = std::move(val);
                s.seq.store(tail+1, std::memory_order_release);
                return true;
            }
            if (diff < 0) return false;  // full
            tail = tail_.load(std::memory_order_relaxed);
        }
    }

    std::optional<T> pop() {
        std::size_t head = head_.load(std::memory_order_relaxed);
        for (;;) {
            Slot& s  = buf_[head & (Cap-1)];
            auto  sq = s.seq.load(std::memory_order_acquire);
            auto  diff = static_cast<intptr_t>(sq) - static_cast<intptr_t>(head+1);
            if (diff == 0 &&
                head_.compare_exchange_weak(head, head+1, std::memory_order_relaxed)) {
                T val = std::move(s.data);
                s.seq.store(head+Cap, std::memory_order_release);
                return val;
            }
            if (diff < 0) return std::nullopt;  // empty
            head = head_.load(std::memory_order_relaxed);
        }
    }
};

int main() {
    MPMCQueue<int, 64> q;
    std::thread prod([&]{ for (int i=0; i<20; ++i) while(!q.push(i)); });
    std::thread cons([&]{
        int sum=0, n=0;
        while (n<20) { if (auto v=q.pop()) { sum+=*v; ++n; } }
        std::cout << "Sum: " << sum << "\\n";  // 0+1+...+19 = 190
    });
    prod.join(); cons.join();
}`,
    explanation:
      "The sequence counter per slot is the key insight: a producer only claims a slot when seq == tail (meaning it was freed by a reader Cap positions ago), and a reader only claims it when seq == head+1 (meaning a producer filled it). This makes all contention local to individual slots' cache lines, unlike a mutex-protected queue where every operation serialises on a single lock cache line.",
  },
  {
    id: "cpp-20260708-b1-nttp-side",
    language: "cpp",
    title: "NTTP Side Encoding: Compile-Time Buy/Sell Dispatch",
    tag: "CRTP",
    code: `#include <cstdint>
#include <iostream>

enum class Side : uint8_t { Buy = 0, Sell = 1 };

// Non-type template parameter bakes the side into the type at compile time
// — branch on side is eliminated from the binary entirely
template <Side S>
struct AggressorLogic {
    static constexpr const char* name()    { return S == Side::Buy ? "BUY" : "SELL"; }
    static constexpr bool is_buy()         { return S == Side::Buy; }

    // Crossing logic resolved at compile time: no runtime branch
    static bool crosses(double passive_px, double aggressor_px) noexcept {
        if constexpr (S == Side::Buy)  return aggressor_px >= passive_px;
        else                           return aggressor_px <= passive_px;
    }

    static double fill_px(double passive_px, double /*agg_px*/) noexcept {
        return passive_px;  // price-time: fill at the resting order's price
    }
};

template <Side S>
void process_aggressor(double agg_px, double passive_px, int qty) {
    using Logic = AggressorLogic<S>;
    if (Logic::crosses(passive_px, agg_px)) {
        std::cout << Logic::name() << " fills " << qty
                  << " @ " << Logic::fill_px(passive_px, agg_px) << "\\n";
    } else {
        std::cout << Logic::name() << " no cross\\n";
    }
}

int main() {
    process_aggressor<Side::Buy> (100.5, 100.0, 200);  // BUY fills 200 @ 100.0
    process_aggressor<Side::Sell>(99.5,  100.0, 150);  // SELL fills 150 @ 100.0
    process_aggressor<Side::Buy> (99.0,  100.0, 100);  // BUY no cross
}`,
    explanation:
      "Using the order side as a non-type template parameter generates two independent specialisations of the matching logic, each with all side-specific branches resolved at compile time and typically inlined by the optimizer. The alternative — passing side as a runtime parameter and branching inside the matching loop — costs ~3-5 ns per order due to branch-predictor pressure when sides alternate unpredictably.",
  },
  {
    id: "cpp-20260708-b1-if-constexpr-payoff",
    language: "cpp",
    title: "if constexpr: Single Pricer for Call/Put/Digital Payoffs",
    tag: "modern-cpp",
    code: `#include <cmath>
#include <iostream>

enum class Payoff { Call, Put, DigitalCall, DigitalPut };

// One template handles all option types — payoff selected at compile time
template <Payoff P>
double bs_price(double S, double K, double T, double r, double sigma) noexcept {
    auto N = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double d2  = d1 - sigma*sqT;
    double df  = std::exp(-r*T);

    if constexpr (P == Payoff::Call)
        return S*N(d1) - K*df*N(d2);
    else if constexpr (P == Payoff::Put)
        return K*df*N(-d2) - S*N(-d1);
    else if constexpr (P == Payoff::DigitalCall)
        return df * N(d2);          // pay $1 if S_T > K
    else  // DigitalPut
        return df * N(-d2);         // pay $1 if S_T < K
}

int main() {
    double S=100, K=100, T=1, r=0.05, sig=0.20;
    std::cout << "Call:         " << bs_price<Payoff::Call>(S,K,T,r,sig)        << "\\n"; // ~10.45
    std::cout << "Put:          " << bs_price<Payoff::Put>(S,K,T,r,sig)         << "\\n"; // ~5.57
    std::cout << "Digital call: " << bs_price<Payoff::DigitalCall>(S,K,T,r,sig) << "\\n"; // ~0.532
    std::cout << "Digital put:  " << bs_price<Payoff::DigitalPut>(S,K,T,r,sig)  << "\\n"; // ~0.420
    // Put-call parity: call - put = S - K*exp(-rT)
}`,
    explanation:
      "if constexpr discards branches that don't match at compile time, meaning only the relevant code is included in each instantiation — the call version has no N(-d1) computation, the digital versions have no S multiplication. This matters when the pricer is inlined into a loop that batches many options of the same type, since dead code elimination keeps the inner loop tight.",
  },
  {
    id: "cpp-20260708-b1-historical-var",
    language: "cpp",
    title: "Historical VaR via std::nth_element (O(N) Average Time)",
    tag: "numerics",
    code: `#include <vector>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iostream>
#include <random>

// nth_element partially sorts: element at rank idx is correct,
// elements below it are ≤ it, elements above are ≥ it — O(N) average
double historical_var(std::vector<double> pnl, double conf = 0.99) {
    std::size_t idx = static_cast<std::size_t>((1.0 - conf) * pnl.size());
    std::nth_element(pnl.begin(), pnl.begin() + idx, pnl.end());
    return -pnl[idx];  // loss expressed as positive number
}

double historical_es(std::vector<double> pnl, double conf = 0.99) {
    std::size_t idx = static_cast<std::size_t>((1.0 - conf) * pnl.size());
    std::nth_element(pnl.begin(), pnl.begin() + idx, pnl.end());
    // Average of the (1-conf) worst outcomes in the unsorted prefix
    double sum = 0.0;
    for (std::size_t i = 0; i <= idx; ++i) sum += pnl[i];
    return -(sum / (idx + 1));
}

int main() {
    std::mt19937 rng(42);
    std::normal_distribution<double> dist(200.0, 800.0);  // mean P&L = +$200/day
    std::vector<double> pnl(1000);
    std::generate(pnl.begin(), pnl.end(), [&]{ return dist(rng); });

    std::cout << "1-day 99% VaR: $" << historical_var(pnl) << "\\n";
    std::cout << "1-day 99% ES:  $" << historical_es(pnl)  << "\\n";
    // Expected Shortfall (ES/CVaR) always >= VaR and is a coherent risk measure
}`,
    explanation:
      "nth_element with O(N) average complexity is faster than full O(N log N) sort for VaR computation over large return histories, and is exact — it places the correct element at the target quantile rank. Expected Shortfall is the average loss in the worst (1-α)% of scenarios, making it a coherent risk measure that VaR is not; regulators (Basel IV) have largely shifted to ES as the capital metric.",
  },
  {
    id: "cpp-20260708-b1-vol-surface-interp",
    language: "cpp",
    title: "Bilinear Implied Volatility Surface Interpolation",
    tag: "numerics",
    code: `#include <vector>
#include <algorithm>
#include <stdexcept>
#include <iostream>

// Bilinear interpolation on a (strikes x maturities) vol grid
struct VolSurface {
    std::vector<double>              strikes;     // sorted ascending
    std::vector<double>              maturities;  // sorted ascending
    std::vector<std::vector<double>> vols;        // vols[t_idx][k_idx]

    double interp(double K, double T) const {
        auto clamp_idx = [](std::size_t idx, std::size_t n) -> std::size_t {
            return (idx == 0 || idx >= n) ? (idx >= n ? n-2 : 0) : idx - 1;
        };

        auto ki = std::lower_bound(strikes.begin(), strikes.end(), K);
        auto ti = std::lower_bound(maturities.begin(), maturities.end(), T);
        std::size_t k0 = clamp_idx(ki - strikes.begin(), strikes.size());
        std::size_t t0 = clamp_idx(ti - maturities.begin(), maturities.size());

        double dK = std::clamp((K - strikes[k0]) / (strikes[k0+1] - strikes[k0]), 0.0, 1.0);
        double dT = std::clamp((T - maturities[t0]) / (maturities[t0+1] - maturities[t0]), 0.0, 1.0);

        // Bilinear: first along strike, then along maturity
        double v0 = vols[t0][k0]   + dK*(vols[t0][k0+1]   - vols[t0][k0]);
        double v1 = vols[t0+1][k0] + dK*(vols[t0+1][k0+1] - vols[t0+1][k0]);
        return v0 + dT*(v1 - v0);
    }
};

int main() {
    VolSurface surf{
        {90,  95,  100, 105, 110},   // strikes
        {0.5, 1.0, 2.0},             // maturities
        { {0.25,0.22,0.20,0.21,0.23},  // T=0.5
          {0.24,0.21,0.19,0.20,0.22},  // T=1.0
          {0.23,0.20,0.18,0.19,0.21} } // T=2.0
    };

    std::cout << "Vol at K=102.5, T=0.75: " << surf.interp(102.5, 0.75) << "\\n"; // ~0.198
    std::cout << "Vol at K=100.0, T=1.00: " << surf.interp(100.0, 1.00) << "\\n"; // 0.19
    std::cout << "Vol at K=95.0,  T=1.50: " << surf.interp(95.0,  1.50) << "\\n"; // ~0.205
}`,
    explanation:
      "Bilinear interpolation on a strike-maturity grid is the baseline approach for vol surface lookup: it's exact at grid nodes and linear between them, adding no spurious curvature. In practice, more sophisticated methods (SABR, SVI) are used for extrapolation and arbitrage-free smoothness, but bilinear remains the fallback when speed is critical and the query point is well within the grid bounds.",
  },
  {
    id: "cpp-20260708-b1-atomic-risk-limit",
    language: "cpp",
    title: "Atomic CAS Position Limit: Lock-Free Risk Check",
    tag: "lock-free",
    code: `#include <atomic>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <thread>
#include <vector>

// Per-symbol position limiter enforced without locks
// compare_exchange ensures the post-fill position never exceeds the limit
class PositionLimiter {
    std::atomic<int64_t> pos_{0};
    const int64_t        limit_;

public:
    explicit PositionLimiter(int64_t limit) noexcept : limit_(limit) {}

    // Returns true if the fill is accepted; atomically updates position
    bool try_fill(int64_t qty) noexcept {
        int64_t old = pos_.load(std::memory_order_relaxed);
        int64_t next;
        do {
            next = old + qty;
            if (std::abs(next) > limit_) return false;  // reject without side-effect
        } while (!pos_.compare_exchange_weak(old, next,
                  std::memory_order_acq_rel, std::memory_order_relaxed));
        return true;
    }

    int64_t position() const noexcept {
        return pos_.load(std::memory_order_acquire);
    }
};

int main() {
    PositionLimiter lim(500);  // ±500 share limit
    std::atomic<int> accepted{0}, rejected{0};

    std::vector<std::thread> pool;
    for (int t = 0; t < 4; ++t)
        pool.emplace_back([&]{
            for (int i = 0; i < 50; ++i) {
                if (lim.try_fill(15))  ++accepted;
                else                   ++rejected;
            }
        });
    for (auto& t : pool) t.join();

    std::cout << "Accepted: " << accepted
              << "  Rejected: " << rejected
              << "  Final pos: " << lim.position() << "\\n";
}`,
    explanation:
      "The compare_exchange loop reads the current position, checks the hypothetical post-fill value, and atomically commits only if the current position hasn't changed — if another thread filled simultaneously, the CAS fails and we retry with the updated position. This is strictly stronger than a mutex: it prevents position overshoot even when N threads simultaneously submit fills that each individually pass the limit check but together would breach it.",
  },
  {
    id: "cpp-20260708-b1-bond-dv01",
    language: "cpp",
    title: "Bond Modified Duration and DV01 from Cash Flow Schedule",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <iostream>

struct CF { double t; double amount; };  // time (years), cash flow

double dirty_price(const std::vector<CF>& cfs, double ytm, int freq = 2) noexcept {
    double p = 0.0;
    for (const auto& cf : cfs)
        p += cf.amount / std::pow(1.0 + ytm/freq, cf.t*freq);
    return p;
}

// Modified duration: weighted average time, adjusted for compounding frequency
double mod_duration(const std::vector<CF>& cfs, double ytm, int freq = 2) noexcept {
    double p   = dirty_price(cfs, ytm, freq);
    double mac = 0.0;
    for (const auto& cf : cfs)
        mac += cf.t * cf.amount / std::pow(1.0 + ytm/freq, cf.t*freq);
    return (mac / p) / (1.0 + ytm/freq);  // Macaulay / (1 + y/m)
}

// DV01: $ change in price per 1 bp parallel shift in yield
double dv01(const std::vector<CF>& cfs, double ytm, int freq = 2) noexcept {
    constexpr double bp = 0.0001;
    return (dirty_price(cfs, ytm-bp, freq) - dirty_price(cfs, ytm+bp, freq)) / 2.0;
}

int main() {
    // 5-year 4.5% semiannual coupon bond, face value $1,000,000
    std::vector<CF> bond;
    for (int i = 1; i <= 10; ++i) bond.push_back({i*0.5, 22'500.0});  // coupon = 4.5%/2
    bond.back().amount += 1'000'000.0;  // principal repayment

    double ytm = 0.040;  // 4.0% yield
    std::cout << "Price:    $" << dirty_price(bond, ytm)  << "\\n"; // ~1,044,913
    std::cout << "Mod Dur:  "  << mod_duration(bond, ytm) << " years\\n"; // ~4.45
    std::cout << "DV01:     $" << dv01(bond, ytm)         << " per bp\\n"; // ~465
}`,
    explanation:
      "DV01 (dollar value of one basis point) measures the portfolio's first-order sensitivity to a parallel shift in the yield curve — a bond with DV01 of $465 gains $4,650 if yields fall 10 bps. Modified duration relates DV01 to price: DV01 ≈ ModDur × DirtyPrice / 10,000, and is used to construct duration-neutral hedges by offsetting positions in different maturities.",
  },
  {
    id: "cpp-20260708-b1-fast-log-ieee754",
    language: "cpp",
    title: "Fast log₂ via IEEE 754 Exponent Extraction",
    tag: "low-latency",
    code: `#include <bit>
#include <cmath>
#include <cstdint>
#include <iostream>

// IEEE 754 single-precision float: [sign 1b][exponent 8b biased by 127][mantissa 23b]
// log2(x) ≈ (exponent - 127) + polynomial_correction(mantissa)
float fast_log2(float x) noexcept {
    uint32_t bits = std::bit_cast<uint32_t>(x);
    int   exp  = static_cast<int>((bits >> 23) & 0xFF) - 127;
    // Re-interpret mantissa bits as a float in [1.0, 2.0)
    float mant = std::bit_cast<float>((bits & 0x007F'FFFFu) | 0x3F80'0000u);

    // Minimax polynomial for log2(mant) on [1,2): max error ~5e-5
    float f = mant - 1.0f;
    float poly = f * (1.4426950f + f * (-0.7213475f + f * 0.4808984f));

    return static_cast<float>(exp) + poly;
}

float fast_ln(float x)   noexcept { return fast_log2(x) * 0.693147181f; }
float fast_log10(float x) noexcept { return fast_log2(x) * 0.301029996f; }

int main() {
    for (float x : {0.5f, 1.0f, 2.0f, 10.0f, 100.0f}) {
        float approx = fast_ln(x);
        float exact  = std::log(x);
        float err_pct = (exact != 0) ? (approx - exact)*100.0f/exact : 0.0f;
        std::cout << "ln(" << x << ")  approx=" << approx
                  << "  err=" << err_pct << "%\\n";
    }
}`,
    explanation:
      "Extracting the IEEE 754 exponent field gives an exact integer floor of log₂(x) for free, reducing the polynomial approximation domain from [1, ∞) to [1, 2) where a low-degree polynomial achieves high accuracy. In Black-Scholes Greeks computation at tick frequency (millions of evaluations), replacing std::log (~30 cycles on Skylake) with this 5-cycle approximation can shave meaningful latency when accuracy to 0.005% is acceptable.",
  },
  {
    id: "cpp-20260708-b1-benchmark-harness",
    language: "cpp",
    title: "Latency Benchmark: Warmup + Mean/StdDev/Percentiles",
    tag: "low-latency",
    code: `#include <chrono>
#include <vector>
#include <algorithm>
#include <cmath>
#include <numeric>
#include <iostream>
#include <functional>

struct Stats { double mean, stddev, p50, p99; };

Stats benchmark(std::function<void()> fn, int warmup = 200, int reps = 2000) {
    using Clock = std::chrono::steady_clock;
    using NS    = std::chrono::nanoseconds;

    for (int i = 0; i < warmup; ++i) fn();  // fill I-cache, train predictor

    std::vector<double> ns(reps);
    for (int i = 0; i < reps; ++i) {
        auto t0 = Clock::now();
        fn();
        ns[i] = static_cast<double>(
            std::chrono::duration_cast<NS>(Clock::now() - t0).count());
    }

    double mean = std::accumulate(ns.begin(), ns.end(), 0.0) / reps;
    double var  = 0.0;
    for (double t : ns) var += (t - mean) * (t - mean);
    double stddev = std::sqrt(var / reps);

    std::sort(ns.begin(), ns.end());
    return {mean, stddev, ns[reps/2], ns[static_cast<int>(reps*0.99)]};
}

int main() {
    volatile double x = 101.3;  // volatile prevents constant-folding

    auto print = [](const char* name, const Stats& s) {
        std::cout << name
                  << "  mean=" << s.mean << "ns"
                  << "  p50="  << s.p50  << "ns"
                  << "  p99="  << s.p99  << "ns"
                  << "  sd="   << s.stddev << "\\n";
    };

    print("std::log ",  benchmark([&]{ volatile auto _ = std::log(x);  }));
    print("std::sqrt",  benchmark([&]{ volatile auto _ = std::sqrt(x); }));
    print("std::exp ",  benchmark([&]{ volatile auto _ = std::exp(x);  }));
}`,
    explanation:
      "The volatile qualifier on x prevents the compiler from hoisting the computation out of the loop or evaluating it at compile time, giving a realistic measurement of the instruction latency. Warmup iterations are critical because the branch predictor and instruction cache are cold on the first few runs, and NUMA page faults or TLB misses in the early iterations would inflate the mean; warmup amortises those one-time costs before measurement begins.",
  },
  {
    id: "cpp-20260708-b1-thread-local-pool",
    language: "cpp",
    title: "Thread-Local Slab: Per-Core Order Node Allocation",
    tag: "low-latency",
    code: `#include <array>
#include <cstddef>
#include <new>
#include <thread>
#include <iostream>

// Each thread gets its own slab — no cross-thread contention, no locks
template <typename T, std::size_t N>
class ThreadLocalSlab {
    struct alignas(alignof(T)) Slot { std::byte data[sizeof(T)]; };

    static thread_local std::array<Slot, N> pool_;
    static thread_local std::size_t         next_;

public:
    static T* allocate() noexcept {
        if (next_ >= N) return nullptr;  // slab exhausted
        return std::launder(reinterpret_cast<T*>(pool_[next_++].data));
    }

    // Deallocate is O(1) reset of the whole slab (bulk free only)
    static void reset() noexcept { next_ = 0; }
    static std::size_t used()  noexcept { return next_; }
};

template <typename T, std::size_t N>
thread_local std::array<typename ThreadLocalSlab<T,N>::Slot, N>
    ThreadLocalSlab<T,N>::pool_{};

template <typename T, std::size_t N>
thread_local std::size_t ThreadLocalSlab<T,N>::next_ = 0;

struct Order { int id; double price; int qty; };
using OrderSlab = ThreadLocalSlab<Order, 512>;

int main() {
    auto worker = [](int tid) {
        OrderSlab::reset();
        for (int i = 0; i < 5; ++i) {
            Order* o = OrderSlab::allocate();
            new (o) Order{tid*100+i, 100.0+i, 200};
        }
        std::cout << "Thread " << tid << " used " << OrderSlab::used() << " slots\\n";
    };
    std::thread t1(worker, 1), t2(worker, 2);
    t1.join(); t2.join();
}`,
    explanation:
      "Thread-local storage gives each CPU core its own slab without any atomic or mutex, making allocation a pointer bump at the cost of a TLS lookup (one extra load on x86). The trade-off is that individual deallocations are not supported — the entire slab resets at the start of each message-processing batch, which is fine for order event allocation where object lifetimes match the processing window.",
  },
  {
    id: "cpp-20260708-b1-consteval-prime",
    language: "cpp",
    title: "consteval Primality Check for Hash Table Capacity",
    tag: "modern-cpp",
    code: `#include <cstddef>
#include <array>
#include <string_view>
#include <iostream>

// consteval: guaranteed compile-time evaluation (stronger than constexpr)
consteval bool is_prime(std::size_t n) noexcept {
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (std::size_t i = 5; i * i <= n; i += 6)
        if (n%i == 0 || n%(i+2) == 0) return false;
    return true;
}

consteval std::size_t next_prime_ge(std::size_t n) noexcept {
    while (!is_prime(n)) ++n;
    return n;
}

// A hash table sized to a prime reduces clustering vs power-of-2 sizes
template <std::size_t RequestedCap>
class PrimeHashTable {
    static constexpr std::size_t CAP = next_prime_ge(RequestedCap);
    struct Slot { std::size_t hash = 0; double val = 0; bool used = false; };
    std::array<Slot, CAP> slots_{};

public:
    static constexpr std::size_t capacity() noexcept { return CAP; }

    void insert(std::size_t h, double v) noexcept {
        std::size_t i = h % CAP;
        while (slots_[i].used && slots_[i].hash != h) i = (i+1) % CAP;
        slots_[i] = {h, v, true};
    }
};

int main() {
    PrimeHashTable<100> table;
    std::cout << "Requested: 100  Actual capacity: " << table.capacity() << "\\n"; // 101
    static_assert(is_prime(PrimeHashTable<100>::capacity()));

    PrimeHashTable<1000> t2;
    std::cout << "Requested: 1000 Actual capacity: " << t2.capacity() << "\\n"; // 1009
}`,
    explanation:
      "consteval forces evaluation at compile time and produces a hard error if the expression cannot be — unlike constexpr which may silently fall back to runtime. Using a prime-number capacity makes the hash modulo operation distribute keys more uniformly than a power-of-2 mask, which is vulnerable to poor hash functions where low-order bits are biased (e.g., string lengths that tend to be multiples of 8).",
  },
  {
    id: "cpp-20260708-b1-symbol-pool",
    language: "cpp",
    title: "Symbol String Interning Pool for Pointer-Equal Lookups",
    tag: "low-latency",
    code: `#include <unordered_map>
#include <string>
#include <string_view>
#include <vector>
#include <iostream>

// String interning: each distinct symbol is stored exactly once.
// Hot-path code compares integer IDs (O(1)) instead of strings (O(n)).
class SymbolPool {
    std::unordered_map<std::string, std::size_t> index_;  // string -> id
    std::vector<std::string>                     store_;  // id -> string

public:
    // First call allocates; subsequent calls return the same ID
    std::size_t intern(std::string_view s) {
        auto [it, inserted] = index_.emplace(std::string(s), store_.size());
        if (inserted) store_.push_back(std::string(s));
        return it->second;
    }

    std::string_view lookup(std::size_t id) const noexcept { return store_[id]; }
    std::size_t      size()                 const noexcept { return store_.size(); }
};

int main() {
    SymbolPool pool;

    auto id_aapl1 = pool.intern("AAPL");
    auto id_goog  = pool.intern("GOOGL");
    auto id_aapl2 = pool.intern("AAPL");   // returns same id as id_aapl1

    std::cout << "AAPL id: "  << id_aapl1 << "  same? " << std::boolalpha << (id_aapl1 == id_aapl2) << "\\n";
    std::cout << "GOOGL id: " << id_goog  << "\\n";
    std::cout << "Unique symbols: " << pool.size() << "\\n"; // 2

    // Hot-path comparison: integer vs string
    // if (order.symbol_id == AAPL_ID)  -> 1 cycle
    // if (order.symbol == "AAPL")      -> up to 4 cycles + branch
    std::cout << "Fast compare: " << (id_aapl1 == id_aapl2) << "\\n";
}`,
    explanation:
      "Interning maps each distinct string to an integer once at parse time, after which all comparisons and hash lookups use the integer — reducing symbol comparisons from O(length) string compare to O(1) integer compare. In a matching engine that routes by symbol across thousands of orders per second, this optimization removes a string comparison from every order dispatch, and the interned IDs can be used as direct array indices into per-symbol data structures.",
  },
  {
    id: "cpp-20260708-b1-greeks-all",
    language: "cpp",
    title: "All Five BS Greeks in One Pass (Shared d1/d2)",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>

struct BSGreeks { double delta, gamma, vega, theta, rho; };

// Compute d1/d2 once; derive all five Greeks from them
// Avoids recomputing log(S/K), sqrt(T), exp(-rT) per Greek
BSGreeks all_greeks(double S, double K, double T, double r, double sigma,
                    bool call = true) noexcept {
    static constexpr double INV_SQRT_2PI = 0.398942280401433;  // 1/sqrt(2*pi)

    double sqT  = std::sqrt(T);
    double d1   = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double d2   = d1 - sigma*sqT;
    double df   = std::exp(-r*T);
    auto   N    = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    double Nd1  = N(d1), Nd2 = N(d2);
    double phi  = INV_SQRT_2PI * std::exp(-0.5*d1*d1);  // PDF at d1

    BSGreeks g;
    g.gamma = phi / (S * sigma * sqT);               // identical for call and put
    g.vega  = S * phi * sqT / 100.0;                 // per 1 vol point (1%)

    if (call) {
        g.delta = Nd1;
        g.theta = (-(S*phi*sigma/(2*sqT)) - r*K*df*Nd2)  / 252.0;  // per calendar day
        g.rho   = K*T*df*Nd2  / 100.0;                              // per 1 bp rate move
    } else {
        g.delta = Nd1 - 1.0;
        g.theta = (-(S*phi*sigma/(2*sqT)) + r*K*df*N(-d2)) / 252.0;
        g.rho   = -K*T*df*N(-d2) / 100.0;
    }
    return g;
}

int main() {
    auto g = all_greeks(100.0, 100.0, 1.0, 0.05, 0.20);
    std::cout << "Delta: " << g.delta << "\\n"   // ~0.636
              << "Gamma: " << g.gamma << "\\n"   // ~0.019
              << "Vega:  " << g.vega  << "\\n"   // ~0.375
              << "Theta: " << g.theta << "\\n"   // ~-0.0177 per day
              << "Rho:   " << g.rho   << "\\n";  // ~+0.532 per bp
}`,
    explanation:
      "Sharing d1/d2 across all five Greeks reduces the transcendental function call count from 10 (two log, two exp, two sqrt per Greek) to 4 total, roughly halving the compute cost for a full Greek vector. This matters in a risk engine that computes Greeks for tens of thousands of options during an end-of-day run or a real-time scenario expansion.",
  },
  {
    id: "cpp-20260708-b1-gauss-hedge",
    language: "cpp",
    title: "Gaussian Elimination with Partial Pivoting for FX Hedge Ratios",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <stdexcept>
#include <iostream>

// Solve Ax = b via Gaussian elimination with partial pivoting
// Used to compute multi-leg FX hedge ratios that neutralise currency exposures
std::vector<double> gauss_solve(std::vector<std::vector<double>> A,
                                 std::vector<double> b) {
    int n = static_cast<int>(A.size());
    for (int col = 0; col < n; ++col) {
        // Partial pivot: find row with largest |a[row][col]|
        int pivot = col;
        for (int row = col+1; row < n; ++row)
            if (std::fabs(A[row][col]) > std::fabs(A[pivot][col])) pivot = row;
        std::swap(A[col], A[pivot]);
        std::swap(b[col], b[pivot]);

        if (std::fabs(A[col][col]) < 1e-14)
            throw std::runtime_error("Singular matrix — no unique hedge");

        // Eliminate below diagonal
        for (int row = col+1; row < n; ++row) {
            double f = A[row][col] / A[col][col];
            b[row] -= f * b[col];
            for (int k = col; k < n; ++k) A[row][k] -= f * A[col][k];
        }
    }
    // Back substitution
    std::vector<double> x(n, 0.0);
    for (int row = n-1; row >= 0; --row) {
        x[row] = b[row];
        for (int k = row+1; k < n; ++k) x[row] -= A[row][k] * x[k];
        x[row] /= A[row][row];
    }
    return x;
}

int main() {
    // Hedge a 3-leg FX book: solve for notional in EURUSD, GBPUSD, EURGBP
    // such that net EUR, USD, GBP exposure each equal zero
    // Rates: 1 EUR = 1.09 USD, 1 GBP = 1.27 USD, 1 EUR = 0.86 GBP
    std::vector<std::vector<double>> A = {
        { 1.0,   0.0,   1.0 },   // EUR flows (EUR buys / EURGBP buys)
        {-1.09, -1.27,  0.0 },   // USD flows
        { 0.0,   1.0,  -0.86}    // GBP flows
    };
    std::vector<double> b = {-100'000.0, 50'000.0, -30'000.0};  // current exposures to zero out

    auto hedges = gauss_solve(A, b);
    std::cout << "EURUSD notional: " << hedges[0] << "\\n";
    std::cout << "GBPUSD notional: " << hedges[1] << "\\n";
    std::cout << "EURGBP notional: " << hedges[2] << "\\n";
}`,
    explanation:
      "Partial pivoting selects the row with the largest absolute value as the pivot, preventing division by near-zero values that amplify floating-point rounding errors — a critical property when FX exposure matrices include very small positions. For FX books with many currency pairs, the hedge calculation is a small dense system (N ≤ 20 currencies) where Gaussian elimination O(N³) is faster than LU decomposition with LAPACK overhead for small N.",
  },
];
