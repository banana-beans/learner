import type { Snippet } from "./types";

export const cppSnippets20260601B1: Snippet[] = [
  {
    id: "cpp-20260601-b1-mdspan",
    language: "cpp",
    title: "std::mdspan (C++23) — non-owning 2-D risk matrix view",
    tag: "stl",
    code: `#include <mdspan>   // C++23
#include <vector>
#include <print>

// std::mdspan is a non-owning, multi-dimensional view over contiguous storage.
// Zero overhead vs raw pointer arithmetic but typed as a 2-D object.
// Essential for passing NxM Greeks matrices between functions without copying.

int main() {
    // Row-major 3×4 PV01 grid (scenarios × tenors).
    std::vector<double> data(3 * 4);
    for (int i = 0; i < 12; ++i) data[i] = i * 0.5;

    // Map the flat vector as a 3-row, 4-column matrix.
    auto grid = std::mdspan(data.data(),
                            std::extents<std::size_t, 3, 4>{});

    // Named 2-D indexing — no manual row * ncols + col arithmetic.
    std::println("grid[1,2] = {}", grid[1, 2]);   // row 1, col 2

    // Slice: compute row sums (DV01 per scenario).
    for (std::size_t row = 0; row < grid.extent(0); ++row) {
        double sum = 0.0;
        for (std::size_t col = 0; col < grid.extent(1); ++col)
            sum += grid[row, col];
        std::println("scenario {} DV01 = {:.2f}", row, sum);
    }
}`,
    explanation:
      "std::mdspan provides a zero-overhead multi-dimensional view of contiguous memory without ownership transfer, making it ideal for passing risk matrices (Greeks, scenario grids) through function layers without copying. The compiler maps grid[r,c] to data[r*stride+c] with the same efficiency as raw pointer arithmetic, but the code reads like math.",
  },

  {
    id: "cpp-20260601-b1-expected",
    language: "cpp",
    title: "std::expected (C++23) — zero-exception order validation pipeline",
    tag: "error-handling",
    code: `#include <expected>   // C++23
#include <string>
#include <print>
#include <cstdint>

// std::expected<T,E> is either a value T or an error E.
// It composes with .and_then() / .transform() / .or_else()
// like a monad — validation pipelines chain without try/catch.

enum class OrderError { BadQty, BadPrice, RiskLimit, UnknownSymbol };

struct Order { std::string symbol; double price; std::int64_t qty; };

using OE = std::expected<Order, OrderError>;

OE validate_qty(Order o) {
    if (o.qty <= 0 || o.qty > 10'000)
        return std::unexpected(OrderError::BadQty);
    return o;
}

OE validate_price(Order o) {
    if (o.price <= 0.0 || o.price > 1'000'000.0)
        return std::unexpected(OrderError::BadPrice);
    return o;
}

OE check_risk(Order o) {
    double notional = o.price * static_cast<double>(o.qty);
    if (notional > 5'000'000.0)
        return std::unexpected(OrderError::RiskLimit);
    return o;
}

int main() {
    Order incoming{"AAPL", 182.50, 500};

    // Pipeline: each step only runs if previous succeeded.
    auto result = OE{incoming}
        .and_then(validate_qty)
        .and_then(validate_price)
        .and_then(check_risk);

    if (result)
        std::println("Order accepted: {} @ {:.2f} x {}",
                     result->symbol, result->price, result->qty);
    else
        std::println("Rejected, code={}", static_cast<int>(result.error()));
}`,
    explanation:
      "std::expected<T,E> encodes 'value or error' in the return type, eliminating exception overhead on the latency-critical order validation path. The monadic .and_then() chain propagates the first error automatically — the code reads as a linear validation pipeline, but no exception can be thrown and the error type is visible in the signature.",
  },

  {
    id: "cpp-20260601-b1-mpsc-queue",
    language: "cpp",
    title: "Lock-free bounded MPSC queue — multiple-producer single-consumer",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Bounded MPSC queue using a power-of-2 ring with per-slot sequence numbers.
// Producers CAS their claimed slot; consumer reads sequentially.
// No ABA problem because sequence numbers are strictly monotone.

template<typename T, std::size_t CAP>
class MpscQueue {
    static_assert((CAP & (CAP - 1)) == 0, "CAP must be a power of 2");

    struct Slot {
        std::atomic<std::size_t> seq;
        T data;
    };

    std::array<Slot, CAP>       slots_;
    std::atomic<std::size_t>    head_{0};   // next slot to produce into
    alignas(64) std::atomic<std::size_t> tail_{0};  // consumer read position

public:
    MpscQueue() {
        for (std::size_t i = 0; i < CAP; ++i)
            slots_[i].seq.store(i, std::memory_order_relaxed);
    }

    // Returns false if full.
    bool push(T val) {
        std::size_t h = head_.load(std::memory_order_relaxed);
        while (true) {
            Slot& s = slots_[h & (CAP - 1)];
            std::size_t seq = s.seq.load(std::memory_order_acquire);
            std::ptrdiff_t diff = static_cast<std::ptrdiff_t>(seq) -
                                  static_cast<std::ptrdiff_t>(h);
            if (diff == 0) {
                if (head_.compare_exchange_weak(h, h + 1,
                        std::memory_order_relaxed))
                {
                    s.data = std::move(val);
                    s.seq.store(h + 1, std::memory_order_release);
                    return true;
                }
            } else if (diff < 0) {
                return false;  // full
            } else {
                h = head_.load(std::memory_order_relaxed);
            }
        }
    }

    // Single consumer — no contention on tail_.
    std::optional<T> pop() {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        Slot& s = slots_[t & (CAP - 1)];
        std::size_t seq = s.seq.load(std::memory_order_acquire);
        if (static_cast<std::ptrdiff_t>(seq) -
            static_cast<std::ptrdiff_t>(t + 1) != 0)
            return std::nullopt;  // empty
        T val = std::move(s.data);
        s.seq.store(t + CAP, std::memory_order_release);
        tail_.store(t + 1, std::memory_order_relaxed);
        return val;
    }
};`,
    explanation:
      "The MPSC queue uses per-slot sequence numbers to coordinate multiple producers via CAS without a global lock. Producers claim a slot by incrementing head, then publish by writing seq = head+1; the single consumer polls its tail slot waiting for seq to equal tail+1. This pattern appears in the Disruptor and most HFT order-entry stacks because it avoids all kernel involvement.",
  },

  {
    id: "cpp-20260601-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list — O(1) order cancel by pointer",
    tag: "data-structures",
    code: `#include <cstdint>
#include <print>

// An intrusive list embeds prev/next pointers inside the node struct.
// This eliminates separate allocations for list nodes and enables
// O(1) removal by raw pointer — critical for order cancel: the
// exchange provides the order ID; you keep an ID→pointer map,
// look up the pointer, then unlink in O(1).

struct ListHook {
    ListHook* prev = nullptr;
    ListHook* next = nullptr;
};

template<typename T, ListHook T::* Hook>
class IntrusiveList {
    ListHook sentinel_;   // sentinel.next = first, sentinel.prev = last

public:
    IntrusiveList() { sentinel_.next = sentinel_.prev = &sentinel_; }

    void push_back(T& node) {
        ListHook* h = &(node.*Hook);
        h->prev = sentinel_.prev;
        h->next = &sentinel_;
        sentinel_.prev->next = h;
        sentinel_.prev = h;
    }

    // O(1) unlink — no scan needed.
    static void remove(T& node) {
        ListHook* h = &(node.*Hook);
        h->prev->next = h->next;
        h->next->prev = h->prev;
        h->prev = h->next = nullptr;
    }

    void print_all() const {
        for (ListHook* h = sentinel_.next; h != &sentinel_; h = h->next) {
            // Offset calculation: ptr to T from ptr to hook member.
            auto* node = reinterpret_cast<T*>(
                reinterpret_cast<char*>(h) -
                reinterpret_cast<std::ptrdiff_t>(&(static_cast<T*>(nullptr)->*Hook)));
            node->print();
        }
    }
};

struct Order {
    std::uint64_t id;
    double price;
    ListHook hook;   // embedded list hook
    void print() const { std::println("Order {} @ {:.2f}", id, price); }
};

int main() {
    IntrusiveList<Order, &Order::hook> list;
    Order o1{1, 100.0}, o2{2, 101.5}, o3{3, 99.0};
    list.push_back(o1); list.push_back(o2); list.push_back(o3);
    list.print_all();
    IntrusiveList<Order, &Order::hook>::remove(o2);  // O(1) cancel
    std::println("--- after cancel ---");
    list.print_all();
}`,
    explanation:
      "Intrusive lists store the linkage inside the payload struct, so inserting or removing an Order requires no heap allocation and no pointer chasing through a separate node. The 'offset-based' pointer recovery converts a ListHook* back to an Order* using the known member offset — a technique used in the Linux kernel and every production order book that needs O(1) cancel.",
  },

  {
    id: "cpp-20260601-b1-tagged-pointer",
    language: "cpp",
    title: "Tagged pointer — low-bit type tag for memory-efficient unions",
    tag: "low-latency",
    code: `#include <cstdint>
#include <bit>
#include <cassert>
#include <print>

// Pointers to heap objects are always aligned to at least 8 bytes,
// so the bottom 3 bits are always 0 and can be hijacked as a type tag.
// Avoids a separate discriminant word, keeping hot structs in fewer cache lines.

enum class NodeTag : uintptr_t { Limit = 0, Market = 1, Stop = 2 };

struct LimitOrder  { double price; int qty; };
struct MarketOrder { int qty; };
struct StopOrder   { double trigger; int qty; };

class TaggedPtr {
    uintptr_t raw_;
    static constexpr uintptr_t MASK = 0x7;   // 3 tag bits

public:
    template<typename T>
    TaggedPtr(T* ptr, NodeTag tag) {
        assert((reinterpret_cast<uintptr_t>(ptr) & MASK) == 0);
        raw_ = reinterpret_cast<uintptr_t>(ptr) | static_cast<uintptr_t>(tag);
    }

    NodeTag tag()  const { return static_cast<NodeTag>(raw_ & MASK); }

    template<typename T>
    T* get() const {
        return reinterpret_cast<T*>(raw_ & ~MASK);
    }
};

void dispatch(TaggedPtr p) {
    switch (p.tag()) {
        case NodeTag::Limit:
            std::println("Limit @ {:.2f} x {}", p.get<LimitOrder>()->price,
                                                 p.get<LimitOrder>()->qty); break;
        case NodeTag::Market:
            std::println("Market x {}", p.get<MarketOrder>()->qty); break;
        case NodeTag::Stop:
            std::println("Stop trigger={:.2f}", p.get<StopOrder>()->trigger); break;
    }
}

int main() {
    alignas(8) LimitOrder  lo{182.50, 100};
    alignas(8) MarketOrder mo{50};
    dispatch(TaggedPtr{&lo, NodeTag::Limit});
    dispatch(TaggedPtr{&mo, NodeTag::Market});
}`,
    explanation:
      "Pointer tagging repurposes the alignment-guaranteed zero bits to store a small integer type discriminant without a separate field, keeping the union representation to one pointer word. This pattern is used in JVMs, Lisp runtimes, and HFT message dispatch where saving 4–8 bytes per node multiplied by millions of orders measurably reduces cache pressure.",
  },

  {
    id: "cpp-20260601-b1-span-parser",
    language: "cpp",
    title: "std::span — zero-copy binary protocol frame parser",
    tag: "stl",
    code: `#include <span>
#include <cstdint>
#include <cstring>
#include <print>

// std::span is a non-owning view of contiguous data — no copy.
// For binary market data (ITCH, OUCH) we read a raw network buffer
// and hand slices to decoders without copying a byte.

#pragma pack(push, 1)
struct OuchOrderHeader {
    char     msg_type;       // 'O' = new order
    uint64_t order_token;
    char     side;           // 'B' or 'S'
    uint32_t qty;
    char     symbol[8];
    uint32_t price;          // price * 10000
    uint32_t time_in_force;
};
#pragma pack(pop)

void decode_ouch(std::span<const std::byte> frame) {
    if (frame.size() < sizeof(OuchOrderHeader)) {
        std::println("truncated frame");
        return;
    }
    OuchOrderHeader hdr;
    std::memcpy(&hdr, frame.data(), sizeof(hdr));

    // Price is in units of 0.0001 — convert to double.
    double price = __builtin_bswap32(hdr.price) / 10'000.0;
    uint32_t qty = __builtin_bswap32(hdr.qty);

    std::string sym(hdr.symbol, strnlen(hdr.symbol, 8));
    std::println("type={} sym={} side={} qty={} px={:.4f}",
                 hdr.msg_type, sym, hdr.side, qty, price);

    // Pass remaining bytes (variable trailer) downstream without copying.
    auto trailer = frame.subspan(sizeof(OuchOrderHeader));
    std::println("{} trailer bytes", trailer.size());
}`,
    explanation:
      "std::span provides a bounds-checked, non-owning view of a contiguous range, making it safe to slice protocol buffers into header and body regions without any memory allocation. The .subspan() call is O(1) — it returns a new span pointing into the same buffer — so even deeply nested decode functions incur zero copy cost.",
  },

  {
    id: "cpp-20260601-b1-fibonacci-hash",
    language: "cpp",
    title: "Fibonacci (Knuth multiplicative) hash — order ID to slot mapping",
    tag: "data-structures",
    code: `#include <cstdint>
#include <array>
#include <optional>
#include <print>

// Knuth's multiplicative hash distributes sequential keys uniformly
// across a power-of-2 table, unlike modulo on sequential IDs which
// clusters in the same few buckets.
// Constant = floor(2^64 / phi), phi = golden ratio.

constexpr uint64_t GOLDEN = 0x9e3779b97f4a7c15ULL;

template<typename V, std::size_t N>
class FibHashMap {
    static_assert((N & (N-1)) == 0, "N must be power of 2");

    struct Entry { uint64_t key; V value; bool used = false; };
    std::array<Entry, N> table_{};

    std::size_t slot(uint64_t key) const {
        return (key * GOLDEN) >> (64 - __builtin_ctzll(N));
    }

public:
    bool insert(uint64_t key, V val) {
        std::size_t s = slot(key);
        for (std::size_t i = 0; i < N; ++i) {
            auto& e = table_[(s + i) & (N-1)];
            if (!e.used || e.key == key) {
                e = {key, val, true};
                return true;
            }
        }
        return false;  // table full
    }

    std::optional<V> find(uint64_t key) const {
        std::size_t s = slot(key);
        for (std::size_t i = 0; i < N; ++i) {
            const auto& e = table_[(s + i) & (N-1)];
            if (!e.used)     return std::nullopt;
            if (e.key == key) return e.value;
        }
        return std::nullopt;
    }
};

int main() {
    FibHashMap<double, 64> map;
    // Sequential order IDs — fibonacci hash spreads them evenly.
    for (uint64_t id = 1000; id < 1016; ++id)
        map.insert(id, id * 0.5);

    auto v = map.find(1007);
    if (v) std::println("order 1007 notional = {:.2f}", *v);
}`,
    explanation:
      "Fibonacci hashing multiplies the key by the closest 64-bit integer to 2^64/φ and uses the top log2(N) bits as the bucket index. Sequential keys like order IDs differ by 1, but multiplied by the golden-ratio constant they land in completely different buckets, achieving near-ideal load distribution without a prime modulus or expensive hash function.",
  },

  {
    id: "cpp-20260601-b1-numa-mmap",
    language: "cpp",
    title: "NUMA-aware allocation via mmap + mbind",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <numaif.h>     // -lnuma
#include <numa.h>
#include <cstddef>
#include <stdexcept>
#include <print>

// On multi-socket servers, memory on a remote NUMA node costs 2–3x
// more cycles to access than local memory. mbind() forces a mapping
// to local node, eliminating remote NUMA accesses on the order book.

void* numa_alloc_local(std::size_t bytes) {
    // Reserve anonymous pages — MAP_HUGETLB optional for >2 MB.
    void* ptr = mmap(nullptr, bytes,
                     PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (ptr == MAP_FAILED)
        throw std::runtime_error("mmap failed");

    // Bind pages to the NUMA node of the calling thread.
    int node = numa_node_of_cpu(sched_getcpu());
    unsigned long nodemask = 1UL << node;
    if (mbind(ptr, bytes, MPOL_BIND,
              &nodemask, sizeof(nodemask) * 8, MPOL_MF_STRICT) != 0)
        throw std::runtime_error("mbind failed");

    return ptr;
}

void numa_free(void* ptr, std::size_t bytes) {
    munmap(ptr, bytes);
}

int main() {
    constexpr std::size_t SIZE = 4 * 1024 * 1024;  // 4 MB order book
    void* book = numa_alloc_local(SIZE);
    std::println("allocated {} MB on local NUMA node", SIZE >> 20);
    numa_free(book, SIZE);
}`,
    explanation:
      "On a 2-socket server, accessing DRAM on the remote socket adds ~70 ns vs ~35 ns for local memory. mbind(MPOL_BIND) forces the OS to allocate physical pages only from the calling thread's local NUMA node, guaranteeing lowest-latency memory access for the order book. This matters most for buffers > L3 cache size (typically 8–32 MB) that spill to DRAM every market-data burst.",
  },

  {
    id: "cpp-20260601-b1-prefetch",
    language: "cpp",
    title: "__builtin_prefetch — software prefetch for order book traversal",
    tag: "low-latency",
    code: `#include <cstdint>
#include <vector>
#include <print>

// Cache miss dominates latency when walking pointer-linked structures.
// __builtin_prefetch(addr, rw, locality) issues a non-blocking hint to
// the hardware to start loading addr into cache before it is needed.
// Effective when the access pattern is predictable N iterations ahead.

struct PriceLevel {
    double  price;
    int64_t qty;
    PriceLevel* next = nullptr;   // linked list of levels
};

// Walk linked order levels summing qty; prefetch 2 nodes ahead.
int64_t sum_levels(PriceLevel* head) {
    int64_t total = 0;
    PriceLevel* cur = head;
    // Prime the prefetch pipeline with the next-next node.
    if (cur && cur->next)
        __builtin_prefetch(cur->next->next, 0 /*read*/, 1 /*L2*/);

    while (cur) {
        // Issue prefetch two hops ahead so hardware starts fetching
        // while we process the current node.
        if (cur->next && cur->next->next)
            __builtin_prefetch(cur->next->next->next, 0, 1);

        total += cur->qty;
        cur = cur->next;
    }
    return total;
}

// For array traversal, prefetch STRIDE elements ahead.
int64_t sum_array(const std::vector<int64_t>& v) {
    constexpr int STRIDE = 8;   // 8 * 8 bytes = one cache line ahead
    int64_t total = 0;
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (i + STRIDE < v.size())
            __builtin_prefetch(&v[i + STRIDE], 0, 1);
        total += v[i];
    }
    return total;
}`,
    explanation:
      "__builtin_prefetch issues an L1/L2 prefetch hint that overlaps memory latency (~100 ns DRAM) with computation, hiding the cost when you know N iterations ahead where you will read. The locality parameter 0–3 controls whether the line is pulled into L1 (3), L2 (2/1), or L3 (0) — for large linked structures L2 (1) avoids polluting L1 with nodes you only touch once.",
  },

  {
    id: "cpp-20260601-b1-bitops",
    language: "cpp",
    title: "std::bit_ceil / std::popcount — bitmask portfolio set operations",
    tag: "bit-manipulation",
    code: `#include <bit>       // C++20: std::popcount, std::bit_ceil, std::countr_zero
#include <cstdint>
#include <print>

// Model a portfolio as a bitmask where bit i = 1 means position i is open.
// Set operations (union, intersection, difference) are single instructions.
// popcount counts open positions; bit_ceil finds next power-of-2 bucket size.

using PortfolioMask = std::uint64_t;   // up to 64 positions

struct PortfolioOps {
    // Number of open positions.
    static int size(PortfolioMask m)               { return std::popcount(m); }
    // Is position i open?
    static bool has(PortfolioMask m, int i)        { return (m >> i) & 1; }
    // Add / remove / toggle position i.
    static PortfolioMask add(PortfolioMask m, int i)    { return m | (1ULL << i); }
    static PortfolioMask remove(PortfolioMask m, int i) { return m & ~(1ULL << i); }
    // Shared positions (intersection).
    static PortfolioMask shared(PortfolioMask a, PortfolioMask b) { return a & b; }
    // Any overlap (e.g., two books share a risk factor)?
    static bool overlaps(PortfolioMask a, PortfolioMask b) { return (a & b) != 0; }
    // Index of lowest open position (first priority).
    static int first(PortfolioMask m) { return std::countr_zero(m); }
    // Round capacity up to next power of 2 for hash table sizing.
    static std::size_t bucket_size(std::size_t n) { return std::bit_ceil(n); }
};

int main() {
    PortfolioMask desk_a = 0b1011'0110;   // positions 1,2,4,6,7 open
    PortfolioMask desk_b = 0b0110'1100;   // positions 2,3,5,6 open

    std::println("desk_a size   = {}", PortfolioOps::size(desk_a));
    std::println("shared pos    = {:08b}", PortfolioOps::shared(desk_a, desk_b));
    std::println("first in a    = {}", PortfolioOps::first(desk_a));
    std::println("bucket(5)     = {}", PortfolioOps::bucket_size(5));   // 8
}`,
    explanation:
      "Bitmask portfolio representations compress 64 open/closed flags into one 64-bit word, turning intersection ('do these desks share risk factors?') into a single AND instruction. std::popcount, std::countr_zero, and std::bit_ceil all compile to single CPU instructions (POPCNT, BSF/TZCNT, LZCNT/BSR) on x86-64, making bulk portfolio queries essentially free compared to scanning individual booleans.",
  },

  {
    id: "cpp-20260601-b1-mmap-replay",
    language: "cpp",
    title: "mmap() tick data file replay — zero-copy historical read",
    tag: "systems",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <print>

// Memory-mapping a tick file avoids read() syscall overhead and lets the
// OS page-fault pages in on demand. The kernel can read-ahead efficiently
// and evict cold pages — optimal for sequential replay of large tick files.

#pragma pack(push, 1)
struct TickRecord {
    uint64_t timestamp_ns;
    char     symbol[8];
    double   price;
    uint32_t qty;
};
#pragma pack(pop)

class TickReplayer {
    int    fd_   = -1;
    void*  map_  = MAP_FAILED;
    size_t size_ = 0;

public:
    explicit TickReplayer(const char* path) {
        fd_ = open(path, O_RDONLY);
        if (fd_ < 0) throw std::runtime_error("open failed");

        struct stat st;
        fstat(fd_, &st);
        size_ = static_cast<size_t>(st.st_size);

        map_ = mmap(nullptr, size_, PROT_READ, MAP_SHARED | MAP_POPULATE, fd_, 0);
        if (map_ == MAP_FAILED) throw std::runtime_error("mmap failed");

        // Hint to kernel: we will read sequentially.
        madvise(map_, size_, MADV_SEQUENTIAL);
    }

    void replay(auto callback) const {
        const auto* base  = static_cast<const TickRecord*>(map_);
        std::size_t count = size_ / sizeof(TickRecord);
        for (std::size_t i = 0; i < count; ++i)
            callback(base[i]);
    }

    ~TickReplayer() {
        if (map_ != MAP_FAILED) munmap(map_, size_);
        if (fd_ >= 0)           close(fd_);
    }
};`,
    explanation:
      "mmap() maps a file into the virtual address space so reads become page faults handled by the OS rather than explicit read() syscalls. MADV_SEQUENTIAL tells the kernel to aggressively read-ahead, saturating I/O bandwidth. For tick file replay this avoids all userspace buffering code and achieves near-disk-bandwidth throughput — typically 1–3 GB/s sequential on NVMe.",
  },

  {
    id: "cpp-20260601-b1-epoll-mux",
    language: "cpp",
    title: "epoll — single-threaded market data feed multiplexer",
    tag: "systems",
    code: `#include <sys/epoll.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <fcntl.h>
#include <array>
#include <stdexcept>
#include <print>

// epoll_wait() returns only the fds that are ready — O(active) not O(all).
// A single thread can multiplex hundreds of market data feeds without
// any thread-per-feed overhead or kernel poll() scan of all descriptors.

static void set_nonblocking(int fd) {
    int flags = fcntl(fd, F_GETFL, 0);
    fcntl(fd, F_SETFL, flags | O_NONBLOCK);
}

class EpollMux {
    int epfd_;

public:
    explicit EpollMux() {
        epfd_ = epoll_create1(EPOLL_CLOEXEC);
        if (epfd_ < 0) throw std::runtime_error("epoll_create1 failed");
    }

    void add(int fd) {
        set_nonblocking(fd);
        epoll_event ev{};
        ev.events  = EPOLLIN | EPOLLET;  // edge-triggered: fire once per arrival
        ev.data.fd = fd;
        epoll_ctl(epfd_, EPOLL_CTL_ADD, fd, &ev);
    }

    // Dispatch loop — process up to max_events ready fds per call.
    void run_once(int timeout_ms, auto handler) {
        std::array<epoll_event, 64> events;
        int n = epoll_wait(epfd_, events.data(), events.size(), timeout_ms);
        for (int i = 0; i < n; ++i)
            handler(events[i].data.fd, events[i].events);
    }

    ~EpollMux() { close(epfd_); }
};

// Usage sketch — attach UDP feed sockets and process in one thread.
// EpollMux mux;
// mux.add(feed_socket_1); mux.add(feed_socket_2);
// while (running) mux.run_once(1, [](int fd, uint32_t) { read_tick(fd); });`,
    explanation:
      "epoll with edge-triggered mode (EPOLLET) scales to thousands of file descriptors with O(active) wake-up cost because the kernel only returns fds that actually received data. A single event loop thread can drain all market-data feeds sequentially without per-feed thread context switches — the Linux HFT standard for managing concurrent UDP/TCP data streams.",
  },

  {
    id: "cpp-20260601-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson FD scheme — Black-Scholes PDE on uniform grid",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <print>

// Crank-Nicolson (CN) is second-order accurate in both space and time.
// It averages the explicit (forward) and implicit (backward) Euler discretizations:
//   (u^{n+1} - u^n)/dt = 0.5*(L u^n + L u^{n+1})
// Result: tridiagonal system solved by Thomas algorithm each time step.

struct CNParams {
    double S0, K, r, sigma, T;
    int    N_S, N_t;   // space and time grid points
};

double cn_european_put(CNParams p) {
    double S_max = 4.0 * p.K;
    double dS    = S_max / p.N_S;
    double dt    = p.T   / p.N_t;
    double nu    = p.sigma * p.sigma;

    std::vector<double> V(p.N_S + 1), a(p.N_S + 1), b(p.N_S + 1), c(p.N_S + 1);

    // Initial condition: put payoff at T.
    for (int i = 0; i <= p.N_S; ++i)
        V[i] = std::max(p.K - i * dS, 0.0);

    for (int t = 0; t < p.N_t; ++t) {
        // Build tridiagonal coefficients (Thomas algorithm).
        for (int i = 1; i < p.N_S; ++i) {
            double S  = i * dS;
            double ai = 0.25 * dt * (nu * i * i - p.r * i);
            double bi = -0.5 * dt * (nu * i * i + p.r);
            double ci = 0.25 * dt * (nu * i * i + p.r * i);
            a[i] = -ai;
            b[i] = 1.0 - bi;
            c[i] = -ci;
            // RHS combines explicit (current) and implicit (next) contributions.
            V[i] = ai * V[i-1] + (1.0 + bi) * V[i] + ci * V[i+1];
        }
        // Boundary conditions for put: V(0)=K*exp(-r*(T-t)), V(S_max)=0.
        V[0]     = p.K * std::exp(-p.r * (p.T - (t+1)*dt));
        V[p.N_S] = 0.0;

        // Thomas (tridiagonal) forward sweep.
        for (int i = 2; i < p.N_S; ++i) {
            double m = a[i] / b[i-1];
            b[i] -= m * c[i-1];
            V[i] -= m * V[i-1];
        }
        // Back substitution.
        V[p.N_S - 1] /= b[p.N_S - 1];
        for (int i = p.N_S - 2; i >= 1; --i)
            V[i] = (V[i] - c[i] * V[i+1]) / b[i];
    }

    // Interpolate V at S0.
    int idx = static_cast<int>(p.S0 / dS);
    double frac = (p.S0 - idx * dS) / dS;
    return V[idx] * (1.0 - frac) + V[idx + 1] * frac;
}

int main() {
    CNParams p{100.0, 100.0, 0.05, 0.20, 1.0, 200, 1000};
    std::println("CN put price = {:.4f}", cn_european_put(p));
    // BSM: ~10.45
}`,
    explanation:
      "Crank-Nicolson achieves O(Δt²) time accuracy by averaging the explicit and implicit operators, eliminating the stability constraint Δt ≤ Δx²/σ² that limits explicit Euler to tiny steps. The cost is one Thomas tridiagonal solve per time step — O(N) — making the full grid O(N×M). CN is the industry-standard for 1-factor PDE pricers because it balances accuracy, stability, and simplicity.",
  },

  {
    id: "cpp-20260601-b1-antithetic",
    language: "cpp",
    title: "Antithetic variates MC — variance reduction for European options",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <print>

// Antithetic variates: for each path driven by Z ~ N(0,1), also run
// the path driven by -Z. If f(Z) + f(-Z) is less variable than 2*f(Z),
// variance is reduced. For a call option, Cov[f(Z), f(-Z)] < 0 guarantees
// a reduction — the gain is typically 50–90% fewer paths for the same SE.

double call_antithetic(double S0, double K, double r,
                       double sigma, double T, int N, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double sqrtT = std::sqrt(T);
    double drift = (r - 0.5 * sigma * sigma) * T;
    double sum   = 0.0;

    for (int i = 0; i < N; ++i) {
        double Z  = nd(rng);
        // Primal path.
        double ST1 = S0 * std::exp(drift + sigma * sqrtT * Z);
        // Antithetic path: replace Z with -Z.
        double ST2 = S0 * std::exp(drift - sigma * sqrtT * Z);

        double payoff1 = std::max(ST1 - K, 0.0);
        double payoff2 = std::max(ST2 - K, 0.0);
        sum += 0.5 * (payoff1 + payoff2);  // average of pair
    }

    return std::exp(-r * T) * sum / N;
}

double call_plain(double S0, double K, double r,
                  double sigma, double T, int N, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double sqrtT = std::sqrt(T), drift = (r - 0.5*sigma*sigma)*T, sum = 0;
    for (int i = 0; i < N; ++i) {
        double ST = S0 * std::exp(drift + sigma * sqrtT * nd(rng));
        sum += std::max(ST - K, 0.0);
    }
    return std::exp(-r*T) * sum / N;
}

int main() {
    // ATM call: S=K=100, r=5%, σ=20%, T=1yr. BSM ≈ 10.45.
    int N = 10'000;
    std::println("Plain MC  (N={}): {:.4f}", N, call_plain(100,100,0.05,0.20,1,N));
    std::println("Antithetic(N={}): {:.4f}", N, call_antithetic(100,100,0.05,0.20,1,N));
    // Antithetic typically needs ~25% of paths to reach same accuracy.
}`,
    explanation:
      "Antithetic variates exploit the negative correlation Cov[C(Z), C(-Z)] < 0 that exists for any monotone payoff (calls are increasing in the terminal stock price, so symmetrically flipping the Brownian increment reverses the overestimate). Pairing each path with its mirror halves the variance estimate, equivalent to doubling the sample size — and it costs only one extra exponential per pair.",
  },

  {
    id: "cpp-20260601-b1-barrier-mc",
    language: "cpp",
    title: "Knock-out barrier option Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <print>

// Knock-out call: pays max(S_T - K, 0) only if S never crossed barrier B
// from below during [0,T]. Continuous monitoring requires many time steps
// (or Brownian bridge correction for interpolated monitoring).

double ko_call_mc(double S0, double K, double B,  // B > S0 for up-and-out
                  double r, double sigma, double T,
                  int N_paths, int N_steps, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt    = T / N_steps;
    double sqrdt = std::sqrt(dt);
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double disc  = std::exp(-r * T);
    double sum   = 0.0;

    for (int p = 0; p < N_paths; ++p) {
        double S = S0;
        bool knocked = false;

        for (int s = 0; s < N_steps; ++s) {
            S *= std::exp(drift + sigma * sqrdt * nd(rng));
            if (S >= B) { knocked = true; break; }  // barrier breached
        }

        if (!knocked)
            sum += std::max(S - K, 0.0);
    }

    return disc * sum / N_paths;
}

int main() {
    // Up-and-out call: S=100, K=100, B=120, r=5%, σ=20%, T=1yr.
    double price = ko_call_mc(100, 100, 120, 0.05, 0.20, 1.0,
                              100'000, 252);
    std::println("KO call price = {:.4f}", price);
    // Vanilla call ≈ 10.45; barrier reduces it significantly.
}`,
    explanation:
      "A knock-out barrier option is worthless if the underlying ever crosses the barrier, so plain Black-Scholes underprices it — you must simulate path continuity. Daily step count matches actual monitoring frequency, but for continuous barriers a Brownian bridge correction multiplies survival probability by exp(-2 ln(B/S)·ln(B/S_next)/(σ²dt)) to account for the chance of crossing and coming back within a single step.",
  },

  {
    id: "cpp-20260601-b1-lookback-mc",
    language: "cpp",
    title: "Floating-strike lookback option Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <print>

// Floating-strike lookback call: payoff = S_T - min(S_t, 0<=t<=T).
// Closed-form exists (Goldman-Sosin-Gatto) but MC illustrates path
// dependence: you must track the running minimum across all steps.

double lookback_call_mc(double S0, double r, double sigma, double T,
                        int N_paths, int N_steps, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt    = T / N_steps;
    double sqrdt = std::sqrt(dt);
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double disc  = std::exp(-r * T);
    double sum   = 0.0;

    for (int p = 0; p < N_paths; ++p) {
        double S   = S0;
        double Smin = S0;   // running minimum

        for (int s = 0; s < N_steps; ++s) {
            S *= std::exp(drift + sigma * sqrdt * nd(rng));
            Smin = std::min(Smin, S);
        }

        sum += S - Smin;   // floating-strike payoff: always >= 0
    }

    return disc * sum / N_paths;
}

int main() {
    // S=100, r=5%, σ=20%, T=1yr. Closed-form ≈ 17.68.
    double price = lookback_call_mc(100, 0.05, 0.20, 1.0, 200'000, 252);
    std::println("Lookback call price = {:.4f}", price);
}`,
    explanation:
      "Lookback options are path-dependent because their payoff depends on the extremum of the path, requiring either fine time-step simulation or the exact Goldman-Sosin-Gatto formula. The floating-strike lookback call always expires in-the-money (S_T ≥ S_min by construction), making it one of the most expensive vanilla path-dependent exotics — roughly 1.5× an ATM call at typical parameters.",
  },

  {
    id: "cpp-20260601-b1-fold-expr",
    language: "cpp",
    title: "Fold expressions — compile-time Greek aggregation over parameter pack",
    tag: "templates",
    code: `#include <print>
#include <concepts>
#include <array>

// C++17 fold expressions collapse a parameter pack with an operator.
// For a quant library: aggregate Greeks from N option legs in a
// portfolio using a single variadic call — zero overhead vs manual loop.

struct Greeks {
    double delta = 0, gamma = 0, vega = 0, theta = 0;
    Greeks operator+(const Greeks& o) const {
        return {delta+o.delta, gamma+o.gamma, vega+o.vega, theta+o.theta};
    }
};

// Fold over + operator: sum all Greeks from all legs.
template<typename... Legs>
    requires (std::same_as<Legs, Greeks> && ...)
Greeks aggregate(Legs... legs) {
    return (legs + ...);   // right fold: legs0 + (legs1 + (...))
}

// Fold to check if any leg has delta > threshold.
template<typename... Legs>
bool any_large_delta(double thr, Legs... legs) {
    return ((std::abs(legs.delta) > thr) || ...);  // short-circuit OR fold
}

// Fold to print all legs.
template<typename... Legs>
void print_all(const Legs&... legs) {
    int i = 0;
    (std::println("leg {}: Δ={:.3f} Γ={:.4f}", i++, legs.delta, legs.gamma), ...);
}

int main() {
    Greeks call1{0.55, 0.02, 0.30, -0.05};
    Greeks put1 {-0.45, 0.02, 0.30, -0.05};
    Greeks call2{0.30, 0.01, 0.15, -0.03};

    auto net = aggregate(call1, put1, call2);
    std::println("Net: Δ={:.3f} Γ={:.4f} ν={:.3f} Θ={:.4f}",
                 net.delta, net.gamma, net.vega, net.theta);

    print_all(call1, put1, call2);
    std::println("any large delta: {}", any_large_delta(0.5, call1, put1, call2));
}`,
    explanation:
      "Fold expressions turn a variadic parameter pack into a single expression without writing a recursive template, generating the same assembly as a manual loop while keeping the call site readable. For a multi-leg portfolio the compiler unrolls the fold at compile time — zero branches, zero virtual dispatch — achieving the same throughput as hand-written aggregation code.",
  },

  {
    id: "cpp-20260601-b1-dual-number",
    language: "cpp",
    title: "Dual numbers — forward-mode automatic differentiation for Greeks",
    tag: "numerics",
    code: `#include <cmath>
#include <print>

// A dual number d = (v, d') carries a value and its derivative.
// Arithmetic rules propagate derivatives automatically (chain rule).
// if constexpr selects the scalar path when the derivative is unused.

template<typename T = double>
struct Dual {
    T val, dot;   // value and directional derivative
    Dual(T v, T d = 0) : val(v), dot(d) {}

    Dual operator+(Dual o) const { return {val+o.val, dot+o.dot}; }
    Dual operator-(Dual o) const { return {val-o.val, dot-o.dot}; }
    Dual operator*(Dual o) const { return {val*o.val, val*o.dot+dot*o.val}; }
    Dual operator/(Dual o) const {
        return {val/o.val, (dot*o.val - val*o.dot)/(o.val*o.val)};
    }
};

template<typename T>
Dual<T> exp(Dual<T> x) { T e = std::exp(x.val); return {e, e*x.dot}; }
template<typename T>
Dual<T> log(Dual<T> x) { return {std::log(x.val), x.dot/x.val}; }
template<typename T>
Dual<T> sqrt(Dual<T> x) {
    T s = std::sqrt(x.val); return {s, x.dot/(2.0*s)};
}

// Black-Scholes call implemented with Dual<> — delta is the automatic output.
#include <numbers>

double norm_cdf(double x) {
    return 0.5 * std::erfc(-x / std::numbers::sqrt2);
}

template<typename T>
T bs_call(T S, double K, double r, double sigma, double t) {
    using std::log; using std::sqrt; using std::exp;
    T d1 = (log(S/K) + (r + 0.5*sigma*sigma)*t) / (sigma * std::sqrt(t));
    T d2 = d1 - sigma * std::sqrt(t);
    // norm_cdf only works on scalars here — use erfc approximation inline.
    double N1 = norm_cdf(d1.val), N2 = norm_cdf(d2.val);
    return S * N1 - K * std::exp(-r*t) * N2;
}

int main() {
    // Seed the dual number at S: Dual{S, 1} means "differentiate w.r.t. S".
    Dual<double> S{100.0, 1.0};
    auto price = bs_call(S, 100.0, 0.05, 0.20, 1.0);
    std::println("price = {:.4f}, delta (AD) = {:.4f}", price.val, price.dot);
    // Analytic delta ≈ 0.6368
}`,
    explanation:
      "Forward-mode AD using dual numbers computes the exact derivative of any smooth function at machine precision in a single forward pass — no finite-difference error, no symbolic algebra. The trick is wrapping the scalar you differentiate with respect to (S) in a Dual where dot=1; all subsequent arithmetic propagates the derivative via the chain rule automatically, so you get price and delta simultaneously.",
  },

  {
    id: "cpp-20260601-b1-pq-comparator",
    language: "cpp",
    title: "Custom std::priority_queue comparator — price-time priority matching",
    tag: "data-structures",
    code: `#include <queue>
#include <string>
#include <cstdint>
#include <print>

// Exchange matching engines sort orders by price first, then by arrival time
// (sequence number) for equal-price orders — FIFO within a price level.

struct Order {
    double   price;
    uint64_t seq;      // monotone arrival counter
    uint32_t qty;
    char     side;     // 'B' or 'S'
};

// Bids: highest price first; for equal price, lowest seq first (oldest first).
struct BidComp {
    bool operator()(const Order& a, const Order& b) const {
        if (a.price != b.price) return a.price < b.price;  // higher price = higher priority
        return a.seq > b.seq;   // lower seq (older) = higher priority
    }
};

// Asks: lowest price first; for equal price, lowest seq first.
struct AskComp {
    bool operator()(const Order& a, const Order& b) const {
        if (a.price != b.price) return a.price > b.price;  // lower price = higher priority
        return a.seq > b.seq;
    }
};

int main() {
    std::priority_queue<Order, std::vector<Order>, BidComp> bids;
    std::priority_queue<Order, std::vector<Order>, AskComp> asks;

    bids.push({100.0, 1, 200, 'B'});
    bids.push({100.5, 2, 100, 'B'});
    bids.push({100.0, 3, 150, 'B'});  // same price as first, later arrival

    std::println("Bid queue (best first):");
    while (!bids.empty()) {
        auto o = bids.top(); bids.pop();
        std::println("  px={:.2f} seq={} qty={}", o.price, o.seq, o.qty);
    }
    // Expected: 100.50 (best price), 100.00/seq1, 100.00/seq3 (FIFO)
}`,
    explanation:
      "std::priority_queue's third template argument is the comparator; returning true means 'a has lower priority than b', so the heap's top() is the element where comp returns false for all others. Price-time priority requires a two-level comparison: price dominates, then sequence number breaks ties within a price level, implementing the FIFO queue that every exchange uses within a price bucket.",
  },

  {
    id: "cpp-20260601-b1-branchless-clamp",
    language: "cpp",
    title: "Branchless min/max and clamp — avoiding branch misprediction in tick rounding",
    tag: "low-latency",
    code: `#include <cstdint>
#include <print>
#include <bit>

// On a branch-predictor-saturated hot path, even a predictable branch
// can add 1–3 ns due to pipeline flush on occasional misses. Branchless
// arithmetic uses arithmetic shifts + masks to avoid conditional jumps.

// Branchless integer min: returns a if a < b, else b.
// Works for signed 64-bit; the arithmetic shift replicates the sign bit.
inline int64_t branchless_min(int64_t a, int64_t b) {
    int64_t diff = a - b;                      // diff < 0 if a < b
    int64_t mask = diff >> 63;                 // all 1s if diff < 0, else all 0s
    return b + (diff & mask);                  // b if a>=b, else b+(a-b)=a
}

inline int64_t branchless_max(int64_t a, int64_t b) {
    int64_t diff = b - a;
    int64_t mask = diff >> 63;
    return a + (diff & ~mask);  // a if a>=b, else a+(b-a)=b
}

inline int64_t branchless_clamp(int64_t v, int64_t lo, int64_t hi) {
    return branchless_min(branchless_max(v, lo), hi);
}

// Tick rounding: round price (in ticks * 10000) to nearest tick size.
// e.g., tick_size = 5 → prices are multiples of 0.0005
int64_t round_to_tick(int64_t price_scaled, int64_t tick_scaled) {
    // Branchless: (price + tick/2) / tick * tick
    return ((price_scaled + tick_scaled / 2) / tick_scaled) * tick_scaled;
}

int main() {
    std::println("min(3,5)  = {}", branchless_min(3, 5));
    std::println("max(3,5)  = {}", branchless_max(3, 5));
    std::println("clamp(-2,0,10) = {}", branchless_clamp(-2, 0, 10));
    // Round 182.5213 to tick 0.0005: 182.5210
    int64_t price_raw = 1'825'213;   // 182.5213 * 10000
    int64_t tick_raw  = 5;           // 0.0005 * 10000
    std::println("rounded = {:.4f}", round_to_tick(price_raw, tick_raw) / 10000.0);
}`,
    explanation:
      "Arithmetic-shift branchless min/max avoids any conditional jump by exploiting the sign bit: shifting a negative difference right by 63 produces an all-ones mask, which selects one operand or the other via bitwise AND without branching. In tight loops like tick-normalisation on every order, eliminating even occasional branch misses (≈15 cycles each) measurably reduces tail latency.",
  },

  {
    id: "cpp-20260601-b1-cpuid-dispatch",
    language: "cpp",
    title: "Runtime CPUID dispatch — AVX vs scalar path selection",
    tag: "low-latency",
    code: `#include <cpuid.h>   // GCC/Clang: __cpuid / __get_cpuid_count
#include <cstdint>
#include <print>
#include <immintrin.h>  // AVX intrinsics

// At startup, detect CPU features once and store a function pointer.
// All subsequent hot-path calls go through the pointer without any
// branch — the indirect call is predicted perfectly as it never changes.

struct CpuFeatures {
    bool avx2 = false;
    bool avx512f = false;
};

static CpuFeatures detect_features() {
    CpuFeatures f;
    uint32_t eax, ebx, ecx, edx;
    if (__get_cpuid_count(7, 0, &eax, &ebx, &ecx, &edx)) {
        f.avx2    = (ebx >> 5)  & 1;
        f.avx512f = (ebx >> 16) & 1;
    }
    return f;
}

// Vectorised dot product (AVX2: 8 floats at once).
static double dot_avx2(const float* a, const float* b, int n) {
    __m256 acc = _mm256_setzero_ps();
    int i = 0;
    for (; i <= n - 8; i += 8) {
        __m256 va = _mm256_loadu_ps(a + i);
        __m256 vb = _mm256_loadu_ps(b + i);
        acc = _mm256_fmadd_ps(va, vb, acc);
    }
    float buf[8]; _mm256_storeu_ps(buf, acc);
    double s = buf[0]+buf[1]+buf[2]+buf[3]+buf[4]+buf[5]+buf[6]+buf[7];
    for (; i < n; ++i) s += a[i] * b[i];
    return s;
}

static double dot_scalar(const float* a, const float* b, int n) {
    double s = 0;
    for (int i = 0; i < n; ++i) s += a[i] * b[i];
    return s;
}

// Function pointer set once at init.
using DotFn = double(*)(const float*, const float*, int);

static DotFn select_dot() {
    auto f = detect_features();
    if (f.avx2) { std::println("[init] AVX2 dot product"); return dot_avx2; }
    std::println("[init] scalar dot product");
    return dot_scalar;
}

static const DotFn dot_product = select_dot();

int main() {
    float a[16]{}, b[16]{};
    for (int i = 0; i < 16; ++i) { a[i] = i; b[i] = 1.0f; }
    std::println("dot = {:.1f}", dot_product(a, b, 16));  // 0+1+...+15=120
}`,
    explanation:
      "CPUID dispatch queries processor feature flags once at program startup and stores the fastest available implementation in a function pointer. All subsequent calls use the same pointer, which the branch predictor trivially memorises as a fixed target. The pattern avoids compile-time /arch flags — the same binary runs on any x86-64 and accelerates automatically on machines with AVX2 or AVX-512.",
  },

  {
    id: "cpp-20260601-b1-variant-visit",
    language: "cpp",
    title: "std::variant + std::visit — zero-overhead polymorphic market event dispatch",
    tag: "stl",
    code: `#include <variant>
#include <string>
#include <print>
#include <cstdint>

// std::variant is a type-safe discriminated union.
// std::visit dispatches to the correct overload at the cost of one
// indirect branch — cheaper than virtual dispatch (no vtable pointer,
// no heap allocation, inlineable handlers).

struct NewOrder   { uint64_t id; char side; double price; uint32_t qty; };
struct CancelOrder{ uint64_t id; };
struct Trade      { uint64_t bid_id, ask_id; double price; uint32_t qty; };
struct BookUpdate { double bid, ask; uint32_t bid_qty, ask_qty; };

using MarketEvent = std::variant<NewOrder, CancelOrder, Trade, BookUpdate>;

struct EventHandler {
    // Overloaded call operator — one per variant alternative.
    void operator()(const NewOrder& o) const {
        std::println("[NEW]    id={} {} {} @ {:.2f}", o.id, o.side, o.qty, o.price);
    }
    void operator()(const CancelOrder& c) const {
        std::println("[CANCEL] id={}", c.id);
    }
    void operator()(const Trade& t) const {
        std::println("[TRADE]  {} @ {:.2f}", t.qty, t.price);
    }
    void operator()(const BookUpdate& b) const {
        std::println("[BOOK]   {:.2f}x{} / {:.2f}x{}", b.bid, b.bid_qty, b.ask, b.ask_qty);
    }
};

int main() {
    std::vector<MarketEvent> feed{
        NewOrder{1001, 'B', 182.50, 100},
        BookUpdate{182.50, 182.55, 100, 200},
        Trade{1001, 2002, 182.52, 50},
        CancelOrder{1001},
    };

    EventHandler h;
    for (const auto& ev : feed)
        std::visit(h, ev);   // dispatches to correct operator() at runtime
}`,
    explanation:
      "std::variant stores exactly one of its listed types in-place with a discriminant index. std::visit compiles to a jump table (one indirect branch) over the alternatives — equivalent to a manual switch on the discriminant but type-safe. For market data event dispatch this is measurably faster than virtual dispatch because there is no heap allocation, no vtable pointer load, and the handlers can be fully inlined.",
  },

  {
    id: "cpp-20260601-b1-cir-sim",
    language: "cpp",
    title: "CIR short-rate model — Euler-Maruyama Monte Carlo simulation",
    tag: "finance",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <print>

// Cox-Ingersoll-Ross: dr = kappa*(theta-r)*dt + sigma*sqrt(r)*dW
// Mean-reverting; guaranteed non-negative if 2*kappa*theta >= sigma^2 (Feller).
// Discount factor for ZCB: average of exp(-integral r dt) over paths.

double cir_zcb_mc(double r0, double kappa, double theta, double sigma,
                  double T, int N_paths, int N_steps, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt    = T / N_steps;
    double sqrdt = std::sqrt(dt);
    double sum   = 0.0;

    for (int p = 0; p < N_paths; ++p) {
        double r   = r0;
        double acc = 0.0;

        for (int s = 0; s < N_steps; ++s) {
            // Reflect at zero to keep r non-negative (simple fix).
            r = std::max(r + kappa*(theta-r)*dt
                         + sigma*std::sqrt(std::max(r,0.0))*sqrdt*nd(rng), 0.0);
            acc += r * dt;
        }
        sum += std::exp(-acc);
    }

    return sum / N_paths;
}

// Analytic CIR bond price (A-B formula for verification).
double cir_zcb_analytic(double r0, double kappa, double theta,
                        double sigma, double T) {
    double h = std::sqrt(kappa*kappa + 2.0*sigma*sigma);
    double A = std::pow(
        2.0*h*std::exp(0.5*(kappa+h)*T) /
        (2.0*h + (kappa+h)*(std::exp(h*T)-1.0)), 2.0*kappa*theta/(sigma*sigma));
    double B = 2.0*(std::exp(h*T)-1.0) /
               (2.0*h + (kappa+h)*(std::exp(h*T)-1.0));
    return A * std::exp(-B * r0);
}

int main() {
    // kappa=0.5, theta=0.05, sigma=0.1, r0=0.05, T=1yr
    double mc  = cir_zcb_mc(0.05, 0.5, 0.05, 0.1, 1.0, 500'000, 252);
    double ana = cir_zcb_analytic(0.05, 0.5, 0.05, 0.1, 1.0);
    std::println("MC ZCB = {:.5f}  Analytic = {:.5f}", mc, ana);
}`,
    explanation:
      "The CIR model ensures non-negative rates by making the diffusion coefficient proportional to √r — the variance drops to zero as r approaches zero, preventing it from going negative. The Feller condition 2κθ ≥ σ² ensures the boundary at zero is never reached, but in Euler-Maruyama we still apply reflection as a robustness guard. Analytic bond prices use the affine A-B formula as a ground-truth check for MC convergence.",
  },

  {
    id: "cpp-20260601-b1-trinomial-tree",
    language: "cpp",
    title: "Trinomial tree — European option pricing",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <print>

// Trinomial tree: at each step, S moves to S*u, S*d, or S (with prob pu,pd,pm).
// More accurate than binomial for same N because it has 2N+1 nodes per
// layer vs N+1, and the extra degree of freedom matches vol exactly.

struct TriParams { double S0, K, r, sigma, T; int N; };

double trinomial_put(TriParams p) {
    double dt  = p.T / p.N;
    double u   = std::exp(p.sigma * std::sqrt(2.0 * dt));
    double d   = 1.0 / u;
    double disc = std::exp(-p.r * dt);

    // Risk-neutral probabilities.
    double eu = std::exp(p.r * dt / 2.0);
    double es = std::exp(p.sigma * std::sqrt(dt / 2.0));
    double pu = std::pow((eu - 1.0/es) / (es - 1.0/es), 2.0);
    double pd = std::pow((es - eu)     / (es - 1.0/es), 2.0);
    double pm = 1.0 - pu - pd;

    // Terminal nodes: 2N+1 prices centered on S0.
    int M = 2 * p.N + 1;
    std::vector<double> V(M);
    for (int i = 0; i < M; ++i) {
        double S = p.S0 * std::pow(u, p.N - i);
        V[i] = std::max(p.K - S, 0.0);
    }

    // Backward induction: layer shrinks by 2 each step.
    for (int t = p.N - 1; t >= 0; --t) {
        for (int i = 0; i < 2 * t + 1; ++i)
            V[i] = disc * (pu * V[i] + pm * V[i+1] + pd * V[i+2]);
    }

    return V[0];
}

int main() {
    TriParams p{100.0, 100.0, 0.05, 0.20, 1.0, 300};
    std::println("Trinomial put = {:.4f}", trinomial_put(p));
    // BSM: ~10.45; trinomial converges faster than binomial.
}`,
    explanation:
      "The trinomial tree adds a 'stay' branch to the binomial, giving three branches up/middle/down per node. The extra degree of freedom lets it exactly match the volatility structure, converging to the Black-Scholes price about twice as fast (same computational cost per node) as the equivalent binomial tree. It is the basis of Boyle's method and the Hull-White trinomial for interest rate models.",
  },

  {
    id: "cpp-20260601-b1-ctd-selection",
    language: "cpp",
    title: "Cheapest-to-deliver bond selection for bond futures",
    tag: "finance",
    code: `#include <vector>
#include <algorithm>
#include <cmath>
#include <print>

// The short side of a bond futures contract can deliver any bond from
// a basket. Each bond has a conversion factor CF that normalises the
// invoice price. The CTD is the bond that minimises:
//   cost_of_carry = (Clean Price + Accrued) - Futures * CF
// i.e., the bond the short makes the most money delivering.

struct BondInfo {
    std::string cusip;
    double clean_price;      // current market clean price
    double accrued;          // accrued interest
    double conv_factor;      // CF from exchange
    double coupon_rate;
    double yrs_to_mat;
};

struct CtdResult {
    const BondInfo* bond;
    double delivery_profit;   // positive = profitable to deliver
    double implied_repo;      // implied repo rate on delivery
};

CtdResult find_ctd(const std::vector<BondInfo>& basket,
                   double futures_price,
                   double days_to_delivery,
                   double financing_rate) {
    double t = days_to_delivery / 360.0;
    CtdResult best{nullptr, -1e18, 0.0};

    for (const auto& b : basket) {
        double full_price = b.clean_price + b.accrued;
        double invoice    = futures_price * b.conv_factor + b.accrued;
        // Carry cost: purchase bond, finance at repo until delivery.
        double carry_cost = full_price * (1.0 + financing_rate * t)
                            - b.coupon_rate / 2.0 /* approx accrued gain */;
        double net = invoice - carry_cost;

        // Implied repo: annualised return from buying bond and delivering.
        double implied_repo = (invoice / full_price - 1.0) / t;

        if (net > best.delivery_profit)
            best = {&b, net, implied_repo};
    }
    return best;
}

int main() {
    std::vector<BondInfo> basket{
        {"912828ZL", 98.50, 0.32, 0.9834, 0.025, 5.2},
        {"912828XW", 101.20, 0.48, 1.0123, 0.0275, 7.4},
        {"91282CDB", 97.10, 0.25, 0.9612, 0.02, 3.1},
    };

    auto ctd = find_ctd(basket, 99.50, 45, 0.053);
    if (ctd.bond)
        std::println("CTD: {} profit={:.3f} impl_repo={:.2f}%",
                     ctd.bond->cusip, ctd.delivery_profit,
                     ctd.implied_repo * 100);
}`,
    explanation:
      "The short in a bond futures contract holds the delivery option: they can deliver any bond in the basket and pocket the difference between the invoice price (futures × conversion factor) and the market price of the delivered bond. The CTD minimises the net cost of delivering, and its implied repo rate (the return from buying spot and delivering forward) is the key arbitrage signal traders monitor to spot futures mispricing.",
  },

  {
    id: "cpp-20260601-b1-book-crossing",
    language: "cpp",
    title: "Order book L2 crossing detection — aggressive order match loop",
    tag: "market-data",
    code: `#include <map>
#include <cstdint>
#include <print>

// A bid crosses the book when its price >= best ask.
// Walk down the ask side (ascending price) until the bid is fully filled
// or no more asks remain within the bid's price. This is the core loop
// of a price-time matching engine.

struct Level { int64_t qty; };

class LimitOrderBook {
    std::map<double, Level, std::greater<double>> bids_;  // descending
    std::map<double, Level>                       asks_;  // ascending

public:
    void add_bid(double px, int64_t qty) { bids_[px].qty += qty; }
    void add_ask(double px, int64_t qty) { asks_[px].qty += qty; }

    // Match an aggressive bid: return filled qty.
    int64_t match_bid(double bid_px, int64_t bid_qty) {
        int64_t filled = 0;
        while (bid_qty > 0 && !asks_.empty()) {
            auto it = asks_.begin();         // best ask
            if (it->first > bid_px) break;   // no cross

            int64_t take = std::min(bid_qty, it->second.qty);
            std::println("[TRADE] {} @ {:.2f}", take, it->first);
            filled   += take;
            bid_qty  -= take;
            it->second.qty -= take;
            if (it->second.qty == 0) asks_.erase(it);
        }
        if (bid_qty > 0) add_bid(bid_px, bid_qty);  // post remainder
        return filled;
    }

    void print_top() const {
        if (!bids_.empty()) std::println("best bid: {:.2f} x {}", bids_.begin()->first, bids_.begin()->second.qty);
        if (!asks_.empty()) std::println("best ask: {:.2f} x {}", asks_.begin()->first, asks_.begin()->second.qty);
    }
};

int main() {
    LimitOrderBook book;
    book.add_ask(182.55, 200);
    book.add_ask(182.60, 300);
    book.add_ask(182.65, 100);
    book.print_top();

    int64_t filled = book.match_bid(182.60, 400);  // bid sweeps two levels
    std::println("total filled: {}", filled);
    book.print_top();
}`,
    explanation:
      "The matching loop iterates the ask side from best (lowest) price upward, comparing against the incoming bid price. Crossing stops when the ask price exceeds the bid price or the bid is fully filled. In a production engine the std::map is replaced with a sorted array or skip list for lower constant factors, but the crossing logic — walk, compare, fill, advance — is identical regardless of the underlying container.",
  },
];
