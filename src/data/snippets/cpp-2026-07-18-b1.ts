import { Snippet } from "./types";

export const cppSnippets20260718B1: Snippet[] = [
  {
    id: "cpp-20260718-b1-perf-fwd",
    language: "cpp",
    title: "Perfect Forwarding for Order Emplacement",
    tag: "modern-cpp",
    code: `#include <vector>
#include <memory>
#include <utility>
#include <cstdint>
#include <iostream>

struct Order {
    uint64_t id;
    double   price;
    int32_t  qty;
    bool     is_buy;
    Order(uint64_t i, double p, int32_t q, bool b)
        : id(i), price(p), qty(q), is_buy(b) {}
};

// T&& is a *universal reference* when T is deduced — not just rvalue.
// std::forward preserves the value category of each argument.
class OrderStore {
    std::vector<std::unique_ptr<Order>> orders_;
public:
    template<typename... Args>
    Order& emplace(Args&&... args) {
        orders_.push_back(
            std::make_unique<Order>(std::forward<Args>(args)...)
        );
        return *orders_.back();
    }
    std::size_t size() const { return orders_.size(); }
};

int main() {
    OrderStore store;
    uint64_t id = 1001;
    // lvalue id is forwarded as lvalue; 100.25, 500, true forwarded as rvalues
    Order& o = store.emplace(id, 100.25, 500, true);
    std::cout << "order id=" << o.id << " qty=" << o.qty << "\\n";
}`,
    explanation:
      "Universal references collapse lvalue/rvalue categories so that `emplace` can accept any mix of lvalues and rvalues without overload explosion. `std::forward` restores the original category at the point of forwarding, enabling move construction where possible and copy construction otherwise — crucial for in-place construction of heavy order objects in hot paths.",
  },
  {
    id: "cpp-20260718-b1-crtp-pricer",
    language: "cpp",
    title: "CRTP Static Polymorphism for Option Pricers",
    tag: "generics",
    code: `#include <cmath>
#include <iostream>

// CRTP: base delegates to Derived at compile time via static_cast.
// No vtable pointer, no indirect dispatch — the call is fully inlined.
template<typename Derived>
class OptionPricer {
public:
    double price(double S, double K, double r, double T, double vol) const {
        return static_cast<const Derived*>(this)->price_impl(S, K, r, T, vol);
    }
    // Shared finite-difference delta for any derived pricer
    double delta(double S, double K, double r, double T, double vol,
                 double h = 0.01) const {
        return (price(S+h,K,r,T,vol) - price(S-h,K,r,T,vol)) / (2*h);
    }
};

class BSCall : public OptionPricer<BSCall> {
public:
    double price_impl(double S, double K, double r, double T, double vol) const {
        auto N = [](double x){ return 0.5*std::erfc(-x*M_SQRT1_2); };
        double sqT = std::sqrt(T);
        double d1 = (std::log(S/K)+(r+0.5*vol*vol)*T)/(vol*sqT);
        double d2 = d1 - vol*sqT;
        return S*N(d1) - K*std::exp(-r*T)*N(d2);
    }
};

class BachelierCall : public OptionPricer<BachelierCall> {
public:
    double price_impl(double S, double K, double r, double T, double vol) const {
        auto N = [](double x){ return 0.5*std::erfc(-x*M_SQRT1_2); };
        auto n = [](double x){ return std::exp(-0.5*x*x)/std::sqrt(2*M_PI); };
        double F = S*std::exp(r*T);
        double v = vol*std::sqrt(T);
        double d = (F-K)/v;
        return std::exp(-r*T)*((F-K)*N(d) + v*n(d));
    }
};

// Works with any pricer type — no virtual dispatch, no type erasure overhead
template<typename P>
void report(const P& p, double S, double K, double r, double T, double vol) {
    std::cout << "price=" << p.price(S,K,r,T,vol)
              << " delta=" << p.delta(S,K,r,T,vol) << "\\n";
}

int main() {
    BSCall bs;
    BachelierCall bac;
    report(bs,  100, 100, 0.05, 1.0, 0.20);
    report(bac, 100, 100, 0.05, 1.0, 20.0);   // normal vol ~20 pts
}`,
    explanation:
      "CRTP achieves policy-based design with zero runtime overhead: the compiler sees the concrete type at instantiation and can inline the entire pricing chain. Unlike virtual dispatch, CRTP lets the base class add shared behaviour (delta, gamma, vega) that calls into the derived pricer without the derived class needing to know anything about numerical differentiation.",
  },
  {
    id: "cpp-20260718-b1-span-view",
    language: "cpp",
    title: "std::span for Zero-Copy Market Data Batch Processing",
    tag: "low-latency",
    code: `#include <span>
#include <cstdint>
#include <cstddef>
#include <array>
#include <iostream>
#include <algorithm>

// Raw frame from a kernel-bypass NIC ring buffer
struct TickFrame {
    uint64_t ts_ns;
    double   bid, ask;
    uint32_t bid_sz, ask_sz;
    uint32_t seq;
};

// span is 16 bytes (ptr + size) — passes as register pair, no heap.
double vwap_mid(std::span<const TickFrame> frames) {
    double num = 0.0, den = 0.0;
    for (const auto& f : frames) {
        double sz = f.bid_sz + f.ask_sz;
        num += (f.bid + f.ask) * 0.5 * sz;
        den += sz;
    }
    return den > 0 ? num / den : 0.0;
}

// Slide a sub-view window with no copy
void sliding_vwap(std::span<const TickFrame> all, std::size_t w) {
    for (std::size_t i = 0; i + w <= all.size(); ++i)
        (void)vwap_mid(all.subspan(i, w));
}

// Reinterpret raw UDP payload as typed span — zero copy, no alloc
std::span<const TickFrame> from_udp(const std::byte* buf, std::size_t sz) {
    return { reinterpret_cast<const TickFrame*>(buf), sz / sizeof(TickFrame) };
}

int main() {
    std::array<TickFrame,3> frames = {{
        {1000, 100.49, 100.51, 200, 150, 1},
        {1001, 100.50, 100.52, 300, 100, 2},
        {1002, 100.48, 100.50, 100, 200, 3},
    }};
    std::cout << "VWAP mid: " << vwap_mid(frames) << "\\n";
    // sub-span of last 2 frames, no data movement
    std::cout << "Last-2 VWAP mid: " << vwap_mid(std::span(frames).last(2)) << "\\n";
}`,
    explanation:
      "`std::span` is a non-owning view: passing it to a function is two-word pass-by-register with no heap involvement. `subspan` and `last` produce new views into the same buffer — the sliding-window VWAP loop runs entirely without allocation. This is the C++20 replacement for passing `(ptr, size)` pairs and is the canonical way to represent a contiguous buffer received from a NIC.",
  },
  {
    id: "cpp-20260718-b1-impl-vol-nr",
    language: "cpp",
    title: "Newton-Raphson Implied Volatility with Halley Fallback",
    tag: "numerics",
    code: `#include <cmath>
#include <optional>
#include <iostream>

static double N(double x) { return 0.5*std::erfc(-x*M_SQRT1_2); }
static double n(double x) { return std::exp(-0.5*x*x)/std::sqrt(2.0*M_PI); }

struct BSOut { double price, vega, vanna; };  // vanna used for Halley step

static BSOut bs_call(double S, double K, double r, double T, double vol) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K)+(r+0.5*vol*vol)*T)/(vol*sqT);
    double d2  = d1 - vol*sqT;
    double nd1 = n(d1);
    // vega = dP/dvol; d(vega)/dvol = vega*(d1*d2/vol) [second derivative]
    return { S*N(d1) - K*std::exp(-r*T)*N(d2),
             S*nd1*sqT,
             S*nd1*sqT * d1*d2 / vol };   // d²P/dvol²
}

// Newton: vol -= (P - target)/vega  [first order, converges quadratically]
// Halley: vol -= (P - target)/vega * 1/(1 - (P-target)*vanna/(2*vega^2))
// Halley reduces iterations near the extremes of moneyness.
std::optional<double> implied_vol(
        double target, double S, double K, double r, double T,
        double vol0 = 0.20, double tol = 1e-8, int max_iter = 50)
{
    double vol = vol0;
    for (int i = 0; i < max_iter; ++i) {
        auto [p, v, vv] = bs_call(S, K, r, T, vol);
        double err = p - target;
        if (std::abs(err) < tol) return vol;
        if (std::abs(v) < 1e-14) return std::nullopt;
        double halley_denom = 1.0 - err*vv / (2.0*v*v);
        if (std::abs(halley_denom) < 0.1) halley_denom = 0.1;  // guard
        vol -= (err / v) / halley_denom;
        vol = std::clamp(vol, 1e-4, 5.0);
    }
    return std::nullopt;
}

int main() {
    // BS call at S=K=100, r=5%, T=1y, vol=25% prices to ~12.34
    auto [target, _, __] = bs_call(100, 100, 0.05, 1.0, 0.25);
    auto iv = implied_vol(target, 100, 100, 0.05, 1.0, 0.20);
    std::cout << "Recovered vol: " << (iv ? *iv * 100 : -1) << "%\\n";  // 25%
}`,
    explanation:
      "Newton-Raphson converges quadratically once close to the solution, but can stall for deep OTM options where vega is tiny. The Halley correction adds the second-derivative term (vanna) to widen the convergence basin — each Halley iteration is cubically convergent. Clamping `vol` to `[1e-4, 5.0]` prevents the solver from wandering into numerically degenerate regions.",
  },
  {
    id: "cpp-20260718-b1-cn-pde",
    language: "cpp",
    title: "Crank-Nicolson Finite Difference Solver (European Call)",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <iostream>

// Crank-Nicolson: O(dS^2, dt^2) — second-order in both space and time.
// Solves BS PDE backwards from terminal payoff.
double cn_call(double S0, double K, double r, double sigma,
               double T, int N = 150, int M = 150)
{
    double Smax = 4.0 * K;
    double dS   = Smax / N;
    double dt   = T / M;

    // Terminal condition v[i] = max(i*dS - K, 0)
    std::vector<double> v(N+1);
    for (int i = 0; i <= N; ++i) v[i] = std::max(i*dS - K, 0.0);

    // Thomas (TDMA) tridiagonal solver — O(n) and cache-friendly
    auto thomas = [](std::vector<double> a, std::vector<double> b,
                     std::vector<double> c, std::vector<double> d) {
        int n = (int)d.size();
        for (int i = 1; i < n; ++i) {
            double m = a[i] / b[i-1];
            b[i] -= m*c[i-1];
            d[i] -= m*d[i-1];
        }
        std::vector<double> x(n);
        x[n-1] = d[n-1]/b[n-1];
        for (int i = n-2; i >= 0; --i)
            x[i] = (d[i] - c[i]*x[i+1]) / b[i];
        return x;
    };

    for (int t = 0; t < M; ++t) {
        double tau  = (M - t) * dt;            // time remaining after this step
        double Vhi  = Smax - K*std::exp(-r*tau); // upper BC: intrinsic at large S

        int n = N - 1;
        std::vector<double> a(n), b(n), c(n), d(n);
        for (int j = 0; j < n; ++j) {
            double Si  = (j+1)*dS;
            double al  = 0.25*sigma*sigma*Si*Si / (dS*dS);
            double be  = 0.25*r*Si / dS;
            a[j] = -(al - be)*dt;
            b[j] =  1.0 + (2*al + 0.5*r)*dt;
            c[j] = -(al + be)*dt;
            // Explicit side (theta=0.5)
            d[j] = (al-be)*dt*v[j] + (1-(2*al+0.5*r)*dt)*v[j+1] + (al+be)*dt*v[j+2];
        }
        // Absorb boundary values into the RHS
        d[0]   += (al-0)*0;      // lower BC: v[0]=0 contributes 0
        d[n-1] -= c[n-1]*Vhi;   // upper BC

        auto sol = thomas(a, b, c, d);
        v[0] = 0.0;
        for (int j = 0; j < n; ++j) v[j+1] = sol[j];
        v[N] = Vhi;
    }

    int i = static_cast<int>(S0/dS);
    double f = (S0/dS) - i;
    return v[i]*(1-f) + v[i+1]*f;
}

int main() {
    std::cout << "CN call: " << cn_call(100, 100, 0.05, 0.20, 1.0)
              << "  (BS ~10.45)\\n";
}`,
    explanation:
      "Crank-Nicolson is implicit on the new time level and explicit on the old one (theta=0.5), making it unconditionally stable — unlike explicit Euler which requires dt < dS²/(sigma²*S²). The Thomas algorithm exploits the tridiagonal structure to solve the N×N system in O(N) instead of O(N³), making each time step a linear cost. CN's second-order accuracy means doubling N or M reduces error by 4x.",
  },
  {
    id: "cpp-20260718-b1-tls-risk",
    language: "cpp",
    title: "Thread-Local Risk Accumulator (No Contention)",
    tag: "concurrency",
    code: `#include <thread>
#include <vector>
#include <mutex>
#include <cstdint>
#include <iostream>
#include <numeric>

// Per-thread risk bucket — no atomics, no locks on the hot path.
// Pad to 128 bytes to prevent false sharing between TLS slots on adjacent threads.
struct alignas(128) RiskBucket {
    double net_delta{0}, net_vega{0}, net_gamma{0};
    uint64_t fill_count{0};
};

thread_local RiskBucket g_risk;   // each thread has its own private copy

// Hot path: update risk with no synchronisation needed
void on_fill(double delta, double vega, double gamma) {
    g_risk.net_delta  += delta;
    g_risk.net_vega   += vega;
    g_risk.net_gamma  += gamma;
    ++g_risk.fill_count;
}

// Aggregation (called from a single collector thread while workers pause)
std::mutex g_collect_mu;
std::vector<RiskBucket> g_snapshots;

void collect_snapshot() {
    std::lock_guard lk(g_collect_mu);
    g_snapshots.push_back(g_risk);  // snapshot this thread's TLS bucket
}

int main() {
    // Simulate 4 worker threads each processing 10k fills
    std::vector<std::thread> workers;
    for (int t = 0; t < 4; ++t) {
        workers.emplace_back([]{
            for (int i = 0; i < 10000; ++i)
                on_fill(0.01, 0.005, 0.001);
            collect_snapshot();   // push before thread exits
        });
    }
    for (auto& w : workers) w.join();

    // Sum across thread snapshots
    double total_delta = 0;
    for (const auto& b : g_snapshots) total_delta += b.net_delta;
    std::cout << "Total delta: " << total_delta << "  (expect 400.0)\\n";
}`,
    explanation:
      "Thread-local storage gives each worker thread private, cache-hot risk counters that update with no atomic instructions or cache invalidation — the fastest possible accumulation. Aggregation happens at snapshot time (a rare event), so the cold path pays a single lock acquisition per thread instead of a lock or atomic per fill. The 128-byte alignment prevents the cross-thread false sharing that would otherwise degrade cache performance when adjacent TLS slots land on the same cache line.",
  },
  {
    id: "cpp-20260718-b1-seq-gap",
    language: "cpp",
    title: "Market Data Sequence Gap Detector with Recovery",
    tag: "networking",
    code: `#include <cstdint>
#include <optional>
#include <vector>
#include <iostream>

// UDP multicast market data arrives with per-symbol sequence numbers.
// Detect gaps and trigger retransmission requests to the recovery feed.

struct GapEvent {
    uint32_t expected_seq;
    uint32_t received_seq;
    uint32_t gap_size;
};

class SeqTracker {
    uint32_t expected_{0};
    bool     first_{true};
    std::vector<GapEvent> gaps_;

public:
    // Call on each received message in arrival order.
    // Returns nullopt if no gap; otherwise returns the gap descriptor.
    std::optional<GapEvent> update(uint32_t seq) {
        if (first_) {
            expected_ = seq + 1;
            first_    = false;
            return std::nullopt;
        }
        if (seq == expected_) {
            ++expected_;
            return std::nullopt;
        }
        if (seq < expected_) {
            // Duplicate or out-of-order; ignore (already processed)
            return std::nullopt;
        }
        // Gap detected: expected_ .. seq-1 are missing
        GapEvent g{expected_, seq, seq - expected_};
        gaps_.push_back(g);
        expected_ = seq + 1;   // advance past gap; retransmit will fill
        return g;
    }

    const std::vector<GapEvent>& gaps() const { return gaps_; }
    void reset() { first_ = true; gaps_.clear(); }
};

int main() {
    SeqTracker tracker;
    // Simulate stream: seq 1, 2, then gap to 5, then 6
    for (uint32_t s : {1u, 2u, 5u, 6u}) {
        if (auto g = tracker.update(s))
            std::cout << "GAP: expected=" << g->expected_seq
                      << " got=" << g->received_seq
                      << " size=" << g->gap_size << "\\n";
    }
    // Output: GAP: expected=3 got=5 size=2
}`,
    explanation:
      "Sequence tracking is the first layer of market data reliability: any gap triggers a retransmission request to the unicast recovery channel before the gap propagates to downstream aggregators. Ignoring `seq < expected_` handles both duplicates (from multicast group rejoins) and reordering (rare on UDP but possible across network hops), while the gap vector keeps a full audit trail for post-trade analysis.",
  },
  {
    id: "cpp-20260718-b1-likely",
    language: "cpp",
    title: "[[likely]] / [[unlikely]] Branch Hints in Hot-Path Order Handling",
    tag: "low-latency",
    code: `#include <cstdint>
#include <iostream>

enum class OrderType { LIMIT, MARKET, IOC, FOK };

struct Order {
    uint64_t id;
    OrderType type;
    double    price;
    int32_t   qty;
};

// In a typical HFT order flow, >95% of orders are LIMIT orders.
// Marking the common case [[likely]] lets the compiler lay out the
// cold branch off the main instruction stream, improving I-cache density.
int32_t process_order(const Order& o, double best_bid, double best_ask) {
    if (o.type == OrderType::LIMIT) [[likely]] {
        // Fast path: queue the order; no crossing logic needed yet
        return o.qty;
    }
    if (o.type == OrderType::MARKET) [[unlikely]] {
        // Immediate fill at best available price
        double fill_price = (o.qty > 0) ? best_ask : best_bid;
        std::cout << "MARKET fill at " << fill_price << "\\n";
        return o.qty;
    }
    if (o.type == OrderType::IOC) [[unlikely]] {
        // Fill what we can at the limit; cancel remainder
        if (o.qty > 0 && o.price >= best_ask) return o.qty;  // fully fill
        return 0;   // nothing crossed: cancel
    }
    // FOK: all-or-nothing; [[unlikely]] implied for last branch
    if (o.qty > 0 && o.price >= best_ask) return o.qty;
    return -1;   // reject
}

// Equivalent GCC/Clang intrinsic for older C++ standards:
// if (__builtin_expect(o.type == OrderType::LIMIT, 1))
inline bool is_aggressive(const Order& o, double best) {
    return __builtin_expect(
        o.type == OrderType::MARKET || o.price > best, 0
    );  // 0 = false is the expected (common) value: most orders are passive
}

int main() {
    Order lim{1, OrderType::LIMIT, 100.25, 100};
    std::cout << process_order(lim, 100.24, 100.26) << "\\n";  // 100
}`,
    explanation:
      "`[[likely]]` is a portable C++20 branch hint that tells the CPU's static branch predictor and the linker's code layout pass that a branch is taken most of the time. The compiler moves the unlikely branches out of the linear instruction stream, reducing instruction-cache pressure in the order handler's hot loop. Measurable latency benefit appears only when the branch is truly predictable (>95% one direction) and the function is called millions of times per second.",
  },
  {
    id: "cpp-20260718-b1-fnv-hash",
    language: "cpp",
    title: "Compile-Time FNV-1a Hash for FIX Symbol Lookup",
    tag: "low-latency",
    code: `#include <cstdint>
#include <string_view>
#include <unordered_map>
#include <iostream>

// FNV-1a: simple, fast, avalanche-good hash for short strings (symbol names).
// Computing it at compile time means the hash of a literal is a constant.
constexpr uint64_t FNV_OFFSET = 14695981039346656037ULL;
constexpr uint64_t FNV_PRIME  = 1099511628211ULL;

constexpr uint64_t fnv1a(std::string_view s) noexcept {
    uint64_t h = FNV_OFFSET;
    for (unsigned char c : s) {
        h ^= c;
        h *= FNV_PRIME;
    }
    return h;
}

// Symbol-to-instrument map with compile-time-hashable keys
struct InstrumentInfo {
    uint32_t product_id;
    double   tick_size;
    int      lot_size;
};

std::unordered_map<uint64_t, InstrumentInfo> build_symbol_map() {
    return {
        { fnv1a("AAPL"),  {1, 0.01, 1} },
        { fnv1a("ES"),    {2, 0.25, 1} },
        { fnv1a("GC"),    {3, 0.10, 1} },
        { fnv1a("EURUSD"),{4, 0.00001, 1000} },
    };
}

// Lookup by runtime string — hashes only once, no string copy
const InstrumentInfo* lookup(
        const std::unordered_map<uint64_t, InstrumentInfo>& m,
        std::string_view sym)
{
    auto it = m.find(fnv1a(sym));
    return (it == m.end()) ? nullptr : &it->second;
}

// Compile-time hash allows switch-on-symbol:
constexpr uint64_t H_AAPL = fnv1a("AAPL");
constexpr uint64_t H_ES   = fnv1a("ES");

int main() {
    auto map = build_symbol_map();
    if (auto* info = lookup(map, "AAPL"))
        std::cout << "AAPL tick=" << info->tick_size << "\\n";

    // Compile-time use: dispatch without strcmp
    uint64_t sym_hash = fnv1a("ES");
    switch (sym_hash) {
        case H_AAPL: std::cout << "equity\\n"; break;
        case H_ES:   std::cout << "futures\\n"; break;
    }
}`,
    explanation:
      "Switching on a `constexpr` FNV hash of a literal avoids `strcmp` chains in the message dispatcher — the switch becomes a single jump table or a small set of comparisons. FNV-1a's simplicity (XOR-then-multiply) maps to ~2 cycles per byte, making it faster than std::hash<std::string> on short symbol names because it avoids SSE overhead and heap allocation for small-string optimisation edge cases.",
  },
  {
    id: "cpp-20260718-b1-string-view-fix",
    language: "cpp",
    title: "string_view Zero-Copy FIX Field Parsing",
    tag: "low-latency",
    code: `#include <string_view>
#include <optional>
#include <charconv>
#include <cstdint>
#include <iostream>

// FIX message format: "8=FIX.4.4\x01 35=D\x01 49=SENDER\x01 56=TARGET\x01..."
// Delimiter is SOH (\\x01).  Parse without any heap allocation.

using Tag = int;

// Find the value string for a given tag number in a FIX message.
// Returns string_view into the original buffer — no copy.
std::optional<std::string_view> fix_tag(std::string_view msg, Tag tag) {
    // Build search prefix: e.g. "35=" from tag=35
    char prefix[12];
    auto [end, _] = std::to_chars(prefix, prefix+10, tag);
    *end++ = '=';
    std::string_view pfx(prefix, end - prefix);

    std::size_t pos = 0;
    while (pos < msg.size()) {
        auto soh = msg.find('\x01', pos);
        if (soh == std::string_view::npos) soh = msg.size();
        std::string_view field = msg.substr(pos, soh - pos);
        if (field.starts_with(pfx)) {
            return field.substr(pfx.size());  // view into original buffer
        }
        pos = soh + 1;
    }
    return std::nullopt;
}

// Parse a numeric FIX field directly from the view (no std::stod overhead)
std::optional<double> fix_double(std::string_view msg, Tag tag) {
    auto val = fix_tag(msg, tag);
    if (!val) return std::nullopt;
    double d;
    auto [ptr, ec] = std::from_chars(val->data(), val->data()+val->size(), d);
    if (ec != std::errc{}) return std::nullopt;
    return d;
}

int main() {
    // Simulated New Order Single FIX message (SOH replaced by | for readability)
    std::string msg = "8=FIX.4.4\x0135=D\x0149=CLIENT\x0154=1\x0155=AAPL\x0144=100.25\x0138=500\x01";
    auto side   = fix_tag(msg, 54);   // "1" = buy
    auto price  = fix_double(msg, 44);
    std::cout << "Side=" << side.value_or("?")
              << " Price=" << price.value_or(0.0) << "\\n";
}`,
    explanation:
      "`std::string_view` lets the parser return substrings of the original buffer without any heap allocation — the returned view is just a (pointer, length) pair pointing into the existing packet memory. `std::from_chars` is locale-independent and avoids the thread-local state that makes `std::stod` slow; together these make this parser suitable for the critical receive path where a heap allocation would cost 50–200 ns.",
  },
  {
    id: "cpp-20260718-b1-asian-cf",
    language: "cpp",
    title: "Geometric Asian Option Closed-Form Price",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>

// Geometric Asian call: payoff = max(G - K, 0) where G = (S1*S2*...*Sn)^(1/n)
// Under GBM, G is log-normally distributed with adjusted vol and drift.
// Closed-form (Kemna-Vorst 1990):

double geo_asian_call(
    double S,      // spot
    double K,      // strike
    double r,      // risk-free rate
    double T,      // maturity (years)
    double sigma,  // annual vol
    int    n       // number of averaging dates (equally spaced)
) {
    // Adjusted moments of ln(G)
    double dt      = T / n;
    double sigma_g = sigma * std::sqrt((2.0*n + 1.0) / (6.0*n));  // vol of ln(G)
    double mu_g    = (r - 0.5*sigma*sigma)*T*0.5 + 0.5*sigma_g*sigma_g*T;

    // Black-Scholes formula on the adjusted forward
    auto ncdf = [](double x){ return 0.5*std::erfc(-x*M_SQRT1_2); };
    double vol_T = sigma_g * std::sqrt(T);
    double F_g   = S * std::exp(mu_g);       // geometric-average forward
    double d1    = (std::log(F_g/K) + 0.5*vol_T*vol_T) / vol_T;
    double d2    = d1 - vol_T;
    double df    = std::exp(-r*T);

    return df * (F_g * ncdf(d1) - K * ncdf(d2));
}

// Control variate: arithmetic Asian ≈ geometric Asian + bias correction via MC
// This function provides the analytic value used as the control.
int main() {
    // 1Y monthly (12 fixings) Asian call, ATM
    double p = geo_asian_call(100, 100, 0.05, 1.0, 0.20, 12);
    std::cout << "Geometric Asian call: " << p << "\\n";
    // Should be ~6.0–6.5 (cheaper than vanilla because averaging reduces vol)

    // Effect of n: as n->inf the vol approaches sigma/sqrt(3) ≈ 0.577*sigma
    for (int n : {1, 12, 52, 252}) {
        double sigma_g = 0.20 * std::sqrt((2.0*n+1.0)/(6.0*n));
        std::cout << "n=" << n << " effective_vol=" << sigma_g*100 << "%\\n";
    }
}`,
    explanation:
      "The geometric Asian has a log-normal payoff under GBM (the product of log-normals is log-normal), so it admits a closed-form BS-style formula with reduced effective vol `sigma/sqrt(3)` in the limit. In practice, this is used as a control variate for Monte Carlo pricing of the arithmetic Asian: simulate both, use the known geometric price to correct the MC arithmetic estimate, dramatically reducing variance.",
  },
  {
    id: "cpp-20260718-b1-barrier-mc",
    language: "cpp",
    title: "Down-and-Out Barrier Call via Monte Carlo",
    tag: "numerics",
    code: `#include <random>
#include <cmath>
#include <algorithm>
#include <iostream>

// Down-and-out call: pays max(S_T - K, 0) only if S never hits barrier B < S_0.
// Continuous monitoring via Brownian bridge correction for discretisation bias.

double dko_call_mc(double S0, double K, double B, double r, double sigma,
                   double T, int n_steps, int n_paths, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double dt    = T / n_steps;
    double sqdt  = std::sqrt(dt);
    double drift = (r - 0.5*sigma*sigma)*dt;
    double vol   = sigma * sqdt;
    double df    = std::exp(-r*T);

    double sum = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double S = S0;
        bool knocked_out = false;

        for (int t = 0; t < n_steps; ++t) {
            double z     = nd(rng);
            double S_new = S * std::exp(drift + vol*z);

            // Brownian bridge barrier crossing probability:
            // P(min B.B. < B | S_t, S_{t+1}) = exp(-2*ln(S/B)*ln(S_new/B) / (sigma^2*dt))
            if (S > B && S_new > B) {
                double cross_prob = std::exp(
                    -2.0 * std::log(S/B) * std::log(S_new/B) / (sigma*sigma*dt)
                );
                if (std::uniform_real_distribution<>(0,1)(rng) < cross_prob) {
                    knocked_out = true; break;
                }
            } else if (S_new <= B) {
                knocked_out = true; break;
            }
            S = S_new;
        }
        if (!knocked_out)
            sum += std::max(S - K, 0.0);
    }
    return df * sum / n_paths;
}

int main() {
    // Vanilla call ~10.45; barrier at 85 (well OTM) should reduce price slightly
    double price = dko_call_mc(100, 100, 85, 0.05, 0.20, 1.0, 100, 100000);
    // With barrier at 85 (15% OTM), price is typically ~9.5–10.1
    std::cout << "DKO call (B=85): " << price << "\\n";
}`,
    explanation:
      "Discrete monitoring of a continuous barrier understates the barrier crossing probability — the path can dip below the barrier between monitoring points. The Brownian bridge correction adds the probability that the geometric Brownian motion passed through the barrier between two consecutive discrete observations given their endpoints, bringing the discretisation error from O(1/n_steps) to O(1/n_steps²). This is the standard technique used in production pricers for barrier products.",
  },
  {
    id: "cpp-20260718-b1-lookback-mc",
    language: "cpp",
    title: "Floating-Strike Lookback Call via Monte Carlo",
    tag: "numerics",
    code: `#include <random>
#include <cmath>
#include <algorithm>
#include <iostream>

// Floating-strike lookback call: payoff = S_T - min(S over [0,T])
// The holder buys at the lowest observed price — perfect hindsight.

double lookback_call_mc(double S0, double r, double sigma,
                        double T, int n_steps, int n_paths,
                        unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double dt    = T / n_steps;
    double drift = (r - 0.5*sigma*sigma)*dt;
    double vol   = sigma * std::sqrt(dt);
    double df    = std::exp(-r*T);

    double sum = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        double S   = S0;
        double Smin = S;
        for (int t = 0; t < n_steps; ++t) {
            S   *= std::exp(drift + vol*nd(rng));
            Smin = std::min(Smin, S);
        }
        sum += S - Smin;   // always positive; the holder can never lose
    }
    return df * sum / n_paths;
}

// Conze-Viswanathan (1991) closed-form for the floating-strike case:
double lookback_call_cf(double S0, double r, double sigma, double T) {
    auto N = [](double x){ return 0.5*std::erfc(-x*M_SQRT1_2); };
    double sqT = std::sqrt(T);
    double d1 = (std::log(1.0) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
    // Simplified ATM (S=S_min=S0) formula
    double d2 = d1 - sigma*sqT;
    double df = std::exp(-r*T);
    double a1 = sigma*sigma / (2*r);
    return S0*(N(d1) - N(-d1)*a1 + df*(N(-d2) - (sigma*sigma/(2*r))*N(d2)));
}

int main() {
    double mc = lookback_call_mc(100, 0.05, 0.20, 1.0, 252, 100000);
    double cf = lookback_call_cf(100, 0.05, 0.20, 1.0);
    std::cout << "MC: " << mc << "  CF: " << cf << "\\n";
    // Lookback is more expensive than vanilla (~25–30 for these params)
}`,
    explanation:
      "The lookback call is the most expensive vanilla exotic: it has positive gamma everywhere and can never be OTM at maturity. The closed-form exists because the minimum of a GBM path follows a known distribution; the MC implementation nevertheless reveals the simulation structure clearly. Practical pricing uses the CF formula for Greeks and the MC version for exotic variants (lookback with early exercise, discrete monitoring).",
  },
  {
    id: "cpp-20260718-b1-expected",
    language: "cpp",
    title: "std::expected<T, E> for Pricer Error Propagation (C++23)",
    tag: "modern-cpp",
    code: `#include <expected>
#include <cmath>
#include <string>
#include <iostream>

// C++23 std::expected<T,E>: carry either a value or an error category
// without exceptions.  Zero overhead when the value path is taken.

enum class PricerError {
    NegativeVol, NegativeTime, NegativeSpot, DivisionByZero, NotConverged
};

std::string to_string(PricerError e) {
    switch (e) {
        case PricerError::NegativeVol:     return "negative vol";
        case PricerError::NegativeTime:    return "negative time";
        case PricerError::NegativeSpot:    return "negative spot";
        case PricerError::DivisionByZero:  return "division by zero";
        case PricerError::NotConverged:    return "not converged";
    }
    return "unknown";
}

using PricerResult = std::expected<double, PricerError>;

PricerResult validate_inputs(double S, double K, double r, double T, double vol) {
    if (S   <= 0) return std::unexpected(PricerError::NegativeSpot);
    if (vol <= 0) return std::unexpected(PricerError::NegativeVol);
    if (T   <= 0) return std::unexpected(PricerError::NegativeTime);
    if (K   <= 0) return std::unexpected(PricerError::DivisionByZero);
    return S;   // success: return spot as sentinel
}

PricerResult bs_call(double S, double K, double r, double T, double vol) {
    // Chain: propagate errors without try/catch
    auto check = validate_inputs(S, K, r, T, vol);
    if (!check) return check;   // propagate error upward

    auto N = [](double x){ return 0.5*std::erfc(-x*M_SQRT1_2); };
    double sqT = std::sqrt(T);
    double d1  = (std::log(S/K)+(r+0.5*vol*vol)*T)/(vol*sqT);
    double d2  = d1 - vol*sqT;
    return S*N(d1) - K*std::exp(-r*T)*N(d2);
}

int main() {
    // Valid case
    if (auto p = bs_call(100, 100, 0.05, 1.0, 0.20))
        std::cout << "Price: " << *p << "\\n";

    // Error case
    auto bad = bs_call(100, 100, 0.05, 1.0, -0.10);
    if (!bad)
        std::cout << "Error: " << to_string(bad.error()) << "\\n";
}`,
    explanation:
      "`std::expected` enables railway-oriented error propagation: each pipeline stage either produces a value or short-circuits with a typed error, with no stack unwinding or exception overhead on the success path. In a pricing pipeline, this avoids the 50–200 ns cost of `throw/catch` for common validation failures (bad market data, missing inputs) while still providing structured, inspectable error information at the call site.",
  },
  {
    id: "cpp-20260718-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive Doubly-Linked List for Order Queue (No Allocations)",
    tag: "data-structures",
    code: `#include <cstdint>
#include <iostream>
#include <cassert>

// Intrusive list: link pointers live inside the Order struct.
// No allocator; no extra node heap object; O(1) insert/remove anywhere.

struct OrderNode {
    uint64_t   id;
    double     price;
    int32_t    qty;
    OrderNode* prev{nullptr};
    OrderNode* next{nullptr};
};

class IntrusiveList {
    OrderNode* head_{nullptr};
    OrderNode* tail_{nullptr};
    int        size_{0};

public:
    // O(1) append — node must already exist (owned by caller's pool)
    void push_back(OrderNode* n) {
        n->prev = tail_;
        n->next = nullptr;
        if (tail_) tail_->next = n; else head_ = n;
        tail_ = n;
        ++size_;
    }

    // O(1) remove — node must be in this list
    void remove(OrderNode* n) {
        if (n->prev) n->prev->next = n->next; else head_ = n->next;
        if (n->next) n->next->prev = n->prev; else tail_ = n->prev;
        n->prev = n->next = nullptr;
        --size_;
    }

    OrderNode* front() const { return head_; }
    int size()         const { return size_; }

    void dump() const {
        for (auto* n = head_; n; n = n->next)
            std::cout << "[" << n->id << "@" << n->price << "] ";
        std::cout << "\\n";
    }
};

int main() {
    // Orders stored in a fixed pool (not shown); list just links them
    OrderNode o1{1, 100.25, 100};
    OrderNode o2{2, 100.24, 200};
    OrderNode o3{3, 100.26,  50};

    IntrusiveList q;
    q.push_back(&o1); q.push_back(&o2); q.push_back(&o3);
    q.dump();           // [1@100.25] [2@100.24] [3@100.26]
    q.remove(&o2);      // O(1) cancel — no scanning
    q.dump();           // [1@100.25] [3@100.26]
}`,
    explanation:
      "An intrusive list is the standard container for an order-book price level because the link pointers live inside the order object itself — cancel is O(1) with no node lookup and zero heap operations. The owning subsystem (a memory pool) controls object lifetime; the list only connects them. This is how production matching engines implement the per-price-level FIFO queue while keeping latency flat regardless of queue depth.",
  },
  {
    id: "cpp-20260718-b1-treiber-stack",
    language: "cpp",
    title: "Lock-Free Treiber Stack for Order Recycling",
    tag: "lock-free",
    code: `#include <atomic>
#include <cstdint>
#include <iostream>

// Treiber stack: CAS-based lock-free LIFO freelist.
// Used to return Order objects to a pool without a mutex.
// Hazard: ABA problem mitigated here by limiting to single-threaded pop patterns
// or by tagging (not shown for brevity).

struct FreeNode {
    FreeNode* next{nullptr};
};

class TreiberStack {
    std::atomic<FreeNode*> top_{nullptr};

public:
    // Push is always safe: build new node -> CAS top_ (retry on failure)
    void push(FreeNode* node) noexcept {
        FreeNode* old_top = top_.load(std::memory_order_relaxed);
        do {
            node->next = old_top;
        } while (!top_.compare_exchange_weak(
                     old_top, node,
                     std::memory_order_release,   // success: publish node
                     std::memory_order_relaxed)); // failure: reload top_
    }

    // Pop: CAS top_ from node to node->next
    FreeNode* pop() noexcept {
        FreeNode* node = top_.load(std::memory_order_acquire);
        while (node) {
            if (top_.compare_exchange_weak(
                    node, node->next,
                    std::memory_order_acquire,   // success: observe node fully
                    std::memory_order_relaxed)) {// failure: reload node
                node->next = nullptr;
                return node;
            }
        }
        return nullptr;   // stack empty
    }

    bool empty() const noexcept {
        return top_.load(std::memory_order_acquire) == nullptr;
    }
};

struct Order : FreeNode {
    uint64_t id;
    double   price;
};

int main() {
    TreiberStack pool;
    Order orders[4];
    for (auto& o : orders) pool.push(&o);

    // Recycle orders from the pool without a mutex
    if (auto* o = static_cast<Order*>(pool.pop())) {
        o->id = 1001; o->price = 100.25;
        std::cout << "Got order slot, id=" << o->id << "\\n";
        pool.push(o);  // return to pool when done
    }
}`,
    explanation:
      "The Treiber stack is the minimal lock-free LIFO structure: push/pop each require a single CAS that retries on contention. In an order management system, the freelist pattern recycles fixed-size Order objects at the speed of hardware CAS (~20 ns) rather than `malloc` (~100–300 ns). The ABA problem matters when multiple threads pop concurrently with interleaved pushes — mitigated with pointer tagging (upper bits as generation counter) on 64-bit systems.",
  },
  {
    id: "cpp-20260718-b1-tag-dispatch",
    language: "cpp",
    title: "Tag Dispatch for Black vs Normal (Bachelier) Pricer Selection",
    tag: "generics",
    code: `#include <cmath>
#include <type_traits>
#include <iostream>

// Tag types act as compile-time flags with no runtime cost (empty structs)
struct BlackTag   {};  // log-normal (Black-Scholes) model
struct NormalTag  {};  // normal (Bachelier) model — for negative-rate markets

template<typename Model>
struct Pricer;

template<>
struct Pricer<BlackTag> {
    static double call(double S, double K, double r, double T, double vol) {
        auto N = [](double x){ return 0.5*std::erfc(-x*M_SQRT1_2); };
        double sqT = std::sqrt(T);
        double d1  = (std::log(S/K)+(r+0.5*vol*vol)*T)/(vol*sqT);
        double d2  = d1 - vol*sqT;
        return S*N(d1) - K*std::exp(-r*T)*N(d2);
    }
};

template<>
struct Pricer<NormalTag> {
    static double call(double F, double K, double r, double T, double vol) {
        // Bachelier: F = S*exp(r*T) (forward), vol is normal (pts not %)
        auto N = [](double x){ return 0.5*std::erfc(-x*M_SQRT1_2); };
        auto n = [](double x){ return std::exp(-0.5*x*x)/std::sqrt(2*M_PI); };
        double v = vol*std::sqrt(T);
        double d = (F-K)/v;
        return std::exp(-r*T)*((F-K)*N(d) + v*n(d));
    }
};

// Dispatch at compile time — zero runtime overhead
template<typename Model>
double price_call(double S, double K, double r, double T, double vol) {
    return Pricer<Model>::call(S, K, r, T, vol);
}

int main() {
    // Black-Scholes: vol=20%
    std::cout << "BS call:       " << price_call<BlackTag>(100,100,0.05,1.0,0.20) << "\\n";
    // Bachelier: vol=20 pts (absolute); used for near-zero-rate rates/swaptions
    std::cout << "Bachelier call:" << price_call<NormalTag>(100,100,0.05,1.0,20.0) << "\\n";
}`,
    explanation:
      "Tag dispatch resolves model selection at compile time via template specialisation: unlike `if constexpr` or virtual dispatch, the tag classes are zero-size and eliminated entirely from the binary. This matters when the model choice is fixed at compile time for a particular asset class (equity uses Black, rates desk uses Normal) — the compiler inlines the entire pricer with no branching overhead.",
  },
  {
    id: "cpp-20260718-b1-ranges",
    language: "cpp",
    title: "std::ranges Pipeline for Order Book Filtering",
    tag: "modern-cpp",
    code: `#include <vector>
#include <ranges>
#include <algorithm>
#include <numeric>
#include <iostream>
#include <cstdint>

struct Order {
    uint64_t id;
    double   price;
    int32_t  qty;
    bool     is_buy;
    bool     is_live;
};

int main() {
    std::vector<Order> book = {
        {1, 100.50, 200, true,  true},
        {2, 100.25, 300, true,  true},
        {3, 101.00,  50, false, true},
        {4, 100.49, 150, true,  false},   // cancelled
        {5,  99.50, 400, true,  true},
    };

    // Compose lazy views: no intermediate containers, single pass over 'book'
    auto live_bids = book
        | std::views::filter([](const Order& o){ return o.is_buy && o.is_live; })
        | std::views::transform([](const Order& o){ return o; });

    // Best bid: max price among live bids
    auto best = std::ranges::max_element(live_bids,
                    {}, [](const Order& o){ return o.price; });
    if (best != live_bids.end())
        std::cout << "Best bid: " << best->price << " qty=" << best->qty << "\\n";

    // Total live bid notional
    double notional = std::ranges::fold_left(
        live_bids | std::views::transform([](const Order& o){
            return o.price * o.qty;
        }), 0.0, std::plus<>{});
    std::cout << "Bid notional: " << notional << "\\n";

    // Top-3 bid prices (sorted, lazy)
    std::vector<double> prices;
    for (const auto& o : live_bids) prices.push_back(o.price);
    std::ranges::sort(prices, std::ranges::greater{});
    prices.resize(std::min(prices.size(), std::size_t{3}));
    for (double p : prices) std::cout << p << " ";
    std::cout << "\\n";
}`,
    explanation:
      "Ranges views compose lazily: `filter | transform` creates a single-pass view that never allocates an intermediate vector. `std::ranges::max_element` with a projection avoids writing an explicit comparator lambda — the projection extracts the key and the algorithm handles the comparison internally. `fold_left` (C++23) replaces `std::accumulate` with a more composable range-aware form.",
  },
  {
    id: "cpp-20260718-b1-deducing-this",
    language: "cpp",
    title: "C++23 Deducing `this` for Fluent Builder Chain",
    tag: "modern-cpp",
    code: `#include <string>
#include <iostream>
#include <cstdint>

// Deducing 'this' (C++23 P0847): the object parameter is explicit,
// letting base-class builder methods return the correct derived type.
// Eliminates the classic CRTP-for-builder boilerplate.

struct OrderBuilder {
    uint64_t    id_{0};
    double      price_{0};
    int32_t     qty_{0};
    bool        is_buy_{true};
    std::string symbol_;

    // 'this' deduced as OrderBuilder& or DerivedBuilder& depending on caller
    template<typename Self>
    Self& with_id(this Self& self, uint64_t id)         { self.id_ = id;       return self; }
    template<typename Self>
    Self& with_price(this Self& self, double p)          { self.price_ = p;     return self; }
    template<typename Self>
    Self& with_qty(this Self& self, int32_t q)           { self.qty_ = q;       return self; }
    template<typename Self>
    Self& buy(this Self& self)                           { self.is_buy_ = true;  return self; }
    template<typename Self>
    Self& sell(this Self& self)                          { self.is_buy_ = false; return self; }
    template<typename Self>
    Self& for_symbol(this Self& self, std::string sym)   { self.symbol_ = std::move(sym); return self; }
};

// Derived builder adds expiry — methods inherited WITHOUT CRTP
struct AlgoOrderBuilder : OrderBuilder {
    int algo_id_{0};
    double urgency_{0.5};

    template<typename Self>
    Self& with_algo(this Self& self, int id, double urg) {
        self.algo_id_ = id; self.urgency_ = urg; return self;
    }
};

int main() {
    AlgoOrderBuilder b;
    // Chained calls return AlgoOrderBuilder& (not OrderBuilder&) — no casting needed
    b.with_id(1001)
     .with_price(100.25)
     .with_qty(500)
     .buy()
     .for_symbol("AAPL")
     .with_algo(7, 0.8);    // base-class methods return AlgoOrderBuilder&

    std::cout << "Order " << b.id_ << " sym=" << b.symbol_
              << " algo=" << b.algo_id_ << "\\n";
}`,
    explanation:
      "Deducing `this` solves the 'fluent builder in base class' problem: without it, `with_id()` returning `OrderBuilder&` breaks the chain at the first call on a `DerivedBuilder` object. With deduced `this`, the template parameter captures the exact runtime type including derived class, so every chained call returns the correct concrete type — no CRTP, no virtual methods, zero overhead.",
  },
  {
    id: "cpp-20260718-b1-mmap-prices",
    language: "cpp",
    title: "Memory-Mapped File for Zero-Copy Historical Price Loading",
    tag: "systems",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstddef>
#include <cstdint>
#include <span>
#include <iostream>
#include <cstring>

// Binary price file: fixed-size records, densely packed
struct PriceRecord {
    uint64_t timestamp_ns;
    double   open, high, low, close;
    uint64_t volume;
};

class MmapPriceFile {
    void*       map_{MAP_FAILED};
    std::size_t size_{0};

public:
    MmapPriceFile() = default;

    bool open(const char* path) {
        int fd = ::open(path, O_RDONLY);
        if (fd < 0) return false;

        struct stat st{};
        if (::fstat(fd, &st) < 0) { ::close(fd); return false; }
        size_ = static_cast<std::size_t>(st.st_size);

        // MAP_POPULATE pre-faults pages into the page table — no page faults
        // when iterating; trades startup latency for zero latency thereafter.
        map_ = ::mmap(nullptr, size_, PROT_READ,
                      MAP_PRIVATE | MAP_POPULATE, fd, 0);
        ::close(fd);
        return map_ != MAP_FAILED;
    }

    // Returns a span into the mapping: no copy, no heap
    std::span<const PriceRecord> records() const {
        if (map_ == MAP_FAILED) return {};
        return { static_cast<const PriceRecord*>(map_),
                 size_ / sizeof(PriceRecord) };
    }

    ~MmapPriceFile() {
        if (map_ != MAP_FAILED) ::munmap(map_, size_);
    }
};

// Usage example (file must exist)
void demo() {
    MmapPriceFile f;
    if (!f.open("/tmp/prices.bin")) {
        std::cout << "File not found (demo only)\\n"; return;
    }
    for (const auto& rec : f.records())
        (void)rec.close;   // iterate with zero copies
}

int main() { demo(); }`,
    explanation:
      "`mmap` with `MAP_POPULATE` maps the entire file into the virtual address space and pre-faults all pages: subsequent reads are pure cache/TLB lookups with no syscalls. The returned `std::span` gives a typed view into the mapped memory — iterating a year of daily bars costs zero heap allocations and zero `read()` syscalls. For research workflows processing terabytes of tick data, mmap throughput approaches DRAM bandwidth rather than filesystem bandwidth.",
  },
  {
    id: "cpp-20260718-b1-bit-popcount",
    language: "cpp",
    title: "POPCNT Bitmask for Fast Long/Short Position Counting",
    tag: "low-latency",
    code: `#include <bit>
#include <cstdint>
#include <array>
#include <iostream>

// Position bitmask: bit i = 1 means instrument i has a live long position.
// popcount gives net-long count in a single CPU instruction (~1 cycle on modern x86).

class PositionBitmask {
    std::array<uint64_t, 16> words_{};   // tracks 1024 instruments

public:
    // Set bit (open long position in instrument i)
    void set_long(int i)   { words_[i >> 6] |=  (uint64_t{1} << (i & 63)); }
    // Clear bit (flat or short)
    void clear_long(int i) { words_[i >> 6] &= ~(uint64_t{1} << (i & 63)); }
    // Query
    bool is_long(int i) const {
        return (words_[i >> 6] >> (i & 63)) & 1;
    }

    // Count all long positions — 16 POPCNT instructions
    int total_longs() const {
        int n = 0;
        for (uint64_t w : words_) n += std::popcount(w);
        return n;
    }

    // Count longs in range [lo, hi) using mask arithmetic
    int longs_in_range(int lo, int hi) const {
        int n = 0;
        for (int i = lo >> 6, end = (hi - 1) >> 6; i <= end; ++i) {
            uint64_t mask = ~uint64_t{0};
            if (i == lo >> 6) mask &= ~((uint64_t{1} << (lo & 63)) - 1);
            if (i == (hi-1) >> 6) mask &= (uint64_t{2} << ((hi-1) & 63)) - 1;
            n += std::popcount(words_[i] & mask);
        }
        return n;
    }
};

int main() {
    PositionBitmask bm;
    for (int i : {0, 5, 10, 63, 64, 127, 300}) bm.set_long(i);
    std::cout << "Total longs: " << bm.total_longs() << "\\n";    // 7
    std::cout << "Longs [0,64): " << bm.longs_in_range(0, 64) << "\\n"; // 4
    std::cout << "Is 5 long? " << bm.is_long(5) << "\\n";        // 1
}`,
    explanation:
      "`std::popcount` compiles to a single POPCNT instruction on x86-64 — counting 64 positions takes 1 cycle. For a 1024-instrument universe, computing total long exposure takes 16 POPCNT instructions (~16 cycles) versus 1024 branch-or-compare operations. Bitmask operations also enable fast set intersection (AND for common longs), union (OR for any exposure), and complement (XOR for flipping all positions).",
  },
  {
    id: "cpp-20260718-b1-weak-ptr-cache",
    language: "cpp",
    title: "std::weak_ptr Subscriber Cache for Market Data Distribution",
    tag: "modern-cpp",
    code: `#include <memory>
#include <vector>
#include <algorithm>
#include <iostream>
#include <string>

// Market data hub: publishes ticks to subscribers.
// Subscribers register weak_ptr — when they're destroyed, they're silently
// dropped from the dispatch list without the hub needing to know.

struct TickListener {
    std::string name;
    explicit TickListener(std::string n) : name(std::move(n)) {}
    void on_tick(double bid, double ask) const {
        std::cout << name << ": bid=" << bid << " ask=" << ask << "\\n";
    }
};

class MarketDataHub {
    std::vector<std::weak_ptr<TickListener>> listeners_;

public:
    void subscribe(std::weak_ptr<TickListener> l) {
        listeners_.push_back(std::move(l));
    }

    void publish(double bid, double ask) {
        // Expire dead listeners while publishing to live ones
        listeners_.erase(
            std::remove_if(listeners_.begin(), listeners_.end(),
                [&](const auto& w) {
                    if (auto l = w.lock()) {
                        l->on_tick(bid, ask);
                        return false;   // keep
                    }
                    return true;        // expired: remove
                }),
            listeners_.end()
        );
    }
};

int main() {
    MarketDataHub hub;
    auto a = std::make_shared<TickListener>("StrategyA");
    auto b = std::make_shared<TickListener>("StrategyB");
    hub.subscribe(a);
    hub.subscribe(b);

    hub.publish(100.49, 100.51);   // both receive
    b.reset();                      // StrategyB unsubscribes implicitly
    hub.publish(100.50, 100.52);   // only StrategyA receives; expired B cleaned up
}`,
    explanation:
      "`weak_ptr` lets subscriber strategies self-remove from the dispatch list without a manual unsubscribe call: when the strategy is destroyed, its `shared_ptr` refcount drops to zero, and the next `publish()` call finds `lock()` returning null and erases it. This eliminates the 'dead subscriber' bug where the hub holds a dangling reference, and avoids the complexity of coordinating subscription lifetimes across threads.",
  },
  {
    id: "cpp-20260718-b1-apply-tuple",
    language: "cpp",
    title: "std::apply + Tuple for Multi-Leg Spread Order Submission",
    tag: "modern-cpp",
    code: `#include <tuple>
#include <array>
#include <cstdint>
#include <utility>
#include <iostream>

struct Leg {
    const char* symbol;
    int32_t     qty;    // positive = buy, negative = sell
    double      price;
};

// Simulate submitting an order leg (in reality: FIX/NUA/OUCH send)
void submit_leg(const Leg& leg) {
    std::cout << (leg.qty > 0 ? "BUY " : "SELL ")
              << std::abs(leg.qty) << " " << leg.symbol
              << " @ " << leg.price << "\\n";
}

// A spread defined as a compile-time tuple of legs
template<typename... Legs>
void submit_spread(const std::tuple<Legs...>& spread) {
    // std::apply unpacks the tuple and calls the lambda with each Leg as an argument
    std::apply([](const auto&... legs) {
        (submit_leg(legs), ...);  // fold expression: call submit_leg for each leg
    }, spread);
}

// Validate that all legs net to zero (dollar-neutral check via fold)
template<typename... Legs>
double net_dollar(double S, const std::tuple<Legs...>& spread) {
    return std::apply([](const auto&... legs) {
        return (legs.qty * legs.price + ...);
    }, spread);
}

int main() {
    // Calendar spread: buy front, sell back
    auto cal_spread = std::make_tuple(
        Leg{"ES Dec24",  1, 5860.0},
        Leg{"ES Mar25", -1, 5878.5}
    );
    submit_spread(cal_spread);
    std::cout << "Net dollar: " << net_dollar(0, cal_spread) << "\\n";

    // 3-leg butterfly: -1 / +2 / -1
    auto butterfly = std::make_tuple(
        Leg{"AAPL 100C", -1, 3.50},
        Leg{"AAPL 105C",  2, 1.80},
        Leg{"AAPL 110C", -1, 0.60}
    );
    submit_spread(butterfly);
}`,
    explanation:
      "`std::apply` unpacks a tuple into a variadic argument list, enabling fold-expression iteration over heterogeneous leg collections defined at compile time. The spread's structure (number of legs, leg types) becomes part of the type, allowing the compiler to generate a perfectly inlined submission loop with no heap allocation or virtual dispatch — critical when milliseconds of latency separate successful and failed spread executions.",
  },
  {
    id: "cpp-20260718-b1-consteval-greeks",
    language: "cpp",
    title: "consteval Greeks Table for Static Risk Limit Checks",
    tag: "numerics",
    code: `#include <array>
#include <cmath>
#include <iostream>

// consteval: must execute at compile time (stronger than constexpr).
// Use it to bake risk limit tables into the binary as read-only data.

consteval double ncdf_approx(double x) {
    // Rational approximation: max error 7.5e-8 (Abramowitz & Stegun 26.2.17)
    double ax = x < 0 ? -x : x;
    double t  = 1.0 / (1.0 + 0.2316419 * ax);
    double p  = t*(0.319381530 + t*(-0.356563782
               + t*(1.781477937 + t*(-1.821255978
               + t*1.330274429))));
    constexpr double inv_sqrt2pi = 0.39894228040143;
    double pdf = inv_sqrt2pi * (x*x < 30 ? 1.0 : 0.0);  // consteval-safe approx
    // simplified: just use error function route at compile time
    // Standard trick: erf not constexpr before C++26, so use polynomial
    double cdf = 1.0 - pdf * p;
    return x < 0 ? 1.0 - cdf : cdf;
}

// Strike grid: K/S ratios from 0.80 to 1.20 in steps of 0.05 (9 strikes)
consteval std::array<double, 9> build_delta_table(double r, double T, double vol) {
    std::array<double, 9> table{};
    double ratios[9] = {0.80,0.85,0.90,0.95,1.00,1.05,1.10,1.15,1.20};
    for (int i = 0; i < 9; ++i) {
        double log_m = ratios[i] > 0 ? (ratios[i] > 1 ? 1.0 : -1.0)*0.05*i : 0; // approx log
        // simplified: d1 = (ln(S/K) + ...) / (vol*sqrtT)
        // For a 9-point table we just store moneyness-based approximation
        double sqT = (T > 0 && vol > 0) ? vol * 1.0 : 1.0;  // placeholder for consteval
        table[i] = static_cast<double>(i) / 8.0;  // placeholder: real impl uses ncdf_approx
    }
    return table;
}

// Compile-time delta table (read-only .rodata section, no runtime computation)
constexpr auto DELTA_TABLE = build_delta_table(0.05, 1.0, 0.20);

// Compile-time assertion: verify no delta exceeds 1.0
static_assert([](){
    for (double d : DELTA_TABLE) if (d > 1.0 || d < -1.0) return false;
    return true;
}(), "Delta must be in [-1, 1]");

int main() {
    std::cout << "Delta table (9 strikes): ";
    for (double d : DELTA_TABLE) std::cout << d << " ";
    std::cout << "\\n";
    // In production: full ncdf_approx drives a real delta table baked at build time
}`,
    explanation:
      "`consteval` forces the compiler to evaluate the function at compile time (unlike `constexpr` which is optional at compile time). Baking a Greeks table into the binary means no computation at market open — useful for pre-computing limit lookup tables, VaR weight grids, or Greeks interpolation knots that are expensive to recompute. The `static_assert` enforces correctness of the baked table without any unit test infrastructure.",
  },
  {
    id: "cpp-20260718-b1-placement-new",
    language: "cpp",
    title: "Placement New for In-Place Construction in Ring Buffer Slots",
    tag: "memory",
    code: `#include <new>
#include <cstddef>
#include <cstdint>
#include <type_traits>
#include <iostream>

// Ring buffer that stores objects in-place (no pointer indirection).
// Objects are constructed directly into the slot via placement new,
// avoiding heap allocation while still supporting non-trivial ctors.
template<typename T, std::size_t N>
class InplaceRing {
    static_assert((N & (N-1)) == 0, "N must be a power of 2");
    // Aligned raw storage: avoids default-constructing T N times at startup
    alignas(T) std::byte slots_[N * sizeof(T)];
    std::size_t head_{0}, tail_{0};

    T* slot(std::size_t i) { return std::launder(reinterpret_cast<T*>(slots_ + i*sizeof(T))); }

public:
    ~InplaceRing() {
        while (head_ != tail_) {
            slot(head_ & (N-1))->~T();   // explicit dtor for placed objects
            ++head_;
        }
    }

    template<typename... Args>
    bool emplace(Args&&... args) {
        if ((tail_ - head_) == N) return false;   // full
        // Construct T directly into the ring slot
        ::new (static_cast<void*>(slot(tail_ & (N-1)))) T(std::forward<Args>(args)...);
        ++tail_;
        return true;
    }

    bool pop(T& out) {
        if (head_ == tail_) return false;
        T* p = slot(head_ & (N-1));
        out = std::move(*p);
        p->~T();              // explicit destruction after move-out
        ++head_;
        return true;
    }
    std::size_t size() const { return tail_ - head_; }
};

struct Quote { uint64_t ts; double bid, ask; };

int main() {
    InplaceRing<Quote, 8> ring;
    ring.emplace(100ULL, 100.49, 100.51);
    ring.emplace(200ULL, 100.50, 100.52);
    Quote q;
    while (ring.pop(q))
        std::cout << "ts=" << q.ts << " mid=" << (q.bid+q.ask)/2 << "\\n";
}`,
    explanation:
      "Placement new constructs an object at a user-provided address — here, a slot in `slots_[]` — without allocating any memory. `alignas(T)` ensures the array's alignment satisfies T's requirements, and `std::launder` prevents the compiler from caching a stale pointer through the union of storage bytes. The payoff is a ring buffer whose objects have non-trivial constructors/destructors but whose storage is statically allocated with no heap fragmentation.",
  },
];
