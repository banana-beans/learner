import { Snippet } from "./types";

export const cppSnippets20260716B1: Snippet[] = [
  {
    id: "cpp-20260716-b1-acquire-release-fence",
    language: "cpp",
    title: "std::atomic_thread_fence Release/Acquire Pair",
    tag: "low-latency",
    code: `#include <atomic>
#include <vector>
#include <thread>
#include <cassert>

// Standalone fences allow relaxed atomics on the data while ensuring
// the happens-before ordering is established between threads.
// Cheaper than seq_cst: only the fence instruction need be a full barrier.

struct Slot {
    std::atomic<int>  seq{0};   // sequence number
    double            price{0};
    int               qty{0};
};

static constexpr int CAP = 16;
Slot ring[CAP];

// Producer: write data then release fence
void producer(int id, double px, int q) {
    Slot& s = ring[id % CAP];
    // Relaxed write to data fields (no ordering guarantee here)
    s.price = px;
    s.qty   = q;
    // Release fence: all preceding stores complete before the sequence bump
    std::atomic_thread_fence(std::memory_order_release);
    s.seq.store(id + 1, std::memory_order_relaxed);
}

// Consumer: poll sequence then acquire fence before reading data
bool consumer(int expected_id, double& out_px, int& out_qty) {
    Slot& s = ring[expected_id % CAP];
    if (s.seq.load(std::memory_order_relaxed) != expected_id + 1)
        return false;
    // Acquire fence: all subsequent loads see stores from the producer
    std::atomic_thread_fence(std::memory_order_acquire);
    out_px  = s.price;
    out_qty = s.qty;
    return true;
}

int main() {
    producer(0, 100.25, 500);
    double px; int qty;
    bool ok = consumer(0, px, qty);
    assert(ok && px == 100.25 && qty == 500);
}`,
    explanation:
      "Using standalone fences instead of `memory_order_release` / `memory_order_acquire` on every load/store allows the data fields to use cheap relaxed atomics: only the fence itself issues the hardware MFENCE or LWSYNC. On x86 TSO this is often a no-op for the acquire fence, making the consumer path effectively free of barrier overhead.",
  },
  {
    id: "cpp-20260716-b1-crtp-pricer",
    language: "cpp",
    title: "CRTP Mixin for Zero-Overhead Pricing Polymorphism",
    tag: "meta-programming",
    code: `#include <cmath>
#include <iostream>

// CRTP (Curiously Recurring Template Pattern): the base class is templated
// on the derived class, enabling static (compile-time) virtual dispatch.
// Zero vtable overhead, fully inlineable, zero heap allocation.

template<typename Derived>
struct PricerBase {
    double price(double S, double K, double r, double T) const {
        return static_cast<const Derived*>(this)->price_impl(S, K, r, T);
    }
    double delta(double S, double K, double r, double T, double h = 0.01) const {
        return (price(S + h, K, r, T) - price(S - h, K, r, T)) / (2 * h);
    }
};

// Black-Scholes call pricer
struct BSPricer : PricerBase<BSPricer> {
    double sigma;
    explicit BSPricer(double sig) : sigma(sig) {}

    double price_impl(double S, double K, double r, double T) const {
        auto ncdf = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
        double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
        double d2 = d1 - sigma*std::sqrt(T);
        return S*ncdf(d1) - K*std::exp(-r*T)*ncdf(d2);
    }
};

// Intrinsic-value pricer (for testing; always returns max(S-K,0))
struct IntrinsicPricer : PricerBase<IntrinsicPricer> {
    double price_impl(double S, double K, double, double) const {
        return std::max(S - K, 0.0);
    }
};

// Generic pricer consumer — no virtual call, no heap allocation
template<typename P>
void print_greeks(const PricerBase<P>& pricer, double S, double K, double r, double T) {
    std::cout << "Price: " << pricer.price(S, K, r, T)
              << " Delta: " << pricer.delta(S, K, r, T) << "\n";
}

int main() {
    BSPricer       bs{0.2};
    IntrinsicPricer intr{};
    print_greeks(bs,   100, 100, 0.05, 1.0);  // ~10.45, ~0.637
    print_greeks(intr, 105, 100, 0.05, 1.0);  // 5.0, ~1.0
}`,
    explanation:
      "CRTP inlines `price_impl` into the base-class `price()` call at compile time — the compiler sees the derived type statically and eliminates the indirection. Compared to virtual dispatch, this saves one pointer dereference and enables auto-inlining of short pricing functions, reducing per-option evaluation time from ~10 ns (virtual) to ~2 ns (CRTP) in tight loops.",
  },
  {
    id: "cpp-20260716-b1-bitfield-order",
    language: "cpp",
    title: "Bitfield-Packed Order Struct for Compact Storage",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cassert>
#include <iostream>

// Compact 8-byte order representation using bitfields.
// Stores everything needed for a simple equity order in one 64-bit word.
// Trade-off: bitfield access is not atomic; read the whole word atomically
// then unpack with bitfield struct overlay for lock-free patterns.

struct PackedOrder {
    uint64_t price_ticks : 26;  // up to 67M ticks (at 0.01 tick = $670,000)
    uint64_t qty         : 20;  // up to 1,048,575 shares
    uint64_t side        :  1;  // 0=buy, 1=sell
    uint64_t order_type  :  2;  // 0=limit,1=market,2=IOC,3=FOK
    uint64_t tif         :  2;  // 0=day,1=GTC,2=GTD,3=session
    uint64_t venue_id    :  4;  // up to 16 venues
    uint64_t symbol_id   :  9;  // up to 512 instruments (or use separate table)

    // 26+20+1+2+2+4+9 = 64 bits exactly
    static_assert(26+20+1+2+2+4+9 == 64);
};
static_assert(sizeof(PackedOrder) == 8);

// Helper: encode/decode tick price (price_ticks = price / tick_size)
inline PackedOrder make_limit_buy(uint32_t price_ticks, uint32_t qty,
                                   uint8_t symbol_id, uint8_t venue_id) {
    PackedOrder o{};
    o.price_ticks = price_ticks;
    o.qty         = qty;
    o.side        = 0;      // buy
    o.order_type  = 0;      // limit
    o.tif         = 0;      // day
    o.venue_id    = venue_id;
    o.symbol_id   = symbol_id;
    return o;
}

// Atomic read of the whole packed order (unsafe if straddling cache lines)
inline uint64_t read_atomic(const PackedOrder* p) {
    return __atomic_load_n(reinterpret_cast<const uint64_t*>(p), __ATOMIC_ACQUIRE);
}

int main() {
    // AAPL limit buy 1000 shares at 150.00 (tick size 0.01 -> 15000 ticks)
    PackedOrder o = make_limit_buy(15000, 1000, 1, 0);
    std::cout << "Price ticks: " << o.price_ticks  // 15000
              << " Qty: "        << o.qty           // 1000
              << " Symbol: "     << (int)o.symbol_id // 1
              << "\n";
    assert(sizeof(o) == 8);
}`,
    explanation:
      "Packing an order into 8 bytes ensures the entire order fits in one cache line slot and can be atomically read as a `uint64_t` (on x86, 8-byte aligned loads are naturally atomic). This is critical for lock-free ring buffers: the producer writes a new `PackedOrder` word and the consumer reads it with a single MOV instruction, eliminating the race between fields that a multi-field struct would suffer.",
  },
  {
    id: "cpp-20260716-b1-jthread-feed",
    language: "cpp",
    title: "std::jthread + stop_token for Graceful Market-Data Shutdown",
    tag: "low-latency",
    code: `#include <thread>
#include <stop_token>
#include <atomic>
#include <chrono>
#include <iostream>
#include <vector>

// std::jthread automatically joins on destruction and propagates a stop signal.
// No need for a manual flag, no detach-and-race-on-shutdown.

struct Tick { double price; int qty; int seq; };

class MarketDataFeed {
    std::vector<Tick> buffer_;
    std::atomic<int>  write_idx_{0};

public:
    void start(std::jthread& t) {
        t = std::jthread([this](std::stop_token stoken) {
            int seq = 0;
            while (!stoken.stop_requested()) {
                // Simulate receiving a tick
                Tick tk{ 100.0 + seq * 0.01, 100, seq };
                int idx = write_idx_.fetch_add(1, std::memory_order_relaxed) % 1024;
                buffer_.resize(std::max((int)buffer_.size(), idx + 1));
                buffer_[idx] = tk;
                ++seq;
                std::this_thread::sleep_for(std::chrono::microseconds(1));
            }
            std::cout << "Feed shut down after " << seq << " ticks\n";
        });
    }
};

// stop_callback: register cleanup when a stop is requested
void example_with_callback() {
    std::jthread feeder;
    MarketDataFeed feed;
    feed.start(feeder);
    std::this_thread::sleep_for(std::chrono::milliseconds(5));
    // feeder.request_stop() triggers the stop_token inside the thread
    feeder.request_stop();
    // feeder destructor calls join() — no explicit join needed
} // feeder is joined here automatically

int main() {
    example_with_callback();
    std::cout << "Main: feed thread fully stopped\n";
}`,
    explanation:
      "std::jthread wraps a thread with a cooperative stop mechanism: `stop_requested()` is a polled signal visible inside the lambda, and the jthread's destructor calls `request_stop()` then `join()` automatically. This eliminates the two most common threading bugs in market-data systems: forgetting to join (which UB-terminates) and busy-spinning on a volatile flag across cache lines.",
  },
  {
    id: "cpp-20260716-b1-lock-free-stack-aba",
    language: "cpp",
    title: "Lock-Free Stack with Tagged Pointer (ABA Prevention)",
    tag: "low-latency",
    code: `#include <atomic>
#include <cstdint>
#include <optional>
#include <iostream>

// ABA problem: thread 1 reads head=A, sleeps. Thread 2 pops A, pushes B, pops B,
// re-pushes A (reused). Thread 1 CAS succeeds (head still == A) but A's next
// pointer now points to freed memory.
// Fix: tag the pointer with a version counter in the high bits.

template<typename T>
class LockFreeStack {
    struct Node { T data; Node* next; };

    // Pack (48-bit pointer + 16-bit version) into one uint64_t.
    // On x86-64, user-space pointers only use the lower 48 bits.
    struct TaggedPtr {
        Node*    ptr;
        uint16_t tag;
    };

    // Use a 128-bit compare-and-exchange to atomically update both pointer and tag.
    // On x86-64 CMPXCHG16B is available; std::atomic<TaggedPtr> may need __int128.
    // Here we use a simple struct padded to 16 bytes for clarity.
    struct alignas(16) Head {
        Node*    ptr = nullptr;
        uint64_t tag = 0;
    };
    std::atomic<Head> head_{};

public:
    void push(T val) {
        Node* node = new Node{std::move(val), nullptr};
        Head  old  = head_.load(std::memory_order_relaxed);
        Head  next;
        do {
            node->next = old.ptr;
            next = { node, old.tag + 1 };  // bump version
        } while (!head_.compare_exchange_weak(old, next,
                  std::memory_order_release, std::memory_order_relaxed));
    }

    std::optional<T> pop() {
        Head old = head_.load(std::memory_order_acquire);
        Head next;
        while (old.ptr) {
            next = { old.ptr->next, old.tag + 1 };  // bump version on pop too
            if (head_.compare_exchange_weak(old, next,
                    std::memory_order_acquire, std::memory_order_relaxed)) {
                T val = std::move(old.ptr->data);
                delete old.ptr;
                return val;
            }
        }
        return std::nullopt;
    }
};

int main() {
    LockFreeStack<int> stk;
    stk.push(1); stk.push(2); stk.push(3);
    while (auto v = stk.pop()) std::cout << *v << " "; // 3 2 1
    std::cout << "\n";
}`,
    explanation:
      "The ABA problem occurs when a CAS on the pointer alone succeeds despite the list having changed: the tag (version counter) bumped on every push and pop ensures that even if the same pointer value reappears, the tag differs, causing the CAS to fail and retry. The 128-bit CMPXCHG16B on x86-64 makes the tag+pointer update atomic without locks.",
  },
  {
    id: "cpp-20260716-b1-simd-batch-delta",
    language: "cpp",
    title: "SSE2 SIMD Batch Black-Scholes Delta Calculation",
    tag: "low-latency",
    code: `#include <immintrin.h>
#include <cmath>
#include <vector>
#include <iostream>

// Compute BS call delta = N(d1) for 2 options at once using SSE2 double precision.
// Real production code uses AVX-512 (8 doubles) or a SIMD erfc approximation.
// Shown here with SSE2 (2 doubles) for clarity.

// Rational approximation for N(x) accurate to 1e-7 (Hart & Cheney)
static double norm_cdf_scalar(double x) {
    return 0.5 * std::erfc(-x * M_SQRT1_2);
}

// Scalar reference implementation
void bs_delta_scalar(const double* S, const double* K, double r,
                     const double* sigma, double T, double* out, int n) {
    for (int i = 0; i < n; ++i) {
        double d1 = (std::log(S[i]/K[i]) + (r + 0.5*sigma[i]*sigma[i])*T)
                    / (sigma[i]*std::sqrt(T));
        out[i] = norm_cdf_scalar(d1);
    }
}

// SIMD version: process 2 doubles at once with SSE2
// (A production version would use the SVML _mm_erfc_pd intrinsic or a poly approx)
void bs_delta_sse2_demo(double S0, double S1,
                         double K0, double K1,
                         double r, double sig0, double sig1, double T,
                         double& d0, double& d1) {
    // Compute d1 = (log(S/K) + (r + 0.5*sigma^2)*T) / (sigma*sqrt(T))
    __m128d vS   = _mm_set_pd(S1, S0);
    __m128d vK   = _mm_set_pd(K1, K0);
    __m128d vsig = _mm_set_pd(sig1, sig0);
    __m128d vT   = _mm_set1_pd(T);
    __m128d vr   = _mm_set1_pd(r);
    __m128d v05  = _mm_set1_pd(0.5);

    // log(S/K): no SSE2 intrinsic — compute scalar and reload
    double logSK[2] = { std::log(S0/K0), std::log(S1/K1) };
    __m128d vLogSK  = _mm_loadu_pd(logSK);

    // (r + 0.5*sigma^2)*T
    __m128d vDrift = _mm_mul_pd(
        _mm_add_pd(vr, _mm_mul_pd(v05, _mm_mul_pd(vsig, vsig))),
        vT
    );
    // sigma*sqrt(T)
    __m128d vSigSqT = _mm_mul_pd(vsig, _mm_set1_pd(std::sqrt(T)));

    // d1 = (logSK + drift) / sigSqT
    __m128d vD1 = _mm_div_pd(_mm_add_pd(vLogSK, vDrift), vSigSqT);

    // Scalar erfc for N(d1) (bottleneck in real code; replace with poly approx)
    double d1_arr[2]; _mm_storeu_pd(d1_arr, vD1);
    d0 = norm_cdf_scalar(d1_arr[0]);
    d1 = norm_cdf_scalar(d1_arr[1]);
}

int main() {
    double delta0, delta1;
    bs_delta_sse2_demo(100, 105, 100, 100, 0.05, 0.2, 0.25, 1.0, delta0, delta1);
    std::cout << "Delta ATM: " << delta0 << " ITM: " << delta1 << "\n";
    // ~0.637, ~0.694
}`,
    explanation:
      "SSE2 `_mm_set_pd` / `_mm_add_pd` / `_mm_mul_pd` instructions process 2 double-precision values simultaneously, halving the arithmetic latency per option. The bottleneck is usually `erfc` (transcendental): replacing it with a degree-7 minimax polynomial (Intel SVML or a custom approximation) achieves full 2× throughput. On AVX-512, 8 options per instruction cycle gives an 8× speedup for batch Greek requests.",
  },
  {
    id: "cpp-20260716-b1-mmap-prices",
    language: "cpp",
    title: "Memory-Mapped Historical Price File for Zero-Copy Backtesting",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <span>
#include <iostream>

// Memory-mapped binary price file: no read() calls, no user-space buffer.
// The OS page-maps the file directly into the process address space.
// First access faults in pages from disk; subsequent accesses are RAM-speed.

struct PriceRecord {
    int64_t timestamp_us;  // microseconds since epoch
    double  open, high, low, close;
    int64_t volume;
};

class MappedPriceFile {
    void*       base_ = MAP_FAILED;
    std::size_t size_ = 0;
    int         fd_   = -1;

public:
    explicit MappedPriceFile(const char* path) {
        fd_ = open(path, O_RDONLY);
        if (fd_ < 0) throw std::runtime_error("open failed");

        struct stat st;
        if (fstat(fd_, &st) < 0) { close(fd_); throw std::runtime_error("fstat"); }
        size_ = static_cast<std::size_t>(st.st_size);

        base_ = mmap(nullptr, size_, PROT_READ, MAP_PRIVATE | MAP_POPULATE, fd_, 0);
        if (base_ == MAP_FAILED) { close(fd_); throw std::runtime_error("mmap"); }

        // Advise sequential access pattern to enable readahead
        madvise(base_, size_, MADV_SEQUENTIAL);
    }

    ~MappedPriceFile() {
        if (base_ != MAP_FAILED) munmap(base_, size_);
        if (fd_ >= 0) close(fd_);
    }

    // Zero-copy view over all records — no memcpy
    std::span<const PriceRecord> records() const {
        return { static_cast<const PriceRecord*>(base_),
                 size_ / sizeof(PriceRecord) };
    }

    // Prefetch a range of records into L3 cache before processing
    void prefetch_range(std::size_t start, std::size_t count) const {
        auto* r = static_cast<const char*>(base_)
                  + start * sizeof(PriceRecord);
        for (std::size_t i = 0; i < count * sizeof(PriceRecord); i += 64)
            __builtin_prefetch(r + i, 0, 1);
    }

    MappedPriceFile(const MappedPriceFile&)            = delete;
    MappedPriceFile& operator=(const MappedPriceFile&) = delete;
};

// Usage (file must be pre-written as raw PriceRecord structs):
// MappedPriceFile f("prices.bin");
// for (const auto& r : f.records()) process(r);`,
    explanation:
      "mmap gives zero-copy access to historical data: the kernel maps the file directly into the process's virtual address space. MAP_POPULATE pre-faults all pages at open time (trading startup latency for zero page faults during the backtest loop). MADV_SEQUENTIAL triggers kernel readahead, keeping the page cache warm 64+ pages ahead of the current position.",
  },
  {
    id: "cpp-20260716-b1-robin-hood-hash",
    language: "cpp",
    title: "Robin Hood Probing Hash Map with Backward Shift Deletion",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cstddef>
#include <cassert>
#include <array>
#include <optional>
#include <cstring>
#include <iostream>

// Robin Hood hashing: on insertion, steal slots from "rich" elements (those
// close to their home slot) for "poor" elements (those far away).
// Property: max probe length is minimised across all elements.
// Backward shift deletion: on erase, shift following elements back to fill
// the gap — no tombstones needed, maintaining cache-friendly clustering.

template<std::size_t Cap>
class RobinHoodMap {
    static_assert((Cap & (Cap - 1)) == 0);
    static constexpr uint64_t EMPTY = ~uint64_t{0};

    struct Slot {
        uint64_t key  = EMPTY;
        int      val  = 0;
        int      dist = 0;  // probe distance from home slot
    };
    std::array<Slot, Cap> slots_{};

    std::size_t home(uint64_t k) const {
        // Fibonacci hashing
        return (k * 11400714819323198485ULL) >> (64 - __builtin_ctzll(Cap));
    }

public:
    bool insert(uint64_t key, int val) {
        Slot cur{key, val, 0};
        std::size_t idx = home(key);
        for (std::size_t i = 0; i < Cap; ++i, ++cur.dist) {
            Slot& s = slots_[(idx + i) & (Cap - 1)];
            if (s.key == EMPTY) { s = cur; return true; }
            if (s.key == key)   { s.val = val; return true; }
            // Robin Hood: steal slot from the "rich" element
            if (s.dist < cur.dist) std::swap(s, cur);
        }
        return false;
    }

    int* find(uint64_t key) {
        std::size_t idx = home(key);
        for (std::size_t d = 0; d < Cap; ++d) {
            Slot& s = slots_[(idx + d) & (Cap - 1)];
            if (s.key == EMPTY || s.dist < static_cast<int>(d)) return nullptr;
            if (s.key == key)   return &s.val;
        }
        return nullptr;
    }

    bool erase(uint64_t key) {
        std::size_t idx = home(key);
        for (std::size_t d = 0; d < Cap; ++d) {
            std::size_t pos = (idx + d) & (Cap - 1);
            Slot& s = slots_[pos];
            if (s.key == EMPTY || s.dist < static_cast<int>(d)) return false;
            if (s.key == key) {
                // Backward shift: slide later elements into this gap
                for (std::size_t j = 1; j < Cap; ++j) {
                    std::size_t cur = (pos + j) & (Cap - 1);
                    std::size_t prv = (pos + j - 1) & (Cap - 1);
                    if (slots_[cur].key == EMPTY || slots_[cur].dist == 0) {
                        slots_[prv] = {};  // clear last shifted slot
                        return true;
                    }
                    slots_[prv] = slots_[cur];
                    --slots_[prv].dist;
                }
                return true;
            }
        }
        return false;
    }
};

int main() {
    RobinHoodMap<256> m;
    m.insert(1001, 42); m.insert(1002, 99);
    std::cout << *m.find(1001) << "\n"; // 42
    m.erase(1001);
    std::cout << (m.find(1001) == nullptr) << "\n"; // 1 (not found)
}`,
    explanation:
      "Robin Hood probing reduces the variance in probe distance: no element is ever more than a few slots from its home, so the worst-case lookup (linear scan until dist < probeLen) terminates quickly. Backward shift deletion avoids tombstones — which grow probe lengths over time — by closing the gap immediately. At 70% load factor, average probes per lookup is ~1.5 vs ~2.5 for standard linear probing.",
  },
  {
    id: "cpp-20260716-b1-timer-wheel",
    language: "cpp",
    title: "Two-Level Timer Wheel for O(1) Order Timeout Scheduling",
    tag: "data-structures",
    code: `#include <array>
#include <list>
#include <cstdint>
#include <cassert>
#include <iostream>

// Hierarchical (two-level) timer wheel: inner wheel = fine resolution (1 ms ticks,
// 256 slots covering 256 ms); outer wheel = coarse (256 ms ticks, 256 slots covering ~65 s).
// Insert = O(1), advance-tick = O(1) amortized, cancel = O(1) given iterator.

using OrderId = uint64_t;

struct TimerEntry {
    OrderId   id;
    uint64_t  expires_at;  // absolute tick count
};

class TimerWheel {
    static constexpr std::size_t INNER = 256;
    static constexpr std::size_t OUTER = 256;

    using Bucket = std::list<TimerEntry>;
    std::array<Bucket, INNER> inner_;
    std::array<Bucket, OUTER> outer_;

    uint64_t current_tick_  = 0;

public:
    using Handle = Bucket::iterator;

    // Schedule: insert into the correct inner or outer slot
    Handle schedule(OrderId id, uint64_t delay_ticks) {
        uint64_t expires = current_tick_ + delay_ticks;
        if (delay_ticks < INNER) {
            auto& b = inner_[expires % INNER];
            b.push_back({id, expires});
            return std::prev(b.end());
        } else {
            // Coarse slot: outer wheel
            uint64_t outer_idx = (expires / INNER) % OUTER;
            auto& b = outer_[outer_idx];
            b.push_back({id, expires});
            return std::prev(b.end());
        }
    }

    // Cancel: O(1) given the iterator returned by schedule
    void cancel(Bucket::iterator it, uint64_t expires_at) {
        // Determine which bucket holds this entry
        if (expires_at - current_tick_ < INNER)
            inner_[expires_at % INNER].erase(it);
        else
            outer_[(expires_at / INNER) % OUTER].erase(it);
    }

    // Advance clock by one tick; return expired order IDs
    std::list<OrderId> advance() {
        std::list<OrderId> expired;
        ++current_tick_;

        // Drain expired inner bucket
        auto& ib = inner_[current_tick_ % INNER];
        for (auto& e : ib)
            if (e.expires_at == current_tick_) expired.push_back(e.id);
        ib.remove_if([&](const TimerEntry& e){ return e.expires_at == current_tick_; });

        // On inner wheel rollover, cascade one outer slot into inner
        if ((current_tick_ % INNER) == 0) {
            uint64_t outer_idx = (current_tick_ / INNER) % OUTER;
            for (auto& e : outer_[outer_idx])
                schedule(e.id, e.expires_at - current_tick_);
            outer_[outer_idx].clear();
        }
        return expired;
    }
};

int main() {
    TimerWheel tw;
    auto h1 = tw.schedule(1001, 10);   // expires at tick 10
    auto h2 = tw.schedule(1002, 300);  // expires at tick 300 (outer wheel)
    for (int i = 0; i < 12; ++i) {
        auto ex = tw.advance();
        if (!ex.empty()) std::cout << "Tick " << i+1 << ": expired order " << ex.front() << "\n";
    }
    // Prints: Tick 10: expired order 1001
}`,
    explanation:
      "A two-level timer wheel amortises cascade cost: the inner wheel handles short timeouts in O(1) per tick; the outer wheel stores far-future timeouts and cascades them into the inner wheel when the inner rolls over. For HFT order management with millions of active orders and 1 ms resolution, this achieves near-zero per-tick CPU cost compared to a sorted `std::multimap` which costs O(log N) per expiry check.",
  },
  {
    id: "cpp-20260716-b1-expression-template-pnl",
    language: "cpp",
    title: "Expression Template for Zero-Allocation Portfolio PnL",
    tag: "meta-programming",
    code: `#include <cstddef>
#include <array>
#include <iostream>

// Expression templates: the expression A * w + B * v builds a lazy AST node.
// No intermediate vector is allocated; the final assignment evaluates the
// entire expression element-by-element in one pass.

// Base: any expression has a subscript operator and a size
template<typename E>
struct Expr {
    double   operator[](std::size_t i) const { return static_cast<const E&>(*this)[i]; }
    std::size_t size()                 const { return static_cast<const E&>(*this).size(); }
};

// A fixed-size vector of doubles
template<std::size_t N>
struct Vec : Expr<Vec<N>> {
    std::array<double, N> data{};
    double   operator[](std::size_t i) const { return data[i]; }
    std::size_t size()                 const { return N; }
};

// Scalar * Vector
template<typename E>
struct Scale : Expr<Scale<E>> {
    double scalar; const E& expr;
    Scale(double s, const E& e) : scalar(s), expr(e) {}
    double   operator[](std::size_t i) const { return scalar * expr[i]; }
    std::size_t size()                 const { return expr.size(); }
};
template<typename E>
Scale<E> operator*(double s, const Expr<E>& e) { return {s, static_cast<const E&>(e)}; }

// Vector + Vector (or any two Exprs)
template<typename L, typename R>
struct Add : Expr<Add<L, R>> {
    const L& lhs; const R& rhs;
    Add(const L& l, const R& r) : lhs(l), rhs(r) {}
    double   operator[](std::size_t i) const { return lhs[i] + rhs[i]; }
    std::size_t size()                 const { return lhs.size(); }
};
template<typename L, typename R>
Add<L, R> operator+(const Expr<L>& l, const Expr<R>& r) {
    return {static_cast<const L&>(l), static_cast<const R&>(r)};
}

// Assignment from any expression
template<std::size_t N>
template<typename E>
// Note: template member defined outside class for clarity
// (in practice this lives inside Vec<N> body)

// Evaluate expression into Vec — one pass, no temporaries
template<std::size_t N, typename E>
void assign(Vec<N>& dst, const Expr<E>& src) {
    for (std::size_t i = 0; i < N; ++i) dst.data[i] = src[i];
}

int main() {
    Vec<4> prices{};  prices.data = {100.0, 50.0, 200.0, 75.0};
    Vec<4> weights{}; weights.data = {0.4, 0.3, 0.2, 0.1};
    Vec<4> pnl_prev{};pnl_prev.data = {5.0, -2.0, 10.0, 1.0};

    // pnl = 1.05 * (prices * weights) + 0.5 * pnl_prev
    // One pass, zero intermediate allocations
    Vec<4> pnl{};
    assign(pnl, 1.05 * (1.0 * prices) + 0.5 * pnl_prev);  // simplified: weights omitted for brevity

    for (auto v : pnl.data) std::cout << v << " ";
    std::cout << "\n";
}`,
    explanation:
      "Expression templates turn arithmetic on arrays into a compile-time AST: `1.05 * prices + 0.5 * pnl_prev` builds `Add<Scale<Vec>, Scale<Vec>>` without allocating any temporary array. When `assign()` evaluates the expression, the compiler inlines everything into a single loop, generating the same code as a hand-written fused loop — critical for computing portfolio Greeks over 10,000+ positions.",
  },
  {
    id: "cpp-20260716-b1-policy-based-executor",
    language: "cpp",
    title: "Policy-Based Execution Strategy (TWAP vs VWAP at Compile Time)",
    tag: "meta-programming",
    code: `#include <vector>
#include <numeric>
#include <iostream>
#include <cstddef>

// Policy-based design: the execution algorithm (TWAP, VWAP, POV) is a
// compile-time template parameter. No virtual dispatch, full inlining.

// TWAP policy: split uniformly across N intervals
struct TWAPPolicy {
    static std::vector<double> slice(double total_qty, std::size_t intervals,
                                     const std::vector<double>& /*volumes*/) {
        double per_slice = total_qty / intervals;
        return std::vector<double>(intervals, per_slice);
    }
    static const char* name() { return "TWAP"; }
};

// VWAP policy: distribute proportionally to historical volume profile
struct VWAPPolicy {
    static std::vector<double> slice(double total_qty, std::size_t intervals,
                                     const std::vector<double>& volumes) {
        double total_vol = std::accumulate(volumes.begin(), volumes.end(), 0.0);
        std::vector<double> slices(intervals);
        for (std::size_t i = 0; i < intervals; ++i)
            slices[i] = total_qty * volumes[i] / total_vol;
        return slices;
    }
    static const char* name() { return "VWAP"; }
};

// Percentage-of-volume policy
struct POVPolicy {
    double pov_rate;
    explicit POVPolicy(double r = 0.10) : pov_rate(r) {}
    std::vector<double> slice(double /*total*/, std::size_t intervals,
                              const std::vector<double>& volumes) const {
        std::vector<double> slices(intervals);
        for (std::size_t i = 0; i < intervals; ++i)
            slices[i] = volumes[i] * pov_rate;
        return slices;
    }
    static const char* name() { return "POV"; }
};

// Executor: parameterised on the policy
template<typename Policy>
class OrderExecutor {
    Policy policy_;
public:
    explicit OrderExecutor(Policy p = {}) : policy_(std::move(p)) {}

    void execute(double total_qty, const std::vector<double>& vol_profile) {
        auto slices = policy_.slice(total_qty, vol_profile.size(), vol_profile);
        double filled = 0;
        for (std::size_t i = 0; i < slices.size(); ++i) {
            filled += slices[i];
            std::cout << Policy::name() << " interval " << i
                      << ": qty=" << slices[i] << " cumul=" << filled << "\n";
        }
    }
};

int main() {
    std::vector<double> vol_profile = {1e6, 2e6, 3e6, 2e6, 1e6}; // U-shaped volume
    OrderExecutor<TWAPPolicy>{}.execute(1000, vol_profile);
    std::cout << "---\n";
    OrderExecutor<VWAPPolicy>{}.execute(1000, vol_profile);
}`,
    explanation:
      "Policy-based design moves execution algorithm selection to compile time: the compiler generates a separate `execute()` function body per policy with all branching eliminated. Compared to a virtual `IExecutionPolicy` interface, this avoids the per-call vtable lookup (~3 ns) and enables the compiler to inline the entire `slice()` body, often fusing it with the fill-recording loop.",
  },
  {
    id: "cpp-20260716-b1-symbol-intern-pool",
    language: "cpp",
    title: "Symbol Intern Pool (String View Arena for Zero-Copy Lookups)",
    tag: "data-structures",
    code: `#include <string_view>
#include <unordered_set>
#include <vector>
#include <string>
#include <cstring>
#include <cstddef>
#include <iostream>

// Symbol intern pool: each unique symbol string is stored exactly once in
// a bump-allocated arena. Callers receive a stable string_view that they
// can compare by pointer identity (same pointer == same symbol).
// Eliminates repeated heap allocations for high-frequency symbol lookups.

class SymbolPool {
    static constexpr std::size_t CHUNK = 65536;
    std::vector<std::vector<char>> chunks_;
    std::size_t                    offset_ = CHUNK;  // force first alloc

    struct SVHash {
        std::size_t operator()(std::string_view sv) const noexcept {
            // FNV-1a
            std::size_t h = 14695981039346656037ULL;
            for (char c : sv) { h ^= (unsigned char)c; h *= 1099511628211ULL; }
            return h;
        }
    };
    std::unordered_set<std::string_view, SVHash> interned_;

    char* arena_alloc(std::size_t bytes) {
        if (offset_ + bytes > CHUNK) {
            chunks_.emplace_back(CHUNK);
            offset_ = 0;
        }
        char* p = chunks_.back().data() + offset_;
        offset_ += bytes;
        return p;
    }

public:
    // Intern a symbol: returns a stable view pointing into the arena.
    // If already interned, returns existing view (pointer equality guaranteed).
    std::string_view intern(std::string_view sv) {
        auto it = interned_.find(sv);
        if (it != interned_.end()) return *it;

        char* dest = arena_alloc(sv.size());
        std::memcpy(dest, sv.data(), sv.size());
        std::string_view stable(dest, sv.size());
        interned_.insert(stable);
        return stable;
    }

    // After interning, symbols with the same value have the same .data() pointer
    bool same_symbol(std::string_view a, std::string_view b) const noexcept {
        return a.data() == b.data();
    }
};

int main() {
    SymbolPool pool;
    auto aapl1 = pool.intern("AAPL");
    auto aapl2 = pool.intern("AAPL");  // same string — same pointer
    auto goog  = pool.intern("GOOG");

    std::cout << std::boolalpha;
    std::cout << pool.same_symbol(aapl1, aapl2) << "\n"; // true — pointer eq
    std::cout << pool.same_symbol(aapl1, goog)  << "\n"; // false
    std::cout << aapl1 << " " << goog << "\n";            // AAPL GOOG
}`,
    explanation:
      "Interning symbols allows O(1) equality comparison by pointer (data() address) rather than O(len) character comparison. For a market-data handler receiving 100,000 messages/sec with 4-byte tickers, pointer comparison saves ~4 ns per comparison vs. std::string comparison, and the arena eliminates ~1 million allocator calls per second compared to naively storing a std::string per message.",
  },
  {
    id: "cpp-20260716-b1-variadic-spread-order",
    language: "cpp",
    title: "Variadic Template Multi-Leg Spread Order with Net Greeks",
    tag: "meta-programming",
    code: `#include <tuple>
#include <cmath>
#include <iostream>
#include <utility>
#include <type_traits>

// A spread order consists of N legs: each leg has a ratio (signed)
// and an instrument with known delta and DV01. Variadic templates
// let us compute net greeks at compile time for any number of legs.

struct Leg {
    double ratio;   // positive=buy, negative=sell
    double delta;   // underlying exposure per unit
    double dv01;    // interest rate sensitivity per unit ($)
    double qty;     // number of units
};

// Net delta: sum(leg.ratio * leg.delta * leg.qty) across all legs
template<typename... Legs>
double net_delta(const Legs&... legs) {
    return (... + (legs.ratio * legs.delta * legs.qty)); // C++17 fold
}

template<typename... Legs>
double net_dv01(const Legs&... legs) {
    return (... + (legs.ratio * legs.dv01 * legs.qty));
}

template<typename... Legs>
double net_notional(const Legs&... legs) {
    return (... + std::abs(legs.ratio * legs.qty));
}

// Spread order struct wrapping a tuple of legs
template<typename... Legs>
struct SpreadOrder {
    std::tuple<Legs...> legs;

    explicit SpreadOrder(Legs... ls) : legs(std::move(ls)...) {}

    double delta() const {
        return std::apply([](const auto&... l){ return net_delta(l...); }, legs);
    }
    double dv01() const {
        return std::apply([](const auto&... l){ return net_dv01(l...); }, legs);
    }
    double notional() const {
        return std::apply([](const auto&... l){ return net_notional(l...); }, legs);
    }
    static constexpr std::size_t n_legs() { return sizeof...(Legs); }
};

// Factory for convenient construction
template<typename... Legs>
SpreadOrder<Legs...> make_spread(Legs... legs) { return SpreadOrder<Legs...>(std::move(legs)...); }

int main() {
    // 2-leg calendar spread: buy 1 front month, sell 1 back month
    auto spread = make_spread(
        Leg{+1.0, 0.50, 85.0, 10},   // front: long 10 units, delta=0.5, dv01=$85
        Leg{-1.0, 0.45, 90.0, 10}    // back:  short 10 units, delta=0.45, dv01=$90
    );
    std::cout << "Legs: "     << spread.n_legs()  << "\n"; // 2
    std::cout << "Net delta: "<< spread.delta()   << "\n"; // (0.5 - 0.45)*10 = 0.5
    std::cout << "Net DV01: " << spread.dv01()    << "\n"; // (85 - 90)*10 = -50
}`,
    explanation:
      "Variadic template legs allow the compiler to unroll the Greek summation into a constant number of additions — no loop, no vector, no heap allocation. The `sizeof...(Legs)` count is a compile-time constant, enabling static assertion checks (e.g., reject single-leg spreads). C++17 fold expressions `(... + expr)` replace manual recursive template specialisations.",
  },
  {
    id: "cpp-20260716-b1-pool-unique-ptr",
    language: "cpp",
    title: "Custom Deleter unique_ptr Returning to a Pool",
    tag: "allocators",
    code: `#include <memory>
#include <array>
#include <cstddef>
#include <cassert>
#include <iostream>

// Pool-backed unique_ptr: destruction returns the object to the pool
// instead of calling delete. Zero heap interaction on the hot path.

template<typename T, std::size_t Cap = 512>
class ObjectPool {
    union Slot { char data[sizeof(T)]; Slot* next; };
    std::array<Slot, Cap> storage_;
    Slot*                 free_ = nullptr;
    std::size_t           allocated_ = 0;

public:
    ObjectPool() {
        // Build free list
        for (std::size_t i = Cap - 1; i > 0; --i)
            storage_[i].next = &storage_[i - 1];
        storage_[0].next = nullptr;
        free_ = &storage_[Cap - 1];
    }

    T* alloc() {
        if (!free_) return new T{};  // fallback
        Slot* s = free_;
        free_   = s->next;
        ++allocated_;
        return reinterpret_cast<T*>(s->data);
    }

    void dealloc(T* p) {
        p->~T();
        auto* s = reinterpret_cast<Slot*>(p);
        s->next = free_;
        free_   = s;
        --allocated_;
    }

    std::size_t in_use() const { return allocated_; }

    // Custom deleter for use with unique_ptr
    struct Deleter {
        ObjectPool* pool;
        void operator()(T* p) const { pool->dealloc(p); }
    };

    using Ptr = std::unique_ptr<T, Deleter>;

    Ptr make() {
        T* p = alloc();
        new(p) T{};   // placement new (default construct)
        return Ptr(p, Deleter{this});
    }
};

struct Order { uint64_t id; double price; int qty; };

int main() {
    ObjectPool<Order> pool;
    {
        auto o1 = pool.make();
        o1->id = 1; o1->price = 100.5; o1->qty = 100;
        auto o2 = pool.make();
        o2->id = 2; o2->price = 101.0; o2->qty = 200;
        std::cout << "In use: " << pool.in_use() << "\n"; // 2
    } // o1, o2 destroyed here — returned to pool, not freed
    std::cout << "In use: " << pool.in_use() << "\n"; // 0

    auto o3 = pool.make(); // reuses o1 or o2's slot
    std::cout << "Reused\n";
}`,
    explanation:
      "A custom deleter on `std::unique_ptr` intercepts destruction and returns the object to the pool instead of calling `delete`. The pool's slab allocator recycles slots via a free list — alloc and dealloc are two pointer swaps, costing ~3 ns vs. 40–200 ns for `malloc`/`free`. RAII ownership is fully preserved: the object is always returned to the pool on scope exit or exception.",
  },
  {
    id: "cpp-20260716-b1-pmr-pool-resource",
    language: "cpp",
    title: "std::pmr::unsynchronized_pool_resource for Fixed-Size Orders",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <cstddef>
#include <cstdint>
#include <iostream>

// pmr::unsynchronized_pool_resource manages a per-thread pool of same-size chunks.
// Unlike monotonic_buffer_resource, it supports deallocation: returned chunks
// go into a free list for reuse without touching the OS allocator.
// "unsynchronized" = no mutex — use only from one thread.

struct Order {
    uint64_t id;
    double   price;
    int      qty;
    bool     active;
};

class OrderManager {
    // Single 64 KB upstream buffer; pool draws from it
    alignas(64) std::byte upstream_buf_[1 << 16];
    std::pmr::monotonic_buffer_resource upstream_{
        upstream_buf_, sizeof(upstream_buf_)};

    // Pool for Order-sized blocks (deallocation recycles to free list)
    std::pmr::unsynchronized_pool_resource pool_{
        std::pmr::pool_options{
            .max_blocks_per_chunk = 256,
            .largest_required_pool_block = sizeof(Order)
        },
        &upstream_};

    // pmr::vector of Order* using the pool allocator
    std::pmr::vector<Order*> active_orders_{&pool_};

public:
    Order* create(uint64_t id, double px, int qty) {
        // Allocate from pool: O(1) free-list pop
        void* mem = pool_.allocate(sizeof(Order), alignof(Order));
        auto* o   = new(mem) Order{id, px, qty, true};
        active_orders_.push_back(o);
        return o;
    }

    void cancel(Order* o) {
        o->active = false;
        o->~Order();
        pool_.deallocate(o, sizeof(Order), alignof(Order));
        // Remove from vector (linear scan — production uses index map)
        active_orders_.erase(
            std::remove(active_orders_.begin(), active_orders_.end(), o),
            active_orders_.end());
    }

    std::size_t size() const { return active_orders_.size(); }
};

int main() {
    OrderManager mgr;
    auto* o1 = mgr.create(1, 100.25, 500);
    auto* o2 = mgr.create(2, 101.00, 200);
    std::cout << "Active: " << mgr.size() << "\n"; // 2
    mgr.cancel(o1);
    std::cout << "Active: " << mgr.size() << "\n"; // 1
    // o1's memory returns to pool — next create() reuses it
    auto* o3 = mgr.create(3, 102.00, 100);
    std::cout << "Active: " << mgr.size() << "\n"; // 2
}`,
    explanation:
      "pmr::unsynchronized_pool_resource maintains segregated free lists per block size: for uniform `sizeof(Order)` allocations, every `allocate()` and `deallocate()` is a free-list pop/push — no system call, no fragmentation. Feeding it from a monotonic upstream buffer means the OS sees only one large allocation at startup; subsequent pool operations are entirely in user space.",
  },
  {
    id: "cpp-20260716-b1-expected-chain",
    language: "cpp",
    title: "std::expected Chain for Order Validation (C++23)",
    tag: "meta-programming",
    code: `#include <expected>
#include <string>
#include <cstdint>
#include <iostream>
#include <functional>

// std::expected<T, E> either holds a T (success) or an E (error).
// Chaining with .and_then() propagates the error automatically —
// no exception overhead, no nested if/else, no -1 return-code pattern.

enum class OrderError {
    INVALID_PRICE,
    ZERO_QTY,
    POSITION_LIMIT,
    SYMBOL_NOT_FOUND,
};

std::string to_string(OrderError e) {
    switch (e) {
        case OrderError::INVALID_PRICE:    return "INVALID_PRICE";
        case OrderError::ZERO_QTY:         return "ZERO_QTY";
        case OrderError::POSITION_LIMIT:   return "POSITION_LIMIT";
        case OrderError::SYMBOL_NOT_FOUND: return "SYMBOL_NOT_FOUND";
    }
    return "UNKNOWN";
}

struct Order { uint64_t id; std::string symbol; double price; int qty; };

using Result = std::expected<Order, OrderError>;

Result validate_price(Order o) {
    if (o.price <= 0.0 || o.price > 1e7)
        return std::unexpected(OrderError::INVALID_PRICE);
    return o;
}

Result validate_qty(Order o) {
    if (o.qty <= 0)
        return std::unexpected(OrderError::ZERO_QTY);
    return o;
}

Result check_position_limit(Order o) {
    static const int MAX_QTY = 10000;
    if (o.qty > MAX_QTY)
        return std::unexpected(OrderError::POSITION_LIMIT);
    return o;
}

Result check_symbol(Order o) {
    if (o.symbol.empty())
        return std::unexpected(OrderError::SYMBOL_NOT_FOUND);
    return o;
}

// Chain: each step only runs if the previous succeeded
Result validate_order(Order o) {
    return Result{o}
        .and_then(validate_price)
        .and_then(validate_qty)
        .and_then(check_position_limit)
        .and_then(check_symbol);
}

int main() {
    Order good{1, "AAPL", 150.0, 500};
    Order bad_price{2, "GOOG", -1.0, 100};
    Order too_large{3, "MSFT", 100.0, 50000};

    for (auto& o : {good, bad_price, too_large}) {
        auto res = validate_order(o);
        if (res) std::cout << "OK: " << res->symbol << "\n";
        else     std::cout << "ERR: " << to_string(res.error()) << "\n";
    }
}`,
    explanation:
      "std::expected's `.and_then()` implements the railway-oriented programming pattern: a successful result flows through each validator; the first failure short-circuits the chain and propagates the error to the caller. Compared to exception-based validation, this is zero-overhead on the success path (no `try/catch`), and the error type is explicit in the function signature — self-documenting and compiler-enforced.",
  },
  {
    id: "cpp-20260716-b1-cache-oblivious-transpose",
    language: "cpp",
    title: "Cache-Oblivious Matrix Transpose for Covariance Computation",
    tag: "low-latency",
    code: `#include <vector>
#include <algorithm>
#include <iostream>
#include <cstddef>

// Cache-oblivious transpose: recursively divide the matrix until sub-blocks
// fit in L1 cache, then transpose in-place. No explicit tile-size parameter —
// optimal for any cache hierarchy.

// In-place transpose of a square matrix (N x N)
void transpose_recursive(std::vector<double>& A, std::size_t row0, std::size_t col0,
                          std::size_t rows, std::size_t cols, std::size_t N) {
    if (rows <= 1 && cols <= 1) return;

    // Square block: split the larger dimension
    if (rows >= cols) {
        std::size_t half = rows / 2;
        transpose_recursive(A, row0,        col0, half,        cols, N);
        transpose_recursive(A, row0 + half, col0, rows - half, cols, N);
    } else {
        std::size_t half = cols / 2;
        transpose_recursive(A, row0, col0,        rows, half,        N);
        transpose_recursive(A, row0, col0 + half, rows, cols - half, N);
    }

    // Swap symmetric elements for off-diagonal blocks
    if (row0 != col0) {
        std::size_t r_end = row0 + rows;
        std::size_t c_end = col0 + cols;
        for (std::size_t r = row0; r < r_end; ++r)
            for (std::size_t c = col0; c < c_end; ++c)
                if (r < c) std::swap(A[r * N + c], A[c * N + r]);
    }
}

// Symmetrise a correlation/covariance matrix from the upper triangle
void symmetrise(std::vector<double>& C, std::size_t N) {
    for (std::size_t i = 0; i < N; ++i)
        for (std::size_t j = i + 1; j < N; ++j)
            C[j * N + i] = C[i * N + j];
}

// Out-of-place transpose: result[j*N+i] = src[i*N+j]
void transpose_out_of_place(const std::vector<double>& src,
                             std::vector<double>& dst, std::size_t N) {
    dst.resize(N * N);
    for (std::size_t i = 0; i < N; ++i)
        for (std::size_t j = 0; j < N; ++j)
            dst[j * N + i] = src[i * N + j];
}

int main() {
    std::size_t N = 4;
    std::vector<double> A = {
        1, 2, 3, 4,
        5, 6, 7, 8,
        9,10,11,12,
       13,14,15,16
    };
    std::vector<double> AT;
    transpose_out_of_place(A, AT, N);
    for (std::size_t i = 0; i < N; ++i) {
        for (std::size_t j = 0; j < N; ++j) std::cout << AT[i*N+j] << " ";
        std::cout << "\n";
    }
}`,
    explanation:
      "Cache-oblivious transpose recurses until blocks fit in L1 cache, accessing memory in large sequential strides — ideal for covariance matrices that are read once to compute AT×A and then forgotten. The recursive divide-and-conquer pattern achieves O(N²/B) cache misses (B = cache line size) vs. O(N²) for the naïve row-by-row approach, cutting L3 cache misses by 8–16× for N=500.",
  },
  {
    id: "cpp-20260716-b1-stateful-visitor",
    language: "cpp",
    title: "Stateful std::visit Visitor for Cumulative Fill Aggregation",
    tag: "meta-programming",
    code: `#include <variant>
#include <vector>
#include <iostream>
#include <numeric>

// Unlike a pure function visitor, a stateful visitor struct accumulates
// state across multiple visit() calls — useful for streaming order events.

struct NewOrder  { uint64_t id; double price; int qty; bool buy; };
struct Fill      { uint64_t order_id; double fill_price; int fill_qty; };
struct Cancel    { uint64_t order_id; };

using OrderEvent = std::variant<NewOrder, Fill, Cancel>;

// Stateful visitor: accumulates filled notional and counts events
struct FillAggregator {
    double total_notional = 0.0;
    int    total_filled   = 0;
    int    n_new          = 0;
    int    n_cancel       = 0;

    void operator()(const NewOrder& o) {
        ++n_new;
        std::cout << "New order " << o.id << " px=" << o.price << "\n";
    }

    void operator()(const Fill& f) {
        total_notional += f.fill_price * f.fill_qty;
        total_filled   += f.fill_qty;
        std::cout << "Fill ord=" << f.order_id
                  << " qty=" << f.fill_qty << " px=" << f.fill_price << "\n";
    }

    void operator()(const Cancel& c) {
        ++n_cancel;
        std::cout << "Cancel ord=" << c.order_id << "\n";
    }

    void report() const {
        std::cout << "Summary: fills=" << total_filled
                  << " notional=" << total_notional
                  << " new=" << n_new << " cancel=" << n_cancel << "\n";
    }
};

int main() {
    std::vector<OrderEvent> events = {
        NewOrder{1, 100.25, 1000, true},
        Fill{1, 100.25, 500},
        Fill{1, 100.30, 500},
        NewOrder{2, 101.00, 200, false},
        Cancel{2},
    };

    FillAggregator agg;
    for (const auto& ev : events)
        std::visit(agg, ev);

    agg.report();
    // Summary: fills=1000 notional=100275.0 new=2 cancel=1
}`,
    explanation:
      "A stateful visitor struct accumulates running totals across heterogeneous event types without heap allocation or type erasure. Each `std::visit(agg, ev)` dispatches on the variant's type index using a compiler-generated jump table, then calls the matching overload on `agg`. This pattern replaces the classic `switch(event.type)` anti-pattern with exhaustive, type-safe dispatch.",
  },
  {
    id: "cpp-20260716-b1-ranges-lazy-greeks",
    language: "cpp",
    title: "std::ranges Lazy Greek Grid via iota + transform",
    tag: "data-structures",
    code: `#include <ranges>
#include <cmath>
#include <vector>
#include <algorithm>
#include <iostream>
#include <numeric>

// iota_view generates indices lazily; transform computes Greeks on demand.
// No intermediate storage for the strike/spot grid.

struct Greeks { double strike, delta, gamma, vega; };

Greeks compute_greeks(double S, double K, double r, double sigma, double T) {
    auto ncdf = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    auto npdf = [](double x){ return std::exp(-0.5*x*x) / std::sqrt(2*M_PI); };
    double d1   = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2   = d1 - sigma*std::sqrt(T);
    double delta = ncdf(d1);
    double gamma = npdf(d1) / (S * sigma * std::sqrt(T));
    double vega  = S * npdf(d1) * std::sqrt(T);
    return { K, delta, gamma, vega };
}

int main() {
    const double S = 100.0, r = 0.05, sigma = 0.2, T = 1.0;

    // Lazy strike grid from 80 to 120 in steps of 5
    auto strikes = std::views::iota(0, 9)
        | std::views::transform([](int i){ return 80.0 + i * 5.0; });

    // Compute Greeks for each strike lazily — no vector<double> for strikes
    auto greek_grid = strikes
        | std::views::transform([&](double K){
            return compute_greeks(S, K, r, sigma, T);
          });

    // Consume: print and compute average delta
    double sum_delta = 0.0; int count = 0;
    for (const auto& g : greek_grid) {
        std::cout << "K=" << g.strike << " delta=" << g.delta
                  << " gamma=" << g.gamma << "\n";
        sum_delta += g.delta; ++count;
    }
    std::cout << "Avg delta: " << sum_delta / count << "\n";
}`,
    explanation:
      "iota_view generates the strike indices without heap allocation; the chained transform computes Greeks element-by-element only when the range is iterated — never materialising the full grid. For a 100-strike surface scanned once per tick, the zero-allocation lazy pipeline saves ~10 KB of temporary vector construction and the associated cache pressure.",
  },
  {
    id: "cpp-20260716-b1-constexpr-log2-ticks",
    language: "cpp",
    title: "constexpr Integer Log2 for O(1) Tick-Size Bucket Assignment",
    tag: "meta-programming",
    code: `#include <cstdint>
#include <cassert>
#include <array>
#include <iostream>

// Tick-size regimes: sub-penny, penny, nickel, dime, quarter, dollar, ...
// Assigning a price to its tick bucket is a classic O(1) operation using log2.
// constexpr bit-manipulation log2 avoids the transcendental std::log2 function.

constexpr int clog2(uint64_t x) noexcept {
    if (x == 0) return -1;
    return 63 - __builtin_clzll(x);   // position of highest set bit
}

// Tick-size bucket by order of magnitude in ticks
// ticks_per_cent = 100 (1 cent tick = 1 tick)
// bucket 0: 1 tick, bucket 1: 2-3 ticks, bucket k: 2^k .. 2^(k+1)-1 ticks
constexpr int tick_bucket(uint64_t price_ticks) noexcept {
    return clog2(price_ticks);
}

// Map tick bucket to display precision (decimal places)
static constexpr std::array<int, 8> BUCKET_DECIMALS = {4, 3, 3, 2, 2, 1, 1, 0};
constexpr int price_decimals(uint64_t price_ticks) noexcept {
    int b = tick_bucket(price_ticks);
    if (b < 0 || b >= static_cast<int>(BUCKET_DECIMALS.size())) return 0;
    return BUCKET_DECIMALS[b];
}

// Verify at compile time
static_assert(clog2(1)   == 0);
static_assert(clog2(2)   == 1);
static_assert(clog2(255) == 7);
static_assert(clog2(256) == 8);
static_assert(tick_bucket(100) == 6);  // 1.00 in 2dp = 100 ticks, log2(100)=6

// O(1) tick normalisation: round price to nearest tick grid
uint64_t snap_to_grid(uint64_t price_ticks, uint64_t tick_size) noexcept {
    return (price_ticks / tick_size) * tick_size;
}

int main() {
    for (uint64_t p : {uint64_t(1), uint64_t(10), uint64_t(100), uint64_t(1000)}) {
        std::cout << "price_ticks=" << p
                  << " bucket=" << tick_bucket(p)
                  << " decimals=" << price_decimals(p) << "\n";
    }
}`,
    explanation:
      "Integer log2 via `__builtin_clzll` (count-leading-zeros) executes in a single BSR instruction on x86. Using it to bucket price ticks by order of magnitude enables O(1) selection of the correct price-display precision and tick-size validation without any floating-point arithmetic or lookup tables. The constexpr annotation moves all bucket computations to compile time for constant operands.",
  },
  {
    id: "cpp-20260716-b1-thread-pool-latch",
    language: "cpp",
    title: "Thread Pool with std::latch for Batch Greek Computation",
    tag: "low-latency",
    code: `#include <thread>
#include <latch>
#include <vector>
#include <functional>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <iostream>
#include <cmath>

// std::latch: countdown-once synchronisation primitive (C++20).
// Useful for fan-out / fan-in: distribute N tasks to a thread pool,
// wait for all N to complete with latch.wait().

class ThreadPool {
    std::vector<std::thread>          workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex                        mu_;
    std::condition_variable           cv_;
    std::atomic<bool>                 stop_{false};

public:
    explicit ThreadPool(int n) {
        for (int i = 0; i < n; ++i)
            workers_.emplace_back([this]{
                while (true) {
                    std::function<void()> task;
                    {
                        std::unique_lock lock(mu_);
                        cv_.wait(lock, [this]{ return stop_ || !tasks_.empty(); });
                        if (stop_ && tasks_.empty()) return;
                        task = std::move(tasks_.front()); tasks_.pop();
                    }
                    task();
                }
            });
    }

    ~ThreadPool() {
        stop_ = true; cv_.notify_all();
        for (auto& t : workers_) t.join();
    }

    void submit(std::function<void()> f) {
        { std::lock_guard lock(mu_); tasks_.push(std::move(f)); }
        cv_.notify_one();
    }
};

// Compute BS delta for a batch of options in parallel using a latch
void batch_delta(ThreadPool& pool,
                 const std::vector<double>& strikes, double S, double r,
                 double sigma, double T, std::vector<double>& deltas) {
    int n = static_cast<int>(strikes.size());
    deltas.resize(n);
    std::latch done(n);   // count down from n to 0

    for (int i = 0; i < n; ++i) {
        pool.submit([&, i]{
            double K  = strikes[i];
            double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
            deltas[i] = 0.5 * std::erfc(-d1 / std::sqrt(2.0));
            done.count_down();  // decrement latch
        });
    }
    done.wait();  // block until all n tasks complete
}

int main() {
    ThreadPool pool(4);
    std::vector<double> strikes = {90, 95, 100, 105, 110};
    std::vector<double> deltas;
    batch_delta(pool, strikes, 100, 0.05, 0.2, 1.0, deltas);
    for (int i = 0; i < (int)strikes.size(); ++i)
        std::cout << "K=" << strikes[i] << " delta=" << deltas[i] << "\n";
}`,
    explanation:
      "std::latch is a one-shot barrier: it counts down from N to 0 and then releases all threads waiting on `latch.wait()`. Unlike `std::barrier` (reusable) or `std::condition_variable` (needs a flag), a latch perfectly models a batch of independent tasks with a single synchronisation point at the end. For batch option repricing (N strikes × M underlyings), the fan-out / fan-in pattern exploits all CPU cores with minimal coordination overhead.",
  },
  {
    id: "cpp-20260716-b1-fix-checksum",
    language: "cpp",
    title: "Branch-Free FIX Message Checksum and Trailer Appender",
    tag: "low-latency",
    code: `#include <cstdint>
#include <string_view>
#include <array>
#include <cstdio>
#include <cstring>
#include <iostream>

// FIX CheckSum (tag 10): sum of all byte values mod 256, formatted as 3-digit decimal.
// The loop is auto-vectorisable; no branches on character values.

// Branch-free byte sum — compiler emits SIMD reduction on x86-64
uint8_t fix_checksum(const char* data, std::size_t len) noexcept {
    uint64_t acc = 0;
    for (std::size_t i = 0; i < len; ++i)
        acc += static_cast<uint8_t>(data[i]);
    return static_cast<uint8_t>(acc & 0xFF); // mod 256
}

// Append body-length (tag 9) and checksum (tag 10) fields to a FIX message.
// Returns the total message length (including appended trailer).
// Assumes buf has at least len + 32 bytes of space.
std::size_t fix_add_trailer(char* buf, std::size_t body_start, std::size_t body_len) {
    // Prepend BodyLength = everything after BeginString up to checksum
    // (In practice tag 9 is already in the body — we just compute checksum here)
    uint8_t cs = fix_checksum(buf, body_start + body_len);

    // Format: "10=XYZ\x01"
    char trailer[12];
    int  tlen = std::snprintf(trailer, sizeof(trailer), "10=%03u\x01", cs);

    // Compute final checksum including the "10=???" field itself
    // (standard requires checksum of entire message including tag 10 except the value)
    // Simplified: append the precomputed checksum
    std::memcpy(buf + body_start + body_len, trailer, static_cast<std::size_t>(tlen));
    return body_start + body_len + static_cast<std::size_t>(tlen);
}

// Quick test
int main() {
    // Minimal FIX message (not fully valid — illustrative)
    char msg[256];
    const char body[] = "8=FIX.4.4\x01""9=12\x01""35=D\x01""49=SENDER\x01";
    std::size_t blen = sizeof(body) - 1;
    std::memcpy(msg, body, blen);

    std::size_t total = fix_add_trailer(msg, 0, blen);
    msg[total] = '\0';

    uint8_t cs = fix_checksum(msg, blen);
    std::cout << "Checksum: " << (int)cs
              << " (" << std::printf("%03d", cs) << ")\n";
    std::cout << "Trailer: 10=" << std::string_view(msg + blen, 7) << "\n";
}`,
    explanation:
      "The FIX checksum loop is a pure byte accumulation — no conditional per character — which lets GCC/Clang auto-vectorise it with VPSUBB/VPSADBW on AVX2, summing 32 bytes per cycle. On a 100-byte FIX message, the vectorised checksum takes ~5 ns vs. ~25 ns for the scalar loop. The `& 0xFF` truncation is the same as `% 256` for unsigned arithmetic but avoids the division instruction.",
  },
  {
    id: "cpp-20260716-b1-price-level-book",
    language: "cpp",
    title: "std::map Price-Level Order Book with O(1) Best-Price Query",
    tag: "data-structures",
    code: `#include <map>
#include <list>
#include <cstdint>
#include <unordered_map>
#include <optional>
#include <iostream>

// Full limit order book using std::map<int64_t, Level>.
// std::map keeps price levels sorted: begin() = lowest bid, rbegin() = best bid.
// std::list per level for FIFO price-time priority.
// O(log P) insertion (P = distinct price levels, typically small).

struct Order {
    uint64_t id;
    int32_t  qty;
    bool     active = true;
    std::list<Order*>::iterator list_it;  // for O(1) cancel
};

struct Level {
    std::list<Order*> orders;
    int64_t           total_qty = 0;
};

class OrderBook {
    std::map<int64_t, Level, std::greater<>>  bids_;  // descending (best = begin)
    std::map<int64_t, Level>                  asks_;  // ascending  (best = begin)
    std::unordered_map<uint64_t, std::pair<bool, int64_t>> id_to_side_price_;
    // id -> (is_bid, price_ticks)

public:
    void add(uint64_t id, int64_t price_ticks, int32_t qty, bool is_bid) {
        auto& book = is_bid ? bids_ : asks_;
        Level& lvl = book[price_ticks];
        lvl.orders.push_back(new Order{id, qty});
        lvl.orders.back()->list_it = std::prev(lvl.orders.end());
        lvl.total_qty += qty;
        id_to_side_price_[id] = {is_bid, price_ticks};
    }

    bool cancel(uint64_t id) {
        auto it = id_to_side_price_.find(id);
        if (it == id_to_side_price_.end()) return false;
        auto [is_bid, price] = it->second;
        auto& book = is_bid ? bids_ : asks_;
        Level& lvl = book[price];
        Order* o   = *std::prev(lvl.orders.end()); // placeholder; use list_it
        // O(1) erase using stored iterator
        lvl.total_qty -= o->qty;
        lvl.orders.erase(o->list_it);
        if (lvl.orders.empty()) book.erase(price);
        delete o;
        id_to_side_price_.erase(it);
        return true;
    }

    // O(1): best bid/ask are begin() iterators
    std::optional<int64_t> best_bid() const {
        if (bids_.empty()) return {};
        return bids_.begin()->first;
    }
    std::optional<int64_t> best_ask() const {
        if (asks_.empty()) return {};
        return asks_.begin()->first;
    }
    int64_t spread() const {
        auto b = best_bid(), a = best_ask();
        return (b && a) ? *a - *b : -1;
    }
};

int main() {
    OrderBook book;
    book.add(1, 10025, 100, true);   // bid 100.25 x 100
    book.add(2, 10030, 200, false);  // ask 100.30 x 200
    book.add(3, 10020, 150, true);   // bid 100.20 x 150

    std::cout << "Best bid: " << *book.best_bid() << " ticks\n"; // 10025
    std::cout << "Best ask: " << *book.best_ask() << " ticks\n"; // 10030
    std::cout << "Spread:   " << book.spread()    << " ticks\n"; // 5
    book.cancel(1);
    std::cout << "After cancel, best bid: " << *book.best_bid() << "\n"; // 10020
}`,
    explanation:
      "std::map provides O(log P) price-level lookup with iterators that remain valid after insertion/removal — critical for cancel's O(1) list erase. Using `std::greater<>` for bids makes `bids_.begin()` the highest price (best bid), enabling best-price access in O(1) without scanning. The stored list iterator for each order id enables O(1) cancel without searching the price level.",
  },
  {
    id: "cpp-20260716-b1-token-bucket",
    language: "cpp",
    title: "Token Bucket Rate Limiter for Order Submission Throttling",
    tag: "low-latency",
    code: `#include <chrono>
#include <atomic>
#include <algorithm>
#include <iostream>
#include <thread>

// Token bucket rate limiter: allows burst up to capacity, then sustained rate.
// Each order consumes one token; tokens refill at the configured rate.
// Thread-safe via atomic double-CAS (or lock); shown here single-threaded for clarity.

class TokenBucket {
    using Clock    = std::chrono::steady_clock;
    using Duration = std::chrono::duration<double>;

    double   capacity_;     // max burst (tokens)
    double   rate_;         // tokens per second
    double   tokens_;       // current token count
    Clock::time_point last_refill_;

public:
    TokenBucket(double capacity, double rate_per_sec)
        : capacity_(capacity), rate_(rate_per_sec),
          tokens_(capacity), last_refill_(Clock::now()) {}

    // Attempt to consume \`cost\` tokens; returns true if allowed
    bool try_consume(double cost = 1.0) {
        refill();
        if (tokens_ >= cost) {
            tokens_ -= cost;
            return true;
        }
        return false;
    }

    // How many seconds until \`cost\` tokens are available
    double wait_time(double cost = 1.0) const {
        if (tokens_ >= cost) return 0.0;
        return (cost - tokens_) / rate_;
    }

private:
    void refill() {
        auto now     = Clock::now();
        double elapsed = std::chrono::duration<double>(now - last_refill_).count();
        tokens_      = std::min(capacity_, tokens_ + elapsed * rate_);
        last_refill_ = now;
    }
};

// Leaky bucket variant: fixed output rate, no burst
class LeakyBucket {
    double   rate_;        // orders per second
    double   backlog_;     // queued work
    std::chrono::steady_clock::time_point last_;

public:
    explicit LeakyBucket(double rate) : rate_(rate), backlog_(0.0),
                                         last_(std::chrono::steady_clock::now()) {}

    bool try_add(double work = 1.0) {
        auto now = std::chrono::steady_clock::now();
        double dt = std::chrono::duration<double>(now - last_).count();
        last_ = now;
        backlog_ = std::max(0.0, backlog_ - dt * rate_) + work;
        return backlog_ <= 1.0 / rate_;  // allow if backlog within one slot
    }
};

int main() {
    // 10 orders/sec sustained, 5 burst
    TokenBucket limiter(5.0, 10.0);
    int allowed = 0, denied = 0;
    for (int i = 0; i < 10; ++i) {
        if (limiter.try_consume()) ++allowed; else ++denied;
    }
    std::cout << "Allowed: " << allowed << " Denied: " << denied << "\n";
    // First 5 burst through; next 5 denied until tokens refill
}`,
    explanation:
      "The token bucket allows trading bursts (up to capacity tokens) while enforcing a sustained average rate: if 5 orders arrive simultaneously and capacity=5, all 5 pass; the 6th must wait for a token to refill. This models exchange order-submission rate limits precisely — exchanges typically publish a burst limit (e.g., 100 messages in 100 ms) plus a sustained rate (e.g., 500/sec) which map directly to capacity and rate parameters.",
  },
];
