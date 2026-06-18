import type { Snippet } from "./types";

export const cppSnippets20260618B1: Snippet[] = [
  {
    id: "cpp-20260618-b1-cranknich-fd",
    language: "cpp",
    title: "Crank-Nicolson implicit FD — unconditionally stable BS PDE",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>
#include <stdexcept>

// Crank-Nicolson (CN) is the average of explicit and implicit Euler in time.
// It is second-order accurate in both dt and dS, and unconditionally stable
// (no Courant condition on dt). Requires solving a tridiagonal system per step.
// System: A * V_new = B * V_old  where A and B are tridiagonal matrices.

static void tridiagonalSolve(const std::vector<double>& lower,
                              const std::vector<double>& diag,
                              const std::vector<double>& upper,
                              std::vector<double>& rhs) {
    // Thomas algorithm: O(N) forward sweep + back substitution
    int N = static_cast<int>(diag.size());
    std::vector<double> c_(N), d_(N);
    c_[0] = upper[0] / diag[0];
    d_[0] = rhs[0]   / diag[0];
    for (int i = 1; i < N; ++i) {
        double m = diag[i] - lower[i] * c_[i-1];
        c_[i] = upper[i] / m;
        d_[i] = (rhs[i] - lower[i] * d_[i-1]) / m;
    }
    rhs[N-1] = d_[N-1];
    for (int i = N-2; i >= 0; --i) rhs[i] = d_[i] - c_[i] * rhs[i+1];
}

double crankNicolsonCall(double S0, double K, double r, double sigma, double T,
                         int M = 200, int N = 200) {
    const double S_max = 3.0 * K;
    const double dS = S_max / M;
    const double dt = T / N;

    std::vector<double> V(M + 1);
    for (int j = 0; j <= M; ++j) V[j] = std::max(j * dS - K, 0.0);

    // Precompute CN coefficients (constant for uniform grid)
    // alpha[j] = 0.25*sigma^2*j^2*dt, beta[j] = 0.25*r*j*dt
    // Left matrix A: 1 + alpha - r*dt/2 on diagonal, etc.
    // Right matrix B: 1 - alpha + r*dt/2 on diagonal

    std::vector<double> low(M-1), mid_A(M-1), up(M-1), rhs(M-1);

    for (int i = N-1; i >= 0; --i) {
        double t_remain = (N - i) * dt;
        // Boundary values
        double V0_new = 0.0;                                  // S=0: call = 0
        double VM_new = S_max - K * std::exp(-r * t_remain); // S=S_max: call approx

        for (int j = 1; j < M; ++j) {
            double alpha = 0.25 * sigma * sigma * j * j * dt;
            double beta  = 0.25 * r * j * dt;
            double a_lo  = -(alpha - beta);   // sub-diagonal of A
            double a_mid = 1.0 + alpha + 0.5 * r * dt;
            double a_up  = -(alpha + beta);   // super-diagonal of A
            double b_lo  =  (alpha - beta);   // sub-diagonal of B
            double b_mid = 1.0 - alpha - 0.5 * r * dt;
            double b_up  =  (alpha + beta);

            int idx = j - 1;
            low[idx]   = a_lo;
            mid_A[idx] = a_mid;
            up[idx]    = a_up;
            rhs[idx]   = b_mid * V[j];
            if (j > 1) rhs[idx] += b_lo  * V[j-1];
            if (j < M-1) rhs[idx] += b_up * V[j+1];
        }
        // Absorb boundary into rhs
        rhs[0]   -= low[0]        * V0_new;
        rhs[M-2] -= up[M-2]       * VM_new;

        tridiagonalSolve(low, mid_A, up, rhs);

        V[0] = V0_new; V[M] = VM_new;
        for (int j = 1; j < M; ++j) V[j] = rhs[j-1];
    }

    double jf = S0 / dS;
    int jl = static_cast<int>(jf);
    double f = jf - jl;
    return (1.0 - f) * V[jl] + f * V[jl + 1];
}`,
    explanation:
      "Crank-Nicolson averages the explicit and implicit updates, giving second-order accuracy in time (vs. first-order for either alone) while remaining unconditionally stable — there is no timestep restriction. The price is solving a tridiagonal linear system at each time step, handled in O(M) by the Thomas algorithm (forward elimination + back substitution), keeping the total cost O(M·N) identical to explicit FD but with much coarser time grids.",
  },
  {
    id: "cpp-20260618-b1-fix-parser",
    language: "cpp",
    title: "FIX 4.2 message parser — zero-copy tag-value extraction with string_view",
    tag: "systems",
    code: `#include <string_view>
#include <charconv>
#include <cstdint>
#include <optional>
#include <array>

// FIX protocol: ASCII tag=value pairs delimited by SOH (\\x01).
// Zero-copy parsing: string_view into the raw wire buffer — no allocations.
// Commonly parsed tags: 35=MsgType, 49=SenderCompID, 55=Symbol, 44=Price,
//                       38=OrderQty, 54=Side, 40=OrdType, 11=ClOrdID.

struct FIXField {
    int             tag;
    std::string_view value;
};

class FIXParser {
    static constexpr char SOH = '\x01';
    static constexpr int  MAX_FIELDS = 64;

    std::array<FIXField, MAX_FIELDS> fields_;
    int n_fields_ = 0;

public:
    // Parse in-place: buf must remain alive for the lifetime of parsed fields
    bool parse(std::string_view buf) noexcept {
        n_fields_ = 0;
        std::size_t pos = 0;
        while (pos < buf.size() && n_fields_ < MAX_FIELDS) {
            // Find '='
            auto eq = buf.find('=', pos);
            if (eq == std::string_view::npos) break;
            // Find SOH
            auto soh = buf.find(SOH, eq + 1);
            if (soh == std::string_view::npos) soh = buf.size();

            // Parse tag as integer (no alloc)
            int tag = 0;
            auto [ptr, ec] = std::from_chars(buf.data() + pos, buf.data() + eq, tag);
            if (ec != std::errc{}) return false;

            fields_[n_fields_++] = {tag, buf.substr(eq + 1, soh - eq - 1)};
            pos = soh + 1;
        }
        return n_fields_ > 0;
    }

    // Look up first occurrence of tag; returns empty optional if not found
    std::optional<std::string_view> get(int tag) const noexcept {
        for (int i = 0; i < n_fields_; ++i)
            if (fields_[i].tag == tag) return fields_[i].value;
        return std::nullopt;
    }

    // Typed accessors
    std::optional<double> getDouble(int tag) const noexcept {
        auto sv = get(tag);
        if (!sv) return std::nullopt;
        double val;
        auto [ptr, ec] = std::from_chars(sv->data(), sv->data() + sv->size(), val);
        return ec == std::errc{} ? std::optional{val} : std::nullopt;
    }

    std::optional<int64_t> getInt(int tag) const noexcept {
        auto sv = get(tag);
        if (!sv) return std::nullopt;
        int64_t val;
        auto [ptr, ec] = std::from_chars(sv->data(), sv->data() + sv->size(), val);
        return ec == std::errc{} ? std::optional{val} : std::nullopt;
    }

    int numFields() const noexcept { return n_fields_; }
};

// Usage example (SOH replaced with | for readability):
// "8=FIX.4.2|35=D|49=CLIENT|55=AAPL|44=180.50|38=100|54=1|40=2|11=ORD001|"
// parser.parse(raw_msg);
// auto price = parser.getDouble(44);   // 180.50
// auto qty   = parser.getInt(38);      // 100
// auto side  = parser.get(54);         // "1" = Buy`,
    explanation:
      "std::from_chars is locale-independent and allocation-free, making it the correct tool for parsing numeric fields in latency-sensitive paths. The entire parser makes zero heap allocations: all FIXField entries hold non-owning string_views into the original buffer, and the field array is stack-allocated. The caller is responsible for keeping the buffer alive — a common pattern is to parse directly into fields before the buffer is recycled.",
  },
  {
    id: "cpp-20260618-b1-seqlock",
    language: "cpp",
    title: "Seqlock — wait-free reads for frequently updated market data",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <cstring>

// Seqlock: single-writer, multiple-readers, wait-free reads.
// Writer increments sequence before and after update (odd = updating).
// Reader retries if sequence changed during read (torn read detected).
// Best for small, frequently written data that readers access very often.
// e.g. NBBO (best bid/offer) updated at MHz rates, read by many strategies.

struct NBBO {
    double bid;
    double ask;
    int32_t bid_qty;
    int32_t ask_qty;
};
static_assert(sizeof(NBBO) == 24);

class SeqlockedNBBO {
    alignas(64) std::atomic<uint64_t> seq_{0};
    NBBO data_{};
    char pad_[64 - sizeof(NBBO) - sizeof(uint64_t)] = {};  // fill cache line

public:
    // Writer side: only ONE writer permitted — no mutual exclusion here
    void write(const NBBO& nbbo) noexcept {
        seq_.fetch_add(1, std::memory_order_release);   // odd: write in progress
        std::atomic_thread_fence(std::memory_order_release);
        std::memcpy(&data_, &nbbo, sizeof(NBBO));        // non-atomic copy
        std::atomic_thread_fence(std::memory_order_release);
        seq_.fetch_add(1, std::memory_order_release);   // even: write done
    }

    // Reader side: wait-free (bounded retries in practice, but no blocking)
    NBBO read() const noexcept {
        NBBO out;
        uint64_t seq1, seq2;
        do {
            seq1 = seq_.load(std::memory_order_acquire);
            if (seq1 & 1) { /* odd: writer active, spin */
                std::atomic_signal_fence(std::memory_order_acquire);
                continue;
            }
            std::memcpy(&out, &data_, sizeof(NBBO));
            std::atomic_thread_fence(std::memory_order_acquire);
            seq2 = seq_.load(std::memory_order_acquire);
        } while (seq1 != seq2);   // retry if writer changed data during read
        return out;
    }

    // Optimistic read: returns false if torn (caller decides whether to retry)
    bool tryRead(NBBO& out) const noexcept {
        uint64_t seq1 = seq_.load(std::memory_order_acquire);
        if (seq1 & 1) return false;
        std::memcpy(&out, &data_, sizeof(NBBO));
        std::atomic_thread_fence(std::memory_order_acquire);
        return seq_.load(std::memory_order_acquire) == seq1;
    }
};

// Seqlock is strictly better than rwlock for:
//   - Small payloads (fits in a few cache lines)
//   - Write frequency is high (rwlock reader fairness causes writer starvation)
//   - Readers must never block (real-time threads)
// Limitation: readers spin-retry under high write frequency; use hazard pointers
// or RCU for large payloads where retries are expensive.`,
    explanation:
      "The seqlock's correctness relies on the sequence number's odd/even parity: an odd sequence means a write is in progress, so readers must spin. The acquire fence after memcpy prevents the CPU from reordering the post-copy sequence load before the data read, which would allow observing a new sequence number alongside stale data. On x86, all loads are acquire by default, so the fence is effectively a compiler barrier; on ARM, it generates an actual dmb ish instruction.",
  },
  {
    id: "cpp-20260618-b1-variant-dispatch",
    language: "cpp",
    title: "std::variant + std::visit for zero-overhead order event dispatch",
    tag: "modern",
    code: `#include <variant>
#include <string>
#include <cstdint>
#include <functional>

// std::variant: type-safe discriminated union. Size = max(sizeof...) + tag.
// std::visit: dispatch to the correct overload at compile time via a jump table.
// Avoids virtual dispatch overhead: no heap allocation, no vptr, inlineable.

struct NewOrderSingle {
    uint64_t    cl_ord_id;
    double      price;
    int32_t     qty;
    int8_t      side;     // 1=buy, 2=sell
    char        symbol[8];
};

struct CancelRequest {
    uint64_t  cl_ord_id;
    uint64_t  orig_cl_ord_id;
};

struct ExecutionReport {
    uint64_t  order_id;
    double    last_px;
    int32_t   last_qty;
    int32_t   cum_qty;
    int8_t    exec_type;  // 0=new, 1=partial, 2=filled, 4=cancelled
};

struct OrderCancelReject {
    uint64_t  cl_ord_id;
    int8_t    reason;     // 0=too-late, 1=unknown-order
};

using OrderEvent = std::variant<NewOrderSingle, CancelRequest,
                                ExecutionReport, OrderCancelReject>;

// Overloaded visitor pattern (C++17 deduction guide)
template<typename... Ts> struct Overloaded : Ts... { using Ts::operator()...; };
template<typename... Ts> Overloaded(Ts...) -> Overloaded<Ts...>;

// Risk engine: handle events with zero virtual calls
class RiskEngine {
    double net_position_ = 0.0;
    int    open_orders_  = 0;

public:
    void process(const OrderEvent& ev) {
        std::visit(Overloaded{
            [&](const NewOrderSingle& nos) {
                ++open_orders_;
                // Reject if would breach limit
            },
            [&](const CancelRequest&) {
                --open_orders_;
            },
            [&](const ExecutionReport& er) {
                double sign = 1.0;  // simplified
                net_position_ += sign * er.last_qty;
                if (er.exec_type == 2) --open_orders_;  // filled
            },
            [&](const OrderCancelReject&) {
                ++open_orders_;  // restore: cancel rejected
            }
        }, ev);
    }

    double position() const noexcept { return net_position_; }
    int    openOrders() const noexcept { return open_orders_; }
};

// std::variant stores type index inline (1 byte) — total size padded to alignment
static_assert(sizeof(OrderEvent) <= 64);

// vs. virtual dispatch: no heap alloc, no pointer indirection, fully inlineable
// Compiler generates a jump table: O(1) dispatch, branch-predictor-friendly`,
    explanation:
      "std::visit with a variant generates a compile-time jump table indexed by the variant's type discriminant. Unlike a virtual function call through a base-class pointer, there is no pointer indirection (no vptr lookup), the handler is a lambda that can be fully inlined, and all types are stored in contiguous stack memory. The Overloaded pattern combines multiple lambdas into a single visitor type using pack expansion of `using Ts::operator()...`.",
  },
  {
    id: "cpp-20260618-b1-crtp-pricer",
    language: "cpp",
    title: "CRTP static polymorphism — zero-cost instrument pricing dispatch",
    tag: "modern",
    code: `#include <cmath>
#include <type_traits>

// CRTP (Curiously Recurring Template Pattern): base class is parameterised
// on the derived class. Calls to virtual methods are replaced by static casts
// to Derived& — resolved at compile time, fully inlineable, zero overhead.
// Used for pricing engines where the same algorithm (e.g. MC, tree) operates
// on any instrument type without virtual dispatch overhead on hot paths.

template<typename Derived>
class Instrument {
public:
    // Static polymorphism: dispatches to Derived::payoff without vtable
    double payoff(double S_T) const noexcept {
        return static_cast<const Derived*>(this)->payoff_impl(S_T);
    }

    bool isCall() const noexcept {
        return static_cast<const Derived*>(this)->isCall_impl();
    }

    double strike() const noexcept {
        return static_cast<const Derived*>(this)->strike_impl();
    }
};

struct VanillaCall : Instrument<VanillaCall> {
    double K;
    explicit VanillaCall(double k) : K(k) {}
    double payoff_impl(double S_T) const noexcept { return std::max(S_T - K, 0.0); }
    bool   isCall_impl() const noexcept { return true; }
    double strike_impl() const noexcept { return K; }
};

struct VanillaPut : Instrument<VanillaPut> {
    double K;
    explicit VanillaPut(double k) : K(k) {}
    double payoff_impl(double S_T) const noexcept { return std::max(K - S_T, 0.0); }
    bool   isCall_impl() const noexcept { return false; }
    double strike_impl() const noexcept { return K; }
};

struct BinaryCall : Instrument<BinaryCall> {
    double K, cash;
    BinaryCall(double k, double c) : K(k), cash(c) {}
    double payoff_impl(double S_T) const noexcept { return S_T > K ? cash : 0.0; }
    bool   isCall_impl() const noexcept { return true; }
    double strike_impl() const noexcept { return K; }
};

// Generic MC pricer: works for ANY Instrument<Derived> without virtual calls
template<typename Instr>
double simpleMC(const Instrument<Instr>& inst,
                double S, double r, double sigma, double T,
                int n = 200000, unsigned seed = 42) noexcept {
    // Park-Miller LCG for reproducibility without <random> overhead
    uint64_t lcg = seed;
    auto rand01 = [&]() -> double {
        lcg = lcg * 6364136223846793005ULL + 1442695040888963407ULL;
        return (lcg >> 33) * (1.0 / (1ULL << 31));
    };
    auto boxmuller = [&]() -> double {
        double u1 = rand01() + 1e-15, u2 = rand01();
        return std::sqrt(-2.0 * std::log(u1)) * std::cos(2.0 * M_PI * u2);
    };

    double sum = 0.0;
    double disc = std::exp(-r * T);
    double drift = (r - 0.5 * sigma * sigma) * T;
    double vol   = sigma * std::sqrt(T);
    for (int i = 0; i < n; ++i) {
        double S_T = S * std::exp(drift + vol * boxmuller());
        sum += inst.payoff(S_T);
    }
    return disc * sum / n;
}

// No virtual table needed — the compiler devirtualises completely:
// simpleMC(VanillaCall{100}, 100, 0.05, 0.2, 1.0)
// simpleMC(BinaryCall{100, 1.0}, 100, 0.05, 0.2, 1.0)`,
    explanation:
      "CRTP achieves static polymorphism by injecting the derived type into the base class template parameter, allowing `static_cast<const Derived*>(this)` to call derived methods without any vtable. The compiler sees the exact derived type at the call site (`simpleMC<VanillaCall>`), so it inlines `payoff_impl` directly into the MC loop — the same loop runs at full speed for any instrument type. The cost is that heterogeneous collections (e.g. `vector<Instrument*>`) require a wrapper or type erasure.",
  },
  {
    id: "cpp-20260618-b1-string-view-parse",
    language: "cpp",
    title: "std::string_view for zero-copy market data field extraction",
    tag: "modern",
    code: `#include <string_view>
#include <charconv>
#include <cstdint>
#include <optional>
#include <array>
#include <cstring>

// std::string_view: non-owning reference to a character sequence.
// Key property: all operations (find, substr, compare) are O(1) space — no copies.
// Perfect for parsing wire-format messages where the buffer is already allocated.

// Comma-separated market data tick: "AAPL,180.25,100,B,1704067200000"
// Fields: symbol, price, qty, side, timestamp_ms
struct Tick {
    char     symbol[12];
    double   price;
    int32_t  qty;
    int8_t   side;      // 'B'=buy, 'S'=sell
    uint64_t ts_ms;
};

// Split on delimiter without allocating: returns views into src
template<int N>
int splitView(std::string_view src, char delim, std::array<std::string_view, N>& out) {
    int count = 0;
    std::size_t pos = 0;
    while (count < N) {
        auto sep = src.find(delim, pos);
        out[count++] = src.substr(pos, sep == std::string_view::npos ? sep : sep - pos);
        if (sep == std::string_view::npos) break;
        pos = sep + 1;
    }
    return count;
}

std::optional<Tick> parseTick(std::string_view line) noexcept {
    std::array<std::string_view, 5> fields;
    if (splitView<5>(line, ',', fields) < 5) return std::nullopt;

    Tick t{};

    // Symbol: copy at most 11 chars, zero-terminate
    auto sym = fields[0];
    if (sym.size() >= sizeof(t.symbol)) return std::nullopt;
    std::memcpy(t.symbol, sym.data(), sym.size());
    t.symbol[sym.size()] = '\0';

    // Price: from_chars avoids locale overhead vs atof
    auto [p1, e1] = std::from_chars(fields[1].data(),
                                     fields[1].data() + fields[1].size(), t.price);
    if (e1 != std::errc{}) return std::nullopt;

    int32_t qty;
    auto [p2, e2] = std::from_chars(fields[2].data(),
                                     fields[2].data() + fields[2].size(), qty);
    if (e2 != std::errc{}) return std::nullopt;
    t.qty = qty;

    // Side: single character
    if (fields[3].empty()) return std::nullopt;
    t.side = static_cast<int8_t>(fields[3][0]);

    auto [p4, e4] = std::from_chars(fields[4].data(),
                                     fields[4].data() + fields[4].size(), t.ts_ms);
    if (e4 != std::errc{}) return std::nullopt;

    return t;
}

// starts_with / ends_with (C++20)
bool isMsgType(std::string_view msg, std::string_view type) noexcept {
    return msg.starts_with(type);
}

// Compare without null-termination requirement
bool symbolMatches(std::string_view a, std::string_view b) noexcept {
    return a == b;   // O(N) but no allocation; compare uses SIMD on modern compilers
}`,
    explanation:
      "std::string_view's key guarantee is that substr and find never allocate — they return a new view (pointer + length pair) into the same underlying buffer. std::from_chars on a string_view is locale-independent and typically 3-10× faster than sscanf or stod because it has no locale lookup and no null-termination requirement. The splitView helper avoids building a vector<string> — the callee gets direct pointers into the wire buffer.",
  },
  {
    id: "cpp-20260618-b1-asian-mc-cv",
    language: "cpp",
    title: "Arithmetic Asian option MC with geometric control variate",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <numeric>
#include <vector>

// Arithmetic Asian call: payoff = max(A_T - K, 0), A_T = mean(S_{t_i}).
// No closed form for arithmetic mean under GBM.
// Geometric Asian G_T = (prod(S_{t_i}))^{1/N} has a closed form.
// Control variate: use G_T (known EV) to reduce variance of A_T estimator.
// MC estimator: X_CV = X_arith - beta * (Y_geom - E[Y_geom])
// where beta = Cov(X_arith, Y_geom) / Var(Y_geom).

// Geometric Asian closed form (Kemna & Vorst 1990)
static double geometricAsianCall(double S0, double K, double r,
                                  double sigma, double T, int N) noexcept {
    double dt = T / N;
    // Adjusted drift and vol for geometric mean
    double sigma_g = sigma * std::sqrt((N + 1.0) * (2.0 * N + 1.0) / (6.0 * N * N));
    double b = 0.5 * (r - 0.5 * sigma * sigma)
               + sigma_g * sigma_g * 0.5;

    auto Ncdf = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    double F = S0 * std::exp(b * T);
    double d1 = (std::log(F / K)) / (sigma_g * std::sqrt(T)) + 0.5 * sigma_g * std::sqrt(T);
    double d2 = d1 - sigma_g * std::sqrt(T);
    return std::exp(-r * T) * (F * Ncdf(d1) - K * Ncdf(d2));
}

struct AsianResult { double price; double se_crude; double se_cv; };

AsianResult asianCallMC(double S0, double K, double r, double sigma, double T,
                         int N = 52, int n_paths = 100000, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt    = T / N;
    double drift = (r - 0.5 * sigma * sigma) * dt;
    double vol   = sigma * std::sqrt(dt);
    double disc  = std::exp(-r * T);
    double EY    = geometricAsianCall(S0, K, r, sigma, T, N) / disc; // E[max(G-K,0)] undiscounted

    std::vector<double> X(n_paths), Y(n_paths);
    for (int p = 0; p < n_paths; ++p) {
        double S = S0, sum_S = 0.0, sum_logS = 0.0;
        for (int t = 0; t < N; ++t) {
            S *= std::exp(drift + vol * nd(rng));
            sum_S    += S;
            sum_logS += std::log(S);
        }
        double A = sum_S / N;
        double G = std::exp(sum_logS / N);
        X[p] = std::max(A - K, 0.0);   // arithmetic payoff
        Y[p] = std::max(G - K, 0.0);   // geometric payoff
    }

    // Estimate beta = Cov(X,Y)/Var(Y) via sample statistics
    double mx = 0, my = 0;
    for (int p = 0; p < n_paths; ++p) { mx += X[p]; my += Y[p]; }
    mx /= n_paths; my /= n_paths;
    double cov = 0, varY = 0;
    for (int p = 0; p < n_paths; ++p) {
        cov  += (X[p]-mx)*(Y[p]-my);
        varY += (Y[p]-my)*(Y[p]-my);
    }
    double beta = cov / (varY + 1e-15);

    // Control variate estimator
    std::vector<double> Xcv(n_paths);
    double sum_cv = 0, sum_cv2 = 0;
    for (int p = 0; p < n_paths; ++p) {
        Xcv[p] = X[p] - beta * (Y[p] - EY);
        sum_cv  += Xcv[p];
        sum_cv2 += Xcv[p] * Xcv[p];
    }
    double price_cv = disc * sum_cv / n_paths;
    double se_cv    = disc * std::sqrt((sum_cv2/n_paths - (sum_cv/n_paths)*(sum_cv/n_paths))
                                       / (n_paths - 1));

    double sum_x = 0, sum_x2 = 0;
    for (int p = 0; p < n_paths; ++p) { sum_x += X[p]; sum_x2 += X[p]*X[p]; }
    double se_crude = disc * std::sqrt((sum_x2/n_paths - (sum_x/n_paths)*(sum_x/n_paths))
                                       / (n_paths - 1));

    return {price_cv, se_crude, se_cv};
}`,
    explanation:
      "The control variate exploits the fact that the geometric average's discounted expectation is known in closed form (Kemna-Vorst). By subtracting `beta*(Y - E[Y])` from each payoff sample, we remove the component of variance that is common between the arithmetic and geometric Asian, typically achieving a 5-20× variance reduction. The optimal beta minimises the variance of the CV estimator and equals the covariance ratio, estimated from the same paths (pilot estimation).",
  },
  {
    id: "cpp-20260618-b1-fx-bellman",
    language: "cpp",
    title: "FX Bellman-Ford negative cycle — currency arbitrage detection",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <limits>
#include <optional>

// FX arbitrage: convert exchange rates to log-weights.
// A profitable arbitrage cycle exists iff there is a negative cycle
// in the graph of edge weights w(i,j) = -log(rate(i,j)).
// Bellman-Ford detects negative cycles in O(V*E) time.

struct FXEdge { int from, to; double log_neg_rate; };

std::optional<std::vector<int>>
detectArbitrage(int n_currencies,
                const std::vector<std::tuple<int,int,double>>& rates) {
    // rates: (from, to, fx_rate) e.g. (0,1, 1.30) = 1 USD = 1.30 EUR
    // Build edge list: w(i,j) = -log(rate) because log(product) = sum(log)
    std::vector<FXEdge> edges;
    for (auto& [u, v, r] : rates) {
        if (r <= 0) continue;
        edges.push_back({u, v, -std::log(r)});
    }

    // Bellman-Ford from a virtual source node (node n_currencies)
    // connected to all nodes with weight 0
    int S = n_currencies;
    int N = n_currencies + 1;
    for (int u = 0; u < n_currencies; ++u)
        edges.push_back({S, u, 0.0});

    std::vector<double> dist(N, 0.0);   // all zero from virtual source
    std::vector<int>    pred(N, -1);

    // Relax V-1 times
    for (int iter = 0; iter < N - 1; ++iter) {
        for (auto& e : edges) {
            if (dist[e.from] + e.log_neg_rate < dist[e.to]) {
                dist[e.to] = dist[e.from] + e.log_neg_rate;
                pred[e.to] = e.from;
            }
        }
    }

    // V-th relaxation: if any edge still relaxes, a negative cycle exists
    int cycle_node = -1;
    for (auto& e : edges) {
        if (dist[e.from] + e.log_neg_rate < dist[e.to] - 1e-10) {
            cycle_node = e.to;
            break;
        }
    }
    if (cycle_node == -1) return std::nullopt;   // no arbitrage

    // Walk predecessors N times to ensure we're inside the cycle
    for (int i = 0; i < N; ++i) cycle_node = pred[cycle_node];

    // Extract the cycle by following predecessors until we revisit cycle_node
    std::vector<int> cycle;
    std::vector<bool> in_cycle(N, false);
    int cur = cycle_node;
    while (!in_cycle[cur]) {
        in_cycle[cur] = true;
        cycle.push_back(cur);
        cur = pred[cur];
    }
    cycle.push_back(cur);  // close the cycle
    std::reverse(cycle.begin(), cycle.end());

    // Trim to just the cycle portion
    while (cycle.front() != cycle.back()) cycle.erase(cycle.begin());

    return cycle;   // sequence of currency indices forming the arb cycle
}

// Compute arbitrage profit from cycle
double cyclePnL(const std::vector<int>& cycle,
                const std::vector<std::tuple<int,int,double>>& rates) {
    double product = 1.0;
    for (std::size_t i = 0; i + 1 < cycle.size(); ++i) {
        int u = cycle[i], v = cycle[i+1];
        for (auto& [a, b, r] : rates)
            if (a == u && b == v) { product *= r; break; }
    }
    return product - 1.0;  // > 0 means profitable
}`,
    explanation:
      "The log-rate transform converts the product of exchange rates into a sum of edge weights, allowing cycle detection via Bellman-Ford. A negative cycle in the weight graph corresponds to a sequence of trades whose product exceeds 1 — a riskless profit. The algorithm requires O(V·E) time and O(V) space; for the dense FX market (V ≈ 30 major currencies, E ≈ 900 pairs), this is negligible. In practice, bid-ask spreads and transaction costs increase the threshold above -ε.",
  },
  {
    id: "cpp-20260618-b1-book-array-hash",
    language: "cpp",
    title: "Order book: price array + hash map — O(1) level lookup + O(1) order cancel",
    tag: "systems",
    code: `#include <cstdint>
#include <array>
#include <unordered_map>
#include <limits>
#include <cstring>

// Two-layer order book design:
// Layer 1: price-indexed array  — O(1) random-access to any price level
// Layer 2: order hash map       — O(1) cancel by order ID
// Price is stored as integer ticks to avoid floating-point bucketing.
// Tick size: 0.01 USD. Price range [0, 1000 USD] = 100,000 ticks.

static constexpr int   TICK_SIZE_CENTS = 1;      // 1 cent per tick
static constexpr int   MAX_PRICE_TICKS = 100000; // max price $1000.00
static constexpr double TICK_USD       = 0.01;

struct Level {
    int64_t total_qty   = 0;
    int32_t order_count = 0;
};

struct Order {
    uint64_t order_id;
    int32_t  price_ticks;  // integer ticks
    int32_t  qty;
    int8_t   side;         // 1=bid, 2=ask
};

class LevelBook {
    std::array<Level, MAX_PRICE_TICKS> bid_levels_{};
    std::array<Level, MAX_PRICE_TICKS> ask_levels_{};

    // Order map: order_id → Order (for cancel)
    std::unordered_map<uint64_t, Order> orders_;
    int32_t best_bid_tick_ = -1;
    int32_t best_ask_tick_ = std::numeric_limits<int32_t>::max();

public:
    LevelBook() { orders_.reserve(65536); }  // pre-size to avoid rehash

    bool add(uint64_t id, double price_usd, int32_t qty, int8_t side) {
        int32_t ticks = static_cast<int32_t>(price_usd / TICK_USD + 0.5);
        if (ticks < 0 || ticks >= MAX_PRICE_TICKS) return false;

        auto& lvls = (side == 1) ? bid_levels_ : ask_levels_;
        lvls[ticks].total_qty   += qty;
        lvls[ticks].order_count++;
        orders_[id] = {id, ticks, qty, side};

        if (side == 1 && ticks > best_bid_tick_) best_bid_tick_ = ticks;
        if (side == 2 && ticks < best_ask_tick_) best_ask_tick_ = ticks;
        return true;
    }

    bool cancel(uint64_t id) {
        auto it = orders_.find(id);
        if (it == orders_.end()) return false;
        const Order& o = it->second;
        auto& lvls = (o.side == 1) ? bid_levels_ : ask_levels_;
        lvls[o.price_ticks].total_qty   -= o.qty;
        lvls[o.price_ticks].order_count--;
        orders_.erase(it);

        // Update best price if level emptied
        if (o.side == 1 && lvls[o.price_ticks].order_count == 0)
            while (best_bid_tick_ >= 0 && bid_levels_[best_bid_tick_].order_count == 0)
                --best_bid_tick_;
        if (o.side == 2 && lvls[o.price_ticks].order_count == 0)
            while (best_ask_tick_ < MAX_PRICE_TICKS && ask_levels_[best_ask_tick_].order_count == 0)
                ++best_ask_tick_;
        return true;
    }

    double bestBid() const noexcept { return best_bid_tick_ * TICK_USD; }
    double bestAsk() const noexcept {
        return best_ask_tick_ < MAX_PRICE_TICKS ? best_ask_tick_ * TICK_USD : 0.0;
    }
    int64_t bidQty(double p) const noexcept {
        int32_t t = static_cast<int32_t>(p / TICK_USD + 0.5);
        return (t >= 0 && t < MAX_PRICE_TICKS) ? bid_levels_[t].total_qty : 0;
    }
};`,
    explanation:
      "Integer tick encoding is the standard HFT technique for O(1) price-level access: dividing by tick size converts a floating-point price into an array index with a single integer division. The 100,000-element Level array occupies 1.2 MB — small enough to stay in L2/L3 cache. The complementary hash map provides O(1) cancel without scanning the level array. The best-price scan on cancel is amortised O(1) because levels are only scanned when actually emptied.",
  },
  {
    id: "cpp-20260618-b1-numa-affinity",
    language: "cpp",
    title: "NUMA-aware allocation and thread affinity binding",
    tag: "performance",
    code: `#include <numa.h>      // libnuma: apt install libnuma-dev
#include <sched.h>
#include <pthread.h>
#include <cstdlib>
#include <cstring>
#include <stdexcept>
#include <vector>

// NUMA (Non-Uniform Memory Access): multi-socket servers have local and
// remote memory. Remote memory access: +40-80% latency vs local.
// Key rule: allocate memory on the same NUMA node as the thread that uses it.
// Market data feed: bind ingest thread + ring buffer to socket 0.
// Strategy thread: bind + allocate order book on socket 1 (separate LLC).

class NumaArena {
    void*  ptr_  = nullptr;
    size_t size_ = 0;
    int    node_ = 0;

public:
    NumaArena(size_t bytes, int numa_node) : node_(numa_node) {
        if (numa_available() < 0)
            throw std::runtime_error("NUMA not available");
        // numa_alloc_onnode: allocates physical pages on specified NUMA node
        ptr_ = numa_alloc_onnode(bytes, numa_node);
        if (!ptr_) throw std::bad_alloc{};
        size_ = bytes;
        std::memset(ptr_, 0, size_);  // pre-fault pages on correct node
    }

    ~NumaArena() noexcept {
        if (ptr_) numa_free(ptr_, size_);
    }

    void* data() noexcept { return ptr_; }
    size_t size() const noexcept { return size_; }
    int node() const noexcept { return node_; }

    NumaArena(const NumaArena&) = delete;
    NumaArena& operator=(const NumaArena&) = delete;
};

// Bind calling thread to a specific CPU and memory node
void bindThreadToCore(int cpu_id, int numa_node) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(cpu_id, &cpuset);
    if (pthread_setaffinity_np(pthread_self(), sizeof(cpuset), &cpuset) != 0)
        throw std::runtime_error("pthread_setaffinity_np failed");

    // Bind memory allocation policy to numa_node
    // MPOL_BIND: all subsequent malloc/mmap goes to numa_node
    struct bitmask* nodemask = numa_bitmask_alloc(numa_num_configured_nodes());
    numa_bitmask_setbit(nodemask, numa_node);
    numa_set_membind(nodemask);
    numa_bitmask_free(nodemask);
}

// Query NUMA topology
void printNumaTopology() {
    int max_node = numa_max_node();
    for (int node = 0; node <= max_node; ++node) {
        long free_mb = 0;
        long total_mb = numa_node_size(node, &free_mb) / (1024 * 1024);
        free_mb /= (1024 * 1024);
        // numa_node_to_cpus fills a bitmask of CPUs on this node
        struct bitmask* cpus = numa_allocate_cpumask();
        numa_node_to_cpus(node, cpus);
        // (print cpus here)
        numa_free_cpumask(cpus);
        (void)total_mb; (void)free_mb;
    }
}

// Cross-NUMA distance matrix
int numaDistance(int node_a, int node_b) {
    return numa_distance(node_a, node_b);
    // Typical: local=10, remote=21 (2.1x latency penalty)
}`,
    explanation:
      "NUMA penalties accumulate silently: on a 2-socket server, if the order book array is allocated on socket 0 but the strategy thread runs on socket 1, every cache miss pays the QPI/UPI inter-socket latency (~100 ns vs ~40 ns for local DRAM). Binding both the thread and its hot allocations to the same node via `numa_alloc_onnode` + `pthread_setaffinity_np` eliminates this penalty. The std::memset pre-fault is essential — Linux uses lazy page allocation, so pages are not placed on the correct NUMA node until first touch.",
  },
  {
    id: "cpp-20260618-b1-branch-predict",
    language: "cpp",
    title: "Branch prediction hints — __builtin_expect and [[likely]] in hot paths",
    tag: "performance",
    code: `#include <cstdint>
#include <cstdlib>

// Branch misprediction: 10-20 cycle pipeline flush on modern OoO CPUs.
// Compiler hint: tell the branch predictor which path is statistically likely.
// __builtin_expect(expr, expected_value): C-style hint (GCC/Clang).
// [[likely]] / [[unlikely]] (C++20): standard attributes on if/switch labels.
// Use when you have empirical data: e.g., 99% of orders are limit orders,
// 0.1% of ticks trigger a risk breach, etc.

// Scenario A: order classification — 99% limit orders
enum class OrdType : uint8_t { Limit = 0, Market = 1, Stop = 2, IOC = 3 };

inline double processOrder(OrdType type, double price, int qty) noexcept {
    // [[likely]]: compiler places limit-order code in the fall-through path
    // Reduces branch penalty from ~15 cycles to ~1 cycle for limit orders
    if (type == OrdType::Limit) [[likely]] {
        return price * qty;   // most-common path: inline, no branch
    } else if (type == OrdType::Market) [[unlikely]] {
        return 0.0;           // market: no price
    } else {
        return price * qty * 0.5;  // stop / IOC: less common
    }
}

// Scenario B: risk check — rarely triggered (0.1% of messages)
inline bool riskCheck(double position, double limit) noexcept {
    // __builtin_expect: position within limit 99.9% of the time
    if (__builtin_expect(std::abs(position) > limit, 0)) [[unlikely]] {
        return false;   // breach: cold path, branch taken ~0.1% of the time
    }
    return true;
}

// Scenario C: order book tick processing — contiguous price levels dominate
inline int64_t sweepBook(const int64_t* qtys, int n, int64_t limit_qty) noexcept {
    int64_t swept = 0;
    for (int i = 0; i < n; ++i) {
        swept += qtys[i];
        // Early exit is rare (usually sweep all levels): [[unlikely]]
        if (swept >= limit_qty) [[unlikely]] break;
    }
    return swept;
}

// Scenario D: error paths in message parsing
bool parseFast(const char* buf, int len, double& out) noexcept {
    if (__builtin_expect(buf == nullptr || len <= 0, 0)) return false;
    // Hot path: buf and len are always valid from ring buffer
    char* end;
    out = std::strtod(buf, &end);
    if (__builtin_expect(end == buf, 0)) return false;  // malformed: rare
    return true;
}

// Measurement note:
// Validate hints with perf stat --branch-misses or Intel VTune.
// Wrong hints (marking common path as unlikely) are WORSE than no hints —
// they misalign code layout and defeat the static predictor.`,
    explanation:
      "[[likely]] and [[unlikely]] affect code layout: the compiler places the 'likely' branch as the fall-through (no branch taken), which is the path the CPU's static predictor defaults to. More importantly, likely/unlikely guides the instruction cache layout — cold paths are moved to separate sections so hot code is dense in the icache. __builtin_expect is a runtime hint whereas profile-guided optimisation (PGO, -fprofile-use) is strictly better when you have a representative workload profile.",
  },
  {
    id: "cpp-20260618-b1-mmap-ticks",
    language: "cpp",
    title: "mmap tick file reader — zero-copy historical tick data access",
    tag: "systems",
    code: `#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <span>

// Binary tick file format (packed, little-endian):
//   Header: magic[4] + version[2] + n_ticks[8] + tick_size[2]
//   Ticks:  [ts_ns:8][price_ticks:4][qty:4][side:1][pad:3]  = 20 bytes each

struct alignas(4) TickRecord {
    uint64_t ts_ns;
    int32_t  price_ticks;
    int32_t  qty;
    uint8_t  side;
    uint8_t  pad[3];
};
static_assert(sizeof(TickRecord) == 20);

class MmapTickFile {
    int   fd_    = -1;
    void* map_   = MAP_FAILED;
    size_t size_ = 0;
    const TickRecord* ticks_ = nullptr;
    size_t n_ticks_ = 0;

    static constexpr uint32_t MAGIC   = 0x54494358u;  // "TICK"
    static constexpr uint16_t VERSION = 1;

    struct Header {
        uint32_t magic;
        uint16_t version;
        uint16_t _pad;
        uint64_t n_ticks;
        uint16_t tick_size_bytes;
    };

public:
    explicit MmapTickFile(const char* path) {
        fd_ = ::open(path, O_RDONLY | O_CLOEXEC);
        if (fd_ < 0) throw std::runtime_error("open failed");

        struct stat st;
        if (::fstat(fd_, &st) != 0) { ::close(fd_); throw std::runtime_error("fstat failed"); }
        size_ = static_cast<size_t>(st.st_size);

        // MAP_POPULATE: pre-fault all pages on Linux (avoid runtime page faults)
        map_ = ::mmap(nullptr, size_, PROT_READ, MAP_PRIVATE | MAP_POPULATE, fd_, 0);
        if (map_ == MAP_FAILED) { ::close(fd_); throw std::runtime_error("mmap failed"); }

        // Advise sequential access: kernel reads ahead in large chunks
        ::madvise(map_, size_, MADV_SEQUENTIAL);

        auto* hdr = reinterpret_cast<const Header*>(map_);
        if (hdr->magic != MAGIC || hdr->version != VERSION)
            throw std::runtime_error("invalid tick file header");

        n_ticks_ = hdr->n_ticks;
        ticks_ = reinterpret_cast<const TickRecord*>(
            reinterpret_cast<const uint8_t*>(map_) + sizeof(Header));
    }

    ~MmapTickFile() noexcept {
        if (map_ != MAP_FAILED) ::munmap(map_, size_);
        if (fd_ >= 0) ::close(fd_);
    }

    MmapTickFile(const MmapTickFile&) = delete;

    std::span<const TickRecord> ticks() const noexcept {
        return {ticks_, n_ticks_};
    }

    // Binary search for first tick at or after ts_ns
    const TickRecord* lowerBound(uint64_t ts_ns) const noexcept {
        std::size_t lo = 0, hi = n_ticks_;
        while (lo < hi) {
            std::size_t mid = lo + (hi - lo) / 2;
            if (ticks_[mid].ts_ns < ts_ns) lo = mid + 1;
            else hi = mid;
        }
        return lo < n_ticks_ ? ticks_ + lo : nullptr;
    }

    size_t numTicks() const noexcept { return n_ticks_; }
};`,
    explanation:
      "mmap avoids the read() system call and intermediate kernel buffer copy: the file pages are directly mapped into the process address space, so the CPU can read tick data with loads rather than memcpy. MAP_POPULATE pre-faults all pages at open time, paying the page-fault cost upfront rather than during the tight replay loop. MADV_SEQUENTIAL tells the kernel to use aggressive read-ahead, pipelining disk I/O with computation for files too large to fit in RAM.",
  },
  {
    id: "cpp-20260618-b1-constexpr-bs",
    language: "cpp",
    title: "constexpr / consteval — compile-time Black-Scholes precomputation",
    tag: "modern",
    code: `#include <cmath>
#include <array>
#include <cstddef>

// constexpr functions run at compile time when all arguments are compile-time constants.
// consteval forces compile-time evaluation (error if runtime call attempted).
// Use for: lookup tables, precomputed constants, static strike ladders.

// compile-time square root via Newton's method (no <cmath> constexpr sqrt in C++17)
constexpr double sqrtCE(double x, double guess, int iter = 32) noexcept {
    return iter == 0 ? guess : sqrtCE(x, 0.5 * (guess + x / guess), iter - 1);
}
constexpr double sqrtCE(double x) noexcept { return x > 0 ? sqrtCE(x, x) : 0.0; }

// compile-time log via Taylor series (accurate for x near 1)
constexpr double logCE(double x) noexcept {
    // Use identity: log(x) = 2*atanh((x-1)/(x+1))
    // atanh(y) = y + y^3/3 + y^5/5 + ... (|y|<1)
    double y = (x - 1.0) / (x + 1.0);
    double y2 = y * y, res = y;
    double term = y;
    for (int i = 1; i <= 30; ++i) {
        term *= y2;
        res  += term / (2 * i + 1);
    }
    return 2.0 * res;
}

// compile-time erfc approximation (Horner polynomial, max error ~1e-7)
constexpr double erfcCE(double x) noexcept {
    double t = 1.0 / (1.0 + 0.3275911 * x);
    double poly = t * (0.254829592 + t * (-0.284496736
                  + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    return poly * std::exp(-x * x);   // NOTE: std::exp is constexpr in C++26; use approximation if needed
}

// consteval: MUST be computed at compile time — guarantees no runtime cost
consteval double blackScholesDelta(double S, double K, double r, double T, double sigma) {
    double d1 = (logCE(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma * sqrtCE(T));
    return 0.5 * erfcCE(-d1 / sqrtCE(2.0));
}

// Compile-time strike ladder: 10 delta-spaced strikes for a volatility surface
consteval auto buildStrikeLadder(double S, double sigma, double T, int N) {
    std::array<double, 10> strikes{};
    double d1_min = -2.5, d1_max = 2.5;
    double step = (d1_max - d1_min) / (N - 1);
    for (int i = 0; i < N; ++i) {
        double d1 = d1_min + i * step;
        // Strike from d1: K = S * exp(-(d1*sigma*sqrt(T) - (r+0.5*sig^2)*T))
        strikes[i] = S * std::exp(-(d1 * sigma * sqrtCE(T) - (0.05 + 0.5*sigma*sigma)*T));
    }
    return strikes;
}

// All evaluated at compile time — zero runtime cost:
static constexpr double  DELTA_ATM  = blackScholesDelta(100.0, 100.0, 0.05, 1.0, 0.20);
static constexpr auto    LADDER     = buildStrikeLadder(100.0, 0.20, 1.0, 10);
static constexpr double  VOL_SCALE  = sqrtCE(252.0);   // annualisation factor`,
    explanation:
      "consteval guarantees zero runtime cost: the compiler computes the value during translation and embeds it as a literal in the binary. The main challenge is that standard library math functions (std::sqrt, std::log) are constexpr only in C++26 — for earlier standards, Newton iteration (sqrt) and Taylor series (log, atanh) provide compile-time implementations. Compile-time strike ladders and delta grids are used in volatility surface engines where the same grid is reused across millions of re-pricings.",
  },
  {
    id: "cpp-20260618-b1-spsc-ring",
    language: "cpp",
    title: "SPSC lock-free ring buffer — market data feed to strategy thread",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstddef>
#include <cstring>
#include <optional>
#include <new>

// Single-Producer Single-Consumer ring buffer.
// Producer and consumer own separate head/tail indices.
// No CAS needed: producer only writes head, consumer only writes tail.
// Only the cross-read (producer reads tail, consumer reads head) needs acquire.
// Cache-line separated to avoid false sharing between producer and consumer.

template<typename T, std::size_t N>
class SPSCRing {
    static_assert((N & (N - 1)) == 0, "N must be power of 2");
    static constexpr std::size_t MASK = N - 1;

    alignas(64) std::atomic<std::size_t> head_{0};  // written by producer
    char pad1_[64 - sizeof(std::atomic<std::size_t>)]{};

    alignas(64) std::atomic<std::size_t> tail_{0};  // written by consumer
    char pad2_[64 - sizeof(std::atomic<std::size_t>)]{};

    alignas(64) T buf_[N];

public:
    // Producer: push returns false if full (non-blocking)
    bool push(const T& item) noexcept {
        std::size_t h = head_.load(std::memory_order_relaxed);
        std::size_t t = tail_.load(std::memory_order_acquire);  // sync with consumer

        if (h - t >= N) return false;  // full (unsigned subtraction handles wrap)

        buf_[h & MASK] = item;
        head_.store(h + 1, std::memory_order_release);  // publish to consumer
        return true;
    }

    // Consumer: pop returns nullopt if empty (non-blocking)
    std::optional<T> pop() noexcept {
        std::size_t t = tail_.load(std::memory_order_relaxed);
        std::size_t h = head_.load(std::memory_order_acquire);  // sync with producer

        if (h == t) return std::nullopt;  // empty

        T item = buf_[t & MASK];
        tail_.store(t + 1, std::memory_order_release);  // publish to producer
        return item;
    }

    std::size_t size() const noexcept {
        return head_.load(std::memory_order_acquire)
             - tail_.load(std::memory_order_acquire);
    }

    bool empty() const noexcept { return size() == 0; }
    bool full()  const noexcept { return size() == N; }

    static constexpr std::size_t capacity() noexcept { return N; }
};

// Usage: market data ingest → strategy (same process, different cores)
// SPSCRing<Tick, 4096> feed_ring;
// Producer thread: feed_ring.push(tick)
// Consumer thread: if (auto t = feed_ring.pop()) process(*t);
// Throughput: ~200M pushes/sec on modern hardware (no contention, L1-resident)`,
    explanation:
      "The SPSC ring buffer achieves its performance by ensuring each side only ever writes one variable: the producer writes `head`, the consumer writes `tail`. Cross-reads use acquire/release ordering to provide visibility without a hardware lock or CAS. The cache-line padding prevents false sharing: without padding, a producer write to `head` would invalidate the consumer's cache line containing `tail`, causing unnecessary coherency traffic between cores even though neither variable is written by both threads.",
  },
  {
    id: "cpp-20260618-b1-digital-option",
    language: "cpp",
    title: "Binary (digital) option pricing — cash-or-nothing and asset-or-nothing",
    tag: "quant",
    code: `#include <cmath>

// Cash-or-nothing call: pays $1 if S_T > K, else 0.
//   Price = exp(-rT) * N(d2)
// Asset-or-nothing call: pays S_T if S_T > K, else 0.
//   Price = S * N(d1)   (same as first term of vanilla call)
// Vanilla call = asset-or-nothing - K*exp(-rT)*cash-or-nothing
// Greeks of digitals: delta = exp(-rT)*N'(d2)/(S*sigma*sqrt(T))  (spike at K near expiry)

struct DigitalGreeks {
    double price, delta, gamma, vega, theta;
};

static double Ncdf(double x) noexcept { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }
static double Npdf(double x) noexcept { return std::exp(-0.5 * x * x) / std::sqrt(2.0 * M_PI); }

DigitalGreeks cashOrNothing(double S, double K, double r, double T, double sigma, bool call) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    double disc = std::exp(-r * T);

    int sign = call ? 1 : -1;
    double price = disc * Ncdf(sign * d2);

    // Delta = disc * N'(d2) / (S * sigma * sqrt(T)) * sign
    double delta = disc * Npdf(d2) * sign / (S * sigma * sqT);

    // Gamma: second derivative — very large near K close to expiry
    double gamma = -disc * Npdf(d2) * d1 * sign / (S * S * sigma * sigma * T);

    // Vega: dPrice/d_sigma
    double vega = -disc * Npdf(d2) * d1 / (sigma) * sign * 0.01;   // per 1% vol

    // Theta: dPrice/dT (time decay, positive for seller)
    double theta_raw = disc * (r * Ncdf(sign * d2) + Npdf(d2) * sign
                       * (-d1 / (2 * T) + (r / (sigma * sqT) - sigma / (2 * sqT))) );
    double theta = -theta_raw / 365.0;   // per calendar day

    return {price, delta, gamma, vega, theta};
}

DigitalGreeks assetOrNothing(double S, double K, double r, double T, double sigma, bool call) {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    int sign = call ? 1 : -1;

    double price = S * Ncdf(sign * d1);
    double delta = Ncdf(sign * d1) + S * Npdf(d1) * sign / (S * sigma * sqT);

    return {price, delta, 0, 0, 0};  // full Greeks left as exercise
}

// Static replication of vanilla from digitals:
// vanillaCall(S,K,r,T,sig) = assetOrNothing - K*exp(-rT)*cashOrNothing
// This means vanilla delta/gamma can be decomposed into digital components`,
    explanation:
      "Digital options have a discontinuous payoff at K, which causes their delta to spike to infinity as T→0 and S→K: a tiny stock move flips the payoff from 0 to 1. This 'pin risk' makes delta-hedging digital options near expiry extremely costly. In practice, traders replace a digital with a tight call spread (K, K+ε) to smooth the delta; the tighter the spread, the closer to a digital but the higher the gamma near K.",
  },
  {
    id: "cpp-20260618-b1-barrier-closed",
    language: "cpp",
    title: "Down-and-out barrier call — BS closed form with reflection principle",
    tag: "quant",
    code: `#include <cmath>

// Down-and-out (DOC) call: regular call that is knocked out if S_t <= B.
// Closed form (Merton 1973, Rubinstein-Reiner 1991):
//   DOC = C_BS - (B/S)^{2*mu} * C_BS(S_reflected)
// where mu = (r - sigma^2/2) / sigma^2 = (r/sigma^2 - 0.5)
// S_reflected = B^2 / S  (image of S in the barrier B)
// Condition: B < S and B < K (OTM barrier for standard formula)

struct BarrierResult { double price, delta, gamma; };

static double Ncdf(double x) noexcept { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }
static double Npdf(double x) noexcept { return std::exp(-0.5*x*x) / std::sqrt(2.0 * M_PI); }

// Vanilla call price
static double bsCall(double S, double K, double r, double T, double sigma) noexcept {
    double sqT = std::sqrt(T);
    double d1  = (std::log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqT);
    double d2  = d1 - sigma * sqT;
    return S * Ncdf(d1) - K * std::exp(-r * T) * Ncdf(d2);
}

BarrierResult downAndOutCall(double S, double K, double B,
                              double r, double T, double sigma) noexcept {
    if (S <= B) return {0.0, 0.0, 0.0};  // already knocked out

    double mu = r / (sigma * sigma) - 0.5;

    // Reflected stock price: image source at B^2/S
    double S_refl = B * B / S;

    // Reflection formula factor
    double reflect_factor = std::pow(B / S, 2.0 * mu + 2.0);  // (B/S)^{2*lambda}

    double C_vanilla  = bsCall(S,      K, r, T, sigma);
    double C_reflect  = bsCall(S_refl, K, r, T, sigma);

    double price = C_vanilla - reflect_factor * C_reflect;

    // Delta via bump (or analytical; using bump for correctness check)
    double h = S * 0.001;
    double doc_up = downAndOutCall(S + h, K, B, r, T, sigma).price;
    double doc_dn = downAndOutCall(S - h, K, B, r, T, sigma).price;
    double delta  = (doc_up - doc_dn) / (2.0 * h);
    double gamma  = (doc_up - 2.0 * price + doc_dn) / (h * h);

    return {price, delta, gamma};
}

// Note: formula assumes B <= K. For B > K (in-the-money barrier),
// additional terms are needed (see Haug "Complete Guide to Option Pricing Formulas").
// Continuous monitoring — discrete barrier monitoring requires correction:
//   B_adj = B * exp(+/- 0.5826 * sigma * sqrt(T/N))  (Broadie-Glasserman-Kou 1997)`,
    explanation:
      "The reflection principle states that a Brownian path that touches B has a mirror image that starts at B²/S and ends at the same terminal value; the probability of the minimum being below B equals the probability of the reflected path being above K. This geometric symmetry yields the closed-form subtraction formula. The barrier delta has a discontinuity near S = B (the knock-out point), requiring careful hedging as the spot approaches the barrier.",
  },
  {
    id: "cpp-20260618-b1-bachelier",
    language: "cpp",
    title: "Bachelier (normal) model — pricing and Greeks for near-zero rates",
    tag: "quant",
    code: `#include <cmath>

// Bachelier (1900): assumes normally distributed arithmetic returns (not lognormal).
//   dS = mu*dt + sigma_n * dW   (sigma_n in absolute price terms, not %)
// European call price:
//   C = (F - K) * N(d) + sigma_n * sqrt(T) * N'(d)
// where d = (F - K) / (sigma_n * sqrt(T)), F = S*exp(rT) (forward price)
//
// When to use: negative interest rates (SOFR floors below 0), commodity markets
// with near-zero prices, swaption pricing in EUR negative-rate environment.
// Bachelier vol sigma_n relates to BS vol sigma_BS approximately:
//   sigma_n ≈ sigma_BS * F   (ATM approximation)

static double Ncdf(double x) noexcept { return 0.5 * std::erfc(-x / std::sqrt(2.0)); }
static double Npdf(double x) noexcept { return std::exp(-0.5*x*x) / std::sqrt(2.0 * M_PI); }

struct BachelierResult {
    double price, delta, gamma, vega, theta;
};

BachelierResult bachelierCall(double S, double K, double r, double T, double sigma_n) {
    double F    = S * std::exp(r * T);
    double sqT  = std::sqrt(T);
    double disc = std::exp(-r * T);

    double vsqT = sigma_n * sqT;
    double d    = (F - K) / vsqT;

    double Nd   = Ncdf(d);
    double nd   = Npdf(d);

    double price = disc * ((F - K) * Nd + vsqT * nd);

    // Delta: dC/dS
    double delta = disc * std::exp(r * T) * Nd;   // = Nd (fwd delta approx)

    // Gamma: d2C/dS2
    double gamma = disc * std::exp(2.0 * r * T) * nd / vsqT;

    // Vega: dC/d(sigma_n), in price terms per unit vol move
    double vega = disc * sqT * nd * 0.01;   // per 1% (100bp) vol move

    // Theta: dC/dT (approximately)
    double theta = -disc * sigma_n / (2.0 * sqT) * nd / 365.0;

    return {price, delta, gamma, vega, theta};
}

// BS to Bachelier vol conversion (approximation, ATM)
double bsToNormal(double S, double K, double T, double sigma_bs) noexcept {
    double F = S;  // assume r=0 for approximation
    double moneyness = std::log(F / K);
    // Antonov-Spector approximation (better than F*sigma_bs for skewed strikes)
    return sigma_bs * std::sqrt(F * K) * (1.0 + moneyness * moneyness / 24.0);
}

// Bachelier implied vol (Newton-Raphson on price)
double bachelierImpliedVol(double C_mkt, double S, double K, double r, double T,
                            double tol = 1e-7, int max_iter = 50) {
    double sigma = (S * 0.1);  // initial guess: 10% of spot
    for (int i = 0; i < max_iter; ++i) {
        auto [C, D, G, V, Th] = bachelierCall(S, K, r, T, sigma);
        double err = C - C_mkt;
        if (std::abs(err) < tol) break;
        sigma -= err / (V / 0.01);   // Newton step: divide by actual vega (not normalised)
        if (sigma < 1e-9) sigma = 1e-9;
    }
    return sigma;
}`,
    explanation:
      "The Bachelier model became essential during the 2020 oil crisis when crude oil futures turned negative and the lognormal Black model's positivity assumption failed completely. The normal model allows negative prices by design. Its vega formula `disc·σ_n·√T·N'(d)` is simpler than Black-Scholes because the payoff distributes linearly — there is no F² term in the denominator, so gamma is proportional to 1/(σ_n·√T) rather than 1/(S·σ_BS·√T).",
  },
  {
    id: "cpp-20260618-b1-richardson-binomial",
    language: "cpp",
    title: "Richardson extrapolation on binomial tree — higher-order convergence",
    tag: "quant",
    code: `#include <cmath>
#include <algorithm>
#include <vector>

// Binomial tree converges as O(1/N) to BS price due to the odd/even oscillation
// of the stock price grid around the strike. Richardson extrapolation:
//   V_extrap = 2 * V(2N) - V(N)    [eliminates O(1/N) error term → O(1/N^2)]
// Romberg / higher order:
//   V_rom = (4*V(2N) - V(N)) / 3   [Richardson on finite-diff estimate → O(1/N^2)]

double crr_option(double S, double K, double r, double sigma, double T,
                   bool call, bool american, int N) noexcept {
    double dt  = T / N;
    double u   = std::exp(sigma * std::sqrt(dt));
    double d   = 1.0 / u;
    double p   = (std::exp(r * dt) - d) / (u - d);
    double disc = std::exp(-r * dt);

    std::vector<double> V(N + 1);

    // Terminal payoffs
    for (int j = 0; j <= N; ++j) {
        double S_j = S * std::pow(u, j) * std::pow(d, N - j);
        V[j] = call ? std::max(S_j - K, 0.0) : std::max(K - S_j, 0.0);
    }

    // Backward induction
    for (int i = N - 1; i >= 0; --i) {
        for (int j = 0; j <= i; ++j) {
            V[j] = disc * (p * V[j + 1] + (1.0 - p) * V[j]);
            if (american) {
                double S_j = S * std::pow(u, j) * std::pow(d, i - j);
                V[j] = std::max(V[j], call ? S_j - K : K - S_j);
            }
        }
    }
    return V[0];
}

// Richardson extrapolation: eliminates leading error term
double richCRR(double S, double K, double r, double sigma, double T,
               bool call, bool american, int N_base = 100) noexcept {
    double V_N  = crr_option(S, K, r, sigma, T, call, american, N_base);
    double V_2N = crr_option(S, K, r, sigma, T, call, american, 2 * N_base);
    // 2*V(2N) - V(N): cancels the 1/N error term
    return 2.0 * V_2N - V_N;
}

// Romberg table: 3-point extrapolation for even higher accuracy
double rombergCRR(double S, double K, double r, double sigma, double T,
                  bool call, bool american, int N_base = 50) noexcept {
    double V1 = crr_option(S, K, r, sigma, T, call, american, N_base);
    double V2 = crr_option(S, K, r, sigma, T, call, american, 2*N_base);
    double V4 = crr_option(S, K, r, sigma, T, call, american, 4*N_base);
    // 4th-order accurate: (4*V4 - V2)/3 for inner, (4*r1 - r0)/3 outer
    double r0 = 2.0 * V2 - V1;
    double r1 = 2.0 * V4 - V2;
    return (4.0 * r1 - r0) / 3.0;
}`,
    explanation:
      "The CRR binomial tree's error is `C₁/N + C₂/N² + ...` where C₁ is proportional to the odd-even oscillation of the spot price grid relative to the strike. Richardson extrapolation eliminates C₁ by computing `2·V(2N) − V(N)`, since the 1/N term cancels exactly and the O(1/N²) terms partially reinforce. For American options where no closed form exists, this gives BS-level accuracy with ~N=50-100 steps rather than N=2000.",
  },
  {
    id: "cpp-20260618-b1-nelson-siegel-cpp",
    language: "cpp",
    title: "Nelson-Siegel yield curve — parameter fitting via least squares",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <array>
#include <numeric>
#include <algorithm>

// Nelson-Siegel (1987) parametric yield curve:
//   y(T; beta) = beta0 + beta1 * (1 - exp(-T/tau)) / (T/tau)
//              + beta2 * [(1 - exp(-T/tau)) / (T/tau) - exp(-T/tau)]
// beta0: long-run level; beta1: short-run slope (negative for normal curves);
// beta2: medium-term curvature (hump); tau: decay factor.
// Fitting: nonlinear least squares over {beta0, beta1, beta2} for fixed tau.
// (tau is often concentrated search over a grid for robustness.)

struct NSParams { double beta0, beta1, beta2, tau; };

// Factor loadings for NS
static std::array<double, 3> nsFactors(double T, double tau) noexcept {
    double x     = T / tau;
    double ex    = std::exp(-x);
    double load1 = (1.0 - ex) / x;
    double load2 = load1 - ex;
    return {1.0, load1, load2};
}

// Evaluate NS yield at maturity T
double nsYield(double T, const NSParams& p) noexcept {
    auto [L0, L1, L2] = nsFactors(T, p.tau);
    return p.beta0 * L0 + p.beta1 * L1 + p.beta2 * L2;
}

// Fit NS for fixed tau via ordinary least squares on (beta0, beta1, beta2)
NSParams fitNelsonSiegel(const std::vector<double>& maturities,
                          const std::vector<double>& yields,
                          double tau) {
    int N = static_cast<int>(maturities.size());
    // X: N×3 design matrix, y: N×1 target yields
    // beta = (X'X)^{-1} X'y   [3x3 system, solved directly]
    std::array<std::array<double,3>,3> XtX{};
    std::array<double,3> Xty{};

    for (int i = 0; i < N; ++i) {
        auto L = nsFactors(maturities[i], tau);
        for (int r = 0; r < 3; ++r) {
            Xty[r] += L[r] * yields[i];
            for (int c = 0; c < 3; ++c)
                XtX[r][c] += L[r] * L[c];
        }
    }

    // Solve 3×3 via Gauss elimination (small system)
    for (int j = 0; j < 3; ++j) {
        // Pivot
        int max_r = j;
        for (int i = j+1; i < 3; ++i)
            if (std::abs(XtX[i][j]) > std::abs(XtX[max_r][j])) max_r = i;
        std::swap(XtX[j], XtX[max_r]);
        std::swap(Xty[j], Xty[max_r]);
        double piv = XtX[j][j];
        for (int i = j+1; i < 3; ++i) {
            double f = XtX[i][j] / piv;
            for (int k = j; k < 3; ++k) XtX[i][k] -= f * XtX[j][k];
            Xty[i] -= f * Xty[j];
        }
    }
    std::array<double,3> beta{};
    for (int i = 2; i >= 0; --i) {
        beta[i] = Xty[i];
        for (int j = i+1; j < 3; ++j) beta[i] -= XtX[i][j] * beta[j];
        beta[i] /= XtX[i][i];
    }

    double sse = 0;
    for (int i = 0; i < N; ++i) {
        double err = nsYield(maturities[i], {beta[0], beta[1], beta[2], tau}) - yields[i];
        sse += err * err;
    }
    return {beta[0], beta[1], beta[2], tau};
}`,
    explanation:
      "For a fixed tau, Nelson-Siegel is linear in beta0/beta1/beta2, so least squares reduces to a 3×3 normal equation — solved analytically without any iterative optimizer. In practice, tau is selected by grid search (e.g., 0.5 to 5.0 in 0.1 steps) minimising residual sum of squares, making the full fit a sequence of cheap 3×3 solves. The three factors capture the three principal components of yield curve movements: level, slope, and curvature — which explains ~99.9% of historical variance.",
  },
  {
    id: "cpp-20260618-b1-vasicek-mc",
    language: "cpp",
    title: "Vasicek short rate Monte Carlo — bond and cap pricing",
    tag: "quant",
    code: `#include <cmath>
#include <random>
#include <vector>
#include <numeric>

// Vasicek (1977): dr = kappa*(theta - r)*dt + sigma*dW
// Exact simulation: r(t) = r(0)*exp(-kappa*t) + theta*(1-exp(-kappa*t))
//                         + sigma*sqrt((1-exp(-2*kappa*t))/(2*kappa)) * Z
// ZCB price: P(0,T) = A(T)*exp(-B(T)*r0) where A(T), B(T) are analytic.

struct VasicekParams {
    double kappa;   // mean-reversion speed (e.g. 0.5)
    double theta;   // long-run rate (e.g. 0.04)
    double sigma;   // vol of rate (e.g. 0.01)
    double r0;      // initial short rate
};

double vasicekZCB(const VasicekParams& v, double T) noexcept {
    double B   = (1.0 - std::exp(-v.kappa * T)) / v.kappa;
    double sig2 = v.sigma * v.sigma;
    double A   = std::exp((v.theta - sig2 / (2.0 * v.kappa * v.kappa)) * (B - T)
                          - sig2 * B * B / (4.0 * v.kappa));
    return A * std::exp(-B * v.r0);
}

// Simulate exact Vasicek paths; return mean bond price at maturity
double vasicekBondMC(const VasicekParams& v, double T_bond,
                     int n_steps = 252, int n_paths = 200000, int seed = 42) {
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> nd;

    double dt = T_bond / n_steps;
    double sum = 0.0;

    for (int p = 0; p < n_paths; ++p) {
        double r = v.r0;
        double integral_r = 0.0;  // int_0^T r(t) dt (for discount factor)

        for (int t = 0; t < n_steps; ++t) {
            integral_r += r * dt;
            // Exact step: E[r(t+dt)|r(t)] = r*exp(-kappa*dt) + theta*(1-exp(-kappa*dt))
            double emk = std::exp(-v.kappa * dt);
            double var = v.sigma * v.sigma * (1.0 - emk * emk) / (2.0 * v.kappa);
            r = r * emk + v.theta * (1.0 - emk) + std::sqrt(var) * nd(rng);
        }
        sum += std::exp(-integral_r);  // bond = E[exp(-int r dt)]
    }
    return sum / n_paths;
}

// Interest rate cap: sum of caplets (call options on short rate)
// Caplet on rate r(T_i) with strike K_cap:
//   Under Vasicek: caplet = ZCB(0,T_{i-1})*N(-h2) - ZCB(0,T_i)*(1+K_cap*tau)*N(-h1)
//   (see Brigo-Mercurio for full formula)
double vasicekCaplet(const VasicekParams& v, double K_cap, double T_start, double T_end) {
    double tau   = T_end - T_start;
    double P1    = vasicekZCB(v, T_start);
    double P2    = vasicekZCB(v, T_end);
    double K_adj = 1.0 + K_cap * tau;  // strike on ZCB

    double B_fwd  = (1.0 - std::exp(-v.kappa * tau)) / v.kappa;
    double sigma_p = v.sigma * B_fwd
                     * std::sqrt((1.0 - std::exp(-2.0 * v.kappa * T_start))
                                 / (2.0 * v.kappa));

    auto Ncdf = [](double x){ return 0.5 * std::erfc(-x / std::sqrt(2.0)); };
    double h  = std::log(P2 / (P1 * K_adj)) / sigma_p + 0.5 * sigma_p;
    return P1 * Ncdf(-h + sigma_p) - K_adj * P2 * Ncdf(-h);
}`,
    explanation:
      "The Vasicek model's exact simulation uses the known conditional distribution: r(t+dt)|r(t) is Gaussian with mean `r·e^{-κdt} + θ·(1−e^{-κdt})` and variance `σ²·(1−e^{-2κdt})/(2κ)`. This avoids Euler discretisation error entirely, regardless of step size. The ZCB pricing formula is derived from the Feynman-Kac PDE for affine models and serves as the building block for cap/floor pricing via the Jamshidian-like decomposition into sums of ZCB options.",
  },
  {
    id: "cpp-20260618-b1-threadpool",
    language: "cpp",
    title: "Thread pool for parallel MC simulation — work queue + futures",
    tag: "concurrency",
    code: `#include <thread>
#include <future>
#include <queue>
#include <functional>
#include <mutex>
#include <condition_variable>
#include <vector>
#include <stop_token>

// Thread pool: fixed N worker threads drain a shared task queue.
// Tasks are std::packaged_task<double()> — MC path subsets.
// Caller collects futures and accumulates results.

class ThreadPool {
    std::vector<std::jthread>        workers_;
    std::queue<std::packaged_task<double()>> tasks_;
    std::mutex                       mu_;
    std::condition_variable_any      cv_;

    void workerLoop(std::stop_token stoken) {
        std::stop_callback on_stop{stoken, [this]{ cv_.notify_all(); }};
        while (!stoken.stop_requested()) {
            std::packaged_task<double()> task;
            {
                std::unique_lock lock{mu_};
                cv_.wait(lock, stoken, [this]{ return !tasks_.empty(); });
                if (tasks_.empty()) break;
                task = std::move(tasks_.front());
                tasks_.pop();
            }
            task();
        }
    }

public:
    explicit ThreadPool(unsigned n = std::thread::hardware_concurrency()) {
        for (unsigned i = 0; i < n; ++i)
            workers_.emplace_back([this](std::stop_token st){ workerLoop(st); });
    }

    ~ThreadPool() = default;  // jthread destructor calls request_stop() + join()

    // Submit a callable returning double; returns future for the result
    std::future<double> submit(std::function<double()> fn) {
        std::packaged_task<double()> task{std::move(fn)};
        auto fut = task.get_future();
        {
            std::lock_guard lock{mu_};
            tasks_.push(std::move(task));
        }
        cv_.notify_one();
        return fut;
    }

    unsigned size() const noexcept { return static_cast<unsigned>(workers_.size()); }
};

// Parallel MC: split n_paths across N threads, sum results
double parallelMC(double S, double K, double r, double sigma, double T,
                  int n_paths = 1000000, unsigned n_threads = 4) {
    ThreadPool pool{n_threads};
    int chunk = n_paths / n_threads;
    std::vector<std::future<double>> futs;

    for (unsigned t = 0; t < n_threads; ++t) {
        int seed = 42 + t * 1000;
        futs.push_back(pool.submit([=]() -> double {
            std::mt19937_64 rng(seed);
            std::normal_distribution<double> nd;
            double disc = std::exp(-r * T);
            double drift = (r - 0.5*sigma*sigma)*T, vol = sigma*std::sqrt(T);
            double sum = 0;
            for (int i = 0; i < chunk; ++i) {
                double ST = S * std::exp(drift + vol * nd(rng));
                sum += std::max(ST - K, 0.0);
            }
            return disc * sum / chunk;
        }));
    }

    double total = 0;
    for (auto& f : futs) total += f.get();
    return total / n_threads;
}`,
    explanation:
      "The thread pool achieves parallelism by using independent RNG seeds per thread — each thread produces a statistically independent sub-sample of the full Monte Carlo estimate. The per-chunk estimates are averaged rather than summed to avoid accumulating floating-point error. The jthread destructor automatically calls request_stop() followed by join(), eliminating the risk of forgetting shutdown in exception paths.",
  },
  {
    id: "cpp-20260618-b1-span",
    language: "cpp",
    title: "std::span — non-owning bounds-safe buffer view for market data",
    tag: "modern",
    code: `#include <span>
#include <cstdint>
#include <cstddef>
#include <algorithm>
#include <numeric>
#include <stdexcept>

// std::span: non-owning view over a contiguous sequence.
// Knows its own length — eliminates the (ptr, len) convention that causes buffer overruns.
// Static extent std::span<T,N>: size known at compile time — no runtime bounds overhead.
// Dynamic extent std::span<T>  : runtime size — single-word overhead (ptr + len).

struct Tick { double price; int volume; };

// Accepts any contiguous range: raw array, vector, array — no template needed
double vwap(std::span<const Tick> ticks) noexcept {
    if (ticks.empty()) return 0.0;
    double pv = 0.0, vol = 0.0;
    for (const auto& t : ticks) {
        pv  += t.price * t.volume;
        vol += t.volume;
    }
    return vol > 0 ? pv / vol : 0.0;
}

// Static extent: span<T, N> — size baked in at compile time
double mid(std::span<const double, 2> bid_ask) noexcept {
    return 0.5 * (bid_ask[0] + bid_ask[1]);   // bounds checked at compile time
}

// Safe sub-span: returns view of the last N ticks
std::span<const Tick> lastN(std::span<const Tick> all, std::size_t n) noexcept {
    n = std::min(n, all.size());
    return all.last(n);   // no copy; O(1) pointer arithmetic
}

// Parsing buffer: split a packet into header and payload spans
std::pair<std::span<const std::byte, 8>, std::span<const std::byte>>
splitPacket(std::span<const std::byte> pkt) {
    if (pkt.size() < 8) throw std::runtime_error("packet too short");
    return { pkt.first<8>(), pkt.subspan(8) };  // first<8>() = static extent
}

// Zero-copy multi-cast batch processing
void processBatch(std::span<const Tick> batch, double& cumPV, double& cumVol) noexcept {
    for (const auto& t : batch) {
        cumPV  += t.price * t.volume;
        cumVol += t.volume;
    }
}

// Mutation via writable span
void scaleVolumes(std::span<Tick> ticks, double factor) noexcept {
    for (auto& t : ticks) t.volume = static_cast<int>(t.volume * factor);
}

// std::span constructors: from raw pointer, C array, std::vector, std::array
// void f(std::span<const Tick>);
// f(ticks.data(), ticks.size());  // from raw ptr + len
// f(vec);                          // from std::vector<Tick>
// f(arr);                          // from std::array<Tick, N>`,
    explanation:
      "std::span solves the C API problem of passing `(T* ptr, size_t len)` as two separate arguments — a pattern that silently allows passing the wrong length. Span bundles them as a single type-safe object with built-in bounds checking in debug mode. The key design point is that span is always trivially copyable (pointer + size), so passing by value is correct and efficient. Static-extent spans `span<T,N>` store only the pointer — the size is a compile-time constant encoded in the type.",
  },
  {
    id: "cpp-20260618-b1-memory-order",
    language: "cpp",
    title: "Memory order cheat-sheet — acquire/release/seq_cst on ARM vs x86",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>

// Memory model summary (C++11):
// relaxed:   no ordering constraints; only atomicity guaranteed.
// release:   store; prevents reordering of PRECEDING writes above this store.
// acquire:   load;  prevents reordering of FOLLOWING reads below this load.
// acq_rel:   RMW (fetch_add, CAS); acquire on the load + release on the store.
// seq_cst:   total order across all threads; most expensive (dmb ish on ARM, mfence on x86).

// Key rule: a release-store synchronises-with a corresponding acquire-load.
// All writes BEFORE the release are visible AFTER the acquire in the other thread.

struct OrderSlot {
    alignas(64) uint64_t     order_id;
    double                   price;
    int32_t                  qty;
    std::atomic<uint8_t>     ready;    // 0=empty, 1=written, 2=consumed
};

class PassThrough {
    static constexpr int N = 128;
    OrderSlot slots_[N];
    std::atomic<int> write_idx_{0};
    std::atomic<int> read_idx_{0};

public:
    // Publisher: write data THEN set ready=1 with release
    bool publish(int idx, uint64_t id, double px, int q) noexcept {
        OrderSlot& s = slots_[idx & (N-1)];
        if (s.ready.load(std::memory_order_relaxed) != 0) return false;

        // Non-atomic writes first (no ordering required vs. each other)
        s.order_id = id;
        s.price    = px;
        s.qty      = q;

        // Release: ensures the non-atomic writes above are visible after this store
        s.ready.store(1, std::memory_order_release);
        return true;
    }

    // Consumer: acquire-load before reading data
    bool consume(int idx, uint64_t& id, double& px, int& q) noexcept {
        OrderSlot& s = slots_[idx & (N-1)];

        // Acquire: ensures we see all writes that preceded the release-store
        if (s.ready.load(std::memory_order_acquire) != 1) return false;

        id = s.order_id;
        px = s.price;
        q  = s.qty;

        s.ready.store(2, std::memory_order_release);
        return true;
    }
};

// Hardware cost comparison (approximate cycles):
// x86-64:  relaxed/release/acquire = 0 extra cycles (TSO model = acquire+release for free)
//           seq_cst store = ~20 cycles (MFENCE or locked XCHG)
// ARM64:   relaxed = 0; release = stlr (store release); acquire = ldar (load acquire) = ~5 cycles
//           seq_cst = dmb ish = ~25 cycles
// Rule: on x86, only seq_cst stores are expensive; on ARM, every acquire/release is non-trivial.`,
    explanation:
      "The x86 Total Store Order (TSO) memory model guarantees that all loads see all stores in program order, making acquire/release 'free' — they compile to ordinary mov instructions with no fences. On ARM's weakly-ordered model, every acquire (ldar) and release (stlr) instruction inserts a one-directional barrier, and seq_cst requires a full dmb ish barrier. This means atomically migrating code from x86 to ARM without re-auditing memory orderings often introduces latency regressions of 3-5× on contended paths.",
  },
  {
    id: "cpp-20260618-b1-coroutine-gen",
    language: "cpp",
    title: "C++20 coroutine tick generator — lazy market data replay",
    tag: "modern",
    code: `#include <coroutine>
#include <optional>
#include <cstdint>
#include <vector>
#include <iterator>

// C++20 coroutines: functions that can be suspended and resumed.
// Generator<T>: yields T values on demand without materialising a full vector.
// Each co_yield suspends execution, returning control and a value to the caller.
// Use: lazy tick replay, streaming calculations over infinite price feeds.

template<typename T>
struct Generator {
    struct promise_type {
        T current_value;

        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(T v) noexcept {
            current_value = v;
            return {};
        }
        void return_void() noexcept {}
        void unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> handle_;

    explicit Generator(std::coroutine_handle<promise_type> h) : handle_(h) {}
    ~Generator() { if (handle_) handle_.destroy(); }
    Generator(Generator&& o) noexcept : handle_(o.handle_) { o.handle_ = nullptr; }

    // Pull next value
    std::optional<T> next() {
        if (!handle_ || handle_.done()) return std::nullopt;
        handle_.resume();
        if (handle_.done()) return std::nullopt;
        return handle_.promise().current_value;
    }

    bool done() const noexcept { return !handle_ || handle_.done(); }
};

struct Tick { uint64_t ts_ns; double price; int volume; };

// Coroutine: generates filtered ticks from a raw data source — no intermediate vector
Generator<Tick> filteredTicks(const std::vector<Tick>& raw,
                               double min_price, double max_price) {
    for (const auto& t : raw) {
        if (t.price >= min_price && t.price <= max_price) {
            co_yield t;  // suspend here; caller resumes for next tick
        }
    }
}

// Chain generators: compute running VWAP lazily
Generator<double> runningVWAP(Generator<Tick> src) {
    double pv = 0, vol = 0;
    while (auto t = src.next()) {
        pv  += t->price * t->volume;
        vol += t->volume;
        co_yield vol > 0 ? pv / vol : 0.0;
    }
}

// Usage: processes only the ticks in the price band, computing VWAP on-the-fly
// auto gen = runningVWAP(filteredTicks(all_ticks, 99.0, 101.0));
// while (!gen.done()) { if (auto v = gen.next()) use(*v); }`,
    explanation:
      "C++20 coroutines enable zero-allocation lazy pipelines: `co_yield` suspends the coroutine's stack frame in-place rather than returning from the function. The frame is heap-allocated once (via `operator new` customisable in `promise_type`), and each `.next()` call resumes execution from the exact suspension point. Chained generators like `runningVWAP(filteredTicks(...))` compose without intermediate containers — the CPU processes one tick at a time, keeping only the running accumulators in registers.",
  },
];
