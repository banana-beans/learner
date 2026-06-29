import type { Snippet } from "./types";

export const pythonFinanceSnippets20260629B1: Snippet[] = [
  {
    id: "pyfin-20260629-b1-longstaff-schwartz",
    language: "python",
    title: "Longstaff-Schwartz American Option Pricing (LSM)",
    tag: "derivatives",
    code: `import numpy as np
from numpy.polynomial import laguerre

def lsm_american_put(S0: float, K: float, r: float, sigma: float,
                      T: float, n_paths: int = 50_000,
                      n_steps: int = 50, seed: int = 42) -> float:
    """
    Longstaff-Schwartz (2001) regression-based MC for American puts.
    Uses Laguerre polynomial basis for continuation value regression.
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    df  = np.exp(-r * dt)                    # one-step discount factor

    # Simulate antithetic GBM paths for variance reduction
    Z    = rng.standard_normal((n_paths // 2, n_steps))
    Z    = np.concatenate([Z, -Z], axis=0)  # antithetic pairs
    S    = np.zeros((n_paths, n_steps + 1))
    S[:, 0] = S0
    for t in range(n_steps):
        S[:, t+1] = S[:, t] * np.exp(
            (r - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z[:, t]
        )

    # Cash flows matrix — initialised to terminal payoff
    payoff = np.maximum(K - S, 0.0)          # intrinsic at each node
    CF     = payoff[:, -1].copy()            # terminal cash flow

    # Backward induction: regress continuation value on ITM paths
    for t in range(n_steps - 1, 0, -1):
        CF     *= df                          # discount one step back
        itm     = payoff[:, t] > 0           # in-the-money paths only
        X       = S[itm, t]                  # spot values for regression
        Y       = CF[itm]                    # discounted future cash flows

        if X.size > 10:
            # Basis: [L_0(x), L_1(x), L_2(x)] Laguerre polynomials
            basis  = laguerre.lagvander(X / K, deg=3)  # normalise by K
            coeffs = np.linalg.lstsq(basis, Y, rcond=None)[0]
            cont   = basis @ coeffs                     # estimated continuation

            # Exercise where intrinsic > continuation
            ex_now = payoff[itm, t] > cont
            CF[itm] = np.where(ex_now, payoff[itm, t], CF[itm])

    price = np.exp(-r * dt) * np.mean(CF)
    return price

price = lsm_american_put(100, 100, 0.05, 0.20, 1.0)
print(f"LSM American put: {price:.4f}")   # ~6.07-6.11`,
    explanation: "The Longstaff-Schwartz method approximates the conditional expectation of continuation value by regressing discounted future cash flows on basis functions of the current stock price; the key insight is that you only need to regress on in-the-money paths, since early exercise is never optimal out of the money.",
  },
  {
    id: "pyfin-20260629-b1-basket-option-mc",
    language: "python",
    title: "Basket Option MC with Cholesky Correlated Asset Simulation",
    tag: "derivatives",
    code: `import numpy as np
from scipy import stats

def basket_call_mc(spots: np.ndarray, weights: np.ndarray,
                   K: float, r: float, sigma: np.ndarray,
                   rho_matrix: np.ndarray, T: float,
                   n_paths: int = 200_000, seed: int = 0) -> float:
    """
    Price a basket call on a weighted average of correlated assets.
    Payoff: max(sum(w_i * S_i(T)) - K, 0)
    Uses Cholesky decomposition to generate correlated GBM paths.
    """
    rng = np.random.default_rng(seed)
    n   = len(spots)
    L   = np.linalg.cholesky(rho_matrix)           # lower Cholesky factor

    # Generate n_paths x n correlated standard normals
    Z   = rng.standard_normal((n_paths, n))
    W   = Z @ L.T                                   # correlated Brownians

    # Terminal prices via GBM (vectorised over all assets)
    drift  = (r - 0.5 * sigma**2) * T               # shape (n,)
    vol_sq = sigma * np.sqrt(T)                      # shape (n,)
    ST     = spots * np.exp(drift + vol_sq * W)      # shape (n_paths, n)

    # Basket value = weighted average of asset prices
    basket   = ST @ weights                          # shape (n_paths,)
    payoffs  = np.maximum(basket - K, 0.0)
    price    = np.exp(-r * T) * payoffs.mean()
    se       = np.exp(-r * T) * payoffs.std() / np.sqrt(n_paths)
    print(f"Basket call: {price:.4f} +/- {1.96*se:.4f} (95% CI)")
    return price

# 3-asset equally-weighted basket
spots   = np.array([100.0, 110.0, 90.0])
weights = np.array([1/3, 1/3, 1/3])
sigmas  = np.array([0.25, 0.20, 0.30])
rho     = np.array([[1.0, 0.6, 0.4],
                    [0.6, 1.0, 0.5],
                    [0.4, 0.5, 1.0]])

# Basket strike = current basket value (ATM)
K_basket = float(spots @ weights)  # 100.0
price    = basket_call_mc(spots, weights, K_basket, 0.05, sigmas, rho, 1.0)`,
    explanation: "Basket options cannot be priced analytically because the sum of correlated lognormals is not lognormal; Monte Carlo with Cholesky correlation is the standard approach, and variance reduction (antithetic variates, control variate using the geometric basket which has a closed-form) can reduce standard error by 10-50x.",
  },
  {
    id: "pyfin-20260629-b1-irs-pricing",
    language: "python",
    title: "Interest Rate Swap (IRS) Pricing via Discount Curve Bootstrap",
    tag: "fixed income",
    code: `import numpy as np
from scipy.interpolate import CubicSpline

def bootstrap_discount_curve(maturities: list, par_rates: list) -> callable:
    """
    Bootstrap a discount curve from par swap rates.
    Returns a discount factor function D(t) via cubic spline interpolation.
    Assumes semi-annual coupon payments.
    """
    disc_factors = {0.0: 1.0}
    mats         = sorted(set([0.0] + maturities))
    coupon_dates = [round(0.5 * k, 1) for mat in maturities
                    for k in range(1, int(2 * mat) + 1)]

    # Bootstrap: solve for D(T_n) given all previous D(T_k)
    # Par rate: fixed rate where PV(fixed) = PV(floating) = 1 - D(T_n)
    known_D = {0.0: 1.0}
    for T, r in zip(maturities, par_rates):
        coupon = r / 2.0   # semi-annual
        dates  = [round(0.5 * k, 1) for k in range(1, int(2 * T) + 1)]
        # Sum of discounted known coupons
        annuity = sum(coupon * known_D.get(d, np.nan)
                      for d in dates[:-1] if d in known_D)
        # D(T): solve coupon * D(T) + D(T) = 1 - annuity
        D_T = (1.0 - annuity) / (1.0 + coupon)
        known_D[T] = D_T

    ts = sorted(known_D.keys())
    Ds = [known_D[t] for t in ts]
    cs = CubicSpline(ts, np.log(Ds), extrapolate=True)  # log-linear interp
    return lambda t: float(np.exp(cs(t)))

def price_irs(notional: float, fixed_rate: float, maturity: float,
              disc_fn: callable, freq: int = 2) -> float:
    """
    Price a receive-fixed swap: PV(fixed) - PV(floating).
    PV(floating) = notional * (D(0) - D(T)) for a par-reset floater.
    PV(fixed)    = notional * fixed_rate/freq * sum D(t_i)
    """
    dt     = 1.0 / freq
    dates  = [round(dt * k, 4) for k in range(1, int(maturity * freq) + 1)]
    annuity = sum(disc_fn(t) for t in dates) * dt        # sum of discount factors * dt
    pv_fixed   = notional * fixed_rate * annuity
    pv_floating= notional * (1.0 - disc_fn(maturity))    # par float leg
    return pv_fixed - pv_floating                          # NPV of receive-fixed

# Market par swap rates
maturities = [0.5, 1.0, 2.0, 3.0, 5.0]
par_rates  = [0.045, 0.048, 0.049, 0.050, 0.051]

disc = bootstrap_discount_curve(maturities, par_rates)
print(f"D(1y): {disc(1.0):.4f}, D(5y): {disc(5.0):.4f}")

# A 3yr IRS paying 5% fixed on $10M notional
npv = price_irs(10_000_000, 0.050, 3.0, disc)
print(f"3y IRS NPV (receive 5% fixed): \${npv:,.2f}")`,
    explanation: "The floating leg of a par-reset IRS always prices at par (notional * (1 - D(T))) because the stream of floating coupons plus principal return is equivalent to a rolling sequence of one-period FRAs each priced at zero; this simplification reduces IRS pricing to a single annuity sum for the fixed leg.",
  },
  {
    id: "pyfin-20260629-b1-ewma-covariance",
    language: "python",
    title: "EWMA Covariance Matrix (RiskMetrics 1994 Approach)",
    tag: "risk",
    code: `import numpy as np
import pandas as pd

def ewma_cov(returns: np.ndarray, lam: float = 0.94) -> np.ndarray:
    """
    Exponentially weighted moving average covariance matrix.
    lam=0.94 is the RiskMetrics daily decay factor (half-life ≈ 11 days).
    Returns the EWMA covariance matrix at the last observation.
    """
    T, n = returns.shape
    # Initialise with sample covariance of first 20 observations
    Sigma = np.cov(returns[:20].T, ddof=1)

    for t in range(20, T):
        r_t   = returns[t][:, np.newaxis]          # (n, 1) column vector
        Sigma = lam * Sigma + (1 - lam) * (r_t @ r_t.T)  # EWMA update

    return Sigma

def ewma_correlation(Sigma: np.ndarray) -> np.ndarray:
    """Convert EWMA covariance to correlation matrix."""
    vols = np.sqrt(np.diag(Sigma))
    return Sigma / np.outer(vols, vols)

def rolling_ewma_vol(returns: np.ndarray, lam: float = 0.94) -> np.ndarray:
    """Per-asset EWMA volatility time series (annualised)."""
    T, n   = returns.shape
    var    = np.var(returns[:20], axis=0)           # initialise
    vols   = [np.sqrt(var * 252)]

    for t in range(20, T):
        var = lam * var + (1 - lam) * returns[t]**2
        vols.append(np.sqrt(var * 252))
    return np.array(vols)

# Example: 3 assets, 250 days
rng     = np.random.default_rng(42)
true_rho= np.array([[1.0, 0.6, 0.3],
                     [0.6, 1.0, 0.5],
                     [0.3, 0.5, 1.0]])
L       = np.linalg.cholesky(true_rho)
returns = rng.standard_normal((250, 3)) @ L.T * 0.01  # ~1% daily vol

Sigma   = ewma_cov(returns, lam=0.94)
rho_est = ewma_correlation(Sigma)
vols_ts = rolling_ewma_vol(returns, lam=0.94)

print("EWMA Correlation estimate:")
print(rho_est.round(2))
print(f"Asset 0 current EWMA vol: {vols_ts[-1, 0]:.2%}")
print(f"Half-life: {np.log(0.5)/np.log(0.94):.1f} days")`,
    explanation: "EWMA covariance with lambda=0.94 assigns exponentially decaying weights to past observations, making the estimate far more responsive to volatility spikes than a sample covariance over a rolling window; however, it has no memory of calm periods once volatility subsides, which is why GARCH models with mean-reversion are preferred for long-horizon risk.",
  },
  {
    id: "pyfin-20260629-b1-breeden-litzenberger",
    language: "python",
    title: "Breeden-Litzenberger Risk-Neutral Density from Option Smile",
    tag: "vol surface",
    code: `import numpy as np
from scipy.interpolate import UnivariateSpline
from scipy.stats import norm

def implied_vol_to_call(F: float, K: np.ndarray, r: float,
                         T: float, iv: np.ndarray) -> np.ndarray:
    """Black-76 call prices from forward F, strikes K, and implied vols."""
    d1 = (np.log(F / K) + 0.5 * iv**2 * T) / (iv * np.sqrt(T))
    d2 = d1 - iv * np.sqrt(T)
    return np.exp(-r * T) * (F * norm.cdf(d1) - K * norm.cdf(d2))

def risk_neutral_density(F: float, K_grid: np.ndarray, iv_smile: np.ndarray,
                          r: float, T: float) -> tuple:
    """
    Breeden-Litzenberger (1978): RND = exp(rT) * d^2C/dK^2
    Extracts the market-implied probability density from the call price surface.
    """
    # Smooth the IV smile with a cubic spline (avoid noise amplification in 2nd deriv)
    spline = UnivariateSpline(K_grid, iv_smile, s=1e-6, k=5)
    K_fine = np.linspace(K_grid[0], K_grid[-1], 500)
    iv_fine= np.clip(spline(K_fine), 0.01, 2.0)     # clamp to valid range

    # Compute call prices on fine grid
    C = implied_vol_to_call(F, K_fine, r, T, iv_fine)

    # Second derivative of call price w.r.t. strike (finite difference)
    dK  = K_fine[1] - K_fine[0]
    d2C = np.gradient(np.gradient(C, dK), dK)        # numerical second derivative

    # RND = e^{rT} * d^2C/dK^2 (must integrate to 1)
    rnd  = np.exp(r * T) * d2C
    rnd  = np.maximum(rnd, 0.0)                       # ensure non-negative
    norm_const = np.trapz(rnd, K_fine)
    rnd /= norm_const                                  # normalise to a PDF

    return K_fine, rnd

# Example: EUR/USD 1m smile (schematic)
F   = 1.08                                             # forward
T   = 1/12
r   = 0.05
# Strikes and corresponding implied vols (downward sloping smile)
K_obs  = np.array([1.00, 1.03, 1.06, 1.08, 1.10, 1.13, 1.16])
iv_obs = np.array([0.14, 0.12, 0.10, 0.09, 0.09, 0.10, 0.11])  # vol smile

K_rnd, rnd = risk_neutral_density(F, K_obs, iv_obs, r, T)
peak_K = K_rnd[np.argmax(rnd)]
print(f"RND mode (most likely S_T): {peak_K:.4f}")
print(f"Integrates to: {np.trapz(rnd, K_rnd):.4f}")  # ~1.0`,
    explanation: "The Breeden-Litzenberger identity shows that call prices are essentially the cumulative distribution function of the risk-neutral density, so differentiating twice with respect to strike recovers the RND directly from market prices; the practical challenge is that numerical differentiation amplifies noise in the smile, requiring careful smoothing before applying the formula.",
  },
  {
    id: "pyfin-20260629-b1-merton-jump-python",
    language: "python",
    title: "Merton Jump-Diffusion Option Pricer (Series Expansion)",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bsm_call(S: float, K: float, r: float, sigma: float, T: float) -> float:
    """Standard Black-Scholes-Merton call price."""
    if T <= 0: return max(S - K, 0.0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d2)

def merton_call(S: float, K: float, r: float, sigma: float, T: float,
                lam: float, mu_j: float, sigma_j: float,
                n_terms: int = 50) -> float:
    """
    Merton (1976) jump-diffusion call price via Poisson series expansion.
    lam:     jump intensity (jumps/year)
    mu_j:    mean log-jump (e.g. -0.10 for avg -10% jump)
    sigma_j: vol of log-jump

    Each term in the series conditions on exactly n jumps occurring.
    BSM with adjusted parameters is applied for each n.
    """
    # kbar = E[J - 1] = expected proportional jump magnitude
    kbar = np.exp(mu_j + 0.5 * sigma_j**2) - 1.0

    # Adjusted risk-free rate (compensates for jump risk-neutral drift)
    r_adj = r - lam * kbar

    price = 0.0
    lam_T = lam * T                                   # expected number of jumps in [0,T]

    for n in range(n_terms):
        # Probability of exactly n jumps (Poisson)
        prob_n = np.exp(-lam_T) * lam_T**n / np.math.factorial(n)

        # Conditional vol and drift given n jumps
        sigma_n = np.sqrt(sigma**2 + n * sigma_j**2 / T)
        r_n     = r_adj + n * mu_j / T + n * sigma_j**2 / (2 * T)

        price += prob_n * bsm_call(S, K, r_n, sigma_n, T)

    return price

# ATM call: S=100, K=100, r=5%, sigma=20%, lam=1.5, mu_j=-10%, sigma_j=15%
price = merton_call(100, 100, 0.05, 0.20, 1.0, lam=1.5, mu_j=-0.10, sigma_j=0.15)
bsm   = bsm_call(100, 100, 0.05, 0.20, 1.0)
print(f"Merton call:  {price:.4f}")   # ~13-14 (jump premium)
print(f"BSM call:     {bsm:.4f}")    # ~10.45
print(f"Jump premium: {price-bsm:.4f}")`,
    explanation: "The Merton series converges quickly (50 terms is overkill; 20 suffices) because the Poisson weights exp(-lambda*T) * (lambda*T)^n / n! fall off rapidly; unlike Monte Carlo, this closed-form approach is exact under the Merton model and enables fast calibration to the entire vol smile via least-squares on lambda, mu_j, sigma_j.",
  },
  {
    id: "pyfin-20260629-b1-ols-hedge-ratio",
    language: "python",
    title: "Variance-Optimal OLS Hedge Ratio and Minimum-Variance Hedge",
    tag: "risk",
    code: `import numpy as np
import pandas as pd
from statsmodels.api import OLS, add_constant

def ols_hedge_ratio(portfolio_returns: np.ndarray,
                    hedge_returns: np.ndarray) -> dict:
    """
    Estimate the minimum-variance hedge ratio h* via OLS.
    h* = Cov(P, H) / Var(H) = the slope of regressing P on H.
    Hedge: sell h* units of H per unit of P.
    """
    X = add_constant(hedge_returns)
    model = OLS(portfolio_returns, X).fit()

    h_star   = model.params[1]              # slope = hedge ratio
    alpha    = model.params[0]              # intercept (alpha/residual drift)
    r_sq     = model.rsquared              # fraction of variance hedged
    hedge_eff= r_sq * 100                  # hedging effectiveness %

    # Residual variance (unhedgeable risk)
    resid_var = np.var(model.resid, ddof=1)
    port_var  = np.var(portfolio_returns, ddof=1)

    return {
        "hedge_ratio":     round(h_star, 4),
        "alpha":           round(alpha, 6),
        "r_squared":       round(r_sq, 4),
        "hedge_effectiveness_pct": round(hedge_eff, 1),
        "residual_vol_ann":round(np.sqrt(resid_var * 252), 4),
        "original_vol_ann":round(np.sqrt(port_var * 252), 4),
    }

def rolling_hedge_ratio(port_ret: pd.Series, hedge_ret: pd.Series,
                         window: int = 60) -> pd.Series:
    """Rolling OLS hedge ratio (recalibrated every day)."""
    def _ols_slope(y, x):
        xm, ym = x - x.mean(), y - y.mean()
        return np.dot(xm, ym) / np.dot(xm, xm)

    return pd.Series(
        [_ols_slope(port_ret.iloc[i-window:i].values,
                    hedge_ret.iloc[i-window:i].values)
         for i in range(window, len(port_ret))],
        index=port_ret.index[window:]
    )

# Simulate: oil producer hedging crude exposure with futures
rng = np.random.default_rng(42)
# Spot oil returns with 30% vol; futures highly correlated but basis risk
spot_ret   = rng.normal(0.0, 0.30 / np.sqrt(252), 252)
# Futures = spot + basis noise (correlation ~0.95)
fut_ret    = 0.98 * spot_ret + rng.normal(0, 0.03 / np.sqrt(252), 252)

result = ols_hedge_ratio(spot_ret, fut_ret)
for k, v in result.items():
    print(f"  {k}: {v}")`,
    explanation: "The OLS hedge ratio h* = Cov(P,H)/Var(H) minimises the variance of the hedged portfolio; R-squared directly measures hedging effectiveness — an R-squared of 0.90 means 90% of variance is eliminated, leaving only basis risk; rolling estimation (window=60 days) is important when the basis relationship is non-stationary.",
  },
  {
    id: "pyfin-20260629-b1-sortino-omega",
    language: "python",
    title: "Sortino Ratio, Omega Ratio, and Calmar Ratio Performance Metrics",
    tag: "finance",
    code: `import numpy as np
from typing import Optional

def sortino_ratio(returns: np.ndarray, target: float = 0.0,
                  ann_factor: int = 252) -> float:
    """
    Sortino ratio = (mean - target) / downside_deviation.
    Only penalises negative deviations below the target (not upside vol).
    """
    excess    = returns - target / ann_factor      # daily excess over target
    downside  = excess[excess < 0]
    if len(downside) == 0:
        return np.inf
    dd        = np.sqrt(np.mean(downside**2))      # downside deviation
    ann_excess= (returns.mean() - target / ann_factor) * ann_factor
    return ann_excess / (dd * np.sqrt(ann_factor))

def omega_ratio(returns: np.ndarray, threshold: float = 0.0) -> float:
    """
    Omega ratio = E[max(R-L, 0)] / E[max(L-R, 0)] where L is the threshold.
    Ratio > 1 means more probability mass above threshold than below.
    No distributional assumption — pure empirical measure.
    """
    daily_thr = threshold / 252
    gains     = np.maximum(returns - daily_thr, 0.0)
    losses    = np.maximum(daily_thr - returns, 0.0)
    if losses.mean() == 0:
        return np.inf
    return gains.mean() / losses.mean()

def calmar_ratio(returns: np.ndarray, ann_factor: int = 252) -> float:
    """Calmar ratio = annualised return / max drawdown."""
    cumret   = np.cumprod(1 + returns)
    peak     = np.maximum.accumulate(cumret)
    dd       = (cumret - peak) / peak
    max_dd   = abs(dd.min())
    ann_ret  = returns.mean() * ann_factor
    return ann_ret / max_dd if max_dd > 0 else np.inf

def information_ratio(port_ret: np.ndarray, bench_ret: np.ndarray,
                       ann_factor: int = 252) -> float:
    """IR = alpha / tracking_error."""
    active = port_ret - bench_ret
    alpha  = active.mean() * ann_factor
    te     = active.std(ddof=1) * np.sqrt(ann_factor)
    return alpha / te if te > 0 else 0.0

# Simulate a strategy vs benchmark
rng   = np.random.default_rng(42)
bench = rng.normal(0.0008, 0.012, 252)        # ~20% vol benchmark
port  = bench + rng.normal(0.0002, 0.004, 252) # 50bp alpha, 6% tracking error

print(f"Sharpe:   {port.mean()/port.std(ddof=1)*np.sqrt(252):.2f}")
print(f"Sortino:  {sortino_ratio(port):.2f}")
print(f"Omega(0): {omega_ratio(port):.2f}")
print(f"Calmar:   {calmar_ratio(port):.2f}")
print(f"Info Ratio: {information_ratio(port, bench):.2f}")`,
    explanation: "The Sortino ratio penalises only downside deviation, recognising that upside volatility is desirable; the Omega ratio makes no distributional assumptions (unlike Sharpe) and captures all moments of the return distribution, making it particularly useful for comparing strategies with skewed or fat-tailed returns.",
  },
  {
    id: "pyfin-20260629-b1-digital-option",
    language: "python",
    title: "Digital (Binary) Options: Cash-or-Nothing and Asset-or-Nothing",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def digital_cash_or_nothing(S: float, K: float, r: float, sigma: float,
                             T: float, is_call: bool = True,
                             cash: float = 1.0) -> dict:
    """
    Cash-or-nothing digital: pays $cash if S_T > K (call) or S_T < K (put).
    Delta = dC/dS has a spike near K — huge gamma near expiry.
    """
    d2 = (np.log(S/K) + (r - 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    df = np.exp(-r * T)

    if is_call:
        price = cash * df * norm.cdf(d2)
        delta = cash * df * norm.pdf(d2) / (S * sigma * np.sqrt(T))
    else:
        price = cash * df * norm.cdf(-d2)
        delta = -cash * df * norm.pdf(d2) / (S * sigma * np.sqrt(T))

    # Gamma: spikes near strike at expiry — large hedging risk
    gamma = -cash * df * norm.pdf(d2) * d2 / (S**2 * sigma**2 * T)

    return {"price": price, "delta": delta, "gamma": gamma}

def digital_asset_or_nothing(S: float, K: float, r: float, sigma: float,
                              T: float, is_call: bool = True) -> float:
    """
    Asset-or-nothing: pays S_T if S_T > K (call) at expiry.
    Price = S * exp(-q*T) * N(d1) for q=0 case.
    Note: Call-on-cash + Call-on-asset = standard BSM call.
    """
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    if is_call:
        return S * norm.cdf(d1)           # undiscounted: risk-neutral measure
    return S * norm.cdf(-d1)

# At-the-money digital call and put (must sum to e^{-rT} * 1.0 = discount)
res_call = digital_cash_or_nothing(100, 100, 0.05, 0.20, 1.0, is_call=True)
res_put  = digital_cash_or_nothing(100, 100, 0.05, 0.20, 1.0, is_call=False)
df       = np.exp(-0.05)
print(f"Digital call: {res_call['price']:.4f}")
print(f"Digital put:  {res_put['price']:.4f}")
print(f"Sum (= e^{{-rT}}): {res_call['price'] + res_put['price']:.4f} vs {df:.4f}")
print(f"Delta (call): {res_call['delta']:.4f}")

# Decompose BSM call: Call = Asset-or-Nothing - K * e^{-rT} * Cash-or-Nothing
aon = digital_asset_or_nothing(100, 100, 0.05, 0.20, 1.0)
con = digital_cash_or_nothing(100, 100, 0.05, 0.20, 1.0)['price']
bsm_call_repl = aon - 100 * con
print(f"BSM call via decomposition: {bsm_call_repl:.4f}")  # ~10.45`,
    explanation: "A standard BSM call decomposes as Asset-or-Nothing minus K * Cash-or-Nothing; cash-or-nothing digitals have a large gamma spike near the strike near expiry because the delta (a PDF-evaluated term) diverges as T→0, which is why dealers add a 'digital risk charge' and hedge by spreading a call spread around the strike.",
  },
  {
    id: "pyfin-20260629-b1-black-caps",
    language: "python",
    title: "Interest Rate Cap Pricing via Black's Model (Caplets)",
    tag: "fixed income",
    code: `import numpy as np
from scipy.stats import norm

def black_caplet(F: float, K: float, sigma: float, T_reset: float,
                 T_pay: float, tau: float, disc: float) -> float:
    """
    Black's model for a single caplet.
    F:       forward LIBOR/SOFR rate for [T_reset, T_pay]
    K:       cap strike rate
    sigma:   Black (lognormal) volatility
    T_reset: caplet reset date (vol applies until here)
    tau:     accrual fraction (day-count, e.g. 0.25 for 3m)
    disc:    discount factor to T_pay
    Payoff:  tau * max(LIBOR - K, 0) paid at T_pay
    """
    d1 = (np.log(F / K) + 0.5 * sigma**2 * T_reset) / (sigma * np.sqrt(T_reset))
    d2 = d1 - sigma * np.sqrt(T_reset)
    return disc * tau * (F * norm.cdf(d1) - K * norm.cdf(d2))

def price_cap(F_schedule: list, disc_schedule: list,
              K: float, sigma: float, tau: float = 0.25) -> dict:
    """
    Price an interest rate cap as a sum of caplets.
    F_schedule: list of (forward_rate, reset_time) pairs
    disc_schedule: discount factors to each payment date
    """
    caplet_prices = []
    for (F, T_reset), disc in zip(F_schedule, disc_schedule):
        if T_reset <= 0:    # first period: no optionality (already set)
            caplet_prices.append(0.0)
            continue
        cp = black_caplet(F, K, sigma, T_reset, T_reset + tau, tau, disc)
        caplet_prices.append(cp)

    total = sum(caplet_prices)
    return {
        "cap_price": total,
        "caplet_prices": [round(c, 6) for c in caplet_prices],
        "breakeven_vol": sigma,   # the vol that produced this price
    }

# 2-year 5% cap on 3-month SOFR, flat forward curve at 4.5%
tau     = 0.25                              # quarterly accrual
n_caplets = 8                              # 2 years / 0.25
# Discount factors (flat 5% curve)
r = 0.05
disc     = [np.exp(-r * tau * (k + 1)) for k in range(n_caplets)]
# Forward rates (flat 4.5%)
F_fwd    = [(0.045, tau * k) for k in range(n_caplets)]

cap = price_cap(F_fwd, disc, K=0.05, sigma=0.20, tau=tau)
print(f"Cap price (per $1 notional): {cap['cap_price']:.6f}")
print(f"Caplet breakdown: {cap['caplet_prices']}")
# In practice, multiply by notional (e.g., $10M)
notional = 10_000_000
print(f"Cap price ($10M notional):  \${notional * cap['cap_price']:,.2f}")`,
    explanation: "A cap is simply a portfolio of caplets, each priced independently using Black's formula with the corresponding forward rate; the cap's value is maximised when rates are at-the-money relative to the strike, and the single 'flat vol' that prices the entire cap is the common market quotation convention even though each caplet has its own term structure of volatility.",
  },
  {
    id: "pyfin-20260629-b1-zscore-stat-arb",
    language: "python",
    title: "Z-Score Mean-Reversion Statistical Arbitrage Signals",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import adfuller

def compute_spread(p1: pd.Series, p2: pd.Series,
                   hedge_ratio: float) -> pd.Series:
    """Compute the price spread: P1 - hedge_ratio * P2."""
    return p1 - hedge_ratio * p2

def zscore(spread: pd.Series, window: int = 60) -> pd.Series:
    """Rolling z-score of spread: (spread - mean) / std."""
    mu  = spread.rolling(window, min_periods=window).mean()
    sig = spread.rolling(window, min_periods=window).std(ddof=1)
    return (spread - mu) / sig

def stat_arb_signals(p1: pd.Series, p2: pd.Series,
                      hedge_ratio: float, window: int = 60,
                      enter: float = 2.0, exit_: float = 0.5) -> pd.DataFrame:
    """
    Generate long/short signals based on spread z-score.
    Enter when |z| > enter; exit when |z| < exit_.
    Returns signal where: +1 = long spread, -1 = short spread, 0 = flat.
    """
    spread = compute_spread(p1, p2, hedge_ratio)
    z      = zscore(spread, window)

    signal = pd.Series(0.0, index=z.index)
    position = 0

    for i in range(len(z)):
        zi = z.iloc[i]
        if np.isnan(zi): continue

        if position == 0:
            if zi >  enter: position = -1     # short spread (sell P1, buy P2)
            if zi < -enter: position =  1     # long spread (buy P1, sell P2)
        elif position == 1:
            if zi > -exit_: position =  0     # exit long
        elif position == -1:
            if zi <  exit_: position =  0     # exit short

        signal.iloc[i] = position

    return pd.DataFrame({'spread': spread, 'zscore': z, 'signal': signal})

def adf_test(spread: pd.Series, verbose: bool = True) -> bool:
    """ADF test for spread stationarity (null = unit root)."""
    result = adfuller(spread.dropna(), autolag='AIC')
    pvalue = result[1]
    if verbose:
        print(f"ADF p-value: {pvalue:.4f} ({'stationary' if pvalue < 0.05 else 'non-stationary'})")
    return pvalue < 0.05

# Simulate a mean-reverting pair (cointegrated)
rng = np.random.default_rng(42)
dates = pd.date_range('2024-01-01', periods=500, freq='B')
common = np.cumsum(rng.normal(0, 0.5, 500))              # common factor
p1 = pd.Series(100 + common + rng.normal(0, 0.2, 500), index=dates)
p2 = pd.Series(100 + common + rng.normal(0, 0.2, 500), index=dates)

adf_test(compute_spread(p1, p2, 1.0))
df = stat_arb_signals(p1, p2, hedge_ratio=1.0)
trades = df['signal'].diff().abs().sum() / 2
print(f"Number of round trips: {trades:.0f}")
print(df[['spread', 'zscore', 'signal']].tail())`,
    explanation: "The z-score entry/exit rule is deceptively simple; the critical step is verifying cointegration (via ADF) BEFORE trading, because the strategy is profitable only when the spread is stationary and has a finite half-life of mean reversion — a non-cointegrated pair will produce a random walk spread that never reverts and destroys capital.",
  },
  {
    id: "pyfin-20260629-b1-max-div-portfolio",
    language: "python",
    title: "Maximum Diversification Portfolio (MDI)",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def max_diversification_portfolio(returns: np.ndarray,
                                   allow_short: bool = False) -> dict:
    """
    Maximum diversification index (Choueifaty & Coignard 2008).
    Maximise DR = w.T @ sigma_vec / sqrt(w.T @ Sigma @ w)
    where sigma_vec = vector of individual asset vols.
    DR = 1 means perfectly correlated (no diversification);
    DR = n means perfectly uncorrelated (full diversification).
    """
    Sigma    = np.cov(returns.T, ddof=1)
    vols     = np.sqrt(np.diag(Sigma))          # individual asset vols
    n        = Sigma.shape[0]

    def neg_dr(w):
        w       = np.array(w)
        port_var= w @ Sigma @ w
        if port_var <= 0: return 0.0
        return -(w @ vols) / np.sqrt(port_var)  # negative DR (minimise -> maximise DR)

    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}]
    bounds      = [(0, 1) if not allow_short else (-1, 1)] * n
    w0          = np.ones(n) / n

    res = minimize(neg_dr, w0, method='SLSQP',
                   bounds=bounds, constraints=constraints,
                   options={'ftol': 1e-10, 'maxiter': 1000})

    w_opt    = res.x
    port_vol = np.sqrt(w_opt @ Sigma @ w_opt) * np.sqrt(252)
    dr       = -res.fun                                    # diversification ratio

    # Contribution of each asset to total diversification
    marginal_contrib = (Sigma @ w_opt) / np.sqrt(w_opt @ Sigma @ w_opt)

    return {
        "weights":              w_opt.round(4),
        "diversification_ratio": round(dr, 4),
        "port_vol_ann":         round(port_vol, 4),
        "effective_n_assets":   round(1 / np.sum(w_opt**2), 2),  # Herfindahl inverse
    }

# 4 assets with given correlation structure
rng    = np.random.default_rng(42)
n_obs  = 252
# Generate heterogeneous assets (different vols, partial correlation)
cov    = np.array([[0.04, 0.012, 0.006, 0.000],
                   [0.012, 0.09, 0.018, 0.003],
                   [0.006, 0.018, 0.16, 0.008],
                   [0.000, 0.003, 0.008, 0.25]])
L      = np.linalg.cholesky(cov)
rets   = rng.standard_normal((n_obs, 4)) @ L.T / np.sqrt(252)

result = max_diversification_portfolio(rets)
for k, v in result.items():
    print(f"  {k}: {v}")`,
    explanation: "The maximum diversification portfolio tilts toward high-volatility, low-correlation assets because they contribute the most to the numerator of the diversification ratio without increasing portfolio variance proportionally; this often leads to significant overweights in commodities or foreign assets relative to minimum-variance or mean-variance portfolios.",
  },
  {
    id: "pyfin-20260629-b1-factor-risk-attribution",
    language: "python",
    title: "Factor Risk Attribution (Euler Decomposition / Marginal Risk)",
    tag: "risk",
    code: `import numpy as np

def euler_risk_attribution(weights: np.ndarray,
                            cov_matrix: np.ndarray) -> dict:
    """
    Decompose portfolio variance into factor contributions via Euler's theorem.
    For homogeneous risk measures: Risk = sum_i w_i * MRC_i (Euler identity).
    MRC_i = marginal risk contribution = (Sigma @ w)_i / sigma_p
    Component Risk Contribution_i = w_i * MRC_i
    """
    w         = weights.copy()
    sigma_vec = cov_matrix @ w                   # (Sigma w): marginal variances
    port_var  = float(w @ sigma_vec)             # total portfolio variance
    port_vol  = np.sqrt(port_var)

    mrc = sigma_vec / port_vol                   # marginal risk contributions (dollar vol)
    crc = w * mrc                                # component risk contributions
    pct = crc / port_vol                         # percentage contributions (sum to 1)

    return {
        "portfolio_vol":  round(port_vol * np.sqrt(252), 4),
        "mrc_ann":        (mrc * np.sqrt(252)).round(4),
        "crc_pct":        pct.round(4),
        "risk_equality":  round(float(np.std(pct)), 4),  # 0 = perfect risk parity
    }

def factor_model_attribution(weights: np.ndarray,
                              factor_loadings: np.ndarray,
                              factor_cov: np.ndarray,
                              idiosyncratic_var: np.ndarray) -> dict:
    """
    Barra-style factor attribution: Total risk = Factor risk + Specific risk.
    factor_loadings: (n_assets x n_factors) matrix B
    Total Cov = B @ F_cov @ B.T + diag(idio_var)
    """
    B        = factor_loadings
    Sigma_F  = factor_cov
    Sigma    = B @ Sigma_F @ B.T + np.diag(idiosyncratic_var)

    # Portfolio factor exposure vector: x = B.T @ w
    x          = B.T @ weights

    # Factor and specific variance
    factor_var  = float(x @ Sigma_F @ x)
    specific_var= float(weights @ np.diag(idiosyncratic_var) @ weights)
    total_var   = float(weights @ Sigma @ weights)

    return {
        "factor_variance_pct":   round(factor_var  / total_var * 100, 1),
        "specific_variance_pct": round(specific_var / total_var * 100, 1),
        "factor_exposures":      x.round(4),
        "total_ann_vol":         round(np.sqrt(total_var * 252), 4),
    }

# Equal-weight 4-asset portfolio
w   = np.array([0.25, 0.25, 0.25, 0.25])
cov = np.array([[0.04, 0.012, 0.006, 0.001],
                [0.012, 0.09, 0.018, 0.003],
                [0.006, 0.018, 0.16, 0.008],
                [0.001, 0.003, 0.008, 0.25]])

print("=== Euler Risk Attribution ===")
euler = euler_risk_attribution(w, cov)
for k, v in euler.items(): print(f"  {k}: {v}")

# 2-factor (market, value) model
B     = np.array([[0.9, 0.1], [1.0, -0.2], [1.2, 0.3], [0.7, 0.5]])
F_cov = np.array([[0.04, 0.005], [0.005, 0.02]])
idio  = np.array([0.01, 0.05, 0.10, 0.20])

print("\\n=== Factor Attribution ===")
fattr = factor_model_attribution(w, B, F_cov, idio)
for k, v in fattr.items(): print(f"  {k}: {v}")`,
    explanation: "Euler's theorem for homogeneous functions guarantees that variance decomposition is exact (the components sum to total variance with no residual); in risk parity portfolios, the target is equal component risk contributions (crc_pct all equal to 1/n), which requires dramatically overweighting low-volatility assets relative to a cap-weighted index.",
  },
  {
    id: "pyfin-20260629-b1-bond-convexity-python",
    language: "python",
    title: "Bond Duration, Convexity, and Yield Curve Sensitivity (Python)",
    tag: "fixed income",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class Bond:
    face:       float = 1000.0
    coupon_rate:float = 0.05    # annual
    n_periods:  int   = 10      # semi-annual
    ytm:        float = 0.04    # annual yield

def bond_price(b: Bond, ytm: float) -> float:
    """Semi-annual compounding bond price."""
    c   = b.face * b.coupon_rate / 2.0
    y2  = ytm / 2.0
    df  = 1 / (1 + y2)
    pv  = 0.0
    dfn = df
    for t in range(1, b.n_periods + 1):
        cf   = c + b.face if t == b.n_periods else c
        pv  += cf * dfn
        dfn *= df
    return pv

def duration_convexity(b: Bond) -> dict:
    """Macaulay duration, modified duration, DV01, and convexity."""
    P    = bond_price(b, b.ytm)
    y2   = b.ytm / 2.0
    df   = 1 / (1 + y2)
    c    = b.face * b.coupon_rate / 2.0

    mac_d = 0.0    # Macaulay duration (years)
    conv  = 0.0    # convexity (analytic)
    dfn   = df
    for t in range(1, b.n_periods + 1):
        cf      = c + b.face if t == b.n_periods else c
        t_yr    = t / 2.0
        pv_cf   = cf * dfn
        mac_d  += t_yr * pv_cf / P
        # Convexity: sum of t*(t+1) * pv_cf / (1+y2)^2 / P / 4
        conv   += t_yr * (t_yr + 0.5) * pv_cf
        dfn    *= df

    conv  = conv / (P * (1 + y2)**2)
    mod_d = mac_d / (1 + y2)
    dv01  = mod_d * P / 10_000            # $ change per 1bp per $face
    return {"price": P, "mac_dur": mac_d, "mod_dur": mod_d,
            "dv01": dv01, "convexity": conv}

def price_change_approx(b: Bond, dy: float) -> dict:
    """P&L approximation via Taylor expansion to second order."""
    r = duration_convexity(b)
    P = r["price"]
    dP_dur  = -r["mod_dur"] * P * dy
    dP_conv = 0.5 * r["convexity"] * P * dy**2
    actual  = bond_price(b, b.ytm + dy) - P
    return {"duration_approx": dP_dur,
            "convexity_correction": dP_conv,
            "total_approx": dP_dur + dP_conv,
            "actual": actual,
            "error": abs(actual - dP_dur - dP_conv)}

b = Bond()
res = duration_convexity(b)
for k, v in res.items():
    print(f"  {k}: {round(v, 4)}")

# Scenario: -100bp parallel shift
sc = price_change_approx(b, dy=-0.01)
for k, v in sc.items():
    print(f"  {k}: {round(v, 4)}")`,
    explanation: "The convexity correction is always positive and grows with yield-move squared, explaining why long-duration bonds outperform their duration estimate in a rally (positive convexity); callable bonds and mortgage-backed securities have negative convexity, meaning they underperform the linear approximation when rates fall, because the issuer exercises the embedded call option.",
  },
  {
    id: "pyfin-20260629-b1-vwap-execution",
    language: "python",
    title: "VWAP Execution Simulator with Slippage and Market Impact",
    tag: "execution",
    code: `import numpy as np
import pandas as pd

def simulate_vwap_execution(order_qty: int,
                             intraday_prices: np.ndarray,
                             intraday_volumes: np.ndarray,
                             eta: float = 0.1,
                             seed: int = 42) -> dict:
    """
    Simulate VWAP execution: distribute order proportionally to expected volume.
    Track slippage vs arrival price and market impact.

    eta: temporary market impact coefficient (linear impact model).
    Execution shortfall = arrival_price - avg_fill_price (for buys).
    """
    rng        = np.random.default_rng(seed)
    n_periods  = len(intraday_prices)
    arr_price  = intraday_prices[0]         # arrival (first-period) price

    # VWAP schedule: target qty_t proportional to volume_t
    total_vol  = intraday_volumes.sum()
    target_qty = (intraday_volumes / total_vol * order_qty).round().astype(int)
    # Adjust last period for integer rounding
    target_qty[-1] += order_qty - target_qty.sum()

    fills = []
    for t in range(n_periods):
        q_t    = target_qty[t]
        if q_t == 0: continue
        # Market impact raises price for buys
        impact = eta * q_t / intraday_volumes[t]  # temporary impact
        noise  = rng.normal(0, 0.001)             # bid-ask bounce
        fill_px= intraday_prices[t] * (1 + impact + noise)
        fills.append({'qty': q_t, 'price': fill_px, 'time': t})

    fill_arr   = pd.DataFrame(fills)
    avg_fill   = np.average(fill_arr['price'], weights=fill_arr['qty'])

    # VWAP benchmark: market's volume-weighted average price
    mkt_vwap   = np.average(intraday_prices, weights=intraday_volumes)

    # Execution shortfall (positive = we paid more than arrival price)
    shortfall_bps = (avg_fill - arr_price) / arr_price * 10_000

    return {
        "avg_fill":          round(avg_fill, 4),
        "market_vwap":       round(mkt_vwap, 4),
        "arrival_price":     round(arr_price, 4),
        "shortfall_bps":     round(shortfall_bps, 2),
        "vwap_slippage_bps": round((avg_fill - mkt_vwap) / mkt_vwap * 10_000, 2),
        "n_fills":           len(fills),
    }

# Simulate intraday U-shaped volume (higher at open and close)
rng     = np.random.default_rng(0)
n       = 78                                          # 5-min bars in 6.5hr day
t_seq   = np.linspace(0, 1, n)
vol_shape = 2 - np.sin(np.pi * t_seq)               # U-shape
vols    = (vol_shape / vol_shape.sum() * 1_000_000).astype(int) + 1  # 1M shares/day
prices  = 100 * np.cumprod(1 + rng.normal(0, 0.001, n))

result  = simulate_vwap_execution(50_000, prices, vols, eta=0.1)
for k, v in result.items():
    print(f"  {k}: {v}")`,
    explanation: "VWAP execution minimises timing risk by proportionally distributing the order across expected volume; the shortfall vs arrival price captures both market-impact cost and the drift that occurred between order arrival and execution, with U-shaped volume profiles (high at open and close) meaning VWAP algorithms typically execute aggressively at those times.",
  },
  {
    id: "pyfin-20260629-b1-credit-spread-bootstrap",
    language: "python",
    title: "Z-Spread and Credit Spread Bootstrap from Corporate Bond Yields",
    tag: "credit",
    code: `import numpy as np
from scipy.optimize import brentq
from scipy.interpolate import interp1d

def bootstrap_risk_free(maturities: list, yields: list) -> callable:
    """Simple zero-curve from par yields via bootstrap (semi-annual)."""
    zeros = {}
    for T, y in zip(maturities, yields):
        c     = y / 2.0
        dates = [0.5 * k for k in range(1, int(T * 2) + 1)]
        # Annuity of known discount factors
        pv_known = sum(c * np.exp(-zeros.get(d, y) * d)
                       for d in dates[:-1] if d in zeros)
        # Solve for zero at T: c * exp(-z*T) + exp(-z*T) = 1 - pv_known
        z_T = -np.log((1 - pv_known) / (1 + c)) / T
        zeros[T] = z_T
    ts = [0.0] + sorted(zeros.keys())
    zs = [zeros.get(ts[0], yields[0])] + [zeros[t] for t in ts[1:]]
    return interp1d(ts, zs, kind='linear', fill_value='extrapolate')

def z_spread(bond_cashflows: list, bond_ytm: float,
             rf_zero_fn: callable) -> float:
    """
    Z-spread: constant spread z added to risk-free curve such that
    PV of bond at (rf_zero(t) + z) = dirty price of bond.
    Used to compare corporate bonds of different maturities on a credit basis.
    """
    T    = bond_cashflows[-1][0]       # final maturity
    P_mkt= sum(cf * np.exp(-bond_ytm * t) for t, cf in bond_cashflows)

    def price_at_spread(z):
        return sum(cf * np.exp(-(rf_zero_fn(t) + z) * t)
                   for t, cf in bond_cashflows) - P_mkt

    z = brentq(price_at_spread, -0.20, 1.00, xtol=1e-8)
    return z

# Risk-free zero curve (US Treasuries)
rf_mats  = [0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0]
rf_yields= [0.045, 0.047, 0.048, 0.049, 0.050, 0.051, 0.052]
rf_zero  = bootstrap_risk_free(rf_mats, rf_yields)

# Corporate bond: 5yr, 6% coupon, YTM = 5.8%
T_corp  = 5.0
coupon  = 0.06 / 2                         # semi-annual
cfs     = [(0.5*k, coupon) for k in range(1, 11)]
cfs[-1] = (5.0, coupon + 1.0)             # final period: coupon + principal

zs = z_spread(cfs, 0.058, rf_zero)
print(f"Z-spread: {zs*10000:.1f} bps")    # ~50-100 bps for IG credit
print(f"RF 5y zero: {rf_zero(5.0)*100:.2f}%")
print(f"Corp YTM:   5.80%")
print(f"Simple spread: {(0.058 - rf_zero(5.0))*10000:.1f} bps (approx)")`,
    explanation: "The Z-spread (zero-volatility spread) is superior to the simple yield spread because it accounts for the shape of the risk-free curve across all bond cash flows rather than just comparing two par yields; the OAS (option-adjusted spread) goes further by stripping out the value of embedded options (calls, puts) to isolate pure credit compensation.",
  },
  {
    id: "pyfin-20260629-b1-rolling-correlation",
    language: "python",
    title: "Rolling Correlation Matrix and Correlation Regime Detection",
    tag: "risk",
    code: `import numpy as np
import pandas as pd
from scipy.linalg import eigvalsh

def rolling_correlation(returns: pd.DataFrame, window: int = 60) -> list:
    """
    Compute rolling n x n correlation matrix for all assets.
    Returns list of (date, corr_matrix) tuples.
    """
    results = []
    for i in range(window, len(returns)):
        window_ret = returns.iloc[i - window:i]
        corr       = window_ret.corr().values         # pandas .corr() = Pearson
        results.append((returns.index[i], corr))
    return results

def average_pairwise_correlation(corr_matrix: np.ndarray) -> float:
    """Average of off-diagonal (pairwise) correlations — regime indicator."""
    n    = corr_matrix.shape[0]
    mask = ~np.eye(n, dtype=bool)
    return float(corr_matrix[mask].mean())

def min_eigenvalue(corr_matrix: np.ndarray) -> float:
    """Smallest eigenvalue — near 0 indicates near-singular (instability)."""
    return float(eigvalsh(corr_matrix).min())

def correlation_regime(returns: pd.DataFrame,
                        window: int = 60, stress_threshold: float = 0.6):
    """
    Classify each day as 'stress' or 'normal' based on average correlation.
    High correlation = all assets falling together = crisis regime.
    """
    corr_series = rolling_correlation(returns, window)
    regimes = pd.Series(dtype=str, name='regime')

    for date, C in corr_series:
        avg_corr = average_pairwise_correlation(C)
        regimes[date] = 'stress' if avg_corr > stress_threshold else 'normal'

    avg_corr_ts = pd.Series(
        {d: average_pairwise_correlation(C) for d, C in corr_series},
        name='avg_corr'
    )
    return regimes, avg_corr_ts

# Simulate 3 assets with regime-switching correlation
rng    = np.random.default_rng(42)
n      = 300
dates  = pd.date_range('2023-01-01', periods=n, freq='B')

# Normal regime: low correlation; stress: high correlation
corr_normal = np.array([[1.0, 0.2, 0.1],
                          [0.2, 1.0, 0.3],
                          [0.1, 0.3, 1.0]])
corr_stress = np.array([[1.0, 0.8, 0.7],
                          [0.8, 1.0, 0.85],
                          [0.7, 0.85, 1.0]])

rets = []
for t in range(n):
    C   = corr_stress if 100 <= t < 150 else corr_normal  # 50-day crisis
    L   = np.linalg.cholesky(C)
    rets.append(rng.standard_normal(3) @ L.T * 0.01)

returns = pd.DataFrame(rets, index=dates, columns=['A', 'B', 'C'])
regimes, avg_corr = correlation_regime(returns, window=40)

print(f"Stress days detected: {(regimes == 'stress').sum()}")
print(f"Peak avg correlation: {avg_corr.max():.2f}")
print(f"Normal avg corr:      {avg_corr[regimes == 'normal'].mean():.2f}")`,
    explanation: "Average pairwise correlation is the simplest crisis indicator because correlations converge toward 1 during market selloffs (the 'correlation spike' phenomenon), which destroys the diversification assumptions of normal-regime risk models; minimum eigenvalue close to zero signals near-rank-deficiency, a warning sign that factor exposures are becoming collinear.",
  },
];
