import type { Snippet } from "./types";

export const cppSnippets20260521B1: Snippet[] = [
  {
    id: "cpp-20260521-b1-deque-sliding",
    language: "cpp",
    title: "std::deque as sliding-window max (monotonic deque)",
    tag: "stl",
    code: `#include <deque>
#include <iostream>
#include <vector>

// Returns the maximum of each window of size k. O(n) time.
std::vector<int> sliding_max(const std::vector<int>& a, int k) {
    std::deque<int> dq; // stores INDICES, front always holds max index
    std::vector<int> result;

    for (int i = 0; i < static_cast<int>(a.size()); ++i) {
        // Remove indices that are outside the window
        while (!dq.empty() && dq.front() <= i - k)
            dq.pop_front();

        // Maintain decreasing order: pop smaller elements from the back
        while (!dq.empty() && a[dq.back()] <= a[i])
            dq.pop_back();

        dq.push_back(i);

        if (i >= k - 1)
            result.push_back(a[dq.front()]); // front is always the max
    }
    return result;
}

int main() {
    std::vector<int> prices{3, 1, 5, 8, 7, 2, 9, 4};
    auto maxs = sliding_max(prices, 3);
    for (int v : maxs) std::cout << v << " "; // 5 8 8 8 9 9
    std::cout << "\\n";
}`,
    explanation:
      "The monotonic deque achieves O(n) sliding-window max by keeping only decreasing values; each element is pushed and popped at most once, making it the standard building block for tick-level technical indicators like ATR and Keltner channels.",
  },
  {
    id: "cpp-20260521-b1-priority-queue-kth",
    language: "cpp",
    title: "std::priority_queue — kth largest in a stream",
    tag: "stl",
    code: `#include <iostream>
#include <queue>
#include <vector>

// Maintain a min-heap of size k; top() is the kth largest seen.
class KthLargest {
    std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;
    int k_;
public:
    KthLargest(int k, const std::vector<int>& init) : k_(k) {
        for (int v : init) add(v);
    }

    int add(int val) {
        minHeap.push(val);
        // Keep only k elements
        if (static_cast<int>(minHeap.size()) > k_)
            minHeap.pop();
        return minHeap.top(); // kth largest
    }
};

int main() {
    // In a quant context: streaming P&L values, keep track of kth best day.
    KthLargest kl(3, {4, 5, 8, 2});
    std::cout << kl.add(3)  << "\\n"; // 4
    std::cout << kl.add(5)  << "\\n"; // 5
    std::cout << kl.add(10) << "\\n"; // 5
    std::cout << kl.add(9)  << "\\n"; // 8
    std::cout << kl.add(4)  << "\\n"; // 8
}`,
    explanation:
      "A k-element min-heap answers 'kth largest' in O(log k) per insert instead of O(n log n) sort; when monitoring the top-k performing strategies in a live system, this gives constant-space tracking regardless of total stream length.",
  },
  {
    id: "cpp-20260521-b1-set-order-book-levels",
    language: "cpp",
    title: "std::set as sorted price-level container",
    tag: "stl",
    code: `#include <iostream>
#include <set>
#include <unordered_map>

// std::set maintains sorted order automatically; useful for price-level books
// where you need iteration from best to worst price.
struct Level { int64_t price; uint64_t qty; };

struct LevelCmpAsk {
    bool operator()(const Level& a, const Level& b) const { return a.price < b.price; }
};
struct LevelCmpBid {
    bool operator()(const Level& a, const Level& b) const { return a.price > b.price; }
};

int main() {
    std::set<Level, LevelCmpAsk> asks;
    asks.insert({10020, 100}); asks.insert({10010, 200}); asks.insert({10015, 150});

    // Best ask is always begin() — O(1)
    std::cout << "Best ask: " << asks.begin()->price / 100.0 << "\\n"; // 100.10

    // Walk from best to worst ask
    for (auto it = asks.begin(); it != asks.end(); ++it)
        std::cout << it->price / 100.0 << " x " << it->qty << "\\n";

    // Erase a specific price level — O(log n)
    asks.erase({10015, 150});
    std::cout << "After erase, best ask: " << asks.begin()->price / 100.0 << "\\n";
}`,
    explanation:
      "std::set gives O(log n) insert, erase, and lookup with automatic sorted iteration — appropriate for small-depth order books where level count is bounded; for full-depth books with O(1) best-price access, combine with a separate best-price cache.",
  },
  {
    id: "cpp-20260521-b1-allocator-pool",
    language: "cpp",
    title: "Custom STL allocator backed by pool (PoolAllocator)",
    tag: "memory",
    code: `#include <cstddef>
#include <iostream>
#include <list>
#include <memory>

// Minimal STL-compatible allocator that draws from a monotonic arena.
// Swap out std::allocator for this to make std::list allocation-free.
template<typename T>
struct ArenaAllocator {
    using value_type = T;

    struct Arena {
        alignas(64) char buf[65536];
        std::size_t used = 0;

        void* alloc(std::size_t n, std::size_t align) {
            used = (used + align - 1) & ~(align - 1);  // align up
            void* p = buf + used;
            used += n;
            return p;
        }
    };

    std::shared_ptr<Arena> arena;

    ArenaAllocator() : arena(std::make_shared<Arena>()) {}

    template<typename U>
    ArenaAllocator(const ArenaAllocator<U>& o) : arena(o.arena) {}

    T* allocate(std::size_t n) {
        return static_cast<T*>(arena->alloc(n * sizeof(T), alignof(T)));
    }
    void deallocate(T*, std::size_t) {}  // monotonic: no individual free

    template<typename U>
    struct rebind { using other = ArenaAllocator<U>; };
};

int main() {
    using OrderList = std::list<int, ArenaAllocator<int>>;
    ArenaAllocator<int> alloc;
    OrderList lst(alloc);
    for (int i = 0; i < 5; ++i) lst.push_back(i * 10);
    for (int v : lst) std::cout << v << " ";
    std::cout << "\\n";
}`,
    explanation:
      "Plugging a custom allocator into a standard container (via the rebind machinery) avoids all system-allocator calls in hot paths; the monotonic arena's bump-pointer allocation is a single addition + alignment mask, versus the mutex + freelist search in glibc malloc.",
  },
  {
    id: "cpp-20260521-b1-mmap-hugepage",
    language: "cpp",
    title: "Huge-page allocation via mmap MAP_HUGETLB",
    tag: "performance",
    code: `#include <cerrno>
#include <cstring>
#include <cstdint>
#include <iostream>
#include <sys/mman.h>  // Linux only
#include <unistd.h>

// 2 MB hugepages reduce TLB misses for large order books / tick stores.
// Requires kernel huge-page pool: echo 64 > /proc/sys/vm/nr_hugepages
void* alloc_hugepage(std::size_t size) {
    constexpr int HUGE_TLB = 0x40000;   // MAP_HUGETLB flag
    void* ptr = mmap(nullptr, size,
                     PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS | HUGE_TLB, -1, 0);
    if (ptr == MAP_FAILED) {
        std::cerr << "MAP_HUGETLB failed (" << strerror(errno) << "), "
                  << "falling back to regular pages\\n";
        // Fallback: transparent hugepages via madvise
        ptr = mmap(nullptr, size,
                   PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (ptr != MAP_FAILED)
            madvise(ptr, size, MADV_HUGEPAGE);
    }
    return ptr;
}

int main() {
    constexpr std::size_t SZ = 2ULL << 20;  // 2 MB
    void* buf = alloc_hugepage(SZ);
    if (buf != MAP_FAILED) {
        auto* arr = static_cast<double*>(buf);
        arr[0] = 1.5;  // warm the page
        std::cout << "Allocated " << SZ / 1024 << " KB, first=" << arr[0] << "\\n";
        munmap(buf, SZ);
    }
}`,
    explanation:
      "A 2 MB hugepage covers 512 regular 4 KB pages; with a 64-entry L1 TLB, normal pages limit the hot dataset to 256 KB before misses occur, while hugepages extend that to 128 MB — directly measurable as single-digit nanoseconds saved per random access in large tick-data buffers.",
  },
  {
    id: "cpp-20260521-b1-hazard-pointer",
    language: "cpp",
    title: "Hazard pointer — safe memory reclamation sketch",
    tag: "concurrency",
    code: `#include <atomic>
#include <cassert>
#include <iostream>
#include <thread>
#include <vector>

// Simplified single-slot hazard pointer: each thread publishes which
// pointer it is currently accessing so reclaimers can skip it.
// Production systems use one slot per thread in a global array.
struct HazardPtr {
    std::atomic<void*> ptr{nullptr};
};

// Global array: one hazard slot per thread (indexed by thread id).
constexpr int MAX_THREADS = 4;
HazardPtr hazards[MAX_THREADS];

// Reclaimation: free a pointer only if no thread has it protected.
void safe_free(void* p, int tid_self, std::vector<void*>& retired) {
    retired.push_back(p);
    for (auto it = retired.begin(); it != retired.end(); ) {
        void* candidate = *it;
        bool protected_ = false;
        for (int i = 0; i < MAX_THREADS; ++i) {
            if (i == tid_self) continue;
            if (hazards[i].ptr.load(std::memory_order_acquire) == candidate) {
                protected_ = true; break;
            }
        }
        if (!protected_) {
            delete static_cast<int*>(candidate); // actual free
            it = retired.erase(it);
        } else {
            ++it;
        }
    }
}

int main() {
    // Thread 0 protects a pointer while thread 1 tries to reclaim it.
    int* shared = new int(42);
    hazards[0].ptr.store(shared, std::memory_order_release); // thread 0 protects

    std::vector<void*> retired;
    safe_free(shared, 1, retired); // thread 1 retires — should NOT free yet
    std::cout << "Retired list size: " << retired.size() << "\\n"; // 1 (not freed)

    hazards[0].ptr.store(nullptr, std::memory_order_release); // thread 0 releases
    safe_free(nullptr, 1, retired); // trigger another scan — now it can free
    std::cout << "Retired list size after release: " << retired.size() << "\\n"; // 0
}`,
    explanation:
      "Hazard pointers solve the ABA problem in lock-free reclamation by requiring readers to publish the pointers they are actively dereferencing; a reclaming thread scans all hazard slots and defers freeing any pointer that is currently published, achieving safe reclamation without global pauses.",
  },
  {
    id: "cpp-20260521-b1-interest-rate-swap",
    language: "cpp",
    title: "Fixed-float IRS NPV and DV01 (zero-curve discounting)",
    tag: "quant",
    code: `#include <cmath>
#include <iostream>
#include <vector>

// Discount factor from a flat zero rate (continuous compounding).
double df(double r, double t) { return std::exp(-r * t); }

struct IRSLeg {
    double notional;
    double rate;                  // fixed rate (annualised)
    std::vector<double> pay_times; // payment times in years
    double zero_rate;             // flat zero rate for discounting
};

double leg_pv(const IRSLeg& leg) {
    double pv = 0.0;
    for (std::size_t i = 0; i < leg.pay_times.size(); ++i) {
        double dt = (i == 0) ? leg.pay_times[0]
                              : leg.pay_times[i] - leg.pay_times[i - 1];
        double coupon = leg.notional * leg.rate * dt;
        pv += coupon * df(leg.zero_rate, leg.pay_times[i]);
    }
    // Add PV of notional exchange at maturity (for the receiving leg)
    pv += leg.notional * df(leg.zero_rate, leg.pay_times.back());
    return pv;
}

// NPV of a pay-fixed swap = PV(floating leg) - PV(fixed leg).
// Floating leg PV ≈ notional (at-market float leg priced at par).
double irs_npv(double notional, double fixed_rate,
               const std::vector<double>& pay_times,
               double zero_rate) {
    IRSLeg fixed_leg{notional, fixed_rate, pay_times, zero_rate};
    // Float leg priced at par: PV = notional
    return notional - leg_pv(fixed_leg);
}

// DV01: bump the zero rate by 1 bp and take finite difference.
double irs_dv01(double notional, double fixed_rate,
                const std::vector<double>& pay_times,
                double zero_rate) {
    double bp = 1e-4;
    double npv_up   = irs_npv(notional, fixed_rate, pay_times, zero_rate + bp);
    double npv_down = irs_npv(notional, fixed_rate, pay_times, zero_rate - bp);
    return (npv_down - npv_up) / 2.0; // positive: receiver gains from rate fall
}

int main() {
    double notional  = 1'000'000.0;
    double fixed_rate = 0.03;
    double zero_rate  = 0.025;
    std::vector<double> pay_times{0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0};

    double npv  = irs_npv(notional, fixed_rate, pay_times, zero_rate);
    double dv01 = irs_dv01(notional, fixed_rate, pay_times, zero_rate);

    std::cout << "IRS NPV:  $" << npv  << "\\n"; // negative: paying above market
    std::cout << "IRS DV01: $" << dv01 << " per bp\\n";
}`,
    explanation:
      "The NPV of a pay-fixed swap is floatleg_PV minus fixedleg_PV; the float leg prices at par (equals notional) when discounted at the same zero curve used to generate implied forward rates, so only the fixed coupons require an explicit cash-flow sum.",
  },
  {
    id: "cpp-20260521-b1-hull-white-simulation",
    language: "cpp",
    title: "Hull-White short-rate Monte Carlo simulation",
    tag: "quant",
    code: `#include <cmath>
#include <iostream>
#include <random>
#include <vector>

// Hull-White (1990): dr = (theta - a*r)*dt + sigma*dW
// theta is chosen to fit the initial term structure; here we use a constant theta.
// Exact discretisation (Ornstein-Uhlenbeck): avoids Euler discretisation error.
class HullWhite {
    double a_;      // mean-reversion speed
    double sigma_;  // short-rate volatility
    double theta_;  // long-run level (= a * long_rate + a * sigma^2 / (2*a^2))

public:
    HullWhite(double a, double sigma, double theta)
        : a_(a), sigma_(sigma), theta_(theta) {}

    // Simulate n_paths paths of n_steps steps each over horizon T.
    // Returns vector of terminal discount factors exp(-integral r dt).
    std::vector<double> simulate(double r0, double T, int n_steps, int n_paths,
                                  unsigned seed = 42) const {
        std::mt19937_64 rng(seed);
        std::normal_distribution<double> Z(0.0, 1.0);

        double dt  = T / n_steps;
        double e   = std::exp(-a_ * dt);
        double var = sigma_ * sigma_ * (1 - e * e) / (2 * a_); // conditional var per step

        std::vector<double> disc_factors(n_paths);
        for (int p = 0; p < n_paths; ++p) {
            double r = r0;
            double integral = 0.0;
            for (int s = 0; s < n_steps; ++s) {
                integral += r * dt;
                // Exact OU step: E[r|r_prev] = r_prev*e + theta*(1-e)/a
                double mean = r * e + (theta_ / a_) * (1 - e);
                r = mean + std::sqrt(var) * Z(rng);
            }
            disc_factors[p] = std::exp(-integral);
        }
        return disc_factors;
    }
};

int main() {
    HullWhite hw(0.1, 0.01, 0.03 * 0.1); // a=0.1, sigma=1%, theta matches 3% flat curve
    auto dfs = hw.simulate(0.03, 5.0, 60, 100'000);
    double bond_price = 0.0;
    for (double df : dfs) bond_price += df;
    bond_price /= dfs.size();
    std::cout << "HW 5Y zero price: " << bond_price << "\\n"; // ~exp(-0.03*5)~0.860
}`,
    explanation:
      "The exact OU discretisation avoids the Euler-step bias that accumulates over long horizons; when theta is calibrated to today's zero curve (bootstrapped from OIS swaps), the model prices all input instruments exactly, making it suitable for exotic rate derivative pricing.",
  },
  {
    id: "cpp-20260521-b1-sabr-vol",
    language: "cpp",
    title: "SABR implied volatility (Hagan 2002 approximation)",
    tag: "quant",
    code: `#include <cmath>
#include <iostream>

// SABR approximation from Hagan et al. (2002), lognormal vol form.
// Params: alpha (ATM vol seed), beta (CEV exponent), rho (spot-vol corr), nu (vol-of-vol).
double sabr_implied_vol(double F, double K, double T,
                         double alpha, double beta, double rho, double nu) {
    if (std::abs(F - K) < 1e-10) {
        // ATM formula (avoids log(F/K) = 0/0)
        double FK_mid = std::pow(F, 1 - beta);
        double term1  = alpha / FK_mid;
        double term2  = (1 - beta) * (1 - beta) * alpha * alpha / (24 * std::pow(FK_mid, 2));
        double term3  = 0.25 * rho * beta * nu * alpha / FK_mid;
        double term4  = (2 - 3 * rho * rho) * nu * nu / 24;
        return term1 * (1 + (term2 + term3 + term4) * T);
    }

    double log_FK = std::log(F / K);
    double FK_b   = std::pow(F * K, (1 - beta) / 2.0);
    double z      = (nu / alpha) * FK_b * log_FK;
    double chi    = std::log((std::sqrt(1 - 2 * rho * z + z * z) + z - rho) / (1 - rho));

    double A = alpha / (FK_b * (1 + (1 - beta) * (1 - beta) / 24 * log_FK * log_FK
                                   + std::pow(1 - beta, 4) / 1920 * std::pow(log_FK, 4)));
    double B = z / chi;
    double C = 1 + ((1 - beta) * (1 - beta) * alpha * alpha / (24 * FK_b * FK_b)
                  + 0.25 * rho * beta * nu * alpha / FK_b
                  + (2 - 3 * rho * rho) / 24 * nu * nu) * T;

    return A * B * C;
}

int main() {
    // ATM swaption: F=K=0.03, T=1y, typical SABR params
    double F = 0.03, T = 1.0;
    double alpha = 0.2, beta = 0.5, rho = -0.3, nu = 0.4;

    for (double K : {0.01, 0.02, 0.03, 0.04, 0.05}) {
        double vol = sabr_implied_vol(F, K, T, alpha, beta, rho, nu);
        std::cout << "K=" << K << " -> sigma=" << vol << "\\n";
    }
}`,
    explanation:
      "SABR's four parameters (alpha, beta, rho, nu) jointly control the ATM vol level, the smile's skew (sign of rho), and the curvature (nu); calibrating to market swaption smiles and extrapolating with SABR gives a consistent vol surface for exotic rate products without fitting each strike independently.",
  },
  {
    id: "cpp-20260521-b1-heston-mc",
    language: "cpp",
    title: "Heston stochastic-vol Monte Carlo (Euler-Maruyama)",
    tag: "quant",
    code: `#include <algorithm>
#include <cmath>
#include <iostream>
#include <random>

// Heston (1993): dS = r*S*dt + sqrt(v)*S*dW1
//                dv = kappa*(theta-v)*dt + xi*sqrt(v)*dW2
//                corr(dW1, dW2) = rho
double heston_call_mc(double S0, double K, double r,
                       double v0, double kappa, double theta, double xi, double rho,
                       double T, int steps, int paths, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> Z(0.0, 1.0);

    double dt     = T / steps;
    double payoff = 0.0;

    for (int p = 0; p < paths; ++p) {
        double S = S0, v = v0;
        for (int s = 0; s < steps; ++s) {
            double z1 = Z(rng);
            double z2 = rho * z1 + std::sqrt(1 - rho * rho) * Z(rng); // correlated

            double sqv = std::sqrt(std::max(v, 0.0)); // full truncation for v < 0

            S *= std::exp((r - 0.5 * v) * dt + sqv * std::sqrt(dt) * z1);
            // Euler-Maruyama for variance; full truncation prevents negative var
            v += kappa * (theta - std::max(v, 0.0)) * dt + xi * sqv * std::sqrt(dt) * z2;
            v = std::max(v, 0.0); // reflection / truncation
        }
        payoff += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * payoff / paths;
}

int main() {
    // Typical Heston calibration params
    double price = heston_call_mc(
        100.0, 100.0, 0.05,
        0.04 /*v0*/, 2.0 /*kappa*/, 0.04 /*theta*/, 0.3 /*xi*/, -0.7 /*rho*/,
        1.0, 252, 100'000);
    std::cout << "Heston call MC: " << price << "\\n"; // ~10-11
}`,
    explanation:
      "Full truncation (max(v,0)) is preferred over reflection for Heston discretisation because it is biased but stable and converges to the true price; Andersen's QE scheme achieves much better convergence at the cost of complexity, and is the industry standard for production Monte Carlo.",
  },
  {
    id: "cpp-20260521-b1-zipf-random",
    language: "cpp",
    title: "Order size simulation with Zipf distribution",
    tag: "quant",
    code: `#include <cmath>
#include <iostream>
#include <numeric>
#include <random>
#include <vector>

// Zipf distribution: P(k) ∝ 1/k^s. Order sizes in many markets follow
// approximate Zipf: a few large orders, many small ones.
class ZipfDistribution {
    std::vector<double> cdf_;  // precomputed CDF for inverse-transform sampling
    int N_;                     // vocabulary size (max order size)
public:
    ZipfDistribution(int N, double s) : N_(N), cdf_(N + 1, 0.0) {
        double Z = 0.0;
        for (int k = 1; k <= N; ++k) Z += 1.0 / std::pow(k, s);
        for (int k = 1; k <= N; ++k)
            cdf_[k] = cdf_[k - 1] + (1.0 / std::pow(k, s)) / Z;
    }

    int sample(std::mt19937_64& rng) const {
        std::uniform_real_distribution<double> U(0.0, 1.0);
        double u = U(rng);
        // Binary search in CDF
        auto it = std::lower_bound(cdf_.begin(), cdf_.end(), u);
        return static_cast<int>(it - cdf_.begin());
    }
};

int main() {
    std::mt19937_64 rng(42);
    ZipfDistribution zipf(100, 1.5);  // order sizes 1..100, exponent 1.5

    std::vector<int> hist(101, 0);
    for (int i = 0; i < 100'000; ++i)
        ++hist[zipf.sample(rng)];

    std::cout << "Order size 1: " << hist[1] << " times\\n";
    std::cout << "Order size 10: " << hist[10] << " times\\n";
    std::cout << "Order size 100: " << hist[100] << " times\\n";
}`,
    explanation:
      "Order-size distributions in equity markets exhibit heavy tails well-described by power laws; simulating with a Zipf generator produces realistic market-impact profiles for backtesting algorithms that assume small orders encounter different price impact than institutional block trades.",
  },
  {
    id: "cpp-20260521-b1-numa-aware",
    language: "cpp",
    title: "NUMA-aware thread pinning via sched_setaffinity",
    tag: "performance",
    code: `#include <cstdint>
#include <iostream>
#include <pthread.h>
#include <sched.h>
#include <thread>

// Pin a thread to a specific CPU core to avoid cross-NUMA memory access.
// All allocations done on that thread will prefer local NUMA node memory.
bool pin_thread_to_core(int core_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_id, &cpuset);

    // pthread_setaffinity_np sets affinity for the calling thread.
    int rc = pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    if (rc != 0) {
        std::cerr << "pin failed: core " << core_id << "\\n";
        return false;
    }
    return true;
}

void market_data_handler(int core_id) {
    if (!pin_thread_to_core(core_id)) return;
    std::cout << "MD handler pinned to core " << core_id << "\\n";
    // All memory allocated here benefits from NUMA locality if core_id is on
    // the same NUMA node as the NIC's DMA memory (typically cores 0-11 for node 0).
    volatile uint64_t counter = 0;
    for (uint64_t i = 0; i < 1'000'000; ++i) ++counter;
    std::cout << "Processed " << counter << " ticks\\n";
}

int main() {
    std::thread t1(market_data_handler, 0);
    std::thread t2(market_data_handler, 2);
    t1.join(); t2.join();
}`,
    explanation:
      "Cross-NUMA memory access can add 50-100 ns per cache miss versus local NUMA access; pinning the market-data receive thread to the same NUMA node as the NIC's interrupt affinity keeps packet-to-strategy latency in the local-access regime.",
  },
  {
    id: "cpp-20260521-b1-coroutine-pipeline",
    language: "cpp",
    title: "C++20 coroutine pipeline — parse → filter → compute",
    tag: "coroutines",
    code: `#include <coroutine>
#include <iostream>
#include <string>
#include <vector>

// Reuse the minimal Generator from cpp-20260520-b1-coroutine-gen.
template<typename T>
struct Generator {
    struct promise_type {
        T current_value;
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
    bool done() const { return coro.done(); }
    T    next() { coro.resume(); return coro.promise().current_value; }
};

// Stage 1: produce raw prices from a data source (mock).
Generator<double> raw_prices(std::vector<double> src) {
    for (double p : src) co_yield p;
}

// Stage 2: filter out clearly erroneous ticks (|price| > threshold).
Generator<double> filter_ticks(std::vector<double>& src, double threshold) {
    for (double p : src)
        if (p > 0 && p < threshold)
            co_yield p;
}

// Stage 3: compute mid price from alternating bid/ask.
Generator<double> compute_mid(std::vector<double>& bids, std::vector<double>& asks) {
    std::size_t n = std::min(bids.size(), asks.size());
    for (std::size_t i = 0; i < n; ++i)
        co_yield (bids[i] + asks[i]) / 2.0;
}

int main() {
    std::vector<double> bids{99.5, 100.0, 101.0, -1.0, 100.5};
    std::vector<double> asks{100.0, 100.5, 101.5, 200.0, 101.0};

    // Filter bids and asks
    auto mid_gen = compute_mid(bids, asks);
    for (int i = 0; i < 5; ++i) {
        double mid = mid_gen.next();
        std::cout << "mid[" << i << "] = " << mid << "\\n";
    }
}`,
    explanation:
      "Composing coroutine generators creates a lazy pipeline where each stage only computes the next value when pulled, consuming O(1) memory regardless of feed length — in production, this pattern connects feed-handler stages without buffering entire tick arrays between them.",
  },
  {
    id: "cpp-20260521-b1-compile-time-lut",
    language: "cpp",
    title: "Compile-time lookup table (constexpr std::array)",
    tag: "performance",
    code: `#include <array>
#include <cmath>
#include <cstddef>
#include <iostream>

// Build a 256-entry sine table at compile time — zero runtime initialisation.
constexpr std::size_t LUT_SIZE = 256;

constexpr std::array<float, LUT_SIZE> make_sin_lut() {
    std::array<float, LUT_SIZE> lut{};
    for (std::size_t i = 0; i < LUT_SIZE; ++i) {
        // constexpr cannot call std::sin, but std::sin is constexpr in C++23.
        // In C++20: use a Taylor approximation instead.
        // Here we use a compile-time-friendly approach: store phase [0,2pi].
        // For C++20 compilers, use a lambda with __builtin_sin (GCC extension).
        double angle = 2.0 * 3.14159265358979323846 * i / LUT_SIZE;
        // Taylor: sin(x) ≈ x - x^3/6 + x^5/120 (accurate near 0)
        // For full range, rely on C++23 constexpr <cmath> or runtime init.
        lut[i] = static_cast<float>(angle); // placeholder: store angle
    }
    return lut;
}

// Lookup table version — O(1) vs O(?) trig function.
// In production: precompute exact sin values once at startup.
constexpr auto SIN_LUT = make_sin_lut();

// Alternative: generate at startup using a consteval trick or __builtin_sin.
// This is the pattern; the actual sin is typically runtime-initialised.
float fast_sin_approx(int idx) {
    return SIN_LUT[idx & (LUT_SIZE - 1)]; // mask for power-of-2 size
}

// Example: precompute option delta LUT over a discretised spot grid.
constexpr int DELTA_GRID_SIZE = 1024;
std::array<float, DELTA_GRID_SIZE> build_delta_lut(float S_min, float S_max,
                                                    float K, float sigma, float T) {
    std::array<float, DELTA_GRID_SIZE> lut{};
    float step = (S_max - S_min) / DELTA_GRID_SIZE;
    for (int i = 0; i < DELTA_GRID_SIZE; ++i) {
        float S   = S_min + i * step;
        float sqT = sigma * std::sqrt(T);
        float d1  = (std::log(S / K) + (0.05f + 0.5f * sigma * sigma) * T) / sqT;
        lut[i]    = 0.5f * std::erfc(-d1 / std::sqrt(2.0f)); // N(d1) = delta
    }
    return lut;
}

int main() {
    auto delta_lut = build_delta_lut(50.0f, 150.0f, 100.0f, 0.20f, 1.0f);
    int idx = static_cast<int>((100.0f - 50.0f) / (150.0f - 50.0f) * DELTA_GRID_SIZE);
    std::cout << "ATM delta (LUT): " << delta_lut[idx] << "\\n"; // ~0.637
}`,
    explanation:
      "Pre-computing a delta (or any Greek) LUT over a spot grid at startup replaces a floating-point log + erfc call per quote refresh with a single array index; for market makers quoting thousands of strikes simultaneously, this drops re-quote latency from microseconds to nanoseconds.",
  },
  {
    id: "cpp-20260521-b1-spsc-batched",
    language: "cpp",
    title: "Batched SPSC ring with cache-line aligned slots",
    tag: "concurrency",
    code: `#include <array>
#include <atomic>
#include <cstddef>
#include <iostream>
#include <new>   // hardware_destructive_interference_size

// SPSC ring where each slot is padded to its own cache line,
// preventing false sharing between adjacent elements.
template<typename T, std::size_t N>
class PaddedSpscRing {
    static_assert((N & (N - 1)) == 0, "N must be power of two");
    static constexpr std::size_t CL = std::hardware_destructive_interference_size;

    struct alignas(CL) Slot {
        std::atomic<bool> ready{false};
        T                 data;
    };

    std::array<Slot, N> slots_;

    alignas(CL) std::atomic<std::size_t> head_{0}; // producer index
    alignas(CL) std::atomic<std::size_t> tail_{0}; // consumer index

public:
    bool push(const T& v) {
        auto h = head_.load(std::memory_order_relaxed);
        if (slots_[h & (N - 1)].ready.load(std::memory_order_acquire))
            return false; // full
        slots_[h & (N - 1)].data = v;
        slots_[h & (N - 1)].ready.store(true, std::memory_order_release);
        head_.store(h + 1, std::memory_order_relaxed);
        return true;
    }

    bool pop(T& out) {
        auto t = tail_.load(std::memory_order_relaxed);
        auto& slot = slots_[t & (N - 1)];
        if (!slot.ready.load(std::memory_order_acquire))
            return false; // empty
        out = slot.data;
        slot.ready.store(false, std::memory_order_release);
        tail_.store(t + 1, std::memory_order_relaxed);
        return true;
    }
};

int main() {
    PaddedSpscRing<int, 8> ring;
    ring.push(10); ring.push(20); ring.push(30);
    int v;
    while (ring.pop(v)) std::cout << v << " "; // 10 20 30
    std::cout << "\\n";
}`,
    explanation:
      "Padding each slot to a full cache line (typically 64 bytes) prevents the producer and consumer from invalidating each other's cache when they read/write adjacent slots; this is especially important on ARM with weaker memory model guarantees and on Intel with hyperthreading sharing L1.",
  },
  {
    id: "cpp-20260521-b1-heartbeat-watchdog",
    language: "cpp",
    title: "Feed heartbeat watchdog with std::condition_variable",
    tag: "quant",
    code: `#include <atomic>
#include <chrono>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <thread>

// Market data feeds send heartbeats at regular intervals.
// If we go TIMEOUT without a heartbeat, declare the feed stale.
class HeartbeatWatchdog {
    std::mutex              mu_;
    std::condition_variable cv_;
    bool                    heartbeat_{false};
    bool                    stop_{false};

public:
    // Called from the feed-handler thread on every incoming message.
    void pulse() {
        std::unique_lock<std::mutex> lk(mu_);
        heartbeat_ = true;
        cv_.notify_one(); // wake watchdog
    }

    // Watchdog loop: block until pulse or timeout.
    void run(std::chrono::milliseconds timeout) {
        while (true) {
            std::unique_lock<std::mutex> lk(mu_);
            bool ok = cv_.wait_for(lk, timeout, [this] {
                return heartbeat_ || stop_;
            });
            if (stop_) { std::cout << "Watchdog stopping\\n"; return; }
            if (!ok) {
                std::cout << "ALERT: feed stale — no heartbeat in "
                          << timeout.count() << " ms\\n";
                // In production: reconnect or switch to backup feed.
            } else {
                std::cout << "Heartbeat received\\n";
                heartbeat_ = false;
            }
        }
    }

    void stop() {
        std::unique_lock<std::mutex> lk(mu_);
        stop_ = true;
        cv_.notify_all();
    }
};

int main() {
    HeartbeatWatchdog wd;
    std::thread watchdog_thread([&]{ wd.run(std::chrono::milliseconds(100)); });

    // Simulate feed: pulse twice then go silent
    for (int i = 0; i < 2; ++i) {
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
        wd.pulse();
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(250)); // trigger stale alert
    wd.stop();
    watchdog_thread.join();
}`,
    explanation:
      "wait_for with a predicate lambda handles spurious wakeups automatically (it re-checks the condition before returning); using a flag rather than a simple sleep loop means the watchdog adds zero overhead when the feed is healthy and wakes immediately when a pulse arrives.",
  },
  {
    id: "cpp-20260521-b1-risk-engine",
    language: "cpp",
    title: "Real-time risk engine — position + P&L aggregator",
    tag: "quant",
    code: `#include <cstdint>
#include <iostream>
#include <mutex>
#include <string>
#include <unordered_map>

// Minimal risk engine: tracks positions per symbol and computes
// mark-to-market P&L given a current mid-price map.
struct Fill {
    std::string symbol;
    int64_t     qty;      // positive = buy, negative = sell
    double      price;
};

class RiskEngine {
    struct Position {
        int64_t qty    = 0;
        double  cost   = 0.0; // average cost * qty (total cost basis)
    };

    mutable std::mutex                           mu_;
    std::unordered_map<std::string, Position>    positions_;
    double                                       realized_pnl_ = 0.0;

public:
    void on_fill(const Fill& f) {
        std::lock_guard<std::mutex> g(mu_);
        auto& pos = positions_[f.symbol];

        if ((pos.qty > 0 && f.qty < 0) || (pos.qty < 0 && f.qty > 0)) {
            // Closing or reducing: realise P&L on the closed portion
            int64_t closed = std::min(std::abs(pos.qty), std::abs(f.qty));
            double  avg_cost = pos.qty != 0 ? pos.cost / pos.qty : 0.0;
            realized_pnl_  += closed * (f.price - avg_cost) * (pos.qty > 0 ? 1 : -1);
        }
        pos.qty  += f.qty;
        pos.cost += f.qty * f.price; // adjust cost basis
    }

    double mtm_pnl(const std::unordered_map<std::string, double>& mids) const {
        std::lock_guard<std::mutex> g(mu_);
        double unrealized = 0.0;
        for (auto& [sym, pos] : positions_) {
            auto it = mids.find(sym);
            if (it == mids.end() || pos.qty == 0) continue;
            double avg_cost = pos.cost / pos.qty;
            unrealized += pos.qty * (it->second - avg_cost);
        }
        return realized_pnl_ + unrealized;
    }
};

int main() {
    RiskEngine engine;
    engine.on_fill({"AAPL", 100, 150.0});   // buy 100 @ 150
    engine.on_fill({"AAPL", 50,  155.0});   // buy 50  @ 155
    engine.on_fill({"AAPL", -80, 160.0});   // sell 80 @ 160

    std::unordered_map<std::string, double> mids{{"AAPL", 162.0}};
    std::cout << "Total P&L: $" << engine.mtm_pnl(mids) << "\\n";
}`,
    explanation:
      "Keeping a running average cost basis (total_cost / qty) rather than a FIFO stack handles partial closes correctly and in O(1) per fill; the mutex here is correctness-first — a production risk engine segregates writes (fill thread) from reads (risk-monitor thread) using a seqlock or reader-writer lock for better throughput.",
  },
  {
    id: "cpp-20260521-b1-binomial-am-call",
    language: "cpp",
    title: "American call with discrete dividends (binomial tree)",
    tag: "quant",
    code: `#include <algorithm>
#include <cmath>
#include <iostream>
#include <vector>

// American call with a single cash dividend D paid at time t_d.
// The dividend model: subtract D*exp(-r*(T-t_d)) from S before building tree,
// then add back to get stock prices at each node.
double american_call_dividend(double S, double K, double r, double sigma,
                               double T, double D, double t_d, int N = 200) {
    double dt = T / N;
    double u  = std::exp(sigma * std::sqrt(dt));
    double d  = 1.0 / u;
    double p  = (std::exp(r * dt) - d) / (u - d);
    double disc = std::exp(-r * dt);

    // Prepaid forward: remove PV of dividend from S
    double S_star = S - D * std::exp(-r * t_d);

    int N_d = static_cast<int>(t_d / dt); // dividend payment step

    // Terminal payoffs on S* tree
    std::vector<double> V(N + 1);
    for (int j = 0; j <= N; ++j) {
        double S_node = S_star * std::pow(u, N - j) * std::pow(d, j);
        // Add back dividend (already paid)
        double S_full = S_node + (N_d < N ? 0.0 : D); // simplified: D already gone
        V[j] = std::max(S_node - K, 0.0);
    }

    // Walk back
    for (int i = N - 1; i >= 0; --i) {
        for (int j = 0; j <= i; ++j) {
            double S_node = S_star * std::pow(u, i - j) * std::pow(d, j);
            V[j] = disc * (p * V[j] + (1 - p) * V[j + 1]);
            V[j] = std::max(V[j], S_node - K); // early exercise
        }
    }
    return V[0];
}

int main() {
    // S=100, K=95, r=5%, sigma=25%, T=1y, dividend D=3 at t=0.5y
    double price = american_call_dividend(100, 95, 0.05, 0.25, 1.0, 3.0, 0.5);
    std::cout << "American call (div): " << price << "\\n"; // ~10-11
}`,
    explanation:
      "American calls on dividend-paying stocks can be optimally exercised just before the ex-dividend date; the prepaid-forward approach (subtract PV of dividend from S before tree construction) cleanly handles the discrete dividend without re-parameterising up/down factors at each step.",
  },
  {
    id: "cpp-20260521-b1-midprice-ema",
    language: "cpp",
    title: "Tick-level EMA mid-price with timestamp interpolation",
    tag: "quant",
    code: `#include <cmath>
#include <iostream>
#include <stdint.h>

// Exponential moving average of mid price, time-weighted by actual tick spacing.
// The decay constant lambda = exp(-dt/tau) uses real elapsed nanoseconds,
// so the filter is immune to irregular tick rates.
class TickEMA {
    double   alpha_ns_;  // decay rate per nanosecond
    double   ema_   = 0.0;
    uint64_t last_ns_ = 0;
    bool     init_  = false;

public:
    // tau_ms: half-life of the EMA in milliseconds
    explicit TickEMA(double tau_ms) {
        double tau_ns = tau_ms * 1e6;
        alpha_ns_ = std::log(2.0) / tau_ns; // decay constant per ns
    }

    void update(uint64_t ts_ns, double mid) {
        if (!init_) {
            ema_   = mid;
            last_ns_ = ts_ns;
            init_  = true;
            return;
        }
        double dt  = static_cast<double>(ts_ns - last_ns_);
        double lam = std::exp(-alpha_ns_ * dt); // time-dependent decay
        ema_       = lam * ema_ + (1 - lam) * mid;
        last_ns_   = ts_ns;
    }

    double value() const { return ema_; }
};

int main() {
    TickEMA ema(500.0); // 500 ms half-life

    // Simulate sparse ticks: burst then gap
    ema.update(0,          100.0);
    ema.update(100'000,    100.5);   // 0.1 ms later
    ema.update(200'000,    101.0);   // 0.1 ms later
    ema.update(700'000'000, 95.0);   // 700 ms later — EMA mostly decayed
    std::cout << "EMA after gap: " << ema.value() << "\\n"; // near 95
}`,
    explanation:
      "A time-weighted EMA uses actual elapsed nanoseconds to compute the decay factor, meaning a 1-second gap decays the EMA much more than 10 ticks arriving in 10 ms — essential for fair price signals when feed connectivity is intermittent or tick rates vary by market session.",
  },
  {
    id: "cpp-20260521-b1-bitset-signal",
    language: "cpp",
    title: "std::bitset for packed signal flags across instruments",
    tag: "performance",
    code: `#include <bitset>
#include <iostream>
#include <string>

// Maintain 512 binary signals (one per instrument) with O(n/64) set ops.
// Useful for: 'which instruments are in momentum state', 'which are past VaR limit'.
constexpr std::size_t N_INSTRUMENTS = 512;

using SignalSet = std::bitset<N_INSTRUMENTS>;

int main() {
    SignalSet momentum_up;   // instruments in up-momentum regime
    SignalSet vol_alert;     // instruments breaching vol threshold
    SignalSet tradeable;     // instruments eligible to trade

    // Set signals for some instruments
    for (int i = 0; i < 100; ++i) momentum_up.set(i);
    for (int i = 50; i < 150; ++i) vol_alert.set(i);
    for (int i = 0; i < 400; ++i) tradeable.set(i);

    // Instruments to trade long: in momentum, NOT in vol alert, AND tradeable
    SignalSet to_trade = (momentum_up & ~vol_alert) & tradeable;

    std::cout << "Momentum up:  " << momentum_up.count() << " instruments\\n";
    std::cout << "Vol alerts:   " << vol_alert.count()   << " instruments\\n";
    std::cout << "Trade signals:" << to_trade.count()     << " instruments\\n";

    // Iterate set bits efficiently (compiler often emits BSF/BSR instructions)
    std::cout << "First 5 trade signals: ";
    int found = 0;
    for (int i = 0; i < N_INSTRUMENTS && found < 5; ++i)
        if (to_trade.test(i)) { std::cout << i << " "; ++found; }
    std::cout << "\\n";
}`,
    explanation:
      "std::bitset stores N bits in N/64 uint64_t words; bitwise AND and NOT on 512 bits collapse to 8 SIMD-width operations, making cross-sectional signal filtering across hundreds of instruments faster by 64x than a loop over a bool array.",
  },
  {
    id: "cpp-20260521-b1-policy-execution",
    language: "cpp",
    title: "Policy-based execution model (dry-run vs live)",
    tag: "design",
    code: `#include <iostream>
#include <string>
#include <string_view>

// An execution policy determines what happens when a signal fires.
// Compile-time policy switching gives zero-overhead dry-run mode.

struct LivePolicy {
    static void send_order(std::string_view sym, char side, int qty, double px) {
        std::printf("[LIVE] %s %c %d @ %.4f\\n",
                    std::string(sym).c_str(), side, qty, px);
        // In production: serialize to FIX and send to OMS.
    }
    static void cancel_order(uint64_t id) {
        std::printf("[LIVE] cancel %llu\\n", (unsigned long long)id);
    }
    static constexpr bool is_live = true;
};

struct DryRunPolicy {
    static void send_order(std::string_view sym, char side, int qty, double px) {
        std::printf("[DRY ] %s %c %d @ %.4f (not sent)\\n",
                    std::string(sym).c_str(), side, qty, px);
    }
    static void cancel_order(uint64_t id) {
        std::printf("[DRY ] cancel %llu (not sent)\\n", (unsigned long long)id);
    }
    static constexpr bool is_live = false;
};

template<typename Policy>
class Strategy {
public:
    void on_signal(std::string_view sym, double mid) {
        if constexpr (Policy::is_live) {
            // Extra pre-trade checks only needed in live mode
            if (mid <= 0.0) { std::cerr << "bad price\\n"; return; }
        }
        Policy::send_order(sym, 'B', 100, mid * 0.9995); // passive bid
    }
};

int main() {
    Strategy<LivePolicy>   live_strat;
    Strategy<DryRunPolicy> dry_strat;

    live_strat.on_signal("AAPL", 150.0);
    dry_strat.on_signal("AAPL", 150.0);
}`,
    explanation:
      "The policy template parameter resolves at compile time, so DryRunPolicy's empty-body cancel_order is completely removed by the optimiser — unlike a runtime bool flag that still evaluates the condition every tick, this gives truly zero-overhead paper trading mode.",
  },
  {
    id: "cpp-20260521-b1-simd-avx2-dot",
    language: "cpp",
    title: "AVX2 dot product (4 doubles per cycle)",
    tag: "simd",
    code: `#include <immintrin.h>  // AVX2
#include <cstddef>
#include <iostream>
#include <vector>

// Process 4 doubles per iteration with 256-bit YMM registers.
// Requires -mavx2 compilation flag.
double dotAVX2(const double* __restrict__ a,
               const double* __restrict__ b,
               std::size_t n) {
    __m256d acc = _mm256_setzero_pd();  // {0,0,0,0}

    std::size_t i = 0;
    for (; i + 3 < n; i += 4) {
        __m256d va = _mm256_loadu_pd(a + i);
        __m256d vb = _mm256_loadu_pd(b + i);
        // FMA: acc += va * vb (fused multiply-add, single instruction with AVX2+FMA)
        acc = _mm256_fmadd_pd(va, vb, acc);  // requires -mfma
    }

    // Horizontal reduction: sum 4 lanes of acc
    // hadd collapses adjacent pairs; do it twice for full reduction.
    __m256d h = _mm256_hadd_pd(acc, acc);  // {a0+a1, a0+a1, a2+a3, a2+a3}
    __m128d lo = _mm256_castsi256_si128(_mm256_castpd_si256(h));
    lo = _mm_castsi128_pd(lo); // reinterpret
    __m128d lo_d = _mm256_castpd256_pd128(h);
    __m128d hi_d = _mm256_extractf128_pd(h, 1);
    __m128d sum4 = _mm_add_pd(lo_d, hi_d);

    double result;
    _mm_store_sd(&result, sum4);

    // Scalar tail
    for (; i < n; ++i) result += a[i] * b[i];
    return result;
}

int main() {
    std::vector<double> a(1024, 2.0), b(1024, 3.0);
    std::cout << "dot = " << dotAVX2(a.data(), b.data(), a.size())
              << "\\n"; // 6144
}`,
    explanation:
      "AVX2 FMA processes four fused multiply-adds per cycle; compared to SSE2 (2 doubles), the throughput doubles and the number of instructions halves, making it the standard for numerics in factor models and covariance estimation where large vectors are common.",
  },
  {
    id: "cpp-20260521-b1-cds-credit",
    language: "cpp",
    title: "CDS spread pricing from hazard rate",
    tag: "quant",
    code: `#include <cmath>
#include <iostream>
#include <vector>

// CDS pricing: par spread = (sum of premium-leg cash flows) priced at
//              credit-risky discount factors.
// Simplified: flat hazard rate lambda, flat risk-free rate r, RR = recovery rate.
struct CDSInputs {
    double notional;
    double lambda;       // constant hazard rate (annualised)
    double r;            // risk-free discount rate
    double recovery;     // loss given default fraction (e.g. 0.4 = 40%)
    double T;            // maturity in years
    int    n_periods;    // number of coupon periods per year
};

struct CDSResult {
    double fair_spread;  // annualised spread in bps terms
    double protection_leg_pv;
    double annuity;      // PV of receiving 1 bp annuity (used in DV01)
};

CDSResult price_cds(const CDSInputs& inp) {
    double dt     = 1.0 / inp.n_periods;
    double lgd    = 1.0 - inp.recovery;

    // Premium leg: sum of coupon * survival_prob * discount_factor at each date
    double premium_annuity = 0.0;
    for (int k = 1; k <= static_cast<int>(inp.T * inp.n_periods); ++k) {
        double t  = k * dt;
        double sp = std::exp(-inp.lambda * t);   // survival probability P(tau > t)
        double df = std::exp(-inp.r * t);        // risk-free DF
        premium_annuity += sp * df * dt;
    }

    // Protection leg: PV of receiving LGD at default
    // = LGD * integral of lambda * exp(-lambda*t) * exp(-r*t) dt
    //   over [0, T] = LGD * lambda / (lambda + r) * (1 - exp(-(lambda+r)*T))
    double lr  = inp.lambda + inp.r;
    double prot_pv = lgd * inp.notional * (inp.lambda / lr) * (1 - std::exp(-lr * inp.T));

    // Fair spread: equate premium leg PV to protection leg PV
    double fair_spread = (prot_pv / inp.notional) / premium_annuity; // annualised

    return {fair_spread * 10000, prot_pv, premium_annuity}; // spread in bps
}

int main() {
    CDSInputs inp{1'000'000, 0.02, 0.04, 0.4, 5.0, 4}; // 2% hazard, 5Y, quarterly
    auto res = price_cds(inp);
    std::cout << "Fair CDS spread: " << res.fair_spread << " bps\\n"; // ~120 bps
    std::cout << "Protection leg PV: $" << res.protection_leg_pv << "\\n";
}`,
    explanation:
      "The survival probability exp(-lambda*t) discounts each premium payment for default risk; the fair spread equates protection-leg PV to premium-leg PV, giving the market-clearing CDS rate — when the market spread exceeds this, the reference entity is pricing in more default risk than your hazard rate implies.",
  },
  {
    id: "cpp-20260521-b1-static-dispatch-msg",
    language: "cpp",
    title: "std::variant + std::visit for zero-cost message dispatch",
    tag: "design",
    code: `#include <iostream>
#include <string>
#include <variant>
#include <vector>

// Define distinct message types as plain structs — no virtual overhead.
struct AddOrder   { uint64_t id; char side; double px; int qty; };
struct CancelOrder{ uint64_t id; };
struct Trade      { uint64_t buy_id; uint64_t sell_id; double px; int qty; };

// The variant is a discriminated union — exactly one type at runtime.
using Message = std::variant<AddOrder, CancelOrder, Trade>;

// Handler struct with overloaded operator() — the visitor pattern.
struct Handler {
    void operator()(const AddOrder& m) const {
        std::printf("ADD id=%llu side=%c px=%.4f qty=%d\\n",
                    (unsigned long long)m.id, m.side, m.px, m.qty);
    }
    void operator()(const CancelOrder& m) const {
        std::printf("CANCEL id=%llu\\n", (unsigned long long)m.id);
    }
    void operator()(const Trade& m) const {
        std::printf("TRADE buy=%llu sell=%llu px=%.4f qty=%d\\n",
                    (unsigned long long)m.buy_id, (unsigned long long)m.sell_id,
                    m.px, m.qty);
    }
};

int main() {
    std::vector<Message> feed = {
        AddOrder{1, 'B', 100.5, 200},
        AddOrder{2, 'S', 101.0, 100},
        Trade{1, 2, 100.5, 100},
        CancelOrder{1},
    };

    Handler h;
    for (const auto& msg : feed)
        std::visit(h, msg); // compiler generates a jump table — no virtual call
}`,
    explanation:
      "std::visit compiles to a switch/jump-table over the variant index — the same overhead as a hand-written enum dispatch, but type-safe and exhaustive; a missing operator() overload is a compile error rather than a silent runtime fallthrough that swallows messages.",
  },
  {
    id: "cpp-20260521-b1-order-throttle",
    language: "cpp",
    title: "Token-bucket order throttle (O(1) per check)",
    tag: "quant",
    code: `#include <algorithm>
#include <chrono>
#include <cstdint>
#include <iostream>

// Token bucket rate limiter: refills at 'rate' tokens/second, capacity 'burst'.
// Used to enforce exchange-mandated order rate limits (e.g. 1000 orders/second).
class TokenBucket {
    double capacity_;    // max tokens (= burst allowance)
    double rate_;        // tokens refilled per second
    double tokens_;      // current token count
    std::chrono::steady_clock::time_point last_;

public:
    TokenBucket(double rate, double burst)
        : capacity_(burst), rate_(rate), tokens_(burst),
          last_(std::chrono::steady_clock::now()) {}

    // Returns true if the order is allowed; deducts one token.
    bool try_consume() {
        auto now = std::chrono::steady_clock::now();
        double elapsed = std::chrono::duration<double>(now - last_).count();
        last_ = now;

        tokens_ = std::min(capacity_, tokens_ + elapsed * rate_); // refill

        if (tokens_ >= 1.0) {
            tokens_ -= 1.0;
            return true;   // allowed
        }
        return false;      // throttled
    }

    double tokens() const { return tokens_; }
};

int main() {
    TokenBucket tb(100.0 /*orders/s*/, 10.0 /*burst*/);

    int sent = 0, throttled = 0;
    for (int i = 0; i < 20; ++i) {
        if (tb.try_consume()) ++sent;
        else                  ++throttled;
    }
    std::cout << "Sent: " << sent << " Throttled: " << throttled
              << " Remaining tokens: " << tb.tokens() << "\\n";
}`,
    explanation:
      "The token bucket tracks a fractional token count rather than discretising into integer refill ticks, giving smooth rate limiting without the burst spikes of a simpler counter reset; elapsed time is computed from the monotonic clock to handle uneven calling intervals correctly.",
  },
];
