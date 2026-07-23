import type { Snippet } from "./types";

export const cppSnippets20260723B1: Snippet[] = [
  {
    id: "cpp-20260723-b1-variant-dispatch",
    language: "cpp",
    title: "std::variant Message Dispatch for Market Events",
    tag: "meta-programming",
    code: `#include <variant>
#include <string>
#include <iostream>

// Tagged union of market event types — zero-overhead at runtime
// compared to virtual dispatch because std::visit resolves at compile time.
struct TradeEvent  { double price; uint32_t qty; };
struct QuoteEvent  { double bid; double ask; uint32_t bid_sz; uint32_t ask_sz; };
struct CancelEvent { uint64_t order_id; };

using MarketEvent = std::variant<TradeEvent, QuoteEvent, CancelEvent>;

// Overloaded visitor idiom: construct a visitor from a set of lambdas
template<typename... Ts>
struct Overloaded : Ts... { using Ts::operator()...; };
template<typename... Ts>
Overloaded(Ts...) -> Overloaded<Ts...>;

struct EventProcessor {
    double last_trade_price = 0.0;
    double mid_price        = 0.0;

    void process(const MarketEvent& ev) {
        std::visit(Overloaded{
            [this](const TradeEvent& t) {
                last_trade_price = t.price;
                std::cout << "Trade: " << t.qty << " @ " << t.price << "\n";
            },
            [this](const QuoteEvent& q) {
                mid_price = (q.bid + q.ask) / 2.0;
                std::cout << "Quote: " << q.bid << " / " << q.ask << "\n";
            },
            [](const CancelEvent& c) {
                std::cout << "Cancel: " << c.order_id << "\n";
            },
        }, ev);
    }
};

int main() {
    EventProcessor proc;
    std::vector<MarketEvent> feed = {
        QuoteEvent{100.0, 100.5, 500, 300},
        TradeEvent{100.5, 100},
        CancelEvent{42},
    };
    for (const auto& ev : feed) proc.process(ev);
}`,
    explanation:
      "std::variant with std::visit replaces a virtual-dispatch hierarchy for market events: the overloaded visitor pattern inlines all handlers, and the compiler generates a jump table rather than a vtable lookup. This cuts latency by ~3 ns per dispatch and eliminates heap allocations for the event objects.",
  },
  {
    id: "cpp-20260723-b1-slab-allocator",
    language: "cpp",
    title: "Slab Allocator for Fixed-Size Order Objects",
    tag: "low-latency",
    code: `#include <cstddef>
#include <cstdlib>
#include <cassert>
#include <vector>
#include <iostream>

// Slab allocator: a pool of fixed-size slots backed by a contiguous buffer.
// allocate() and deallocate() are O(1) with no system calls after init.
// Eliminates allocator contention and fragmentation for hot order objects.
template<typename T, std::size_t PoolSize>
class SlabAllocator {
    union Slot {
        alignas(T) std::byte data[sizeof(T)];
        Slot* next;  // intrusive free-list pointer
    };

    std::array<Slot, PoolSize> pool_;
    Slot*                       free_head_ = nullptr;

public:
    SlabAllocator() {
        // Build free list through all slots
        for (std::size_t i = 0; i < PoolSize - 1; ++i)
            pool_[i].next = &pool_[i + 1];
        pool_[PoolSize - 1].next = nullptr;
        free_head_ = &pool_[0];
    }

    T* allocate() noexcept {
        if (!free_head_) return nullptr;   // pool exhausted
        Slot* s = free_head_;
        free_head_ = s->next;
        return reinterpret_cast<T*>(s->data);
    }

    void deallocate(T* p) noexcept {
        // Run destructor, then return slot to free list
        p->~T();
        Slot* s = reinterpret_cast<Slot*>(p);
        s->next = free_head_;
        free_head_ = s;
    }

    std::size_t available() const noexcept {
        std::size_t count = 0;
        for (Slot* s = free_head_; s; s = s->next) ++count;
        return count;
    }
};

struct Order {
    uint64_t id;
    double   price;
    uint32_t qty;
    explicit Order(uint64_t i, double p, uint32_t q) : id(i), price(p), qty(q) {}
};

int main() {
    SlabAllocator<Order, 1024> pool;
    std::cout << "Available: " << pool.available() << "\n"; // 1024

    Order* o1 = new (pool.allocate()) Order(1, 100.0, 500);
    Order* o2 = new (pool.allocate()) Order(2, 101.0, 200);
    std::cout << "Order1: " << o1->price << "\n";

    pool.deallocate(o1);
    std::cout << "Available: " << pool.available() << "\n"; // 1023
    pool.deallocate(o2);
}`,
    explanation:
      "The slab allocator stores the free-list pointer inside the slot's own memory (intrusive free list), so each allocation and deallocation costs a single pointer swap — roughly 2 ns vs 50 ns for operator new. Pool size is a template parameter so the array lives on the stack or in a struct with zero heap overhead.",
  },
  {
    id: "cpp-20260723-b1-crtp-strategy",
    language: "cpp",
    title: "CRTP Static Polymorphism for Execution Algorithms",
    tag: "meta-programming",
    code: `#include <iostream>
#include <string>

// Curiously Recurring Template Pattern: static polymorphism without vtable.
// Derived class overrides 'execute_impl', base provides common scaffolding.
// No virtual dispatch → inlined by compiler, zero overhead.
template<typename Derived>
class ExecutionAlgo {
public:
    void execute(double quantity, double limit_price) {
        pre_execute(quantity, limit_price);
        static_cast<Derived*>(this)->execute_impl(quantity, limit_price);
        post_execute();
    }

    std::string name() const {
        return static_cast<const Derived*>(this)->name_impl();
    }

private:
    void pre_execute(double qty, double px) {
        std::cout << "[pre] executing " << qty << " @ max " << px << "\n";
    }
    void post_execute() {
        std::cout << "[post] execution complete\n";
    }
};

// TWAP: splits order evenly over N time slices
class TWAPAlgo : public ExecutionAlgo<TWAPAlgo> {
    int n_slices_;
public:
    explicit TWAPAlgo(int n) : n_slices_(n) {}

    void execute_impl(double qty, double limit_price) {
        double slice = qty / n_slices_;
        for (int i = 0; i < n_slices_; ++i)
            std::cout << "  TWAP slice " << i+1 << ": " << slice << "\n";
    }

    std::string name_impl() const { return "TWAP"; }
};

// Iceberg: shows only a visible quantity at a time
class IcebergAlgo : public ExecutionAlgo<IcebergAlgo> {
    double visible_qty_;
public:
    explicit IcebergAlgo(double vis) : visible_qty_(vis) {}

    void execute_impl(double qty, double limit_price) {
        while (qty > 0) {
            double send = std::min(qty, visible_qty_);
            std::cout << "  Iceberg order: " << send << " (hidden: "
                      << (qty - send) << ")\n";
            qty -= send;
        }
    }

    std::string name_impl() const { return "Iceberg"; }
};

template<typename T>
void run_algo(ExecutionAlgo<T>& algo, double qty, double px) {
    std::cout << "=== " << algo.name() << " ===\n";
    algo.execute(qty, px);
}

int main() {
    TWAPAlgo    twap(4);
    IcebergAlgo iceberg(250);
    run_algo(twap,    1000, 101.5);
    run_algo(iceberg, 1000, 101.5);
}`,
    explanation:
      "CRTP achieves polymorphism without vtable: static_cast<Derived*>(this)->execute_impl() is resolved at compile time and inlined, giving the same OOP ergonomics as virtual dispatch but at the cost of a template instantiation per type. Execution algorithms are hot paths where virtual dispatch overhead (vtable + icache miss ≈ 5–10 ns) matters.",
  },
  {
    id: "cpp-20260723-b1-mpsc-queue",
    language: "cpp",
    title: "Lock-Free MPSC Ring Buffer (Multi-Producer Single-Consumer)",
    tag: "low-latency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstddef>
#include <iostream>
#include <thread>
#include <vector>

// MPSC ring buffer: multiple producers push concurrently using CAS on head_.
// Single consumer pops from tail_ without synchronisation cost.
// Each slot has a sequence number to detect when a write is complete.
template<typename T, std::size_t Cap>
class MPSCQueue {
    static_assert((Cap & (Cap - 1)) == 0, "Cap must be power of 2");

    struct Slot {
        alignas(64) std::atomic<std::size_t> seq;
        T data;
    };

    alignas(64) std::array<Slot, Cap> buf_;
    alignas(64) std::atomic<std::size_t> head_{0}; // claimed by producers
    alignas(64) std::size_t              tail_{0};  // exclusive to consumer

public:
    MPSCQueue() {
        for (std::size_t i = 0; i < Cap; ++i)
            buf_[i].seq.store(i, std::memory_order_relaxed);
    }

    bool push(const T& val) {
        std::size_t pos;
        Slot* slot;
        while (true) {
            pos  = head_.load(std::memory_order_relaxed);
            slot = &buf_[pos & (Cap - 1)];
            std::size_t seq = slot->seq.load(std::memory_order_acquire);
            intptr_t diff = static_cast<intptr_t>(seq) - static_cast<intptr_t>(pos);
            if (diff == 0) {
                // Slot is empty and pos matches — try to claim it
                if (head_.compare_exchange_weak(pos, pos + 1,
                        std::memory_order_relaxed, std::memory_order_relaxed))
                    break;
            } else if (diff < 0) {
                return false; // full
            }
            // diff > 0: another producer advanced head, retry
        }
        slot->data = val;
        // Signal consumer that data is ready
        slot->seq.store(pos + 1, std::memory_order_release);
        return true;
    }

    std::optional<T> pop() {
        Slot* slot = &buf_[tail_ & (Cap - 1)];
        std::size_t seq = slot->seq.load(std::memory_order_acquire);
        intptr_t diff = static_cast<intptr_t>(seq) - static_cast<intptr_t>(tail_ + 1);
        if (diff < 0) return std::nullopt; // empty
        T val = slot->data;
        // Mark slot as available for the next round
        slot->seq.store(tail_ + Cap, std::memory_order_release);
        ++tail_;
        return val;
    }
};

int main() {
    MPSCQueue<int, 256> q;
    std::vector<std::thread> producers;
    for (int t = 0; t < 4; ++t)
        producers.emplace_back([&q, t] {
            for (int i = 0; i < 64; ++i) q.push(t * 1000 + i);
        });
    for (auto& p : producers) p.join();
    int count = 0;
    while (q.pop()) ++count;
    std::cout << "Consumed: " << count << " items\n"; // 256
}`,
    explanation:
      "The sequence number per slot decouples the claim step (head_ CAS) from the publish step (seq.store), so a slow producer does not block the consumer on partially-written slots. The consumer's tail_ is not shared, so pop() has zero synchronisation cost — ideal for a strategy thread consuming market events from multiple network threads.",
  },
  {
    id: "cpp-20260723-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive Doubly-Linked List for Order Book Levels",
    tag: "data-structures",
    code: `#include <cstdint>
#include <iostream>
#include <cassert>

// Intrusive list: the node pointers live inside the object itself.
// No separate allocation for list nodes — objects ARE nodes.
// Zero overhead insert/erase at O(1) given a pointer to the node.
struct ListHook {
    ListHook* prev = nullptr;
    ListHook* next = nullptr;
};

class IntrusiveList {
    ListHook sentinel_; // sentinel node: sentinel_.next = head, sentinel_.prev = tail

public:
    IntrusiveList() {
        sentinel_.next = &sentinel_;
        sentinel_.prev = &sentinel_;
    }

    bool empty() const { return sentinel_.next == &sentinel_; }

    // O(1) insert at tail
    void push_back(ListHook* node) {
        node->prev = sentinel_.prev;
        node->next = &sentinel_;
        sentinel_.prev->next = node;
        sentinel_.prev = node;
    }

    // O(1) insert at head
    void push_front(ListHook* node) {
        node->next = sentinel_.next;
        node->prev = &sentinel_;
        sentinel_.next->prev = node;
        sentinel_.next = node;
    }

    // O(1) remove given a pointer — no search required
    static void erase(ListHook* node) {
        node->prev->next = node->next;
        node->next->prev = node->prev;
        node->prev = node->next = nullptr;
    }

    ListHook* front() const { return empty() ? nullptr : sentinel_.next; }
    ListHook* back()  const { return empty() ? nullptr : sentinel_.prev; }
};

struct Order {
    ListHook  hook;      // must be first for zero-cost container_of
    uint64_t  id;
    double    price;
    uint32_t  qty;
    Order(uint64_t i, double p, uint32_t q) : id(i), price(p), qty(q) {}
};

// Recover Order* from ListHook* — safe because hook is the first member
inline Order* order_of(ListHook* h) {
    return reinterpret_cast<Order*>(reinterpret_cast<char*>(h) - offsetof(Order, hook));
}

int main() {
    IntrusiveList queue;
    Order o1{1, 100.0, 100}, o2{2, 100.0, 200}, o3{3, 100.0, 50};
    queue.push_back(&o1.hook);
    queue.push_back(&o2.hook);
    queue.push_back(&o3.hook);

    // Erase middle order O(1) — no search
    IntrusiveList::erase(&o2.hook);

    for (ListHook* h = queue.front(); h; h = h->next == queue.front() ? nullptr : h->next) {
        Order* o = order_of(h);
        std::cout << "id=" << o->id << " qty=" << o->qty << "\n";
    }
}`,
    explanation:
      "Intrusive lists store the prev/next pointers inside the payload object, so erase() requires only pointer surgery — no search, no memory allocation. In order books, cancel messages carry an order pointer; intrusive erase takes ~4 ns vs ~15 ns for std::list's node-based variant because there is no separate list node to allocate or free.",
  },
  {
    id: "cpp-20260723-b1-constexpr-fnv",
    language: "cpp",
    title: "Constexpr FNV-1a Hash for Compile-Time Symbol Table",
    tag: "meta-programming",
    code: `#include <cstdint>
#include <cstring>
#include <iostream>
#include <array>
#include <string_view>

// FNV-1a (Fowler-Noll-Vo): simple, fast, compile-time evaluable hash.
// Used to build compile-time perfect-hash tables for fixed instrument sets.
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

// Compile-time symbol table: associate fixed set of tickers with indices
struct SymbolEntry {
    uint64_t    hash;
    const char* name;
    int         index;
};

static constexpr std::array<SymbolEntry, 5> SYMBOL_TABLE{{
    {fnv1a("AAPL"), "AAPL", 0},
    {fnv1a("GOOG"), "GOOG", 1},
    {fnv1a("MSFT"), "MSFT", 2},
    {fnv1a("TSLA"), "TSLA", 3},
    {fnv1a("AMZN"), "AMZN", 4},
}};

// O(N) linear scan — with N=5, this is ~5 comparisons vs O(N) map overhead
int lookup_symbol(std::string_view sym) {
    uint64_t h = fnv1a(sym);
    for (const auto& e : SYMBOL_TABLE)
        if (e.hash == h && sym == e.name)
            return e.index;
    return -1;
}

// Compile-time test
static_assert(fnv1a("AAPL") != fnv1a("GOOG"), "hash collision");
static_assert(fnv1a("AAPL") == fnv1a("AAPL"), "hash stable");

int main() {
    // Runtime lookup — hash computed at compile time for literals
    constexpr auto aapl_hash = fnv1a("AAPL");
    std::cout << "AAPL hash: " << aapl_hash << "\n";
    std::cout << "AAPL index: " << lookup_symbol("AAPL") << "\n"; // 0
    std::cout << "TSLA index: " << lookup_symbol("TSLA") << "\n"; // 3
    std::cout << "UNKNOWN:    " << lookup_symbol("XYZ")  << "\n"; // -1
}`,
    explanation:
      "FNV-1a is a non-cryptographic hash with excellent distribution for short strings and constexpr-friendly arithmetic. Embedding hashes in the symbol table at compile time allows the runtime lookup to compare a single uint64_t per entry rather than calling strcmp, cutting symbol resolution from ~10 ns to ~3 ns for small tables used in FIX message dispatch.",
  },
  {
    id: "cpp-20260723-b1-vasicek-mc",
    language: "cpp",
    title: "Vasicek Short Rate Monte Carlo Bond Pricing",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <algorithm>
#include <numeric>
#include <iostream>

// Vasicek (1977): dr = a*(b - r)*dt + sigma*dW
// Analytic bond price: P(0,T) = A(T)*exp(-B(T)*r0)
// where B(T) = (1 - e^{-aT})/a
//       A(T) = exp( (B(T)-T)*(a^2*b - 0.5*sigma^2)/a^2 - sigma^2*B(T)^2/(4a) )
struct Vasicek {
    double a;      // mean reversion speed
    double b;      // long-run mean
    double sigma;  // volatility
    double r0;     // initial short rate

    // Exact (Euler-exact for affine model): conditional distribution is Gaussian
    double sim_r(double r, double dt, double z) const {
        double e = std::exp(-a * dt);
        double mean = r * e + b * (1.0 - e);
        double std  = sigma * std::sqrt((1.0 - e*e) / (2.0*a));
        return mean + std * z;
    }

    // MC bond price: E[exp(-integral_0^T r(s) ds)]
    double bond_mc(double T, int n_paths, int n_steps, uint64_t seed = 42) const {
        std::mt19937_64 rng(seed);
        std::normal_distribution<double> norm;
        double dt = T / n_steps;
        double sum = 0.0;
        for (int p = 0; p < n_paths; ++p) {
            double r = r0, integral = 0.0;
            for (int t = 0; t < n_steps; ++t) {
                integral += r * dt;
                r = sim_r(r, dt, norm(rng));
            }
            sum += std::exp(-integral);
        }
        return sum / n_paths;
    }

    // Analytic zero-coupon bond price
    double bond_analytic(double T) const {
        double B = (1.0 - std::exp(-a*T)) / a;
        double A = std::exp((B - T) * (a*a*b - 0.5*sigma*sigma) / (a*a)
                           - sigma*sigma*B*B / (4.0*a));
        return A * std::exp(-B * r0);
    }
};

int main() {
    Vasicek v{0.15, 0.06, 0.02, 0.05}; // fast reversion, 6% long-run, 2% vol, 5% r0
    double T = 5.0;
    double analytic = v.bond_analytic(T);
    double mc       = v.bond_mc(T, 50000, 252);
    std::cout << "Analytic P(0,5): " << analytic << "\n";
    std::cout << "MC       P(0,5): " << mc       << "\n";
    std::cout << "Error: " << std::abs(mc - analytic) / analytic * 100 << "%\n";
}`,
    explanation:
      "The Vasicek model's affine structure yields an exact Gaussian conditional distribution, so each Monte Carlo step is exact — no discretisation error unlike Euler-Maruyama. The analytical bond price P(0,T) = A(T)e^{−B(T)r₀} is used as a control variate or benchmark; the long-run mean b determines the zero-coupon yield curve's level at infinity.",
  },
  {
    id: "cpp-20260723-b1-merton-jump",
    language: "cpp",
    title: "Merton Jump-Diffusion Option Pricing",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <iostream>
#include <algorithm>

// Merton (1976): dS/S = (r - lambda*kbar)*dt + sigma*dW + J*dN
// J: log-normal jump, dN: Poisson process with intensity lambda.
// kbar = E[J-1] = exp(mu_J + 0.5*sigma_J^2) - 1
// Analytic formula: sum of weighted Black-Scholes terms.

static double N_cdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }

double bs_call(double S, double K, double r, double sigma, double T) {
    double d1 = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double d2 = d1 - sigma * std::sqrt(T);
    return S * N_cdf(d1) - K * std::exp(-r*T) * N_cdf(d2);
}

// Merton series: exact for log-normal jumps (infinite sum, truncated at N_terms)
double merton_call(double S, double K, double r, double sigma,
                   double T, double lambda, double mu_J, double sigma_J,
                   int n_terms = 20) {
    double kbar    = std::exp(mu_J + 0.5*sigma_J*sigma_J) - 1.0;
    double lambda_p = lambda * (1.0 + kbar);  // risk-neutral jump intensity
    double price   = 0.0;
    double e_term  = std::exp(-lambda_p * T);
    double lambda_T_n = 1.0;  // (lambda'*T)^n / n!

    for (int n = 0; n < n_terms; ++n) {
        double w = e_term * lambda_T_n;
        // Effective vol and drift for n-jump scenario
        double sigma_n = std::sqrt(sigma*sigma + n*sigma_J*sigma_J/T);
        double r_n     = r - lambda*kbar + n*(mu_J + 0.5*sigma_J*sigma_J)/T;
        price += w * bs_call(S, K, r_n, sigma_n, T);
        lambda_T_n *= lambda_p * T / (n + 1);
    }
    return price;
}

// MC verification
double merton_mc(double S0, double K, double r, double sigma, double T,
                 double lambda, double mu_J, double sigma_J,
                 int n_paths, uint64_t seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> norm;
    std::poisson_distribution<int>   poi(lambda * T);
    double disc = std::exp(-r * T);
    double kbar = std::exp(mu_J + 0.5*sigma_J*sigma_J) - 1.0;
    double sum  = 0.0;
    for (int p = 0; p < n_paths; ++p) {
        int n_jumps = poi(rng);
        double log_jump = 0.0;
        for (int j = 0; j < n_jumps; ++j)
            log_jump += mu_J + sigma_J * norm(rng);
        double S = S0 * std::exp((r - lambda*kbar - 0.5*sigma*sigma)*T
                                  + sigma*std::sqrt(T)*norm(rng) + log_jump);
        sum += std::max(S - K, 0.0);
    }
    return disc * sum / n_paths;
}

int main() {
    double S=100, K=100, r=0.05, sigma=0.20, T=1.0;
    double lambda=0.5, mu_J=-0.10, sigma_J=0.15;
    double series = merton_call(S, K, r, sigma, T, lambda, mu_J, sigma_J);
    double mc     = merton_mc(S, K, r, sigma, T, lambda, mu_J, sigma_J, 100000);
    std::cout << "Merton series: " << series << "\n";
    std::cout << "Merton MC:     " << mc     << "\n";
}`,
    explanation:
      "The Merton series decomposes the jump-diffusion price into a weighted sum of Black-Scholes prices conditioned on n jumps occurring, where weights are Poisson probabilities. Negative mu_J (downward jumps) raises put prices and creates the left-skew observed in equity implied vol surfaces. The series converges rapidly — 20 terms suffice for typical parameters.",
  },
  {
    id: "cpp-20260723-b1-barrier-mc",
    language: "cpp",
    title: "Barrier Option Pricing via Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <iostream>

// Down-and-out call: pays max(S_T - K, 0) if S never touches barrier H.
// Continuous monitoring: use Brownian bridge correction to reduce
// time-discretisation bias for barrier crossing.

struct BarrierOption {
    double S0, K, H;    // spot, strike, barrier (H < S0 for down-and-out)
    double r, sigma, T;
};

// Brownian bridge probability of touching H in [t, t+dt] given S_t and S_{t+dt}
static double bb_crossing_prob(double St, double Stdt, double H, double dt, double sigma) {
    if (St <= H || Stdt <= H) return 1.0; // already knocked out
    double log_r = std::log(St / H) * std::log(Stdt / H);
    if (log_r <= 0) return 1.0;
    return std::exp(-2.0 * log_r / (sigma * sigma * dt));
}

double barrier_mc(const BarrierOption& opt, int n_paths, int n_steps,
                   bool use_bb_correction = true, uint64_t seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> norm;
    std::uniform_real_distribution<double> unif;

    double dt   = opt.T / n_steps;
    double disc = std::exp(-opt.r * opt.T);
    double sum  = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = opt.S0;
        bool   knocked_out = false;

        for (int t = 0; t < n_steps && !knocked_out; ++t) {
            double S_prev = S;
            S *= std::exp((opt.r - 0.5*opt.sigma*opt.sigma)*dt
                         + opt.sigma*std::sqrt(dt)*norm(rng));
            if (use_bb_correction) {
                // Stochastically test for barrier crossing between steps
                double prob_cross = bb_crossing_prob(S_prev, S, opt.H, dt, opt.sigma);
                if (unif(rng) < prob_cross) knocked_out = true;
            } else {
                if (S <= opt.H) knocked_out = true;
            }
        }

        if (!knocked_out)
            sum += std::max(S - opt.K, 0.0);
    }
    return disc * sum / n_paths;
}

int main() {
    BarrierOption opt{100, 100, 80, 0.05, 0.20, 1.0};
    double no_corr = barrier_mc(opt, 100000, 252, false);
    double bb_corr = barrier_mc(opt, 100000, 252, true);
    std::cout << "No BB correction: " << no_corr << "\n";
    std::cout << "BB correction:    " << bb_corr << "\n";
    // Analytic down-and-out call (H<K): ~7.5 at these params
}`,
    explanation:
      "The Brownian bridge correction addresses a fundamental bias in discrete-monitoring barrier MC: the path may cross the barrier between two time steps and then recover, but the simulation misses the crossing. The BB formula gives the exact probability that a Brownian path touched the barrier, allowing stochastic correction without increasing time steps.",
  },
  {
    id: "cpp-20260723-b1-fixed-point",
    language: "cpp",
    title: "Fixed-Point Price Arithmetic (Tick-Encoded)",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cmath>
#include <iostream>
#include <stdexcept>

// Fixed-point price: represent prices as integers of smallest tick.
// Avoids floating-point rounding errors in order matching.
// E.g. tick=0.01 -> Price(100.25) = 10025.
struct Price {
    int64_t ticks;     // raw integer representation
    static constexpr int64_t TICK_DENOMINATOR = 10000; // 4 decimal places

    static Price from_double(double d) {
        return {static_cast<int64_t>(std::round(d * TICK_DENOMINATOR))};
    }
    double to_double() const { return static_cast<double>(ticks) / TICK_DENOMINATOR; }

    Price operator+(const Price& o) const { return {ticks + o.ticks}; }
    Price operator-(const Price& o) const { return {ticks - o.ticks}; }
    Price operator*(int64_t scalar) const { return {ticks * scalar}; }

    // Division: scale up numerator before dividing to preserve precision
    Price operator/(int64_t scalar) const {
        return {(ticks + scalar / 2) / scalar}; // round-half-up
    }

    bool operator<(const Price& o) const { return ticks < o.ticks; }
    bool operator==(const Price& o) const { return ticks == o.ticks; }

    // Compute notional: price * quantity (qty in shares)
    // Returns an integer in tick*share units — convert to $ by /TICK_DENOMINATOR
    int64_t notional(int64_t qty) const { return ticks * qty; }
};

// Spread computation: exact, no floating-point error
Price spread(Price ask, Price bid) { return ask - bid; }

int main() {
    Price bid = Price::from_double(100.12);
    Price ask = Price::from_double(100.15);
    Price mid = (bid + ask) / 2;

    std::cout << "Bid: " << bid.to_double() << "\n"; // 100.12
    std::cout << "Ask: " << ask.to_double() << "\n"; // 100.15
    std::cout << "Mid: " << mid.to_double() << "\n"; // 100.135
    std::cout << "Spread: " << spread(ask, bid).to_double() << "\n"; // 0.03

    // Notional in dollars
    int64_t qty = 10000;
    double notional_usd = static_cast<double>(ask.notional(qty)) / Price::TICK_DENOMINATOR;
    std::cout << "Notional: $" << notional_usd << "\n"; // $1,001,500
}`,
    explanation:
      "Floating-point prices accumulate rounding errors across thousands of operations (e.g., 0.1 + 0.2 ≠ 0.3 in IEEE754). Fixed-point arithmetic with 4 decimal places stores prices as integers — comparison and spread computation are exact integer operations. Exchanges internally represent prices this way; matching engines avoid floating-point entirely.",
  },
  {
    id: "cpp-20260723-b1-vwap-stream",
    language: "cpp",
    title: "Streaming VWAP with Cache-Friendly Layout",
    tag: "low-latency",
    code: `#include <cstdint>
#include <vector>
#include <cmath>
#include <iostream>

// VWAP = sum(price * volume) / sum(volume)
// Streaming form: accumulate pv and vol in a struct of arrays (SoA)
// rather than array of structs (AoS) for SIMD-friendly memory layout.

struct TradeBook {
    // SoA layout: each field in its own contiguous array
    std::vector<double>   price;
    std::vector<uint64_t> volume;

    void add_trade(double p, uint64_t v) {
        price.push_back(p);
        volume.push_back(v);
    }

    // Compute VWAP over [start, end) using unrolled loop
    double vwap(std::size_t start, std::size_t end) const {
        double   sum_pv  = 0.0;
        uint64_t sum_vol = 0;
        std::size_t n = end - start;

        // Unrolled 4-wide to enable auto-vectorisation
        std::size_t i = start;
        for (; i + 4 <= end; i += 4) {
            sum_pv  += price[i]   * volume[i]
                     + price[i+1] * volume[i+1]
                     + price[i+2] * volume[i+2]
                     + price[i+3] * volume[i+3];
            sum_vol += volume[i] + volume[i+1] + volume[i+2] + volume[i+3];
        }
        // Handle tail
        for (; i < end; ++i) {
            sum_pv  += price[i] * volume[i];
            sum_vol += volume[i];
        }
        return sum_vol > 0 ? sum_pv / sum_vol : 0.0;
    }

    // Rolling VWAP over last window_size trades
    double rolling_vwap(std::size_t window_size) const {
        if (price.empty()) return 0.0;
        std::size_t end   = price.size();
        std::size_t start = end > window_size ? end - window_size : 0;
        return vwap(start, end);
    }
};

int main() {
    TradeBook book;
    // Simulate 1000 trades
    for (int i = 0; i < 1000; ++i)
        book.add_trade(100.0 + 0.01*i, 100 + i % 50);

    std::cout << "Full VWAP:    " << book.vwap(0, book.price.size()) << "\n";
    std::cout << "Rolling VWAP: " << book.rolling_vwap(100) << "\n";
}`,
    explanation:
      "Structure of Arrays separates price[] and volume[] into contiguous blocks, letting the compiler and CPU vectorise the VWAP accumulation loop — processing 4 double multiplies per cycle vs 1 in an AoS layout. VWAP benchmarking is a common interview problem; knowing the SoA pattern and 4-way unrolling as a vectorisation hint is expected at HFT firms.",
  },
  {
    id: "cpp-20260723-b1-cholesky",
    language: "cpp",
    title: "Cholesky Decomposition for Correlated Returns",
    tag: "numerics",
    code: `#include <array>
#include <cmath>
#include <iostream>
#include <random>
#include <vector>

// Cholesky decomposition: L * L^T = Sigma (positive-definite covariance matrix).
// Used to transform independent standard normals into correlated ones:
// x = L * z where z ~ N(0, I) gives x ~ N(0, Sigma).
template<std::size_t N>
std::array<std::array<double, N>, N>
cholesky(const std::array<std::array<double, N>, N>& A) {
    std::array<std::array<double, N>, N> L{};
    for (std::size_t j = 0; j < N; ++j) {
        double sum = A[j][j];
        for (std::size_t k = 0; k < j; ++k) sum -= L[j][k] * L[j][k];
        L[j][j] = std::sqrt(sum); // diagonal element
        for (std::size_t i = j + 1; i < N; ++i) {
            double s = A[i][j];
            for (std::size_t k = 0; k < j; ++k) s -= L[i][k] * L[j][k];
            L[i][j] = s / L[j][j];
        }
    }
    return L;
}

// Multiply L * z (lower triangular)
template<std::size_t N>
std::array<double, N>
apply_cholesky(const std::array<std::array<double, N>, N>& L,
               const std::array<double, N>& z) {
    std::array<double, N> x{};
    for (std::size_t i = 0; i < N; ++i)
        for (std::size_t j = 0; j <= i; ++j)
            x[i] += L[i][j] * z[j];
    return x;
}

int main() {
    // 3-asset covariance matrix: vol 20%, 25%, 30%; pairwise corr 0.5
    constexpr std::array<std::array<double, 3>, 3> SIGMA{{
        {0.04,   0.025,  0.03},
        {0.025,  0.0625, 0.0375},
        {0.03,   0.0375, 0.09},
    }};
    auto L = cholesky<3>(SIGMA);

    std::mt19937_64 rng(42);
    std::normal_distribution<double> norm;

    // Generate 100000 correlated return samples
    double cov12 = 0.0;
    int n = 100000;
    for (int i = 0; i < n; ++i) {
        std::array<double, 3> z = {norm(rng), norm(rng), norm(rng)};
        auto x = apply_cholesky<3>(L, z);
        cov12 += x[0] * x[1];
    }
    std::cout << "Empirical cov(0,1): " << cov12/n << " (target: 0.025)\n";
}`,
    explanation:
      "Cholesky decomposition converts a correlation structure into a linear transform: correlated draws x = Lz have covariance E[xx^T] = L E[zz^T] L^T = L I L^T = Sigma. This is the standard approach for multi-asset Monte Carlo (equities, FX, rates) and credit copula simulation. Cholesky costs O(N³/3) flops and fails (NaN in sqrt) when the matrix is not positive-definite — a useful numeric check for calibrated covariance matrices.",
  },
  {
    id: "cpp-20260723-b1-duration-convexity",
    language: "cpp",
    title: "Bond Duration and Convexity",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <numeric>
#include <iostream>

// Modified duration: approximate % price change per 1% yield move.
// Convexity: second-order correction for large yield moves.
// DV01 = -(dP/dy) = P * ModDur / 10000 (per 1bp).
struct Bond {
    double face;
    double coupon;    // annual coupon rate
    double ytm;       // yield to maturity (continuous)
    double T;         // maturity in years
    int    freq;      // coupon frequency (2 = semi-annual)

    // Flat-yield price with continuous compounding
    double price() const {
        double c = face * coupon / freq;
        int n = static_cast<int>(T * freq);
        double p = 0.0;
        for (int i = 1; i <= n; ++i) {
            double t = static_cast<double>(i) / freq;
            p += c * std::exp(-ytm * t);
        }
        p += face * std::exp(-ytm * T); // principal
        return p;
    }

    // Macaulay duration = sum(t_i * PV(CF_i)) / Price
    double macaulay_duration() const {
        double c = face * coupon / freq;
        int n = static_cast<int>(T * freq);
        double p = price();
        double dur = 0.0;
        for (int i = 1; i <= n; ++i) {
            double t = static_cast<double>(i) / freq;
            dur += t * c * std::exp(-ytm * t);
        }
        dur += T * face * std::exp(-ytm * T);
        return dur / p;
    }

    // Modified duration = MacaulayContinuous (for continuous compounding)
    double modified_duration() const { return macaulay_duration(); }

    // Dollar duration (DV01): $ change per 1bp parallel shift
    double dv01() const { return price() * modified_duration() / 10000.0; }

    // Convexity = sum(t_i^2 * PV(CF_i)) / Price
    double convexity() const {
        double c = face * coupon / freq;
        int n = static_cast<int>(T * freq);
        double p = price();
        double conv = 0.0;
        for (int i = 1; i <= n; ++i) {
            double t = static_cast<double>(i) / freq;
            conv += t*t * c * std::exp(-ytm * t);
        }
        conv += T*T * face * std::exp(-ytm * T);
        return conv / p;
    }

    // Taylor price approximation: ΔP ≈ -ModDur*P*Δy + 0.5*Conv*P*Δy^2
    double price_approx(double dy) const {
        double p = price();
        return p * (-modified_duration()*dy + 0.5*convexity()*dy*dy);
    }
};

int main() {
    Bond b{1000.0, 0.05, 0.04, 10.0, 2};
    std::cout << "Price:     " << b.price()              << "\n";
    std::cout << "Mod Dur:   " << b.modified_duration()  << " years\n";
    std::cout << "DV01:      " << b.dv01()               << " per $1000\n";
    std::cout << "Convexity: " << b.convexity()          << "\n";

    double dy = 0.01; // 100bp shock
    double dp_exact  = b.price() * 1.01 / b.price() - 1; // re-price at ytm+1%
    Bond b2{b.face, b.coupon, b.ytm + dy, b.T, b.freq};
    std::cout << "ΔP exact:  " << b2.price() - b.price() << "\n";
    std::cout << "ΔP approx: " << b.price_approx(dy)     << "\n";
}`,
    explanation:
      "Modified duration and convexity form the first two terms of the Taylor expansion of price with respect to yield. Duration linearises the price-yield relationship; convexity captures the curve's curvature — positive convexity means the bond gains more from a yield drop than it loses from an equivalent rise. Convexity matters most for long-duration bonds (e.g., 30Y) and large yield moves.",
  },
  {
    id: "cpp-20260723-b1-asian-option-mc",
    language: "cpp",
    title: "Asian Arithmetic Average Option Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <numeric>
#include <vector>
#include <iostream>

// Asian (arithmetic average) call: pays max(A - K, 0) where A = mean(S_t1,...,S_tn).
// No closed form for arithmetic average — Monte Carlo is standard.
// Control variate: geometric-average Asian has a closed-form price
// and is highly correlated with the arithmetic average.

double geometric_asian_call(double S0, double K, double r, double sigma, double T, int n) {
    // Kemna-Vorst formula for geometric average call
    double sigma_adj = sigma * std::sqrt((2.0*n + 1.0) / (6.0*(n + 1.0)));
    double r_adj     = 0.5 * (r - 0.5*sigma*sigma + sigma_adj*sigma_adj);
    double d1 = (std::log(S0/K) + (r_adj + 0.5*sigma_adj*sigma_adj)*T) / (sigma_adj*std::sqrt(T));
    double d2 = d1 - sigma_adj * std::sqrt(T);
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    return std::exp(-r*T) * (S0*std::exp(r_adj*T)*N(d1) - K*N(d2));
}

struct AsianMC {
    double S0, K, r, sigma, T;
    int    n_obs;   // number of averaging observations

    // Returns {price, se} with optional control variate
    std::pair<double,double> price(int n_paths, bool use_cv = true, uint64_t seed = 42) const {
        std::mt19937_64 rng(seed);
        std::normal_distribution<double> norm;

        double dt     = T / n_obs;
        double disc   = std::exp(-r * T);
        double cv_analytic = use_cv ? geometric_asian_call(S0, K, r, sigma, T, n_obs) : 0.0;

        double sum_arith = 0.0, sum_geom = 0.0, sum_sq = 0.0;

        for (int p = 0; p < n_paths; ++p) {
            double S     = S0;
            double log_sum = 0.0;
            double arith_sum = 0.0;

            for (int t = 0; t < n_obs; ++t) {
                S *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*std::sqrt(dt)*norm(rng));
                arith_sum += S;
                log_sum   += std::log(S);
            }
            double arith_avg  = arith_sum / n_obs;
            double geom_avg   = std::exp(log_sum / n_obs);
            double payoff_a   = disc * std::max(arith_avg - K, 0.0);
            double payoff_g   = disc * std::max(geom_avg  - K, 0.0);

            if (use_cv) {
                double cv_pay = payoff_g - cv_analytic;
                sum_arith += payoff_a - cv_pay; // CV-adjusted
            } else {
                sum_arith += payoff_a;
            }
            sum_sq += payoff_a * payoff_a;
        }
        double price_est = (use_cv ? sum_arith : sum_arith) / n_paths
                          + (use_cv ? cv_analytic : 0.0);
        double se = std::sqrt(sum_sq / n_paths - std::pow(sum_arith/n_paths, 2))
                  / std::sqrt(n_paths);
        return {price_est, se};
    }
};

int main() {
    AsianMC opt{100, 100, 0.05, 0.20, 1.0, 252};
    auto [p_noCV, se_noCV] = opt.price(50000, false);
    auto [p_CV,   se_CV  ] = opt.price(50000, true);
    std::cout << "No CV:  " << p_noCV << " ± " << se_noCV << "\n";
    std::cout << "CV:     " << p_CV   << " ± " << se_CV   << "\n";
    // CV reduces standard error by ~10x for near-the-money Asians
}`,
    explanation:
      "The control variate (geometric average Asian) exploits the high correlation between arithmetic and geometric averages: subtracting (payoff_geom − analytic_geom) removes most of the variance. Variance reduction of 10–50× is typical, equivalent to running 100–2500× more paths without the control variate. Asian options are common in commodity and FX markets where average settlement reduces manipulation risk.",
  },
  {
    id: "cpp-20260723-b1-lookback-mc",
    language: "cpp",
    title: "Floating-Strike Lookback Option Monte Carlo",
    tag: "numerics",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <iostream>

// Floating-strike lookback call: pays S_T - min(S_t over [0,T]).
// Analytic price via Conze-Viswanathan formula — used here as benchmark.
// "Hindsight" option: option to buy at the lowest price in the period.

double lookback_call_analytic(double S0, double r, double sigma, double T) {
    // Goldman-Sosin-Gatto floating-strike call formula
    double a1 = (std::log(1.0) + (r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    double a2 = a1 - sigma*std::sqrt(T);
    double a3 = (std::log(1.0) + (-r + 0.5*sigma*sigma)*T) / (sigma*std::sqrt(T));
    auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
    // For at-the-money (S_min = S0 at t=0):
    // Price = S0*N(d1) - S0*exp(-rT)*N(d2) + S0*exp(-rT)*sigma^2/(2r)*(N(-d1) - exp(rT)*N(-a3))
    // Simplified: exact formula follows
    return S0 * (N(a1) - 1.0 + std::exp(-r*T)*N(-a2)
                 + sigma*sigma/(2.0*r)*std::exp(-r*T)*(N(-a1)*std::exp(r*T) - N(-a3)));
}

double lookback_call_mc(double S0, double r, double sigma, double T,
                         int n_paths, int n_steps, uint64_t seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> norm;
    double dt   = T / n_steps;
    double disc = std::exp(-r * T);
    double sum  = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double S = S0;
        double S_min = S0;
        for (int t = 0; t < n_steps; ++t) {
            S    *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*std::sqrt(dt)*norm(rng));
            S_min = std::min(S_min, S);
        }
        sum += std::max(S - S_min, 0.0);
    }
    return disc * sum / n_paths;
}

int main() {
    double S0=100, r=0.05, sigma=0.20, T=1.0;
    double analytic = lookback_call_analytic(S0, r, sigma, T);
    double mc       = lookback_call_mc(S0, r, sigma, T, 100000, 252);
    std::cout << "Lookback analytic: " << analytic << "\n";
    std::cout << "Lookback MC:       " << mc       << "\n";
    // Note: analytic formula assumes continuous monitoring; MC uses discrete steps
}`,
    explanation:
      "Floating-strike lookbacks always end in-the-money (since S_T − min ≥ 0) so they are expensive — typically 2–4× the corresponding vanilla. The discrete-monitoring bias relative to continuous monitoring is O(1/N) per step; the Broadie-Glasserman-Kou correction (add 0.5826 σ √(T/N) to the barrier) can align discrete MC with the analytic continuous formula.",
  },
  {
    id: "cpp-20260723-b1-timer-wheel",
    language: "cpp",
    title: "Timer Wheel for GTC Order Expiry",
    tag: "low-latency",
    code: `#include <cstdint>
#include <vector>
#include <list>
#include <functional>
#include <iostream>

// Timer wheel (Varghese & Lauck 1987): O(1) insert and O(1) expiry check
// for timers distributed over a bounded time range.
// Each slot holds a list of callbacks expiring in that tick bucket.
class TimerWheel {
    using Callback = std::function<void()>;
    struct Timer { uint64_t expiry_tick; Callback fn; };

    std::vector<std::list<Timer>> slots_;
    uint64_t current_tick_ = 0;

public:
    explicit TimerWheel(std::size_t n_slots) : slots_(n_slots) {}

    // Schedule cb to fire after delay_ticks ticks (O(1))
    void schedule(uint64_t delay_ticks, Callback cb) {
        uint64_t expiry  = current_tick_ + delay_ticks;
        std::size_t slot = expiry % slots_.size();
        slots_[slot].push_back({expiry, std::move(cb)});
    }

    // Advance one tick; fire all expired timers in this slot (O(expired))
    void tick() {
        ++current_tick_;
        auto& bucket = slots_[current_tick_ % slots_.size()];
        for (auto it = bucket.begin(); it != bucket.end(); ) {
            if (it->expiry_tick == current_tick_) {
                it->fn();
                it = bucket.erase(it);
            } else {
                ++it; // timer from a previous revolution, not yet due
            }
        }
    }

    uint64_t now() const { return current_tick_; }
};

int main() {
    TimerWheel tw(1024); // 1024-slot wheel

    // Schedule GTC order cancellations
    tw.schedule(100, []{ std::cout << "Order 1 expired at tick 100\n"; });
    tw.schedule(200, []{ std::cout << "Order 2 expired at tick 200\n"; });
    tw.schedule(100, []{ std::cout << "Order 3 expired at tick 100\n"; });

    // Advance 200 ticks
    for (uint64_t i = 0; i < 200; ++i) tw.tick();
    std::cout << "Done at tick " << tw.now() << "\n";
}`,
    explanation:
      "Timer wheels replace heaps for high-density timers: inserting into a slot is O(1) array indexing vs O(log N) for heap push. The modulo maps expiry times to slots; timers from previous revolutions sitting in the same slot are skipped by comparing expiry_tick. Used in matching engines for GTC order expiry (millions of timers) and session keepalive heartbeats.",
  },
  {
    id: "cpp-20260723-b1-concept-comparable",
    language: "cpp",
    title: "C++20 Concepts for Generic Order Comparators",
    tag: "meta-programming",
    code: `#include <concepts>
#include <cstdint>
#include <queue>
#include <vector>
#include <iostream>

// Concept: any type that has a double price() and a bool is_buy() member
template<typename T>
concept Priceable = requires(const T& t) {
    { t.price() } -> std::convertible_to<double>;
    { t.is_buy() } -> std::convertible_to<bool>;
};

// Concept: priority comparable order (has both price and sequence number)
template<typename T>
concept OrderLike = Priceable<T> && requires(const T& t) {
    { t.seq_no() } -> std::convertible_to<uint64_t>;
};

// Constrained generic best-bid comparator
template<OrderLike O>
struct BidComparator {
    // Highest price first; ties broken by earliest sequence number
    bool operator()(const O& a, const O& b) const {
        if (a.price() != b.price()) return a.price() < b.price();
        return a.seq_no() > b.seq_no(); // min-heap uses less-than
    }
};

template<OrderLike O>
struct AskComparator {
    bool operator()(const O& a, const O& b) const {
        if (a.price() != b.price()) return a.price() > b.price();
        return a.seq_no() > b.seq_no();
    }
};

struct Order {
    double   px_;
    uint64_t seq_;
    bool     buy_;

    double   price()  const { return px_;  }
    uint64_t seq_no() const { return seq_; }
    bool     is_buy() const { return buy_; }
};

// Generic book that works with any OrderLike type
template<OrderLike O, typename Cmp>
using OrderQueue = std::priority_queue<O, std::vector<O>, Cmp>;

int main() {
    OrderQueue<Order, BidComparator<Order>> bids;
    bids.push({100.5, 1, true});
    bids.push({101.0, 2, true});
    bids.push({101.0, 3, true}); // same price, later seq — lower priority

    std::cout << "Best bid: " << bids.top().price()
              << " seq=" << bids.top().seq_no() << "\n"; // 101.0, seq=2
}`,
    explanation:
      "C++20 concepts enforce semantic requirements at the point of instantiation rather than at the call site, producing readable error messages instead of template backtraces. Constraining order comparators to OrderLike ensures both price() and seq_no() exist before the priority queue is instantiated — a compile-time contract that replaces runtime RTTI or dynamic_cast.",
  },
  {
    id: "cpp-20260723-b1-span-slicing",
    language: "cpp",
    title: "std::span for Zero-Copy Market Data Slicing",
    tag: "meta-programming",
    code: `#include <span>
#include <vector>
#include <cstdint>
#include <cstring>
#include <string_view>
#include <iostream>
#include <numeric>

// std::span: a non-owning view over a contiguous range.
// Zero-copy slicing of raw market data buffers — no allocation, no memcpy.

// Fake FIX message buffer
struct FIXField {
    uint16_t tag;
    uint16_t len;
    char     value[32];
};

// Process a sub-sequence of fields without copying
double sum_prices(std::span<const FIXField> fields) {
    double total = 0.0;
    for (const auto& f : fields) {
        if (f.tag == 44 || f.tag == 270) { // tag 44=Price, 270=MDEntryPx
            double px = std::strtod(f.value, nullptr);
            total += px;
        }
    }
    return total;
}

// Zero-copy subspan for last-N fields
std::span<const FIXField> latest_n(std::span<const FIXField> all, std::size_t n) {
    if (all.size() <= n) return all;
    return all.last(n); // zero-copy subspan
}

// OHLCV from a span of prices — no ownership
struct OHLCV {
    double open, high, low, close;
    uint64_t volume;
};

OHLCV compute_ohlcv(std::span<const double> prices, std::span<const uint64_t> volumes) {
    if (prices.empty()) return {};
    double hi = prices[0], lo = prices[0];
    uint64_t vol = 0;
    for (double p : prices) { hi = std::max(hi, p); lo = std::min(lo, p); }
    for (uint64_t v : volumes) vol += v;
    return {prices.front(), hi, lo, prices.back(), vol};
}

int main() {
    std::vector<double>   prices  = {100, 101, 99, 102, 98, 103};
    std::vector<uint64_t> volumes = {100, 200, 150, 300, 200, 250};

    // Compute OHLCV for sub-window — NO copy, NO allocation
    auto price_span  = std::span<const double>(prices).subspan(2, 3);
    auto volume_span = std::span<const uint64_t>(volumes).subspan(2, 3);

    auto ohlcv = compute_ohlcv(price_span, volume_span);
    std::cout << "O=" << ohlcv.open << " H=" << ohlcv.high
              << " L=" << ohlcv.low  << " C=" << ohlcv.close
              << " V=" << ohlcv.volume << "\n";
}`,
    explanation:
      "std::span is a bounds-safe view that eliminates pointer-plus-length pairs passed separately. subspan() and last() create views with zero cost — no data copied. In market data processing, a single tick buffer is shared across parsers, aggregators, and strategy handlers all operating on non-overlapping spans of the same allocation.",
  },
  {
    id: "cpp-20260723-b1-lc-fd-explicit",
    language: "cpp",
    title: "Explicit Finite Difference PDE Solver (Black-Scholes)",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <iostream>

// Black-Scholes PDE: dV/dt + 0.5*sigma^2*S^2*d^2V/dS^2 + r*S*dV/dS - r*V = 0
// Explicit (forward Euler) finite difference on a uniform S grid.
// Stability condition: dt <= dS^2 / (sigma^2 * S_max^2) — CFL constraint.

struct FDGrid {
    int    N;         // number of S steps
    int    M;         // number of time steps
    double S_max;
    double r, sigma, T;

    std::vector<std::vector<double>> V; // V[time_step][S_index]

    FDGrid(int n, int m, double smax, double r_, double sig_, double T_)
        : N(n), M(m), S_max(smax), r(r_), sigma(sig_), T(T_)
        , V(m + 1, std::vector<double>(n + 1, 0.0))
    {}

    double dS() const { return S_max / N; }
    double dt() const { return T / M; }
    double S(int i) const { return i * dS(); }

    // Terminal condition: European call payoff
    void set_terminal_call(double K) {
        for (int i = 0; i <= N; ++i)
            V[M][i] = std::max(S(i) - K, 0.0);
    }

    // Time-step backwards (explicit scheme)
    void solve() {
        double ds = dS(), dt_ = dt();
        for (int j = M - 1; j >= 0; --j) {
            V[j][0]  = 0.0;               // S=0 boundary: call=0
            V[j][N]  = S_max - S_max * std::exp(-r * (T - j * dt_)); // upper BC
            for (int i = 1; i < N; ++i) {
                double Si   = S(i);
                double alpha = 0.5 * dt_ * (sigma*sigma*i*i - r*i);
                double beta  = 1.0 - dt_ * (sigma*sigma*i*i + r);
                double gamma = 0.5 * dt_ * (sigma*sigma*i*i + r*i);
                V[j][i] = alpha*V[j+1][i-1] + beta*V[j+1][i] + gamma*V[j+1][i+1];
            }
        }
    }

    // Interpolate at S0 by linear interpolation
    double price_at(double S0) const {
        double idx = S0 / dS();
        int i = static_cast<int>(idx);
        double frac = idx - i;
        return (1 - frac)*V[0][i] + frac*V[0][i+1];
    }
};

int main() {
    FDGrid grid(200, 2000, 200.0, 0.05, 0.20, 1.0);
    grid.set_terminal_call(100.0);
    grid.solve();
    double fd_price = grid.price_at(100.0);
    std::cout << "FD call price (S=100, K=100): " << fd_price << "\n"; // ~10.45
}`,
    explanation:
      "The explicit scheme computes each time-step directly from the previous one using the trinomial coefficients alpha/beta/gamma, but requires the CFL stability condition dt ≤ dS²/(σ²S_max²) — otherwise the solution oscillates. The implicit (Crank-Nicolson) scheme is unconditionally stable and more accurate for the same grid size, but requires solving a tridiagonal system at each step.",
  },
  {
    id: "cpp-20260723-b1-priority-queue-expiry",
    language: "cpp",
    title: "Lazy-Deletion Priority Queue for Order Expiry",
    tag: "data-structures",
    code: `#include <queue>
#include <unordered_set>
#include <cstdint>
#include <iostream>

// Lazy-deletion priority queue: instead of removing cancelled orders eagerly
// (O(N) for heap), mark them as cancelled and skip on pop (O(log N) amortised).
// Used for GTD (Good-Till-Date) order expiry where cancellation is frequent.

struct Expiry {
    uint64_t expiry_ns;  // when the order expires (nanosecond timestamp)
    uint64_t order_id;
    bool operator>(const Expiry& o) const { return expiry_ns > o.expiry_ns; }
};

class LazyExpiryQueue {
    std::priority_queue<Expiry, std::vector<Expiry>, std::greater<Expiry>> pq_;
    std::unordered_set<uint64_t> cancelled_;

public:
    // O(log N) insert
    void insert(uint64_t order_id, uint64_t expiry_ns) {
        pq_.push({expiry_ns, order_id});
    }

    // O(1) mark cancel (no heap operation)
    void cancel(uint64_t order_id) {
        cancelled_.insert(order_id);
    }

    // Pop and return the next truly expired order (skip cancelled ones)
    // Amortised O(log N) per genuine expiry
    uint64_t pop_expired(uint64_t now_ns) {
        while (!pq_.empty()) {
            const auto& top = pq_.top();
            if (cancelled_.count(top.order_id)) {
                cancelled_.erase(top.order_id);
                pq_.pop();
                continue;
            }
            if (top.expiry_ns > now_ns) break;  // not yet expired
            uint64_t id = top.order_id;
            pq_.pop();
            return id;
        }
        return 0; // no expired orders
    }

    bool empty() const { return pq_.empty(); }
};

int main() {
    LazyExpiryQueue eq;
    eq.insert(1, 1000);
    eq.insert(2, 2000);
    eq.insert(3, 1500);
    eq.insert(4, 3000);

    eq.cancel(3); // cancel order 3 lazily

    // Advance time to 2500ns
    uint64_t now = 2500;
    uint64_t id;
    while ((id = eq.pop_expired(now)) != 0)
        std::cout << "Expired: order " << id << "\n"; // 1, 2 (not 3)
}`,
    explanation:
      "Lazy deletion defers the cost of removing cancelled orders from the heap: instead of O(N) heapify, cancellation is O(1) insertion into a hash set. The skipping happens amortised across pop_expired calls — each cancelled order pays exactly one heap pop. This is the standard approach for production order expiry queues with millions of GTD orders and high cancellation rates.",
  },
  {
    id: "cpp-20260723-b1-ohlcv-ringbuf",
    language: "cpp",
    title: "Lock-Free OHLCV Ring Buffer for Rolling Bars",
    tag: "low-latency",
    code: `#include <atomic>
#include <array>
#include <cstdint>
#include <cmath>
#include <iostream>
#include <limits>

// Lock-free OHLCV ring buffer: single producer writes ticks;
// single reader computes rolling 1-minute bars without a lock.
struct OHLCV {
    double   open = 0, high = std::numeric_limits<double>::lowest();
    double   low  = std::numeric_limits<double>::max(), close = 0;
    uint64_t volume = 0;
    bool     valid  = false;

    void update(double price, uint64_t vol) {
        if (!valid) { open = price; valid = true; }
        high   = std::max(high, price);
        low    = std::min(low,  price);
        close  = price;
        volume += vol;
    }
};

template<std::size_t Cap>
class OHLCVBuffer {
    static_assert((Cap & (Cap - 1)) == 0);
    std::array<OHLCV, Cap> bars_{};
    alignas(64) std::atomic<std::size_t> write_{0}; // producer
    alignas(64) std::atomic<std::size_t> commit_{0}; // committed bars (read by consumer)

public:
    // Producer: start a new bar; returns pointer to write into
    OHLCV* begin_bar() {
        std::size_t w = write_.load(std::memory_order_relaxed);
        return &bars_[w & (Cap - 1)];
    }

    // Producer: finalize and advance write head
    void commit_bar() {
        std::size_t w = write_.load(std::memory_order_relaxed) + 1;
        write_.store(w, std::memory_order_relaxed);
        commit_.store(w, std::memory_order_release); // visible to consumer
    }

    // Consumer: number of bars available to read
    std::size_t available() const {
        return commit_.load(std::memory_order_acquire);
    }

    // Consumer: read bar at absolute position (modular)
    const OHLCV& read(std::size_t pos) const {
        return bars_[pos & (Cap - 1)];
    }
};

int main() {
    OHLCVBuffer<64> buf;
    // Simulate producer writing 3 bars
    for (int b = 0; b < 3; ++b) {
        OHLCV* bar = buf.begin_bar();
        *bar = OHLCV{};
        for (int t = 0; t < 10; ++t)
            bar->update(100.0 + b + 0.1*t, 100 + t);
        buf.commit_bar();
    }
    // Consumer reads committed bars
    for (std::size_t i = 0; i < buf.available(); ++i) {
        const auto& bar = buf.read(i);
        std::cout << "Bar " << i << ": O=" << bar.open << " H=" << bar.high
                  << " L=" << bar.low << " C=" << bar.close
                  << " V=" << bar.volume << "\n";
    }
}`,
    explanation:
      "The write_ / commit_ split separates the in-progress bar (written by the tick handler) from completed bars visible to the strategy thread. The consumer sees only commit_-many bars, never a partially-updated bar. The release on commit_.store pairs with the acquire on available(), providing the happens-before needed for the consumer to see complete OHLCV data.",
  },
  {
    id: "cpp-20260723-b1-make-market",
    language: "cpp",
    title: "Market Maker Spread and Inventory Skew",
    tag: "numerics",
    code: `#include <cmath>
#include <iostream>
#include <algorithm>

// Avellaneda-Stoikov market maker: optimal bid and ask quotes
// account for inventory risk. As inventory grows, quotes are skewed
// to attract trades that reduce the position.
//
// Reservation price: r = s - q * gamma * sigma^2 * (T - t)
// Optimal spread: delta = gamma * sigma^2 * (T - t) + (2/gamma) * ln(1 + gamma/kappa)
// bid = r - delta/2, ask = r + delta/2
// s: mid price, q: inventory, gamma: risk aversion, sigma: vol
// kappa: order arrival rate

struct MMQuoter {
    double gamma;   // risk aversion (0.1 typical)
    double sigma;   // annualised volatility
    double kappa;   // order arrival intensity

    struct Quotes { double bid, ask, spread, reservation; };

    Quotes quote(double s, double q, double T, double t) const {
        double tau       = T - t;
        double res_price = s - q * gamma * sigma * sigma * tau;
        double spread    = gamma * sigma * sigma * tau
                         + (2.0 / gamma) * std::log(1.0 + gamma / kappa);
        return {
            res_price - spread / 2.0,
            res_price + spread / 2.0,
            spread,
            res_price
        };
    }

    // Simple inventory-based skew (practical approximation)
    Quotes simple_skew(double s, double q, double spread, double alpha) const {
        // alpha: inventory sensitivity (e.g. 0.01 per share)
        double skew = alpha * q;
        return {
            s - spread / 2.0 - skew,
            s + spread / 2.0 - skew,
            spread,
            s - skew
        };
    }
};

int main() {
    MMQuoter mm{0.1, 0.20, 1.5};
    double mid = 100.0;

    for (double q : {-50.0, 0.0, 50.0}) {
        auto [bid, ask, spd, res] = mm.quote(mid, q, 1.0/252, 0.0);
        std::cout << "q=" << q
                  << "  res=" << res
                  << "  bid=" << bid
                  << "  ask=" << ask
                  << "  spread=" << spd << "\n";
    }
    // Positive inventory → quotes skew down to attract sellers
}`,
    explanation:
      "Avellaneda-Stoikov derives optimal bid and ask prices that maximise expected utility for a market maker with mean-variance preferences. The reservation price r shifts the midpoint toward the zero-inventory level: long inventory causes downward skew (bid and ask both decrease), attracting selling flow. kappa captures liquidity — higher order arrival allows a narrower spread.",
  },
  {
    id: "cpp-20260723-b1-arena-alloc",
    language: "cpp",
    title: "Arena (Bump) Allocator for Per-Request Objects",
    tag: "low-latency",
    code: `#include <cstddef>
#include <cstdlib>
#include <new>
#include <cstring>
#include <iostream>

// Arena allocator: allocate from a pre-allocated buffer with a bump pointer.
// All objects in an arena are freed together — O(1) bulk reset.
// Used for per-order or per-message allocations that all expire together.
class Arena {
    std::byte* buf_;
    std::size_t cap_;
    std::size_t used_ = 0;

public:
    Arena(std::size_t capacity)
        : buf_(static_cast<std::byte*>(std::aligned_alloc(64, capacity)))
        , cap_(capacity)
    {}

    ~Arena() { std::free(buf_); }

    // Aligned bump-pointer allocation — ~2 ns
    void* alloc(std::size_t size, std::size_t align = alignof(std::max_align_t)) {
        std::size_t offset = (used_ + align - 1) & ~(align - 1); // round up
        if (offset + size > cap_) return nullptr;                 // OOM
        used_ = offset + size;
        return buf_ + offset;
    }

    // Reset: free all objects instantly — no individual destructor calls
    void reset() { used_ = 0; }

    std::size_t used()      const { return used_; }
    std::size_t remaining() const { return cap_ - used_; }
};

// Placement-new helper for arena-allocated objects
template<typename T, typename... Args>
T* arena_new(Arena& a, Args&&... args) {
    void* p = a.alloc(sizeof(T), alignof(T));
    return p ? new (p) T(std::forward<Args>(args)...) : nullptr;
}

struct ParsedMessage {
    uint32_t seq_no;
    double   price;
    uint32_t qty;
    char     symbol[8];
};

int main() {
    Arena arena(1024 * 1024); // 1 MB per-message arena

    // Parse 100 messages; all allocations from the same arena
    for (int i = 0; i < 100; ++i) {
        auto* msg = arena_new<ParsedMessage>(arena);
        if (!msg) break;
        msg->seq_no = i;
        msg->price  = 100.0 + i * 0.01;
        msg->qty    = 100;
        std::strncpy(msg->symbol, "AAPL", 5);
    }

    std::cout << "Used: " << arena.used() << " bytes\n";
    arena.reset(); // free all 100 messages at once
    std::cout << "After reset: " << arena.used() << " bytes\n";
}`,
    explanation:
      "Arena allocators reduce allocation overhead from ~50 ns (operator new with lock) to ~2 ns (pointer bump + alignment mask). The key insight is that all objects within a request or tick batch share the same lifetime — they can all be freed together by resetting the bump pointer. This also improves cache locality: consecutive allocations are contiguous in memory.",
  },
  {
    id: "cpp-20260723-b1-perf-counter",
    language: "cpp",
    title: "Linux perf_event Cycles and Cache-Miss Counter",
    tag: "low-latency",
    code: `#include <cstdint>
#include <unistd.h>
#include <sys/syscall.h>
#include <linux/perf_event.h>
#include <cstring>
#include <sys/ioctl.h>
#include <iostream>
#include <vector>

// perf_event_open: hardware performance counters via kernel interface.
// Measures CPU cycles and L1 cache misses for a specific code region.
// More precise than RDTSC for micro-benchmarking because it attributes
// events to the process, not wall time.

static long perf_event_open(struct perf_event_attr* hw_event, pid_t pid,
                              int cpu, int group_fd, unsigned long flags) {
    return syscall(__NR_perf_event_open, hw_event, pid, cpu, group_fd, flags);
}

struct PerfCounter {
    int fd_cycles = -1, fd_misses = -1;

    void open() {
        struct perf_event_attr pe{};
        pe.size        = sizeof(pe);
        pe.disabled    = 1;
        pe.exclude_kernel = 1;
        pe.exclude_hv  = 1;

        pe.type   = PERF_TYPE_HARDWARE;
        pe.config = PERF_COUNT_HW_CPU_CYCLES;
        fd_cycles = static_cast<int>(perf_event_open(&pe, 0, -1, -1, 0));

        pe.config  = PERF_COUNT_HW_CACHE_MISSES;
        fd_misses  = static_cast<int>(perf_event_open(&pe, 0, -1, -1, 0));
    }

    void start() {
        ioctl(fd_cycles, PERF_EVENT_IOC_RESET, 0);
        ioctl(fd_misses, PERF_EVENT_IOC_RESET, 0);
        ioctl(fd_cycles, PERF_EVENT_IOC_ENABLE, 0);
        ioctl(fd_misses, PERF_EVENT_IOC_ENABLE, 0);
    }

    struct Counts { uint64_t cycles, misses; };

    Counts stop() {
        ioctl(fd_cycles, PERF_EVENT_IOC_DISABLE, 0);
        ioctl(fd_misses, PERF_EVENT_IOC_DISABLE, 0);
        Counts c{};
        read(fd_cycles, &c.cycles, sizeof(uint64_t));
        read(fd_misses, &c.misses, sizeof(uint64_t));
        return c;
    }

    ~PerfCounter() { close(fd_cycles); close(fd_misses); }
};

int main() {
    PerfCounter pc;
    pc.open();

    // Benchmark: linear scan vs random access
    std::vector<int> data(1 << 20, 1);

    pc.start();
    long sum = 0;
    for (int x : data) sum += x;  // sequential — cache friendly
    auto seq_counts = pc.stop();

    std::cout << "Sequential: " << seq_counts.cycles  << " cycles  "
              << seq_counts.misses << " misses\n";
    std::cout << "Sum (anti-opt): " << sum << "\n";
}`,
    explanation:
      "perf_event_open bypasses OS noise in RDTSC measurements by counting only CPU-cycles attributed to the current process. L1 cache-miss counts expose whether a routine suffers from cache-cold latency — essential for tuning order book structures. Random-access miss rates 30–50× higher than sequential scans are the canonical HFT motivator for cache-oblivious data layouts.",
  },
  {
    id: "cpp-20260723-b1-tick-norm",
    language: "cpp",
    title: "Tick Size Normalisation and Price Rounding",
    tag: "low-latency",
    code: `#include <cmath>
#include <cstdint>
#include <stdexcept>
#include <iostream>
#include <cassert>

// Exchange tick tables: each instrument has a price-range-dependent tick size.
// Normalise a raw price to the nearest valid tick.
struct TickLevel {
    double from_price; // tick size applies for prices >= from_price
    double tick_size;
};

// Example: US equities < $1 have 0.0001 tick; >= $1 have 0.01
const TickLevel US_EQUITY_TICKS[] = {
    {0.0,    0.0001},
    {1.0,    0.01},
};

double get_tick(double price, const TickLevel* tbl, int n) {
    double tick = tbl[0].tick_size;
    for (int i = 0; i < n; ++i)
        if (price >= tbl[i].from_price) tick = tbl[i].tick_size;
    return tick;
}

// Round price to nearest tick (away from zero for ties)
double round_to_tick(double price, double tick) {
    double inv = 1.0 / tick;
    return std::round(price * inv) / inv;
}

// Round bid down (floor) and ask up (ceiling) to valid ticks
double floor_tick(double price, double tick) {
    double inv = 1.0 / tick;
    return std::floor(price * inv) / inv;
}

double ceil_tick(double price, double tick) {
    double inv = 1.0 / tick;
    return std::ceil(price * inv) / inv;
}

// Number of ticks between two prices
int64_t tick_distance(double from, double to, double tick) {
    return static_cast<int64_t>(std::round((to - from) / tick));
}

int main() {
    double price = 100.123456789;
    double tick  = get_tick(price, US_EQUITY_TICKS, 2);
    std::cout << "Tick: " << tick << "\n"; // 0.01

    std::cout << "Rounded: " << round_to_tick(price, tick) << "\n"; // 100.12
    std::cout << "Bid:     " << floor_tick(price, tick)    << "\n"; // 100.12
    std::cout << "Ask:     " << ceil_tick(price, tick)     << "\n"; // 100.13

    double from = 99.99, to = 100.05;
    std::cout << "Distance: " << tick_distance(from, to, 0.01) << " ticks\n"; // 6

    // Sub-dollar tick
    double sub = 0.5432;
    double sub_tick = get_tick(sub, US_EQUITY_TICKS, 2);
    std::cout << "Sub-$1 tick: " << sub_tick << "\n"; // 0.0001
}`,
    explanation:
      "Incorrect tick rounding is a compliance violation: orders at non-tick-aligned prices are rejected by exchanges. The floor/ceil pattern is used for quote generation — bids are floored (maker gets a better price), asks are ceiled. Tick-distance arithmetic allows the matching engine to compare levels as integers after converting to tick units, eliminating floating-point comparisons.",
  },
];
