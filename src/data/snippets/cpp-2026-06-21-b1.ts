import type { Snippet } from "./types";

export const cppSnippets20260621B1: Snippet[] = [
  {
    id: "cpp-20260621-b1-spsc-ringbuf",
    language: "cpp",
    title: "Lock-free SPSC ring buffer for tick pipeline",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>

// Single-producer single-consumer lock-free ring buffer.
// Power-of-2 capacity allows cheap modulo via bitwise AND.
// Aligned to separate cache lines prevents false sharing.
template <typename T, std::size_t N>
class SPSCRing {
    static_assert((N & (N - 1)) == 0, "N must be power of 2");
    alignas(64) std::atomic<std::size_t> head_{0};  // producer writes
    alignas(64) std::atomic<std::size_t> tail_{0};  // consumer reads
    std::array<T, N> buf_;

public:
    bool push(T item) noexcept {
        const std::size_t h = head_.load(std::memory_order_relaxed);
        if (h - tail_.load(std::memory_order_acquire) == N)
            return false;   // full
        buf_[h & (N - 1)] = std::move(item);
        head_.store(h + 1, std::memory_order_release);
        return true;
    }

    std::optional<T> pop() noexcept {
        const std::size_t t = tail_.load(std::memory_order_relaxed);
        if (head_.load(std::memory_order_acquire) == t)
            return std::nullopt;  // empty
        T item = std::move(buf_[t & (N - 1)]);
        tail_.store(t + 1, std::memory_order_release);
        return item;
    }
};`,
    explanation: "Separating head and tail on distinct 64-byte cache lines prevents false sharing: without alignas(64), a producer write to head would invalidate the consumer's cache line holding tail, adding ~60 ns of coherency traffic per publish.",
  },
  {
    id: "cpp-20260621-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-size pool allocator for order objects",
    tag: "memory",
    code: `#include <array>
#include <cassert>
#include <cstddef>
#include <new>
#include <utility>

// Pool allocator: pre-allocates N objects and serves them via a free-list.
// alloc/dealloc are O(1) and never touch the system allocator at runtime.
template <typename T, std::size_t N>
class PoolAllocator {
    union Slot { alignas(T) unsigned char storage[sizeof(T)]; Slot* next; };
    std::array<Slot, N> pool_;
    Slot* free_ = nullptr;
    std::size_t in_use_ = 0;

public:
    PoolAllocator() noexcept {
        for (std::size_t i = 0; i + 1 < N; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[N - 1].next = nullptr;
        free_ = &pool_[0];
    }

    template <typename... Args>
    T* alloc(Args&&... args) {
        assert(free_ && "pool exhausted");
        Slot* s = free_;
        free_ = s->next;
        ++in_use_;
        return new (s->storage) T(std::forward<Args>(args)...);
    }

    void dealloc(T* p) noexcept {
        p->~T();
        Slot* s = reinterpret_cast<Slot*>(p);
        s->next = free_;
        free_ = s;
        --in_use_;
    }

    std::size_t in_use() const noexcept { return in_use_; }
};`,
    explanation: "The union trick overlays the stored object with the free-list pointer so no extra memory is used for list pointers — the freed slot itself becomes the next pointer, keeping allocator overhead at exactly one pointer per slot.",
  },
  {
    id: "cpp-20260621-b1-mmap-replay",
    language: "cpp",
    title: "Memory-mapped binary tick file for zero-copy replay",
    tag: "networking",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstddef>
#include <stdexcept>

// mmap maps the file directly into the process address space.
// Reads hit the page cache — no user-space copy, no read() syscalls.
struct MmapReader {
    void*  addr = MAP_FAILED;
    size_t size = 0;
    int    fd   = -1;

    explicit MmapReader(const char* path) {
        fd = ::open(path, O_RDONLY);
        if (fd < 0) throw std::runtime_error("open failed");
        struct stat st{};
        ::fstat(fd, &st);
        size = static_cast<size_t>(st.st_size);
        addr = ::mmap(nullptr, size, PROT_READ,
                      MAP_PRIVATE | MAP_POPULATE, fd, 0);
        if (addr == MAP_FAILED) throw std::runtime_error("mmap failed");
        ::madvise(addr, size, MADV_SEQUENTIAL);  // prefetch ahead
    }

    ~MmapReader() {
        if (addr != MAP_FAILED) ::munmap(addr, size);
        if (fd >= 0) ::close(fd);
    }

    // Zero-copy cast at byte offset — no memcpy
    template <typename T>
    const T* at(size_t offset) const noexcept {
        return reinterpret_cast<const T*>(
            static_cast<const char*>(addr) + offset);
    }

    MmapReader(const MmapReader&) = delete;
    MmapReader& operator=(const MmapReader&) = delete;
};`,
    explanation: "MAP_POPULATE pre-faults all pages at mmap time so subsequent reads never page-fault; MADV_SEQUENTIAL tells the kernel to aggressively read-ahead pages, making sequential replay throughput kernel-bandwidth-limited rather than disk-latency-limited.",
  },
  {
    id: "cpp-20260621-b1-avx2-midprice",
    language: "cpp",
    title: "AVX2 vectorised mid-price and realised-variance accumulation",
    tag: "simd",
    code: `#include <immintrin.h>
#include <cstddef>

// Compute mid = (bid + ask) * 0.5 for 4 doubles per cycle (256-bit AVX2).
void midPrices_avx2(const double* bids, const double* asks,
                    double* mids, std::size_t n) noexcept {
    const __m256d half = _mm256_set1_pd(0.5);
    std::size_t i = 0;
    for (; i + 4 <= n; i += 4) {
        __m256d b   = _mm256_loadu_pd(bids + i);
        __m256d a   = _mm256_loadu_pd(asks + i);
        __m256d mid = _mm256_mul_pd(_mm256_add_pd(b, a), half);
        _mm256_storeu_pd(mids + i, mid);
    }
    for (; i < n; ++i) mids[i] = (bids[i] + asks[i]) * 0.5;
}

// Sum squared returns using FMA (fused multiply-add): acc += r * r
double sumSqReturns_fma(const double* rets, std::size_t n) noexcept {
    __m256d acc = _mm256_setzero_pd();
    std::size_t i = 0;
    for (; i + 4 <= n; i += 4) {
        __m256d r = _mm256_loadu_pd(rets + i);
        acc = _mm256_fmadd_pd(r, r, acc);   // acc += r*r, one instruction
    }
    // Horizontal reduction
    __m128d lo = _mm256_castpd256_pd128(acc);
    __m128d hi = _mm256_extractf128_pd(acc, 1);
    lo = _mm_add_pd(lo, hi);
    lo = _mm_hadd_pd(lo, lo);
    double result = _mm_cvtsd_f64(lo);
    for (; i < n; ++i) result += rets[i] * rets[i];
    return result;
}`,
    explanation: "AVX2 processes 4 doubles per 256-bit register; FMA computes multiply-then-add as a single instruction with one rounding error instead of two, giving both speed and precision for realized-variance accumulation over thousands of tick returns.",
  },
  {
    id: "cpp-20260621-b1-spinlock-backoff",
    language: "cpp",
    title: "Spinlock with exponential back-off (x86 PAUSE hint)",
    tag: "concurrency",
    code: `#include <atomic>
#include <algorithm>

// Exponential back-off reduces bus traffic when the lock is contended:
// each failed CAS doubles the wait up to a cap, then spins at cap rate.
// The x86 PAUSE instruction lowers power and signals memory-ordering to pipeline.
class SpinlockBackoff {
    std::atomic_flag flag_ = ATOMIC_FLAG_INIT;
public:
    void lock() noexcept {
        for (unsigned wait = 1; ; wait = std::min(wait << 1, 1024u)) {
            // Optimistic read before expensive test_and_set
            if (!flag_.test(std::memory_order_relaxed) &&
                !flag_.test_and_set(std::memory_order_acquire))
                return;
            for (unsigned i = 0; i < wait; ++i)
                __builtin_ia32_pause();  // lowers speculative execution pressure
        }
    }

    void unlock() noexcept {
        flag_.clear(std::memory_order_release);
    }
};

// RAII guard
struct SpinGuard {
    SpinlockBackoff& lk;
    explicit SpinGuard(SpinlockBackoff& l) noexcept : lk(l) { lk.lock(); }
    ~SpinGuard() noexcept { lk.unlock(); }
    SpinGuard(const SpinGuard&) = delete;
};`,
    explanation: "The optimistic test() before test_and_set() avoids issuing a write-invalidate on every spin iteration — a pure spin on test_and_set() issues a bus lock each iteration and saturates the interconnect, while the read-then-CAS pattern only issues the bus lock when the flag appears free.",
  },
  {
    id: "cpp-20260621-b1-cpu-affinity",
    language: "cpp",
    title: "CPU affinity and SCHED_FIFO real-time priority",
    tag: "low-latency",
    code: `#include <pthread.h>
#include <sched.h>
#include <stdexcept>
#include <string>

// Pin the calling thread to a specific physical core.
// Prevents OS migration which invalidates L1/L2 cache lines.
void pin_to_core(int core_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_id, &cpuset);
    int rc = ::pthread_setaffinity_np(
        pthread_self(), sizeof(cpuset), &cpuset);
    if (rc != 0)
        throw std::runtime_error(
            "pthread_setaffinity_np: " + std::to_string(rc));
}

// Elevate to SCHED_FIFO so the thread is never preempted by normal tasks.
// Requires CAP_SYS_NICE or running as root.
void set_realtime(int priority = 80) {
    sched_param sp{};
    sp.sched_priority = priority;
    if (::sched_setscheduler(0, SCHED_FIFO, &sp) != 0)
        throw std::runtime_error("sched_setscheduler failed");
}

// Typical HFT setup for a market-data thread:
//   pin_to_core(2);      // isolate core 2 via isolcpus= kernel param
//   set_realtime(90);    // higher priority than OS IRQ threads (99 max)
//   mlockall(MCL_CURRENT | MCL_FUTURE);  // prevent page faults`,
    explanation: "isolcpus= in the kernel command line removes the core from the scheduler's pool so only explicitly pinned threads run there; combining this with SCHED_FIFO and mlockall eliminates the three main sources of kernel-induced latency jitter: migration, preemption, and page faults.",
  },
  {
    id: "cpp-20260621-b1-branch-hints",
    language: "cpp",
    title: "Branch-prediction hints for order-processing hot path",
    tag: "low-latency",
    code: `#include <cstdint>

// __builtin_expect(expr, expected_value) teaches the compiler/predictor
// which branch is hot so it arranges the fallthrough for the common case.
#define likely(x)   __builtin_expect(!!(x), 1)
#define unlikely(x) __builtin_expect(!!(x), 0)

struct Message { std::uint8_t type; std::uint64_t id; double price; int qty; };
enum MsgType : std::uint8_t { NEW_ORDER = 1, CANCEL = 2, MODIFY = 3 };

// 98% of messages are new orders; rare cancel/modify take the slow path.
void processMessage(const Message& m) {
    if (likely(m.type == NEW_ORDER)) {
        // Hot path: inlined by compiler, placed first in code layout
        // ... insert into book ...
        return;
    }
    if (unlikely(m.type == CANCEL)) {
        // Cold path: placed after hot path, less pressure on I-cache
        // ... cancel order ...
        return;
    }
    // MODIFY, etc.
}

// C++20 attribute syntax — no macro needed
double sumBids(const double* bids, int n) noexcept {
    double s = 0.0;
    for (int i = 0; i < n; ++i) {
        if (bids[i] > 0.0) [[likely]]
            s += bids[i];
    }
    return s;
}`,
    explanation: "Modern CPUs predict the fallthrough (not-taken) branch as the fast path; __builtin_expect informs the compiler to lay out the taken branch out-of-line so the common-case instruction stream is contiguous in the instruction cache, reducing I-cache misses on the hot path.",
  },
  {
    id: "cpp-20260621-b1-fix-parser",
    language: "cpp",
    title: "Zero-copy FIX 4.x tag-value message parser",
    tag: "market-data",
    code: `#include <string_view>
#include <unordered_map>
#include <charconv>
#include <cstdint>

// FIX messages: "8=FIX.4.2\\x0135=D\\x01..." (SOH = 0x01 delimiter)
// Zero-copy: string_views point into the original buffer — no allocation.
using FIXFields = std::unordered_map<std::uint16_t, std::string_view>;

FIXFields parseFIX(std::string_view msg) {
    FIXFields fields;
    fields.reserve(32);
    std::size_t pos = 0;
    while (pos < msg.size()) {
        std::size_t eq = msg.find('=', pos);
        if (eq == std::string_view::npos) break;

        std::uint16_t tag = 0;
        std::from_chars(msg.data() + pos, msg.data() + eq, tag);

        std::size_t soh = msg.find('\\x01', eq + 1);
        if (soh == std::string_view::npos) soh = msg.size();

        fields.emplace(tag, msg.substr(eq + 1, soh - eq - 1));
        pos = soh + 1;
    }
    return fields;
}

// Common tag accessors (35=MsgType, 11=ClOrdID, 44=Price, 38=OrderQty)
inline char        msgType(const FIXFields& f) {
    auto it = f.find(35); return it != f.end() ? it->second[0] : '\\0';
}
inline double      price(const FIXFields& f) {
    auto it = f.find(44); if (it == f.end()) return 0.0;
    double v = 0.0;
    std::from_chars(it->second.data(),
                    it->second.data() + it->second.size(), v);
    return v;
}`,
    explanation: "from_chars parses integers and doubles without locale overhead or heap allocation; combined with string_view slices into the receive buffer, the entire FIX parse of a 200-byte New Order message can complete in under 100 ns on modern hardware.",
  },
  {
    id: "cpp-20260621-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list for price-level order queue",
    tag: "data-structures",
    code: `#include <cstddef>
#include <cstdint>

// Intrusive list: the node links live inside the element.
// Inserting/removing an order requires no heap allocation —
// the Order object itself is the list node.
struct Order {
    std::uint64_t id;
    double        price;
    std::uint32_t qty;
    Order*        prev = nullptr;
    Order*        next = nullptr;
};

struct OrderQueue {
    Order*      head  = nullptr;
    Order*      tail  = nullptr;
    std::size_t count = 0;

    // O(1) append at tail (time priority)
    void push_back(Order* o) noexcept {
        o->prev = tail; o->next = nullptr;
        if (tail) tail->next = o; else head = o;
        tail = o; ++count;
    }

    // O(1) removal anywhere — no search needed (pointer already in hand)
    void remove(Order* o) noexcept {
        if (o->prev) o->prev->next = o->next; else head = o->next;
        if (o->next) o->next->prev = o->prev; else tail = o->prev;
        o->prev = o->next = nullptr;
        --count;
    }

    bool   empty() const noexcept { return count == 0; }
    Order* front() const noexcept { return head; }
};`,
    explanation: "Intrusive containers eliminate the separate allocator round-trip for list nodes; since the exchange matching engine already holds pointers to Order objects for its cancel/modify index, the intrusive approach lets those same pointers be removed from the time-priority queue in O(1) with no additional allocation.",
  },
  {
    id: "cpp-20260621-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson PDE solver for European/American put",
    tag: "derivatives",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Crank-Nicolson: averages explicit and implicit steps.
// Second-order accurate in both S and t; unconditionally stable.
double crankNicolson(double S0, double K, double r, double sigma,
                     double T, int Ns = 200, int Nt = 200,
                     bool american = false) {
    double Smax = 4.0 * K, dS = Smax / Ns, dt = T / Nt, s2 = sigma * sigma;
    std::vector<double> S(Ns + 1), V(Ns + 1);
    for (int i = 0; i <= Ns; ++i) { S[i] = i * dS; V[i] = std::max(K - S[i], 0.0); }

    // Thomas algorithm for each time step
    std::vector<double> a(Ns+1), b(Ns+1), c(Ns+1), rhs(Ns+1), cp(Ns+1), dp(Ns+1), Vn(Ns+1);
    for (int n = 0; n < Nt; ++n) {
        for (int i = 1; i < Ns; ++i) {
            double al = 0.25 * dt * (s2*i*i - r*i);
            double be = -0.5 * dt * (s2*i*i + r);
            double ga = 0.25 * dt * (s2*i*i + r*i);
            a[i] = -al; b[i] = 1.0 - be; c[i] = -ga;
            rhs[i] = al*V[i-1] + (1.0+be)*V[i] + ga*V[i+1];
        }
        Vn[0]  = K * std::exp(-r * (T - (n+1)*dt));
        Vn[Ns] = 0.0;
        rhs[1] -= a[1] * Vn[0];
        rhs[Ns-1] -= c[Ns-1] * Vn[Ns];
        // Forward sweep
        cp[1] = c[1]/b[1]; dp[1] = rhs[1]/b[1];
        for (int i=2;i<Ns;++i){double m=b[i]-a[i]*cp[i-1];cp[i]=c[i]/m;dp[i]=(rhs[i]-a[i]*dp[i-1])/m;}
        Vn[Ns-1] = dp[Ns-1];
        for (int i=Ns-2;i>=1;--i) Vn[i]=dp[i]-cp[i]*Vn[i+1];
        if (american)
            for (int i=1;i<Ns;++i) Vn[i]=std::max(Vn[i],std::max(K-S[i],0.0));
        V = Vn;
    }
    int idx = static_cast<int>(S0 / dS);
    double f = (S0 - idx*dS) / dS;
    return V[idx] + f*(V[idx+1]-V[idx]);
}`,
    explanation: "Crank-Nicolson's tridiagonal system is solved via the Thomas algorithm in O(N) per time step; the unconditional stability allows larger dt than explicit schemes without blowing up, cutting the number of time steps needed for the same accuracy by roughly sqrt(N).",
  },
  {
    id: "cpp-20260621-b1-sabr-hagan",
    language: "cpp",
    title: "SABR Hagan (2002) implied vol approximation",
    tag: "derivatives",
    code: `#include <cmath>

// SABR: dF = sigma * F^beta * dW1, dsigma = nu * sigma * dW2, corr = rho.
// Hagan's closed-form approximation for implied Black vol.
struct SABR {
    double alpha;  // initial vol
    double beta;   // CEV exponent in [0,1]
    double rho;    // asset-vol correlation
    double nu;     // vol of vol

    double blackVol(double F, double K, double T) const {
        if (std::abs(F - K) < 1e-7 * F) return atmVol(F, T);
        double FK  = F * K;
        double FKb = std::pow(FK, 0.5*(1.0 - beta));
        double lnFK = std::log(F / K);
        double z    = (nu / alpha) * FKb * lnFK;
        double chi  = std::log((std::sqrt(1.0 - 2.0*rho*z + z*z) + z - rho)
                               / (1.0 - rho));
        double A = alpha / (FKb * (1.0 + std::pow((1.0-beta)*lnFK, 2)/24.0
                                       + std::pow((1.0-beta)*lnFK, 4)/1920.0));
        double B = 1.0 + ((1.0-beta)*(1.0-beta)*alpha*alpha
                          / (24.0 * std::pow(FK, 1.0-beta))
                          + 0.25*rho*beta*nu*alpha / FKb
                          + (2.0 - 3.0*rho*rho)*nu*nu / 24.0) * T;
        return A * (z / chi) * B;
    }

    double atmVol(double F, double T) const {
        double Fb = std::pow(F, 1.0 - beta);
        double B  = 1.0 + ((1.0-beta)*(1.0-beta)*alpha*alpha / (24.0*Fb*Fb)
                           + 0.25*rho*beta*nu*alpha / Fb
                           + (2.0 - 3.0*rho*rho)*nu*nu / 24.0) * T;
        return (alpha / Fb) * B;
    }
};`,
    explanation: "SABR became the swaption market standard because its two-dimensional stochastic process (asset + vol) captures both the smile level and the smile backbone dynamics; calibrating (alpha, rho, nu) to a tenor's option chain and using Hagan's formula for interpolation gives an arbitrage-free smile in O(1) per strike.",
  },
  {
    id: "cpp-20260621-b1-heston-mc",
    language: "cpp",
    title: "Heston stochastic vol Monte Carlo (full truncation)",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>

// Heston: dS = sqrt(v)*S*dW1, dv = kappa*(theta-v)*dt + sigma*sqrt(v)*dW2
// corr(dW1,dW2) = rho. Full truncation keeps variance non-negative.
double hestonCallMC(double S0, double v0,
                    double kappa, double theta, double sigma, double rho,
                    double r, double K, double T,
                    int n_steps = 200, int n_paths = 50000, unsigned seed = 0) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> N01;
    const double dt = T / n_steps, sqdt = std::sqrt(dt);
    const double disc = std::exp(-r * T);
    double payoff_sum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0, v = v0;
        for (int i = 0; i < n_steps; ++i) {
            double z1 = N01(rng);
            double z2 = rho*z1 + std::sqrt(1.0 - rho*rho) * N01(rng);
            double sv = std::sqrt(std::max(v, 0.0));
            // Full truncation: max(v,0) in both drift and diffusion
            v += kappa*(theta - std::max(v, 0.0))*dt + sigma*sv*sqdt*z2;
            v  = std::max(v, 0.0);
            S *= std::exp((r - 0.5*std::max(v, 0.0))*dt + sv*sqdt*z1);
        }
        payoff_sum += std::max(S - K, 0.0);
    }
    return disc * payoff_sum / n_paths;
}`,
    explanation: "Full truncation replaces negative variance draws with zero in both the drift and diffusion terms — this biased-but-stable scheme outperforms the reflection scheme for the Heston model because it preserves the martingale property of S more accurately near v=0.",
  },
  {
    id: "cpp-20260621-b1-dupire-lv",
    language: "cpp",
    title: "Dupire local vol via finite differences on call surface",
    tag: "derivatives",
    code: `#include <cmath>
#include <functional>

// Dupire (1994): sigma_loc^2(K,T) = [dC/dT + r*K*dC/dK] / [0.5*K^2 * d2C/dK2]
// Computed by finite differences on an arbitrage-free call price surface C(K,T).
// The result is the unique local vol that reproduces all vanilla prices.
double dupireLocalVol(std::function<double(double, double)> callPrice,
                      double K, double T, double r,
                      double dK = 0.5, double dT = 1.0 / 365.0) {
    const double C   = callPrice(K,     T);
    const double Cku = callPrice(K + dK, T);
    const double Ckd = callPrice(K - dK, T);
    const double CTu = callPrice(K,      T + dT);

    const double dCdT   = (CTu - C)  / dT;
    const double dCdK   = (Cku - Ckd) / (2.0 * dK);
    const double d2CdK2 = (Cku - 2.0*C + Ckd) / (dK * dK);

    const double numer = dCdT + r * K * dCdK;
    const double denom = 0.5 * K * K * d2CdK2;

    if (denom < 1e-10) return 0.0;  // no calendar spread arbitrage guard
    return std::sqrt(std::max(numer / denom, 0.0));
}`,
    explanation: "Dupire's formula shows that a perfectly smooth arbitrage-free call surface uniquely determines a local vol function; in practice the call surface must be smoothed (parametrically or via SVI) before applying finite differences, because noise in raw quotes produces wildly unstable local vol.",
  },
  {
    id: "cpp-20260621-b1-merton-jump",
    language: "cpp",
    title: "Merton jump-diffusion Monte Carlo pricing",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>

// Merton (1976): S_T = S0 * exp(drift*T + sigma*W_T + sum_j log(Y_j))
// N_T ~ Poisson(lambda*T), log(Y_j) ~ N(mu_J, sigma_J^2)
// Risk-neutral drift: r - lambda*(exp(mu_J + 0.5*sigma_J^2) - 1) - 0.5*sigma^2
double mertonJumpCall(double S0, double K, double r,
                      double sigma, double lambda, double muJ, double sigJ,
                      double T, int n_paths = 100000, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double>  Z;
    std::poisson_distribution<int>    Pois(lambda * T);

    const double m     = std::exp(muJ + 0.5*sigJ*sigJ) - 1.0;  // E[Y-1]
    const double drift = (r - lambda*m - 0.5*sigma*sigma) * T;
    const double disc  = std::exp(-r * T);
    double psum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double logS = drift + sigma * std::sqrt(T) * Z(rng);
        int    nj   = Pois(rng);
        for (int j = 0; j < nj; ++j)
            logS += muJ + sigJ * Z(rng);   // each jump: log(Y_j)
        psum += std::max(S0 * std::exp(logS) - K, 0.0);
    }
    return disc * psum / n_paths;
}`,
    explanation: "The Merton jump drift correction (-lambda*m) keeps the discounted stock price a martingale under the risk-neutral measure; without it, the expected stock price at T would deviate from the forward by the expected jump size times the expected jump count.",
  },
  {
    id: "cpp-20260621-b1-adaptive-simpson",
    language: "cpp",
    title: "Adaptive Simpson's rule for peaked option integrands",
    tag: "numerics",
    code: `#include <cmath>
#include <functional>

// Adaptive Simpson: recursively bisects intervals where the error estimate
// |S - S_left - S_right| / 15 exceeds tolerance.
// More accurate than fixed-grid quadrature for Heston characteristic functions.
static double simpsonRule(const std::function<double(double)>& f,
                           double a, double fa, double m, double fm,
                           double b, double fb) {
    return (b - a) / 6.0 * (fa + 4.0*fm + fb);
}

double adaptiveSimpson(std::function<double(double)> f,
                        double a, double b,
                        double tol = 1e-8, int depth = 0) {
    double m = (a + b) * 0.5;
    double fa = f(a), fm = f(m), fb = f(b);
    double whole = simpsonRule(f, a, fa, m, fm, b, fb);

    std::function<double(double,double,double,double,double,double,double,int)> rec;
    rec = [&](double a, double fa, double m, double fm,
              double b, double fb, double whole, int d) -> double {
        double ml = (a+m)*0.5, mr = (m+b)*0.5;
        double fml = f(ml), fmr = f(mr);
        double L = simpsonRule(f, a, fa, ml, fml, m, fm);
        double R = simpsonRule(f, m, fm, mr, fmr, b, fb);
        double err = std::abs(L + R - whole) / 15.0;
        if (d > 50 || err < tol)
            return L + R + err;   // Richardson extrapolation correction
        return rec(a,fa,ml,fml,m,fm, L, d+1)
             + rec(m,fm,mr,fmr,b,fb, R, d+1);
    };
    return rec(a, fa, m, fm, b, fb, whole, 0);
}`,
    explanation: "The Richardson extrapolation correction (adding err/15) accelerates convergence by one order; the adaptive bisection concentrates evaluations near the integrand's peak (e.g., near the forward for an option density) rather than wasting points in the flat tails.",
  },
  {
    id: "cpp-20260621-b1-kalman-1d",
    language: "cpp",
    title: "1D Kalman filter for fair-value estimation from noisy prices",
    tag: "signal",
    code: `// 1D Kalman filter: state is hidden fair value x, observations are noisy prices.
// State equation: x_{t+1} = x_t + process noise (random walk)
// Observation:    z_t     = x_t + measurement noise
struct Kalman1D {
    double x;   // state estimate
    double P;   // state variance
    double Q;   // process noise variance (how fast fair value can drift)
    double R;   // measurement noise variance (bid-ask spread / 2)^2

    explicit Kalman1D(double x0 = 0.0, double P0 = 1.0,
                      double Q_ = 1e-4, double R_ = 0.01)
        : x(x0), P(P0), Q(Q_), R(R_) {}

    // Predict: state drifts; uncertainty grows
    void predict() noexcept { P += Q; }

    // Update: new observation z
    double update(double z) noexcept {
        const double K = P / (P + R);   // Kalman gain in [0,1]
        x += K * (z - x);               // posterior mean
        P *= (1.0 - K);                 // posterior variance (decreases)
        return x;
    }

    // Combined step
    double step(double z) noexcept { predict(); return update(z); }
};

// Pair-spread tracker
double spreadEstimate(double* prices, int n, double q, double r) {
    Kalman1D kf(prices[0], 1.0, q, r);
    double last = prices[0];
    for (int i = 1; i < n; ++i) last = kf.step(prices[i]);
    return last;
}`,
    explanation: "The Kalman gain K = P/(P+R) automatically adapts the weighting between the prior estimate and the new observation: when P>>R (high model uncertainty) K→1 and we trust the observation; when P<<R (high measurement noise) K→0 and we trust the prior — this is the optimal linear filter.",
  },
  {
    id: "cpp-20260621-b1-hazard-rate",
    language: "cpp",
    title: "Piecewise-constant hazard rate survival probability",
    tag: "credit",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Piecewise-constant hazard: lambda(t) = lambda_i for t in [T_{i-1}, T_i)
// Survival:  S(t) = exp(-integral_0^t lambda(s) ds)
// Default prob in (a, b]: S(a) - S(b)
struct HazardCurve {
    std::vector<double> pillars;  // T_1, T_2, ..., T_n (sorted)
    std::vector<double> hazards;  // lambda_i for each interval

    // Cumulative hazard H(t) = integral_0^t lambda(s) ds
    double cumHazard(double t) const noexcept {
        double H = 0.0, prev = 0.0;
        for (std::size_t i = 0; i < pillars.size(); ++i) {
            double next = pillars[i];
            if (t <= prev) break;
            H   += hazards[i] * (std::min(t, next) - prev);
            prev = next;
            if (t <= next) break;
        }
        return H;
    }

    double survival(double t)           const noexcept { return std::exp(-cumHazard(t)); }
    double defaultProb(double a, double b) const noexcept {
        return survival(a) - survival(b);
    }

    // Implied hazard from survival at a single point
    static double impliedHazard(double S, double T) noexcept {
        return -std::log(S) / T;
    }
};`,
    explanation: "Piecewise-constant hazard rates are the credit analogue of forward rates: each pillar lambda_i can be bootstrapped independently from a CDS spread at that tenor, keeping the model arbitrage-free while remaining analytically tractable for survival-probability integrals.",
  },
  {
    id: "cpp-20260621-b1-cds-spread",
    language: "cpp",
    title: "CDS par spread from hazard curve and discount factors",
    tag: "credit",
    code: `#include <vector>
#include <cmath>

// CDS par spread = (protection leg PV) / (premium leg PV)
// Protection: LGD * sum_i (S(t_{i-1}) - S(t_i)) * df(mid_i)
// Premium:    sum_i tau_i * S(t_i) * df(t_i)
struct CDSPricer {
    double recovery = 0.40;

    double parSpread(const std::vector<double>& tenors,     // coupon dates
                     const std::vector<double>& dfs,        // OIS discount factors
                     const std::vector<double>& survivals   // survival at coupon dates
                     ) const noexcept {
        const double LGD = 1.0 - recovery;
        double protection = 0.0, premium = 0.0;

        for (std::size_t i = 0; i < tenors.size(); ++i) {
            const double t0  = (i == 0) ? 0.0 : tenors[i-1];
            const double t1  = tenors[i];
            const double S0  = (i == 0) ? 1.0 : survivals[i-1];
            const double S1  = survivals[i];
            const double tau = t1 - t0;

            // Protection: default approximated at period midpoint
            const double mid_df = std::sqrt(dfs[i] * (i==0 ? 1.0 : dfs[i-1]));
            protection += LGD * (S0 - S1) * mid_df;

            // Premium: coupon if no default yet
            premium    += tau * S1 * dfs[i];
        }
        return protection / premium;  // par spread in decimal (e.g. 0.01 = 100 bps)
    }
};`,
    explanation: "The CDS par spread is the fixed coupon that sets the swap's NPV to zero at inception; bootstrapping this spread across tenors in maturity order extracts hazard rates that, when fed back into the protection-leg integral, exactly reprice each input CDS — the credit analog of yield-curve bootstrapping.",
  },
  {
    id: "cpp-20260621-b1-token-bucket",
    language: "cpp",
    title: "Token bucket rate limiter for order submission",
    tag: "low-latency",
    code: `#include <chrono>
#include <algorithm>

// Token bucket: refills at rate R tokens/s up to capacity C.
// Each order submission consumes one token; rejected if bucket is empty.
// Allows short bursts up to C orders while enforcing sustained rate R.
class TokenBucket {
    using Clock = std::chrono::steady_clock;
    double        capacity_;
    double        rate_;       // tokens per second
    double        tokens_;
    Clock::time_point last_;

public:
    TokenBucket(double capacity, double rate) noexcept
        : capacity_(capacity), rate_(rate), tokens_(capacity)
        , last_(Clock::now()) {}

    bool tryConsume(double cost = 1.0) noexcept {
        const auto now = Clock::now();
        const double elapsed =
            std::chrono::duration<double>(now - last_).count();
        tokens_ = std::min(capacity_, tokens_ + rate_ * elapsed);
        last_ = now;
        if (tokens_ < cost) return false;  // throttled
        tokens_ -= cost;
        return true;
    }

    double available() const noexcept { return tokens_; }
};

// Usage: 100 orders/s sustained, burst up to 10
//   TokenBucket limiter(10.0, 100.0);
//   if (!limiter.tryConsume()) return ERR_THROTTLED;`,
    explanation: "The token bucket allows bursts up to capacity C while enforcing the long-run rate R — unlike a leaky bucket which smooths all bursts, the token bucket is appropriate for exchange rate limits that permit short bursts but impose sustained-rate caps over rolling windows.",
  },
  {
    id: "cpp-20260621-b1-circular-deque",
    language: "cpp",
    title: "Fixed-capacity circular deque for rolling window of fills",
    tag: "data-structures",
    code: `#include <array>
#include <cstddef>
#include <optional>
#include <cassert>

// Fixed-size circular deque: O(1) push/pop at both ends.
// Stack-allocated — no heap, no locks. Ideal for a rolling fill window.
template <typename T, std::size_t N>
class CircularDeque {
    std::array<T, N> buf_;
    std::size_t head_ = 0, size_ = 0;

    std::size_t wrap(std::size_t i) const noexcept { return i % N; }
public:
    bool        empty() const noexcept { return size_ == 0; }
    bool        full()  const noexcept { return size_ == N; }
    std::size_t size()  const noexcept { return size_; }

    bool push_back(T v) noexcept {
        if (full()) return false;
        buf_[wrap(head_ + size_)] = std::move(v);
        ++size_; return true;
    }
    bool push_front(T v) noexcept {
        if (full()) return false;
        head_ = wrap(head_ + N - 1);
        buf_[head_] = std::move(v);
        ++size_; return true;
    }
    std::optional<T> pop_front() noexcept {
        if (empty()) return std::nullopt;
        T v = std::move(buf_[head_]);
        head_ = wrap(head_ + 1); --size_; return v;
    }
    std::optional<T> pop_back() noexcept {
        if (empty()) return std::nullopt;
        T v = std::move(buf_[wrap(head_ + size_ - 1)]);
        --size_; return v;
    }
    T& front() noexcept { return buf_[head_]; }
    T& back()  noexcept { return buf_[wrap(head_ + size_ - 1)]; }
};`,
    explanation: "Circular indexing with modulo (`% N`) avoids branch-heavy sentinel nodes; for power-of-2 N, the compiler replaces % with bitwise AND making the index arithmetic as cheap as direct array access while still providing O(1) operations at both ends.",
  },
  {
    id: "cpp-20260621-b1-ema-crossover",
    language: "cpp",
    title: "EMA crossover trading signal with vectorised batch update",
    tag: "signal",
    code: `#include <vector>
#include <cstddef>

// EMA: ema_t = alpha * price_t + (1-alpha) * ema_{t-1}, alpha = 2/(n+1)
// Crossover signal: +1 when fast EMA > slow EMA, -1 when below.
struct EMACrossover {
    double af, as_;         // fast/slow alpha
    double ef = 0, es = 0;  // running EMA values
    bool   init = false;

    EMACrossover(int fast, int slow) noexcept
        : af(2.0 / (fast + 1)), as_(2.0 / (slow + 1)) {}

    int update(double price) noexcept {
        if (!init) { ef = es = price; init = true; return 0; }
        ef = af * price + (1.0 - af) * ef;
        es = as_ * price + (1.0 - as_) * es;
        return (ef > es) ? 1 : (ef < es) ? -1 : 0;
    }
};

// Vectorised batch: produce signal array for a full price series
std::vector<int> emaCrossoverBatch(const std::vector<double>& prices,
                                    int fast, int slow) {
    EMACrossover model(fast, slow);
    std::vector<int> sig(prices.size());
    for (std::size_t i = 0; i < prices.size(); ++i)
        sig[i] = model.update(prices[i]);
    return sig;
}`,
    explanation: "Exponential weights decay geometrically so old prices become negligible after ~5 half-lives (n periods); storing only two running scalars (ef, es) instead of a full window makes the crossover O(1) in memory and maximally cache-friendly for real-time streaming.",
  },
  {
    id: "cpp-20260621-b1-ranges-greeks",
    language: "cpp",
    title: "std::ranges views for active-position Greek aggregation",
    tag: "modern",
    code: `#include <ranges>
#include <vector>
#include <numeric>

struct Position {
    double delta, gamma, vega, theta;
    double notional;
    bool   active;
};

struct Greeks { double delta, gamma, vega, theta; };

// Filter active positions and accumulate Greeks in one pipeline
Greeks aggregateGreeks(const std::vector<Position>& book) {
    Greeks g{};
    for (const auto& p :
            book | std::views::filter([](const Position& p){ return p.active; })) {
        g.delta += p.delta * p.notional;
        g.gamma += p.gamma * p.notional;
        g.vega  += p.vega  * p.notional;
        g.theta += p.theta * p.notional;
    }
    return g;
}

// Top-N delta contributors (descending) via ranges sort
std::vector<double> topDeltaContribs(const std::vector<Position>& book, int n) {
    std::vector<double> ds;
    ds.reserve(book.size());
    std::ranges::transform(book, std::back_inserter(ds),
        [](const Position& p){ return p.delta * p.notional; });
    std::ranges::sort(ds, std::ranges::greater{});
    if (static_cast<int>(ds.size()) > n) ds.resize(n);
    return ds;
}`,
    explanation: "std::views::filter is lazy — it never materialises a filtered copy of the book into memory, so aggregating across 50,000 positions with 40,000 active ones uses only the active positions' cache lines; std::ranges::sort eliminates the iterator-pair boilerplate of std::sort.",
  },
  {
    id: "cpp-20260621-b1-atomic-ordering",
    language: "cpp",
    title: "Memory ordering cheat sheet: relaxed / acq-rel / seq_cst",
    tag: "concurrency",
    code: `#include <atomic>
#include <cassert>

// RELAXED: only atomicity, no synchronisation. Use for statistics counters.
std::atomic<long> g_ticks{0};
void countTick() { g_ticks.fetch_add(1, std::memory_order_relaxed); }

// ACQUIRE/RELEASE: the canonical producer-consumer pair.
std::atomic<bool> g_ready{false};
double            g_data = 0.0;     // plain (non-atomic) shared variable

void producer() {
    g_data = 42.0;                              // must happen before ...
    g_ready.store(true, std::memory_order_release); // ... this store
}
void consumer() {
    while (!g_ready.load(std::memory_order_acquire));  // sees g_data
    assert(g_data == 42.0);   // guaranteed: release-store synchronises with acquire-load
}

// ACQ_REL on fetch_add — ticket lock (fair, FIFO order)
struct TicketLock {
    std::atomic<unsigned> next_{0}, serving_{0};
    void lock() noexcept {
        unsigned my = next_.fetch_add(1, std::memory_order_acq_rel);
        while (serving_.load(std::memory_order_acquire) != my)
            __builtin_ia32_pause();
    }
    void unlock() noexcept { serving_.fetch_add(1, std::memory_order_release); }
};

// SEQ_CST: total global order across all threads — needed for Dekker's algorithm.
// Most expensive (~3x acquire/release). Prefer acq/rel unless proving correctness
// requires a single total order.`,
    explanation: "The acquire/release pair is the minimum ordering needed for a single producer-consumer handoff — it is cheaper than seq_cst because it only orders the specific pair of operations rather than imposing a total order across all threads' atomic operations.",
  },
  {
    id: "cpp-20260621-b1-hugepages",
    language: "cpp",
    title: "Hugepages allocation for order book flat array",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <new>

// 4 KB pages → 200 TLB entries for an 800 KB order book.
// 2 MB hugepages → 1 TLB entry for the same book.
// TLB misses cost ~100 ns each; hugepages eliminate them on hot reads.
constexpr std::size_t HUGE_2MB = 2UL << 20;

inline std::size_t roundUp(std::size_t n, std::size_t align) noexcept {
    return (n + align - 1) & ~(align - 1);
}

void* allocHugepage(std::size_t bytes) {
    std::size_t sz = roundUp(bytes, HUGE_2MB);
    // Try explicit hugepages first (requires /proc/sys/vm/nr_hugepages > 0)
    void* p = ::mmap(nullptr, sz,
                     PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB, -1, 0);
    if (p == MAP_FAILED) {
        // Fall back: regular mmap + transparent hugepages (THP)
        p = ::mmap(nullptr, sz,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (p == MAP_FAILED) throw std::bad_alloc{};
        ::madvise(p, sz, MADV_HUGEPAGE);  // request THP kernel merging
    }
    return p;
}

void freeHugepage(void* p, std::size_t bytes) noexcept {
    ::munmap(p, roundUp(bytes, HUGE_2MB));
}`,
    explanation: "THP (transparent hugepages) with MADV_HUGEPAGE lets the kernel automatically promote 4 KB pages to 2 MB pages when the virtual-address range is naturally aligned; this avoids the root/hugepages config requirement of MAP_HUGETLB while still collapsing TLB entries for large contiguous allocations.",
  },
  {
    id: "cpp-20260621-b1-compile-matrix",
    language: "cpp",
    title: "Constexpr fixed-size matrix multiply for compile-time covariance",
    tag: "modern",
    code: `#include <array>
#include <cstddef>

// Compile-time matrix multiply: A (R x K) * B (K x C) -> result (R x C).
// Small factor-model matrices (3x3, 5x5) are fully unrolled at compile time.
template <std::size_t R, std::size_t K, std::size_t C>
constexpr auto matmul(
    const std::array<std::array<double, K>, R>& A,
    const std::array<std::array<double, C>, K>& B)
{
    std::array<std::array<double, C>, R> out{};
    for (std::size_t i = 0; i < R; ++i)
        for (std::size_t j = 0; j < C; ++j)
            for (std::size_t k = 0; k < K; ++k)
                out[i][j] += A[i][k] * B[k][j];
    return out;
}

// 2-asset daily covariance matrix (sigma = [0.20, 0.25], corr = 0.5)
constexpr std::array<std::array<double,2>,2> dailyCov = {{
    {{0.0004, 0.0025}},
    {{0.0025, 0.0625}}
}};

// Diagonal scaling matrix for 5-day horizon
constexpr std::array<std::array<double,2>,2> scale5 = {{
    {{5.0, 0.0}},
    {{0.0, 5.0}}
}};

// 5-day covariance computed entirely at compile time
constexpr auto weeklyCov = matmul<2,2,2>(dailyCov, scale5);

static_assert(weeklyCov[0][0] == 0.002, "5-day asset-1 variance");`,
    explanation: "Marking the matrix multiply constexpr means the compiler evaluates the entire product at build time and bakes the result into the binary as a constant — useful for hard-coded factor-model risk matrices or fixed correlation transforms that are known at compile time.",
  },
];
