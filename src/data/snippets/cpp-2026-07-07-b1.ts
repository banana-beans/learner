import type { Snippet } from "./types";

export const cppSnippets20260707B1: Snippet[] = [
  {
    id: "cpp-20260707-b1-custom-allocator",
    language: "cpp",
    title: "Pool Allocator for Order Book Nodes",
    tag: "allocators",
    code: `#include <cstddef>
#include <cassert>
#include <iostream>

// Fixed-size pool allocator: avoids heap fragmentation for order nodes
template <typename T, std::size_t PoolSize>
class PoolAllocator {
    union Slot {
        alignas(T) std::byte storage[sizeof(T)];
        Slot* next;
    };

    Slot pool_[PoolSize];
    Slot* free_list_ = nullptr;

public:
    PoolAllocator() {
        // Chain all slots into the free list
        for (std::size_t i = 0; i < PoolSize - 1; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[PoolSize - 1].next = nullptr;
        free_list_ = &pool_[0];
    }

    T* allocate() {
        assert(free_list_ && "Pool exhausted");
        Slot* slot = free_list_;
        free_list_ = free_list_->next;
        return reinterpret_cast<T*>(slot->storage);
    }

    void deallocate(T* ptr) {
        auto* slot = reinterpret_cast<Slot*>(ptr);
        slot->next = free_list_;
        free_list_ = slot;
    }
};

struct Order { int id; double price; int qty; };

int main() {
    PoolAllocator<Order, 1024> pool;
    Order* o1 = pool.allocate();
    new (o1) Order{1, 100.5, 500};
    std::cout << "Order " << o1->id << " @ " << o1->price << "\\n";
    o1->~Order();
    pool.deallocate(o1);
}`,
    explanation:
      "A pool allocator pre-allocates a contiguous block and maintains a free-list of slots, making allocation O(1) with zero heap contention — critical for an order book that creates and destroys nodes at tick frequency. The union trick overlaps the storage and next-pointer fields so we pay no extra memory per slot.",
  },
  {
    id: "cpp-20260707-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive Doubly-Linked List for Price Level Queue",
    tag: "containers",
    code: `#include <iostream>

// Hook embedded inside the object avoids a separate node allocation
struct ListHook {
    ListHook* prev = nullptr;
    ListHook* next = nullptr;
};

template <typename T, ListHook T::*Hook>
class IntrusiveList {
    ListHook sentinel_; // dummy head/tail node

public:
    IntrusiveList() { sentinel_.prev = sentinel_.next = &sentinel_; }

    void push_back(T& obj) {
        ListHook* node = &(obj.*Hook);
        node->prev = sentinel_.prev;
        node->next = &sentinel_;
        sentinel_.prev->next = node;
        sentinel_.prev = node;
    }

    void remove(T& obj) {
        ListHook* node = &(obj.*Hook);
        node->prev->next = node->next;
        node->next->prev = node->prev;
        node->prev = node->next = nullptr;
    }

    T& front() {
        return *reinterpret_cast<T*>(
            reinterpret_cast<char*>(sentinel_.next)
            - reinterpret_cast<std::ptrdiff_t>(&(reinterpret_cast<T*>(0)->*Hook)));
    }

    bool empty() const { return sentinel_.next == &sentinel_; }
};

struct Order {
    int id;
    double price;
    ListHook hook;
};

int main() {
    IntrusiveList<Order, &Order::hook> level_queue;
    Order o1{1, 99.5, {}}, o2{2, 99.5, {}};
    level_queue.push_back(o1);
    level_queue.push_back(o2);
    std::cout << "Front order id: " << level_queue.front().id << "\\n"; // 1
    level_queue.remove(o1);
    std::cout << "Front after remove: " << level_queue.front().id << "\\n"; // 2
}`,
    explanation:
      "Intrusive lists embed the link pointers directly inside the element, so remove() is O(1) with no allocator calls — ideal for price-level queues where cancel/amend is the hot path. The pointer-to-member template parameter lets the same list machinery serve any struct that carries a ListHook field.",
  },
  {
    id: "cpp-20260707-b1-memory-ordering",
    language: "cpp",
    title: "Acquire-Release Ordering for Lock-Free Price Pub/Sub",
    tag: "lock-free",
    code: `#include <atomic>
#include <thread>
#include <iostream>

// Single-producer, single-consumer last-price cache
struct PriceCache {
    std::atomic<double> price{0.0};
    std::atomic<int>    seq{0};   // odd = write in progress, even = stable

    // Producer: publish a new price
    void publish(double p) {
        int s = seq.load(std::memory_order_relaxed);
        seq.store(s + 1, std::memory_order_release); // announce write start
        price.store(p, std::memory_order_relaxed);
        seq.store(s + 2, std::memory_order_release); // announce write done
    }

    // Consumer: read consistent price (seqlock pattern)
    double read() const {
        while (true) {
            int s1 = seq.load(std::memory_order_acquire);
            if (s1 & 1) continue;                     // write in progress
            double p = price.load(std::memory_order_relaxed);
            int s2 = seq.load(std::memory_order_acquire);
            if (s1 == s2) return p;                   // no concurrent write
        }
    }
};

PriceCache cache;

int main() {
    std::thread producer([]{
        for (int i = 0; i < 5; ++i)
            cache.publish(100.0 + i);
    });

    std::thread consumer([]{
        for (int i = 0; i < 5; ++i)
            std::cout << cache.read() << " ";
        std::cout << "\\n";
    });

    producer.join();
    consumer.join();
}`,
    explanation:
      "A seqlock uses a sequence counter instead of a mutex: readers spin until they observe two identical even values before and after the load, guaranteeing no torn read. Acquire-release pairs ensure the price store is visible before the second seq increment, preventing the reader from seeing stale data even on weakly-ordered ARM hardware.",
  },
  {
    id: "cpp-20260707-b1-branch-prediction",
    language: "cpp",
    title: "Branch-Prediction Hints for Hot-Path Order Matching",
    tag: "low-latency",
    code: `#include <cstdint>
#include <iostream>

// GCC/Clang built-ins tell the branch predictor what is likely
#if defined(__GNUC__) || defined(__clang__)
#  define LIKELY(x)   __builtin_expect(!!(x), 1)
#  define UNLIKELY(x) __builtin_expect(!!(x), 0)
#else
#  define LIKELY(x)   (x)
#  define UNLIKELY(x) (x)
#endif

struct Order { double price; int qty; bool is_buy; };

// Matching engine inner loop — aggressor is nearly always matched
inline bool try_match(const Order& passive, const Order& aggressor, double& fill_price) {
    // Cross condition holds in ~99% of ticks
    if (LIKELY(aggressor.is_buy  ? aggressor.price >= passive.price
                                 : aggressor.price <= passive.price)) {
        fill_price = passive.price;   // price-time priority
        return true;
    }
    // Rare: aggressor price moved away
    if (UNLIKELY(aggressor.qty == 0)) {
        fill_price = 0.0;
    }
    return false;
}

int main() {
    Order passive  {100.0, 1000, false};
    Order aggressor{100.5,  500, true};
    double fill = 0.0;
    if (try_match(passive, aggressor, fill))
        std::cout << "Filled @ " << fill << "\\n";
}`,
    explanation:
      "LIKELY/UNLIKELY hints guide the CPU's static predictor and let the compiler place the cold path in a separate code block, improving I-cache locality. In a matching engine, the cross condition is almost always true, so the hint keeps the fast-path instructions sequential and avoids a branch mis-prediction penalty (~15 cycles on modern x86).",
  },
  {
    id: "cpp-20260707-b1-prefetch",
    language: "cpp",
    title: "Software Prefetch for Sorted Order Book Traversal",
    tag: "low-latency",
    code: `#include <cstdint>
#include <vector>
#include <iostream>

// Issue a prefetch N elements ahead to hide DRAM latency (~200 cycles)
constexpr int PREFETCH_DIST = 8;

struct Level { double price; int qty; };

// Sum available qty above a threshold — simulates sweeping the ask side
int sweep_qty(const std::vector<Level>& book, double limit_price) {
    int total = 0;
    const int n = static_cast<int>(book.size());
    for (int i = 0; i < n; ++i) {
        // Prefetch the cache line for a future iteration
        if (i + PREFETCH_DIST < n)
            __builtin_prefetch(&book[i + PREFETCH_DIST], 0 /*read*/, 1 /*L1*/);

        if (book[i].price > limit_price) break;
        total += book[i].qty;
    }
    return total;
}

int main() {
    std::vector<Level> ask_book;
    for (int i = 0; i < 1000; ++i)
        ask_book.push_back({100.0 + i * 0.01, 100});

    std::cout << "Qty swept: " << sweep_qty(ask_book, 100.50) << "\\n"; // 5100
}`,
    explanation:
      "Software prefetch hides DRAM latency by issuing a non-blocking load request far enough ahead that the data arrives in L1 before the CPU needs it; the optimal prefetch distance equals the memory latency (cycles) divided by the loop body cost. For order-book sweeps that walk a sorted array, this can halve elapsed time when the book doesn't fit in L2.",
  },
  {
    id: "cpp-20260707-b1-fix-parser",
    language: "cpp",
    title: "Zero-Copy FIX 4.4 Tag-Value Parser",
    tag: "market-data",
    code: `#include <string_view>
#include <charconv>
#include <unordered_map>
#include <iostream>

// Parse a FIX message in-place — no heap allocation, no copies
using TagMap = std::unordered_map<int, std::string_view>;

TagMap parse_fix(std::string_view msg) {
    TagMap tags;
    const char SOH = '\\x01';   // FIX field delimiter

    while (!msg.empty()) {
        auto eq  = msg.find('=');
        if (eq == std::string_view::npos) break;
        auto soh = msg.find(SOH);

        std::string_view tag_str = msg.substr(0, eq);
        std::string_view val     = msg.substr(eq + 1, soh - eq - 1);

        int tag = 0;
        std::from_chars(tag_str.data(), tag_str.data() + tag_str.size(), tag);
        tags[tag] = val;

        msg = (soh == std::string_view::npos) ? "" : msg.substr(soh + 1);
    }
    return tags;
}

int main() {
    // FIX NewOrderSingle (clOrdID=35, side=54, price=44)
    std::string fix = "8=FIX.4.4\x01""35=D\x01""49=CLIENT\x01""56=BROKER\x01"
                      "11=ORD001\x01""54=1\x01""55=AAPL\x01""44=175.50\x01""38=100\x01";

    auto tags = parse_fix(fix);
    std::cout << "MsgType=" << tags[35]
              << " Side="   << tags[54]
              << " Price="  << tags[44] << "\\n";
}`,
    explanation:
      "string_view slices into the original buffer without copying, and std::from_chars converts tag numbers without locale overhead or heap allocation. A zero-copy FIX parser is essential in low-latency gateways where the same message buffer is processed by the parser, risk checks, and order router in under a microsecond.",
  },
  {
    id: "cpp-20260707-b1-order-book-hash-array",
    language: "cpp",
    title: "Hash-Array Order Book: O(1) Insert, O(1) Best Bid/Ask",
    tag: "order-book",
    code: `#include <unordered_map>
#include <map>
#include <iostream>

// Hybrid: hash map for O(1) order lookup, sorted map for price levels
struct Order { int id; double price; int qty; };

class OrderBook {
    std::unordered_map<int, Order> orders_;   // id -> order
    std::map<double, int>          bids_;     // price -> total qty (descending implied by rbegin)
    std::map<double, int>          asks_;     // price -> total qty

    void add_to_level(std::map<double,int>& side, double price, int qty) {
        side[price] += qty;
        if (side[price] == 0) side.erase(price);
    }

public:
    void add(Order o) {
        orders_[o.id] = o;
        if (o.qty > 0)  // positive = buy, negative = sell convention
            add_to_level(bids_, o.price, o.qty);
        else
            add_to_level(asks_, o.price, -o.qty);
    }

    void cancel(int id) {
        auto it = orders_.find(id);
        if (it == orders_.end()) return;
        Order& o = it->second;
        if (o.qty > 0) add_to_level(bids_, o.price, -o.qty);
        else           add_to_level(asks_, o.price,  o.qty);
        orders_.erase(it);
    }

    std::pair<double,double> best_bid_ask() const {
        double bid = bids_.empty() ? 0.0 : bids_.rbegin()->first;
        double ask = asks_.empty() ? 0.0 : asks_.begin()->first;
        return {bid, ask};
    }
};

int main() {
    OrderBook book;
    book.add({1, 99.50, 100});
    book.add({2, 99.75, 200});
    book.add({3, 100.00, -150});  // sell
    auto [bid, ask] = book.best_bid_ask();
    std::cout << "Best bid: " << bid << " ask: " << ask << "\\n";
    book.cancel(2);
    std::cout << "After cancel: bid=" << book.best_bid_ask().first << "\\n";
}`,
    explanation:
      "The hybrid hash+sorted-map design achieves O(1) order lookup/cancel (via ID) and O(log L) best-price update (L = number of distinct price levels, typically small). Pure sorted-map would cost O(log N) per cancel where N is total orders; the hash gives us direct access to skip that traversal.",
  },
  {
    id: "cpp-20260707-b1-hugepages",
    language: "cpp",
    title: "Hugepage-Backed Ring Buffer for Market Data Feed",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <cstring>
#include <stdexcept>
#include <iostream>

// Allocate memory backed by 2 MB hugepages to reduce TLB misses
void* alloc_hugepage(std::size_t size) {
    void* ptr = mmap(nullptr, size,
                     PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                     -1, 0);
    if (ptr == MAP_FAILED)
        throw std::runtime_error("hugepage mmap failed — check /proc/sys/vm/nr_hugepages");
    return ptr;
}

template <typename T, std::size_t Capacity>
class HugepageRingBuffer {
    static_assert((Capacity & (Capacity - 1)) == 0, "Capacity must be power of 2");
    T*            buf_;
    std::size_t   head_ = 0, tail_ = 0;
    static constexpr std::size_t mask_ = Capacity - 1;

public:
    HugepageRingBuffer() {
        buf_ = static_cast<T*>(alloc_hugepage(Capacity * sizeof(T)));
    }
    ~HugepageRingBuffer() { munmap(buf_, Capacity * sizeof(T)); }

    bool push(const T& val) {
        if (tail_ - head_ == Capacity) return false; // full
        buf_[tail_++ & mask_] = val;
        return true;
    }
    bool pop(T& val) {
        if (head_ == tail_) return false; // empty
        val = buf_[head_++ & mask_];
        return true;
    }
};

struct Tick { double price; int qty; };

int main() {
    try {
        HugepageRingBuffer<Tick, 1 << 20> feed; // 1M ticks
        feed.push({100.0, 500});
        Tick t;
        if (feed.pop(t))
            std::cout << "Tick: " << t.price << " qty=" << t.qty << "\\n";
    } catch (const std::exception& e) {
        std::cout << "Note: " << e.what() << " (run as root or configure hugepages)\\n";
    }
}`,
    explanation:
      "A 2 MB hugepage covers 512x more virtual address space than a 4 KB standard page, so a 1 M-entry ring buffer generates a single TLB entry instead of 2048 — eliminating TLB thrash that otherwise adds ~10 ns per cache miss on a busy feed handler. The power-of-2 capacity lets the index wrap with a bitmask instead of a modulo division.",
  },
  {
    id: "cpp-20260707-b1-perfect-forwarding",
    language: "cpp",
    title: "Perfect Forwarding in a Generic Event Dispatcher",
    tag: "modern-cpp",
    code: `#include <functional>
#include <unordered_map>
#include <vector>
#include <string>
#include <iostream>

// Event bus: subscribe handlers, publish events by type string
template <typename EventBase>
class EventDispatcher {
    using Handler = std::function<void(EventBase&&)>;
    std::unordered_map<std::string, std::vector<Handler>> handlers_;

public:
    template <typename H>
    void subscribe(const std::string& type, H&& handler) {
        handlers_[type].emplace_back(std::forward<H>(handler));
    }

    // Publish: forwarding ref preserves lvalue/rvalue of the event
    template <typename E>
    void publish(const std::string& type, E&& event) {
        auto it = handlers_.find(type);
        if (it == handlers_.end()) return;
        for (auto& h : it->second)
            h(std::forward<E>(event));
    }
};

struct MarketEvent { std::string symbol; double price; };

int main() {
    EventDispatcher<MarketEvent> bus;

    bus.subscribe("trade", [](MarketEvent&& e){
        std::cout << "Trade: " << e.symbol << " @ " << e.price << "\\n";
    });

    // Publish moves the temporary into each handler — no copy
    bus.publish("trade", MarketEvent{"AAPL", 175.50});
    bus.publish("trade", MarketEvent{"GOOGL", 2800.0});
}`,
    explanation:
      "std::forward preserves the value category of the event: if the caller passes an rvalue, the handler receives an rvalue and can move out of it without copying; if an lvalue, it's passed by const-reference as usual. This pattern is important in high-throughput event buses where copying large order or market-data structs on every publish would be prohibitive.",
  },
  {
    id: "cpp-20260707-b1-atomic-order-counter",
    language: "cpp",
    title: "Wait-Free Order ID Generator with Relaxed Atomics",
    tag: "lock-free",
    code: `#include <atomic>
#include <thread>
#include <vector>
#include <iostream>

// Each thread gets a globally unique order ID with no locks
class OrderIDGenerator {
    std::atomic<uint64_t> counter_{1'000'000}; // start above 1M for readability

public:
    // fetch_add with relaxed ordering is the fastest possible increment
    // — safe here because we only need uniqueness, not ordering w.r.t. other ops
    uint64_t next() {
        return counter_.fetch_add(1, std::memory_order_relaxed);
    }
};

OrderIDGenerator gen;

int main() {
    constexpr int N_THREADS = 4;
    constexpr int IDS_EACH  = 10;
    std::vector<std::vector<uint64_t>> results(N_THREADS);

    std::vector<std::thread> threads;
    for (int t = 0; t < N_THREADS; ++t) {
        threads.emplace_back([t, &results]{
            for (int i = 0; i < IDS_EACH; ++i)
                results[t].push_back(gen.next());
        });
    }
    for (auto& th : threads) th.join();

    // Verify uniqueness
    std::vector<uint64_t> all;
    for (auto& r : results) all.insert(all.end(), r.begin(), r.end());
    std::sort(all.begin(), all.end());
    bool unique = (std::unique(all.begin(), all.end()) == all.end());
    std::cout << "All IDs unique: " << std::boolalpha << unique << "\\n";
}`,
    explanation:
      "fetch_add with memory_order_relaxed is a single LOCK XADD on x86, making it wait-free (guaranteed progress) and faster than seq_cst because no memory fence is emitted. Relaxed ordering is safe for a counter whose only invariant is that each returned value is distinct — there's no ordering dependency with other memory locations.",
  },
  {
    id: "cpp-20260707-b1-stl-spans",
    language: "cpp",
    title: "std::span for Zero-Copy Tick Buffer Slicing",
    tag: "STL",
    code: `#include <span>
#include <vector>
#include <numeric>
#include <iostream>

struct Tick { double price; int volume; };

// Process a sub-range of a tick buffer without copying
double vwap(std::span<const Tick> ticks) {
    if (ticks.empty()) return 0.0;
    double pv = 0.0;
    int    tv = 0;
    for (const auto& t : ticks) {
        pv += t.price * t.volume;
        tv += t.volume;
    }
    return tv ? pv / tv : 0.0;
}

int main() {
    std::vector<Tick> feed = {
        {100.0, 200}, {100.5, 100}, {101.0, 300},
        {100.8, 150}, {101.2, 250},
    };

    // Slice last 3 ticks — no copy, O(1)
    auto last3 = std::span(feed).last(3);
    std::cout << "VWAP last 3: " << vwap(last3) << "\\n";

    // Slice middle window
    auto mid = std::span(feed).subspan(1, 3);
    std::cout << "VWAP mid:    " << vwap(mid)   << "\\n";
}`,
    explanation:
      "std::span is a non-owning view (pointer + size) introduced in C++20, so passing a window of a tick buffer to a function costs only two pointer-sized words — no vector copy, no allocation. It replaces the old (ptr, len) pair or const vector<T>& patterns with a type-safe, bounds-checked abstraction that composes with STL algorithms.",
  },
  {
    id: "cpp-20260707-b1-variant-message",
    language: "cpp",
    title: "std::variant for Typed Market Message Handling",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string>
#include <iostream>

struct NewOrder   { int id; double price; int qty; };
struct CancelOrder{ int id; };
struct TradeExec  { int bid_id; int ask_id; double fill_px; int fill_qty; };

using MarketMsg = std::variant<NewOrder, CancelOrder, TradeExec>;

// std::visit dispatches to the correct handler with zero virtual overhead
void process(const MarketMsg& msg) {
    std::visit([](const auto& m) {
        using T = std::decay_t<decltype(m)>;
        if constexpr (std::is_same_v<T, NewOrder>)
            std::cout << "New order id=" << m.id << " px=" << m.price << "\\n";
        else if constexpr (std::is_same_v<T, CancelOrder>)
            std::cout << "Cancel id=" << m.id << "\\n";
        else if constexpr (std::is_same_v<T, TradeExec>)
            std::cout << "Fill px=" << m.fill_px << " qty=" << m.fill_qty << "\\n";
    }, msg);
}

int main() {
    std::vector<MarketMsg> msgs = {
        NewOrder{1, 100.5, 200},
        CancelOrder{1},
        TradeExec{2, 3, 100.25, 150},
    };
    for (const auto& m : msgs) process(m);
}`,
    explanation:
      "std::variant + std::visit generates a jump table at compile time, giving the performance of a switch on a discriminant without the fragility of raw unions or the vtable overhead of polymorphism. In a matching engine's message loop, this avoids a virtual dispatch per message type while keeping the handler logic type-safe and exhaustive-checked by the compiler.",
  },
  {
    id: "cpp-20260707-b1-coroutine-feed",
    language: "cpp",
    title: "C++20 Coroutine Generator for Streaming Tick Feed",
    tag: "coroutines",
    code: `#include <coroutine>
#include <vector>
#include <iostream>

// Minimal generator coroutine — yields one Tick at a time
template <typename T>
struct Generator {
    struct promise_type {
        T value_;
        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v)  noexcept { value_ = v; return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> handle_;

    explicit Generator(std::coroutine_handle<promise_type> h) : handle_(h) {}
    ~Generator() { if (handle_) handle_.destroy(); }

    bool next() { handle_.resume(); return !handle_.done(); }
    T&   value() { return handle_.promise().value_; }
};

struct Tick { double price; int qty; };

// Simulates reading a live tick feed lazily
Generator<Tick> tick_feed(std::vector<Tick> data) {
    for (auto& t : data)
        co_yield t;
}

int main() {
    auto feed = tick_feed({{100.0,100},{100.5,200},{101.0,150}});
    while (feed.next())
        std::cout << feed.value().price << " qty=" << feed.value().qty << "\\n";
}`,
    explanation:
      "C++20 coroutines make lazy sequences natural: tick_feed suspends at each co_yield, resuming only when the consumer calls next() — no thread or queue needed. This pull-model generator is particularly useful for backtesting engines where you want to replay a historical feed without loading all ticks into memory at once.",
  },
  {
    id: "cpp-20260707-b1-constexpr-black-scholes",
    language: "cpp",
    title: "Compile-Time Black-Scholes with constexpr",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>

// Compile-time normal CDF approximation (Abramowitz & Stegun 26.2.17)
constexpr double norm_cdf_approx(double x) {
    constexpr double a1 =  0.319381530;
    constexpr double a2 = -0.356563782;
    constexpr double a3 =  1.781477937;
    constexpr double a4 = -1.821255978;
    constexpr double a5 =  1.330274429;
    double t = 1.0 / (1.0 + 0.2316419 * (x < 0 ? -x : x));
    double poly = t*(a1 + t*(a2 + t*(a3 + t*(a4 + t*a5))));
    double pdf  = 0.398942280 * std::exp(-0.5 * x * x);
    double cdf  = 1.0 - pdf * poly;
    return x < 0 ? 1.0 - cdf : cdf;
}

// constexpr BS call price — evaluated at compile time for constant inputs
constexpr double bs_call(double S, double K, double T,
                          double r, double sigma) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T)
                / (sigma * std::sqrt(T));
    double d2 = d1 - sigma * std::sqrt(T);
    return S * norm_cdf_approx(d1) - K * std::exp(-r*T) * norm_cdf_approx(d2);
}

int main() {
    // Evaluated at compile time — zero runtime cost
    constexpr double price = bs_call(100.0, 100.0, 1.0, 0.05, 0.20);
    std::cout << "BS call price: " << price << "\\n"; // ~10.45
}`,
    explanation:
      "Marking bs_call constexpr allows the compiler to fully evaluate it for constant-expression inputs, embedding the result as a literal in the generated code — useful for pre-computing option prices for known strikes in a lookup table at compile time. The Abramowitz & Stegun rational approximation to N(x) is accurate to 7 decimal places and avoids erfc, which is not constexpr in C++20.",
  },
  {
    id: "cpp-20260707-b1-simd-dot-product",
    language: "cpp",
    title: "AVX2 SIMD Dot Product for Factor Model Scoring",
    tag: "SIMD",
    code: `#include <immintrin.h>
#include <cstddef>
#include <iostream>

// Compute dot product of two float arrays using AVX2 (8 floats per register)
float dot_avx2(const float* a, const float* b, std::size_t n) {
    __m256 acc = _mm256_setzero_ps();
    std::size_t i = 0;

    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_loadu_ps(a + i);  // load 8 floats unaligned
        __m256 vb = _mm256_loadu_ps(b + i);
        acc = _mm256_fmadd_ps(va, vb, acc);  // fused multiply-add: acc += va*vb
    }

    // Horizontal sum of 8 lanes
    float buf[8];
    _mm256_storeu_ps(buf, acc);
    float sum = 0.0f;
    for (int j = 0; j < 8; ++j) sum += buf[j];

    // Scalar tail for remaining elements
    for (; i < n; ++i) sum += a[i] * b[i];
    return sum;
}

int main() {
    constexpr std::size_t N = 64;
    float factors[N], weights[N];
    for (std::size_t i = 0; i < N; ++i)
        factors[i] = weights[i] = static_cast<float>(i + 1);

    float score = dot_avx2(factors, weights, N);
    std::cout << "Factor score: " << score << "\\n"; // sum of i^2 for i=1..64
}`,
    explanation:
      "AVX2 processes 8 single-precision floats per clock with FMA, giving ~8x throughput over scalar for a dot product. In a factor model that scores thousands of instruments using 64-factor weight vectors, SIMD cuts the scoring pass from microseconds to nanoseconds — which matters when re-scoring must complete within a market-data callback.",
  },
  {
    id: "cpp-20260707-b1-timer-wheel",
    language: "cpp",
    title: "Hierarchical Timer Wheel for Order Timeout Management",
    tag: "low-latency",
    code: `#include <vector>
#include <functional>
#include <cstdint>
#include <iostream>

// Single-level timer wheel: O(1) schedule, O(1) per-tick expiry check
class TimerWheel {
    struct Timer { std::function<void()> cb; bool active = false; };
    std::vector<std::vector<Timer>> slots_;
    std::size_t current_ = 0;
    uint64_t    tick_us_; // microseconds per slot

public:
    explicit TimerWheel(std::size_t n_slots = 256, uint64_t tick_us = 1000)
        : slots_(n_slots), tick_us_(tick_us) {}

    // Schedule cb to fire after delay_us microseconds
    void schedule(uint64_t delay_us, std::function<void()> cb) {
        std::size_t ticks = (delay_us + tick_us_ - 1) / tick_us_;
        std::size_t slot  = (current_ + ticks) % slots_.size();
        slots_[slot].push_back({std::move(cb), true});
    }

    // Advance one tick: fire all timers in the current slot
    void tick() {
        auto& bucket = slots_[current_];
        for (auto& t : bucket)
            if (t.active) t.cb();
        bucket.clear();
        current_ = (current_ + 1) % slots_.size();
    }
};

int main() {
    TimerWheel wheel(256, 1000); // 256 slots, 1ms per slot

    wheel.schedule(3000, []{ std::cout << "Order timeout after 3ms\\n"; });
    wheel.schedule(1000, []{ std::cout << "Heartbeat after 1ms\\n"; });

    // Simulate 5ms of ticks
    for (int ms = 0; ms < 5; ++ms) {
        std::cout << "Tick " << ms << "ms\\n";
        wheel.tick();
    }
}`,
    explanation:
      "A timer wheel maps timeouts to array slots by computing (current + delay) % slots, making both schedule and expiry O(1) — no heap rebalancing like a priority queue. Trading systems use timer wheels for order GTD expiry, heartbeat monitors, and session timeout management where thousands of timers fire per second.",
  },
  {
    id: "cpp-20260707-b1-fd-pricer",
    language: "cpp",
    title: "Crank-Nicolson Finite Difference American Put Pricer",
    tag: "numerics",
    code: `#include <vector>
#include <algorithm>
#include <iostream>

// Crank-Nicolson PDE solver for American put on a log-space grid
double american_put_cn(double S0, double K, double T,
                        double r, double sigma, int M, int N) {
    double dt  = T / N;
    double dx  = sigma * std::sqrt(3.0 * dt);  // log-space grid step
    int    J   = M / 2;  // index of ATM spot

    // Grid in log-space: x[j] = log(S0) + (j-J)*dx
    std::vector<double> x(M + 1);
    for (int j = 0; j <= M; ++j)
        x[j] = std::log(S0) + (j - J) * dx;

    // Terminal payoff
    std::vector<double> V(M + 1);
    for (int j = 0; j <= M; ++j)
        V[j] = std::max(K - std::exp(x[j]), 0.0);

    double alpha = 0.25 * dt * (sigma * sigma / (dx * dx) - (r - 0.5 * sigma * sigma) / dx);
    double beta  = -0.5 * dt * (sigma * sigma / (dx * dx) + r);
    double gamma = 0.25 * dt * (sigma * sigma / (dx * dx) + (r - 0.5 * sigma * sigma) / dx);

    // Time-step backwards using Thomas algorithm (tridiagonal solve)
    for (int n = 0; n < N; ++n) {
        std::vector<double> rhs(M - 1);
        for (int j = 1; j < M; ++j)
            rhs[j-1] = -alpha*V[j-1] + (1-beta)*V[j] - gamma*V[j+1];

        // Thomas algorithm (simplified, no pivoting — stable for diag dominant)
        std::vector<double> c_(M-2), d_(M-1);
        double b0 = 1 + beta;  // diagonal value (CN implicit side)
        c_[0] = gamma / b0;
        d_[0] = rhs[0] / b0;
        for (int i = 1; i < M - 1; ++i) {
            double denom = b0 - alpha * c_[i-1];
            c_[i] = (i < M - 2) ? gamma / denom : 0.0;
            d_[i] = (rhs[i] - alpha * d_[i-1]) / denom;
        }
        // Back-substitution into V
        V[M-1] = d_[M-2];
        for (int i = M - 3; i >= 0; --i)
            V[i+1] = d_[i] - c_[i] * V[i+2];

        // American constraint: hold > exercise
        for (int j = 0; j <= M; ++j)
            V[j] = std::max(V[j], K - std::exp(x[j]));
    }

    return V[J]; // option value at ATM node (closest to S0)
}

int main() {
    std::cout << "American put: "
              << american_put_cn(100.0, 100.0, 1.0, 0.05, 0.2, 200, 100)
              << "\\n"; // ~5.57
}`,
    explanation:
      "Crank-Nicolson is second-order accurate in both space and time (O(dx²+dt²)) unlike explicit Euler (O(dt)), so it achieves the same accuracy with far fewer time steps. The American constraint is enforced at each backward step by taking max(V, intrinsic) — a simple projected SOR relaxation that avoids solving a full linear complementarity problem.",
  },
  {
    id: "cpp-20260707-b1-stl-ranges",
    language: "cpp",
    title: "C++20 Ranges for Lazy Order Book Analytics",
    tag: "STL",
    code: `#include <ranges>
#include <vector>
#include <numeric>
#include <iostream>

struct Level { double price; int qty; };

int main() {
    std::vector<Level> ask_book = {
        {100.00, 1000}, {100.25, 500}, {100.50, 200},
        {100.75, 800},  {101.00, 300},
    };

    // Lazy pipeline: filter levels within 50bps, transform to notional, take top 3
    auto pipeline = ask_book
        | std::views::filter([](const Level& l){ return l.price <= 100.50; })
        | std::views::transform([](const Level& l){ return l.price * l.qty; })
        | std::views::take(3);

    double total_notional = 0.0;
    for (double n : pipeline) {
        std::cout << n << "  ";
        total_notional += n;
    }
    std::cout << "\\nTotal notional: " << total_notional << "\\n";

    // Count levels above mid with more than 500 qty
    double mid = 100.375;
    auto deep_ask = ask_book
        | std::views::filter([mid](const Level& l){
            return l.price > mid && l.qty > 500;
          });
    std::cout << "Deep ask levels: "
              << std::ranges::distance(deep_ask) << "\\n"; // 1 (100.75, 800)
}`,
    explanation:
      "C++20 ranges are composable lazy views — filter and transform apply element-by-element without allocating intermediate vectors, keeping the hot path in L1 cache. For order book analytics (notional at risk, depth of market, VWAP computation), range pipelines express the intent clearly and let the optimizer fuse the loops into a single pass.",
  },
  {
    id: "cpp-20260707-b1-asian-option-mc",
    language: "cpp",
    title: "Monte Carlo Asian Option Pricer with Antithetic Variates",
    tag: "numerics",
    code: `#include <random>
#include <cmath>
#include <iostream>

// Arithmetic average Asian call pricer using antithetic variate reduction
double asian_call_mc(double S0, double K, double T, double r,
                      double sigma, int n_paths, int n_steps) {
    std::mt19937_64 rng(42);
    std::normal_distribution<double> norm(0.0, 1.0);

    double dt   = T / n_steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    double payoff_sum = 0.0;

    for (int p = 0; p < n_paths; p += 2) {  // pairs for antithetic
        double avg1 = 0.0, avg2 = 0.0;
        double S1 = S0, S2 = S0;
        for (int t = 0; t < n_steps; ++t) {
            double z = norm(rng);
            S1 *= std::exp(drift + vol *  z);  // original path
            S2 *= std::exp(drift + vol * -z);  // antithetic path
            avg1 += S1;
            avg2 += S2;
        }
        avg1 /= n_steps;
        avg2 /= n_steps;
        payoff_sum += std::max(avg1 - K, 0.0);
        payoff_sum += std::max(avg2 - K, 0.0);
    }

    return disc * payoff_sum / n_paths;
}

int main() {
    double price = asian_call_mc(100.0, 100.0, 1.0, 0.05, 0.2, 100'000, 252);
    std::cout << "Asian call (MC, antithetic): " << price << "\\n"; // ~5.3-5.5
}`,
    explanation:
      "Antithetic variates pair each Brownian path with its mirror (-z) — the pair's average is a control variate that cancels part of the Monte Carlo variance without changing the expected value, reducing the standard error by roughly half compared to simple Monte Carlo for the same number of paths. For arithmetic Asians (no closed form), this variance reduction is essential to achieve sub-cent accuracy with ≤100 k paths.",
  },
  {
    id: "cpp-20260707-b1-type-erasure",
    language: "cpp",
    title: "Type Erasure for a Polymorphic Risk Model Interface",
    tag: "modern-cpp",
    code: `#include <memory>
#include <iostream>

// Type erasure: polymorphic interface without virtual base class overhead
class RiskModel {
    struct Concept {
        virtual double pnl_explain(double delta_spot) const = 0;
        virtual ~Concept() = default;
    };

    template <typename T>
    struct Model : Concept {
        T impl;
        explicit Model(T t) : impl(std::move(t)) {}
        double pnl_explain(double ds) const override { return impl.pnl_explain(ds); }
    };

    std::unique_ptr<Concept> ptr_;

public:
    template <typename T>
    explicit RiskModel(T model)
        : ptr_(std::make_unique<Model<T>>(std::move(model))) {}

    double pnl_explain(double delta_spot) const {
        return ptr_->pnl_explain(delta_spot);
    }
};

// Concrete risk models — no inheritance needed
struct DeltaOnly  {
    double delta;
    double pnl_explain(double ds) const { return delta * ds; }
};

struct DeltaGamma {
    double delta, gamma;
    double pnl_explain(double ds) const {
        return delta * ds + 0.5 * gamma * ds * ds;
    }
};

int main() {
    RiskModel r1(DeltaOnly{0.5});
    RiskModel r2(DeltaGamma{0.5, 0.02});
    std::cout << "Delta only:  " << r1.pnl_explain(1.0) << "\\n"; // 0.5
    std::cout << "Delta+Gamma: " << r2.pnl_explain(1.0) << "\\n"; // 0.51
}`,
    explanation:
      "Type erasure wraps concrete types in an internal concept/model layer, exposing polymorphism through a value-type (copyable, stack-allocatable) interface rather than pointer-to-base — eliminating the need for clients to manage raw pointers or know the inheritance hierarchy. In risk engines, this lets you store heterogeneous risk models (delta, delta-gamma, full revaluation) in a single std::vector without sacrificing performance or requiring a common base class.",
  },
  {
    id: "cpp-20260707-b1-barrier-option",
    language: "cpp",
    title: "Knock-Out Barrier Option via Reflection Principle",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>

// Analytical price for a down-and-out European call (continuous barrier)
// Using the reflection principle formula
double down_out_call(double S0, double K, double B, double T,
                      double r, double sigma) {
    if (S0 <= B) return 0.0; // spot already breached barrier

    auto N = [](double x) -> double {
        return 0.5 * std::erfc(-x / std::sqrt(2.0));
    };

    double lam = (r + 0.5 * sigma * sigma) / (sigma * sigma);
    double y   = std::log(B * B / (S0 * K)) / (sigma * std::sqrt(T))
                + lam * sigma * std::sqrt(T);
    double x1  = std::log(S0 / B) / (sigma * std::sqrt(T))
                + lam * sigma * std::sqrt(T);
    double y1  = std::log(B / S0) / (sigma * std::sqrt(T))
                + lam * sigma * std::sqrt(T);

    double vanilla = S0 * N((std::log(S0/K)/(sigma*std::sqrt(T))) + lam*sigma*std::sqrt(T))
                   - K * std::exp(-r*T) * N((std::log(S0/K)/(sigma*std::sqrt(T))) + (lam-1)*sigma*std::sqrt(T));

    double barrier_adj = S0 * std::pow(B/S0, 2*lam) * N(y)
                       - K * std::exp(-r*T) * std::pow(B/S0, 2*(lam-1)) * N(y - sigma*std::sqrt(T));

    return vanilla - barrier_adj;
}

int main() {
    // S=110, K=100, B=90, T=1, r=5%, sigma=20%
    double price = down_out_call(110.0, 100.0, 90.0, 1.0, 0.05, 0.20);
    std::cout << "Down-and-out call: " << price << "\\n"; // ~12.1
}`,
    explanation:
      "The reflection principle equates the probability of a Brownian path ever touching the barrier B with the probability of a reflected path reaching 2 ln(B) - ln(S), giving a closed-form correction to the vanilla price. The barrier reduces the call value because there's a non-zero probability the spot will touch B before expiry and the option will be knocked out — that probability increases as S approaches B.",
  },
  {
    id: "cpp-20260707-b1-fixed-string",
    language: "cpp",
    title: "Fixed-Length Symbol String for Cache-Friendly Tables",
    tag: "low-latency",
    code: `#include <cstring>
#include <array>
#include <string_view>
#include <iostream>
#include <unordered_map>

// 8-byte symbol that fits in a register — no heap, no SSO branch
struct Symbol {
    std::array<char, 8> data{};

    explicit Symbol(std::string_view s) {
        std::size_t n = std::min(s.size(), std::size_t(8));
        std::memcpy(data.data(), s.data(), n);
    }

    bool operator==(const Symbol& o) const { return data == o.data; }
    std::string_view view() const {
        auto end = std::find(data.begin(), data.end(), '\\0');
        return {data.data(), static_cast<std::size_t>(end - data.begin())};
    }
};

struct SymbolHash {
    std::size_t operator()(const Symbol& s) const {
        uint64_t v;
        std::memcpy(&v, s.data.data(), 8);
        return v ^ (v >> 33);  // fast integer hash
    }
};

int main() {
    std::unordered_map<Symbol, double, SymbolHash> mid_prices;
    mid_prices[Symbol{"AAPL"}]  = 175.50;
    mid_prices[Symbol{"GOOGL"}] = 2800.0;
    mid_prices[Symbol{"MSFT"}]  = 310.0;

    Symbol key{"AAPL"};
    std::cout << key.view() << ": " << mid_prices[key] << "\\n";
}`,
    explanation:
      "Packing a trading symbol into 8 bytes lets it be compared, hashed, and copied as a single 64-bit integer — no heap access, no SSO path through std::string. In a reference data table used by the hot path (e.g., mid-price lookup per tick), this eliminates the string length check and potential allocation that would pollute cache lines on every lookup.",
  },
  {
    id: "cpp-20260707-b1-crtp-strategy",
    language: "cpp",
    title: "CRTP-Based Strategy Framework (Zero Overhead Polymorphism)",
    tag: "CRTP",
    code: `#include <iostream>
#include <vector>

// CRTP base: Derived must implement on_tick() and position()
template <typename Derived>
class StrategyBase {
public:
    // Non-virtual dispatch — inlined at compile time
    void on_tick(double price) {
        static_cast<Derived*>(this)->on_tick_impl(price);
    }

    double position() const {
        return static_cast<const Derived*>(this)->position_impl();
    }

    // Shared logic: mark-to-market PnL
    double mtm_pnl(double current_price, double avg_cost) const {
        return position() * (current_price - avg_cost);
    }
};

// Concrete strategy: simple momentum
class MomentumStrategy : public StrategyBase<MomentumStrategy> {
    double pos_    = 0.0;
    double prev_   = 0.0;
    int    signal_ = 0;
public:
    void on_tick_impl(double price) {
        if (prev_ > 0) signal_ = (price > prev_) ? 1 : -1;
        pos_  += signal_;  // trivial accumulation for demo
        prev_  = price;
    }
    double position_impl() const { return pos_; }
};

int main() {
    MomentumStrategy strat;
    std::vector<double> prices = {100, 101, 102, 101, 100, 99, 100, 102};
    for (double p : prices) strat.on_tick(p);
    std::cout << "Position: "  << strat.position()          << "\\n";
    std::cout << "MtM PnL: "   << strat.mtm_pnl(102, 99.5) << "\\n";
}`,
    explanation:
      "CRTP achieves polymorphism without vtable overhead: static_cast<Derived*>(this)->on_tick_impl() resolves at compile time, allowing the compiler to inline the derived implementation directly into the base template's call site. For a strategy framework that processes millions of ticks, eliminating the vtable pointer dereference and indirect branch per tick can save tens of nanoseconds per event.",
  },
  {
    id: "cpp-20260707-b1-spinlock",
    language: "cpp",
    title: "Exponential-Backoff Spinlock for Order Cache",
    tag: "lock-free",
    code: `#include <atomic>
#include <thread>
#include <iostream>

// Spinlock with exponential backoff to reduce cache-coherency traffic
class Spinlock {
    std::atomic_flag flag_ = ATOMIC_FLAG_INIT;

public:
    void lock() {
        int backoff = 1;
        while (flag_.test_and_set(std::memory_order_acquire)) {
            for (int i = 0; i < backoff; ++i)
                __builtin_ia32_pause(); // PAUSE instruction: hints the CPU this is a spin-wait
            backoff = std::min(backoff * 2, 1024);
        }
    }

    void unlock() {
        flag_.clear(std::memory_order_release);
    }
};

Spinlock cache_lock;
int order_count = 0;

int main() {
    std::vector<std::thread> workers;
    for (int i = 0; i < 8; ++i) {
        workers.emplace_back([]{
            for (int k = 0; k < 1000; ++k) {
                cache_lock.lock();
                ++order_count;
                cache_lock.unlock();
            }
        });
    }
    for (auto& t : workers) t.join();
    std::cout << "Total orders: " << order_count << "\\n"; // 8000
}`,
    explanation:
      "The PAUSE instruction tells the CPU to wait a few cycles without issuing another read to the cache line, reducing power and coherency traffic during a spin-wait — critical when multiple cores are competing for the same lock. Exponential backoff further reduces bus contention by spacing retries further apart as the contention duration grows, adapting to both short and long critical sections.",
  },
  {
    id: "cpp-20260707-b1-string-view-ticker",
    language: "cpp",
    title: "Market Data Line Parser Using string_view Tokenizer",
    tag: "market-data",
    code: `#include <string_view>
#include <charconv>
#include <vector>
#include <iostream>

// Split CSV line into string_view tokens — zero copy, zero allocation
std::vector<std::string_view> split_csv(std::string_view line, char delim = ',') {
    std::vector<std::string_view> tokens;
    tokens.reserve(8);
    std::size_t start = 0;
    while (true) {
        auto pos = line.find(delim, start);
        tokens.push_back(line.substr(start, pos - start));
        if (pos == std::string_view::npos) break;
        start = pos + 1;
    }
    return tokens;
}

struct Tick { std::string_view symbol; double bid, ask; int size; };

// Parse a single CSV tick line: symbol,bid,ask,size
Tick parse_tick(std::string_view line) {
    auto t = split_csv(line);
    Tick tk;
    tk.symbol = t[0];
    std::from_chars(t[1].data(), t[1].data() + t[1].size(), tk.bid);
    std::from_chars(t[2].data(), t[2].data() + t[2].size(), tk.ask);
    std::from_chars(t[3].data(), t[3].data() + t[3].size(), tk.size);
    return tk;
}

int main() {
    std::string line = "AAPL,175.48,175.50,1000";
    auto tick = parse_tick(line);
    std::cout << tick.symbol << " bid=" << tick.bid
              << " ask=" << tick.ask << " sz=" << tick.size << "\\n";
}`,
    explanation:
      "Tokenizing with string_view avoids any heap allocation: all tokens are slices of the original buffer, so the parser runs in O(n) time with O(1) extra memory. std::from_chars is the C++17 locale-independent number parser that avoids the overhead of stod/stoi and is safe in multithreaded contexts — together these choices make a market data line parseable in under 50 ns.",
  },
  {
    id: "cpp-20260707-b1-lookback-option",
    language: "cpp",
    title: "Lookback Fixed-Strike Call via Simulation",
    tag: "numerics",
    code: `#include <random>
#include <cmath>
#include <algorithm>
#include <iostream>

// Lookback fixed-strike call: payoff = max(max(S_t) - K, 0)
double lookback_call_mc(double S0, double K, double T, double r,
                         double sigma, int n_paths, int n_steps) {
    std::mt19937_64 rng(42);
    std::normal_distribution<double> norm(0.0, 1.0);

    double dt    = T / n_steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);
    double total = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S   = S0;
        double Smax = S0;
        for (int t = 0; t < n_steps; ++t) {
            S *= std::exp(drift + vol * norm(rng));
            Smax = std::max(Smax, S);
        }
        total += std::max(Smax - K, 0.0);
    }
    return disc * total / n_paths;
}

int main() {
    // S=100, K=95, T=1yr, r=5%, sigma=20%
    double price = lookback_call_mc(100.0, 95.0, 1.0, 0.05, 0.20, 50'000, 252);
    std::cout << "Lookback call (MC): " << price << "\\n"; // ~18-20
}`,
    explanation:
      "A lookback option pays based on the extreme price realized over the life of the contract, making it path-dependent and analytically more complex than barrier options. The fixed-strike variant has a semi-closed form, but simulation is preferred in practice because it generalizes to stochastic-vol or jump-diffusion dynamics without formula changes.",
  },
  {
    id: "cpp-20260707-b1-order-throttle",
    language: "cpp",
    title: "Token Bucket Order Throttle with Chrono",
    tag: "low-latency",
    code: `#include <chrono>
#include <cmath>
#include <iostream>

using Clock = std::chrono::steady_clock;
using NS    = std::chrono::nanoseconds;

// Token bucket: allows bursts up to capacity, refills at rate tokens/sec
class TokenBucket {
    double capacity_;
    double rate_;       // tokens per nanosecond
    double tokens_;
    Clock::time_point last_;

public:
    TokenBucket(double capacity, double rate_per_sec)
        : capacity_(capacity), rate_(rate_per_sec / 1e9),
          tokens_(capacity), last_(Clock::now()) {}

    bool allow() {
        auto now     = Clock::now();
        double elapsed = static_cast<double>(
            std::chrono::duration_cast<NS>(now - last_).count());
        tokens_ = std::min(capacity_, tokens_ + rate_ * elapsed);
        last_   = now;
        if (tokens_ >= 1.0) { tokens_ -= 1.0; return true; }
        return false;
    }
};

int main() {
    // Allow burst of 5, refill at 10 orders/sec
    TokenBucket bucket(5.0, 10.0);
    int accepted = 0, rejected = 0;

    // Simulate 20 order attempts with no time gap (burst test)
    for (int i = 0; i < 20; ++i) {
        if (bucket.allow()) ++accepted;
        else                ++rejected;
    }
    std::cout << "Accepted: " << accepted << " Rejected: " << rejected << "\\n";
    // Accepts 5 (burst), rejects 15
}`,
    explanation:
      "The token bucket's key advantage over a fixed-rate leaky bucket is that it allows bursts up to the bucket capacity before throttling — matching real exchange rate-limit behaviour where you can submit several orders rapidly but the sustained rate is capped. Using steady_clock avoids system-time jumps and provides monotonically increasing timestamps suitable for nanosecond-precision rate accounting.",
  },
];
