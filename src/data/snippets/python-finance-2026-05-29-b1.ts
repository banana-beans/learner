import type { Snippet } from "./types";

export const pythonFinanceSnippets20260529B1: Snippet[] = [
  {
    id: "pyfin-20260529-b1-cointegration",
    language: "python",
    title: "Engle-Granger cointegration test and hedge ratio estimation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import adfuller, coint
from statsmodels.regression.linear_model import OLS
import statsmodels.api as sm

def engle_granger_coint(y: pd.Series, x: pd.Series, max_lags: int = 5) -> dict:
    """
    Engle-Granger two-step cointegration test:
    Step 1: Regress y on x to estimate the cointegrating vector (hedge ratio).
    Step 2: Apply ADF test to residuals. If residuals are I(0), the pair is cointegrated.

    Returns p-value, hedge ratio beta, and residual (spread) series.
    """
    common = y.index.intersection(x.index)
    y_, x_ = y.loc[common], x.loc[common]

    # Step 1: OLS regression — hedge ratio
    X = sm.add_constant(x_)
    ols = OLS(y_, X).fit()
    beta  = ols.params.iloc[1]   # cointegrating coefficient
    alpha = ols.params.iloc[0]   # intercept

    residuals = y_ - beta * x_ - alpha  # stationary spread if cointegrated

    # Step 2: ADF test on residuals (no constant, residuals already demeaned)
    adf_result = adfuller(residuals.dropna(), maxlag=max_lags, autolag='AIC')
    adf_stat, adf_pval = adf_result[0], adf_result[1]

    # Statsmodels coint() gives Engle-Granger p-value with MacKinnon critical values
    eg_stat, eg_pval, eg_crit = coint(y_, x_, maxlag=max_lags)

    # Half-life of mean reversion: from AR(1) of spread
    lag_spread = residuals.shift(1).dropna()
    d_spread   = residuals.diff().dropna()
    ar_coef    = OLS(d_spread, lag_spread).fit().params.iloc[0]
    half_life  = -np.log(2) / ar_coef if ar_coef < 0 else np.inf

    return {
        'beta':       beta,
        'alpha':      alpha,
        'spread':     residuals,
        'adf_stat':   adf_stat,
        'adf_pval':   adf_pval,
        'eg_pval':    eg_pval,
        'half_life':  half_life,
        'cointegrated': eg_pval < 0.05,
    }

# Demo: simulate cointegrated pair
rng = np.random.default_rng(42)
n = 500
common_factor = np.cumsum(rng.normal(0, 1, n))      # shared random walk
x = common_factor + rng.normal(0, 0.5, n)           # + idiosyncratic noise
y = 1.5 * common_factor + 0.3 + rng.normal(0, 0.5, n)  # beta=1.5, alpha=0.3

dates = pd.date_range('2021-01-01', periods=n, freq='B')
res = engle_granger_coint(pd.Series(y, index=dates), pd.Series(x, index=dates))

print(f"Cointegrated: {res['cointegrated']}  (p={res['eg_pval']:.4f})")
print(f"Estimated beta: {res['beta']:.4f}  (true: 1.5)")
print(f"Half-life: {res['half_life']:.1f} days")
print(f"Spread stats: mean={res['spread'].mean():.3f}  std={res['spread'].std():.3f}")`,
    explanation:
      "Engle-Granger cointegration tests whether two I(1) series share a common stochastic trend: if their linear combination is I(0) (stationary), the pair is cointegrated. The hedge ratio β is estimated by OLS and the residual (the spread) is the mean-reverting signal for pairs trading. The half-life of mean reversion — derived from the AR(1) coefficient of the spread — determines the optimal trading frequency: a 5-day half-life suits daily rebalancing, while a 2-hour half-life requires intraday execution.",
  },

  {
    id: "pyfin-20260529-b1-garch11",
    language: "python",
    title: "GARCH(1,1) volatility — MLE estimation and forecasting from scratch",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def garch11_loglik(params: np.ndarray, returns: np.ndarray) -> float:
    """
    GARCH(1,1): sigma^2_t = omega + alpha * eps_{t-1}^2 + beta * sigma^2_{t-1}
    Negative log-likelihood under Gaussian innovations.
    Stationarity requires: alpha + beta < 1.
    """
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10

    n = len(returns)
    sigma2 = np.empty(n)
    sigma2[0] = np.var(returns)   # initialise with unconditional variance

    for t in range(1, n):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]

    if np.any(sigma2 <= 0):
        return 1e10

    # Gaussian log-likelihood: sum_t [-0.5*log(2pi) - 0.5*log(sigma2_t) - 0.5*r_t^2/sigma2_t]
    ll = -0.5 * np.sum(np.log(2 * np.pi) + np.log(sigma2) + returns**2 / sigma2)
    return -ll   # return negative for minimisation

def fit_garch11(returns: np.ndarray) -> dict:
    """Fit GARCH(1,1) via MLE with multiple random restarts."""
    rng = np.random.default_rng(42)
    best_nll, best_params = np.inf, None

    # Heuristic starting point: omega = var*(1-alpha-beta), small alpha, beta
    var0 = np.var(returns)
    for _ in range(10):
        alpha0 = rng.uniform(0.05, 0.15)
        beta0  = rng.uniform(0.70, 0.90)
        omega0 = var0 * (1 - alpha0 - beta0)
        x0 = [omega0, alpha0, beta0]

        res = minimize(garch11_loglik, x0, args=(returns,),
                       method='L-BFGS-B',
                       bounds=[(1e-8, None), (0, 0.5), (0, 0.999)],
                       options={'ftol': 1e-10, 'maxiter': 1000})
        if res.fun < best_nll:
            best_nll, best_params = res.fun, res.x

    omega, alpha, beta = best_params

    # Reconstruct conditional variance series
    n = len(returns)
    sigma2 = np.empty(n)
    sigma2[0] = omega / (1 - alpha - beta)   # unconditional variance
    for t in range(1, n):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]

    # Multi-step forecast: E[sigma^2_{T+h}] = (omega/(1-alpha-beta)) + (alpha+beta)^h * (sigma^2_T - LR)
    lr_var  = omega / (1 - alpha - beta)
    def forecast(h):
        return lr_var + (alpha + beta)**h * (sigma2[-1] - lr_var)

    return {
        'omega': omega, 'alpha': alpha, 'beta': beta,
        'persistence': alpha + beta,
        'lr_vol': np.sqrt(lr_var) * np.sqrt(252),   # annualised long-run vol
        'sigma2': sigma2,
        'vol':    np.sqrt(sigma2 * 252),             # annualised conditional vol
        'forecast_1d': np.sqrt(forecast(1) * 252),
        'forecast_5d': np.sqrt(forecast(5) * 252),
    }

# Simulate GARCH(1,1) and recover parameters
rng = np.random.default_rng(42)
n = 2000
omega_true, alpha_true, beta_true = 1e-5, 0.10, 0.85
r = np.zeros(n)
s2 = np.full(n, omega_true / (1 - alpha_true - beta_true))
for t in range(1, n):
    s2[t] = omega_true + alpha_true * r[t-1]**2 + beta_true * s2[t-1]
    r[t]  = np.sqrt(s2[t]) * rng.standard_normal()

res = fit_garch11(r)
print(f"True:      omega={omega_true:.2e}  alpha={alpha_true:.3f}  beta={beta_true:.3f}")
print(f"Estimated: omega={res['omega']:.2e}  alpha={res['alpha']:.3f}  beta={res['beta']:.3f}")
print(f"Persistence: {res['persistence']:.4f}  LR vol: {res['lr_vol']*100:.2f}%")
print(f"1-day forecast vol: {res['forecast_1d']*100:.2f}%")`,
    explanation:
      "GARCH(1,1) is the workhorse model for volatility clustering: the persistence parameter α+β (typically 0.93–0.99 for equity daily returns) measures how slowly volatility decays to its long-run level. The MLE implementation from scratch exposes the core Gaussian log-likelihood; in practice, use the `arch` Python library for Student-t innovations, GJR-GARCH (asymmetric response to negative shocks), and EGARCH. The multi-step variance forecast's mean reversion toward the long-run variance is the GARCH equivalent of the Hull-White mean-reversion formula.",
  },

  {
    id: "pyfin-20260529-b1-black-cap",
    language: "python",
    title: "Black's model for interest rate caps and floors",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def black_caplet(F: float, K: float, sigma: float, T: float,
                  df: float, tau: float, is_cap: bool = True) -> float:
    """
    Black's model for a single caplet/floorlet.
    F:   LIBOR / forward rate for the accrual period
    K:   cap/floor strike rate
    sigma: log-normal volatility of F
    T:   option expiry (fixing date of the rate)
    df:  discount factor to payment date (T + tau)
    tau: accrual period length (e.g. 0.25 for 3M)
    """
    if sigma < 1e-9 or T < 1e-9:
        return df * tau * max(F - K, 0) if is_cap else df * tau * max(K - F, 0)

    d1 = (np.log(F / K) + 0.5 * sigma**2 * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)

    if is_cap:
        return df * tau * (F * norm.cdf(d1) - K * norm.cdf(d2))
    else:
        return df * tau * (K * norm.cdf(-d2) - F * norm.cdf(-d1))


def price_cap(strike: float, sigmas: np.ndarray,
              forwards: np.ndarray, disc_factors: np.ndarray,
              tau: float = 0.25, is_cap: bool = True) -> dict:
    """
    Price an interest rate cap as a portfolio of caplets.
    Caplet i covers period [T_i, T_i + tau] with:
      - Forward rate F_i for the accrual period
      - Flat vol sigma_i (vol quotes from the cap vol surface)
      - Discount factor df_i to the payment date T_i + tau

    Returns total cap price, per-caplet prices, and DV01.
    """
    n = len(forwards)
    caplet_prices = np.array([
        black_caplet(forwards[i], strike, sigmas[i],
                     (i + 1) * tau,          # expiry of caplet i
                     disc_factors[i], tau, is_cap)
        for i in range(n)
    ])

    total = caplet_prices.sum()

    # DV01: price change for 1bp parallel shift in all forward rates
    shifted = np.array([
        black_caplet(forwards[i] + 0.0001, strike, sigmas[i],
                     (i + 1) * tau, disc_factors[i], tau, is_cap)
        for i in range(n)
    ])
    dv01 = (shifted - caplet_prices).sum()

    return {'total': total, 'caplets': caplet_prices, 'dv01': dv01}


# 5Y cap: quarterly caplets, flat 5% curve, 20% flat vol
n_caplets = 20       # 5Y / 0.25Y per caplet
tau       = 0.25
T_pay     = np.arange(1, n_caplets + 1) * tau   # payment dates: 0.25, 0.5, ..., 5.0

r = 0.05             # flat risk-free rate
forwards  = np.full(n_caplets, r)               # flat forward curve
dfs       = np.exp(-r * T_pay)                  # discount to payment date
sigmas    = np.full(n_caplets, 0.20)            # flat caplet vol (20%)

result = price_cap(strike=0.05, sigmas=sigmas, forwards=forwards,
                    disc_factors=dfs, tau=tau, is_cap=True)

print(f"5Y ATM Cap price:  {result['total']:.6f}  ({result['total']*100:.3f}% of notional)")
print(f"DV01:              {result['dv01']*10000:.4f}  (per $1 notional per 1bp)")
print(f"Caplet 1Y value:   {result['caplets'][3]:.6f}")
print(f"Caplet 5Y value:   {result['caplets'][-1]:.6f}")`,
    explanation:
      "Black's model for caps treats each caplet as a European option on the LIBOR / forward rate. The ATM cap price increases with maturity because more caplets contribute; longer caplets also have higher Black's vol (the vol term structure). The cap DV01 measures the dollar sensitivity to a 1bp parallel shift in all forward rates — critical for hedging the cap portfolio with interest rate swaps. Note that Black's model assumes log-normal rates, making it inapplicable for negative rates (use Bachelier's normal model instead).",
  },

  {
    id: "pyfin-20260529-b1-xsec-momentum",
    language: "python",
    title: "Cross-sectional momentum factor — 12-1 month formation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def xsec_momentum_factor(prices: pd.DataFrame,
                           formation_end: int = 1,
                           formation_start: int = 12,
                           holding_period: int = 1,
                           n_quantiles: int = 5,
                           transaction_cost_bps: float = 10.0) -> pd.DataFrame:
    """
    Cross-sectional momentum (Jegadeesh-Titman 1993):
    - Formation: cumulative return over [t-12, t-1] months (skip most recent month).
    - Ranking: sort all stocks by formation return into n_quantiles.
    - Portfolio: long top decile (winners), short bottom decile (losers).
    - Hold for 1 month, then rebalance.

    prices: DataFrame of adjusted close prices (rows=dates, cols=tickers)
    Returns DataFrame of factor returns: columns=[Q1..Qn, WML, WML_net]
    """
    # Monthly returns
    monthly = prices.resample('ME').last().pct_change()

    results = []
    for i in range(formation_start, len(monthly) - holding_period):
        # Formation period: months [-12, -1] from current month
        formation = monthly.iloc[i - formation_start : i - formation_end + 1]
        cum_ret   = (1 + formation).prod() - 1   # cumulative formation return

        # Ranking (handle NaNs by dropping)
        valid = cum_ret.dropna()
        if len(valid) < n_quantiles * 2:
            continue

        labels = pd.qcut(valid, n_quantiles, labels=False)   # 0=loser, 4=winner

        # Equal-weight portfolio returns in holding period
        hold_ret = monthly.iloc[i : i + holding_period].mean()  # average monthly return
        hold_ret = hold_ret.reindex(valid.index)

        quant_rets = {}
        for q in range(n_quantiles):
            mask = labels == q
            quant_rets[f'Q{q+1}'] = hold_ret[mask].mean()

        wml = quant_rets[f'Q{n_quantiles}'] - quant_rets['Q1']  # winners minus losers

        # Net WML after transaction costs (round-trip = 2 * cost on both legs)
        tc = 2 * transaction_cost_bps / 10000
        wml_net = wml - tc

        results.append({
            'date': monthly.index[i],
            **quant_rets,
            'WML':     wml,
            'WML_net': wml_net,
        })

    factor_df = pd.DataFrame(results).set_index('date')
    return factor_df


def momentum_stats(factor_df: pd.DataFrame) -> pd.DataFrame:
    """Annualised return, Sharpe, max drawdown per quantile."""
    stats = {}
    for col in factor_df.columns:
        r = factor_df[col].dropna()
        ann_ret   = r.mean() * 12
        ann_vol   = r.std() * np.sqrt(12)
        sharpe    = ann_ret / ann_vol if ann_vol > 0 else 0.0
        cum       = (1 + r).cumprod()
        drawdown  = (cum / cum.cummax() - 1).min()
        stats[col] = {'ann_ret': ann_ret, 'ann_vol': ann_vol,
                      'sharpe': sharpe, 'max_dd': drawdown}
    return pd.DataFrame(stats).T

# Demo with synthetic prices
rng = np.random.default_rng(42)
n_stocks, n_months = 100, 120
dates = pd.date_range('2014-01-01', periods=n_months, freq='ME')
# Generate cross-sectional return dispersion
common = rng.normal(0.008, 0.04, n_months)
prices = pd.DataFrame(
    np.exp(np.cumsum(common[:,None] + rng.normal(0, 0.05, (n_months, n_stocks)), axis=0)) * 100,
    index=dates, columns=[f'STK{i:03d}' for i in range(n_stocks)]
)

factor = xsec_momentum_factor(prices, n_quantiles=5)
stats  = momentum_stats(factor)
print(stats[['ann_ret','ann_vol','sharpe','max_dd']].round(3).to_string())`,
    explanation:
      "Cross-sectional momentum ranks stocks by their 12-1 month return and goes long winners/short losers — one of the most robust anomalies in academic finance, persisting across markets and asset classes. The 1-month skip prevents the reversal effect from microstructure friction. The key risk is momentum crashes: during sharp market recoveries (March 2020, April 2009), losers rebound violently and the WML factor suffers severe drawdowns, which is why practitioners cap individual stock weights and add a volatility overlay.",
  },

  {
    id: "pyfin-20260529-b1-crr-american",
    language: "python",
    title: "CRR binomial tree — American put with early exercise optimal boundary",
    tag: "finance",
    code: `import numpy as np
from typing import Optional

def crr_american_put(S0: float, K: float, r: float, sigma: float,
                      T: float, N: int = 500,
                      q: float = 0.0) -> dict:
    """
    Cox-Ross-Rubinstein (1979) binomial tree for American put pricing.
    At each node: hold value = discounted expected value; exercise = K - S.
    American price = max(hold, exercise) at each node.
    Returns price, delta, gamma, theta, and the early-exercise boundary.

    u = exp(sigma*sqrt(dt)), d = 1/u
    p = (exp((r-q)*dt) - d) / (u - d)  [risk-neutral probability of up move]
    """
    dt   = T / N
    u    = np.exp(sigma * np.sqrt(dt))
    d    = 1.0 / u
    disc = np.exp(-r * dt)
    p    = (np.exp((r - q) * dt) - d) / (u - d)

    # Terminal stock prices: S[i] = S0 * u^(N-i) * d^i
    S_T = S0 * u ** (N - np.arange(N + 1)) * d ** np.arange(N + 1)
    V   = np.maximum(K - S_T, 0.0)   # put payoff at expiry

    # Track early-exercise boundary (lowest S where it's optimal to wait)
    exercise_boundary = []

    # Backward induction
    for step in range(N - 1, -1, -1):
        S_step = S0 * u ** (step - np.arange(step + 1)) * d ** np.arange(step + 1)
        V = disc * (p * V[:step+1] + (1.0 - p) * V[1:step+2])   # continuation
        exercise = np.maximum(K - S_step, 0.0)
        early    = exercise > V
        V        = np.where(early, exercise, V)

        # Boundary: critical S for this step (first node where early exercise is optimal)
        if np.any(early):
            boundary_S = S_step[np.where(early)[0][-1]]   # highest S with exercise
            exercise_boundary.append((step * dt, boundary_S))

    # Greeks from root neighbourhood (steps 1 and 2)
    dt_ = T / N
    u2, d2 = np.exp(sigma * np.sqrt(dt_)), np.exp(-sigma * np.sqrt(dt_))

    S_uu = S0 * u**2
    S_ud = S0
    S_dd = S0 * d**2
    V_uu = max(K - S_uu, 0); V_dd = max(K - S_dd, 0)

    # Re-run 2 steps for delta/gamma
    V2_step = crr_american_put(S0, K, r, sigma, T, N=2)['price']
    V2_u    = crr_american_put(S0 * u, K, r, sigma, T - dt, N=max(N-1,2))['price']
    V2_d    = crr_american_put(S0 * d, K, r, sigma, T - dt, N=max(N-1,2))['price']

    delta = (V2_u - V2_d) / (S0 * u - S0 * d)
    gamma = ((V2_u - V[0]) / (S0 * u - S0) - (V[0] - V2_d) / (S0 - S0 * d)) \
            / (0.5 * (S0 * u - S0 * d))
    theta = (crr_american_put(S0, K, r, sigma, T - 2*dt, N=max(N-2,2))['price'] - V[0]) \
            / (2 * dt)

    return {
        'price': V[0],
        'delta': delta,
        'gamma': gamma,
        'theta': theta / 365.0,   # per calendar day
        'exercise_boundary': list(reversed(exercise_boundary)),
    }

# Compare European (no early exercise) vs American put
from scipy.stats import norm

def bs_european_put(S, K, r, sigma, T, q=0.0):
    d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return K*np.exp(-r*T)*norm.cdf(-d2) - S*np.exp(-q*T)*norm.cdf(-d1)

S, K, r, sigma, T = 100.0, 100.0, 0.05, 0.25, 1.0
am   = crr_american_put(S, K, r, sigma, T, N=300)
eu   = bs_european_put(S, K, r, sigma, T)
print(f"European put (BS):  {eu:.4f}")
print(f"American put (CRR): {am['price']:.4f}  (early-exercise premium: {am['price']-eu:.4f})")
print(f"Delta: {am['delta']:.4f}  Gamma: {am['gamma']:.4f}  Theta: {am['theta']:.4f}/day")`,
    explanation:
      "The early-exercise premium for an American put is positive only for in-the-money options with high interest rates relative to dividends: the incentive is to collect K now versus waiting for a possibly lower S later. The CRR tree converges at O(1/N) speed, so N=300–500 steps typically gives 3–4 significant figures. The exercise boundary — the critical spot below which immediate exercise is optimal — starts at S* = K·r/(r + h) for perpetual puts and converges to K at expiry, tracing a monotonically increasing curve.",
  },

  {
    id: "pyfin-20260529-b1-heston-cos",
    language: "python",
    title: "Heston model — COS method for fast European option pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def heston_cf(u: complex, S0: float, K: float, r: float, T: float,
               kappa: float, theta: float, xi: float,
               rho: float, v0: float) -> complex:
    """
    Heston (1993) characteristic function of log(S_T) under the risk-neutral measure.
    Uses the numerically stable 'little Heston trap' formulation (Albrecher et al. 2007)
    to avoid the branch-cut discontinuity in the original Heston formula.
    """
    i = complex(0, 1)
    lnS = np.log(S0)

    # Little Heston trap: switch u -> u - i instead of separate risk-neutral adjustment
    d = np.sqrt((rho * xi * i * u - kappa)**2 + xi**2 * (i * u + u**2))
    g = (kappa - rho * xi * i * u - d) / (kappa - rho * xi * i * u + d)

    C = (kappa * T * (kappa - rho * xi * i * u - d) / xi**2
         - 2.0 * np.log((1.0 - g * np.exp(-d * T)) / (1.0 - g)))
    D = (kappa - rho * xi * i * u - d) / xi**2 \
        * (1.0 - np.exp(-d * T)) / (1.0 - g * np.exp(-d * T))

    return np.exp(i * u * (lnS + r * T) + kappa * theta * C + v0 * D)


def heston_cos(S0: float, K: float, r: float, T: float,
                kappa: float, theta: float, xi: float,
                rho: float, v0: float,
                N: int = 128, L: float = 12.0) -> float:
    """
    COS (Fourier cosine series) method — Fang-Oosterlee (2008).
    Approximates the density via cosine expansion of the characteristic function.
    N terms suffice for most option types; L controls the truncation interval.
    Complexity: O(N) CF evaluations vs O(N log N) for standard FFT.
    """
    k = np.log(K / S0)
    a, b = k - L * np.sqrt(T), k + L * np.sqrt(T)  # truncation interval for log-return

    ns  = np.arange(0, N)
    phi = np.array([heston_cf(ns[j] * np.pi / (b - a), S0, K, r, T,
                               kappa, theta, xi, rho, v0)
                    for j in range(N)])

    # Cosine coefficients for the truncated payoff (call = max(S-K, 0))
    # Chi_n and Psi_n integrals for the truncated call payoff
    def chi(n, c, d):
        """Int_c^d exp(x) cos(n*pi*(x-a)/(b-a)) dx"""
        npib = n * np.pi / (b - a)
        return (np.exp(d) * (np.cos(npib * (d - a)) + npib * np.sin(npib * (d - a)))
              - np.exp(c) * (np.cos(npib * (c - a)) + npib * np.sin(npib * (c - a)))) \
               / (1.0 + npib**2)

    def psi(n, c, d):
        """Int_c^d cos(n*pi*(x-a)/(b-a)) dx"""
        npib = n * np.pi / (b - a)
        if abs(npib) < 1e-10:
            return d - c
        return (np.sin(npib * (d - a)) - np.sin(npib * (c - a))) / npib

    # V_n: Fourier cosine coefficient of the call payoff in log-return space
    V = (2.0 / (b - a)) * K * (chi(ns, 0.0, b) - psi(ns, 0.0, b))
    V[0] *= 0.5    # half-weight for the n=0 term

    # Option price: Re[sum_n V_n * phi_n * exp(in*pi*(k-a)/(b-a))]
    cos_terms = np.exp(complex(0,1) * ns * np.pi * (k - a) / (b - a))
    price = np.exp(-r * T) * np.real(np.sum(phi * V * cos_terms))
    return max(price, 0.0)


# Validate against Heston MC (from prior batch)
S0, K, r, T = 100.0, 100.0, 0.05, 1.0
kappa, theta, xi, rho, v0 = 2.0, 0.04, 0.5, -0.7, 0.04

call_cos = heston_cos(S0, K, r, T, kappa, theta, xi, rho, v0, N=128)
call_bs  = S0 * norm.cdf(0.401) - K * np.exp(-r*T) * norm.cdf(0.201)  # approx BS
print(f"Heston COS call: {call_cos:.6f}")
print(f"BS ATM approx:   {call_bs:.6f}  (different: Heston smile raises price)")`,
    explanation:
      "The COS method exploits that both the characteristic function and the cosine basis functions are analytically tractable, reducing option pricing to N inner products. It converges exponentially in N for smooth payoffs — 64–128 terms typically gives machine precision for European options. The 'little Heston trap' formulation fixes the branch-cut discontinuity in the original formula that caused errors for long-dated options with high parameters. COS is 5–10x faster than equivalent-accuracy FFT because it avoids the zero-padding required to prevent aliasing.",
  },

  {
    id: "pyfin-20260529-b1-importance-sampling",
    language: "python",
    title: "Importance sampling — deep OTM option variance reduction",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def is_otm_call(S0: float, K: float, r: float, sigma: float, T: float,
                 n_paths: int = 100_000, seed: int = 42) -> dict:
    """
    Importance sampling for deep OTM call options.
    Standard MC: very few paths end above K → high variance, slow convergence.
    IS approach: shift the sampling distribution toward the exercise region.
    For GBM, shift the normal distribution mean by theta* (the optimal tilting parameter).

    Exponential tilting: sample Z* ~ N(mu*, 1) instead of N(0,1).
    Likelihood ratio: dQ/dP = exp(-theta*Z* + 0.5*theta^2)
    Optimal theta* chosen to place the mean of log(S_T) exactly at log(K).
    """
    rng = np.random.default_rng(seed)
    lnK = np.log(K / S0)
    mu  = (r - 0.5 * sigma**2) * T          # log-drift
    s   = sigma * np.sqrt(T)                 # log-diffusion

    # Standard MC
    Z    = rng.standard_normal(n_paths)
    S_T  = S0 * np.exp(mu + s * Z)
    pay_std = np.maximum(S_T - K, 0.0)
    disc = np.exp(-r * T)
    std_price  = disc * pay_std.mean()
    std_se     = disc * pay_std.std() / np.sqrt(n_paths)

    # Importance sampling: shift Z by theta* so E[log S_T] = log K
    # log(S_T) = log(S0) + mu + s*Z  → shift Z by (lnK - mu) / s
    theta_star = (lnK - mu) / s   # positive for OTM (K > S0 * exp(mu))

    Z_star  = rng.standard_normal(n_paths) + theta_star   # shifted sampling
    S_T_is  = S0 * np.exp(mu + s * Z_star)
    pay_is  = np.maximum(S_T_is - K, 0.0)

    # Likelihood ratio (Radon-Nikodym derivative)
    LR = np.exp(-theta_star * Z_star + 0.5 * theta_star**2)

    weighted_pay = pay_is * LR
    is_price     = disc * weighted_pay.mean()
    is_se        = disc * weighted_pay.std() / np.sqrt(n_paths)

    # Black-Scholes benchmark
    d1 = (np.log(S0/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    bs_price = disc * (S0 * np.exp(r*T) * norm.cdf(d1) - K * norm.cdf(d2))
    # Actually for call: S0*N(d1) - K*exp(-rT)*N(d2)
    bs_price = S0 * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d2)

    # Variance reduction factor
    vrf = (std_se / is_se)**2 if is_se > 0 else np.inf

    return {
        'std_price': std_price, 'std_se': std_se,
        'is_price':  is_price,  'is_se':  is_se,
        'bs_price':  bs_price,
        'vrf':       vrf,   # how many fewer IS paths needed for same accuracy
        'theta_star': theta_star,
    }


# Deep OTM: S=100, K=150, sigma=20%, T=1Y (only ~0.5% chance of expiry ITM)
for moneyness in [1.2, 1.5, 2.0]:
    K = 100.0 * moneyness
    res = is_otm_call(100.0, K, 0.05, 0.20, 1.0, n_paths=50_000)
    print(f"K={K:.0f}  BS={res['bs_price']:.6f}  "
          f"Std SE={res['std_se']:.2e}  IS SE={res['is_se']:.2e}  "
          f"VRF={res['vrf']:.0f}x")`,
    explanation:
      "Importance sampling shifts the sampling distribution toward the rare event (S_T > K) by tilting the measure by e^(θ·Z). The optimal tilt θ* minimises estimator variance by concentrating samples in the region that contributes most to the payoff. For a deep 2x OTM call (K=200), standard MC might require 10M paths to achieve 1% accuracy; IS achieves the same with ~50k paths — a 200x speedup. The likelihood ratio ensures the estimator is unbiased despite sampling from a different distribution.",
  },

  {
    id: "pyfin-20260529-b1-bhb-attribution",
    language: "python",
    title: "Brinson-Hood-Beebower (BHB) performance attribution",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def bhb_attribution(portfolio_weights: pd.Series,
                     benchmark_weights: pd.Series,
                     portfolio_returns: pd.Series,
                     benchmark_returns: pd.Series) -> pd.DataFrame:
    """
    Brinson-Hood-Beebower (1986) attribution decomposes active return into:
    1. Allocation effect:   (w_p - w_b) * (r_b - r_b_total)
       Skill in over/under-weighting sectors relative to benchmark.
    2. Selection effect:    w_b * (r_p - r_b)
       Skill in picking outperforming stocks within each sector.
    3. Interaction effect:  (w_p - w_b) * (r_p - r_b)
       Joint effect of over/under-weighting AND outperforming.

    Sum of all three = active return = portfolio_return - benchmark_return.

    Inputs are sector-level weights and returns (single period).
    """
    # Align indices
    sectors = portfolio_weights.index.union(benchmark_weights.index)
    wp = portfolio_weights.reindex(sectors, fill_value=0.0)
    wb = benchmark_weights.reindex(sectors, fill_value=0.0)
    rp = portfolio_returns.reindex(sectors, fill_value=0.0)
    rb = benchmark_returns.reindex(sectors, fill_value=0.0)

    # Benchmark total return
    rb_total = (wb * rb).sum()
    rp_total = (wp * rp).sum()

    # BHB attribution effects
    allocation  = (wp - wb) * (rb - rb_total)        # sector over/under-weight
    selection   = wb * (rp - rb)                      # stock selection within sector
    interaction = (wp - wb) * (rp - rb)               # joint effect

    active_return = rp_total - rb_total

    result = pd.DataFrame({
        'weight_portfolio':  wp,
        'weight_benchmark':  wb,
        'weight_active':     wp - wb,
        'return_portfolio':  rp,
        'return_benchmark':  rb,
        'return_active':     rp - rb,
        'allocation':        allocation,
        'selection':         selection,
        'interaction':       interaction,
        'total_effect':      allocation + selection + interaction,
    })

    total_row = result[['allocation','selection','interaction','total_effect']].sum()
    total_row.name = 'TOTAL'

    return result, {
        'portfolio_return': rp_total,
        'benchmark_return': rb_total,
        'active_return':    active_return,
        'allocation_total': allocation.sum(),
        'selection_total':  selection.sum(),
        'interaction_total':interaction.sum(),
        'check':            (allocation + selection + interaction).sum() - active_return,
    }

# Example: 5-sector attribution
sectors = ['Tech', 'Financials', 'Healthcare', 'Energy', 'Consumer']
wb = pd.Series([0.30, 0.20, 0.15, 0.10, 0.25], index=sectors)
wp = pd.Series([0.40, 0.15, 0.20, 0.05, 0.20], index=sectors)   # overweight tech, healthcare
rb = pd.Series([0.08, 0.05, 0.06, -0.02, 0.04], index=sectors)  # benchmark sector returns
rp = pd.Series([0.10, 0.04, 0.09, -0.01, 0.03], index=sectors)  # portfolio sector returns

table, summary = bhb_attribution(wp, wb, rp, rb)
print(f"Portfolio return:  {summary['portfolio_return']*100:.2f}%")
print(f"Benchmark return:  {summary['benchmark_return']*100:.2f}%")
print(f"Active return:     {summary['active_return']*100:.2f}%")
print(f"  - Allocation:    {summary['allocation_total']*100:.2f}%")
print(f"  - Selection:     {summary['selection_total']*100:.2f}%")
print(f"  - Interaction:   {summary['interaction_total']*100:.2f}%")
print(f"  - Check (=0):    {summary['check']*100:.4f}%")`,
    explanation:
      "BHB decomposition shows exactly why a portfolio outperformed or underperformed the benchmark. The allocation effect isolates the sector-weighting decision; selection isolates stock-picking within sectors. The interaction term captures the joint skill of overweighting a sector where you also picked better stocks — often attributed to selection in practice (Menchero modification). The check equation confirms the three effects sum exactly to the active return — a useful sanity test for implementation correctness.",
  },

  {
    id: "pyfin-20260529-b1-cvar-optim",
    language: "python",
    title: "CVaR portfolio optimization — Rockafellar-Uryasev linear program",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

def cvar_optimize(returns: np.ndarray, alpha: float = 0.95,
                   mu_target: float = None,
                   long_only: bool = True) -> dict:
    """
    Minimize CVaR (Conditional Value at Risk / Expected Shortfall) at confidence alpha.

    Rockafellar-Uryasev (2000) linearisation:
    CVaR_alpha = min_{eta} { eta + (1/(1-alpha)) * E[max(-r - eta, 0)] }
    This is a linear program in (w, eta, z) where z_i = max(-r_i^T w - eta, 0).

    Minimize: eta + (1/(S*(1-alpha))) * sum(z)
    subject to:
      z_i >= -r_i^T w - eta  (z_i = [loss_i - eta]^+)
      z_i >= 0
      sum(w) = 1
      w >= 0              (if long_only)
      mu^T w >= mu_target (optional return constraint)

    returns: (S scenarios, N assets) matrix of return scenarios
    alpha:   confidence level (e.g. 0.95)
    """
    S, N = returns.shape
    w    = cp.Variable(N, name='weights')
    eta  = cp.Variable(name='VaR')          # Value-at-Risk at level alpha
    z    = cp.Variable(S, name='excess_loss', nonneg=True)  # [loss - eta]^+

    # Portfolio loss per scenario (negative of return)
    losses = -returns @ w   # (S,)

    # CVaR = eta + E[max(loss - eta, 0)] / (1-alpha)
    cvar = eta + cp.sum(z) / (S * (1 - alpha))

    constraints = [
        z >= losses - eta,           # z_i >= [loss_i - eta]
        cp.sum(w) == 1.0,            # fully invested
    ]
    if long_only:
        constraints.append(w >= 0)

    if mu_target is not None:
        mu = returns.mean(axis=0)
        constraints.append(mu @ w >= mu_target)

    prob = cp.Problem(cp.Minimize(cvar), constraints)
    prob.solve(solver=cp.CLARABEL, verbose=False)

    if prob.status not in ('optimal', 'optimal_inaccurate'):
        return {'status': prob.status}

    w_opt = np.array(w.value)
    port_returns = returns @ w_opt

    return {
        'status':   prob.status,
        'weights':  w_opt,
        'cvar':     float(prob.value),
        'var':      float(eta.value),
        'port_ret': port_returns.mean(),
        'port_std': port_returns.std(),
        'sharpe':   port_returns.mean() / port_returns.std() * np.sqrt(252),
        'cvar_pct': float(prob.value) * 100,
    }

# Simulate 3-asset universe: 1000 scenarios from a t-distribution (fat tails)
rng = np.random.default_rng(42)
N, S = 5, 1000
mu_true  = np.array([0.10, 0.07, 0.12, 0.06, 0.09]) / 252
sig_true = np.array([0.20, 0.15, 0.25, 0.10, 0.18]) / np.sqrt(252)
returns  = rng.standard_t(df=5, size=(S, N)) * sig_true + mu_true   # fat tails

# CVaR-efficient frontier
print("CVaR minimization (long-only, various return targets):")
for target_ann in [0.06, 0.08, 0.10]:
    res = cvar_optimize(returns, alpha=0.95, mu_target=target_ann/252, long_only=True)
    if res['status'] == 'optimal':
        print(f"  Target {target_ann*100:.0f}%/yr: CVaR(95%)={res['cvar_pct']:.3f}%/day  "
              f"Sharpe={res['sharpe']:.2f}")`,
    explanation:
      "The Rockafellar-Uryasev reformulation converts CVaR minimization — normally a non-smooth problem — into a linear program by introducing the auxiliary variable η (the VaR) and slack variables z_i. CVaR is a coherent risk measure (satisfies subadditivity, translation invariance, monotonicity, and positive homogeneity) unlike VaR, making it theoretically preferable for portfolio optimization. CVaR-optimal portfolios under fat-tailed scenarios (Student-t) are significantly different from MVO-optimal portfolios because they penalise extreme losses more heavily.",
  },

  {
    id: "pyfin-20260529-b1-hw1f-cap",
    language: "python",
    title: "Hull-White 1-factor caplet pricing — Jamshidian decomposition",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

def hw1f_zcb(t: float, T: float, r_t: float, a: float, sigma: float,
              theta_fn) -> float:
    """
    Hull-White 1-factor: P(t, T) = A(t,T) * exp(-B(t,T)*r_t)
    B(t,T) = (1 - exp(-a*(T-t))) / a
    ln A(t,T) = ln(P_mkt(0,T)/P_mkt(0,t)) + B(t,T)*f(0,t) - sigma^2/(4a)*(1-e^{-2at})*B^2
    For demo: flat 5% curve → P_mkt(0,T) = exp(-0.05*T), f(0,t) = 0.05
    """
    r_mkt = 0.05
    B    = (1.0 - np.exp(-a * (T - t))) / a
    lnA  = (-r_mkt * T + r_mkt * t          # ln(P_mkt(T)/P_mkt(t))
            + B * r_mkt                       # B * f(0,t)
            - sigma**2 / (4*a) * (1 - np.exp(-2*a*t)) * B**2)  # vol adjustment
    return np.exp(lnA - B * r_t)

def hw1f_zbo(t: float, T_bond: float, T_opt: float, K: float,
              r_t: float, a: float, sigma: float) -> dict:
    """
    European option on a zero-coupon bond (Jamshidian 1989).
    Analytic formula under Hull-White 1F:
    V = P(t,T_bond) * N(h) - K * P(t,T_opt) * N(h - sigma_P)
    where:
      sigma_P = sigma/a * sqrt(1-e^{-2a*(T_opt-t)}/2a) * B(T_opt, T_bond)
      h = ln(P(t,T_bond)/(K*P(t,T_opt)))/sigma_P + sigma_P/2
    """
    P_bond = hw1f_zcb(t, T_bond, r_t, a, sigma, None)
    P_opt  = hw1f_zcb(t, T_opt,  r_t, a, sigma, None)
    B_opt_bond = (1.0 - np.exp(-a * (T_bond - T_opt))) / a

    sigma_P = sigma / a * np.sqrt((1.0 - np.exp(-2*a*(T_opt-t))) / (2*a)) * B_opt_bond
    if sigma_P < 1e-10:
        return {'call': max(P_bond - K * P_opt, 0), 'put': max(K*P_opt - P_bond, 0)}

    h = np.log(P_bond / (K * P_opt)) / sigma_P + sigma_P / 2.0
    call = P_bond * norm.cdf(h) - K * P_opt * norm.cdf(h - sigma_P)
    put  = K * P_opt * norm.cdf(-(h - sigma_P)) - P_bond * norm.cdf(-h)
    return {'call': call, 'put': put, 'sigma_P': sigma_P}

def hw1f_caplet(t: float, T_fix: float, T_pay: float, K_rate: float,
                 tau: float, r_t: float, a: float, sigma: float) -> float:
    """
    Caplet = put option on ZCB with:
      Strike on ZCB:   K_zcb = 1 / (1 + K_rate * tau)
      Bond maturity:   T_pay
      Option expiry:   T_fix
    Uses Jamshidian decomposition: caplet = (1 + K*tau) * put(T_fix, T_pay, K_zcb)
    """
    K_zcb = 1.0 / (1.0 + K_rate * tau)
    opt   = hw1f_zbo(t, T_pay, T_fix, K_zcb, r_t, a, sigma)
    return (1.0 + K_rate * tau) * opt['put']

def hw1f_cap(tenor: float, K_rate: float, r0: float,
              a: float = 0.10, sigma: float = 0.015,
              tau: float = 0.25) -> dict:
    """Price a HW1F interest rate cap as sum of caplets."""
    n_caplets = int(tenor / tau)
    T_fixes   = np.arange(1, n_caplets + 1) * tau      # fixing dates
    T_pays    = T_fixes + tau                           # payment dates (1 period later)

    caplets = np.array([
        hw1f_caplet(0.0, T_fixes[i], T_pays[i], K_rate, tau, r0, a, sigma)
        for i in range(n_caplets)
    ])
    return {'total': caplets.sum(), 'caplets': caplets}

r0 = 0.05; a = 0.10; sigma = 0.015
cap3y_atm = hw1f_cap(3.0, K_rate=0.05, r0=r0, a=a, sigma=sigma)
cap5y_atm = hw1f_cap(5.0, K_rate=0.05, r0=r0, a=a, sigma=sigma)
print(f"3Y ATM cap (HW1F): {cap3y_atm['total']*100:.4f}% of notional")
print(f"5Y ATM cap (HW1F): {cap5y_atm['total']*100:.4f}% of notional")`,
    explanation:
      "The Jamshidian (1989) decomposition converts a cap (which is a portfolio of options on coupon rates) into options on zero-coupon bonds using the Hull-White analytic ZCB option formula. The key insight is that under HW1F, a caplet is equivalent to a put on a ZCB with a transformed strike K_zcb = 1/(1 + K·τ). This makes HW1F one of the rare stochastic-rate models with closed-form caplet prices — critical for calibrating the model to market cap quotes efficiently.",
  },

  {
    id: "pyfin-20260529-b1-butterfly-trade",
    language: "python",
    title: "Yield curve butterfly — 2s5s10s curvature trade and carry",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def butterfly_weights(dv01_2y: float, dv01_5y: float, dv01_10y: float,
                       position_type: str = 'long_belly') -> dict:
    """
    Butterfly trade: long the belly (5Y), short wings (2Y and 10Y).
    Weights chosen to be duration-neutral (DV01-neutral on both wings).

    For 'long belly' (profit if yield curve humps / belly rallies relative to wings):
      +w_5 units of 5Y bond
      -w_2 units of 2Y bond   (wing 1)
      -w_10 units of 10Y bond (wing 2)

    DV01-neutrality constraints:
      w_2 * dv01_2y + w_10 * dv01_10y = w_5 * dv01_5y  (overall DV01 = 0)
      w_2 * dv01_2y = w_10 * dv01_10y                   (balanced wings: equal DV01 from each)
    Solving: w_2 = w_5 * dv01_5y / (2 * dv01_2y)
             w_10 = w_5 * dv01_5y / (2 * dv01_10y)
    """
    w5 = 1.0   # normalise to 1 unit belly

    if position_type == 'long_belly':
        w2  = w5 * dv01_5y / (2.0 * dv01_2y)    # short 2Y (short duration = rate up)
        w10 = w5 * dv01_5y / (2.0 * dv01_10y)   # short 10Y
        sign2, sign10 = -1, -1
    else:  # short belly
        w2  = w5 * dv01_5y / (2.0 * dv01_2y)
        w10 = w5 * dv01_5y / (2.0 * dv01_10y)
        sign2, sign10 = +1, +1
        w5 = -w5

    net_dv01 = (w5 * dv01_5y + sign2 * w2 * dv01_2y + sign10 * w10 * dv01_10y)

    return {
        'w_2y': sign2 * w2,
        'w_5y': w5,
        'w_10y': sign10 * w10,
        'dv01_2y': sign2 * w2 * dv01_2y,
        'dv01_5y': w5 * dv01_5y,
        'dv01_10y': sign10 * w10 * dv01_10y,
        'net_dv01': net_dv01,
    }


def butterfly_pnl(weights: dict, delta_yields_bps: dict) -> dict:
    """
    Compute P&L of the butterfly for given yield changes.
    delta_yields_bps: dict with keys '2y', '5y', '10y' (in basis points)
    P&L per leg ≈ -DV01 * delta_yield (in bps)
    """
    pnl_2y  = -weights['dv01_2y']  * delta_yields_bps.get('2y',  0.0)
    pnl_5y  = -weights['dv01_5y']  * delta_yields_bps.get('5y',  0.0)
    pnl_10y = -weights['dv01_10y'] * delta_yields_bps.get('10y', 0.0)
    total   = pnl_2y + pnl_5y + pnl_10y

    # Curvature metric: 2*Y5 - Y2 - Y10 (positive = humped, belly cheap)
    curvature_chg = (2 * delta_yields_bps.get('5y', 0)
                     - delta_yields_bps.get('2y', 0)
                     - delta_yields_bps.get('10y', 0))

    return {'pnl_2y': pnl_2y, 'pnl_5y': pnl_5y, 'pnl_10y': pnl_10y,
            'total_pnl': total, 'curvature_change_bps': curvature_chg}


# Typical DV01 for $1M notional par bonds (approximately)
# Duration ≈ maturity for zero-coupon; coupon bond DV01 < maturity * 0.01% * 1M
dv01_2y  = 190.0   # $/bp per $1M notional of 2Y
dv01_5y  = 450.0   # $/bp
dv01_10y = 830.0   # $/bp

weights = butterfly_weights(dv01_2y, dv01_5y, dv01_10y, 'long_belly')
print(f"Long belly butterfly weights:")
print(f"  2Y: {weights['w_2y']:.3f}  DV01: \${weights['dv01_2y']:.1f}/bp")
print(f"  5Y: {weights['w_5y']:.3f}  DV01: \${weights['dv01_5y']:.1f}/bp")
print(f" 10Y: {weights['w_10y']:.3f}  DV01: \${weights['dv01_10y']:.1f}/bp")
print(f"  Net DV01: \${weights['net_dv01']:.2f}/bp  (should be ~0)")

# Parallel shift: P&L ≈ 0 (DV01-neutral); belly steepening profits
for scenario, dy in [
    ('Parallel +10bp',   {'2y':10,'5y':10,'10y':10}),
    ('Belly richens -5bp',{'2y':0,'5y':-5,'10y':0}),
    ('Bull flatten',     {'2y':5,'5y':2,'10y':-2}),
]:
    res = butterfly_pnl(weights, dy)
    print(f"{scenario}: P&L=\${res['total_pnl']:.0f}  Curvature={res['curvature_change_bps']:+.0f}bp")`,
    explanation:
      "The butterfly trade isolates curvature from level and slope: because the DV01 of each wing equals half the belly's DV01, a parallel yield shift produces near-zero P&L. The trade profits when the 5Y yield falls relative to the average of 2Y and 10Y — a 'belly richening' often seen when the market prices in a short rate hold (steeper near-term expectations vs unchanged long-term). The equal-DV01 wing constraint can be relaxed to tilt toward the 2s5s spread or the 5s10s spread, creating a directional overlay.",
  },

  {
    id: "pyfin-20260529-b1-hmm-regime",
    language: "python",
    title: "Hidden Markov Model regime detection — bull vs bear market",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def hmm_em_gaussian(returns: np.ndarray, n_states: int = 2,
                     n_iter: int = 100, seed: int = 42) -> dict:
    """
    Baum-Welch EM algorithm for a Gaussian HMM with n_states regimes.
    Observation model: r_t | s_t=k ~ N(mu_k, sigma_k^2)
    Transition model: P(s_t | s_{t-1}) = A (n_states x n_states matrix)

    Returns estimated parameters and Viterbi-decoded state sequence.
    """
    rng = np.random.default_rng(seed)
    T   = len(returns)
    K   = n_states

    # Initialise parameters: mu, sigma per state, transition matrix A, initial pi
    idx = np.argsort(returns)
    mu    = np.array([returns[idx[:T//K]].mean(), returns[idx[T//K:]].mean()])
    sigma = np.array([returns[idx[:T//K]].std() + 0.01, returns[idx[T//K:]].std() + 0.01])
    A     = np.full((K, K), 1.0 / K)
    pi    = np.full(K, 1.0 / K)

    def emission(k, t):
        return norm.pdf(returns[t], mu[k], sigma[k])

    log_lik_history = []

    for iteration in range(n_iter):
        # E-step: Forward-Backward algorithm
        # Forward: alpha[t, k] = P(r_1..r_t, s_t=k)
        alpha = np.zeros((T, K))
        for k in range(K):
            alpha[0, k] = pi[k] * emission(k, 0)
        alpha[0] /= alpha[0].sum() + 1e-300

        scales = np.zeros(T)
        scales[0] = alpha[0].sum()

        for t in range(1, T):
            for k in range(K):
                alpha[t, k] = sum(alpha[t-1, j] * A[j, k] for j in range(K)) * emission(k, t)
            scale = alpha[t].sum() + 1e-300
            alpha[t] /= scale
            scales[t] = scale

        log_lik = np.sum(np.log(scales + 1e-300))
        log_lik_history.append(log_lik)

        # Backward: beta[t, k] = P(r_{t+1}..r_T | s_t=k)
        beta = np.zeros((T, K))
        beta[-1] = 1.0

        for t in range(T-2, -1, -1):
            for j in range(K):
                beta[t, j] = sum(A[j, k] * emission(k, t+1) * beta[t+1, k] for k in range(K))
            scale = beta[t].sum() + 1e-300
            beta[t] /= scale

        # Gamma: P(s_t=k | all observations)
        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True) + 1e-300

        # Xi: P(s_t=j, s_{t+1}=k | all observations)
        # M-step: update parameters
        pi = gamma[0]
        for j in range(K):
            for k in range(K):
                num = sum(alpha[t,j] * A[j,k] * emission(k,t+1) * beta[t+1,k]
                          for t in range(T-1))
                A[j, k] = num
            A[j] /= A[j].sum() + 1e-300

        for k in range(K):
            Nk = gamma[:, k].sum()
            mu[k]    = (gamma[:, k] * returns).sum() / (Nk + 1e-300)
            sigma[k] = np.sqrt((gamma[:, k] * (returns - mu[k])**2).sum() / (Nk + 1e-300)) + 0.001

        if iteration > 5 and abs(log_lik_history[-1] - log_lik_history[-2]) < 1e-6:
            break

    # Viterbi: most likely state sequence
    viterbi = np.zeros((T, K))
    path    = np.zeros((T, K), dtype=int)
    for k in range(K):
        viterbi[0, k] = np.log(pi[k] + 1e-300) + np.log(emission(k, 0) + 1e-300)

    for t in range(1, T):
        for k in range(K):
            scores = viterbi[t-1] + np.log(A[:, k] + 1e-300)
            path[t, k] = scores.argmax()
            viterbi[t, k] = scores.max() + np.log(emission(k, t) + 1e-300)

    states = np.zeros(T, dtype=int)
    states[-1] = viterbi[-1].argmax()
    for t in range(T-2, -1, -1):
        states[t] = path[t+1, states[t+1]]

    # Label: bull = higher mean, bear = lower mean
    bull_state = np.argmax(mu)
    return {'mu': mu, 'sigma': sigma, 'A': A, 'pi': pi,
            'states': states, 'bull_state': bull_state,
            'log_lik': log_lik_history[-1]}

rng = np.random.default_rng(42)
# Simulate bull (mu=0.0008, sig=0.01) and bear (mu=-0.001, sig=0.025) regimes
regime = np.random.choice([0,1], size=500, p=[0.7, 0.3])
returns = np.where(regime==0,
                    rng.normal(0.0008, 0.010, 500),
                    rng.normal(-0.001, 0.025, 500))

res = hmm_em_gaussian(returns, n_states=2)
bull = res['bull_state']
bear = 1 - bull
print(f"Bull state {bull}: mu={res['mu'][bull]*252*100:.1f}%/yr  vol={res['sigma'][bull]*np.sqrt(252)*100:.1f}%/yr")
print(f"Bear state {bear}: mu={res['mu'][bear]*252*100:.1f}%/yr  vol={res['sigma'][bear]*np.sqrt(252)*100:.1f}%/yr")
print(f"Transition: P(bull→bear)={res['A'][bull,bear]:.3f}  P(bear→bull)={res['A'][bear,bull]:.3f}")`,
    explanation:
      "HMM regime detection models the latent market state (bull vs bear) as a hidden Markov chain and uses the Baum-Welch EM algorithm to jointly estimate the Gaussian emission parameters and the transition matrix. The Viterbi algorithm then decodes the most likely sequence of regimes. Key finding from empirical finance: bear regimes have higher volatility AND negative drift, while bull regimes have lower volatility AND positive drift — the volatility feedback loop. Portfolio strategies that scale down exposure during detected bear regimes improve Sharpe ratios in backtests.",
  },

  {
    id: "pyfin-20260529-b1-vasicek-termstr",
    language: "python",
    title: "Vasicek model — analytic term structure and bond price calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def vasicek_zcb(r0: float, kappa: float, theta: float, sigma: float,
                 T: float) -> float:
    """
    Vasicek (1977) analytic zero-coupon bond price.
    dr = kappa*(theta - r) dt + sigma * dW
    P(0,T) = A(T) * exp(-B(T) * r0)
    B(T) = (1 - exp(-kappa*T)) / kappa
    A(T) = exp((theta - sigma^2/(2*kappa^2))*(B(T)-T) - sigma^2*B(T)^2/(4*kappa))
    """
    if T < 1e-9:
        return 1.0
    B = (1.0 - np.exp(-kappa * T)) / kappa
    A_exp = ((theta - sigma**2 / (2 * kappa**2)) * (B - T)
              - sigma**2 * B**2 / (4 * kappa))
    return np.exp(A_exp - B * r0)

def vasicek_yield(r0, kappa, theta, sigma, T):
    """Continuously compounded yield y(T) = -ln(P(0,T)) / T."""
    if T < 1e-9:
        return r0
    return -np.log(vasicek_zcb(r0, kappa, theta, sigma, T)) / T

def vasicek_term_structure(r0, kappa, theta, sigma,
                            maturities=None) -> dict:
    """Full term structure: yields, forwards, and risk-neutral/physical moments."""
    if maturities is None:
        maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])

    yields   = np.array([vasicek_yield(r0, kappa, theta, sigma, T) for T in maturities])
    # Instantaneous forward rate: f(0,T) = -d(ln P)/dT
    dt = 1e-5
    fwds = np.array([
        -(np.log(vasicek_zcb(r0, kappa, theta, sigma, T + dt))
          - np.log(vasicek_zcb(r0, kappa, theta, sigma, T))) / dt
        for T in maturities
    ])

    # Conditional moments of r_T | r_0
    cond_means = theta + (r0 - theta) * np.exp(-kappa * maturities)
    cond_vars  = sigma**2 / (2*kappa) * (1 - np.exp(-2*kappa*maturities))

    return {
        'maturities': maturities,
        'yields':     yields,
        'forwards':   fwds,
        'cond_mean':  cond_means,
        'cond_std':   np.sqrt(cond_vars),
        'long_run_rate': theta,     # yield curve flattens to theta asymptotically
    }

def calibrate_vasicek(market_yields: np.ndarray, maturities: np.ndarray,
                       r0: float) -> dict:
    """Calibrate kappa, theta, sigma to market yields via least squares."""
    def obj(params):
        kappa, theta, sigma = params
        if kappa < 0.01 or sigma < 0.001 or theta < 0:
            return 1e10
        model_yields = np.array([vasicek_yield(r0, kappa, theta, sigma, T)
                                  for T in maturities])
        return np.sum((model_yields - market_yields)**2) * 1e6

    res = minimize(obj, [0.5, market_yields[-1], 0.01], method='Nelder-Mead',
                   options={'maxiter': 5000, 'xatol': 1e-8})
    kappa, theta, sigma = res.x
    ts = vasicek_term_structure(r0, kappa, theta, sigma, maturities)
    rmse = np.sqrt(np.mean((ts['yields'] - market_yields)**2))
    return {'kappa': kappa, 'theta': theta, 'sigma': sigma,
            'rmse_bps': rmse * 10000, 'term_structure': ts}

# Normal upward-sloping curve
mats  = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
mkt   = np.array([0.045, 0.047, 0.050, 0.053, 0.054, 0.055, 0.056, 0.057, 0.058, 0.058])
r0    = 0.045

cal = calibrate_vasicek(mkt, mats, r0)
print(f"Calibrated: kappa={cal['kappa']:.3f}  theta={cal['theta']*100:.2f}%  sigma={cal['sigma']*100:.2f}%")
print(f"Fit RMSE: {cal['rmse_bps']:.2f} bps")
ts = cal['term_structure']
for m, y, f in zip(mats[[2,4,7]], ts['yields'][[2,4,7]], ts['forwards'][[2,4,7]]):
    print(f"  {m:.0f}Y: yield={y*100:.3f}%  fwd={f*100:.3f}%  E[r_T]={ts['cond_mean'][[2,4,7]][0]*100:.3f}%")`,
    explanation:
      "The Vasicek model's analytic bond pricing formula makes calibration to market yields a fast least-squares problem. The key structural feature is that yields at all maturities are affine in the current short rate r0, so the entire yield curve shifts in parallel when r changes (a limitation — real curves show twists). The long-run yield θ controls where the curve flattens at long maturities; fast mean reversion (large κ) causes yields to converge to θ quickly, flattening the curve even at 5–7Y.",
  },

  {
    id: "pyfin-20260529-b1-kyle-lambda",
    language: "python",
    title: "Kyle's lambda and Amihud illiquidity — price impact estimation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

def kyle_lambda(trade_prices: np.ndarray, trade_volumes: np.ndarray,
                 trade_signs: np.ndarray, window: int = 50) -> dict:
    """
    Kyle (1985) lambda: price impact per unit of signed order flow.
    Regression: delta_p_t = lambda * sum(sign_t * vol_t) + eps_t
    where sum(sign * vol) is the net (signed) order flow in an interval.
    lambda (Kyle's lambda) = dollar price impact per unit of order imbalance.

    trade_signs: +1 for buyer-initiated, -1 for seller-initiated.
    Estimated via OLS; higher lambda = less liquid, more price impact.
    """
    dp       = np.diff(trade_prices)
    ofi      = trade_signs[1:] * trade_volumes[1:]   # signed order flow

    # Rolling OLS over 'window' trade observations
    lambdas = []
    for i in range(window, len(dp)):
        y = dp[i-window:i]
        x = sm.add_constant(ofi[i-window:i])
        try:
            lam = sm.OLS(y, x).fit().params[1]
            lambdas.append(lam)
        except Exception:
            lambdas.append(np.nan)

    return {
        'lambda_series': np.array(lambdas),
        'lambda_mean':   np.nanmean(lambdas),
        'lambda_median': np.nanmedian(lambdas),
    }

def amihud_illiquidity(returns: pd.Series, volumes: pd.Series,
                        rolling_window: int = 21) -> pd.Series:
    """
    Amihud (2002) illiquidity ratio: |r_t| / Dollar_Volume_t
    High Amihud = a large return per dollar traded = illiquid.
    Usually annualised as mean of daily ratios * 1e6 (scaled to $/M).
    """
    dollar_vol = volumes   # assume already in dollar volume
    amihud     = returns.abs() / (dollar_vol + 1e-9)
    return amihud.rolling(rolling_window).mean() * 1e6  # scale for readability

def roll_spread_from_prices(prices: pd.Series, min_obs: int = 30) -> float:
    """
    Roll (1984) effective spread from serial covariance of price changes.
    Spread = 2 * sqrt(-Cov(dp_t, dp_{t-1}))  [only when Cov < 0]
    """
    dp  = prices.diff().dropna()
    cov = np.cov(dp.iloc[1:].values, dp.iloc[:-1].values)[0, 1]
    return 2.0 * np.sqrt(-cov) if cov < 0 else 0.0

def estimate_market_impact(signed_volumes: np.ndarray, prices: np.ndarray,
                            participation_rate: float = 0.10) -> dict:
    """
    Square-root market impact model (Almgren et al. 2005):
    Impact = alpha * sigma * sqrt(Q / ADV)
    where Q = order size, ADV = average daily volume.
    alpha ≈ 0.5-1.0 (empirically calibrated), sigma = daily vol.
    """
    adv    = np.abs(signed_volumes).mean() * 252   # annualised avg daily volume
    q_pct  = participation_rate                     # fraction of ADV
    sigma  = np.std(np.diff(np.log(prices + 1e-9))) * np.sqrt(252)
    impact = 0.6 * sigma * np.sqrt(q_pct)          # alpha=0.6 (common calibration)
    return {'impact_bps': impact * 10000, 'adv': adv, 'sigma_ann': sigma}

# Simulate a VWAP execution: 1000 trades, random walk price
rng = np.random.default_rng(42)
n   = 500
prices  = np.cumsum(rng.normal(0, 0.05, n)) + 100.0
volumes = np.abs(rng.normal(10000, 3000, n))
signs   = rng.choice([-1.0, 1.0], size=n)   # random trade direction

kl = kyle_lambda(prices, volumes, signs, window=50)
print(f"Kyle's lambda: {kl['lambda_mean']:.6f}  ($/share per unit OFI)")

impact = estimate_market_impact(volumes * signs, prices, participation_rate=0.05)
print(f"Square-root impact (5% ADV): {impact['impact_bps']:.2f} bps")
print(f"Daily vol: {impact['sigma_ann']*100:.1f}%  ADV: {impact['adv']:.0f}")`,
    explanation:
      "Kyle's lambda quantifies how much an order moves the price per unit of signed volume — the fundamental measure of adverse selection cost. A higher lambda means informed traders are extracting more information rents from market makers, who widen spreads in response. The square-root market impact model (Q / ADV)^0.5 is the empirical consensus from institutional trading data: impact scales with the square root of order size fraction rather than linearly, because market makers anticipate large orders and gradually adjust quotes.",
  },

  {
    id: "pyfin-20260529-b1-basket-option",
    language: "python",
    title: "Basket option pricing via MC with Cholesky-correlated assets",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def basket_option_mc(S0: np.ndarray, weights: np.ndarray,
                      K: float, r: float, T: float,
                      sigma: np.ndarray, corr: np.ndarray,
                      is_call: bool = True,
                      n_paths: int = 200_000, seed: int = 42,
                      antithetic: bool = True) -> dict:
    """
    European basket option: payoff = max(sum(w_i * S_T^i) - K, 0)
    Simulates correlated GBM paths via Cholesky decomposition of correlation matrix.

    weights: non-negative weights summing to 1 (portfolio composition)
    sigma:   per-asset annualised vol
    corr:    correlation matrix (n_assets x n_assets)
    """
    rng  = np.random.default_rng(seed)
    n    = len(S0)
    disc = np.exp(-r * T)

    # Cholesky decomposition of correlation matrix
    L    = np.linalg.cholesky(corr)

    # Drift and diffusion for log-return: mu_i = (r - 0.5*sigma_i^2)*T
    mu  = (r - 0.5 * sigma**2) * T
    sT  = sigma * np.sqrt(T)

    def simulate_payoffs(Z):
        # Z: (n, n_paths) independent standard normals
        W = L @ Z                    # (n, n_paths) correlated normals
        logS = np.log(S0)[:, None] + mu[:, None] + sT[:, None] * W
        S_T  = np.exp(logS)         # (n, n_paths)
        basket = weights @ S_T      # (n_paths,)  weighted basket value
        if is_call:
            return np.maximum(basket - K, 0.0)
        else:
            return np.maximum(K - basket, 0.0)

    n_sim = n_paths // 2 if antithetic else n_paths
    Z = rng.standard_normal((n, n_sim))

    payoffs = simulate_payoffs(Z)
    if antithetic:
        payoffs = 0.5 * (payoffs + simulate_payoffs(-Z))

    price = disc * payoffs.mean()
    se    = disc * payoffs.std() / np.sqrt(len(payoffs))

    # Geometric basket closed form (lower bound / approximation)
    # Geometric basket S_geo = prod(S_i^w_i); has analytic BS formula
    sigma_geo = np.sqrt(weights @ (corr * np.outer(sigma, sigma)) @ weights)
    mu_geo    = r - 0.5 * (weights @ (sigma**2)) + 0.5 * sigma_geo**2
    lnS_geo0  = weights @ np.log(S0)
    F_geo     = np.exp(lnS_geo0 + mu_geo * T)
    d1 = (np.log(F_geo / K) + 0.5 * sigma_geo**2 * T) / (sigma_geo * np.sqrt(T))
    d2 = d1 - sigma_geo * np.sqrt(T)

    if is_call:
        geo_price = disc * (F_geo * norm.cdf(d1) - K * norm.cdf(d2))
    else:
        geo_price = disc * (K * norm.cdf(-d2) - F_geo * norm.cdf(-d1))

    return {
        'price':    price,
        'se':       se,
        'geo_lb':   geo_price,  # geometric basket underestimates arithmetic basket call
        'spread':   price - geo_price,
    }


# 5-asset basket: S=100 each, equal weights, different vols, positive corr
n_assets = 5
S0      = np.full(n_assets, 100.0)
weights = np.full(n_assets, 1.0 / n_assets)
sigma   = np.array([0.20, 0.15, 0.25, 0.18, 0.22])
rho     = 0.50   # common pairwise correlation
corr    = np.full((n_assets, n_assets), rho)
np.fill_diagonal(corr, 1.0)

res = basket_option_mc(S0, weights, K=100, r=0.05, T=1.0,
                        sigma=sigma, corr=corr, is_call=True)
print(f"ATM basket call price: {res['price']:.4f}  (+/- {res['se']:.4f})")
print(f"Geometric basket LB:   {res['geo_lb']:.4f}")
print(f"Arithmetic-geometric spread: {res['spread']:.4f}")
print(f"Correlation effect: corr=0.5 vs 0 → prices differ by the spread above")`,
    explanation:
      "The geometric basket lower bound exploits Jensen's inequality: the geometric mean of log-normals is log-normal (hence analytically priced), while the arithmetic mean is not. The spread between the two — the 'arithmetic-geometric gap' — grows with the number of assets and with correlation heterogeneity. The antithetic variate trick halves the effective paths needed: because the basket payoff is convex and monotone in each component, the correlated path and its sign-flipped counterpart are negatively correlated, substantially reducing estimator variance.",
  },

  {
    id: "pyfin-20260529-b1-pvbp-swap",
    language: "python",
    title: "PVBP / DV01 of an interest rate swap from OIS discount curve",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import interp1d

def swap_pvbp(fixed_rate: float, maturity: float,
               disc_tenors: np.ndarray, disc_factors: np.ndarray,
               freq: int = 2) -> dict:
    """
    Price and PVBP (Price Value of a Basis Point) for a fixed-vs-float swap.
    PVBP = |dV/dR| for a 1bp parallel shift of the yield curve.

    Fixed leg: pays coupon C = fixed_rate/freq every period.
    Float leg: receives LIBOR/SOFR for each accrual period (priced at par).
    Swap value (receive-fixed) = PV(fixed) - PV(float) = PV(fixed) - 1 [if float = par]

    For the float leg: sum of FRAs priced from forward rates = par at inception.
    Simplified here: float leg = par (1.0) via standard swap pricing shortcut.
    """
    df_fn   = interp1d(disc_tenors, np.log(disc_factors), kind='linear',
                        fill_value='extrapolate')
    def df(t):
        return np.exp(float(df_fn(t)))

    # Fixed leg: coupon schedule
    n_periods = int(round(maturity * freq))
    tau       = 1.0 / freq                   # accrual period
    times     = np.arange(1, n_periods + 1) * tau

    # Discount factors for coupon and principal dates
    dfs  = np.array([df(t) for t in times])

    # Fixed leg PV: sum(coupon * df) + par * df(maturity)
    coupon   = fixed_rate / freq
    pv_fixed = coupon * dfs.sum() + dfs[-1]  # annuity + ZCB

    # Float leg PV: par (exact if curve is used consistently)
    pv_float = 1.0   # by convention at par at inception

    pv_swap = pv_fixed - pv_float   # receive-fixed swap value (relative to notional)

    # PVBP via bumping the yield curve by +1bp
    disc_up  = disc_factors * np.exp(-0.0001 * disc_tenors)  # parallel +1bp → df decreases
    df_fn_up = interp1d(disc_tenors, np.log(disc_up), kind='linear',
                         fill_value='extrapolate')
    def df_up(t): return np.exp(float(df_fn_up(t)))

    dfs_up   = np.array([df_up(t) for t in times])
    pv_fixed_up = coupon * dfs_up.sum() + dfs_up[-1]
    # Float leg also shifts with the discount curve (we approximate it stays at par)
    pvbp = abs(pv_fixed_up - pv_fixed)   # price change per 1bp of coupon/disc shift

    # Annuity (PV01): sum of all discount factors (= DV01 of fixed leg per unit notional)
    annuity = tau * dfs.sum()   # PV of 1 per period

    # Par swap rate: rate that makes swap PV = 0
    par_rate = (1.0 - dfs[-1]) / (tau * dfs.sum())

    return {
        'pv_swap':   pv_swap,
        'pv_fixed':  pv_fixed,
        'pvbp':      pvbp,           # change in $ per 1bp per $1 notional
        'annuity':   annuity,
        'par_rate':  par_rate,
        'dv01':      pvbp,           # synonym for pvbp
        'duration':  pvbp / (pv_fixed + 1e-9) if pv_fixed > 0 else 0.0,
    }


# Flat 5% OIS curve
tenors      = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30])
disc_factors = np.exp(-0.05 * tenors)

for mat in [2, 5, 10]:
    res = swap_pvbp(fixed_rate=0.05, maturity=mat,
                     disc_tenors=tenors, disc_factors=disc_factors)
    print(f"{mat:2d}Y ATM swap: PVBP={res['pvbp']*10000:.2f} bps/bp  "
          f"Annuity={res['annuity']:.4f}  Par rate={res['par_rate']*100:.4f}%")`,
    explanation:
      "The swap PVBP (Price Value of a Basis Point) is the dollar change in swap value for a 1bp parallel shift in the discount curve, and equals the annuity times 0.0001 at-the-money. A 10Y pay-fixed swap has PVBP ≈ 0.09% of notional per basis point — meaning a $100M position loses $90K per 1bp rate rise. The par rate formula (1 − df(T)) / annuity is the no-arbitrage fixed rate that equates the present values of fixed and floating legs, and underpins the standard swap pricing framework on OIS/SOFR curves.",
  },
];
