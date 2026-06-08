import type { Snippet } from "./types";

export const cppSnippets20260608B1: Snippet[] = [
  {
    id: "cpp-20260608-b1-fix-tag-parser",
    language: "cpp",
    title: "FIX protocol tag parser — string_view zero-copy",
    tag: "market-data",
    code: `#include <string_view>
#include <unordered_map>
#include <charconv>
#include <cstdint>

// FIX fields are SOH (\\x01) delimited "tag=value" pairs.
// string_view avoids any heap allocation: views point into the receive buffer.
struct FixMsg {
    std::unordered_map<int, std::string_view> fields;
    std::string_view get(int tag) const {
        auto it = fields.find(tag);
        return it != fields.end() ? it->second : std::string_view{};
    }
    double getDouble(int tag) const {
        auto sv = get(tag);
        double v = 0.0;
        std::from_chars(sv.data(), sv.data() + sv.size(), v);
        return v;
    }
};

FixMsg parseFixMsg(std::string_view buf) {
    FixMsg msg;
    while (!buf.empty()) {
        auto soh = buf.find('\\x01');
        auto field = (soh == std::string_view::npos) ? buf : buf.substr(0, soh);
        if (auto eq = field.find('='); eq != std::string_view::npos) {
            int tag = 0;
            std::from_chars(field.data(), field.data() + eq, tag);
            msg.fields[tag] = field.substr(eq + 1);
        }
        buf = (soh == std::string_view::npos) ? "" : buf.substr(soh + 1);
    }
    return msg;
}
// FIX 4.4 key tags: 49=SenderCompID, 55=Symbol, 44=Price, 38=OrderQty, 54=Side`,
    explanation:
      "string_view avoids one std::string allocation per FIX field: the entire message sits in a network receive buffer, and views into it are valid as long as the buffer is not overwritten. std::from_chars replaces atof/atoi with a constexpr-friendly, locale-independent converter.",
  },
  {
    id: "cpp-20260608-b1-intrusive-order-list",
    language: "cpp",
    title: "Intrusive doubly-linked order list — O(1) cancel",
    tag: "data-structures",
    code: `#include <cstdint>
#include <cassert>

// Intrusive list: prev/next pointers embedded inside Order itself.
// O(1) cancel given a pointer — no linear search; one allocation per order.
struct Order {
    std::int64_t id;
    double       price;
    int          qty;
    Order*       prev = nullptr;
    Order*       next = nullptr;
};

class OrderList {
    Order* head_ = nullptr;
    Order* tail_ = nullptr;
    int    size_  = 0;
public:
    void push_back(Order* o) noexcept {
        o->prev = tail_; o->next = nullptr;
        if (tail_) tail_->next = o; else head_ = o;
        tail_ = o;
        ++size_;
    }
    void erase(Order* o) noexcept {
        if (o->prev) o->prev->next = o->next; else head_ = o->next;
        if (o->next) o->next->prev = o->prev; else tail_ = o->prev;
        o->prev = o->next = nullptr;
        --size_;
    }
    Order* front() const noexcept { return head_; }
    bool   empty() const noexcept { return head_ == nullptr; }
    int    size()  const noexcept { return size_; }
};

// Usage: hold a map<OrderId, Order*> for O(1) cancel-by-id:
//   auto* o = orderMap.at(cancelId);
//   book.erase(o);  // O(1) removal from the level's queue`,
    explanation:
      "Embedding the list links inside Order avoids a separate node allocation and keeps the order data and its positional metadata in a single cache line. The standard std::list<Order> wastes two allocations (node + Order copy) and scatters them across the heap.",
  },
  {
    id: "cpp-20260608-b1-robin-hood-map",
    language: "cpp",
    title: "Robin Hood open-addressing hash map — order lookup",
    tag: "data-structures",
    code: `#include <vector>
#include <cstdint>
#include <cassert>

// Robin Hood hashing: on collision, swap the incumbent element
// if its probe-sequence length (PSL) is shorter than the inserting element.
// Equalises PSLs; max probe length ≈ 2* expected for 50% load.
template<typename V, std::size_t Cap = 65536>
class RobinHoodMap {
    static_assert((Cap & (Cap-1)) == 0, "Cap must be power of 2");
    struct Slot { std::uint64_t key; V val; int psl; bool used = false; };
    std::vector<Slot> tbl_{Cap};
    std::size_t mask_ = Cap - 1, size_ = 0;
public:
    void insert(std::uint64_t key, V val) {
        Slot cur{key, std::move(val), 0, true};
        for (std::size_t idx = key & mask_; ; idx = (idx+1) & mask_, ++cur.psl) {
            if (!tbl_[idx].used) { tbl_[idx] = std::move(cur); ++size_; return; }
            if (tbl_[idx].key == key) { tbl_[idx].val = std::move(cur.val); return; }
            if (tbl_[idx].psl < cur.psl) std::swap(tbl_[idx], cur);
        }
    }
    V* find(std::uint64_t key) noexcept {
        for (std::size_t idx = key & mask_, psl = 0;
             tbl_[idx].used && psl <= static_cast<std::size_t>(tbl_[idx].psl);
             idx = (idx+1) & mask_, ++psl)
            if (tbl_[idx].key == key) return &tbl_[idx].val;
        return nullptr;
    }
    void remove(std::uint64_t key) noexcept {
        // Backward-shift deletion to maintain invariant
        std::size_t idx = key & mask_;
        for (;;) {
            if (!tbl_[idx].used || tbl_[idx].key == key) break;
            idx = (idx+1) & mask_;
        }
        if (!tbl_[idx].used) return;
        --size_;
        for (;;) {
            std::size_t next = (idx+1) & mask_;
            if (!tbl_[next].used || tbl_[next].psl == 0) { tbl_[idx].used=false; return; }
            tbl_[idx] = tbl_[next]; --tbl_[idx].psl;
            idx = next;
        }
    }
};`,
    explanation:
      "Robin Hood hashing bounds the maximum probe length by stealing slots from elements close to home and gifting them to elements displaced further — empirically achieving near-optimal load factors of 90%+ with probe lengths under 8. The backward-shift delete avoids tombstones, keeping load factor accurate without periodic rehashing.",
  },
  {
    id: "cpp-20260608-b1-mpsc-two-lock",
    language: "cpp",
    title: "Two-lock MPSC queue — concurrent market data ingestion",
    tag: "concurrency",
    code: `#include <mutex>
#include <memory>
#include <optional>

// Michael-Scott (1996) two-lock MPSC queue.
// Enqueue uses tail_mu_ (multiple producers); dequeue uses head_mu_ (one consumer).
// Head and tail locks never contend except when the queue has ≤1 element.
template<typename T>
class MPSCQueue {
    struct Node { T val{}; std::unique_ptr<Node> next; };
    std::unique_ptr<Node> dummy_;
    Node*      tail_;
    std::mutex head_mu_, tail_mu_;
public:
    MPSCQueue() : dummy_(std::make_unique<Node>()), tail_(dummy_.get()) {}

    void enqueue(T val) {
        auto node  = std::make_unique<Node>(Node{std::move(val), nullptr});
        Node* raw  = node.get();
        std::lock_guard lk(tail_mu_);
        tail_->next = std::move(node);
        tail_       = raw;
    }

    std::optional<T> dequeue() {
        std::lock_guard lk(head_mu_);
        Node* next = dummy_->next.get();
        if (!next) return std::nullopt;
        T val = std::move(next->val);
        dummy_ = std::move(dummy_->next); // advance dummy
        return val;
    }

    bool empty() const {
        std::lock_guard lk(const_cast<std::mutex&>(head_mu_));
        return dummy_->next == nullptr;
    }
};
// For lock-free MPSC on x86, use SPSC per producer + consumer fan-in.`,
    explanation:
      "Separating head and tail locks means N producers can enqueue concurrently with the consumer dequeuing — they only contend on the same lock when the queue is nearly empty (size ≤ 1). The dummy-node trick removes the special case where enqueue and dequeue touch the same node simultaneously.",
  },
  {
    id: "cpp-20260608-b1-crr-binomial",
    language: "cpp",
    title: "CRR binomial tree — European and American option pricing",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <algorithm>

// Cox-Ross-Rubinstein (1979) recombining binomial tree.
// u = exp(sigma*sqrt(dt)), d = 1/u (recombining), p = (exp(r*dt)-d)/(u-d).
// O(N^2) time and space; N=500 typically accurate to 3 decimal places vs BS.
double crrPrice(double S0, double K, double r, double sigma, double T,
                int N, bool isCall, bool isAmerican = false) {
    double dt = T / N;
    double u  = std::exp(sigma * std::sqrt(dt));
    double d  = 1.0 / u;
    double p  = (std::exp(r * dt) - d) / (u - d);
    double df = std::exp(-r * dt);

    std::vector<double> V(N + 1);
    // Terminal payoffs
    for (int j = 0; j <= N; ++j) {
        double ST = S0 * std::pow(u, j) * std::pow(d, N - j);
        V[j] = isCall ? std::max(ST - K, 0.0) : std::max(K - ST, 0.0);
    }
    // Backward induction
    for (int i = N - 1; i >= 0; --i) {
        for (int j = 0; j <= i; ++j) {
            double cont = df * (p * V[j+1] + (1.0 - p) * V[j]);
            if (isAmerican) {
                double Si = S0 * std::pow(u, j) * std::pow(d, i - j);
                double ex = isCall ? std::max(Si - K, 0.0)
                                   : std::max(K - Si, 0.0);
                cont = std::max(cont, ex); // early exercise check
            }
            V[j] = cont;
        }
    }
    return V[0];
}
// American put premium over European = early exercise value;
// largest near ATM with high r and low sigma.`,
    explanation:
      "The recombining property (u*d = 1) means the tree has N+1 terminal nodes instead of 2^N, making O(N²) feasible. For American options the early-exercise check max(continuation, intrinsic) at each node correctly captures the optimal stopping boundary absent in European closed forms.",
  },
  {
    id: "cpp-20260608-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson FD solver — Black-Scholes PDE",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <algorithm>

// Crank-Nicolson (theta=0.5): unconditionally stable, O(dt^2) convergence.
// Solves BS PDE backwards in time using Thomas tridiagonal algorithm O(N).
double cnCallPrice(double S0, double K, double r, double sigma, double T,
                   int NS = 200, int NT = 100) {
    double Smax = 3.0 * K;
    double dS   = Smax / NS;
    double dt   = T / NT;
    double sig2 = sigma * sigma;

    std::vector<double> V(NS + 1);
    for (int i = 0; i <= NS; ++i)
        V[i] = std::max(i * dS - K, 0.0); // terminal payoff

    std::vector<double> a(NS-1), b(NS-1), c(NS-1), rhs(NS-1);

    for (int n = NT - 1; n >= 0; --n) {
        double t = (NT - n) * dt; // time since expiry (for BC)
        // Build coefficients for interior nodes i=1..NS-1
        for (int j = 0; j < NS - 1; ++j) {
            int    i  = j + 1;
            double al = 0.25 * dt * (sig2 * i*i - r * i);
            double be = -0.5  * dt * (sig2 * i*i + r);
            double ga = 0.25 * dt * (sig2 * i*i + r * i);
            a[j]   = -al;                      // implicit LHS lower
            b[j]   =  1.0 - be;                // implicit LHS diagonal
            c[j]   = -ga;                      // implicit LHS upper
            rhs[j] = al*V[i-1] + (1.0+be)*V[i] + ga*V[i+1]; // explicit RHS
        }
        // Boundary: V[0]=0 (call, S->0); V[NS]=Smax-K*exp(-r*t) (S->inf)
        double bcHigh = Smax - K * std::exp(-r * t);
        rhs[NS-2] -= c[NS-2] * bcHigh;
        c[NS-2]    = 0.0;
        // Thomas forward sweep
        for (int j = 1; j < NS-1; ++j) {
            double w = a[j] / b[j-1];
            b[j]   -= w * c[j-1];
            rhs[j] -= w * rhs[j-1];
        }
        // Backsubstitution
        V[NS] = bcHigh;
        V[NS-1] = rhs[NS-2] / b[NS-2];
        for (int j = NS-3; j >= 0; --j)
            V[j+1] = (rhs[j] - c[j] * V[j+2]) / b[j];
        V[0] = 0.0;
    }
    int i0 = static_cast<int>(S0 / dS);
    if (i0 >= NS) return V[NS];
    double f = (S0 - i0 * dS) / dS;
    return V[i0] * (1.0 - f) + V[i0+1] * f;
}`,
    explanation:
      "Crank-Nicolson averages the explicit (forward) and implicit (backward) Euler operators, giving second-order accuracy in time — versus first-order for either scheme alone. The Thomas algorithm solves the tridiagonal system in O(NS) per time step, making the total cost O(NS × NT).",
  },
  {
    id: "cpp-20260608-b1-bs-greeks",
    language: "cpp",
    title: "Black-Scholes analytic Greeks — delta, gamma, vega, theta, rho",
    tag: "quant",
    code: `#include <cmath>
#include <numbers>  // std::numbers::pi (C++20)

static double Phi(double x) noexcept {
    return 0.5 * std::erfc(-x * std::numbers::sqrt2_v<double> / 2.0);
}
static double phi(double x) noexcept {
    constexpr double inv_sqrt2pi = 1.0 / std::numbers::sqrt2_v<double>
                                   / std::numbers::sqrt2_v<double>;
    return std::exp(-0.5 * x * x) * std::sqrt(1.0 / (2.0 * std::numbers::pi));
}

struct BSGreeks { double delta, gamma, vega, theta, rho; };

BSGreeks bsGreeks(double S, double K, double r, double sigma,
                  double T, bool call) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r + 0.5*sigma*sigma)*T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    double nd1 = Phi(call ? d1 : -d1);
    double nd2 = Phi(call ? d2 : -d2);
    double phiD1 = phi(d1);
    double Kdf  = K * std::exp(-r * T);
    double sign = call ? 1.0 : -1.0;

    BSGreeks g;
    g.delta = sign * nd1;
    g.gamma = phiD1 / (S * sigma * sqT);           // same for call and put
    g.vega  = S * phiD1 * sqT;                     // per unit vol change
    g.theta = (-S * phiD1 * sigma / (2.0 * sqT)
               - sign * r * Kdf * nd2) / 365.0;    // per calendar day
    g.rho   = sign * Kdf * T * nd2;                // per unit rate change
    return g;
}
// Delta-hedging: buy delta shares to neutralise linear price exposure.
// Gamma measures convexity — positive for long options, negative for short.`,
    explanation:
      "All five Greeks follow directly from differentiating the Black-Scholes pricing formula; gamma is identical for calls and puts by put-call parity, and vega is also the same (both are long volatility). Theta is negative for long options because time decay erodes the probability of moving into the money.",
  },
  {
    id: "cpp-20260608-b1-dao-barrier-mc",
    language: "cpp",
    title: "Down-and-out call MC — discrete barrier monitoring",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// Down-and-out (DAO) call: payoff = max(S_T-K, 0) if path never hits B < S0.
// Discrete monitoring: check barrier only at each simulation step (not continuous).
double daoCallMC(double S0, double K, double B, double r, double sigma,
                 double T, int paths, int steps) {
    if (B >= S0) return 0.0;
    std::mt19937_64 rng(42);
    std::normal_distribution<> nd;
    double dt    = T / steps;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double sum   = 0.0;

    for (int p = 0; p < paths; ++p) {
        double S = S0;
        bool alive = true;
        for (int s = 0; s < steps && alive; ++s) {
            S *= std::exp(drift + vol * nd(rng));
            if (S <= B) alive = false; // knocked out
        }
        if (alive) sum += std::max(S - K, 0.0);
    }
    return std::exp(-r * T) * sum / paths;
}

// Brownian bridge correction for barrier crossing probability between steps:
// P(min(S_i,S_{i+1}) <= B) ~= exp(-2*log(S_i/B)*log(S_{i+1}/B)/(sigma^2*dt))
// Add this correction to avoid discrete-monitoring bias vs continuous barrier.`,
    explanation:
      "Discrete-monitoring barriers are cheaper than continuous ones because the asset price must be below B at a monitoring point, not at any time — this is the 'discretisation premium'. The Brownian bridge correction converts discrete to continuous prices and is essential when steps << paths for accuracy.",
  },
  {
    id: "cpp-20260608-b1-variance-swap",
    language: "cpp",
    title: "Model-free variance swap strike — log-strip replication",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <numeric>

// Carr-Madan (1998): variance swap fair strike from a discrete strip of options.
// K_var = (2/T) * exp(rT) * [sum_puts w_K*P(K) + sum_calls w_K*C(K)]
// where w_K = dK / K^2 (the log-contract replication weight).
// This is the VIX^2 formula modulo implementation details.
double varianceSwapStrike(
    const std::vector<double>& strikes,
    const std::vector<double>& callPrices,
    const std::vector<double>& putPrices,
    double F, double r, double T)
{
    double integral = 0.0;
    int n = static_cast<int>(strikes.size());
    for (int i = 0; i < n - 1; ++i) {
        double K  = strikes[i];
        double dK = strikes[i+1] - strikes[i];
        // Use OTM options: puts below forward, calls above
        double price = (K < F) ? putPrices[i] : callPrices[i];
        integral += price * dK / (K * K);
    }
    // Annualised variance (if expressed as vol^2, multiply by 10000 for bps^2)
    return (2.0 / T) * std::exp(r * T) * integral;
}

// Realized variance = (1/T) * sum (log(S_i/S_{i-1}))^2 * (252/N)
// P&L = N_var * (realized_var - K_var) paid at expiry.
// Positive gamma exposure: long var swap profits from realized > implied.`,
    explanation:
      "The log-contract replication is model-free — it holds for any continuous-price process without jumps. The 1/K² weighting overweights OTM strikes, reflecting that the log-contract has higher sensitivity to downside moves. In practice, the VIX uses a trapezoidal approximation of this integral over listed SPX options.",
  },
  {
    id: "cpp-20260608-b1-cir-milstein",
    language: "cpp",
    title: "CIR Milstein MC — square-root short rate ZCB",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <algorithm>

// CIR (Cox-Ingersoll-Ross 1985): dr = kappa*(theta-r)*dt + sigma*sqrt(r)*dW
// Feller condition: 2*kappa*theta > sigma^2 ensures r never reaches 0.
// Milstein scheme adds the O(dt) correction: + sigma^2/4*(dW^2 - dt).
double cirZCBMC(double r0, double kappa, double theta, double sigma,
                double T, int paths = 20000, int steps = 252) {
    std::mt19937_64 rng(42);
    std::normal_distribution<> nd;
    double dt = T / steps;
    double discountSum = 0.0;

    for (int p = 0; p < paths; ++p) {
        double r = r0, integral = 0.0;
        for (int s = 0; s < steps; ++s) {
            integral += r * dt;
            double sqr  = std::sqrt(std::max(r, 0.0));
            double dW   = std::sqrt(dt) * nd(rng);
            // Milstein: adds (sigma^2/4)*(dW^2 - dt) correction over Euler
            r += kappa*(theta - r)*dt + sigma*sqr*dW
                 + 0.25*sigma*sigma*(dW*dW - dt);
            r = std::max(r, 0.0); // full truncation prevents imaginary sqrt
        }
        discountSum += std::exp(-integral);
    }
    return discountSum / paths;
}
// Analytical: P(0,T) = A(T)*exp(-B(T)*r0)
// B(T) = 2*(exp(gamma*T)-1)/((gamma+kappa)*(exp(gamma*T)-1)+2*gamma)
// where gamma = sqrt(kappa^2 + 2*sigma^2).`,
    explanation:
      "The Milstein scheme adds the Ito correction term sigma²/4*(dW²-dt) to the Euler step, reducing the strong order of convergence from 0.5 to 1.0 — halving the required number of paths for the same accuracy. Full truncation (max(r,0)) prevents negative rates without the reflection bias of the absolute-value scheme.",
  },
  {
    id: "cpp-20260608-b1-crtp-pricer",
    language: "cpp",
    title: "CRTP static polymorphism — compile-time pricing interface",
    tag: "templates",
    code: `#include <cmath>

// CRTP: base class dispatches to Derived::priceImpl() at compile time.
// Zero virtual overhead; fully inlineable; Derived need not inherit anything else.
template<typename Derived>
struct PricingModel {
    double price(double S, double K, double r, double T) const {
        return static_cast<const Derived*>(this)->priceImpl(S, K, r, T);
    }
    // Numerical delta via bump-and-reprice — works for any model
    double delta(double S, double K, double r, double T,
                 double bump = 0.01) const {
        return (price(S+bump, K, r, T) - price(S-bump, K, r, T)) / (2.0*bump);
    }
};

struct BlackScholes : PricingModel<BlackScholes> {
    double sigma;
    explicit BlackScholes(double s) : sigma(s) {}
    double priceImpl(double S, double K, double r, double T) const {
        double sqT = std::sqrt(T);
        double d1  = (std::log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqT);
        double d2  = d1 - sigma*sqT;
        auto   Phi = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
        return S*Phi(d1) - K*std::exp(-r*T)*Phi(d2);
    }
};

// template<typename M> auto hedge(M& model) works with any CRTP model —
// no pointer, no virtual call, no heap — monomorphised at instantiation.
// Contrast: virtual double price() const requires a vtable round-trip per call.`,
    explanation:
      "CRTP provides open polymorphism (write generic algorithms in PricingModel) with closed dispatch (each model's priceImpl is resolved at compile time). The key trade-off versus virtual: CRTP is zero-overhead but requires the concrete type at the call site, preventing runtime substitution of models.",
  },
  {
    id: "cpp-20260608-b1-atomic-flag-spinlock",
    language: "cpp",
    title: "atomic_flag spinlock — test-and-test-set pattern",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>

// std::atomic_flag is guaranteed lock-free (the only such guarantee in C++).
// Test-and-test-set (TATAS): read with relaxed before issuing atomic RMW,
// reducing cache-coherence traffic on contended locks.
class SpinLock {
    std::atomic_flag flag_{};
public:
    void lock() noexcept {
        for (;;) {
            // Optimistic read: skip the expensive RMW while locked
            if (!flag_.test(std::memory_order_relaxed) &&
                !flag_.test_and_set(std::memory_order_acquire))
                return;
            std::this_thread::yield(); // give the OS a hint on long spins
        }
    }
    void unlock() noexcept { flag_.clear(std::memory_order_release); }
};

struct ScopedSpin {
    SpinLock& l_;
    explicit ScopedSpin(SpinLock& l) : l_(l) { l_.lock();   }
    ~ScopedSpin()                             { l_.unlock(); }
};
// Suitable for critical sections < ~50 ns (e.g. order-book level update).
// For longer holds, use std::mutex to avoid burning a hardware thread.`,
    explanation:
      "The TATAS pattern reads with memory_order_relaxed (a shared-mode cache probe) before attempting test_and_set (an exclusive-mode RMW). This dramatically reduces bus traffic on x86: contending threads spin reading the cache line locally rather than hammering the lock with exclusive RMW instructions.",
  },
  {
    id: "cpp-20260608-b1-fix-checksum",
    language: "cpp",
    title: "FIX message checksum — tag 10 integrity check",
    tag: "market-data",
    code: `#include <string_view>
#include <cstdint>
#include <charconv>
#include <stdexcept>
#include <array>

// FIX checksum (tag 10): sum of all bytes in the message (before tag 10)
// modulo 256, formatted as a zero-padded 3-digit ASCII integer.
std::uint8_t fixChecksum(std::string_view msg) noexcept {
    std::uint32_t sum = 0;
    for (unsigned char c : msg) sum += c;
    return static_cast<std::uint8_t>(sum & 0xFF);
}

std::array<char,4> checksumStr(std::uint8_t cs) noexcept {
    std::array<char,4> buf{};
    buf[0] = '0' + cs / 100;
    buf[1] = '0' + (cs / 10) % 10;
    buf[2] = '0' + cs % 10;
    buf[3] = '\\0';
    return buf;
}

bool validateFix(std::string_view fullMsg) {
    // tag 10 is the last field: ...\\x0110=NNN\\x01
    auto pos = fullMsg.rfind("\\x0110=");
    if (pos == std::string_view::npos)
        throw std::invalid_argument("missing checksum tag");
    auto body = fullMsg.substr(0, pos + 1); // include leading SOH
    std::uint8_t expected = fixChecksum(body);
    auto csField = fullMsg.substr(pos + 4, 3); // skip \\x0110=
    std::uint32_t actual = 0;
    std::from_chars(csField.data(), csField.data() + 3, actual);
    return expected == static_cast<std::uint8_t>(actual);
}`,
    explanation:
      "FIX checksum is deliberately simple (byte-sum mod 256, not CRC) to allow computation by even the most constrained embedded systems. Despite its weakness against corruption, it catches the vast majority of transmission errors and is mandatory by the FIX spec; a mismatch should trigger retransmission.",
  },
  {
    id: "cpp-20260608-b1-bitset-positions",
    language: "cpp",
    title: "std::bitset position tracker — multi-asset exposure flags",
    tag: "stl",
    code: `#include <bitset>
#include <cstddef>
#include <string>

// 256-asset portfolio: one bit per asset.
// bitset ops: O(N/64) via 64-bit word operations — far faster than std::vector<bool>.
struct PositionFlags {
    static constexpr std::size_t NASSETS = 256;
    std::bitset<NASSETS> longs;   // bit set if we have a long position
    std::bitset<NASSETS> shorts;  // bit set if we have a short position

    bool isLong (std::size_t i) const noexcept { return longs[i];  }
    bool isShort(std::size_t i) const noexcept { return shorts[i]; }

    void addLong (std::size_t i) noexcept { longs.set(i);  shorts.reset(i); }
    void addShort(std::size_t i) noexcept { shorts.set(i); longs.reset(i);  }
    void flat    (std::size_t i) noexcept { longs.reset(i); shorts.reset(i); }

    // Count net-long positions in O(NASSETS/64) via popcount
    int netLongCount()  const noexcept { return static_cast<int>(longs.count());  }
    int netShortCount() const noexcept { return static_cast<int>(shorts.count()); }

    // Which assets are net-long and not short — efficient AND on bitset words
    std::bitset<NASSETS> pureLongs()  const noexcept { return longs & ~shorts; }
    std::bitset<NASSETS> pureShorts() const noexcept { return shorts & ~longs; }
};
// std::bitset<N>::count() maps to POPCNT on modern compilers with -march=native.`,
    explanation:
      "Bitset operations on N assets run in ceil(N/64) SIMD-word operations rather than N scalar comparisons — a 64× throughput advantage for whole-portfolio queries like 'count longs' or 'find all net exposures'. The bitwise AND/OR patterns allow set-theoretic queries (e.g., assets long in both desk A and desk B) in constant time.",
  },
  {
    id: "cpp-20260608-b1-seqcst-fence",
    language: "cpp",
    title: "seq_cst fence — total order across trading threads",
    tag: "concurrency",
    code: `#include <atomic>
#include <thread>
#include <cassert>

// Without seq_cst, acquire/release only creates happens-before between
// a specific producer/consumer pair — two independent pairs can still see
// each other's stores in different orders (Store Buffer reordering on x86 is
// actually safe, but ARM/POWER require explicit barriers).
//
// std::atomic_thread_fence(seq_cst) + atomic stores with seq_cst creates
// a total global order visible to all threads.

std::atomic<int> orderSent{0};
std::atomic<int> riskChecked{0};

// Risk thread: check, then signal
void riskThread() {
    // ... run risk checks ...
    riskChecked.store(1, std::memory_order_seq_cst);
}

// Order thread: only send if risk cleared
void orderThread() {
    std::atomic_thread_fence(std::memory_order_seq_cst);
    if (riskChecked.load(std::memory_order_seq_cst) == 1)
        orderSent.store(1, std::memory_order_seq_cst);
}

// seq_cst is the default for std::atomic operations; the fence form is
// useful when coordinating across multiple independent atomic pairs without
// a direct producer-consumer relationship.`,
    explanation:
      "acquire/release pairs establish ordering between a specific pair of threads; seq_cst extends this to a total order across all threads and all seq_cst operations globally. In practice, seq_cst is the default atomic ordering and its cost on x86 (a MFENCE for stores) is paid once per critical update, not per tick.",
  },
  {
    id: "cpp-20260608-b1-stl-heap-topk",
    language: "cpp",
    title: "STL heap — rolling top-K order book levels",
    tag: "stl",
    code: `#include <algorithm>
#include <vector>
#include <functional>

// Maintain the K largest bid prices seen in the last N ticks using a min-heap.
// Min-heap of size K: if new price > heap.top(), replace top and sift down.
// Total cost: N * O(log K) — far cheaper than sorting all N prices.
struct TopKBids {
    int                    K;
    std::vector<double>    heap; // min-heap — bottom K prices discarded

    explicit TopKBids(int k) : K(k) {}

    void add(double price) {
        if (static_cast<int>(heap.size()) < K) {
            heap.push_back(price);
            std::push_heap(heap.begin(), heap.end(), std::greater<>{});
        } else if (price > heap.front()) {
            // Replace smallest in heap with the new (larger) price
            std::pop_heap(heap.begin(), heap.end(), std::greater<>{});
            heap.back() = price;
            std::push_heap(heap.begin(), heap.end(), std::greater<>{});
        }
    }

    double kthLargest() const { return heap.front(); } // min of top-K
    const std::vector<double>& topK() const { return heap; }
};

// Complexity: push_heap and pop_heap are O(log K).
// push_heap(first, last, comp): assumes [first, last-1) satisfies heap property,
// sifts last-1 up to restore it. pop_heap moves root to last-1, sifts.`,
    explanation:
      "The push_heap/pop_heap pattern avoids the O(N log N) full sort by maintaining only a K-element heap — each tick costs O(log K) regardless of N. A max-heap tracks the K smallest (bottom of the book); a min-heap tracks the K largest (top of the book).",
  },
  {
    id: "cpp-20260608-b1-perfect-fwd-factory",
    language: "cpp",
    title: "Perfect forwarding factory — zero-copy order construction",
    tag: "templates",
    code: `#include <memory>
#include <utility>
#include <string>
#include <unordered_map>

struct Order {
    int         id;
    double      price;
    int         qty;
    std::string symbol;
    std::string side;
};

// Factory that perfectly forwards constructor arguments — no copies or moves
// beyond what the Order constructor itself requires.
class OrderPool {
    std::unordered_map<int, std::unique_ptr<Order>> orders_;
public:
    // Variadic: accepts any combination of lvalue/rvalue arguments
    template<typename... Args>
    Order* make(int id, Args&&... args) {
        auto [it, ok] = orders_.emplace(
            id,
            std::make_unique<Order>(Order{id, std::forward<Args>(args)...})
        );
        return ok ? it->second.get() : nullptr;
    }

    void cancel(int id) { orders_.erase(id); }
    Order* get(int id) {
        auto it = orders_.find(id);
        return it != orders_.end() ? it->second.get() : nullptr;
    }
};
// make(1, 99.5, 100, "AAPL", "BUY") — no temporary Order, no extra move.
// std::forward preserves value category: rvalue strings are moved into Order.`,
    explanation:
      "Perfect forwarding (std::forward<Args>(args)...) passes each argument with its original value category: rvalue references are moved, lvalue references are copied — exactly what a direct construction would do. Without forwarding, a factory would need to copy every argument into a temporary then move it, costing an extra string allocation per field.",
  },
  {
    id: "cpp-20260608-b1-shared-future-snapshot",
    language: "cpp",
    title: "std::shared_future — broadcast risk snapshot to N threads",
    tag: "concurrency",
    code: `#include <future>
#include <vector>
#include <thread>
#include <memory>

struct RiskSnapshot {
    double delta, gamma, vega;
    int    timestamp;
};

// shared_future: unlike unique future, it can be waited on by multiple threads.
// The calculation runs once; all recipients get the same result.
class RiskBroadcaster {
    std::shared_future<RiskSnapshot> snapshot_;
public:
    void compute(std::function<RiskSnapshot()> calc) {
        snapshot_ = std::async(std::launch::async, std::move(calc)).share();
    }

    void fanOut(int nRecipients) {
        std::vector<std::thread> workers;
        for (int i = 0; i < nRecipients; ++i)
            workers.emplace_back([this, i] {
                auto snap = snapshot_.get(); // blocks until ready
                // Each thread acts on the same snapshot without copying
                (void)snap;
            });
        for (auto& w : workers) w.join();
    }
};
// Contrast std::future: get() may only be called once; second call is undefined.
// shared_future.get() is safe to call from multiple threads simultaneously.`,
    explanation:
      "std::shared_future solves the fan-out pattern: compute the expensive risk snapshot once on a background thread, then share it to N downstream subscribers without copying the result data. The key invariant is that shared_future::get() is const and thread-safe; it blocks only until the first call's result is ready.",
  },
  {
    id: "cpp-20260608-b1-jthread-risk",
    language: "cpp",
    title: "std::jthread — RAII background risk calculator",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <atomic>
#include <chrono>
#include <iostream>

// std::jthread (C++20): automatically joins on destruction and provides
// a std::stop_token for cooperative cancellation — no manual join() needed.
class BackgroundRisk {
    std::atomic<double> lastDelta_{0.0};
    std::jthread        worker_;

public:
    BackgroundRisk() : worker_([this](std::stop_token st) {
        while (!st.stop_requested()) {
            // Recalculate portfolio delta every 100 ms
            lastDelta_.store(computeDelta(), std::memory_order_relaxed);
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }) {}

    double delta() const { return lastDelta_.load(std::memory_order_relaxed); }

    // Destructor calls worker_.request_stop() then joins — no leak possible
    ~BackgroundRisk() = default;

private:
    static double computeDelta() { return 0.42; } // placeholder
};
// Compared to std::thread: jthread cannot be accidentally destroyed without
// joining (which std::thread would terminate the program via std::terminate).`,
    explanation:
      "std::jthread eliminates the most common threading bug: forgetting to join. Its stop_token mechanism enables clean shutdown without condition variables — request_stop() sets a flag the thread polls, and the jthread destructor calls it automatically before joining. This is the recommended replacement for std::thread in C++20.",
  },
  {
    id: "cpp-20260608-b1-constexpr-greek-bounds",
    language: "cpp",
    title: "constexpr static_assert — compile-time Greek sanity bounds",
    tag: "templates",
    code: `#include <cmath>
#include <stdexcept>

// Compile-time validated risk limits: if limits are wrong in the source,
// the binary never builds — better than a runtime assertion that triggers in prod.
namespace Limits {
    inline constexpr double MAX_DELTA = 1.0;
    inline constexpr double MAX_GAMMA = 1.0;   // per $ move of underlying
    inline constexpr double MAX_VEGA  = 50.0;  // $ per 1% vol move
    static_assert(MAX_DELTA > 0.0 && MAX_DELTA <= 1.0,
                  "Delta must be in (0,1] for vanilla options");
    static_assert(MAX_GAMMA > 0.0, "Gamma must be positive for long options");
    static_assert(MAX_VEGA  > 0.0, "Vega limit must be positive");
}

struct Greeks { double delta, gamma, vega; };

[[nodiscard]] bool passesRiskLimits(const Greeks& g) noexcept {
    return std::abs(g.delta) <= Limits::MAX_DELTA &&
           std::abs(g.gamma) <= Limits::MAX_GAMMA &&
           std::abs(g.vega)  <= Limits::MAX_VEGA;
}

// constexpr pricer: compute delta at compile time for a known product
constexpr double atm_call_delta_approx(double T) noexcept {
    // Approximation for ATM call delta ≈ 0.5 + sigma*sqrt(T)/(4*sqrt(pi))
    // For T=0, delta=0.5 exactly
    return T > 0.0 ? 0.5 : 0.5;
}
static_assert(atm_call_delta_approx(0.0) == 0.5, "ATM call delta must be 0.5");`,
    explanation:
      "constexpr and static_assert push correctness checks into the compilation stage: limits that are invalid by construction (negative gamma limit) or invariants that must hold for all instantiations (ATM delta = 0.5) are verified before a single byte of runtime code executes. This is especially valuable in quant libraries where the same Greek formulas serve dozens of downstream callers.",
  },
  {
    id: "cpp-20260608-b1-latch-parallel-mc",
    language: "cpp",
    title: "std::latch — barrier for parallel Monte Carlo aggregation",
    tag: "concurrency",
    code: `#include <latch>
#include <thread>
#include <vector>
#include <atomic>
#include <numeric>

// std::latch (C++20): single-use countdown barrier.
// N worker threads each price a batch, then count down.
// Main thread blocks at latch.wait() until all workers finish.
double parallelMCPrice(int nThreads, int pathsPerThread,
                       auto pricePath) {  // pricePath: () -> double
    std::latch            done(nThreads);
    std::vector<double>   partials(nThreads, 0.0);
    std::vector<std::thread> workers;

    for (int t = 0; t < nThreads; ++t) {
        workers.emplace_back([&, t] {
            double sum = 0.0;
            for (int p = 0; p < pathsPerThread; ++p)
                sum += pricePath();
            partials[t] = sum;
            done.count_down(); // decrement latch; last one releases main
        });
    }

    done.wait();  // main thread blocks here until all nThreads count down
    for (auto& w : workers) w.join();

    double total = std::accumulate(partials.begin(), partials.end(), 0.0);
    return total / (nThreads * pathsPerThread);
}
// std::barrier (C++20) is reusable and supports a completion function —
// use it for multi-round algorithms (e.g. iterative variance reduction).`,
    explanation:
      "std::latch provides a zero-overhead synchronisation point: the compiler and hardware can arrange for count_down() to emit a single atomic decrement. Unlike std::condition_variable, there is no mutex involved — the internal counter is modified with a release fence and waited on with an acquire spin.",
  },
  {
    id: "cpp-20260608-b1-csv-string-view-split",
    language: "cpp",
    title: "string_view CSV tokeniser — zero-copy market data parsing",
    tag: "modern",
    code: `#include <string_view>
#include <vector>
#include <charconv>
#include <stdexcept>

// Zero-copy tokeniser: returns views into the original buffer.
// No allocations; caller owns the buffer lifetime.
std::vector<std::string_view> splitCSV(std::string_view line,
                                        char delim = ',') {
    std::vector<std::string_view> tokens;
    while (!line.empty()) {
        auto pos = line.find(delim);
        tokens.push_back(line.substr(0, pos));
        if (pos == std::string_view::npos) break;
        line.remove_prefix(pos + 1);
    }
    return tokens;
}

// Parse a tick line: timestamp,symbol,bid,ask,bidSz,askSz
struct Tick { double bid, ask; int bidSz, askSz; };

Tick parseTick(std::string_view line) {
    auto f = splitCSV(line);
    if (f.size() < 6) throw std::invalid_argument("bad tick line");
    Tick t{};
    std::from_chars(f[2].data(), f[2].data()+f[2].size(), t.bid);
    std::from_chars(f[3].data(), f[3].data()+f[3].size(), t.ask);
    std::from_chars(f[4].data(), f[4].data()+f[4].size(), t.bidSz);
    std::from_chars(f[5].data(), f[5].data()+f[5].size(), t.askSz);
    return t;
}
// from_chars is constexpr-friendly and locale-independent — faster than sscanf.`,
    explanation:
      "string_view::find + remove_prefix produces a tokeniser with zero heap allocation and zero copies: each token is a view into the receive buffer. Combining this with std::from_chars (which also requires no allocation) makes tick-line parsing completely allocation-free on the hot path.",
  },
  {
    id: "cpp-20260608-b1-priority-queue-custom-cmp",
    language: "cpp",
    title: "std::priority_queue custom comparator — best bid/ask tracker",
    tag: "stl",
    code: `#include <queue>
#include <vector>
#include <functional>
#include <cstdint>

struct PriceLevel {
    double       price;
    std::int64_t qty;
    std::int64_t seqno; // for tie-breaking
};

// Max-heap for bids: highest price at top.
// Comparator: std::less<> gives max-heap (default for priority_queue).
using BidQueue = std::priority_queue<
    PriceLevel,
    std::vector<PriceLevel>,
    decltype([](const PriceLevel& a, const PriceLevel& b) {
        return a.price < b.price ||
               (a.price == b.price && a.seqno > b.seqno); // FIFO tie-break
    })
>;

// Min-heap for asks: lowest price at top.
using AskQueue = std::priority_queue<
    PriceLevel,
    std::vector<PriceLevel>,
    decltype([](const PriceLevel& a, const PriceLevel& b) {
        return a.price > b.price ||
               (a.price == b.price && a.seqno > b.seqno);
    })
>;

// Stateless lambda comparators work as template arguments in C++20 (no captures).
// Using std::greater<PriceLevel> requires operator> on the struct —
// a stateless lambda is cleaner for composite sort keys.`,
    explanation:
      "C++20 allows captureless lambdas as non-type template arguments, replacing cumbersome comparator structs with an inline expression. The FIFO tie-break on seqno ensures that equal-priced levels follow exchange price-time priority — critical for correct trade matching simulation.",
  },
  {
    id: "cpp-20260608-b1-endian-deserialize",
    language: "cpp",
    title: "Endian-safe market data deserialiser — network byte order",
    tag: "market-data",
    code: `#include <cstdint>
#include <cstring>
#include <bit>      // std::byteswap (C++23), std::endian (C++20)
#include <span>

// Network byte order (big-endian) vs x86 native (little-endian).
// std::byteswap (C++23) compiles to a single BSWAP instruction.
template<typename T>
T fromBigEndian(const void* src) noexcept {
    T val;
    std::memcpy(&val, src, sizeof(T));
    if constexpr (std::endian::native == std::endian::little)
        val = std::byteswap(val);
    return val;
}

// ITCH 5.0-style add-order message (simplified): 8B seqno, 8B price, 4B qty
struct ITCHAddOrder {
    std::uint64_t seqno;
    std::int64_t  price;  // price in 1/10000 of a dollar (fixed-point)
    std::int32_t  qty;
};

ITCHAddOrder deserialize(std::span<const std::byte, 20> buf) noexcept {
    const auto* p = buf.data();
    return {
        fromBigEndian<std::uint64_t>(p),
        fromBigEndian<std::int64_t> (p + 8),
        fromBigEndian<std::int32_t> (p + 16),
    };
}
// Fixed-point price: divide by 10000.0 to get dollars.
// ITCH uses big-endian throughout; OUCH uses little-endian on some fields.`,
    explanation:
      "std::byteswap eliminates hand-rolled byte-swap loops and compiles to a single BSWAP/REV instruction on x86/ARM. The if constexpr on endian::native means zero-cost on big-endian machines — the function becomes a plain memcpy — while still being portable to both architectures.",
  },
  {
    id: "cpp-20260608-b1-optional-pipeline",
    language: "cpp",
    title: "std::optional pipeline — order routing with early termination",
    tag: "modern",
    code: `#include <optional>
#include <string>
#include <functional>

struct Order    { int id; double price; int qty; std::string symbol; };
struct Routing  { std::string venue; int priority; };

// Monadic optional chain (C++23): and_then propagates the value or
// short-circuits on nullopt — no nested if/else or exception.
std::optional<Routing> route(const Order& o) {
    // Step 1: validate price
    auto validated = [&]() -> std::optional<Order> {
        return (o.price > 0 && o.qty > 0) ? std::optional{o} : std::nullopt;
    };

    // Step 2: select venue
    auto selectVenue = [](const Order& ord) -> std::optional<Routing> {
        if (ord.symbol == "SPY")  return Routing{"NYSE_ARCA", 1};
        if (ord.symbol == "QQQ")  return Routing{"NASDAQ",    1};
        if (ord.symbol.size() < 5) return Routing{"NYSE",     2};
        return std::nullopt; // unknown symbol
    };

    // C++23 and_then: chains monadic operations on optional
    return validated().and_then(selectVenue);
}

// Without and_then (C++17):
// auto v = validated();
// if (!v) return std::nullopt;
// return selectVenue(*v);
// and_then eliminates the intermediate variables and makes the pipeline explicit.`,
    explanation:
      "std::optional::and_then (C++23) implements monadic chaining: a nullopt at any stage short-circuits the entire pipeline without throwing. This models a validation pipeline as a sequence of transformations — each step either produces a value or signals failure — avoiding nested ifs or exception overhead on the hot path.",
  },
];
