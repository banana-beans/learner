import { Snippet } from "./types";

export const pythonFinanceSnippets20260719B1: Snippet[] = [
  {
    id: "pyfin-20260719-b1-nss-fit",
    language: "python",
    tag: "finance",
    title: "Nelson-Siegel-Svensson Term Structure Fitting",
    code: `import numpy as np
from scipy.optimize import minimize

def nss_yield(t, beta0, beta1, beta2, beta3, tau1, tau2):
    """Nelson-Siegel-Svensson yield curve model."""
    e1 = np.exp(-t / tau1)
    e2 = np.exp(-t / tau2)
    f1 = (1 - e1) / (t / tau1)
    f2 = (1 - e2) / (t / tau2)
    return beta0 + beta1 * f1 + beta2 * (f1 - e1) + beta3 * (f2 - e2)

def fit_nss(maturities, yields):
    maturities = np.asarray(maturities, dtype=float)
    yields = np.asarray(yields, dtype=float)

    def loss(params):
        b0, b1, b2, b3, t1, t2 = params
        if t1 <= 0 or t2 <= 0:
            return 1e10
        fitted = nss_yield(maturities, b0, b1, b2, b3, t1, t2)
        return np.sum((fitted - yields) ** 2)

    x0 = [0.03, -0.02, 0.01, 0.005, 1.5, 5.0]
    bounds = [(None, None)] * 4 + [(0.01, 30), (0.01, 30)]
    res = minimize(loss, x0, method="L-BFGS-B", bounds=bounds)
    return res.x

# Example: US Treasury on-the-run maturities (years) and yields
mats = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30]
ylds = [0.053, 0.054, 0.052, 0.049, 0.048, 0.046, 0.045, 0.044, 0.044, 0.043]
params = fit_nss(mats, ylds)
print("NSS params:", params)

fine_grid = np.linspace(0.25, 30, 200)
curve = nss_yield(fine_grid, *params)
print(f"2Y: {nss_yield(2, *params):.4f}  10Y: {nss_yield(10, *params):.4f}")`,
    explanation:
      "Fits the Nelson-Siegel-Svensson 6-parameter term-structure model to observed Treasury yields. Beta0 is the long-run level, beta1 the slope, beta2/beta3 medium-term humps, and tau1/tau2 decay speeds. Used in central-bank research and risk systems for smooth, arbitrage-free interpolation and extrapolation of the yield curve.",
  },
  {
    id: "pyfin-20260719-b1-hull-white-mc",
    language: "python",
    tag: "finance",
    title: "Hull-White One-Factor Short-Rate Monte Carlo",
    code: `import numpy as np

def hull_white_mc(r0, a, sigma, T, n_steps, n_paths, seed=42):
    """
    Simulate Hull-White r(t) = theta(t) - a*r under risk-neutral measure.
    For simplicity theta is constant (Vasicek variant).
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    r = np.full(n_paths, r0)
    paths = np.zeros((n_steps + 1, n_paths))
    paths[0] = r0

    # Mean-reverting Euler-Maruyama
    for i in range(n_steps):
        dW = rng.standard_normal(n_paths) * np.sqrt(dt)
        # theta chosen to fit flat initial curve at r0
        theta = a * r0 + 0.5 * sigma ** 2 * (1 - np.exp(-2 * a * dt)) / (2 * a)
        r += (theta - a * r) * dt + sigma * dW
        paths[i + 1] = r

    return paths

def zcb_price_hw(paths, dt):
    """Zero-coupon bond price: E[exp(-integral r dt)]."""
    disc = np.exp(-np.sum(paths[1:], axis=0) * dt)
    return disc.mean(), disc.std() / np.sqrt(len(disc))

r0, a, sigma = 0.03, 0.1, 0.015
T, steps, paths = 1.0, 252, 50_000
sim = hull_white_mc(r0, a, sigma, T, steps, paths)
price, se = zcb_price_hw(sim, T / steps)
print(f"ZCB(1Y) = {price:.6f}  SE = {se:.6f}")
# Analytic Vasicek check
B = (1 - np.exp(-a * T)) / a
A = np.exp((r0 - sigma**2 / (2 * a**2)) * (B - T) - sigma**2 * B**2 / (4 * a))
print(f"Analytic = {A * np.exp(-B * r0):.6f}")`,
    explanation:
      "Simulates the Hull-White (Vasicek variant) short-rate model using Euler-Maruyama discretisation, then prices a zero-coupon bond as the average discount factor across paths. Compared against the closed-form Vasicek ZCB formula. Used in interest-rate desk systems for pricing caplets, swaptions, and callable bonds when term-structure fitting is layered on top.",
  },
  {
    id: "pyfin-20260719-b1-local-vol-dupire",
    language: "python",
    tag: "finance",
    title: "Dupire Local Volatility Surface from Market Prices",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(K_grid, T_grid, C, r=0.0, q=0.0):
    """
    Dupire formula: sigma_loc^2 = (dC/dT + (r-q)*K*dC/dK + q*C)
                                  / (0.5 * K^2 * d2C/dK2)
    C: call price grid [len(T_grid) x len(K_grid)]
    """
    # Fit smooth spline over (K, T)
    spline = RectBivariateSpline(T_grid, K_grid, C, kx=3, ky=3)

    results = []
    for i, T in enumerate(T_grid):
        row = []
        for j, K in enumerate(K_grid):
            dC_dT   = spline(T, K, dx=1, dy=0)[0, 0]
            dC_dK   = spline(T, K, dx=0, dy=1)[0, 0]
            d2C_dK2 = spline(T, K, dx=0, dy=2)[0, 0]
            C_val   = spline(T, K)[0, 0]

            numerator   = dC_dT + (r - q) * K * dC_dK + q * C_val
            denominator = 0.5 * K ** 2 * d2C_dK2
            lv2 = numerator / (denominator + 1e-12)
            row.append(max(lv2, 0.0) ** 0.5)
        results.append(row)

    return np.array(results)

# Toy example: flat implied vol surface => constant local vol
K = np.linspace(80, 120, 9)
T = np.array([0.25, 0.5, 1.0, 1.5, 2.0])
S0, sig = 100.0, 0.20

# Generate approximate call prices via Black-Scholes for a flat vol surface
from scipy.stats import norm
def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

C_grid = np.array([[bs_call(S0, k, t, 0.0, sig) for k in K] for t in T])
lv = dupire_local_vol(K, T, C_grid)
print("Local vol surface (should be ~0.20 everywhere):")
print(np.round(lv, 3))`,
    explanation:
      "Implements Dupire's formula to extract the local volatility surface from a grid of European call prices. Uses bicubic spline interpolation for smooth partial derivatives. The local vol surface is the unique diffusion that exactly reprices all vanilla options—used as the calibration target in exotic option pricing (barrier, Asian, autocallable) to ensure market-consistency.",
  },
  {
    id: "pyfin-20260719-b1-pca-yield-curve",
    language: "python",
    tag: "finance",
    title: "PCA on Yield Curve — Level, Slope, Curvature",
    code: `import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

# Simulate daily yield changes for 8 tenors
rng = np.random.default_rng(0)
tenors = ["3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y"]
n_obs = 500

# Correlated yield changes via Cholesky
corr = np.array([
    [1.0, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65],
    [0.95, 1.0, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70],
    [0.90, 0.95, 1.0, 0.97, 0.94, 0.90, 0.87, 0.83],
    [0.85, 0.90, 0.97, 1.0, 0.99, 0.97, 0.95, 0.92],
    [0.80, 0.85, 0.94, 0.99, 1.0, 0.99, 0.97, 0.95],
    [0.75, 0.80, 0.90, 0.97, 0.99, 1.0, 0.99, 0.98],
    [0.70, 0.75, 0.87, 0.95, 0.97, 0.99, 1.0, 0.99],
    [0.65, 0.70, 0.83, 0.92, 0.95, 0.98, 0.99, 1.0],
])
L = np.linalg.cholesky(corr)
Z = rng.standard_normal((n_obs, 8))
dy = (Z @ L.T) * 5  # bp moves

df = pd.DataFrame(dy, columns=tenors)

scaler = StandardScaler(with_std=False)
dy_centered = scaler.fit_transform(df)

pca = PCA(n_components=3)
pca.fit(dy_centered)

print("Explained variance:", np.round(pca.explained_variance_ratio_, 3))
print("\\nPC1 (level)     :", np.round(pca.components_[0], 3))
print("PC2 (slope)     :", np.round(pca.components_[1], 3))
print("PC3 (curvature) :", np.round(pca.components_[2], 3))

# Project today's yield move onto PCs
today = np.array([2, 1, -1, -2, -3, -3, -2, -1])
scores = pca.transform(today.reshape(1, -1))
print("\\nPC scores:", np.round(scores, 2))`,
    explanation:
      "Applies PCA to daily yield changes across 8 tenors to extract the classic three factors: PC1 (parallel shift / level), PC2 (slope / 2s10s), PC3 (curvature / butterfly). Together they explain ~95-99% of yield-curve variance. Used in DV01/KRD bucketing, macro-overlay strategies, and risk-model dimension reduction in fixed-income portfolios.",
  },
  {
    id: "pyfin-20260719-b1-fama-french",
    language: "python",
    tag: "finance",
    title: "Fama-French Three-Factor OLS Regression",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

rng = np.random.default_rng(42)
n = 252  # trading days

# Simulate factor returns
mkt_rf = rng.normal(0.0004, 0.012, n)   # market excess return
smb    = rng.normal(0.0001, 0.006, n)   # small-minus-big
hml    = rng.normal(0.0001, 0.006, n)   # high-minus-low

# True betas for a value-tilted small-cap portfolio
b_mkt, b_smb, b_hml = 1.15, 0.60, 0.40
alpha_true = 0.0002

ret_p = alpha_true + b_mkt * mkt_rf + b_smb * smb + b_hml * hml
ret_p += rng.normal(0, 0.004, n)  # idiosyncratic noise

# OLS regression
X = pd.DataFrame({"MKT-RF": mkt_rf, "SMB": smb, "HML": hml})
X = sm.add_constant(X)
model = sm.OLS(ret_p, X).fit()

print(model.summary2())

ann = 252
alpha_ann = model.params["const"] * ann
t_alpha = model.tvalues["const"]
ir = model.params["const"] / model.resid.std() * np.sqrt(ann)
print(f"\\nAnnualised alpha: {alpha_ann*100:.2f}%  t-stat: {t_alpha:.2f}  IR: {ir:.2f}")

# R-squared decomposition
resid_vol = model.resid.std() * np.sqrt(ann)
factor_vol = (model.fittedvalues.std() - 0) * np.sqrt(ann)
print(f"Factor-explained vol: {factor_vol*100:.1f}%  Residual vol: {resid_vol*100:.1f}%")`,
    explanation:
      "Runs a Fama-French 3-factor OLS regression to decompose portfolio returns into market, size (SMB), and value (HML) exposures, plus alpha. Reports annualised alpha, its t-statistic (significance), and information ratio. Standard in equity long/short attribution, factor-exposure reporting to investors, and academic backtesting to strip out systematic risk.",
  },
  {
    id: "pyfin-20260719-b1-engle-granger-coint",
    language: "python",
    tag: "finance",
    title: "Engle-Granger Cointegration and Pairs Trading Signal",
    code: `import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller

rng = np.random.default_rng(7)
n = 500

# Simulate cointegrated pair: Y = beta*X + I(0) error
common = np.cumsum(rng.normal(0, 1, n))   # shared I(1) trend
X = common + rng.normal(0, 0.5, n)
Y = 1.8 * common + 5.0 + rng.normal(0, 0.6, n)

# Step 1: OLS to estimate cointegrating vector
res = sm.OLS(Y, sm.add_constant(X)).fit()
beta_hat = res.params["x1"]
intercept = res.params["const"]
spread = Y - beta_hat * X - intercept

print(f"Estimated beta: {beta_hat:.4f}  (true 1.8)")
print(f"Spread stats: mean={spread.mean():.4f}  std={spread.std():.4f}")

# Step 2: ADF test on residuals
adf_stat, p_val, *_ = adfuller(spread, maxlag=5, autolag="AIC")
print(f"ADF stat: {adf_stat:.4f}  p-value: {p_val:.4f}")
if p_val < 0.05:
    print("Pair is cointegrated (reject unit root in spread) => tradeable!")
else:
    print("Pair may NOT be cointegrated at 5% level.")

# Step 3: Z-score trading signal
z = (spread - spread.mean()) / spread.std()
entry, exit_ = 2.0, 0.5
longs  = (z < -entry).sum()
shorts = (z >  entry).sum()
closes = (np.abs(z) < exit_).sum()
print(f"Entry signals: {longs} long, {shorts} short  |  Exits: {closes}")`,
    explanation:
      "Implements the Engle-Granger two-step cointegration test for pairs trading. Step 1 estimates the hedge ratio via OLS; step 2 runs an ADF test on the spread residuals to confirm stationarity. A stationary spread means the pair reverts to its mean, enabling systematic long/short entries when the z-score deviates beyond a threshold. Core to statistical arbitrage desks.",
  },
  {
    id: "pyfin-20260719-b1-cvxpy-mv",
    language: "python",
    tag: "finance",
    title: "Mean-Variance Optimisation via cvxpy",
    code: `import numpy as np
import cvxpy as cp

rng = np.random.default_rng(0)
n = 8  # assets

# Simulate expected returns and covariance
mu = rng.uniform(0.05, 0.15, n)           # annualised expected returns
A  = rng.standard_normal((n, n))
Sigma = (A.T @ A) / n + np.diag(rng.uniform(0.01, 0.04, n))  # PSD

# Decision variable: portfolio weights
w = cp.Variable(n)

# Efficient frontier: minimise variance for target return
target_rets = np.linspace(mu.min(), mu.max(), 20)
frontier_vols, frontier_rets = [], []

for r_target in target_rets:
    objective  = cp.Minimize(cp.quad_form(w, Sigma))
    constraints = [
        cp.sum(w) == 1,
        w >= 0,                # long-only
        mu @ w >= r_target,
    ]
    prob = cp.Problem(objective, constraints)
    prob.solve(solver=cp.CLARABEL, warm_start=True)
    if prob.status == "optimal":
        frontier_vols.append(np.sqrt(prob.value))
        frontier_rets.append(float(mu @ w.value))

frontier_vols = np.array(frontier_vols)
frontier_rets = np.array(frontier_rets)

# Max Sharpe (rf = 2%)
rf = 0.02
sharpe = (frontier_rets - rf) / frontier_vols
best = np.argmax(sharpe)
print(f"Max Sharpe portfolio: ret={frontier_rets[best]:.3f}  "
      f"vol={frontier_vols[best]:.3f}  SR={sharpe[best]:.3f}")

# Minimum variance portfolio
mv_idx = np.argmin(frontier_vols)
print(f"Min-vol portfolio:    ret={frontier_rets[mv_idx]:.3f}  "
      f"vol={frontier_vols[mv_idx]:.3f}")`,
    explanation:
      "Traces the efficient frontier for a long-only portfolio using cvxpy's convex QP solver. Each point minimises portfolio variance subject to a return constraint. The max-Sharpe portfolio is identified by scanning across the frontier. cvxpy's CLARABEL solver handles the quadratic objective cleanly and is suitable for up to ~1000 assets in production allocation systems.",
  },
  {
    id: "pyfin-20260719-b1-student-t-var",
    language: "python",
    tag: "finance",
    title: "Student-t Parametric VaR and Expected Shortfall",
    code: `import numpy as np
from scipy.stats import t as student_t
from scipy.optimize import minimize

def fit_student_t(returns):
    """MLE fit of location mu, scale sigma, degrees of freedom nu."""
    def neg_loglik(params):
        mu, log_sigma, log_nu = params
        sigma, nu = np.exp(log_sigma), np.exp(log_nu)
        return -np.sum(student_t.logpdf(returns, df=nu, loc=mu, scale=sigma))

    x0 = [returns.mean(), np.log(returns.std()), np.log(5)]
    res = minimize(neg_loglik, x0, method="Nelder-Mead",
                   options={"xatol": 1e-8, "fatol": 1e-8, "maxiter": 5000})
    mu, log_sigma, log_nu = res.x
    return mu, np.exp(log_sigma), np.exp(log_nu)

def student_var_es(mu, sigma, nu, alpha=0.99, portfolio_value=1_000_000):
    """Parametric VaR and ES for Student-t."""
    q = student_t.ppf(1 - alpha, df=nu)   # negative quantile (left tail)
    var = -(mu + sigma * q) * portfolio_value

    # ES = -E[r | r <= q_alpha] analytically
    pdf_q = student_t.pdf(q, df=nu)
    es_z  = -pdf_q / (1 - alpha) * (nu + q**2) / (nu - 1)
    es = -(mu + sigma * es_z) * portfolio_value
    return var, es

rng = np.random.default_rng(1)
# Simulate heavy-tailed returns (nu=5 t-distribution)
true_nu = 5.0
returns = student_t.rvs(df=true_nu, loc=0.0002, scale=0.012, size=1000,
                        random_state=rng)

mu_hat, sigma_hat, nu_hat = fit_student_t(returns)
print(f"Fitted: mu={mu_hat:.5f}  sigma={sigma_hat:.5f}  nu={nu_hat:.2f}")

var99, es99 = student_var_es(mu_hat, sigma_hat, nu_hat, alpha=0.99)
print(f"99% VaR = \${var99:,.0f}   ES = \${es99:,.0f}  (portfolio \$1M)")

# Compare with Gaussian (will understate tail risk)
from scipy.stats import norm
q_n = norm.ppf(0.01)
var_gauss = -(mu_hat + sigma_hat * q_n) * 1_000_000
print(f"Gaussian 99% VaR = \${var_gauss:,.0f}  (understates by "
      f"\${var99-var_gauss:,.0f})")`,
    explanation:
      "Fits a Student-t distribution to daily returns via MLE, then computes parametric 99% VaR and Expected Shortfall analytically. The Student-t captures fat tails that the Gaussian underestimates, important for fixed-income HY books and equity crash scenarios. ES (CVaR) is the coherent risk measure required by Basel III/IV for internal model approval.",
  },
  {
    id: "pyfin-20260719-b1-max-drawdown",
    language: "python",
    tag: "finance",
    title: "Maximum Drawdown, Calmar Ratio, and Underwater Curve",
    code: `import numpy as np
import pandas as pd

def drawdown_analysis(returns):
    """Comprehensive drawdown metrics for a return series."""
    cum = (1 + np.asarray(returns)).cumprod()
    rolling_max = np.maximum.accumulate(cum)
    dd = cum / rolling_max - 1          # drawdown at each point (<=0)

    max_dd = dd.min()

    # Duration of worst drawdown
    peak_idx = np.argmin(dd)
    # Find previous peak
    peak_before = np.argmax(cum[:peak_idx + 1])
    # Find recovery (next time we exceed previous peak)
    above = np.where(cum[peak_idx:] >= rolling_max[peak_idx])[0]
    recovery_idx = peak_idx + above[0] if len(above) else len(cum) - 1
    duration = recovery_idx - peak_before

    # Calmar ratio: CAGR / |MaxDD|
    n = len(returns)
    cagr = cum[-1] ** (252 / n) - 1
    calmar = cagr / abs(max_dd) if max_dd != 0 else np.nan

    return {
        "max_drawdown":   max_dd,
        "peak_idx":       int(peak_before),
        "trough_idx":     int(peak_idx),
        "recovery_idx":   int(recovery_idx),
        "duration_days":  int(duration),
        "cagr":           cagr,
        "calmar":         calmar,
        "underwater":     dd,
    }

rng = np.random.default_rng(99)
# Simulate a strategy with a few drawdown episodes
rets = rng.normal(0.0004, 0.012, 1260)
# Inject a crisis episode
rets[500:540] -= 0.015

metrics = drawdown_analysis(rets)
print(f"Max Drawdown  : {metrics['max_drawdown']*100:.2f}%")
print(f"Trough date   : day {metrics['trough_idx']}")
print(f"Duration      : {metrics['duration_days']} trading days")
print(f"CAGR          : {metrics['cagr']*100:.2f}%")
print(f"Calmar Ratio  : {metrics['calmar']:.2f}")`,
    explanation:
      "Computes maximum drawdown, its duration (peak-to-recovery), CAGR, and Calmar ratio (CAGR / max drawdown) for a return series. Returns the full underwater equity curve for plotting. Drawdown analysis is mandatory in hedge-fund marketing decks, risk reports, and live trading system monitoring—especially for tail-risk characterisation of systematic strategies.",
  },
  {
    id: "pyfin-20260719-b1-factor-momentum",
    language: "python",
    tag: "finance",
    title: "Cross-Sectional Momentum Factor Backtest",
    code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(3)
n_assets = 50
n_days   = 756  # 3 years

# Simulate daily returns for 50 assets
rets = pd.DataFrame(
    rng.standard_normal((n_days, n_assets)) * 0.015
    + rng.standard_normal((1, n_assets)) * 0.0002,  # cross-sectional mean dispersion
    columns=[f"A{i:02d}" for i in range(n_assets)],
)

lookback  = 252  # 12-month momentum (skip last month)
skip_days = 21
holding   = 21

portfolio_rets = []

for t in range(lookback + skip_days, n_days - holding, holding):
    # Formation period: [t - lookback - skip, t - skip]
    cum_ret = (1 + rets.iloc[t - lookback - skip_days: t - skip_days]).prod() - 1
    # Rank and z-score
    z = (cum_ret - cum_ret.mean()) / (cum_ret.std() + 1e-9)
    # Dollar-neutral long top / short bottom deciles
    n_leg = max(1, n_assets // 10)
    longs  = z.nlargest(n_leg).index
    shorts = z.nsmallest(n_leg).index
    w = pd.Series(0.0, index=rets.columns)
    w[longs]  =  1 / n_leg
    w[shorts] = -1 / n_leg

    # Holding period return
    hold_rets = rets.iloc[t: t + holding]
    port_ret  = (hold_rets @ w).sum()
    portfolio_rets.append(port_ret)

portfolio_rets = np.array(portfolio_rets)
ann_ret  = portfolio_rets.mean() * (252 / holding)
ann_vol  = portfolio_rets.std()  * np.sqrt(252 / holding)
sharpe   = ann_ret / ann_vol
cum_ret  = np.prod(1 + portfolio_rets) - 1

print(f"Periods    : {len(portfolio_rets)}")
print(f"Ann Return : {ann_ret*100:.2f}%")
print(f"Ann Vol    : {ann_vol*100:.2f}%")
print(f"Sharpe     : {sharpe:.2f}")
print(f"Total Ret  : {cum_ret*100:.2f}%")`,
    explanation:
      "Implements a textbook cross-sectional momentum strategy: rank assets on 12-month trailing return (skipping last month to avoid short-term reversal), go long top decile, short bottom decile, hold for one month, then reform. The dollar-neutral construction isolates the momentum factor. Common in quant equity pod setups and factor-model construction.",
  },
  {
    id: "pyfin-20260719-b1-bachelier",
    language: "python",
    tag: "finance",
    title: "Bachelier Model for Normal Implied Volatility",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

def bachelier_call(F, K, T, sigma_n):
    """Bachelier (normal) call price: sigma_n is in price units per sqrt(year)."""
    d = (F - K) / (sigma_n * np.sqrt(T))
    return (F - K) * norm.cdf(d) + sigma_n * np.sqrt(T) * norm.pdf(d)

def bachelier_put(F, K, T, sigma_n):
    d = (F - K) / (sigma_n * np.sqrt(T))
    return (K - F) * norm.cdf(-d) + sigma_n * np.sqrt(T) * norm.pdf(d)

def bachelier_implied_vol(price, F, K, T, option_type="call"):
    """Invert Bachelier formula for normal implied vol via Brent's method."""
    func = bachelier_call if option_type == "call" else bachelier_put
    intrinsic = max(0, (F - K) if option_type == "call" else (K - F))
    if price <= intrinsic:
        return np.nan

    def objective(sigma_n):
        return func(F, K, T, sigma_n) - price

    try:
        return brentq(objective, 1e-6, 10 * abs(F - K) / np.sqrt(T) + 1e-4,
                      xtol=1e-8)
    except ValueError:
        return np.nan

# Example: rates option (ATM swaption normalised to rate units)
F = 0.04    # forward rate
strikes = np.array([0.02, 0.03, 0.04, 0.05, 0.06])
T = 1.0
sigma_n_true = 0.005   # 50bps normal vol

calls = [bachelier_call(F, K, T, sigma_n_true) for K in strikes]
print("Strike  Market Price  Implied Normal Vol")
for K, c in zip(strikes, calls):
    iv = bachelier_implied_vol(c, F, K, T)
    print(f"  {K:.2f}    {c*10000:.2f}bp        {iv*10000:.2f}bp")`,
    explanation:
      "Implements the Bachelier (normal) model, preferred over Black-Scholes for interest rate options where rates can go negative. Derives call/put prices assuming arithmetic Brownian motion and inverts numerically for normal implied volatility. Standard on rates desks for quoting caps, floors, and swaptions in terms of basis-point normal vol.",
  },
  {
    id: "pyfin-20260719-b1-bootstrap-sharpe-ci",
    language: "python",
    tag: "finance",
    title: "Bootstrap Confidence Interval for Sharpe Ratio",
    code: `import numpy as np

def sharpe_ratio(returns, ann=252):
    mu  = returns.mean()
    std = returns.std(ddof=1)
    return (mu / std) * np.sqrt(ann) if std > 0 else np.nan

def bootstrap_sharpe_ci(returns, n_boot=10_000, alpha=0.05, seed=42):
    rng = np.random.default_rng(seed)
    n = len(returns)
    boot_sharpes = np.empty(n_boot)
    for i in range(n_boot):
        sample = rng.choice(returns, size=n, replace=True)
        boot_sharpes[i] = sharpe_ratio(sample)

    # Bias-corrected percentile CI
    observed = sharpe_ratio(returns)
    lo = np.percentile(boot_sharpes, 100 * alpha / 2)
    hi = np.percentile(boot_sharpes, 100 * (1 - alpha / 2))

    # Lo's (2002) asymptotic SE for IID
    # SE ≈ sqrt((1 + SR^2/2) / T)
    sr = observed
    se_lo = np.sqrt((1 + 0.5 * (sr / np.sqrt(252)) ** 2) / n) * np.sqrt(252)

    return {
        "sharpe":    observed,
        "boot_mean": boot_sharpes.mean(),
        "boot_se":   boot_sharpes.std(),
        "ci_lo":     lo,
        "ci_hi":     hi,
        "lo_se":     se_lo,
    }

rng = np.random.default_rng(55)
# True SR ≈ 1.0 by construction
returns = rng.normal(1.0 / 252, 1.0 / np.sqrt(252), 252 * 3)

result = bootstrap_sharpe_ci(returns)
print(f"Observed Sharpe : {result['sharpe']:.3f}")
print(f"Bootstrap mean  : {result['boot_mean']:.3f}  SE={result['boot_se']:.3f}")
print(f"95% CI          : [{result['ci_lo']:.3f}, {result['ci_hi']:.3f}]")
print(f"Lo (2002) SE    : {result['lo_se']:.3f}")`,
    explanation:
      "Computes a bootstrap confidence interval for the Sharpe ratio by resampling daily returns with replacement. Also reports Lo's (2002) closed-form asymptotic standard error. Because Sharpe ratios estimated on short track records are noisy (SE ~ 0.3 per year of data), proper CIs are essential for manager evaluation, strategy selection, and avoiding multiple-testing overfitting.",
  },
  {
    id: "pyfin-20260719-b1-regime-markov",
    language: "python",
    tag: "finance",
    title: "Two-State Markov Chain Regime Transition",
    code: `import numpy as np
from scipy.optimize import minimize

def hmm_em_2state(obs, n_iter=200, seed=0):
    """
    Baum-Welch EM for 2-state Gaussian HMM.
    obs: 1-D return series
    Returns: pi, A, mu, sigma
    """
    rng = np.random.default_rng(seed)
    K = 2
    T = len(obs)

    # Init
    pi = np.array([0.6, 0.4])
    A  = np.array([[0.97, 0.03], [0.05, 0.95]])
    mu    = np.array([0.0005, -0.002])
    sigma = np.array([0.008, 0.020])

    def gauss_pdf(x, m, s):
        return np.exp(-0.5 * ((x - m) / s) ** 2) / (s * np.sqrt(2 * np.pi))

    for _ in range(n_iter):
        # E-step: forward-backward
        B = np.column_stack([gauss_pdf(obs, mu[k], sigma[k]) for k in range(K)])
        # Forward
        alpha = np.zeros((T, K))
        alpha[0] = pi * B[0]
        alpha[0] /= alpha[0].sum() + 1e-300
        scales = np.zeros(T)
        scales[0] = alpha[0].sum()
        for t in range(1, T):
            alpha[t] = (alpha[t - 1] @ A) * B[t]
            s = alpha[t].sum()
            scales[t] = s
            alpha[t] /= s + 1e-300
        # Backward
        beta = np.ones((T, K))
        for t in range(T - 2, -1, -1):
            beta[t] = (A * B[t + 1] * beta[t + 1]).sum(axis=1)
            beta[t] /= beta[t].sum() + 1e-300

        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True) + 1e-300
        xi = np.zeros((T - 1, K, K))
        for t in range(T - 1):
            xi[t] = alpha[t][:, None] * A * B[t + 1] * beta[t + 1]
            xi[t] /= xi[t].sum() + 1e-300

        # M-step
        pi = gamma[0]
        A  = xi.sum(axis=0) / (gamma[:-1].sum(axis=0)[:, None] + 1e-300)
        for k in range(K):
            g = gamma[:, k]
            mu[k]    = (g * obs).sum() / (g.sum() + 1e-300)
            sigma[k] = np.sqrt((g * (obs - mu[k])**2).sum() / (g.sum() + 1e-300))

    viterbi = np.argmax(gamma, axis=1)
    return pi, A, mu, sigma, viterbi

rng = np.random.default_rng(7)
T = 500
states_true = np.zeros(T, dtype=int)
states_true[200:280] = 1  # crisis episode
obs = np.where(states_true == 0,
               rng.normal(0.0005, 0.008, T),
               rng.normal(-0.002, 0.022, T))

pi, A, mu, sigma, decoded = hmm_em_2state(obs)
print(f"Transition matrix:\\n{np.round(A, 4)}")
print(f"State 0: mu={mu[0]:.5f}  sigma={sigma[0]:.5f}")
print(f"State 1: mu={mu[1]:.5f}  sigma={sigma[1]:.5f}")
acc = (decoded == states_true).mean()
print(f"State-decoding accuracy: {acc:.2%}")`,
    explanation:
      "Implements Baum-Welch EM for a 2-state Gaussian HMM to identify bull/bear (or normal/crisis) regimes in a return series. Uses scaled forward-backward for numerical stability. The transition matrix entries give expected regime durations. Used in regime-conditional allocation overlays and risk management systems to adjust hedge ratios during crisis states.",
  },
  {
    id: "pyfin-20260719-b1-bond-convexity",
    language: "python",
    tag: "finance",
    title: "Fixed-Income Duration, Convexity, and DV01",
    code: `import numpy as np
from scipy.optimize import brentq

def bond_price(ytm, coupon, face, n_periods, freq=2):
    """Price a fixed-coupon bond given YTM (annual, semi-annual compounding)."""
    c = coupon * face / freq
    r = ytm / freq
    t = np.arange(1, n_periods * freq + 1)
    cf = np.full(n_periods * freq, c)
    cf[-1] += face
    return (cf / (1 + r) ** t).sum()

def duration_convexity(ytm, coupon, face, n_periods, freq=2):
    r = ytm / freq
    c = coupon * face / freq
    t = np.arange(1, n_periods * freq + 1)
    cf = np.full(n_periods * freq, c)
    cf[-1] += face
    pv_cf = cf / (1 + r) ** t
    P = pv_cf.sum()

    # Macaulay duration (in semi-annual periods -> convert to years)
    mac_dur = (t * pv_cf).sum() / P / freq

    # Modified duration
    mod_dur = mac_dur / (1 + r)

    # Convexity (in years^2)
    conv = ((t * (t + 1) * pv_cf).sum() / P) / (freq ** 2 * (1 + r) ** 2)

    dv01 = mod_dur * P / 10_000  # dollar change per 1bp

    return mac_dur, mod_dur, conv, dv01, P

# 5-year 4% coupon bond, YTM=5%, face=1000
ytm, coup, face, yrs = 0.05, 0.04, 1000, 5
mac, mod, conv, dv01, price = duration_convexity(ytm, coup, face, yrs)
print(f"Price           : {price:.4f}")
print(f"Macaulay Dur    : {mac:.4f} yrs")
print(f"Modified Dur    : {mod:.4f}")
print(f"Convexity       : {conv:.4f}")
print(f"DV01            : \${dv01:.4f}")

# P&L approximation for +100bp shock
dy = 0.01
dp_approx = -mod * price * dy + 0.5 * conv * price * dy ** 2
dp_exact  = bond_price(ytm + dy, coup, face, yrs) - price
print(f"\\nP&L +100bp:  approx={dp_approx:.4f}  exact={dp_exact:.4f}")`,
    explanation:
      "Computes Macaulay and modified duration, convexity, and DV01 from first principles using present-value cash-flow weights. Demonstrates the first-order (duration) and second-order (convexity) P&L approximation for a parallel rate shift. Convexity is positive for straight bonds—buyers benefit from large moves in either direction. Used in fixed-income portfolio hedging and PVBP laddering.",
  },
  {
    id: "pyfin-20260719-b1-rebalance-cost",
    language: "python",
    tag: "finance",
    title: "Portfolio Rebalancing with Transaction Cost Minimisation",
    code: `import numpy as np
import cvxpy as cp

def rebalance_with_costs(w_current, w_target, prices, port_value,
                          bid_ask_bps=5, market_impact_bps_per_pct=10):
    """
    Minimise tracking error to target subject to transaction-cost-adjusted
    objective. Returns optimal trades and net portfolio.
    bid_ask_bps: half-spread in basis points
    market_impact_bps_per_pct: linear impact cost per 1% turnover
    """
    n = len(w_current)
    w = cp.Variable(n)

    # Trade vector (can be long or short)
    trade = w - w_current

    # Cost model: bid-ask + linear market impact
    ba_cost   = bid_ask_bps / 10_000 * cp.norm1(trade)
    mi_cost   = market_impact_bps_per_pct / 10_000 * cp.sum_squares(trade) * 100

    # Objective: minimise distance to target + costs (lambda trades off)
    lam = 0.5
    obj = cp.Minimize(
        cp.sum_squares(w - w_target) + lam * (ba_cost + mi_cost)
    )
    constraints = [cp.sum(w) == 1, w >= 0]
    prob = cp.Problem(obj, constraints)
    prob.solve(solver=cp.CLARABEL)

    w_opt = np.array(w.value)
    trades = w_opt - w_current
    turnover = np.abs(trades).sum() / 2  # one-way

    # Cost estimate
    gross_trade = np.abs(trades) * port_value
    cost = (bid_ask_bps / 10_000) * gross_trade.sum()
    cost += (market_impact_bps_per_pct / 10_000) * (np.abs(trades) * 100) @ np.abs(trades) * port_value

    return w_opt, trades, turnover, cost

rng = np.random.default_rng(5)
n = 10
w_current = rng.dirichlet(np.ones(n))
w_target  = rng.dirichlet(np.ones(n))
prices    = rng.uniform(10, 200, n)
port_val  = 10_000_000

w_opt, trades, turnover, cost = rebalance_with_costs(
    w_current, w_target, prices, port_val)

print(f"One-way turnover  : {turnover*100:.2f}%")
print(f"Estimated cost    : \${cost:,.0f}")
print(f"Max weight change : {np.abs(trades).max()*100:.2f}%")
print(f"Tracking err (pre): {np.linalg.norm(w_current - w_target)*100:.2f}%")
print(f"Tracking err (opt): {np.linalg.norm(w_opt - w_target)*100:.2f}%")`,
    explanation:
      "Frames portfolio rebalancing as a convex optimisation that balances tracking error to a target weight vector against transaction costs (bid-ask spread + linear market impact). The lambda parameter controls the trade-off. Real-world extensions add tax-loss harvesting constraints, security-level lot size, and quadratic impact from Almgren-Chriss. Used in ETF rebalancing engines and systematic allocation systems.",
  },
  {
    id: "pyfin-20260719-b1-arima-forecast",
    language: "python",
    tag: "finance",
    title: "ARIMA Model for Return Forecasting with statsmodels",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller
from statsmodels.tsa.arima.model import ARIMA

rng = np.random.default_rng(20)
n = 500

# Simulate AR(2) stationary process
# r_t = 0.3*r_{t-1} - 0.15*r_{t-2} + eps
phi1, phi2 = 0.3, -0.15
eps = rng.normal(0, 0.01, n)
r = np.zeros(n)
for t in range(2, n):
    r[t] = phi1 * r[t-1] + phi2 * r[t-2] + eps[t]

series = pd.Series(r)

# 1. ADF test for stationarity
adf_stat, p_val, *_ = adfuller(series)
print(f"ADF stat: {adf_stat:.3f}  p-value: {p_val:.4f}  "
      f"({'stationary' if p_val < 0.05 else 'non-stationary'})")

# 2. Fit ARIMA(2,0,0) — no differencing needed since stationary
model = ARIMA(series, order=(2, 0, 0))
fit   = model.fit()
print(fit.summary().tables[1])

# 3. Forecast 5 steps ahead
fc = fit.get_forecast(steps=5)
fc_mean = fc.predicted_mean
fc_ci   = fc.conf_int(alpha=0.05)
print("\\n5-step forecast:")
for i in range(5):
    print(f"  t+{i+1}: {fc_mean.iloc[i]:.5f}  "
          f"95% CI [{fc_ci.iloc[i, 0]:.5f}, {fc_ci.iloc[i, 1]:.5f}]")

# 4. Out-of-sample backtesting (last 50 obs)
n_oos = 50
predictions = []
for t in range(n - n_oos, n):
    m = ARIMA(series.iloc[:t], order=(2, 0, 0)).fit()
    predictions.append(m.forecast(1).iloc[0])
mse = np.mean((np.array(predictions) - series.iloc[-n_oos:].values) ** 2)
print(f"\\nOOS MSE: {mse:.8f}  RMSE: {mse**0.5:.6f}")`,
    explanation:
      "Fits an ARIMA(2,0,0) model to a stationary return series using statsmodels, verifies stationarity with the ADF test, and performs a rolling out-of-sample backtest for the last 50 observations. Used for short-horizon return prediction in high-frequency pairs, spread trading, and FX carry signals where autocorrelation structure is exploitable.",
  },
  {
    id: "pyfin-20260719-b1-vol-surface-rnd",
    language: "python",
    tag: "finance",
    title: "Risk-Neutral Density from Option Prices (Breeden-Litzenberger)",
    code: `import numpy as np
from scipy.stats import norm
from scipy.interpolate import CubicSpline

def bs_call_price(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

def rnd_breeden_litzenberger(S, strikes, implied_vols, T, r, n_fine=500):
    """
    Breeden-Litzenberger: RND = e^{rT} * d^2 C / dK^2
    Requires smooth call prices as a function of K.
    """
    # Compute call prices on given strikes
    calls = np.array([bs_call_price(S, K, T, r, iv)
                       for K, iv in zip(strikes, implied_vols)])

    # Fit cubic spline to (K, C(K))
    cs = CubicSpline(strikes, calls, bc_type="natural")

    # Fine grid for second derivative
    K_fine = np.linspace(strikes[0], strikes[-1], n_fine)
    d2C_dK2 = cs(K_fine, 2)  # second derivative

    rnd = np.exp(r * T) * d2C_dK2
    rnd = np.maximum(rnd, 0)  # clip numerical negatives

    # Normalise to integrate to 1
    dk = K_fine[1] - K_fine[0]
    rnd /= (rnd * dk).sum()

    return K_fine, rnd

S, T, r = 100.0, 1.0, 0.03
strikes = np.array([70, 80, 85, 90, 95, 100, 105, 110, 115, 120, 130])
# Skewed smile: higher vol for lower strikes (typical equity)
ivols = np.array([0.35, 0.30, 0.27, 0.25, 0.23, 0.22, 0.21, 0.21, 0.22, 0.23, 0.26])

K_rnd, rnd = rnd_breeden_Litzenberger = rnd_breeden_litzenberger(
    S, strikes, ivols, T, r)

print("Risk-neutral density summary:")
print(f"  Mode: {K_rnd[np.argmax(rnd)]:.2f}")
dk = K_rnd[1] - K_rnd[0]
mean_rnd = (K_rnd * rnd * dk).sum()
var_rnd  = ((K_rnd - mean_rnd)**2 * rnd * dk).sum()
print(f"  RN mean: {mean_rnd:.2f}   RN std: {var_rnd**0.5:.2f}")
# Risk-neutral prob of S > 110
prob_gt110 = (rnd[K_rnd > 110] * dk).sum()
print(f"  RN P(S > 110): {prob_gt110:.3f}")`,
    explanation:
      "Extracts the risk-neutral density (RND) of the terminal asset price from European option prices using the Breeden-Litzenberger formula: the second derivative of call price with respect to strike equals the RND. Uses cubic spline interpolation for smooth derivatives. Practitioners use RNDs for tail-risk assessment, probability of touching barriers, and comparing market-implied distributions to physical ones.",
  },
  {
    id: "pyfin-20260719-b1-kelly-leverage",
    language: "python",
    tag: "finance",
    title: "Kelly Criterion with Estimation Error and Fractional Kelly",
    code: `import numpy as np
from scipy.stats import t as student_t

def kelly_full(mu, sigma2):
    """Full Kelly fraction for continuous returns."""
    return mu / sigma2

def kelly_with_uncertainty(returns, n_boot=5000, seed=0):
    """
    Bayesian-style Kelly accounting for parameter uncertainty.
    Returns distribution of Kelly fractions across bootstrap samples.
    """
    rng = np.random.default_rng(seed)
    n = len(returns)
    ks = []
    for _ in range(n_boot):
        sample = rng.choice(returns, n, replace=True)
        mu  = sample.mean()
        s2  = sample.var(ddof=1)
        if s2 > 0:
            ks.append(mu / s2)
    return np.array(ks)

def sharpe_to_kelly_approx(sr_annual, vol_annual):
    """Kelly ≈ SR / vol for leverage in the continuous limit."""
    return sr_annual / vol_annual

# Simulate a strategy with SR ≈ 0.8
rng = np.random.default_rng(42)
daily_mu  = 0.0004
daily_sig = 0.012
returns   = rng.normal(daily_mu, daily_sig, 252 * 3)

# Full Kelly estimate on full sample
mu_hat = returns.mean()
s2_hat = returns.var(ddof=1)
k_full = kelly_full(mu_hat, s2_hat)
print(f"Full Kelly fraction  : {k_full:.2f}x leverage")

# Bootstrap distribution
k_boot = kelly_with_uncertainty(returns)
print(f"Bootstrap Kelly      : {k_boot.mean():.2f} +/- {k_boot.std():.2f}")
print(f"5th pct Kelly        : {np.percentile(k_boot, 5):.2f}")

# Fractional Kelly (50% of estimate to guard against over-leverage)
frac = 0.5
print(f"\\n50% fractional Kelly : {frac * k_full:.2f}x")
print(f"25% fractional Kelly : {0.25 * k_full:.2f}x")

# Geometric growth under fractional Kelly
for f in [1.0, frac, 0.25]:
    g = daily_mu * f - 0.5 * s2_hat * f**2
    print(f"f={f:.2f}  daily geometric growth: {g*10000:.2f}bp")`,
    explanation:
      "Computes full Kelly leverage and its bootstrap distribution to quantify estimation uncertainty. Shows that the true Kelly is estimated with high variance on short track records (SE grows as 1/sqrt(T)), making fractional Kelly (50% or 25%) a robust practical choice. Also derives the geometric growth rate at different leverage fractions to illustrate the Kelly trade-off between growth and drawdown risk.",
  },
  {
    id: "pyfin-20260719-b1-sobol-qmc",
    language: "python",
    tag: "finance",
    title: "Quasi-Monte Carlo with Sobol Sequences for Option Pricing",
    code: `import numpy as np
from scipy.stats import norm
from scipy.stats.qmc import Sobol

def mc_asian_call(S0, K, r, sigma, T, n_steps, n_paths, use_sobol=True, seed=42):
    """Asian arithmetic-average call via (Quasi-)Monte Carlo."""
    if use_sobol:
        sampler = Sobol(d=n_steps, scramble=True, seed=seed)
        # Request next power-of-2 above n_paths for Sobol
        m = int(np.ceil(np.log2(n_paths)))
        u = sampler.random_base2(m)[:n_paths]
        Z = norm.ppf(np.clip(u, 1e-10, 1 - 1e-10))
    else:
        rng = np.random.default_rng(seed)
        Z = rng.standard_normal((n_paths, n_steps))

    dt = T / n_steps
    drift = (r - 0.5 * sigma**2) * dt
    diffusion = sigma * np.sqrt(dt)

    log_S = np.log(S0) + np.cumsum(drift + diffusion * Z, axis=1)
    S_paths = np.exp(log_S)
    avg_S   = S_paths.mean(axis=1)
    payoffs = np.maximum(avg_S - K, 0)
    price   = np.exp(-r * T) * payoffs.mean()
    se      = np.exp(-r * T) * payoffs.std() / np.sqrt(n_paths)
    return price, se

S0, K, r, sigma, T = 100, 100, 0.03, 0.20, 1.0
steps = 52  # weekly monitoring

print("Paths    MC price      SE(MC)     QMC price     SE(QMC)")
for n in [256, 1024, 4096]:
    p_mc,  se_mc  = mc_asian_call(S0, K, r, sigma, T, steps, n, False)
    p_qmc, se_qmc = mc_asian_call(S0, K, r, sigma, T, steps, n, True)
    print(f"{n:5d}    {p_mc:.4f}  {se_mc:.4f}      {p_qmc:.4f}    {se_qmc:.4f}")`,
    explanation:
      "Compares standard Monte Carlo with Quasi-Monte Carlo using scrambled Sobol sequences for pricing an arithmetic-average Asian call. Sobol sequences fill space more uniformly than pseudo-random numbers, achieving O(log(N)^d / N) convergence vs O(1/sqrt(N)) for MC—often giving 10-100x variance reduction in practice. Essential for high-dimensional exotics where MC SE budgets are expensive.",
  },
  {
    id: "pyfin-20260719-b1-heston-mc-py",
    language: "python",
    tag: "finance",
    title: "Heston Stochastic Volatility Monte Carlo (Python)",
    code: `import numpy as np

def heston_mc(S0, v0, K, T, r, kappa, theta, xi, rho,
              n_steps=100, n_paths=50_000, seed=42):
    """
    Full-truncation Euler scheme for Heston SDE.
    dS = r*S dt + sqrt(v)*S dW1
    dv = kappa*(theta - v) dt + xi*sqrt(v) dW2
    corr(dW1, dW2) = rho
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    sqrt_dt = np.sqrt(dt)

    S = np.full(n_paths, S0, dtype=float)
    v = np.full(n_paths, v0, dtype=float)

    for _ in range(n_steps):
        Z1 = rng.standard_normal(n_paths)
        Z2 = rho * Z1 + np.sqrt(1 - rho**2) * rng.standard_normal(n_paths)
        v_pos = np.maximum(v, 0)  # full truncation
        S  = S  * np.exp((r - 0.5 * v_pos) * dt + np.sqrt(v_pos) * sqrt_dt * Z1)
        v  = v  + kappa * (theta - v_pos) * dt + xi * np.sqrt(v_pos) * sqrt_dt * Z2

    disc = np.exp(-r * T)
    # European call payoff
    payoffs = np.maximum(S - K, 0)
    price = disc * payoffs.mean()
    se    = disc * payoffs.std() / np.sqrt(n_paths)
    return price, se

# Calibrated Heston params (typical S&P 500 values)
params = dict(
    S0=100, v0=0.04, K=100, T=1.0, r=0.03,
    kappa=2.0, theta=0.04, xi=0.3, rho=-0.7,
)
price, se = heston_mc(**params)
print(f"Heston call price: {price:.4f}  SE: {se:.4f}")

# Sanity: BS price with vol = sqrt(v0) should be close
from scipy.stats import norm
def bs_call(S, K, T, r, sig):
    d1 = (np.log(S/K) + (r + 0.5*sig**2)*T) / (sig*np.sqrt(T))
    d2 = d1 - sig*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
bs = bs_call(100, 100, 1.0, 0.03, np.sqrt(0.04))
print(f"BS (flat vol)    : {bs:.4f}  (should differ due to vol-of-vol / skew)")`,
    explanation:
      "Implements the Heston stochastic volatility model via full-truncation Euler discretisation in Python. The full-truncation (max(v,0)) handles the boundary at v=0 without reflection, consistent with the CIR process. Negative rho produces the volatility skew observed in equity markets. Used for pricing vol-sensitive exotics (barrier, cliquet, autocall) when the implied vol surface rejects flat-vol models.",
  },
  {
    id: "pyfin-20260719-b1-iv-surface-smile",
    language: "python",
    tag: "finance",
    title: "Implied Volatility Surface Construction via SVI Parametrisation",
    code: `import numpy as np
from scipy.optimize import minimize

def svi_raw(k, a, b, rho, m, sigma):
    """
    SVI (Stochastic Volatility Inspired) total variance w(k) = a + b*(rho*(k-m) + sqrt((k-m)^2 + sigma^2))
    k = log-moneyness = log(K/F)
    Returns total implied variance w = sigma_iv^2 * T
    """
    disc = np.sqrt((k - m)**2 + sigma**2)
    return a + b * (rho * (k - m) + disc)

def svi_no_arb_check(a, b, rho, m, sigma):
    """Basic SVI calendar-spread and butterfly no-arb checks."""
    # b >= 0, |rho| < 1, sigma > 0
    # a + b*sigma*sqrt(1-rho^2) >= 0 (min total var >= 0)
    min_w = a + b * sigma * np.sqrt(1 - rho**2)
    return b >= 0 and abs(rho) < 1 and sigma > 0 and min_w >= 0

def fit_svi(log_strikes, total_variances):
    """Fit SVI parameters to observed implied total variance slice."""
    def loss(params):
        a, b, rho, m, sigma = params
        if not svi_no_arb_check(a, b, rho, m, sigma):
            return 1e10
        fitted = svi_raw(log_strikes, a, b, rho, m, sigma)
        return np.sum((fitted - total_variances)**2)

    x0 = [0.04, 0.04, -0.3, 0.0, 0.1]
    bounds = [(0, None), (0, None), (-0.999, 0.999),
              (None, None), (1e-4, None)]
    res = minimize(loss, x0, method="L-BFGS-B", bounds=bounds)
    return res.x

# Example: equity smile for T=1Y
T = 1.0
K_over_F = np.array([0.7, 0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.2])
k = np.log(K_over_F)
iv_market = np.array([0.35, 0.30, 0.27, 0.25, 0.23, 0.22, 0.21, 0.205, 0.20])
w_market = iv_market**2 * T

params = fit_svi(k, w_market)
a, b, rho, m, sigma = params
print(f"SVI params: a={a:.5f}  b={b:.5f}  rho={rho:.4f}  m={m:.4f}  sig={sigma:.4f}")

k_fine = np.linspace(k[0], k[-1], 100)
w_fit  = svi_raw(k_fine, *params)
iv_fit = np.sqrt(w_fit / T)
print(f"ATM fit IV: {svi_raw(0, *params)**0.5:.4f}  (market: {iv_market[5]:.4f})")`,
    explanation:
      "Fits the SVI (Stochastic Volatility Inspired) parametric smile model to implied total variance across log-moneyness. SVI has 5 parameters and is designed to be free of butterfly arbitrage under mild conditions. Used on equity derivative desks for smooth cross-strike interpolation, generating local vol surfaces, and pricing exotic payoffs that are sensitive to the full smile shape.",
  },
  {
    id: "pyfin-20260719-b1-kalman-pairs-py",
    language: "python",
    tag: "finance",
    title: "Kalman Filter for Dynamic Hedge Ratio in Pairs Trading",
    code: `import numpy as np

def kalman_regression(y, x, delta=1e-4, var_obs=0.001):
    """
    Online Kalman filter that tracks time-varying beta in y = beta*x + alpha + eps.
    State: [alpha, beta]^T, evolves as random walk with noise variance delta.
    """
    n = len(y)
    # State mean and covariance
    beta_hat = np.zeros((n, 2))  # [alpha, beta]
    P = np.eye(2)                # state covariance

    # Noise matrices
    Q = delta / (1 - delta) * np.eye(2)  # process noise
    R = var_obs                            # observation noise (scalar)

    betas = np.zeros((n, 2))
    spreads = np.zeros(n)

    for t in range(n):
        H = np.array([[1.0, x[t]]])     # observation matrix (1x2)

        # Predict
        P = P + Q

        # Update
        S = H @ P @ H.T + R
        K = (P @ H.T) / S[0, 0]        # Kalman gain (2x1)

        y_pred = float(H @ beta_hat[t]) if t > 0 else y[0]
        innov  = y[t] - y_pred

        if t > 0:
            beta_hat[t] = beta_hat[t - 1] + K.flatten() * innov
        P = (np.eye(2) - K @ H) @ P

        betas[t]   = beta_hat[t]
        spreads[t] = y[t] - beta_hat[t, 0] - beta_hat[t, 1] * x[t]

    return betas, spreads

# Simulate a pair with slowly drifting beta
rng = np.random.default_rng(13)
n = 600
beta_true = 1.5 + 0.3 * np.sin(np.linspace(0, 4 * np.pi, n))  # slowly varying
common = np.cumsum(rng.normal(0, 1, n))
x = common + rng.normal(0, 0.5, n)
y = beta_true * common + 3.0 + rng.normal(0, 0.8, n)

betas, spreads = kalman_regression(y, x, delta=1e-3)

print(f"Beta tracked (last 10): {betas[-10:, 1].round(3)}")
print(f"True beta  (last 10) : {beta_true[-10:].round(3)}")
print(f"Spread std: {spreads[50:].std():.4f}")

z = (spreads - spreads[50:].mean()) / (spreads[50:].std() + 1e-9)
entries = np.abs(z) > 2
print(f"Entry signals: {entries.sum()} ({entries.mean()*100:.1f}% of days)")`,
    explanation:
      "Applies a Kalman filter to track a time-varying hedge ratio (beta) for pairs trading. The state vector [alpha, beta] evolves as a random walk, and the Kalman gain adaptively weights new observations. This handles regime shifts in the cointegrating relationship that static OLS misses. Produces a stationary spread for z-score signalling. Standard in stat-arb desks trading ETF pairs, commodity spreads, and FX crosses.",
  },
];
