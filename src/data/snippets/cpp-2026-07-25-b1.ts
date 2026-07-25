import type { Snippet } from "./types";

export const cppSnippets20260725B1: Snippet[] = [
  {
    id: "cpp-20260725-b1-span-batch",
    language: "cpp",
    title: "std::span for zero-copy order batch view",
    tag: "cpp20",
    code: `#include <span>
#include <vector>
#include <cstdint>
#include <numeric>

struct Order { int64_t price; int32_t qty; char side; };

// span is a non-owning view: no allocation, no copy.
// Accepts both std::vector and raw arrays without template overloads.
double vwap_from_span(std::span<const Order> orders) {
    int64_t total_val = 0, total_qty = 0;
    for (auto& o : orders) {
        total_val += o.price * o.qty;
        total_qty += o.qty;
    }
    return total_qty ? double(total_val) / total_qty : 0.0;
}

// Sub-span slicing: process the first N fills without copying.
void process_top_n(std::span<const Order> all, size_t n) {
    auto top = all.first(std::min(n, all.size()));  // zero-copy slice
    double v = vwap_from_span(top);
    (void)v;
}

int main() {
    std::vector<Order> batch = {
        {10050, 100, 'B'}, {10055, 200, 'B'}, {10060, 150, 'B'}
    };
    double v = vwap_from_span(batch);   // no copy, no pointer casts
    process_top_n(batch, 2);
    (void)v;
}`,
    explanation: "std::span provides a bounds-safe, non-owning view over contiguous data, letting batch-processing functions accept any contiguous container without template overloads or raw pointer/size pairs, while still enabling zero-copy sub-range slicing via first()/last()/subspan().",
  },
  {
    id: "cpp-20260725-b1-concept-order",
    language: "cpp",
    title: "C++20 concepts for order-type constraints",
    tag: "cpp20",
    code: `#include <concepts>
#include <cstdint>
#include <iostream>

// Concept: any type with price, qty, and side members.
template<typename T>
concept OrderLike = requires(T o) {
    { o.price } -> std::convertible_to<int64_t>;
    { o.qty   } -> std::convertible_to<int32_t>;
    { o.side  } -> std::convertible_to<char>;
};

struct LimitOrder { int64_t price; int32_t qty; char side; };
struct MarketOrder { int64_t price = 0; int32_t qty; char side; };
struct IcebergOrder { int64_t price; int32_t qty; char side; int32_t display_qty; };

// One function template: no overloads, no virtual dispatch.
template<OrderLike T>
void log_order(const T& o) {
    std::cout << o.side << ' ' << o.qty << " @ " << o.price << "\\n";
}

// Concept can also appear in abbreviated function syntax:
auto notify_fill(OrderLike auto& o, int32_t filled) {
    return o.qty - filled;  // remaining qty
}

int main() {
    log_order(LimitOrder{10050, 100, 'B'});
    log_order(IcebergOrder{10055, 1000, 'S', 100});
}`,
    explanation: "C++20 concepts replace SFINAE-based enable_if constraints with readable, compiler-diagnosed requirements; the requires expression precisely states what member access the template needs, giving cleaner error messages when a non-conforming type is passed.",
  },
  {
    id: "cpp-20260725-b1-spsc-ring",
    language: "cpp",
    title: "SPSC lock-free ring buffer (power-of-2)",
    tag: "concurrency",
    code: `#include <atomic>
#include <array>
#include <optional>
#include <cstdint>

// Single-Producer Single-Consumer queue.
// Power-of-2 capacity: mask replaces modulo in hot path.
// Producer and consumer run on separate cores with no shared write.
template<typename T, size_t N>
struct SPSCRing {
    static_assert((N & (N - 1)) == 0, "N must be a power of 2");
    static constexpr size_t MASK = N - 1;

    alignas(64) std::atomic<size_t> head_{0};   // written by producer
    alignas(64) std::atomic<size_t> tail_{0};   // written by consumer
    alignas(64) std::array<T, N>    buf_;

    // Returns false if full.
    bool push(const T& val) {
        size_t h = head_.load(std::memory_order_relaxed);
        if (h - tail_.load(std::memory_order_acquire) >= N)
            return false;  // full
        buf_[h & MASK] = val;
        head_.store(h + 1, std::memory_order_release);
        return true;
    }

    // Returns nullopt if empty.
    std::optional<T> pop() {
        size_t t = tail_.load(std::memory_order_relaxed);
        if (head_.load(std::memory_order_acquire) == t)
            return std::nullopt;  // empty
        T val = buf_[t & MASK];
        tail_.store(t + 1, std::memory_order_release);
        return val;
    }
};

int main() {
    SPSCRing<int64_t, 1024> ring;
    ring.push(10050);
    auto v = ring.pop();  // v == optional{10050}
    (void)v;
}`,
    explanation: "The SPSC ring buffer achieves lock-free throughput by separating producer and consumer indices onto different cache lines (false-sharing avoidance) and using acquire/release fencing: the producer's release-store of head_ pairs with the consumer's acquire-load to order the slot write before the index update.",
  },
  {
    id: "cpp-20260725-b1-intrusive-list",
    language: "cpp",
    title: "Intrusive doubly-linked list for order book",
    tag: "orderbook",
    code: `#include <cstdint>
#include <cassert>
#include <iostream>

// Intrusive list: list node embedded IN the order struct.
// No extra allocation per insert/remove — pointer manipulation only.
struct OrderNode {
    OrderNode* prev = nullptr;
    OrderNode* next = nullptr;
};

struct Order {
    OrderNode  link;   // must be first — used as sentinel-compatible start
    int64_t    price;
    int32_t    qty;
    uint64_t   order_id;
};

struct PriceLevel {
    OrderNode sentinel{};   // dummy head: sentinel.next = first real order
    int64_t   total_qty = 0;

    void insert_back(Order& o) {
        // Link o before sentinel (i.e., at the back of the queue).
        OrderNode* prev = sentinel.prev ? sentinel.prev : &sentinel;
        // Simple push-back
        if (!sentinel.next) { sentinel.next = &o.link; o.link.prev = nullptr; }
        else {
            OrderNode* tail = sentinel.next;
            while (tail->next) tail = tail->next;
            tail->next   = &o.link;
            o.link.prev  = tail;
        }
        o.link.next = nullptr;
        total_qty  += o.qty;
    }

    void remove(Order& o) {
        if (o.link.prev) o.link.prev->next = o.link.next;
        else              sentinel.next     = o.link.next;
        if (o.link.next) o.link.next->prev = o.link.prev;
        total_qty -= o.qty;
    }

    Order* front() {
        if (!sentinel.next) return nullptr;
        return reinterpret_cast<Order*>(
            reinterpret_cast<char*>(sentinel.next) - offsetof(Order, link));
    }
};`,
    explanation: "An intrusive list embeds the list node inside the order object itself, eliminating the separate heap allocation that std::list incurs per element; insert and remove are pure pointer updates with no memory allocator involvement, critical for the microsecond latency budget of an order book.",
  },
  {
    id: "cpp-20260725-b1-pool-alloc",
    language: "cpp",
    title: "Fixed-size slab pool allocator for order objects",
    tag: "memory",
    code: `#include <cstddef>
#include <array>
#include <cassert>
#include <cstdint>

// Slab pool: pre-allocates a fixed array of T objects.
// alloc() / free() run in O(1) with a free-list threaded through slots.
// No heap contention — all objects live in one contiguous block.
template<typename T, size_t Capacity>
struct SlabPool {
    union Slot {
        alignas(T) std::byte obj[sizeof(T)];
        Slot* next;    // free-list pointer (union avoids waste)
    };

    std::array<Slot, Capacity> slab;
    Slot* free_head = nullptr;
    size_t allocated = 0;

    SlabPool() {
        // Build free list through all slots.
        for (size_t i = 0; i + 1 < Capacity; ++i)
            slab[i].next = &slab[i + 1];
        slab[Capacity - 1].next = nullptr;
        free_head = &slab[0];
    }

    T* alloc() {
        assert(free_head && "pool exhausted");
        Slot* slot = free_head;
        free_head  = slot->next;
        ++allocated;
        return reinterpret_cast<T*>(slot->obj);
    }

    void free(T* ptr) {
        ptr->~T();
        auto* slot  = reinterpret_cast<Slot*>(ptr);
        slot->next  = free_head;
        free_head   = slot;
        --allocated;
    }
};

struct LimitOrder { int64_t price; int32_t qty; char side; };

int main() {
    SlabPool<LimitOrder, 4096> pool;
    auto* o = new (pool.alloc()) LimitOrder{10050, 100, 'B'};
    pool.free(o);
}`,
    explanation: "A slab allocator pre-wires all slots into a free list at construction time, so alloc() and free() are just pointer-swap operations on the list head—no system call, no lock, no fragmentation—making it ideal for order objects that are created and destroyed at high frequency.",
  },
  {
    id: "cpp-20260725-b1-variant-order",
    language: "cpp",
    title: "std::variant for heterogeneous order types",
    tag: "cpp17",
    code: `#include <variant>
#include <string>
#include <cstdint>
#include <iostream>

struct LimitOrder  { int64_t price; int32_t qty; char side; };
struct MarketOrder { int32_t qty;  char side; };
struct StopOrder   { int64_t stop_price; int32_t qty; char side; };

using AnyOrder = std::variant<LimitOrder, MarketOrder, StopOrder>;

// std::visit dispatches to the correct overload at O(1) — no virtual table.
struct OrderPrinter {
    void operator()(const LimitOrder& o) const {
        std::cout << "Limit  " << o.side << ' ' << o.qty << " @ " << o.price << "\\n";
    }
    void operator()(const MarketOrder& o) const {
        std::cout << "Market " << o.side << ' ' << o.qty << "\\n";
    }
    void operator()(const StopOrder& o) const {
        std::cout << "Stop   " << o.side << ' ' << o.qty
                  << " trigger=" << o.stop_price << "\\n";
    }
};

// Extract price safely — StopOrder uses stop_price, MarketOrder has none.
int64_t best_price(const AnyOrder& ao) {
    return std::visit([](auto&& o) -> int64_t {
        if constexpr (requires { o.price; })      return o.price;
        if constexpr (requires { o.stop_price; }) return o.stop_price;
        return 0;
    }, ao);
}

int main() {
    AnyOrder orders[] = {
        LimitOrder{10050, 100, 'B'},
        MarketOrder{50, 'S'},
        StopOrder{9900, 200, 'S'},
    };
    for (auto& ao : orders)
        std::visit(OrderPrinter{}, ao);
}`,
    explanation: "std::variant stores exactly one alternative in a discriminated union and dispatches via std::visit in constant time without virtual dispatch; the if constexpr trick in the visitor lets you query optional members at compile time, making it cleaner than a type-erased base class hierarchy.",
  },
  {
    id: "cpp-20260725-b1-bit-cast",
    language: "cpp",
    title: "std::bit_cast for type-punning IEEE 754 bits",
    tag: "low-latency",
    code: `#include <bit>
#include <cstdint>
#include <cstdio>

// Before C++20, type-punning via union or memcpy was required.
// std::bit_cast is well-defined and constexpr — the compiler may eliminate it.
constexpr uint64_t float_bits(double d) {
    return std::bit_cast<uint64_t>(d);
}
constexpr double bits_to_float(uint64_t u) {
    return std::bit_cast<double>(u);
}

// Fast approximate log2 for fixed-point pricing:
// The biased exponent lives in bits [62:52] — no FP instruction needed.
constexpr int ilog2_double(double d) {
    uint64_t bits = std::bit_cast<uint64_t>(d);
    return int((bits >> 52) & 0x7FF) - 1023;
}

// Extract the sign bit directly — faster than std::signbit on some compilers.
constexpr bool is_negative(double d) {
    return (std::bit_cast<uint64_t>(d) >> 63) != 0;
}

int main() {
    printf("float_bits(1.0)    = %016llX\\n",
           (unsigned long long)float_bits(1.0));   // 3FF0000000000000
    printf("ilog2(1024.0)      = %d\\n", ilog2_double(1024.0));  // 10
    printf("is_negative(-0.01) = %d\\n", (int)is_negative(-0.01)); // 1
}`,
    explanation: "std::bit_cast reinterprets the raw bytes of a value as a different type without undefined behavior; inspecting the IEEE 754 bit pattern of a double directly avoids round-tripping through the FPU and enables constexpr computations on floating-point representations.",
  },
  {
    id: "cpp-20260725-b1-black76",
    language: "cpp",
    title: "Black-76 model for futures and cap/floor pricing",
    tag: "derivatives",
    code: `#include <cmath>
#include <iostream>

// Black-76 prices options on a futures price F rather than spot S.
// No cost-of-carry adjustment needed — futures forward price is the underlying.
// C = e^{-rT}[F N(d1) - K N(d2)]
// P = e^{-rT}[K N(-d2) - F N(-d1)]
static double Ncdf(double x) {
    return 0.5 * std::erfc(-x * M_SQRT1_2);
}

struct Black76 {
    double F;      // futures price
    double K;      // strike
    double r;      // risk-free rate (for discounting only)
    double sigma;  // implied vol of the futures
    double T;      // time to expiry (years)

    double d1() const { return (std::log(F/K) + 0.5*sigma*sigma*T) / (sigma*std::sqrt(T)); }
    double d2() const { return d1() - sigma * std::sqrt(T); }

    double call() const {
        return std::exp(-r*T) * (F * Ncdf(d1()) - K * Ncdf(d2()));
    }
    double put() const {
        return std::exp(-r*T) * (K * Ncdf(-d2()) - F * Ncdf(-d1()));
    }
    // Caplet: call option on LIBOR / SOFR rate with notional and day-count
    double caplet(double notional, double dcf) const {
        return notional * dcf * call();
    }
};

int main() {
    Black76 b{100.0, 100.0, 0.05, 0.20, 1.0};
    std::cout << "Call: " << b.call() << "  Put: " << b.put() << "\\n";
    // Put-call parity: C - P = e^{-rT}(F - K)
    double parity = std::exp(-b.r*b.T) * (b.F - b.K);
    std::cout << "C-P=" << (b.call()-b.put()) << "  e^{-rT}(F-K)=" << parity << "\\n";
}`,
    explanation: "Black-76 replaces the spot price with the futures price and drops the cost-of-carry term, making it the natural framework for interest-rate caps and floors (where the underlying is a forward rate) and exchange-traded commodity options (where futures are more liquid than spot).",
  },
  {
    id: "cpp-20260725-b1-lookback-mc",
    language: "cpp",
    title: "Floating-strike lookback option Monte Carlo",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <algorithm>
#include <iostream>

// Floating-strike lookback call: pays S_T - min(S) over [0,T].
// The holder always buys at the historical low — the premium is high.
double lookback_call_mc(double S0, double r, double sigma, double T,
                        int steps, int paths) {
    double dt   = T / steps;
    double sqdt = std::sqrt(dt);
    double drift = (r - 0.5 * sigma * sigma) * dt;

    std::mt19937_64 rng(42);
    std::normal_distribution<double> N01;

    double sum = 0.0;
    for (int p = 0; p < paths; ++p) {
        double S   = S0;
        double Smin = S0;    // track running minimum
        for (int i = 0; i < steps; ++i) {
            S   *= std::exp(drift + sigma * sqdt * N01(rng));
            Smin = std::min(Smin, S);
        }
        // Payoff: buy at the low, receive the terminal price
        sum += std::max(S - Smin, 0.0);
    }
    return std::exp(-r * T) * sum / paths;
}

// Conze-Viswanathan closed-form (ATM approximation) for comparison
double lookback_call_cf(double S, double r, double sigma, double T) {
    auto N = [](double x){ return 0.5 * std::erfc(-x * M_SQRT1_2); };
    double d = (r + 0.5*sigma*sigma) * std::sqrt(T) / sigma;
    return S * (2.0 * N(d) + sigma*std::sqrt(T) * (1.0/(r/sigma) + 1.0));
}

int main() {
    double mc  = lookback_call_mc(100, 0.05, 0.20, 1.0, 252, 100000);
    std::cout << "Lookback MC price: " << mc << "\\n";
}`,
    explanation: "The floating-strike lookback call grants the right to buy at the cheapest price observed over the option's life, so its payoff depends on the path minimum; the premium is typically 2–3× that of an ATM vanilla because it always provides positive value equal to the maximum drawdown from the low.",
  },
  {
    id: "cpp-20260725-b1-asian-geom",
    language: "cpp",
    title: "Geometric Asian option closed-form + arithmetic MC",
    tag: "derivatives",
    code: `#include <cmath>
#include <random>
#include <iostream>

// Geometric Asian call: closed-form exists because the geometric average
// of lognormals is lognormal. Acts as a control variate for the arithmetic case.
double geom_asian_call(double S, double K, double r, double sigma, double T, int n) {
    // Adjusted parameters for geometric average
    double sigma_g = sigma * std::sqrt((2.0*n + 1.0) / (6.0*(n + 1.0)));
    double r_g     = 0.5 * (r - 0.5*sigma*sigma) + 0.5*sigma_g*sigma_g;
    double d1 = (std::log(S / K) + (r_g + 0.5*sigma_g*sigma_g) * T) / (sigma_g * std::sqrt(T));
    double d2 = d1 - sigma_g * std::sqrt(T);
    auto   N  = [](double x){ return 0.5 * std::erfc(-x * M_SQRT1_2); };
    return std::exp(-r * T) * (S * std::exp(r_g * T) * N(d1) - K * N(d2));
}

// Arithmetic Asian call via MC with geometric as control variate
double arith_asian_call_cv(double S, double K, double r, double sigma, double T,
                           int n, int paths) {
    double dt   = T / n;
    double sqdt = std::sqrt(dt);
    double exact_geom = geom_asian_call(S, K, r, sigma, T, n);

    std::mt19937_64 rng(42);
    std::normal_distribution<double> N01;

    double sum_arith = 0, sum_geom = 0, sum_cov = 0;
    for (int p = 0; p < paths; ++p) {
        double St = S, logprod = 0, pathsum = 0;
        for (int i = 0; i < n; ++i) {
            St  *= std::exp((r - 0.5*sigma*sigma)*dt + sigma*sqdt*N01(rng));
            pathsum += St;
            logprod += std::log(St);
        }
        double arith = std::max(pathsum / n - K, 0.0);
        double geom  = std::max(std::exp(logprod / n) - K, 0.0);
        sum_arith += arith;  sum_geom += geom;
        sum_cov   += arith * geom;
    }
    double mu_arith = sum_arith / paths, mu_geom = sum_geom / paths;
    double b = (sum_cov/paths - mu_arith*mu_geom) / (sum_geom/paths);
    return std::exp(-r*T) * (mu_arith - b*(mu_geom - exact_geom));
}

int main() {
    std::cout << "Arith Asian: " << arith_asian_call_cv(100,100,0.05,0.20,1.0,12,50000) << "\\n";
    std::cout << "Geom  Asian: " << geom_asian_call(100,100,0.05,0.20,1.0,12)           << "\\n";
}`,
    explanation: "The geometric Asian option has a closed-form price because the geometric average of correlated lognormal samples is lognormal; using this exact value as a control variate for the arithmetic Monte Carlo exploits their high correlation to reduce variance by 95%+ at no extra computation cost.",
  },
  {
    id: "cpp-20260725-b1-dupire-local-vol",
    language: "cpp",
    title: "Dupire local volatility from call price grid",
    tag: "derivatives",
    code: `#include <vector>
#include <cmath>
#include <functional>
#include <iostream>

// Dupire (1994) formula for local vol from a smooth call price surface C(K,T):
//
//  σ_loc²(K,T) = (∂C/∂T + r·K·∂C/∂K) / (½·K²·∂²C/∂K²)
//
// ∂C/∂T  → calendar spread / dT
// ∂C/∂K  → call spread / dK   (= -N(d2) under BS)
// ∂²C/∂K² → butterfly / dK²   (always > 0 — arbitrage condition)

double dupire_local_vol(
    std::function<double(double K, double T)> C,   // smooth call price surface
    double K, double T, double r,
    double dK = 0.5, double dT = 1.0 / 252) {

    double C0  = C(K,    T       );
    double CdT = C(K,    T + dT  );   // perturb time
    double CKp = C(K + dK, T    );
    double CKm = C(K - dK, T    );

    double dC_dT  = (CdT - C0)  / dT;
    double dC_dK  = (CKp - CKm) / (2 * dK);          // central difference
    double d2C_dK2= (CKp - 2*C0 + CKm) / (dK * dK);  // butterfly

    double numerator   = dC_dT + r * K * dC_dK;
    double denominator = 0.5 * K * K * d2C_dK2;

    if (denominator <= 0) return -1.0;  // calendar or butterfly arb violation
    return std::sqrt(std::max(numerator / denominator, 0.0));
}

int main() {
    // Toy BS surface: C(K,T) computed analytically for testing
    auto bs_call = [](double K, double T) -> double {
        double S=100, r=0.05, sig=0.20;
        double d1=(std::log(S/K)+(r+0.5*sig*sig)*T)/(sig*std::sqrt(T));
        double d2=d1-sig*std::sqrt(T);
        auto N=[](double x){return 0.5*std::erfc(-x*M_SQRT1_2);};
        return S*N(d1)-K*std::exp(-r*T)*N(d2);
    };
    double lv = dupire_local_vol(bs_call, 100.0, 1.0, 0.05);
    std::cout << "Local vol at K=100 T=1: " << lv << "\\n";  // ≈ 0.20
}`,
    explanation: "Dupire's equation extracts the unique local volatility surface consistent with all market call prices; the denominator is the (risk-neutral) probability density of the terminal stock price (by Breeden-Litzenberger), which must be positive for an arbitrage-free surface.",
  },
  {
    id: "cpp-20260725-b1-dv01",
    language: "cpp",
    title: "DV01, modified duration, and convexity for a bond",
    tag: "rates",
    code: `#include <cmath>
#include <vector>
#include <iostream>

// Price a fixed coupon bond: P = Σ c/(1+y)^t + F/(1+y)^T
// y = yield to maturity (annual, coupon frequency assumed annual here)
double bond_price(double coupon_rate, double face, double ytm,
                  int periods) {
    double c = coupon_rate * face;
    double P = 0.0;
    for (int t = 1; t <= periods; ++t)
        P += c / std::pow(1.0 + ytm, t);
    P += face / std::pow(1.0 + ytm, periods);
    return P;
}

// DV01: dollar value of a 1 basis point move in yield
double dv01(double coupon, double face, double ytm, int periods) {
    double P_up   = bond_price(coupon, face, ytm + 0.0001, periods);
    double P_down = bond_price(coupon, face, ytm - 0.0001, periods);
    return (P_down - P_up) / 2.0;   // positive: price up when yield down
}

// Modified duration: -dP/dy / P
double mod_duration(double coupon, double face, double ytm, int periods) {
    return dv01(coupon, face, ytm, periods)
           / bond_price(coupon, face, ytm, periods) * 10000;
}

// Convexity: d²P/dy² / P — second-order correction to duration
double convexity(double coupon, double face, double ytm, int periods) {
    double P      = bond_price(coupon, face, ytm, periods);
    double P_up   = bond_price(coupon, face, ytm + 0.01, periods);
    double P_down = bond_price(coupon, face, ytm - 0.01, periods);
    return (P_up + P_down - 2.0*P) / (P * 0.01 * 0.01);
}

int main() {
    // 5% 10-year bond at 5% yield → priced at par
    std::cout << "Price:     " << bond_price(0.05, 100.0, 0.05, 10) << "\\n";
    std::cout << "DV01:      " << dv01(0.05, 100.0, 0.05, 10)       << "\\n";
    std::cout << "Mod. dur:  " << mod_duration(0.05, 100.0, 0.05, 10) << "\\n";
    std::cout << "Convexity: " << convexity(0.05, 100.0, 0.05, 10)  << "\\n";
}`,
    explanation: "DV01 quantifies the dollar sensitivity of a bond to a one basis-point yield change and is the core hedging unit in fixed-income trading; convexity, the second derivative, explains why long-maturity bonds outperform their duration prediction in large parallel moves of the yield curve.",
  },
  {
    id: "cpp-20260725-b1-ois-npv",
    language: "cpp",
    title: "OIS (SOFR) swap NPV from discount factors",
    tag: "rates",
    code: `#include <vector>
#include <cmath>
#include <iostream>
#include <numeric>

// Overnight Index Swap: fixed leg pays K each period; floating leg pays
// compounded overnight rate (≈ OIS forward rate per period).
// Under single-curve SOFR discounting both legs use the same curve.

struct OISCurve {
    std::vector<double> tenors;   // in years: {0.25, 0.5, 1.0, 2.0, 5.0, ...}
    std::vector<double> discount; // P(0,T) = exp(-r*T) from calibrated curve

    double df(double T) const {
        // Linear interpolation of log-discount factors (exact for flat curves)
        for (size_t i = 1; i < tenors.size(); ++i) {
            if (T <= tenors[i]) {
                double w = (T - tenors[i-1]) / (tenors[i] - tenors[i-1]);
                double ld = (1-w)*std::log(discount[i-1]) + w*std::log(discount[i]);
                return std::exp(ld);
            }
        }
        return discount.back();  // extrapolate flat
    }
};

// NPV from receiver perspective: receive fixed K, pay floating.
double ois_swap_npv(const OISCurve& curve,
                    const std::vector<double>& pay_dates,  // fixed-leg payment dates
                    double K,          // fixed rate
                    double notional) {
    // Annuity factor A = Σ dcf_i * P(0,T_i)
    double annuity = 0.0;
    for (size_t i = 0; i < pay_dates.size(); ++i) {
        double dcf = (i == 0) ? pay_dates[0]
                               : pay_dates[i] - pay_dates[i-1];
        annuity += dcf * curve.df(pay_dates[i]);
    }
    // Fixed leg PV = K × A × N
    double fixed_pv = K * annuity * notional;
    // Floating leg PV ≈ N × (1 - P(0,T_last))  [for standard OIS]
    double float_pv = notional * (1.0 - curve.df(pay_dates.back()));
    return fixed_pv - float_pv;   // receive fixed, pay floating
}

int main() {
    OISCurve c{{0.0, 0.5, 1.0, 2.0, 5.0},
               {1.0, 0.975, 0.952, 0.907, 0.779}};
    std::vector<double> dates = {0.5, 1.0, 1.5, 2.0};
    double npv = ois_swap_npv(c, dates, 0.0475, 1'000'000);
    std::cout << "OIS swap NPV: " << npv << "\\n";
}`,
    explanation: "Under single-curve OIS discounting, the floating leg of an OIS swap prices to par at inception (its PV equals N×(1 − P(0,T))), so the swap NPV measures only whether the agreed fixed rate K differs from the at-market swap rate; this replaced multi-curve LIBOR pricing after the 2008 basis crisis.",
  },
  {
    id: "cpp-20260725-b1-vwap-exec",
    language: "cpp",
    title: "VWAP execution schedule with volume profile",
    tag: "execution",
    code: `#include <vector>
#include <numeric>
#include <cstdint>
#include <iostream>
#include <algorithm>

// VWAP execution: distribute total shares proportional to expected
// intraday volume at each interval so the average fill tracks VWAP.
struct VolumeProfile {
    std::vector<double> bucket_vol;   // expected volume per bucket (%)

    std::vector<int64_t> schedule(int64_t total_shares) const {
        double vol_sum = std::accumulate(bucket_vol.begin(), bucket_vol.end(), 0.0);
        std::vector<int64_t> shares(bucket_vol.size());
        int64_t allocated = 0;
        for (size_t i = 0; i + 1 < bucket_vol.size(); ++i) {
            shares[i] = static_cast<int64_t>(
                (bucket_vol[i] / vol_sum) * total_shares + 0.5);
            allocated += shares[i];
        }
        shares.back() = total_shares - allocated;  // assign remainder to last bucket
        return shares;
    }

    // Participation rate: what fraction of each bucket's volume we're targeting
    std::vector<double> participation(int64_t total_shares,
                                      const std::vector<int64_t>& market_vol) const {
        auto sched = schedule(total_shares);
        std::vector<double> part(sched.size());
        for (size_t i = 0; i < sched.size(); ++i)
            part[i] = double(sched[i]) / market_vol[i];
        return part;
    }
};

int main() {
    // U-shaped intraday profile: high open/close, low midday
    VolumeProfile vp{{ 0.15, 0.08, 0.07, 0.08, 0.07, 0.08, 0.09, 0.15, 0.23 }};
    auto sched = vp.schedule(100'000);
    int64_t total = 0;
    for (size_t i = 0; i < sched.size(); ++i) {
        std::cout << "Bucket " << i << ": " << sched[i] << " shares\\n";
        total += sched[i];
    }
    std::cout << "Total: " << total << "\\n";
}`,
    explanation: "A VWAP schedule slices the order proportionally to the expected intraday volume profile (typically U-shaped — high at open and close), ensuring the average fill tracks the day's VWAP benchmark; any deviation from the schedule becomes a VWAP tracking error attributable to timing or impact.",
  },
  {
    id: "cpp-20260725-b1-cpu-affinity",
    language: "cpp",
    title: "CPU affinity pinning for a trading thread",
    tag: "low-latency",
    code: `#include <pthread.h>
#include <sched.h>
#include <thread>
#include <cstdio>
#include <cerrno>
#include <cstring>

// Pin the calling thread to a specific CPU core.
// Reduces context switch overhead and improves L1/L2 cache locality.
bool pin_to_cpu(int cpu_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(cpu_id, &cpuset);
    int rc = pthread_setaffinity_np(
        pthread_self(), sizeof(cpuset), &cpuset);
    if (rc != 0) {
        fprintf(stderr, "affinity failed: %s\\n", strerror(rc));
        return false;
    }
    return true;
}

// Set real-time scheduling priority: avoids OS preemption during tick processing.
bool set_realtime(int priority = 80) {
    sched_param sp{ priority };
    int rc = pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp);
    if (rc != 0) {
        fprintf(stderr, "setschedparam: %s (need CAP_SYS_NICE)\\n", strerror(rc));
        return false;
    }
    return true;
}

// Feed thread: pin to core 3 and set RT priority.
void feed_thread_fn() {
    pin_to_cpu(3);        // dedicate core 3 to this thread
    set_realtime(80);     // SCHED_FIFO priority 80
    // ... hot loop reading market data ...
    printf("Feed thread running on isolated core\\n");
}

int main() {
    std::thread t(feed_thread_fn);
    t.join();
}`,
    explanation: "Pinning a feed handler to an isolated CPU core eliminates cache thrash from the OS scheduler migrating the thread between cores, and SCHED_FIFO prevents lower-priority processes from preempting the hot loop—together these can reduce 99th-percentile message processing latency by an order of magnitude.",
  },
  {
    id: "cpp-20260725-b1-coroutine-gen",
    language: "cpp",
    title: "C++20 coroutine generator for tick replay",
    tag: "cpp20",
    code: `#include <coroutine>
#include <optional>
#include <cstdint>
#include <vector>

// Minimal generator coroutine: co_yield one value at a time.
// Suspends after each yield; resumed by the caller via next().
template<typename T>
struct Generator {
    struct promise_type {
        std::optional<T> value;
        Generator         get_return_object() { return {std::coroutine_handle<promise_type>::from_promise(*this)}; }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v) { value = v; return {}; }
        void                return_void()    {}
        void                unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> coro;
    explicit Generator(std::coroutine_handle<promise_type> h) : coro(h) {}
    ~Generator() { if (coro) coro.destroy(); }

    std::optional<T> next() {
        if (!coro || coro.done()) return std::nullopt;
        coro.resume();
        if (coro.done()) return std::nullopt;
        return coro.promise().value;
    }
};

struct Tick { int64_t price; int32_t qty; };

// Coroutine: lazily yields ticks from a captured vector.
Generator<Tick> replay(std::vector<Tick> ticks) {
    for (auto& t : ticks)
        co_yield t;   // suspends here; resumes on next call to next()
}

int main() {
    auto gen = replay({{10050, 100}, {10055, 200}, {10060, 50}});
    while (auto tick = gen.next())
        ; // process tick->price, tick->qty
}`,
    explanation: "C++20 coroutines make a lazy generator straightforward: co_yield suspends execution and hands a value to the caller, then resumes from exactly that point on the next call, letting a tick-replay function drive a strategy loop without materialising all ticks in memory at once.",
  },
  {
    id: "cpp-20260725-b1-barrier-ph2",
    language: "cpp",
    title: "std::barrier for two-phase parallel risk calculation",
    tag: "concurrency",
    code: `#include <barrier>
#include <thread>
#include <vector>
#include <numeric>
#include <cstdio>

// Two-phase fan-out / fan-in:
// Phase 1: each worker computes its book's Greeks in parallel.
// Phase 2 (completion callback): aggregate totals, then all resume.
struct RiskResult { double delta; double gamma; double pnl; };

void parallel_risk(int n_books) {
    std::vector<RiskResult> results(n_books);
    double total_delta = 0.0, total_gamma = 0.0;

    // Completion callback runs once when all threads arrive at the barrier.
    auto aggregate = [&]() noexcept {
        total_delta = total_gamma = 0.0;
        for (auto& r : results) { total_delta += r.delta; total_gamma += r.gamma; }
        printf("Phase 2 aggregate: Δ=%.2f Γ=%.2f\\n", total_delta, total_gamma);
    };

    std::barrier sync(n_books, aggregate);

    std::vector<std::jthread> workers;
    for (int i = 0; i < n_books; ++i) {
        workers.emplace_back([&, i] {
            // Phase 1: compute book-level Greeks
            results[i] = {(i+1)*0.1, (i+1)*0.01, (i+1)*1000.0};

            sync.arrive_and_wait();  // all threads wait; aggregate() fires once

            // Phase 2: each thread can now safely read total_delta / total_gamma
            (void)total_delta;
        });
    }
}

int main() { parallel_risk(8); }`,
    explanation: "std::barrier (C++20) combines a reusable countdown latch with a completion callback that fires exactly once when all N threads arrive, making it ideal for a multi-book risk pipeline where phases must be globally synchronized without a central coordinator thread.",
  },
  {
    id: "cpp-20260725-b1-custom-hash-book",
    language: "cpp",
    title: "unordered_map order book with FNV-1a price hash",
    tag: "orderbook",
    code: `#include <unordered_map>
#include <cstdint>
#include <cstdio>

// FNV-1a on int64 price key — faster than std::hash<int64_t> on GCC/Clang
// because it avoids the identity hash that causes clustering on sequential keys.
struct PriceHash {
    size_t operator()(int64_t price) const noexcept {
        // FNV-1a 64-bit offset basis
        uint64_t h = 14695981039346656037ULL;
        uint64_t v = static_cast<uint64_t>(price);
        for (int i = 0; i < 8; ++i) {
            h ^= (v & 0xFF);
            h *= 1099511628211ULL;
            v >>= 8;
        }
        return h;
    }
};

struct PriceLevel { int64_t total_qty; int32_t order_count; };

// O(1) average insert/lookup — better than std::map's O(log n).
using PriceBook = std::unordered_map<int64_t, PriceLevel, PriceHash>;

void add_order(PriceBook& book, int64_t price, int64_t qty) {
    auto& lvl = book[price];   // default-constructs on first insert
    lvl.total_qty   += qty;
    lvl.order_count += 1;
}

int main() {
    PriceBook bids, asks;
    add_order(bids, 10050, 100);
    add_order(bids, 10050, 200);
    add_order(asks, 10055,  50);

    for (auto& [px, lvl] : bids)
        printf("bid %lld  qty=%lld  orders=%d\\n",
               (long long)px, (long long)lvl.total_qty, lvl.order_count);
}`,
    explanation: "Sequential price ticks (10050, 10051, ...) cluster in std::hash's identity implementation, degrading unordered_map to linear probing chains; FNV-1a scrambles the bits so adjacent prices land in different buckets, keeping average lookup time close to O(1) even under heavy sequential feed.",
  },
  {
    id: "cpp-20260725-b1-simd-payoff",
    language: "cpp",
    title: "AVX2 SIMD payoff computation for call options",
    tag: "low-latency",
    code: `#include <immintrin.h>   // AVX2
#include <vector>
#include <cmath>
#include <cstdio>
#include <algorithm>

// Compute call payoffs max(S - K, 0) for a batch of terminal prices
// using AVX2: 4 doubles per 256-bit register, 8 lanes if using float.
// Using double for accuracy here.
void call_payoffs_avx2(const double* S, double K, double* out, int n) {
    __m256d vK    = _mm256_set1_pd(K);
    __m256d vzero = _mm256_setzero_pd();

    int i = 0;
    for (; i + 4 <= n; i += 4) {
        __m256d vS   = _mm256_loadu_pd(S + i);         // load 4 doubles
        __m256d diff = _mm256_sub_pd(vS, vK);          // S - K
        __m256d pay  = _mm256_max_pd(diff, vzero);      // max(S-K, 0)
        _mm256_storeu_pd(out + i, pay);                 // store 4 results
    }
    for (; i < n; ++i)                                  // scalar tail
        out[i] = std::max(S[i] - K, 0.0);
}

int main() {
    const int N = 1'000'000;
    std::vector<double> S(N), payoffs(N);
    for (int i = 0; i < N; ++i) S[i] = 100.0 + (i % 40 - 20);  // 80..120
    call_payoffs_avx2(S.data(), 105.0, payoffs.data(), N);

    int itm = 0;
    for (double p : payoffs) if (p > 0) ++itm;
    printf("In-the-money paths: %d/%d\\n", itm, N);
}`,
    explanation: "AVX2 processes four double-precision payoffs simultaneously in a single CPU cycle using SIMD instructions; for a Monte Carlo pricer with millions of paths the SIMD payoff loop runs at 4× the throughput of scalar code with identical numerical results.",
  },
  {
    id: "cpp-20260725-b1-constexpr-binom",
    language: "cpp",
    title: "constexpr binomial option pricing (CRR model)",
    tag: "derivatives",
    code: `#include <cmath>
#include <array>
#include <algorithm>
#include <cstdio>

// Cox-Ross-Rubinstein binomial tree, fully evaluated at compile time
// when all inputs are constexpr.
template<int N>
constexpr double crr_call(double S, double K, double r, double sigma, double T) {
    double dt    = T / N;
    double u     = std::exp(sigma * std::sqrt(dt));
    double d     = 1.0 / u;
    double p     = (std::exp(r * dt) - d) / (u - d);   // risk-neutral prob
    double disc  = std::exp(-r * dt);

    // Terminal payoffs at time N
    std::array<double, N + 1> V{};
    for (int j = 0; j <= N; ++j) {
        double ST = S * std::pow(u, N - 2*j);  // j down-moves
        V[j] = std::max(ST - K, 0.0);
    }
    // Backward induction
    for (int i = N - 1; i >= 0; --i) {
        for (int j = 0; j <= i; ++j) {
            V[j] = disc * (p * V[j] + (1.0 - p) * V[j + 1]);
            // Early exercise (American put): uncomment and swap max for put
            // V[j] = std::max(V[j], K - S * std::pow(u, i - 2*j));
        }
    }
    return V[0];
}

int main() {
    // Compile-time pricing with 200-step tree
    constexpr double price = crr_call<200>(100.0, 100.0, 0.05, 0.20, 1.0);
    printf("CRR call (N=200): %.6f\\n", price);  // ≈ 10.4506 (BS = 10.4506)
}`,
    explanation: "A constexpr CRR binomial tree can be fully evaluated at compile time when all inputs are known constants, generating no runtime code at all; even at runtime, inlining a fixed-N template eliminates pointer arithmetic overhead and allows the compiler to auto-vectorise the backward induction loop.",
  },
  {
    id: "cpp-20260725-b1-stop-loss-fsm",
    language: "cpp",
    title: "Trailing stop-loss as a finite state machine",
    tag: "execution",
    code: `#include <cstdint>
#include <algorithm>
#include <cstdio>

// Three states: FLAT (no position), LONG (position open), STOPPED (exit triggered).
// Trailing stop rises with peak price but never falls.
enum class PosState { FLAT, LONG, STOPPED };

struct TrailingStop {
    double     peak_price;
    double     stop_pct;      // trail distance as fraction (e.g. 0.02 = 2%)
    PosState   state = PosState::FLAT;
    double     entry_price;

    void on_tick(double price) {
        switch (state) {
        case PosState::FLAT:
            // Simple entry: open long on first tick (in practice: signal-driven)
            entry_price = price;
            peak_price  = price;
            state = PosState::LONG;
            printf("Entry  @ %.2f\\n", price);
            break;

        case PosState::LONG:
            // Raise peak but never lower it
            peak_price = std::max(peak_price, price);
            {
                double stop_level = peak_price * (1.0 - stop_pct);
                if (price <= stop_level) {
                    printf("STOP   @ %.2f  (peak=%.2f stop=%.2f  pnl=%.2f)\\n",
                           price, peak_price, stop_level, price - entry_price);
                    state = PosState::STOPPED;
                }
            }
            break;

        case PosState::STOPPED:
            // Terminal absorbing state — reset externally to re-enter
            break;
        }
    }
};

int main() {
    TrailingStop ts{0, 0.02};
    for (double p : {100.0, 103.0, 107.0, 109.0, 106.5, 105.0})
        ts.on_tick(p);
}`,
    explanation: "Encoding a trailing stop as an FSM makes state transitions explicit and testable: the peak price ratchets upward only in the LONG state, the stop triggers an irreversible transition to STOPPED, and adding new states (e.g. SCALING_OUT) requires only new enum values and transition rules.",
  },
  {
    id: "cpp-20260725-b1-clz-round",
    language: "cpp",
    title: "__builtin_clz for next-power-of-2 ring buffer sizing",
    tag: "low-latency",
    code: `#include <cstdint>
#include <cassert>
#include <cstdio>

// Round up to the next power of 2 using count-leading-zeros.
// Required for SPSC ring buffer where capacity must be a power of 2
// so that (index & mask) replaces (index % capacity).
constexpr uint32_t next_pow2_32(uint32_t n) {
    if (n == 0) return 1;
    // __builtin_clz is undefined for 0; handled above.
    // Subtract 1 first so exact powers of 2 are not doubled.
    n -= 1;
    return (n == 0) ? 1u : 1u << (32 - __builtin_clz(n));
}

constexpr uint64_t next_pow2_64(uint64_t n) {
    if (n <= 1) return 1;
    n -= 1;
    return 1ULL << (64 - __builtin_clzll(n));
}

// Verify at compile time
static_assert(next_pow2_32(1)   == 1);
static_assert(next_pow2_32(2)   == 2);
static_assert(next_pow2_32(3)   == 4);
static_assert(next_pow2_32(100) == 128);
static_assert(next_pow2_32(128) == 128);

int main() {
    for (uint32_t n : {1u, 2u, 3u, 5u, 100u, 1023u, 1024u, 1025u})
        printf("next_pow2(%4u) = %u\\n", n, next_pow2_32(n));
}`,
    explanation: "__builtin_clz (count leading zeros) is a single BSR/LZCNT instruction on x86; rounding capacity up to the next power of 2 converts the expensive modulo operation in the ring buffer hot path to a bitwise AND, saving 4–10 ns per message at GHz clock rates.",
  },
  {
    id: "cpp-20260725-b1-huge-pages",
    language: "cpp",
    title: "mmap huge pages for order-book memory region",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstring>

// 2 MB huge pages: one huge page covers 512 normal 4 KB pages.
// For a 200-level order book, this eliminates TLB misses from the 512 entries
// needed to cover the same memory with standard pages.
constexpr size_t HUGE_PAGE   = 2UL * 1024 * 1024;   // 2 MB
constexpr size_t BOOK_BYTES  = 4 * HUGE_PAGE;        // 8 MB for the whole book

struct alignas(64) PriceLevel { int64_t price; int64_t qty; uint32_t orders; };

PriceLevel* alloc_huge_book(size_t n_levels) {
    size_t sz = ((n_levels * sizeof(PriceLevel) + HUGE_PAGE - 1)
                 / HUGE_PAGE) * HUGE_PAGE;           // round up to 2 MB boundary

    // MAP_HUGETLB requests 2 MB huge pages from the OS huge-page pool.
    // Requires /proc/sys/vm/nr_hugepages > 0 (or transparent huge pages).
    void* p = mmap(nullptr, sz,
                   PROT_READ | PROT_WRITE,
                   MAP_ANONYMOUS | MAP_PRIVATE | MAP_HUGETLB,
                   -1, 0);

    if (p == MAP_FAILED) {
        // Fallback: OS may still promote to huge pages via THP
        p = mmap(nullptr, sz, PROT_READ | PROT_WRITE,
                 MAP_ANONYMOUS | MAP_PRIVATE, -1, 0);
        madvise(p, sz, MADV_HUGEPAGE);  // hint THP promotion
        printf("Fallback: requesting THP promotion\\n");
    }
    memset(p, 0, sz);
    return static_cast<PriceLevel*>(p);
}`,
    explanation: "A 2 MB huge page reduces TLB pressure by replacing 512 standard-page TLB entries with a single entry; for an order book whose hot path touches hundreds of price levels in nanoseconds, TLB misses are a measurable latency contributor that huge pages eliminate entirely.",
  },
  {
    id: "cpp-20260725-b1-aligned-alloc",
    language: "cpp",
    title: "std::aligned_alloc for cache-line-aligned SIMD arrays",
    tag: "low-latency",
    code: `#include <cstdlib>
#include <cstdint>
#include <new>
#include <cstring>
#include <cstdio>
#include <immintrin.h>

// AVX2 loadu/storeu work on unaligned addresses but incur a penalty
// when crossing a 32-byte boundary. aligned_alloc guarantees 32-byte (or 64-byte)
// alignment so all loads are naturally aligned.

constexpr size_t CACHE_LINE = 64;
constexpr size_t AVX_ALIGN  = 32;

double* alloc_price_array(size_t n) {
    // Aligned allocation: address % alignment == 0 guaranteed.
    // size must be a multiple of alignment.
    size_t aligned_n = (n + 3) & ~size_t(3);  // round up to multiple of 4
    void* p = std::aligned_alloc(AVX_ALIGN, aligned_n * sizeof(double));
    if (!p) throw std::bad_alloc{};
    std::memset(p, 0, aligned_n * sizeof(double));
    return static_cast<double*>(p);
}

// C++17 new with alignment: operator new(size, align_val_t)
struct alignas(CACHE_LINE) AlignedBook {
    double bids[512];
    double asks[512];
};

int main() {
    double* prices = alloc_price_array(1'000'000);
    // AVX2 aligned load — no alignment fault, no cross-boundary penalty
    __m256d v = _mm256_load_pd(prices);
    (void)v;
    std::free(prices);

    // Placement: entire book on one cache line boundary
    auto* book = new AlignedBook{};
    printf("book alignment: %zu\\n", alignof(AlignedBook));
    delete book;
}`,
    explanation: "std::aligned_alloc guarantees the returned pointer is aligned to the specified boundary, enabling AVX2 aligned-load instructions (_mm256_load_pd) which avoid the 1–3 cycle penalty for crossing 32-byte boundaries and, on Haswell+, execute at full memory bandwidth.",
  },
  {
    id: "cpp-20260725-b1-optional-fill",
    language: "cpp",
    title: "std::optional for nullable order fill result",
    tag: "cpp17",
    code: `#include <optional>
#include <cstdint>
#include <cstdio>

struct Fill {
    int64_t fill_price;
    int32_t fill_qty;
    uint64_t exec_id;
};

// Returns nullopt when the order cannot be matched (e.g. no liquidity at limit).
std::optional<Fill> try_match(int64_t order_price, int32_t order_qty,
                              int64_t best_ask, int64_t ask_qty) {
    if (order_price < best_ask)          // limit order not marketable
        return std::nullopt;
    if (ask_qty <= 0)                    // no size at ask
        return std::nullopt;

    int32_t filled = std::min(order_qty, static_cast<int32_t>(ask_qty));
    return Fill{ best_ask, filled, /*exec_id=*/12345 };
}

// Monadic operations (C++23):
// auto qty = try_match(...).transform([](const Fill& f){ return f.fill_qty; });

int main() {
    auto result = try_match(10050, 100, 10050, 200);
    if (result) {
        printf("Filled %d @ %lld  exec=%llu\\n",
               result->fill_qty,
               (long long)result->fill_price,
               (unsigned long long)result->exec_id);
    } else {
        printf("No fill — order resting\\n");
    }

    auto no_fill = try_match(10040, 100, 10050, 200);  // limit below ask
    printf("Matched: %s\\n", no_fill.has_value() ? "yes" : "no");
}`,
    explanation: "std::optional makes the nullable nature of a fill result explicit in the type system, eliminating magic return values (-1 qty, nullptr Fill*) and enabling the caller to use if (result) rather than checking a separate bool; C++23 monadic operations (transform, and_then) further enable pipeline-style processing.",
  },
];
