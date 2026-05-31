import type { Snippet } from "./types";

export const cppSnippets20260531B1: Snippet[] = [
  {
    id: "cpp-20260531-b1-pmr-arena",
    language: "cpp",
    title: "std::pmr::monotonic_buffer_resource — zero-fragmentation per-message parse arena",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <string_view>
#include <cstdint>
#include <print>

// monotonic_buffer_resource bumps a pointer forward on every allocation.
// Deallocation is a no-op — everything is freed in one shot by destroying
// the resource. Ideal for per-message parse state: alloc, parse, discard.

struct FixField { std::string_view tag, value; };

void parse_fix(std::string_view raw) {
    // 4 KB stack buffer — no heap for typical FIX messages.
    std::array<std::byte, 4096> stack_buf;
    std::pmr::monotonic_buffer_resource arena{stack_buf.data(), stack_buf.size()};

    // All allocations from this vector come from the arena.
    std::pmr::vector<FixField> fields{&arena};
    fields.reserve(32);   // pre-size — still uses arena memory

    std::size_t pos = 0;
    while (pos < raw.size()) {
        auto eq  = raw.find('=', pos);
        auto soh = raw.find('\\x01', eq + 1);
        if (eq == std::string_view::npos) break;
        auto end = (soh == std::string_view::npos) ? raw.size() : soh;
        fields.push_back({raw.substr(pos, eq - pos),
                          raw.substr(eq + 1, end - eq - 1)});
        pos = (soh == std::string_view::npos) ? raw.size() : soh + 1;
    }

    for (auto& [tag, val] : fields)
        std::println("tag={} val={}", tag, val);

    // arena destructor frees everything in one shot — zero fragmentation.
}

int main() {
    parse_fix("35=D\\x0155=AAPL\\x0144=182.50\\x0138=100\\x01");
}`,
    explanation:
      "std::pmr::monotonic_buffer_resource turns a fixed stack buffer into a bump allocator: each alloc advances a pointer, dealloc is a no-op, and the entire arena is reset by destroying the resource. For FIX parsing this means zero heap allocations per message, eliminating malloc/free overhead that would otherwise dominate latency at high message rates.",
  },

  {
    id: "cpp-20260531-b1-ranges-zip",
    language: "cpp",
    title: "std::views::zip (C++23) — parallel price/volume iteration for VWAP",
    tag: "stl",
    code: `#include <ranges>
#include <vector>
#include <numeric>
#include <print>

// std::views::zip (C++23) produces pairs of elements from two ranges
// without copying data. Cleaner than a manual index loop and composes
// with other range adaptors.

double vwap(const std::vector<double>& prices,
            const std::vector<double>& volumes) {
    double pv = 0.0, v = 0.0;
    for (auto [p, vol] : std::views::zip(prices, volumes)) {
        pv += p * vol;
        v  += vol;
    }
    return (v > 0.0) ? pv / v : 0.0;
}

// Compose with filter: only include prints above min_vol
double vwap_filtered(const std::vector<double>& px,
                     const std::vector<double>& vol,
                     double min_vol) {
    double pv = 0.0, v = 0.0;
    for (auto [p, vl] : std::views::zip(px, vol)
                      | std::views::filter([&](auto pv_pair) {
                            return std::get<1>(pv_pair) >= min_vol; })) {
        pv += p * vl;
        v  += vl;
    }
    return (v > 0.0) ? pv / v : 0.0;
}

int main() {
    std::vector<double> px  = {100.0, 100.5, 99.8, 101.0};
    std::vector<double> vol = {1000.0, 500.0, 200.0, 2000.0};
    std::println("VWAP:          {:.4f}", vwap(px, vol));
    std::println("VWAP(>=500v):  {:.4f}", vwap_filtered(px, vol, 500.0));
}`,
    explanation:
      "std::views::zip eliminates manual index bookkeeping when iterating two co-indexed arrays — a very common pattern in quant code (prices + volumes, strikes + vols, deltas + notionals). Because it's a lazy view, chaining with filter or transform adds zero intermediate copies and can be optimised into a single loop by the compiler.",
  },

  {
    id: "cpp-20260531-b1-optional-chain",
    language: "cpp",
    title: "std::optional monadic chain (C++23) — null-safe Greeks pipeline",
    tag: "stl",
    code: `#include <optional>
#include <cmath>
#include <print>

// std::optional::and_then / transform (C++23) propagate nullopt automatically,
// letting you chain fallible computations without nested if-guards.

static double norm_cdf(double x) noexcept {
    return 0.5 * std::erfc(-x * M_SQRT1_2);
}

// Returns nullopt if any input is invalid; otherwise BSM delta.
std::optional<double> bs_delta(
    std::optional<double> S,
    std::optional<double> K,
    std::optional<double> sigma,
    std::optional<double> T) noexcept
{
    // and_then: pass value along, short-circuit on nullopt
    return S
        .and_then([&](double s) -> std::optional<double> {
            if (s <= 0.0) return std::nullopt;
            return K.and_then([&](double k) -> std::optional<double> {
                if (k <= 0.0) return std::nullopt;
                return sigma.and_then([&](double sig) -> std::optional<double> {
                    if (sig <= 0.0) return std::nullopt;
                    return T.transform([&](double t) {
                        double d1 = (std::log(s / k) +
                                     (0.5 * sig * sig) * t) / (sig * std::sqrt(t));
                        return norm_cdf(d1);
                    });
                });
            });
        });
}

int main() {
    auto d1 = bs_delta(100.0, 100.0, 0.20, 1.0);
    auto d2 = bs_delta(std::nullopt, 100.0, 0.20, 1.0);   // missing spot
    auto d3 = bs_delta(100.0, 100.0, -0.01, 1.0);          // invalid vol

    std::println("valid delta:   {:.4f}", d1.value_or(-1.0));
    std::println("missing spot:  {:.4f}", d2.value_or(-1.0));
    std::println("negative vol:  {:.4f}", d3.value_or(-1.0));
}`,
    explanation:
      "C++23's monadic optional methods (and_then, transform, or_else) replace the verbose if(opt.has_value()) boilerplate — any nullptr-equivalent short-circuits the entire chain. In a pricing library where individual market data points can be stale or missing, this pattern cleanly propagates 'unavailable' through a multi-step Greeks computation without throwing or silently returning NaN.",
  },

  {
    id: "cpp-20260531-b1-atomic-double",
    language: "cpp",
    title: "Portable atomic<double> via std::bit_cast + atomic<uint64_t>",
    tag: "concurrency",
    code: `#include <atomic>
#include <bit>       // std::bit_cast (C++20)
#include <cstdint>
#include <print>

// std::atomic<double> exists but lacks fetch_add on some platforms.
// Wrapping double in uint64_t via bit_cast gives portable lock-free atomics.

class AtomicDouble {
    std::atomic<std::uint64_t> raw_;
public:
    explicit AtomicDouble(double v = 0.0) noexcept
        : raw_(std::bit_cast<std::uint64_t>(v)) {}

    double load(std::memory_order mo = std::memory_order_seq_cst) const noexcept {
        return std::bit_cast<double>(raw_.load(mo));
    }

    void store(double v, std::memory_order mo = std::memory_order_seq_cst) noexcept {
        raw_.store(std::bit_cast<std::uint64_t>(v), mo);
    }

    // CAS-based fetch_add: retry until the exchange succeeds.
    double fetch_add(double delta,
                     std::memory_order mo = std::memory_order_seq_cst) noexcept {
        std::uint64_t old_bits = raw_.load(std::memory_order_relaxed);
        std::uint64_t new_bits;
        do {
            double old_val = std::bit_cast<double>(old_bits);
            new_bits = std::bit_cast<std::uint64_t>(old_val + delta);
        } while (!raw_.compare_exchange_weak(old_bits, new_bits,
                                             mo, std::memory_order_relaxed));
        return std::bit_cast<double>(old_bits);
    }

    bool is_lock_free() const noexcept { return raw_.is_lock_free(); }
};

// Shared mid-price updated by feed thread, read by strategy thread.
AtomicDouble g_mid_price{100.0};

int main() {
    g_mid_price.store(100.25, std::memory_order_release);
    double mid = g_mid_price.load(std::memory_order_acquire);
    std::println("mid: {:.2f}  lock-free: {}", mid, g_mid_price.is_lock_free());

    double prev = g_mid_price.fetch_add(0.25);
    std::println("prev: {:.2f}  new: {:.2f}", prev, g_mid_price.load());
}`,
    explanation:
      "std::atomic<double> is atomic but not always lock-free and rarely has a hardware fetch_add. Encoding the double bits as uint64_t via std::bit_cast (C++20, no UB unlike reinterpret_cast) exposes the full lock-free atomic integer API — is_lock_free() confirms single-instruction atomicity. The CAS loop for fetch_add is wait-free in practice on x86 since contention on a single price variable is rare.",
  },

  {
    id: "cpp-20260531-b1-source-location",
    language: "cpp",
    title: "std::source_location — zero-overhead structured log entry (C++20)",
    tag: "low-latency",
    code: `#include <source_location>
#include <chrono>
#include <cstdint>
#include <print>

// std::source_location captures __FILE__, __LINE__, __func__ at compile time
// with no runtime string manipulation. Default argument captures call site.

enum class LogLevel : std::uint8_t { DEBUG, INFO, WARN, ERROR };

struct LogEntry {
    std::chrono::nanoseconds ts;
    LogLevel level;
    std::string_view file;
    std::uint32_t    line;
    std::string_view func;
    std::string_view msg;
};

// Log ring buffer (simplified: direct print).
inline void log(LogLevel lvl, std::string_view msg,
                const std::source_location& loc =
                    std::source_location::current()) noexcept
{
    auto ns = std::chrono::high_resolution_clock::now().time_since_epoch();
    // In production, push a LogEntry into a lock-free ring — no formatting here.
    std::println("[{}:{}] {} {}",
                 loc.file_name(), loc.line(),
                 static_cast<int>(lvl), msg);
}

// Typed helpers capture the level at compile time — zero branching.
#define LOG_INFO(msg)  log(LogLevel::INFO,  (msg))
#define LOG_WARN(msg)  log(LogLevel::WARN,  (msg))
#define LOG_ERROR(msg) log(LogLevel::ERROR, (msg))

struct OrderGateway {
    void send_order(double price, int qty) {
        LOG_INFO("sending order");   // loc captured here automatically
        if (qty <= 0) LOG_WARN("zero qty");
    }
};

int main() {
    OrderGateway gw;
    gw.send_order(182.50, 100);
    gw.send_order(182.50, 0);
}`,
    explanation:
      "std::source_location::current() is evaluated at the call site at compile time, giving __FILE__, __LINE__, and __func__ without any runtime overhead — no preprocessor stringification, no dynamic lookup. Passing it as a default parameter means callers get automatic site capture with no extra syntax, so the logging macro is purely syntactic sugar that adds no instruction cost.",
  },

  {
    id: "cpp-20260531-b1-cpu-shard",
    language: "cpp",
    title: "Per-CPU sharded counter with cache-line padding",
    tag: "low-latency",
    code: `#include <atomic>
#include <thread>
#include <vector>
#include <numeric>
#include <new>      // std::hardware_destructive_interference_size
#include <print>

// False sharing: two threads touching adjacent atomic counters thrash
// the same cache line. Padding to the cache-line boundary eliminates it.

struct alignas(std::hardware_destructive_interference_size) PaddedCounter {
    std::atomic<std::uint64_t> value{0};
    // The alignas ensures this struct occupies its own cache line.
};

class ShardedCounter {
    static constexpr int SHARDS = 16;   // power-of-two for cheap modulo
    std::array<PaddedCounter, SHARDS> shards_{};
public:
    void increment(std::uint64_t n = 1) noexcept {
        // Map thread ID to a shard — avoids any cross-shard contention.
        auto id = std::hash<std::thread::id>{}(std::this_thread::get_id());
        shards_[id & (SHARDS - 1)].value.fetch_add(n, std::memory_order_relaxed);
    }

    // Drain: read all shards — only called infrequently (stats flush).
    std::uint64_t total() const noexcept {
        std::uint64_t sum = 0;
        for (const auto& s : shards_)
            sum += s.value.load(std::memory_order_relaxed);
        return sum;
    }
};

ShardedCounter g_order_count;

int main() {
    std::vector<std::thread> ts;
    for (int i = 0; i < 4; ++i)
        ts.emplace_back([&] { for (int k = 0; k < 100'000; ++k) g_order_count.increment(); });
    for (auto& t : ts) t.join();
    std::println("total orders: {}", g_order_count.total());  // 400000
}`,
    explanation:
      "Cache-line padding (alignas with hardware_destructive_interference_size, typically 64 bytes) prevents multiple threads from competing for the same cache line when they each update different counters. Without padding, the hardware's MESI protocol forces cache-line ownership transfers between cores on every atomic increment, making what looks like independent operations effectively serialised — a 10-20x throughput hit at high message rates.",
  },

  {
    id: "cpp-20260531-b1-flat-set",
    language: "cpp",
    title: "std::flat_set (C++23) — contiguous order-ID deduplication",
    tag: "stl",
    code: `#include <flat_set>   // C++23
#include <cstdint>
#include <vector>
#include <print>

// std::flat_set stores elements in a sorted contiguous vector.
// Binary-search lookup is O(log N) but ~3x faster than std::set
// for small-to-medium N due to cache-line-friendly sequential layout.
// Ideal for deduplication when the set is built once and queried often.

struct OrderDedup {
    std::flat_set<std::uint64_t> seen_ids;

    // Returns true if this is a new order ID (not yet processed).
    bool is_new(std::uint64_t order_id) {
        auto [it, inserted] = seen_ids.insert(order_id);
        return inserted;
    }

    // Bulk initialise from a snapshot (O(N log N) sort + unique).
    void load_snapshot(std::vector<std::uint64_t> ids) {
        seen_ids = std::flat_set<std::uint64_t>(
            std::sorted_unique,          // hint: sorted input skips the sort step
            ids.begin(), ids.end());     // caller must sort first
    }

    std::size_t size() const noexcept { return seen_ids.size(); }
};

int main() {
    OrderDedup dedup;
    std::vector<std::uint64_t> incoming = {1001, 1002, 1001, 1003, 1002, 1004};

    int new_count = 0;
    for (auto id : incoming) {
        if (dedup.is_new(id)) ++new_count;
    }
    std::println("unique orders: {}  duplicates: {}",
                 new_count, incoming.size() - new_count);   // 4  2
}`,
    explanation:
      "std::flat_set's contiguous storage makes membership tests cache-hot: a binary search over a sorted vector touches O(log N) cache lines but they are sequential, while std::set traverses a red-black tree whose nodes scatter across the heap. For order-ID dedup sets that are 100–10,000 elements, flat_set is typically 2-5x faster on lookup-heavy workloads.",
  },

  {
    id: "cpp-20260531-b1-generator",
    language: "cpp",
    title: "std::generator (C++23) — lazy tick stream coroutine",
    tag: "coroutines",
    code: `#include <generator>   // C++23
#include <cstdint>
#include <print>
#include <random>
#include <cmath>

// std::generator<T> is a stackful coroutine that yields values lazily.
// The consumer pulls each tick on demand — no thread, no callback, no buffer.

struct Tick { double price; std::uint64_t volume; };

// Generates synthetic tick stream: GBM prices + Poisson volume.
std::generator<Tick> make_tick_stream(double S0, double sigma,
                                      double mu, std::size_t max_ticks,
                                      unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double>  norm;
    std::poisson_distribution<std::uint64_t> pois(500);

    double S = S0;
    const double dt = 1.0 / (252.0 * 6.5 * 3600);  // per-second in trading day
    for (std::size_t i = 0; i < max_ticks; ++i) {
        S *= std::exp((mu - 0.5 * sigma * sigma) * dt
                      + sigma * std::sqrt(dt) * norm(rng));
        co_yield Tick{S, pois(rng)};
    }
}

int main() {
    double vwap_pv = 0.0, vwap_v = 0.0;
    for (auto [px, vol] : make_tick_stream(100.0, 0.20, 0.05, 10)) {
        vwap_pv += px * static_cast<double>(vol);
        vwap_v  += static_cast<double>(vol);
        std::println("px={:.4f}  vol={}", px, vol);
    }
    std::println("VWAP: {:.4f}", vwap_pv / vwap_v);
}`,
    explanation:
      "std::generator (C++23) turns a coroutine into a pull-based range: the caller drives iteration via the for loop, and the coroutine body resumes on each next() call without needing a dedicated thread or callback. For market data replay, this cleanly separates the tick generation logic from downstream processing while keeping both on the same stack, with zero inter-thread synchronisation overhead.",
  },

  {
    id: "cpp-20260531-b1-consteval-tick",
    language: "cpp",
    title: "consteval rational tick-size arithmetic — compile-time rounding",
    tag: "templates",
    code: `#include <cstdint>
#include <cmath>
#include <print>

// Exchange instruments have discrete tick sizes (e.g. 0.01, 0.0025, 1/32).
// Representing them as compile-time rationals avoids floating-point drift
// and enables exact rounding without std::round(x / tick_size) * tick_size.

template<std::int64_t Num, std::int64_t Den>
struct Tick {
    static_assert(Den > 0, "denominator must be positive");
    static constexpr double value = static_cast<double>(Num) / Den;

    // Round price to nearest tick, returning the tick-aligned value.
    static constexpr double round_to(double price) noexcept {
        // Multiply by Den, round to nearest integer, divide by Den.
        // All integer ops — no accumulated floating-point error.
        std::int64_t ticks = static_cast<std::int64_t>(
            std::round(price * Den / Num));
        return static_cast<double>(ticks * Num) / Den;
    }

    // Number of ticks from zero (useful for integer order price encoding).
    static constexpr std::int64_t encode(double price) noexcept {
        return static_cast<std::int64_t>(std::round(price * Den / Num));
    }
};

// Common tick sizes:
using OneCent   = Tick<1, 100>;     // 0.01 (equities)
using QuarterBp = Tick<25, 1000000>;// 0.000025 (FX)
using ThirtyTwo = Tick<1, 32>;      // 1/32 (Treasuries)

int main() {
    double raw = 100.123456789;
    std::println("equity  (0.01):  {:.5f}", OneCent::round_to(raw));   // 100.12
    std::println("treasury(1/32):  {:.6f}", ThirtyTwo::round_to(raw)); // 100.125
    std::println("equity encoded: {}", OneCent::encode(raw));           // 10012
    static_assert(OneCent::value == 0.01);
}`,
    explanation:
      "Representing tick size as a compile-time rational Tick<Num, Den> encodes the rounding rule exactly: multiply by Den, round to integer, divide by Den — an operation that's identical for every tick size with no special-casing. This is important for matching engines where two prices must be 'equal by tick' rather than floating-point equal, and for encoding order prices as integers for wire protocol transmission.",
  },

  {
    id: "cpp-20260531-b1-cusum",
    language: "cpp",
    title: "CUSUM sequential change-point detector for regime shift",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <optional>
#include <print>

// CUSUM (Cumulative Sum) detects a step change from mu_0 to mu_1 in a
// data stream. The reference value K = (mu_0 + mu_1) / 2 is the slack.
// Signal when the statistic exceeds the decision threshold H.
//
// Upward CUSUM:   S_t = max(0, S_{t-1} + (x_t - mu_0 - K))
// Downward CUSUM: S_t = max(0, S_{t-1} - (x_t - mu_0 + K))
//
// Standard: K = 0.5 * delta / sigma, H = 4 * sigma / delta   (5 sigma shift)

struct CUSUMDetector {
    double mu_0;     // in-control mean
    double K;        // reference (slack) = shift/2 in standardised units
    double H;        // decision threshold
    double S_up   = 0.0;  // upward cumulative sum
    double S_down = 0.0;  // downward cumulative sum

    // Returns index of detected signal, or nullopt if no signal yet.
    std::optional<int> update(double x, int t) noexcept {
        S_up   = std::max(0.0, S_up   + (x - mu_0 - K));
        S_down = std::max(0.0, S_down - (x - mu_0 + K));

        if (S_up > H || S_down > H) {
            S_up = S_down = 0.0;   // reset after signal
            return t;
        }
        return std::nullopt;
    }
};

int main() {
    // Regime: returns ~ N(0, 1), then shift to N(2, 1) at index 50.
    std::vector<double> data;
    for (int i = 0; i < 100; ++i)
        data.push_back((i < 50) ? 0.1 : 2.1);   // simplified deterministic stream

    // K = 1.0 (half the step), H = 4.0 (approx 5-sigma ARL)
    CUSUMDetector det{0.0, 1.0, 4.0};

    for (int t = 0; t < (int)data.size(); ++t) {
        if (auto sig = det.update(data[t], t))
            std::println("regime change detected at index {}", *sig);
    }
}`,
    explanation:
      "CUSUM is the optimal sequential test for detecting a step change in a data stream: it accumulates evidence of deviation from baseline and signals as soon as the accumulated sum crosses a decision boundary H. In quantitative finance it's used to detect regime shifts in vol, spreads, or factor returns — providing an early warning with a controlled average run length (ARL) before a false signal.",
  },

  {
    id: "cpp-20260531-b1-implied-corr",
    language: "cpp",
    title: "Implied correlation from basket vs component implied vols",
    tag: "derivatives",
    code: `#include <cmath>
#include <vector>
#include <numeric>
#include <print>

// A basket option's implied vol reflects the market's view of average
// pairwise correlation among its components. Given basket vol sigma_B
// and component vols sigma_i with equal weights w_i = 1/N:
//
//   sigma_B^2 = sum_i w_i^2 sigma_i^2  +  2 * rho_impl * sum_{i<j} w_i w_j sigma_i sigma_j
//
// Solving for rho_impl yields the single-factor implied correlation.

double implied_correlation(
    double sigma_basket,               // index implied vol
    const std::vector<double>& sigma_i, // single-stock vols
    const std::vector<double>& weights  // portfolio weights
) noexcept {
    int n = static_cast<int>(sigma_i.size());

    // Diagonal variance: sum w_i^2 sigma_i^2
    double diag = 0.0;
    for (int i = 0; i < n; ++i)
        diag += weights[i] * weights[i] * sigma_i[i] * sigma_i[i];

    // Off-diagonal sigma-sigma product: sum_{i<j} w_i w_j sigma_i sigma_j
    double off_diag = 0.0;
    for (int i = 0; i < n; ++i)
        for (int j = i + 1; j < n; ++j)
            off_diag += weights[i] * weights[j] * sigma_i[i] * sigma_i[j];

    if (off_diag < 1e-12) return 0.0;

    double basket_var = sigma_basket * sigma_basket;
    return (basket_var - diag) / (2.0 * off_diag);
}

int main() {
    // SPX basket: simplified 5-stock equal-weight proxy
    std::vector<double> sigma_stocks = {0.30, 0.25, 0.28, 0.22, 0.35};
    std::vector<double> weights(5, 0.20);
    double sigma_index = 0.18;  // index vol lower than components → correlation < 1

    double rho = implied_correlation(sigma_index, sigma_stocks, weights);
    std::println("Implied correlation: {:.4f}", rho);
    // Should be ~0.37 for these inputs
}`,
    explanation:
      "Implied correlation extracts the market's average pairwise stock correlation from index option vol vs single-stock option vols. When index vol is low relative to components, implied correlation is low (diversification is high); correlation spikes during crises as stocks move together. Dispersion traders sell index vol and buy single-stock vol when implied correlation is high relative to its historical average.",
  },

  {
    id: "cpp-20260531-b1-bond-convexity",
    language: "cpp",
    title: "Bond dollar duration (DV01) + dollar convexity — rate sensitivity",
    tag: "fixed-income",
    code: `#include <cmath>
#include <vector>
#include <numeric>
#include <print>

// Duration measures first-order price sensitivity to yield:
//   dP/dy = -Modified_Duration * P
// Convexity measures the curvature (second-order):
//   d^2P/dy^2 = Convexity * P
// Dollar convexity = Convexity * P * (1e-4)^2 = gain per bp^2 move

struct Bond {
    double face;
    double coupon_rate;  // annual
    double yield;        // annually compounded YTM
    int    freq;         // coupons per year
    double T_years;      // total tenor

    // Dirty price via discounted cash flows.
    double price() const noexcept {
        int n = static_cast<int>(T_years * freq);
        double c = coupon_rate * face / freq;
        double y = yield / freq;
        double p = 0.0;
        for (int i = 1; i <= n; ++i)
            p += (i < n ? c : c + face) / std::pow(1.0 + y, i);
        return p;
    }

    // Modified duration (years).
    double modified_duration() const noexcept {
        int n = static_cast<int>(T_years * freq);
        double c = coupon_rate * face / freq;
        double y = yield / freq;
        double p = price(), macaulay = 0.0;
        for (int i = 1; i <= n; ++i) {
            double cf = (i < n) ? c : c + face;
            macaulay += (static_cast<double>(i) / freq) * cf / std::pow(1.0 + y, i);
        }
        return (macaulay / p) / (1.0 + y);
    }

    // Dollar value of 1bp (DV01): |dP/dy| * 0.0001
    double dv01() const noexcept {
        return modified_duration() * price() * 1e-4;
    }

    // Convexity (years^2).
    double convexity() const noexcept {
        int n = static_cast<int>(T_years * freq);
        double c = coupon_rate * face / freq;
        double y = yield / freq;
        double p = price(), conv = 0.0;
        for (int i = 1; i <= n; ++i) {
            double cf  = (i < n) ? c : c + face;
            double ti  = static_cast<double>(i) / freq;
            conv += ti * (ti + 1.0 / freq) * cf / std::pow(1.0 + y, i);
        }
        return conv / (p * (1.0 + y) * (1.0 + y));
    }

    // P&L approximation for a yield move dy (Taylor expansion).
    double pnl_approx(double dy) const noexcept {
        double p = price();
        return -modified_duration() * p * dy + 0.5 * convexity() * p * dy * dy;
    }
};

int main() {
    Bond b{1000.0, 0.04, 0.05, 2, 10.0};  // 4% coupon, 5% YTM, 10Y
    std::println("Price:    {:.4f}", b.price());
    std::println("Dur(mod): {:.4f}", b.modified_duration());
    std::println("DV01:     {:.4f}", b.dv01());
    std::println("Convexity:{:.4f}", b.convexity());
    std::println("P&L(+50bp): {:.4f}", b.pnl_approx(0.005));
}`,
    explanation:
      "Convexity is the second derivative of price with respect to yield: a long bond position has positive convexity (gains more from a 50bp rally than it loses from a 50bp sell-off). Duration-neutral hedges still leave convexity exposure, which is why bond traders track both DV01 and dollar convexity separately — positive convexity is valuable and commands a premium in the option-adjusted spread.",
  },

  {
    id: "cpp-20260531-b1-variance-gamma",
    language: "cpp",
    title: "Variance Gamma model Monte Carlo — infinite-activity Lévy process",
    tag: "derivatives",
    code: `#include <random>
#include <cmath>
#include <print>

// Variance Gamma: subordinate a Brownian motion + drift under a Gamma clock.
// X(t) = theta * G(t) + sigma * W(G(t))
// G(t) ~ Gamma(t/nu, nu)  =>  mean=t, variance=nu*t
//
// Parameters: theta (drift), sigma (vol), nu (variance of Gamma clock)
// nu -> 0 recovers GBM. Large nu -> fatter tails.
// Risk-neutral drift: mu = r - q - ln(1 - theta*nu - 0.5*sigma^2*nu) / nu

double vg_call_mc(double S, double K, double r, double q,
                  double sigma, double theta, double nu,
                  double T, int paths, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> norm;
    std::gamma_distribution<double>  gamma;   // parameterised per step

    // Risk-neutral drift correction to ensure E[S_T] = S * exp((r-q)*T)
    double omega = std::log(1.0 - theta * nu - 0.5 * sigma * sigma * nu) / nu;
    // Divide time into n_steps steps for variance reduction
    int n_steps = 50;
    double dt = T / n_steps;

    double sum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S_t = S;
        for (int i = 0; i < n_steps; ++i) {
            // Sample Gamma increment: shape=dt/nu, scale=nu
            double g = std::gamma_distribution<double>(dt / nu, nu)(rng);
            double z = norm(rng);
            // VG increment
            double dX = theta * g + sigma * std::sqrt(g) * z;
            S_t *= std::exp((r - q + omega) * dt + dX);
        }
        sum += std::max(S_t - K, 0.0);
    }
    return std::exp(-r * T) * sum / paths;
}

int main() {
    // ATM call: VG vs BSM comparison
    // nu=0.2 (moderate jump activity), theta=-0.1 (negative skew)
    double vg  = vg_call_mc(100.0, 100.0, 0.05, 0.0, 0.20, -0.1, 0.2, 1.0, 20'000);
    std::println("VG call (nu=0.2, theta=-0.1): {:.4f}", vg);

    // Recover BSM when nu->0 (small nu, theta=0)
    double gbm = vg_call_mc(100.0, 100.0, 0.05, 0.0, 0.20, 0.0, 0.001, 1.0, 20'000);
    std::println("VG call (nu->0, GBM limit):  {:.4f}", gbm);   // ~10.45
}`,
    explanation:
      "The Variance Gamma model generates excess kurtosis and skewness by randomising the clock of a drifted Brownian motion with a Gamma subordinator — each Gamma increment represents a random time step, so large jumps in G(t) create price jumps without needing a separate Poisson process. The VG has infinitely many small jumps per unit time (infinite activity) and the parameter nu controls tail thickness, making it better than BSM at fitting short-dated implied vol smiles.",
  },

  {
    id: "cpp-20260531-b1-cev-mc",
    language: "cpp",
    title: "CEV (Constant Elasticity of Variance) model Monte Carlo",
    tag: "derivatives",
    code: `#include <random>
#include <cmath>
#include <print>

// CEV model: dS = mu*S*dt + sigma*S^beta*dW
// beta = 1 -> GBM (lognormal), beta = 0.5 -> CIR-like (square-root),
// beta = 0 -> Bachelier (arithmetic Brownian motion).
// CEV generates downward-sloping skew for beta < 1, matching equity smile.

double cev_call_mc(double S0, double K, double r, double q,
                   double sigma, double beta,
                   double T, int paths, int steps = 252,
                   unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> norm;

    double dt    = T / steps;
    double sqdt  = std::sqrt(dt);
    double drift = (r - q) * dt;

    double sum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S = S0;
        bool absorbed = false;
        for (int i = 0; i < steps && !absorbed; ++i) {
            // Euler-Maruyama with absorption at S <= 0 (beta < 1 can hit zero)
            double vol = sigma * std::pow(std::max(S, 1e-8), beta);
            S += drift * S + vol * sqdt * norm(rng);
            if (S <= 0.0) { S = 0.0; absorbed = true; }  // absorbing boundary
        }
        sum += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * sum / paths;
}

int main() {
    // beta=1: should match BSM call ~10.45
    double bsm_equiv = cev_call_mc(100.0, 100.0, 0.05, 0.0, 0.20, 1.0, 1.0, 20'000);
    std::println("beta=1.0 (GBM):   {:.4f}", bsm_equiv);

    // beta=0.5: square-root model, generates negative skew
    double sqrt_model = cev_call_mc(100.0, 100.0, 0.05, 0.0, 0.60, 0.5, 1.0, 20'000);
    std::println("beta=0.5 (sqrt):  {:.4f}", sqrt_model);

    // beta=0.3: even stronger negative skew
    double skew_model = cev_call_mc(100.0, 100.0, 0.05, 0.0, 2.00, 0.3, 1.0, 20'000);
    std::println("beta=0.3 (skew):  {:.4f}", skew_model);
}`,
    explanation:
      "The CEV model produces a volatility smile with negative skew for beta < 1, because the local vol sigma·S^beta is higher for lower stock prices — matching the equity skew where put vol exceeds call vol. The absorption boundary at S = 0 is important when beta < 1 since the process can hit zero in finite time (unlike GBM). In practice, CEV is used as the underlying process in the SABR model (where alpha itself is stochastic).",
  },

  {
    id: "cpp-20260531-b1-lsm-bermudan",
    language: "cpp",
    title: "Longstaff-Schwartz (LSM) Bermudan put — least-squares MC",
    tag: "derivatives",
    code: `#include <random>
#include <cmath>
#include <vector>
#include <numeric>
#include <print>

// LSM: on each exercise date (backwards), regress discounted continuation
// value against basis functions {1, S, S^2}. Exercise if payoff > regression
// estimate of continuation.

static void ols3(const std::vector<double>& y,
                 const std::vector<double>& x,
                 double& a, double& b, double& c) {
    // Solve [1, x, x^2]' * beta = y via normal equations (3x3 system).
    int n = y.size();
    double s1=0,sx=0,sx2=0,sx3=0,sx4=0,sy=0,sxy=0,sx2y=0;
    for (int i = 0; i < n; ++i) {
        double xi = x[i], yi = y[i];
        s1 += 1; sx += xi; sx2 += xi*xi; sx3 += xi*xi*xi; sx4 += xi*xi*xi*xi;
        sy += yi; sxy += xi*yi; sx2y += xi*xi*yi;
    }
    // Simple Gaussian elimination for 3x3
    double A[3][4] = {{(double)n,sx,sx2,sy},{sx,sx2,sx3,sxy},{sx2,sx3,sx4,sx2y}};
    for (int col = 0; col < 3; ++col)
        for (int row = col+1; row < 3; ++row) {
            double f = A[row][col] / A[col][col];
            for (int k = col; k <= 3; ++k) A[row][k] -= f * A[col][k];
        }
    c = A[2][3]/A[2][2];
    b = (A[1][3] - A[1][2]*c) / A[1][1];
    a = (A[0][3] - A[0][1]*b - A[0][2]*c) / A[0][0];
}

double bermudan_put_lsm(double S0, double K, double r, double sigma,
                        double T, int ex_dates, int paths = 10'000,
                        unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> norm;

    double dt = T / ex_dates;
    double df = std::exp(-r * dt);
    double drift = (r - 0.5*sigma*sigma)*dt, sqdt = std::sqrt(dt)*sigma;

    // Simulate all paths to maturity
    std::vector<std::vector<double>> S(paths, std::vector<double>(ex_dates+1));
    for (int p = 0; p < paths; ++p) {
        S[p][0] = S0;
        for (int t = 1; t <= ex_dates; ++t)
            S[p][t] = S[p][t-1] * std::exp(drift + sqdt * norm(rng));
    }

    // Terminal payoff
    std::vector<double> cashflow(paths);
    for (int p = 0; p < paths; ++p)
        cashflow[p] = std::max(K - S[p][ex_dates], 0.0);

    // Backward induction
    for (int t = ex_dates - 1; t >= 1; --t) {
        // Select ITM paths
        std::vector<int> itm;
        for (int p = 0; p < paths; ++p)
            if (K - S[p][t] > 0.0) itm.push_back(p);
        if (itm.empty()) continue;

        std::vector<double> y(itm.size()), x(itm.size());
        for (int i = 0; i < (int)itm.size(); ++i) {
            y[i] = cashflow[itm[i]] * df;   // discounted continuation
            x[i] = S[itm[i]][t];
        }

        double a, b, c;
        ols3(y, x, a, b, c);

        for (int i = 0; i < (int)itm.size(); ++i) {
            int p = itm[i];
            double xi = S[p][t];
            double cont = a + b*xi + c*xi*xi;
            double exercise = K - xi;
            if (exercise >= cont) cashflow[p] = exercise;  // exercise now
            else cashflow[p] = cashflow[p] * df;            // continue
        }
        // Discount non-ITM paths
        for (int p = 0; p < paths; ++p) {
            bool in_itm = false;
            for (int ii : itm) if (ii == p) { in_itm = true; break; }
            if (!in_itm) cashflow[p] *= df;
        }
    }

    double price = 0.0;
    for (auto v : cashflow) price += v;
    return price / paths * df;  // discount back one more step (t=0)
}

int main() {
    double price = bermudan_put_lsm(100.0, 100.0, 0.05, 0.20, 1.0, 12);
    std::println("Bermudan put (12 ex dates): {:.4f}", price);
}`,
    explanation:
      "Longstaff-Schwartz (2001) converts the high-dimensional optimal stopping problem of a Bermudan option into a sequence of regression problems: at each exercise date, regress discounted future cashflows on polynomial basis functions of S to approximate the continuation value. The key insight is that only in-the-money paths matter for the regression, and three basis functions (1, S, S²) capture most of the continuation value structure.",
  },

  {
    id: "cpp-20260531-b1-fx-swap",
    language: "cpp",
    title: "FX swap pricing — near and far legs with swap points",
    tag: "derivatives",
    code: `#include <cmath>
#include <print>

// An FX swap exchanges currency at spot (near leg), then reverses at a
// pre-agreed forward rate (far leg). The forward is not a new negotiation
// — it's the fair no-arbitrage rate from covered interest parity.
//
// Swap points = Far rate - Near rate = S_near * (exp((r_d - r_f) * (T_far - T_near)) - 1)
// In pips: swap_points * pip_factor.  Negative when r_f > r_d (roll cost).

struct FXSwap {
    double spot;           // spot rate (e.g. 1.0800 USD/EUR at T=0)
    double r_dom;          // domestic (USD) continuously compounded rate
    double r_for;          // foreign (EUR) continuously compounded rate
    double T_near;         // near-leg settlement (years, e.g. 2/360 for spot)
    double T_far;          // far-leg settlement (e.g. 91/360 for 3M)
    double notional_for;   // EUR notional
    double basis;          // xccy basis (0 if no basis)

    double near_rate() const noexcept {
        return spot * std::exp((r_dom - r_for + basis) * T_near);
    }

    double far_rate() const noexcept {
        return spot * std::exp((r_dom - r_for + basis) * T_far);
    }

    double swap_points() const noexcept {
        // In big figures (e.g. USD/EUR); multiply by 10000 for pips
        return far_rate() - near_rate();
    }

    // Net USD P&L of swapping: sell USD buy EUR at near, reverse at far.
    // Cash flows (USD per EUR notional):
    //   +near_rate (receive USD, give EUR at near)
    //   -far_rate  (give USD, receive EUR at far)
    // Discounted net = (near_rate * df_dom(T_near) - far_rate * df_dom(T_far)) * notional_for
    double npv_dom() const noexcept {
        double df_near = std::exp(-r_dom * T_near);
        double df_far  = std::exp(-r_dom * T_far);
        return (near_rate() * df_near - far_rate() * df_far) * notional_for;
    }
};

int main() {
    // EUR/USD FX swap: buy spot, sell 3M forward (roll long EUR position)
    FXSwap swap{1.0800, 0.053, 0.035, 2.0/360.0, 91.0/360.0, 1'000'000.0, -0.0015};

    std::println("Near rate:      {:.6f}", swap.near_rate());
    std::println("Far  rate:      {:.6f}", swap.far_rate());
    std::println("Swap points:    {:.6f}  ({:.2f} pips)",
                 swap.swap_points(), swap.swap_points() * 10000.0);
    std::println("NPV (USD):      {:.2f}", swap.npv_dom());
}`,
    explanation:
      "FX swaps are the largest segment of the FX market ($3.8 trillion/day), used by banks and asset managers to roll forward currency hedges. The swap points (forward minus spot) represent the interest rate differential; negative swap points mean you pay to hold the high-yield currency, which is why EM currency managers carefully track the roll cost against expected spot appreciation.",
  },

  {
    id: "cpp-20260531-b1-roll-model",
    language: "cpp",
    title: "Roll (1984) model — implied bid-ask spread from serial covariance",
    tag: "market-data",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <print>

// Roll (1984): if prices bounce between bid and ask symmetrically:
//   P_t = M_t + c * Q_t   (M = mid, Q = +1 buy, -1 sell, c = half-spread)
//   ΔP_t = ΔM_t + c*(Q_t - Q_{t-1})
//
// Since Q_t is i.i.d. +/-1, Cov(ΔP_t, ΔP_{t-1}) = -c^2.
// Implied half-spread: c = sqrt(-cov(ΔP_t, ΔP_{t-1}))
// Full quoted spread: 2c.
//
// Negative covariance is the "bid-ask bounce" signature.

struct RollEstimate {
    double half_spread;    // c = sqrt(-gamma_1) if gamma_1 < 0
    double full_spread;    // 2c
    double gamma_1;        // lag-1 autocovariance of price changes
    bool   valid;          // false if gamma_1 >= 0 (no bounce detected)
};

RollEstimate roll_spread(const std::vector<double>& prices) noexcept {
    int n = prices.size() - 1;
    if (n < 2) return {0,0,0,false};

    std::vector<double> dp(n);
    for (int i = 0; i < n; ++i) dp[i] = prices[i+1] - prices[i];

    double mean_dp = std::accumulate(dp.begin(), dp.end(), 0.0) / n;

    // Lag-1 autocovariance
    double gamma1 = 0.0;
    for (int i = 0; i < n - 1; ++i)
        gamma1 += (dp[i] - mean_dp) * (dp[i+1] - mean_dp);
    gamma1 /= (n - 1);

    if (gamma1 >= 0.0) return {0.0, 0.0, gamma1, false};

    double c = std::sqrt(-gamma1);
    return {c, 2.0 * c, gamma1, true};
}

int main() {
    // Simulated prices with bid-ask bounce (half-spread = 0.05)
    std::vector<double> prices = {
        100.05, 99.95, 100.05, 100.05, 99.95,
        100.05, 99.95, 100.05, 99.95, 100.05
    };

    auto est = roll_spread(prices);
    if (est.valid) {
        std::println("gamma_1:      {:.6f}", est.gamma_1);
        std::println("Half spread:  {:.4f}", est.half_spread);
        std::println("Full spread:  {:.4f}", est.full_spread);  // ~0.10
    } else {
        std::println("No bounce detected (gamma_1 >= 0)");
    }
}`,
    explanation:
      "Roll's model is the simplest microstructure model linking observable price dynamics to latent spread: negative lag-1 autocovariance of trade prices is the statistical fingerprint of bid-ask bounce. It's widely used in transaction cost analysis and empirical microstructure research to estimate effective spreads from trade data without quote data — useful when only last-sale prices are available.",
  },

  {
    id: "cpp-20260531-b1-ranges-pipeline",
    language: "cpp",
    title: "std::ranges pipeline — filter + transform market data events",
    tag: "stl",
    code: `#include <ranges>
#include <vector>
#include <string_view>
#include <print>
#include <algorithm>

// Range adaptors compose lazily: filter + transform + take build a
// single pass over the data with no temporary allocations.

enum class Side : std::uint8_t { Buy, Sell };

struct Tick {
    double price;
    double volume;
    Side   side;
};

int main() {
    std::vector<Tick> ticks = {
        {100.0, 500.0,  Side::Buy},
        {99.5,  1000.0, Side::Sell},
        {100.5, 200.0,  Side::Buy},
        {99.0,  1500.0, Side::Sell},
        {101.0, 800.0,  Side::Buy},
        {99.8,  300.0,  Side::Sell},
    };

    // Pipeline: buy-side only, price > 100, compute dollar notional
    auto buy_notional =
        ticks
        | std::views::filter([](const Tick& t) { return t.side == Side::Buy; })
        | std::views::filter([](const Tick& t) { return t.price > 100.0; })
        | std::views::transform([](const Tick& t) { return t.price * t.volume; });

    double total = 0.0;
    for (double n : buy_notional) {
        std::println("notional: {:.0f}", n);
        total += n;
    }
    std::println("total buy notional (>100): {:.0f}", total);

    // Count sell ticks at prices below 100 (compile-time composable)
    auto cheap_sells = ticks
        | std::views::filter([](const Tick& t) {
              return t.side == Side::Sell && t.price < 100.0; });
    long count = std::ranges::distance(cheap_sells);
    std::println("cheap sells: {}", count);
}`,
    explanation:
      "C++20 range adaptors compose lazily — each `|` operator builds a view object without executing, and iteration through the final pipeline performs a single pass over the data. This replaces hand-written loops with a declarative style while preserving performance: the compiler typically inlines and fuses the predicates into a single loop body, equivalent to the manual version.",
  },

  {
    id: "cpp-20260531-b1-disruptor-ring",
    language: "cpp",
    title: "LMAX Disruptor-style ring buffer with sequence numbers",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <cstdint>
#include <new>
#include <print>
#include <thread>

// LMAX Disruptor pattern: single writer, single reader, no locks.
// Each slot has a sequence number. The writer claims a slot by advancing
// cursor; the reader waits until the slot's sequence equals its expected value.
// Avoids CAS on the hot path — write is purely a store + fence.

template<typename T, std::size_t N>
class Disruptor {
    static_assert((N & (N - 1)) == 0, "N must be power of 2");

    struct alignas(std::hardware_destructive_interference_size) Slot {
        std::atomic<std::int64_t> sequence{-1};  // -1 = empty
        T data;
    };

    std::array<Slot, N> ring_{};
    alignas(std::hardware_destructive_interference_size)
        std::atomic<std::int64_t> write_cursor_{-1};
    alignas(std::hardware_destructive_interference_size)
        std::atomic<std::int64_t> read_cursor_{-1};

public:
    Disruptor() {
        for (std::size_t i = 0; i < N; ++i)
            ring_[i].sequence.store(static_cast<std::int64_t>(i) - 1,
                                    std::memory_order_relaxed);
    }

    // Producer: claim slot, write, publish.
    bool publish(const T& item) noexcept {
        std::int64_t seq = write_cursor_.fetch_add(1, std::memory_order_relaxed) + 1;
        Slot& slot = ring_[seq & (N - 1)];
        // Wait until slot is free (reader has consumed it).
        while (slot.sequence.load(std::memory_order_acquire) != seq - static_cast<std::int64_t>(N))
            std::this_thread::yield();
        slot.data = item;
        slot.sequence.store(seq, std::memory_order_release);  // publish
        return true;
    }

    // Consumer: wait for next item.
    bool consume(T& out) noexcept {
        std::int64_t seq = read_cursor_.fetch_add(1, std::memory_order_relaxed) + 1;
        Slot& slot = ring_[seq & (N - 1)];
        while (slot.sequence.load(std::memory_order_acquire) != seq)
            std::this_thread::yield();
        out = slot.data;
        slot.sequence.store(seq - static_cast<std::int64_t>(N),
                            std::memory_order_release);  // mark as consumed
        return true;
    }
};

int main() {
    Disruptor<double, 1024> ring;
    std::thread producer([&] {
        for (int i = 0; i < 5; ++i) ring.publish(100.0 + i);
    });
    std::thread consumer([&] {
        for (int i = 0; i < 5; ++i) {
            double v; ring.consume(v);
            std::println("consumed: {:.1f}", v);
        }
    });
    producer.join(); consumer.join();
}`,
    explanation:
      "The Disruptor avoids CAS on the publish path by pre-claiming slots with a single atomic increment then writing into the slot and publishing via a store-release. The consumer spins on the slot's sequence number — a sequence-based handoff rather than a pointer exchange — which on modern x86 hardware with store-forwarding is faster than any lock-free queue using CAS, delivering sub-microsecond latency for inter-thread market data delivery.",
  },

  {
    id: "cpp-20260531-b1-power-option",
    language: "cpp",
    title: "Power option closed-form pricing — payoff (S^α - K)+",
    tag: "derivatives",
    code: `#include <cmath>
#include <print>

// Power call: max(S_T^alpha - K, 0).
// S_T^alpha is lognormal with:
//   log(S_T^alpha) ~ N(alpha * log(S0) + alpha*(r-q-sigma^2/2)*T,
//                      alpha^2 * sigma^2 * T)
// Applying the standard BSM-style formula:
//   F_alpha = S0^alpha * exp((alpha*(r-q) + alpha*(alpha-1)*sigma^2/2) * T)
//   d2 = (log(S0^alpha/K) + alpha*(r-q - sigma^2/2)*T) / (alpha*sigma*sqrt(T))
//   d1 = d2 + alpha*sigma*sqrt(T)
//   Price = exp(-r*T) * (F_alpha * N(d1) - K * N(d2))
//
// alpha=1 recovers the standard BSM call.

static double norm_cdf(double x) noexcept {
    return 0.5 * std::erfc(-x * M_SQRT1_2);
}

struct PowerOption {
    double S, K, r, q, sigma, T, alpha;

    double call_price() const noexcept {
        double sqT   = std::sqrt(T);
        // Adjusted forward of S^alpha
        double F_alpha = std::pow(S, alpha)
                       * std::exp((alpha * (r - q)
                                   + alpha * (alpha - 1.0) * 0.5 * sigma * sigma) * T);
        double d2 = (std::log(std::pow(S, alpha) / K)
                     + alpha * (r - q - 0.5 * sigma * sigma) * T)
                    / (alpha * sigma * sqT);
        double d1 = d2 + alpha * sigma * sqT;
        return std::exp(-r * T) * (F_alpha * norm_cdf(d1) - K * norm_cdf(d2));
    }

    // Put-call parity: C - P = exp(-r*T)*(F_alpha - K)
    double put_price() const noexcept {
        double F_alpha = std::pow(S, alpha)
                       * std::exp((alpha*(r-q) + alpha*(alpha-1)*0.5*sigma*sigma)*T);
        return call_price() - std::exp(-r*T) * (F_alpha - K);
    }
};

int main() {
    // Standard call (alpha=1) should match BSM: ~10.45
    PowerOption c1{100.0, 100.0, 0.05, 0.0, 0.20, 1.0, 1.0};
    std::println("alpha=1 call (BSM check): {:.4f}", c1.call_price());

    // Squared payoff: (S^2 - K)+, K = 10000
    PowerOption c2{100.0, 10'000.0, 0.05, 0.0, 0.20, 1.0, 2.0};
    std::println("alpha=2 call:             {:.4f}", c2.call_price());

    // Square-root payoff: (sqrt(S) - K)+
    PowerOption c3{100.0, 10.0, 0.05, 0.0, 0.20, 1.0, 0.5};
    std::println("alpha=0.5 call:           {:.4f}", c3.call_price());
}`,
    explanation:
      "Power options appear in structured products and as building blocks for variance and volatility derivatives: the payoff S^alpha for alpha=2 is proportional to variance (since log S_T ≈ dS/S and S_T² ≈ e^{2σW}). The key insight is that S^alpha is itself lognormal with rescaled parameters, so the standard BSM formula applies with no approximation — just adjusted d1, d2, and forward price.",
  },

  {
    id: "cpp-20260531-b1-quanto",
    language: "cpp",
    title: "Quanto call option — foreign asset, domestic currency payoff",
    tag: "derivatives",
    code: `#include <cmath>
#include <print>

// Quanto option: pays max(S^f_T - K, 0) in domestic currency (fixed FX rate).
// The foreign asset drifts at r_d (not r_f) under domestic risk-neutral measure,
// minus the quanto adjustment rho * sigma_f * sigma_FX (correlation between
// asset and FX rate).
//
// Under Q_d (domestic risk-neutral):
//   dS^f / S^f = (r_d - q_f - rho*sigma_f*sigma_FX) dt + sigma_f dW^{Q_d}
//
// Price = N_d * exp(-r_d*T) * (F_quanto * N(d1) - K * N(d2))
// where F_quanto = S^f_0 * exp((r_d - q_f - rho*sigma_f*sigma_FX) * T)

static double norm_cdf(double x) noexcept {
    return 0.5 * std::erfc(-x * M_SQRT1_2);
}

struct QuantoCall {
    double S_f;       // foreign asset price (in foreign currency)
    double K;         // strike (in foreign currency)
    double r_d;       // domestic risk-free rate
    double r_f;       // foreign risk-free rate (unused in quanto, but informational)
    double q_f;       // foreign dividend yield
    double sigma_f;   // foreign asset vol
    double sigma_fx;  // FX vol (domestic per foreign)
    double rho;       // correlation: asset returns vs FX returns
    double T;         // time to expiry
    double notional_d;// domestic notional (fixed FX multiplier)

    double price() const noexcept {
        double quanto_adj = rho * sigma_f * sigma_fx;
        double F_q = S_f * std::exp((r_d - q_f - quanto_adj) * T);

        double sqT = std::sqrt(T);
        double d1  = (std::log(S_f / K) + (r_d - q_f - quanto_adj + 0.5*sigma_f*sigma_f)*T)
                     / (sigma_f * sqT);
        double d2  = d1 - sigma_f * sqT;

        return notional_d * std::exp(-r_d * T) * (F_q * norm_cdf(d1) - K * norm_cdf(d2));
    }

    // Quanto adjustment: lower forward when rho > 0 (asset falls when FX falls)
    double quanto_adjustment() const noexcept {
        return -rho * sigma_f * sigma_fx * T;   // log-forward reduction
    }
};

int main() {
    // Nikkei quanto call: Japanese stock, USD payoff
    // rho > 0: JPY weakens when Nikkei falls -> quanto adjustment reduces forward
    QuantoCall qc{28'000.0, 28'000.0, 0.053, 0.001, 0.02, 0.18, 0.08, 0.60, 1.0, 1.0};
    std::println("Quanto call:        {:.2f}", qc.price());
    std::println("Quanto adj (log):   {:.4f}", qc.quanto_adjustment());

    // Compare: zero correlation (no quanto effect)
    QuantoCall qc0 = qc; qc0.rho = 0.0;
    std::println("No-quanto baseline: {:.2f}", qc0.price());
}`,
    explanation:
      "The quanto adjustment (-ρ·σ_f·σ_FX per year) shifts the risk-neutral drift of the foreign asset: when the asset and FX rate are positively correlated (common for Nikkei/JPY — both fall in risk-off), locking in the FX rate in a quanto structure means the USD investor is implicitly short the FX-asset correlation, so the fair forward is lower. This makes quanto products cheaper than plain foreign equity options when correlation is positive.",
  },

  {
    id: "cpp-20260531-b1-vasicek-zcb",
    language: "cpp",
    title: "Vasicek model — analytical zero-coupon bond price formula",
    tag: "fixed-income",
    code: `#include <cmath>
#include <print>

// Vasicek short-rate: dr = kappa*(theta - r)*dt + sigma*dW
// Analytical ZCB price P(t,T) = A(t,T) * exp(-B(t,T) * r_t)
// where:
//   B(tau) = (1 - exp(-kappa*tau)) / kappa
//   ln A(tau) = (theta - sigma^2/(2*kappa^2)) * (B - tau)
//               - sigma^2 * B^2 / (4*kappa)
// tau = T - t

struct VasicekModel {
    double kappa;   // mean reversion speed
    double theta;   // long-run mean
    double sigma;   // vol of short rate
    double r0;      // current short rate

    // Zero-coupon bond price P(0,T)
    double zcb(double T) const noexcept {
        double B   = (1.0 - std::exp(-kappa * T)) / kappa;
        double lnA = (theta - sigma*sigma / (2.0*kappa*kappa)) * (B - T)
                     - sigma*sigma * B*B / (4.0*kappa);
        return std::exp(lnA - B * r0);
    }

    // Zero-coupon yield: y(T) = -ln P(0,T) / T
    double yield(double T) const noexcept {
        return -std::log(zcb(T)) / T;
    }

    // Forward rate: f(T) = -d/dT ln P(0,T)
    double forward_rate(double T) const noexcept {
        double B = (1.0 - std::exp(-kappa * T)) / kappa;
        double dB_dT = std::exp(-kappa * T);   // dB/dT = exp(-kappa*T)
        // dlnP/dT = d(lnA)/dT - r0 * dB/dT
        double dlnA_dT = (theta - sigma*sigma/(2.0*kappa*kappa)) * (dB_dT - 1.0)
                         - sigma*sigma * B * dB_dT / (2.0*kappa);
        return -(dlnA_dT - r0 * dB_dT);
    }

    // Yield convexity: var of r_T under Q
    double rate_variance(double T) const noexcept {
        return sigma*sigma * (1.0 - std::exp(-2.0*kappa*T)) / (2.0*kappa);
    }
};

int main() {
    VasicekModel v{0.30, 0.05, 0.015, 0.03};  // kappa=0.3, theta=5%, sigma=1.5%, r0=3%

    std::println("Vasicek yield curve:");
    for (double T : {0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0}) {
        std::println("  T={:5.2f}Y: ZCB={:.6f}  yield={:.4f}%  fwd={:.4f}%",
                     T, v.zcb(T), v.yield(T)*100, v.forward_rate(T)*100);
    }
}`,
    explanation:
      "The Vasicek model has a closed-form ZCB price because the short rate is Gaussian (affine in r_0): bond prices are log-linear in the current rate r_0, giving tractable duration and convexity formulas. The key parameter kappa (mean reversion speed) controls the slope of the yield curve — a faster kappa flattens the long end as it pulls rates toward theta regardless of r_0. The formula also shows that Vasicek allows negative rates (no positivity constraint), which is both a feature and a drawback.",
  },

  {
    id: "cpp-20260531-b1-ois-compound",
    language: "cpp",
    title: "OIS overnight compounding — SOFR/ESTR accrual factor",
    tag: "fixed-income",
    code: `#include <vector>
#include <cmath>
#include <cstdint>
#include <print>

// OIS (Overnight Index Swap) floating rate accrues by daily compounding
// of the overnight rate (SOFR in USD, ESTR in EUR, SONIA in GBP).
//
// Compounded accrual factor over [T_start, T_end]:
//   AF = product_i (1 + r_i * d_i / year_basis)
// where r_i = overnight rate on day i, d_i = day count (1 or 3 for Mon).
// OIS fixed vs float: swap rate that equates AF to fixed coupon PV.

struct OvernightRate {
    double rate;     // daily rate (e.g. 0.053 = 5.3%)
    int    days;     // day count (1 for Tue-Fri, 3 for Mon/holiday)
};

double ois_accrual_factor(const std::vector<OvernightRate>& rates,
                           int year_basis = 360) noexcept {
    double af = 1.0;
    for (const auto& r : rates)
        af *= (1.0 + r.rate * r.days / year_basis);
    return af;
}

double ois_compounded_rate(const std::vector<OvernightRate>& rates,
                            int year_basis = 360) noexcept {
    double af = ois_accrual_factor(rates, year_basis);
    // Total calendar days
    int total_days = 0;
    for (const auto& r : rates) total_days += r.days;
    // Annualised compounded rate
    return (af - 1.0) * year_basis / total_days;
}

// Par OIS swap rate: solve for fixed rate s such that
//   s * sum(alpha_i * DF_i) = (AF - 1) * DF_T
// where alpha_i = day fraction of each coupon period.
// Simplified: for a 1-period OIS, par_rate = (AF - 1) / alpha.
double ois_par_rate(const std::vector<OvernightRate>& daily_rates,
                    double discount_factor, int year_basis = 360) noexcept {
    int total_days = 0;
    for (const auto& r : daily_rates) total_days += r.days;
    double alpha = static_cast<double>(total_days) / year_basis;
    double af    = ois_accrual_factor(daily_rates, year_basis);
    return (af - 1.0) / (alpha * discount_factor);
}

int main() {
    // 5 business days of SOFR rates (USD, ACT/360): Mon (3 days) + Tue-Fri
    std::vector<OvernightRate> week = {
        {0.0530, 3},  // Monday: covers Fri-Mon
        {0.0531, 1}, {0.0529, 1}, {0.0530, 1}, {0.0528, 1},
    };

    double af   = ois_accrual_factor(week);
    double rate = ois_compounded_rate(week);
    std::println("Accrual factor:    {:.8f}", af);
    std::println("Compounded rate:   {:.6f}%", rate * 100.0);

    // Par OIS swap rate (1-week; DF ≈ 1 for very short tenor)
    double par = ois_par_rate(week, 0.999);
    std::println("Par OIS rate:      {:.6f}%", par * 100.0);
}`,
    explanation:
      "OIS accrual compounds daily overnight rates multiplicatively — not additively — which is why a week of 5.3% SOFR produces a slightly higher rate than 5.3% simple interest. This distinction becomes significant for long-dated OIS swaps: the compounding effect adds several basis points over a year. The SOFR reform from LIBOR requires all banks to replace forward-looking LIBOR fixings with this backward-looking compounded SOFR calculation.",
  },

  {
    id: "cpp-20260531-b1-welford",
    language: "cpp",
    title: "Welford's online mean/variance — numerically stable rolling stats",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <print>

// Welford (1962) one-pass algorithm maintains mean and M2 (sum of squared
// deviations) without accumulating a large intermediate sum (which loses
// precision for large datasets with small variance).
// Variance = M2 / (n-1)  (Bessel-corrected sample variance).

class WelfordStats {
    std::size_t n_ = 0;
    double mean_ = 0.0;
    double M2_   = 0.0;   // sum of squared deviations from current mean
public:
    void push(double x) noexcept {
        ++n_;
        double delta  = x - mean_;
        mean_ += delta / n_;              // incremental mean update
        double delta2 = x - mean_;
        M2_   += delta * delta2;          // compensated sum of squares
    }

    std::size_t count()    const noexcept { return n_; }
    double      mean()     const noexcept { return mean_; }
    double      variance() const noexcept { return (n_ > 1) ? M2_ / (n_ - 1) : 0.0; }
    double      stddev()   const noexcept { return std::sqrt(variance()); }

    // Annualised vol from daily returns
    double annualised_vol(int trading_days = 252) const noexcept {
        return stddev() * std::sqrt(static_cast<double>(trading_days));
    }
};

// Rolling window via subtract-and-add (requires storing window values).
class RollingWelford {
    std::vector<double> buf_;
    std::size_t window_;
    WelfordStats stats_;
    std::size_t head_ = 0;
public:
    explicit RollingWelford(std::size_t window)
        : buf_(window, 0.0), window_(window) {}

    void push(double x) {
        if (stats_.count() >= window_) {
            // Remove oldest value — re-initialise stats (simple O(w) approach)
            stats_ = WelfordStats{};
            buf_[head_] = x;
            head_ = (head_ + 1) % window_;
            for (auto v : buf_) stats_.push(v);
        } else {
            buf_[head_] = x;
            head_ = (head_ + 1) % window_;
            stats_.push(x);
        }
    }

    double vol() const noexcept { return stats_.annualised_vol(); }
};

int main() {
    WelfordStats ws;
    for (double ret : {0.01, -0.005, 0.008, -0.012, 0.003, 0.015, -0.007})
        ws.push(ret);

    std::println("mean:          {:.6f}", ws.mean());
    std::println("daily stddev:  {:.6f}", ws.stddev());
    std::println("annualised vol:{:.4f}", ws.annualised_vol());
}`,
    explanation:
      "Welford's algorithm avoids catastrophic cancellation that afflicts the two-pass formula when the mean is large relative to the variance — a common scenario for asset returns near zero. The M2 accumulation via delta * delta2 (before and after the mean update) maintains precision to machine epsilon regardless of data scale, making it the standard approach for any production variance tracker.",
  },

  {
    id: "cpp-20260531-b1-ewma-update",
    language: "cpp",
    title: "EWMA covariance matrix one-step update — streaming risk",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <print>

// EWMA covariance: Sigma_t = lambda * Sigma_{t-1} + (1-lambda) * r_t * r_t'
// RiskMetrics uses lambda = 0.94 (daily).  lambda controls the effective window:
//   effective_N = 1 / (1 - lambda)  (= 16.7 days for lambda=0.94).
// Updating an N x N matrix costs O(N^2) per step.

class EWMACov {
    int N_;
    double lambda_;
    std::vector<double> Sigma_;   // row-major N x N

    inline double& at(int i, int j) { return Sigma_[i * N_ + j]; }
    inline double  at(int i, int j) const { return Sigma_[i * N_ + j]; }
public:
    explicit EWMACov(int N, double lambda = 0.94, double init_vol = 0.01)
        : N_(N), lambda_(lambda), Sigma_(N * N, 0.0) {
        for (int i = 0; i < N_; ++i)
            at(i, i) = init_vol * init_vol;   // diagonal init
    }

    // Update with a new return vector r (length N).
    void update(const std::vector<double>& r) noexcept {
        double lam1 = 1.0 - lambda_;
        for (int i = 0; i < N_; ++i)
            for (int j = 0; j <= i; ++j) {   // lower triangle + diagonal
                at(i, j) = lambda_ * at(i, j) + lam1 * r[i] * r[j];
                at(j, i) = at(i, j);           // symmetric
            }
    }

    // Portfolio variance: w' Sigma w
    double port_variance(const std::vector<double>& w) const noexcept {
        double var = 0.0;
        for (int i = 0; i < N_; ++i)
            for (int j = 0; j < N_; ++j)
                var += w[i] * at(i, j) * w[j];
        return var;
    }

    double port_vol(const std::vector<double>& w) const noexcept {
        return std::sqrt(port_variance(w));
    }

    double corr(int i, int j) const noexcept {
        return at(i, j) / std::sqrt(at(i, i) * at(j, j));
    }
};

int main() {
    EWMACov cov(3, 0.94, 0.015);
    // Simulate 5 daily returns for 3-asset portfolio
    std::vector<std::vector<double>> returns = {
        { 0.01, -0.005,  0.008},
        {-0.005, 0.012, -0.003},
        { 0.008, 0.003,  0.015},
        {-0.012,-0.008, -0.010},
        { 0.005, 0.009,  0.002},
    };
    for (auto& r : returns) cov.update(r);

    std::vector<double> weights = {0.4, 0.3, 0.3};
    std::println("Portfolio daily vol: {:.4f}%", cov.port_vol(weights) * 100.0);
    std::println("Corr(0,1): {:.4f}", cov.corr(0, 1));
    std::println("Corr(0,2): {:.4f}", cov.corr(0, 2));
}`,
    explanation:
      "EWMA covariance (RiskMetrics 1994) applies an exponential decay weight to historical returns, giving more importance to recent observations. The one-step update is O(N²) — identical to the Kalman filter covariance prediction step — and requires no matrix inversions, making it suitable for real-time risk calculations on large portfolios. The effective sample size 1/(1-λ) makes the sensitivity to lambda transparent: lambda=0.94 corresponds to roughly a 17-day half-life.",
  },
];
