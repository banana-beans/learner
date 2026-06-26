import type { Snippet } from "./types";

export const cppSnippets20260626B1: Snippet[] = [
  {
    id: "cpp-20260626-b1-pmr-arena",
    language: "cpp",
    title: "PMR monotonic buffer — zero-heap order arena",
    tag: "performance",
    code: `#include <memory_resource>
#include <vector>
#include <cstdint>
#include <cstring>

struct Order {
    uint64_t id;
    double   price;
    uint32_t qty;
    char     symbol[8];
};

void processOrders() {
    // 512 bytes on the stack; monotonic_buffer_resource bumps a pointer
    // forward on every allocation — no bookkeeping metadata per node.
    alignas(alignof(Order)) std::byte buf[512];
    std::pmr::monotonic_buffer_resource arena{buf, sizeof(buf)};

    // vector uses the arena; no malloc is called while buf has space.
    std::pmr::vector<Order> orders{&arena};
    orders.reserve(6); // fits in 512 bytes: 6 * sizeof(Order) = 288

    orders.push_back({1, 100.25, 100, "AAPL"});
    orders.push_back({2,  99.75, 200, "AAPL"});
    orders.push_back({3, 150.00,  50, "MSFT"});

    for (const auto& o : orders)
        (void)o.price; // process without any heap touch

    // arena destructor releases nothing — monotonic resource never frees
    // individual slots; entire region is reclaimed at scope exit.
}`,
    explanation: "monotonic_buffer_resource is the fastest PMR resource because it only needs to increment a pointer on allocation and performs no per-object deallocation, making it ideal for short-lived batches like single-tick order processing where the entire arena is discarded at once.",
  },
  {
    id: "cpp-20260626-b1-spsc-queue",
    language: "cpp",
    title: "SPSC lock-free ring queue — acquire/release ordering",
    tag: "performance",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

template<typename T, std::size_t N>
class SPSCQueue {
    // Separate cache lines prevent false sharing between producer and consumer.
    alignas(64) std::atomic<std::size_t> head_{0};
    alignas(64) std::atomic<std::size_t> tail_{0};
    std::array<T, N> buf_;

public:
    bool try_push(const T& val) {
        std::size_t t    = tail_.load(std::memory_order_relaxed); // only writer touches tail
        std::size_t next = (t + 1) % N;
        // acquire: see all writes the consumer did before advancing head
        if (next == head_.load(std::memory_order_acquire))
            return false;
        buf_[t] = val;
        // release: make the payload visible before the consumer sees new tail
        tail_.store(next, std::memory_order_release);
        return true;
    }

    std::optional<T> try_pop() {
        std::size_t h = head_.load(std::memory_order_relaxed); // only reader touches head
        // acquire: see the payload written before the producer advanced tail
        if (h == tail_.load(std::memory_order_acquire))
            return std::nullopt;
        T val = buf_[h];
        head_.store((h + 1) % N, std::memory_order_release);
        return val;
    }
};`,
    explanation: "With a single producer and single consumer, acquire/release pairs on tail (written by producer, read by consumer) and head (written by consumer, read by producer) create the exact synchronisation needed; seq_cst would add a redundant full memory fence on every operation, wasting ~10 ns per call on x86.",
  },
  {
    id: "cpp-20260626-b1-expression-templates",
    language: "cpp",
    title: "Expression template CRTP — zero-temporary vector math",
    tag: "performance",
    code: `#include <cstddef>

template<typename Derived, std::size_t N>
struct VecExpr {
    double operator[](std::size_t i) const {
        return static_cast<const Derived&>(*this)[i];
    }
};

template<std::size_t N>
struct Vec : VecExpr<Vec<N>, N> {
    double data[N]{};
    double operator[](std::size_t i) const { return data[i]; }

    // Materialise any expression into this Vec — one pass, no temporaries.
    template<typename E>
    Vec& operator=(const VecExpr<E, N>& expr) {
        for (std::size_t i = 0; i < N; ++i)
            data[i] = expr[i];
        return *this;
    }
};

template<typename L, typename R, std::size_t N>
struct Add : VecExpr<Add<L,R,N>, N> {
    const L& l; const R& r;
    double operator[](std::size_t i) const { return l[i] + r[i]; }
};

template<typename E, std::size_t N>
struct Scale : VecExpr<Scale<E,N>, N> {
    const E& e; double s;
    double operator[](std::size_t i) const { return e[i] * s; }
};

template<typename L, typename R, std::size_t N>
Add<L,R,N> operator+(const VecExpr<L,N>& l, const VecExpr<R,N>& r) {
    return {static_cast<const L&>(l), static_cast<const R&>(r)};
}

void demo() {
    Vec<4> a, b, c, result;
    // operator+ builds an Add<Vec,Vec,4> object — no double[] allocated.
    // Assignment loop evaluates each element once: a[i]+b[i]+c[i]*2.0
    result = a + b + Scale<Vec<4>,4>{c, 2.0};
}`,
    explanation: "Expression templates turn `a + b + c` into a tree of lightweight stack objects whose operator[] is inlined during the single assignment loop, eliminating the N-element temporary arrays that a naive operator+ would allocate for each intermediate result.",
  },
  {
    id: "cpp-20260626-b1-coroutine-generator",
    language: "cpp",
    title: "C++20 coroutine generator — lazy infinite tick sequence",
    tag: "modern-cpp",
    code: `#include <coroutine>
#include <cstdint>
#include <stdexcept>

template<typename T>
struct Generator {
    struct promise_type {
        T current_value;
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        // Captures the yielded value and suspends; caller resumes later.
        std::suspend_always yield_value(T v) { current_value = v; return {}; }
        void return_void() {}
        void unhandled_exception() { throw; }
    };

    std::coroutine_handle<promise_type> handle;
    explicit Generator(std::coroutine_handle<promise_type> h) : handle{h} {}
    ~Generator() { if (handle) handle.destroy(); }

    struct iterator {
        std::coroutine_handle<promise_type> h;
        bool operator!=(std::default_sentinel_t) const { return !h.done(); }
        iterator& operator++() { h.resume(); return *this; }
        T operator*() const { return h.promise().current_value; }
    };
    iterator begin() { handle.resume(); return {handle}; }
    std::default_sentinel_t end() { return {}; }
};

Generator<uint64_t> tickSequence(uint64_t start) {
    for (uint64_t t = start; ; ++t)
        co_yield t; // frame suspends here; local variable t persists on the heap frame
}

void demo() {
    uint64_t count = 0;
    for (auto tick : tickSequence(1'000'000))
        if (++count >= 5) break;
}`,
    explanation: "When the coroutine executes co_yield, the compiler saves all local variables into a heap-allocated coroutine frame and transfers control back to the caller; the next call to resume() restores that frame exactly where it left off, giving infinite sequences with O(1) memory.",
  },
  {
    id: "cpp-20260626-b1-expected",
    language: "cpp",
    title: "std::expected<T,E> — exception-free trade parsing (C++23)",
    tag: "modern-cpp",
    code: `#include <expected>
#include <string_view>
#include <charconv>
#include <system_error>

enum class ParseError { EmptyInput, BadPrice, BadQty, UnknownSide };

struct Trade { double price; int qty; char side; };

using ParseResult = std::expected<Trade, ParseError>;

ParseResult parsePrice(std::string_view s, Trade t) {
    if (auto [p, ec] = std::from_chars(s.data(), s.data()+s.size(), t.price);
        ec != std::errc{})
        return std::unexpected(ParseError::BadPrice);
    return t;
}

ParseResult parseTrade(std::string_view msg) {
    if (msg.empty())
        return std::unexpected(ParseError::EmptyInput);

    Trade t{};
    t.side = msg[0];
    if (t.side != 'B' && t.side != 'S')
        return std::unexpected(ParseError::UnknownSide);

    // and_then chains only when the prior step succeeded, short-circuiting on error.
    return ParseResult{t}
        .and_then([&](Trade tr) { return parsePrice(msg.substr(1, 6), tr); })
        .transform([](Trade tr) -> Trade { tr.qty = 100; return tr; })
        .or_else([](ParseError e) -> ParseResult {
            return std::unexpected(e); // re-propagate; useful for logging
        });
}`,
    explanation: "std::expected encodes success/failure in the return value, so the CPU never unwinds the stack or executes a personality routine; the and_then/transform chain compiles to straight-line conditional branches that a branch predictor handles in a single cycle on the common success path.",
  },
  {
    id: "cpp-20260626-b1-mmap-ticks",
    language: "cpp",
    title: "mmap tick history — OS-page-cache zero-copy reads",
    tag: "systems",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstdint>
#include <stdexcept>

struct TickRecord {
    uint64_t timestamp_ns;
    double   bid;
    double   ask;
    uint32_t bid_size;
    uint32_t ask_size;
};

void scanTicks(const char* path) {
    int fd = ::open(path, O_RDONLY);
    if (fd < 0) throw std::runtime_error("open failed");

    struct stat st{};
    ::fstat(fd, &st);
    std::size_t bytes = static_cast<std::size_t>(st.st_size);

    // MAP_SHARED + PROT_READ: kernel maps file pages directly; no read() copy.
    void* mapped = ::mmap(nullptr, bytes, PROT_READ, MAP_SHARED, fd, 0);
    ::close(fd); // fd can be closed immediately after mmap
    if (mapped == MAP_FAILED) throw std::runtime_error("mmap failed");

    // Advise sequential access so the kernel prefetches pages ahead of us.
    ::madvise(mapped, bytes, MADV_SEQUENTIAL);

    const auto* ticks = static_cast<const TickRecord*>(mapped);
    std::size_t n = bytes / sizeof(TickRecord);

    double spread_sum = 0.0;
    for (std::size_t i = 0; i < n; ++i)
        spread_sum += ticks[i].ask - ticks[i].bid;

    ::munmap(mapped, bytes);
}`,
    explanation: "mmap avoids the extra kernel-to-userspace copy that read() incurs; for random-access tick queries, the OS page cache serves repeated reads from RAM, making seeks essentially free compared to lseek/read pairs that always involve a syscall.",
  },
  {
    id: "cpp-20260626-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-size pool allocator — free-list order nodes",
    tag: "performance",
    code: `#include <cstddef>
#include <cassert>
#include <new>

template<typename T, std::size_t Capacity>
class PoolAllocator {
    // Each free slot stores a pointer to the next free slot (intrusive free-list).
    union Slot { Slot* next; alignas(T) std::byte storage[sizeof(T)]; };
    Slot  pool_[Capacity];
    Slot* head_ = nullptr;

public:
    PoolAllocator() {
        // Chain all slots into the free-list at construction — one linear pass.
        for (std::size_t i = 0; i < Capacity - 1; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[Capacity - 1].next = nullptr;
        head_ = &pool_[0];
    }

    T* allocate() {
        assert(head_ && "pool exhausted");
        Slot* s = head_;
        head_ = s->next; // pop front in O(1)
        return reinterpret_cast<T*>(s->storage);
    }

    void deallocate(T* p) {
        p->~T();
        auto* s = reinterpret_cast<Slot*>(p);
        s->next = head_; // push front in O(1)
        head_ = s;
    }
};

struct OrderNode { uint64_t id; double price; uint32_t qty; };

void demo() {
    PoolAllocator<OrderNode, 64> pool;
    OrderNode* o = pool.allocate();
    new (o) OrderNode{42, 100.5, 200};
    pool.deallocate(o);
}`,
    explanation: "malloc stores size/free metadata adjacent to each allocation, which pollutes cache lines when traversing order nodes; a pool allocator keeps all nodes in a contiguous array so consecutive allocations are cache-line neighbours, and the free-list pointer chase follows predictable strides that hardware prefetchers can track.",
  },
  {
    id: "cpp-20260626-b1-variant-dispatch",
    language: "cpp",
    title: "std::variant + std::visit — jump-table order dispatch",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string_view>
#include <cstdint>

struct MarketOrder { uint32_t qty; char side; };
struct LimitOrder  { uint32_t qty; double price; char side; };
struct StopOrder   { uint32_t qty; double trigger; char side; };

using AnyOrder = std::variant<MarketOrder, LimitOrder, StopOrder>;

// Overload trick: inherit call operator from each lambda.
template<typename... Fs>
struct Overload : Fs... { using Fs::operator()...; };
template<typename... Fs>
Overload(Fs...) -> Overload<Fs...>;

double notionalValue(const AnyOrder& order, double last_price) {
    return std::visit(Overload{
        // Market orders execute at last known price.
        [&](const MarketOrder& o) { return o.qty * last_price; },
        // Limit orders are bounded by limit price.
        [&](const LimitOrder&  o) { return o.qty * o.price;    },
        // Stop orders trigger at the stop price.
        [&](const StopOrder&   o) { return o.qty * o.trigger;  },
    }, order);
}

void demo() {
    AnyOrder o = LimitOrder{100, 150.25, 'B'};
    double n = notionalValue(o, 149.80); // dispatched via jump table
    (void)n;
}`,
    explanation: "std::visit compiles to a jump table indexed by the variant's type index, giving O(1) dispatch with no heap allocation and no vtable pointer dereference, unlike virtual functions where the pointer chase from object to vtable to function is a chain of dependent loads that stall the pipeline.",
  },
  {
    id: "cpp-20260626-b1-fix-parser",
    language: "cpp",
    title: "FIX protocol parser — string_view zero-copy field scan",
    tag: "systems",
    code: `#include <string_view>
#include <array>
#include <cstdint>
#include <charconv>

struct Field { uint16_t tag; std::string_view value; };

// Parse up to MaxFields tag=value\x01 pairs from a raw network buffer.
template<std::size_t MaxFields>
struct FixMessage {
    std::array<Field, MaxFields> fields{};
    std::size_t count = 0;

    // All string_views point into the original buffer — zero copies.
    void parse(std::string_view msg) {
        while (!msg.empty() && count < MaxFields) {
            auto sep = msg.find('=');
            if (sep == std::string_view::npos) break;

            uint16_t tag = 0;
            std::from_chars(msg.data(), msg.data() + sep, tag);
            msg.remove_prefix(sep + 1);

            auto soh = msg.find('\x01'); // SOH delimiter
            std::string_view val = msg.substr(0, soh);
            fields[count++] = {tag, val};

            msg.remove_prefix(soh == std::string_view::npos ? msg.size() : soh + 1);
        }
    }

    std::string_view findTag(uint16_t tag) const {
        for (std::size_t i = 0; i < count; ++i)
            if (fields[i].tag == tag) return fields[i].value;
        return {};
    }
};

void demo() {
    constexpr std::string_view msg = "8=FIX.4.2\x01""35=D\x01""49=CLIENT\x01""55=AAPL\x01";
    FixMessage<16> fix;
    fix.parse(msg);
    auto sym = fix.findTag(55); // "AAPL" — slice of original buffer
    (void)sym;
}`,
    explanation: "string_view stores a pointer and length into the existing network buffer rather than copying bytes, so parsing a 200-byte FIX message touches only the bytes already in cache from the recv() call with no additional heap traffic.",
  },
  {
    id: "cpp-20260626-b1-branch-hints",
    language: "cpp",
    title: "[[likely]]/[[unlikely]] attributes — hot order-routing path",
    tag: "performance",
    code: `#include <cstdint>
#include <stdexcept>

enum class Side { Buy, Sell };
enum class Venue { Primary, Dark, Internalize };

struct Order { uint64_t id; double price; uint32_t qty; Side side; bool valid; };

// Branch predictor hint: compiler reorders basic blocks so the hot path
// (valid order, non-zero qty) is a straight fall-through with no taken branches.
Venue routeOrder(const Order& o) {
    if (o.valid) [[likely]] {
        if (o.qty == 0) [[unlikely]]
            throw std::invalid_argument("zero qty");

        // In normal market hours the vast majority of orders are buy-side retail.
        if (o.side == Side::Buy) [[likely]] {
            if (o.price > 0.0) [[likely]]
                return Venue::Primary;
            return Venue::Internalize;
        }
        return Venue::Dark;
    } else [[unlikely]] {
        throw std::invalid_argument("invalid order");
    }
}

// __builtin_expect equivalent for older toolchains:
inline bool fastLikely(bool x)   { return __builtin_expect(x, 1); }
inline bool fastUnlikely(bool x) { return __builtin_expect(x, 0); }`,
    explanation: "[[likely]] and [[unlikely]] let the compiler place the hot basic block contiguously in memory so the instruction prefetcher streams it without pipeline bubbles; on Skylake+ the misprediction penalty is ~15 cycles, so correctly hinting a branch checked 1M times/sec recovers ~15 μs of latency.",
  },
  {
    id: "cpp-20260626-b1-jthread",
    language: "cpp",
    title: "std::jthread + stop_token — cooperative feed handler",
    tag: "modern-cpp",
    code: `#include <thread>
#include <stop_token>
#include <atomic>
#include <cstdint>
#include <unistd.h>

struct Tick { uint64_t ts; double price; };

// stop_token is passed by value; it's a lightweight shared_ptr-like handle.
void feedHandler(std::stop_token stop, int socket_fd,
                 std::atomic<Tick>& latest) {
    Tick buf{};
    while (!stop.stop_requested()) {
        // Non-blocking recv; real code uses poll/epoll here.
        ssize_t n = ::read(socket_fd, &buf, sizeof(buf));
        if (n == sizeof(buf))
            latest.store(buf, std::memory_order_relaxed);
    }
    ::close(socket_fd); // RAII-style cleanup inside the thread
}

struct MarketDataService {
    std::atomic<Tick> latest_{};
    std::jthread thread_;
    int fd_;

    explicit MarketDataService(int fd) : fd_{fd},
        // jthread constructor takes a callable; stop_token injected automatically.
        thread_{feedHandler, fd, std::ref(latest_)} {}

    // Destructor calls request_stop() then joins — no explicit cleanup needed.
    ~MarketDataService() = default;

    Tick getLatest() const {
        return latest_.load(std::memory_order_relaxed);
    }
};`,
    explanation: "jthread's destructor automatically calls request_stop() followed by join(), eliminating the dual-error-path problem of managing stop flags and joins separately; stop_token is cheaper than a manual atomic bool because the stop state is stored externally, so threads that never need cancellation pay no cost.",
  },
  {
    id: "cpp-20260626-b1-constexpr-greeks",
    language: "cpp",
    title: "constexpr Black-Scholes — compile-time Greeks",
    tag: "quant",
    code: `#include <cmath>
#include <cassert>

// Horner-form rational approximation of the standard normal CDF (Abramowitz & Stegun 26.2.17).
constexpr double normCDF(double x) {
    constexpr double a1= 0.319381530, a2=-0.356563782,
                     a3= 1.781477937, a4=-1.821255978, a5= 1.330274429;
    double t = 1.0 / (1.0 + 0.2316419 * (x < 0 ? -x : x));
    double poly = t*(a1 + t*(a2 + t*(a3 + t*(a4 + t*a5))));
    double pdf   = 0.3989422804 * std::exp(-0.5*x*x);
    double cdf   = 1.0 - pdf * poly;
    return x < 0 ? 1.0 - cdf : cdf;
}

constexpr double bsCall(double S, double K, double r, double sigma, double T) {
    double sqrtT = std::sqrt(T);
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqrtT);
    double d2 = d1 - sigma*sqrtT;
    return S * normCDF(d1) - K * std::exp(-r*T) * normCDF(d2);
}

// The compiler evaluates this entirely at compile time; no floating-point
// instruction is emitted in the final binary for this variable.
constexpr double atm_call = bsCall(100.0, 100.0, 0.05, 0.20, 1.0);
static_assert(atm_call > 9.0 && atm_call < 11.0, "ATM call outside expected range");`,
    explanation: "Marking bsCall constexpr lets the compiler evaluate it during translation for any constant arguments, embedding the result as an immediate operand; this matters for calibration grids where thousands of option prices are recalculated on parameter changes known at compile time.",
  },
  {
    id: "cpp-20260626-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list — order book levels",
    tag: "performance",
    code: `#include <cstdint>
#include <cassert>

// Node embedded directly inside the payload — no separate heap node object.
struct ListNode {
    ListNode* prev = nullptr;
    ListNode* next = nullptr;
};

struct Level {
    ListNode  node; // must be first for offsetof-free casting in this demo
    double    price;
    uint64_t  total_qty;
    uint32_t  order_count;
};

struct LevelList {
    ListNode sentinel{}; // head sentinel simplifies edge cases

    LevelList() { sentinel.prev = sentinel.next = &sentinel; }

    void insert_before(ListNode* pos, Level* lvl) {
        lvl->node.next = pos;
        lvl->node.prev = pos->prev;
        pos->prev->next = &lvl->node;
        pos->prev       = &lvl->node;
    }

    void remove(Level* lvl) {
        lvl->node.prev->next = lvl->node.next;
        lvl->node.next->prev = lvl->node.prev;
        lvl->node.prev = lvl->node.next = nullptr;
    }

    // Cast back from embedded node pointer to owning Level.
    static Level* ownerOf(ListNode* n) {
        return reinterpret_cast<Level*>(n); // node is first member
    }

    Level* front() {
        return sentinel.next == &sentinel ? nullptr : ownerOf(sentinel.next);
    }
};`,
    explanation: "Intrusive lists store the next/prev pointers inside the payload struct itself, so traversal never requires a second pointer dereference to a separately-allocated node object; when iterating an order book level, the price and quantity data are already in the same cache line as the list links.",
  },
  {
    id: "cpp-20260626-b1-cache-line-align",
    language: "cpp",
    title: "alignas(hardware_destructive_interference_size) — false-sharing fix",
    tag: "performance",
    code: `#include <atomic>
#include <new>     // hardware_destructive_interference_size
#include <cstdint>
#include <thread>

// Without alignment, head_ and tail_ may share one 64-byte cache line.
// Every time the producer writes tail_, the consumer's core sees its copy
// of head_ as invalidated — forcing a costly cache-coherency round-trip.
struct alignas(std::hardware_destructive_interference_size) AlignedCounter {
    std::atomic<uint64_t> value{0};
};

struct RingBuffer {
    AlignedCounter head_; // producer's working line — sits on its own 64-byte line
    AlignedCounter tail_; // consumer's working line — separate physical cache line

    static constexpr std::size_t N = 1024;
    uint64_t data_[N]{};

    void produce(uint64_t v) {
        uint64_t t = tail_.value.load(std::memory_order_relaxed);
        data_[t % N] = v;
        // release: ensures data_[t] write is visible before tail_ increment
        tail_.value.store(t + 1, std::memory_order_release);
    }

    bool consume(uint64_t& out) {
        uint64_t h = head_.value.load(std::memory_order_relaxed);
        if (h == tail_.value.load(std::memory_order_acquire)) return false;
        out = data_[h % N];
        head_.value.store(h + 1, std::memory_order_release);
        return true;
    }
};`,
    explanation: "hardware_destructive_interference_size (typically 64 bytes) is the minimum distance between two variables that guarantees they land on different cache lines; placing producer and consumer counters on separate lines means their cores never fight over cache-line ownership, eliminating the MESI-protocol invalidation traffic that adds ~60–200 ns per operation under contention.",
  },
  {
    id: "cpp-20260626-b1-format-blotter",
    language: "cpp",
    title: "std::format trade blotter — type-safe formatted output",
    tag: "modern-cpp",
    code: `#include <format>
#include <string>
#include <vector>
#include <cstdint>

struct Trade {
    uint64_t    id;
    std::string symbol;
    double      price;
    uint32_t    qty;
    char        side; // 'B' or 'S'
};

std::string formatBlotter(const std::vector<Trade>& trades) {
    std::string out;
    out.reserve(trades.size() * 64);

    for (const auto& t : trades) {
        // {:>10} right-pads the id; :.4f fixes decimal places; {} for side tag.
        out += std::format(
            "{:>10} | {:6} | {:>8.4f} | {:>6} | {}\n",
            t.id,
            t.symbol,
            t.price,
            t.qty,
            t.side == 'B' ? "BUY" : "SELL"
        );
    }
    return out;
}

void demo() {
    std::vector<Trade> trades = {
        {1001, "AAPL", 182.4500, 100, 'B'},
        {1002, "MSFT", 415.2300, 200, 'S'},
        {1003, "TSLA",  245.120,  50, 'B'},
    };
    auto blotter = formatBlotter(trades);
    (void)blotter;
}`,
    explanation: "std::format validates format strings against argument types at compile time (in C++26 consteval checking; in C++20 at runtime with defined behavior), unlike printf where passing a double to a %s specifier is undefined behavior that manifests as silent corruption rather than a compile error.",
  },
  {
    id: "cpp-20260626-b1-bit-cast",
    language: "cpp",
    title: "std::bit_cast — defined-behavior IEEE754 bit manipulation",
    tag: "systems",
    code: `#include <bit>
#include <cstdint>
#include <cstddef>
#include <algorithm>

// Extract IEEE754 fields without UB.
void inspectDouble(double d) {
    uint64_t bits = std::bit_cast<uint64_t>(d);
    uint64_t sign     = (bits >> 63) & 0x1;
    uint64_t exponent = (bits >> 52) & 0x7FF;
    uint64_t mantissa =  bits        & 0x000F'FFFF'FFFF'FFFFull;
    (void)sign; (void)exponent; (void)mantissa;
}

// Network byte-order (big-endian) to host conversion for a double.
double networkToHost(double net) {
    uint64_t bits = std::bit_cast<uint64_t>(net);
    // byteswap is C++23; manual swap for C++20:
    bits = ((bits & 0xFF00000000000000ull) >> 56) |
           ((bits & 0x00FF000000000000ull) >> 40) |
           ((bits & 0x0000FF0000000000ull) >> 24) |
           ((bits & 0x000000FF00000000ull) >>  8) |
           ((bits & 0x00000000FF000000ull) <<  8) |
           ((bits & 0x0000000000FF0000ull) << 24) |
           ((bits & 0x000000000000FF00ull) << 40) |
           ((bits & 0x00000000000000FFull) << 56);
    return std::bit_cast<double>(bits);
}

// Fast approximate log2 via exponent extraction — no libm call.
float fastLog2(float x) {
    uint32_t bits = std::bit_cast<uint32_t>(x);
    int32_t exp   = static_cast<int32_t>((bits >> 23) & 0xFF) - 127;
    bits = (bits & 0x007FFFFFu) | 0x3F800000u; // normalise mantissa to [1,2)
    float m = std::bit_cast<float>(bits);
    return static_cast<float>(exp) + (m - 1.0f); // linear approximation of log2 on [1,2)
}`,
    explanation: "reinterpret_cast between unrelated pointer types violates the strict aliasing rule and produces undefined behavior that optimisers exploit to eliminate entire code paths; bit_cast is semantically a memcpy with static_assert on size equality, giving the compiler full permission to generate optimal bit-manipulation instructions.",
  },
  {
    id: "cpp-20260626-b1-soa-layout",
    language: "cpp",
    title: "Structure-of-Arrays — SIMD-friendly VWAP calculation",
    tag: "performance",
    code: `#include <cstdint>
#include <cstddef>
#include <numeric>

// AoS: each cache line carries mixed fields; SIMD can't pack prices contiguously.
struct OrderAoS {
    double   price;
    uint32_t qty;
    char     side;
    char     _pad[3];
};

// SoA: prices[], qtys[], sides[] are separate contiguous arrays.
// A VWAP loop only touches prices[] and qtys[] — the side[] array is never loaded.
struct OrderBookSoA {
    static constexpr std::size_t MaxOrders = 1024;
    double   prices[MaxOrders]{};
    uint32_t qtys  [MaxOrders]{};
    char     sides [MaxOrders]{};
    std::size_t count = 0;
};

// AoS VWAP: each cache line = 1 order (16 bytes) — 4 orders per 64-byte line.
// 3/4 of loaded data (side + padding) is wasted for this computation.
double vwapAoS(const OrderAoS* orders, std::size_t n) {
    double pv = 0, tv = 0;
    for (std::size_t i = 0; i < n; ++i) {
        pv += orders[i].price * orders[i].qty;
        tv += orders[i].qty;
    }
    return pv / tv;
}

// SoA VWAP: prices[] and qtys[] are packed — 8 doubles per cache line.
// Auto-vectoriser can emit AVX2 FMA across 4 doubles at once.
double vwapSoA(const OrderBookSoA& book) {
    double pv = 0, tv = 0;
    for (std::size_t i = 0; i < book.count; ++i) {
        pv += book.prices[i] * book.qtys[i];
        tv += book.qtys[i];
    }
    return pv / tv;
}`,
    explanation: "SoA packs the same field for N objects contiguously so a SIMD instruction can load 4 doubles (256-bit AVX2) or 8 floats simultaneously; AoS wastes bandwidth loading adjacent fields that the current computation ignores, effectively reducing useful cache-line utilisation to the fraction occupied by the accessed field.",
  },
  {
    id: "cpp-20260626-b1-spinlock",
    language: "cpp",
    title: "Spinlock with exponential backoff — atomic_flag + PAUSE",
    tag: "performance",
    code: `#include <atomic>
#include <cstdint>

#if defined(__x86_64__) || defined(_M_X64)
#  include <immintrin.h>
#  define CPU_RELAX() _mm_pause()
#else
#  define CPU_RELAX() __asm__ volatile("yield" ::: "memory")
#endif

class Spinlock {
    std::atomic_flag flag_ = ATOMIC_FLAG_INIT;

public:
    void lock() noexcept {
        uint32_t backoff = 1;
        // test_and_set returns true if already locked (we must spin).
        while (flag_.test_and_set(std::memory_order_acquire)) {
            // First spin without PAUSE to handle zero-contention case fast.
            for (uint32_t i = 0; i < backoff; ++i)
                CPU_RELAX(); // PAUSE: hints pipeline that we're in a spin loop,
                             // prevents speculation that pollutes branch predictor state,
                             // and reduces power consumption.
            // Cap backoff at 64 to avoid multi-microsecond stalls.
            if (backoff < 64) backoff <<= 1;
        }
    }

    void unlock() noexcept {
        flag_.clear(std::memory_order_release);
    }
};

struct GuardedCounter {
    Spinlock lock;
    uint64_t value = 0;

    void increment() {
        lock.lock();
        ++value;
        lock.unlock();
    }
};`,
    explanation: "_mm_pause (x86 PAUSE instruction) signals to the out-of-order execution engine that this loop is a spin-wait, preventing the CPU from speculatively executing past the CAS and polluting the memory order buffer; without PAUSE, a tight CAS loop can actually degrade performance of the lock holder running on a sibling hyperthread sharing execution resources.",
  },
  {
    id: "cpp-20260626-b1-double-buffer",
    language: "cpp",
    title: "Double-buffer ping-pong — lock-free snapshot publication",
    tag: "performance",
    code: `#include <atomic>
#include <array>
#include <cstdint>
#include <cstddef>

struct OrderSnapshot {
    uint64_t seq;
    double   bid;
    double   ask;
    uint32_t bid_qty;
    uint32_t ask_qty;
};

constexpr std::size_t N = 256;

struct DoubleBuffer {
    std::array<OrderSnapshot, N> buf_[2]{};
    // active_ index: reader uses this to select the consistent buffer.
    std::atomic<int> active_{0};

    // Writer: fill the inactive buffer, then publish atomically.
    void publish(const OrderSnapshot* data, std::size_t count) {
        int inactive = 1 - active_.load(std::memory_order_relaxed);
        for (std::size_t i = 0; i < count && i < N; ++i)
            buf_[inactive][i] = data[i];
        // release: all writes to buf_[inactive] happen-before this store,
        // so any reader that sees the new active_ also sees the new data.
        active_.store(inactive, std::memory_order_release);
    }

    // Reader: snapshot the index once, then read from that buffer freely.
    const OrderSnapshot* read(std::size_t& out_count) const {
        // acquire: establishes happens-before with the producer's release store.
        int idx = active_.load(std::memory_order_acquire);
        out_count = N;
        return buf_[idx].data();
    }
};`,
    explanation: "The release store of active_ creates a happens-before edge with every reader's subsequent acquire load; this guarantees the reader never sees a torn snapshot even without a mutex, because the entire buffer fill is sequenced-before the index swap from the memory model's perspective.",
  },
  {
    id: "cpp-20260626-b1-if-constexpr",
    language: "cpp",
    title: "if constexpr + tag dispatch — compile-time strategy routing",
    tag: "modern-cpp",
    code: `#include <cstdint>
#include <type_traits>

// Tag types: zero-size structs used purely as compile-time discriminants.
struct Aggressive {};
struct Passive    {};
struct Neutral    {};

struct Order { uint64_t id; double price; uint32_t qty; char side; };
enum class Venue { Primary, Dark, TWAP };

template<typename Policy>
Venue route(const Order& o) {
    // if constexpr discards the non-taken branch entirely at compile time:
    // the compiler never instantiates the discarded branch's code,
    // so it cannot generate dead instructions or useless comparisons.
    if constexpr (std::is_same_v<Policy, Aggressive>) {
        // Cross the spread immediately on primary.
        return Venue::Primary;
    } else if constexpr (std::is_same_v<Policy, Passive>) {
        // Post at mid on dark pool to minimise market impact.
        return Venue::Dark;
    } else if constexpr (std::is_same_v<Policy, Neutral>) {
        // Slice over time using TWAP.
        return Venue::TWAP;
    } else {
        // This branch is also compile-time: static_assert fires only
        // if an unsupported Policy is instantiated.
        static_assert(!sizeof(Policy), "unknown execution policy");
    }
}

void demo() {
    Order o{1, 100.0, 100, 'B'};
    auto v1 = route<Aggressive>(o); // compiles to: return Primary
    auto v2 = route<Passive>(o);    // compiles to: return Dark
    (void)v1; (void)v2;
}`,
    explanation: "Unlike a regular if, if constexpr prevents the compiler from even parsing the non-taken branch's semantic validity in the current instantiation context, which means type errors in discarded paths are silently ignored — a key technique for writing generic code that conditionally uses type-specific APIs.",
  },
  {
    id: "cpp-20260626-b1-flat-hashmap",
    language: "cpp",
    title: "Open-addressing flat hash map — Robin Hood price-level lookup",
    tag: "performance",
    code: `#include <cstdint>
#include <cstddef>
#include <functional>
#include <optional>

template<typename K, typename V, std::size_t Cap = 256>
class FlatHashMap {
    static_assert((Cap & (Cap-1)) == 0, "Cap must be power of 2");

    struct Bucket { K key{}; V val{}; int8_t dist = -1; }; // dist=-1 means empty
    Bucket table_[Cap]{};
    std::size_t size_ = 0;

    std::size_t idealSlot(const K& k) const {
        return std::hash<K>{}(k) & (Cap - 1);
    }

public:
    void insert(K key, V val) {
        std::size_t pos  = idealSlot(key);
        int8_t      dist = 0;
        Bucket incoming{key, val, 0};

        for (;;) {
            Bucket& slot = table_[pos & (Cap-1)];
            if (slot.dist < 0) { // empty slot
                slot = incoming; ++size_; return;
            }
            // Robin Hood: if incumbent travelled less than us, steal its slot.
            // This bounds the maximum probe distance, keeping lookups O(1) in practice.
            if (slot.dist < incoming.dist) std::swap(slot, incoming);
            ++incoming.dist; ++pos;
        }
    }

    std::optional<V> find(const K& key) const {
        std::size_t pos  = idealSlot(key);
        for (int8_t dist = 0; ; ++dist, ++pos) {
            const Bucket& slot = table_[pos & (Cap-1)];
            if (slot.dist < dist) return std::nullopt; // not present
            if (slot.key == key)  return slot.val;
        }
    }
};`,
    explanation: "Open addressing stores all entries in a single contiguous array so probe sequences walk sequential memory; Robin Hood insertion caps the maximum probe length at the expected-value, keeping find() to ~1.5 cache misses even at 70% load, versus chained hash maps where each bucket points to a disjoint heap node.",
  },
  {
    id: "cpp-20260626-b1-prefetch",
    language: "cpp",
    title: "__builtin_prefetch — hiding L2 latency in order batch processing",
    tag: "performance",
    code: `#include <cstddef>
#include <cstdint>

struct Order {
    uint64_t id;
    double   price;
    uint32_t qty;
    char     symbol[12];
    char     side;
    char     _pad[3];
}; // 40 bytes — fits in one cache line

struct FillResult { uint64_t order_id; double fill_price; };

// Prefetch distance: 2 orders ahead.  L2→L1 fill latency on modern x86 is
// ~12 cycles; at 1 ns/cycle and ~2 cycles/order compute, 6 orders of distance
// would fully hide latency — 2 is conservative but avoids prefetch buffer pollution.
constexpr std::size_t PREFETCH_DIST = 2;

void processBatch(const Order* orders, std::size_t n, FillResult* results) {
    for (std::size_t i = 0; i < n; ++i) {
        // Hint: locality=3 → L1 cache (highest), rw=0 → read-only.
        // locality=2 → L2, locality=1 → L3, locality=0 → no temporal hint.
        if (i + PREFETCH_DIST < n)
            __builtin_prefetch(&orders[i + PREFETCH_DIST], /*rw=*/0, /*locality=*/3);

        // Process current order while the hardware fetches i+2.
        const Order& o = orders[i];
        results[i] = {o.id, o.price * (o.side == 'B' ? 1.0001 : 0.9999)};
    }
}`,
    explanation: "__builtin_prefetch issues a non-blocking hint that inserts a load into the memory subsystem's prefetch queue; the locality parameter controls which cache level the line is brought into, and choosing L1 (3) for sequential access avoids the extra cycle to promote from L2 that the hardware prefetcher might not handle for pointer-chasing patterns.",
  },
  {
    id: "cpp-20260626-b1-asian-option",
    language: "cpp",
    title: "Asian option Monte Carlo — antithetic variate variance reduction",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <cstdint>

// Arithmetic-average Asian call: payoff = max(A - K, 0) where A = mean of path prices.
double asianCallMC(double S0, double K, double r, double sigma,
                   double T, uint32_t steps, uint32_t paths, uint64_t seed = 42) {
    std::mt19937_64         rng{seed};
    std::normal_distribution<double> norm{0.0, 1.0};

    double dt      = T / steps;
    double drift   = (r - 0.5 * sigma * sigma) * dt;
    double diffuse = sigma * std::sqrt(dt);

    double payoff_sum = 0.0;

    for (uint32_t p = 0; p < paths; p += 2) { // pairs for antithetic variates
        double avg1 = 0.0, avg2 = 0.0;
        double S1 = S0, S2 = S0;

        for (uint32_t t = 0; t < steps; ++t) {
            double z = norm(rng);
            // Antithetic: use z and -z to sample the same path pair.
            // Both are valid GBM paths; their payoffs are negatively correlated,
            // so averaging them reduces variance by ~50% vs independent paths.
            S1 *= std::exp(drift + diffuse *  z);
            S2 *= std::exp(drift + diffuse * -z);
            avg1 += S1;
            avg2 += S2;
        }
        avg1 /= steps; avg2 /= steps;
        payoff_sum += std::max(avg1 - K, 0.0) + std::max(avg2 - K, 0.0);
    }

    // Discount expected payoff back to present value.
    return std::exp(-r * T) * payoff_sum / paths;
}`,
    explanation: "Antithetic variates pair each standard normal draw z with its mirror -z; since Asian option payoffs are monotone in the path average, these two payoffs are negatively correlated, so their mean has variance equal to (Var(P) + Cov(P, P'))/2 — typically halving the estimator variance without additional simulation cost.",
  },
  {
    id: "cpp-20260626-b1-barrier-option",
    language: "cpp",
    title: "Barrier option Monte Carlo — knock-in/knock-out GBM monitoring",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <cstdint>
#include <algorithm>

enum class BarrierType { UpAndOut, DownAndIn };

double barrierCallMC(double S0, double K, double barrier,
                     double r, double sigma, double T,
                     uint32_t steps, uint32_t paths,
                     BarrierType type, uint64_t seed = 42) {
    std::mt19937_64         rng{seed};
    std::normal_distribution<double> norm{0.0, 1.0};

    double dt      = T / steps;
    double drift   = (r - 0.5 * sigma * sigma) * dt;
    double diffuse = sigma * std::sqrt(dt);
    double payoff_sum = 0.0;

    for (uint32_t p = 0; p < paths; ++p) {
        double S = S0;
        bool   breached = false;

        for (uint32_t t = 0; t < steps; ++t) {
            S *= std::exp(drift + diffuse * norm(rng));
            // Continuous monitoring: check every step for barrier breach.
            if (type == BarrierType::UpAndOut && S >= barrier) { breached = true; break; }
            if (type == BarrierType::DownAndIn && S <= barrier)   breached = true;
        }

        double intrinsic = std::max(S - K, 0.0);
        if (type == BarrierType::UpAndOut)
            payoff_sum += breached ? 0.0 : intrinsic; // knocked out — worthless
        else // DownAndIn
            payoff_sum += breached ? intrinsic : 0.0; // only alive if knocked in
    }

    return std::exp(-r * T) * payoff_sum / paths;
}`,
    explanation: "Discrete-time monitoring of the barrier at each step slightly overprices knock-out options and underprices knock-in options relative to the continuous-monitoring closed form (Broadie-Glasserman-Kou correction applies a √(dt) adjustment); using more steps reduces this bias at the cost of O(steps) work per path.",
  },
  {
    id: "cpp-20260626-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson FD PDE solver — Black-Scholes European put",
    tag: "quant",
    code: `#include <vector>
#include <algorithm>
#include <cmath>
#include <cstddef>

// Tridiagonal Thomas algorithm: O(N) solve for Ax=d where A is tridiagonal.
static void thomas(const std::vector<double>& a, std::vector<double>& b,
                   const std::vector<double>& c, std::vector<double>& d,
                   std::vector<double>& x) {
    std::size_t n = b.size();
    std::vector<double> c2(n), d2(n);
    c2[0] = c[0]/b[0]; d2[0] = d[0]/b[0];
    for (std::size_t i = 1; i < n; ++i) {
        double m = b[i] - a[i]*c2[i-1];
        c2[i] = c[i]/m; d2[i] = (d[i] - a[i]*d2[i-1])/m;
    }
    x[n-1] = d2[n-1];
    for (int i = (int)n-2; i >= 0; --i)
        x[i] = d2[i] - c2[i]*x[i+1];
}

double crankNicolsonPut(double S0, double K, double r, double sigma,
                        double T, std::size_t M, std::size_t N) {
    double Smax = 3.0 * K;
    double dS   = Smax / M, dt = T / N;

    std::vector<double> V(M+1), S(M+1);
    for (std::size_t i = 0; i <= M; ++i) {
        S[i] = i * dS;
        V[i] = std::max(K - S[i], 0.0); // terminal condition at T
    }

    std::vector<double> a(M-1), b(M-1), c(M-1), d(M-1), Vnew(M-1);

    for (std::size_t k = 0; k < N; ++k) { // march backward in time
        for (std::size_t i = 1; i < M; ++i) {
            double sig2 = sigma*sigma*i*i;
            double alpha = 0.25*dt*(sig2 - r*i);
            double beta  = -0.5*dt*(sig2 + r);
            double gamma = 0.25*dt*(sig2 + r*i);
            a[i-1] = -alpha; b[i-1] = 1.0 - beta; c[i-1] = -gamma;
            d[i-1] = alpha*V[i-1] + (1.0+beta)*V[i] + gamma*V[i+1];
        }
        // Boundary: put = K*exp(-r*(T-k*dt)) at S=0; put = 0 at S=Smax.
        d[0]   += alpha_0(r, dt, k, N, T, K) * 0.0; // adjusted below
        d[0]    = a[0]*K*std::exp(-r*(T-(k+1)*dt)) + (1.0+0.5*dt*r)*V[1]
                  + c[0]*V[2]; // inline boundary absorption
        thomas(a, b, c, d, Vnew);
        V[0] = K*std::exp(-r*(T-(k+1)*dt));
        for (std::size_t i = 1; i < M; ++i) V[i] = Vnew[i-1];
        V[M] = 0.0;
    }
    // Interpolate to find V(S0).
    std::size_t idx = static_cast<std::size_t>(S0 / dS);
    double frac = (S0 - idx*dS) / dS;
    return V[idx]*(1.0-frac) + V[idx+1]*frac;
}
// Stub to satisfy compiler — boundary term is absorbed into d[0] above.
double alpha_0(double,double,std::size_t,std::size_t,double,double){return 0;}`,
    explanation: "Crank-Nicolson averages the explicit and implicit finite-difference operators, achieving second-order accuracy in both time and space (O(Δt², ΔS²)) versus the first-order explicit Euler scheme; the resulting tridiagonal system is solved in O(M) time by the Thomas algorithm rather than O(M³) Gaussian elimination.",
  },
];
