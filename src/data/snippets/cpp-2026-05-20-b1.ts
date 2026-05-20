import type { Snippet } from "./types";

export const cppSnippets20260520B1: Snippet[] = [
  {
    id: "cpp-20260520-b1-object-pool",
    language: "cpp",
    title: "Object pool allocator (free-list)",
    tag: "memory",
    code: `#include <array>
#include <cassert>
#include <cstddef>
#include <iostream>
#include <new>        // placement new

// Fixed-capacity pool: raw storage + intrusive free-list using a union.
// No heap allocation after construction — ideal for hot-path order objects.
template<typename T, std::size_t N>
class ObjectPool {
    // Each slot is either a live T or a next-free-slot pointer.
    union FreeNode {
        alignas(T) std::byte storage[sizeof(T)];
        FreeNode* next;
    };

    std::array<FreeNode, N> pool_{};
    FreeNode* head_ = nullptr;
    std::size_t capacity_ = N;

public:
    ObjectPool() {
        // Thread the free-list through all slots.
        for (std::size_t i = 0; i + 1 < N; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[N - 1].next = nullptr;
        head_ = &pool_[0];
    }

    template<typename... Args>
    T* alloc(Args&&... args) {
        assert(head_ && "pool exhausted");
        FreeNode* node = head_;
        head_ = head_->next;          // pop free-list head
        return new(&node->storage) T(std::forward<Args>(args)...);
    }

    void free(T* ptr) {
        ptr->~T();                    // explicit destructor — no delete
        auto* node = reinterpret_cast<FreeNode*>(ptr);
        node->next = head_;           // push back onto free-list
        head_ = node;
    }

    bool empty() const { return head_ == nullptr; }
};

struct Order { int id; double price; int qty; };

int main() {
    ObjectPool<Order, 4> pool;
    Order* o1 = pool.alloc(1, 99.5, 100);
    Order* o2 = pool.alloc(2, 100.0, 200);
    std::cout << "order1 id=" << o1->id << " price=" << o1->price << "\\n";
    pool.free(o1);
    Order* o3 = pool.alloc(3, 101.0, 50); // reuses o1's slot
    std::cout << "order3 id=" << o3->id << "\\n";
    pool.free(o2); pool.free(o3);
}`,
    explanation:
      "The union trick lets each free slot act as a list node without any extra allocation: when the slot is free, its bytes store a pointer; when occupied, they store the live object. This gives O(1) alloc and free with zero heap traffic, critical for low-latency order-creation paths.",
  },
  {
    id: "cpp-20260520-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson FD European call pricer",
    tag: "finance",
    code: `#include <algorithm>
#include <cmath>
#include <iostream>
#include <vector>

// Crank-Nicolson: average of explicit (forward) and implicit (backward)
// Euler in time — second-order accurate in both space and time.
double crankNicolsonCall(double S0, double K, double r,
                          double sigma, double T,
                          int M /*time*/, int N /*space*/) {
    double dt = T / M;
    double Smax = 4.0 * K;
    double dS = Smax / N;

    // Grid of option values, indexed [time_step][space]
    std::vector<std::vector<double>> V(M + 1, std::vector<double>(N + 1, 0.0));

    // Terminal condition (payoff at maturity)
    for (int j = 0; j <= N; ++j)
        V[M][j] = std::max(j * dS - K, 0.0);

    // Tridiagonal coefficients (CN averages half-step explicit + implicit)
    auto alpha = [&](int j) { return 0.25 * sigma * sigma * j * j * dt - 0.25 * r * j * dt; };
    auto beta  = [&](int j) { return -0.5 * sigma * sigma * j * j * dt - 0.5 * r * dt; };
    auto gamma = [&](int j) { return 0.25 * sigma * sigma * j * j * dt + 0.25 * r * j * dt; };

    // Thomas (tri-diagonal) solve: forward sweep then back-substitute
    auto thomas = [&](std::vector<double>& a, std::vector<double>& b,
                       std::vector<double>& c, std::vector<double>& d) {
        int n = (int)d.size();
        for (int i = 1; i < n; ++i) {
            double w = a[i] / b[i - 1];
            b[i] -= w * c[i - 1];
            d[i] -= w * d[i - 1];
        }
        std::vector<double> x(n);
        x[n - 1] = d[n - 1] / b[n - 1];
        for (int i = n - 2; i >= 0; --i)
            x[i] = (d[i] - c[i] * x[i + 1]) / b[i];
        return x;
    };

    // Backward time-stepping
    for (int i = M - 1; i >= 0; --i) {
        int sz = N - 1;  // interior points only (j=1..N-1)
        std::vector<double> a(sz), b(sz), c(sz), d(sz);
        for (int k = 0; k < sz; ++k) {
            int j = k + 1;
            a[k] = -alpha(j);
            b[k] = 1.0 - beta(j);
            c[k] = -gamma(j);
            // RHS: explicit part of CN from previous time slice
            d[k] = alpha(j) * V[i+1][j-1]
                 + (1.0 + beta(j)) * V[i+1][j]
                 + gamma(j) * V[i+1][j+1];
        }
        // Boundary: V=0 at S=0; V=Smax-K*exp(-r*(T-i*dt)) at S=Smax
        d[sz - 1] -= gamma(N - 1) * (Smax - K * std::exp(-r * (T - i * dt)));
        auto sol = thomas(a, b, c, d);
        for (int k = 0; k < sz; ++k)
            V[i][k + 1] = sol[k];
        V[i][0] = 0.0;
        V[i][N] = Smax - K * std::exp(-r * (T - i * dt));
    }

    // Interpolate to S0
    int jStar = static_cast<int>(S0 / dS);
    double frac = (S0 - jStar * dS) / dS;
    return V[0][jStar] * (1.0 - frac) + V[0][jStar + 1] * frac;
}

int main() {
    double price = crankNicolsonCall(100, 100, 0.05, 0.2, 1.0, 200, 400);
    std::cout << "CN call price: " << price << "\\n"; // ~10.45
}`,
    explanation:
      "Crank-Nicolson averages the explicit and implicit Euler discretisations, yielding O(dt²) accuracy versus O(dt) for pure methods, and it remains unconditionally stable — critical when pricing near-the-money options that require fine time grids.",
  },
  {
    id: "cpp-20260520-b1-lookback-mc",
    language: "cpp",
    title: "Floating-strike lookback call Monte Carlo",
    tag: "finance",
    code: `#include <algorithm>
#include <cmath>
#include <iostream>
#include <numeric>
#include <random>
#include <vector>

// Floating-strike lookback call: payoff = S_T - min(S_t, t in [0,T])
// The holder benefits from the lowest price over the path — always in the money.
double lookbackCallMC(double S0, double r, double sigma,
                       double T, int steps, int paths, uint32_t seed = 42) {
    double dt     = T / steps;
    double drift  = (r - 0.5 * sigma * sigma) * dt;
    double vol    = sigma * std::sqrt(dt);

    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z(0.0, 1.0);

    double sum_payoff = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S   = S0;
        double Smin = S0;          // track running minimum
        for (int t = 0; t < steps; ++t) {
            S *= std::exp(drift + vol * Z(rng));
            Smin = std::min(Smin, S); // update minimum at each step
        }
        sum_payoff += std::max(S - Smin, 0.0); // payoff = S_T - S_min
    }

    double df = std::exp(-r * T);
    return df * sum_payoff / paths;
}

int main() {
    double price = lookbackCallMC(100.0, 0.05, 0.20, 1.0, 252, 200'000);
    std::cout << "Lookback call MC price: " << price << "\\n";
    // Analytic formula gives ~14.7 for these params; convergence is slow.
}`,
    explanation:
      "Lookback options are path-dependent in the strongest sense — every step in the simulation contributes to the payoff; discretisation of the running minimum introduces a bias of O(dt) that can be corrected analytically via a continuity correction term of σ√dt * 0.5826.",
  },
  {
    id: "cpp-20260520-b1-portfolio-greeks",
    language: "cpp",
    title: "Aggregate portfolio delta/gamma/vega",
    tag: "finance",
    code: `#include <iostream>
#include <numeric>
#include <vector>

struct Greeks { double delta, gamma, vega; };

struct Position {
    double qty;    // positive = long, negative = short
    Greeks greeks; // per-unit option greeks
};

struct PortfolioGreeks {
    double delta = 0.0;
    double gamma = 0.0;
    double vega  = 0.0;
};

// Aggregate: portfolio greek = sum over positions of qty * unit greek.
// Dollar delta = delta * S; dollar vega = vega * 0.01 (per 1 vol point).
PortfolioGreeks aggregate(const std::vector<Position>& book) {
    return std::accumulate(
        book.begin(), book.end(),
        PortfolioGreeks{},
        [](PortfolioGreeks acc, const Position& p) {
            acc.delta += p.qty * p.greeks.delta;
            acc.gamma += p.qty * p.greeks.gamma;
            acc.vega  += p.qty * p.greeks.vega;
            return acc;
        });
}

int main() {
    std::vector<Position> book = {
        { 100.0, {0.55, 0.02, 0.18}},  // long 100 call
        {-50.0,  {0.40, 0.015, 0.14}}, // short 50 call (hedge)
        { 200.0, {-0.60, 0.02, 0.19}}, // long 200 put
    };

    auto pg = aggregate(book);
    std::cout << "Net delta: " << pg.delta << "\\n"  // signed units
              << "Net gamma: " << pg.gamma << "\\n"
              << "Net vega:  " << pg.vega  << "\\n";
}`,
    explanation:
      "Gamma hedging requires knowing the second-order aggregate across all positions; even if delta is zeroed by the hedge leg, residual gamma leaves the book exposed to large moves, and residual vega exposes it to implied-vol shifts.",
  },
  {
    id: "cpp-20260520-b1-bond-duration",
    language: "cpp",
    title: "Macaulay & modified duration + convexity",
    tag: "finance",
    code: `#include <cmath>
#include <iostream>
#include <vector>

// Fixed-coupon bond analytics from cash-flow stream.
struct BondAnalytics {
    double price;
    double macaulay_duration;  // time-weighted PV / dirty price
    double modified_duration;  // sensitivity: dP/dy / P = -MacD/(1+y/freq)
    double convexity;          // second derivative / P (in years^2)
};

BondAnalytics bondAnalytics(const std::vector<double>& cashflows,
                              const std::vector<double>& times,   // in years
                              double ytm, int freq = 2) {
    double P   = 0.0;
    double D   = 0.0;  // Macaulay numerator
    double Cvx = 0.0;  // convexity numerator

    for (std::size_t i = 0; i < cashflows.size(); ++i) {
        double t  = times[i];
        double cf = cashflows[i];
        double pv = cf / std::pow(1.0 + ytm / freq, t * freq);
        P   += pv;
        D   += t * pv;            // time * PV contribution
        Cvx += t * (t + 1.0 / freq) * pv; // convexity weight
    }

    double macD = D / P;
    double modD = macD / (1.0 + ytm / freq);
    double cvx  = Cvx / P / std::pow(1.0 + ytm / freq, 2);
    return {P, macD, modD, cvx};
}

int main() {
    // 5-year 6% semi-annual bond, par=100, ytm=5%
    std::vector<double> cf, t;
    for (int i = 1; i <= 10; ++i) {
        cf.push_back(3.0);       // semi-annual coupon
        t.push_back(i * 0.5);
    }
    cf.back() += 100.0;          // par repayment at maturity

    auto a = bondAnalytics(cf, t, 0.05);
    std::cout << "Price:     " << a.price              << "\\n" // ~104.38
              << "MacD:      " << a.macaulay_duration  << "\\n" // ~4.36y
              << "ModD:      " << a.modified_duration  << "\\n" // ~4.26y
              << "Convexity: " << a.convexity          << "\\n";
}`,
    explanation:
      "Modified duration linearises the price-yield relationship, but convexity captures the curvature: a bond with higher convexity outperforms a low-convexity bond of equal duration in both rising and falling yield environments — the classic bond portfolio optimisation trade-off.",
  },
  {
    id: "cpp-20260520-b1-seq-cst-fence",
    language: "cpp",
    title: "Sequential consistency fence vs acquire/release",
    tag: "concurrency",
    code: `#include <atomic>
#include <cassert>
#include <iostream>
#include <thread>

// Dekker-style mutual exclusion using fences.
// With acquire/release fences alone, the CPU can reorder stores
// from different threads; seq_cst fence prevents that.

std::atomic<bool> flag0{false};
std::atomic<bool> flag1{false};
std::atomic<int>  turn{0};

// Thread 0 declares intent then checks flag1.
void thread0(int& victim0) {
    flag0.store(true, std::memory_order_relaxed);
    // seq_cst fence: all prior stores visible before subsequent loads
    std::atomic_thread_fence(std::memory_order_seq_cst);
    if (flag1.load(std::memory_order_relaxed)) {
        // Another thread also wants in — back off if not our turn
        if (turn.load(std::memory_order_relaxed) != 0) {
            flag0.store(false, std::memory_order_relaxed);
            while (turn.load(std::memory_order_acquire) != 0) {}
            flag0.store(true, std::memory_order_relaxed);
            std::atomic_thread_fence(std::memory_order_seq_cst);
        }
    }
    // Critical section
    ++victim0;
    turn.store(1, std::memory_order_relaxed);
    flag0.store(false, std::memory_order_release);
}

void thread1(int& victim1) {
    flag1.store(true, std::memory_order_relaxed);
    std::atomic_thread_fence(std::memory_order_seq_cst);
    if (flag0.load(std::memory_order_relaxed)) {
        if (turn.load(std::memory_order_relaxed) != 1) {
            flag1.store(false, std::memory_order_relaxed);
            while (turn.load(std::memory_order_acquire) != 1) {}
            flag1.store(true, std::memory_order_relaxed);
            std::atomic_thread_fence(std::memory_order_seq_cst);
        }
    }
    ++victim1;
    turn.store(0, std::memory_order_relaxed);
    flag1.store(false, std::memory_order_release);
}

int main() {
    int v0 = 0, v1 = 0;
    std::thread t0(thread0, std::ref(v0));
    std::thread t1(thread1, std::ref(v1));
    t0.join(); t1.join();
    std::cout << "v0=" << v0 << " v1=" << v1 << "\\n"; // 1 1, no race
}`,
    explanation:
      "A seq_cst fence (atomic_thread_fence) is stricter than acquire/release fences: it inserts a full memory barrier that prevents store-load reordering across threads, which is the only ordering acquire/release alone cannot prevent on architectures like x86-TSO or ARM.",
  },
  {
    id: "cpp-20260520-b1-mpmc-ring",
    language: "cpp",
    title: "MPMC bounded ring buffer (Vyukov sequence algorithm)",
    tag: "concurrency",
    code: `#include <atomic>
#include <cassert>
#include <cstddef>
#include <iostream>
#include <optional>
#include <thread>
#include <vector>

// Dmitry Vyukov's MPMC queue: each cell carries an atomic sequence number.
// Producers CAS head; consumers CAS tail; no ABA problem because seq wraps.
template<typename T, std::size_t CAP>
class MPMCRing {
    static_assert((CAP & (CAP - 1)) == 0, "CAP must be power of two");

    struct Cell {
        std::atomic<std::size_t> seq;
        T data;
    };

    alignas(64) std::array<Cell, CAP> buf_;
    alignas(64) std::atomic<std::size_t> head_{0}; // next slot to enqueue
    alignas(64) std::atomic<std::size_t> tail_{0}; // next slot to dequeue

public:
    MPMCRing() {
        for (std::size_t i = 0; i < CAP; ++i)
            buf_[i].seq.store(i, std::memory_order_relaxed);
    }

    bool push(const T& val) {
        std::size_t pos = head_.load(std::memory_order_relaxed);
        for (;;) {
            Cell& cell = buf_[pos & (CAP - 1)];
            std::size_t seq = cell.seq.load(std::memory_order_acquire);
            std::ptrdiff_t diff = static_cast<std::ptrdiff_t>(seq) -
                                  static_cast<std::ptrdiff_t>(pos);
            if (diff == 0) {
                // Slot is free; try to claim it
                if (head_.compare_exchange_weak(pos, pos + 1,
                        std::memory_order_relaxed))
                {
                    cell.data = val;
                    // Publish: set seq = pos+1 so a consumer sees it
                    cell.seq.store(pos + 1, std::memory_order_release);
                    return true;
                }
            } else if (diff < 0) {
                return false; // queue full
            } else {
                pos = head_.load(std::memory_order_relaxed);
            }
        }
    }

    std::optional<T> pop() {
        std::size_t pos = tail_.load(std::memory_order_relaxed);
        for (;;) {
            Cell& cell = buf_[pos & (CAP - 1)];
            std::size_t seq = cell.seq.load(std::memory_order_acquire);
            std::ptrdiff_t diff = static_cast<std::ptrdiff_t>(seq) -
                                  static_cast<std::ptrdiff_t>(pos + 1);
            if (diff == 0) {
                if (tail_.compare_exchange_weak(pos, pos + 1,
                        std::memory_order_relaxed))
                {
                    T val = cell.data;
                    // Free slot: advance seq by CAP so next wrap can reuse
                    cell.seq.store(pos + CAP, std::memory_order_release);
                    return val;
                }
            } else if (diff < 0) {
                return std::nullopt; // queue empty
            } else {
                pos = tail_.load(std::memory_order_relaxed);
            }
        }
    }
};

int main() {
    MPMCRing<int, 64> q;
    q.push(42);
    auto v = q.pop();
    std::cout << "Got: " << *v << "\\n"; // 42
}`,
    explanation:
      "The sequence-number trick eliminates the ABA problem without a generation counter on head/tail: each cell's seq encodes exactly which lap it belongs to, so a slow producer cannot confuse a fast consumer even after millions of wrap-arounds.",
  },
  {
    id: "cpp-20260520-b1-coroutine-gen",
    language: "cpp",
    title: "C++20 coroutine generator for GBM tick stream",
    tag: "coroutines",
    code: `#include <coroutine>
#include <cmath>
#include <iostream>
#include <random>

// Minimal generator type required by the C++20 coroutine machinery.
template<typename T>
struct Generator {
    struct promise_type {
        T current_value;
        // yield_value suspends and stores the yielded value
        std::suspend_always yield_value(T v) { current_value = v; return {}; }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_never  final_suspend()   noexcept { return {}; }
        Generator           get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> coro;
    ~Generator() { if (coro) coro.destroy(); }

    T next() {
        coro.resume();          // run until next co_yield
        return coro.promise().current_value;
    }
};

// Infinite GBM tick stream: each resume() produces the next price.
Generator<double> gbmStream(double S0, double mu, double sigma, double dt,
                              uint64_t seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z(0.0, 1.0);
    double S = S0;
    for (;;) {                  // infinite — caller decides when to stop
        S *= std::exp((mu - 0.5 * sigma * sigma) * dt + sigma * std::sqrt(dt) * Z(rng));
        co_yield S;             // suspend and pass S to caller
    }
}

int main() {
    auto ticks = gbmStream(100.0, 0.05, 0.20, 1.0 / 252);
    for (int i = 0; i < 5; ++i)
        std::cout << "tick " << i << ": " << ticks.next() << "\\n";
}`,
    explanation:
      "C++20 coroutines turn an infinite simulation loop into a lazy pull sequence with zero heap allocation per tick (the coroutine frame is allocated once); co_yield suspends execution at the exact point of production, giving the caller full control over pacing.",
  },
  {
    id: "cpp-20260520-b1-sse2-dot",
    language: "cpp",
    title: "SSE2 dot product with SIMD intrinsics",
    tag: "simd",
    code: `#include <emmintrin.h>  // SSE2
#include <cstddef>
#include <iostream>
#include <vector>

// Process 2 doubles per cycle with 128-bit XMM registers.
// Fall back to scalar for the tail when n is odd.
double dotSSE2(const double* __restrict__ a,
               const double* __restrict__ b,
               std::size_t n) {
    __m128d acc = _mm_setzero_pd();          // accumulator = {0.0, 0.0}

    std::size_t i = 0;
    for (; i + 1 < n; i += 2) {
        __m128d va = _mm_loadu_pd(a + i);    // unaligned load of 2 doubles
        __m128d vb = _mm_loadu_pd(b + i);
        acc = _mm_add_pd(acc, _mm_mul_pd(va, vb));  // acc += va * vb
    }

    // Horizontal reduction: add the two lanes of acc
    // _mm_shuffle_pd swaps lanes: {hi, lo}
    __m128d shuf = _mm_shuffle_pd(acc, acc, 0x1);
    __m128d sum2 = _mm_add_pd(acc, shuf);   // lane0 = acc[0]+acc[1]
    double result;
    _mm_store_sd(&result, sum2);             // extract lower double

    // Scalar tail (if n is odd)
    for (; i < n; ++i) result += a[i] * b[i];
    return result;
}

int main() {
    std::vector<double> a = {1.0, 2.0, 3.0, 4.0, 5.0};
    std::vector<double> b = {5.0, 4.0, 3.0, 2.0, 1.0};
    double r = dotSSE2(a.data(), b.data(), a.size());
    std::cout << "dot = " << r << "\\n"; // 1*5+2*4+3*3+4*2+5*1 = 35
}`,
    explanation:
      "SSE2 processes two doubles simultaneously in a single XMM register; the horizontal add via shuffle-then-add is faster than _mm_hadd_pd (SSE3) and more portable, making this pattern safe for any x86-64 target without feature flags.",
  },
  {
    id: "cpp-20260520-b1-symbol-intern",
    language: "cpp",
    title: "Symbol interning table (string → uint32_t ID)",
    tag: "performance",
    code: `#include <cstdint>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

// Intern a string: return its stable numeric ID (existing or newly assigned).
// Used in matching engines to replace repeated strcmp with integer equality.
class SymbolTable {
    std::unordered_map<std::string, uint32_t> map_;
    std::vector<std::string> symbols_;          // ID -> string reverse lookup

public:
    // Returns existing ID or inserts and returns a new one.
    uint32_t intern(std::string_view sv) {
        auto key = std::string(sv);
        auto it = map_.find(key);
        if (it != map_.end()) return it->second;
        uint32_t id = static_cast<uint32_t>(symbols_.size());
        symbols_.push_back(key);
        map_.emplace(std::move(key), id);
        return id;
    }

    // Reverse lookup: O(1) because it is just a vector index.
    std::string_view lookup(uint32_t id) const { return symbols_.at(id); }

    std::size_t size() const { return symbols_.size(); }
};

int main() {
    SymbolTable tbl;
    uint32_t id1 = tbl.intern("AAPL");  // 0
    uint32_t id2 = tbl.intern("GOOG");  // 1
    uint32_t id3 = tbl.intern("AAPL");  // same as id1
    std::cout << "AAPL id=" << id1 << " (re-intern=" << id3 << ")\\n";
    std::cout << "id1==id3: " << (id1 == id3) << "\\n"; // 1
    std::cout << "reverse: " << tbl.lookup(id2) << "\\n"; // GOOG
}`,
    explanation:
      "Replacing strings with integer IDs is a classic hot-path optimization: the interning table pays a one-time map lookup on first sight, then all downstream comparisons are O(1) integer equality rather than O(n) string comparisons, which matters when routing thousands of symbols per microsecond.",
  },
  {
    id: "cpp-20260520-b1-timer-wheel",
    language: "cpp",
    title: "Hashed timing wheel — O(1) insert/cancel/fire",
    tag: "performance",
    code: `#include <cstddef>
#include <functional>
#include <forward_list>
#include <iostream>
#include <vector>

// Classic hashed timing wheel: N slots, current slot advances each tick.
// Timers fire when the wheel reaches their slot; longer timers need
// a 'round' counter or hierarchical wheel (omitted for brevity).
struct Timer {
    uint64_t id;
    int      rounds;           // number of full revolutions remaining
    std::function<void()> cb;
};

class TimingWheel {
    std::size_t N_;            // number of slots (should be power-of-two)
    std::vector<std::forward_list<Timer>> slots_;
    std::size_t current_ = 0;
    uint64_t next_id_    = 0;

public:
    explicit TimingWheel(std::size_t N) : N_(N), slots_(N) {}

    // Schedule cb to fire after 'ticks' ticks from now.
    uint64_t schedule(int ticks, std::function<void()> cb) {
        std::size_t slot  = (current_ + ticks) % N_;
        int         rounds = ticks / static_cast<int>(N_); // full revolutions
        uint64_t id = next_id_++;
        slots_[slot].push_front({id, rounds, std::move(cb)});
        return id;
    }

    // Advance one tick: fire all timers in the current slot (round==0).
    void advance() {
        auto& bucket = slots_[current_];
        // Re-insert timers that need more rounds
        std::forward_list<Timer> keep;
        for (auto& t : bucket) {
            if (t.rounds == 0) {
                t.cb();           // fire!
            } else {
                --t.rounds;
                keep.push_front(std::move(t));
            }
        }
        bucket = std::move(keep);
        current_ = (current_ + 1) % N_;
    }
};

int main() {
    TimingWheel tw(8);  // 8-slot wheel
    tw.schedule(2, [] { std::cout << "timer A fired (tick 2)\\n"; });
    tw.schedule(10, [] { std::cout << "timer B fired (tick 10)\\n"; }); // round=1
    for (int i = 0; i < 12; ++i) tw.advance();
}`,
    explanation:
      "The timing wheel amortises timer management to O(1) per operation by hashing expiry time into a slot; the 'rounds' counter extends range to multiples of N without a second wheel, at the cost of one extra comparison per non-expiring timer per revolution.",
  },
  {
    id: "cpp-20260520-b1-expr-templates",
    language: "cpp",
    title: "Expression templates — lazy vector addition",
    tag: "templates",
    code: `#include <cstddef>
#include <iostream>
#include <vector>

// An expression node: holds references to two sub-expressions.
// Evaluation is deferred until operator[] is called.
template<typename L, typename R>
struct AddExpr {
    const L& lhs;
    const R& rhs;
    double operator[](std::size_t i) const { return lhs[i] + rhs[i]; }
    std::size_t size() const { return lhs.size(); }
};

// A wrapper around std::vector that participates in expression templates.
class Vec {
    std::vector<double> data_;
public:
    explicit Vec(std::size_t n, double v = 0.0) : data_(n, v) {}

    // Construct from any expression node (avoids temporaries)
    template<typename Expr>
    Vec(const Expr& e) : data_(e.size()) {
        for (std::size_t i = 0; i < e.size(); ++i)
            data_[i] = e[i];   // each element evaluated once, in-place
    }

    double  operator[](std::size_t i) const { return data_[i]; }
    double& operator[](std::size_t i)       { return data_[i]; }
    std::size_t size() const { return data_.size(); }
};

// operator+ returns an expression node, NOT a Vec — no temp allocation.
template<typename L, typename R>
AddExpr<L, R> operator+(const L& l, const R& r) { return {l, r}; }

int main() {
    Vec a(4, 1.0), b(4, 2.0), c(4, 3.0);
    // a + b + c builds AddExpr<AddExpr<Vec,Vec>,Vec> at compile time.
    // A single pass writes directly into result — no intermediate Vec.
    Vec result = a + b + c;
    for (std::size_t i = 0; i < result.size(); ++i)
        std::cout << result[i] << " "; // 6 6 6 6
    std::cout << "\\n";
}`,
    explanation:
      "Expression templates encode the entire computation tree in the type system at compile time; the compiler collapses all intermediate evaluations into a single loop over the destination, eliminating temporary allocations that would otherwise hit the allocator for every sub-expression.",
  },
  {
    id: "cpp-20260520-b1-avellaneda-stoikov",
    language: "cpp",
    title: "Avellaneda-Stoikov market-making quotes",
    tag: "finance",
    code: `#include <cmath>
#include <iostream>

// Avellaneda-Stoikov (2008): optimal quotes for a market maker
// who maximises expected utility of terminal wealth.
struct ASParams {
    double S;       // current mid price
    double q;       // signed inventory (positive = long)
    double sigma;   // volatility (annualised)
    double gamma;   // risk-aversion coefficient (e.g. 0.1)
    double kappa;   // order-arrival intensity parameter
    double T;       // horizon (years)
    double t;       // current time (years)
};

struct ASQuotes {
    double reservation; // indifference price r
    double spread;      // optimal total spread delta
    double bid;
    double ask;
};

ASQuotes avellanedaStoikov(const ASParams& p) {
    double tau = p.T - p.t;   // time remaining

    // Reservation price: mid adjusted for inventory risk
    // r = S - q * gamma * sigma^2 * (T-t)
    double r = p.S - p.q * p.gamma * p.sigma * p.sigma * tau;

    // Optimal spread: balance inventory risk vs order arrival
    // delta = gamma*sigma^2*(T-t) + (2/gamma)*ln(1 + gamma/kappa)
    double spread = p.gamma * p.sigma * p.sigma * tau
                  + (2.0 / p.gamma) * std::log(1.0 + p.gamma / p.kappa);

    return { r, spread, r - spread / 2.0, r + spread / 2.0 };
}

int main() {
    ASParams p = {100.0, 2.0, 0.20, 0.1, 1.5, 1.0, 0.5};
    auto q = avellanedaStoikov(p);
    std::cout << "Reservation: " << q.reservation << "\\n"  // ~99.6
              << "Spread:      " << q.spread      << "\\n"
              << "Bid:         " << q.bid         << "\\n"
              << "Ask:         " << q.ask         << "\\n";
}`,
    explanation:
      "The AS model gives the closed-form optimal bid/ask as a function of inventory: a long position shifts the reservation price down (the maker prefers to sell), and the spread widens as time-to-horizon shrinks because liquidating risk with little time left is expensive.",
  },
  {
    id: "cpp-20260520-b1-match-engine",
    language: "cpp",
    title: "Price-time priority matching engine",
    tag: "finance",
    code: `#include <cstdint>
#include <iostream>
#include <map>
#include <queue>
#include <vector>

struct Order {
    uint64_t id;
    double   price;
    int      qty;
    uint64_t timestamp;
};

struct Fill { uint64_t buy_id, sell_id; double price; int qty; };

// Bids: highest price first (descending); Asks: lowest price first (ascending).
// Within same price, earliest timestamp wins (time priority).
struct BidCmp {
    bool operator()(const Order& a, const Order& b) const {
        if (a.price != b.price) return a.price < b.price;  // max-heap on price
        return a.timestamp > b.timestamp;                   // min-heap on time
    }
};
struct AskCmp {
    bool operator()(const Order& a, const Order& b) const {
        if (a.price != b.price) return a.price > b.price;  // min-heap on price
        return a.timestamp > b.timestamp;
    }
};

class MatchEngine {
    std::priority_queue<Order, std::vector<Order>, BidCmp> bids_;
    std::priority_queue<Order, std::vector<Order>, AskCmp> asks_;
    uint64_t ts_ = 0;
public:
    void addOrder(char side, double price, int qty, uint64_t id) {
        Order o{id, price, qty, ts_++};
        if (side == 'B') bids_.push(o);
        else             asks_.push(o);
    }

    std::vector<Fill> match() {
        std::vector<Fill> fills;
        while (!bids_.empty() && !asks_.empty() &&
               bids_.top().price >= asks_.top().price) {
            Order bid = bids_.top(); bids_.pop();
            Order ask = asks_.top(); asks_.pop();
            int filled = std::min(bid.qty, ask.qty);
            fills.push_back({bid.id, ask.id, ask.price, filled});
            bid.qty -= filled; ask.qty -= filled;
            if (bid.qty > 0) bids_.push(bid);
            if (ask.qty > 0) asks_.push(ask);
        }
        return fills;
    }
};

int main() {
    MatchEngine me;
    me.addOrder('B', 100.5, 100, 1);
    me.addOrder('S', 100.0, 60,  2);
    me.addOrder('S', 100.5, 80,  3);
    auto fills = me.match();
    for (auto& f : fills)
        std::cout << "fill buy=" << f.buy_id << " sell=" << f.sell_id
                  << " px=" << f.price << " qty=" << f.qty << "\\n";
}`,
    explanation:
      "Priority queues implement price-time priority compactly, but real production engines replace them with red-black trees or sorted arrays for O(log n) cancel-and-replace; the heap here cannot efficiently cancel an order without a lazy-deletion tombstone set.",
  },
  {
    id: "cpp-20260520-b1-fx-bellman-ford",
    language: "cpp",
    title: "FX arbitrage detection via Bellman-Ford",
    tag: "finance",
    code: `#include <cmath>
#include <iostream>
#include <limits>
#include <tuple>
#include <vector>

// Transform FX rates to a directed graph of negative-log weights.
// A negative-weight cycle in this graph corresponds to an arbitrage loop.
bool detectFXArbitrage(int n, const std::vector<std::vector<double>>& rates) {
    // Build edge list: (from, to, weight=-log(rate))
    using Edge = std::tuple<int, int, double>;
    std::vector<Edge> edges;
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            if (i != j && rates[i][j] > 0.0)
                edges.emplace_back(i, j, -std::log(rates[i][j]));

    // Initialise distances to 0 (virtual super-source connected to all with 0)
    std::vector<double> dist(n, 0.0);

    // Relax n-1 times
    for (int iter = 0; iter < n - 1; ++iter)
        for (auto& [u, v, w] : edges)
            if (dist[u] + w < dist[v])
                dist[v] = dist[u] + w;

    // nth relaxation: if any edge still relaxes, negative cycle exists
    for (auto& [u, v, w] : edges)
        if (dist[u] + w < dist[v] - 1e-9) // small epsilon for float noise
            return true;  // arbitrage!

    return false;
}

int main() {
    // USD=0, EUR=1, GBP=2
    std::vector<std::vector<double>> rates = {
        {1.00, 0.85, 0.77},
        {1.18, 1.00, 0.91},
        {1.35, 1.11, 1.00},  // GBP→USD=1.35 creates a cycle > 1
    };
    bool arb = detectFXArbitrage(3, rates);
    std::cout << "Arbitrage: " << std::boolalpha << arb << "\\n"; // true
}`,
    explanation:
      "Taking negative logarithms converts multiplicative arbitrage (product of rates > 1) into an additive negative-weight cycle; initialising all distances to zero is equivalent to adding a virtual source with zero-weight edges to every vertex, allowing multi-currency loops to be detected in O(n³).",
  },
  {
    id: "cpp-20260520-b1-static-vec",
    language: "cpp",
    title: "Stack-backed InlineVec<T,N> — no heap",
    tag: "memory",
    code: `#include <cassert>
#include <cstddef>
#include <iostream>
#include <new>

// Fixed-capacity vector whose storage lives entirely on the stack.
// No heap allocation, no virtual calls — ideal for small hot collections.
template<typename T, std::size_t N>
class InlineVec {
    alignas(T) std::byte buf_[sizeof(T) * N];
    std::size_t size_ = 0;

    T* data() { return reinterpret_cast<T*>(buf_); }
    const T* data() const { return reinterpret_cast<const T*>(buf_); }

public:
    ~InlineVec() {
        for (std::size_t i = 0; i < size_; ++i)
            data()[i].~T();   // explicit destructor for each live element
    }

    void push_back(const T& v) {
        assert(size_ < N && "InlineVec overflow");
        new(data() + size_) T(v); // placement new into aligned buffer
        ++size_;
    }

    T& operator[](std::size_t i)             { return data()[i]; }
    const T& operator[](std::size_t i) const { return data()[i]; }

    T* begin() { return data(); }
    T* end()   { return data() + size_; }
    const T* begin() const { return data(); }
    const T* end()   const { return data() + size_; }

    std::size_t size()  const { return size_; }
    bool        empty() const { return size_ == 0; }
};

int main() {
    InlineVec<int, 8> v;
    v.push_back(10); v.push_back(20); v.push_back(30);
    for (int x : v) std::cout << x << " "; // 10 20 30
    std::cout << "\\nsize=" << v.size() << "\\n";
}`,
    explanation:
      "By using alignas and placement new into a raw byte array, InlineVec avoids any heap allocation while remaining type-safe; the explicit destructor loop is essential because placement new bypasses RAII — the buffer's destructor does not know the element type.",
  },
  {
    id: "cpp-20260520-b1-bitfield-flags",
    language: "cpp",
    title: "Order flags packed into uint32_t bitfield",
    tag: "performance",
    code: `#include <cstdint>
#include <iostream>

// Pack multiple boolean order properties into a single word.
// Avoids struct padding, enables fast mask-and-test in hot paths.
namespace OrderFlags {
    constexpr uint32_t IOC    = 1u << 0;  // Immediate-or-cancel
    constexpr uint32_t FOK    = 1u << 1;  // Fill-or-kill
    constexpr uint32_t MARKET = 1u << 2;  // Market order (no limit price)
    constexpr uint32_t HIDDEN = 1u << 3;  // Iceberg / non-displayed
    constexpr uint32_t POST   = 1u << 4;  // Post-only (reject if would take)
    constexpr uint32_t AON    = 1u << 5;  // All-or-none

    inline void set  (uint32_t& f, uint32_t flag) { f |=  flag; }
    inline void clear(uint32_t& f, uint32_t flag) { f &= ~flag; }
    inline bool test (uint32_t  f, uint32_t flag) { return (f & flag) != 0; }
}

struct Order {
    uint64_t id;
    double   price;
    int      qty;
    uint32_t flags = 0;
};

int main() {
    Order o{1, 99.5, 100, 0};
    OrderFlags::set(o.flags, OrderFlags::IOC);
    OrderFlags::set(o.flags, OrderFlags::HIDDEN);

    std::cout << std::boolalpha
              << "IOC:    " << OrderFlags::test(o.flags, OrderFlags::IOC)    << "\\n"
              << "FOK:    " << OrderFlags::test(o.flags, OrderFlags::FOK)    << "\\n"
              << "HIDDEN: " << OrderFlags::test(o.flags, OrderFlags::HIDDEN) << "\\n";

    OrderFlags::clear(o.flags, OrderFlags::HIDDEN);
    std::cout << "HIDDEN after clear: " << OrderFlags::test(o.flags, OrderFlags::HIDDEN) << "\\n";
}`,
    explanation:
      "Bit-packing reduces the Order struct footprint, improving cache line utilisation when iterating thousands of resting orders; the constexpr flags and inline helpers compile to single AND/OR/NOT instructions with zero function-call overhead.",
  },
  {
    id: "cpp-20260520-b1-ewma-vol",
    language: "cpp",
    title: "EWMA online variance (RiskMetrics λ=0.94)",
    tag: "finance",
    code: `#include <cmath>
#include <iostream>
#include <vector>

// Exponentially Weighted Moving Average variance as in RiskMetrics (1994).
// Sigma^2_t = lambda * sigma^2_{t-1} + (1-lambda) * r_{t-1}^2
// The recursive formula requires only the previous variance and return.
class EWMAVol {
    double lambda_;
    double var_;        // current variance estimate
    bool   initialised_ = false;

public:
    explicit EWMAVol(double lambda = 0.94) : lambda_(lambda), var_(0.0) {}

    // Feed a new log-return; updates variance in O(1).
    void update(double r) {
        if (!initialised_) {
            var_ = r * r;    // seed with first squared return
            initialised_ = true;
        } else {
            // Exponential decay of old variance + new squared return
            var_ = lambda_ * var_ + (1.0 - lambda_) * r * r;
        }
    }

    double variance() const { return var_; }
    double vol()      const { return std::sqrt(var_); }       // daily vol
    double annualVol() const { return std::sqrt(var_ * 252); } // annualised
};

int main() {
    EWMAVol ew(0.94);
    std::vector<double> returns = {0.01, -0.02, 0.015, -0.005, 0.02,
                                   -0.01, 0.03, -0.015, 0.005, -0.02};
    for (double r : returns) ew.update(r);
    std::cout << "Daily vol:    " << ew.vol()       << "\\n";
    std::cout << "Annual vol:   " << ew.annualVol() << "\\n";
    std::cout << "Variance:     " << ew.variance()  << "\\n";
}`,
    explanation:
      "The λ parameter controls memory: λ=0.94 gives an effective half-life of ~11 trading days, meaning recent returns dominate; unlike rolling windows, EWMA never drops observations discontinuously, making it less prone to ghost volatility from old jumps rolling off.",
  },
  {
    id: "cpp-20260520-b1-fd-greeks",
    language: "cpp",
    title: "Finite-difference bumped Greeks (delta, gamma, vega)",
    tag: "finance",
    code: `#include <cmath>
#include <iostream>

// Black-Scholes call price (analytic, re-used in bumps).
double bsCall(double S, double K, double r, double sigma, double T) {
    if (T <= 0.0) return std::max(S - K, 0.0);
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    auto N = [](double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    return S * N(d1) - K * std::exp(-r * T) * N(d2);
}

struct Greeks { double delta, gamma, vega; };

// Central-difference finite differences: smaller error than forward difference.
Greeks fdGreeks(double S, double K, double r, double sigma, double T) {
    double hS    = S * 1e-4;           // 0.01% spot bump
    double hSig  = 1e-4;               // 1 bp vol bump

    double Vp  = bsCall(S + hS, K, r, sigma, T);
    double Vm  = bsCall(S - hS, K, r, sigma, T);
    double V0  = bsCall(S,      K, r, sigma, T);

    double delta = (Vp - Vm) / (2.0 * hS);               // central diff delta
    double gamma = (Vp - 2.0 * V0 + Vm) / (hS * hS);    // second derivative

    double Vs  = bsCall(S, K, r, sigma + hSig, T);
    double Vs2 = bsCall(S, K, r, sigma - hSig, T);
    double vega = (Vs - Vs2) / (2.0 * hSig);             // central diff vega

    return {delta, gamma, vega};
}

int main() {
    auto g = fdGreeks(100.0, 100.0, 0.05, 0.20, 1.0);
    std::cout << "delta=" << g.delta << "  gamma=" << g.gamma
              << "  vega=" << g.vega << "\\n";
    // Compare to analytic: delta~0.637, gamma~0.019, vega~0.375
}`,
    explanation:
      "Central differences require two evaluations per Greek but halve the truncation error from O(h) to O(h²) compared to one-sided bumps; bumping sigma by 1 bp and scaling gives vega in units of option value per 1 bp move in vol, the standard DV01-style quoting for vol risk.",
  },
  {
    id: "cpp-20260520-b1-weighted-mid",
    language: "cpp",
    title: "Weighted mid price and skewed reservation quote",
    tag: "finance",
    code: `#include <cmath>
#include <iostream>

// Top-of-book quantities determine how far the true price is from the
// arithmetic mid. The weighted mid shifts toward the thinner side.
struct TOB { double bid, ask, bid_qty, ask_qty; };

double weightedMid(const TOB& tob) {
    // Weights: ask_qty pulls price toward bid, bid_qty pulls toward ask
    double w = tob.ask_qty / (tob.bid_qty + tob.ask_qty);
    return w * tob.bid + (1.0 - w) * tob.ask;
}

// Skew the maker's reservation quote by inventory and volatility.
// A long-inventory maker quotes lower to attract sells (offload risk).
double reservationQuote(double wmid, double inventory,
                         double gamma, double sigma, double tau) {
    // Linear inventory penalty: q * gamma * sigma^2 * tau
    return wmid - inventory * gamma * sigma * sigma * tau;
}

int main() {
    TOB book{99.0, 101.0, 200.0, 50.0};  // thin ask side -> price closer to ask
    double wmid = weightedMid(book);
    std::cout << "Arithmetic mid:  " << (book.bid + book.ask) / 2.0 << "\\n"; // 100
    std::cout << "Weighted mid:    " << wmid << "\\n";  // closer to ask ~100.6

    double q = 5.0; // long 5 units
    double res = reservationQuote(wmid, q, 0.1, 0.20, 0.5);
    std::cout << "Reservation px:  " << res << "\\n";   // skewed downward
}`,
    explanation:
      "The weighted mid accounts for order-book imbalance: when the ask side is thin relative to the bid side, the market is likely to move up, so the weighted mid correctly lies above the arithmetic mid — this is a more accurate signal for quoting than raw mid.",
  },
  {
    id: "cpp-20260520-b1-policy-logger",
    language: "cpp",
    title: "Policy-based logger — zero overhead for NullLogger",
    tag: "templates",
    code: `#include <cstdio>
#include <iostream>
#include <string_view>

// Policy: a type that provides a static write(std::string_view) method.
// Switching policy at compile time means NullLogger calls are completely
// eliminated by the optimiser — no branch, no virtual dispatch.

struct FileLogger {
    static void write(std::string_view msg) {
        // In production, write to a real file descriptor.
        std::cout << "[LOG] " << msg << "\\n";
    }
};

struct NullLogger {
    // Empty body: the compiler eliminates all call sites entirely.
    static void write(std::string_view) {}
};

template<typename Policy>
class Logger {
public:
    void log(std::string_view msg) {
        Policy::write(msg);   // resolved at compile time; zero overhead for Null
    }
    void logOrder(uint64_t id, double price) {
        // Format string manually to avoid heap allocation from std::string
        char buf[64];
        std::snprintf(buf, sizeof(buf), "order id=%llu price=%.4f",
                      (unsigned long long)id, price);
        Policy::write(buf);
    }
};

int main() {
    Logger<FileLogger> active;
    active.log("system start");
    active.logOrder(42, 99.5);

    Logger<NullLogger> silent;
    silent.log("this is eliminated"); // compiles to nothing
}`,
    explanation:
      "Policy-based design enables selecting logging behaviour at compile time without any runtime branch or vtable; when the NullLogger policy is chosen, the compiler's dead-code elimination removes every write() call, giving exactly the same binary as if logging were never written.",
  },
  {
    id: "cpp-20260520-b1-van-der-corput",
    language: "cpp",
    title: "Van der Corput quasi-random sequence (radical inverse)",
    tag: "finance",
    code: `#include <cstdint>
#include <iostream>
#include <vector>

// Compute the radical inverse of n in base b: reflect digits about decimal point.
// The sequence {VdC(0,b), VdC(1,b), ...} fills [0,1) with low discrepancy.
double vanDerCorput(uint64_t n, uint64_t base) {
    double result = 0.0;
    double f = 1.0;
    while (n > 0) {
        f /= static_cast<double>(base);
        result += f * static_cast<double>(n % base);
        n /= base;
    }
    return result;
}

// Halton sequence: use base 2 and 3 for first two dimensions.
// Low-discrepancy sequences reduce MC error to O(log(N)^d / N) vs O(1/sqrt(N)).
std::vector<std::pair<double,double>> halton(int N) {
    std::vector<std::pair<double,double>> pts(N);
    for (int i = 0; i < N; ++i)
        pts[i] = {vanDerCorput(i, 2), vanDerCorput(i, 3)};
    return pts;
}

int main() {
    auto pts = halton(8);
    std::cout << "Halton sequence (base-2, base-3):\\n";
    for (auto [x, y] : pts)
        std::cout << "  (" << x << ", " << y << ")\\n";
    // Points spread evenly across the unit square from the start
}`,
    explanation:
      "Unlike pseudo-random sequences, the Halton/Van-der-Corput construction guarantees that any prefix of N points has discrepancy O((log N)^2/N), making it superior for numerical integration in finance when N is moderate (< 10⁵) before the high-dimensional correlation of Halton becomes problematic.",
  },
  {
    id: "cpp-20260520-b1-dv01-calc",
    language: "cpp",
    title: "DV01 and modified duration for a bond portfolio",
    tag: "finance",
    code: `#include <cmath>
#include <iostream>
#include <vector>

// DV01 (dollar value of 1bp): how much the bond price changes for +1bp yield.
// DV01 = ModifiedDuration * DirtyPrice * 0.0001
// For a portfolio: sum DV01s of all positions (weighted by face value).

struct CashFlow { double t; double cf; }; // time in years, cash amount

double dirtyPrice(const std::vector<CashFlow>& flows, double ytm, int freq = 2) {
    double P = 0.0;
    for (auto& f : flows)
        P += f.cf / std::pow(1.0 + ytm / freq, f.t * freq);
    return P;
}

double modifiedDuration(const std::vector<CashFlow>& flows,
                         double ytm, int freq = 2) {
    double P = dirtyPrice(flows, ytm, freq);
    double D = 0.0;
    for (auto& f : flows) {
        double pv = f.cf / std::pow(1.0 + ytm / freq, f.t * freq);
        D += f.t * pv;            // Macaulay numerator
    }
    double macD = D / P;
    return macD / (1.0 + ytm / freq); // convert Macaulay -> Modified
}

double dv01(const std::vector<CashFlow>& flows, double ytm,
             double faceValue = 100.0, int freq = 2) {
    double price = dirtyPrice(flows, ytm, freq);
    double modD  = modifiedDuration(flows, ytm, freq);
    // DV01 = ModD * Price/100 * FaceValue * 0.0001
    return modD * (price / 100.0) * faceValue * 0.0001;
}

int main() {
    // 5-year 6% semi-annual bond, face=1,000,000, ytm=5%
    std::vector<CashFlow> bond;
    for (int i = 1; i <= 10; ++i)
        bond.push_back({i * 0.5, 3000.0});   // semi-annual coupon
    bond.back().cf += 1'000'000.0;            // par at maturity

    double ytm = 0.05;
    double d01 = dv01(bond, ytm, 1'000'000.0);
    std::cout << "DV01: $" << d01 << "\\n";  // ~$427 per $1M face
    std::cout << "ModD: " << modifiedDuration(bond, ytm) << " years\\n";
}`,
    explanation:
      "DV01 is the lingua franca of fixed-income risk because it normalises sensitivity across bonds of different maturities and coupon structures to a single dollar amount; hedging a position requires finding the hedge instrument whose DV01 exactly offsets the target's DV01.",
  },
  {
    id: "cpp-20260520-b1-itch-parser",
    language: "cpp",
    title: "ITCH 5.0-style binary add-order message parser",
    tag: "networking",
    code: `#include <arpa/inet.h>  // be32toh, be64toh (POSIX)
#include <cstdint>
#include <cstring>
#include <iostream>

// ITCH 5.0 Add Order message (type 'A'): 36 bytes
// Offset  Len  Field
//  0       1   message type ('A')
//  1       2   stock_locate   (uint16 big-endian)
//  3       2   tracking_number
//  5       6   timestamp_ns   (48-bit, big-endian — read as 6 bytes)
// 11       8   order_ref_number (uint64 be)
// 19       1   side ('B' or 'S')
// 20       4   shares (uint32 be)
// 24       8   stock (char[8], space-padded)
// 32       4   price  (uint32 be, scaled 10^-4)

struct AddOrder {
    uint16_t stock_locate;
    uint64_t timestamp_ns;
    uint64_t order_ref;
    char     side;
    uint32_t shares;
    char     stock[9];    // 8 chars + null terminator
    double   price;       // decimal (divide int by 10000)
};

AddOrder parseAddOrder(const uint8_t* buf, std::size_t len) {
    // Minimal bounds check
    if (len < 36 || buf[0] != 'A') return {};

    AddOrder o{};
    // Stock locate: 2-byte big-endian at offset 1
    uint16_t sl; std::memcpy(&sl, buf + 1, 2);
    o.stock_locate = ntohs(sl);

    // Timestamp: 6-byte big-endian at offset 5 — load into 8-byte via zero-extend
    uint64_t ts = 0;
    std::memcpy(reinterpret_cast<uint8_t*>(&ts) + 2, buf + 5, 6); // little-endian host
    // Reverse bytes manually for 6-byte big-endian
    uint8_t ts_buf[8] = {0, 0, buf[5], buf[6], buf[7], buf[8], buf[9], buf[10]};
    std::memcpy(&ts, ts_buf, 8);
    o.timestamp_ns = be64toh(ts);

    // Order ref: 8-byte big-endian at offset 11
    uint64_t ref; std::memcpy(&ref, buf + 11, 8);
    o.order_ref = be64toh(ref);

    o.side = static_cast<char>(buf[19]);

    uint32_t shares; std::memcpy(&shares, buf + 20, 4);
    o.shares = ntohl(shares);

    std::memcpy(o.stock, buf + 24, 8); o.stock[8] = '\\0';

    uint32_t rawPrice; std::memcpy(&rawPrice, buf + 32, 4);
    o.price = ntohl(rawPrice) / 10000.0; // ITCH price scale: 4 decimal places

    return o;
}

int main() {
    // Construct a synthetic Add Order message
    uint8_t msg[36] = {};
    msg[0] = 'A';
    // price = 10050 (= $1.005 * 10000)
    uint32_t p = htonl(10050);
    std::memcpy(msg + 32, &p, 4);
    msg[19] = 'B';
    uint32_t sh = htonl(200);
    std::memcpy(msg + 20, &sh, 4);
    std::memcpy(msg + 24, "AAPL    ", 8);

    auto o = parseAddOrder(msg, sizeof(msg));
    std::cout << "side=" << o.side << " shares=" << o.shares
              << " price=" << o.price << " stock=" << o.stock << "\\n";
}`,
    explanation:
      "ITCH encodes prices as 32-bit integers scaled by 10,000 and timestamps as 48-bit big-endian values — the fixed-offset parsing with memcpy + byte-swap avoids undefined behaviour from unaligned pointer casts and is what production feed handlers actually do.",
  },
  {
    id: "cpp-20260520-b1-latch-barrier",
    language: "cpp",
    title: "C++20 std::latch + std::barrier for market-data fan-out",
    tag: "concurrency",
    code: `#include <barrier>
#include <iostream>
#include <latch>
#include <thread>
#include <vector>

// Market data fan-out pattern:
// 1. A latch waits for all subscriber threads to be ready before the feed starts.
// 2. A barrier synchronises all subscribers at the end of each batch cycle.

void subscriber(int id, std::latch& ready, std::barrier<>& cycleSync, int cycles) {
    std::cout << "sub " << id << " ready\\n";
    ready.count_down();     // signal readiness; does not block
    ready.wait();           // wait until ALL subscribers are ready

    for (int c = 0; c < cycles; ++c) {
        // Simulate processing a market data update
        std::cout << "sub " << id << " processing cycle " << c << "\\n";

        // All subscribers arrive here; barrier resets automatically for next cycle
        cycleSync.arrive_and_wait();
    }
    std::cout << "sub " << id << " done\\n";
}

int main() {
    const int N      = 3;  // number of subscriber threads
    const int CYCLES = 2;

    std::latch      ready(N);          // count-down-to-zero, one-shot
    std::barrier<>  cycleSync(N);      // resets after every N arrivals

    std::vector<std::thread> threads;
    for (int i = 0; i < N; ++i)
        threads.emplace_back(subscriber, i, std::ref(ready),
                             std::ref(cycleSync), CYCLES);

    for (auto& t : threads) t.join();
    std::cout << "All subscribers finished\\n";
}`,
    explanation:
      "std::latch is one-shot (count-down only, cannot reset), making it perfect for the startup synchronisation barrier; std::barrier is cyclic and resets automatically after every N arrivals, eliminating the manual reset code required with condition variables.",
  },
  {
    id: "cpp-20260520-b1-overflow-price",
    language: "cpp",
    title: "Overflow-safe integer tick arithmetic",
    tag: "performance",
    code: `#include <cstdint>
#include <iostream>
#include <limits>
#include <optional>
#include <stdexcept>

// Prices in HFT are often stored as int64 ticks (e.g. price * 1e8).
// Unchecked arithmetic on large notionals can silently overflow.

// checked_add: returns nullopt on overflow (portable, no UB).
std::optional<int64_t> checked_add(int64_t a, int64_t b) {
    // Detect overflow before it happens using conditional arithmetic.
    if (b > 0 && a > std::numeric_limits<int64_t>::max() - b)
        return std::nullopt;  // positive overflow
    if (b < 0 && a < std::numeric_limits<int64_t>::min() - b)
        return std::nullopt;  // negative overflow
    return a + b;
}

// saturating_mul: clamps result to int64 range instead of wrapping.
int64_t saturating_mul(int64_t price_ticks, int64_t qty) {
    if (qty == 0 || price_ticks == 0) return 0;
    // Use __int128 for intermediate; no standard alternative on MSVC.
    __int128 result = static_cast<__int128>(price_ticks) * qty;
    constexpr __int128 MAX = std::numeric_limits<int64_t>::max();
    constexpr __int128 MIN = std::numeric_limits<int64_t>::min();
    if (result > MAX) return std::numeric_limits<int64_t>::max();
    if (result < MIN) return std::numeric_limits<int64_t>::min();
    return static_cast<int64_t>(result);
}

int main() {
    int64_t price_ticks = 9'999'999'900LL;  // near int64 max after * qty
    int64_t qty         = 1'000'000'000LL;

    auto sum = checked_add(price_ticks, 200LL);
    std::cout << "checked_add: " << *sum << "\\n";

    // Overflow example: would wrap without saturation
    auto notional_bad = saturating_mul(price_ticks, qty);
    std::cout << "saturating notional: " << notional_bad << " (clamped)\\n";

    // Safe case: small values
    std::cout << "safe notional: " << saturating_mul(100'00LL, 1000LL) << "\\n";
}`,
    explanation:
      "Silent integer overflow in notional calculations is a production risk: a 64-bit price in ticks multiplied by a large quantity can wrap to a negative number, generating fraudulent fills or risk alerts; __int128 intermediate arithmetic is the idiomatic GCC/Clang solution when performance matters more than MSVC portability.",
  },
];
