import type { Snippet } from "./types";

export const pythonFinanceSnippets20260531B1: Snippet[] = [
  {
    id: "py-fin-20260531-b1-vecm",
    language: "python",
    title: "VECM (Vector Error Correction Model) — cointegrated equity pairs",
    tag: "time-series",
    code: `import numpy as np
from statsmodels.tsa.vector_ar.vecm import VECM, select_coint_rank

# VECM models cointegrated multivariate time series.
# If I(1) series y_t share r cointegrating relationships:
#   Δy_t = α β' y_{t-1}  +  Γ_1 Δy_{t-1}  + ... + ε_t
# β = cointegrating vectors (long-run), α = adjustment speeds.

rng = np.random.default_rng(42)
n   = 500
# Simulate 2 cointegrated I(1) series: y2 = y1 + stationary noise
e1  = rng.normal(0, 1, n).cumsum()           # I(1) common factor
e2  = rng.normal(0, 1, n).cumsum()
y1  = e1 + rng.normal(0, 0.3, n)
y2  = e1 + rng.normal(0, 0.3, n)            # cointegrated with y1
data = np.column_stack([y1, y2])

# 1. Test for cointegrating rank
rank_test = select_coint_rank(data, det_order=0, k_ar_diff=1)
print(f"Cointegrating rank: {rank_test.rank}")

# 2. Fit VECM with 1 lag and 1 cointegrating vector
model  = VECM(data, k_ar_diff=1, coint_rank=1, deterministic="n")
result = model.fit()

print("Cointegrating vector β:", result.beta.T)
print("Adjustment speeds α:   ", result.alpha.T)
# β should be close to [1, -1] (spread = y1 - y2 is stationary)
# α should be negative for y1, positive for y2 (error-correcting)

# 3. Error-correction term (spread)
spread = data @ result.beta
print(f"Spread mean: {spread.mean():.4f}  std: {spread.std():.4f}")`,
    explanation:
      "VECM separates the long-run cointegrating relationship (β) from short-run dynamics (Γ) and error-correction adjustment (α). For a pairs trade, β captures the hedge ratio and α tells you how quickly each leg reverts to equilibrium — a large negative α for leg 1 means it does most of the mean-reversion. Unlike a plain VAR on returns, VECM uses the level of the spread as a predictor, giving it predictive power that VAR lacks when series are cointegrated.",
  },

  {
    id: "py-fin-20260531-b1-cms-convexity",
    language: "python",
    title: "CMS convexity adjustment — replication and linear swap rate model",
    tag: "derivatives",
    code: `import numpy as np
from scipy.integrate import quad

# A CMS coupon pays the n-year swap rate at each reset.
# The CMS rate != the forward swap rate because E^Q[S_T] != F_swap(0,T)
# (Jensen's inequality: swap rates are not martingales under the swap measure).
#
# Linear Swap Rate Model convexity adjustment (Hunt & Kennedy 2000):
#   CMS_adj ≈ F * annuity_duration * var(dF) / annuity(F)^2 * (partial annuity wrt F)
# Simplified approximation (Plesser 2001):
#   adj ≈ F * (1 + F * tau_swap / freq) * sigma^2 * T / (1 + F * tau_swap)
# where tau_swap = swap tenor, freq = payment frequency.

def cms_convexity_adj_approx(F: float, sigma: float, T: float,
                              tau_swap: float, freq: int = 2) -> float:
    """
    Approximate CMS convexity adjustment via annuity duration method.
    F      : forward swap rate
    sigma  : swap rate lognormal vol (swaption ATM vol)
    T      : CMS payment date (years from today)
    tau_swap: swap tenor in years
    Returns the additive convexity adjustment in rate terms.
    """
    n = int(tau_swap * freq)
    dy = 1.0 / freq
    # Annuity: sum of discount factors for swap cash flows
    def annuity(r):
        return sum(1.0 / (1.0 + r * dy) ** (i + 1) for i in range(n))

    A   = annuity(F)
    # Numerical derivative of annuity w.r.t. swap rate
    eps = 1e-5
    dA  = (annuity(F + eps) - annuity(F - eps)) / (2 * eps)

    # Variance of forward swap rate over [0, T]
    var_F = F * F * sigma * sigma * T

    # Adjustment = -F * (dA/A) * var_F (Hagan approximation)
    adj = -F * (dA / A) * var_F
    return adj

F_swap = 0.045          # 4.5% 10Y forward swap rate
sigma  = 0.20           # ATM swaption vol
T_pay  = 1.0            # CMS coupon in 1 year
tau    = 10.0           # 10Y underlying swap

adj = cms_convexity_adj_approx(F_swap, sigma, T_pay, tau)
print(f"CMS forward rate:         {F_swap*100:.4f}%")
print(f"Convexity adjustment:     {adj*10000:.2f} bps")
print(f"CMS rate (F + adj):       {(F_swap + adj)*100:.4f}%")`,
    explanation:
      "CMS products pay the prevailing swap rate (e.g. 10Y CMS) at each coupon date, converting a long-dated swap into a sequence of short-dated floating payments. The convexity adjustment is always positive for a payer CMS: because swap rates are lognormal and the annuity (PV of 1 bp) is a concave function of the swap rate, Jensen's inequality means the expected swap rate under the payment measure exceeds the forward swap rate. This adjustment grows with swap vol², payment delay, and swap tenor.",
  },

  {
    id: "py-fin-20260531-b1-vanna-volga",
    language: "python",
    title: "Vanna-volga FX option pricing — smile interpolation from three pillars",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

def bs_call(S, K, r, q, sigma, T):
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma*sqT
    return S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_vega(S, K, r, q, sigma, T):
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*sqT)
    return S*np.exp(-q*T)*norm.pdf(d1)*sqT

def bs_vanna(S, K, r, q, sigma, T):
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma*sqT
    return -np.exp(-q*T) * norm.pdf(d1) * d2 / sigma

def bs_volga(S, K, r, q, sigma, T):
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma*sqT
    return S*np.exp(-q*T)*norm.pdf(d1)*sqT * d1*d2 / sigma

# Vanna-Volga: replicate target option with 3 pillars (25D put, ATM, 25D call)
# The VV price = BSM(sigma_atm) + w_RR * (C_RR - BSM_RR) + w_VWB * (C_VWB - BSM_VWB)
# Simplified: weight by vanna and volga exposures of the target vs pillars.
def vanna_volga_price(S, K, r, q, T,
                      sigma_atm, sigma_25d_put, sigma_25d_call):
    # Three pillar strikes (25-delta calls/puts)
    def strike_from_delta(delta, call=True):
        sign = 1 if call else -1
        f    = lambda x: norm.cdf(sign*(np.log(S/x)+(r-q+0.5*sigma_atm**2)*T)/(sigma_atm*np.sqrt(T))) - abs(delta)
        return brentq(f, S*0.5, S*2.0)

    K1 = strike_from_delta(0.25, call=False)  # 25D put strike
    K2 = S * np.exp((r-q)*T)                  # ATM (ATMF)
    K3 = strike_from_delta(0.25, call=True)   # 25D call strike

    # BSM price with ATM vol
    bsm0 = bs_call(S, K, r, q, sigma_atm, T)

    # Vanna and volga of the target option at sigma_atm
    vanna_K  = bs_vanna(S, K,  r, q, sigma_atm, T)
    volga_K  = bs_volga(S, K,  r, q, sigma_atm, T)

    # Pillars: risk reversal (K1, K3) and vega-weighted butterfly (all three)
    vanna_K1 = bs_vanna(S, K1, r, q, sigma_atm, T)
    vanna_K3 = bs_vanna(S, K3, r, q, sigma_atm, T)
    volga_K1 = bs_volga(S, K1, r, q, sigma_atm, T)
    volga_K2 = bs_volga(S, K2, r, q, sigma_atm, T)
    volga_K3 = bs_volga(S, K3, r, q, sigma_atm, T)

    # Market prices with market vols
    C_K1_mkt = bs_call(S, K1, r, q, sigma_25d_put,  T)
    C_K2_mkt = bs_call(S, K2, r, q, sigma_atm,      T)
    C_K3_mkt = bs_call(S, K3, r, q, sigma_25d_call, T)
    C_K1_bsm = bs_call(S, K1, r, q, sigma_atm,      T)
    C_K2_bsm = bs_call(S, K2, r, q, sigma_atm,      T)
    C_K3_bsm = bs_call(S, K3, r, q, sigma_atm,      T)

    # Overhedge cost for RR and butterfly
    rr_overhedge  = (C_K3_mkt - C_K3_bsm) - (C_K1_mkt - C_K1_bsm)
    vwb_overhedge = (C_K1_mkt - C_K1_bsm) + (C_K3_mkt - C_K3_bsm)

    # Weights: solve 2x2 system matching vanna/volga exposures
    denom = vanna_K3 * volga_K1 - vanna_K1 * volga_K3
    if abs(denom) < 1e-12:
        return bsm0
    x1 = (vanna_K * volga_K3 - volga_K * vanna_K3) / denom
    x3 = (volga_K * vanna_K1 - vanna_K * volga_K1) / denom

    return bsm0 + x1 * (C_K1_mkt - C_K1_bsm) + x3 * (C_K3_mkt - C_K3_bsm)

# EUR/USD: S=1.08, T=3M, ATM vol=7%, 25D RR=-0.5%, 25D VWB=+0.3%
S, r, q, T = 1.08, 0.053, 0.035, 0.25
sigma_atm = 0.070
sigma_25p  = sigma_atm + 0.005   # 25D put (higher vol for put skew)
sigma_25c  = sigma_atm - 0.005   # 25D call

for K in [1.05, 1.08, 1.11]:
    vv = vanna_volga_price(S, K, r, q, T, sigma_atm, sigma_25p, sigma_25c)
    bs = bs_call(S, K, r, q, sigma_atm, T)
    print(f"K={K:.2f}  VV={vv:.6f}  BSM={bs:.6f}  adj={1e4*(vv-bs):.2f}bp")`,
    explanation:
      "Vanna-volga is the standard FX option pricing method: it constructs a portfolio of three vanilla options (25D put, ATM, 25D call) that replicates the vanna and volga exposures of the target, then charges the market-vs-BSM overhedge cost of that replicating portfolio. This directly builds the smile from three observable market quotes without requiring a parametric model — the correction is zero for ATM options and largest for deep OTM/ITM strikes.",
  },

  {
    id: "py-fin-20260531-b1-schwartz-commodity",
    language: "python",
    title: "Schwartz (1997) one-factor commodity model — mean-reverting spot",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

# Schwartz Model 1: log-spot follows OU process
#   d(ln S) = kappa * (mu* - ln S) dt + sigma dW
# where mu* = mu - sigma^2/(2*kappa) is the long-run log-price.
# Futures price F(0, T) = exp(e^{-kappa*T}*ln(S0) + A(T))
# where A(T) = (1 - e^{-kappa*T})*alpha* - sigma^2/(4*kappa)*(1-e^{-2*kappa*T})
# alpha* = mu* - lambda/kappa  (lambda = market price of risk)

def schwartz1_futures(S0: float, kappa: float, mu_star: float,
                      sigma: float, lam: float, T: float) -> float:
    """
    Schwartz 1-factor futures price.
    S0     : current spot price
    kappa  : mean reversion speed
    mu_star: risk-neutral long-run log-price (= mu - lambda/kappa)
    sigma  : spot vol
    lam    : market price of risk (risk premium)
    T      : maturity in years
    """
    x   = np.log(S0)
    alpha_star = mu_star - lam / kappa
    A   = ((1 - np.exp(-kappa*T)) * alpha_star
           - sigma**2 / (4*kappa) * (1 - np.exp(-2*kappa*T)))
    return np.exp(np.exp(-kappa*T) * x + A)

def schwartz1_call(S0, K, kappa, mu_star, sigma, lam, r, T):
    """
    European call on spot under Schwartz 1-factor.
    Spot is lognormal at T: var(ln S_T) = sigma^2*(1-e^{-2*kappa*T})/(2*kappa)
    """
    F   = schwartz1_futures(S0, kappa, mu_star, sigma, lam, T)
    var = sigma**2 * (1 - np.exp(-2*kappa*T)) / (2*kappa)
    sig_T = np.sqrt(var)
    d1  = (np.log(F/K) + 0.5*var) / sig_T
    d2  = d1 - sig_T
    return np.exp(-r*T) * (F*norm.cdf(d1) - K*norm.cdf(d2))

# WTI crude: S0=80, kappa=1.5 (fast mean reversion), sigma=35%
S0, kappa, sigma, r = 80.0, 1.5, 0.35, 0.05
mu_star = np.log(75.0)   # long-run log price
lam     = 0.10           # risk premium

print("Schwartz 1-factor Futures Curve:")
for T in [0.25, 0.5, 1.0, 2.0, 3.0]:
    F = schwartz1_futures(S0, kappa, mu_star, sigma, lam, T)
    print(f"  T={T:.2f}Y: F={F:.2f}")

print()
K = 80.0
for T in [0.25, 1.0]:
    c = schwartz1_call(S0, K, kappa, mu_star, sigma, lam, r, T)
    print(f"  ATM call T={T:.2f}Y: {c:.4f}")`,
    explanation:
      "Schwartz's one-factor model captures the key feature of commodity markets: mean reversion — spot prices revert to a long-run equilibrium (the cost of production / supply-demand balance). This creates backwardation or contango in the futures curve depending on whether spot is above or below the risk-neutral long-run level mu*. Futures vol decreases with maturity (the Samuelson effect: kappa dampens distant futures), explaining why short-dated options are more expensive than long-dated ones in commodity markets.",
  },

  {
    id: "py-fin-20260531-b1-zcis",
    language: "python",
    title: "Zero Coupon Inflation Swap (ZCIS) pricing and breakeven inflation",
    tag: "fixed-income",
    code: `import numpy as np
from datetime import date

# ZCIS: pay fixed leg, receive floating (inflation growth) at maturity.
# At maturity T:
#   Fixed  leg:  N * ((1 + K)^T - 1)
#   Float  leg:  N * (CPI(T) / CPI(0) - 1)
# Fair K = breakeven inflation rate such that NPV = 0:
#   K = (F_CPI(0,T) / CPI(0))^{1/T} - 1
# where F_CPI(0,T) is the forward CPI under the nominal risk-neutral measure.
#
# Bootstrapping: from market ZCIS rates -> forward CPI curve.

def zcis_par_rate(cpi_0: float, cpi_fwd: float, T: float) -> float:
    """Breakeven inflation rate K from forward CPI."""
    return (cpi_fwd / cpi_0) ** (1.0 / T) - 1.0

def zcis_npv(notional: float, K: float, cpi_0: float,
             cpi_fwd: float, T: float, r_nom: float) -> float:
    """
    Mark-to-market NPV of receiving-inflation ZCIS (payer of fixed K).
    cpi_fwd: current market expectation of CPI(T) = CPI_0 * (1+breakeven)^T
    """
    fixed_cf  = notional * ((1 + K) ** T - 1.0)
    float_cf  = notional * (cpi_fwd / cpi_0 - 1.0)
    df        = np.exp(-r_nom * T)
    return df * (float_cf - fixed_cf)

def bootstrap_cpi_curve(zcis_rates, maturities, cpi_0):
    """
    Bootstrap forward CPI from ZCIS market quotes.
    Returns forward CPI values at each maturity.
    """
    fwd_cpi = {}
    for T, K in zip(maturities, zcis_rates):
        fwd_cpi[T] = cpi_0 * (1 + K) ** T
    return fwd_cpi

# US CPI breakeven example (2026 curve)
cpi_0     = 314.0          # current CPI level
r_nom     = 0.053          # 5.3% nominal risk-free
maturities = [1, 2, 5, 10, 30]
# Market ZCIS rates (breakeven inflation)
zcis_rates = [0.028, 0.027, 0.026, 0.025, 0.024]

fwd_cpi = bootstrap_cpi_curve(zcis_rates, maturities, cpi_0)

print("Breakeven Inflation Curve:")
for T in maturities:
    K   = zcis_rates[maturities.index(T)]
    print(f"  {T:2d}Y: breakeven={K*100:.2f}%  fwd CPI={fwd_cpi[T]:.2f}")

# Mark-to-market: entered 10Y ZCIS at K=2.3%, now trade at 2.5%
notional = 10_000_000
K_entry  = 0.023
K_market = 0.025
T        = 10.0
cpi_fwd  = cpi_0 * (1 + K_market) ** T

npv = zcis_npv(notional, K_entry, cpi_0, cpi_fwd, T, r_nom)
print(f"\\nZCIS NPV (receiver pays {K_entry*100:.1f}%, mkt moved to {K_market*100:.1f}%): \${npv:,.0f}")`,
    explanation:
      "ZCIS are the cleanest instrument for expressing a view on realised inflation over a fixed horizon — unlike breakeven from TIPS which embeds a liquidity premium and convexity adjustment. Bootstrapping the ZCIS curve gives a forward CPI projection that underpins the pricing of all inflation-linked derivatives. The MTM gain for a receiver of inflation when breakevens rise is analogous to a bond that benefits when its coupon exceeds the risk-free rate.",
  },

  {
    id: "py-fin-20260531-b1-entropy-pooling",
    language: "python",
    title: "Entropy pooling — Bayesian view blending for portfolio distributions",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

# Entropy pooling (Meucci 2008): update a prior distribution p
# with views (constraints) by minimising relative entropy (KL divergence):
#   min sum_i q_i * ln(q_i / p_i)
# subject to:
#   sum_i q_i = 1,  q_i >= 0
#   Expectation constraints: E_q[f_k(X)] = v_k  for each view k
#
# Result: q_i = p_i * exp(lambda' * f(x_i)) / Z
# (exponential tilting of the prior).

def entropy_pooling(p: np.ndarray,
                    A_eq: np.ndarray,
                    b_eq: np.ndarray,
                    A_ineq: np.ndarray | None = None,
                    b_ineq: np.ndarray | None = None) -> np.ndarray:
    """
    p      : prior probabilities (J,)
    A_eq   : equality constraint matrix (K_eq, J) — E_q[f_k] = b_eq[k]
    b_eq   : RHS of equality constraints (K_eq,)
    Returns posterior probabilities q.
    """
    J = len(p)
    log_p = np.log(np.maximum(p, 1e-300))

    def objective(q):
        q = np.maximum(q, 1e-300)
        return np.sum(q * (np.log(q) - log_p))   # KL(q || p)

    def jac(q):
        q = np.maximum(q, 1e-300)
        return np.log(q) - log_p + 1.0

    constraints = [{"type": "eq", "fun": lambda q: A_eq @ q - b_eq}]
    if A_ineq is not None:
        constraints.append({"type": "ineq",
                             "fun": lambda q: b_ineq - A_ineq @ q})

    bounds  = [(1e-12, None)] * J
    q0      = p.copy()
    result  = minimize(objective, q0, jac=jac,
                       method="SLSQP",
                       constraints=constraints,
                       bounds=bounds,
                       options={"ftol": 1e-10, "maxiter": 1000})
    return result.x / result.x.sum()

# Scenario: J=500 historical simulations of 2 assets
rng = np.random.default_rng(42)
J   = 500
R   = rng.multivariate_normal([0.0006, 0.0005],
                               [[0.0004, 0.00015],[0.00015, 0.0003]], J)
p   = np.ones(J) / J   # equal-weight prior (historical)

# View: E[R1 - R2] = 0.0003 (outperformance of asset 1 by 3bp/day)
A_eq  = np.zeros((2, J))
A_eq[0] = 1.0 / J                # sum(q) = 1
A_eq[1] = R[:, 0] - R[:, 1]      # E_q[R1 - R2] = 0.0003
b_eq    = np.array([1.0, 0.0003])

q = entropy_pooling(p, A_eq, b_eq)

print("Prior  mean R1: {:.5f}  R2: {:.5f}".format(
      np.dot(p, R[:,0]), np.dot(p, R[:,1])))
print("Posterior mean R1: {:.5f}  R2: {:.5f}".format(
      np.dot(q, R[:,0]), np.dot(q, R[:,1])))
print(f"Max weight change: {np.abs(q - p).max():.5f}")
print(f"Effective sample size: {1/np.sum(q**2):.1f} (prior: {J})")`,
    explanation:
      "Entropy pooling generalises Black-Litterman to non-Gaussian distributions: instead of updating a covariance matrix, it reweights historical scenarios to satisfy arbitrary moment constraints (views on means, variances, correlations, tail quantiles). The KL divergence minimisation ensures the posterior stays as close as possible to the prior while satisfying the views exactly, and the effective sample size measures how informative the views are — a small ESS means the views are moving the distribution significantly.",
  },

  {
    id: "py-fin-20260531-b1-realized-kernel",
    language: "python",
    title: "Realized kernel estimator — noise-robust high-frequency vol",
    tag: "market-data",
    code: `import numpy as np

# Realized variance from tick data is contaminated by microstructure noise.
# The realized kernel (Barndorff-Nielsen et al. 2008) uses a lag-weighted
# autocovariance estimator to remove the noise bias:
#   RK = gamma_0 + 2 * sum_{h=1}^{H} k(h/(H+1)) * gamma_h
# where gamma_h = sum_{t} r_t * r_{t-h}  (autocovariance at lag h)
# and k(x) is a kernel weight (Parzen kernel for flat-top).
# H is chosen by the optimal bandwidth H* = c * xi^{4/5} * n^{3/5}.

def parzen_kernel(x: float) -> float:
    """Parzen kernel: smooth at 0 and 1, zero outside [0,1]."""
    ax = abs(x)
    if ax <= 0.5:
        return 1.0 - 6.0*ax**2 + 6.0*ax**3
    elif ax <= 1.0:
        return 2.0 * (1.0 - ax)**3
    return 0.0

def realized_kernel(log_prices: np.ndarray, H: int | None = None) -> float:
    """
    Compute realized kernel estimate of integrated variance.
    log_prices: array of log prices (can be tick data, subsampled)
    H         : bandwidth (auto-selected if None)
    """
    r = np.diff(log_prices)
    n = len(r)

    if H is None:
        # Simple bandwidth rule: H ≈ sqrt(n)
        H = max(1, int(np.sqrt(n)))

    # Autocovariance at lag h
    def gamma(h: int) -> float:
        return np.sum(r[h:] * r[:n-h]) if h < n else 0.0

    # Realized kernel
    rk = gamma(0)
    for h in range(1, H + 1):
        w = parzen_kernel(h / (H + 1))
        rk += 2 * w * gamma(h)
    return max(rk, 0.0)   # truncate at 0

def annualise_rv(rv: float, obs_per_day: int = 23400,
                 trading_days: int = 252) -> float:
    """Convert per-second realized variance to annualised vol."""
    return np.sqrt(rv * obs_per_day * trading_days)

# Simulate noisy tick data: GBM + additive microstructure noise
rng = np.random.default_rng(42)
n_ticks = 3900   # 1 tick per 6 seconds in a 6.5h trading day
sigma   = 0.20 / np.sqrt(252 * 6.5 * 3600)   # per-second vol
noise   = 0.0003                               # 3bp bid-ask half-spread

true_log_ret = rng.normal(0, sigma, n_ticks)
micro_noise  = rng.normal(0, noise, n_ticks + 1)
log_px_noisy = np.cumsum(true_log_ret) + micro_noise[1:] - micro_noise[:-1]
log_px_noisy = np.concatenate([[0.0], log_px_noisy])

rv_naive  = np.sum(np.diff(log_px_noisy)**2)
rv_kernel = realized_kernel(log_px_noisy, H=20)

print(f"Naive RV annualised vol:  {annualise_rv(rv_naive, n_ticks):.4f}")
print(f"Kernel RV annualised vol: {annualise_rv(rv_kernel, n_ticks):.4f}")
print(f"True vol: {0.20:.4f}")`,
    explanation:
      "Naive realized variance from tick data is severely upward-biased by microstructure noise (bid-ask bounce, latency): summing squared returns at 1-second intervals gives apparent vol several times true vol. The realized kernel corrects this by exploiting the negative autocorrelation at lag 1 introduced by noise — the Parzen kernel weights cancel the noise contribution while preserving the signal. It's the standard method used by exchanges and data vendors for publishing end-of-day realised vol.",
  },

  {
    id: "py-fin-20260531-b1-fva",
    language: "python",
    title: "Funding Valuation Adjustment (FVA) — unsecured derivative funding cost",
    tag: "derivatives",
    code: `import numpy as np

# FVA: the cost (or benefit) of funding a derivative position at the
# bank's own funding spread s_f above OIS.
# For a derivatives book, if the bank posts collateral to CSA counterparties
# but has unsecured exposure to non-CSA clients, it funds that gap at s_f.
#
# FVA = -integral_0^T  s_f(t) * EE(t) * DF(t) dt  (funding cost for long exposure)
# FCA (cost):   -s_f * integral EE(t) * DF(t) dt
# FBA (benefit): s_f * integral NEE(t) * DF(t) dt
#
# EE(t)  = Expected Exposure at t  (avg positive MTM)
# NEE(t) = Negative Expected Exposure at t  (avg negative MTM)
# DF(t)  = OIS discount factor

def fva_simple(ee_profile: np.ndarray,
               nee_profile: np.ndarray,
               times: np.ndarray,
               ois_rates: np.ndarray,
               funding_spread: float) -> tuple[float, float, float]:
    """
    Compute FCA, FBA, and net FVA using simple trapezoidal integration.
    ee_profile  : expected exposure at each time step (> 0)
    nee_profile : negative expected exposure (< 0, absolute value here)
    times       : time grid in years
    ois_rates   : OIS zero rates at each time step
    funding_spread: bank's funding spread above OIS (per annum)
    """
    dt = np.diff(times, prepend=0)
    df = np.exp(-ois_rates * times)

    fca = -funding_spread * np.sum(ee_profile  * df * dt)  # cost
    fba =  funding_spread * np.sum(nee_profile * df * dt)  # benefit
    fva = fca + fba
    return fca, fba, fva

# Interest rate swap example: 5Y pay-fixed swap (+ MTM initially, decays)
times = np.linspace(0.25, 5.0, 20)
# EE profile: hump-shaped (peaks in mid-life, decays to zero at maturity)
t_norm = times / 5.0
ee     = 50_000 * t_norm * (1 - t_norm) * 4   # e.g. peaks at ~12.5k at 2.5Y
nee    = 20_000 * (1 - t_norm)**2              # smaller negative exposure

ois    = np.full_like(times, 0.053)   # flat OIS at 5.3%
s_f    = 0.0080                        # 80bp bank funding spread

fca, fba, fva = fva_simple(ee, nee, times, ois, s_f)
print(f"FCA (funding cost):    \${fca:>10,.0f}")
print(f"FBA (funding benefit): \${fba:>10,.0f}")
print(f"Net FVA:               \${fva:>10,.0f}")
print(f"FVA as % of notional:  {fva/1_000_000*100:.4f}%  (1MM notional)")`,
    explanation:
      "FVA represents the cost of carrying unsecured derivative positions when the bank funds them at a spread above OIS — a bank that borrows at OIS+80bp to fund a positive-MTM swap with an unsecured client must charge the client for that funding cost. The FCA-FBA decomposition reflects a directional asymmetry: the funding cost (FCA) applies to positive exposures, while the funding benefit (FBA) arises from negative exposures where the bank receives collateral. Post-2008, all major dealers include FVA in derivative pricing.",
  },

  {
    id: "py-fin-20260531-b1-convertible-bond",
    language: "python",
    title: "Convertible bond pricing — binomial tree with credit risk",
    tag: "derivatives",
    code: `import numpy as np

# Convertible bond: bond + embedded call option on equity.
# Holder can convert to N shares at their discretion.
# Pricing challenge: dual discounting — at rf for bond floor,
# at equity discount rate for conversion option.
# Simplified approach: risk-adjusted rate = r + h (hazard rate for default).
#
# Binomial tree with backward induction:
#   - At each node: conversion value = N * S_node
#   - If in default (modelled as absorbing state), pay recovery.
#   - Node value = max(conversion, continuation, call price, put price).

def convertible_bond_binomial(
    S0: float,        # current stock price
    K_conv: float,    # conversion price (total bond value / N shares)
    N_shares: float,  # shares per bond (face / K_conv)
    face: float,      # bond face value
    coupon: float,    # annual coupon
    r: float,         # risk-free rate
    h: float,         # hazard rate (constant)
    recovery: float,  # recovery fraction of face
    sigma: float,     # equity vol
    T: float,         # maturity
    n_steps: int = 100,
    call_price: float = np.inf,   # issuer call trigger
    put_price: float  = 0.0,      # holder put floor
) -> float:
    dt     = T / n_steps
    u      = np.exp(sigma * np.sqrt(dt))
    d      = 1.0 / u
    disc   = np.exp(-r * dt)
    p_surv = np.exp(-h * dt)         # probability of no default per step
    q      = (np.exp(r * dt) - d) / (u - d)  # risk-neutral up-prob

    # Terminal stock prices
    S_T = S0 * u**(np.arange(n_steps, -1, -1)) * d**(np.arange(0, n_steps + 1))

    # Terminal CB values: max(conversion, face + final coupon)
    # Coupon per step (semi-annual → per-step)
    cpn_step = coupon * face * dt   # simplified continuous coupon accrual
    V = np.maximum(N_shares * S_T, face + cpn_step)

    # Backward induction
    for step in range(n_steps - 1, -1, -1):
        S = S0 * u**(np.arange(step, -1, -1)) * d**(np.arange(0, step + 1))
        # Continuation: survival-weighted average of up/down + accrued coupon
        V_cont = disc * (p_surv * (q * V[:-1] + (1-q) * V[1:])
                         + (1 - p_surv) * recovery * face)
        V_cont += cpn_step
        conv_val = N_shares * S
        # Node value: max of conversion, continuation, put; min with call trigger
        V = np.maximum(np.maximum(conv_val, V_cont), put_price * face)
        V = np.minimum(V, call_price * face)  # issuer can call at this level

    return float(V[0])

# 5Y convertible: face=1000, K_conv=50 (20 shares), 3% coupon
price = convertible_bond_binomial(
    S0=45.0, K_conv=50.0, N_shares=20.0, face=1000.0,
    coupon=0.03, r=0.05, h=0.02, recovery=0.40,
    sigma=0.35, T=5.0, n_steps=200
)
print(f"Convertible bond price: \${price:.4f}")
print(f"Conversion value:       \${45.0 * 20:.2f}")
print(f"Bond floor (approx):    \${1000 * np.exp(-0.05*5):.2f}")`,
    explanation:
      "Convertible bond pricing requires dual discounting: the bond floor component uses the credit-adjusted rate r+h (hazard rate for default risk), while the equity option component uses the equity discount rate. The binomial tree handles the optimal exercise decision at each node by comparing the holding value (discounted continuation) against immediate conversion, while modelling default as a probabilistic absorbing state. In practice, equity vol and hazard rate are the two key inputs — convertible arb traders delta-hedge the equity option component and hold the residual credit + vol.",
  },

  {
    id: "py-fin-20260531-b1-diebold-mariano",
    language: "python",
    title: "Diebold-Mariano test — comparing forecast accuracy",
    tag: "statistics",
    code: `import numpy as np
from scipy import stats

# Diebold-Mariano (1995) test: H0: E[d_t] = 0 where
#   d_t = L(e1_t) - L(e2_t)  (loss differential)
# L(e) = e^2 for MSE, |e| for MAE, etc.
# Test statistic: DM = d_bar / sqrt(LRV / T)
# where LRV = long-run variance of d_t (Newey-West corrected).
#
# H1: Model 1 is significantly worse (two-sided) or better (one-sided).

def newey_west_lrv(d: np.ndarray, max_lag: int | None = None) -> float:
    """Long-run variance estimate via Bartlett kernel (Newey-West 1987)."""
    T = len(d)
    if max_lag is None:
        max_lag = int(np.floor(4 * (T / 100) ** (2/9)))  # bandwidth rule
    d_dm = d - d.mean()
    gamma0 = np.mean(d_dm**2)
    lrv = gamma0
    for h in range(1, max_lag + 1):
        w = 1.0 - h / (max_lag + 1)   # Bartlett weight
        gamma_h = np.mean(d_dm[h:] * d_dm[:-h])
        lrv += 2 * w * gamma_h
    return max(lrv, 1e-300)

def diebold_mariano(actual: np.ndarray,
                    forecast1: np.ndarray,
                    forecast2: np.ndarray,
                    loss: str = "mse",
                    alternative: str = "two-sided") -> dict:
    """
    Compares forecast1 vs forecast2.
    Returns DM statistic, p-value, and 95% CI for mean loss differential.
    alternative: 'two-sided', 'greater' (f1 worse), 'less' (f1 better)
    """
    e1 = actual - forecast1
    e2 = actual - forecast2

    if loss == "mse":
        L1, L2 = e1**2, e2**2
    elif loss == "mae":
        L1, L2 = np.abs(e1), np.abs(e2)
    else:
        raise ValueError("loss must be 'mse' or 'mae'")

    d   = L1 - L2
    T   = len(d)
    d_bar = d.mean()
    lrv = newey_west_lrv(d)
    se  = np.sqrt(lrv / T)
    dm  = d_bar / se

    if alternative == "two-sided":
        pval = 2 * (1 - stats.norm.cdf(abs(dm)))
    elif alternative == "greater":
        pval = 1 - stats.norm.cdf(dm)
    else:
        pval = stats.norm.cdf(dm)

    ci95 = (d_bar - 1.96*se, d_bar + 1.96*se)
    return {"DM": dm, "p_value": pval, "CI_95": ci95,
            "d_bar": d_bar, "T": T}

# Simulate: AR(1) model 1 vs random-walk model 2 for 500-step returns
rng   = np.random.default_rng(42)
T_    = 500
y     = np.cumsum(rng.normal(0, 1, T_))
# Model 1: AR(1) fitted forecast (beta=0.6)
f1    = 0.6 * np.roll(y, 1)[1:]
# Model 2: random walk (yesterday's value)
f2    = y[:-1]
actual = y[1:]

result = diebold_mariano(actual, f1, f2, loss="mse", alternative="two-sided")
print(f"DM statistic: {result['DM']:.4f}")
print(f"p-value:      {result['p_value']:.4f}")
print(f"95% CI:       ({result['CI_95'][0]:.4f}, {result['CI_95'][1]:.4f})")
print(f"Conclusion:   {'Reject H0' if result['p_value'] < 0.05 else 'Fail to reject H0'}")`,
    explanation:
      "The Diebold-Mariano test is the standard method for comparing two competing forecast models (vol models, return predictors, credit rating models) when forecasts may be correlated over time — the Newey-West correction for serial correlation in the loss differential is essential. A rejection means the two models have statistically different accuracy; combined with the sign of d_bar it tells you which model is better. In factor research, DM tests confirm that a new alpha signal adds value over an existing one.",
  },

  {
    id: "py-fin-20260531-b1-wang-transform",
    language: "python",
    title: "Wang transform — risk-adjusted pricing of non-normal distributions",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

# Wang (2000) transform: F*(x) = Phi(Phi^{-1}(F(x)) + lambda)
# where F(x) is the loss CDF, lambda is the market Sharpe ratio.
# Under the distorted measure F*, the price of a risky asset is
#   P = E^{F*}[payoff] * discount_factor
# For a call option with normal returns, this recovers the BSM formula.
# For fat-tailed distributions, Wang pricing differs from lognormal.

def wang_transform_cdf(f_x: np.ndarray, lam: float) -> np.ndarray:
    """Apply Wang distortion to a discrete CDF."""
    phi_inv = norm.ppf(np.clip(f_x, 1e-10, 1 - 1e-10))
    return norm.cdf(phi_inv + lam)

def wang_price_call(x_grid: np.ndarray, pdf: np.ndarray,
                    K: float, lam: float, r: float, T: float) -> float:
    """
    Price a call option using Wang transform on arbitrary PDF of S_T.
    x_grid: terminal stock price grid
    pdf   : probability density at each grid point
    K     : strike
    lam   : Wang market price of risk (Sharpe ratio * sqrt(T))
    """
    dx  = x_grid[1] - x_grid[0]
    cdf = np.cumsum(pdf) * dx
    cdf = np.clip(cdf, 0.0, 1.0)

    # Wang-distorted CDF
    cdf_star = wang_transform_cdf(cdf, lam)
    pdf_star = np.gradient(cdf_star, dx)
    pdf_star = np.maximum(pdf_star, 0.0)
    pdf_star /= (pdf_star.sum() * dx + 1e-15)   # renormalise

    payoff = np.maximum(x_grid - K, 0.0)
    price  = np.trapz(payoff * pdf_star, x_grid)
    return price * np.exp(-r * T)

# Compare Wang pricing under normal vs fat-tailed (t-distribution) terminal distribution
from scipy.stats import t as t_dist

S0, r, T, sigma = 100.0, 0.05, 1.0, 0.20
K  = 100.0
lam = 0.30   # market Sharpe ~ 0.3 over 1Y (= lam * sqrt(T) / sqrt(T) = 0.30)

x_grid = np.linspace(S0 * 0.3, S0 * 2.5, 2000)
mu_ln  = np.log(S0) + (r - 0.5*sigma**2)*T
sd_ln  = sigma * np.sqrt(T)

# Normal (lognormal spot)
pdf_norm = norm.pdf(np.log(x_grid), loc=mu_ln, scale=sd_ln) / x_grid
price_wang_norm = wang_price_call(x_grid, pdf_norm, K, lam, r, T)

# Fat-tailed: t(4) scaled to match same variance
df_t = 4.0
scale_t = sd_ln * np.sqrt((df_t - 2) / df_t)
pdf_fat  = t_dist.pdf((np.log(x_grid) - mu_ln) / scale_t, df=df_t) / (x_grid * scale_t)
price_wang_fat = wang_price_call(x_grid, pdf_fat, K, lam, r, T)

# BSM reference
from scipy.stats import norm as snorm
d1 = (np.log(S0/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
d2 = d1 - sigma*np.sqrt(T)
bsm = S0*snorm.cdf(d1) - K*np.exp(-r*T)*snorm.cdf(d2)

print(f"BSM call:          {bsm:.4f}")
print(f"Wang (normal):     {price_wang_norm:.4f}")
print(f"Wang (t-dist df=4):{price_wang_fat:.4f}  (fat tail premium)")`,
    explanation:
      "The Wang transform is an actuarial pricing method that generalises risk-neutral pricing: it distorts the physical CDF by a single parameter lambda (the market Sharpe ratio) to produce a risk-adjusted measure. For lognormal distributions it recovers BSM exactly. For fat-tailed distributions (such as t(4)) it prices the additional tail risk without assuming a specific parametric model — making it useful for pricing insurance-like payoffs or stress scenarios where the lognormal assumption breaks down.",
  },

  {
    id: "py-fin-20260531-b1-vol-targeting",
    language: "python",
    title: "Volatility targeting — dynamic leverage for constant-vol allocation",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd

# Vol-targeting: scale position size daily so portfolio has constant target vol.
# w_t = sigma_target / sigma_forecast_t
# Clamp to max_leverage to prevent blow-up when vol is low.
#
# Common in CTA strategies, risk-parity, and equity risk overlays.
# Key empirical finding: vol-targeting dramatically reduces drawdown and
# improves Sharpe vs a fixed-weight buy-and-hold.

def vol_target_backtest(returns: np.ndarray,
                        target_vol: float = 0.15,
                        lookback: int = 21,
                        max_lev: float = 2.0,
                        vol_floor: float = 0.02) -> dict:
    """
    Backtest a vol-targeted strategy.
    returns    : daily return series (fraction)
    target_vol : annualised target vol (e.g. 0.15 = 15%)
    lookback   : EWMA half-life in days for vol forecast
    max_lev    : maximum leverage
    vol_floor  : minimum vol forecast (prevents extreme leverage)
    """
    n   = len(returns)
    ann = np.sqrt(252)

    # EWMA vol forecast (daily)
    lam    = 1.0 - 2.0 / (lookback + 1)
    ew_var = np.zeros(n)
    ew_var[0] = returns[0]**2
    for t in range(1, n):
        ew_var[t] = lam * ew_var[t-1] + (1 - lam) * returns[t-1]**2
    sigma_daily = np.sqrt(ew_var)

    # Annualised forecast vol
    sigma_ann = np.maximum(sigma_daily * ann, vol_floor)

    # Leverage = target_vol / forecast_vol
    leverage   = np.minimum(target_vol / sigma_ann, max_lev)

    # Strategy returns (1-day lag: forecast t used for return t)
    strat_ret   = np.zeros(n)
    strat_ret[1:] = leverage[:-1] * returns[1:]

    # Performance metrics
    cum_bh   = np.cumprod(1 + returns)
    cum_strat = np.cumprod(1 + strat_ret)

    def sharpe(r): return r.mean() / r.std() * ann if r.std() > 0 else 0
    def max_dd(cum):
        peak = np.maximum.accumulate(cum)
        return ((cum - peak) / peak).min()

    return {
        "bh_ann_ret":   (cum_bh[-1]**(252/n) - 1),
        "bh_sharpe":    sharpe(returns),
        "bh_maxdd":     max_dd(cum_bh),
        "vt_ann_ret":   (cum_strat[-1]**(252/n) - 1),
        "vt_sharpe":    sharpe(strat_ret),
        "vt_maxdd":     max_dd(cum_strat),
        "avg_leverage": leverage.mean(),
    }

# Simulate 5Y of daily equity returns: trending + vol clustering
rng = np.random.default_rng(42)
n   = 1260
vol_regime = np.where(np.arange(n) % 252 < 63, 0.30, 0.15)  # 1Q high vol per year
ret = rng.normal(0.0003, 1, n) * vol_regime / np.sqrt(252)

result = vol_target_backtest(ret, target_vol=0.15)
print("                 Buy&Hold   Vol-Target")
print(f"Annualised ret:  {result['bh_ann_ret']*100:>7.2f}%   {result['vt_ann_ret']*100:>7.2f}%")
print(f"Sharpe ratio:    {result['bh_sharpe']:>7.3f}    {result['vt_sharpe']:>7.3f}")
print(f"Max drawdown:    {result['bh_maxdd']*100:>7.2f}%   {result['vt_maxdd']*100:>7.2f}%")
print(f"Avg leverage:             {result['avg_leverage']:>7.3f}x")`,
    explanation:
      "Volatility targeting exploits the well-documented negative correlation between realised vol and future returns (low vol → buy, high vol → sell) — the 'leverage effect' means cutting exposure during high-vol regimes reduces both drawdowns and left-tail risk. Empirically, vol-targeting improves Sharpe by 0.2-0.5 and halves max drawdown for equity strategies, which is why it is standard in risk-parity and trend-following implementations.",
  },

  {
    id: "py-fin-20260531-b1-term-premium",
    language: "python",
    title: "ACM term premium decomposition — Adrian-Crump-Moench model",
    tag: "fixed-income",
    code: `import numpy as np
from numpy.linalg import lstsq

# ACM (2013) model: decompose the yield into expected short-rate path
# and term premium using a Vector Autoregression on yield factors.
#
# Step 1: PCA on yield curve → 3 factors (level, slope, curvature)
# Step 2: VAR(1) on factors → risk-neutral expected short rates
# Step 3: Term premium = actual yield - expected short rate path average
#
# Here we implement a simplified version: OLS VAR(1) + expectations hypothesis

def fit_var1(X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Fit VAR(1): X_t = A @ X_{t-1} + eps. Returns A and residuals."""
    X_lag  = X[:-1]
    X_lead = X[1:]
    A, _, _, _ = lstsq(X_lag, X_lead, rcond=None)
    resid  = X_lead - X_lag @ A
    return A.T, resid

def expected_short_rate_path(r0: np.ndarray, A: np.ndarray,
                              h_horizon: int) -> np.ndarray:
    """E[r_t | r_0] = A^t @ r_0 for t = 1..h_horizon."""
    path = np.zeros(h_horizon)
    r    = r0.copy()
    for t in range(h_horizon):
        r      = A @ r
        path[t] = r[0]   # short rate = first element of state
    return path

def term_premium(yield_T: float, r0: np.ndarray, A: np.ndarray,
                 maturity_steps: int) -> float:
    """
    Term premium = yield_T - (1/T) * sum_{t=1}^{T} E[r_t]
    yield_T: yield on maturity-T bond (annualised)
    maturity_steps: number of steps to maturity
    """
    path = expected_short_rate_path(r0, A, maturity_steps)
    exp_avg = path.mean()
    return yield_T - exp_avg

# Simulate yield curve factors (level, slope, curvature) via VAR(1)
rng = np.random.default_rng(42)
T_  = 240   # 20 years monthly data

# Level persistent (AR≈0.99), slope/curvature less persistent
A_true = np.diag([0.99, 0.95, 0.85])
eps    = rng.multivariate_normal([0,0,0],
                                  np.diag([0.0005**2, 0.001**2, 0.002**2]), T_)
factors = np.zeros((T_, 3))
factors[0] = [0.03, 0.015, 0.005]
for t in range(1, T_):
    factors[t] = A_true @ factors[t-1] + eps[t]

# Fit VAR(1)
A_hat, resid = fit_var1(factors)

# Current state
r0  = factors[-1]
print(f"Current level: {r0[0]*100:.3f}%  slope: {r0[1]*100:.3f}%  curvature: {r0[2]*100:.3f}%")

# Yield approximation: level + slope * loadings (simplified PC mapping)
def approx_yield(state, mat_years):
    l = np.exp(-mat_years / 5)   # exponential loading
    return state[0] + state[1] * (1-l) + state[2] * l * mat_years

for mat in [2, 5, 10]:
    y_T  = approx_yield(r0, mat)
    tp   = term_premium(y_T, r0, A_hat, mat * 12)
    print(f"{mat:2d}Y yield: {y_T*100:.3f}%  EH component: {(y_T-tp)*100:.3f}%  TP: {tp*10000:.1f}bp")`,
    explanation:
      "The term premium is the extra yield investors demand for holding long-duration bonds instead of rolling short-term bills — it compensates for duration risk (uncertain future rates) and liquidity/supply factors. The ACM decomposition uses a VAR(1) on yield curve factors to estimate the 'expectations hypothesis' component (average expected short rate) and defines the residual as the term premium. When term premiums are near zero or negative (as post-QE), long yields give little compensation for rate risk — a key input for fixed-income relative-value trades.",
  },

  {
    id: "py-fin-20260531-b1-carry-test",
    language: "python",
    title: "Carry factor construction and t-test — FX and bond carry signals",
    tag: "portfolio",
    code: `import numpy as np
from scipy import stats

# Carry = yield advantage of an asset over the funding rate.
# FX carry: invest in high-yield currencies, fund in low-yield → earn carry.
# Bond carry: yield - duration-weighted yield change expectation.
# Classic finding: carry predicts excess returns with t-stat > 2 in FX.
#
# Standard carry backtest: sort assets by carry, long top quintile, short bottom.

def carry_signal(spot_rates: np.ndarray,
                 r_domestic: float,
                 r_foreign: np.ndarray,
                 T_days: int = 1) -> np.ndarray:
    """
    FX carry signal: (r_f - r_d) / 360 * T_days (in rate space).
    Higher = more attractive to hold foreign currency.
    """
    return (r_foreign - r_domestic) * T_days / 360.0

def carry_backtest(excess_returns: np.ndarray,
                   carry_signals: np.ndarray,
                   n_long: int = 2,
                   n_short: int = 2) -> dict:
    """
    Backtest carry strategy: long top n_long, short bottom n_short assets.
    excess_returns: (T, N) matrix of daily excess returns
    carry_signals : (T, N) carry values (used to rank at time t for t+1 return)
    Returns performance statistics.
    """
    T, N = excess_returns.shape
    pf_ret = np.zeros(T - 1)

    for t in range(T - 1):
        rank     = np.argsort(carry_signals[t])   # ascending carry rank
        longs    = rank[-n_long:]
        shorts   = rank[:n_short]
        wl       = 1.0 / n_long
        ws       = 1.0 / n_short
        pf_ret[t] = (wl * excess_returns[t+1, longs].sum()
                     - ws * excess_returns[t+1, shorts].sum())

    ann     = 252
    ann_ret = pf_ret.mean() * ann
    ann_vol = pf_ret.std()  * np.sqrt(ann)
    sr      = ann_ret / ann_vol if ann_vol > 0 else 0.0

    # t-test: H0: mean daily return = 0
    t_stat, p_val = stats.ttest_1samp(pf_ret, 0.0)

    # Max drawdown
    cum = np.cumprod(1 + pf_ret)
    peak = np.maximum.accumulate(cum)
    max_dd = ((cum - peak) / peak).min()

    return {"ann_ret": ann_ret, "ann_vol": ann_vol, "sharpe": sr,
            "t_stat": t_stat, "p_value": p_val, "max_dd": max_dd,
            "n_obs": len(pf_ret)}

# Simulate 8 FX pairs, 5Y daily data
rng = np.random.default_rng(42)
T_, N = 1260, 8
# Carry signals: persistent (AR=0.95), range 0-3% annualised
carry = np.zeros((T_, N))
carry[0] = rng.uniform(0.0, 0.03, N)
for t in range(1, T_):
    carry[t] = 0.95 * carry[t-1] + rng.normal(0, 0.001, N)

# Excess returns: carry predicts ~ 0.3 of vol, plus noise
sigma_ret = 0.008  # ~8% annualised per currency
excess_ret = (carry * 0.10 / 252    # carry predictability
              + rng.normal(0, sigma_ret / np.sqrt(252), (T_, N)))

result = carry_backtest(excess_ret, carry)
print(f"Annualised return: {result['ann_ret']*100:.2f}%")
print(f"Annualised vol:    {result['ann_vol']*100:.2f}%")
print(f"Sharpe ratio:      {result['sharpe']:.3f}")
print(f"t-statistic:       {result['t_stat']:.3f}  p-value: {result['p_value']:.4f}")
print(f"Max drawdown:      {result['max_dd']*100:.2f}%")`,
    explanation:
      "Carry is one of the most robust return premia across asset classes (FX, bonds, equities, commodities). The t-test on mean daily returns is the standard check for statistical significance — a t-stat above 2 (p < 0.05) confirms the carry signal has predictive power after controlling for realised vol. The uncovered interest rate parity puzzle (carry predicts positive excess returns despite UIP predicting zero) is one of the most replicated findings in international finance, and forms the basis of carry hedge funds.",
  },

  {
    id: "py-fin-20260531-b1-factor-momentum",
    language: "python",
    title: "Factor momentum — time-series momentum on factor returns",
    tag: "portfolio",
    code: `import numpy as np

# Factor momentum (Gupta & Kelly 2019): individual factors (value, momentum,
# quality, etc.) exhibit 12-1 month time-series momentum just like stocks.
# Long factors with positive trailing 12M return, short factors with negative.
# Risk-adjusted: divide by rolling vol for constant-risk-contribution weighting.

def factor_momentum_backtest(factor_returns: np.ndarray,
                              lookback_months: int = 12,
                              skip_month: int = 1,
                              vol_window: int = 36,
                              target_vol: float = 0.10) -> dict:
    """
    factor_returns: (T_months, K_factors) monthly return matrix
    lookback_months: formation period (12 for standard factor momentum)
    skip_month     : skip most recent month (microstructure reversal)
    vol_window     : rolling window for factor vol estimation
    target_vol     : annualised target portfolio vol
    """
    T, K = factor_returns.shape
    start = max(lookback_months + skip_month, vol_window)
    port_ret = np.zeros(T - start)

    for t in range(start, T):
        # Signal: cumulative return over lookback, skipping last 'skip_month' months
        end_form   = t - skip_month
        start_form = end_form - lookback_months
        cum_ret    = np.prod(1 + factor_returns[start_form:end_form], axis=0) - 1

        # Factor vol (past vol_window months)
        sig = factor_returns[t - vol_window:t].std(axis=0, ddof=1) * np.sqrt(12)
        sig = np.maximum(sig, 0.01)   # vol floor

        # Signal scaled by inverse vol
        z = cum_ret / sig
        # Long positive, short negative (equal risk weights by sign)
        pos  = (z > 0).sum()
        neg  = (z < 0).sum()
        if pos == 0 or neg == 0:
            continue
        w = np.zeros(K)
        w[z > 0] =  1.0 / (sig[z > 0] * pos)
        w[z < 0] = -1.0 / (sig[z < 0] * neg)

        # Scale to target vol (annualised, approximate)
        port_vol = np.sqrt(w @ np.cov(factor_returns[t-vol_window:t].T) * 12 @ w)
        if port_vol > 0:
            w *= target_vol / port_vol

        port_ret[t - start] = w @ factor_returns[t]

    ann = 12   # monthly
    ann_ret = port_ret.mean() * ann
    ann_vol = port_ret.std()  * np.sqrt(ann)
    sr      = ann_ret / ann_vol if ann_vol > 0 else 0.0
    cum     = np.cumprod(1 + port_ret)
    max_dd  = ((cum - np.maximum.accumulate(cum)) / np.maximum.accumulate(cum)).min()

    return {"ann_ret": ann_ret, "ann_vol": ann_vol, "sharpe": sr,
            "max_dd": max_dd, "n_months": len(port_ret)}

# Simulate 10Y monthly data for 6 factors (value, momentum, quality, size, low-vol, carry)
rng = np.random.default_rng(42)
T_, K_ = 120, 6
# Each factor: small positive drift + mild autocorrelation (momentum)
AR = 0.20
factor_ret = np.zeros((T_, K_))
factor_ret[0] = rng.normal(0.005, 0.03, K_)
for t in range(1, T_):
    factor_ret[t] = AR * factor_ret[t-1] + rng.normal(0.003, 0.04, K_)

result = factor_momentum_backtest(factor_ret)
print(f"Factor momentum backtest ({K_} factors, {T_} months):")
print(f"  Annualised return: {result['ann_ret']*100:.2f}%")
print(f"  Annualised vol:    {result['ann_vol']*100:.2f}%")
print(f"  Sharpe ratio:      {result['sharpe']:.3f}")
print(f"  Max drawdown:      {result['max_dd']*100:.2f}%")`,
    explanation:
      "Factor momentum applies time-series momentum not to individual stocks but to factor portfolios: buy factors that have done well in the past 12 months, short factors that have done poorly. Empirically, factor momentum has a Sharpe ratio of ~0.5-0.8 and is orthogonal to both stock-level momentum and factor returns, suggesting a distinct source of return. The inverse-vol weighting equalises risk contribution across factors, preventing the portfolio from being dominated by the most volatile factor.",
  },

  {
    id: "py-fin-20260531-b1-bhb-attribution",
    language: "python",
    title: "Brinson-Hood-Beebower (BHB) performance attribution",
    tag: "portfolio",
    code: `import numpy as np
from dataclasses import dataclass

# BHB (1986) attribution decomposes active return into:
#   Allocation effect:   (w_p - w_b) * (r_b - R_b)
#     -- did the PM overweight sectors that outperformed the benchmark?
#   Selection effect:    w_b * (r_p - r_b)
#     -- did the PM pick better stocks within each sector?
#   Interaction effect:  (w_p - w_b) * (r_p - r_b)
#     -- joint effect of overweighting AND outperforming within sector
#
# Total active return = allocation + selection + interaction.
# Interaction is often folded into selection (Brinson-Fachler variant).

@dataclass
class Sector:
    name: str
    weight_portfolio: float  # w_p
    weight_benchmark: float  # w_b
    return_portfolio: float  # r_p
    return_benchmark: float  # r_b

def bhb_attribution(sectors: list[Sector]) -> dict:
    R_b = sum(s.weight_benchmark * s.return_benchmark for s in sectors)
    R_p = sum(s.weight_portfolio * s.return_portfolio for s in sectors)

    results = []
    for s in sectors:
        alloc    = (s.weight_portfolio - s.weight_benchmark) * (s.return_benchmark - R_b)
        select   = s.weight_benchmark * (s.return_portfolio - s.return_benchmark)
        interact = (s.weight_portfolio - s.weight_benchmark) * (s.return_portfolio - s.return_benchmark)
        results.append({
            "sector": s.name,
            "alloc": alloc, "select": select, "interact": interact,
            "total": alloc + select + interact,
        })

    total_alloc   = sum(r["alloc"]    for r in results)
    total_select  = sum(r["select"]   for r in results)
    total_interact= sum(r["interact"] for r in results)
    active_return = R_p - R_b

    return {
        "sector_detail":   results,
        "total_allocation":  total_alloc,
        "total_selection":   total_select,
        "total_interaction": total_interact,
        "active_return":     active_return,
        "check":             abs(active_return - (total_alloc + total_select + total_interact)) < 1e-9,
    }

# Portfolio vs benchmark: 5 GICS sectors
sectors = [
    Sector("Tech",     0.35, 0.30, 0.28, 0.25),   # overweight, outperformed
    Sector("Finance",  0.20, 0.25, 0.08, 0.10),   # underweight, underperformed (bad alloc)
    Sector("Health",   0.15, 0.15, 0.14, 0.12),   # neutral, outperformed (selection)
    Sector("Energy",   0.10, 0.10, 0.05, 0.15),   # neutral, underperformed (bad selection)
    Sector("Utilities",0.20, 0.20, 0.06, 0.06),   # neutral, matched
]

attr = bhb_attribution(sectors)
print(f"{'Sector':<12} {'Allocation':>10} {'Selection':>10} {'Interaction':>12} {'Total':>8}")
print("-" * 58)
for r in attr["sector_detail"]:
    print(f"{r['sector']:<12} {r['alloc']*100:>9.2f}% {r['select']*100:>9.2f}% "
          f"{r['interact']*100:>11.2f}% {r['total']*100:>7.2f}%")
print("-" * 58)
print(f"{'Total':<12} {attr['total_allocation']*100:>9.2f}% "
      f"{attr['total_selection']*100:>9.2f}% "
      f"{attr['total_interaction']*100:>11.2f}% "
      f"{attr['active_return']*100:>7.2f}%")
print(f"Attribution check: {attr['check']}")`,
    explanation:
      "BHB attribution is the standard framework for understanding the source of active returns in a fund: allocation (sector over/underweights) vs selection (stock picking within each sector). The interaction term captures the joint effect — overweighting a sector AND outperforming within it. In practice, most attribution systems fold interaction into selection (Brinson-Fachler variant). Portfolio managers are evaluated separately on each component: a PM who consistently adds through selection but destroys value through allocation should change their sizing approach, not their stock picks.",
  },
];
