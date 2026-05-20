import type { Snippet } from "./types";

export const pythonFinanceSnippets20260519B1: Snippet[] = [
  {
    id: "pyfin-20260519-b1-multiindex",
    language: "python",
    title: "MultiIndex panel: xs() and loc slicing",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

dates = pd.date_range("2024-01-01", periods=4, freq="ME")
symbols = ["AAPL", "GOOG", "MSFT"]

idx = pd.MultiIndex.from_product([dates, symbols], names=["date", "symbol"])
rng = np.random.default_rng(42)
df = pd.DataFrame(
    {"close": rng.uniform(100, 500, len(idx)),
     "volume": rng.integers(1_000_000, 5_000_000, len(idx))},
    index=idx,
)

# Cross-section: all symbols for one date
jan_slice = df.xs(pd.Timestamp("2024-01-31"), level="date")
print("January cross-section:\\n", jan_slice)

# Single asset across all dates
aapl_ts = df.loc[(slice(None), "AAPL"), "close"]
print("\\nAAPL close series:\\n", aapl_ts)

# Unstacked: rows=dates, cols=symbols
unstacked = df["close"].unstack(level="symbol")
print("\\nUnstacked close:\\n", unstacked)`,
    explanation:
      "A date×symbol MultiIndex is the canonical layout for panel return data in pandas; xs() gives fast cross-sectional slices while loc with slice(None) selects a single asset's time series without dropping levels.",
  },
  {
    id: "pyfin-20260519-b1-pivot-factor",
    language: "python",
    title: "Pivot factor loadings from long-format data",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(0)
assets = ["AAPL", "GOOG", "MSFT", "JPM", "GS"]
factors = ["Mkt-RF", "SMB", "HML", "Mom"]

# Long-format: one row per (asset, factor) pair
rows = [(a, f, rng.normal(0, 0.5)) for a in assets for f in factors]
long_df = pd.DataFrame(rows, columns=["asset", "factor", "loading"])

# Pivot to asset x factor loading matrix
loading_matrix = long_df.pivot_table(
    index="asset", columns="factor", values="loading", aggfunc="mean"
)
print("Loading matrix (asset x factor):\\n", loading_matrix.round(3))

# Portfolio factor exposure (equal-weight)
weights = pd.Series(1 / len(assets), index=assets)
portfolio_factor_exp = loading_matrix.T @ weights
print("\\nPortfolio factor exposures:\\n", portfolio_factor_exp.round(3))`,
    explanation:
      "pivot_table collapses long-format regression output (one row per asset-factor pair) into a compact asset×factor matrix, enabling vectorised computation of portfolio-level factor exposures via a single matrix multiply.",
  },
  {
    id: "pyfin-20260519-b1-expanding-sharpe",
    language: "python",
    title: "Expanding-window running Sharpe ratio",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(7)
n = 252
dates = pd.date_range("2024-01-01", periods=n, freq="B")
returns = pd.Series(rng.normal(0.0005, 0.012, n), index=dates, name="daily_ret")

ann = np.sqrt(252)

# expanding() grows the window from the first observation forward
running_mean = returns.expanding().mean()
running_std  = returns.expanding().std()
running_sharpe = (running_mean / running_std) * ann

# Require at least 20 observations for a meaningful estimate
running_sharpe = running_sharpe.where(returns.expanding().count() >= 20)

print(running_sharpe.dropna().tail(10).round(3))
print(f"\\nFinal annualised Sharpe: {running_sharpe.iloc[-1]:.3f}")
print(f"True full-period Sharpe: {(returns.mean()/returns.std())*ann:.3f}")`,
    explanation:
      "An expanding window accumulates all history to date, revealing how the Sharpe estimate drifts as new data arrives — crucial for detecting when a strategy's edge is degrading in real-time rather than only in hindsight.",
  },
  {
    id: "pyfin-20260519-b1-mv-frontier",
    language: "python",
    title: "Markowitz mean-variance efficient frontier",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

rng = np.random.default_rng(1)
n = 4
mu = np.array([0.08, 0.12, 0.10, 0.07])
A = rng.standard_normal((n, n))
cov = A.T @ A / n * 0.01   # random positive-definite covariance

def portfolio_vol(w, cov):
    return np.sqrt(w @ cov @ w)

def min_vol_for_return(target, mu, cov):
    n = len(mu)
    res = minimize(
        portfolio_vol, x0=np.ones(n)/n, args=(cov,),
        method="SLSQP",
        constraints=[
            {"type": "eq", "fun": lambda w: w @ mu - target},
            {"type": "eq", "fun": lambda w: w.sum() - 1},
        ],
        bounds=[(0, 1)] * n,
    )
    return res.fun, res.x

targets = np.linspace(mu.min(), mu.max(), 20)
frontier = [min_vol_for_return(r, mu, cov) for r in targets]
vols, weights = zip(*frontier)

rf = 0.04
print(f"{'Target Ret':>12} {'Min Vol':>10} {'Sharpe':>10}")
for r, v in zip(targets, vols):
    sr = (r - rf) / v
    print(f"{r:12.3f} {v:10.4f} {sr:10.3f}")`,
    explanation:
      "The efficient frontier is traced by solving a constrained quadratic program at each target return level; adding long-only bounds restricts to feasible no-short-selling portfolios and typically shrinks the frontier, lowering peak Sharpe ratios relative to the unconstrained case.",
  },
  {
    id: "pyfin-20260519-b1-cvxpy-minvol",
    language: "python",
    title: "cvxpy minimum-variance long-only portfolio",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

rng = np.random.default_rng(3)
n = 6
A = rng.standard_normal((n, n))
Sigma = (A.T @ A) / n * 0.02  # positive definite covariance

w = cp.Variable(n)

objective = cp.Minimize(cp.quad_form(w, Sigma))
constraints = [
    cp.sum(w) == 1,   # fully invested
    w >= 0,           # long-only
]

prob = cp.Problem(objective, constraints)
prob.solve(solver=cp.CLARABEL)

print(f"Status: {prob.status}")
print(f"Min portfolio vol: {np.sqrt(prob.value):.4f}")
print("Optimal weights:")
for i, wi in enumerate(w.value):
    print(f"  Asset {i+1}: {wi:.4f}")

ew = np.ones(n) / n
ew_var = ew @ Sigma @ ew
print(f"\\nEqual-weight vol:  {np.sqrt(ew_var):.4f}")
print(f"Variance reduction: {(1 - prob.value/ew_var)*100:.1f}%")`,
    explanation:
      "cvxpy expresses portfolio optimisation as a disciplined convex program — quad_form(w, Sigma) guarantees a globally optimal solution, and swapping constraints (adding sector limits, turnover penalties) requires only changing the constraints list, not the solver.",
  },
  {
    id: "pyfin-20260519-b1-pca-factors",
    language: "python",
    title: "PCA risk decomposition of equity returns",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

rng = np.random.default_rng(9)
T, N = 252, 10
assets = [f"A{i}" for i in range(1, N+1)]

# Simulate returns driven by 2 latent factors + idiosyncratic noise
F = rng.standard_normal((T, 2))
B = rng.standard_normal((N, 2)) * 0.5
eps = rng.standard_normal((T, N)) * 0.01
returns = pd.DataFrame(F @ B.T + eps, columns=assets)

scaler = StandardScaler()
R_scaled = scaler.fit_transform(returns)

pca = PCA(n_components=4)
pca.fit(R_scaled)

print("Explained variance ratio by component:")
for i, ev in enumerate(pca.explained_variance_ratio_):
    cum = pca.explained_variance_ratio_[:i+1].sum()
    print(f"  PC{i+1}: {ev:.3f}  cumulative: {cum:.3f}")

# Factor loadings
loadings = pd.DataFrame(pca.components_.T, index=assets,
                         columns=[f"PC{i+1}" for i in range(4)])
print("\\nFactor loadings (asset x PC):\\n", loadings.round(3))

# Factor returns
factor_returns = pd.DataFrame(pca.transform(R_scaled),
                               columns=[f"PC{i+1}" for i in range(4)])
print("\\nFactor return stats:\\n", factor_returns.describe().round(3))`,
    explanation:
      "PCA on a returns matrix surfaces latent risk factors without labelling them — the first PC typically explains 40–70% of cross-sectional variance and proxies the market factor, revealing how much idiosyncratic risk remains after hedging it out.",
  },
  {
    id: "pyfin-20260519-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel yield curve fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import curve_fit

# Observed yields (annualised %) at these maturities (years)
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30], dtype=float)
yields_obs = np.array([5.30, 5.25, 5.00, 4.70, 4.50, 4.30, 4.35, 4.40, 4.55, 4.60])

def nelson_siegel(T, beta0, beta1, beta2, tau):
    ratio   = T / tau
    factor2 = (1 - np.exp(-ratio)) / ratio
    factor3 = factor2 - np.exp(-ratio)
    return beta0 + beta1 * factor2 + beta2 * factor3

p0    = [4.5, -0.5, 1.0, 2.0]
lower = [0,   -5,  -5, 0.1]
upper = [15,   5,   5, 30]

params, _ = curve_fit(nelson_siegel, maturities, yields_obs,
                      p0=p0, bounds=(lower, upper))
beta0, beta1, beta2, tau = params

print(f"beta0 (long-run level): {beta0:.4f}")
print(f"beta1 (slope):          {beta1:.4f}")
print(f"beta2 (curvature):      {beta2:.4f}")
print(f"tau   (decay factor):   {tau:.4f}")

fitted = nelson_siegel(maturities, *params)
rmse = np.sqrt(np.mean((yields_obs - fitted) ** 2))
print(f"\\nFit RMSE (bps): {rmse * 100:.2f}")`,
    explanation:
      "Nelson-Siegel decomposes the yield curve into level (beta0), slope (beta1), and hump/curvature (beta2) — the three betas have direct macro interpretations (long rate, term premium, curvature premium) and tau controls where the hump peaks, making it the central bank and risk manager's preferred parsimonious model.",
  },
  {
    id: "pyfin-20260519-b1-heston-mc",
    language: "python",
    title: "Heston stochastic volatility Monte Carlo",
    tag: "finance",
    code: `import numpy as np

def heston_mc_call(S0, K, T, r, kappa, theta, xi, rho, V0,
                   n_paths=50_000, n_steps=252, seed=42):
    """
    Euler-Maruyama discretisation of Heston (1993):
      dS = r*S*dt + sqrt(V)*S*dW1
      dV = kappa*(theta-V)*dt + xi*sqrt(V)*dW2,  corr(dW1,dW2)=rho
    Full truncation: replace V with max(V,0) before sqrt.
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    S = np.full(n_paths, float(S0))
    V = np.full(n_paths, float(V0))
    sqrt_dt = np.sqrt(dt)

    for _ in range(n_steps):
        Z1 = rng.standard_normal(n_paths)
        Z2 = rho * Z1 + np.sqrt(1 - rho**2) * rng.standard_normal(n_paths)
        V_pos = np.maximum(V, 0)          # full truncation
        S *= np.exp((r - 0.5*V_pos)*dt + np.sqrt(V_pos)*sqrt_dt*Z1)
        V   = V_pos + kappa*(theta - V_pos)*dt + xi*np.sqrt(V_pos)*sqrt_dt*Z2

    payoff = np.maximum(S - K, 0)
    price  = np.exp(-r * T) * payoff.mean()
    se     = np.exp(-r * T) * payoff.std() / np.sqrt(n_paths)
    return price, se

price, se = heston_mc_call(
    S0=100, K=100, T=1.0, r=0.05,
    kappa=2.0, theta=0.04, xi=0.3, rho=-0.7, V0=0.04,
)
print(f"Heston call: {price:.4f}  (95% CI ±{1.96*se:.4f})")`,
    explanation:
      "The Heston model captures the volatility smile by letting variance follow a mean-reverting CIR process correlated with spot; negative rho (leverage effect) makes low-strike implied vols higher, matching equity skew that Black-Scholes cannot reproduce.",
  },
  {
    id: "pyfin-20260519-b1-sabr-calib",
    language: "python",
    title: "SABR smile calibration (Hagan approximation)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    """Hagan et al. (2002) SABR implied normal vol approximation."""
    if abs(F - K) < 1e-10:
        # ATM formula
        term2 = 1 + ((1-beta)**2/24 * alpha**2 / F**(2-2*beta)
                     + rho*beta*nu*alpha / (4*F**(1-beta))
                     + (2-3*rho**2)/24 * nu**2) * T
        return alpha / (F**(1-beta)) * term2
    z   = nu/alpha * (F*K)**((1-beta)/2) * np.log(F/K)
    x_z = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    A   = alpha / ((F*K)**((1-beta)/2) *
                   (1 + (1-beta)**2/24*np.log(F/K)**2
                      + (1-beta)**4/1920*np.log(F/K)**4))
    B   = z / (x_z + 1e-15)
    C   = 1 + ((1-beta)**2/24*alpha**2/(F*K)**(1-beta)
               + rho*beta*nu*alpha/(4*(F*K)**((1-beta)/2))
               + (2-3*rho**2)/24*nu**2) * T
    return A * B * C

F, T, beta = 100.0, 1.0, 0.5
strikes  = np.array([80., 90., 95., 100., 105., 110., 120.])
mkt_vols = np.array([0.28, 0.24, 0.22,  0.20,  0.205, 0.215, 0.245])

def loss(params):
    alpha, rho, nu = params
    if alpha <= 0 or nu <= 0 or abs(rho) >= 1:
        return 1e6
    model_vols = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes])
    return np.sum((model_vols - mkt_vols)**2)

res = minimize(loss, x0=[0.20, -0.3, 0.4], method="Nelder-Mead",
               options={"xatol":1e-8, "fatol":1e-10, "maxiter":10000})
alpha, rho, nu = res.x
fitted = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes])
print(f"Calibrated: alpha={alpha:.4f}  rho={rho:.4f}  nu={nu:.4f}")
print(f"\\n{'Strike':>8} {'Mkt':>8} {'SABR':>8} {'Err bps':>9}")
for K, m, f in zip(strikes, mkt_vols, fitted):
    print(f"{K:8.1f} {m:8.4f} {f:8.4f} {(f-m)*10000:9.1f}")`,
    explanation:
      "SABR is calibrated to the full vol smile by fitting alpha (ATM vol level), rho (skew), and nu (vol-of-vol / kurtosis) while beta is fixed from market convention; three parameters typically fit 5–7 strikes to within 1–2 bps, and the model extrapolates smoothly to extreme strikes.",
  },
  {
    id: "pyfin-20260519-b1-hull-white",
    language: "python",
    title: "Hull-White short-rate Monte Carlo",
    tag: "finance",
    code: `import numpy as np

def hull_white_zcb(a, b, sigma, r0, T, n_paths=100_000, n_steps=252, seed=0):
    """
    Simulate Hull-White (Vasicek) short rate:
      dr = a*(b - r)*dt + sigma*dW
    Price zero-coupon bond as E[exp(-integral r dt)].
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    r  = np.full(n_paths, r0, dtype=float)
    integral = np.zeros(n_paths)

    for _ in range(n_steps):
        dW = rng.standard_normal(n_paths) * np.sqrt(dt)
        integral += r * dt
        r += a*(b - r)*dt + sigma*dW

    discount = np.exp(-integral)
    price = discount.mean()
    se    = discount.std() / np.sqrt(n_paths)

    # Analytic Vasicek ZCB for comparison
    B_t = (1 - np.exp(-a*T)) / a
    A_t = np.exp((b - sigma**2/(2*a**2))*(B_t - T) - sigma**2*B_t**2/(4*a))
    analytic = A_t * np.exp(-B_t * r0)

    return price, se, analytic

a, b, sigma, r0, T = 0.3, 0.05, 0.01, 0.03, 5.0
price, se, analytic = hull_white_zcb(a, b, sigma, r0, T)
print(f"MC price:       {price:.6f}  (±{1.96*se:.6f})")
print(f"Analytic price: {analytic:.6f}")
print(f"Implied yield:  {-np.log(price)/T:.4f}")`,
    explanation:
      "Hull-White extends Vasicek by allowing time-varying mean reversion to fit the initial yield curve exactly; even the simpler constant-parameter version here has an analytic ZCB price, which serves as ground truth to validate the Euler-Maruyama discretisation error.",
  },
  {
    id: "pyfin-20260519-b1-cds-hazard",
    language: "python",
    title: "CDS par spread and hazard rate bootstrap",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def cds_par_spread(h, T, r, R=0.40, freq=4):
    """Flat-hazard-rate CDS par spread."""
    dt    = 1 / freq
    times = np.arange(dt, T + dt/2, dt)
    df    = np.exp(-r * times)
    surv  = np.exp(-h * times)
    surv_prev = np.concatenate([[1.0], surv[:-1]])
    prot_leg  = (1 - R) * np.sum(df * (surv_prev - surv))
    prem_leg  = dt * np.sum(df * surv)
    return prot_leg / prem_leg

r, R, observed_spread = 0.04, 0.40, 0.012   # 120 bps

h_implied = brentq(
    lambda h: cds_par_spread(h, T=5, r=r, R=R) - observed_spread,
    a=1e-6, b=0.5
)
print(f"Implied flat hazard rate: {h_implied:.6f}  ({h_implied*1e4:.1f} bps)")

for T in [1, 2, 3, 5, 10]:
    surv = np.exp(-h_implied * T)
    print(f"  Survival prob {T:2d}Y: {surv:.4f}  default prob: {1-surv:.4f}")

risky_annuity = sum(
    0.25 * np.exp(-r*t) * np.exp(-h_implied*t)
    for t in np.arange(0.25, 5.25, 0.25)
)
print(f"\\nRisky annuity (5Y): {risky_annuity:.4f}")
print(f"Premium PV (approx): {observed_spread * risky_annuity:.4f}")`,
    explanation:
      "Bootstrapping a flat hazard rate from a par CDS spread is a root-finding problem — the hazard rate is the constant default intensity that equates protection leg (expected loss given default) to premium leg; the risky annuity converts a spread DV01 to a P&L dollar amount.",
  },
  {
    id: "pyfin-20260519-b1-kalman-pairs",
    language: "python",
    title: "Kalman filter dynamic hedge ratio (pairs trading)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(5)
T = 500

# Simulated cointegrated pair; true beta drifts slowly
beta_true = np.cumsum(rng.normal(0, 0.005, T)) + 1.5
y = np.cumsum(rng.normal(0, 1, T))           # asset 1 (random walk)
x = beta_true * y + rng.normal(0, 0.5, T)    # asset 2

# 1-D Kalman filter to track beta
# State: beta.  Observation: x_t = beta_t * y_t + noise
Q = 1e-4    # process noise (how fast beta drifts)
R = 0.25    # observation noise variance

beta_est = np.zeros(T)
P        = np.zeros(T)      # estimation error variance
beta_est[0], P[0] = 1.0, 1.0

for t in range(1, T):
    # Predict
    beta_pred = beta_est[t-1]
    P_pred    = P[t-1] + Q
    # Update
    H  = y[t]
    S  = H**2 * P_pred + R
    K  = P_pred * H / S          # Kalman gain
    beta_est[t] = beta_pred + K * (x[t] - H * beta_pred)
    P[t]        = (1 - K * H) * P_pred

spread = x - beta_est * y
print(f"Spread mean: {spread.mean():.4f}  std: {spread.std():.4f}")
print(f"Beta tracking MAE: {np.abs(beta_est - beta_true).mean():.4f}")

df = pd.DataFrame({"beta_true": beta_true[-5:], "beta_kalman": beta_est[-5:]})
print("\\nBeta comparison (last 5):\\n", df.round(3))`,
    explanation:
      "The Kalman filter updates the hedge ratio recursively as new prices arrive — Q controls how quickly beta may drift (higher Q = more adaptive but noisier), while R encodes trust in the observations; this Q/R trade-off is equivalent to choosing the bandwidth of an EWMA hedge ratio estimator.",
  },
  {
    id: "pyfin-20260519-b1-kelly",
    language: "python",
    title: "Kelly criterion position sizing",
    tag: "finance",
    code: `import numpy as np

# Binary bet parameters
p_win    = 0.55
win_mult = 1.0    # win 100% of stake
loss_mult = 1.0   # lose 100% of stake

q = 1 - p_win
kelly_full = p_win - q / (win_mult / loss_mult)
kelly_half = kelly_full / 2

print(f"Full Kelly fraction: {kelly_full:.4f}")
print(f"Half Kelly fraction: {kelly_half:.4f}")

rng = np.random.default_rng(11)
n_bets   = 1000
outcomes = rng.random(n_bets) < p_win  # True = win

def simulate(fraction):
    wealth = np.ones(n_bets + 1)
    for i, win in enumerate(outcomes):
        if win:
            wealth[i+1] = wealth[i] * (1 + fraction * win_mult)
        else:
            wealth[i+1] = wealth[i] * (1 - fraction * loss_mult)
    return wealth

print(f"\\n{'Strategy':>14} {'Final':>12} {'Max DD':>10}")
for name, f in [("Full Kelly", kelly_full), ("Half Kelly", kelly_half),
                ("25% Kelly",  kelly_full*0.25), ("Fixed 10%", 0.10)]:
    w    = simulate(f)
    peak = np.maximum.accumulate(w)
    mdd  = ((w - peak) / peak).min()
    print(f"{name:>14} {w[-1]:12.2f} {mdd:10.4f}")`,
    explanation:
      "The Kelly criterion maximises long-run log wealth, but full Kelly bets cause violent drawdowns because short-run variance is high; half-Kelly trades roughly half the growth rate for a dramatic reduction in volatility and ruin probability, which is why practitioners routinely fractionalise their Kelly bets.",
  },
  {
    id: "pyfin-20260519-b1-fama-french",
    language: "python",
    title: "Fama-French 3-factor alpha attribution",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

rng = np.random.default_rng(13)
T = 120  # monthly observations

# Simulate FF3 factor returns (monthly)
mkt_rf = rng.normal(0.005, 0.045, T)
smb    = rng.normal(0.001, 0.030, T)
hml    = rng.normal(0.002, 0.025, T)

# Portfolio with known factor loadings + alpha
true_alpha  = 0.002   # 24 bps/month
true_betas  = [1.1, 0.4, 0.3]
rf          = 0.0003
port_ret    = (rf + true_alpha
               + true_betas[0]*mkt_rf
               + true_betas[1]*smb
               + true_betas[2]*hml
               + rng.normal(0, 0.015, T))

excess_ret = port_ret - rf
X = sm.add_constant(np.column_stack([mkt_rf, smb, hml]))
X_df = pd.DataFrame(X, columns=["const", "Mkt-RF", "SMB", "HML"])
model = sm.OLS(excess_ret, X_df).fit()

print(model.summary().tables[1])
print(f"\\nAnnualised alpha: {model.params['const']*12:.4f}")
print(f"Alpha t-stat:     {model.tvalues['const']:.3f}")
ir = model.params['const'] / model.resid.std() * np.sqrt(12)
print(f"Information ratio: {ir:.3f}")`,
    explanation:
      "Running OLS with Fama-French factors separates alpha (manager skill) from passive beta returns; a t-stat above ~2 is required for statistical significance, but with only 120 months even a true 24 bps/month alpha is hard to detect against idiosyncratic noise — the curse of small samples in finance.",
  },
  {
    id: "pyfin-20260519-b1-hmm-regime",
    language: "python",
    title: "Gaussian HMM regime detection",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from hmmlearn.hmm import GaussianHMM

rng = np.random.default_rng(17)
T = 500

# Two-regime process: low-vol bull, high-vol bear
trans   = np.array([[0.97, 0.03], [0.05, 0.95]])
params  = [{"mu": 0.0008, "sig": 0.008},
           {"mu": -0.001, "sig": 0.022}]
state = 0
regime_true = np.zeros(T, dtype=int)
r = np.zeros(T)
for t in range(T):
    state = rng.choice(2, p=trans[state])
    regime_true[t] = state
    r[t] = rng.normal(params[state]["mu"], params[state]["sig"])

# Fit GaussianHMM (Baum-Welch EM)
model = GaussianHMM(n_components=2, covariance_type="full",
                    n_iter=200, random_state=42)
model.fit(r.reshape(-1, 1))

viterbi = model.predict(r.reshape(-1, 1))
# Align label (HMM may swap state numbers)
if model.means_[0, 0] > model.means_[1, 0]:
    viterbi = 1 - viterbi

df = pd.DataFrame({"ret": r, "true": regime_true, "hmm": viterbi})
accuracy = (df["true"] == df["hmm"]).mean()
print(f"State means: {model.means_.flatten()}")
print(f"State stds:  {np.sqrt(model.covars_.flatten())}")
print(f"Accuracy: {accuracy:.3f}")
print("\\nConfusion matrix:")
print(pd.crosstab(df["true"], df["hmm"]))`,
    explanation:
      "A Gaussian HMM learns regime-switching dynamics purely from returns using EM (Baum-Welch) — the Viterbi algorithm decodes the most probable hidden-state path, providing a principled alternative to ad-hoc threshold rules for switching between bull and bear allocations.",
  },
  {
    id: "pyfin-20260519-b1-control-variates",
    language: "python",
    title: "Control variates: geometric Asian as CV for arithmetic",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def asian_option_cv(S0, K, T, r, sigma, n_paths=100_000, n_steps=252, seed=0):
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    disc = np.exp(-r * T)

    Z = rng.standard_normal((n_steps, n_paths))
    increments = (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z
    log_S = np.log(S0) + np.cumsum(increments, axis=0)
    S     = np.exp(log_S)                    # shape (n_steps, n_paths)

    arith_avg  = S.mean(axis=0)
    geom_avg   = np.exp(np.log(S).mean(axis=0))

    arith_pay  = np.maximum(arith_avg - K, 0)
    geom_pay   = np.maximum(geom_avg  - K, 0)

    # Closed-form geometric Asian call (Kemna & Vorst 1990)
    sigma_g = sigma * np.sqrt((2*n_steps + 1) / (6*(n_steps + 1)))
    b       = 0.5 * (r - 0.5*sigma**2 + sigma_g**2)
    d1 = (np.log(S0/K) + (b + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g*np.sqrt(T)
    cf_geom = disc * (S0*np.exp((b-r)*T)*norm.cdf(d1) - K*norm.cdf(d2))

    # Optimal control variate coefficient
    cov_mat = np.cov(arith_pay, geom_pay)
    c_star  = -cov_mat[0, 1] / cov_mat[1, 1]

    # CV estimator: shift arithmetic mean by correlation with geometric
    cv_pay  = arith_pay + c_star * (geom_pay - geom_pay.mean())
    cv_price = disc * (cv_pay.mean() + c_star * (cf_geom/disc - geom_pay.mean()))

    crude_se = disc * arith_pay.std() / np.sqrt(n_paths)
    cv_se    = disc * cv_pay.std()    / np.sqrt(n_paths)

    return disc*arith_pay.mean(), crude_se, cv_price, cv_se, cf_geom

crude, crude_se, cv, cv_se, cf_geom = asian_option_cv(100, 100, 1, 0.05, 0.20)
print(f"Geometric Asian (closed form): {cf_geom:.4f}")
print(f"Crude MC:    {crude:.4f}  SE={crude_se:.5f}")
print(f"Control CV:  {cv:.4f}  SE={cv_se:.5f}")
print(f"Variance reduction: {(crude_se/cv_se)**2:.1f}x")`,
    explanation:
      "The control variate technique exploits the high correlation between arithmetic and geometric Asian payoffs — the geometric price has a closed-form solution so its known expectation anchors the simulation and reduces standard error by 5–20x, cutting required paths by the same factor.",
  },
  {
    id: "pyfin-20260519-b1-ledoit-wolf",
    language: "python",
    title: "Ledoit-Wolf shrinkage vs sample covariance",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize
from sklearn.covariance import LedoitWolf, EmpiricalCovariance

rng = np.random.default_rng(19)

# High-dimensional regime: many assets, few observations (p/n ~ 0.5)
n_obs, n_assets = 60, 30
true_cov = np.eye(n_assets) * 0.04   # true: diagonal

returns = rng.multivariate_normal(np.zeros(n_assets), true_cov, size=n_obs)

emp  = EmpiricalCovariance().fit(returns)
S    = emp.covariance_
lw   = LedoitWolf().fit(returns)
S_lw = lw.covariance_

def cond_num(M):
    ev = np.linalg.eigvalsh(M)
    return ev.max() / ev.min()

def frob_err(M, M_true):
    return np.linalg.norm(M - M_true, "fro")

print(f"Sample cov condition number:  {cond_num(S):>10.1f}")
print(f"Ledoit-Wolf condition number: {cond_num(S_lw):>10.1f}")
print(f"Sample cov Frobenius error:   {frob_err(S, true_cov):.4f}")
print(f"LW cov Frobenius error:       {frob_err(S_lw, true_cov):.4f}")
print(f"LW shrinkage intensity:       {lw.shrinkage_:.4f}")

# Impact on min-vol portfolio
w0  = np.ones(n_assets) / n_assets
con = {"type": "eq", "fun": lambda w: w.sum() - 1}
bnd = [(0, 1)] * n_assets
w_s = minimize(lambda w: w @ S    @ w, w0, method="SLSQP", constraints=con, bounds=bnd).x
w_l = minimize(lambda w: w @ S_lw @ w, w0, method="SLSQP", constraints=con, bounds=bnd).x
print(f"\\nOut-of-sample variance — sample:     {w_s @ true_cov @ w_s:.5f}")
print(f"Out-of-sample variance — LW:          {w_l @ true_cov @ w_l:.5f}")`,
    explanation:
      "When n_obs < n_assets the sample covariance is ill-conditioned and mean-variance optimisation concentrates wildly in estimation noise; Ledoit-Wolf analytically computes the optimal shrinkage intensity toward a structured target, dramatically reducing condition number and out-of-sample portfolio variance.",
  },
  {
    id: "pyfin-20260519-b1-black-litterman",
    language: "python",
    title: "Black-Litterman posterior return estimation",
    tag: "finance",
    code: `import numpy as np

assets = ["US Eq", "Intl Eq", "Bonds", "EM Eq"]
n = 4
w_mkt = np.array([0.45, 0.25, 0.20, 0.10])

sigma = np.array([0.16, 0.18, 0.06, 0.22])
corr  = np.array([[1.00, 0.75, 0.10, 0.65],
                  [0.75, 1.00, 0.05, 0.72],
                  [0.10, 0.05, 1.00, 0.02],
                  [0.65, 0.72, 0.02, 1.00]])
Sigma = np.outer(sigma, sigma) * corr

# CAPM equilibrium: Pi = delta * Sigma * w_mkt
delta = 2.5
Pi = delta * Sigma @ w_mkt
print("CAPM equilibrium returns:")
for a, p in zip(assets, Pi):
    print(f"  {a:>8}: {p:.4f}")

# Investor views: P (k x n), Q (k,), Omega (k x k)
P = np.array([[0, -1, 0,  1],   # EM outperforms Intl by 2%
              [0,  0, 1,  0]])   # Bonds return 3%
Q = np.array([0.02, 0.03])
tau = 0.05

# View uncertainty proportional to prior covariance
Omega = np.diag([tau * (P[i] @ Sigma @ P[i]) for i in range(len(Q))])

# BL posterior: (tauSigma)^-1 and (P'Omega^-1 P) combined
tauSigma = tau * Sigma
M  = np.linalg.inv(np.linalg.inv(tauSigma) + P.T @ np.linalg.inv(Omega) @ P)
mu_bl = M @ (np.linalg.inv(tauSigma) @ Pi + P.T @ np.linalg.inv(Omega) @ Q)

print("\\nBL posterior returns:")
for a, pi, bl in zip(assets, Pi, mu_bl):
    print(f"  {a:>8}: prior={pi:.4f}  posterior={bl:.4f}  shift={bl-pi:+.4f}")`,
    explanation:
      "Black-Litterman blends market-implied equilibrium returns with subjective views through Bayesian updating — unlike direct mean-variance on historical returns, BL posterior returns are shrunk toward equilibrium, producing diversified portfolios that don't over-concentrate in whatever the views happen to favour most strongly.",
  },
  {
    id: "pyfin-20260519-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss optimal liquidation schedule",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

# Almgren-Chriss (2001) optimal execution
X     = 1_000_000   # total shares to sell
T     = 10           # trading periods
sigma = 0.02         # daily vol
eta   = 2.5e-7       # temporary impact coefficient
gamma = 1.0e-7       # permanent impact coefficient
lam   = 1e-6         # risk aversion

# kappa^2 = lam * sigma^2 / eta
kappa = np.sqrt(lam * sigma**2 / eta)
print(f"kappa (urgency): {kappa:.6f}")

# Optimal remaining inventory: x(t) = X * sinh(kappa*(T-t)) / sinh(kappa*T)
t_arr  = np.arange(0, T + 1)
x_opt  = X * np.sinh(kappa * (T - t_arr)) / np.sinh(kappa * T)
n_opt  = -np.diff(x_opt)   # shares sold each period

n_twap = np.full(T, X / T)

df = pd.DataFrame({
    "period":      np.arange(1, T+1),
    "TWAP sell":   n_twap.astype(int),
    "AC sell":     n_opt.astype(int),
    "AC cum sold": np.cumsum(n_opt).astype(int),
})
print("\\nOptimal AC schedule vs TWAP:")
print(df.to_string(index=False))

print(f"\\nAC temp. impact cost:   {eta*np.sum(n_opt**2):,.0f}")
print(f"TWAP temp. impact cost: {eta*np.sum(n_twap**2):,.0f}")`,
    explanation:
      "The Almgren-Chriss framework shows optimal execution follows a hyperbolic-sine trajectory — front-loaded relative to TWAP when risk aversion is high, reducing market risk at the cost of higher trading speed and therefore higher temporary impact; the kappa parameter encodes the urgency of execution.",
  },
  {
    id: "pyfin-20260519-b1-gaussian-copula",
    language: "python",
    title: "Gaussian copula default time simulation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

rng = np.random.default_rng(23)

n_obligors   = 5
rho          = 0.30        # pairwise asset correlation
n_sims       = 200_000
T_horizon    = 5.0

# Individual 5-year default probabilities
default_probs = np.array([0.02, 0.03, 0.015, 0.04, 0.025])
hazard_rates  = -np.log(1 - default_probs) / T_horizon

# Step 1: Correlated standard normals (one-factor model)
M = rng.standard_normal((n_sims, 1))                # systematic factor
Z = rng.standard_normal((n_sims, n_obligors))       # idiosyncratic
X = np.sqrt(rho)*M + np.sqrt(1 - rho)*Z

# Step 2: Map to uniform via Gaussian CDF
U = norm.cdf(X)

# Step 3: Map to default times via inverse exponential CDF
default_times = -np.log(1 - U) / hazard_rates[None, :]

# Step 4: Count defaults within horizon
defaulted  = default_times <= T_horizon
n_defaults = defaulted.sum(axis=1)

print(f"Portfolio: {n_obligors} obligors, rho={rho}")
print(f"Individual 5Y default probs: {default_probs}")
print("\\nDefault count distribution:")
for k in range(n_obligors + 1):
    print(f"  {k} defaults: {(n_defaults == k).mean():.4f}")
print(f"\\nMean: {n_defaults.mean():.3f}  Std: {n_defaults.std():.3f}")
print(f"P(>=3 defaults): {(n_defaults >= 3).mean():.5f}")`,
    explanation:
      "The Gaussian copula separates marginal default probabilities (from CDS spreads) from dependence structure (rho); the 2008 crisis revealed that a single scalar correlation massively underestimates joint tail risk — correlated defaults cluster far more severely than the Gaussian copula predicts.",
  },
  {
    id: "pyfin-20260519-b1-gpd-tail",
    language: "python",
    title: "Peaks-over-threshold EVT / GPD tail fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto, norm, t as student_t

rng = np.random.default_rng(29)

# Fat-tailed losses (Student-t df=4)
n = 5000
raw = student_t.rvs(df=4, size=n, random_state=rng)
losses = -raw[raw < 0]   # positive loss values only

# Threshold at 95th percentile
u        = np.quantile(losses, 0.95)
excesses = losses[losses > u] - u
n_exceed = len(excesses)
print(f"Threshold u (95th pct): {u:.4f}")
print(f"Exceedances: {n_exceed}  ({n_exceed/n*100:.1f}% of data)")

# Fit GPD to excesses
xi_hat, _, sigma_hat = genpareto.fit(excesses, floc=0)
print(f"GPD xi (shape):    {xi_hat:.4f}  (>0 = heavy tail)")
print(f"GPD sigma (scale): {sigma_hat:.4f}")

# Tail VaR and ES at 99.9%
p = 0.999
var_gpd = u + (sigma_hat/xi_hat) * ((n/n_exceed*(1-p))**(-xi_hat) - 1)
es_gpd  = (var_gpd + sigma_hat - xi_hat*u) / (1 - xi_hat)
var_gauss = norm.ppf(p) * losses.std() + losses.mean()

print(f"\\nAt {p*100:.1f}% confidence:")
print(f"  GPD VaR:       {var_gpd:.4f}")
print(f"  GPD ES:        {es_gpd:.4f}")
print(f"  Gaussian VaR:  {var_gauss:.4f}  (understates tail)")
print(f"  Historical VaR: {np.quantile(losses, p):.4f}")`,
    explanation:
      "Peaks-over-threshold with a Generalised Pareto fit is the EVT gold standard for tail risk: shape xi > 0 confirms a heavy power-law tail, and the GPD VaR at 99.9% is typically 30–100% larger than the Gaussian estimate — the gap that matters most for stress scenarios and regulatory capital.",
  },
  {
    id: "pyfin-20260519-b1-garman-klass",
    language: "python",
    title: "Garman-Klass OHLC realized volatility estimator",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(31)

def simulate_ohlc(n_days=252, mu=0.0003, sigma_true=0.015):
    n_ticks = 390    # minute bars per day
    dt = 1 / n_ticks
    records = []
    S = 100.0
    for _ in range(n_days):
        increments = ((mu - 0.5*sigma_true**2)*dt
                      + sigma_true*np.sqrt(dt)*rng.standard_normal(n_ticks))
        path = S * np.exp(np.cumsum(increments))
        path = np.concatenate([[S], path])
        records.append({
            "open": path[0], "high": path.max(),
            "low":  path.min(), "close": path[-1]
        })
        S = path[-1]
    return pd.DataFrame(records)

df = simulate_ohlc(sigma_true=0.015)
o, h, l, c = df["open"], df["high"], df["low"], df["close"]

u   = np.log(h / o)   # high-to-open log ratio
d   = np.log(l / o)   # low-to-open log ratio
c_r = np.log(c / o)   # close-to-open log return

# Garman-Klass (1980) estimator
gk     = 0.5*(u - d)**2 - (2*np.log(2) - 1)*c_r**2
gk_vol = np.sqrt(gk.mean() * 252)

# Close-to-close benchmark
cc_ret = np.log(df["close"] / df["close"].shift(1)).dropna()
cc_vol = cc_ret.std() * np.sqrt(252)

print(f"True annual vol:    {0.015 * np.sqrt(252):.4f}")
print(f"Close-to-close vol: {cc_vol:.4f}")
print(f"Garman-Klass vol:   {gk_vol:.4f}")
print(f"Relative efficiency (CC/GK std ratio): {cc_vol/gk_vol:.3f}")`,
    explanation:
      "Garman-Klass uses the full OHLC range as a sufficient statistic for GBM diffusion, reducing vol estimator standard error by roughly 5x compared to close-to-close — meaning GK achieves the same accuracy from one week of data that close-to-close needs a month to match.",
  },
];
