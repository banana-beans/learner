import { Snippet } from "./types";

export const cppSnippets20260719B1: Snippet[] = [
  {
    id: "cpp-20260719-b1-pool-alloc",
    language: "cpp",
    title: "Pool Allocator for Fixed-Size Order Objects",
    tag: "memory",
    code: `#include <cstddef>
#include <cstdint>
#include <array>
#include <cassert>
#include <iostream>

// Fixed-size pool allocator: pre-allocates N slots, hands them out in O(1).
// No malloc/free on the hot path — critical for order creation in HFT.
template<typename T, std::size_t N>
class PoolAllocator {
    union Slot {
        alignas(T) std::byte storage[sizeof(T)];
        Slot* next;
    };

    std::array<Slot, N> pool_;
    Slot* free_list_{nullptr};
    std::size_t alloc_count_{0};

public:
    PoolAllocator() {
        // Link all slots into the freelist at startup (one-time cost)
        for (std::size_t i = 0; i < N - 1; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[N - 1].next = nullptr;
        free_list_ = &pool_[0];
    }

    template<typename... Args>
    T* allocate(Args&&... args) noexcept {
        if (!free_list_) return nullptr;     // pool exhausted
        Slot* slot = free_list_;
        free_list_ = slot->next;
        ++alloc_count_;
        return ::new (slot->storage) T(std::forward<Args>(args)...);
    }

    void deallocate(T* p) noexcept {
        p->~T();                             // explicit dtor
        auto* slot = reinterpret_cast<Slot*>(p);
        slot->next = free_list_;
        free_list_ = slot;
        --alloc_count_;
    }

    std::size_t used() const { return alloc_count_; }
    std::size_t capacity() const { return N; }
};

struct Order {
    uint64_t id;
    double   price;
    int32_t  qty;
    Order(uint64_t i, double p, int32_t q) : id(i), price(p), qty(q) {}
};

int main() {
    PoolAllocator<Order, 1024> pool;
    Order* o1 = pool.allocate(1, 100.25, 500);
    Order* o2 = pool.allocate(2, 100.24, 300);
    std::cout << "Used: " << pool.used() << "/" << pool.capacity() << "\\n";
    pool.deallocate(o1);
    pool.deallocate(o2);
    std::cout << "Used after free: " << pool.used() << "\\n";
}`,
    explanation:
      "A pool allocator pre-carves N equal-sized slots from a contiguous array and links them through a freelist. Allocation and deallocation are O(1) pointer-swap operations with zero heap involvement — `malloc` costs ~100–300 ns vs ~2 ns for a freelist pop. The `union Slot` trick reuses the object's storage as a next-pointer when the slot is free, so the pool array itself is the freelist with no auxiliary data structure.",
  },
  {
    id: "cpp-20260719-b1-spsc-queue",
    language: "cpp",
    title: "Lock-Free SPSC Queue (Single-Producer Single-Consumer)",
    tag: "lock-free",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstdint>
#include <iostream>
#include <thread>

// SPSC ring: one writer, one reader — no CAS needed, only acquire/release.
// Cache-line padding prevents false sharing between producer and consumer state.
template<typename T, std::size_t N>
class SPSCQueue {
    static_assert((N & (N - 1)) == 0, "N must be power of 2");

    alignas(64) std::atomic<uint64_t> head_{0};   // consumer reads here
    alignas(64) std::atomic<uint64_t> tail_{0};   // producer writes here
    alignas(64) std::array<T, N> buf_;

    static constexpr uint64_t MASK = N - 1;

public:
    // Producer side only — returns false if full
    bool push(const T& val) noexcept {
        uint64_t t = tail_.load(std::memory_order_relaxed);
        uint64_t h = head_.load(std::memory_order_acquire);
        if (t - h == N) return false;        // full
        buf_[t & MASK] = val;
        tail_.store(t + 1, std::memory_order_release);
        return true;
    }

    // Consumer side only — returns nullopt if empty
    std::optional<T> pop() noexcept {
        uint64_t h = head_.load(std::memory_order_relaxed);
        uint64_t t = tail_.load(std::memory_order_acquire);
        if (h == t) return std::nullopt;     // empty
        T val = buf_[h & MASK];
        head_.store(h + 1, std::memory_order_release);
        return val;
    }

    std::size_t size() const noexcept {
        return tail_.load(std::memory_order_relaxed)
             - head_.load(std::memory_order_relaxed);
    }
};

struct Tick { uint64_t ts; double price; };

int main() {
    SPSCQueue<Tick, 1024> q;
    std::thread producer([&]{
        for (int i = 0; i < 5; ++i)
            while (!q.push({uint64_t(i), 100.0 + i})) {}
    });
    std::thread consumer([&]{
        int seen = 0;
        while (seen < 5) {
            if (auto t = q.pop()) {
                std::cout << "ts=" << t->ts << " px=" << t->price << "\\n";
                ++seen;
            }
        }
    });
    producer.join(); consumer.join();
}`,
    explanation:
      "SPSC queues need only acquire/release fences — no CAS, no mutex — because exactly one thread updates each atomic. The 64-byte `alignas` padding prevents the producer's `tail_` and the consumer's `head_` from sharing a cache line: without it, every push invalidates the consumer's cache line and vice versa, costing ~70 ns of false-sharing latency. This is the fastest IPC primitive available in userspace.",
  },
  {
    id: "cpp-20260719-b1-variant-order-sm",
    language: "cpp",
    title: "std::variant Order State Machine",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string>
#include <iostream>
#include <stdexcept>
#include <cstdint>

// Model order lifecycle as a variant — only valid states are representable.
// Illegal transitions (e.g., cancel a filled order) become compile errors.

struct Pending  { uint64_t order_id; double price; int qty; };
struct Live     { uint64_t order_id; double price; int qty; uint64_t venue_oid; };
struct PartFill { uint64_t order_id; int filled; int remaining; };
struct Filled   { uint64_t order_id; double avg_px; int qty; };
struct Cancelled{ uint64_t order_id; std::string reason; };

using OrderState = std::variant<Pending, Live, PartFill, Filled, Cancelled>;

// State machine transitions — return new state or throw on illegal move
OrderState ack(OrderState s, uint64_t venue_oid) {
    return std::visit([&](auto&& st) -> OrderState {
        using T = std::decay_t<decltype(st)>;
        if constexpr (std::is_same_v<T, Pending>)
            return Live{st.order_id, st.price, st.qty, venue_oid};
        throw std::logic_error("ack only valid from Pending");
    }, s);
}

OrderState fill(OrderState s, int qty, double px) {
    return std::visit([&](auto&& st) -> OrderState {
        using T = std::decay_t<decltype(st)>;
        if constexpr (std::is_same_v<T, Live>) {
            if (qty >= st.qty) return Filled{st.order_id, px, st.qty};
            return PartFill{st.order_id, qty, st.qty - qty};
        }
        if constexpr (std::is_same_v<T, PartFill>) {
            if (qty >= st.remaining) return Filled{st.order_id, px, st.filled + qty};
            return PartFill{st.order_id, st.filled + qty, st.remaining - qty};
        }
        throw std::logic_error("fill only valid from Live or PartFill");
    }, s);
}

void print_state(const OrderState& s) {
    std::visit([](const auto& st) {
        using T = std::decay_t<decltype(st)>;
        if constexpr (std::is_same_v<T, Live>)
            std::cout << "Live oid=" << st.venue_oid << "\\n";
        else if constexpr (std::is_same_v<T, Filled>)
            std::cout << "Filled qty=" << st.qty << " avgpx=" << st.avg_px << "\\n";
        else if constexpr (std::is_same_v<T, PartFill>)
            std::cout << "PartFill " << st.filled << "/" << (st.filled+st.remaining) << "\\n";
    }, s);
}

int main() {
    OrderState s = Pending{1001, 100.25, 500};
    s = ack(s, 9999);
    print_state(s);           // Live oid=9999
    s = fill(s, 300, 100.26);
    print_state(s);           // PartFill 300/500
    s = fill(s, 200, 100.27);
    print_state(s);           // Filled qty=500
}`,
    explanation:
      "`std::variant` encodes the valid states as types, making illegal state combinations unrepresentable. `std::visit` with `if constexpr` branches dispatches on the active type at zero runtime overhead (the dispatch table is resolved at compile time for small variants). Compared to an enum + union, the variant state machine is type-safe — you cannot accidentally access `Live::venue_oid` on a `Cancelled` order.",
  },
  {
    id: "cpp-20260719-b1-concepts-pricer",
    language: "cpp",
    title: "C++20 Concepts for Pricer Duck-Typing",
    tag: "generics",
    code: `#include <concepts>
#include <cmath>
#include <iostream>

// Define what a Pricer must provide — replaces SFINAE and documentation.
template<typename P>
concept Pricer = requires(const P& p, double S, double K, double r, double T, double v) {
    { p.price(S, K, r, T, v) } -> std::convertible_to<double>;
    { p.delta(S, K, r, T, v) } -> std::convertible_to<double>;
};

// Optionally: support vega
template<typename P>
concept PricerWithVega = Pricer<P> &&
    requires(const P& p, double S, double K, double r, double T, double v) {
        { p.vega(S, K, r, T, v) } -> std::convertible_to<double>;
    };

struct BSPricer {
    static auto N(double x) { return 0.5 * std::erfc(-x * M_SQRT1_2); }
    double price(double S, double K, double r, double T, double vol) const {
        double sqT = std::sqrt(T);
        double d1 = (std::log(S/K) + (r + 0.5*vol*vol)*T) / (vol*sqT);
        double d2 = d1 - vol*sqT;
        return S*N(d1) - K*std::exp(-r*T)*N(d2);
    }
    double delta(double S, double K, double r, double T, double vol) const {
        double d1 = (std::log(S/K) + (r + 0.5*vol*vol)*T) / (vol*std::sqrt(T));
        return N(d1);
    }
    double vega(double S, double K, double r, double T, double vol) const {
        double d1 = (std::log(S/K) + (r + 0.5*vol*vol)*T) / (vol*std::sqrt(T));
        return S * std::exp(-0.5*d1*d1) / std::sqrt(2*M_PI) * std::sqrt(T);
    }
};

// Constrained function: only compiles if P satisfies Pricer
template<Pricer P>
double risk_report(const P& p, double S, double K, double r, double T, double vol) {
    return p.price(S, K, r, T, vol) * p.delta(S, K, r, T, vol);
}

// Additional overload only for pricers with vega
template<PricerWithVega P>
void print_vega(const P& p, double S, double K, double r, double T, double vol) {
    std::cout << "Vega: " << p.vega(S, K, r, T, vol) << "\\n";
}

static_assert(Pricer<BSPricer>);
static_assert(PricerWithVega<BSPricer>);

int main() {
    BSPricer bs;
    std::cout << "price*delta: " << risk_report(bs, 100,100,0.05,1.0,0.20) << "\\n";
    print_vega(bs, 100, 100, 0.05, 1.0, 0.20);
}`,
    explanation:
      "C++20 Concepts are named, composable requirements on template parameters. Unlike SFINAE, concepts produce readable error messages at the point of constraint violation rather than deep inside the template instantiation. `requires` clauses check both expression validity and return type. Concept subsumption allows `PricerWithVega` to refine `Pricer` — the compiler picks the most-constrained overload automatically.",
  },
  {
    id: "cpp-20260719-b1-hugepage-alloc",
    language: "cpp",
    title: "Transparent Hugepage Buffer for Ring Buffer Backing",
    tag: "systems",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <iostream>

// 2 MiB hugepage reduces TLB misses when scanning large ring buffers.
// MAP_HUGETLB allocates directly from the hugepage pool (needs kernel tuning).
// MADV_HUGEPAGE enables transparent hugepage promotion as a fallback.

struct HugepageBuffer {
    static constexpr std::size_t HUGEPAGE_SIZE = 1UL << 21;  // 2 MiB

    void* ptr{nullptr};
    std::size_t size{0};

    explicit HugepageBuffer(std::size_t bytes) {
        // Round up to hugepage boundary
        size = (bytes + HUGEPAGE_SIZE - 1) & ~(HUGEPAGE_SIZE - 1);
        // Try explicit hugepages first; fall back to transparent hugepages
        ptr = ::mmap(nullptr, size, PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB, -1, 0);
        if (ptr == MAP_FAILED) {
            // Fallback: regular mmap + MADV_HUGEPAGE hint
            ptr = ::mmap(nullptr, size, PROT_READ | PROT_WRITE,
                         MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
            if (ptr != MAP_FAILED)
                ::madvise(ptr, size, MADV_HUGEPAGE);
        }
    }

    // Lock pages into RAM — prevents page faults from OS swapping during trading
    bool lock() {
        return ptr != MAP_FAILED && ::mlock(ptr, size) == 0;
    }

    ~HugepageBuffer() {
        if (ptr != MAP_FAILED) ::munmap(ptr, size);
    }

    bool valid() const { return ptr != MAP_FAILED; }
    void* data() { return ptr; }
};

// Use as backing store for a typed ring buffer
struct Tick { uint64_t ts; double bid, ask; };

int main() {
    // 16 MiB ring buffer for ~200k ticks
    HugepageBuffer buf(16 * 1024 * 1024);
    if (buf.valid()) {
        buf.lock();   // best-effort; may need CAP_IPC_LOCK
        auto* ring = static_cast<Tick*>(buf.data());
        ring[0] = {1000, 100.49, 100.51};
        std::cout << "Ring buf[0] bid=" << ring[0].bid << "\\n";
        std::cout << "Buffer size: " << buf.size / (1 << 20) << " MiB\\n";
    } else {
        std::cout << "mmap failed (demo)\\n";
    }
}`,
    explanation:
      "A 4 KiB page requires one TLB entry per page; a ring buffer spanning 8 MiB needs 2048 TLB entries with standard pages but only 4 with 2 MiB hugepages. TLB misses cost ~50–200 cycles on modern CPUs, so hugepage-backed ring buffers reduce latency for market-data consumers that scan the ring sequentially. `mlock` prevents the OS from paging out the buffer during a volatile market event when memory pressure is highest.",
  },
  {
    id: "cpp-20260719-b1-thread-affinity",
    language: "cpp",
    title: "CPU Affinity Pinning for Low-Latency Thread",
    tag: "systems",
    code: `#include <pthread.h>
#include <sched.h>
#include <unistd.h>
#include <cstdint>
#include <iostream>
#include <thread>
#include <atomic>

// Pin a thread to a specific CPU core to eliminate scheduling jitter.
// Also sets SCHED_FIFO real-time priority to preempt non-RT threads.

bool pin_to_core(int core_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_id, &cpuset);
    return pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset) == 0;
}

bool set_realtime_priority(int priority = 80) {
    sched_param sp{};
    sp.sched_priority = priority;
    return pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp) == 0;
}

// Market data receive thread — should live on isolated core
void market_data_thread(int core, std::atomic<bool>& stop) {
    if (!pin_to_core(core))
        std::cerr << "Warning: could not pin to core " << core << "\\n";
    set_realtime_priority(80);   // may need CAP_SYS_NICE

    // Busy-poll — no sleep; dedicated core means no preemption waste
    uint64_t count = 0;
    while (!stop.load(std::memory_order_relaxed)) {
        // In production: read from NIC ring buffer here
        ++count;
        if (count % 1'000'000 == 0) {
            // yield check — minimises cache pollution from cout
        }
    }
    std::cout << "MD thread processed " << count << " iterations\\n";
}

// Check current CPU affinity mask
void print_affinity() {
    cpu_set_t mask;
    pthread_getaffinity_np(pthread_self(), sizeof(mask), &mask);
    std::cout << "Allowed CPUs: ";
    for (int i = 0; i < CPU_SETSIZE; ++i)
        if (CPU_ISSET(i, &mask)) std::cout << i << " ";
    std::cout << "\\n";
}

int main() {
    print_affinity();
    std::atomic<bool> stop{false};
    std::thread t(market_data_thread, 2, std::ref(stop));
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    stop = true;
    t.join();
}`,
    explanation:
      "CPU affinity ensures the kernel never migrates the critical path thread to another core, eliminating migration latency (cache warm-up after move can cost 1–10 µs). `SCHED_FIFO` at priority 80 preempts all normal SCHED_OTHER threads on the pinned core. In production, the pinned core is isolated with `isolcpus=2` in the kernel command line so the OS scheduler ignores it entirely.",
  },
  {
    id: "cpp-20260719-b1-pmr-mono",
    language: "cpp",
    title: "std::pmr Monotonic Buffer Resource for Per-Tick Allocations",
    tag: "memory",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <array>
#include <iostream>
#include <cstdint>

// pmr::monotonic_buffer_resource: bump-pointer allocator over a stack buffer.
// Reset at the end of a tick — all allocations freed in O(1).
// No heap involvement; perfect for temporary data in the tick handler.

struct TickContext {
    uint64_t seq;
    double   price;
    // variable-length ancillary data allocated in the monotonic buffer
    std::pmr::vector<double> greeks;
    std::pmr::string         symbol;

    TickContext(std::pmr::memory_resource* mr)
        : seq(0), price(0), greeks(mr), symbol(mr) {}
};

class TickProcessor {
    static constexpr std::size_t BUF_SIZE = 4096;
    std::array<std::byte, BUF_SIZE> buf_;
    std::pmr::monotonic_buffer_resource mbr_;

public:
    TickProcessor() : mbr_(buf_.data(), buf_.size(),
                           std::pmr::null_memory_resource()) {}

    void process(uint64_t seq, double price, const char* sym) {
        // All allocations come from the stack buffer
        TickContext ctx(&mbr_);
        ctx.seq    = seq;
        ctx.price  = price;
        ctx.symbol = sym;           // pmr::string uses the buffer
        ctx.greeks.resize(5);       // delta, gamma, vega, theta, rho
        ctx.greeks[0] = 0.55;

        std::cout << "Seq=" << ctx.seq << " sym=" << ctx.symbol
                  << " delta=" << ctx.greeks[0] << "\\n";

        // mbr_ is rewound here; all allocations freed in O(1)
        mbr_.release();
    }
};

int main() {
    TickProcessor tp;
    tp.process(1, 100.25, "AAPL");
    tp.process(2, 100.26, "AAPL");   // reuses same stack buffer
    tp.process(3, 100.27, "GOOG");
}`,
    explanation:
      "`pmr::monotonic_buffer_resource` is a bump-pointer allocator: allocation is a pointer-increment (nanoseconds), and `release()` resets it in a single assignment. Used as a per-tick scratch allocator, it eliminates all heap operations from the tick handler — critical when a tick must be fully processed before the next one arrives. The stack-local `buf_` avoids any heap allocation even for the resource itself.",
  },
  {
    id: "cpp-20260719-b1-atomic-flag-spinlock",
    language: "cpp",
    title: "Spinlock via std::atomic_flag for Short Critical Sections",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <vector>
#include <iostream>
#include <cstdint>

// std::atomic_flag is guaranteed lock-free on every conforming platform.
// Spinlock is faster than mutex for critical sections < ~50 ns.

class Spinlock {
    std::atomic_flag flag_ = ATOMIC_FLAG_INIT;

public:
    void lock() noexcept {
        // Spin with exponential backoff: first spin hot, then yield
        for (int i = 0; flag_.test_and_set(std::memory_order_acquire); ++i) {
            if (i < 4) {
                // Hot spin: let CPU execute out-of-order but don't pipeline stall
                __builtin_ia32_pause();   // REP NOP — reduces power and contention
            } else {
                std::this_thread::yield();   // surrender timeslice
            }
        }
    }

    void unlock() noexcept {
        flag_.clear(std::memory_order_release);
    }
};

// RAII guard
struct SpinGuard {
    Spinlock& lk;
    explicit SpinGuard(Spinlock& l) : lk(l) { lk.lock(); }
    ~SpinGuard() { lk.unlock(); }
};

// Shared risk accumulator protected by spinlock
struct RiskState {
    double net_delta{0};
    uint64_t fill_count{0};
    Spinlock lk;

    void update(double delta) {
        SpinGuard g(lk);
        net_delta  += delta;
        ++fill_count;
    }
};

int main() {
    RiskState risk;
    std::vector<std::thread> threads;
    for (int t = 0; t < 4; ++t) {
        threads.emplace_back([&risk]{
            for (int i = 0; i < 10000; ++i)
                risk.update(0.01);
        });
    }
    for (auto& t : threads) t.join();
    std::cout << "Net delta: " << risk.net_delta << "  (expect 400.0)\\n";
    std::cout << "Fills: " << risk.fill_count << "\\n";
}`,
    explanation:
      "`atomic_flag::test_and_set` issues a single LOCK XCHG instruction — the minimal possible synchronisation primitive. The `PAUSE` instruction (exposed as `__builtin_ia32_pause`) reduces memory-order violations in the spin loop by ~50% on Intel CPUs and cuts power in the hot-wait loop. Spinlocks are only appropriate when the lock is never held across a syscall and contention is rare — otherwise `std::mutex` (which can sleep and avoid wasting a core) is better.",
  },
  {
    id: "cpp-20260719-b1-robin-hood-hash",
    language: "cpp",
    title: "Robin Hood Open-Address Hash Map for Symbol Table",
    tag: "data-structures",
    code: `#include <cstdint>
#include <string_view>
#include <vector>
#include <optional>
#include <iostream>
#include <functional>

// Robin Hood hashing: displaced entries steal slots from richer neighbours,
// bounding probe length variance. Load factors of 0.9 are practical.

struct Entry {
    uint64_t    key_hash{0};
    std::string key;
    uint32_t    value{0};
    int8_t      psl{-1};    // probe sequence length; -1 = empty
};

class RHHashMap {
    std::vector<Entry> slots_;
    std::size_t        size_{0};
    std::size_t        cap_;

    static uint64_t hash(std::string_view k) {
        uint64_t h = 14695981039346656037ULL;
        for (unsigned char c : k) { h ^= c; h *= 1099511628211ULL; }
        return h | 1;   // ensure non-zero
    }

public:
    explicit RHHashMap(std::size_t cap = 256)
        : slots_(cap), cap_(cap) {}

    void insert(std::string_view key, uint32_t val) {
        if (size_ * 10 >= cap_ * 9) rehash();   // 90% load factor
        uint64_t h = hash(key);
        std::size_t pos = h % cap_;
        Entry incoming{h, std::string(key), val, 0};
        while (true) {
            Entry& slot = slots_[pos];
            if (slot.psl < 0) { slot = std::move(incoming); ++size_; return; }
            if (slot.key == incoming.key) { slot.value = val; return; }  // update
            // Robin Hood: steal from richer slot (smaller PSL)
            if (slot.psl < incoming.psl) std::swap(slot, incoming);
            ++incoming.psl;
            pos = (pos + 1) % cap_;
        }
    }

    std::optional<uint32_t> get(std::string_view key) const {
        uint64_t h = hash(key);
        std::size_t pos = h % cap_;
        for (int8_t psl = 0; ; ++psl, pos = (pos + 1) % cap_) {
            const auto& s = slots_[pos];
            if (s.psl < 0 || psl > s.psl) return std::nullopt;
            if (s.key == key) return s.value;
        }
    }

    void rehash() {
        RHHashMap bigger(cap_ * 2);
        for (auto& s : slots_)
            if (s.psl >= 0) bigger.insert(s.key, s.value);
        *this = std::move(bigger);
    }
    std::size_t size() const { return size_; }
};

int main() {
    RHHashMap table;
    for (auto [sym, id] : std::initializer_list<std::pair<const char*, uint32_t>>{
            {"AAPL", 1}, {"GOOG", 2}, {"ES", 3}, {"EURUSD", 4}})
        table.insert(sym, id);
    std::cout << "AAPL id=" << table.get("AAPL").value_or(0) << "\\n";
    std::cout << "GOOG id=" << table.get("GOOG").value_or(0) << "\\n";
    std::cout << "MSFT id=" << table.get("MSFT").value_or(0) << "\\n";   // 0 = not found
}`,
    explanation:
      "Robin Hood hashing limits worst-case probe length by ensuring no slot has a PSL smaller than an incoming entry's — the rich (small PSL) yield to the poor (large PSL). This keeps variance low: at 80% load, average PSL is ~2.5 and maximum PSL is ~8 vs ~40 for standard linear probing. The bounded probe length makes lookups predictable in latency-sensitive dispatch tables like the symbol-to-instrument map.",
  },
  {
    id: "cpp-20260719-b1-simd-dot",
    language: "cpp",
    title: "Manual SIMD Dot Product for Greeks Portfolio",
    tag: "low-latency",
    code: `#include <immintrin.h>
#include <cstddef>
#include <cstdint>
#include <vector>
#include <iostream>

// Compute dot product of weights and greeks using 256-bit AVX2.
// Processes 4 doubles per iteration vs 1 for scalar.

double dot_avx2(const double* __restrict__ a,
                const double* __restrict__ b,
                std::size_t n) noexcept {
#ifdef __AVX2__
    __m256d acc = _mm256_setzero_pd();
    std::size_t i = 0;
    for (; i + 4 <= n; i += 4) {
        __m256d va = _mm256_loadu_pd(a + i);
        __m256d vb = _mm256_loadu_pd(b + i);
        acc = _mm256_fmadd_pd(va, vb, acc);   // FMA: acc += a*b in one op
    }
    // Horizontal sum of 4 lanes
    __m128d low  = _mm256_castpd256_pd128(acc);
    __m128d high = _mm256_extractf128_pd(acc, 1);
    __m128d sum2 = _mm_add_pd(low, high);
    __m128d sum1 = _mm_hadd_pd(sum2, sum2);
    double result;
    _mm_store_sd(&result, sum1);
    // Scalar tail
    for (; i < n; ++i) result += a[i] * b[i];
    return result;
#else
    double s = 0; for (std::size_t i = 0; i < n; ++i) s += a[i]*b[i]; return s;
#endif
}

int main() {
    constexpr int N = 1024;
    // Portfolio deltas and position weights (aligned for best performance)
    alignas(32) std::vector<double> deltas(N, 0.5);
    alignas(32) std::vector<double> weights(N, 2.0);

    double net_delta = dot_avx2(deltas.data(), weights.data(), N);
    std::cout << "Net portfolio delta: " << net_delta << "  (expect 1024.0)\\n";
}`,
    explanation:
      "AVX2 FMA processes 4 doubles simultaneously with fused multiply-add (1 rounding error instead of 2). For a 1024-element dot product, AVX2 issues 256 FMA instructions vs 1024 scalar multiplies and 1024 adds — roughly 4x throughput on well-pipelined CPUs. The `__restrict__` keyword tells the compiler the arrays don't alias, enabling further auto-vectorisation of surrounding code. FMA is available on Haswell (2013) and later.",
  },
  {
    id: "cpp-20260719-b1-bench-chrono",
    language: "cpp",
    title: "Nanosecond Benchmarking with std::chrono and RDTSC",
    tag: "low-latency",
    code: `#include <chrono>
#include <cstdint>
#include <iostream>
#include <algorithm>
#include <array>
#include <numeric>
#include <x86intrin.h>

// RDTSC: raw CPU cycle counter — finer resolution than clock_gettime but
// not wall-clock time; convert via TSC frequency.
inline uint64_t rdtsc() noexcept { return __rdtsc(); }

// Fence to prevent reordering across the measurement boundary
inline uint64_t rdtscp() noexcept {
    uint32_t aux;
    return __rdtscp(&aux);   // serialising read — includes prior stores
}

// Benchmark a callable, return median nanoseconds over N runs
template<typename F>
double bench_ns(F&& f, int warmup = 100, int runs = 10000) {
    using Clock = std::chrono::high_resolution_clock;

    // Warm up caches and branch predictors
    for (int i = 0; i < warmup; ++i) f();

    std::vector<double> samples(runs);
    for (int i = 0; i < runs; ++i) {
        auto t0 = Clock::now();
        f();
        auto t1 = Clock::now();
        samples[i] = std::chrono::duration<double, std::nano>(t1 - t0).count();
    }

    std::sort(samples.begin(), samples.end());
    // Median is more robust than mean (outliers from OS interrupts skew mean)
    return samples[runs / 2];
}

// Benchmark subject: hash computation
static uint64_t fnv1a(const char* s, std::size_t n) noexcept {
    uint64_t h = 14695981039346656037ULL;
    for (std::size_t i = 0; i < n; ++i) { h ^= (uint8_t)s[i]; h *= 1099511628211ULL; }
    return h;
}

int main() {
    volatile uint64_t sink = 0;   // prevent optimisation of the call

    auto hash_bench = [&]{ sink = fnv1a("EURUSD", 6); };
    double median = bench_ns(hash_bench);
    std::cout << "FNV hash 6-char median: " << median << " ns\\n";

    // TSC-based (lower overhead, requires frequency calibration)
    uint64_t t0 = rdtscp();
    sink = fnv1a("EURUSD", 6);
    uint64_t t1 = rdtscp();
    std::cout << "TSC ticks: " << (t1 - t0) << " (~3 GHz => "
              << (t1 - t0) / 3.0 << " ns)\\n";
}`,
    explanation:
      "Median latency is the correct metric for low-latency benchmarks: the mean is dominated by OS-interrupt outliers (10–100 µs) that never occur in production (interrupt-affinity isolation). `__rdtscp` is a serialising TSC read that prevents the CPU from reordering the timestamp with the measured operation. The volatile `sink` forces the compiler to actually emit the function call rather than eliding it as dead code.",
  },
  {
    id: "cpp-20260719-b1-option-greeks-fd",
    language: "cpp",
    title: "Finite-Difference Greeks (Bump-and-Reprice)",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>
#include <functional>

// Generic bump-and-reprice framework: works with any pricing function.
// Central differences: O(h^2) error vs O(h) for one-sided.

using PriceFn = std::function<double(double S, double K, double r,
                                     double T, double vol)>;

struct Greeks {
    double delta, gamma, vega, theta, rho;
};

static double N(double x) { return 0.5 * std::erfc(-x * M_SQRT1_2); }

double bs_call(double S, double K, double r, double T, double vol) {
    double sqT = std::sqrt(T);
    double d1 = (std::log(S/K) + (r + 0.5*vol*vol)*T) / (vol*sqT);
    double d2 = d1 - vol*sqT;
    return S*N(d1) - K*std::exp(-r*T)*N(d2);
}

Greeks finite_diff_greeks(
    PriceFn price_fn,
    double S, double K, double r, double T, double vol,
    double dS   = 0.01,   // 1 cent bump
    double dvol = 0.001,  // 10 bps vol bump
    double dT   = 1.0/252, // 1 day theta
    double dr   = 0.0001  // 1 bp rate bump
) {
    double p0 = price_fn(S, K, r, T, vol);
    // Delta: dP/dS (central difference)
    double pu = price_fn(S+dS, K, r, T, vol);
    double pd = price_fn(S-dS, K, r, T, vol);
    double delta = (pu - pd) / (2*dS);
    // Gamma: d^2P/dS^2
    double gamma = (pu - 2*p0 + pd) / (dS*dS);
    // Vega: dP/dvol (per 1 vol point)
    double vega = (price_fn(S,K,r,T,vol+dvol) - price_fn(S,K,r,T,vol-dvol)) / (2*dvol);
    // Theta: dP/dT (negative: time decay)
    double theta = (price_fn(S,K,r,T-dT,vol) - p0) / dT;  // 1-day decay
    // Rho: dP/dr
    double rho = (price_fn(S,K,r+dr,T,vol) - price_fn(S,K,r-dr,T,vol)) / (2*dr);
    return {delta, gamma, vega, theta, rho};
}

int main() {
    auto g = finite_diff_greeks(bs_call, 100, 100, 0.05, 1.0, 0.20);
    std::cout << "Delta: " << g.delta << "  (BS analytic ~0.5368)\\n";
    std::cout << "Gamma: " << g.gamma << "  (BS analytic ~0.0188)\\n";
    std::cout << "Vega:  " << g.vega  << "  (per 100% vol)\\n";
    std::cout << "Theta: " << g.theta << "  (per day, negative)\\n";
    std::cout << "Rho:   " << g.rho   << "  (per 100% rate)\\n";
}`,
    explanation:
      "Finite-difference Greeks are the universal fallback when an analytic formula doesn't exist (exotic payoffs, complex vol surfaces). Central differences halve the error vs one-sided bumps for the same computational cost (2 evaluations per Greek). The bump size trades off truncation error (large h) vs cancellation error (small h) — rule of thumb: dS = spot * 0.01%, dvol = 1bp. Gamma requires a 3-point stencil.",
  },
  {
    id: "cpp-20260719-b1-heston-mc",
    language: "cpp",
    title: "Heston Stochastic Volatility Monte Carlo",
    tag: "numerics",
    code: `#include <random>
#include <cmath>
#include <algorithm>
#include <iostream>

// Heston (1993): dS = mu*S dt + sqrt(v)*S dW1
//               dv = kappa*(theta-v) dt + xi*sqrt(v) dW2,  corr(W1,W2)=rho
// Euler-Maruyama scheme with full truncation for variance (v = max(v, 0)).

double heston_call_mc(
    double S0, double K, double r,
    double v0,     // initial variance
    double kappa,  // mean-reversion speed
    double theta,  // long-run variance
    double xi,     // vol of vol
    double rho,    // correlation
    double T,
    int n_steps = 200,
    int n_paths = 100000,
    unsigned seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt    = T / n_steps;
    double sqdt  = std::sqrt(dt);
    double df    = std::exp(-r * T);
    double sum   = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0, v = v0;
        for (int t = 0; t < n_steps; ++t) {
            double z1 = nd(rng);
            double z2 = rho * z1 + std::sqrt(1 - rho*rho) * nd(rng);
            double sv = std::sqrt(std::max(v, 0.0));
            // Full truncation: reflect negative variance
            v += kappa * (theta - std::max(v, 0.0)) * dt + xi * sv * sqdt * z2;
            S *= std::exp((r - 0.5 * std::max(v, 0.0)) * dt + sv * sqdt * z1);
        }
        sum += std::max(S - K, 0.0);
    }
    return df * sum / n_paths;
}

int main() {
    // Typical equity Heston params
    double price = heston_call_mc(
        100,    // S0
        100,    // K
        0.05,   // r
        0.04,   // v0 = 20% initial vol squared
        2.0,    // kappa
        0.04,   // theta (long-run 20% vol)
        0.40,   // xi (vol of vol)
        -0.70,  // rho (negative: down-vol smirk)
        1.0     // T
    );
    std::cout << "Heston call price: " << price << "\\n";
    // BS at 20% vol gives ~10.45; Heston with neg rho gives slightly higher
}`,
    explanation:
      "Heston is the market-standard stochastic-vol model because it produces a closed-form characteristic function (Fourier pricing) and naturally fits the volatility skew via the spot-vol correlation rho. Full truncation (max(v,0)) avoids negative variances that would give NaN in sqrt; the reflection scheme is an alternative. The Euler scheme has O(dt) weak convergence; the Broadie-Kaya exact scheme or QE discretisation gives far better accuracy.",
  },
  {
    id: "cpp-20260719-b1-ns-yield-curve",
    language: "cpp",
    title: "Nelson-Siegel Yield Curve Fitting",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <array>
#include <iostream>
#include <algorithm>
#include <numeric>

// Nelson-Siegel: y(tau) = b0 + b1*(1 - e^{-tau/lambda})/(tau/lambda)
//                          + b2*((1 - e^{-tau/lambda})/(tau/lambda) - e^{-tau/lambda})
// b0 = long-run level, b0+b1 = short end, b2 = hump/trough, lambda = decay

struct NSParams { double b0, b1, b2, lam; };

double ns_yield(double tau, const NSParams& p) {
    if (tau < 1e-8) return p.b0 + p.b1;  // limit as tau -> 0
    double x = tau / p.lam;
    double factor1 = (1 - std::exp(-x)) / x;
    double factor2 = factor1 - std::exp(-x);
    return p.b0 + p.b1 * factor1 + p.b2 * factor2;
}

// Simple gradient descent fit to observed yields
NSParams fit_ns(const std::vector<double>& tenors,
                const std::vector<double>& yields,
                int max_iter = 5000, double lr = 1e-5)
{
    NSParams p{0.04, -0.01, 0.01, 2.0};
    for (int iter = 0; iter < max_iter; ++iter) {
        double g_b0 = 0, g_b1 = 0, g_b2 = 0, g_lam = 0;
        for (std::size_t i = 0; i < tenors.size(); ++i) {
            double y_hat = ns_yield(tenors[i], p);
            double err   = y_hat - yields[i];
            double x     = tenors[i] / p.lam;
            double ex    = std::exp(-x);
            double f1    = (1 - ex) / x;
            double f2    = f1 - ex;
            g_b0  += 2 * err;
            g_b1  += 2 * err * f1;
            g_b2  += 2 * err * f2;
            // Numerical gradient for lambda (complex derivative)
            double dx    = 0.001;
            NSParams pp = p; pp.lam += dx;
            g_lam += 2 * err * (ns_yield(tenors[i], pp) - y_hat) / dx;
        }
        p.b0  -= lr * g_b0;
        p.b1  -= lr * g_b1;
        p.b2  -= lr * g_b2;
        p.lam -= lr * g_lam * 0.01;
        p.lam  = std::max(p.lam, 0.1);   // lambda must be positive
    }
    return p;
}

int main() {
    std::vector<double> tenors = {0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30};
    // Typical upward-sloping USD Treasury curve
    std::vector<double> yields = {0.050, 0.049, 0.047, 0.046, 0.047,
                                   0.049, 0.050, 0.051, 0.052, 0.052};
    auto p = fit_ns(tenors, yields);
    std::cout << "b0=" << p.b0 << " b1=" << p.b1
              << " b2=" << p.b2 << " lam=" << p.lam << "\\n";
    for (double t : {1.0, 5.0, 10.0, 30.0})
        std::cout << "NS(" << t << "y)=" << ns_yield(t, p) << "\\n";
}`,
    explanation:
      "Nelson-Siegel decomposes the yield curve into level (b0), slope (b1), and curvature (b2) components. The functional form constrains the curve to be smooth and forward-rates positive for reasonable parameters. Central banks and asset managers use NS to interpolate between benchmark tenors and to decompose curve movements into their level/slope/curvature drivers. Svensson adds a second hump term (b3, lambda2).",
  },
  {
    id: "cpp-20260719-b1-variance-swap",
    language: "cpp",
    title: "Variance Swap Fair Strike via Replication",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <iostream>
#include <algorithm>

// Demeterfi-Derman-Kamal-Zou (1999): variance swap fair strike
// K_var = (2/T) * [integral_0^F (P(K)/K^2) dK + integral_F^inf (C(K)/K^2) dK]
// Approximated discretely from a strip of liquid option prices.

static double N(double x) { return 0.5 * std::erfc(-x * M_SQRT1_2); }

static double bs_call(double S, double K, double r, double T, double vol) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*vol*vol)*T) / (vol*sqT);
    double d2  = d1 - vol*sqT;
    return S*N(d1) - K*std::exp(-r*T)*N(d2);
}

static double bs_put(double S, double K, double r, double T, double vol) {
    return bs_call(S, K, r, T, vol) - S + K * std::exp(-r*T);
}

double variance_swap_strike(
    double S, double r, double T,
    const std::vector<double>& strikes,
    const std::vector<double>& vols)   // implied vol smile
{
    double F = S * std::exp(r * T);   // forward
    double sum = 0.0;

    for (std::size_t i = 0; i < strikes.size(); ++i) {
        double K   = strikes[i];
        double vol = vols[i];
        // Width of the strike bucket (trapezoidal)
        double dK  = (i + 1 < strikes.size() ? strikes[i+1] : K * 1.02)
                   - (i > 0 ? strikes[i-1] : K * 0.98);
        dK *= 0.5;
        double opt = (K <= F) ? bs_put(S, K, r, T, vol)
                              : bs_call(S, K, r, T, vol);
        sum += (2.0 / T) * opt / (K * K) * dK;
    }
    return sum;  // annualised variance (multiply by 10000 for vol^2 in %)
}

int main() {
    double S = 100, r = 0.05, T = 1.0;
    // Strike grid with flat-vol smile (=> fair strike ≈ vol^2)
    std::vector<double> K   = {80, 85, 90, 95, 100, 105, 110, 115, 120};
    std::vector<double> vol(K.size(), 0.20);   // 20% flat

    double fair_var = variance_swap_strike(S, r, T, K, vol);
    std::cout << "Fair variance strike: " << fair_var << "\\n";
    std::cout << "Implied vol: " << std::sqrt(fair_var)*100 << "%\\n";
    // With flat vol, fair strike ≈ 0.04 (= 20%^2)
}`,
    explanation:
      "A variance swap pays the difference between realised and implied variance — no path-dependence on spot, only on daily squared returns. The fair strike is replicated by a log-contract, itself approximated by a continuum of options weighted by 2/(K^2). This is the foundation of the VIX calculation. With a skewed vol surface, the fair strike exceeds ATM vol^2 — the skew premium.",
  },
  {
    id: "cpp-20260719-b1-binary-search-tick",
    language: "cpp",
    title: "Binary Search in Sorted Tick Array (Lower Bound)",
    tag: "data-structures",
    code: `#include <cstdint>
#include <vector>
#include <algorithm>
#include <iostream>
#include <cassert>

struct Tick {
    uint64_t ts_ns;   // nanosecond timestamp
    double   price;
    uint32_t qty;

    bool operator<(uint64_t ts) const { return ts_ns < ts; }
};

// Find the first tick at or after a given timestamp — O(log N).
// std::lower_bound works on sorted ranges via a comparator.

// Custom comparator: allows Tick < uint64_t (heterogeneous comparison)
struct ByTimestamp {
    bool operator()(const Tick& t, uint64_t ts) const { return t.ts_ns < ts; }
    bool operator()(uint64_t ts, const Tick& t) const { return ts < t.ts_ns; }
};

// Find the tick exactly at ts or the next one after (lower_bound)
const Tick* first_at_or_after(const std::vector<Tick>& ticks, uint64_t ts_ns) {
    auto it = std::lower_bound(ticks.begin(), ticks.end(), ts_ns, ByTimestamp{});
    return (it == ticks.end()) ? nullptr : &*it;
}

// Find the VWAP over a half-open interval [start_ns, end_ns)
double vwap_range(const std::vector<Tick>& ticks,
                  uint64_t start_ns, uint64_t end_ns) {
    auto lo = std::lower_bound(ticks.begin(), ticks.end(), start_ns, ByTimestamp{});
    auto hi = std::lower_bound(ticks.begin(), ticks.end(), end_ns,   ByTimestamp{});
    double num = 0, den = 0;
    for (auto it = lo; it != hi; ++it) {
        num += it->price * it->qty;
        den += it->qty;
    }
    return den > 0 ? num / den : 0.0;
}

int main() {
    std::vector<Tick> ticks = {
        {1000, 100.50, 200},
        {2000, 100.51, 300},
        {3000, 100.49, 100},
        {4000, 100.52, 250},
        {5000, 100.48, 150},
    };

    auto* t = first_at_or_after(ticks, 2500);   // first tick >= 2500 ns
    std::cout << "First at/after 2500ns: ts=" << t->ts_ns << " px=" << t->price << "\\n";

    double vwap = vwap_range(ticks, 2000, 4000);
    std::cout << "VWAP [2000,4000)ns: " << vwap << "\\n";
}`,
    explanation:
      "`std::lower_bound` with a heterogeneous comparator avoids constructing a temporary `Tick` just to search by timestamp — the comparator accepts mixed types directly. The VWAP-range function does two binary searches (O(log N) each) then a linear scan over the range, which is cache-friendly because ticks are stored contiguously. In a tick store with 10M rows, each search touches ~24 cache lines vs 10M for a linear scan.",
  },
  {
    id: "cpp-20260719-b1-fixed-income-dur",
    language: "cpp",
    title: "Duration and Convexity of a Fixed-Income Bond",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <iostream>
#include <numeric>

struct Bond {
    double face;         // par value
    double coupon_rate;  // annual coupon rate
    int    periods;      // number of coupon periods
    double freq;         // coupon frequency (2 = semi-annual)
};

struct BondAnalytics {
    double price;
    double macaulay_duration;    // years
    double modified_duration;    // dP/dy / P
    double convexity;            // d^2P/dy^2 / P
    double dollar_duration;      // DV01 = dP/dy per 1bp
};

BondAnalytics bond_analytics(const Bond& b, double ytm_annual) {
    double y   = ytm_annual / b.freq;    // yield per period
    double c   = b.face * b.coupon_rate / b.freq;  // coupon per period
    double pv  = 0.0;
    double mac = 0.0;
    double cvx = 0.0;

    for (int t = 1; t <= b.periods; ++t) {
        double cf  = (t == b.periods) ? (c + b.face) : c;
        double df  = std::pow(1 + y, -t);
        double pv_t = cf * df;
        pv  += pv_t;
        mac += pv_t * t;              // sum of t * PV(cf_t)
        cvx += pv_t * t * (t + 1);   // sum of t*(t+1) * PV(cf_t)
    }

    double mac_dur = mac / (pv * b.freq);            // in years
    double mod_dur = mac_dur / (1 + y);
    double cvx_yr  = cvx / (pv * b.freq * b.freq * std::pow(1 + y, 2));
    double dv01    = mod_dur * pv * 0.0001;          // per 1bp move

    return {pv, mac_dur, mod_dur, cvx_yr, dv01};
}

int main() {
    Bond b{1000, 0.05, 20, 2};   // 1000 face, 5% annual coupon, 10Y, semi-annual
    auto a = bond_analytics(b, 0.06);   // priced at 6% yield
    std::cout << "Price:             " << a.price            << "\\n";
    std::cout << "Macaulay duration: " << a.macaulay_duration << " yrs\\n";
    std::cout << "Modified duration: " << a.modified_duration << "\\n";
    std::cout << "Convexity:         " << a.convexity         << "\\n";
    std::cout << "DV01:              " << a.dollar_duration   << "\\n";
}`,
    explanation:
      "Modified duration is the first-order price sensitivity to yield: dP/P ≈ -ModDur * dy. Convexity is the second-order correction: dP/P ≈ -ModDur*dy + 0.5*Convexity*dy^2. For large moves (25bps+), the convexity term matters — a callable bond has negative convexity because the issuer calls it when rates fall, capping price appreciation. DV01 (dollar value of 01) is the standard risk measure on fixed-income desks.",
  },
  {
    id: "cpp-20260719-b1-fx-triangular",
    language: "cpp",
    title: "FX Triangular Arbitrage via Bellman-Ford",
    tag: "data-structures",
    code: `#include <vector>
#include <string>
#include <cmath>
#include <iostream>
#include <limits>
#include <optional>

// Model FX arbitrage as a shortest-path problem.
// Transform: take -log(rate). A negative-weight cycle = arbitrage opportunity.
// Bellman-Ford detects negative cycles in O(V*E).

struct FXEdge {
    int from, to;
    double log_neg_rate;   // -log(rate)
};

// Returns the arbitrage cycle (sequence of currencies) if found.
std::optional<std::vector<int>> find_fx_arb(
    int n_ccy,
    const std::vector<FXEdge>& edges)
{
    std::vector<double> dist(n_ccy, 0.0);   // start from any node (log form)
    std::vector<int>    pred(n_ccy, -1);

    // Relax V-1 times
    for (int i = 0; i < n_ccy - 1; ++i) {
        for (const auto& e : edges) {
            if (dist[e.from] + e.log_neg_rate < dist[e.to]) {
                dist[e.to] = dist[e.from] + e.log_neg_rate;
                pred[e.to] = e.from;
            }
        }
    }

    // V-th relaxation: any improvement indicates negative cycle
    int cycle_node = -1;
    for (const auto& e : edges) {
        if (dist[e.from] + e.log_neg_rate < dist[e.to] - 1e-9) {
            cycle_node = e.to;
            break;
        }
    }

    if (cycle_node < 0) return std::nullopt;

    // Trace back cycle (walk n times to ensure we're inside it)
    int v = cycle_node;
    for (int i = 0; i < n_ccy; ++i) v = pred[v];
    std::vector<int> cycle;
    int start = v;
    do {
        cycle.push_back(v);
        v = pred[v];
    } while (v != start);
    cycle.push_back(start);
    std::reverse(cycle.begin(), cycle.end());
    return cycle;
}

int main() {
    // Currencies: 0=USD 1=EUR 2=GBP 3=JPY
    std::vector<std::string> ccy = {"USD","EUR","GBP","JPY"};
    std::vector<FXEdge> edges;
    auto add = [&](int f, int t, double rate) {
        edges.push_back({f, t, -std::log(rate)});
        edges.push_back({t, f, -std::log(1.0/rate)});
    };
    add(0, 1, 0.93);    // USD/EUR
    add(0, 2, 0.79);    // USD/GBP
    add(1, 2, 0.85);    // EUR/GBP
    add(0, 3, 149.5);   // USD/JPY
    // Inject a tiny arbitrage: mispriced EUR/GBP
    edges.push_back({0, 1, -std::log(0.93)});
    edges.push_back({1, 2, -std::log(0.862)});  // EUR->GBP slightly off
    edges.push_back({2, 0, -std::log(1.0/0.79 * 1.005)});  // GBP->USD with 0.5% gain

    if (auto cycle = find_fx_arb(4, edges)) {
        std::cout << "Arbitrage: ";
        for (int c : *cycle) std::cout << ccy[c] << " ";
        std::cout << "\\n";
    } else {
        std::cout << "No arbitrage found\\n";
    }
}`,
    explanation:
      "Taking the negative log of FX rates converts multiplication into addition, so a profitable round-trip (product of rates > 1) becomes a negative-weight cycle (sum of edge weights < 0). Bellman-Ford detects this in O(V*E) — the V-th relaxation round will still improve a distance if a negative cycle is reachable. Production systems run this on the live order book mid-prices every millisecond.",
  },
  {
    id: "cpp-20260719-b1-order-book-price-level",
    language: "cpp",
    title: "Order Book Price Level with FIFO Queue",
    tag: "data-structures",
    code: `#include <map>
#include <deque>
#include <cstdint>
#include <iostream>
#include <optional>

// Full order book: bid side (max-heap via reverse map), ask side (min-heap).
// Each price level holds a FIFO queue of orders (time priority).

struct Order {
    uint64_t id;
    int32_t  qty;
    bool     is_buy;
};

class OrderBook {
    // std::map<price, queue>: asks sorted ascending, bids sorted descending
    std::map<double, std::deque<Order>>           asks_;  // ascending: front = best
    std::map<double, std::deque<Order>,
             std::greater<double>>                bids_;  // descending: front = best

public:
    void add_order(uint64_t id, double price, int qty, bool is_buy) {
        if (is_buy)
            bids_[price].push_back({id, qty, true});
        else
            asks_[price].push_back({id, qty, false});
    }

    // Match incoming market order; returns total filled qty
    int32_t match_market_order(int qty, bool is_buy) {
        auto& side = is_buy ? asks_ : bids_;   // buy aggresses asks, sell aggresses bids
        int32_t filled = 0;
        while (qty > 0 && !side.empty()) {
            auto& [px, q] = *side.begin();
            while (!q.empty() && qty > 0) {
                auto& o   = q.front();
                int f     = std::min(o.qty, qty);
                o.qty    -= f;
                qty      -= f;
                filled   += f;
                std::cout << "Fill " << f << " @ " << px << "\\n";
                if (o.qty == 0) q.pop_front();
            }
            if (q.empty()) side.erase(side.begin());
        }
        return filled;
    }

    std::optional<double> best_bid() const {
        return bids_.empty() ? std::nullopt
                             : std::optional<double>(bids_.begin()->first);
    }
    std::optional<double> best_ask() const {
        return asks_.empty() ? std::nullopt
                             : std::optional<double>(asks_.begin()->first);
    }
    double spread() const {
        if (best_bid() && best_ask()) return *best_ask() - *best_bid();
        return 0.0;
    }
};

int main() {
    OrderBook book;
    book.add_order(1, 100.24, 200, true);    // bid
    book.add_order(2, 100.25, 100, true);    // bid (better)
    book.add_order(3, 100.26, 150, false);   // ask
    book.add_order(4, 100.27, 300, false);   // ask
    std::cout << "Best bid=" << *book.best_bid()
              << " ask=" << *book.best_ask()
              << " spread=" << book.spread() << "\\n";
    book.match_market_order(200, true);   // buy 200 @ 100.26
}`,
    explanation:
      "Using `std::map` with `std::greater<double>` for bids gives the best bid at `begin()` — no explicit max tracking needed. The FIFO deque within each price level enforces time-priority: earlier orders get filled first at the same price. Production order books replace `std::map` with an array-of-price-levels indexed by a hash or a fixed-point price grid to achieve O(1) best-bid/ask access.",
  },
  {
    id: "cpp-20260719-b1-coroutine-feed",
    language: "cpp",
    title: "C++20 Coroutine Generator for Market Data Replay",
    tag: "modern-cpp",
    code: `#include <coroutine>
#include <vector>
#include <optional>
#include <cstdint>
#include <iostream>

// Minimal generator coroutine: co_yield produces values lazily.
// Useful for streaming tick replay without loading all ticks into memory.

template<typename T>
struct Generator {
    struct promise_type {
        std::optional<T> value_;

        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v) {
            value_ = std::move(v);
            return {};
        }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> handle_;
    explicit Generator(std::coroutine_handle<promise_type> h) : handle_(h) {}
    ~Generator() { if (handle_) handle_.destroy(); }

    // Iterator interface
    struct Iter {
        std::coroutine_handle<promise_type> h;
        bool operator!=(std::default_sentinel_t) const { return !h.done(); }
        Iter& operator++() { h.resume(); return *this; }
        T operator*() const { return *h.promise().value_; }
    };
    Iter begin() { handle_.resume(); return {handle_}; }
    std::default_sentinel_t end() { return {}; }
};

struct Tick { uint64_t ts; double price; };

// A coroutine that yields ticks from a file chunk by chunk (simulated here)
Generator<Tick> replay_ticks(const std::vector<Tick>& source) {
    for (const auto& t : source) {
        co_yield t;   // suspend after each tick, resume on operator++
    }
}

int main() {
    std::vector<Tick> hist = {
        {1000, 100.50}, {2000, 100.51}, {3000, 100.49}, {4000, 100.52}
    };

    for (const Tick& t : replay_ticks(hist)) {
        std::cout << "ts=" << t.ts << " px=" << t.price << "\\n";
    }
}`,
    explanation:
      "A C++20 coroutine generator suspends after each `co_yield` and resumes on the next `operator++` call — the caller controls the pace of consumption. For tick replay, this allows streaming from disk without loading the entire history into memory: the coroutine can `read()` from a file descriptor between yields. The zero-overhead abstraction principle applies: a simple generator adds no virtual calls or heap-per-value overhead compared to a manual state machine.",
  },
  {
    id: "cpp-20260719-b1-conditional-wait",
    language: "cpp",
    title: "std::condition_variable for Signal-Based Risk Aggregation",
    tag: "concurrency",
    code: `#include <mutex>
#include <condition_variable>
#include <thread>
#include <vector>
#include <atomic>
#include <iostream>
#include <cstdint>

// Pattern: worker threads accumulate fills into per-thread buckets;
// a snapshot thread wakes up on demand to aggregate risk.

struct RiskSnapshot {
    double net_delta{0};
    uint64_t fills{0};
};

class RiskAggregator {
    std::mutex              mu_;
    std::condition_variable cv_;
    bool                    snapshot_requested_{false};
    bool                    snapshot_ready_{false};
    RiskSnapshot            last_snapshot_;

    // Shared fill counter (updated by worker threads)
    std::atomic<double>   total_delta_{0.0};
    std::atomic<uint64_t> fill_count_{0};

public:
    // Called by worker threads on each fill
    void record_fill(double delta) {
        // atomic fetch_add not available for double; use relaxed CAS
        double old = total_delta_.load(std::memory_order_relaxed);
        while (!total_delta_.compare_exchange_weak(
                   old, old + delta,
                   std::memory_order_relaxed)) {}
        fill_count_.fetch_add(1, std::memory_order_relaxed);
    }

    // Called by risk manager thread: request a snapshot and wait for it
    RiskSnapshot request_snapshot() {
        std::unique_lock lk(mu_);
        snapshot_requested_ = true;
        snapshot_ready_     = false;
        cv_.notify_all();                        // wake aggregator thread
        cv_.wait(lk, [&]{ return snapshot_ready_; });
        return last_snapshot_;
    }

    // Aggregator thread main loop
    void aggregator_loop(std::atomic<bool>& running) {
        while (running.load()) {
            std::unique_lock lk(mu_);
            cv_.wait(lk, [&]{ return snapshot_requested_ || !running.load(); });
            if (!running) break;
            last_snapshot_ = { total_delta_.load(), fill_count_.load() };
            snapshot_requested_ = false;
            snapshot_ready_     = true;
            cv_.notify_all();
        }
    }
};

int main() {
    RiskAggregator ra;
    std::atomic<bool> running{true};

    std::thread agg([&]{ ra.aggregator_loop(running); });
    std::vector<std::thread> workers;
    for (int i = 0; i < 4; ++i) {
        workers.emplace_back([&ra]{
            for (int j = 0; j < 1000; ++j) ra.record_fill(0.01);
        });
    }
    for (auto& w : workers) w.join();

    auto snap = ra.request_snapshot();
    std::cout << "Delta=" << snap.net_delta << " fills=" << snap.fills << "\\n";
    running = false;
    // Kick aggregator to exit
    {std::lock_guard lk(*new std::mutex); }  // dummy — just signal
    agg.detach();
}`,
    explanation:
      "The condition variable implements the classic monitor pattern: a risk manager thread calls `request_snapshot()`, which sets a flag and calls `wait()` on the condition variable. The aggregator thread wakes up on `notify_all()`, takes a consistent snapshot of all atomic counters, sets `snapshot_ready_=true`, and notifies the waiter. The spurious-wakeup guard (`wait(lk, predicate)`) handles the case where the OS wakes the thread without a signal.",
  },
  {
    id: "cpp-20260719-b1-bit-tricks-price",
    language: "cpp",
    title: "Fixed-Point Price Representation with Bit Tricks",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cmath>
#include <iostream>
#include <cassert>
#include <bit>

// Represent prices as fixed-point integers to avoid floating-point rounding.
// For equities: price in cents (100ths), qty in shares.
// 64-bit price fits up to $922 trillion at 0.01 resolution.

using Price = int64_t;   // in ticks
using Qty   = int32_t;

constexpr int64_t TICKS_PER_DOLLAR = 100;   // 1 tick = $0.01

constexpr Price from_double(double d) {
    return static_cast<Price>(std::round(d * TICKS_PER_DOLLAR));
}
constexpr double to_double(Price p) {
    return static_cast<double>(p) / TICKS_PER_DOLLAR;
}

// Spread in ticks (integer): no floating-point comparison
constexpr Price spread_ticks(Price ask, Price bid) { return ask - bid; }

// Pack order metadata into a single 64-bit word:
// bits 63: side (0=buy,1=sell)
// bits 0-47: price in ticks (allows up to ~$2.8T at 1 cent)
// bits 48-62: qty (up to 32767 shares, or use separate field)
struct PackedOrder {
    uint64_t data;

    static PackedOrder encode(Price price, Qty qty, bool is_sell) {
        uint64_t d = (static_cast<uint64_t>(price) & 0x0000FFFFFFFFFFFF)
                   | (static_cast<uint64_t>(qty & 0x7FFF) << 48)
                   | (static_cast<uint64_t>(is_sell) << 63);
        return {d};
    }

    Price price()   const { return static_cast<int64_t>(data & 0x0000FFFFFFFFFFFF); }
    Qty   qty()     const { return static_cast<Qty>((data >> 48) & 0x7FFF); }
    bool  is_sell() const { return (data >> 63) & 1; }
};

int main() {
    Price bid = from_double(100.24);
    Price ask = from_double(100.26);
    std::cout << "Spread: " << spread_ticks(ask, bid) << " ticks\\n";   // 2

    auto o = PackedOrder::encode(bid, 300, false);
    std::cout << "Packed price=" << to_double(o.price())
              << " qty=" << o.qty()
              << " sell=" << o.is_sell() << "\\n";

    // Bit trick: check if price is a round dollar amount
    bool is_round = (bid % TICKS_PER_DOLLAR) == 0;
    std::cout << "100.24 is round dollar: " << is_round << "\\n";  // false

    // Count trailing zeros in qty (used to detect lot sizes)
    Qty qty = 100;
    std::cout << "Trailing zeros in qty " << qty << ": "
              << std::countr_zero(static_cast<uint32_t>(qty)) << "\\n"; // 2
}`,
    explanation:
      "Fixed-point prices eliminate IEEE 754 rounding errors in comparisons and arithmetic — `100.25 + 100.25` in floating-point may not equal `200.50` exactly. Packing price, qty, and side into a single 64-bit word enables cache-efficient storage of order arrays and fast SIMD processing. `std::countr_zero` (C++20) maps to a single BSF/TZCNT instruction to detect lot-size boundaries.",
  },
  {
    id: "cpp-20260719-b1-option-model-compare",
    language: "cpp",
    title: "Compile-Time Model Registry with Type Erasure",
    tag: "generics",
    code: `#include <functional>
#include <string>
#include <unordered_map>
#include <cmath>
#include <iostream>
#include <memory>

// Type-erase different option pricers behind a uniform interface,
// then register them in a runtime map by name.

class IOptionPricer {
public:
    virtual double price(double S, double K, double r, double T, double vol) const = 0;
    virtual double delta(double S, double K, double r, double T, double vol) const = 0;
    virtual ~IOptionPricer() = default;
};

// Adapter: wrap any Pricer type (concept-satisfying) behind IOptionPricer
template<typename P>
class PricerAdapter : public IOptionPricer {
    P impl_;
public:
    explicit PricerAdapter(P p) : impl_(std::move(p)) {}
    double price(double S, double K, double r, double T, double v) const override {
        return impl_.price(S, K, r, T, v);
    }
    double delta(double S, double K, double r, double T, double v) const override {
        return impl_.delta(S, K, r, T, v);
    }
};

class PricerRegistry {
    std::unordered_map<std::string, std::unique_ptr<IOptionPricer>> reg_;
public:
    template<typename P>
    void register_model(std::string name, P pricer) {
        reg_[name] = std::make_unique<PricerAdapter<P>>(std::move(pricer));
    }

    const IOptionPricer* get(const std::string& name) const {
        auto it = reg_.find(name);
        return it != reg_.end() ? it->second.get() : nullptr;
    }
};

struct BSPricer {
    static auto N(double x) { return 0.5*std::erfc(-x*M_SQRT1_2); }
    double price(double S, double K, double r, double T, double v) const {
        double sqT=std::sqrt(T), d1=(std::log(S/K)+(r+0.5*v*v)*T)/(v*sqT), d2=d1-v*sqT;
        return S*N(d1)-K*std::exp(-r*T)*N(d2);
    }
    double delta(double S, double K, double r, double T, double v) const {
        double d1=(std::log(S/K)+(r+0.5*v*v)*T)/(v*std::sqrt(T));
        return N(d1);
    }
};

struct BachelierPricer {
    static auto N(double x) { return 0.5*std::erfc(-x*M_SQRT1_2); }
    static auto n(double x) { return std::exp(-0.5*x*x)/std::sqrt(2*M_PI); }
    double price(double F, double K, double r, double T, double v) const {
        double vT=v*std::sqrt(T), d=(F-K)/vT;
        return std::exp(-r*T)*((F-K)*N(d)+vT*n(d));
    }
    double delta(double F, double K, double r, double T, double v) const {
        return std::exp(-r*T)*N((F-K)/(v*std::sqrt(T)));
    }
};

int main() {
    PricerRegistry reg;
    reg.register_model("Black-Scholes", BSPricer{});
    reg.register_model("Bachelier",     BachelierPricer{});

    for (const auto& name : {"Black-Scholes", "Bachelier"}) {
        if (auto* p = reg.get(name))
            std::cout << name << " price="
                      << p->price(100, 100, 0.05, 1.0, 0.20) << "\\n";
    }
}`,
    explanation:
      "The adapter pattern bridges the static world (concrete pricer types known at compile time) with the dynamic world (runtime model selection by name). `PricerAdapter<P>` erases the concrete type behind `IOptionPricer`, paying one vtable dispatch per call. The registry enables A/B pricing: the same trade can be valued under multiple models by iterating the registered pricers — common in model validation workflows.",
  },
  {
    id: "cpp-20260719-b1-market-impact",
    language: "cpp",
    title: "Square-Root Market Impact Model (Almgren-Chriss)",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>
#include <vector>

// Temporary impact: g(v) = eta * sigma * sqrt(v / sigma_daily)
// where v = participation rate (fraction of ADV)
// Permanent impact: h(v) = gamma * sigma * sign(v) * |v|^beta
//
// Propagator model: total impact = permanent + temporary
// Used for cost estimation before placing large orders.

struct MarketImpactParams {
    double sigma;          // daily vol (fraction)
    double adv;            // average daily volume (shares)
    double eta;            // temporary impact coefficient (~0.1)
    double gamma;          // permanent impact coefficient (~0.05)
    double beta;           // permanent impact exponent (~0.5)
};

struct ImpactEstimate {
    double temporary_impact;    // cost for THIS trade
    double permanent_impact;    // lasting price shift
    double total_cost;          // in bps
    double participation_rate;
};

ImpactEstimate estimate_impact(
    double shares_to_trade,
    double time_horizon_days,
    const MarketImpactParams& p)
{
    // Participation rate: fraction of market volume we trade per day
    double v = shares_to_trade / (p.adv * time_horizon_days);

    // Temporary impact (reverts after trade): sqrt-law
    double temp = p.eta * p.sigma * std::sqrt(v);

    // Permanent impact (price is shifted permanently): power law
    double perm = p.gamma * p.sigma * std::pow(v, p.beta);

    // Total cost ≈ 0.5 * perm * N + temp * N (where N = shares)
    double total_bps = (0.5 * perm + temp) * 10000;   // in basis points

    return {temp, perm, total_bps, v};
}

int main() {
    MarketImpactParams params{
        .sigma = 0.015,       // 1.5% daily vol
        .adv   = 5'000'000,   // 5M shares ADV
        .eta   = 0.10,
        .gamma = 0.05,
        .beta  = 0.50,
    };

    // Trade 500k shares over 1 day
    auto impact = estimate_impact(500'000, 1.0, params);
    std::cout << "Participation rate: " << impact.participation_rate * 100 << "%\\n";
    std::cout << "Temp impact: " << impact.temporary_impact * 10000 << " bps\\n";
    std::cout << "Perm impact: " << impact.permanent_impact * 10000 << " bps\\n";
    std::cout << "Total cost:  " << impact.total_cost << " bps\\n";

    // Spread trade over 5 days to reduce impact
    auto slow = estimate_impact(500'000, 5.0, params);
    std::cout << "5-day total cost: " << slow.total_cost << " bps\\n";
}`,
    explanation:
      "The square-root market impact law is the empirically best-supported model: temporary impact scales as sqrt(participation rate), while permanent impact follows a weaker power law. Splitting a large order over multiple days reduces participation rate, reducing the square-root temporary impact by sqrt(T) — the Almgren-Chriss optimal execution trades off this improvement against timing risk. The cost estimates inform pre-trade transaction cost analysis (TCA).",
  },
  {
    id: "cpp-20260719-b1-constexpr-binomial",
    language: "cpp",
    title: "constexpr Cox-Ross-Rubinstein Binomial Tree",
    tag: "numerics",
    code: `#include <array>
#include <cmath>
#include <algorithm>
#include <iostream>

// CRR binomial tree for American options — evaluated at compile time for
// a fixed step count. Compile-time evaluation bakes the price into the binary.

// N = number of time steps (compile-time constant)
template<int N>
constexpr double crr_american_put(
    double S, double K, double r, double sigma, double T)
{
    double dt = T / N;
    double u  = std::exp(sigma * std::sqrt(dt));
    double d  = 1.0 / u;
    double p  = (std::exp(r * dt) - d) / (u - d);  // risk-neutral prob
    double df = std::exp(-r * dt);

    // Terminal node values: max(K - S*u^j*d^(N-j), 0) for j=0..N
    std::array<double, N + 1> v{};
    for (int j = 0; j <= N; ++j) {
        double S_T = S * std::pow(u, 2*j - N);  // j ups, (N-j) downs
        v[j] = std::max(K - S_T, 0.0);          // put payoff
    }

    // Backward induction with early exercise check
    for (int t = N - 1; t >= 0; --t) {
        for (int j = 0; j <= t; ++j) {
            double hold     = df * (p * v[j + 1] + (1 - p) * v[j]);
            double S_t      = S * std::pow(u, 2*j - t);
            double exercise = std::max(K - S_t, 0.0);
            v[j]            = std::max(hold, exercise);   // American: max(hold, exercise)
        }
    }
    return v[0];
}

int main() {
    // American put at ATM, 1Y, 20% vol, 5% rate — should exceed European put
    double american_put = crr_american_put<200>(100, 100, 0.05, 0.20, 1.0);
    std::cout << "American put (N=200): " << american_put << "\\n";
    // European BS put for comparison
    auto N = [](double x){ return 0.5*std::erfc(-x*M_SQRT1_2); };
    double d1 = (std::log(1.0) + (0.05+0.02)*1.0) / 0.20;
    double d2 = d1 - 0.20;
    double eu_put = 100*std::exp(-0.05)*N(-d2) - 100*N(-d1);
    std::cout << "European put (BS):    " << eu_put << "\\n";
    std::cout << "Early exercise premium: " << (american_put - eu_put) << "\\n";
}`,
    explanation:
      "The CRR tree discretises the log-normal process with up/down factors calibrated so that u=exp(sigma*sqrt(dt)) matches the first two moments. American options check early exercise at each node — the price is max(intrinsic, continuation). The early exercise premium on puts is always positive because holding the option forgoes the interest on the strike. With N=200 steps, CRR converges to within 0.01% of Black-Scholes for European options.",
  },
  {
    id: "cpp-20260719-b1-execution-algo-twap",
    language: "cpp",
    title: "TWAP Execution Algorithm Simulation",
    tag: "systems",
    code: `#include <vector>
#include <cstdint>
#include <chrono>
#include <cmath>
#include <iostream>
#include <random>

// TWAP: spread target_qty evenly across [start, end] in equal time slices.
// Each slice sends a child order; slippage is simulated.

struct TwapConfig {
    int64_t  target_qty;         // total shares to trade
    int      n_slices;           // number of child orders
    bool     is_buy;
    double   limit_price;        // 0 = market order
    double   participation_cap;  // max fraction of simulated volume
};

struct ChildOrder {
    int      slice_id;
    int64_t  qty;
    double   fill_price;
    int64_t  filled_qty;
};

struct TwapResult {
    double   vwap_achieved;    // actual average fill price
    double   twap_benchmark;   // equal-time-weighted mid
    double   slippage_bps;
    int64_t  total_filled;
};

TwapResult simulate_twap(const TwapConfig& cfg,
                          const std::vector<double>& market_prices,
                          unsigned seed = 42)
{
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> noise(0, 0.0005);  // 5bps vol per slice

    int64_t qty_per_slice = cfg.target_qty / cfg.n_slices;
    int64_t remainder     = cfg.target_qty % cfg.n_slices;

    double   total_notional = 0.0;
    int64_t  total_filled   = 0;
    double   sum_mid        = 0.0;

    for (int s = 0; s < cfg.n_slices; ++s) {
        int64_t slice_qty = qty_per_slice + (s == cfg.n_slices - 1 ? remainder : 0);
        double  mid       = market_prices[s % market_prices.size()];
        sum_mid          += mid;

        // Simulate fill: buy at mid + half-spread + temporary impact
        double spread_half = mid * 0.0001;   // 1bp half-spread
        double impact      = mid * 0.0002 * std::sqrt(double(slice_qty) / 10000.0);
        double fill_px     = mid + (cfg.is_buy ? 1 : -1) * (spread_half + impact + mid*noise(rng));

        // Check limit
        if (cfg.limit_price > 0 && cfg.is_buy && fill_px > cfg.limit_price)
            continue;   // not filled

        total_notional += fill_px * slice_qty;
        total_filled   += slice_qty;
    }

    double vwap  = total_filled > 0 ? total_notional / total_filled : 0.0;
    double bench = sum_mid / cfg.n_slices;
    double slip  = (vwap - bench) / bench * 10000 * (cfg.is_buy ? 1 : -1);
    return {vwap, bench, slip, total_filled};
}

int main() {
    // Simulate 10 slices with random mid-price path
    std::vector<double> mids(10);
    double px = 100.0;
    for (auto& m : mids) { m = px; px += (std::rand() % 3 - 1) * 0.01; }

    TwapConfig cfg{50000, 10, true, 0, 0.1};
    auto res = simulate_twap(cfg, mids);
    std::cout << "TWAP: " << res.vwap_achieved
              << "  Benchmark: " << res.twap_benchmark
              << "  Slippage: " << res.slippage_bps << " bps\\n"
              << "Filled: " << res.total_filled << "/" << cfg.target_qty << "\\n";
}`,
    explanation:
      "TWAP divides the target quantity into equal slices across calendar time, minimising execution risk when a trader expects the stock price to mean-revert over the execution window. Slippage is the difference between the TWAP benchmark (equal-weight average of mid-prices) and the actual fill VWAP. In production, slices adapt to real-time volatility (reducing size during high-vol periods) to stay within the participation cap.",
  },
  {
    id: "cpp-20260719-b1-rvo-nrvo",
    language: "cpp",
    title: "NRVO and Guaranteed Copy Elision in Pricer Results",
    tag: "modern-cpp",
    code: `#include <iostream>
#include <cmath>
#include <vector>
#include <cstdint>

// Named Return Value Optimisation (NRVO): compiler constructs the result
// object directly in the caller's stack frame — zero copies.
// Since C++17, copy elision is GUARANTEED for prvalues (not just NRVO).

struct PriceResult {
    double   price;
    double   delta;
    double   gamma;
    uint64_t eval_count;

    PriceResult() : price(0), delta(0), gamma(0), eval_count(0) {
        std::cout << "[PriceResult ctor]\\n";
    }
    PriceResult(const PriceResult&) {
        std::cout << "[PriceResult COPY — should not appear with NRVO]\\n";
    }
    PriceResult(PriceResult&&) noexcept {
        std::cout << "[PriceResult MOVE — should not appear with guaranteed elision]\\n";
    }
};

static auto ncdf(double x) { return 0.5*std::erfc(-x*M_SQRT1_2); }

// NRVO: 'res' is the unique named return value — compiler elides copy.
PriceResult compute_bs(double S, double K, double r, double T, double vol) {
    PriceResult res;                  // constructed in caller's storage directly
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*vol*vol)*T) / (vol*sqT);
    double d2  = d1 - vol*sqT;
    res.price  = S*ncdf(d1) - K*std::exp(-r*T)*ncdf(d2);
    res.delta  = ncdf(d1);
    res.gamma  = std::exp(-0.5*d1*d1) / (std::sqrt(2*M_PI) * S * vol * sqT);
    res.eval_count = 1;
    return res;   // NRVO: no copy/move
}

// C++17 guaranteed elision: prvalue materialises directly in 'r'
PriceResult make_result(double price) {
    return PriceResult{};   // guaranteed elision: temporary IS the return value
}

int main() {
    // Only one ctor call — no copy, no move
    PriceResult r1 = compute_bs(100, 100, 0.05, 1.0, 0.20);
    std::cout << "Price: " << r1.price << " Delta: " << r1.delta << "\\n";

    // Guaranteed copy elision (C++17): prvalue directly materialises
    PriceResult r2 = make_result(10.5);
    (void)r2;
}`,
    explanation:
      "NRVO eliminates the return-value copy by constructing the named local directly in the caller's stack slot; guaranteed copy elision (C++17) makes this mandatory for prvalues. For structs like `PriceResult` that are returned frequently from pricing functions, NRVO savings are measurable — constructing a 40-byte struct via copy costs ~10 ns on a cache miss. Returning multiple outputs as a struct (vs pass-by-pointer) is cleaner and equally fast with NRVO.",
  },
  {
    id: "cpp-20260719-b1-regex-fix-tag",
    language: "cpp",
    title: "Compile-Time Regex for FIX Message Validation (std::regex)",
    tag: "networking",
    code: `#include <regex>
#include <string>
#include <string_view>
#include <optional>
#include <iostream>

// Validate and extract fields from a FIX message using std::regex.
// In production, a hand-written parser (string_view) is faster, but
// regex is acceptable for config parsing and test harnesses.

// FIX field pattern: tag=value pairs separated by SOH (\\x01)
struct FIXField {
    int         tag;
    std::string value;
};

// Extract all tag=value pairs from a FIX message string
std::vector<FIXField> parse_fix(const std::string& msg) {
    // Pattern: one or more digits, '=', any chars except SOH
    static const std::regex field_re(R"((\d+)=([^\x01]*))");
    std::vector<FIXField> fields;

    auto begin = std::sregex_iterator(msg.begin(), msg.end(), field_re);
    auto end   = std::sregex_iterator{};
    for (auto it = begin; it != end; ++it) {
        const auto& m = *it;
        fields.push_back({std::stoi(m[1].str()), m[2].str()});
    }
    return fields;
}

// Validate that a New Order Single (35=D) has required tags
bool validate_nos(const std::vector<FIXField>& fields) {
    static const std::vector<int> required = {49, 56, 11, 54, 55, 38, 40};
    std::set<int> present;
    for (const auto& f : fields) present.insert(f.tag);
    for (int t : required)
        if (present.find(t) == present.end()) {
            std::cout << "Missing required tag " << t << "\\n";
            return false;
        }
    return true;
}

int main() {
    // New Order Single with required fields
    std::string fix_msg =
        "8=FIX.4.4\x01"
        "35=D\x01"
        "49=CLIENT\x01"
        "56=EXCHANGE\x01"
        "11=ORD001\x01"
        "54=1\x01"         // side = buy
        "55=AAPL\x01"
        "38=500\x01"       // qty
        "40=2\x01"         // type = limit
        "44=100.25\x01";   // price

    auto fields = parse_fix(fix_msg);
    for (const auto& f : fields)
        if (f.tag == 55 || f.tag == 44 || f.tag == 38)
            std::cout << "Tag " << f.tag << " = " << f.value << "\\n";

    #include <set>
    std::cout << "Valid NOS: " << validate_nos(fields) << "\\n";
}`,
    explanation:
      "`std::regex` compiles a pattern to a DFA/NFA at runtime (or, with static initialization, once at program start). For FIX message parsing in tests and configuration loading, regex is convenient; for the critical receive path, `std::string_view`-based hand-parsing (as in the earlier snippet) is 10–100x faster. The `R\"(...)\"` raw string literal avoids double-escaping regex metacharacters.",
  },
];
