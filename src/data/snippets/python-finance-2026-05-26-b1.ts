import type { Snippet } from "./types";

export const pythonFinanceSnippets20260526B1: Snippet[] = [
  {
    id: "pyfin-20260526-b1-merton-jump",
    language: "python",
    title: "Merton jump-diffusion Monte Carlo",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def merton_call(S, K, r, sigma, T, lam, mu_j, sig_j, n=200_000, seed=42):
    """
    Merton (1976) jump-diffusion: dS/S = (mu - lam*kappa)*dt + sigma*dW + J*dN
    J ~ N(mu_j, sig_j^2), dN ~ Poisson(lam*dt).
    Closed form: infinite sum of Black-Scholes prices weighted by Poisson probs.
    MC approach shown here for easy extension to path-dependent payoffs.
    kappa = E[e^J - 1] = exp(mu_j + 0.5*sig_j^2) - 1  (jump compensation)
    """
    rng    = np.random.default_rng(seed)
    kappa  = np.exp(mu_j + 0.5 * sig_j**2) - 1.0
    drift  = (r - 0.5*sigma**2 - lam*kappa) * T
    diffusion = sigma * np.sqrt(T)

    # Diffusive component
    z = rng.standard_normal(n)
    log_S = drift + diffusion * z

    # Compound Poisson jump component
    n_jumps = rng.poisson(lam * T, size=n)           # jumps per path
    for path in range(n):                             # loop for variable jumps
        if n_jumps[path] > 0:
            jump_sizes = rng.normal(mu_j, sig_j, size=n_jumps[path])
            log_S[path] += jump_sizes.sum()

    ST     = S * np.exp(log_S)
    payoff = np.maximum(ST - K, 0.0)
    return np.exp(-r * T) * payoff.mean()


def merton_closed_form(S, K, r, sigma, T, lam, mu_j, sig_j, n_terms=50):
    """
    Semi-closed form (Merton 1976): sum over n Poisson-weighted BS prices.
    P = sum_{n=0}^{inf} Poisson(n; lam'*T) * BS(S, K, r_n, sigma_n, T)
    where lam' = lam * exp(mu_j + 0.5*sig_j^2), r_n and sigma_n adjusted per jump count.
    """
    kappa  = np.exp(mu_j + 0.5 * sig_j**2) - 1.0
    lam_prime = lam * (1.0 + kappa)

    price = 0.0
    for n in range(n_terms):
        # Per-n parameters
        sigma_n = np.sqrt(sigma**2 + n * sig_j**2 / T)
        r_n     = r - lam * kappa + n * (mu_j + 0.5 * sig_j**2) / T
        sT = sigma_n * np.sqrt(T)
        d1 = (np.log(S / K) + (r_n + 0.5 * sigma_n**2) * T) / sT
        d2 = d1 - sT
        bs = S * norm.cdf(d1) - K * np.exp(-r_n * T) * norm.cdf(d2)

        # Poisson weight
        weight = np.exp(-lam_prime * T) * (lam_prime * T)**n / np.math.factorial(n)
        price += weight * bs

    return price


print(f"MC:     {merton_call(100, 100, 0.05, 0.2, 1.0, 0.1, -0.1, 0.2):.4f}")
print(f"Closed: {merton_closed_form(100, 100, 0.05, 0.2, 1.0, 0.1, -0.1, 0.2):.4f}")`,
    explanation:
      "The jump component creates fat tails and an implied-vol smile: out-of-the-money options carry higher implied vol because rare large moves inflate their probability. The semi-closed form converges quickly in n — 20 terms typically gives 6-figure accuracy. Calibrate λ, μⱼ, σⱼ to the observed smile; σ captures at-the-money vol, jumps explain the wings.",
  },
  {
    id: "pyfin-20260526-b1-sobol-mc",
    language: "python",
    title: "Sobol quasi-random Monte Carlo for European option pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm, qmc

def sobol_call(S, K, r, sigma, T, n=4096, seed=0):
    """
    Quasi-Monte Carlo using Sobol low-discrepancy sequence.
    Convergence: O((log N)^d / N) vs O(1/sqrt(N)) for pseudo-random.
    scipy.stats.qmc.Sobol generates scrambled Sobol in [0,1)^d.
    Inverse-CDF transform maps uniform to standard normal.
    """
    sampler = qmc.Sobol(d=1, scramble=True, seed=seed)
    u       = sampler.random(n).flatten()       # uniform [0,1)
    z       = norm.ppf(np.clip(u, 1e-10, 1-1e-10))  # inverse normal

    # GBM terminal price
    ST      = S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*z)
    payoff  = np.maximum(ST - K, 0.0)
    return np.exp(-r * T) * payoff.mean()


def sobol_asian_call(S, K, r, sigma, T, n_steps=50, n_paths=4096, seed=0):
    """
    Quasi-MC path generation for Asian (arithmetic average) call.
    d = n_steps dimensional Sobol sequence, one dimension per time step.
    Use Brownian bridge construction to align fine-scale variation with
    the last Sobol dimensions (which have worst uniformity).
    """
    dt      = T / n_steps
    sampler = qmc.Sobol(d=n_steps, scramble=True, seed=seed)
    u       = sampler.random(n_paths)            # (n_paths, n_steps)
    z       = norm.ppf(np.clip(u, 1e-10, 1-1e-10))

    # GBM increments
    drift   = (r - 0.5*sigma**2) * dt
    diffusion = sigma * np.sqrt(dt)
    log_increments = drift + diffusion * z       # (n_paths, n_steps)
    log_paths = np.cumsum(log_increments, axis=1)
    prices    = S * np.exp(log_paths)            # (n_paths, n_steps)

    avg_price = prices.mean(axis=1)
    payoff    = np.maximum(avg_price - K, 0.0)
    return np.exp(-r * T) * payoff.mean()


# Comparison: Sobol vs pseudo-random at various N
for n in [256, 1024, 4096]:
    mc_vanilla  = sobol_call(100, 100, 0.05, 0.2, 1.0, n=n)
    rng = np.random.default_rng(0)
    z   = rng.standard_normal(n)
    ST  = 100 * np.exp((0.05-0.02)*1.0 + 0.2*z)
    psr = np.exp(-0.05) * np.maximum(ST-100,0).mean()
    print(f"N={n:5d}  Sobol={mc_vanilla:.4f}  PseudoRandom={psr:.4f}  BS=10.4506")

asian = sobol_asian_call(100, 100, 0.05, 0.2, 1.0)
print(f"Asian Sobol: {asian:.4f}")`,
    explanation:
      "scipy.qmc.Sobol with scrambling provides the standard QMC sampler for production finance code. Scrambling preserves the low-discrepancy property while ensuring unbiasedness. For high-dimensional path generation, Brownian bridge construction is essential — it places the coarsest time steps in the first (best) Sobol dimensions, dramatically reducing effective dimensionality.",
  },
  {
    id: "pyfin-20260526-b1-frac-diff",
    language: "python",
    title: "Fractional differentiation for stationarity-preserving ML features",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import adfuller

def frac_diff_weights(d: float, size: int, threshold: float = 1e-5) -> np.ndarray:
    """
    Weights for fractional differencing: w_k = prod_{i=0}^{k-1} (d - i) / (i + 1).
    For d=1: standard first difference. d=0: identity (no differentiation).
    Weights decay as a power law, retaining memory unlike integer differencing.
    """
    w = [1.0]
    for k in range(1, size):
        w.append(-w[-1] * (d - k + 1) / k)
        if abs(w[-1]) < threshold:
            break
    return np.array(w)


def frac_diff_fixed(series: pd.Series, d: float,
                    threshold: float = 1e-5) -> pd.Series:
    """
    Apply fractional differencing of order d.
    Preserves maximum memory while achieving stationarity.
    Uses fixed-width window; initial NaN values trimmed.
    """
    weights = frac_diff_weights(d, len(series), threshold)
    result  = np.full(len(series), np.nan)
    for i in range(len(weights) - 1, len(series)):
        result[i] = np.dot(weights, series.iloc[i - len(weights) + 1: i + 1].values[::-1])
    return pd.Series(result, index=series.index)


def min_frac_d(series: pd.Series, p_thresh: float = 0.05,
               d_grid: np.ndarray = np.arange(0.0, 1.01, 0.05)) -> float:
    """
    Find minimum d such that frac-diff series passes ADF test.
    Small d = more memory preserved; large d = more stationary.
    Lopez de Prado's key insight: don't over-difference.
    """
    for d in d_grid:
        fd = frac_diff_fixed(series, d).dropna()
        if len(fd) < 20:
            continue
        p  = adfuller(fd, maxlag=1)[1]
        if p <= p_thresh:
            return d
    return 1.0  # fallback to integer diff


# Demo: SPX log-price series (simulated)
rng    = np.random.default_rng(42)
prices = pd.Series(np.exp(np.cumsum(rng.normal(0, 0.01, 500))), name="price")

# Raw price: non-stationary (unit root)
p_raw = adfuller(prices, maxlag=1)[1]

# Frac-diff at d=0.4
fd    = frac_diff_fixed(prices, d=0.4).dropna()
p_fd  = adfuller(fd, maxlag=1)[1]

d_min = min_frac_d(prices)

print(f"ADF p-value raw: {p_raw:.3f}  frac-diff(0.4): {p_fd:.3f}")
print(f"Minimum d for stationarity: {d_min:.2f}")`,
    explanation:
      "Fractional differencing (López de Prado 2018) is the key preprocessing step for applying ML to financial time series: integer differencing (d=1) destroys autocorrelation and long-range dependence, removing most predictable information. By choosing the minimal d that passes a stationarity test, you retain as much memory as possible while satisfying the stationarity requirement of most ML estimators.",
  },
  {
    id: "pyfin-20260526-b1-var-granger",
    language: "python",
    title: "Vector Autoregression (VAR) and Granger causality",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.tsa.vector_ar.var_model import VAR
from statsmodels.tsa.stattools import grangercausalitytests

# VAR(p): each variable is regressed on p lags of itself AND all other variables.
# Y_t = c + A_1 * Y_{t-1} + ... + A_p * Y_{t-p} + eps_t
# Application: model macro factors (yield, credit spread, FX) jointly.
# Granger causality: does X Granger-cause Y? Is X useful for predicting Y?

np.random.seed(42)
T = 500

# Simulate a VAR(1) system: yield influences credit spread, not vice versa.
yields   = np.zeros(T)
spreads  = np.zeros(T)
yields[0]  = 0.05
spreads[0] = 0.02

for t in range(1, T):
    yields[t]  = 0.5 * yields[t-1]  + np.random.normal(0, 0.005)
    spreads[t] = 0.3 * spreads[t-1] + 0.4 * yields[t-1] + np.random.normal(0, 0.003)

data = pd.DataFrame({"yield": yields, "spread": spreads})

# Fit VAR(p) — select optimal lag via information criteria
model   = VAR(data)
results = model.fit(maxlags=5, ic="aic")
print(f"Optimal lag: {results.k_ar}")
print(results.summary())

# Forecast next 5 periods
fc = results.forecast(data.values[-results.k_ar:], steps=5)
print("Forecast (yield, spread):")
print(fc)

# Granger causality test
# H0: yield does NOT Granger-cause spread (if p < 0.05, reject -> it does)
gc_test = grangercausalitytests(data[["spread", "yield"]], maxlag=3, verbose=False)
for lag, res in gc_test.items():
    f_stat, p_val = res[0]["ssr_ftest"][:2]
    print(f"Lag {lag}: F={f_stat:.3f}  p={p_val:.4f}")

# Impulse Response Function (IRF): shock to yield -> effect on spread over time
irf = results.irf(periods=10)
irf.plot(orth=True)  # orthogonalised IRF via Cholesky decomposition`,
    explanation:
      "VAR captures contemporaneous interdependencies between macro variables: a yield spike's propagation into credit spreads over subsequent periods is captured by the VAR coefficients and visualised through the Impulse Response Function. Granger causality tests the incremental predictive power of one series for another — 'Granger-causes' means 'helps predict', not 'causes' in a structural sense.",
  },
  {
    id: "pyfin-20260526-b1-hawkes",
    language: "python",
    title: "Hawkes process simulation — self-exciting order arrival",
    tag: "finance",
    code: `import numpy as np
from typing import Tuple

def simulate_hawkes(mu: float, alpha: float, beta: float,
                    T: float, seed: int = 42) -> np.ndarray:
    """
    Hawkes (1971) self-exciting point process:
    lambda(t) = mu + alpha * sum_{t_i < t} exp(-beta * (t - t_i))
    mu    = baseline arrival rate
    alpha = jump in intensity at each event (excitation)
    beta  = decay rate (mean reversion of intensity)
    Stability: alpha / beta < 1 (otherwise intensity explodes).
    Thinning (Ogata 1981) algorithm for exact simulation.
    """
    rng = np.random.default_rng(seed)
    assert alpha < beta, "Process must be stable: alpha < beta"

    events = []
    t      = 0.0
    lam_t  = mu  # current intensity

    while t < T:
        # Upper bound on intensity in [t, t + delta]
        lam_upper = lam_t + mu  # lambda(t) is right-continuous and decreasing between jumps
        # Draw candidate inter-arrival from exponential with rate lam_upper
        dt = rng.exponential(1.0 / lam_upper)
        t += dt
        if t >= T:
            break
        # Update intensity at candidate time (exponential decay)
        lam_t_cand = mu + sum(alpha * np.exp(-beta * (t - ti)) for ti in events)
        # Accept/reject thinning
        if rng.random() <= lam_t_cand / lam_upper:
            events.append(t)
            lam_t = lam_t_cand + alpha   # intensity jumps up
        else:
            lam_t = lam_t_cand

    return np.array(events)


def hawkes_mle(events: np.ndarray, T: float) -> Tuple[float, float, float]:
    """
    Maximum likelihood estimation for Hawkes(mu, alpha, beta).
    Negative log-likelihood via scipy.optimize.minimize.
    """
    from scipy.optimize import minimize
    import warnings

    def neg_log_lik(params):
        mu, alpha, beta = params
        if mu <= 0 or alpha <= 0 or beta <= 0 or alpha >= beta:
            return 1e10
        # Recursive computation of intensity at each event
        lam_events = []
        R = 0.0  # sum of exp(-beta*(t_i - t_j)) for past events
        lam_events.append(mu)
        for i in range(1, len(events)):
            dt = events[i] - events[i-1]
            R  = np.exp(-beta * dt) * (1 + R)   # efficient recursion
            lam_events.append(mu + alpha * R)

        # Log-likelihood = sum log(lambda(t_i)) - integral_0^T lambda(t)dt
        ll = np.sum(np.log(lam_events))
        # Integral: mu*T + alpha/beta * sum(1 - exp(-beta*(T-t_i)))
        ll -= mu * T + alpha / beta * np.sum(1.0 - np.exp(-beta * (T - events)))
        return -ll

    res = minimize(neg_log_lik, x0=[0.5, 0.5, 1.0],
                   method="L-BFGS-B", bounds=[(1e-6, None)]*3,
                   options={"ftol": 1e-10})
    return tuple(res.x)


# Simulate and re-estimate
T  = 1000.0
ev = simulate_hawkes(mu=0.5, alpha=0.3, beta=1.0, T=T)
print(f"Events: {len(ev)},  avg intensity: {len(ev)/T:.3f}")

mu_hat, alpha_hat, beta_hat = hawkes_mle(ev, T)
print(f"True:  mu=0.5  alpha=0.3  beta=1.0")
print(f"MLE:   mu={mu_hat:.3f}  alpha={alpha_hat:.3f}  beta={beta_hat:.3f}")`,
    explanation:
      "The Hawkes process models order-book clustering: each trade arrival increases the rate of subsequent arrivals (market orders beget market orders). alpha/beta < 1 is the stability condition — at the limit, the process is 'critical' and exhibits power-law inter-arrival distributions. MLE via the recursive R-formula makes parameter estimation O(n) rather than O(n²).",
  },
  {
    id: "pyfin-20260526-b1-vix-replication",
    language: "python",
    title: "VIX replication from option chain (variance swap payoff)",
    tag: "finance",
    code: `import numpy as np

def vix_from_chain(strikes: np.ndarray, call_ivs: np.ndarray,
                   put_ivs: np.ndarray, F: float, T: float,
                   r: float) -> float:
    """
    CBOE VIX formula (2003 methodology):
    VIX^2 = (2/T) * sum_i delta_K_i / K_i^2 * exp(rT) * Mid_i
           - (1/T) * (F/K* - 1)^2
    where:
      Mid_i = option price (calls for K > F, puts for K < F)
      K*    = first strike <= F
      delta_K = midpoint of adjacent strikes
      Uses out-of-the-money options only (better model-free estimate).
    Uses Black-Scholes to convert IVs to option prices.
    """
    from scipy.stats import norm

    def bs_price(S, K, r, sig, T, kind="call"):
        if sig < 1e-8 or T < 1e-8:
            return max(S-K,0) if kind=="call" else max(K-S,0)
        d1 = (np.log(S/K) + (r + 0.5*sig**2)*T) / (sig*np.sqrt(T))
        d2 = d1 - sig*np.sqrt(T)
        if kind == "call":
            return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
        return K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)

    S = F * np.exp(-r * T)   # spot implied from forward

    # Delta K (trapezoidal spacing)
    delta_K          = np.zeros_like(strikes, dtype=float)
    delta_K[0]       = strikes[1]  - strikes[0]
    delta_K[-1]      = strikes[-1] - strikes[-2]
    delta_K[1:-1]    = (strikes[2:] - strikes[:-2]) / 2.0

    # For each strike: use put if K <= F, call if K >= F
    mid_prices = np.array([
        bs_price(S, K, r, iv, T, "put") if K <= F
        else bs_price(S, K, r, iv, T, "call")
        for K, iv in zip(strikes,
                         np.where(strikes <= F, put_ivs, call_ivs))
    ])

    # Main sum
    vix2 = (2.0 / T) * np.sum(delta_K / strikes**2 * np.exp(r*T) * mid_prices)

    # Correction for F vs K*
    K_star = strikes[strikes <= F][-1] if any(strikes <= F) else strikes[0]
    vix2  -= (1.0 / T) * (F / K_star - 1.0)**2

    return np.sqrt(vix2) * 100.0   # express as percentage


# Demo: flat smile at 20% IV across strikes
strikes  = np.linspace(80, 120, 41)
ivs      = np.full_like(strikes, 0.20)
F, T, r  = 100.0, 30/365, 0.05
vix_val  = vix_from_chain(strikes, ivs, ivs, F, T, r)
print(f"VIX (flat 20% smile): {vix_val:.2f}")   # should be close to 20`,
    explanation:
      "The CBOE VIX formula is model-free: it replicates the variance swap payoff using a continuum of OTM options, making it independent of any particular vol model. The trapezoidal sum approximates the integral over all strikes. In practice, the smile is far from flat — OTM puts trade at higher IV (skew), making VIX higher than ATM implied vol. VIX futures allow direct trading of future realised variance.",
  },
  {
    id: "pyfin-20260526-b1-lsm-american",
    language: "python",
    title: "Longstaff-Schwartz LSM for American option pricing",
    tag: "finance",
    code: `import numpy as np

def lsm_american_put(S, K, r, sigma, T, n_paths=50_000, n_steps=50, seed=42):
    """
    Longstaff-Schwartz (2001) Least-Squares Monte Carlo for American puts.
    At each timestep, regress continuation value on basis functions of S.
    Early exercise: if intrinsic > estimated continuation value, exercise.
    Basis: {1, S, S^2} (Laguerre polynomials also common).
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    disc = np.exp(-r * dt)

    # Simulate GBM paths (antithetic variates for variance reduction)
    z    = rng.standard_normal((n_steps, n_paths // 2))
    z    = np.concatenate([z, -z], axis=1)         # antithetic
    log_increments = (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*z
    S_paths = np.zeros((n_steps + 1, n_paths))
    S_paths[0] = S
    for t in range(n_steps):
        S_paths[t+1] = S_paths[t] * np.exp(log_increments[t])

    # Intrinsic value at each node (put payoff)
    intrinsic = np.maximum(K - S_paths, 0.0)

    # Backward induction: start at expiry
    cash_flow = intrinsic[-1].copy()

    for t in range(n_steps - 1, 0, -1):
        # Discount cash flow from next period
        cont_value = cash_flow * disc

        # Only regress on in-the-money paths (where early exercise is relevant)
        itm = intrinsic[t] > 0
        if itm.sum() < 10:
            cash_flow = cont_value
            continue

        S_itm = S_paths[t, itm]
        cv_itm = cont_value[itm]

        # Regression: continuation value ~ a0 + a1*S + a2*S^2
        X  = np.column_stack([np.ones(itm.sum()), S_itm, S_itm**2])
        beta, *_ = np.linalg.lstsq(X, cv_itm, rcond=None)
        est_cv   = X @ beta

        # Exercise decision: exercise if intrinsic > estimated continuation
        ex = intrinsic[t, itm] > est_cv
        cash_flow[itm] = np.where(ex, intrinsic[t, itm], cont_value[itm])
        cash_flow[~itm] = cont_value[~itm]

    return (cash_flow * disc).mean()


# Comparison with CRR binomial
result = lsm_american_put(100, 100, 0.05, 0.2, 1.0, n_paths=100_000, n_steps=100)
print(f"LSM American put: {result:.4f}")   # should be ~6.09 (vs European ~5.57)`,
    explanation:
      "LSM converts the American exercise problem into a sequence of OLS regressions: at each time step, regress the discounted future cash flows on polynomial basis functions of the stock price to estimate the continuation value. The algorithm only regresses on in-the-money paths — out-of-the-money American puts are never optimally exercised, so including them adds noise. Antithetic variates approximately halve the standard error.",
  },
  {
    id: "pyfin-20260526-b1-amihud",
    language: "python",
    title: "Amihud illiquidity ratio and market impact estimation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def amihud_illiquidity(returns: pd.Series, volume_usd: pd.Series,
                        roll_days: int = 63) -> pd.Series:
    """
    Amihud (2002) ILLIQ = (1/D) * sum_d |r_d| / Volume_d
    Measures price impact per dollar traded.
    High ILLIQ -> even small trades move the price significantly.
    Used as: (1) a liquidity factor in cross-sectional alphas;
              (2) a transaction cost proxy for strategy capacity estimation.
    """
    illiq = (returns.abs() / volume_usd).replace([np.inf, -np.inf], np.nan)
    # Rolling monthly average (annualised in units of $/million -> scale x 10^6)
    return illiq.rolling(roll_days, min_periods=5).mean() * 1e6


def kyle_lambda(price_changes: np.ndarray, order_imbalance: np.ndarray) -> float:
    """
    Kyle's lambda (1985): dP = lambda * OI + epsilon
    OI = order imbalance (signed dollar volume).
    Lambda = price impact per unit of order flow.
    Estimate via OLS on intraday data (e.g., 5-minute buckets).
    """
    X  = order_imbalance.reshape(-1, 1)
    XX = np.hstack([np.ones((len(X), 1)), X])
    beta, *_ = np.linalg.lstsq(XX, price_changes, rcond=None)
    return beta[1]   # slope = Kyle's lambda


def capacity_estimate(strategy_pnl_bps: float, amihud: float,
                       avg_adv_usd: float, target_impact_bps: float = 5.0) -> float:
    """
    Strategy capacity: maximum AUM before market impact exceeds target.
    Market impact (bps) ~ lambda * trade_size_as_pct_of_ADV * 10000
    Approximation: capacity = target_impact / (ILLIQ * turnover_rate)
    """
    turnover_per_day = 0.02   # assume 2% daily turnover of AUM
    # ILLIQ in %/million; target in bps = %/100
    max_trade_usd = (target_impact_bps / 10000.0) / (amihud / 1e6 / 100.0)
    return max_trade_usd / turnover_per_day


# Demo
rng     = np.random.default_rng(42)
T       = 252
prices  = pd.Series(100 * np.exp(np.cumsum(rng.normal(0, 0.015, T))))
returns = prices.pct_change().dropna()
vol_usd = pd.Series(rng.uniform(5e6, 50e6, T-1))   # $5M-$50M daily volume

illiq = amihud_illiquidity(returns, vol_usd)
print(f"Amihud ILLIQ (last):   {illiq.iloc[-1]:.4f} (x1e-6 $/% move per $M traded)")

cap = capacity_estimate(5.0, illiq.iloc[-1], vol_usd.mean())
print(f"Approx capacity: \${cap/1e6:.0f}M")`,
    explanation:
      "The Amihud ratio is the most widely used low-frequency liquidity measure: it approximates Kyle's lambda using daily data. A ratio 10× higher for a small-cap stock vs large-cap means 10× worse price impact for the same order size as a fraction of ADV. Strategy capacity planning must account for this — a Sharpe 2 strategy turns negative after costs at scale if Amihud is too high.",
  },
  {
    id: "pyfin-20260526-b1-corwin-schultz",
    language: "python",
    title: "Corwin-Schultz bid-ask spread estimator from OHLC data",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def corwin_schultz_spread(high: pd.Series, low: pd.Series) -> pd.Series:
    """
    Corwin & Schultz (2012): estimate effective bid-ask spread from daily OHLC.
    Key insight: high-low range over two days contains both vol and spread info.
    beta = [(h1-l1)^2 + (h2-l2)^2] / sigma^2 + 2*s*sqrt(2/pi)/sigma
    alpha = spread / sigma  => s = 2*(exp(alpha)-1)/(1+exp(alpha))

    Two-day high: H_2 = max(h_t, h_{t+1}); Two-day low: L_2 = min(l_t, l_{t+1})
    """
    h = np.log(high)
    l = np.log(low)

    # Single-day squared range
    beta_1  = (h - l)**2
    beta_2  = (h.shift(-1) - l.shift(-1))**2
    beta    = beta_1 + beta_2                       # two-day sum

    # Two-day range
    h2 = np.log(pd.concat([high, high.shift(-1)], axis=1).max(axis=1))
    l2 = np.log(pd.concat([low,  low.shift(-1)],  axis=1).min(axis=1))
    gamma   = (h2 - l2)**2

    # Corwin-Schultz formula
    k2      = (8.0 / np.pi)**0.5                    # = sqrt(8/pi)
    alpha   = (np.sqrt(2*beta) - np.sqrt(beta)) / (3.0 - 2.0*np.sqrt(2.0)) \
              - np.sqrt(gamma / (3.0 - 2.0*np.sqrt(2.0)))

    # Spread in decimals (convert to bps: * 10000)
    spread  = 2.0 * (np.exp(alpha) - 1.0) / (1.0 + np.exp(alpha))
    spread  = spread.clip(lower=0.0)   # negative spreads are noise; floor at 0

    return spread * 10000.0   # basis points


# Demo
rng    = np.random.default_rng(42)
T      = 252
closes = 100.0 * np.exp(np.cumsum(rng.normal(0, 0.01, T)))
high   = pd.Series(closes * (1 + np.abs(rng.normal(0, 0.005, T))))
low    = pd.Series(closes * (1 - np.abs(rng.normal(0, 0.005, T))))

spreads = corwin_schultz_spread(high, low)
print(f"Mean estimated spread: {spreads.dropna().mean():.2f} bps")
print(f"Min / Max:             {spreads.dropna().min():.2f} / {spreads.dropna().max():.2f} bps")`,
    explanation:
      "Corwin-Schultz is a key tool when tick-level bid-ask data is unavailable: it extracts spread information from daily OHLC bars by noting that the high-low range over two days is systematically wider than what GBM alone predicts, with the excess attributable to the bid-ask bounce. The estimator is noisier than TAQ-based estimates but requires only publicly available data, making it useful for historical analysis across decades.",
  },
  {
    id: "pyfin-20260526-b1-cliquet",
    language: "python",
    title: "Cliquet (ratchet) option Monte Carlo",
    tag: "finance",
    code: `import numpy as np

def cliquet_price(S0: float, r: float, sigma: float, T: float,
                   reset_dates: list[float],
                   local_cap: float = 0.10,
                   local_floor: float = -0.05,
                   seed: int = 42) -> float:
    """
    Cliquet (ratchet) option: sum of locally capped/floored periodic returns.
    Payoff = sum_i clip(S_{t_i}/S_{t_{i-1}} - 1, local_floor, local_cap).
    Common in structured products: provides participation in up-markets
    with guaranteed minimum (floor) and maximum (cap) per period.
    No global cap/floor in this version (add trivially if needed).
    """
    rng  = np.random.default_rng(seed)
    n    = 100_000

    # Build time grid
    dates = [0.0] + sorted(reset_dates) + [T]
    n_periods = len(dates) - 1

    # Simulate GBM increments for each period
    cum_payoff = np.zeros(n)
    S_prev     = np.full(n, S0)

    for i in range(n_periods):
        dt = dates[i+1] - dates[i]
        z  = rng.standard_normal(n)
        S_next = S_prev * np.exp((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*z)
        ret_i  = S_next / S_prev - 1.0
        # Locally cap and floor each period's return
        cum_payoff += np.clip(ret_i, local_floor, local_cap)
        S_prev = S_next

    disc = np.exp(-r * T)
    return disc * cum_payoff.mean()


# Annual resets over 3 years; cap 10% per year, floor -5%
dates  = [1.0, 2.0]
price  = cliquet_price(100, 0.05, 0.20, 3.0, dates, local_cap=0.10, local_floor=-0.05)
print(f"Cliquet price: {price:.4f}")

# Sensitivity to volatility (higher vol -> more chance of hitting cap)
for sig in [0.10, 0.20, 0.30]:
    p = cliquet_price(100, 0.05, sig, 3.0, dates)
    print(f"  sigma={sig:.0%}  price={p:.4f}")`,
    explanation:
      "Cliquet options have complex vol-of-vol sensitivity: because each period's return is capped, the local cap creates a short-gamma position. The skew and forward vol surface matter more than spot ATM vol — this is why cliquets are often used by vol traders to express views on the forward skew. Higher vol increases the probability of hitting both the cap (positive for the holder) and the floor, making the net vega non-trivial.",
  },
  {
    id: "pyfin-20260526-b1-butterfly-fi",
    language: "python",
    title: "Duration-neutral butterfly fixed-income trade construction",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import fsolve

def compute_dv01(ytm: float, coupon: float, maturity: float,
                  freq: int = 2, face: float = 100.0) -> dict:
    """
    Full-price DV01 for a fixed-rate bond (semi-annual coupons default).
    DV01 = -dP/dy * 0.0001 = Modified Duration * Price / 10000.
    """
    c  = coupon / freq / 100.0       # coupon per period as fraction
    y  = ytm / freq                   # yield per period
    n  = int(maturity * freq)         # total periods
    t  = np.arange(1, n+1) / freq     # time to each cash flow in years
    cf = np.full(n, face * c)
    cf[-1] += face                    # add principal at maturity

    disc  = 1.0 / (1.0 + y) ** np.arange(1, n+1)
    price = np.sum(cf * disc)
    mac_dur = np.sum(cf * disc * t) / price
    mod_dur = mac_dur / (1.0 + y)     # semi-annual compounding adjustment
    dv01    = mod_dur * price / 10000.0

    return {"price": price, "dv01": dv01, "mod_dur": mod_dur, "mac_dur": mac_dur}


def butterfly_weights(ytm_2y: float, ytm_5y: float, ytm_10y: float,
                       coupon: float = 5.0, face: float = 1e6) -> dict:
    """
    Barbell vs bullet: long wings (2Y + 10Y), short belly (5Y).
    Duration-neutral: net DV01 = 0.
    Dollar-neutral (optional): net notional = 0.
    Solve for notional of 10Y such that: DV01_2y*N_2y - DV01_5y*N_5y + DV01_10y*N_10y = 0.
    Fix N_2y = N_10y = 1 (long the barbell) and solve for N_5y.
    """
    r_2  = compute_dv01(ytm_2y,  coupon, 2.0,  face=face)
    r_5  = compute_dv01(ytm_5y,  coupon, 5.0,  face=face)
    r_10 = compute_dv01(ytm_10y, coupon, 10.0, face=face)

    # Long 1 unit of 2Y and 1 unit of 10Y; short N_5y of 5Y.
    # Duration-neutral: DV01_2y + DV01_10y = N_5y * DV01_5y
    N_5y = (r_2["dv01"] + r_10["dv01"]) / r_5["dv01"]

    pnl_per_bp_flattening = (
        r_2["dv01"] * 0.5    # wings: 2Y gains 0.5bp if 2-5 flattens 1bp
      + r_10["dv01"] * 0.5   # 10Y gains 0.5bp if 5-10 flattens 1bp
      - r_5["dv01"] * N_5y   # belly hedges
    )

    return {
        "N_2y": 1.0, "N_5y": -N_5y, "N_10y": 1.0,
        "DV01_net": r_2["dv01"] + r_10["dv01"] - N_5y * r_5["dv01"],
        "P&L per bp flattening (approx)": pnl_per_bp_flattening
    }

res = butterfly_weights(0.048, 0.050, 0.053)
for k, v in res.items():
    print(f"  {k}: {v:.4f}")`,
    explanation:
      "A duration-neutral butterfly exploits curvature in the yield curve: the barbell (long 2Y + 10Y) outperforms the bullet (long 5Y) when the yield curve becomes more curved (belly cheapens relative to wings), regardless of whether rates rise or fall in parallel. Setting DV01 net to zero removes the first-order rate-level bet, leaving only the curvature trade.",
  },
  {
    id: "pyfin-20260526-b1-omega-ratio",
    language: "python",
    title: "Omega ratio, upside potential, and Bernardo-Ledoit ratio",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.integrate import quad

def omega_ratio(returns: np.ndarray, threshold: float = 0.0) -> float:
    """
    Omega = E[max(r - L, 0)] / E[max(L - r, 0)]
          = (area above threshold) / (area below threshold)
    threshold L is the minimum acceptable return (often 0 or risk-free rate).
    Omega = 1 + (mean - L) / E[max(L - r, 0)]
    Unlike Sharpe, captures all higher moments including skewness and kurtosis.
    """
    excess = returns - threshold
    upside  = excess[excess > 0].sum()
    downside = np.abs(excess[excess < 0].sum())
    return upside / downside if downside > 0 else np.inf


def upside_potential_ratio(returns: np.ndarray, threshold: float = 0.0) -> float:
    """
    Sortino numerator: upside semi-deviation normalised Omega variant.
    UPR = E[max(r - L, 0)] / sqrt(E[max(L - r, 0)^2])
    Penalises only downside risk in the denominator (unlike Omega's first moment).
    """
    excess   = returns - threshold
    upside   = excess[excess > 0].mean() if (excess > 0).any() else 0.0
    downside = np.sqrt((excess[excess < 0]**2).mean()) if (excess < 0).any() else 1e-12
    return upside / downside


def bernardo_ledoit(returns: np.ndarray) -> float:
    """
    Bernardo & Ledoit (2000) gain-loss ratio:
    GL = E[max(r, 0)] / E[max(-r, 0)]
    = upside mean / downside mean (threshold = 0)
    SSD dominance: if GL > 1 everywhere on the return distribution,
    strategy dominates the benchmark for all risk-averse investors.
    """
    pos_mean = returns[returns > 0].mean() if (returns > 0).any() else 0.0
    neg_mean = (-returns[returns < 0]).mean() if (returns < 0).any() else 1e-12
    return pos_mean / neg_mean


# Demonstrate: lognormal returns (positive skew) vs normal
rng    = np.random.default_rng(42)
T      = 252 * 5

# Strategy 1: symmetric (Gaussian)
ret_normal = rng.normal(0.0004, 0.01, T)

# Strategy 2: positive skew (occasional large gains)
ret_skew   = rng.normal(0.0003, 0.008, T)
ret_skew[rng.random(T) < 0.05] += 0.05   # add 5% random spike days

def summarise(name, ret):
    rf = 0.0001
    excess = ret - rf
    sharpe = np.sqrt(252) * excess.mean() / excess.std(ddof=1)
    omega  = omega_ratio(ret, threshold=rf)
    upr    = upside_potential_ratio(ret, threshold=rf)
    gl     = bernardo_ledoit(ret)
    print(f"{name:20s}  Sharpe={sharpe:.2f}  Omega={omega:.2f}  UPR={upr:.2f}  GL={gl:.2f}")

summarise("Normal strategy", ret_normal)
summarise("Positive-skew",   ret_skew)`,
    explanation:
      "Omega and gain-loss ratios capture the full return distribution, not just the first two moments. A strategy with positive skew (rare large up-moves) looks good in Omega/GL but can have similar Sharpe to a symmetric strategy — the difference shows up in the higher moments. The Bernardo-Ledoit GL ratio has a formal theoretical basis: GL > 1 implies second-order stochastic dominance over holding cash.",
  },
  {
    id: "pyfin-20260526-b1-johansen",
    language: "python",
    title: "Johansen cointegration test for multivariate pairs",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.vector_ar.vecm import coint_johansen

def find_cointegrated_pairs(data: pd.DataFrame,
                              significance: float = 0.05) -> dict:
    """
    Johansen (1991) cointegration test: tests for multiple cointegrating vectors
    simultaneously. Bivariate Engle-Granger can miss cointegration or find spurious
    vectors; Johansen tests the rank of the cointegrating space directly.
    Returns the number of cointegrating relationships (rank r).
    Also returns the hedge ratios (eigenvectors of the cointegration matrix).
    """
    result = coint_johansen(data.values, det_order=0, k_ar_diff=1)

    # Critical values at 5% for trace test (columns: 90%, 95%, 99%)
    n_cointegrated = 0
    for i in range(result.lr1.shape[0]):
        if result.lr1[i] > result.cvt[i, 1]:  # trace stat > 95% critical value
            n_cointegrated += 1

    # Cointegrating vectors (columns of result.evec)
    hedge_ratios = result.evec[:, :n_cointegrated]
    return {
        "rank": n_cointegrated,
        "trace_stats": result.lr1,
        "crit_values_95": result.cvt[:, 1],
        "hedge_ratios": hedge_ratios,
    }


def portfolio_spread(data: pd.DataFrame, hedge_vec: np.ndarray) -> pd.Series:
    """
    Construct the cointegrating spread (stationary linear combination).
    hedge_vec is the first cointegrating vector (normalised to data.columns[0] = 1).
    """
    # Normalise so first coefficient = 1
    hv = hedge_vec / hedge_vec[0]
    spread = data.values @ hv
    return pd.Series(spread, index=data.index)


# Simulate 3 cointegrated series (common trend)
rng = np.random.default_rng(42)
T   = 500
common_trend = np.cumsum(rng.normal(0, 1, T))
x1 = common_trend + rng.normal(0, 0.5, T)
x2 = 0.8 * common_trend + rng.normal(0, 0.5, T)
x3 = 1.2 * common_trend + rng.normal(0, 0.5, T)

data = pd.DataFrame({"x1": x1, "x2": x2, "x3": x3})

res = find_cointegrated_pairs(data)
print(f"Cointegrating rank: {res['rank']}")  # should be 2 (3 series, 1 common trend)
print(f"Trace stats: {np.round(res['trace_stats'], 2)}")
print(f"Critical values (95%): {np.round(res['crit_values_95'], 2)}")

spread = portfolio_spread(data, res["hedge_ratios"][:, 0])
from statsmodels.tsa.stattools import adfuller
p = adfuller(spread)[1]
print(f"Spread ADF p-value: {p:.4f}")   # should be << 0.05`,
    explanation:
      "Johansen's approach tests cointegration rank directly in a VECM (Vector Error Correction Model), avoiding the asymptotic bias of running multiple pairwise Engle-Granger tests. With 3 or more securities (common in sector ETF / constituent pairs), Johansen correctly identifies the number of independent stationary combinations — critical for constructing market-neutral spread portfolios.",
  },
  {
    id: "pyfin-20260526-b1-lee-ready",
    language: "python",
    title: "Lee-Ready tick test — trade direction classification",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from enum import IntEnum

class Side(IntEnum):
    BUY  =  1
    SELL = -1
    UNKNOWN = 0

def lee_ready(prices: pd.Series, quotes: pd.DataFrame,
               lag: int = 1) -> pd.Series:
    """
    Lee & Ready (1991) trade classification:
    1. Quote rule (primary): trade > ask = BUY; trade < bid = SELL.
    2. Tick test (secondary): if trade is at mid or between bid/ask,
       use the direction of the last price change (up-tick = BUY).
    3. Reverse tick test: if price unchanged, compare to prior tick direction.
    'lag' shifts quotes by 1 to use quotes prevailing BEFORE the trade
    (avoid look-ahead from instantaneous matching).
    quotes must have columns: 'bid', 'ask'.
    """
    bid = quotes["bid"].shift(lag)
    ask = quotes["ask"].shift(lag)
    mid = 0.5 * (bid + ask)

    sides = pd.Series(Side.UNKNOWN, index=prices.index, dtype=int)

    # Quote rule
    above_ask = prices > ask
    below_bid = prices < bid
    sides[above_ask] = int(Side.BUY)
    sides[below_bid] = int(Side.SELL)

    # Tick test for trades at mid or in spread
    at_mid = ~above_ask & ~below_bid
    tick   = prices.diff()

    def tick_rule(p_series: pd.Series) -> pd.Series:
        # Follow the last non-zero price change
        result = pd.Series(Side.UNKNOWN, index=p_series.index, dtype=int)
        last_dir = Side.UNKNOWN
        for i, (idx, t) in enumerate(tick.items()):
            if at_mid.iloc[i] if hasattr(at_mid, "iloc") else at_mid[idx]:
                if t > 0:
                    last_dir = int(Side.BUY)
                elif t < 0:
                    last_dir = int(Side.SELL)
                result[idx] = last_dir
        return result

    tick_sides = tick_rule(prices)
    sides[at_mid] = tick_sides[at_mid]
    return sides


def bulk_volume_classification(close: pd.Series, volume: pd.Series,
                                sigma: float = None) -> pd.Series:
    """
    Ane & Geman / Easley et al. BVC: fraction of volume classified as buy.
    Buy fraction = Z((P_t - P_{t-1}) / sigma), Z = normal CDF.
    sigma estimated from price changes if not provided.
    """
    from scipy.stats import norm
    dp = close.diff().dropna()
    if sigma is None:
        sigma = dp.std()
    buy_frac = norm.cdf(dp / sigma)
    buy_vol  = buy_frac * volume
    sell_vol = (1 - buy_frac) * volume
    return pd.DataFrame({"buy_vol": buy_vol, "sell_vol": sell_vol,
                          "order_imbalance": buy_vol - sell_vol})


# Demo
rng     = np.random.default_rng(42)
T       = 200
prices  = pd.Series(100.0 + np.cumsum(rng.normal(0, 0.1, T)))
quotes  = pd.DataFrame({"bid": prices - 0.05, "ask": prices + 0.05})
# Some trades above ask (BUY), below bid (SELL), at mid (tick rule)
trade_prices = pd.Series(np.where(rng.random(T) > 0.6, prices + 0.06,
                  np.where(rng.random(T) < 0.3, prices - 0.06, prices)))
sides = lee_ready(trade_prices, quotes)
print(f"Buy: {(sides == 1).sum()}  Sell: {(sides == -1).sum()}")`,
    explanation:
      "Lee-Ready is the standard microstructure benchmark for inferring trade direction without a direct bid/ask indicator. The quote rule has 85-90% accuracy for liquid stocks; the tick test handles trades inside the spread. Modern alternatives (Bulk Volume Classification, CLNV) improve accuracy for high-frequency data but Lee-Ready remains the baseline for daily-frequency studies.",
  },
  {
    id: "pyfin-20260526-b1-kupiec-test",
    language: "python",
    title: "VaR back-test: Kupiec POF test and Christoffersen independence test",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import chi2

def kupiec_pof_test(violations: np.ndarray, confidence: float = 0.99) -> dict:
    """
    Kupiec (1995) Proportion of Failures (POF) test.
    H0: observed violation rate p_hat = alpha (= 1 - confidence).
    LR = -2 * log[ (1-alpha)^{T-V} * alpha^V / (1-p_hat)^{T-V} * p_hat^V ]
    Under H0: LR ~ chi2(1).  Reject if p-value < 0.05.
    """
    T = len(violations)
    V = int(violations.sum())      # number of VaR breaches
    if V == 0 or V == T:
        return {"LR": np.nan, "p_value": np.nan, "reject_H0": False}

    alpha    = 1.0 - confidence
    p_hat    = V / T

    LR_uc = -2.0 * (
        V * np.log(alpha / p_hat) + (T - V) * np.log((1-alpha) / (1-p_hat))
    )
    p_val = 1.0 - chi2.cdf(LR_uc, df=1)
    return {"LR": LR_uc, "p_value": p_val, "reject_H0": p_val < 0.05,
            "expected_violations": T * alpha, "actual_violations": V}


def christoffersen_test(violations: np.ndarray) -> dict:
    """
    Christoffersen (1998) independence test: tests that consecutive VaR breaches
    are not clustered (not autocorrelated). Complements Kupiec (which only tests
    unconditional frequency). Clustered violations = VaR model misses vol regimes.
    LR_ind ~ chi2(1); combine with POF: LR_cc = LR_uc + LR_ind ~ chi2(2).
    """
    v = violations.astype(int)
    # Transition counts: n_ij = number of (v_{t-1}=i, v_t=j) pairs
    n00 = np.sum((v[:-1] == 0) & (v[1:] == 0))
    n01 = np.sum((v[:-1] == 0) & (v[1:] == 1))
    n10 = np.sum((v[:-1] == 1) & (v[1:] == 0))
    n11 = np.sum((v[:-1] == 1) & (v[1:] == 1))

    pi01 = n01 / (n00 + n01) if (n00 + n01) > 0 else 0.5
    pi11 = n11 / (n10 + n11) if (n10 + n11) > 0 else 0.5
    pi   = (n01 + n11) / len(v[1:])

    if pi in (0, 1) or pi01 in (0, 1) or pi11 in (0, 1):
        return {"LR_ind": np.nan, "p_value": np.nan, "clustered": False}

    LR_ind = -2.0 * (
        n00 * np.log(1-pi) + n01 * np.log(pi)
      - n00 * np.log(1-pi01) - n01 * np.log(pi01)
      - n10 * np.log(1-pi11) - n11 * np.log(pi11)
    )
    p_val = 1.0 - chi2.cdf(LR_ind, df=1)
    return {"LR_ind": LR_ind, "p_value": p_val, "clustered": p_val < 0.05,
            "pi01": pi01, "pi11": pi11}


# Demo: simulate VaR model with correct frequency but clustered violations
rng = np.random.default_rng(42)
T   = 1000
var_99 = np.percentile(rng.standard_normal(10000), 1) * 0.01  # 99% VaR
returns = rng.standard_normal(T) * 0.01
violations = (returns < var_99).astype(float)

pof = kupiec_pof_test(violations, 0.99)
ind = christoffersen_test(violations)
print(f"Kupiec POF: LR={pof['LR']:.3f}  p={pof['p_value']:.3f}  "
      f"Expected: {pof['expected_violations']:.1f}  Actual: {pof['actual_violations']}")
print(f"Christoffersen: LR={ind['LR_ind']:.3f}  p={ind['p_value']:.3f}  "
      f"clustered={ind['clustered']}")`,
    explanation:
      "Kupiec tests whether the VaR is correctly calibrated on average; Christoffersen tests whether violations cluster in time. A model can pass Kupiec (right frequency) but fail Christoffersen (violations come in bursts during volatility regimes) — this is exactly what happens with GARCH-VaR vs Historical Simulation during crisis periods. Basel III requires back-testing over 250 trading days; > 4 violations in 1-year at 99% confidence triggers a capital add-on.",
  },
  {
    id: "pyfin-20260526-b1-min-var-hedge",
    language: "python",
    title: "Dynamic minimum-variance hedge ratio with rolling OLS",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def rolling_min_var_hedge(spot: pd.Series, futures: pd.Series,
                           window: int = 60,
                           method: str = "ols") -> pd.DataFrame:
    """
    Minimum-variance hedge ratio h* = Cov(dS, dF) / Var(dF).
    Dynamic version: re-estimate each day on a rolling window.
    method = "ols": regress dS on dF; h* = slope.
    method = "ewma": use exponential weighted cov/var (alpha = 2/(window+1)).
    Hedge effectiveness = 1 - Var(hedged) / Var(unhedged).
    """
    dS = spot.diff().dropna()
    dF = futures.diff().dropna()
    dS, dF = dS.align(dF, join="inner")

    if method == "ols":
        cov  = dS.rolling(window).cov(dF)
        var  = dF.rolling(window).var()
        h    = (cov / var).rename("hedge_ratio")
    else:  # EWMA
        alpha = 2.0 / (window + 1)
        cov_ew = dS.ewm(alpha=alpha, adjust=False).cov(dF)
        var_ew = dF.ewm(alpha=alpha, adjust=False).var()
        h      = (cov_ew / var_ew).rename("hedge_ratio")

    # Hedged P&L and hedge effectiveness
    hedged_pnl  = dS - h * dF
    effectiveness = 1.0 - hedged_pnl.rolling(window).var() / dS.rolling(window).var()

    return pd.DataFrame({
        "hedge_ratio": h,
        "hedged_pnl": hedged_pnl,
        "effectiveness": effectiveness,
    })


# Demo: crude oil spot vs WTI futures (correlated GBM)
rng     = np.random.default_rng(42)
T       = 500
eps1    = rng.standard_normal(T)
eps2    = 0.9 * eps1 + np.sqrt(1-0.81) * rng.standard_normal(T)

spot    = pd.Series(100 * np.exp(np.cumsum(eps1 * 0.015)))
futures = pd.Series(100 * np.exp(np.cumsum(eps2 * 0.015)))

res = rolling_min_var_hedge(spot, futures, window=60)
print(f"Mean hedge ratio:    {res['hedge_ratio'].mean():.3f}")  # should be near 0.9
print(f"Mean effectiveness:  {res['effectiveness'].mean():.3f}")

# Compare OLS vs EWMA
res_ew = rolling_min_var_hedge(spot, futures, window=60, method="ewma")
print(f"EWMA hedge mean:     {res_ew['hedge_ratio'].mean():.3f}")`,
    explanation:
      "The minimum-variance hedge ratio is the theoretically optimal cross-hedge: it minimises residual variance, not just covariance. Rolling OLS adapts to non-constant correlation (e.g., basis risk that grows as futures approach expiry), while EWMA places more weight on recent observations and reacts faster to regime changes. Hedge effectiveness measures how much variance the hedge removes — a good cross-hedge achieves > 80% effectiveness.",
  },
  {
    id: "pyfin-20260526-b1-cppi",
    language: "python",
    title: "CPPI (Constant Proportion Portfolio Insurance) simulation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def cppi_backtest(returns: pd.Series,
                   floor_pct: float = 0.8,
                   multiplier: float = 5.0,
                   rf: float = 0.0,
                   rebalance_freq: int = 1) -> pd.DataFrame:
    """
    CPPI strategy: maintain exposure to risky asset proportional to 'cushion'.
    Cushion = Portfolio Value - Floor Value.
    Risky exposure = multiplier * Cushion (floored at 0, capped at portfolio).
    Floor compounds at risk-free rate rf to provide capital protection guarantee.

    m=5 means leverage up to 5x cushion — more aggressive recovery but also
    faster gap risk (if market gaps down, floor is breached).
    """
    pv    = 1.0
    floor = floor_pct
    hist  = []

    for i, r in enumerate(returns):
        # Rebalance floor
        floor *= (1.0 + rf / 252.0)        # floor grows at risk-free rate

        if i % rebalance_freq == 0:
            cushion = max(pv - floor, 0.0)
            risky   = min(multiplier * cushion, pv)  # cap at 100% of portfolio
            safe    = pv - risky
            alloc_risky = risky / pv if pv > 0 else 0.0
        else:
            # No rebalance: let weights drift
            risky   = alloc_risky * pv
            safe    = (1.0 - alloc_risky) * pv

        # Apply returns
        pv     = risky * (1.0 + r) + safe * (1.0 + rf / 252.0)
        cushion = max(pv - floor, 0.0)
        hist.append({"pv": pv, "floor": floor, "cushion": cushion,
                      "risky_alloc": alloc_risky})

    return pd.DataFrame(hist, index=returns.index)


# Compare CPPI vs buy-and-hold in a bear-then-bull market
rng   = np.random.default_rng(42)
T     = 500
ret1  = pd.Series(np.concatenate([                   # bear then bull
    rng.normal(-0.002, 0.015, T//2),
    rng.normal( 0.002, 0.012, T//2)
]))

res_cppi = cppi_backtest(ret1, floor_pct=0.8, multiplier=5.0)
bh_eq    = (1.0 + ret1).cumprod()

print(f"CPPI final value:  {res_cppi['pv'].iloc[-1]:.4f}")
print(f"B&H final value:   {bh_eq.iloc[-1]:.4f}")
print(f"Floor breached:    {(res_cppi['pv'] < res_cppi['floor']).any()}")
print(f"CPPI min value:    {res_cppi['pv'].min():.4f}  (floor={res_cppi['floor'].min():.4f})")`,
    explanation:
      "CPPI is a widely-used structured product mechanism: it provides a capital guarantee (no CPPI value falls below the floor) while maintaining risky asset exposure. The multiplier controls aggression: m=5 with a 20% cushion allocates 100% to equities — any drop in equity wipes out the cushion and forces the strategy to fully de-risk. This 'cash-lock' feature means CPPI misses the recovery, which is why structured product providers often layer a CPPI on top of options rather than pure futures.",
  },
  {
    id: "pyfin-20260526-b1-alpha-decay",
    language: "python",
    title: "Alpha signal half-life and decay estimation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.optimize import curve_fit

def alpha_decay(signal: pd.Series, forward_returns: pd.DataFrame,
                max_lag: int = 20) -> pd.DataFrame:
    """
    Alpha decay: IC (Information Coefficient = rank correlation) vs forward lag.
    IC(k) = rank_corr(signal_t, return_{t+k}).
    Half-life = lag at which IC halves from IC(1).
    Signals with short half-life require fast, expensive execution;
    long half-life can tolerate gradual TWAP/VWAP execution.
    """
    from scipy.stats import spearmanr

    lags = range(1, max_lag + 1)
    ics  = []
    for lag in lags:
        ret = forward_returns[lag] if lag in forward_returns.columns \
              else forward_returns.iloc[:, lag-1]
        common = signal.dropna().index.intersection(ret.dropna().index)
        if len(common) < 30:
            ics.append(np.nan)
            continue
        ic, _ = spearmanr(signal[common], ret[common])
        ics.append(ic)

    ic_series = pd.Series(ics, index=lags, name="IC")

    # Fit exponential decay: IC(t) = IC(0) * exp(-lambda * t)
    valid = ic_series.dropna()
    if len(valid) < 3:
        return pd.DataFrame({"IC": ic_series})

    def exp_decay(t, ic0, lam):
        return ic0 * np.exp(-lam * t)

    try:
        popt, pcov = curve_fit(exp_decay, valid.index.values.astype(float),
                                valid.values, p0=[0.05, 0.1], maxfev=1000)
        ic0_hat, lam_hat = popt
        half_life = np.log(2) / lam_hat if lam_hat > 0 else np.inf
        ic_fit = exp_decay(np.array(list(lags), dtype=float), ic0_hat, lam_hat)
        return pd.DataFrame({
            "IC": ic_series,
            "IC_fit": pd.Series(ic_fit, index=lags),
            "half_life_days": half_life,
            "IC_day1": ic0_hat,
        })
    except Exception:
        return pd.DataFrame({"IC": ic_series})


# Demo
rng    = np.random.default_rng(42)
T, N   = 500, 100
signal = pd.Series(rng.standard_normal(T))

# Construct returns with signal decay half-life = 5 days
lam  = np.log(2) / 5.0
fwd  = pd.DataFrame({
    lag: signal.values * np.exp(-lam * lag) + rng.normal(0, 0.05, T)
    for lag in range(1, 21)
})

result = alpha_decay(signal, fwd, max_lag=20)
if "half_life_days" in result.columns:
    print(f"Estimated half-life: {result['half_life_days'].iloc[0]:.1f} days")
print(result["IC"].round(3))`,
    explanation:
      "Alpha decay analysis is essential before deploying a signal: a 5-day half-life means the signal is meaningless beyond ~15 days, so holding a position for a month destroys alpha. Fitting an exponential decay to the IC-vs-lag curve gives a quantitative estimate of optimal holding period. Combine this with transaction cost curves (implementation shortfall vs urgency) to find the AUM-maximising trading aggressiveness.",
  },
];
