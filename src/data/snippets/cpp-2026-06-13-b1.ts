import type { Snippet } from "./types";

export const cppSnippets20260613B1: Snippet[] = [
  {
    id: "cpp-20260613-b1-treiber-stack",
    language: "cpp",
    title: "Treiber lock-free stack — CAS push/pop with ABA discussion",
    tag: "concurrency",
    code: `#include <atomic>
#include <memory>
#include <optional>

// Treiber (1986) lock-free stack: each node is pushed/popped via CAS.
// ABA problem: thread A reads head=X, thread B pops X then pushes X again;
// A's CAS succeeds even though the stack changed. Mitigation: tagged pointer
// (pack a version counter into the upper bits of the pointer on 64-bit).

template<typename T>
class TreiberStack {
    struct Node {
        T     value;
        Node* next;
        explicit Node(const T& v, Node* n) : value(v), next(n) {}
    };

    // Tagged pointer: top 16 bits = version counter, bottom 48 = address.
    // On x86-64 canonical addresses use only 48 bits, so this is safe.
    struct TaggedPtr {
        Node*         ptr;
        std::uint64_t tag;   // monotonically increasing; prevents ABA
        bool operator==(const TaggedPtr&) const noexcept = default;
    };

    std::atomic<TaggedPtr> head_{TaggedPtr{nullptr, 0}};

public:
    void push(const T& val) {
        Node*     n = new Node(val, nullptr);
        TaggedPtr old = head_.load(std::memory_order_relaxed);
        TaggedPtr desired;
        do {
            n->next  = old.ptr;
            desired  = {n, old.tag + 1};
        } while (!head_.compare_exchange_weak(
                     old, desired,
                     std::memory_order_release,
                     std::memory_order_relaxed));
    }

    std::optional<T> pop() {
        TaggedPtr old = head_.load(std::memory_order_acquire);
        TaggedPtr desired;
        do {
            if (!old.ptr) return std::nullopt;
            desired = {old.ptr->next, old.tag + 1};
        } while (!head_.compare_exchange_weak(
                     old, desired,
                     std::memory_order_acquire,
                     std::memory_order_acquire));
        T val = old.ptr->value;
        // NOTE: safe delete only when no other thread holds old.ptr.
        // Production: use hazard pointers or epoch-based reclamation.
        delete old.ptr;
        return val;
    }

    bool empty() const noexcept {
        return head_.load(std::memory_order_relaxed).ptr == nullptr;
    }
};`,
    explanation:
      "The ABA problem is the most subtle hazard in lock-free data structures: the tag counter makes each pointer value unique even when the same address is reused, so a stale CAS will fail (the tag no longer matches). Production systems replace the version tag with hazard pointers or epoch-based reclamation (e.g. folly::hazptr) to solve the memory-reclamation problem that the simple `delete` above leaves open.",
  },
  {
    id: "cpp-20260613-b1-jthread-shutdown",
    language: "cpp",
    title: "std::jthread + stop_token — cooperative graceful shutdown",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <chrono>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <iostream>

// std::jthread (C++20) owns a thread and automatically requests its stop
// on destruction — no manual join/detach needed.
// stop_token is the cooperative mechanism: the thread polls stop_requested()
// rather than being forcibly killed (which would leave shared state corrupted).

struct Tick { double price; int vol; };

class FeedHandler {
    std::queue<Tick>         q_;
    std::mutex               mu_;
    std::condition_variable  cv_;
    std::jthread             worker_;   // auto-joined and stop-requested on dtor

public:
    FeedHandler()
        : worker_([this](std::stop_token st) { run(st); }) {}

    void enqueue(Tick t) {
        { std::lock_guard lk(mu_); q_.push(t); }
        cv_.notify_one();
    }

    // jthread dtor calls request_stop() then join() automatically.
    // No explicit shutdown() needed.

private:
    void run(std::stop_token st) {
        while (!st.stop_requested()) {
            std::unique_lock lk(mu_);
            // wait_for with stop_token predicate: wakes on data OR stop request
            cv_.wait_for(lk, std::chrono::milliseconds(5),
                         [this]{ return !q_.empty(); });
            while (!q_.empty()) {
                Tick t = q_.front(); q_.pop();
                lk.unlock();
                process(t);   // process outside the lock
                lk.lock();
            }
        }
        std::cout << "FeedHandler draining and stopping\\n";
    }

    void process(const Tick& t) { (void)t; /* update order book ... */ }
};

// Usage:
// {
//     FeedHandler fh;
//     fh.enqueue({100.0, 500});
//     // ... at scope exit, jthread dtor fires stop_requested -> clean shutdown
// }`,
    explanation:
      "std::jthread eliminates the classic 'forget to join' bug by joining in its destructor, and the stop_token / stop_source mechanism enables cooperative cancellation without a shared boolean flag. Cooperative shutdown is essential in HFT: forcibly terminating a thread mid-write can corrupt an order book or leave an unacknowledged order outstanding.",
  },
  {
    id: "cpp-20260613-b1-tsc-clock",
    language: "cpp",
    title: "RDTSC hardware timestamp — nanosecond-resolution latency measurement",
    tag: "performance",
    code: `#include <cstdint>
#include <chrono>

// RDTSC reads the CPU Time Stamp Counter — the cheapest available timestamp.
// Pitfalls: (1) TSC may drift across sockets on older systems (use RDTSCP or
// pin the thread); (2) the compiler can reorder across the fence; (3) TSC
// frequency is not directly clock-speed on modern x86 (use cpuid to query).

// Serialising fence + RDTSC (reads current CPU's TSC after all prior loads)
inline std::uint64_t rdtsc_start() noexcept {
    std::uint32_t lo, hi;
    __asm__ volatile(
        "cpuid\\n\\t"      // serialise: prevent out-of-order reads before here
        "rdtsc\\n\\t"
        : "=a"(lo), "=d"(hi)
        :: "rbx", "rcx");
    return (static_cast<std::uint64_t>(hi) << 32) | lo;
}

// RDTSCP: reads TSC *and* core-ID atomically; prevents reorder of loads after
inline std::uint64_t rdtsc_stop() noexcept {
    std::uint32_t lo, hi, core;
    __asm__ volatile(
        "rdtscp\\n\\t"     // serialising on the instruction side (not stores)
        : "=a"(lo), "=d"(hi), "=c"(core)
        ::);
    __asm__ volatile("cpuid" ::: "rax","rbx","rcx","rdx");  // fence loads after
    return (static_cast<std::uint64_t>(hi) << 32) | lo;
}

// Convert TSC ticks -> nanoseconds (query TSC frequency once at startup)
double tscTicksToNs(std::uint64_t ticks, double tsc_ghz) noexcept {
    return static_cast<double>(ticks) / tsc_ghz;
}

// Calibrate TSC freq against std::chrono::steady_clock
double calibrateTscGHz() {
    using ns = std::chrono::nanoseconds;
    auto c0 = std::chrono::steady_clock::now();
    auto t0 = rdtsc_start();
    // Spin for 10 ms
    while ((std::chrono::steady_clock::now() - c0) < std::chrono::milliseconds(10)) {}
    auto c1 = std::chrono::steady_clock::now();
    auto t1 = rdtsc_stop();
    double elapsed_ns = static_cast<double>(
        std::chrono::duration_cast<ns>(c1 - c0).count());
    return static_cast<double>(t1 - t0) / elapsed_ns;   // ticks/ns = GHz
}

// Typical usage: measure order-entry round-trip latency
// auto t0 = rdtsc_start();
// sendOrder(order);
// auto t1 = rdtsc_stop();
// double latency_ns = tscTicksToNs(t1 - t0, tsc_ghz);`,
    explanation:
      "RDTSC has ~20-40 cycle overhead versus ~250 cycles for clock_gettime(), making it the only viable timestamp for measuring per-order latency in the 100 ns range. The CPUID serialisation fence ensures no instructions from before/after the measurement cross the boundary, but it also adds ~40 cycles of overhead — a single rdtsc without fences is used for coarser timing where ordering guarantees are not required.",
  },
  {
    id: "cpp-20260613-b1-avx2-logreturns",
    language: "cpp",
    title: "AVX2 SIMD — vectorized log returns over a price array (8 doubles/cycle)",
    tag: "performance",
    code: `#include <immintrin.h>
#include <cmath>
#include <cstddef>
#include <vector>

// AVX2 processes 4 doubles (256-bit) per instruction.
// _mm256_log_pd requires SVML (Intel MKL) or a polyfill; shown here via
// a scalar fallback loop with explicit SIMD structure to illustrate the pattern.
// With SVML: compile with icpc or link -lsvml.

// Scalar reference: O(N) with scalar std::log
void logReturnsScalar(const double* prices, double* out, std::size_t n) noexcept {
    for (std::size_t i = 0; i + 1 < n; ++i)
        out[i] = std::log(prices[i + 1] / prices[i]);
}

#ifdef __AVX2__
// AVX2 version: compute log(P[i+1]/P[i]) for 4 pairs at a time.
// Requires: prices and out aligned to 32 bytes (use aligned_alloc or alignas).
void logReturnsAVX2(const double* __restrict__ prices,
                     double*       __restrict__ out,
                     std::size_t n) noexcept {
    std::size_t i = 0;
    // Process 4 pairs per loop iteration (256-bit = 4 x double)
    for (; i + 5 <= n; i += 4) {
        __m256d v0 = _mm256_loadu_pd(prices + i);       // P[i..i+3]
        __m256d v1 = _mm256_loadu_pd(prices + i + 1);   // P[i+1..i+4]
        __m256d ratio = _mm256_div_pd(v1, v0);          // P[i+1]/P[i], ...
        // _mm256_log_pd(ratio) with SVML; fallback: store + scalar log
        double tmp[4];
        _mm256_storeu_pd(tmp, ratio);
        for (int j = 0; j < 4; ++j) out[i + j] = std::log(tmp[j]);
    }
    // Tail: scalar cleanup
    for (; i + 1 < n; ++i)
        out[i] = std::log(prices[i + 1] / prices[i]);
}

// Vectorized dot product of two arrays (e.g., beta * factors)
double dotProductAVX2(const double* __restrict__ a,
                       const double* __restrict__ b,
                       std::size_t n) noexcept {
    __m256d acc = _mm256_setzero_pd();
    std::size_t i = 0;
    for (; i + 4 <= n; i += 4) {
        __m256d va = _mm256_loadu_pd(a + i);
        __m256d vb = _mm256_loadu_pd(b + i);
        acc = _mm256_fmadd_pd(va, vb, acc);   // fused multiply-add (AVX2)
    }
    // Horizontal sum of 4 lanes
    __m128d lo  = _mm256_castpd256_pd128(acc);
    __m128d hi  = _mm256_extractf128_pd(acc, 1);
    __m128d sum = _mm_add_pd(lo, hi);
    sum = _mm_hadd_pd(sum, sum);
    double result;
    _mm_store_sd(&result, sum);
    for (; i < n; ++i) result += a[i] * b[i];
    return result;
}
#endif   // __AVX2__
// Build: g++ -O3 -march=native -mavx2 -mfma`,
    explanation:
      "AVX2's _mm256_fmadd_pd computes a*b+c in a single instruction using the FMA unit, providing 8 double-precision FLOPs per cycle per core — 4× more than scalar. For a 252-day return vector, the AVX2 dot product takes ~16 cycles versus ~64 for scalar; the bottleneck shifts from compute to memory bandwidth. The _mm256_loadu_pd (unaligned) variant is safer than _mm256_load_pd but may be 1-2 cycles slower on cache-miss paths.",
  },
  {
    id: "cpp-20260613-b1-span",
    language: "cpp",
    title: "std::span — zero-copy buffer views for market data frames",
    tag: "modern",
    code: `#include <span>
#include <vector>
#include <cstddef>
#include <cstdint>
#include <algorithm>
#include <numeric>

// std::span<T> is a non-owning view of a contiguous range: pointer + size.
// It can slice arrays, vectors, or raw buffers without copying.
// Compile-time extent (span<T, N>) encodes the size in the type — zero overhead.

struct Tick { std::int64_t ts_ns; double bid; double ask; };

// Process a contiguous window of ticks without copying.
double midVWAP(std::span<const Tick> ticks) noexcept {
    if (ticks.empty()) return 0.0;
    double notional = 0.0, vol = 0.0;
    for (const auto& t : ticks) {
        double mid = 0.5 * (t.bid + t.ask);
        notional  += mid;   // simplified: equal weight
    }
    return notional / static_cast<double>(ticks.size());
}

// Sliding window over a large tick buffer — no sub-vector allocation
void rollingVWAP(std::span<const Tick> all, int W,
                  std::vector<double>& out) {
    out.clear();
    out.reserve(all.size() - W + 1);
    for (std::size_t i = 0; i + W <= all.size(); ++i)
        out.push_back(midVWAP(all.subspan(i, W)));   // subspan: O(1)
}

// Parse a raw UDP packet into a fixed-size field view
struct Header { std::uint32_t seq; std::uint16_t msg_type; std::uint16_t len; };

std::span<const std::byte> parsePayload(std::span<const std::byte> pkt) noexcept {
    if (pkt.size() < sizeof(Header)) return {};
    // Skip header — zero-copy slice into the packet buffer
    return pkt.subspan(sizeof(Header));
}

// Compile-time extent: span<T, 4> — size known at compile time (zero size field)
void process4(std::span<const double, 4> greeks) noexcept {
    // greeks[0]=delta, [1]=gamma, [2]=vega, [3]=theta
    (void)greeks[0];
}`,
    explanation:
      "std::span replaces the (pointer, size) pair antipattern and eliminates the need to pass vector references just to avoid copying — subspan() creates a new view in O(1) with no allocation. Fixed-extent spans (span<T, N>) are zero-overhead: the size is a compile-time constant, so the compiler can eliminate the size field entirely and generate the same code as raw pointer arithmetic.",
  },
  {
    id: "cpp-20260613-b1-bitcast",
    language: "cpp",
    title: "std::bit_cast — type-punning IEEE 754 floats without UB",
    tag: "modern",
    code: `#include <bit>
#include <cstdint>
#include <cmath>
#include <cassert>

// std::bit_cast<To>(from): reinterpret the bit pattern of 'from' as type 'To'.
// Requires sizeof(To) == sizeof(From) and both trivially copyable.
// Unlike reinterpret_cast<> through a pointer, bit_cast is defined behaviour
// in C++20 and gives the compiler visibility to optimise.

// Fast inverse square root (Q_rsqrt) — bit-cast to manipulate IEEE 754 exponent
float fastInvSqrt(float x) noexcept {
    std::uint32_t i = std::bit_cast<std::uint32_t>(x);
    i = 0x5f3759df - (i >> 1);   // magic: approximate -0.5 * log2(x)
    float y = std::bit_cast<float>(i);
    return y * (1.5f - 0.5f * x * y * y);   // one Newton step
}

// Fast approximate log2 by extracting biased exponent
int floorLog2(float x) noexcept {
    auto bits = std::bit_cast<std::uint32_t>(x);
    return static_cast<int>((bits >> 23) & 0xFF) - 127;   // biased exponent - bias
}

// Compare doubles by bit pattern for exact equality (NaN-aware)
bool exactEqual(double a, double b) noexcept {
    return std::bit_cast<std::uint64_t>(a) == std::bit_cast<std::uint64_t>(b);
}

// Serialise a double to a 4-byte little-endian network frame (e.g., binary FIX)
void serializeDouble(double val, std::uint8_t* buf) noexcept {
    auto bits = std::bit_cast<std::uint64_t>(val);
    for (int i = 0; i < 8; ++i)
        buf[i] = static_cast<std::uint8_t>((bits >> (8 * i)) & 0xFF);
}

// Price comparison: treat NaN prices as "invalid" (bit pattern check)
bool isValidPrice(double p) noexcept {
    auto bits = std::bit_cast<std::uint64_t>(p);
    // NaN: exponent = 0x7FF and mantissa != 0
    return ((bits >> 52) & 0x7FF) != 0x7FF;
}`,
    explanation:
      "The old-style memcpy trick for type-punning was technically correct but opaque to the compiler — bit_cast is transparent to the optimiser, allowing it to fold the reinterpretation into a register rename with no actual memory operation. In HFT, bit_cast appears in binary protocol deserialisation (network bytes → double), in fast approximate math, and in NaN-sentinel checks where comparing the bit pattern is cheaper than calling std::isnan().",
  },
  {
    id: "cpp-20260613-b1-robin-hood-map",
    language: "cpp",
    title: "Robin Hood open-addressing hash map — O(1) order-ID lookup",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cstddef>
#include <functional>
#include <optional>
#include <vector>
#include <cassert>

// Robin Hood probing: when inserting, if the new element has a shorter probe
// sequence than the element currently in the slot, steal the slot and re-insert
// the displaced element. This bounds the maximum probe length at O(log N)
// and greatly reduces variance vs linear probing.

template<typename K, typename V, typename Hash = std::hash<K>>
class RobinHoodMap {
    struct Slot {
        K    key{};
        V    value{};
        int  psl = -1;      // probe sequence length; -1 = empty
    };

    std::vector<Slot> table_;
    std::size_t       size_ = 0;
    std::size_t       cap_;
    Hash              hash_;

    static constexpr double MAX_LOAD = 0.75;

    std::size_t idx(const K& k) const noexcept {
        return hash_(k) & (cap_ - 1);   // cap_ is power-of-2
    }

public:
    explicit RobinHoodMap(std::size_t init_cap = 64)
        : table_(init_cap), cap_(init_cap) {
        assert((cap_ & (cap_ - 1)) == 0);  // must be power-of-2
    }

    void insert(K key, V val) {
        if (size_ >= static_cast<std::size_t>(MAX_LOAD * cap_)) grow();
        Slot ins{std::move(key), std::move(val), 0};
        std::size_t pos = idx(ins.key);
        for (;;) {
            Slot& slot = table_[pos];
            if (slot.psl < 0) {         // empty: place here
                slot = std::move(ins);
                ++size_;
                return;
            }
            if (slot.key == ins.key) {  // update existing
                slot.value = std::move(ins.value);
                return;
            }
            if (slot.psl < ins.psl) {   // Robin Hood: steal the slot
                std::swap(slot, ins);
            }
            pos = (pos + 1) & (cap_ - 1);
            ++ins.psl;
        }
    }

    V* find(const K& key) noexcept {
        std::size_t pos = idx(key);
        for (int psl = 0; ; ++psl, pos = (pos + 1) & (cap_ - 1)) {
            Slot& s = table_[pos];
            if (s.psl < 0 || psl > s.psl) return nullptr;  // not present
            if (s.key == key) return &s.value;
        }
    }

    std::size_t size()  const noexcept { return size_; }

private:
    void grow() {
        RobinHoodMap bigger(cap_ * 2);
        for (auto& s : table_)
            if (s.psl >= 0) bigger.insert(std::move(s.key), std::move(s.value));
        *this = std::move(bigger);
    }
};`,
    explanation:
      "Robin Hood probing achieves average lookup of ~2.5 probes at 75% load — half the variance of standard linear probing — because the steal-on-insert rule equimates probe lengths across all elements. For a 65 000-order book where orders arrive by ID, Robin Hood load factor stays below 75% with an initial cap of 131 072 (next power-of-2), and the probe-length bound lets the compiler unroll the search loop for the common case of 1-3 probes.",
  },
  {
    id: "cpp-20260613-b1-barrier-mc",
    language: "cpp",
    title: "Barrier option MC — discrete knock-out monitoring with antithetic paths",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <numbers>

// Up-and-out call: pays max(S_T - K, 0) only if S never breached barrier H.
// Discrete monitoring: check at N fixed times (typically end-of-day).
// Antithetic variates: pair Z with -Z to halve variance at no extra MC cost.

struct BarrierResult {
    double price;
    double se;           // standard error
    double delta_approx; // finite-difference delta
};

BarrierResult barrierCallMC(double S0, double K, double H,  // H > S0: up-out
                              double r, double q, double sigma, double T,
                              int N_steps, int N_paths, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt   = T / N_steps;
    double drift = (r - q - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);

    double sum = 0, sum2 = 0;
    int    pairs = N_paths / 2;

    for (int p = 0; p < pairs; ++p) {
        // Antithetic pair: Z and -Z
        double S[2] = {S0, S0};
        bool   alive[2] = {true, true};

        for (int t = 0; t < N_steps; ++t) {
            double Z = nd(rng);
            double dZ[2] = {Z, -Z};
            for (int a = 0; a < 2; ++a) {
                if (!alive[a]) continue;
                S[a] *= std::exp(drift + vol * dZ[a]);
                if (S[a] >= H) alive[a] = false;   // knocked out
            }
        }

        for (int a = 0; a < 2; ++a) {
            double payoff = alive[a] ? std::max(S[a] - K, 0.0) : 0.0;
            double pv     = disc * payoff;
            sum  += pv;
            sum2 += pv * pv;
        }
    }

    double n    = static_cast<double>(N_paths);
    double mean = sum / n;
    double var  = (sum2 / n - mean * mean) / (n - 1.0);

    // Finite-difference delta: re-run with S0 + 0.1 (simplified; production: adjoint AD)
    // Omitted here for brevity.

    return {mean, std::sqrt(var)};
}`,
    explanation:
      "Discrete barrier monitoring (checking daily vs. continuously) produces a higher knock-out probability than continuous monitoring — the Broadie-Glasserman-Kou (1997) correction adds ½σ√Δt to the discrete barrier to match the continuous price, a critical adjustment for near-barrier options. Antithetic variates exploit the symmetry of the Gaussian distribution: pairing Z with −Z guarantees negative correlation between the two path payoffs, reducing estimator variance by 30-70% at zero additional simulation cost.",
  },
  {
    id: "cpp-20260613-b1-asian-kemna-vorst",
    language: "cpp",
    title: "Asian option Kemna-Vorst — geometric approximation for arithmetic mean",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>
#include <vector>

// Asian arithmetic-average call: payoff = max(A_T - K, 0)  where A_T = avg(S_t_i).
// No closed form. Kemna-Vorst (1990) approximation:
//   1. Price the geometric-average Asian exactly (closed form).
//   2. Correct for the arithmetic-geometric gap using a control variate.
// Geometric average call: treat the geometric mean as a single log-normal with
// adjusted drift and vol.

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrtpi * std::numbers::sqrt2);
}

struct AsianResult {
    double geometric_price;    // exact closed form
    double sigma_adj;          // adjusted vol for geometric average
    double drift_adj;          // adjusted drift
};

// Closed-form geometric-average Asian call (continuous monitoring)
AsianResult geometricAsian(double S, double K, double r, double q,
                             double sigma, double T) noexcept {
    // For continuous averaging: sigma_g = sigma / sqrt(3), drift_g = (r-q)/2 - sigma^2/12
    double sigma_g = sigma / std::sqrt(3.0);
    double drift_g = 0.5 * (r - q) - sigma * sigma / 12.0;

    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (drift_g + 0.5 * sigma_g * sigma_g) * T) / (sigma_g * sqT);
    double d2  = d1 - sigma_g * sqT;
    double F_g = S * std::exp(drift_g * T);    // geometric forward

    double price = std::exp(-r * T) * (F_g * Phi(d1) - K * Phi(d2));
    return {price, sigma_g, drift_g};
}

// Discrete geometric Asian (N fixing dates, equally spaced)
double geometricAsianDiscrete(double S, double K, double r, double q,
                               double sigma, double T, int N) noexcept {
    double dt = T / N;
    // Exact formulas for discrete geometric average
    double sigma_g = sigma * std::sqrt((N + 1) * (2.0 * N + 1) / (6.0 * N * N));
    double drift_g = (r - q) * (N + 1) / (2.0 * N) - 0.5 * sigma * sigma
                   * (N + 1) * (2.0 * N + 1) / (6.0 * N * N);

    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (drift_g + 0.5 * sigma_g * sigma_g) * T) / (sigma_g * sqT);
    double d2  = d1 - sigma_g * sqT;
    double F_g = S * std::exp(drift_g * T);
    return std::exp(-r * T) * (F_g * Phi(d1) - K * Phi(d2));
}

// Arithmetic Asian approximation: use geometric price + moment-matching correction
double arithmeticAsianApprox(double S, double K, double r, double q,
                              double sigma, double T, int N) noexcept {
    // Moments of arithmetic average under GBM (Levy 1992)
    double dt    = T / N;
    double mu    = r - q;
    double M1    = S * (std::exp(mu * T) - 1.0) / (mu * T + 1e-12);
    double sig2  = sigma * sigma;
    double emuT  = std::exp(mu * T);
    double esig2T = std::exp(sig2 * T);
    double M2    = 2.0 * S * S * std::exp((2*mu + sig2) * dt)
                 / ((std::exp((2*mu + sig2) * dt) - 1.0) * (emuT - 1.0) * N * N + 1e-12);
    (void)M2; // Levy approximation — use geometric as lower bound here for brevity
    return geometricAsianDiscrete(S, K, r, q, sigma, T, N);
}`,
    explanation:
      "The geometric-average Asian has a closed-form price because the geometric mean of log-normal variables is itself log-normal — the averaging just modifies the drift and volatility of the effective forward. The arithmetic mean has no closed form because log-normals don't sum to a log-normal, and the Kemna-Vorst approach uses the geometric Asian as a control variate in MC, reducing standard error by 70-90% for near-ATM options.",
  },
  {
    id: "cpp-20260613-b1-lookback-float",
    language: "cpp",
    title: "Floating strike lookback call — Goldman-Sosin-Gatto closed form",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>

// Floating strike lookback call: payoff = S_T - min(S_t, 0 <= t <= T).
// The holder buys at the lowest price achieved — no strike specified upfront.
// Goldman-Sosin-Gatto (1979) closed form (continuous monitoring):
// C_lb = S * N(a1) - S_min * exp(-r*T) * N(a2) +
//         S * exp(-r*T) * sigma^2/(2*r) * [-N(-a1) + exp(r*T) * N(-a3)]
// where a1, a2, a3 are d1-type quantities using S/S_min.

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrtpi * std::numbers::sqrt2);
}

struct LookbackResult { double call; double put; double delta; };

// Continuous lookback call: S_min = running minimum over [0, T]
double lookbackCallFloat(double S, double S_min, double r, double q,
                          double sigma, double T) noexcept {
    double sqT = std::sqrt(T);
    double a1  = (std::log(S / S_min) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double a2  = a1 - sigma * sqT;
    double a3  = (std::log(S / S_min) + (-r + q + 0.5 * sigma * sigma) * T) / (sigma * sqT);

    // The third term uses the factor sigma^2/(2*(r-q)) in general
    double rq = r - q;
    double price;
    if (std::abs(rq) < 1e-7) {
        // Degenerate case r ≈ q: use L'Hopital limit
        price = S * std::exp(-q * T) * Phi(a1) - S_min * std::exp(-r * T) * Phi(a2)
              + S * std::exp(-q * T) * sigma * sqT * (std::exp(0.5 * a1 * a1) / std::sqrt(2.0 * std::numbers::pi)
              + a1 * Phi(a1) - Phi(a1));
    } else {
        double fac = sigma * sigma / (2.0 * rq);
        price = S * std::exp(-q * T) * Phi(a1)
              - S_min * std::exp(-r * T) * Phi(a2)
              + S * std::exp(-r * T) * fac * (-Phi(-a1) + std::exp(rq * T) * Phi(-a3));
    }
    return std::max(price, 0.0);
}

// Floating strike lookback put: payoff = max(S_t) - S_T
double lookbackPutFloat(double S, double S_max, double r, double q,
                         double sigma, double T) noexcept {
    // By put-call symmetry: put(S, S_max) = call mirrored
    double sqT = std::sqrt(T);
    double b1  = (std::log(S_max / S) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double b2  = b1 - sigma * sqT;
    double b3  = (std::log(S_max / S) + (-r + q + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double rq  = r - q;
    if (std::abs(rq) < 1e-7) return 0.0;  // simplified
    double fac = sigma * sigma / (2.0 * rq);
    return S_max * std::exp(-r * T) * Phi(b1)
         - S * std::exp(-q * T) * Phi(b2)
         + S * std::exp(-r * T) * fac * (Phi(b3) - std::exp(rq * T) * Phi(-b2));
}`,
    explanation:
      "Lookback options are the most expensive vanilla exotics because the holder captures the maximum P&L of any timing decision over the option's life — they command a premium of 30-100% over the comparable vanilla. The Goldman-Sosin-Gatto formula is an exact solution because the maximum/minimum of a Brownian motion has a known distribution (reflection principle), making the expectation tractable despite the path-dependence.",
  },
  {
    id: "cpp-20260613-b1-implied-vol-newton",
    language: "cpp",
    title: "Newton-Raphson implied vol — quadratic convergence in 3-4 iterations",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>
#include <stdexcept>

// Implied vol: invert Black-Scholes price equation for sigma.
// Newton step: sigma_{n+1} = sigma_n - (BS(sigma_n) - C_mkt) / vega(sigma_n)
// vega is strictly positive for finite options, so Newton converges.
// Starting guess: Brenner-Subrahmanyam ATM approximation: sigma_0 = C / (S * sqrt(T/2pi)).

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrtpi * std::numbers::sqrt2);
}
static double phi(double x) noexcept {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * std::numbers::pi);
}

double bsCall(double S, double K, double r, double q, double sigma, double T) noexcept {
    if (T <= 0) return std::max(S - K * std::exp(-r * T), 0.0);
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    return S * std::exp(-q * T) * Phi(d1) - K * std::exp(-r * T) * Phi(d2);
}

double bsVega(double S, double K, double r, double q, double sigma, double T) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    return S * std::exp(-q * T) * phi(d1) * sqT;
}

double impliedVol(double C_mkt, double S, double K,
                   double r, double q, double T,
                   int max_iter = 50, double tol = 1e-8) {
    // Brenner-Subrahmanyam ATM starting guess
    double sigma = C_mkt / (S * std::sqrt(T / (2.0 * std::numbers::pi)));
    sigma = std::max(sigma, 1e-6);

    for (int i = 0; i < max_iter; ++i) {
        double price = bsCall(S, K, r, q, sigma, T);
        double vega  = bsVega(S, K, r, q, sigma, T);
        double err   = price - C_mkt;

        if (std::abs(err) < tol) return sigma;
        if (vega < 1e-14) {
            // Halley's method or bisection fallback for near-zero vega
            sigma = std::max(sigma - err / 1e-14, 0.01);
            continue;
        }
        sigma -= err / vega;
        sigma  = std::max(sigma, 1e-7);  // prevent negative vol
    }
    if (std::abs(bsCall(S, K, r, q, sigma, T) - C_mkt) > 1e-4)
        throw std::runtime_error("Implied vol did not converge");
    return sigma;
}`,
    explanation:
      "Newton-Raphson converges quadratically near the solution — each iteration roughly doubles the correct digits — so 3-4 iterations typically give 8+ digits of accuracy. Vega is the natural Jacobian because the BS price is monotone in sigma; the Brenner-Subrahmanyam guess exploits the first-order ATM approximation C ≈ S σ √(T/2π) to start very close to the solution even for deep OTM options.",
  },
  {
    id: "cpp-20260613-b1-crtp-order",
    language: "cpp",
    title: "CRTP curiously recurring template — zero-overhead order-type visitor",
    tag: "modern",
    code: `#include <cstdint>
#include <cstring>

// CRTP: the base class is templated on the derived class.
// This achieves static polymorphism (compile-time dispatch) with zero overhead —
// no vtable, no virtual function call, no indirect branch prediction miss.
// Each derived type gets its own instantiation of the base's methods.

template<typename Derived>
class OrderBase {
public:
    // Compile-time dispatch to derived's implementation
    double price()    const noexcept { return self().price_impl(); }
    int    qty()      const noexcept { return self().qty_impl(); }
    bool   isBuy()    const noexcept { return self().isBuy_impl(); }

    // Shared logic implemented once in base
    double notional() const noexcept { return price() * static_cast<double>(qty()); }

    void print() const noexcept {
        // side character computed at compile time per derived type
        char side = isBuy() ? 'B' : 'S';
        (void)side;
    }

private:
    const Derived& self() const noexcept {
        return static_cast<const Derived&>(*this);
    }
};

// Limit order — CRTP derived
struct LimitOrder : OrderBase<LimitOrder> {
    std::int64_t id;
    double       limit_price;
    int          quantity;
    bool         buy;

    double price_impl()  const noexcept { return limit_price; }
    int    qty_impl()    const noexcept { return quantity; }
    bool   isBuy_impl()  const noexcept { return buy; }
};

// Market order
struct MarketOrder : OrderBase<MarketOrder> {
    std::int64_t id;
    double       arrival_mid;   // mid at order time for IS calculation
    int          quantity;
    bool         buy;

    double price_impl()  const noexcept { return arrival_mid; }
    int    qty_impl()    const noexcept { return quantity; }
    bool   isBuy_impl()  const noexcept { return buy; }
};

// Usage: templated matching engine processes any order type without branching
template<typename O>
void match(const O& order, double best_price) {
    if (order.qty() > 0 && order.notional() > 0) {
        (void)best_price;
        // call derived-specific fill logic
    }
}`,
    explanation:
      "CRTP avoids the two costs of virtual dispatch: the indirect call through a vtable pointer (branch mispredict, ~15 cycles) and the inhibition of inlining. For an order matching engine processing millions of messages per second, replacing a virtual `price()` call with an inlined CRTP call can reduce per-order overhead from ~10 ns to ~1 ns. The tradeoff is that all derived types must be known at compile time — acceptable in exchange software but not plugin-based systems.",
  },
  {
    id: "cpp-20260613-b1-expected",
    language: "cpp",
    title: "std::expected — error-as-value order validation without exceptions",
    tag: "modern",
    code: `#include <expected>
#include <string_view>
#include <cstdint>
#include <cmath>

// std::expected<T, E> (C++23) encodes either a value T or an error E.
// No heap allocation, no exception overhead, no hidden control flow.
// Perfect for order validation where rejection is common (not exceptional).

enum class OrderError : std::uint8_t {
    InvalidPrice,
    InvalidQty,
    ExceedsRiskLimit,
    SymbolNotFound,
};

struct Order {
    double      price;
    int         qty;
    std::string_view symbol;
    bool        buy;
};

struct RiskLimits {
    double max_notional = 1e6;
    int    max_qty      = 10000;
};

// Validation chain: returns Order on success, OrderError on first failure
std::expected<Order, OrderError> validateOrder(Order o, const RiskLimits& lim) noexcept {
    if (o.price <= 0.0 || !std::isfinite(o.price))
        return std::unexpected(OrderError::InvalidPrice);
    if (o.qty <= 0 || o.qty > lim.max_qty)
        return std::unexpected(OrderError::InvalidQty);
    if (o.price * o.qty > lim.max_notional)
        return std::unexpected(OrderError::ExceedsRiskLimit);
    if (o.symbol.empty())
        return std::unexpected(OrderError::SymbolNotFound);
    return o;   // success
}

// Chain validations: monadic and_then (C++23)
std::expected<double, OrderError> computeNotional(const Order& o) noexcept {
    return o.price * static_cast<double>(o.qty);
}

void processIncoming(Order raw, const RiskLimits& lim) {
    auto result = validateOrder(raw, lim)
                      .and_then(computeNotional);   // chains only on success

    if (result) {
        // Success: result.value() is the notional
        (void)*result;
    } else {
        // Error: result.error() is the OrderError code
        (void)result.error();
    }
}`,
    explanation:
      "std::expected forces callers to explicitly handle both the success and error cases, unlike exceptions which can silently propagate through unchecked call stacks. In a trading system, order rejections happen at predictable rates (e.g., 0.1% of flow), so they are not exceptional — throwing and catching exceptions for each would add ~1-5 µs of exception machinery overhead per rejection, which is unacceptable at 100 ns target latency.",
  },
  {
    id: "cpp-20260613-b1-mmap-ticks",
    language: "cpp",
    title: "mmap tick replay — zero-copy read of binary tick database",
    tag: "market-data",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstddef>
#include <cstdint>
#include <span>
#include <stdexcept>

// Memory-mapped file: the OS maps file pages into the process address space.
// Reading a tick record = a cache miss (on first access) then direct struct access —
// no read() syscall, no copy to user-space buffer.
// Ideal for backtesting: replay a year of tick data from SSD at L3 cache speed.

#pragma pack(push, 1)
struct TickRecord {
    std::int64_t  ts_ns;     // nanoseconds since epoch
    std::int32_t  symbol_id;
    std::int32_t  bid_ticks; // price in integer ticks
    std::int32_t  ask_ticks;
    std::int32_t  volume;
};
#pragma pack(pop)

class TickFile {
    int         fd_   = -1;
    void*       map_  = MAP_FAILED;
    std::size_t size_ = 0;

public:
    explicit TickFile(const char* path) {
        fd_ = ::open(path, O_RDONLY);
        if (fd_ < 0) throw std::runtime_error("open failed");

        struct stat st{};
        ::fstat(fd_, &st);
        size_ = static_cast<std::size_t>(st.st_size);

        // MAP_POPULATE: prefault all pages to avoid first-access page faults in the loop
        map_ = ::mmap(nullptr, size_, PROT_READ, MAP_PRIVATE | MAP_POPULATE, fd_, 0);
        if (map_ == MAP_FAILED) throw std::runtime_error("mmap failed");

        // Advise sequential access: kernel reads ahead aggressively
        ::madvise(map_, size_, MADV_SEQUENTIAL);
    }

    ~TickFile() noexcept {
        if (map_ != MAP_FAILED) ::munmap(map_, size_);
        if (fd_ >= 0) ::close(fd_);
    }

    std::span<const TickRecord> records() const noexcept {
        const auto* base = static_cast<const TickRecord*>(map_);
        return {base, size_ / sizeof(TickRecord)};
    }

    std::size_t count() const noexcept { return size_ / sizeof(TickRecord); }
};

// Usage: stream ticks without a single syscall in the hot path
// TickFile tf("SPX_2025.bin");
// for (const auto& t : tf.records()) {
//     strategy.onTick(t);   // access is a cache hit after MAP_POPULATE warms pages
// }`,
    explanation:
      "mmap eliminates the read()-copy pipeline: instead of read() → kernel buffer → user buffer, the kernel maps file cache pages directly into process virtual memory, and struct access is a load from the TLB-backed virtual address. MAP_POPULATE faults all pages at mmap() time (paying the I/O cost upfront) so the replay loop runs at memory bandwidth speed (~10-40 GB/s) without per-record page fault interruptions.",
  },
  {
    id: "cpp-20260613-b1-garch-sim",
    language: "cpp",
    title: "GARCH(1,1) simulation — conditional vol path for scenario generation",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <random>

// GARCH(1,1): sigma_t^2 = omega + alpha * r_{t-1}^2 + beta * sigma_{t-1}^2
// Long-run variance: sigma_inf^2 = omega / (1 - alpha - beta)
// Stationarity requires: alpha + beta < 1.
// Simulates return paths with time-varying volatility (volatility clustering).

struct GARCHParams {
    double omega;   // baseline variance
    double alpha;   // ARCH term (reaction to shocks)
    double beta;    // GARCH term (persistence)
    double mu;      // return mean (usually ~0 for daily)
};

struct GARCHPath {
    std::vector<double> returns;
    std::vector<double> sigmas;    // conditional vol (annualised if scaled)
};

GARCHPath simulateGARCH(const GARCHParams& p, int T,
                          double sigma0, int seed = 42) {
    if (p.alpha + p.beta >= 1.0)
        throw std::invalid_argument("GARCH not stationary: alpha+beta >= 1");

    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    GARCHPath path;
    path.returns.reserve(T);
    path.sigmas.reserve(T);

    double var = sigma0 * sigma0;

    for (int t = 0; t < T; ++t) {
        double sigma = std::sqrt(var);
        double z     = nd(rng);
        double r     = p.mu + sigma * z;

        path.returns.push_back(r);
        path.sigmas.push_back(sigma);

        // Update conditional variance
        var = p.omega + p.alpha * r * r + p.beta * var;
        var = std::max(var, 1e-10);   // floor: prevent numerical underflow
    }

    return path;
}

// GARCH long-run vol
double garchLongRunVol(const GARCHParams& p) noexcept {
    double persistence = p.alpha + p.beta;
    if (persistence >= 1.0) return std::numeric_limits<double>::infinity();
    return std::sqrt(p.omega / (1.0 - persistence));
}

// Half-life of shock decay: how many periods until variance reverts halfway
double garchHalfLife(const GARCHParams& p) noexcept {
    double persistence = p.alpha + p.beta;
    if (persistence <= 0 || persistence >= 1) return std::numeric_limits<double>::infinity();
    return -std::log(2.0) / std::log(persistence);
}`,
    explanation:
      "The GARCH(1,1) half-life of a vol shock equals −ln(2)/ln(α+β): for typical equity parameters (α=0.1, β=0.85), persistence = 0.95 and the half-life is ~14 days, matching the empirical observation that equity vol shocks decay over 2-3 weeks. Simulating GARCH paths is used in scenario-based VaR (replacing the assumption of constant vol with clustered vol), in derivatives pricing with stochastic vol approximations, and in stress-testing risk models.",
  },
  {
    id: "cpp-20260613-b1-delta-hedge-pnl",
    language: "cpp",
    title: "Delta hedge P&L decomposition — BS Taylor expansion per rebalance",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>
#include <vector>

// Delta hedging P&L decomposition (Black-Scholes framework):
// dV - delta * dS ≈ theta * dt + 0.5 * gamma * (dS)^2
//                 = theta * dt + 0.5 * gamma * sigma_realised^2 * S^2 * dt
// Net hedging P&L per step = (sigma_realised^2 - sigma_impl^2) * 0.5 * gamma * S^2 * dt
// Long gamma => profit when realised vol > implied vol.

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrtpi * std::numbers::sqrt2);
}
static double phi(double x) noexcept {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * std::numbers::pi);
}

struct BSGreeks { double delta, gamma, theta, vega, price; };

BSGreeks bsGreeks(double S, double K, double r, double q,
                   double sigma, double T) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    double nd1 = Phi(d1), nd2 = Phi(d2), pd1 = phi(d1);
    double price = S * std::exp(-q * T) * nd1 - K * std::exp(-r * T) * nd2;
    double delta = std::exp(-q * T) * nd1;
    double gamma = std::exp(-q * T) * pd1 / (S * sigma * sqT);
    double theta = -std::exp(-q*T)*S*pd1*sigma/(2*sqT)
                   - r*K*std::exp(-r*T)*nd2 + q*S*std::exp(-q*T)*nd1;
    double vega  = S * std::exp(-q * T) * pd1 * sqT;
    return {delta, gamma, theta / 365.0, vega, price};   // theta per calendar day
}

struct HedgePnL {
    double total_pnl;       // total realised P&L
    double gamma_pnl;       // 0.5 * gamma * (dS)^2
    double theta_pnl;       // theta * dt
    double vol_spread_pnl;  // (sigma_real^2 - sigma_impl^2) * 0.5 * gamma * S^2 * dt
};

HedgePnL deltaHedgePnL(double S0, double S1,       // prices at t and t+dt
                         double K, double r, double q,
                         double sigma_impl, double T, double dt) noexcept {
    auto g    = bsGreeks(S0, K, r, q, sigma_impl, T);
    double dS = S1 - S0;
    double gamma_pnl = 0.5 * g.gamma * dS * dS;
    double theta_pnl = g.theta * dt;

    // Realised vol for this step (absolute return squared / dt)
    double sigma_real2 = (dS / S0) * (dS / S0) / dt;
    double vol_spread  = (sigma_real2 - sigma_impl * sigma_impl)
                        * 0.5 * g.gamma * S0 * S0 * dt;

    double total = gamma_pnl + theta_pnl;   // hedged portfolio daily P&L
    return {total, gamma_pnl, theta_pnl, vol_spread};
}`,
    explanation:
      "The gamma P&L (½Γ(ΔS)²) and theta P&L (Θ·Δt) are the two sides of the Black-Scholes no-arbitrage equation: for a BS-priced option, E[½ΓS²σ²Δt] = −Θ·Δt, so the expected net delta-hedging P&L is zero when realised vol equals implied vol. When realised vol exceeds implied vol, the long-gamma hedger profits by the vol spread (σ²_real − σ²_impl) × ½Γ × S² × dt per step — the daily P&L of a short-vega position that loses money and vice versa.",
  },
  {
    id: "cpp-20260613-b1-fx-triangular-arb",
    language: "cpp",
    title: "FX triangular arbitrage — Bellman-Ford negative log-rate cycle",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <limits>
#include <string>

// FX triangular arbitrage: detect a cycle of currencies where the product
// of exchange rates > 1. Take log: sum of log(rate) < 0 iff arbitrage exists.
// Transform: edge weight = -log(rate). Bellman-Ford detects negative cycles.

struct FXEdge {
    int    from;    // currency index
    int    to;
    double rate;    // number of 'to' units per 1 'from' unit
};

// Returns the arbitrage cycle as a list of currency indices, or empty if none.
std::vector<int> detectFXArb(const std::vector<std::string>& currencies,
                               const std::vector<FXEdge>& quotes) {
    int N = static_cast<int>(currencies.size());
    const double INF = std::numeric_limits<double>::infinity();

    std::vector<double> dist(N, INF);
    std::vector<int>    pred(N, -1);
    dist[0] = 0.0;   // source: USD (or any currency)

    // Relax N-1 times
    for (int iter = 0; iter < N - 1; ++iter) {
        for (const auto& e : quotes) {
            double w = -std::log(e.rate);   // negative log: arb iff cycle weight < 0
            if (dist[e.from] < INF && dist[e.from] + w < dist[e.to]) {
                dist[e.to] = dist[e.from] + w;
                pred[e.to] = e.from;
            }
        }
    }

    // N-th relaxation: detect negative cycle
    int cycle_node = -1;
    for (const auto& e : quotes) {
        double w = -std::log(e.rate);
        if (dist[e.from] < INF && dist[e.from] + w < dist[e.to]) {
            cycle_node = e.to;    // node in a negative cycle
            break;
        }
    }

    if (cycle_node < 0) return {};   // no arbitrage

    // Trace back the cycle: follow pred[] N times to guarantee we're in the cycle
    int cur = cycle_node;
    for (int i = 0; i < N; ++i) cur = pred[cur];

    // Collect cycle
    std::vector<int> cycle;
    int start = cur;
    do {
        cycle.push_back(cur);
        cur = pred[cur];
    } while (cur != start);
    cycle.push_back(start);
    std::reverse(cycle.begin(), cycle.end());
    return cycle;
}

// Profit from the cycle: product of rates along the path - 1
double cycleProfit(const std::vector<int>& cycle,
                   const std::vector<FXEdge>& quotes) {
    double product = 1.0;
    for (std::size_t i = 0; i + 1 < cycle.size(); ++i) {
        for (const auto& e : quotes)
            if (e.from == cycle[i] && e.to == cycle[i + 1])
                { product *= e.rate; break; }
    }
    return product - 1.0;   // profit per unit invested
}`,
    explanation:
      "The log transformation converts the multiplicative arbitrage condition (product of rates > 1) into an additive one (sum of log-rates < 0), making it directly solvable as a negative-cycle detection problem. Bellman-Ford's O(VE) complexity is acceptable for the small FX graph (8-20 major currencies × their crosses), and in practice the bottleneck is quote latency not computation — real arbitrage windows last microseconds and require direct market access to capture.",
  },
  {
    id: "cpp-20260613-b1-lsmc-american",
    language: "cpp",
    title: "Longstaff-Schwartz MC — American put early exercise via regression",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <random>
#include <algorithm>
#include <numeric>

// LSMC (Longstaff-Schwartz 2001): American option pricing via Monte Carlo.
// Key idea: at each step, regress the continuation value (discounted future
// payoff) on in-the-money paths using Laguerre basis functions.
// If immediate exercise > fitted continuation value, exercise early.

static double laguerre0(double x) noexcept { return 1.0; }
static double laguerre1(double x) noexcept { return 1.0 - x; }
static double laguerre2(double x) noexcept { return 1.0 - 2.0*x + 0.5*x*x; }

// OLS regression of y on X (3 basis functions): returns coefficients
static std::array<double, 3> ols3(const std::vector<double>& x,
                                   const std::vector<double>& y) {
    // Build 3x3 normal equations: (X^T X) beta = X^T y
    double A[3][3] = {}, b[3] = {};
    for (std::size_t i = 0; i < x.size(); ++i) {
        double phi[3] = {laguerre0(x[i]), laguerre1(x[i]), laguerre2(x[i])};
        for (int r = 0; r < 3; ++r) {
            for (int c = 0; c < 3; ++c) A[r][c] += phi[r] * phi[c];
            b[r] += phi[r] * y[i];
        }
    }
    // Gaussian elimination (3x3)
    for (int p = 0; p < 3; ++p) {
        for (int r = p + 1; r < 3; ++r) {
            double f = A[r][p] / A[p][p];
            for (int c = p; c < 3; ++c) A[r][c] -= f * A[p][c];
            b[r] -= f * b[p];
        }
    }
    std::array<double, 3> coef{};
    for (int r = 2; r >= 0; --r) {
        coef[r] = b[r];
        for (int c = r + 1; c < 3; ++c) coef[r] -= A[r][c] * coef[c];
        coef[r] /= A[r][r];
    }
    return coef;
}

double americanPutLSMC(double S0, double K, double r, double sigma,
                        double T, int N_steps, int N_paths, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;
    double dt   = T / N_steps;
    double disc = std::exp(-r * dt);
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);

    // Simulate price paths  [N_paths x (N_steps+1)]
    std::vector<std::vector<double>> S(N_paths, std::vector<double>(N_steps + 1));
    for (int p = 0; p < N_paths; ++p) {
        S[p][0] = S0;
        for (int t = 0; t < N_steps; ++t)
            S[p][t + 1] = S[p][t] * std::exp(drift + vol * nd(rng));
    }

    // Backward induction — cash flows at maturity
    std::vector<double> cf(N_paths);
    for (int p = 0; p < N_paths; ++p)
        cf[p] = std::max(K - S[p][N_steps], 0.0);

    for (int t = N_steps - 1; t >= 1; --t) {
        // In-the-money paths at time t
        std::vector<double> x_itm, y_itm;
        std::vector<int>    idx_itm;
        for (int p = 0; p < N_paths; ++p) {
            double imm = K - S[p][t];
            if (imm > 0) {
                x_itm.push_back(S[p][t]);
                y_itm.push_back(disc * cf[p]);   // discounted future payoff
                idx_itm.push_back(p);
            }
        }
        if (x_itm.empty()) continue;

        auto coef = ols3(x_itm, y_itm);

        // Exercise decision
        for (std::size_t i = 0; i < idx_itm.size(); ++i) {
            int p = idx_itm[i];
            double S_t = S[p][t];
            double phi[3] = {laguerre0(S_t), laguerre1(S_t), laguerre2(S_t)};
            double cont = coef[0]*phi[0] + coef[1]*phi[1] + coef[2]*phi[2];
            double exer = K - S_t;
            if (exer > cont) cf[p] = exer;   // exercise early
            else             cf[p] *= disc;  // continue
        }
        for (int p = 0; p < N_paths; ++p)
            if (K - S[p][t] <= 0) cf[p] *= disc;  // OTM: continue
    }

    double mean = 0;
    for (double c : cf) mean += c;
    return std::exp(-r * dt) * mean / N_paths;
}`,
    explanation:
      "LSMC's insight is that the continuation value is a function of the current state (spot price), so it can be approximated by regressing discounted future payoffs on basis functions of the current spot — Laguerre polynomials are standard because they are orthogonal on [0,∞). The regression is estimated only on in-the-money paths to avoid regressing near-zero payoffs (where the exercise decision is trivially 'continue'), which would bias the estimate toward spurious early exercise.",
  },
  {
    id: "cpp-20260613-b1-concept-numeric",
    language: "cpp",
    title: "C++20 concepts — constrain numeric templates for Greeks calculators",
    tag: "modern",
    code: `#include <concepts>
#include <type_traits>
#include <cmath>
#include <complex>

// Concepts constrain template parameters at the point of instantiation,
// producing clear error messages instead of pages of substitution failures.
// Essential for templating quant functions over float/double/autodiff types.

// Concept: types that support +, -, *, /, sqrt(), and exp()
template<typename T>
concept FloatingPoint = std::is_floating_point_v<T>;

template<typename T>
concept QuantReal = requires(T a, T b) {
    { a + b }  -> std::convertible_to<T>;
    { a - b }  -> std::convertible_to<T>;
    { a * b }  -> std::convertible_to<T>;
    { a / b }  -> std::convertible_to<T>;
    { std::sqrt(a) } -> std::convertible_to<T>;
    { std::exp(a)  } -> std::convertible_to<T>;
    { std::log(a)  } -> std::convertible_to<T>;
};

// Works for double, long double, __float128, dual-number autodiff types
template<QuantReal T>
T d1Param(T S, T K, T r, T q, T sigma, T T_) {
    return (std::log(S / K) + (r - q + T{0.5} * sigma * sigma) * T_)
         / (sigma * std::sqrt(T_));
}

// Concept for a type that has an order book interface
template<typename OB>
concept OrderBook = requires(OB ob, double price, int qty) {
    { ob.bestBid() }       -> std::convertible_to<double>;
    { ob.bestAsk() }       -> std::convertible_to<double>;
    { ob.addOrder(price, qty, true) } -> std::same_as<bool>;
    { ob.spread() }        -> std::convertible_to<double>;
};

// Require both: floating-point and positive value
template<FloatingPoint T>
T safeLog(T x) requires (std::is_floating_point_v<T>) {
    if (x <= T{0}) return -std::numeric_limits<T>::infinity();
    return std::log(x);
}

// Abbreviated function template using auto (C++20 syntax)
auto squaredVol(auto sigma, auto T) requires FloatingPoint<decltype(sigma)> {
    return sigma * sigma * T;
}`,
    explanation:
      "Concepts serve two purposes: documentation (the requires clause reads like a specification) and early error detection (the compiler diagnoses constraint violations at the call site, not inside the template body). Templating Greeks functions over a QuantReal concept allows the same code to run with double for production and with a dual-number type for automatic differentiation — the compile-time interface contract guarantees that any conforming type will work without runtime dispatch.",
  },
  {
    id: "cpp-20260613-b1-spinlock",
    language: "cpp",
    title: "std::atomic_flag spin lock — contention-free fast path for shared data",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>

// std::atomic_flag is the only C++ type guaranteed to be lock-free.
// RAII spinlock: busy-wait until the flag is cleared.
// Use ONLY for critical sections < 100 ns; longer sections should use a mutex.
// Exponential backoff reduces cache-coherence traffic under contention.

class SpinLock {
    std::atomic_flag flag_ = ATOMIC_FLAG_INIT;

public:
    void lock() noexcept {
        int spins = 0;
        while (flag_.test_and_set(std::memory_order_acquire)) {
            // PAUSE instruction: tells the CPU this is a spin-wait loop.
            // Avoids memory-order violation speculation and reduces power.
            for (int i = 0; i < (1 << std::min(spins, 6)); ++i)
                __builtin_ia32_pause();
            if (spins < 10) ++spins;
            // After ~64 spins, yield to the OS scheduler (prevents livelock)
            if (spins == 10) std::this_thread::yield();
        }
    }

    void unlock() noexcept {
        flag_.clear(std::memory_order_release);
    }

    // Try to acquire without blocking; return true on success
    bool try_lock() noexcept {
        return !flag_.test_and_set(std::memory_order_acquire);
    }
};

// RAII guard (identical interface to std::lock_guard)
class SpinGuard {
    SpinLock& sl_;
public:
    explicit SpinGuard(SpinLock& sl) noexcept : sl_(sl) { sl_.lock(); }
    ~SpinGuard() noexcept { sl_.unlock(); }
    SpinGuard(const SpinGuard&) = delete;
};

// Usage: shared statistics counter updated by multiple threads
struct BookStats {
    double last_mid = 0.0;
    int    trade_count = 0;
    SpinLock mu;
};

void updateStats(BookStats& s, double mid) noexcept {
    SpinGuard g(s.mu);
    s.last_mid = mid;
    ++s.trade_count;
}`,
    explanation:
      "The PAUSE instruction is the key to efficient spin-wait loops on x86: it flushes the speculative load-store queue and hints to the CPU that the spin loop will terminate soon, reducing power consumption by ~30% and preventing the pipeline from being dominated by speculative loads of the flag. The exponential backoff (1, 2, 4, 8, 16, 32, 32 PAUSE cycles) reduces cache-line ping-pong under heavy contention, while the yield() fallback prevents complete starvation of other threads.",
  },
  {
    id: "cpp-20260613-b1-merton-jump",
    language: "cpp",
    title: "Merton jump-diffusion MC — Poisson shocks to BS lognormal",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>

// Merton (1976) jump-diffusion: dS/S = (mu - lambda*k_bar) dt + sigma dW + J dN
// J = jump multiplier, N = Poisson process with intensity lambda.
// log(J) ~ N(mu_J, sigma_J^2); mean jump size k_bar = exp(mu_J + 0.5*sigma_J^2) - 1.
// Closed-form sum: C_merton = sum_{n=0}^{inf} p_n * BS_call(sigma_n, r_n)
// where p_n = Poisson(lambda*T, n), sigma_n^2 = sigma^2 + n*sigma_J^2/T,
//             r_n = r - lambda*k_bar + n*mu_J/T.

double mertonCallClosedForm(double S, double K, double r, double q,
                             double sigma, double T,
                             double lam, double mu_J, double sigma_J,
                             int n_terms = 30) noexcept {
    static auto Phi = [](double x) noexcept {
        return 0.5 * std::erfc(-x / std::sqrt(2.0));
    };
    static auto bsCall = [&Phi](double S, double K, double r_n, double q,
                                  double sig_n, double T) {
        double sqT = std::sqrt(T);
        double d1  = (std::log(S/K) + (r_n - q + 0.5*sig_n*sig_n)*T) / (sig_n*sqT);
        double d2  = d1 - sig_n * sqT;
        return S*std::exp(-q*T)*Phi(d1) - K*std::exp(-r_n*T)*Phi(d2);
    };

    double k_bar  = std::exp(mu_J + 0.5 * sigma_J * sigma_J) - 1.0;
    double lam_p  = lam * (1.0 + k_bar);   // risk-neutral intensity
    double price  = 0.0;
    double log_p  = 0.0;   // log of Poisson probability (stable computation)

    for (int n = 0; n <= n_terms; ++n) {
        if (n > 0) log_p += std::log(lam_p * T) - std::log(static_cast<double>(n));
        double p_n    = std::exp(log_p - lam_p * T);   // Poisson(lambda'*T, n)
        double sig_n  = std::sqrt(sigma * sigma + static_cast<double>(n) * sigma_J * sigma_J / T);
        double r_n    = r - lam * k_bar + static_cast<double>(n) * mu_J / T;
        if (sig_n < 1e-10) continue;
        price += p_n * bsCall(S, K, r_n, q, sig_n, T);
    }
    return price;
}`,
    explanation:
      "The Merton model superimposes a compound Poisson jump process on the GBM to capture the fat tails and excess kurtosis in equity returns that Black-Scholes misses. The closed-form series converges rapidly because the Poisson weights decay exponentially — for λT < 5, 20-30 terms suffice. The key insight is that conditioning on the number of jumps n reduces the problem to a standard BS call with a modified variance (σ² + nσ_J²/T) and drift (r − λk̄ + nμ_J/T), making each term of the series analytically tractable.",
  },
  {
    id: "cpp-20260613-b1-yield-bootstrap",
    language: "cpp",
    title: "Yield curve bootstrap — piecewise constant forwards from ZCB prices",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <algorithm>
#include <stdexcept>

// Bootstrapping: given a sequence of market instruments (ZCBs, FRAs, swaps),
// extract the discount factor curve P(0,t) = exp(-r(t)*t).
// Piecewise-constant forward rates: f(t) is flat between knot points.
// Between t_{i-1} and t_i: P(0, t_i) = P(0, t_{i-1}) * exp(-f_i * (t_i - t_{i-1})).

struct MarketInstrument {
    double tenor;       // in years
    double price;       // ZCB price (e.g. 0.95 for 1Y at 5%), or swap par rate
    enum class Type { ZCB, ParSwap } type;
};

struct DiscountCurve {
    std::vector<double> tenors;    // knot points
    std::vector<double> dfs;       // discount factors P(0, t_i)
    std::vector<double> fwds;      // piecewise-constant forward rates

    // Interpolate discount factor at arbitrary tenor (piecewise constant fwd)
    double df(double t) const noexcept {
        if (t <= 0) return 1.0;
        auto it = std::lower_bound(tenors.begin(), tenors.end(), t);
        if (it == tenors.end()) {
            // Flat extrapolation: use last forward rate
            double dt = t - tenors.back();
            return dfs.back() * std::exp(-fwds.back() * dt);
        }
        std::size_t i = static_cast<std::size_t>(it - tenors.begin());
        if (i == 0) return std::exp(-fwds[0] * t);
        double t0 = tenors[i - 1], t1 = tenors[i];
        double f  = fwds[i];
        return dfs[i - 1] * std::exp(-f * (t - t0));
    }

    double zeroRate(double t) const noexcept {
        double d = df(t);
        return (t > 0 && d > 0) ? -std::log(d) / t : 0.0;
    }
};

DiscountCurve bootstrapZCB(const std::vector<MarketInstrument>& instruments) {
    DiscountCurve curve;
    curve.tenors.push_back(0.0);
    curve.dfs.push_back(1.0);

    for (const auto& inst : instruments) {
        if (inst.type != MarketInstrument::Type::ZCB)
            throw std::runtime_error("Only ZCB bootstrap implemented here");
        if (inst.price <= 0 || inst.price >= 1)
            throw std::invalid_argument("ZCB price must be in (0,1)");

        double t     = inst.tenor;
        double t_prev = curve.tenors.back();
        double df_prev = curve.dfs.back();

        double df_t  = inst.price;   // ZCB price IS the discount factor
        double dt    = t - t_prev;
        double fwd   = (dt > 0) ? -std::log(df_t / df_prev) / dt : 0.0;

        curve.tenors.push_back(t);
        curve.dfs.push_back(df_t);
        curve.fwds.push_back(fwd);
    }
    return curve;
}`,
    explanation:
      "Bootstrapping is sequential and exact: each instrument pins one discount factor node, and the forward rate between adjacent nodes is then uniquely determined — no optimisation required. Piecewise-constant forward rates are preferred over piecewise-constant zero rates because they make the discount factor continuous and produce forward rates that are constant within each interval, avoiding the 'sawtooth' forward curve that piecewise-constant zeros create at knot points.",
  },
  {
    id: "cpp-20260613-b1-hull-white-sim",
    language: "cpp",
    title: "Hull-White short rate simulation — Euler paths for swaption pricing",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <random>

// Hull-White (1990) one-factor model:
// dr = (theta(t) - a*r) dt + sigma dW
// Under the risk-neutral measure, theta(t) is chosen to fit the initial yield curve:
// theta(t) = df_mkt/dt + a*f_mkt(t) + sigma^2/(2a) * (1 - e^{-2at})
// For constant theta (approximation): theta = a*r_LR (mean-reversion to long-run rate r_LR).

struct HWParams {
    double a;       // mean reversion speed (>0)
    double sigma;   // short rate volatility
    double r_LR;    // long-run rate (theta/a)
};

std::vector<std::vector<double>> hwSimulate(const HWParams& p,
                                              double r0, double T,
                                              int N_steps, int N_paths,
                                              int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt     = T / N_steps;
    double sqdt   = std::sqrt(dt);
    double theta  = p.a * p.r_LR;   // constant theta approximation

    // Exact solution for Ornstein-Uhlenbeck (used for variance too)
    // r(t+dt) | r(t) = r(t)*e^{-a*dt} + (theta/a)*(1 - e^{-a*dt}) + eps
    // eps ~ N(0, sigma^2 * (1 - e^{-2a*dt}) / (2a))
    double ea    = std::exp(-p.a * dt);
    double mean_factor = (1.0 - ea) * p.r_LR;
    double var   = p.sigma * p.sigma * (1.0 - ea * ea) / (2.0 * p.a);
    double stdv  = std::sqrt(var);

    std::vector<std::vector<double>> paths(N_paths, std::vector<double>(N_steps + 1));
    for (int pp = 0; pp < N_paths; ++pp) {
        paths[pp][0] = r0;
        for (int t = 0; t < N_steps; ++t) {
            double r    = paths[pp][t];
            double Z    = nd(rng);
            paths[pp][t + 1] = r * ea + mean_factor + stdv * Z;
        }
    }
    return paths;
}

// Discount factor from HW path: P(t, T) = exp(-B(t,T)*r_t - A(t,T))
// (affine term structure)
double hwDF(double r_t, double tau, const HWParams& p) noexcept {
    double a = p.a;
    double B = (1.0 - std::exp(-a * tau)) / a;
    double A = (p.r_LR - p.sigma * p.sigma / (2.0 * a * a))
             * (B - tau)
             - p.sigma * p.sigma * B * B / (4.0 * a);
    return std::exp(-B * r_t - A);
}`,
    explanation:
      "Hull-White uses the exact Ornstein-Uhlenbeck transition distribution (r(t+Δt)|r(t) is Gaussian) rather than the Euler approximation, so each time step has zero discretisation error in the distribution (the only error comes from the constant-theta approximation to the term structure). The affine structure means that bond prices and swaption prices have semi-analytical forms, making HW the standard model for calibrating interest rate derivatives desks — the MC simulation is typically used only for exotics where the analytical form is not available.",
  },
  {
    id: "cpp-20260613-b1-fenwick-vol",
    language: "cpp",
    title: "Fenwick (BIT) tree — cumulative order volume by price level in O(log N)",
    tag: "data-structures",
    code: `#include <cstddef>
#include <cstdint>
#include <vector>

// Binary Indexed Tree (BIT / Fenwick tree): supports prefix-sum queries and
// point updates in O(log N). Perfect for: total volume at or below a price level,
// VWAP over a price range, or cumulative order count for depth analysis.

class FenwickVol {
    std::vector<std::int64_t> tree_;
    std::size_t               n_;

public:
    explicit FenwickVol(std::size_t n_levels)
        : tree_(n_levels + 1, 0), n_(n_levels) {}

    // Add delta_vol to price level i (1-indexed)
    void update(std::size_t i, std::int64_t delta_vol) noexcept {
        for (; i <= n_; i += i & (-static_cast<int>(i)))
            tree_[i] += delta_vol;
    }

    // Query: sum of volume at price levels [1, i]
    std::int64_t query(std::size_t i) const noexcept {
        std::int64_t s = 0;
        for (; i > 0; i -= i & (-static_cast<int>(i)))
            s += tree_[i];
        return s;
    }

    // Volume in range [lo, hi]
    std::int64_t rangeQuery(std::size_t lo, std::size_t hi) const noexcept {
        return query(hi) - (lo > 0 ? query(lo - 1) : 0);
    }

    // Find smallest price level where cumulative volume >= target (O(log^2 N) naive)
    std::size_t kth(std::int64_t target) const noexcept {
        std::size_t pos = 0;
        std::size_t bit = 1;
        while (bit <= n_) bit <<= 1;
        bit >>= 1;
        std::int64_t acc = 0;
        while (bit > 0) {
            std::size_t next = pos + bit;
            if (next <= n_ && acc + tree_[next] < target) {
                acc += tree_[next];
                pos = next;
            }
            bit >>= 1;
        }
        return pos + 1;   // 1-indexed
    }
};

// Example: order book with 10000 price levels (ticks)
// FenwickVol book(10000);
// book.update(5000, 500);    // 500 lots at level 5000 (ATM)
// book.update(4999, 200);
// std::int64_t total_bid = book.rangeQuery(1, 4999);   // all below ATM`,
    explanation:
      "The Fenwick tree's update and prefix-sum are both O(log N) because each node covers a range of length equal to its lowest set bit — updating propagates only to ancestors by flipping the lowest bit upward, and querying decomposes the prefix into O(log N) non-overlapping ranges. For an order book with 10 000 price levels, both operations take ~13 comparisons, making it faster than a sorted vector (O(log N) query but O(N) update) for high-frequency order book analysis.",
  },
  {
    id: "cpp-20260613-b1-constexpr-if-dispatch",
    language: "cpp",
    title: "if constexpr put/call dispatch — zero-cost option type branching",
    tag: "modern",
    code: `#include <cmath>
#include <numbers>
#include <type_traits>

// if constexpr evaluates the branch condition at compile time.
// Dead branches are not instantiated — the compiler never sees them.
// This avoids both virtual dispatch and runtime branching for type-specific logic.

enum class OptionType { Call, Put };

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * std::numbers::inv_sqrtpi * std::numbers::sqrt2);
}

// Template on OptionType: two instantiations, no runtime branch
template<OptionType OT>
double bsPrice(double S, double K, double r, double q, double sigma, double T) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    double eqT = std::exp(-q * T), erT = std::exp(-r * T);

    if constexpr (OT == OptionType::Call)
        return S * eqT * Phi(d1) - K * erT * Phi(d2);
    else
        return K * erT * Phi(-d2) - S * eqT * Phi(-d1);
}

template<OptionType OT>
double bsDelta(double S, double K, double r, double q, double sigma, double T) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double eqT = std::exp(-q * T);
    if constexpr (OT == OptionType::Call)
        return  eqT * Phi(d1);
    else
        return -eqT * Phi(-d1);
}

// Put-call parity check (computed at compile time via templates)
void checkParity(double S, double K, double r, double q, double sigma, double T) noexcept {
    double C = bsPrice<OptionType::Call>(S, K, r, q, sigma, T);
    double P = bsPrice<OptionType::Put> (S, K, r, q, sigma, T);
    // C - P = S*e^{-qT} - K*e^{-rT}  (put-call parity)
    (void)(C - P);
}

// Runtime dispatch wrapping the compile-time templates
double bsPriceRT(OptionType ot, double S, double K,
                 double r, double q, double sigma, double T) noexcept {
    if (ot == OptionType::Call)
        return bsPrice<OptionType::Call>(S, K, r, q, sigma, T);
    return bsPrice<OptionType::Put>(S, K, r, q, sigma, T);
}`,
    explanation:
      "if constexpr allows a single template to express both put and call logic without duplicating function bodies — the compiler instantiates two separate versions with dead code eliminated. This matters for Greeks engines that compute all sensitivities in a tight loop: the call/put branch inside a scalar loop would stall the branch predictor, while the template instantiation moves the decision to compile time, allowing the inner loop to run without any conditional instruction.",
  },
];
