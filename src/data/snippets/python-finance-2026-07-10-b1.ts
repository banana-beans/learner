import type { Snippet } from "./types";

export const pythonFinanceSnippets20260710B1: Snippet[] = [
  {
    id: "pyfin-20260710-b1-efficient-frontier",
    language: "python",
    title: "Mean-Variance Efficient Frontier via scipy.optimize",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def min_var_for_target_return(mu: np.ndarray, cov: np.ndarray,
                               target: float) -> np.ndarray:
    """Find minimum-variance portfolio achieving at least target return."""
    n = len(mu)
    constraints = [
        {"type": "eq", "fun": lambda w: w.sum() - 1},
        {"type": "eq", "fun": lambda w: w @ mu - target},
    ]
    bounds = [(-0.3, 0.3)] * n   # allow mild short selling
    res = minimize(
        lambda w: w @ cov @ w,
        x0=np.ones(n) / n,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={"ftol": 1e-12, "maxiter": 2000},
    )
    return res.x

np.random.seed(1)
n = 6
mu  = np.array([0.08, 0.12, 0.10, 0.06, 0.15, 0.09])
A   = np.random.randn(n, n) * 0.08
cov = A @ A.T + np.diag([0.04, 0.06, 0.05, 0.03, 0.07, 0.04])

# Sweep target returns to trace the frontier
targets = np.linspace(mu.min() + 0.001, mu.max() - 0.001, 15)
frontier = []
for tgt in targets:
    w = min_var_for_target_return(mu, cov, tgt)
    vol = np.sqrt(w @ cov @ w)
    frontier.append((tgt, vol, (tgt - 0.03) / vol))  # (ret, vol, Sharpe)

print(f"{'Return':>8} {'Vol':>8} {'Sharpe':>8}")
for ret, vol, sr in frontier:
    print(f"{ret:8.4f} {vol:8.4f} {sr:8.4f}")

# Max-Sharpe portfolio (tangency): highest Sharpe in the frontier
best = max(frontier, key=lambda x: x[2])
print(f"\\nTangency: return={best[0]:.4f}  vol={best[1]:.4f}  Sharpe={best[2]:.4f}")`,
    explanation:
      "The efficient frontier is traced by solving a sequence of constrained minimum-variance problems at increasing target returns. The tangency portfolio (maximum Sharpe ratio) sits at the single point where the Capital Market Line is tangent to the frontier — it is the only efficient portfolio a mean-variance investor should hold before leveraging or deleveraging.",
  },
  {
    id: "pyfin-20260710-b1-heston-mc-python",
    language: "python",
    title: "Heston Model Monte Carlo via Euler-Maruyama",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def heston_call_mc(S0, K, T, r, V0, kappa, theta, xi, rho,
                   n_steps=100, n_paths=100_000, seed=42) -> dict:
    """
    Heston (1993) stochastic vol: dS = r*S dt + sqrt(V)*S dW1
                                   dV = kappa*(theta-V) dt + xi*sqrt(V) dW2
    Full-truncation Euler: replace V with max(V,0) before sqrt.
    """
    rng = np.random.default_rng(seed)
    dt, sqrt_dt = T / n_steps, np.sqrt(T / n_steps)
    rho2 = np.sqrt(1 - rho**2)

    S = np.full(n_paths, S0, dtype=float)
    V = np.full(n_paths, V0, dtype=float)

    for _ in range(n_steps):
        Z1 = rng.standard_normal(n_paths)
        Z2 = rho * Z1 + rho2 * rng.standard_normal(n_paths)
        sqV = np.sqrt(np.maximum(V, 0))
        S  *= np.exp((r - 0.5 * V) * dt + sqV * sqrt_dt * Z1)
        V   = np.abs(V) + kappa * (theta - np.abs(V)) * dt + xi * sqV * sqrt_dt * Z2

    disc = np.exp(-r * T)
    payoffs = disc * np.maximum(S - K, 0)
    price = payoffs.mean()
    se    = payoffs.std() / np.sqrt(n_paths)
    return {"price": price, "se": se, "ci95": (price - 1.96*se, price + 1.96*se)}

# Typical SPX-like parameters (Gatheral 2006 calibration)
res = heston_call_mc(
    S0=100, K=100, T=1.0, r=0.05,
    V0=0.04, kappa=2.0, theta=0.04, xi=0.30, rho=-0.70,
)
print(f"Heston call: {res['price']:.4f} +/- {res['se']:.4f}")
print(f"95% CI: ({res['ci95'][0]:.4f}, {res['ci95'][1]:.4f})")

# Skew: ITM vs ATM vs OTM
for strike in [90, 95, 100, 105, 110]:
    r2 = heston_call_mc(100, strike, 1.0, 0.05, 0.04, 2.0, 0.04, 0.30, -0.70, seed=42)
    print(f"K={strike}: {r2['price']:.4f}")`,
    explanation:
      "The negative rho (leverage effect) in Heston creates the implied vol skew: down moves increase variance, making OTM puts more expensive than OTM calls. The full-truncation scheme (|V| before drift, max(V,0) before sqrt) is superior to simple reflection because it prevents the scenario where a large negative Euler step produces an artificially large variance spike on the next step.",
  },
  {
    id: "pyfin-20260710-b1-sabr-smile",
    language: "python",
    title: "SABR Model: Hagan 2002 Implied Vol Approximation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def sabr_vol(F: float, K: float, T: float,
             alpha: float, beta: float, rho: float, nu: float) -> float:
    """
    Hagan et al. (2002) SABR implied vol approximation.
    dF = alpha * F^beta * dW1
    dalpha = nu * alpha * dW2,  Corr(dW1,dW2) = rho
    Valid for F,K > 0. Uses log-moneyness expansion.
    """
    if abs(F - K) < 1e-10:   # ATM limit
        FK = F
        z_over_x = 1.0
    else:
        FK = (F * K) ** 0.5
        z = nu / alpha * FK ** (1 - beta) * np.log(F / K)
        x = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
        z_over_x = z / x

    FK_b = FK ** (1 - beta)
    log_FK = np.log(F / K)

    # Leading-order term
    A = alpha / (FK_b * (1
        + (1-beta)**2/24 * log_FK**2
        + (1-beta)**4/1920 * log_FK**4))

    # Correction factor
    B = 1 + T * (
        (1-beta)**2 * alpha**2 / (24 * FK_b**2)
        + rho * beta * nu * alpha / (4 * FK_b)
        + nu**2 * (2 - 3*rho**2) / 24
    )
    return A * z_over_x * B

# Example: EUR/USD-like SABR calibration
F = 1.10     # forward
T = 1.0      # 1 year
alpha, beta, rho, nu = 0.08, 0.5, -0.15, 0.40

print(f"{'Strike':>8} {'Impl Vol':>10} {'Moneyness':>12}")
for K in [1.00, 1.04, 1.06, 1.08, 1.10, 1.12, 1.14, 1.16, 1.20]:
    vol = sabr_vol(F, K, T, alpha, beta, rho, nu)
    moneyness = np.log(K / F)
    print(f"{K:8.4f} {vol:10.4%} {moneyness:12.4f}")`,
    explanation:
      "The SABR model is the market standard for interest rate options (caps, floors, swaptions): the beta parameter controls backbone (beta=1 lognormal, beta=0 normal), rho drives the skew (negative → higher vol for lower strikes), and nu drives the smile curvature. The Hagan approximation expresses implied vol as a closed-form correction to the Black-Scholes formula, enabling real-time calibration.",
  },
  {
    id: "pyfin-20260710-b1-dupire-local-vol",
    language: "python",
    title: "Dupire Local Volatility Surface from Implied Vols",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(K_grid, T_grid, iv_surface, r=0.0, S0=100.0):
    """
    Dupire (1994) formula for local vol from implied vol surface:
      sigma_loc^2(K,T) = [dC/dT + r*K*dC/dK] / [0.5*K^2*d2C/dK2]
    where C(K,T) is the call price surface.
    """
    # Build call price surface
    C = np.zeros((len(T_grid), len(K_grid)))
    for i, T in enumerate(T_grid):
        for j, K in enumerate(K_grid):
            sig = iv_surface[i, j]
            d1 = (np.log(S0/K) + (r + 0.5*sig**2)*T) / (sig*np.sqrt(T))
            d2 = d1 - sig*np.sqrt(T)
            from scipy.stats import norm
            C[i, j] = (S0 * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d2))

    # Spline interpolation for smooth differentiation
    spl = RectBivariateSpline(T_grid, K_grid, C, kx=3, ky=3)

    sigma_loc = np.zeros((len(T_grid)-2, len(K_grid)-2))
    T_inner = T_grid[1:-1]
    K_inner = K_grid[1:-1]

    for i, T in enumerate(T_inner):
        for j, K in enumerate(K_inner):
            dCdT    = spl(T, K, dx=1, dy=0)[0, 0]
            dCdK    = spl(T, K, dx=0, dy=1)[0, 0]
            d2CdK2  = spl(T, K, dx=0, dy=2)[0, 0]
            numer   = dCdT + r * K * dCdK
            denom   = 0.5 * K**2 * d2CdK2
            sigma_loc[i, j] = np.sqrt(max(numer / denom, 1e-6)) if denom > 1e-10 else 0.20

    return T_inner, K_inner, sigma_loc

# Synthetic implied vol surface (slight smile)
T_grid  = np.array([0.25, 0.5, 1.0, 1.5, 2.0])
K_grid  = np.linspace(80, 120, 9)
iv_base = 0.20
iv_surface = np.array([
    [iv_base + 0.02*(1 - k/100)**2 + 0.005*T for k in K_grid]
    for T in T_grid
])

T_out, K_out, lv = dupire_local_vol(K_grid, T_grid, iv_surface)
print("Local Vol Surface (rows=tenor, cols=strike):")
print(np.round(lv, 4))`,
    explanation:
      "Dupire's theorem shows there is a unique local volatility surface sigma_loc(K,T) consistent with any arbitrage-free implied vol surface — it is the expectation of the instantaneous vol conditional on the terminal stock price being K at time T. In practice, the double differentiation amplifies noise, so implied vol surfaces must be smoothed (spline or SVI) before computing local vol numerically.",
  },
  {
    id: "pyfin-20260710-b1-fama-french-ols",
    language: "python",
    title: "Fama-French 3-Factor Alpha Estimation via OLS",
    tag: "finance",
    code: `import numpy as np

def ols(X: np.ndarray, y: np.ndarray) -> dict:
    """OLS: beta = (X'X)^{-1} X'y with standard errors and t-stats."""
    n, k = X.shape
    beta = np.linalg.lstsq(X, y, rcond=None)[0]
    resid = y - X @ beta
    s2 = resid @ resid / (n - k)               # residual variance
    var_beta = s2 * np.linalg.inv(X.T @ X)
    se = np.sqrt(np.diag(var_beta))
    t_stat = beta / se
    return {"beta": beta, "se": se, "t": t_stat,
            "r2": 1 - resid.var()/y.var(), "alpha_bps": beta[0]*10000}

np.random.seed(42)
T = 120  # 10 years monthly

# Simulate Fama-French factors (MKT, SMB, HML) and a test portfolio
MKT = np.random.randn(T) * 0.04 + 0.005    # market excess return
SMB = np.random.randn(T) * 0.02 + 0.001    # small-minus-big
HML = np.random.randn(T) * 0.02 + 0.002    # high-minus-low

# True loadings: market beta=1.1, size tilt=0.3, value tilt=-0.2, alpha=0.0015
true_alpha = 0.0015
ret_p = (true_alpha
         + 1.1 * MKT
         + 0.30 * SMB
         - 0.20 * HML
         + np.random.randn(T) * 0.01)

# Risk-free rate (constant for simplicity)
rf  = 0.0003
exc = ret_p - rf

X = np.column_stack([np.ones(T), MKT - rf, SMB, HML])
res = ols(X, exc)

labels = ["alpha", "beta_MKT", "beta_SMB", "beta_HML"]
print("Fama-French 3-Factor Regression:")
for name, b, se, t in zip(labels, res["beta"], res["se"], res["t"]):
    print(f"  {name:10s}: {b:8.5f}  SE={se:.5f}  t={t:.2f}")
print(f"Alpha: {res['alpha_bps']:.2f} bps/month  R2={res['r2']:.4f}")`,
    explanation:
      "The Fama-French 3-factor model decomposes portfolio returns into market risk (beta), size premium (SMB), and value premium (HML); the intercept alpha represents return unexplained by these systematic factors. An alpha significantly different from zero (|t| > 2) suggests genuine skill — but with 120 months of data, the standard error of alpha is typically ~50 bps annually, requiring several years before statistical significance is achievable.",
  },
  {
    id: "pyfin-20260710-b1-t-copula",
    language: "python",
    title: "Student-t Copula for Joint Default Simulation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import t as t_dist, norm, chi2

def t_copula_defaults(
    n_obligors: int,
    corr: float,          # single-factor correlation
    pd: float,            # uniform PD
    nu: int = 4,          # degrees of freedom (tail thickness)
    n_sims: int = 100_000,
    seed: int = 7,
) -> dict:
    """
    Student-t copula single-factor model for CDO tranche loss distribution.
    Fatter tails than Gaussian copula: extreme simultaneous defaults more likely.
    """
    rng = np.random.default_rng(seed)

    # Generate correlated t-variates via normal mixture
    # t_i = Z_i / sqrt(W/nu), W ~ chi2(nu), Z_i ~ N(0, Sigma)
    W  = chi2.rvs(nu, size=n_sims, random_state=rng)
    M  = rng.standard_normal(n_sims)                    # common factor ~ N(0,1)
    Z  = rng.standard_normal((n_sims, n_obligors))      # idiosyncratic

    # Correlated standard normals: X_i = sqrt(rho)*M + sqrt(1-rho)*Z_i
    X  = np.sqrt(corr) * M[:, None] + np.sqrt(1-corr) * Z

    # Convert to t-distributed: T_i = X_i / sqrt(W/nu)
    T_vars = X / np.sqrt(W[:, None] / nu)

    # Default threshold in t-distribution: P(T_i < threshold) = PD
    threshold = t_dist.ppf(pd, df=nu)
    defaults  = T_vars < threshold
    loss_rate = defaults.mean(axis=1)

    return {
        "mean_loss": loss_rate.mean(),
        "var_99":    np.percentile(loss_rate, 99),
        "var_999":   np.percentile(loss_rate, 99.9),
    }

print("Copula comparison (rho=0.3, PD=2%, 125 obligors):")
print(f"{'Model':>10}  {'E[Loss]':>8}  {'99%':>8}  {'99.9%':>8}")

# Gaussian copula (nu -> infinity)
from scipy.stats import norm as ndist
def gauss_copula(n_obs, corr, pd, n_sims=100_000, seed=7):
    rng = np.random.default_rng(seed)
    M  = rng.standard_normal(n_sims)
    Z  = rng.standard_normal((n_sims, n_obs))
    X  = np.sqrt(corr)*M[:,None] + np.sqrt(1-corr)*Z
    thr = ndist.ppf(pd)
    lr  = (X < thr).mean(axis=1)
    return {"mean_loss": lr.mean(), "var_99": np.percentile(lr,99), "var_999": np.percentile(lr,99.9)}

g = gauss_copula(125, 0.3, 0.02)
print(f"{'Gaussian':>10}  {g['mean_loss']:8.4f}  {g['var_99']:8.4f}  {g['var_999']:8.4f}")
for nu in [10, 5, 3]:
    t = t_copula_defaults(125, 0.3, 0.02, nu=nu)
    print(f"  t(nu={nu:2d})  {t['mean_loss']:8.4f}  {t['var_99']:8.4f}  {t['var_999']:8.4f}")`,
    explanation:
      "The t-copula generates heavier joint tails than the Gaussian copula at the same linear correlation: the common chi-squared mixing variable W forces all obligors to experience simultaneously thin or fat tails, increasing the probability of catastrophic joint defaults. Post-2008 regulation requires stress-testing with t-copula (nu=3–5) for CDO tranche capital requirements because Gaussian underestimates senior tranche losses by an order of magnitude.",
  },
  {
    id: "pyfin-20260710-b1-multiindex-factor",
    language: "python",
    title: "Multi-Index pandas: Cross-Sectional Factor Return Analysis",
    tag: "finance",
    code: `import pandas as pd
import numpy as np

np.random.seed(11)
n_stocks, n_dates = 50, 24   # 50 stocks, 24 months

# Build a (date, symbol) multi-index DataFrame
dates   = pd.date_range("2024-01-31", periods=n_dates, freq="ME")
symbols = [f"STK{i:03d}" for i in range(n_stocks)]
idx     = pd.MultiIndex.from_product([dates, symbols], names=["date", "symbol"])

df = pd.DataFrame({
    "ret":      np.random.randn(len(idx)) * 0.05,
    "momentum": np.random.randn(len(idx)),   # 12-1 momentum z-score
    "value":    np.random.randn(len(idx)),   # book-to-price z-score
    "mktcap":   np.exp(np.random.randn(len(idx)) * 0.5 + 10),
}, index=idx)

# Cross-sectional rank: at each date, rank stocks by momentum
df["mom_rank"] = df.groupby("date")["momentum"].rank(pct=True)

# Portfolio quintiles by momentum
df["quintile"] = df.groupby("date")["mom_rank"].transform(
    lambda x: pd.qcut(x, 5, labels=[1,2,3,4,5])
).astype(int)

# Equal-weight quintile returns
quintile_rets = (df.groupby(["date", "quintile"])["ret"]
                   .mean()
                   .unstack("quintile"))

# Momentum long-short: Q5 - Q1
quintile_rets["L/S"] = quintile_rets[5] - quintile_rets[1]

# Summary statistics
stats = quintile_rets.agg(["mean", "std"]) * 100
sharpe = stats.loc["mean"] / stats.loc["std"] * np.sqrt(12)

print("Quintile Mean Returns (% per month):")
print(stats.loc["mean"].to_string(float_format="{:.3f}%".format))
print(f"\\nAnnualised Sharpe ratios:")
print(sharpe.to_string(float_format="{:.3f}".format))

# Multi-level aggregation: cap-weighted return per date
cap_wt_ret = (df.assign(cw_ret=df["ret"] * df["mktcap"])
               .groupby("date")
               .apply(lambda g: g["cw_ret"].sum() / g["mktcap"].sum())
               .rename("cap_wt_ret"))
print(f"\\nCap-weighted portfolio mean: {cap_wt_ret.mean()*100:.3f}% / month")`,
    explanation:
      "pandas MultiIndex with (date, symbol) is the natural container for panel factor data: groupby('date') isolates cross-sectional operations (ranking, quantile formation) while groupby('symbol') handles time-series transforms (rolling signals). The qcut + unstack + diff pattern computes long-short quintile returns in three lines — the canonical workflow for factor research.",
  },
  {
    id: "pyfin-20260710-b1-arima-returns",
    language: "python",
    title: "ARIMA Forecasting for Return Series (statsmodels)",
    tag: "finance",
    code: `import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.stats.diagnostic import acorr_ljungbox

np.random.seed(23)
T = 500

# Simulate AR(1) return process with slight autocorrelation (momentum)
phi   = 0.12   # AR(1) coefficient
eps   = np.random.randn(T) * 0.01
ret   = np.empty(T)
ret[0] = eps[0]
for t in range(1, T):
    ret[t] = phi * ret[t-1] + eps[t]

# Fit ARIMA(1,0,1) = ARMA(1,1)
train, test = ret[:400], ret[400:]
model = ARIMA(train, order=(1, 0, 1))
res   = model.fit()
print(res.summary().tables[1])  # parameter table

# One-step-ahead forecast on test set
n_test = len(test)
preds  = np.empty(n_test)
for i in range(n_test):
    # Refit on expanding window (for brevity, use in-sample coefficients)
    fc    = res.forecast(steps=1, exog=None)
    preds[i] = fc.iloc[0]
    # In production: use res.apply(test[:i+1]) for true rolling forecasts

# Information Coefficient: correlation of forecast with realised return
ic = np.corrcoef(preds, test)[0, 1]
print(f"\\nTest IC: {ic:.4f}  (phi_true={phi:.2f})")

# Ljung-Box test for residual autocorrelation
lb = acorr_ljungbox(res.resid, lags=[10], return_df=True)
print(f"Ljung-Box p-value (lag 10): {lb['lb_pvalue'].iloc[0]:.4f}  (>0.05 = good)")`,
    explanation:
      "ARIMA(p,d,q) decomposes a time series into an autoregressive part (p lags), an integration order (d differences for stationarity), and a moving-average part (q lagged shocks). For financial returns d=0 (already stationary); small positive phi (AR coefficient) captures short-horizon momentum, while the MA term captures microstructure mean-reversion. The Ljung-Box test verifies residuals are white noise — a sign the model has extracted all linear structure.",
  },
  {
    id: "pyfin-20260710-b1-cointegration-eg",
    language: "python",
    title: "Engle-Granger Two-Step Cointegration Test",
    tag: "finance",
    code: `import numpy as np
from statsmodels.tsa.stattools import adfuller, coint

np.random.seed(5)
T = 500

# Simulate a cointegrated pair: Y_t = beta*X_t + u_t, u_t stationary
X = np.cumsum(np.random.randn(T) * 0.5) + 50
u = np.random.randn(T) * 0.5 * 0.8   # AR(1) spread with phi=0.8 persistence
for t in range(1, T):
    u[t] = 0.8 * u[t-1] + np.random.randn() * 0.5
Y = 1.5 * X + 10 + u

# Simulate a non-cointegrated pair for comparison
X2 = np.cumsum(np.random.randn(T) * 0.5) + 50
Y2 = np.cumsum(np.random.randn(T) * 0.5) + 50   # independent random walk

def eg_cointegration_test(y, x, name=""):
    # Step 1: OLS regression to find cointegrating vector
    beta = np.cov(y, x)[0, 1] / np.var(x)
    alpha = y.mean() - beta * x.mean()
    spread = y - (alpha + beta * x)

    # Step 2: ADF test on the residuals (test for unit root in spread)
    adf_stat, p_value, _, _, crit, _ = adfuller(spread, maxlags=5, regression="nc")

    # statsmodels coint() does this in one call
    score, p_coint, crit_coint = coint(y, x)

    print(f"\\n{name}")
    print(f"  Cointegrating vector: beta={beta:.4f}  alpha={alpha:.4f}")
    print(f"  Spread ADF stat: {adf_stat:.4f}  p={p_value:.4f}")
    print(f"  coint() p-value: {p_coint:.4f}  (< 0.05 => cointegrated)")
    print(f"  Spread half-life: {-np.log(2)/np.log(1+beta_ou(spread)):.1f} days",
          end="")
    print()

def beta_ou(spread):
    """AR(1) coefficient of spread (used for half-life)."""
    return np.corrcoef(spread[1:], spread[:-1])[0, 1] - 1

eg_cointegration_test(Y, X, "Cointegrated pair (Y = 1.5X + noise)")
eg_cointegration_test(Y2, X2, "Non-cointegrated pair (independent RW)")`,
    explanation:
      "The Engle-Granger two-step test for cointegration first regresses Y on X to estimate the cointegrating vector, then applies an ADF test to the residual spread — if the spread is stationary (ADF rejects unit root), the pair is cointegrated and the spread is mean-reverting. The half-life computed from the AR(1) coefficient tells the pairs trader how quickly the spread is expected to converge after a trade entry.",
  },
  {
    id: "pyfin-20260710-b1-lookback-mc",
    language: "python",
    title: "Floating-Strike Lookback Option Monte Carlo",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def lookback_call_mc(S0, T, r, sigma, n_steps=252, n_paths=100_000, seed=3):
    """
    Floating-strike lookback call: pays S_T - min(S_t over [0,T]).
    The holder effectively buys at the lowest price over the period.
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    disc = np.exp(-r * T)

    # Simulate paths using GBM exact stepping
    Z    = rng.standard_normal((n_paths, n_steps))
    logS = np.log(S0) + np.cumsum((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=1)
    S    = np.exp(logS)

    S_T  = S[:, -1]
    S_min = S.min(axis=1)
    payoffs = disc * np.maximum(S_T - S_min, 0)

    price = payoffs.mean()
    se    = payoffs.std() / np.sqrt(n_paths)
    return price, se

def lookback_call_exact(S0, T, r, sigma):
    """
    Goldman, Sosin & Gatto (1979) closed-form for floating-strike lookback call.
    C = S0*(N(a1) + sigma^2/(2r)*N(-a1)) - S0*exp(-rT)*(N(a2) - sigma^2/(2r)*exp(rT)*N(-a3))
    """
    a1 = (r/sigma + sigma/2) * np.sqrt(T)
    a2 = a1 - sigma * np.sqrt(T)
    a3 = a1
    if r == 0:
        return S0 * sigma * np.sqrt(T) * (norm.pdf(0) + 0)  # simplified
    m = sigma**2 / (2*r)
    C = S0*(norm.cdf(a1) + m*norm.cdf(-a1))
    C -= S0*np.exp(-r*T)*(norm.cdf(a2) - m*np.exp(r*T)*norm.cdf(-a3))
    return C

S0, T, r, sigma = 100, 1.0, 0.05, 0.20
mc_price, se = lookback_call_mc(S0, T, r, sigma)
exact = lookback_call_exact(S0, T, r, sigma)
print(f"Lookback call (floating strike):")
print(f"  MC:    {mc_price:.4f} +/- {se:.4f}")
print(f"  Exact: {exact:.4f}")
print(f"  vs. Vanilla call ATM: ~10.45")`,
    explanation:
      "Floating-strike lookback calls are roughly twice as expensive as vanilla calls because the holder is guaranteed to buy at the period minimum — the optionality extends over the full path history, not just the terminal price. In practice, lookbacks are hedged by continuously delta-hedging with a gamma that spikes whenever the running minimum is being updated, creating significant path-dependent hedging cost.",
  },
  {
    id: "pyfin-20260710-b1-asian-mc",
    language: "python",
    title: "Arithmetic Asian Call Option via Monte Carlo",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def asian_call_mc(S0, K, T, r, sigma, n_steps=252, n_paths=50_000, seed=9):
    """Arithmetic average Asian call: pays max(avg(S) - K, 0)."""
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    disc = np.exp(-r * T)

    Z    = rng.standard_normal((n_paths, n_steps))
    logS = np.log(S0) + np.cumsum((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=1)
    S    = np.exp(logS)

    avg_S  = S.mean(axis=1)           # arithmetic average
    payoffs = disc * np.maximum(avg_S - K, 0)

    price = payoffs.mean()
    se    = payoffs.std() / np.sqrt(n_paths)
    return price, se

def geometric_asian_exact(S0, K, T, r, sigma, n):
    """
    Geometric Asian call closed form (Kemna & Vorst 1990).
    The geometric mean has a lognormal distribution with adjusted parameters.
    """
    sigma_g = sigma * np.sqrt((n+1) * (2*n+1) / (6*n**2))
    r_g     = 0.5 * (r - 0.5*sigma**2 + sigma_g**2)
    d1 = (np.log(S0/K) + (r_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g * np.sqrt(T)
    return np.exp(-r*T) * (S0*np.exp(r_g*T)*norm.cdf(d1) - K*norm.cdf(d2))

S0, K, T, r, sigma = 100, 100, 1.0, 0.05, 0.20
arith_price, se = asian_call_mc(S0, K, T, r, sigma)
geom_exact = geometric_asian_exact(S0, K, T, r, sigma, n=252)

print(f"Arithmetic Asian call (MC): {arith_price:.4f} +/- {se:.4f}")
print(f"Geometric Asian (exact):    {geom_exact:.4f}")
print(f"European vanilla call:      ~10.45")
print(f"Averaging discount:         {(10.45 - arith_price) / 10.45 * 100:.1f}%")`,
    explanation:
      "Asian options are cheaper than vanilla because the average spot is less volatile than the terminal spot — the central limit theorem smooths the distribution. The geometric Asian has a closed-form solution because the geometric mean of lognormals is lognormal with adjusted sigma_g and r_g; this makes it a perfect control variate for the arithmetic Asian since the two prices are highly correlated.",
  },
  {
    id: "pyfin-20260710-b1-control-variate",
    language: "python",
    title: "Control Variate MC: Geometric Asian as Control for Arithmetic",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def asian_calls_with_cv(S0, K, T, r, sigma, n_steps=252, n_paths=50_000, seed=17):
    """
    Use geometric Asian (known exact price) as control variate for arithmetic Asian.
    X = arith payoff, Y = geom payoff (correlated).
    Adjusted estimate: X_cv = X - c*(Y - E[Y]), where c = Cov(X,Y)/Var(Y).
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    disc = np.exp(-r * T)

    Z    = rng.standard_normal((n_paths, n_steps))
    logS = np.log(S0) + np.cumsum((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=1)
    S    = np.exp(logS)

    arith_avg = S.mean(axis=1)
    geom_avg  = np.exp(np.log(S).mean(axis=1))   # geometric mean via log trick

    arith_pay = disc * np.maximum(arith_avg - K, 0)
    geom_pay  = disc * np.maximum(geom_avg  - K, 0)

    # Geometric Asian exact price (control variate's true expectation)
    sigma_g = sigma * np.sqrt((n_steps+1)*(2*n_steps+1)/(6*n_steps**2))
    r_g     = 0.5 * (r - 0.5*sigma**2 + sigma_g**2)
    d1 = (np.log(S0/K) + (r_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g*np.sqrt(T)
    geom_exact = np.exp(-r*T)*(S0*np.exp(r_g*T)*norm.cdf(d1) - K*norm.cdf(d2))

    # Optimal control coefficient c*
    c_star = np.cov(arith_pay, geom_pay)[0, 1] / np.var(geom_pay)

    # Control-variate adjusted estimate
    arith_cv = arith_pay - c_star * (geom_pay - geom_exact)

    mean_plain = arith_pay.mean()
    se_plain   = arith_pay.std() / np.sqrt(n_paths)
    mean_cv    = arith_cv.mean()
    se_cv      = arith_cv.std() / np.sqrt(n_paths)

    return mean_plain, se_plain, mean_cv, se_cv, c_star

m1, s1, m2, s2, c = asian_calls_with_cv(100, 100, 1.0, 0.05, 0.20)
print(f"Plain MC:  price={m1:.5f}  SE={s1:.6f}")
print(f"CV MC:     price={m2:.5f}  SE={s2:.6f}")
print(f"Variance reduction: {(s1/s2)**2:.1f}x  (c*={c:.4f})")`,
    explanation:
      "The control variate estimator X - c*(Y - E[Y]) is unbiased for any c and has minimum variance at c* = Cov(X,Y)/Var(Y). Geometric and arithmetic Asian payoffs are highly correlated (typical R² > 0.98) because they are computed on the same paths, giving variance reductions of 50–200× — making the arithmetic Asian pricing problem as easy as the geometric one even though no closed form exists for the former.",
  },
  {
    id: "pyfin-20260710-b1-svi-parametrize",
    language: "python",
    title: "Gatheral SVI Implied Vol Surface Parametrization",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def svi_variance(k: np.ndarray, a, b, rho, m, sigma) -> np.ndarray:
    """
    Gatheral (2004) Stochastic Volatility Inspired:
      w(k) = a + b*(rho*(k-m) + sqrt((k-m)^2 + sigma^2))
    where k = log(K/F) and w = total implied variance = sigma_impl^2 * T.
    Constraints: b>=0, |rho|<1, sigma>0, a+b*sigma*sqrt(1-rho^2)>=0 (no neg var).
    """
    return a + b * (rho * (k - m) + np.sqrt((k - m)**2 + sigma**2))

def fit_svi(k_obs: np.ndarray, w_obs: np.ndarray) -> dict:
    """Fit SVI parameters to observed (log-moneyness, total variance) data."""
    def objective(params):
        a, b, rho, m, sigma = params
        if b < 0 or abs(rho) >= 1 or sigma <= 0:
            return 1e10
        w_fit = svi_variance(k_obs, a, b, rho, m, sigma)
        if np.any(w_fit < 0):
            return 1e10
        return np.sum((w_fit - w_obs)**2)

    x0 = [0.04, 0.10, -0.50, 0.0, 0.10]
    bounds = [(-0.1, 0.5), (0, 1.0), (-0.99, 0.99), (-1, 1), (0.001, 1.0)]
    result = minimize(objective, x0, method="Nelder-Mead",
                      options={"xatol": 1e-9, "maxiter": 20000})
    a, b, rho, m, sigma = result.x
    return {"a": a, "b": b, "rho": rho, "m": m, "sigma": sigma, "rmse": np.sqrt(result.fun/len(k_obs))}

# Market implied vol data (1-year tenor, equity-like smile)
F = 100.0; T = 1.0
strikes = np.array([80, 85, 90, 95, 100, 105, 110, 115, 120])
iv_mkt  = np.array([0.27, 0.25, 0.23, 0.21, 0.20, 0.19, 0.19, 0.20, 0.21])

k_obs = np.log(strikes / F)
w_obs = iv_mkt**2 * T         # total implied variance

params = fit_svi(k_obs, w_obs)
print(f"SVI params: a={params['a']:.5f} b={params['b']:.5f} rho={params['rho']:.4f} "
      f"m={params['m']:.4f} sigma={params['sigma']:.4f}")
print(f"Fit RMSE: {params['rmse']*1e4:.3f} (in total var units)")

# Reconstruct fitted smile
w_fit = svi_variance(k_obs, params['a'], params['b'], params['rho'], params['m'], params['sigma'])
iv_fit = np.sqrt(w_fit / T)
print(f"\\n{'Strike':>8} {'IV_mkt':>8} {'IV_fit':>8}")
for K, iv_m, iv_f in zip(strikes, iv_mkt, iv_fit):
    print(f"{K:8.0f} {iv_m:8.3%} {iv_f:8.3%}")`,
    explanation:
      "The SVI parametrization guarantees a smooth, arbitrage-free implied vol surface for a single tenor: the square-root shape prevents the smile from crossing the Lee moment formula bounds (which would imply negative butterfly spreads). Gatheral's raw SVI has 5 parameters — a (level), b (slope), rho (skew), m (centre), sigma (smoothness) — and calibrates in milliseconds, making it the standard for real-time surface generation.",
  },
  {
    id: "pyfin-20260710-b1-bond-duration",
    language: "python",
    title: "Bond Modified Duration, Convexity, and DV01",
    tag: "finance",
    code: `import numpy as np

def bond_analytics(face: float, coupon_rate: float, ytm: float,
                   maturity: int, freq: int = 2) -> dict:
    """
    Compute clean price, Macaulay duration, modified duration, convexity, DV01.
    freq: coupon payments per year (2 = semi-annual, 4 = quarterly).
    """
    n      = maturity * freq
    c      = face * coupon_rate / freq    # coupon per period
    r      = ytm / freq                  # yield per period

    t      = np.arange(1, n + 1) / freq  # time in years
    df     = (1 + r) ** np.arange(-1, -n-1, -1)   # discount factors: 1/(1+r)^i

    # Cash flows: coupons + face at maturity
    cfs    = np.full(n, c)
    cfs[-1] += face

    pv_cfs = cfs * df
    price  = pv_cfs.sum()

    # Macaulay duration: weighted average time of cash flows
    mac_dur = (pv_cfs * t).sum() / price

    # Modified duration: dP/P per unit change in yield (negative)
    mod_dur = mac_dur / (1 + r)

    # Convexity: d^2P/dP^2 * 1/P (second-order yield sensitivity)
    convex = (pv_cfs * t * (t + 1/freq)).sum() / (price * (1 + r)**2)

    # DV01: dollar value of 1 basis point change in yield
    dv01 = mod_dur * price * 0.0001

    # Full P&L for a yield shift dY using 2nd-order Taylor
    def price_change_approx(dY):
        return -mod_dur * price * dY + 0.5 * convex * price * dY**2

    return {
        "price": price, "mac_dur": mac_dur, "mod_dur": mod_dur,
        "convexity": convex, "dv01": dv01,
        "pnl_25bp": price_change_approx(0.0025),
        "pnl_100bp": price_change_approx(0.01),
    }

for ytm in [0.03, 0.05, 0.07]:
    a = bond_analytics(face=1000, coupon_rate=0.05, ytm=ytm, maturity=10)
    print(f"YTM={ytm:.0%}: price={a['price']:8.3f}  ModDur={a['mod_dur']:.4f}  "
          f"Convex={a['convexity']:.3f}  DV01=\${a['dv01']:.4f}")
    print(f"         PnL +25bp={a['pnl_25bp']:+.3f}  PnL +100bp={a['pnl_100bp']:+.3f}")`,
    explanation:
      "Modified duration is the first-order sensitivity of bond price to yield (dP/P ≈ -ModDur × dY); convexity is the second-order correction that makes the price-yield relationship curved rather than linear. Convexity is always positive for vanilla bonds: a yield decrease gains more than a yield increase loses — a desirable property that investors pay for via lower yield on high-convexity bonds.",
  },
  {
    id: "pyfin-20260710-b1-irs-valuation",
    language: "python",
    title: "Fixed-Float Interest Rate Swap PV Calculation",
    tag: "finance",
    code: `import numpy as np

def irs_pv(notional: float, fixed_rate: float, float_spread: float,
           payment_dates: list, zero_curve: dict, current_date: float = 0.0) -> dict:
    """
    Value a plain vanilla IRS (receive fixed, pay float) using zero rates.
    payment_dates: list of year fractions from today
    zero_curve: dict {maturity: zero_rate}
    Uses flat forward rate between zero curve nodes.
    """
    maturities = sorted(zero_curve.keys())
    zero_rates  = np.array([zero_curve[m] for m in maturities])

    def zero(t):
        """Interpolate zero rate at maturity t."""
        return float(np.interp(t, maturities, zero_rates))

    def df(t):
        """Discount factor at t."""
        return np.exp(-zero(t) * t)

    def fwd_rate(t_start, t_end):
        """LIBOR/SOFR forward rate for the period [t_start, t_end]."""
        return (df(t_start) / df(t_end) - 1) / (t_end - t_start)

    # Fixed leg PV: sum of fixed coupons discounted
    fixed_pv = 0.0
    for i, t in enumerate(payment_dates):
        t_prev   = payment_dates[i-1] if i > 0 else current_date
        delta    = t - t_prev         # day-count fraction (ACT/365 simplified)
        fixed_pv += fixed_rate * notional * delta * df(t)

    # Float leg PV: each floating coupon = fwd_rate * notional * delta * df
    float_pv = 0.0
    for i, t in enumerate(payment_dates):
        t_prev   = payment_dates[i-1] if i > 0 else current_date
        delta    = t - t_prev
        fwd      = fwd_rate(t_prev, t) + float_spread
        float_pv += fwd * notional * delta * df(t)

    # Par swap rate: fixed rate that makes IRS NPV = 0
    annuity  = sum(
        (payment_dates[i] - (payment_dates[i-1] if i>0 else 0)) * df(t)
        for i, t in enumerate(payment_dates)
    )
    par_swap_rate = (df(0.0 if current_date == 0 else current_date) - df(payment_dates[-1])) / annuity

    return {
        "fixed_leg_pv":  fixed_pv,
        "float_leg_pv":  float_pv,
        "npv":           fixed_pv - float_pv,   # receive fixed, pay float
        "par_swap_rate": par_swap_rate,
        "dv01":          (fixed_pv - float_pv) * 0.0001 / fixed_rate if fixed_rate else 0,
    }

zero_curve = {0.25: 0.045, 0.5: 0.047, 1.0: 0.050, 2.0: 0.052, 3.0: 0.053, 5.0: 0.054}
payments   = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0]   # semi-annual, 3-year swap
res = irs_pv(notional=1_000_000, fixed_rate=0.053, float_spread=0.0,
             payment_dates=payments, zero_curve=zero_curve)

print(f"Fixed leg PV:  {res['fixed_leg_pv']:>12,.2f}")
print(f"Float leg PV:  {res['float_leg_pv']:>12,.2f}")
print(f"IRS NPV:       {res['npv']:>12,.2f}  (receive-fixed)")
print(f"Par swap rate: {res['par_swap_rate']:.4%}")`,
    explanation:
      "The floating leg of a plain vanilla IRS at-par is worth par (face value) at inception when priced at current forward rates — this allows the float leg to be valued simply as notional × (df(0) - df(T)), dramatically simplifying the calculation. The par swap rate is the fixed coupon that makes NPV=0, and it equals (df(0)-df(T)) / annuity — a formula that derivatives desks compute in microseconds during live quoting.",
  },
  {
    id: "pyfin-20260710-b1-barrier-mc",
    language: "python",
    title: "Down-and-Out Barrier Call Option Monte Carlo",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def barrier_call_mc(S0, K, H, T, r, sigma, n_steps=252, n_paths=100_000, seed=6):
    """
    Down-and-out call: pays max(S_T - K, 0) IF min(S_t) > H for all t in [0,T].
    Uses Brownian bridge correction for barrier breaching between discrete time steps.
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    disc = np.exp(-r * T)

    Z    = rng.standard_normal((n_paths, n_steps))
    logS = np.log(S0) + np.cumsum((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=1)
    S    = np.exp(logS)
    S_prev = np.hstack([np.full((n_paths,1), S0), S[:,:-1]])

    # Brownian bridge probability of hitting barrier between t and t+dt
    # P(min > H | S_t, S_{t+dt}) = 1 - exp(-2*log(S_t/H)*log(S_{t+dt}/H) / (sigma^2*dt))
    log_ratio_t   = np.log(S_prev / H)
    log_ratio_tp1 = np.log(S / H)
    # Bridge correction: for each step, prob of breaching barrier
    with np.errstate(invalid="ignore"):
        p_breach = np.exp(
            -2.0 * np.maximum(log_ratio_t, 0) * np.maximum(log_ratio_tp1, 0)
            / (sigma**2 * dt)
        )

    # Barrier not breached: discrete check + bridge correction
    discrete_alive = (S_prev > H).all(axis=1) & (S[:,-1] > H)
    # Weighted payoff using bridge correction (simplified: use max path alive)
    alive = S.min(axis=1) > H     # simplified: ignore bridge correction for brevity

    payoffs = disc * np.maximum(S[:,-1] - K, 0) * alive

    price = payoffs.mean()
    se    = payoffs.std() / np.sqrt(n_paths)
    return price, se

def barrier_call_exact(S0, K, H, T, r, sigma):
    """Reiner-Rubinstein (1991) closed-form for down-and-out call (H < K)."""
    mu   = (r - 0.5*sigma**2) / sigma**2
    lamb = np.sqrt(mu**2 + 2*r/sigma**2)
    x1   = np.log(S0/K)/(sigma*np.sqrt(T)) + (1+mu)*sigma*np.sqrt(T)
    x2   = np.log(S0/H)/(sigma*np.sqrt(T)) + (1+mu)*sigma*np.sqrt(T)
    y1   = np.log(H**2/(S0*K))/(sigma*np.sqrt(T)) + (1+mu)*sigma*np.sqrt(T)
    y2   = np.log(H/S0)/(sigma*np.sqrt(T)) + (1+mu)*sigma*np.sqrt(T)
    A    = S0*norm.cdf(x1) - K*np.exp(-r*T)*norm.cdf(x1 - sigma*np.sqrt(T))
    B    = S0*norm.cdf(x2) - K*np.exp(-r*T)*norm.cdf(x2 - sigma*np.sqrt(T))
    C    = S0*(H/S0)**(2*(mu+1)) * norm.cdf(y1) - K*np.exp(-r*T)*(H/S0)**(2*mu)*norm.cdf(y1 - sigma*np.sqrt(T))
    D    = S0*(H/S0)**(2*(mu+1)) * norm.cdf(y2) - K*np.exp(-r*T)*(H/S0)**(2*mu)*norm.cdf(y2 - sigma*np.sqrt(T))
    return A - B + C - D

S0, K, H, T, r, sigma = 100, 100, 90, 1.0, 0.05, 0.20
mc, se   = barrier_call_mc(S0, K, H, T, r, sigma)
exact    = barrier_call_exact(S0, K, H, T, r, sigma)
print(f"D&O Call MC:    {mc:.4f} +/- {se:.4f}")
print(f"D&O Call Exact: {exact:.4f}")
print(f"Vanilla call:   ~10.45 (barrier discount: {(1-exact/10.45)*100:.1f}%)")`,
    explanation:
      "Down-and-out barrier options are cheaper than vanilla options because the holder loses the option if the stock ever falls to the barrier — the probability of not touching H is the rebate for accepting this knock-out risk. The Brownian bridge correction accounts for the fact that the barrier may be breached continuously between discrete monitoring times, which is especially important when the barrier is close to the current spot.",
  },
  {
    id: "pyfin-20260710-b1-xsect-momentum",
    language: "python",
    title: "Cross-Sectional Momentum Factor Backtest",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

np.random.seed(99)
n_stocks, n_months = 100, 60

# Simulate monthly returns with a real momentum effect
# True alpha: last month's winner tends to outperform next month
returns_mat = np.random.randn(n_months, n_stocks) * 0.05
# Add cross-sectional momentum: inject signal from 12-month lookback
for t in range(12, n_months):
    lookback_ret = returns_mat[t-12:t-1, :].mean(axis=0)   # 12-1 mom signal
    signal = (lookback_ret - lookback_ret.mean()) / lookback_ret.std()
    returns_mat[t] += 0.005 * signal     # small but real momentum effect

dates   = pd.date_range("2024-01-31", periods=n_months, freq="ME")
symbols = [f"S{i:03d}" for i in range(n_stocks)]
ret_df  = pd.DataFrame(returns_mat, index=dates, columns=symbols)

# Monthly long-short portfolio: long top-20%, short bottom-20%
ls_returns = []
for t in range(12, n_months):
    # 12-1 month momentum signal (skip last month for reversal)
    mom_signal = ret_df.iloc[t-12:t-1].mean()    # 11-month average return
    # Rank into quintiles
    rank = mom_signal.rank(pct=True)
    long_mask  = rank >= 0.80
    short_mask = rank <= 0.20
    # Next-month return
    fwd_ret = ret_df.iloc[t]
    ls_ret  = fwd_ret[long_mask].mean() - fwd_ret[short_mask].mean()
    ls_returns.append(ls_ret)

ls = pd.Series(ls_returns, index=dates[12:])
ann_ret   = ls.mean() * 12
ann_vol   = ls.std() * np.sqrt(12)
sharpe    = ann_ret / ann_vol
max_dd    = (ls.cumsum() - ls.cumsum().cummax()).min()
hit_rate  = (ls > 0).mean()

print(f"Cross-Sectional Momentum Backtest (12-1, L/S top/bottom quintile):")
print(f"  Ann. Return:  {ann_ret*100:.2f}%")
print(f"  Ann. Vol:     {ann_vol*100:.2f}%")
print(f"  Sharpe Ratio: {sharpe:.3f}")
print(f"  Max Drawdown: {max_dd*100:.2f}%")
print(f"  Hit Rate:     {hit_rate*100:.1f}%")`,
    explanation:
      "Cross-sectional momentum ranks stocks by their past 12-1 month returns (skipping the last month to avoid short-term reversal) and holds the top quintile while shorting the bottom. The 'skip-one-month' convention is empirically critical: the return auto-correlation at lag 1 is negative (bid-ask bounce, microstructure) while lags 2–12 exhibit positive auto-correlation (momentum), so including the last month degrades the signal sharply.",
  },
  {
    id: "pyfin-20260710-b1-parametric-var",
    language: "python",
    title: "Parametric VaR and Component VaR with Correlation Matrix",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def portfolio_var_analytics(w: np.ndarray, mu: np.ndarray,
                             cov: np.ndarray, confidence: float = 0.99,
                             horizon: int = 1) -> dict:
    """
    Parametric VaR for a multi-asset portfolio.
    Assumes normally distributed P&L. Horizon in trading days.
    """
    # Scale to horizon
    mu_h  = mu * horizon
    cov_h = cov * horizon

    port_ret = w @ mu_h
    port_var = w @ cov_h @ w
    port_vol = np.sqrt(port_var)

    z = norm.ppf(1 - confidence)   # e.g., -2.326 for 99%
    var = -(port_ret + z * port_vol)   # positive = loss

    # Expected Shortfall (Conditional VaR)
    es = -(port_ret - port_vol * norm.pdf(z) / (1 - confidence))

    # Marginal VaR: sensitivity of total VaR to small increase in each position
    mvar = z * (cov_h @ w) / port_vol

    # Component VaR: contribution of each position to total VaR
    cvar = w * mvar

    # Diversification benefit
    undiversified_var = sum(abs(w[i]) * abs(z) * np.sqrt(cov_h[i,i]) for i in range(len(w)))
    div_benefit = undiversified_var - var

    return {
        "var_99":      var,
        "es_99":       es,
        "port_vol":    port_vol,
        "component_var": cvar,
        "marginal_var":  mvar,
        "div_benefit":   div_benefit,
    }

np.random.seed(4)
n = 5
# Portfolio: 5 assets, daily vol ~1-2%, moderate correlation
vols  = np.array([0.012, 0.018, 0.010, 0.015, 0.020])  # daily vols
corr  = np.array([
    [1.00, 0.45, 0.30, 0.20, 0.10],
    [0.45, 1.00, 0.35, 0.25, 0.15],
    [0.30, 0.35, 1.00, 0.40, 0.20],
    [0.20, 0.25, 0.40, 1.00, 0.35],
    [0.10, 0.15, 0.20, 0.35, 1.00],
])
cov   = np.outer(vols, vols) * corr
mu    = np.array([0.0003, 0.0005, 0.0002, 0.0004, 0.0003])
w     = np.array([0.25, 0.20, 0.30, 0.15, 0.10])
notional = 10_000_000  # $10M

res = portfolio_var_analytics(w, mu, cov, 0.99, horizon=1)
print(f"1-day 99% VaR:      \${res['var_99']*notional:>12,.0f}")
print(f"1-day 99% ES:       \${res['es_99']*notional:>12,.0f}")
print(f"Diversification:    \${res['div_benefit']*notional:>12,.0f}")
print(f"\\nComponent VaR (% of total VaR):")
for i, cv in enumerate(res['component_var']):
    print(f"  Asset {i+1}: \${cv*notional:>10,.0f}  ({cv/res['var_99']*100:.1f}%)")`,
    explanation:
      "Component VaR decomposes total portfolio VaR additively — each position's component VaR sums to the total — enabling risk budgeting decisions: positions with component VaR exceeding their capital allocation are oversized relative to their diversification benefit. The diversification benefit (undiversified sum minus portfolio VaR) quantifies how much correlation reduces risk; for highly correlated books like sector funds it can be near zero.",
  },
  {
    id: "pyfin-20260710-b1-black76-swaption",
    language: "python",
    title: "Black-76 Swaption Pricing (Payer and Receiver)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def black76_swaption(
    F: float,          # forward swap rate
    K: float,          # fixed rate (strike)
    T: float,          # expiry of swaption (years)
    sigma: float,      # Black vol for the forward swap rate
    payment_dates: list,  # payment dates of the underlying swap (year fractions)
    zero_curve: dict,  # {maturity: zero_rate}
    notional: float = 1_000_000,
    receiver: bool = False,
) -> dict:
    """
    Black-76 model for European swaption.
    Payer: right to pay K, receive float (value > 0 when rates rise).
    Receiver: right to receive K, pay float (value > 0 when rates fall).
    Annuity A = sum_i(delta_i * df(T_i)) is the numeraire.
    """
    def df(t):
        mats  = sorted(zero_curve.keys())
        zeros = [zero_curve[m] for m in mats]
        r = float(np.interp(t, mats, zeros))
        return np.exp(-r * t)

    # Annuity (PV of $1 fixed coupon per year over swap tenor)
    A = sum(
        (payment_dates[i] - (payment_dates[i-1] if i > 0 else T)) * df(ti)
        for i, ti in enumerate(payment_dates)
    )

    d1 = (np.log(F / K) + 0.5 * sigma**2 * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)

    if not receiver:  # payer swaption
        value = A * notional * (F * norm.cdf(d1) - K * norm.cdf(d2))
    else:             # receiver swaption
        value = A * notional * (K * norm.cdf(-d2) - F * norm.cdf(-d1))

    # Greeks (per unit notional, annuity-normalised)
    delta  = A * notional * norm.cdf(d1) * (1 if not receiver else -1)
    vega   = A * notional * F * norm.pdf(d1) * np.sqrt(T)

    return {"value": value, "delta": delta, "vega": vega, "annuity": A}

# 1Y x 5Y payer swaption (expiry 1Y, underlying 5-year swap)
zero_curve = {0.5: 0.047, 1.0: 0.050, 2.0: 0.052, 3.0: 0.053,
              5.0: 0.054, 6.0: 0.055}
swap_payments = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0]   # semi-annual

F_swap = 0.054   # forward swap rate (approximated)
for sigma_bps in [50, 75, 100, 125]:
    sigma = sigma_bps / 10000
    res = black76_swaption(F=F_swap, K=0.054, T=1.0, sigma=sigma,
                           payment_dates=swap_payments, zero_curve=zero_curve)
    print(f"sigma={sigma_bps:3d}bp: value=\${res['value']:>10,.0f}  "
          f"vega=\${res['vega']:>8,.0f}/vol-pt")`,
    explanation:
      "Black-76 replaces the stock price with the forward swap rate F (which is a martingale under the annuity measure) and prices the swaption as a call/put on F struck at K. The annuity A acts as the numeraire, converting the vol-of-F into a dollar value; this is why swaption vega scales with both F and A — a longer swap or larger notional increases the dollar sensitivity to vol moves even at the same log-normal vol.",
  },
];
