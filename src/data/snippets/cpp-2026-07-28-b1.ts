import type { Snippet } from "./types";

export const cppSnippets20260728B1: Snippet[] = [
  {
    id: "cpp-20260728-b1-sfinae-enable-if",
    language: "cpp",
    title: "SFINAE with enable_if for numeric type dispatch",
    tag: "SFINAE",
    code: `#include <type_traits>
#include <cmath>
#include <cstdio>

// SFINAE: Substitution Failure Is Not An Error.
// enable_if<Cond>::type only exists when Cond is true, removing the overload
// from the candidate set without a compile error.

// Floating-point overload
template<typename T>
std::enable_if_t<std::is_floating_point_v<T>, T>
round_to_tick(T price, T tick) noexcept {
    return std::round(price / tick) * tick;
}

// Integer overload (price already in ticks)
template<typename T>
std::enable_if_t<std::is_integral_v<T>, T>
round_to_tick(T price_ticks, T tick_size) noexcept {
    return (price_ticks / tick_size) * tick_size;  // integer truncation
}

// Detection idiom: check for .price() member via void_t
template<typename T, typename = void>
struct has_price : std::false_type {};

template<typename T>
struct has_price<T, std::void_t<decltype(std::declval<T>().price())>>
    : std::true_type {};

struct Limit  { double price() const { return 100.5; } };
struct Market { /* no price() member */ };

template<typename T>
void print_order(const T& o) {
    if constexpr (has_price<T>::value)
        printf("price=%.2f\\n", o.price());
    else
        printf("market order (no price)\\n");
}

int main() {
    printf("float: %.2f\\n", round_to_tick(100.27, 0.05));
    printf("int:   %d\\n",   round_to_tick(10053, 5));
    print_order(Limit{});
    print_order(Market{});
    printf("Limit has .price(): %d\\n", (int)has_price<Limit>::value);
}`,
    explanation: "SFINAE with enable_if routes overload resolution at compile time based on type traits — the wrong overload is silently removed from the candidate set rather than causing an error; the detection idiom using void_t checks whether a member function exists without C++20 concepts, enabling selective dispatch between order types that do or don't carry a price.",
  },
  {
    id: "cpp-20260728-b1-perfect-forward",
    language: "cpp",
    title: "Perfect forwarding in an order factory",
    tag: "move-semantics",
    code: `#include <utility>
#include <memory>
#include <cstdint>
#include <cstdio>

// Perfect forwarding: std::forward<T>(arg) preserves the value category
// of the original argument — lvalue stays lvalue, rvalue stays rvalue.
// Without std::forward, a named rvalue-reference parameter becomes an lvalue.

struct Order {
    int64_t price;
    int32_t qty;
    char    side;
    Order(int64_t p, int32_t q, char s) : price(p), qty(q), side(s) {}
    Order(const Order& o) : price(o.price), qty(o.qty), side(o.side) {
        printf("  [copy ctor]\\n");
    }
    Order(Order&& o) noexcept : price(o.price), qty(o.qty), side(o.side) {
        o.qty = 0;
        printf("  [move ctor]\\n");
    }
};

// Factory: variadic template + std::forward chains args through make_unique
// so the Order constructor receives them with the correct value category
template<typename T, typename... Args>
std::unique_ptr<T> make_order(Args&&... args) {
    return std::make_unique<T>(std::forward<Args>(args)...);
}

// Universal reference: T&& deduced as T& if lvalue, T&& if rvalue
template<typename T>
void submit(T&& order) {
    if constexpr (std::is_rvalue_reference_v<T&&>)
        printf("submit (move): qty=%d\\n", order.qty);
    else
        printf("submit (copy): qty=%d\\n", order.qty);
}

int main() {
    printf("factory (no copy/move overhead):\\n");
    auto o = make_order<Order>(10050, 100, 'B');

    printf("submit lvalue:\\n");
    Order o2{10055, 50, 'S'};
    submit(o2);             // lvalue — T deduced as Order&
    printf("submit rvalue:\\n");
    submit(std::move(o2));  // rvalue — T deduced as Order&&
}`,
    explanation: "Without std::forward, a function template always passes its named parameters as lvalues, silently copying when a move was intended; forwarding references (T&&) combined with std::forward reconstruct the original value category at the point of the inner call, enabling zero-overhead order factories that avoid all copies when the caller provides a temporary.",
  },
  {
    id: "cpp-20260728-b1-crtp-pricer",
    language: "cpp",
    title: "CRTP static polymorphism for option pricer hierarchy",
    tag: "templates",
    code: `#include <cmath>
#include <cstdio>

// CRTP: base class parameterised on the derived class.
// Derived::compute_impl is called without a vtable lookup —
// static_cast<Derived*>(this)->compute_impl(...) resolves at compile time.

template<typename Derived>
struct OptionPricer {
    double price(double S, double K, double r, double sigma, double T) const {
        return static_cast<const Derived*>(this)->compute_impl(S,K,r,sigma,T);
    }
    // Utility built on price() — works for any derived pricer
    double pv01(double S, double K, double r, double sigma, double T) const {
        return (price(S,K,r+1e-4,sigma,T) - price(S,K,r-1e-4,sigma,T)) / 2e-4;
    }
};

// Inline normal CDF
static double N(double x) { return 0.5*std::erfc(-x/std::sqrt(2.0)); }

struct EuropeanCall : OptionPricer<EuropeanCall> {
    double compute_impl(double S, double K, double r, double sigma, double T) const {
        double d1 = (std::log(S/K)+(r+0.5*sigma*sigma)*T)/(sigma*std::sqrt(T));
        return S*N(d1) - K*std::exp(-r*T)*N(d1-sigma*std::sqrt(T));
    }
};

struct EuropeanPut : OptionPricer<EuropeanPut> {
    double compute_impl(double S, double K, double r, double sigma, double T) const {
        double d1 = (std::log(S/K)+(r+0.5*sigma*sigma)*T)/(sigma*std::sqrt(T));
        double d2 = d1 - sigma*std::sqrt(T);
        return K*std::exp(-r*T)*N(-d2) - S*N(-d1);
    }
};

// Template function works for any CRTP pricer — no virtual overhead
template<typename P>
void report(const P& pricer, double S, double K, double r, double sigma, double T) {
    printf("price=%.4f  pv01=%.4f\\n",
           pricer.price(S,K,r,sigma,T), pricer.pv01(S,K,r,sigma,T));
}

int main() {
    EuropeanCall call;
    EuropeanPut  put;
    printf("Call: "); report(call, 100,100,0.05,0.20,1.0);
    printf("Put:  "); report(put,  100,100,0.05,0.20,1.0);
}`,
    explanation: "CRTP eliminates virtual dispatch overhead by resolving derived-class calls via a static_cast at compile time — the compiler can inline the entire pricing chain; unlike a virtual pricer hierarchy, a CRTP pricer has no vtable pointer overhead, no indirect call, and the base class utilities (pv01, vega bump) are shared without cost across all derived types.",
  },
  {
    id: "cpp-20260728-b1-exchange-ownership",
    language: "cpp",
    title: "std::exchange for clean ownership transfer in move semantics",
    tag: "move-semantics",
    code: `#include <utility>
#include <cstdint>
#include <cstdio>
#include <vector>

// std::exchange(obj, new_val) — atomically replaces obj with new_val
// and returns the OLD value. Cleaner than save/assign/null:
//   old = ptr; ptr = nullptr; return old;   <- three lines
//   return std::exchange(ptr, nullptr);      <- one line

struct MsgBuffer {
    char*     data;
    uint32_t  len;
    uint64_t  seq;

    MsgBuffer(uint64_t s, uint32_t l)
        : data(new char[l]()), len(l), seq(s) {}

    // Move ctor: take ownership, leave source in valid empty state
    MsgBuffer(MsgBuffer&& o) noexcept
        : data(std::exchange(o.data, nullptr))  // grab and null in one call
        , len(std::exchange(o.len,   0))
        , seq(std::exchange(o.seq,   0))
    {}

    MsgBuffer& operator=(MsgBuffer&& o) noexcept {
        if (this != &o) {
            delete[] data;
            data = std::exchange(o.data, nullptr);
            len  = std::exchange(o.len,  0);
            seq  = std::exchange(o.seq,  0);
        }
        return *this;
    }

    ~MsgBuffer() { delete[] data; }
    bool valid() const { return data != nullptr; }
};

std::vector<MsgBuffer> drain(std::vector<MsgBuffer>& q) {
    std::vector<MsgBuffer> out;
    out.reserve(q.size());
    for (auto& m : q) out.push_back(std::move(m));
    q.clear();
    return out;
}

int main() {
    std::vector<MsgBuffer> q;
    q.emplace_back(1001, 64);
    q.emplace_back(1002, 128);
    auto msgs = drain(q);
    for (auto& m : msgs)
        printf("seq=%llu valid=%d\\n", (unsigned long long)m.seq, m.valid());
}`,
    explanation: "std::exchange makes move constructors and move-assignment operators a single expression per member instead of three lines; for objects that own heap resources (socket buffers, DMA regions, order queues), exchange-based move constructors are less error-prone than manual save/assign/null sequences because the null state is written atomically at the point of transfer.",
  },
  {
    id: "cpp-20260728-b1-ttas-spinlock",
    language: "cpp",
    title: "TTAS spinlock with exponential backoff for low-contention paths",
    tag: "lock-free",
    code: `#include <atomic>
#include <thread>
#include <cstdio>

// Test-and-Test-and-Set (TTAS): spin on a local cache read first,
// then attempt CAS only when the flag looks free.
// Pure TAS sends an RFO (Read For Ownership) bus message on every iteration;
// TTAS spins on a shared read until the line is clean, reducing bus traffic.

class TtasSpinlock {
    std::atomic_flag flag_ = ATOMIC_FLAG_INIT;
public:
    void lock() noexcept {
        for (int backoff = 1;;) {
            // 1. Spin locally until flag appears free (no cache-coherence traffic)
            while (flag_.test(std::memory_order_relaxed)) {
                // Exponential backoff: pause N times before retrying
                for (int i = 0; i < backoff; ++i)
                    __builtin_ia32_pause();   // x86 PAUSE: signals spin-wait, saves power
                if (backoff < 1024) backoff <<= 1;
            }
            // 2. Attempt atomic acquire — only one thread wins the CAS
            if (!flag_.test_and_set(std::memory_order_acquire))
                return;
        }
    }
    void unlock() noexcept {
        flag_.clear(std::memory_order_release);
    }
};

TtasSpinlock g_lock;
int64_t      g_pnl = 0;

void accum(int64_t delta, int n) {
    for (int i = 0; i < n; ++i) {
        g_lock.lock();
        g_pnl += delta;
        g_lock.unlock();
    }
}

int main() {
    std::thread t1(accum, 1, 500000);
    std::thread t2(accum, 2, 500000);
    t1.join(); t2.join();
    printf("pnl = %lld  (expected 1500000)\\n", (long long)g_pnl);
}`,
    explanation: "The TTAS optimization works because a cache read hit (shared state) costs ~4 cycles while a cache invalidation via RFO costs ~100-200 cycles; by spinning on the already-cached flag value and only issuing the CAS when the line appears clean, TTAS reduces inter-core bus traffic by 10-50x under moderate contention — exponential backoff further reduces coherence storms when many threads compete simultaneously.",
  },
  {
    id: "cpp-20260728-b1-treiber-stack",
    language: "cpp",
    title: "Lock-free Treiber stack for order node free-list",
    tag: "lock-free",
    code: `#include <atomic>
#include <optional>
#include <cstdio>

// Treiber (1986) lock-free stack: push/pop via CAS on the head pointer.
// Each attempt reads head, builds new head, and exchanges atomically.
// ABA hazard exists (Node* recycled) — acceptable for a type-homogeneous free-list.

template<typename T>
class TreiberStack {
    struct Node { T value; Node* next = nullptr; };
    std::atomic<Node*> head_{nullptr};

public:
    void push(T val) {
        Node* node = new Node{std::move(val)};
        // node->next = head; CAS head := node; retry if head changed
        node->next = head_.load(std::memory_order_relaxed);
        while (!head_.compare_exchange_weak(
                   node->next, node,
                   std::memory_order_release,
                   std::memory_order_relaxed))
            ;  // on failure, CAS writes current head into node->next automatically
    }

    std::optional<T> pop() {
        Node* old = head_.load(std::memory_order_acquire);
        while (old) {
            if (head_.compare_exchange_weak(
                    old, old->next,
                    std::memory_order_acquire,
                    std::memory_order_relaxed))
                break;
        }
        if (!old) return std::nullopt;
        T val = std::move(old->value);
        delete old;   // hazard pointers / epochs needed in production
        return val;
    }

    ~TreiberStack() {
        while (pop()) {}
    }
};

int main() {
    TreiberStack<int> s;
    s.push(10); s.push(20); s.push(30);
    while (auto v = s.pop())
        printf("%d\\n", *v);   // 30, 20, 10 (LIFO)
}`,
    explanation: "The Treiber stack is the canonical lock-free LIFO: each push/pop is a CAS loop that retries only on head-pointer contention; in HFT systems this structure is used as a free-list for order node recycling (avoiding malloc per order) where the ABA problem is harmless because all recycled nodes have the same type and size, and the cost per operation is ~1 CAS on the fast path versus a lock acquisition + release.",
  },
  {
    id: "cpp-20260728-b1-jthread-stop-token",
    language: "cpp",
    title: "std::jthread with stop_token for graceful handler shutdown",
    tag: "cpp20",
    code: `#include <thread>
#include <stop_token>
#include <atomic>
#include <chrono>
#include <cstdio>

// std::jthread (C++20):
// 1. Automatically joins on destruction (no detach/join boilerplate)
// 2. Built-in stop_source/stop_token cooperative cancellation mechanism
// The thread function receives a stop_token as its first argument.

std::atomic<int64_t> g_ticks{0};

void feed_handler(std::stop_token st, const char* name, int delay_us) {
    printf("[%s] started\\n", name);
    while (!st.stop_requested()) {
        ++g_ticks;
        // In production: read from kernel ring buffer or UDP socket
        std::this_thread::sleep_for(std::chrono::microseconds(delay_us));
    }
    printf("[%s] clean stop after %lld ticks\\n", name, (long long)g_ticks.load());
}

int main() {
    // jthread destructor calls request_stop() then join() — clean RAII shutdown
    {
        std::jthread itch_handler(feed_handler, "ITCH-5.0", 10);
        std::jthread bats_handler(feed_handler, "BATS",     15);
        std::this_thread::sleep_for(std::chrono::milliseconds(20));
        printf("main: shutting down feeds\\n");
    }  // both threads stopped and joined here
    printf("main: total ticks = %lld\\n", (long long)g_ticks.load());
}`,
    explanation: "jthread eliminates the join-on-every-path boilerplate of std::thread and replaces ad-hoc atomic stop-flags with a standardised stop_token protocol; for market-data handlers the stop_requested() poll is checked at the top of the receive loop, ensuring the thread drains cleanly without processing partial messages — critical for audit log integrity on graceful shutdown.",
  },
  {
    id: "cpp-20260728-b1-semaphore-throttle",
    language: "cpp",
    title: "std::counting_semaphore as an order rate throttle",
    tag: "cpp20",
    code: `#include <semaphore>
#include <thread>
#include <vector>
#include <atomic>
#include <chrono>
#include <cstdio>

// counting_semaphore<Max>: allows up to Max concurrent token acquisitions.
// Token bucket throttle: start with N tokens; a refiller replenishes at a
// fixed rate; each order submit acquires one token (blocks if none available).

static constexpr int MAX_BURST = 50;
static std::counting_semaphore<MAX_BURST> g_tokens{10};  // 10 initial tokens
static std::atomic<bool> g_running{true};
static std::atomic<int>  g_submitted{0};

// Refill thread: 5 new tokens every 10 ms -> 500 orders/sec sustained
void refiller() {
    while (g_running.load(std::memory_order_relaxed)) {
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
        for (int i = 0; i < 5; ++i) g_tokens.release();
    }
}

void submit_order(int id) {
    g_tokens.acquire();                // blocks when token bucket is empty
    printf("  order %2d submitted\\n", id);
    ++g_submitted;
}

int main() {
    std::thread refill_thread(refiller);
    // Burst of 25 orders; first 10 are instant (use initial tokens)
    std::vector<std::thread> senders;
    for (int i = 1; i <= 25; ++i)
        senders.emplace_back(submit_order, i);
    for (auto& t : senders) t.join();

    g_running = false;
    g_tokens.release(MAX_BURST);    // unblock refiller if waiting
    refill_thread.join();
    printf("Total submitted: %d\\n", g_submitted.load());
}`,
    explanation: "counting_semaphore is the C++20 standard token-bucket building block: release() increments the internal counter (refill), acquire() decrements it (consume) and blocks at zero; unlike a mutex, a semaphore can be acquired by one thread and released by another, making it the correct primitive for a producer-refiller / consumer-sender throttle pattern that prevents order-rate limit rejections from the exchange.",
  },
  {
    id: "cpp-20260728-b1-consteval-fx",
    language: "cpp",
    title: "consteval immediate function for compile-time FX rate table",
    tag: "cpp20",
    code: `#include <array>
#include <string_view>
#include <cstdio>

// consteval: immediate function — MUST evaluate at compile time.
// Unlike constexpr (which can be runtime), consteval guarantees that any
// call site that doesn't provide compile-time arguments is an error.

struct CcyRate { const char* pair; double rate; };

// Build and validate the FX rate table at compile time
consteval std::array<CcyRate, 6> build_fx_table() {
    std::array<CcyRate, 6> t{{
        {"EURUSD", 1.0850}, {"GBPUSD", 1.2710},
        {"USDJPY", 149.50}, {"USDCHF", 0.8980},
        {"AUDUSD", 0.6510}, {"USDCAD", 1.3570},
    }};
    for (const auto& e : t)
        if (e.rate <= 0.0) throw "all FX rates must be positive";  // compile-time error
    return t;
}

consteval double usd_to_ccy(std::string_view ccy, double usd_amount) {
    constexpr auto fx = build_fx_table();
    for (const auto& e : fx) {
        std::string_view sv(e.pair);
        if (sv.substr(0, 3) == "USD" && sv.substr(3) == ccy)
            return usd_amount * e.rate;   // USD -> CCY
        if (sv.substr(0, 3) == ccy && sv.substr(3) == "USD")
            return usd_amount / e.rate;   // CCY -> USD -> ... (inverse)
    }
    return usd_amount;
}

int main() {
    // Fully compile-time — assembles to a register load on x86
    constexpr auto fx_table = build_fx_table();
    for (const auto& e : fx_table)
        printf("%-8s  %.4f\\n", e.pair, e.rate);

    // Commission conversion: USD 100 to JPY
    constexpr double jpy = usd_to_ccy("JPY", 100.0);
    printf("USD 100 = JPY %.2f\\n", jpy);  // ~14950
}`,
    explanation: "consteval forces evaluation at compile time, turning the FX rate table into read-only data segment constants with zero runtime cost; the throw inside consteval acts as a compile-time assertion — any rate misconfiguration is caught before the binary is produced, unlike runtime checks that only fire during testing.",
  },
  {
    id: "cpp-20260728-b1-std-format-ticket",
    language: "cpp",
    title: "std::format for type-safe structured trade logging",
    tag: "cpp20",
    code: `#include <format>
#include <string>
#include <cstdint>
#include <cstdio>

// std::format (C++20): type-safe, locale-aware string formatting.
// Format string validated at compile time — mismatched types are compile errors,
// unlike printf where a wrong format specifier is undefined behaviour.

struct Fill {
    uint64_t order_id;
    const char* symbol;
    char    side;
    int32_t qty;
    double  price;
    double  commission;
};

// Produces: "[FILL] 1001001  AAPL  B    1500 @  189.0250  comm=1.5000"
std::string format_fill(const Fill& f) {
    return std::format("[FILL] {:>8}  {:<6}  {:c}  {:>6} @ {:>10.4f}  comm={:.4f}",
                       f.order_id, f.symbol, f.side, f.qty, f.price, f.commission);
}

// Daily summary with thousand-separator grouping
std::string format_summary(int fills, double notional, double total_comm) {
    return std::format(
        "Fills={:>5}  Notional={:>14,.2f}  Comm={:>8.4f}  "
        "Comm/Notional={:.3f}bps",
        fills, notional, total_comm,
        total_comm / notional * 10000.0);
}

// Structured risk log with aligned columns
std::string format_position(const char* sym, double delta, double gamma, double vega) {
    return std::format("  {:<6}  delta={:+.4f}  gamma={:+.6f}  vega={:+.4f}",
                       sym, delta, gamma, vega);
}

int main() {
    Fill f{1001001, "AAPL", 'B', 1500, 189.0250, 1.5};
    printf("%s\\n", format_fill(f).c_str());
    printf("%s\\n", format_summary(47, 8'500'000.0, 68.0).c_str());
    printf("%s\\n", format_position("SPY", 0.523, 0.00812, 0.1450).c_str());
}`,
    explanation: "std::format validates format strings and argument types at compile time, eliminating the class of printf UB where %d receives a double or a pointer; the named specifiers (fill, align, grouping separator ',', sign '+') produce production-quality log lines without a custom formatter, and the type-safe design means a wrong argument count is caught before the binary ships.",
  },
  {
    id: "cpp-20260728-b1-hugepage-mmap",
    language: "cpp",
    title: "Huge-page mmap order pool to reduce TLB pressure",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <cstdint>
#include <cstdio>

// Huge pages (2 MB on x86-64): reduce TLB misses for large, hot buffers.
// A 64 MB order pool with 4 KB pages needs 16,384 TLB entries;
// with 2 MB huge pages it needs only 32.

#ifndef MAP_HUGETLB
#define MAP_HUGETLB 0x40000  // Linux 2.6.32+
#endif

void* alloc_huge_pool(std::size_t bytes) {
    // Round up to 2 MB boundary
    constexpr std::size_t HP = 2UL << 20;
    bytes = (bytes + HP - 1) & ~(HP - 1);

    void* p = mmap(nullptr, bytes,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB, -1, 0);

    if (p == MAP_FAILED) {
        // Transparent huge pages fallback (kernel promotes on demand)
        p = mmap(nullptr, bytes,
                 PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (p != MAP_FAILED)
            madvise(p, bytes, MADV_HUGEPAGE);
    }
    return (p == MAP_FAILED) ? nullptr : p;
}

struct Order { int64_t price; int32_t qty; char side; };

int main() {
    constexpr std::size_t POOL_SIZE = 2UL << 20;  // 2 MB
    void* slab = alloc_huge_pool(POOL_SIZE);
    if (!slab) { printf("alloc failed\\n"); return 1; }

    Order* orders = static_cast<Order*>(slab);
    const std::size_t N = POOL_SIZE / sizeof(Order);
    // Touch all pages to fault them in (avoid first-access latency during trading)
    for (std::size_t i = 0; i < N; i += 256) orders[i] = {};

    orders[0] = {10050, 100, 'B'};
    printf("pool: %zu orders, orders[0].price=%lld\\n",
           N, (long long)orders[0].price);

    munmap(slab, POOL_SIZE);
}`,
    explanation: "TLB misses on a 4 KB page table cost 100-200 cycles per miss as the hardware page-table walker traverses four levels of page tables; huge pages collapse an entire 2 MB region to a single TLB entry, so a 64 MB ring buffer of tick data or order objects reduces TLB pressure by a factor of 512 — eliminating a class of latency spikes that appear at statistical tails in low-latency measurement.",
  },
  {
    id: "cpp-20260728-b1-cpu-affinity",
    language: "cpp",
    title: "CPU thread affinity pinning for latency-sensitive threads",
    tag: "low-latency",
    code: `#define _GNU_SOURCE
#include <pthread.h>
#include <sched.h>
#include <thread>
#include <cstdio>

// Pin a thread to a specific CPU core to:
// 1. Prevent OS scheduler migration (preserves L1/L2 cache warmth)
// 2. Eliminate involuntary context-switch jitter
// 3. Allow reliable RDTSC comparisons (no TSC skew when migrating cores)
// Rule of thumb: dedicate even cores to market-data / odd cores to strategy.

bool pin_to_core(int core_id) {
    cpu_set_t mask;
    CPU_ZERO(&mask);
    CPU_SET(core_id, &mask);
    int rc = pthread_setaffinity_np(pthread_self(), sizeof(mask), &mask);
    if (rc != 0) {
        printf("pin_to_core(%d) failed (errno=%d — root required for some cores)\\n",
               core_id, rc);
        return false;
    }
    return true;
}

void log_affinity(const char* label) {
    cpu_set_t mask;
    CPU_ZERO(&mask);
    pthread_getaffinity_np(pthread_self(), sizeof(mask), &mask);
    printf("[%s] allowed cores:", label);
    for (int i = 0; i < 16; ++i)
        if (CPU_ISSET(i, &mask)) printf(" %d", i);
    printf("\\n");
}

void market_data_handler(int core) {
    if (pin_to_core(core))
        log_affinity("ITCH handler");
    // RDTSC is now stable — core never changes mid-measurement
    uint64_t t0, t1;
    __asm__ volatile("rdtsc; shl $32,%%rdx; or %%rdx,%%rax" : "=a"(t0) :: "rdx");
    volatile int x = 0; for (int i = 0; i < 10000; ++i) ++x;
    __asm__ volatile("rdtsc; shl $32,%%rdx; or %%rdx,%%rax" : "=a"(t1) :: "rdx");
    printf("inner loop: %llu cycles\\n", (unsigned long long)(t1 - t0));
}

int main() {
    log_affinity("main (before pin)");
    std::thread t(market_data_handler, 0);
    t.join();
}`,
    explanation: "OS thread migration causes L1/L2 cache invalidation (reloading ~256 KB at ~100 GB/s takes ~2.5 μs) plus TLB shootdowns; pinning market-data and strategy threads to dedicated cores eliminates this jitter source and allows RDTSC to be used as a reliable cycle counter — on unpinned threads a context switch to a different core with a different TSC offset would corrupt latency measurements.",
  },
  {
    id: "cpp-20260728-b1-delta-gamma-theta-pnl",
    language: "cpp",
    title: "Delta-Gamma-Theta second-order P&L approximation",
    tag: "numerics",
    code: `#include <cmath>
#include <cstdio>

// Second-order Taylor expansion of option P&L:
//   dP ≈ delta*dS + 0.5*gamma*dS^2 + vega*d_sigma + theta*dt
// Used in risk engines for instantaneous P&L attribution without full reprice.

struct Greeks { double price, delta, gamma, vega, theta; };

// BS greeks for European call
Greeks bs_greeks(double S, double K, double r, double sigma, double T) {
    auto N   = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    auto phi = [](double x){ return std::exp(-0.5*x*x)/std::sqrt(2*M_PI); };
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K)+(r+0.5*sigma*sigma)*T)/(sigma*sqT);
    double d2  = d1 - sigma*sqT;
    double Nd1 = N(d1), Nd2 = N(d2), pd1 = phi(d1);
    double disc = std::exp(-r*T);
    return {
        S*Nd1 - K*disc*Nd2,               // price
        Nd1,                               // delta
        pd1 / (S*sigma*sqT),              // gamma
        S*pd1*sqT / 100.0,                // vega (per 1 vol point)
        -(S*pd1*sigma/(2*sqT) + r*K*disc*Nd2) / 365.0  // theta (per day)
    };
}

// P&L attribution given scenario shifts
struct Scenario { double dS; double d_sigma; double dt_days; };

void pnl_attribution(const Greeks& g, const Scenario& s, int qty = 1) {
    double delta_pnl = qty * g.delta * s.dS;
    double gamma_pnl = qty * 0.5 * g.gamma * s.dS * s.dS;
    double vega_pnl  = qty * g.vega  * s.d_sigma * 100.0;  // vega per 1%, d_sigma in frac
    double theta_pnl = qty * g.theta * s.dt_days;
    double total     = delta_pnl + gamma_pnl + vega_pnl + theta_pnl;
    printf("dS=%+.1f dvol=%+.2f%% dt=%+.0fd:\\n"
           "  delta=%+.4f  gamma=%+.4f  vega=%+.4f  theta=%+.4f  total=%+.4f\\n",
           s.dS, s.d_sigma*100, s.dt_days,
           delta_pnl, gamma_pnl, vega_pnl, theta_pnl, total);
}

int main() {
    auto g = bs_greeks(100, 100, 0.05, 0.20, 0.25);
    printf("price=%.4f delta=%.4f gamma=%.6f vega=%.4f theta=%.6f\\n",
           g.price, g.delta, g.gamma, g.vega, g.theta);
    pnl_attribution(g, {+2.0, +0.01, 1.0});   // spot up 2, vol up 1%, 1 day
    pnl_attribution(g, {-3.0, +0.02, 0.0});   // spot down 3, vol spike, no decay
}`,
    explanation: "The delta-gamma-theta approximation is the workhorse of real-time risk systems: it replaces a full Monte Carlo or PDE reprice with a three-term polynomial expansion that evaluates in nanoseconds per option; the gamma term captures the convexity benefit of large spot moves that the linear delta approximation misses, making it accurate to within a few basis points for moves < 3 sigma over short horizons.",
  },
  {
    id: "cpp-20260728-b1-policy-router",
    language: "cpp",
    title: "Policy-based order router with template validation and routing",
    tag: "templates",
    code: `#include <cstdint>
#include <cstdio>
#include <string_view>

// Policy-based design: inject behavioural strategies as template parameters.
// Each combination compiles to a distinct, fully-inlined call path.
// Zero virtual dispatch, zero overhead compared to hand-coding each combination.

struct Order { int64_t price; int32_t qty; char side; std::string_view sym; };

// --- Validation policies ---
struct StrictPolicy {
    static bool validate(const Order& o) {
        return o.price > 0 && o.qty > 0 && (o.side=='B'||o.side=='S');
    }
    static const char* name() { return "Strict"; }
};
struct PassthroughPolicy {
    static bool validate(const Order&) { return true; }
    static const char* name() { return "Passthrough"; }
};

// --- Routing policies ---
struct PrimaryVenue {
    static void route(const Order& o) {
        printf("  PRIMARY: %s %c %d @ %lld\\n",
               o.sym.data(), o.side, o.qty, (long long)o.price);
    }
};
struct DarkPool {
    static void route(const Order& o) {
        printf("  DARK:    %s %c %d\\n", o.sym.data(), o.side, o.qty);
    }
};
struct InternalCross {
    static void route(const Order& o) {
        printf("  CROSS:   %s %c %d @ %lld\\n",
               o.sym.data(), o.side, o.qty, (long long)o.price);
    }
};

template<typename Validator, typename Router>
struct OrderRouter {
    static bool submit(const Order& o) {
        if (!Validator::validate(o)) {
            printf("  [%s] reject\\n", Validator::name());
            return false;
        }
        Router::route(o);
        return true;
    }
};

using ProdRouter  = OrderRouter<StrictPolicy,       PrimaryVenue>;
using DarkRouter  = OrderRouter<PassthroughPolicy,  DarkPool>;
using CrossRouter = OrderRouter<StrictPolicy,       InternalCross>;

int main() {
    Order good{10050, 100, 'B', "AAPL"};
    Order bad {   -1, 100, 'B', "GOOG"};
    printf("ProdRouter:\\n");  ProdRouter::submit(good); ProdRouter::submit(bad);
    printf("DarkRouter:\\n");  DarkRouter::submit(bad);
    printf("CrossRouter:\\n"); CrossRouter::submit(good);
}`,
    explanation: "Policy-based design composes behaviours orthogonally at compile time: the router template is parameterised on a validator policy and a routing policy, so adding a new venue requires only a new routing policy struct — the combinatorics of (N validators × M venues) are handled by template instantiation rather than N×M handwritten classes, and the compiler inlines everything into a single unconditional call sequence.",
  },
  {
    id: "cpp-20260728-b1-optional-quote",
    language: "cpp",
    title: "std::optional for absent mid-price and nullable market data",
    tag: "cpp17",
    code: `#include <optional>
#include <cstdint>
#include <cstdio>
#include <string>

// std::optional<T>: a nullable value with explicit emptiness.
// Avoids sentinel values (-1, NaN, 0) that silently participate in arithmetic.
// In market data: a side may be absent (halted, no liquidity) — distinguish
// from a quote of zero.

struct Quote {
    std::optional<int64_t> bid_px;
    std::optional<int64_t> ask_px;
    std::optional<int32_t> bid_sz;
    std::optional<int32_t> ask_sz;
};

std::optional<double> mid_price(const Quote& q) {
    if (!q.bid_px || !q.ask_px) return std::nullopt;
    return 0.5 * (*q.bid_px + *q.ask_px);
}

std::optional<int64_t> spread_ticks(const Quote& q) {
    if (!q.bid_px || !q.ask_px) return std::nullopt;
    int64_t sp = *q.ask_px - *q.bid_px;
    return sp >= 0 ? std::make_optional(sp) : std::nullopt;  // negative spread = crossed book
}

// Chaining: update NBBO only if both sides have improved
std::optional<Quote> nbbo_update(std::optional<Quote> prev, const Quote& tick) {
    if (!prev) return tick;
    Quote updated = *prev;
    // Take best bid (higher is better)
    if (tick.bid_px && (!updated.bid_px || *tick.bid_px > *updated.bid_px))
        updated.bid_px = tick.bid_px;
    // Take best ask (lower is better)
    if (tick.ask_px && (!updated.ask_px || *tick.ask_px < *updated.ask_px))
        updated.ask_px = tick.ask_px;
    return updated;
}

int main() {
    Quote q1{10050, 10052, 100, 200};
    Quote q2{10049, std::nullopt, 50, std::nullopt};  // only bid
    Quote q3{};                                        // both absent

    for (const auto& q : {q1, q2, q3}) {
        auto mid = mid_price(q);
        auto sp  = spread_ticks(q);
        printf("mid=%s  spread=%s\\n",
               mid ? std::to_string(*mid).c_str() : "N/A",
               sp  ? std::to_string(*sp).c_str()  : "N/A");
    }

    auto nbbo = nbbo_update(std::nullopt, q1);
    nbbo = nbbo_update(nbbo, q2);
    printf("NBBO bid=%lld ask=%s\\n",
           (long long)*nbbo->bid_px,
           nbbo->ask_px ? std::to_string(*nbbo->ask_px).c_str() : "N/A");
}`,
    explanation: "std::optional makes the absence of a quote side explicit in the type system rather than relying on a sentinel value: a null bid_px is structurally different from a bid_px of zero, and the compiler forces every consumer to handle the absent case before dereferencing — eliminating an entire class of silent pricing bugs where a missing quote is treated as a zero price.",
  },
  {
    id: "cpp-20260728-b1-multimap-orderbook",
    language: "cpp",
    title: "std::multimap order book with O(log N) price level access",
    tag: "data-structures",
    code: `#include <map>
#include <cstdint>
#include <cstdio>
#include <vector>

// std::map<price, qty> gives O(log N) insert/erase and O(1) best-bid/best-ask
// via rbegin()/begin(). Unlike unordered_map, the tree is always sorted —
// iterating from best price is natural and efficient.

struct Order { uint64_t id; int32_t qty; };

struct SortedBook {
    // Bids: descending order (highest price = best bid)
    std::map<int64_t, std::vector<Order>, std::greater<int64_t>> bids;
    // Asks: ascending order (lowest price = best ask)
    std::map<int64_t, std::vector<Order>> asks;

    void add(char side, int64_t price, uint64_t id, int32_t qty) {
        auto& book = (side == 'B') ? bids : asks;
        book[price].push_back({id, qty});
    }

    void cancel(char side, int64_t price, uint64_t id) {
        auto& book = (side == 'B') ? bids : asks;
        auto  it   = book.find(price);
        if (it == book.end()) return;
        auto& v = it->second;
        v.erase(std::remove_if(v.begin(), v.end(),
                               [id](const Order& o){ return o.id == id; }), v.end());
        if (v.empty()) book.erase(it);
    }

    void print_top(int depth = 3) const {
        printf("  Asks (best first):\\n");
        int i = 0;
        for (const auto& [px, ords] : asks) {
            if (++i > depth) break;
            int total = 0; for (auto& o : ords) total += o.qty;
            printf("    %lld  qty=%d  orders=%zu\\n", (long long)px, total, ords.size());
        }
        printf("  Bids (best first):\\n");
        i = 0;
        for (const auto& [px, ords] : bids) {
            if (++i > depth) break;
            int total = 0; for (auto& o : ords) total += o.qty;
            printf("    %lld  qty=%d  orders=%zu\\n", (long long)px, total, ords.size());
        }
    }
};

int main() {
    SortedBook book;
    book.add('B', 10050, 1, 100); book.add('B', 10050, 2, 50);
    book.add('B', 10049, 3, 200); book.add('S', 10052, 4, 150);
    book.add('S', 10053, 5, 100);
    printf("Before cancel:\\n"); book.print_top();
    book.cancel('B', 10050, 1);
    printf("After cancel order 1:\\n"); book.print_top();
}`,
    explanation: "std::map with std::greater<> as the comparator stores bids in descending order so rbegin() gives the best bid in O(1) and forward iteration visits price levels from best to worst — the natural access pattern for both quote display and matching engine order walks; unlike a vector of levels that requires O(N) insertion to maintain sorted order, tree insertion is O(log N) with no reallocation.",
  },
  {
    id: "cpp-20260728-b1-atomic-shared-ptr",
    language: "cpp",
    title: "std::atomic<std::shared_ptr> for lock-free snapshot sharing",
    tag: "lock-free",
    code: `#include <memory>
#include <atomic>
#include <thread>
#include <cstdio>

// std::atomic<std::shared_ptr<T>> (C++20): atomic load/store of a shared_ptr.
// Enables a writer to publish a new snapshot (by storing a new ptr) while
// concurrent readers safely reference the old version — no lock, no copy.

struct MarketSnapshot {
    int64_t bid_px;
    int64_t ask_px;
    int32_t bid_sz;
    int32_t ask_sz;
    uint64_t seq;
};

// Global atomic snapshot — writers publish, readers consume
std::atomic<std::shared_ptr<MarketSnapshot>> g_snapshot;

void publisher() {
    for (int i = 1; i <= 5; ++i) {
        // Allocate a NEW snapshot — old one persists until readers drop it
        auto snap = std::make_shared<MarketSnapshot>(
            MarketSnapshot{10050 + i, 10052 + i, 100, 150, (uint64_t)i}
        );
        // Atomic publish: readers that started loading the old ptr still see it
        g_snapshot.store(snap, std::memory_order_release);
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }
}

void subscriber(int id) {
    for (int i = 0; i < 5; ++i) {
        // Load atomically: increments refcount, safe concurrent with store
        auto snap = g_snapshot.load(std::memory_order_acquire);
        if (snap)
            printf("sub%d seq=%llu bid=%lld ask=%lld\\n",
                   id, (unsigned long long)snap->seq,
                   (long long)snap->bid_px, (long long)snap->ask_px);
        std::this_thread::sleep_for(std::chrono::milliseconds(2));
    }
}

int main() {
    g_snapshot.store(std::make_shared<MarketSnapshot>(
        MarketSnapshot{10050, 10052, 100, 150, 0}));
    std::thread pub(publisher);
    std::thread sub1(subscriber, 1), sub2(subscriber, 2);
    pub.join(); sub1.join(); sub2.join();
}`,
    explanation: "atomic<shared_ptr> implements the read-copy-update (RCU) pattern: the writer allocates and atomically publishes a new snapshot pointer, while readers atomically load the pointer and increment its refcount — the old snapshot lives exactly as long as the last reader holds it, with no lock and no copying of the data; this is the pattern used by market-data caches where many strategy threads read the current quote while a single feed handler updates it.",
  },
  {
    id: "cpp-20260728-b1-thread-local-stats",
    language: "cpp",
    title: "Thread-local storage for per-thread latency accumulators",
    tag: "low-latency",
    code: `#include <thread>
#include <vector>
#include <numeric>
#include <algorithm>
#include <cstdint>
#include <cstdio>

// thread_local: each thread gets its own copy of the variable.
// Use for per-thread counters and histograms: eliminates atomic contention
// entirely — each thread writes only its own copy, aggregation happens once
// at the end of the measurement period.

struct LatencyStats {
    uint64_t count = 0;
    uint64_t sum   = 0;
    uint64_t min_ns = UINT64_MAX;
    uint64_t max_ns = 0;
    uint64_t hist[16]{};  // power-of-2 bucket histogram (0-2^15 ns range)

    void record(uint64_t ns) {
        ++count; sum += ns;
        if (ns < min_ns) min_ns = ns;
        if (ns > max_ns) max_ns = ns;
        int bucket = 0;
        while (bucket < 15 && (1u << bucket) < ns) ++bucket;
        ++hist[bucket];
    }
    double mean_ns() const { return count ? (double)sum / count : 0; }
};

// Each thread writes to its own stats without atomics
thread_local LatencyStats tl_stats;

// After all threads finish, caller collects from each thread's local copy
std::vector<LatencyStats*> g_all_stats;
std::mutex                  g_reg_mutex;

void register_thread() {
    std::lock_guard<std::mutex> lk(g_reg_mutex);
    g_all_stats.push_back(&tl_stats);
}

void handler_thread(int n, uint64_t base_ns) {
    register_thread();
    for (int i = 0; i < n; ++i)
        tl_stats.record(base_ns + (uint64_t)(i % 512));
}

int main() {
    std::thread t1(handler_thread, 10000, 200);
    std::thread t2(handler_thread, 10000, 350);
    t1.join(); t2.join();
    for (auto* s : g_all_stats)
        printf("count=%llu mean=%.1f min=%llu max=%llu\\n",
               (unsigned long long)s->count, s->mean_ns(),
               (unsigned long long)s->min_ns, (unsigned long long)s->max_ns);
}`,
    explanation: "Thread-local latency histograms avoid all atomic synchronisation during the hot measurement path: each thread's record() call is a sequence of simple register operations on its private copy, and aggregation across threads happens once per reporting cycle under a lock; this is the pattern used in production matching engines where nanosecond-granularity latency distributions must be collected without adding any synchronisation overhead to the timed path.",
  },
  {
    id: "cpp-20260728-b1-variant-state-machine",
    language: "cpp",
    title: "std::variant order lifecycle state machine",
    tag: "cpp17",
    code: `#include <variant>
#include <cstdint>
#include <cstdio>
#include <optional>

// Model the order lifecycle as a std::variant state machine:
// New -> Pending -> (PartialFill | Filled) | Cancelled
// Each state carries only the data relevant to it — no bloated base class.

struct StateNew     { int64_t price; int32_t qty; char side; };
struct StatePending { uint64_t exch_id; int32_t remaining_qty; };
struct StateFill    { uint64_t exch_id; int32_t filled_qty; int64_t fill_px; };
struct StateCxled   { uint64_t exch_id; const char* reason; };

using OrderState = std::variant<StateNew, StatePending, StateFill, StateCxled>;

struct Order {
    uint64_t   id;
    OrderState state;

    void on_ack(uint64_t exch_id) {
        if (auto* s = std::get_if<StateNew>(&state))
            state = StatePending{exch_id, s->qty};
    }
    void on_fill(int32_t qty, int64_t px) {
        if (auto* s = std::get_if<StatePending>(&state)) {
            s->remaining_qty -= qty;
            if (s->remaining_qty <= 0)
                state = StateFill{s->exch_id, qty, px};
            // else keep StatePending with reduced remaining_qty
        }
    }
    void on_cancel(const char* reason) {
        if (auto* s = std::get_if<StatePending>(&state))
            state = StateCxled{s->exch_id, reason};
    }

    void print() const {
        printf("Order %llu: ", (unsigned long long)id);
        std::visit([](const auto& s) {
            using T = std::decay_t<decltype(s)>;
            if      constexpr (std::is_same_v<T, StateNew>)
                printf("NEW  %c %d @ %lld\\n", s.side, s.qty, (long long)s.price);
            else if constexpr (std::is_same_v<T, StatePending>)
                printf("PENDING  exch=%llu rem=%d\\n", (unsigned long long)s.exch_id, s.remaining_qty);
            else if constexpr (std::is_same_v<T, StateFill>)
                printf("FILLED   exch=%llu qty=%d @ %lld\\n", (unsigned long long)s.exch_id, s.filled_qty, (long long)s.fill_px);
            else
                printf("CANCELLED  reason=%s\\n", s.reason);
        }, state);
    }
};

int main() {
    Order o{1001, StateNew{10050, 100, 'B'}};
    o.print();
    o.on_ack(9'000'001);  o.print();
    o.on_fill(100, 10051);o.print();
}`,
    explanation: "A variant-based state machine is self-documenting and exhaustive: std::get_if returns nullptr for the wrong state rather than silently accessing stale fields, and std::visit with if constexpr forces every consumer to handle every possible state at compile time; this eliminates a class of bugs where code written for a Pending order accidentally runs on an already-Filled order because both shared the same struct layout.",
  },
  {
    id: "cpp-20260728-b1-segment-tree-vwap",
    language: "cpp",
    title: "Segment tree for O(log N) range VWAP queries",
    tag: "data-structures",
    code: `#include <vector>
#include <cstdio>
#include <cmath>

// Segment tree: build O(N), query O(log N), point-update O(log N).
// Each node stores price*volume and total volume for its range.
// VWAP([l,r]) = sum(price_i*vol_i) / sum(vol_i) for i in [l,r].

struct Node { double price_vol = 0; double vol = 0; };

class VwapTree {
    int n;
    std::vector<Node> tree;

    void build(const std::vector<double>& px,
               const std::vector<double>& vol,
               int node, int l, int r) {
        if (l == r) { tree[node] = {px[l]*vol[l], vol[l]}; return; }
        int mid = (l + r) / 2;
        build(px, vol, 2*node, l, mid);
        build(px, vol, 2*node+1, mid+1, r);
        tree[node].price_vol = tree[2*node].price_vol + tree[2*node+1].price_vol;
        tree[node].vol       = tree[2*node].vol       + tree[2*node+1].vol;
    }

    Node query(int node, int l, int r, int ql, int qr) const {
        if (ql <= l && r <= qr) return tree[node];
        int mid = (l + r) / 2;
        if (qr <= mid) return query(2*node, l, mid, ql, qr);
        if (ql >  mid) return query(2*node+1, mid+1, r, ql, qr);
        auto L = query(2*node, l, mid, ql, qr);
        auto R = query(2*node+1, mid+1, r, ql, qr);
        return {L.price_vol + R.price_vol, L.vol + R.vol};
    }

public:
    VwapTree(const std::vector<double>& px, const std::vector<double>& vol)
        : n((int)px.size()), tree(4*n) {
        build(px, vol, 1, 0, n-1);
    }

    double vwap(int l, int r) const {
        auto res = query(1, 0, n-1, l, r);
        return res.vol > 0 ? res.price_vol / res.vol : 0.0;
    }
};

int main() {
    std::vector<double> px  = {100.5, 101.0, 100.8, 101.5, 100.2};
    std::vector<double> vol = {1000,  1500,  800,   2000,  1200};
    VwapTree tree(px, vol);
    printf("VWAP all bars:   %.4f\\n", tree.vwap(0, 4));
    printf("VWAP bars 1-3:   %.4f\\n", tree.vwap(1, 3));
    printf("VWAP last 2:     %.4f\\n", tree.vwap(3, 4));
}`,
    explanation: "A segment tree decomposes range queries into O(log N) nodes whose stored aggregates can be combined in O(1); for VWAP the combine operation is simply adding the price*volume and volume sums — making range VWAP an O(log N) query rather than O(N) scan, critical for analytics dashboards that query thousands of different time windows over millions of bars simultaneously.",
  },
  {
    id: "cpp-20260728-b1-monotonic-stack-drawdown",
    language: "cpp",
    title: "Monotonic stack for streaming maximum drawdown",
    tag: "data-structures",
    code: `#include <vector>
#include <stack>
#include <cstdio>
#include <algorithm>
#include <cmath>

// Maximum drawdown: the largest peak-to-trough decline from any peak.
// MDD = max_{0<=i<=j<=n} (peak[i] - val[j]) / peak[i]
// Online (streaming): track running peak; at each step compute drawdown from peak.

struct DrawdownStats {
    double max_drawdown = 0.0;  // largest % decline from peak
    int    peak_idx = 0;        // index of the peak that led to max drawdown
    int    trough_idx = 0;      // index of the trough
    double current_drawdown = 0.0;
};

DrawdownStats compute_drawdown(const std::vector<double>& nav) {
    DrawdownStats ds;
    double running_peak = nav[0];
    int    peak_idx = 0;
    for (int i = 1; i < (int)nav.size(); ++i) {
        if (nav[i] > running_peak) {
            running_peak = nav[i];
            peak_idx     = i;
        }
        double dd = (running_peak - nav[i]) / running_peak;
        if (dd > ds.max_drawdown) {
            ds.max_drawdown = dd;
            ds.peak_idx     = peak_idx;
            ds.trough_idx   = i;
        }
    }
    ds.current_drawdown = (running_peak - nav.back()) / running_peak;
    return ds;
}

// Calmar ratio: annualised return / max drawdown
double calmar(const std::vector<double>& nav, double years) {
    double ann_ret = std::pow(nav.back() / nav.front(), 1.0/years) - 1.0;
    auto dd = compute_drawdown(nav);
    return dd.max_drawdown > 0 ? ann_ret / dd.max_drawdown : 0.0;
}

int main() {
    // Simulated NAV series with a significant drawdown
    std::vector<double> nav = {
        100, 105, 110, 108, 115, 120, 112, 100, 95, 105, 118, 125
    };
    auto ds = compute_drawdown(nav);
    printf("Max drawdown:     %.2f%%  (peak idx=%d, trough idx=%d)\\n",
           ds.max_drawdown * 100, ds.peak_idx, ds.trough_idx);
    printf("Current drawdown: %.2f%%\\n", ds.current_drawdown * 100);
    printf("Calmar (1Y):      %.3f\\n", calmar(nav, 1.0));
}`,
    explanation: "Maximum drawdown is the most psychologically important risk metric for fund managers because it measures the worst loss an investor would have suffered by being fully invested at the peak — the running-maximum pattern computes it in O(N) with O(1) extra space; the Calmar ratio (return / max drawdown) normalises performance by this worst-case experience, rewarding strategies that generate return without deep interim losses.",
  },
  {
    id: "cpp-20260728-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson implicit finite-difference scheme for European options",
    tag: "numerics",
    code: `#include <vector>
#include <algorithm>
#include <cmath>
#include <cstdio>

// Crank-Nicolson (CN): average of forward (explicit) and backward (implicit) time steps.
// Unconditionally stable + O(dt^2) accurate vs O(dt) for explicit FTCS.
// At each time step solve a TRIDIAGONAL system A*V_new = B*V_old (Thomas algorithm).

// Thomas algorithm: O(N) tridiagonal solver
void thomas(const std::vector<double>& a, // subdiagonal
            const std::vector<double>& b, // main diagonal
            const std::vector<double>& c, // superdiagonal
            const std::vector<double>& d, // RHS
            std::vector<double>& x) {
    int N = (int)b.size();
    std::vector<double> cp(N), dp(N);
    cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
    for (int i = 1; i < N; ++i) {
        double m = b[i] - a[i] * cp[i-1];
        cp[i] = c[i] / m;
        dp[i] = (d[i] - a[i] * dp[i-1]) / m;
    }
    x[N-1] = dp[N-1];
    for (int i = N-2; i >= 0; --i)
        x[i] = dp[i] - cp[i] * x[i+1];
}

double cn_european_call(double S0, double K, double r, double sigma,
                        double T, int M=200, int N=500) {
    double S_max = 4.0 * K;
    double dS = S_max / M, dt = T / N;

    std::vector<double> V(M+1);
    for (int i = 0; i <= M; ++i) V[i] = std::max(i*dS - K, 0.0);

    // CN coefficients for interior points
    std::vector<double> a(M-1), b(M-1), c(M-1), rhs(M-1), V_new(M-1);

    for (int n = 0; n < N; ++n) {
        double t = T - n*dt;  // backward time
        for (int j = 1; j < M; ++j) {
            double S = j * dS;
            double A = 0.25*dt*(sigma*sigma*S*S/(dS*dS) - r*S/dS);
            double B = 1.0 - 0.5*dt*(sigma*sigma*S*S/(dS*dS) + r);
            double C = 0.25*dt*(sigma*sigma*S*S/(dS*dS) + r*S/dS);
            int i = j - 1;
            a[i] = -A; b[i] = 1.0 + 0.5*dt*(sigma*sigma*S*S/(dS*dS)+r); c[i] = -C;
            rhs[i] = A*V[j-1] + B*V[j] + C*V[j+1];
        }
        // Boundary conditions adjust RHS
        rhs[0]   += a[0]       * 0.0;                   // V(0) = 0
        rhs[M-2] += c[M-2]     * (S_max - K*std::exp(-r*t)); // deep ITM BC
        thomas(a, b, c, rhs, V_new);
        for (int j = 1; j < M; ++j) V[j] = V_new[j-1];
    }
    int i0 = (int)(S0/dS);
    double w = (S0 - i0*dS)/dS;
    return V[i0]*(1-w) + V[i0+1]*w;
}

int main() {
    double p = cn_european_call(100, 100, 0.05, 0.20, 1.0);
    printf("CN call price = %.4f  (BS = ~10.45)\\n", p);
}`,
    explanation: "Crank-Nicolson averages the explicit and implicit spatial operators, making the scheme second-order accurate in both time and space (O(dt²) + O(dS²)) while remaining unconditionally stable — unlike the explicit FTCS which requires dt ≤ dS²/(σ²S²) to avoid blowup; the tridiagonal system is solved in O(M) time per step via the Thomas algorithm, making CN the standard choice for production PDE pricers.",
  },
  {
    id: "cpp-20260728-b1-barrier-option-mc",
    language: "cpp",
    title: "Discrete barrier option Monte Carlo with path monitoring",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <random>
#include <cstdio>
#include <algorithm>

// Up-and-out call: pays max(S_T - K, 0) only if spot never touches barrier B > S0.
// Discrete monitoring (daily): simulate daily closing prices, check barrier each day.
// Continuous monitoring formula underprices discrete barrier options.

double mc_up_out_call(double S0, double K, double B, double r,
                      double sigma, double T,
                      int n_steps = 252, int n_paths = 200000,
                      unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> norm(0.0, 1.0);

    double dt   = T / n_steps;
    double drift = (r - 0.5*sigma*sigma)*dt;
    double vol   = sigma*std::sqrt(dt);
    double disc  = std::exp(-r*T);

    double sum_payoff = 0.0;
    double sum_sq     = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double logS = std::log(S0);
        bool knocked_out = false;

        for (int t = 0; t < n_steps; ++t) {
            logS += drift + vol * norm(rng);
            if (std::exp(logS) >= B) { knocked_out = true; break; }
        }

        double payoff = 0.0;
        if (!knocked_out) {
            double S_T = std::exp(logS);
            payoff = std::max(S_T - K, 0.0);
        }
        sum_payoff += payoff;
        sum_sq     += payoff * payoff;
    }

    double mean  = sum_payoff / n_paths;
    double price = disc * mean;
    double se    = disc * std::sqrt((sum_sq/n_paths - mean*mean) / n_paths);
    printf("Up-and-out call (B=%.0f): price=%.4f  SE=%.5f\\n", B, price, se);
    return price;
}

int main() {
    // ATM call, barrier 20% above spot — compare effect of barrier level
    mc_up_out_call(100, 100, 120, 0.05, 0.20, 1.0);  // tight barrier
    mc_up_out_call(100, 100, 140, 0.05, 0.20, 1.0);  // wider barrier
    mc_up_out_call(100, 100, 200, 0.05, 0.20, 1.0);  // very wide (~vanilla)
}`,
    explanation: "Discrete barrier monitoring produces a structurally higher price than continuous monitoring because daily gaps between observation times allow the spot to cross and return without being recorded — the Broadie-Glasserman-Kou continuity correction adjusts by shifting the barrier by a factor of exp(±0.5826σ√(T/n)), closing most of the gap without additional simulation; for n=252 daily steps the discrete price can differ from continuous by 2-5 bps even at moderate vol.",
  },
  {
    id: "cpp-20260728-b1-lookback-closed-form",
    language: "cpp",
    title: "Fixed-strike lookback call closed-form (Goldman-Sosin-Gatto)",
    tag: "numerics",
    code: `#include <cmath>
#include <cstdio>

// Fixed-strike lookback call: max(max_{0<=t<=T} S_t - K, 0)
// Closed-form (Goldman, Sosin, Gatto 1979) under GBM:
//   C_lb = S*N(d1) - K*e^{-rT}*N(d2) + S*(sigma^2/(2r))*(e^{-rT}*(S/K)^{-2r/sigma^2}*N(-d3) - N(-d1))
// where d1, d2 are standard BS d1/d2 and d3 = d1 - 2r*sqrt(T)/sigma.

static double N(double x) { return 0.5*std::erfc(-x/std::sqrt(2.0)); }

// Fixed-strike lookback call price (assumes S_min0 = S0, max0 = S0)
double lookback_call(double S, double K, double r, double sigma, double T) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double d2  = d1 - sigma*sqT;
    double d3  = d1 - 2.0*r*sqT/sigma;  // GSG adjustment term
    double x   = -2.0*r/(sigma*sigma);   // exponent for S/K term
    double disc = std::exp(-r*T);

    // Standard BS call component
    double vanilla = S*N(d1) - K*disc*N(d2);

    // Lookback premium (the extra cost of guaranteeing the maximum payoff)
    double lb_adj = 0.0;
    if (std::abs(r) > 1e-10) {
        lb_adj = S * (sigma*sigma/(2*r)) *
                 (disc * std::pow(S/K, x) * N(-d3) - N(-d1));
    } else {
        // r -> 0 limit: S*sigma^2*T * phi(d1) / (2*sigma*sqT)
        lb_adj = S * sigma * sqT * std::exp(-0.5*d1*d1) / std::sqrt(2*M_PI);
    }

    return vanilla + lb_adj;
}

// Floating-strike lookback call (max S_T - min S): closed-form
double lookback_float_call(double S, double r, double sigma, double T) {
    // Conze & Viswanathan (1991)
    double sqT = std::sqrt(T);
    double a1  = (std::log(1.0) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    double a2  = a1 - sigma*sqT;
    double disc = std::exp(-r*T);
    // Simplified (S0 = current min): C_float = S*(N(a1) + sigma^2/(2r)*(1 - disc*(1+sigma^2/(2r))^{-1}*N(-a1)))
    // Exact formula:
    return S*(N(a1) - (sigma*sigma/(2*r))*disc*N(-a1))
         - S*disc*(N(a2) - (sigma*sigma/(2*r))*N(a2));
}

int main() {
    double S=100, K=100, r=0.05, sigma=0.20, T=1.0;
    printf("Fixed-strike lookback call:    %.4f\\n", lookback_call(S,K,r,sigma,T));
    printf("Floating-strike lookback call: %.4f\\n", lookback_float_call(S,r,sigma,T));
    printf("Vanilla call (BS):             %.4f\\n",
           S*N((std::log(S/K)+(r+0.5*sigma*sigma)*T)/(sigma*std::sqrt(T)))
         - K*std::exp(-r*T)*N((std::log(S/K)+(r+0.5*sigma*sigma)*T)/(sigma*std::sqrt(T))-sigma*std::sqrt(T)));
}`,
    explanation: "The lookback premium over the vanilla call equals the extra value of guaranteeing the maximum realised spot as the effective strike — it is bounded above by the cost of continuously delta-hedging a portfolio that tracks the running maximum; the GSG formula decomposes the lookback into a vanilla component plus a correction term that vanishes as sigma → 0 (when the terminal value equals the maximum with probability 1), and grows with volatility as the distribution of the running maximum widens.",
  },
  {
    id: "cpp-20260728-b1-initializer-list-portfolio",
    language: "cpp",
    title: "std::initializer_list for ergonomic portfolio construction",
    tag: "STL",
    code: `#include <initializer_list>
#include <vector>
#include <numeric>
#include <algorithm>
#include <cstdio>
#include <cstring>

// std::initializer_list: enables brace-initialization syntax for user types.
// Use in portfolio or basket construction to replace verbose push_back chains.

struct Position {
    char   symbol[8];
    double weight;
    double pnl;
};

struct Portfolio {
    std::vector<Position> positions;

    // Accepts: Portfolio p = {{"AAPL", 0.3, 120.0}, {"GOOG", 0.4, -80.0}, ...}
    Portfolio(std::initializer_list<Position> il) : positions(il) {
        normalise_weights();
    }

    void normalise_weights() {
        double total = 0;
        for (auto& p : positions) total += p.weight;
        if (total > 0) for (auto& p : positions) p.weight /= total;
    }

    double total_pnl() const {
        return std::accumulate(positions.begin(), positions.end(), 0.0,
                               [](double s, const Position& p){ return s + p.pnl; });
    }

    double weighted_pnl() const {
        return std::accumulate(positions.begin(), positions.end(), 0.0,
                               [](double s, const Position& p){ return s + p.weight * p.pnl; });
    }

    void print() const {
        printf("%-8s  %8s  %10s\\n", "Symbol", "Weight", "P&L");
        for (const auto& p : positions)
            printf("%-8s  %7.2f%%  %+9.2f\\n", p.symbol, p.weight*100, p.pnl);
        printf("%-8s  %8s  %+9.2f  (weighted: %+.2f)\\n",
               "TOTAL", "", total_pnl(), weighted_pnl());
    }
};

int main() {
    Portfolio book = {
        {"AAPL",  0.3,  120.0},
        {"GOOG",  0.4,  -80.0},
        {"MSFT",  0.2,   55.0},
        {"AMZN",  0.1,  -30.0},
    };
    book.print();
}`,
    explanation: "std::initializer_list bridges user-defined types into the brace-initialization syntax that C programmers expect for arrays; in financial code it allows portfolios, baskets, and covariance rows to be expressed as compact literals rather than multi-line push_back sequences — the initializer_list constructor is preferred over variadic templates when the elements are homogeneous and the caller never needs to mix types.",
  },
];
