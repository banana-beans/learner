import type { Snippet } from "./types";

export const cppSnippets20260803B1: Snippet[] = [
  {
    id: "cpp-20260803-b1-crtp-vwap",
    language: "cpp",
    title: "CRTP Mixin for Zero-Overhead VWAP/TWAP Analytics",
    tag: "modern-cpp",
    code: `#include <cstddef>
#include <chrono>

// CRTP base: injects on_trade() into any Derived that defines on_tick_impl().
// Zero virtual calls — Derived::on_tick_impl is resolved at compile time.
template <typename Derived>
class TickAnalytics {
protected:
    double sum_pv_  = 0.0;
    double sum_qty_ = 0.0;
    std::size_t trade_count_ = 0;

public:
    void on_trade(double price, double qty) {
        sum_pv_  += price * qty;
        sum_qty_ += qty;
        ++trade_count_;
        static_cast<Derived*>(this)->on_tick_impl(price, qty);
    }
    double vwap()        const { return sum_qty_ > 0 ? sum_pv_ / sum_qty_ : 0.0; }
    std::size_t count()  const { return trade_count_; }
};

// Concrete monitor: adds min/max tracking via the CRTP hook
class PriceRangeMonitor : public TickAnalytics<PriceRangeMonitor> {
    double lo_ = 1e18, hi_ = -1e18;
public:
    void on_tick_impl(double price, double) {
        if (price < lo_) lo_ = price;
        if (price > hi_) hi_ = price;
    }
    double range()   const { return hi_ - lo_; }
    double low()     const { return lo_; }
    double high()    const { return hi_; }
};

// Usage:
//   PriceRangeMonitor mon;
//   mon.on_trade(100.0, 500); mon.on_trade(101.5, 200);
//   double v = mon.vwap();  // 100.4286...`,
    explanation: "CRTP eliminates vtable overhead in the tight tick-processing loop: the derived class method is called via static_cast, which compiles to a direct inlined call. The mixin pattern lets any monitor reuse VWAP/TWAP bookkeeping without multiple inheritance or virtual dispatch."
  },
  {
    id: "cpp-20260803-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson Implicit FD Scheme for European Options",
    tag: "numerics",
    code: `#include <vector>
#include <algorithm>
#include <cmath>

// Thomas algorithm: O(n) tridiagonal system solver.
static void thomas(const std::vector<double>& a,
                   const std::vector<double>& b,
                   const std::vector<double>& c,
                   const std::vector<double>& d,
                   std::vector<double>& x) {
    int n = static_cast<int>(d.size());
    std::vector<double> cp(n), dp(n);
    cp[0] = c[0] / b[0];
    dp[0] = d[0] / b[0];
    for (int i = 1; i < n; ++i) {
        double denom = b[i] - a[i] * cp[i-1];
        cp[i] = c[i] / denom;
        dp[i] = (d[i] - a[i] * dp[i-1]) / denom;
    }
    x[n-1] = dp[n-1];
    for (int i = n-2; i >= 0; --i)
        x[i] = dp[i] - cp[i] * x[i+1];
}

// Crank-Nicolson pricer: theta=0.5 → unconditionally stable, O(dt^2) accurate.
// Use for American options via operator splitting or PSOR.
std::vector<double> cn_european_put(double K, double T, double r,
                                     double sigma, int M, int N) {
    double S_max = 3.0 * K, dS = S_max / M, dt = T / N;
    std::vector<double> V(M + 1);
    for (int i = 0; i <= M; ++i)
        V[i] = std::max(K - i * dS, 0.0);   // terminal payoff

    for (int n = N - 1; n >= 0; --n) {
        int sz = M - 1;
        std::vector<double> a(sz), b(sz), c(sz), rhs(sz);
        for (int i = 1; i < M; ++i) {
            double S   = i * dS;
            double al  = 0.25 * sigma * sigma * S * S / (dS * dS);
            double be  = 0.25 * r * S / dS;
            int    j   = i - 1;
            a[j] = -al + be;
            b[j] =  2.0 * al + 0.5 * r + 1.0 / dt;
            c[j] = -al - be;
            // RHS: explicit half-step
            rhs[j] = (al - be) * V[i-1]
                   + (1.0 / dt - 2.0 * al - 0.5 * r) * V[i]
                   + (al + be) * V[i+1];
        }
        // Boundary conditions
        double bc_lo = K * std::exp(-r * (N - n) * dt);
        // Boundary coeff at i=1: al=0.25*sig^2, be=0.25*r (after dS cancels)
        rhs[0] += (0.25*sigma*sigma - 0.25*r) * bc_lo;
        std::vector<double> Vn(sz);
        thomas(a, b, c, rhs, Vn);
        for (int i = 1; i < M; ++i) V[i] = Vn[i-1];
        V[0] = bc_lo; V[M] = 0.0;
    }
    return V;
}`,
    explanation: "Crank-Nicolson averages the explicit (forward Euler) and implicit (backward Euler) half-steps, giving O(dt²) accuracy and unconditional stability — any dt is safe. The tridiagonal system per time step is solved by the Thomas algorithm in O(M) ops rather than LU factorisation's O(M³)."
  },
  {
    id: "cpp-20260803-b1-intrusive-dlist",
    language: "cpp",
    title: "Intrusive Doubly-Linked List for O(1) Order Removal",
    tag: "containers",
    code: `#include <cstddef>
#include <cassert>

// Intrusive list: the node is embedded inside the object (no separate allocation).
// O(1) removal without searching: caller holds a pointer to the node directly.
struct ListNode {
    ListNode* prev = nullptr;
    ListNode* next = nullptr;
};

template <typename T, ListNode T::* NodeMember>
class IntrusiveList {
    ListNode sentinel_;   // dummy head+tail node
    std::size_t size_ = 0;

public:
    IntrusiveList() { sentinel_.prev = sentinel_.next = &sentinel_; }

    void push_back(T* obj) {
        ListNode* node = &(obj->*NodeMember);
        node->prev = sentinel_.prev;
        node->next = &sentinel_;
        sentinel_.prev->next = node;
        sentinel_.prev       = node;
        ++size_;
    }

    // O(1) removal: no search needed because caller holds the pointer.
    void remove(T* obj) {
        ListNode* node = &(obj->*NodeMember);
        assert(node->prev != nullptr);
        node->prev->next = node->next;
        node->next->prev = node->prev;
        node->prev = node->next = nullptr;
        --size_;
    }

    T* front() const {
        if (sentinel_.next == &sentinel_) return nullptr;
        return reinterpret_cast<T*>(
            reinterpret_cast<std::byte*>(sentinel_.next)
            - reinterpret_cast<std::ptrdiff_t>(&(((T*)nullptr)->*NodeMember)));
    }

    std::size_t size() const { return size_; }
};

// Usage:
// struct Order { double price; int qty; ListNode list_node; };
// IntrusiveList<Order, &Order::list_node> level_queue;
// Order o{100.0, 500, {}};
// level_queue.push_back(&o);
// level_queue.remove(&o);   // O(1), no search`,
    explanation: "Intrusive lists embed the list node directly in the object, eliminating a separate heap allocation per node. More importantly, a pointer to the order IS a pointer to its list node — enabling O(1) cancel without searching the level's order queue, which is the critical operation for high cancel-to-trade ratio feeds."
  },
  {
    id: "cpp-20260803-b1-fix-tag-parser",
    language: "cpp",
    title: "FIX 4.4 Tag-Value Parser with CheckSum Validation",
    tag: "market-data",
    code: `#include <string_view>
#include <unordered_map>
#include <string>
#include <cstdint>
#include <stdexcept>

// FIX messages are SOH (\\x01) delimited tag=value pairs.
// Tags 8 (BeginString), 9 (BodyLength), 10 (CheckSum) are mandatory.
class FIXParser {
    std::unordered_map<int, std::string_view> fields_;
    bool checksum_ok_ = false;

public:
    // parse returns true if FIX checksum validates
    bool parse(std::string_view msg) {
        fields_.clear();
        uint32_t csum = 0;

        // Compute checksum over everything up to the 10= tag
        std::string_view body = msg;
        auto cs_pos = msg.rfind("\x0110=");
        if (cs_pos != std::string_view::npos) {
            body = msg.substr(0, cs_pos + 1);  // include trailing SOH
        }
        for (char c : body) csum = (csum + static_cast<uint8_t>(c)) & 0xFF;

        // Parse all fields
        std::size_t start = 0;
        while (start < msg.size()) {
            auto eq  = msg.find('=', start);
            if (eq  == std::string_view::npos) break;
            auto soh = msg.find('\x01', eq + 1);
            if (soh == std::string_view::npos) soh = msg.size();

            int  tag = 0;
            for (std::size_t i = start; i < eq; ++i)
                tag = tag * 10 + (msg[i] - '0');

            fields_[tag] = msg.substr(eq + 1, soh - eq - 1);
            start = soh + 1;
        }

        // Validate checksum
        if (fields_.count(10)) {
            int declared = 0;
            for (char c : fields_[10])
                declared = declared * 10 + (c - '0');
            checksum_ok_ = (static_cast<int>(csum) == declared);
        }
        return checksum_ok_;
    }

    std::string_view get(int tag) const {
        auto it = fields_.find(tag);
        return it != fields_.end() ? it->second : std::string_view{};
    }

    // FIX standard tags
    // 8=BeginString  9=BodyLength  35=MsgType  49=SenderCompID
    // 56=TargetCompID  34=MsgSeqNum  52=SendingTime  10=CheckSum
};`,
    explanation: "FIX checksum is computed as the byte-sum modulo 256 of every character up to (but not including) the 10= tag, including the trailing SOH. Validating it at the parser level catches truncated TCP segments and bit-flip corruption before field processing — critical for OMS reconciliation."
  },
  {
    id: "cpp-20260803-b1-asian-geometric",
    language: "cpp",
    title: "Geometric Asian Option Closed Form (Kemna-Vorst)",
    tag: "numerics",
    code: `#include <cmath>

// Kemna & Vorst (1990) closed-form for continuously-monitored geometric Asian call.
// Geometric average: G_T = exp( (1/T) * integral_0^T log(S_t) dt )
// Analytic formula: same as Black-Scholes with adjusted sigma_g and r_g.
double geometric_asian_call(double S, double K, double r, double sigma, double T) {
    // Adjusted parameters for the geometric average
    double sigma_g = sigma / std::sqrt(3.0);
    double r_g     = 0.5 * (r - 0.5 * sigma * sigma)
                   + 0.5 * sigma_g * sigma_g;

    double d1 = (std::log(S / K) + (r_g + 0.5 * sigma_g * sigma_g) * T)
                / (sigma_g * std::sqrt(T));
    double d2 = d1 - sigma_g * std::sqrt(T);

    auto Ncdf = [](double x) {
        return 0.5 * std::erfc(-x / std::sqrt(2.0));
    };

    return std::exp(-r * T)
           * (S * std::exp(r_g * T) * Ncdf(d1) - K * Ncdf(d2));
}

// Arithmetic Asian option: no closed form under GBM.
// Use geometric as a control variate:
//   C_arith_MC ≈ C_geo_formula + (C_arith_MC_raw - C_geo_MC_raw)
// This reduces variance by ~95% for at-the-money options.`,
    explanation: "The geometric average of GBM paths is itself lognormal, so the geometric Asian option has a Black-Scholes-like formula with sigma/sqrt(3) and adjusted drift. Crucially, it serves as the canonical control variate for arithmetic Asian MC: subtracting the geometric MC estimator (whose expectation is known analytically) collapses variance dramatically."
  },
  {
    id: "cpp-20260803-b1-barrier-downout",
    language: "cpp",
    title: "Down-and-Out Call Barrier Option (Merton Continuous Formula)",
    tag: "numerics",
    code: `#include <cmath>

// Merton (1973) closed form for continuous down-and-out European call.
// Barrier H < S (knock-out if S_t <= H at any t in [0,T]).
// Assumes r, sigma constant; no dividends.
double down_and_out_call(double S, double K, double H,
                          double r, double sigma, double T) {
    if (H >= S || H >= K) return 0.0;  // already knocked out or H >= K (trivial)

    auto Ncdf = [](double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); };

    double vol_sqrtT = sigma * std::sqrt(T);
    double d1 = (std::log(S / K) + (r + 0.5 * sigma*sigma) * T) / vol_sqrtT;
    double d2 = d1 - vol_sqrtT;

    // Standard call
    double vanilla = S * Ncdf(d1) - K * std::exp(-r * T) * Ncdf(d2);

    // Merton reflection: image option with reflected spot S* = H^2/S
    double lam = (r + 0.5 * sigma * sigma) / (sigma * sigma);
    double x1 = (std::log(H*H / (S*K)) + (r + 0.5 * sigma*sigma) * T) / vol_sqrtT;
    double x2 = x1 - vol_sqrtT;

    double image = std::pow(H / S, 2.0 * lam)
                 * (S * std::pow(H / S, 2.0) * Ncdf(x1)
                    - K * std::exp(-r * T) * Ncdf(x2));

    return vanilla - image;
}

// Down-and-out put and up-and-in/out options follow from in-out parity:
//   C_in + C_out = C_vanilla   (same strike, same barrier direction)`,
    explanation: "The Merton reflection principle replaces the absorbed paths (those that hit H) with a reflected image option at spot H²/S. The formula generalises to non-zero dividends by replacing r with r-q and adjusting lambda. In-out parity lets you price any single-barrier option once you have two of the three values."
  },
  {
    id: "cpp-20260803-b1-perfect-forward-dispatch",
    language: "cpp",
    title: "Perfect Forwarding in a Generic Event Dispatcher",
    tag: "modern-cpp",
    code: `#include <functional>
#include <vector>
#include <utility>

// Generic event bus: subscribe handlers, publish events.
// Perfect forwarding avoids copy when pushing events or invoking handlers.
template <typename Event>
class EventBus {
    std::vector<std::function<void(const Event&)>> handlers_;

public:
    template <typename Handler>
    void subscribe(Handler&& h) {
        handlers_.emplace_back(std::forward<Handler>(h));
    }

    // Accepts lvalue or rvalue Event; forwards into handlers without copy.
    template <typename E>
    void publish(E&& event) {
        for (auto& h : handlers_)
            h(std::forward<E>(event));   // const ref binds to both
    }
};

// Example event types
struct TradeEvent { double price; int qty; char side; };
struct CancelEvent { int order_id; };

// Usage:
//   EventBus<TradeEvent> bus;
//   bus.subscribe([](const TradeEvent& t){ /* update P&L */ });
//   bus.subscribe([](const TradeEvent& t){ /* update risk */ });
//
//   TradeEvent fill{100.5, 1000, 'B'};
//   bus.publish(fill);             // lvalue: binds const ref, no copy
//   bus.publish(TradeEvent{101.0, 500, 'S'});  // rvalue: same cost`,
    explanation: "Forwarding references (T&&) combined with std::forward preserve value category through template instantiation: lvalues stay lvalues, rvalues stay rvalues. In an event bus, this prevents unnecessary copies of large event structs (e.g. full order book snapshot) when publishing to multiple subscribers."
  },
  {
    id: "cpp-20260803-b1-move-only-order",
    language: "cpp",
    title: "Move-Only Order Type for Unique Ownership Semantics",
    tag: "modern-cpp",
    code: `#include <string>
#include <utility>
#include <vector>

// Orders have a unique lifecycle: only one component owns them at a time.
// Deleting copy prevents accidental duplication of live orders.
struct Order {
    int         id;
    double      price;
    int         qty;
    char        side;
    std::string symbol;

    // Explicitly movable, not copyable
    Order(int id_, double p, int q, char s, std::string sym)
        : id(id_), price(p), qty(q), side(s), symbol(std::move(sym)) {}

    Order(const Order&)            = delete;
    Order& operator=(const Order&) = delete;
    Order(Order&&)                 = default;
    Order& operator=(Order&&)      = default;
};

// A queue that takes ownership of orders — no copies, just moves
class OrderQueue {
    std::vector<Order> orders_;
public:
    void enqueue(Order&& o) { orders_.push_back(std::move(o)); }
    Order dequeue() {
        Order o = std::move(orders_.front());
        orders_.erase(orders_.begin());
        return o;
    }
    bool empty() const { return orders_.empty(); }
};

int main() {
    Order o{42, 100.5, 1000, 'B', "AAPL"};
    OrderQueue q;
    q.enqueue(std::move(o));   // o is now "moved-from" — intentional
    // q.enqueue(o);            // compile error: copy deleted
    Order filled = q.dequeue();
    (void)filled;
}`,
    explanation: "Deleting the copy constructor makes the type semantics explicit: order ownership transfers via move, and you cannot accidentally send the same order to two systems. The compiler enforces single-owner discipline at compile time, preventing a class of OMS bugs where fills are processed twice."
  },
  {
    id: "cpp-20260803-b1-vanna",
    language: "cpp",
    title: "Vanna Greek: Cross-Sensitivity dDelta/dVol",
    tag: "numerics",
    code: `#include <cmath>

// Vanna = d(Delta)/d(sigma) = d(Vega)/d(S)
// For a European call (no dividends):
//   Vanna = -N'(d1) * d2 / sigma
// where d1, d2 are standard BS d1, d2 and N'(x) = phi(x) is the standard normal PDF.

static double phi(double x) {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * M_PI);
}

struct VannaResult { double vanna; double d1; double d2; };

VannaResult bs_vanna(double S, double K, double r, double sigma, double T) {
    double sqrtT = std::sqrt(T);
    double d1 = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    double d2 = d1 - sigma * sqrtT;

    // Vanna: sensitivity of delta to a 1-vol-point move (in sigma units)
    double vanna = -phi(d1) * d2 / sigma;

    return { vanna, d1, d2 };
}

// With continuous dividend yield q:
//   Vanna = -exp(-q*T) * N'(d1) * d2 / sigma
double bs_vanna_div(double S, double K, double r, double q, double sigma, double T) {
    double sqrtT = std::sqrt(T);
    double d1 = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    double d2 = d1 - sigma * sqrtT;
    return -std::exp(-q * T) * phi(d1) * d2 / sigma;
}`,
    explanation: "Vanna measures how delta changes as implied vol shifts — critical for vol surface delta-hedging (sticky-delta vs sticky-strike). When the smile is steeply skewed, vanna tells you how much your hedge ratio will change as the underlying moves into/out of the skew regime, a key input to skew-weighted hedging strategies."
  },
  {
    id: "cpp-20260803-b1-volga",
    language: "cpp",
    title: "Volga/Vomma Greek: Second-Order Vol Sensitivity",
    tag: "numerics",
    code: `#include <cmath>

// Volga (Vomma) = d^2V/dsigma^2 = dVega/dsigma
// For a European call:
//   Vega = S * N'(d1) * sqrt(T)
//   Volga = Vega * d1 * d2 / sigma

static double phi(double x) {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * M_PI);
}

struct VolgaResult { double vega; double volga; };

VolgaResult bs_volga(double S, double K, double r, double sigma, double T) {
    double sqrtT = std::sqrt(T);
    double d1 = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    double d2 = d1 - sigma * sqrtT;

    double vega  = S * phi(d1) * sqrtT;
    double volga = vega * d1 * d2 / sigma;  // d1*d2 may be negative for deep OTM

    return { vega, volga };
}

// Volga-Vanna-Vega (VVV) model: price exotic by vol expansion around ATM
//   C_exotic ≈ C_BS + vanna * (vol_skew) + 0.5 * volga * (vol_convexity)
// Used in FX options for barrier and digital pricing as a first-order correction.

// ATM volga: d1=-d2=vol*sqrt(T)/2, so volga = -Vega*(vol*sqrt(T)/2)^2/vol
double atm_volga_approx(double S, double r, double sigma, double T) {
    double vega   = S * phi(0.0) * std::sqrt(T);   // N'(0) = 1/sqrt(2pi)
    double vol_sqT = sigma * std::sqrt(T);
    return -vega * (vol_sqT / 2.0) * (vol_sqT / 2.0) / sigma;
}`,
    explanation: "Volga quantifies how vega changes as the vol surface shifts in parallel — an option with high positive volga profits when vol-of-vol increases (long gamma on the vol surface). Risk-neutral VVV replication uses vanna and volga to map exotic payoffs onto a portfolio of vanillas, enabling model-free pricing of barriers in the FX market."
  },
  {
    id: "cpp-20260803-b1-latch-parallel-mc",
    language: "cpp",
    title: "std::latch for Parallel Monte Carlo Fan-Out (C++20)",
    tag: "modern-cpp",
    code: `#include <latch>
#include <thread>
#include <vector>
#include <atomic>
#include <cmath>
#include <random>

// Use std::latch to fan out MC work across threads and collect results.
// std::latch is a single-use countdown — perfect for one-shot barrier sync.
double parallel_mc_call(double S, double K, double r, double sigma,
                         double T, int n_threads, int paths_per_thread,
                         unsigned long long seed = 42) {
    std::atomic<double> total_payoff{0.0};
    std::latch done{n_threads};

    auto worker = [&](int thread_id) {
        std::mt19937_64 rng(seed + thread_id);
        std::normal_distribution<double> ndist(0.0, 1.0);

        double drift = (r - 0.5 * sigma * sigma) * T;
        double vol   = sigma * std::sqrt(T);
        double pv    = 0.0;

        for (int i = 0; i < paths_per_thread; ++i) {
            double S_T = S * std::exp(drift + vol * ndist(rng));
            pv += std::max(S_T - K, 0.0);
        }
        pv *= std::exp(-r * T) / paths_per_thread;

        // Atomic double accumulation via CAS
        double prev = total_payoff.load(std::memory_order_relaxed);
        while (!total_payoff.compare_exchange_weak(prev, prev + pv,
               std::memory_order_release, std::memory_order_relaxed)) {}

        done.count_down();   // signal this thread is finished
    };

    std::vector<std::thread> threads;
    for (int i = 0; i < n_threads; ++i)
        threads.emplace_back(worker, i);

    done.wait();             // blocks until all n_threads count_down

    for (auto& t : threads) t.join();
    return total_payoff.load() / n_threads;
}`,
    explanation: "std::latch is a single-use countdown barrier: each thread decrements with count_down(), and wait() blocks until the count reaches zero. Unlike std::barrier (multi-phase), a latch cannot be reset — making it semantically clear that this is a one-shot completion gate, not a cyclic rendezvous."
  },
  {
    id: "cpp-20260803-b1-atomic-running-max",
    language: "cpp",
    title: "Lock-Free Running Maximum via Atomic Compare-Exchange",
    tag: "lock-free",
    code: `#include <atomic>
#include <cstdint>
#include <bit>
#include <cmath>

// Lock-free running maximum for double: use CAS loop.
// Needed because there is no atomic fetch_max for doubles in std.
class AtomicMax {
    // Store double bits as uint64 — requires IEEE 754 binary64
    std::atomic<uint64_t> bits_{0};  // 0 == 0.0 (positive zero)

public:
    void update(double val) {
        uint64_t val_bits = std::bit_cast<uint64_t>(val);
        uint64_t prev     = bits_.load(std::memory_order_relaxed);
        while (std::bit_cast<double>(prev) < val) {
            if (bits_.compare_exchange_weak(prev, val_bits,
                std::memory_order_release, std::memory_order_relaxed))
                break;
        }
    }

    double get() const {
        return std::bit_cast<double>(bits_.load(std::memory_order_acquire));
    }
};

// Use for tracking the all-time high ask price across threads:
//   AtomicMax high_water_mark;
//   // From any feed thread:
//   high_water_mark.update(tick.ask_price);
//   double peak = high_water_mark.get();

// Same pattern for atomic minimum: invert the comparison.
// NOTE: NaN comparisons will fail; guard with isfinite() before update.`,
    explanation: "std::atomic<double> supports load/store/exchange but not arithmetic compare-and-swap on the value. Bit-casting to uint64_t allows atomic CAS while preserving the double comparison semantics — valid because IEEE 754 positive doubles maintain the same order under uint64_t comparison (positive floats are ordered like unsigned ints)."
  },
  {
    id: "cpp-20260803-b1-two-sided-orderbook",
    language: "cpp",
    title: "Two-Sided Order Book with Bid Max-Heap and Ask Min-Heap",
    tag: "containers",
    code: `#include <queue>
#include <unordered_map>
#include <optional>
#include <cstdint>

struct Level { double price; int total_qty; };

// Bid side: max-heap (highest bid on top).
// Ask side: min-heap (lowest ask on top).
// Lazy deletion: mark cancelled levels in a side-table, skip on pop.
class TwoSidedBook {
    struct Cmp { bool operator()(const Level& a, const Level& b) { return a.price < b.price; } };
    using BidHeap = std::priority_queue<Level, std::vector<Level>, std::less<Level>>;
    using AskHeap = std::priority_queue<Level, std::vector<Level>, std::greater<Level>>;

    BidHeap bids_;
    AskHeap asks_;
    std::unordered_map<double, int> live_bid_qty_;  // price -> current live qty
    std::unordered_map<double, int> live_ask_qty_;

public:
    void add_bid(double price, int qty) { live_bid_qty_[price] += qty; bids_.push({price, 0}); }
    void add_ask(double price, int qty) { live_ask_qty_[price] += qty; asks_.push({price, 0}); }

    void cancel_bid(double price, int qty) { live_bid_qty_[price] -= qty; }
    void cancel_ask(double price, int qty) { live_ask_qty_[price] -= qty; }

    std::optional<Level> best_bid() {
        while (!bids_.empty() && live_bid_qty_[bids_.top().price] <= 0)
            bids_.pop();   // skip dead levels
        if (bids_.empty()) return std::nullopt;
        auto p = bids_.top().price;
        return Level{ p, live_bid_qty_[p] };
    }

    std::optional<Level> best_ask() {
        while (!asks_.empty() && live_ask_qty_[asks_.top().price] <= 0)
            asks_.pop();
        if (asks_.empty()) return std::nullopt;
        auto p = asks_.top().price;
        return Level{ p, live_ask_qty_[p] };
    }

    std::optional<double> mid() {
        auto b = best_bid(), a = best_ask();
        if (!b || !a) return std::nullopt;
        return (b->price + a->price) * 0.5;
    }
};`,
    explanation: "Lazy deletion avoids rebuilding the heap on every cancel: dead levels are left in the heap but skipped on best-price queries. This exploits the fact that most cancellations are deep in the book and rarely reach the top; for events that do reach the top, the while-loop pops them in amortised O(1) per level since each is pushed and popped once."
  },
  {
    id: "cpp-20260803-b1-format-trade-log",
    language: "cpp",
    title: "std::format for Structured Trade Confirmation Logging (C++20)",
    tag: "modern-cpp",
    code: `#include <format>
#include <string>
#include <chrono>
#include <cstdint>

// Trade execution record
struct Fill {
    int         order_id;
    std::string symbol;
    char        side;       // 'B' or 'S'
    double      price;
    int         qty;
    uint64_t    timestamp_ns;
};

// Format a trade fill as a fixed-width audit log line.
// std::format is locale-independent and avoids printf's type safety issues.
std::string format_fill(const Fill& f) {
    return std::format(
        "[{:>20} ns] FILL oid={:>10} {:>6} {:<4} qty={:>8} @ {:>10.4f}",
        f.timestamp_ns,
        f.order_id,
        f.symbol,
        f.side == 'B' ? "BUY" : "SELL",
        f.qty,
        f.price
    );
}

// Format a reject with reason code
std::string format_reject(int order_id, std::string_view reason) {
    return std::format("[REJECT] oid={:>10} reason={}", order_id, reason);
}

// Example output:
//   [ 1722639600000000123 ns] FILL oid=      1001 AAPL BUY  qty=    1000 @   150.2500
//   [REJECT] oid=      1002 reason=Position limit exceeded

// std::format compiles the format string at compile time (C++20 consteval),
// catching format/type mismatches before the program runs.`,
    explanation: "std::format replaces snprintf with type-safe, composable formatting checked at compile time. Unlike std::ostringstream, it writes directly to a string without locale overhead. Fixed-width fields enable column-aligned log files that grep and awk can slice efficiently — useful for post-trade TCA reports."
  },
  {
    id: "cpp-20260803-b1-hugepage-mmap",
    language: "cpp",
    title: "Hugepage-Backed Ring Buffer via MAP_HUGETLB",
    tag: "low-latency",
    code: `#include <sys/mman.h>
#include <cstdint>
#include <cstddef>
#include <stdexcept>
#include <cstring>

// Hugepage (2 MB) ring buffer for kernel-bypass / DPDK-style packet capture.
// Hugepages eliminate TLB misses: 512 4-KB pages → 1 TLB entry.
class HugepageRingBuffer {
    static constexpr std::size_t HUGEPAGE_SIZE = 2 * 1024 * 1024;  // 2 MB

    std::byte*    buf_  = nullptr;
    std::size_t   cap_  = 0;
    std::size_t   head_ = 0;  // producer writes here
    std::size_t   tail_ = 0;  // consumer reads here

public:
    explicit HugepageRingBuffer(std::size_t n_hugepages = 1) {
        cap_ = n_hugepages * HUGEPAGE_SIZE;
        buf_ = static_cast<std::byte*>(
            mmap(nullptr, cap_,
                 PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                 -1, 0));
        if (buf_ == MAP_FAILED)
            throw std::runtime_error("hugepage mmap failed: check /proc/sys/vm/nr_hugepages");
        std::memset(buf_, 0, cap_);  // fault in all pages immediately
    }

    ~HugepageRingBuffer() { if (buf_ != MAP_FAILED) munmap(buf_, cap_); }

    bool write(const void* data, std::size_t len) {
        if (len > cap_ - (head_ - tail_)) return false;  // full
        std::memcpy(buf_ + (head_ % cap_), data, len);
        head_ += len;
        return true;
    }

    std::size_t read(void* dst, std::size_t len) {
        std::size_t avail = head_ - tail_;
        std::size_t n     = len < avail ? len : avail;
        std::memcpy(dst, buf_ + (tail_ % cap_), n);
        tail_ += n;
        return n;
    }
};
// Enable hugepages: echo N > /proc/sys/vm/nr_hugepages`,
    explanation: "Standard 4 KB pages mean a 2 MB ring buffer requires 512 TLB entries; a hugepage covers the same area with one entry. At 10 Mpkt/s, TLB misses become the dominant latency source — hugepages reduce translation overhead by 99.8% for DMA receive rings and low-latency message queues."
  },
  {
    id: "cpp-20260803-b1-avx2-batch-delta",
    language: "cpp",
    title: "AVX2 Vectorized Batch Black-Scholes Delta",
    tag: "low-latency",
    code: `#include <immintrin.h>
#include <cmath>
#include <vector>
#include <cstddef>

// Vectorized Black-Scholes N(d1) for batches of 8 positions (float).
// Uses Abramowitz-Stegun rational approximation: max error ~7.5e-8.
inline __m256 avx2_ncdf(const __m256 x) {
    const __m256 p   = _mm256_set1_ps(0.2316419f);
    const __m256 b1  = _mm256_set1_ps( 0.319381530f);
    const __m256 b2  = _mm256_set1_ps(-0.356563782f);
    const __m256 b3  = _mm256_set1_ps( 1.781477937f);
    const __m256 b4  = _mm256_set1_ps(-1.821255978f);
    const __m256 b5  = _mm256_set1_ps( 1.330274429f);
    const __m256 c   = _mm256_set1_ps(0.39894228f);   // 1/sqrt(2pi)
    const __m256 one = _mm256_set1_ps(1.0f);
    const __m256 neg = _mm256_set1_ps(-0.0f);

    __m256 ax  = _mm256_andnot_ps(neg, x);              // |x|
    __m256 t   = _mm256_div_ps(one, _mm256_fmadd_ps(p, ax, one)); // t=1/(1+p|x|)
    __m256 e   = _mm256_exp_ps(_mm256_mul_ps(                       // exp(-x^2/2)
                     _mm256_mul_ps(ax, ax), _mm256_set1_ps(-0.5f)));
    __m256 poly = _mm256_fmadd_ps(b5, t, b4);
    poly = _mm256_fmadd_ps(poly, t, b3);
    poly = _mm256_fmadd_ps(poly, t, b2);
    poly = _mm256_fmadd_ps(poly, t, b1);
    poly = _mm256_mul_ps(poly, t);
    __m256 Ncdf_pos = _mm256_fnmadd_ps(_mm256_mul_ps(c, e), poly, one);
    // N(-|x|) = 1 - N(|x|)
    __m256 neg_mask = _mm256_cmp_ps(x, _mm256_setzero_ps(), _CMP_LT_OS);
    return _mm256_blendv_ps(Ncdf_pos, _mm256_sub_ps(one, Ncdf_pos), neg_mask);
}

// Compute call delta = N(d1) for 8 positions at once
void batch_call_delta(const float* S, const float* K, const float* r,
                      const float* sigma, const float* T,
                      float* delta_out, std::size_t n) {
    std::size_t i = 0;
    for (; i + 8 <= n; i += 8) {
        __m256 s   = _mm256_loadu_ps(S + i);
        __m256 k   = _mm256_loadu_ps(K + i);
        __m256 rv  = _mm256_loadu_ps(r + i);
        __m256 sig = _mm256_loadu_ps(sigma + i);
        __m256 tv  = _mm256_loadu_ps(T + i);

        __m256 sqrtT = _mm256_sqrt_ps(tv);
        __m256 d1 = _mm256_div_ps(
            _mm256_add_ps(
                _mm256_log_ps(_mm256_div_ps(s, k)),
                _mm256_mul_ps(_mm256_fmadd_ps(
                    _mm256_set1_ps(0.5f), _mm256_mul_ps(sig, sig), rv), tv)),
            _mm256_mul_ps(sig, sqrtT));
        _mm256_storeu_ps(delta_out + i, avx2_ncdf(d1));
    }
    // Scalar tail
    for (; i < n; ++i) {
        float d1 = (std::log(S[i]/K[i]) + (r[i] + 0.5f*sigma[i]*sigma[i])*T[i])
                   / (sigma[i] * std::sqrt(T[i]));
        delta_out[i] = 0.5f * std::erfc(-d1 / std::sqrt(2.0f));
    }
}`,
    explanation: "AVX2 processes 8 single-precision floats per instruction, allowing a risk engine to compute deltas for 8 positions in roughly the same time as 1 scalar computation. The Abramowitz-Stegun polynomial avoids the slower SVML erfc call; _mm256_exp_ps uses the hardware-accelerated FP unit. Compile with -O3 -march=native -mavx2."
  },
  {
    id: "cpp-20260803-b1-merton-jump",
    language: "cpp",
    title: "Merton Jump-Diffusion Option Pricing (Series Expansion)",
    tag: "numerics",
    code: `#include <cmath>
#include <vector>
#include <numeric>

// Merton (1976): S_t follows GBM + compound Poisson jumps.
// Jump size ln(1+J) ~ N(mu_j, sigma_j^2); jump intensity lambda.
// Option price = Poisson-weighted sum of BS prices with adjusted params.

static double ncdf(double x) { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }

static double bs_call(double S, double K, double r, double sig, double T) {
    if (T < 1e-12 || sig < 1e-12) return std::max(S - K * std::exp(-r*T), 0.0);
    double sqrtT = std::sqrt(T);
    double d1 = (std::log(S / K) + (r + 0.5*sig*sig)*T) / (sig*sqrtT);
    double d2 = d1 - sig * sqrtT;
    return S * ncdf(d1) - K * std::exp(-r*T) * ncdf(d2);
}

double merton_jump_call(double S, double K, double r, double sigma,
                         double T, double lambda, double mu_j, double sigma_j,
                         int n_terms = 20) {
    double kbar   = std::exp(mu_j + 0.5 * sigma_j * sigma_j) - 1.0;  // E[J]
    double lambda_p = lambda * (1.0 + kbar);  // risk-neutral intensity

    double price = 0.0;
    double log_fact = 0.0;  // log(n!)

    for (int n = 0; n < n_terms; ++n) {
        // Poisson weight: e^{-lambda' T} (lambda' T)^n / n!
        double log_weight = -lambda_p * T + n * std::log(lambda_p * T) - log_fact;
        double weight     = std::exp(log_weight);

        // Adjusted params for n-th term
        double r_n   = r - lambda * kbar + n * std::log(1.0 + kbar) / T;
        double var_n = sigma * sigma + n * sigma_j * sigma_j / T;
        double sig_n = std::sqrt(var_n);

        price += weight * bs_call(S, K, r_n, sig_n, T);
        if (n > 0) log_fact += std::log(static_cast<double>(n + 1));
    }
    return price;
}`,
    explanation: "Merton's formula expresses the jump-diffusion price as an infinite Poisson mixture of Black-Scholes prices, each conditioned on exactly n jumps occurring in [0,T]. Because the jump size is log-normal, each term is a closed-form BS call. 20 terms is typically sufficient since the Poisson tail decays rapidly for lambda*T < 5."
  },
  {
    id: "cpp-20260803-b1-sabr-hagan",
    language: "cpp",
    title: "SABR Hagan-Kumar Implied Vol Approximation",
    tag: "numerics",
    code: `#include <cmath>
#include <stdexcept>

// SABR (Stochastic Alpha Beta Rho) model: Hagan et al. (2002) formula.
// Parameters: alpha (ATM vol level), beta (elasticity in [0,1]),
//             rho (spot-vol correlation), nu (vol-of-vol).
// F = forward price, K = strike, T = expiry in years.
double sabr_implied_vol(double F, double K, double T,
                         double alpha, double beta,
                         double rho, double nu) {
    if (alpha <= 0 || nu <= 0 || T <= 0)
        throw std::invalid_argument("SABR: alpha, nu, T must be positive");

    double log_FK = std::log(F / K);
    double FKmid  = std::sqrt(F * K);
    double FKb    = std::pow(FKmid, 1.0 - beta);   // (FK)^{(1-beta)/2} * 2 → (FK)^{1-beta}

    // Time-to-expiry correction terms (same for ATM and off-ATM)
    double t1 = (1.0-beta)*(1.0-beta)/24.0 * alpha*alpha / (FKb * FKb);
    double t2 = 0.25 * rho * beta * nu * alpha / std::pow(FKmid, 1.0 - beta);
    double t3 = (2.0 - 3.0*rho*rho) / 24.0 * nu*nu;
    double T_correction = 1.0 + (t1 + t2 + t3) * T;

    if (std::abs(log_FK) < 1e-8) {
        // ATM: avoid 0/0 in z/chi
        return alpha / std::pow(F, 1.0 - beta) * T_correction;
    }

    // z and chi for off-ATM
    double z   = nu / alpha * std::pow(FKmid, 1.0 - beta) * log_FK;
    double sq  = std::sqrt(1.0 - 2.0*rho*z + z*z);
    double chi = std::log((sq + z - rho) / (1.0 - rho));

    // Log-moneyness expansion (denominator correction)
    double lm2   = log_FK * log_FK;
    double lm4   = lm2 * lm2;
    double b1mb2 = (1.0-beta)*(1.0-beta);
    double denom = FKb * (1.0 + b1mb2/24.0 * lm2 + b1mb2*b1mb2/1920.0 * lm4);

    return alpha / denom * (z / chi) * T_correction;
}`,
    explanation: "SABR is the standard smile model for FX and rates: it has four parameters (α, β, ρ, ν) and produces an analytic approximate implied vol via Hagan et al.'s formula. β=1 gives log-normal local vol (normal vol surface), β=0 gives normal process; ρ controls skew, ν controls convexity. Calibration fits the formula to market strikes at each expiry."
  },
  {
    id: "cpp-20260803-b1-inclusive-scan-pnl",
    language: "cpp",
    title: "std::inclusive_scan for Cumulative P&L and Max Drawdown",
    tag: "modern-cpp",
    code: `#include <numeric>
#include <vector>
#include <algorithm>
#include <functional>

// Compute cumulative P&L and running peak using parallel-friendly prefix scans.
struct DrawdownStats {
    std::vector<double> cum_pnl;     // cumulative P&L at each time step
    std::vector<double> running_max; // running peak P&L
    std::vector<double> drawdown;    // cum_pnl - running_max (always <= 0)
    double max_drawdown;             // worst drawdown
};

DrawdownStats compute_drawdown(const std::vector<double>& daily_pnl) {
    int n = static_cast<int>(daily_pnl.size());
    DrawdownStats s;

    // Cumulative P&L: inclusive scan with + operator
    s.cum_pnl.resize(n);
    std::inclusive_scan(daily_pnl.begin(), daily_pnl.end(),
                        s.cum_pnl.begin(), std::plus<double>{}, 0.0);

    // Running maximum: inclusive scan with max
    s.running_max.resize(n);
    std::inclusive_scan(s.cum_pnl.begin(), s.cum_pnl.end(),
                        s.running_max.begin(),
                        [](double a, double b){ return std::max(a, b); });

    // Drawdown = cum_pnl - running_max
    s.drawdown.resize(n);
    std::transform(s.cum_pnl.begin(), s.cum_pnl.end(),
                   s.running_max.begin(), s.drawdown.begin(),
                   std::minus<double>{});

    s.max_drawdown = *std::min_element(s.drawdown.begin(), s.drawdown.end());
    return s;
}`,
    explanation: "std::inclusive_scan generalises std::partial_sum to arbitrary binary operators and supports parallel execution policies (std::execution::par). Using it for running-max produces the peak-equity curve in a single pass, enabling O(n) drawdown computation without a separate loop — important for computing Calmar ratios over millions of strategy trajectories."
  },
  {
    id: "cpp-20260803-b1-enable-if-qty",
    language: "cpp",
    title: "enable_if Overload Selection for Integer vs Float Quantities",
    tag: "sfinae",
    code: `#include <type_traits>
#include <stdexcept>
#include <cmath>

// Order processing: integer quantities (whole shares) vs fractional (crypto, ETF).
// enable_if selects the correct validation and rounding behaviour at compile time.

// Integer quantity: must be positive whole number
template <typename T>
std::enable_if_t<std::is_integral_v<T>, bool>
validate_qty(T qty, T min_lot = T{1}) {
    return qty > T{0} && qty % min_lot == T{0};
}

// Floating-point quantity: must be positive, finite, above minimum notional
template <typename T>
std::enable_if_t<std::is_floating_point_v<T>, bool>
validate_qty(T qty, T min_lot = T{0.001}) {
    return std::isfinite(qty) && qty >= min_lot;
}

// Round quantity to lot size: only defined for integral types
template <typename T>
std::enable_if_t<std::is_integral_v<T>, T>
round_to_lot(T qty, T lot_size) {
    return (qty / lot_size) * lot_size;  // integer division truncates
}

// Fractional rounding for crypto lots
template <typename T>
std::enable_if_t<std::is_floating_point_v<T>, T>
round_to_lot(T qty, T lot_size) {
    return std::floor(qty / lot_size) * lot_size;
}

// Usage:
//   validate_qty(100, 10);     // equities: OK (100 % 10 == 0)
//   validate_qty(1.234, 0.01); // crypto: OK (1.234 >= 0.01)
//   round_to_lot(1237, 100);   // equities: 1200
//   round_to_lot(1.237, 0.01); // crypto: 1.23`,
    explanation: "enable_if overloading dispatches at compile time based on type traits, producing zero-overhead branching — unlike a runtime if-statement, the wrong branch doesn't compile at all. For order validation, this means the crypto fractional-lot path literally does not exist in the equities build, preventing category-error bugs at link time."
  },
  {
    id: "cpp-20260803-b1-spaceship-order-key",
    language: "cpp",
    title: "Spaceship Operator (<=>) for Composite Order Sort Key",
    tag: "modern-cpp",
    code: `#include <compare>
#include <string>
#include <vector>
#include <algorithm>
#include <cstdint>

// Composite sort key for an order in a matching engine:
// Priority: (price descending for bids, time ascending, seq ascending)
struct OrderKey {
    double    price;     // compare inverted for bids
    uint64_t  timestamp; // arrival time
    uint64_t  seq_no;    // tiebreaker

    // Spaceship auto-generates ==, !=, <, >, <=, >= from this one function
    std::strong_ordering operator<=>(const OrderKey& o) const {
        // Higher price wins (max-heap for bids): invert comparison
        if (auto c = o.price <=> price; c != 0) return c;     // descending price
        if (auto c = timestamp <=> o.timestamp; c != 0) return c; // FIFO
        return seq_no <=> o.seq_no;
    }
    bool operator==(const OrderKey&) const = default;  // required with <=>
};

// All six comparison operators are now available for free
struct Order {
    OrderKey key;
    int      qty;
    double   limit_price;
};

// Sort orders by execution priority
std::vector<Order> prioritise(std::vector<Order> orders) {
    std::sort(orders.begin(), orders.end(),
              [](const Order& a, const Order& b){ return a.key < b.key; });
    return orders;
}`,
    explanation: "C++20's spaceship operator (<=>) generates all six comparison operators from a single definition; default = comparison is generated alongside it. The composite key (price DESC, time ASC, seq ASC) encodes price-time-priority: same-price orders compete by arrival time, then sequence number as a tiebreaker for same-microsecond bursts."
  },
  {
    id: "cpp-20260803-b1-almgren-chriss",
    language: "cpp",
    title: "Almgren-Chriss Linear Market Impact Optimal Execution",
    tag: "numerics",
    code: `#include <vector>
#include <cmath>
#include <cstddef>

// Almgren-Chriss (2001) model: linear permanent and temporary impact.
// Liquidate X shares over T periods with N slices.
// Permanent impact: g(v) = eta * v (shifts the fundamental price).
// Temporary impact: h(v) = gamma * v (shifts only the execution price).
// Optimal strategy minimises E[cost] + lambda * Var[cost].

struct ACParams {
    double eta;    // permanent impact coefficient
    double gamma;  // temporary impact coefficient
    double sigma;  // volatility per period
    double lambda; // risk-aversion parameter
};

struct ACResult {
    std::vector<double> trade_list;  // shares to trade per period
    std::vector<double> inventory;   // remaining inventory
    double expected_cost;
    double cost_variance;
};

ACResult almgren_chriss_optimal(double X, int N, const ACParams& p) {
    // Closed-form solution: trade_rate = X * sinh(kappa * (N-n)) / sinh(kappa * N)
    // kappa: solution to: 2*lambda*sigma^2 = kappa^2 * gamma / (sinh(kappa/2))^2
    // For simplicity: solve via the linearised closed form.

    double tau   = 1.0;  // period length = 1 (normalised)
    double kappa = std::sqrt(p.lambda * p.sigma * p.sigma / p.gamma);

    std::vector<double> trades(N), inventory(N + 1);
    inventory[0] = X;

    for (int n = 0; n < N; ++n) {
        double x_n = X * std::sinh(kappa * (N - n)) / std::sinh(kappa * N);
        trades[n]  = inventory[n] - x_n;
        inventory[n + 1] = x_n;
    }

    // Expected cost = permanent impact contribution
    double E_cost = 0.5 * p.eta * X * X + p.gamma * X * X / N;
    double V_cost = p.sigma * p.sigma * tau / 3.0 * X * X;

    return { trades, inventory, E_cost, V_cost };
}`,
    explanation: "Almgren-Chriss decomposes execution cost into permanent impact (proportional to total quantity, irreversible — shifts the fundamental price) and temporary impact (proportional to instantaneous rate, reversible). The optimal schedule balances market impact cost against variance: higher risk aversion (lambda) favours faster execution despite higher temporary impact."
  },
  {
    id: "cpp-20260803-b1-variance-gamma-mc",
    language: "cpp",
    title: "Variance Gamma Process Monte Carlo Option Pricing",
    tag: "numerics",
    code: `#include <random>
#include <cmath>
#include <algorithm>
#include <vector>

// Variance Gamma (VG): a Brownian motion with drift subordinated to a Gamma clock.
// Parameters: sigma (diffusion), theta (drift), nu (variance of the Gamma time).
// VG process: X(t; sigma, nu, theta) = theta*G(t;nu) + sigma*W(G(t;nu))
// where G(t;nu) ~ Gamma(t/nu, nu) is the stochastic clock.

double vg_call_mc(double S0, double K, double r, double T,
                   double sigma, double theta, double nu,
                   int n_paths = 100'000, unsigned seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double>  ndist(0.0, 1.0);
    std::gamma_distribution<double>   gdist;

    // Risk-neutral correction: subtract log-characteristic-function at u=i
    // omega = (1/nu) * log(1 - theta*nu - 0.5*sigma^2*nu)
    double omega = (1.0 / nu) * std::log(1.0 - theta*nu - 0.5*sigma*sigma*nu);

    double payoff_sum = 0.0;
    for (int i = 0; i < n_paths; ++i) {
        // Draw Gamma-subordinated time increment
        gdist = std::gamma_distribution<double>(T / nu, nu);
        double g = gdist(rng);   // G ~ Gamma(T/nu, nu)

        // VG increment
        double X = theta * g + sigma * std::sqrt(g) * ndist(rng);

        // VG asset price under risk-neutral measure
        double S_T = S0 * std::exp((r + omega) * T + X);
        payoff_sum += std::max(S_T - K, 0.0);
    }
    return std::exp(-r * T) * payoff_sum / n_paths;
}`,
    explanation: "The Variance Gamma process introduces fat tails and skewness by randomising the Brownian clock with a Gamma process — the Gamma increment G represents stochastic trading activity. VG options prices fit real equity smiles better than Black-Scholes and have semi-analytic formulas via Fourier inversion; MC serves as a validation baseline."
  },
  {
    id: "cpp-20260803-b1-requires-orderbook",
    language: "cpp",
    title: "C++20 requires Clause for Order Book Operations",
    tag: "concepts",
    code: `#include <concepts>
#include <type_traits>
#include <optional>

// Define a concept for any order book that supports the standard operations.
template<typename Book>
concept OrderBook = requires(Book b, double price, int qty) {
    { b.add_bid(price, qty) }   -> std::same_as<void>;
    { b.add_ask(price, qty) }   -> std::same_as<void>;
    { b.cancel_bid(price, qty) } -> std::same_as<void>;
    { b.cancel_ask(price, qty) } -> std::same_as<void>;
    { b.best_bid() }            -> std::convertible_to<std::optional<double>>;
    { b.best_ask() }            -> std::convertible_to<std::optional<double>>;
};

// Generic market-maker that works with any OrderBook implementation
template<OrderBook Book>
class MarketMaker {
    Book& book_;
    double spread_;

public:
    MarketMaker(Book& book, double spread)
        : book_(book), spread_(spread) {}

    void quote(double mid) {
        double half = spread_ * 0.5;
        book_.add_bid(mid - half, 100);
        book_.add_ask(mid + half, 100);
    }

    std::optional<double> mid() const {
        auto b = book_.best_bid();
        auto a = book_.best_ask();
        if (!b || !a) return std::nullopt;
        return (*b + *a) * 0.5;
    }
};

// Any type satisfying the OrderBook concept can be used:
//   TwoSidedBook mybook;
//   MarketMaker mm(mybook, 0.02);
//   mm.quote(100.0);`,
    explanation: "The requires clause in C++20 concepts describes structural requirements without inheritance: any type that exposes the correct methods and return types satisfies the concept — enabling duck typing with compile-time guarantees. This separates the order book interface from implementation, letting the matching engine swap between a hash-based and tree-based book without changing the market-maker logic."
  },
  {
    id: "cpp-20260803-b1-robin-hood-map",
    language: "cpp",
    title: "Robin Hood Open-Addressing HashMap for Order ID Lookup",
    tag: "containers",
    code: `#include <vector>
#include <cstdint>
#include <cstring>
#include <optional>
#include <cassert>

// Robin Hood hashing: on collision, steal the slot from the entry with smaller
// probe distance (PSL). Keeps max probe sequence length (PSL) low.
template <typename Value>
class RobinHoodMap {
    struct Slot {
        uint64_t key = 0;
        Value    val{};
        int      psl = -1;  // -1 = empty
    };

    std::vector<Slot> table_;
    std::size_t       size_  = 0;
    std::size_t       cap_;

    std::size_t idx(uint64_t k) const { return k % cap_; }

public:
    explicit RobinHoodMap(std::size_t cap = 256) : cap_(cap), table_(cap) {}

    void insert(uint64_t key, Value val) {
        if (size_ >= cap_ * 7 / 10)
            throw std::runtime_error("load factor exceeded");
        Slot ins{key, std::move(val), 0};
        std::size_t pos = idx(key);
        for (;;) {
            if (table_[pos].psl < 0) {         // empty: place here
                table_[pos] = std::move(ins);
                ++size_;
                return;
            }
            if (table_[pos].key == ins.key) {  // update
                table_[pos].val = std::move(ins.val);
                return;
            }
            if (table_[pos].psl < ins.psl) {   // Robin Hood: steal from rich
                std::swap(table_[pos], ins);
            }
            pos = (pos + 1) % cap_;
            ++ins.psl;
        }
    }

    std::optional<Value*> find(uint64_t key) {
        std::size_t pos = idx(key);
        for (int psl = 0; ; ++psl, pos = (pos + 1) % cap_) {
            if (table_[pos].psl < 0 || table_[pos].psl < psl)
                return std::nullopt;
            if (table_[pos].key == key)
                return &table_[pos].val;
        }
    }
};`,
    explanation: "Robin Hood hashing limits worst-case probe sequence length by swapping slots so that all elements with the same distance live no more than a small constant apart. This gives better cache utilisation than separate chaining and more predictable O(1) lookups for order-ID-to-order-record tables than std::unordered_map's bucket list."
  },
];
