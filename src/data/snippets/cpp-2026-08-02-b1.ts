import type { Snippet } from "./types";

export const cppSnippets20260802B1: Snippet[] = [
  {
    id: "cpp-20260802-b1-ranges-views-tick",
    language: "cpp",
    title: "std::ranges Views Pipeline for Market Tick Filtering",
    tag: "modern-cpp",
    code: `#include <ranges>
#include <vector>
#include <algorithm>
#include <cstdint>

struct Tick { double price; uint32_t qty; bool is_trade; };

// Build a lazy filter+transform pipeline over a tick vector.
// No intermediate containers allocated — views compose lazily.
std::vector<double> trade_prices_above(const std::vector<Tick>& ticks,
                                        double threshold) {
    auto pipeline = ticks
        | std::views::filter([](const Tick& t){ return t.is_trade; })
        | std::views::filter([=](const Tick& t){ return t.price > threshold; })
        | std::views::transform([](const Tick& t){ return t.price; });

    return std::vector<double>(pipeline.begin(), pipeline.end());
}

// Generate synthetic ticks with iota + transform
auto synthetic_ticks(int n) {
    return std::views::iota(0, n)
         | std::views::transform([](int i){
               return Tick{ 100.0 + i * 0.01, static_cast<uint32_t>(100 + i), i % 3 == 0 };
           });
}`,
    explanation: "std::ranges views are lazy: filter and transform compose without allocating temporary vectors. The pipeline evaluation is driven by the final range-for or std::vector constructor, enabling composable, zero-overhead data transformations over tick streams."
  },
  {
    id: "cpp-20260802-b1-pmr-monotonic-buffer",
    language: "cpp",
    title: "PMR Monotonic Buffer Resource for Per-Message Allocation",
    tag: "allocators",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <array>

// PMR monotonic_buffer_resource: bump-pointer allocator over a fixed stack buffer.
// All allocations are O(1); the entire arena is freed in one shot at scope exit.
// Ideal for temporary per-message parse results in a FIX/ITCH handler.

void process_message(const char* raw, std::size_t len) {
    std::array<std::byte, 4096> stack_buf;
    std::pmr::monotonic_buffer_resource arena{stack_buf.data(), stack_buf.size()};
    std::pmr::polymorphic_allocator<> alloc{&arena};

    // All pmr containers use the arena; zero heap traffic
    std::pmr::vector<std::pmr::string> fields{&arena};
    fields.reserve(32);

    // Parse raw message into fields (simplified)
    std::size_t start = 0;
    for (std::size_t i = 0; i <= len; ++i) {
        if (i == len || raw[i] == '|') {
            fields.emplace_back(raw + start, i - start, &arena);
            start = i + 1;
        }
    }

    // Use fields... arena destructs here, no individual free calls needed
    (void)fields;
}`,
    explanation: "Monotonic buffer resources turn heap allocation into a bump-pointer increment over stack memory. Every pmr::vector and pmr::string inside the arena shares the same pool; the entire per-message scratchpad evaporates when the resource goes out of scope — no per-node free."
  },
  {
    id: "cpp-20260802-b1-mpsc-queue",
    language: "cpp",
    title: "Lock-Free MPSC Queue (Multiple-Producer Single-Consumer)",
    tag: "lock-free",
    code: `#include <atomic>
#include <memory>
#include <optional>

// Michael-Scott MPSC queue: producers CAS the tail; consumer owns the head.
// Wait-free producers, lock-free consumer — standard for multiple feed threads.
template <typename T>
class MPSCQueue {
    struct Node {
        T data;
        std::atomic<Node*> next{nullptr};
        explicit Node(T d) : data(std::move(d)) {}
    };
    alignas(64) std::atomic<Node*> tail_;
    alignas(64) Node*              head_;   // owned exclusively by consumer

public:
    MPSCQueue() {
        head_ = tail_.store(new Node(T{}), std::memory_order_relaxed), tail_.load();
        head_ = tail_.load(std::memory_order_relaxed); // sentinel
    }
    ~MPSCQueue() {
        while (head_) { auto n = head_->next.load(); delete head_; head_ = n; }
    }

    void push(T val) {                      // called by any producer thread
        Node* n = new Node(std::move(val));
        Node* prev = tail_.exchange(n, std::memory_order_acq_rel);
        prev->next.store(n, std::memory_order_release);
    }

    std::optional<T> pop() {                // called only by consumer thread
        Node* next = head_->next.load(std::memory_order_acquire);
        if (!next) return std::nullopt;
        T val = std::move(next->data);
        delete head_;
        head_ = next;
        return val;
    }
};`,
    explanation: "The Michael-Scott MPSC queue uses a sentinel node to decouple producers (who CAS the tail pointer) from the consumer (who advances head without synchronisation). The tail_.exchange is the only contended operation — O(1) per producer with hardware CAS."
  },
  {
    id: "cpp-20260802-b1-span-buffer-view",
    language: "cpp",
    title: "std::span for Zero-Copy Network Buffer Parsing",
    tag: "modern-cpp",
    code: `#include <span>
#include <cstdint>
#include <cstring>
#include <stdexcept>

// Stateless parser operating on a borrowed span — no copy, no lifetime extension.
struct MDHeader {
    uint16_t msg_type;
    uint32_t seq_no;
    uint16_t body_len;
} __attribute__((packed));

struct ParsedMsg {
    uint16_t            type;
    uint32_t            seq;
    std::span<const uint8_t> body;   // view into original DMA buffer
};

ParsedMsg parse_span(std::span<const uint8_t> buf) {
    if (buf.size() < sizeof(MDHeader))
        throw std::runtime_error("buffer too small");

    MDHeader hdr;
    std::memcpy(&hdr, buf.data(), sizeof(hdr));

    uint16_t body_len = __builtin_bswap16(hdr.body_len);
    if (buf.size() < sizeof(MDHeader) + body_len)
        throw std::runtime_error("truncated body");

    return {
        __builtin_bswap16(hdr.msg_type),
        __builtin_bswap32(hdr.seq_no),
        buf.subspan(sizeof(MDHeader), body_len)  // zero-copy view of body
    };
}

// Caller holds the DMA buffer alive; span borrows it with zero allocation.`,
    explanation: "std::span is a non-owning view with contiguous-range semantics. Returning a span of the body avoids copying network-received bytes — the view directly references the NIC's DMA buffer, which is key when processing thousands of messages per second."
  },
  {
    id: "cpp-20260802-b1-void-t-sfinae",
    language: "cpp",
    title: "void_t Detection Idiom for Interface Conformance",
    tag: "sfinae",
    code: `#include <type_traits>
#include <string>

// void_t collapses any valid type expression to void; an ill-formed expression
// causes SFINAE substitution failure, selecting the primary (false) template.

// Primary template: HasPrice<T> = false_type by default
template <typename T, typename = void>
struct HasPrice : std::false_type {};

// Partial specialisation: true_type only if T::price is a valid member
template <typename T>
struct HasPrice<T, std::void_t<decltype(std::declval<T>().price)>>
    : std::true_type {};

// Detection for a named member function
template <typename T, typename = void>
struct HasExecute : std::false_type {};

template <typename T>
struct HasExecute<T, std::void_t<decltype(std::declval<T>().execute())>>
    : std::true_type {};

struct Order   { double price; void execute() {} };
struct Message { int id; };

static_assert(HasPrice<Order>::value   == true);
static_assert(HasPrice<Message>::value == false);
static_assert(HasExecute<Order>::value == true);

// Use in a template to dispatch based on interface
template <typename T>
void maybe_execute(T& obj) {
    if constexpr (HasExecute<T>::value)
        obj.execute();
}`,
    explanation: "void_t enables detecting arbitrary member names or expressions without requiring a base class. Unlike concepts (C++20), void_t works in C++17 and is useful for wrapping legacy financial object models that lack a common interface."
  },
  {
    id: "cpp-20260802-b1-variant-order-state",
    language: "cpp",
    title: "std::variant Order State Machine (Zero Virtual Dispatch)",
    tag: "modern-cpp",
    code: `#include <variant>
#include <string>
#include <iostream>

// Encode order lifecycle as a closed set of states.
// std::visit replaces virtual dispatch with a switch-on-type.
struct New      { int id; double price; int qty; };
struct Acked    { int id; std::string exchange_oid; };
struct PartFill { int id; int filled_qty; double avg_px; };
struct Filled   { int id; double avg_px; };
struct Cancelled{ int id; std::string reason; };

using OrderState = std::variant<New, Acked, PartFill, Filled, Cancelled>;

struct StatusVisitor {
    void operator()(const New&       s) const { std::cout << "New order " << s.id << "\n"; }
    void operator()(const Acked&     s) const { std::cout << "Acked: " << s.exchange_oid << "\n"; }
    void operator()(const PartFill&  s) const { std::cout << "Part fill " << s.filled_qty << "@" << s.avg_px << "\n"; }
    void operator()(const Filled&    s) const { std::cout << "Filled @" << s.avg_px << "\n"; }
    void operator()(const Cancelled& s) const { std::cout << "Cancelled: " << s.reason << "\n"; }
};

// State transition: New -> Acked
OrderState ack_order(const New& n, std::string exchange_oid) {
    return Acked{n.id, std::move(exchange_oid)};
}

int main() {
    OrderState state = New{42, 150.25, 100};
    std::visit(StatusVisitor{}, state);
    state = ack_order(std::get<New>(state), "EX-9999");
    std::visit(StatusVisitor{}, state);
}`,
    explanation: "std::variant encodes a closed state machine as a sum type — the compiler enforces exhaustive handling in std::visit, catching missing cases at compile time. Unlike virtual dispatch, the visitor generates a jump table or nested branches with no vtable indirection."
  },
  {
    id: "cpp-20260802-b1-digital-option",
    language: "cpp",
    title: "Digital (Binary) Option Black-Scholes Pricing",
    tag: "numerics",
    code: `#include <cmath>
#include <numbers>

// Standard normal CDF via erfc
static double N(double x) { return 0.5 * std::erfc(-x * std::numbers::inv_sqrtpi * std::numbers::sqrt2 / std::sqrt(2.0)); }
// Simplified: use std::erfc(-x/sqrt(2)) / 2
static double Ncdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }

// Cash-or-nothing binary call: pays $1 if S_T > K, else $0
double binary_call_cash(double S, double K, double r, double sigma, double T) {
    double d2 = (std::log(S / K) + (r - 0.5 * sigma * sigma) * T)
                / (sigma * std::sqrt(T));
    return std::exp(-r * T) * Ncdf(d2);
}

// Asset-or-nothing binary call: pays S_T if S_T > K, else $0
double binary_call_asset(double S, double K, double r, double sigma, double T) {
    double d1 = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T)
                / (sigma * std::sqrt(T));
    return S * Ncdf(d1);
}

// European call = asset-or-nothing - K*cash-or-nothing (put-call parity decomposition)
double call_from_binaries(double S, double K, double r, double sigma, double T) {
    return binary_call_asset(S, K, r, sigma, T)
         - K * binary_call_cash(S, K, r, sigma, T);
}`,
    explanation: "Any European option decomposes into digital (binary) building blocks: a call = asset-or-nothing minus K times cash-or-nothing. Digital prices appear in barrier option rebates, range accruals, and target redemption notes — understanding them is foundational for exotic structured products."
  },
  {
    id: "cpp-20260802-b1-chooser-option",
    language: "cpp",
    title: "Chooser Option Pricing (Choose Call or Put at Decision Date)",
    tag: "numerics",
    code: `#include <cmath>

static double Ncdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }

// Chooser option: at time t_c, holder chooses the better of
// a call or put with strike K expiring at T (> t_c).
// Closed-form via compound-option decomposition (Rubinstein 1991).
double chooser_price(double S, double K, double r, double q,
                     double sigma, double t_c, double T) {
    double d1 = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T)
                / (sigma * std::sqrt(T));
    double d2 = d1 - sigma * std::sqrt(T);

    // At t_c, the option is worth max(C(S_tc), P(S_tc)).
    // Closed form (Rubinstein):
    double y1 = (std::log(S / K) + (r - q) * T + 0.5 * sigma * sigma * t_c)
                / (sigma * std::sqrt(t_c));
    double y2 = y1 - sigma * std::sqrt(t_c);

    double call_val = S * std::exp(-q * T) * Ncdf(d1) - K * std::exp(-r * T) * Ncdf(d2);
    double put_val  = K * std::exp(-r * T) * Ncdf(-d2) - S * std::exp(-q * T) * Ncdf(-d1);

    // Simple chooser formula: C(S,K,T) + P(S, K*exp(-(r-q)*(T-t_c)), t_c)
    double K_eff = K * std::exp(-(r - q) * (T - t_c));
    double d_eff1 = (std::log(S / K_eff) + (r - q + 0.5 * sigma * sigma) * t_c)
                    / (sigma * std::sqrt(t_c));
    double d_eff2 = d_eff1 - sigma * std::sqrt(t_c);
    double put_eff = K_eff * std::exp(-r * t_c) * Ncdf(-d_eff2)
                   - S * std::exp(-q * t_c) * Ncdf(-d_eff1);
    return call_val + put_eff; // Rubinstein simple chooser
}`,
    explanation: "A simple chooser decomposes into a standard call plus a put with adjusted strike and maturity equal to the choice date. The put captures the optionality of switching to the put side — priced higher than either call or put alone, capping the Sharpe of strategies that sell it."
  },
  {
    id: "cpp-20260802-b1-explicit-fd-scheme",
    language: "cpp",
    title: "Explicit Euler Finite-Difference Scheme for Black-Scholes",
    tag: "numerics",
    code: `#include <vector>
#include <algorithm>
#include <cmath>

// Explicit (forward Euler) finite-difference pricer for European put.
// Stability requires dt <= dS^2 / (sigma^2 * S_max^2) — violate this and
// the scheme diverges. Use Crank-Nicolson for production.
std::vector<double> explicit_fd_put(double K, double T, double r,
                                     double sigma, int M, int N) {
    double S_max = 3.0 * K;
    double dS    = S_max / M;
    double dt    = T / N;

    // Stability check: explicit requires dt <= dS^2 / (sigma^2 * S_max^2)
    double max_dt_stable = dS * dS / (sigma * sigma * S_max * S_max);
    if (dt > max_dt_stable * 1.01)
        throw std::runtime_error("Explicit scheme: dt too large, use CN");

    std::vector<double> V(M + 1);
    // Terminal condition: European put
    for (int i = 0; i <= M; ++i)
        V[i] = std::max(K - i * dS, 0.0);

    for (int n = N - 1; n >= 0; --n) {
        std::vector<double> Vn(M + 1);
        Vn[0] = K * std::exp(-r * (N - n) * dt);  // lower boundary
        Vn[M] = 0.0;                                // upper boundary
        for (int i = 1; i < M; ++i) {
            double S   = i * dS;
            double al  = 0.5 * sigma * sigma * S * S / (dS * dS);
            double be  = r * S / (2.0 * dS);
            Vn[i] = dt * (al - be) * V[i-1]
                  + (1.0 - dt * (2.0 * al + r)) * V[i]
                  + dt * (al + be) * V[i+1];
        }
        V = Vn;
    }
    return V;
}`,
    explanation: "The explicit scheme is trivially parallelisable (each grid point is independent) but conditionally stable: the CFL condition bounds dt to O(dS^2), making it impractical for fine grids. It serves as a correctness check against the unconditionally-stable Crank-Nicolson scheme."
  },
  {
    id: "cpp-20260802-b1-trinomial-tree",
    language: "cpp",
    title: "Trinomial Tree Pricer for European and American Options",
    tag: "numerics",
    code: `#include <vector>
#include <algorithm>
#include <cmath>

// Kamrad-Ritchken trinomial tree: up/mid/down branches per node.
// More efficient than binomial for same accuracy due to wider branching.
double trinomial_price(double S0, double K, double r, double sigma,
                        double T, int N, bool is_american, bool is_put) {
    double dt    = T / N;
    double u     = std::exp(sigma * std::sqrt(3.0 * dt)); // up factor (Boyle)
    double d     = 1.0 / u;
    double disc  = std::exp(-r * dt);

    // Risk-neutral probabilities
    double pu = ((r - 0.5 * sigma * sigma) * dt / std::log(u) + 1.0) / 6.0
              + 1.0 / 6.0;
    double pm = 2.0 / 3.0;
    double pd = 1.0 - pu - pm;

    int nodes = 2 * N + 1;                 // nodes at terminal layer
    std::vector<double> V(nodes);

    // Terminal payoffs
    for (int i = 0; i < nodes; ++i) {
        double S = S0 * std::pow(u, N - i);
        double payoff = is_put ? std::max(K - S, 0.0) : std::max(S - K, 0.0);
        V[i] = payoff;
    }

    // Backward induction
    for (int step = N - 1; step >= 0; --step) {
        for (int i = 0; i <= 2 * step; ++i) {
            double continuation = disc * (pu * V[i] + pm * V[i+1] + pd * V[i+2]);
            if (is_american) {
                double S = S0 * std::pow(u, step - i);
                double intrinsic = is_put ? std::max(K - S, 0.0) : std::max(S - K, 0.0);
                V[i] = std::max(continuation, intrinsic);
            } else {
                V[i] = continuation;
            }
        }
    }
    return V[0];
}`,
    explanation: "Trinomial trees add a middle branch (S stays flat), improving convergence versus binomial trees for the same N — roughly equivalent to binomial with 2N steps. American exercise is handled by comparing continuation value to immediate exercise at each node, enabling early-exercise premium calculation."
  },
  {
    id: "cpp-20260802-b1-rdtsc-latency",
    language: "cpp",
    title: "RDTSC-Based Nanosecond Latency Measurement",
    tag: "low-latency",
    code: `#include <cstdint>
#include <x86intrin.h>  // __rdtsc, _mm_lfence

// Serialising RDTSC: lfence prevents out-of-order execution from skewing readings.
// Use RDTSCP (__rdtscp) for serialisation on both sides in kernel-bypass code.
inline uint64_t rdtsc_start() {
    _mm_lfence();                   // prevents loads before the fence from reordering
    return __rdtsc();
}
inline uint64_t rdtsc_end() {
    uint64_t t = __rdtsc();
    _mm_lfence();
    return t;
}

// Convert TSC ticks to nanoseconds using calibrated CPU frequency.
// Call once at startup: measure CLOCK_MONOTONIC vs TSC over 100ms.
struct TSCClock {
    double ns_per_tick;             // calibrated offline

    uint64_t now_ticks() const { return rdtsc_start(); }
    double   ticks_to_ns(uint64_t ticks) const { return ticks * ns_per_tick; }
};

// Typical usage in a hot path:
//   uint64_t t0 = rdtsc_start();
//   process_order(...);
//   uint64_t dt = rdtsc_end() - t0;
//   histogram.record(clock.ticks_to_ns(dt));`,
    explanation: "RDTSC is the lowest-overhead hardware timestamp counter (~5 cycles) used for intra-process latency measurement in HFT. LFENCE ensures instructions before the fence complete before the counter is read; without serialisation, speculative execution can yield negative time deltas."
  },
  {
    id: "cpp-20260802-b1-spinlock-backoff",
    language: "cpp",
    title: "Spinlock with Exponential Backoff and PAUSE Hint",
    tag: "lock-free",
    code: `#include <atomic>
#include <immintrin.h>  // _mm_pause

// Spinlock with exponential backoff: avoids saturating the memory bus
// when contention is high (e.g. many cores spinning on the same lock).
class SpinlockBackoff {
    std::atomic_flag flag_ = ATOMIC_FLAG_INIT;

public:
    void lock() {
        int backoff = 1;
        while (flag_.test_and_set(std::memory_order_acquire)) {
            // Backoff: spin with PAUSE to reduce memory bus traffic
            for (int i = 0; i < backoff; ++i)
                _mm_pause();            // hints the CPU it's in a spin loop
            if (backoff < 64) backoff <<= 1;  // double up to 64 PAUSE cycles
        }
    }
    void unlock() { flag_.clear(std::memory_order_release); }
};

// RAII wrapper
struct SpinGuard {
    SpinlockBackoff& lk;
    explicit SpinGuard(SpinlockBackoff& l) : lk(l) { lk.lock(); }
    ~SpinGuard() { lk.unlock(); }
};`,
    explanation: "_mm_pause reduces power consumption and avoids pipeline flushes during spin; on Hyper-Threading cores it yields the pipeline to the sibling logical core. Exponential backoff prevents cache-line bouncing when many threads compete — aggressive spinning floods the coherence protocol."
  },
  {
    id: "cpp-20260802-b1-thread-local-stats",
    language: "cpp",
    title: "Thread-Local Latency Histogram (No Contention)",
    tag: "low-latency",
    code: `#include <array>
#include <cstdint>
#include <thread>
#include <mutex>
#include <vector>
#include <numeric>

// Per-core latency histogram: no synchronisation on the hot path.
// Merge across threads only at reporting time.
struct Histogram {
    static constexpr int BINS = 64;
    std::array<uint64_t, BINS> buckets{};
    uint64_t total = 0;

    void record(uint64_t ns) {
        ++total;
        int bin = 0;
        uint64_t boundary = 1;
        while (bin < BINS - 1 && ns >= boundary) { boundary <<= 1; ++bin; }
        ++buckets[bin];
    }
    // Approximate percentile: find bin covering p*total observations
    uint64_t percentile_ns(double p) const {
        uint64_t target = static_cast<uint64_t>(p * total);
        uint64_t cum = 0;
        for (int i = 0; i < BINS; ++i) {
            cum += buckets[i];
            if (cum >= target) return 1ULL << i;
        }
        return 1ULL << (BINS - 1);
    }
};

thread_local Histogram tl_hist;

// Each worker thread records to its own histogram:
//   tl_hist.record(latency_ns);
// Coordinator merges:
std::vector<Histogram*> all_hists;
std::mutex hists_mu;

void register_thread_hist() {
    std::lock_guard lk(hists_mu);
    all_hists.push_back(&tl_hist);
}`,
    explanation: "Thread-local histograms eliminate all synchronisation on the critical path — each core accumulates its own latency distribution. The exponential bucket layout (powers of 2) covers nanoseconds to milliseconds with a single integer index; merge is linear in threads * bins and happens off the hot path."
  },
  {
    id: "cpp-20260802-b1-csr-greeks-matrix",
    language: "cpp",
    title: "Compressed Sparse Row Matrix for Greeks Aggregation",
    tag: "numerics",
    code: `#include <vector>
#include <cstdint>
#include <numeric>

// CSR (Compressed Sparse Row) representation of the position-Greeks matrix.
// Rows = positions (N), columns = risk factors (M). Most entries zero.
struct CSRMatrix {
    int            rows, cols;
    std::vector<double>   vals;   // non-zero values
    std::vector<int>      col_idx; // column index per non-zero
    std::vector<int>      row_ptr; // row_ptr[i] = start index of row i in vals

    // Sparse matrix-vector product: Greek_per_factor = M^T * position_vector
    std::vector<double> matvec(const std::vector<double>& x) const {
        std::vector<double> result(cols, 0.0);
        for (int i = 0; i < rows; ++i)
            for (int j = row_ptr[i]; j < row_ptr[i + 1]; ++j)
                result[col_idx[j]] += vals[j] * x[i];
        return result;
    }
};

// Build CSR from triplets (row, col, value)
CSRMatrix build_csr(int rows, int cols,
                    std::vector<std::tuple<int,int,double>> triplets) {
    std::sort(triplets.begin(), triplets.end()); // sort by row, then col
    CSRMatrix m{rows, cols};
    m.row_ptr.resize(rows + 1, 0);
    for (auto& [r, c, v] : triplets) {
        m.vals.push_back(v);
        m.col_idx.push_back(c);
        ++m.row_ptr[r + 1];
    }
    std::partial_sum(m.row_ptr.begin(), m.row_ptr.end(), m.row_ptr.begin());
    return m;
}`,
    explanation: "Most position-Greeks matrices are sparse: each position is sensitive to only a few risk factors (its own underlying, IR tenor, vol bucket). CSR matvec skips zeros entirely; memory footprint is proportional to non-zeros rather than rows*cols, critical for large multi-asset books."
  },
  {
    id: "cpp-20260802-b1-jthread-stop",
    language: "cpp",
    title: "std::jthread with stop_token for Graceful Shutdown",
    tag: "modern-cpp",
    code: `#include <thread>
#include <stop_token>
#include <chrono>
#include <iostream>

// std::jthread (C++20) automatically joins on destruction and provides
// a cooperative cancellation mechanism via stop_token/stop_source.

void market_data_listener(std::stop_token st, int port) {
    while (!st.stop_requested()) {
        // Poll for incoming packets; check stop every loop iteration
        // In real code: use poll()/epoll() with a short timeout
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
        // ... receive and process ticks ...
    }
    std::cout << "Listener on port " << port << " shutting down\n";
}

int main() {
    std::jthread t(market_data_listener, 9001);

    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    t.request_stop();   // signals stop_token; thread checks st.stop_requested()
    // t destructs here: joins automatically even if request_stop wasn't called
}`,
    explanation: "std::jthread's automatic join prevents the SIGTERM-triggered zombie thread problem common in trading systems that abruptly terminate. The stop_token avoids a global atomic flag — each thread independently checks its own token, enabling per-component shutdown sequencing."
  },
  {
    id: "cpp-20260802-b1-itch-parser",
    language: "cpp",
    title: "ITCH 5.0 Binary Message Parser (Add Order / Trade)",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <string_view>
#include <variant>

// NASDAQ ITCH 5.0 simplified Add Order message (type 'A'):
// [1 msg_type][2 stock_locate][2 tracking_number][6 timestamp][8 order_ref]
// [1 side][4 shares][8 stock][4 price] = 36 bytes total
struct AddOrder {
    uint16_t stock_locate;
    uint64_t timestamp_ns;
    uint64_t order_ref;
    char     side;           // 'B' or 'S'
    uint32_t shares;
    char     stock[9];       // 8 chars + null
    double   price;          // ITCH price = uint32 / 10000.0
};

AddOrder parse_add_order(const uint8_t* buf) {
    AddOrder o{};
    // All multi-byte fields are big-endian
    std::memcpy(&o.stock_locate, buf + 1, 2);
    o.stock_locate = __builtin_bswap16(o.stock_locate);

    // Timestamp: 6-byte big-endian (stored in upper 6 bytes of uint64)
    uint64_t ts = 0;
    std::memcpy(reinterpret_cast<uint8_t*>(&ts) + 2, buf + 5, 6);
    o.timestamp_ns = __builtin_bswap64(ts);

    std::memcpy(&o.order_ref, buf + 11, 8);
    o.order_ref = __builtin_bswap64(o.order_ref);

    o.side = static_cast<char>(buf[19]);

    uint32_t shares;
    std::memcpy(&shares, buf + 20, 4);
    o.shares = __builtin_bswap32(shares);

    std::memcpy(o.stock, buf + 24, 8);
    o.stock[8] = '\0';

    uint32_t price_raw;
    std::memcpy(&price_raw, buf + 32, 4);
    o.price = __builtin_bswap32(price_raw) / 10000.0;

    return o;
}`,
    explanation: "ITCH 5.0 messages are fixed-width binary with big-endian multi-byte integers; the 6-byte timestamp is the trickiest field (ITCH uses a non-standard 48-bit counter for nanoseconds). Parsing with memcpy+bswap avoids undefined behaviour from unaligned pointer casts and compiles to a handful of movbe instructions."
  },
  {
    id: "cpp-20260802-b1-cache-oblivious-transpose",
    language: "cpp",
    title: "Cache-Oblivious Matrix Transpose via Recursive Tiling",
    tag: "low-latency",
    code: `#include <vector>
#include <algorithm>
#include <cstddef>

// Cache-oblivious transpose: recurse until the sub-matrix fits in cache,
// then do a naive transpose. No explicit tile size — works for any cache size.
void transpose_recursive(double* A, double* B,
                          int r0, int r1, int c0, int c1,
                          int rows, int cols) {
    int dr = r1 - r0, dc = c1 - c0;
    if (dr <= 16 && dc <= 16) {
        // Base case: small block, transpose naively
        for (int r = r0; r < r1; ++r)
            for (int c = c0; c < c1; ++c)
                B[c * rows + r] = A[r * cols + c];
        return;
    }
    if (dr >= dc) {
        int rm = (r0 + r1) / 2;
        transpose_recursive(A, B, r0, rm, c0, c1, rows, cols);
        transpose_recursive(A, B, rm, r1, c0, c1, rows, cols);
    } else {
        int cm = (c0 + c1) / 2;
        transpose_recursive(A, B, r0, r1, c0, cm, rows, cols);
        transpose_recursive(A, B, r0, r1, cm, c1, rows, cols);
    }
}

void transpose(const std::vector<double>& A, std::vector<double>& B,
               int rows, int cols) {
    B.resize(rows * cols);
    transpose_recursive(const_cast<double*>(A.data()), B.data(),
                        0, rows, 0, cols, rows, cols);
}`,
    explanation: "Cache-oblivious algorithms automatically adapt to any memory hierarchy without hardware-specific tile sizes. The recursive halving ensures that when the sub-matrix fits in L1/L2/L3, both source and destination access patterns become sequential — reducing TLB misses on large covariance matrices."
  },
  {
    id: "cpp-20260802-b1-duration-convexity",
    language: "cpp",
    title: "Bond Duration and Convexity (Fixed Coupon Bond)",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <stdexcept>

struct BondAnalytics {
    double price;
    double modified_duration;   // dP/dy / (-P)
    double convexity;           // d2P/dy2 / P
    double dv01;                // dollar value of 1bp: modified_duration * P * 0.0001
};

// Compute analytics for a fixed-coupon bond given YTM.
// cash_flows: vector of (time_years, amount) pairs.
BondAnalytics bond_analytics(const std::vector<std::pair<double,double>>& cfs,
                              double ytm) {
    double P = 0, D_num = 0, C_num = 0;
    for (const auto& [t, cf] : cfs) {
        double pv = cf * std::exp(-ytm * t);   // continuous compounding
        P     += pv;
        D_num += t * pv;
        C_num += t * t * pv;
    }
    if (P < 1e-12) throw std::domain_error("zero price");
    double mac_duration = D_num / P;
    double mod_duration = mac_duration;       // same for continuous compounding
    double convexity    = C_num / P;
    return { P, mod_duration, convexity, mod_duration * P * 0.0001 };
}

// Duration approximation: dP/P ≈ -D_mod * dy + 0.5 * Conv * dy^2
double approx_price_change(const BondAnalytics& a, double dy) {
    return -a.modified_duration * dy + 0.5 * a.convexity * dy * dy;
}`,
    explanation: "Continuous-compounding duration equals Macaulay duration directly; for semi-annual bonds, divide by (1+y/2). Convexity is always positive for non-callable bonds — it benefits the holder in both up and down yield moves, explaining why convex bonds trade at a premium (price of convexity)."
  },
  {
    id: "cpp-20260802-b1-rho-greek",
    language: "cpp",
    title: "Rho Greek: Interest Rate Sensitivity of Options",
    tag: "numerics",
    code: `#include <cmath>

static double Ncdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }

// Rho = dC/dr: sensitivity of call price to risk-free rate.
// For long-dated calls, rho is significant — rates affect forward price.
double call_rho(double S, double K, double r, double sigma, double T) {
    double d2 = (std::log(S / K) + (r - 0.5 * sigma * sigma) * T)
                / (sigma * std::sqrt(T));
    return K * T * std::exp(-r * T) * Ncdf(d2);
}

double put_rho(double S, double K, double r, double sigma, double T) {
    double d2 = (std::log(S / K) + (r - 0.5 * sigma * sigma) * T)
                / (sigma * std::sqrt(T));
    return -K * T * std::exp(-r * T) * Ncdf(-d2);
}

// Call put rho relationship: call_rho - put_rho = K * T * exp(-r*T)
// (consistent with put-call parity differentiated w.r.t. r)

// DV01-like rho: change in value per 1bp move in rates
double rho_dv01_call(double S, double K, double r, double sigma, double T) {
    return call_rho(S, K, r, sigma, T) * 0.0001;
}`,
    explanation: "Rho is proportional to K*T*exp(-rT) — deepening time to expiry amplifies rate sensitivity. For short-dated equity options, rho is negligible; for LEAPS or rate-sensitive exotics, rho hedging drives significant IR swap overlay trades. The call-put rho difference is exact by put-call parity."
  },
  {
    id: "cpp-20260802-b1-symbol-intern",
    language: "cpp",
    title: "Symbol Interning Table (String View to Integer ID)",
    tag: "containers",
    code: `#include <unordered_map>
#include <string>
#include <string_view>
#include <cstdint>
#include <vector>
#include <stdexcept>

// Intern string symbols to compact uint32 IDs.
// Lookups by string_view avoid allocation; reverse lookup by ID is O(1).
class SymbolTable {
    std::unordered_map<std::string, uint32_t> sym_to_id_;
    std::vector<std::string_view>             id_to_sym_;  // views into sym_to_id_ keys
    uint32_t                                  next_id_ = 0;

public:
    // Intern a symbol; returns existing ID if already present.
    uint32_t intern(std::string_view sym) {
        auto it = sym_to_id_.find(std::string(sym));
        if (it != sym_to_id_.end()) return it->second;
        uint32_t id = next_id_++;
        auto [new_it, _] = sym_to_id_.emplace(std::string(sym), id);
        id_to_sym_.push_back(std::string_view(new_it->first));
        return id;
    }
    std::string_view symbol(uint32_t id) const {
        if (id >= id_to_sym_.size()) throw std::out_of_range("unknown id");
        return id_to_sym_[id];
    }
    std::size_t size() const { return sym_to_id_.size(); }
};

// Usage: all tick processing uses uint32_t IDs; symbol only at display time.
//   SymbolTable syms;
//   uint32_t aapl = syms.intern("AAPL");`,
    explanation: "Symbol interning replaces per-message string comparisons with integer equality checks — replacing O(L) string compare with O(1) integer compare on the hot path. The ID doubles as an array index, enabling O(1) access to per-symbol order books, position tables, and risk matrices."
  },
  {
    id: "cpp-20260802-b1-compiletime-payoff",
    language: "cpp",
    title: "Constexpr Option Strategy Payoff Table",
    tag: "numerics",
    code: `#include <array>
#include <algorithm>
#include <cstddef>

// Compute iron condor payoff table at compile time.
// Iron condor: sell OTM call and put, buy further OTM call and put.
struct IronCondor {
    double K1, K2, K3, K4;  // K1 < K2 < K3 < K4
    double premium;          // net premium received
};

constexpr double iron_condor_payoff(double S, IronCondor ic) {
    double payoff = ic.premium;
    payoff -= std::max(ic.K2 - S, 0.0);   // short put at K2
    payoff += std::max(ic.K1 - S, 0.0);   // long put at K1 (hedge)
    payoff -= std::max(S - ic.K3, 0.0);   // short call at K3
    payoff += std::max(S - ic.K4, 0.0);   // long call at K4 (hedge)
    return payoff;
}

// 11-point payoff table from S=80 to S=120 at compile time
constexpr auto build_payoff_table() {
    constexpr IronCondor ic{85.0, 90.0, 110.0, 115.0, 2.5};
    constexpr int N = 11;
    std::array<std::pair<double, double>, N> table{};
    for (int i = 0; i < N; ++i) {
        double S = 80.0 + i * 4.0;
        table[i] = {S, iron_condor_payoff(S, ic)};
    }
    return table;
}

constexpr auto payoff_table = build_payoff_table();
// Embedded as static read-only data in the binary — zero runtime init cost.`,
    explanation: "Constexpr payoff tables for standard option strategies (straddle, strangle, iron condor) can be embedded as static data at compile time. Risk dashboards that display max-profit / max-loss / breakevens can read these constants without any pricing call at runtime."
  },
  {
    id: "cpp-20260802-b1-seqcst-fence",
    language: "cpp",
    title: "std::atomic_thread_fence for Sequential Consistency",
    tag: "memory-ordering",
    code: `#include <atomic>
#include <thread>
#include <cassert>
#include <cstdint>

// Demonstrate why seq_cst fences are needed for Dekker-like protocols.
// Without full fences, two threads can each see the other's flag as false.
std::atomic<int> x{0}, y{0};
std::atomic<int> r1{0}, r2{0};

void thread_A() {
    x.store(1, std::memory_order_relaxed);
    std::atomic_thread_fence(std::memory_order_seq_cst);  // full barrier
    r1.store(y.load(std::memory_order_relaxed), std::memory_order_relaxed);
}

void thread_B() {
    y.store(1, std::memory_order_relaxed);
    std::atomic_thread_fence(std::memory_order_seq_cst);
    r2.store(x.load(std::memory_order_relaxed), std::memory_order_relaxed);
}

// After both threads complete: at least one of r1 or r2 must be 1.
// Without the seq_cst fences, both could be 0 on ARM/POWER.

// In market data: use seq_cst fences to establish a total order across
// sequence numbers published on different cachelines.`,
    explanation: "seq_cst fences impose a single total order across all fence operations in the program — stronger than release/acquire which only creates pairwise happens-before edges. Necessary for mutual exclusion and sequence-number protocols on weakly-ordered architectures like ARM Neoverse or IBM POWER."
  },
  {
    id: "cpp-20260802-b1-fold-expression-greeks",
    language: "cpp",
    title: "C++17 Fold Expressions for Variadic Greeks Aggregation",
    tag: "modern-cpp",
    code: `#include <cstddef>
#include <tuple>
#include <type_traits>

// Aggregate Greeks from a variadic pack of position types using fold expressions.
struct Greeks { double delta, gamma, vega, theta, rho; };

Greeks operator+(const Greeks& a, const Greeks& b) {
    return {a.delta+b.delta, a.gamma+b.gamma, a.vega+b.vega,
            a.theta+b.theta, a.rho+b.rho};
}

// Each position type must expose a greeks() method
template <typename... Positions>
Greeks aggregate_greeks(const Positions&... positions) {
    // Unary right fold: ((g1 + g2) + g3) ...
    return (... + positions.greeks());
}

// Example position types
struct CallPosition {
    double qty, delta_, gamma_, vega_, theta_, rho_;
    Greeks greeks() const {
        return {qty*delta_, qty*gamma_, qty*vega_, qty*theta_, qty*rho_};
    }
};
struct FuturePosition {
    double qty, delta_;
    Greeks greeks() const { return {qty*delta_, 0, 0, 0, 0}; }
};

// Portfolio: call + future + another call
// Greeks total = aggregate_greeks(call1, fut, call2);`,
    explanation: "C++17 fold expressions expand variadic packs with a binary operator in a single expression, eliminating hand-written loops over heterogeneous position types. The unary right fold (... + x) generates the same code as a manual sequential sum, with zero overhead and full type safety."
  },
  {
    id: "cpp-20260802-b1-amihud-illiquidity",
    language: "cpp",
    title: "Amihud Illiquidity Ratio for Market Impact Estimation",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <numeric>
#include <stdexcept>

// Amihud (2002) illiquidity ratio: daily |return| / dollar volume.
// Average over T days to get a stable microstructure measure.
// Higher ratio = more price impact per dollar traded.
double amihud_ratio(const std::vector<double>& prices,
                    const std::vector<double>& volumes) {
    if (prices.size() < 2 || prices.size() != volumes.size())
        throw std::invalid_argument("need >= 2 price/volume pairs");

    double sum = 0.0;
    int    n   = 0;
    for (std::size_t i = 1; i < prices.size(); ++i) {
        double ret = std::abs((prices[i] - prices[i-1]) / prices[i-1]);
        double dv  = prices[i] * volumes[i];   // dollar volume
        if (dv > 1e-8) {
            sum += ret / dv;
            ++n;
        }
    }
    return (n > 0) ? sum / n * 1e6 : 0.0;   // scale by 1e6 for readability
}

// Use as a position-size penalty:
// max_notional = base_notional / (1 + lambda * amihud_ratio(prices, vols))
// where lambda controls market-impact aversion.`,
    explanation: "Amihud's ILLIQ is the workhorse illiquidity measure: it approximates Kyle's lambda (price impact per dollar) from daily public data without needing order-book snapshots. Models calibrated on ILLIQ correctly predict that small-cap stocks require larger impact cost buffers in execution algorithms."
  },
  {
    id: "cpp-20260802-b1-packed-msg-alignment",
    language: "cpp",
    title: "Packed vs Aligned Struct Trade-offs for Network Messages",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <cstddef>

// Packed: matches wire format byte-for-byte; safe to memcpy from network buffer.
// Fields may be misaligned — access via memcpy, not pointer cast.
struct __attribute__((packed)) WireMsg {
    uint8_t  type;
    uint32_t seq;       // may be unaligned (offset 1)
    uint64_t price;     // may be unaligned (offset 5)
    uint16_t qty;       // unaligned (offset 13)
};

// Aligned: CPU-friendly layout; padding added by compiler.
// Not interchangeable with wire format without serialisation.
struct AlignedMsg {
    uint8_t  type;
    // 3 bytes padding
    uint32_t seq;
    uint64_t price;
    uint16_t qty;
    // 6 bytes padding
};

static_assert(sizeof(WireMsg)   == 15);
static_assert(sizeof(AlignedMsg) == 24);

// Safe decode: always go through the packed wire struct first
AlignedMsg decode(const uint8_t* buf) {
    WireMsg w;
    std::memcpy(&w, buf, sizeof(w));   // alignment-safe copy
    AlignedMsg a;
    a.type  = w.type;
    std::memcpy(&a.seq,   &w.seq,   4);
    std::memcpy(&a.price, &w.price, 8);
    std::memcpy(&a.qty,   &w.qty,   2);
    return a;
}`,
    explanation: "Reading fields from a packed struct via pointer dereference is undefined behaviour on platforms that trap misaligned accesses (e.g. some ARM targets). The correct pattern is memcpy into an aligned struct — compilers optimise this to a single load on x86 where misaligned access is legal but still slower than aligned."
  },
];
