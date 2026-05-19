import type { Snippet } from "./types";

// ============================================================
// C++ for Quant — foundations through HFT-flavored patterns.
// ============================================================
// All template-literal strings here use plain backticks. Be careful:
// any "${...}" inside backticks must be escaped as "\${...}" or it
// triggers JS interpolation at module load and crashes the build.
// C++ syntax does not need it, so we should never write "${...}"
// here in the first place.
// ============================================================

export const cppSnippets: Snippet[] = [
  // ─────────── FOUNDATIONS ───────────
  {
    id: "cpp-hello-iostream",
    language: "cpp",
    title: "Hello, world + iostream",
    tag: "foundations",
    code: `#include <iostream>

int main() {
    // std::cout writes to stdout. std::endl flushes; "\\n" is cheaper.
    std::cout << "Hello, quant world!\\n";
    return 0;
}`,
    explanation:
      "Compile with g++ -std=c++23 -O2 main.cpp. Use std::endl only when you need an immediate flush — most logging code prefers '\\n' to avoid hidden flushes in hot loops.",
  },
  {
    id: "cpp-fixed-width-ints",
    language: "cpp",
    title: "Fixed-width integer types",
    tag: "foundations",
    code: `#include <cstdint>
#include <iostream>

int main() {
    // int's width is platform-dependent. For wire formats, prices,
    // and timestamps, ALWAYS use the cstdint aliases.
    std::int64_t price_ticks = 100'500;      // price * 10000, say
    std::uint64_t order_id = 42;
    std::int32_t qty = -100;                 // signed: sells are negative

    std::cout << price_ticks << " " << order_id << " " << qty << "\\n";
}`,
    explanation:
      "Quant systems use integer ticks (not doubles) for prices because float arithmetic is non-associative and can lose pennies. int64 is the workhorse for IDs and timestamp-nanoseconds.",
  },
  {
    id: "cpp-auto-and-const",
    language: "cpp",
    title: "auto and const correctness",
    tag: "foundations",
    code: `#include <string>
#include <vector>

void demo(const std::vector<int>& xs) {  // const ref: no copy, no mutation
    auto n = xs.size();                  // auto deduces std::size_t
    const auto& first = xs.front();      // const ref to element

    // 'auto' alone strips references and const. Use 'auto&' or 'const auto&'
    // when you want to bind to the existing object instead of copying.
    for (const auto& x : xs) {
        // read-only iteration; mutating x is a compile error
        (void)x;
    }
    (void)n; (void)first;
}`,
    explanation:
      "Const correctness is the cheapest bug prevention in C++. const ref parameters give you no-copy reads, and `const auto&` in range-for avoids accidentally copying every element of a big container.",
  },
  {
    id: "cpp-references-vs-pointers",
    language: "cpp",
    title: "References vs pointers",
    tag: "foundations",
    code: `void increment_ref(int& x) { x += 1; }     // reference: cannot be null
void increment_ptr(int* x) {                 // pointer: can be null
    if (x) *x += 1;
}

int main() {
    int a = 5;
    increment_ref(a);   // a == 6
    increment_ptr(&a);  // a == 7
    increment_ptr(nullptr); // safe — guarded above
    return 0;
}`,
    explanation:
      "Prefer references for required, non-owning, non-null function inputs. Use pointers (or std::optional) when null is meaningful. Owning pointers belong inside smart-pointer types.",
  },
  {
    id: "cpp-vector-basics",
    language: "cpp",
    title: "std::vector — the default container",
    tag: "stl",
    code: `#include <vector>
#include <numeric>
#include <iostream>

int main() {
    std::vector<double> prices = {100.0, 100.5, 101.2, 99.8};
    prices.reserve(1024);              // avoid reallocations in a hot loop
    prices.push_back(102.1);

    // Sum and average using <numeric>
    double sum = std::accumulate(prices.begin(), prices.end(), 0.0);
    double avg = sum / static_cast<double>(prices.size());
    std::cout << avg << "\\n";
}`,
    explanation:
      "std::vector is contiguous memory — cache-friendly and the right default 95% of the time. Call reserve() when you know the upper bound to skip mid-loop reallocations.",
  },
  {
    id: "cpp-unordered-map",
    language: "cpp",
    title: "std::unordered_map (hash map)",
    tag: "stl",
    code: `#include <unordered_map>
#include <string>

int main() {
    std::unordered_map<std::uint64_t, double> last_price;

    last_price[100] = 250.10;          // insert or overwrite
    last_price.emplace(101, 47.50);    // construct in place — avoids a copy

    // find() returns end() iterator if absent. Avoid operator[] for reads —
    // it default-constructs the value on a miss.
    auto it = last_price.find(100);
    double price = (it != last_price.end()) ? it->second : 0.0;
    (void)price;
}`,
    explanation:
      "unordered_map is the C++ hash map (average O(1) ops). std::map is a red-black tree (ordered, O(log n)) — choose it only when you need keys in sorted order or stable iterator invariants.",
  },
  {
    id: "cpp-stl-algorithms",
    language: "cpp",
    title: "STL algorithms over loops",
    tag: "stl",
    code: `#include <algorithm>
#include <vector>
#include <numeric>

int main() {
    std::vector<int> pnl = {-5, 3, -2, 7, 1, -1, 4};

    std::sort(pnl.begin(), pnl.end());                   // in place
    auto neg_count = std::count_if(pnl.begin(), pnl.end(),
                                   [](int x) { return x < 0; });
    int total = std::accumulate(pnl.begin(), pnl.end(), 0);
    auto best = *std::max_element(pnl.begin(), pnl.end());

    (void)neg_count; (void)total; (void)best;
}`,
    explanation:
      "STL algorithms are vetted, vectorizable, and read like sentences. 'STL algorithms over raw loops' is one of the highest-leverage C++ habits to internalise.",
  },
  {
    id: "cpp-lambdas",
    language: "cpp",
    title: "Lambdas and std::function",
    tag: "stl",
    code: `#include <algorithm>
#include <vector>
#include <functional>

int main() {
    std::vector<int> qs = {30, -10, 70, 5};

    // [] capture-list; (int x) params; -> bool return; { ... } body.
    std::sort(qs.begin(), qs.end(), [](int a, int b) { return a > b; });

    int target = 50;
    auto over_target = [target](int x) { return x > target; };  // capture by value
    auto it = std::find_if(qs.begin(), qs.end(), over_target);

    // std::function erases the lambda type — needed when storing in a class.
    std::function<bool(int)> filter = over_target;
    (void)it; (void)filter;
}`,
    explanation:
      "Lambdas are first-class throwaway functions. Capture [&] by reference when you must mutate the outer scope; otherwise [=] or specific by-value captures avoid lifetime bugs.",
  },
  {
    id: "cpp-smart-pointers",
    language: "cpp",
    title: "Smart pointers (unique / shared / weak)",
    tag: "memory",
    code: `#include <memory>
#include <string>

struct Order { std::string sym; double px; };

int main() {
    // unique_ptr: sole owner; moves only, no copies. Use 99% of the time.
    auto o1 = std::make_unique<Order>("AAPL", 250.0);

    // shared_ptr: ref-counted shared ownership. Atomic refcount ops cost more.
    auto o2 = std::make_shared<Order>("MSFT", 470.0);
    auto o2_alias = o2;     // refcount = 2

    // weak_ptr: observer that doesn't extend lifetime.
    std::weak_ptr<Order> watcher = o2;
    if (auto strong = watcher.lock()) {
        // strong is a shared_ptr; safe to use here
        (void)strong->sym;
    }
}`,
    explanation:
      "std::unique_ptr is the default — zero overhead vs raw pointer, lifetime is obvious from ownership transfer. Reach for shared_ptr only when ownership genuinely is shared, and use weak_ptr to break cycles.",
  },
  {
    id: "cpp-raii",
    language: "cpp",
    title: "RAII — Resource Acquisition Is Initialisation",
    tag: "memory",
    code: `#include <fstream>
#include <mutex>

std::mutex book_mu;

void write_trade(const std::string& sym) {
    // Both ofstream and lock_guard release on scope exit — even on exception.
    std::ofstream out("trades.log", std::ios::app);
    std::lock_guard<std::mutex> guard(book_mu);

    out << sym << "\\n";
    // file closed AND mutex released here, automatically
}`,
    explanation:
      "RAII is THE C++ idiom: tie resource cleanup to object destruction. No try/finally needed — the language guarantees destructors run. Every leak you avoid is one a Python/Java codebase would have.",
  },

  // ─────────── MODERN C++ ───────────
  {
    id: "cpp-move-semantics",
    language: "cpp",
    title: "Move semantics and rvalue refs",
    tag: "modern",
    code: `#include <vector>
#include <string>
#include <utility>

std::vector<std::string> make_symbols() {
    std::vector<std::string> v;
    v.push_back("AAPL");
    v.push_back("MSFT");
    return v;  // NRVO + move: no deep copy of the vector on return
}

int main() {
    auto syms = make_symbols();

    std::string s = "BIG_PAYLOAD";
    std::vector<std::string> bag;
    bag.push_back(std::move(s));   // steals s's buffer; s is now valid-but-unspecified

    // Rule: after std::move, only assign-to or destroy the moved-from object.
}`,
    explanation:
      "std::move is a cast, not an action — it tells the compiler 'feel free to steal the guts'. In hot paths this avoids gratuitous deep copies of containers and strings. NRVO often makes returns free without writing std::move.",
  },
  {
    id: "cpp-templates-basics",
    language: "cpp",
    title: "Function templates",
    tag: "templates",
    code: `#include <vector>

// Single definition that compiles to one function per T used.
template <typename T>
T clamp_to(T x, T lo, T hi) {
    if (x < lo) return lo;
    if (x > hi) return hi;
    return x;
}

int main() {
    auto a = clamp_to<int>(150, 0, 100);     // 100
    auto b = clamp_to<double>(0.5, 0.0, 1.0);// 0.5
    (void)a; (void)b;
}`,
    explanation:
      "Templates are compile-time code generation. They give you zero-cost generic code — std::vector<int> and std::vector<Order> are entirely separate types at runtime, no virtual dispatch.",
  },
  {
    id: "cpp-template-specialization",
    language: "cpp",
    title: "Class templates and specialization",
    tag: "templates",
    code: `#include <iostream>

template <typename T>
struct Tick { T value; };

// Specialize for double: print with 4 decimals.
template <>
struct Tick<double> {
    double value;
    void print() const {
        std::printf("%.4f\\n", value);
    }
};

int main() {
    Tick<double> t{250.1234};
    t.print();
}`,
    explanation:
      "Template specialization lets you customise behaviour for specific types without changing call sites. Useful when one type needs different formatting, packing, or algorithms.",
  },
  {
    id: "cpp-constexpr",
    language: "cpp",
    title: "constexpr — compute at compile time",
    tag: "modern",
    code: `#include <array>

constexpr double TICK_SIZE = 0.01;     // baked into the binary, no runtime read

constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

// Used inside a constant expression — must evaluate at compile time
constexpr int F5 = factorial(5);
static_assert(F5 == 120, "math broken");

int main() {
    std::array<double, factorial(4)> buf{};  // size = 24, known to compiler
    (void)buf;
}`,
    explanation:
      "constexpr shifts work from runtime to compile time — zero runtime cost for these calculations. Modern C++ has consteval (must run at compile time) and constinit (runtime-once, statically initialised) for finer control.",
  },
  {
    id: "cpp-optional-variant",
    language: "cpp",
    title: "std::optional and std::variant",
    tag: "modern",
    code: `#include <optional>
#include <variant>
#include <string>
#include <iostream>

std::optional<double> parse_price(const std::string& s) {
    try { return std::stod(s); }
    catch (...) { return std::nullopt; }
}

// Tagged union — type-safe sum type.
using OrderEvent = std::variant<int, double, std::string>;

int main() {
    auto p = parse_price("250.10");
    if (p) std::cout << *p << "\\n";

    OrderEvent ev = std::string{"cancel"};
    std::visit([](auto&& v) { (void)v; /* handle each alternative */ }, ev);
}`,
    explanation:
      "std::optional replaces 'sentinel value' or 'out-of-band null' patterns; std::variant replaces unsafe unions with compile-time-checked alternatives. std::visit makes pattern-matching idiomatic.",
  },
  {
    id: "cpp-structured-bindings",
    language: "cpp",
    title: "Structured bindings",
    tag: "modern",
    code: `#include <map>
#include <tuple>
#include <string>

std::tuple<double, double, double> best_bid_offer() {
    return {250.10, 250.12, 100.0};   // bid, ask, size
}

int main() {
    auto [bid, ask, sz] = best_bid_offer();
    double spread = ask - bid;
    (void)spread; (void)sz;

    std::map<std::string, double> book = {{"AAPL", 250.1}};
    for (const auto& [sym, px] : book) {
        (void)sym; (void)px;
    }
}`,
    explanation:
      "Structured bindings unpack tuples, pairs, and structs into named locals. Especially handy in range-for over maps — no more `it->first`/`it->second`.",
  },

  // ─────────── CONCURRENCY / PERFORMANCE ───────────
  {
    id: "cpp-thread-basics",
    language: "cpp",
    title: "std::thread basics",
    tag: "concurrency",
    code: `#include <thread>
#include <vector>
#include <iostream>

void worker(int id) {
    std::cout << "worker " << id << "\\n";
}

int main() {
    std::vector<std::thread> pool;
    for (int i = 0; i < 4; ++i) pool.emplace_back(worker, i);
    for (auto& t : pool) t.join();   // join (or detach) every thread before destruction
}`,
    explanation:
      "A std::thread destructor calls std::terminate if the thread is neither joined nor detached. In quant systems you usually use a thread pool or std::jthread (auto-joins on destruction).",
  },
  {
    id: "cpp-mutex-lock-guard",
    language: "cpp",
    title: "Mutex and lock_guard",
    tag: "concurrency",
    code: `#include <mutex>
#include <thread>
#include <vector>

struct Counter {
    std::mutex mu;
    long long n = 0;

    void inc() {
        std::lock_guard<std::mutex> g(mu);   // locks ctor, unlocks dtor (RAII)
        ++n;
    }
};

int main() {
    Counter c;
    std::vector<std::thread> ts;
    for (int i = 0; i < 8; ++i)
        ts.emplace_back([&]{ for (int k = 0; k < 100000; ++k) c.inc(); });
    for (auto& t : ts) t.join();
    // c.n is now 800000 — race-free
}`,
    explanation:
      "lock_guard is the smallest, fastest RAII lock. Use unique_lock when you need to unlock-and-relock or pair with std::condition_variable. std::scoped_lock (C++17) locks multiple mutexes deadlock-free.",
  },
  {
    id: "cpp-atomic",
    language: "cpp",
    title: "std::atomic and memory order",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>

std::atomic<long long> packets_seen{0};
std::atomic<bool> done{false};

void rx() {
    while (!done.load(std::memory_order_acquire)) {
        packets_seen.fetch_add(1, std::memory_order_relaxed);
    }
}

int main() {
    std::thread t(rx);
    // ... shut down later
    done.store(true, std::memory_order_release);
    t.join();
}`,
    explanation:
      "Atomics give you race-free single-variable ops without a mutex. Default memory_order_seq_cst is safest; relaxed is the fastest but only when you don't need ordering between variables.",
  },
  {
    id: "cpp-false-sharing",
    language: "cpp",
    title: "Cache lines and false sharing",
    tag: "performance",
    code: `#include <atomic>
#include <new>

// Two counters on the same cache line will ping-pong between cores even
// if no thread actually wants the OTHER counter — that's "false sharing".
struct alignas(std::hardware_destructive_interference_size) PaddedCounter {
    std::atomic<long long> n{0};
};

PaddedCounter buy_count;
PaddedCounter sell_count;   // guaranteed to live on its own cache line`,
    explanation:
      "Modern CPUs move memory in 64-byte cache lines. Two hot atomics on the same line will cause cores to invalidate each other's caches on every write — pad them out and the throughput jumps.",
  },

  // ─────────── QUANT-SPECIFIC ───────────
  {
    id: "cpp-order-struct",
    language: "cpp",
    title: "Order struct (POD-style)",
    tag: "quant",
    code: `#include <cstdint>

enum class Side : std::uint8_t { Buy, Sell };
enum class Type : std::uint8_t { Market, Limit, IOC, FOK };

struct Order {
    std::uint64_t id;          // monotonic
    std::uint64_t ts_ns;       // nanos since epoch
    std::uint32_t qty;         // remaining size in lots
    std::int64_t  price_ticks; // price * 10000, e.g.
    Side side;
    Type type;
};
static_assert(sizeof(Order) <= 32, "Order grew — check padding");`,
    explanation:
      "Quant POD structs are packed and cache-friendly. enum class avoids implicit int conversions. static_assert on size catches accidental field bloat that would slow down a tight order-book loop.",
  },
  {
    id: "cpp-orderbook-sketch",
    language: "cpp",
    title: "Price-level order book (sketch)",
    tag: "quant",
    code: `#include <map>
#include <deque>
#include <cstdint>

struct Level { std::uint32_t qty; };

class OrderBook {
    // Bids: highest price first. Asks: lowest price first.
    std::map<std::int64_t, Level, std::greater<>> bids;
    std::map<std::int64_t, Level> asks;
public:
    void add_bid(std::int64_t px, std::uint32_t qty) {
        bids[px].qty += qty;
    }
    void add_ask(std::int64_t px, std::uint32_t qty) {
        asks[px].qty += qty;
    }
    std::int64_t best_bid() const { return bids.empty() ? 0  : bids.begin()->first; }
    std::int64_t best_ask() const { return asks.empty() ? 0  : asks.begin()->first; }
    double mid() const {
        return 0.5 * (static_cast<double>(best_bid() + best_ask()));
    }
};`,
    explanation:
      "Production order books use intrusive lists per price level for O(1) updates; this sketch uses std::map for clarity. Mid-price is the simplest reference; weighted-mid by top-of-book size is a better fair-value estimate.",
  },
  {
    id: "cpp-black-scholes",
    language: "cpp",
    title: "Black–Scholes call price",
    tag: "quant",
    code: `#include <cmath>

// Cumulative standard normal — Abramowitz & Stegun approximation.
double norm_cdf(double x) {
    return 0.5 * std::erfc(-x / std::sqrt(2.0));
}

// S spot, K strike, r risk-free, q dividend yield, sigma vol, T years.
double bs_call(double S, double K, double r, double q, double sigma, double T) {
    double sT = sigma * std::sqrt(T);
    double d1 = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / sT;
    double d2 = d1 - sT;
    return S * std::exp(-q * T) * norm_cdf(d1)
         - K * std::exp(-r * T) * norm_cdf(d2);
}`,
    explanation:
      "Closed-form European call. erfc gives a numerically stable normal CDF. For puts: put = call - S * exp(-qT) + K * exp(-rT) (put-call parity). Greeks are the partial derivatives of this function.",
  },
  {
    id: "cpp-monte-carlo",
    language: "cpp",
    title: "Monte Carlo option pricing (GBM)",
    tag: "quant",
    code: `#include <random>
#include <cmath>

double mc_call(double S, double K, double r, double sigma, double T,
               unsigned long n_paths) {
    std::mt19937_64 rng(42);
    std::normal_distribution<double> z(0.0, 1.0);

    double drift = (r - 0.5 * sigma * sigma) * T;
    double diffusion = sigma * std::sqrt(T);
    double sum = 0.0;
    for (unsigned long i = 0; i < n_paths; ++i) {
        double ST = S * std::exp(drift + diffusion * z(rng));
        double payoff = std::max(ST - K, 0.0);
        sum += payoff;
    }
    return std::exp(-r * T) * sum / static_cast<double>(n_paths);
}`,
    explanation:
      "Single-period GBM Monte Carlo. Converges as 1/sqrt(n). For path-dependent options (Asian, barrier) you simulate the full path and apply the payoff function at the end. Antithetic variates halve variance for ~free.",
  },
  {
    id: "cpp-circular-buffer",
    language: "cpp",
    title: "Circular buffer for moving average",
    tag: "quant",
    code: `#include <vector>

class RollingMean {
    std::vector<double> buf;
    std::size_t head = 0;
    std::size_t count = 0;
    double sum = 0.0;
public:
    explicit RollingMean(std::size_t window) : buf(window, 0.0) {}

    void push(double x) {
        if (count == buf.size()) sum -= buf[head];
        buf[head] = x;
        sum += x;
        head = (head + 1) % buf.size();
        if (count < buf.size()) ++count;
    }
    double mean() const { return count ? sum / static_cast<double>(count) : 0.0; }
};`,
    explanation:
      "O(1) rolling mean over a fixed window — used everywhere in market making and signal smoothing. The same skeleton with Welford's online variance gives O(1) rolling stdev (useful for vol bands).",
  },
  {
    id: "cpp-spsc-queue-sketch",
    language: "cpp",
    title: "SPSC ring buffer (lock-free, sketch)",
    tag: "quant",
    code: `#include <atomic>
#include <array>
#include <cstddef>

template <typename T, std::size_t N>
class SpscRing {
    std::array<T, N> data;
    std::atomic<std::size_t> head{0};   // writer index (producer)
    std::atomic<std::size_t> tail{0};   // reader index (consumer)
public:
    bool push(const T& v) {
        auto h = head.load(std::memory_order_relaxed);
        auto next = (h + 1) % N;
        if (next == tail.load(std::memory_order_acquire)) return false;  // full
        data[h] = v;
        head.store(next, std::memory_order_release);
        return true;
    }
    bool pop(T& out) {
        auto t = tail.load(std::memory_order_relaxed);
        if (t == head.load(std::memory_order_acquire)) return false;     // empty
        out = data[t];
        tail.store((t + 1) % N, std::memory_order_release);
        return true;
    }
};`,
    explanation:
      "Single-producer single-consumer ring is the bedrock of low-latency feed handlers. Acquire/release pairs guarantee the consumer sees the written value before the index update. Multi-producer queues need stronger ordering (or hazard pointers / RCU).",
  },
  {
    id: "cpp-pimpl",
    language: "cpp",
    title: "PImpl — pointer to implementation",
    tag: "design",
    code: `// strategy.h — header sees only a forward declaration
#include <memory>
class Strategy {
    struct Impl;
    std::unique_ptr<Impl> p;
public:
    Strategy();
    ~Strategy();                 // defined in .cpp where Impl is complete
    void on_tick(double px);
};

// strategy.cpp
struct Strategy::Impl {
    double last_px = 0.0;
    void on_tick(double px) { last_px = px; }
};
Strategy::Strategy() : p(std::make_unique<Impl>()) {}
Strategy::~Strategy() = default;
void Strategy::on_tick(double px) { p->on_tick(px); }`,
    explanation:
      "PImpl hides the private state from the header — recompile only the .cpp when internals change. Cost: one heap allocation and an extra indirection per call, so don't apply it to ultra-hot leaf classes.",
  },
  {
    id: "cpp-crtp",
    language: "cpp",
    title: "CRTP — static polymorphism",
    tag: "design",
    code: `template <class Derived>
struct Signal {
    double evaluate(double px) {
        // No virtual dispatch — compiler inlines the call into the derived
        // class's compute(). Critical for hot signal pipelines.
        return static_cast<Derived*>(this)->compute(px);
    }
};

struct MomentumSignal : Signal<MomentumSignal> {
    double last = 0.0;
    double compute(double px) {
        double s = px - last;
        last = px;
        return s;
    }
};`,
    explanation:
      "Curiously Recurring Template Pattern gives you polymorphism without the vtable lookup. Heavily used in quant codebases where a strategy interface is called millions of times per second.",
  },
  {
    id: "cpp-chrono-timing",
    language: "cpp",
    title: "Nanosecond timing with <chrono>",
    tag: "performance",
    code: `#include <chrono>
#include <iostream>

int main() {
    using clock = std::chrono::steady_clock;
    auto t0 = clock::now();

    // ... work ...

    auto t1 = clock::now();
    auto ns = std::chrono::duration_cast<std::chrono::nanoseconds>(t1 - t0).count();
    std::cout << ns << " ns\\n";
}`,
    explanation:
      "steady_clock is monotonic — safe for measuring intervals. system_clock can jump (NTP). For HFT timestamps, you typically wrap rdtsc or use clock_gettime(CLOCK_MONOTONIC_RAW) and convert to nanos.",
  },
];
