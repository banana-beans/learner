import { Snippet } from "./types";

export const cppSnippets20260721B1: Snippet[] = [
  {
    id: "cpp-20260721-b1-concepts-priceable",
    language: "cpp",
    title: "C++20 Concepts: Priceable Instrument Constraint",
    tag: "concepts",
    code: `#include <concepts>
#include <cstdio>

// Named concept: satisfied by any type exposing price, delta, expiry
template <typename T>
concept Priceable = requires(const T& t) {
  { t.price()  } -> std::convertible_to<double>;
  { t.delta()  } -> std::convertible_to<double>;
  { t.expiry() } -> std::convertible_to<double>;
};

// Compose concepts: FixedIncome refines Priceable
template <typename T>
concept FixedIncome = Priceable<T> && requires(const T& t) {
  { t.dv01()             } -> std::convertible_to<double>;
  { t.modified_duration()} -> std::convertible_to<double>;
};

// Concept-constrained function: compiler enforces the interface
template <Priceable P>
void report_greeks(const P& p) {
  std::printf("price=%.4f  delta=%.4f  T=%.2f\\n",
              p.price(), p.delta(), p.expiry());
}

struct EuropeanCall {
  double S, K, r, v, T;
  double price()  const { return S - K; }   // placeholder
  double delta()  const { return 0.5; }
  double expiry() const { return T; }
};

static_assert(Priceable<EuropeanCall>);
static_assert(!FixedIncome<EuropeanCall>);`,
    explanation: "C++20 concepts replace SFINAE with readable, composable constraints checked at the call site. Errors now say 'EuropeanCall does not satisfy FixedIncome' instead of pages of template substitution failures, dramatically improving compile diagnostics in large pricer frameworks.",
  },
  {
    id: "cpp-20260721-b1-pool-allocator",
    language: "cpp",
    title: "Fixed-Size Object Pool Allocator",
    tag: "memory",
    code: `#include <cstddef>
#include <array>
#include <cassert>

// Pool allocator: O(1) alloc/free with zero fragmentation
// All objects must be the same size (e.g., Order structs)
template <typename T, std::size_t Capacity>
class ObjectPool {
  union Slot {
    alignas(T) char storage[sizeof(T)];
    Slot* next;   // when free, slots form a singly-linked free-list
  };

  std::array<Slot, Capacity> pool_;
  Slot* free_head_ = nullptr;
  std::size_t in_use_ = 0;

public:
  ObjectPool() {
    // Chain all slots into the free list at construction
    for (std::size_t i = 0; i + 1 < Capacity; ++i)
      pool_[i].next = &pool_[i + 1];
    pool_[Capacity - 1].next = nullptr;
    free_head_ = &pool_[0];
  }

  template <typename... Args>
  T* allocate(Args&&... args) {
    assert(free_head_ && "pool exhausted");
    Slot* slot = free_head_;
    free_head_  = slot->next;
    ++in_use_;
    return new (&slot->storage) T(std::forward<Args>(args)...);
  }

  void deallocate(T* ptr) {
    ptr->~T();                             // explicit destructor
    auto* slot  = reinterpret_cast<Slot*>(ptr);
    slot->next  = free_head_;
    free_head_  = slot;
    --in_use_;
  }

  std::size_t size() const { return in_use_; }
};`,
    explanation: "Object pools pre-allocate a fixed slab and dispense objects from a free-list in O(1) with no heap interaction. In matching engines where thousands of orders arrive per second, eliminating malloc/free can cut per-order latency by 30–50 ns compared to general-purpose allocators.",
  },
  {
    id: "cpp-20260721-b1-crank-nicolson",
    language: "cpp",
    title: "Crank-Nicolson PDE Solver for European Put",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Tridiagonal solver: Thomas algorithm (a=lower, b=diag, c=upper, d=rhs)
void tdma(std::vector<double> a, std::vector<double> b,
          std::vector<double> c, std::vector<double>& d) {
  int n = d.size();
  for (int i = 1; i < n; ++i) {
    double w = a[i] / b[i-1];
    b[i] -= w * c[i-1];
    d[i] -= w * d[i-1];
  }
  d[n-1] /= b[n-1];
  for (int i = n-2; i >= 0; --i)
    d[i] = (d[i] - c[i]*d[i+1]) / b[i];
}

double cn_euro_put(double S0, double K, double r, double sigma,
                   double T, int M = 100, int N = 100) {
  double Smax = 4*K, dS = Smax/M, dt = T/N;
  double s2   = sigma*sigma;
  std::vector<double> V(M+1);
  for (int i = 0; i <= M; ++i) V[i] = std::max(K - i*dS, 0.0);

  for (int n = 0; n < N; ++n) {
    std::vector<double> a(M-1), b(M-1), c(M-1), d(M-1);
    for (int i = 1; i < M; ++i) {
      double si = i*dS;
      double A  =  0.25*dt*(s2*si*si/(dS*dS) - r*si/dS);
      double B  = -0.5 *dt*(s2*si*si/(dS*dS) + r);
      double C  =  0.25*dt*(s2*si*si/(dS*dS) + r*si/dS);
      a[i-1] = -A; b[i-1] = 1-B; c[i-1] = -C;
      d[i-1] = A*V[i-1] + (1+B)*V[i] + C*V[i+1];
    }
    d[0]   += A*K;   // lower BC: V[0]=K (S=0 → put = K)
    tdma(a, b, c, d);
    for (int i = 1; i < M; ++i) V[i] = d[i-1];
    V[0] = K; V[M] = 0;
  }
  int idx = static_cast<int>(S0/dS);
  double w = S0/dS - idx;
  return (1-w)*V[idx] + w*V[idx+1];
}`,
    explanation: "Crank-Nicolson averages an explicit and implicit finite-difference step, giving second-order accuracy in both space and time (O(dt²+dS²)) without the stability constraint of fully explicit methods. The Thomas algorithm solves the resulting tridiagonal system in O(M) — critical for recalibration loops that price thousands of strikes.",
  },
  {
    id: "cpp-20260721-b1-variant-instrument",
    language: "cpp",
    title: "std::variant Instrument Hierarchy",
    tag: "modern-cpp",
    code: `#include <variant>
#include <cmath>
#include <cstdio>

struct EuropeanCall { double S, K, r, v, T; };
struct EuropeanPut  { double S, K, r, v, T; };
struct ZeroCouponBond { double face, ytm, T; };

// Unified instrument type: no virtual dispatch, no heap allocation
using Instrument = std::variant<EuropeanCall, EuropeanPut, ZeroCouponBond>;

// Visitor computes price for any instrument
struct PriceVisitor {
  double operator()(const EuropeanCall& c) const {
    // Simplified BS call (full N(d1/d2) omitted for brevity)
    double d1 = (std::log(c.S/c.K) + (c.r+0.5*c.v*c.v)*c.T)/(c.v*std::sqrt(c.T));
    return c.S * 0.5 - c.K * std::exp(-c.r*c.T) * 0.5;  // stub
  }
  double operator()(const EuropeanPut& p) const {
    return p.K * std::exp(-p.r*p.T) * 0.5 - p.S * 0.5;   // stub
  }
  double operator()(const ZeroCouponBond& b) const {
    return b.face * std::exp(-b.ytm * b.T);
  }
};

double price(const Instrument& inst) {
  return std::visit(PriceVisitor{}, inst);
}

// Usage
Instrument call = EuropeanCall{100, 100, 0.05, 0.2, 1.0};
Instrument bond = ZeroCouponBond{1000, 0.04, 5.0};
// price(call);  price(bond);`,
    explanation: "std::variant stores one of several alternatives with zero heap allocation; std::visit dispatches to the correct overload at runtime via a jump table. This replaces virtual inheritance for closed instrument sets — the compiler sees all types and can inline visitors, enabling vectorisation across variant arrays.",
  },
  {
    id: "cpp-20260721-b1-bit-cast-price",
    language: "cpp",
    title: "std::bit_cast for Fixed-Width Price Encoding",
    tag: "modern-cpp",
    code: `#include <bit>
#include <cstdint>
#include <cstdio>
#include <cstring>

// FIX/ITCH: prices are sent as int64 with implicit decimal places
// e.g. $123.45 is stored as 12345000 with scale 1e-5

struct Price {
  int64_t  raw;         // price * scale_factor
  int      scale_exp;   // e.g. 5 → factor = 100000
};

Price encode_price(double p, int scale_exp = 5) {
  double factor = 1.0;
  for (int i = 0; i < scale_exp; ++i) factor *= 10;
  return {static_cast<int64_t>(p * factor + 0.5), scale_exp};
}

double decode_price(Price px) {
  double factor = 1.0;
  for (int i = 0; i < px.scale_exp; ++i) factor *= 10;
  return px.raw / factor;
}

// bit_cast: reinterpret bit pattern without UB (replaces memcpy trick)
// Useful when mapping network packets to C++ structs
struct PacketHeader { uint32_t seq; uint32_t len; };

void demo() {
  uint8_t buf[8] = {0x00,0x00,0x01,0x2C, 0x00,0x00,0x00,0x10};
  // Safe bit-cast: PacketHeader must be trivially copyable
  auto hdr = std::bit_cast<PacketHeader, std::array<uint8_t,8>>(
               *reinterpret_cast<std::array<uint8_t,8>*>(buf));
  std::printf("seq=%u  len=%u\\n", __builtin_bswap32(hdr.seq),
                                    __builtin_bswap32(hdr.len));
}`,
    explanation: "std::bit_cast<T, U>(x) reinterprets the bit pattern of x as type T without invoking undefined behaviour — the prior idiom (memcpy into a char array then back) was technically UB. In exchange feed parsing, bit_cast maps raw network bytes directly to struct fields at zero cost.",
  },
  {
    id: "cpp-20260721-b1-gauss-legendre",
    language: "cpp",
    title: "5-Point Gauss-Legendre Quadrature for Option Pricing",
    tag: "math",
    code: `#include <array>
#include <functional>
#include <cmath>

// 5-point GL nodes and weights on [-1, 1]
constexpr std::array<double,5> GL_X = {
  -0.9061798459, -0.5384693101, 0.0,
   0.5384693101,  0.9061798459};
constexpr std::array<double,5> GL_W = {
   0.2369268851,  0.4786286705, 0.5688888889,
   0.4786286705,  0.2369268851};

// Integrate f on [a, b] using 5-point Gauss-Legendre
double gl_integrate(std::function<double(double)> f, double a, double b) {
  double mid = 0.5*(a+b), half = 0.5*(b-a);
  double sum  = 0;
  for (int i = 0; i < 5; ++i)
    sum += GL_W[i] * f(mid + half * GL_X[i]);
  return half * sum;
}

// Price digital call by integrating the log-normal density
double digital_call_quadrature(double S, double K, double r,
                                double sigma, double T) {
  double lnK    = std::log(K);
  double mu_log = std::log(S) + (r - 0.5*sigma*sigma)*T;
  double sig_log = sigma * std::sqrt(T);
  double disc    = std::exp(-r*T);

  // f(x) = log-normal density * indicator(x >= K)
  double prob = gl_integrate([&](double x) {
    double u = (std::log(x) - mu_log) / sig_log;
    return std::exp(-0.5*u*u) / (x * sig_log * std::sqrt(2*M_PI));
  }, K, 8*S);   // truncate at 8x spot — negligible tail

  return disc * prob;
}`,
    explanation: "Gaussian quadrature achieves exponential convergence for smooth integrands — a 5-point GL rule is exact for polynomials up to degree 9. Digital options, compound options, and characteristic-function integrals where the analytic formula is unknown are common quadrature targets in structured products desks.",
  },
  {
    id: "cpp-20260721-b1-treiber-stack",
    language: "cpp",
    title: "Treiber Lock-Free Stack (ABA-Safe)",
    tag: "concurrency",
    code: `#include <atomic>
#include <optional>

// Treiber lock-free stack: push/pop via CAS loop
// ABA hazard mitigated by tagged pointer (counter in upper 16 bits)
template <typename T>
class TreiberStack {
  struct Node { T data; Node* next; };

  // Pack pointer + tag into 64-bit word to detect ABA
  struct Tagged {
    Node*    ptr   = nullptr;
    uint64_t tag   = 0;
  };
  std::atomic<Tagged> head_{Tagged{}};

public:
  void push(T val) {
    Node* node = new Node{std::move(val), nullptr};
    Tagged old = head_.load(std::memory_order_relaxed);
    Tagged next;
    do {
      node->next = old.ptr;
      next = {node, old.tag + 1};
    } while (!head_.compare_exchange_weak(old, next,
              std::memory_order_release,
              std::memory_order_relaxed));
  }

  std::optional<T> pop() {
    Tagged old = head_.load(std::memory_order_acquire);
    Tagged next;
    do {
      if (!old.ptr) return std::nullopt;
      next = {old.ptr->next, old.tag + 1};
    } while (!head_.compare_exchange_weak(old, next,
              std::memory_order_acquire,
              std::memory_order_relaxed));
    T val = std::move(old.ptr->data);
    delete old.ptr;   // hazard: safe only when no concurrent pop recycles
    return val;
  }
};`,
    explanation: "The ABA problem occurs when a thread reads head=A, another pops A, pushes B then A back, and the first thread's CAS spuriously succeeds. Tagging the pointer with a monotonically increasing counter detects ABA because (A,tag+2) ≠ (A,tag). Lock-free stacks are used for work-stealing thread pools in HFT compute grids.",
  },
  {
    id: "cpp-20260721-b1-jthread-stopper",
    language: "cpp",
    title: "std::jthread with stop_token for Graceful Shutdown",
    tag: "concurrency",
    code: `#include <thread>
#include <stop_token>
#include <chrono>
#include <cstdio>

// C++20 std::jthread automatically joins on destruction
// stop_token enables cooperative cancellation without shared atomics

void market_data_loop(std::stop_token st, int feed_id) {
  while (!st.stop_requested()) {
    // Poll exchange feed; process packets
    std::printf("feed %d: processing\\n", feed_id);
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }
  std::printf("feed %d: clean shutdown\\n", feed_id);
}

void run_feeds() {
  // Launch two feed threads with built-in stop mechanism
  std::jthread feed1{market_data_loop, 1};
  std::jthread feed2{market_data_loop, 2};

  std::this_thread::sleep_for(std::chrono::milliseconds(50));

  // request_stop() signals both threads; destructor joins them
  feed1.request_stop();
  feed2.request_stop();
  // jthread destructor calls join() — no manual join needed
}

// stop_callback: run cleanup when stop is requested
void with_cleanup(std::stop_token st) {
  std::stop_callback cb{st, []{ std::printf("flushing output queue\\n"); }};
  while (!st.stop_requested()) { /* work */ }
}`,
    explanation: "std::jthread owns a stop_source internally; passing its stop_token to the worker avoids a shared_ptr<atomic_bool>. stop_callback runs synchronously when stop is requested, enabling ordered teardown (flush queues, close sockets) before join. This replaces ad-hoc volatile bool flags common in HFT threading code.",
  },
  {
    id: "cpp-20260721-b1-tls-rng",
    language: "cpp",
    title: "Thread-Local RNG State for Parallel MC",
    tag: "concurrency",
    code: `#include <random>
#include <thread>
#include <vector>
#include <atomic>
#include <cstdio>

// Each thread gets its own mt19937_64 seeded from a per-thread seed
// Avoids contention on a shared RNG and eliminates false sharing
thread_local std::mt19937_64 tl_rng{
  std::hash<std::thread::id>{}(std::this_thread::get_id())
};
thread_local std::normal_distribution<double> tl_norm{0.0, 1.0};

// Thread-safe normal sample: no locks, no atomic, no cache-line ping-pong
inline double randn() { return tl_norm(tl_rng); }

std::atomic<double> g_total{0.0};

void mc_worker(double S, double K, double r, double sigma,
               double T, int paths_per_thread) {
  double dt = T;
  double drift = (r - 0.5*sigma*sigma)*dt;
  double vol   = sigma * std::sqrt(dt);
  double sum   = 0;
  for (int p = 0; p < paths_per_thread; ++p) {
    double ST = S * std::exp(drift + vol * randn());
    sum += std::max(ST - K, 0.0);
  }
  // Atomic add: rare, only once per thread at end
  g_total.fetch_add(sum * std::exp(-r*T), std::memory_order_relaxed);
}`,
    explanation: "thread_local gives each OS thread its own copy of an object with zero synchronisation overhead. Seeding each thread from its id (hashed) guarantees statistically independent streams — a better practice than seeding from thread index 0, 1, 2... which can correlate low-dimensional quasi-random sequences.",
  },
  {
    id: "cpp-20260721-b1-fast-exp-table",
    language: "cpp",
    title: "Fast exp() via Piecewise-Linear Lookup Table",
    tag: "math",
    code: `#include <array>
#include <cmath>
#include <cstdint>

// Approximate exp(x) for x in [-10, 0] using 1024-entry table
// Useful for discount factor loops where full exp() is too slow
namespace fast_math {

static constexpr int   TABLE_BITS = 10;
static constexpr int   TABLE_SIZE = 1 << TABLE_BITS;
static constexpr double X_MIN = -10.0, X_MAX = 0.0;
static constexpr double SCALE = TABLE_SIZE / (X_MAX - X_MIN);

struct ExpTable {
  std::array<double, TABLE_SIZE + 1> v{};
  consteval ExpTable() {  // computed at compile time (C++20)
    for (int i = 0; i <= TABLE_SIZE; ++i) {
      double x = X_MIN + i / SCALE;
      v[i] = /* std::exp(x) — consteval can't call libm, so init at runtime */ 0;
    }
  }
};

// Runtime initialisation (consteval can't call libm in practice)
inline const auto& table() {
  static struct T {
    std::array<double, TABLE_SIZE + 1> v;
    T() { for (int i = 0; i <= TABLE_SIZE; ++i)
            v[i] = std::exp(X_MIN + i / SCALE); }
  } t;
  return t.v;
}

inline double fast_exp(double x) {
  double t   = (x - X_MIN) * SCALE;
  int    idx = static_cast<int>(t);
  double frac = t - idx;
  const auto& tab = table();
  return tab[idx] + frac * (tab[idx+1] - tab[idx]);  // linear interp
}

} // namespace fast_math`,
    explanation: "A lookup table with linear interpolation approximates exp() with ~1 ULP error and roughly 3× the throughput of libm on architectures where exp() is not micro-coded. Used in discount factor loops where thousands of calls to exp(-r*dt) dominate MC simulation wall time.",
  },
  {
    id: "cpp-20260721-b1-constinit-config",
    language: "cpp",
    title: "constinit Global Market Configuration",
    tag: "modern-cpp",
    code: `#include <cstdint>
#include <string_view>

// constinit: zero-initialised before any dynamic init,
// preventing the "static initialisation order fiasco"
// but allows runtime-mutable values (unlike constexpr)

struct MarketConfig {
  double  tick_size     = 0.01;
  double  lot_size      = 100.0;
  int32_t max_order_qty = 50'000;
  bool    is_live       = false;
  std::string_view symbol = "AAPL";   // string_view is trivially constructible
};

constinit MarketConfig g_config;   // guaranteed zero-init before main()

// Functions may update at runtime (e.g., from a config file)
void load_config_from_env() {
  g_config.tick_size     = 0.001;
  g_config.max_order_qty = 100'000;
  g_config.is_live       = true;
}

// constinit prevents subtle bugs where one TU's static reads another's
// before it has been initialised — the compiler enforces zero-init at
// declaration time rather than the first dynamic initialiser

constinit thread_local int g_thread_id = -1;  // thread_local + constinit`,
    explanation: "constinit guarantees the variable is zero-initialised at the start of the program, before any dynamic initialisation runs. This eliminates the static initialisation order fiasco for global configuration objects that are read by other statics. Unlike constexpr, constinit variables can be mutated after startup.",
  },
  {
    id: "cpp-20260721-b1-trinomial-tree",
    language: "cpp",
    title: "Trinomial Tree for American Put (Kamrad-Ritchken)",
    tag: "quant",
    code: `#include <vector>
#include <cmath>
#include <algorithm>

// Kamrad-Ritchken trinomial tree: lambda=sqrt(3) parameterisation
double trinomial_american_put(double S0, double K, double r,
                               double sigma, double T, int steps) {
  double dt    = T / steps;
  double u     = std::exp(sigma * std::sqrt(3.0 * dt));
  double d     = 1.0 / u;
  double drift = r - 0.5 * sigma * sigma;
  double sq    = std::sqrt(dt / (12.0 * sigma * sigma));
  double pu    = 1.0/6.0 + drift * sq;
  double pm    = 2.0/3.0;
  double pd    = 1.0/6.0 - drift * sq;
  double disc  = std::exp(-r * dt);

  // Terminal nodes: (2*steps+1) prices spanning S0*d^steps..S0*u^steps
  int n = 2 * steps + 1;
  std::vector<double> V(n);
  for (int j = 0; j < n; ++j) {
    double S = S0 * std::pow(u, steps - j);
    V[j]    = std::max(K - S, 0.0);    // put payoff
  }

  // Backward induction (in-place, node count shrinks by 2 each step)
  for (int i = steps - 1; i >= 0; --i) {
    for (int j = 0; j <= 2 * i; ++j) {
      double cont = disc * (pu * V[j] + pm * V[j+1] + pd * V[j+2]);
      double S    = S0 * std::pow(u, i - j);
      V[j]  = std::max(K - S, cont);   // early-exercise check
    }
  }
  return V[0];
}`,
    explanation: "The trinomial tree adds a middle (stay) branch to the binomial, improving convergence for American options and allowing a larger time step (by factor √3) for the same accuracy. Kamrad-Ritchken's λ=√3 minimises the error coefficient compared to standard trinomial parameterisations.",
  },
  {
    id: "cpp-20260721-b1-pmr-arena",
    language: "cpp",
    title: "std::pmr Monotonic Buffer for Scratch Allocation",
    tag: "memory",
    code: `#include <memory_resource>
#include <vector>
#include <string>
#include <cstdio>

// PMR (Polymorphic Memory Resource): swap allocators without changing containers
void price_batch(const std::vector<double>& spots) {
  // Stack-backed arena: zero heap allocation for temporary objects
  alignas(64) char   arena[64 * 1024];   // 64 KB on the stack
  std::pmr::monotonic_buffer_resource pool{arena, sizeof(arena)};
  // Overflow falls back to new_delete_resource automatically

  // STL containers using the arena allocator
  std::pmr::vector<double> prices{&pool};
  std::pmr::vector<std::pmr::string> labels{&pool};
  prices.reserve(spots.size());
  labels.reserve(spots.size());

  for (double s : spots) {
    prices.push_back(s * 1.02);             // mark at 2% over spot
    char buf[32];
    std::snprintf(buf, sizeof(buf), "STRIKE=%.2f", s);
    labels.emplace_back(buf, &pool);        // string also arena-allocated
  }

  std::printf("priced %zu instruments\\n", prices.size());
  // All pmr objects above destroyed here; no heap to free
}`,
    explanation: "std::pmr::monotonic_buffer_resource bumps a pointer forward for each allocation and frees the entire arena in O(1) — perfect for request-scoped scratch space in a pricing server. The PMR interface lets std::vector and std::string participate in the arena without changing their template parameters.",
  },
  {
    id: "cpp-20260721-b1-fixed-point-tick",
    language: "cpp",
    title: "Fixed-Point Tick Arithmetic for Prices",
    tag: "systems",
    code: `#include <cstdint>
#include <cstdio>
#include <stdexcept>

// Prices stored as integer ticks avoids floating-point rounding
// and allows branchless comparison in the order book hot path

struct TickPrice {
  int64_t raw;       // price * 10^precision
  int     precision; // decimal places (e.g. 4 for $0.0001 tick)

  static TickPrice from_double(double p, int prec = 4) {
    double factor = 1;
    for (int i = 0; i < prec; ++i) factor *= 10;
    return {static_cast<int64_t>(p * factor + 0.5), prec};
  }

  double to_double() const {
    double factor = 1;
    for (int i = 0; i < precision; ++i) factor *= 10;
    return raw / factor;
  }

  TickPrice operator+(TickPrice o) const {
    if (precision != o.precision) throw std::invalid_argument("precision mismatch");
    return {raw + o.raw, precision};
  }

  bool operator<(TickPrice o) const { return raw < o.raw; }
  bool operator==(TickPrice o) const { return raw == o.raw; }
};

// Example: represent $152.3456 with 4 decimal places = 1523456 ticks
auto p = TickPrice::from_double(152.3456, 4);
// p.raw == 1523456  — exact integer comparison in order book`,
    explanation: "Storing prices as integers eliminates floating-point rounding in order matching. Two prices that are equal should compare equal — floating-point 0.1+0.2 ≠ 0.3 but 1+2 == 3. CME and NYSE ITCH protocols transmit prices as scaled integers; converting at the boundary (not internally) is the HFT standard.",
  },
  {
    id: "cpp-20260721-b1-lookback-mc",
    language: "cpp",
    title: "Floating-Strike Lookback Call MC",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <algorithm>
#include <numeric>

// Floating-strike lookback call: payoff = S_T - min(S_t) over [0,T]
// No closed-form exists for discrete monitoring
double lookback_call_mc(double S0, double r, double sigma, double T,
                         int steps, int paths, uint64_t seed = 42) {
  std::mt19937_64 rng(seed);
  std::normal_distribution<double> norm;
  double dt    = T / steps;
  double drift = (r - 0.5*sigma*sigma)*dt;
  double vol   = sigma * std::sqrt(dt);
  double disc  = std::exp(-r*T);

  double sum = 0;
  for (int p = 0; p < paths; ++p) {
    double S   = S0, S_min = S0;
    for (int s = 0; s < steps; ++s) {
      S    *= std::exp(drift + vol * norm(rng));
      S_min = std::min(S_min, S);   // running minimum
    }
    sum += S - S_min;               // payoff: S_T - min(S)
  }
  return disc * sum / paths;
}

// Continuous-monitoring closed form (Goldman-Sosin-Gatto 1979)
double lookback_call_analytical(double S, double r, double sigma, double T) {
  auto N = [](double x){ return 0.5*std::erfc(-x/std::sqrt(2.0)); };
  double d = (r + 0.5*sigma*sigma)*T / (sigma*std::sqrt(T));
  return S*(N(d) - sigma*sigma/(2*r)*(std::exp(-r*T)*N(d-sigma*std::sqrt(T))
            - N(d)) + std::exp(-r*T)*sigma*sigma/(2*r)*N(d-sigma*std::sqrt(T)));
}`,
    explanation: "Lookback options give the holder the best possible entry price, so the payoff tracks the path minimum (for calls) or maximum (for puts). Discrete-monitoring lookbacks have no closed form and require MC or PDE methods. The continuous-monitoring formula provides an upper bound and a useful control variate.",
  },
  {
    id: "cpp-20260721-b1-acqrel-fence",
    language: "cpp",
    title: "Acquire-Release Memory Ordering for Producer-Consumer",
    tag: "concurrency",
    code: `#include <atomic>
#include <cstdint>
#include <cassert>

// Acquire-release pairs establish happens-before without seq_cst cost
// Producer writes data, then sets a flag with release
// Consumer reads the flag with acquire, then reads data safely

struct MarketTick {
  double bid, ask;
  uint64_t ns;
};

class TickSlot {
  MarketTick data_{};
  std::atomic<uint64_t> seq_{0};   // odd = writing, even = ready

public:
  void publish(const MarketTick& t) {
    seq_.fetch_add(1, std::memory_order_relaxed);  // mark as dirty
    std::atomic_thread_fence(std::memory_order_release);
    data_ = t;                                      // write payload
    seq_.fetch_add(1, std::memory_order_release);   // mark as ready
  }

  bool try_read(MarketTick& out) const {
    uint64_t s1 = seq_.load(std::memory_order_acquire);
    if (s1 & 1) return false;   // writer in progress
    out = data_;
    std::atomic_thread_fence(std::memory_order_acquire);
    uint64_t s2 = seq_.load(std::memory_order_relaxed);
    return s1 == s2;            // no write happened during our read
  }
};`,
    explanation: "seq_cst (the default) inserts a full memory fence that can stall the CPU pipeline. acquire-release pairs are cheaper: release ensures all prior stores are visible before the flag, acquire ensures all subsequent loads see stores from before the flag. This sequence-number idiom (seqlock) is used in single-writer feed handlers.",
  },
  {
    id: "cpp-20260721-b1-van-der-corput",
    language: "cpp",
    title: "Van der Corput Low-Discrepancy Sequence (Base-2)",
    tag: "math",
    code: `#include <cstdint>
#include <vector>
#include <cstdio>

// Van der Corput sequence in base 2: bit-reversal of the index
// Fills [0,1) more uniformly than pseudo-random for MC integration
double van_der_corput(uint64_t n, int base = 2) {
  double result  = 0.0;
  double factor  = 1.0 / base;
  while (n > 0) {
    result += (n % base) * factor;
    n      /= base;
    factor /= base;
  }
  return result;
}

// Halton sequence: VdC in two co-prime bases → 2D quasi-random
struct HaltonPoint { double x, y; };
HaltonPoint halton(uint64_t n) {
  return {van_der_corput(n, 2), van_der_corput(n, 3)};
}

// Use Halton for MC integration — compare to pseudo-random
double pi_estimate_halton(int n) {
  int inside = 0;
  for (int i = 1; i <= n; ++i) {
    auto [x, y] = halton(i);
    if (x*x + y*y <= 1.0) ++inside;
  }
  return 4.0 * inside / n;
}

// pi_estimate_halton(10000) converges faster than pseudo-random MC
// Error decays as O(log(n)^d / n) vs O(1/sqrt(n)) for MC`,
    explanation: "Quasi-Monte Carlo replaces pseudo-random samples with low-discrepancy sequences that fill the unit hypercube more evenly. The van der Corput sequence reflects the binary digits of n across the decimal point. For d=1 or 2 dimensions, QMC can achieve order-of-magnitude variance reduction versus standard MC in option pricing.",
  },
  {
    id: "cpp-20260721-b1-format-trade-log",
    language: "cpp",
    title: "std::format for Structured Trade Event Logging",
    tag: "modern-cpp",
    code: `#include <format>
#include <chrono>
#include <string>
#include <cstdint>
#include <iostream>

enum class Side { Buy, Sell };

struct TradeEvent {
  uint64_t    order_id;
  std::string symbol;
  Side        side;
  double      price;
  int32_t     qty;
  int64_t     ns_epoch;
};

// std::format: type-safe, locale-free, faster than printf for complex layouts
std::string format_trade(const TradeEvent& e) {
  return std::format(
    "[{:20}] {:>6} {:4} {:>10.4f} x {:>6} id={:016x}",
    e.ns_epoch,
    e.symbol,
    e.side == Side::Buy ? "BUY" : "SELL",
    e.price,
    e.qty,
    e.order_id
  );
}

// Custom formatter for Side enum
template <>
struct std::formatter<Side> : std::formatter<std::string_view> {
  auto format(Side s, auto& ctx) const {
    return std::formatter<std::string_view>::format(
      s == Side::Buy ? "B" : "S", ctx);
  }
};

// Usage
TradeEvent ev{0xDEADBEEF12345678ULL, "AAPL", Side::Buy, 152.34, 500,
              1721865600000000000LL};
// std::cout << format_trade(ev) << "\\n";`,
    explanation: "std::format (C++20) is compile-time type-safe and avoids the format-string vulnerabilities of printf. Custom formatters for domain types (Side, Price, OrderId) eliminate ad-hoc to_string helpers scattered across a codebase. Structured logging in matching engines typically serialises to a fixed-width columnar format for fast grep.",
  },
  {
    id: "cpp-20260721-b1-binomial-rn-prob",
    language: "cpp",
    title: "Risk-Neutral Probability Calibration (Arrow-Debreu)",
    tag: "quant",
    code: `#include <cmath>
#include <vector>
#include <cstdio>

// Calibrate risk-neutral probabilities from market prices of Arrow-Debreu
// securities (state prices) — foundation of implied tree models

struct BinomialStep {
  double S_u, S_d;   // up and down prices at next step
  double p_u, p_d;   // risk-neutral probabilities
};

// Given spot S, forward F, and vol sigma, compute risk-neutral probs
BinomialStep risk_neutral_step(double S, double r, double sigma, double dt) {
  double u  = std::exp(sigma * std::sqrt(dt));
  double d  = 1.0 / u;
  double df = std::exp(-r * dt);
  // Forward must equal discounted expected value
  // F = p_u * S*u + p_d * S*d,  p_u + p_d = 1
  double p_u = (std::exp(r*dt) - d) / (u - d);
  double p_d = 1.0 - p_u;
  return {S*u, S*d, p_u, p_d};
}

// Arrow-Debreu price: price of $1 paid in node (i,j) only
std::vector<std::vector<double>>
arrow_debreu_prices(double S0, double r, double sigma, double dt, int steps) {
  int n = steps + 1;
  std::vector<std::vector<double>> AD(n, std::vector<double>(n, 0));
  AD[0][0] = 1.0;
  for (int i = 0; i < steps; ++i) {
    auto [Su, Sd, pu, pd] = risk_neutral_step(S0, r, sigma, dt);
    double df = std::exp(-r*dt);
    for (int j = 0; j <= i; ++j) {
      AD[i+1][j]   += df * pu * AD[i][j];
      AD[i+1][j+1] += df * pd * AD[i][j];
    }
  }
  return AD;
}`,
    explanation: "Arrow-Debreu (state) prices are discount factors for individual nodes in a binomial tree. Summing AD prices weighted by payoffs prices any derivative without discounting — they already embed both probability and time value. Implied tree models (Derman-Kani) calibrate AD prices to match the observed vol surface.",
  },
  {
    id: "cpp-20260721-b1-numa-alloc",
    language: "cpp",
    title: "NUMA-Aware Memory Allocation for Market Data",
    tag: "systems",
    code: `// NUMA (Non-Uniform Memory Access): on multi-socket servers,
// accessing memory on the remote socket adds ~60ns latency
// Link with: -lnuma  (Linux only)
#ifdef __linux__
#include <numa.h>
#include <numaif.h>
#endif
#include <cstddef>
#include <cstdlib>
#include <stdexcept>

struct NumaBuffer {
  void*  ptr   = nullptr;
  size_t bytes = 0;
  int    node  = 0;

  NumaBuffer(size_t sz, int numa_node = 0) : bytes(sz), node(numa_node) {
#ifdef __linux__
    if (numa_available() < 0) throw std::runtime_error("NUMA unavailable");
    ptr = numa_alloc_onnode(sz, numa_node);
    if (!ptr) throw std::bad_alloc{};
#else
    // Fallback on non-NUMA platforms
    if (posix_memalign(&ptr, 64, sz) != 0) throw std::bad_alloc{};
#endif
  }

  ~NumaBuffer() {
#ifdef __linux__
    if (ptr) numa_free(ptr, bytes);
#else
    free(ptr);
#endif
  }

  // Pin the calling thread to the same NUMA node as the buffer
  void pin_thread() {
#ifdef __linux__
    numa_run_on_node(node);
    numa_set_preferred(node);
#endif
  }

  NumaBuffer(const NumaBuffer&)            = delete;
  NumaBuffer& operator=(const NumaBuffer&) = delete;
};`,
    explanation: "On 2-socket NUMA servers (common in co-location cages), a cache miss that crosses the QPI link costs ~100 ns vs ~40 ns for local memory. Pinning both the thread and its data to the same NUMA node cuts worst-case latency nearly in half for tick-to-trade paths. numa_alloc_onnode allocates directly on the specified socket.",
  },
  {
    id: "cpp-20260721-b1-mmap-deleter",
    language: "cpp",
    title: "unique_ptr Custom Deleter for mmap Buffers",
    tag: "memory",
    code: `#include <memory>
#include <sys/mman.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdexcept>
#include <cstddef>

// Custom deleter: encodes both pointer and size needed by munmap
struct MmapDeleter {
  size_t size;
  void operator()(void* p) const noexcept {
    if (p && p != MAP_FAILED) munmap(p, size);
  }
};

using MmapBuffer = std::unique_ptr<void, MmapDeleter>;

// Returns a unique_ptr that automatically calls munmap on destruction
MmapBuffer open_mmap(const char* path, size_t size,
                     bool writable = false) {
  int flags = writable ? O_RDWR : O_RDONLY;
  int fd    = ::open(path, flags);
  if (fd < 0) throw std::runtime_error("open failed");

  int prot  = PROT_READ | (writable ? PROT_WRITE : 0);
  void* ptr = mmap(nullptr, size, prot, MAP_SHARED, fd, 0);
  ::close(fd);   // safe to close fd after mmap — mapping stays alive

  if (ptr == MAP_FAILED) throw std::runtime_error("mmap failed");
  return MmapBuffer{ptr, MmapDeleter{size}};
}

// Usage: buffer is automatically unmapped when it goes out of scope
// auto buf = open_mmap("/dev/shm/tick_feed", 64*1024*1024);
// const auto* ticks = static_cast<const Tick*>(buf.get());`,
    explanation: "munmap requires the same pointer and size passed to mmap — a std::unique_ptr with a custom deleter captures both. This gives mmap buffers RAII semantics and correct cleanup on exceptions. Shared memory via /dev/shm is the standard IPC mechanism between a feed handler and a strategy process in HFT.",
  },
  {
    id: "cpp-20260721-b1-requires-clause",
    language: "cpp",
    title: "requires Clause vs. enable_if — Modern Constraint Style",
    tag: "concepts",
    code: `#include <concepts>
#include <type_traits>
#include <cmath>

// Old style: SFINAE with enable_if — verbose and opaque errors
template <typename T,
          std::enable_if_t<std::is_floating_point_v<T>, int> = 0>
T bs_price_old(T S, T K, T r, T v, T t) {
  return S - K * std::exp(-r*t);  // stub
}

// C++20 style A: requires clause after parameter list
template <typename T>
T bs_price_new(T S, T K, T r, T v, T t) requires std::floating_point<T> {
  return S - K * std::exp(-r*t);  // stub
}

// C++20 style B: abbreviated function template with concept
auto bs_delta(std::floating_point auto S, std::floating_point auto K,
              std::floating_point auto v, std::floating_point auto t)
  -> double {
  return 0.5 + (std::log(S/K)) / (v * std::sqrt(t));  // rough
}

// Ad-hoc requires expression (inline concept check)
template <typename T>
double npv(T portfolio) requires requires(T p) {
  { p.positions() } -> std::ranges::range;
  { p.discount_factor(0.0) } -> std::convertible_to<double>;
} {
  return 0; // stub
}`,
    explanation: "requires clauses appear on the function signature in readable English. Style A keeps the template parameter visible; style B uses abbreviated syntax where the concept IS the type. Both generate better error messages than enable_if because the compiler reports 'constraint not satisfied' at the call site, not inside a substitution failure stack.",
  },
  {
    id: "cpp-20260721-b1-delta-encode-prices",
    language: "cpp",
    title: "Delta-Encoded Price Stream Compression",
    tag: "parsing",
    code: `#include <vector>
#include <cstdint>
#include <cstdio>

// Delta encoding: store differences rather than absolute prices
// L2 order book updates are small perturbations — compresses 10:1+

struct DeltaEncoder {
  int64_t last_ = 0;

  // Encode: output zigzag-encoded delta (maps signed → unsigned)
  uint64_t encode(int64_t price_ticks) {
    int64_t delta = price_ticks - last_;
    last_         = price_ticks;
    // ZigZag: move sign bit to LSB so small negatives encode small
    return static_cast<uint64_t>((delta << 1) ^ (delta >> 63));
  }

  int64_t decode(uint64_t encoded) {
    // Undo ZigZag
    int64_t delta = static_cast<int64_t>((encoded >> 1) ^ -(encoded & 1));
    last_ += delta;
    return last_;
  }
};

// Varint (variable-length integer) encoding for the delta
size_t write_varint(uint64_t v, uint8_t* out) {
  size_t n = 0;
  while (v >= 0x80) {
    out[n++] = static_cast<uint8_t>(v | 0x80);
    v >>= 7;
  }
  out[n++] = static_cast<uint8_t>(v);
  return n;
}

// Example: prices 15230000, 15230100, 15229900 (ticks)
// Deltas: 0, +100, -200  → encoded: 0, 200, 399 → 1-3 bytes each`,
    explanation: "Delta + ZigZag + Varint is the encoding chain used by CME MDP3 and FAST/SBE protocols. ZigZag maps small negative integers to small unsigned values, enabling varint to encode them in 1–2 bytes instead of 8. Real-world order book updates compress 5–8 bytes of raw price to 1–2 bytes delta-coded.",
  },
  {
    id: "cpp-20260721-b1-nttp-dispatch",
    language: "cpp",
    title: "Non-Type Template Parameter (NTTP) Option Type Dispatch",
    tag: "templates",
    code: `#include <cmath>

// Use NTTP to specialise pricer at compile time — zero runtime branching
enum class OptionType { Call, Put };
enum class ExerciseStyle { European, American };

template <OptionType OT, ExerciseStyle ES>
struct OptionPricer;

// European Call specialisation
template <>
struct OptionPricer<OptionType::Call, ExerciseStyle::European> {
  static double payoff(double S, double K) { return std::max(S - K, 0.0); }
  static double intrinsic(double S, double K) { return std::max(S - K, 0.0); }
  static constexpr bool early_exercise = false;
};

// European Put specialisation
template <>
struct OptionPricer<OptionType::Put, ExerciseStyle::European> {
  static double payoff(double S, double K) { return std::max(K - S, 0.0); }
  static double intrinsic(double S, double K) { return std::max(K - S, 0.0); }
  static constexpr bool early_exercise = false;
};

// American put adds early-exercise flag
template <>
struct OptionPricer<OptionType::Put, ExerciseStyle::American> {
  static double payoff(double S, double K) { return std::max(K - S, 0.0); }
  static constexpr bool early_exercise = true;
};

// Generic tree pricer: specialisation chosen at compile time
template <OptionType OT, ExerciseStyle ES>
double tree_price(double S0, double K, double r, double sigma, double T,
                  int steps) {
  using P = OptionPricer<OT, ES>;
  // ... binomial backward induction using P::payoff, P::early_exercise
  return P::payoff(S0, K);  // stub
}`,
    explanation: "Non-type template parameters allow compile-time specialisation on enum values, eliminating runtime branching in the innermost loop of a tree pricer. The compiler instantiates a separate, fully-optimised function for each (OptionType, ExerciseStyle) combination — crucial when the tree backward-induction loop runs millions of times per calibration.",
  },
  {
    id: "cpp-20260721-b1-corr-gbm",
    language: "cpp",
    title: "Correlated Multi-Asset GBM via Cholesky",
    tag: "quant",
    code: `#include <random>
#include <cmath>
#include <vector>
#include <array>
#include <numeric>

// Cholesky decomposition of 3x3 correlation matrix (lower triangular)
void cholesky3(const double C[3][3], double L[3][3]) {
  for (int i = 0; i < 3; ++i) {
    for (int j = 0; j <= i; ++j) {
      double sum = C[i][j];
      for (int k = 0; k < j; ++k) sum -= L[i][k]*L[j][k];
      L[i][j] = (i == j) ? std::sqrt(sum) : sum / L[j][j];
    }
    for (int j = i+1; j < 3; ++j) L[i][j] = 0;
  }
}

// Simulate correlated GBM paths for a 3-asset basket
void corr_gbm_paths(const std::array<double,3>& S0,
                    const std::array<double,3>& mu,
                    const std::array<double,3>& sigma,
                    const double corr[3][3],
                    double T, int steps, int paths,
                    std::vector<std::array<double,3>>& out,
                    uint64_t seed = 42) {
  double L[3][3];
  cholesky3(corr, L);
  double dt = T / steps;
  std::mt19937_64 rng(seed);
  std::normal_distribution<double> norm;
  out.resize(paths);
  for (auto& S : out) {
    S = S0;
    for (int s = 0; s < steps; ++s) {
      double z[3] = {norm(rng), norm(rng), norm(rng)};
      for (int i = 0; i < 3; ++i) {
        double w = 0;
        for (int j = 0; j <= i; ++j) w += L[i][j]*z[j];
        S[i] *= std::exp((mu[i]-0.5*sigma[i]*sigma[i])*dt + sigma[i]*std::sqrt(dt)*w);
      }
    }
  }
}`,
    explanation: "Cholesky decomposition maps independent normals z to correlated normals L·z, preserving each marginal volatility while introducing the desired pairwise correlations. This is the building block for rainbow option pricing, CVA simulation over a multi-factor rate+credit model, and correlated scenario generation in risk engines.",
  },
];
